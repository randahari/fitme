// WP0 Phase E.0.2a — Eligibility Policy contract tests
// (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md §10/§11/§12).
// Validates the full reasoningAccessAuthorized decision table (§11), every row of the
// conservative missing/malformed behavior table (§12), and — the direct regression test for the
// Narrow Contract Review's root-cause correction — that reasoningAccessAuthorized is provably
// independent of capabilityRiskTier.
// SHADOW-MODE ONLY: this module is not called by any production runtime path in E.0.2a; these
// tests exercise it directly, exactly as the SPEC's own zero-drift proof (a separate test file)
// will.
// Run with: node --test tests/eligibilityPolicy.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const EligibilityPolicy = require('../js/coachDecisionSystem/eligibilityPolicy.js');

function provider(overrides) {
  return Object.assign({ id: 'p', sensitivityTier: 'STANDARD', consentScope: null }, overrides || {});
}
function capability(overrides) {
  return Object.assign({ id: 'c', capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' }, overrides || {});
}

// ══════════════════════════════════════════════════════════════════
// §11 — the reasoningAccessAuthorized decision table
// ══════════════════════════════════════════════════════════════════

test('eligible===false → reasoningAccessAuthorized===false (consent missing)', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const c = capability();
  const result = EligibilityPolicy.computeEligibility(p, c, {});
  assert.equal(result.eligible, false);
  assert.equal(result.reasoningAccessAuthorized, false);
});

test('STANDARD sensitivityTier, eligible → reasoningAccessAuthorized===true regardless of sensitiveContextAccessPolicy', () => {
  const p = provider({ sensitivityTier: 'STANDARD' });
  assert.equal(EligibilityPolicy.computeEligibility(p, capability({ sensitiveContextAccessPolicy: 'AUTHORIZED' }), {}).reasoningAccessAuthorized, true);
  assert.equal(EligibilityPolicy.computeEligibility(p, capability({ sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' }), {}).reasoningAccessAuthorized, true);
});

test('SAFETY_ADJACENT sensitivityTier, capability AUTHORIZED, eligible → reasoningAccessAuthorized===true', () => {
  const p = provider({ sensitivityTier: 'SAFETY_ADJACENT' });
  const c = capability({ sensitiveContextAccessPolicy: 'AUTHORIZED' });
  assert.equal(EligibilityPolicy.computeEligibility(p, c, {}).reasoningAccessAuthorized, true);
});

test('SAFETY_ADJACENT sensitivityTier, capability NOT_AUTHORIZED, eligible → reasoningAccessAuthorized===false', () => {
  const p = provider({ sensitivityTier: 'SAFETY_ADJACENT' });
  const c = capability({ sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' });
  assert.equal(EligibilityPolicy.computeEligibility(p, c, {}).reasoningAccessAuthorized, false);
});

// ══════════════════════════════════════════════════════════════════
// Root-cause regression proof (Narrow Contract Review): reasoningAccessAuthorized for a
// SAFETY_ADJACENT provider must be IDENTICAL regardless of capabilityRiskTier's value — the
// direct test for "capability risk classification != sensitive-context authorization".
// ══════════════════════════════════════════════════════════════════

test('reasoningAccessAuthorized is identical for STANDARD and ELEVATED capabilityRiskTier, given the same sensitiveContextAccessPolicy (root-cause regression proof)', () => {
  const p = provider({ sensitivityTier: 'SAFETY_ADJACENT' });
  ['AUTHORIZED', 'NOT_AUTHORIZED'].forEach((policy) => {
    const standardResult = EligibilityPolicy.computeEligibility(p, capability({ capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: policy }), {});
    const elevatedResult = EligibilityPolicy.computeEligibility(p, capability({ capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: policy }), {});
    assert.equal(standardResult.reasoningAccessAuthorized, elevatedResult.reasoningAccessAuthorized,
      'reasoningAccessAuthorized must not depend on capabilityRiskTier for policy=' + policy);
  });
});

test('eligibilityPolicy.js source contains no reference to capability.capabilityRiskTier inside reasoningAccessAuthorized (structural proof)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/eligibilityPolicy.js'), 'utf8');
  const fnStart = src.indexOf('function reasoningAccessAuthorized');
  const fnEnd = src.indexOf('\n  }', fnStart);
  const fnBody = src.slice(fnStart, fnEnd);
  assert.ok(!/capabilityRiskTier/.test(fnBody), 'reasoningAccessAuthorized() must never read capabilityRiskTier');
});

// ══════════════════════════════════════════════════════════════════
// §12 — Conservative Missing/Malformed Behavior
// ══════════════════════════════════════════════════════════════════

test('missing/outside-enum sensitivityTier → eligible=false, reasoningAccessAuthorized=false (never defaults to STANDARD)', () => {
  const p = provider({ sensitivityTier: undefined });
  const result = EligibilityPolicy.computeEligibility(p, capability(), {});
  assert.equal(result.eligible, false);
  assert.equal(result.reasoningAccessAuthorized, false);

  const p2 = provider({ sensitivityTier: 'INVENTED' });
  assert.equal(EligibilityPolicy.computeEligibility(p2, capability(), {}).eligible, false);
});

test('missing/outside-enum capabilityRiskTier → eligible=false, reasoningAccessAuthorized=false', () => {
  const c = capability({ capabilityRiskTier: undefined });
  const result = EligibilityPolicy.computeEligibility(provider(), c, {});
  assert.equal(result.eligible, false);
  assert.equal(result.reasoningAccessAuthorized, false);

  const c2 = capability({ capabilityRiskTier: 'INVENTED' });
  assert.equal(EligibilityPolicy.computeEligibility(provider(), c2, {}).eligible, false);
});

test('consentScope not null and not registered → eligible=false', () => {
  const p = provider({ consentScope: 'NOT_A_REGISTERED_SCOPE' });
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), {}).eligible, false);
});

test('consentScope valid but no matching entry in consentState → eligible=false', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), {}).eligible, false);
});

