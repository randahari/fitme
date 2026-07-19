// C1-WP2 — js/adapters/authAdapter.js unit tests.
// Run with: node --test tests/authAdapter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const AuthAdapter = require('../js/adapters/authAdapter.js');

test('onAuthStateChanged delegates to auth.onAuthStateChanged with the given callback', () => {
  let capturedCb = null;
  AuthAdapter.configure({ auth: { onAuthStateChanged: (cb) => { capturedCb = cb; return 'unsub'; } } });
  const cb = () => {};
  const result = AuthAdapter.onAuthStateChanged(cb);
  assert.equal(capturedCb, cb);
  assert.equal(result, 'unsub');
});

test('signOut delegates to auth.signOut', async () => {
  let called = false;
  AuthAdapter.configure({ auth: { signOut: async () => { called = true; } } });
  await AuthAdapter.signOut();
  assert.equal(called, true);
});

test('getIdToken delegates to the given user object, not to auth', async () => {
  const user = { getIdToken: async () => 'the-token' };
  assert.equal(await AuthAdapter.getIdToken(user), 'the-token');
});

test('handleRedirectResult delegates to auth.getRedirectResult', () => {
  const marker = Promise.resolve('x');
  AuthAdapter.configure({ auth: { getRedirectResult: () => marker } });
  assert.equal(AuthAdapter.handleRedirectResult(), marker);
});

test('signInWithGoogle: popup succeeds -> SUCCESS, no redirect attempted', async () => {
  let redirectCalled = false;
  AuthAdapter.configure({
    auth: { signInWithPopup: async () => {}, signInWithRedirect: async () => { redirectCalled = true; } },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'SUCCESS' });
  assert.equal(redirectCalled, false);
});

test('signInWithGoogle: popup blocked, redirect succeeds -> REDIRECTING', async () => {
  AuthAdapter.configure({
    auth: {
      signInWithPopup: async () => { const e = new Error('blocked'); e.code = 'auth/popup-blocked'; throw e; },
      signInWithRedirect: async () => {}
    },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'REDIRECTING' });
});

test('signInWithGoogle: popup closed by user (fallback code), redirect also fails -> ERROR with the redirect error', async () => {
  AuthAdapter.configure({
    auth: {
      signInWithPopup: async () => { const e = new Error('closed'); e.code = 'auth/popup-closed-by-user'; throw e; },
      signInWithRedirect: async () => { const e2 = new Error('redirect failed'); e2.code = 'auth/redirect-cancelled-by-user'; throw e2; }
    },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'ERROR', code: 'auth/redirect-cancelled-by-user', message: 'redirect failed' });
});

test('signInWithGoogle: network failure -> ERROR with the network code, no redirect attempted', async () => {
  let redirectCalled = false;
  AuthAdapter.configure({
    auth: {
      signInWithPopup: async () => { const e = new Error('offline'); e.code = 'auth/network-request-failed'; throw e; },
      signInWithRedirect: async () => { redirectCalled = true; }
    },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'ERROR', code: 'auth/network-request-failed', message: null });
  assert.equal(redirectCalled, false);
});

test('signInWithGoogle: other non-fallback error code -> ERROR with that code, no redirect attempted', async () => {
  let redirectCalled = false;
  AuthAdapter.configure({
    auth: {
      signInWithPopup: async () => { const e = new Error('nope'); e.code = 'auth/user-disabled'; throw e; },
      signInWithRedirect: async () => { redirectCalled = true; }
    },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'ERROR', code: 'auth/user-disabled', message: null });
  assert.equal(redirectCalled, false);
});

test('signInWithGoogle: popup rejects with no error code at all -> CANCELLED, no alert-worthy result', async () => {
  AuthAdapter.configure({
    auth: { signInWithPopup: async () => { throw new Error('user closed it'); }, signInWithRedirect: async () => {} },
    googleProvider: {}
  });
  const result = await AuthAdapter.signInWithGoogle();
  assert.deepEqual(result, { status: 'CANCELLED' });
});
