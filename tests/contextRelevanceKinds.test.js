// WP0 Phase E.0.1 — Governed Context Need Planning Foundation: Taxonomy + Deterministic
// Validation contract tests. Validates the closed CONTEXT_RELEVANCE_KINDS vocabulary, the
// tightened ContextFragmentProvider.relevanceTags registration gate, that existing provider
// registrations (TRR, GeneralReasoning) remain valid after migration onto the canonical
// taxonomy, and that ContextRelevancePlanner's own selection logic and CapabilityRegistry's
// contextCeiling authority are structurally unchanged by this Phase.
// Run with: node --test tests/contextRelevanceKinds.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');
const ContextRelevancePlanner = require('../js/coachDecisionSystem/contextRelevancePlanner.js');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
const GeneralReasoningCapability = require('../js/coachDecisionSystem/generalReasoningCapability.js');

const plannerSource = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/contextRelevancePlanner.js'), 'utf8');

test.beforeEach(() => {
  ContextComposer.__resetForTests__();
  CapabilityRegistry.__resetForTests__();
});

test('CONTEXT_RELEVANCE_KINDS is the exact, exhaustive, frozen 8-member canonical taxonomy', () => {
  assert.deepEqual(ContextComposer.CONTEXT_RELEVANCE_KINDS, [
    'CURRENT_PHYSICAL_STATE',
    'BEHAVIORAL_HISTORY',
    'GOALS_AND_INTENT',
    'PREFERENCES_AND_BOUNDARIES',
    'SAFETY_AND_MEDICAL',
    'SITUATIONAL_CONTEXT',
    'RELATIONSHIP_CONTEXT',
    'RECENT_INTERACTION'
  ]);
  assert.ok(Object.isFrozen(ContextComposer.CONTEXT_RELEVANCE_KINDS));
});

test('registerFragmentProvider() accepts each of the 8 canonical kinds individually', () => {
  ContextComposer.CONTEXT_RELEVANCE_KINDS.forEach((kind, i) => {
    const result = ContextComposer.registerFragmentProvider({
      id: 'provider_' + i,
      relevanceTags: [kind],
      sensitivityTier: 'STANDARD',
      consentScope: null,
      invoke: () => ({ value: null, availability: 'UNAVAILABLE' })
    });
    assert.equal(result.ok, true, 'kind ' + kind + ' should be accepted');
  });
});

test('registerFragmentProvider() rejects a relevanceTags entry that is not a canonical kind', () => {
  const result = ContextComposer.registerFragmentProvider({
    id: 'bad',
    relevanceTags: ['NOT_A_CANONICAL_KIND'],
    sensitivityTier: 'STANDARD',
    consentScope: null,
    invoke: () => ({})
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_RELEVANCE_TAG');
});

test('registerFragmentProvider() rejects an arbitrary world-concept tag (e.g. a food/sport name), never treating it as a valid relevance kind', () => {
  ['football', 'skiing', 'bouldering', 'Pad Thai', 'Mykonos', 'nutrition', 'training', 'food'].forEach((worldConcept) => {
    const result = ContextComposer.registerFragmentProvider({
      id: 'wc_' + worldConcept,
      relevanceTags: [worldConcept],
      sensitivityTier: 'STANDARD',
      consentScope: null,
      invoke: () => ({})
    });
    assert.equal(result.ok, false, worldConcept + ' must be rejected as a relevance kind');
    assert.equal(result.error.code, 'INVALID_RELEVANCE_TAG');
  });
});

test('registerFragmentProvider() rejects malformed relevanceTags (non-array/non-string entries) — unchanged from Phase A', () => {
  const nonArray = ContextComposer.registerFragmentProvider({ id: 'a', relevanceTags: 'not-an-array', sensitivityTier: 'STANDARD', consentScope: null, invoke: () => ({}) });
  assert.equal(nonArray.ok, false);
  assert.equal(nonArray.error.code, 'INVALID_RELEVANCE_TAGS');

  const mixedArray = ContextComposer.registerFragmentProvider({ id: 'b', relevanceTags: ['SAFETY_AND_MEDICAL', 42], sensitivityTier: 'STANDARD', consentScope: null, invoke: () => ({}) });
  assert.equal(mixedArray.ok, false);
  assert.equal(mixedArray.error.code, 'INVALID_RELEVANCE_TAGS');
});

test('registerFragmentProvider() accepts a provider declaring multiple valid canonical kinds', () => {
  const result = ContextComposer.registerFragmentProvider({
    id: 'multiKind',
    relevanceTags: ['CURRENT_PHYSICAL_STATE', 'SITUATIONAL_CONTEXT'],
    sensitivityTier: 'STANDARD',
    consentScope: null,
    invoke: () => ({ value: null, availability: 'UNAVAILABLE' })
  });
  assert.equal(result.ok, true);
  assert.deepEqual(ContextComposer.getFragmentProvider('multiKind').relevanceTags, ['CURRENT_PHYSICAL_STATE', 'SITUATIONAL_CONTEXT']);
});

test('registerFragmentProvider() still accepts a provider with no relevanceTags at all', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'noTags', sensitivityTier: 'STANDARD', consentScope: null, invoke: () => ({}) });
  assert.equal(result.ok, true);
  assert.deepEqual(ContextComposer.getFragmentProvider('noTags').relevanceTags, []);
});

