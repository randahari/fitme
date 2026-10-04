// WP0 Phase E.0.2c — User Knowledge Record and Concept Identity Foundation: store tests
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §15-§17, §20, §27, §30). Uses only the in-memory reference port; deterministic; no model call.
// Run with: node --test tests/e02cUserKnowledgeStore.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));
const Store = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeStore.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');
const { registerPortConformance } = require('./fixtures/userKnowledgePortConformance.js');

// ═══════════════════ Port conformance (AC-31) ═══════════════════
registerPortConformance({ test, assert }, () => createInMemoryPort(), 'in-memory reference port');

// ── harness ──
let clock = 10000;
function env(opts) {
  const o = opts || {};
  const created = o.port ? { port: o.port, hooks: o.hooks } : createInMemoryPort();
  const state = { consent: o.consent === undefined ? () => true : o.consent, userId: o.userId || 'u1' };
  const as = (writer) => {
    const r = Store.configure({ port: created.port, now: () => ++clock, writerAuthority: writer, isLearningConsentGranted: (...a) => state.consent(...a), userId: state.userId, producer: 'test.producer', producerVersion: '1.0.0' });
    assert.equal(r.status, 'CONFIGURED');
    return Store;
  };
  return Object.assign({ as, state }, created);
}
function draft(o) {
  const source = (o && o.source) || 'user_stated';
  return Object.assign({
    factors: [],
    relationDescription: 'Open-text description.',
    evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
    temporality: 'DURABLE',
    confidence: source === 'user_stated' ? 1 : 0.4,
    source,
    safetyFlag: 'STANDARD',
    evidence: { supporting: [{ kind: source === 'user_stated' ? 'CONVERSATION_TURN' : 'DAY_LOG', ref: source === 'user_stated' ? 'turnA' : '2026-06-01' }] },
    provenance: { originTurnId: source === 'user_stated' ? 'turnA' : null }
  }, o || {});
}
async function concepts(e, labelsList) {
  const out = [];
  for (const labels of labelsList) {
    const r = await e.as('CLIENT').createConcept({ labels });
    assert.equal(r.status, 'COMMITTED');
    out.push(r.ids.conceptIds[0]);
  }
  return out;
}
async function mk(e, writer, d) {
  const r = await e.as(writer).createRecord({ draft: d });
  assert.equal(r.status, 'COMMITTED', JSON.stringify(r));
  return r.ids.recordIds[0];
}
async function get(e, id) { return e.hooks.peek(e.state.userId).records.find((r) => r.recordId === id); }
async function activeInferred(e, factors, extra) {
  const id = await mk(e, 'SERVER', draft(Object.assign({ source: 'inferred_pattern', factors }, extra || {})));
  assert.equal((await e.as('SERVER').recordConfoundCheck({ recordId: id })).status, 'COMMITTED');
  assert.equal((await e.as('SERVER').promoteRecord({ recordId: id })).status, 'COMMITTED');
  return id;
}

// ═══════════════════ Atomicity (AC-19, AC-20) ═══════════════════
test('AC-19: a failed commit leaves predecessor and successor states unchanged (no partial state)', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['first'], ['second']]);
  const p = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  const before = JSON.stringify(e.hooks.peek('u1'));
  e.hooks.failNext('commit');
  const r = await e.as('CLIENT').supersede({ predecessorIds: [p], successor: draft({ factors: [{ conceptId: b, role: 'subject' }] }) });
  assert.equal(r.status, 'FAILED');
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
});

test('AC-20: a stale expectedVersion yields CONFLICT and no change', async () => {
  const e = env();
  const [a] = await concepts(e, [['x']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: id, confidence: 0.8 })).status, 'COMMITTED');
  const before = JSON.stringify(e.hooks.peek('u1'));
  e.hooks.tamper((doc) => (doc.recordId === id ? Object.assign(doc, { version: 1 }) : doc)); // a reader holding a stale copy
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: id, confidence: 0.5 })).status, 'CONFLICT');
  e.hooks.tamper(null);
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
  e.hooks.conflictNextCommit();
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: id, confidence: 0.5 })).status, 'CONFLICT');
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
});

// ═══════════════════ Authority matrix (AC-26, AC-27) ═══════════════════
// §16.4: authority resolution may read; authority failure may not mutate.
const NO_PORT = [];                 // decidable from operation type / writer / request shape
const TARGET_READ = ['getRecords']; // the minimum authority-resolution read of the target records

