// ══════════════════════════════════════════════════════════════════
// FitMe — Day Navigation Controller (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: המסלול הסמכותי היחיד של ה-IIFE "שלב 2 — ניווט תאריך + עריכת
// ארוחות עבר + רישום ליום קודם" שהיה קיים ב-js/app.js (docs/architecture/
// C1_WP0_INVENTORY.md §4, שורה 1908 ואילך במספור שלפני C1-WP10). כולל:
//   • סרגל ניווט התאריך (ensureDateNav/updateDateNav/formatDayLabel/daysBack/
//     viewingToday/keyToDate) וכרום ימי-עבר במסך הבית (applyDayViewChrome,
//     נחשף כ-applyHomeChrome — קרוי מ-js/ui/homePresenter.js);
//   • טעינת/מעבר בין ימים (loadDay/shiftDay) ושלוש נקודות הכניסה התואמות
//     dayNavPrev/dayNavNext/dayNavToday (window facades — onclick מוטבע דינמית);
//   • באנר תאריך במסך האוכל (ensureFoodDateBanner/updateFoodDateBanner);
//   • עריכת/מחיקת ארוחת-בית קיימת (deleteHomeMeal/editHomeMeal — window facades);
//   • שמירת/מחיקת/ביטול עריכת ארוחה קיימת (saveEditedMeal/deleteEditedMeal/
//     cancelEditedMeal — window facades);
//   • ארבע השכבות ה-safely-chained שה-IIFE הזה עטף (docs/architecture/
//     C1_WP0_INVENTORY.md §2.1) — כעת מאוחדות למימוש סופי-בזמן-ריצה יחיד לכל
//     אחת: showMealEditor (מאפס מצב-עריכה), renderEditor (כפתורי עריכה
//     כשעורכים ארוחה קיימת), addMeal (מנתב לשמירת-שינויים כשעורכים ארוחה
//     קיימת), loadUserData (מאפס את מצב ניווט התאריך להיום בכל טעינה).
// ראה docs/specs/C1_SPEC_v1.0.md §C1-WP10.
// currentDayKey/todayData/waterCount/realTodayData/realWaterCount/editingExisting/
// pendingMeal/editingItemIdx נשארים מצב משותף ב-js/app.js (currentDayKey/
// realTodayData/realWaterCount/editingExisting נקראים/נכתבים אך ורק דרך המודול
// הזה; todayData/waterCount/pendingMeal/editingItemIdx משותפים עם דומיינים
// נוספים) — מוזרקים כ-getter/setter closures, בדיוק כמו _adaptProposal/
// coachCardShown בדומיינים אחרים. MealDraft/MealEditorPresenter/
// MealCommitService/DateUtils/DayRepository (מודולים יציבים B1/WP1/WP3/WP5)
// נקראים ישירות.
// אסור: לבצע כתיבה עמידה ישירה (saveTodayData/updateStreak מוזרקים); לבצע
// אימות תזונתי בעצמו.
// חשיפה: window.DayNavigationController + module.exports.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;
  var MealDraft = (typeof module !== 'undefined' && module.exports)
    ? require('../nutrition/mealDraft.js')
    : window.MealDraft;
  var MealEditorPresenter = (typeof module !== 'undefined' && module.exports)
    ? require('../nutrition/mealEditorPresenter.js')
    : window.MealEditorPresenter;
  var MealCommitService = (typeof module !== 'undefined' && module.exports)
    ? require('../nutrition/mealCommitService.js')
    : window.MealCommitService;

  var MAX_PAST_DAYS = 7; // עד כמה אחורה מותר לצפות ולערוך

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // ── עזרי תאריך פנימיים ──
  function keyToDate(key) {
    var parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function viewingToday() { return deps.getCurrentDayKey() === DateUtils.getTodayKey(); }
  function daysBack(key) {
    var ms = keyToDate(DateUtils.getTodayKey()) - keyToDate(key);
    return Math.round(ms / 86400000);
  }
  function formatDayLabel(key) {
    var back = daysBack(key);
    if (back === 0) return 'היום';
    if (back === 1) return 'אתמול';
    var d = keyToDate(key);
    var days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return 'יום ' + days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1);
  }

  // ── סרגל ניווט התאריך (מוזרק פעם אחת לראש מסך הבית) ──
  function ensureDateNav() {
    var doc = deps.documentRef;
    if (doc.getElementById('date-nav')) return;
    var sc = doc.querySelector('#screen-home .scroll-content');
    if (!sc) return;
    var bar = doc.createElement('div');
    bar.id = 'date-nav';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--bg-2,#fff);border-radius:14px;padding:8px 10px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.06)';
    bar.innerHTML =
      '<button id="date-prev" onclick="dayNavPrev()" aria-label="יום קודם" style="border:none;background:var(--bg-3,#f0eee9);border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer">▶</button>' +
      '<div style="text-align:center;flex:1"><div id="date-nav-label" style="font-weight:700;font-size:15px">היום</div><div id="date-nav-back" class="link-btn" style="font-size:12px;color:var(--gold);cursor:pointer;display:none" onclick="dayNavToday()">חזרה להיום</div></div>' +
      '<button id="date-next" onclick="dayNavNext()" aria-label="יום הבא" style="border:none;background:var(--bg-3,#f0eee9);border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer">◀</button>';
    sc.insertBefore(bar, sc.firstChild);
  }
  function updateDateNav() {
    ensureDateNav();
    var doc = deps.documentRef;
    var label = doc.getElementById('date-nav-label');
    var back = doc.getElementById('date-nav-back');
    var prev = doc.getElementById('date-prev');
    var next = doc.getElementById('date-next');
    var currentDayKey = deps.getCurrentDayKey();
    if (label) label.textContent = formatDayLabel(currentDayKey);
    if (back) back.style.display = viewingToday() ? 'none' : 'block';
    // prev = אחורה בזמן; חסום כשהגענו לגבול
    if (prev) { var atLimit = daysBack(currentDayKey) >= MAX_PAST_DAYS; prev.disabled = atLimit; prev.style.opacity = atLimit ? '.35' : '1'; }
    // next = קדימה בזמן; חסום כשאנחנו על היום (אין עתיד)
    if (next) { var atToday = viewingToday(); next.disabled = atToday; next.style.opacity = atToday ? '.35' : '1'; }
  }

  // ── טעינת יום לצפייה/עריכה ──
  async function loadDay(key) {
    var currentDayKey = deps.getCurrentDayKey();
    if (key === currentDayKey) return;
    if (key === DateUtils.getTodayKey()) {
      // חזרה להיום — משחזרים את נתוני היום האמיתי
      deps.setTodayData(deps.getRealTodayData());
      deps.setWaterCount(deps.getRealWaterCount());
      deps.setCurrentDayKey(DateUtils.getTodayKey());
    } else {
      // עוזבים את היום — שומרים את נתוני היום האמיתי לפני ההחלפה
      if (viewingToday()) { deps.setRealTodayData(deps.getTodayData()); deps.setRealWaterCount(deps.getWaterCount()); }
      var data = { meals: [], burned: 0, steps: 0 }, water = 0;
      try {
        var currentUser = deps.getCurrentUser();
        var doc = await deps.dayRepository.loadDay(currentUser.uid, key);
        if (doc.exists) { var d = doc.data(); data = { meals: d.meals || [], burned: d.burned || 0, steps: d.steps || 0 }; water = d.water || 0; }
      } catch (e) { console.error('loadDay:', e); }
      deps.setTodayData(data);
      deps.setWaterCount(water);
      deps.setCurrentDayKey(key);
    }
    deps.renderHome();
    updateFoodDateBanner();
  }

  function shiftDay(deltaDays) {
    var currentDayKey = deps.getCurrentDayKey();
    var d = keyToDate(currentDayKey);
    d.setDate(d.getDate() + deltaDays);
    var key = DateUtils.dateKey(d);
    // מגבלות: לא לעתיד, ולא מעבר ל-MAX_PAST_DAYS אחורה
    if (keyToDate(key) > keyToDate(DateUtils.getTodayKey())) key = DateUtils.getTodayKey();
    if (daysBack(key) > MAX_PAST_DAYS) return;
    loadDay(key);
  }
  function dayNavPrev() { shiftDay(-1); }   // אחורה בזמן
  function dayNavNext() { shiftDay(1); }     // קדימה בזמן
  function dayNavToday() { loadDay(DateUtils.getTodayKey()); }

  // ── כרום מסך הבית לפי היום המוצג ──
  function applyDayViewChrome() {
    var doc = deps.documentRef;
    var today = viewingToday();
    var setHidden = function (id, cond) { var el = doc.getElementById(id); if (el) el.classList.toggle('hidden', cond); };
    // מקטעים ששייכים ל"היום" בלבד — מוסתרים בימי עבר
    ['week-header', 'week-chart', 'body-metrics-section'].forEach(function (id) { setHidden(id, !today); });
    // כרטיסי מאמן/יעד — לא רצים על ימי עבר
    if (!today) ['trigger-card', 'coach-card', 'adaptive-card', 'partial-prompt'].forEach(function (id) { var el = doc.getElementById(id); if (el) el.classList.add('hidden'); });
    var mt = doc.getElementById('meals-title');
    if (mt) mt.textContent = today ? 'ארוחות היום' : ('ארוחות · ' + formatDayLabel(deps.getCurrentDayKey()));
    updateDateNav();
  }

  // ── נקראת מ-js/ui/homePresenter.js בסוף renderHome — מוסיפה סרגל תאריך + כרום עבר ──
  function applyHomeChrome() {
    ensureDateNav();
    applyDayViewChrome();
  }

  async function deleteHomeMeal(idx) {
    var todayData = deps.getTodayData();
    if (!todayData.meals[idx]) return;
    if (!deps.confirmFn('למחוק את הארוחה?')) return;
    todayData.meals.splice(idx, 1);
    await deps.saveTodayData();
    await deps.updateStreak();
    deps.renderHome();
    deps.renderFoodMeals();
  }

  // ── עטיפת showMealEditor: איפוס מצב עריכה בכל פתיחה של ארוחה חדשה ──
  function showMealEditor(meal) {
    deps.setEditingExisting(null);
    deps.setEditingItemIdx(null);
    deps.setPendingMeal(MealDraft.buildDraft(meal));
    renderEditor();
    deps.documentRef.getElementById('food-result').classList.remove('hidden');
  }

  // ── עריכת ארוחה קיימת דרך המסך האחיד ──
  function editHomeMeal(idx) {
    var todayData = deps.getTodayData();
    var meal = todayData.meals[idx];
    if (!meal) return;
    var time = meal.time || '';
    var items = (meal.items && meal.items.length)
      ? meal.items.map(function (it) { return Object.assign({}, it); })
      : [{ name: meal.name || 'פריט', amount: 0, unit: '', qty: 1, kcal: meal.kcal || 0, protein: meal.protein || 0, carbs: meal.carbs || 0, fat: meal.fat || 0, fiber: meal.fiber || 0, sugar: meal.sugar || 0, sodium: meal.sodium || 0 }];
    deps.goToScreen('food');
    showMealEditor({ name: meal.name, items: items, source: meal.source || null, note: meal.note || '' }); // מאפס את הדגל ומרנדר כרגיל
    deps.setEditingExisting({ idx: idx, time: time });  // מפעיל מצב עריכה
    renderEditor();                                      // מרנדר מחדש עם כפתורי העריכה
  }

  // ── מצב עריכה קיים: addMeal מנותב לשמירת שינויים ──
  async function addMeal() {
    if (deps.getEditingExisting()) return saveEditedMeal();
    var pendingMeal = deps.getPendingMeal();
    return MealCommitService.commitMeal(pendingMeal, deps.getTodayData(), deps.getWaterCount(), {
      authoritySource: deps.authoritySourceForMeal(pendingMeal),
      createdByUid: deps.getCurrentUser() && deps.getCurrentUser().uid,
      systemVersion: deps.appVersion
    });
  }

  async function saveEditedMeal() {
    var pendingMeal = deps.getPendingMeal();
    if (!pendingMeal || !pendingMeal.items.length) { deps.alertFn('אין פריטים בארוחה'); return; }
    var editingExisting = deps.getEditingExisting();
    var finalMeal = deps.buildMealFromEditor();
    if (editingExisting.time) finalMeal.time = editingExisting.time; // שמירה על שעת הרישום המקורית
    var todayData = deps.getTodayData();
    todayData.meals[editingExisting.idx] = finalMeal;
    deps.setEditingExisting(null);
    deps.setPendingMeal(null);
    deps.documentRef.getElementById('food-result').classList.add('hidden');
    await deps.saveTodayData();
    await deps.updateStreak();
    deps.renderFoodMeals();
    deps.goToScreen('home');
  }

  async function deleteEditedMeal() {
    var editingExisting = deps.getEditingExisting();
    if (!editingExisting) return;
    if (!deps.confirmFn('למחוק את הארוחה?')) return;
    var todayData = deps.getTodayData();
    todayData.meals.splice(editingExisting.idx, 1);
    deps.setEditingExisting(null);
    deps.setPendingMeal(null);
    deps.documentRef.getElementById('food-result').classList.add('hidden');
    await deps.saveTodayData();
    await deps.updateStreak();
    deps.renderFoodMeals();
    deps.goToScreen('home');
  }

  function cancelEditedMeal() {
    deps.setEditingExisting(null);
    deps.setPendingMeal(null);
    deps.documentRef.getElementById('food-result').classList.add('hidden');
    deps.goToScreen('home');
  }

  // ── עטיפת renderEditor: כשעורכים ארוחה קיימת — כפתורי פעולה מותאמים ──
  function renderEditor() {
    MealEditorPresenter.renderEditor(deps.getPendingMeal(), deps.getEditingItemIdx());
    if (deps.getEditingExisting()) {
      var actions = deps.documentRef.querySelector('#food-result .result-actions');
      if (actions) actions.innerHTML =
        '<button class="btn-primary" onclick="addMeal()">שמור שינויים ✓</button>' +
        '<button class="btn-ghost" onclick="deleteEditedMeal()">מחק ארוחה 🗑</button>' +
        '<button class="btn-ghost" onclick="cancelEditedMeal()">בטל</button>';
    }
  }

  // ── באנר במסך האוכל: מיידע לאיזה יום נרשם (כשלא היום) ──
  function ensureFoodDateBanner() {
    var doc = deps.documentRef;
    if (doc.getElementById('food-date-banner')) return;
    var sc = doc.querySelector('#screen-food .scroll-content');
    if (!sc) return;
    var b = doc.createElement('div');
    b.id = 'food-date-banner';
    b.style.cssText = 'display:none;align-items:center;justify-content:space-between;gap:8px;background:var(--gold-light,#faece0);color:var(--gold,#8a5a00);border-radius:12px;padding:8px 12px;margin-bottom:10px;font-size:13px;font-weight:600';
    b.innerHTML = '<span id="food-date-banner-text"></span><span class="link-btn" style="cursor:pointer;text-decoration:underline" onclick="dayNavToday();goToScreen(\'home\')">להיום</span>';
    sc.insertBefore(b, sc.firstChild);
  }
  function updateFoodDateBanner() {
    ensureFoodDateBanner();
    var doc = deps.documentRef;
    var b = doc.getElementById('food-date-banner');
    var t = doc.getElementById('food-date-banner-text');
    if (!b || !t) return;
    if (viewingToday()) { b.style.display = 'none'; }
    else { t.textContent = '📅 רושם ליום: ' + formatDayLabel(deps.getCurrentDayKey()); b.style.display = 'flex'; }
  }

  // ── עטיפת loadUserData: איפוס מצב הניווט להיום בכל טעינה ──
  async function loadUserData() {
    var _gen = deps.sessionLifecycle.getGeneration(); // REM-002: session guard
    await deps.loadUserDataCore();
    if (!deps.sessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי — לא עוקפים את מצב הניווט הנוכחי
    deps.setCurrentDayKey(DateUtils.getTodayKey());
    deps.setRealTodayData(deps.getTodayData());
    deps.setRealWaterCount(deps.getWaterCount());
  }

  var API = {
    configure: configure,
    applyHomeChrome: applyHomeChrome,
    updateFoodDateBanner: updateFoodDateBanner,
    dayNavPrev: dayNavPrev,
    dayNavNext: dayNavNext,
    dayNavToday: dayNavToday,
    deleteHomeMeal: deleteHomeMeal,
    editHomeMeal: editHomeMeal,
    saveEditedMeal: saveEditedMeal,
    deleteEditedMeal: deleteEditedMeal,
    cancelEditedMeal: cancelEditedMeal,
    showMealEditor: showMealEditor,
    renderEditor: renderEditor,
    addMeal: addMeal,
    loadUserData: loadUserData
  };

  if (typeof window !== 'undefined') { window.DayNavigationController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
