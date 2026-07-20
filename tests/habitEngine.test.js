// C1-WP9 — behavioural unit tests for js/engines/habitEngine.js.
// Dependency-free: Node's built-in test runner + assert only. Exercises the REAL
// js/engines/habitEngine.js and js/stateAccess.js modules together (same approach as
// tests/stateAccess.test.js) — this is the first time this producer logic has been
// require()-able from Node at all; before C1-WP9 it lived inside js/app.js (a browser
// script) and could only be characterized indirectly (see tests/habitSingleFlight.test.js,
// which reproduces the single-flight *shape* rather than exercising this module directly).
// Run with: node --test tests/habitEngine.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const HabitEngine = require('../js/engines/habitEngine.js');

function dateKeyDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function makeEnv(overrides) {
  const profile = Object.assign({
    weightHistory: [], measurementHistory: [], currentWeight: 79, weight: 79,
    coachMemory: { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} },
    coachEvents: []
  }, overrides && overrides.profile);

  let generation = 1;
  const calls = { habitWrites: 0, lastHabitWrite: null };

  const deps = {
    getUserProfile: () => profile,
    fetchHistory: async () => (overrides && overrides.history) || {},
    persistHabitsView: async (identity, command) => {
      calls.habitWrites++;
      calls.lastHabitWrite = command;
      return { status: 'SUCCESS', changed: true, requestId: 'req-habits', receipt: {} };
    },
    persistPatternView: async () => { throw new Error('not used by habitEngine tests'); },
    isSessionCurrent: (gen) => gen === generation,
    ensureCoachMemoryShape: () => {
      if (!profile.coachMemory) profile.coachMemory = { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} };
    },
    setAdaptProposal: () => {}, setAdaptHistoryCache: () => {},
    recordCoachEvent: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    markTriggerFired: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    checkCanFire: () => true, getTriggerBudget: () => ({ date: dateKeyDaysAgo(0), fired: [], count: 0 }),
    getTodayConsumed: () => 0, getTodayProtein: () => 0, getTodayBurned: () => 0,
    getLocalDate: () => dateKeyDaysAgo(0), getWeekday: () => new Date().getDay()
  };
  StateAccess.configure(deps);

  return {
    profile: profile,
    setGeneration: (g) => { generation = g; },
    calls: calls,
    makeAccess: (gen) => StateAccess.createEngineAccess({ engineId: 'habitEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: gen !== undefined ? gen : generation, runId: null })
  };
}

function configureHabitEngine(env) {
  HabitEngine.configure({
    appVersion: '9.9.9-test',
    sessionLifecycle: { getGeneration: () => 1, isCurrent: (g) => g === 1 },
    getCurrentUser: () => ({ uid: 'user-1' }),
    getUserProfile: () => env.profile,
    persistenceSummaryFn: (result) => {
      if (!result) return { requested: false, status: null, requestId: null };
      const status = (result.metadata && result.metadata.persistenceStatus) || (result.status === 'APPLIED' ? 'SUCCESS' : 'FAILED');
      return { requested: true, status: status, requestId: (result.metadata && result.metadata.persistenceRequestId) || null };
    }
  });
}

// Six consecutive recent days, each with a single morning meal — enough to trip
// detectNutrition's "ארוחת בוקר קבועה" (meal:morning) detector (active>=5, occ>=3, ratio>=0.5).
function buildMorningMealHistory() {
  const history = {};
  for (let i = 0; i < 6; i++) {
    history[dateKeyDaysAgo(i)] = { meals: [{ time: '08:15', kcal: 400, protein: 20 }], burned: 0 };
  }
  return history;
}

test('runHabitEngine returns a no-op summary and writes nothing when currentUser/userProfile/access is missing', async () => {
  const env = makeEnv({});
  configureHabitEngine(env);
  HabitEngine.configure({
    appVersion: '9.9.9-test', sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true },
    getCurrentUser: () => null, getUserProfile: () => env.profile,
    persistenceSummaryFn: (r) => ({ requested: !!r, status: null, requestId: null })
  });
  const result = await HabitEngine.runHabitEngine(env.makeAccess());
  assert.equal(result.requested, false);
  assert.equal(env.calls.habitWrites, 0);
});

