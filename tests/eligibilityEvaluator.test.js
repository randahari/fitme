// TASK-006 — Eligibility Evaluator tests (D2 Stage 5, D1 Unit 06, TASK_006_SPEC_v1.0.md §15, §35.1).
// Run with: node --test tests/eligibilityEvaluator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const EligibilityEvaluator = require('../js/coachDecisionSystem/eligibilityEvaluator.js');

function input(overrides) {
  return Object.assign({
    id: 'opp-1',
    sourceCategory: 'DECISION_WINDOW',
    validReasonCategory: 'PREVENT_PREDICTABLE_MISTAKE',
    trustTestSignal: { glad: true, basis: 'user has historically responded well to timely nudges' },
    lowCoachingValuePeriodActive: false,
    safetyHighRiskBypass: false
  }, overrides);
}

// ── §15.1 D1-IE-01 — each of the seven valid reasons individually recognized ──

const VALID_REASONS = [
  'PREVENT_PREDICTABLE_MISTAKE', 'HELP_BEFORE_DIFFICULT_DECISION', 'CELEBRATE_MEANINGFUL_PROGRESS',
  'SUPPORT_RECOVERY', 'PREPARE_FOR_FORESEEABLE_CHALLENGE', 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
  'PROTECT_STATED_LONG_TERM_GOALS'
];

VALID_REASONS.forEach((reason) => {
  test(`valid reason ${reason} is individually recognized as eligible (given a passing Trust Test)`, () => {
    const r = EligibilityEvaluator.evaluate(input({ validReasonCategory: reason }));
    assert.equal(r.outcome, 'ELIGIBLE');
    assert.equal(r.reason, reason);
  });
});

test('a missing validReasonCategory is rejected as MALFORMED, never defaulted (§15.11)', () => {
  const i = input(); delete i.validReasonCategory;
  const r = EligibilityEvaluator.evaluate(i);
  assert.equal(r.outcome, 'MALFORMED');
});

test('an out-of-enum validReasonCategory is rejected as MALFORMED, never defaulted (D1-IE-03: no eligibility merely because an event occurred)', () => {
  const r = EligibilityEvaluator.evaluate(input({ validReasonCategory: 'AN_EVENT_OCCURRED' }));
  assert.equal(r.outcome, 'MALFORMED');
});

// ── §15.2 D1-IE-02 — Trust Test ──

test('trustTestSignal.glad === null (uncertain) produces INELIGIBLE', () => {
  const r = EligibilityEvaluator.evaluate(input({ trustTestSignal: { glad: null, basis: 'no reliable signal yet' } }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'TRUST_TEST_UNCERTAIN');
});

test('trustTestSignal.glad === false produces INELIGIBLE', () => {
  const r = EligibilityEvaluator.evaluate(input({ trustTestSignal: { glad: false, basis: 'user has pushed back on similar timing before' } }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'TRUST_TEST_NOT_GLAD');
});

test('trustTestSignal.glad === true clears the Trust Test gate', () => {
  const r = EligibilityEvaluator.evaluate(input());
  assert.equal(r.outcome, 'ELIGIBLE');
});

test('a missing trustTestSignal is rejected as MALFORMED', () => {
  const i = input(); delete i.trustTestSignal;
  assert.equal(EligibilityEvaluator.evaluate(i).outcome, 'MALFORMED');
});

test('a missing trustTestSignal.basis is rejected as MALFORMED', () => {
  const r = EligibilityEvaluator.evaluate(input({ trustTestSignal: { glad: true, basis: '' } }));
  assert.equal(r.outcome, 'MALFORMED');
});

// ── §15.3 D1-IE-04 — reduced-frequency adjustment ──

test('lowCoachingValuePeriodActive === true correctly lowers eligibility (INELIGIBLE)', () => {
  const r = EligibilityEvaluator.evaluate(input({ lowCoachingValuePeriodActive: true }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'LOW_COACHING_VALUE_PERIOD');
});

test('lowCoachingValuePeriodActive === false does not itself block eligibility', () => {
  const r = EligibilityEvaluator.evaluate(input({ lowCoachingValuePeriodActive: false }));
  assert.equal(r.outcome, 'ELIGIBLE');
});

// ── §15.4 D1-IE-03 — no eligibility merely because an event occurred ──

test('an Opportunity with no valid reason (malformed) is never defaulted to eligible merely because it exists', () => {
  const i = input({ validReasonCategory: undefined });
  const r = EligibilityEvaluator.evaluate(i);
  assert.notEqual(r.outcome, 'ELIGIBLE');
});

// ── §15.5 D1-IE-05 — safety/high-risk bypass ──

test('safetyHighRiskBypass === true bypasses the ordinary gate entirely, even with a failing Trust Test', () => {
  const r = EligibilityEvaluator.evaluate(input({ safetyHighRiskBypass: true, trustTestSignal: { glad: false, basis: 'irrelevant under bypass' } }));
  assert.equal(r.outcome, 'ELIGIBLE');
  assert.equal(r.reason, 'SAFETY_HIGH_RISK_BYPASS');
});

// ── malformed input handling ──

test('null/undefined input is rejected as MALFORMED, never throws', () => {
  assert.doesNotThrow(() => EligibilityEvaluator.evaluate(null));
  assert.equal(EligibilityEvaluator.evaluate(null).outcome, 'MALFORMED');
  assert.equal(EligibilityEvaluator.evaluate(undefined).outcome, 'MALFORMED');
});

test('an invalid sourceCategory is rejected as MALFORMED', () => {
  assert.equal(EligibilityEvaluator.evaluate(input({ sourceCategory: 'NOT_REAL' })).outcome, 'MALFORMED');
});

test('missing safetyHighRiskBypass (non-boolean) is rejected as MALFORMED', () => {
  const i = input(); delete i.safetyHighRiskBypass;
  assert.equal(EligibilityEvaluator.evaluate(i).outcome, 'MALFORMED');
});

// ── determinism ──

test('identical input yields identical outcome across repeated evaluation', () => {
  const i = input();
  const a = EligibilityEvaluator.evaluate(i);
  const b = EligibilityEvaluator.evaluate(i);
  assert.deepEqual(a, b);
});

// ── RGEF §12 — Bounded Early-Relationship Engagement (WP3) ──

function boundedInput(overrides) {
  return input(Object.assign({
    sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
    validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
    trustTestSignal: { glad: null, basis: 'No approved affirmative Trust source exists for this Opportunity.' }
  }, overrides));
}

test('RGEF §12.2 — the exact compound condition (glad===null + CONFIRMED_PATTERN_ANTICIPATION + REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION) resolves ELIGIBLE via the bounded path', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput());
  assert.equal(r.outcome, 'ELIGIBLE');
  assert.equal(r.reason, 'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT');
});

test('RGEF §12.1 — the bounded path never reuses validReasonCategory as its reason, preventing conflation with an ordinary Trust-confirmed eligibility', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput());
  assert.notEqual(r.reason, 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
});

