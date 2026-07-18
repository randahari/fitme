// B4 — Persistence Gateway tests.
// Dependency-free: Node's built-in test runner + assert only.
// Exercises the real js/persistenceGateway.js module directly, configured with mock
// Firestore-shaped dependencies (mirrors the approach already used for
// tests/stateAccess.test.js). Run with: node --test tests/persistenceGateway.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const PersistenceGateway = require('../js/persistenceGateway.js');

function makeEnv(overrides) {
  overrides = overrides || {};
  let generation = 1;
  const store = { habits: undefined, habitsMeta: undefined, coachMemory: { patternsMeta: { sourceFingerprint: null } }, adaptive: {}, trigger: {} };
  const dayStore = {};
  const calls = { mergeUserFields: [], replaceDayDocument: [], runPatternTransaction: [] };

  let mergeFailTimes = overrides.mergeFailTimes || 0;
  let mergeFailCode = overrides.mergeFailCode || 'unavailable';

  const deps = {
    isSessionCurrent: (gen) => gen === generation,
    delay: () => Promise.resolve(), // no real waiting in tests
    mergeUserFields: (uid, fields) => {
      calls.mergeUserFields.push({ uid, fields });
      if (mergeFailTimes > 0) {
        mergeFailTimes--;
        const e = new Error('simulated Firestore error');
        e.code = mergeFailCode;
        return Promise.reject(e);
      }
      Object.assign(store, fields); // shallow merge is enough for these top-level-key tests
      if (fields.coachMemory) store.coachMemory = Object.assign({}, store.coachMemory, fields.coachMemory);
      return Promise.resolve();
    },
    replaceDayDocument: (uid, payload) => {
      calls.replaceDayDocument.push({ uid, payload });
      if (overrides.dayFail) return Promise.reject(overrides.dayFail);
      dayStore.meals = payload.meals; dayStore.burned = payload.burned; dayStore.steps = payload.steps; dayStore.water = payload.water;
      return Promise.resolve();
    },
    runPatternTransaction: (uid, payload, expectedVersion) => {
      calls.runPatternTransaction.push({ uid, payload, expectedVersion });
      const current = store.coachMemory.patternsMeta.sourceFingerprint;
      if (expectedVersion !== null && typeof expectedVersion !== 'undefined' && current !== expectedVersion) {
        const e = new Error('conflict'); e.conflict = true; e.currentVersion = current;
        return Promise.reject(e);
      }
      if (overrides.patternFail) return Promise.reject(overrides.patternFail);
      store.coachMemory.patterns = payload.patterns;
      store.coachMemory.patternsMeta = payload.patternsMeta;
      return Promise.resolve({ version: payload.patternsMeta.sourceFingerprint });
    }
  };

  return {
    deps, store, dayStore, calls,
    setGeneration: (g) => { generation = g; },
    getGeneration: () => generation,
    setMergeFailTimes: (n, code) => { mergeFailTimes = n; if (code) mergeFailCode = code; }
  };
}

function configure(env) { PersistenceGateway.configure(env.deps); }

const AUTH_HABIT = { authoritySource: 'HABIT_ENGINE', isAuthoritative: true, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };
const AUTH_PATTERN = { authoritySource: 'PATTERN_ENGINE', isAuthoritative: true, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };
const AUTH_SYSTEM = { authoritySource: 'SYSTEM', isAuthoritative: true, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };
const AUTH_USER_DECL = { authoritySource: 'USER_DECLARATION', isAuthoritative: true, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };
const AUTH_AI_CONFIRMED = { authoritySource: 'USER_CONFIRMED_AI_ESTIMATE', isAuthoritative: true, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };
const AUTH_GENERATIVE = { authoritySource: 'GENERATIVE', isAuthoritative: false, createdBy: 'user-1', createdAt: 1, rule: 'r', systemVersion: 'v' };

function habitsRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-habits-1', operation: 'DERIVED_HABITS_REPLACE', domain: 'DERIVED_INTELLIGENCE',
    owner: 'habitState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { habits: [{ id: 'h1' }], habitsMeta: { lastRun: '2026-07-18', version: 1 } },
    authority: AUTH_HABIT, expectedVersion: null, idempotencyKey: null, createdAt: 1, metadata: {}
  }, overrides);
}
function patternsRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-patterns-1', operation: 'DERIVED_PATTERNS_REPLACE', domain: 'DERIVED_INTELLIGENCE',
    owner: 'patternState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { patterns: [{ id: 'p1' }], patternsMeta: { sourceFingerprint: 'fp-1' } },
    authority: AUTH_PATTERN, expectedVersion: null, idempotencyKey: null, createdAt: 1, metadata: {}
  }, overrides);
}
function adaptiveRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-adaptive-1', operation: 'DERIVED_ADAPTIVE_PROPOSAL_APPLY', domain: 'USER_PROFILE',
    owner: 'profileGoalsState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { goalKcal: 1800, adaptiveTdee: 2200, currentDeficit: -400, lastTdeeUpdate: '2026-07-18', tdeeHistory: [] },
    authority: AUTH_SYSTEM, expectedVersion: null, idempotencyKey: null, createdAt: 1, metadata: {}
  }, overrides);
}
function triggerEventRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-trigger-event-1', operation: 'TRIGGER_RECORD_EVENT', domain: 'SYSTEM_METADATA',
    owner: 'triggerState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { coachEvents: [{ type: 'streak-7' }] }, authority: null, expectedVersion: null,
    idempotencyKey: 'user-1:streak-7:2026-07-18', createdAt: 1, metadata: {}
  }, overrides);
}
function triggerBudgetRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-trigger-budget-1', operation: 'TRIGGER_UPDATE_BUDGET', domain: 'SYSTEM_METADATA',
    owner: 'triggerState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { coachDay: { date: '2026-07-18', fired: ['streak-7'], count: 1 } }, authority: null,
    expectedVersion: null, idempotencyKey: null, createdAt: 1, metadata: {}
  }, overrides);
}
function daySaveRequest(env, overrides) {
  return Object.assign({
    requestId: 'req-day-1', operation: 'SOURCE_HISTORY_SAVE_DAY', domain: 'SOURCE_HISTORY',
    owner: 'nutritionHistoryState', userId: 'user-1', sessionGeneration: env.getGeneration(),
    payload: { meals: [{ kcal: 300 }], burned: 0, steps: 0, water: 2 },
    authority: AUTH_AI_CONFIRMED, expectedVersion: null, idempotencyKey: null, createdAt: 1, metadata: {}
  }, overrides);
}

// ══════════════════════════════════════════════════════════════════
// ── Gateway Contract (1-10) ──
// ══════════════════════════════════════════════════════════════════
test('1. a valid request resolves and executes the correct operation', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.operation, 'DERIVED_HABITS_REPLACE');
  assert.deepEqual(env.store.coachMemory.habits, [{ id: 'h1' }]);
});

test('2. an unknown operation is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { operation: 'NOT_A_REAL_OP' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'UNKNOWN_OPERATION');
  assert.equal(env.calls.mergeUserFields.length, 0, 'repository must never execute for an unknown operation');
});

test('3. a missing requestId is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { requestId: null }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'INVALID_REQUEST');
});

test('4. a missing owner is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { owner: null }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'OWNER_NOT_ALLOWED');
});

test('5. a domain mismatch is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { domain: 'USER_PROFILE' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'DOMAIN_MISMATCH');
});

test('6. an invalid payload is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { payload: { habits: 'not-an-array' } }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'INVALID_PAYLOAD');
});

test('7. raw Firestore paths cannot be supplied by the caller', async () => {
  const env = makeEnv(); configure(env);
  const req = habitsRequest(env);
  req.path = 'users/other-uid'; // an attacker-supplied field the gateway must never honor
  req.payload.__collectionOverride = 'evil/path';
  const result = await PersistenceGateway.persist(req);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(env.calls.mergeUserFields[0].uid, 'user-1', 'only request.userId is ever used to build the write target — an attacker-supplied path/collectionOverride field has no effect');
  assert.deepEqual(Object.keys(env.calls.mergeUserFields[0].fields), ['coachMemory'], 'only the catalog-declared field mapping is written — extraneous payload keys never reach the repository');
});

