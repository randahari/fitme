// USI-001 — deterministic intake gate (docs/specs/USI_001_SPEC_v1.0.md §15-§17; AC-18 … AC-26,
// AC-30, AC-31, AC-38, AC-43, AC-44 (dynamic), AC-45 … AC-52). Pure, synchronous; synthetic
// presented concepts/records built by hand (shape as stored by E.0.2c).
// Run with: node --test tests/usi001Gate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const G = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeGate.js'));
const C = require(path.join(__dirname, '../js/coachDecisionSystem/userKnowledgeContract.js'));

const TURN_ID = 'g-turn-1';
function concept(id, labels) { return { conceptId: id, labels, updatedAt: 1, mergedInto: null }; }
function record(id, conceptIds, opts) {
  const o = opts || {};
  return {
    recordId: id, status: o.status || 'active', source: o.source || 'user_stated', safetyFlag: o.safetyFlag || 'STANDARD',
    factors: conceptIds.map((c, i) => ({ conceptId: c, role: o.roles ? o.roles[i] : 'subject', valueDescription: null })),
    conceptIds: conceptIds.slice().sort(), relationDescription: o.relation || ('relation of ' + id),
    provenance: { producer: 'p', producerVersion: '1', originTurnId: o.origin || 'old-turn' },
    evidence: { supporting: (o.support || []).map((ref) => ({ kind: 'CONVERSATION_TURN', ref })), contradicting: [], confoundsConsidered: [], confoundCheck: null },
    updatedAt: 1
  };
}
function proposal(o) {
  return Object.assign({ operation: 'NEW', targetRecordIds: [], requestText: null, referenceText: null, referenceKind: null, statementText: null, factors: [], temporality: 'DURABLE', confoundText: null, safetyAdjacent: false }, o);
}
function factor(o) { return Object.assign({ conceptId: null, newConceptLabel: null, mentionText: null, role: 'subject', valueText: null, cpiReference: false }, o); }
const nf = (label, role) => factor({ newConceptLabel: label, mentionText: label, role: role || 'subject' });
function mut(op, target, req, ref, kind, extra) {
  return proposal(Object.assign({ operation: op, targetRecordIds: [target], requestText: req, referenceText: ref, referenceKind: kind, temporality: null }, extra || {}));
}
const NONE = { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: false, anchor: { valid: false, text: null }, gateReason: null, authorized: false } };
function cpiRec(text, authorized) { return { safety: { available: true, ownedSpans: [] }, cpi: { available: true, recognized: true, anchor: { valid: true, text }, gateReason: authorized === false ? 'CONSENT_ABSENT' : 'OK', authorized: authorized !== false } }; }
function safetyRec(spans) { return { safety: { available: true, ownedSpans: spans }, cpi: NONE.cpi }; }

function run(text, proposals, opts) {
  const o = opts || {};
  return G.evaluate({
    proposals, turn: { turnId: TURN_ID, text },
    presentedConcepts: o.concepts || WORLD.concepts, presentedRecords: o.records || WORLD.records,
    recognition: o.recognition || NONE, recentConversationContext: o.rcc === undefined ? null : o.rcc
  });
}
const codes = (out) => out.results.map((r) => (r.status === 'ACCEPTED' ? 'ACCEPTED' : r.code));

// knee/sleep/coffee world (§28 15a)
const WORLD = {
  concepts: [concept('cKnee', ['knee']), concept('cSleep', ['sleep']), concept('cCoffee', ['coffee']), concept('cStairs', ['stairs']), concept('cKi', ['ki'])],
  records: [record('R1', ['cKnee']), record('R2', ['cSleep']), record('R3', ['cCoffee'])]
};
const FK = 'Forget what I told you about my knee';

