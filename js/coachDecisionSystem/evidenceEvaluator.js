// ══════════════════════════════════════════════════════════════════
// FitMe — Evidence Evaluator (G-2, D2 Stage 4 — Evidence Evaluation,
// docs/specs/G2_SPEC_v1.0.md §24-26, `AD-G2-02`)
// אחריות בלעדית: יישום ה-Stage-4 Evidence Sufficiency gate (D1 Unit 11) על DetectedOpportunity
// יחיד, לפני שנבנה OpportunityEligibilityInput (Stage 4→5 handoff, internalPipelineOrchestrator.js
// buildEligibilityAndCandidateInputs()). internal collaborator בלבד בתוך ה-Decision Engine's
// existing boundary (AD-G2-02 Item 3) — אינו Engine/collaborator/Registry entry חדש. פונקציה
// טהורה, דטרמיניסטית: אותו Input מחזיר אותו EvidenceEvaluationResult. אינה: ממציאה evidence,
// rationale, confidence, או proposedAction; מבצעת Stage-5 Eligibility; מייצרת Candidate content;
// מבצעת Expression (AD-G2-02 Item 5, verbatim).
//
// SAFETY_HIGH_RISK bypasses Stage 4 entirely (D1-OD-04, D2-EF-01(a)) — the ordinary caller
// (internalPipelineOrchestrator.js) never invokes evaluate() for a Safety-sourced
// DetectedOpportunity in the first place (§18.2, §25.1 table row 1); this module still
// recognizes and honors the flag defensively if it is ever called anyway, mirroring
// eligibilityEvaluator.js's own documented discipline.
//
// Tier classification (§25.1, per-source, evidence-grounded, non-invented): a
// CONFIRMED_PATTERN_ANTICIPATION Habit-derived Observation already ACTIVE/CONFIRMED classifies
// REPEATED_BEHAVIOUR (initiativeEngine.js's own documented B5-eligibility-gate guarantee,
// unchanged from the prior draft). The V1 Habit FOOD_LOGGING WEAKENING case classifies
// REPEATED_BEHAVIOUR too — but its basis is explicitly `provenance.currentEpisodeEstablished ===
// true` (CSF Ch.29 AD-HL-02/AD-HL-06, now implemented and production-backed verified, Ch.29.7),
// never an inference from `statusOf()`'s branch order (the superseded Ch.27.1 basis), and never
// the historical-ever everEstablishedHistorically/firstEstablishedAt fields (not authoritative
// here — CSF Ch.29 PD-HL-05). Pattern-derived WEAKENING receives no corresponding mapping — it
// never reaches this classification step at all (excluded upstream at B5, §23). No other source
// (DISRUPTION_DETECTION, MILESTONE_RECOVERY, DECISION_WINDOW) has a classification source at this
// baseline — Repository Gap, inherited, non-blocking (§25.1 table row 4) — classified
// INSUFFICIENT, honestly, never invented.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var RecommendationCategories = (typeof module !== 'undefined' && module.exports)
    ? require('./recommendationCategories.js')
    : window.RecommendationCategories;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  // §25.2 — Sufficiency Rule, directly from D1-OD-01.
  var SUFFICIENT_TIERS = Object.freeze(['EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR']);
  var EVIDENCE_TIERS = Object.freeze([
    'EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR',
    'SINGLE_BEHAVIOUR', 'INFERENCE', 'INSUFFICIENT'
  ]);

  function makeResult(evidenceTier, reason) {
    return freezeShallow({
      outcome: SUFFICIENT_TIERS.indexOf(evidenceTier) !== -1 ? 'SUFFICIENT' : 'INSUFFICIENT',
      evidenceTier: evidenceTier,
      reason: reason
    });
  }

  function validateInput(input) {
    if (!isPlainObject(input)) return 'input is required';
    if (!isNonEmptyString(input.id)) return 'id is required';
    if (!RecommendationCategories.isValidOpportunitySource(input.sourceCategory)) return 'sourceCategory is invalid';
    return null;
  }

  // Input: one DetectedOpportunity (G2_SPEC §21.3). Never throws — a malformed input classifies
  // INSUFFICIENT with an explanatory reason, mirroring eligibilityEvaluator.js's own
  // never-throws discipline (contract violation -> a distinct, non-inferred outcome, never a
  // thrown error).
  function evaluate(input) {
    var err = validateInput(input);
    if (err) return makeResult('INSUFFICIENT', err);

    if (input.safetyHighRiskBypass === true) {
      // D1-OD-04/D2-EF-01(a) — defensive honoring only; the ordinary caller never invokes this
      // function at all for a safety/high-risk-triggered Opportunity (§18.2, §25.1 row 1).
      return makeResult('EXPLICIT_USER_ACTION', 'SAFETY_HIGH_RISK bypasses Stage 4 entirely (D1-OD-04, D2-EF-01(a)) — defensively honored, not ordinarily reached');
    }

    var observation = input.contextualMeaning && isPlainObject(input.contextualMeaning.basis)
      ? input.contextualMeaning.basis.observation : null;
    var sourceType = observation && observation.sourceType;
    var lifecycle = observation && observation.lifecycle;

    if (input.sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION' && sourceType === 'HABIT') {
      if (lifecycle === 'ACTIVE' || lifecycle === 'CONFIRMED') {
        return makeResult('REPEATED_BEHAVIOUR',
          'initiativeEngine.js\'s own documented B5-eligibility-gate guarantee (already confirmed-tier established, per detectConfirmedPatternAnticipation()) — G2_SPEC §25.1');
      }
      if (lifecycle === 'WEAKENING') {
        // The exact basis is the real, persisted establishment fact carried on the
        // ContextualMeaning constructed for this Observation (contextualMeaningPolicy.js) — never
        // an inference from lifecycle alone, and never historical-ever establishment.
        var established = input.contextualMeaning.basis.priorEstablishmentBasis != null;
        if (established) {
          return makeResult('REPEATED_BEHAVIOUR',
            'provenance.currentEpisodeEstablished === true (Habit Engine Current-Episode Establishment Authority, CSF Ch.29 AD-HL-02/AD-HL-06) — G2_SPEC §25.1');
        }
      }
    }

    // No classification source exists for DISRUPTION_DETECTION/MILESTONE_RECOVERY/
    // DECISION_WINDOW, a Pattern-derived WEAKENING Observation (excluded upstream at B5 in any
    // case), a Habit WEAKENING Observation lacking the real establishment fact, or any other
    // combination — Repository Gap, inherited, non-blocking (§25.1 row 4). Never invented.
    return makeResult('INSUFFICIENT', 'no classification source exists for this Observation shape at this baseline (G2_SPEC §25.1)');
  }

  var API = {
    EVIDENCE_TIERS: EVIDENCE_TIERS,
    evaluate: evaluate
  };

  if (typeof window !== 'undefined') { window.EvidenceEvaluator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
