// ══════════════════════════════════════════════════════════════════
// FitMe — State Access Layer (B3)
// אחריות בלעדית: יצירת EngineStateAccess מוגבל (per engine/action/session)
// עבור ארבעת המנועים של B2, ניתוב reads דרך snapshots מוגנים-מפני-mutation,
// וניתוב writes דרך owner commands סמנטיים בלבד. אינו Store חדש, אינו
// service locator כללי, אינו מכיר Redux/MobX. אינו חושף db/userProfile/
// todayData גולמיים, ואינו מציע get(path)/set(path)/patch()/update() גנרי.
// תלויות (userProfile, todayData, saveProfile, db וכו') מוזרקות דרך
// configure() על ידי js/app.js בלבד — לא נטענות/מיובאות ישירות כאן, כדי
// שהמודול יישאר ניתן לבדיקה עצמאית ב-Node (dependency injection, לא
// service locator: משטח קבוע וסגור של accessors, לא lookup לפי path/שם).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var STATE_ACCESS_VERSION = '1.0.0';

  // ── תלויות מוזרקות (B3 SPEC §7: "trusted dependencies via initialization") ──
  var deps = null;

  function configure(injected) {
    deps = injected || {};
  }

  // ── עזרי הגנה על snapshots (B3 SPEC §9 כלל 3/4: לא live reference) ──
  function freezeShallow(obj) {
    try { return Object.freeze(obj); } catch (e) { return obj; }
  }
  function copyArrayOfObjects(arr) {
    if (!Array.isArray(arr)) return freezeShallow([]);
    return freezeShallow(arr.map(function (item) {
      return (item && typeof item === 'object') ? freezeShallow(Object.assign({}, item)) : item;
    }));
  }
  function copyPlainArray(arr) {
    if (!Array.isArray(arr)) return freezeShallow([]);
    return freezeShallow(arr.slice());
  }

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  // ── שגיאות סטנדרטיות (B3 SPEC §22) ──
  function accessDeniedError(op) {
    var e = new Error('State access denied: ' + op);
    e.code = 'STATE_ACCESS_DENIED';
    return e;
  }
  function staleSessionError() {
    var e = new Error('Stale session — access denied');
    e.code = 'STALE_SESSION';
    return e;
  }

  function isCurrent(sessionGeneration) {
    return !!(deps && typeof deps.isSessionCurrent === 'function' && deps.isSessionCurrent(sessionGeneration));
  }

  function makeCommandResult(status, domain, command, changed, errorCode, errorMessage, meta) {
    return {
      status: status,
      changed: !!changed,
      domain: domain,
      command: command,
      error: { code: errorCode || null, message: errorMessage || null },
      metadata: meta || {}
    };
  }

  // ── B4: מתרגם PersistenceResult (js/persistenceGateway.js) בחזרה ל-StateCommandResult
  // הקיים של B3 — הצורה עצמה (status/changed/domain/command/error/metadata) אינה משתנה
  // (B3 נעול/CLOSED); רק מקור הביצוע בפועל של ה-write עבר ל-Gateway. CONFLICT (B4 §24,
  // רק ל-Pattern) ממופה ל-'FAILED' ברמת ה-StateCommandResult — אין ל-B3 ערך CONFLICT
  // משלו — אך מסומן ב-metadata.persistenceStatus כדי שרמת ה-Engine (B4 §27, output.persistence)
  // תוכל לדווח עליו כ-CONFLICT אמיתי ולא ככשל גנרי.
  function mapPersistenceResult(domain, op, identity, pr) {
    var baseMeta = { runId: identity.runId, sessionGeneration: identity.sessionGeneration };
    if (!pr) return makeCommandResult('FAILED', domain, op, false, 'STATE_WRITE_FAILED', 'no persistence result', baseMeta);
    var meta = Object.assign({}, baseMeta, { persistenceStatus: pr.status, persistenceRequestId: pr.requestId || null });
    if (pr.status === 'SUCCESS' || pr.status === 'NO_OP') {
      if (pr.receipt && pr.receipt.staleOnCompletion) meta.staleAfterWrite = true;
      return makeCommandResult('APPLIED', domain, op, !!pr.changed, null, null, meta);
    }
    var code = pr.status === 'CONFLICT' ? 'STATE_WRITE_CONFLICT' : (pr.status === 'STALE_SESSION' ? 'STALE_SESSION' : 'STATE_WRITE_FAILED');
    return makeCommandResult('FAILED', domain, op, false, code, (pr.error && pr.error.message) || pr.status, meta);
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Read operations (B3 SPEC §9/§13/§14/§16) — כל אחת snapshot מוגן ──
  // ══════════════════════════════════════════════════════════════════

  async function readNutritionActivityHistory(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var history = await deps.fetchHistory();
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError(); // B3 §9 כלל 8: re-check אחרי async
    var out = {};
    Object.keys(history || {}).forEach(function (key) {
      var d = history[key] || {};
      out[key] = freezeShallow({
        meals: copyArrayOfObjects(d.meals),
        burned: d.burned || 0,
        steps: d.steps || 0,
        water: d.water || 0
      });
    });
    return freezeShallow(out);
  }

  function readBodyHistory(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var profile = deps.getUserProfile() || {};
    return freezeShallow({
      weightHistory: copyArrayOfObjects(profile.weightHistory),
      measurementHistory: copyArrayOfObjects(profile.measurementHistory)
    });
  }

  function readWeightThreshold(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var profile = deps.getUserProfile() || {};
    return freezeShallow({ currentWeight: profile.currentWeight, weight: profile.weight });
  }

  function readHabitView(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    deps.ensureCoachMemoryShape();
    var mem = deps.getUserProfile().coachMemory;
    return freezeShallow({
      habits: copyArrayOfObjects(mem.habits),
      habitsMeta: freezeShallow(Object.assign({}, mem.habitsMeta || {}))
    });
  }

  function readPatternView(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    deps.ensureCoachMemoryShape();
    var mem = deps.getUserProfile().coachMemory;
    return freezeShallow({
      patterns: copyArrayOfObjects(mem.patterns),
      patternsMeta: freezeShallow(Object.assign({}, mem.patternsMeta || {}))
    });
  }

  function readAdaptiveProfile(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var p = deps.getUserProfile() || {};
    return freezeShallow({
      goalKcal: p.goalKcal,
      confirmedLightDays: copyPlainArray(p.confirmedLightDays),
      weightHistory: copyArrayOfObjects(p.weightHistory),
      adaptiveTdee: p.adaptiveTdee,
      tdee: p.tdee,
      measurementHistory: copyArrayOfObjects(p.measurementHistory),
      goal: p.goal,
      currentWeight: p.currentWeight,
      weight: p.weight,
      currentDeficit: p.currentDeficit,
      rate: p.rate,
      adaptiveEnabled: p.adaptiveEnabled,
      lastTdeeUpdate: p.lastTdeeUpdate
    });
  }

  function readTriggerProfile(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var p = deps.getUserProfile() || {};
    return freezeShallow({
      totalWorkouts: p.totalWorkouts,
      workoutFrequency: p.days,
      goalKcal: p.goalKcal,
      goal: p.goal,
      streak: p.streak,
      foods: copyPlainArray(p.foods),
      weight: p.weight
    });
  }

  function readTodayNutrition(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    return freezeShallow({ consumed: deps.getTodayConsumed(), protein: deps.getTodayProtein(), burned: deps.getTodayBurned() });
  }

  function readTriggerBudget(identity) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    var cd = deps.getTriggerBudget();
    return freezeShallow({ date: cd.date, fired: copyPlainArray(cd.fired), count: cd.count });
  }

  function readCanFire(identity, type, priority) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    return !!deps.checkCanFire(type, priority);
  }

  function readWorkoutPayload(identity, payload) {
    if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
    return freezeShallow({ burn: (payload && payload.burn) || 0 });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Write operations (owner commands, B3 SPEC §10/§11) ──
  // ══════════════════════════════════════════════════════════════════

  // B4: הכתיבה בפועל (Firestore) עברה מ-deps.persistProfile() (broad saveProfile) ל-
  // deps.persistHabitsView(identity, command) — field-scoped דרך js/persistenceGateway.js.
  // Implementation Review correction (B4 §26 כלל 6: "On FAILED, the owner SHALL keep or
  // restore the last committed snapshot"): לפני B4, deps.persistProfile()/saveProfile()
  // לעולם לא נדחה (בלע שגיאות בעצמו), כך שענף ה-catch כאן היה בלתי-נגיש בפועל וה-rollback
  // מעולם לא נדרש. ה-Gateway כן יכול להחזיר FAILED/CONFLICT/REJECTED אמיתיים — בלי rollback,
  // habitsMeta.lastRun היה מתקדם ב-memory גם בכשל durable, ושער "פעם ביום" של runHabitEngine
  // (הקורא הבא, אותו יום/session) היה חוסם retry לצמיתות על סמך מצב שמעולם לא נשמר. עכשיו
  // מיושר ל-Pattern's snapshot-and-rollback (ISSUE 2 המקורי).
  async function writeReplaceDerivedHabitView(identity, command) {
    var domain = 'habit', op = 'replaceDerivedHabitView';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    deps.ensureCoachMemoryShape();
    var mem = deps.getUserProfile().coachMemory;
    var snapHabits = mem.habits, snapMeta = mem.habitsMeta;
    mem.habits = command.habits;
    mem.habitsMeta = command.habitsMeta;
    try {
      var pr = await deps.persistHabitsView(identity, command);
      if (pr.status !== 'SUCCESS' && pr.status !== 'NO_OP') {
        mem.habits = snapHabits;
        mem.habitsMeta = snapMeta;
      }
      return mapPersistenceResult(domain, op, identity, pr);
    } catch (e) {
      mem.habits = snapHabits;
      mem.habitsMeta = snapMeta;
      return makeCommandResult('FAILED', domain, op, false, 'STATE_WRITE_FAILED', (e && e.message) || 'persist failed', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    }
  }

  // B4: deps.persistPatternView(identity, command) עכשיו מעביר command.expectedVersion
  // (fingerprint שהיה durable לפני הריצה) ל-Gateway עבור בדיקת CONFLICT אטומית
  // (B4 §16.2/§24). CONFLICT מטופל בדיוק כמו FAILED מבחינת ה-rollback המקומי
  // הקיים (ISSUE 2 המקורי) — אין overwrite של durable state חדש יותר.
  async function writeReplaceDerivedPatternView(identity, command) {
    var domain = 'pattern', op = 'replaceDerivedPatternView';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    deps.ensureCoachMemoryShape();
    var mem = deps.getUserProfile().coachMemory;
    var snapPatterns = mem.patterns, snapMeta = mem.patternsMeta; // ISSUE 2 (B2-era): שמור לפני מוטציה, rollback בכשל/קונפליקט
    mem.patterns = command.patterns;
    mem.patternsMeta = command.patternsMeta;
    try {
      var pr = await deps.persistPatternView(identity, command);
      if (pr.status !== 'SUCCESS' && pr.status !== 'NO_OP') {
        mem.patterns = snapPatterns;
        mem.patternsMeta = snapMeta;
      }
      return mapPersistenceResult(domain, op, identity, pr);
    } catch (e) {
      mem.patterns = snapPatterns;
      mem.patternsMeta = snapMeta;
      return makeCommandResult('FAILED', domain, op, false, 'STATE_WRITE_FAILED', (e && e.message) || 'persist failed', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    }
  }

  function writeStoreAdaptiveProposal(identity, command) {
    var domain = 'adaptiveTdee', op = 'storeAdaptiveProposal';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    deps.setAdaptProposal(command.proposal || null);
    return makeCommandResult('APPLIED', domain, op, true, null, null, { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
  }

  function writeMarkAdaptiveCheckCompleted(identity, command) {
    var domain = 'adaptiveTdee', op = 'markAdaptiveCheckCompleted';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    deps.setAdaptHistoryCache(command.history || {});
    return makeCommandResult('APPLIED', domain, op, true, null, null, { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
  }

  // B4: deps.recordCoachEvent(identity, type, data) מבצע את מוטציית ה-in-memory הקיימת
  // (userProfile.coachEvents) ואז כותב field-scoped דרך ה-Gateway, במקום saveProfile().
  async function writeRecordTriggerOutcome(identity, command) {
    var domain = 'trigger', op = 'recordTriggerOutcome';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    try {
      var pr = await deps.recordCoachEvent(identity, command.type, command.data);
      return mapPersistenceResult(domain, op, identity, pr);
    } catch (e) {
      return makeCommandResult('FAILED', domain, op, false, 'STATE_WRITE_FAILED', (e && e.message) || 'persist failed', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    }
  }

  async function writeUpdateDailyTriggerBudget(identity, command) {
    var domain = 'trigger', op = 'updateDailyTriggerBudget';
    if (!isCurrent(identity.sessionGeneration)) return makeCommandResult('REJECTED', domain, op, false, 'STALE_SESSION', 'session changed before write', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    try {
      var pr = await deps.markTriggerFired(identity, command.type);
      return mapPersistenceResult(domain, op, identity, pr);
    } catch (e) {
      return makeCommandResult('FAILED', domain, op, false, 'STATE_WRITE_FAILED', (e && e.message) || 'persist failed', { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Permission matrix (B3 SPEC §12, locked to the four B2 engines) ──
  // ══════════════════════════════════════════════════════════════════

  var READ_OPS = {
    nutritionActivityHistory: readNutritionActivityHistory,
    bodyHistory: readBodyHistory,
    weightThreshold: readWeightThreshold,
    habitView: readHabitView,
    patternView: readPatternView,
    adaptiveProfile: readAdaptiveProfile,
    triggerProfile: readTriggerProfile,
    todayNutrition: readTodayNutrition,
    triggerBudget: readTriggerBudget,
    canFire: readCanFire,
    workoutPayload: readWorkoutPayload
  };

  var WRITE_OPS = {
    replaceDerivedHabitView: writeReplaceDerivedHabitView,
    replaceDerivedPatternView: writeReplaceDerivedPatternView,
    storeAdaptiveProposal: writeStoreAdaptiveProposal,
    markAdaptiveCheckCompleted: writeMarkAdaptiveCheckCompleted,
    recordTriggerOutcome: writeRecordTriggerOutcome,
    updateDailyTriggerBudget: writeUpdateDailyTriggerBudget
  };

  var PERMISSIONS = {
    habitEngine: {
      RECOMPUTE: {
        reads: ['nutritionActivityHistory', 'bodyHistory', 'habitView'],
        writes: ['replaceDerivedHabitView']
      }
    },
    patternEngine: {
      RECOMPUTE: {
        reads: ['nutritionActivityHistory', 'bodyHistory', 'weightThreshold', 'patternView'],
        writes: ['replaceDerivedPatternView']
      }
    },
    adaptiveTdeeEngine: {
      ADAPTIVE_CHECK: { reads: ['nutritionActivityHistory', 'adaptiveProfile'], writes: ['storeAdaptiveProposal', 'markAdaptiveCheckCompleted'] },
      WEIGHT_CHANGED: { reads: ['nutritionActivityHistory', 'adaptiveProfile'], writes: ['storeAdaptiveProposal', 'markAdaptiveCheckCompleted'] },
      ADAPTIVE_RECHECK: { reads: ['nutritionActivityHistory', 'adaptiveProfile'], writes: ['storeAdaptiveProposal', 'markAdaptiveCheckCompleted'] }
    },
    triggerEngine: {
      DAILY_COACH_CHECK: {
        reads: ['nutritionActivityHistory', 'adaptiveProfile', 'triggerProfile', 'todayNutrition', 'triggerBudget', 'canFire'],
        writes: ['recordTriggerOutcome', 'updateDailyTriggerBudget']
      },
      WORKOUT_COMPLETED: {
        reads: ['workoutPayload', 'triggerProfile'],
        writes: ['recordTriggerOutcome']
      },
      LOCAL_NOTIFICATION_SCHEDULE: {
        reads: ['triggerProfile', 'todayNutrition', 'triggerBudget', 'canFire'],
        writes: ['recordTriggerOutcome', 'updateDailyTriggerBudget']
      }
    },
    // B5: capability-holder חדש בלבד — לא EngineRegistry.register() (הצרכן אינו B2 Engine,
    // ADR-B5-008). משתמש מחדש ב-habitView/patternView הקיימים ללא שינוי; אין writes (B5 לא
    // מבצע כתיבות durable כלשהן).
    derivedIntelligenceConsumer: {
      BUILD: {
        reads: ['habitView', 'patternView'],
        writes: []
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // ── Factory (B3 SPEC §7/§8) ──
  // ══════════════════════════════════════════════════════════════════

  function createEngineAccess(input) {
    input = input || {};
    var identity = {
      engineId: input.engineId,
      action: input.action,
      userId: input.userId,
      sessionGeneration: input.sessionGeneration,
      runId: input.runId
    };

    var approved = (PERMISSIONS[identity.engineId] && PERMISSIONS[identity.engineId][identity.action]) || null;
    var approvedReads = (approved && approved.reads) || [];
    var approvedWrites = (approved && approved.writes) || [];

    // כל שם operation מוגדר (ב-READ_OPS/WRITE_OPS) תמיד נוכח על ה-capability,
    // כך שקריאה לא-מאושרת מחזירה/זורקת STATE_ACCESS_DENIED מפורש ובר-בדיקה,
    // במקום TypeError גנרי של "is not a function" (B3 SPEC §22).
    var read = {};
    Object.keys(READ_OPS).forEach(function (opName) {
      if (approvedReads.indexOf(opName) === -1) {
        read[opName] = function () { throw accessDeniedError(identity.engineId + '/' + identity.action + ' -> read.' + opName); };
        return;
      }
      var fn = READ_OPS[opName];
      read[opName] = function () {
        var args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [identity].concat(args));
      };
    });

    var write = {};
    Object.keys(WRITE_OPS).forEach(function (opName) {
      if (approvedWrites.indexOf(opName) === -1) {
        write[opName] = function () {
          return makeCommandResult('REJECTED', 'unknown', opName, false, 'STATE_ACCESS_DENIED',
            'Operation not approved for ' + identity.engineId + '/' + identity.action, { runId: identity.runId, sessionGeneration: identity.sessionGeneration });
        };
        return;
      }
      var fn = WRITE_OPS[opName];
      write[opName] = function (command) {
        return fn(identity, command || {});
      };
    });

    // כל capability ייחודי ל-run הזה — לא נשמר/משותף בין קריאות (B3 §7: "new, separate per Engine run").
    return freezeShallow({
      identity: freezeShallow(Object.assign({}, identity)),
      read: freezeShallow(read),
      write: freezeShallow(write)
    });
  }

  var API = {
    VERSION: STATE_ACCESS_VERSION,
    configure: configure,
    createEngineAccess: createEngineAccess,
    ERROR_CODES: freezeShallow({
      STATE_ACCESS_DENIED: 'STATE_ACCESS_DENIED',
      UNKNOWN_ENGINE_ACTION: 'UNKNOWN_ENGINE_ACTION',
      STALE_SESSION: 'STALE_SESSION',
      INVALID_STATE_COMMAND: 'INVALID_STATE_COMMAND',
      DOMAIN_INVARIANT_VIOLATION: 'DOMAIN_INVARIANT_VIOLATION',
      STATE_READ_FAILED: 'STATE_READ_FAILED',
      STATE_WRITE_FAILED: 'STATE_WRITE_FAILED'
    })
  };

  if (typeof window !== 'undefined') {
    window.StateAccess = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
