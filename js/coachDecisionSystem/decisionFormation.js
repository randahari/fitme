// ══════════════════════════════════════════════════════════════════
// FitMe — Decision Formation (TASK-006, D2 Stage 9 — Decision Formation,
// TASK_006_SPEC_v1.0.md §22-25)
// Exclusive responsibility: assemble the Decision Pass's single, fully-
// formed Terminal Decision (D1 Unit 15) from exactly one of: a single
// winning Candidate (§22.1), the full permitted tied set (§22.2), a
// Decision-Pass-level Silence determination (§22.3), or a Safety-modified/
// deferred/blocked/escalated outcome (§22.4, Canonical Decision
// CD-T006-06) — subject to the Safety Layer's final, non-bypassable
// review (§21.3) where a winning Candidate or tied set exists. Never more
// than one Terminal Decision per Decision Pass (§22.7); never an
// incomplete decision handed downstream (§22.6). internal collaborator
// only; not independently registered.
//
// Engineering-flagged interpretation (§23.5, all-Candidates-disqualified):
// D2 itself does not fix which of Silence or Refusal applies in every
// all-disqualified case, and the DisqualificationResult contract (§21.8)
// carries no field distinguishing "silence-worthy" from "refusal-worthy"
// disqualification — the Decision Engine has no independent Safety
// judgment of its own to make that call (§13 item 7, §21.6). Absent that
// signal, this module resolves the all-disqualified path to kind: 'SILENCE'
// — the more conservative of the two already-approved outcome kinds,
// consistent with never fabricating content (D1-DI-02) rather than
// inventing a basis for an assertive Refusal the Safety Layer's own
// disqualification reasons do not affirmatively supply. For the same
// reason, safetyPort.finalReview() is not invoked for this path (no
// winning Candidate or tied set exists to submit, per the port's own
// documented calling contract, §21.8) and `safetyDisposition` is therefore
// absent, structurally identical in this respect to the zero-surviving-
// candidates path (§23.4). This is flagged for Product/Architecture
// confirmation, same non-blocking status as the spec's own G-9 item.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var SafetyIntegrationPort = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyIntegrationPort.js')
    : window.SafetyIntegrationPort;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  // TASK-004/TASK-005 kind literals ('Recommendation' / 'INITIATIVE', Repository Gap G-3, not
  // normalized by this document per §34.5) -> the four CD-T006-06 Terminal Decision families.
  function candidateTerminalKind(candidateKind) {
    if (candidateKind === 'Recommendation') return 'RECOMMENDATION';
    if (candidateKind === 'INITIATIVE') return 'INITIATIVE';
    return null;
  }

  // §23.4 / D2-INV-05 / D2-PP-04 — Decision Formation still runs, once, to produce a single,
  // fully-formed Silence Terminal Decision when no Opportunity this cycle produced a surviving
  // Candidate. safetyDisposition is absent (finalReview() is never called — no Candidate content
  // exists for Safety to review, §21.8). candidateProvenance is an empty array.
  function formDecisionPassSilence(params) {
    params = params || {};
    var opportunitiesConsidered = Array.isArray(params.opportunitiesConsidered) ? params.opportunitiesConsidered : [];
    return freezeShallow({
      status: 'FORMED',
      decision: freezeShallow({
        kind: 'SILENCE',
        rationale: freezeShallow({
          rationale: 'No Opportunity this cycle produced a surviving Candidate.',
          evidenceBasis: 'D2-INV-05 / D2-PP-04 — Decision-Pass-level Silence.',
          expectedValue: 'Preserves the shared attention/trust budget for a future, better-supported Opportunity (D1-PR-04).',
          uncertainty: 'None — this outcome is deterministic given zero surviving Candidates across the pass.'
        }),
        decisionPassTrace: freezeShallow({
          opportunitiesConsidered: freezeShallow(opportunitiesConsidered.slice()),
          candidatePoolSize: 0,
          disqualifiedCandidates: freezeShallow([])
        }),
        candidateProvenance: freezeShallow([]),
        immutable: true
      })
    });
  }

  // §22.1/22.2/22.4/23.5, Canonical Decision CD-T006-06 — assembles the Terminal Decision from
  // Stage 8's SINGLE_WINNER, TIED_SET, or ALL_DISQUALIFIED selection result.
  async function form(params) {
    params = params || {};
    var selection = params.selection || {};
    var pipelineContext = params.pipelineContext;
    var safetyPort = params.safetyPort;
    var opportunitiesConsidered = Array.isArray(params.opportunitiesConsidered) ? params.opportunitiesConsidered : [];
    var candidatePoolSize = typeof params.candidatePoolSize === 'number' ? params.candidatePoolSize : 0;

    if (selection.status === 'ABORT') {
      return freezeShallow({ status: 'ABORTED', reason: selection.reason || 'WINNER_SELECTION_ABORTED' });
    }

    var decisionPassTrace = freezeShallow({
      opportunitiesConsidered: freezeShallow(opportunitiesConsidered.slice()),
      candidatePoolSize: candidatePoolSize,
      disqualifiedCandidates: freezeShallow((selection.disqualifiedCandidates || []).slice())
    });

    // §20.5/23.5 — see file header for the documented, flagged engineering interpretation.
    if (selection.status === 'ALL_DISQUALIFIED') {
      return freezeShallow({
        status: 'FORMED',
        decision: freezeShallow({
          kind: 'SILENCE',
          rationale: freezeShallow({
            rationale: 'Every Candidate in the shared pool this Decision Pass was disqualified by the Safety Layer.',
            evidenceBasis: 'Stage 8 Safety disqualification (D1-RP-07).',
            expectedValue: 'Protects the user from an unsafe recommendation or initiative.',
            uncertainty: 'Silence is the conservative default absent an explicit Safety-communicated basis for a Refusal (D1 Unit 14, §23.5 — flagged, non-blocking).'
          }),
          decisionPassTrace: decisionPassTrace,
          candidateProvenance: freezeShallow((selection.disqualifiedCandidates || []).slice()),
          immutable: true
        })
      });
    }

    if (selection.status !== 'SINGLE_WINNER' && selection.status !== 'TIED_SET') {
      return freezeShallow({ status: 'ABORTED', reason: 'INVALID_WINNER_SELECTION_RESULT' });
    }

    var isTied = selection.status === 'TIED_SET';
    var members = isTied ? selection.tiedSet : [selection.winner];
    var primary = members[0];
    var winningKind = candidateTerminalKind(primary.kind);
    if (!winningKind) {
      return freezeShallow({ status: 'ABORTED', reason: 'UNKNOWN_CANDIDATE_KIND' });
    }

    var candidateProvenance = freezeShallow(members.map(function (c) { return c.opportunityProvenance; }));
    var options = isTied ? freezeShallow(members.slice()) : undefined;

    var preReviewDecision = freezeShallow({
      kind: winningKind,
      rationale: primary.rationale,
      confidence: primary.confidence,
      hierarchyTier: primary.hierarchyTier,
      candidateProvenance: candidateProvenance,
      options: options
    });

    if (!safetyPort || typeof safetyPort.finalReview !== 'function') {
      // §21.7 — production SHALL NOT proceed without a real Safety Layer behind the port.
      return freezeShallow({ status: 'ABORTED', reason: 'SAFETY_LAYER_UNAVAILABLE' });
    }

    var reviewResult;
    try {
      reviewResult = await safetyPort.finalReview(preReviewDecision, pipelineContext);
    } catch (e) {
      return freezeShallow({ status: 'ABORTED', reason: 'SAFETY_FINAL_REVIEW_THREW' });
    }

    if (!SafetyIntegrationPort.isValidSafetyReviewResult(reviewResult)) {
      return freezeShallow({ status: 'ABORTED', reason: 'INVALID_SAFETY_REVIEW_RESPONSE' });
    }

    var disposition = reviewResult.disposition;
    var base = {
      rationale: primary.rationale,
      candidateProvenance: candidateProvenance,
      decisionPassTrace: decisionPassTrace,
      safetyDisposition: freezeShallow({ disposition: disposition, originalKind: winningKind }),
      immutable: true
    };
    if (isTied) base.options = options;

    var decision;
    switch (disposition) {
      case 'UNMODIFIED':
        decision = Object.assign({}, base, { kind: winningKind, confidence: primary.confidence, hierarchyTier: primary.hierarchyTier });
        break;
      case 'MODIFIED':
        if (!isPlainObject(reviewResult.modifiedContent)) {
          return freezeShallow({ status: 'ABORTED', reason: 'INVALID_SAFETY_REVIEW_RESPONSE' });
        }
        decision = Object.assign({}, base, {
          kind: winningKind,
          confidence: primary.confidence,
          hierarchyTier: primary.hierarchyTier,
          modification: freezeShallow({ modifiedContent: reviewResult.modifiedContent })
        });
        break;
      case 'DEFERRED':
        decision = Object.assign({}, base, { kind: 'SILENCE' });
        break;
      case 'BLOCKED':
        decision = Object.assign({}, base, { kind: 'BOUNDARY', boundaryType: 'REFUSAL' });
        break;
      case 'ESCALATED':
        decision = Object.assign({}, base, { kind: 'BOUNDARY', boundaryType: 'ESCALATION' });
        break;
      default:
        return freezeShallow({ status: 'ABORTED', reason: 'INVALID_SAFETY_DISPOSITION' });
    }

    return freezeShallow({ status: 'FORMED', decision: freezeShallow(decision) });
  }

  var API = {
    formDecisionPassSilence: formDecisionPassSilence,
    form: form
  };

  if (typeof window !== 'undefined') { window.DecisionFormation = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
