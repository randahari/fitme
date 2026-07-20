// C1-WP5E — js/nutrition/quickLogService.js unit tests.
// Covers: learning (new/existing item, qty-weighted effective values, cap trigger),
// scoring (frequency/hour/freshness/pin bonuses), cap (sort+truncate, no-op under 40),
// pin/remove (toggle, missing-index guard, splice), and the authoritative quick commit
// (mandatory validation gate with no exempt-source branch, rollback on failure, stale-session
// suppression on both failure and success paths, authority metadata correctness with fixed
// source/rule, usage-stat update on success, and confirmation that renderQuickStrip is never
// called — that responsibility stays with app.js's logQuick() facade).
// Run with: node --test tests/quickLogService.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const QuickLogService = require('../js/nutrition/quickLogService.js');

function r1(x) { return Math.round((+x || 0) * 10) / 10; }

function quickItem(overrides) {
  return Object.assign({ name: 'תפוח', amount: 150, unit: 'גרם', kcal: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 4, sugar: 16, sodium: 2, count: 1, lastUsed: Date.now(), lastHour: 12, pinned: false }, overrides);
}

function mealItem(overrides) {
  return Object.assign({ name: 'תפוח', qty: 1, amount: 150, unit: 'גרם', kcal: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 4, sugar: 16, sodium: 2 }, overrides);
}

function freshTodayData() { return { meals: [], burned: 0, steps: 0 }; }

function fakeDeps(overrides) {
  const calls = [];
  let gen = 1;
  const deps = {
    nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'VALID' }) },
    logValidation: (status, sourceType, codes) => { calls.push(['logValidation', status, sourceType, codes]); },
    collectErrorCodes: () => [],
    sessionLifecycle: { getGeneration: () => gen, isCurrent: (g) => g === gen, _bump: () => { gen++; } },
    persistDaySnapshot: async (meals, burned, steps, water, authority, sessionGeneration) => { calls.push(['persistDaySnapshot', meals.slice(), burned, steps, water, authority, sessionGeneration]); return { status: 'SUCCESS' }; },
    alertFn: (msg) => { calls.push(['alert', msg]); }
  };
  Object.assign(deps, overrides);
  return { deps, calls };
}

function authorityOptions(overrides) {
  return Object.assign({ createdByUid: 'u1', systemVersion: '9.9.9' }, overrides);
}

// ── learnQuickItems ─────────────────────────────────────────────────────────────────────

test('learnQuickItems creates a new atom for an unseen item, with qty-weighted effective values', () => {
  const meal = { items: [mealItem({ name: 'בננה', qty: 2, kcal: 90, protein: 1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, amount: 118 })] };
  const items = [];
  const result = QuickLogService.learnQuickItems(meal, items, r1);
  assert.equal(result.length, 1);
  const e = result[0];
  assert.equal(e.name, 'בננה');
  assert.equal(e.count, 1);
  assert.equal(e.kcal, 180);
  assert.equal(e.protein, 2);
  assert.equal(e.carbs, 46);
  assert.equal(e.amount, 236);
  assert.equal(e.sodium, 2);
  assert.equal(e.pinned, false);
});

test('learnQuickItems increments count and refreshes effective values for an existing item (matched by name)', () => {
  const existing = quickItem({ name: 'תפוח', count: 3, kcal: 80 });
  const meal = { items: [mealItem({ name: 'תפוח', qty: 1, kcal: 100 })] };
  const items = [existing];
  const result = QuickLogService.learnQuickItems(meal, items, r1);
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 4);
  assert.equal(result[0].kcal, 100);
  assert.equal(result[0], existing, 'existing atom must be mutated in place, not replaced');
});

test('learnQuickItems skips items with an empty/whitespace-only name', () => {
  const meal = { items: [mealItem({ name: '   ' }), mealItem({ name: '' })] };
  const result = QuickLogService.learnQuickItems(meal, [], r1);
  assert.deepEqual(result, []);
});