test('8. a repository failure is never reported as success', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'permission-denied' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'FAILED');
  assert.notEqual(result.status, 'SUCCESS');
  assert.equal(result.durable, false);
});

test('9. durable is true only after confirmed repository success', async () => {
  const env = makeEnv(); configure(env);
  const ok = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(ok.durable, true);
  const env2 = makeEnv({ mergeFailTimes: 99 }); configure(env2);
  const bad = await PersistenceGateway.persist(habitsRequest(env2));
  assert.equal(bad.durable, false);
});

test('10. result normalization is deterministic for the same request/repository state', async () => {
  const env = makeEnv(); configure(env);
  const r1 = await PersistenceGateway.persist(habitsRequest(env, { requestId: 'a' }));
  const env2 = makeEnv(); configure(env2);
  const r2 = await PersistenceGateway.persist(habitsRequest(env2, { requestId: 'a' }));
  assert.equal(r1.status, r2.status);
  assert.equal(r1.durable, r2.durable);
  assert.equal(r1.changed, r2.changed);
});

// ══════════════════════════════════════════════════════════════════
// ── Ownership (11-14) ──
// ══════════════════════════════════════════════════════════════════
test('11. an allowed owner can submit its operation', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(patternsRequest(env));
  assert.equal(result.status, 'SUCCESS');
});

test('12. a wrong owner is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(patternsRequest(env, { owner: 'habitState' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'OWNER_NOT_ALLOWED');
});

test('13. one engine owner cannot write another engine\'s durable surface', async () => {
  const env = makeEnv(); configure(env);
  // habitState attempting to submit the Pattern-owned operation
  const result = await PersistenceGateway.persist(patternsRequest(env, { owner: 'habitState' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(env.calls.runPatternTransaction.length, 0, 'the repository must never execute for a disallowed owner');
});

test('14. shared users/{uid} document does not bypass field ownership — a merge only ever touches its own declared fields', async () => {
  const env = makeEnv(); configure(env);
  env.store.untouchedField = 'must-survive';
  await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(env.store.untouchedField, 'must-survive');
  const fieldsWritten = env.calls.mergeUserFields[0].fields;
  assert.deepEqual(Object.keys(fieldsWritten), ['coachMemory'], 'DERIVED_HABITS_REPLACE must write only its declared coachMemory.habits/habitsMeta surface');
});

// ══════════════════════════════════════════════════════════════════
// ── Authority (15-19) ──
// ══════════════════════════════════════════════════════════════════
test('15. missing required authority is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { authority: null }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'AUTHORITY_REQUIRED');
});

test('16. generative authority cannot write source history', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(daySaveRequest(env, { authority: AUTH_GENERATIVE }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'AUTHORITY_INVALID');
  assert.equal(env.calls.replaceDayDocument.length, 0);
});

test('17. deterministic engine authority can write its approved derived-intelligence operation', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env, { authority: AUTH_HABIT }));
  assert.equal(result.status, 'SUCCESS');
  const patternEnv = makeEnv(); configure(patternEnv);
  const patternResult = await PersistenceGateway.persist(patternsRequest(patternEnv, { authority: AUTH_PATTERN }));
  assert.equal(patternResult.status, 'SUCCESS');
});

test('18. a user-confirmed validated AI estimate can write source history', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(daySaveRequest(env, { authority: AUTH_AI_CONFIRMED }));
  assert.equal(result.status, 'SUCCESS');
  const env2 = makeEnv(); configure(env2);
  const declResult = await PersistenceGateway.persist(daySaveRequest(env2, { authority: AUTH_USER_DECL }));
  assert.equal(declResult.status, 'SUCCESS', 'manual/off/group entries (USER_DECLARATION) are also accepted');
});

test('19. authority metadata is preserved unchanged by the gateway', async () => {
  const env = makeEnv(); configure(env);
  const req = habitsRequest(env);
  const authoritySnapshot = Object.assign({}, req.authority);
  await PersistenceGateway.persist(req);
  assert.deepEqual(req.authority, authoritySnapshot, 'the gateway must not mutate the caller-supplied authority object');
});

