// TASK-006 — deterministic SafetyIntegrationPort test double (TASK_006_SPEC_v1.0.md §21.8,
// Canonical Decision CD-T006-05). Test-only fixture, satisfying the same interface a real Safety
// Layer implementation would (js/coachDecisionSystem/safetyIntegrationPort.js) — never imported
// by production code (no production file requires this path; see
// tests/coachDecisionSystemWiring.test.js's dedicated negative test for this guarantee).
'use strict';

// disqualifyRule(candidate) -> boolean; reviewRule(preReviewTerminalDecision) -> SafetyReviewResult.
// Defaults: nothing disqualified, every review UNMODIFIED — override per test as needed.
function makeSafetyIntegrationPortTestDouble(overrides) {
  overrides = overrides || {};
  var disqualifyRule = overrides.disqualifyRule || function () { return false; };
  var reviewRule = overrides.reviewRule || function () { return { disposition: 'UNMODIFIED', modifiedContent: null, reason: null }; };
  var calls = { disqualify: 0, finalReview: 0 };

  return {
    calls: calls,
    async disqualify(candidatePool, pipelineContext) {
      calls.disqualify++;
      return candidatePool.map(function (c) {
        var d = disqualifyRule(c, pipelineContext);
        return { opportunityProvenance: c.opportunityProvenance, disqualified: !!d, reason: d ? (typeof d === 'string' ? d : 'test-double disqualification') : null };
      });
    },
    async finalReview(preReviewTerminalDecision, pipelineContext) {
      calls.finalReview++;
      return reviewRule(preReviewTerminalDecision, pipelineContext);
    }
  };
}

module.exports = { makeSafetyIntegrationPortTestDouble: makeSafetyIntegrationPortTestDouble };
