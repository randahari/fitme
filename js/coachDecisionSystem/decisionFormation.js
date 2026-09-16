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

  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §12) — a second, narrow, non-Safety-reviewed Terminal
  // Decision construction path, structurally identical in status to formDecisionPassSilence() above
  // — not a second Stage-9 authority (Decision Formation remains the sole constructor of every
  // TerminalDecision; this is simply its third recognized construction shape, alongside form()'s
  // Safety-reviewed path and formDecisionPassSilence()'s zero-Candidate path). Called when the
  // Conversational Need Creator recognizes a legitimate DirectUserNeed whose professional-capability
  // resolution found no currently-authorized capability — no Candidate ever existed, so
  // safetyPort.finalReview() is never invoked, and no safetyDisposition/boundaryType/confidence/
  // hierarchyTier/modification is ever attached (never fabricated Safety or Candidate data).
  //
  // Internal provenance: consideredEntry.opportunityId (= need.needRef =
  // 'duc:direct-user-request:' + turnId, the same id convention every DetectedOpportunity in this
  // SPEC uses) is recorded directly on decisionPassTrace.opportunitiesConsidered, reusing the exact
  // {opportunityId, sourceCategory, internalOutcome, reason} shape runDecisionPass() already
  // constructs for every other considered Opportunity — real canonical provenance on the immutable
  // TerminalDecision itself, independent of any calling code's own closure (DUC-001 SPEC §12/§B).
  function formUnsupportedCapabilityOutcome(params) {
    params = params || {};
    var need = params.need || {};
    var consideredEntry = freezeShallow({
      opportunityId: need.needRef, sourceCategory: 'DIRECT_USER_REQUEST',
      internalOutcome: 'UNSUPPORTED_CAPABILITY',
      reason: 'No (domain, topic) match against any currently-authorized professional capability.'
    });
    return freezeShallow({
      status: 'FORMED',
      decision: freezeShallow({
        kind: 'UNSUPPORTED',
        rationale: freezeShallow({
          rationale: 'A legitimate direct-user request was recognized, but no currently-authorized professional capability exists to handle it.',
          evidenceBasis: 'Conversational Need Creator Step B — no (domain, topic) match against any currently-authorized professional capability.',
          expectedValue: 'An honest response, rather than silence or misrouting, preserves user trust in FITME\'s own boundaries.',
          uncertainty: 'None — deterministic given the professional-capability resolution already performed.'
        }),
        decisionPassTrace: freezeShallow({
          opportunitiesConsidered: freezeShallow([consideredEntry].concat((params.opportunitiesConsidered || []).slice())),
          candidatePoolSize: 0,
          disqualifiedCandidates: freezeShallow([])
        }),
        candidateProvenance: freezeShallow([]),
        immutable: true
      })
    });
  }

  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13.B.1) — a fourth, narrow, non-Safety-reviewed
  // Terminal Decision construction path, structurally identical in status/shape discipline to
  // formUnsupportedCapabilityOutcome() above: no Candidate ever existed, so safetyPort.
  // finalReview() is never invoked, and no safetyDisposition/boundaryType/confidence/hierarchyTier/
  // modification is ever attached. Used ONLY by the Unified Finalization step
  // (internalPipelineOrchestrator.js runPreferenceAcknowledgmentFinalization()) when Pass 1's own
  // primary terminalDecision.kind==='SILENCE' — i.e. nothing else needed saying this turn.
  //
  // rationale keeps the SAME standard {rationale, evidenceBasis, expectedValue, uncertainty} shape
  // every other TerminalDecision kind already carries (ExpressionInputGate.isValidTerminalDecision()
  // requires this unconditionally, for every kind, via its own already-closed isValidRationale()
  // check — ALL other kinds' own rationale, including formUnsupportedCapabilityOutcome()'s own,
  // use exactly this shape). The CLOSED, non-free-text content Expression actually renders from
  // (§13/Product Decision 16 — "never raw interpreter/model text") is carried on a SEPARATE,
  // additive top-level field, preferenceAcknowledgment: {preferenceClass, polarity, target,
  // wasReactivatedFromRejected} — never nested inside rationale itself, which remains the existing,
  // human-readable, closed-shape field every kind already has.
  function formAcknowledgedPreferenceOutcome(params) {
    params = params || {};
    return freezeShallow({
      status: 'FORMED',
      decision: freezeShallow({
        kind: 'ACKNOWLEDGED_PREFERENCE',
        rationale: freezeShallow({
          rationale: 'The user explicitly stated a non-actionable, non-professional personal preference, which was durably captured.',
          evidenceBasis: 'ExplicitPreferenceStatementInterpreter (CPI-001 §9) + the deterministic Preference Intake Gate (§10) — a literally-anchored, consented, non-Safety-vetoed explicit statement, already persisted to Typed Memory before this outcome was formed.',
          expectedValue: 'An honest, brief acknowledgment that FITME understood and remembered what the user said.',
          uncertainty: 'None — deterministic given the already-confirmed successful Typed Memory write.'
        }),
        preferenceAcknowledgment: freezeShallow({
          preferenceClass: params.preferenceClass,
          polarity: params.polarity,
          target: params.target,
          wasReactivatedFromRejected: !!params.wasReactivatedFromRejected
        }),
        decisionPassTrace: freezeShallow({
          opportunitiesConsidered: freezeShallow([]),
          candidatePoolSize: 0,
          disqualifiedCandidates: freezeShallow([])
        }),
        candidateProvenance: freezeShallow([]),
        immutable: true
      })
    });
  }

  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13.B.2) — a PURE, additive, structural copy-plus-
  // one-field operation. Used ONLY by Unified Finalization when Pass 1's own primary
  // terminalDecision.kind !== 'SILENCE' (real professional/Safety content already exists this
  // turn). Every existing field of the input (kind, rationale, confidence, hierarchyTier,
  // boundaryType, safetyDisposition, modification, decisionPassTrace, candidateProvenance,
  // immutable, options) is copied through byte-identical — never re-derived, never re-evaluated,
  // never weakened. This function calls no Safety/Eligibility/Evidence/Prioritization/Winner-
  // Selection component and is not a second Decision-Formation act for the primary content — it
  // only adds ONE new, optional, closed field: secondaryAcknowledgment. Never applied to a
  // SILENCE-kind decision (Unified Finalization routes that case to
  // formAcknowledgedPreferenceOutcome() above instead).
  function attachSecondaryAcknowledgment(terminalDecision, ack) {
    if (!isPlainObject(terminalDecision)) return terminalDecision;
    ack = ack || {};
    var resolved = {};
    for (var k in terminalDecision) {
      if (Object.prototype.hasOwnProperty.call(terminalDecision, k)) resolved[k] = terminalDecision[k];
    }
    resolved.secondaryAcknowledgment = freezeShallow({
      preferenceClass: ack.preferenceClass,
      polarity: ack.polarity,
      target: ack.target,
      wasReactivatedFromRejected: !!ack.wasReactivatedFromRejected
    });
    return freezeShallow(resolved);
  }

  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — a fifth, narrow, non-Safety-reviewed Terminal
  // Decision construction path, structurally identical in status/shape discipline to
  // formAcknowledgedPreferenceOutcome() above: no Candidate ever existed, so safetyPort.
  // finalReview() is never invoked, and no safetyDisposition/boundaryType/confidence/
  // hierarchyTier/modification is ever attached. Used ONLY when no other primary decision exists
  // this turn (mirrors formAcknowledgedPreferenceOutcome()'s own standalone-case usage exactly).
  //
  // disclosureAcknowledgment carries only closed fields (Product Decision 16 — never raw
  // interpreter/model text): category is USER_DISCLOSURE's own closed vocabulary;
  // capturedToMemory reflects the ACTUAL post-write outcome (this function is only ever called
  // with capturedToMemory:true after a real, confirmed Typed Memory write, or capturedToMemory:
  // false when no capture was attempted at all — never a pre-write intent); safetyRelevant is
  // true only when the captured/attempted content is Safety-relevant (a new restriction or an
  // explicit correction), false for an ordinary state/desire/capacity disclosure.
  function formAcknowledgedDisclosureOutcome(params) {
    params = params || {};
    return freezeShallow({
      status: 'FORMED',
      decision: freezeShallow({
        kind: 'ACKNOWLEDGED_DISCLOSURE',
        rationale: freezeShallow({
          rationale: 'The user shared meaningful information about themselves in conversation, without asking a question.',
          evidenceBasis: 'UserDisclosureRecognizer (Friends Alpha Item 6) — a bounded, closed-vocabulary recognition of a materially coaching-relevant disclosure, independent of any request.',
          expectedValue: 'An honest, brief acknowledgment that FITME understood what the user said, without inventing professional advice.',
          uncertainty: 'None — deterministic given the already-confirmed recognition (and, where applicable, the already-confirmed Typed Memory write).'
        }),
        disclosureAcknowledgment: freezeShallow({
          category: params.category,
          capturedToMemory: !!params.capturedToMemory,
          safetyRelevant: !!params.safetyRelevant
        }),
        decisionPassTrace: freezeShallow({
          opportunitiesConsidered: freezeShallow([]),
          candidatePoolSize: 0,
          disqualifiedCandidates: freezeShallow([])
        }),
        candidateProvenance: freezeShallow([]),
        immutable: true
      })
    });
  }

  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — a PURE, additive, structural copy-plus-one-field
  // operation, structurally identical to attachSecondaryAcknowledgment() above (CPI-001's own
  // precedent), composable with it: a turn may carry both a secondaryAcknowledgment (preference)
  // and a secondaryDisclosureAcknowledgment (disclosure) on the same TerminalDecision, each
  // independently additive. Never applied to a SILENCE-kind decision (the caller routes that case
  // to formAcknowledgedDisclosureOutcome() above instead, mirroring CPI-001's own discipline).
  function attachSecondaryDisclosureAcknowledgment(terminalDecision, ack) {
    if (!isPlainObject(terminalDecision)) return terminalDecision;
    ack = ack || {};
    var resolved = {};
    for (var k in terminalDecision) {
      if (Object.prototype.hasOwnProperty.call(terminalDecision, k)) resolved[k] = terminalDecision[k];
    }
    resolved.secondaryDisclosureAcknowledgment = freezeShallow({
      category: ack.category,
      capturedToMemory: !!ack.capturedToMemory,
      safetyRelevant: !!ack.safetyRelevant
    });
    return freezeShallow(resolved);
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

    // Stage-9 Winning-Candidate Safety Input Canonical Decision
    // (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md,
    // narrowly superseding AD-MAI-01's decisionFormation.js-untouched constraint) — for a
    // SINGLE_WINNER Terminal Decision only, the actual winning Candidate (already held in scope as
    // `primary`) is supplied to the Safety Layer as finalReview()'s third argument, strictly as
    // Safety-evaluation input. This module does not interpret actionIdentity, does not inspect
    // Safety restrictions, does not recreate any Canonical Safety Rule, and does not derive or
    // alter any Safety disposition/reasonCode itself — it only forwards what Winner Selection
    // already produced and consumes, unchanged, whatever the Safety Layer returns below. TIED_SET
    // remains explicitly out of scope for that Canonical Decision: no tied member is forwarded as a
    // stand-in winner, exactly as before.
    var winningCandidateForSafetyReview = isTied ? undefined : primary;

    var reviewResult;
    try {
      reviewResult = await safetyPort.finalReview(preReviewDecision, pipelineContext, winningCandidateForSafetyReview);
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
    formUnsupportedCapabilityOutcome: formUnsupportedCapabilityOutcome,
    formAcknowledgedPreferenceOutcome: formAcknowledgedPreferenceOutcome,
    attachSecondaryAcknowledgment: attachSecondaryAcknowledgment,
    formAcknowledgedDisclosureOutcome: formAcknowledgedDisclosureOutcome,
    attachSecondaryDisclosureAcknowledgment: attachSecondaryDisclosureAcknowledgment,
    form: form
  };

  if (typeof window !== 'undefined') { window.DecisionFormation = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
