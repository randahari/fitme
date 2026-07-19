// C1-WP1 — js/core/numberUtils.js unit tests.
// Run with: node --test tests/numberUtils.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NumberUtils = require('../js/core/numberUtils.js');

test('linearSlope returns 0 with fewer than 2 points', () => {
  assert.equal(NumberUtils.linearSlope([]), 0);
  assert.equal(NumberUtils.linearSlope([{ x: 0, y: 5 }]), 0);
});

test('linearSlope computes the exact slope for a perfect line', () => {
  const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
  assert.equal(NumberUtils.linearSlope(points), 1);
});

test('linearSlope computes a negative slope', () => {
  const points = [{ x: 0, y: 10 }, { x: 1, y: 8 }, { x: 2, y: 6 }];
  assert.equal(NumberUtils.linearSlope(points), -2);
});

test('linearSlope returns 0 when all x values are identical (zero denominator)', () => {
  const points = [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }];
  assert.equal(NumberUtils.linearSlope(points), 0);
});

test('num coerces numeric-looking values and defaults invalid ones to 0', () => {
  assert.equal(NumberUtils.num('5'), 5);
  assert.equal(NumberUtils.num('3.5'), 3.5);
  assert.equal(NumberUtils.num(7), 7);
  assert.equal(NumberUtils.num('abc'), 0);
  assert.equal(NumberUtils.num(null), 0);
  assert.equal(NumberUtils.num(undefined), 0);
  assert.equal(NumberUtils.num(''), 0);
});
