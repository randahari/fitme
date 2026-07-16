// REM-002 — Session Lifecycle Manager tests.
// Dependency-free: Node's built-in test runner + assert only.
// Run with: node --test tests/sessionLifecycle.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const SessionLifecycle = require('../js/sessionLifecycle.js');

test('1. reset() increments generation', () => {
  const g0 = SessionLifecycle.getGeneration();
  const g1 = SessionLifecycle.reset('test-1');
  assert.equal(g1, g0 + 1);
  assert.equal(SessionLifecycle.getGeneration(), g1);
});

test('2. isCurrent() is true for the generation just issued, false after another reset', () => {
  const g1 = SessionLifecycle.reset('test-2a');
  assert.equal(SessionLifecycle.isCurrent(g1), true);
  SessionLifecycle.reset('test-2b');
  assert.equal(SessionLifecycle.isCurrent(g1), false);
});

test('3. registerCleanup() + reset() runs the registered cleanup', () => {
  let ran = false;
  SessionLifecycle.registerCleanup('t3', () => { ran = true; });
  SessionLifecycle.reset('test-3');
  assert.equal(ran, true);
});

test('4. a throwing cleanup does not prevent other cleanups from running', () => {
  let secondRan = false;
  SessionLifecycle.registerCleanup('t4-bad', () => { throw new Error('boom'); });
  SessionLifecycle.registerCleanup('t4-good', () => { secondRan = true; });
  assert.doesNotThrow(() => SessionLifecycle.reset('test-4'));
  assert.equal(secondRan, true);
});

test('5. re-registering the same name replaces, does not duplicate', () => {
  let count = 0;
  SessionLifecycle.registerCleanup('t5', () => { count++; });
  SessionLifecycle.registerCleanup('t5', () => { count += 10; });
  SessionLifecycle.reset('test-5');
  assert.equal(count, 10); // only the second registration ran, exactly once
});

test('6. duplicate/rapid reset calls remain safe and idempotent', () => {
  assert.doesNotThrow(() => {
    const a = SessionLifecycle.reset('dup-1');
    const b = SessionLifecycle.reset('dup-2');
    const c = SessionLifecycle.reset('dup-3');
    assert.equal(b, a + 1);
    assert.equal(c, b + 1);
  });
});

test('7. pattern proof — stale async continuation is suppressed by the generation guard', async () => {
  let sideEffect = null;
  async function simulateSessionScopedWork() {
    const gen = SessionLifecycle.getGeneration();
    await new Promise((resolve) => setTimeout(resolve, 15)); // simulate a Firestore/Claude round-trip
    if (!SessionLifecycle.isCurrent(gen)) return; // REM-002 guard
    sideEffect = 'ran-under-original-session';
  }
  const pending = simulateSessionScopedWork();
  SessionLifecycle.reset('account-switch-mid-flight'); // reset fires WHILE the async work is in flight
  await pending;
  assert.equal(sideEffect, null, 'stale completion must not apply its effect after a reset');
});

test('8. pattern proof — non-stale async continuation still applies its effect', async () => {
  let sideEffect = null;
  async function simulateSessionScopedWork() {
    const gen = SessionLifecycle.getGeneration();
    await new Promise((resolve) => setTimeout(resolve, 15));
    if (!SessionLifecycle.isCurrent(gen)) return;
    sideEffect = 'ran-under-original-session';
  }
  await simulateSessionScopedWork(); // no reset happens during this await
  assert.equal(sideEffect, 'ran-under-original-session');
});

test('9. pattern proof — two concurrent operations under different sessions never both apply', async () => {
  const applied = [];
  async function simulateWrite(label) {
    const gen = SessionLifecycle.getGeneration();
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
    if (!SessionLifecycle.isCurrent(gen)) return;
    applied.push(label);
  }
  const opA = simulateWrite('A');
  SessionLifecycle.reset('switch-to-B');
  const opB = simulateWrite('B');
  await Promise.all([opA, opB]);
  assert.deepEqual(applied, ['B'], 'only the operation started under the current session may apply');
});
