// ══════════════════════════════════════════════════════════════════
// FitMe — Adaptive TDEE Engine Adapter (C1-WP9, Habit and Pattern Engine
// Extraction — adaptiveTdeeEngine's EngineRegistry registration relocated
// out of js/app.js's B2 STAGE 8 tail IIFE, unchanged in behaviour). אחריות
// בלעדית: ה-run(ctx) הנרשם מול EngineRegistry עבור adaptiveTdeeEngine —
// שלוש הפעולות (ADAPTIVE_CHECK/WEIGHT_CHANGED/ADAPTIVE_RECHECK), כולן קוראות
// ל-AdaptiveTdeeController.runAdaptiveCheck (WP7) ואז, אם הסשן עדיין נוכחי,
// ל-renderAdaptiveCard/renderPartialPrompt. רק runAdaptiveCheck() רשום;
// applyAdaptiveUpdate() נשאר מחוץ ל-Registry כפעולה ידנית מאושרת של המשתמש
// (B2 SPEC §17/§19), ללא שינוי — אינו בסקופ קובץ זה כלל. sessionLifecycle
// מוזרק דרך configure() — אותו דפוס בדיוק כמו js/nutrition/mealCommitService.js
// ו-js/trigger/triggerController.js. AdaptiveTdeeController/StateAccess (WP7/B3,
// יציבים, ללא override chain) נדרשים ישירות. חולץ מ-js/app.js ללא שינוי
// התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var AdaptiveTdeeController = (typeof module !== 'undefined' && module.exports)
    ? require('../adaptive/adaptiveTdeeController.js')
    : window.AdaptiveTdeeController;
  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // Adaptive TDEE Engine — רק runAdaptiveCheck() רשום; applyAdaptiveUpdate()
  // נשאר מחוץ ל-Registry כפעולה ידנית מאושרת של המשתמש (B2 SPEC §17/§19),
  // ללא שינוי, וממשיכה להשתמש ב-Authority Contract הקיים. B2 Code Review
  // Round 4: בדיקת action הפכה לשוויון מלא (&&) — אין יותר "action ריק = default",
  // כי ה-Registry כבר לא קורא ל-run() בכלל אם לא סופק action מפורש.
  async function run(ctx) {
    if (ctx.trigger === 'APP_READY' && ctx.action === 'ADAPTIVE_CHECK') {
      ctx.state = StateAccess.createEngineAccess({ engineId: 'adaptiveTdeeEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId });
      await AdaptiveTdeeController.runAdaptiveCheck(ctx.state);
      // B3 §17: UI (renderAdaptiveCard/renderPartialPrompt) הועברה לכאן — האדפטר,
      // אחרי החישוב, בדיוק כמו קודם מבחינת תוכן/תזמון; רק תלות ה-DOM הוסרה מה-engine.
      if (deps.sessionLifecycle.isCurrent(ctx.sessionGeneration)) { AdaptiveTdeeController.renderAdaptiveCard(); AdaptiveTdeeController.renderPartialPrompt(); }
      return { status: 'SUCCESS' };
    }
    if (ctx.trigger === 'SOURCE_DATA_CHANGED' && ctx.action === 'WEIGHT_CHANGED') {
      ctx.state = StateAccess.createEngineAccess({ engineId: 'adaptiveTdeeEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId });
      await AdaptiveTdeeController.runAdaptiveCheck(ctx.state);
      if (deps.sessionLifecycle.isCurrent(ctx.sessionGeneration)) { AdaptiveTdeeController.renderAdaptiveCard(); AdaptiveTdeeController.renderPartialPrompt(); }
      return { status: 'SUCCESS' };
    }
    if (ctx.trigger === 'MANUAL' && ctx.action === 'ADAPTIVE_RECHECK') {
      ctx.state = StateAccess.createEngineAccess({ engineId: 'adaptiveTdeeEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId });
      await AdaptiveTdeeController.runAdaptiveCheck(ctx.state);
      if (deps.sessionLifecycle.isCurrent(ctx.sessionGeneration)) { AdaptiveTdeeController.renderAdaptiveCard(); AdaptiveTdeeController.renderPartialPrompt(); }
      return { status: 'SUCCESS' };
    }
    return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'not an adaptiveTdeeEngine action for this trigger' } };
  }

  var API = {
    configure: configure,
    run: run
  };

  if (typeof window !== 'undefined') { window.AdaptiveTdeeEngineAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
