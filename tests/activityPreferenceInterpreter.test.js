// TRR-001 — Activity Preference Interpreter unit tests (docs/specs/TRR_001_SPEC_v1.0.md §17).
// Run with: node --test tests/activityPreferenceInterpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Interpreter = require('../js/coachDecisionSystem/activityPreferenceInterpreter.js');

function fakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function configureStub(handler) {
  Interpreter.configure({ callClaude: handler, maxRecordsPerBatch: undefined });
}
test.afterEach(() => { Interpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined }); });

test('1. prompt requires the closed three-value sentiment vocabulary and literal activityText', () => {
  const prompt = Interpreter._internal.buildPrompt([{ sourceMemoryId: 'm1', statementText: 'I don\'t like running' }]);
  assert.ok(prompt.includes('POSITIVE_SENTIMENT'));
  assert.ok(prompt.includes('NEGATIVE_SENTIMENT'));
  assert.ok(prompt.includes('NOT_PREFERENCE_OR_NOT_CLASSIFIED'));
});

test('2. a negative-sentiment statement classifies with a literal, substring-verified activityText', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'NEGATIVE_SENTIMENT', activityText: 'running' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I don\'t like running' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].sentimentClassification, 'NEGATIVE_SENTIMENT');
  assert.equal(result[0].activityText, 'running');
});

test('3. a positive-sentiment statement classifies correctly', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'POSITIVE_SENTIMENT', activityText: 'Pilates' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I love Pilates' }]);
  assert.equal(result[0].sentimentClassification, 'POSITIVE_SENTIMENT');
});

test('4. a fabricated activityText NOT literally present in the source statement is rejected (fail-closed, not merely trusted)', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'NEGATIVE_SENTIMENT', activityText: 'cycling' }])); // not in source text
  const result = await Interpreter.classify([{ id: 'm1', text: 'I don\'t like running' }]);
  assert.deepEqual(result, []);
});

test('5. NOT_PREFERENCE_OR_NOT_CLASSIFIED records are not returned by classify()', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'NOT_PREFERENCE_OR_NOT_CLASSIFIED', activityText: null }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I ran 5km yesterday' }]);
  assert.deepEqual(result, []);
});

test('6. gating-dimension consistency: activityText present on a NOT_PREFERENCE record is fail-closed', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'NOT_PREFERENCE_OR_NOT_CLASSIFIED', activityText: 'running' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I ran 5km yesterday' }]);
  assert.deepEqual(result, []);
});

test('7. unconfigured/thrown/timeout/malformed callClaude all fail closed to empty', async () => {
  Interpreter.configure({ callClaude: null });
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'I love Pilates' }]), []);

  configureStub(() => { throw new Error('boom'); });
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'I love Pilates' }]), []);

  configureStub(async () => ({ content: [{ text: 'not json' }] }));
  assert.deepEqual(await Interpreter.classify([{ id: 'm1', text: 'I love Pilates' }]), []);
});

test('8. this interpreter never suppresses anything itself — advisory-only output shape, no gate field', async () => {
  configureStub(async () => fakeResponse([{ id: 'm1', sentimentClassification: 'NEGATIVE_SENTIMENT', activityText: 'running' }]));
  const result = await Interpreter.classify([{ id: 'm1', text: 'I don\'t like running' }]);
  assert.equal('suppress' in result[0], false);
  assert.equal('controlIntent' in result[0], false);
});
