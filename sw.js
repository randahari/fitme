const VERSION = 'v2.39.0';
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
  '/fitme/js/engineRegistry.js',
  '/fitme/js/stateAccess.js',
  '/fitme/js/persistenceGateway.js',
  '/fitme/js/derivedIntelligenceConsumer.js',
  '/fitme/js/derivedIntelligencePrompt.js',
  '/fitme/js/core/dateUtils.js',
  '/fitme/js/core/numberUtils.js',
  '/fitme/js/core/jsonUtils.js',
  '/fitme/js/core/stringUtils.js',
  '/fitme/js/domain/profileMetrics.js',
  '/fitme/js/domain/nutritionModel.js',
  '/fitme/js/adapters/authAdapter.js',
  '/fitme/js/adapters/notificationAdapter.js',
  '/fitme/js/adapters/imageAdapter.js',
  '/fitme/js/adapters/barcodeScannerAdapter.js',
  '/fitme/js/adapters/openFoodFactsClient.js',
  '/fitme/js/adapters/claudeProxyClient.js',
  '/fitme/js/repositories/profileRepository.js',
  '/fitme/js/repositories/dayRepository.js',
  '/fitme/js/repositories/favoritesRepository.js',
  '/fitme/js/repositories/groupRepository.js',
  '/fitme/js/repositories/barcodeRepository.js',
  '/fitme/js/app/runtimeState.js',
  '/fitme/js/app/bootstrapController.js',
  '/fitme/js/app/authSessionController.js',
  '/fitme/js/nutrition/nutritionAnalysisService.js',
  '/fitme/js/nutrition/mealDraft.js',
  '/fitme/js/nutrition/mealEditorPresenter.js',
  '/fitme/js/nutrition/mealCommitService.js',
  '/fitme/js/nutrition/quickLogService.js',
  '/fitme/js/nutrition/barcodeFlowController.js',
  '/fitme/js/coach/coachProfile.js',
  '/fitme/js/coach/coachPromptComposer.js',
  '/fitme/js/coach/coachClient.js',
  '/fitme/js/coach/coachPresenter.js',
  '/fitme/js/adaptive/adaptiveTdeeDomain.js',
  '/fitme/js/adaptive/adaptiveTdeeController.js',
  '/fitme/js/trigger/triggerDomain.js',
  '/fitme/js/trigger/triggerController.js',
  '/fitme/js/engines/habitEngine.js',
  '/fitme/js/engines/patternEngine.js',
  '/fitme/js/engines/adaptiveTdeeEngineAdapter.js',
  '/fitme/js/engines/triggerEngineAdapter.js',
  '/fitme/js/engines/registerEngines.js',
  '/fitme/js/ui/navigationController.js',
  '/fitme/js/ui/homePresenter.js',
  '/fitme/js/ui/profilePresenter.js',
  '/fitme/js/ui/settingsPresenter.js',
  '/fitme/js/ui/foodScreenPresenter.js',
  '/fitme/js/ui/dayNavigationController.js',
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
