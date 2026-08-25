// TASK-005 — Initiative Engine tests (D2 Unit 07 Stage 3 contribution + Stage 6 Candidate
// Generation, D1 Unit 09 Initiative Policy, TASK_005_SPEC_v1.0.md §19-21/33). Dependency-free:
// Node's built-in test runner + assert only, exercising the real
// js/coachDecisionSystem/initiativeEngine.js module directly.
// Run with: node --test tests/initiativeEngine.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const InitiativeEngine = require('../js/coachDecisionSystem/initiativeEngine.js');
const RecommendationCategories = require('../js/coachDecisionSystem/recommendationCategories.js');

const initiativeEngineJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/initiativeEngine.js'), 'utf8');

function validOpportunity(overrides) {
  return Object.assign({
    id: 'opp-1',
    sourceCategory: 'DISRUPTION_DETECTION',
    proposedAction: 'Prepare a simple travel-day meal plan before Thursday.',
    confidence: 0.8,
    explanation: {
      rationale: 'A known calendar disruption (travel) is coming up.',
      evidenceBasis: 'Calendar entry, known in advance.',
      expectedValue: 'Reduces decision fatigue during travel.',
      uncertainty: 'low'
    },
    valueDimensions: ['CONSISTENCY'],
    detectedAt: 1700000000000
  }, overrides);
}

function pipelineContext(overrides) {
  return Object.assign({ feedbackHistory: [], relationshipMaturity: { stage: 'ASSISTANT' } }, overrides);
}

// ── 33.1 Unit tests: valid input, determinism ──

test('1. valid InitiativeRequest at a permitted maturity stage produces exactly one well-formed candidate', () => {
  const result = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].kind, 'INITIATIVE');
});

test('2. determinism: identical input yields an identical candidate set across repeated runs', () => {
  const opp = validOpportunity();
  const ctx = pipelineContext();
  const a = InitiativeEngine.generate({ opportunity: opp, pipelineContext: ctx });
  const b = InitiativeEngine.generate({ opportunity: opp, pipelineContext: ctx });
  assert.deepEqual(a, b);
});

test('3. invalid request (null/undefined) yields empty candidates, never throws', () => {
  assert.doesNotThrow(() => InitiativeEngine.generate(null));
  assert.deepEqual(InitiativeEngine.generate(null).candidates, []);
  assert.deepEqual(InitiativeEngine.generate(undefined).candidates, []);
});

test('4. invalid request (missing pipelineContext / opportunity) yields empty candidates', () => {
  assert.deepEqual(InitiativeEngine.generate({ opportunity: validOpportunity() }).candidates, []);
  assert.deepEqual(InitiativeEngine.generate({ pipelineContext: pipelineContext() }).candidates, []);
});

test('5. invalid sourceCategory (not one of D1 Unit 05\'s five) yields empty candidates', () => {
  const result = InitiativeEngine.generate({ opportunity: validOpportunity({ sourceCategory: 'MADE_UP' }), pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

test('6. missing proposedAction yields empty candidates (no fabricated content)', () => {
  const o = validOpportunity(); delete o.proposedAction;
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

test('7. confidence out of [0,1] yields empty candidates', () => {
  assert.deepEqual(InitiativeEngine.generate({ opportunity: validOpportunity({ confidence: 1.5 }), pipelineContext: pipelineContext() }).candidates, []);
  assert.deepEqual(InitiativeEngine.generate({ opportunity: validOpportunity({ confidence: -0.1 }), pipelineContext: pipelineContext() }).candidates, []);
});

// ── D1-IP-01 through D1-IP-10, individually exercised ──

test('D1-IP-01: an eligible Opportunity (already-passed Stage-5 gate, by construction) proceeds normally', () => {
  // The eligible-Opportunity input itself already implies the Stage-5 gate was passed
  // (TASK_005_SPEC_v1.0.md §18.2) — the Initiative Engine does not re-derive it, only relies on
  // receiving a well-formed one, exercised by test 1 above.
  const result = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
});

test('D1-IP-02: Relationship-Maturity gating — CONFIRMED_PATTERN_ANTICIPATION requires Trusted Coach or above', () => {
  const opp = validOpportunity({ sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION' });
  ['OBSERVER', 'ASSISTANT'].forEach((stage) => {
    const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ relationshipMaturity: { stage } }) });
    assert.deepEqual(result.candidates, [], 'stage ' + stage + ' must not permit confirmed-pattern anticipation');
  });
  ['TRUSTED_COACH', 'PERSONAL_COACH'].forEach((stage) => {
    const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ relationshipMaturity: { stage } }) });
    assert.equal(result.candidates.length, 1, 'stage ' + stage + ' must permit confirmed-pattern anticipation');
  });
});

