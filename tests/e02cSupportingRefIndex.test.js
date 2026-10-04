// WP0 Phase E.0.2c amendment for E.0.2d — supporting-evidence index and evidence-keyed record query
// (docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md §04-§11, AC-SR1 … AC-SR8). Uses only the
// in-memory reference port; deterministic; no model call. Port conformance for the new query is
// registered with the rest of the suite in tests/e02cUserKnowledgeStore.test.js.
// Run with: node --test tests/e02cSupportingRefIndex.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));
const T = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeTransitions.js'));
const Store = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeStore.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');

const ALL_US = ['active', 'superseded', 'rejected', 'archived'];

let clock = 50000;
function env(opts) {
  const o = opts || {};
  const created = createInMemoryPort();
  const state = { consent: o.consent === undefined ? () => true : o.consent, userId: o.userId || 'u1' };
  const as = (writer) => {
    const r = Store.configure({ port: created.port, now: () => ++clock, writerAuthority: writer, isLearningConsentGranted: (...a) => state.consent(...a), userId: state.userId, producer: 'test.producer', producerVersion: '1.0.0' });
    assert.equal(r.status, 'CONFIGURED');
    return Store;
  };
  return Object.assign({ as, state }, created);
}
const TURN = (id) => ({ kind: 'CONVERSATION_TURN', ref: id });
function draft(o) {
  const source = (o && o.source) || 'user_stated';
  return Object.assign({
    factors: [],
    relationDescription: 'Open-text description.',
    evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
    temporality: 'DURABLE',
    confidence: source === 'user_stated' ? 1 : 0,
    source,
    safetyFlag: 'STANDARD',
    evidence: { supporting: [TURN('tA')] }
  }, o || {});
}
async function concept(e, label) {
  const r = await e.as('CLIENT').createConcept({ labels: [label] });
  assert.equal(r.status, 'COMMITTED');
  return r.ids.conceptIds[0];
}
async function mk(e, writer, d) {
  const r = await e.as(writer).createRecord({ draft: d });
  assert.equal(r.status, 'COMMITTED', JSON.stringify(r));
  return r.ids.recordIds[0];
}
function peek(e, id) { return e.hooks.peek(e.state.userId).records.find((r) => r.recordId === id); }
function q(over) { return Object.assign({ refIdsAny: ['CONVERSATION_TURN:tA'], sources: ['user_stated'], statuses: ALL_US, limit: 50 }, over || {}); }

// ═══════════════════ AC-SR1 — derivation ═══════════════════
test('AC-SR1: deriveSupportingRefIds is distinct, exact-match, code-unit ordered and ignores contradicting evidence', () => {
  const ref = (kind, r) => ({ refId: kind + ':' + r, kind, ref: r });
  const ev = {
    supporting: [ref('DAY_LOG', '2026-01-02'), ref('CONVERSATION_TURN', 'b'), ref('CONVERSATION_TURN', 'B'), ref('CONVERSATION_TURN', 'b')],
    contradicting: [ref('CONVERSATION_TURN', 'zz')]
  };
  assert.deepEqual(C.deriveSupportingRefIds(ev), ['CONVERSATION_TURN:B', 'CONVERSATION_TURN:b', 'DAY_LOG:2026-01-02']);
  assert.deepEqual(C.deriveSupportingRefIds({ supporting: [], contradicting: [ref('DAY_LOG', 'x')] }), []);
  assert.deepEqual(C.deriveSupportingRefIds({}), []);
  assert.equal(C.LIMITS.MAX_QUERY_REF_IDS, 10);
  assert.equal(C.LIMITS.SCHEMA_VERSION, 1);
  assert.equal(C.isRefId('CONVERSATION_TURN:t1'), true);
  assert.equal(C.isRefId('NOT_A_KIND:t1'), false);
  assert.equal(C.isRefId('CONVERSATION_TURN:has space'), false);
  assert.equal(C.isRefId(':t1'), false);
});

