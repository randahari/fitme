// C2 (Rejection and Suppression Feedback) — js/feedback/feedbackDomain.js unit tests.
// Dependency-free pure module: Node's built-in test runner + assert only.
// Run with: node --test tests/feedbackDomain.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const FeedbackDomain = require('../js/feedback/feedbackDomain.js');

const DAY = 24 * 60 * 60 * 1000;

// ── classifyFeedback (CD-04 closed vocabulary) ───────────────────────────────────────────

test('classifyFeedback maps every known gesture to its canonical CD-04 type', () => {
  assert.equal(FeedbackDomain.classifyFeedback('trigger', 'dismiss'), 'Dismissed');
  assert.equal(FeedbackDomain.classifyFeedback('adaptiveTdee', 'apply'), 'Accepted');
  assert.equal(FeedbackDomain.classifyFeedback('adaptiveTdee', 'dismiss'), 'Dismissed');
});

test('classifyFeedback throws on an unknown gesture rather than inventing a new category', () => {
  assert.throws(() => FeedbackDomain.classifyFeedback('trigger', 'snooze'), /unknown gesture/);
  assert.throws(() => FeedbackDomain.classifyFeedback('somethingElse', 'dismiss'), /unknown gesture/);
});

test('FEEDBACK_TYPES is exactly the 8 canonical CD-04 values, no more, no less', () => {
  assert.deepEqual(FeedbackDomain.FEEDBACK_TYPES, ['Accepted', 'Completed', 'Dismissed', 'Rejected', 'Ignored', 'Expired', 'UserCorrected', 'UserConfirmed']);
});

// ── evaluateSuppression: the four contractual guarantees (§13) ──────────────────────────

test('guarantee 1 (CD-02): a single feedback event never independently suppresses', () => {
  const now = Date.now();
  const events = [{ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now }];
  const r = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'insufficient-pattern');
});

test('no evidence at all -> not suppressed', () => {
  const r = FeedbackDomain.evaluateSuppression([], 'trigger', 'forgot-eat', Date.now());
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('a genuine repeated pattern (>= threshold negative events within the window) suppresses', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - i * DAY }));
  const r = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  assert.equal(r.suppressed, true);
  assert.equal(r.reason, 'repeated-pattern');
  assert.ok(r.suppressedUntil > now);
});

test('guarantee 2 (CD-07): suppression is temporary — it expires automatically', () => {
  const now = Date.now();
  // 3 dismissals, all 10 days ago; default duration is 7 days -> expired by now
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - (10 + i) * DAY }));
  const r = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  // the events also fall outside the 14-day evidence window at 10-12 days ago? they are within 14 days, so pattern still counts,
  // but the suppression window itself (7 days from lastNegative) has elapsed -> not suppressed.
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'suppression-expired');
});

test('guarantee 3 (CD-06): recomputes fresh from source every call — two calls with identical inputs give identical results, no hidden state', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - i * DAY }));
  const r1 = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  const r2 = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  assert.deepEqual(r1, r2);
});

test('guarantee 4 (CD-03/CD-07): an explicit positive event more recent than the negative pattern immediately restores eligibility', () => {
  const now = Date.now();
  const events = [
    { surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - 3 * DAY },
    { surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - 2 * DAY },
    { surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - 1 * DAY },
    { surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Accepted', occurredAt: now } // most recent
  ];
  const r = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'explicit-positive-override');
});

test('evaluateSuppression is scoped per (surface, contextId) — evidence for one trigger type never suppresses another, and surfaces never cross-contaminate', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - i * DAY }));
  const otherType = FeedbackDomain.evaluateSuppression(events, 'trigger', 'low-protein', now);
  const otherSurface = FeedbackDomain.evaluateSuppression(events, 'adaptiveTdee', 'forgot-eat', now);
  assert.equal(otherType.suppressed, false);
  assert.equal(otherSurface.suppressed, false);
});