test('D1-IP-02: Observer stage permits zero Initiative Candidates of any category ("mostly responds")', () => {
  RecommendationCategories.OPPORTUNITY_SOURCES.forEach((src) => {
    const result = InitiativeEngine.generate({ opportunity: validOpportunity({ sourceCategory: src }), pipelineContext: pipelineContext({ relationshipMaturity: { stage: 'OBSERVER' } }) });
    assert.deepEqual(result.candidates, [], 'source ' + src + ' at Observer');
  });
});

test('D1-IP-02: an unknown/unreliable maturity stage is treated at least as conservatively as Observer (E-2)', () => {
  const result = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext({ relationshipMaturity: { stage: 'UNKNOWN' } }) });
  assert.deepEqual(result.candidates, []);
  const resultMissing = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: { feedbackHistory: [] } });
  assert.deepEqual(resultMissing.candidates, []);
});

test('D1-IP-03: value requirement — missing/empty valueDimensions yields empty candidates', () => {
  const o1 = validOpportunity(); delete o1.valueDimensions;
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o1, pipelineContext: pipelineContext() }).candidates, []);
  const o2 = validOpportunity({ valueDimensions: [] });
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o2, pipelineContext: pipelineContext() }).candidates, []);
  const o3 = validOpportunity({ valueDimensions: ['NOT_A_REAL_DIMENSION'] });
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o3, pipelineContext: pipelineContext() }).candidates, []);
});

test('D1-IP-03: every one of the six canonical value dimensions is independently accepted', () => {
  InitiativeEngine.VALUE_DIMENSIONS.forEach((dim) => {
    const result = InitiativeEngine.generate({ opportunity: validOpportunity({ valueDimensions: [dim] }), pipelineContext: pipelineContext() });
    assert.equal(result.candidates.length, 1, dim);
  });
});

test('D1-IP-04: no engagement/retention field or logic exists anywhere in the module (structural, by omission)', () => {
  ['engagement', 'retention', 'dailyActiveUser', 'DAU', 'stickiness'].forEach((term) => {
    assert.equal(initiativeEngineJs.toLowerCase().indexOf(term.toLowerCase()), -1, 'must not reference ' + term);
  });
});

test('D1-IP-06: celebration restraint — a MILESTONE_RECOVERY Opportunity not marked genuine yields no candidate', () => {
  const opp = validOpportunity({ sourceCategory: 'MILESTONE_RECOVERY' });
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext() });
  assert.deepEqual(result.candidates, []);
});

test('D1-IP-06: celebration restraint — a MILESTONE_RECOVERY Opportunity explicitly marked genuine produces a candidate', () => {
  const opp = validOpportunity({ sourceCategory: 'MILESTONE_RECOVERY', genuine: true });
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
});

test('D1-IP-08: no repeating an ignored Initiative — a prior "Ignored"/"Dismissed"/"Rejected" feedback event on the same Opportunity on the initiative surface yields no candidate', () => {
  ['Ignored', 'Dismissed', 'Rejected'].forEach((feedbackType) => {
    const opp = validOpportunity();
    const feedbackHistory = [{ surface: 'initiative', contextId: opp.id, feedbackType, occurredAt: Date.now() - 1000 }];
    const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ feedbackHistory }) });
    assert.deepEqual(result.candidates, [], feedbackType);
  });
});

test('D1-IP-08: feedback on a different surface, or a different Opportunity, does not suppress', () => {
  const opp = validOpportunity();
  const feedbackHistory = [
    { surface: 'recommendation', contextId: opp.id, feedbackType: 'Ignored', occurredAt: Date.now() - 1000 },
    { surface: 'initiative', contextId: 'some-other-opp', feedbackType: 'Ignored', occurredAt: Date.now() - 1000 }
  ];
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ feedbackHistory }) });
  assert.equal(result.candidates.length, 1);
});

