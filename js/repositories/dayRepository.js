// ══════════════════════════════════════════════════════════════════
// FitMe — Day Repository (C1-WP3, Repository Layer)
// אחריות בלעדית: עטיפת מנגנוני Firestore הגולמיים עבור מסמכי היום
// (users/{uid}/days/{key}) — טעינת יום בודד, שמירת יום legacy, ואיחזור
// היסטוריה (עד 400 המסמכים האחרונים, ממוינים בצד ה-client כדי להימנע
// מ-index ידני — BUGFIX-001, זהה לחלוטין להתנהגות הקודמת). הכתיבה
// הסמכותית של ארוחות (SOURCE_HISTORY_SAVE_DAY) נשארת אך ורק דרך
// PersistenceGateway ואינה משוכפלת כאן — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP3. חולץ מ-js/app.js ללא שינוי התנהגות.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function loadDay(uid, key) {
    return deps.db.collection('users').doc(uid).collection('days').doc(key).get();
  }

  function saveLegacyDay(uid, key, payload) {
    return deps.db.collection('users').doc(uid).collection('days').doc(key).set({
      meals: payload.meals, burned: payload.burned, steps: payload.steps, water: payload.water,
      updatedAt: deps.serverTimestamp()
    });
  }

  // זהה ל-getHistoryData() המקורי: קריאה בלי orderBy/limit (אין דורש index),
  // מיון כרונולוגי לפי מזהה המסמך (YYYY-MM-DD) בצד ה-client, וחיתוך ל-400
  // האחרונים. כשל מוחזר כ-{} (history חלקי/ריק), בדיוק כמו הקודם.
  async function fetchHistory(uid) {
    var history = {};
    try {
      var snap = await deps.db.collection('users').doc(uid).collection('days').get();
      var docs = [];
      snap.forEach(function (doc) { docs.push(doc); });
      docs.sort(function (a, b) { return (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)); });
      docs.slice(-400).forEach(function (doc) { history[doc.id] = doc.data(); });
    } catch (e) { console.error('getHistoryData:', e); }
    return history;
  }

  var API = {
    configure: configure,
    loadDay: loadDay,
    saveLegacyDay: saveLegacyDay,
    fetchHistory: fetchHistory
  };

  if (typeof window !== 'undefined') { window.DayRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
