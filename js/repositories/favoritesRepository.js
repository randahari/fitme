// ══════════════════════════════════════════════════════════════════
// FitMe — Favorites Repository (C1-WP3, Repository Layer)
// אחריות בלעדית: עטיפת מנגנון Firestore הגולמי עבור מסמך המועדפים
// (users/{uid}/data/favorites) — שומר בדיוק את אותו נתיב מסמך וצורת
// payload כמו הקוד המקורי. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP3.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function load(uid) {
    return deps.db.collection('users').doc(uid).collection('data').doc('favorites').get();
  }

  function save(uid, meals) {
    return deps.db.collection('users').doc(uid).collection('data').doc('favorites').set({ meals: meals });
  }

  var API = { configure: configure, load: load, save: save };

  if (typeof window !== 'undefined') { window.FavoritesRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