// ═══ AC-18 — output bounds and target counts ═══
test('AC-18: more than 3 proposals → the excess is INVALID_SHAPE; more than 6 factors → INVALID_SHAPE; target count other than exactly 1 (mutations) / 0 (NEW) → INVALID_SHAPE', () => {
  const t = 'a b c d e f g h';
  const ok = proposal({ statementText: 'a b', factors: [nf('a')] });
  assert.deepEqual(codes(run(t, [ok, ok, ok, ok, ok])), ['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'INVALID_SHAPE', 'INVALID_SHAPE']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'a', factors: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => nf(x)) })])), ['INVALID_SHAPE']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'a', factors: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => nf(x)) })])), ['ACCEPTED']);
  assert.deepEqual(codes(run(FK, [proposal({ operation: 'FORGET', targetRecordIds: [], requestText: FK, referenceText: 'my knee', referenceKind: 'NAMED', temporality: null })])), ['INVALID_SHAPE']);
  assert.deepEqual(codes(run(FK, [proposal({ operation: 'FORGET', targetRecordIds: ['R1', 'R3'], requestText: FK, referenceText: 'my knee', referenceKind: 'NAMED', temporality: null })])), ['INVALID_SHAPE']);
  assert.deepEqual(codes(run(t, [proposal({ targetRecordIds: ['R1'], statementText: 'a', factors: [nf('a')] })])), ['INVALID_SHAPE']);
});

test('§15.1: exact keys, closed values and per-operation null rules are enforced (INVALID_SHAPE), never repaired', () => {
  const t = 'I like quiet mornings at the lake';
  const base = proposal({ statementText: 'I like quiet mornings', factors: [nf('quiet mornings')] });
  const bad = [
    Object.assign({}, base, { extra: 1 }),
    (() => { const p = Object.assign({}, base); delete p.confoundText; return p; })(),
    Object.assign({}, base, { operation: 'UPDATE' }),
    Object.assign({}, base, { temporality: 'FOREVER' }),
    Object.assign({}, base, { safetyAdjacent: 'no' }),
    Object.assign({}, base, { requestText: 'I like' }),
    Object.assign({}, base, { confoundText: 'quiet' }),
    Object.assign({}, base, { factors: [factor({ conceptId: null, newConceptLabel: null, mentionText: 'lake' })] }),
    Object.assign({}, base, { factors: [factor({ conceptId: 'cKnee', newConceptLabel: 'lake', mentionText: 'lake' })] }),
    Object.assign({}, base, { factors: [Object.assign(nf('lake'), { role: 'cause' })] }),
    Object.assign({}, base, { factors: [Object.assign(nf('lake'), { weight: 2 })] }),
    Object.assign({}, base, { statementText: 'x'.repeat(401) }),
    mut('WITHDRAW', 'R1', FK, 'my knee', 'NAMED', { statementText: 'my knee' }),
    mut('WITHDRAW', 'R1', FK, 'my knee', 'NAMED', { temporality: 'DURABLE' }),
    mut('FORGET', 'R1', FK, 'my knee', 'POINTING'),
    'not an object', null
  ];
  bad.forEach((p, i) => assert.deepEqual(codes(run(t, [p])), ['INVALID_SHAPE'], 'case ' + i));
});

// ═══ AC-19 / AC-20 — literal authority ═══
test('AC-19: each user-attributed field that is not an exact current-turn substring is NOT_LITERAL — case, spacing, punctuation, paraphrase, recent-conversation-only', () => {
  const t = 'Large meals before training make me feel heavy.';
  const rcc = { items: [{ turnId: 'p1', userText: 'I hate long meetings', assistantText: '' }] };
  const mk = (o) => proposal(Object.assign({ statementText: 'Large meals before training make me feel heavy', factors: [nf('Large meals')] }, o));
  const variants = [
    mk({ statementText: 'large meals before training make me feel heavy' }),
    mk({ statementText: 'Large meals  before training' }),
    mk({ statementText: 'Large meals, before training' }),
    mk({ statementText: 'Big meals before training make me feel heavy' }),
    mk({ statementText: 'I hate long meetings' }),
    mk({ factors: [nf('large meals')] }),
    mk({ factors: [factor({ newConceptLabel: 'Large meals', mentionText: 'Large  meals' })] }),
    mk({ factors: [factor({ newConceptLabel: 'Large Meals', mentionText: 'Large meals' })] }),
    mk({ factors: [Object.assign(nf('Large meals'), { valueText: 'heavy feeling' })] }),
    mk({ factors: [factor({ conceptId: 'cKnee', mentionText: 'long meetings' })] })
  ];
  variants.forEach((p, i) => assert.deepEqual(codes(run(t, [p], { rcc })), ['NOT_LITERAL'], 'variant ' + i));
  // confound text (CORRECT)
  const w = { concepts: [concept('cM', ['meals'])], records: [record('Rm', ['cM'])] };
  const c = mut('CORRECT', 'Rm', t, 'meals', 'NAMED', { statementText: 'make me feel heavy', factors: [nf('feel heavy', 'outcome'), factor({ conceptId: 'cM' })], temporality: 'DURABLE', confoundText: 'because I ate late' });
  assert.deepEqual(codes(run(t, [c], w)), ['NOT_LITERAL']);
});

test('AC-20: an accepted plan carries free text only in relationDescription, valueDescription, new-concept labels and confound descriptions — each an exact substring of the turn', () => {
  const t = 'I usually sleep badly before an early shift, about 5 hours, because of nerves.';
  const w = { concepts: [concept('cS', ['sleep badly'])], records: [record('Rs', ['cS'])] };
  const out = run(t, [mut('CORRECT', 'Rs', t, 'sleep badly', 'NAMED', {
    statementText: 'I usually sleep badly before an early shift', confoundText: 'because of nerves', temporality: 'RECURRING_WINDOW',
    factors: [factor({ conceptId: 'cS', mentionText: 'sleep badly', role: 'outcome', valueText: 'about 5 hours' }), nf('an early shift', 'condition')]
  })], w);
  assert.deepEqual(codes(out), ['ACCEPTED']);
  const req = out.results[0].plan.request;
  const texts = [req.successor.relationDescription].concat(req.successor.factors.map((f) => f.valueDescription).filter(Boolean), req.newConcepts.map((l) => l[0]), req.confoundsForPredecessors.map((c) => c.description));
  assert.deepEqual(texts, ['I usually sleep badly before an early shift', 'about 5 hours', 'an early shift', 'because of nerves']);
  texts.forEach((x) => assert.ok(t.indexOf(x) >= 0, x));
  // no other string field in the draft beyond closed values and ids
  const closed = ['subject', 'condition', 'outcome', 'EXPLICIT_STATEMENT', 'RECURRING_WINDOW', 'user_stated', 'STANDARD', 'CONVERSATION_TURN', TURN_ID, 'cS', 'Rs'];
  (function walk(v) {
    if (typeof v === 'string') assert.ok(closed.indexOf(v) >= 0 || texts.indexOf(v) >= 0, 'unexpected text: ' + v);
    else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k]));
  })(req);
});

