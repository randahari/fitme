// ══════════════════════════════════════════════════════════════════
// FitMe — Risk Characteristic Intake Gate (WP0 Phase D.3, docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_
// SUBSPEC_v1.0.md §10.2/§15, Revision 2, Product+Architecture APPROVED / READY FOR IMPLEMENTATION)
// Exclusive responsibility: the deterministic "Validation → Business Rules → Deterministic
// Decision" link for durable, governed risk-characteristic fact capture, structurally mirroring
// preferenceIntakeGate.js's own established shape (CPI-001) — reusing the PATTERN, never the
// file. Produces exactly one thing per call: a frozen, closed Intake Authorization — never a
// TerminalDecision, never a Firestore write, never an Expression invocation. This module never
// writes Typed Memory itself.
//
// ══════════════════════════════════════════════════════════════════
// BINDING AUTHORITY CORRECTION (Product/Architecture review, this round) — read before editing.
//
// An earlier version of this file treated a SECOND, independent call to
// RiskCharacteristicInterpreter.classifyTurnForDurableConstraint() on the same turn text as
// sufficient "deterministic verification" that a candidate was an explicit user-stated fact, and
// persisted the AI-proposed `severity` value as part of the durable record. Product/Architecture
// has ruled this insufficient and corrected it:
//
//   "Agreement between two AI calls does not transform an inference into an explicit
//    user-stated fact." A durable risk_characteristic_fact may be authorized ONLY when the
//    safety-relevant fact itself is explicitly stated by the user and can be deterministically
//    grounded back to the literal user turn. AI may identify the candidate, classify its
//    RiskDomain, and propose severity — but AI may NOT create the factual proposition that
//    becomes durable memory. The stored durable record must preserve the actual user-grounded
//    fact, not an inferred diagnosis/condition or an AI-expanded proposition.
//
// Concrete example of the failure mode this closes: "Peanuts don't sit well with me" contains
// the literal substring "peanuts", and an AI classifier proposing domain=
// INGESTION_OR_SUBSTANCE_EXPOSURE + severity=LIFE_CRITICAL for it would pass the OLD design's
// literal-anchor check (the anchor text itself can be a perfectly genuine, literal quote) while
// still fabricating a diagnosis ("this is a life-critical allergy") the user never stated. A
// second, independent call to the SAME classifier proves nothing here — a systematic
// over-inference bias is reproduced identically by both calls; corroboration only catches
// random/inconsistent failures (timeouts, one-off hallucinations), never a classifier's own
// consistent misjudgment.
//
// The correction, applied below:
//   1. `severity` remains a legitimate, AI-proposed, non-authoritative INPUT — still required
//      as part of the candidate's SHAPE (it is the structural discriminator that proves a
//      candidate came from classifyTurnForDurableConstraint(), §09.1(b), never from
//      classifyCandidateContent(), §09.1(a), which never carries a severity field at all —
//      binding requirements 7/8 of this round). But `severity` is NEVER copied into the
//      authorized candidateRecord. The durable "factual proposition" this gate authorizes is,
//      and can only ever be, the literal, verbatim `literalStatementText` (independently
//      re-verified as an actual substring of the user's own turn, never trusted from the
//      candidate's own claim) plus its coarse `domain` tag (a topic category, not a diagnosis —
//      "this statement is about ingestion/substances" carries no severity/danger claim by
//      itself). Any severity/danger assessment a future consumer needs must be freshly, and
//      contextually, determined at that later point (Phase D.4's own Rule, evaluated against the
//      CURRENT proposal being checked) — never baked into durable memory once and reused as if
//      it were an established diagnosis.
//   2. The flawed "independent, second call to the same classifier" mechanism is REMOVED
//      entirely — it is deleted from this file, not merely disabled, because keeping it would
//      continue to imply a rigor it does not provide.
//   3. §10.2 point 3 of the Sub-Spec calls for "an independent, second Safety-relevant check...
//      mirroring preferenceIntakeGate.js.evaluateSafetyVeto() exactly." Re-reading that
//      precedent literally: preferenceIntakeGate.js's own second check calls a DIFFERENT,
//      already-existing interpreter (SafetyContextInterpreter/USC-001) as an orthogonal VETO —
//      it does not re-ask ExplicitPreferenceStatementInterpreter's own question a second time.
//      No analogous, narrower, already-existing interpreter exists for this module's own
//      7-domain scope (USC-001 cannot be broadened to cover it — Product decision 3, binding),
//      so there is currently no clean, honest way to build that second, orthogonal check without
//      either fabricating a fake one (the error being corrected here) or inventing new,
//      not-yet-approved taxonomy. This is DISCLOSED as a genuinely open design point for
//      Phase D.4/D.5 rather than resolved by an artificial mechanism — the fix above (never
//      persisting AI-proposed severity as durable authority) is what makes the CURRENT, real
//      gate safe in the meantime, independent of whether/how that second check is eventually
//      built.
//
// Invoked only with an ALREADY-produced candidate from
// RiskCharacteristicInterpreter.classifyTurnForDurableConstraint() (§09.1(b)) — never
// re-implements that classification, never re-derives domain/severity/anchorText of its own for a
// NEW fact. That candidate is treated as a non-authoritative PROPOSAL only (binding requirement
// 2): every check below independently re-verifies it before any authority is granted.
//
// classifyCandidateContent()'s own output (§09.1(a), evidenceSource='AI_CANDIDATE_CHARACTERIZATION')
// NEVER reaches this gate at all — only classifyTurnForDurableConstraint()'s output
// (evidenceSource='CURRENT_TURN_USER_STATEMENT') is durable-capture-eligible (§15's own hard,
// structural boundary).
//
// Never touches USC-001 (safetyContextInterpreter.js): not imported, not modified, not read.
// Never touches safetyDisclosureIntakeGate.js or the existing 'safety_disclosure' type — this is a
// structurally independent, additive gate for a NEW, separate durable-fact type
// ('risk_characteristic_fact', §15), reusing safetyDisclosureIntakeGate.js's own proven
// single-match-required correction discipline only BY PATTERN (§15's own binding resolution).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var RiskCharacteristicValidator = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicValidator.js')
    : window.RiskCharacteristicValidator;
  var RiskCharacteristicInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicInterpreter.js')
    : window.RiskCharacteristicInterpreter;

  var ANCHOR_TEXT_MAX_CHARS = 80; // matches riskCharacteristicValidator.js's own bound (§10.1/§15/§20)

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function normalizeLiteral(text) { return (typeof text === 'string') ? text.trim().toLowerCase() : ''; }

  // Independently reimplemented per this codebase's own established per-module discipline (see
  // riskCharacteristicInterpreter.js's own header for the full precedent list) — never trusts the
  // caller's own claim that an anchor is grounded; recomputes the check itself, byte-for-byte.
  function isLiteralSubstringOf(candidate, sourceText, maxChars) {
    var c = normalizeLiteral(candidate);
    var s = normalizeLiteral(sourceText);
    return c.length > 0 && c.length <= maxChars && s.indexOf(c) >= 0;
  }

  function authorization(authorized, reason, candidateRecord) {
    return Object.freeze({ authorized: !!authorized, reason: reason, candidateRecord: candidateRecord || null });
  }

  // §10.1 shape/vocabulary check for a durable-fact CANDIDATE specifically — distinct from
  // RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(), which validates the
  // DIFFERENT, later-stage RiskCharacteristicTag shape used for Stage 6 Candidate/StandardProposal
  // threading (§16, Phase D.6: {domain,relation,severity,evidenceSource,anchorText}). A durable-
  // fact candidate from classifyTurnForDurableConstraint() never carries `relation` or
  // `evidenceSource` (§09.1(b)); this function checks exactly and only the shape that function's
  // own contract produces: {domain, severity, anchorText}. `severity` is required here ONLY as a
  // structural discriminator (see header correction, point 1) — it is validated for vocabulary
  // membership but is never propagated into the authorized candidateRecord below. The
  // closed-vocabulary constants themselves (RISK_DOMAINS/CONSTRAINT_SEVERITY) are reused unchanged
  // from Phase D.1 — one taxonomy, never redefined.
  function isValidDurableFactCandidateShape(candidate) {
    if (!isPlainObject(candidate)) return false;
    if (RiskCharacteristicValidator.RISK_DOMAINS.indexOf(candidate.domain) === -1) return false;
    // Required, non-optional: this is the exact structural tripwire that keeps a
    // classifyCandidateContent()-shaped {domain,anchorText} pair (no severity) from ever being
    // mistaken for a durable-fact candidate (binding requirements 7/8). Its VALUE is validated for
    // vocabulary membership only — it carries no further authority (header correction, point 1).
    if (RiskCharacteristicValidator.CONSTRAINT_SEVERITY.indexOf(candidate.severity) === -1) return false;
    if (!isNonEmptyString(candidate.anchorText) || candidate.anchorText.length > ANCHOR_TEXT_MAX_CHARS) return false;
    return true;
  }

  function isValidTurn(turn) {
    return isPlainObject(turn) && isNonEmptyString(turn.turnId) && isNonEmptyString(turn.text);
  }

  // authorizeNewFact(params) — params: { turn:{turnId,text}, candidate:{domain,severity,
  // anchorText}, memoryConsent:{granted} }. Only ever called by the orchestrator with a candidate
  // already produced by classifyTurnForDurableConstraint() (never by classifyCandidateContent(),
  // §15's hard boundary — see header and Check 1 below).
  async function authorizeNewFact(params) {
    params = params || {};
    var turn = params.turn || {};
    var candidate = params.candidate;
    var consentGranted = !!(params.memoryConsent && params.memoryConsent.granted === true);

    if (!isValidTurn(turn)) return authorization(false, 'INVALID_TURN', null);

    // Check 1 (§10.1) — closed-taxonomy + shape, independently re-verified; never trusts the
    // interpreter's own claim. Structurally excludes AI_CANDIDATE_CHARACTERIZATION-shaped input.
    // `severity`'s presence/vocabulary is checked here (structural discriminator only); its value
    // is deliberately discarded below (header correction, point 1) — it never becomes durable
    // authority.
    if (!isValidDurableFactCandidateShape(candidate)) return authorization(false, 'INVALID_CANDIDATE_SHAPE', null);

    // Check 2 (§10.1) — literal-anchor re-verification against the turn's OWN text, independently
    // recomputed, never trusted from the caller's claim. This is the ONLY thing that becomes
    // durable content: a verbatim excerpt of what the user actually, literally wrote.
    if (!isLiteralSubstringOf(candidate.anchorText, turn.text, ANCHOR_TEXT_MAX_CHARS)) {
      return authorization(false, 'LITERAL_ANCHOR_FAILED', null);
    }

    // Check 3 (§10.2 point 2) — explicit consent required, identical gate to CPI-001/Item-6.
    if (!consentGranted) return authorization(false, 'CONSENT_ABSENT', null);

    // Authorized — candidateRecord is exactly what the persistence boundary needs to construct
    // the Typed Memory write (§15); sourceTurnId is traceability only, never a promotion of the
    // transcript itself to authority. evidenceSource is fixed, never caller-supplied — this gate
    // is the sole place that stamps it, exactly once, per §08.4's own designed meaning (the
    // user's own literal words in this turn). `severity` is DELIBERATELY OMITTED here — see the
    // header correction: the durable factual proposition is the literal text + its coarse domain
    // tag only, never an AI-proposed severity/danger rating.
    var candidateRecord = Object.freeze({
      mode: 'NEW_FACT',
      domain: candidate.domain,
      literalStatementText: normalizeLiteral(candidate.anchorText),
      sourceTurnId: turn.turnId,
      evidenceSource: 'CURRENT_TURN_USER_STATEMENT'
    });
    return authorization(true, 'OK', candidateRecord);
  }

  // authorizeCorrection(params) — params: { turn:{turnId,text}, existingFact:{memoryId,
  // literalStatementText}, memoryConsent:{granted} }. Mirrors safetyDisclosureIntakeGate.js's own
  // proven single-match-required correction discipline BY PATTERN (§15's own binding resolution):
  // an ordinary later state statement never clears an existing fact — only an unambiguous,
  // explicit correction, matched against one specific already-durable fact, may supersede it.
  // Ambiguity (classifyCorrectionWithStatus() returning correctionConfirmed:false, or 'FAILED')
  // always preserves the existing fact untouched. This path is unaffected by the severity
  // correction above — it never creates a new factual proposition, it only marks an
  // already-authorized fact as no longer active, on an explicit statement to that effect.
  async function authorizeCorrection(params) {
    params = params || {};
    var turn = params.turn || {};
    var existingFact = params.existingFact;
    var consentGranted = !!(params.memoryConsent && params.memoryConsent.granted === true);

    if (!isValidTurn(turn)) return authorization(false, 'INVALID_TURN', null);
    if (!isPlainObject(existingFact) || !isNonEmptyString(existingFact.memoryId) || !isNonEmptyString(existingFact.literalStatementText)) {
      return authorization(false, 'INVALID_EXISTING_FACT', null);
    }
    if (!consentGranted) return authorization(false, 'CONSENT_ABSENT', null);

    if (!RiskCharacteristicInterpreter || typeof RiskCharacteristicInterpreter.classifyCorrectionWithStatus !== 'function') {
      return authorization(false, 'SAFETY_CLASSIFIER_UNAVAILABLE', null);
    }
    var result;
    try {
      result = await RiskCharacteristicInterpreter.classifyCorrectionWithStatus(
        { id: 'turn:' + turn.turnId, text: turn.text }, existingFact.literalStatementText);
    } catch (e) {
      return authorization(false, 'SAFETY_CLASSIFIER_UNAVAILABLE', null);
    }
    if (!result || result.status !== 'CLASSIFIED') return authorization(false, 'SAFETY_CLASSIFIER_UNAVAILABLE', null);
    if (result.correctionConfirmed !== true) return authorization(false, 'NOT_CAPTURE_ELIGIBLE', null);

    var candidateRecord = Object.freeze({
      mode: 'CORRECTION',
      memoryId: existingFact.memoryId,
      sourceTurnId: turn.turnId
    });
    return authorization(true, 'OK', candidateRecord);
  }

  var API = {
    authorizeNewFact: authorizeNewFact,
    authorizeCorrection: authorizeCorrection,
    ANCHOR_TEXT_MAX_CHARS: ANCHOR_TEXT_MAX_CHARS,
    _internal: {
      isValidDurableFactCandidateShape: isValidDurableFactCandidateShape,
      isLiteralSubstringOf: isLiteralSubstringOf,
      normalizeLiteral: normalizeLiteral
    }
  };

  if (typeof window !== 'undefined') { window.RiskCharacteristicIntakeGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
