// ══════════════════════════════════════════════════════════════════
// FitMe — Barcode Repository (C1-WP3, Repository Layer)
// אחריות בלעדית: עטיפת מנגנון ה-Firestore הגולמי עבור מאגר הברקוד
// המשותף לקבוצה (groupBarcodes/{groupKey}/products/{code}) — כולל
// בדיקות תקינות הנתונים (hasData) ו-merge semantics, בדיוק כמו הקוד
// המקורי ("data validity checks" — docs/specs/C1_SPEC_v1.0.md §C1-WP3).
// אינו יודע דבר על userProfile/groupId — אלו מוזרקים כפרמטרים על-ידי
// המזמין (js/app.js). חולץ מ-js/app.js ללא שינוי התנהגות.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  async function lookupInCache(groupKey, code) {
    if (!groupKey) return null;
    try {
      var doc = await deps.db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).get();
      return doc.exists ? doc.data() : null;
    } catch (e) { console.warn('barcode cache read failed:', e.code || e.message); return null; }
  }

  async function saveToCache(groupKey, code, item, addedByName, updatedByName) {
    if (!groupKey || !code || !item) return;
    // אל תשמור רשומה ריקה (בלי ערכים) — היא רק תזהם את המאגר
    var hasData = (item.kcal || 0) > 0 || (item.protein || 0) > 0 || (item.carbs || 0) > 0 || (item.fat || 0) > 0;
    if (!hasData) return;
    try {
      await deps.db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).set({
        barcode: code,
        name: item.name, amount: item.amount, unit: item.unit,
        kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat,
        fiber: item.fiber, sugar: item.sugar, sodium: item.sodium,
        addedByName: addedByName,
        updatedByName: updatedByName,
        updatedAt: deps.serverTimestamp()
      }, { merge: true });
    } catch (e) { console.warn('barcode cache save failed:', e.code || e.message); }
  }

  var API = { configure: configure, lookupInCache: lookupInCache, saveToCache: saveToCache };

  if (typeof window !== 'undefined') { window.BarcodeRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
