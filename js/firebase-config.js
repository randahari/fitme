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

// iOS PWA: redirect במקום popup
function signInWithGoogle() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.navigator.standalone === true;

  if (isIOS || isPWA) {
    auth.signInWithRedirect(googleProvider);
  } else {
    auth.signInWithPopup(googleProvider).catch(err => {
      // fallback לredirect אם popup נחסם
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        auth.signInWithRedirect(googleProvider);
      } else {
        alert('שגיאה בהתחברות. נסה שוב.');
      }
    });
  }
}

// טיפול בחזרה מ-redirect
auth.getRedirectResult().then(result => {
  // המשתמש חזר מ-Google — auth.onAuthStateChanged יטפל בשאר
}).catch(err => {
  if (err.code !== 'auth/no-auth-event') {
    console.error('Redirect error:', err);
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/fitme/sw.js').catch(e => console.log('SW:', e));
}
