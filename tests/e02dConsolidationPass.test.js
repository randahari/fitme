// WP0 Phase E.0.2d — Consolidation pass, end to end
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md v1.1 §11-§27; AC-D1 … AC-D9, AC-D30 … AC-D39,
// AC-D46 … AC-D52, AC-D54, AC-D56 … AC-D59, AC-D62 … AC-D65). The real User Knowledge store over the
// in-memory reference port, the Observation Port test double, and a local stub transport that answers
// both model stages (Generator and Verifier). No model is ever called.
// Run with: node --test tests/e02dConsolidationPass.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const Store = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeStore.js'));
const CC = require(path.join(ROOT, 'js/coachDecisionSystem/consolidationContract.js'));
const Consolidation = require(path.join(ROOT, 'js/coachDecisionSystem/consolidation.js'));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');
const { conceptDoc, recordDoc } = require('./fixtures/userKnowledgePortConformance.js');
const { createObservationPort, descriptors } = require('./fixtures/consolidationObservationPortTestDouble.js');

const DAY = 86400000;
const WINDOW = { fromEpochMs: 0, toEpochMs: 14 * DAY };
const STORE_FNS = ['createRecord', 'appendEvidence', 'supersede', 'queryRecordsBySupportingRefs', 'queryRecentConcepts', 'queryRecordsByConcepts', 'getConcepts'];
const FORBIDDEN = ['promoteRecord', 'retractRecord', 'archiveRecord', 'setConfidence', 'addConfound', 'recordConfoundCheck', 'raiseSafetyFlag', 'correctInferredKnowledge',
  'mergeConcept', 'unmergeConcept', 'createConcept', 'addConceptLabel', 'removeConceptLabel', 'forgetRecord', 'forgetConcept', 'eraseAllForUser', 'applyEvidenceAvailability'];

function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }

// ── harness ──
function env(opts) {
  const o = opts || {};
  const uk = createInMemoryPort();
  const op = createObservationPort();
  const D = descriptors();
  let clock = 5000000;
  const state = { consent: true, consentState: {} };
  const configureStore = (writer, producer) => {
    const r = Store.configure({ port: uk.port, now: () => ++clock, writerAuthority: writer, isLearningConsentGranted: () => state.consent === true, userId: 'u1', producer, producerVersion: '1.0.0' });
    assert.equal(r.status, 'CONFIGURED');
    return Store;
  };
  const client = () => configureStore('CLIENT', 'test.seed');
  const server = () => configureStore('SERVER', CC.PRODUCER.producer);
  const storeCalls = [];
  const overrides = {};
  const spy = {};
  STORE_FNS.forEach((fn) => { spy[fn] = async (req) => { storeCalls.push({ fn, req: clone(req) }); return overrides[fn] ? overrides[fn](req) : Store[fn](req); }; });
  // One stub transport for both stages (§08). A Verifier body is recognized by its <items> data block.
  // By default the Verifier passes every applicable dimension; tests override `transport.verdict`
  // (per item) or `transport.verifierRaw` (the whole raw response) to exercise vetoes and failures.
  const transport = { bodies: [], generator: [], verifier: [], respond: [], verdict: null, verifierRaw: null };
  const modelTransport = async (body) => {
    transport.bodies.push(body);
    const content = body.messages[0].content;
    if (content.lastIndexOf('<items>') !== -1 && content.indexOf('<concepts>') === -1) {
      transport.verifier.push(body);
      const vv = verifierView(body);
      if (transport.verifierRaw) return transport.verifierRaw(vv);
      return { content: [{ text: JSON.stringify({ verdicts: vv.items.map((it) => Object.assign({ item: it.item }, passing(it.operation), transport.verdict ? transport.verdict(it, vv) : {})) }) }] };
    }
    transport.generator.push(body);
    const proposals = typeof transport.respond === 'function' ? transport.respond(view(body)) : transport.respond;
    return { content: [{ text: JSON.stringify({ proposals }) }] };
  };
  const cfg = Object.assign({ store: spy, port: op.port, modelTransport, now: () => clock, isLearningConsentGranted: () => state.consent === true,
    getConsentState: () => state.consentState, userId: 'u1', observationSources: [D.conversation, D.dayLog], referenceSource: D.typedMemory }, o.cfg || {});
  return {
    uk, op, D, state, client, server, storeCalls, overrides, transport, cfg,
    configure(over) { server(); return Consolidation.configure(Object.assign({}, cfg, over || {})); },
    async run(request) {
      server();
      storeCalls.length = 0;
      return Consolidation.runPass(arguments.length ? request : { passId: 'pass1', window: WINDOW });
    },
    records() { return uk.hooks.peek('u1').records; },
    record(id) { return uk.hooks.peek('u1').records.find((r) => r.recordId === id); }
  };
}
// The instruction itself names the tags, so the data block is the LAST occurrence of each tag.
function grabber(content) {
  return (tag) => {
    const start = content.lastIndexOf('<' + tag + '>') + tag.length + 2;
    return JSON.parse(content.slice(start, content.indexOf('</' + tag + '>', start)));
  };
}
// The concept label and record wording of every id this test seeded, so that a Generator stub can
// cite the pass-local keys the model actually sees (§14.4) — never a durable id.
const LABEL_OF = new Map();
const REL_OF = new Map();
function view(body) {
  const content = body.messages[0].content;
  const grab = grabber(content);
  const observations = grab('observations');
  const concepts = grab('concepts');
  const records = grab('records');
  return {
    content, observations, concepts, records, userStated: grab('user_stated'),
    key(needle) {
      const o = observations.find((x) => x.localDate === needle || x.segments.some((s) => typeof s.text === 'string' && s.text.indexOf(needle) !== -1));
      assert.ok(o, 'observation for ' + needle + ' presented');
      return o.obsKey;
    },
    k(conceptId) {
      const c = concepts.find((x) => x.labels.indexOf(LABEL_OF.get(conceptId)) !== -1);
      assert.ok(c, 'concept ' + LABEL_OF.get(conceptId) + ' presented');
      return c.conceptKey;
    },
    r(recordId) {
      const r = records.find((x) => x.relationDescription === REL_OF.get(recordId));
      return r ? r.recordKey : 'r99'; // a record that is not presented has no key; the model can only guess one
    }
  };
}
function verifierView(body) {
  const grab = grabber(body.messages[0].content);
  return { observations: grab('observations'), userStated: grab('user_stated'), targets: grab('targets'), items: grab('items'), content: body.messages[0].content };
}
function passing(operation) {
  return operation === 'APPEND_EVIDENCE'
    ? { restatement: 'NOT_RESTATED', unsupported: 'NOT_APPLICABLE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'NOT_APPLICABLE', direction: 'CONSISTENT' }
    : { restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'FAITHFUL', direction: 'NOT_APPLICABLE' };
}
async function concept(e, label) {
  const r = await e.client().createConcept({ labels: [label] });
  assert.equal(r.status, 'COMMITTED');
  LABEL_OF.set(r.ids.conceptIds[0], label);
  return r.ids.conceptIds[0];
}
async function userStated(e, factors, turns, extra) {
  const r = await e.client().createRecord({ draft: Object.assign({
    factors: factors.map((f) => ({ conceptId: f[0], role: f[1], valueDescription: f[2] || null })),
    relationDescription: (extra && extra.rel) || 'A stated fact.', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1,
    source: 'user_stated', safetyFlag: (extra && extra.safetyFlag) || 'STANDARD',
    evidence: { supporting: turns.map((t) => ({ kind: 'CONVERSATION_TURN', ref: t })), contradicting: ((extra && extra.contradicting) || []).map((t) => ({ kind: 'CONVERSATION_TURN', ref: t })) }
  }, {}) });
  assert.equal(r.status, 'COMMITTED', JSON.stringify(r));
  return r.ids.recordIds[0];
}
async function candidate(e, factors, turns, rel) {
  const r = await e.server().createRecord({ draft: {
    factors: factors.map((f) => ({ conceptId: f[0], role: f[1], valueDescription: f[2] || null })), relationDescription: rel || 'A candidate association.',
    evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', confidence: 0, source: 'inferred_event', safetyFlag: 'STANDARD',
    evidence: { supporting: turns.map((t) => ({ kind: 'CONVERSATION_TURN', ref: t })) }
  } });
  assert.equal(r.status, 'COMMITTED', JSON.stringify(r));
  REL_OF.set(r.ids.recordIds[0], rel || 'A candidate association.');
  return r.ids.recordIds[0];
}
// v1.1 per-operation proposal shapes (§15.2).
function F(o) { return Object.assign({ conceptKey: null, newConceptLabel: null, role: 'subject', valueText: null }, o); }
function P(o) {
  return Object.assign({ operation: 'CREATE', factors: [], relationText: 'Weaker sessions tend to accompany shorter rest in these notes.',
    evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', grounding: null, supporting: [], contradicting: [], reference: null, restatesUserStatement: false, safetyAdjacent: false }, o);
}
function SUP(target, o) { return Object.assign(P(o), { operation: 'SUPERSEDE', target }); }
function APP(o) { return Object.assign({ operation: 'APPEND_EVIDENCE', target: 'r1', list: 'supporting', observations: [], restatesUserStatement: false, safetyAdjacent: false }, o); }
async function seedTurns(e) {
  e.op.seed.turn('t1', 'Only four hours of rest and my session felt like wading through mud.', 1 * DAY);
  e.op.seed.turn('t2', 'Short night again; the workout was a slog.', 2 * DAY);
  e.op.seed.turn('t3', 'Got a full night in and the session flew by.', 3 * DAY);
}

// ═══ AC-D1 — configuration ═══
test('AC-D1: invalid configuration → NOT_CONFIGURED, and runPass makes zero calls', async () => {
  const e = env();
  const bad = [{ store: null }, { store: { createRecord() {} } }, { port: {} }, { modelTransport: null }, { now: 5 }, { isLearningConsentGranted: true }, { getConsentState: null },
    { userId: 'has space' }, { observationSources: 'x' }, { referenceSource: 'x' }];
  for (const over of bad) {
    assert.equal(e.configure(over).status, 'NOT_CONFIGURED', JSON.stringify(Object.keys(over)));
    e.op.calls.length = 0;
    const r = await e.run();
    assert.equal(r.status, 'NOT_CONFIGURED');
    assert.equal(e.op.calls.length + e.storeCalls.length + e.transport.bodies.length, 0);
  }
  assert.equal(e.configure().status, 'CONFIGURED');
});
test('§13 step 1: invalid requests → INVALID_REQUEST before any call', async () => {
  const e = env();
  e.configure();
  for (const req of [null, {}, { passId: 'p', window: WINDOW, extra: 1 }, { passId: 'has space', window: WINDOW }, { passId: 'p', window: { fromEpochMs: 10, toEpochMs: 5 } },
    { passId: 'p', window: { fromEpochMs: 0, toEpochMs: 15 * DAY } }, { passId: 'p', window: { fromEpochMs: 0.5, toEpochMs: 5 } }]) {
    e.op.calls.length = 0;
    assert.equal((await e.run(req)).status, 'INVALID_REQUEST');
    assert.equal(e.op.calls.length + e.transport.bodies.length, 0);
  }
});

// ═══ AC-D2 — learning consent ═══
test('AC-D2: consent not exactly true → CONSENT_NOT_GRANTED with zero port, store and model calls', async () => {
  for (const c of [false, 'true', 1, undefined]) {
    const e = env({ cfg: { isLearningConsentGranted: () => c } });
    await seedTurns(e);
    e.configure();
    e.op.calls.length = 0;
    const r = await e.run();
    assert.equal(r.status, 'CONSENT_NOT_GRANTED', String(c));
    assert.equal(e.op.calls.length + e.storeCalls.length + e.transport.bodies.length, 0);
  }
  const e = env({ cfg: { isLearningConsentGranted: () => { throw new Error('x'); } } });
  e.configure();
  assert.equal((await e.run()).status, 'CONSENT_NOT_GRANTED');
});

// ═══ AC-D3 / AC-D5 / AC-D35 — A3 eligibility; nothing is ever requested from the user ═══
test('AC-D3: protected, invalid, SAFETY_ADJACENT and ungranted scoped sources are excluded; none eligible → NO_ELIGIBLE_SOURCE', async () => {
  const D = descriptors();
  const cases = [
    Object.assign({}, D.conversation, { protectedSource: true }),
    Object.assign({}, D.conversation, { description: '' }),
    Object.assign({}, D.conversation, { sensitivityTier: 'SAFETY_ADJACENT' }),
    Object.assign({}, D.conversation, { consentScope: 'LEARNED_MEMORY_PERSONALIZATION' }),
    Object.assign({}, D.conversation, { consentScope: 'UNREGISTERED_SCOPE' }),
    Object.assign({}, D.conversation, { evidenceRefKind: 'HABIT_RECORD' })
  ];
  for (const d of cases) {
    const e = env({ cfg: { observationSources: [d] } });
    await seedTurns(e);
    e.configure();
    e.op.calls.length = 0;
    const r = await e.run();
    assert.equal(r.status, 'NO_ELIGIBLE_SOURCE', JSON.stringify(d));
    assert.equal(e.op.calls.length + e.transport.bodies.length, 0);
  }
  // a scoped source with a valid grant is eligible; an expired grant is not
  const scoped = Object.assign({}, D.conversation, { consentScope: 'LEARNED_MEMORY_PERSONALIZATION' });
  const e1 = env({ cfg: { observationSources: [scoped] } });
  await seedTurns(e1);
  e1.state.consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true } };
  e1.configure();
  assert.equal((await e1.run()).status, 'COMPLETED');
  e1.state.consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, expiresAt: 1 } };
  assert.equal((await e1.run()).status, 'NO_ELIGIBLE_SOURCE');
  e1.state.consentState = 'malformed';
  assert.equal((await e1.run()).status, 'NO_ELIGIBLE_SOURCE');
});
test('AC-D5 / AC-D35: an unavailable source is simply skipped; Habit/Pattern sources are never requested; no prompt is ever made', async () => {
  const D = descriptors();
  const habit = Object.assign({}, D.conversation, { sourceId: 'habits', evidenceRefKind: 'HABIT_RECORD' });
  const e = env({ cfg: { observationSources: [D.conversation, Object.assign({}, D.dayLog, { protectedSource: true }), habit] } });
  await seedTurns(e);
  e.configure();
  e.op.calls.length = 0;
  const r = await e.run();
  assert.equal(r.status, 'COMPLETED');
  assert.deepEqual(r.sourcesRead, ['conversationTurns']);
  const reads = e.op.calls.filter((c) => c.op === 'readObservations');
  assert.equal(reads.length, 1);
  assert.deepEqual(reads[0].args.sourceIds, ['conversationTurns']);
  assert.deepEqual(e.op.calls.map((c) => c.op).filter((x) => ['readObservations', 'readOwnershipClaims', 'readUserStatedReferences'].indexOf(x) === -1), []);
});