// ═══════════════════ AC-SR2 — validator and drafts ═══════════════════
test('AC-SR2: the validator requires an exact index; drafts may not supply it', async () => {
  const e = env();
  const c = await concept(e, 'alpha');
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [TURN('t2'), TURN('t1')] } }));
  const rec = peek(e, id);
  assert.deepEqual(rec.supportingRefIds, ['CONVERSATION_TURN:t1', 'CONVERSATION_TURN:t2']);
  assert.equal(C.validateRecord(rec).ok, true);
  const tamper = (fn) => { const d = JSON.parse(JSON.stringify(rec)); fn(d); return C.validateRecord(d); };
  assert.equal(tamper((d) => { d.supportingRefIds = ['CONVERSATION_TURN:t2', 'CONVERSATION_TURN:t1']; }).code, 'SUPPORTING_INDEX_MISMATCH');
  assert.equal(tamper((d) => { d.supportingRefIds = ['CONVERSATION_TURN:t1']; }).code, 'SUPPORTING_INDEX_MISMATCH');
  assert.equal(tamper((d) => { d.supportingRefIds.push('CONVERSATION_TURN:t9'); }).code, 'SUPPORTING_INDEX_MISMATCH');
  assert.equal(tamper((d) => { d.evidence.supporting.pop(); }).code, 'SUPPORTING_INDEX_MISMATCH');
  assert.equal(tamper((d) => { delete d.supportingRefIds; }).code, 'MISSING_FIELD');
  assert.equal(C.validateRecordDraft(Object.assign(draft({ factors: [{ conceptId: c, role: 'subject' }] }), { supportingRefIds: [] }), 0).code, 'DERIVED_FIELD_SUPPLIED');
  const r = await e.as('CLIENT').createRecord({ draft: Object.assign(draft({ factors: [{ conceptId: c, role: 'subject' }] }), { supportingRefIds: ['CONVERSATION_TURN:x'] }) });
  assert.equal(r.status, 'REJECTED');
  assert.equal(r.code, 'DERIVED_FIELD_SUPPLIED');
});

// ═══════════════════ AC-SR3 — planners ═══════════════════
test('AC-SR3: planners derive and recompute the index only from supporting evidence', async () => {
  const e = env();
  const [a, b] = [await concept(e, 'beta'), await concept(e, 'gamma')];
  const inf = await mk(e, 'SERVER', draft({ source: 'inferred_event', factors: [{ conceptId: a, role: 'subject' }], evidence: { supporting: [TURN('t1')] } }));
  assert.deepEqual(peek(e, inf).supportingRefIds, ['CONVERSATION_TURN:t1']);

  assert.equal((await e.as('SERVER').appendEvidence({ recordId: inf, list: 'supporting', refs: [{ kind: 'DAY_LOG', ref: '2026-02-01' }] })).status, 'COMMITTED');
  assert.deepEqual(peek(e, inf).supportingRefIds, ['CONVERSATION_TURN:t1', 'DAY_LOG:2026-02-01']);

  const before = peek(e, inf).supportingRefIds.slice();
  assert.equal((await e.as('SERVER').appendEvidence({ recordId: inf, list: 'contradicting', refs: [TURN('t7')] })).status, 'COMMITTED');
  assert.deepEqual(peek(e, inf).supportingRefIds, before);
  assert.equal((await e.as('SERVER').applyEvidenceAvailability({ recordId: inf, results: [{ refId: 'CONVERSATION_TURN:t1', availability: 'UNRESOLVABLE', reason: 'USER_DELETED' }] })).status, 'COMMITTED');
  assert.deepEqual(peek(e, inf).supportingRefIds, before);
  for (const call of [() => e.as('SERVER').setConfidence({ recordId: inf, confidence: 0.3 }), () => e.as('SERVER').recordConfoundCheck({ recordId: inf }), () => e.as('SERVER').raiseSafetyFlag({ recordId: inf })]) {
    assert.equal((await call()).status, 'COMMITTED');
    assert.deepEqual(peek(e, inf).supportingRefIds, before);
  }

  // FITME→FITME supersession: successor derives its own; predecessor unchanged.
  const inf2 = await mk(e, 'SERVER', draft({ source: 'inferred_event', factors: [{ conceptId: a, role: 'subject' }], relationDescription: 'Second.', evidence: { supporting: [TURN('t3')] } }));
  const sup = await e.as('SERVER').supersede({ predecessorIds: [inf2], successor: draft({ source: 'inferred_event', factors: [{ conceptId: b, role: 'subject' }], evidence: { supporting: [TURN('t4'), TURN('t3')] } }) });
  assert.equal(sup.status, 'COMMITTED');
  assert.deepEqual(peek(e, sup.ids.recordIds[0]).supportingRefIds, ['CONVERSATION_TURN:t3', 'CONVERSATION_TURN:t4']);
  assert.deepEqual(peek(e, inf2).supportingRefIds, ['CONVERSATION_TURN:t3']);

  // governed correction successor
  const inf3 = await mk(e, 'SERVER', draft({ source: 'inferred_event', factors: [{ conceptId: a, role: 'subject' }], relationDescription: 'Third.', evidence: { supporting: [TURN('t5')] } }));
  const cor = await e.as('SERVER').correctInferredKnowledge({ predecessorIds: [inf3], userOriginTurnId: 't6', successor: draft({ factors: [{ conceptId: b, role: 'subject' }], relationDescription: 'User correction.', evidence: { supporting: [TURN('t6')] }, provenance: { originTurnId: 't6' } }) });
  assert.equal(cor.status, 'COMMITTED', JSON.stringify(cor));
  assert.deepEqual(peek(e, cor.ids.recordIds[0]).supportingRefIds, ['CONVERSATION_TURN:t6']);
  assert.deepEqual(peek(e, inf3).supportingRefIds, ['CONVERSATION_TURN:t5']);
});

