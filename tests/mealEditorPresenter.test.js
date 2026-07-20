// C1-WP5C — js/nutrition/mealEditorPresenter.js unit tests.
// DOM access and app.js callbacks are injected via configure() so every rendered string
// and every recovery-UI wiring path is testable without a browser.
// Run with: node --test tests/mealEditorPresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const MealEditorPresenter = require('../js/nutrition/mealEditorPresenter.js');

function fakeEl() {
  return { innerHTML: '', className: '', classList: { list: [], add(c) { this.list.push(c); }, remove(c) { this.list = this.list.filter((x) => x !== c); } }, onclick: null };
}

function fakeDeps(overrides) {
  const els = {};
  const calls = [];
  const deps = {
    getElementById: (id) => { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    mealRequiresNutritionValidation: () => true,
    nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'VALID' }) },
    showMealEditor: (meal) => { calls.push(['showMealEditor', meal]); },
    cancelFood: () => { calls.push(['cancelFood']); },
    clearPendingMeal: () => { calls.push(['clearPendingMeal']); },
    alertFn: (msg) => { calls.push(['alert', msg]); }
  };
  Object.assign(deps, overrides);
  return { deps, els, calls };
}

function item(overrides) {
  return Object.assign({ name: 'תפוח', amount: 150, unit: 'גרם', kcal: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 4, sugar: 16, sodium: 2, qty: 1 }, overrides);
}

test('fmtQty formats whole numbers without decimals and trims trailing zero from fractional values', () => {
  assert.equal(MealEditorPresenter.fmtQty(2), 2);
  assert.equal(MealEditorPresenter.fmtQty(1.5), '1.5');
  assert.equal(MealEditorPresenter.fmtQty(0.25), '0.25');
});

test('sourceBadge returns "" when there is no pendingMeal or no source', () => {
  assert.equal(MealEditorPresenter.sourceBadge(null), '');
  assert.equal(MealEditorPresenter.sourceBadge({}), '');
  assert.equal(MealEditorPresenter.sourceBadge({ source: 'plate' }), '', 'plate/label AI sources without a badge entry must return empty (matching the original map)');
});

test('sourceBadge renders the exact off/label/group markup, including the addedByName suffix for group', () => {
  assert.match(MealEditorPresenter.sourceBadge({ source: 'off' }), /מאגר עולמי \(Open Food Facts\)/);
  assert.match(MealEditorPresenter.sourceBadge({ source: 'label' }), /נקרא מהתווית ע&quot;י Claude/);
  const groupNoName = MealEditorPresenter.sourceBadge({ source: 'group' });
  assert.match(groupNoName, /מהמאגר של הקבוצה/);
  assert.doesNotMatch(groupNoName, /הוסף ע"י/);
  const groupWithName = MealEditorPresenter.sourceBadge({ source: 'group', addedByName: 'דנה' });
  assert.match(groupWithName, /מהמאגר של הקבוצה · הוסף ע&quot;י דנה/);
});

test('sourceBadge HTML-escapes the addedByName', () => {
  const badge = MealEditorPresenter.sourceBadge({ source: 'group', addedByName: '<script>' });
  assert.doesNotMatch(badge, /<script>/);
  assert.match(badge, /&lt;script&gt;/);
});

test('nutritionValidationBanner returns "" when there is no pendingMeal, no items, or the source is exempt', () => {
  const { deps } = fakeDeps({ mealRequiresNutritionValidation: () => false });
  MealEditorPresenter.configure(deps);
  assert.equal(MealEditorPresenter.nutritionValidationBanner(null), '');
  assert.equal(MealEditorPresenter.nutritionValidationBanner({ items: [] }), '');
  assert.equal(MealEditorPresenter.nutritionValidationBanner({ items: [item()] }), '', 'exempt source (off/group/manual) must suppress the banner entirely');
});

test('nutritionValidationBanner returns "" for VALID, and the correct message for REJECTED vs UNCERTAIN', () => {
  let status = 'VALID';
  const { deps } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: status }) } });
  MealEditorPresenter.configure(deps);
  const meal = { items: [item()], source: 'text' };
  assert.equal(MealEditorPresenter.nutritionValidationBanner(meal), '');
  status = 'REJECTED';
  assert.match(MealEditorPresenter.nutritionValidationBanner(meal), /אחד הערכים לא הגיוני/);
  status = 'UNCERTAIN';
  assert.match(MealEditorPresenter.nutritionValidationBanner(meal), /FITME לא בטוח לגמרי/);
});