test('isValidRelevanceKind()/isValidRelevanceTags() helpers are exposed and behave correctly', () => {
  assert.equal(ContextComposer.isValidRelevanceKind('SAFETY_AND_MEDICAL'), true);
  assert.equal(ContextComposer.isValidRelevanceKind('football'), false);
  assert.equal(ContextComposer.isValidRelevanceKind(''), false);
  assert.equal(ContextComposer.isValidRelevanceKind(null), false);
  assert.equal(ContextComposer.isValidRelevanceTags(['SAFETY_AND_MEDICAL', 'GOALS_AND_INTENT']), true);
  assert.equal(ContextComposer.isValidRelevanceTags(['SAFETY_AND_MEDICAL', 'football']), false);
  assert.equal(ContextComposer.isValidRelevanceTags([]), true);
  assert.equal(ContextComposer.isValidRelevanceTags('not-an-array'), false);
});

test('TrrCapabilityAdapter.registerAll() still succeeds after relevanceTags migration onto the canonical taxonomy', () => {
  const result = TrrCapabilityAdapter.registerAll();
  assert.equal(result.ok, true);
  TrrCapabilityAdapter.TRR_CONTEXT_FIELD_IDS.forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.ok(provider, 'provider ' + id + ' should be registered');
    assert.ok(ContextComposer.isValidRelevanceTags(provider.relevanceTags), 'provider ' + id + ' relevanceTags must be canonical');
  });
});

test('TRR provider relevanceTags map onto the approved canonical kinds exactly', () => {
  TrrCapabilityAdapter.registerAll();
  const expected = {
    readinessStateContext: ['CURRENT_PHYSICAL_STATE'],
    userSafetyContext: ['SAFETY_AND_MEDICAL'],
    userSafetyProvenance: ['SAFETY_AND_MEDICAL'],
    explicitRequestControls: ['PREFERENCES_AND_BOUNDARIES'],
    activityPreference: ['PREFERENCES_AND_BOUNDARIES'],
    recentConversationContext: ['RECENT_INTERACTION']
  };
  Object.keys(expected).forEach((id) => {
    assert.deepEqual(ContextComposer.getFragmentProvider(id).relevanceTags, expected[id]);
  });
});

test('GeneralReasoningCapability.registerAll() still succeeds after relevanceTags migration onto the canonical taxonomy', () => {
  TrrCapabilityAdapter.registerAll(); // GeneralReasoning's ceiling reuses TRR's already-catalogued providers
  const result = GeneralReasoningCapability.registerAll();
  assert.equal(result.ok, true);
  ['currentStateContext', 'goalObjectiveContext'].forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.ok(provider, 'provider ' + id + ' should be registered');
    assert.ok(ContextComposer.isValidRelevanceTags(provider.relevanceTags), 'provider ' + id + ' relevanceTags must be canonical');
  });
  assert.deepEqual(ContextComposer.getFragmentProvider('currentStateContext').relevanceTags, ['CURRENT_PHYSICAL_STATE']);
  assert.deepEqual(ContextComposer.getFragmentProvider('goalObjectiveContext').relevanceTags, ['GOALS_AND_INTENT']);
});

test('both adapters register together (production wiring order) without any relevanceTags rejection', () => {
  const trrResult = TrrCapabilityAdapter.registerAll();
  const grResult = GeneralReasoningCapability.registerAll();
  assert.equal(trrResult.ok, true);
  assert.equal(grResult.ok, true);
  assert.ok(CapabilityRegistry.getById('TRR'));
  assert.ok(CapabilityRegistry.getById('GENERAL_REASONING'));
});

test('ContextRelevancePlanner.select() logic is structurally unchanged — still contains no callClaude, configure(), or async code (Round 3 item 4, binding)', () => {
  assert.ok(!/callClaude\s*[.(]/.test(plannerSource));
  assert.ok(!/function\s+configure\s*\(/.test(plannerSource));
  assert.ok(!/\basync\s+function\b/.test(plannerSource));
  assert.ok(!/\basync\s*\(/.test(plannerSource));
  assert.ok(!/\basync\s+[A-Za-z_$][\w$]*\s*=>/.test(plannerSource));
});

test('ContextRelevancePlanner.select() still performs plain tag-overlap matching, with no awareness of CONTEXT_RELEVANCE_KINDS itself (its own contract is unaffected by the new taxonomy)', () => {
  // A provider whose relevanceTags happen to overlap the Need's roughKinds is still selected,
  // even though neither the tag nor the roughKind is a canonical CONTEXT_RELEVANCE_KINDS value —
  // select() itself was NOT changed and does not validate against the taxonomy (only
  // ContextComposer.registerFragmentProvider() does, at registration time).
  const capability = { contextCeiling: ['legacyShapedFrag'], contextBaseline: [], needShapeDefaults: {} };
  const providers = { legacyShapedFrag: { relevanceTags: ['some-non-canonical-tag'] } };
  const selected = ContextRelevancePlanner.select(
    { shape: 'RECOMMENDATION_REQUEST', openEntityMentions: [{ text: 'x', roughKind: 'some-non-canonical-tag' }] },
    capability,
    (id) => providers[id] || null,
    // WP0 Phase E.0.2a Activation Amendment §08 — a permissive authorization stub; this test's
    // own subject is the tag-overlap SELECTION mechanism, unaffected by and orthogonal to the
    // authorization concern (exhaustively covered separately in
    // tests/contextRelevancePlanner.test.js's own dedicated "Activation Amendment" group).
    function () { return true; }
  );
  assert.deepEqual(selected, ['legacyShapedFrag']);
});

test('CapabilityRegistry contextCeiling remains the authoritative bound — a migrated capability\'s registered contextCeiling is unchanged by the relevanceTags migration', () => {
  TrrCapabilityAdapter.registerAll();
  GeneralReasoningCapability.registerAll();
  const trr = CapabilityRegistry.getById('TRR');
  assert.deepEqual(trr.contextCeiling.sort(), TrrCapabilityAdapter.TRR_CONTEXT_FIELD_IDS.slice().sort());
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  assert.deepEqual(gr.contextCeiling.sort(), GeneralReasoningCapability.CONTEXT_CEILING.slice().sort());
});
