// ══════════════════════════════════════════════════════════════════
// FitMe — String Utilities (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: בריחת HTML טהורה — ללא DOM, ללא state גלובלי.
// לא ברשימת המודולים המומלצת המפורשת ב-C1_SPEC §C1-WP1 (שאינה כוללת
// "stringUtils"), אך esc() הוא פונקציה מועמדת מפורשת שם ואינה שייכת
// סמנטית לאף מודול יעד אחר; קובץ ייעודי במקום לדחוס אותה למודול
// שאינו קשור, בהתאם לכלל "responsibilities may not be collapsed into
// a generic 'utils' dumping ground" ול"Folder names may be adjusted".
// חולצה מ-js/app.js ללא שינוי סמנטי.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESCAPE_MAP[c]; });
  }

  var API = { esc: esc };

  if (typeof window !== 'undefined') { window.StringUtils = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
