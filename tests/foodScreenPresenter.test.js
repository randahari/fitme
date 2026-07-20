// C1-WP10 — js/ui/foodScreenPresenter.js unit tests.
// Covers: renderFoodMeals' empty-state and per-meal favourite-star toggling, renderFavoritesList's
// empty-state and per-favourite rendering, and switchFoodTab's active-tab/panel toggling — all
// via injected DOM/state closures, matching the original (non-overridden) app.js behaviour
// exactly.
// Run with: node --test tests/foodScreenPresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const FoodScreenPresenter = require('../js/ui/foodScreenPresenter.js');

function fakeElement(overrides) {
  return Object.assign({ innerHTML: '', classList: { active: false, hidden: false, add(cls) { if (cls === 'active') this.active = true; }, remove(cls) { if (cls === 'active') this.active = false; }, toggle(cls, on) { if (cls === 'hidden') this.hidden = on; } } }, overrides);
}

function fakeDocument() {
  const elements = {};
  ['food-meals-list', 'favorites-list', 'ftab-today', 'ftab-favorites', 'food-tab-today', 'food-tab-favorites'].forEach((id) => { elements[id] = fakeElement(); });
  const tabs = [elements['ftab-today'], elements['ftab-favorites']];
  return {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => (sel === '.food-tab' ? tabs : []),
    _elements: elements
  };
}

function fakeDeps(overrides) {
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    getTodayData: () => ({ meals: [] }),
    getFavoriteMeals: () => []
  };
  Object.assign(deps, overrides);
  return { deps, doc };
}

// ── renderFoodMeals ─────────────────────────────────────────────────────────────────────

test('renderFoodMeals shows the empty state when there are no meals today', () => {
  const { deps, doc } = fakeDeps();
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.renderFoodMeals();
  assert.match(doc._elements['food-meals-list'].innerHTML, /לא נרשמו ארוחות עדיין/);
});

test('renderFoodMeals renders a filled star for meals that are already favourites, and an empty star otherwise, by name match', () => {
  const { deps, doc } = fakeDeps({
    getTodayData: () => ({ meals: [{ name: 'עוף', time: '12:00', kcal: 400 }, { name: 'סלט', time: '13:00', kcal: 100 }] }),
    getFavoriteMeals: () => [{ name: 'עוף' }]
  });
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.renderFoodMeals();
  const html = doc._elements['food-meals-list'].innerHTML;
  const chickenIdx = html.indexOf('עוף');
  const saladIdx = html.indexOf('סלט');
  assert.ok(html.slice(chickenIdx, chickenIdx + 300).includes('⭐'));
  assert.ok(html.slice(saladIdx, saladIdx + 300).includes('☆'));
  assert.match(html, /toggleMealFavorite\(0, this\)/);
  assert.match(html, /deleteMeal\(1\)/);
});

// ── renderFavoritesList ─────────────────────────────────────────────────────────────────

test('renderFavoritesList shows the empty state when there are no favourites', () => {
  const { deps, doc } = fakeDeps();
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.renderFavoritesList();
  assert.match(doc._elements['favorites-list'].innerHTML, /אין עדיין מועדפים/);
});

test('renderFavoritesList is a no-op if the favorites-list element is missing', () => {
  const { deps } = fakeDeps({ documentRef: { getElementById: () => null } });
  FoodScreenPresenter.configure(deps);
  assert.doesNotThrow(() => FoodScreenPresenter.renderFavoritesList());
});

test('renderFavoritesList renders kcal + rounded protein per favourite, with add/remove buttons by index', () => {
  const { deps, doc } = fakeDeps({ getFavoriteMeals: () => [{ name: 'עוף', kcal: 400, protein: 35.6 }] });
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.renderFavoritesList();
  const html = doc._elements['favorites-list'].innerHTML;
  assert.match(html, /400 קל' · 36g חלבון/);
  assert.match(html, /addFavoriteToToday\(0\)/);
  assert.match(html, /removeFavorite\(0\)/);
});

// ── switchFoodTab ───────────────────────────────────────────────────────────────────────

test('switchFoodTab("favorites") activates ftab-favorites and shows only food-tab-favorites', () => {
  const { deps, doc } = fakeDeps();
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.switchFoodTab('favorites');
  assert.equal(doc._elements['ftab-today'].classList.active, false);
  assert.equal(doc._elements['ftab-favorites'].classList.active, true);
  assert.equal(doc._elements['food-tab-today'].classList.hidden, true);
  assert.equal(doc._elements['food-tab-favorites'].classList.hidden, false);
});

test('switchFoodTab("today") activates ftab-today and shows only food-tab-today', () => {
  const { deps, doc } = fakeDeps();
  FoodScreenPresenter.configure(deps);
  FoodScreenPresenter.switchFoodTab('today');
  assert.equal(doc._elements['ftab-today'].classList.active, true);
  assert.equal(doc._elements['food-tab-today'].classList.hidden, false);
  assert.equal(doc._elements['food-tab-favorites'].classList.hidden, true);
});
