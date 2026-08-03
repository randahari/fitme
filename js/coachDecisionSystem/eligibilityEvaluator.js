// ══════════════════════════════════════════════════════════════════
// FitMe — Eligibility Evaluator (TASK-006, D2 Stage 5 — Eligibility
// Evaluation, TASK_006_SPEC_v1.0.md §15)
// Exclusive responsibility: apply the D1 Unit 06 Intervention Eligibility
// gate to a single Opportunity, at the Opportunity level, before any
// Candidate is generated for it (D2 Unit 04 Stage 5 Purpose). Pipeline
// Gate, not a Decision Lifecycle state (D2 Unit 06, Canonical Decision 2).
// Driven exclusively by the closed OpportunityEligibilityInput contract
// (Canonical Decision CD-T006-01, §15.11) — never by free-text parsing of
// an Opportunity's proposedAction/explanation/any other narrative field.
// internal collaborator only, within the single Composite Engine (D3 §17
// Decision 1) — not independently registered. Pure, deterministic
// function: same input, same eligible/ineligible/malformed outcome.
//
// A safety/high-risk-triggered Opportunity (safetyHighRiskBypass: true)
// bypasses this Stage entirely (D1-IE-05, D2-EF-01(a)) — the caller never
// invokes evaluate() for such an Opportunity in the first place; this
// module still recognizes and honors the flag defensively if it is ever
// called anyway, returning ELIGIBLE with a BYPASS reason rather than
// running the ordinary gate against it.
//
// Engineering interpretation (D1-IE-04, §15.3): D1 fixes no numeric or
// formulaic threshold for "reduce intervention frequency" during a
// low-coaching-value period, and none is invented here (§15.10). Absent
// any such formula, and absent any persistent per-period counter (Canonical
// Decision CD-T006-04 — no persistent budget/frequency state of any kind),
// the only deterministic, non-fabricated reading available to a single
// Decision Pass is the most conservative one: lowCoachingValuePeriodActive
// === true resolves this Opportunity to ineligible for this Decision Pass
// (a full reduction is a legitimate subset of "reduce," D1-IE-04's own
// wording). At the current repository baseline this branch cannot fire in
// practice (lifeEventContext/capacityState are always UNAVAILABLE, so
// lowCoachingValuePeriodActive defaults to false, §15.3/§15.11), but it
// must still behave correctly and deterministically once a real source
// exists. Flagged for Product/Architecture confirmation alongside the
// spec's own G-9-style non-blocking items.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // D1-IE-01's exact seven enumerated valid reasons (Canonical Decision CD-T006-01, §15.11).
  var VALID_REASON_CATEGORIES = Object.freeze([
    'PREVENT_PREDICTABLE_MISTAKE',
    'HELP_BEFORE_DIFFICULT_DECISION',
    'CELEBRATE_MEANINGFUL_PROGRESS',
    'SUPPORT_RECOVERY',
    'PREPARE_FOR_FORESEEABLE_CHALLENGE',
    'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
    'PROTECT_STATED_LONG_TERM_GOALS'
  ]);

  var OPPORTUNITY_SOURCES = Object.freeze([
    'DECISION_WINDOW',
    'CONFIRMED_PATTERN_ANTICIPATION',
    'DISRUPTION_DETECTION',
    'MILESTONE_RECOVERY',
    'SAFETY_HIGH_RISK'
  ]);

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // Canonical Decision CD-T006-01's closed-field contract (§15.11). Every field is required;
  // no field's absence is treated as an implicit default other than the single named exception
  // (lowCoachingValuePeriodActive defaulting to false when both its Pipeline Context sources are
  // structurally UNAVAILABLE — that resolution happens upstream, at the caller that builds this
  // input, not inside this validator, since this module never reads Pipeline Context directly).
  function validateInput(input) {
    if (!isPlainObject(input)) return 'input is required';
    if (!isNonEmptyString(input.id)) return 'id is required';
    if (OPPORTUNITY_SOURCES.indexOf(input.sourceCategory) === -1) return 'sourceCategory is invalid';
    if (VALID_REASON_CATEGORIES.indexOf(input.validReasonCategory) === -1) return 'validReasonCategory is missing or outside the closed enum (D1-IE-01)';
    if (!isPlainObject(input.trustTestSignal)) return 'trustTestSignal is required';
    if (input.trustTestSignal.glad !== true && input.trustTestSignal.glad !== false && input.trustTestSignal.glad !== null) {
      return 'trustTestSignal.glad must be true, false, or null';
    }
    if (!isNonEmptyString(input.trustTestSignal.basis)) return 'trustTestSignal.basis is required';
    if (typeof input.lowCoachingValuePeriodActive !== 'boolean') return 'lowCoachingValuePeriodActive is required';
    if (typeof input.safetyHighRiskBypass !== 'boolean') return 'safetyHighRiskBypass is required';
    return null;
  }

  // D2 Unit 04 Stage 5. Never throws (contract violation -> MALFORMED, not a thrown error, same
  // discipline as recommendationEngine.js/initiativeEngine.js's own validateRequest()). Binary
  // per-Opportunity outcome for a well-formed input: ELIGIBLE or INELIGIBLE (§15.6); a malformed
  // input is a distinct, non-inferred third outcome (§15.11) — never defaulted to either.
  function evaluate(input) {
    var err = validateInput(input);
    if (err) return freezeShallow({ outcome: 'MALFORMED', reason: err });

    // D1-IE-05 / D2-EF-01(a) — defensive honoring only; the ordinary caller never invokes this
    // function at all for a safety/high-risk-triggered Opportunity (§15.5, §21.1).
    if (input.safetyHighRiskBypass === true) {
      return freezeShallow({ outcome: 'ELIGIBLE', reason: 'SAFETY_HIGH_RISK_BYPASS' });
    }

    // D1-IE-01 — a valid reason is already established by validateInput()'s closed-enum check
    // above; no further inference is performed on it here.

    // D1-IE-02 — Trust Test. glad === null is "uncertain," which itself resolves to ineligible;
    // glad === false is an explicit, non-uncertain "would not be glad," also ineligible. Only
    // glad === true clears this gate.
    if (input.trustTestSignal.glad !== true) {
      return freezeShallow({
        outcome: 'INELIGIBLE',
        reason: input.trustTestSignal.glad === null ? 'TRUST_TEST_UNCERTAIN' : 'TRUST_TEST_NOT_GLAD'
      });
    }

    // D1-IE-04 — reduced-frequency adjustment during low-coaching-value periods. See file header
    // for the engineering interpretation of "reduce" as a full reduction for this Decision Pass,
    // absent any canonical formula or persistent per-period counter.
    if (input.lowCoachingValuePeriodActive === true) {
      return freezeShallow({ outcome: 'INELIGIBLE', reason: 'LOW_COACHING_VALUE_PERIOD' });
    }

    // D1-IE-03 is enforced structurally: this function never declares eligibility from anything
    // other than the closed contract above — there is no "event occurred" signal it could act on
    // even if one were supplied.
    return freezeShallow({ outcome: 'ELIGIBLE', reason: input.validReasonCategory });
  }

  var API = {
    VALID_REASON_CATEGORIES: VALID_REASON_CATEGORIES,
    evaluate: evaluate
  };

  if (typeof window !== 'undefined') { window.EligibilityEvaluator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
