// ══════════════════════════════════════════════════════════════════
// FitMe — Trigger Domain (C1-WP8, Trigger and Notification Domain)
// אחריות בלעדית: פונקציות תנאי טהורות — בדיקת תקציב יומי, מעריכי טריגרים
// (evalXxx), בחירת הטריגר בעל העדיפות הגבוהה ביותר, רמז מאכל חלבוני, וטקסט
// טריגר מקומי (בלי AI). מודול טהור — ללא configure(), ללא DOM/פלטפורמה/AI/
// פרסיסטנס, באותו דפוס כמו js/adaptive/adaptiveTdeeDomain.js. תלוי ישירות
// ב-AdaptiveTdeeDomain (WP7), CoachProfile (WP6), ProfileMetrics ו-DateUtils
// (WP1) — כל אלה מודולים טהורים/יציבים, ללא override chain. כל state של
// האפליקציה (history/profile/todayNutrition/userProfile) מתקבל כפרמטרים —
// אין קריאה למשתני app.js גלובליים.
//
// הערה: ensureCoachMemory()/coachDay() (ה-accessor/mutator הסטטפולי של
// userProfile.coachDay) וה-canFire() ברמת app.js נשארים ב-js/app.js — הם
// שזורים בתוך ה-StateAccess.configure() הקפוא של B3 (checkCanFire/
// getTriggerBudget/ensureCoachMemoryShape/recordCoachEvent/markTriggerFired,
// כולם מפנים אליהם בשם חשוף). רק אלגוריתם הבדיקה הטהור (canFire כאן) חולץ;
// js/app.js's own canFire() facade מאציל אליו תוך שהוא ממשיך לקרוא ל-coachDay()
// המקומי בדיוק כמו קודם — ראה tests/c1Wp8Wiring.test.js.
//
// חולץ מ-js/app.js ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP8.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var AdaptiveTdeeDomain = (typeof module !== 'undefined' && module.exports)
    ? require('../adaptive/adaptiveTdeeDomain.js')
    : window.AdaptiveTdeeDomain;
  var CoachProfile = (typeof module !== 'undefined' && module.exports)
    ? require('../coach/coachProfile.js')
    : window.CoachProfile;
  var ProfileMetrics = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/profileMetrics.js')
    : window.ProfileMetrics;
  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;

  var PRIO = { health: 3, opportunity: 2, encouragement: 1 };
  var COACH_DAILY_BUDGET = 3; // מקסימום טריגרים ביום (בריאותי פורץ)

  // ── בדיקת תקציב יומי — זהה בהתנהגות ל-canFire() המקורי, כפונקציה טהורה: מקבלת
  // את מצב היום (coachDayState = {fired, count}) כפרמטר במקום לקרוא ל-coachDay()
  // הגלובלי. ──
  function canFire(coachDayState, type, priority) {
    var cd = coachDayState;
    if (cd.fired.indexOf(type) >= 0) return false; // בלי כפילות באותו יום
    if (priority < PRIO.health && cd.count >= COACH_DAILY_BUDGET) return false; // תקציב מוצה
    return true;
  }

  // ══ הערכת טריגרים — פונקציות תנאי טהורות ══
  // כל אחת מחזירה אובייקט טריגר {type, priority, live, data} או null. זהות לחלוטין למקור.

  // 🔴 דגל אדום בריאותי — מהמנוע המסתגל (WP7). todayData מתקבל כפרמטר נוסף (נדרש
  // ל-AdaptiveTdeeDomain.computeAdaptiveTdee הטהור, שאינו קורא עוד ל-todayData גלובלי).
  function evalRedFlag(history, profile, todayData) {
    if (typeof AdaptiveTdeeDomain.computeAdaptiveTdee !== 'function') return null;
    try {
      var calc = AdaptiveTdeeDomain.computeAdaptiveTdee(history, profile, todayData);
      if (!calc.enoughData) return null;
      var meas = AdaptiveTdeeDomain.analyzeMeasurements(profile);
      var sig = AdaptiveTdeeDomain.buildWeeklySignals(calc, meas, profile);
      if (sig.redFlag) return { type: 'redflag', priority: PRIO.health, live: true, data: { sig: sig, calc: calc } };
    } catch (e) {}
    return null;
  }

  // 🟡 שכחת לאכול — 14:00–19:00 ופחות מ-400 קל׳
  function evalForgotToEat(todayNutrition) {
    var h = new Date().getHours();
    var consumed = todayNutrition.consumed;
    if (h >= 14 && h < 20 && consumed < 400) {
      return { type: 'forgot-eat', priority: PRIO.opportunity, live: false, data: { have: consumed } };
    }
    return null;
  }

  // 🟡 חלבון נמוך יומיים ברצף
  function evalLowProtein(history, triggerProfile, todayNutrition) {
    var target = ProfileMetrics.computeProteinTarget(triggerProfile.weight);
    var todayP = todayNutrition.protein;
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yData = history[DateUtils.dateKey(y)];
    if (!yData) return null;
    var yP = Math.round((yData.meals || []).reduce(function (s, m) { return s + (m.protein || 0); }, 0));
    if (todayNutrition.consumed > 500 && todayP < target * 0.6 && yP < target * 0.6) {
      return { type: 'low-protein', priority: PRIO.opportunity, live: false, data: { have: todayP, target: target } };
    }
    return null;
  }

  // 🟡 לא התאמנת כבר כמה ימים (לפי תדירות היעד)
  function evalNoWorkout(history, triggerProfile, todayNutrition) {
    if (!triggerProfile.totalWorkouts) return null; // משתמש חדש — לא מנדנדים
    var gap = triggerProfile.workoutFrequency === '6' ? 2 : triggerProfile.workoutFrequency === '4' ? 3 : 4;
    var d = new Date();
    var since = 0;
    for (var i = 0; i < 14; i++) {
      var key = DateUtils.dateKey(d);
      var burned = (i === 0) ? todayNutrition.burned : ((history[key] || {}).burned || 0);
      if (burned > 0) break;
      since++; d.setDate(d.getDate() - 1);
    }
    if (since > gap) return { type: 'no-workout', priority: PRIO.opportunity, live: false, data: { since: since } };
    return null;
  }

  // 🟡 קרוב מאוד ליעד בערב
  function evalCloseToGoal(triggerProfile, todayNutrition) {
    var h = new Date().getHours();
    var remain = triggerProfile.goalKcal - todayNutrition.consumed;
    if (h >= 19 && remain >= 100 && remain <= 300) {
      return { type: 'close-goal', priority: PRIO.opportunity, live: false, data: { remain: remain } };
    }
    return null;
  }

  // 🟢 אבן דרך בסטריק
  function evalStreakMilestone(triggerProfile) {
    var s = triggerProfile.streak || 0;
    if ([7, 14, 30, 60, 100].indexOf(s) >= 0) {
      return { type: 'streak-' + s, priority: PRIO.encouragement, live: s >= 30, data: { streak: s } };
    }
    return null;
  }

  // ── בחירת הטריגר בעל העדיפות הגבוהה ביותר — זהה להתנהגות המקורית (המסננת/הממיינת
  // בתוך runCoachTriggers): מסננת ערכי falsy, ממיינת יורד לפי priority, מחזירה את הראשון
  // (או null אם אין מועמדים). קלט זה כבר מסונן מראש לפי canFire() ברמת ה-caller (לא כאן —
  // בדיקת התקציב היא state-dependent ואינה חלק מהקלט הטהור הזה). ──
  function selectTrigger(candidates) {
    var filtered = candidates.filter(Boolean);
    if (!filtered.length) return null;
    filtered.sort(function (a, b) { return b.priority - a.priority; });
    return filtered[0];
  }

  // מאכל חלבוני מהרשימה של המשתמש (אחרת ברירת מחדל) — זהה לחלוטין ל-proteinFoodHint()
  // המקורי; profile מתקבל כפרמטר במקום userProfile הגלובלי.
  function proteinFoodHint(profile) {
    var foods = (profile && profile.foods) || [];
    var rich = ['עוף', 'ביצים', 'דג', 'קוטג\'', 'יוגורט', 'בשר', 'טונה', 'גבינה', 'חלבון', 'שניצל'];
    var hit = foods.find(function (f) { return rich.some(function (r) { return f.includes(r); }); });
    return hit || 'ביצה, קוטג׳ או עוף';
  }

  // ── טקסט מקומי לכל טריגר (חינם) — זהה לחלוטין ל-triggerLocalText() המקורי; profile
  // מתקבל כפרמטר (משמש את coachName/coachChatter הטהורים של CoachProfile, WP6). ──
  function triggerLocalText(profile, t) {
    var n = CoachProfile.coachName(profile);
    var warm = CoachProfile.coachChatter(profile) === 'gentle';
    switch (t.type) {
      case 'forgot-eat':
        return warm ? (n + ', עוד לא ראיתי הרבה רישום היום — מה אכלת עד עכשיו? בוא נעדכן.') : ('לא שכחת לרשום? עד עכשיו רק ' + t.data.have + ' קל׳. מה אכלת היום?');
      case 'low-protein':
        return n + ', יומיים שהחלבון נמוך (' + t.data.have + 'g מתוך ' + t.data.target + 'g). ' + proteinFoodHint(profile) + ' יסגור את הפער יפה.';
      case 'no-workout':
        return warm ? (n + ', כבר ' + t.data.since + ' ימים בלי אימון — הגוף שלך מוכן, גם 20 דקות זה ניצחון.') : (t.data.since + ' ימים בלי אימון. מה דעתך על אימון קצר היום?');
      case 'close-goal':
        return n + ', נותרו רק ' + t.data.remain + ' קל׳ ליעד — עוד ארוחה קטנה וסגרת יום מושלם.';
      default:
        if (t.type.indexOf('streak-') === 0) return n + ', ' + t.data.streak + ' ימים ברצף! 🔥 אתה במומנטום מעולה.';
        return '';
    }
  }

  var API = {
    PRIO: PRIO,
    COACH_DAILY_BUDGET: COACH_DAILY_BUDGET,
    canFire: canFire,
    evalRedFlag: evalRedFlag,
    evalForgotToEat: evalForgotToEat,
    evalLowProtein: evalLowProtein,
    evalNoWorkout: evalNoWorkout,
    evalCloseToGoal: evalCloseToGoal,
    evalStreakMilestone: evalStreakMilestone,
    selectTrigger: selectTrigger,
    proteinFoodHint: proteinFoodHint,
    triggerLocalText: triggerLocalText
  };

  if (typeof window !== 'undefined') { window.TriggerDomain = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
