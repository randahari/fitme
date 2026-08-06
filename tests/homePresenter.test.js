// C1-WP10 — js/ui/homePresenter.js unit tests.
// Covers: renderHome's greeting/ring/macro-bar/burned-steps-weight-streak DOM updates and its
// call-order tail (renderMealsInHome/buildWater/buildWeekChart/refreshCoachCard/
// applyDateNavChrome), plus renderMealsInHome's empty-state and per-meal row rendering — all
// via injected DOM/state closures, matching the consolidated app.js behaviour exactly (base
// "renderHome with ring" override + Day Navigation IIFE wrap, see docs/architecture/
// C1_WP0_INVENTORY.md §2.2).
// Run with: node --test tests/homePresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const HomePresenter = require('../js/ui/homePresenter.js');

function fakeElement(overrides) {
  return Object.assign({ style: {}, textContent: '', innerHTML: '' }, overrides);
}

function fakeDocument() {
  const elements = {};
  [
    'greeting', 'ring-arc', 'ring-pct', 'kcal-consumed', 'kcal-target', 'kcal-remain',
    'm-protein', 'm-carbs', 'm-fat', 'bar-protein', 'bar-carbs', 'bar-fat',
    'burned-val', 'steps-val', 'weight-val', 'streak-num', 'meals-list', 'today-date'
  ].forEach((id) => { elements[id] = fakeElement(); });
  elements['today-date'].textContent = 'יום שלישי, 5/8'; // matches app.js's setTodayDate() already having run
  return { getElementById: (id) => elements[id] || null, _elements: elements };
}

function fakeDeps(overrides) {
  const calls = [];
  const userProfile = { name: 'רן', goalKcal: 2000, weight: 80, streak: 3, currentWeight: 79 };
  const todayData = { meals: [{ kcal: 500, protein: 40, carbs: 50, fat: 10 }], burned: 200, steps: 1000 };
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    getUserProfile: () => userProfile,
    getTodayData: () => todayData,
    setTodayDate: () => calls.push('setTodayDate'),
    renderMealsInHome: () => calls.push('renderMealsInHome'),
    buildWater: () => calls.push('buildWater'),
    buildWeekChart: () => calls.push('buildWeekChart'),
    refreshCoachCard: () => calls.push('refreshCoachCard'),
    applyDateNavChrome: () => calls.push('applyDateNavChrome')
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc, userProfile, todayData };
}

test('renderHome is a no-op with no userProfile', () => {
  const { deps, calls } = fakeDeps({ getUserProfile: () => null });
  HomePresenter.configure(deps);
  assert.doesNotThrow(() => HomePresenter.renderHome());
  assert.deepEqual(calls, []);
});

test('renderHome updates greeting/kcal/ring/macro DOM and computes remaining kcal floored at 0', () => {
  const { deps, doc } = fakeDeps();
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  assert.equal(doc._elements['greeting'].textContent, 'שלום, רן');
  assert.equal(doc._elements['kcal-consumed'].textContent, '500');
  assert.equal(doc._elements['kcal-target'].textContent, '2,000');
  assert.equal(doc._elements['kcal-remain'].textContent, 'נותרו 1,500 קל׳');
  assert.equal(doc._elements['ring-pct'].textContent, '25%');
  assert.equal(doc._elements['m-protein'].textContent, '40g');
  assert.equal(doc._elements['burned-val'].textContent, '200');
  assert.equal(doc._elements['steps-val'].textContent, '1,000');
  assert.equal(doc._elements['weight-val'].textContent, 79);
  assert.equal(doc._elements['streak-num'].textContent, 3);
});

test('renderHome floors kcal-remain at 0 when consumed exceeds target', () => {
  const { deps, doc } = fakeDeps({ getTodayData: () => ({ meals: [{ kcal: 3000, protein: 0, carbs: 0, fat: 0 }], burned: 0, steps: 0 }) });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  assert.equal(doc._elements['kcal-remain'].textContent, 'נותרו 0 קל׳');
});

test('renderHome calls renderMealsInHome/buildWater/buildWeekChart/refreshCoachCard/applyDateNavChrome in that exact order, last', () => {
  const { deps, calls } = fakeDeps();
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  assert.deepEqual(calls, ['setTodayDate', 'renderMealsInHome', 'buildWater', 'buildWeekChart', 'refreshCoachCard', 'applyDateNavChrome']);
});

test('renderHome falls back to weight-val = userProfile.weight when currentWeight is unset, and "--" when neither is set', () => {
  const { deps, doc } = fakeDeps({ getUserProfile: () => ({ name: 'רן', goalKcal: 2000, weight: 80, streak: 0 }) });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  assert.equal(doc._elements['weight-val'].textContent, 80);

  const { deps: deps2, doc: doc2 } = fakeDeps({ getUserProfile: () => ({ name: 'רן', goalKcal: 2000, streak: 0 }) });
  HomePresenter.configure(deps2);
  HomePresenter.renderHome();
  assert.equal(doc2._elements['weight-val'].textContent, '--');
});

// ── renderMealsInHome ───────────────────────────────────────────────────────────────────

test('renderMealsInHome is a no-op if the meals-list element is missing', () => {
  const { deps } = fakeDeps({ documentRef: { getElementById: () => null } });
  HomePresenter.configure(deps);
  assert.doesNotThrow(() => HomePresenter.renderMealsInHome());
});

