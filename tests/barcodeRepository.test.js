// C1-WP3 — js/repositories/barcodeRepository.js unit tests.
// Run with: node --test tests/barcodeRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const BarcodeRepository = require('../js/repositories/barcodeRepository.js');

function fakeDb(docResult) {
  const calls = [];
  return {
    calls,
    collection: (name) => ({
      doc: (id) => {
        calls.push({ collection: name, id });
        return {
          collection: (sub) => ({
            doc: (subId) => {
              calls.push({ collection: sub, id: subId });
              return {
                get: () => Promise.resolve(docResult || { exists: false }),
                set: (payload, options) => { calls.push({ op: 'set', payload, options }); return Promise.resolve(); }
              };
            }
          })
        };
      }
    })
  };
}

test('lookupInCache returns null immediately without touching Firestore when groupKey is falsy', async () => {
  const db = fakeDb();
  BarcodeRepository.configure({ db });
  const result = await BarcodeRepository.lookupInCache(null, '123');
  assert.equal(result, null);
  assert.deepEqual(db.calls, []);
});

test('lookupInCache reads groupBarcodes/{groupKey}/products/{code} and returns doc.data() when it exists', async () => {
  const db = fakeDb({ exists: true, data: () => ({ kcal: 100 }) });
  BarcodeRepository.configure({ db });
  const result = await BarcodeRepository.lookupInCache('G1', '123');
  assert.deepEqual(db.calls[0], { collection: 'groupBarcodes', id: 'G1' });
  assert.deepEqual(db.calls[1], { collection: 'products', id: '123' });
  assert.deepEqual(result, { kcal: 100 });
});

test('lookupInCache returns null and swallows the error when the read rejects', async () => {
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('offline')) }) }) }) })
  };
  BarcodeRepository.configure({ db });
  const result = await BarcodeRepository.lookupInCache('G1', '123');
  assert.equal(result, null);
});

test('saveToCache does not write when groupKey/code/item are missing', async () => {
  const db = fakeDb();
  BarcodeRepository.configure({ db });
  await BarcodeRepository.saveToCache(null, '123', { kcal: 100 }, 'Dana', 'Dana');
  await BarcodeRepository.saveToCache('G1', null, { kcal: 100 }, 'Dana', 'Dana');
  await BarcodeRepository.saveToCache('G1', '123', null, 'Dana', 'Dana');
  assert.equal(db.calls.filter((c) => c.op === 'set').length, 0);
});

test('saveToCache does not write when the item has no real nutrition values (hasData check)', async () => {
  const db = fakeDb();
  BarcodeRepository.configure({ db });
  await BarcodeRepository.saveToCache('G1', '123', { kcal: 0, protein: 0, carbs: 0, fat: 0 }, 'Dana', 'Dana');
  assert.equal(db.calls.filter((c) => c.op === 'set').length, 0);
});

test('saveToCache writes the exact payload shape with merge:true when data is present', async () => {
  const db = fakeDb();
  const st = () => 'TS';
  BarcodeRepository.configure({ db, serverTimestamp: st });
  const item = { name: 'Milk', amount: 200, unit: 'ml', kcal: 120, protein: 6, carbs: 10, fat: 4, fiber: 0, sugar: 8, sodium: 100 };
  await BarcodeRepository.saveToCache('G1', '123', item, 'Dana', 'Noa');
  const setCall = db.calls.find((c) => c.op === 'set');
  assert.deepEqual(setCall.payload, {
    barcode: '123',
    name: 'Milk', amount: 200, unit: 'ml',
    kcal: 120, protein: 6, carbs: 10, fat: 4,
    fiber: 0, sugar: 8, sodium: 100,
    addedByName: 'Dana',
    updatedByName: 'Noa',
    updatedAt: 'TS'
  });
  assert.deepEqual(setCall.options, { merge: true });
});

test('saveToCache swallows a write failure without throwing', async () => {
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ set: () => Promise.reject(new Error('quota')) }) }) }) })
  };
  BarcodeRepository.configure({ db, serverTimestamp: () => 'TS' });
  await assert.doesNotReject(() => BarcodeRepository.saveToCache('G1', '123', { kcal: 50 }, 'Dana', 'Dana'));
});
