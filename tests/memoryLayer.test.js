// TASK-004 — Memory Layer (Context Assembly) tests. Dependency-free: exercises the real
// js/coachDecisionSystem/memoryLayer.js configured with mock StateAccess/
// DerivedIntelligenceConsumer dependencies, mirroring the mock-dependency approach already
// used in tests/stateAccess.test.js / tests/derivedIntelligenceConsumer.test.js.
// Run with: node --test tests/memoryLayer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');

function configureHappyPath() {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [{ kind: 'feedback', surface: 'recommendation', contextId: 'opp-1', feedbackType: 'Accepted', ts: 111 }] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

test('1. assembleContext returns a frozen, well-formed ImmutablePipelineContext', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(Object.isFrozen(ctx), true);
  assert.equal(ctx.userId, 'user-1');
  assert.equal(ctx.sessionGeneration, 1);
  assert.equal(typeof ctx.assembledAt, 'number');
  assert.ok(Array.isArray(ctx.feedbackHistory));
  assert.equal(ctx.availability.feedbackHistory, 'AVAILABLE');
  assert.equal(ctx.availability.derivedIntelligence, 'AVAILABLE');
});

test('2. feedbackHistory reflects StateAccess.recommendationFeedbackHistory() (C2 read path, unchanged)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.feedbackHistory.length, 1);
  assert.equal(ctx.feedbackHistory[0].contextId, 'opp-1');
});

test('3. derivedIntelligence is populated via DerivedIntelligenceConsumer (B5, RECOMMENDATION_ENGINE consumer)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.derivedIntelligence.consumer, 'RECOMMENDATION_ENGINE');
  assert.equal(ctx.derivedIntelligence.policyId, 'RECOMMENDATION_SUPPORT_V1');
});

test('4. graceful degradation: StateAccess feedback read failure does not block context assembly (D3 §12.3)', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('profile read failed'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.feedbackHistory, 'UNAVAILABLE');
  assert.deepEqual(ctx.feedbackHistory, []);
  assert.equal(ctx.availability.derivedIntelligence, 'AVAILABLE'); // one category's absence does not block another
});

test('5. graceful degradation: DerivedIntelligenceConsumer unavailability does not block context assembly', async () => {
  configureHappyPath();
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => { throw new Error('state access unavailable'); },
    readPatternSnapshot: async () => { throw new Error('state access unavailable'); },
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.derivedIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.derivedIntelligence, null);
  assert.equal(ctx.availability.feedbackHistory, 'AVAILABLE'); // one category's absence does not block another
});

test('6. never fabricates missing context: unavailable categories are recorded as UNAVAILABLE, never substituted with fabricated data', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('unavailable'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: () => false // simulate a fully stale session for StateAccess too
  });
  Consumer.configure({
    isSessionCurrent: () => false,
    readHabitSnapshot: async () => ({ habits: [] }),
    readPatternSnapshot: async () => ({ patterns: [] }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.feedbackHistory, 'UNAVAILABLE');
  assert.equal(ctx.availability.derivedIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.derivedIntelligence, null);
  assert.deepEqual(ctx.feedbackHistory, []);
});

// ══════════════════════════════════════════════════════════════════
// TASK-005 Canonical Decision CD-T005-01 — Pipeline Context extension (Relationship Maturity
// signal, Life Event Context, Habit state, Pattern state, Capacity state). §33.7.
// ══════════════════════════════════════════════════════════════════

test('7. initiativeIntelligence is populated via DerivedIntelligenceConsumer (B5, INITIATIVE_ENGINE consumer)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.initiativeIntelligence.consumer, 'INITIATIVE_ENGINE');
  assert.equal(ctx.initiativeIntelligence.policyId, 'INITIATIVE_SUPPORT_V1');
  assert.equal(ctx.availability.initiativeIntelligence, 'AVAILABLE');
});

test('8. habitState/patternState availability is sourced from initiativeIntelligence.sourceStatus, not fabricated', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.habitState, 'EMPTY'); // configureHappyPath supplies no habits/patterns
  assert.equal(ctx.availability.patternState, 'EMPTY');
});

