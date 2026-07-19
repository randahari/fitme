// C1-WP1 — js/core/stringUtils.js unit tests.
// Run with: node --test tests/stringUtils.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StringUtils = require('../js/core/stringUtils.js');

test('esc escapes all five HTML-sensitive characters', () => {
  assert.equal(StringUtils.esc('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
});

test('esc leaves plain text unchanged', () => {
  assert.equal(StringUtils.esc('שלום עולם 123'), 'שלום עולם 123');
});

test('esc treats null and undefined as empty string', () => {
  assert.equal(StringUtils.esc(null), '');
  assert.equal(StringUtils.esc(undefined), '');
});

test('esc coerces non-string input', () => {
  assert.equal(StringUtils.esc(42), '42');
});
