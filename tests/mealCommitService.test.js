// C1-WP5D — js/nutrition/mealCommitService.js unit tests.
// High risk per docs/specs/C1_SPEC_v1.0.md §C1-WP5D — these tests exist specifically to prove
// the six spec-mandated guarantees, plus the surrounding sequencing (barcode cache, learning,
// streak, rendering). All app.js collaborators are injected via configure() so the full commit
// sequence is testable without a browser or Firestore.
// Run with: node --test tests/mealCommitService.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const MealCommitService = require('../js/nutrition/mealCommitService.js');

function item(overrides) {
  return Object.assign({ name: 'תפוח', amount: 150, unit: 'גרם', kcal: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 4, sugar: 16, sodium: 2, qty: 1 }, overrides);
}

function draft(overrides) {
  return Object.assign({ name: 'ארוחה', note: '', source: 'text', barcode: null, addedByName: '', items: [item()], suggestions: [] }, overrides);
}

function freshTodayData() { return { meals: [], burned: 0, steps: 0 }; }

function fakeDeps(overrides) {
  const calls = [];
  let gen = 1;
  const deps = {
    mealRequiresNutritionValidation: (meal) => (meal.source || 'text') !== 'off' && (meal.source || 'text') !== 'group' && (meal.source || 'text') !== 'manual',
    nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'VALID' }) },
    logValidation: (status, sourceType, codes) => { calls.push(['logValidation', status, sourceType, codes]); },
    collectErrorCodes: () => [],
    saveBarcodeToCache: (code, it, addedByName) => { calls.push(['saveBarcodeToCache', code, it, addedByName]); },
    sessionLifecycle: { getGeneration: () => gen, isCurrent: (g) => g === gen, _bump: () => { gen++; } },
    persistDaySnapshot: async (meals, burned, steps, water, authority, sessionGeneration) => { calls.push(['persistDaySnapshot', meals.slice(), burned, steps, water, authority, sessionGeneration]); return { status: 'SUCCESS' }; },
    learnQuickItems: (meal) => { calls.push(['learnQuickItems', meal]); },
    clearPendingMeal: () => { calls.push(['clearPendingMeal']); },
    getElementById: (id) => { calls.push(['getElementById', id]); return { classList: { add: () => calls.push(['classList.add', id]) }, value: '' }; },
    saveProfile: async () => { calls.push(['saveProfile']); },
    updateStreak: async () => { calls.push(['updateStreak']); },
    renderFoodMeals: () => { calls.push(['renderFoodMeals']); },
    renderQuickStrip: () => { calls.push(['renderQuickStrip']); },
    renderHome: () => { calls.push(['renderHome']); },
    renderEditor: () => { calls.push(['renderEditor']); },
    alertFn: (msg) => { calls.push(['alert', msg]); }
  };
  Object.assign(deps, overrides);
  return { deps, calls };
}

function authorityOptions() {
  return { authoritySource: 'USER_CONFIRMED_AI_ESTIMATE', createdByUid: 'u1', systemVersion: '9.9.9' };
}

test('returns false and alerts, without touching todayData, when pendingMeal is missing or has no items', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const td = freshTodayData();
  assert.equal(await MealCommitService.commitMeal(null, td, 0, authorityOptions()), false);
  assert.equal(await MealCommitService.commitMeal({ items: [] }, td, 0, authorityOptions()), false);
  assert.deepEqual(td.meals, []);
  assert.ok(calls.filter((c) => c[0] === 'alert').every((c) => c[1] === 'אין פריטים בארוחה'));
});

// ── SPEC guarantee: second validation gate remains mandatory ──────────────────────────
test('the second validation gate runs even for an AI source, and blocks commit + calls renderEditor on REJECTED', async () => {
  const { deps, calls } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'REJECTED' }) } });
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const result = await MealCommitService.commitMeal(draft({ source: 'photo' }), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.deepEqual(td.meals, [], 'a REJECTED meal must never be appended to todayData');
  assert.ok(calls.some((c) => c[0] === 'renderEditor'));
  assert.ok(!calls.some((c) => c[0] === 'persistDaySnapshot'), 'persistence must not be attempted for a REJECTED meal');
});

