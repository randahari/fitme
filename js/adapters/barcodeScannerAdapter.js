// ══════════════════════════════════════════════════════════════════
// FitMe — Barcode Scanner Adapter (C1-WP2, Platform Adapters)
// אחריות בלעדית: עטיפת טעינת ספריית html5-qrcode הדינמית, מחזור-חיים
// של הסורק (יצירה/התחלה/עצירה), ותצורת הסריקה הקבועה. אינו מציג UI,
// אינו מחליט מה קורה כשקוד מזוהה — אלה נשארים אצל המזמין (js/app.js).
// גורמי הפלטפורמה (document, window/Html5Qrcode) מוזרקים דרך configure()
// כדי שרצף הטעינה/יצירה/עצירה יהיה ניתן לבדיקה ב-Node. חולץ מ-js/app.js
// ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // גרסה מקובעת — לא latest — זהה לחלוטין לקבוע הקודם.
  var LIBRARY_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';

  var SCAN_CONFIG = {
    fps: 10,
    qrbox: function (vw) { var w = Math.min(300, Math.round(vw * 0.85)); return { width: w, height: Math.round(w * 0.55) }; },
    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
  };

  function defaultPlatform() {
    if (typeof window === 'undefined') return {};
    return { documentRef: document, windowRef: window };
  }

  var deps = defaultPlatform();
  function configure(injected) { deps = injected || defaultPlatform(); }

  // טעינת html5-qrcode לפי הצורך בלבד — אם כבר טעונה, לא טוענת שוב.
  function loadLibrary() {
    if (typeof deps.windowRef.Html5Qrcode !== 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = deps.documentRef.createElement('script');
      s.src = LIBRARY_URL;
      s.onload = resolve; s.onerror = reject;
      deps.documentRef.head.appendChild(s);
    });
  }

  function getSupportedFormats() {
    var f = deps.windowRef.Html5QrcodeSupportedFormats;
    return [f.EAN_13, f.EAN_8, f.UPC_A, f.UPC_E];
  }

  function createScanner(elementId) {
    return new deps.windowRef.Html5Qrcode(elementId, { formatsToSupport: getSupportedFormats(), verbose: false });
  }

  // התחלת סריקה — מצלמה אחורית, תצורה קבועה, קריאה ל-onDetected בכל זיהוי.
  function start(scanner, onDetected) {
    return scanner.start({ facingMode: 'environment' }, SCAN_CONFIG, onDetected);
  }

  // עצירה + ניקוי — אותו רצף try/catch עמיד בדיוק כמו הקודם: stop() ואז clear(),
  // ו-clear() גם אם stop() נכשל.
  function stop(scanner) {
    if (!scanner) return;
    try {
      return scanner.stop().then(function () {
        try { scanner.clear(); } catch (e) {}
      }).catch(function () {
        try { scanner.clear(); } catch (e) {}
      });
    } catch (e) {
      try { scanner.clear(); } catch (e2) {}
    }
  }

  var API = {
    configure: configure,
    loadLibrary: loadLibrary,
    createScanner: createScanner,
    start: start,
    stop: stop,
    SCAN_CONFIG: SCAN_CONFIG,
    LIBRARY_URL: LIBRARY_URL
  };

  if (typeof window !== 'undefined') { window.BarcodeScannerAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
