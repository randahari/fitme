// C4 — Typed Memory Server Write Path tests.
// Dependency-free: Node's built-in test runner + assert only.
// Exercises the real functions/typedMemoryServerWrite.js module directly,
// configured with a mock persistence dependency (mirrors the approach already
// used for tests/persistenceGateway.test.js / tests/stateAccess.test.js).
// Run with: node --test tests/typedMemoryServerWrite.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const TypedMemoryServerWrite = require('../functions/typedMemoryServerWrite.js');

function makeEnv(overrides) {
  overrides = overrides || {};
  const store = new Map(); // key: `${uid}/${memoryId}` -> record
  let clock = overrides.startClock || 1000;
  const atomicWriteCalls = [];

  const deps = {
    now: () => clock,
    atomicWrite: async (uid, memoryId, applyFn) => {
      atomicWriteCalls.push({ uid, memoryId });
      if (overrides.atomicWriteFail) {
        throw overrides.atomicWriteFail;
      }
      const key = uid + '/' + memoryId;
      const existing = store.has(key) ? Object.assign({}, store.get(key)) : null;
      const outcome = applyFn(existing);
      if (outcome.op === 'create') {
        store.set(key, Object.assign({}, outcome.record));
      } else if (outcome.op === 'update') {
        const current = store.get(key) || {};
        store.set(key, Object.assign({}, current, outcome.fields));
      }
      return outcome;
    }
  };

  TypedMemoryServerWrite.configure(deps);

  return {
    store,
    atomicWriteCalls,
    tick: (ms) => { clock += ms; },
    get: (uid, memoryId) => store.get(uid + '/' + memoryId)
  };
}

function baseRequest(overrides) {
  return Object.assign({
    uid: 'user-1',
    idempotencyKey: 'key-1',
    type: 'fact',
    source: 'inferred_event',
    payload: { text: 'hello' }
  }, overrides || {});
}

// ══════════════════════════════════════════════════════════════════
// §18.1 — Validation
// ══════════════════════════════════════════════════════════════════

test('§18.1 rejects a request missing uid', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ uid: undefined }));
  assert.equal(r.status, 'REJECTED');
  assert.equal(r.memoryId, null);
});

test('§18.1 rejects a request with an empty-string uid', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ uid: '' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a request with a missing type', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ type: undefined }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a request with an invalid type', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ type: 'not_a_real_type' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a request with a missing payload', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ payload: undefined }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a non-object payload (array)', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ payload: ['not', 'an', 'object'] }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a non-object payload (string)', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ payload: 'a string' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a non-object payload (null)', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ payload: null }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a negative confidence', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ confidence: -0.1 }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a confidence greater than 1', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ confidence: 1.1 }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a non-numeric confidence', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ confidence: 'high' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.1 rejects a request missing idempotencyKey', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ idempotencyKey: undefined }));
  assert.equal(r.status, 'REJECTED');
});

// ══════════════════════════════════════════════════════════════════
// §18.2 — Source enforcement / unauthorized source attempts
// ══════════════════════════════════════════════════════════════════

test('§18.2 accepts a valid write for source=inferred_event', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_event' }));
  assert.equal(r.status, 'SUCCESS_CREATED');
});

test('§18.2 accepts a valid write for source=inferred_pattern', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_pattern' }));
  assert.equal(r.status, 'SUCCESS_CREATED');
});

test('§18.2 accepts a valid write for source=coach_generated', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'coach_generated' }));
  assert.equal(r.status, 'SUCCESS_CREATED');
});

test('§18.2 rejects source=user_stated (client-owned)', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'user_stated' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.2 rejects source=migrated (client-owned)', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'migrated' }));
  assert.equal(r.status, 'REJECTED');
});

test('§18.2 rejects an arbitrary/unknown source string', async () => {
  makeEnv();
  const r = await TypedMemoryServerWrite.write(baseRequest({ source: 'totally_made_up' }));
  assert.equal(r.status, 'REJECTED');
});

// ══════════════════════════════════════════════════════════════════
// §18.3 — Idempotency
// ══════════════════════════════════════════════════════════════════

