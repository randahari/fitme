// ══════════════════════════════════════════════════════════════════
// FitMe — Profile Repository (C1-WP3, Repository Layer)
// אחריות בלעדית: עטיפת מנגנוני Firestore הגולמיים עבור מסמך הפרופיל
// (users/{uid}) — קריאה ומיזוג בלבד. אינו מחליט מתי לטעון/לשמור, אינו
// יודע דבר על migration/quickItems/UI — אלו נשארים באחריות המזמין
// (js/app.js). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP3.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function loadProfile(uid) {
    return deps.db.collection('users').doc(uid).get();
  }

  function mergeProfile(uid, profile) {
    return deps.db.collection('users').doc(uid).set(profile, { merge: true });
  }

  // הערה: מחיקת המסמך (resetApp) אינה כלולה כאן במכוון — אינה מופיעה
  // ברשימת ה-behaviours המאושרים ל-Profile Repository ב-
  // docs/specs/C1_SPEC_v1.0.md §C1-WP3, ולכן נשארת גישת Firestore ישירה
  // ב-js/app.js (מחוץ ל-scope של חבילת עבודה זו).

  var API = {
    configure: configure,
    loadProfile: loadProfile,
    mergeProfile: mergeProfile
  };

  if (typeof window !== 'undefined') { window.ProfileRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
