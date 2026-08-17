// ══════════════════════════════════════════════════════════════════
// FitMe — Expression Input Gate (Expression, D2 Stage 10 — Expression,
// EXPRESSION_SPEC_v1.0.md §10/§13/§19, EXP-19/EXP-29)
// WP3 of EXPRESSION_IMPLEMENTATION_PLAN.md.
//
// Scope, restated from the Specification, not redefined here: this module
// performs the two checks Expression applies to its input BEFORE any
// rendering is attempted — defensive TerminalDecision validation (EXP-19)
// and the Silence-kind no-output determination (EXP-29/EXP-50). It
// renders nothing, decides no REFUSAL/ESCALATION/disclosure content, and
// calls no generative/LLM layer — all of that remains WP4-WP8's own
// scope, unbuilt here.
//
// EXP-19 (defensive input validation). Notwithstanding TASK_006_SPEC_v1.0.md
// §25.5's upstream validation guarantee, Expression SHALL defensively
// validate its own input against the §25 contract before rendering it —
// matching the Decision Engine's own established pattern of validating
// Candidates from upstream engines despite their contracts already being
// fixed. isValidTerminalDecision() checks every invariant that is
// checkable from a single TerminalDecision object in isolation
// (TASK_006_SPEC_v1.0.md §25.1 Required Fields, §25.4 Invariants). Two
// §25.4 invariants are NOT checkable here and are not attempted:
// "exactly one TerminalDecision per Decision Pass" (requires visibility
// across the whole pass, not a single object) and "confidence/
// hierarchyTier preserved from the winning Candidate, never independently
// recomputed" (requires the original Candidate, not present on the
// TerminalDecision itself).
//
// EXP-29/EXP-50 (Silence no-output). Expression produces no Delivery
// Intent for a SILENCE-kind TerminalDecision, whether it originated from
// a Decision-Pass-level zero-Candidates outcome or a Safety DEFERRED
// disposition (TASK_006_SPEC_v1.0.md §25.12) — the treatment is identical
// in both cases, since both are represented uniformly as kind: 'SILENCE'
// on the TerminalDecision itself; isSilenceKind() below covers both
// origins with the same single check.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  var KINDS = ['RECOMMENDATION', 'INITIATIVE', 'SILENCE', 'BOUNDARY'];
  var BOUNDARY_TYPES = ['REFUSAL', 'ESCALATION'];
  var SAFETY_DISPOSITIONS = ['UNMODIFIED', 'MODIFIED', 'DEFERRED', 'BLOCKED', 'ESCALATED'];

  function isValidRationale(rationale) {
    if (!isPlainObject(rationale)) return false;
    return ['rationale', 'evidenceBasis', 'expectedValue', 'uncertainty'].every(function (key) {
      return Object.prototype.hasOwnProperty.call(rationale, key);
    });
  }

  // TASK_006_SPEC_v1.0.md §25.1 (Required Fields) and §25.4 (Invariants) — every check that is
  // decidable from a single TerminalDecision object in isolation. A failure here means Decision
  // Formation did not, in fact, hand Expression a completely and consistently formed decision —
  // per §25.5, that is a failure condition, never silently trusted or rendered anyway.
  function isValidTerminalDecision(candidate) {
    if (!isPlainObject(candidate)) return false;
    if (candidate.immutable !== true) return false;
    if (KINDS.indexOf(candidate.kind) === -1) return false;
    if (!isValidRationale(candidate.rationale)) return false;
    if (!isPlainObject(candidate.decisionPassTrace)) return false;
    if (!Array.isArray(candidate.candidateProvenance)) return false;

    var hasBoundaryType = Object.prototype.hasOwnProperty.call(candidate, 'boundaryType');
    if (candidate.kind === 'BOUNDARY') {
      if (!hasBoundaryType || BOUNDARY_TYPES.indexOf(candidate.boundaryType) === -1) return false;
    } else if (hasBoundaryType) {
      return false; // boundaryType present iff kind === 'BOUNDARY' (§25.4)
    }

    // confidence/hierarchyTier required for RECOMMENDATION/INITIATIVE only; absent otherwise.
    var hasConfidence = Object.prototype.hasOwnProperty.call(candidate, 'confidence');
    var hasHierarchyTier = Object.prototype.hasOwnProperty.call(candidate, 'hierarchyTier');
    if (candidate.kind === 'RECOMMENDATION' || candidate.kind === 'INITIATIVE') {
      if (!hasConfidence || typeof candidate.confidence !== 'number') return false;
      if (!hasHierarchyTier || typeof candidate.hierarchyTier !== 'number') return false;
    } else if (hasConfidence || hasHierarchyTier) {
      return false;
    }

    var hasSafetyDisposition = Object.prototype.hasOwnProperty.call(candidate, 'safetyDisposition');
    if (hasSafetyDisposition) {
      var sd = candidate.safetyDisposition;
      if (!isPlainObject(sd) || SAFETY_DISPOSITIONS.indexOf(sd.disposition) === -1) return false;
      if (!isNonEmptyString(sd.originalKind)) return false;

      // §25.4 — disposition/kind/boundaryType co-occurrence invariants.
      if (sd.disposition === 'DEFERRED' && candidate.kind !== 'SILENCE') return false;
      if (sd.disposition === 'BLOCKED' && !(candidate.kind === 'BOUNDARY' && candidate.boundaryType === 'REFUSAL')) return false;
      if (sd.disposition === 'ESCALATED' && !(candidate.kind === 'BOUNDARY' && candidate.boundaryType === 'ESCALATION')) return false;
    } else if (candidate.kind !== 'SILENCE') {
      // Absent only for a Decision-Pass-level Silence formed from zero surviving Candidates
      // (§23.4) — required for every other kind, including a Safety-DEFERRED Silence.
      return false;
    }

    // §25.4 — modification present iff safetyDisposition.disposition === 'MODIFIED'.
    var hasModification = Object.prototype.hasOwnProperty.call(candidate, 'modification');
    var isModifiedDisposition = hasSafetyDisposition && candidate.safetyDisposition.disposition === 'MODIFIED';
    if (hasModification !== isModifiedDisposition) return false;
    if (hasModification && !isPlainObject(candidate.modification)) return false;

    return true;
  }

  // EXP-29/EXP-50 — both Silence origins (zero-Candidates and Safety-DEFERRED, §25.12) are
  // represented identically as kind: 'SILENCE'; this single check covers both uniformly.
  function isSilenceKind(terminalDecision) {
    return !!terminalDecision && terminalDecision.kind === 'SILENCE';
  }

  var API = {
    isValidTerminalDecision: isValidTerminalDecision,
    isSilenceKind: isSilenceKind
  };

  if (typeof window !== 'undefined') { window.ExpressionInputGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
