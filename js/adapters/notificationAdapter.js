// ══════════════════════════════════════════════════════════════════
// FitMe — Notification Adapter (C1-WP2, Platform Adapters)
// אחריות בלעדית: עטיפת מנגנוני Notification/Service-Worker/טיימר
// הגולמיים. אינו מחליט מתי לבקש הרשאה או מה הטקסט המוצג — אלה נשארים
// אצל המזמין (js/app.js). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  // notificationApi: אובייקט Notification הגלובלי. serviceWorkerContainer: navigator.serviceWorker.
  function configure(injected) { deps = injected || {}; }

  function getPermission() {
    return deps.notificationApi.permission;
  }

  function requestPermission() {
    return deps.notificationApi.requestPermission();
  }

  // תצוגת התראה מקומית — זהה לחלוטין להתנהגות הקודמת: לא מציג אם אין הרשאה,
  // ממתין ל-service-worker readiness, אותם ערכי icon/dir/lang/vibrate קבועים.
  function showNotification(title, body) {
    if (deps.notificationApi.permission !== 'granted') return;
    return deps.serviceWorkerContainer.ready.then(function (sw) {
      sw.showNotification(title, { body: body, icon: '/fitme/assets/icon-192.png', dir: 'rtl', lang: 'he', vibrate: [200, 100, 200] });
    });
  }

  // תזמון קריאה חד-פעמית לשעה/דקה נתונה היום (אם עדיין לא עברה). now ניתן
  // להזרקה לבדיקות דטרמיניסטיות; בברירת מחדל — שתי קריאות new Date() עצמאיות,
  // זהה לחלוטין למבנה הקודם (לא מוזג לקריאה אחת, כדי לא לשנות אפילו ניואנס תזמון תיאורטי).
  function scheduleAt(hour, min, callback, now) {
    var n = now || new Date();
    var target = now ? new Date(now.getTime()) : new Date();
    target.setHours(hour, min, 0, 0);
    var diff = target - n;
    if (diff > 0) setTimeout(callback, diff);
  }

  var API = {
    configure: configure,
    getPermission: getPermission,
    requestPermission: requestPermission,
    showNotification: showNotification,
    scheduleAt: scheduleAt
  };

  if (typeof window !== 'undefined') { window.NotificationAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
