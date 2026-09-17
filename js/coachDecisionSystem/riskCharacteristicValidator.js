// ══════════════════════════════════════════════════════════════════
// FitMe — Risk Characteristic Validator (WP0 Phase D.1, docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_
// SUBSPEC_v1.0.md §08/§10, Revision 2, Product+Architecture APPROVED / READY FOR IMPLEMENTATION)
// Exclusive responsibility: own the closed Risk Characteristic taxonomy (§08) and the deterministic
// shape/vocabulary validation of a single RiskCharacteristicTag (§10.1) — pure, synchronous,
// no AI call, no Firestore access, no pipeline wiring. This is Phase D.1 only: the taxonomy and
// validator exist and are fully unit-testable in isolation; nothing in this file is invoked from
// any live orchestrator/routing path, and no extraction/intake mechanism (§09/§10.2, Phase D.2/D.3)
// is implemented here.
//
// Ownership boundary (Sub-Spec §07): this taxonomy is closed — extension requires a new canonical
// decision, never an Engineering addition. Every dimension below describes a property of a risk
// RELATIONSHIP, never a world entity (no food/sport/activity/place/condition is named anywhere in
// this file), per the Sub-Spec's own governing design principle (§08).
//
// isValidRiskCharacteristicTagShape() replaces standardProposalContract.js's own former
// placeholder {dimension,value} shape check (Phase C, "the closed dimension set itself is Phase D,
// not yet defined") with real closed-vocabulary membership, per §10.1 exactly.
//
// isLiteralAnchorValid() independently re-verifies a tag's anchorText as a literal substring of the
// text it claims to be grounded in — the exact, already-proven mechanism preferenceIntakeGate.js /
// safetyContextInterpreter.js / explicitPreferenceStatementInterpreter.js already use (read in full
// before this file was written), reimplemented independently here rather than imported, matching
// this codebase's own established per-module discipline of not sharing that helper across files.
// This function is defined now (Phase D.1, no AI/wiring required to exercise it in isolation) but
// has no caller yet in production — its caller is riskCharacteristicIntakeGate.js (Phase D.3), where
// the actual source turn text becomes available. isValidRiskCharacteristicTagShape() alone (no
// source text) is what standardProposalContract.js consumes, in this Phase D.1 change.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // §08.1 — RiskDomain (closed, 7 values). Each maps, by construction, onto one or more of the
  // 8 currently-schema-only RISK_TYPES (safetyLayer.js) — see the Sub-Spec §12 mapping table
  // (Phase D.4, not this file's concern). This file owns membership only.
  var RISK_DOMAINS = Object.freeze([
    'PHYSICAL_EXERTION_OR_MOVEMENT',
    'INGESTION_OR_SUBSTANCE_EXPOSURE',
    'EATING_PATTERN_OR_BODY_IMAGE',
    'PSYCHOLOGICAL_OR_EMOTIONAL_STATE',
    'STANDING_OR_IRREVERSIBLE_COMMITMENT',
    'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED',
    'EXTREME_OR_UNBOUNDED_INTENSITY'
  ]);

  // §08.2 — RiskRelationKind (closed, 4 values): the nature of the match, independent of domain.
  var RISK_RELATION_KINDS = Object.freeze([
    'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',
    'ACUTE_STATE_INDICATED_THIS_TURN',
    'UNRESOLVED_RELEVANCE',
    'NO_KNOWN_CONFLICT'
  ]);

  // §08.3 — ConstraintSeverity (closed, 4 values): how consequential a match is, independent of
  // domain — the axis that drives disposition selection (Sub-Spec §14, not this file's concern).
  var CONSTRAINT_SEVERITY = Object.freeze([
    'ADVISORY',
    'PROHIBITIVE',
    'LIFE_CRITICAL',
    'REQUIRES_PROFESSIONAL_JUDGMENT'
  ]);

  // §08.4 — EvidenceSource (closed, 3 values): where a tag's evidence came from.
  var EVIDENCE_SOURCES = Object.freeze([
    'DURABLE_GOVERNED_USER_FACT',
    'CURRENT_TURN_USER_STATEMENT',
    'AI_CANDIDATE_CHARACTERIZATION'
  ]);

  // Matches this codebase's own established bound for every other literal-anchor text field
  // (activityOppositionInterpreter.js, activityPreferenceInterpreter.js,
  // explicitPreferenceStatementInterpreter.js, safetyContextInterpreter.js,
  // preferenceIntakeGate.js, userSafetyProvenanceInterpreter.js each use 80) and the Sub-Spec's
  // own explicit ≤80-char bound for durable risk-characteristic literalStatementText (§15/§20).
  var ANCHOR_TEXT_MAX_CHARS = 80;

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  // §10.1 — real closed-vocabulary membership check for a single RiskCharacteristicTag (§08's
  // shape). No source text required/consulted here — this is vocabulary/shape validity only,
  // never literal-anchor re-verification (see isLiteralAnchorValid() below for that, separate by
  // design since this function's caller, standardProposalContract.js, has no source text to check
  // against).
  function isValidRiskCharacteristicTagShape(tag) {
    if (!isPlainObject(tag)) return false;
    if (RISK_DOMAINS.indexOf(tag.domain) === -1) return false;
    if (RISK_RELATION_KINDS.indexOf(tag.relation) === -1) return false;
    if (EVIDENCE_SOURCES.indexOf(tag.evidenceSource) === -1) return false;

    if (tag.relation === 'NO_KNOWN_CONFLICT') {
      // §08's shape comment: anchorText is null ONLY when relation==='NO_KNOWN_CONFLICT' — so in
      // this branch it MUST be null (not merely optional), and severity carries no meaning here
      // (§12: "no dims tuple produced — the honest, common case"), so it too must be null.
      if (tag.anchorText !== null) return false;
      if (tag.severity !== null && tag.severity !== undefined) return false;
      return true;
    }

    // relation !== 'NO_KNOWN_CONFLICT' — severity is required (§10.1) and anchorText is required
    // non-null, bounded, non-empty (re-verified independently as a literal substring only by
    // isLiteralAnchorValid(), not here).
    if (CONSTRAINT_SEVERITY.indexOf(tag.severity) === -1) return false;
    if (!isNonEmptyString(tag.anchorText) || tag.anchorText.length > ANCHOR_TEXT_MAX_CHARS) return false;
    return true;
  }

  function normalizeLiteral(text) { return (typeof text === 'string') ? text.trim().toLowerCase() : ''; }

  // Independent literal-anchor re-verification — mirrors preferenceIntakeGate.js's own
  // isLiteralSubstringOf() exactly (read in full before this file was written): never trusts the
  // producing interpreter's own claim, recomputes the check itself, byte-for-byte. A tag whose
  // relation is 'NO_KNOWN_CONFLICT' has nothing to anchor (anchorText is required null by
  // isValidRiskCharacteristicTagShape() above) and trivially passes.
  function isLiteralAnchorValid(tag, sourceText) {
    if (!isPlainObject(tag)) return false;
    if (tag.relation === 'NO_KNOWN_CONFLICT') return tag.anchorText === null;
    var candidate = normalizeLiteral(tag.anchorText);
    var source = normalizeLiteral(sourceText);
    return candidate.length > 0 && candidate.length <= ANCHOR_TEXT_MAX_CHARS && source.indexOf(candidate) >= 0;
  }

  // Full §10.1 validation contract in one call: shape/vocabulary membership AND independent
  // literal-anchor re-verification against the given source text. Defined now (pure, synchronous,
  // no AI) for Phase D.2/D.3 to consume; not yet called from any pipeline path in Phase D.1.
  function isValidRiskCharacteristicTag(tag, sourceText) {
    return isValidRiskCharacteristicTagShape(tag) && isLiteralAnchorValid(tag, sourceText);
  }

  var API = {
    RISK_DOMAINS: RISK_DOMAINS,
    RISK_RELATION_KINDS: RISK_RELATION_KINDS,
    CONSTRAINT_SEVERITY: CONSTRAINT_SEVERITY,
    EVIDENCE_SOURCES: EVIDENCE_SOURCES,
    ANCHOR_TEXT_MAX_CHARS: ANCHOR_TEXT_MAX_CHARS,
    isValidRiskCharacteristicTagShape: isValidRiskCharacteristicTagShape,
    isLiteralAnchorValid: isLiteralAnchorValid,
    isValidRiskCharacteristicTag: isValidRiskCharacteristicTag
  };

  if (typeof window !== 'undefined') { window.RiskCharacteristicValidator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
