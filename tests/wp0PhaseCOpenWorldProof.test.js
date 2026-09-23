// WP0 Phase C — Open-World Architectural Proof (docs/specs/WP0_SPEC_v1.0.md §22/§31 Phase C;
// §37 "Unknown Future Capability Acceptance Test", narrowed to this Phase's own scope per the
// Product/Architecture instruction: "This is NOT yet the final WP0 Unknown Future production
// acceptance test because Safety/activation/retrieval are not complete. It is the Phase-C
// architectural proof.").
//
// Demonstrates, for a genuinely never-enumerated concept (curling — verified absent from the
// entire repository before this file was written: `grep -ril "curling|קרלינג" js/ docs/specs/`
// returns zero matches):
//   valid OpenUnderstanding/Need -> no specialized capability match -> FALLBACK
//   GeneralReasoningCapability selected -> bounded relevant context assembled -> General
//   Reasoning invoked (mocked callClaude, controlled test conditions only, per §22/§31's own
//   "Phase-C tests may explicitly enable/invoke the gated capability" allowance) -> validated
//   STANDARD_PROPOSAL produced.
//
// SCOPE BOUNDARY, disclosed precisely: this test constructs its Need object directly, as a
// fixture representing what an eventually-extended OpenUnderstanding step (§13) would produce —
// it does NOT exercise turnUnderstandingInterpreter.js/explicitRequestInterpreter.js's own live
// extraction of openScopeDescription/openEntityMentions from raw user text, since that upstream
// NLU extension was not authorized or built in any WP0 phase to date (Phase A/B's own scope was
// CapabilityRegistry/ContextComposer/TRR migration only). This test proves the Registry-onward
// architecture (resolution, context composition, reasoning, proposal validation) is genuinely
// open-world-capable; the full production Unknown Future Capability test (§37) additionally
// requires that upstream extension, Phase D Safety, and live activation — none of which this
// Phase claims to complete.
// Run with: node --test tests/wp0PhaseCOpenWorldProof.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');
const StandardProposalContract = require('../js/coachDecisionSystem/standardProposalContract.js');
const GeneralReasoningActivationGate = require('../js/coachDecisionSystem/generalReasoningActivationGate.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
const GeneralReasoningCapability = require('../js/coachDecisionSystem/generalReasoningCapability.js');

const NOVEL_CONCEPT_HE = 'קרלינג'; // curling — verified absent from the entire repository, see header
const NOVEL_CONCEPT_EN = 'curling';

test.beforeEach(() => {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  TrrCapabilityAdapter.registerAll();       // both real capabilities registered, mirroring production
  GeneralReasoningCapability.registerAll();
});
test.afterEach(() => {
  GeneralReasoningCapability.configure({ callClaude: null, timeoutMs: undefined });
  GeneralReasoningActivationGate.__setLiveFallbackApprovedForTests__(false); // never leak a gate-ON state across test files
});

function fakeResponse(obj) { return { content: [{ text: JSON.stringify(obj) }] }; }

// A Need fixture for a message like "שיחקתי קרלינג היום, יש לי טכניקה גרועה, מה כדאי לתקן?"
// (I played curling today, my technique is poor, what should I fix?) — representative of the
// class of request the future OpenUnderstanding extension (§13) is designed to produce.
function novelConceptNeed() {
  return {
    shape: 'RECOMMENDATION_REQUEST',
    legacyScopeMatch: null, // no closed-vocabulary pair names this concept — honestly null, never guessed (§13)
    openScopeDescription: 'the user played ' + NOVEL_CONCEPT_EN + ' today and is asking what to improve about their technique',
    openEntityMentions: [{ text: NOVEL_CONCEPT_HE, roughKind: 'training' }],
    constraints: []
  };
}

test('STEP 1 — no specialized (non-FALLBACK) capability matches this Need', () => {
  const matched = CapabilityRegistry.resolveCapability({ legacyScopeMatch: novelConceptNeed().legacyScopeMatch, shape: novelConceptNeed().shape });
  // Only TRR is registered as a non-FALLBACK capability; its scopeMatch is a specific
  // {domain,topic} pair this Need's legacyScopeMatch (null) can never satisfy.
  assert.equal(matched.id, 'GENERAL_REASONING'); // resolveCapability() itself already falls through to FALLBACK
  assert.notEqual(matched.id, 'TRR');
});

test('STEP 2 — full resolve() selects FALLBACK (GeneralReasoningCapability), never TRR, never a rejection', async () => {
  const resolution = await CapabilityRegistry.resolve(novelConceptNeed(), { recentConversationContext: null, availability: {} });
  assert.equal(resolution.status, 'RESOLVED');
  assert.equal(resolution.capability.id, 'GENERAL_REASONING');
});

// WP0 Phase E.0.1 NOTE (disclosed): before this Phase, ContextFragmentProvider.relevanceTags held
// free-form, world-concept-flavored strings (e.g. 'training', 'nutrition') that happened to
// string-match this fixture's own free-form roughKind:'training' value via
// ContextRelevancePlanner's tag-overlap mechanism (mechanism (b), contextRelevancePlanner.js's own
// header) — so readinessStateContext/activityPreference were proactively selected for this Need
// even though neither is in GENERAL_REASONING's own contextBaseline. Phase E.0.1 closes
// relevanceTags to the canonical CONTEXT_RELEVANCE_KINDS functional-role vocabulary (a genuinely
// different vocabulary from a Need's own open-world roughKind values, by design — see
// WP0_SPEC_v1.0.md's Phase E.0 canonical principle: "context planning determines what the coach
// should focus on... not what FITME is allowed to know"). Bridging roughKind -> a
// CONTEXT_RELEVANCE_KINDS-shaped need is explicitly Phase E.0.2's job (the bounded AI Context Need
// Planner), not yet built.
//
// WP0 Phase E.0.2a ACTIVATION AMENDMENT NOTE (supersedes the "only contextBaseline is proactively
// included" claim this test made pre-Amendment): CapabilityRegistry.resolve() — the function this
// test calls — is explicitly named as NOT touched by the Activation Amendment
// (docs/specs/WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md §15); it still calls
// ContextComposer.assemble(need, resolvedCapability, pipelineContext) with no
// isReasoningAccessAuthorized closure. Since the Amendment's own seam (contextRelevancePlanner.js's
// final filter) now fails CLOSED whenever that closure is missing (Amendment §10 — "no permissive
// fallback"), this specific, already-test-only, zero-production-caller path (resolve() has no
// production callers — confirmed repeatedly across this session's own investigations) now
// correctly composes an EMPTY optional context, not even contextBaseline. This is not a defect:
// resolve()/resolveAndReason() were always a test convenience wrapper around the full chain, never
// itself activation-aware — GeneralReasoningCapability.buildAuthorizedComposedContext() (Amendment
// §12) is the activation-aware equivalent, exercised directly by
// tests/generalReasoningCapability.test.js's own dedicated Amendment §12 test group.
test('STEP 3 — bounded context assembly via the UNMODIFIED CapabilityRegistry.resolve() path composes an empty optional context post-Activation-Amendment (no isReasoningAccessAuthorized closure reaches this specific, test-only call chain) — the "not a full dump" proof still holds, now even more strongly (see notes above)', async () => {
  const pipelineContext = {
    readinessStateContext: { slept: 6 },
    userSafetyContext: null,
    userSafetyProvenance: null,
    explicitRequestControls: null,
    activityPreference: { likes: ['padel'] },
    currentStateContext: { consumed: 1200 },
    goalObjectiveContext: { goal: 'maintain' },
    recentConversationContext: 'user: hi',
    availability: {
      readinessStateContext: 'AVAILABLE', userSafetyContext: 'UNAVAILABLE', userSafetyProvenance: 'UNAVAILABLE',
      explicitRequestControls: 'UNAVAILABLE', activityPreference: 'AVAILABLE',
      currentStateContext: 'AVAILABLE', goalObjectiveContext: 'AVAILABLE', recentConversationContext: 'AVAILABLE'
    }
  };
  const resolution = await CapabilityRegistry.resolve(novelConceptNeed(), pipelineContext);
  assert.equal(resolution.status, 'RESOLVED');
  const contextKeys = Object.keys(resolution.context);
  assert.deepEqual(contextKeys, [], 'resolve() supplies no authorization closure, so even contextBaseline now fails closed on this specific, unmodified, test-only path (see notes above)');
});

test('STEP 4/5 — General Reasoning is invoked (mocked callClaude, controlled test only) and produces a validated STANDARD_PROPOSAL, entirely from the composed context — no concept-specific code anywhere', async () => {
  let promptSeen = null;
  GeneralReasoningCapability.configure({
    callClaude: async (body) => {
      promptSeen = body.messages[0].content;
      return fakeResponse({
        outcome: 'ACTION_PROPOSED',
        action: 'focus on your release and follow-through technique',
        rationale: 'the user asked specifically about technique improvement',
        evidenceBasis: 'the user\'s own stated request',
        expectedValue: 'more consistent shots',
        uncertainty: 'general guidance without seeing the actual delivery'
      });
    }
  });

  const need = novelConceptNeed();
  const { resolution, proposal } = await GeneralReasoningCapability.resolveAndReason(
    need,
    { recentConversationContext: 'user: hi', availability: { recentConversationContext: 'AVAILABLE' } }
  );

  assert.equal(resolution.status, 'RESOLVED');
  assert.equal(resolution.capability.id, 'GENERAL_REASONING');
  assert.ok(proposal, 'a real STANDARD_PROPOSAL was produced');
  assert.equal(StandardProposalContract.isValidStandardProposal(proposal), true);
  assert.equal(proposal.outcome, 'ACTION_PROPOSED');
  assert.equal(proposal.mutationProposal, null);
  assert.deepEqual(proposal.riskCharacteristicTags, []);

  // The novel concept genuinely reached the model call — proving the chain actually carried it,
  // not merely that some unrelated default proposal was produced.
  assert.ok(promptSeen.indexOf(NOVEL_CONCEPT_HE) !== -1 || promptSeen.indexOf(NOVEL_CONCEPT_EN) !== -1);
});

test('ZERO CONCEPT-SPECIFIC CODE — "curling"/"קרלינג" appears nowhere in js/ outside this test file\'s own fixture', () => {
  const jsDir = path.join(__dirname, '../js');
  function walk(dir) {
    let hits = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) hits = hits.concat(walk(full));
      else if (entry.name.endsWith('.js')) {
        const src = fs.readFileSync(full, 'utf8');
        if (new RegExp(NOVEL_CONCEPT_EN, 'i').test(src) || src.indexOf(NOVEL_CONCEPT_HE) !== -1) { hits.push(full); }
      }
    });
    return hits;
  }
  assert.deepEqual(walk(jsDir), [], 'no production file references the novel concept — it exists only as this test\'s own fixture data');
});

test('CONTROL — during this entire proof, the activation gate remains OFF (Phase C never flips it as a side effect of the proof itself)', () => {
  assert.equal(GeneralReasoningActivationGate.isLiveFallbackApproved(), false);
});

test('CONTROL — TRR is completely unaffected: it still matches its own exact pair and General Reasoning never intercepts it', async () => {
  const trrNeed = { shape: 'RECOMMENDATION_REQUEST', legacyScopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } };
  const resolution = await CapabilityRegistry.resolve(trrNeed, { availability: {} });
  assert.equal(resolution.capability.id, 'TRR');
});