test('learnQuickItems returns the (possibly unchanged) items reference when the guard fails (no meal / no meal.items array)', () => {
  const items = [quickItem()];
  assert.equal(QuickLogService.learnQuickItems(null, items, r1), items);
  assert.equal(QuickLogService.learnQuickItems({}, items, r1), items);
  assert.equal(QuickLogService.learnQuickItems({ items: 'not-an-array' }, items, r1), items);
});

test('learnQuickItems triggers capQuick (>40 items get sorted and truncated to 40)', () => {
  const items = [];
  for (let i = 0; i < 45; i++) items.push(quickItem({ name: 'item' + i, count: i, pinned: false }));
  const meal = { items: [mealItem({ name: 'new-item', qty: 1 })] };
  const result = QuickLogService.learnQuickItems(meal, items, r1);
  assert.equal(result.length, 40);
});

// ── capQuick ────────────────────────────────────────────────────────────────────────────

test('capQuick is a no-op (same reference, no sort) when length <= 40', () => {
  const items = [quickItem({ name: 'a', count: 1 }), quickItem({ name: 'b', count: 5 })];
  const result = QuickLogService.capQuick(items);
  assert.equal(result, items, 'must return the exact same reference, not a copy');
  assert.equal(result[0].name, 'a', 'order must be untouched when under the cap');
});

test('capQuick sorts pinned-first then by count desc, and truncates to 40 when over the cap', () => {
  const items = [];
  for (let i = 0; i < 41; i++) items.push(quickItem({ name: 'item' + i, count: i, pinned: false }));
  items[0].pinned = true; // lowest count, but pinned — must survive to the front
  const result = QuickLogService.capQuick(items);
  assert.equal(result.length, 40);
  assert.equal(result[0].name, 'item0', 'pinned item must sort first regardless of count');
  assert.equal(result[1].name, 'item40', 'highest count among unpinned must come next');
});

// ── scoreQuick ──────────────────────────────────────────────────────────────────────────

test('scoreQuick: base score is count * 3', () => {
  const nowHr = new Date().getHours();
  const q = quickItem({ count: 5, lastHour: (nowHr + 6) % 24, lastUsed: null, pinned: false });
  assert.equal(QuickLogService.scoreQuick(q), 15);
});

test('scoreQuick: +8 bonus when lastHour is within 2 hours of the current hour', () => {
  const nowHr = new Date().getHours();
  const q = quickItem({ count: 0, lastHour: nowHr, lastUsed: null, pinned: false });
  assert.equal(QuickLogService.scoreQuick(q), 8);
});

test('scoreQuick: freshness bonus — +4 under 2 days, +2 under 7 days, +0 otherwise', () => {
  const nowHr = new Date().getHours();
  const farHour = (nowHr + 12) % 24;
  const fresh = quickItem({ count: 0, lastHour: farHour, lastUsed: Date.now() - 1 * 86400000, pinned: false });
  const stale = quickItem({ count: 0, lastHour: farHour, lastUsed: Date.now() - 5 * 86400000, pinned: false });
  const ancient = quickItem({ count: 0, lastHour: farHour, lastUsed: Date.now() - 30 * 86400000, pinned: false });
  assert.equal(QuickLogService.scoreQuick(fresh), 4);
  assert.equal(QuickLogService.scoreQuick(stale), 2);
  assert.equal(QuickLogService.scoreQuick(ancient), 0);
});

test('scoreQuick: pinned adds a dominant +1000 bonus', () => {
  const q = quickItem({ count: 0, lastHour: null, lastUsed: null, pinned: true });
  assert.equal(QuickLogService.scoreQuick(q), 1000);
});

// ── togglePin / removeItem ─────────────────────────────────────────────────────────────

test('togglePin flips pinned in place and returns true when the index exists', () => {
  const items = [quickItem({ pinned: false })];
  assert.equal(QuickLogService.togglePin(items, 0), true);
  assert.equal(items[0].pinned, true);
  assert.equal(QuickLogService.togglePin(items, 0), true);
  assert.equal(items[0].pinned, false);
});

