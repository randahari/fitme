// WP0 Phase E.0.2c — User Knowledge persistence-port conformance suite
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §20.1 binding port requirements, §20.3, AC-31/AC-32). Registers one node:test case per port
// requirement against any port factory: `registerPortConformance({ test, assert }, makePort, label)`
// where `makePort()` returns `{ port }`. The in-memory reference port must pass it now; every
// future adapter (Web shell, native shell, governed authority boundary) must pass it unchanged.
'use strict';

const path = require('node:path');
const T = require(path.join(__dirname, '../../js/coachDecisionSystem/userKnowledgeTransitions.js'));
const Store = require(path.join(__dirname, '../../js/coachDecisionSystem/userKnowledgeStore.js'));

const PRODUCER = { producer: 'conformance.fixture', producerVersion: '1.0.0' };

function conceptDoc(userId, conceptId, labels, now, eventId) {
  const r = T.planCreateConcept({}, { labels, userId, ids: { conceptIds: [conceptId], eventIds: [eventId] } }, now, 'CLIENT', PRODUCER);
  if (!r.ok) throw new Error('fixture concept: ' + r.code);
  return r.changeSet.creates[0];
}
function recordDoc(userId, recordId, concept, now, eventId, source) {
  const s = source || 'user_stated';
  const r = T.planCreateRecord({ concepts: { [concept.conceptId]: concept } }, {
    userId,
    ids: { recordId, eventIds: [eventId] },
    draft: {
      factors: [{ conceptId: concept.conceptId, role: 'subject' }],
      relationDescription: 'conformance fixture record',
      evidenceClass: s === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
      temporality: 'DURABLE',
      confidence: 0.5,
      source: s,
      safetyFlag: 'STANDARD'
    }
  }, now, s === 'user_stated' ? 'CLIENT' : 'SERVER', PRODUCER);
  if (!r.ok) throw new Error('fixture record: ' + r.code);
  return r.changeSet.creates[0];
}