test('AC-26: every §16.2 matrix cell, for both writer authorities; forbidden cells make only the §16.4 minimum port calls and never write, mint or expand', async () => {
  const e = env();
  const [a, b, c] = await concepts(e, [['a'], ['b'], ['c']]);
  const f = (id) => [{ conceptId: id, role: 'subject' }];
  const expectForbidden = async (label, fn, expectedCalls, expectedCode) => {
    assert.ok(Array.isArray(expectedCalls), label + ': expected port calls must be stated');
    e.hooks.resetCalls();
    const before = JSON.stringify(e.hooks.peek('u1'));
    const r = await fn();
    assert.equal(r.status, 'REJECTED', label + ' → ' + JSON.stringify(r));
    assert.equal(r.code, expectedCode || 'AUTHORITY', label);
    assert.deepEqual(e.hooks.calls, expectedCalls, label + ' port calls');
    ['newId', 'commit', 'deleteRecord', 'deleteConcept', 'deleteRecordsBySources', 'deleteAll', 'getConcepts'].forEach((op) => assert.equal(e.hooks.calls.indexOf(op), -1, label + ' must not call ' + op));
    assert.equal(JSON.stringify(e.hooks.peek('u1')), before, label + ' must not mutate storage');
  };
  const expectAllowed = async (label, fn) => { const r = await fn(); assert.ok(['COMMITTED', 'DELETED'].indexOf(r.status) !== -1, label + ' → ' + JSON.stringify(r)); return r; };

  // creation
  const us = (await expectAllowed('CLIENT create user_stated', () => e.as('CLIENT').createRecord({ draft: draft({ factors: f(a) }) }))).ids.recordIds[0];
  await expectForbidden('SERVER create user_stated', () => e.as('SERVER').createRecord({ draft: draft({ factors: f(a) }) }), NO_PORT);
  const inf = (await expectAllowed('SERVER create inferred', () => e.as('SERVER').createRecord({ draft: draft({ source: 'inferred_event', factors: f(a) }) }))).ids.recordIds[0];
  await expectForbidden('CLIENT create inferred', () => e.as('CLIENT').createRecord({ draft: draft({ source: 'inferred_event', factors: f(a) }) }), NO_PORT);
  for (const w of ['CLIENT', 'SERVER']) {
    await expectForbidden(w + ' create migrated', () => e.as(w).createRecord({ draft: draft({ source: 'migrated', evidenceClass: 'CO_OCCURRENCE', factors: f(a) }) }), NO_PORT);
  }
  // in-place mutation and status transitions
  const mutations = [
    ['setConfidence', { confidence: 0.3 }], ['raiseSafetyFlag', {}], ['recordConfoundCheck', {}],
    ['appendEvidence', { list: 'contradicting', refs: [{ kind: 'HABIT_RECORD', ref: 'h9' }] }],
    ['addConfound', { confound: { description: 'another explanation', source: 'user_stated' } }]
  ];
  for (const [name, extra] of mutations) {
    await expectAllowed('CLIENT ' + name + ' user_stated', () => e.as('CLIENT')[name](Object.assign({ recordId: us }, extra)));
    await expectForbidden('SERVER ' + name + ' user_stated', () => e.as('SERVER')[name](Object.assign({ recordId: us }, extra)), TARGET_READ);
    const infExtra = name === 'addConfound' ? { confound: { description: 'another explanation', source: 'inferred_event' } } : extra;
    await expectAllowed('SERVER ' + name + ' inferred', () => e.as('SERVER')[name](Object.assign({ recordId: inf }, infExtra)));
    await expectForbidden('CLIENT ' + name + ' inferred', () => e.as('CLIENT')[name](Object.assign({ recordId: inf }, infExtra)), TARGET_READ);
  }
  await expectForbidden('CLIENT promote inferred', () => e.as('CLIENT').promoteRecord({ recordId: inf }), TARGET_READ);
  await expectAllowed('SERVER promote inferred', () => e.as('SERVER').promoteRecord({ recordId: inf }));
  await expectForbidden('CLIENT archive inferred', () => e.as('CLIENT').archiveRecord({ recordId: inf }), TARGET_READ);
  await expectForbidden('CLIENT withdraw inferred', () => e.as('CLIENT').retractRecord({ recordId: inf }), TARGET_READ);
  await expectForbidden('SERVER withdraw user_stated', () => e.as('SERVER').retractRecord({ recordId: us }), TARGET_READ);
  await expectForbidden('SERVER archive user_stated', () => e.as('SERVER').archiveRecord({ recordId: us }), TARGET_READ);
  // supersession
  await expectForbidden('SERVER supersede us→us', () => e.as('SERVER').supersede({ predecessorIds: [us], successor: draft({ factors: f(b) }) }), NO_PORT);
  for (const w of ['CLIENT', 'SERVER']) {
    await expectForbidden(w + ' supersede us→inferred', () => e.as(w).supersede({ predecessorIds: [us], successor: draft({ source: 'inferred_pattern', factors: f(b) }) }), w === 'CLIENT' ? NO_PORT : TARGET_READ);
    await expectForbidden(w + ' generic supersede inferred→us', () => e.as(w).supersede({ predecessorIds: [inf], successor: draft({ factors: f(b) }) }), w === 'CLIENT' ? TARGET_READ : NO_PORT);
  }
  await expectForbidden('CLIENT supersede inferred→inferred', () => e.as('CLIENT').supersede({ predecessorIds: [inf], successor: draft({ source: 'inferred_pattern', factors: f(b) }) }), NO_PORT);
  await expectForbidden('CLIENT correctInferredKnowledge', () => e.as('CLIENT').correctInferredKnowledge({ predecessorIds: [inf], userOriginTurnId: 't1', successor: draft({ factors: f(c), evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }] }, provenance: { originTurnId: 't1' } }) }), NO_PORT);
  const inf2 = await mk(e, 'SERVER', draft({ source: 'inferred_pattern', factors: f(b) }));
  await expectAllowed('SERVER supersede inferred→inferred', () => e.as('SERVER').supersede({ predecessorIds: [inf2], successor: draft({ source: 'inferred_pattern', factors: f(c) }) }));
  await expectAllowed('SERVER correctInferredKnowledge', () => e.as('SERVER').correctInferredKnowledge({ predecessorIds: [inf], userOriginTurnId: 't1', successor: draft({ factors: f(c), evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }] }, provenance: { originTurnId: 't1' } }) }));
  const us2 = await mk(e, 'CLIENT', draft({ factors: f(b) }));
  await expectAllowed('CLIENT supersede us→us', () => e.as('CLIENT').supersede({ predecessorIds: [us2], successor: draft({ factors: f(c) }) }));
  // mixed
  const us3 = await mk(e, 'CLIENT', draft({ factors: f(a) }));
  const inf3 = await mk(e, 'SERVER', draft({ source: 'inferred_pattern', factors: f(a) }));
  for (const w of ['CLIENT', 'SERVER']) {
    await expectForbidden(w + ' mixed supersede', () => e.as(w).supersede({ predecessorIds: [us3, inf3], successor: draft(w === 'CLIENT' ? { factors: f(b) } : { source: 'inferred_pattern', factors: f(b) }) }), TARGET_READ, 'MIXED_AUTHORITY_PREDECESSORS');
  }
  // forget
  await expectForbidden('SERVER forget user_stated', () => e.as('SERVER').forgetRecord({ recordId: us3 }), TARGET_READ);
  await expectForbidden('CLIENT forget inferred', () => e.as('CLIENT').forgetRecord({ recordId: inf3 }), TARGET_READ);
  await expectAllowed('CLIENT forget user_stated', () => e.as('CLIENT').forgetRecord({ recordId: us3 }));
  await expectAllowed('SERVER forget inferred', () => e.as('SERVER').forgetRecord({ recordId: inf3 }));
  // concepts: both authorities
  for (const w of ['CLIENT', 'SERVER']) {
    const [x, y] = [(await e.as(w).createConcept({ labels: [w + ' x'] })).ids.conceptIds[0], (await e.as(w).createConcept({ labels: [w + ' y'] })).ids.conceptIds[0]];
    await expectAllowed(w + ' label add', () => e.as(w).addConceptLabel({ conceptId: x, label: 'extra' }));
    await expectAllowed(w + ' label remove', () => e.as(w).removeConceptLabel({ conceptId: x, label: 'extra' }));
    await expectAllowed(w + ' merge', () => e.as(w).mergeConcept({ fromConceptId: y, intoConceptId: x }));
    await expectAllowed(w + ' unmerge', () => e.as(w).unmergeConcept({ conceptId: y }));
    await expectAllowed(w + ' forget concept', () => e.as(w).forgetConcept({ conceptId: y }));
  }
});