test('runHabitEngine detects a recurring morning-meal habit from constructed history and writes it with HABIT_ENGINE authority', async () => {
  const env = makeEnv({ history: buildMorningMealHistory() });
  configureHabitEngine(env);
  const result = await HabitEngine.runHabitEngine(env.makeAccess());
  assert.equal(result.requested, true);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(env.calls.habitWrites, 1);
  const written = env.calls.lastHabitWrite.habits;
  const morningHabit = written.find((h) => h.id === 'nutrition:meal:morning');
  assert.notEqual(morningHabit, undefined, 'expected a detected nutrition:meal:morning habit');
  assert.equal(env.calls.lastHabitWrite.habitsMeta.authority.authoritySource, 'HABIT_ENGINE');
  assert.equal(env.calls.lastHabitWrite.habitsMeta.version, HabitEngine.VERSION);
});

test('runHabitEngine honors the once-per-day gate (habitsMeta.lastRun === today skips recompute)', async () => {
  const today = dateKeyDaysAgo(0);
  const env = makeEnv({
    history: buildMorningMealHistory(),
    profile: { coachMemory: { habits: [], habitsMeta: { lastRun: today }, patterns: [], patternsMeta: {} } }
  });
  configureHabitEngine(env);
  const result = await HabitEngine.runHabitEngine(env.makeAccess());
  assert.equal(result.requested, false);
  assert.equal(env.calls.habitWrites, 0, 'must not recompute/write a second time on the same day');
});

test('runHabitEngineSingleFlight dedups two concurrent same-generation calls into a single write', async () => {
  const env = makeEnv({ history: buildMorningMealHistory() });
  configureHabitEngine(env);
  const [r1, r2] = await Promise.all([
    HabitEngine.runHabitEngineSingleFlight(env.makeAccess()),
    HabitEngine.runHabitEngineSingleFlight(env.makeAccess())
  ]);
  assert.equal(env.calls.habitWrites, 1, 'two overlapping calls in the same session must only compute/write once');
  assert.deepEqual(r1, r2);
});

test('runHabitEngineSingleFlight self-provisions a habitEngine/RECOMPUTE capability when called with no argument', async () => {
  const env = makeEnv({ history: buildMorningMealHistory() });
  configureHabitEngine(env);
  const result = await HabitEngine.runHabitEngineSingleFlight();
  assert.equal(result.status, 'SUCCESS');
  assert.equal(env.calls.habitWrites, 1);
});

test('run(ctx): SKIPPED for any action other than RECOMPUTE, without touching StateAccess', async () => {
  const env = makeEnv({ history: buildMorningMealHistory() });
  configureHabitEngine(env);
  const result = await HabitEngine.run({ action: 'SOMETHING_ELSE', userId: 'user-1', sessionGeneration: 1, runId: 'r1' });
  assert.equal(result.status, 'SKIPPED');
  assert.equal(result.error.code, 'UNKNOWN_ACTION');
  assert.equal(env.calls.habitWrites, 0);
});

test('run(ctx): RECOMPUTE builds a StateAccess capability, runs through the single-flight wrapper, and reports persistence in output', async () => {
  const env = makeEnv({ history: buildMorningMealHistory() });
  configureHabitEngine(env);
  const ctx = { action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: 1, runId: 'r1' };
  const result = await HabitEngine.run(ctx);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.persistence.status, 'SUCCESS');
  assert.notEqual(ctx.state, undefined, 'run(ctx) must attach the capability it built onto ctx.state');
  assert.equal(ctx.state.identity.engineId, 'habitEngine');
  assert.equal(env.calls.habitWrites, 1);
});