// ═══ AC-D6 — observation read validation ═══
test('AC-D6: invalid, oversized, duplicate, unrequested or kind-mismatched observations → OBSERVATION_READ_INVALID, no model call', async () => {
  const good = { ref: { kind: 'CONVERSATION_TURN', ref: 't1' }, sourceId: 'conversationTurns', observedAt: 10, localDate: null, localTime: null, utcOffsetMinutes: null,
    segments: [{ segmentId: 's', authorship: 'USER_AUTHORED', text: 'hello there', data: null }] };
  const variants = [
    () => [Object.assign({}, good, { extra: 1 })],
    () => Array.from({ length: 41 }, (_, i) => Object.assign({}, good, { ref: { kind: 'CONVERSATION_TURN', ref: 't' + i } })),
    () => [good, clone(good)],
    () => [Object.assign({}, good, { sourceId: 'somewhereElse' })],
    () => [Object.assign({}, good, { ref: { kind: 'DAY_LOG', ref: '2026-01-01' } })],
    () => { throw new Error('adapter down'); },
    () => 'nope'
  ];
  for (const v of variants) {
    const e = env();
    e.op.override('readObservations', async () => v());
    e.configure();
    const r = await e.run();
    assert.equal(r.status, 'OBSERVATION_READ_INVALID');
    assert.equal(e.transport.bodies.length, 0);
  }
});

