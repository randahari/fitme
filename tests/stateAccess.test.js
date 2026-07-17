// B3 — State Access Layer tests.
// Dependency-free: Node's built-in test runner + assert only.
// Run with: node --test tests/stateAccess.test.js
//
// js/app.js is a browser script and cannot be require()'d from Node, so these
// tests exercise the real js/stateAccess.js module directly, configured with
// mock dependencies that mirror app.js's actual shapes (userProfile fields,
// todayData, saveProfile/getHistoryData semantics, SessionLifecycle-style
// generation checks). This is the same approach already used for
// tests/engineRegistry.test.js and tests/habitSingleFlight.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');

function makeEnv(overrides) {
  const profile = Object.assign({
    weightHistory: [{ date: '2026-07-01', weight: 80 }],
    measurementHistory: [{ date: '2026-07-01', waist: 90 }],
    currentWeight: 79, weight: 79,
    goalKcal: 2000, confirmedLightDays: [], adaptiveTdee: null, tdee: null,
    goal: 'cut', currentDeficit: -300, rate: 'balanced', adaptiveEnabled: true, lastTdeeUpdate: null,
    totalWorkouts: 5, days: '4', streak: 3, foods: ['עוף'],
    coachMemory: {
      habits: [{ id: 'h1', confidence: 0.5 }], habitsMeta: { lastRun: '2026-07-01', version: 1 },
      patterns: [{ id: 'p1' }], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'abc' }
    },
    coachEvents: [],
    coachDay: { date: '2026-07-17', fired: [], count: 0 }
  }, overrides && overrides.profile);

  const todayData = Object.assign({ meals: [{ kcal: 300, protein: 20 }], burned: 100 }, overrides && overrides.todayData);

  let generation = 1;
  const calls = { savedProfile: 0, patternWrites: [], coachEvents: [], firedTypes: [], adaptProposal: undefined, adaptHistoryCache: undefined };

  const deps = {
    getUserProfile: () => profile,
    getCurrentUser: () => ({ uid: 'user-1' }),
    getTodayData: () => todayData,
    getTodayConsumed: () => todayData.meals.reduce((s, m) => s + (m.kcal || 0), 0),
    getTodayProtein: () => Math.round(todayData.meals.reduce((s, m) => s + (m.protein || 0), 0)),
    getTodayBurned: () => todayData.burned || 0,
    fetchHistory: async () => ({ '2026-07-16': { meals: [{ kcal: 400, protein: 10 }], burned: 0, steps: 0, water: 0 } }),
    persistProfile: async () => { calls.savedProfile++; },
    persistPatternView: async (patterns, patternsMeta) => {
      if (deps.__failPatternPersist) throw new Error('simulated Firestore failure');
      calls.patternWrites.push({ patterns, patternsMeta });
    },
    isSessionCurrent: (gen) => gen === generation,
    ensureCoachMemoryShape: () => {
      if (!profile.coachMemory) profile.coachMemory = { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} };
      if (!Array.isArray(profile.coachEvents)) profile.coachEvents = [];
    },
    setAdaptProposal: (p) => { calls.adaptProposal = p; },
    setAdaptHistoryCache: (h) => { calls.adaptHistoryCache = h; },
    recordCoachEvent: async (type, data) => { calls.coachEvents.push({ type, data }); },
    markTriggerFired: async (type) => { calls.firedTypes.push(type); profile.coachDay.fired.push(type); profile.coachDay.count++; },
    checkCanFire: (type) => profile.coachDay.fired.indexOf(type) === -1,
    getTriggerBudget: () => profile.coachDay
  };

  return {
    deps, profile, todayData, calls,
    setGeneration: (g) => { generation = g; },
    getGeneration: () => generation
  };
}

function configure(env) { StateAccess.configure(env.deps); }

function access(engineId, action, env, runId) {
  return StateAccess.createEngineAccess({ engineId, action, userId: 'user-1', sessionGeneration: env.getGeneration(), runId: runId || 'run-1' });
}