test('§18.3 two invocations with identical (uid, source, idempotencyKey) result in exactly one record', async () => {
  const env = makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest());
  const r2 = await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(r1.memoryId, r2.memoryId);
  assert.equal(env.store.size, 1);
});

test('§18.3 two invocations differing only in idempotencyKey result in two distinct records', async () => {
  const env = makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest({ idempotencyKey: 'key-a' }));
  const r2 = await TypedMemoryServerWrite.write(baseRequest({ idempotencyKey: 'key-b' }));
  assert.notEqual(r1.memoryId, r2.memoryId);
  assert.equal(env.store.size, 2);
});

// ══════════════════════════════════════════════════════════════════
// §18.4 — Deterministic identity
// ══════════════════════════════════════════════════════════════════

test('§18.4 the same (source, idempotencyKey) always resolves to the same memoryId', async () => {
  makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest());
  makeEnv(); // fresh env/store — memoryId derivation must not depend on prior calls or store state
  const r2 = await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(r1.memoryId, r2.memoryId);
});

test('§18.4 a different source resolves to a different memoryId (same idempotencyKey)', async () => {
  makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_event' }));
  const r2 = await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_pattern' }));
  assert.notEqual(r1.memoryId, r2.memoryId);
});

test('§18.4 a different idempotencyKey resolves to a different memoryId (same source)', async () => {
  makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest({ idempotencyKey: 'key-a' }));
  const r2 = await TypedMemoryServerWrite.write(baseRequest({ idempotencyKey: 'key-b' }));
  assert.notEqual(r1.memoryId, r2.memoryId);
});

test('§18.4 different uid values with the same (source, idempotencyKey) do not collide in storage', async () => {
  const env = makeEnv();
  const r1 = await TypedMemoryServerWrite.write(baseRequest({ uid: 'user-A' }));
  const r2 = await TypedMemoryServerWrite.write(baseRequest({ uid: 'user-B' }));
  assert.equal(r1.memoryId, r2.memoryId); // memoryId itself may coincide...
  assert.equal(env.store.size, 2);        // ...but users/{uid}/memories path-scoping keeps them distinct records
});

// ══════════════════════════════════════════════════════════════════
// §18.5 — Timestamps
// ══════════════════════════════════════════════════════════════════

test('§18.5 created_at is set on first creation and unchanged by a later update', async () => {
  const env = makeEnv({ startClock: 1000 });
  await TypedMemoryServerWrite.write(baseRequest());
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  const created = env.get('user-1', 'srv_' + memoryId);
  assert.equal(created.created_at, 1000);

  env.tick(500);
  await TypedMemoryServerWrite.write(baseRequest({ payload: { text: 'updated' } }));
  const updated = env.get('user-1', 'srv_' + memoryId);
  assert.equal(updated.created_at, 1000, 'created_at must not change on update');
  assert.equal(updated.updated_at, 1500, 'updated_at must advance on update');
});

test('§18.5 updated_at changes on every accepted write, create or update', async () => {
  const env = makeEnv({ startClock: 2000 });
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(env.get('user-1', 'srv_' + memoryId).updated_at, 2000);

  env.tick(10);
  await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(env.get('user-1', 'srv_' + memoryId).updated_at, 2010);
});

test('§18.5 a caller-supplied created_at/updated_at in the request has no effect on the persisted value', async () => {
  const env = makeEnv({ startClock: 5000 });
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ created_at: 1, updated_at: 2 }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.created_at, 5000);
  assert.equal(rec.updated_at, 5000);
});

// ══════════════════════════════════════════════════════════════════
// §18.6 — Create vs. update behavior
// ══════════════════════════════════════════════════════════════════

test('§18.6 a new record is created with status:candidate regardless of any status value present in the request', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('coach_generated::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ source: 'coach_generated', status: 'active' }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.status, 'candidate');
});

test('§18.6 a second write does not alter an existing status:active record (simulating prior user confirmation)', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('inferred_pattern::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_pattern' }));
  // Simulate the existing js/memory.js transparency UI having confirmed this record.
  env.store.set('user-1/srv_' + memoryId, Object.assign({}, env.get('user-1', 'srv_' + memoryId), { status: 'active' }));

  await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_pattern', status: 'candidate' }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.status, 'active', 'status must remain untouched by an update');
});