// ═══ AC-21 / AC-22 — membership and current targets ═══
test('AC-21: hallucinated, differently-cased and non-presented conceptId / recordId values are rejected', () => {
  const t = 'my knee and the lake';
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'my knee', factors: [factor({ conceptId: 'cknee', mentionText: 'knee' })] })])), ['UNKNOWN_CONCEPT']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'my knee', factors: [factor({ conceptId: 'cMissing', mentionText: 'knee' })] })])), ['UNKNOWN_CONCEPT']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'r1', FK, 'my knee', 'NAMED')])), ['UNKNOWN_TARGET']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R_FAKE', FK, 'my knee', 'NAMED')])), ['UNKNOWN_TARGET']);
});

test('AC-22: a non-current target is TARGET_NOT_CURRENT; the route is selected only by the single target\'s source', () => {
  const recs = [record('R1', ['cKnee'], { status: 'superseded' })];
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { records: recs })), ['TARGET_NOT_CURRENT']);
  for (const [source, route] of [['user_stated', 'CLIENT'], ['inferred_event', 'GOVERNED'], ['inferred_pattern', 'GOVERNED'], ['coach_generated', 'GOVERNED']]) {
    const out = run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { records: [record('R1', ['cKnee'], { source, status: source === 'user_stated' ? 'active' : 'candidate' })] });
    assert.equal(out.results[0].plan.route, route, source);
    assert.equal(out.results[0].plan.storeOperation, 'forgetRecord');
  }
});

