// ══════════════════════════════════════════════════════════════════
// FitMe — Trigger Controller (C1-WP8, Trigger and Notification Domain)
// אחריות בלעדית: "Application Responsibilities" — איסוף snapshots של
// history/profile דרך State Access, בחירת ודיווח הטריגר דרך פעולת ה-
// EngineRegistry (runCoachTriggers), טקסט חי מהמאמן (triggerLiveText),
// הצגת trigger-card (presentTriggerCard/presentWorkoutTriggerCard), טריגר
// מיידי אחרי אימון (fireWorkoutTrigger), ותזמון התראות מקומיות
// (scheduleLocalNotifications). תלוי ישירות ב-TriggerDomain (המודול הטהור,
// WP8), NotificationAdapter (WP2, יציב, ללא override chain), ו-ProfileMetrics
// (WP1) — אותו דפוס כמו js/adaptive/adaptiveTdeeController.js. DOM, session,
// state (userProfile/todayData), ופונקציות app.js אחרות (חלקן משותפות עם
// Habit/Pattern — persistenceSummary; חלקן עטופות מאוחר יותר — אין כאלה כאן,
// אך מוזרקות מכל מקום לפי המוסכמה) מוזרקים דרך configure(). חולץ מ-js/app.js
// ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP8.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var TriggerDomain = (typeof module !== 'undefined' && module.exports)
    ? require('./triggerDomain.js')
    : window.TriggerDomain;
  var NotificationAdapter = (typeof module !== 'undefined' && module.exports)
    ? require('../adapters/notificationAdapter.js')
    : window.NotificationAdapter;
  var ProfileMetrics = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/profileMetrics.js')
    : window.ProfileMetrics;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // ══ הרצת המנוע בכניסה — בוחר טריגר אחד (הכי גבוה בעדיפות) — זהה לחלוטין
  // ל-runCoachTriggers() המקורי. ══
  async function runCoachTriggers(access) {
    var userProfile = deps.getUserProfile();
    if (!userProfile || !access) return { trigger: null, persistence: deps.persistenceSummaryFn(null) };
    var history = await access.read.nutritionActivityHistory();
    var profile = access.read.adaptiveProfile();
    var triggerProfile = access.read.triggerProfile();
    var todayNutrition = access.read.todayNutrition();

    var candidates = [
      TriggerDomain.evalRedFlag(history, profile, deps.getTodayData()),
      TriggerDomain.evalForgotToEat(todayNutrition),
      TriggerDomain.evalLowProtein(history, triggerProfile, todayNutrition),
      TriggerDomain.evalNoWorkout(history, triggerProfile, todayNutrition),
      TriggerDomain.evalCloseToGoal(triggerProfile, todayNutrition),
      TriggerDomain.evalStreakMilestone(triggerProfile)
    ].filter(Boolean).filter(function (t) { return access.read.canFire(t.type, t.priority); });

    if (!candidates.length) return { trigger: null, persistence: deps.persistenceSummaryFn(null) };
    var t = TriggerDomain.selectTrigger(candidates);

    var budgetResult = await access.write.updateDailyTriggerBudget({ type: t.type });
    var eventResult = await access.write.recordTriggerOutcome({ type: t.type, data: t.data });
    var worst = (eventResult.status !== 'APPLIED') ? eventResult : budgetResult;
    return { trigger: t, persistence: deps.persistenceSummaryFn(worst) };
  }

  // ── UI (B3 §17): מציגה את ה-trigger-card לפי תוצאת runCoachTriggers() — זהה
  // בתוכן/תזמון לקוד המקורי. ──
  async function presentTriggerCard(t, sessionGeneration) {
    var card = deps.documentRef.getElementById('trigger-card');
    if (!card) return;
    if (!t) { card.classList.add('hidden'); return; }
    var textEl = deps.documentRef.getElementById('trigger-card-text');
    if (textEl) textEl.textContent = TriggerDomain.triggerLocalText(deps.getUserProfile(), t) || '...';
    card.classList.remove('hidden');
    if (t.live && textEl) {
      try {
        var msg = await triggerLiveText(t);
        if (msg && (typeof sessionGeneration === 'undefined' || deps.sessionLifecycle.isCurrent(sessionGeneration))) textEl.textContent = msg;
      } catch (e) {}
    }
  }

  // ── בקשת טקסט חי מהמאמן לטריגר (רגעים גדולים) — זהה לחלוטין ל-triggerLiveText()
  // המקורי. ──
  async function triggerLiveText(t) {
    var ctx = '';
    var name = deps.coachNameFn();
    if (t.type === 'redflag') {
      ctx = 'דגל אדום מהמנוע המסתגל: ' + name + ' יורד במשקל מהר מדי והזרוע מצטמקת — סימן לאובדן שריר. הרגע אותו, הסבר בקצרה שנאט את הקצב ונוסיף קצת קלוריות כדי לשמור על השריר. טון תומך.';
    } else if (t.type.indexOf('streak-') === 0) {
      ctx = name + ' הגיע ל-' + t.data.streak + ' ימים ברצף באפליקציה. חגוג את זה איתו בחום, משפט קצר.';
    } else {
      ctx = 'אירוע: ' + t.type + '. תגיב בקצרה בהתאם לאופי.';
    }
    try { return await deps.coachMessageFn(ctx); } catch (e) { return TriggerDomain.triggerLocalText(deps.getUserProfile(), t); }
  }

  // ── טריגר מיידי אחרי אימון (תגובה ישירה לפעולת המשתמש) — זהה לחלוטין
  // ל-fireWorkoutTrigger() המקורי. ──
  async function fireWorkoutTrigger(burn, access) {
    if (!access) return null;
    return await access.write.recordTriggerOutcome({ type: 'workout-logged', data: { burn: burn } });
  }

  // ── UI (B3 §17): מציגה trigger-card לאחר אימון — זהה לחלוטין
  // ל-presentWorkoutTriggerCard() המקורי. ──
  async function presentWorkoutTriggerCard(burn, goal, sessionGeneration) {
    var card = deps.documentRef.getElementById('trigger-card');
    var textEl = deps.documentRef.getElementById('trigger-card-text');
    if (!card || !textEl) return;
    textEl.textContent = deps.coachLineFn('workout', { burn: (burn || 0).toLocaleString() });
    card.classList.remove('hidden');
    try {
      var ctx = deps.coachNameFn() + ' בדיוק סיים אימון ושרף ' + burn + ' קל׳ (מטרה: ' + deps.goalLabels[goal] + '). תן לו קרדיט קצר שמחבר את האימון למטרה שלו.';
      var msg = await deps.coachMessageFn(ctx);
      if (msg && (typeof sessionGeneration === 'undefined' || deps.sessionLifecycle.isCurrent(sessionGeneration))) textEl.textContent = msg;
    } catch (e) {}
  }

  // scheduleLocalNotifications — גרסה מודעת-תקציב, ההגדרה היחידה — זהה לחלוטין למקור.
  // B3: access נקרא מחדש בתוך כל scheduleAt callback (לא snapshot יחיד בזמן התזמון) —
  // כדי לשמר בדיוק את ההתנהגות הקודמת של קריאת נתונים "טריים" בזמן ההפעלה בפועל.
  function scheduleLocalNotifications(access) {
    var userProfile = deps.getUserProfile();
    if (NotificationAdapter.getPermission() !== 'granted' || !userProfile || !access) return;
    var now = new Date();
    var hour = now.getHours();

    async function push(type, priority, title, body) {
      try {
        if (!access.read.canFire(type, priority)) return;
        deps.sendLocalNotificationFn(title, body);
        await access.write.updateDailyTriggerBudget({ type: type });
        await access.write.recordTriggerOutcome({ type: type, data: { via: 'notification' } });
      } catch (e) { /* session הפך stale בין התזמון להפעלה — לעולם לא שובר */ }
    }

    // בוקר (עידוד)
    if (hour < 7) deps.scheduleAtFn(7, 0, function () {
      try { var p = access.read.triggerProfile(); push('morning', TriggerDomain.PRIO.encouragement, 'בוקר טוב ' + deps.coachNameFn() + ' ☀️', deps.coachLineFn('morning', { goal: p.goalKcal })); } catch (e) {}
    });

    // שכחת לאכול (הזדמנות)
    if (hour < 14) deps.scheduleAtFn(14, 0, function () {
      try {
        var t = access.read.todayNutrition();
        if (t.consumed < 400) push('forgot-eat', TriggerDomain.PRIO.opportunity, '🍽️ לא שכחת לאכול?', TriggerDomain.triggerLocalText(deps.getUserProfile(), { type: 'forgot-eat', data: { have: t.consumed } }));
      } catch (e) {}
    });

    // חלבון (הזדמנות)
    if (hour < 17) deps.scheduleAtFn(17, 0, function () {
      try {
        var t = access.read.todayNutrition(), pf = access.read.triggerProfile();
        var tgt = ProfileMetrics.computeProteinTarget(pf.weight);
        if (t.protein < tgt * 0.6) push('protein', TriggerDomain.PRIO.opportunity, '📊 בדיקת תזונה', deps.coachLineFn('protein', { have: t.protein, target: tgt }));
      } catch (e) {}
    });

    // ערב — קרוב ליעד (הזדמנות)
    if (hour < 20) deps.scheduleAtFn(20, 0, function () {
      try {
        var t = access.read.todayNutrition(), pf = access.read.triggerProfile();
        var remain = pf.goalKcal - t.consumed;
        if (remain >= 100 && remain <= 300) push('close-goal', TriggerDomain.PRIO.opportunity, '⚡ ' + deps.coachNameFn(), TriggerDomain.triggerLocalText(deps.getUserProfile(), { type: 'close-goal', data: { remain: remain } }));
        else if (remain > 300) push('evening', TriggerDomain.PRIO.opportunity, '⚡ ' + deps.coachNameFn(), deps.coachLineFn('evening', { remain: remain }));
      } catch (e) {}
    });

    // הגנת סטריק (בריאותי-רך — פורץ תקציב כי חשוב)
    if (hour < 21) deps.scheduleAtFn(21, 0, function () {
      try {
        var t = access.read.todayNutrition(), pf = access.read.triggerProfile();
        if (t.consumed < 100 && (pf.streak || 0) > 2) push('streak-guard', TriggerDomain.PRIO.health, '🔥 הסטריק שלך', deps.coachLineFn('streak', { streak: pf.streak }));
      } catch (e) {}
    });
  }

  var API = {
    configure: configure,
    runCoachTriggers: runCoachTriggers,
    presentTriggerCard: presentTriggerCard,
    triggerLiveText: triggerLiveText,
    fireWorkoutTrigger: fireWorkoutTrigger,
    presentWorkoutTriggerCard: presentWorkoutTriggerCard,
    scheduleLocalNotifications: scheduleLocalNotifications
  };

  if (typeof window !== 'undefined') { window.TriggerController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
