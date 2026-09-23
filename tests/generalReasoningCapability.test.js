// WP0 Phase C — General Reasoning Capability unit tests (docs/specs/WP0_SPEC_v1.0.md §21).
// Run with: node --test tests/generalReasoningCapability.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');
const GeneralReasoningCapability = require('../js/coachDecisionSystem/generalReasoningCapability.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');

function fakeResponse(obj) { return { content: [{ text: JSON.stringify(obj) }] }; }
function configureStub(handler) { GeneralReasoningCapability.configure({ callClaude: handler }); }
test.afterEach(() => { GeneralReasoningCapability.configure({ callClaude: null, timeoutMs: undefined }); });

test.beforeEach(() => {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
});

test('registerAll() registers exactly one capability, "GENERAL_REASONING", with scopeMatch:"FALLBACK"', () => {
  const result = GeneralReasoningCapability.registerAll();
  assert.equal(result.ok, true);
  const cap = CapabilityRegistry.getById('GENERAL_REASONING');
  assert.ok(cap);
  assert.equal(cap.acceptedNeedCharacteristics.scopeMatch, 'FALLBACK');
  assert.equal(CapabilityRegistry.getFallback().id, 'GENERAL_REASONING');
});

test('registerAll() declares requiredContext:[] — never blocks on a single required fragment', () => {
  GeneralReasoningCapability.registerAll();
  assert.deepEqual(CapabilityRegistry.getById('GENERAL_REASONING').requiredContext, []);
});

test('registerAll() declares availableTools:[] — no ToolRegistry in Phase C (requirement 10)', () => {
  GeneralReasoningCapability.registerAll();
  assert.deepEqual(CapabilityRegistry.getById('GENERAL_REASONING').availableTools, []);
});

test('registerAll() declares mutationPermissions:[] — no mutations in Phase C (requirement 11)', () => {
  GeneralReasoningCapability.registerAll();
  assert.deepEqual(CapabilityRegistry.getById('GENERAL_REASONING').mutationPermissions, []);
});

test('registerAll() registers the two new fragment providers (currentStateContext, goalObjectiveContext) — the "assembled but never consumed" fields now reachable', () => {
  GeneralReasoningCapability.registerAll();
  assert.ok(ContextComposer.getFragmentProvider('currentStateContext'));
  assert.ok(ContextComposer.getFragmentProvider('goalObjectiveContext'));
});

// ══════════════════════════════════════════════════════════════════
// WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
// §16/§17) — GeneralReasoning's own declared eligibility metadata. Shadow-only: none of this
// participates in any live routing path (this capability remains structurally unreachable from
// conversationalNeedCreator.js regardless — see generalReasoningActivationGate.js's own header).
// ══════════════════════════════════════════════════════════════════

test('registerAll() declares capabilityRiskTier:ELEVATED and sensitiveContextAccessPolicy:NOT_AUTHORIZED as two independent fields (WP0 Phase E.0.2a §16/§17)', () => {
  GeneralReasoningCapability.registerAll();
  const cap = CapabilityRegistry.getById('GENERAL_REASONING');
  assert.equal(cap.capabilityRiskTier, 'ELEVATED');
  assert.equal(cap.sensitiveContextAccessPolicy, 'NOT_AUTHORIZED');
});

test('registerAll() declares its own two new providers as STANDARD sensitivityTier, null consentScope (WP0 Phase E.0.2a §17)', () => {
  GeneralReasoningCapability.registerAll();
  ['currentStateContext', 'goalObjectiveContext'].forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.equal(provider.sensitivityTier, 'STANDARD', id + ' sensitivityTier');
    assert.equal(provider.consentScope, null, id + ' consentScope');
  });
});

test('registerAll() is idempotent', () => {
  const first = GeneralReasoningCapability.registerAll();
  const second = GeneralReasoningCapability.registerAll();
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(CapabilityRegistry.getAll().length, 1);
});

test('reason() returns null when no callClaude is configured (fail-closed, Phase C\'s own production state)', async () => {
  const result = await GeneralReasoningCapability.reason({ openScopeDescription: 'x' }, {});
  assert.equal(result, null);
});