// ═══ AC-D7 / AC-D30 / AC-D46 — evidence, field mapping, bootstrap confidence ═══
test('AC-D7 / AC-D30 / AC-D46: a CREATE persists references only, the fixed field mapping, and an unassessed bootstrap confidence', async () => {
  const e = env();
  await seedTurns(e);
  e.op.seed.day('2026-01-02', 2 * DAY + 100, [{ name: 'oats', kcal: 300, time: '7:30' }], { burned: 0 });
  const a = await concept(e, 'rest');
  const b = await concept(e, 'session quality');
  e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'RECURRENCE',
    supporting: [v.key('Only four hours'), v.key('Short night'), v.key('2026-01-02')], contradicting: [v.key('full night')] })];
  e.configure();
  const r = await e.run();
  assert.equal(r.status, 'COMPLETED', JSON.stringify(r));
  assert.equal(r.proposals[0].outcome, 'ADMITTED_EXECUTED');
  const rec = e.record(r.proposals[0].recordIds[0]);
  assert.equal(rec.status, 'candidate');
  assert.equal(rec.source, 'inferred_pattern');
  assert.equal(rec.safetyFlag, 'STANDARD');
  assert.equal(rec.expiresAt, null);
  assert.equal(rec.provenance.producer, 'e02d.consolidation');
  assert.equal(rec.provenance.originTurnId, null);
  assert.deepEqual(rec.evidence.confoundsConsidered, []);
  assert.equal(rec.confidence, 0);
  assert.equal(CC.isConfidenceAssessed(rec), false);
  assert.deepEqual(rec.evidence.supporting.map((x) => [x.kind, x.ref, x.observedAt]), [['CONVERSATION_TURN', 't1', DAY], ['CONVERSATION_TURN', 't2', 2 * DAY], ['DAY_LOG', '2026-01-02', null]]);
  assert.deepEqual(rec.evidence.contradicting.map((x) => x.ref), ['t3']);
  const persisted = JSON.stringify(e.uk.hooks.peek('u1'));
  ['wading through mud', 'oats', 'slog', 'flew by'].forEach((t) => assert.equal(persisted.indexOf(t), -1, 'observation content persisted: ' + t));
  // assessment state: same-value setConfidence leaves it unassessed; a real change marks it
  assert.equal((await e.server().setConfidence({ recordId: rec.recordId, confidence: 0 })).status, 'NO_CHANGE');
  assert.equal(CC.isConfidenceAssessed(e.record(rec.recordId)), false);
  assert.equal((await e.server().setConfidence({ recordId: rec.recordId, confidence: 0.4 })).status, 'COMMITTED');
  assert.equal(CC.isConfidenceAssessed(e.record(rec.recordId)), true);
});
test('E3 / §14.1: FITME-authored segments are never presented; day-log time stays local; absolute time is rendered as UTC', async () => {
  const e = env();
  e.op.seed.turn('t1', 'Felt sluggish after the late snack.', DAY, { fitmeSegment: true });
  e.op.seed.turn('tF', 'x', DAY + 5, { fitmeSegment: true });
  e.op.seed.day('2026-01-02', 2 * DAY, [{ name: 'soup', kcal: 200, time: '21:10' }]);
  e.op.override('readObservations', async () => {
    return [
      { ref: { kind: 'CONVERSATION_TURN', ref: 'tF' }, sourceId: 'conversationTurns', observedAt: DAY, localDate: null, localTime: null, utcOffsetMinutes: null, segments: [{ segmentId: 'f', authorship: 'FITME_AUTHORED', text: 'FITME said this', data: null }] },
      { ref: { kind: 'CONVERSATION_TURN', ref: 't1' }, sourceId: 'conversationTurns', observedAt: DAY, localDate: null, localTime: null, utcOffsetMinutes: null, segments: [{ segmentId: 'u', authorship: 'USER_AUTHORED', text: 'Felt sluggish after the late snack.', data: null }, { segmentId: 'f', authorship: 'FITME_AUTHORED', text: 'FITME reply text', data: null }] },
      { ref: { kind: 'DAY_LOG', ref: '2026-01-02' }, sourceId: 'dayLogs', observedAt: null, localDate: '2026-01-02', localTime: null, utcOffsetMinutes: null, segments: [{ segmentId: 'm', authorship: 'USER_RECORDED', text: null, data: [{ label: 'time', value: '21:10', unit: null }] }] }
    ];
  });
  e.configure();
  await e.run();
  const v = view(e.transport.bodies[0]);
  assert.equal(v.content.indexOf('FITME said this'), -1);
  assert.equal(v.content.indexOf('FITME reply text'), -1);
  assert.equal(v.observations.length, 2);
  const turn = v.observations.find((o) => o.segments[0].text);
  assert.equal(turn.observedAt, '1970-01-02T00:00:00.000Z');
  const day = v.observations.find((o) => o.localDate === '2026-01-02');
  assert.equal(day.observedAt, null);
  assert.equal(day.localTime, null);
});

// ═══ AC-D8 / AC-D49 — Safety and Typed Memory ownership ═══
test('AC-D8 / AC-D49: Safety-claimed observations (any status) and SAFETY_ADJACENT-owned observations are never presented', async () => {
  const e = env();
  await seedTurns(e);
  e.op.seed.typedMemory('mS', { type: 'safety_disclosure', source: 'user_stated', status: 'rejected', payload: { restrictionText: 'x', sourceTurnId: 't1' } });
  const c = await concept(e, 'something sensitive');
  await userStated(e, [[c, 'subject']], ['t2'], { safetyFlag: 'SAFETY_ADJACENT', rel: 'A sensitive statement.' });
  e.configure();
  e.op.calls.length = 0;
  const r = await e.run();
  assert.equal(r.status, 'COMPLETED');
  const v = view(e.transport.bodies[0]);
  assert.equal(v.content.indexOf('Only four hours'), -1);
  assert.equal(v.content.indexOf('Short night again'), -1);
  assert.equal(v.content.indexOf('A sensitive statement'), -1);
  assert.notEqual(v.content.indexOf('full night'), -1);
  const claimCalls = e.op.calls.filter((x) => x.op === 'readOwnershipClaims');
  assert.equal(claimCalls.length, 1);
  assert.deepEqual(claimCalls[0].args.refs.map((x) => x.ref).sort(), ['t1', 't2', 't3']);
  assert.equal(e.op.stats.collectionScans, 0);
});
test('AC-D8 / AC-D48: a failed or invalid Typed Memory claim read ends the pass OWNERSHIP_READ_FAILED with no model call', async () => {
  for (const v of [() => { throw new Error('down'); }, () => 'x', () => [{ ref: { kind: 'CONVERSATION_TURN', ref: 'tZ' }, claimant: 'CPI_PREFERENCE', recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: 'm' } }],
    () => [{ ref: { kind: 'CONVERSATION_TURN', ref: 't1' }, claimant: 'NOBODY', recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: 'm' } }]]) {
    const e = env();
    await seedTurns(e);
    e.op.override('readOwnershipClaims', async () => v());
    e.configure();
    assert.equal((await e.run()).status, 'OWNERSHIP_READ_FAILED');
    assert.equal(e.transport.bodies.length, 0);
  }
});

// ═══ AC-D36 — user-stated references ═══
test('AC-D36: only active, user_stated, STANDARD references are presented; Safety types never; ineligible reference source → none, pass continues', async () => {
  const e = env();
  await seedTurns(e);
  const a = await concept(e, 'evening routine');
  const b = await concept(e, 'focus');
  await userStated(e, [[a, 'subject']], ['t9'], { rel: 'Active stated one.' });
  const old = await userStated(e, [[b, 'subject']], ['t8'], { rel: 'Withdrawn stated one.' });
  assert.equal((await e.client().retractRecord({ recordId: old })).status, 'COMMITTED');
  await userStated(e, [[b, 'subject']], ['t7'], { rel: 'Sensitive stated one.', safetyFlag: 'SAFETY_ADJACENT' });
  e.op.seed.typedMemory('mF', { type: 'fact', source: 'user_stated', status: 'active', payload: { text: 'I work night shifts on Fridays', sourceTurnId: 't6' } });
  e.op.seed.typedMemory('mS', { type: 'risk_characteristic_fact', source: 'user_stated', status: 'active', payload: { literalStatementText: 'risky thing', sourceTurnId: 't5' } });
  e.configure();
  await e.run();
  const v = view(e.transport.bodies[0]);
  const texts = JSON.stringify(v.userStated);
  assert.notEqual(texts.indexOf('Active stated one.'), -1);
  assert.notEqual(texts.indexOf('I work night shifts on Fridays'), -1);
  ['Withdrawn stated one.', 'Sensitive stated one.', 'risky thing'].forEach((t) => assert.equal(texts.indexOf(t), -1, t));
  // a Safety claimant returned as a reference is rejected outright
  e.op.override('readUserStatedReferences', async () => [{ recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: 'mS' }, claimant: 'SAFETY_INTAKE', claimedObservationRefs: [], segments: [{ segmentId: 's', authorship: 'USER_AUTHORED', text: 'x', data: null }] }]);
  assert.equal((await e.run()).status, 'OBSERVATION_READ_INVALID');
  // ineligible reference source: never requested, no Typed Memory references, pass continues
  const e2 = env({ cfg: { referenceSource: Object.assign({}, descriptors().typedMemory, { protectedSource: true }) } });
  await seedTurns(e2);
  e2.op.seed.typedMemory('mF', { type: 'fact', source: 'user_stated', status: 'active', payload: { text: 'I work night shifts on Fridays', sourceTurnId: 't6' } });
  e2.configure();
  e2.op.calls.length = 0;
  assert.equal((await e2.run()).status, 'COMPLETED');
  assert.equal(e2.op.calls.some((x) => x.op === 'readUserStatedReferences'), false);
  assert.deepEqual(view(e2.transport.bodies[0]).userStated, []);
});