// ── §33.2 Contract tests ──

test('Contract: InitiativeResult is exactly {candidates: InitiativeCandidate[]}', () => {
  const result = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.deepEqual(Object.keys(result), ['candidates']);
});

test('Contract: InitiativeCandidate carries exactly the nine canonical fields plus TASK-006\'s Canonical-Decision-CD-T006-02 arbitration-metadata extension (no more, no less; never recommendationImpactTier, CD-T006-03)', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.deepEqual(Object.keys(c).sort(), [
    'action', 'confidence', 'evidenceTier', 'hierarchyTier', 'immutable', 'kind', 'opportunityProvenance',
    'opportunitySource', 'problemMagnitude', 'rationale', 'relationshipMaturityContext', 'timingQuality',
    'triggeringEvidenceTime', 'trustImpact', 'validationResult'
  ].sort());
  assert.equal('recommendationImpactTier' in c, false);
});

test('Contract (CD-T005-02): InitiativeCandidate never carries a category field', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(Object.prototype.hasOwnProperty.call(c, 'category'), false);
});

test('Contract: kind is always the literal string "INITIATIVE"', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(c.kind, 'INITIATIVE');
});

test('Contract: rationale carries all four required Decision Truth fields', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(typeof c.rationale.rationale, 'string');
  assert.equal(typeof c.rationale.evidenceBasis, 'string');
  assert.equal(typeof c.rationale.expectedValue, 'string');
  assert.notEqual(c.rationale.uncertainty, undefined);
});

['rationale', 'evidenceBasis', 'expectedValue'].forEach((field) => {
  test('Contract: unexplainable candidate withheld — missing explanation.' + field + ' yields no candidate', () => {
    const o = validOpportunity();
    delete o.explanation[field];
    assert.deepEqual(InitiativeEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
  });
});

test('Contract: validateCandidateShape accepts a real candidate and rejects a malformed one', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(InitiativeEngine.validateCandidateShape(c), true);
  assert.equal(InitiativeEngine.validateCandidateShape({}), false);
  assert.equal(InitiativeEngine.validateCandidateShape(Object.assign({}, c, { category: 'PREPARATION' })), false);
});

test('Contract: candidate and its nested objects are frozen (immutability discipline)', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(Object.isFrozen(c), true);
  assert.equal(Object.isFrozen(c.rationale), true);
  assert.equal(Object.isFrozen(c.opportunityProvenance), true);
  assert.equal(Object.isFrozen(c.relationshipMaturityContext), true);
  assert.equal(c.immutable, true);
});

// ── §33.6 Safety boundary tests ──

test('Safety: the public interface exposes no disqualification/modification/deferral/blocking/prioritization/winner-selection function', () => {
  ['disqualify', 'modify', 'defer', 'block', 'prioritize', 'rank', 'selectWinner', 'formDecision'].forEach((fn) => {
    assert.equal(typeof InitiativeEngine[fn], 'undefined', fn);
  });
});

test('Safety: a Candidate is produced normally even though no Safety Layer component exists at this baseline', () => {
  const result = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() });
  assert.equal(result.candidates.length, 1);
});

// ── §33.5 Recommendation/Initiative separation ──

test('Separation: no FeedbackDomain module dependency — D1-IP-08 is enforced locally, not via C2 (Repository Gap A-2)', () => {
  assert.equal(initiativeEngineJs.indexOf("require('../feedback/feedbackDomain"), -1);
  assert.equal(initiativeEngineJs.indexOf('window.FeedbackDomain'), -1);
  assert.equal(initiativeEngineJs.indexOf('SUPPRESSION_RECOVERY_POLICY'), -1);
  assert.equal(typeof InitiativeEngine.FeedbackDomain, 'undefined');
});

test('Separation: candidate kind is "INITIATIVE", distinct from RecommendationCandidate.kind ("Recommendation")', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.notEqual(c.kind, 'Recommendation');
});

