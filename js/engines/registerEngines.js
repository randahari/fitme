// ══════════════════════════════════════════════════════════════════
// FitMe — Engine Registration Composition Root (C1-WP9, Habit and Pattern
// Engine Extraction). אחריות בלעדית: רישום ארבעת ה-engines (habitEngine,
// patternEngine, adaptiveTdeeEngine, triggerEngine) מול EngineRegistry —
// id/version/triggers/dependsOn/run בלבד, זהים לחלוטין ל-B2 STAGE 8 המקורי
// (js/app.js, ה-IIFE שהיה בסוף הקובץ). אינו מכיל שום לוגיקה עסקית של engine
// כלשהו — run מגיע ישירות מ-js/engines/habitEngine.js /
// js/engines/patternEngine.js / js/engines/adaptiveTdeeEngineAdapter.js /
// js/engines/triggerEngineAdapter.js. app.js קורא ל-registerAll() פעם אחת,
// אחרי שהוא מקנפג את ארבעת המודולים דרך configure() שלהם (כמו כל שאר
// המודולים שחולצו ב-C1). ראה docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var EngineRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('../engineRegistry.js')
    : window.EngineRegistry;
  var HabitEngine = (typeof module !== 'undefined' && module.exports)
    ? require('./habitEngine.js')
    : window.HabitEngine;
  var PatternEngine = (typeof module !== 'undefined' && module.exports)
    ? require('./patternEngine.js')
    : window.PatternEngine;
  var AdaptiveTdeeEngineAdapter = (typeof module !== 'undefined' && module.exports)
    ? require('./adaptiveTdeeEngineAdapter.js')
    : window.AdaptiveTdeeEngineAdapter;
  var TriggerEngineAdapter = (typeof module !== 'undefined' && module.exports)
    ? require('./triggerEngineAdapter.js')
    : window.TriggerEngineAdapter;

  // B2 Code Review: diagnostics בלבד — register() כבר לא זורק, אך רישום שנכשל
  // בשקט (למשל id כפול עקב טעות עתידית) יהיה בלתי-נראה בלי לוג מפורש.
  function _registerEngine(def) {
    var r = EngineRegistry.register(def);
    if (!r.ok) console.error('[EngineRegistry] registration failed:', def.id, r.error);
    return r;
  }

  function registerAll() {
    // Habit Engine — B2 SPEC §17. אדפטר דק: קורא ל-HabitEngine.runHabitEngineSingleFlight()
    // (עטיפת single-flight מעל runHabitEngine() הקיים — B2 Code Review Round 4).
    _registerEngine({
      id: 'habitEngine',
      version: '1.0.0',
      triggers: ['APP_READY'],
      dependsOn: [],
      run: HabitEngine.run
    });

    // Pattern Engine — dependsOn נעול ל-[] (B2 SPEC §11 כלל 10): הקריאה הפנימית
    // הקיימת של runPatternEngine() ל-Habit היא soft enrichment עם graceful
    // degradation, ואינה הופכת ל-registry dependency.
    _registerEngine({
      id: 'patternEngine',
      version: '1.0.0',
      triggers: ['APP_READY'],
      dependsOn: [],
      run: PatternEngine.run
    });

    // Adaptive TDEE Engine — רק runAdaptiveCheck() רשום; applyAdaptiveUpdate()
    // נשאר מחוץ ל-Registry כפעולה ידנית מאושרת של המשתמש (B2 SPEC §17/§19).
    _registerEngine({
      id: 'adaptiveTdeeEngine',
      version: '1.0.0',
      triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL'],
      dependsOn: [],
      run: AdaptiveTdeeEngineAdapter.run
    });

    // Trigger Engine — engine לוגי אחד עם 3 actions, לא מפוצל (B2 SPEC §17: בעלות
    // משותפת על budget/dedup/coachEvents/coachDay).
    _registerEngine({
      id: 'triggerEngine',
      version: '1.0.0',
      triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'AUTH_SESSION_READY'],
      dependsOn: [],
      run: TriggerEngineAdapter.run
    });
  }

  var API = {
    registerAll: registerAll
  };

  if (typeof window !== 'undefined') { window.RegisterEngines = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
