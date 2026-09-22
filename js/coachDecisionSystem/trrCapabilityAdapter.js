// ══════════════════════════════════════════════════════════════════
// FitMe — TRR Capability Adapter (WP0 Phase B, docs/specs/WP0_SPEC_v1.0.md §20,
// Product/Architecture-approved Revision 3)
// Exclusive responsibility: register Training Readiness & Recovery as the first real,
// specialized CapabilityDeclaration in CapabilityRegistry (§15), register the
// ContextFragmentProviders its reasoning context needs (§17), and translate
// ContextComposer's generic assembled-fragment shape into the EXACT reasoning-context shape
// TrainingReadinessReasoningComponent.propose() already expects — byte-identical to what
// memoryLayer.js's buildTrainingReadinessReasoningContext() produces today.
//
// TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md) remains entirely UNMODIFIED — this adapter calls
// TrainingReadinessReasoningComponent, readinessStateInterpreter.js, activityPreferenceInterpreter.js,
// activityOppositionInterpreter.js, and every TRR Safety rule exactly as they already exist. It
// does not alter their prompts, schemas, or behavior in any way (Authoring Standard Ownership
// rule: a new capability may call an existing system's contract, never modify it).
//
// ZERO-DRIFT DESIGN NOTE (repository evidence, verified before this file was written):
// memoryLayer.js's buildTrainingReadinessReasoningContext() (js/coachDecisionSystem/memoryLayer.js:809-837)
// unconditionally includes all six fields below regardless of their own availability — it has
// NO required-context-failure gate of its own; TRR's own graceful-degradation principle (D3
// §12.3, restated at memoryLayer.js:513-514: "graceful degradation... never blocks the Decision
// Pass") means an unavailable fragment is passed through as null/UNAVAILABLE, never a reason to
// stop reasoning. WP0 Phase A's ContextComposer.assemble() DOES gate on `requiredContext`
// (§18). To preserve TRR's existing, closed, non-gating behavior exactly, TRR's
// CapabilityDeclaration below declares requiredContext: [] and lists all six fields under
// contextCeiling + contextBaseline instead (always proactively composed, never gating) — this
// is a deliberate, evidenced Engineering choice to avoid introducing a NEW failure mode Phase B
// is not authorized to add (WP0_SPEC_v1.0.md's own binding invariant: Phase B is a routing
// migration, not a behavior change).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CapabilityRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('./capabilityRegistry.js')
    : window.CapabilityRegistry;
  var ContextComposer = (typeof module !== 'undefined' && module.exports)
    ? require('./contextComposer.js')
    : window.ContextComposer;

  var TRR_CAPABILITY_ID = 'TRR';

  // The exact six fields memoryLayer.js:809-837 reads directly off pipelineContext, preserved
  // as a named list so both fragment-provider registration and reasoning-context construction
  // below iterate the identical set — never independently maintained, never allowed to drift
  // apart from each other.
  var TRR_CONTEXT_FIELD_IDS = [
    'readinessStateContext',
    'userSafetyContext',
    'userSafetyProvenance',
    'explicitRequestControls',
    'activityPreference',
    'recentConversationContext'
  ];

  // WP0 Phase E.0.1 (Product/Architecture-approved canonical mapping) — each field's functional
  // role per the closed CONTEXT_RELEVANCE_KINDS taxonomy (contextComposer.js). Advisory only,
  // non-gating for TRR itself (§17) — TRR never relies on tag-matching since all six fields are
  // in contextBaseline (always included); this mapping exists so OTHER capabilities (e.g.
  // GeneralReasoning, which reuses these same catalogued providers) get correct relevance
  // matching when their own contextBaseline does not already force inclusion.
  var FIELD_RELEVANCE_TAGS = {
    readinessStateContext: ['CURRENT_PHYSICAL_STATE'],
    userSafetyContext: ['SAFETY_AND_MEDICAL'],
    userSafetyProvenance: ['SAFETY_AND_MEDICAL'],
    explicitRequestControls: ['PREFERENCES_AND_BOUNDARIES'],
    activityPreference: ['PREFERENCES_AND_BOUNDARIES'],
    recentConversationContext: ['RECENT_INTERACTION']
  };

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // §17 — one ContextFragmentProvider per field, each a thin, direct pass-through of
  // pipelineContext[fieldId] / pipelineContext.availability[fieldId] — the exact same read
  // memoryLayer.js's own buildTrainingReadinessReasoningContext() already performs today, now
  // exposed as a named, catalogued, reusable provider instead of an inline object-literal read.
  function makePipelineContextFragmentProvider(fieldId) {
    return {
      id: fieldId,
      relevanceTags: FIELD_RELEVANCE_TAGS[fieldId] || [],
      invoke: function (pipelineContext) {
        pipelineContext = pipelineContext || {};
        var availability = (pipelineContext.availability && pipelineContext.availability[fieldId]);
        return {
          value: pipelineContext[fieldId],
          // Defensive fallback only (never reached against a real, correctly-shaped
          // pipelineContext — memoryLayer.js's assembleContext() always populates every
          // availability field with 'AVAILABLE'/'UNAVAILABLE', verified by direct read).
          availability: (availability === 'AVAILABLE' || availability === 'UNAVAILABLE' || availability === 'PARTIAL') ? availability : 'UNAVAILABLE'
        };
      }
    };
  }

  // Idempotent — safe to call more than once (defensive only; production wiring, app.js, calls
  // this exactly once, mirroring RegisterCoachDecisionSystem.registerAll()'s own established
  // pattern). Idempotency is checked against CapabilityRegistry/ContextComposer's own actual
  // state (DUPLICATE_ID tolerance below), never an internal flag of this module — a flag would
  // desynchronize from reality the moment a caller resets those registries independently (e.g.
  // test harnesses calling their own __resetForTests__()), silently leaving this module believing
  // it had registered something that no longer exists.
  function registerAll() {
    for (var i = 0; i < TRR_CONTEXT_FIELD_IDS.length; i++) {
      var providerResult = ContextComposer.registerFragmentProvider(makePipelineContextFragmentProvider(TRR_CONTEXT_FIELD_IDS[i]));
      if (!providerResult.ok && providerResult.error.code !== 'DUPLICATE_ID') { return providerResult; }
    }

    var declarationResult = CapabilityRegistry.register({
      id: TRR_CAPABILITY_ID,
      purpose: 'Training Readiness & Recovery — adapts today\'s training given current-state/readiness signals (TRR-001, unmodified)',
      acceptedNeedCharacteristics: {
        needShapes: 'ANY', // Phase B: unchanged scope, per §20 — a later, separately-approved
                            // broadening of scopeMatch beyond the literal existing pair is
                            // explicitly NOT part of this Phase
        scopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, // byte-identical to the
                                                                        // pre-migration hardcoded pair
        priority: 100
      },
      requiredContext: [], // see header note — preserves TRR's existing non-gating behavior
      contextCeiling: TRR_CONTEXT_FIELD_IDS.slice(),
      contextBaseline: TRR_CONTEXT_FIELD_IDS.slice(), // always composed, matching today's
                                                        // unconditional inclusion of all six
      availableTools: [], // TRR uses no tools (§20) — unchanged
      outputContract: 'STANDARD_PROPOSAL',
      safetyRequirements: {
        riskCharacteristicDimensions: [], // Phase D is intentionally separate — not invented here
        mustPassFinalReview: true,
        riskTagsAreAdvisoryOnly: true
      },
      mutationPermissions: [], // TRR proposes advice only, never a mutation, in WP0
      provenanceRequirements: { requiresExternalRetrieval: false }
    });
    if (!declarationResult.ok && declarationResult.error.code !== 'DUPLICATE_ID') { return declarationResult; }

    return { ok: true };
  }

  // §20 — the reasoning-context adapter. Produces a shape byte-identical to
  // memoryLayer.js's buildTrainingReadinessReasoningContext(pipelineContext, detectedOpportunity)
  // (verified field-for-field against the current repository source), sourced from
  // ContextComposer.assemble()'s generic fragment map instead of direct pipelineContext reads.
  async function buildReasoningContext(pipelineContext, detectedOpportunity) {
    var trrCapability = CapabilityRegistry.getById(TRR_CAPABILITY_ID);
    var composed = trrCapability
      ? await ContextComposer.assemble({}, trrCapability, pipelineContext)
      : { viable: false, context: null };
    var ctx = (composed && composed.viable && composed.context) ? composed.context : {};

    function fieldValue(id) { return ctx[id] ? ctx[id].value : undefined; }
    function fieldAvailability(id) { return ctx[id] ? ctx[id].availability : undefined; }

    return freezeShallow({
      need: freezeShallow({
        observation: detectedOpportunity && detectedOpportunity.contextualMeaning
          && detectedOpportunity.contextualMeaning.basis && detectedOpportunity.contextualMeaning.basis.observation,
        validReasonCategory: detectedOpportunity && detectedOpportunity.validReasonCategory
      }),
      readinessStateContext: fieldValue('readinessStateContext'),
      userSafetyContext: fieldValue('userSafetyContext'),
      userSafetyProvenance: fieldValue('userSafetyProvenance'),
      explicitRequestControls: fieldValue('explicitRequestControls'),
      activityPreference: fieldValue('activityPreference'),
      goalObjectiveContext: null, // not domain-relevant for TR&R V1 (CARF Ch.07's own
                                  // conditional-inclusion rule) — byte-identical to today
      recentConversationContext: fieldValue('recentConversationContext'),
      availability: freezeShallow({
        readinessStateContext: fieldAvailability('readinessStateContext'),
        userSafetyContext: fieldAvailability('userSafetyContext'),
        explicitRequestControls: fieldAvailability('explicitRequestControls'),
        activityPreference: fieldAvailability('activityPreference'),
        recentConversationContext: fieldAvailability('recentConversationContext')
        // userSafetyProvenance intentionally absent from this sub-object — byte-identical to
        // memoryLayer.js:829-835's own existing return shape, which likewise never surfaces a
        // distinct availability flag for this one field to the reasoning component.
      })
    });
  }

  var API = {
    VERSION: '1.0.0', // WP0 Phase B
    TRR_CAPABILITY_ID: TRR_CAPABILITY_ID,
    TRR_CONTEXT_FIELD_IDS: TRR_CONTEXT_FIELD_IDS,
    registerAll: registerAll,
    buildReasoningContext: buildReasoningContext
  };

  if (typeof window !== 'undefined') { window.TrrCapabilityAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
