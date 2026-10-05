// WP0 Phase E.0.2d — Consolidation Gate: pre-verification gate and post-verification authorization
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md v1.1 §14.4, §16, §20.2, §22-§24;
// AC-D12 … AC-D29, AC-D35, AC-D37 … AC-D39, AC-D53, AC-D54, AC-D56, AC-D60, AC-D61, AC-D65).
// Pure gate tests over hand-built pass contexts; no model, no store, no port.
// Run with: node --test tests/e02dConsolidationGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const Gate = require(path.join(ROOT, 'js/coachDecisionSystem/consolidationGate.js'));
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));

// ── v1.1 per-operation proposal shapes (§15.2); concept keys k*, record keys r*, user-stated keys u* ──
function F(o) { return Object.assign({ conceptKey: null, newConceptLabel: null, role: 'subject', valueText: null }, o); }
function P(o) {
  return Object.assign({ operation: 'CREATE', factors: [F({ conceptKey: 'kA', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })],
    relationText: 'Weaker sessions have followed the shorter nights noted here.', evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', grounding: null,
    supporting: ['o1'], contradicting: [], reference: null, restatesUserStatement: false, safetyAdjacent: false }, o);
}
const S = (o) => P(Object.assign({ operation: 'SUPERSEDE', target: 'r1', relationText: 'A revised association resting on newer observations.', supporting: ['o2'] }, o));
const A = (o) => Object.assign({ operation: 'APPEND_EVIDENCE', target: 'r1', list: 'supporting', observations: ['o2'], restatesUserStatement: false, safetyAdjacent: false }, o);
function ref(kind, r) { return { kind, ref: r }; }
function rec(id, factors, extra) {
  const refs = (extra && extra.on) || [];
  return Object.assign({
    recordId: id, factors: factors.map((f) => ({ conceptId: f[0], role: f[1], valueDescription: f[2] || null })),
    conceptIds: Array.from(new Set(factors.map((f) => f[0]))).sort(),
    relationDescription: (extra && extra.rel) || 'Stored relation ' + id + '.', status: (extra && extra.status) || 'candidate', source: (extra && extra.source) || 'inferred_event',
    evidence: { supporting: refs.map((x) => ({ refId: x })), contradicting: [] }, supportingRefIds: refs.slice().sort(), safetyFlag: 'STANDARD'
  }, (extra && extra.over) || {});
}
function seg(id, authorship, text, extra) { return Object.assign({ segmentId: id, authorship, text, localDate: null, localTime: null, utcOffsetMinutes: null }, extra || {}); }
function ctx(over) {
  const roots = Object.assign({ cA: 'cA', cB: 'cB', cC: 'cC', cD: 'cD' }, (over && over.roots) || {});
  const base = {
    observations: {
      o1: { ref: ref('CONVERSATION_TURN', 't1'), refId: 'CONVERSATION_TURN:t1', observedAt: 1000, localDate: null, localTime: null, utcOffsetMinutes: null,
        segments: [seg('user', 'USER_AUTHORED', 'I slept four hours and the session dragged on forever.')], userTexts: ['I slept four hours and the session dragged on forever.'] },
      o2: { ref: ref('CONVERSATION_TURN', 't2'), refId: 'CONVERSATION_TURN:t2', observedAt: 2000, localDate: null, localTime: null, utcOffsetMinutes: null,
        segments: [seg('user', 'USER_AUTHORED', 'Barely rested again last night.')], userTexts: ['Barely rested again last night.'] },
      o3: { ref: ref('DAY_LOG', '2026-03-03'), refId: 'DAY_LOG:2026-03-03', observedAt: null, localDate: '2026-03-03', localTime: null, utcOffsetMinutes: null,
        segments: [seg('meal1', 'USER_RECORDED', null, { localTime: '22:40' })], userTexts: [] },
      o4: { ref: ref('CONVERSATION_TURN', 't4'), refId: 'CONVERSATION_TURN:t4', observedAt: 4000, localDate: null, localTime: null, utcOffsetMinutes: null,
        segments: [seg('user', 'USER_AUTHORED', 'Felt fine.')], userTexts: ['Felt fine.'] },
      o5: { ref: ref('DAY_LOG', '2026-03-04'), refId: 'DAY_LOG:2026-03-04', observedAt: null, localDate: '2026-03-04', localTime: null, utcOffsetMinutes: null,
        segments: [seg('meal1', 'USER_RECORDED', null, { localTime: '22:55' })], userTexts: [] },
      o6: { ref: ref('CONVERSATION_TURN', 't6'), refId: 'CONVERSATION_TURN:t6', observedAt: 6000, localDate: null, localTime: null, utcOffsetMinutes: null,
        segments: [seg('user', 'USER_AUTHORED', 'Every Sunday evening I prepare lunches for the whole week.')], userTexts: ['Every Sunday evening I prepare lunches for the whole week.'] }
    },
    conceptKeys: { kA: 'cA', kB: 'cB', kC: 'cC', kD: 'cD' },
    presentedConcepts: [{ conceptId: 'cA', labels: ['rest'] }, { conceptId: 'cB', labels: ['session quality'] }, { conceptId: 'cC', labels: ['evening'] }, { conceptId: 'cD', labels: ['meal timing'] }],
    rootOf: (id) => (Object.prototype.hasOwnProperty.call(roots, id) ? roots[id] : 'unresolved:' + id),
    records: {},
    references: {},
    userStatedStructures: [],
    ownedRefIds: {},
    ownersByRefId: {}
  };
  return Object.assign(base, over || {}, { rootOf: base.rootOf });
}
const one = (p, c) => Gate._internal.evaluateProposal(p, c || ctx());
const ok = (r) => r.outcome === 'PLAN';

