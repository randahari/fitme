// ══════════════════════════════════════════════════════════════════
// FitMe — Adaptive TDEE Domain (C1-WP7, Adaptive TDEE Domain)
// אחריות בלעדית: פונקציות חישוב טהורות — בחירת קצב, בניית חלון ימים,
// סיווג יום, זיהוי ימי-רישום-חלקי, חישוב TDEE אמיתי, ניתוח היקפים,
// בניית אותות שבועיים, התאמת גירעון, בניית הצעת עדכון, והסבר מקומי.
// מודול טהור — ללא configure(), ללא DOM/פלטפורמה/AI/פרסיסטנס, באותו
// דפוס כמו js/nutrition/mealDraft.js ו-js/coach/coachProfile.js. תלוי
// ישירות ב-DateUtils/NumberUtils/NutritionModel (מודולי WP1 טהורים,
// ללא override chain). כל state של האפליקציה (history/profile/todayData)
// מתקבל כפרמטרים — אין קריאה למשתני app.js גלובליים.
//
// הערה על computeNextDeficit: המקור קרא ל-adaptRate() הגלובלי (שקורא את
// userProfile הגלובלי) במקום להשתמש בפרמטר profile.rate שכבר הועבר אליו.
// בפועל profile.rate ו-userProfile.rate תמיד זהים בכל נקודת קריאה קיימת
// (readAdaptiveProfile ב-js/stateAccess.js מעתיק rate: p.rate מאותו
// userProfile באופן סינכרוני) — כך שהחלפת הקריאה ל-adaptRate(profile) כאן
// אינה משנה שום התנהגות בפועל, ונדרשת כדי שהמודול יהיה טהור באמת (Exit
// Gate: "pure, deterministic"). ראה tests/adaptiveTdeeDomain.test.js
// ו-tests/c1Wp7Wiring.test.js.
//
// הערה על renderMeasurements (js/adaptive/adaptiveTdeeController.js):
// הקוד המקורי קרא ל-analyzeMeasurements() בלי ארגומנט (במקום
// analyzeMeasurements(userProfile)) — כך ש-p = profile || {} תמיד ריק,
// וכל מגמת היקף (waist/arm/chest) תמיד null, ואף חץ מגמה לא מוצג במסך
// ההיקפים. זהו באג קיים במקור, לא תוקן כאן (No functional changes) —
// חולץ בדיוק כמו שהוא, ומתועד גם ב-adaptiveTdeeController.js וב-review.
//
// חולץ מ-js/app.js ללא שינוי התנהגות (מלבד ה-purity fix המתועד לעיל,
// שאינו משנה שום תוצאה בפועל) — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP7.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;
  var NumberUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/numberUtils.js')
    : window.NumberUtils;
  var NutritionModel = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/nutritionModel.js')
    : window.NutritionModel;

  // ── קונפיגורציית קצב — זהה לחלוטין למקור. ──
  var ADAPT_RATES = {
    gentle:     { label: 'עדין',     step: 100, cutTarget: -250, bulkTarget: 200 },
    balanced:   { label: 'מאוזן',    step: 150, cutTarget: -400, bulkTarget: 300 },
    aggressive: { label: 'אגרסיבי',  step: 200, cutTarget: -500, bulkTarget: 400 }
  };
  var KCAL_PER_KG = 7700;
  var ADAPT_WINDOW_DAYS = 14;
  var ADAPT_MIN_DAYS = 7;
  var ADAPT_MIN_WEIGHTS = 3;
  var ADAPT_MIN_SPAN = 10;
  var ADAPT_CADENCE_DAYS = 7;
  var ADAPT_MAX_STEP = 250;
  var PARTIAL_FRACTION = 0.5;

  // זהה לחלוטין ל-adaptRate()/adaptEnabled() המקוריים, כפונקציות טהורות של profile.
  function adaptRate(profile) {
    var r = (profile && profile.rate) || 'balanced';
    return ADAPT_RATES[r] ? r : 'balanced';
  }
  function adaptEnabled(profile) {
    return !profile || profile.adaptiveEnabled !== false;
  }

  // ── בונה מפת ימים בחלון (כולל היום מ-todayData) — זהה לחלוטין ל-daysInWindow()
  // המקורי; todayData מתקבל כפרמטר במקום קריאה גלובלית. ──
  function daysInWindow(history, todayData, windowDays) {
    var out = [];
    var today = new Date();
    for (var i = 0; i < windowDays; i++) {
      var d = new Date(today); d.setDate(today.getDate() - i);
      var key = DateUtils.dateKey(d);
      var data = (i === 0) ? todayData : ((history && history[key]) || null);
      out.push({ key: key, kcal: NutritionModel.dayKcal(data), hasMeals: !!(data && data.meals && data.meals.length) });
    }
    return out;
  }

  // סיווג יום: full / light-confirmed / partial-suspect / empty — זהה לחלוטין למקור.
  function classifyDay(day, goalKcal, confirmedLight) {
    if (!day.hasMeals || day.kcal <= 0) return 'empty';
    if (day.kcal >= goalKcal * PARTIAL_FRACTION) return 'full';
    if (confirmedLight && confirmedLight.indexOf(day.key) >= 0) return 'light';
    return 'partial';
  }

  // ימים חשודים כרישום חלקי — זהה לחלוטין ל-pendingPartialDays() המקורי; history/
  // todayData/profile מתקבלים כפרמטרים במקום window._adaptHistoryCache/userProfile גלובליים.
  function pendingPartialDays(history, todayData, profile) {
    if (!profile) return [];
    var goal = profile.goalKcal || 2000;
    var confirmed = profile.confirmedLightDays || [];
    var days = daysInWindow(history, todayData, ADAPT_WINDOW_DAYS);
    return days.filter(function (d) { return classifyDay(d, goal, confirmed) === 'partial'; });
  }

  // ══ הליבה: חישוב TDEE אמיתי מהנתונים — זהה לחלוטין ל-computeAdaptiveTdee() המקורי. ══
  function computeAdaptiveTdee(history, profile, todayData) {
    var p = profile || {};
    var goal = p.goalKcal || 2000;
    var confirmed = p.confirmedLightDays || [];

    var days = daysInWindow(history, todayData, ADAPT_WINDOW_DAYS);
    var counted = days.filter(function (d) {
      var c = classifyDay(d, goal, confirmed);
      return c === 'full' || c === 'light';
    });
    var nDays = counted.length;
    var avgIntake = nDays ? Math.round(counted.reduce(function (s, d) { return s + d.kcal; }, 0) / nDays) : 0;

    var wh = (p.weightHistory || []).filter(function (w) { return w && w.date && typeof w.weight === 'number'; });
    var cutoff = DateUtils.dateKey(new Date(Date.now() - ADAPT_WINDOW_DAYS * 86400000));
    var winW = wh.filter(function (w) { return w.date >= cutoff; });
    var nWeights = winW.length;
    var slopeKgPerDay = 0, spanDays = 0;
    if (nWeights >= 2) {
      var base = winW[0].date;
      var pts = winW.map(function (w) { return { x: DateUtils.daysBetween(w.date, base), y: w.weight }; });
      slopeKgPerDay = NumberUtils.linearSlope(pts);
      spanDays = DateUtils.daysBetween(winW[nWeights - 1].date, winW[0].date);
    }

    var enoughDays = nDays >= ADAPT_MIN_DAYS;
    var enoughWeights = nWeights >= ADAPT_MIN_WEIGHTS && spanDays >= ADAPT_MIN_SPAN;
    var enoughData = enoughDays && enoughWeights;

    var tdee = avgIntake - slopeKgPerDay * KCAL_PER_KG;

    var prev = p.adaptiveTdee || p.tdee || null;
    if (prev) tdee = Math.max(prev - ADAPT_MAX_STEP, Math.min(prev + ADAPT_MAX_STEP, tdee));
    tdee = Math.round(Math.max(1200, Math.min(5000, tdee)));

    return {
      enoughData: enoughData, enoughDays: enoughDays, enoughWeights: enoughWeights,
      nDays: nDays, nWeights: nWeights, spanDays: spanDays, avgIntake: avgIntake,
      slopeKgPerDay: slopeKgPerDay, slopeKgPerWeek: slopeKgPerDay * 7,
      tdee: tdee,
      need: { days: Math.max(0, ADAPT_MIN_DAYS - nDays), weights: Math.max(0, ADAPT_MIN_WEIGHTS - nWeights) }
    };
  }

  // ══ ניתוח היקפים — זהה לחלוטין ל-analyzeMeasurements() המקורי. ══
  function analyzeMeasurements(profile) {
    var p = profile || {};
    var mh = (p.measurementHistory || []).filter(function (m) { return m && m.date; });
    var cutoff = DateUtils.dateKey(new Date(Date.now() - 28 * 86400000));
    var recent = mh.filter(function (m) { return m.date >= cutoff; });
    function trend(field) {
      var pts = recent.filter(function (m) { return typeof m[field] === 'number'; });
      if (pts.length < 2) return null;
      var base = pts[0].date;
      var slope = NumberUtils.linearSlope(pts.map(function (m) { return { x: DateUtils.daysBetween(m.date, base), y: m[field] }; }));
      return slope * 7;
    }
    return { waist: trend('waist'), arm: trend('arm'), chest: trend('chest'), count: recent.length };
  }

  // ══ שילוב שלושת האותות → תרחיש + הסבר אנושי — זהה לחלוטין ל-buildWeeklySignals() המקורי. ══
  function buildWeeklySignals(calc, meas, profile) {
    var p = profile || {};
    var goal = p.goal;
    var wkg = p.currentWeight || p.weight || 75;
    var slopePctWeek = (calc.slopeKgPerWeek / wkg) * 100;

    var waistDown = meas.waist != null && meas.waist < -0.2;
    var waistUp   = meas.waist != null && meas.waist > 0.2;
    var armDown   = meas.arm != null && meas.arm < -0.2;
    var armUp     = meas.arm != null && meas.arm > 0.2;
    var weightDown = calc.slopeKgPerWeek < -0.1;
    var weightUp   = calc.slopeKgPerWeek > 0.1;
    var weightFlat = Math.abs(calc.slopeKgPerWeek) <= 0.1;

    var scenario = 'steady', redFlag = false;
    if (goal === 'cut') {
      if (slopePctWeek < -1.2 && armDown) { scenario = 'losing-muscle'; redFlag = true; }
      else if (waistDown && !armDown)     { scenario = 'clean-cut'; }
      else if (weightFlat && waistDown)   { scenario = 'recomp'; }
      else if (weightFlat && !waistDown)  { scenario = 'stalled'; }
      else if (weightDown)                { scenario = 'progress'; }
    } else if (goal === 'bulk') {
      if (weightUp && waistUp && !armUp)  { scenario = 'dirty-bulk'; redFlag = true; }
      else if (armUp && !waistUp)         { scenario = 'clean-bulk'; }
      else if (weightFlat)                { scenario = 'stalled-bulk'; }
      else if (weightUp)                  { scenario = 'gaining'; }
    } else {
      if (Math.abs(slopePctWeek) > 0.8) scenario = 'drift';
      else scenario = 'holding';
    }
    return { scenario: scenario, redFlag: redFlag, slopePctWeek: slopePctWeek, waistDown: waistDown, waistUp: waistUp, armDown: armDown, armUp: armUp, weightFlat: weightFlat };
  }

  // ══ חישוב הגירעון הבא — זהה בהתנהגות ל-computeNextDeficit() המקורי, פרט לכך ש-adaptRate
  // נקרא עם profile (הפרמטר) במקום עם userProfile הגלובלי — ראה הערת הכותרת. ══
  function computeNextDeficit(signals, profile) {
    var p = profile || {};
    var rate = ADAPT_RATES[adaptRate(p)];
    var goal = p.goal;
    var target = goal === 'cut' ? rate.cutTarget : goal === 'bulk' ? rate.bulkTarget : 0;
    var cur = (typeof p.currentDeficit === 'number') ? p.currentDeficit : 0;

    if (goal === 'maintain') return 0;

    if (signals.redFlag) {
      if (goal === 'cut')  cur = Math.min(0, cur + 100);
      else                 cur = Math.max(0, cur - 100);
      return cur;
    }

    if (goal === 'cut') {
      cur = Math.max(target, cur - rate.step);
    } else {
      cur = Math.min(target, cur + rate.step);
    }
    return cur;
  }

  // ══ בונה הצעת עדכון מלאה (בלי להחיל) — זהה לחלוטין ל-buildAdaptiveProposal() המקורי;
  // todayData מתקבל כפרמטר נוסף (נדרש ל-computeAdaptiveTdee הטהור). ══
  function buildAdaptiveProposal(history, profile, todayData) {
    var calc = computeAdaptiveTdee(history, profile, todayData);
    if (!calc.enoughData) return { ready: false, calc: calc };
    var meas = analyzeMeasurements(profile);
    var signals = buildWeeklySignals(calc, meas, profile);
    var nextDeficit = computeNextDeficit(signals, profile);
    var newGoal = Math.round(Math.max(1200, Math.min(5000, calc.tdee + nextDeficit)));
    var oldGoal = (profile || {}).goalKcal;
    return {
      ready: true, calc: calc, meas: meas, signals: signals,
      nextDeficit: nextDeficit, newGoal: newGoal, oldGoal: oldGoal,
      delta: newGoal - oldGoal
    };
  }

  // ── הסבר קצר מקומי (fallback אם אין רשת למאמן) — זהה לחלוטין ל-adaptiveLocalExplain() המקורי. ──
  function adaptiveLocalExplain(prop) {
    var s = prop.signals.scenario;
    var map = {
      'clean-cut': 'המשקל יורד, המותן קטֵן והזרוע נשמרת — בדיוק מה שרצינו.',
      'recomp': 'המשקל כמעט לא זז אבל המותן יורד — זה שריר שמחליף שומן. הצלחה.',
      'progress': 'המשקל יורד בקצב יפה. ממשיכים.',
      'stalled': 'המשקל נתקע — הגוף הסתגל, מורידים עוד קצת.',
      'losing-muscle': 'יורד מהר מדי והזרוע קטֵנה — מוסיפים קצת קלוריות ומאטים כדי לשמור על השריר.',
      'clean-bulk': 'הזרוע גדלה והמותן יציב — עלייה נקייה. ממשיכים לבנות.',
      'dirty-bulk': 'המשקל והמותן עולים מהר — מרככים קצת את העודף.',
      'stalled-bulk': 'העלייה נתקעה — מוסיפים עוד קצת דלק.',
      'gaining': 'עולה יפה במשקל. בכיוון.',
      'drift': 'יש סטייה קלה מהמשקל — מיישרים את היעד.',
      'holding': 'שומר יפה על המשקל. מכוונים מדויק.',
      'steady': 'לומד את הקצב שלך ומכייל את היעד.'
    };
    var dir = prop.delta > 0 ? 'מעלה' : prop.delta < 0 ? 'מוריד' : 'משאיר';
    return (map[s] || map.steady) + ' השבוע אני ' + dir + ' את היעד ל-' + prop.newGoal + ' קל׳. נראה איך המשקל וההיקפים מגיבים ונתקדם.';
  }

  var API = {
    ADAPT_RATES: ADAPT_RATES,
    KCAL_PER_KG: KCAL_PER_KG,
    ADAPT_WINDOW_DAYS: ADAPT_WINDOW_DAYS,
    ADAPT_MIN_DAYS: ADAPT_MIN_DAYS,
    ADAPT_MIN_WEIGHTS: ADAPT_MIN_WEIGHTS,
    ADAPT_MIN_SPAN: ADAPT_MIN_SPAN,
    ADAPT_CADENCE_DAYS: ADAPT_CADENCE_DAYS,
    ADAPT_MAX_STEP: ADAPT_MAX_STEP,
    PARTIAL_FRACTION: PARTIAL_FRACTION,
    adaptRate: adaptRate,
    adaptEnabled: adaptEnabled,
    daysInWindow: daysInWindow,
    classifyDay: classifyDay,
    pendingPartialDays: pendingPartialDays,
    computeAdaptiveTdee: computeAdaptiveTdee,
    analyzeMeasurements: analyzeMeasurements,
    buildWeeklySignals: buildWeeklySignals,
    computeNextDeficit: computeNextDeficit,
    buildAdaptiveProposal: buildAdaptiveProposal,
    adaptiveLocalExplain: adaptiveLocalExplain
  };

  if (typeof window !== 'undefined') { window.AdaptiveTdeeDomain = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
