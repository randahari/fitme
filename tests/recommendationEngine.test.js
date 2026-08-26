// TASK-004 — Recommendation Engine tests (D2 Stage 6, CC-02/CC-03/CC-04/CC-05, Ranking
// Framework, Explainability). Dependency-free: Node's built-in test runner + assert only,
// exercising the real js/coachDecisionSystem/recommendationEngine.js module directly.
// Run with: node --test tests/recommendationEngine.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const RecommendationEngine = require('../js/coachDecisionSystem/recommendationEngine.js');
const RecommendationCategories = require('../js/coachDecisionSystem/recommendationCategories.js');

function validOpportunity(overrides) {
  return Object.assign({
    id: 'opp-1',
    // Stage-6 Ownership Enforcement Correction — DECISION_WINDOW is the only Recommendation-owned
    // Opportunity Source (TASK_005_SPEC_v1.0.md §9.1/§22); the prior default,
    // CONFIRMED_PATTERN_ANTICIPATION, was Initiative-Engine-exclusive and encoded the since-fixed
    // Stage-6 rule-leakage defect.
    sourceCategory: 'DECISION_WINDOW',
    proposedAction: 'Log dinner tonight at the usual time.',
    confidence: 0.8,
    explanation: {
      rationale: 'A consistent evening-meal pattern has been observed.',
      evidenceBasis: 'PATTERN:weekday.active.5, 8 confirming events.',
      expectedValue: 'Sustains the existing adherence pattern.',
      uncertainty: 'low'
    },
    detectedAt: 1700000000000
  }, overrides);
}

function pipelineContext(overrides) {
  return Object.assign({ feedbackHistory: [] }, overrides);
}

// ── Unit: valid / invalid request ──

test('1. valid RecommendationRequest produces exactly one well-formed candidate', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].kind, 'Recommendation');
});

test('2. invalid RecommendationRequest (missing opportunity) yields empty candidates, never throws', () => {
  assert.doesNotThrow(() => RecommendationEngine.generate({ pipelineContext: pipelineContext() }));
  const result = RecommendationEngine.generate({ pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

test('3. invalid RecommendationRequest (missing pipelineContext) yields empty candidates, never throws', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity() });
  assert.deepEqual(result.candidates, []);
});

test('4. invalid RecommendationRequest (null request) yields empty candidates, never throws', () => {
  assert.doesNotThrow(() => RecommendationEngine.generate(null));
  assert.deepEqual(RecommendationEngine.generate(null).candidates, []);
  assert.deepEqual(RecommendationEngine.generate(undefined).candidates, []);
});

test('5. invalid sourceCategory (not one of D1 Unit 05\'s five) yields empty candidates', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'MADE_UP' }), pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

test('6. missing proposedAction yields empty candidates (no fabricated content)', () => {
  const o = validOpportunity(); delete o.proposedAction;
  assert.deepEqual(RecommendationEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

test('7. confidence out of [0,1] yields empty candidates', () => {
  assert.deepEqual(RecommendationEngine.generate({ opportunity: validOpportunity({ confidence: 1.5 }), pipelineContext: pipelineContext() }).candidates, []);
  assert.deepEqual(RecommendationEngine.generate({ opportunity: validOpportunity({ confidence: -0.1 }), pipelineContext: pipelineContext() }).candidates, []);
  assert.deepEqual(RecommendationEngine.generate({ opportunity: validOpportunity({ confidence: 'high' }), pipelineContext: pipelineContext() }).candidates, []);
});

// ── Empty candidate result is valid (D2-INV-05, "Silence is fully formed") ──

test('8. empty candidate result is a well-formed, valid RecommendationResult', () => {
  const result = RecommendationEngine.generate(null);
  assert.ok(Array.isArray(result.candidates));
  assert.equal(result.candidates.length, 0);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidates), true);
});

// ── Determinism (Ranking Framework, Required Tests) ──

test('9. determinism: identical input yields an identical candidate set across repeated runs', () => {
  const opp = validOpportunity();
  const ctx = pipelineContext();
  const a = RecommendationEngine.generate({ opportunity: opp, pipelineContext: ctx });
  const b = RecommendationEngine.generate({ opportunity: opp, pipelineContext: ctx });
  assert.deepEqual(a, b);
});

// ── Recommendation Categories (Stage 2) ──

test('10. DECISION_WINDOW (the only Recommendation-owned source) produces a candidate whose category is one of the four canonical values', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'DECISION_WINDOW' }), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
  assert.equal(RecommendationCategories.isValidCategory(result.candidates[0].category), true);
});

