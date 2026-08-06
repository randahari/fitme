// ══════════════════════════════════════════════════════════════════
// FitMe — Home Presenter (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: renderHome ו-renderMealsInHome — המימושים הסופיים-בזמן-ריצה
// היחידים. renderHome מאחד שלוש שכבות שהיו קיימות ב-js/app.js: ההגדרה הבסיסית
// (מתה), ה-override "renderHome with ring" (silent-replacement — docs/architecture/
// C1_WP0_INVENTORY.md §2.2) וה-wrap שהוסיפה ה-Day Navigation IIFE (סרגל/כרום
// ניווט התאריך). renderMealsInHome מאחד את ההגדרה הבסיסית (מתה) עם שכבת
// ה-silent-replacement היחידה של ה-Day Navigation IIFE (שורות עריכה/מחיקה
// ללחיצה, לכל יום — לא רק להיום). ראה docs/specs/C1_SPEC_v1.0.md §C1-WP10.
// אינו יודע דבר על ניווט תאריך בעצמו — כרום ניווט התאריך מוזרק כ-closure יחיד
// (applyDateNavChrome), כדי שלא תיווצר תלות הדדית עם js/ui/dayNavigationController.js.
// editHomeMeal/deleteHomeMeal (ה-onclick המוטבעים כאן) הם window facades
// שנשארים ב-js/app.js/js/ui/dayNavigationController.js — אין שכפול לוגיקה כאן.
// תלויות: DOM (documentRef), StringUtils.esc (מודול B1/WP1 יציב, קבוע).
// חשיפה: window.HomePresenter + module.exports.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var StringUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/stringUtils.js')
    : window.StringUtils;
  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // TASK-007 UX-7.5/UX-14.1a (WP8): "prolonged absence" threshold — Engineering Decision
  // Pending, non-blocking, per TASK_007_SPEC_v1.0.md §7.2.6's own text ("exact threshold:
  // Engineering Decision Pending"). 4 days: longer than an ordinary single skipped day, short
  // enough to close the gap the SPEC's own Repository Gap citation identifies, and less than
  // the existing 7-day week-chart's own rolling window (so this signal fires before that window
  // would otherwise silently roll a longer absence out of view).
  var RETURN_AFTER_ABSENCE_THRESHOLD_DAYS = 4;

  // TASK-007 UX-7.5 (WP8): finds the most recent day strictly before todayKey with any logged
  // meal activity, in the already-existing day-history object (js/repositories/dayRepository.js
  // fetchHistory() — the exact same data source js/app.js's updateStreak()/buildWeekChart()
  // already read; no new field, repository, schema, or Persistence Gateway operation). "Activity"
  // is defined as meals.length > 0, matching updateStreak()'s own existing definition — not a new
  // definition invented for this purpose. Returns the day-count gap, or null if no qualifying
  // prior day exists (a brand-new user with no history yet, or a user whose only logged day is
  // today) — null correctly produces no signal, since there is nothing to be "absent" from.
  function daysSinceLastLoggedDay(history, todayKey) {
    if (!history || typeof history !== 'object') return null;
    var lastKey = null;
    Object.keys(history).forEach(function (key) {
      if (key >= todayKey) return; // strictly before today
      var day = history[key];
      if (day && Array.isArray(day.meals) && day.meals.length > 0) {
        if (!lastKey || key > lastKey) lastKey = key;
      }
    });
    if (!lastKey) return null;
    return DateUtils.daysBetween(todayKey, lastKey);
  }

  // TASK-007 UX-7.5/UX-14.1a (WP8): async, fire-and-forget — same pattern already used by
  // buildWeekChart()/refreshCoachCard() within renderHome() below. Defensive: a no-op whenever
  // deps.getHistoryData/deps.sessionLifecycle are not injected, so every existing caller that
  // doesn't provide them (including the full pre-WP8 test suite) is unaffected. REM-002 session
  // guard: suppresses the DOM update if the auth session changed while the history fetch was in
  // flight, matching the discipline already required of every other async Home-render effect.
  async function applyReturnAfterAbsenceSignal() {
    if (typeof deps.getHistoryData !== 'function' || !deps.sessionLifecycle) return;
    var gen = deps.sessionLifecycle.getGeneration();
    var history;
    try { history = await deps.getHistoryData(); } catch (e) { return; }
    if (!deps.sessionLifecycle.isCurrent(gen)) return; // REM-002: stale session — no effect
    var el = deps.documentRef.getElementById('today-date');
    if (!el) return;
    var gap = daysSinceLastLoggedDay(history, DateUtils.getTodayKey());
    if (gap !== null && gap >= RETURN_AFTER_ABSENCE_THRESHOLD_DAYS) {
      el.textContent += ' · הרישום האחרון: לפני ' + gap + ' ימים';
    }
  }

  // המימוש הסופי-בזמן-ריצה היחיד של renderHome.
  function renderHome() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var todayData = deps.getTodayData();
    var doc = deps.documentRef;

    doc.getElementById('greeting').textContent = 'שלום, ' + userProfile.name;
    deps.setTodayDate();
    var consumed = todayData.meals.reduce(function (s, m) { return s + (m.kcal || 0); }, 0);
    var target = userProfile.goalKcal || 2000;
    var pct = Math.min(100, Math.round(consumed / target * 100));

    // Ring arc — circumference of r=46 is ~289
    var circ = 2 * Math.PI * 46;
    var fill = (pct / 100) * circ;
    var arc = doc.getElementById('ring-arc');
    if (arc) arc.style.strokeDasharray = fill + ' ' + circ;

    var pctEl = doc.getElementById('ring-pct');
    if (pctEl) pctEl.textContent = pct + '%';
    doc.getElementById('kcal-consumed').textContent = consumed.toLocaleString();
    doc.getElementById('kcal-target').textContent = target.toLocaleString();
    doc.getElementById('kcal-remain').textContent = 'נותרו ' + Math.max(0, target - consumed).toLocaleString() + ' קל׳';

    var protein = todayData.meals.reduce(function (s, m) { return s + (m.protein || 0); }, 0);
    var carbs = todayData.meals.reduce(function (s, m) { return s + (m.carbs || 0); }, 0);
    var fat = todayData.meals.reduce(function (s, m) { return s + (m.fat || 0); }, 0);
    doc.getElementById('m-protein').textContent = Math.round(protein) + 'g';
    doc.getElementById('m-carbs').textContent = Math.round(carbs) + 'g';
    doc.getElementById('m-fat').textContent = Math.round(fat) + 'g';

    var tP = Math.round((userProfile.weight || 75) * 1.8);
    var tC = Math.round((target - tP * 4 - Math.round(target * 0.25 / 9) * 9) / 4);
    var tF = Math.round(target * 0.25 / 9);
    var bp = doc.getElementById('bar-protein');
    var bc = doc.getElementById('bar-carbs');
    var bf = doc.getElementById('bar-fat');
    if (bp) bp.style.width = Math.min(100, Math.round(protein / tP * 100)) + '%';
    if (bc) bc.style.width = Math.min(100, Math.round(carbs / Math.max(tC, 1) * 100)) + '%';
    if (bf) bf.style.width = Math.min(100, Math.round(fat / Math.max(tF, 1) * 100)) + '%';

    doc.getElementById('burned-val').textContent = (todayData.burned || 0).toLocaleString();
    doc.getElementById('steps-val').textContent = (todayData.steps || 0).toLocaleString();
    doc.getElementById('weight-val').textContent = userProfile.currentWeight || userProfile.weight || '--';
    doc.getElementById('streak-num').textContent = userProfile.streak || 0;

    deps.renderMealsInHome();
    deps.buildWater();
    deps.buildWeekChart();
    deps.refreshCoachCard();

    // Day Navigation IIFE wrap: מוסיפה סרגל ניווט תאריך + כרום ימי-עבר.
    deps.applyDateNavChrome();

    // TASK-007 UX-7.5/UX-14.1a (WP8): return-after-absence continuity signal — see
    // applyReturnAfterAbsenceSignal() above.
    applyReturnAfterAbsenceSignal();
  }

  // המימוש הסופי-בזמן-ריצה היחיד של renderMealsInHome (שורות ניתנות ללחיצה
  // לעריכה + כפתור מחיקה, בכל יום — הגרסה הסופית שה-Day Navigation IIFE החליפה
  // בשקט את ההגדרה הבסיסית).
  function renderMealsInHome() {
    var todayData = deps.getTodayData();
    var list = deps.documentRef.getElementById('meals-list');
    if (!list) return;
    if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות</div>'; return; }
    list.innerHTML = '<div class="meals-card">' + todayData.meals.map(function (m, i) {
      return '<div class="meal-row">' +
        '<div style="flex:1;cursor:pointer" onclick="editHomeMeal(' + i + ')"><div class="meal-name">' + StringUtils.esc(m.name) + ' <span style="font-size:11px;color:var(--gold)">✏️</span></div><div class="meal-time">' + StringUtils.esc(m.time || '') + '</div></div>' +
        '<div class="meal-kcal">' + (m.kcal || 0) + ' קל\'</div>' +
        '<button onclick="deleteHomeMeal(' + i + ')" aria-label="מחק" style="border:none;background:none;color:var(--text-3,#999);font-size:20px;cursor:pointer;padding:0 4px;margin-inline-start:6px">×</button>' +
        '</div>';
    }).join('') + '</div>';
  }

  var API = {
    configure: configure,
    renderHome: renderHome,
    renderMealsInHome: renderMealsInHome,
    // TASK-007 UX-7.5 (WP8): exposed for direct unit testing, matching this repository's
    // established convention for pure internal helpers (e.g. js/memory.js's _internal export).
    _internal: { daysSinceLastLoggedDay: daysSinceLastLoggedDay }
  };

  if (typeof window !== 'undefined') { window.HomePresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