test('AC-27: no operation accepts writer, writerAuthority, source overrides or status overrides', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  for (const k of ['writer', 'writerAuthority', 'source', 'status', 'authority', 'permission']) {
    const r1 = await e.as('CLIENT').setConfidence({ recordId: id, confidence: 0.2, [k]: 'SERVER' });
    assert.equal(r1.code, 'UNKNOWN_FIELD', k);
    const r2 = await e.as('SERVER').createRecord({ draft: draft({ source: 'inferred_event', factors: [{ conceptId: a, role: 'subject' }] }), [k]: 'CLIENT' });
    assert.equal(r2.code, 'UNKNOWN_FIELD', k);
  }
  const r3 = await e.as('SERVER').createRecord({ draft: draft({ source: 'inferred_event', status: 'active', factors: [{ conceptId: a, role: 'subject' }] }) });
  assert.equal((await get(e, r3.ids.recordIds[0])).status, 'candidate', 'initial status is never caller-controlled');
  assert.equal(Object.keys(Store).some((k) => /writer|authority/i.test(k) && k !== 'configure'), false);
});

// ═══════════════════ Consent (AC-28) and configuration (AC-29) ═══════════════════
test('AC-28: without granted consent every write and read returns CONSENT_NOT_GRANTED and never calls the port; forget/erase still work', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  const denied = [() => false, () => undefined, () => 'yes', () => 1, () => { throw new Error('boom'); }];
  for (const fn of denied) {
    e.state.consent = fn;
    e.hooks.resetCalls();
    const s = e.as('CLIENT');
    const results = [
      await s.createRecord({ draft: draft({ factors: [{ conceptId: a, role: 'subject' }] }) }),
      await s.setConfidence({ recordId: id, confidence: 0.1 }),
      await s.retractRecord({ recordId: id }),
      await s.supersede({ predecessorIds: [id], successor: draft({ factors: [{ conceptId: a, role: 'outcome' }] }) }),
      await s.createConcept({ labels: ['n'] }),
      await s.mergeConcept({ fromConceptId: a, intoConceptId: a }),
      await s.getRecords({ recordIds: [id] }),
      await s.getConcepts({ conceptIds: [a] })
    ];
    results.forEach((r) => assert.equal(r.status, 'CONSENT_NOT_GRANTED'));
    assert.deepEqual(e.hooks.calls, [], 'port never called');
  }
  e.state.consent = () => false;
  assert.equal((await e.as('CLIENT').forgetRecord({ recordId: id })).status, 'DELETED');
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: a })).status, 'DELETED');
  assert.equal((await e.as('CLIENT').eraseAllForUser()).status, 'DELETED');
});

test('AC-29: an unconfigured or invalidly configured store returns NOT_CONFIGURED; no operation ever throws', async () => {
  const { port } = createInMemoryPort();
  const base = { port, now: () => 1, writerAuthority: 'CLIENT', isLearningConsentGranted: () => true, userId: 'u1', producer: 'p.x', producerVersion: '1' };
  const invalid = [
    {}, Object.assign({}, base, { port: {} }), Object.assign({}, base, { now: 5 }), Object.assign({}, base, { writerAuthority: 'ADMIN' }),
    Object.assign({}, base, { isLearningConsentGranted: true }), Object.assign({}, base, { userId: 'has space' }), Object.assign({}, base, { producer: 'bad producer' })
  ];
  const ops = Object.keys(Store).filter((k) => typeof Store[k] === 'function' && k !== 'configure');
  for (const cfg of invalid) {
    assert.equal(Store.configure(cfg).status, 'NOT_CONFIGURED');
    for (const name of ops) assert.equal((await Store[name]({})).status, 'NOT_CONFIGURED', name);
  }
  Store.configure(base);
  for (const name of ops) {
    for (const junk of [undefined, null, 42, 'x', [], { recordId: 7 }, { conceptId: {} }, { draft: null }, { predecessorIds: 'x' }]) {
      const r = await Store[name](junk);
      assert.equal(typeof r.status, 'string', name);
      assert.equal(Object.isFrozen(r), true);
    }
  }
});