test('nutritionValidationBanner passes pendingMeal.items and pendingMeal.source (default "text") to the injected validator', () => {
  const seen = {};
  const { deps } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: (items, src) => { seen.items = items; seen.src = src; return { overallStatus: 'VALID' }; } } });
  MealEditorPresenter.configure(deps);
  const items = [item()];
  MealEditorPresenter.nutritionValidationBanner({ items });
  assert.equal(seen.items, items);
  assert.equal(seen.src, 'text');
  MealEditorPresenter.nutritionValidationBanner({ items, source: 'photo' });
  assert.equal(seen.src, 'photo');
});

test('renderEditor looks up the box (matching the original\'s unconditional lookup) but writes nothing when pendingMeal is missing', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  MealEditorPresenter.renderEditor(null, null);
  assert.equal(els['food-result'].innerHTML, '', 'no content should be written when pendingMeal is null');
});

test('renderEditor writes nothing when the food-result box does not exist', () => {
  const { deps } = fakeDeps({ getElementById: () => null });
  MealEditorPresenter.configure(deps);
  assert.doesNotThrow(() => MealEditorPresenter.renderEditor({ name: 'ארוחה', items: [], suggestions: [] }, null));
});

test('renderEditor writes item rows with the exact original onclick bindings (editorDelete/editorEdit/editorQty), preserving binding compatibility', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  const pendingMeal = { name: 'ארוחה', note: '', source: null, items: [item({ name: 'תפוח' }), item({ name: 'בננה' })], suggestions: [] };
  MealEditorPresenter.renderEditor(pendingMeal, null);
  const html = els['food-result'].innerHTML;
  assert.match(html, /onclick="editorDelete\(0\)"/);
  assert.match(html, /onclick="editorEdit\(0\)"/);
  assert.match(html, /onclick="editorQty\(0,-1\)"/);
  assert.match(html, /onclick="editorQty\(0,1\)"/);
  assert.match(html, /onclick="editorDelete\(1\)"/);
  assert.match(html, /onclick="editorAddCustom\(\)"/);
  assert.match(html, /onclick="addMeal\(\)"/);
  assert.match(html, /onclick="addMealAndFavorite\(\)"/);
  assert.match(html, /onclick="cancelFood\(\)"/);
});

test('renderEditor renders the edit-mode form (with editorSaveEdit/editorCancelEdit bindings) when editingItemIdx matches', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  const pendingMeal = { name: 'ארוחה', items: [item()], suggestions: [] };
  MealEditorPresenter.renderEditor(pendingMeal, 0);
  const html = els['food-result'].innerHTML;
  assert.match(html, /id="edit-name"/);
  assert.match(html, /id="edit-kcal"/);
  assert.match(html, /onclick="editorSaveEdit\(0\)"/);
  assert.match(html, /onclick="editorCancelEdit\(\)"/);
  assert.doesNotMatch(html, /onclick="editorDelete\(0\)"/, 'the row being edited must not also render its normal delete/qty controls');
});

test('renderEditor renders suggestions with editorAddSuggestion bindings, and omits the suggestions block entirely when empty', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  const withSugg = { name: 'ארוחה', items: [], suggestions: [item({ name: 'לחם', kcal: 90 })] };
  MealEditorPresenter.renderEditor(withSugg, null);
  assert.match(els['food-result'].innerHTML, /onclick="editorAddSuggestion\(0\)"/);
  assert.match(els['food-result'].innerHTML, /לחם/);

  const noSugg = { name: 'ארוחה', items: [], suggestions: [] };
  MealEditorPresenter.renderEditor(noSugg, null);
  assert.doesNotMatch(els['food-result'].innerHTML, /ed-sugg-title/);
  assert.match(els['food-result'].innerHTML, /empty-state/, 'an item-less meal must show the empty-state placeholder');
});

