const VERSION = 'v2.0.0';
const CACHE = 'fitme-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    '/fitme/',
    '/fitme/index.html',
    '/fitme/css/app.css',
    '/fitme/js/app.js',
    '/fitme/js/firebase-config.js',
    '/fitme/icon192.png',
    '/fitme/icon512.png'
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('anthropic') ||
      e.request.url.includes('gstatic')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'FitMe', body: 'התראה חדשה' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/fitme/icon192.png',
    badge: '/fitme/icon192.png',
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
