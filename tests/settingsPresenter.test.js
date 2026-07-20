// C1-WP10 — js/ui/settingsPresenter.js unit tests.
// Covers: renderSettings' base profile-summary DOM updates plus the three consolidated wrap
// layers in exact call order — plan-targets/weekly-menu/version-tag (was `_origRenderSettings`),
// renderAdaptiveSettings (was `_s4_renderSettings`), and renderUsage (was
// `_s5_renderSettings_u`) — via injected DOM/state closures, matching the consolidated app.js
// behaviour exactly (docs/architecture/C1_WP0_INVENTORY.md §2.1).
// Run with: node --test tests/settingsPresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const SettingsPresenter = require('../js/ui/settingsPresenter.js');

function fakeElement(overrides) {
  return Object.assign({ textContent: '', innerHTML: '', querySelector: () => null, classList: { on: false, add(cls) { this.on = cls === 'on' ? true : this.on; } } }, overrides);
}

function fakeDocument(overrides) {
  const elements = {};
  [
    'profile-avatar', 'profile-name', 'profile-sub', 's-kcal', 'fav-foods-display',
    'dark-toggle', 'settings-group-code', 'plan-targets-settings', 'weekly-menu-settings',
    'screen-settings'
  ].forEach((id) => { elements[id] = fakeElement(); });
  const doc = {
    getElementById: (id) => elements[id] || null,
    createElement: () => fakeElement({ style: {}, appendChild() {} }),
    _elements: elements
  };
  Object.assign(doc, overrides);
  return doc;
}

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };

function fakeDeps(overrides) {
  const calls = [];
  const userProfile = {
    name: 'רן', weight: 80, height: 180, age: 30, goal: 'cut', goalKcal: 1800,
    foods: ['עוף', 'אורז'], groupId: 'ABC123'
  };
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    getUserProfile: () => userProfile,
    getDarkMode: () => false,
    goalLabels: GOAL_LABELS,
    appVersion: '2.39.0',
    renderCoachSettings: () => calls.push('renderCoachSettings'),
    renderAdaptiveSettings: () => calls.push('renderAdaptiveSettings'),
    renderUsage: () => calls.push('renderUsage')
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc, userProfile };
}

test('renderSettings is a no-op with no userProfile', () => {
  const { deps, calls } = fakeDeps({ getUserProfile: () => null });
  SettingsPresenter.configure(deps);
  assert.doesNotThrow(() => SettingsPresenter.renderSettings());
  assert.deepEqual(calls, []);
});

test('renderSettings fills avatar initials/name/sub/kcal/favourites/group-code DOM', () => {
  const { deps, doc } = fakeDeps();
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.equal(doc._elements['profile-avatar'].textContent, 'רן');
  assert.equal(doc._elements['profile-name'].textContent, 'רן');
  assert.match(doc._elements['profile-sub'].textContent, /80 ק"ג · 180 ס"מ · גיל 30 · חיטוב 🔥/);
  assert.match(doc._elements['s-kcal'].textContent, /1,800 קל'/);
  assert.match(doc._elements['fav-foods-display'].innerHTML, /עוף/);
  assert.equal(doc._elements['settings-group-code'].textContent, 'ABC123');
});

test('renderSettings shows "--" for group code when unset', () => {
  const { deps, doc } = fakeDeps({});
  deps.getUserProfile = () => ({ name: 'רן', weight: 80, height: 180, age: 30, goal: 'cut', goalKcal: 1800, foods: [] });
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.equal(doc._elements['settings-group-code'].textContent, '--');
});

test('renderSettings toggles dark-toggle "on" only when darkMode is true', () => {
  const { deps, doc } = fakeDeps({ getDarkMode: () => true });
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.equal(doc._elements['dark-toggle'].classList.on, true);

  const { deps: deps2, doc: doc2 } = fakeDeps({ getDarkMode: () => false });
  SettingsPresenter.configure(deps2);
  SettingsPresenter.renderSettings();
  assert.equal(doc2._elements['dark-toggle'].classList.on, false);
});

test('renderSettings calls renderCoachSettings, then renderAdaptiveSettings, then renderUsage, in that exact order', () => {
  const { deps, calls } = fakeDeps();
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.deepEqual(calls, ['renderCoachSettings', 'renderAdaptiveSettings', 'renderUsage']);
});

test('renderSettings computes plan-targets-settings from goal-dependent protein multiplier (bulk=2, cut=2.2, maintain=1.8)', () => {
  const { deps, doc } = fakeDeps();
  deps.getUserProfile = () => ({ name: 'רן', weight: 100, height: 180, age: 30, goal: 'bulk', goalKcal: 3000, foods: [] });
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  // bulk: p = round(100*2) = 200
  assert.match(doc._elements['plan-targets-settings'].innerHTML, /200g/);
});

test('renderSettings renders the weekly menu into weekly-menu-settings only when userProfile.weeklyMenu is set', () => {
  const { deps, doc } = fakeDeps();
  deps.getUserProfile = () => ({
    name: 'רן', weight: 80, height: 180, age: 30, goal: 'cut', goalKcal: 1800, foods: [],
    weeklyMenu: [{ day: 'יום א', breakfast: 'ביצים', lunch: 'עוף', dinner: 'דג', snack: 'אגוזים' }]
  });
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.match(doc._elements['weekly-menu-settings'].innerHTML, /ביצים/);
});

test('renderSettings creates the version tag once (fitme-version-tag) and updates it in place on subsequent renders', () => {
  const appended = [];
  const scroll = { appendChild: (el) => appended.push(el) };
  const screenSettings = fakeElement({ querySelector: () => scroll });
  const { deps, doc } = fakeDeps();
  doc._elements['screen-settings'] = screenSettings;
  let created = null;
  doc.createElement = () => { created = fakeElement({ style: {} }); return created; };
  SettingsPresenter.configure(deps);
  SettingsPresenter.renderSettings();
  assert.equal(appended.length, 1);
  assert.equal(created.id, 'fitme-version-tag');
  assert.match(created.textContent, /FitMe · v2\.39\.0/);

  // second render: element already exists (simulate by registering it under its id)
  doc._elements['fitme-version-tag'] = created;
  SettingsPresenter.renderSettings();
  assert.equal(appended.length, 1, 'must not append a second version tag');
  assert.match(created.textContent, /FitMe · v2\.39\.0/);
});
