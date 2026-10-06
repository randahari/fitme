// USI-001 — coordinator: §12 preconditions, §13 bounded presentation, one interpreter call
// (docs/specs/USI_001_SPEC_v1.0.md §12-§14, §25; AC-13, AC-14, AC-15, AC-16, AC-37). Real E.0.2c
// store over the in-memory port; interpreter callClaude stubbed and counted.
// Run with: node --test tests/usi001Coordinator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const U = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntake.js'));
const Gate = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeActivationGate.js'));
const I = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeInterpreter.js'));
const Store = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeStore.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');

const USER = 'coord-user';
let env;
function setup(opts) {
  const o = opts || {};
  const { port, hooks } = createInMemoryPort();
  let clock = 100;
  const state = { consent: true };
  Store.configure({ port, now: () => (clock += 10), writerAuthority: 'CLIENT', isLearningConsentGranted: () => state.consent, userId: USER, producer: 'usi-001.intake', producerVersion: '1.0.0' });
  const bodies = [];
  I.configure({ callClaude: async (b) => { bodies.push(b); return { content: [{ type: 'text', text: JSON.stringify({ proposals: o.proposals || [] }) }] }; } });
  U.configure({ store: Store, interpreter: I });
  env = { port, hooks, state, bodies };
  return env;
}
test.afterEach(() => { Gate.__setEnabledForTests__(false); I.configure({ callClaude: null }); U.configure({ store: null }); Store.configure({}); });

const OK_REC = { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: false, anchor: { valid: false, text: null }, gateReason: null, authorized: false } };
function input(over) {
  return Object.assign({
    turn: { turnId: 'c-turn-1', text: 'I usually sleep badly before an early shift.' },
    turnUnderstanding: { interpretationStatus: 'CLASSIFIED', userStatedKnowledge: { present: true, intent: 'NEW_USER_KNOWLEDGE', anchorText: 'I usually sleep badly' } },
    recognition: OK_REC,
    recentConversationContext: null,
    readConsent: () => true
  }, over || {});
}
function rec(over) { return JSON.parse(JSON.stringify(Object.assign({}, OK_REC, over))); }

test('AC-13: gate on, detector negative (absent, false, malformed) → 0 USI calls and SKIPPED DETECTOR_NEGATIVE', async () => {
  setup();
  Gate.__setEnabledForTests__(true);
  for (const tu of [{ interpretationStatus: 'CLASSIFIED' }, { userStatedKnowledge: { present: false, intent: null, anchorText: null } }, { userStatedKnowledge: { present: true, intent: 'X', anchorText: 'a' } }, null]) {
    assert.deepEqual(await U.evaluate(input({ turnUnderstanding: tu })), { status: 'SKIPPED', reason: 'DETECTOR_NEGATIVE' });
  }
  assert.equal(env.bodies.length, 0);
  assert.equal(env.hooks.calls.length, 0, 'no store read');
});

test('AC-14: each §12 precondition failing on its own → 0 USI calls, no store read, SKIPPED with the matching reason', async () => {
  setup();
  const cases = [
    ['gate off', () => Gate.__setEnabledForTests__(false), input(), 'ACTIVATION_GATE_OFF'],
    ['consent false', null, input({ readConsent: () => false }), 'CONSENT_NOT_GRANTED'],
    ['consent throws', null, input({ readConsent: () => { throw new Error('x'); } }), 'CONSENT_READ_FAILED'],
    ['consent missing', null, input({ readConsent: undefined }), 'CONSENT_NOT_GRANTED'],
    ['safety unavailable', null, input({ recognition: rec({ safety: { available: false, ownedSpans: [] } }) }), 'SAFETY_RECOGNITION_UNAVAILABLE'],
    ['cpi unavailable', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { available: false }) }) }), 'CPI_RECOGNITION_UNAVAILABLE'],
    ['veto', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { recognized: true, gateReason: 'SAFETY_VETO', anchor: { valid: true, text: 'I usually' } }) }) }), 'CPI_SAFETY_VETO'],
    ['veto durable', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { recognized: true, gateReason: 'SAFETY_VETO_DURABLE', anchor: { valid: true, text: 'I usually' } }) }) }), 'CPI_SAFETY_VETO'],
    ['veto unavailable', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { recognized: true, gateReason: 'SAFETY_VETO_UNAVAILABLE', anchor: { valid: true, text: 'I usually' } }) }) }), 'CPI_SAFETY_VETO'],
    ['cpi anchor invalid', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { recognized: true, gateReason: 'OK', authorized: true }) }) }), 'CPI_ANCHOR_INVALID'],
    ['cpi anchor not in turn', null, input({ recognition: rec({ cpi: Object.assign({}, OK_REC.cpi, { recognized: true, gateReason: 'OK', authorized: true, anchor: { valid: true, text: 'elsewhere' } }) }) }), 'CPI_ANCHOR_INVALID'],
    ['store unconfigured', () => U.configure({ store: null }), input(), 'NOT_CONFIGURED'],
    ['interpreter unconfigured', () => I.configure({ callClaude: null }), input(), 'NOT_CONFIGURED'],
    ['invalid turn id', null, input({ turn: { turnId: 'has space', text: 'x' } }), 'INVALID_TURN']
  ];
  for (const [name, prep, inp, reason] of cases) {
    setup();
    Gate.__setEnabledForTests__(true);
    if (prep) prep();
    const d = await U.evaluate(inp);
    assert.deepEqual(d, { status: 'SKIPPED', reason }, name);
    assert.equal(env.bodies.length, 0, name + ': no model call');
    assert.equal(env.hooks.calls.length, 0, name + ': no store read');
  }
});

