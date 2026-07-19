// ══════════════════════════════════════════════════════════════════
// FitMe — Nutrition Model (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: חישובים/נרמול תזונה טהורים (סכימת קלוריות ליום,
// נרמול פריט מארוחה) — ללא DOM, ללא state גלובלי, ללא Firebase.
// תלוי ב-js/core/numberUtils.js (num()) בלבד. חולצה מ-js/app.js
// ללא שינוי סמנטי — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP1,
// docs/architecture/C1_WP0_INVENTORY.md.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var NumberUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/numberUtils.js')
    : window.NumberUtils;
  var num = NumberUtils.num;

  // סכימת קלוריות ליום בודד.
  function dayKcal(dayData) {
    return (dayData && dayData.meals || []).reduce(function (s, m) { return s + (m.kcal || 0); }, 0);
  }

  function normalizeItem(it) {
    return {
      name: it.name || 'פריט', amount: num(it.amount), unit: it.unit || '', kcal: num(it.kcal),
      protein: num(it.protein), carbs: num(it.carbs), fat: num(it.fat),
      fiber: num(it.fiber), sugar: num(it.sugar), sodium: num(it.sodium), qty: it.qty || 1
    };
  }

  var API = { dayKcal: dayKcal, normalizeItem: normalizeItem };

  if (typeof window !== 'undefined') { window.NutritionModel = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