// ═══ AC-44 (dynamic) — the gate never reads Dimension 6 ═══
test('AC-44 (dynamic): gate outcomes are identical whatever Dimension 6 says (the gate input carries none; extra fields are ignored)', () => {
  const props = [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')];
  const a = run(FK, props);
  const b = G.evaluate({ proposals: props, turn: { turnId: TURN_ID, text: FK }, presentedConcepts: WORLD.concepts, presentedRecords: WORLD.records, recognition: NONE, userStatedKnowledge: { present: true, intent: 'NEW_USER_KNOWLEDGE', anchorText: FK } });
  const c = G.evaluate({ proposals: props, turn: { turnId: TURN_ID, text: FK, userStatedKnowledge: { present: false } }, presentedConcepts: WORLD.concepts, presentedRecords: WORLD.records, recognition: NONE });
  assert.deepEqual(b, a);
  assert.deepEqual(c, a);
});

// ═══ AC-45 / AC-46 — T1, T2, T3 ═══
test('AC-45: non-literal or over-length requestText/referenceText, or a reference not inside the request, are rejected with the matching code; recent-conversation-only anchors are rejected', () => {
  const rcc = { items: [{ turnId: 'p1', userText: 'Forget what I told you about my knee please', assistantText: '' }] };
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', 'forget what I told you about my knee', 'my knee', 'NAMED')])), ['REQUEST_NOT_ANCHORED']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK + ' please', 'my knee', 'NAMED')], { rcc })), ['REQUEST_NOT_ANCHORED']);
  const long = 'Forget ' + 'x'.repeat(200) + ' my knee';
  assert.deepEqual(codes(run(long, [mut('FORGET', 'R1', long, 'my knee', 'NAMED')])), ['REQUEST_NOT_ANCHORED']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'My Knee', 'NAMED')])), ['REFERENCE_NOT_ANCHORED']);
  const t2 = 'my knee is fine. Forget what I told you about it';
  assert.deepEqual(codes(run(t2, [mut('FORGET', 'R1', 'Forget what I told you about it', 'my knee', 'NAMED')])), ['REFERENCE_NOT_ANCHORED']);
  const longRef = 'k'.repeat(81);
  assert.deepEqual(codes(run('Forget ' + longRef, [mut('FORGET', 'R1', 'Forget ' + longRef, longRef, 'NAMED')])), ['REFERENCE_NOT_ANCHORED']);
});

test('AC-46: T3 — authority anchors overlapping a Safety-owned span or the CPI anchor are rejected', () => {
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { recognition: safetyRec(['MY KNEE']) })), ['SAFETY_OWNED_SPAN']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { recognition: safetyRec(['forget what']) })), ['SAFETY_OWNED_SPAN']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { recognition: cpiRec('about my') })), ['CPI_OWNED_SPAN']);
  // a non-overlapping owned span does not block
  assert.deepEqual(codes(run(FK + '. I like tea', [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { recognition: cpiRec('I like tea') })), ['ACCEPTED']);
});

// ═══ AC-47 — lexical grounding ═══
test('AC-47: lexical grounding is label containment after normalizeLabelKey; labels shorter than 3 are ignored; relationDescription/valueDescription are never used', () => {
  const recs = [record('R1', ['cKnee'], { relation: 'nothing related' }), record('Rki', ['cKi'], { relation: 'my knee again' })];
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { records: recs })), ['ACCEPTED'], '"ki" (2 chars) is ignored; relation text not used');
  // whitespace/case-normalized containment
  const t = 'Forget what I said about my   KNEE today';
  assert.deepEqual(codes(run(t, [mut('FORGET', 'R1', t, 'my   KNEE', 'NAMED')], { records: [record('R1', ['cKnee'])] })), ['ACCEPTED']);
  // a value/relation-only match never grounds
  const vr = record('Rv', ['cSleep'], { relation: 'my knee' });
  vr.factors[0].valueDescription = 'my knee';
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'Rv', FK, 'my knee', 'NAMED')], { records: [vr] })), ['TARGET_NOT_GROUNDED']);
  assert.deepEqual(G._internal.lexicalGrounding('my knee', G._internal.buildContext({ turn: { turnId: TURN_ID, text: FK }, presentedConcepts: WORLD.concepts, presentedRecords: WORLD.records.concat([record('Rki', ['cKi'])]) })), ['R1']);
  assert.equal(G.BOUNDS.LEXICAL_GROUNDING_MIN_CHARS, 3);
});