// ═══ AC-D37 — PD-D2 example end to end ═══
test('AC-D37: the user-stated sleep fact alone is rejected; with independent observations a by-reference higher-order candidate is created', async () => {
  const e = env();
  e.op.seed.turn('t0', 'I usually sleep around five hours.', 1 * DAY);
  e.op.seed.turn('t1', 'Rough night and the lifts felt heavy.', 2 * DAY);
  e.op.seed.turn('t2', 'Woke early again; sluggish all session.', 3 * DAY);
  const s = await concept(e, 'nightly rest');
  const q = await concept(e, 'session performance');
  const fact = await userStated(e, [[s, 'subject', 'around five hours']], ['t0'], { rel: 'I usually sleep around five hours' });
  e.transport.respond = (v) => {
    const uKey = v.userStated[0].uKey;
    return [
      P({ factors: [F({ conceptKey: v.k(s), role: 'subject', valueText: 'roughly five hours' })], relationText: 'This person tends to rest for roughly five hours.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('usually sleep')] }),
      P({ factors: [F({ conceptKey: v.k(s), role: 'condition' }), F({ conceptKey: v.k(q), role: 'outcome', valueText: 'poorer' })], reference: { uKey, factorIndex: 0 },
        relationText: 'Poorer session outcomes have followed short-rest periods.', evidenceClass: 'RECURRENCE', supporting: [v.key('Rough night'), v.key('Woke early')] })
    ];
  };
  e.configure();
  const r = await e.run();
  assert.equal(r.proposals[0].outcome, 'REJECTED');
  assert.equal(r.proposals[0].code, 'NO_INDEPENDENT_SUPPORT');
  assert.equal(r.proposals[1].outcome, 'ADMITTED_EXECUTED', JSON.stringify(r.proposals[1]));
  const rec = e.record(r.proposals[1].recordIds[0]);
  assert.deepEqual(rec.evidence.supporting.map((x) => x.kind + ':' + x.ref), ['CONVERSATION_TURN:t1', 'CONVERSATION_TURN:t2', 'USER_KNOWLEDGE_RECORD:' + fact]);
  assert.equal(e.record(fact).version, 1); // the user-stated record is untouched
});

// ═══ AC-D38 — U4 with owners outside the presented set ═══
test('AC-D38: owners in every stored status, outside the presented set, and Typed Memory owners in any status remove independent support', async () => {
  const setups = {
    active_outside_presentation: async (e, x) => { await userStated(e, [[x, 'subject']], ['t1']); for (let i = 0; i < 11; i++) await concept(e, 'later concept ' + i); },
    superseded: async (e, x) => { const id = await userStated(e, [[x, 'subject']], ['t1']); assert.equal((await e.client().supersede({ predecessorIds: [id], successor: { factors: [{ conceptId: x, role: 'subject', valueDescription: null }], relationDescription: 'Corrected.', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't8' }] } } })).status, 'COMMITTED'); },
    rejected: async (e, x) => { const id = await userStated(e, [[x, 'subject']], ['t1']); assert.equal((await e.client().retractRecord({ recordId: id })).status, 'COMMITTED'); },
    archived: async (e, x) => { const id = await userStated(e, [[x, 'subject']], ['t1']); assert.equal((await e.client().archiveRecord({ recordId: id })).status, 'COMMITTED'); },
    typed_memory_rejected: async (e) => { e.op.seed.typedMemory('mP', { type: 'preference', source: 'user_stated', status: 'rejected', payload: { key: 'k', sourceTurnId: 't1' } }); }
  };
  for (const [name, setup] of Object.entries(setups)) {
    const e = env();
    await seedTurns(e);
    const x = await concept(e, 'owner concept');
    const a = await concept(e, 'rest');
    const b = await concept(e, 'session quality');
    await setup(e, x);
    e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four hours')] })];
    e.configure();
    const r = await e.run();
    assert.equal(r.proposals[0].code, 'NO_INDEPENDENT_SUPPORT', name);
  }
  // not owned: contradicting-only, FITME-inferred, forgotten
  const notOwned = {
    contradicting_only: async (e, x) => { await userStated(e, [[x, 'subject']], ['t9'], { contradicting: ['t1'] }); },
    fitme_inferred: async (e, x) => { await candidate(e, [[x, 'subject']], ['t1']); },
    forgotten: async (e, x) => { const id = await userStated(e, [[x, 'subject']], ['t1']); assert.equal((await e.client().forgetRecord({ recordId: id })).status, 'DELETED'); }
  };
  for (const [name, setup] of Object.entries(notOwned)) {
    const e = env();
    await seedTurns(e);
    const x = await concept(e, 'owner concept');
    const a = await concept(e, 'rest');
    const b = await concept(e, 'session quality');
    await setup(e, x);
    e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four hours')] })];
    e.configure();
    const r = await e.run();
    assert.equal(r.proposals[0].outcome, 'ADMITTED_EXECUTED', name + ' ' + JSON.stringify(r.proposals[0]));
  }
});

