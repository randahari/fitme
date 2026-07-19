// C1-WP1 — js/domain/profileMetrics.js unit tests.
// Run with: node --test tests/profileMetrics.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ProfileMetrics = require('../js/domain/profileMetrics.js');

test('calcBMI computes weight/height^2 rounded to one decimal', () => {
  assert.equal(ProfileMetrics.calcBMI(70, 175), 22.9);
  assert.equal(ProfileMetrics.calcBMI(100, 180), 30.9);
});

test('getBMICategory returns the correct label/color at and around each boundary', () => {
  assert.deepEqual(ProfileMetrics.getBMICategory(18.4), { label: 'תת משקל', color: '#378ADD' });
  assert.deepEqual(ProfileMetrics.getBMICategory(18.5), { label: 'תקין', color: '#1D9E75' });
  assert.deepEqual(ProfileMetrics.getBMICategory(24.9), { label: 'תקין', color: '#1D9E75' });
  assert.deepEqual(ProfileMetrics.getBMICategory(25), { label: 'עודף משקל', color: '#BA7517' });
  assert.deepEqual(ProfileMetrics.getBMICategory(29.9), { label: 'עודף משקל', color: '#BA7517' });
  assert.deepEqual(ProfileMetrics.getBMICategory(30), { label: 'השמנה', color: '#E24B4A' });
});

test('calcBodyFat uses the male formula for gender "male"', () => {
  // bmi = calcBMI(80,180) = 24.7; (1.20*24.7)+(0.23*30)-16.2 = 29.64+6.9-16.2 = 20.34 -> round 20
  assert.equal(ProfileMetrics.calcBodyFat(80, 180, 30, 'male'), 20);
});

test('calcBodyFat uses the female formula for any non-"male" gender', () => {
  // bmi = calcBMI(80,180) = 24.7; (1.20*24.7)+(0.23*30)-5.4 = 29.64+6.9-5.4 = 31.14 -> round 31
  assert.equal(ProfileMetrics.calcBodyFat(80, 180, 30, 'female'), 31);
  assert.equal(ProfileMetrics.calcBodyFat(80, 180, 30, undefined), 31);
});

test('computeProteinTarget rounds weight * 1.8', () => {
  assert.equal(ProfileMetrics.computeProteinTarget(80), 144);
  assert.equal(ProfileMetrics.computeProteinTarget(77), 139); // 138.6 -> 139
});

test('computeProteinTarget falls back to 75kg when weight is falsy', () => {
  assert.equal(ProfileMetrics.computeProteinTarget(null), 135);
  assert.equal(ProfileMetrics.computeProteinTarget(0), 135);
  assert.equal(ProfileMetrics.computeProteinTarget(undefined), 135);
});
