// ══════════════════════════════════════════════════════════════════
// FitMe — Memory Layer, Minimal (TASK-004, D2 Stages 1-2 — Pipeline
// Context Assembly only)
// אחריות בלעדית: Context Assembly עבור ה-Composite Engine בלבד (Canonical
// Decision CD-02, TASK_004_SPEC_v1.0.md § Personalization > Architecture
// Decision Pending (Resolved)). קורא-בלבד: StateAccess.recommendationFeedbackHistory
// (C2) ו-DerivedIntelligenceConsumer.build (B5, consumer RECOMMENDATION_ENGINE
// / policy RECOMMENDATION_SUPPORT_V1). אינו כותב דבר, אינו מחליט/מדרג/מייצר
// תוכן (D3 §8.1, §11.1 — "No component other than the Memory Layer may
// originate a Decision Input read or assemble Pipeline Context", וה-Memory
// Layer עצמו "never itself decides, ranks, or generates content"). CD-02
// אינה מתירה memory redesign/migration/API change כלשהו — js/memory.js /
// functions/typedMemoryServerWrite.js נותרים ללא שינוי; מודול זה אינו קורא
// אליהם ישירות בכלל (Integration Map > Memory: "This engine does not read
// js/memory.js directly").
// Graceful degradation (D3 §12.3): אי-זמינות של feedback history או derived
// intelligence אינה חוסמת Context Assembly — ממשיכים עם מה שזמין, ולעולם
// לא ממציאים context חסר.
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

    return freezeShallow({
      schemaVersion: 'coach-decision-system-pipeline-context/1.0',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      assembledAt: Date.now(),
      derivedIntelligence: derivedIntelligence,
      feedbackHistory: freezeShallow(feedbackHistory.slice()),
      availability: freezeShallow({
        derivedIntelligence: derivedAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        feedbackHistory: feedbackAvailable ? 'AVAILABLE' : 'UNAVAILABLE'
      })
    });
  }

  var API = { assembleContext: assembleContext };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemMemoryLayer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
