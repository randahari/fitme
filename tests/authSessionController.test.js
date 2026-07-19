// C1-WP4 — js/app/authSessionController.js unit tests.
// A fake SessionLifecycle/RuntimeState/repository set of collaborators is injected via
// configure() so the full auth transition state machine is testable without a browser.
// Run with: node --test tests/authSessionController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const AuthSessionController = require('../js/app/authSessionController.js');

function fakeSessionLifecycle() {
  var gen = 0;
  var resetCalls = [];
  return {
    resetCalls: resetCalls,
    reset: function (reason) { gen++; resetCalls.push(reason); return gen; },
    isCurrent: function (g) { return g === gen; },
    getGeneration: function () { return gen; },
    // test-only helper to simulate a session changing mid-flight
    _forceStale: function () { gen++; }
  };
}

function fakeRuntimeState() {
  var profile = null;
  var user = null;
  var calls = [];
  return {
    calls: calls,
    _setProfileForTest: function (p) { profile = p; },
    getCurrentUser: function () { return user; },
    setAuthenticatedUser: function (u) { calls.push(['setAuthenticatedUser', u]); user = u; },
    getProfile: function () { return profile; },
    replaceProfile: function (p) { calls.push(['replaceProfile', p]); profile = p; },
    getDisplayedDay: function () { return { meals: [], burned: 0, steps: 0 }; },
    replaceDisplayedDay: function () {},
    resetForSession: function () { calls.push(['resetForSession']); user = null; profile = null; }
  };
}

function baseDeps(overrides) {
  var log = [];
  var sessionLifecycle = fakeSessionLifecycle();
  var runtimeState = fakeRuntimeState();
  var deps = {
    authAdapter: { onAuthStateChanged: function (cb) { deps._cb = cb; } },
    sessionLifecycle: sessionLifecycle,
    runtimeState: runtimeState,
    loadUserData: function () { log.push('loadUserData'); return Promise.resolve(); },
    showApp: function () { log.push('showApp'); },
    showOnboarding: function () { log.push('showOnboarding'); },
    showLogin: function () { log.push('showLogin'); },
    initNotifications: function () { log.push('initNotifications'); },
    migrateIfNeeded: function () { log.push('migrateIfNeeded'); },
    onSignedOut: function () { log.push('onSignedOut'); }
  };
  Object.assign(deps, overrides);
  return { deps: deps, log: log, sessionLifecycle: sessionLifecycle, runtimeState: runtimeState };
}

test('signed-in with an existing profile: reset -> setAuthenticatedUser -> loadUserData -> showApp -> initNotifications -> migrateIfNeeded, in order', async () => {
  const { deps, log, runtimeState, sessionLifecycle } = baseDeps();
  AuthSessionController.configure(deps);
  runtimeState._setProfileForTest(null); // loadUserData is expected to populate it — simulate that here
  deps.loadUserData = function () { log.push('loadUserData'); runtimeState._setProfileForTest({ name: 'Dana' }); return Promise.resolve(); };
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  assert.deepEqual(sessionLifecycle.resetCalls, ['auth:signed-in']);
  assert.deepEqual(log, ['loadUserData', 'showApp', 'initNotifications', 'migrateIfNeeded']);
  assert.deepEqual(runtimeState.calls, [['setAuthenticatedUser', { uid: 'u1' }]]);
  assert.equal(runtimeState.getCurrentUser().uid, 'u1');
});

test('signed-in without a profile (onboarding case): showOnboarding is called; showApp/initNotifications/migrateIfNeeded are not', async () => {
  const { deps, log } = baseDeps();
  AuthSessionController.configure(deps);
  // loadUserData leaves the profile null (new user, no Firestore doc yet)
  await AuthSessionController.handleAuthStateChange({ uid: 'u2' });
  assert.deepEqual(log, ['loadUserData', 'showOnboarding']);
});

test('signed-out: reset reason is auth:signed-out, identity is cleared via RuntimeState, onSignedOut runs, then showLogin', async () => {
  const { deps, log, runtimeState, sessionLifecycle } = baseDeps();
  AuthSessionController.configure(deps);
  await AuthSessionController.handleAuthStateChange(null);
  assert.deepEqual(sessionLifecycle.resetCalls, ['auth:signed-out']);
  assert.deepEqual(runtimeState.calls, [['setAuthenticatedUser', null], ['replaceProfile', null]]);
  assert.deepEqual(log, ['onSignedOut', 'showLogin']);
});

test('generation increments before any state/UI callback runs (generation-before-cleanup ordering)', async () => {
  const { deps, sessionLifecycle } = baseDeps();
  var genAtFirstCallback = null;
  deps.loadUserData = function () { genAtFirstCallback = sessionLifecycle.getGeneration(); return Promise.resolve(); };
  AuthSessionController.configure(deps);
  const genBefore = sessionLifecycle.getGeneration();
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  assert.equal(genAtFirstCallback, genBefore + 1, 'generation must already be incremented before loadUserData (and therefore before any cleanup-dependent callback) runs');
});

test('stale async suppression: if the session changes during loadUserData, neither showApp nor showOnboarding fires', async () => {
  const { deps, log, sessionLifecycle } = baseDeps();
  deps.loadUserData = function () {
    log.push('loadUserData');
    sessionLifecycle._forceStale(); // simulate a second auth event racing in during the await
    return Promise.resolve();
  };
  AuthSessionController.configure(deps);
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  assert.deepEqual(log, ['loadUserData']);
  assert.ok(!log.includes('showApp'));
  assert.ok(!log.includes('showOnboarding'));
});

test('migrateIfNeeded is invoked on every authenticated-with-profile transition (retry-per-session), not just the first', async () => {
  const { deps, log, runtimeState } = baseDeps();
  deps.loadUserData = function () { runtimeState._setProfileForTest({ name: 'Dana' }); return Promise.resolve(); };
  AuthSessionController.configure(deps);
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  log.length = 0;
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  assert.ok(log.includes('migrateIfNeeded'), 'migrateIfNeeded must be called again on the second authenticated session, not skipped');
});

test('showApp/initNotifications/migrateIfNeeded are fired without being awaited (non-blocking engine startup preserved)', async () => {
  const { deps, log, runtimeState } = baseDeps();
  var showAppResolvers = [];
  deps.loadUserData = function () { runtimeState._setProfileForTest({ name: 'Dana' }); return Promise.resolve(); };
  deps.showApp = function () {
    log.push('showApp-called');
    return new Promise(function () { /* never resolves */ });
  };
  AuthSessionController.configure(deps);
  await AuthSessionController.handleAuthStateChange({ uid: 'u1' });
  // handleAuthStateChange resolved even though showApp's own return value never would —
  // proves showApp is called fire-and-forget, not awaited.
  assert.ok(log.includes('showApp-called'));
});

test('start() subscribes handleAuthStateChange to the injected AuthAdapter', () => {
  const { deps } = baseDeps();
  AuthSessionController.configure(deps);
  var registered = null;
  deps.authAdapter = { onAuthStateChanged: function (cb) { registered = cb; } };
  AuthSessionController.configure(deps);
  AuthSessionController.start();
  assert.equal(registered, AuthSessionController.handleAuthStateChange);
});
