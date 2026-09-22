// WP0 Phase A — Capability Registry contract tests (docs/specs/WP0_SPEC_v1.0.md §15/§16,
// Revision 3). Validates registration/validation, FALLBACK uniqueness, resolution matching,
// priority/tie-break, and the binding Round 3 item 3 required-context-failure behavior
// (terminate, never re-resolve against FALLBACK). Not wired into the live pipeline — no
// dependency on conversationalNeedCreator.js/internalPipelineOrchestrator.js.
// Run with: node --test tests/capabilityRegistry.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');

function validDeclaration(overrides) {
  return Object.assign({
    id: 'TEST_CAP',
    purpose: 'a test capability',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, priority: 10 },
    requiredContext: [],
    capabilityRiskTier: 'STANDARD',
    sensitiveContextAccessPolicy: 'NOT_AUTHORIZED',
    contextCeiling: [],
    availableTools: [],
    outputContract: 'STANDARD_PROPOSAL',
    safetyRequirements: { riskCharacteristicDimensions: [], mustPassFinalReview: true, riskTagsAreAdvisoryOnly: true },
    mutationPermissions: [],
    provenanceRequirements: { requiresExternalRetrieval: false }
  }, overrides || {});
}

test.beforeEach(() => { CapabilityRegistry.__resetForTests__(); ContextComposer.__resetForTests__(); });

test('register() accepts a well-formed CapabilityDeclaration', () => {
  const result = CapabilityRegistry.register(validDeclaration());
  assert.equal(result.ok, true);
  assert.ok(CapabilityRegistry.getById('TEST_CAP'));
});

test('register() rejects a missing/empty id', () => {
  const result = CapabilityRegistry.register(validDeclaration({ id: '' }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_ID');
});

test('register() rejects a duplicate id', () => {
  CapabilityRegistry.register(validDeclaration());
  const result = CapabilityRegistry.register(validDeclaration());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'DUPLICATE_ID');
});

test('register() rejects an invalid needShapes value (not "ANY" and not a NEED_SHAPES subset)', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    acceptedNeedCharacteristics: { needShapes: ['NOT_A_REAL_SHAPE'], scopeMatch: 'FALLBACK', priority: 0 }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_NEED_SHAPES');
});

test('register() rejects a non-integer priority', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 1.5 }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_PRIORITY');
});

test('register() rejects outputContract values other than exactly "STANDARD_PROPOSAL"', () => {
  const result = CapabilityRegistry.register(validDeclaration({ outputContract: 'SOMETHING_ELSE' }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_OUTPUT_CONTRACT');
});

test('register() rejects safetyRequirements.mustPassFinalReview !== true', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    safetyRequirements: { riskCharacteristicDimensions: [], mustPassFinalReview: false, riskTagsAreAdvisoryOnly: true }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_MUST_PASS_FINAL_REVIEW');
});

test('register() rejects safetyRequirements.riskTagsAreAdvisoryOnly !== true (§27 Round 2 correction 3)', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    safetyRequirements: { riskCharacteristicDimensions: [], mustPassFinalReview: true, riskTagsAreAdvisoryOnly: false }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_RISK_TAGS_ADVISORY_FLAG');
});

test('register() rejects a missing/invalid capabilityRiskTier (WP0 Phase E.0.2a §05.2)', () => {
  const result = CapabilityRegistry.register(validDeclaration({ capabilityRiskTier: 'NOT_A_REAL_TIER' }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_CAPABILITY_RISK_TIER');
});

test('register() rejects capabilityRiskTier entirely omitted — no implicit default (WP0 Phase E.0.2a §05.2)', () => {
  const decl = validDeclaration();
  delete decl.capabilityRiskTier;
  const result = CapabilityRegistry.register(decl);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_CAPABILITY_RISK_TIER');
});

test('register() accepts both closed capabilityRiskTier values', () => {
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'STD', capabilityRiskTier: 'STANDARD' })).ok, true);
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'ELEV', capabilityRiskTier: 'ELEVATED' })).ok, true);
});

