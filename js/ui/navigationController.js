// ══════════════════════════════════════════════════════════════════
// FitMe — Navigation Controller (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: goToScreen — המימוש הסופי-בזמן-ריצה היחיד. מאחד שתי שכבות
// override שהיו קיימות ב-js/app.js: ה-override "goToScreen (4-tab version)"
// (ה-silent-replacement שהחליף את ההגדרה הבסיסית המתה — docs/architecture/
// C1_WP0_INVENTORY.md §2.2) וה-wrap שהוסיפה ה-Day Navigation IIFE (רענון באנר
// תאריך המזון כשעוברים למסך האוכל). ראה docs/specs/C1_SPEC_v1.0.md §C1-WP10.
// אינו מבצע רינדור בעצמו — כל רינדור למסך ספציפי מוזרק כ-closure, כדי שהמודול
// לא יזדקק לדעת דבר על Home/Food/Profile/Settings/Day-Navigation.
// תלויות: DOM (documentRef) בלבד.
// אסור: לבצע כתיבה עמידה; להכיר StateAccess/PersistenceGateway/Firebase.
// חשיפה: window.NavigationController + module.exports (דפוס זהה לשאר מודולי C1).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // המימוש הסופי-בזמן-ריצה היחיד של goToScreen — זהה בהתנהגותו לצירוף
  // ["goToScreen (4-tab version)" override] + [ה-wrap של ה-Day Navigation IIFE],
  // בדיוק באותו סדר קריאות.
  function goToScreen(name) {
    deps.documentRef.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    deps.documentRef.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
    var screen = deps.documentRef.getElementById('screen-' + name);
    if (screen) screen.classList.add('active');
    var nav = deps.documentRef.getElementById('nav-' + name);
    if (nav) nav.classList.add('active');

    if (name === 'home') deps.renderHome();
    if (name === 'food') { deps.renderFoodMeals(); deps.renderFavoritesList(); deps.renderQuickStrip(); deps.maybeShowQuickLearn(); }
    if (name === 'profile') deps.renderProfile();
    if (name === 'settings') deps.renderSettings();
    if (name === 'workout') deps.updateWorkout();

    // Day Navigation IIFE wrap: מרעננת את באנר תאריך המזון בכל מעבר למסך האוכל.
    if (name === 'food') deps.updateFoodDateBanner();
  }

  var API = {
    configure: configure,
    goToScreen: goToScreen
  };

  if (typeof window !== 'undefined') { window.NavigationController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
