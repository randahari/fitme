// ══════════════════════════════════════════════════════════════════
// FitMe — Memory Layer (TASK-004 baseline + TASK-005 Canonical Decision
// CD-T005-01 extension, D2 Stages 1-2 — Pipeline Context Assembly only)
// אחריות בלעדית: Context Assembly עבור ה-Composite Engine בלבד (Canonical
// Decision CD-02, TASK_004_SPEC_v1.0.md § Personalization > Architecture
// Decision Pending (Resolved)). קורא-בלבד: StateAccess.recommendationFeedbackHistory
// (C2) ו-DerivedIntelligenceConsumer.build (B5, consumer RECOMMENDATION_ENGINE
// / policy RECOMMENDATION_SUPPORT_V1, ומ-TASK-005 ואילך גם consumer
// INITIATIVE_ENGINE / policy INITIATIVE_SUPPORT_V1). אינו כותב דבר, אינו
// מחליט/מדרג/מייצר תוכן (D3 §8.1, §11.1 — "No component other than the
// Memory Layer may originate a Decision Input read or assemble Pipeline
// Context", וה-Memory Layer עצמו "never itself decides, ranks, or generates
// content"). CD-02 אינה מתירה memory redesign/migration/API change כלשהו —
// js/memory.js / functions/typedMemoryServerWrite.js נותרים ללא שינוי;
// מודול זה אינו קורא אליהם ישירות בכלל (Integration Map > Memory: "This
// engine does not read js/memory.js directly").
// Graceful degradation (D3 §12.3): אי-זמינות של feedback history או derived
// intelligence אינה חוסמת Context Assembly — ממשיכים עם מה שזמין, ולעולם
// לא ממציאים context חסר.
//
// TASK-005 Canonical Decision CD-T005-01 (docs/specs/TASK_005_SPEC_v1.0.md
// §25/§32): הרחבה ממוקדת בלבד — Relationship Maturity signal, Life Event
// Context, Habit state, Pattern state, Capacity state — עבור ה-Initiative
// Engine, נצרכים ע"י Initiative Engine אך ורק כשדות שכבר נוכחים ב-Pipeline
// Context (לעולם לא קריאה ישירה של ה-Initiative Engine). אינה מתירה
// Opportunity Detection/Evidence Evaluation/Eligibility Evaluation/Candidate
// Generation/Prioritization/Winner Selection/Decision Formation בתוך
// ה-Memory Layer עצמו. Relationship Maturity: אין כיום כל מקור מאושר
// ברפוזיטורי לשלב-הבשלת-היחסים (Correction 1, code review) — ספירת
// feedback events גנרית או ספירת Habit/Pattern signals אינה עדות אוטומטית
// לאמון/בשלות קואצ'ינג, וקביעת כלל כזה היא החלטת Product/Coaching, לא
// פרט הנדסי. עד שיוגדר מקור מאושר, השדה מוחזר תמיד כ-UNKNOWN — לעולם לא
// נגזר מזמן שחלף, ספירת feedback, ספירת Habit/Pattern, או כל threshold
// הנדסי-ארעי (D1-USM-04; Repository Gap / CDR candidate, ר' דוח היישום).
// Life Event Context ו-Capacity State: אין כיום שום מקור נתונים ברפוזיטורי
// לאף אחד מהשניים — מדווחים UNAVAILABLE ביושר, לעולם לא מומצאים
// (D1-DI-02/D2-EF-08).
//
// USM-001 (docs/specs/USM_001_SPEC_v1.0.md) — additive extension: this file gains
// assembleUserStatedMemoryFragment(), a second, independent, distinctly-versioned assembly
// entry point serving Coach Prompt Composition — the legacy, one-way Coach message pipeline
// (a Coach-facing consumer entirely outside this Composite Engine) — not the
// Composite Engine's Decision Pass. It does not touch, read, or extend assembleContext()'s
// own PipelineContext shape above. Model B (several producer stores → one Memory Layer
// assembly authority) is preserved: Memory Layer remains the sole originator of this read,
// via StateAccess's own new memoryLayer/USER_STATED_MEMORY_READ capability-holder identity —
// CD-02 remains honored exactly as before (js/memory.js is still never read directly here).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;
  var DerivedIntelligenceConsumer = (typeof module !== 'undefined' && module.exports)
    ? require('../derivedIntelligenceConsumer.js')
    : window.DerivedIntelligenceConsumer;
  // Expression WP4 (remainder) / Canonical Decision 8 (D3 Decision 7, extending Decision 3) —
  // schema-conformance builder for the Expression Rendering Context only; see
  // buildExpressionRenderingContext() below for the pass-through discipline this file observes.
  var ExpressionRenderingContext = (typeof module !== 'undefined' && module.exports)
    ? require('./expressionRenderingContext.js')
    : window.ExpressionRenderingContext;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  async function assembleContext(identity) {
    identity = identity || {};

    var access = StateAccess.createEngineAccess({
      engineId: 'coachDecisionSystem',
      action: 'DECISION_PASS',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      runId: identity.runId
    });

    var feedbackHistory = [];
    var feedbackAvailable = true;
    try {
      var read = access.read.recommendationFeedbackHistory();
      feedbackHistory = Array.isArray(read) ? read : [];
    } catch (e) {
      feedbackAvailable = false; // graceful degradation, D3 §12.3 — proceed with what's available
    }

    var derivedIntelligence = null;
    var derivedAvailable = true;
    try {
      var diResult = await DerivedIntelligenceConsumer.build({
        requestId: 'coachDecisionSystem:' + (identity.runId || Date.now()),
        consumer: 'RECOMMENDATION_ENGINE',
        policyId: 'RECOMMENDATION_SUPPORT_V1',
        session: { uid: identity.userId, generation: identity.sessionGeneration },
        intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }
      });
      if (diResult && (diResult.status === 'SUCCESS' || diResult.status === 'EMPTY' || diResult.status === 'PARTIAL')) {
        derivedIntelligence = diResult.context;
      } else {
        derivedAvailable = false;
      }
    } catch (e) {
      derivedAvailable = false;
    }

    // ── CD-T005-01 — focused extension for the Initiative Engine (Habit state / Pattern state).
    // Same read pattern as above, same B5 build() call shape, different consumer/policy pair
    // (reserved by B5 §19.3, enabled by this Canonical Decision — Section 25/32).
    var initiativeIntelligence = null;
    var initiativeIntelligenceAvailable = true;
    try {
      var iiResult = await DerivedIntelligenceConsumer.build({
        requestId: 'coachDecisionSystem:initiative:' + (identity.runId || Date.now()),
        consumer: 'INITIATIVE_ENGINE',
        policyId: 'INITIATIVE_SUPPORT_V1',
        session: { uid: identity.userId, generation: identity.sessionGeneration },
        intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }
      });
      if (iiResult && (iiResult.status === 'SUCCESS' || iiResult.status === 'EMPTY' || iiResult.status === 'PARTIAL')) {
        initiativeIntelligence = iiResult.context;
      } else {
        initiativeIntelligenceAvailable = false;
      }
    } catch (e) {
      initiativeIntelligenceAvailable = false;
    }

    // ── CD-T005-01 — Relationship Maturity signal (Correction 1, code review). No approved
    // Relationship Maturity source exists anywhere in this repository (verified: no
    // relationship-maturity / coaching-stage field in any state module). D1-USM-04 requires
    // this Stage to "advance only on accumulated evidence, never on elapsed time alone" — but
    // generic feedback-event counts and confirmed Habit/Pattern signal counts are NOT
    // automatically evidence of relationship trust or coaching maturity, and deciding that they
    // are would be an unapproved Product/Coaching policy decision, not an engineering detail.
    // TASK-005 does not define this policy. If this Memory Layer is later wired to an
    // explicit, Product/Architecture-approved Relationship Maturity source, this is the single
    // place that source would be passed through unchanged. Until then, this always resolves to
    // 'UNKNOWN' — never derived from a clock, account age, feedback count, Habit/Pattern count,
    // or any other provisional threshold. The Initiative Engine treats 'UNKNOWN' at least as
    // conservatively as Observer (TASK_005_SPEC_v1.0.md §17.7, Engineering Decision Pending
    // E-2). Repository Gap / CDR candidate: an approved Relationship Maturity source must be
    // defined by Product/Architecture before this can move beyond UNKNOWN.
    var relationshipMaturity = freezeShallow({ stage: 'UNKNOWN', basis: null });

    // ── CD-T005-01 — Life Event Context / Capacity State: no repository data source exists for
    // either at this baseline (verified: no calendar/life-event/setback tracker, no
    // decision-fatigue/sleep-debt tracker anywhere in js/). Never fabricated — reported
    // UNAVAILABLE honestly (D1-DI-02/D2-EF-08: absence itself is evidence, not an error).
    var lifeEventContext = null;
    var capacityState = null;

    // ── G-2 (docs/specs/G2_SPEC_v1.0.md §12, AD-G2-03 Item 2) — GoalObjectiveContext: bounded,
    // read-only, field-scope-closed to exactly {goal, goalKcal}. Structurally identical try/catch
    // pattern to feedbackHistory/derivedIntelligence above.
    var goalObjectiveContext = null;
    var goalObjectiveContextAvailable = true;
    try {
      var g = access.read.goalObjectiveContext();
      goalObjectiveContext = { goal: g.goal, goalKcal: g.goalKcal };
    } catch (e) {
      goalObjectiveContextAvailable = false; // graceful degradation, D3 §12.3
    }

    // ── G-2 (docs/specs/G2_SPEC_v1.0.md §13, AD-G2-03 Item 2) — CurrentStateContext: reuses the
    // existing readTodayNutrition read as-is, field-scope-closed to exactly
    // {consumed, protein, burned}.
    var currentStateContext = null;
    var currentStateContextAvailable = true;
    try {
      var t = access.read.todayNutrition();
      currentStateContext = { consumed: t.consumed, protein: t.protein, burned: t.burned };
    } catch (e) {
      currentStateContextAvailable = false; // graceful degradation, D3 §12.3
    }

    return freezeShallow({
      schemaVersion: 'coach-decision-system-pipeline-context/1.0',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      assembledAt: Date.now(),
      derivedIntelligence: derivedIntelligence,
      feedbackHistory: freezeShallow(feedbackHistory.slice()),
      initiativeIntelligence: initiativeIntelligence,
      relationshipMaturity: relationshipMaturity,
      lifeEventContext: lifeEventContext,
      capacityState: capacityState,
      goalObjectiveContext: goalObjectiveContext,
      currentStateContext: currentStateContext,
      availability: freezeShallow({
        derivedIntelligence: derivedAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        feedbackHistory: feedbackAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        initiativeIntelligence: initiativeIntelligenceAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        habitState: (initiativeIntelligence && initiativeIntelligence.sourceStatus) ? initiativeIntelligence.sourceStatus.habits : 'UNAVAILABLE',
        patternState: (initiativeIntelligence && initiativeIntelligence.sourceStatus) ? initiativeIntelligence.sourceStatus.patterns : 'UNAVAILABLE',
        // No approved Relationship Maturity source exists yet (see comment above) — reported
        // UNAVAILABLE, same honest-absence semantics as lifeEventContext/capacityState below.
        relationshipMaturity: 'UNAVAILABLE',
        lifeEventContext: 'UNAVAILABLE',
        capacityState: 'UNAVAILABLE',
        goalObjectiveContext: goalObjectiveContextAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        currentStateContext: currentStateContextAvailable ? 'AVAILABLE' : 'UNAVAILABLE'
      })
    });
  }

  // ── Expression WP4 (remainder) / Canonical Decision 8 (D3 Decision 7, extending Decision 3) —
  // produces the Expression Rendering Context (EXPRESSION_SPEC_v1.0.md §10.1, EXP-73-78), a
  // narrow, bounded, Stage-10-facing artifact distinct from Pipeline Context itself. This function
  // is strictly a pass-through of an already-assembled Pipeline Context's own already-computed
  // relationshipMaturity.stage value (see assembleContext() above and its own header comment) —
  // it does NOT resolve, infer, calculate, estimate, or otherwise compute a Relationship Maturity
  // Stage of its own. The pre-existing TASK-005 Relationship Maturity source gap (Section 36 item
  // E-2 / CD-T005-01) is explicitly NOT addressed here and remains exactly as it was: the value
  // below is 'UNKNOWN' for every user, always, until that separate, non-blocking gap is resolved
  // by a future Product/Architecture decision this function does not anticipate, infer, or
  // substitute for.
  function buildExpressionRenderingContext(pipelineContext) {
    var stage = (pipelineContext && pipelineContext.relationshipMaturity && pipelineContext.relationshipMaturity.stage) || 'UNKNOWN';
    return ExpressionRenderingContext.buildExpressionRenderingContext({ relationshipMaturityStage: stage });
  }

  // ── Expression WP9 / D2-EF-07 (Pre-Expression User Correction) — the accepted Architecture
  // investigation's own approved mechanism: freshness/correction-arrival state originates within
  // the Memory Layer's own, already-exclusive Decision-Input-intake ownership boundary (D3
  // Decision 3, §11.1 — "No component other than the Memory Layer may originate a Decision Input
  // read"). In-memory only, per-user, keyed by userId — NOT a durable write (no Persistence
  // Gateway involved), structurally the same kind of primitive as SessionLifecycle's own
  // generation counter (js/sessionLifecycle.js): a narrow, purpose-built marker, never a
  // repurposing of an existing, differently-scoped one.
  //
  // recordExplicitUserStatementArrival() is the write side — intended to be called at the moment
  // a new Explicit User Statement (D1 Unit 11 tier 1; a user-issued correction, not an ordinary
  // Feedback event) is received. getExplicitUserStatementArrivalTimestamp() is the read side,
  // queried by the Internal Pipeline Orchestrator's own pre-dispatch supersession check
  // (internalPipelineOrchestrator.js), immediately before it would invoke runExpressionStage() —
  // never by Expression itself, which receives no new input and performs no detection of its own.
  //
  // HONEST DISCLOSURE (mirrors matchCanonicalSafetyRules()'s/detectSafetyOpportunities()'s own
  // documented pattern in safetyLayer.js): this repository currently has no live UI/flow through
  // which a user could send FitMe a chat message or correction at all (verified: no chat-input
  // element exists anywhere in index.html/js/app.js; every existing coachMessageFn/CoachClient.
  // sendMessage() call site is an app-composed, one-way coach message — home card, trigger card,
  // settings test — never a user-typed statement). recordExplicitUserStatementArrival() is
  // therefore not wired to any live call site by this Work Package — wiring it to an app-composed
  // message would be a genuine semantic misuse of this primitive (recording a correction that
  // never actually occurred). This function is real and correctly implemented, not a stub; it
  // simply has no live trigger to call it yet, exactly the same "correctly yields the
  // non-differentiated case, given a documented and disclosed absence" pattern already established
  // for matchCanonicalSafetyRules()/detectSafetyOpportunities() (Health/Safety Profile source) and
  // the Decision Engine's own Opportunity source (TASK_006_SPEC_v1.0.md §38 item G-2). The
  // pre-dispatch supersession check below will therefore always, correctly, evaluate "not
  // superseded" in production today — never incorrectly withholding, never incorrectly exposing.
  var _explicitUserStatementArrivals = {};

  function recordExplicitUserStatementArrival(identity) {
    identity = identity || {};
    if (!identity.userId) return;
    _explicitUserStatementArrivals[identity.userId] = Date.now();
  }

  function getExplicitUserStatementArrivalTimestamp(identity) {
    identity = identity || {};
    if (!identity.userId) return null;
    var ts = _explicitUserStatementArrivals[identity.userId];
    return (typeof ts === 'number') ? ts : null;
  }

  // ── USM-001 (docs/specs/USM_001_SPEC_v1.0.md §9) — additive, independent capability.
  // Assembles a small, honestly-degraded fragment of user-stated Typed Memory for Coach
  // Prompt Composition. Deliberately NOT part of PipelineContext/assembleContext() above —
  // a separate, distinctly-versioned artifact feeding a different consumer (the legacy Coach
  // Prompt, not the coachDecisionSystem Composite Engine's Decision Pass) with a different
  // lifecycle; never touches Stage 3-10, trustTestSignal, or relationshipMaturity. Uses
  // StateAccess's own new memoryLayer/USER_STATED_MEMORY_READ capability-holder identity
  // (§8.2) — CD-02 remains honored exactly as before: this file still does not read
  // js/memory.js or Firestore directly. Graceful degradation (D3 §12.3): a StateAccess
  // failure here never throws to the caller — it degrades to an honest UNAVAILABLE/[],
  // exactly like every other read in assembleContext() above.
  async function assembleUserStatedMemoryFragment(identity) {
    identity = identity || {};

    var access = StateAccess.createEngineAccess({
      engineId: 'memoryLayer',
      action: 'USER_STATED_MEMORY_READ',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      runId: identity.runId
    });

    var facts = [];
    var available = true;
    try {
      var read = await access.read.userStatedMemory();
      facts = Array.isArray(read) ? read : [];
    } catch (e) {
      available = false; // graceful degradation, D3 §12.3 — never blocks the Coach Prompt
    }

    return freezeShallow({
      schemaVersion: 'coach-decision-system-user-stated-fragment/1.0',
      userId: identity.userId,
      assembledAt: Date.now(),
      facts: freezeShallow(facts.slice()),
      availability: available ? 'AVAILABLE' : 'UNAVAILABLE'
    });
  }

  var API = {
    assembleContext: assembleContext,
    buildExpressionRenderingContext: buildExpressionRenderingContext,
    recordExplicitUserStatementArrival: recordExplicitUserStatementArrival,
    getExplicitUserStatementArrivalTimestamp: getExplicitUserStatementArrivalTimestamp,
    assembleUserStatedMemoryFragment: assembleUserStatedMemoryFragment
  };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemMemoryLayer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
