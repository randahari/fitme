const VERSION = 'v2.20.0';
const CACHE = 'fitme-' + VERSION;

// נכסי ה-shell הסטטיים — נטענים cache-first (stale-while-revalidate)
const SHELL = [
  '/fitme/',
  '/fitme/index.html',
  '/fitme/css/app.css',
  '/fitme/js/firebase-config.js',
  '/fitme/js/sessionLifecycle.js',
  '/fitme/js/nutritionValidator.js',
  '/fitme/js/authorityContract.js',
  '/fitme/js/app.js',
  '/fitme/js/memory.js',
  '/fitme/assets/icon-192.png',
  '/fitme/assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Firebase + שירותים חיצוניים: network-only (לעולם לא מהקאש)
function isNetworkOnly(url) {
  return url.includes('firestore') ||
         url.includes('googleapis') ||
         url.includes('gstatic') ||
         url.includes('firebaseapp') ||
         url.includes('cloudfunctions') ||
         url.includes('anthropic') ||
         url.includes('openfoodfacts');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;          // כתיבות/פרוקסי — תמיד לרשת
  if (isNetworkOnly(req.url)) return;        // Firebase/חיצוני — network-only

  // shell סטטי, same-origin: stale-while-revalidate
  // מגישים מיד מהקאש (מהיר), ומרעננים ברקע לפעם הבאה.
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchAndCache = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchAndCache;
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'FitMe', body: 'התראה חדשה' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/fitme/assets/icon-192.png',
    badge: '/fitme/assets/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    vibrate: [200, 100, 200],
    data: data.url || '/fitme/'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/fitme/'));
});