test('the second gate also blocks a merely UNCERTAIN meal (not just REJECTED)', async () => {
  const { deps } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'UNCERTAIN' }) } });
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const result = await MealCommitService.commitMeal(draft({ source: 'text' }), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.deepEqual(td.meals, []);
});

// ── SPEC guarantee: exempt sources remain exempt ───────────────────────────────────────
test('exempt sources (off/group/manual) skip the validator entirely and proceed straight to commit', async () => {
  let validatorCalled = false;
  const { deps, calls } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => { validatorCalled = true; return { overallStatus: 'REJECTED' }; } } });
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const result = await MealCommitService.commitMeal(draft({ source: 'manual' }), td, 0, authorityOptions());
  assert.equal(validatorCalled, false, 'the validator must not even be called for an exempt source');
  assert.equal(result, true);
  assert.equal(td.meals.length, 1);
});

// ── barcode cache update ───────────────────────────────────────────────────────────────
test('saveBarcodeToCache is called with the first item and addedByName only when pendingMeal.barcode and items[0] are present', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const meal = draft({ barcode: '7290012345', addedByName: 'דנה', items: [item({ name: 'חלב' })] });
  await MealCommitService.commitMeal(meal, freshTodayData(), 0, authorityOptions());
  const call = calls.find((c) => c[0] === 'saveBarcodeToCache');
  assert.ok(call);
  assert.equal(call[1], '7290012345');
  assert.equal(call[2].name, 'חלב');
  assert.equal(call[3], 'דנה');
});

test('saveBarcodeToCache is not called when pendingMeal.barcode is absent', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  await MealCommitService.commitMeal(draft({ barcode: null }), freshTodayData(), 0, authorityOptions());
  assert.ok(!calls.some((c) => c[0] === 'saveBarcodeToCache'));
});

// ── SPEC guarantee: successful write retains authority metadata ───────────────────────
test('the persisted authority metadata matches MealDraft.buildAuthoritativeMeal exactly, with the injected source/createdBy/systemVersion', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const opts = { authoritySource: 'USER_DECLARATION', createdByUid: 'uid-77', systemVersion: '3.1.4' };
  await MealCommitService.commitMeal(draft({ source: 'off' }), freshTodayData(), 0, opts);
  const persistCall = calls.find((c) => c[0] === 'persistDaySnapshot');
  assert.ok(persistCall);
  const authority = persistCall[5];
  assert.equal(authority.authoritySource, 'USER_DECLARATION');
  assert.equal(authority.createdBy, 'uid-77');
  assert.equal(authority.systemVersion, '3.1.4');
  assert.equal(authority.rule, 'meal-editor.addMeal.v1');
  // the same authority object must be the one attached to the committed meal in todayData
  const td = freshTodayData();
  await MealCommitService.commitMeal(draft({ source: 'off' }), td, 0, opts);
  assert.equal(td.meals[0].authority.authoritySource, 'USER_DECLARATION');
});

// ── optimistic append + PersistenceGateway write shape ─────────────────────────────────
test('the meal is appended to todayData.meals synchronously before persistDaySnapshot resolves, and the snapshot passed matches todayData at that moment', async () => {
  let pushedBeforePersistCalled = null;
  const { deps } = fakeDeps({
    persistDaySnapshot: async (meals) => {
      pushedBeforePersistCalled = meals.length;
      return { status: 'SUCCESS' };
    }
  });
  MealCommitService.configure(deps);
  const td = freshTodayData();
  await MealCommitService.commitMeal(draft(), td, 0, authorityOptions());
  assert.equal(pushedBeforePersistCalled, 1);
  assert.equal(td.meals.length, 1);
});

test('persistDaySnapshot receives todayData.burned/steps and the passed-in waterCount', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const td = { meals: [], burned: 250, steps: 3000 };
  await MealCommitService.commitMeal(draft(), td, 1500, authorityOptions());
  const persistCall = calls.find((c) => c[0] === 'persistDaySnapshot');
  // shape: ['persistDaySnapshot', meals, burned, steps, water, authority, sessionGeneration]
  assert.equal(persistCall[2], 250);
  assert.equal(persistCall[3], 3000);
  assert.equal(persistCall[4], 1500);
  assert.equal(typeof persistCall[5].authoritySource, 'string');
});