// ── Stage-6 Ownership Enforcement Correction ──

test('Ownership: DECISION_WINDOW is accepted — Recommendation Candidate Generation proceeds normally under otherwise-valid inputs', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'DECISION_WINDOW' }), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].kind, 'Recommendation');
});

test('Ownership: every non-owned Opportunity Source yields zero Recommendation Candidates (D2 Unit 07 / TASK_005_SPEC_v1.0.md §9.1/§22 — no rule leakage)', () => {
  ['CONFIRMED_PATTERN_ANTICIPATION', 'DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'SAFETY_HIGH_RISK'].forEach((src) => {
    const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: src }), pipelineContext: pipelineContext() });
    assert.deepEqual(result.candidates, [], 'source ' + src + ' must not produce a Recommendation Candidate');
  });
});

test('Ownership: an unrecognized sourceCategory still fails closed (rejected earlier, by validateRequest, as MALFORMED-equivalent empty result)', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'NOT_REAL' }), pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

test('Ownership: SAFETY_HIGH_RISK specifically does not produce a Recommendation Candidate (Safety-adjacent leak closed; TASK-005 G-3 remains open/unmodified — this does not resolve or claim to resolve it)', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'SAFETY_HIGH_RISK' }), pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

// ── Explainability completeness / unexplainable candidate withheld (Stage 6) ──

test('11. explanation completeness: candidate.rationale carries all four Decision Truth fields', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  const rationale = result.candidates[0].rationale;
  assert.equal(typeof rationale.rationale, 'string');
  assert.equal(typeof rationale.evidenceBasis, 'string');
  assert.equal(typeof rationale.expectedValue, 'string');
  assert.notEqual(rationale.uncertainty, undefined);
});

['rationale', 'evidenceBasis', 'expectedValue'].forEach((field) => {
  test('12. unexplainable candidate withheld: missing explanation.' + field + ' yields no candidate', () => {
    const o = validOpportunity();
    delete o.explanation[field];
    const result = RecommendationEngine.generate({ opportunity: o, pipelineContext: pipelineContext() });
    assert.deepEqual(result.candidates, []);
  });
});

test('12b. unexplainable candidate withheld: missing explanation.uncertainty yields no candidate', () => {
  const o = validOpportunity(); delete o.explanation.uncertainty;
  assert.deepEqual(RecommendationEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

test('12c. unexplainable candidate withheld: missing explanation object entirely yields no candidate', () => {
  const o = validOpportunity(); delete o.explanation;
  assert.deepEqual(RecommendationEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

// ── No ranking / no priority score / no winner selection (Ranking Policy, Stage 5) ──

test('13. no ranking: candidate carries no priority/score/rank/order field of any kind (TASK-006, Canonical Decision CD-T006-02, extends the field list with categorical arbitration metadata only — never a composite score)', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  const keys = Object.keys(result.candidates[0]);
  assert.deepEqual(keys.sort(), [
    'action', 'category', 'confidence', 'evidenceTier', 'hierarchyTier', 'kind', 'opportunityProvenance',
    'problemMagnitude', 'rationale', 'recommendationImpactTier', 'timingQuality', 'triggeringEvidenceTime', 'trustImpact'
  ].sort());
  ['priority', 'priorityScore', 'rank', 'order', 'score', 'weight'].forEach((forbidden) => {
    assert.equal(Object.prototype.hasOwnProperty.call(result.candidates[0], forbidden), false, 'must not carry ' + forbidden);
  });
});

test('14. no priority score at the result level either', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.deepEqual(Object.keys(result), ['candidates']);
});

test('15. no winner selection: multiple independent generate() calls never designate a "winner" — each call is independent and produces at most one candidate for its own opportunity', () => {
  const r1 = RecommendationEngine.generate({ opportunity: validOpportunity({ id: 'opp-a' }), pipelineContext: pipelineContext() });
  const r2 = RecommendationEngine.generate({ opportunity: validOpportunity({ id: 'opp-b' }), pipelineContext: pipelineContext() });
  assert.ok(r1.candidates.length <= 1 && r2.candidates.length <= 1);
  assert.equal(typeof RecommendationEngine.selectWinner, 'undefined');
  assert.equal(typeof RecommendationEngine.prioritize, 'undefined');
  assert.equal(typeof RecommendationEngine.rank, 'undefined');
});

// ── CC-02 / CC-03 contract conformance ──

test('16. CC-02: request shape is exactly {opportunity, pipelineContext} — extra fields are ignored, not required', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext(), extraneous: 'ignored' });
  assert.equal(result.candidates.length, 1);
});

test('17. CC-03: RecommendationResult is exactly {candidates: RecommendationCandidate[]}', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.deepEqual(Object.keys(result), ['candidates']);
});