// ═══════════════════ AC-SR4 — store read ═══════════════════
test('AC-SR4: consent gate and request validation make no port call', async () => {
  const e = env({ consent: () => false });
  e.hooks.calls.length = 0;
  const denied = await e.as('SERVER').queryRecordsBySupportingRefs(q());
  assert.equal(denied.status, 'CONSENT_NOT_GRANTED');
  assert.deepEqual(denied.records, []);
  assert.equal(e.hooks.calls.indexOf('queryRecordsBySupportingRefs'), -1);

  const e2 = env();
  const S = e2.as('CLIENT');
  const eleven = Array.from({ length: 11 }, (_, i) => 'CONVERSATION_TURN:t' + i);
  e2.hooks.calls.length = 0;
  const invalid = [
    q({ refIdsAny: [] }), q({ refIdsAny: eleven }), q({ refIdsAny: ['CONVERSATION_TURN:t1', 'CONVERSATION_TURN:t1'] }),
    q({ refIdsAny: ['NOPE:t1'] }), q({ refIdsAny: ['CONVERSATION_TURN:has space'] }),
    q({ sources: [] }), q({ sources: ['user_stated', 'user_stated'] }), q({ sources: ['someone'] }),
    q({ statuses: [] }), q({ statuses: ['pending'] }), q({ statuses: ['active', 'active'] }),
    q({ limit: 0 }), q({ limit: 51 }), q({ limit: 1.5 })
  ];
  for (const req of invalid) {
    const r = await S.queryRecordsBySupportingRefs(req);
    assert.equal(r.status, 'REJECTED', JSON.stringify(req));
    assert.equal(r.code, 'INVALID_VALUE');
  }
  assert.equal((await S.queryRecordsBySupportingRefs(Object.assign(q(), { writer: 'SERVER' }))).code, 'UNKNOWN_FIELD');
  assert.equal((await S.queryRecordsBySupportingRefs({ refIdsAny: ['CONVERSATION_TURN:t1'] })).code, 'MISSING_FIELD');
  assert.equal(e2.hooks.calls.indexOf('queryRecordsBySupportingRefs'), -1);
});

