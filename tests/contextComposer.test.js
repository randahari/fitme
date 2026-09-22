// WP0 Phase A — Context Composer contract tests (docs/specs/WP0_SPEC_v1.0.md §17/§18,
// Revision 3). Validates ContextFragmentProvider registration, required-vs-optional assembly
// semantics, graceful degradation, and the binding "optional context is relevance-bounded, not
// the full ceiling" correction (Round 2 correction 2 / Round 3 item 4).
// WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
// §06) additionally validates the new required sensitivityTier/consentScope fields — every
// provider fixture below now declares them so pre-existing assertions remain byte-identical in
// outcome; new validation-rejection cases are added at the end of this file.
// Run with: node --test tests/contextComposer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');

test.beforeEach(() => { ContextComposer.__resetForTests__(); });

function capability(overrides) {
  return Object.assign({
    requiredContext: [],
    contextCeiling: [],
    contextBaseline: [],
    needShapeDefaults: {}
  }, overrides || {});
}

// WP0 Phase E.0.2a §06 — the two new required fields, valid-by-default, so every fixture below
// remains a well-formed ContextFragmentProvider unless a test deliberately overrides them.
function sensitivityFields(overrides) {
  return Object.assign({ sensitivityTier: 'STANDARD', consentScope: null }, overrides || {});
}

test('registerFragmentProvider() accepts a well-formed provider', () => {
  const result = ContextComposer.registerFragmentProvider(Object.assign({ id: 'a', invoke: () => ({ value: 1, availability: 'AVAILABLE' }) }, sensitivityFields()));
  assert.equal(result.ok, true);
  assert.ok(ContextComposer.getFragmentProvider('a'));
});

test('registerFragmentProvider() rejects a missing id', () => {
  const result = ContextComposer.registerFragmentProvider({ invoke: () => ({}) });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_ID');
});

test('registerFragmentProvider() rejects a non-function invoke', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: 'not a function' });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_INVOKE');
});

test('registerFragmentProvider() rejects a duplicate id', () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'a', invoke: () => ({}) }, sensitivityFields()));
  const result = ContextComposer.registerFragmentProvider(Object.assign({ id: 'a', invoke: () => ({}) }, sensitivityFields()));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'DUPLICATE_ID');
});

test('registerFragmentProvider() rejects non-array/non-string relevanceTags', () => {
  const result = ContextComposer.registerFragmentProvider(Object.assign({ id: 'a', invoke: () => ({}), relevanceTags: 'not-an-array' }, sensitivityFields()));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_RELEVANCE_TAGS');
});

test('getAllFragmentProviderIds() reflects registrations', () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'a', invoke: () => ({}) }, sensitivityFields()));
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'b', invoke: () => ({}) }, sensitivityFields()));
  assert.deepEqual(ContextComposer.getAllFragmentProviderIds().sort(), ['a', 'b']);
});

test('assemble(): a required fragment reporting UNAVAILABLE makes the capability non-viable, with the exact missingId', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => ({ value: null, availability: 'UNAVAILABLE' }) }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
  assert.equal(result.reason, 'REQUIRED_CONTEXT_UNAVAILABLE');
  assert.equal(result.missingId, 'req1');
});

test('assemble(): the FIRST unavailable required fragment short-circuits — a later required fragment is never invoked', async () => {
  let secondInvoked = false;
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => ({ value: null, availability: 'UNAVAILABLE' }) }, sensitivityFields()));
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req2', invoke: () => { secondInvoked = true; return { value: 1, availability: 'AVAILABLE' }; } }, sensitivityFields()));
  await ContextComposer.assemble({}, capability({ requiredContext: ['req1', 'req2'] }));
  assert.equal(secondInvoked, false);
});

test('assemble(): a required fragment reporting PARTIAL is treated as present (not UNAVAILABLE) and included', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => ({ value: 'partial-data', availability: 'PARTIAL' }) }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, true);
  assert.deepEqual(result.context.req1, { value: 'partial-data', availability: 'PARTIAL' });
});

test('assemble(): an unregistered fragment id degrades to UNAVAILABLE honestly, never throws', async () => {
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['neverRegistered'] }));
  assert.equal(result.viable, false);
  assert.equal(result.missingId, 'neverRegistered');
});

test('assemble(): a throwing invoke() degrades to UNAVAILABLE, never propagates the exception', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => { throw new Error('boom'); } }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
  assert.equal(result.missingId, 'req1');
});

test('assemble(): a malformed invoke() return shape degrades to UNAVAILABLE, never fabricates a value', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => ({ notValue: true }) }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
});

test('assemble(): an async (Promise-returning) invoke() is supported and awaited correctly', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({
    id: 'asyncFrag',
    invoke: () => new Promise((resolve) => setTimeout(() => resolve({ value: 'async-value', availability: 'AVAILABLE' }), 5))
  }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['asyncFrag'] }));
  assert.equal(result.viable, true);
  assert.equal(result.context.asyncFrag.value, 'async-value');
});

