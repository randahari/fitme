// Expression WP13 (EXPRESSION_IMPLEMENTATION_PLAN.md WP13) — deterministic, test-only mechanism
// resolving `EXP-OD-11`: verification of Canonical Decisions CD-EXP-02/CD-EXP-03/CD-EXP-04's
// qualitative content-judgment rules (EXP-59, EXP-60, EXP-62, EXP-64, EXP-65, EXP-67, EXP-71),
// which `EXPRESSION_SPEC_v1.0.md` §29/Appendix C itself classifies as "not mechanically checkable
// field/absence assertions" against a `TerminalDecision` or Delivery Intent object. By direct
// structural analogy to `tests/fixtures/safetyIntegrationPortTestDouble.js` (TASK-006, Canonical
// Decision CD-T006-05): a deterministic double standing in for a judgment a real generative/LLM
// layer would otherwise have to make, never production-reachable (see
// tests/coachDecisionSystemWiring.test.js's own negative test for this guarantee, mirroring
// tests/safetyIntegrationPort.test.js's identical convention for the Safety double).
//
// WHAT THIS IS: a deterministic, Hebrew-language, keyword/pattern-based checker — a heuristic, not
// true semantic understanding. It lets a test assert, repeatably and without any live or
// non-deterministic call, whether a *given* rendered string exhibits one of the categories of
// language CD-EXP-02/03/04 prohibit. Each exported function is a pure predicate: same input,
// same output, every time — the same discipline `safetyIntegrationPortTestDouble.js`'s own
// `disqualifyRule`/`reviewRule` functions already apply to a different judgment.
//
// WHAT THIS IS NOT, STATED PLAINLY (per WP13's own explicit constraint: this file must not pretend
// fixed-string generation alone verifies qualitative compliance): this checker is never run against
// Expression's real, production-generated output — Expression's actual `generateFn` calls a live
// LLM in production (WP4/WP9), and this file is never required by any production module. It does
// not, and cannot, guarantee that real generated content will comply with CD-EXP-02/03/04 — no
// deterministic mechanism could do that without itself becoming a second, LLM-scale judgment
// system, which is explicitly not this Work Package's authority to build (no new Product,
// Architecture, or Canonical decision). What it closes is narrower and honest: (a) it gives
// Engineering a concrete, versioned, testable definition of each prohibited language category,
// replacing pure informal human judgment with a repeatable check; (b) it lets WP5/WP6/WP7's test
// suites assert against representative example wording — not only the system instruction sent to
// the generative layer, which is all they verified before this Work Package — proving the checker
// itself correctly distinguishes a compliant example from a violating one, for every rule
// EXP-OD-11 names.
'use strict';

function containsAny(text, terms) {
  text = String(text || '');
  return terms.some(function (t) { return text.indexOf(t) !== -1; });
}

// EXP-59/EXP-60/AC-13 (REFUSAL) — blame, shame, failure, or wrongdoing attributed to the user
// (never the situation, per EXP-59's own "attributed to the situation, never to the user").
var BLAME_TERMS = ['אשם', 'אשמה', 'באשמתך', 'נכשלת', 'הכישלון שלך', 'טעית', 'הטעות שלך', 'לא הצלחת', 'זו הבעיה שלך'];
function containsBlameLanguage(text) { return containsAny(text, BLAME_TERMS); }

// EXP-62/AC-13 (REFUSAL) — comparison, measurement, or judgment of the user against others or a standard.
var COMPARISON_TERMS = ['בהשוואה', 'לעומת אחרים', 'יותר טוב מ', 'פחות טוב מ', 'מהאחרים', 'מהממוצע', 'בניגוד לאחרים'];
function containsComparisonLanguage(text) { return containsAny(text, COMPARISON_TERMS); }

// EXP-64/AC-15 (ESCALATION) — diagnosis or a named medical/psychological condition ("no diagnosis,
// no named condition").
var DIAGNOSIS_TERMS = ['דיכאון', 'חרדה קלינית', 'אנורקסיה', 'בולימיה', 'תסמונת', 'אבחון', 'אבחנה', 'מחלת נפש'];
function containsDiagnosisLanguage(text) { return containsAny(text, DIAGNOSIS_TERMS); }

// EXP-65 (ESCALATION) — alarm/dramatic register, inconsistent with the same register as ordinary
// coaching guidance ("not alarm/dramatic — a single fixed register, since no Urgency/severity
// dimension reaches Expression"). Heuristic: repeated exclamation marks or a fixed set of
// dramatic-urgency phrases; deliberately narrow, since ordinary calm encouragement must not be
// false-flagged.
function hasAlarmRegister(text) {
  text = String(text || '');
  return /!{2,}/.test(text) || containsAny(text, ['חירום!', 'מיידי!!!', 'סכנת חיים מיידית']);
}

// EXP-67/AC-15 (ESCALATION) — any statement or implication that FITME contacts, has contacted, or
// will contact a healthcare provider or third party (or otherwise replaces one).
var THIRD_PARTY_CONTACT_TERMS = ['יצרנו קשר עם', 'ניצור קשר עם', 'פנינו ל', 'התקשרנו ל', 'המרפאה שלך יודעת', 'הרופא שלך קיבל עדכון'];
function impliesThirdPartyContact(text) { return containsAny(text, THIRD_PARTY_CONTACT_TERMS); }

// EXP-71/AC-18 (all dispositions) — a closed catalogue of internal component/stage/disposition/
// reasonCode implementation details that must never leak into rendered wording. Unlike the
// categories above, this one is a precise, closed-vocabulary check, not a heuristic — the exact
// same discipline already established for the other "never names an internal identifier" checks
// elsewhere in this repository (e.g. tests/coachDecisionSystemWiring.test.js's own #16/#16b).
var INTERNAL_IMPLEMENTATION_TERMS = ['safetyLayer', 'Safety Layer', 'reasonCode', 'TerminalDecision', 'Decision Engine', 'DEFERRED', 'BLOCKED', 'MODIFIED', 'ESCALATED', 'UNMODIFIED', 'disposition', 'candidateProvenance', 'Stage 8', 'Stage 9'];
function leaksInternalImplementationDetail(text) { return containsAny(text, INTERNAL_IMPLEMENTATION_TERMS); }

module.exports = {
  containsBlameLanguage: containsBlameLanguage,
  containsComparisonLanguage: containsComparisonLanguage,
  containsDiagnosisLanguage: containsDiagnosisLanguage,
  hasAlarmRegister: hasAlarmRegister,
  impliesThirdPartyContact: impliesThirdPartyContact,
  leaksInternalImplementationDetail: leaksInternalImplementationDetail
};
