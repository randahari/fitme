// USI-001 — executor and ports (docs/specs/USI_001_SPEC_v1.0.md §16-§18; AC-27, AC-28, AC-29,
// AC-32 … AC-36, AC-53). Gate decisions are produced by the real gate from hand-built presented
// documents read back from a real E.0.2c store (CLIENT) and the governed-port test double (SERVER).
// Run with: node --test tests/usi001Executor.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const X = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeExecutor.js'));
const G = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeGate.js'));
const C = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeContract.js'));
const Store = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeStore.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');
const { createGovernedCorrectionPortTestDouble } = require('./fixtures/usiGovernedCorrectionPortTestDouble.js');

const USER = 'exec-user';
const TURN = 'x-turn-1';
let env;
async function setup() {
  const { port, hooks } = createInMemoryPort();
  let clock = 100;
  const now = () => (clock += 10);
  Store.configure({ port, now, writerAuthority: 'CLIENT', isLearningConsentGranted: () => true, userId: USER, producer: 'usi-001.intake', producerVersion: '1.0.0' });
  const governed = createGovernedCorrectionPortTestDouble({ port, now, userId: USER });
  assert.equal(governed.configureStatus, 'CONFIGURED');
  X.configure({ clientStore: Store, governedCorrectionPort: governed.port });
  env = { port, hooks, governed, peek: () => hooks.peek(USER) };
  return env;
}
test.afterEach(() => { X.configure({}); Store.configure({}); });

async function concept(label) { return (await Store.createConcept({ labels: [label] })).ids.conceptIds[0]; }
const draftOf = (source, factors, relation) => ({ factors, relationDescription: relation, evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'RECURRENCE', temporality: 'DURABLE', confidence: source === 'user_stated' ? 1 : 0.5, source, safetyFlag: 'STANDARD', evidence: { supporting: [{ kind: 'DAY_LOG', ref: 'd1' }] }, provenance: { originTurnId: 'seed' } });
async function userRecord(factors, relation) { return (await Store.createRecord({ draft: draftOf('user_stated', factors, relation) })).ids.recordIds[0]; }
async function inferredRecord(factors, relation) { return (await env.governed.store.createRecord({ draft: draftOf('inferred_event', factors, relation) })).ids.recordIds[0]; }
async function presented() {
  const all = env.peek();
  return { concepts: all.concepts, records: all.records.filter((r) => r.status === 'active' || r.status === 'candidate') };
}
function proposal(o) { return Object.assign({ operation: 'NEW', targetRecordIds: [], requestText: null, referenceText: null, referenceKind: null, statementText: null, factors: [], temporality: 'DURABLE', confoundText: null, safetyAdjacent: false }, o); }
function factor(o) { return Object.assign({ conceptId: null, newConceptLabel: null, mentionText: null, role: 'subject', valueText: null, cpiReference: false }, o); }
const nf = (l, role) => factor({ newConceptLabel: l, mentionText: l, role: role || 'subject' });
const mut = (op, t, req, ref, extra) => proposal(Object.assign({ operation: op, targetRecordIds: [t], requestText: req, referenceText: ref, referenceKind: 'NAMED', temporality: null }, extra || {}));
const NONE = { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: false, anchor: { valid: false, text: null }, gateReason: null, authorized: false } };
async function decide(text, proposals, recognition) {
  const p = await presented();
  const out = G.evaluate({ proposals, turn: { turnId: TURN, text }, presentedConcepts: p.concepts, presentedRecords: p.records, recognition: recognition || NONE, recentConversationContext: null });
  return { status: 'EVALUATED', turnId: TURN, results: out.results };
}

test('AC-29: an accepted NEW proposal commits an E.0.2c-valid user_stated, EXPLICIT_STATEMENT, active record (confidence 1, expiresAt null, CONVERSATION_TURN:turnId, originTurnId, producer usi-001.intake)', async () => {
  await setup();
  const t = 'Loud music in the car keeps me alert.';
  const res = await X.execute({ decision: await decide(t, [proposal({ statementText: 'Loud music in the car keeps me alert', factors: [nf('Loud music', 'condition'), nf('alert', 'outcome')] })]) });
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  const r = env.peek().records[0];
  assert.equal(C.validateRecord(r).ok, true);
  assert.equal(r.source, 'user_stated');
  assert.equal(r.evidenceClass, 'EXPLICIT_STATEMENT');
  assert.equal(r.status, 'active');
  assert.equal(r.confidence, 1);
  assert.equal(r.expiresAt, null);
  assert.deepEqual(r.evidence.supporting.map((e) => e.refId), ['CONVERSATION_TURN:' + TURN]);
  assert.equal(r.provenance.originTurnId, TURN);
  assert.equal(r.provenance.producer, 'usi-001.intake');
  assert.equal(r.provenance.producerVersion, '1.0.0');
});