test('events outside the recovery policy window do not count toward the pattern', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', contextId: 'forgot-eat', feedbackType: 'Dismissed', occurredAt: now - (20 + i) * DAY })); // > 14 day window
  const r = FeedbackDomain.evaluateSuppression(events, 'trigger', 'forgot-eat', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('evaluateSuppression throws on an unknown policyId rather than silently falling back', () => {
  assert.throws(() => FeedbackDomain.evaluateSuppression([], 'trigger', 'x', Date.now(), 'NOT_A_REAL_POLICY'), /unknown policyId/);
});

test('evaluateSuppression defaults to SUPPRESSION_RECOVERY_POLICY_V1 and reports it on the result (Issue 4: named/versioned policy)', () => {
  const r = FeedbackDomain.evaluateSuppression([], 'trigger', 'x', Date.now());
  assert.equal(r.policyId, 'SUPPRESSION_RECOVERY_POLICY_V1');
});

// ── RGEF WP6 (RGEF_SPEC_v1.0.md §18) — evaluateDomainTopicReceptiveness() ──────────────────

function initiativeEvent(overrides) {
  return Object.assign({ surface: 'initiative', domain: 'NUTRITION', topic: 'FOOD_LOGGING', feedbackType: 'Dismissed', occurredAt: Date.now() }, overrides);
}

test('RGEF: 1 qualifying negative event does not suppress (CD-02, mirrors evaluateSuppression\'s own guarantee 1)', () => {
  const now = Date.now();
  const events = [initiativeEvent({ occurredAt: now })];
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'insufficient-pattern');
});

test('RGEF: 2 qualifying negative events do not suppress (threshold is 3, not 2)', () => {
  const now = Date.now();
  const events = [0, 1].map((i) => initiativeEvent({ occurredAt: now - i * DAY }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'insufficient-pattern');
});

test('RGEF: 3 qualifying negative events within the 14-day window produce suppression (RGEF V1 Product-approved policy reuse — SUPPRESSION_RECOVERY_POLICY_V1, not an Engineering default)', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => initiativeEvent({ occurredAt: now - i * DAY }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, true);
  assert.equal(r.reason, 'repeated-pattern');
  assert.equal(r.policyId, 'SUPPRESSION_RECOVERY_POLICY_V1');
});

test('RGEF: a qualifying explicit positive event newer than the negative pattern immediately lifts suppression (existing, unmodified overrideTypes semantics)', () => {
  const now = Date.now();
  const events = [
    initiativeEvent({ feedbackType: 'Accepted', occurredAt: now }),
    ...[1, 2, 3].map((i) => initiativeEvent({ occurredAt: now - i * DAY }))
  ];
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'explicit-positive-override');
});

test('RGEF: negative evidence outside the 14-day window does not qualify', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => initiativeEvent({ occurredAt: now - (20 + i) * DAY }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('RGEF: a different Topic within the same Domain is unaffected (no Topic-to-Domain bleed, no cross-topic suppression, Invariant 6)', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => initiativeEvent({ occurredAt: now - i * DAY, topic: 'PROTEIN_INTAKE' }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('RGEF: a different Domain is unaffected', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => initiativeEvent({ occurredAt: now - i * DAY, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('RGEF: old records missing domain/topic are ignored safely, never fabricated into a match', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'initiative', feedbackType: 'Dismissed', occurredAt: now - i * DAY })); // no domain/topic at all
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('RGEF: a missing domain or topic argument on the call itself yields a defensive, non-suppressing result — never a basis to suppress', () => {
  const now = Date.now();
  assert.equal(FeedbackDomain.evaluateDomainTopicReceptiveness([initiativeEvent()], null, 'FOOD_LOGGING', now).suppressed, false);
  assert.equal(FeedbackDomain.evaluateDomainTopicReceptiveness([initiativeEvent()], 'NUTRITION', undefined, now).suppressed, false);
});

test('RGEF: a Trigger-surface event never counts toward Initiative Domain/Topic receptiveness, even with a matching domain/topic value by coincidence', () => {
  const now = Date.now();
  const events = [0, 1, 2].map((i) => ({ surface: 'trigger', domain: 'NUTRITION', topic: 'FOOD_LOGGING', feedbackType: 'Dismissed', occurredAt: now - i * DAY }));
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness(events, 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.suppressed, false);
  assert.equal(r.reason, 'no-evidence');
});

test('RGEF: evaluateDomainTopicReceptiveness reuses SUPPRESSION_RECOVERY_POLICY_V1 by reference — no duplicate policy table exists', () => {
  const now = Date.now();
  const r = FeedbackDomain.evaluateDomainTopicReceptiveness([], 'NUTRITION', 'FOOD_LOGGING', now);
  assert.equal(r.policyId, 'SUPPRESSION_RECOVERY_POLICY_V1');
  assert.equal(FeedbackDomain.RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1.windowDays, 14);
  assert.equal(FeedbackDomain.RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1.patternThreshold, 3);
});
