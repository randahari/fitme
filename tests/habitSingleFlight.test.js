// B2 Code Review Round 4 — Habit Engine single-flight pattern proof.
// Dependency-free: Node's built-in test runner + assert only.
//
// js/app.js is a browser script (relies on window/DOM/Firebase globals) and is
// not `require()`-able from Node, so this file reproduces the exact
// runHabitEngineSingleFlight() algorithm added to js/app.js (same shape as the
// sessionLifecycle.test.js "pattern proof" tests do for REM-002's guard) and
// verifies it in isolation. Run with: node --test tests/habitSingleFlight.test.js

const test = require('node:test');
const assert = require('node:assert/strict');

// Faithful reproduction of js/app.js's runHabitEngineSingleFlight(), factored so
// each test gets isolated in-flight state instead of sharing one module-level
// variable across tests (the algorithm itself is unchanged, only its state is
// no longer a shared top-level `var`).
function makeSingleFlightHabit(getGeneration, habitFn) {
  let inFlight = null; // { generation, promise } | null
  return function runHabitEngineSingleFlight() {
    const gen = getGeneration();
    if (inFlight && inFlight.generation === gen) {
      return inFlight.promise; // same session, run already active — share it
    }
    const p = habitFn().finally(() => {
      if (inFlight && inFlight.promise === p) inFlight = null;
    });
    inFlight = { generation: gen, promise: p };
    return p;
  };
}

test('1. two concurrent same-session calls trigger the wrapped computation only once', async () => {
  let generation = 1;
  let computeCount = 0;
  const habitFn = async () => {
    computeCount++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return 'habit-result';
  };
  const runSingleFlight = makeSingleFlightHabit(() => generation, habitFn);

  const [r1, r2] = await Promise.all([runSingleFlight(), runSingleFlight()]);
  assert.equal(computeCount, 1, 'the underlying habit computation must run exactly once for two overlapping calls');
  assert.equal(r1, 'habit-result');
  assert.equal(r2, 'habit-result');
});

test('2. a "Pattern-style" internal caller and a "Registry-style" direct caller overlapping in time receive the identical in-flight Promise', async () => {
  let generation = 1;
  let computeCount = 0;
  const habitFn = async () => { computeCount++; await new Promise((resolve) => setTimeout(resolve, 10)); return 'ok'; };
  const runSingleFlight = makeSingleFlightHabit(() => generation, habitFn);

  // Simulates: EngineRegistry invokes habitEngine's adapter, which calls
  // runHabitEngineSingleFlight(); Pattern's own run(), invoked moments later in
  // the same session, also calls runHabitEngineSingleFlight() internally.
  const registryPromise = runSingleFlight();
  const patternInternalPromise = runSingleFlight();
  assert.equal(registryPromise, patternInternalPromise, 'both callers must be handed the exact same Promise instance, not two separate runs');
  await Promise.all([registryPromise, patternInternalPromise]);
  assert.equal(computeCount, 1);
});

test('3. a failure clears the single-flight reference and allows a subsequent retry to run again', async () => {
  let generation = 1;
  let computeCount = 0;
  let shouldFail = true;
  const habitFn = async () => {
    computeCount++;
    if (shouldFail) throw new Error('simulated habit engine failure');
    return 'ok';
  };
  const runSingleFlight = makeSingleFlightHabit(() => generation, habitFn);

  await assert.rejects(() => runSingleFlight());
  assert.equal(computeCount, 1);

  shouldFail = false;
  const result = await runSingleFlight(); // must be a fresh run, not a stuck/stale in-flight reference
  assert.equal(result, 'ok');
  assert.equal(computeCount, 2, 'a retry after failure must invoke the computation again, proving the in-flight slot was cleared');
});

test('4. a different session generation never reuses (or waits on) a previous session\'s in-flight Promise', async () => {
  let generation = 1;
  const startedUnderGeneration = [];
  const habitFn = async () => {
    const genAtStart = generation;
    startedUnderGeneration.push(genAtStart);
    await new Promise((resolve) => setTimeout(resolve, 15));
    return 'result-for-gen-' + genAtStart;
  };
  const runSingleFlight = makeSingleFlightHabit(() => generation, habitFn);

  const firstSessionPromise = runSingleFlight(); // starts under generation 1
  generation = 2; // simulated sign-out/account switch mid-flight
  const secondSessionPromise = runSingleFlight(); // must start its own fresh run under generation 2

  assert.notEqual(firstSessionPromise, secondSessionPromise, 'a new session generation must never be handed the stale generation\'s in-flight Promise');
  const [r1, r2] = await Promise.all([firstSessionPromise, secondSessionPromise]);
  assert.equal(r1, 'result-for-gen-1');
  assert.equal(r2, 'result-for-gen-2');
  assert.deepEqual(startedUnderGeneration.sort(), [1, 2], 'both generations actually ran their own computation — the stale one was not silently dropped, just not shared');
});

test('5. after both an in-flight run completes and its slot clears, the very next same-generation call starts a genuinely new run', async () => {
  let generation = 1;
  let computeCount = 0;
  const habitFn = async () => { computeCount++; return 'v' + computeCount; };
  const runSingleFlight = makeSingleFlightHabit(() => generation, habitFn);

  const first = await runSingleFlight();
  const second = await runSingleFlight(); // sequential, after the first fully resolved — must be a new run, not a dedup
  assert.equal(first, 'v1');
  assert.equal(second, 'v2');
  assert.equal(computeCount, 2);
});

