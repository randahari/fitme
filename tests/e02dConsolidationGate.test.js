// WP0 Phase E.0.2d — Consolidation Gate: deterministic admission rules
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §16-§24; AC-D12 … AC-D29, AC-D35, AC-D37,
// AC-D53). Pure gate tests over hand-built pass contexts; no model, no store, no port.
// Run with: node --test tests/e02dConsolidationGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const Gate = require(path.join(ROOT, 'js/coachDecisionSystem/consolidationGate.js'));
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));

function F(o) { return Object.assign({ conceptId: null, newConceptLabel: null, role: 'subject', valueText: null, userStatedRef: null }, o); }
function P(o) {
  return Object.assign({ operation: 'CREATE', targetRecordId: null, appendList: null, factors: [F({ conceptId: 'cA', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })],
    relationText: 'Weaker sessions have followed the shorter nights noted here.', evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE',
    supporting: ['o1'], contradicting: [], restatesUserStatement: false, safetyAdjacent: false }, o);
}
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
function ctx(over) {
  const roots = Object.assign({ cA: 'cA', cB: 'cB', cC: 'cC', cD: 'cD' }, (over && over.roots) || {});
  const base = {
    observations: {
      o1: { ref: ref('CONVERSATION_TURN', 't1'), refId: 'CONVERSATION_TURN:t1', observedAt: 1000, userTexts: ['I slept four hours and the session dragged on forever.'] },
      o2: { ref: ref('CONVERSATION_TURN', 't2'), refId: 'CONVERSATION_TURN:t2', observedAt: 2000, userTexts: ['Barely rested again last night.'] },
      o3: { ref: ref('DAY_LOG', '2026-03-03'), refId: 'DAY_LOG:2026-03-03', observedAt: null, userTexts: [] },
      o4: { ref: ref('CONVERSATION_TURN', 't4'), refId: 'CONVERSATION_TURN:t4', observedAt: 4000, userTexts: ['Felt fine.'] }
    },
    presentedConcepts: [{ conceptId: 'cA', labels: ['rest'] }, { conceptId: 'cB', labels: ['session quality'] }, { conceptId: 'cC', labels: ['evening'] }, { conceptId: 'cD', labels: ['meal timing'] }],
    rootOf: (id) => (Object.prototype.hasOwnProperty.call(roots, id) ? roots[id] : 'unresolved:' + id),
    fitmeRecords: {},
    references: {},
    userStatedStructures: [],
    ownedRefIds: {},
    ownersByRefId: {}
  };
  return Object.assign(base, over || {}, { rootOf: base.rootOf });
}
const one = (p, c) => Gate.evaluateOne(p, c || ctx());

// ═══ G1 / AC-D28 — declared restatement and Safety adjacency fail closed ═══
test('AC-D28: restatesUserStatement and safetyAdjacent must be exactly false', () => {
  assert.equal(one(P({ restatesUserStatement: true })).code, 'DECLARED_RESTATEMENT');
  assert.equal(one(P({ restatesUserStatement: undefined })).code, 'DECLARED_RESTATEMENT');
  assert.equal(one(P({ restatesUserStatement: 'false' })).code, 'DECLARED_RESTATEMENT');
  assert.equal(one(P({ safetyAdjacent: true })).code, 'SAFETY_ADJACENT_PROPOSAL');
  assert.equal(one(P({ safetyAdjacent: null })).code, 'SAFETY_ADJACENT_PROPOSAL');
  assert.equal(one(P({ safetyAdjacent: 0 })).code, 'SAFETY_ADJACENT_PROPOSAL');
  assert.equal(one(P()).admitted, true);
});

// ═══ G2 / G6 ═══
test('G2: cited observations must be presented, distinct and in one list only', () => {
  assert.equal(one(P({ supporting: ['o9'] })).code, 'UNKNOWN_OBSERVATION');
  assert.equal(one(P({ supporting: ['o1', 'o1'], evidenceClass: 'RECURRENCE' })).code, 'INVALID_EVIDENCE');
  assert.equal(one(P({ supporting: ['o1'], contradicting: ['o1'] })).code, 'INVALID_EVIDENCE');
});
test('AC-D35: a cited kind outside V1 (Habit/Pattern or any other) is SOURCE_NOT_IN_SCOPE', () => {
  for (const kind of ['HABIT_RECORD', 'PATTERN_RECORD', 'TYPED_MEMORY_RECORD', 'USER_KNOWLEDGE_RECORD']) {
    const c = ctx();
    c.observations.o9 = { ref: ref(kind, 'x1'), refId: kind + ':x1', observedAt: null, userTexts: [] };
    assert.equal(one(P({ supporting: ['o9'] }), c).code, 'SOURCE_NOT_IN_SCOPE', kind);
  }
});

