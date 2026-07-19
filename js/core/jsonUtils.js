// ══════════════════════════════════════════════════════════════════
// FitMe — JSON Utilities (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: חילוץ JSON טהור מטקסט — ללא DOM, ללא state גלובלי.
// חולצה מ-js/app.js ללא שינוי סמנטי — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP1, docs/architecture/C1_WP0_INVENTORY.md.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // חילוץ JSON עמיד מתשובת המודל — עומד גם אם המודל הוסיף טקסט (בעברית) לפני/אחרי ה-JSON.
  function parseModelJSON(raw) {
    var t = String(raw == null ? '' : raw).replace(/```json|```/g, '').trim();
    var firstObj = t.indexOf('{');
    var firstArr = t.indexOf('[');
    if (firstObj === -1 && firstArr === -1) throw new Error('לא נמצא JSON בתשובה');
    var start, endChar;
    if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) { start = firstArr; endChar = ']'; }
    else { start = firstObj; endChar = '}'; }
    var end = t.lastIndexOf(endChar);
    if (end > start) t = t.slice(start, end + 1);
    return JSON.parse(t);
  }

  var API = { parseModelJSON: parseModelJSON };

  if (typeof window !== 'undefined') { window.JsonUtils = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
