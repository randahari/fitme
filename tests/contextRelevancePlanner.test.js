// WP0 Phase A — Context Relevance Planner contract tests (docs/specs/WP0_SPEC_v1.0.md §18,
// Revision 3, Round 3 item 4). Validates the ceiling bound, baseline inclusion, per-NEED_SHAPES
// default subsets, relevance-tag overlap matching, and — the binding, non-negotiable
// invariant — that select() is a pure, synchronous, deterministic function containing no
// AI/model call of any kind.
// Run with: node --test tests/contextRelevancePlanner.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ContextRelevancePlanner = require('../js/coachDecisionSystem/contextRelevancePlanner.js');
const EligibilityPolicy = require('../js/coachDecisionSystem/eligibilityPolicy.js');

const plannerSource = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/contextRelevancePlanner.js'), 'utf8');

function makeProviderLookup(providersById) {
  return (id) => providersById[id] || null;
}

// WP0 Phase E.0.2a Activation Amendment §08 — a permissive authorization stub, used ONLY by
// tests below that exercise select()'s own PRE-EXISTING selection mechanics (baseline,
// needShapeDefaults, tag-overlap, ceiling bound) — a concern orthogonal to authorization, which
// is tested separately, with real EligibilityPolicy-backed fixtures, in the dedicated
// "Activation Amendment §08" test group at the end of this file. Naming it `authorizeAll` (never
// `isReasoningAccessAuthorized`) makes every call site below self-documenting: these tests are
// not claiming to prove authorization behavior.
function authorizeAll() { return true; }

test('select() never returns an id outside capability.contextCeiling, even when baseline/defaults reference one (defensive re-enforcement)', () => {
  const capability = {
    contextCeiling: ['a', 'b'],
    // Deliberately malformed input (would be rejected at registration by capabilityRegistry.js)
    // to prove select() enforces the bound independently, never merely trusting the caller.
    contextBaseline: ['a', 'z'],
    needShapeDefaults: { DISCLOSURE: ['b', 'y'] }
  };
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, capability, makeProviderLookup({ a: {}, b: {} }), authorizeAll);
  assert.deepEqual(selected.sort(), ['a', 'b']);
  assert.ok(!selected.includes('z'));
  assert.ok(!selected.includes('y'));
});

test('select() returns an empty array when contextCeiling is empty, regardless of other fields', () => {
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, { contextCeiling: [], contextBaseline: ['a'] }, makeProviderLookup({}));
  assert.deepEqual(selected, []);
});

test('select() always includes contextBaseline entries', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({ a: {} }), authorizeAll);
  assert.deepEqual(selected, ['a']);
});

test('select() includes the needShapeDefaults subset for a single Need shape', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: [], needShapeDefaults: { DISCLOSURE: ['b', 'c'] } };
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, capability, makeProviderLookup({ b: {}, c: {} }), authorizeAll);
  assert.deepEqual(selected.sort(), ['b', 'c']);
});

test('select() unions needShapeDefaults across a MULTI_NEED array shape', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: [], needShapeDefaults: { DISCLOSURE: ['a'], PLANNING: ['b'] } };
  const selected = ContextRelevancePlanner.select({ shape: ['DISCLOSURE', 'PLANNING'] }, capability, makeProviderLookup({ a: {}, b: {} }), authorizeAll);
  assert.deepEqual(selected.sort(), ['a', 'b']);
});

test('select() includes a fragment whose relevanceTags overlap the Need\'s openEntityMentions roughKind values', () => {
  const capability = { contextCeiling: ['nutritionFrag', 'trainingFrag'], contextBaseline: [], needShapeDefaults: {} };
  const providers = {
    nutritionFrag: { relevanceTags: ['food', 'nutrition'] },
    trainingFrag: { relevanceTags: ['activity', 'training'] }
  };
  const selected = ContextRelevancePlanner.select(
    { shape: 'RECOMMENDATION_REQUEST', openEntityMentions: [{ text: 'Pad Thai', roughKind: 'food' }] },
    capability, makeProviderLookup(providers), authorizeAll
  );
  assert.deepEqual(selected, ['nutritionFrag']);
});

test('select() excludes a fragment with no relevanceTags overlap and no baseline/default membership', () => {
  const capability = { contextCeiling: ['unrelatedFrag'], contextBaseline: [], needShapeDefaults: {} };
  const providers = { unrelatedFrag: { relevanceTags: ['weather'] } };
  const selected = ContextRelevancePlanner.select(
    { shape: 'RECOMMENDATION_REQUEST', openEntityMentions: [{ text: 'padel', roughKind: 'activity' }] },
    capability, makeProviderLookup(providers)
  );
  assert.deepEqual(selected, []);
});