// ═══ AC-48 / AC-49 / AC-50 ═══
test('AC-48: NAMED — rejected AMBIGUOUS_TARGET when L(turnText) ≠ L(referenceText), including narrowed reference and narrowed request', () => {
  const t = 'Forget what I said about coffee and my knee';
  assert.deepEqual(codes(run(t, [mut('FORGET', 'R1', t, 'my knee', 'NAMED')])), ['AMBIGUOUS_TARGET']);
  assert.deepEqual(codes(run(t, [mut('FORGET', 'R1', 'and my knee', 'my knee', 'NAMED')])), ['AMBIGUOUS_TARGET']);
  const t2 = 'I still love coffee. Forget what I told you about my knee';
  assert.deepEqual(codes(run(t2, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')])), ['AMBIGUOUS_TARGET'], 'another presented label anywhere in the turn fails closed (CAL-8(c) cost)');
});

test('AC-49: DEICTIC — REFERENCE_KIND_MISMATCH when the whole turn names any presented record; C uses only originTurnId and CONVERSATION_TURN refs against recent turn ids; unavailable recent conversation gives C = ∅', () => {
  const rcc = { items: [{ turnId: 'w1', userText: 'u', assistantText: 'a' }, { turnId: 'w2', userText: 'u', assistantText: 'a' }] };
  const recs = WORLD.records.concat([record('R5', ['cStairs'], { origin: 'w2' })]);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R5', FK, 'that', 'DEICTIC')], { records: recs, rcc })), ['REFERENCE_NOT_ANCHORED']);
  const t = 'Forget that about my knee';
  assert.deepEqual(codes(run(t, [mut('FORGET', 'R5', t, 'that', 'DEICTIC')], { records: recs, rcc })), ['REFERENCE_KIND_MISMATCH']);
  assert.deepEqual(codes(run('Forget that', [mut('FORGET', 'R5', 'Forget that', 'that', 'DEICTIC')], { records: recs, rcc })), ['ACCEPTED']);
  const bySupport = WORLD.records.concat([record('R6', ['cStairs'], { origin: 'old', support: ['w1'] })]);
  assert.deepEqual(codes(run('Forget that', [mut('FORGET', 'R6', 'Forget that', 'that', 'DEICTIC')], { records: bySupport, rcc })), ['ACCEPTED']);
  for (const none of [null, undefined, {}, { items: 'x' }, { items: [] }]) {
    assert.deepEqual(codes(run('Forget that', [mut('FORGET', 'R5', 'Forget that', 'that', 'DEICTIC')], { records: recs, rcc: none === undefined ? null : none })), ['TARGET_NOT_GROUNDED']);
  }
});

test('AC-50: exact-set rule — TARGET_NOT_GROUNDED for empty G* or a target outside G*; AMBIGUOUS_TARGET for |G*| ≠ 1', () => {
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R2', FK, 'my knee', 'NAMED')])), ['TARGET_NOT_GROUNDED']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'I told you', 'NAMED')])), ['TARGET_NOT_GROUNDED']);
  const recs = WORLD.records.concat([record('R4', ['cKnee', 'cStairs'])]);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { records: recs })), ['AMBIGUOUS_TARGET']);
  assert.deepEqual(codes(run(FK, [mut('FORGET', 'R4', FK, 'my knee', 'NAMED')], { records: recs })), ['AMBIGUOUS_TARGET']);
});

// ═══ AC-51 — FORGET safeguards ═══
test('AC-51: a second FORGET, or FORGET with CORRECT/WITHDRAW, rejects every mutating proposal FORGET_NOT_EXCLUSIVE (NEW unaffected); a record targeted twice → TARGET_CONFLICT; never downgraded', () => {
  const t = 'Forget what I told you about my knee and coffee is not true anymore. I like quiet evenings';
  const newP = proposal({ statementText: 'I like quiet evenings', factors: [nf('quiet evenings')] });
  const two = run(t, [mut('FORGET', 'R1', t, 'my knee', 'NAMED'), mut('FORGET', 'R3', t, 'coffee', 'NAMED'), newP]);
  assert.deepEqual(codes(two), ['FORGET_NOT_EXCLUSIVE', 'FORGET_NOT_EXCLUSIVE', 'ACCEPTED']);
  const mixed = run(t, [mut('FORGET', 'R1', t, 'my knee', 'NAMED'), mut('WITHDRAW', 'R3', t, 'coffee', 'NAMED'), newP]);
  assert.deepEqual(codes(mixed), ['FORGET_NOT_EXCLUSIVE', 'FORGET_NOT_EXCLUSIVE', 'ACCEPTED']);
  const conflict = run(t, [mut('WITHDRAW', 'R1', t, 'my knee', 'NAMED'), mut('CORRECT', 'R1', t, 'my knee', 'NAMED', { statementText: 'I like quiet evenings', factors: [nf('quiet evenings')], temporality: 'DURABLE' })]);
  assert.deepEqual(codes(conflict), ['TARGET_CONFLICT', 'TARGET_CONFLICT']);
  // a rejected FORGET is never re-planned as another operation
  const amb = run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')], { records: WORLD.records.concat([record('R4', ['cKnee', 'cStairs'])]) });
  assert.equal(amb.results[0].status, 'REJECTED');
  assert.equal('plan' in amb.results[0], false);
});