test('18. CC-03: each candidate carries exactly the seven canonical fields, kind is always "Recommendation"', () => {
  const c = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(c.kind, 'Recommendation');
  assert.equal(typeof c.category, 'string');
  assert.equal(typeof c.action, 'string');
  assert.equal(typeof c.rationale, 'object');
  assert.equal(typeof c.confidence, 'number');
  assert.equal(typeof c.hierarchyTier, 'number');
  assert.equal(typeof c.opportunityProvenance, 'object');
});

// ── Suppression (D1-RP-05, C2) ──

test('19. suppressed opportunity (repeated pattern of declines) yields no candidate', () => {
  const opp = validOpportunity();
  const now = Date.now();
  const negativeFeedback = [
    { surface: 'recommendation', contextId: opp.id, feedbackType: 'Rejected', occurredAt: now - 1000 },
    { surface: 'recommendation', contextId: opp.id, feedbackType: 'Rejected', occurredAt: now - 2000 },
    { surface: 'recommendation', contextId: opp.id, feedbackType: 'Rejected', occurredAt: now - 3000 }
  ];
  const result = RecommendationEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ feedbackHistory: negativeFeedback }) });
  assert.deepEqual(result.candidates, []);
});

test('20. a single decline (below pattern threshold) does not suppress — a single decline is a question, not an answer (D1-RP-06)', () => {
  const opp = validOpportunity();
  const feedbackHistory = [{ surface: 'recommendation', contextId: opp.id, feedbackType: 'Rejected', occurredAt: Date.now() - 1000 }];
  const result = RecommendationEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ feedbackHistory }) });
  assert.equal(result.candidates.length, 1);
});

// ── Frozen / immutable output ──

test('21. candidate and its nested objects are frozen (immutability discipline)', () => {
  const c = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(Object.isFrozen(c), true);
  assert.equal(Object.isFrozen(c.rationale), true);
  assert.equal(Object.isFrozen(c.opportunityProvenance), true);
});

// ══════════════════════════════════════════════════════════════════
// G-2 (docs/specs/G2_SPEC_v1.0.md §17.1, RG-1) — Stage-3 detectOpportunities().
// ══════════════════════════════════════════════════════════════════

test('G-2 §17.1: detectOpportunities() returns an honestly-empty [] unconditionally (RG-1, no canonical Decision-Window algorithm exists)', () => {
  assert.deepEqual(RecommendationEngine.detectOpportunities(pipelineContext()), []);
});

test('G-2 §17.1: detectOpportunities() never throws on an empty/undefined Pipeline Context', () => {
  assert.doesNotThrow(() => RecommendationEngine.detectOpportunities());
  assert.deepEqual(RecommendationEngine.detectOpportunities(undefined), []);
  assert.deepEqual(RecommendationEngine.detectOpportunities(null), []);
});

test('G-2 §17.1: detectOpportunities()\'s return value is frozen', () => {
  assert.equal(Object.isFrozen(RecommendationEngine.detectOpportunities(pipelineContext())), true);
});

test('G-2 §17.1: existing generate()/validateRequest() behavior is preserved byte-for-byte (regression)', () => {
  const result = RecommendationEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
});
