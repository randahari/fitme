const firebaseConfig = {
  apiKey: "AIzaSyCK-hyj0mHdpGRPbcxT7q3AiZX4Fjwytcg",
  authDomain: "fitme-f9289.firebaseapp.com",
  projectId: "fitme-f9289",
  storageBucket: "fitme-f9289.firebasestorage.app",
  messagingSenderId: "519971281388",
  appId: "1:519971281388:web:995332db7dde2049db08c9",
  measurementId: "G-8P2WXYN4EH"
};

firebase.initializeApp(firebaseConfig);
if (window.__mark) __mark('2 firebase.initializeApp done'); // PERF-002
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// שמירת סשן ב-IndexedDB — המשתמש נשאר מחובר בין פתיחות
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e => console.warn('persistence:', e));

// התחברות עם Google:
// popup קודם (עובד גם ב-iOS PWA מודרני ובדסקטופ). redirect נשמר כגיבוי בלבד,
// כי ב-PWA מותקן ב-iOS ה-redirect מאבד את המצב במעבר מספארי לאפליקציה.
function signInWithGoogle() {
  auth.signInWithPopup(googleProvider).catch(err => {
    const code = err && err.code ? err.code : '';
    console.warn('sign-in popup failed:', code, err && err.message);
    const fallbackCodes = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment'
    ];
    if (fallbackCodes.includes(code)) {
      auth.signInWithRedirect(googleProvider).catch(e => {
        alert('שגיאה בהתחברות: ' + (e.code || e.message || 'לא ידוע'));
      });
    } else if (code === 'auth/network-request-failed') {
      alert('אין חיבור לאינטרנט. נסה שוב.');
    } else if (code) {
      alert('שגיאה בהתחברות: ' + code);
    }
    // אם המשתמש סגר את החלון בעצמו (לחיצה על X) — אל תראה שגיאה, פשוט לא עשה כלום
  });
}

// טיפול בחזרה מ-redirect (רק אם ה-fallback הופעל)
auth.getRedirectResult().catch(err => {
  const code = err && err.code;
  if (code && code !== 'auth/no-auth-event') {
    console.error('Redirect error:', code, err.message);
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  if (window.__mark) __mark('3 SW register: start  (controller now=' + !!navigator.serviceWorker.controller + ')'); // PERF-002
  navigator.serviceWorker.register('/fitme/sw.js')
    .then(reg => { if (window.__mark) __mark('3 SW register: ok  (scope ' + reg.scope + ')'); }) // PERF-002
    .catch(e => { if (window.__mark) __mark('3 SW register: FAILED'); console.log('SW:', e); });
  // PERF-002: when is a SW actually active + controlling the page?
  navigator.serviceWorker.ready.then(reg => {
    if (window.__mark) __mark('3b SW ready  (active=' + !!(reg && reg.active) + ', controller=' + !!navigator.serviceWorker.controller + ')');
  });
}