test('togglePin returns false and mutates nothing when the index is missing', () => {
  const items = [quickItem()];
  assert.equal(QuickLogService.togglePin(items, 5), false);
  assert.equal(items.length, 1);
});

test('removeItem splices the given index in place', () => {
  const a = quickItem({ name: 'a' }), b = quickItem({ name: 'b' }), c = quickItem({ name: 'c' });
  const items = [a, b, c];
  QuickLogService.removeItem(items, 1);
  assert.deepEqual(items, [a, c]);
});

// ── commitQuickItem ─────────────────────────────────────────────────────────────────────

test('commitQuickItem returns false immediately for a falsy quickItem, without touching todayData', async () => {
  const { deps } = fakeDeps();
  QuickLogService.configure(deps);
  const td = freshTodayData();
  assert.equal(await QuickLogService.commitQuickItem(null, td, 0, authorityOptions()), false);
  assert.deepEqual(td.meals, []);
});

// ── SPEC guarantee: mandatory validation gate, no exempt-source branch ────────────────
test('the validation gate always runs (no exempt-source branch, unlike addMeal) and blocks commit on non-VALID', async () => {
  let validatorCalled = false;
  const { deps, calls } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => { validatorCalled = true; return { overallStatus: 'REJECTED' }; } } });
  QuickLogService.configure(deps);
  const td = freshTodayData();
  const result = await QuickLogService.commitQuickItem(quickItem(), td, 0, authorityOptions());
  assert.equal(validatorCalled, true, 'unlike addMeal, logQuick has no exempt source — the validator must always run');
  assert.equal(result, false);
  assert.deepEqual(td.meals, []);
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'הפריט הזה לא עבר אימות תזונתי. אפשר לרשום אותו דרך "הוסף ארוחה" כדי לבדוק/לתקן את הערכים.'));
  assert.ok(!calls.some((c) => c[0] === 'persistDaySnapshot'));
});

test('the gate also blocks a merely UNCERTAIN item', async () => {
  const { deps } = fakeDeps({ nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'UNCERTAIN' }) } });
  QuickLogService.configure(deps);
  const td = freshTodayData();
  const result = await QuickLogService.commitQuickItem(quickItem(), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.deepEqual(td.meals, []);
});

// ── authority metadata: fixed source/rule ──────────────────────────────────────────────
test('authority metadata uses the fixed USER_CONFIRMED_AI_ESTIMATE source and logQuick.v1 rule, with injected createdBy/systemVersion', async () => {
  const { deps, calls } = fakeDeps();
  QuickLogService.configure(deps);
  const opts = authorityOptions({ createdByUid: 'uid-77', systemVersion: '3.1.4' });
  await QuickLogService.commitQuickItem(quickItem(), freshTodayData(), 0, opts);
  const persistCall = calls.find((c) => c[0] === 'persistDaySnapshot');
  assert.ok(persistCall);
  const authority = persistCall[5];
  assert.equal(authority.authoritySource, 'USER_CONFIRMED_AI_ESTIMATE');
  assert.equal(authority.createdBy, 'uid-77');
  assert.equal(authority.systemVersion, '3.1.4');
  assert.equal(authority.rule, 'logQuick.v1');
});

