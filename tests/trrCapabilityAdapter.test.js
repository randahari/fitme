// WP0 Phase B — TRR Capability Adapter tests (docs/specs/WP0_SPEC_v1.0.md §20). Validates
// registration (fragment providers + CapabilityDeclaration) and — the critical zero-drift
// proof — that buildReasoningContext() produces output BYTE-IDENTICAL to the real, unmodified
// memoryLayer.js's own buildTrainingReadinessReasoningContext(), for representative pipeline
// contexts, including full-availability, full-unavailability, and mixed cases.
// Run with: node --test tests/trrCapabilityAdapter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');

function freshRegistration() {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  return TrrCapabilityAdapter.registerAll();
}

test.beforeEach(() => { freshRegistration(); });

test('registerAll() registers exactly one capability, "TRR", with the exact scope match of the pre-migration hardcoded pair', () => {
  const cap = CapabilityRegistry.getById('TRR');
  assert.ok(cap);
  assert.deepEqual(cap.acceptedNeedCharacteristics.scopeMatch, { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' });
  assert.equal(cap.acceptedNeedCharacteristics.needShapes, 'ANY');
});

test('registerAll() declares requiredContext:[] — preserves TRR\'s existing non-gating behavior (no field blocks reasoning if unavailable)', () => {
  const cap = CapabilityRegistry.getById('TRR');
  assert.deepEqual(cap.requiredContext, []);
});

test('registerAll() registers all six ContextFragmentProviders TRR\'s reasoning context needs', () => {
  const ids = ContextComposer.getAllFragmentProviderIds().sort();
  assert.deepEqual(ids, [
    'activityPreference', 'explicitRequestControls', 'readinessStateContext',
    'recentConversationContext', 'userSafetyContext', 'userSafetyProvenance'
  ]);
});

test('registerAll() is idempotent — a second call does not error and does not duplicate registration', () => {
  const first = TrrCapabilityAdapter.registerAll();
  assert.equal(first.ok, true);
  assert.equal(CapabilityRegistry.getAll().length, 1);
});

test('a matcher against a non-WORKOUT/WORKOUT_FREQUENCY need correctly does not match TRR', () => {
  const matched = CapabilityRegistry.resolveCapability({ legacyScopeMatch: { domain: 'NUTRITION', topic: 'FOOD_LOGGING' } });
  assert.equal(matched, null); // no FALLBACK registered in Phase B — correctly null, not TRR
});

function fullPipelineContext(overrides) {
  return Object.assign({
    readinessStateContext: { slept: 4, statement: 'ישנתי מעט' },
    userSafetyContext: { restrictions: ['running'] },
    userSafetyProvenance: { source: 'doctor', text: 'הרופא אמר לא לרוץ' },
    explicitRequestControls: { suppressed: [] },
    activityPreference: { likes: ['swimming'] },
    recentConversationContext: 'user: hi\nassistant: hello',
    availability: {
      readinessStateContext: 'AVAILABLE',
      userSafetyContext: 'AVAILABLE',
      userSafetyProvenance: 'AVAILABLE',
      explicitRequestControls: 'AVAILABLE',
      activityPreference: 'AVAILABLE',
      recentConversationContext: 'AVAILABLE'
    }
  }, overrides || {});
}

function emptyPipelineContext() {
  return {
    readinessStateContext: null,
    userSafetyContext: null,
    userSafetyProvenance: null,
    explicitRequestControls: null,
    activityPreference: null,
    recentConversationContext: null,
    availability: {
      readinessStateContext: 'UNAVAILABLE',
      userSafetyContext: 'UNAVAILABLE',
      userSafetyProvenance: 'UNAVAILABLE',
      explicitRequestControls: 'UNAVAILABLE',
      activityPreference: 'UNAVAILABLE',
      recentConversationContext: 'UNAVAILABLE'
    }
  };
}

function detectedOpportunity(overrides) {
  return Object.assign({
    validReasonCategory: 'ADAPT_TO_CURRENT_STATE',
    contextualMeaning: { basis: { observation: { topic: 'WORKOUT_FREQUENCY', lifecycle: 'ACTIVE' } } }
  }, overrides || {});
}

test('GOLDEN MASTER — buildReasoningContext() is byte-identical to memoryLayer.js\'s own buildTrainingReadinessReasoningContext() for a fully-available pipelineContext', async () => {
  const pc = fullPipelineContext();
  const opp = detectedOpportunity();
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated)), JSON.parse(JSON.stringify(original)));
});