test('AC-27: a CPI-reference plan is SKIPPED unless the CPI record was persisted with a valid memory id; then cites TYPED_MEMORY_RECORD:<memoryId>', async () => {
  await setup();
  const t = 'I enjoy running because it clears my head.';
  const recognition = { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: true, anchor: { valid: true, text: 'I enjoy running' }, gateReason: 'OK', authorized: true } };
  const decision = await decide(t, [proposal({ statementText: 'it clears my head', factors: [factor({ newConceptLabel: 'running', mentionText: 'running', cpiReference: true }), nf('clears my head', 'outcome')] })], recognition);
  for (const cpiRecord of [undefined, { persisted: false, memoryId: 'conv_pref_A_running' }, { persisted: true, memoryId: null }, { persisted: true, memoryId: 'bad id with spaces' }]) {
    const res = await X.execute({ decision, cpiRecord });
    assert.deepEqual(res.outcomes.map((o) => [o.status, o.code]), [['SKIPPED', 'CPI_RECORD_NOT_PERSISTED']]);
  }
  assert.equal(env.hooks.writeCalls().length, 0);
  const res = await X.execute({ decision, cpiRecord: { persisted: true, memoryId: 'conv_pref_ACTIVITY_SENTIMENT_running' } });
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.ok(env.peek().records[0].evidence.supporting.some((e) => e.refId === 'TYPED_MEMORY_RECORD:conv_pref_ACTIVITY_SENTIMENT_running'));
  assert.equal(Object.isFrozen(decision.results[0].plan.request.draft.evidence.supporting), true, 'the plan itself is never mutated');
});

test('AC-32: CORRECT of a user-stated target commits one atomic supersede (symmetric links, user-sourced confound); identical content is rejected', async () => {
  await setup();
  const meals = await concept('late meals');
  const target = await userRecord([{ conceptId: meals, role: 'condition' }], 'late meals ruin my sleep');
  const t = 'Actually late meals are fine, it is screens in bed, because I scroll for hours.';
  const before = env.hooks.writeCalls().length;
  const res = await X.execute({ decision: await decide(t, [mut('CORRECT', target, t, 'late meals', { statementText: 'it is screens in bed', factors: [nf('screens in bed', 'condition')], temporality: 'DURABLE', confoundText: 'because I scroll for hours' })]) });
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.equal(env.hooks.writeCalls().length - before, 1, 'one atomic commit');
  const pred = env.peek().records.find((r) => r.recordId === target);
  const succ = env.peek().records.find((r) => r.recordId === pred.supersededBy[0]);
  assert.equal(pred.status, 'superseded');
  assert.deepEqual(succ.supersedes, [target]);
  assert.equal(pred.evidence.confoundsConsidered[0].description, 'because I scroll for hours');
  assert.equal(pred.evidence.confoundsConsidered[0].source, 'user_stated');
  assert.equal(env.governed.calls.length, 0, 'never the governed port');
  // identical content → rejected by the gate
  const t2 = 'it is screens in bed';
  const d2 = await decide(t2, [mut('CORRECT', succ.recordId, t2, 'screens in bed', { statementText: 'it is screens in bed', factors: [factor({ conceptId: succ.factors[0].conceptId, mentionText: 'screens in bed', role: 'condition' })], temporality: 'DURABLE' })]);
  assert.equal(d2.results[0].code, 'CORRECTION_IDENTICAL_TO_PREDECESSOR');
});