test('AC-SR4: returned documents are validated, matched against the request and bounded; failures fail closed', async () => {
  const e = env();
  const c = await concept(e, 'delta');
  const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [TURN('tA')] } }));
  const ok = await e.as('SERVER').queryRecordsBySupportingRefs(q());
  assert.equal(ok.status, 'OK');
  assert.deepEqual(ok.records.map((r) => r.recordId), [us]);
  assert.equal(Object.isFrozen(ok.records), true);

  // a stale index from the port → invalid document
  e.hooks.tamper((doc) => (doc.recordId ? Object.assign(doc, { supportingRefIds: ['CONVERSATION_TURN:zzz'] }) : doc));
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q())).code, 'STORED_DOCUMENT_INVALID');
  e.hooks.tamper(null);

  // a port returning a valid record that does not match the request → rejected
  const port = e.port;
  const original = port.queryRecordsBySupportingRefs;
  port.queryRecordsBySupportingRefs = async (u, req) => original.call(port, u, Object.assign({}, req, { refIdsAny: ['CONVERSATION_TURN:tA'] }));
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q({ refIdsAny: ['CONVERSATION_TURN:other'] }))).code, 'STORED_DOCUMENT_INVALID');
  port.queryRecordsBySupportingRefs = async (u, req) => original.call(port, u, Object.assign({}, req, { statuses: ALL_US }));
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q({ statuses: ['rejected'] }))).code, 'STORED_DOCUMENT_INVALID');
  port.queryRecordsBySupportingRefs = async (u, req) => original.call(port, u, Object.assign({}, req, { sources: ['user_stated'] }));
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q({ sources: ['inferred_event'] }))).code, 'STORED_DOCUMENT_INVALID');
  // over-limit, non-array and throwing ports → FAILED
  port.queryRecordsBySupportingRefs = async () => [peek(e, us), peek(e, us)];
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q({ limit: 1 }))).status, 'FAILED');
  port.queryRecordsBySupportingRefs = async () => ({ status: 'FAILED' });
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q())).status, 'FAILED');
  port.queryRecordsBySupportingRefs = async () => { throw new Error('boom'); };
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q())).status, 'FAILED');
  port.queryRecordsBySupportingRefs = original;

  // another user's document → invalid
  e.hooks.tamper((doc) => (doc.recordId ? Object.assign(doc, { userId: 'u2' }) : doc));
  assert.equal((await e.as('CLIENT').queryRecordsBySupportingRefs(q())).code, 'STORED_DOCUMENT_INVALID');
  e.hooks.tamper(null);

  // never throws on junk; unconfigured
  for (const junk of [undefined, null, 42, 'x', [], {}]) {
    const r = await Store.queryRecordsBySupportingRefs(junk);
    assert.equal(typeof r.status, 'string');
  }
  Store.configure({});
  assert.equal((await Store.queryRecordsBySupportingRefs(q())).status, 'NOT_CONFIGURED');
});

test('AC-SR4: the read is allowed under CLIENT and SERVER and mutates nothing', async () => {
  const e = env();
  const c = await concept(e, 'epsilon');
  await mk(e, 'CLIENT', draft({ factors: [{ conceptId: c, role: 'subject' }] }));
  const snap = JSON.stringify(e.hooks.peek('u1'));
  for (const w of ['CLIENT', 'SERVER']) {
    e.hooks.calls.length = 0;
    const r = await e.as(w).queryRecordsBySupportingRefs(q());
    assert.equal(r.status, 'OK', w);
    assert.equal(r.records.length, 1, w);
    assert.deepEqual(e.hooks.calls, ['queryRecordsBySupportingRefs'], w);
  }
  assert.equal(JSON.stringify(e.hooks.peek('u1')), snap);
});

// ═══════════════════ AC-SR5 / AC-SR6 — no list-all; forget, erase and statuses ═══════════════════
test('AC-SR5: the required port surface has no list-all operation; the query is served by the index', () => {
  assert.equal(Store.PORT_FUNCTIONS.indexOf('queryRecordsBySupportingRefs') !== -1, true);
  Store.PORT_FUNCTIONS.forEach((f) => assert.equal(/^(list|getAll|scan|dump)/i.test(f), false, f));
  const src = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeStore.js'), 'utf8');
  assert.equal(/port\.(list|getAll|scan|dump)/i.test(src), false);
});

