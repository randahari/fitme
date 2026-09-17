// ══════════════════════════════════════════════════════════════════
// FitMe — Conversational Need Creator (DUC-001, docs/specs/DUC_001_SPEC_v1.0.md §06)
// A fifth Stage-3 contributor, structurally parallel to RecommendationEngine/InitiativeEngine/
// SafetyLayer's own existing Stage-3 detection role — dispatched from
// internalPipelineOrchestrator.js only on the DIRECT_TURN_PASS action path (never on APP_READY).
//
// REVISED (Blocker 2/3) two-step design, separating Need recognition (domain-agnostic, gated
// only on Decision 5's own semantics) from professional-capability resolution (a later, separate
// step):
//
//   Step A — Need recognition (domain-agnostic, the ONLY gate): a legitimate DirectUserNeed
//   exists the moment turnUnderstanding.affirmativeRequest.present === true on a CLASSIFIED turn,
//   REGARDLESS of domain/topic — admission never depends on successful classification into a
//   closed vocabulary (Blocker 2's own correction). This Need is the honest, domain-agnostic
//   acknowledgment Decision 10 (Ch.15) requires: "FITME may correctly understand a User Turn
//   while determining no currently-authorized professional capability exists for that Need."
//
//   Step B — Professional-capability resolution (§09), performed on an already-recognized need,
//   NEVER gating its existence: routed through CapabilityRegistry.resolveCapability()
//   (WP0_SPEC_v1.0.md §16, Phase B) — a pure, synchronous, matching-only lookup against
//   registered CapabilityDeclarations. In Phase B exactly one capability is registered (TRR,
//   trrCapabilityAdapter.js), declared with scopeMatch:{domain:'WORKOUT',
//   topic:'WORKOUT_FREQUENCY'} — the identical literal pair this equality check always used —
//   so the routing DECISION is unchanged by construction; only the MECHANISM producing it moved
//   from a hardcoded `if` to a data-driven registry lookup. A match returns a real
//   DetectedOpportunity for the existing, unmodified TRR reasoning-invocation branch (§10); a
//   non-match returns kind: 'UNSUPPORTED', consumed by
//   DecisionFormation.formUnsupportedCapabilityOutcome() (§12) — never silence, never
//   misrouting.
//
// Explicit non-behavior (Package Ch.13, verbatim): never answers the user; never calls
// Expression; never owns Safety; performs no free-form routing (Step B's own opportunity-
// construction logic below is unchanged — still exactly one capability's own shape, not a
// table of many); never reinterprets EUR-001 (a negative-control turn
// still produces a DirectUserNeed at Step A if an affirmative request also exists in the same
// turn, per Decision 11/Blocker 6/§12a — EUR-001's own machinery is untouched and independently
// still applies its own suppression check downstream at Stage 6, unaffected by this contributor's
// own Step A/B); never creates a Need from desireOnlyPresent alone (Step A's own gate is
// affirmativeRequest.present, never desireOnlyPresent).
//
// Domain/topic vocabulary status (Blocker 2, resolved): the closed {domain, topic} vocabulary
// consulted at Step A/B is OPTIONAL ROUTING METADATA ONLY — its absence or non-match never
// prevents Need recognition; only Step B's own capability match fails for it, correctly routing
// to §12's unsupported outcome rather than failing to recognize the request at all.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // WP0 Phase B (docs/specs/WP0_SPEC_v1.0.md §11 row 4, §16) — the single hardcoded equality
  // check below is now routed through CapabilityRegistry.resolveCapability(), a pure,
  // synchronous, matching-only lookup (no context acquisition — that remains a separate,
  // later step, unchanged, at internalPipelineOrchestrator.js's own existing reasoning-
  // invocation gate). For the one capability registered in Phase B (TRR), this produces the
  // identical routing decision the previous hardcoded `if` did, by construction: TRR's own
  // CapabilityDeclaration (trrCapabilityAdapter.js) declares scopeMatch:{domain:'WORKOUT',
  // topic:'WORKOUT_FREQUENCY'} — the same literal pair this file always checked directly.
  var CapabilityRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('./capabilityRegistry.js')
    : window.CapabilityRegistry;

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // §06 Step A — domain-agnostic Need recognition. Gated ONLY on:
  //   1. turnUnderstanding.interpretationStatus === 'CLASSIFIED' (§17 Case C never produces a
  //      Need — a failed interpretation is never treated as a successful "no request" either);
  //   2. turnUnderstanding.affirmativeRequest.present === true (§17 Case A — no request present —
  //      also never produces a Need).
  // Never gated on domain/topic resolution, negativeControlPresent, or desireOnlyPresent.
  function recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext) {
    if (!isPlainObject(turn) || typeof turn.turnId !== 'string' || turn.turnId.length === 0) return null;
    if (!isPlainObject(turnUnderstanding)) return null;
    if (turnUnderstanding.interpretationStatus !== 'CLASSIFIED') return null; // §17 Case C
    var affirmativeRequest = turnUnderstanding.affirmativeRequest;
    if (!isPlainObject(affirmativeRequest) || affirmativeRequest.present !== true) return null; // §17 Case A

    // A legitimate DirectUserNeed now exists, REGARDLESS of domain/topic (Blocker 2's own
    // correction — admission never depends on successful classification into a closed
    // vocabulary).
    var assembledAt = (pipelineContext && pipelineContext.assembledAt !== undefined) ? pipelineContext.assembledAt : null;
    var need = freezeShallow({
      needRef: 'duc:direct-user-request:' + turn.turnId,
      turnId: turn.turnId,
      domain: affirmativeRequest.domain,   // metadata only, may be null/UNRESOLVED
      topic: affirmativeRequest.topic,     // metadata only, may be null/UNRESOLVED
      recognizedAt: assembledAt
    });

    // §06 Step B — professional-capability resolution, performed on the already-recognized need,
    // never gating its existence.
    return resolveProfessionalCapability(need, turn, pipelineContext);
  }

  // §06 Step B / §09, WP0 Phase B — CapabilityRegistry-routed (see file header). Opportunity
  // construction below remains TRR's own, unmodified shape — the Registry lookup only replaces
  // how the MATCH is decided, never what happens once matched.
  function resolveProfessionalCapability(need, turn, pipelineContext) {
    var detectedAt = (pipelineContext && pipelineContext.assembledAt !== undefined) ? pipelineContext.assembledAt : null;

    // WP0 Phase B — the routing decision itself, via CapabilityRegistry (matching-only, §16).
    // registryNeed is a minimal adapter object; this file's own `need` shape (needRef/turnId/
    // domain/topic/recognizedAt) is unchanged and still returned/used exactly as before.
    var registryNeed = { legacyScopeMatch: (need.domain != null && need.topic != null) ? { domain: need.domain, topic: need.topic } : null };
    var matchedCapability = CapabilityRegistry ? CapabilityRegistry.resolveCapability(registryNeed) : null;
    var isTrrMatch = !!matchedCapability
      && matchedCapability.acceptedNeedCharacteristics.scopeMatch !== 'FALLBACK'
      && matchedCapability.id === 'TRR';

    if (isTrrMatch) {
      return freezeShallow({
        kind: 'DETECTED_OPPORTUNITY',
        opportunity: freezeShallow({
          id: need.needRef,
          sourceCategory: 'DIRECT_USER_REQUEST',
          detectingContributor: 'CONVERSATIONAL_NEED_CREATOR',
          turnId: turn.turnId,                                 // NEW additive field — §14
          proposedAction: '__DUC_PENDING_REASONING__',          // TRR's own established placeholder convention [initiativeEngine.js:623]
          domain: 'WORKOUT',
          topic: 'WORKOUT_FREQUENCY',
          // Mechanically required by initiativeEngine.js's own validateRequest() (Stage 6,
          // isValidConfidence(o.confidence)) — not present in the SPEC §06 Step B code block as
          // frozen, but every other DetectedOpportunity this file's own Stage-3 siblings construct
          // (initiativeEngine.js:426/513/582/649) always carries one, sourced from a real signal's
          // own confidence — e.g. detectTrainingReadinessOpportunities()'s own
          // `confidence: observation.confidence`. DUC-001 Post-Implementation review (Investigation
          // 4) traced this precedent precisely: `Candidate.confidence` has never, anywhere in this
          // codebase, meant "confidence that the professional advice is correct" — it means
          // "confidence that the MOTIVATING SIGNAL is real," per D1-ER-01's own claim-type
          // discipline (Fact/Observation/Inference/Hypothesis SHALL NOT be conflated) and D1-ER-05
          // ("confidence SHALL be communicated honestly and SHALL calibrate delivery firmness").
          // For a Habit-derived Observation that signal is an inferred, decaying pattern
          // (Observation/Inference-type); for a direct user request it is the user's own literal,
          // present-tense statement — a Fact-type claim, already verified by Turn Understanding
          // (§04) before this function is ever called, for which 1 is the honest, non-manufactured
          // confidence (D1-ER-06 forbids manufacturing false certainty OR false uncertainty
          // equally). Professional uncertainty about the underlying life-fact (whether the user
          // should in fact train today) remains represented exclusively by the reasoning
          // component's own separate `rationale.uncertainty` contract — never by this field, in
          // this or any other producer. This is a consistent reuse of the field's one existing
          // architecture-wide meaning, not a second, conflicting semantic.
          confidence: 1,
          // Mechanically required by initiativeEngine.js's own validateRequest() (Stage 6,
          // D1-IP-03) — likewise absent from the SPEC §06 Step B code block as frozen. Reuses
          // ['DECISION_QUALITY'] byte-identically from initiativeEngine.js's own existing
          // detectTrainingReadinessOpportunities() [initiativeEngine.js:660], which already
          // constructs this exact value for this exact validReasonCategory ("the reasoning this
          // Need triggers") — the proactive TRR path's own precedent for the identical reasoning
          // gate this SPEC reuses byte-identically (§10).
          valueDimensions: ['DECISION_QUALITY'],
          validReasonCategory: 'ADAPT_TO_CURRENT_STATE',         // V1 capability mapping only — Decision 14/19, never a redefinition
          trustTestSignal: freezeShallow({
            glad: null,
            basis: 'DIRECT_USER_REQUEST admits via the Bounded Engagement Policy, not an affirmative Trust source — see §08.'
          }),
          safetyHighRiskBypass: false,
          detectedAt: detectedAt
        })
      });
    }
    // §12 — consumed by DecisionFormation.formUnsupportedCapabilityOutcome(); a real,
    // already-recognized DirectUserNeed, honestly routed to the unsupported-capability outcome
    // rather than silently dropped or misrouted to TRR.
    return freezeShallow({ kind: 'UNSUPPORTED', need: need });
  }

  var API = {
    recognizeDirectUserNeed: recognizeDirectUserNeed,
    _internal: {
      resolveProfessionalCapability: resolveProfessionalCapability
    }
  };

  if (typeof window !== 'undefined') { window.ConversationalNeedCreator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
