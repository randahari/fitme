// ══════════════════════════════════════════════════════════════════
// FitMe — Number Utilities (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: פונקציות מספריות טהורות — ללא DOM, ללא state גלובלי.
// חולצה מ-js/app.js ללא שינוי סמנטי — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP1, docs/architecture/C1_WP0_INVENTORY.md.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // רגרסיה לינארית (least squares). points: [{x, y}] → שיפוע.
  function linearSlope(points) {
    var n = points.length;
    if (n < 2) return 0;
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x;
    }
    var denom = n * sxx - sx * sx;
    if (denom === 0) return 0;
    return (n * sxy - sx * sy) / denom;
  }

  // המרה בטוחה למספר — NaN/undefined/null הופכים ל-0.
  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  var API = { linearSlope: linearSlope, num: num };

  if (typeof window !== 'undefined') { window.NumberUtils = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