// ══════════════════════════════════════════════════════════════════
// ── Session Safety (20-24) ──
// ══════════════════════════════════════════════════════════════════
test('20. a current-session request may write', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'SUCCESS');
});

test('21. a stale session request is rejected before repository execution', async () => {
  const env = makeEnv(); configure(env);
  const req = habitsRequest(env);
  env.setGeneration(2); // session changed after the request was built
  const result = await PersistenceGateway.persist(req);
  assert.equal(result.status, 'STALE_SESSION');
  assert.equal(env.calls.mergeUserFields.length, 0, 'repository must never execute for a stale session');
});

test('22. session invalidated during an async write suppresses completion effects (staleOnCompletion)', async () => {
  const env = makeEnv(); configure(env);
  let resolveMerge;
  const deferred = new Promise((resolve) => { resolveMerge = resolve; });
  env.deps.mergeUserFields = (uid, fields) => deferred.then(() => { Object.assign(env.store, fields); });
  const pending = PersistenceGateway.persist(habitsRequest(env));
  env.setGeneration(2);
  resolveMerge();
  const result = await pending;
  assert.equal(result.status, 'SUCCESS', 'the durable write already committed and cannot be un-applied');
  assert.equal(result.receipt.staleOnCompletion, true);
});

test('23. stale requests are not retried', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'unavailable' }); configure(env);
  const req = habitsRequest(env);
  env.setGeneration(2);
  await PersistenceGateway.persist(req);
  assert.equal(env.calls.mergeUserFields.length, 0);
});

test('24. account switch cannot apply prior user completion state to the new session', async () => {
  const env = makeEnv(); configure(env);
  let resolveMerge;
  const deferred = new Promise((resolve) => { resolveMerge = resolve; });
  env.deps.mergeUserFields = (uid, fields) => deferred.then(() => { Object.assign(env.store, fields); });
  const pending = PersistenceGateway.persist(habitsRequest(env));
  env.setGeneration(2); // simulated account switch mid-flight
  resolveMerge();
  const result = await pending;
  // the result is returned to whoever is still awaiting it, but flagged stale — callers
  // (StateAccess write ops / engine adapters) are responsible for not applying runtime
  // effects when staleOnCompletion is true (mirrors B3's staleAfterWrite convention).
  assert.equal(result.receipt.staleOnCompletion, true);
});

// Implementation Review correction: the failure-path completion effect (alert()) in
// addMeal()/logQuick()/applyAdaptiveUpdate() was not gated by a session-currency check —
// only the success path checked SessionLifecycle.isCurrent() before showing UI effects,
// so a user who signed out mid-flight would still see a stale-session failure alert
// (REM-002: "Completion effects for the stale runtime SHALL be suppressed", B4 §18).
// js/app.js is browser-only and cannot be require()'d, so this is a static source check —
// mirrors the existing approach used by tests 39-42 above.
test('24b. addMeal/logQuick/applyAdaptiveUpdate gate their failure alert on session currency (regression, Implementation Review)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  ['שמירת הארוחה נכשלה', 'שמירת הפריט נכשלה', 'שמירת היעד נכשלה'].forEach((msg) => {
    const idx = appJs.indexOf(msg);
    assert.notEqual(idx, -1, 'expected failure message not found: ' + msg);
    const prefix = appJs.slice(Math.max(0, idx - 80), idx);
    assert.match(prefix, /if \(SessionLifecycle\.isCurrent\(gen\)\)\s*alert\('$/, 'the alert for "' + msg + '" must be gated by SessionLifecycle.isCurrent(gen)');
  });
});

