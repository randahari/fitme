// C1-WP5B — js/nutrition/mealDraft.js unit tests.
// A pure, dependency-free module (no configure() — directly requires the already-approved
// pure modules NutritionModel and AuthorityContract, same pattern as
// js/domain/nutritionModel.js -> js/core/numberUtils.js).
// Run with: node --test tests/mealDraft.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const MealDraft = require('../js/nutrition/mealDraft.js');

function rawItem(overrides) {
  return Object.assign({ name: 'תפוח', amount: 150, unit: 'גרם', kcal: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 4, sugar: 16, sodium: 2 }, overrides);
}

test('buildDraft normalizes items/suggestions and preserves source/barcode/addedByName/name/note fields', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחת בוקר', note: 'הערה', source: 'label', barcode: '7290012345', addedByName: 'דנה', items: [rawItem()], suggestions: [rawItem({ name: 'לחם' })] });
  assert.equal(draft.name, 'ארוחת בוקר');
  assert.equal(draft.note, 'הערה');
  assert.equal(draft.source, 'label');
  assert.equal(draft.barcode, '7290012345');
  assert.equal(draft.addedByName, 'דנה');
  assert.equal(draft.items.length, 1);
  assert.equal(draft.items[0].qty, 1, 'normalizeItem defaults qty to 1');
  assert.equal(draft.suggestions[0].name, 'לחם');
});

test('buildDraft defaults name/source/barcode exactly like the original showMealEditor', () => {
  const draft = MealDraft.buildDraft({});
  assert.equal(draft.name, 'ארוחה');
  assert.equal(draft.note, '');
  assert.equal(draft.source, null);
  assert.equal(draft.barcode, null);
  assert.equal(draft.addedByName, '');
  assert.deepEqual(draft.items, []);
  assert.deepEqual(draft.suggestions, []);
});