// ── optimistic append + rollback on failure ────────────────────────────────────────────
test('the item is appended optimistically before persistDaySnapshot resolves, and rolled back exactly on failure', async () => {
  const { deps, calls } = fakeDeps({ persistDaySnapshot: async () => ({ status: 'REJECTED' }) });
  QuickLogService.configure(deps);
  const existingMeal = { name: 'קיים' };
  const td = { meals: [existingMeal], burned: 0, steps: 0 };
  const result = await QuickLogService.commitQuickItem(quickItem({ name: 'חדש' }), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.equal(td.meals.length, 1, 'only the failed candidate must be removed');
  assert.equal(td.meals[0], existingMeal);
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת הפריט נכשלה. נסה שוב.'));
});

test('NO_OP is treated as success (no rollback, usage stats updated)', async () => {
  const { deps } = fakeDeps({ persistDaySnapshot: async () => ({ status: 'NO_OP' }) });
  QuickLogService.configure(deps);
  const q = quickItem({ count: 2 });
  const td = freshTodayData();
  const result = await QuickLogService.commitQuickItem(q, td, 0, authorityOptions());
  assert.equal(result, true);
  assert.equal(td.meals.length, 1);
  assert.equal(q.count, 3);
});

// ── stale-session suppression ──────────────────────────────────────────────────────────
test('a stale session on FAILED persistence still rolls back, but suppresses the alert', async () => {
  let bump;
  const { deps, calls } = fakeDeps({ persistDaySnapshot: async () => { bump(); return { status: 'REJECTED' }; } });
  bump = deps.sessionLifecycle._bump;
  QuickLogService.configure(deps);
  const td = freshTodayData();
  const result = await QuickLogService.commitQuickItem(quickItem(), td, 0, authorityOptions());
  assert.equal(result, false);
  assert.deepEqual(td.meals, []);
  assert.ok(!calls.some((c) => c[0] === 'alert'));
});

test('a stale session on SUCCESSFUL persistence suppresses the usage-stat update and returns false, but does not roll back the durable write', async () => {
  let bump;
  const { deps } = fakeDeps({ persistDaySnapshot: async () => { bump(); return { status: 'SUCCESS' }; } });
  bump = deps.sessionLifecycle._bump;
  QuickLogService.configure(deps);
  const q = quickItem({ count: 1 });
  const td = freshTodayData();
  const result = await QuickLogService.commitQuickItem(q, td, 0, authorityOptions());
  assert.equal(result, false);
  assert.equal(td.meals.length, 1, 'the durable write already succeeded — no rollback');
  assert.equal(q.count, 1, 'usage stats must not be updated for a stale completion');
});

// ── usage-stat update on success ───────────────────────────────────────────────────────
test('a successful commit updates count/lastUsed/lastHour on the original quickItem object', async () => {
  const { deps } = fakeDeps();
  QuickLogService.configure(deps);
  const q = quickItem({ count: 4, lastUsed: 1, lastHour: 0 });
  const before = Date.now();
  const result = await QuickLogService.commitQuickItem(q, freshTodayData(), 0, authorityOptions());
  assert.equal(result, true);
  assert.equal(q.count, 5);
  assert.ok(q.lastUsed >= before);
  assert.equal(q.lastHour, new Date().getHours());
});

// ── never calls renderQuickStrip (deliberate asymmetry vs. addMeal) ───────────────────
test('commitQuickItem never invokes a renderQuickStrip-style callback — that stays app.js-owned', async () => {
  const renderQuickStripCalls = [];
  const { deps } = fakeDeps();
  deps.renderQuickStrip = () => renderQuickStripCalls.push(1);
  QuickLogService.configure(deps);
  await QuickLogService.commitQuickItem(quickItem(), freshTodayData(), 0, authorityOptions());
  assert.equal(renderQuickStripCalls.length, 0, 'quickLogService must never call renderQuickStrip itself, injected or not');
});

// ── waterCount / todayData plumbing ────────────────────────────────────────────────────
test('persistDaySnapshot receives todayData.burned/steps and the passed-in waterCount', async () => {
  const { deps, calls } = fakeDeps();
  QuickLogService.configure(deps);
  const td = { meals: [], burned: 250, steps: 3000 };
  await QuickLogService.commitQuickItem(quickItem(), td, 1500, authorityOptions());
  const persistCall = calls.find((c) => c[0] === 'persistDaySnapshot');
  assert.equal(persistCall[2], 250);
  assert.equal(persistCall[3], 3000);
  assert.equal(persistCall[4], 1500);
});
