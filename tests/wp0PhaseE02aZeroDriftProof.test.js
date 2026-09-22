// WP0 Phase E.0.2a — Policy-Based Provider Eligibility Zero-Drift Proof
// (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md §13/§15/§21 item 3).
//
// SHADOW-MODE PROOF, not production code: contextRelevancePlanner.js is not modified by this
// Phase and continues to read capability.contextCeiling exactly as it does today, unchanged.
// This suite proves — for the real, currently-registered TRR and GENERAL_REASONING capabilities
// and their real, currently-registered providers — that eligibilityPolicy.computeEligibility()
// would authorize (eligible:true) exactly the same providers contextCeiling already authorizes,
// and that reasoningAccessAuthorized resolves to the values consistent with each capability's own
// declared sensitiveContextAccessPolicy, BEFORE any future, separately-approved SPEC ever
// re-points contextRelevancePlanner.select()'s own universe at this module's output.
// Run with: node --test tests/wp0PhaseE02aZeroDriftProof.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
const GeneralReasoningCapability = require('../js/coachDecisionSystem/generalReasoningCapability.js');
const EligibilityPolicy = require('../js/coachDecisionSystem/eligibilityPolicy.js');

test.beforeEach(() => {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  TrrCapabilityAdapter.registerAll();
  GeneralReasoningCapability.registerAll();
});

// Empty consentState is sufficient: per the approved §17 migration table, every currently
// registered provider declares consentScope:null, so eligible() never needs a consent grant.
const EMPTY_CONSENT_STATE = {};

test('every provider in TRR\'s own contextCeiling is eligible:true under eligibilityPolicy (zero-drift proof)', () => {
  const trr = CapabilityRegistry.getById('TRR');
  trr.contextCeiling.forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.ok(provider, 'provider ' + id + ' must be registered');
    const result = EligibilityPolicy.computeEligibility(provider, trr, EMPTY_CONSENT_STATE);
    assert.equal(result.eligible, true, id + ' must be eligible for TRR');
  });
});

test('every provider in GENERAL_REASONING\'s own contextCeiling is eligible:true under eligibilityPolicy (zero-drift proof)', () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  gr.contextCeiling.forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.ok(provider, 'provider ' + id + ' must be registered');
    const result = EligibilityPolicy.computeEligibility(provider, gr, EMPTY_CONSENT_STATE);
    assert.equal(result.eligible, true, id + ' must be eligible for GENERAL_REASONING');
  });
});

test('TRR: reasoningAccessAuthorized===true for both SAFETY_ADJACENT providers, consistent with TRR\'s own existing live behavior and its declared sensitiveContextAccessPolicy:AUTHORIZED', () => {
  const trr = CapabilityRegistry.getById('TRR');
  ['userSafetyContext', 'userSafetyProvenance'].forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    assert.equal(provider.sensitivityTier, 'SAFETY_ADJACENT', id + ' must be SAFETY_ADJACENT');
    const result = EligibilityPolicy.computeEligibility(provider, trr, EMPTY_CONSENT_STATE);
    assert.equal(result.reasoningAccessAuthorized, true, id + ' must be reasoningAccessAuthorized for TRR');
  });
});

test('GENERAL_REASONING: reasoningAccessAuthorized===false for both SAFETY_ADJACENT providers, consistent with its declared sensitiveContextAccessPolicy:NOT_AUTHORIZED and its non-live status', () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  ['userSafetyContext', 'userSafetyProvenance'].forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    const result = EligibilityPolicy.computeEligibility(provider, gr, EMPTY_CONSENT_STATE);
    assert.equal(result.reasoningAccessAuthorized, false, id + ' must NOT be reasoningAccessAuthorized for GENERAL_REASONING');
  });
});

test('every STANDARD-sensitivity provider is reasoningAccessAuthorized:true for BOTH capabilities, regardless of capabilityRiskTier (root-cause regression proof at the real-fixture level)', () => {
  const trr = CapabilityRegistry.getById('TRR');
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  ContextComposer.getAllFragmentProviderIds().forEach((id) => {
    const provider = ContextComposer.getFragmentProvider(id);
    if (provider.sensitivityTier !== 'STANDARD') return;
    if (trr.contextCeiling.indexOf(id) !== -1) {
      assert.equal(EligibilityPolicy.computeEligibility(provider, trr, EMPTY_CONSENT_STATE).reasoningAccessAuthorized, true, id + ' for TRR');
    }
    if (gr.contextCeiling.indexOf(id) !== -1) {
      assert.equal(EligibilityPolicy.computeEligibility(provider, gr, EMPTY_CONSENT_STATE).reasoningAccessAuthorized, true, id + ' for GENERAL_REASONING');
    }
  });
});

test('contextRelevancePlanner.js is untouched by this Phase — select() still reads capability.contextCeiling directly, never eligibilityPolicy (structural proof of shadow-mode-only integration, §13/§14)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const plannerSource = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/contextRelevancePlanner.js'), 'utf8');
  assert.ok(!/eligibilityPolicy/i.test(plannerSource), 'contextRelevancePlanner.js must not reference eligibilityPolicy in E.0.2a');
  assert.ok(/capability\.contextCeiling/.test(plannerSource), 'contextRelevancePlanner.js must still read capability.contextCeiling directly');
});

test('no production file requires eligibilityPolicy.js in E.0.2a (structural proof nothing production-facing calls it yet)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const dir = path.join(__dirname, '../js/coachDecisionSystem');
  const productionFilesExcludingEligibilityPolicyItself = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js') && f !== 'eligibilityPolicy.js');
  productionFilesExcludingEligibilityPolicyItself.forEach((f) => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/require\(['"]\.\/eligibilityPolicy\.js['"]\)/.test(src), f + ' must not require eligibilityPolicy.js in E.0.2a');
  });
});
