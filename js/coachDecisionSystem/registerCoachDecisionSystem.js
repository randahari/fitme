// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Decision System Registration (TASK-004, D3 §17 Decision 1)
// אחריות בלעדית: רישום יחיד של ה-Composite Engine מול EngineRegistry —
// id/version/triggers/dependsOn/run בלבד, באותו דפוס בדיוק כמו
// js/engines/registerEngines.js (CC-05: אין Registry נוסף, אין Runtime
// מקביל). run מגיע ישירות מ-internalPipelineOrchestrator.js. app.js קורא
// ל-registerAll() פעם אחת, אחרי RegisterEngines.registerAll() הקיים.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var EngineRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('../engineRegistry.js')
    : window.EngineRegistry;
  var Orchestrator = (typeof module !== 'undefined' && module.exports)
    ? require('./internalPipelineOrchestrator.js')
    : window.CoachDecisionSystemOrchestrator;

  function _registerEngine(def) {
    var r = EngineRegistry.register(def);
    if (!r.ok) console.error('[EngineRegistry] registration failed:', def.id, r.error);
    return r;
  }

  function registerAll() {
    return _registerEngine({
      id: 'coachDecisionSystem',
      version: '1.0.0',
      triggers: ['APP_READY'],
      dependsOn: [],
      run: Orchestrator.run
    });
  }

  var API = { registerAll: registerAll };

  if (typeof window !== 'undefined') { window.RegisterCoachDecisionSystem = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
