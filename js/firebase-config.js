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
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// שמירת סשן ב-IndexedDB — המשתמש נשאר מחובר בין פתיחות
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e => console.warn('persistence:', e));

// התחברות עם Google:
// popup קודם (עובד גם ב-iOS PWA מודרני ובדסקטופ). redirect נשמר כגיבוי בלבד,
// כי ב-PWA מותקן ב-iOS ה-redirect מאבד את המצב במעבר מספארי לאפליקציה.
// C1-WP2: המנגנון הגולמי (popup/redirect/קודי שגיאה) עבר ל-AuthAdapter; כאן
// נשארת רק ההחלטה איזו הודעת UI להציג — זהה לחלוטין להתנהגות הקודמת.
function signInWithGoogle() {
  AuthAdapter.signInWithGoogle().then(result => {
    if (result.status === 'ERROR') {
      if (result.code === 'auth/network-request-failed') alert('אין חיבור לאינטרנט. נסה שוב.');
      else if (result.code) alert('שגיאה בהתחברות: ' + result.code);
      else alert('שגיאה בהתחברות: ' + (result.message || 'לא ידוע'));
    }
    // SUCCESS / REDIRECTING / CANCELLED — אין הודעת UI, בדיוק כמו קודם.
  });
}

// טיפול בחזרה מ-redirect (רק אם ה-fallback הופעל)
AuthAdapter.handleRedirectResult().catch(err => {
  const code = err && err.code;
  if (code && code !== 'auth/no-auth-event') {
    console.error('Redirect error:', code, err.message);
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/fitme/sw.js').catch(e => console.log('SW:', e));
}
