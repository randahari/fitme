// TRR-001 — Activity Opposition Interpreter unit tests (docs/specs/TRR_001_SPEC_v1.0.md §18).
// Run with: node --test tests/activityOppositionInterpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Interpreter = require('../js/coachDecisionSystem/activityOppositionInterpreter.js');

function fakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function configureStub(handler) {
  Interpreter.configure({ callClaude: handler, maxRecordsPerBatch: undefined });
}
test.afterEach(() => { Interpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined }); });

test('1. prompt requires the closed two-value opposition vocabulary and literal opposedActivityText', () => {
  const prompt = Interpreter._internal.buildPrompt([{ sourceMemoryId: 'm1', statementText: 'don\'t suggest cycling to me' }]);
  assert.ok(prompt.includes('ACTIVITY_OPPOSITION_STATED'));
  assert.ok(prompt.includes('NOT_OPPOSITION_OR_NOT_CLASSIFIED'));
});

test('2. an explicit-opposition statement classifies with a literal, substring-verified opposedActivityText', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', oppositionClassification: 'ACTIVITY_OPPOSITION_STATED', opposedActivityText: 'cycling' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'don\'t suggest cycling to me' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].opposedActivityText, 'cycling');
});

test('3. a personal preference statement (no instruction to FITME) is never classified as opposition here — the model correctly abstains', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', oppositionClassification: 'NOT_OPPOSITION_OR_NOT_CLASSIFIED', opposedActivityText: null }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I don\'t like running' }]);
  assert.deepEqual(result, []);
});

test('4. a Safety-restriction statement is never classified as opposition here — the model correctly abstains', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', oppositionClassification: 'NOT_OPPOSITION_OR_NOT_CLASSIFIED', opposedActivityText: null }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'my doctor told me not to run' }]);
  assert.deepEqual(result, []);
});

test('5. a fabricated opposedActivityText NOT literally present in the source statement is rejected', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', oppositionClassification: 'ACTIVITY_OPPOSITION_STATED', opposedActivityText: 'swimming' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'don\'t suggest cycling to me' }]);
  assert.deepEqual(result, []);
});

test('6. unconfigured/thrown/malformed callClaude all fail closed to empty', async () => {
  Interpreter.configure({ callClaude: null });
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'don\'t suggest cycling' }]), []);
  configureStub(() => { throw new Error('boom'); });
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'don\'t suggest cycling' }]), []);
  configureStub(async () => ({ content: [{ text: 'not json' }] }));
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'don\'t suggest cycling' }]), []);
});

test('7. this interpreter classifies only — it never itself suppresses a Candidate (no deterministic gate function exposed)', () => {
  assert.equal(typeof Interpreter.suppress, 'undefined');
  assert.equal(typeof Interpreter.gate, 'undefined');
});
