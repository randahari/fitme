// ══════════════════════════════════════════════════════════════════
// FitMe — Food Screen Presenter (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: renderFoodMeals, renderFavoritesList, switchFoodTab — רינדור
// מסך האוכל (ללא override chain — הגדרה יחידה מקורית לכל אחת, מועברת ללא שינוי
// התנהגות). אינו מבצע כתיבה עמידה ואינו נוגע בהחלטות מסחר/אימות תזונתי —
// אלה נשארים ב-WP5 (NutritionAnalysisService/MealCommitService/QuickLogService).
// ראה docs/specs/C1_SPEC_v1.0.md §C1-WP10.
// תלויות: DOM (documentRef) בלבד.
// חשיפה: window.FoodScreenPresenter + module.exports.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function renderFoodMeals() {
    var todayData = deps.getTodayData();
    var favoriteMeals = deps.getFavoriteMeals();
    var list = deps.documentRef.getElementById('food-meals-list');
    if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות עדיין</div>'; return; }
    list.innerHTML = '<div class="meals-card">' + todayData.meals.map(function (m, i) {
      var isFav = favoriteMeals.some(function (f) { return f.name === m.name; });
      return '<div class="meal-row"><div><div class="meal-name">' + m.name + '</div><div class="meal-time">' + m.time + '</div></div><div style="display:flex;align-items:center;gap:4px"><div class="meal-kcal">' + m.kcal + ' קל\'</div><button onclick="toggleMealFavorite(' + i + ', this)" style="background:none;border:none;cursor:pointer;font-size:18px;padding:2px">' + (isFav ? '⭐' : '☆') + '</button><button onclick="deleteMeal(' + i + ')" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:18px;padding:2px">×</button></div></div>';
    }).join('') + '</div>';
  }

  function renderFavoritesList() {
    var favoriteMeals = deps.getFavoriteMeals();
    var el = deps.documentRef.getElementById('favorites-list');
    if (!el) return;
    if (!favoriteMeals.length) { el.innerHTML = '<div class="empty-state">אין עדיין מועדפים<br><small>לחץ ⭐ בעת הוספת מאכל</small></div>'; return; }
    el.innerHTML = '<div class="meals-card">' + favoriteMeals.map(function (m, i) {
      return '<div class="meal-row"><div><div class="meal-name">' + m.name + '</div><div class="meal-time">' + m.kcal + ' קל\' · ' + Math.round(m.protein) + 'g חלבון</div></div><div style="display:flex;gap:6px;align-items:center"><button class="fav-add-btn btn-small" onclick="addFavoriteToToday(' + i + ')">+</button><button onclick="removeFavorite(' + i + ')" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:16px">×</button></div></div>';
    }).join('') + '</div>';
  }

  function switchFoodTab(tab) {
    var doc = deps.documentRef;
    doc.querySelectorAll('.food-tab').forEach(function (t) { t.classList.remove('active'); });
    doc.getElementById('ftab-' + tab).classList.add('active');
    doc.getElementById('food-tab-today').classList.toggle('hidden', tab !== 'today');
    doc.getElementById('food-tab-favorites').classList.toggle('hidden', tab !== 'favorites');
  }

  var API = {
    configure: configure,
    renderFoodMeals: renderFoodMeals,
    renderFavoritesList: renderFavoritesList,
    switchFoodTab: switchFoodTab
  };

  if (typeof window !== 'undefined') { window.FoodScreenPresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
