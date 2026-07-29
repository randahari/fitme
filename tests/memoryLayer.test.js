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
