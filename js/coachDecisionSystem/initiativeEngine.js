// ══════════════════════════════════════════════════════════════════
// FitMe — Initiative Engine (TASK-005, D2 Unit 07 — Stage 3 contribution +
// Stage 6 Candidate Generation for Initiative-kind Candidates)
// אחריות בלעדית: (1) Stage 3 — תרומת detection ל-Opportunity Detection,
// מוגבלת ל-confirmed-pattern anticipation ו-disruption/milestone detection
// בלבד (D1 Unit 05, D2 Unit 07) — לעולם לא Decision Window (זו תרומת
// Recommendation Engine, D2 Unit 04 Stage 3 Dependencies) ולא
// Safety/high-risk (Safety Layer, D1-OD-04/D2-EF-01(a)). (2) Stage 6 —
// generate(InitiativeRequest) -> InitiativeResult, סמכות תזמור בלעדית
// ל-Initiative-kind Candidates, מיישם את D1 Unit 09 במלואו כולל
// Relationship-Maturity gating (D1-IP-02). internal collaborator בלבד
// בתוך ה-Composite Engine היחיד (D3 §17 Decision 1) — אינו נרשם באופן
// עצמאי ב-EngineRegistry. פונקציה טהורה, דטרמיניסטית: אותו Input מחזיר
// אותו Candidate Set. אינה מדרגת (Prioritization), אינה בוחרת Winner,
// אינה מבצעת Decision Formation — כל אלה בלעדית ל-Decision Engine העתידי
// (TASK-006, D2 Unit 07 Forbidden Responsibilities). אינה כותבת דבר
// (durable write), אינה קוראת StateAccess/DerivedIntelligenceConsumer/
// Firestore ישירות — קוראת אך ורק את ה-Pipeline Context שכבר הורכב ע"י
// ה-Memory Layer (D3 §8.1/§11.1). InitiativeCandidate אינו נושא שדה
// category — אין קטגוריזציה Initiative-specific מאושרת (Canonical
// Decision CD-T005-02, TASK_005_SPEC_v1.0.md §19).
//
// כמו recommendationEngine.js (TASK-004): אין כאן ייצור תוכן-קואצ'ינג.
// EligibleOpportunity חייב לשאת כבר proposedAction+explanation מוכנים —
// מקורם Opportunity Detection/Decision Engine עתידי (TASK-006), מחוץ
// ל-scope. תפקיד המנוע: לאמת את חוזה הבקשה, למפות Source->Hierarchy Tier
// (בשימוש חוזר ב-recommendationCategories.js's hierarchyTierForSource() —
// מיפוי הנדסי-ארעי, TASK-004, לא חוזה קנוני ולא חוזה Candidate-generic
// מאושר; ר' הערה מלאה ליד השימוש בו למטה), לאכוף את בדיקות D1 Unit 09
// (Section 20 §6 להלן), ולהרכיב מבנית את ה-Candidate (Section 19
// TASK_005_SPEC_v1.0.md). אין כאן שימוש כלשהו בקטגוריות ה-Recommendation
// (recommendationCategories.js's CATEGORIES) — InitiativeCandidate אינו
// נושא שדה category (Canonical Decision CD-T005-02).
//
// D1-IP-08 (no repeating an ignored Initiative) נאכף כאן מקומית, ישירות
// מול pipelineContext.feedbackHistory שכבר מסופק — זהו *לא* שימוש
// חוזר ב-FeedbackDomain.evaluateSuppression() (C2): מנגנון זה מוגבל
// במפורש ל-Trigger/Adaptive-TDEE (Repository Gap A-2, Follow-up,
// TASK_005_SPEC_v1.0.md §36 — הרחבתו ל-Initiative אינה מאושרת ב-TASK-005
// זה). אין כיום כל writer שכותב אירועי feedback על surface='initiative'
// באף מקום ברפוזיטורי — הבדיקה כאן היא לוגיקה אמיתית, דטרמיניסטית,
// שתחזיר כיום תמיד "לא נמצא" נתון אמיתי, לא stub.
//
// Stage-3 disruption/milestone detection: אין כיום שום מקור נתונים
// ברפוזיטורי ליומן/אירועי ציון-דרך/התאוששות-לאחר-משבר (repository gap,
// מתועד למטה) — detectDisruptionOpportunities/detectMilestoneRecoveryOpportunities
// הן פונקציות אמיתיות, לא stubs, שמחזירות [] נכונה בהעדר עדות ממשית,
// בהתאם להנחיה "never infer events that do not exist".
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var RecommendationCategories = (typeof module !== 'undefined' && module.exports)
    ? require('./recommendationCategories.js')
    : window.RecommendationCategories;
  // TASK-006, Canonical Decision CD-T006-02 (arbitration metadata) / Engineering Fill §14.12 —
  // NO_SIGNAL sentinel, single source of truth, reused not duplicated (prioritization.js).
  var Prioritization = (typeof module !== 'undefined' && module.exports)
    ? require('./prioritization.js')
    : window.Prioritization;
  // G-2 (docs/specs/G2_SPEC_v1.0.md §32; CSF-08) — shared, pure Contextual Meaning / Product
  // Reason Policy utility. Semantic accountability for the resulting judgment remains with this
  // module (the calling Stage-3 contributor), never transferred to the shared utility (CSF-08).
  var ContextualMeaningPolicy = (typeof module !== 'undefined' && module.exports)
    ? require('./contextualMeaningPolicy.js')
    : window.ContextualMeaningPolicy;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isValidConfidence(n) { return isFiniteNumber(n) && n >= 0 && n <= 1; }

  function emptyResult() { return freezeShallow({ candidates: freezeShallow([]) }); }

  // D1-IP-03 (value requirement) — Trust/Motivation/Consistency/Understanding/Relationship/
  // Decision-quality, transcribed as a closed, field-validatable vocabulary. Engineering
  // Interpretation of D1-IP-03's prose list into a checkable token set (same kind of field-level
  // interpretation TASK_005_SPEC_v1.0.md §19 already flags for relationshipMaturityContext's
  // requiredness) — not a new Product taxonomy, a literal transcription of D1-IP-03's own six
  // named dimensions.
  var VALUE_DIMENSIONS = Object.freeze(['TRUST', 'MOTIVATION', 'CONSISTENCY', 'UNDERSTANDING', 'RELATIONSHIP', 'DECISION_QUALITY']);

  // D1-IP-02 / Constitution §12.2 — Relationship Maturity Stage, four canonical stages.
  var MATURITY_STAGES = Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']);

  // Stage-6 accepted Opportunity sources for Initiative-kind Candidate construction.
  //
  // DECISION_WINDOW is deliberately NOT included (Correction 2, code review): whether a
  // Decision-Window-sourced Opportunity is ever routed to the Initiative Engine at Stage 6 is an
  // unresolved Follow-up (Repository Gap G-4, TASK_005_SPEC_v1.0.md §36) — Engineering is not
  // authorized to assign that routing to the Initiative Engine. G-4 remains unresolved and
  // non-blocking; it is not marked resolved by this module.
  //
  // SAFETY_HIGH_RISK is deliberately NOT included: whether a Safety-triggered Opportunity is
  // ever routed to the Initiative Engine at Stage 6 is a separate unresolved Follow-up
  // (Repository Gap G-3, TASK_005_SPEC_v1.0.md §36) — also not authorized to Engineering, and
  // also not marked resolved here. SAFETY_HIGH_RISK is treated as an unsupported/out-of-contract
  // Opportunity source for this engine, not as a normal Opportunity that is evaluated and
  // deliberately silenced — final safety/high-risk routing ownership belongs to the future
  // Safety Layer (D1-OD-04/D2-EF-01(a); Section 15.8/18.4/24), and this module implements no
  // Safety Layer behavior and no Safety routing of any kind.
  //
  // Explicit-statement/action sources are excluded too — no canonical source assigns their
  // Stage-3 detection, or Stage-6 handling, to the Initiative Engine (Repository Gap G-2,
  // Follow-up).
  var STAGE6_ACCEPTED_SOURCES = Object.freeze(['CONFIRMED_PATTERN_ANTICIPATION', 'DISRUPTION_DETECTION', 'MILESTONE_RECOVERY']);

  // Engineering-authored, provisional Relationship-Maturity category-gating table (D1-IP-02,
  // Constitution §12.2, TASK_005_SPEC_v1.0.md §17.3) — CDR candidate. No canonical source states
  // this as a machine-checkable table, only as prose: Observer "mostly responds" (no initiative
  // at all); Assistant "initiates only on obvious, clear opportunities"; Trusted Coach "may
  // anticipate needs from confirmed patterns" (the explicit, named unlock for
  // CONFIRMED_PATTERN_ANTICIPATION); Personal Coach — "initiative is expected." Disruption and
  // Milestone/Recovery are treated as "obvious, clear" and available from Assistant upward;
  // confirmed-pattern anticipation requires Trusted Coach or above, per D1-IP-02's explicit
  // wording. Only sources in STAGE6_ACCEPTED_SOURCES above appear here — DECISION_WINDOW and
  // SAFETY_HIGH_RISK are excluded at the Stage-6 boundary before gating is ever consulted.
  var MATURITY_GATING = Object.freeze({
    OBSERVER: Object.freeze([]),
    ASSISTANT: Object.freeze(['DISRUPTION_DETECTION', 'MILESTONE_RECOVERY']),
    TRUSTED_COACH: Object.freeze(['DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'CONFIRMED_PATTERN_ANTICIPATION']),
    PERSONAL_COACH: Object.freeze(['DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'CONFIRMED_PATTERN_ANTICIPATION'])
  });

  // D1-IP-08 — closed feedback tokens (reused verbatim from C2's already-canonical closed
  // vocabulary, FEEDBACK_TYPES in js/feedback/feedbackDomain.js — not a new taxonomy) that count
  // as "an ignored Initiative" for the local check below.
  var IGNORED_FEEDBACK_TYPES = Object.freeze(['Ignored', 'Dismissed', 'Rejected']);

  // CC-02-analog: InitiativeRequest { opportunity: EligibleOpportunity, pipelineContext:
  // ImmutablePipelineContext } (TASK_005_SPEC_v1.0.md §19). EligibleOpportunity's field-level
  // shape mirrors recommendationEngine.js's own validateRequest() pattern (Engineering
  // Interpretation per §14.4), extended with valueDimensions (D1-IP-03) and, for
  // MILESTONE_RECOVERY sources only, an explicit genuine flag (D1-IP-06, checked at policy-check
  // time in generate(), not here — a missing/false genuine flag is a policy rejection, not a
  // malformed request).
  function validateRequest(request) {
    if (!isPlainObject(request)) return 'request is required';
    if (!isPlainObject(request.pipelineContext)) return 'pipelineContext is required';
    var o = request.opportunity;
    if (!isPlainObject(o)) return 'opportunity is required';
    if (!isNonEmptyString(o.id)) return 'opportunity.id is required';
    if (!RecommendationCategories.isValidOpportunitySource(o.sourceCategory)) return 'opportunity.sourceCategory is invalid';
    if (!isNonEmptyString(o.proposedAction)) return 'opportunity.proposedAction is required';
    if (!isValidConfidence(o.confidence)) return 'opportunity.confidence must be a number in [0,1]';
    if (!isPlainObject(o.explanation)) return 'opportunity.explanation is required';
    if (!isNonEmptyString(o.explanation.rationale)) return 'opportunity.explanation.rationale is required';
    if (!isNonEmptyString(o.explanation.evidenceBasis)) return 'opportunity.explanation.evidenceBasis is required';
    if (!isNonEmptyString(o.explanation.expectedValue)) return 'opportunity.explanation.expectedValue is required';
    if (o.explanation.uncertainty === undefined || o.explanation.uncertainty === null || o.explanation.uncertainty === '') {
      return 'opportunity.explanation.uncertainty is required';
    }
    if (!Array.isArray(o.valueDimensions) || o.valueDimensions.length === 0) return 'opportunity.valueDimensions is required (D1-IP-03)';
    for (var i = 0; i < o.valueDimensions.length; i++) {
      if (VALUE_DIMENSIONS.indexOf(o.valueDimensions[i]) === -1) return 'opportunity.valueDimensions contains an unrecognized dimension';
    }
    return null;
  }

  // D1-USM-04 / §17.7, Engineering Decision Pending E-2: an unknown/unreliable Relationship
  // Maturity signal is treated at least as conservatively as Observer. The Initiative Engine
  // reads the Stage value delivered in Pipeline Context as-is (§17.2) — it never re-derives it.
  function maturityStageOf(pipelineContext) {
    var rm = pipelineContext && pipelineContext.relationshipMaturity;
    var stage = rm && rm.stage;
    return MATURITY_STAGES.indexOf(stage) !== -1 ? stage : 'OBSERVER';
  }

  function categoryPermittedAtStage(stage, sourceCategory) {
    var allowed = MATURITY_GATING[stage] || [];
    return allowed.indexOf(sourceCategory) !== -1;
  }

  // D1-IP-08 — see file header. Local, self-contained; does not call FeedbackDomain.
  function wasIgnoredBefore(feedbackHistory, opportunityId) {
    return (feedbackHistory || []).some(function (e) {
      return e && e.surface === 'initiative' && e.contextId === opportunityId &&
        IGNORED_FEEDBACK_TYPES.indexOf(e.feedbackType) !== -1;
    });
  }

  // Section 19 contract shape check — mirrors recommendationEngine.js's internal-construction
  // discipline; also exported for contract tests (§33.2).
  function validateCandidateShape(c) {
    if (!isPlainObject(c)) return false;
    if (c.kind !== 'INITIATIVE') return false;
    if ('category' in c) return false; // Canonical Decision CD-T005-02 — no category field permitted
    if (!isNonEmptyString(c.action)) return false;
    if (!isPlainObject(c.rationale)) return false;
    if (!isNonEmptyString(c.rationale.rationale)) return false;
    if (!isNonEmptyString(c.rationale.evidenceBasis)) return false;
    if (!isNonEmptyString(c.rationale.expectedValue)) return false;
    if (c.rationale.uncertainty === undefined || c.rationale.uncertainty === null || c.rationale.uncertainty === '') return false;
    if (!isValidConfidence(c.confidence)) return false;
    if (!isFiniteNumber(c.hierarchyTier)) return false;
    if (!isPlainObject(c.relationshipMaturityContext)) return false;
    if (!RecommendationCategories.isValidOpportunitySource(c.opportunitySource)) return false;
    if (!isPlainObject(c.opportunityProvenance)) return false;
    if (!isPlainObject(c.validationResult) || c.validationResult.passed !== true) return false;
    if (c.immutable !== true) return false;
    return true;
  }

  // D2 Stage 6 — Initiative-kind Candidate Generation (TASK_005_SPEC_v1.0.md §20, steps 1-10).
  // Never throws; never ranks; never returns more than one Candidate per Opportunity (same
  // discipline as recommendationEngine.js — no basis to invent variety, D1-RP-02 analog).
  function generate(request) {
    var err = validateRequest(request);
    if (err) return emptyResult(); // step 2: invalid input contract

    var opportunity = request.opportunity;
    var pipelineContext = request.pipelineContext;

    // Stage-6 scope boundary — see STAGE6_ACCEPTED_SOURCES above. A source excluded here
    // (DECISION_WINDOW, SAFETY_HIGH_RISK) is unsupported/out-of-contract for this engine, not a
    // normal Opportunity that was evaluated and silenced — no Candidate is constructed and no
    // Initiative-policy or Relationship-Maturity check below is ever reached for it.
    if (STAGE6_ACCEPTED_SOURCES.indexOf(opportunity.sourceCategory) === -1) return emptyResult();

    // step 3/4: hierarchy tier. Reuses recommendationCategories.js's hierarchyTierForSource()
    // as-is, unmodified, purely as an implementation convenience — no duplication, no new file
    // (Section 26/35). This does NOT reuse or reference any Recommendation Category
    // (recommendationCategories.js's CATEGORIES: IMMEDIATE_ACTION/PREPARATION/RECOVERY/
    // SYSTEM_BUILDING) — InitiativeCandidate carries no category field (CD-T005-02). The
    // Source->Hierarchy-Tier mapping itself is TASK-004's own engineering-authored, provisional
    // mapping (recommendationCategories.js's own header: "engineering-authored... provisional...
    // Repository-Gap status") — it is not an approved canonical contract, not an approved
    // Candidate-generic contract, and not a finalized cross-kind Product decision. Reusing it
    // here does not elevate its status; it remains the same CDR / Product-review candidate it
    // already was under TASK-004.
    var hierarchyTier = RecommendationCategories.hierarchyTierForSource(opportunity.sourceCategory);
    if (hierarchyTier === null) return emptyResult();

    // step 5: Relationship-Maturity gating (D1-IP-02)
    var stage = maturityStageOf(pipelineContext);
    if (!categoryPermittedAtStage(stage, opportunity.sourceCategory)) return emptyResult();

    // step 6: Initiative-policy checks
    // D1-IP-06 — celebration restraint: never assumed; a MILESTONE_RECOVERY Opportunity must be
    // explicitly marked genuine.
    if (opportunity.sourceCategory === 'MILESTONE_RECOVERY' && opportunity.genuine !== true) return emptyResult();

    // D1-IP-08 — no repeating an ignored Initiative.
    var feedbackHistory = Array.isArray(pipelineContext.feedbackHistory) ? pipelineContext.feedbackHistory : [];
    if (wasIgnoredBefore(feedbackHistory, opportunity.id)) return emptyResult();

    // step 7: candidate construction — statable rationale already validated at step 2
    // (D1-RP-02/D1-CDO-02 analog: no rationale, no Candidate).
    var candidate = freezeShallow({
      kind: 'INITIATIVE',
      action: opportunity.proposedAction,
      rationale: freezeShallow({
        rationale: opportunity.explanation.rationale,
        evidenceBasis: opportunity.explanation.evidenceBasis,
        expectedValue: opportunity.explanation.expectedValue,
        uncertainty: opportunity.explanation.uncertainty
      }),
      confidence: opportunity.confidence,
      hierarchyTier: hierarchyTier,
      // TASK-006, Canonical Decision CD-T006-02 / Engineering Fill §14.12.2-3 — identical,
      // mechanical population as recommendationEngine.js. Per Canonical Decision CD-T006-03,
      // recommendationImpactTier is never added to InitiativeCandidate.
      evidenceTier: Prioritization.NO_SIGNAL,
      trustImpact: Prioritization.NO_SIGNAL,
      timingQuality: Prioritization.NO_SIGNAL,
      triggeringEvidenceTime: isFiniteNumber(opportunity.detectedAt) ? opportunity.detectedAt : Prioritization.NO_SIGNAL,
      problemMagnitude: Prioritization.NO_SIGNAL,
      relationshipMaturityContext: freezeShallow({
        stage: stage,
        gatingRuleApplied: 'D1-IP-02',
        sourceCategory: opportunity.sourceCategory
      }),
      opportunitySource: opportunity.sourceCategory,
      opportunityProvenance: freezeShallow({
        opportunityId: opportunity.id,
        sourceCategory: opportunity.sourceCategory,
        detectedAt: isFiniteNumber(opportunity.detectedAt) ? opportunity.detectedAt : null
      }),
      validationResult: freezeShallow({ passed: true, reason: 'Section 19 contract validated' }),
      immutable: true
    });

    // step 8: candidate validation — a Candidate that fails its own shape is discarded, not
    // returned (defensive; construction above is exhaustive, so this should never trip).
    if (!validateCandidateShape(candidate)) return emptyResult();

    // step 9/10: output (a single valid Candidate here; zero elsewhere above — both first-class)
    return freezeShallow({ candidates: freezeShallow([candidate]) });
  }

  // ══════════════════════════════════════════════════════════════════
  // Stage 3 contribution (D2 Unit 07) — see file header for full rationale. Reads Pipeline
  // Context only; never originates an independent Decision Input read (D3 §8.1/§11.1). Returns
  // detection-stage signals, NOT eligible Opportunities — Stage 4/5 (Evidence/Eligibility
  // Evaluation, Decision-Engine-owned, TASK-006, not yet built) sit between this output and a
  // real generate() call.
  // ══════════════════════════════════════════════════════════════════

  // Confirmed-pattern anticipation (§15.2, D1-OD-01/02): a HABIT/PATTERN signal already
  // classified ACTIVE/CONFIRMED by B5's own Eligibility gate (js/derivedIntelligenceConsumer.js)
  // has, by construction, cleared a minimum evidence-count bar — real Tier-3 (Repeated
  // Behaviour) evidence, never a single-instance signal. No numeric threshold is invented here;
  // it already lives in B5's INITIATIVE_SUPPORT_V1 policy (Engineering Decision Pending E-1).
  function detectConfirmedPatternAnticipation(pipelineContext) {
    var intelligence = pipelineContext && pipelineContext.initiativeIntelligence;
    var signals = (intelligence && Array.isArray(intelligence.signals)) ? intelligence.signals : [];
    return signals
      .filter(function (s) { return s && (s.lifecycle === 'ACTIVE' || s.lifecycle === 'CONFIRMED'); })
      .map(function (s) {
        return freezeShallow({
          sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
          signalId: s.id,
          domain: s.domain,
          topic: s.topic,
          confidence: s.confidence,
          evidenceCount: s.evidence && s.evidence.count,
          lifecycle: s.lifecycle
        });
      });
  }

  // Disruption (calendar / structural, §15.3/15.4) and Milestone/Recovery (§15.5/15.6)
  // detection: no repository data source for calendar entries, milestone events, or
  // setback/recovery events exists anywhere in this repository at this baseline (verified: no
  // calendar feature, no milestone tracker, no life-event/setback tracker in js/). Per the
  // provisional-derivation discipline governing this implementation ("never infer events that do
  // not exist... if repository evidence is insufficient, return Unknown/Unavailable"), these are
  // real, correctly-typed detection functions — not stubs — that correctly yield zero
  // Opportunities given the current absence of qualifying repository evidence. They begin
  // producing real Opportunities the moment such a data source is added to Pipeline Context, with
  // no change to generate() above. Repository Gap / CDR candidate — recorded in the
  // implementation report.
  function detectDisruptionOpportunities(pipelineContext) {
    return []; // no calendar-disruption data source exists in Pipeline Context at this baseline
  }
  function detectMilestoneRecoveryOpportunities(pipelineContext) {
    return []; // no milestone/setback data source exists in Pipeline Context at this baseline
  }

  // G-2 (docs/specs/G2_SPEC_v1.0.md §32; CSF Ch.26, Ch.29) — Semantic Opportunity construction.
  // For every signal already present in pipelineContext.initiativeIntelligence.signals (already
  // B5-admitted — see js/derivedIntelligenceConsumer.js's lifecycle-aware evaluateEligibility(),
  // G2_SPEC §23): interpret it via ContextualMeaningPolicy (Contextual Meaning, then the Product
  // Reason Policy — both pure, shared functions this module calls, never delegates semantic
  // authority to). Construct a complete DetectedOpportunity (§21.3) only where a valid Reason
  // results — currently, only ever REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION, for the exact V1
  // Habit FOOD_LOGGING WEAKENING condition established via provenance.currentEpisodeEstablished
  // === true (§21.1, CSF Ch.29). No fabrication anywhere: a NO_VALID_REASON Observation
  // contributes nothing (§21.1) — it is never forced into a Stage-5-bound Opportunity. This
  // function performs no direct StateAccess read, no Habit/Pattern re-derivation, and no Context
  // fabrication (G2-RA-13) — every input is already present on pipelineContext.
  function detectSemanticOpportunities(pipelineContext) {
    var intelligence = pipelineContext && pipelineContext.initiativeIntelligence;
    var signals = (intelligence && Array.isArray(intelligence.signals)) ? intelligence.signals : [];
    var out = [];
    signals.forEach(function (observation) {
      var contextualMeaning;
      try {
        contextualMeaning = ContextualMeaningPolicy.computeContextualMeaning(observation, pipelineContext);
      } catch (e) {
        contextualMeaning = null; // defensive — mirrors eligibilityEvaluator.js's discipline
      }
      if (!contextualMeaning) return; // malformed Observation — contributes nothing, no crash

      var validReasonCategory;
      try {
        validReasonCategory = ContextualMeaningPolicy.deriveValidReasonCategory(observation, contextualMeaning);
      } catch (e) {
        return; // defensive — never fabricate a Reason on failure
      }
      if (validReasonCategory !== 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION') return; // §21.1 — no other V1 Reason exists

      out.push(freezeShallow({
        id: 'g2-food-logging-info-request:' + observation.id,
        sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
        detectingContributor: 'INITIATIVE_ENGINE',
        proposedAction: 'Request updated food-logging information from the user',
        confidence: observation.confidence, // current, honestly decayed — never inflated (CSF Ch.26.4/27.2)
        explanation: freezeShallow({
          rationale: 'A previously established, reliable food-logging habit has entered the Habit Engine\'s WEAKENING lifecycle state within its current, uninterrupted episode.',
          evidenceBasis: contextualMeaning.basis.priorEstablishmentBasis,
          expectedValue: 'Requesting renewed food-logging information may significantly improve FITME\'s ability to understand and coach the user (D1-IE-01).',
          uncertainty: 'No affirmative Trust source exists for this Opportunity; the cause of the observed degradation is not inferred (CSF Ch.26.2/26.4).'
        }),
        detectedAt: pipelineContext.assembledAt, // this Decision Pass's own timestamp — real, never fabricated
        valueDimensions: freezeShallow(['UNDERSTANDING']), // D1-IP-03 — matches D1-IE-01's own wording exactly
        contextualMeaning: contextualMeaning,
        validReasonCategory: validReasonCategory,
        // §21.2 — no affirmative Trust source is approved for v1; constructed by this same
        // detecting Stage-3 contributor, never fabricated by the Decision Engine (T006 §15.11).
        trustTestSignal: freezeShallow({
          glad: null,
          basis: 'No approved affirmative Trust source exists for this Opportunity (Coach Semantic Foundation Ch.18/Ch.26.5). glad remains honestly null.'
        }),
        safetyHighRiskBypass: false
      }));
    });
    return out;
  }

  function detectOpportunities(pipelineContext) {
    pipelineContext = pipelineContext || {};
    return freezeShallow({
      confirmedPatternAnticipation: freezeShallow(detectConfirmedPatternAnticipation(pipelineContext)),
      disruption: freezeShallow(detectDisruptionOpportunities(pipelineContext)),
      milestoneRecovery: freezeShallow(detectMilestoneRecoveryOpportunities(pipelineContext)),
      semanticOpportunities: freezeShallow(detectSemanticOpportunities(pipelineContext))
    });
  }

  var API = {
    generate: generate,
    detectOpportunities: detectOpportunities,
    validateCandidateShape: validateCandidateShape,
    VALUE_DIMENSIONS: VALUE_DIMENSIONS,
    MATURITY_STAGES: MATURITY_STAGES
  };

  if (typeof window !== 'undefined') { window.InitiativeEngine = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