test('select() degrades gracefully (empty selection beyond baseline) for a malformed/absent Need object', () => {
  const capability = { contextCeiling: ['a'], contextBaseline: [], needShapeDefaults: {} };
  assert.deepEqual(ContextRelevancePlanner.select(null, capability, makeProviderLookup({})), []);
  assert.deepEqual(ContextRelevancePlanner.select(undefined, capability, makeProviderLookup({})), []);
});

test('select() degrades gracefully for a malformed/absent capability object (empty array, never throws)', () => {
  assert.deepEqual(ContextRelevancePlanner.select({ shape: 'PLANNING' }, null, makeProviderLookup({})), []);
  assert.deepEqual(ContextRelevancePlanner.select({ shape: 'PLANNING' }, undefined, makeProviderLookup({})), []);
});

// WP0 Phase E.0.2a Activation Amendment §08/§10 — this test's own claim changed intentionally
// (pre-Amendment: "baseline/defaults still apply, tag-matching simply skipped"). Once
// reasoningAccessAuthorized became part of the SAME final filter baseline/needShapeDefaults
// entries must also pass, resolving a provider is now required to authorize ANY candidate,
// including baseline ones — omitting getFragmentProvider (or the authorization function) means
// no provider can be resolved for anyone, so nothing can be authorized, so nothing survives.
// This is the fail-closed behavior the Amendment requires (§10: "no permissive fallback"), not a
// regression — a baseline entry gets no special exemption from authorization.
test('select() fails closed to an empty array when getFragmentProvider is omitted — even a contextBaseline entry cannot be authorized without a resolvable provider', () => {
  const capability = { contextCeiling: ['a', 'b'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, undefined, authorizeAll);
  assert.deepEqual(selected, []);
});

test('select() fails closed to an empty array when isReasoningAccessAuthorized is omitted, even with a real getFragmentProvider and a real contextBaseline entry', () => {
  const capability = { contextCeiling: ['a', 'b'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({ a: {} }));
  assert.deepEqual(selected, []);
});

test('select() includes a contextBaseline entry when BOTH getFragmentProvider and isReasoningAccessAuthorized are genuinely supplied (the corrected, activation-aware positive case)', () => {
  const capability = { contextCeiling: ['a', 'b'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({ a: {} }), authorizeAll);
  assert.deepEqual(selected, ['a']);
});

test('select() is synchronous — its return value is a plain array, never a Promise (structural proof of "no AI call")', () => {
  const capability = { contextCeiling: ['a'], contextBaseline: ['a'], needShapeDefaults: {} };
  const result = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({}));
  assert.equal(result instanceof Promise, false);
  assert.ok(Array.isArray(result));
});

test('contextRelevancePlanner.js contains no callClaude call site, no configure() injection point, and no async keyword anywhere in its executable code (structural proof it is not, and cannot become, a reasoning engine — Round 3 item 4, binding)', () => {
  // Matches an actual call/reference site (callClaude followed by "(" or a property/variable
  // access), never the header comment's own prose explaining this absence.
  assert.ok(!/callClaude\s*[.(]/.test(plannerSource));
  assert.ok(!/function\s+configure\s*\(/.test(plannerSource));
  // Matches actual async function syntax (declaration or arrow), never the word "async" used
  // descriptively in a comment (e.g. this file's own header, which discusses why it is NOT
  // asynchronous).
  assert.ok(!/\basync\s+function\b/.test(plannerSource));
  assert.ok(!/\basync\s*\(/.test(plannerSource));
  assert.ok(!/\basync\s+[A-Za-z_$][\w$]*\s*=>/.test(plannerSource));
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// WP0 Phase E.0.2a Activation Amendment §08/§10 — dedicated authorization-filtering tests, using
// the REAL EligibilityPolicy.computeEligibility() algorithm (never a stub), proving select()'s
// own final filter genuinely enforces reasoningAccessAuthorized end-to-end, not merely that a
// caller-supplied function gets invoked.
// ══════════════════════════════════════════════════════════════════════════════════════════

function realIsAuthorized(capability, consentState) {
  return function (provider) {
    return EligibilityPolicy.computeEligibility(provider, capability, consentState).reasoningAccessAuthorized === true;
  };
}

test('Activation Amendment §08: a STANDARD-sensitivity provider is authorized regardless of capabilityRiskTier (root-cause regression — capabilityRiskTier must never be consulted for this decision)', () => {
  const provider = { id: 'p1', sensitivityTier: 'STANDARD', consentScope: null };
  const capability = { contextCeiling: ['p1'], contextBaseline: ['p1'], needShapeDefaults: {}, capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ p1: provider }), realIsAuthorized(capability, {}));
  assert.deepEqual(selected, ['p1']);
});

test('Activation Amendment §08: a SAFETY_ADJACENT provider is EXCLUDED when the capability\'s own sensitiveContextAccessPolicy is NOT_AUTHORIZED, even though it is a baseline entry', () => {
  const provider = { id: 'safetyFrag', sensitivityTier: 'SAFETY_ADJACENT', consentScope: null };
  const capability = { contextCeiling: ['safetyFrag'], contextBaseline: ['safetyFrag'], needShapeDefaults: {}, capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ safetyFrag: provider }), realIsAuthorized(capability, {}));
  assert.deepEqual(selected, [], 'a SAFETY_ADJACENT provider must never survive for a capability declared NOT_AUTHORIZED — baseline membership grants no exemption');
});

test('Activation Amendment §08: the SAME SAFETY_ADJACENT provider IS authorized when the capability\'s own sensitiveContextAccessPolicy is AUTHORIZED (proves the gate is the capability\'s own declaration, not a blanket denial)', () => {
  const provider = { id: 'safetyFrag', sensitivityTier: 'SAFETY_ADJACENT', consentScope: null };
  const capability = { contextCeiling: ['safetyFrag'], contextBaseline: ['safetyFrag'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ safetyFrag: provider }), realIsAuthorized(capability, {}));
  assert.deepEqual(selected, ['safetyFrag']);
});

test('Activation Amendment §09: real consent plumbing — a consentScope-bearing provider is included when the scope is GRANTED in a real ConsentState', () => {
  const provider = { id: 'consentFrag', sensitivityTier: 'STANDARD', consentScope: 'LEARNED_MEMORY_PERSONALIZATION' };
  const capability = { contextCeiling: ['consentFrag'], contextBaseline: ['consentFrag'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' };
  const grantedConsentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ consentFrag: provider }), realIsAuthorized(capability, grantedConsentState));
  assert.deepEqual(selected, ['consentFrag']);
});

test('Activation Amendment §09: real consent plumbing — the SAME consentScope-bearing provider is EXCLUDED when the scope is NOT granted in a real ConsentState (proves this is genuine plumbing, not hardcoded around today\'s all-null providers)', () => {
  const provider = { id: 'consentFrag', sensitivityTier: 'STANDARD', consentScope: 'LEARNED_MEMORY_PERSONALIZATION' };
  const capability = { contextCeiling: ['consentFrag'], contextBaseline: ['consentFrag'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' };
  const ungrantedConsentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: false, source: 'migrated' } };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ consentFrag: provider }), realIsAuthorized(capability, ungrantedConsentState));
  assert.deepEqual(selected, [], 'an ungranted consent scope must exclude the provider, never a permissive default');
});

