// ══════════════════════════════════════════════════════════════════
// FitMe — External Food Catalog Adapter (Open Food Facts) (C1-WP2)
// אחריות בלעדית: בקשת Open Food Facts, מיפוי תגובה לצורת הפריט של
// FitMe, ומיפוי שגיאות רשת. אינו מחליט מה קורה כשהמוצר לא נמצא (UI) —
// זו אחריות המזמין (js/app.js). fetch מוזרק דרך configure() לבדיקות.
// חולץ מ-js/app.js ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var BASE_URL = 'https://world.openfoodfacts.org/api/v0/product/';

  var deps = { fetchFn: typeof fetch !== 'undefined' ? fetch : undefined };
  function configure(injected) { deps = injected || deps; }

  // מחזיר { found:false } כשאין מוצר/אין ערכים תזונתיים אמיתיים, או
  // { found:true, item, servingSizeKnown, servingSizeRaw } עם הצורה הפנימית
  // של FitMe (זהה לחלוטין לחישוב הקודם: factor לפי גודל מנה, עיגול ל-0.1,
  // נתרן ×1000 מ-גרם ל-מ"ג).
  async function lookupProduct(code) {
    var data;
    try {
      var res = await deps.fetchFn(BASE_URL + code + '.json');
      data = await res.json();
    } catch (e) {
      // מיפוי שגיאה מנורמל — כולל גם כשל fetch וגם כשל parse, בדיוק כמו
      // ה-try/catch המשותף היחיד בקוד המקורי.
      var netErr = new Error('OFF_NETWORK_ERROR');
      netErr.code = 'NETWORK_ERROR';
      netErr.cause = e;
      throw netErr;
    }
    if (data.status !== 1 || !data.product) return { found: false };

    var p = data.product;
    var n = p.nutriments || {};
    var servingSize = p.serving_size ? parseFloat(p.serving_size) : NaN;
    var grams = isNaN(servingSize) ? 100 : servingSize;
    var factor = grams / 100;
    var r1 = function (v) { return Math.round((v || 0) * factor * 10) / 10; };
    var item = {
      name: p.product_name_he || p.product_name || 'מוצר לא ידוע',
      amount: grams, unit: 'גרם',
      kcal: Math.round((n['energy-kcal_100g'] || n['energy_100g'] || 0) * factor),
      protein: r1(n['proteins_100g']), carbs: r1(n['carbohydrates_100g']), fat: r1(n['fat_100g']),
      fiber: r1(n['fiber_100g']), sugar: r1(n['sugars_100g']),
      sodium: Math.round((n['sodium_100g'] || 0) * factor * 1000)
    };
    var hasData = item.kcal > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0;
    if (!hasData) return { found: false };

    return { found: true, item: item, servingSizeKnown: !isNaN(servingSize), servingSizeRaw: p.serving_size || null };
  }

  var API = { configure: configure, lookupProduct: lookupProduct, BASE_URL: BASE_URL };

  if (typeof window !== 'undefined') { window.OpenFoodFactsClient = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
