// ══════════════════════════════════════════════════════════════════
// FitMe — Bootstrap Controller (C1-WP4, Session and Application Bootstrap)
// אחריות בלעדית: מנגנון הטעינה המקבילית של profile/day/favourites
// (PERF-001) — שלוש קריאות Repository עצמאיות המונפקות יחד ב-
// Promise.all, בדיוק כמו הקוד המקורי ב-loadUserData(). אינו מחליט מה
// לעשות עם התוצאות (migration/darkMode/waterCount/favoriteMeals/
// quickItems) — אלו החלטות שנשארות ב-js/app.js's loadUserData(), שקורא
// למודול הזה כמנגנון-ה-fetch שלו בלבד. חולץ מ-js/app.js ללא שינוי
// התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP4.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // PERF-001: שלוש הקריאות עצמאיות — מונפקות במקביל (Promise.all) במקום טורית.
  function loadUserSnapshot(uid, todayKey) {
    return Promise.all([
      deps.profileRepository.loadProfile(uid),
      deps.dayRepository.loadDay(uid, todayKey),
      deps.favoritesRepository.load(uid)
    ]);
  }

  var API = { configure: configure, loadUserSnapshot: loadUserSnapshot };

  if (typeof window !== 'undefined') { window.BootstrapController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
