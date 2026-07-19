// ══════════════════════════════════════════════════════════════════
// FitMe — Runtime State (C1-WP4, Session and Application Bootstrap)
// אחריות בלעדית: accessors סמנטיים סגורים עבור זהות ה-session (currentUser),
// הפרופיל (userProfile), והיום המוצג (todayData). אינו מחזיק את המשתנים
// עצמם — אלה נשארים משתני let פיזיים ב-js/app.js (כדי לשמר תאימות מלאה
// ל-js/memory.js, שקורא currentUser/userProfile/saveProfile כמשתנים
// גלובליים חשופים-לקסיקלית, ולא דרך API כלשהו). המודול הזה עוטף אותם
// ב-closures מוזרקים דרך configure(), בדיוק כמו js/stateAccess.js (B3).
// אין כאן get(key)/set(key,value) גנרי, אין patching שרירותי, אין
// service locator — רק שבעת ה-accessors הסגורים לפי
// docs/specs/C1_SPEC_v1.0.md §C1-WP4 (Runtime State Contract).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function getCurrentUser() { return deps.getCurrentUser(); }
  function setAuthenticatedUser(user) { deps.setCurrentUser(user); }

  function getProfile() { return deps.getProfile(); }
  function replaceProfile(profile) { deps.setProfile(profile); }

  function getDisplayedDay() { return deps.getDisplayedDay(); }
  function replaceDisplayedDay(snapshot) { deps.setDisplayedDay(snapshot); }

  // מאפס בדיוק את שלושת הערכים שמודול זה בעלים עליהם (זהות + היום המוצג).
  // אינו נוגע בשום state של דומיין אחר (workout/onboarding/coach/adaptive/
  // nutrition וכו') — אלה נשארים באחריות _resetAppCoreState ב-js/app.js.
  function resetForSession() {
    deps.setCurrentUser(null);
    deps.setProfile(null);
    deps.setDisplayedDay({ meals: [], burned: 0, steps: 0 });
  }

  var API = {
    configure: configure,
    getCurrentUser: getCurrentUser,
    setAuthenticatedUser: setAuthenticatedUser,
    getProfile: getProfile,
    replaceProfile: replaceProfile,
    getDisplayedDay: getDisplayedDay,
    replaceDisplayedDay: replaceDisplayedDay,
    resetForSession: resetForSession
  };

  if (typeof window !== 'undefined') { window.RuntimeState = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
