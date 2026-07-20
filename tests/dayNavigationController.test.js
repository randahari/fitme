// C1-WP10 — js/ui/dayNavigationController.js unit tests.
// Covers the full extracted Day Navigation IIFE surface: date-nav bar creation/update
// (applyHomeChrome), day switching (dayNavPrev/dayNavNext/dayNavToday and their MAX_PAST_DAYS/
// no-future guards), home/food meal edit-for-past-days (deleteHomeMeal/editHomeMeal/
// saveEditedMeal/deleteEditedMeal/cancelEditedMeal), the food-date banner, and the four
// consolidated override chains (showMealEditor/renderEditor/addMeal/loadUserData) — via
// injected DOM/state closures. MealDraft is used for real (pure, WP5B, already covered by
// tests/mealDraft.test.js); MealEditorPresenter/MealCommitService are the real shared
// require-cache singletons (same pattern as tests/coachPresenter.test.js using the real
// CoachPromptComposer) — MealEditorPresenter is configured with a DOM no-op so its own
// rendering internals (covered by tests/mealEditorPresenter.test.js) don't need to be
// re-verified here; MealCommitService.commitMeal is stubbed directly on the shared singleton
// to isolate DayNavigationController's own routing logic from MealCommitService's own
// (separately-tested) persistence behaviour.
// Run with: node --test tests/dayNavigationController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const DayNavigationController = require('../js/ui/dayNavigationController.js');
const MealEditorPresenter = require('../js/nutrition/mealEditorPresenter.js');
const MealCommitService = require('../js/nutrition/mealCommitService.js');

MealEditorPresenter.configure({ getElementById: () => null }); // renderEditor becomes a safe no-op

function fakeElement(overrides) {
  return Object.assign({
    style: {}, innerHTML: '', textContent: '', disabled: false,
    classList: {
      hidden: false,
      add(cls) { if (cls === 'hidden') this.hidden = true; },
      remove(cls) { if (cls === 'hidden') this.hidden = false; },
      toggle(cls, cond) { if (cls === 'hidden') this.hidden = cond; }
    }
  }, overrides);
}

function fakeDocument(overrides) {
  const elements = { 'food-result': fakeElement() };
  const doc = {
    getElementById: (id) => elements[id] || null,
    querySelector: () => null,
    createElement: () => fakeElement(),
    _elements: elements
  };
  Object.assign(doc, overrides);
  return doc;
}

function fakeState(overrides) {
  const state = Object.assign({
    currentDayKey: '2026-07-20',
    todayData: { meals: [], burned: 0, steps: 0 },
    waterCount: 0,
    realTodayData: { meals: [], burned: 0, steps: 0 },
    realWaterCount: 0,
    editingExisting: null,
    editingItemIdx: null,
    pendingMeal: null,
    currentUser: { uid: 'u1' }
  }, overrides);
  return state;
}

function fakeDeps(stateOverrides, depOverrides) {
  const calls = [];
  const state = fakeState(stateOverrides);
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    alertFn: (msg) => calls.push(['alert', msg]),
    confirmFn: () => true,
    sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true },
    appVersion: '2.39.0',
    dayRepository: { loadDay: async () => ({ exists: false }) },
    getCurrentUser: () => state.currentUser,
    getCurrentDayKey: () => state.currentDayKey,
    setCurrentDayKey: (v) => { state.currentDayKey = v; },
    getTodayData: () => state.todayData,
    setTodayData: (v) => { state.todayData = v; },
    getWaterCount: () => state.waterCount,
    setWaterCount: (v) => { state.waterCount = v; },
    getRealTodayData: () => state.realTodayData,
    setRealTodayData: (v) => { state.realTodayData = v; },
    getRealWaterCount: () => state.realWaterCount,
    setRealWaterCount: (v) => { state.realWaterCount = v; },
    getEditingExisting: () => state.editingExisting,
    setEditingExisting: (v) => { state.editingExisting = v; },
    getEditingItemIdx: () => state.editingItemIdx,
    setEditingItemIdx: (v) => { state.editingItemIdx = v; },
    getPendingMeal: () => state.pendingMeal,
    setPendingMeal: (v) => { state.pendingMeal = v; },
    saveTodayData: async () => calls.push('saveTodayData'),
    updateStreak: async () => calls.push('updateStreak'),
    renderHome: () => calls.push('renderHome'),
    renderFoodMeals: () => calls.push('renderFoodMeals'),
    goToScreen: (name) => calls.push(['goToScreen', name]),
    authoritySourceForMeal: () => 'USER_CONFIRMED_AI_ESTIMATE',
    buildMealFromEditor: () => ({ name: 'built-meal', items: [] }),
    loadUserDataCore: async () => calls.push('loadUserDataCore')
  };
  Object.assign(deps, depOverrides);
  return { deps, calls, state, doc };
}