test('register() rejects a missing/invalid sensitiveContextAccessPolicy — registration fails closed entirely (WP0 Phase E.0.2a §09/§12, binding Product/Architecture correction)', () => {
  const result = CapabilityRegistry.register(validDeclaration({ sensitiveContextAccessPolicy: 'MAYBE' }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_SENSITIVE_CONTEXT_ACCESS_POLICY');
});

test('register() rejects sensitiveContextAccessPolicy entirely omitted — no implicit default, the strongest fail-closed posture (WP0 Phase E.0.2a §09)', () => {
  const decl = validDeclaration();
  delete decl.sensitiveContextAccessPolicy;
  const result = CapabilityRegistry.register(decl);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_SENSITIVE_CONTEXT_ACCESS_POLICY');
  assert.equal(CapabilityRegistry.getById('TEST_CAP'), null, 'an unreviewed capability must never enter the registry');
});

test('register() accepts both closed sensitiveContextAccessPolicy values, independently of capabilityRiskTier (root-cause regression proof, WP0 Phase E.0.2a §09/§10/§11)', () => {
  // Every one of the four combinations must be independently accepted — sensitiveContextAccessPolicy
  // must never be inferred from, or rejected because of, capabilityRiskTier's own value.
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'C1', capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' })).ok, true);
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'C2', capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' })).ok, true);
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'C3', capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: 'AUTHORIZED' })).ok, true);
  assert.equal(CapabilityRegistry.register(validDeclaration({ id: 'C4', capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' })).ok, true);
});

test('CAPABILITY_RISK_TIERS and SENSITIVE_CONTEXT_ACCESS_POLICIES are the exact, frozen closed vocabularies (WP0 Phase E.0.2a §05.2/§09)', () => {
  assert.deepEqual(CapabilityRegistry.CAPABILITY_RISK_TIERS, ['STANDARD', 'ELEVATED']);
  assert.ok(Object.isFrozen(CapabilityRegistry.CAPABILITY_RISK_TIERS));
  assert.deepEqual(CapabilityRegistry.SENSITIVE_CONTEXT_ACCESS_POLICIES, ['AUTHORIZED', 'NOT_AUTHORIZED']);
  assert.ok(Object.isFrozen(CapabilityRegistry.SENSITIVE_CONTEXT_ACCESS_POLICIES));
});

test('register() rejects a contextBaseline id not present in contextCeiling', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    contextCeiling: ['a'],
    contextBaseline: ['b']
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'BASELINE_OUTSIDE_CEILING');
});

test('register() rejects a needShapeDefaults key that is not a NEED_SHAPES member', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    contextCeiling: ['a'],
    needShapeDefaults: { NOT_A_SHAPE: ['a'] }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_NEED_SHAPE_DEFAULT_KEY');
});

test('register() rejects a needShapeDefaults id not present in contextCeiling', () => {
  const result = CapabilityRegistry.register(validDeclaration({
    contextCeiling: ['a'],
    needShapeDefaults: { DISCLOSURE: ['b'] }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'NEED_SHAPE_DEFAULT_OUTSIDE_CEILING');
});

test('FALLBACK uniqueness: a second scopeMatch:"FALLBACK" registration is rejected', () => {
  const first = CapabilityRegistry.register(validDeclaration({
    id: 'FIRST_FALLBACK',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  assert.equal(first.ok, true);
  const second = CapabilityRegistry.register(validDeclaration({
    id: 'SECOND_FALLBACK',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  assert.equal(second.ok, false);
  assert.equal(second.error.code, 'DUPLICATE_FALLBACK');
  assert.equal(CapabilityRegistry.getFallback().id, 'FIRST_FALLBACK');
});

test('resolve(): a need with no matching non-FALLBACK capability resolves to FALLBACK', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'SPECIFIC',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, priority: 100 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION', legacyScopeMatch: null });
  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.capability.id, 'FALLBACK_CAP');
});

test('resolve(): a need matching a specific capability\'s legacyScopeMatch resolves to it, not FALLBACK', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'SPECIFIC',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, priority: 100 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION', legacyScopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } });
  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.capability.id, 'SPECIFIC');
});

test('resolve(): a null/absent legacyScopeMatch never matches a {domain,topic} capability (open-world Need still resolves via FALLBACK, never rejected)', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'SPECIFIC',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, priority: 100 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  // §13 Round 2 correction 1: a never-enumerated concept produces legacyScopeMatch:null, not a
  // rejected/failed Need — this must still resolve, never error.
  const result = await CapabilityRegistry.resolve({ shape: 'RECOMMENDATION_REQUEST', legacyScopeMatch: null, openScopeDescription: 'padel prep' });
  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.capability.id, 'FALLBACK_CAP');
});

test('resolve(): needShapes array-membership matching — a capability scoped to specific shapes does not match an unlisted shape', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'NARROW',
    acceptedNeedCharacteristics: { needShapes: ['DISCLOSURE'], scopeMatch: { domain: 'X', topic: 'Y' }, priority: 100 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'PLANNING', legacyScopeMatch: { domain: 'X', topic: 'Y' } });
  assert.equal(result.capability.id, 'FALLBACK_CAP'); // shape mismatch → falls through to FALLBACK
});

test('resolve(): MULTI_NEED array shape matches if any declared shape overlaps', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'NARROW',
    acceptedNeedCharacteristics: { needShapes: ['DISCLOSURE'], scopeMatch: { domain: 'X', topic: 'Y' }, priority: 100 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: ['PLANNING', 'DISCLOSURE'], legacyScopeMatch: { domain: 'X', topic: 'Y' } });
  assert.equal(result.capability.id, 'NARROW');
});

