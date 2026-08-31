// MAI-001 — Activity Identity Vocabulary unit tests (docs/specs/MAI_001_SPEC_v1.0.md §6-§9).
// Exercises the real, unmodified module directly — pure, deterministic, no callClaude/StateAccess
// dependency.
// Run with: node --test tests/activityIdentityVocabulary.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Vocabulary = require('../js/domain/activityIdentityVocabulary.js');

// ── §6 — the exact six-token vocabulary, closed and frozen ─────────────────────────────────

test('1. ACTIVITY_TOKENS contains exactly the six canonical values, in the approved order', () => {
  assert.deepEqual(Vocabulary.ACTIVITY_TOKENS, [
    'RUNNING', 'WALKING', 'CYCLING', 'SWIMMING', 'STRENGTH_TRAINING', 'PADEL'
  ]);
});

test('2. ACTIVITY_TOKENS is frozen — cannot be mutated at runtime', () => {
  assert.equal(Object.isFrozen(Vocabulary.ACTIVITY_TOKENS), true);
  const before = Vocabulary.ACTIVITY_TOKENS.slice();
  try { Vocabulary.ACTIVITY_TOKENS.push('SKIING'); } catch (e) { /* strict mode may throw */ }
  assert.deepEqual(Vocabulary.ACTIVITY_TOKENS, before, 'the array must not have grown');
});

test('3. ACTIVITY_TOKENS contains no duplicate values', () => {
  assert.equal(new Set(Vocabulary.ACTIVITY_TOKENS).size, Vocabulary.ACTIVITY_TOKENS.length);
});

// ── §8 — isValidActivity(token): deterministic membership only, no fuzzy/alias/case matching ─

test('4. isValidActivity accepts each of the six canonical tokens', () => {
  Vocabulary.ACTIVITY_TOKENS.forEach((t) => assert.equal(Vocabulary.isValidActivity(t), true, t));
});

test('5. isValidActivity rejects an unknown/out-of-vocabulary token', () => {
  assert.equal(Vocabulary.isValidActivity('SKIING'), false);
  assert.equal(Vocabulary.isValidActivity('YOGA'), false);
});

test('6. isValidActivity rejects a lowercase or mixed-case variant — no case-folding', () => {
  assert.equal(Vocabulary.isValidActivity('running'), false);
  assert.equal(Vocabulary.isValidActivity('Running'), false);
  assert.equal(Vocabulary.isValidActivity('RUNNING '), false, 'trailing whitespace must not be trimmed');
});

test('7. isValidActivity rejects a plausible alias/synonym — no alias inference', () => {
  assert.equal(Vocabulary.isValidActivity('JOGGING'), false, 'a near-synonym of RUNNING must not be inferred as a match');
  assert.equal(Vocabulary.isValidActivity('BIKING'), false, 'a near-synonym of CYCLING must not be inferred as a match');
  assert.equal(Vocabulary.isValidActivity('SWIM'), false, 'a truncated form of SWIMMING must not fuzzy-match');
});

test('8. isValidActivity rejects an empty string, null, undefined, a number, and an array', () => {
  assert.equal(Vocabulary.isValidActivity(''), false);
  assert.equal(Vocabulary.isValidActivity(null), false);
  assert.equal(Vocabulary.isValidActivity(undefined), false);
  assert.equal(Vocabulary.isValidActivity(42), false);
  assert.equal(Vocabulary.isValidActivity(['RUNNING']), false);
});

test('9. isValidActivity requires no mapping from js/app.js\'s own unrelated workoutType values', () => {
  // workoutType's own closed set is {'cardio','strength','calisthenics'} — none of these are,
  // or should be treated as, valid Activity Identity tokens (MAI-001 §10, no mapping required).
  assert.equal(Vocabulary.isValidActivity('cardio'), false);
  assert.equal(Vocabulary.isValidActivity('strength'), false);
  assert.equal(Vocabulary.isValidActivity('calisthenics'), false);
});

// ── §4/§8/§9 — isValidActionIdentity(obj): exact V1 shape only ─────────────────────────────

test('10. isValidActionIdentity accepts the exact V1 shape for each canonical activity', () => {
  Vocabulary.ACTIVITY_TOKENS.forEach((t) => assert.equal(Vocabulary.isValidActionIdentity({ activity: t }), true, t));
});

test('11. isValidActionIdentity rejects an object with an invalid/unknown activity value', () => {
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'SKIING' }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'running' }), false);
});

test('12. isValidActionIdentity rejects a missing activity key', () => {
  assert.equal(Vocabulary.isValidActionIdentity({}), false);
});

test('13. isValidActionIdentity rejects null, undefined, an array, a string, and a number', () => {
  assert.equal(Vocabulary.isValidActionIdentity(null), false);
  assert.equal(Vocabulary.isValidActionIdentity(undefined), false);
  assert.equal(Vocabulary.isValidActionIdentity(['RUNNING']), false);
  assert.equal(Vocabulary.isValidActionIdentity('RUNNING'), false);
  assert.equal(Vocabulary.isValidActionIdentity(42), false);
});

test('14. isValidActionIdentity rejects any additional Action Model dimension beyond activity (AD-SF-02, §17)', () => {
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', duration: 30 }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', intensity: 'HIGH' }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', quantity: 1 }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', bodyArea: 'LEGS' }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', recoveryDemand: 'LOW' }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activity: 'RUNNING', foodIdentity: 'BANANA' }), false);
});

test('15. isValidActionIdentity rejects an object whose only key is not literally "activity"', () => {
  assert.equal(Vocabulary.isValidActionIdentity({ Activity: 'RUNNING' }), false);
  assert.equal(Vocabulary.isValidActionIdentity({ activityType: 'RUNNING' }), false);
});

test('16. isValidActionIdentity rejects an empty object', () => {
  assert.equal(Vocabulary.isValidActionIdentity({}), false);
});
