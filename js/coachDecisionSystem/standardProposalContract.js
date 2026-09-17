// ══════════════════════════════════════════════════════════════════
// FitMe — Standard Proposal Contract (WP0 Phase C, docs/specs/WP0_SPEC_v1.0.md §19)
// Exclusive responsibility: define the STANDARD_PROPOSAL shape/validation only — the shared
// output contract every capability (General or Specialized) emits, so Safety/Decision
// Formation/Expression never fork on which capability produced a proposal. Mirrors
// safetyIntegrationPort.js's own "define the contract shape only, no policy logic" pattern
// exactly.
//
// This is a direct, verified generalization of TRR-001's own already-proven reasoning-output
// shape (js/coachDecisionSystem/trainingReadinessReasoningComponent.js's `isValidReasoningOutput()`,
// read in full before this file was written) — the closed three-value outcome vocabulary and the
// core explanation fields (rationale/evidenceBasis/expectedValue/uncertainty) are unchanged from
// TRR's own precedent. TRR itself is NOT modified to use this module — it keeps its own,
// unmodified, closed validator (Ownership rule: this is a new, shared contract other capabilities
// may adopt; it does not retroactively alter TRR-001's own closed validation).
//
// What generalizes and what does not, disclosed precisely: `actionCategory`/`activityReference`
// are TRR-specific vocabulary (PHYSICAL_ACTIVITY/NON_ACTIVITY_COACHING_ACTION) — this shared
// contract treats them as optional, unconstrained-value fields (present or absent only), never
// imposing that closed vocabulary on a domain-agnostic capability like General Reasoning. Forcing
// every future capability's action classification into TRR's own two-value vocabulary would be
// exactly the kind of hidden taxonomy WP0's own binding Invariant (§10) forbids.
//
// WP0 Phase D.1 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §10.1, Revision 2,
// Product+Architecture APPROVED): isValidRiskCharacteristicTags() below now checks real
// closed-vocabulary membership via RiskCharacteristicValidator, replacing Phase C's own
// placeholder {dimension,value} shape check ("the closed dimension set itself is Phase D, not yet
// defined" — capabilityRegistry.js's own contemporaneous comment). This is a shape-only check
// (RiskCharacteristicValidator.isValidRiskCharacteristicTagShape()) — no source text is available
// at this call site, so literal-anchor re-verification is out of scope here by design (it is
// riskCharacteristicIntakeGate.js's own concern, Phase D.3, where source text exists).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var RiskCharacteristicValidator = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicValidator.js')
    : window.RiskCharacteristicValidator;

  var OUTCOMES = Object.freeze(['ACTION_PROPOSED', 'CLARIFICATION_NEEDED', 'NO_VIABLE_PROPOSAL']);

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  // §19/§27 — riskCharacteristicTags is a PROPOSAL/INPUT SIGNAL only, never Safety authority in
  // itself (Round 2 correction 3, binding). Phase D.1 (see header): checks real closed-vocabulary
  // membership for each tag, shape-only (no literal-anchor re-verification at this call site) —
  // still asserts nothing about Safety's own consumption of it.
  function isValidRiskCharacteristicTags(tags) {
    if (tags === undefined) return true; // optional
    if (!Array.isArray(tags)) return false;
    return tags.every(function (t) { return RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(t); });
  }

  // §28 — mutationProposal is optional; when present it must be a plain object carrying a
  // non-empty mutationKind. This module validates SHAPE only — whether a given capability is
  // actually PERMITTED to emit one is CapabilityDeclaration.mutationPermissions' own concern
  // (checked by the capability itself, never inferred here).
  function isValidMutationProposal(mp) {
    if (mp === undefined || mp === null) return true; // optional, absent is the common case
    return isPlainObject(mp) && isNonEmptyString(mp.mutationKind) && isPlainObject(mp.proposedData || {});
  }

  // Direct generalization of trainingReadinessReasoningComponent.js's own isValidReasoningOutput()
  // — same three-outcome gating structure, same required-field set for non-NO_VIABLE_PROPOSAL
  // outcomes. actionCategory/activityReference are optional and unconstrained here (see header).
  function isValidStandardProposal(p) {
    if (!isPlainObject(p)) return false;
    if (OUTCOMES.indexOf(p.outcome) === -1) return false;
    if (!isValidRiskCharacteristicTags(p.riskCharacteristicTags)) return false;
    if (!isValidMutationProposal(p.mutationProposal)) return false;

    if (p.outcome === 'NO_VIABLE_PROPOSAL') return true; // no other field required, matching TRR's own precedent

    if (!isNonEmptyString(p.action)) return false;
    if (!isNonEmptyString(p.rationale) || !isNonEmptyString(p.evidenceBasis)
      || !isNonEmptyString(p.expectedValue) || p.uncertainty == null || p.uncertainty === '') return false;

    // actionCategory/activityReference: optional, no value constraint (see header) — present or
    // absent only; a capability wanting a closed vocabulary for these enforces it in its own,
    // additional validation layer (as TRR-001 already does, unmodified).
    return true;
  }

  var API = {
    OUTCOMES: OUTCOMES,
    isValidStandardProposal: isValidStandardProposal
  };

  if (typeof window !== 'undefined') { window.StandardProposalContract = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
