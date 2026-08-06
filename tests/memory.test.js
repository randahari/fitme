// TASK-007 UX-19.1-19.3 (WP6) — js/memory.js's memoryFailureMessage() unit tests.
// js/memory.js's D6 transparency-sheet UI functions (openSheet/renderItem/createMemory/etc.)
// are tightly coupled to browser globals (document, window, db, currentUser) and were never
// designed for Node testing — only its pure helpers are exposed for that purpose via the
// module's own established _internal export convention (makeMemory/validateMemory/safeKey).
// memoryFailureMessage joins that convention. Exercises the real js/memory.js and the real
// js/persistenceGateway.js (shared require-cache singleton, same pattern as
// tests/barcodeFlowController.test.js's direct adapter requires) — no monkey-patching needed
// since classifyError is a pure function of its input.
// Run with: node --test tests/memory.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Memory = require('../js/memory.js');

const { memoryFailureMessage } = Memory._internal;

test('memoryFailureMessage returns a retry-inviting message for a retryable error code (UX-19.2)', () => {
  const msg = memoryFailureMessage({ code: 'unavailable', message: 'network down' }, 'לא הצלחתי לשמור');
  assert.equal(msg, 'לא הצלחתי לשמור עקב בעיית תקשורת זמנית. נסה שוב.');
});

test('memoryFailureMessage returns a non-retry-inviting message for a non-retryable error code (UX-19.2)', () => {
  const msg = memoryFailureMessage({ code: 'permission-denied', message: 'forbidden' }, 'הפעולה נכשלה');
  assert.equal(msg, 'הפעולה נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.');
});

test('memoryFailureMessage treats every RETRYABLE_CODES member as retryable, matching the Persistence Gateway\'s own classification', () => {
  ['unavailable', 'deadline-exceeded', 'aborted', 'internal', 'resource-exhausted'].forEach((code) => {
    const msg = memoryFailureMessage({ code }, 'X');
    assert.match(msg, /עקב בעיית תקשורת זמנית\. נסה שוב\.$/, 'code ' + code + ' must be classified retryable');
  });
});

test('memoryFailureMessage treats an unrecognized/missing error code as non-retryable (safe default)', () => {
  assert.match(memoryFailureMessage({ code: 'some-unknown-code' }, 'X'), /ולא ניתן לנסות שוב כרגע/);
  assert.match(memoryFailureMessage({}, 'X'), /ולא ניתן לנסות שוב כרגע/);
  assert.match(memoryFailureMessage(null, 'X'), /ולא ניתן לנסות שוב כרגע/);
  assert.match(memoryFailureMessage(undefined, 'X'), /ולא ניתן לנסות שוב כרגע/);
});

test('memoryFailureMessage never throws, even given a malformed error value', () => {
  assert.doesNotThrow(() => memoryFailureMessage('not an object', 'X'));
  assert.doesNotThrow(() => memoryFailureMessage(42, 'X'));
});