test('computeTotals sums kcal/protein/carbs/fat/fiber/sugar/sodium weighted by qty, and returns zeros for an empty/missing array', () => {
  const items = [rawItem({ kcal: 100, protein: 10, qty: 2 }), rawItem({ kcal: 50, protein: 5, qty: 1 })];
  const t = MealDraft.computeTotals(items);
  assert.equal(t.kcal, 250);
  assert.equal(t.protein, 25);
  assert.deepEqual(MealDraft.computeTotals([]), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
  assert.deepEqual(MealDraft.computeTotals(undefined), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
});

test('changeQty steps by 0.25, floors at the step (never zero/negative), rounds to 2 decimals, mutates and returns the item', () => {
  const item = { qty: 1 };
  const returned = MealDraft.changeQty(item, 1);
  assert.equal(item.qty, 1.25, 'qty must be mutated in place');
  assert.equal(returned, item, 'must return the same mutated item');
  MealDraft.changeQty(item, -5); // would go well below zero without the floor
  assert.equal(item.qty, 0.25, 'qty must never drop below the 0.25 step');
});

test('changeQty produces the exact original floating point results for a decrease from 0.25', () => {
  const item = { qty: 0.25 };
  MealDraft.changeQty(item, -1);
  assert.equal(item.qty, 0.25);
});

test('applyEdit mutates all nine fields in place and returns the same item reference', () => {
  const item = rawItem();
  const fields = { name: 'עדשים', amount: 200, unit: 'גרם', kcal: 120, protein: 9, carbs: 20, fat: 0.4, fiber: 8, sugar: 2, sodium: 5 };
  const returned = MealDraft.applyEdit(item, fields);
  assert.equal(returned, item);
  Object.keys(fields).forEach((k) => assert.equal(item[k], fields[k]));
});

test('removeItem splices the given index out of the same array (in place) and returns it', () => {
  const items = [rawItem({ name: 'א' }), rawItem({ name: 'ב' }), rawItem({ name: 'ג' })];
  const returned = MealDraft.removeItem(items, 1);
  assert.equal(returned, items);
  assert.deepEqual(items.map((i) => i.name), ['א', 'ג']);
});

test('promoteSuggestion moves suggestions[i] into items with qty:1, removes it from suggestions, mutating both arrays in place', () => {
  const items = [rawItem({ name: 'קיים' })];
  const suggestions = [rawItem({ name: 'הצעה', qty: 5 })];
  const result = MealDraft.promoteSuggestion(items, suggestions, 0);
  assert.equal(result.items, items);
  assert.equal(result.suggestions, suggestions);
  assert.equal(items.length, 2);
  assert.equal(items[1].name, 'הצעה');
  assert.equal(items[1].qty, 1, 'promoted item must have qty forced to 1 regardless of its original qty');
  assert.equal(suggestions.length, 0);
});

test('promoteSuggestion is a no-op that returns the original references when the index is out of range', () => {
  const items = [];
  const suggestions = [];
  const result = MealDraft.promoteSuggestion(items, suggestions, 3);
  assert.equal(result.items, items);
  assert.equal(result.suggestions, suggestions);
});

test('buildAuthoritativeMeal rounds kcal/sodium to whole numbers and protein/carbs/fat/fiber/sugar to one decimal', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחה', items: [rawItem({ kcal: 100.6, protein: 10.34, carbs: 20.16, fat: 3.33, fiber: 2.28, sugar: 5.05, sodium: 199.6, qty: 1 })] });
  const meal = MealDraft.buildAuthoritativeMeal(draft, { authoritySource: 'USER_CONFIRMED_AI_ESTIMATE', createdByUid: 'u1', systemVersion: '9.9.9' });
  assert.equal(meal.kcal, 101);
  assert.equal(meal.protein, 10.3);
  assert.equal(meal.carbs, 20.2);
  assert.equal(meal.fat, 3.3);
  assert.equal(meal.fiber, 2.3);
  assert.equal(meal.sugar, 5.1);
  assert.equal(meal.sodium, 200);
});

test('buildAuthoritativeMeal formats time as H:MM (zero-padded minutes, unpadded hour) from the injected clock', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחה', items: [rawItem()] });
  const meal = MealDraft.buildAuthoritativeMeal(draft, {}, new Date(2026, 0, 1, 7, 5));
  assert.equal(meal.time, '7:05');
  const meal2 = MealDraft.buildAuthoritativeMeal(draft, {}, new Date(2026, 0, 1, 23, 45));
  assert.equal(meal2.time, '23:45');
});

test('buildAuthoritativeMeal defaults to the real clock when now is omitted', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחה', items: [rawItem()] });
  const before = new Date();
  const meal = MealDraft.buildAuthoritativeMeal(draft, {});
  const [h, m] = meal.time.split(':').map(Number);
  assert.equal(h, before.getHours());
  assert.ok(Math.abs(m - before.getMinutes()) <= 1);
});

test('buildAuthoritativeMeal copies items (does not share references with the draft) and preserves name/qty on each copy', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחה', items: [rawItem({ qty: 3 })] });
  const meal = MealDraft.buildAuthoritativeMeal(draft, {});
  assert.notEqual(meal.items[0], draft.items[0]);
  assert.equal(meal.items[0].qty, 3);
  assert.equal(meal.items[0].name, 'תפוח');
});

test('buildAuthoritativeMeal builds authority metadata via AuthorityContract with the exact injected source/createdBy/systemVersion and the fixed rule id', () => {
  const draft = MealDraft.buildDraft({ name: 'ארוחה', items: [rawItem()] });
  const AuthorityContract = require('../js/authorityContract.js');
  const meal = MealDraft.buildAuthoritativeMeal(draft, {
    authoritySource: AuthorityContract.AUTHORITY_SOURCES.USER_DECLARATION,
    createdByUid: 'uid-123',
    systemVersion: '3.1.4'
  });
  assert.equal(meal.authority.authoritySource, AuthorityContract.AUTHORITY_SOURCES.USER_DECLARATION);
  assert.equal(meal.authority.createdBy, 'uid-123');
  assert.equal(meal.authority.systemVersion, '3.1.4');
  assert.equal(meal.authority.rule, 'meal-editor.addMeal.v1');
  assert.equal(meal.authority.isAuthoritative, true);
});