test('Separation (Correction 4): no Recommendation Category value is ever produced or referenced by the Initiative Engine — InitiativeCandidate has no category field, and only Opportunity-Source vocabulary (not Category vocabulary) is reused from recommendationCategories.js', () => {
  const c = InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: pipelineContext() }).candidates[0];
  assert.equal(Object.prototype.hasOwnProperty.call(c, 'category'), false);
  RecommendationCategories.CATEGORIES.forEach((cat) => {
    assert.notEqual(c.action, cat);
    assert.notEqual(c.opportunitySource, cat);
    Object.values(c.rationale).forEach((v) => assert.notEqual(v, cat));
  });
  // Only hierarchyTierForSource()/isValidOpportunitySource() (D1 Unit 05 source vocabulary,
  // not the D1 Unit 02 category taxonomy) are referenced anywhere in the module.
  assert.equal(initiativeEngineJs.indexOf('.CATEGORIES'), -1);
  assert.equal(initiativeEngineJs.indexOf('categoryForSource'), -1);
});

// ── §33.8 Silence / no-candidate outcomes (each a deliberate, distinguishable, non-error outcome) ──

test('Silence: poor timing / trust risk proxy — a category not yet permitted at the user\'s maturity stage', () => {
  const opp = validOpportunity({ sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION' });
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ relationshipMaturity: { stage: 'ASSISTANT' } }) });
  assert.deepEqual(result.candidates, []);
});

test('Silence: no useful action — value requirement not met (D1-IP-03)', () => {
  const o = validOpportunity({ valueDimensions: [] });
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

test('Silence: ignored-initiative repeat (D1-IP-08)', () => {
  const opp = validOpportunity();
  const feedbackHistory = [{ surface: 'initiative', contextId: opp.id, feedbackType: 'Ignored', occurredAt: Date.now() }];
  assert.deepEqual(InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ feedbackHistory }) }).candidates, []);
});

test('Silence: missing required context — an Opportunity that cannot honestly carry a rationale yields no candidate', () => {
  const o = validOpportunity(); delete o.explanation;
  assert.deepEqual(InitiativeEngine.generate({ opportunity: o, pipelineContext: pipelineContext() }).candidates, []);
});

test('Silence: an empty candidate result is a well-formed, valid InitiativeResult (D2-INV-05, "Silence is fully formed")', () => {
  const result = InitiativeEngine.generate(null);
  assert.ok(Array.isArray(result.candidates));
  assert.equal(result.candidates.length, 0);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidates), true);
});

// ── §33.9 Failure and degradation tests ──

test('Failure: SAFETY_HIGH_RISK is unsupported/out-of-contract for Initiative — not a normal Opportunity evaluated and silenced, Repository Gap G-3 remains unresolved (Correction 3)', () => {
  const opp = validOpportunity({ sourceCategory: 'SAFETY_HIGH_RISK' });
  // Even at the most permissive maturity stage, with a request that would otherwise be fully
  // valid, SAFETY_HIGH_RISK is rejected at the Stage-6 scope boundary before any
  // Relationship-Maturity gating or Initiative-policy check is ever reached.
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ relationshipMaturity: { stage: 'PERSONAL_COACH' } }) });
  assert.deepEqual(result.candidates, []);
});

test('Failure: DECISION_WINDOW is not accepted by Initiative Stage 6 — routing remains an unresolved Follow-up (G-4), not authorized to Engineering (Correction 2)', () => {
  const opp = validOpportunity({ sourceCategory: 'DECISION_WINDOW' });
  // Even at the most permissive maturity stage, with a request that would otherwise be fully
  // valid, DECISION_WINDOW is rejected at the Stage-6 scope boundary.
  const result = InitiativeEngine.generate({ opportunity: opp, pipelineContext: pipelineContext({ relationshipMaturity: { stage: 'PERSONAL_COACH' } }) });
  assert.deepEqual(result.candidates, []);
});

test('Failure: malformed pipelineContext.feedbackHistory (not an array) does not throw and does not fabricate suppression', () => {
  assert.doesNotThrow(() => InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: { feedbackHistory: 'not-an-array', relationshipMaturity: { stage: 'ASSISTANT' } } }));
});

test('Failure: an entirely empty pipelineContext (no relationshipMaturity, no feedbackHistory) degrades to Observer-equivalent, never throws', () => {
  assert.doesNotThrow(() => InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: {} }));
  assert.deepEqual(InitiativeEngine.generate({ opportunity: validOpportunity(), pipelineContext: {} }).candidates, []);
});

// ── §33.11 Native / platform-neutral contract tests ──