// ═══ C1 – C5 (AC-D12 … AC-D16) ═══
test('AC-D12 (C1): CREATE requires null target/appendList and non-null text, class, temporality', () => {
  assert.equal(one(P({ appendList: 'supporting' })).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(P({ relationText: null })).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(P({ evidenceClass: null })).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(P({ temporality: null })).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(P({ targetRecordId: 'r1' })).code, 'INVALID_OPERATION_SHAPE');
});
test('AC-D13 (C2): evidence-class counts over supporting observations only', () => {
  assert.equal(one(P({ supporting: [] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(P({ evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o1', 'o2'] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(P({ evidenceClass: 'SINGLE_OBSERVATION', supporting: ['o1'] })).admitted, true);
  assert.equal(one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1'] })).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1', 'o2'] })).admitted, true);
  assert.equal(one(P({ evidenceClass: 'CO_OCCURRENCE', supporting: ['o1'], contradicting: ['o2'] })).admitted, true);
});
test('AC-D14 (C3): RECURRING_WINDOW requires RECURRENCE; DURABLE and TEMPORARY are open', () => {
  assert.equal(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'CO_OCCURRENCE' })).code, 'TEMPORALITY_MISMATCH');
  assert.equal(one(P({ temporality: 'RECURRING_WINDOW', evidenceClass: 'RECURRENCE', supporting: ['o1', 'o2'] })).admitted, true);
  const tmp = one(P({ temporality: 'TEMPORARY' }));
  assert.equal(tmp.admitted, true);
  assert.equal(Object.prototype.hasOwnProperty.call(tmp.plan.draft, 'expiresAt'), false); // §20: expiresAt null
});
test('AC-D15 (C4): a CREATE identical in content to a presented FITME record is DUPLICATE_OF_PRESENTED', () => {
  const p = P();
  const c = ctx();
  const content = C.materializeContent({ factors: [{ conceptId: 'cA', role: 'condition', valueDescription: null }, { conceptId: 'cB', role: 'outcome', valueDescription: null }], relationDescription: p.relationText }, () => null);
  c.fitmeRecords.r1 = Object.assign(rec('r1', [['cA', 'condition'], ['cB', 'outcome']]), { relationDescription: content.relationDescription });
  assert.equal(one(p, c).code, 'DUPLICATE_OF_PRESENTED');
  assert.equal(one(P({ relationText: 'A different associative wording for these factors.' }), c).admitted, true);
});
test('AC-D16 (C5): same structure as a presented candidate is admitted as CREATE (uncertainty prefers CREATE)', () => {
  const c = ctx();
  c.fitmeRecords.r1 = rec('r1', [['cA', 'condition'], ['cB', 'outcome']], { rel: 'Some other existing wording.' });
  const r = one(P(), c);
  assert.equal(r.admitted, true);
  assert.equal(r.plan.operation, 'CREATE');
});
test('§17: the CREATE plan fixes every field the model may not choose', () => {
  const r = one(P({ evidenceClass: 'RECURRENCE', supporting: ['o1', 'o3'], contradicting: ['o2'] }));
  const d = r.plan.draft;
  assert.equal(d.confidence, 0);
  assert.equal(d.source, 'inferred_pattern');
  assert.equal(d.safetyFlag, 'STANDARD');
  assert.equal(one(P()).plan.draft.source, 'inferred_event');
  assert.deepEqual(d.evidence.supporting, [{ kind: 'CONVERSATION_TURN', ref: 't1', observedAt: 1000 }, { kind: 'DAY_LOG', ref: '2026-03-03', observedAt: null }]);
  assert.deepEqual(d.evidence.contradicting, [{ kind: 'CONVERSATION_TURN', ref: 't2', observedAt: 2000 }]);
  assert.deepEqual(Object.keys(d).sort(), ['confidence', 'evidence', 'evidenceClass', 'factors', 'relationDescription', 'safetyFlag', 'source', 'temporality']);
});