test('§18.6 a second write does not alter an existing status:rejected record', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest());
  env.store.set('user-1/srv_' + memoryId, Object.assign({}, env.get('user-1', 'srv_' + memoryId), { status: 'rejected' }));

  await TypedMemoryServerWrite.write(baseRequest({ payload: { text: 'new payload' } }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.status, 'rejected');
});

test('§18.6 a second write with a different source targets a different record and never alters the original', async () => {
  const env = makeEnv();
  const eventId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  const patternId = require('crypto').createHash('sha256').update('inferred_pattern::key-1').digest('hex');

  await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_event' }));
  await TypedMemoryServerWrite.write(baseRequest({ source: 'inferred_pattern' }));

  assert.equal(env.get('user-1', 'srv_' + eventId).source, 'inferred_event');
  assert.equal(env.get('user-1', 'srv_' + patternId).source, 'inferred_pattern');
  assert.equal(env.store.size, 2, 'two distinct records must exist, the original must be untouched');
});

test('§18.6 a second write does not alter an existing record\'s type', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ type: 'fact' }));
  await TypedMemoryServerWrite.write(baseRequest({ type: 'preference' }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.type, 'fact', 'type must remain untouched by an update');
});

test('§18.6 an update changes only payload/confidence/updated_at, leaving source/status/type/created_at untouched', async () => {
  const env = makeEnv({ startClock: 100 });
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ confidence: 0.4 }));
  env.tick(50);
  const r2 = await TypedMemoryServerWrite.write(baseRequest({ payload: { text: 'changed' }, confidence: 0.9 }));

  assert.equal(r2.status, 'SUCCESS_UPDATED');
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.deepEqual(rec.payload, { text: 'changed' });
  assert.equal(rec.confidence, 0.9);
  assert.equal(rec.updated_at, 150);
  assert.equal(rec.created_at, 100);
  assert.equal(rec.source, 'inferred_event');
  assert.equal(rec.status, 'candidate');
  assert.equal(rec.type, 'fact');
});

test('§18.6 create branch sets last_confirmed_at to null and defaults confidence to 0.5 when omitted', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ confidence: undefined }));
  const rec = env.get('user-1', 'srv_' + memoryId);
  assert.equal(rec.last_confirmed_at, null);
  assert.equal(rec.confidence, 0.5);
});

// ══════════════════════════════════════════════════════════════════
// §18.7 — Failure handling
// ══════════════════════════════════════════════════════════════════

test('§18.7 a persistence-layer error on first write surfaces as FAILED and leaves no record behind', async () => {
  const env = makeEnv({ atomicWriteFail: new Error('simulated transient failure') });
  const r = await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(r.status, 'FAILED');
  assert.equal(env.store.size, 0);
});

test('§18.7 a persistence-layer error on an update leaves the pre-existing record unmodified', async () => {
  const env = makeEnv();
  const memoryId = require('crypto').createHash('sha256').update('inferred_event::key-1').digest('hex');
  await TypedMemoryServerWrite.write(baseRequest({ payload: { text: 'original' } }));

  const failing = makeEnv({ atomicWriteFail: new Error('simulated failure') });
  // Reuse the same underlying store by seeding the failing env's store with the prior state.
  failing.store.set('user-1/srv_' + memoryId, env.get('user-1', 'srv_' + memoryId));

  const r = await TypedMemoryServerWrite.write(baseRequest({ payload: { text: 'attempted overwrite' } }));
  assert.equal(r.status, 'FAILED');
  assert.deepEqual(failing.get('user-1', 'srv_' + memoryId).payload, { text: 'original' });
});

test('§18.7 REJECTED (validation) never invokes the persistence dependency at all', async () => {
  const env = makeEnv();
  await TypedMemoryServerWrite.write(baseRequest({ payload: null }));
  assert.equal(env.atomicWriteCalls.length, 0);
});

test('§18.7 write() fails closed when no dependency has been configured', async () => {
  // Reconfigure with an object lacking atomicWrite entirely.
  TypedMemoryServerWrite.configure({});
  const r = await TypedMemoryServerWrite.write(baseRequest());
  assert.equal(r.status, 'FAILED');
  makeEnv(); // restore a working configuration for any subsequent test in this process
});
