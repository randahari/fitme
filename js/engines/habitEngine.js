// ══════════════════════════════════════════════════════════════════
// FitMe — Habit Engine (C1-WP9, Habit and Pattern Engine Extraction)
// אחריות בלעדית: זיהוי, תחזוקה ועדכון של הרגלי משתמש (STAGE 6 / TASK-002
// המקורי — detectors, מחזור-חיים, ו-runHabitEngine/runHabitEngineSingleFlight
// עצמם, ללא שינוי לוגי). לא כולל: המלצות, לוגיקת מאמן, זיהוי דפוסים מורכב,
// החלטות, יוזמות, UX. גם ה-run(ctx) הרשום מול EngineRegistry (בעבר בתוך
// app.js, B2 STAGE 8) עבר לכאן — אדפטר דק, קורא ל-runHabitEngineSingleFlight()
// בלבד. currentUser/userProfile/appVersion/sessionLifecycle/persistenceSummary
// (המשותף עם Pattern/Trigger) מוזרקים דרך configure() — אותו דפוס בדיוק כמו
// js/adaptive/adaptiveTdeeController.js ו-js/trigger/triggerController.js.
// AuthorityContract/DateUtils/StateAccess (B1/WP1/B3, יציבים, ללא override
// chain) נדרשים ישירות. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var AuthorityContract = (typeof module !== 'undefined' && module.exports)
    ? require('../authorityContract.js')
    : window.AuthorityContract;
  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;
  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // ── קבועים ──
  var HE_VERSION   = 1;
  var WINDOW_DAYS  = 42;   // חלון תצפית: 6 שבועות
  var INERTIA      = 0.6;  // אינרציית ביטחון (ריכוך; הפרעה זמנית ≠ מחיקה)
  var MAX_HABITS   = 60;   // תקרת אחסון (כולל לא-פעילים)

  // ספי מחזור-חיים (ביטחון 0..1 + מספר מופעים)
  var CONF_INACTIVE  = 0.20;
  var CONF_CANDIDATE = 0.30;
  var CONF_CONFIRMED = 0.55;
  var CONF_ACTIVE    = 0.68;
  var OCC_CANDIDATE  = 3;
  var OCC_CONFIRMED  = 5;

  // מרווח צפוי בין מופעים (ימים) — לחישוב "איחור" בהיחלשות/דעיכה
  var INTERVAL_DAILY  = 2;
  var INTERVAL_WEEKLY = 9;

  var WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // ── עזרי תאריך טהורים (מפתחות YYYY-MM-DD בזמן מקומי, עקבי עם DateUtils.dateKey) ──
  function toDate(k) { var p = String(k).split('-'); return new Date(+p[0], (+p[1]) - 1, +p[2]); }
  function daysBetween(aKey, bKey) { return Math.round((toDate(bKey) - toDate(aKey)) / 86400000); }
  function shiftKey(key, delta) { var d = toDate(key); d.setDate(d.getDate() + delta); return DateUtils.dateKey(d); }
  function weekIdxOf(startKey, key) { return Math.floor(daysBetween(startKey, key) / 7); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function trailingTrue(series) { var n = 0; for (var i = series.length - 1; i >= 0; i--) { if (series[i]) n++; else break; } return n; }

  // שעת הארוחה כמספר שלם (או null אם חסר/לא תקין)
  function mealHour(m) {
    if (!m || typeof m.time !== 'string') return null;
    var h = parseInt(m.time.split(':')[0], 10);
    return (isNaN(h) || h < 0 || h > 23) ? null : h;
  }
  // שיוך שעה למקטע-יום
  function inPart(h, part) {
    if (part === 'morning') return h >= 5 && h < 11;
    if (part === 'midday')  return h >= 11 && h < 16;
    if (part === 'evening') return h >= 16 && h < 22;
    if (part === 'night')   return h >= 22 || h < 5;
    return false;
  }
  function ratioLabel(r) { return r >= 0.85 ? 'כמעט תמיד' : r >= 0.6 ? 'לרוב' : 'לעיתים'; }

  // מבנה אות (signal) אחיד שכל גלאי מחזיר
  function makeSignal(type, key, description, frequency, occ, expected, streak, srcDates, period) {
    return {
      id: type + ':' + key, type: type, key: key, description: description, frequency: frequency,
      occ: occ, expected: expected, streak: streak, period: period,
      lastDay: srcDates.length ? srcDates[srcDates.length - 1] : null,
      sourceDates: srcDates
    };
  }

  // ── בניית התצפיות מהחלון (מהיסטוריה + מהפרופיל שכבר בזיכרון) ──
  // B3: bodyHistory מגיע כפרמטר מפורש (State Access snapshot) במקום קריאה
  // ישירה ל-userProfile.weightHistory/.measurementHistory — הלוגיקה זהה.
  function buildObservations(history, bodyHistory, today) {
    var windowStart = shiftKey(today, -(WINDOW_DAYS - 1));
    var days = [];
    Object.keys(history || {}).forEach(function (key) {
      if (key < windowStart || key > today) return; // השוואת מחרוזות תקינה ל-YYYY-MM-DD
      var d = history[key] || {};
      var meals = Array.isArray(d.meals) ? d.meals : [];
      var hours = meals.map(mealHour).filter(function (h) { return h != null; });
      days.push({
        key: key,
        weekday: toDate(key).getDay(),
        weekIdx: weekIdxOf(windowStart, key),
        hasMeal: meals.length > 0,
        hasTimedMeal: hours.length > 0,
        hours: hours,
        workout: (d.burned || 0) > 0
      });
    });
    days.sort(function (a, b) { return (a.key < b.key ? -1 : 1); });

    var inWin = function (k) { return k && k >= windowStart && k <= today; };
    var weightDates = ((bodyHistory && bodyHistory.weightHistory) || [])
      .map(function (w) { return w && w.date; }).filter(inWin).sort();
    var measureDates = ((bodyHistory && bodyHistory.measurementHistory) || [])
      .map(function (m) { return m && m.date; }).filter(inWin).sort();

    // שבועות "פעילים" = שבוע עם פעילות כלשהי (ארוחה/אימון/שקילה/מדידה).
    // כך חופשה/מחלה (שבוע ללא פעילות) אינם נספרים לרעת ההרגל.
    var activeSet = {};
    days.forEach(function (d) { if (d.hasMeal || d.workout) activeSet[d.weekIdx] = true; });
    weightDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    measureDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    var activeWeeks = Object.keys(activeSet).map(Number).sort(function (a, b) { return a - b; });

    return { today: today, windowStart: windowStart, days: days, weightDates: weightDates, measureDates: measureDates, activeWeeks: activeWeeks };
  }

  // ── גלאי תזונה: מקטעי-יום קבועים + עקביות רישום שבועית ──
  function detectNutrition(obs) {
    var out = [];
    var timedDays = obs.days.filter(function (d) { return d.hasTimedMeal; });
    var active = timedDays.length;

    if (active >= 5) {
      var parts = [['morning', 'בוקר'], ['midday', 'צהריים'], ['evening', 'ערב'], ['night', 'לילה']];
      parts.forEach(function (pair) {
        var partKey = pair[0], name = pair[1];
        var series = timedDays.map(function (d) { return d.hours.some(function (h) { return inPart(h, partKey); }); });
        var occ = series.filter(Boolean).length;
        var ratio = occ / active;
        if (occ >= OCC_CANDIDATE && ratio >= 0.5) {
          var src = timedDays.filter(function (d, i) { return series[i]; }).map(function (d) { return d.key; });
          out.push(makeSignal('nutrition', 'meal:' + partKey, 'ארוחת ' + name + ' קבועה',
            ratioLabel(ratio), occ, active, trailingTrue(series), src, 'daily'));
        }
      });
    }

    // עקביות רישום שבועית: שבוע "מתועד היטב" = לפחות ~4/7 מהימים שבו כוללים ארוחה
    var weeks = {};
    obs.days.forEach(function (d) {
      var w = weeks[d.weekIdx] || (weeks[d.weekIdx] = { idx: d.weekIdx, present: 0, mealDays: 0, lastKey: d.key });
      w.present++; if (d.hasMeal) w.mealDays++;
      if (d.key > w.lastKey) w.lastKey = d.key;
    });
    var ordered = Object.values(weeks).filter(function (w) { return w.present >= 3; }).sort(function (a, b) { return a.idx - b.idx; });
    if (ordered.length >= 3) {
      var series2 = ordered.map(function (w) { return (w.mealDays / w.present) >= 0.57; });
      var occ2 = series2.filter(Boolean).length;
      if (occ2 >= OCC_CANDIDATE) {
        var src2 = ordered.filter(function (w, i) { return series2[i]; }).map(function (w) { return w.lastKey; });
        out.push(makeSignal('nutrition', 'log-consistency', 'רישום אוכל עקבי',
          occ2 + '/' + ordered.length + ' שבועות', occ2, ordered.length, trailingTrue(series2), src2, 'weekly'));
      }
    }
    return out;
  }

  // ── גלאי אימונים: הרגל אימון קבוע לפי יום-בשבוע (תומך בשגרות מרובות) ──
  function detectWorkout(obs) {
    var out = [];
    if (obs.activeWeeks.length < 3) return out;
    var startWd = toDate(obs.windowStart).getDay();
    var todayOffset = daysBetween(obs.windowStart, obs.today);
    var dayByKey = {}; obs.days.forEach(function (d) { dayByKey[d.key] = d; });

    for (var wd = 0; wd < 7; wd++) {
      var series = [], src = [];
      obs.activeWeeks.forEach(function (wi) {
        var off = wi * 7 + ((wd - startWd + 7) % 7);
        if (off < 0 || off > todayOffset) return; // היום-בשבוע לא נופל בחלון עבור שבוע זה
        var dk = shiftKey(obs.windowStart, off);
        var worked = !!(dayByKey[dk] && dayByKey[dk].workout);
        series.push(worked);
        if (worked) src.push(dk);
      });
      var occ = series.filter(Boolean).length;
      var exp = series.length;
      if (exp >= 3 && occ >= OCC_CANDIDATE && (occ / exp) >= 0.5) {
        out.push(makeSignal('workout', 'weekday:' + wd, 'אימון קבוע ביום ' + WEEKDAY_HE[wd],
          occ + '/' + exp + ' שבועות', occ, exp, trailingTrue(series), src, 'weekly'));
      }
    }
    return out;
  }

  // ── גלאי שקילה: הרגל שקילה שבועי (התנהגות הרישום, לא ערך המשקל) ──
  function detectWeight(obs) {
    return weeklyLogHabit(obs, obs.weightDates, 'weight', 'weigh-in', 'שקילה שבועית קבועה');
  }
  // ── גלאי היקפים: הרגל מדידה שבועי ──
  function detectMeasurement(obs) {
    return weeklyLogHabit(obs, obs.measureDates, 'measurement', 'measure', 'מדידת היקפים קבועה');
  }
  // עזר משותף לשני הגלאים השבועיים לעיל (מונע כפילות לוגיקה)
  function weeklyLogHabit(obs, dates, type, key, description) {
    var out = [];
    if (obs.activeWeeks.length < 3) return out;
    var hitWeeks = {}; dates.forEach(function (k) { hitWeeks[weekIdxOf(obs.windowStart, k)] = true; });
    var lastInWeek = {};
    dates.forEach(function (k) { var w = weekIdxOf(obs.windowStart, k); if (!lastInWeek[w] || k > lastInWeek[w]) lastInWeek[w] = k; });
    var series = obs.activeWeeks.map(function (wi) { return !!hitWeeks[wi]; });
    var occ = series.filter(Boolean).length;
    var exp = obs.activeWeeks.length;
    if (occ >= OCC_CANDIDATE && (occ / exp) >= 0.5) {
      var src = obs.activeWeeks.filter(function (wi) { return !!hitWeeks[wi]; }).map(function (wi) { return lastInWeek[wi]; });
      out.push(makeSignal(type, key, description, occ + '/' + exp + ' שבועות', occ, exp, trailingTrue(series), src, 'weekly'));
    }
    return out;
  }

  // ── מחזור-חיים: קביעת סטטוס דטרמיניסטית מביטחון + מופעים + רעננות ──
  // Observed → Candidate → Confirmed → Active → Weakening → Inactive
  function statusOf(conf, occ, daysSince, interval) {
    var late = interval > 0 ? daysSince / interval : 0;
    if (conf < CONF_INACTIVE || late > 4) return 'inactive';
    if (occ < OCC_CANDIDATE || conf < CONF_CANDIDATE) return 'observed';
    if (occ < OCC_CONFIRMED || conf < CONF_CONFIRMED) return 'candidate';
    if (late > 1.5) return 'weakening';        // מבוסס אך מחליק
    if (conf < CONF_ACTIVE) return 'confirmed'; // מוצק אך לא "פעיל" חזק
    return 'active';                            // חזק + בקצב
  }

  // עדכון/יצירה מתוך אות נוכחי
  function upsertFromSignal(prev, sig, todayKey) {
    var rawC = clamp01(sig.expected > 0 ? sig.occ / sig.expected : 0);
    var conf = prev ? round2(prev.confidence * INERTIA + rawC * (1 - INERTIA)) : round2(rawC * 0.5);
    var interval = sig.period === 'weekly' ? INTERVAL_WEEKLY : INTERVAL_DAILY;
    var daysSince = sig.lastDay ? daysBetween(sig.lastDay, todayKey) : 0;
    return {
      id: sig.id, type: sig.type, key: sig.key,
      description: sig.description, frequency: sig.frequency,
      confidence: conf, consistency: round2(rawC), streak: sig.streak,
      status: statusOf(conf, sig.occ, daysSince, interval),
      firstObserved: prev ? prev.firstObserved : (sig.sourceDates[0] || todayKey),
      lastObserved: sig.lastDay || (prev ? prev.lastObserved : todayKey),
      period: sig.period, expectedIntervalDays: interval,
      sourceEvents: { count: sig.occ, window: WINDOW_DAYS, dates: sig.sourceDates.slice(-12) }
    };
  }

  // דעיכה להרגל ששמור אך לא הופיע בריצה הזו (נשמר — לעולם לא נמחק)
  function decayAbsent(prev, todayKey) {
    var conf = round2((prev.confidence || 0) * INERTIA);
    var interval = prev.expectedIntervalDays || (prev.period === 'weekly' ? INTERVAL_WEEKLY : INTERVAL_DAILY);
    var occ = (prev.sourceEvents && prev.sourceEvents.count) || 0;
    var daysSince = prev.lastObserved ? daysBetween(prev.lastObserved, todayKey) : 999;
    return Object.assign({}, prev, {
      confidence: conf,
      consistency: round2((prev.consistency || 0) * INERTIA),
      status: statusOf(conf, occ, daysSince, interval)
    });
  }

  // ── מתזמר: פעם ביום, ברקע, כותב ל-coachMemory.habits ──
  // B3: access (EngineStateAccess, scoped habitEngine/RECOMPUTE) מגיע מהאדפטר
  // או מ-runHabitEngineSingleFlight(). כל הגישה ל-userProfile/saveProfile עברה
  // ל-access.read/access.write — הלוגיקה עצמה (גלאים, upsert, דעיכה, תקרה)
  // ללא שינוי. coachMemory.lastUpdated המשותף אינו נכתב עוד (B3 SPEC §6.2) —
  // ה-timestamp עבר לתוך habitsMeta.lastUpdated.
  async function runHabitEngine(access) {
    try {
      var currentUser = deps.getCurrentUser();
      var userProfile = deps.getUserProfile();
      if (!currentUser || !userProfile || !access) return deps.persistenceSummaryFn(null);
      var today = DateUtils.getTodayKey();

      var currentView = access.read.habitView();
      if (currentView.habitsMeta && currentView.habitsMeta.lastRun === today) return deps.persistenceSummaryFn(null); // שער: ריצה אחת ביום

      var history = await access.read.nutritionActivityHistory();
      var body = access.read.bodyHistory();
      var obs = buildObservations(history, body, today);
      var signals = [].concat(
        detectNutrition(obs), detectWorkout(obs), detectWeight(obs), detectMeasurement(obs)
      );

      var byId = {}; signals.forEach(function (s) { byId[s.id] = s; });
      var prevHabits = currentView.habits || [];
      var prevById = {}; prevHabits.forEach(function (h) { prevById[h.id] = h; });

      var next = [];
      signals.forEach(function (s) { next.push(upsertFromSignal(prevById[s.id] || null, s, today)); });
      prevHabits.forEach(function (h) { if (!byId[h.id]) next.push(decayAbsent(h, today)); }); // שמירה + דעיכה

      // תקרת אחסון: שומרים את בעלי הביטחון הגבוה (הלא-פעילים נשמרים עד התקרה)
      if (next.length > MAX_HABITS) {
        next.sort(function (a, b) { return (b.confidence || 0) - (a.confidence || 0); });
        next.length = MAX_HABITS;
      }

      // REM-003 §Recommended Additions — Authority Metadata: Path B (Deterministic Evidence),
      // אינה נוגעת בלוגיקת הזיהוי/מחזור-החיים של המנוע עצמו.
      var habitsMeta = {
        lastRun: today, version: HE_VERSION, lastUpdated: Date.now(), // B3 §6.2: timestamp דומיין-ספציפי
        authority: AuthorityContract.buildAuthorityMetadata({
          source: AuthorityContract.AUTHORITY_SOURCES.HABIT_ENGINE,
          createdBy: currentUser && currentUser.uid,
          rule: 'habitEngine.recompute.v1',
          systemVersion: deps.appVersion
        })
      };
      var result = await access.write.replaceDerivedHabitView({ habits: next, habitsMeta: habitsMeta });
      if (result.status !== 'APPLIED') console.error('runHabitEngine: write failed', result.error);
      return deps.persistenceSummaryFn(result);
    } catch (e) {
      console.error('runHabitEngine:', e);
      return deps.persistenceSummaryFn(null);
    }
  }

  // ── B2 Code Review Round 4: Habit Engine single-flight ──
  // עוטף את runHabitEngine() הקיים (לא נוגע בו) כדי שרק ריצה אחת בפועל תהיה
  // active בכל רגע נתון — ללא תלות בסדר ההרצה של ה-Registry מול הקריאה הפנימית
  // של Pattern Engine (ואינו נשען עוד על tie-break לקסיקוגרפי, כנדרש ב-Review).
  // session-safe: in-flight Promise משותף רק בתוך אותה session generation; אינו
  // נגזל בין sessions. לא נוגע ב-once-per-day gate ולא בלוגיקה העסקית של Habit.
  // B3: מקבל access אופציונלי (מהאדפטר של habitEngine). כשל Pattern קורא ללא
  // access (הקריאה הפנימית שלו אינה מחזיקה capability של habitEngine — B3 §8.1
  // כלל 6: "One engine's capability SHALL never be delivered to another engine")
  // — הפונקציה יוצרת capability habitEngine/RECOMPUTE משלה, כי החישוב עצמו
  // תמיד רץ תחת הזהות של Habit Engine, לא של מי שהפעיל אותו.
  var _habitInFlight = null; // { generation, promise } | null
  function runHabitEngineSingleFlight(access) {
    var gen = deps.sessionLifecycle.getGeneration();
    if (_habitInFlight && _habitInFlight.generation === gen) {
      return _habitInFlight.promise; // אותה session, ריצה כבר פעילה — שיתוף
    }
    var effectiveAccess = access || StateAccess.createEngineAccess({
      engineId: 'habitEngine', action: 'RECOMPUTE',
      userId: deps.getCurrentUser() && deps.getCurrentUser().uid, sessionGeneration: gen, runId: null
    });
    var p = runHabitEngine(effectiveAccess).finally(function () {
      if (_habitInFlight && _habitInFlight.promise === p) _habitInFlight = null;
    });
    _habitInFlight = { generation: gen, promise: p };
    return p;
  }

  // Habit Engine — B2 SPEC §17. אדפטר דק: קורא ל-runHabitEngineSingleFlight()
  // (עטיפת single-flight מעל runHabitEngine() הקיים — B2 Code Review Round 4).
  // action מפורש נדרש כעת מכל engine (גם עם action יחיד) — Round 4: אין יותר
  // "אין ולידציה כי יש רק action אחד"; ה-Registry עצמו כבר מדלג אם לא סופק
  // action כלל, וכאן נבדק גם שהערך שכן סופק הוא הצפוי. נרשם מול EngineRegistry
  // דרך js/engines/registerEngines.js (C1-WP9).
  async function run(ctx) {
    if (ctx.action !== 'RECOMPUTE') return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'not a habitEngine action' } };
    // B3: context.state הוא הערוץ היחיד להעברת ה-capability — נוצר כאן
    // (trusted adapter), לא על ידי ה-Registry ולא ניתן ל-override מה-caller
    // החיצוני (EngineRunRequest אינו מכיל state כלל — engineRegistry.js אינו
    // מעתיק שדה כזה כשהוא בונה context). run(context) לא השתנה — אין ערוץ
    // מקביל כמו run(context, access).
    ctx.state = StateAccess.createEngineAccess({
      engineId: 'habitEngine', action: ctx.action,
      userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId
    });
    var persistence = await runHabitEngineSingleFlight(ctx.state);
    // B4 §27: persistence outcome מדווח דרך output.persistence — לא top-level
    // EngineRunResult.persistence (js/engineRegistry.js:normalizeResult סגור/לא נוגעים בו).
    return { status: 'SUCCESS', output: { persistence: persistence } };
  }

  var API = {
    VERSION: HE_VERSION,
    configure: configure,
    runHabitEngine: runHabitEngine,
    runHabitEngineSingleFlight: runHabitEngineSingleFlight,
    run: run
  };

  if (typeof window !== 'undefined') { window.HabitEngine = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