// ═══ A1 – A5 (AC-D17 … AC-D21) ═══
function appendCtx() {
  const c = ctx();
  c.fitmeRecords.r1 = rec('r1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  return c;
}
const A = (o) => P(Object.assign({ operation: 'APPEND_EVIDENCE', targetRecordId: 'r1', appendList: 'supporting', relationText: null, evidenceClass: null, temporality: null, supporting: ['o2'] }, o));
test('AC-D17 (A1): the target must be a presented FITME-sourced record — never user-stated, never unknown', () => {
  const c = appendCtx();
  assert.equal(one(A(), c).admitted, true);
  assert.equal(one(A({ targetRecordId: 'nope' }), c).code, 'INVALID_TARGET');
  assert.equal(one(A({ targetRecordId: null }), c).code, 'INVALID_TARGET');
  c.references.u1 = { type: 'USER_KNOWLEDGE', recordRef: ref('USER_KNOWLEDGE_RECORD', 'us1'), roots: ['cA'], texts: [], claimedRefIds: [] };
  assert.equal(one(A({ targetRecordId: 'us1' }), c).code, 'INVALID_TARGET');
});
test('AC-D18 (A2): append shape — one non-empty list, no text, class, temporality, new concept or reference', () => {
  const c = appendCtx();
  assert.equal(one(A({ appendList: null }), c).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(A({ relationText: 'x' }), c).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(A({ evidenceClass: 'CO_OCCURRENCE' }), c).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(A({ supporting: ['o2'], contradicting: ['o3'] }), c).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(A({ appendList: 'contradicting', supporting: ['o2'] }), c).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(A({ factors: [F({ conceptId: 'cA', role: 'condition' }), F({ newConceptLabel: 'novel thing', role: 'outcome' })] }), c).code, 'INVALID_OPERATION_SHAPE');
  const ok = one(A({ appendList: 'contradicting', supporting: [], contradicting: ['o2'] }), c);
  assert.equal(ok.admitted, true);
  assert.equal(ok.plan.list, 'contradicting');
});
test('AC-D19 (A3): structural identity uses merge-resolved roots', () => {
  const c = appendCtx();
  assert.equal(one(A({ factors: [F({ conceptId: 'cA', role: 'outcome' }), F({ conceptId: 'cB', role: 'condition' })] }), c).code, 'STRUCTURE_MISMATCH');
  assert.equal(one(A({ factors: [F({ conceptId: 'cC', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] }), c).code, 'STRUCTURE_MISMATCH');
  const merged = ctx({ roots: { cC: 'cA' } }); // cC merged into cA
  merged.fitmeRecords.r1 = rec('r1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  assert.equal(one(A({ factors: [F({ conceptId: 'cC', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] }), merged).admitted, true);
});
test('AC-D20 (A4): two presented records with the same signature make the target ambiguous', () => {
  const c = appendCtx();
  c.fitmeRecords.r2 = rec('r2', [['cA', 'condition'], ['cB', 'outcome']], { rel: 'A second, opposite formulation.' });
  assert.equal(one(A(), c).code, 'AMBIGUOUS_TARGET');
  // Same signature, opposite meaning: structure cannot tell — documented calibration residual (CAL-D2).
});
test('AC-D21 (A5): nothing new to attach is NO_CHANGE; list bound respected', () => {
  const c = appendCtx();
  const r = one(A({ supporting: ['o1'] }), c);
  assert.equal(r.admitted, false);
  assert.equal(r.outcome, 'NO_CHANGE');
  const full = appendCtx();
  full.fitmeRecords.r1.evidence.supporting = Array.from({ length: 64 }, (_, i) => ({ refId: 'CONVERSATION_TURN:z' + i }));
  assert.equal(one(A(), full).code, 'LIST_TOO_LONG');
  assert.deepEqual(one(A({ supporting: ['o1', 'o2'] }), appendCtx()).plan.refs, [{ kind: 'CONVERSATION_TURN', ref: 't2', observedAt: 2000 }]);
});

// ═══ S1 – S5 (AC-D22 … AC-D26) ═══
function supCtx(status) {
  const c = ctx();
  c.fitmeRecords.r1 = rec('r1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'], status: status || 'candidate' });
  return c;
}
const S = (o) => P(Object.assign({ operation: 'SUPERSEDE', targetRecordId: 'r1', relationText: 'A revised association resting on newer observations.', supporting: ['o2'] }, o));
test('AC-D22 (S1): only a presented FITME candidate may be superseded — never active, never user-stated', () => {
  assert.equal(one(S(), supCtx()).admitted, true);
  assert.equal(one(S(), supCtx('active')).code, 'INVALID_TARGET');
  assert.equal(one(S({ targetRecordId: 'us1' }), supCtx()).code, 'INVALID_TARGET');
});
test('AC-D23 (S2): the successor is validated as a CREATE (C1–C3)', () => {
  assert.equal(one(S({ relationText: null }), supCtx()).code, 'INVALID_OPERATION_SHAPE');
  assert.equal(one(S({ evidenceClass: 'RECURRENCE' }), supCtx()).code, 'EVIDENCE_CLASS_MISMATCH');
  assert.equal(one(S({ temporality: 'RECURRING_WINDOW' }), supCtx()).code, 'TEMPORALITY_MISMATCH');
});
test('AC-D24 (S3): an identical successor is SUPERSEDE_IDENTICAL', () => {
  const c = supCtx();
  const p = S();
  c.fitmeRecords.r1.relationDescription = C.normalizeText(p.relationText);
  assert.equal(one(p, c).code, 'SUPERSEDE_IDENTICAL');
});
test('AC-D25 (S4): the successor must share a root concept with the target', () => {
  assert.equal(one(S({ factors: [F({ conceptId: 'cC', role: 'condition' }), F({ conceptId: 'cD', role: 'outcome' })] }), supCtx()).code, 'SUPERSEDE_UNRELATED');
  const merged = ctx({ roots: { cC: 'cA' } });
  merged.fitmeRecords.r1 = rec('r1', [['cA', 'condition'], ['cB', 'outcome']], { on: ['CONVERSATION_TURN:t1'] });
  assert.equal(one(S({ factors: [F({ conceptId: 'cC', role: 'condition' }), F({ conceptId: 'cD', role: 'outcome' })] }), merged).admitted, true);
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
  assert.equal(one(P({ relationText: below })).admitted, true);
  assert.equal(one(P({ relationText: 'Prefix ' + user + ' suffix.' })).code, 'LITERAL_RESTATEMENT');
  assert.equal(one(P({ relationText: 'Something unrelated.', factors: [F({ conceptId: 'cA', role: 'condition', valueText: 'SLEPT   FOUR HOURS AND THE SESSION' }), F({ conceptId: 'cB', role: 'outcome' })] })).code, 'LITERAL_RESTATEMENT');
  // contradicting list is part of U as well
  assert.equal(one(P({ supporting: ['o4'], contradicting: ['o1'], relationText: 'Note: slept four hours and the session.' })).code, 'LITERAL_RESTATEMENT');
  // NFC normalization: composed vs decomposed accents compare equal
  const c = ctx();
  c.observations.o4.userTexts = ['Café visits always leave me restless for hours'];
  assert.equal(one(P({ supporting: ['o4'], relationText: 'Café visits always leave me restless here' }), c).code, 'LITERAL_RESTATEMENT');
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

// ═══ §19 concept rules (AC-D29) ═══
test('AC-D29: presented membership, shadowing, per-proposal and per-pass caps, in-pass label dedup', () => {
  assert.equal(one(P({ factors: [F({ conceptId: 'cZ', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] })).code, 'UNKNOWN_CONCEPT');
  assert.equal(one(P({ factors: [F({ newConceptLabel: '  REST ', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] })).code, 'NEW_CONCEPT_SHADOWS_PRESENTED');
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', newConceptLabel: 'both', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] })).code, 'INVALID_FACTOR');
  const five = ['n1', 'n2', 'n3', 'n4', 'n5'].map((l, i) => F({ newConceptLabel: 'novel ' + l, role: i === 0 ? 'condition' : 'outcome' }));
  assert.equal(one(P({ factors: five })).code, 'NEW_CONCEPT_LIMIT');
  const dup = one(P({ factors: [F({ newConceptLabel: 'Novel Thing', role: 'condition' }), F({ newConceptLabel: 'novel  thing', role: 'outcome' })] }));
  assert.equal(dup.admitted, true);
  assert.equal(dup.plan.newConceptLabels.length, 1);
  // per-pass cap of 8 distinct new labels; equal labels across proposals count once
  const mk = (labels) => P({ factors: labels.map((l, i) => F({ newConceptLabel: l, role: i ? 'outcome' : 'condition' })) });
  const results = Gate.evaluate([mk(['a1', 'a2', 'a3', 'a4']), mk(['a1', 'a5', 'a6', 'a7']), mk(['a8', 'a2']), mk(['a9', 'a10'])], ctx());
  assert.deepEqual(results.map((r) => r.admitted), [true, true, true, false]);
  assert.equal(results[3].code, 'NEW_CONCEPT_LIMIT');
});

// ═══ U1 – U5 at gate level (AC-D37, AC-D38, AC-D39 structural cases) ═══
function refCtx() {
  const c = ctx();
  c.references.u1 = { type: 'USER_KNOWLEDGE', recordRef: ref('USER_KNOWLEDGE_RECORD', 'us1'), roots: ['cA'], texts: ['I usually sleep around five hours'], claimedRefIds: ['CONVERSATION_TURN:t9'] };
  c.references.u2 = { type: 'TYPED_MEMORY', recordRef: ref('TYPED_MEMORY_RECORD', 'tm1'), roots: [], texts: ['I prefer evening sessions'], claimedRefIds: ['CONVERSATION_TURN:t8'] };
  c.userStatedStructures = [rec('us1', [['cA', 'subject', 'around five hours']], { source: 'user_stated', status: 'active' })];
  return c;
}
test('AC-D37 (U1–U3): single presented reference, reference form, executor-added evidence, structural novelty', () => {
  const c = refCtx();
  const good = P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cB', role: 'outcome' })], supporting: ['o1', 'o2'], evidenceClass: 'RECURRENCE' });
  const r = one(good, c);
  assert.equal(r.admitted, true);
  assert.deepEqual(r.plan.draft.evidence.supporting.slice(-1), [{ kind: 'USER_KNOWLEDGE_RECORD', ref: 'us1', observedAt: null }]);
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cB', role: 'outcome', userStatedRef: 'u2' })] }), c).code, 'USER_STATED_REFERENCE_INVALID');
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u7' }), F({ conceptId: 'cB', role: 'outcome' })] }), c).code, 'USER_STATED_REFERENCE_INVALID');
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1', valueText: 'five hours' }), F({ conceptId: 'cB', role: 'outcome' })] }), c).code, 'USER_STATED_REFERENCE_INVALID');
  assert.equal(one(P({ factors: [F({ conceptId: 'cB', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cC', role: 'outcome' })] }), c).code, 'USER_STATED_REFERENCE_INVALID'); // not the record's own concept
  assert.equal(one(P({ factors: [F({ newConceptLabel: 'about five hours', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cB', role: 'outcome' })] }), c).code, 'USER_STATED_REFERENCE_INVALID'); // not literal
  const literalNew = one(P({ factors: [F({ newConceptLabel: 'around five hours', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cB', role: 'outcome' })], supporting: ['o1'] }), c);
  assert.equal(literalNew.admitted, true);
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1' })] }), c).code, 'NO_NEW_MEANING');
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cA', role: 'outcome' })] }), c).code, 'NO_NEW_MEANING');
  const tm = one(P({ factors: [F({ conceptId: 'cC', role: 'condition', userStatedRef: 'u2' }), F({ conceptId: 'cB', role: 'outcome' })] }), c);
  assert.equal(tm.admitted, true);
  assert.deepEqual(tm.plan.draft.evidence.supporting.slice(-1), [{ kind: 'TYPED_MEMORY_RECORD', ref: 'tm1', observedAt: null }]);
});
test('PD-D2 example: the user-stated sleep fact alone is rejected; with independent observations a higher-order candidate is admissible', () => {
  const c = refCtx();
  c.ownedRefIds['CONVERSATION_TURN:t1'] = true; // the observation where the fact was stated
  const restated = P({ factors: [F({ conceptId: 'cA', role: 'subject', valueText: 'around five hours' })], relationText: 'This person tends to sleep around five hours.', supporting: ['o1'], evidenceClass: 'SINGLE_OBSERVATION' });
  assert.equal(one(restated, c).admitted, false);
  const higher = P({ factors: [F({ conceptId: 'cA', role: 'condition', userStatedRef: 'u1' }), F({ conceptId: 'cB', role: 'outcome', valueText: 'poorer' })],
    relationText: 'Poorer session outcomes have followed short-rest periods.', supporting: ['o1', 'o2', 'o3'], evidenceClass: 'RECURRENCE' });
  assert.equal(one(higher, c).admitted, true);
});
test('AC-D38 (U4): at least one supporting observation not owned by user-stated knowledge', () => {
  const c = ctx();
  c.ownedRefIds['CONVERSATION_TURN:t1'] = true;
  assert.equal(one(P({ supporting: ['o1'] }), c).code, 'NO_INDEPENDENT_SUPPORT');
  assert.equal(one(P({ supporting: ['o1', 'o2'], evidenceClass: 'RECURRENCE' }), c).admitted, true);
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
  assert.equal(one(P({ factors: [F({ conceptId: 'cC', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] }), viaMerge).code, 'MIRRORS_USER_STATED');
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'outcome' }), F({ conceptId: 'cB', role: 'condition' })] }), c).admitted, true); // roles differ
  assert.equal(one(P({ factors: [F({ conceptId: 'cA', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' }), F({ conceptId: 'cD', role: 'condition' })] }), c).admitted, true); // factor count differs
  assert.equal(one(P({ factors: [F({ newConceptLabel: 'novel cause', role: 'condition' }), F({ conceptId: 'cB', role: 'outcome' })] }), c).admitted, true); // new concept is its own root
});
