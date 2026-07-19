// C1-WP3 — js/repositories/groupRepository.js unit tests.
// Run with: node --test tests/groupRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const GroupRepository = require('../js/repositories/groupRepository.js');

test('getMembers builds member objects from sequential profile+today-doc reads, skipping members with no profile doc', async () => {
  const memberDocs = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
  const profiles = {
    u1: { exists: true, data: () => ({ name: 'Dana', goalKcal: 2000, streak: 5 }) },
    u2: { exists: false }, // no profile doc — must be skipped entirely
    u3: { exists: true, data: () => ({ name: 'Noa', goalKcal: 1800 }) } // no streak field -> defaults to 0
  };
  const todays = {
    u1: { exists: true, data: () => ({ meals: [{ kcal: 300 }, { kcal: 200 }] }) },
    u3: { exists: false }
  };
  const calls = [];
  const db = {
    collection: (name) => {
      if (name === 'groups') {
        return { doc: () => ({ collection: () => ({ get: () => Promise.resolve({ docs: memberDocs }) }) }) };
      }
      // name === 'users'
      return {
        doc: (uid) => ({
          get: () => { calls.push('profile:' + uid); return Promise.resolve(profiles[uid]); },
          collection: () => ({
            doc: () => ({ get: () => { calls.push('today:' + uid); return Promise.resolve(todays[uid] || { exists: false }); } })
          })
        })
      };
    }
  };
  GroupRepository.configure({ db });
  const members = await GroupRepository.getMembers('G1', 'u1', '2026-07-19');
  assert.deepEqual(members, [
    { uid: 'u1', name: 'Dana', goal: 2000, kcal: 500, streak: 5, isMe: true },
    { uid: 'u3', name: 'Noa', goal: 1800, kcal: 0, streak: 0, isMe: false }
  ]);
  // sequential, not parallel: today-doc for u1 must be read before profile for u3
  assert.deepEqual(calls, ['profile:u1', 'today:u1', 'profile:u2', 'profile:u3', 'today:u3']);
});

test('getMembers returns [] when the members query rejects', async () => {
  const db = { collection: () => ({ doc: () => ({ collection: () => ({ get: () => Promise.reject(new Error('down')) }) }) }) };
  GroupRepository.configure({ db });
  const members = await GroupRepository.getMembers('G1', 'u1', '2026-07-19');
  assert.deepEqual(members, []);
});

test('groupExists returns true from the group doc alone and never queries members (short-circuit)', async () => {
  let membersQueried = false;
  const db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: true }),
        collection: () => ({ limit: () => ({ get: () => { membersQueried = true; return Promise.resolve({ size: 0 }); } }) })
      })
    })
  };
  GroupRepository.configure({ db });
  const exists = await GroupRepository.groupExists('ABCD');
  assert.equal(exists, true);
  assert.equal(membersQueried, false);
});

test('groupExists falls back to a limit(1) members query when the group doc does not exist', async () => {
  const db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        collection: () => ({ limit: (n) => { assert.equal(n, 1); return { get: () => Promise.resolve({ size: 1 }) }; } })
      })
    })
  };
  GroupRepository.configure({ db });
  const exists = await GroupRepository.groupExists('ABCD');
  assert.equal(exists, true);
});

test('groupExists returns false when neither the group doc nor any member exists', async () => {
  const db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        collection: () => ({ limit: () => ({ get: () => Promise.resolve({ size: 0 }) }) })
      })
    })
  };
  GroupRepository.configure({ db });
  const exists = await GroupRepository.groupExists('ABCD');
  assert.equal(exists, false);
});

test('addMember writes groups/{id}/members/{uid} with { joinedAt: serverTimestamp() }', async () => {
  const calls = [];
  const db = {
    collection: (name) => ({
      doc: (id) => {
        calls.push({ collection: name, id });
        return { collection: (sub) => ({ doc: (subId) => ({ set: (payload) => { calls.push({ collection: sub, id: subId, payload }); return Promise.resolve(); } }) }) };
      }
    })
  };
  GroupRepository.configure({ db, serverTimestamp: () => 'TS' });
  await GroupRepository.addMember('G1', 'u9');
  assert.deepEqual(calls, [
    { collection: 'groups', id: 'G1' },
    { collection: 'members', id: 'u9', payload: { joinedAt: 'TS' } }
  ]);
});