function registerPortConformance(t, makePort, label) {
  const { test, assert } = t;
  const name = (s) => '[port conformance: ' + label + '] ' + s;

  test(name('exposes exactly the §20.1 operations and no list-all operation (AC-32)'), () => {
    const { port } = makePort();
    const fns = Object.keys(port).filter((k) => typeof port[k] === 'function').sort();
    assert.deepEqual(fns, Store.PORT_FUNCTIONS.slice().sort());
    fns.forEach((f) => assert.equal(/^(list|getAll|scan|dump)/i.test(f), false, f));
  });

  test(name('newId mints platform-safe ids unique per kind'), () => {
    const { port } = makePort();
    const seen = new Set();
    ['record', 'concept', 'event', 'confound'].forEach((kind) => {
      for (let i = 0; i < 20; i++) {
        const id = port.newId(kind);
        assert.match(id, /^[A-Za-z0-9_-]{1,128}$/);
        assert.equal(seen.has(id), false);
        seen.add(id);
      }
    });
  });

  test(name('committed documents round-trip deep-equal (requirement 4)'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cA1', ['alpha label'], 100, 'evA1');
    const r = recordDoc('uA', 'rA1', c, 101, 'evA2');
    assert.deepEqual(await port.commit('uA', { creates: [c, r], updates: [] }), { status: 'COMMITTED' });
    assert.deepEqual(await port.getRecords('uA', ['rA1']), [r]);
    assert.deepEqual(await port.getConcepts('uA', ['cA1']), [c]);
  });

  test(name('commit is atomic: a stale update aborts the whole change set (requirement 1)'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cB1', ['beta'], 100, 'evB1');
    const r = recordDoc('uA', 'rB1', c, 101, 'evB2');
    await port.commit('uA', { creates: [c, r], updates: [] });
    const promoted = T.planRaiseSafetyFlag({ record: r }, { userId: 'uA', ids: { eventIds: ['evB3'] } }, 102, 'CLIENT', PRODUCER).changeSet.updates[0];
    const staleUpdate = Object.assign({}, promoted, { expectedVersion: 7 });
    const c2 = conceptDoc('uA', 'cB2', ['gamma'], 103, 'evB4');
    assert.deepEqual(await port.commit('uA', { creates: [c2], updates: [staleUpdate] }), { status: 'CONFLICT' });
    assert.deepEqual(await port.getConcepts('uA', ['cB2']), []);
    assert.deepEqual(await port.getRecords('uA', ['rB1']), [r]);
    assert.deepEqual(await port.commit('uA', { creates: [c2], updates: [promoted] }), { status: 'COMMITTED' });
    assert.equal((await port.getRecords('uA', ['rB1']))[0].version, 2);
  });

  test(name('a create whose id already exists is a CONFLICT and applies nothing'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cC1', ['delta'], 100, 'evC1');
    await port.commit('uA', { creates: [c], updates: [] });
    const other = conceptDoc('uA', 'cC2', ['epsilon'], 101, 'evC2');
    assert.deepEqual(await port.commit('uA', { creates: [other, c], updates: [] }), { status: 'CONFLICT' });
    assert.deepEqual(await port.getConcepts('uA', ['cC2']), []);
  });

  test(name('reads are bounded: over-limit requests fail and never return more than limit (requirement 2)'), async () => {
    const { port } = makePort();
    const ids = Array.from({ length: 51 }, (_, i) => 'x' + i);
    assert.equal(Array.isArray(await port.getRecords('uA', ids)), false);
    assert.equal(Array.isArray(await port.getConcepts('uA', ids)), false);
    assert.equal(Array.isArray(await port.queryRecordsByConcepts('uA', { conceptIdsAny: ids.slice(0, 11), statuses: ['active'], limit: 5 })), false);
    assert.equal(Array.isArray(await port.queryRecordsByConcepts('uA', { conceptIdsAny: ['a'], statuses: ['active'], limit: 51 })), false);
    assert.equal(Array.isArray(await port.queryRecentConcepts('uA', { limit: 0 })), false);
    assert.equal(Array.isArray(await port.queryConceptsMergedInto('uA', 'a', { limit: 51 })), false);
  });

  test(name('queries order by updatedAt desc then id asc, filter by status, and honour limit'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cD1', ['zeta'], 100, 'evD0');
    const docs = [c];
    [['rD1', 110], ['rD2', 130], ['rD3', 130], ['rD4', 120]].forEach(([id, t], i) => docs.push(recordDoc('uA', id, c, t, 'evD' + (i + 1))));
    await port.commit('uA', { creates: docs, updates: [] });
    const all = await port.queryRecordsByConcepts('uA', { conceptIdsAny: ['cD1'], statuses: ['active'], limit: 50 });
    assert.deepEqual(all.map((r) => r.recordId), ['rD2', 'rD3', 'rD4', 'rD1']);
    const two = await port.queryRecordsByConcepts('uA', { conceptIdsAny: ['cD1'], statuses: ['active'], limit: 2 });
    assert.deepEqual(two.map((r) => r.recordId), ['rD2', 'rD3']);
    assert.deepEqual(await port.queryRecordsByConcepts('uA', { conceptIdsAny: ['cD1'], statuses: ['rejected'], limit: 50 }), []);
    assert.deepEqual((await port.queryRecentConcepts('uA', { limit: 5 })).map((x) => x.conceptId), ['cD1']);
  });

  test(name('queryConceptsMergedInto returns only concepts merged into the target'), async () => {
    const { port } = makePort();
    const a = conceptDoc('uA', 'cE1', ['eta'], 100, 'evE1');
    const b = conceptDoc('uA', 'cE2', ['theta'], 100, 'evE2');
    await port.commit('uA', { creates: [a, b], updates: [] });
    assert.deepEqual(await port.queryConceptsMergedInto('uA', 'cE1', { limit: 5 }), []);
    const merge = T.planMergeConcept({ from: b, into: a, getConcept: () => null }, { userId: 'uA', ids: { eventIds: ['evE3'] } }, 101, 'CLIENT', PRODUCER);
    await port.commit('uA', merge.changeSet);
    assert.deepEqual((await port.queryConceptsMergedInto('uA', 'cE1', { limit: 5 })).map((x) => x.conceptId), ['cE2']);
  });

  test(name('per-user isolation for every read, write and delete (requirement 3)'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cF1', ['iota'], 100, 'evF1');
    const r = recordDoc('uA', 'rF1', c, 101, 'evF2');
    await port.commit('uA', { creates: [c, r], updates: [] });
    assert.deepEqual(await port.getRecords('uB', ['rF1']), []);
    assert.deepEqual(await port.getConcepts('uB', ['cF1']), []);
    assert.deepEqual(await port.queryRecordsByConcepts('uB', { conceptIdsAny: ['cF1'], statuses: ['active'], limit: 5 }), []);
    assert.notDeepEqual(await port.commit('uB', { creates: [c], updates: [] }), { status: 'COMMITTED' });
    await port.deleteAll('uB');
    await port.deleteRecordsBySources('uB', ['user_stated']);
    assert.deepEqual(await port.deleteRecord('uB', 'rF1'), { status: 'NOT_FOUND' });
    assert.deepEqual(await port.getRecords('uA', ['rF1']), [r]);
    assert.deepEqual(await port.getConcepts('uA', ['cF1']), [c]);
  });

  test(name('delete operations have exactly their stated scope'), async () => {
    const { port } = makePort();
    const c = conceptDoc('uA', 'cG1', ['kappa'], 100, 'evG1');
    const c2 = conceptDoc('uA', 'cG2', ['lambda'], 100, 'evG2');
    const us = recordDoc('uA', 'rG1', c, 101, 'evG3', 'user_stated');
    const inf = recordDoc('uA', 'rG2', c, 101, 'evG4', 'inferred_pattern');
    await port.commit('uA', { creates: [c, c2, us, inf], updates: [] });
    assert.deepEqual(await port.deleteConcept('uA', 'cG2'), { status: 'DELETED' });
    assert.deepEqual(await port.deleteConcept('uA', 'cG2'), { status: 'NOT_FOUND' });
    assert.deepEqual(await port.deleteRecordsBySources('uA', ['user_stated']), { status: 'DELETED' });
    assert.deepEqual((await port.getRecords('uA', ['rG1', 'rG2'])).map((x) => x.recordId), ['rG2']);
    assert.deepEqual(await port.deleteRecord('uA', 'rG2'), { status: 'DELETED' });
    await port.commit('uA', { creates: [recordDoc('uA', 'rG3', c, 102, 'evG5')], updates: [] });
    assert.deepEqual(await port.deleteAll('uA'), { status: 'DELETED' });
    assert.deepEqual(await port.getRecords('uA', ['rG3']), []);
    assert.deepEqual(await port.getConcepts('uA', ['cG1']), []);
  });

  test(name('never throws: malformed calls resolve (requirement 5)'), async () => {
    const { port } = makePort();
    const bad = [undefined, null, 42, 'has space', {}, []];
    for (const b of bad) {
      await assert.doesNotReject(() => port.getRecords(b, b));
      await assert.doesNotReject(() => port.getConcepts(b, b));
      await assert.doesNotReject(() => port.queryRecordsByConcepts(b, b));
      await assert.doesNotReject(() => port.queryRecentConcepts(b, b));
      await assert.doesNotReject(() => port.queryConceptsMergedInto(b, b, b));
      await assert.doesNotReject(() => port.commit(b, b));
      await assert.doesNotReject(() => port.deleteRecord(b, b));
      await assert.doesNotReject(() => port.deleteConcept(b, b));
      await assert.doesNotReject(() => port.deleteRecordsBySources(b, b));
      await assert.doesNotReject(() => port.deleteAll(b));
    }
  });
}

module.exports = { registerPortConformance, conceptDoc, recordDoc, PRODUCER };