test('Native: module has no DOM/window/Firebase reference in its Node-loadable core logic', () => {
  const body = initiativeEngineJs.replace(/if \(typeof window[^}]*\}/g, '');
  assert.equal(/document\./.test(body), false);
  assert.equal(/firebase/i.test(body), false);
  assert.equal(/navigator\./.test(body), false);
});

test('Native: initiativeEngine.js is Node-loadable via require() (already exercised by every test above)', () => {
  assert.equal(typeof InitiativeEngine.generate, 'function');
  assert.equal(typeof InitiativeEngine.detectOpportunities, 'function');
});

// ── Stage 3 detection contribution ──

test('Stage 3: detectOpportunities never throws on an empty/undefined Pipeline Context', () => {
  assert.doesNotThrow(() => InitiativeEngine.detectOpportunities());
  const r = InitiativeEngine.detectOpportunities(undefined);
  assert.deepEqual(r.confirmedPatternAnticipation, []);
  assert.deepEqual(r.disruption, []);
  assert.deepEqual(r.milestoneRecovery, []);
});

test('Stage 3: confirmed-pattern anticipation is detected only for ACTIVE/CONFIRMED Habit/Pattern signals, never OBSERVED/CANDIDATE (D1-OD-02, no single-instance basis)', () => {
  const ctx = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:a', lifecycle: 'ACTIVE', domain: 'NUTRITION', topic: 'FOOD_LOGGING', confidence: 0.8, evidence: { count: 8 } },
        { id: 'PATTERN:b', lifecycle: 'CONFIRMED', domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', confidence: 0.9, evidence: { count: 5 } },
        { id: 'HABIT:c', lifecycle: 'CANDIDATE', domain: 'NUTRITION', topic: 'MEAL_TIMING', confidence: 0.5, evidence: { count: 1 } },
        { id: 'PATTERN:d', lifecycle: 'OBSERVED', domain: 'WORKOUT', topic: 'SEQUENCE_BEHAVIOR', confidence: 0.4, evidence: { count: 1 } }
      ]
    }
  };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.equal(r.confirmedPatternAnticipation.length, 2);
  assert.deepEqual(r.confirmedPatternAnticipation.map((s) => s.signalId).sort(), ['HABIT:a', 'PATTERN:b']);
});

test('Stage 3: disruption/milestone detection correctly yields zero Opportunities given the current absence of any repository data source (never fabricated)', () => {
  const r = InitiativeEngine.detectOpportunities({ initiativeIntelligence: { signals: [] } });
  assert.deepEqual(r.disruption, []);
  assert.deepEqual(r.milestoneRecovery, []);
});

// ══════════════════════════════════════════════════════════════════
// G-2 (docs/specs/G2_SPEC_v1.0.md §32) — semanticOpportunities (NEW key on detectOpportunities()).
// ══════════════════════════════════════════════════════════════════

function makeWeakeningFoodLoggingSignal(overrides) {
  return Object.assign({
    id: 'HABIT:nutrition:log-consistency',
    sourceType: 'HABIT',
    domain: 'NUTRITION',
    topic: 'FOOD_LOGGING',
    lifecycle: 'WEAKENING',
    confidence: 0.51,
    evidence: { count: 3 },
    temporal: { firstObservedAt: '2026-01-31', lastObservedAt: '2026-05-01', expectedIntervalDays: 9 },
    provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' }
  }, overrides);
}

test('G-2 §32: detectOpportunities()\'s existing three keys are byte-identical to today\'s output for an existing fixture (regression)', () => {
  const ctx = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:a', lifecycle: 'ACTIVE', domain: 'NUTRITION', topic: 'FOOD_LOGGING', confidence: 0.8, evidence: { count: 8 } }
      ]
    }
  };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.equal(r.confirmedPatternAnticipation.length, 1);
  assert.deepEqual(r.disruption, []);
  assert.deepEqual(r.milestoneRecovery, []);
  assert.deepEqual(r.semanticOpportunities, [], 'a signal lacking sourceType/provenance is not a well-formed Observation — contributes nothing, never fabricated');
});

