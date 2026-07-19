// C1-WP4 — js/app/bootstrapController.js unit tests.
// Injected fake repositories prove the profile/day/favourites fetch is issued
// in parallel (PERF-001), matching loadUserData()'s original Promise.all shape.
// Run with: node --test tests/bootstrapController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const BootstrapController = require('../js/app/bootstrapController.js');

test('loadUserSnapshot calls all three repositories with (uid, todayKey) as appropriate, and returns them in [profile, day, favorites] order', async () => {
  const calls = [];
  BootstrapController.configure({
    profileRepository: { loadProfile: (uid) => { calls.push('profile:' + uid); return Promise.resolve({ exists: true, tag: 'profileDoc' }); } },
    dayRepository: { loadDay: (uid, key) => { calls.push('day:' + uid + ':' + key); return Promise.resolve({ exists: true, tag: 'todayDoc' }); } },
    favoritesRepository: { load: (uid) => { calls.push('fav:' + uid); return Promise.resolve({ exists: true, tag: 'favDoc' }); } }
  });
  const [profileDoc, todayDoc, favDoc] = await BootstrapController.loadUserSnapshot('u1', '2026-07-19');
  assert.equal(profileDoc.tag, 'profileDoc');
  assert.equal(todayDoc.tag, 'todayDoc');
  assert.equal(favDoc.tag, 'favDoc');
  assert.deepEqual(calls.sort(), ['day:u1:2026-07-19', 'fav:u1', 'profile:u1'].sort());
});

test('loadUserSnapshot issues all three reads in parallel, not sequentially (PERF-001)', async () => {
  const order = [];
  let profileResolve, dayResolve, favResolve;
  BootstrapController.configure({
    profileRepository: { loadProfile: () => { order.push('profile-called'); return new Promise((res) => { profileResolve = res; }); } },
    dayRepository: { loadDay: () => { order.push('day-called'); return new Promise((res) => { dayResolve = res; }); } },
    favoritesRepository: { load: () => { order.push('fav-called'); return new Promise((res) => { favResolve = res; }); } }
  });
  const p = BootstrapController.loadUserSnapshot('u1', 'k');
  // all three must have been *called* synchronously before any of them resolves —
  // proves Promise.all semantics rather than a sequential await chain.
  assert.deepEqual(order, ['profile-called', 'day-called', 'fav-called']);
  profileResolve({ exists: false });
  dayResolve({ exists: false });
  favResolve({ exists: false });
  await p;
});

test('loadUserSnapshot rejects if any of the three reads rejects (Promise.all fail-fast semantics preserved)', async () => {
  BootstrapController.configure({
    profileRepository: { loadProfile: () => Promise.resolve({ exists: false }) },
    dayRepository: { loadDay: () => Promise.reject(new Error('offline')) },
    favoritesRepository: { load: () => Promise.resolve({ exists: false }) }
  });
  await assert.rejects(() => BootstrapController.loadUserSnapshot('u1', 'k'), /offline/);
});
