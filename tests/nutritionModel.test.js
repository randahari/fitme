// C1-WP1 — js/domain/nutritionModel.js unit tests.
// Run with: node --test tests/nutritionModel.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NutritionModel = require('../js/domain/nutritionModel.js');

test('dayKcal sums the kcal field across all meals', () => {
  const dayData = { meals: [{ kcal: 300 }, { kcal: 450 }, { kcal: 0 }] };
  assert.equal(NutritionModel.dayKcal(dayData), 750);
});

test('dayKcal treats a missing kcal field as 0', () => {
  const dayData = { meals: [{ kcal: 100 }, {}] };
  assert.equal(NutritionModel.dayKcal(dayData), 100);
});

test('dayKcal returns 0 for no meals, missing meals array, or null dayData', () => {
  assert.equal(NutritionModel.dayKcal({ meals: [] }), 0);
  assert.equal(NutritionModel.dayKcal({}), 0);
  assert.equal(NutritionModel.dayKcal(null), 0);
});

test('normalizeItem fills in defaults and coerces numeric fields', () => {
  const result = NutritionModel.normalizeItem({ kcal: '250', protein: '20' });
  assert.equal(result.name, 'פריט');
  assert.equal(result.unit, '');
  assert.equal(result.kcal, 250);
  assert.equal(result.protein, 20);
  assert.equal(result.carbs, 0);
  assert.equal(result.fat, 0);
  assert.equal(result.fiber, 0);
  assert.equal(result.sugar, 0);
  assert.equal(result.sodium, 0);
  assert.equal(result.qty, 1);
});

test('normalizeItem preserves provided name, unit and qty', () => {
  const result = NutritionModel.normalizeItem({ name: 'עוף', amount: 100, unit: 'גרם', kcal: 165, qty: 2 });
  assert.equal(result.name, 'עוף');
  assert.equal(result.amount, 100);
  assert.equal(result.unit, 'גרם');
  assert.equal(result.qty, 2);
});
