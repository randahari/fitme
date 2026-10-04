// USI-001 — additive E.0.2c store reads (docs/specs/USI_001_SPEC_v1.0.md §19; AC-39).
// queryRecordsByConcepts / queryRecentConcepts: consent-gated, bounded, validated, never throw.
// Run with: node --test tests/usi001StoreReads.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const Store = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeStore.js'));
const C = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeContract.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');

const USER = 'reads-user';
let env;
function setup() {
  const { port, hooks } = createInMemoryPort();
  let clock = 10;
  const state = { consent: true };
  Store.configure({ port, now: () => (clock += 10), writerAuthority: 'CLIENT', isLearningConsentGranted: () => state.consent, userId: USER, producer: 'usi-001.intake', producerVersion: '1.0.0' });
  env = { port, hooks, state };
  return env;
}
test.afterEach(() => Store.configure({}));
const draft = (conceptId) => ({ factors: [{ conceptId, role: 'subject' }], relationDescription: 'r', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD' });

test('AC-39: both reads return OK with validated documents, ordered most recent first, within the limit', async () => {
  setup();
  const ids = [];
  for (let i = 0; i < 5; i++) ids.push((await Store.createConcept({ labels: ['c' + i] })).ids.conceptIds[0]);
  for (const id of ids) await Store.createRecord({ draft: draft(id) });
  const rc = await Store.queryRecentConcepts({ limit: 3 });
  assert.equal(rc.status, 'OK');
  assert.deepEqual(rc.concepts.map((c) => c.labels[0]), ['c4', 'c3', 'c2']);
  rc.concepts.forEach((c) => assert.equal(C.validateConcept(c).ok, true));
  const rr = await Store.queryRecordsByConcepts({ conceptIdsAny: ids.slice(0, 3), statuses: ['candidate', 'active'], limit: 2 });
  assert.equal(rr.status, 'OK');
  assert.equal(rr.records.length, 2);
  rr.records.forEach((r) => assert.equal(C.validateRecord(r).ok, true));
  assert.ok(rr.records[0].updatedAt >= rr.records[1].updatedAt);
  assert.ok(Object.isFrozen(rr) && Object.isFrozen(rr.records));
});

test('AC-39: consent-gated — CONSENT_NOT_GRANTED with an empty result and no port call', async () => {
  setup();
  env.state.consent = false;
  env.hooks.resetCalls();
  assert.deepEqual(await Store.queryRecentConcepts({ limit: 3 }), { status: 'CONSENT_NOT_GRANTED', concepts: [] });
  assert.deepEqual(await Store.queryRecordsByConcepts({ conceptIdsAny: ['a'], statuses: ['active'], limit: 1 }), { status: 'CONSENT_NOT_GRANTED', records: [] });
  assert.equal(env.hooks.calls.length, 0);
});

test('AC-39: bounded — limits above MAX_QUERY_LIMIT, more than MAX_QUERY_CONCEPT_IDS ids, unknown statuses or keys are REJECTED before any port call', async () => {
  setup();
  env.hooks.resetCalls();
  const bad = [
    ['queryRecentConcepts', { limit: 51 }], ['queryRecentConcepts', { limit: 0 }], ['queryRecentConcepts', { limit: 1.5 }], ['queryRecentConcepts', {}], ['queryRecentConcepts', { limit: 3, userId: 'x' }],
    ['queryRecordsByConcepts', { conceptIdsAny: Array.from({ length: 11 }, (_, i) => 'c' + i), statuses: ['active'], limit: 1 }],
    ['queryRecordsByConcepts', { conceptIdsAny: [], statuses: ['active'], limit: 1 }],
    ['queryRecordsByConcepts', { conceptIdsAny: ['a', 'a'], statuses: ['active'], limit: 1 }],
    ['queryRecordsByConcepts', { conceptIdsAny: ['bad id'], statuses: ['active'], limit: 1 }],
    ['queryRecordsByConcepts', { conceptIdsAny: ['a'], statuses: ['deleted'], limit: 1 }],
    ['queryRecordsByConcepts', { conceptIdsAny: ['a'], statuses: ['active'], limit: 51 }]
  ];
  for (const [op, req] of bad) assert.equal((await Store[op](req)).status, 'REJECTED', op + ' ' + JSON.stringify(req));
  assert.equal(env.hooks.calls.length, 0);
});

test('AC-39: validated — a tampered or foreign document, an over-limit port result, or a record outside the query is refused; a failing port gives FAILED', async () => {
  setup();
  const id = (await Store.createConcept({ labels: ['c'] })).ids.conceptIds[0];
  const recId = (await Store.createRecord({ draft: draft(id) })).ids.recordIds[0];
  env.hooks.tamper((doc) => Object.assign(doc, { userId: 'someone-else' }));
  assert.equal((await Store.queryRecentConcepts({ limit: 5 })).status, 'REJECTED');
  assert.equal((await Store.queryRecordsByConcepts({ conceptIdsAny: [id], statuses: ['active'], limit: 5 })).status, 'REJECTED');
  env.hooks.tamper((doc) => (doc.recordId ? Object.assign(doc, { status: 'rejected' }) : doc));
  // a record whose status is outside the requested statuses (stale/corrupt port) is refused
  const badPort = Object.assign({}, env.port, { queryRecordsByConcepts: async (u) => env.port.getRecords(u, [recId]) });
  Store.configure({ port: badPort, now: () => 1e6, writerAuthority: 'CLIENT', isLearningConsentGranted: () => true, userId: USER, producer: 'p', producerVersion: '1' });
  assert.equal((await Store.queryRecordsByConcepts({ conceptIdsAny: [id], statuses: ['active'], limit: 5 })).status, 'REJECTED');
  env.hooks.tamper(null);
  const overLimit = Object.assign({}, env.port, { queryRecentConcepts: async (u) => env.port.queryRecentConcepts(u, { limit: 50 }).then((a) => a.concat(a)) });
  Store.configure({ port: overLimit, now: () => 1e6, writerAuthority: 'CLIENT', isLearningConsentGranted: () => true, userId: USER, producer: 'p', producerVersion: '1' });
  assert.equal((await Store.queryRecentConcepts({ limit: 1 })).status, 'FAILED');
  setup();
  env.hooks.failNext('queryRecentConcepts');
  assert.equal((await Store.queryRecentConcepts({ limit: 1 })).status, 'FAILED');
  const throwing = Object.assign({}, env.port, { queryRecordsByConcepts: () => { throw new Error('x'); } });
  Store.configure({ port: throwing, now: () => 1e6, writerAuthority: 'CLIENT', isLearningConsentGranted: () => true, userId: USER, producer: 'p', producerVersion: '1' });
  assert.equal((await Store.queryRecordsByConcepts({ conceptIdsAny: ['a'], statuses: ['active'], limit: 1 })).status, 'FAILED');
});

test('AC-39: never throws — unconfigured and junk requests resolve to frozen results', async () => {
  Store.configure({});
  for (const op of ['queryRecentConcepts', 'queryRecordsByConcepts']) {
    assert.equal((await Store[op]({ limit: 1 })).status, 'NOT_CONFIGURED');
  }
  setup();
  for (const op of ['queryRecentConcepts', 'queryRecordsByConcepts']) {
    for (const junk of [undefined, null, 1, 'x', [], { limit: '3' }]) {
      const r = await Store[op](junk);
      assert.equal(typeof r.status, 'string');
      assert.ok(Object.isFrozen(r));
    }
  }
});

test('AC-39: no existing store operation changed — the operation set is the E.0.2c set plus exactly the two reads', () => {
  const ops = Object.keys(Store).filter((k) => typeof Store[k] === 'function');
  const E02C = ['configure', 'createRecord', 'promoteRecord', 'retractRecord', 'archiveRecord', 'supersede', 'correctInferredKnowledge', 'appendEvidence', 'applyEvidenceAvailability', 'addConfound', 'recordConfoundCheck', 'setConfidence', 'raiseSafetyFlag', 'createConcept', 'addConceptLabel', 'removeConceptLabel', 'mergeConcept', 'unmergeConcept', 'getRecords', 'getConcepts', 'forgetRecord', 'forgetConcept', 'eraseAllForUser'];
  // E.0.2c amendment for E.0.2d §13 (authorized): the evidence-keyed read is added to both lists.
  assert.deepEqual(ops.sort(), E02C.concat(['queryRecordsByConcepts', 'queryRecentConcepts', 'queryRecordsBySupportingRefs']).sort());
  assert.deepEqual(Store.PORT_FUNCTIONS, ['newId', 'getRecords', 'getConcepts', 'queryRecordsByConcepts', 'queryRecordsBySupportingRefs', 'queryRecentConcepts', 'queryConceptsMergedInto', 'commit', 'deleteRecord', 'deleteConcept', 'deleteRecordsBySources', 'deleteAll']);
});