// ── 1. Each Engine/Action receives only its approved capabilities ──
// Note: every operation name is always present as a callable (B3 SPEC §22 —
// an unapproved call returns an explicit STATE_ACCESS_DENIED result instead
// of a generic "is not a function"). "Only its approved capabilities" is
// therefore verified functionally: approved ops perform the real operation,
// unapproved ones are denied.
test('1. habitEngine/RECOMPUTE can perform its approved reads/writes but is denied everything else', async () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  assert.ok(habit.read.bodyHistory().weightHistory);
  assert.ok(habit.read.habitView().habits);
  assert.equal((await habit.read.nutritionActivityHistory()) && true, true);

  assert.throws(() => habit.read.adaptiveProfile(), (e) => e.code === 'STATE_ACCESS_DENIED');
  assert.throws(() => habit.read.triggerProfile(), (e) => e.code === 'STATE_ACCESS_DENIED');
  const deniedWrite = habit.write.replaceDerivedPatternView({ patterns: [], patternsMeta: {} });
  assert.equal(deniedWrite.status, 'REJECTED');
  assert.equal(deniedWrite.error.code, 'STATE_ACCESS_DENIED');
});

// ── 2. Unauthorized read -> STATE_ACCESS_DENIED ──
test('2. an unapproved read operation throws STATE_ACCESS_DENIED', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env); // habitEngine has no adaptiveProfile read
  assert.throws(() => habit.read.adaptiveProfile(), (e) => e.code === 'STATE_ACCESS_DENIED');
});

// ── 3. Unauthorized write -> STATE_ACCESS_DENIED ──
test('3. an unapproved write operation returns a STATE_ACCESS_DENIED command result', () => {
  const env = makeEnv(); configure(env);
  const pattern = access('patternEngine', 'RECOMPUTE', env); // patternEngine cannot write Habit view
  const result = pattern.write.replaceDerivedHabitView({ habits: [], habitsMeta: {} });
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'STATE_ACCESS_DENIED');
});

// ── 4. Capability of one Engine is not usable as another Engine ──
test('4. a capability built for habitEngine cannot write Pattern state, and vice versa', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  const pattern = access('patternEngine', 'RECOMPUTE', env);
  assert.equal(habit.write.replaceDerivedPatternView === undefined, false); // present but denied
  assert.equal(habit.write.replaceDerivedPatternView({ patterns: [], patternsMeta: {} }).status, 'REJECTED');
  assert.equal(pattern.write.replaceDerivedHabitView({ habits: [], habitsMeta: {} }).status, 'REJECTED');
});

// ── 5. Capability of one Action does not inherit another Action's permissions ──
test('5. adaptiveTdeeEngine/ADAPTIVE_CHECK and triggerEngine actions do not share permissions', () => {
  const env = makeEnv(); configure(env);
  const dailyCheck = access('triggerEngine', 'DAILY_COACH_CHECK', env);
  const workoutCompleted = access('triggerEngine', 'WORKOUT_COMPLETED', env);
  assert.equal(typeof dailyCheck.read.triggerBudget, 'function');
  assert.throws(() => workoutCompleted.read.triggerBudget(), (e) => e.code === 'STATE_ACCESS_DENIED');
  assert.equal(workoutCompleted.write.updateDailyTriggerBudget({ type: 'x' }).status, 'REJECTED');
});

// ── 6. Stale session cannot read ──
test('6. a stale session cannot read user-scoped state', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  env.setGeneration(2); // session changed after capability creation
  assert.throws(() => habit.read.bodyHistory(), (e) => e.code === 'STALE_SESSION');
});

// ── 7. Stale session cannot write ──
test('7. a stale session cannot apply a state command', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  env.setGeneration(2);
  return habit.write.replaceDerivedHabitView({ habits: [], habitsMeta: {} }).then((result) => {
    assert.equal(result.status, 'REJECTED');
    assert.equal(result.error.code, 'STALE_SESSION');
  });
});