test('GOLDEN MASTER — byte-identical for a fully-UNAVAILABLE pipelineContext (every field null/UNAVAILABLE) — proves no new required-context gate was introduced', async () => {
  const pc = emptyPipelineContext();
  const opp = detectedOpportunity();
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated)), JSON.parse(JSON.stringify(original)));
  // Explicit, direct proof this scenario does NOT become non-viable/blocked under migration —
  // the exact behavior-drift risk this adapter's design was chosen to avoid (see file header).
  assert.notEqual(migrated, null);
});

test('GOLDEN MASTER — byte-identical for a MIXED-availability pipelineContext (some fields available, some not)', async () => {
  const pc = fullPipelineContext({
    userSafetyProvenance: null,
    availability: {
      readinessStateContext: 'AVAILABLE',
      userSafetyContext: 'UNAVAILABLE',
      userSafetyProvenance: 'UNAVAILABLE',
      explicitRequestControls: 'AVAILABLE',
      activityPreference: 'UNAVAILABLE',
      recentConversationContext: 'AVAILABLE'
    }
  });
  const opp = detectedOpportunity();
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated)), JSON.parse(JSON.stringify(original)));
});

test('GOLDEN MASTER — goalObjectiveContext is always null in both the original and migrated shape (CARF Ch.07 conditional-inclusion rule, unchanged)', async () => {
  const pc = fullPipelineContext({ goalObjectiveContext: { goal: 'cut', goalKcal: 1800 } }); // even if present on pipelineContext
  const opp = detectedOpportunity();
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.equal(original.goalObjectiveContext, null);
  assert.equal(migrated.goalObjectiveContext, null);
});

test('GOLDEN MASTER — the availability sub-object never surfaces userSafetyProvenance, matching the original\'s own established shape exactly', async () => {
  const pc = fullPipelineContext();
  const opp = detectedOpportunity();
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.equal('userSafetyProvenance' in original.availability, false);
  assert.equal('userSafetyProvenance' in migrated.availability, false);
});

test('GOLDEN MASTER — need.observation/validReasonCategory are correctly sourced from detectedOpportunity in both shapes', async () => {
  const pc = fullPipelineContext();
  const opp = detectedOpportunity({ validReasonCategory: 'ADAPT_TO_CURRENT_STATE', contextualMeaning: { basis: { observation: { topic: 'WORKOUT_FREQUENCY', lifecycle: 'CONFIRMED' } } } });
  const original = MemoryLayer.buildTrainingReadinessReasoningContext(pc, opp);
  const migrated = await TrrCapabilityAdapter.buildReasoningContext(pc, opp);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.need)), JSON.parse(JSON.stringify(original.need)));
});

// ══════════════════════════════════════════════════════════════════
// WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
// §15/§17) — TRR's own declared eligibility metadata. Shadow-only: none of this participates in
// any live routing path yet (contextRelevancePlanner.js is unmodified).
// ══════════════════════════════════════════════════════════════════

test('registerAll() declares capabilityRiskTier:STANDARD and sensitiveContextAccessPolicy:AUTHORIZED as two independent fields (WP0 Phase E.0.2a §15/§17)', () => {
  const cap = CapabilityRegistry.getById('TRR');
  assert.equal(cap.capabilityRiskTier, 'STANDARD');
  assert.equal(cap.sensitiveContextAccessPolicy, 'AUTHORIZED');
});

test('registerAll() declares each provider\'s sensitivityTier/consentScope per the approved migration table (WP0 Phase E.0.2a §17)', () => {
  const expected = {
    readinessStateContext: 'STANDARD',
    userSafetyContext: 'SAFETY_ADJACENT',
    userSafetyProvenance: 'SAFETY_ADJACENT',
    explicitRequestControls: 'STANDARD',
    activityPreference: 'STANDARD',
    recentConversationContext: 'STANDARD'
  };
  Object.keys(expected).forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.equal(provider.sensitivityTier, expected[id], id + ' sensitivityTier');
    assert.equal(provider.consentScope, null, id + ' consentScope');
  });
});

test('buildReasoningContext() degrades gracefully (never throws) if TRR was never registered', async () => {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  const result = await TrrCapabilityAdapter.buildReasoningContext(fullPipelineContext(), detectedOpportunity());
  assert.ok(result); // still a well-formed object, all context fields undefined/absent, never throws
  assert.equal(result.readinessStateContext, undefined);
});