// ═══ AC-52 — carry-forward ═══
test('AC-52: carry-forward accepted only in CORRECT, only for a concept of the target, only with null mention/value/label and cpiReference false; no anchored factor → NO_ANCHORED_FACTOR', () => {
  const t = "Actually, it wasn't pasta — it was the huge portion";
  const w = { concepts: [concept('cP', ['pasta']), concept('cH', ['feeling heavy']), concept('cX', ['other'])], records: [record('R8', ['cP', 'cH'], { source: 'inferred_pattern', status: 'candidate', roles: ['condition', 'outcome'] })] };
  const corr = (factors) => mut('CORRECT', 'R8', t, 'pasta', 'NAMED', { statementText: 'it was the huge portion', factors, temporality: 'DURABLE' });
  assert.deepEqual(codes(run(t, [corr([nf('huge portion', 'condition'), factor({ conceptId: 'cH', role: 'outcome' })])], w)), ['ACCEPTED']);
  assert.deepEqual(codes(run(t, [corr([nf('huge portion', 'condition'), factor({ conceptId: 'cX', role: 'outcome' })])], w)), ['NOT_LITERAL'], 'not a concept of the target');
  assert.deepEqual(codes(run(t, [corr([nf('huge portion', 'condition'), factor({ conceptId: 'cH', valueText: 'huge' })])], w)), ['NOT_LITERAL']);
  assert.deepEqual(codes(run(t, [corr([nf('huge portion', 'condition'), factor({ conceptId: 'cH', cpiReference: true })])], w)), ['NOT_LITERAL']);
  assert.deepEqual(codes(run(t, [corr([factor({ conceptId: 'cH', role: 'outcome' })])], w)), ['NO_ANCHORED_FACTOR']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'it was the huge portion', factors: [factor({ conceptId: 'cH' })] })], w)), ['NOT_LITERAL'], 'never in NEW');
});

// ═══ AC-23 … AC-26 — owned-span routing ═══
test('AC-23: a user-attributed span overlapping any Safety-owned span → SAFETY_OWNED_SPAN', () => {
  const t = 'Running hurts my ankle, but I love long walks';
  const rec = safetyRec(['running hurts my ankle']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'Running hurts my ankle', factors: [nf('long walks')] })], { recognition: rec })), ['SAFETY_OWNED_SPAN']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'I love long walks', factors: [nf('my ankle')] })], { recognition: rec })), ['SAFETY_OWNED_SPAN']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'I love long walks', factors: [nf('long walks')] })], { recognition: rec })), ['ACCEPTED']);
});

test('AC-24: a user-attributed span overlapping the CPI anchor outside the single reference factor → CPI_OWNED_SPAN', () => {
  const t = 'I prefer training in the morning because evenings are for my children.';
  const rec = cpiRec('I prefer training in the morning');
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'training in the morning because evenings', factors: [nf('evenings')] })], { recognition: rec })), ['CPI_OWNED_SPAN']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'evenings are for my children', factors: [nf('morning'), nf('evenings')] })], { recognition: rec })), ['CPI_OWNED_SPAN']);
});

