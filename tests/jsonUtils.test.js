// C1-WP1 — js/core/jsonUtils.js unit tests.
// Run with: node --test tests/jsonUtils.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const JsonUtils = require('../js/core/jsonUtils.js');

test('parseModelJSON parses a clean JSON object', () => {
  assert.deepEqual(JsonUtils.parseModelJSON('{"a":1,"b":2}'), { a: 1, b: 2 });
});

test('parseModelJSON parses a clean JSON array', () => {
  assert.deepEqual(JsonUtils.parseModelJSON('[1,2,3]'), [1, 2, 3]);
});

test('parseModelJSON strips ```json markdown fences', () => {
  assert.deepEqual(JsonUtils.parseModelJSON('```json\n{"a":1}\n```'), { a: 1 });
});

test('parseModelJSON ignores Hebrew prose before and after the JSON object', () => {
  const raw = 'הנה התשובה שלי: {"kcal":250,"protein":20} תודה רבה!';
  assert.deepEqual(JsonUtils.parseModelJSON(raw), { kcal: 250, protein: 20 });
});

test('parseModelJSON picks the array when an array appears before an object', () => {
  const raw = 'prefix [1,2] {"a":1} suffix';
  assert.deepEqual(JsonUtils.parseModelJSON(raw), [1, 2]);
});

test('parseModelJSON throws when no JSON is present', () => {
  assert.throws(() => JsonUtils.parseModelJSON('no json here'), /לא נמצא JSON בתשובה/);
});

test('parseModelJSON treats null/undefined input as empty and throws', () => {
  assert.throws(() => JsonUtils.parseModelJSON(null));
  assert.throws(() => JsonUtils.parseModelJSON(undefined));
});