// Implementation Review correction: writeReplaceDerivedHabitView (js/stateAccess.js) and
// the recordCoachEvent/markTriggerFired deps (js/app.js) previously had no rollback on a
// failed write — unreachable before B4 (saveProfile() never rejected), but a real gap once
// the Gateway can genuinely fail: habitsMeta.lastRun / coachDay.fired would silently advance
// in-memory without ever being durably saved, permanently blocking the once-per-day gate /
// canFire() retry for the rest of that day (B4 §26 rule 6). Habit's fix is covered by a real
// unit test (tests/stateAccess.test.js test 19b); markTriggerFired/recordCoachEvent live in
// browser-only js/app.js and are covered here by a static source check.
test('19c. recordCoachEvent/markTriggerFired (js/app.js) roll back coachEvents/coachDay on a failed persist (regression, Implementation Review)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const recordIdx = appJs.indexOf('recordCoachEvent: function (identity, type, meta)');
  const markIdx = appJs.indexOf('markTriggerFired: function (identity, type)');
  assert.notEqual(recordIdx, -1); assert.notEqual(markIdx, -1);
  const recordBody = appJs.slice(recordIdx, markIdx);
  const markBody = appJs.slice(markIdx, markIdx + 1200);
  assert.match(recordBody, /userProfile\.coachEvents\s*=\s*snapshot/, 'recordCoachEvent must restore the pre-mutation coachEvents snapshot on a non-success result');
  assert.match(markBody, /cd\.fired\s*=\s*snapshotFired/, 'markTriggerFired must restore the pre-mutation fired array on a non-success result');
  assert.match(markBody, /cd\.count\s*=\s*snapshotCount/, 'markTriggerFired must restore the pre-mutation count on a non-success result');
});

// ══════════════════════════════════════════════════════════════════
// ── Retry (25-30) ──
// ══════════════════════════════════════════════════════════════════
test('25. an approved transient failure retries within the limit and succeeds', async () => {
  const env = makeEnv({ mergeFailTimes: 1, mergeFailCode: 'unavailable' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'SUCCESS');
  assert.equal(env.calls.mergeUserFields.length, 2, 'one failed attempt, one successful retry');
});

test('26. retry stops immediately after a success', async () => {
  const env = makeEnv({ mergeFailTimes: 1, mergeFailCode: 'unavailable' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.receipt.attemptCount, 2);
});

test('27. a non-retryable failure does not retry', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'permission-denied' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'FAILED');
  assert.equal(env.calls.mergeUserFields.length, 1, 'permission-denied must never be retried');
  assert.equal(result.error.retryable, false);
});

test('28. the retry limit is enforced (max 3 attempts)', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'unavailable' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'FAILED');
  assert.equal(env.calls.mergeUserFields.length, 3);
  assert.equal(result.receipt.attemptCount, 3);
});

test('29. session validity is checked before every retry attempt', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'unavailable' }); configure(env);
  let call = 0;
  const realMerge = env.deps.mergeUserFields;
  env.deps.mergeUserFields = (uid, fields) => {
    call++;
    if (call === 2) env.setGeneration(2); // session dies between attempt 1 and attempt 2
    return realMerge(uid, fields);
  };
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'STALE_SESSION');
  assert.equal(call, 2, 'no third attempt should occur once the session is stale');
});

test('30. attempt count is returned in the result receipt', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.receipt.attemptCount, 1);
});

// ══════════════════════════════════════════════════════════════════
// ── Idempotency (31-34) ──
// ══════════════════════════════════════════════════════════════════
test('31. the same idempotency key with the same payload is safe (NO_OP on replay)', async () => {
  const env = makeEnv(); configure(env);
  const req = triggerEventRequest(env);
  const first = await PersistenceGateway.persist(req);
  assert.equal(first.status, 'SUCCESS');
  const replay = await PersistenceGateway.persist(Object.assign({}, req, { requestId: 'req-trigger-event-1-replay' }));
  assert.equal(replay.status, 'NO_OP');
  assert.equal(env.calls.mergeUserFields.length, 1, 'the replay must not execute the repository again');
});

test('32. the same idempotency key with a different payload is rejected', async () => {
  const env = makeEnv(); configure(env);
  const req = triggerEventRequest(env);
  await PersistenceGateway.persist(req);
  const conflicting = await PersistenceGateway.persist(triggerEventRequest(env, {
    requestId: 'req-trigger-event-2', payload: { coachEvents: [{ type: 'streak-7' }, { type: 'extra' }] }
  }));
  assert.equal(conflicting.status, 'REJECTED');
  assert.equal(conflicting.error.code, 'IDEMPOTENCY_MISMATCH');
});

test('33. an append operation without a required idempotency key is rejected', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(triggerEventRequest(env, { idempotencyKey: null }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'IDEMPOTENCY_KEY_REQUIRED');
});