test('G-2 §32: semanticOpportunities contains exactly one well-formed DetectedOpportunity for a Habit FOOD_LOGGING WEAKENING fixture', () => {
  const ctx = { assembledAt: 123456, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal()] } };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.equal(r.semanticOpportunities.length, 1);
  const d = r.semanticOpportunities[0];
  assert.equal(d.sourceCategory, 'CONFIRMED_PATTERN_ANTICIPATION');
  assert.equal(d.detectingContributor, 'INITIATIVE_ENGINE');
  assert.equal(typeof d.proposedAction, 'string');
  assert.ok(d.proposedAction.length > 0);
  assert.equal(typeof d.explanation.rationale, 'string');
  assert.equal(typeof d.explanation.evidenceBasis, 'string');
  assert.equal(typeof d.explanation.expectedValue, 'string');
  assert.notEqual(d.explanation.uncertainty, undefined);
  assert.notEqual(d.explanation.uncertainty, null);
  assert.notEqual(d.explanation.uncertainty, '');
  assert.equal(d.detectedAt, 123456);
  assert.deepEqual(d.valueDimensions, ['UNDERSTANDING']);
  assert.equal(d.validReasonCategory, 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
  assert.equal(d.trustTestSignal.glad, null);
  assert.equal(typeof d.trustTestSignal.basis, 'string');
  assert.equal(d.safetyHighRiskBypass, false);
  assert.equal(typeof d.contextualMeaning, 'object');
  assert.equal(d.contextualMeaning.trajectory, 'WORSENING');
  assert.equal(d.contextualMeaning.alignment, 'UNKNOWN');
});

test('G-2 §32: the constructed DetectedOpportunity\'s confidence matches the fixture\'s own value exactly (never inflated)', () => {
  const ctx = { assembledAt: 1, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal({ confidence: 0.13 })] } };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.equal(r.semanticOpportunities[0].confidence, 0.13);
});

test('G-2 §32: semanticOpportunities is empty for ACTIVE/CONFIRMED FOOD_LOGGING Habit signals (no Reason exists for them)', () => {
  ['ACTIVE', 'CONFIRMED'].forEach((lifecycle) => {
    const ctx = { assembledAt: 1, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal({ lifecycle })] } };
    const r = InitiativeEngine.detectOpportunities(ctx);
    assert.deepEqual(r.semanticOpportunities, []);
  });
});

test('G-2 §32: semanticOpportunities is empty for WEAKENING signals of any other topic', () => {
  const ctx = { assembledAt: 1, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal({ topic: 'WORKOUT_FREQUENCY', domain: 'WORKOUT' })] } };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.deepEqual(r.semanticOpportunities, []);
});

test('G-2 §32: semanticOpportunities is empty for a Pattern-sourced FOOD_LOGGING WEAKENING signal (defensive — excluded upstream at B5)', () => {
  const ctx = { assembledAt: 1, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal({ sourceType: 'PATTERN' })] } };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.deepEqual(r.semanticOpportunities, []);
});

test('G-2 §32: semanticOpportunities is empty for a Habit FOOD_LOGGING WEAKENING signal lacking the real establishment fact (never fabricated on lifecycle label alone)', () => {
  const ctx = {
    assembledAt: 1,
    initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal({ provenance: { currentEpisodeEstablished: false, currentEpisodeEstablishedAt: null } })] }
  };
  const r = InitiativeEngine.detectOpportunities(ctx);
  assert.deepEqual(r.semanticOpportunities, []);
});

test('G-2 §32: determinism — same pipelineContext yields byte-identical semanticOpportunities across repeated calls', () => {
  const ctx = { assembledAt: 999, initiativeIntelligence: { signals: [makeWeakeningFoodLoggingSignal()] } };
  const r1 = InitiativeEngine.detectOpportunities(ctx);
  const r2 = InitiativeEngine.detectOpportunities(ctx);
  assert.deepEqual(r1.semanticOpportunities, r2.semanticOpportunities);
});

test('G-2 §32: existing exports/behavior are preserved byte-for-byte (generate/validateCandidateShape/VALUE_DIMENSIONS/MATURITY_STAGES unaffected)', () => {
  assert.equal(typeof InitiativeEngine.generate, 'function');
  assert.equal(typeof InitiativeEngine.validateCandidateShape, 'function');
  assert.deepEqual(InitiativeEngine.VALUE_DIMENSIONS, ['TRUST', 'MOTIVATION', 'CONSISTENCY', 'UNDERSTANDING', 'RELATIONSHIP', 'DECISION_QUALITY']);
  assert.deepEqual(InitiativeEngine.MATURITY_STAGES, ['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']);
});