test('renderMealsInHome shows the empty state when there are no meals today', () => {
  const { deps, doc } = fakeDeps({ getTodayData: () => ({ meals: [], burned: 0, steps: 0 }) });
  HomePresenter.configure(deps);
  HomePresenter.renderMealsInHome();
  assert.match(doc._elements['meals-list'].innerHTML, /לא נרשמו ארוחות/);
});

test('renderMealsInHome renders one clickable/deletable row per meal with escaped name/time and edit/delete onclick handlers by index', () => {
  const { deps, doc } = fakeDeps({
    getTodayData: () => ({ meals: [{ name: '<script>', time: '12:00', kcal: 300 }, { name: 'סלט', time: '13:00', kcal: 150 }], burned: 0, steps: 0 })
  });
  HomePresenter.configure(deps);
  HomePresenter.renderMealsInHome();
  const html = doc._elements['meals-list'].innerHTML;
  assert.doesNotMatch(html, /<script>/, 'meal name must be HTML-escaped');
  assert.match(html, /editHomeMeal\(0\)/);
  assert.match(html, /deleteHomeMeal\(0\)/);
  assert.match(html, /editHomeMeal\(1\)/);
  assert.match(html, /deleteHomeMeal\(1\)/);
  assert.match(html, /300 קל'/);
  assert.match(html, /סלט/);
});

// ── TASK-007 UX-7.5/UX-14.1a (WP8) — return-after-absence continuity signal ─────────────

function flushMicrotasks() { return new Promise((resolve) => setTimeout(resolve, 0)); }

const { _internal } = HomePresenter;
const TODAY = require('../js/core/dateUtils.js').getTodayKey();

function keyDaysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return require('../js/core/dateUtils.js').dateKey(d);
}

test('daysSinceLastLoggedDay returns null for missing/empty history (new user — nothing to be absent from)', () => {
  assert.equal(_internal.daysSinceLastLoggedDay(null, TODAY), null);
  assert.equal(_internal.daysSinceLastLoggedDay({}, TODAY), null);
});

test('daysSinceLastLoggedDay ignores days with an empty meals array, today itself, and future-dated keys', () => {
  const history = {};
  history[keyDaysAgo(2)] = { meals: [] };
  history[TODAY] = { meals: [{ kcal: 100 }] };
  const future = new Date(); future.setDate(future.getDate() + 1);
  history[require('../js/core/dateUtils.js').dateKey(future)] = { meals: [{ kcal: 100 }] };
  assert.equal(_internal.daysSinceLastLoggedDay(history, TODAY), null);
});

test('daysSinceLastLoggedDay returns the gap to the most recent prior day with meals.length > 0', () => {
  const history = {};
  history[keyDaysAgo(9)] = { meals: [{ kcal: 100 }] };
  history[keyDaysAgo(5)] = { meals: [{ kcal: 200 }] };
  history[keyDaysAgo(2)] = { meals: [] }; // present but empty — must not count
  assert.equal(_internal.daysSinceLastLoggedDay(history, TODAY), 5);
});

test('renderHome appends the continuity signal to #today-date when the gap meets the threshold (4+ days)', async () => {
  const history = {}; history[keyDaysAgo(6)] = { meals: [{ kcal: 100 }] };
  const { deps, doc } = fakeDeps({ getHistoryData: async () => history, sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true } });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8 · הרישום האחרון: לפני 6 ימים');
});

test('renderHome does not append the signal when the gap is under the threshold', async () => {
  const history = {}; history[keyDaysAgo(2)] = { meals: [{ kcal: 100 }] };
  const { deps, doc } = fakeDeps({ getHistoryData: async () => history, sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true } });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8');
});

test('renderHome does not append the signal for a brand-new user with no qualifying prior day', async () => {
  const { deps, doc } = fakeDeps({ getHistoryData: async () => ({}), sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true } });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8');
});

test('renderHome suppresses the continuity signal when the session goes stale mid-fetch (REM-002)', async () => {
  const history = {}; history[keyDaysAgo(10)] = { meals: [{ kcal: 100 }] };
  const { deps, doc } = fakeDeps({
    getHistoryData: async () => history,
    sessionLifecycle: { getGeneration: () => 1, isCurrent: () => false } // already stale by the time it resolves
  });
  HomePresenter.configure(deps);
  HomePresenter.renderHome();
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8', 'a stale session must produce no effect');
});

test('renderHome does not throw and applies no signal when getHistoryData rejects (defensive)', async () => {
  const { deps, doc } = fakeDeps({ getHistoryData: async () => { throw new Error('offline'); }, sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true } });
  HomePresenter.configure(deps);
  assert.doesNotThrow(() => HomePresenter.renderHome());
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8');
});

test('renderHome applies no signal, and does not throw, when getHistoryData/sessionLifecycle are not injected (backward compatibility)', async () => {
  const { deps, doc } = fakeDeps(); // base fakeDeps has neither — matches every pre-WP8 caller
  HomePresenter.configure(deps);
  assert.doesNotThrow(() => HomePresenter.renderHome());
  await flushMicrotasks();
  assert.equal(doc._elements['today-date'].textContent, 'יום שלישי, 5/8');
});
