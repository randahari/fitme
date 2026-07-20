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
    'burned-val', 'steps-val', 'weight-val', 'streak-num', 'meals-list'
  ].forEach((id) => { elements[id] = fakeElement(); });
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
