// C1-WP6 — js/coach/coachProfile.js unit tests.
// Pure module: coachName/coachStyle/coachChatter read userProfile with defaults;
// setStyle/setChatter mutate userProfile in place. No configure(), no DOM/platform.
// Run with: node --test tests/coachProfile.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CoachProfile = require('../js/coach/coachProfile.js');

test('coachName prefers coachName, then falls back to name, then to the default "חבר"', () => {
  assert.equal(CoachProfile.coachName({ coachName: 'קפטן', name: 'רן' }), 'קפטן');
  assert.equal(CoachProfile.coachName({ name: 'רן' }), 'רן');
  assert.equal(CoachProfile.coachName({}), 'חבר');
  assert.equal(CoachProfile.coachName(null), 'חבר');
});

test('coachStyle defaults to "mixed" when absent or no profile', () => {
  assert.equal(CoachProfile.coachStyle({ coachStyle: 'professional' }), 'professional');
  assert.equal(CoachProfile.coachStyle({}), 'mixed');
  assert.equal(CoachProfile.coachStyle(null), 'mixed');
});

test('coachChatter defaults to "balanced" when absent or no profile', () => {
  assert.equal(CoachProfile.coachChatter({ coachChatter: 'gentle' }), 'gentle');
  assert.equal(CoachProfile.coachChatter({}), 'balanced');
  assert.equal(CoachProfile.coachChatter(null), 'balanced');
});

test('setStyle mutates userProfile.coachStyle in place', () => {
  const p = { coachStyle: 'mixed' };
  CoachProfile.setStyle(p, 'friendly');
  assert.equal(p.coachStyle, 'friendly');
});

test('setChatter mutates userProfile.coachChatter in place', () => {
  const p = { coachChatter: 'balanced' };
  CoachProfile.setChatter(p, 'minimal');
  assert.equal(p.coachChatter, 'minimal');
});
