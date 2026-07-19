// C1-WP2 — js/adapters/openFoodFactsClient.js unit tests.
// Run with: node --test tests/openFoodFactsClient.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const OpenFoodFactsClient = require('../js/adapters/openFoodFactsClient.js');

function jsonResponse(body, ok) {
  return { ok: ok !== false, json: async () => body };
}

test('lookupProduct maps a found product with a known serving size', async () => {
  let calledUrl = null;
  OpenFoodFactsClient.configure({
    fetchFn: async (url) => { calledUrl = url; return jsonResponse({
      status: 1, product: { product_name_he: 'שוקולד חלב', serving_size: '50 g', nutriments: {
        'energy-kcal_100g': 500, proteins_100g: 6, carbohydrates_100g: 55, fat_100g: 30, fiber_100g: 2, sugars_100g: 50, sodium_100g: 0.1
      } }
    }); }
  });
  const result = await OpenFoodFactsClient.lookupProduct('123456');
  assert.equal(calledUrl, 'https://world.openfoodfacts.org/api/v0/product/123456.json');
  assert.equal(result.found, true);
  assert.equal(result.servingSizeKnown, true);
  assert.equal(result.servingSizeRaw, '50 g');
  assert.equal(result.item.name, 'שוקולד חלב');
  assert.equal(result.item.amount, 50);
  assert.equal(result.item.unit, 'גרם');
  // factor = 50/100 = 0.5
  assert.equal(result.item.kcal, 250); // round(500*0.5)
  assert.equal(result.item.protein, 3); // round(6*0.5*10)/10
  assert.equal(result.item.sodium, 50); // round(0.1*0.5*1000)
});

test('lookupProduct defaults to 100g when serving_size is absent', async () => {
  OpenFoodFactsClient.configure({
    fetchFn: async () => jsonResponse({ status: 1, product: { product_name: 'Generic Bar', nutriments: { energy_100g: 200, proteins_100g: 10 } } })
  });
  const result = await OpenFoodFactsClient.lookupProduct('1');
  assert.equal(result.found, true);
  assert.equal(result.servingSizeKnown, false);
  assert.equal(result.item.amount, 100);
  assert.equal(result.item.name, 'Generic Bar');
  assert.equal(result.item.kcal, 200);
});

test('lookupProduct falls back to a fixed unknown-name label when no name field exists', async () => {
  OpenFoodFactsClient.configure({
    fetchFn: async () => jsonResponse({ status: 1, product: { nutriments: { energy_100g: 100 } } })
  });
  const result = await OpenFoodFactsClient.lookupProduct('1');
  assert.equal(result.item.name, 'מוצר לא ידוע');
});

test('lookupProduct returns found:false when status is not 1', async () => {
  OpenFoodFactsClient.configure({ fetchFn: async () => jsonResponse({ status: 0 }) });
  const result = await OpenFoodFactsClient.lookupProduct('1');
  assert.deepEqual(result, { found: false });
});

test('lookupProduct returns found:false when product is missing', async () => {
  OpenFoodFactsClient.configure({ fetchFn: async () => jsonResponse({ status: 1 }) });
  const result = await OpenFoodFactsClient.lookupProduct('1');
  assert.deepEqual(result, { found: false });
});

test('lookupProduct returns found:false when the product has a name but zero nutritional data', async () => {
  OpenFoodFactsClient.configure({
    fetchFn: async () => jsonResponse({ status: 1, product: { product_name: 'Water', nutriments: {} } })
  });
  const result = await OpenFoodFactsClient.lookupProduct('1');
  assert.deepEqual(result, { found: false });
});

test('lookupProduct throws a normalized NETWORK_ERROR when fetch itself rejects', async () => {
  OpenFoodFactsClient.configure({ fetchFn: async () => { throw new Error('offline'); } });
  await assert.rejects(() => OpenFoodFactsClient.lookupProduct('1'), (err) => {
    assert.equal(err.code, 'NETWORK_ERROR');
    return true;
  });
});

test('lookupProduct throws a normalized NETWORK_ERROR when response.json() rejects', async () => {
  OpenFoodFactsClient.configure({ fetchFn: async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }) });
  await assert.rejects(() => OpenFoodFactsClient.lookupProduct('1'), (err) => {
    assert.equal(err.code, 'NETWORK_ERROR');
    return true;
  });
});