// ═══════════════════ Bounds (AC-32) and tamper (AC-39 store half) ═══════════════════
test('AC-32: the store never requests more than the §09.2 bounds', async () => {
  const inner = createInMemoryPort();
  const seen = [];
  const spy = {};
  Object.keys(inner.port).forEach((k) => { spy[k] = (...args) => { seen.push([k, args]); return inner.port[k](...args); }; });
  const e = env({ port: spy, hooks: inner.hooks });
  const ids = await concepts(e, Array.from({ length: 12 }, (_, i) => ['c' + i]));
  const us = await mk(e, 'CLIENT', draft({ factors: ids.slice(0, 8).map((id, i) => ({ conceptId: id, role: 'subject', valueDescription: 'v' + i })) }));
  await e.as('CLIENT').supersede({ predecessorIds: [us], successor: draft({ factors: ids.slice(4, 12).map((id) => ({ conceptId: id, role: 'outcome' })) }) });
  await e.as('CLIENT').forgetConcept({ conceptId: ids[0] });
  await e.as('CLIENT').mergeConcept({ fromConceptId: ids[10], intoConceptId: ids[11] });
  assert.equal((await e.as('CLIENT').getRecords({ recordIds: Array.from({ length: 51 }, (_, i) => 'r' + i) })).status, 'REJECTED');
  seen.forEach(([name, args]) => {
    if (name === 'getRecords' || name === 'getConcepts') assert.ok(args[1].length >= 1 && args[1].length <= C.LIMITS.MAX_READ_BATCH, name);
    if (name === 'queryRecordsByConcepts') { assert.ok(args[1].limit <= C.LIMITS.MAX_QUERY_LIMIT); assert.ok(args[1].conceptIdsAny.length <= C.LIMITS.MAX_QUERY_CONCEPT_IDS); }
    if (name === 'queryConceptsMergedInto' || name === 'queryRecentConcepts') assert.ok(args[args.length - 1].limit <= C.LIMITS.MAX_QUERY_LIMIT);
  });
});

test('AC-39 (store half): a divergent index returned by a tampered port blocks the mutation; merges never touch record indexes', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['a'], ['b']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  e.hooks.tamper((doc) => (doc.recordId ? Object.assign(doc, { conceptIds: [b] }) : doc));
  e.hooks.resetCalls();
  const r = await e.as('CLIENT').setConfidence({ recordId: id, confidence: 0.3 });
  assert.equal(r.code, 'STORED_DOCUMENT_INVALID');
  assert.deepEqual(e.hooks.writeCalls(), []);
  e.hooks.tamper(null);
  const before = JSON.stringify(e.hooks.peek('u1').records);
  await e.as('CLIENT').mergeConcept({ fromConceptId: a, intoConceptId: b });
  assert.equal(JSON.stringify(e.hooks.peek('u1').records), before);
});

// ═══════════════════ Open world (AC-35) ═══════════════════
function allJsText() {
  const out = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((ent) => {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) walk(p); else if (p.endsWith('.js')) out.push(fs.readFileSync(p, 'utf8'));
  });
  walk(path.join(ROOT, 'js'));
  return out.join('\n');
}
const NOVEL = {
  routine: 'Saturday dawn kayak ferry with my grandmother',
  activity: 'underwater hockey scrimmage',
  circumstance: 'the week our apiary relocated',
  hebrew: 'ריקוד פלמנקו בחצר הסבתא',
  relation: 'After the apiary move, kayak mornings with my grandmother made underwater hockey feel lighter.'
};

test('AC-35: novel, never-anticipated fixture strings are absent from js/ and round-trip through the store unchanged', async () => {
  const src = allJsText();
  Object.values(NOVEL).forEach((s) => assert.equal(src.indexOf(s), -1, s));
  const e = env();
  const r = await e.as('CLIENT').createRecord({
    newConcepts: [[NOVEL.routine], [NOVEL.activity], [NOVEL.circumstance, NOVEL.hebrew]],
    draft: draft({ factors: [{ newConcept: 2, role: 'condition' }, { newConcept: 0, role: 'subject' }, { newConcept: 1, role: 'outcome', valueDescription: 'felt lighter' }], relationDescription: NOVEL.relation })
  });
  assert.equal(r.status, 'COMMITTED');
  const got = await e.as('CLIENT').getRecords({ recordIds: r.ids.recordIds });
  assert.equal(C.materializeContent({ factors: [], relationDescription: got.records[0].relationDescription }, () => null).relationDescription, NOVEL.relation);
  const cs = await e.as('CLIENT').getConcepts({ conceptIds: r.ids.conceptIds });
  assert.deepEqual(cs.concepts.map((c) => c.labels), [[NOVEL.routine], [NOVEL.activity], [NOVEL.circumstance, NOVEL.hebrew]]);
});

// ═══════════════════ User control (AC-46 … AC-49) ═══════════════════
test('AC-46: forgetRecord removes the record and leaves no copy of its content anywhere; links stay as ids; works with consent withdrawn', async () => {
  const e = env();
  const [a, b, c] = await concepts(e, [['a'], ['b'], ['c']]);
  const secret = 'A private sentence the user wants forgotten.';
  const secretConfound = 'a private alternative explanation';
  const old = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject', valueDescription: 'private value text' }], relationDescription: secret, evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'tOld' }], confoundsConsidered: [{ description: secretConfound, source: 'user_stated' }] } }));
  const succ = await e.as('CLIENT').supersede({ predecessorIds: [old], successor: draft({ factors: [{ conceptId: b, role: 'subject' }], relationDescription: 'A new understanding.' }) });
  const other = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [{ kind: 'USER_KNOWLEDGE_RECORD', ref: old }] } }));
  e.state.consent = () => false;
  assert.equal((await e.as('CLIENT').forgetRecord({ recordId: old })).status, 'DELETED');
  const store = JSON.stringify(e.hooks.peek('u1'));
  [secret, secretConfound, 'private value text'].forEach((s) => assert.equal(store.indexOf(s), -1, s));
  const remaining = e.hooks.peek('u1').records;
  assert.equal(remaining.some((r) => r.recordId === old), false);
  assert.deepEqual(remaining.find((r) => r.recordId === succ.ids.recordIds[0]).supersedes, [old], 'link kept as an id');
  assert.equal(remaining.find((r) => r.recordId === other).evidence.supporting[0].ref, old);
  assert.equal((await e.as('CLIENT').forgetRecord({ recordId: old })).code, 'NOT_FOUND');
});

