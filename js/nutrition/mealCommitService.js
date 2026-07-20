// ══════════════════════════════════════════════════════════════════
// FitMe — Meal Commit Service (C1-WP5D, Nutrition Application Domain)
// אחריות בלעדית: רצף ה-commit הסמכותי של addMeal() — שער אימות סופי,
// עדכון מאגר ברקוד, בניית הארוחה הסמכותית, תוספת אופטימית ל-todayData,
// כתיבה דרך PersistenceGateway (מוזרק — B4 קפוא, לא כפול), rollback
// בכשל, דיכוי אפקטים ב-stale session, למידת quick-item, עדכון סטריק,
// ורינדור לאחר commit. persistDaySnapshot/learnQuickItems/updateStreak/
// saveProfile/saveBarcodeToCache נשארים ב-js/app.js ומוזרקים — הם
// משותפים עם נקודות-כניסה אחרות (logQuick — WP5E, favorites, אימון,
// ניווט ימים) ואין לשכפל לוגיקה. אינו יודע דבר על addMealAndFavorite/
// saveFavoriteFromPending (נשארים ב-app.js, לא בסקופ WP5D). תלוי ישירות
// ב-MealDraft (מודול טהור, WP5B, ללא override chain). חולץ מ-js/app.js
// ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP5D.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var MealDraft = (typeof module !== 'undefined' && module.exports)
    ? require('./mealDraft.js')
    : window.MealDraft;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // זהה לחלוטין ל-addMeal() המקורי — כל שלב, כל תנאי, כל סדר קריאה.
  async function commitMeal(pendingMeal, todayData, waterCount, authorityOptions) {
    if (!pendingMeal || !pendingMeal.items.length) { deps.alertFn('אין פריטים בארוחה'); return false; }
    // REM-001 §14/ER-001 — שער אימות שני, חובה, מיד לפני הפרסיסטנס הסופי (גם על ערכים שהמשתמש ערך ידנית).
    // מקורות שאינם AI ('off'/'group'/'manual') פטורים — REM-001 §4 אוסר לשנות לוגיקת מאגר ברקוד/הזנה ידנית.
    if (deps.mealRequiresNutritionValidation(pendingMeal)) {
      var gate = deps.nutritionOutputValidator.validateNutritionMeal(pendingMeal.items, pendingMeal.source || 'text');
      deps.logValidation(gate.overallStatus, pendingMeal.source || 'text', deps.collectErrorCodes(gate));
      if (gate.overallStatus !== 'VALID') { deps.renderEditor(); return false; }
    }
    // שמירה/עדכון מאגר הקבוצה — עם הערכים הסופיים (כולל תיקונים ידניים). חל על כל מסלול ברקוד.
    if (pendingMeal.barcode && pendingMeal.items[0]) {
      deps.saveBarcodeToCache(pendingMeal.barcode, pendingMeal.items[0], pendingMeal.addedByName);
    }
    var finalMeal = MealDraft.buildAuthoritativeMeal(pendingMeal, authorityOptions);
    var gen = deps.sessionLifecycle.getGeneration();
    // B4 §26: מוסיפים אופטימית ל-todayData.meals מיד (סינכרונית, לפני ה-await) — בדיוק
    // כמו לפני B4 — כדי לשמר קומפוזיציה נכונה מול תוספת-ארוחה נוספת שרצה כמעט באותו רגע
    // (todayData הוא אובייקט mutable משותף יחיד; דחיית המוטציה עד אחרי ה-await הייתה יוצרת
    // race: התוספת השנייה הייתה מחשבת candidate מתוך snapshot ישן, בלי הראשונה). candidate
    // vs. committed מתבטא כאן דרך rollback מפורש (הסרת הרשומה שהוספנו) בכשל durable —
    // אותו דפוס בדיוק כמו Pattern Engine (B4 §25 כלל 10: "aligned with this contract").
    todayData.meals.push(finalMeal);
    var snapshotMeals = todayData.meals.slice();
    var result = await deps.persistDaySnapshot(snapshotMeals, todayData.burned, todayData.steps, waterCount, finalMeal.authority, gen);
    if (result.status !== 'SUCCESS' && result.status !== 'NO_OP') {
      var idx = todayData.meals.indexOf(finalMeal);
      if (idx !== -1) todayData.meals.splice(idx, 1); // rollback — לא מתחייבים ל-candidate שנכשל
      // REM-002: אין אפקט (alert) אם הסשן כבר אינו נוכחי (Implementation Review correction).
      if (deps.sessionLifecycle.isCurrent(gen)) deps.alertFn('שמירת הארוחה נכשלה. נסה שוב.');
      return false;
    }
    if (!deps.sessionLifecycle.isCurrent(gen)) return false; // REM-002: stale-on-completion — אין אפקטים
    deps.learnQuickItems(finalMeal);
    deps.clearPendingMeal();
    deps.getElementById('food-result').classList.add('hidden');
    deps.getElementById('food-input').value = '';
    await deps.saveProfile(); // quickItems/streak — legacy broad-save, מחוץ ל-scope B4 (Review Q17)
    await deps.updateStreak();
    deps.renderFoodMeals();
    deps.renderQuickStrip();
    deps.renderHome();
    return true;
  }

  var API = { configure: configure, commitMeal: commitMeal };

  if (typeof window !== 'undefined') { window.MealCommitService = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