// ═══ AC-D39 / AC-D52 — U5 with merge-resolved owners; concept resolution ═══
async function mirrorScenario(mergeSetup, ownerStatusChange) {
  const e = env();
  await seedTurns(e);
  const ids = {};
  for (const l of ['X', 'Y', 'Z', 'B']) ids[l] = await concept(e, 'concept ' + l);
  const owner = await userStated(e, [[ids.X, 'subject'], [ids.B, 'outcome']], ['t1'], { rel: 'Owner statement.' });
  if (ownerStatusChange) await ownerStatusChange(e, owner);
  await mergeSetup(e, ids);
  e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(ids.Y), role: 'subject' }), F({ conceptKey: v.k(ids.B), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Short night')] })];
  e.configure();
  const r = await e.run();
  return { e, r, ids };
}
const merge = (from, into) => async (e, ids) => assert.equal((await e.client().mergeConcept({ fromConceptId: ids[from], intoConceptId: ids[into] })).status, 'COMMITTED');
test('AC-D39: U5 rejects a mirror of a non-presented owner after one-level, multi-level and reverse merges', async () => {
  const one = await mirrorScenario(merge('X', 'Y'), async (e, id) => assert.equal((await e.client().retractRecord({ recordId: id })).status, 'COMMITTED'));
  assert.equal(one.r.proposals[0].code, 'MIRRORS_USER_STATED');
  const multi = await mirrorScenario(async (e, ids) => { await merge('X', 'Z')(e, ids); await merge('Z', 'Y')(e, ids); }, async (e, id) => assert.equal((await e.client().archiveRecord({ recordId: id })).status, 'COMMITTED'));
  assert.equal(multi.r.proposals[0].code, 'MIRRORS_USER_STATED');
  const reverse = await mirrorScenario(merge('Y', 'X'));
  assert.equal(reverse.r.proposals[0].code, 'MIRRORS_USER_STATED');
});
test('AC-D39: after an unmerge the current state applies — no longer the same structure, so not rejected', async () => {
  const r = await mirrorScenario(async (e, ids) => {
    await merge('X', 'Y')(e, ids);
    assert.equal((await e.client().unmergeConcept({ conceptId: ids.X })).status, 'COMMITTED');
  }, async (e, id) => assert.equal((await e.client().retractRecord({ recordId: id })).status, 'COMMITTED'));
  assert.equal(r.r.proposals[0].outcome, 'ADMITTED_EXECUTED', JSON.stringify(r.r.proposals[0]));
});
test('AC-D39: owners in each stored status are compared identically; structurally different proposals are never rejected', async () => {
  const statuses = {
    active: null,
    superseded: async (e, id) => {
      const s = await e.client().supersede({ predecessorIds: [id], successor: { factors: [{ conceptId: (e.record(id).factors[0].conceptId), role: 'subject', valueDescription: null }], relationDescription: 'Corrected owner.', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't9' }] } } });
      assert.equal(s.status, 'COMMITTED');
    },
    rejected: async (e, id) => assert.equal((await e.client().retractRecord({ recordId: id })).status, 'COMMITTED'),
    archived: async (e, id) => assert.equal((await e.client().archiveRecord({ recordId: id })).status, 'COMMITTED')
  };
  for (const [name, change] of Object.entries(statuses)) {
    const r = await mirrorScenario(merge('X', 'Y'), change);
    assert.equal(r.r.proposals[0].code, 'MIRRORS_USER_STATED', name);
  }
  // different roles / factor count → not rejected by U5
  const e = env();
  await seedTurns(e);
  const X = await concept(e, 'concept X');
  const B = await concept(e, 'concept B');
  const C2 = await concept(e, 'concept C');
  await userStated(e, [[X, 'subject'], [B, 'outcome']], ['t1']);
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(X), role: 'outcome' }), F({ conceptKey: v.k(B), role: 'subject' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Short night')] }),
    P({ factors: [F({ conceptKey: v.k(X), role: 'subject' }), F({ conceptKey: v.k(B), role: 'outcome' }), F({ conceptKey: v.k(C2), role: 'condition' })], relationText: 'Three-way association across these notes.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] })
  ];
  e.configure();
  const r = await e.run();
  assert.deepEqual(r.proposals.map((x) => x.outcome), ['ADMITTED_EXECUTED', 'ADMITTED_EXECUTED']);
});
test('AC-D52: owner concept resolution reads only missing ids, never twice, in batches ≤ 50, and fails closed on every incomplete resolution', async () => {
  const { e } = await mirrorScenario(async (e2, ids) => { await merge('X', 'Z')(e2, ids); await merge('Z', 'Y')(e2, ids); }, async (e2, id) => assert.equal((await e2.client().retractRecord({ recordId: id })).status, 'COMMITTED'));
  const conceptReads = e.storeCalls.filter((c) => c.fn === 'getConcepts');
  const requested = [].concat(...conceptReads.map((c) => c.req.conceptIds));
  assert.equal(new Set(requested).size, requested.length, 'no concept read twice');
  conceptReads.forEach((c) => assert.ok(c.req.conceptIds.length <= 50));
  // the pass-local map does not survive the pass: a second pass reads again
  const firstCount = requested.length;
  await e.run();
  assert.equal([].concat(...e.storeCalls.filter((c) => c.fn === 'getConcepts').map((c) => c.req.conceptIds)).length, firstCount);
  // fail closed
  const failures = {
    status_failed: () => ({ status: 'FAILED' }),
    consent: () => ({ status: 'CONSENT_NOT_GRANTED', concepts: [] }),
    invalid_doc: () => ({ status: 'REJECTED', code: 'STORED_DOCUMENT_INVALID' }),
    bound: () => ({ status: 'REJECTED', code: 'READ_BOUND_EXCEEDED' }),
    missing: () => ({ status: 'OK', concepts: [] })
  };
  for (const [name, fn] of Object.entries(failures)) {
    const { e: e3 } = await mirrorScenario(merge('X', 'Y'), async (e4, id) => assert.equal((await e4.client().retractRecord({ recordId: id })).status, 'COMMITTED'));
    e3.overrides.getConcepts = async () => fn();
    e3.transport.bodies.length = 0;
    assert.equal((await e3.run()).status, 'OWNERSHIP_READ_FAILED', name);
    assert.equal(e3.transport.bodies.length, 0, name);
  }
  // a merge chain longer than MAX_MERGE_CHAIN_DEPTH (fabricated: the store forbids building one) → MERGE_CHAIN_INVALID → fail closed
  const { e: e5 } = await mirrorScenario(merge('X', 'Y'), async (e6, id) => assert.equal((await e6.client().retractRecord({ recordId: id })).status, 'COMMITTED'));
  const owner = e5.records().find((r) => r.source === 'user_stated');
  const startId = owner.factors[0].conceptId;
  e5.overrides.getConcepts = async (req) => ({ status: 'OK', concepts: req.conceptIds.map((id) => {
    const n = id === startId ? 0 : Number(String(id).replace('chain', ''));
    return { conceptId: id, labels: ['c'], mergedInto: n < 40 ? 'chain' + (n + 1) : null, userId: 'u1' };
  }) });
  e5.transport.bodies.length = 0;
  assert.equal((await e5.run()).status, 'OWNERSHIP_READ_FAILED');
  assert.equal(e5.transport.bodies.length, 0);
});

// ═══ AC-D47 / AC-D48 — covering procedure and fail-closed ownership ═══
test('AC-D47: chunks ≤ 10, user_stated only, the four statuses, limit 50; complete when > 50 owners cite one ref; re-queries only unresolved refs', async () => {
  const e = env();
  for (let i = 1; i <= 12; i++) e.op.seed.turn('t' + i, 'Note number ' + i + ' about the day.', i * 1000);
  const c = await concept(e, 'common thread');
  await userStated(e, [[c, 'subject']], ['t2'], { rel: 'The older owner of t2.' });
  for (let i = 0; i < 55; i++) await userStated(e, [[c, 'subject']], ['t1'], { rel: 'Owner number ' + i + ' of t1.' });
  const a = await concept(e, 'rest');
  const b = await concept(e, 'session quality');
  e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Note number 2 ')] })];
  e.configure();
  const r = await e.run();
  const qs = e.storeCalls.filter((x) => x.fn === 'queryRecordsBySupportingRefs');
  qs.forEach((x) => {
    assert.ok(x.req.refIdsAny.length <= 10);
    assert.deepEqual(x.req.sources, ['user_stated']);
    assert.deepEqual(x.req.statuses, ['active', 'superseded', 'rejected', 'archived']);
    assert.equal(x.req.limit, 50);
  });
  assert.ok(qs.length >= 2 && qs.length <= 12, 'bounded by |Q|');
  // the first chunk's first page is all t1 owners; the re-query asks only for the refs not yet owned
  assert.ok(qs[1].req.refIdsAny.indexOf('CONVERSATION_TURN:t1') === -1);
  assert.equal(r.proposals[0].code, 'NO_INDEPENDENT_SUPPORT'); // t2's owner was found despite the full page
});
test('AC-D48: every non-OK ownership read ends the pass OWNERSHIP_READ_FAILED with no model call; never read as "not owned"', async () => {
  const variants = [() => ({ status: 'CONSENT_NOT_GRANTED', records: [] }), () => ({ status: 'REJECTED', code: 'STORED_DOCUMENT_INVALID' }), () => ({ status: 'FAILED' }),
    () => ({ status: 'NOT_CONFIGURED' }), () => { throw new Error('x'); }];
  for (const v of variants) {
    const e = env();
    await seedTurns(e);
    e.overrides.queryRecordsBySupportingRefs = async () => v();
    e.configure();
    const r = await e.run();
    assert.equal(r.status, 'OWNERSHIP_READ_FAILED');
    assert.equal(e.transport.bodies.length, 0);
  }
  // a stored document that does not match the request is rejected by the store itself → fail closed
  const e = env();
  await seedTurns(e);
  const c = await concept(e, 'thread');
  await userStated(e, [[c, 'subject']], ['t1']);
  e.uk.hooks.tamper((doc) => (doc.recordId ? Object.assign(doc, { status: 'candidate' }) : doc));
  e.configure();
  assert.equal((await e.run()).status, 'OWNERSHIP_READ_FAILED');
  e.uk.hooks.tamper(null);
});

// ═══ AC-D50 — store-size independence ═══
test('AC-D50: with 10,000 stored user_stated records and 40 observations, read counts are bounded and independent of store size', async () => {
  async function counts(nRecords) {
    const e = env();
    for (let i = 1; i <= 40; i++) e.op.seed.turn('t' + i, 'Observation ' + i + ' text.', i * 1000);
    const cdoc = conceptDoc('u1', 'cBulk', ['bulk'], 100, 'evBulk');
    const docs = [cdoc];
    for (let i = 0; i < nRecords; i++) docs.push(recordDoc('u1', 'rB' + i, cdoc, 200 + i, 'evB' + i, 'user_stated', [{ kind: 'CONVERSATION_TURN', ref: 'elsewhere' + i }]));
    assert.equal((await e.uk.port.commit('u1', { creates: docs, updates: [] })).status, 'COMMITTED');
    e.configure();
    const r = await e.run();
    assert.equal(r.status, 'COMPLETED');
    return {
      ownership: e.storeCalls.filter((x) => x.fn === 'queryRecordsBySupportingRefs').length,
      concepts: e.storeCalls.filter((x) => x.fn === 'getConcepts').length,
      total: e.storeCalls.length
    };
  }
  const small = await counts(10);
  const big = await counts(10000);
  assert.deepEqual(big, small);
  assert.equal(big.ownership, 4); // ⌈40 / 10⌉
});

// ═══ AC-D31 / AC-D32 / AC-D33 / AC-D34 — authority, partial failure, idempotency, never throws ═══
test('AC-D31: all writes run under SERVER; forbidden operations are never called; user-stated records are never changed', async () => {
  const e = env();
  await seedTurns(e);
  const a = await concept(e, 'rest');
  const b = await concept(e, 'session quality');
  const us = await userStated(e, [[a, 'subject']], ['t9']);
  const before = clone(e.record(us));
  const cand = await candidate(e, [[a, 'condition'], [b, 'outcome']], ['t1'], 'Existing candidate wording.');
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], relationText: 'Fresh wording about this pairing.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] }),
    // a user-stated record is never presented as a target, so it has no record key (§14.2, U7)
    APP({ target: v.r(us), list: 'supporting', observations: [v.key('Short night')] })
  ];
  e.configure();
  const r = await e.run();
  assert.equal(r.proposals[1].code, 'INVALID_TARGET');
  assert.deepEqual(e.record(us), before);
  e.storeCalls.forEach((x) => assert.equal(FORBIDDEN.indexOf(x.fn), -1, x.fn));
  e.records().filter((x) => x.provenance.producer === 'e02d.consolidation').forEach((x) => {
    assert.equal(x.status, 'candidate');
    assert.notEqual(x.source, 'user_stated');
    assert.equal(x.correctionHistory[0].writer, 'SERVER');
  });
  assert.ok(cand);
});
test('AC-D32: a store failure marks that proposal ADMITTED_FAILED and the pass PARTIAL without aborting later operations', async () => {
  const e = env();
  await seedTurns(e);
  const a = await concept(e, 'rest');
  const b = await concept(e, 'session quality');
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], relationText: 'First association wording here.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
    P({ factors: [F({ conceptKey: v.k(b), role: 'condition' }), F({ conceptKey: v.k(a), role: 'outcome' })], relationText: 'Second association wording here.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] })
  ];
  e.configure();
  let n = 0;
  e.overrides.createRecord = async (req) => (++n === 1 ? { status: 'FAILED' } : Store.createRecord(req));
  const r = await e.run();
  assert.equal(r.status, 'PARTIAL');
  assert.deepEqual(r.proposals.map((x) => x.outcome), ['ADMITTED_FAILED', 'ADMITTED_EXECUTED']);
});
test('AC-D33: re-running a pass is safe — CREATE duplicate rejected, APPEND NO_CHANGE, SUPERSEDE target gone', async () => {
  const e = env();
  await seedTurns(e);
  const a = await concept(e, 'rest');
  const b = await concept(e, 'session quality');
  const c = await concept(e, 'evening');
  const appendTarget = await candidate(e, [[a, 'condition'], [b, 'outcome']], ['t9'], 'Candidate to append to.');
  const supTarget = await candidate(e, [[c, 'condition'], [b, 'outcome']], ['t9'], 'Candidate to supersede.');
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(b), role: 'condition' }), F({ conceptKey: v.k(c), role: 'outcome' })], relationText: 'A new pairing worth noting.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
    APP({ target: v.r(appendTarget), list: 'contradicting', observations: [v.key('full night')] }),
    SUP(v.r(supTarget), { factors: [F({ conceptKey: v.k(c), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome', valueText: 'lower' })], relationText: 'A revised wording with newer support.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Short night')] })
  ];
  e.configure();
  const first = await e.run();
  assert.deepEqual(first.proposals.map((x) => x.outcome), ['ADMITTED_EXECUTED', 'ADMITTED_EXECUTED', 'ADMITTED_EXECUTED']);
  assert.equal(e.record(supTarget).status, 'superseded');
  const second = await e.run();
  assert.deepEqual(second.proposals.map((x) => x.code), ['DUPLICATE_OF_PRESENTED', 'NO_CHANGE', 'INVALID_TARGET']);
});
test('AC-D34: runPass never throws under any injected failure', async () => {
  const e = env();
  await seedTurns(e);
  e.configure({ modelTransport: () => { throw new Error('transport'); } });
  assert.equal((await e.run()).status, 'INTERPRETER_FAILED');
  for (const fn of STORE_FNS) {
    const e2 = env();
    await seedTurns(e2);
    e2.overrides[fn] = () => { throw new Error('boom ' + fn); };
    e2.configure();
    await assert.doesNotReject(() => e2.run());
  }
  for (const op of ['readObservations', 'readOwnershipClaims', 'readUserStatedReferences']) {
    const e3 = env();
    await seedTurns(e3);
    e3.op.override(op, () => { throw new Error('boom'); });
    e3.configure();
    const r = await e3.run();
    assert.equal(typeof r.status, 'string');
  }
  const e4 = env();
  await seedTurns(e4);
  e4.transport.respond = () => { throw new Error('bad responder'); };
  e4.configure();
  assert.equal((await e4.run()).status, 'INTERPRETER_FAILED');
});

// ═══ AC-D9 (pass level) / §25 / §27 — 0, 1 or 2 model calls; never one per proposal ═══
async function twoConcepts(e) { return { a: await concept(e, 'rest'), b: await concept(e, 'session quality') }; }
test('AC-D9 / §27: 0 calls when a precondition stops the pass; 1 when no plan survives; 2 only when at least one plan exists', async () => {
  // 0 — precondition
  const e0 = env();
  e0.op.override('readObservations', async () => []);
  e0.configure();
  const r0 = await e0.run();
  assert.deepEqual([r0.status, r0.modelCalls, e0.transport.bodies.length], ['NO_OBSERVATIONS', 0, 0]);
  // 1 — zero proposals
  const e1 = env();
  await seedTurns(e1);
  e1.configure();
  const r1 = await e1.run();
  assert.deepEqual([r1.status, r1.modelCalls, e1.transport.generator.length, e1.transport.verifier.length], ['COMPLETED', 1, 1, 0]);
  // 1 — every proposal rejected by the pre-verification gate
  const e2 = env();
  await seedTurns(e2);
  e2.transport.respond = (v) => [P({ factors: [F({ newConceptLabel: 'novel a', role: 'condition' }), F({ newConceptLabel: 'novel b', role: 'outcome' })], supporting: ['o99'] })];
  e2.configure();
  const r2 = await e2.run();
  assert.deepEqual([r2.status, r2.modelCalls, e2.transport.verifier.length, r2.proposals[0].code], ['COMPLETED', 1, 0, 'UNKNOWN_OBSERVATION']);
  // 1 — Generator failure
  const e3 = env();
  await seedTurns(e3);
  e3.configure({ modelTransport: async () => ({ content: [{ text: 'not json' }] }) });
  const r3 = await e3.run();
  assert.deepEqual([r3.status, r3.modelCalls], ['INTERPRETER_FAILED', 1]);
  // 2 — several plans, still exactly one batched Verifier call
  const e4 = env();
  await seedTurns(e4);
  const { a, b } = await twoConcepts(e4);
  e4.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], relationText: 'First association.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
    P({ factors: [F({ conceptKey: v.k(b), role: 'condition' }), F({ conceptKey: v.k(a), role: 'outcome' })], relationText: 'Second association.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] }),
    P({ factors: [F({ conceptKey: v.k(a), role: 'subject' }), F({ newConceptLabel: 'a third thing', role: 'outcome' })], relationText: 'Third association.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Short night')] })
  ];
  e4.configure();
  const r4 = await e4.run();
  assert.deepEqual([r4.status, r4.modelCalls, e4.transport.generator.length, e4.transport.verifier.length], ['COMPLETED', 2, 1, 1]);
  assert.equal(verifierView(e4.transport.verifier[0]).items.length, 3);
});
test('AC-D55 (pass level): a malformed proposal is rejected alone; its valid sibling is verified and written', async () => {
  const e = env();
  await seedTurns(e);
  const { a, b } = await twoConcepts(e);
  e.transport.respond = (v) => [
    { operation: 'CREATE' },
    { operation: 'APPEND_EVIDENCE', targetRecordId: 'm_record_1', appendList: 'supporting', factors: null }, // the v1.0 failure shape (§31.1)
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] })
  ];
  e.configure();
  const before = e.records().length;
  const r = await e.run();
  assert.equal(r.status, 'COMPLETED');
  assert.deepEqual(r.proposals.map((x) => [x.index, x.operation, x.outcome, x.code]), [
    [0, 'CREATE', 'REJECTED', 'MALFORMED_PROPOSAL'], [1, 'APPEND_EVIDENCE', 'REJECTED', 'MALFORMED_PROPOSAL'], [2, 'CREATE', 'ADMITTED_EXECUTED', null]]);
  assert.equal(e.records().length, before + 1);
  assert.equal(verifierView(e.transport.verifier[0]).items.length, 1);
});