test('AC-47: forgetConcept is refused while any record factor uses it or a concept is merged into it; confound references survive as ids', async () => {
  const e = env();
  const [a, b, c, d] = await concepts(e, [['a'], ['b'], ['c'], ['d']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }], evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't' }], confoundsConsidered: [{ conceptId: d, description: 'alternative', source: 'user_stated' }] } }));
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: a })).code, 'CONCEPT_IN_USE');
  await e.as('CLIENT').retractRecord({ recordId: id });
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: a })).code, 'CONCEPT_IN_USE', 'any status counts');
  await e.as('CLIENT').mergeConcept({ fromConceptId: c, intoConceptId: b });
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: b })).code, 'CONCEPT_IN_USE', 'merge target');
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: d })).status, 'DELETED', 'confound-only reference does not block');
  const conf = (await get(e, id)).evidence.confoundsConsidered[0];
  assert.equal(conf.conceptId, d);
  assert.equal(conf.description, 'alternative');
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: c })).status, 'DELETED');
  assert.equal((await e.as('CLIENT').forgetConcept({ conceptId: b })).status, 'DELETED');
});

test('AC-48: erase under CLIENT removes user_stated records only; under SERVER removes everything; other users untouched', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  const inf = await mk(e, 'SERVER', draft({ source: 'inferred_event', factors: [{ conceptId: a, role: 'subject' }] }));
  e.state.userId = 'u2';
  const [z] = await concepts(e, [['z']]);
  await mk(e, 'CLIENT', draft({ factors: [{ conceptId: z, role: 'subject' }] }));
  e.state.userId = 'u1';
  assert.equal((await e.as('CLIENT').eraseAllForUser()).status, 'DELETED');
  assert.deepEqual(e.hooks.peek('u1').records.map((r) => r.recordId), [inf]);
  assert.equal(e.hooks.peek('u1').concepts.length, 1);
  assert.equal((await e.as('SERVER').eraseAllForUser()).status, 'DELETED');
  assert.deepEqual(e.hooks.peek('u1'), { records: [], concepts: [] });
  assert.equal(e.hooks.peek('u2').records.length, 1);
  assert.equal(e.hooks.peek('u2').concepts.length, 1);
});

test('AC-49 (store half): loss of evidence ≠ forget — every reason leaves the record present, status unchanged, no withdrawal', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  for (const reason of C.UNRESOLVABLE_REASONS) {
    const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
    const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
    e.hooks.resetCalls();
    for (const [w, id] of [['CLIENT', us], ['SERVER', inf]]) {
      const rec = await get(e, id);
      const r = await e.as(w).applyEvidenceAvailability({ recordId: id, results: rec.evidence.supporting.map((x) => ({ refId: x.refId, availability: 'UNRESOLVABLE', reason })) });
      assert.equal(r.status, 'COMMITTED');
      const after = await get(e, id);
      assert.equal(after.status, 'active', reason);
      assert.deepEqual(after.correctionHistory.filter((h) => ['RETRACTED', 'SUPERSEDED', 'ARCHIVED'].indexOf(h.kind) !== -1), []);
    }
    assert.deepEqual(e.hooks.calls.filter((c) => /^delete/.test(c)), []);
    assert.equal(C.isUsableKnowledge(await get(e, us), clock), true, 'user-stated stays usable (PD-1)');
    assert.equal(C.isUsableKnowledge(await get(e, inf), clock), false, 'inferred becomes unusable');
  }
});

// ═══════════════════ Pressure tests A–G (AC-50 … AC-56) ═══════════════════
test('AC-50 (A): a 3-factor inferred relationship across sleep-like, session and difficulty concepts, candidate until a confound check', async () => {
  const e = env();
  const [s, l, d] = await concepts(e, [['rest last week'], ['lower-body session'], ['how hard it felt']]);
  const id = await mk(e, 'SERVER', draft({
    source: 'inferred_pattern', evidenceClass: 'CO_OCCURRENCE',
    factors: [{ conceptId: s, role: 'condition', valueDescription: 'poor all week' }, { conceptId: l, role: 'subject' }, { conceptId: d, role: 'outcome', valueDescription: 'unusually hard' }],
    relationDescription: 'Poor rest over a week co-occurred with an unusually hard lower-body session.',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turnA1' }, { kind: 'CONVERSATION_TURN', ref: 'turnA2' }] }
  }));
  const rec = await get(e, id);
  assert.equal(rec.status, 'candidate');
  assert.equal(C.epistemicOrigin(rec), 'FITME_INFERRED');
  assert.equal((await e.as('SERVER').promoteRecord({ recordId: id })).code, 'PROMOTION_CONDITIONS_NOT_MET');
  await e.as('SERVER').addConfound({ recordId: id, confound: { description: 'a heavier week of work', source: 'inferred_pattern' } });
  await e.as('SERVER').recordConfoundCheck({ recordId: id });
  assert.equal((await e.as('SERVER').promoteRecord({ recordId: id })).status, 'COMMITTED');
});