test('reason() returns a valid STANDARD_PROPOSAL for a well-formed mocked model response', async () => {
  configureStub(async () => fakeResponse({ outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' }));
  const result = await GeneralReasoningCapability.reason({ openScopeDescription: 'x' }, {});
  assert.ok(result);
  assert.equal(result.outcome, 'ACTION_PROPOSED');
});

test('reason() forces mutationProposal to null even if the (mocked) model returns one — deterministic override, never trusts model output (requirement 11)', async () => {
  configureStub(async () => fakeResponse({
    outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u',
    mutationProposal: { mutationKind: 'LOG_FOOD', proposedData: { item: 'anything' } }
  }));
  const result = await GeneralReasoningCapability.reason({ openScopeDescription: 'x' }, {});
  assert.equal(result.mutationProposal, null);
});

test('reason() forces riskCharacteristicTags to [] even if the (mocked) model returns tags — Phase D dimensions do not exist yet (requirement 8)', async () => {
  configureStub(async () => fakeResponse({
    outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u',
    riskCharacteristicTags: [{ dimension: 'invented', value: 'high' }]
  }));
  const result = await GeneralReasoningCapability.reason({ openScopeDescription: 'x' }, {});
  assert.deepEqual(result.riskCharacteristicTags, []);
});

test('reason() returns null for a malformed model response (never fabricates a proposal)', async () => {
  configureStub(async () => fakeResponse({ outcome: 'ACTION_PROPOSED' })); // missing required fields
  const result = await GeneralReasoningCapability.reason({}, {});
  assert.equal(result, null);
});

test('reason() returns null on a thrown callClaude', async () => {
  configureStub(() => { throw new Error('boom'); });
  const result = await GeneralReasoningCapability.reason({}, {});
  assert.equal(result, null);
});

test('reason() returns null on timeout', async () => {
  GeneralReasoningCapability.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  const result = await GeneralReasoningCapability.reason({}, {});
  assert.equal(result, null);
});

test('buildPrompt() names no sport/food/activity-specific vocabulary — genuinely domain-agnostic (structural proof)', () => {
  const prompt = GeneralReasoningCapability._internal.buildPrompt({ openScopeDescription: 'anything' }, {});
  assert.ok(!/PHYSICAL_ACTIVITY|WORKOUT|NUTRITION|running|swimming/i.test(prompt));
});

test('resolveAndReason() end-to-end: resolves to GENERAL_REASONING, composes context, reasons, and returns a valid proposal', async () => {
  GeneralReasoningCapability.registerAll();
  configureStub(async () => fakeResponse({ outcome: 'NO_VIABLE_PROPOSAL' }));
  const { resolution, proposal } = await GeneralReasoningCapability.resolveAndReason(
    { shape: 'RECOMMENDATION_REQUEST', legacyScopeMatch: null, openScopeDescription: 'something never enumerated' },
    { recentConversationContext: 'hi', availability: { recentConversationContext: 'AVAILABLE' } }
  );
  assert.equal(resolution.status, 'RESOLVED');
  assert.equal(resolution.capability.id, 'GENERAL_REASONING');
  assert.ok(proposal);
  assert.equal(proposal.outcome, 'NO_VIABLE_PROPOSAL');
});

// ══════════════════════════════════════════════════════════════════
// WP0 Phase E.0.2a Activation Amendment (docs/specs/WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md
// §12/§16) — "forced-live GENERAL_REASONING exclusion of unauthorized Safety-adjacent providers".
// GENERAL_REASONING remains non-live in every real routing path (conversationalNeedCreator.js's
// own isTrrMatch exclusion, unaffected by this Amendment). buildAuthorizedComposedContext() exists
// solely so this capability's own real authorization outcome can be proven directly, even under a
// forced/direct invocation — the concrete guarantee that flipping GENERAL_REASONING live in some
// future, separately-approved phase would not silently leak SAFETY_AND_MEDICAL context.
// ══════════════════════════════════════════════════════════════════

test('Activation Amendment §12 — buildAuthorizedComposedContext() NEVER includes userSafetyContext/userSafetyProvenance for GENERAL_REASONING, even when the pipelineContext genuinely has them AVAILABLE and the Need\'s own relevance tags would otherwise select them', async () => {
  TrrCapabilityAdapter.registerAll(); // registers the shared providers GENERAL_REASONING's own contextCeiling reuses, including userSafetyContext/userSafetyProvenance
  GeneralReasoningCapability.registerAll();

  const pipelineContext = {
    readinessStateContext: { slept: 7 },
    userSafetyContext: { flags: ['SOME_SAFETY_SIGNAL'] },
    userSafetyProvenance: { source: 'user_stated' },
    explicitRequestControls: null,
    activityPreference: { likes: ['padel'] },
    currentStateContext: { consumed: 1500 },
    goalObjectiveContext: { goal: 'maintain' },
    recentConversationContext: 'user: I am worried about my knee',
    availability: {
      readinessStateContext: 'AVAILABLE', userSafetyContext: 'AVAILABLE', userSafetyProvenance: 'AVAILABLE',
      explicitRequestControls: 'UNAVAILABLE', activityPreference: 'AVAILABLE', currentStateContext: 'AVAILABLE',
      goalObjectiveContext: 'AVAILABLE', recentConversationContext: 'AVAILABLE'
    }
  };

  const composed = await GeneralReasoningCapability.buildAuthorizedComposedContext(pipelineContext, {});
  assert.equal(composed.viable, true);
  assert.equal(Object.prototype.hasOwnProperty.call(composed.context, 'userSafetyContext'), false, 'userSafetyContext must never enter GENERAL_REASONING\'s composed context');
  assert.equal(Object.prototype.hasOwnProperty.call(composed.context, 'userSafetyProvenance'), false, 'userSafetyProvenance must never enter GENERAL_REASONING\'s composed context');

  // Non-trivial: a STANDARD, always-baseline field IS present, proving this isn't a vacuous
  // proof over an empty/degenerate composed context.
  assert.ok(Object.prototype.hasOwnProperty.call(composed.context, 'recentConversationContext'), 'sanity check: a STANDARD baseline field must still be composed');
});

test('Activation Amendment §12 — omitting the authorization closure (unauthorized capture) fails GENERAL_REASONING\'s own composed context fully closed, including its own baseline', async () => {
  TrrCapabilityAdapter.registerAll();
  GeneralReasoningCapability.registerAll();
  const grCapability = CapabilityRegistry.getById('GENERAL_REASONING');
  const composed = await ContextComposer.assemble({}, grCapability, { recentConversationContext: 'hi', availability: { recentConversationContext: 'AVAILABLE' } });
  assert.deepEqual(Object.keys(composed.context), [], 'no isReasoningAccessAuthorized closure supplied — must fail closed, not even contextBaseline');
});
