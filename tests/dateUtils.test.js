// C1-WP1 — js/core/dateUtils.js unit tests.
// Run with: node --test tests/dateUtils.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const DateUtils = require('../js/core/dateUtils.js');

test('dateKey formats a Date as YYYY-MM-DD with zero-padding', () => {
  assert.equal(DateUtils.dateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(DateUtils.dateKey(new Date(2026, 11, 31)), '2026-12-31');
  assert.equal(DateUtils.dateKey(new Date(2000, 8, 9)), '2000-09-09');
});

test('getTodayKey uses the injected clock when provided', () => {
  assert.equal(DateUtils.getTodayKey(new Date(2026, 6, 19)), '2026-07-19');
});

test('getTodayKey defaults to the real current date when no clock is injected', () => {
  const expected = DateUtils.dateKey(new Date());
  assert.equal(DateUtils.getTodayKey(), expected);
});

test('daysBetween returns a positive difference when k1 is later than k2', () => {
  assert.equal(DateUtils.daysBetween('2026-01-10', '2026-01-05'), 5);
});

test('daysBetween returns a negative difference when k1 is earlier than k2', () => {
  assert.equal(DateUtils.daysBetween('2026-01-05', '2026-01-10'), -5);
});

test('daysBetween returns 0 for the same day', () => {
  assert.equal(DateUtils.daysBetween('2026-01-05', '2026-01-05'), 0);
});

test('daysBetween spans a month boundary correctly', () => {
  assert.equal(DateUtils.daysBetween('2026-02-01', '2026-01-30'), 2);
});