// ── applyHomeChrome / date-nav bar ──────────────────────────────────────────────────────

test('applyHomeChrome creates the date-nav bar under #screen-home .scroll-content on first call, and is idempotent on later calls', () => {
  const scroll = { firstChild: null, insertBefore(el) { this.firstChild = el; } };
  const screenHome = {};
  const { deps, doc } = fakeDeps();
  doc.querySelector = (sel) => (sel === '#screen-home .scroll-content' ? scroll : null);
  let dateNavCreated = null;
  doc.createElement = () => { dateNavCreated = fakeElement(); return dateNavCreated; };
  DayNavigationController.configure(deps);
  DayNavigationController.applyHomeChrome();
  assert.equal(scroll.firstChild, dateNavCreated);
  assert.match(dateNavCreated.innerHTML, /dayNavPrev\(\)/);
  assert.match(dateNavCreated.innerHTML, /dayNavNext\(\)/);
  assert.match(dateNavCreated.innerHTML, /dayNavToday\(\)/);

  // second call: date-nav already "exists" (register it under its id so getElementById finds it)
  doc._elements['date-nav'] = dateNavCreated;
  let created2 = false;
  doc.createElement = () => { created2 = true; return fakeElement(); };
  DayNavigationController.applyHomeChrome();
  assert.equal(created2, false, 'must not recreate the date-nav bar once it exists');
});

test('applyHomeChrome shows "today" label and hides the "back to today" link when viewing today', () => {
  const label = fakeElement();
  const back = fakeElement();
  const { deps, doc } = fakeDeps({ currentDayKey: '2026-07-20' });
  doc._elements['date-nav'] = fakeElement();
  doc._elements['date-nav-label'] = label;
  doc._elements['date-nav-back'] = back;
  // getTodayKey() inside the module uses DateUtils.getTodayKey() (real clock) — to keep this
  // deterministic we instead assert the "viewing today" branch via a currentDayKey equal to
  // DateUtils.getTodayKey() at test-run time.
  const DateUtils = require('../js/core/dateUtils.js');
  deps.getCurrentDayKey = () => DateUtils.getTodayKey();
  DayNavigationController.configure(deps);
  DayNavigationController.applyHomeChrome();
  assert.equal(label.textContent, 'היום');
  assert.equal(back.style.display, 'none');
});

test('applyHomeChrome hides week/body-metrics sections and coach/trigger/adaptive cards when viewing a past day', () => {
  const week = fakeElement();
  const metrics = fakeElement();
  const trigger = fakeElement();
  const mealsTitle = fakeElement();
  const { deps, doc } = fakeDeps({ currentDayKey: '2020-01-01' });
  ['date-nav', 'date-nav-label', 'date-nav-back', 'date-prev', 'date-next'].forEach((id) => { doc._elements[id] = fakeElement(); });
  doc._elements['week-header'] = fakeElement();
  doc._elements['week-chart'] = week;
  doc._elements['body-metrics-section'] = metrics;
  doc._elements['trigger-card'] = trigger;
  doc._elements['meals-title'] = mealsTitle;
  DayNavigationController.configure(deps);
  DayNavigationController.applyHomeChrome();
  assert.equal(week.classList.hidden, true);
  assert.equal(metrics.classList.hidden, true);
  assert.equal(trigger.classList.hidden, true);
  assert.match(mealsTitle.textContent, /^ארוחות · /);
});

