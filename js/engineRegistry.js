// ══════════════════════════════════════════════════════════════════
// FitMe — Engine Registry / Orchestrator (B2)
// אחריות בלעדית: רישום Engine, בניית תוכנית הרצה דטרמיניסטית (triggers[] +
// dependsOn), והרצתה. אינו מכיר Habit/Pattern/Adaptive/Trigger business
// logic, אינו קורא Firestore/DOM/SessionLifecycle/AuthorityContract, ואינו
// מעניק authority או בעלות state/persistence (B2 SPEC §8/§20/§21).
// טהור ודטרמיניסטי — ניתן לטעינה עצמאית ב-Node (בדיקות) וגם בדפדפן.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var REGISTRY_VERSION = '2.0.0'; // B2 Code Review Round 4: run() contract changed to explicit per-engine actions

  var _engines = {}; // id -> definition
  var _order = [];   // registration order — משמש רק לאיסוף מועמדים, לא לסדר הרצה

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isStringArray(a) { return Array.isArray(a) && a.every(isNonEmptyString); }

  // רישום Engine — ולידציית חוזה בלבד (B2 SPEC §5/§8), ללא הרצה.
  function register(def) {
    def = def || {};
    if (!isNonEmptyString(def.id)) {
      return { ok: false, error: { code: 'INVALID_ID', message: 'Engine id must be a non-empty string' } };
    }
    if (_engines[def.id]) {
      return { ok: false, error: { code: 'DUPLICATE_ID', message: 'Engine already registered: ' + def.id } };
    }
    if (!isStringArray(def.triggers) || def.triggers.length === 0) {
      return { ok: false, error: { code: 'INVALID_TRIGGERS', message: 'Engine ' + def.id + ' must declare a non-empty triggers[] of strings' } };
    }
    var dependsOn = Array.isArray(def.dependsOn) ? def.dependsOn.slice() : [];
    if (!isStringArray(dependsOn) && dependsOn.length !== 0) {
      return { ok: false, error: { code: 'INVALID_DEPENDS_ON', message: 'Engine ' + def.id + ' dependsOn must be an array of strings' } };
    }
    if (typeof def.run !== 'function') {
      return { ok: false, error: { code: 'INVALID_RUN', message: 'Engine ' + def.id + ' must declare a run(context) function' } };
    }
    _engines[def.id] = {
      id: def.id,
      version: def.version || null,
      triggers: def.triggers.slice(),
      dependsOn: dependsOn,
      run: def.run
    };
    _order.push(def.id);
    return { ok: true };
  }

  function getAll() {
    return _order.map(function (id) { return _engines[id]; });
  }

  // כלי לבדיקות בלבד — מנקה את ה-registry בין test cases. אינו חלק מהחוזה הפרודקשני.
  function __resetForTests__() {
    _engines = {};
    _order = [];
  }

  // בונה תוכנית הרצה דטרמיניסטית ל-trigger נתון: סגירה טרנזיטיבית של dependsOn
  // מעל המועמדים הזכאים (triggers.indexOf(trigger) !== -1), מיון טופולוגי עם
  // שובר-שוויון לקסיקוגרפי לפי id (B2 SPEC §11/§12). אינה מריצה דבר.
  function buildPlan(trigger) {
    var eligibleIds = _order.filter(function (id) { return _engines[id].triggers.indexOf(trigger) !== -1; });
    if (!eligibleIds.length) return { ok: true, order: [] };

    var closure = {};
    var stack = eligibleIds.slice();
    while (stack.length) {
      var id = stack.pop();
      if (closure[id]) continue;
      var def = _engines[id];
      if (!def) {
        return { ok: false, error: { code: 'UNKNOWN_DEPENDENCY', message: 'Unknown engine id referenced: ' + id } };
      }
      closure[id] = true;
      def.dependsOn.forEach(function (depId) { stack.push(depId); });
    }

    var ids = Object.keys(closure).sort();
    var visited = {}; // 0/undefined = unvisited, 1 = in-progress, 2 = done
    var order = [];
    var cyclePath = null;

    function visit(id, path) {
      if (cyclePath) return;
      var state = visited[id] || 0;
      if (state === 2) return;
      if (state === 1) { cyclePath = path.concat(id); return; }
      visited[id] = 1;
      var deps = _engines[id].dependsOn.slice().sort();
      for (var i = 0; i < deps.length; i++) {
        visit(deps[i], path.concat(id));
        if (cyclePath) return;
      }
      visited[id] = 2;
      order.push(id);
    }

    for (var j = 0; j < ids.length; j++) {
      visit(ids[j], []);
      if (cyclePath) break;
    }

    if (cyclePath) {
      return { ok: false, error: { code: 'CIRCULAR_DEPENDENCY', message: 'Circular dependency detected: ' + cyclePath.join(' -> ') } };
    }

    return { ok: true, order: order };
  }

  function generateRunId() {
    return 'run_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function normalizeResult(id, raw, runId, startedAt) {
    if (!raw || typeof raw !== 'object') {
      raw = { status: 'FAILED', error: { code: 'ENGINE_THREW', message: 'Engine run did not return a valid result' } };
    }
    var status = (raw.status === 'SUCCESS' || raw.status === 'SKIPPED' || raw.status === 'FAILED') ? raw.status : 'FAILED';
    return {
      engineId: id,
      status: status,
      changed: (typeof raw.changed === 'boolean') ? raw.changed : null,
      output: (typeof raw.output !== 'undefined') ? raw.output : null,
      error: raw.error || null,
      metadata: { runId: runId, startedAt: startedAt, completedAt: Date.now() }
    };
  }

  // מריץ EngineRunRequest: { trigger, actions: {<id>: string}, payloads: {<id>: any},
  // context: {userId, sessionGeneration, now, runId} } (B2 Code Review Round 4).
  // בונה תוכנית ומריץ אותה ברצף מלא, engine אחד בכל פעם, לפי הסדר הטופולוגי/
  // לקסיקוגרפי (B2 SPEC §9/§12). מדלג (SKIPPED) על engines התלויים ב-engine
  // שנכשל (B2 SPEC §13), ומחזיר EngineRunSummary מנורמל. אינו זורק — כשל engine
  // בודד מתועד ב-result שלו בלבד ואינו עוצר engines בלתי-תלויים אחרים.
  //
  // action מפורש לכל engine בנפרד: engine זכאי (trigger תואם) שאין לו ערך
  // ב-actions[engineId] מקבל SKIPPED (NO_ACTION_FOR_ENGINE) בלי ש-run() שלו
  // ייקרא כלל — אין default action המבוסס על undefined, ואין דליפת action של
  // engine אחד לעבר engine אחר, כי כל engine מקבל אך ורק את הערך תחת ה-id שלו.
  //
  // הרצה רציפה (לא מקבילית) היא בחירה מכוונת: מנוע עשוי לקרוא באופן פנימי
  // לפונקציה שגם engine אחר עצמאי (dependsOn: []) עוטף (למשל Pattern Engine
  // הקורא ל-Habit Engine, B2 SPEC §11 כלל 10) — הרצה מקבילית הייתה עלולה
  // להתחיל את שתי הקריאות לפני שה-gate הפנימי של הראשונה מתעדכן. הרצה רציפה
  // מפחיתה את הסיכון הזה, אך התיקון המלא (single-flight) חי באדפטר של Habit
  // עצמו ואינו תלוי בסדר הרצה זה (B2 Code Review Round 4).
  async function run(request) {
    request = request || {};
    var trigger = request.trigger;
    var actions = request.actions || {};
    var payloads = request.payloads || {};
    var ctxBase = request.context || {};
    var plan = buildPlan(trigger);
    var runId = ctxBase.runId || generateRunId();
    var startedAt = (typeof ctxBase.now === 'number') ? ctxBase.now : Date.now();

    if (!plan.ok) {
      return {
        runId: runId, trigger: trigger, startedAt: startedAt, completedAt: Date.now(),
        executionOrder: [], results: {}, planError: plan.error
      };
    }

    var order = plan.order;
    var results = {};
    var failedIds = {};

    async function runOne(id) {
      var def = _engines[id];
      var blockedBy = def.dependsOn.filter(function (depId) { return failedIds[depId]; });
      if (blockedBy.length) {
        results[id] = {
          engineId: id, status: 'SKIPPED', changed: null, output: null,
          error: { code: 'DEPENDENCY_FAILED', message: 'Skipped due to failed dependency: ' + blockedBy.join(', ') },
          metadata: { runId: runId, startedAt: Date.now(), completedAt: Date.now() }
        };
        failedIds[id] = true;
        return;
      }

      var action = actions[id];
      if (!isNonEmptyString(action)) {
        // מכוון: לא נחשב "כשל" (אינו מפעיל failedIds) — engine שלא התבקש
        // להשתתף בהרצה הזו הוא non-participant מכוון, לא dependency שנכשלה.
        results[id] = {
          engineId: id, status: 'SKIPPED', changed: null, output: null,
          error: { code: 'NO_ACTION_FOR_ENGINE', message: 'No explicit action was provided for engine: ' + id },
          metadata: { runId: runId, startedAt: Date.now(), completedAt: Date.now() }
        };
        return;
      }

      var depResults = {};
      def.dependsOn.forEach(function (depId) { depResults[depId] = results[depId]; });
      var engineContext = {
        userId: ctxBase.userId,
        sessionGeneration: ctxBase.sessionGeneration,
        trigger: trigger,
        action: action,
        payload: (typeof payloads[id] !== 'undefined') ? payloads[id] : null,
        now: (typeof ctxBase.now === 'number') ? ctxBase.now : Date.now(),
        runId: runId,
        dependencies: depResults
      };
      var runStartedAt = Date.now();
      var raw;
      try { raw = await def.run(engineContext); }
      catch (e) { raw = { status: 'FAILED', error: { code: 'ENGINE_THREW', message: (e && e.message) || 'Engine threw' } }; }
      var normalized = normalizeResult(id, raw, runId, runStartedAt);
      results[id] = normalized;
      if (normalized.status === 'FAILED') failedIds[id] = true;
    }

    for (var i = 0; i < order.length; i++) {
      await runOne(order[i]);
    }

    return {
      runId: runId, trigger: trigger, startedAt: startedAt, completedAt: Date.now(),
      executionOrder: order, results: results
    };
  }

  var API = {
    VERSION: REGISTRY_VERSION,
    register: register,
    getAll: getAll,
    buildPlan: buildPlan,
    run: run,
    __resetForTests__: __resetForTests__
  };

  if (typeof window !== 'undefined') {
    window.EngineRegistry = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