test('AC-25: a CPI reference factor needs cpi.authorized, mention inside the anchor, null valueText, exactly one such factor, and another factor disjoint from owned spans — each violation has its code', () => {
  const t = 'I prefer training in the morning because evenings are for my children.';
  const ref = (o) => factor(Object.assign({ newConceptLabel: 'training in the morning', mentionText: 'training in the morning', cpiReference: true }, o || {}));
  const p = (factors) => proposal({ statementText: 'evenings are for my children', factors });
  const rec = cpiRec('I prefer training in the morning');
  assert.deepEqual(codes(run(t, [p([ref(), nf('evenings')])], { recognition: rec })), ['ACCEPTED']);
  assert.equal(run(t, [p([ref(), nf('evenings')])], { recognition: rec }).results[0].plan.requiresCpiRecord, true);
  assert.deepEqual(codes(run(t, [p([ref(), nf('evenings')])], { recognition: cpiRec('I prefer training in the morning', false) })), ['INVALID_CPI_REFERENCE'], 'not authorized');
  assert.deepEqual(codes(run(t, [p([ref({ newConceptLabel: 'evenings', mentionText: 'evenings' }), nf('my children')])], { recognition: rec })), ['INVALID_CPI_REFERENCE'], 'mention outside the anchor');
  assert.deepEqual(codes(run(t, [p([ref({ valueText: 'morning' }), nf('evenings')])], { recognition: rec })), ['INVALID_CPI_REFERENCE'], 'value text');
  assert.deepEqual(codes(run(t, [p([ref(), ref({ newConceptLabel: 'morning', mentionText: 'morning' }), nf('evenings')])], { recognition: rec })), ['INVALID_CPI_REFERENCE'], 'two reference factors');
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'for my children', factors: [ref()] })], { recognition: rec })), ['NO_ADDITIONAL_KNOWLEDGE']);
  assert.deepEqual(codes(run(t, [p([ref(), nf('evenings')])])), ['INVALID_CPI_REFERENCE'], 'no CPI recognition');
  // never in a CORRECT of FITME-sourced targets
  const w = { concepts: [concept('cE', ['evenings'])], records: [record('Ri', ['cE'], { source: 'inferred_event', status: 'candidate' })] };
  const corr = mut('CORRECT', 'Ri', 'because evenings are for my children', 'evenings', 'NAMED', { statementText: 'evenings are for my children', factors: [ref(), nf('my children')], temporality: 'DURABLE' });
  assert.deepEqual(codes(run(t, [corr], Object.assign({ recognition: rec }, w))), ['INVALID_CPI_REFERENCE']);
});

test('AC-26: overlap uses every occurrence, including repeated words and Hebrew text', () => {
  const t = 'cats are fine. I prefer cats';
  // owned span "I prefer cats" occurs once, but the word "cats" occurs twice: the mention overlaps via the second occurrence
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'cats are fine', factors: [nf('cats')] })], { recognition: cpiRec('I prefer cats') })), ['CPI_OWNED_SPAN']);
  const h = 'אני אוהב לרוץ כי זה מנקה לי את הראש';
  const rec = cpiRec('אני אוהב לרוץ');
  assert.deepEqual(codes(run(h, [proposal({ statementText: 'זה מנקה לי את הראש', factors: [factor({ newConceptLabel: 'לרוץ', mentionText: 'לרוץ', cpiReference: true }), nf('מנקה לי את הראש', 'outcome')] })], { recognition: rec })), ['ACCEPTED']);
  assert.deepEqual(codes(run(h, [proposal({ statementText: 'אוהב לרוץ כי זה', factors: [nf('מנקה')] })], { recognition: rec })), ['CPI_OWNED_SPAN']);
  assert.deepEqual(codes(run(h, [proposal({ statementText: 'זה מנקה לי את הראש', factors: [nf('מנקה')] })], { recognition: safetyRec(['מנקה לי']) })), ['SAFETY_OWNED_SPAN']);
});

// ═══ AC-29 / AC-30 / AC-31 / AC-38 — drafts ═══
test('AC-29 / AC-30: a NEW plan builds an E.0.2c-valid user_stated EXPLICIT_STATEMENT draft (confidence 1, expiresAt null, CONVERSATION_TURN evidence, originTurnId); safetyAdjacent only raises', () => {
  const t = 'I usually sleep badly before an early shift.';
  for (const raised of [false, true]) {
    const out = run(t, [proposal({ statementText: 'I usually sleep badly', factors: [nf('sleep badly', 'outcome')], temporality: 'RECURRING_WINDOW', safetyAdjacent: raised })]);
    const d = out.results[0].plan.request.draft;
    assert.equal(C.validateRecordDraft(d, 1), null);
    assert.equal(d.source, 'user_stated');
    assert.equal(d.evidenceClass, 'EXPLICIT_STATEMENT');
    assert.equal(d.confidence, 1);
    assert.equal(d.expiresAt, null);
    assert.deepEqual(d.evidence.supporting, [{ kind: 'CONVERSATION_TURN', ref: TURN_ID }]);
    assert.deepEqual(d.provenance, { originTurnId: TURN_ID });
    assert.equal(d.safetyFlag, raised ? 'SAFETY_ADJACENT' : 'STANDARD');
  }
  // a correction never lowers a raised predecessor flag
  const w = { concepts: [concept('cS', ['sleep badly'])], records: [record('Rs', ['cS'], { safetyFlag: 'SAFETY_ADJACENT' })] };
  const out = run(t, [mut('CORRECT', 'Rs', t, 'sleep badly', 'NAMED', { statementText: 'before an early shift', factors: [nf('an early shift', 'condition')], temporality: 'DURABLE', safetyAdjacent: false })], w);
  assert.equal(out.results[0].plan.request.successor.safetyFlag, 'SAFETY_ADJACENT');
});

