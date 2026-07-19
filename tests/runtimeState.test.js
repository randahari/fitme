// C1-WP4 — js/app/runtimeState.js unit tests.
// Injected closures stand in for app.js's bare currentUser/userProfile/todayData
// variables, exactly as app.js itself wires them via configure().
// Run with: node --test tests/runtimeState.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const RuntimeState = require('../js/app/runtimeState.js');

function fakeStore() {
  var store = { currentUser: null, profile: null, displayedDay: { meals: [], burned: 0, steps: 0 } };
  RuntimeState.configure({
    getCurrentUser: function () { return store.currentUser; },
    setCurrentUser: function (u) { store.currentUser = u; },
    getProfile: function () { return store.profile; },
    setProfile: function (p) { store.profile = p; },
    getDisplayedDay: function () { return store.displayedDay; },
    setDisplayedDay: function (d) { store.displayedDay = d; }
  });
  return store;
}

test('getCurrentUser/setAuthenticatedUser round-trip through the injected closures', () => {
  var store = fakeStore();
  assert.equal(RuntimeState.getCurrentUser(), null);
  var user = { uid: 'u1' };
  RuntimeState.setAuthenticatedUser(user);
  assert.equal(RuntimeState.getCurrentUser(), user);
  assert.equal(store.currentUser, user);
});

test('getProfile/replaceProfile round-trip through the injected closures', () => {
  var store = fakeStore();
  var profile = { name: 'Dana' };
  RuntimeState.replaceProfile(profile);
  assert.equal(RuntimeState.getProfile(), profile);
  assert.equal(store.profile, profile);
});

test('getDisplayedDay/replaceDisplayedDay round-trip through the injected closures', () => {
  var store = fakeStore();
  var snapshot = { meals: [{ kcal: 100 }], burned: 50, steps: 200 };
  RuntimeState.replaceDisplayedDay(snapshot);
  assert.equal(RuntimeState.getDisplayedDay(), snapshot);
  assert.equal(store.displayedDay, snapshot);
});

test('resetForSession clears currentUser, profile, and displayedDay to their exact default shapes', () => {
  var store = fakeStore();
  RuntimeState.setAuthenticatedUser({ uid: 'u1' });
  RuntimeState.replaceProfile({ name: 'Dana' });
  RuntimeState.replaceDisplayedDay({ meals: [{ kcal: 900 }], burned: 10, steps: 5 });
  RuntimeState.resetForSession();
  assert.equal(RuntimeState.getCurrentUser(), null);
  assert.equal(RuntimeState.getProfile(), null);
  assert.deepEqual(RuntimeState.getDisplayedDay(), { meals: [], burned: 0, steps: 0 });
});

test('resetForSession does not touch any state beyond currentUser/profile/displayedDay', () => {
  var store = fakeStore();
  store.unrelatedDomainFlag = 'untouched';
  RuntimeState.resetForSession();
  assert.equal(store.unrelatedDomainFlag, 'untouched');
});

test('the public API exposes only the seven closed semantic accessors plus configure — no generic get/set', () => {
  var keys = Object.keys(RuntimeState).sort();
  assert.deepEqual(keys, [
    'configure', 'getCurrentUser', 'getDisplayedDay', 'getProfile',
    'replaceDisplayedDay', 'replaceProfile', 'resetForSession', 'setAuthenticatedUser'
  ]);
});