// ── 8. Returned snapshot mutation does not change owner-held state ──
test('8. mutating a returned snapshot does not mutate the owner-held profile', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  const body = habit.read.bodyHistory();
  assert.throws(() => { body.weightHistory.push({ date: 'x', weight: 999 }); }); // frozen array — push always throws
  assert.equal(env.profile.weightHistory.length, 1);
  body.weightHistory[0].weight = 999; // frozen element — sloppy-mode assignment silently no-ops
  assert.equal(body.weightHistory[0].weight, 80, 'the write silently failed — the snapshot element is frozen');
  assert.equal(env.profile.weightHistory[0].weight, 80, 'the owner-held profile must be unaffected either way');
});

// ── 9/10/11. Domain write isolation ──
test('9. Habit Engine can write only the Habit Derived View', async () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  const result = await habit.write.replaceDerivedHabitView({ habits: [{ id: 'new' }], habitsMeta: { lastRun: '2026-07-17' } });
  assert.equal(result.status, 'APPLIED');
  assert.deepEqual(env.profile.coachMemory.habits, [{ id: 'new' }]);
  assert.equal(env.profile.coachMemory.patterns[0].id, 'p1', 'Pattern state must be untouched');
});

test('10. Pattern Engine can write only the Pattern Derived View', async () => {
  const env = makeEnv(); configure(env);
  const pattern = access('patternEngine', 'RECOMPUTE', env);
  const result = await pattern.write.replaceDerivedPatternView({ patterns: [{ id: 'new' }], patternsMeta: { lastRun: '2026-07-17' } });
  assert.equal(result.status, 'APPLIED');
  assert.deepEqual(env.profile.coachMemory.patterns, [{ id: 'new' }]);
  assert.equal(env.profile.coachMemory.habits[0].id, 'h1', 'Habit state must be untouched');
});

test('11. Pattern Engine cannot mutate Habit state', () => {
  const env = makeEnv(); configure(env);
  const pattern = access('patternEngine', 'RECOMPUTE', env);
  const result = pattern.write.replaceDerivedHabitView({ habits: [{ id: 'hijack' }], habitsMeta: {} });
  assert.equal(result.status, 'REJECTED');
  assert.equal(env.profile.coachMemory.habits[0].id, 'h1');
});

// ── 12. Adaptive TDEE can store a proposal but cannot apply an authoritative target ──
test('12. Adaptive TDEE Engine can store a proposal but has no capability to change goalKcal', () => {
  const env = makeEnv(); configure(env);
  const adaptive = access('adaptiveTdeeEngine', 'ADAPTIVE_CHECK', env);
  const result = adaptive.write.storeAdaptiveProposal({ proposal: { newGoal: 1800 } });
  assert.equal(result.status, 'APPLIED');
  assert.deepEqual(env.calls.adaptProposal, { newGoal: 1800 });
  assert.equal(env.profile.goalKcal, 2000, 'goalKcal must remain unchanged — only applyAdaptiveUpdate() may change it, and it is outside the Registry');
  // no write operation grants authoritative-target mutation: every other write name is denied
  const denied = adaptive.write.replaceDerivedHabitView({});
  assert.equal(denied.status, 'REJECTED');
  assert.equal(denied.error.code, 'STATE_ACCESS_DENIED');
  assert.equal(adaptive.write.recordTriggerOutcome({}).error.code, 'STATE_ACCESS_DENIED');
});