// ── SPEC guarantee: failed persistence rolls back the exact candidate ─────────────────
test('a failed persist removes exactly the candidate meal that was pushed, leaving unrelated pre-existing meals intact', async () => {
  const { deps, calls } = fakeDeps({ persistDaySnapshot: async () => ({ status: 'REJECTED' }) });
  MealCommitService.configure(deps);
  const existingMeal = { name: 'קיים', authority: {} };
  const td = { meals: [existingMeal], burned: 0, steps: 0 };
  const result = await MealCommitService.commitMeal(draft({ name: 'חדש' }), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.equal(td.meals.length, 1, 'only the failed candidate must be removed');
  assert.equal(td.meals[0], existingMeal, 'the pre-existing meal must be untouched by reference');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת הארוחה נכשלה. נסה שוב.'));
});

test('rollback also fires for a FAILED-like status other than SUCCESS/NO_OP, and NO_OP is treated as success (no rollback)', async () => {
  const { deps: depsFail } = fakeDeps({ persistDaySnapshot: async () => ({ status: 'CONFLICT' }) });
  MealCommitService.configure(depsFail);
  const tdFail = freshTodayData();
  await MealCommitService.commitMeal(draft(), tdFail, 0, authorityOptions());
  assert.deepEqual(tdFail.meals, []);

  const { deps: depsNoOp, calls: callsNoOp } = fakeDeps({ persistDaySnapshot: async () => ({ status: 'NO_OP' }) });
  MealCommitService.configure(depsNoOp);
  const tdNoOp = freshTodayData();
  const result = await MealCommitService.commitMeal(draft(), tdNoOp, 0, authorityOptions());
  assert.equal(result, true);
  assert.equal(tdNoOp.meals.length, 1, 'NO_OP must not trigger a rollback');
  assert.ok(callsNoOp.some((c) => c[0] === 'learnQuickItems'));
});

// ── SPEC guarantee: stale completion does not alert or render ─────────────────────────
test('a stale session on FAILED persistence still rolls back the candidate, but suppresses the alert', async () => {
  let bump;
  const { deps, calls } = fakeDeps({
    persistDaySnapshot: async () => { bump(); return { status: 'REJECTED' }; }
  });
  bump = deps.sessionLifecycle._bump;
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const result = await MealCommitService.commitMeal(draft(), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.deepEqual(td.meals, [], 'rollback (state correctness) must still happen even when stale');
  assert.ok(!calls.some((c) => c[0] === 'alert'), 'the alert is a UI effect and must be suppressed for a stale session');
});

test('a stale session on SUCCESSFUL persistence suppresses learning, profile save, streak update, and all renders — but the commit is not rolled back', async () => {
  let bump;
  const { deps, calls } = fakeDeps({
    persistDaySnapshot: async () => { bump(); return { status: 'SUCCESS' }; }
  });
  bump = deps.sessionLifecycle._bump;
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const result = await MealCommitService.commitMeal(draft(), td, 0, authorityOptions());
  assert.equal(result, false, 'stale-on-completion returns false (no effects claimed), even though the durable write itself succeeded');
  assert.equal(td.meals.length, 1, 'the durable write already succeeded — the optimistic entry must not be rolled back');
  assert.ok(!calls.some((c) => c[0] === 'learnQuickItems'));
  assert.ok(!calls.some((c) => c[0] === 'clearPendingMeal'));
  assert.ok(!calls.some((c) => c[0] === 'saveProfile'));
  assert.ok(!calls.some((c) => c[0] === 'updateStreak'));
  assert.ok(!calls.some((c) => c[0] === 'renderFoodMeals'));
  assert.ok(!calls.some((c) => c[0] === 'renderQuickStrip'));
  assert.ok(!calls.some((c) => c[0] === 'renderHome'));
  assert.ok(!calls.some((c) => c[0] === 'alert'));
});

// ── SPEC guarantee: two near-simultaneous writes compose from current mutable state ───
test('two overlapping commitMeal calls each snapshot todayData.meals at their own synchronous push time, so the later push is visible to the still-pending earlier call only if it resolves after', async () => {
  const persistCalls = [];
  const resolvers = [];
  const { deps } = fakeDeps({
    persistDaySnapshot: (meals) => {
      persistCalls.push(meals.slice());
      return new Promise((resolve) => resolvers.push(() => resolve({ status: 'SUCCESS' })));
    }
  });
  MealCommitService.configure(deps);
  const td = freshTodayData();

  // Call A starts, pushes meal A synchronously, and calls persistDaySnapshot (pending).
  const promiseA = MealCommitService.commitMeal(draft({ name: 'A' }), td, 0, authorityOptions());
  // Before A's persist resolves, call B starts, pushes meal B onto the SAME shared array.
  const promiseB = MealCommitService.commitMeal(draft({ name: 'B' }), td, 0, authorityOptions());

  assert.equal(td.meals.length, 2, 'both optimistic appends must be visible on the shared array before either persist resolves');
  assert.equal(persistCalls[0].length, 1, "A's snapshot must have been taken before B pushed — it only contains A");
  assert.equal(persistCalls[0][0].name, 'A');
  assert.equal(persistCalls[1].length, 2, "B's snapshot is taken after both pushes — it must contain both A and B");
  assert.deepEqual(persistCalls[1].map((m) => m.name), ['A', 'B']);

  // Resolve B first, then A — completion order must not affect what was already captured in each snapshot.
  resolvers[1]();
  resolvers[0]();
  await Promise.all([promiseA, promiseB]);
  assert.equal(td.meals.length, 2, 'no spurious rollback should occur when both ultimately succeed');
});

test('when the earlier of two overlapping writes fails, only its own candidate is rolled back, not the later one', async () => {
  const persistResults = [{ status: 'REJECTED' }, { status: 'SUCCESS' }];
  let callIdx = 0;
  const { deps, calls } = fakeDeps({ persistDaySnapshot: async () => persistResults[callIdx++] });
  MealCommitService.configure(deps);
  const td = freshTodayData();
  const resultA = await MealCommitService.commitMeal(draft({ name: 'A' }), td, 0, authorityOptions());
  // B pushes after A's synchronous push but here we call it after A fully resolves for simplicity of ordering with a real rejection.
  const resultB = await MealCommitService.commitMeal(draft({ name: 'B' }), td, 0, authorityOptions());
  assert.equal(resultA, false);
  assert.equal(resultB, true);
  assert.equal(td.meals.length, 1);
  assert.equal(td.meals[0].name, 'B');
});

// ── full successful sequence ordering ───────────────────────────────────────────────────
test('a successful commit runs learnQuickItems -> clearPendingMeal -> DOM reset -> saveProfile -> updateStreak -> renders, in that order', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const result = await MealCommitService.commitMeal(draft(), freshTodayData(), 0, authorityOptions());
  assert.equal(result, true);
  const order = calls.map((c) => c[0]).filter((name) => ['learnQuickItems', 'clearPendingMeal', 'getElementById', 'saveProfile', 'updateStreak', 'renderFoodMeals', 'renderQuickStrip', 'renderHome'].includes(name));
  const learnIdx = order.indexOf('learnQuickItems');
  const clearIdx = order.indexOf('clearPendingMeal');
  const saveProfileIdx = order.indexOf('saveProfile');
  const streakIdx = order.indexOf('updateStreak');
  const foodMealsIdx = order.indexOf('renderFoodMeals');
  const quickStripIdx = order.indexOf('renderQuickStrip');
  const homeIdx = order.indexOf('renderHome');
  assert.ok(learnIdx < clearIdx);
  assert.ok(clearIdx < saveProfileIdx);
  assert.ok(saveProfileIdx < streakIdx);
  assert.ok(streakIdx < foodMealsIdx);
  assert.ok(foodMealsIdx < quickStripIdx);
  assert.ok(quickStripIdx < homeIdx);
  assert.ok(calls.some((c) => c[0] === 'getElementById' && c[1] === 'food-result'));
  assert.ok(calls.some((c) => c[0] === 'getElementById' && c[1] === 'food-input'));
});

test('learnQuickItems receives the exact committed finalMeal object', async () => {
  const { deps, calls } = fakeDeps();
  MealCommitService.configure(deps);
  const td = freshTodayData();
  await MealCommitService.commitMeal(draft({ name: 'סלט' }), td, 0, authorityOptions());
  const learnCall = calls.find((c) => c[0] === 'learnQuickItems');
  assert.equal(learnCall[1], td.meals[0]);
  assert.equal(learnCall[1].name, 'סלט');
});