// ═══ G1 / AC-D28 — early, reject-only Generator flags (E4, §24 item 3) ═══
test('AC-D28: a true Generator flag rejects; false grants nothing by itself (missing/malformed flags are a shape failure, §15.3)', () => {
  assert.equal(one(P({ restatesUserStatement: true })).code, 'DECLARED_RESTATEMENT');
  assert.equal(one(P({ safetyAdjacent: true })).code, 'SAFETY_ADJACENT_PROPOSAL');
  assert.equal(one(A({ safetyAdjacent: true })).code, 'SAFETY_ADJACENT_PROPOSAL');
  // both flags false still produce only a PLAN, which has no authority until §16.5 (see AC-D60, AC-D65)
  const r = one(P());
  assert.equal(r.outcome, 'PLAN');
  assert.equal(Object.prototype.hasOwnProperty.call(r, 'admitted'), false);
});

// ═══ G2 / G6 / AC-D54 — observation keys ═══
test('G2 / AC-D54: observation keys must resolve in the observation namespace, be distinct, and sit in one list only', () => {
  assert.equal(one(P({ supporting: ['o9'] })).code, 'UNKNOWN_OBSERVATION');
  assert.equal(one(P({ supporting: ['u1'] })).code, 'UNKNOWN_OBSERVATION'); // cross-namespace key
  assert.equal(one(P({ supporting: ['r1'] })).code, 'UNKNOWN_OBSERVATION');
  assert.equal(one(P({ supporting: ['o1', 'o1'], evidenceClass: 'RECURRENCE' })).code, 'INVALID_EVIDENCE');
  assert.equal(one(P({ supporting: ['o1'], contradicting: ['o1'] })).code, 'INVALID_EVIDENCE');
  const c = appendCtx();
  assert.equal(one(A({ observations: ['o2', 'o2'] }), c).code, 'INVALID_EVIDENCE');
  assert.equal(one(A({ observations: ['k1'] }), c).code, 'UNKNOWN_OBSERVATION');
});
test('AC-D35: a cited kind outside V1 (Habit/Pattern or any other) is SOURCE_NOT_IN_SCOPE', () => {
  for (const kind of ['HABIT_RECORD', 'PATTERN_RECORD', 'TYPED_MEMORY_RECORD', 'USER_KNOWLEDGE_RECORD']) {
    const c = ctx();
    c.observations.o9 = { ref: ref(kind, 'x1'), refId: kind + ':x1', observedAt: null, localDate: null, localTime: null, utcOffsetMinutes: null, segments: [], userTexts: [] };
    assert.equal(one(P({ supporting: ['o9'] }), c).code, 'SOURCE_NOT_IN_SCOPE', kind);
  }
});

// ═══ C2 – C5 (AC-D12 … AC-D16) ═══
test('AC-D13 (C2): evidence-class counts over supporting observations only', () => {
  assert.equal(one(P({ supporting: [] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(P({ evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o1', 'o2'] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(ok(one(P({ evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o1'] }))), true);
  assert.equal(one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1'] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(ok(one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1', 'o2'] }))), true);
  assert.equal(ok(one(P({ evidenceClass: 'CO_OCCURRENCE', supporting: ['o1'], contradicting: ['o2'] }))), true);
});
test('AC-D12 / AC-D14 (C3, R-4): grounding is present exactly for RECURRING_WINDOW; no RECURRING_WINDOW ⇒ RECURRENCE coupling remains', () => {
  // RECURRENCE alone never admits a recurring window
  assert.equal(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'RECURRENCE', supporting: ['o1', 'o2'] })).code, 'INVALID_OPERATION_SHAPE');
  // grounding on a non-recurring temporality is a shape error
  assert.equal(one(P({ grounding: stated('o6') })).code, 'INVALID_OPERATION_SHAPE');
  // a grounded recurring window is admissible with any evidence class (no coupling)
  assert.equal(ok(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o6'], grounding: stated('o6'), relationText: 'A weekly routine of preparing food ahead.' }))), true);
  const tmp = one(P({ temporality: 'TEMPORARY' }));
  assert.equal(ok(tmp), true);
  assert.equal(Object.prototype.hasOwnProperty.call(tmp.plan.draft, 'expiresAt'), false); // §20: expiresAt null
});
test('AC-D15 (C4): a CREATE identical in content to a presented FITME record is DUPLICATE_OF_PRESENTED', () => {
  const p = P();
  const c = ctx();
  const content = C.materializeContent({ factors: [{ conceptId: 'cA', role: 'condition', valueDescription: null }, { conceptId: 'cB', role: 'outcome', valueDescription: null }], relationDescription: p.relationText }, () => null);
  c.records.r1 = Object.assign(rec('rec1', [['cA', 'condition'], ['cB', 'outcome']]), { relationDescription: content.relationDescription });
  assert.equal(one(p, c).code, 'DUPLICATE_OF_PRESENTED');
  assert.equal(ok(one(P({ relationText: 'A different associative wording for these factors.' }), c)), true);
});
test('AC-D16 (C5): same structure as a presented candidate is admissible as CREATE (uncertainty prefers CREATE)', () => {
  const c = ctx();
  c.records.r1 = rec('rec1', [['cA', 'condition'], ['cB', 'outcome']], { rel: 'Some other existing wording.' });
  const r = one(P(), c);
  assert.equal(ok(r), true);
  assert.equal(r.plan.operation, 'CREATE');
});
test('§17: the CREATE plan fixes every field the model may not choose and carries a resolved claim for the Verifier', () => {
  const r = one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1', 'o3'], contradicting: ['o2'] }));
  const d = r.plan.draft;
  assert.equal(d.confidence, 0);
  assert.equal(d.source, 'inferred_pattern');
  assert.equal(d.safetyFlag, 'STANDARD');
  assert.equal(one(P()).plan.draft.source, 'inferred_event');
  assert.deepEqual(d.evidence.supporting, [{ kind: 'CONVERSATION_TURN', ref: 't1', observedAt: 1000 }, { kind: 'DAY_LOG', ref: '2026-03-03', observedAt: null }]);
  assert.deepEqual(d.evidence.contradicting, [{ kind: 'CONVERSATION_TURN', ref: 't2', observedAt: 2000 }]);
  assert.deepEqual(Object.keys(d).sort(), ['confidence', 'evidence', 'evidenceClass', 'factors', 'relationDescription', 'safetyFlag', 'source', 'temporality']);
  assert.deepEqual(d.factors, [{ role: 'condition', valueDescription: null, conceptId: 'cA' }, { role: 'outcome', valueDescription: null, conceptId: 'cB' }]);
  assert.deepEqual(r.plan.claim.factors.map((f) => f.conceptId), ['cA', 'cB']);
  assert.deepEqual(r.plan.claim.supporting, ['o1', 'o3']);
});

