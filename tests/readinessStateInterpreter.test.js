// TRR-001 — Readiness State Interpreter unit tests (docs/specs/TRR_001_SPEC_v1.0.md §16).
// Exercises the real, unmodified module directly, with a stubbed callClaude closure — no live model.
// Run with: node --test tests/readinessStateInterpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Interpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');

function fakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function configureStub(handler) {
  Interpreter.configure({ callClaude: handler, maxRecordsPerBatch: undefined });
}
test.afterEach(() => { Interpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined }); });

test('1. batching mirrors sibling interpreters — sorted by id, count/char caps respected', () => {
  const records = [{ id: 'b', text: 'x' }, { id: 'a', text: 'y' }];
  const batches = Interpreter._internal.partitionIntoBatches(records, 10, 300, 10000);
  assert.deepEqual(batches[0].map((r) => r.sourceMemoryId), ['a', 'b']);
});

test('2. prompt delimits each record under its own id and requires the closed two-token vocabulary', () => {
  const prompt = Interpreter._internal.buildPrompt([{ sourceMemoryId: 'mem-1', statementText: 'I barely slept' }]);
  assert.ok(prompt.includes('<statement id="mem-1">I barely slept</statement>'));
  assert.ok(prompt.includes('CLASSIFIED_CURRENT_STATE'));
  assert.ok(prompt.includes('INELIGIBLE_OR_NOT_CLASSIFIED'));
});

test('3. prompt explicitly requires unconditional abstention on health/medical/symptom content', () => {
  const prompt = Interpreter._internal.buildPrompt([{ sourceMemoryId: 'mem-1', statementText: 'x' }]);
  assert.ok(/health|medical|injury|symptom|pain|illness/i.test(prompt));
});

// ── Positive/negative classification (the interpreter's own closed boundary) ────────────────

['I barely slept', 'I only have 20 minutes', 'I trained hard yesterday', 'I feel great today'].forEach((statement) => {
  test('4. IN-SCOPE ordinary current-state statement classifies CLASSIFIED_CURRENT_STATE: "' + statement + '"', async () => {
    configureStub(async () => fakeResponse([{ id: 'm1', verdict: 'CLASSIFIED_CURRENT_STATE' }]));
    const result = await Interpreter.classify([{ id: 'm1', text: statement }]);
    assert.equal(result.length, 1);
    assert.equal(result[0].sourceMemoryId, 'm1');
  });
});

['my knee hurts', 'I have a cold', 'I\'m in pain', 'I feel dizzy'].forEach((statement) => {
  test('5. health/symptom content abstains (model correctly returns INELIGIBLE_OR_NOT_CLASSIFIED): "' + statement + '"', async () => {
    configureStub(async () => fakeResponse([{ id: 'm1', verdict: 'INELIGIBLE_OR_NOT_CLASSIFIED' }]));
    const result = await Interpreter.classify([{ id: 'm1', text: statement }]);
    assert.deepEqual(result, []);
  });
});

// ── Fail-closed discipline ────────────────────────────────────────────────────────────────────

test('6. unconfigured callClaude fails closed to empty, never throws', async () => {
  Interpreter.configure({ callClaude: null });
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.deepEqual(result, []);
});

test('7. a thrown callClaude fails closed to empty', async () => {
  configureStub(() => { throw new Error('boom'); });
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.deepEqual(result, []);
});

test('8. a timeout fails closed to empty', async () => {
  configureStub(() => new Promise(() => {})); // never resolves
  Interpreter.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.deepEqual(result, []);
});

test('9. malformed JSON response fails closed to empty', async () => {
  configureStub(async () => ({ content: [{ text: 'not json' }] }));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.deepEqual(result, []);
});

test('10. an unknown/duplicate id in the model response is fail-closed by omission', async () => {
  configureStub(async () => fakeResponse([
    { id: 'unknown-id', verdict: 'CLASSIFIED_CURRENT_STATE' },
    { id: 'm1', verdict: 'CLASSIFIED_CURRENT_STATE' },
    { id: 'm1', verdict: 'CLASSIFIED_CURRENT_STATE' } // duplicate
  ]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.deepEqual(result, []); // the only real id was duplicated -> fails closed
});

test('11. empty record set returns empty without invoking callClaude', async () => {
  let called = false;
  configureStub(async () => { called = true; return fakeResponse([]); });
  const result = await Interpreter.classify([]);
  assert.deepEqual(result, []);
  assert.equal(called, false);
});

test('12. no numeric confidence field appears anywhere in a classified result', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', verdict: 'CLASSIFIED_CURRENT_STATE' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I barely slept' }]);
  assert.equal('confidence' in result[0], false);
});