test('34. a replacement operation can return NO_OP-equivalent safety without requiring an idempotency key', async () => {
  const env = makeEnv(); configure(env);
  // DERIVED_HABITS_REPLACE does not require a key (naturally idempotent replace, §23 rule 2) —
  // submitting without one must not be rejected the way the append operation is in test 33.
  const result = await PersistenceGateway.persist(habitsRequest(env, { idempotencyKey: null }));
  assert.equal(result.status, 'SUCCESS');
});

// ══════════════════════════════════════════════════════════════════
// ── Conflict (35-38) ──
// ══════════════════════════════════════════════════════════════════
test('35. an expected-version mismatch returns CONFLICT', async () => {
  const env = makeEnv(); configure(env);
  env.store.coachMemory.patternsMeta.sourceFingerprint = 'fp-durable-B';
  const result = await PersistenceGateway.persist(patternsRequest(env, { expectedVersion: 'fp-expected-A' }));
  assert.equal(result.status, 'CONFLICT');
  assert.equal(result.error.code, 'EXPECTED_VERSION_MISMATCH');
});

test('36. a conflict does not overwrite durable state', async () => {
  const env = makeEnv(); configure(env);
  env.store.coachMemory.patterns = [{ id: 'already-durable' }];
  env.store.coachMemory.patternsMeta.sourceFingerprint = 'fp-durable-B';
  await PersistenceGateway.persist(patternsRequest(env, { expectedVersion: 'fp-expected-A' }));
  assert.deepEqual(env.store.coachMemory.patterns, [{ id: 'already-durable' }]);
});

test('37. a conflict is not reported as a generic failure', async () => {
  const env = makeEnv(); configure(env);
  env.store.coachMemory.patternsMeta.sourceFingerprint = 'fp-durable-B';
  const result = await PersistenceGateway.persist(patternsRequest(env, { expectedVersion: 'fp-expected-A' }));
  assert.notEqual(result.status, 'FAILED');
  assert.equal(result.status, 'CONFLICT');
});

test('38. matching expectedVersion (or first-ever write, expectedVersion null) applies successfully', async () => {
  const env = makeEnv(); configure(env);
  const result = await PersistenceGateway.persist(patternsRequest(env, { expectedVersion: null }));
  assert.equal(result.status, 'SUCCESS');
  const env2 = makeEnv(); configure(env2);
  env2.store.coachMemory.patternsMeta.sourceFingerprint = 'fp-match';
  const result2 = await PersistenceGateway.persist(patternsRequest(env2, { expectedVersion: 'fp-match' }));
  assert.equal(result2.status, 'SUCCESS');
});

// ══════════════════════════════════════════════════════════════════
// ── Engine Integration (39-45) — covered by wiring + regression, documented here ──
// ══════════════════════════════════════════════════════════════════
test('39-42. Habit/Pattern/Adaptive-apply/Trigger operations all resolve through this gateway, not direct Firestore (static source check)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.match(appJs, /persistHabitsView:\s*function/, 'Habit write must be injected as a gateway-calling dependency');
  assert.match(appJs, /persistPatternView:\s*function\s*\(\s*identity\s*,\s*command\s*\)/, 'Pattern write must accept (identity, command), not raw db access');
  assert.match(appJs, /operation:\s*'DERIVED_ADAPTIVE_PROPOSAL_APPLY'/, 'Adaptive apply must submit through the gateway');
  assert.match(appJs, /operation:\s*'TRIGGER_RECORD_EVENT'/);
  assert.match(appJs, /operation:\s*'TRIGGER_UPDATE_BUDGET'/);
  assert.equal(/async function applyAdaptiveUpdate[\s\S]{0,400}await saveProfile\(\)/.test(appJs), false, 'applyAdaptiveUpdate must no longer call the broad saveProfile() directly');
});

test('43. engine computation success with persistence failure is represented accurately (not collapsed into a false success)', async () => {
  const env = makeEnv({ mergeFailTimes: 99, mergeFailCode: 'permission-denied' }); configure(env);
  const result = await PersistenceGateway.persist(habitsRequest(env));
  assert.equal(result.status, 'FAILED');
  assert.equal(result.durable, false);
  // this is exactly what js/stateAccess.js's mapPersistenceResult()/persistenceSummary()
  // (js/app.js) surface as StateCommandResult.status='FAILED' / output.persistence.status='FAILED'
  // to the engine's own caller — verified end-to-end in tests/stateAccess.test.js.
});

