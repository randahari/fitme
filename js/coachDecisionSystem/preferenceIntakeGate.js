// ══════════════════════════════════════════════════════════════════
// FitMe — Preference Intake Gate (CPI-001, docs/specs/CPI_001_SPEC_v1.0.md §10)
// Exclusive responsibility: the deterministic "Validation → Business Rules → Deterministic
// Decision" link of REM-003 §9's own Authoritative Write Contract. Invoked ONLY when
// ExplicitPreferenceStatementInterpreter (§9) has already returned eligible:true for the current
// turn — never re-implements that classification, never re-derives preferenceClass/polarity/
// target of its own. Produces exactly one thing: a frozen, closed Preference Intake Authorization
// — never a TerminalDecision, never a Firestore write, never an Expression invocation.
//
// This module never writes Typed Memory, never persists anything, and performs no Stage 4-9
// Candidate/Eligibility/Evidence/Winner-Selection work. Its only side effect is one independent,
// read-only classification call to the existing, unmodified, already-production-configured
// SafetyContextInterpreter (§10 point 5) — the mandatory, fail-closed Safety veto.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ExplicitPreferenceStatementInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./explicitPreferenceStatementInterpreter.js')
    : window.ExplicitPreferenceStatementInterpreter;
  // §10 point 5 — the exact same, existing, already-production-configured collaborator
  // memoryLayer.js's own userSafetyContext step already calls for durable memory (USC-001).
  // Reused here by a second, independent, additive call site — classifyWithStatus() is a small,
  // purely additive sibling export on that same, otherwise-untouched module (see its own header).
  var SafetyContextInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyContextInterpreter.js')
    : window.SafetyContextInterpreter;

  var PREFERENCE_CLASSES = ['ACTIVITY_SENTIMENT', 'TRAINING_TIME_PREFERENCE', 'TRAINING_FORMAT_PREFERENCE'];
  var POLARITIES = ['POSITIVE', 'NEGATIVE'];
  var CLOSED_TARGET_TOKENS = {
    TRAINING_TIME_PREFERENCE: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
    TRAINING_FORMAT_PREFERENCE: ['SHORT', 'LONG']
  };
  var TARGET_MAX_CHARS = 80;

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function normalizeLiteral(text) { return (typeof text === 'string') ? text.trim().toLowerCase() : ''; }
  function isLiteralSubstringOf(candidate, sourceText, maxChars) {
    var c = normalizeLiteral(candidate);
    var s = normalizeLiteral(sourceText);
    return c.length > 0 && c.length <= maxChars && s.indexOf(c) >= 0;
  }

  function authorization(authorized, reason, candidateRecord) {
    return Object.freeze({ authorized: !!authorized, reason: reason, candidateRecord: candidateRecord || null });
  }

  // §10 checks 1-2 — malformed interpreter output is never trusted structurally, and the class-A
  // target is re-verified as a literal substring here, never merely trusted from the interpreter
  // (defense in depth, matching SafetyContextInterpreter's own established re-enforcement
  // pattern). Returns { ok: true, preferenceClass, polarity, target } or { ok: false, reason:
  // 'INVALID_SHAPE'|'LITERAL_ANCHOR_FAILED' } — the two checks are kept distinguishable so
  // authorize() below can report the exact §10 reason, matching the SPEC's own closed enum.
  function validateInterpreterResult(interpreterResult, turnText) {
    if (!isPlainObject(interpreterResult) || interpreterResult.eligible !== true) {
      return { ok: false, reason: 'INVALID_SHAPE' };
    }
    var preferenceClass = interpreterResult.preferenceClass;
    var polarity = interpreterResult.polarity;
    var target = interpreterResult.target;
    if (PREFERENCE_CLASSES.indexOf(preferenceClass) < 0) return { ok: false, reason: 'INVALID_SHAPE' };
    if (POLARITIES.indexOf(polarity) < 0) return { ok: false, reason: 'INVALID_SHAPE' };
    if (preferenceClass === 'ACTIVITY_SENTIMENT') {
      if (!isLiteralSubstringOf(target, turnText, TARGET_MAX_CHARS)) return { ok: false, reason: 'LITERAL_ANCHOR_FAILED' };
      return { ok: true, preferenceClass: preferenceClass, polarity: polarity, target: normalizeLiteral(target) };
    }
    var closedTokens = CLOSED_TARGET_TOKENS[preferenceClass] || [];
    if (closedTokens.indexOf(target) < 0) return { ok: false, reason: 'INVALID_SHAPE' };
    return { ok: true, preferenceClass: preferenceClass, polarity: polarity, target: target };
  }

  // §10 point 5, secondary layer — a zero-cost, best-effort cross-check against ALREADY-assembled
  // durable Safety restrictions (pipelineContext.userSafetyContext). No additional read or AI
  // call. Never the primary fail-closed guarantee (see the file header of
  // safetyContextInterpreter.js's classifyWithStatus() for why this layer alone cannot be trusted
  // to distinguish "confidently clear" from "unavailable").
  function matchesDurableSafetyRestriction(target, pipelineContext) {
    var items = pipelineContext && pipelineContext.userSafetyContext && Array.isArray(pipelineContext.userSafetyContext.items)
      ? pipelineContext.userSafetyContext.items : [];
    var normalizedTarget = normalizeLiteral(target);
    if (!normalizedTarget) return false;
    return items.some(function (item) {
      var restricted = normalizeLiteral(item && item.restrictedActivityText);
      if (!restricted) return false;
      return restricted.indexOf(normalizedTarget) >= 0 || normalizedTarget.indexOf(restricted) >= 0;
    });
  }

  // §10 point 5, primary layer — the mandatory, independent, fail-closed Safety veto. Reuses
  // classifyWithStatus() so a classifier failure (throw/timeout/malformed output) is
  // distinguishable from a genuine, confident "no restriction found" and is NEVER coerced into
  // the latter. Returns { vetoed: true, reason: 'SAFETY_VETO' } / { vetoed: true, reason:
  // 'SAFETY_VETO_UNAVAILABLE' } / { vetoed: false }.
  async function evaluateSafetyVeto(turn) {
    if (!SafetyContextInterpreter || typeof SafetyContextInterpreter.classifyWithStatus !== 'function') {
      // Defensive fail-closed — the collaborator itself must always be present in production
      // (already configure()d in app.js); its absence is treated exactly like a classifier
      // failure, never as "no restriction found."
      return { vetoed: true, reason: 'SAFETY_VETO_UNAVAILABLE' };
    }
    var result;
    try {
      result = await SafetyContextInterpreter.classifyWithStatus([{ id: 'turn:' + turn.turnId, text: turn.text }]);
    } catch (e) {
      return { vetoed: true, reason: 'SAFETY_VETO_UNAVAILABLE' };
    }
    if (!result || result.status !== 'CLASSIFIED') {
      return { vetoed: true, reason: 'SAFETY_VETO_UNAVAILABLE' };
    }
    var restrictions = Array.isArray(result.restrictions) ? result.restrictions : [];
    if (restrictions.length > 0) {
      return { vetoed: true, reason: 'SAFETY_VETO' };
    }
    return { vetoed: false };
  }

  // authorize(params) — §10. params: { interpreterResult, turn, pipelineContext, consentGranted }.
  // Only ever called by the orchestrator when interpreterResult.eligible === true (§9/§14 step 4);
  // this module does not itself branch on the not-eligible case (that is an orchestrator-level
  // short-circuit that never reaches this function at all, per the SPEC's own "invoked only when
  // the interpreter returns eligible:true").
  async function authorize(params) {
    params = params || {};
    var interpreterResult = params.interpreterResult;
    var turn = params.turn || {};
    var pipelineContext = params.pipelineContext;
    var consentGranted = params.consentGranted === true;

    var turnText = typeof turn.text === 'string' ? turn.text : '';

    // Check 1-2 (§10).
    var validated = validateInterpreterResult(interpreterResult, turnText);
    if (!validated.ok) return authorization(false, validated.reason, null);

    // Check 3 (§10/§7) — consent required before persistence, not only before consumption.
    if (!consentGranted) return authorization(false, 'CONSENT_ABSENT', null);

    // Check 5 (§10 point 5) — independent, fail-closed Safety veto. Primary layer first (the
    // authoritative guarantee); the secondary, durable cross-check only matters when the primary
    // layer found nothing (never overridden by, and never a substitute for, the primary layer).
    var veto;
    try {
      veto = await evaluateSafetyVeto(turn);
    } catch (e) {
      veto = { vetoed: true, reason: 'SAFETY_VETO_UNAVAILABLE' };
    }
    if (veto.vetoed) return authorization(false, veto.reason, null);

    if (matchesDurableSafetyRestriction(validated.target, pipelineContext)) {
      return authorization(false, 'SAFETY_VETO_DURABLE', null);
    }

    // Authorized — the candidateRecord is exactly what §11/§12 need to construct the Typed
    // Memory write at the persistence boundary; sourceTurnId is traceability only (§18), never a
    // promotion of the transcript itself to authority.
    var candidateRecord = Object.freeze({
      preferenceClass: validated.preferenceClass,
      polarity: validated.polarity,
      target: validated.target,
      sourceTurnId: turn.turnId
    });
    return authorization(true, 'OK', candidateRecord);
  }

  var API = {
    authorize: authorize,
    _internal: {
      validateInterpreterResult: validateInterpreterResult,
      matchesDurableSafetyRestriction: matchesDurableSafetyRestriction,
      evaluateSafetyVeto: evaluateSafetyVeto,
      isLiteralSubstringOf: isLiteralSubstringOf,
      normalizeLiteral: normalizeLiteral
    }
  };

  if (typeof window !== 'undefined') { window.PreferenceIntakeGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
