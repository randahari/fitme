// ══════════════════════════════════════════════════════════════════
// FitMe — Session Lifecycle Manager (REM-002)
// אחריות בלעדית: זהות-session ("generation") + מרשם ניקוי מודולים.
// לא מכיל לוגיקת אימות, לא מכיר את userProfile/currentUser/DOM — כל אלה
// שייכים למודולים הרושמים (app.js, memory.js). לפי REM-002 §5:
// "Individual modules may clean only their own runtime state. They MUST
// NOT orchestrate authentication or reset unrelated modules."
// טהור ודטרמיניסטי — ניתן לטעינה עצמאית ב-Node (בדיקות) וגם בדפדפן.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var LIFECYCLE_VERSION = '1.0.0';
  var _generation = 0;
  var _cleanups = []; // [{name, fn}] — סדר רישום = סדר הרצה

  function getGeneration() { return _generation; }

  // guard מרכזי: כל async מיד אחרי await צריך לבדוק isCurrent(gen שנלכד לפני ה-await)
  function isCurrent(gen) { return gen === _generation; }

  // רישום אידמפוטנטי: קריאה חוזרת עם אותו name מחליפה את ה-callback הקודם
  // (ולא מצטברת) — כך שטעינה כפולה של סקריפט לא תיצור cleanups כפולים.
  function registerCleanup(name, fn) {
    if (typeof fn !== 'function') return;
    for (var i = 0; i < _cleanups.length; i++) {
      if (_cleanups[i].name === name) { _cleanups[i].fn = fn; return; }
    }
    _cleanups.push({ name: name, fn: fn });
  }

  // REM-002 §5/§7/§11: מקדם generation תחילה (כל guard קיים נחסם מיידית),
  // ואז מריץ את כל ה-cleanups הרשומים. כשל באחד אינו עוצר את האחרים.
  // אין חשיפת מידע רגיש בלוג. אידמפוטנטי — קריאות חוזרות/מקבילות בטוחות.
  function reset(reason) {
    _generation++;
    var myGen = _generation;
    _cleanups.forEach(function (entry) {
      try { entry.fn(); }
      catch (e) {
        try { console.error('[SessionLifecycle] cleanup failed: ' + entry.name); } catch (_) {}
      }
    });
    return myGen;
  }

  var API = {
    VERSION: LIFECYCLE_VERSION,
    getGeneration: getGeneration,
    isCurrent: isCurrent,
    registerCleanup: registerCleanup,
    reset: reset
  };

  if (typeof window !== 'undefined') {
    window.SessionLifecycle = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