test('AC-15 / §25: all preconditions hold → exactly one USI call and an EVALUATED decision; interpreter failure → FAILED, no retry', async () => {
  setup({ proposals: [{ operation: 'NEW', targetRecordIds: [], requestText: null, referenceText: null, referenceKind: null, statementText: 'I usually sleep badly', factors: [{ conceptId: null, newConceptLabel: 'sleep badly', mentionText: 'sleep badly', role: 'outcome', valueText: null, cpiReference: false }], temporality: 'DURABLE', confoundText: null, safetyAdjacent: false }] });
  Gate.__setEnabledForTests__(true);
  const d = await U.evaluate(input());
  assert.equal(env.bodies.length, 1);
  assert.equal(d.status, 'EVALUATED');
  assert.equal(d.turnId, 'c-turn-1');
  assert.equal(d.results[0].status, 'ACCEPTED');
  assert.ok(Object.isFrozen(d));
  let calls = 0;
  I.configure({ callClaude: async () => { calls++; throw new Error('down'); } });
  assert.deepEqual(await U.evaluate(input()), { status: 'FAILED', reason: 'INTERPRETER_FAILED' });
  assert.equal(calls, 1);
});

test('store read failure → FAILED decision and no model call', async () => {
  setup();
  Gate.__setEnabledForTests__(true);
  env.hooks.failNext('queryRecentConcepts');
  assert.deepEqual(await U.evaluate(input()), { status: 'FAILED', reason: 'STORE_READ_FAILED' });
  assert.equal(env.bodies.length, 0);
});

test('AC-37: with consent false the store reads refuse and no USI call is made, even if the coordinator\'s own consent read were bypassed', async () => {
  setup();
  Gate.__setEnabledForTests__(true);
  env.state.consent = false;
  assert.deepEqual(await U.evaluate(input({ readConsent: () => false })), { status: 'SKIPPED', reason: 'CONSENT_NOT_GRANTED' });
  // store-side consent refusal is independent: the decision fails without a model call
  assert.deepEqual(await U.evaluate(input({ readConsent: () => true })), { status: 'FAILED', reason: 'STORE_READ_FAILED' });
  assert.equal(env.bodies.length, 0);
});

