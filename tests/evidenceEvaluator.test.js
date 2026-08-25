// G-2 (docs/specs/G2_SPEC_v1.0.md §24-26) — Evidence Evaluator (Stage 4) tests.
// Dependency-free: Node's built-in test runner + assert only, exercising the real
// js/coachDecisionSystem/evidenceEvaluator.js module directly — a pure module, no
// configure()/mock dependencies required.
// Run with: node --test tests/evidenceEvaluator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const EvidenceEvaluator = require('../js/coachDecisionSystem/evidenceEvaluator.js');

function makeWeakeningOpportunity(overrides) {
  return Object.assign({
    id: 'g2-food-logging-info-request:HABIT:nutrition:log-consistency',
    sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
    detectingContributor: 'INITIATIVE_ENGINE',
    contextualMeaning: {
      alignment: 'UNKNOWN', trajectory: 'WORSENING',
      basis: {
        observation: { sourceType: 'HABIT', lifecycle: 'WEAKENING', domain: 'NUTRITION', topic: 'FOOD_LOGGING' },
        priorEstablishmentBasis: 'provenance.currentEpisodeEstablished === true (Habit Engine Current-Episode Establishment Authority, CSF Ch.29 AD-HL-02)',
        contextConsulted: { goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED' },
        unavailableOrUncertain: []
      }
    },
    validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
    trustTestSignal: { glad: null, basis: 'no approved affirmative Trust source' },
    safetyHighRiskBypass: false
  }, overrides);
}

// ══════════════════════════════════════════════════════════════════
// §25.1 — Tier classification
// ══════════════════════════════════════════════════════════════════

test('1. Habit-derived WEAKENING with the real establishment fact classifies SUFFICIENT/REPEATED_BEHAVIOUR', () => {
  const r = EvidenceEvaluator.evaluate(makeWeakeningOpportunity());
  assert.equal(r.outcome, 'SUFFICIENT');
  assert.equal(r.evidenceTier, 'REPEATED_BEHAVIOUR');
  assert.ok(r.reason.includes('provenance.currentEpisodeEstablished'));
});

test('2. Habit-derived WEAKENING WITHOUT the establishment fact classifies INSUFFICIENT (never fabricated on lifecycle label alone)', () => {
  const o = makeWeakeningOpportunity();
  o.contextualMeaning.basis.priorEstablishmentBasis = null;
  const r = EvidenceEvaluator.evaluate(o);
  assert.equal(r.outcome, 'INSUFFICIENT');
  assert.equal(r.evidenceTier, 'INSUFFICIENT');
});

test('3. CONFIRMED_PATTERN_ANTICIPATION Habit-derived ACTIVE/CONFIRMED classifies SUFFICIENT/REPEATED_BEHAVIOUR (unchanged precedent)', () => {
  ['ACTIVE', 'CONFIRMED'].forEach((lifecycle) => {
    const o = makeWeakeningOpportunity();
    o.contextualMeaning.basis.observation.lifecycle = lifecycle;
    const r = EvidenceEvaluator.evaluate(o);
    assert.equal(r.outcome, 'SUFFICIENT');
    assert.equal(r.evidenceTier, 'REPEATED_BEHAVIOUR');
  });
});

test('4. Pattern-derived WEAKENING receives no REPEATED_BEHAVIOUR mapping — classifies INSUFFICIENT', () => {
  const o = makeWeakeningOpportunity();
  o.contextualMeaning.basis.observation.sourceType = 'PATTERN';
  const r = EvidenceEvaluator.evaluate(o);
  assert.equal(r.outcome, 'INSUFFICIENT');
  assert.equal(r.evidenceTier, 'INSUFFICIENT');
});

test('5. DISRUPTION_DETECTION/MILESTONE_RECOVERY/DECISION_WINDOW classify INSUFFICIENT (no classification source exists, Repository Gap, non-blocking)', () => {
  ['DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'DECISION_WINDOW'].forEach((sourceCategory) => {
    const r = EvidenceEvaluator.evaluate({ id: 'x', sourceCategory: sourceCategory });
    assert.equal(r.outcome, 'INSUFFICIENT');
    assert.equal(r.evidenceTier, 'INSUFFICIENT');
  });
});

