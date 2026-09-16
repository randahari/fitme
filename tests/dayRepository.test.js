// C1-WP3 — js/repositories/dayRepository.js unit tests.
// A minimal fake Firestore db is injected via configure() so path/payload
// shape and the 400-document sort/slice history logic are testable without
// a real SDK. Run with: node --test tests/dayRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const DayRepository = require('../js/repositories/dayRepository.js');

function fakeDb(dayDocFactory) {
  const calls = [];
  return {
    calls,
    collection: (name) => {
      calls.push({ op: 'collection', name });
      return {
        doc: (id) => {
          calls.push({ op: 'doc', collection: name, id });
          return {
            get: () => { calls.push({ op: 'get' }); return Promise.resolve(dayDocFactory ? dayDocFactory() : { exists: false }); },
            set: (payload) => { calls.push({ op: 'set', payload }); return Promise.resolve(); },
            collection: (sub) => {
              calls.push({ op: 'subcollection', name: sub });
              return {
                doc: (subId) => {
                  calls.push({ op: 'doc', collection: sub, id: subId });
                  return {
                    get: () => { calls.push({ op: 'get' }); return Promise.resolve(dayDocFactory ? dayDocFactory() : { exists: false }); },
                    set: (payload) => { calls.push({ op: 'set', payload }); return Promise.resolve(); }
                  };
                },
                get: () => { calls.push({ op: 'get-collection' }); return Promise.resolve({ forEach: () => {} }); }
              };
            }
          };
        }
      };
    }
  };
}

test('loadDay reads users/{uid}/days/{key}', async () => {
  const db = fakeDb(() => ({ exists: true, data: () => ({ meals: [], burned: 5 }) }));
  DayRepository.configure({ db });
  const doc = await DayRepository.loadDay('u1', '2026-07-19');
  assert.deepEqual(db.calls.slice(0, 4), [
    { op: 'collection', name: 'users' },
    { op: 'doc', collection: 'users', id: 'u1' },
    { op: 'subcollection', name: 'days' },
    { op: 'doc', collection: 'days', id: '2026-07-19' }
  ]);
  assert.equal(doc.exists, true);
});

test('saveLegacyDay writes users/{uid}/days/{key} with the exact payload shape and a server timestamp', async () => {
  const db = fakeDb();
  const st = () => 'TIMESTAMP';
  DayRepository.configure({ db, serverTimestamp: st });
  await DayRepository.saveLegacyDay('u1', '2026-07-19', { meals: [{ kcal: 100 }], burned: 10, steps: 20, water: 3 });
  const setCall = db.calls.find((c) => c.op === 'set');
  assert.deepEqual(setCall.payload, {
    meals: [{ kcal: 100 }], burned: 10, steps: 20, water: 3, updatedAt: 'TIMESTAMP'
  });
});

test('fetchHistory sorts documents chronologically by id and keeps only the last 400', async () => {
  const ids = [];
  for (let i = 1; i <= 405; i++) ids.push('2026-01-' + String(i).padStart(3, '0'));
  // shuffle deterministically (reverse) to prove sorting actually happens
  const shuffled = ids.slice().reverse();
  const docs = shuffled.map((id) => ({ id, data: () => ({ meals: [], id }) }));
  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: () => Promise.resolve({ forEach: (cb) => docs.forEach(cb) })
        })
      })
    })
  };
  DayRepository.configure({ db });
  const history = await DayRepository.fetchHistory('u1');
  const keys = Object.keys(history).sort();
  assert.equal(keys.length, 400);
  assert.equal(keys[0], ids[5]); // the 400 most recent chronologically, oldest 5 dropped
  assert.equal(keys[399], ids[404]);
});

test('fetchHistory returns {} and does not throw when the query rejects', async () => {
  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({ get: () => Promise.reject(new Error('offline')) })
      })
    })
  };
  DayRepository.configure({ db });
  const history = await DayRepository.fetchHistory('u1');
  assert.deepEqual(history, {});
});

// Friends Alpha Blocker B3 (Reset Integrity) — deleteAllForUser() mirrors
// tests/errorLogRepository.test.js's own established deleteAllForUser() batching-test shape.

test('deleteAllForUser() queries users/{uid}/days and batch-deletes every returned document', async () => {
  const deletedRefs = [];
  const committedBatches = [];
  const docRefs = [{ id: '2026-01-01' }, { id: '2026-01-02' }, { id: '2026-01-03' }];
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
  DayRepository.configure({ db });
  await DayRepository.deleteAllForUser('u1');
  assert.deepEqual(deletedRefs, docRefs);
  assert.equal(committedBatches.length, 1);
});

test('deleteAllForUser() chunks deletes into multiple batches when the document count exceeds the batch size', async () => {
  const docRefs = [];
  for (let i = 0; i < 850; i++) docRefs.push({ id: 'day' + i });
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
  DayRepository.configure({ db });
  await DayRepository.deleteAllForUser('u1');
  assert.equal(committedBatches.length, 3); // 850 / 400 => 400 + 400 + 50
  assert.equal(committedBatches[0].length, 400);
  assert.equal(committedBatches[1].length, 400);
  assert.equal(committedBatches[2].length, 50);
});
