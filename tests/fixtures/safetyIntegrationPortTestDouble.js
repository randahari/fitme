// TASK-006 — deterministic SafetyIntegrationPort test double (TASK_006_SPEC_v1.0.md §21.8,
// Canonical Decision CD-T006-05); additively updated for SL-001/RCD-13's mandatory reasonCode/
// reasonDetail/reason contract (docs/specs/SL-001_SPEC_v1.0.md Ch.25-26), and additively updated
// again for the Stage-9 Winning-Candidate Safety Input Canonical Decision
// (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md):
// `finalReview()` now accepts and records the optional third `candidate` argument. Test-only
// fixture, satisfying the same interface a real Safety Layer implementation would
// (js/coachDecisionSystem/safetyIntegrationPort.js) — never imported by production code (no
// production file requires this path; see tests/coachDecisionSystemWiring.test.js's dedicated
// negative test for this guarantee).
'use strict';

// disqualifyRule(candidate) -> boolean | ReasonCode string; reviewRule(preReviewTerminalDecision,
// pipelineContext, candidate) -> SafetyReviewResult (full RCD-13-conformant shape, including
// reasonCode/reasonDetail). Defaults: nothing disqualified, every review UNMODIFIED/
// NO_SAFETY_CONFLICT — override per test as needed. A `disqualifyRule` returning a specific
// ReasonCode string (instead of a bare `true`) selects that code as the disqualification's
// reasonCode; a bare `true` defaults to DANGEROUS_OR_EXTREME_REQUEST, an arbitrary-but-valid
// non-NO_SAFETY_CONFLICT closed-catalogue value, since most callers only care that `disqualified`
// is true, not which code accompanies it. `calls.lastFinalReviewCandidate` records the exact
// `candidate` argument the most recent `finalReview()` call received (including `undefined` when
// the caller omitted it, e.g. TIED_SET) — for tests asserting the Stage-9 Winning-Candidate Safety
// Input Canonical Decision's own call-shape contract without needing the real Safety Layer.
function makeSafetyIntegrationPortTestDouble(overrides) {
  overrides = overrides || {};
  var disqualifyRule = overrides.disqualifyRule || function () { return false; };
  var reviewRule = overrides.reviewRule || function () {
    return { disposition: 'UNMODIFIED', modifiedContent: null, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null };
  };
  var calls = { disqualify: 0, finalReview: 0, lastFinalReviewCandidate: undefined };

  return {
    calls: calls,
    async disqualify(candidatePool, pipelineContext) {
      calls.disqualify++;
      return candidatePool.map(function (c) {
        var d = disqualifyRule(c, pipelineContext);
        if (!d) {
          return { opportunityProvenance: c.opportunityProvenance, disqualified: false, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null };
        }
        var reasonCode = typeof d === 'string' ? d : 'DANGEROUS_OR_EXTREME_REQUEST';
        return { opportunityProvenance: c.opportunityProvenance, disqualified: true, reasonCode: reasonCode, reasonDetail: null, reason: reasonCode };
      });
    },
    async finalReview(preReviewTerminalDecision, pipelineContext, candidate) {
      calls.finalReview++;
      calls.lastFinalReviewCandidate = candidate;
      return reviewRule(preReviewTerminalDecision, pipelineContext, candidate);
    }
  };
}

module.exports = { makeSafetyIntegrationPortTestDouble: makeSafetyIntegrationPortTestDouble };
