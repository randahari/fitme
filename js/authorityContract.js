// ══════════════════════════════════════════════════════════════════
// FitMe — Generative vs. Authoritative Boundary (REM-003)
// רכיב טהור: מספק את אוצר המילים של Authority Metadata + Audit Trail
// (REM-003 §9 / Recommended Additions). אינו מבצע כתיבה, אינו מבצע
// ולידציה, אינו קורא state גלובלי, ואינו מנוע החלטה — הקורא (app.js)
// הוא זה שמחליט מתי הכתיבה מותרת (דרך ה-validator/gate הקיימים מ-REM-001)
// ומצרף את המטא-דאטה הזו לרשומה הסמכותית לפני שהיא נשמרת.
// לא Persistence Layer חדש, לא Engine חדש, לא מערכת זיכרון חדשה.
// טהור ודטרמיניסטי — ניתן לטעינה עצמאית ב-Node (בדיקות) וגם בדפדפן.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CONTRACT_VERSION = '1.0.0';

  // REM-003 Recommended Additions — Authority Metadata values.
  // GENERATIVE אינו ברשימת ה-SPEC המקורית אך נדרש כדי לסמן "Generative Persistent
  // Data" (REM-003 §4) באופן מפורש כלא-סמכותי, בדיוק כפי שהסעיף דורש.
  var AUTHORITY_SOURCES = Object.freeze({
    USER_DECLARATION: 'USER_DECLARATION',
    USER_CONFIRMED_AI_ESTIMATE: 'USER_CONFIRMED_AI_ESTIMATE',
    HABIT_ENGINE: 'HABIT_ENGINE',
    PATTERN_ENGINE: 'PATTERN_ENGINE',
    DEVICE: 'DEVICE',
    SYSTEM: 'SYSTEM',
    GENERATIVE: 'GENERATIVE'
  });

  function isKnownSource(s) {
    var keys = Object.keys(AUTHORITY_SOURCES);
    for (var i = 0; i < keys.length; i++) { if (AUTHORITY_SOURCES[keys[i]] === s) return true; }
    return false;
  }

  // REM-003 §9 / Recommended Additions — Audit Trail: מי יצר, מתי, לפי איזה rule,
  // גרסת מערכת. מצורף לכל רשומה שהופכת ל-Authoritative (Level 3).
  // opts: { source, createdBy, rule, systemVersion, now? }
  function buildAuthorityMetadata(opts) {
    opts = opts || {};
    var source = isKnownSource(opts.source) ? opts.source : null;
    return {
      authoritySource: source,
      isAuthoritative: source !== null && source !== AUTHORITY_SOURCES.GENERATIVE,
      createdBy: opts.createdBy || null,
      createdAt: (typeof opts.now === 'number') ? opts.now : Date.now(),
      rule: opts.rule || null,
      systemVersion: opts.systemVersion || null
    };
  }

  // REM-003 §4 — "Generative Persistent Data": תוכן AI שמותר לשמור (למשל תפריט
  // שבועי מוצע) בתנאי שהוא מסומן במפורש כ-Generative, אינו נשמר כעובדה, ואינו
  // נקרא ע"י אף מנוע דטרמיניסטי.
  function buildGenerativeMetadata(opts) {
    opts = opts || {};
    return {
      authoritySource: AUTHORITY_SOURCES.GENERATIVE,
      isAuthoritative: false,
      createdAt: (typeof opts.now === 'number') ? opts.now : Date.now(),
      systemVersion: opts.systemVersion || null
    };
  }

  var API = {
    VERSION: CONTRACT_VERSION,
    AUTHORITY_SOURCES: AUTHORITY_SOURCES,
    buildAuthorityMetadata: buildAuthorityMetadata,
    buildGenerativeMetadata: buildGenerativeMetadata
  };

  if (typeof window !== 'undefined') {
    window.AuthorityContract = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
