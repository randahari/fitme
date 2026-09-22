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
// מול pipelineContext.feedbackHistory שכבר מסופק — פונקציית ה-C2 המקבילה
// (matching מדויק surface+contextId) אינה נקראת כאן כלל; wasIgnoredBefore()
// עצמאית לחלוטין, ללא תלות ב-FeedbackDomain. RGEF WP7 (ראה
// domainTopicRecentlyUnwelcome() למטה) מוסיף בנפרד, באופן תחום ומאושר
// במפורש (Repository Gap A-2, TASK_005_SPEC_v1.0.md §36 — resolution
// RGEF_SPEC_v1.0.md §5.4/§19.1), תלות יחידה ומצומצמת ב-FeedbackDomain
// לצורך יכולת ה-Domain/Topic receptiveness בלבד — לא הרחבה גורפת.
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
  // RGEF WP7 (RGEF_SPEC_v1.0.md §5.4/§19.1) — Architecture Decision, narrow resolution of
  // TASK-005 §36 Repository Gap A-2: this module's first-ever dependency on feedbackDomain.js,
  // authorized EXCLUSIVELY for evaluateDomainTopicReceptiveness() (Domain/Topic learned
  // receptiveness, Stage 6 consumption, below). No other FeedbackDomain capability is consumed —
  // evaluateSuppression()/classifyFeedback() remain Trigger/Adaptive-TDEE-exclusive.
  // wasIgnoredBefore() (D1-IP-08, exact-Opportunity-id) is NOT affected by this dependency — it
  // remains local, self-contained, and untouched, per the approved boundary of this resolution.
  var FeedbackDomain = (typeof module !== 'undefined' && module.exports)
    ? require('../feedback/feedbackDomain.js')
    : window.FeedbackDomain;
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §18) — the shared, deterministic activity-identity
  // normalization module (js/domain, sibling in kind to activityIdentityVocabulary.js), reused
  // here ONLY by activityOpposedAgainst() below to resolve the shared semantic activity reference
  // (TDP Ch.11.I) between an explicit-opposition record and a proposed Candidate's own
  // activityReference — never to construct actionIdentity itself, which remains
  // internalPipelineOrchestrator.js's/resolveTrainingReadinessProposal()'s own responsibility.
  var ActivityReferenceNormalizer = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/activityReferenceNormalizer.js')
    : window.ActivityReferenceNormalizer;
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §25) — MAI-001's own closed, unmodified vocabulary
  // module, reused here only for validateCandidateShape()'s own defensive actionIdentity shape
  // check (isValidActionIdentity()) — never to construct or normalize actionIdentity, which
  // remains resolveTrainingReadinessProposal()'s own exclusive responsibility.
  var ActivityIdentityVocabulary = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/activityIdentityVocabulary.js')
    : window.ActivityIdentityVocabulary;

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
  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §07/§10) — DIRECT_USER_REQUEST added: this Stage-6
  // ownership boundary is checked (line ~354, generate()) BEFORE SOURCE_REASON_MATURITY_OVERRIDES/
  // categoryPermittedAtStage() below are ever consulted — without this entry, every
  // DIRECT_USER_REQUEST-sourced EligibleOpportunity would return emptyResult() here regardless of
  // Eligibility having already admitted it at Stage 5, and the SPEC's own §10 "existing,
  // unmodified reasoning-invocation branch" could never actually be reached in practice.
  // Mechanically necessary for the SPEC's own §20 dogfood path; never grants RecommendationEngine
  // (recommendationEngine.js's own, separate STAGE6_ACCEPTED_SOURCES) any new source — that list
  // is untouched, so RecommendationEngine still never produces a DIRECT_USER_REQUEST Candidate,
  // preserving Initiative-Engine-exclusive ownership exactly as this file's own header already
  // establishes for CONFIRMED_PATTERN_ANTICIPATION.
  var STAGE6_ACCEPTED_SOURCES = Object.freeze(['CONFIRMED_PATTERN_ANTICIPATION', 'DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'DIRECT_USER_REQUEST']);

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

  // RGEF WP4 (RGEF_SPEC_v1.0.md §13) — closed Source×Reason maturity-gating override, evolving
  // the one-dimensional table above without changing it. Contained EXACTLY one entry at RGEF's own
  // authoring time (RGEF §13.2, mandatory scope discipline): CONFIRMED_PATTERN_ANTICIPATION ×
  // REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION, permitted at every Relationship Maturity Stage
  // including Observer/Assistant — resolving TASK-005 §36 item E-2 for this one specific
  // combination. TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §26; TDP Ch.05 Concept E) adds exactly
  // one new, second entry: CONFIRMED_PATTERN_ANTICIPATION × ADAPT_TO_CURRENT_STATE, permitted at
  // every stage for the identical reason — the default MATURITY_GATING table would otherwise
  // silently block this bounded, Stage-5-gated Reason at Observer/Assistant even after Stage 5's
  // own Bounded Early-Relationship admission (RGEF's eligibilityEvaluator.js path) already permits
  // it, directly contradicting Decision 1's "early relationship does not mean silence" principle
  // (TDP Ch.05) — the exact same
  // resolution RGEF WP4 already applied to its own first bounded case, not a new precedent, a
  // second proof of the identical one. Every other (sourceCategory, validReasonCategory) pair
  // falls through to MATURITY_GATING[sourceCategory] above, unmodified. A third entry SHALL NOT be
  // added without a new, explicit Product/Architecture decision (RGEF §13.2).
  var SOURCE_REASON_MATURITY_OVERRIDES = Object.freeze({
    CONFIRMED_PATTERN_ANTICIPATION: Object.freeze({
      REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION: Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']),
      ADAPT_TO_CURRENT_STATE: Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'])
    }),
    // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §08) — new top-level source key. A legitimate direct
    // user request must be serviceable from the earliest relationship stage — the user initiated
    // this interaction, unlike proactive Initiative. All four stages permitted, mirroring TRR-001's
    // own identical all-stages entry above.
    DIRECT_USER_REQUEST: Object.freeze({
      ADAPT_TO_CURRENT_STATE: Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'])
    })
  });

  // DUC-001 Post-Implementation Turn-Serving Correction (Product/Architecture-approved, Decision
  // 2/3, frozen this turn) — a narrow, closed Source×Reason hierarchy-tier override, structurally
  // identical in shape to SOURCE_REASON_MATURITY_OVERRIDES immediately above (the repository's own
  // existing precedent for exactly this [sourceCategory][validReasonCategory] -> value pattern).
  // `DIRECT_USER_REQUEST` describes WHY FITME is responding now (turn-causality) — it does NOT
  // universally define the professional hierarchy tier of every future conversational capability,
  // so no global, source-only DIRECT_USER_REQUEST entry exists in
  // RecommendationCategories.SOURCE_HIERARCHY_TIER_MAP any more (see recommendationCategories.js).
  // Only the one V1-live pair is authorized: DIRECT_USER_REQUEST x ADAPT_TO_CURRENT_STATE -> tier 5
  // (Context Relevance, the same tier DECISION_WINDOW/DISRUPTION_DETECTION already use) — the
  // narrowest expression of "this ONE reasoning gate, reused byte-identically from TRR-001 (§10),
  // happens to serve present context." A future, different Reason under DIRECT_USER_REQUEST is
  // deliberately NOT granted a tier here and falls through to
  // RecommendationCategories.hierarchyTierForSource() below, which returns null for
  // DIRECT_USER_REQUEST (no global assertion) — resolveHierarchyTier() below then also returns
  // null, exactly as it already does for any other genuinely-unmapped source, causing
  // InitiativeEngine.generate() to correctly return emptyResult() rather than inventing a tier. A
  // second entry SHALL NOT be added without a new, explicit Product/Architecture decision, mirroring
  // SOURCE_REASON_MATURITY_OVERRIDES's own identical discipline immediately above.
  var SOURCE_REASON_HIERARCHY_TIER_OVERRIDES = Object.freeze({
    DIRECT_USER_REQUEST: Object.freeze({
      ADAPT_TO_CURRENT_STATE: 5 // Context Relevance — see comment above
    })
  });

  // Consulted first; falls through to RecommendationCategories.hierarchyTierForSource(sourceCategory)
  // (the existing, byte-unchanged, source-only default every pre-DUC source still resolves through
  // exclusively) when no override entry matches this exact (sourceCategory, validReasonCategory)
  // pair. Mirrors categoryPermittedAtStage()'s own identical override-then-fallback precedence.
  function resolveHierarchyTier(sourceCategory, validReasonCategory) {
    var override = SOURCE_REASON_HIERARCHY_TIER_OVERRIDES[sourceCategory] &&
      SOURCE_REASON_HIERARCHY_TIER_OVERRIDES[sourceCategory][validReasonCategory];
    if (typeof override === 'number') return override;
    return RecommendationCategories.hierarchyTierForSource(sourceCategory);
  }

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

  // RGEF WP4 — gains validReasonCategory (optional third parameter, backward-compatible with
  // this function's single existing call site below, which now always supplies it). The override
  // table (above) is consulted first; if no override entry matches this exact (sourceCategory,
  // validReasonCategory) pair, the existing MATURITY_GATING[sourceCategory] default governs,
  // byte-identical to pre-RGEF behavior.
  function categoryPermittedAtStage(stage, sourceCategory, validReasonCategory) {
    // RGEF override is keyed [sourceCategory][validReasonCategory] -> array of allowed STAGES;
    // check membership of `stage` in that array. Absent an override, fall through to the
    // original, unmodified semantics: MATURITY_GATING is keyed by STAGE -> array of allowed
    // sourceCategory values; check membership of `sourceCategory` in that array.
    var override = SOURCE_REASON_MATURITY_OVERRIDES[sourceCategory] &&
      SOURCE_REASON_MATURITY_OVERRIDES[sourceCategory][validReasonCategory];
    if (override) return override.indexOf(stage) !== -1;
    var allowed = MATURITY_GATING[stage] || [];
    return allowed.indexOf(sourceCategory) !== -1;
  }

  // D1-IP-08 — see file header. Local, self-contained; does not call FeedbackDomain. Unaffected
  // by RGEF WP7's new dependency (below) — a wholly separate, additive check.
  function wasIgnoredBefore(feedbackHistory, opportunityId) {
    return (feedbackHistory || []).some(function (e) {
      return e && e.surface === 'initiative' && e.contextId === opportunityId &&
        IGNORED_FEEDBACK_TYPES.indexOf(e.feedbackType) !== -1;
    });
  }

  // RGEF WP7 (RGEF_SPEC_v1.0.md §19.1) — Stage-6 Domain/Topic learned-receptiveness consumption.
  // Additive to, and independent of, wasIgnoredBefore() above — either check alone is sufficient
  // to suppress. Reuses FeedbackDomain's own recompute-from-source algorithm and its named
  // recovery policy's values by reference only (never copied locally — no policy constant of any
  // kind is re-declared in this file). Missing domain/topic yields no suppression basis — never
  // fabricated.
  function domainTopicRecentlyUnwelcome(feedbackHistory, domain, topic, nowTs) {
    if (!domain || !topic) return false;
    var result = FeedbackDomain.evaluateDomainTopicReceptiveness(feedbackHistory, domain, topic, nowTs);
    return result.suppressed === true;
  }

  // EUR-001 (docs/specs/EUR_001_SPEC_v1.0.md §15) — Explicit Request direct-user control.
  // Additive to, independent of, and never a replacement for wasIgnoredBefore()/
  // domainTopicRecentlyUnwelcome() above; any one of the three checks alone is sufficient to
  // suppress. Unlike the other two (inferred reluctance), this one carries direct-user authority
  // (§5) — it is not threshold-gated and requires no repeated evidence. This function performs no
  // semantic interpretation of its own — every item it reads has already passed the full §10
  // conjunctive gate upstream, in the Memory Layer (js/coachDecisionSystem/memoryLayer.js); it
  // only matches already-resolved identifiers. This is a new, first-ever dependency of this
  // module on pipelineContext.explicitRequestControls — no dependency on feedbackDomain.js is
  // added or touched by this function, preserving RGEF's own separation (§17: inferred reluctance
  // vs. direct user control share only this enforcement boundary, never evidence/authority).
  function explicitlyRequestedAgainst(explicitRequestControls, domain, topic) {
    if (!domain || !topic || !explicitRequestControls) return false;
    var items = explicitRequestControls.items || [];
    return items.some(function (c) {
      return c.controlIntent === 'SUPPRESS_ORDINARY_INITIATIVE' && c.domain === domain && c.topic === topic;
    });
  }

  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §18; TDP Ch.11.J-B) — the deterministic
  // activity-specific explicit-opposition gate, structurally parallel to
  // explicitlyRequestedAgainst() above but resolving its own "scope" dimension against the shared
  // semantic activity reference (TDP Ch.11.I) instead of Domain/Topic. Additive to, independent
  // of, and never a replacement for any of the three suppression checks above — any one of the
  // four is sufficient to suppress. Applied only to PHYSICAL_ACTIVITY proposals (checked by the
  // caller, below) — activityReference is undefined for every other Candidate kind.
  function activityOpposedAgainst(activityOppositionControls, activityReference) {
    if (!activityReference || !activityOppositionControls) return false;
    var items = activityOppositionControls.items || [];
    var normalizedRef = ActivityReferenceNormalizer.normalize(activityReference);
    return items.some(function (c) {
      var normalizedOpposed = ActivityReferenceNormalizer.normalize(c.opposedActivityText);
      // Match A — both sides normalize to the same known MAI-001 token (the shared semantic
      // activity reference, TDP Ch.11.I).
      if (normalizedRef && normalizedOpposed && normalizedRef === normalizedOpposed) return true;
      // Match B — exact literal (case/whitespace-insensitive) equality, covering open-ended
      // activities neither side normalizes (e.g. "Pilates" opposed against a "Pilates" proposal).
      return activityReference.trim().toLowerCase() === (c.opposedActivityText || '').trim().toLowerCase();
    });
  }

  // Section 19 contract shape check — mirrors recommendationEngine.js's internal-construction
  // discipline; also exported for contract tests (§33.2). TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md
  // §22, §25) additively extends this check with the corrected actionCategory/activityReference/
  // actionIdentity invariant (TDP Ch.09) — gated entirely behind c.actionCategory !== undefined, a
  // no-op for every existing, non-TR&R Candidate kind (undefined for all of them, exactly as
  // actionIdentity already is today).
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
    if (c.actionCategory !== undefined) {
      if (c.actionCategory !== 'PHYSICAL_ACTIVITY' && c.actionCategory !== 'NON_ACTIVITY_COACHING_ACTION') return false;
      if (c.actionCategory === 'PHYSICAL_ACTIVITY') {
        if (!isNonEmptyString(c.activityReference)) return false;
        if (c.actionIdentity !== undefined && !ActivityIdentityVocabulary.isValidActionIdentity(c.actionIdentity)) return false;
      } else {
        if (c.activityReference !== undefined || c.actionIdentity !== undefined) return false; // NON_ACTIVITY carries neither
      }
    }
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

    // step 3/4: hierarchy tier. Resolved via resolveHierarchyTier() above, which consults the
    // narrow SOURCE_REASON_HIERARCHY_TIER_OVERRIDES table first (DUC-001 Post-Implementation
    // Turn-Serving Correction, Decision 2/3) and falls through to
    // recommendationCategories.js's own hierarchyTierForSource(sourceCategory) — byte-unchanged
    // for every pre-DUC source, exactly as before this correction. This does NOT reuse or
    // reference any Recommendation Category (recommendationCategories.js's CATEGORIES:
    // IMMEDIATE_ACTION/PREPARATION/RECOVERY/SYSTEM_BUILDING) — InitiativeCandidate carries no
    // category field (CD-T005-02). The Source->Hierarchy-Tier mapping itself is TASK-004's own
    // engineering-authored, provisional mapping (recommendationCategories.js's own header:
    // "engineering-authored... provisional... Repository-Gap status") — it is not an approved
    // canonical contract, not an approved Candidate-generic contract, and not a finalized
    // cross-kind Product decision. Reusing it here does not elevate its status; it remains the
    // same CDR / Product-review candidate it already was under TASK-004.
    var hierarchyTier = resolveHierarchyTier(opportunity.sourceCategory, opportunity.validReasonCategory);
    if (hierarchyTier === null) return emptyResult();

    // step 5: Relationship-Maturity gating (D1-IP-02)
    var stage = maturityStageOf(pipelineContext);
    if (!categoryPermittedAtStage(stage, opportunity.sourceCategory, opportunity.validReasonCategory)) return emptyResult();

    // step 6: Initiative-policy checks
    // D1-IP-06 — celebration restraint: never assumed; a MILESTONE_RECOVERY Opportunity must be
    // explicitly marked genuine.
    if (opportunity.sourceCategory === 'MILESTONE_RECOVERY' && opportunity.genuine !== true) return emptyResult();

    // D1-IP-08 — no repeating an ignored Initiative.
    var feedbackHistory = Array.isArray(pipelineContext.feedbackHistory) ? pipelineContext.feedbackHistory : [];
    if (wasIgnoredBefore(feedbackHistory, opportunity.id)) return emptyResult();

    // RGEF WP7 (RGEF_SPEC_v1.0.md §19.1) — Domain/Topic learned-receptiveness. Additive to,
    // independent of, and never a replacement for wasIgnoredBefore() above; either check alone
    // is sufficient to suppress.
    if (domainTopicRecentlyUnwelcome(feedbackHistory, opportunity.domain, opportunity.topic, pipelineContext.assembledAt)) return emptyResult();

    // EUR-001 (docs/specs/EUR_001_SPEC_v1.0.md §15) — Explicit Request direct-user control.
    // Additive to, independent of, and never a replacement for either check above; any one of the
    // three is sufficient to suppress. Unlike the other two (inferred reluctance), this one
    // carries direct-user authority — it is not threshold-gated and requires no repeated evidence.
    if (explicitlyRequestedAgainst(pipelineContext.explicitRequestControls, opportunity.domain, opportunity.topic)) return emptyResult();

    // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §18, §25; TDP Ch.11.J-B) — deterministic
    // activity-specific explicit-opposition suppression, additive to, independent of, and never a
    // replacement for the three checks above; any one of the four is sufficient to suppress.
    // Applied only to PHYSICAL_ACTIVITY proposals — opportunity.actionCategory is undefined for
    // every non-TR&R Opportunity, so this branch never fires for them.
    if (opportunity.actionCategory === 'PHYSICAL_ACTIVITY'
      && activityOpposedAgainst(pipelineContext.activityOppositionControls, opportunity.activityReference)) {
      return emptyResult();
    }

    // step 7: candidate construction — statable rationale already validated at step 2
    // (D1-RP-02/D1-CDO-02 analog: no rationale, no Candidate).
    var candidate = freezeShallow(Object.assign({
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
      // RGEF WP5 (RGEF_SPEC_v1.0.md §16.1) — domain/topic added additively, reusing this exact
      // object's own already-proven, byte-identical survival path through Stage 7 (Prioritization,
      // rank() only reorders), Stage 8 (Winner Selection, returns the literal surviving Candidate),
      // and Stage 9 (Decision Formation, copied onto terminalDecision.candidateProvenance) —
      // verified directly, no new field is added anywhere else. Never fabricated: undefined if the
      // originating Opportunity (WP2) never carried a domain/topic. TRR-001
      // (docs/specs/TRR_001_SPEC_v1.0.md §32; TDP Ch.13 item 11) additively appends sameNeedId —
      // the CARF Ch.10 same-Need identity placeholder, undefined-safe for every non-TR&R caller.
      opportunityProvenance: freezeShallow({
        opportunityId: opportunity.id,
        sourceCategory: opportunity.sourceCategory,
        detectedAt: isFiniteNumber(opportunity.detectedAt) ? opportunity.detectedAt : null,
        domain: opportunity.domain,
        topic: opportunity.topic,
        // CARF Ch.10's own frozen requirement — a same-Need identity is present even for a
        // single-proposal V1, "so a second proposal is a strictly additive future change, never a
        // rewrite." Defaults to the originating Opportunity's own id when the Opportunity itself
        // does not carry one (every existing, non-TR&R Opportunity) — a real, stable value,
        // sufficient today (exactly one Candidate ever carries a given id) and forward-compatible.
        sameNeedId: opportunity.sameNeedId || opportunity.id,
        // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §14) — additive, undefined-safe for every
        // non-direct-user-request caller, mirroring sameNeedId's own precedent immediately above.
        // Real internal turn provenance, surviving through the identical Stage 7/8/9 path already
        // proven for domain/topic/sameNeedId.
        turnId: opportunity.turnId
      }),
      validationResult: freezeShallow({ passed: true, reason: 'Section 19 contract validated' }),
      immutable: true
    },
      // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §22-§25; TDP Ch.09) — actionCategory/
      // activityReference/actionIdentity, additive, sibling to each other, present only when the
      // originating opportunity itself carried them (undefined-safe for every non-TR&R caller —
      // Object.assign never sets a key for an `undefined`-valued spread source here since these
      // are only included at all when the opportunity itself carries the field).
      opportunity.actionCategory !== undefined ? { actionCategory: opportunity.actionCategory } : {},
      opportunity.activityReference !== undefined ? { activityReference: opportunity.activityReference } : {},
      opportunity.actionIdentity !== undefined ? { actionIdentity: opportunity.actionIdentity } : {},
      // WP0 Phase D.6 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §16) —
      // riskCharacteristicTags/safeAlternative/safeAlternativeCharacterization, additive, the SAME
      // undefined-safe threading pattern as the three TRR fields immediately above — sourced
      // exclusively from internalPipelineOrchestrator.js's own independent characterization step
      // (attachSafetyCharacterization()), never from this engine's own logic, and never from the
      // raw StandardProposal a reasoning capability returned. Undefined-safe for every existing,
      // non-D.6 caller (every Opportunity's own opportunity.riskCharacteristicTags is undefined,
      // exactly as it is today).
      opportunity.riskCharacteristicTags !== undefined ? { riskCharacteristicTags: opportunity.riskCharacteristicTags } : {},
      opportunity.safeAlternative !== undefined ? { safeAlternative: opportunity.safeAlternative } : {},
      opportunity.safeAlternativeCharacterization !== undefined ? { safeAlternativeCharacterization: opportunity.safeAlternativeCharacterization } : {}
    ));

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
        // RGEF WP2 (RGEF_SPEC_v1.0.md §15.1) — additive Domain/Topic propagation, copied
        // unchanged from the same B5-derived observation this function already reads; never
        // fabricated. A future observation lacking these fields degrades honestly to
        // undefined — no classification is ever invented here.
        domain: observation.domain,
        topic: observation.topic,
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

  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §12; TDP Ch.13 item 3 — "collection-bucket fix") —
  // Training Readiness Opportunity construction. A new, sibling function, kept entirely separate
  // from detectSemanticOpportunities() above so the existing G-2 food-logging function remains
  // byte-identical (zero diff surface on the existing, closed FOOD_LOGGING path). For every signal
  // already present in pipelineContext.initiativeIntelligence.signals: interpret it via the same
  // shared ContextualMeaningPolicy utility, constructing a complete DetectedOpportunity only where
  // ADAPT_TO_CURRENT_STATE results (§11's own narrow Reason-Policy condition). The real proposal
  // content is NOT yet known at Stage 3 — TrainingReadinessReasoningComponent produces it, between
  // Stage 5 and Stage 6 (internalPipelineOrchestrator.js's own new invocation step, §19) — so
  // proposedAction here is a placeholder sentinel only, guaranteed by that orchestration change to
  // never reach a Stage-6 producer's generate() call intact (§12's own "Placeholder discipline").
  function detectTrainingReadinessOpportunities(pipelineContext) {
    var intelligence = pipelineContext && pipelineContext.initiativeIntelligence;
    var signals = (intelligence && Array.isArray(intelligence.signals)) ? intelligence.signals : [];
    var out = [];
    signals.forEach(function (observation) {
      var contextualMeaning;
      try {
        contextualMeaning = ContextualMeaningPolicy.computeContextualMeaning(observation, pipelineContext);
      } catch (e) {
        contextualMeaning = null;
      }
      if (!contextualMeaning) return;

      var validReasonCategory;
      try {
        validReasonCategory = ContextualMeaningPolicy.deriveValidReasonCategory(observation, contextualMeaning);
      } catch (e) {
        return;
      }
      if (validReasonCategory !== 'ADAPT_TO_CURRENT_STATE') return;

      out.push(freezeShallow({
        id: 'trr-adapt-to-current-state:' + observation.signalId,
        sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
        detectingContributor: 'INITIATIVE_ENGINE',
        // Placeholder only — never handed to a Stage-6 producer as-is. The real proposal is
        // produced by trainingReadinessReasoningComponent.js between Stage 5 and Stage 6 (§19);
        // this placeholder exists solely so this object's own shape matches every other
        // DetectedOpportunity's required-non-empty-string contract until the orchestrator
        // replaces it.
        proposedAction: '__TRR_PENDING_REASONING__',
        domain: observation.domain,
        topic: observation.topic,
        confidence: observation.confidence,
        explanation: freezeShallow({
          rationale: 'An established (ACTIVE/CONFIRMED) WORKOUT_FREQUENCY training pattern coincides ' +
            'with a real, available user-reported current-state signal this Decision Pass.',
          evidenceBasis: contextualMeaning.basis.priorEstablishmentBasis,
          expectedValue: 'Adapting today\'s training guidance to the user\'s current state may prevent an ' +
            'unnecessary setback or missed opportunity (D1-IE-01, ADAPT_TO_CURRENT_STATE — TDP Ch.05).',
          uncertainty: 'Whether adaptation is actually warranted, and what form it should take, is not ' +
            'determined at detection time — resolved only by bounded reasoning (TDP Ch.05, Ch.07).'
        }),
        detectedAt: pipelineContext.assembledAt,
        valueDimensions: freezeShallow(['DECISION_QUALITY']), // D1-IP-03 — the reasoning this Need triggers
        contextualMeaning: contextualMeaning,
        validReasonCategory: validReasonCategory,
        trustTestSignal: freezeShallow({
          glad: null,
          basis: 'No approved affirmative Trust source exists for this Opportunity (TDP Ch.05) — glad remains honestly null.'
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
      semanticOpportunities: freezeShallow(detectSemanticOpportunities(pipelineContext)),
      // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §12) — additive fourth bucket; the existing three
      // buckets' own construction is byte-identical, untouched.
      trainingReadinessOpportunities: freezeShallow(detectTrainingReadinessOpportunities(pipelineContext))
    });
  }

  var API = {
    generate: generate,
    detectOpportunities: detectOpportunities,
    validateCandidateShape: validateCandidateShape,
    activityOpposedAgainst: activityOpposedAgainst,
    VALUE_DIMENSIONS: VALUE_DIMENSIONS,
    MATURITY_STAGES: MATURITY_STAGES,
    SOURCE_REASON_MATURITY_OVERRIDES: SOURCE_REASON_MATURITY_OVERRIDES,
    // DUC-001 Post-Implementation Turn-Serving Correction — exposed for direct unit testing.
    SOURCE_REASON_HIERARCHY_TIER_OVERRIDES: SOURCE_REASON_HIERARCHY_TIER_OVERRIDES,
    resolveHierarchyTier: resolveHierarchyTier
  };

  if (typeof window !== 'undefined') { window.InitiativeEngine = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
