// ══════════════════════════════════════════════════════════════════
// FitMe — Meal Draft Model (C1-WP5B, Nutrition Application Domain)
// אחריות בלעדית: פעולות טהורות ודטרמיניסטיות על טיוטת ארוחה — יצירת
// טיוטה מנורמלת, חישוב סה"כ, שינוי כמות, עדכון עריכה, מחיקה, קידום
// הצעה, ובניית הארוחה הסמכותית. אין כאן DOM, רינדור, Firebase,
// פרסיסטנס, קריאות AI, בעלות על state, session lifecycle, commit/
// rollback, או UI התאוששות — אלה נשארים באחריות js/app.js. תלוי אך
// ורק במודולים הטהורים הקיימים NutritionModel (C1-WP1) ו-
// AuthorityContract (B3/B4), באותו דפוס require/window ישיר שכבר
// קיים בין js/domain/nutritionModel.js ל-js/core/numberUtils.js —
// אין כאן configure() כי אין תלות בפלטפורמה. חולץ מ-js/app.js ללא
// שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP5B.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var NutritionModel = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/nutritionModel.js')
    : window.NutritionModel;
  var AuthorityContract = (typeof module !== 'undefined' && module.exports)
    ? require('../authorityContract.js')
    : window.AuthorityContract;
  var normalizeItem = NutritionModel.normalizeItem;

  // יצירת טיוטה מנורמלת — זהה לחלוטין ל-showMealEditor() המקורי (הבניית pendingMeal בלבד;
  // איפוס editingItemIdx ורינדור נשארים ב-app.js).
  function buildDraft(meal) {
    meal = meal || {};
    return {
      name: meal.name || 'ארוחה',
      note: meal.note || '',
      source: meal.source || null,        // 'off' | 'label' | 'group' | 'plate' | null
      barcode: meal.barcode || null,      // אם מלא — שמירה למאגר הקבוצה בעת ההוספה
      addedByName: meal.addedByName || '',
      items: (meal.items || []).map(normalizeItem),
      suggestions: (meal.suggestions || []).map(normalizeItem)
    };
  }

  // סה"כ — זהה לחלוטין ל-mealTotals() המקורי (ללא הבדיקה !pendingMeal, שנשארת ב-app.js).
  function computeTotals(items) {
    var t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    (items || []).forEach(function (it) {
      t.kcal += it.kcal * it.qty; t.protein += it.protein * it.qty; t.carbs += it.carbs * it.qty;
      t.fat += it.fat * it.qty; t.fiber += it.fiber * it.qty; t.sugar += it.sugar * it.qty; t.sodium += it.sodium * it.qty;
    });
    return t;
  }

  // שינוי כמות — זהה לחלוטין ל-editorQty() המקורי. מוטציה במקום (כמו המקור), מחזיר את הפריט.
  function changeQty(item, dir) {
    var step = 0.25;
    item.qty = Math.max(step, Math.round((item.qty + dir * step) * 100) / 100);
    return item;
  }

  // עדכון עריכה — זהה לחלוטין ל-editorSaveEdit() המקורי (9 השדות). מוטציה במקום, מחזיר את הפריט.
  // קריאת ה-DOM עצמה (document.getElementById) נשארת ב-app.js — fields כבר מוכן.
  function applyEdit(item, fields) {
    item.name = fields.name;
    item.amount = fields.amount;
    item.unit = fields.unit;
    item.kcal = fields.kcal;
    item.protein = fields.protein;
    item.carbs = fields.carbs;
    item.fat = fields.fat;
    item.fiber = fields.fiber;
    item.sugar = fields.sugar;
    item.sodium = fields.sodium;
    return item;
  }

  // מחיקה — זהה לחלוטין ל-editorDelete() המקורי (splice במקום על אותו מערך).
  function removeItem(items, i) {
    items.splice(i, 1);
    return items;
  }

  // קידום הצעה — זהה לחלוטין ל-editorAddSuggestion() המקורי (push ל-items, splice מ-suggestions,
  // qty:1 קבוע לפריט המקודם).
  function promoteSuggestion(items, suggestions, i) {
    var s = suggestions[i];
    if (!s) return { items: items, suggestions: suggestions };
    items.push(Object.assign({}, s, { qty: 1 }));
    suggestions.splice(i, 1);
    return { items: items, suggestions: suggestions };
  }

  // בניית הארוחה הסמכותית — זהה לחלוטין ל-buildMealFromEditor() המקורי: אותו עיגול, אותה
  // צורת time, אותה קריאה ל-AuthorityContract.buildAuthorityMetadata עם אותם שדות בדיוק.
  // now ניתן להזרקה לבדיקות (ברירת מחדל new Date(), זהה למקור כשלא מוזרק).
  function buildAuthoritativeMeal(draft, options, now) {
    options = options || {};
    var t = computeTotals(draft.items);
    var d = now || new Date();
    return {
      name: draft.name,
      kcal: Math.round(t.kcal),
      protein: Math.round(t.protein * 10) / 10, carbs: Math.round(t.carbs * 10) / 10, fat: Math.round(t.fat * 10) / 10,
      fiber: Math.round(t.fiber * 10) / 10, sugar: Math.round(t.sugar * 10) / 10, sodium: Math.round(t.sodium),
      items: draft.items.map(function (it) { return Object.assign({}, it); }),
      time: d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'),
      authority: AuthorityContract.buildAuthorityMetadata({
        source: options.authoritySource,
        createdBy: options.createdByUid,
        rule: 'meal-editor.addMeal.v1',
        systemVersion: options.systemVersion
      })
    };
  }

  var API = {
    buildDraft: buildDraft,
    computeTotals: computeTotals,
    changeQty: changeQty,
    applyEdit: applyEdit,
    removeItem: removeItem,
    promoteSuggestion: promoteSuggestion,
    buildAuthoritativeMeal: buildAuthoritativeMeal
  };

  if (typeof window !== 'undefined') { window.MealDraft = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