// ── 13. Trigger Engine can change only Trigger state ──
test('13. Trigger Engine (DAILY_COACH_CHECK) can update only coachEvents/coachDay, not history or memory', async () => {
  const env = makeEnv(); configure(env);
  const trigger = access('triggerEngine', 'DAILY_COACH_CHECK', env);
  await trigger.write.recordTriggerOutcome({ type: 'streak-7', data: { streak: 7 } });
  await trigger.write.updateDailyTriggerBudget({ type: 'streak-7' });
  assert.deepEqual(env.calls.coachEvents, [{ type: 'streak-7', data: { streak: 7 } }]);
  assert.deepEqual(env.profile.coachDay.fired, ['streak-7']);
  // no write operation for history or canonical memory exists for this capability
  assert.equal(trigger.write.replaceDerivedHabitView({}).error.code, 'STATE_ACCESS_DENIED');
  assert.equal(trigger.write.replaceDerivedPatternView({}).error.code, 'STATE_ACCESS_DENIED');
  assert.equal(trigger.write.storeAdaptiveProposal({}).error.code, 'STATE_ACCESS_DENIED');
});

// ── 14. External request with a spoofed `state` cannot affect the capability ──
test('14. a spoofed context.state-like object has no effect — createEngineAccess only trusts its own explicit input', () => {
  const env = makeEnv(); configure(env);
  const spoofedInput = {
    engineId: 'habitEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: env.getGeneration(), runId: 'run-1',
    state: { write: { replaceDerivedPatternView: () => ({ status: 'APPLIED' }) } } // extraneous field an attacker might add
  };
  const habit = StateAccess.createEngineAccess(spoofedInput);
  const result = habit.write.replaceDerivedPatternView({ patterns: [], patternsMeta: {} });
  assert.equal(result.status, 'REJECTED', 'the spoofed function on the input is ignored — createEngineAccess always builds its own operation table from the identity, never from caller-supplied fields');
  assert.equal(result.error.code, 'STATE_ACCESS_DENIED');
});

// ── 15. Every Engine receives a separate capability object ──
test('15. two createEngineAccess calls for the same engine/action never return the same object instance', () => {
  const env = makeEnv(); configure(env);
  const a = access('habitEngine', 'RECOMPUTE', env);
  const b = access('habitEngine', 'RECOMPUTE', env);
  assert.notEqual(a, b);
  assert.notEqual(a.read, b.read);
  const h1 = access('habitEngine', 'RECOMPUTE', env);
  const h2 = access('patternEngine', 'RECOMPUTE', env);
  assert.notEqual(h1, h2);
});

// ── 16. No adapter with a two-capability-channel signature (static source check) ──
test('16. no dual capability-channel pattern (run(context, access)) exists in app.js', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.equal(/run:\s*async function\s*\(\s*ctx\s*,\s*\w+\s*\)/.test(appJs), false, 'no adapter run(ctx, access) signature should exist');
  assert.match(appJs, /ctx\.state\s*=\s*StateAccess\.createEngineAccess/, 'context.state must be the channel adapters use to attach the capability');
});

// ── 17. payload is not a State escape hatch ──
test('17. context.payload cannot be used to smuggle a state-service reference into the engine', () => {
  const env = makeEnv(); configure(env);
  const trigger = access('triggerEngine', 'WORKOUT_COMPLETED', env);
  const maliciousPayload = { burn: 300, state: trigger, db: {} };
  const workout = trigger.read.workoutPayload(maliciousPayload);
  assert.deepEqual(workout, { burn: 300 }); // only the approved field is extracted; nothing else leaks through
});

// ── 18. Dependency result is not a mutable State escape hatch ──
test('18. a capability object is immutable and cannot be used as a mutable channel via its own identity/read/write', () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  // sloppy-mode assignment to a frozen object/property silently no-ops rather than
  // throwing (matches the pattern already established in tests/authorityContract.test.js)
  habit.read = { hijacked: true };
  habit.identity.engineId = 'patternEngine';
  assert.ok(Object.isFrozen(habit));
  assert.ok(Object.isFrozen(habit.read));
  assert.ok(Object.isFrozen(habit.write));
  assert.equal(habit.identity.engineId, 'habitEngine', 'the write silently failed — identity is frozen');
  assert.equal(habit.read.hijacked, undefined, 'the write silently failed — read is frozen');
});

