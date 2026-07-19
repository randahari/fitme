// C1-WP3 — js/repositories/profileRepository.js unit tests.
// A minimal fake Firestore db is injected via configure() so the exact
// collection/doc path and payload shape are testable without a real SDK.
// Run with: node --test tests/profileRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ProfileRepository = require('../js/repositories/profileRepository.js');

function fakeDb() {
  const calls = [];
  const doc = {
    get: () => { calls.push({ op: 'get' }); return Promise.resolve({ exists: true, data: () => ({ name: 'Dana' }) }); },
    set: (payload, options) => { calls.push({ op: 'set', payload, options }); return Promise.resolve(); }
  };
  return {
    calls,
    collection: (name) => ({
      doc: (id) => { calls.push({ op: 'doc', collection: name, id }); return doc; }
    })
  };
}

test('loadProfile reads users/{uid} with .get()', async () => {
  const db = fakeDb();
  ProfileRepository.configure({ db });
  const result = await ProfileRepository.loadProfile('u1');
  assert.deepEqual(db.calls[0], { op: 'doc', collection: 'users', id: 'u1' });
  assert.deepEqual(db.calls[1], { op: 'get' });
  assert.equal(result.exists, true);
  assert.deepEqual(result.data(), { name: 'Dana' });
});

test('mergeProfile writes users/{uid} with merge:true and the exact profile object', async () => {
  const db = fakeDb();
  ProfileRepository.configure({ db });
  const profile = { name: 'Dana', groupId: 'ABC123' };
  await ProfileRepository.mergeProfile('u1', profile);
  assert.deepEqual(db.calls[0], { op: 'doc', collection: 'users', id: 'u1' });
  assert.deepEqual(db.calls[1], { op: 'set', payload: profile, options: { merge: true } });
});