test('AC-51 (B): a user-stated, explicit, durable 3-factor record with permanent user origin and no universal/causal field', async () => {
  const e = env();
  const [p, ev, h] = await concepts(e, [['pasta dish'], ['evening session'], ['feeling heavy']]);
  const id = await mk(e, 'CLIENT', draft({
    factors: [{ conceptId: p, role: 'subject' }, { conceptId: ev, role: 'condition', valueDescription: 'before' }, { conceptId: h, role: 'outcome' }],
    relationDescription: 'The user has noticed feeling heavy when eating a pasta dish before an evening session.',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turnB' }] }, provenance: { originTurnId: 'turnB' }
  }));
  const rec = await get(e, id);
  assert.equal(rec.status, 'active');
  assert.equal(rec.evidenceClass, 'EXPLICIT_STATEMENT');
  assert.equal(C.isExplicit(rec), true);
  assert.equal(C.isContextual(rec), true);
  assert.deepEqual(Object.keys(rec).sort(), ['conceptIds', 'confidence', 'correctionHistory', 'createdAt', 'evidence', 'evidenceClass', 'expiresAt', 'factors', 'lastEvidenceAt', 'provenance', 'recordId', 'relationDescription', 'safetyFlag', 'schemaVersion', 'source', 'status', 'supersededBy', 'supersedes', 'supportingRefIds', 'temporality', 'updatedAt', 'userId', 'version']);
});

test('AC-52 (C): months later a bounded concept-keyed read returns the record without reading history', async () => {
  const e = env();
  const [p, ev, h, other] = await concepts(e, [['pasta dish'], ['evening session'], ['feeling heavy'], ['unrelated']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: p, role: 'subject' }, { conceptId: ev, role: 'condition' }, { conceptId: h, role: 'outcome' }] }));
  for (let i = 0; i < 30; i++) await mk(e, 'CLIENT', draft({ factors: [{ conceptId: other, role: 'subject', valueDescription: 'n' + i }] }));
  const found = await e.port.queryRecordsByConcepts('u1', { conceptIdsAny: [p], statuses: ['active'], limit: 5 });
  assert.deepEqual(found.map((r) => r.recordId), [id]);
  assert.equal(C.isUsableKnowledge(found[0], clock + 5184000000), true);
});

test('AC-53 (D): correction supersedes atomically, keeps the old record intact with a user-sourced confound; inferred targets go through the governed path', async () => {
  const e = env();
  const [p, ev, h, portion] = await concepts(e, [['pasta dish'], ['evening session'], ['feeling heavy'], ['portion size']]);
  const b = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: p, role: 'subject' }, { conceptId: ev, role: 'condition', valueDescription: 'before' }, { conceptId: h, role: 'outcome' }] }));
  const before = await get(e, b);
  const r = await e.as('CLIENT').supersede({
    predecessorIds: [b],
    successor: draft({ factors: [{ conceptId: portion, role: 'condition', valueDescription: 'huge' }, { conceptId: p, role: 'subject' }, { conceptId: h, role: 'outcome' }], relationDescription: 'The user says the huge portion, not the dish itself, made them feel heavy.', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turnD' }] }, provenance: { originTurnId: 'turnD' } }),
    confoundsForPredecessors: [{ conceptId: portion, description: 'portion size, not the dish itself', source: 'user_stated' }]
  });
  assert.equal(r.status, 'COMMITTED');
  const old = await get(e, b);
  const next = await get(e, r.ids.recordIds[0]);
  assert.equal(old.status, 'superseded');
  assert.deepEqual(old.supersededBy, [next.recordId]);
  assert.deepEqual(next.supersedes, [b]);
  assert.equal(C.contentKey(old), C.contentKey(before));
  assert.equal(old.evidence.confoundsConsidered[0].description, 'portion size, not the dish itself');
  // Same correction against a FITME-inferred target: impossible for CLIENT, atomic under SERVER.
  const inf = await activeInferred(e, [{ conceptId: p, role: 'subject' }, { conceptId: h, role: 'outcome' }]);
  const corr = { predecessorIds: [inf], userOriginTurnId: 'turnD2', successor: draft({ factors: [{ conceptId: portion, role: 'condition' }, { conceptId: h, role: 'outcome' }], relationDescription: 'The portion was the problem.', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turnD2' }] }, provenance: { originTurnId: 'turnD2' } }) };
  assert.equal((await e.as('CLIENT').supersede({ predecessorIds: [inf], successor: corr.successor })).code, 'AUTHORITY');
  assert.equal((await e.as('SERVER').correctInferredKnowledge(corr)).status, 'COMMITTED');
  assert.equal((await get(e, inf)).status, 'superseded');
  assert.equal((await get(e, inf)).source, 'inferred_pattern');
});

test('AC-54 (E): a completely novel relationship runs through unmodified modules with no release', async () => {
  const e = env();
  const [x, y, z] = await concepts(e, [[NOVEL.circumstance], [NOVEL.routine, NOVEL.hebrew], [NOVEL.activity]]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: x, role: 'condition' }, { conceptId: y, role: 'subject' }, { conceptId: z, role: 'outcome', valueDescription: 'felt lighter' }], relationDescription: NOVEL.relation }));
  const rec = await get(e, id);
  assert.deepEqual(C.validateRecord(rec), { ok: true });
  assert.equal(C.isExplicit(rec), true);
});

