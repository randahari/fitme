// C1-WP9 — behavioural unit tests for js/engines/patternEngine.js.
// Dependency-free: Node's built-in test runner + assert only. Exercises the REAL
// js/engines/patternEngine.js, js/engines/habitEngine.js, and js/stateAccess.js modules
// together (same approach as tests/stateAccess.test.js) — this is the first time this
// producer logic has been require()-able from Node at all; before C1-WP9 it lived inside
// js/app.js (a browser script). Run with: node --test tests/patternEngine.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const HabitEngine = require('../js/engines/habitEngine.js');
const PatternEngine = require('../js/engines/patternEngine.js');

function dateKeyDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function makeEnv(overrides) {
  // patternsMeta ships the full shape runPatternEngine expects a returning user to already
  // have (lastRun/version/sourceFingerprint/lastAdvanceDataDay) — a genuinely first-ever-run
  // user (ensureCoachMemory() seeds only {observations,preferences,lastUpdated}, per
  // js/app.js:1771) is a separate, pre-existing edge case unrelated to this WP's extraction
  // and out of scope to characterize here.
  const profile = Object.assign({
    weightHistory: [], measurementHistory: [], currentWeight: 79, weight: 79,
    coachMemory: {
      habits: [], habitsMeta: {},
      patterns: [], patternsMeta: { lastRun: null, version: 1, sourceFingerprint: null, lastAdvanceDataDay: null }
    },
    coachEvents: []
  }, overrides && overrides.profile);

  let generation = 1;
  const calls = { patternWrites: [], habitWrites: 0 };

  const deps = {
    getUserProfile: () => profile,
    fetchHistory: async () => (overrides && overrides.history) || {},
    persistHabitsView: async () => { calls.habitWrites++; return { status: 'SUCCESS', changed: true, requestId: 'req-habits', receipt: {} }; },
    persistPatternView: async (identity, command) => {
      calls.patternWrites.push(command);
      return { status: 'SUCCESS', changed: true, requestId: 'req-patterns', receipt: {} };
    },
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
    calls: calls,
    makeAccess: (gen) => StateAccess.createEngineAccess({ engineId: 'patternEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: gen !== undefined ? gen : generation, runId: null })
  };
}

function configureEngines(env) {
  const persistenceSummaryFn = (result) => {
    if (!result) return { requested: false, status: null, requestId: null };
    const status = (result.metadata && result.metadata.persistenceStatus) || (result.status === 'APPLIED' ? 'SUCCESS' : 'FAILED');
    return { requested: true, status: status, requestId: (result.metadata && result.metadata.persistenceRequestId) || null };
  };
  HabitEngine.configure({
    appVersion: '9.9.9-test', sessionLifecycle: { getGeneration: () => 1, isCurrent: (g) => g === 1 },
    getCurrentUser: () => ({ uid: 'user-1' }), getUserProfile: () => env.profile,
    persistenceSummaryFn: persistenceSummaryFn
  });
  PatternEngine.configure({
    appVersion: '9.9.9-test',
    getCurrentUser: () => ({ uid: 'user-1' }), getUserProfile: () => env.profile,
    persistenceSummaryFn: persistenceSummaryFn
  });
}

// A weekday that's reliably documented across ~4 recent occurrences (same weekday, 7 days
// apart) trips detectWeekday's "יום X מתועד בקביעות" detector (opp.length>=3, ratioActive>=0.6).
function buildWeekdayHistory() {
  const history = {};
  for (let w = 0; w < 4; w++) {
    history[dateKeyDaysAgo(w * 7)] = { meals: [{ time: '12:00', kcal: 500, protein: 30 }], burned: 0 };
  }
  return history;
}

test('runPatternEngine is a no-op (no write) when currentUser/userProfile/access is missing', async () => {
  const env = makeEnv({});
  configureEngines(env);
  PatternEngine.configure({
    appVersion: '9.9.9-test', getCurrentUser: () => null, getUserProfile: () => env.profile,
    persistenceSummaryFn: (r) => ({ requested: !!r, status: null, requestId: null })
  });
  const result = await PatternEngine.runPatternEngine(env.makeAccess());
  assert.equal(result.requested, false);
  assert.equal(env.calls.patternWrites.length, 0);
});

test('runPatternEngine is a no-op on a second run with unchanged source data (same fingerprint, no new data day)', async () => {
  const env = makeEnv({ history: buildWeekdayHistory() });
  configureEngines(env);
  const first = await PatternEngine.runPatternEngine(env.makeAccess());
  assert.equal(first.requested, true, 'the first run must write (sourceFingerprint starts null)');
  assert.equal(env.calls.patternWrites.length, 1);

  const second = await PatternEngine.runPatternEngine(env.makeAccess());
  assert.equal(second.requested, false, 'an unchanged source and no new data day must short-circuit before any write');
  assert.equal(env.calls.patternWrites.length, 1, 'must still be exactly one write after the no-op second run');
});

test('runPatternEngine detects a recurring weekday pattern from constructed history and writes it with PATTERN_ENGINE authority', async () => {
  const env = makeEnv({ history: buildWeekdayHistory() });
  configureEngines(env);
  const result = await PatternEngine.runPatternEngine(env.makeAccess());
  assert.equal(result.requested, true);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(env.calls.patternWrites.length, 1);
  const written = env.calls.patternWrites[0];
  const weekdayPattern = written.patterns.find((p) => p.category === 'weekday');
  assert.notEqual(weekdayPattern, undefined, 'expected a detected weekday pattern');
  assert.equal(written.patternsMeta.authority.authoritySource, 'PATTERN_ENGINE');
  assert.equal(written.patternsMeta.version, PatternEngine.VERSION);
});

test('runPatternEngine soft-calls HabitEngine.runHabitEngineSingleFlight() internally and tolerates its failure', async () => {
  const env = makeEnv({ history: buildWeekdayHistory() });
  configureEngines(env);
  const originalFn = HabitEngine.runHabitEngineSingleFlight;
  let habitCalled = false;
  HabitEngine.runHabitEngineSingleFlight = async function () {
    habitCalled = true;
    throw new Error('simulated habit engine failure');
  };
  try {
    const result = await PatternEngine.runPatternEngine(env.makeAccess());
    assert.equal(habitCalled, true, 'runPatternEngine must call HabitEngine.runHabitEngineSingleFlight()');
    assert.equal(result.status, 'SUCCESS', 'a Habit Engine failure must not cancel Pattern Engine (soft dependency)');
  } finally {
    HabitEngine.runHabitEngineSingleFlight = originalFn;
  }
});

test('run(ctx): SKIPPED for any action other than RECOMPUTE', async () => {
  const env = makeEnv({ history: buildWeekdayHistory() });
  configureEngines(env);
  const result = await PatternEngine.run({ action: 'SOMETHING_ELSE', userId: 'user-1', sessionGeneration: 1, runId: 'r1' });
  assert.equal(result.status, 'SKIPPED');
  assert.equal(result.error.code, 'UNKNOWN_ACTION');
  assert.equal(env.calls.patternWrites.length, 0);
});

test('run(ctx): RECOMPUTE builds a StateAccess capability and reports persistence in output', async () => {
  const env = makeEnv({ history: buildWeekdayHistory() });
  configureEngines(env);
  const ctx = { action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: 1, runId: 'r1' };
  const result = await PatternEngine.run(ctx);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.persistence.status, 'SUCCESS');
  assert.equal(ctx.state.identity.engineId, 'patternEngine');
  assert.equal(env.calls.patternWrites.length, 1);
});
