// ══════════════════════════════════════════════════════════════════
// FitMe — Barcode Flow Controller (C1-WP5F, Nutrition Application Domain)
// אחריות בלעדית: מחזור-חיים של סריקת ברקוד (התחלה/עצירה/רמז תקיעה),
// חיפוש cache-first במאגר הקבוצה, נפילה חזרה ל-Open Food Facts, נפילה
// חזרה לבקשת תווית (label fallback), תיוג מקור ('group'/'off'), ועדכון
// מאגר הברקוד המשותף לקבוצה. אינו מבצע קריאות AI (WP5A), אינו בונה/עורך
// טיוטת ארוחה (WP5B), ואינו מבצע כתיבה עמידה של הארוחה הסופית ל-Firestore
// (WP5D — showMealEditor פותח את העורך; addMeal מבצע את הכתיבה בפועל
// כשהמשתמש שומר). מודולי הפלטפורמה היציבים של WP2/WP3 — BarcodeScannerAdapter,
// OpenFoodFactsClient, BarcodeRepository — נדרשים ישירות (require), באותו
// דפוס כמו mealDraft.js/authorityContract.js; DOM, showMealEditor (עטוף
// מאוחר יותר ע"י Day Navigation), startLabelCamera, userProfile, ו-pendingBarcode
// מוזרקים דרך configure(). h5qr/barcodeLastCode/barcodeHintTimer עברו לכאן
// כ-state פרטי של המודול — לא נקראים משום מקום אחר ב-app.js. חולץ מ-js/app.js
// ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP5F.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var BarcodeScannerAdapter = (typeof module !== 'undefined' && module.exports)
    ? require('../adapters/barcodeScannerAdapter.js')
    : window.BarcodeScannerAdapter;
  var OpenFoodFactsClient = (typeof module !== 'undefined' && module.exports)
    ? require('../adapters/openFoodFactsClient.js')
    : window.OpenFoodFactsClient;
  var BarcodeRepository = (typeof module !== 'undefined' && module.exports)
    ? require('../repositories/barcodeRepository.js')
    : window.BarcodeRepository;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  var h5qr = null;
  var barcodeLastCode = null;
  var barcodeHintTimer = null;

  // ── סריקת ברקוד (html5-qrcode דרך BarcodeScannerAdapter) — זהה לחלוטין ל-startBarcode() המקורי ──
  async function startBarcode() {
    var overlay = deps.documentRef.getElementById('barcode-overlay');
    if (!overlay) { deps.alertFn('סריקת ברקוד לא זמינה בדפדפן זה.'); return; }
    overlay.classList.remove('hidden');
    var statusEl = deps.documentRef.getElementById('barcode-status');
    statusEl.textContent = 'מכוון את המצלמה לברקוד...';
    barcodeLastCode = null;

    try {
      await BarcodeScannerAdapter.loadLibrary();
    } catch (e) { closeBarcode(); deps.alertFn('טעינת הסורק נכשלה. בדוק חיבור לאינטרנט.'); return; }

    try {
      h5qr = BarcodeScannerAdapter.createScanner('barcode-reader');
    } catch (e) { closeBarcode(); deps.alertFn('שגיאה באתחול הסורק.'); return; }

    armBarcodeHint(statusEl);
    try {
      await BarcodeScannerAdapter.start(h5qr, function (decodedText) { onBarcodeDetected(decodedText, statusEl); });
    } catch (e) {
      closeBarcode();
      deps.alertFn('לא ניתן לפתוח מצלמה. אפשר גישה למצלמה בהגדרות הדפדפן.');
    }
  }

  function onBarcodeDetected(code, statusEl) {
    if (!code || barcodeLastCode) return; // כבר נתפס — מתעלמים מכפילויות
    barcodeLastCode = code;
    if (statusEl) statusEl.textContent = 'נמצא ברקוד: ' + code + ' — מחפש מוצר...';
    stopBarcodeReader();
    lookupBarcode(code);
  }

  function armBarcodeHint(statusEl) {
    clearTimeout(barcodeHintTimer);
    barcodeHintTimer = setTimeout(function () {
      if (!barcodeLastCode) statusEl.innerHTML = 'לא מזהה? קרב מעט את הברקוד וודא תאורה — או <button onclick="barcodeToLabel()" style="background:none;border:none;color:var(--gold);text-decoration:underline;font-size:14px;cursor:pointer;font-family:Heebo,sans-serif">צלם תווית במקום</button>';
    }, 20000);
  }

  function barcodeToLabel() {
    closeBarcode();
    showLabelPrompt('manual-' + Date.now());
  }

  function stopBarcodeReader() {
    clearTimeout(barcodeHintTimer);
    if (!h5qr) return;
    var r = h5qr; h5qr = null;
    BarcodeScannerAdapter.stop(r);
  }

  function closeBarcode() {
    stopBarcodeReader();
    var overlay = deps.documentRef.getElementById('barcode-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ── בקשת צילום תווית (label fallback) — זהה לחלוטין ל-showLabelPrompt()/labelPromptCapture()/
  // closeLabelPrompt() המקוריים. pendingBarcode מוזרק כ-setter (עוגן משותף עם analyzePhoto, WP5A). ──
  function showLabelPrompt(code) {
    deps.setPendingBarcode(code);
    var el = deps.documentRef.getElementById('label-prompt');
    if (!el) {
      el = deps.documentRef.createElement('div');
      el.id = 'label-prompt';
      el.style.cssText = 'position:fixed;inset:0;z-index:350;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Heebo,sans-serif;direction:rtl';
      deps.documentRef.body.appendChild(el);
    }
    el.innerHTML = `
    <div style="background:var(--bg);border-radius:16px;padding:22px;max-width:340px;width:100%;text-align:center;border:0.5px solid var(--border-2)">
      <div style="font-size:34px;margin-bottom:8px">🏷️</div>
      <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">המוצר לא נמצא במאגר</div>
      <div style="font-size:13px;color:var(--text-3);line-height:1.5;margin-bottom:16px">צלם את תווית הערכים התזונתיים. Claude יקרא אותה וישמור למאגר הקבוצה — פעם הבאה תזוהה מיד.</div>
      <button onclick="labelPromptCapture()" style="width:100%;padding:14px;background:var(--gold);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:500;font-family:Heebo,sans-serif;cursor:pointer">📷 צלם תווית</button>
      <button onclick="closeLabelPrompt()" style="width:100%;padding:12px;background:none;color:var(--text-2);border:none;font-size:14px;font-family:Heebo,sans-serif;cursor:pointer;margin-top:6px">ביטול</button>
    </div>`;
    el.style.display = 'flex';
  }

  function labelPromptCapture() {
    closeLabelPrompt();
    deps.startLabelCamera();
  }

  function closeLabelPrompt() {
    var el = deps.documentRef.getElementById('label-prompt');
    if (el) el.style.display = 'none';
  }

  // ── מאגר ברקוד משותף לקבוצה (group cache persistence) — זהה לחלוטין למקור.
  // userProfile מוזרק כ-getter (עוגן משותף — nothing else in app.js owns groupId resolution). ──
  function getSharedBarcodeGroup() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return null;
    return userProfile.groupId || null;
  }

  async function lookupBarcodeInCache(code) {
    var groupKey = getSharedBarcodeGroup();
    return BarcodeRepository.lookupInCache(groupKey, code);
  }

  async function saveBarcodeToCache(code, item, existingAddedByName) {
    var groupKey = getSharedBarcodeGroup();
    var userProfile = deps.getUserProfile();
    // שמור את שם מי שהוסיף במקור; אם זה מוצר חדש — המשתמש הנוכחי
    var addedByName = existingAddedByName || (userProfile ? userProfile.name : '');
    return BarcodeRepository.saveToCache(groupKey, code, item, addedByName, userProfile ? userProfile.name : '');
  }

  // ── חיפוש cache-first + נפילה חזרה ל-Open Food Facts + נפילה חזרה לתווית — זהה לחלוטין
  // ל-lookupBarcode() המקורי, כולל תיוג המקור ('group'/'off') ומשמרי הסשן (REM-002). ──
  async function lookupBarcode(code) {
    var _gen = deps.sessionLifecycle.getGeneration(); // REM-002: session guard
    // 1. מאגר הקבוצה — הכי מהיר, ידני, מדויק. אבל רק אם יש בו ערכים אמיתיים.
    var cached = await lookupBarcodeInCache(code);
    if (!deps.sessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי חיפוש המאגר
    var cachedHasData = cached && ((cached.kcal || 0) > 0 || (cached.protein || 0) > 0 || (cached.carbs || 0) > 0 || (cached.fat || 0) > 0);
    if (cachedHasData) {
      closeBarcode();
      var item = {
        name: cached.name, amount: cached.amount, unit: cached.unit,
        kcal: cached.kcal, protein: cached.protein, carbs: cached.carbs, fat: cached.fat,
        fiber: cached.fiber, sugar: cached.sugar, sodium: cached.sodium
      };
      deps.showMealEditor({
        name: cached.name, items: [item], suggestions: [],
        source: 'group', barcode: code, addedByName: cached.addedByName || '',
        note: ''
      });
      return;
    }

    // 2. Open Food Facts — מאגר עולמי חינמי. הבקשה ומיפוי התגובה חיים ב-OpenFoodFactsClient
    // (WP2); ההחלטה מה להציג (עורך/בקשת תווית/שגיאה) נשארת כאן.
    try {
      var result = await OpenFoodFactsClient.lookupProduct(code);
      if (!deps.sessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי הבקשה ל-OpenFoodFacts
      if (!result.found) {
        closeBarcode();
        showLabelPrompt(code);
        return;
      }
      var offItem = result.item;
      // הערכים יישמרו למאגר הקבוצה בעת ההוספה ליום (עם הערכים הסופיים, אחרי עריכה אם הייתה)
      closeBarcode();
      deps.showMealEditor({
        name: offItem.name, items: [offItem], suggestions: [],
        source: 'off', barcode: code,
        note: !result.servingSizeKnown ? 'לפי 100 גרם — התאם כמות עם +/-' : 'לפי מנה (' + result.servingSizeRaw + ')'
      });
    } catch (e) {
      closeBarcode();
      deps.alertFn('שגיאה בחיפוש המוצר. בדוק חיבור לאינטרנט.');
    }
  }

  var API = {
    configure: configure,
    startBarcode: startBarcode,
    onBarcodeDetected: onBarcodeDetected,
    armBarcodeHint: armBarcodeHint,
    barcodeToLabel: barcodeToLabel,
    stopBarcodeReader: stopBarcodeReader,
    closeBarcode: closeBarcode,
    showLabelPrompt: showLabelPrompt,
    labelPromptCapture: labelPromptCapture,
    closeLabelPrompt: closeLabelPrompt,
    getSharedBarcodeGroup: getSharedBarcodeGroup,
    lookupBarcodeInCache: lookupBarcodeInCache,
    saveBarcodeToCache: saveBarcodeToCache,
    lookupBarcode: lookupBarcode
  };

  if (typeof window !== 'undefined') { window.BarcodeFlowController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