// ── B3 Code Review — Critical Finding coverage ──────────────────────────────
// js/app.js:4029's real runHabitEngineSingleFlight(access) self-provisions a
// habitEngine/RECOMPUTE capability via StateAccess.createEngineAccess(...) when
// called with no argument (Pattern Engine's internal soft-invocation path, which
// must never be handed Pattern's own capability — B3 SPEC §8.1 rule 6). Unlike
// tests 1-5 above (which only reproduce the generic dedup shape and are
// StateAccess-agnostic), these tests exercise the REAL js/stateAccess.js module
// to verify the self-provisioned capability itself is safe: correctly scoped to
// habitEngine/RECOMPUTE regardless of who triggers it, and not something the
// calling code can influence or intercept.
const StateAccess = require('../js/stateAccess.js');

// Faithful reproduction of js/app.js:4029-4043's actual B3 signature (access is
// optional; self-provisions when absent), using the real StateAccess module.
function makeRealSingleFlightHabit(getGeneration, getCurrentUserId, runHabitEngine) {
  let inFlight = null;
  return function runHabitEngineSingleFlight(access) {
    const gen = getGeneration();
    if (inFlight && inFlight.generation === gen) return inFlight.promise;
    const effectiveAccess = access || StateAccess.createEngineAccess({
      engineId: 'habitEngine', action: 'RECOMPUTE',
      userId: getCurrentUserId(), sessionGeneration: gen, runId: null
    });
    const p = runHabitEngine(effectiveAccess).finally(() => {
      if (inFlight && inFlight.promise === p) inFlight = null;
    });
    inFlight = { generation: gen, promise: p };
    return p;
  };
}

test('6. calling runHabitEngineSingleFlight() with no argument (Pattern\'s internal path) self-provisions a capability scoped to habitEngine/RECOMPUTE, not to the caller', async () => {
  let generation = 7;
  StateAccess.configure({
    isSessionCurrent: (g) => g === generation,
    getUserProfile: () => ({ coachMemory: { habits: [], habitsMeta: {} } }),
    ensureCoachMemoryShape: () => {}
  });
  let receivedAccess = null;
  const runHabitEngine = async (access) => { receivedAccess = access; return 'ok'; };
  const runSingleFlight = makeRealSingleFlightHabit(() => generation, () => 'user-1', runHabitEngine);

  // Simulates Pattern Engine's internal soft call: `await runHabitEngineSingleFlight();`
  await runSingleFlight();

  assert.notEqual(receivedAccess, null, 'runHabitEngine must have received a self-provisioned capability');
  assert.equal(receivedAccess.identity.engineId, 'habitEngine', 'the self-provisioned capability must always identify as habitEngine, never as patternEngine or anything else — the caller cannot influence this');
  assert.equal(receivedAccess.identity.action, 'RECOMPUTE');
  // it is a real, permission-scoped habitEngine capability — Habit-approved reads work, Pattern writes are denied
  assert.ok(receivedAccess.read.habitView().habits !== undefined);
  assert.equal(receivedAccess.write.replaceDerivedPatternView({ patterns: [], patternsMeta: {} }).status, 'REJECTED', 'the self-provisioned capability must never be usable to write Pattern state');
});

test('7. the self-provisioned capability is bound to the session generation active at call time, not a fixed/stale one', async () => {
  let generation = 1;
  StateAccess.configure({
    isSessionCurrent: (g) => g === generation,
    getUserProfile: () => ({ coachMemory: { habits: [], habitsMeta: {} } }),
    ensureCoachMemoryShape: () => {}
  });
  let receivedAccess = null;
  const runHabitEngine = async (access) => { receivedAccess = access; return 'ok'; };
  const runSingleFlight = makeRealSingleFlightHabit(() => generation, () => 'user-1', runHabitEngine);

  await runSingleFlight();
  assert.doesNotThrow(() => receivedAccess.read.habitView(), 'capability created under the current generation must be able to read');

  generation = 2; // simulated sign-out/account switch after capability creation
  assert.throws(() => receivedAccess.read.habitView(), (e) => e.code === 'STALE_SESSION', 'a capability self-provisioned for the old generation must become unusable once the session moves on');
});

test('8. the Registry-supplied access argument (when present) is used as-is — self-provisioning only ever happens on the no-argument path', async () => {
  let generation = 1;
  StateAccess.configure({
    isSessionCurrent: (g) => g === generation,
    getUserProfile: () => ({ coachMemory: { habits: [], habitsMeta: {} } }),
    ensureCoachMemoryShape: () => {}
  });
  const registrySupplied = StateAccess.createEngineAccess({ engineId: 'habitEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: generation, runId: 'registry-run-42' });
  let receivedAccess = null;
  const runHabitEngine = async (access) => { receivedAccess = access; return 'ok'; };
  const runSingleFlight = makeRealSingleFlightHabit(() => generation, () => 'user-1', runHabitEngine);

  await runSingleFlight(registrySupplied);
  assert.equal(receivedAccess, registrySupplied, 'when the Registry-invoked adapter passes its own ctx.state, that exact object must be used unchanged — no silent replacement');
  assert.equal(receivedAccess.identity.runId, 'registry-run-42');
});