test('AC-55 (F): deleted evidence is marked, never removed or replaced; inferred becomes UNSUPPORTED, user-stated stays EXPLICIT', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }], { evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'tF1' }, { kind: 'DAY_LOG', ref: '2026-05-05' }] } });
  const infBefore = await get(e, inf);
  await e.as('SERVER').applyEvidenceAvailability({ recordId: inf, results: [{ refId: 'CONVERSATION_TURN:tF1', availability: 'UNRESOLVABLE', reason: 'USER_DELETED' }, { refId: 'DAY_LOG:2026-05-05', availability: 'UNRESOLVABLE', reason: 'RETENTION' }] });
  await e.as('CLIENT').applyEvidenceAvailability({ recordId: us, results: [{ refId: 'CONVERSATION_TURN:turnA', availability: 'UNRESOLVABLE', reason: 'USER_RESET' }] });
  const infAfter = await get(e, inf);
  assert.deepEqual(infAfter.evidence.supporting.map((r) => r.refId), infBefore.evidence.supporting.map((r) => r.refId));
  assert.equal(C.evidenceStanding(infAfter).basis, 'UNSUPPORTED');
  assert.equal(C.isUsableKnowledge(infAfter, clock), false);
  assert.equal(infAfter.status, 'active');
  const usAfter = await get(e, us);
  assert.equal(C.evidenceStanding(usAfter).basis, 'EXPLICIT');
  assert.equal(C.evidenceStanding(usAfter).statementReferenceUnresolvable, true);
  assert.equal(C.isUsableKnowledge(usAfter, clock), true);
});

test('AC-56 (G): merge then unmerge is exact and fully logged; records are never rewritten', async () => {
  const e = env();
  const [pasta, spaghetti] = await concepts(e, [['pasta'], ['spaghetti']]);
  const r1 = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: pasta, role: 'subject' }] }));
  const r2 = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: spaghetti, role: 'subject' }] }));
  const recordsBefore = JSON.stringify(e.hooks.peek('u1').records);
  assert.equal((await e.as('CLIENT').mergeConcept({ fromConceptId: spaghetti, intoConceptId: pasta, reason: 'same food' })).status, 'COMMITTED');
  const all = () => e.hooks.peek('u1').concepts;
  const getC = (id) => all().find((c) => c.conceptId === id) || null;
  assert.equal(C.resolveConceptRoot(spaghetti, getC).rootId, pasta);
  assert.deepEqual(C.effectiveLabels(pasta, all()), ['pasta', 'spaghetti']);
  const found = await e.port.queryRecordsByConcepts('u1', { conceptIdsAny: [pasta, spaghetti], statuses: ['active'], limit: 10 });
  assert.deepEqual(found.map((r) => r.recordId).sort(), [r1, r2].sort());
  assert.equal((await e.as('CLIENT').unmergeConcept({ conceptId: spaghetti, reason: 'different after all' })).status, 'COMMITTED');
  assert.equal(C.resolveConceptRoot(spaghetti, getC).rootId, spaghetti);
  assert.deepEqual(getC(spaghetti).history.map((h) => h.kind), ['CREATED', 'MERGED', 'UNMERGED']);
  assert.equal(JSON.stringify(e.hooks.peek('u1').records), recordsBefore);
});

// ═══════════════════ INV-UC-S at store level (AC-57, AC-59, AC-61) ═══════════════════
test('AC-57 (store): the governed correction commits one successor + every target supersession through one commit', async () => {
  const e = env();
  const [a, b, c] = await concepts(e, [['a'], ['b'], ['c']]);
  const i1 = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
  const i2 = await activeInferred(e, [{ conceptId: b, role: 'subject' }]);
  e.hooks.resetCalls();
  const r = await e.as('SERVER').correctInferredKnowledge({ predecessorIds: [i1, i2], userOriginTurnId: 'turnQ', successor: draft({ factors: [{ conceptId: c, role: 'subject' }], evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turnQ' }] }, provenance: { originTurnId: 'turnQ' } }) });
  assert.equal(r.status, 'COMMITTED');
  assert.deepEqual(e.hooks.writeCalls(), ['commit'], 'exactly one atomic write');
  assert.deepEqual(r.ids.updatedIds.slice().sort(), [i1, i2].sort());
  const succ = await get(e, r.ids.recordIds[0]);
  assert.equal(succ.source, 'user_stated');
  assert.deepEqual(succ.supersedes, [i1, i2]);
  for (const id of [i1, i2]) {
    const p = await get(e, id);
    assert.equal(p.status, 'superseded');
    assert.equal(p.correctionHistory.slice(-1)[0].userOriginTurnId, 'turnQ');
  }
});

test('AC-59 (store): SERVER can emit user_stated only via correctInferredKnowledge; CLIENT can never call it; no operation changes a source', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['a'], ['b']]);
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
  const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  e.hooks.resetCalls();
  assert.equal((await e.as('SERVER').createRecord({ draft: draft({ factors: [{ conceptId: a, role: 'subject' }] }) })).code, 'AUTHORITY');
  assert.deepEqual(e.hooks.calls, [], 'rejected before any port call');
  assert.equal((await e.as('SERVER').supersede({ predecessorIds: [inf], successor: draft({ factors: [{ conceptId: b, role: 'subject' }] }) })).code, 'AUTHORITY');
  assert.equal((await e.as('CLIENT').correctInferredKnowledge({ predecessorIds: [inf], userOriginTurnId: 't', successor: draft({ factors: [{ conceptId: b, role: 'subject' }], evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't' }] }, provenance: { originTurnId: 't' } }) })).code, 'AUTHORITY');
  assert.deepEqual(e.hooks.writeCalls(), []);
  const sourcesBefore = e.hooks.peek('u1').records.map((r) => r.recordId + ':' + r.source).sort();
  await e.as('CLIENT').setConfidence({ recordId: us, confidence: 0.5 });
  await e.as('SERVER').setConfidence({ recordId: inf, confidence: 0.9 });
  await e.as('CLIENT').raiseSafetyFlag({ recordId: us });
  assert.deepEqual(e.hooks.peek('u1').records.map((r) => r.recordId + ':' + r.source).sort(), sourcesBefore);
});