// ── dayNavPrev / dayNavNext / dayNavToday + guards ──────────────────────────────────────

test('dayNavToday restores realTodayData/realWaterCount and resets currentDayKey to today, then re-renders home', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const today = DateUtils.getTodayKey();
  const { deps, state, calls } = fakeDeps({
    currentDayKey: '2020-01-01', todayData: { meals: [{ name: 'old' }], burned: 0, steps: 0 }, waterCount: 0,
    realTodayData: { meals: [{ name: 'real' }], burned: 5, steps: 10 }, realWaterCount: 3
  });
  DayNavigationController.configure(deps);
  await DayNavigationController.dayNavToday();
  assert.equal(state.currentDayKey, today);
  assert.deepEqual(state.todayData, { meals: [{ name: 'real' }], burned: 5, steps: 10 });
  assert.equal(state.waterCount, 3);
  assert.ok(calls.includes('renderHome'));
});

test('dayNavToday is a no-op (does not touch state) when already viewing today', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const today = DateUtils.getTodayKey();
  const { deps, calls } = fakeDeps({ currentDayKey: today });
  DayNavigationController.configure(deps);
  await DayNavigationController.dayNavToday();
  assert.deepEqual(calls, []);
});

test('dayNavPrev loads the previous day via DayRepository when moving away from today, saving off the real-today snapshot first', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const today = DateUtils.getTodayKey();
  const loadDayCalls = [];
  const { deps, state } = fakeDeps(
    { currentDayKey: today, todayData: { meals: [{ name: 'today-meal' }], burned: 1, steps: 2 }, waterCount: 4 },
    { dayRepository: { loadDay: async (uid, key) => { loadDayCalls.push([uid, key]); return { exists: false }; } } }
  );
  DayNavigationController.configure(deps);
  await DayNavigationController.dayNavPrev();
  assert.equal(loadDayCalls.length, 1);
  assert.equal(loadDayCalls[0][0], 'u1');
  // real-today snapshot preserved before switching away
  assert.deepEqual(state.realTodayData, { meals: [{ name: 'today-meal' }], burned: 1, steps: 2 });
  assert.equal(state.realWaterCount, 4);
  assert.deepEqual(state.todayData, { meals: [], burned: 0, steps: 0 }); // doc.exists=false → empty day
});

test('dayNavPrev refuses to go further back than MAX_PAST_DAYS (7 days)', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const eightDaysAgo = DateUtils.dateKey(new Date(Date.now() - 8 * 86400000));
  const loadDayCalls = [];
  const { deps, state } = fakeDeps(
    { currentDayKey: eightDaysAgo },
    { dayRepository: { loadDay: async (uid, key) => { loadDayCalls.push(key); return { exists: false }; } } }
  );
  DayNavigationController.configure(deps);
  await DayNavigationController.dayNavPrev();
  assert.equal(loadDayCalls.length, 0, 'must not load a day beyond the MAX_PAST_DAYS limit');
  assert.equal(state.currentDayKey, eightDaysAgo, 'currentDayKey must not change');
});

test('dayNavNext clamps to today when the computed key would be in the future', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const today = DateUtils.getTodayKey();
  const { deps, state } = fakeDeps({ currentDayKey: today });
  DayNavigationController.configure(deps);
  await DayNavigationController.dayNavNext();
  assert.equal(state.currentDayKey, today, 'clamped to today, not a future date');
});

// ── deleteHomeMeal ──────────────────────────────────────────────────────────────────────

test('deleteHomeMeal removes the meal at idx, persists, updates streak, and re-renders home + food meals', async () => {
  const { deps, state, calls } = fakeDeps({ todayData: { meals: [{ name: 'a' }, { name: 'b' }], burned: 0, steps: 0 } });
  DayNavigationController.configure(deps);
  await DayNavigationController.deleteHomeMeal(0);
  assert.deepEqual(state.todayData.meals, [{ name: 'b' }]);
  assert.ok(calls.includes('saveTodayData'));
  assert.ok(calls.includes('updateStreak'));
  assert.ok(calls.includes('renderHome'));
  assert.ok(calls.includes('renderFoodMeals'));
});