test('renderEditor computes and rounds totals the same way as MealDraft.computeTotals (kcal/protein/carbs/fat/fiber/sugar/sodium)', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  const pendingMeal = { name: 'ארוחה', items: [item({ kcal: 100.6, protein: 10.4, qty: 2 })], suggestions: [] };
  MealEditorPresenter.renderEditor(pendingMeal, null);
  const html = els['food-result'].innerHTML;
  assert.match(html, /201/, 'kcal total must be rounded (100.6*2=201.2 -> 201)');
});

test('renderEditor includes the note block only when pendingMeal.note is present', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  MealEditorPresenter.renderEditor({ name: 'ארוחה', note: 'הערה חשובה', items: [], suggestions: [] }, null);
  assert.match(els['food-result'].innerHTML, /הערה חשובה/);
});

test('showAiRejectedRecovery clears pendingMeal, hides the questionnaire, and shows retry/manual/cancel actions', () => {
  const { deps, els, calls } = fakeDeps();
  MealEditorPresenter.configure(deps);
  MealEditorPresenter.showAiRejectedRecovery(() => {}, null, null);
  assert.deepEqual(calls[0], ['clearPendingMeal']);
  assert.ok(els['food-questionnaire'].classList.list.includes('hidden'));
  assert.ok(!els['food-result'].classList.list.includes('hidden'));
  assert.match(els['food-result'].innerHTML, /לא הצלחתי לוודא את הערכים/);
});

test('showAiRejectedRecovery retry button hides the box and calls retryFn', () => {
  const { deps, els } = fakeDeps();
  MealEditorPresenter.configure(deps);
  let retried = false;
  MealEditorPresenter.showAiRejectedRecovery(() => { retried = true; }, null, null);
  els['rem001-retry-btn'].onclick();
  assert.ok(els['food-result'].classList.list.includes('hidden'));
  assert.equal(retried, true);
});

test('showAiRejectedRecovery manual-button name fallback chain: originalMeal.name > fallbackName > "ארוחה"', () => {
  function clickManual(originalMeal, fallbackName) {
    const { deps, els, calls } = fakeDeps();
    MealEditorPresenter.configure(deps);
    MealEditorPresenter.showAiRejectedRecovery(() => {}, originalMeal, fallbackName);
    els['rem001-manual-btn'].onclick();
    return calls.find((c) => c[0] === 'showMealEditor')[1];
  }
  assert.equal(clickManual({ name: 'מנה מקורית' }, 'קלט משתמש').name, 'מנה מקורית');
  assert.equal(clickManual(null, 'קלט משתמש').name, 'קלט משתמש');
  assert.equal(clickManual(null, null).name, 'ארוחה');
  const manualMeal = clickManual(null, null);
  assert.deepEqual(manualMeal.items, []);
  assert.deepEqual(manualMeal.suggestions, []);
  assert.equal(manualMeal.source, 'manual');
});

test('showAiRejectedRecovery cancel button calls cancelFood', () => {
  const { deps, els, calls } = fakeDeps();
  MealEditorPresenter.configure(deps);
  MealEditorPresenter.showAiRejectedRecovery(() => {}, null, null);
  els['rem001-cancel-btn'].onclick();
  assert.ok(calls.some((c) => c[0] === 'cancelFood'));
});

test('showAiRejectedRecovery falls back to alertFn when the food-result box does not exist', () => {
  const { deps, calls } = fakeDeps({ getElementById: (id) => (id === 'food-result' ? null : fakeEl()) });
  MealEditorPresenter.configure(deps);
  MealEditorPresenter.showAiRejectedRecovery(() => {}, null, null);
  assert.ok(calls.some((c) => c[0] === 'alert' && /לא הצלחתי לוודא את הערכים התזונתיים/.test(c[1])));
});
