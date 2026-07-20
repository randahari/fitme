// C1-WP10 — js/ui/navigationController.js unit tests.
// Covers: goToScreen's screen/nav-button toggling, per-screen render dispatch (home/food/
// profile/settings/workout), and the food-screen date-banner refresh — all via injected DOM/
// callback closures, matching the consolidated app.js behaviour exactly (base "4-tab version"
// override + Day Navigation IIFE wrap, see docs/architecture/C1_WP0_INVENTORY.md §2.2).
// Run with: node --test tests/navigationController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NavigationController = require('../js/ui/navigationController.js');

function fakeElement() {
  return { classList: { removed: false, added: false, remove(cls) { this.removed = cls; }, add(cls) { this.added = cls; } } };
}

function fakeDocument() {
  const elements = {};
  ['screen-home', 'nav-home', 'screen-food', 'nav-food', 'screen-profile', 'nav-profile',
    'screen-settings', 'nav-settings', 'screen-workout', 'nav-workout'
  ].forEach((id) => { elements[id] = fakeElement(); });
  const groups = { '.screen': [fakeElement(), fakeElement()], '.nav-btn': [fakeElement(), fakeElement()] };
  return {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => groups[sel] || [],
    _elements: elements,
    _groups: groups
  };
}

function fakeDeps(overrides) {
  const calls = [];
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    renderHome: () => calls.push('renderHome'),
    renderFoodMeals: () => calls.push('renderFoodMeals'),
    renderFavoritesList: () => calls.push('renderFavoritesList'),
    renderQuickStrip: () => calls.push('renderQuickStrip'),
    maybeShowQuickLearn: () => calls.push('maybeShowQuickLearn'),
    renderProfile: () => calls.push('renderProfile'),
    renderSettings: () => calls.push('renderSettings'),
    updateWorkout: () => calls.push('updateWorkout'),
    updateFoodDateBanner: () => calls.push('updateFoodDateBanner')
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc };
}

test('goToScreen clears all .screen/.nav-btn active classes, then activates screen-<name>/nav-<name> if present', () => {
  const { deps, doc } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('home');
  doc._groups['.screen'].forEach((s) => assert.equal(s.classList.removed, 'active'));
  doc._groups['.nav-btn'].forEach((b) => assert.equal(b.classList.removed, 'active'));
  assert.equal(doc._elements['screen-home'].classList.added, 'active');
  assert.equal(doc._elements['nav-home'].classList.added, 'active');
});

test('goToScreen("home") calls only renderHome()', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('home');
  assert.deepEqual(calls, ['renderHome']);
});

test('goToScreen("food") calls renderFoodMeals/renderFavoritesList/renderQuickStrip/maybeShowQuickLearn, then updateFoodDateBanner last', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('food');
  assert.deepEqual(calls, ['renderFoodMeals', 'renderFavoritesList', 'renderQuickStrip', 'maybeShowQuickLearn', 'updateFoodDateBanner']);
});

test('goToScreen("profile") calls only renderProfile()', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('profile');
  assert.deepEqual(calls, ['renderProfile']);
});

test('goToScreen("settings") calls only renderSettings()', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('settings');
  assert.deepEqual(calls, ['renderSettings']);
});

test('goToScreen("workout") calls only updateWorkout()', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  NavigationController.goToScreen('workout');
  assert.deepEqual(calls, ['updateWorkout']);
});

test('goToScreen is a no-op render-wise for unknown screen names, but does not throw when screen-<name>/nav-<name> elements are missing', () => {
  const { deps, calls } = fakeDeps();
  NavigationController.configure(deps);
  assert.doesNotThrow(() => NavigationController.goToScreen('unknown-screen'));
  assert.deepEqual(calls, []);
});

test('updateFoodDateBanner is only called for the food screen, never for other screens', () => {
  ['home', 'profile', 'settings', 'workout'].forEach((name) => {
    const { deps, calls } = fakeDeps();
    NavigationController.configure(deps);
    NavigationController.goToScreen(name);
    assert.ok(!calls.includes('updateFoodDateBanner'), name + ' must not trigger updateFoodDateBanner');
  });
});