test('RGEF §12 (No Fake Trust) — trustTestSignal.glad is read, never mutated: the input object is untouched by evaluate()', () => {
  const i = boundedInput();
  const before = JSON.parse(JSON.stringify(i.trustTestSignal));
  EligibilityEvaluator.evaluate(i);
  assert.deepEqual(i.trustTestSignal, before);
  assert.equal(i.trustTestSignal.glad, null);
});

test('RGEF §12.2 (Invariant 2) — glad === false is NEVER admitted by the bounded path, even with the exact matching Source+Reason pair', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput({ trustTestSignal: { glad: false, basis: 'explicit negative signal' } }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'TRUST_TEST_NOT_GLAD');
});

test('RGEF §12.2 — Narrowness: a different, valid validReasonCategory under the same CONFIRMED_PATTERN_ANTICIPATION source does NOT qualify for the bounded path', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput({ validReasonCategory: 'CELEBRATE_MEANINGFUL_PROGRESS' }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'TRUST_TEST_UNCERTAIN');
});

test('RGEF §12.5 (A11, Recommendation isolation) — DECISION_WINDOW + REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION + glad:null does NOT inherit the bounded path (validReasonCategory alone is insufficient)', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput({ sourceCategory: 'DECISION_WINDOW' }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'TRUST_TEST_UNCERTAIN');
});

test('RGEF §12.2 — lowCoachingValuePeriodActive still blocks eligibility after the bounded path would otherwise apply (D1-IE-04 not weakened)', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput({ lowCoachingValuePeriodActive: true }));
  assert.equal(r.outcome, 'INELIGIBLE');
  assert.equal(r.reason, 'LOW_COACHING_VALUE_PERIOD');
});

test('RGEF §12.4 — safetyHighRiskBypass still short-circuits before the bounded path is ever considered', () => {
  const r = EligibilityEvaluator.evaluate(boundedInput({ safetyHighRiskBypass: true }));
  assert.equal(r.outcome, 'ELIGIBLE');
  assert.equal(r.reason, 'SAFETY_HIGH_RISK_BYPASS');
});

test('RGEF §12.3 — a malformed bounded-shaped input still resolves MALFORMED before the new branch is ever reached', () => {
  const i = boundedInput(); delete i.trustTestSignal.basis;
  const r = EligibilityEvaluator.evaluate(i);
  assert.equal(r.outcome, 'MALFORMED');
});