// ═══ A1 – A5 (AC-D17 … AC-D21; R-1) — APPEND from trusted state ═══
function appendCtx() {
  const c = ctx();
  c.records.r1 = rec('rec1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  return c;
}
test('AC-D17 (A1): the target key must resolve to a presented FITME-sourced candidate or active record', () => {
  const c = appendCtx();
  assert.equal(ok(one(A(), c)), true);
  assert.equal(one(A({ target: 'r9' }), c).code, 'INVALID_TARGET');
  assert.equal(one(A({ target: 'rec1' }), c).code, 'INVALID_TARGET'); // a durable id is not a key
  assert.equal(one(A({ target: 'u1' }), c).code, 'INVALID_TARGET'); // cross-namespace
  c.records.r2 = rec('us1', [['cC', 'subject']], { source: 'user_stated', status: 'active' });
  assert.equal(one(A({ target: 'r2' }), c).code, 'INVALID_TARGET'); // never user-stated, even if keyed
  c.records.r3 = rec('rec3', [['cD', 'subject']], { status: 'superseded' });
  assert.equal(one(A({ target: 'r3' }), c).code, 'INVALID_TARGET');
  const active = appendCtx();
  active.records.r1.status = 'active';
  assert.equal(ok(one(A({ list: 'contradicting' }), active)), true);
});
test('AC-D19 (A3): the structure is derived from the stored target with merge-resolved roots; no model-supplied structure exists', () => {
  const r = one(A(), appendCtx());
  assert.equal(ok(r), true);
  assert.deepEqual(Object.keys(r.plan).sort(), ['list', 'newKeys', 'observations', 'operation', 'refs', 'targetKey', 'targetRecordId']);
  assert.equal(r.plan.targetRecordId, 'rec1');
  assert.equal(r.plan.targetKey, 'r1');
});
test('AC-D20 (A4): another presented record with the same merge-resolved signature makes the target ambiguous', () => {
  const c = appendCtx();
  c.records.r2 = rec('rec2', [['cA', 'condition'], ['cB', 'outcome']], { rel: 'A second, opposite formulation.' });
  assert.equal(one(A(), c).code, 'AMBIGUOUS_TARGET');
  const merged = ctx({ roots: { cC: 'cA' } }); // cC merged into cA: same structure after resolution
  merged.records.r1 = rec('rec1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  merged.records.r2 = rec('rec2', [['cC', 'condition'], ['cB', 'outcome']]);
  assert.equal(one(A(), merged).code, 'AMBIGUOUS_TARGET');
  const distinct = appendCtx();
  distinct.records.r2 = rec('rec2', [['cA', 'outcome'], ['cB', 'condition']]); // roles differ
  assert.equal(ok(one(A(), distinct)), true);
});
test('AC-D21 (A5): materialized observations are exactly the cited ones not already on the target; none is NO_CHANGE; list bound respected', () => {
  const c = appendCtx();
  const r = one(A({ observations: ['o1'] }), c);
  assert.equal(r.outcome, 'NO_CHANGE');
  const full = appendCtx();
  full.records.r1.evidence.supporting = Array.from({ length: 64 }, (_, i) => ({ refId: 'CONVERSATION_TURN:z' + i }));
  assert.equal(one(A(), full).code, 'LIST_TOO_LONG');
  const m = one(A({ observations: ['o1', 'o2', 'o4'] }), appendCtx());
  assert.deepEqual(m.plan.observations, ['o2', 'o4']);
  assert.deepEqual(m.plan.refs, [{ kind: 'CONVERSATION_TURN', ref: 't2', observedAt: 2000 }, { kind: 'CONVERSATION_TURN', ref: 't4', observedAt: 4000 }]);
});

// ═══ S1 – S5 (AC-D22 … AC-D26) ═══
function supCtx(status) {
  const c = ctx();
  c.records.r1 = rec('rec1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'], status: status || 'candidate' });
  return c;
}
test('AC-D22 (S1): only a presented FITME candidate may be superseded — never active, never user-stated, never unknown', () => {
  const r = one(S(), supCtx());
  assert.equal(ok(r), true);
  assert.equal(r.plan.targetRecordId, 'rec1');
  assert.equal(one(S(), supCtx('active')).code, 'INVALID_TARGET');
  assert.equal(one(S({ target: 'r5' }), supCtx()).code, 'INVALID_TARGET');
  const us = supCtx();
  us.records.r1.source = 'user_stated';
  assert.equal(one(S(), us).code, 'INVALID_TARGET');
});
test('AC-D23 (S2): the successor is validated as a CREATE (C2–C3, including grounding)', () => {
  assert.equal(one(S({ evidenceClass: 'RECURRENCE' }), supCtx()).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(S({ temporality: 'RECURRING_WINDOW' }), supCtx()).code, 'INVALID_OPERATION_SHAPE');
});
test('AC-D24 (S3): an identical successor is SUPERSEDE_IDENTICAL', () => {
  const c = supCtx();
  const p = S();
  c.records.r1.relationDescription = C.normalizeText(p.relationText);
  assert.equal(one(p, c).code, 'SUPERSEDE_IDENTICAL');
});
test('AC-D25 (S4): the successor must share a root concept with the target', () => {
  assert.equal(one(S({ factors: [F({ conceptKey: 'kC', role: 'condition' }), F({ conceptKey: 'kD', role: 'outcome' })] }), supCtx()).code, 'SUPERSEDE_UNRELATED');
  const merged = ctx({ roots: { cC: 'cA' } });
  merged.records.r1 = rec('rec1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  assert.equal(ok(one(S({ factors: [F({ conceptKey: 'kC', role: 'condition' }), F({ conceptKey: 'kD', role: 'outcome' })] }), merged)), true);
});
test('AC-D26 (S5): the successor must rest on a new supporting observation', () => {
  assert.equal(one(S({ supporting: ['o1'] }), supCtx()).code, 'NO_NEW_EVIDENCE');
  assert.equal(one(S({ supporting: ['o2'] }), supCtx()).plan.operation, 'SUPERSEDE');
});

// ═══ E2 / U6 (AC-D27, AC-D53) ═══
test('AC-D27: literal restatement at, below and above the 24-character bound, across both lists, with normalization', () => {
  const user = 'I slept four hours and the session dragged on forever.';
  const at = 'qslept four hours and theq'; // shares exactly 24 characters ("slept four hours and the")
  assert.equal(one(P({ relationText: at })).code, 'LITERAL_RESTATEMENT');
  const below = 'qslept four hours and thq'; // shares exactly 23 characters ("slept four hours and th")
  assert.equal(ok(one(P({ relationText: below }))), true);
  assert.equal(one(P({ relationText: 'Prefix ' + user + ' suffix.' })).code, 'LITERAL_RESTATEMENT');
  assert.equal(one(P({ relationText: 'Something unrelated.', factors: [F({ conceptKey: 'kA', role: 'condition', valueText: 'SLEPT   FOUR HOURS AND THE SESSION' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'LITERAL_RESTATEMENT');
  assert.equal(one(P({ supporting: ['o4'], contradicting: ['o1'], relationText: 'Note: slept four hours and the session.' })).code, 'LITERAL_RESTATEMENT');
  const c = ctx();
  c.observations.o4.userTexts = ['Café visits always leave me restless for hours'];
  assert.equal(one(P({ supporting: ['o4'], relationText: 'Café visits always leave me restless here' }), c).code, 'LITERAL_RESTATEMENT');
});
test('AC-D53: U6 compares owning-record text only by normalized text — identical with and without merges', () => {
  const owner = rec('us9', [['cC', 'subject', 'barely rested every single night lately']], { source: 'user_stated', status: 'superseded', on: ['CONVERSATION_TURN:t4'] });
  const make = (roots) => {
    const c = ctx({ roots });
    c.ownedRefIds['CONVERSATION_TURN:t4'] = true;
    c.ownersByRefId['CONVERSATION_TURN:t4'] = [owner];
    return c;
  };
  const p = P({ supporting: ['o1', 'o4'], evidenceClass: 'RECURRENCE', relationText: 'Linked to being barely rested every single night.' });
  const plain = one(p, make({}));
  const merged = one(p, make({ cC: 'cA', cA: 'cA' }));
  assert.equal(plain.code, 'LITERAL_RESTATEMENT');
  assert.deepEqual(merged, plain);
});

// ═══ §19 concept rules (AC-D29 pre-verification part; AC-D54 concept keys) ═══
test('AC-D29 / AC-D54: concept keys resolve to presented concepts only; shadowing; per-proposal cap; in-proposal label dedup', () => {
  assert.equal(one(P({ factors: [F({ conceptKey: 'kZ', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'UNKNOWN_CONCEPT_KEY');
  assert.equal(one(P({ factors: [F({ conceptKey: 'cA', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'UNKNOWN_CONCEPT_KEY'); // a durable id is not a key
  assert.equal(one(P({ factors: [F({ conceptKey: 'o1', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'UNKNOWN_CONCEPT_KEY'); // cross-namespace
  const rootOnly = ctx();
  delete rootOnly.conceptKeys.kD; // a root rendered with a key but not itself a presented concept never resolves
  assert.equal(one(P({ factors: [F({ conceptKey: 'kD', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] }), rootOnly).code, 'UNKNOWN_CONCEPT_KEY');
  assert.equal(one(P({ factors: [F({ newConceptLabel: '  REST ', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'NEW_CONCEPT_SHADOWS_PRESENTED');
  assert.equal(one(P({ factors: [F({ conceptKey: 'kA', newConceptLabel: 'both', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'INVALID_FACTOR');
  assert.equal(one(P({ factors: [F({ role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] })).code, 'INVALID_FACTOR');
  const five = ['n1', 'n2', 'n3', 'n4', 'n5'].map((l, i) => F({ newConceptLabel: 'novel ' + l, role: i === 0 ? 'condition' : 'outcome' }));
  assert.equal(one(P({ factors: five })).code, 'NEW_CONCEPT_LIMIT');
  const dup = one(P({ factors: [F({ newConceptLabel: 'Novel Thing', role: 'condition' }), F({ newConceptLabel: 'novel  thing', role: 'outcome' })] }));
  assert.equal(ok(dup), true);
  assert.equal(dup.plan.newConceptLabels.length, 1);
});

// ═══ U1 – U5 at gate level (AC-D37, AC-D38, AC-D39 structural cases) ═══
function refCtx() {
  const c = ctx();
  c.references.u1 = { type: 'USER_KNOWLEDGE', recordRef: ref('USER_KNOWLEDGE_RECORD', 'us1'), roots: ['cA'], texts: ['I usually sleep around five hours'], claimedRefIds: ['CONVERSATION_TURN:t9'] };
  c.references.u2 = { type: 'TYPED_MEMORY', recordRef: ref('TYPED_MEMORY_RECORD', 'tm1'), roots: [], texts: ['I prefer evening sessions'], claimedRefIds: ['CONVERSATION_TURN:t8'] };
  c.userStatedStructures = [rec('us1', [['cA', 'subject', 'around five hours']], { source: 'user_stated', status: 'active' })];
  return c;
}
const R = (uKey, factorIndex) => ({ uKey, factorIndex });
test('AC-D37 (U1–U3): the single top-level reference resolves; reference form; executor-added evidence; structural novelty', () => {
  const c = refCtx();
  const good = P({ factors: [F({ conceptKey: 'kA', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })], reference: R('u1', 0), supporting: ['o1', 'o2'], evidenceClass: 'RECURRENCE' });
  const r = one(good, c);
  assert.equal(ok(r), true);
  assert.deepEqual(r.plan.draft.evidence.supporting.slice(-1), [{ kind: 'USER_KNOWLEDGE_RECORD', ref: 'us1', observedAt: null }]);
  assert.deepEqual(r.plan.claim.factors.map((f) => f.byReference), ['u1', null]);
  assert.equal(one(P({ reference: R('u7', 0) }), c).code, 'USER_STATED_REFERENCE_INVALID'); // unknown key
  assert.equal(one(P({ reference: R('o1', 0) }), c).code, 'USER_STATED_REFERENCE_INVALID'); // an observation key is not a reference
  assert.equal(one(P({ reference: R('u1', 2) }), c).code, 'USER_STATED_REFERENCE_INVALID'); // no such factor
  assert.equal(one(P({ factors: [F({ conceptKey: 'kA', role: 'condition', valueText: 'five hours' }), F({ conceptKey: 'kB', role: 'outcome' })], reference: R('u1', 0) }), c).code, 'USER_STATED_REFERENCE_INVALID');
  assert.equal(one(P({ factors: [F({ conceptKey: 'kB', role: 'condition' }), F({ conceptKey: 'kC', role: 'outcome' })], reference: R('u1', 0) }), c).code, 'USER_STATED_REFERENCE_INVALID'); // not the record's own concept
  assert.equal(one(P({ factors: [F({ newConceptLabel: 'about five hours', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })], reference: R('u1', 0) }), c).code, 'USER_STATED_REFERENCE_INVALID'); // not literal
  const literalNew = one(P({ factors: [F({ newConceptLabel: 'around five hours', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })], reference: R('u1', 0), supporting: ['o1'] }), c);
  assert.equal(ok(literalNew), true);
  assert.equal(one(P({ factors: [F({ conceptKey: 'kA', role: 'condition' })], reference: R('u1', 0) }), c).code, 'NO_NEW_MEANING');
  assert.equal(one(P({ factors: [F({ conceptKey: 'kA', role: 'condition' }), F({ conceptKey: 'kA', role: 'outcome' })], reference: R('u1', 0) }), c).code, 'NO_NEW_MEANING');
  const tm = one(P({ factors: [F({ conceptKey: 'kC', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })], reference: R('u2', 0) }), c);
  assert.equal(ok(tm), true);
  assert.deepEqual(tm.plan.draft.evidence.supporting.slice(-1), [{ kind: 'TYPED_MEMORY_RECORD', ref: 'tm1', observedAt: null }]);
});
test('PD-D2 example: the user-stated sleep fact alone is rejected; with independent observations a higher-order plan is formed', () => {
  const c = refCtx();
  c.ownedRefIds['CONVERSATION_TURN:t1'] = true;
  const restated = P({ factors: [F({ conceptKey: 'kA', role: 'subject', valueText: 'around five hours' })], relationText: 'This person tends to sleep around five hours.', supporting: ['o1'], evidenceClass: 'SINGLE_OBSERVATION' });
  assert.equal(ok(one(restated, c)), false);
  const higher = P({ factors: [F({ conceptKey: 'kA', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome', valueText: 'poorer' })], reference: R('u1', 0),
    relationText: 'Poorer session outcomes have followed short-rest periods.', supporting: ['o1', 'o2', 'o3'], evidenceClass: 'RECURRENCE' });
  assert.equal(ok(one(higher, c)), true);
});
test('AC-D38 (U4): at least one supporting observation not owned by user-stated knowledge', () => {
  const c = ctx();
  c.ownedRefIds['CONVERSATION_TURN:t1'] = true;
  assert.equal(one(P({ supporting: ['o1'] }), c).code, 'NO_INDEPENDENT_SUPPORT');
  assert.equal(ok(one(P({ supporting: ['o1', 'o2'], evidenceClass: 'RECURRENCE' }), c)), true);
  assert.equal(one(P({ supporting: ['o1'], contradicting: ['o2'] }), c).code, 'NO_INDEPENDENT_SUPPORT');
  const sup = supCtx();
  sup.ownedRefIds['CONVERSATION_TURN:t2'] = true;
  assert.equal(one(S({ supporting: ['o2'] }), sup).code, 'NO_INDEPENDENT_SUPPORT');
});
test('AC-D39 (U5, structural): mirrors rejected with resolved roots; different signatures and new concepts never rejected', () => {
  const owner = rec('us5', [['cA', 'condition'], ['cB', 'outcome']], { source: 'user_stated', status: 'archived' });
  const c = ctx();
  c.userStatedStructures = [owner];
  assert.equal(one(P(), c).code, 'MIRRORS_USER_STATED');
  const viaMerge = ctx({ roots: { cC: 'cA' } });
  viaMerge.userStatedStructures = [owner];
  assert.equal(one(P({ factors: [F({ conceptKey: 'kC', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] }), viaMerge).code, 'MIRRORS_USER_STATED');
  assert.equal(ok(one(P({ factors: [F({ conceptKey: 'kA', role: 'outcome' }), F({ conceptKey: 'kB', role: 'condition' })] }), c)), true);
  assert.equal(ok(one(P({ factors: [F({ conceptKey: 'kA', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' }), F({ conceptKey: 'kD', role: 'condition' })] }), c)), true);
  assert.equal(ok(one(P({ factors: [F({ newConceptLabel: 'novel cause', role: 'condition' }), F({ conceptKey: 'kB', role: 'outcome' })] }), c)), true);
});

// ═══ §20.2 recurring-window grounding (AC-D56; R-4) ═══
const T = (obsKey, segmentId, field) => ({ kind: 'SOURCE_TIME', obsKey, segmentId, field });
const X = (obsKey, segmentId, text) => ({ kind: 'USER_EXPRESSION', obsKey, segmentId, text });
function stated(obsKey) { return { recurrence: { form: 'STATED', anchors: [X(obsKey, 'user', 'every sunday evening')] }, window: { form: 'STATED', anchors: [X(obsKey, 'user', 'every sunday evening')] } }; }
const RW = (grounding, o) => P(Object.assign({ temporality: 'RECURRING_WINDOW', evidenceClass: 'RECURRENCE', supporting: ['o3', 'o5'], grounding, relationText: 'Late logged meals have recurred within the same evening span.' }, o));
test('AC-D56: one explicit user statement can ground both recurrence and window; any language; literal only', () => {
  const r = one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o6'], grounding: stated('o6'), relationText: 'A weekly routine of preparing food ahead.' }));
  assert.equal(ok(r), true);
  assert.deepEqual(r.plan.claim.grounding.recurrence.anchors[0], { kind: 'USER_EXPRESSION', obsKey: 'o6', segmentId: 'user', value: 'every sunday evening' });
  assert.equal(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o6'],
    grounding: { recurrence: { form: 'STATED', anchors: [X('o6', 'user', 'every weekday morning')] }, window: { form: 'STATED', anchors: [X('o6', 'user', 'every sunday evening')] } } })).code, 'GROUNDING_ANCHOR_INVALID'); // not literal
  const c = ctx();
  c.observations.o6.segments[0].text = 'Cada domingo por la noche preparo la comida.';
  assert.equal(ok(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o6'],
    grounding: { recurrence: { form: 'STATED', anchors: [X('o6', 'user', 'cada domingo')] }, window: { form: 'STATED', anchors: [X('o6', 'user', 'por la noche')] } }, relationText: 'A weekly routine.' }), c)), true);
});
test('AC-D56: observed recurrence needs two distinct anchored items; source-local windows read structural local time only', () => {
  const g = { recurrence: { form: 'OBSERVED', anchors: [T('o3', 'meal1', 'LOCAL_TIME'), T('o5', 'meal1', 'LOCAL_TIME')] }, window: { form: 'SOURCE_LOCAL', anchors: [T('o3', 'meal1', 'LOCAL_TIME'), T('o5', 'meal1', 'LOCAL_TIME')] } };
  const r = one(RW(g));
  assert.equal(ok(r), true);
  assert.deepEqual(r.plan.claim.grounding.window.anchors.map((a) => a.value), ['22:40', '22:55']);
  // one anchored item is not an observed recurrence
  assert.equal(one(RW({ recurrence: { form: 'OBSERVED', anchors: [T('o3', 'meal1', 'LOCAL_TIME')] }, window: g.window })).code, 'GROUNDING_INSUFFICIENT');
  // OBSERVED accepts only source-time anchors
  assert.equal(one(RW({ recurrence: { form: 'OBSERVED', anchors: [T('o3', 'meal1', 'LOCAL_TIME'), X('o6', 'user', 'every sunday')] }, window: g.window }, { supporting: ['o3', 'o5', 'o6'] })).code, 'GROUNDING_INSUFFICIENT');
  // a null structural field never grounds anything (o1 has no local time); date-only grounds calendar meaning
  assert.equal(one(RW({ recurrence: g.recurrence, window: { form: 'SOURCE_LOCAL', anchors: [T('o1', null, 'LOCAL_TIME')] } }, { supporting: ['o3', 'o5', 'o1'] })).code, 'GROUNDING_ANCHOR_INVALID');
  assert.equal(ok(one(RW({ recurrence: { form: 'OBSERVED', anchors: [T('o3', null, 'LOCAL_DATE'), T('o5', null, 'LOCAL_DATE')] }, window: { form: 'SOURCE_LOCAL', anchors: [T('o3', null, 'LOCAL_DATE')] } }))), true);
  // INSTANT cannot ground a local window, and is observation-level only
  assert.equal(one(RW({ recurrence: g.recurrence, window: { form: 'SOURCE_LOCAL', anchors: [T('o1', null, 'INSTANT')] } }, { supporting: ['o3', 'o5', 'o1'] })).code, 'GROUNDING_INSUFFICIENT');
  assert.equal(one(RW({ recurrence: g.recurrence, window: { form: 'SEQUENCE', anchors: [T('o1', 'user', 'INSTANT'), T('o2', null, 'INSTANT')] } }, { supporting: ['o3', 'o5', 'o1', 'o2'] })).code, 'GROUNDING_ANCHOR_INVALID');
});
test('AC-D56: event-relative sequence windows rest on structural order of at least two anchored items', () => {
  const g = { recurrence: { form: 'STATED', anchors: [X('o6', 'user', 'every sunday')] }, window: { form: 'SEQUENCE', anchors: [T('o1', null, 'INSTANT'), T('o2', null, 'INSTANT')] } };
  assert.equal(ok(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'RECURRENCE', supporting: ['o6', 'o1', 'o2'], grounding: g, relationText: 'A follow-on pattern noted after these occasions.' }))), true);
  const single = { recurrence: g.recurrence, window: { form: 'SEQUENCE', anchors: [T('o1', null, 'INSTANT')] } };
  assert.equal(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'RECURRENCE', supporting: ['o6', 'o1'], grounding: single })).code, 'GROUNDING_INSUFFICIENT');
});
test('AC-D56: anchors must point into cited supporting evidence; segments must exist; authorship; duplicates; reserved forms', () => {
  const g = (anchor) => ({ recurrence: { form: 'STATED', anchors: [anchor] }, window: { form: 'STATED', anchors: [X('o6', 'user', 'every sunday')] } });
  const base = { temporality: 'RECURRING_WINDOW', evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o6'] };
  assert.equal(one(P(Object.assign({}, base, { grounding: g(X('o1', 'user', 'four hours')) }))).code, 'GROUNDING_ANCHOR_INVALID'); // uncited
  assert.equal(one(P(Object.assign({}, base, { contradicting: ['o1'], grounding: g(X('o1', 'user', 'four hours')) }))).code, 'GROUNDING_ANCHOR_INVALID'); // contradicting-only
  assert.equal(one(P(Object.assign({}, base, { grounding: g(X('o9', 'user', 'x')) }))).code, 'UNKNOWN_OBSERVATION');
  assert.equal(one(P(Object.assign({}, base, { grounding: g(X('o6', 'nope', 'every sunday')) }))).code, 'GROUNDING_ANCHOR_INVALID'); // unknown segment
  const c = ctx();
  c.observations.o6.segments[0].authorship = 'DEVICE_MEASURED';
  assert.equal(one(P(Object.assign({}, base, { grounding: stated('o6') })), c).code, 'GROUNDING_ANCHOR_INVALID'); // not user words
  assert.equal(one(P(Object.assign({}, base, { grounding: { recurrence: { form: 'STATED', anchors: [X('o6', 'user', 'every sunday'), X('o6', 'user', 'every sunday')] }, window: stated('o6').window } }))).code, 'GROUNDING_ANCHOR_INVALID'); // duplicate
  assert.equal(one(P(Object.assign({}, base, { grounding: { recurrence: { form: 'SOURCE', anchors: [{ kind: 'SOURCE_RECURRENCE', obsKey: 'o6', segmentId: null }] }, window: stated('o6').window } }))).code, 'GROUNDING_FORM_UNAVAILABLE');
  assert.equal(one(P(Object.assign({}, base, { grounding: { recurrence: stated('o6').recurrence, window: { form: 'STATED', anchors: [{ kind: 'SOURCE_RECURRENCE', obsKey: 'o6', segmentId: null }] } } }))).code, 'GROUNDING_FORM_UNAVAILABLE');
});
test('AC-D56: time is never read from data labels — a time held only in data grounds nothing', () => {
  const c = ctx();
  c.observations.o3.segments[0].localTime = null; // as if the adapter left the time only inside data
  const g = { recurrence: { form: 'OBSERVED', anchors: [T('o3', 'meal1', 'LOCAL_TIME'), T('o5', 'meal1', 'LOCAL_TIME')] }, window: { form: 'SOURCE_LOCAL', anchors: [T('o5', 'meal1', 'LOCAL_TIME')] } };
  assert.equal(one(RW(g), c).code, 'GROUNDING_ANCHOR_INVALID');
});

// ═══ preVerify — isolation, ordering, frozen plans (§15.3, §16.1-§16.4) ═══
test('preVerify: malformed entries are rejected alone; every result keeps its output index; plans are frozen trusted data', () => {
  const c = appendCtx();
  const out = Gate.preVerify([
    { index: 0, ok: true, proposal: P() },
    { index: 1, ok: false, operation: 'APPEND_EVIDENCE' },
    { index: 2, ok: true, proposal: A({ observations: ['o1'] }) },
    { index: 3, ok: true, proposal: A() },
    { index: 4, ok: true, proposal: P({ supporting: ['o9'] }) }
  ], c);
  assert.deepEqual(out.map((x) => [x.index, x.outcome, x.code]), [[0, 'PLAN', null], [1, 'REJECTED', 'MALFORMED_PROPOSAL'], [2, 'NO_CHANGE', 'NO_CHANGE'], [3, 'PLAN', null], [4, 'REJECTED', 'UNKNOWN_OBSERVATION']]);
  assert.equal(out[1].operation, 'APPEND_EVIDENCE');
  assert.equal(Object.isFrozen(out[0].plan), true);
  assert.equal(Object.isFrozen(out[0].plan.draft.evidence.supporting[0]), true);
  assert.equal(out[3].plan.index, 3);
  assert.throws(() => { 'use strict'; out[3].plan.refs.push({}); });
});

// ═══ §16.5 post-verification authorization (AC-D60, AC-D61, AC-D62, AC-D65; R-2) ═══
const PASS = { restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'FAITHFUL', direction: 'NOT_APPLICABLE' };
const PASS_APPEND = { restatement: 'NOT_RESTATED', unsupported: 'NOT_APPLICABLE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'NOT_APPLICABLE', direction: 'CONSISTENT' };
function plansFor(proposals, c) { return Gate.preVerify(proposals.map((p, i) => ({ index: i, ok: true, proposal: p })), c || ctx()).filter((x) => x.plan).map((x) => x.plan); }
function verdicts(list) { const v = {}; list.forEach((t, i) => { if (t !== undefined) v['p' + (i + 1)] = t === 'MALFORMED' ? { ok: false } : { ok: true, tokens: t }; }); return { status: 'OK', verdicts: v }; }

test('AC-D60: only the passing value of every applicable dimension authorizes; UNCERTAIN never passes; the code follows the fixed order', () => {
  const plans = plansFor([P(), P({ relationText: 'Another association.' })]);
  const a = Gate.authorizePlans(plans, verdicts([PASS, Object.assign({}, PASS, { restatement: 'UNCERTAIN', temporal: 'UNFAITHFUL' })]));
  assert.deepEqual(a.decisions.map((d) => [d.outcome, d.code]), [['AUTHORIZED', null], ['REJECTED', 'RESTATEMENT_UNCERTAIN']]);
  assert.deepEqual(a.decisions[1].verification, Object.assign({}, PASS, { restatement: 'UNCERTAIN', temporal: 'UNFAITHFUL' })); // all tokens reported
  for (const [dim, bad, code] of [['safety', 'SAFETY_ADJACENT', 'SAFETY_VETO'], ['safety', 'UNCERTAIN', 'SAFETY_UNCERTAIN'], ['restatement', 'RESTATED', 'RESTATED'],
    ['unsupported', 'PRESENT', 'UNSUPPORTED_CONTENT'], ['unsupported', 'UNCERTAIN', 'UNSUPPORTED_UNCERTAIN'], ['temporal', 'UNFAITHFUL', 'TEMPORAL_UNFAITHFUL'],
    ['temporal', 'UNCERTAIN', 'TEMPORAL_UNCERTAIN']]) {
    const d = Gate.authorizePlans(plansFor([P()]), verdicts([Object.assign({}, PASS, { [dim]: bad })])).decisions[0];
    assert.deepEqual([d.outcome, d.code], ['REJECTED', code], dim + '=' + bad);
  }
  // safety is reported first when several dimensions fail
  assert.equal(Gate.authorizePlans(plansFor([P()]), verdicts([Object.assign({}, PASS, { restatement: 'RESTATED', safety: 'UNCERTAIN' })])).decisions[0].code, 'SAFETY_UNCERTAIN');
});
test('AC-D60 / AC-D65: APPEND is authorized only with a CONSISTENT direction, a non-restating target claim and no Safety adjacency', () => {
  const c = appendCtx();
  const plans = plansFor([A()], c);
  assert.equal(Gate.authorizePlans(plans, verdicts([PASS_APPEND])).decisions[0].outcome, 'AUTHORIZED');
  for (const [dim, bad, code] of [['direction', 'INCONSISTENT', 'DIRECTION_INCONSISTENT'], ['direction', 'UNCERTAIN', 'DIRECTION_UNCERTAIN'],
    ['restatement', 'RESTATED', 'RESTATED'], ['safety', 'SAFETY_ADJACENT', 'SAFETY_VETO'], ['safety', 'UNCERTAIN', 'SAFETY_UNCERTAIN']]) {
    const d = Gate.authorizePlans(plans, verdicts([Object.assign({}, PASS_APPEND, { [dim]: bad })])).decisions[0];
    assert.deepEqual([d.outcome, d.code], ['REJECTED', code], dim + '=' + bad);
  }
});
test('§15.6: a failed Verifier rejects every plan; a missing or malformed item rejects only its own plan', () => {
  const plans = plansFor([P(), P({ relationText: 'Second.' }), P({ relationText: 'Third.' })]);
  const failed = Gate.authorizePlans(plans, { status: 'FAILED' });
  assert.deepEqual(failed.decisions.map((d) => d.code), ['VERIFICATION_UNAVAILABLE', 'VERIFICATION_UNAVAILABLE', 'VERIFICATION_UNAVAILABLE']);
  assert.equal(plans.some((p) => failed.permits(p)), false);
  const mixed = Gate.authorizePlans(plans, verdicts([PASS, 'MALFORMED', undefined]));
  assert.deepEqual(mixed.decisions.map((d) => [d.outcome, d.code]), [['AUTHORIZED', null], ['REJECTED', 'VERIFICATION_MALFORMED'], ['REJECTED', 'VERIFICATION_MISSING']]);
  assert.equal(Gate.authorizePlans(plans, null).decisions[0].code, 'VERIFICATION_UNAVAILABLE');
});
test('AC-D61: at most one SUPERSEDE per target; an APPEND to any SUPERSEDE target is rejected in either order', () => {
  const c = supCtx();
  const sup1 = S();
  const sup2 = S({ relationText: 'Another revision of the same candidate.' });
  const app = A();
  // APPEND before SUPERSEDE, then a second SUPERSEDE of the same target
  const plans = plansFor([app, sup1, sup2], c);
  const a = Gate.authorizePlans(plans, verdicts([PASS_APPEND, PASS, PASS]));
  assert.deepEqual(a.decisions.map((d) => [d.operation, d.outcome, d.code]), [
    ['APPEND_EVIDENCE', 'REJECTED', 'TARGET_CONFLICT_IN_PASS'], ['SUPERSEDE', 'AUTHORIZED', null], ['SUPERSEDE', 'REJECTED', 'TARGET_CONFLICT_IN_PASS']]);
  // a SUPERSEDE rejected by the Verifier does not block an APPEND to its target
  const b = Gate.authorizePlans(plansFor([app, sup1], c), verdicts([PASS_APPEND, Object.assign({}, PASS, { restatement: 'RESTATED' })]));
  assert.deepEqual(b.decisions.map((d) => d.outcome), ['AUTHORIZED', 'REJECTED']);
});
test('AC-D61 / AC-D29: the per-pass new-concept cap is applied after verification, in output order, over distinct labels', () => {
  const mk = (labels) => P({ factors: labels.map((l, i) => F({ newConceptLabel: l, role: i ? 'outcome' : 'condition' })), relationText: 'Assoc ' + labels.join(' ') });
  const plans = plansFor([mk(['a1', 'a2', 'a3', 'a4']), mk(['a1', 'a5', 'a6', 'a7']), mk(['a8', 'a2']), mk(['a9', 'a10'])]);
  const all = Gate.authorizePlans(plans, verdicts([PASS, PASS, PASS, PASS]));
  assert.deepEqual(all.decisions.map((d) => d.code), [null, null, null, 'NEW_CONCEPT_LIMIT']);
  // a plan the Verifier rejects never consumes another plan's budget
  const vetoFirst = Gate.authorizePlans(plans, verdicts([Object.assign({}, PASS, { unsupported: 'PRESENT' }), PASS, PASS, PASS]));
  assert.deepEqual(vetoFirst.decisions.map((d) => d.code), ['UNSUPPORTED_CONTENT', null, null, null]);
});
test('AC-D62: authorization is the only grant of execution — per pass, per plan object; the Verifier output cannot change a plan', () => {
  const plans = plansFor([P(), P({ relationText: 'Second.' })]);
  const a = Gate.authorizePlans(plans, verdicts([PASS, Object.assign({}, PASS, { safety: 'SAFETY_ADJACENT' })]));
  assert.equal(a.permits(plans[0]), true);
  assert.equal(a.permits(plans[1]), false);
  assert.equal(a.decisions[1].plan, null); // a rejected decision carries no plan to execute
  assert.equal(a.permits(JSON.parse(JSON.stringify(plans[0]))), false); // an equal copy is not authorized
  const other = Gate.authorizePlans(plansFor([P()]), verdicts([PASS]));
  assert.equal(other.permits(plans[0]), false); // another pass's authorization never grants this plan
  assert.equal(Object.isFrozen(a.decisions[0]), true);
  // extra fields in a verdict entry are never read into the decision
  const extra = Gate.authorizePlans(plansFor([P()]), { status: 'OK', verdicts: { p1: { ok: true, tokens: Object.assign({ target: 'r9', draft: {} }, PASS) } } });
  assert.deepEqual(Object.keys(extra.decisions[0].verification).sort(), ['direction', 'restatement', 'safety', 'temporal', 'unsupported']);
  assert.equal(extra.decisions[0].plan.draft.relationDescription, plans[0].draft.relationDescription);
});
