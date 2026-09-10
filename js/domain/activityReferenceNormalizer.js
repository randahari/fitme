// ══════════════════════════════════════════════════════════════════
// FitMe — Activity Reference Normalizer (TRR-001, docs/specs/TRR_001_SPEC_v1.0.md §24)
// Exclusive responsibility: a single, small, dependency-free, deterministic mapping from an open,
// literal activity reference (a Candidate's own free-text `activityReference`, or a restriction's
// own literal `restrictedActivityText`) to one of MAI-001's six existing, closed activity tokens,
// when — and only when — a narrow, exact, closed accepted-form vocabulary match exists. No fuzzy
// matching, no synonym inference, no AI involvement of any kind — this is a pure, deterministic
// lookup, sibling in kind to `js/domain/activityIdentityVocabulary.js` itself.
//
// Deliberately English-only for V1 (TRR_001_SPEC_v1.0.md §24) — a narrow, disclosed scoping choice,
// not a Product/Architecture decision: an `activityReference` not recognized in English legitimately
// resolves to `null` (no `actionIdentity`), exactly as TDP Chapter 09's own "absence is legitimate"
// invariant already requires for any open-ended activity.
//
// This module does NOT create a universal sports ontology — it maps only the six activities
// MAI-001 already, closedly represents, and its own accepted-form lists are deliberately small and
// exact (never partial/substring, never a "closest match"). Reused, unmodified, by
// `safetyLayer.js`'s own Unresolved Activity Safety Coverage Rule mechanics via its own independent
// `matchesAcceptedForm()` — this module never depends on `safetyLayer.js`, and `safetyLayer.js`
// never depends on this module; each owns its own closed vocabulary/matching logic for its own
// purpose (activity identity vs. Safety-restriction text), per AD-SF-03/AD-SF-04's own established
// separation-of-concerns discipline.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ActivityIdentityVocabulary = (typeof module !== 'undefined' && module.exports)
    ? require('./activityIdentityVocabulary.js')
    : window.ActivityIdentityVocabulary;

  // §24 — the closed, six-entry (one per existing MAI-001 token) English accepted-form table.
  // Multi-word forms (e.g. "strength training") are matched as an exact, whole, normalized phrase;
  // single-word forms are matched via token membership. Deliberately small — never expanded beyond
  // these six MAI-001 tokens without a separate, future, Product-authorized MAI-001 vocabulary
  // expansion (TRR_001_SPEC_v1.0.md §24; TDP Ch.09's own "not this Package's to expand" framing).
  var NORMALIZATION_TABLE = Object.freeze({
    RUNNING: Object.freeze(['run', 'running', 'jog', 'jogging']),
    WALKING: Object.freeze(['walk', 'walking']),
    CYCLING: Object.freeze(['bike', 'biking', 'cycle', 'cycling', 'bicycle', 'bicycling']),
    SWIMMING: Object.freeze(['swim', 'swimming']),
    STRENGTH_TRAINING: Object.freeze(['strength training', 'weight training', 'weights', 'lifting', 'resistance training']),
    PADEL: Object.freeze(['padel'])
  });

  // Deliberately independent of safetyLayer.js's own private tokenize()/matchesAcceptedForm() —
  // this module owns its own small, English-only, letters-only tokenizer (activity-identity
  // matching never needs Hebrew/digit handling, unlike Safety-restriction text matching).
  function tokenize(text) {
    return (typeof text === 'string' ? text : '').toLowerCase().split(/[^a-z]+/).filter(function (t) { return t.length > 0; });
  }

  // §24 — pure, deterministic, exact-match-only normalization. Returns one of MAI-001's six closed
  // tokens when exactly one qualifies, or `null` when none does (never a fabricated/"closest"
  // guess, never AI-assisted, never a partial/substring match). The model never supplies this
  // value directly (TRR_001_SPEC_v1.0.md §20 — the reasoning output schema carries no
  // `actionIdentity` field at all) — this function is the sole, deterministic, FITME-owned
  // producer of `actionIdentity` for an open activity reference.
  function normalize(activityReference) {
    if (typeof activityReference !== 'string' || !activityReference.trim()) return null;
    var trimmedLower = activityReference.trim().toLowerCase();
    var tokens = tokenize(activityReference);
    var matchedToken = null;
    ActivityIdentityVocabulary.ACTIVITY_TOKENS.forEach(function (mai) {
      if (matchedToken) return;
      var forms = NORMALIZATION_TABLE[mai] || [];
      var found = forms.some(function (f) {
        return f.indexOf(' ') !== -1 ? trimmedLower === f : tokens.indexOf(f) !== -1;
      });
      if (found) matchedToken = mai;
    });
    return matchedToken;
  }

  var API = {
    NORMALIZATION_TABLE: NORMALIZATION_TABLE,
    normalize: normalize
  };

  if (typeof window !== 'undefined') { window.ActivityReferenceNormalizer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
