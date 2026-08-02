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
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;
  var DerivedIntelligenceConsumer = (typeof module !== 'undefined' && module.exports)
    ? require('../derivedIntelligenceConsumer.js')
    : window.DerivedIntelligenceConsumer;

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
        capacityState: 'UNAVAILABLE'
      })
    });
  }

  var API = { assembleContext: assembleContext };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemMemoryLayer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