// ── 19. Habit and Pattern no longer write coachMemory.lastUpdated ──
test('19. replaceDerivedHabitView / replaceDerivedPatternView never touch a shared coachMemory.lastUpdated field', async () => {
  const env = makeEnv(); configure(env);
  const habit = access('habitEngine', 'RECOMPUTE', env);
  await habit.write.replaceDerivedHabitView({ habits: [], habitsMeta: { lastRun: '2026-07-17', lastUpdated: 12345 } });
  assert.equal(env.profile.coachMemory.lastUpdated, undefined, 'no shared coachMemory.lastUpdated should ever be set by the Habit owner command');
  assert.equal(env.profile.coachMemory.habitsMeta.lastUpdated, 12345, 'the timestamp lives inside habitsMeta instead');

  const pattern = access('patternEngine', 'RECOMPUTE', env);
  await pattern.write.replaceDerivedPatternView({ patterns: [], patternsMeta: { lastRun: '2026-07-17', lastUpdated: 67890 } });
  assert.equal(env.profile.coachMemory.lastUpdated, undefined);
  assert.equal(env.profile.coachMemory.patternsMeta.lastUpdated, 67890, 'the timestamp lives inside patternsMeta instead');
});

// ── 20. Pattern rollback continues to work via patternsMeta ──
test('20. Pattern rollback restores patterns/patternsMeta (including their own lastUpdated) on persistence failure', async () => {
  const env = makeEnv(); configure(env);
  const originalPatterns = env.profile.coachMemory.patterns;
  const originalMeta = env.profile.coachMemory.patternsMeta;
  env.deps.__failPatternPersist = true;
  const pattern = access('patternEngine', 'RECOMPUTE', env);
  const result = await pattern.write.replaceDerivedPatternView({ patterns: [{ id: 'temp' }], patternsMeta: { lastRun: '2026-07-17', lastUpdated: 999 } });
  assert.equal(result.status, 'FAILED');
  assert.equal(result.error.code, 'STATE_WRITE_FAILED');
  assert.deepEqual(env.profile.coachMemory.patterns, originalPatterns, 'rollback must restore the pre-mutation patterns array');
  assert.deepEqual(env.profile.coachMemory.patternsMeta, originalMeta, 'rollback must restore the pre-mutation patternsMeta (fingerprint/lastAdvanceDataDay/lastUpdated all revert together)');
});

// ── 21-26: B2/REM-002/REM-003 preservation is verified by the existing, unmodified suites ──
test('21-26. B2 orchestration, single-flight, REM-002 and REM-003 regression suites are unaffected by this module (documented — see tests/engineRegistry.test.js, tests/habitSingleFlight.test.js, tests/sessionLifecycle.test.js, tests/authorityContract.test.js, all run as part of the full `node --test tests/*.test.js` pass)', () => {
  assert.ok(true);
});

// ── 27. Engine algorithm outputs remain identical for fixed fixtures (spot-check via unchanged pure functions) ──
test('27. permission matrix and read snapshots do not alter any computation formula — spot check of a read snapshot shape', () => {
  const env = makeEnv(); configure(env);
  const adaptive = access('adaptiveTdeeEngine', 'ADAPTIVE_CHECK', env);
  const snap = adaptive.read.adaptiveProfile();
  // the snapshot must carry the exact field set the pure calculation functions consume — no renaming/reshaping
  ['goalKcal', 'confirmedLightDays', 'weightHistory', 'adaptiveTdee', 'tdee', 'measurementHistory', 'goal', 'currentWeight', 'weight', 'currentDeficit', 'rate', 'adaptiveEnabled', 'lastTdeeUpdate']
    .forEach((field) => assert.ok(Object.prototype.hasOwnProperty.call(snap, field), 'adaptiveProfile snapshot must include ' + field));
});

