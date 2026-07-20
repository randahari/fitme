// ══════════════════════════════════════════════════════════════════
// FitMe — Trigger Engine Adapter (C1-WP9, Habit and Pattern Engine Extraction
// — triggerEngine's EngineRegistry registration relocated out of js/app.js's
// B2 STAGE 8 tail IIFE, unchanged in behaviour). אחריות בלעדית: ה-run(ctx)
// הנרשם מול EngineRegistry עבור triggerEngine — engine לוגי אחד עם 3 actions,
// לא מפוצל (B2 SPEC §17: בעלות משותפת על budget/dedup/coachEvents/coachDay).
// כל שלוש הפעולות קוראות ל-TriggerController (WP8) ישירות.
// WORKOUT_COMPLETED שומר את ה-session-generation guard (B2 SPEC §19) —
// TriggerController.fireWorkoutTrigger() עצמה נשארת ללא שינוי עסקי.
// sessionLifecycle/persistenceSummaryFn (המשותף עם Habit/Pattern — B4 §27)
// מוזרקים דרך configure() — אותו דפוס בדיוק כמו js/engines/habitEngine.js.
// TriggerController/StateAccess (WP8/B3, יציבים, ללא override chain) נדרשים
// ישירות. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var TriggerController = (typeof module !== 'undefined' && module.exports)
    ? require('../trigger/triggerController.js')
    : window.TriggerController;
  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // Trigger Engine — engine לוגי אחד עם 3 actions, לא מפוצל (B2 SPEC §17: בעלות
  // משותפת על budget/dedup/coachEvents/coachDay). WORKOUT_COMPLETED מקבל כאן
  // session-generation guard חדש (B2 SPEC §19, סוגר את הפער שזוהה ב-Round 1/2) —
  // fireWorkoutTrigger() עצמה נשארת ללא שינוי עסקי.
  async function run(ctx) {
    // B2 Code Review Round 4: כל ענף בודק trigger וגם action בשוויון מלא —
    // אין יותר "action ריק/undefined = default"; ה-Registry כבר מסנן החוצה
    // engines שלא קיבלו action מפורש עבור ה-run הזה לפני שהוא בכלל קורא ל-run().
    if (ctx.trigger === 'APP_READY' && ctx.action === 'DAILY_COACH_CHECK') {
      ctx.state = StateAccess.createEngineAccess({ engineId: 'triggerEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId });
      var runResult = await TriggerController.runCoachTriggers(ctx.state);
      // B3 §17: DOM (trigger-card) הוצא מה-engine — computation/writes אינם תלויים
      // בקיום ה-element; ה-render עצמו (presentTriggerCard) עדיין בודק את קיומו.
      if (deps.sessionLifecycle.isCurrent(ctx.sessionGeneration)) await TriggerController.presentTriggerCard(runResult.trigger, ctx.sessionGeneration);
      return { status: 'SUCCESS', output: { persistence: runResult.persistence } };
    }
    if (ctx.trigger === 'SOURCE_DATA_CHANGED' && ctx.action === 'WORKOUT_COMPLETED') {
      var gen = ctx.sessionGeneration; // REM-002: session guard — נלכד לפני הקריאה, נבדק לפניה
      if (!deps.sessionLifecycle.isCurrent(gen)) return { status: 'SKIPPED', error: { code: 'STALE_SESSION', message: 'session changed before workout trigger could run' } };
      ctx.state = StateAccess.createEngineAccess({ engineId: 'triggerEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: gen, runId: ctx.runId });
      var burn = ctx.payload && ctx.payload.burn;
      var writeResult = await TriggerController.fireWorkoutTrigger(burn, ctx.state); // access.write עצמו כבר בודק session לפני ה-mutation
      if (!deps.sessionLifecycle.isCurrent(gen)) return { status: 'SKIPPED', error: { code: 'STALE_SESSION', message: 'session changed during workout trigger' } };
      if (writeResult && writeResult.status === 'APPLIED') {
        var goalForCard = ctx.state.read.triggerProfile().goal;
        await TriggerController.presentWorkoutTriggerCard(burn, goalForCard, gen);
      }
      return { status: 'SUCCESS', output: { persistence: deps.persistenceSummaryFn(writeResult) } };
    }
    if (ctx.trigger === 'AUTH_SESSION_READY' && ctx.action === 'LOCAL_NOTIFICATION_SCHEDULE') {
      ctx.state = StateAccess.createEngineAccess({ engineId: 'triggerEngine', action: ctx.action, userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId });
      TriggerController.scheduleLocalNotifications(ctx.state);
      return { status: 'SUCCESS' };
    }
    return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'not a triggerEngine trigger/action pair' } };
  }

  var API = {
    configure: configure,
    run: run
  };

  if (typeof window !== 'undefined') { window.TriggerEngineAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