test('AC-33: CORRECT of a FITME-sourced target calls only the governed port\'s correctInferredKnowledge; INV-UC-S holds; a CPI reference in such a proposal is rejected', async () => {
  await setup();
  const pasta = await concept('pasta');
  const heavy = await concept('feeling heavy');
  const target = await inferredRecord([{ conceptId: pasta, role: 'condition' }, { conceptId: heavy, role: 'outcome' }], 'pasta co-occurs with feeling heavy');
  const t = 'Actually, it wasn\'t pasta — it was the huge portion';
  const clientCommitsBefore = env.hooks.writeCalls().length;
  const decision = await decide(t, [mut('CORRECT', target, t, 'pasta', { statementText: 'it was the huge portion', factors: [nf('huge portion', 'condition'), factor({ conceptId: heavy, role: 'outcome' })], temporality: 'DURABLE' })]);
  assert.equal(decision.results[0].plan.storeOperation, 'correctInferredKnowledge');
  const res = await X.execute({ decision });
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.deepEqual(env.governed.calls.map((c) => c.name), ['correctInferredKnowledge']);
  assert.equal(env.hooks.writeCalls().length - clientCommitsBefore, 1);
  const pred = env.peek().records.find((r) => r.recordId === target);
  const succ = env.peek().records.find((r) => r.recordId === pred.supersededBy[0]);
  assert.equal(succ.source, 'user_stated');
  assert.equal(succ.status, 'active');
  assert.deepEqual(succ.evidence.supporting.map((e) => e.refId), ['CONVERSATION_TURN:' + TURN]);
  assert.equal(succ.provenance.originTurnId, TURN);
  assert.equal(pred.status, 'superseded');
  succ.correctionHistory.forEach((h) => assert.equal(h.userOriginTurnId, TURN));
  assert.equal(pred.correctionHistory.slice(-1)[0].userOriginTurnId, TURN);
  assert.equal(pred.evidence.supporting[0].refId, 'DAY_LOG:d1', 'inferred evidence stays on the predecessor');
});

test('AC-33: a CPI reference factor in a CORRECT of a FITME-sourced target is rejected INVALID_CPI_REFERENCE (the successor evidence must be exactly the turn)', async () => {
  await setup();
  const portion = await concept('portion');
  const target = await inferredRecord([{ conceptId: portion, role: 'condition' }], 'portion co-occurs with fatigue');
  const t = 'I love pasta, but the problem is the portion';
  const recognition = { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: true, anchor: { valid: true, text: 'I love pasta' }, gateReason: 'OK', authorized: true } };
  const d = await decide(t, [mut('CORRECT', target, 'the problem is the portion', 'portion', { statementText: 'the problem is the portion', factors: [factor({ newConceptLabel: 'pasta', mentionText: 'pasta', cpiReference: true }), factor({ conceptId: portion, mentionText: 'portion', role: 'condition' })], temporality: 'DURABLE' })], recognition);
  assert.equal(d.results[0].code, 'INVALID_CPI_REFERENCE');
  assert.equal((await X.execute({ decision: d, cpiRecord: { persisted: true, memoryId: 'conv_pref_x' } })).outcomes[0].status, 'REJECTED');
  assert.equal(env.governed.calls.length, 0);
});