test('AC-SR6: superseded, rejected and archived records are returned when requested; forgotten and erased records never', async () => {
  const e = env();
  const [a, b] = [await concept(e, 'zeta'), await concept(e, 'eta')];
  const f = (c) => [{ conceptId: c, role: 'subject' }];
  const ids = {};
  ids.active = await mk(e, 'CLIENT', draft({ factors: f(a), relationDescription: 'Active one.', evidence: { supporting: [TURN('t1')] } }));
  ids.superseded = await mk(e, 'CLIENT', draft({ factors: f(a), relationDescription: 'Old one.', evidence: { supporting: [TURN('t2')] } }));
  const sup = await e.as('CLIENT').supersede({ predecessorIds: [ids.superseded], successor: draft({ factors: f(b), relationDescription: 'New one.', evidence: { supporting: [TURN('t9')] } }) });
  assert.equal(sup.status, 'COMMITTED');
  ids.rejected = await mk(e, 'CLIENT', draft({ factors: f(a), relationDescription: 'Withdrawn.', evidence: { supporting: [TURN('t3')] } }));
  assert.equal((await e.as('CLIENT').retractRecord({ recordId: ids.rejected })).status, 'COMMITTED');
  ids.archived = await mk(e, 'CLIENT', draft({ factors: f(a), relationDescription: 'Archived.', evidence: { supporting: [TURN('t4')] } }));
  assert.equal((await e.as('CLIENT').archiveRecord({ recordId: ids.archived })).status, 'COMMITTED');
  const refs = ['CONVERSATION_TURN:t1', 'CONVERSATION_TURN:t2', 'CONVERSATION_TURN:t3', 'CONVERSATION_TURN:t4'];
  const all = await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: refs }));
  assert.deepEqual(all.records.map((r) => r.status).sort(), ['active', 'archived', 'rejected', 'superseded']);
  const activeOnly = await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: refs, statuses: ['active'] }));
  assert.deepEqual(activeOnly.records.map((r) => r.recordId), [ids.active]);

  assert.equal((await e.as('CLIENT').forgetRecord({ recordId: ids.active })).status, 'DELETED');
  const afterForget = await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: ['CONVERSATION_TURN:t1'] }));
  assert.deepEqual(afterForget.records, []);
  const snapshot = JSON.stringify(e.hooks.peek('u1'));
  assert.equal(snapshot.indexOf('CONVERSATION_TURN:t1'), -1); // no tombstone or retained index entry
  assert.equal((await e.as('SERVER').eraseAllForUser()).status, 'DELETED');
  const afterErase = await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: refs }));
  assert.deepEqual(afterErase.records, []);
});

test('AC-SR6: contradicting-only citations and FITME-inferred citations do not match a user_stated query', async () => {
  const e = env();
  const c = await concept(e, 'theta');
  await mk(e, 'SERVER', draft({ source: 'inferred_event', factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [TURN('t1')] } }));
  const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [TURN('t5')], contradicting: [TURN('t2')] } }));
  const r = await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: ['CONVERSATION_TURN:t1', 'CONVERSATION_TURN:t2'] }));
  assert.deepEqual(r.records, []);
  assert.deepEqual((await e.as('SERVER').queryRecordsBySupportingRefs(q({ refIdsAny: ['CONVERSATION_TURN:t5'] }))).records.map((x) => x.recordId), [us]);
});

// ═══════════════════ AC-SR7 / AC-SR8 — nothing else changes; no model, clock or randomness ═══════════════════
test('AC-SR7: no existing operation, transition, authority rule or error code changed — new surface is exactly additive', () => {
  const opsE02C = ['configure', 'createRecord', 'promoteRecord', 'retractRecord', 'archiveRecord', 'supersede', 'correctInferredKnowledge', 'appendEvidence', 'applyEvidenceAvailability', 'addConfound', 'recordConfoundCheck', 'setConfidence', 'raiseSafetyFlag', 'createConcept', 'addConceptLabel', 'removeConceptLabel', 'mergeConcept', 'unmergeConcept', 'getRecords', 'getConcepts', 'forgetRecord', 'forgetConcept', 'eraseAllForUser', 'queryRecordsByConcepts', 'queryRecentConcepts'];
  const ops = Object.keys(Store).filter((k) => typeof Store[k] === 'function').sort();
  assert.deepEqual(ops, opsE02C.concat(['queryRecordsBySupportingRefs']).sort());
  const plannerNames = Object.keys(T).filter((k) => /^plan/.test(k)).sort();
  assert.equal(plannerNames.indexOf('planSupportingRefIds'), -1); // derivation lives in the contract only
  assert.equal(C.STATUSES.length, 5);
  assert.equal(C.SOURCES.length, 5);
});

test('AC-SR8: the three modules make no model call and read no clock or randomness', () => {
  ['userKnowledgeContract.js', 'userKnowledgeTransitions.js', 'userKnowledgeStore.js'].forEach((f) => {
    const src = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem', f), 'utf8');
    ['callClaude', 'Date.now', 'new Date', 'Math.random', 'crypto', 'performance.now', 'setTimeout'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
  });
});
