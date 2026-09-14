// Friends Alpha Item 7 (Minimal Error/Crash Telemetry) — js/repositories/errorLogRepository.js
// unit tests. A minimal fake Firestore db is injected via configure(), mirroring
// tests/dayRepository.test.js's own established fake-db convention exactly.
// Run with: node --test tests/errorLogRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ErrorLogRepository = require('../js/repositories/errorLogRepository.js');

function fakeDbForCreate() {
  const calls = [];
  return {
    calls,
    collection: (name) => {
      calls.push({ op: 'collection', name });
      return {
        doc: (id) => {
          calls.push({ op: 'doc', collection: name, id });
          return {
            collection: (sub) => {
              calls.push({ op: 'subcollection', name: sub });
              return {
                add: (payload) => { calls.push({ op: 'add', payload }); return Promise.resolve({ id: 'entry1' }); }
              };
            }
          };
        }
      };
    }
  };
}

test('create() writes to users/{uid}/errorLog with the payload plus a server timestamp, unmodified otherwise', async () => {
  const db = fakeDbForCreate();
  const st = () => 'SERVER_TS';
  ErrorLogRepository.configure({ db, serverTimestamp: st });
  const payload = { code: 'X', module: 'Y', operation: 'Z', message: 'm', appVersion: '2.47.0', retryable: false, clientTimestamp: 123 };
  await ErrorLogRepository.create('u1', payload);
  assert.deepEqual(db.calls.slice(0, 3), [
    { op: 'collection', name: 'users' },
    { op: 'doc', collection: 'users', id: 'u1' },
    { op: 'subcollection', name: 'errorLog' }
  ]);
  const addCall = db.calls.find((c) => c.op === 'add');
  assert.deepEqual(addCall.payload, Object.assign({}, payload, { createdAt: 'SERVER_TS' }));
});

test('create() never mutates the caller\'s own payload object', async () => {
  const db = fakeDbForCreate();
  ErrorLogRepository.configure({ db, serverTimestamp: () => 'TS' });
  const payload = { code: 'X', module: 'Y', operation: '', message: '', appVersion: '', retryable: false, clientTimestamp: 1 };
  const frozen = Object.freeze(Object.assign({}, payload));
  await ErrorLogRepository.create('u1', frozen);
  assert.deepEqual(frozen, payload); // unchanged — proves create() built a NEW object (Object.assign({}, ...))
});

test('deleteAllForUser() queries the subcollection and batch-deletes every returned document', async () => {
  const deletedRefs = [];
  const committedBatches = [];
  const docRefs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: () => Promise.resolve({ forEach: (cb) => docRefs.forEach((r) => cb({ ref: r })) })
        })
      })
    }),
    batch: () => {
      const thisBatchDeletes = [];
      committedBatches.push(thisBatchDeletes);
      return {
        delete: (ref) => { thisBatchDeletes.push(ref); deletedRefs.push(ref); },
        commit: () => Promise.resolve()
      };
    }
  };
  ErrorLogRepository.configure({ db });
  await ErrorLogRepository.deleteAllForUser('u1');
  assert.deepEqual(deletedRefs, docRefs);
  assert.equal(committedBatches.length, 1); // well under the 400-per-batch chunk size
});

test('deleteAllForUser() chunks deletes into multiple batches when the document count exceeds the batch size', async () => {
  const docRefs = [];
  for (let i = 0; i < 850; i++) docRefs.push({ id: 'doc' + i });
  const committedBatches = [];
  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: () => Promise.resolve({ forEach: (cb) => docRefs.forEach((r) => cb({ ref: r })) })
        })
      })
    }),
    batch: () => {
      const thisBatchDeletes = [];
      committedBatches.push(thisBatchDeletes);
      return { delete: (ref) => thisBatchDeletes.push(ref), commit: () => Promise.resolve() };
    }
  };
  ErrorLogRepository.configure({ db });
  await ErrorLogRepository.deleteAllForUser('u1');
  assert.equal(committedBatches.length, 3); // 850 documents / 400-per-batch -> 400 + 400 + 50
  assert.equal(committedBatches[0].length, 400);
  assert.equal(committedBatches[1].length, 400);
  assert.equal(committedBatches[2].length, 50);
});

test('deleteAllForUser() on an empty subcollection commits no batches', async () => {
  const committedBatches = [];
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ get: () => Promise.resolve({ forEach: () => {} }) }) }) }),
    batch: () => { committedBatches.push([]); return { delete: () => {}, commit: () => Promise.resolve() }; }
  };
  ErrorLogRepository.configure({ db });
  await ErrorLogRepository.deleteAllForUser('u1');
  assert.equal(committedBatches.length, 0);
});
