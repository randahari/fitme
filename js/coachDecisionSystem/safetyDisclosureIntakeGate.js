// ══════════════════════════════════════════════════════════════════
// FitMe — Safety Disclosure Intake Gate (Friends Alpha Item 6, USER_DISCLOSURE V1)
// Exclusive responsibility: the deterministic "Validation → Business Rules → Deterministic
// Decision" link for durable Safety-relevant capture, structurally mirroring
// preferenceIntakeGate.js's own established shape exactly. Invoked only when
// UserDisclosureRecognizer has already recognized a USER_DISCLOSURE for the current turn — never
// re-implements that recognition, never re-derives category of its own. Produces exactly one
// thing: a frozen, closed Disclosure Capture Authorization — never a TerminalDecision, never a
// Firestore write, never an Expression invocation.
//
// Reuses SafetyContextInterpreter unmodified — restriction recognition and explicit-correction
// recognition belong to the same semantic Safety classification authority (that module), never a
// second/parallel Safety classifier or a second Safety memory authority. USC-001's own
// userSafetyContext assembly (Typed-Memory-only, read-time) is never touched by this module.
//
// Strict correction semantics (Product/Architecture binding correction): an ordinary later state
// statement never clears an existing restriction — only an unambiguous, explicit correction,
// matched against one specific already-durable restriction, may supersede it. Ambiguity always
// preserves the existing restriction.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var SafetyContextInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyContextInterpreter.js')
    : window.SafetyContextInterpreter;

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function normalizeLiteral(text) { return (typeof text === 'string') ? text.trim().toLowerCase() : ''; }

  function authorization(authorized, reason, candidateRecord) {
    return Object.freeze({ authorized: !!authorized, reason: reason, candidateRecord: candidateRecord || null });
  }

  // Primary layer — does the current turn itself literally, explicitly state a NEW restriction?
  // Reuses the exact, existing, already-production-configured collaborator preferenceIntakeGate.js
  // already calls for its own veto (classifyWithStatus) — no second classifier authority.
  async function detectNewRestriction(turn) {
    if (!SafetyContextInterpreter || typeof SafetyContextInterpreter.classifyWithStatus !== 'function') {
      return { status: 'FAILED' };
    }
    var result;
    try {
      result = await SafetyContextInterpreter.classifyWithStatus([{ id: 'turn:' + turn.turnId, text: turn.text }]);
    } catch (e) {
      return { status: 'FAILED' };
    }
    if (!result || result.status !== 'CLASSIFIED') return { status: 'FAILED' };
    var restrictions = Array.isArray(result.restrictions) ? result.restrictions : [];
    if (!restrictions.length) return { status: 'CLASSIFIED', restriction: null };
    return { status: 'CLASSIFIED', restriction: restrictions[0] };
  }

  // Secondary layer — only reached when the current turn does NOT itself state a new restriction.
  // Checks the turn against each already-durable restriction (pipelineContext.userSafetyContext,
  // the SAME field CSR-001's own rule matcher already reads — no new read path) for an explicit,
  // unambiguous correction. Exactly one confirmed match is required; zero or more-than-one both
  // preserve every existing restriction untouched (never a partial/ambiguous clear).
  async function detectCorrection(turn, pipelineContext) {
    var items = pipelineContext && pipelineContext.userSafetyContext && Array.isArray(pipelineContext.userSafetyContext.items)
      ? pipelineContext.userSafetyContext.items : [];
    if (!items.length) return { status: 'CLASSIFIED', subjectKey: null };
    if (!SafetyContextInterpreter || typeof SafetyContextInterpreter.classifyCorrectionWithStatus !== 'function') {
      return { status: 'FAILED' };
    }
    var confirmedSubjectKeys = [];
    for (var i = 0; i < items.length; i++) {
      var restrictedActivityText = items[i] && items[i].restrictedActivityText;
      if (typeof restrictedActivityText !== 'string' || !restrictedActivityText.length) continue;
      var result;
      try {
        result = await SafetyContextInterpreter.classifyCorrectionWithStatus({ id: 'turn:' + turn.turnId, text: turn.text }, restrictedActivityText);
      } catch (e) {
        return { status: 'FAILED' }; // any classification failure fails the whole correction check closed
      }
      if (!result || result.status !== 'CLASSIFIED') return { status: 'FAILED' };
      if (result.correctionConfirmed === true) confirmedSubjectKeys.push(normalizeLiteral(restrictedActivityText));
    }
    if (confirmedSubjectKeys.length !== 1) return { status: 'CLASSIFIED', subjectKey: null }; // 0 or >1 — ambiguous, preserve
    return { status: 'CLASSIFIED', subjectKey: confirmedSubjectKeys[0] };
  }

  // authorize(params) — params: { turn, pipelineContext, consentGranted, category }. Only ever
  // called when UserDisclosureRecognizer has already recognized a USER_DISCLOSURE for this turn
  // (mirrors preferenceIntakeGate.js's own "invoked only when eligible" discipline) — this module
  // does not itself decide whether a disclosure exists. `category` is passed through unchanged
  // (never re-derived here) so the persistence boundary (js/app.js) has it available when
  // building the final disclosureAcknowledgment, without a second read/recognition call.
  async function authorize(params) {
    params = params || {};
    var turn = params.turn || {};
    var pipelineContext = params.pipelineContext;
    var consentGranted = params.consentGranted === true;
    var category = params.category;

    if (typeof turn.turnId !== 'string' || typeof turn.text !== 'string') {
      return authorization(false, 'INVALID_TURN', null);
    }

    var newRestrictionResult;
    try {
      newRestrictionResult = await detectNewRestriction(turn);
    } catch (e) {
      newRestrictionResult = { status: 'FAILED' };
    }
    if (newRestrictionResult.status === 'FAILED') return authorization(false, 'SAFETY_CLASSIFIER_UNAVAILABLE', null);

    if (newRestrictionResult.restriction) {
      if (!consentGranted) return authorization(false, 'CONSENT_ABSENT', null);
      var restrictedActivityText = newRestrictionResult.restriction.restrictedActivityText;
      return authorization(true, 'OK', Object.freeze({
        mode: 'NEW_RESTRICTION',
        restrictedActivityText: restrictedActivityText,
        subjectKey: normalizeLiteral(restrictedActivityText),
        sourceTurnId: turn.turnId,
        category: category
      }));
    }

    var correctionResult;
    try {
      correctionResult = await detectCorrection(turn, pipelineContext);
    } catch (e) {
      correctionResult = { status: 'FAILED' };
    }
    if (correctionResult.status === 'FAILED') return authorization(false, 'SAFETY_CLASSIFIER_UNAVAILABLE', null);

    if (correctionResult.subjectKey) {
      if (!consentGranted) return authorization(false, 'CONSENT_ABSENT', null);
      return authorization(true, 'OK', Object.freeze({
        mode: 'CORRECTION',
        subjectKey: correctionResult.subjectKey,
        sourceTurnId: turn.turnId,
        category: category
      }));
    }

    return authorization(false, 'NOT_CAPTURE_ELIGIBLE', null);
  }

  var API = {
    authorize: authorize,
    _internal: {
      detectNewRestriction: detectNewRestriction,
      detectCorrection: detectCorrection,
      normalizeLiteral: normalizeLiteral
    }
  };

  if (typeof window !== 'undefined') { window.SafetyDisclosureIntakeGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
