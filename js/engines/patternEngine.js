// ══════════════════════════════════════════════════════════════════
// FitMe — Pattern Engine (C1-WP9, Habit and Pattern Engine Extraction)
// אחריות בלעדית: זיהוי ותחזוקה של דפוסי התנהגות חוזרים (STAGE 7 / TASK-003
// המקורי — detectors, fingerprint, ו-runPatternEngine עצמו, ללא שינוי לוגי).
// שכבת תצפית בלבד. לא כולל: המלצות, קואצ'ינג, יוזמות, החלטות, AI, UI. גם
// ה-run(ctx) הרשום מול EngineRegistry (בעבר בתוך app.js, B2 STAGE 8) עבר
// לכאן. currentUser/userProfile/appVersion/persistenceSummary (המשותף עם
// Habit/Trigger) מוזרקים דרך configure() — אותו דפוס בדיוק כמו
// js/adaptive/adaptiveTdeeController.js. AuthorityContract/DateUtils/
// StateAccess (B1/WP1/B3, יציבים) ו-HabitEngine (WP9, לקריאה הפנימית ל-
// runHabitEngineSingleFlight — B2 SPEC §11 כלל 10, לא הופך ל-registry
// dependency) נדרשים ישירות. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
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
  var HabitEngine = (typeof module !== 'undefined' && module.exports)
    ? require('./habitEngine.js')
    : window.HabitEngine;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // ── קבועים (מיושרים ל-TASK-002 לעקביות) ──
  var PE_VERSION    = 1;
  var PE_WINDOW     = 90;   // חלון תצפית: 90 יום (מתגלגל, מעוגן ל-lastDataDay) — דפוסים ארוכי-טווח
  var OCC_CANDIDATE = 3;
  var OCC_CONFIRMED = 5;
  var C_INACTIVE = 0.20, C_CANDIDATE = 0.30, C_CONFIRMED = 0.55, C_ACTIVE = 0.68;
  var PE_INERTIA = 0.6;              // אינרציית מחזור-חיים — הדרגתיות דו-כיוונית
  var MISS_INACTIVE_PERIODS = 3;     // תקופות היעדר-תמיכה רצופות עד inactive
  var CONF_SEED = 0.5;               // ריכוך ביטחון ראשוני (דפוס חדש אינו קופץ ל-active)
  var WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // ── עזרים טהורים פרטיים (עותק עצמאי — בלי צימוד למנועים אחרים) ──
  function toDate(k) { var p = String(k).split('-'); return new Date(+p[0], (+p[1]) - 1, +p[2]); }
  function shiftKey(k, delta) { var d = toDate(k); d.setDate(d.getDate() + delta); return DateUtils.dateKey(d); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }
  function weekIdxOf(start, k) { return Math.floor(daysBetween(start, k) / 7); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function mealHour(m) { if (!m || typeof m.time !== 'string') return null; var h = parseInt(m.time.split(':')[0], 10); return (isNaN(h) || h < 0 || h > 23) ? null : h; }
  function partOf(h) { if (h >= 5 && h < 11) return 'morning'; if (h >= 11 && h < 16) return 'midday'; if (h >= 16 && h < 22) return 'evening'; return 'night'; }
  function partHe(p) { return p === 'morning' ? 'בוקר' : p === 'midday' ? 'צהריים' : p === 'evening' ? 'ערב' : 'לילה'; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function std(a) { if (a.length < 2) return 0; var m = mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / a.length); }
  function hashStr(s) {
    var h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
    for (var i = 0; i < s.length; i++) { var ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  // ISSUE 3/4: מקור יחיד למשקל אפקטיבי — משמש גם לסף החלבון וגם ל-fingerprint
  function effectiveWeight(profile) { return (profile && profile.currentWeight) || (profile && profile.weight) || 75; }

  // ── קטלוג סגור: ולידציה + מטא סטטי לפי ID (לתחזוקת רשומות inactive יציבות) ──
  function isCatalogId(id) {
    if (id === 'time.first_meal_window' || id === 'time.last_meal_window') return true;
    if (/^weekday\.(active|skip)\.[0-6]$/.test(id)) return true;
    if (id === 'sequence.workout_day_high_protein' || id === 'sequence.workout_back_to_back' || id === 'sequence.rest_after_workout' || id === 'sequence.weigh_measure_together') return true;
    if (id === 'frequency.meals_per_day' || id === 'frequency.workouts_per_week') return true;
    return false;
  }
  function periodOf(id) { if (id.indexOf('time.') === 0) return 'daily'; if (id.indexOf('weekday.') === 0) return 'weekly'; if (id.indexOf('sequence.') === 0) return 'sequence'; if (id === 'frequency.meals_per_day') return 'daily'; return 'weekly'; }
  function staticDescription(id) {
    if (id === 'time.first_meal_window') return 'חלון הארוחה הראשונה';
    if (id === 'time.last_meal_window') return 'חלון הארוחה האחרונה';
    var wm = id.match(/^weekday\.(active|skip)\.([0-6])$/);
    if (wm) return 'יום ' + WEEKDAY_HE[+wm[2]] + (wm[1] === 'active' ? ' מתועד בקביעות' : ' מדולג בקביעות');
    if (id === 'sequence.workout_day_high_protein') return 'ביום אימון נוטה חלבון גבוה';
    if (id === 'sequence.workout_back_to_back') return 'אימון נוטה להימשך ביום העוקב';
    if (id === 'sequence.rest_after_workout') return 'אימון נוטה להיות מלווה במנוחה ביום העוקב';
    if (id === 'sequence.weigh_measure_together') return 'שקילה ומדידה נרשמות יחד';
    if (id === 'frequency.meals_per_day') return 'מספר ארוחות ביום';
    if (id === 'frequency.workouts_per_week') return 'מספר אימונים בשבוע';
    return id;
  }
  // ── Lifecycle חוצה-ריצות: previous record משמש ל-Lifecycle Metadata בלבד ──
  // strength/evidenceCount/opportunityCount נגזרים תמיד טריים מהמקור; מהרשומה הקודמת נקראים
  // רק confidence / status / firstSeen / lastSeen / missedPeriods.
  function minDate(a, b) { if (!a) return b || null; if (!b) return a; return a < b ? a : b; }
  function maxDate(a, b) { if (!a) return b || null; if (!b) return a; return a > b ? a : b; }

  // absence מכריע: היעדר מתמשך → inactive; היעדר קצר → weakening תמיד,
  // כך שהפרעה זמנית לעולם אינה מקפיצה דפוס ישירות ל-inactive.
  function statusOf(confidence, evidenceCount, missedPeriods) {
    if (missedPeriods >= MISS_INACTIVE_PERIODS) return 'inactive';
    if (missedPeriods > 0) return 'weakening';
    if (confidence < C_INACTIVE) return 'inactive';
    if (evidenceCount < OCC_CANDIDATE || confidence < C_CANDIDATE) return 'observed';
    if (evidenceCount < OCC_CONFIRMED || confidence < C_CONFIRMED) return 'candidate';
    if (confidence < C_ACTIVE) return 'confirmed';
    return 'active';
  }

  // דפוס נתמך. שדות נגזרי-מקור תמיד טריים; שדות Lifecycle זזים רק בתקופת הערכה חדשה (advance).
  function upsertSupported(prev, sig, advance) {
    var rawSupport = sig.opportunityCount ? (sig.evidenceCount / sig.opportunityCount) * Math.min(1, sig.opportunityCount / OCC_CONFIRMED) : 0;
    var interval = sig.period === 'daily' ? 2 : 9;
    var src = {
      strength: round2(sig.rawStrength), evidenceCount: sig.evidenceCount,
      opportunityCount: sig.opportunityCount, sampleDates: sig.sampleDates.slice(-12), meta: sig.meta
    };
    var confidence, missedPeriods, status, firstSeen, lastSeen;
    if (!prev) {
      // דפוס חדש — נוצר גם ללא תקופת הערכה חדשה, במצב ראשוני שמרני
      confidence = round2(rawSupport * CONF_SEED); missedPeriods = 0;
      firstSeen = sig.firstSupported; lastSeen = sig.lastSupported;
      status = statusOf(confidence, sig.evidenceCount, 0);
    } else if (advance) {
      // תקופת הערכה חדשה → צעד Lifecycle יחיד (התחזקות הדרגתית)
      confidence = round2(prev.confidence * PE_INERTIA + rawSupport * (1 - PE_INERTIA));
      missedPeriods = 0;
      firstSeen = minDate(prev.firstSeen, sig.firstSupported);
      lastSeen = maxDate(prev.lastSeen, sig.lastSupported);
      status = statusOf(confidence, sig.evidenceCount, 0);
    } else {
      // source recompute בלבד — Lifecycle קפוא לחלוטין
      confidence = prev.confidence;
      missedPeriods = prev.missedPeriods || 0;
      status = prev.status;
      firstSeen = prev.firstSeen;
      lastSeen = maxDate(prev.lastSeen, sig.lastSupported); // רק קדימה, לעולם לא אחורה
    }
    return Object.assign({
      id: sig.id, category: sig.category, description: sig.description,
      confidence: confidence, status: status, firstSeen: firstSeen, lastSeen: lastSeen,
      missedPeriods: missedPeriods, period: sig.period, expectedIntervalDays: interval,
      window: PE_WINDOW, patternVersion: PE_VERSION
    }, src);
  }

  // דפוס קיים ללא תמיכה במקור: אינו נמחק. שדות נגזרי-מקור מתאפסים; Lifecycle דועך רק בתקופה חדשה.
  function carryAbsent(prev, advance) {
    var src = { strength: 0, evidenceCount: 0, opportunityCount: 0, sampleDates: [] };
    if (!advance) {
      // source recompute בלבד — confidence/missedPeriods/status/firstSeen/lastSeen ללא שינוי
      return Object.assign({}, prev, src, { window: PE_WINDOW, patternVersion: PE_VERSION });
    }
    var missedPeriods = (prev.missedPeriods || 0) + 1;
    var confidence = round2((prev.confidence || 0) * PE_INERTIA);
    return Object.assign({}, prev, src, {
      confidence: confidence, missedPeriods: missedPeriods,
      status: statusOf(confidence, 0, missedPeriods),
      firstSeen: prev.firstSeen || null, lastSeen: prev.lastSeen || null,
      window: PE_WINDOW, patternVersion: PE_VERSION
    });
  }

  // ── תצפית: חלון מעוגן ל-lastDataDay (לא ל-today הקלנדרי) ──
  // B3: weightData הוא State Access snapshot מוגבל ({weightHistory,
  // measurementHistory, currentWeight, weight}) — לא reference חי ל-userProfile.
  // מוטבע ב-obs.weightSnapshot (במקום obs.profile הישן) לשימוש effectiveWeight().
  function buildObservation(history, weightData, todayKey) {
    var keys = Object.keys(history || {}).filter(function (k) { return k <= todayKey; });
    var wAll = ((weightData && weightData.weightHistory) || []).map(function (w) { return w && w.date; }).filter(function (d) { return d && d <= todayKey; });
    var mAll = ((weightData && weightData.measurementHistory) || []).map(function (m) { return m && m.date; }).filter(function (d) { return d && d <= todayKey; });
    var dataDays = keys.filter(function (k) { var d = history[k] || {}; return (Array.isArray(d.meals) && d.meals.length > 0) || ((d.burned || 0) > 0); });
    var anchors = dataDays.concat(wAll, mAll);
    if (!anchors.length) return null;
    var lastDataDay = anchors[0]; anchors.forEach(function (k) { if (k > lastDataDay) lastDataDay = k; });
    var windowStart = shiftKey(lastDataDay, -(PE_WINDOW - 1));
    var n = daysBetween(windowStart, lastDataDay);
    var calendar = [];
    for (var i = 0; i <= n; i++) {
      var dk = shiftKey(windowStart, i);
      var d = history[dk] || {};
      var meals = Array.isArray(d.meals) ? d.meals : [];
      var hours = meals.map(mealHour).filter(function (h) { return h != null; });
      calendar.push({
        key: dk, weekday: toDate(dk).getDay(), weekIdx: weekIdxOf(windowStart, dk),
        hasMeal: meals.length > 0, mealCount: meals.length,
        firstHour: hours.length ? Math.min.apply(null, hours) : null,
        lastHour: hours.length ? Math.max.apply(null, hours) : null,
        protein: meals.reduce(function (s, m) { return s + (m.protein || 0); }, 0),
        workout: (d.burned || 0) > 0
      });
    }
    var inWin = function (k) { return k >= windowStart && k <= lastDataDay; };
    var weightDates = wAll.filter(inWin).sort();
    var measureDates = mAll.filter(inWin).sort();
    var activeSet = {};
    calendar.forEach(function (c) { if (c.hasMeal || c.workout) activeSet[c.weekIdx] = true; });
    weightDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    measureDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    var activeWeekSet = {}; Object.keys(activeSet).forEach(function (w) { activeWeekSet[w] = true; });
    return { todayKey: todayKey, lastDataDay: lastDataDay, windowStart: windowStart, calendar: calendar, weightDates: weightDates, measureDates: measureDates, activeWeekSet: activeWeekSet, weightSnapshot: weightData };
  }

  // מבנה אות אחיד + חישוב evidence/opportunity/missedSinceLast
  function finalize(id, category, description, period, supported, opportunities, rawStrength, meta) {
    var supDates = supported.slice().sort();
    var last = supDates.length ? supDates[supDates.length - 1] : null;
    var missedSinceLast = last == null ? 0 : opportunities.filter(function (o) { return !o.supported && o.date > last; }).length;
    return {
      id: id, category: category, description: description, period: period,
      evidenceCount: supDates.length, opportunityCount: opportunities.length,
      firstSupported: supDates.length ? supDates[0] : null, lastSupported: last,
      missedSinceLast: missedSinceLast, rawStrength: clamp01(rawStrength), meta: meta || {}, sampleDates: supDates
    };
  }

  // ── גלאי Time: חלון היום של הארוחה הראשונה/האחרונה (גבולות יום קלנדרי בלבד) ──
  function detectTime(obs) {
    var out = [];
    var timed = obs.calendar.filter(function (c) { return c.firstHour != null; });
    if (timed.length < 5) return out;
    [['first_meal_window', 'firstHour', 'ראשונה'], ['last_meal_window', 'lastHour', 'אחרונה']].forEach(function (t) {
      var key = t[0], field = t[1], he = t[2];
      var counts = {}; timed.forEach(function (c) { var p = partOf(c[field]); counts[p] = (counts[p] || 0) + 1; });
      var modal = null, mx = -1; Object.keys(counts).forEach(function (p) { if (counts[p] > mx) { mx = counts[p]; modal = p; } });
      var opportunities = timed.map(function (c) { return { date: c.key, supported: partOf(c[field]) === modal }; });
      var supported = opportunities.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var ratio = supported.length / timed.length;
      if (supported.length >= OCC_CANDIDATE && ratio >= 0.5) {
        out.push(finalize('time.' + key, 'time', 'ארוחה ' + he + ' קבועה ב' + partHe(modal), 'daily', supported, opportunities, ratio, { part: modal }));
      }
    });
    return out;
  }

  // ── גלאי Weekday: נטייה יציבה של יום-בשבוע להיות מתועד/מדולג (ללא Locale) ──
  function detectWeekday(obs) {
    var out = [];
    for (var wd = 0; wd < 7; wd++) {
      var opp = obs.calendar.filter(function (c) { return c.weekday === wd && obs.activeWeekSet[c.weekIdx]; });
      if (opp.length < OCC_CANDIDATE) continue;
      var mealCount = opp.filter(function (c) { return c.hasMeal; }).length;
      var ratioActive = mealCount / opp.length;
      if (ratioActive >= 0.6) {
        var oppA = opp.map(function (c) { return { date: c.key, supported: c.hasMeal }; });
        var supA = oppA.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
        out.push(finalize('weekday.active.' + wd, 'weekday', 'יום ' + WEEKDAY_HE[wd] + ' מתועד בקביעות', 'weekly', supA, oppA, Math.abs(ratioActive - 0.5) * 2, { weekday: wd, tendency: 'active' }));
      } else if (ratioActive <= 0.4) {
        var oppS = opp.map(function (c) { return { date: c.key, supported: !c.hasMeal }; });
        var supS = oppS.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
        out.push(finalize('weekday.skip.' + wd, 'weekday', 'יום ' + WEEKDAY_HE[wd] + ' מדולג בקביעות', 'weekly', supS, oppS, Math.abs(ratioActive - 0.5) * 2, { weekday: wd, tendency: 'skip' }));
      }
    }
    return out;
  }

  // ── גלאי Sequence: association באותו יום + מעברי יום עוקבים (גרעיניות יום) ──
  function detectSequence(obs) {
    var out = [];
    var cal = obs.calendar;
    var byKey = {}; cal.forEach(function (c) { byKey[c.key] = c; });
    var weight = effectiveWeight(obs.weightSnapshot);     // ISSUE 4: משקל אפקטיבי (אותו helper כמו ב-fingerprint)
    var highThresh = Math.round(weight * 1.8) * 0.9;

    var woMeal = cal.filter(function (c) { return c.workout && c.hasMeal; });
    var nonWoMeal = cal.filter(function (c) { return !c.workout && c.hasMeal; });
    if (woMeal.length >= OCC_CANDIDATE && nonWoMeal.length >= OCC_CANDIDATE) {
      var oppP = woMeal.map(function (c) { return { date: c.key, supported: c.protein >= highThresh }; });
      var supP = oppP.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condP = supP.length / woMeal.length;
      var baseP = nonWoMeal.filter(function (c) { return c.protein >= highThresh; }).length / nonWoMeal.length;
      if (condP > baseP && supP.length >= 1) {
        var rsP = baseP < 1 ? clamp01((condP - baseP) / (1 - baseP)) : 0;
        out.push(finalize('sequence.workout_day_high_protein', 'sequence', 'ביום אימון נוטה חלבון גבוה', 'sequence', supP, oppP, rsP, { cond: round2(condP), base: round2(baseP) }));
      }
    }

    var woRate = cal.filter(function (c) { return c.workout; }).length / cal.length;
    var pairs = cal.filter(function (c) { return c.workout && byKey[shiftKey(c.key, 1)]; });
    if (pairs.length >= OCC_CANDIDATE) {
      var oppBB = pairs.map(function (c) { return { date: c.key, supported: byKey[shiftKey(c.key, 1)].workout }; });
      var supBB = oppBB.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condBB = supBB.length / pairs.length;
      if (condBB > woRate && supBB.length >= 1) {
        out.push(finalize('sequence.workout_back_to_back', 'sequence', 'אימון נוטה להימשך ביום העוקב', 'sequence', supBB, oppBB, clamp01((condBB - woRate) / ((1 - woRate) || 1)), { cond: round2(condBB), base: round2(woRate) }));
      }
      var restRate = 1 - woRate;
      var oppR = pairs.map(function (c) { return { date: c.key, supported: !byKey[shiftKey(c.key, 1)].workout }; });
      var supR = oppR.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condR = supR.length / pairs.length;
      if (condR > restRate && supR.length >= 1) {
        out.push(finalize('sequence.rest_after_workout', 'sequence', 'אימון נוטה להיות מלווה במנוחה ביום העוקב', 'sequence', supR, oppR, clamp01((condR - restRate) / ((1 - restRate) || 1)), { cond: round2(condR), base: round2(restRate) }));
      }
    }

    if (obs.weightDates.length >= OCC_CANDIDATE) {
      var mset = obs.measureDates;
      var near = function (d) { return mset.some(function (m) { return Math.abs(daysBetween(d, m)) <= 1; }); };
      var oppW = obs.weightDates.map(function (d) { return { date: d, supported: near(d) }; });
      var supW = oppW.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condW = supW.length / oppW.length;
      if (condW >= 0.5 && supW.length >= 1) {
        out.push(finalize('sequence.weigh_measure_together', 'sequence', 'שקילה ומדידה נרשמות יחד', 'sequence', supW, oppW, condW, {}));
      }
    }
    return out;
  }

  // ── גלאי Frequency: קצב אופייני ויציב (ארוחות ליום, אימונים לשבוע) ──
  function detectFrequency(obs) {
    var out = [];
    var active = obs.calendar.filter(function (c) { return c.hasMeal; });
    if (active.length >= OCC_CANDIDATE) {
      var counts = active.map(function (c) { return c.mealCount; });
      var m = mean(counts), sd = std(counts);
      var lo = Math.round(m) - 1, hi = Math.round(m) + 1;
      var opp = active.map(function (c) { return { date: c.key, supported: c.mealCount >= lo && c.mealCount <= hi }; });
      var sup = opp.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      out.push(finalize('frequency.meals_per_day', 'frequency', 'בערך ' + Math.round(m) + ' ארוחות ביום, בקביעות', 'daily', sup, opp, m > 0 ? clamp01(1 - sd / m) : 0, { mean: round2(m), std: round2(sd) }));
    }
    var weeks = {};
    obs.calendar.forEach(function (c) { if (!obs.activeWeekSet[c.weekIdx]) return; var w = weeks[c.weekIdx] || (weeks[c.weekIdx] = { cnt: 0, last: c.key }); if (c.workout) w.cnt++; if (c.key > w.last) w.last = c.key; });
    var wk = Object.keys(weeks).map(function (k) { return weeks[k]; });
    if (wk.length >= OCC_CANDIDATE) {
      var counts2 = wk.map(function (w) { return w.cnt; });
      var m2 = mean(counts2), sd2 = std(counts2);
      var lo2 = Math.round(m2) - 1, hi2 = Math.round(m2) + 1;
      var opp2 = wk.map(function (w) { return { date: w.last, supported: w.cnt >= lo2 && w.cnt <= hi2 }; });
      var sup2 = opp2.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      out.push(finalize('frequency.workouts_per_week', 'frequency', 'בערך ' + Math.round(m2) + ' אימונים בשבוע, בקביעות', 'weekly', sup2, opp2, m2 > 0 ? clamp01(1 - sd2 / m2) : 0, { mean: round2(m2), std: round2(sd2) }));
    }
    return out;
  }

  // fingerprint דטרמיניסטי של המקור הרלוונטי בחלון (כולל משקל אפקטיבי; מים אינו נכלל)
  function computeFingerprint(obs, weightData) {
    if (!obs) return hashStr('empty:' + PE_VERSION);
    var parts = [PE_VERSION, obs.windowStart, obs.lastDataDay, 'WT:' + effectiveWeight(weightData)]; // ISSUE 3
    obs.calendar.forEach(function (c) {
      if (!c.hasMeal && !c.workout) return;
      parts.push(c.key + '|' + (c.firstHour == null ? '' : c.firstHour) + ',' + (c.lastHour == null ? '' : c.lastHour) + ',' + c.protein + ',' + c.mealCount + ',' + (c.workout ? 1 : 0));
    });
    parts.push('W:' + obs.weightDates.join(','));
    parts.push('M:' + obs.measureDates.join(','));
    return hashStr(parts.join(';'));
  }

  // recompute: תמונת המקור מחושבת תמיד מחדש; מחזור-החיים מתקדם רק בתקופת הערכה חדשה (advance).
  // B3: weightData הוא State Access snapshot מוגבל, לא userProfile חי.
  function computePatterns(history, weightData, todayKey, prevPatterns, advance) {
    var obs = buildObservation(history, weightData, todayKey);
    var fingerprint = computeFingerprint(obs, weightData);
    var prevById = {};
    (prevPatterns || []).forEach(function (p) { if (p && p.id && isCatalogId(p.id)) prevById[p.id] = p; });
    var byId = {};
    if (obs) {
      var signals = [].concat(detectTime(obs), detectWeekday(obs), detectSequence(obs), detectFrequency(obs));
      signals.forEach(function (s) { byId[s.id] = upsertSupported(prevById[s.id] || null, s, advance !== false); });
    }
    Object.keys(prevById).forEach(function (id) { if (!byId[id]) byId[id] = carryAbsent(prevById[id], advance !== false); });
    var patterns = Object.keys(byId).map(function (k) { return byId[k]; });
    return { patterns: patterns, fingerprint: fingerprint, lastDataDay: obs ? obs.lastDataDay : null };
  }

  // ── מתזמר: רץ אחרי Habit Engine; מפריד בין recompute של המקור לבין קידום תקופת הערכה ──
  //
  // ISSUE 10 — הגדרת Evaluation Advancement:
  //   תקופת הערכה חדשה = *יום נתונים חדש במקור*, כלומר obs.lastDataDay התקדם מעבר ל-
  //   patternsMeta.lastAdvanceDataDay. **לא** יום קלנדרי, **לא** פתיחת אפליקציה, **לא** זמן שחלף.
  //   לכן: מקור זהה ⇒ אין reinforcement ואין decay, גם ביום קלנדרי חדש ואחרי חופשה ארוכה.
  //   מספר הפתיחות והימים שחלפו אינם עדות ואינם משפיעים על Lifecycle.
  //
  //   advance=true  → יום נתונים חדש: מותר צעד Lifecycle יחיד (חיזוק/דעיכה).
  //   advance=false → אין יום נתונים חדש: recompute של strength/evidence מהמקור בלבד,
  //                   בלי לגעת ב-confidence/missedPeriods/status (עריכת עבר אינה תקופה חדשה).
  //   שער כתיבה: אין advance וגם אין שינוי fingerprint → no-op מוחלט, בלי כתיבה.
  //   retry לאחר כשל שמירה נשאר אפשרי (fingerprint/lastAdvanceDataDay לא קודמו).
  // B3: access (EngineStateAccess, scoped patternEngine/RECOMPUTE) מגיע
  // מהאדפטר. rollback-on-failure (ISSUE 2 המקורי) עבר לתוך
  // access.write.replaceDerivedPatternView (stateAccess.js) — אותה סמנטיקה
  // בדיוק, רק ממוקם ב-owner command. coachMemory.lastUpdated המשותף אינו
  // נכתב עוד (B3 SPEC §6.2) — ה-timestamp עבר לתוך patternsMeta.lastUpdated.
  async function runPatternEngine(access) {
    try {
      var currentUser = deps.getCurrentUser();
      var userProfile = deps.getUserProfile();
      if (!currentUser || !userProfile || !access) return deps.persistenceSummaryFn(null);

      // סדר אחרי Habit Engine — טיפול שגיאה מקומי: כשל אינו מבטל את Pattern Engine.
      // B2 Code Review Round 4: קורא ל-HabitEngine.runHabitEngineSingleFlight() (עטיפת
      // single-flight, לא ל-runHabitEngine() ישירות) כדי לא לגרום להרצה כפולה
      // אם ה-Registry מריץ את habitEngine קרוב בזמן — ללא תלות בסדר הרצה,
      // וללא הפיכת קשר זה ל-registry dependency (dependsOn נשאר []). B3 Re-Review:
      // אין קריאה בפועל ל-Habit Derived View data — זו הפעלת חישוב בלבד.
      try { await HabitEngine.runHabitEngineSingleFlight(); } catch (e) { /* ממשיכים על Raw Data בלבד */ }

      var currentView = access.read.patternView();
      var prevPatterns = currentView.patterns || [];
      var patternsMeta = currentView.patternsMeta || { lastRun: null, version: PE_VERSION, sourceFingerprint: null, lastAdvanceDataDay: null };
      if (patternsMeta.lastAdvanceDataDay === undefined) patternsMeta.lastAdvanceDataDay = null;

      var history = await access.read.nutritionActivityHistory();
      var weightData = access.read.weightThreshold();
      var today = DateUtils.getTodayKey();

      // probe: תמונת מקור טרייה ללא צעד Lifecycle — משמשת גם לזיהוי no-op לפני כל מוטציה
      var probe = computePatterns(history, weightData, today, prevPatterns, false);
      var prevAdvanceDay = patternsMeta.lastAdvanceDataDay;
      var advance = !!probe.lastDataDay && (!prevAdvanceDay || probe.lastDataDay > prevAdvanceDay);
      var fpChanged = (patternsMeta.sourceFingerprint !== probe.fingerprint);

      // no-op: אין יום נתונים חדש ואין שינוי מקור → לא נוגעים בכלום
      if (!advance && !fpChanged) return deps.persistenceSummaryFn(null);

      var result = advance ? computePatterns(history, weightData, today, prevPatterns, true) : probe;

      // REM-003 §Recommended Additions — Authority Metadata: Path B (Deterministic Evidence),
      // אינה נוגעת בלוגיקת ה-fingerprint/advance/rollback הקיימת של המנוע.
      var newMeta = {
        lastRun: today, version: PE_VERSION, sourceFingerprint: result.fingerprint,
        lastAdvanceDataDay: advance ? result.lastDataDay : prevAdvanceDay,
        lastUpdated: Date.now(), // B3 §6.2: timestamp דומיין-ספציפי (לא coachMemory.lastUpdated משותף)
        authority: AuthorityContract.buildAuthorityMetadata({
          source: AuthorityContract.AUTHORITY_SOURCES.PATTERN_ENGINE,
          createdBy: currentUser && currentUser.uid,
          rule: 'patternEngine.recompute.v1',
          systemVersion: deps.appVersion
        })
      };

      // B4 §16.2/§24: expectedVersion = ה-fingerprint שהיה durable כשהריצה הזו התחילה
      // (patternsMeta.sourceFingerprint, לפני כל מוטציה) — נבדק אטומית ב-Gateway כדי
      // לזהות CONFLICT (מצב durable התקדם בין הקריאה לכתיבה).
      var writeResult = await access.write.replaceDerivedPatternView({
        patterns: result.patterns, patternsMeta: newMeta, expectedVersion: patternsMeta.sourceFingerprint || null
      });
      if (writeResult.status !== 'APPLIED') console.error('runPatternEngine: persist failed, rolled back', writeResult.error);
      return deps.persistenceSummaryFn(writeResult);
    } catch (e) {
      console.error('runPatternEngine:', e); // לעולם לא זורק החוצה
      return deps.persistenceSummaryFn(null);
    }
  }

  // Pattern Engine — dependsOn נעול ל-[] (B2 SPEC §11 כלל 10): הקריאה הפנימית
  // הקיימת של runPatternEngine() ל-Habit (דרך HabitEngine.runHabitEngineSingleFlight,
  // ראה מעלה) היא soft enrichment עם graceful degradation, ואינה הופכת ל-registry
  // dependency. נכונות אינה נשענת עוד על סדר לקסיקוגרפי (B2 Code Review Round 4).
  // נרשם מול EngineRegistry דרך js/engines/registerEngines.js (C1-WP9).
  async function run(ctx) {
    if (ctx.action !== 'RECOMPUTE') return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'not a patternEngine action' } };
    ctx.state = StateAccess.createEngineAccess({
      engineId: 'patternEngine', action: ctx.action,
      userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId
    });
    var persistence = await runPatternEngine(ctx.state);
    return { status: 'SUCCESS', output: { persistence: persistence } };
  }

  var API = {
    VERSION: PE_VERSION,
    configure: configure,
    runPatternEngine: runPatternEngine,
    run: run
  };

  if (typeof window !== 'undefined') { window.PatternEngine = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
