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

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/fitme/sw.js').catch(e => console.log('SW:', e));
}
