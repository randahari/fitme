// ══════════════════════════════════════════════════════════════════
// FitMe — Safety Integration Port (TASK-006, Canonical Decision CD-T006-05,
// TASK_006_SPEC_v1.0.md §21.8; additively extended by SL-001, RCD-13,
// docs/specs/SL-001_SPEC_v1.0.md Ch.25-26)
// Exclusive responsibility: define the SafetyIntegrationPort contract shape
// only — the plain, platform-neutral interface through which Stage 8
// (Winner Selection) and Stage 9 (Decision Formation) call into whatever
// Safety Layer implementation a future, separately-scoped task provides
// (Section 38 item G-6). No Safety Layer policy logic lives here. This
// module does not implement the Safety Layer itself (Non-Goal, Section 8,
// 9.3) — it defines the call/response shape only, and the closed
// five-disposition vocabulary Stage 9 maps deterministically (Canonical
// Decision CD-T006-06).
//
// Production requirement (Section 21.7/21.8): production code SHALL call a
// real implementation of this port; it SHALL NOT bypass the port, SHALL NOT
// substitute a hard-coded "always unmodified"/"always qualified" stub, and
// SHALL NOT otherwise fake a Safety determination. Until a real Safety
// Layer implementation exists, a Decision Pass cannot complete past Stage 8
// in production — this is the intended, safe failure mode (D3 §12.3: never
// substitute a default Terminal Decision), not a defect to engineer around.
// A deterministic test double implementing this same shape is permitted in
// tests only (Section 21.8, Section 35.7) — see tests/fixtures/ for the
// test-only double; it is never imported by production code.
//
// SL-001 / RCD-13 additive extension (SPEC Ch.25-26): DisqualificationResult
// and SafetyReviewResult each gain a mandatory `reasonCode` (closed
// thirteen-value catalogue, RCD-11/RCD-13.A) and an optional `reasonDetail`
// (`{ secondaryReasonCodes: ReasonCode[] } | null`, RCD-13.B). The
// pre-existing `reason` field is preserved unchanged in shape and is kept
// only as a deprecated compatibility mirror (RCD-13.E) — never canonical
// authority, never free text. No method, parameter, or disposition value is
// added, removed, or altered; this is a strict, additive, backward-
// compatible shape extension of an already-shipped contract, per RCD-13's
// own approved terms.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Canonical Decision CD-T006-06 — the exact, exhaustive five-value Safety Layer disposition
  // vocabulary Stage 9's final review may return (D1-AB-05, D1-AB-02).
  var DISPOSITIONS = Object.freeze(['UNMODIFIED', 'MODIFIED', 'DEFERRED', 'BLOCKED', 'ESCALATED']);

  // RCD-11 / RCD-13.A — the exact, exhaustive, closed thirteen-value reasonCode catalogue.
  // Engineering SHALL NOT extend this list (SPEC Ch.17).
  var REASON_CODES = Object.freeze([
    'NO_SAFETY_CONFLICT',
    'KNOWN_ALLERGY_CONFLICT',
    'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT',
    'ACTIVE_HIGH_RISK_SYMPTOM',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT',
    'DANGEROUS_OR_EXTREME_REQUEST',
    'PERMANENT_SAFETY_COMMITMENT_CONFLICT',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN',
    'PSYCHOLOGICAL_DISTRESS_CONCERN',
    'OUTSIDE_COACHING_SCOPE',
    'INSUFFICIENT_SAFETY_CONTEXT',
    'INFERRED_SIGNAL_NOT_SUFFICIENT',
    'PROFESSIONAL_SUPPORT_REQUIRED'
  ]);

  // RCD-09/RCD-12 disposition precedence, most- to least-protective (Ch.16). Exported so
  // callers needing the precedence order (e.g. the Safety Layer's own cross-Rule sequencing)
  // cite a single canonical source rather than re-declaring it.
  var DISPOSITION_PRECEDENCE = Object.freeze(['ESCALATED', 'BLOCKED', 'DEFERRED', 'MODIFIED', 'UNMODIFIED']);

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  // RCD-13.B — SafetyReasonDetail shape/rules validator. `primaryReasonCode` is supplied by the
  // caller (the reasonCode this reasonDetail is attached to) so the "must not appear in
  // secondaryReasonCodes" invariant can be checked without this function re-deriving it.
  function isValidSafetyReasonDetail(reasonDetail, primaryReasonCode) {
    if (reasonDetail === null) return true;
    if (!isPlainObject(reasonDetail)) return false;
    if (!Array.isArray(reasonDetail.secondaryReasonCodes)) return false;
    var seen = {};
    for (var i = 0; i < reasonDetail.secondaryReasonCodes.length; i++) {
      var code = reasonDetail.secondaryReasonCodes[i];
      if (REASON_CODES.indexOf(code) === -1) return false; // unknown value
      if (code === 'NO_SAFETY_CONFLICT') return false; // never a secondary reason
      if (code === primaryReasonCode) return false; // primary SHALL NOT appear in secondaryReasonCodes
      if (seen[code]) return false; // duplicate values forbidden
      seen[code] = true;
    }
    return true;
  }

  // RCD-13.E — the deprecated `reason` compatibility mirror: null when reasonCode is
  // NO_SAFETY_CONFLICT, otherwise the exact reasonCode literal; never free text.
  function isValidDeprecatedReasonMirror(reason, reasonCode) {
    if (reasonCode === 'NO_SAFETY_CONFLICT') return reason === null;
    return reason === reasonCode;
  }

  // Shared RCD-13.C/D reasonCode/reasonDetail/reason shape check, common to both
  // DisqualificationResult and SafetyReviewResult.
  function hasValidReasonFields(r) {
    if (REASON_CODES.indexOf(r.reasonCode) === -1) return false;
    if (!('reasonDetail' in r) || !isValidSafetyReasonDetail(r.reasonDetail, r.reasonCode)) return false;
    if (!isValidDeprecatedReasonMirror(r.reason, r.reasonCode)) return false;
    return true;
  }

  // Stage 8 (Section 20.3, 21.2) response-shape validator. Per Section 21.8: "One entry per
  // submitted Candidate" — the response array's length and order are expected to match the
  // submitted pool exactly; matching is done positionally by the caller (winnerSelection.js),
  // not by re-deriving identity from opportunityProvenance here.
  // RCD-13.C additive invariants: disqualified === false requires reasonCode ===
  // NO_SAFETY_CONFLICT (reasonDetail/reason both null); disqualified === true requires
  // reasonCode !== NO_SAFETY_CONFLICT.
  function isValidDisqualificationResultArray(results, submittedPool) {
    if (!Array.isArray(results)) return false;
    if (!Array.isArray(submittedPool) || results.length !== submittedPool.length) return false;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!isPlainObject(r)) return false;
      if (typeof r.disqualified !== 'boolean') return false;
      if (!('opportunityProvenance' in r)) return false;
      if (!('reason' in r)) return false;
      if (!hasValidReasonFields(r)) return false;
      if (r.disqualified === false) {
        if (r.reasonCode !== 'NO_SAFETY_CONFLICT') return false;
        if (r.reasonDetail !== null) return false;
      } else {
        if (r.reasonCode === 'NO_SAFETY_CONFLICT') return false;
      }
    }
    return true;
  }

  // Stage 9 (Section 21.3, 21.5) response-shape validator — exactly one of the five CD-T006-06
  // dispositions; modifiedContent present only when MODIFIED (not enforced strictly here beyond
  // presence, since its own shape is Safety-Layer-defined, out of this port's own scope).
  // RCD-13.D additive invariants, exactly per SPEC Ch.26's per-disposition table: UNMODIFIED
  // requires reasonCode NO_SAFETY_CONFLICT (reasonDetail/reason null); every other disposition
  // requires reasonCode !== NO_SAFETY_CONFLICT; DEFERRED requires reasonCode to be one of the
  // two RCD-12.E-fixed codes; ESCALATED requires reasonCode === PROFESSIONAL_SUPPORT_REQUIRED.
  function isValidSafetyReviewResult(result) {
    if (!isPlainObject(result)) return false;
    if (DISPOSITIONS.indexOf(result.disposition) === -1) return false;
    if (!('reason' in result)) return false;
    if (!hasValidReasonFields(result)) return false;

    switch (result.disposition) {
      case 'UNMODIFIED':
        if (result.reasonCode !== 'NO_SAFETY_CONFLICT') return false;
        if (result.reasonDetail !== null) return false;
        break;
      case 'DEFERRED':
        if (result.reasonCode !== 'INSUFFICIENT_SAFETY_CONTEXT' && result.reasonCode !== 'INFERRED_SIGNAL_NOT_SUFFICIENT') return false;
        break;
      case 'ESCALATED':
        if (result.reasonCode !== 'PROFESSIONAL_SUPPORT_REQUIRED') return false;
        break;
      case 'BLOCKED':
      case 'MODIFIED':
        if (result.reasonCode === 'NO_SAFETY_CONFLICT') return false;
        break;
    }
    return true;
  }

  var API = {
    DISPOSITIONS: DISPOSITIONS,
    DISPOSITION_PRECEDENCE: DISPOSITION_PRECEDENCE,
    REASON_CODES: REASON_CODES,
    isValidSafetyReasonDetail: isValidSafetyReasonDetail,
    isValidDisqualificationResultArray: isValidDisqualificationResultArray,
    isValidSafetyReviewResult: isValidSafetyReviewResult
  };

  if (typeof window !== 'undefined') { window.SafetyIntegrationPort = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