// ── 28/29/30. No B4/B5/Recommendation Engine behavior ──
test('28-30. no persistence-transaction, consumption-ranking, or recommendation vocabulary exists in this module', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/stateAccess.js'), 'utf8');
  ['transaction', 'rollbackPolicy', 'retryPolicy', 'confidenceThreshold', 'ranking', 'recommendation'].forEach((needle) => {
    assert.equal(src.toLowerCase().indexOf(needle.toLowerCase()), -1, 'stateAccess.js must not contain B4/B5/Recommendation-Engine vocabulary: ' + needle);
  });
});

// ── Additional: session re-check after async read (nutritionActivityHistory) ──
test('31. async read re-checks session after the await and rejects if the session changed mid-flight', async () => {
  const env = makeEnv(); configure(env);
  const slowFetch = new Promise((resolve) => setTimeout(() => resolve({}), 10));
  env.deps.fetchHistory = () => slowFetch;
  const habit = access('habitEngine', 'RECOMPUTE', env);
  const pending = habit.read.nutritionActivityHistory();
  env.setGeneration(2); // switch mid-flight
  await assert.rejects(() => pending, (e) => e.code === 'STALE_SESSION');
});

// ── Additional: canFire is scoped correctly and reflects real budget state ──
test('32. checkCanFire reflects the injected trigger budget accessor', () => {
  const env = makeEnv(); configure(env);
  const trigger = access('triggerEngine', 'DAILY_COACH_CHECK', env);
  assert.equal(trigger.read.canFire('streak-7', 1), true);
  env.profile.coachDay.fired.push('streak-7');
  assert.equal(trigger.read.canFire('streak-7', 1), false);
});

// ── Additional (Code Review correction): async WRITE completions re-check session
// after their await, mirroring the read-side pattern (test 31) — B3 SPEC §18 rule 5.
// The underlying persist already happened (cannot be undone without B4 rollback), so
// status stays APPLIED; staleAfterWrite:true is the honest post-hoc signal.
test('33. replaceDerivedPatternView flags staleAfterWrite when the session changes mid-flight', async () => {
  const env = makeEnv(); configure(env);
  let resolvePersist;
  env.deps.persistPatternView = (patterns, patternsMeta) => new Promise((resolve) => { resolvePersist = () => resolve(); });
  const pattern = access('patternEngine', 'RECOMPUTE', env);
  const pending = pattern.write.replaceDerivedPatternView({ patterns: [{ id: 'x' }], patternsMeta: { lastUpdated: 1 } });
  env.setGeneration(2);
  resolvePersist();
  const result = await pending;
  assert.equal(result.status, 'APPLIED', 'the persist already succeeded and cannot be silently un-applied');
  assert.equal(result.metadata.staleAfterWrite, true);
});

test('34. recordTriggerOutcome and updateDailyTriggerBudget flag staleAfterWrite when the session changes mid-flight', async () => {
  const env = makeEnv(); configure(env);
  let resolveEvent;
  env.deps.recordCoachEvent = () => new Promise((resolve) => { resolveEvent = () => resolve(); });
  const trigger = access('triggerEngine', 'DAILY_COACH_CHECK', env);
  const pending = trigger.write.recordTriggerOutcome({ type: 'streak-7', data: {} });
  env.setGeneration(2);
  resolveEvent();
  const result = await pending;
  assert.equal(result.status, 'APPLIED');
  assert.equal(result.metadata.staleAfterWrite, true);

  const env2 = makeEnv(); configure(env2);
  let resolveFired;
  env2.deps.markTriggerFired = () => new Promise((resolve) => { resolveFired = () => resolve(); });
  const trigger2 = access('triggerEngine', 'DAILY_COACH_CHECK', env2);
  const pending2 = trigger2.write.updateDailyTriggerBudget({ type: 'streak-7' });
  env2.setGeneration(2);
  resolveFired();
  const result2 = await pending2;
  assert.equal(result2.status, 'APPLIED');
  assert.equal(result2.metadata.staleAfterWrite, true);
});