test('AC-34 / AC-35: WITHDRAW → retractRecord with userOriginTurnId and FORGET → forgetRecord — CLIENT for user-stated targets, governed port for FITME-sourced ones', async () => {
  await setup();
  const a = await concept('night walks');
  const b = await concept('cold showers');
  const us = await userRecord([{ conceptId: a, role: 'subject' }], 'I take night walks');
  const inf = await inferredRecord([{ conceptId: b, role: 'subject' }], 'cold showers in the morning');
  const t1 = 'night walks are not true anymore';
  const r1 = await X.execute({ decision: await decide(t1, [mut('WITHDRAW', us, t1, 'night walks')]) });
  assert.deepEqual(r1.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.equal(env.peek().records.find((r) => r.recordId === us).correctionHistory.slice(-1)[0].userOriginTurnId, TURN);
  assert.equal(env.governed.calls.length, 0);
  const t2 = 'cold showers are not true anymore';
  const r2 = await X.execute({ decision: await decide(t2, [mut('WITHDRAW', inf, t2, 'cold showers')]) });
  assert.deepEqual(r2.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.deepEqual(env.governed.calls.map((c) => [c.name, c.request.userOriginTurnId]), [['retractRecord', TURN]]);
  assert.equal(env.peek().records.find((r) => r.recordId === inf).status, 'rejected');
  // forget (fresh targets)
  const c = await concept('balcony');
  const d = await concept('podcasts');
  const us2 = await userRecord([{ conceptId: c, role: 'subject' }], 'balcony mornings');
  const inf2 = await inferredRecord([{ conceptId: d, role: 'subject' }], 'podcasts on runs');
  const t3 = 'Forget what I said about the balcony';
  const r3 = await X.execute({ decision: await decide(t3, [mut('FORGET', us2, t3, 'the balcony')]) });
  assert.deepEqual(r3.outcomes.map((o) => o.status), ['DELETED']);
  const t4 = 'Forget the podcasts thing';
  const r4 = await X.execute({ decision: await decide(t4, [mut('FORGET', inf2, t4, 'podcasts')]) });
  assert.deepEqual(r4.outcomes.map((o) => o.status), ['DELETED']);
  assert.deepEqual(env.governed.calls.slice(-1).map((x) => x.name), ['forgetRecord']);
  assert.equal(env.peek().records.some((r) => r.recordId === us2 || r.recordId === inf2), false);
});

test('AC-35 / E.0.2c §17 item 4: forget is not blocked by withdrawn consent', async () => {
  await setup();
  const c = await concept('balcony');
  const us = await userRecord([{ conceptId: c, role: 'subject' }], 'balcony mornings');
  const t = 'Forget what I said about the balcony';
  const decision = await decide(t, [mut('FORGET', us, t, 'the balcony')]);
  Store.configure({ port: env.port, now: () => 999999, writerAuthority: 'CLIENT', isLearningConsentGranted: () => false, userId: USER, producer: 'usi-001.intake', producerVersion: '1.0.0' });
  const res = await X.execute({ decision });
  assert.deepEqual(res.outcomes.map((o) => o.status), ['DELETED']);
});

test('AC-36: a failing or conflicting commit leaves no partial state; one proposal\'s failure does not undo another\'s commit; every outcome is reported', async () => {
  await setup();
  const t = 'Loud music keeps me alert. Long naps make me groggy.';
  const decision = await decide(t, [
    proposal({ statementText: 'Loud music keeps me alert', factors: [nf('Loud music')] }),
    proposal({ statementText: 'Long naps make me groggy', factors: [nf('Long naps')] }),
    proposal({ statementText: 'not in turn', factors: [nf('x')] })
  ]);
  env.hooks.conflictNextCommit();
  const res = await X.execute({ decision });
  assert.deepEqual(res.outcomes.map((o) => [o.proposalIndex, o.status]), [[0, 'CONFLICT'], [1, 'COMMITTED'], [2, 'REJECTED']]);
  assert.equal(res.outcomes[2].code, 'NOT_LITERAL');
  const all = env.peek();
  assert.equal(all.records.length, 1);
  assert.equal(all.concepts.length, 1, 'the conflicted change set created no orphan concept');
  env.hooks.failNext('commit');
  const res2 = await X.execute({ decision: await decide('Cold rooms help me focus', [proposal({ statementText: 'Cold rooms help me focus', factors: [nf('Cold rooms')] })]) });
  assert.deepEqual(res2.outcomes.map((o) => o.status), ['FAILED']);
  assert.equal(env.peek().records.length, 1);
});

test('AC-28: no USI path writes Typed Memory — the executor writes only through the injected client store and governed port', async () => {
  await setup();
  const writes = [];
  const spyStore = new Proxy(Store, { get: (o, k) => (typeof o[k] === 'function' ? (...a) => { writes.push('client.' + String(k)); return o[k](...a); } : o[k]) });
  X.configure({ clientStore: spyStore, governedCorrectionPort: env.governed.port });
  await X.execute({ decision: await decide('Loud music keeps me alert', [proposal({ statementText: 'Loud music keeps me alert', factors: [nf('Loud music')] })]) });
  assert.deepEqual(writes, ['client.createRecord']);
});

test('AC-53: authority anchors never appear in any persisted record, history entry or plan', async () => {
  await setup();
  const c = await concept('night walks');
  const us = await userRecord([{ conceptId: c, role: 'subject' }], 'I take night walks');
  const t = 'ZZQ-REQUEST: honestly the night walks thing is not true anymore';
  const decision = await decide(t, [mut('WITHDRAW', us, t, 'the night walks thing')]);
  assert.equal(JSON.stringify(decision).indexOf('ZZQ-REQUEST'), -1);
  assert.equal(JSON.stringify(decision).indexOf('the night walks thing'), -1);
  await X.execute({ decision });
  const s = JSON.stringify(env.peek());
  assert.equal(s.indexOf('ZZQ-REQUEST'), -1);
  assert.equal(s.indexOf('the night walks thing'), -1);
});

test('the executor never throws: no decision, junk results, unconfigured targets', async () => {
  X.configure({});
  assert.deepEqual(await X.execute(), { status: 'NO_DECISION', outcomes: [] });
  assert.deepEqual(await X.execute({ decision: { status: 'SKIPPED', reason: 'x' } }), { status: 'NO_DECISION', outcomes: [] });
  const r = await X.execute({ decision: { status: 'EVALUATED', results: [null, { proposalIndex: 1, status: 'ACCEPTED', plan: { route: 'CLIENT', storeOperation: 'createRecord', request: {} } }, { proposalIndex: 2, status: 'ACCEPTED', plan: { route: 'ELSEWHERE', storeOperation: 'createRecord', request: {} } }] } });
  assert.deepEqual(r.outcomes.map((o) => [o.status, o.code]), [['REJECTED', null], ['FAILED', 'NOT_CONFIGURED'], ['FAILED', 'INVALID_PLAN']]);
});
