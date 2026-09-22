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

  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §12) — fifth canonical, Product/Architecture-
  // authorized kind for a recognized-but-unsupported direct user request. Never Safety-reviewed
  // (no Candidate ever existed), so it carries no safetyDisposition/boundaryType/confidence/
  // hierarchyTier/modification — see the dedicated exclusion below.
  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13.B.1) — a sixth canonical, Product/Architecture-
  // authorized kind for a durably-captured, non-actionable explicit preference. Never Safety-
  // reviewed (no Candidate ever existed), exactly like UNSUPPORTED — see the dedicated exclusion
  // below (mirrors UNSUPPORTED's own established treatment byte-for-byte).
  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — a seventh canonical, Product/Architecture-
  // authorized kind for a bounded acknowledgment of a recognized, non-request user disclosure.
  // Never Safety-reviewed (no Candidate ever existed), exactly like UNSUPPORTED/
  // ACKNOWLEDGED_PREFERENCE — see the dedicated exclusion below.
  // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15, Revision 2,
  // Product+Architecture APPROVED) — an eighth canonical kind for a bounded acknowledgment of a
  // durably-captured, explicit, governed risk-characteristic fact. Never Safety-reviewed (no
  // Candidate ever existed), exactly like ACKNOWLEDGED_DISCLOSURE — see the dedicated exclusion
  // below.
  var KINDS = ['RECOMMENDATION', 'INITIATIVE', 'SILENCE', 'BOUNDARY', 'UNSUPPORTED', 'ACKNOWLEDGED_PREFERENCE', 'ACKNOWLEDGED_DISCLOSURE', 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT'];
  var BOUNDARY_TYPES = ['REFUSAL', 'ESCALATION'];
  var SAFETY_DISPOSITIONS = ['UNMODIFIED', 'MODIFIED', 'DEFERRED', 'BLOCKED', 'ESCALATED'];
  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §8) — this module's own, independently-authored copy
  // of the closed preference vocabulary ExplicitPreferenceStatementInterpreter/
  // preferenceIntakeGate.js already declare (reused BY PATTERN, never by import — matching every
  // other closed-vocabulary-by-pattern convention already established in this codebase, e.g.
  // turnUnderstandingInterpreter.js's own DUC_VALID_DOMAIN_TOPIC_PAIRS).
  var PREFERENCE_CLASSES = ['ACTIVITY_SENTIMENT', 'TRAINING_TIME_PREFERENCE', 'TRAINING_FORMAT_PREFERENCE'];
  var PREFERENCE_POLARITIES = ['POSITIVE', 'NEGATIVE'];
  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — this module's own, independently-authored copy of
  // the closed disclosure-category vocabulary userDisclosureRecognizer.js already declares
  // (reused BY PATTERN, never by import — matching PREFERENCE_CLASSES's own established
  // convention immediately above).
  var DISCLOSURE_CATEGORIES = ['STATE', 'DESIRE', 'CAPACITY_OR_CONSTRAINT', 'COACHING_RELEVANT_EXPERIENCE'];
  // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §08.1) — this
  // module's own, independently-authored copy of the closed RiskDomain vocabulary
  // riskCharacteristicValidator.js already declares (reused BY PATTERN, never by import — matching
  // PREFERENCE_CLASSES/DISCLOSURE_CATEGORIES's own established convention immediately above).
  var RISK_DOMAINS = [
    'PHYSICAL_EXERTION_OR_MOVEMENT', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'EATING_PATTERN_OR_BODY_IMAGE',
    'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', 'STANDING_OR_IRREVERSIBLE_COMMITMENT',
    'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED', 'EXTREME_OR_UNBOUNDED_INTENSITY'
  ];

  function isValidRationale(rationale) {
    if (!isPlainObject(rationale)) return false;
    return ['rationale', 'evidenceBasis', 'expectedValue', 'uncertainty'].every(function (key) {
      return Object.prototype.hasOwnProperty.call(rationale, key);
    });
  }

  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13) — shared closed-shape check reused for both
  // `preferenceAcknowledgment` (kind:'ACKNOWLEDGED_PREFERENCE' only, required) and
  // `secondaryAcknowledgment` (any kind, optional) — identical field/vocabulary requirements,
  // just different presence rules at the two call sites below.
  function isValidAcknowledgmentShape(ack) {
    if (!isPlainObject(ack)) return false;
    if (PREFERENCE_CLASSES.indexOf(ack.preferenceClass) === -1) return false;
    if (PREFERENCE_POLARITIES.indexOf(ack.polarity) === -1) return false;
    if (typeof ack.target !== 'string' || ack.target.length === 0) return false;
    if (typeof ack.wasReactivatedFromRejected !== 'boolean') return false;
    return true;
  }

  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — the disclosure-acknowledgment analogue of
  // isValidAcknowledgmentShape() above, reused for both `disclosureAcknowledgment`
  // (kind:'ACKNOWLEDGED_DISCLOSURE' only, required) and `secondaryDisclosureAcknowledgment` (any
  // kind, optional) — identical field/vocabulary requirements, just different presence rules at
  // the two call sites below.
  function isValidDisclosureAcknowledgmentShape(ack) {
    if (!isPlainObject(ack)) return false;
    if (DISCLOSURE_CATEGORIES.indexOf(ack.category) === -1) return false;
    if (typeof ack.capturedToMemory !== 'boolean') return false;
    if (typeof ack.safetyRelevant !== 'boolean') return false;
    return true;
  }

  // WP0 Phase D.5 — the risk-characteristic-fact-acknowledgment analogue of
  // isValidDisclosureAcknowledgmentShape() above, required only for
  // kind:'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT'. No `safetyRelevant` field (unlike disclosure,
  // every risk-characteristic fact is inherently Safety-relevant by construction — the flag would
  // be redundant) and no literal statement text (Phase D.3's own binding authority correction:
  // never let the generative rendering layer see the user's raw literal words, to prevent
  // paraphrasing/amplification into anything diagnosis-shaped).
  function isValidRiskCharacteristicFactAcknowledgmentShape(ack) {
    if (!isPlainObject(ack)) return false;
    if (RISK_DOMAINS.indexOf(ack.riskDomain) === -1) return false;
    if (typeof ack.capturedToMemory !== 'boolean') return false;
    return true;
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
    } else if (candidate.kind !== 'SILENCE' && candidate.kind !== 'UNSUPPORTED' && candidate.kind !== 'ACKNOWLEDGED_PREFERENCE' && candidate.kind !== 'ACKNOWLEDGED_DISCLOSURE' && candidate.kind !== 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT') {
      // Absent only for a Decision-Pass-level Silence formed from zero surviving Candidates
      // (§23.4), a DUC-001 UNSUPPORTED outcome (docs/specs/DUC_001_SPEC_v1.0.md §12 — no
      // Candidate ever existed, so Safety was never invoked), a CPI-001 ACKNOWLEDGED_PREFERENCE
      // outcome (docs/specs/CPI_001_SPEC_v1.0.md §13.B.1 — same reason), a Friends Alpha Item 6
      // ACKNOWLEDGED_DISCLOSURE outcome (same reason — no Candidate ever existed), or a WP0
      // ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT outcome (same reason) — required for every other
      // kind, including a Safety-DEFERRED Silence.
      return false;
    }

    // §25.4 — modification present iff safetyDisposition.disposition === 'MODIFIED'.
    var hasModification = Object.prototype.hasOwnProperty.call(candidate, 'modification');
    var isModifiedDisposition = hasSafetyDisposition && candidate.safetyDisposition.disposition === 'MODIFIED';
    if (hasModification !== isModifiedDisposition) return false;
    if (hasModification && !isPlainObject(candidate.modification)) return false;

    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13.B.1) — preferenceAcknowledgment present iff
    // kind === 'ACKNOWLEDGED_PREFERENCE' (mirrors boundaryType's own "present iff kind==='BOUNDARY'"
    // discipline immediately above). Never present on any other kind.
    var hasPreferenceAcknowledgment = Object.prototype.hasOwnProperty.call(candidate, 'preferenceAcknowledgment');
    if (candidate.kind === 'ACKNOWLEDGED_PREFERENCE') {
      if (!hasPreferenceAcknowledgment || !isValidAcknowledgmentShape(candidate.preferenceAcknowledgment)) return false;
    } else if (hasPreferenceAcknowledgment) {
      return false;
    }

    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §13.B.2) — secondaryAcknowledgment is a purely
    // ADDITIVE, OPTIONAL field on ANY kind (never required, never narrowing any existing
    // invariant above) — absent on every pre-CPI-001 TerminalDecision, exactly as before this
    // addition; when present, must conform to the same closed shape.
    if (Object.prototype.hasOwnProperty.call(candidate, 'secondaryAcknowledgment')) {
      if (!isValidAcknowledgmentShape(candidate.secondaryAcknowledgment)) return false;
    }

    // Friends Alpha Item 6 (USER_DISCLOSURE V1) — disclosureAcknowledgment present iff
    // kind === 'ACKNOWLEDGED_DISCLOSURE' (mirrors preferenceAcknowledgment's own "present iff
    // kind===..." discipline immediately above). Never present on any other kind.
    var hasDisclosureAcknowledgment = Object.prototype.hasOwnProperty.call(candidate, 'disclosureAcknowledgment');
    if (candidate.kind === 'ACKNOWLEDGED_DISCLOSURE') {
      if (!hasDisclosureAcknowledgment || !isValidDisclosureAcknowledgmentShape(candidate.disclosureAcknowledgment)) return false;
    } else if (hasDisclosureAcknowledgment) {
      return false;
    }

    // Friends Alpha Item 6 (USER_DISCLOSURE V1) — secondaryDisclosureAcknowledgment is a purely
    // ADDITIVE, OPTIONAL field on ANY kind, composable with secondaryAcknowledgment (a turn may
    // carry both a preference and a disclosure acknowledgment) — absent on every pre-Item-6
    // TerminalDecision; when present, must conform to the same closed shape.
    if (Object.prototype.hasOwnProperty.call(candidate, 'secondaryDisclosureAcknowledgment')) {
      if (!isValidDisclosureAcknowledgmentShape(candidate.secondaryDisclosureAcknowledgment)) return false;
    }

    // WP0 Phase D.5 — riskCharacteristicFactAcknowledgment present iff
    // kind === 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT' (mirrors disclosureAcknowledgment's own
    // "present iff kind===..." discipline immediately above). Never present on any other kind —
    // this phase deliberately does not add a composable "secondary" variant (see
    // decisionFormation.js's own formAcknowledgedRiskCharacteristicFactOutcome() header for the
    // disclosed scope decision).
    var hasRiskCharacteristicFactAcknowledgment = Object.prototype.hasOwnProperty.call(candidate, 'riskCharacteristicFactAcknowledgment');
    if (candidate.kind === 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT') {
      if (!hasRiskCharacteristicFactAcknowledgment || !isValidRiskCharacteristicFactAcknowledgmentShape(candidate.riskCharacteristicFactAcknowledgment)) return false;
    } else if (hasRiskCharacteristicFactAcknowledgment) {
      return false;
    }

    return true;
  }

  // EXP-29/EXP-50 — both Silence origins (zero-Candidates and Safety-DEFERRED, §25.12) are
  // represented identically as kind: 'SILENCE'; this single check covers both uniformly.
  function isSilenceKind(terminalDecision) {
    return !!terminalDecision && terminalDecision.kind === 'SILENCE';
  }

  var API = {
    isValidTerminalDecision: isValidTerminalDecision,
    isSilenceKind: isSilenceKind,
    isValidAcknowledgmentShape: isValidAcknowledgmentShape,
    isValidDisclosureAcknowledgmentShape: isValidDisclosureAcknowledgmentShape,
    isValidRiskCharacteristicFactAcknowledgmentShape: isValidRiskCharacteristicFactAcknowledgmentShape,
    KINDS: KINDS
  };

  if (typeof window !== 'undefined') { window.ExpressionInputGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
