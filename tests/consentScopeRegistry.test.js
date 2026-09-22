// WP0 Phase E.0.2a — Consent Scope Registry contract tests
// (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md §07). Validates the
// closed-but-deliberately-extensible registry a ContextFragmentProvider's own consentScope field
// must be validated against.
// Run with: node --test tests/consentScopeRegistry.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ConsentScopeRegistry = require('../js/coachDecisionSystem/consentScopeRegistry.js');

test('REGISTERED_CONSENT_SCOPES contains exactly the one scope registered as of E.0.2a, and is frozen', () => {
  assert.deepEqual(ConsentScopeRegistry.REGISTERED_CONSENT_SCOPES, ['LEARNED_MEMORY_PERSONALIZATION']);
  assert.ok(Object.isFrozen(ConsentScopeRegistry.REGISTERED_CONSENT_SCOPES));
});

test('isValidConsentScope(null) is true — an explicit, governed "no separate consent required" declaration', () => {
  assert.equal(ConsentScopeRegistry.isValidConsentScope(null), true);
});

test('isValidConsentScope() is true for a registered scope id', () => {
  assert.equal(ConsentScopeRegistry.isValidConsentScope('LEARNED_MEMORY_PERSONALIZATION'), true);
});

test('isValidConsentScope() is false for any unregistered string', () => {
  assert.equal(ConsentScopeRegistry.isValidConsentScope('WEARABLE_DEVICE_DATA'), false);
  assert.equal(ConsentScopeRegistry.isValidConsentScope('CALENDAR_INTEGRATION'), false);
  assert.equal(ConsentScopeRegistry.isValidConsentScope(''), false);
});

test('isValidConsentScope() is false for undefined (a missing field must never be silently treated as null)', () => {
  assert.equal(ConsentScopeRegistry.isValidConsentScope(undefined), false);
});

test('isValidConsentScope() is false for a non-string, non-null value', () => {
  assert.equal(ConsentScopeRegistry.isValidConsentScope(42), false);
  assert.equal(ConsentScopeRegistry.isValidConsentScope({}), false);
  assert.equal(ConsentScopeRegistry.isValidConsentScope(['LEARNED_MEMORY_PERSONALIZATION']), false);
});