test('deleteHomeMeal does nothing if the user cancels the confirm dialog', async () => {
  const { deps, state, calls } = fakeDeps({ todayData: { meals: [{ name: 'a' }], burned: 0, steps: 0 } }, { confirmFn: () => false });
  DayNavigationController.configure(deps);
  await DayNavigationController.deleteHomeMeal(0);
  assert.equal(state.todayData.meals.length, 1);
  assert.deepEqual(calls, []);
});

test('deleteHomeMeal is a no-op for an out-of-range index', async () => {
  const { deps, calls } = fakeDeps({ todayData: { meals: [], burned: 0, steps: 0 } });
  DayNavigationController.configure(deps);
  await DayNavigationController.deleteHomeMeal(5);
  assert.deepEqual(calls, []);
});

// ── showMealEditor / editHomeMeal ───────────────────────────────────────────────────────

test('showMealEditor resets editingExisting and editingItemIdx, builds a fresh pendingMeal draft via MealDraft, and reveals #food-result', () => {
  const foodResult = fakeElement();
  const { deps, state, doc } = fakeDeps({ editingExisting: { idx: 0, time: '12:00' }, editingItemIdx: 2 });
  doc._elements['food-result'] = foodResult;
  DayNavigationController.configure(deps);
  DayNavigationController.showMealEditor({ name: 'עוף', items: [{ name: 'חזה', amount: 100, unit: 'גרם', kcal: 200 }] });
  assert.equal(state.editingExisting, null);
  assert.equal(state.editingItemIdx, null);
  assert.equal(state.pendingMeal.name, 'עוף');
  assert.equal(state.pendingMeal.items.length, 1);
  assert.equal(foodResult.classList.hidden, false);
});

test('editHomeMeal navigates to the food screen, opens the meal editor with the existing meal\'s items, then re-enters edit-mode with the original time preserved', () => {
  const { deps, state, calls } = fakeDeps({ todayData: { meals: [{ name: 'עוף', time: '08:30', kcal: 250, items: [{ name: 'חזה עוף', amount: 150 }] }], burned: 0, steps: 0 } });
  DayNavigationController.configure(deps);
  DayNavigationController.editHomeMeal(0);
  assert.deepEqual(calls[0], ['goToScreen', 'food']);
  assert.equal(state.pendingMeal.name, 'עוף');
  assert.deepEqual(state.editingExisting, { idx: 0, time: '08:30' });
});

test('editHomeMeal synthesizes a single item from meal.kcal/protein/etc. when the meal has no items array (legacy shape)', () => {
  const { deps, state } = fakeDeps({ todayData: { meals: [{ name: 'לחם', time: '09:00', kcal: 120, protein: 4 }], burned: 0, steps: 0 } });
  DayNavigationController.configure(deps);
  DayNavigationController.editHomeMeal(0);
  assert.equal(state.pendingMeal.items.length, 1);
  assert.equal(state.pendingMeal.items[0].kcal, 120);
});

test('editHomeMeal is a no-op for a missing meal', () => {
  const { deps, calls } = fakeDeps({ todayData: { meals: [], burned: 0, steps: 0 } });
  DayNavigationController.configure(deps);
  DayNavigationController.editHomeMeal(0);
  assert.deepEqual(calls, []);
});

// ── saveEditedMeal / deleteEditedMeal / cancelEditedMeal ────────────────────────────────

test('saveEditedMeal replaces the meal at editingExisting.idx with the built meal, preserves the original time, persists, and returns home', async () => {
  const foodResult = fakeElement();
  const { deps, state, calls, doc } = fakeDeps({
    pendingMeal: { items: [{ name: 'x' }] },
    editingExisting: { idx: 1, time: '07:00' },
    todayData: { meals: [{ name: 'a' }, { name: 'old' }], burned: 0, steps: 0 }
  });
  doc._elements['food-result'] = foodResult;
  DayNavigationController.configure(deps);
  await DayNavigationController.saveEditedMeal();
  assert.equal(state.todayData.meals[1].name, 'built-meal');
  assert.equal(state.todayData.meals[1].time, '07:00');
  assert.equal(state.editingExisting, null);
  assert.equal(state.pendingMeal, null);
  assert.equal(foodResult.classList.hidden, true);
  assert.ok(calls.includes('saveTodayData'));
  assert.ok(calls.includes('updateStreak'));
  assert.deepEqual(calls[calls.length - 1], ['goToScreen', 'home']);
});

