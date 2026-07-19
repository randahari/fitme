// ══════════════════════════════════════════════════════════════════
// FitMe — Authentication Adapter (C1-WP2, Platform Adapters)
// אחריות בלעדית: עטיפת מנגנוני Firebase Auth הגולמיים (מנוי מצב-חיבור,
// כניסה עם Google, יציאה, קבלת טוקן). אינו מחליט התנהגות אימות, אינו
// מציג UI (alert/confirm), אינו יודע מה קורה אחרי שינוי מצב — רק עוטף
// את הקריאה הגולמית ל-SDK ומחזיר תוצאות מנורמלות. חולץ מ-js/app.js /
// js/firebase-config.js ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // עוטף Firebase auth state subscription — הקריאה הגולמית בלבד; ה-callback
  // (מה קורה בכל שינוי מצב) נשאר בבעלות המזמין (js/app.js, WP4 bootstrap).
  function onAuthStateChanged(callback) {
    return deps.auth.onAuthStateChanged(callback);
  }

  function signOut() {
    return deps.auth.signOut();
  }

  function getIdToken(user) {
    return user.getIdToken();
  }

  function handleRedirectResult() {
    return deps.auth.getRedirectResult();
  }

  // כניסה עם Google: popup קודם, נפילה חזרה ל-redirect רק בקודי השגיאה
  // הידועים כ"popup לא זמין/נחסם/בוטל". מחזיר תוצאה מנורמלת — ה-caller
  // (js/firebase-config.js) מחליט אילו הודעות UI להציג, זהות לחלוטין
  // להתנהגות הקודמת. הרצף/קודים הועברו כלשונם, ללא שינוי.
  async function signInWithGoogle() {
    try {
      await deps.auth.signInWithPopup(deps.googleProvider);
      return { status: 'SUCCESS' };
    } catch (err) {
      var code = (err && err.code) || '';
      console.warn('sign-in popup failed:', code, err && err.message);
      var fallbackCodes = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment'
      ];
      if (fallbackCodes.indexOf(code) !== -1) {
        try {
          await deps.auth.signInWithRedirect(deps.googleProvider);
          return { status: 'REDIRECTING' };
        } catch (e2) {
          return { status: 'ERROR', code: (e2 && e2.code) || null, message: (e2 && e2.message) || null };
        }
      }
      if (code === 'auth/network-request-failed') return { status: 'ERROR', code: code, message: null };
      if (code) return { status: 'ERROR', code: code, message: null };
      // המשתמש סגר את החלון בעצמו (ללא code) — אין שגיאה להציג.
      return { status: 'CANCELLED' };
    }
  }

  var API = {
    configure: configure,
    onAuthStateChanged: onAuthStateChanged,
    signOut: signOut,
    getIdToken: getIdToken,
    handleRedirectResult: handleRedirectResult,
    signInWithGoogle: signInWithGoogle
  };

  if (typeof window !== 'undefined') { window.AuthAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
