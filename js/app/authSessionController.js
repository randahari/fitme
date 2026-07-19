// ══════════════════════════════════════════════════════════════════
// FitMe — Auth Session Controller (C1-WP4, Session and Application Bootstrap)
// אחריות בלעדית: מכונת-המצבים של מעברי האימות — נרשם ל-AuthAdapter,
// מקדם session generation לפני ניקוי (REM-002), טוען profile/day/
// favourites (BootstrapController), ובוחר login/onboarding/app. אינו
// יודע דבר על pendingMeal/foodSession/coach/adaptive/UI רינדור בפועל —
// אלה מוזרקים כ-callbacks על-ידי js/app.js (showApp/showOnboarding/
// showLogin/initNotifications/migrateIfNeeded/onSignedOut). זהה
// לחלוטין ל-handler המקורי (AuthAdapter.onAuthStateChanged) שהיה
// ב-js/app.js — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP4.
//
// הערה קריטית לבדיקה: loadUserData מוזרק כ-closure (function(){ return
// deps.loadUserData(); }), לא כהפניה חשופה — loadUserData נעטף מאוחר
// יותר ב-app.js (Day Navigation IIFE, override chain מתועד ב-
// C1_WP0_INVENTORY.md §2.1). closure מבטיח שנקרא תמיד את ההגדרה
// הסופית-בזמן-ריצה, לא את הגרסה שנלכדה בזמן configure().
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function start() {
    return deps.authAdapter.onAuthStateChanged(handleAuthStateChange);
  }

  // REM-002 §5-§7: כל מעבר auth (sign-out / UID אחר / חזרה ל-unauthenticated)
  // מפעיל reset() מרכזי אחד: מקדם generation (חוסם async ישן) ומריץ את כל
  // ה-cleanups הרשומים — לפני כל שינוי state נוסף (generation-before-cleanup).
  async function handleAuthStateChange(user) {
    var _authGen = deps.sessionLifecycle.reset(user ? 'auth:signed-in' : 'auth:signed-out');
    if (user) {
      deps.runtimeState.setAuthenticatedUser(user);
      await deps.loadUserData();
      if (!deps.sessionLifecycle.isCurrent(_authGen)) return; // סשן זה הוחלף בזמן הטעינה — לא ממשיכים
      if (deps.runtimeState.getProfile()) {
        deps.showApp();
        deps.initNotifications();
        deps.migrateIfNeeded();
      } else {
        deps.showOnboarding();
      }
    } else {
      deps.runtimeState.setAuthenticatedUser(null);
      deps.runtimeState.replaceProfile(null);
      // REM-001 §19 Invariant 9 / ER-006 — ניקוי מועמד תזונתי חוצה-משתמשים
      // (nutrition-domain state; לא בבעלות מודול זה — מוזרק על-ידי js/app.js).
      if (typeof deps.onSignedOut === 'function') deps.onSignedOut();
      deps.showLogin();
    }
  }

  var API = { configure: configure, start: start, handleAuthStateChange: handleAuthStateChange };

  if (typeof window !== 'undefined') { window.AuthSessionController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