test('Activation Amendment §10: fail-closed — a malformed (non-object) consentState excludes a consentScope-bearing provider, never admits it', () => {
  const provider = { id: 'consentFrag', sensitivityTier: 'STANDARD', consentScope: 'LEARNED_MEMORY_PERSONALIZATION' };
  const capability = { contextCeiling: ['consentFrag'], contextBaseline: ['consentFrag'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ consentFrag: provider }), realIsAuthorized(capability, 'not-an-object'));
  assert.deepEqual(selected, []);
});

test('Activation Amendment §10: fail-closed — a missing consentState (undefined) excludes a consentScope-bearing provider, never admits it', () => {
  const provider = { id: 'consentFrag', sensitivityTier: 'STANDARD', consentScope: 'LEARNED_MEMORY_PERSONALIZATION' };
  const capability = { contextCeiling: ['consentFrag'], contextBaseline: ['consentFrag'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, capability, makeProviderLookup({ consentFrag: provider }), realIsAuthorized(capability, undefined));
  assert.deepEqual(selected, []);
});

test('Activation Amendment §10: fail-closed — a null-consentScope provider is unaffected by consentState at all (eligible()\'s own short-circuit, unmodified), still gated correctly by sensitiveContextAccessPolicy', () => {
  const provider = { id: 'p1', sensitivityTier: 'SAFETY_ADJACENT', consentScope: null };
  const notAuthorizedCapability = { contextCeiling: ['p1'], contextBaseline: ['p1'], needShapeDefaults: {}, capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' };
  const selected = ContextRelevancePlanner.select({}, notAuthorizedCapability, makeProviderLookup({ p1: provider }), realIsAuthorized(notAuthorizedCapability, undefined));
  assert.deepEqual(selected, []);
});