test('saveEditedMeal alerts and does nothing when pendingMeal has no items', async () => {
  const { deps, calls } = fakeDeps({ pendingMeal: { items: [] }, editingExisting: { idx: 0, time: '' } });
  DayNavigationController.configure(deps);
  await DayNavigationController.saveEditedMeal();
  assert.deepEqual(calls, [['alert', 'אין פריטים בארוחה']]);
});

test('deleteEditedMeal removes the meal being edited, persists, and returns home', async () => {
  const { deps, state, calls } = fakeDeps({
    editingExisting: { idx: 0, time: '' },
    todayData: { meals: [{ name: 'a' }, { name: 'b' }], burned: 0, steps: 0 }
  });
  DayNavigationController.configure(deps);
  await DayNavigationController.deleteEditedMeal();
  assert.deepEqual(state.todayData.meals, [{ name: 'b' }]);
  assert.deepEqual(calls[calls.length - 1], ['goToScreen', 'home']);
});

test('deleteEditedMeal is a no-op when not currently editing an existing meal', async () => {
  const { deps, calls } = fakeDeps({ editingExisting: null });
  DayNavigationController.configure(deps);
  await DayNavigationController.deleteEditedMeal();
  assert.deepEqual(calls, []);
});

test('cancelEditedMeal clears edit state, hides the editor, and returns home without persisting', () => {
  const foodResult = fakeElement();
  const { deps, state, calls, doc } = fakeDeps({ editingExisting: { idx: 0, time: '' }, pendingMeal: { items: [] } });
  doc._elements['food-result'] = foodResult;
  DayNavigationController.configure(deps);
  DayNavigationController.cancelEditedMeal();
  assert.equal(state.editingExisting, null);
  assert.equal(state.pendingMeal, null);
  assert.equal(foodResult.classList.hidden, true);
  assert.deepEqual(calls, [['goToScreen', 'home']]);
});

// ── renderEditor edit-mode action buttons ───────────────────────────────────────────────

test('renderEditor injects the edit-mode action buttons (save/delete/cancel) only when editingExisting is set', () => {
  const actions = fakeElement();
  const { deps, doc } = fakeDeps({ editingExisting: { idx: 0, time: '' } });
  doc.querySelector = (sel) => (sel === '#food-result .result-actions' ? actions : null);
  DayNavigationController.configure(deps);
  DayNavigationController.renderEditor();
  assert.match(actions.innerHTML, /addMeal\(\)/);
  assert.match(actions.innerHTML, /deleteEditedMeal\(\)/);
  assert.match(actions.innerHTML, /cancelEditedMeal\(\)/);
});

test('renderEditor does not touch the result-actions element when not editing an existing meal', () => {
  let queried = false;
  const { deps, doc } = fakeDeps({ editingExisting: null });
  doc.querySelector = () => { queried = true; return fakeElement(); };
  DayNavigationController.configure(deps);
  DayNavigationController.renderEditor();
  assert.equal(queried, false);
});

// ── addMeal routing ──────────────────────────────────────────────────────────────────────

test('addMeal routes to saveEditedMeal() when currently editing an existing meal', async () => {
  const foodResult = fakeElement();
  const { deps, state, calls, doc } = fakeDeps({
    pendingMeal: { items: [{ name: 'x' }] },
    editingExisting: { idx: 0, time: '' },
    todayData: { meals: [{ name: 'orig' }], burned: 0, steps: 0 }
  });
  doc._elements['food-result'] = foodResult;
  DayNavigationController.configure(deps);
  await DayNavigationController.addMeal();
  assert.equal(state.todayData.meals[0].name, 'built-meal', 'must have routed through saveEditedMeal, not MealCommitService');
  assert.deepEqual(calls[calls.length - 1], ['goToScreen', 'home']);
});

