// REM-003 — Authority Contract tests.
// Dependency-free: Node's built-in test runner + assert only.
// Run with: node --test tests/authorityContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const AuthorityContract = require('../js/authorityContract.js');

test('1. known authority sources are exposed and immutable', () => {
  assert.equal(AuthorityContract.AUTHORITY_SOURCES.USER_DECLARATION, 'USER_DECLARATION');
  assert.equal(AuthorityContract.AUTHORITY_SOURCES.USER_CONFIRMED_AI_ESTIMATE, 'USER_CONFIRMED_AI_ESTIMATE');
  assert.equal(AuthorityContract.AUTHORITY_SOURCES.HABIT_ENGINE, 'HABIT_ENGINE');
  assert.equal(AuthorityContract.AUTHORITY_SOURCES.PATTERN_ENGINE, 'PATTERN_ENGINE');
  assert.equal(Object.isFrozen(AuthorityContract.AUTHORITY_SOURCES), true);
  AuthorityContract.AUTHORITY_SOURCES.NEW_ONE = 'x'; // silently ignored (frozen, non-strict caller)
  assert.equal(AuthorityContract.AUTHORITY_SOURCES.NEW_ONE, undefined);
});

test('2. buildAuthorityMetadata sets isAuthoritative=true for a real authority source', () => {
  const m = AuthorityContract.buildAuthorityMetadata({
    source: AuthorityContract.AUTHORITY_SOURCES.USER_CONFIRMED_AI_ESTIMATE,
    createdBy: 'uid123', rule: 'addMeal.v1', systemVersion: '2.20.0', now: 1000
  });
  assert.equal(m.authoritySource, 'USER_CONFIRMED_AI_ESTIMATE');
  assert.equal(m.isAuthoritative, true);
  assert.equal(m.createdBy, 'uid123');
  assert.equal(m.rule, 'addMeal.v1');
  assert.equal(m.systemVersion, '2.20.0');
  assert.equal(m.createdAt, 1000);
});

test('3. buildAuthorityMetadata rejects unknown source strings (defense in depth)', () => {
  const m = AuthorityContract.buildAuthorityMetadata({ source: 'SOMETHING_MADE_UP', now: 1 });
  assert.equal(m.authoritySource, null);
  assert.equal(m.isAuthoritative, false);
});

test('4. buildAuthorityMetadata with GENERATIVE source is never authoritative', () => {
  const m = AuthorityContract.buildAuthorityMetadata({ source: AuthorityContract.AUTHORITY_SOURCES.GENERATIVE, now: 1 });
  assert.equal(m.isAuthoritative, false);
});

test('5. buildGenerativeMetadata always marks content as non-authoritative Generative', () => {
  const m = AuthorityContract.buildGenerativeMetadata({ systemVersion: '2.20.0', now: 500 });
  assert.equal(m.authoritySource, 'GENERATIVE');
  assert.equal(m.isAuthoritative, false);
  assert.equal(m.systemVersion, '2.20.0');
  assert.equal(m.createdAt, 500);
});

test('6. determinism: same input always returns the same output shape', () => {
  const input = { source: 'HABIT_ENGINE', createdBy: 'u', rule: 'r', systemVersion: 'v', now: 42 };
  const a = AuthorityContract.buildAuthorityMetadata(input);
  const b = AuthorityContract.buildAuthorityMetadata(input);
  assert.deepEqual(a, b);
});

test('7. missing/omitted fields default safely without throwing', () => {
  assert.doesNotThrow(() => AuthorityContract.buildAuthorityMetadata());
  assert.doesNotThrow(() => AuthorityContract.buildGenerativeMetadata());
  const m = AuthorityContract.buildAuthorityMetadata();
  assert.equal(m.authoritySource, null);
  assert.equal(m.createdBy, null);
  assert.equal(m.rule, null);
  assert.equal(typeof m.createdAt, 'number');
});