// ═══ AC-D54 / AC-D58 — keys only, and Verifier input rendered from plans and trusted state ═══
test('AC-D54 / AC-D58: no durable id reaches either model; the Verifier sees all presented observations, trusted targets and plan-rendered items', async () => {
  const e = env();
  await seedTurns(e);
  const { a, b } = await twoConcepts(e);
  const cand = await candidate(e, [[a, 'condition'], [b, 'outcome']], ['t9'], 'Stored candidate wording for the target.');
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ newConceptLabel: 'a fresh idea', role: 'outcome', valueText: 'lower' })], relationText: 'A plan-rendered claim.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
    APP({ target: v.r(cand), list: 'contradicting', observations: [v.key('full night')] })
  ];
  e.configure();
  const r = await e.run();
  assert.equal(r.status, 'COMPLETED', JSON.stringify(r));
  const g = e.transport.generator[0].messages[0].content;
  const vb = e.transport.verifier[0].messages[0].content;
  [a, b, cand].forEach((id) => { assert.equal(g.indexOf(id), -1, 'durable id in Generator input'); assert.equal(vb.indexOf(id), -1, 'durable id in Verifier input'); });
  const vv = verifierView(e.transport.verifier[0]);
  assert.deepEqual(vv.observations, view(e.transport.generator[0]).observations); // identical, same keys
  assert.deepEqual(vv.targets.map((t) => t.relationDescription), ['Stored candidate wording for the target.']); // from stored state
  assert.deepEqual(vv.targets[0].factors.map((f) => f.labels[0]), ['rest', 'session quality']);
  assert.deepEqual(vv.items.map((it) => [it.item, it.operation]), [['p1', 'CREATE'], ['p2', 'APPEND_EVIDENCE']]);
  assert.deepEqual(vv.items[0].claim.factors.map((f) => f.labels || f.newConceptLabel), [['rest'], 'a fresh idea']);
  assert.equal(vv.items[0].claim.relationText, 'A plan-rendered claim.');
  assert.equal(vv.items[1].claim, null); // APPEND generates no claim of its own
  assert.equal(JSON.stringify(vv.items).indexOf('restatesUserStatement'), -1); // the Generator's raw output is never forwarded
});

