// ══════════════════════════════════════════════════════════════════
// FitMe — Safety Integration Port (TASK-006, Canonical Decision CD-T006-05,
// TASK_006_SPEC_v1.0.md §21.8)
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
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Canonical Decision CD-T006-06 — the exact, exhaustive five-value Safety Layer disposition
  // vocabulary Stage 9's final review may return (D1-AB-05, D1-AB-02).
  var DISPOSITIONS = Object.freeze(['UNMODIFIED', 'MODIFIED', 'DEFERRED', 'BLOCKED', 'ESCALATED']);

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  // Stage 8 (Section 20.3, 21.2) response-shape validator. Per Section 21.8: "One entry per
  // submitted Candidate" — the response array's length and order are expected to match the
  // submitted pool exactly; matching is done positionally by the caller (winnerSelection.js),
  // not by re-deriving identity from opportunityProvenance here.
  function isValidDisqualificationResultArray(results, submittedPool) {
    if (!Array.isArray(results)) return false;
    if (!Array.isArray(submittedPool) || results.length !== submittedPool.length) return false;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!isPlainObject(r)) return false;
      if (typeof r.disqualified !== 'boolean') return false;
      if (!('opportunityProvenance' in r)) return false;
      if (!('reason' in r)) return false;
    }
    return true;
  }

  // Stage 9 (Section 21.3, 21.5) response-shape validator — exactly one of the five CD-T006-06
  // dispositions; modifiedContent present only when MODIFIED (not enforced strictly here beyond
  // presence, since its own shape is Safety-Layer-defined, out of this port's own scope).
  function isValidSafetyReviewResult(result) {
    if (!isPlainObject(result)) return false;
    if (DISPOSITIONS.indexOf(result.disposition) === -1) return false;
    if (!('reason' in result)) return false;
    return true;
  }

  var API = {
    DISPOSITIONS: DISPOSITIONS,
    isValidDisqualificationResultArray: isValidDisqualificationResultArray,
    isValidSafetyReviewResult: isValidSafetyReviewResult
  };

  if (typeof window !== 'undefined') { window.SafetyIntegrationPort = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
