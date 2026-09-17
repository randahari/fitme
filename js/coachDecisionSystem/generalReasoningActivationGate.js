// ══════════════════════════════════════════════════════════════════
// FitMe — General Reasoning Activation Gate (WP0 Phase C, docs/specs/WP0_SPEC_v1.0.md §22)
// Exclusive responsibility: the single boolean switch distinguishing Phase C ("registered and
// fully testable, not live") from Phase E ("live user-visible fallback"). Owns nothing else —
// no routing logic, no reasoning, no context assembly.
//
// BINDING DEFAULT (Round 2/3 corrections, non-negotiable): liveFallbackApproved defaults to
// false and MUST remain false until Product/Architecture explicitly flip it, which per the
// approved rollout order (§09/§31) cannot happen before Phase D (the Safety Risk-Characteristic
// Foundation) is implemented and verified. No code in this repository flips it automatically —
// flipping it is a deployment-time decision this module deliberately does not make for itself.
//
// PHASE C DISCLOSURE: as of this Work Package, NO live routing seam (conversationalNeedCreator.js,
// internalPipelineOrchestrator.js) consults this gate at all — General Reasoning is unreachable
// from live production traffic by construction (conversationalNeedCreator.js's own Step B only
// ever constructs a real Opportunity for a capability whose id === 'TRR'; a FALLBACK match falls
// through to the existing, unmodified UNSUPPORTED path regardless of this gate's value — verified
// directly against the current repository source before this module was written). This gate exists
// as the switch a FUTURE live-wiring point (Phase E) will consult; Phase C intentionally does not
// add that consultation anywhere, to avoid touching a closed/production routing seam for a
// capability that is not yet safety-reviewed (WP0_SPEC_v1.0.md's own binding scope for this Phase).
//
// GeneralReasoningCapability IS .configure()'d with the real production callClaude closure in
// app.js (mirrors TrainingReadinessReasoningComponent.configure() exactly, and satisfies this
// repository's own general coachDecisionSystemWiring.test.js invariant that no bounded-interpreter-
// shaped component ships unwired) — reachability safety rests entirely on the routing-seam
// exclusion above, never on withholding AI-call capability from an otherwise-unreachable module.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var _liveFallbackApproved = false; // BINDING DEFAULT — see header. Never true at module load.

  function isLiveFallbackApproved() { return _liveFallbackApproved === true; }

  // Test-only, explicitly named to make misuse obvious in a code review — never called from any
  // production file (app.js does not call this; only test files may, to exercise the gated-ON
  // branch of the architecture in controlled conditions, per WP0_SPEC_v1.0.md §31 Phase C's own
  // "Phase-C tests may explicitly enable/invoke the gated capability" allowance).
  function __setLiveFallbackApprovedForTests__(value) {
    _liveFallbackApproved = value === true;
  }

  var API = {
    isLiveFallbackApproved: isLiveFallbackApproved,
    __setLiveFallbackApprovedForTests__: __setLiveFallbackApprovedForTests__
  };

  if (typeof window !== 'undefined') { window.GeneralReasoningActivationGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
