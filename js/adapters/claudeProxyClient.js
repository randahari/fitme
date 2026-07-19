// ══════════════════════════════════════════════════════════════════
// FitMe — Claude Proxy Client Adapter (C1-WP2, Platform Adapters)
// אחריות בלעדית: קבלת טוקן, POST מאומת אל ה-proxy, פענוח תגובה, ומיפוי
// שגיאות. אינו יודע דבר על תוכן הבקשה/תשובה (זו אחריות המזמין).
// שימוש חוזר ב-AuthAdapter.getIdToken כברירת מחדל, כדי לא לשכפל את
// עטיפת ה-SDK; ניתן להזרקה לבדיקות. חולץ מ-js/app.js ללא שינוי
// התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CLAUDE_PROXY_URL = 'https://us-central1-fitme-f9289.cloudfunctions.net/anthropicProxy';

  function defaultGetIdToken(user) {
    var AuthAdapter = (typeof module !== 'undefined' && module.exports) ? require('./authAdapter.js') : window.AuthAdapter;
    return AuthAdapter.getIdToken(user);
  }

  var deps = { fetchFn: typeof fetch !== 'undefined' ? fetch : undefined, getIdToken: defaultGetIdToken };
  function configure(injected) { deps = Object.assign({}, deps, injected || {}); }

  // בקשה מאומתת ל-proxy. user חסר -> אותה הודעת שגיאה כמו קודם ('לא מחובר').
  // תגובה לא-ok -> אותו מיפוי שגיאה (data.error || data.message || 'שגיאת שרת').
  async function send(body, user) {
    if (!user) throw new Error('לא מחובר');
    var token = await deps.getIdToken(user);
    var res = await deps.fetchFn(CLAUDE_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'שגיאת שרת');
    return data;
  }

  var API = { configure: configure, send: send, CLAUDE_PROXY_URL: CLAUDE_PROXY_URL };

  if (typeof window !== 'undefined') { window.ClaudeProxyClient = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