test('6. SAFETY_HIGH_RISK bypass is defensively honored if ever called (ordinarily never reached — Stage 4 bypass)', () => {
  const r = EvidenceEvaluator.evaluate({ id: 'x', sourceCategory: 'SAFETY_HIGH_RISK', safetyHighRiskBypass: true });
  assert.equal(r.outcome, 'SUFFICIENT');
});

test('7. current evidence (the ContextualMeaning basis) is preserved honestly — no evidence, rationale, confidence, or proposedAction is invented', () => {
  const r = EvidenceEvaluator.evaluate(makeWeakeningOpportunity());
  assert.equal(Object.prototype.hasOwnProperty.call(r, 'confidence'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(r, 'proposedAction'), false);
});

// ══════════════════════════════════════════════════════════════════
// Malformed input handling
// ══════════════════════════════════════════════════════════════════

test('8. a malformed DetectedOpportunity (missing id) classifies INSUFFICIENT, never throws', () => {
  assert.doesNotThrow(() => EvidenceEvaluator.evaluate({ sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION' }));
  const r = EvidenceEvaluator.evaluate({ sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION' });
  assert.equal(r.outcome, 'INSUFFICIENT');
});

test('9. a malformed DetectedOpportunity (invalid sourceCategory) classifies INSUFFICIENT, never throws', () => {
  const r = EvidenceEvaluator.evaluate({ id: 'x', sourceCategory: 'NOT_A_REAL_SOURCE' });
  assert.equal(r.outcome, 'INSUFFICIENT');
});

test('10. null/undefined/non-object input classifies INSUFFICIENT, never throws', () => {
  assert.doesNotThrow(() => EvidenceEvaluator.evaluate(null));
  assert.doesNotThrow(() => EvidenceEvaluator.evaluate(undefined));
  assert.doesNotThrow(() => EvidenceEvaluator.evaluate('not-an-object'));
  assert.equal(EvidenceEvaluator.evaluate(null).outcome, 'INSUFFICIENT');
});

// ══════════════════════════════════════════════════════════════════
// Sufficiency rule (§25.2) and determinism
// ══════════════════════════════════════════════════════════════════

test('11. sufficiency rule: SUFFICIENT iff evidenceTier is EXPLICIT_USER_STATEMENT/EXPLICIT_USER_ACTION/REPEATED_BEHAVIOUR', () => {
  const r = EvidenceEvaluator.evaluate(makeWeakeningOpportunity());
  assert.equal(r.outcome, 'SUFFICIENT');
  const insufficient = EvidenceEvaluator.evaluate({ id: 'x', sourceCategory: 'DECISION_WINDOW' });
  assert.equal(insufficient.outcome, 'INSUFFICIENT');
});

test('12. determinism: identical input yields an identical EvidenceEvaluationResult', () => {
  const o = makeWeakeningOpportunity();
  const r1 = EvidenceEvaluator.evaluate(o);
  const r2 = EvidenceEvaluator.evaluate(o);
  assert.deepEqual(r1, r2);
});

test('13. the returned EvidenceEvaluationResult is frozen', () => {
  const r = EvidenceEvaluator.evaluate(makeWeakeningOpportunity());
  assert.equal(Object.isFrozen(r), true);
});

test('14. EVIDENCE_TIERS exposes the closed, six-value tier enum', () => {
  assert.deepEqual(EvidenceEvaluator.EVIDENCE_TIERS, [
    'EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR', 'SINGLE_BEHAVIOUR', 'INFERENCE', 'INSUFFICIENT'
  ]);
});
