// C1-WP10 — js/ui/profilePresenter.js unit tests.
// Covers: renderProfile's avatar/name/goal/health-data/stats DOM updates plus its call-order
// tail (renderAchievements then renderMeasurements — the C1-WP7 wrap), getAvatarSVG's
// BMI-bucketed body width/color, renderWeightChart's empty-state and polyline rendering, and
// renderAchievements' earned/locked icon toggling — via injected DOM/state closures and the
// real ProfileMetrics module (shared require-cache singleton, same pattern as
// coachPresenter.test.js using the real CoachPromptComposer), matching the consolidated
// app.js behaviour exactly (base renderProfile + C1-WP7 renderMeasurements wrap, see
// docs/architecture/C1_WP0_INVENTORY.md §2.1).
// Run with: node --test tests/profilePresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ProfilePresenter = require('../js/ui/profilePresenter.js');

function fakeElement(overrides) {
  return Object.assign({ textContent: '', innerHTML: '' }, overrides);
}

function fakeDocument() {
  const elements = {};
  [
    'prof-avatar-svg', 'prof-name', 'prof-goal', 'health-data',
    'stat-burned', 'stat-workouts', 'stat-streak-best', 'stat-streak-cur',
    'achievements-list', 'weight-chart'
  ].forEach((id) => { elements[id] = fakeElement(); });
  return { getElementById: (id) => elements[id] || null, _elements: elements };
}

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };
const ACHIEVEMENTS = [
  { id: 'streak7', icon: '🔥', title: '7 ימים ברצף' },
  { id: 'streak30', icon: '🏆', title: '30 ימים ברצף' }
];

function fakeDeps(overrides) {
  const calls = [];
  const userProfile = {
    name: 'רן', goal: 'cut', goalKcal: 1800, weight: 80, height: 180, age: 30, gender: 'male',
    totalWorkouts: 5, streak: 4, bestStreak: 10, ach_streak7: true
  };
  const todayData = { burned: 100 };
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    getUserProfile: () => userProfile,
    getTodayData: () => todayData,
    getHistoryData: async () => ({ '2026-01-01': { burned: 200 }, '2026-01-02': { burned: 300 } }),
    goalLabels: GOAL_LABELS,
    achievements: ACHIEVEMENTS,
    renderMeasurements: () => calls.push('renderMeasurements')
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc, userProfile, todayData };
}

test('renderProfile is a no-op with no userProfile', async () => {
  const { deps, calls } = fakeDeps({ getUserProfile: () => null });
  ProfilePresenter.configure(deps);
  await ProfilePresenter.renderProfile();
  assert.deepEqual(calls, []);
});

test('renderProfile fills name/goal/avatar and computes total burned from history + today', async () => {
  const { deps, doc } = fakeDeps();
  ProfilePresenter.configure(deps);
  await ProfilePresenter.renderProfile();
  assert.equal(doc._elements['prof-name'].textContent, 'רן');
  assert.equal(doc._elements['prof-goal'].textContent, 'חיטוב 🔥');
  assert.match(doc._elements['prof-avatar-svg'].innerHTML, /<svg/);
  assert.equal(doc._elements['stat-burned'].textContent, '600'); // 200 + 300 + 100
  assert.equal(doc._elements['stat-workouts'].textContent, 5);
  assert.equal(doc._elements['stat-streak-best'].textContent, 10);
  assert.equal(doc._elements['stat-streak-cur'].textContent, 4);
});

test('renderProfile builds the health-data block with BMI/body-fat/BMR/TDEE/ideal-weight rows', async () => {
  const { deps, doc } = fakeDeps();
  ProfilePresenter.configure(deps);
  await ProfilePresenter.renderProfile();
  const html = doc._elements['health-data'].innerHTML;
  assert.match(html, /BMI/);
  assert.match(html, /% שומן משוער/);
  assert.match(html, /BMR \(מנוחה\)/);
  assert.match(html, /TDEE \(יומי\)/);
  assert.match(html, /משקל אידיאלי/);
});

test('renderProfile calls renderAchievements (achievements-list populated) then renderMeasurements last', async () => {
  const { deps, doc, calls } = fakeDeps();
  ProfilePresenter.configure(deps);
  await ProfilePresenter.renderProfile();
  assert.match(doc._elements['achievements-list'].innerHTML, /7 ימים ברצף/);
  assert.deepEqual(calls, ['renderMeasurements']);
});

// ── getAvatarSVG ────────────────────────────────────────────────────────────────────────

test('getAvatarSVG picks body width/color by BMI bucket', () => {
  ProfilePresenter.configure(fakeDeps().deps);
  const underweight = ProfilePresenter.getAvatarSVG(17, 'male');
  const normal = ProfilePresenter.getAvatarSVG(22, 'male');
  const overweight = ProfilePresenter.getAvatarSVG(27, 'male');
  const obese = ProfilePresenter.getAvatarSVG(33, 'male');
  assert.match(underweight, /#AFA9EC/);
  assert.match(normal, /#534AB7/);
  assert.match(overweight, /#BA7517/);
  assert.match(obese, /#E24B4A/);
});

// ── renderWeightChart (dead code preserved verbatim from app.js — see module header) ────

test('renderWeightChart shows the empty state with fewer than 2 weight-history entries', () => {
  const { deps, doc } = fakeDeps({ getUserProfile: () => ({ weightHistory: [{ date: 'x', weight: 80 }] }) });
  ProfilePresenter.configure(deps);
  ProfilePresenter.renderWeightChart();
  assert.match(doc._elements['weight-chart'].innerHTML, /הוסף לפחות 2 מדידות משקל/);
});

test('renderWeightChart renders an svg polyline with 2+ weight-history entries', () => {
  const { deps, doc } = fakeDeps({ getUserProfile: () => ({ weightHistory: [{ date: 'a', weight: 82 }, { date: 'b', weight: 80 }, { date: 'c', weight: 79 }] }) });
  ProfilePresenter.configure(deps);
  ProfilePresenter.renderWeightChart();
  assert.match(doc._elements['weight-chart'].innerHTML, /<svg/);
  assert.match(doc._elements['weight-chart'].innerHTML, /<polyline/);
});

// ── renderAchievements ──────────────────────────────────────────────────────────────────

test('renderAchievements shows the unlock icon for earned achievements and a lock for the rest', () => {
  const { deps, doc } = fakeDeps();
  ProfilePresenter.configure(deps);
  ProfilePresenter.renderAchievements();
  const html = doc._elements['achievements-list'].innerHTML;
  assert.match(html, /earned/);
  assert.match(html, /🔥/);
  assert.match(html, /locked/);
  assert.match(html, /🔒/);
});

test('renderAchievements is a no-op with no userProfile', () => {
  const { deps } = fakeDeps({ getUserProfile: () => null });
  ProfilePresenter.configure(deps);
  assert.doesNotThrow(() => ProfilePresenter.renderAchievements());
});
