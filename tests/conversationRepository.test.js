// CCC-001 (docs/specs/CCC_001_SPEC_v1.0.md §5) — js/repositories/conversationRepository.js
// unit tests. A minimal fake Firestore db is injected via configure(), mirroring
// tests/errorLogRepository.test.js's own established fake-db convention exactly.
// Run with: node --test tests/conversationRepository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ConversationRepository = require('../js/repositories/conversationRepository.js');

function fakeDbForWrite() {
  const calls = [];
  return {
    calls,
    collection: (name) => {
      calls.push({ op: 'collection', name });
      return {
        doc: (id) => {
          calls.push({ op: 'doc', collection: name, id });
          return {
            collection: (sub) => {
              calls.push({ op: 'subcollection', name: sub });
              return {
                doc: (subId) => {
                  calls.push({ op: 'doc', collection: sub, id: subId });
                  return {
                    set: (payload) => { calls.push({ op: 'set', payload }); return Promise.resolve(); },
                    update: (payload) => { calls.push({ op: 'update', payload }); return Promise.resolve(); }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

// A — create shape/path
test('A: createPending() writes users/{uid}/coachConversation/{turnId} with the exact V1 PENDING shape', async () => {
  const db = fakeDbForWrite();
  const st = () => 'SERVER_TS';
  ConversationRepository.configure({ db, serverTimestamp: st });
  await ConversationRepository.createPending('u1', 'turn_abc', { userText: 'שלום', submittedAt: 12345 });

  assert.deepEqual(db.calls.slice(0, 4), [
    { op: 'collection', name: 'users' },
    { op: 'doc', collection: 'users', id: 'u1' },
    { op: 'subcollection', name: 'coachConversation' },
    { op: 'doc', collection: 'coachConversation', id: 'turn_abc' }
  ]);
  const setCall = db.calls.find((c) => c.op === 'set');
  assert.deepEqual(setCall.payload, {
    userText: 'שלום', assistantText: null, status: 'PENDING',
    submittedAt: 12345, completedAt: null, createdAt: 'SERVER_TS'
  });
});

// C/D/F — completeTurn shape: proves the CODE itself never sends userText/submittedAt/createdAt
// on an update, and only ever the fields a completion transition should touch (Firestore Rules,
// tested separately, enforce this server-side too — this test proves the client-side discipline
// independently, per the repository's own "code + rules, not rules alone" pattern).
test('C/F: completeTurn(status COMPLETED) sends ONLY status/assistantText/completedAt — never userText/submittedAt/createdAt', async () => {
  const db = fakeDbForWrite();
  ConversationRepository.configure({ db, serverTimestamp: () => 'TS2' });
  await ConversationRepository.completeTurn('u1', 'turn_abc', { status: 'COMPLETED', assistantText: 'תשובת המאמן' });
  const updateCall = db.calls.find((c) => c.op === 'update');
  assert.deepEqual(Object.keys(updateCall.payload).sort(), ['assistantText', 'completedAt', 'status']);
  assert.deepEqual(updateCall.payload, { status: 'COMPLETED', assistantText: 'תשובת המאמן', completedAt: 'TS2' });
});

test('D: completeTurn(status SILENCE) sends assistantText: null', async () => {
  const db = fakeDbForWrite();
  ConversationRepository.configure({ db, serverTimestamp: () => 'TS3' });
  await ConversationRepository.completeTurn('u1', 'turn_xyz', { status: 'SILENCE', assistantText: null });
  const updateCall = db.calls.find((c) => c.op === 'update');
  assert.deepEqual(updateCall.payload, { status: 'SILENCE', assistantText: null, completedAt: 'TS3' });
});

test('completeTurn() uses Firestore update() (requires the document to already exist), never set() or set(merge)', async () => {
  const db = fakeDbForWrite();
  ConversationRepository.configure({ db, serverTimestamp: () => 'TS4' });
  await ConversationRepository.completeTurn('u1', 'turn_abc', { status: 'COMPLETED', assistantText: 'x' });
  assert.equal(db.calls.some((c) => c.op === 'set'), false, 'completeTurn must never call set()');
  assert.equal(db.calls.some((c) => c.op === 'update'), true);
});

// A minimal fake supporting the full orderBy -> orderBy -> [startAfter] -> limit -> get chain
// (CURSOR STABILITY CORRECTION: a second, compound orderBy — the documentId() tie-breaker — was
// added, so this fake's query node must support being chained through .orderBy() more than
// once), used for both the no-cursor (display/first-page) and cursor (pagination) call shapes.
// A distinct DOC_ID_FIELD_SENTINEL stands in for the real (live-SDK-only) FieldPath.documentId()
// value, injected via configure({ documentIdField }) exactly like the repository's real
// firebase.firestore.FieldPath.documentId() injection in js/app.js.
const DOC_ID_FIELD_SENTINEL = 'DOC_ID_FIELD_SENTINEL';
function fakeDbForQuery(docs) {
  const calls = [];
  function makeQueryNode() {
    return {
      orderBy: (field, dir) => {
        calls.push({ op: 'orderBy', field, dir });
        return makeQueryNode();
      },
      startAfter: (...cursorValues) => {
        calls.push({ op: 'startAfter', cursorValues });
        return makeQueryNode();
      },
      limit: (n) => {
        calls.push({ op: 'limit', n });
        return { get: () => Promise.resolve({ forEach: (cb) => docs.forEach(cb) }) };
      }
    };
  }
  const db = {
    calls,
    collection: (name) => {
      calls.push({ op: 'collection', name });
      return {
        doc: (id) => {
          calls.push({ op: 'doc', id });
          return {
            collection: (sub) => {
              calls.push({ op: 'subcollection', name: sub });
              return makeQueryNode();
            }
          };
        }
      };
    }
  };
  return db;
}

// G — fetchRecent query correctness (no cursor — the display path's own exact, unchanged shape)
test('G: fetchRecent() with no cursor queries users/{uid}/coachConversation ordered by createdAt desc then documentId() desc (cursor-stability tie-breaker), with the given limit, no status filter, no startAfter', async () => {
  const docs = [
    { id: 'turn_2', data: () => ({ userText: 'second', assistantText: 'reply2', status: 'COMPLETED', submittedAt: 2, completedAt: 'TS', createdAt: 'CT2' }) },
    { id: 'turn_1', data: () => ({ userText: 'first', assistantText: null, status: 'PENDING', submittedAt: 1, completedAt: null, createdAt: 'CT1' }) }
  ];
  const db = fakeDbForQuery(docs);
  ConversationRepository.configure({ db, documentIdField: () => DOC_ID_FIELD_SENTINEL });
  const records = await ConversationRepository.fetchRecent('u1', 50);
  assert.deepEqual(db.calls, [
    { op: 'collection', name: 'users' },
    { op: 'doc', id: 'u1' },
    { op: 'subcollection', name: 'coachConversation' },
    { op: 'orderBy', field: 'createdAt', dir: 'desc' },
    { op: 'orderBy', field: DOC_ID_FIELD_SENTINEL, dir: 'desc' },
    { op: 'limit', n: 50 }
  ]);
  assert.equal(db.calls.some((c) => c.op === 'startAfter'), false, 'the no-cursor (display) call must never invoke startAfter');
  assert.equal(records.length, 2);
  assert.deepEqual(records[0], { turnId: 'turn_2', userText: 'second', assistantText: 'reply2', status: 'COMPLETED', submittedAt: 2, completedAt: 'TS', createdAt: 'CT2' });
  assert.deepEqual(records[1], { turnId: 'turn_1', userText: 'first', assistantText: null, status: 'PENDING', submittedAt: 1, completedAt: null, createdAt: 'CT1' });
});

// PRODUCT-5 (pagination correction) — a cursor supplied invokes startAfter with EXACTLY that value
test('PRODUCT-5: fetchRecent() with a cursor invokes .startAfter(afterCreatedAt) between the two orderBy clauses and limit — the pagination contract Memory Layer\'s own loop depends on', async () => {
  const docs = [{ id: 'turn_1', data: () => ({ userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1, completedAt: 'TS', createdAt: 'CT1' }) }];
  const db = fakeDbForQuery(docs);
  ConversationRepository.configure({ db, documentIdField: () => DOC_ID_FIELD_SENTINEL });
  await ConversationRepository.fetchRecent('u1', 10, 'CURSOR_VALUE', 'CURSOR_TURN_ID');
  assert.deepEqual(db.calls, [
    { op: 'collection', name: 'users' },
    { op: 'doc', id: 'u1' },
    { op: 'subcollection', name: 'coachConversation' },
    { op: 'orderBy', field: 'createdAt', dir: 'desc' },
    { op: 'orderBy', field: DOC_ID_FIELD_SENTINEL, dir: 'desc' },
    { op: 'startAfter', cursorValues: ['CURSOR_VALUE', 'CURSOR_TURN_ID'] },
    { op: 'limit', n: 10 }
  ]);
});

// PRODUCT-6 (cursor stability correction) — the cursor passed to startAfter() is a TWO-PART
// (createdAt, turnId) pair, not createdAt alone, proving the fix required to safely paginate
// across a page boundary where multiple documents share one createdAt value.
test('PRODUCT-6: fetchRecent() cursor is the exact (afterCreatedAt, afterTurnId) pair, passed as two positional startAfter() arguments matching the two orderBy fields in order', async () => {
  const docs = [{ id: 't', data: () => ({ userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1, completedAt: 'TS', createdAt: 'SHARED_TIMESTAMP' }) }];
  const db = fakeDbForQuery(docs);
  ConversationRepository.configure({ db, documentIdField: () => DOC_ID_FIELD_SENTINEL });
  await ConversationRepository.fetchRecent('u1', 10, 'SHARED_TIMESTAMP', 'tie_b');
  const startAfterCall = db.calls.find((c) => c.op === 'startAfter');
  assert.deepEqual(startAfterCall.cursorValues, ['SHARED_TIMESTAMP', 'tie_b'], 'turnId must accompany createdAt so documents sharing one createdAt value are never ambiguous across a page boundary');
});

test('fetchRecent() maps a missing assistantText/completedAt field to null, never undefined, and carries through createdAt for pagination use', async () => {
  const docs = [{ id: 'turn_1', data: () => ({ userText: 'x', status: 'PENDING', submittedAt: 1, createdAt: 'CT1' }) }];
  const db = fakeDbForQuery(docs);
  ConversationRepository.configure({ db, documentIdField: () => DOC_ID_FIELD_SENTINEL });
  const records = await ConversationRepository.fetchRecent('u1', 6);
  assert.equal(records[0].assistantText, null);
  assert.equal(records[0].completedAt, null);
  assert.equal(records[0].createdAt, 'CT1');
});

// PRODUCT-5: no change to display history — the display call site (js/app.js
// loadCoachConversationHistory()) always calls fetchRecent with exactly 2 arguments (uid, 50),
// never a cursor, and is entirely decoupled from the reasoning-context pagination loop.
test('PRODUCT-5: fetchRecent(uid, 50) with no third/fourth argument behaves identically whether or not the optional cursor parameters exist in the function signature (backward-compatible, decoupled from the reasoning-context query)', async () => {
  const docs = [{ id: 'turn_1', data: () => ({ userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1, completedAt: 'TS', createdAt: 'CT1' }) }];
  const db = fakeDbForQuery(docs);
  ConversationRepository.configure({ db, documentIdField: () => DOC_ID_FIELD_SENTINEL });
  const records = await ConversationRepository.fetchRecent('u1', 50); // exactly the display path's own call shape
  assert.equal(db.calls.some((c) => c.op === 'startAfter'), false);
  assert.equal(records.length, 1);
});

// deleteAllForUser — mirrors tests/errorLogRepository.test.js's own established coverage exactly
test('deleteAllForUser() queries the subcollection and batch-deletes every returned document', async () => {
  const deletedRefs = [];
  const committedBatches = [];
  const docRefs = [{ id: 'a' }, { id: 'b' }];
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ get: () => Promise.resolve({ forEach: (cb) => docRefs.forEach((r) => cb({ ref: r })) }) }) }) }),
    batch: () => {
      const thisBatchDeletes = [];
      committedBatches.push(thisBatchDeletes);
      return { delete: (ref) => { thisBatchDeletes.push(ref); deletedRefs.push(ref); }, commit: () => Promise.resolve() };
    }
  };
  ConversationRepository.configure({ db });
  await ConversationRepository.deleteAllForUser('u1');
  assert.deepEqual(deletedRefs, docRefs);
  assert.equal(committedBatches.length, 1);
});

test('deleteAllForUser() on an empty subcollection commits no batches', async () => {
  const committedBatches = [];
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ get: () => Promise.resolve({ forEach: () => {} }) }) }) }),
    batch: () => { committedBatches.push([]); return { delete: () => {}, commit: () => Promise.resolve() }; }
  };
  ConversationRepository.configure({ db });
  await ConversationRepository.deleteAllForUser('u1');
  assert.equal(committedBatches.length, 0);
});
