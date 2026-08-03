// ══════════════════════════════════════════════════════════════════
// FitMe — Winner Selection (TASK-006, D2 Stage 8 — Winner Selection,
// TASK_006_SPEC_v1.0.md §20-21)
// Exclusive responsibility: select exactly one winning Candidate from
// Stage 7's ranked pool by default, or the narrow permitted tied set only
// where D1-PR-06's full tie-break sequence is genuinely exhausted (§19.2,
// §20.1/20.2), subject to Safety Layer disqualification applied ahead of
// final selection (§20.3, §21.2). Winner Selection does not itself form a
// Terminal Decision (§20's final clause) — its output is exclusively an
// input to Stage 9 (decisionFormation.js). internal collaborator only; not
// independently registered. Deterministic: identical ranked pool +
// identical Safety disqualification results -> identical winner/tied set
// (§20.7).
//
// Safety disqualification (§21.2, §21.8) is called through the
// SafetyIntegrationPort. Production SHALL call a real Safety Layer
// implementation behind this port (Canonical Decision CD-T006-05,
// safetyIntegrationPort.js) — this module never bypasses, fakes, or
// simulates a disqualification determination (§13 items 6-7, §21.6).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var Prioritization = (typeof module !== 'undefined' && module.exports)
    ? require('./prioritization.js')
    : window.Prioritization;
  var SafetyIntegrationPort = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyIntegrationPort.js')
    : window.SafetyIntegrationPort;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // §20.3/21.2 — Safety disqualification applied to the ranked pool ahead of final selection;
  // §20.4 — the ranking itself is never recomputed, disqualification only removes eligibility for
  // winner status. §20.5/23.5 — an all-disqualified pool yields an explicit ALL_DISQUALIFIED
  // result for Decision Formation to resolve per D1 Unit 14, never a fabricated substitute
  // winner. Positional matching against the submitted pool, per the port's own "one entry per
  // submitted Candidate" contract (§21.8) — never re-derived from opportunityProvenance identity.
  async function select(params) {
    params = params || {};
    var rankedPool = Array.isArray(params.rankedPool) ? params.rankedPool : [];
    var pipelineContext = params.pipelineContext;
    var safetyPort = params.safetyPort;

    if (rankedPool.length === 0) {
      return freezeShallow({ status: 'ABORT', reason: 'EMPTY_RANKED_POOL' });
    }
    if (!safetyPort || typeof safetyPort.disqualify !== 'function') {
      // §21.7 — production SHALL NOT proceed without a real Safety Layer behind the port; no
      // Terminal Decision is fabricated in its absence.
      return freezeShallow({ status: 'ABORT', reason: 'SAFETY_LAYER_UNAVAILABLE' });
    }

    var disqualificationResults;
    try {
      disqualificationResults = await safetyPort.disqualify(rankedPool, pipelineContext);
    } catch (e) {
      return freezeShallow({ status: 'ABORT', reason: 'SAFETY_DISQUALIFY_THREW' });
    }

    if (!SafetyIntegrationPort.isValidDisqualificationResultArray(disqualificationResults, rankedPool)) {
      return freezeShallow({ status: 'ABORT', reason: 'INVALID_SAFETY_DISQUALIFICATION_RESPONSE' });
    }

    var survivors = [];
    var disqualifiedCandidates = [];
    for (var i = 0; i < rankedPool.length; i++) {
      if (disqualificationResults[i].disqualified === true) {
        disqualifiedCandidates.push(rankedPool[i].opportunityProvenance);
      } else {
        survivors.push(rankedPool[i]);
      }
    }

    if (survivors.length === 0) {
      return freezeShallow({ status: 'ALL_DISQUALIFIED', disqualifiedCandidates: freezeShallow(disqualifiedCandidates) });
    }

    // §20.1/20.2 — the top-ranked survivor's tied group (§19.2's resolvable-vs-genuinely-
    // unresolved distinction, applied here via the same compareCandidates() Stage 7 already used
    // — the ranking itself is preserved, not recomputed, §20.4/20.8).
    var top = survivors[0];
    var tiedGroup = [top];
    for (var j = 1; j < survivors.length; j++) {
      if (Prioritization.compareCandidates(top, survivors[j]) === 0) {
        tiedGroup.push(survivors[j]);
      } else {
        break;
      }
    }

    if (tiedGroup.length === 1) {
      return freezeShallow({ status: 'SINGLE_WINNER', winner: top, disqualifiedCandidates: freezeShallow(disqualifiedCandidates) });
    }
    return freezeShallow({ status: 'TIED_SET', tiedSet: freezeShallow(tiedGroup), disqualifiedCandidates: freezeShallow(disqualifiedCandidates) });
  }

  var API = { select: select };

  if (typeof window !== 'undefined') { window.WinnerSelection = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
