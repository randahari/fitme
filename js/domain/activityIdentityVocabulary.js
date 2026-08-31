// ══════════════════════════════════════════════════════════════════
// FitMe — Activity Identity Vocabulary (MAI-001, docs/specs/MAI_001_SPEC_v1.0.md §6-§9)
// Exclusive responsibility: the single, closed, canonical V1 activity-token list plus two pure,
// deterministic validation predicates — a pure, dependency-free data module, no logic beyond
// membership/shape checking. Owned independently of Safety (safetyLayer.js, the Safety Context
// Interpreter, individual Safety rules — AD-SF-03) and independently of Domain/Topic
// (js/domain/domainTopicVocabulary.js is a separate file, never extended by this module —
// AD-SF-04). This module represents what an action IS, never whether it is safe, and never what
// coaching subject it belongs to.
//
// No fuzzy matching, no alias inference, no synonym/case normalization, and no mapping from
// js/app.js's own unrelated transient workoutType variable — a candidate value either exactly
// matches one of the six closed tokens or it does not (§8/§9). No numeric confidence, no
// probability, no "closest match" — deterministic membership only.
//
// V1 scope is exactly one field: { activity: <token> }. duration/intensity/quantity/bodyArea/
// recoveryDemand/food identity/any other richer Action Model dimension is out of scope (AD-SF-02)
// and is REJECTED by isValidActionIdentity() below if present, not silently accepted.
//
// No production call site exists yet in V1 (MAI-001 §15) — this module has zero live Candidate
// producer and zero live consumer. It is intentionally unused by production flow until a future,
// separately-authorized producer or Foundation C (Canonical Safety Rule V1 + Real Matcher) reads
// it (MAI-001, Validator Ownership). Reusable by pattern: mirrors
// js/domain/domainTopicVocabulary.js's own "pure, dependency-free data module" structure and
// js/coachDecisionSystem/recommendationCategories.js's own closed-enum-plus-isValidX() predicate
// pattern, by pattern only — no import of either.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // §6 — the closed V1 activity vocabulary, frozen, exact order as canonically approved. Does
  // NOT authorize a Safety rule for any of these six values (SFCD §06) — this module only records
  // what the action IS.
  var ACTIVITY_TOKENS = Object.freeze([
    'RUNNING',
    'WALKING',
    'CYCLING',
    'SWIMMING',
    'STRENGTH_TRAINING',
    'PADEL'
  ]);

  // §8 — pure membership check. No case-folding, no trimming, no synonym table: the token must
  // match one of the six closed values exactly, verbatim, uppercase.
  function isValidActivity(token) {
    return typeof token === 'string' && ACTIVITY_TOKENS.indexOf(token) !== -1;
  }

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  // §4/§8/§9 — the exact V1 shape check: a plain object with exactly one own key, `activity`,
  // whose value passes isValidActivity(). Any extra key (duration, intensity, quantity, bodyArea,
  // recoveryDemand, or any other future Action Model dimension) fails validation — V1 does not
  // silently accept richer semantics (AD-SF-02, §17). A missing/malformed `activity`, a non-object
  // input, null, undefined, or an array all fail validation, never coerced or defaulted.
  function isValidActionIdentity(obj) {
    if (!isPlainObject(obj)) return false;
    var keys = Object.keys(obj);
    if (keys.length !== 1 || keys[0] !== 'activity') return false;
    return isValidActivity(obj.activity);
  }

  var API = {
    ACTIVITY_TOKENS: ACTIVITY_TOKENS,
    isValidActivity: isValidActivity,
    isValidActionIdentity: isValidActionIdentity
  };

  if (typeof window !== 'undefined') { window.ActivityIdentityVocabulary = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
