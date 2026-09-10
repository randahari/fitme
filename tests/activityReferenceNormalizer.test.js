// TRR-001 — Activity Reference Normalizer unit tests (docs/specs/TRR_001_SPEC_v1.0.md §24).
// Run with: node --test tests/activityReferenceNormalizer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Normalizer = require('../js/domain/activityReferenceNormalizer.js');
const ActivityIdentityVocabulary = require('../js/domain/activityIdentityVocabulary.js');

test('1. RUNNING normalization — "running", "a run", "jogging"', () => {
  assert.equal(Normalizer.normalize('running'), 'RUNNING');
  assert.equal(Normalizer.normalize('a run'), 'RUNNING');
  assert.equal(Normalizer.normalize('jogging'), 'RUNNING');
});

test('2. WALKING normalization — "walking", "a walk"', () => {
  assert.equal(Normalizer.normalize('walking'), 'WALKING');
  assert.equal(Normalizer.normalize('a walk'), 'WALKING');
});

test('3. known MAI normalization examples — CYCLING, SWIMMING, STRENGTH_TRAINING, PADEL', () => {
  assert.equal(Normalizer.normalize('cycling'), 'CYCLING');
  assert.equal(Normalizer.normalize('swimming'), 'SWIMMING');
  assert.equal(Normalizer.normalize('weight training'), 'STRENGTH_TRAINING');
  assert.equal(Normalizer.normalize('padel'), 'PADEL');
});

test('4. unknown/open-ended activity remains without actionIdentity (returns null, never a guess)', () => {
  assert.equal(Normalizer.normalize('Pilates'), null);
  assert.equal(Normalizer.normalize('yoga'), null);
  assert.equal(Normalizer.normalize('an easy elliptical session'), null);
});

test('5. empty/null/non-string input returns null, never throws', () => {
  assert.equal(Normalizer.normalize(''), null);
  assert.equal(Normalizer.normalize('   '), null);
  assert.equal(Normalizer.normalize(null), null);
  assert.equal(Normalizer.normalize(undefined), null);
  assert.equal(Normalizer.normalize(42), null);
});

test('6. case/whitespace-insensitive matching', () => {
  assert.equal(Normalizer.normalize('  RUNNING  '), 'RUNNING');
  assert.equal(Normalizer.normalize('Walking'), 'WALKING');
});

test('7. NORMALIZATION_TABLE contains exactly the six existing MAI-001 tokens — no seventh entry, no ontology expansion', () => {
  assert.deepEqual(Object.keys(Normalizer.NORMALIZATION_TABLE).sort(), ActivityIdentityVocabulary.ACTIVITY_TOKENS.slice().sort());
});

test('8. never uses AI — module exposes no callClaude/configure/async surface of any kind', () => {
  assert.equal(typeof Normalizer.configure, 'undefined');
  assert.equal(Normalizer.normalize.constructor.name, 'Function'); // not AsyncFunction
});

test('9. multi-word forms match as an exact, whole, normalized phrase — never a fuzzy/partial match of unrelated text', () => {
  assert.equal(Normalizer.normalize('strength training'), 'STRENGTH_TRAINING');
  assert.equal(Normalizer.normalize('weight training'), 'STRENGTH_TRAINING');
  assert.equal(Normalizer.normalize('strengthening my resolve'), null); // must not fuzzily match "strength"
  assert.equal(Normalizer.normalize('I want strength training today'), null); // exact-phrase only, never substring
});