// ═══ AC-D59 / AC-D63 — Verifier failure and attribution: no unverified write ═══
test('AC-D59 / AC-D63: a failed or unattributable Verifier result writes nothing; a malformed item rejects only its plan', async () => {
  const setup = async (verifierRaw) => {
    const e = env();
    await seedTurns(e);
    const { a, b } = await twoConcepts(e);
    e.transport.respond = (v) => [
      P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], relationText: 'First.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
      P({ factors: [F({ conceptKey: v.k(b), role: 'condition' }), F({ conceptKey: v.k(a), role: 'outcome' })], relationText: 'Second.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] })
    ];
    e.transport.verifierRaw = verifierRaw;
    e.configure();
    const before = e.records().length;
    const r = await e.run();
    return { e, r, written: e.records().length - before };
  };
  const ok = (vv) => vv.items.map((it) => Object.assign({ item: it.item }, passing(it.operation)));
  const failures = {
    transport: () => { throw new Error('down'); },
    not_json: () => ({ content: [{ text: 'no' }] }),
    max_tokens: (vv) => ({ content: [{ text: JSON.stringify({ verdicts: ok(vv) }) }], stop_reason: 'max_tokens' }),
    unknown_item: (vv) => ({ content: [{ text: JSON.stringify({ verdicts: ok(vv).concat([Object.assign({}, ok(vv)[0], { item: 'p7' })]) }) }] }),
    duplicate_item: (vv) => ({ content: [{ text: JSON.stringify({ verdicts: ok(vv).concat([ok(vv)[0]]) }) }] }),
    missing_item_key: (vv) => ({ content: [{ text: JSON.stringify({ verdicts: [Object.assign({}, ok(vv)[0], { item: undefined }), ok(vv)[1]] }) }] })
  };
  for (const [name, raw] of Object.entries(failures)) {
    const { r, written } = await setup(raw);
    assert.equal(r.status, 'VERIFIER_FAILED', name);
    assert.equal(r.modelCalls, 2, name);
    assert.equal(written, 0, name);
    assert.deepEqual(r.proposals.map((x) => x.code), ['VERIFICATION_UNAVAILABLE', 'VERIFICATION_UNAVAILABLE'], name);
  }
  const malformed = await setup((vv) => ({ content: [{ text: JSON.stringify({ verdicts: [Object.assign({}, ok(vv)[0], { direction: 'CONSISTENT' }), ok(vv)[1]] }) }] }));
  assert.equal(malformed.r.status, 'COMPLETED');
  assert.deepEqual(malformed.r.proposals.map((x) => [x.outcome, x.code]), [['REJECTED', 'VERIFICATION_MALFORMED'], ['ADMITTED_EXECUTED', null]]);
  assert.equal(malformed.written, 1);
  const missing = await setup((vv) => ({ content: [{ text: JSON.stringify({ verdicts: [ok(vv)[1]] }) }] }));
  assert.deepEqual(missing.r.proposals.map((x) => x.code), ['VERIFICATION_MISSING', null]);
});

// ═══ AC-D60 / E6 / §24 — semantic vetoes are final; Generator flags only reject early ═══
test('E6 / AC-D60: RESTATED and UNCERTAIN restatement verdicts block the write; NOT_RESTATED is the only pass', async () => {
  for (const [value, code] of [['RESTATED', 'RESTATED'], ['UNCERTAIN', 'RESTATEMENT_UNCERTAIN']]) {
    const e = env();
    e.op.seed.turn('t1', 'Late dinners wreck my next morning.', DAY);
    e.op.seed.turn('t2', 'Like I said, eating late ruins the next day for me.', 3 * DAY);
    const x = await concept(e, 'late eating');
    const y = await concept(e, 'next-day functioning');
    e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(x), role: 'condition' }), F({ conceptKey: v.k(y), role: 'outcome' })],
      relationText: 'Late eating is associated with impaired functioning the following day.', evidenceClass: 'RECURRENCE', supporting: [v.key('Late dinners'), v.key('eating late')] })];
    e.transport.verdict = () => ({ restatement: value }); // the Generator declared false; the Verifier decides
    e.configure();
    const before = e.records().length;
    const r = await e.run();
    assert.deepEqual([r.proposals[0].outcome, r.proposals[0].code, r.proposals[0].verification.restatement], ['REJECTED', code, value]);
    assert.equal(e.records().length, before);
  }
});
test('§24 / AC-D65: the Generator Safety flag rejects before verification; the Verifier Safety veto is final, including for APPEND', async () => {
  const e = env();
  await seedTurns(e);
  const { a, b } = await twoConcepts(e);
  e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')], safetyAdjacent: true })];
  e.configure();
  const r = await e.run();
  assert.deepEqual([r.proposals[0].code, r.modelCalls, e.transport.verifier.length], ['SAFETY_ADJACENT_PROPOSAL', 1, 0]);
  for (const value of ['SAFETY_ADJACENT', 'UNCERTAIN']) {
    const e2 = env();
    await seedTurns(e2);
    const c = await twoConcepts(e2);
    const cand = await candidate(e2, [[c.a, 'condition'], [c.b, 'outcome']], ['t9'], 'Append target wording.');
    e2.transport.respond = (v) => [
      P({ factors: [F({ conceptKey: v.k(c.a), role: 'subject' }), F({ newConceptLabel: 'other', role: 'outcome' })], relationText: 'A create claim.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
      APP({ target: v.r(cand), list: 'supporting', observations: [v.key('Short night')] })
    ];
    e2.transport.verdict = () => ({ safety: value });
    e2.configure();
    const before = clone(e2.record(cand));
    const before2 = e2.records().length;
    const r2 = await e2.run();
    assert.deepEqual(r2.proposals.map((x) => x.code), value === 'SAFETY_ADJACENT' ? ['SAFETY_VETO', 'SAFETY_VETO'] : ['SAFETY_UNCERTAIN', 'SAFETY_UNCERTAIN']);
    assert.equal(e2.records().length, before2);
    assert.deepEqual(e2.record(cand), before);
  }
});
test('§17.1 / AC-D60: unsupported or uncertain claim content and unfaithful temporal content are never written', async () => {
  for (const [dim, value, code] of [['unsupported', 'PRESENT', 'UNSUPPORTED_CONTENT'], ['unsupported', 'UNCERTAIN', 'UNSUPPORTED_UNCERTAIN'], ['temporal', 'UNFAITHFUL', 'TEMPORAL_UNFAITHFUL']]) {
    const e = env();
    await seedTurns(e);
    const { a, b } = await twoConcepts(e);
    e.transport.respond = (v) => [P({ factors: [F({ conceptKey: v.k(a), role: 'condition', valueText: 'below the usual recommendation' }), F({ conceptKey: v.k(b), role: 'outcome' })], evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] })];
    e.transport.verdict = () => ({ [dim]: value });
    e.configure();
    const before = e.records().length;
    const r = await e.run();
    assert.equal(r.proposals[0].code, code);
    assert.equal(e.records().length, before);
  }
});

// ═══ APPEND end to end (R-1; AC-D17 … AC-D21, AC-D62, AC-D65) ═══
test('APPEND end to end: target by key, trusted structure, materialized observations verified and written exactly; INCONSISTENT writes nothing', async () => {
  for (const direction of ['CONSISTENT', 'INCONSISTENT', 'UNCERTAIN']) {
    const e = env();
    await seedTurns(e);
    const { a, b } = await twoConcepts(e);
    const cand = await candidate(e, [[a, 'condition'], [b, 'outcome']], ['t1'], 'Flatter sessions have followed short nights.');
    e.transport.respond = (v) => [APP({ target: v.r(cand), list: 'supporting', observations: [v.key('Only four'), v.key('Short night')] })];
    e.transport.verdict = () => ({ direction });
    e.configure();
    const before = clone(e.record(cand));
    const r = await e.run();
    const vv = verifierView(e.transport.verifier[0]);
    // t1 is already on the target: only the materialized observation is rendered for direction
    assert.deepEqual(vv.items[0].observations, [vv.observations.find((o) => o.segments[0].text.indexOf('Short night') !== -1).obsKey]);
    assert.equal(vv.targets[0].relationDescription, 'Flatter sessions have followed short nights.');
    if (direction === 'CONSISTENT') {
      assert.deepEqual([r.proposals[0].outcome, r.proposals[0].recordIds], ['ADMITTED_EXECUTED', [cand]]);
      const after = e.record(cand);
      assert.deepEqual(after.evidence.supporting.map((x) => x.ref), ['t1', 't2']); // exactly the verified set was added
      assert.deepEqual(after.factors, before.factors); // structure untouched
    } else {
      assert.equal(r.proposals[0].code, direction === 'INCONSISTENT' ? 'DIRECTION_INCONSISTENT' : 'DIRECTION_UNCERTAIN');
      assert.deepEqual(e.record(cand), before);
    }
  }
});

// ═══ Temporality end to end (R-4; AC-D56, AC-D57) ═══
test('AC-D56 / AC-D57: structural meal times reach the gate; observed and stated grounding admit; an ungrounded recurring window never does', async () => {
  const e = env();
  e.op.seed.day('2026-01-01', 1 * DAY, [{ name: 'noodles', kcal: 700, time: '22:40' }]);
  e.op.seed.day('2026-01-02', 2 * DAY, [{ name: 'noodles', kcal: 680, time: '7:05' }]);
  e.op.seed.turn('t1', 'Every Sunday I cook for the whole week.', 3 * DAY);
  e.op.seed.turn('t2', 'Groggy again today.', 4 * DAY);
  const x = await concept(e, 'late intake');
  const y = await concept(e, 'grogginess');
  e.transport.respond = (v) => {
    const d1 = v.key('2026-01-01');
    const d2 = v.key('2026-01-02');
    const day1 = v.observations.find((o) => o.obsKey === d1);
    assert.equal(day1.segments[0].localTime, '22:40'); // segment-level structural time rendered
    assert.equal(v.observations.find((o) => o.obsKey === d2).segments[0].localTime, '07:05'); // normalized by the adapter
    const T = (k) => ({ kind: 'SOURCE_TIME', obsKey: k, segmentId: 'meal1', field: 'LOCAL_TIME' });
    const turn = v.key('Every Sunday');
    const X = (t) => ({ kind: 'USER_EXPRESSION', obsKey: turn, segmentId: 'user', text: t });
    return [
      P({ factors: [F({ conceptKey: v.k(x), role: 'condition' }), F({ conceptKey: v.k(y), role: 'outcome' })], relationText: 'Logged intake has recurred at the observed local times.', evidenceClass: 'RECURRENCE', temporality: 'RECURRING_WINDOW',
        supporting: [d1, d2], grounding: { recurrence: { form: 'OBSERVED', anchors: [T(d1), T(d2)] }, window: { form: 'SOURCE_LOCAL', anchors: [T(d1), T(d2)] } } }),
      P({ factors: [F({ conceptKey: v.k(x), role: 'subject' }), F({ newConceptLabel: 'batch cooking', role: 'condition' })], relationText: 'A weekly cooking routine noted by the person.', evidenceClass: 'SINGLE_OBSERVATION', temporality: 'RECURRING_WINDOW',
        supporting: [turn], grounding: { recurrence: { form: 'STATED', anchors: [X('every sunday')] }, window: { form: 'STATED', anchors: [X('every sunday')] } } }),
      P({ factors: [F({ conceptKey: v.k(y), role: 'subject' }), F({ newConceptLabel: 'something else', role: 'outcome' })], relationText: 'An ungrounded recurring claim.', evidenceClass: 'RECURRENCE', temporality: 'RECURRING_WINDOW',
        supporting: [turn, v.key('Groggy')], grounding: null })
    ];
  };
  e.configure();
  const r = await e.run();
  assert.deepEqual(r.proposals.map((p) => [p.outcome, p.code]), [['ADMITTED_EXECUTED', null], ['ADMITTED_EXECUTED', null], ['REJECTED', 'INVALID_OPERATION_SHAPE']]);
  const vv = verifierView(e.transport.verifier[0]);
  assert.deepEqual(vv.items[0].claim.grounding.window.anchors.map((a) => a.value), ['22:40', '07:05']); // resolved structural values
  assert.equal(vv.items[1].claim.grounding.recurrence.anchors[0].value, 'every sunday');
  const written = e.record(r.proposals[0].recordIds[0]);
  assert.equal(written.temporality, 'RECURRING_WINDOW');
  assert.equal(JSON.stringify(written).indexOf('grounding'), -1); // grounding is never persisted (§20.5)
});

// ═══ AC-D64 — PassResult carries ids, closed codes and closed tokens only ═══
test('AC-D64: PassResult shape — modelCalls, per-proposal closed codes and verdict tokens, no content', async () => {
  const e = env();
  await seedTurns(e);
  const { a, b } = await twoConcepts(e);
  e.transport.respond = (v) => [
    P({ factors: [F({ conceptKey: v.k(a), role: 'condition' }), F({ conceptKey: v.k(b), role: 'outcome' })], relationText: 'Secret wording one.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('Only four')] }),
    P({ factors: [F({ conceptKey: v.k(b), role: 'condition' }), F({ conceptKey: v.k(a), role: 'outcome' })], relationText: 'Secret wording two.', evidenceClass: 'SINGLE_OBSERVATION', supporting: [v.key('full night')] })
  ];
  e.transport.verdict = (it) => (it.item === 'p2' ? { temporal: 'UNCERTAIN' } : {});
  e.configure();
  const r = await e.run();
  assert.deepEqual(Object.keys(r).sort(), ['modelCalls', 'observationsPresented', 'proposals', 'sourcesRead', 'status']);
  assert.deepEqual(Object.keys(r.proposals[0]).sort(), ['code', 'index', 'operation', 'outcome', 'recordIds', 'verification']);
  assert.deepEqual(r.proposals[1].verification, { restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'UNCERTAIN', direction: 'NOT_APPLICABLE' });
  const s = JSON.stringify(r);
  ['Secret wording', 'Only four hours', 'wading'].forEach((t) => assert.equal(s.indexOf(t), -1, t));
});
