// ══════════════════════════════════════════════════════════════════
// FitMe — Quick Log Service (C1-WP5E, Nutrition Application Domain)
// אחריות בלעדית: למידת פריטים לרישום מהיר, ניקוד תצוגה, הגבלת גודל
// המאגר (40), נעיצה/הסרה, ורישום סמכותי מהיר (logQuick). אינו יודע דבר
// על submitQuickLearn (AI onboarding — WP5A/WP5E boundary; לא מופיע
// ברשימת ה-extract של WP5E, נשאר ב-app.js), renderQuickStrip, או
// toggleQuickManage — אלה נשארות UI ב-app.js. persistDaySnapshot/
// SessionLifecycle/NutritionOutputValidator/saveProfile/updateStreak/
// renderFoodMeals/renderHome/alert מוזרקים — משותפים עם addMeal (WP5D)
// ואחרים; אין שכפול לוגיקה. תלוי ישירות ב-AuthorityContract (מודול
// טהור, B3/B4, ללא override chain — אותו דפוס כמו js/nutrition/
// mealCommitService.js). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP5E.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var AuthorityContract = (typeof module !== 'undefined' && module.exports)
    ? require('../authorityContract.js')
    : window.AuthorityContract;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // מגביל את המאגר ל-40 פריטים — זהה לחלוטין ל-capQuick() המקורי. items.length<=40 מחזיר
  // את אותה הפניה (ללא מיון/שינוי); אחרת ממיין (נעוצים תחילה, אז לפי שימוש) וחותך.
  function capQuick(items) {
    if (items.length <= 40) return items;
    items.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.count || 0) - (a.count || 0); });
    return items.slice(0, 40);
  }

  // לומד כל פריט בארוחה כאטום לרישום מהיר — זהה לחלוטין ל-learnQuickItems() המקורי.
  // r1fn מוזרק (עוגן משותף עם submitQuickLearn ב-app.js — אין שכפול). מוטציה במקום על
  // items הקיים (find/push), אך מחזיר את הערך הסופי (עשוי להיות מערך חדש אחרי capQuick).
  function learnQuickItems(meal, items, r1fn) {
    if (!meal || !Array.isArray(meal.items)) return items;
    var now = Date.now(), hr = new Date().getHours();
    meal.items.forEach(function (it) {
      var name = (it.name || '').trim();
      if (!name) return;
      var q = it.qty || 1;
      var eff = {
        amount: r1fn((it.amount || 0) * q), unit: it.unit || '',
        kcal: Math.round((it.kcal || 0) * q), protein: r1fn((it.protein || 0) * q), carbs: r1fn((it.carbs || 0) * q),
        fat: r1fn((it.fat || 0) * q), fiber: r1fn((it.fiber || 0) * q), sugar: r1fn((it.sugar || 0) * q), sodium: Math.round((it.sodium || 0) * q)
      };
      var e = items.find(function (x) { return x.name === name; });
      if (e) { e.count = (e.count || 0) + 1; e.lastUsed = now; e.lastHour = hr; Object.assign(e, eff); }
      else { items.push(Object.assign({ name: name }, eff, { count: 1, lastUsed: now, lastHour: hr, pinned: false })); }
    });
    return capQuick(items);
  }

  // ניקוד חכם — זהה לחלוטין ל-scoreQuick() המקורי: תדירות + התאמה לשעה + טריות + נעיצה.
  function scoreQuick(q) {
    var nowHr = new Date().getHours();
    var s = (q.count || 0) * 3;
    if (q.lastHour != null && Math.abs(q.lastHour - nowHr) <= 2) s += 8;
    if (q.lastUsed) { var days = (Date.now() - q.lastUsed) / 86400000; if (days < 2) s += 4; else if (days < 7) s += 2; }
    if (q.pinned) s += 1000;
    return s;
  }

  // נעיצה/ביטול נעיצה — זהה לחלוטין ל-pinQuick() המקורי (מוטציה במקום). מחזיר false אם
  // האינדקס לא קיים (כמו ה-`if (!q) return;` המקורי) כדי שהקורא ידע לדלג על השמירה/רינדור.
  function togglePin(items, gi) {
    var q = items[gi];
    if (!q) return false;
    q.pinned = !q.pinned;
    return true;
  }

  // הסרה — זהה לחלוטין ל-removeQuick() המקורי (splice במקום).
  function removeItem(items, gi) {
    items.splice(gi, 1);
  }

  // רישום סמכותי מהיר — זהה לחלוטין ל-logQuick() המקורי: שער אימות חובה (ללא פטור מקור —
  // בניגוד ל-addMeal), בניית authority עם source/rule קבועים, תוספת אופטימית, כתיבה דרך
  // PersistenceGateway (persistDaySnapshot מוזרק — משותף עם addMeal, WP5D), rollback בכשל,
  // דיכוי אפקטים ב-stale session, ועדכון סטטיסטיקת השימוש בפריט (count/lastUsed/lastHour)
  // בהצלחה. אינו קורא ל-renderQuickStrip (בכוונה — זהה למקור, לא באג).
  async function commitQuickItem(quickItem, todayData, waterCount, authorityOptions) {
    if (!quickItem) return false;
    var now = new Date();
    var item = {
      name: quickItem.name, amount: quickItem.amount, unit: quickItem.unit, kcal: quickItem.kcal,
      protein: quickItem.protein, carbs: quickItem.carbs, fat: quickItem.fat, fiber: quickItem.fiber,
      sugar: quickItem.sugar, sodium: quickItem.sodium, qty: 1
    };
    // REM-003 §10 "Quick Learn" — הערכת AI שנוצרה ב-submitQuickLearn() (Generative Persistent Data,
    // Level 2 בלבד) חייבת לעבור את אותו Authoritative Write Contract כמו כל מסלול AI אחר לפני
    // שהיא הופכת לרשומה סמכותית ביומן (todayData.meals, הניזון ל-Adaptive TDEE/Habit/Pattern).
    var gate = deps.nutritionOutputValidator.validateNutritionMeal([item], 'quick-log');
    deps.logValidation(gate.overallStatus, 'quick-log', deps.collectErrorCodes(gate));
    if (gate.overallStatus !== 'VALID') {
      deps.alertFn('הפריט הזה לא עבר אימות תזונתי. אפשר לרשום אותו דרך "הוסף ארוחה" כדי לבדוק/לתקן את הערכים.');
      return false;
    }
    var authority = AuthorityContract.buildAuthorityMetadata({
      source: AuthorityContract.AUTHORITY_SOURCES.USER_CONFIRMED_AI_ESTIMATE,
      createdBy: authorityOptions.createdByUid,
      rule: 'logQuick.v1',
      systemVersion: authorityOptions.systemVersion
    });
    var newMeal = {
      name: quickItem.name, kcal: quickItem.kcal, protein: quickItem.protein, carbs: quickItem.carbs, fat: quickItem.fat,
      fiber: quickItem.fiber, sugar: quickItem.sugar, sodium: quickItem.sodium,
      items: [item], time: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
      authority: authority
    };
    // B4 §26: מוסיפים אופטימית מיד (סינכרונית) כמו addMeal() — למניעת race מול תוספת
    // מקבילה; rollback מפורש (הסרת הרשומה) בכשל durable, במקום דחיית המוטציה עד אחרי ה-await.
    var gen = deps.sessionLifecycle.getGeneration();
    todayData.meals.push(newMeal);
    var snapshotMeals = todayData.meals.slice();
    var result = await deps.persistDaySnapshot(snapshotMeals, todayData.burned, todayData.steps, waterCount, authority, gen);
    if (result.status !== 'SUCCESS' && result.status !== 'NO_OP') {
      var idx = todayData.meals.indexOf(newMeal);
      if (idx !== -1) todayData.meals.splice(idx, 1);
      // REM-002: אין אפקט (alert) אם הסשן כבר אינו נוכחי (Implementation Review correction).
      if (deps.sessionLifecycle.isCurrent(gen)) deps.alertFn('שמירת הפריט נכשלה. נסה שוב.');
      return false;
    }
    if (!deps.sessionLifecycle.isCurrent(gen)) return false; // REM-002: stale-on-completion — אין אפקטים
    quickItem.count = (quickItem.count || 0) + 1;
    quickItem.lastUsed = Date.now();
    quickItem.lastHour = now.getHours();
    return true;
  }

  var API = {
    configure: configure,
    capQuick: capQuick,
    learnQuickItems: learnQuickItems,
    scoreQuick: scoreQuick,
    togglePin: togglePin,
    removeItem: removeItem,
    commitQuickItem: commitQuickItem
  };

  if (typeof window !== 'undefined') { window.QuickLogService = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