test('matching consent entry exists but granted !== true → eligible=false', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: false } };
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), consentState).eligible, false);
});

test('matching consent entry granted===true → eligible=true (for a STANDARD, otherwise-valid provider/capability)', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } };
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), consentState).eligible, true);
});

test('matching consent entry granted===true but expiresAt in the past → eligible=false', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, expiresAt: Date.now() - 1000 } };
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), consentState).eligible, false);
});

test('matching consent entry granted===true, expiresAt in the future → eligible=true', () => {
  const p = provider({ consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, expiresAt: Date.now() + 1000 * 60 * 60 } };
  assert.equal(EligibilityPolicy.computeEligibility(p, capability(), consentState).eligible, true);
});

test('malformed provider/capability (null, non-object) never throws, resolves to ineligible', () => {
  assert.doesNotThrow(() => EligibilityPolicy.computeEligibility(null, capability(), {}));
  assert.equal(EligibilityPolicy.computeEligibility(null, capability(), {}).eligible, false);
  assert.doesNotThrow(() => EligibilityPolicy.computeEligibility(provider(), undefined, {}));
  assert.equal(EligibilityPolicy.computeEligibility(provider(), undefined, {}).eligible, false);
});

test('computeEligibility() return value is frozen (never mutated by a caller)', () => {
  const result = EligibilityPolicy.computeEligibility(provider(), capability(), {});
  assert.ok(Object.isFrozen(result));
});

// ══════════════════════════════════════════════════════════════════
// §08.2 — deriveConsentStateFromProfile() migration of memoryConsent.granted
// ══════════════════════════════════════════════════════════════════

test('deriveConsentStateFromProfile() maps memoryConsent.granted===true to a granted LEARNED_MEMORY_PERSONALIZATION entry', () => {
  const state = EligibilityPolicy.deriveConsentStateFromProfile({ memoryConsent: { granted: true } });
  assert.equal(state.LEARNED_MEMORY_PERSONALIZATION.granted, true);
  assert.equal(state.LEARNED_MEMORY_PERSONALIZATION.source, 'migrated');
});

test('deriveConsentStateFromProfile() maps memoryConsent.granted===false to a non-granted entry', () => {
  const state = EligibilityPolicy.deriveConsentStateFromProfile({ memoryConsent: { granted: false } });
  assert.equal(state.LEARNED_MEMORY_PERSONALIZATION.granted, false);
});

test('deriveConsentStateFromProfile() treats a missing memoryConsent/userProfile as not granted, never throws', () => {
  assert.equal(EligibilityPolicy.deriveConsentStateFromProfile({}).LEARNED_MEMORY_PERSONALIZATION.granted, false);
  assert.doesNotThrow(() => EligibilityPolicy.deriveConsentStateFromProfile(null));
  assert.equal(EligibilityPolicy.deriveConsentStateFromProfile(null).LEARNED_MEMORY_PERSONALIZATION.granted, false);
  assert.equal(EligibilityPolicy.deriveConsentStateFromProfile(undefined).LEARNED_MEMORY_PERSONALIZATION.granted, false);
});

// ══════════════════════════════════════════════════════════════════
// §10 — no id-based branching (structural proof, mirrors the SPEC's own Definition of Done item 7)
// ══════════════════════════════════════════════════════════════════

test('eligibilityPolicy.js source contains no provider.id or capability.id conditional of any kind (structural proof, §23 Definition of Done item 7)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/eligibilityPolicy.js'), 'utf8');
  assert.ok(!/provider\.id\s*===/.test(src));
  assert.ok(!/capability\.id\s*===/.test(src));
});