test('9. Relationship Maturity is NOT derived from generic feedback-event count — a large feedback history still yields UNKNOWN (Correction 1)', async () => {
  const manyFeedbackEvents = Array.from({ length: 20 }, (_, i) => ({ kind: 'feedback', surface: 'recommendation', contextId: 'a' + i, feedbackType: 'Accepted', ts: i }));
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: manyFeedbackEvents }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.feedbackHistory.length, 20); // the feedback history itself is real and populated...
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // ...but is never used to derive a maturity stage
  assert.equal(ctx.relationshipMaturity.basis, null);
});

test('10. Relationship Maturity is NOT derived from confirmed Habit/Pattern signal count — many ACTIVE/CONFIRMED signals still yield UNKNOWN (Correction 1)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({
      habits: [
        { id: 'h1', type: 'nutrition', key: 'meal:evening', confidence: 0.9, consistency: 0.9, status: 'active', firstObserved: '2026-06-01', lastObserved: '2026-07-29', sourceEvents: { count: 10, window: 42 } },
        { id: 'h2', type: 'workout', key: 'weekday:1', confidence: 0.9, consistency: 0.9, status: 'active', firstObserved: '2026-06-01', lastObserved: '2026-07-29', sourceEvents: { count: 10, window: 42 } }
      ],
      habitsMeta: { lastRun: '2026-07-01', version: 1 }
    }),
    readPatternSnapshot: async () => ({
      patterns: [
        { id: 'frequency.meals_per_day', confidence: 0.9, status: 'confirmed', firstSeen: '2026-06-01', lastSeen: '2026-07-29', evidenceCount: 10 }
      ],
      patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' }
    }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.ok(ctx.initiativeIntelligence.signals.length >= 1); // the Habit/Pattern signals themselves are real...
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // ...but are never used to derive a maturity stage
  assert.equal(ctx.relationshipMaturity.basis, null);
});

test('10b. Relationship Maturity resolves to UNKNOWN when no approved source exists, regardless of read availability (never fabricated, no replacement heuristic)', async () => {
  configureHappyPath();
  const ctxAvailable = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctxAvailable.relationshipMaturity.stage, 'UNKNOWN');
  assert.equal(ctxAvailable.availability.relationshipMaturity, 'UNAVAILABLE');

  StateAccess.configure({
    getUserProfile: () => { throw new Error('unavailable'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: () => false
  });
  Consumer.configure({
    isSessionCurrent: () => false,
    readHabitSnapshot: async () => ({ habits: [] }),
    readPatternSnapshot: async () => ({ patterns: [] }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctxUnavailable = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctxUnavailable.relationshipMaturity.stage, 'UNKNOWN');
  assert.equal(ctxUnavailable.relationshipMaturity.basis, null);
});

test('10c. no replacement maturity heuristic exists in the source: no evidence-count derivation, no thresholds, no elapsed-time read', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
  ['ENGINEERING_PROVISIONAL_EVIDENCE_COUNT_V1', 'evidenceScore', 'confirmedSignalCount', 'createdAt', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'].forEach((token) => {
    assert.equal(src.indexOf(token), -1, 'must not contain ' + token);
  });
});

test('11. Life Event Context and Capacity State are honestly reported UNAVAILABLE (no repository data source exists), never fabricated', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.lifeEventContext, null);
  assert.equal(ctx.capacityState, null);
  assert.equal(ctx.availability.lifeEventContext, 'UNAVAILABLE');
  assert.equal(ctx.availability.capacityState, 'UNAVAILABLE');
});

test('12. graceful degradation: initiativeIntelligence unavailability does not block context assembly or the rest of the extension', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => { throw new Error('state access unavailable'); },
    readPatternSnapshot: async () => { throw new Error('state access unavailable'); },
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.initiativeIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.initiativeIntelligence, null);
  assert.equal(ctx.availability.habitState, 'UNAVAILABLE');
  assert.equal(ctx.availability.patternState, 'UNAVAILABLE');
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // always UNKNOWN — no approved source exists (Correction 1)
  assert.equal(Object.isFrozen(ctx), true);
});

test('13. Memory Layer performs no Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation (CD-T005-01 rule 5)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
  ['prioritize', 'selectWinner', 'formDecision', 'rank(', '.generate('].forEach((token) => {
    assert.equal(src.indexOf(token), -1, 'must not contain ' + token);
  });
});