async function seed(nConcepts, nRecordsPerConcept, labelSize) {
  const ids = [];
  for (let i = 0; i < nConcepts; i++) {
    const labels = [0, 1, 2, 3].map((k) => ('L' + i + '-' + k + ' ').padEnd(labelSize || 6, 'x'));
    ids.push((await Store.createConcept({ labels })).ids.conceptIds[0]);
  }
  for (let i = 0; i < nConcepts; i++) {
    for (let k = 0; k < nRecordsPerConcept; k++) {
      const r = await Store.createRecord({ draft: { factors: [{ conceptId: ids[i], role: 'subject', valueDescription: 'v'.repeat(150) }], relationDescription: 'relation ' + i + '-' + k + ' ' + 'r'.repeat(300), evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD' } });
      assert.equal(r.status, 'COMMITTED');
    }
  }
  return ids;
}
function presented(body) {
  const p = body.messages[0].content;
  const grab = (tag) => JSON.parse(p.slice(p.lastIndexOf('<' + tag + '>') + tag.length + 2, p.lastIndexOf('</' + tag + '>')));
  return { concepts: grab('concepts'), records: grab('records'), blockChars: JSON.stringify(grab('concepts')).length + JSON.stringify(grab('records')).length };
}

test('AC-16: presentation is bounded — ≤ 30 recent concepts (≤ 40 with record concepts), ≤ 12 records, ≤ 3 labels, relation ≤ 160 chars, block ≤ 6,000 chars — even when the store holds far more', async () => {
  setup();
  await seed(45, 2, 6);
  Gate.__setEnabledForTests__(true);
  await U.evaluate(input());
  const pr = presented(env.bodies[0]);
  assert.ok(pr.blockChars <= 6000, 'block ' + pr.blockChars);
  assert.ok(pr.concepts.length < 30 || pr.records.length < 12, 'the 6,000-char cap actually trimmed the presentation');
  assert.ok(pr.concepts.length <= 40);
  assert.ok(pr.records.length <= 12);
  pr.concepts.forEach((c) => assert.ok(c.labels.length <= 3));
  pr.records.forEach((r) => {
    assert.ok(r.relationDescription.length <= 160);
    assert.deepEqual(Object.keys(r).sort(), ['factors', 'origin', 'recordId', 'relationDescription', 'status']);
    r.factors.forEach((f) => assert.ok(pr.concepts.some((c) => c.conceptId === f.conceptId), 'every presented record has its concepts presented'));
  });
  // the store reads issued are the bounded ones only
  const queries = env.hooks.calls.filter((c) => c.startsWith('query'));
  assert.deepEqual(queries, ['queryRecentConcepts', 'queryRecordsByConcepts']);
});

test('AC-16: without size pressure, up to 30 concepts and 12 records are presented, most recent first, and only candidate/active records', async () => {
  setup();
  const ids = [];
  for (let i = 0; i < 35; i++) ids.push((await Store.createConcept({ labels: ['c' + i] })).ids.conceptIds[0]);
  for (let i = 34; i >= 20; i--) await Store.createRecord({ draft: { factors: [{ conceptId: ids[i], role: 'subject' }], relationDescription: 'r' + i, evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD' } });
  const all = env.port;
  const anyRecord = (await Store.queryRecordsByConcepts({ conceptIdsAny: [ids[34]], statuses: ['active'], limit: 1 })).records[0];
  await Store.retractRecord({ recordId: anyRecord.recordId });
  Gate.__setEnabledForTests__(true);
  await U.evaluate(input());
  const pr = presented(env.bodies[0]);
  assert.equal(pr.concepts.length, 30);
  assert.equal(pr.concepts[0].labels[0], 'c34');
  assert.ok(pr.records.length <= 12 && pr.records.length >= 1);
  assert.ok(pr.records.every((r) => r.status === 'active' || r.status === 'candidate'));
  assert.ok(pr.records.every((r) => r.recordId !== anyRecord.recordId));
  assert.ok(all);
});

test('§13 item 3: concepts referenced by presented records but not among the recent ones are added (combined cap 40) so the gate can ground them', async () => {
  setup();
  const old = (await Store.createConcept({ labels: ['old label'] })).ids.conceptIds[0];
  const ids = [];
  for (let i = 0; i < 30; i++) ids.push((await Store.createConcept({ labels: ['n' + i] })).ids.conceptIds[0]);
  await Store.createRecord({ draft: { factors: [{ conceptId: ids[29], role: 'subject' }, { conceptId: old, role: 'condition' }], relationDescription: 'r', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD' } });
  Gate.__setEnabledForTests__(true);
  await U.evaluate(input());
  const pr = presented(env.bodies[0]);
  assert.equal(pr.concepts.length, 31);
  assert.ok(pr.concepts.some((c) => c.conceptId === old));
  assert.equal(pr.records.length, 1);
});

test('the coordinator never throws and never calls the executor or writes', async () => {
  setup();
  Gate.__setEnabledForTests__(true);
  for (const junk of [undefined, null, 7, { turn: 5 }]) {
    const d = await U.evaluate(junk);
    assert.equal(typeof d.status, 'string');
  }
  assert.equal(env.hooks.writeCalls().length, 0);
});