test('AC-61: a failed or conflicting governed correction leaves neither successor nor superseded target; statuses stay within the five', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['a'], ['b']]);
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
  const req = () => ({ predecessorIds: [inf], userOriginTurnId: 'tX', successor: draft({ factors: [{ conceptId: b, role: 'subject' }], evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'tX' }] }, provenance: { originTurnId: 'tX' } }) });
  const before = JSON.stringify(e.hooks.peek('u1'));
  e.hooks.failNext('commit');
  assert.equal((await e.as('SERVER').correctInferredKnowledge(req())).status, 'FAILED');
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
  e.hooks.conflictNextCommit();
  assert.equal((await e.as('SERVER').correctInferredKnowledge(req())).status, 'CONFLICT');
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
  assert.equal((await get(e, inf)).status, 'active');
  assert.equal((await e.as('SERVER').correctInferredKnowledge(req())).status, 'COMMITTED');
  e.hooks.peek('u1').records.forEach((r) => assert.ok(C.STATUSES.indexOf(r.status) !== -1, r.status));
});

// ═══════════════════ §16.4 proof: forbidden CLIENT supersede stops at the target read ═══════════════════
test('AC-26 (§16.4 proof): a forbidden CLIENT supersede of FITME-inferred knowledge stops after the target read — no concept read, no id allocation, no construction', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['a'], ['b']]);
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
  const before = JSON.stringify(e.hooks.peek('u1'));
  e.hooks.resetCalls();
  const r = await e.as('CLIENT').supersede({
    predecessorIds: [inf],
    successor: draft({ factors: [{ conceptId: b, role: 'subject' }] }),
    newConcepts: [['would need a new concept']],
    confoundsForPredecessors: [{ conceptId: b, description: 'x', source: 'user_stated' }]
  });
  assert.equal(r.code, 'AUTHORITY');
  assert.deepEqual(e.hooks.calls, ['getRecords']);
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
});

// ═══════════════════ Identity binding (AC-62) ═══════════════════
test('AC-62: supplying or changing userId grants no authority', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  const us = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }]);
  // 1. No operation request accepts a userId.
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: us, confidence: 0.2, userId: 'u1' })).code, 'UNKNOWN_FIELD');
  assert.equal((await e.as('CLIENT').createRecord({ draft: draft({ factors: [{ conceptId: a, role: 'subject' }] }), userId: 'uX' })).code, 'UNKNOWN_FIELD');
  // 2. The owning userId does not unlock FITME-sourced records for CLIENT.
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: inf, confidence: 0.2 })).code, 'AUTHORITY');
  assert.equal((await e.as('CLIENT').forgetRecord({ recordId: inf })).code, 'AUTHORITY');
  // 3. Another userId can neither see nor mutate the first user's records.
  const before = JSON.stringify(e.hooks.peek('u1'));
  e.state.userId = 'u2';
  for (const w of ['CLIENT', 'SERVER']) {
    const s = e.as(w);
    assert.equal((await s.getRecords({ recordIds: [us, inf] })).records.length, 0);
    for (const id of [us, inf]) {
      assert.equal((await s.setConfidence({ recordId: id, confidence: 0.1 })).code, 'NOT_FOUND', w);
      assert.equal((await s.retractRecord({ recordId: id })).code, 'NOT_FOUND', w);
      assert.equal((await s.forgetRecord({ recordId: id })).code, 'NOT_FOUND', w);
    }
  }
  e.state.userId = 'u1';
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
  // 4. A document carrying a foreign userId is rejected, never adopted.
  e.hooks.tamper((doc) => Object.assign(doc, { userId: 'u9' }));
  assert.equal((await e.as('CLIENT').setConfidence({ recordId: us, confidence: 0.3 })).code, 'STORED_DOCUMENT_INVALID');
  e.hooks.tamper(null);
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
});

test('AC-60 (store): a relabel of an inference is rejected; the inferred target is unchanged and no user_stated record exists afterwards', async () => {
  const e = env();
  const [a, b] = await concepts(e, [['a'], ['b']]);
  const inf = await activeInferred(e, [{ conceptId: a, role: 'subject' }, { conceptId: b, role: 'outcome', valueDescription: 'strong' }], { relationDescription: 'Identical wording.' });
  const before = JSON.stringify(e.hooks.peek('u1'));
  const r = await e.as('SERVER').correctInferredKnowledge({
    predecessorIds: [inf], userOriginTurnId: 'tR',
    successor: draft({ factors: [{ conceptId: b, role: 'outcome', valueDescription: 'strong' }, { conceptId: a, role: 'subject' }], relationDescription: 'Identical wording.', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'tR' }] }, provenance: { originTurnId: 'tR' } })
  });
  assert.equal(r.code, 'CORRECTION_IDENTICAL_TO_PREDECESSOR');
  assert.equal(JSON.stringify(e.hooks.peek('u1')), before);
  assert.equal(e.hooks.peek('u1').records.some((x) => x.source === 'user_stated'), false);
});

test('AC-28 (reads): a consent-refused read returns CONSENT_NOT_GRANTED with an empty result', async () => {
  const e = env();
  const [a] = await concepts(e, [['a']]);
  const id = await mk(e, 'CLIENT', draft({ factors: [{ conceptId: a, role: 'subject' }] }));
  e.state.consent = () => false;
  e.hooks.resetCalls();
  const r1 = await e.as('CLIENT').getRecords({ recordIds: [id] });
  const r2 = await e.as('CLIENT').getConcepts({ conceptIds: [a] });
  assert.equal(r1.status, 'CONSENT_NOT_GRANTED');
  assert.deepEqual(r1.records, []);
  assert.equal(r2.status, 'CONSENT_NOT_GRANTED');
  assert.deepEqual(r2.concepts, []);
  assert.deepEqual(e.hooks.calls, []);
});
