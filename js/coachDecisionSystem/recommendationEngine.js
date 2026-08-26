// ══════════════════════════════════════════════════════════════════
// FitMe — Recommendation Engine (TASK-004, D2 Stage 6 — Candidate Generation)
// אחריות בלעדית: generate(RecommendationRequest) -> RecommendationResult
// (CC-02/CC-03, TASK_004_SPEC_v1.0.md § Canonical Contracts, Stages 3-4).
// internal collaborator בלבד בתוך ה-Composite Engine היחיד (D3 §17 Decision
// 1) — אינו נרשם באופן עצמאי ב-EngineRegistry (CC-05). פונקציה טהורה,
// דטרמיניסטית: אותו Input מחזיר אותו Candidate Set (Ranking Framework,
// Required Tests). אינה מדרגת, אינה מחשבת Priority Score, אינה בוחרת
// Winner, אינה מבצעת Tie Breaking (Ranking Policy, Canonical Decision
// Stage 5 — כל אלה בלעדית ל-Decision Engine העתידי, TASK-006).
//
// חשוב: אין כאן שום ייצור תוכן-קואצ'ינג (recommendation copy) — לא קיים
// מקור קנוני כלשהו (Product Bible / Coach Bible / Knowledge Base) שמגדיר
// אילו טקסטים ספציפיים יש להציע לכל סוג Opportunity, והמצאת כללים כאלה
// כאן היא "New coaching philosophy" (Out of Scope, אסור). לכן ה-
// EligibleOpportunity חייב לשאת כבר proposedAction+explanation מוכנים
// (מקורם — מנגנון Opportunity Detection/Decision Engine עתידי, מחוץ ל-scope
// של TASK-004 — ר' Repository Gaps בדוח היישום). תפקיד המנוע כאן: לאמת את
// חוזה הבקשה (CC-02), למפות Source->Category/Tier (דטרמיניסטי, ר'
// recommendationCategories.js), לבדוק דיכוי (C2, D1-RP-05 "no verbatim
// repetition"), לאכוף השלמות ההסבר (Explainability Policy, Stage 6 —
// Candidate שלא ניתן להסביר באמת אינו מוחזר), ולהרכיב מבנית את ה-Candidate
// (CC-03: kind/category/action/rationale/confidence/hierarchyTier/
// opportunityProvenance — בדיוק שבעת השדות הללו, ללא הוספה/גריעה).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var RecommendationCategories = (typeof module !== 'undefined' && module.exports)
    ? require('./recommendationCategories.js')
    : window.RecommendationCategories;
  var FeedbackDomain = (typeof module !== 'undefined' && module.exports)
    ? require('../feedback/feedbackDomain.js')
    : window.FeedbackDomain;
  // TASK-006, Canonical Decision CD-T006-02 (arbitration metadata) / Engineering Fill §14.12 —
  // NO_SIGNAL sentinel, single source of truth, reused not duplicated (prioritization.js).
  var Prioritization = (typeof module !== 'undefined' && module.exports)
    ? require('./prioritization.js')
    : window.Prioritization;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isValidConfidence(n) { return isFiniteNumber(n) && n >= 0 && n <= 1; }

  function emptyResult() { return freezeShallow({ candidates: freezeShallow([]) }); }

  // Stage-6 Ownership Enforcement Correction (Stage-6 Ownership Enforcement Review) — the closed
  // set of D1 Unit 05 Opportunity Sources this engine is canonically authorized to construct a
  // Candidate for at Stage 6, per D2 Unit 07 / TASK_005_SPEC_v1.0.md §9.1/§22's "Prohibition on
  // rule leakage": Recommendation Engine's own Stage-3 detection (below) is scoped exclusively to
  // DECISION_WINDOW (RG-1); CONFIRMED_PATTERN_ANTICIPATION/DISRUPTION_DETECTION/MILESTONE_RECOVERY
  // are Initiative-Engine-exclusive (TASK_005_SPEC_v1.0.md §9.1); SAFETY_HIGH_RISK is
  // Safety-Layer-owned and never enters ordinary Candidate Generation for either engine. This
  // mirrors js/coachDecisionSystem/initiativeEngine.js's own existing STAGE6_ACCEPTED_SOURCES
  // pattern exactly — enforcing an already-closed canonical assignment, not a new one. Ownership
  // is enforced here, at Candidate Generation, never repaired later at Stage 7/8 (no tie-break,
  // no Candidate-kind preference) — an unauthorized Candidate must never exist in the first place.
  var STAGE6_ACCEPTED_SOURCES = Object.freeze(['DECISION_WINDOW']);

  // CC-02: RecommendationRequest { opportunity: EligibleOpportunity, pipelineContext:
  // ImmutablePipelineContext }. EligibleOpportunity's field-level shape is not fixed by any
  // canonical source above the CC-02 contract itself — defined here as engineering detail
  // (Canonical Authority: "module structure... internal function boundaries" are Engineering's
  // authority), grounded in D2 Unit 04 Stage 6's stated Outputs ("kind, content, a statable
  // rationale, confidence, and Canonical Decision Hierarchy tier") and D1-RP-02/D1-RP-03
  // (mandatory, real-constraint-grounded rationale).
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
    return null;
  }

  // D2 Stage 6 — Candidate Generation. Never throws (Failure Handling: contract violation ->
  // withhold, not a thrown error); never ranks; never returns more than one Candidate per
  // Opportunity (this engine has no basis to invent multiple distinct actions from one
  // already-supplied proposedAction without fabricating variety — D1-RP-02).
  function generate(request) {
    var err = validateRequest(request);
    if (err) return emptyResult(); // CC-02 contract violation (Failure Handling table)

    var opportunity = request.opportunity;
    var pipelineContext = request.pipelineContext;

    // Stage-6 ownership boundary — checked first, before any classification is used to construct
    // a Candidate. A source this engine does not canonically own (Initiative-exclusive,
    // Safety-owned, or otherwise unrecognized) yields empty, never a fabricated fallback.
    if (STAGE6_ACCEPTED_SOURCES.indexOf(opportunity.sourceCategory) === -1) return emptyResult();

    var category = RecommendationCategories.categoryForSource(opportunity.sourceCategory);
    var hierarchyTier = RecommendationCategories.hierarchyTierForSource(opportunity.sourceCategory);
    if (!category || hierarchyTier === null) return emptyResult();

    // D1-RP-05 (no verbatim repetition of a multiply-declined recommendation) / C2: suppression
    // is always recomputed fresh from feedback history, never a stored flag.
    var feedbackHistory = Array.isArray(pipelineContext.feedbackHistory) ? pipelineContext.feedbackHistory : [];
    var suppression = FeedbackDomain.evaluateSuppression(feedbackHistory, 'recommendation', opportunity.id, Date.now());
    if (suppression.suppressed) return emptyResult();

    var candidate = freezeShallow({
      kind: 'Recommendation',
      category: category,
      action: opportunity.proposedAction,
      // Stage 6 Explainability Policy (Canonical Decision Stage 6): the structured Decision
      // Truth occupies CC-03's `rationale` field slot (no new field is added to the Candidate).
      rationale: freezeShallow({
        rationale: opportunity.explanation.rationale,
        evidenceBasis: opportunity.explanation.evidenceBasis,
        expectedValue: opportunity.explanation.expectedValue,
        uncertainty: opportunity.explanation.uncertainty
      }),
      confidence: opportunity.confidence,
      hierarchyTier: hierarchyTier,
      // TASK-006, Canonical Decision CD-T006-02 / Engineering Fill §14.12.2-3 — fixed, mechanical,
      // non-judgmental arbitration-metadata population, consumed by Stage 7 (prioritization.js).
      // triggeringEvidenceTime carries forward the Opportunity's own already-existing detectedAt
      // value unchanged; every other field has no classification source in the current repository
      // baseline and is set to the literal NO_SIGNAL sentinel — never a fabricated value.
      evidenceTier: Prioritization.NO_SIGNAL,
      trustImpact: Prioritization.NO_SIGNAL,
      timingQuality: Prioritization.NO_SIGNAL,
      triggeringEvidenceTime: isFiniteNumber(opportunity.detectedAt) ? opportunity.detectedAt : Prioritization.NO_SIGNAL,
      problemMagnitude: Prioritization.NO_SIGNAL,
      recommendationImpactTier: Prioritization.NO_SIGNAL,
      opportunityProvenance: freezeShallow({
        opportunityId: opportunity.id,
        sourceCategory: opportunity.sourceCategory,
        detectedAt: isFiniteNumber(opportunity.detectedAt) ? opportunity.detectedAt : null
      })
    });

    return freezeShallow({ candidates: freezeShallow([candidate]) });
  }

  // ══════════════════════════════════════════════════════════════════
  // Stage 3 contribution (D2 Unit 04 Stage 3; G2_SPEC §17.1, G2-RA-14 corrected wording) — a
  // real, correctly-typed, honestly-empty detector. Its Stage-3 responsibility is to determine
  // whether current approved evidence/context supports carrying forward a DECISION_WINDOW-sourced
  // Opportunity. No canonical source defines the concrete detection algorithm or threshold — this
  // is Repository Gap RG-1 (docs/specs/G2_SPEC_v1.0.md §44), explicitly non-blocking per
  // G2-RA-19's per-contributor allowance for an honest, permanently-empty detector (CSF Ch.13, row
  // 13.2: "Blocked on a separate Repository Gap, not this Package"). This function does not
  // fabricate a Recommendation Opportunity, does not solve RG-1, and does not invent a
  // Decision-Window-closing algorithm — it returns [] unconditionally until RG-1 is separately
  // resolved by a future, dedicated decision. Never throws; never reads StateAccess directly
  // (reads only the already-assembled Pipeline Context, D3 §8.1/§11.1).
  function detectOpportunities(pipelineContext) {
    return freezeShallow([]);
  }

  var API = { generate: generate, detectOpportunities: detectOpportunities };

  if (typeof window !== 'undefined') { window.RecommendationEngine = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
