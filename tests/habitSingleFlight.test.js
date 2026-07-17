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