test('AC-31 / §15.6: NEW duplicating a presented active user_stated record → DUPLICATE_OF_PRESENTED; CORRECT identical to its user_stated predecessor → CORRECTION_IDENTICAL_TO_PREDECESSOR', () => {
  const t = 'my knee clicks on the way down';
  const recs = [record('R1', ['cKnee'], { relation: 'my knee clicks' })];
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'my knee clicks', factors: [factor({ conceptId: 'cKnee', mentionText: 'knee' })] })], { records: recs })), ['DUPLICATE_OF_PRESENTED']);
  assert.deepEqual(codes(run(t, [mut('CORRECT', 'R1', t, 'my knee', 'NAMED', { statementText: 'my knee clicks', factors: [factor({ conceptId: 'cKnee', mentionText: 'knee' })], temporality: 'DURABLE' })], { records: recs })), ['CORRECTION_IDENTICAL_TO_PREDECESSOR']);
  assert.deepEqual(codes(run(t, [proposal({ statementText: 'my knee clicks on the way down', factors: [factor({ conceptId: 'cKnee', mentionText: 'knee' })] })], { records: recs })), ['ACCEPTED']);
});

test('AC-38: presented concepts keep their id; new concepts get their literal label (deduplicated); at most 6 new concepts per turn across accepted proposals', () => {
  const t = 'a1 a2 a3 a4 a5 a6 a7 knee';
  const out = run(t, [proposal({ statementText: 'a1 a2', factors: [factor({ conceptId: 'cKnee', mentionText: 'knee' }), nf('a1'), nf('a1', 'outcome')] })]);
  const req = out.results[0].plan.request;
  assert.deepEqual(req.newConcepts, [['a1']]);
  assert.deepEqual(req.draft.factors.map((f) => f.conceptId || ('new:' + f.newConcept)), ['cKnee', 'new:0', 'new:0']);
  const four = (labels) => proposal({ statementText: 'a1', factors: labels.map((l) => nf(l)) });
  assert.deepEqual(codes(run(t, [four(['a1', 'a2', 'a3', 'a4']), four(['a5', 'a6']), four(['a7'])])), ['ACCEPTED', 'ACCEPTED', 'INVALID_SHAPE']);
});

// ═══ AC-43 — no taxonomy in exported vocabularies ═══
test('AC-43: the gate exports only the §14.4 process vocabularies (operations, reference kinds); roles and temporalities are the E.0.2c contract\'s', () => {
  assert.deepEqual(G.OPERATIONS, ['NEW', 'CORRECT', 'WITHDRAW', 'FORGET']);
  assert.deepEqual(G.REFERENCE_KINDS, ['NAMED', 'DEICTIC']);
  const arrays = Object.keys(G).filter((k) => Array.isArray(G[k]));
  assert.deepEqual(arrays.sort(), ['OPERATIONS', 'REFERENCE_KINDS']);
  assert.deepEqual(C.FACTOR_ROLES, ['condition', 'subject', 'outcome']);
});

test('the gate never throws and is deterministic; plans are deep-frozen', () => {
  for (const junk of [undefined, null, 5, {}, { proposals: 'x' }, { proposals: [null, 3, []] }, { proposals: [{}], turn: { turnId: 'bad id', text: 'x' } }]) {
    assert.doesNotThrow(() => G.evaluate(junk));
  }
  const out = run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')]);
  assert.deepEqual(run(FK, [mut('FORGET', 'R1', FK, 'my knee', 'NAMED')]), out);
  assert.ok(Object.isFrozen(out.results[0].plan.request));
});
