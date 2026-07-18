// ══════════════════════════════════════════════════════════════════
// FitMe — Persistence Gateway (B4)
// אחריות בלעדית: הערוץ הלוגי היחיד לכתיבות durable מטעם המנועים/ליבת ה-AI.
// מקבל PersistenceRequest טיפוסי, מאמת מבנה/owner/domain/session/authority/
// payload/idempotency מול קטלוג operations סגור, מפעיל את ה-repository
// המאושר, מנרמל תוצאה, ומיישם retry חסום לכשלים חולפים בלבד. אינו Store
// חדש, אינו מחליף Firestore Rules, אינו מסיק Authority/Ownership, ואינו
// חושף write(path, data) גנרי. תלויות Firestore בפועל (db, serverTimestamp
// וכו') מוזרקות דרך configure() על ידי js/app.js — לא נטענות ישירות כאן,
// כדי שהמודול יישאר ניתן לבדיקה עצמאית ב-Node (כמו js/stateAccess.js).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var GATEWAY_VERSION = '1.0.0';

  // ── תלויות מוזרקות (B4 SPEC §11: repository adapters own Firestore mechanics) ──
  var deps = null;

  function configure(injected) {
    deps = injected || {};
  }

  function freezeShallow(obj) {
    try { return Object.freeze(obj); } catch (e) { return obj; }
  }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  function isCurrent(sessionGeneration) {
    return !!(deps && typeof deps.isSessionCurrent === 'function' && deps.isSessionCurrent(sessionGeneration));
  }

  function delay(ms) {
    if (deps && typeof deps.delay === 'function') return deps.delay(ms);
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Persistence Result (B4 SPEC §8) ──
  // ══════════════════════════════════════════════════════════════════
  function makeResult(requestId, operation, status, opts) {
    opts = opts || {};
    return freezeShallow({
      requestId: requestId || null,
      operation: operation || null,
      status: status,
      durable: !!opts.durable,
      changed: (typeof opts.changed === 'boolean') ? opts.changed : null,
      version: (typeof opts.version !== 'undefined') ? opts.version : null,
      error: freezeShallow({
        code: (opts.error && opts.error.code) || null,
        message: (opts.error && opts.error.message) || null,
        retryable: !!(opts.error && opts.error.retryable)
      }),
      // receipt.staleOnCompletion — תוספת אדיטיבית (B4 §18: "logged as committed but
      // stale-on-completion"), מקביל ל-staleAfterWrite שכבר קיים ב-B3 stateAccess.js.
      receipt: freezeShallow({
        repository: opts.repository || null,
        target: opts.target || null,
        committedAt: (typeof opts.committedAt !== 'undefined') ? opts.committedAt : null,
        attemptCount: opts.attemptCount || 0,
        staleOnCompletion: !!opts.staleOnCompletion
      })
    });
  }

  function rejected(requestId, operation, code, message) {
    return makeResult(requestId, operation, 'REJECTED', { error: { code: code, message: message, retryable: false } });
  }

  // ── סיווג שגיאות Firestore לצורך Retry (B4 SPEC §22) ──
  var RETRYABLE_CODES = ['unavailable', 'deadline-exceeded', 'aborted', 'internal', 'resource-exhausted'];
  function classifyRepositoryError(e) {
    var code = (e && e.code) || 'unknown';
    return { code: code, message: (e && e.message) || 'repository error', retryable: RETRYABLE_CODES.indexOf(code) !== -1 };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Payload validators — מבניים בלבד; חוקי עסק נשארים אצל המנועים ──
  // ══════════════════════════════════════════════════════════════════
  function validateHabitsPayload(p) {
    return !!p && Array.isArray(p.habits) && isPlainObject(p.habitsMeta);
  }
  function validatePatternsPayload(p) {
    return !!p && Array.isArray(p.patterns) && isPlainObject(p.patternsMeta);
  }
  function validateAdaptiveApplyPayload(p) {
    return !!p && typeof p.goalKcal === 'number' && typeof p.adaptiveTdee === 'number' &&
      typeof p.currentDeficit === 'number' && typeof p.lastTdeeUpdate === 'string' && Array.isArray(p.tdeeHistory);
  }
  function validateTriggerEventPayload(p) {
    return !!p && Array.isArray(p.coachEvents);
  }
  function validateTriggerBudgetPayload(p) {
    return !!p && isPlainObject(p.coachDay) && typeof p.coachDay.date === 'string' && Array.isArray(p.coachDay.fired);
  }
  function validateDaySavePayload(p) {
    return !!p && Array.isArray(p.meals) && typeof p.burned === 'number' && typeof p.steps === 'number' && typeof p.water === 'number';
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Repository adapters (B4 SPEC §11) — עוטפים דק סביב מבצעי Firestore המוזרקים ──
  // ══════════════════════════════════════════════════════════════════

  // כתיבת שדות מוגבלת (field-scoped merge) ל-users/{uid} — משותפת ל-Habit/Trigger/Adaptive;
  // כל operation מספק מיפוי שדות משלו כדי שה-durable surface יישאר מפורש per-operation (B4 §12).
  function makeProfileMergeRepository(id, buildFields) {
    return {
      id: id,
      execute: function (request) {
        var fields = buildFields(request.payload);
        return Promise.resolve()
          .then(function () { return deps.mergeUserFields(request.userId, fields); })
          .then(function () {
            return { status: 'SUCCESS', changed: true, version: null, target: 'users/' + request.userId, error: null };
          })
          .catch(function (e) {
            return { status: 'FAILED', changed: false, version: null, target: 'users/' + request.userId, error: classifyRepositoryError(e) };
          });
      }
    };
  }

  var habitsRepository = makeProfileMergeRepository('habitsRepository', function (payload) {
    return { coachMemory: { habits: payload.habits, habitsMeta: payload.habitsMeta } };
  });

  var adaptiveApplyRepository = makeProfileMergeRepository('adaptiveApplyRepository', function (payload) {
    return {
      goalKcal: payload.goalKcal, adaptiveTdee: payload.adaptiveTdee,
      currentDeficit: payload.currentDeficit, lastTdeeUpdate: payload.lastTdeeUpdate,
      tdeeHistory: payload.tdeeHistory
    };
  });

  var triggerEventRepository = makeProfileMergeRepository('triggerEventRepository', function (payload) {
    return { coachEvents: payload.coachEvents };
  });

  var triggerBudgetRepository = makeProfileMergeRepository('triggerBudgetRepository', function (payload) {
    return { coachDay: payload.coachDay };
  });

  var dayRepository = {
    id: 'dayRepository',
    execute: function (request) {
      return Promise.resolve()
        .then(function () { return deps.replaceDayDocument(request.userId, request.payload); })
        .then(function () {
          return { status: 'SUCCESS', changed: true, version: null, target: 'users/' + request.userId + '/days', error: null };
        })
        .catch(function (e) {
          return { status: 'FAILED', changed: false, version: null, target: 'users/' + request.userId + '/days', error: classifyRepositoryError(e) };
        });
    }
  };

  // Pattern בלבד: expectedVersion (fingerprint) נבדק אטומית מול המצב ה-durable הנוכחי
  // דרך טרנזקציה מוזרקת (B4 §16.2/§21/§24, Appendix D) — לא ניתן לאכוף CAS אמיתי
  // בעזרת set/merge פשוט בלבד.
  var patternsRepository = {
    id: 'patternsRepository',
    execute: function (request) {
      return Promise.resolve()
        .then(function () { return deps.runPatternTransaction(request.userId, request.payload, request.expectedVersion); })
        .then(function (r) {
          var version = (r && typeof r.version !== 'undefined') ? r.version : (request.payload.patternsMeta && request.payload.patternsMeta.sourceFingerprint) || null;
          return { status: 'SUCCESS', changed: true, version: version, target: 'users/' + request.userId, error: null };
        })
        .catch(function (e) {
          if (e && e.conflict) {
            return { status: 'CONFLICT', changed: false, version: (typeof e.currentVersion !== 'undefined') ? e.currentVersion : null, target: 'users/' + request.userId, error: { code: 'EXPECTED_VERSION_MISMATCH', message: 'durable pattern fingerprint moved past expectedVersion', retryable: false } };
          }
          return { status: 'FAILED', changed: false, version: null, target: 'users/' + request.userId, error: classifyRepositoryError(e) };
        });
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // ── Closed Operation Catalog (B4 SPEC §10, Appendix A) ──
  // תוסים חדשים דורשים אישור Architecture/SPEC — אין registerOperation() runtime.
  // ══════════════════════════════════════════════════════════════════
  var OPERATIONS = {
    DERIVED_HABITS_REPLACE: {
      domain: 'DERIVED_INTELLIGENCE', allowedOwners: ['habitState'], repository: habitsRepository,
      durableSurface: 'DERIVED_HABITS', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: true, acceptedAuthoritySources: ['HABIT_ENGINE'],
      requiresIdempotencyKey: false, conflictPolicy: 'NONE', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validateHabitsPayload
    },
    DERIVED_PATTERNS_REPLACE: {
      domain: 'DERIVED_INTELLIGENCE', allowedOwners: ['patternState'], repository: patternsRepository,
      durableSurface: 'DERIVED_PATTERNS', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: true, acceptedAuthoritySources: ['PATTERN_ENGINE'],
      requiresIdempotencyKey: false, conflictPolicy: 'EXPECTED_VERSION', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validatePatternsPayload
    },
    // B3 §6 map: Authoritative Adaptive Target is owned by the Profile and Goals Domain, not the
    // Adaptive TDEE Domain — the proposal-storage step (Adaptive TDEE Domain) is not persisted at
    // all today and stays out of B4 scope (Engineering Readiness Review Q16).
    DERIVED_ADAPTIVE_PROPOSAL_APPLY: {
      domain: 'USER_PROFILE', allowedOwners: ['profileGoalsState'], repository: adaptiveApplyRepository,
      durableSurface: 'ADAPTIVE_TARGET', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: true, acceptedAuthoritySources: ['SYSTEM'],
      requiresIdempotencyKey: false, conflictPolicy: 'NONE', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validateAdaptiveApplyPayload
    },
    // append-style (coachEvents array) — דורש idempotencyKey (B4 §23 כלל 3), בניגוד
    // ל-replace-style operations האחרות שאידמפוטנטיות באופן טבעי (§23 כלל 2).
    TRIGGER_RECORD_EVENT: {
      domain: 'SYSTEM_METADATA', allowedOwners: ['triggerState'], repository: triggerEventRepository,
      durableSurface: 'TRIGGER_EVENTS', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: false, acceptedAuthoritySources: [],
      requiresIdempotencyKey: true, conflictPolicy: 'NONE', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validateTriggerEventPayload
    },
    TRIGGER_UPDATE_BUDGET: {
      domain: 'SYSTEM_METADATA', allowedOwners: ['triggerState'], repository: triggerBudgetRepository,
      durableSurface: 'TRIGGER_BUDGET', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: false, acceptedAuthoritySources: [],
      requiresIdempotencyKey: false, conflictPolicy: 'NONE', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validateTriggerBudgetPayload
    },
    SOURCE_HISTORY_SAVE_DAY: {
      domain: 'SOURCE_HISTORY', allowedOwners: ['nutritionHistoryState'], repository: dayRepository,
      durableSurface: 'DAY_DOCUMENT', requiresUser: true, requiresSessionGeneration: true,
      requiresAuthority: true, acceptedAuthoritySources: ['USER_DECLARATION', 'USER_CONFIRMED_AI_ESTIMATE'],
      requiresIdempotencyKey: false, conflictPolicy: 'NONE', retryPolicy: 'TRANSIENT_ONLY',
      payloadValidator: validateDaySavePayload
    }
  };

  var MAX_RETRY_ATTEMPTS = 3;
  var RETRY_BASE_DELAY_MS = 200;

  // ══════════════════════════════════════════════════════════════════
  // ── Idempotency ledger (B4 SPEC §23) — בר-בדיקה, חסום בגודלו, per user+operation.
  // אף operation נוכחי אינו requiresIdempotencyKey (כולם replace-style, טבעית
  // אידמפוטנטיים לפי §23 כלל 2) — המנגנון קיים וניתן להפעלה כאשר caller כן מספק מפתח.
  // ══════════════════════════════════════════════════════════════════
  var IDEMPOTENCY_CAP = 200;
  var idempotencyLedger = {};
  function hashPayload(payload) {
    try { return JSON.stringify(payload); } catch (e) { return String(payload); }
  }
  function ledgerKey(userId, operation, idempotencyKey) {
    return userId + '::' + operation + '::' + idempotencyKey;
  }
  function pruneIdempotencyLedger() {
    var keys = Object.keys(idempotencyLedger);
    if (keys.length <= IDEMPOTENCY_CAP) return;
    keys.slice(0, keys.length - IDEMPOTENCY_CAP).forEach(function (k) { delete idempotencyLedger[k]; });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Gateway pipeline (B4 SPEC §9) ──
  // ══════════════════════════════════════════════════════════════════
  async function persist(request) {
    request = request || {};
    var requestId = request.requestId;
    var operation = request.operation;

    // 1. Validate Request Structure
    if (!isNonEmptyString(requestId)) return rejected(requestId, operation, 'INVALID_REQUEST', 'requestId is required');
    if (!isNonEmptyString(operation)) return rejected(requestId, operation, 'UNKNOWN_OPERATION', 'operation is required');

    // 2. Resolve Operation Definition
    var def = OPERATIONS[operation];
    if (!def) return rejected(requestId, operation, 'UNKNOWN_OPERATION', 'operation not in closed catalog: ' + operation);

    // 3. Validate Owner (B4 §20)
    if (!isNonEmptyString(request.owner) || def.allowedOwners.indexOf(request.owner) === -1) {
      return rejected(requestId, operation, 'OWNER_NOT_ALLOWED', 'owner not allowed to submit ' + operation);
    }

    // 4. Validate Domain
    if (request.domain !== def.domain) {
      return rejected(requestId, operation, 'DOMAIN_MISMATCH', 'domain does not match operation domain');
    }

    // 5. Validate Session (B4 §18)
    if (def.requiresUser && !isNonEmptyString(request.userId)) {
      return rejected(requestId, operation, 'INVALID_REQUEST', 'userId is required');
    }
    if (def.requiresSessionGeneration) {
      if (typeof request.sessionGeneration === 'undefined' || request.sessionGeneration === null) {
        return rejected(requestId, operation, 'INVALID_REQUEST', 'sessionGeneration is required');
      }
      if (!isCurrent(request.sessionGeneration)) {
        return makeResult(requestId, operation, 'STALE_SESSION', { error: { code: 'STALE_SESSION', message: 'session changed before repository execution', retryable: false } });
      }
    }

    // 6. Validate Authority (B4 §19)
    if (def.requiresAuthority) {
      var authority = request.authority;
      if (!authority || !authority.authoritySource) {
        return rejected(requestId, operation, 'AUTHORITY_REQUIRED', 'authority metadata is required for ' + operation);
      }
      if (def.acceptedAuthoritySources.indexOf(authority.authoritySource) === -1) {
        return rejected(requestId, operation, 'AUTHORITY_INVALID', 'authoritySource not accepted for ' + operation);
      }
    }

    // 7. Validate Payload
    if (!def.payloadValidator(request.payload)) {
      return rejected(requestId, operation, 'INVALID_PAYLOAD', 'payload failed structural validation for ' + operation);
    }

    // 8. Validate Idempotency Requirements (B4 §23)
    if (def.requiresIdempotencyKey && !isNonEmptyString(request.idempotencyKey)) {
      return rejected(requestId, operation, 'IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required for ' + operation);
    }
    var key = null;
    if (isNonEmptyString(request.idempotencyKey)) {
      key = ledgerKey(request.userId, operation, request.idempotencyKey);
      var seen = idempotencyLedger[key];
      var currentHash = hashPayload(request.payload);
      if (seen) {
        if (seen.hash !== currentHash) {
          return rejected(requestId, operation, 'IDEMPOTENCY_MISMATCH', 'idempotencyKey reused with a different payload');
        }
        return makeResult(requestId, operation, 'NO_OP', { durable: true, changed: false, version: seen.version, repository: def.repository.id });
      }
    }

    // 9-14. Resolve Repository Adapter → Execute → Normalize → Bounded Retry → Re-check Session
    var repo = def.repository;
    var attempt = 0;
    var repoResult = null;
    while (attempt < MAX_RETRY_ATTEMPTS) {
      attempt++;
      if (def.requiresSessionGeneration && !isCurrent(request.sessionGeneration)) {
        return makeResult(requestId, operation, 'STALE_SESSION', {
          error: { code: 'STALE_SESSION', message: 'session changed before retry', retryable: false },
          repository: repo.id, attemptCount: attempt - 1
        });
      }
      repoResult = await repo.execute(request);
      var canRetry = def.retryPolicy === 'TRANSIENT_ONLY' && repoResult.status === 'FAILED' &&
        repoResult.error && repoResult.error.retryable && attempt < MAX_RETRY_ATTEMPTS;
      if (!canRetry) break;
      await delay(RETRY_BASE_DELAY_MS * attempt);
    }

    var staleOnCompletion = def.requiresSessionGeneration && !isCurrent(request.sessionGeneration);

    if (repoResult.status === 'SUCCESS') {
      if (key) { idempotencyLedger[key] = { hash: hashPayload(request.payload), version: repoResult.version }; pruneIdempotencyLedger(); }
      return makeResult(requestId, operation, 'SUCCESS', {
        durable: true, changed: repoResult.changed, version: repoResult.version,
        repository: repo.id, target: repoResult.target, committedAt: Date.now(),
        attemptCount: attempt, staleOnCompletion: staleOnCompletion
      });
    }
    if (repoResult.status === 'CONFLICT') {
      return makeResult(requestId, operation, 'CONFLICT', {
        durable: false, changed: false, version: repoResult.version,
        repository: repo.id, target: repoResult.target, attemptCount: attempt, error: repoResult.error
      });
    }
    return makeResult(requestId, operation, 'FAILED', {
      durable: false, changed: false, repository: repo.id, target: repoResult.target,
      attemptCount: attempt, error: repoResult.error
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Diagnostics (B4 SPEC §10, Appendix B) — לקריאה בלבד, אין registerOperation() ──
  // ══════════════════════════════════════════════════════════════════
  function getOperation(id) {
    var def = OPERATIONS[id];
    if (!def) return null;
    return freezeShallow({
      operation: id, version: GATEWAY_VERSION, domain: def.domain,
      allowedOwners: def.allowedOwners.slice(), repositoryAdapter: def.repository.id,
      durableSurface: def.durableSurface, requiresUser: def.requiresUser,
      requiresSessionGeneration: def.requiresSessionGeneration, requiresAuthority: def.requiresAuthority,
      acceptedAuthoritySources: def.acceptedAuthoritySources.slice(),
      requiresIdempotencyKey: def.requiresIdempotencyKey, conflictPolicy: def.conflictPolicy,
      retryPolicy: def.retryPolicy
    });
  }
  function listOperations() { return Object.keys(OPERATIONS); }

  var API = {
    VERSION: GATEWAY_VERSION,
    configure: configure,
    persist: persist,
    getOperation: getOperation,
    listOperations: listOperations
  };

  if (typeof window !== 'undefined') {
    window.PersistenceGateway = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