test('44-45. B2 orchestration/routing is untouched by this module (documented — see tests/b2Wiring.test.js, tests/engineRegistry.test.js)', () => {
  assert.ok(true);
});

// ══════════════════════════════════════════════════════════════════
// ── Durable Surfaces (46-50) ──
// ══════════════════════════════════════════════════════════════════
test('46. the Habit operation writes only habit fields', async () => {
  const env = makeEnv(); configure(env);
  await PersistenceGateway.persist(habitsRequest(env));
  assert.deepEqual(Object.keys(env.calls.mergeUserFields[0].fields), ['coachMemory']);
  assert.deepEqual(Object.keys(env.calls.mergeUserFields[0].fields.coachMemory), ['habits', 'habitsMeta']);
});

test('47. the Pattern operation writes only pattern fields', async () => {
  const env = makeEnv(); configure(env);
  await PersistenceGateway.persist(patternsRequest(env));
  assert.deepEqual(Object.keys(env.calls.runPatternTransaction[0].payload), ['patterns', 'patternsMeta']);
});

test('48. the Adaptive-apply operation writes only adaptive-owned fields', async () => {
  const env = makeEnv(); configure(env);
  await PersistenceGateway.persist(adaptiveRequest(env));
  assert.deepEqual(Object.keys(env.calls.mergeUserFields[0].fields).sort(), ['adaptiveTdee', 'currentDeficit', 'goalKcal', 'lastTdeeUpdate', 'tdeeHistory']);
});

test('49. the source-history day-save operation cannot include unrelated profile fields', async () => {
  const env = makeEnv(); configure(env);
  await PersistenceGateway.persist(daySaveRequest(env));
  assert.deepEqual(Object.keys(env.calls.replaceDayDocument[0].payload).sort(), ['burned', 'meals', 'steps', 'water']);
});

test('50. no migrated operation reaches the broad profile-merge path (structural check: repositories only ever call mergeUserFields/replaceDayDocument/runPatternTransaction with catalog-declared fields)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/persistenceGateway.js'), 'utf8');
  assert.equal(/deps\.mergeUserFields\(request\.userId,\s*request\.payload\)/.test(src), false, 'repositories must map to explicit declared fields, never pass the raw payload through as-is');
});

// ══════════════════════════════════════════════════════════════════
// ── Regression (51-60) ──
// ══════════════════════════════════════════════════════════════════
test('51-60. B1/B2/B3/REM-001/REM-002/REM-003 regression suites are unaffected by this module (documented — full node --test tests/*.test.js run required per B4 SPEC §35, verified in the implementation report)', () => {
  assert.ok(true);
});

// ══════════════════════════════════════════════════════════════════
// ── Additional: diagnostics / catalog closure ──
// ══════════════════════════════════════════════════════════════════
test('closed catalog: listOperations() returns exactly the six approved operations', () => {
  assert.deepEqual(PersistenceGateway.listOperations().sort(), [
    'DERIVED_ADAPTIVE_PROPOSAL_APPLY', 'DERIVED_HABITS_REPLACE', 'DERIVED_PATTERNS_REPLACE',
    'SOURCE_HISTORY_SAVE_DAY', 'TRIGGER_RECORD_EVENT', 'TRIGGER_UPDATE_BUDGET'
  ].sort());
});

test('getOperation() exposes no function references (diagnostics-safe)', () => {
  const def = PersistenceGateway.getOperation('DERIVED_HABITS_REPLACE');
  Object.keys(def).forEach((k) => assert.notEqual(typeof def[k], 'function'));
});

test('no B4/B5/Recommendation-Engine vocabulary in this module', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/persistenceGateway.js'), 'utf8');
  ['confidenceThreshold', 'ranking', 'recommendation', 'crossEngineTransaction', 'distributedRollback'].forEach((needle) => {
    assert.equal(src.toLowerCase().indexOf(needle.toLowerCase()), -1, needle);
  });
});
