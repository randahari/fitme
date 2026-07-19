// C1-WP3 — js/repositories/favoritesRepository.js unit tests.
// Run with: node --test tests/favoritesRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const FavoritesRepository = require('../js/repositories/favoritesRepository.js');

function fakeDb() {
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
                doc: (subId) => {
                  calls.push({ op: 'doc', collection: sub, id: subId });
                  return {
                    get: () => { calls.push({ op: 'get' }); return Promise.resolve({ exists: true, data: () => ({ meals: [{ name: 'apple' }] }) }); },
                    set: (payload) => { calls.push({ op: 'set', payload }); return Promise.resolve(); }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

test('load reads users/{uid}/data/favorites', async () => {
  const db = fakeDb();
  FavoritesRepository.configure({ db });
  const doc = await FavoritesRepository.load('u1');
  assert.deepEqual(db.calls, [
    { op: 'collection', name: 'users' },
    { op: 'doc', collection: 'users', id: 'u1' },
    { op: 'subcollection', name: 'data' },
    { op: 'doc', collection: 'data', id: 'favorites' },
    { op: 'get' }
  ]);
  assert.deepEqual(doc.data(), { meals: [{ name: 'apple' }] });
});

test('save writes users/{uid}/data/favorites with exactly { meals }', async () => {
  const db = fakeDb();
  FavoritesRepository.configure({ db });
  const meals = [{ name: 'banana' }];
  await FavoritesRepository.save('u1', meals);
  const setCall = db.calls.find((c) => c.op === 'set');
  assert.deepEqual(setCall.payload, { meals });
  assert.equal(Object.keys(setCall.payload).length, 1);
});