test('resolve(): higher priority wins among multiple non-FALLBACK matches', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'LOW_PRIORITY',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: function () { return true; }, priority: 1 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'HIGH_PRIORITY',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: function () { return true; }, priority: 100 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION' });
  assert.equal(result.capability.id, 'HIGH_PRIORITY');
});

test('resolve(): equal-priority tie resolved by first-registered-wins (§39 resolved Engineering recommendation)', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'FIRST',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: function () { return true; }, priority: 5 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'SECOND',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: function () { return true; }, priority: 5 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION' });
  assert.equal(result.capability.id, 'FIRST');
});

test('resolve(): a matcher function that throws is treated as non-matching (fails closed, never throws upward)', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'THROWS',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: function () { throw new Error('boom'); }, priority: 100 }
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION' });
  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.capability.id, 'FALLBACK_CAP');
});

test('resolve(): no FALLBACK registered and no specific match → NO_FALLBACK_REGISTERED, never a thrown error', async () => {
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION' });
  assert.equal(result.status, 'NO_FALLBACK_REGISTERED');
  assert.equal(result.capability, null);
});

test('resolve(): required-context-unavailable — terminates as REQUIRED_CONTEXT_UNAVAILABLE and NEVER re-resolves against FALLBACK (§16 Round 3 item 3, binding)', async () => {
  ContextComposer.registerFragmentProvider({
    id: 'missingFragment',
    sensitivityTier: 'STANDARD',
    consentScope: null,
    invoke: () => ({ value: null, availability: 'UNAVAILABLE' })
  });
  let fallbackWasInvoked = false;
  CapabilityRegistry.register(validDeclaration({
    id: 'SPECIFIC',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, priority: 100 },
    requiredContext: ['missingFragment']
  }));
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 },
    requiredContext: [] // deliberately viable, so if resolve() ever silently fell through to it, this test would observe FALLBACK_CAP incorrectly "succeeding"
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION', legacyScopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } });
  assert.equal(result.status, 'REQUIRED_CONTEXT_UNAVAILABLE');
  assert.equal(result.capability.id, 'SPECIFIC'); // still the originally-matched capability, not FALLBACK
  assert.equal(result.missingContextId, 'missingFragment');
  assert.equal(result.context, null);
});

test('resolve(): a required fragment reported AVAILABLE is included in the resolved context', async () => {
  ContextComposer.registerFragmentProvider({
    id: 'presentFragment',
    sensitivityTier: 'STANDARD',
    consentScope: null,
    invoke: () => ({ value: 'hello', availability: 'AVAILABLE' })
  });
  CapabilityRegistry.register(validDeclaration({
    id: 'CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 },
    requiredContext: ['presentFragment']
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION' });
  assert.equal(result.status, 'RESOLVED');
  assert.deepEqual(result.context.presentFragment, { value: 'hello', availability: 'AVAILABLE' });
});

test('resolve(): optional context is bounded to the relevance-selected subset, not the full contextCeiling (the "not a full dump" proof)', async () => {
  ['fragA', 'fragB', 'fragC'].forEach((id) => {
    ContextComposer.registerFragmentProvider({ id, sensitivityTier: 'STANDARD', consentScope: null, invoke: () => ({ value: id, availability: 'AVAILABLE' }) });
  });
  CapabilityRegistry.register(validDeclaration({
    id: 'CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 },
    requiredContext: [],
    contextCeiling: ['fragA', 'fragB', 'fragC'],
    contextBaseline: ['fragA'] // only fragA is always-eligible; fragB/fragC require a match
  }));
  const result = await CapabilityRegistry.resolve({ shape: 'REQUEST_FOR_INFORMATION', openEntityMentions: [] });
  assert.equal(result.status, 'RESOLVED');
  assert.ok('fragA' in result.context);
  assert.ok(!('fragB' in result.context));
  assert.ok(!('fragC' in result.context));
});

test('__resetForTests__() clears all registrations including the FALLBACK slot', async () => {
  CapabilityRegistry.register(validDeclaration({
    id: 'FALLBACK_CAP',
    acceptedNeedCharacteristics: { needShapes: 'ANY', scopeMatch: 'FALLBACK', priority: 0 }
  }));
  assert.ok(CapabilityRegistry.getFallback());
  CapabilityRegistry.__resetForTests__();
  assert.equal(CapabilityRegistry.getFallback(), null);
  assert.deepEqual(CapabilityRegistry.getAll(), []);
});

test('NEED_SHAPES is the exact, exhaustive, frozen eight-value closed vocabulary (§14)', () => {
  assert.deepEqual(CapabilityRegistry.NEED_SHAPES, [
    'REQUEST_FOR_ACTION', 'REQUEST_FOR_INFORMATION', 'DISCLOSURE', 'PLANNING',
    'COMPARISON', 'RECOMMENDATION_REQUEST', 'FOLLOW_UP', 'MULTI_NEED'
  ]);
  assert.ok(Object.isFrozen(CapabilityRegistry.NEED_SHAPES));
});
