// ══════════════════════════════════════════════════════════════════
// FitMe — Date Utilities (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: פונקציות תאריך טהורות — ללא DOM, ללא state גלובלי,
// ללא Firebase. פונקציות תלויות-שעון מקבלות `now` כפרמטר אופציונלי
// (בררת מחדל `new Date()`) כדי שיהיו ניתנות לבדיקה דטרמיניסטית.
// חולצה מ-js/app.js ללא שינוי סמנטי — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP1, docs/architecture/C1_WP0_INVENTORY.md.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getTodayKey(now) {
    return dateKey(now || new Date());
  }

  function daysBetween(k1, k2) {
    return Math.round((new Date(k1 + 'T00:00:00') - new Date(k2 + 'T00:00:00')) / 86400000);
  }

  var API = { dateKey: dateKey, getTodayKey: getTodayKey, daysBetween: daysBetween };

  if (typeof window !== 'undefined') { window.DateUtils = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