test('assemble(): with zero requiredContext and zero contextCeiling, always viable with an empty context', async () => {
  const result = await ContextComposer.assemble({}, capability());
  assert.equal(result.viable, true);
  assert.deepEqual(result.context, {});
});

test('assemble(): optional (baseline) fragments are included alongside required ones', async () => {
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'req1', invoke: () => ({ value: 'r', availability: 'AVAILABLE' }) }, sensitivityFields()));
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'opt1', invoke: () => ({ value: 'o', availability: 'AVAILABLE' }) }, sensitivityFields()));
  const result = await ContextComposer.assemble({}, capability({
    requiredContext: ['req1'],
    contextCeiling: ['opt1'],
    contextBaseline: ['opt1']
  }));
  assert.equal(result.viable, true);
  assert.ok('req1' in result.context);
  assert.ok('opt1' in result.context);
});

test('assemble(): optional context is bounded to the relevance-selected subset, never the full contextCeiling (Round 2 correction 2 / Round 3 item 4)', async () => {
  ['a', 'b', 'c'].forEach((id) => ContextComposer.registerFragmentProvider(Object.assign({ id, invoke: () => ({ value: id, availability: 'AVAILABLE' }) }, sensitivityFields())));
  const result = await ContextComposer.assemble(
    { shape: 'REQUEST_FOR_INFORMATION', openEntityMentions: [] },
    capability({ contextCeiling: ['a', 'b', 'c'], contextBaseline: ['a'] })
  );
  assert.equal(result.viable, true);
  assert.deepEqual(Object.keys(result.context), ['a']);
});

test('assemble(): a fragment id present in both requiredContext and the relevance-selected set is never double-invoked', async () => {
  let invokeCount = 0;
  ContextComposer.registerFragmentProvider(Object.assign({ id: 'shared', invoke: () => { invokeCount++; return { value: 1, availability: 'AVAILABLE' }; } }, sensitivityFields()));
  await ContextComposer.assemble(
    { shape: 'DISCLOSURE' },
    capability({ requiredContext: ['shared'], contextCeiling: ['shared'], contextBaseline: ['shared'] })
  );
  assert.equal(invokeCount, 1);
});

test('AVAILABILITY_VALUES is the exact, exhaustive, frozen three-value closed vocabulary', () => {
  assert.deepEqual(ContextComposer.AVAILABILITY_VALUES, ['AVAILABLE', 'UNAVAILABLE', 'PARTIAL']);
  assert.ok(Object.isFrozen(ContextComposer.AVAILABILITY_VALUES));
});

// ══════════════════════════════════════════════════════════════════
// WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
// §06) — sensitivityTier/consentScope validation.
// ══════════════════════════════════════════════════════════════════

test('SENSITIVITY_TIERS is the exact, frozen two-value closed vocabulary', () => {
  assert.deepEqual(ContextComposer.SENSITIVITY_TIERS, ['STANDARD', 'SAFETY_ADJACENT']);
  assert.ok(Object.isFrozen(ContextComposer.SENSITIVITY_TIERS));
});

test('registerFragmentProvider() rejects a missing sensitivityTier — no implicit default', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), consentScope: null });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_SENSITIVITY_TIER');
});

test('registerFragmentProvider() rejects a sensitivityTier outside the closed vocabulary', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'HIGHLY_SENSITIVE', consentScope: null });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_SENSITIVITY_TIER');
});

test('registerFragmentProvider() accepts both closed sensitivityTier values', () => {
  assert.equal(ContextComposer.registerFragmentProvider({ id: 'std', invoke: () => ({}), sensitivityTier: 'STANDARD', consentScope: null }).ok, true);
  assert.equal(ContextComposer.registerFragmentProvider({ id: 'adj', invoke: () => ({}), sensitivityTier: 'SAFETY_ADJACENT', consentScope: null }).ok, true);
});

test('registerFragmentProvider() rejects a missing consentScope — no implicit default (null must be explicit)', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'STANDARD' });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_CONSENT_SCOPE');
});

test('registerFragmentProvider() accepts an explicit null consentScope', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'STANDARD', consentScope: null });
  assert.equal(result.ok, true);
});

test('registerFragmentProvider() rejects an unregistered consentScope id', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'STANDARD', consentScope: 'NOT_A_REGISTERED_SCOPE' });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_CONSENT_SCOPE');
});

test('registerFragmentProvider() accepts a registered consentScope id', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'STANDARD', consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  assert.equal(result.ok, true);
});

test('getFragmentProvider() reflects the stored sensitivityTier/consentScope verbatim', () => {
  ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), sensitivityTier: 'SAFETY_ADJACENT', consentScope: null });
  const provider = ContextComposer.getFragmentProvider('a');
  assert.equal(provider.sensitivityTier, 'SAFETY_ADJACENT');
  assert.equal(provider.consentScope, null);
});