test('addMeal calls MealCommitService.commitMeal with the exact authorityOptions when not editing an existing meal', async () => {
  const captured = [];
  const originalCommitMeal = MealCommitService.commitMeal;
  MealCommitService.commitMeal = async (pendingMeal, todayData, waterCount, authorityOptions) => {
    captured.push({ pendingMeal, todayData, waterCount, authorityOptions });
    return true;
  };
  try {
    const { deps } = fakeDeps({ pendingMeal: { items: [{ name: 'x' }] }, todayData: { meals: [], burned: 0, steps: 0 }, waterCount: 2, editingExisting: null });
    DayNavigationController.configure(deps);
    const result = await DayNavigationController.addMeal();
    assert.equal(result, true);
    assert.equal(captured.length, 1);
    assert.equal(captured[0].waterCount, 2);
    assert.deepEqual(captured[0].authorityOptions, {
      authoritySource: 'USER_CONFIRMED_AI_ESTIMATE', createdByUid: 'u1', systemVersion: '2.39.0'
    });
  } finally {
    MealCommitService.commitMeal = originalCommitMeal;
  }
});

// ── loadUserData ────────────────────────────────────────────────────────────────────────

test('loadUserData calls loadUserDataCore then resets currentDayKey/realTodayData/realWaterCount to the freshly-loaded today snapshot', async () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const { deps, state, calls } = fakeDeps({
    currentDayKey: '2020-01-01', todayData: { meals: [{ name: 'fresh' }], burned: 9, steps: 9 }, waterCount: 6
  });
  DayNavigationController.configure(deps);
  await DayNavigationController.loadUserData();
  assert.ok(calls.includes('loadUserDataCore'));
  assert.equal(state.currentDayKey, DateUtils.getTodayKey());
  assert.deepEqual(state.realTodayData, { meals: [{ name: 'fresh' }], burned: 9, steps: 9 });
  assert.equal(state.realWaterCount, 6);
});

test('loadUserData suppresses the day-navigation-state reset when the session goes stale mid-load', async () => {
  const { deps, state } = fakeDeps(
    { currentDayKey: '2020-01-01' },
    { sessionLifecycle: { getGeneration: () => 1, isCurrent: () => false } }
  );
  DayNavigationController.configure(deps);
  await DayNavigationController.loadUserData();
  assert.equal(state.currentDayKey, '2020-01-01', 'must not overwrite day-navigation state after a stale session');
});

// ── updateFoodDateBanner ─────────────────────────────────────────────────────────────────

test('updateFoodDateBanner creates the banner under #screen-food .scroll-content, hides it when viewing today, and shows the day label otherwise', () => {
  const DateUtils = require('../js/core/dateUtils.js');
  const scroll = { insertBefore() {} };
  const { deps, doc } = fakeDeps({ currentDayKey: DateUtils.getTodayKey() });
  doc.querySelector = (sel) => (sel === '#screen-food .scroll-content' ? scroll : null);
  let created = null;
  doc.createElement = () => { created = fakeElement(); return created; };
  DayNavigationController.configure(deps);
  DayNavigationController.updateFoodDateBanner();
  doc._elements['food-date-banner'] = created;
  doc._elements['food-date-banner-text'] = fakeElement();
  DayNavigationController.updateFoodDateBanner();
  assert.equal(doc._elements['food-date-banner'].style.display, 'none');

  const { deps: deps2, doc: doc2 } = fakeDeps({ currentDayKey: '2020-01-01' });
  doc2._elements['food-date-banner'] = fakeElement();
  doc2._elements['food-date-banner-text'] = fakeElement();
  DayNavigationController.configure(deps2);
  DayNavigationController.updateFoodDateBanner();
  assert.match(doc2._elements['food-date-banner-text'].textContent, /רושם ליום/);
  assert.equal(doc2._elements['food-date-banner'].style.display, 'flex');
});
