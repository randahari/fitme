// WP0 Phase E.0.2c — User Knowledge Record and Concept Identity Foundation: transition-planner tests
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §11.3, §13-§15, §30). Pure planners; deterministic; no model call.
// Run with: node --test tests/e02cUserKnowledgeTransitions.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));
const T = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeTransitions.js'));

const P = { producer: 'test.producer', producerVersion: '1.0.0' };
const clone = (o) => JSON.parse(JSON.stringify(o));
let seq = 0;
const ids = (n, extra) => Object.assign({ eventIds: Array.from({ length: n || 4 }, () => 'ev' + (++seq)), confoundIds: Array.from({ length: 8 }, () => 'cf' + (++seq)) }, extra || {});

function concept(id, labels, userId) {
  const r = T.planCreateConcept({}, { labels, userId: userId || 'u1', ids: { conceptIds: [id], eventIds: ['e_' + id] } }, 100, 'CLIENT', P);
  assert.ok(r.ok, r.code);
  return r.changeSet.creates[0];
}
const KNOWN = { cA: concept('cA', ['alpha']), cB: concept('cB', ['beta']), cC: concept('cC', ['gamma']), cD: concept('cD', ['delta']) };

function draft(o) {
  const source = (o && o.source) || 'user_stated';
  return Object.assign({
    factors: [{ conceptId: 'cA', role: 'subject' }, { conceptId: 'cB', role: 'outcome' }],
    relationDescription: 'Open-text description of what was noticed.',
    evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
    temporality: 'DURABLE',
    confidence: source === 'user_stated' ? 1 : 0.4,
    source,
    safetyFlag: 'STANDARD',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turn1' }] },
    provenance: { originTurnId: source === 'user_stated' ? 'turn1' : null }
  }, o || {});
}
function create(o, recordId, writer) {
  const d = draft(o);
  const r = T.planCreateRecord({ concepts: KNOWN }, { draft: d, userId: 'u1', ids: ids(2, { recordId: recordId || 'r' + (++seq) }) }, 1000, writer || (d.source === 'user_stated' ? 'CLIENT' : 'SERVER'), P);
  assert.ok(r.ok, JSON.stringify(r));
  return r.changeSet.creates[r.changeSet.creates.length - 1];
}
const upd = (r) => { assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.changeSet.updates.length, 1); return r.changeSet.updates[0].doc; };
const req = (o) => Object.assign({ userId: 'u1', ids: ids(4) }, o || {});
const promoteReady = (rec, now) => upd(T.planRecordConfoundCheck({ record: rec }, req(), now || 1100, 'SERVER', P));

// ═══════════════════ Evidence availability (AC-8, AC-49 planner half) ═══════════════════
test('AC-8: availability changes only availability fields, appends one history entry per changed ref, never removes or reorders', () => {
  const base = create({ source: 'inferred_pattern', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }, { kind: 'DAY_LOG', ref: '2026-07-01' }], contradicting: [{ kind: 'HABIT_RECORD', ref: 'h1' }] } });
  const next = upd(T.planEvidenceAvailability({ record: base }, req({ results: [
    { refId: 'CONVERSATION_TURN:t1', availability: 'UNRESOLVABLE', reason: 'USER_DELETED' },
    { refId: 'DAY_LOG:2026-07-01', availability: 'RESOLVABLE' }
  ] }), 1200, 'SERVER', P));
  const strip = (r) => ({ refId: r.refId, kind: r.kind, ref: r.ref, observedAt: r.observedAt, addedAt: r.addedAt });
  ['supporting', 'contradicting'].forEach((l) => assert.deepEqual(next.evidence[l].map(strip), base.evidence[l].map(strip)));
  assert.equal(next.evidence.supporting[0].availability, 'UNRESOLVABLE');
  assert.equal(next.evidence.supporting[0].unresolvableReason, 'USER_DELETED');
  assert.equal(next.evidence.supporting[1].availability, 'RESOLVABLE');
  assert.equal(next.evidence.contradicting[0].availability, 'UNVERIFIED');
  const added = next.correctionHistory.slice(base.correctionHistory.length);
  assert.deepEqual(added.map((h) => h.kind), ['EVIDENCE_AVAILABILITY_CHANGED', 'EVIDENCE_AVAILABILITY_CHANGED']);
  assert.deepEqual(added.map((h) => h.refIds[0]), ['CONVERSATION_TURN:t1', 'DAY_LOG:2026-07-01']);
  // Same result again → no change; unknown refId, extra keys, reason on RESOLVABLE → rejected.
  assert.equal(T.planEvidenceAvailability({ record: next }, req({ results: [{ refId: 'CONVERSATION_TURN:t1', availability: 'UNRESOLVABLE', reason: 'USER_DELETED' }] }), 1300, 'SERVER', P).code, 'NO_CHANGE');
  assert.equal(T.planEvidenceAvailability({ record: base }, req({ results: [{ refId: 'CONVERSATION_TURN:nope', availability: 'RESOLVABLE' }] }), 1200, 'SERVER', P).code, 'UNKNOWN_REF');
  assert.equal(T.planEvidenceAvailability({ record: base }, req({ results: [{ refId: 'CONVERSATION_TURN:t1', availability: 'RESOLVABLE', content: 'x' }] }), 1200, 'SERVER', P).code, 'UNKNOWN_FIELD');
  assert.equal(T.planEvidenceAvailability({ record: base }, req({ results: [{ refId: 'CONVERSATION_TURN:t1', availability: 'RESOLVABLE', reason: 'NOT_FOUND' }] }), 1200, 'SERVER', P).code, 'INVALID_VALUE');
  // Missing reason defaults to NOT_FOUND.
  const d = upd(T.planEvidenceAvailability({ record: base }, req({ results: [{ refId: 'CONVERSATION_TURN:t1', availability: 'UNRESOLVABLE' }] }), 1200, 'SERVER', P));
  assert.equal(d.evidence.supporting[0].unresolvableReason, 'NOT_FOUND');
});

test('AC-49 (planner half): evidence loss never changes status, content or source and never withdraws/supersedes/archives', () => {
  C.UNRESOLVABLE_REASONS.forEach((reason) => {
    [create(), promoteAndActivate()].forEach((rec) => {
      const results = rec.evidence.supporting.map((r) => ({ refId: r.refId, availability: 'UNRESOLVABLE', reason }));
      const next = upd(T.planEvidenceAvailability({ record: rec }, req({ results }), 1300, rec.source === 'user_stated' ? 'CLIENT' : 'SERVER', P));
      assert.equal(next.status, rec.status, reason);
      assert.equal(next.source, rec.source);
      assert.equal(next.confidence, rec.confidence);
      assert.deepEqual(next.factors, rec.factors);
      assert.equal(C.contentKey(next), C.contentKey(rec));
      const kinds = next.correctionHistory.map((h) => h.kind);
      ['RETRACTED', 'SUPERSEDED', 'ARCHIVED'].forEach((k) => assert.equal(kinds.indexOf(k), -1));
    });
  });
});
function promoteAndActivate() {
  const c = promoteReady(create({ source: 'inferred_event', evidence: { supporting: [{ kind: 'DAY_LOG', ref: '2026-07-02' }] } }));
  return upd(T.planPromoteRecord({ record: c }, req(), 1150, 'SERVER', P));
}

// ═══════════════════ Lifecycle (AC-11 … AC-16) ═══════════════════
test('AC-11: every §14.2 transition succeeds under its conditions; every other pair is rejected; terminal statuses are final', () => {
  const us = create();
  const cand = create({ source: 'inferred_pattern' });
  const act = promoteAndActivate();
  // allowed
  assert.equal(upd(T.planRetractRecord({ record: cand }, req(), 1200, 'SERVER', P)).status, 'rejected');
  assert.equal(upd(T.planRetractRecord({ record: us }, req(), 1200, 'CLIENT', P)).status, 'rejected');
  assert.equal(upd(T.planArchiveRecord({ record: act }, req(), 1200, 'SERVER', P)).status, 'archived');
  // disallowed
  assert.equal(T.planArchiveRecord({ record: cand }, req(), 1200, 'SERVER', P).code, 'INVALID_TRANSITION', 'candidate → archived');
  assert.equal(T.planPromoteRecord({ record: act }, req(), 1200, 'SERVER', P).code, 'INVALID_TRANSITION', 'active → active');
  assert.equal(T.planPromoteRecord({ record: us }, req(), 1200, 'CLIENT', P).code, 'INVALID_TRANSITION');
  // terminal statuses reject every transition and mutation
  const terminals = [
    upd(T.planRetractRecord({ record: cand }, req(), 1200, 'SERVER', P)),
    upd(T.planArchiveRecord({ record: act }, req(), 1200, 'SERVER', P)),
    Object.assign(clone(act), { status: 'superseded', supersededBy: ['rX'] })
  ];
  terminals.forEach((t) => {
    [T.planPromoteRecord, T.planRetractRecord, T.planArchiveRecord, T.planRecordConfoundCheck, T.planRaiseSafetyFlag].forEach((fn) => {
      assert.notEqual(fn({ record: t }, req(), 1300, 'SERVER', P).ok, true, t.status + ' ' + fn.name);
    });
    assert.equal(T.planSetConfidence({ record: t }, req({ confidence: 0.1 }), 1300, 'SERVER', P).code, 'INVALID_TRANSITION');
    assert.equal(T.planAppendEvidence({ record: t }, req({ list: 'supporting', refs: [{ kind: 'DAY_LOG', ref: '2026-01-01' }] }), 1300, 'SERVER', P).code, 'INVALID_TRANSITION');
    assert.equal(T.planSupersede({ predecessors: [t], concepts: KNOWN }, req({ predecessorIds: [t.recordId], successor: draft({ source: 'inferred_pattern' }), ids: ids(4, { recordId: 'rNew' + (++seq) }) }), 1300, 'SERVER', P).code, 'INVALID_TRANSITION');
  });
});

test('AC-12: user-stated creation is active; server-source creation is candidate even when active is requested', () => {
  assert.equal(create().status, 'active');
  ['inferred_event', 'inferred_pattern', 'coach_generated'].forEach((s) => assert.equal(create({ source: s, status: 'active' }).status, 'candidate', s));
  assert.equal(create({ status: 'candidate' }).status, 'active', 'status in a draft is ignored');
});

test('AC-13: non-user-stated promotion requires a confound check AND at least one non-unresolvable supporting ref', () => {
  const cand = create({ source: 'inferred_pattern', evidence: { supporting: [{ kind: 'DAY_LOG', ref: '2026-07-03' }] } });
  assert.equal(T.planPromoteRecord({ record: cand }, req(), 1200, 'SERVER', P).code, 'PROMOTION_CONDITIONS_NOT_MET', 'no confound check');
  const checked = promoteReady(cand);
  const lost = upd(T.planEvidenceAvailability({ record: checked }, req({ results: [{ refId: 'DAY_LOG:2026-07-03', availability: 'UNRESOLVABLE' }] }), 1150, 'SERVER', P));
  assert.equal(T.planPromoteRecord({ record: lost }, req(), 1200, 'SERVER', P).code, 'PROMOTION_CONDITIONS_NOT_MET', 'only unresolvable support');
  const noEvidence = promoteReady(create({ source: 'inferred_pattern', evidence: {} }));
  assert.equal(T.planPromoteRecord({ record: noEvidence }, req(), 1200, 'SERVER', P).code, 'PROMOTION_CONDITIONS_NOT_MET', 'no support at all');
  const ok = upd(T.planPromoteRecord({ record: checked }, req(), 1200, 'SERVER', P));
  assert.equal(ok.status, 'active');
  assert.equal(ok.correctionHistory[ok.correctionHistory.length - 1].kind, 'PROMOTED');
});

test('AC-14: in-place mutations never alter semantic content, source or provenance', () => {
  const base = promoteReady(create({ source: 'inferred_pattern' }));
  const frozen = (r) => JSON.stringify([r.factors, r.conceptIds, C.contentKey(r), r.evidenceClass, r.temporality, r.expiresAt, r.source, r.provenance]);
  const results = [
    upd(T.planAppendEvidence({ record: base }, req({ list: 'contradicting', refs: [{ kind: 'PATTERN_RECORD', ref: 'p1' }] }), 1200, 'SERVER', P)),
    upd(T.planEvidenceAvailability({ record: base }, req({ results: [{ refId: 'CONVERSATION_TURN:turn1', availability: 'RESOLVABLE' }] }), 1200, 'SERVER', P)),
    upd(T.planAddConfound({ record: base, concepts: KNOWN }, req({ confound: { conceptId: 'cD', source: 'inferred_pattern' } }), 1200, 'SERVER', P)),
    upd(T.planRecordConfoundCheck({ record: base }, req(), 1200, 'SERVER', P)),
    upd(T.planSetConfidence({ record: base }, req({ confidence: 0.7 }), 1200, 'SERVER', P)),
    upd(T.planRaiseSafetyFlag({ record: base }, req(), 1200, 'SERVER', P))
  ];
  results.forEach((r) => {
    assert.equal(frozen(r), frozen(base));
    assert.equal(r.version, base.version + 1);
    assert.equal(r.correctionHistory.length, base.correctionHistory.length + 1);
  });
  assert.equal(results[4].correctionHistory.slice(-1)[0].previousConfidence, 0.4);
  assert.equal(results[4].correctionHistory.slice(-1)[0].newConfidence, 0.7);
  assert.equal(T.planSetConfidence({ record: base }, req({ confidence: 0.4 }), 1200, 'SERVER', P).code, 'NO_CHANGE');
  assert.equal(T.planAddConfound({ record: base, concepts: KNOWN }, req({ confound: { conceptId: 'cZ', source: 'inferred_pattern' } }), 1200, 'SERVER', P).code, 'UNKNOWN_CONCEPT');
  assert.equal(T.planAppendEvidence({ record: base }, req({ list: 'supporting', refs: [{ kind: 'CONVERSATION_TURN', ref: 'turn1' }] }), 1200, 'SERVER', P).code, 'NO_CHANGE', 'duplicate ref');
});

test('AC-15: the safety flag can only be raised; lowering is not expressible', () => {
  const r = create();
  const raised = upd(T.planRaiseSafetyFlag({ record: r }, req(), 1200, 'CLIENT', P));
  assert.equal(raised.safetyFlag, 'SAFETY_ADJACENT');
  assert.equal(T.planRaiseSafetyFlag({ record: raised }, req(), 1300, 'CLIENT', P).code, 'NO_CHANGE');
  assert.equal(Object.keys(T).some((k) => /lower|clear|reset.*safety/i.test(k)), false);
  const again = upd(T.planSetConfidence({ record: raised }, req({ confidence: 0.2 }), 1300, 'CLIENT', P));
  assert.equal(again.safetyFlag, 'SAFETY_ADJACENT');
});

test('AC-16: history is append-only, ordered, carries the configured writer; the last slot is reserved for a terminal transition', () => {
  let r = create();
  const snapshot = clone(r.correctionHistory);
  r = upd(T.planSetConfidence({ record: r }, req({ confidence: 0.9 }), 1200, 'CLIENT', P));
  assert.deepEqual(r.correctionHistory.slice(0, snapshot.length), snapshot);
  r.correctionHistory.forEach((h) => assert.equal(h.writer, 'CLIENT'));
  const s = promoteReady(create({ source: 'inferred_pattern' }));
  s.correctionHistory.forEach((h) => assert.equal(h.writer, 'SERVER'));
  // Capacity: fill to MAX-1 entries.
  const full = clone(r);
  while (full.correctionHistory.length < C.LIMITS.MAX_HISTORY_ENTRIES - 1) {
    full.correctionHistory.push(Object.assign(clone(full.correctionHistory[1]), { eventId: 'fill' + full.correctionHistory.length }));
  }
  assert.deepEqual(C.validateRecord(full), { ok: true });
  assert.equal(T.planSetConfidence({ record: full }, req({ confidence: 0.1 }), 1300, 'CLIENT', P).code, 'HISTORY_CAPACITY');
  assert.equal(T.planRaiseSafetyFlag({ record: full }, req(), 1300, 'CLIENT', P).code, 'HISTORY_CAPACITY');
  const retracted = upd(T.planRetractRecord({ record: full }, req(), 1300, 'CLIENT', P));
  assert.equal(retracted.correctionHistory.length, C.LIMITS.MAX_HISTORY_ENTRIES);
  assert.deepEqual(C.validateRecord(retracted), { ok: true });
  const sup = T.planSupersede({ predecessors: [full], concepts: KNOWN }, req({ predecessorIds: [full.recordId], successor: draft(), ids: ids(3, { recordId: 'rCap' }) }), 1300, 'CLIENT', P);
  assert.equal(sup.ok, true, 'the knowledge can always be carried forward by supersession');
});

// ═══════════════════ Correction / supersession (AC-17, AC-18) ═══════════════════
test('AC-17: supersede creates one successor and updates each predecessor with symmetric links, history and carried confounds; content is untouched', () => {
  const p1 = create({}, 'rP1');
  const p2 = create({ factors: [{ conceptId: 'cC', role: 'subject' }] }, 'rP2');
  const r = T.planSupersede({ predecessors: [p1, p2], concepts: KNOWN }, req({
    predecessorIds: ['rP1', 'rP2'],
    successor: draft({ factors: [{ conceptId: 'cD', role: 'condition', valueDescription: 'large' }, { conceptId: 'cB', role: 'outcome' }] }),
    confoundsForPredecessors: [{ conceptId: 'cD', description: 'size rather than the item itself', source: 'user_stated' }],
    ids: ids(8, { recordId: 'rS' })
  }), 1500, 'CLIENT', P);
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.changeSet.creates.length, 1);
  assert.equal(r.changeSet.updates.length, 2);
  const succ = r.changeSet.creates[0];
  assert.deepEqual(succ.supersedes, ['rP1', 'rP2']);
  assert.equal(succ.status, 'active');
  assert.deepEqual(succ.correctionHistory[0].relatedRecordIds, ['rP1', 'rP2']);
  r.changeSet.updates.forEach((u, i) => {
    const prev = [p1, p2][i];
    const next = u.doc;
    assert.equal(u.expectedVersion, prev.version);
    assert.equal(next.status, 'superseded');
    assert.deepEqual(next.supersededBy, ['rS']);
    assert.deepEqual(next.correctionHistory.slice(0, prev.correctionHistory.length), prev.correctionHistory);
    assert.deepEqual(next.correctionHistory.slice(prev.correctionHistory.length).map((h) => h.kind), ['CONFOUND_ADDED', 'SUPERSEDED']);
    assert.equal(C.contentKey(next), C.contentKey(prev));
    assert.deepEqual(next.evidence.supporting, prev.evidence.supporting);
    const stripped = (d) => { const c = clone(d); ['status', 'supersededBy', 'correctionHistory', 'version', 'updatedAt'].forEach((k) => delete c[k]); c.evidence.confoundsConsidered = []; return c; };
    assert.deepEqual(stripped(next), stripped(prev));
    assert.equal(next.evidence.confoundsConsidered.length, 1);
    assert.equal(next.evidence.confoundsConsidered[0].source, 'user_stated');
  });
  assert.deepEqual(C.validateChangeSet(r.changeSet), { ok: true });
});

test('AC-18: supersede against a terminal, foreign-user or missing predecessor, or with an invalid successor, is rejected', () => {
  const p = create({}, 'rQ1');
  const terminal = upd(T.planRetractRecord({ record: p }, req(), 1200, 'CLIENT', P));
  const foreign = Object.assign(clone(p), { userId: 'u2' });
  const base = (preds, succ) => T.planSupersede({ predecessors: preds, concepts: KNOWN }, req({ predecessorIds: ['rQ1'], successor: succ || draft(), ids: ids(4, { recordId: 'rQS' + (++seq) }) }), 1300, 'CLIENT', P);
  assert.equal(base([terminal]).code, 'INVALID_TRANSITION');
  assert.equal(base([foreign]).code, 'FOREIGN_USER');
  assert.equal(base([]).code, 'NOT_FOUND');
  assert.equal(base([p], draft({ relationDescription: '' })).code, 'TEXT_LENGTH');
  assert.equal(base([p], draft({ factors: [{ conceptId: 'cMissing', role: 'subject' }] })).code, 'UNKNOWN_CONCEPT');
  assert.equal(base([p], Object.assign(draft(), { conceptIds: ['cA'] })).code, 'DERIVED_FIELD_SUPPLIED');
});

// ═══════════════════ Concept Identity (AC-22 … AC-25) ═══════════════════
test('AC-22: merge sets only mergedInto and history; self, cycle, already-merged, cross-user and over-depth merges are rejected', () => {
  const a = concept('mA', ['one']);
  const b = concept('mB', ['two']);
  const r = T.planMergeConcept({ from: b, into: a, getConcept: () => null }, req({ reason: 'same thing' }), 1200, 'CLIENT', P);
  assert.ok(r.ok);
  const merged = r.changeSet.updates[0].doc;
  assert.equal(r.changeSet.creates.length, 0);
  assert.equal(r.changeSet.updates.length, 1, 'no record or other concept is touched');
  assert.equal(merged.mergedInto, 'mA');
  assert.deepEqual(merged.labels, b.labels, 'labels are not moved');
  assert.equal(merged.history.slice(-1)[0].kind, 'MERGED');
  assert.equal(merged.history.slice(-1)[0].into, 'mA');
  assert.equal(T.planMergeConcept({ from: a, into: a, getConcept: () => null }, req(), 1200, 'CLIENT', P).code, 'INVALID_MERGE', 'self');
  assert.equal(T.planMergeConcept({ from: merged, into: concept('mC', ['three']), getConcept: () => null }, req(), 1200, 'CLIENT', P).code, 'INVALID_MERGE', 'already merged');
  const map = { mA: a, mB: merged };
  assert.equal(T.planMergeConcept({ from: a, into: merged, getConcept: (id) => map[id] }, req(), 1200, 'CLIENT', P).code, 'INVALID_MERGE', 'cycle');
  assert.equal(T.planMergeConcept({ from: concept('mF', ['x'], 'u2'), into: a, getConcept: () => null }, req({ userId: 'u2' }), 1200, 'CLIENT', P).code, 'FOREIGN_USER', 'cross-user');
  // Over-depth: a chain of MAX depth below the target.
  const chain = {};
  let prev = concept('d0', ['d0']);
  chain.d0 = prev;
  for (let i = 1; i <= C.LIMITS.MAX_MERGE_CHAIN_DEPTH; i++) {
    const c = Object.assign(concept('d' + i, ['d' + i]), { mergedInto: 'd' + (i - 1) });
    chain['d' + i] = c;
  }
  const deep = chain['d' + C.LIMITS.MAX_MERGE_CHAIN_DEPTH];
  assert.equal(T.planMergeConcept({ from: concept('dX', ['x']), into: deep, getConcept: (id) => chain[id] }, req(), 1200, 'CLIENT', P).code, 'INVALID_MERGE', 'over depth');
});

test('AC-23: resolution and effective labels reflect merges; unmerge restores the exact prior resolution; both events remain', () => {
  const a = concept('nA', ['first label']);
  const b = concept('nB', ['second label']);
  const get = (m) => (id) => m[id] || null;
  assert.equal(C.resolveConceptRoot('nB', get({ nA: a, nB: b })).rootId, 'nB');
  const merged = T.planMergeConcept({ from: b, into: a, getConcept: () => null }, req(), 1200, 'CLIENT', P).changeSet.updates[0].doc;
  assert.equal(C.resolveConceptRoot('nB', get({ nA: a, nB: merged })).rootId, 'nA');
  assert.deepEqual(C.effectiveLabels('nA', [a, merged]), ['first label', 'second label']);
  const unmerged = T.planUnmergeConcept({ concept: merged }, req({ reason: 'actually different' }), 1300, 'CLIENT', P).changeSet.updates[0].doc;
  assert.equal(C.resolveConceptRoot('nB', get({ nA: a, nB: unmerged })).rootId, 'nB');
  assert.deepEqual(C.effectiveLabels('nA', [a, unmerged]), ['first label']);
  assert.deepEqual(unmerged.history.map((h) => h.kind), ['CREATED', 'MERGED', 'UNMERGED']);
  assert.equal(unmerged.history[2].into, 'nA');
  assert.deepEqual(unmerged.labels, b.labels);
  assert.equal(T.planUnmergeConcept({ concept: unmerged }, req(), 1400, 'CLIENT', P).code, 'INVALID_MERGE');
  assert.equal(C.resolveConceptRoot('nX', get({})).code, 'UNKNOWN_CONCEPT');
});

test('AC-24: label removal keeps the label in history; removing the last label is rejected; capacity is enforced', () => {
  const c = concept('lA', ['keep', 'drop']);
  const next = T.planRemoveConceptLabel({ concept: c }, req({ label: 'drop' }), 1200, 'CLIENT', P).changeSet.updates[0].doc;
  assert.deepEqual(next.labels, ['keep']);
  assert.equal(next.history.slice(-1)[0].kind, 'LABEL_REMOVED');
  assert.equal(next.history.slice(-1)[0].label, 'drop');
  assert.equal(T.planRemoveConceptLabel({ concept: next }, req({ label: 'keep' }), 1300, 'CLIENT', P).code, 'LAST_LABEL');
  const added = T.planAddConceptLabel({ concept: next }, req({ label: 'Another  Name' }), 1300, 'CLIENT', P).changeSet.updates[0].doc;
  assert.deepEqual(added.labels, ['keep', 'Another  Name']);
  assert.equal(T.planAddConceptLabel({ concept: added }, req({ label: 'another name' }), 1400, 'CLIENT', P).code, 'NO_CHANGE');
  const fullLabels = Object.assign(clone(c), { labels: Array.from({ length: C.LIMITS.MAX_LABELS_PER_CONCEPT }, (_, i) => 'l' + i) });
  assert.equal(T.planAddConceptLabel({ concept: fullLabels }, req({ label: 'one more' }), 1400, 'CLIENT', P).code, 'CAPACITY_EXCEEDED');
});

test('AC-25: a record referencing an unknown or foreign concept is rejected; a concept created in the same change set is accepted', () => {
  const foreign = concept('fX', ['foreign'], 'u2');
  const withForeign = T.planCreateRecord({ concepts: Object.assign({ fX: foreign }, KNOWN) }, { draft: draft({ factors: [{ conceptId: 'fX', role: 'subject' }] }), userId: 'u1', ids: ids(2, { recordId: 'rF' }) }, 1000, 'CLIENT', P);
  assert.equal(withForeign.code, 'UNKNOWN_CONCEPT');
  assert.equal(T.planCreateRecord({ concepts: KNOWN }, { draft: draft({ factors: [{ conceptId: 'none', role: 'subject' }] }), userId: 'u1', ids: ids(2, { recordId: 'rG' }) }, 1000, 'CLIENT', P).code, 'UNKNOWN_CONCEPT');
  const r = T.planCreateRecord({ concepts: KNOWN }, {
    draft: draft({ factors: [{ newConcept: 0, role: 'subject' }, { conceptId: 'cB', role: 'outcome' }] }),
    newConcepts: [['a brand new idea']],
    userId: 'u1',
    ids: ids(3, { recordId: 'rH', conceptIds: ['cNew'] })
  }, 1000, 'CLIENT', P);
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.changeSet.creates[0].conceptId, 'cNew');
  assert.deepEqual(r.changeSet.creates[1].conceptIds, ['cB', 'cNew']);
  assert.equal(T.planCreateRecord({ concepts: KNOWN }, { draft: draft({ factors: [{ newConcept: 1, role: 'subject' }] }), newConcepts: [['only one']], userId: 'u1', ids: ids(3, { recordId: 'rI', conceptIds: ['cN2'] }) }, 1000, 'CLIENT', P).code, 'INVALID_FACTOR');
});

// ═══════════════════ conceptIds (AC-38 planner half) ═══════════════════
test('AC-38 (planner half): every planner output carries conceptIds derived from factors', () => {
  const r = T.planCreateRecord({ concepts: KNOWN }, {
    draft: draft({ factors: [{ conceptId: 'cD', role: 'subject' }, { conceptId: 'cA', role: 'outcome' }, { conceptId: 'cD', role: 'condition', valueDescription: 'again' }] }),
    userId: 'u1', ids: ids(2, { recordId: 'rJ' })
  }, 1000, 'CLIENT', P);
  assert.deepEqual(r.changeSet.creates[0].conceptIds, ['cA', 'cD']);
  const sup = T.planSupersede({ predecessors: [r.changeSet.creates[0]], concepts: KNOWN }, req({ predecessorIds: ['rJ'], successor: draft({ factors: [{ conceptId: 'cC', role: 'subject' }, { conceptId: 'cB', role: 'outcome' }] }), ids: ids(4, { recordId: 'rK' }) }), 1100, 'CLIENT', P);
  assert.deepEqual(sup.changeSet.creates[0].conceptIds, ['cB', 'cC']);
  assert.deepEqual(sup.changeSet.updates[0].doc.conceptIds, ['cA', 'cD'], 'predecessor index unchanged');
});

// ═══════════════════ INV-UC-S at planner level (AC-57, AC-58, AC-60) ═══════════════════
function inferredActive(recordId, o) {
  const cand = T.planCreateRecord({ concepts: KNOWN }, { draft: draft(Object.assign({ source: 'inferred_pattern', evidence: { supporting: [{ kind: 'DAY_LOG', ref: '2026-06-01' }] } }, o || {})), userId: 'u1', ids: ids(2, { recordId }) }, 1000, 'SERVER', P).changeSet.creates[0];
  return upd(T.planPromoteRecord({ record: promoteReady(cand) }, req(), 1150, 'SERVER', P));
}
function correction(turnId, o) {
  return draft(Object.assign({
    factors: [{ conceptId: 'cD', role: 'condition', valueDescription: 'large' }, { conceptId: 'cB', role: 'outcome' }],
    relationDescription: 'The user says the size was the issue.',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: turnId }] },
    provenance: { originTurnId: turnId }
  }, o || {}));
}
const correct = (preds, request) => T.planCorrectInferredKnowledge({ predecessors: preds, concepts: KNOWN }, Object.assign({ userId: 'u1', ids: ids(8, { recordId: 'rC' + (++seq) }) }, request), 2000, 'SERVER', P);

test('AC-57 (planner): the governed correction commits successor + supersession with userOriginTurnId everywhere; each INV-UC-S violation is rejected', () => {
  const inf = inferredActive('rInf1');
  const ok = correct([inf], { predecessorIds: ['rInf1'], successor: correction('turn9'), userOriginTurnId: 'turn9', confoundsForPredecessors: [{ description: 'the size, not the item', source: 'user_stated' }] });
  assert.ok(ok.ok, JSON.stringify(ok));
  const succ = ok.changeSet.creates[0];
  assert.equal(succ.source, 'user_stated');
  assert.equal(succ.status, 'active');
  assert.equal(succ.evidenceClass, 'EXPLICIT_STATEMENT');
  assert.deepEqual(succ.evidence.supporting.map((r) => r.refId), ['CONVERSATION_TURN:turn9']);
  assert.deepEqual(succ.evidence.contradicting, []);
  assert.deepEqual(succ.supersedes, ['rInf1']);
  const pred = ok.changeSet.updates[0].doc;
  assert.equal(pred.status, 'superseded');
  assert.equal(pred.source, 'inferred_pattern', 'the inferred record stays inferred forever');
  const appended = succ.correctionHistory.concat(pred.correctionHistory.slice(inf.correctionHistory.length));
  appended.forEach((h) => assert.equal(h.userOriginTurnId, 'turn9', h.kind));
  assert.equal(appended.every((h) => h.writer === 'SERVER'), true);

  const us = create({}, 'rUs1');
  const retracted = upd(T.planRetractRecord({ record: inferredActive('rInf2') }, req(), 1300, 'SERVER', P));
  const violations = [
    ['1 user_stated target', [us], { predecessorIds: ['rUs1'], successor: correction('t1'), userOriginTurnId: 't1' }],
    ['1 terminal target', [retracted], { predecessorIds: ['rInf2'], successor: correction('t1'), userOriginTurnId: 't1' }],
    ['1 missing target', [], { predecessorIds: ['rGone'], successor: correction('t1'), userOriginTurnId: 't1' }],
    ['2 missing turn id', [inf], { predecessorIds: ['rInf1'], successor: correction('t1'), userOriginTurnId: null }],
    ['2 malformed turn id', [inf], { predecessorIds: ['rInf1'], successor: correction('t 1'), userOriginTurnId: 't 1' }],
    ['3 non user_stated successor', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { source: 'inferred_pattern', evidenceClass: 'CO_OCCURRENCE' }), userOriginTurnId: 't1' }],
    ['3 originTurnId mismatch', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { provenance: { originTurnId: 't2' } }), userOriginTurnId: 't1' }],
    ['3 anchor ref mismatch', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't2' }] } }), userOriginTurnId: 't1' }],
    ['3 extra inferred evidence', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }, { kind: 'DAY_LOG', ref: '2026-06-01' }] } }), userOriginTurnId: 't1' }],
    ['3 non-turn anchor', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { evidence: { supporting: [{ kind: 'PATTERN_RECORD', ref: 't1' }] } }), userOriginTurnId: 't1' }],
    ['3 contradicting evidence', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }], contradicting: [{ kind: 'DAY_LOG', ref: '2026-06-02' }] } }), userOriginTurnId: 't1' }],
    ['3 inferred confound on successor', [inf], { predecessorIds: ['rInf1'], successor: correction('t1', { evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 't1' }], confoundsConsidered: [{ description: 'x', source: 'inferred_pattern' }] } }), userOriginTurnId: 't1' }],
    ['4 non-user confound for target', [inf], { predecessorIds: ['rInf1'], successor: correction('t1'), userOriginTurnId: 't1', confoundsForPredecessors: [{ description: 'x', source: 'coach_generated' }] }]
  ];
  violations.forEach(([label, preds, request]) => assert.equal(correct(preds, request).code, 'INVALID_USER_CORRECTION', label));
  assert.equal(T.planCorrectInferredKnowledge({ predecessors: [inf], concepts: KNOWN }, { userId: 'u1', predecessorIds: ['rInf1'], successor: correction('t1'), userOriginTurnId: 't1', ids: ids(4, { recordId: 'rZ' }) }, 2000, 'CLIENT', P).code, 'AUTHORITY', 'CLIENT can never run it');
});

test('AC-58 (planner): mixed-authority predecessors are rejected under both authorities', () => {
  const us = create({}, 'rMix1');
  const inf = inferredActive('rMix2');
  ['CLIENT', 'SERVER'].forEach((w) => {
    const succ = w === 'CLIENT' ? draft() : draft({ source: 'inferred_pattern' });
    assert.equal(T.planSupersede({ predecessors: [us, inf], concepts: KNOWN }, req({ predecessorIds: ['rMix1', 'rMix2'], successor: succ, ids: ids(6, { recordId: 'rMS' + w }) }), 2000, w, P).code, 'MIXED_AUTHORITY_PREDECESSORS', w);
  });
});

test('AC-60 (planner): relabeling an inference as user-stated is rejected; generic supersede under SERVER never emits user_stated', () => {
  const inf = inferredActive('rRel1', { factors: [{ conceptId: 'cA', role: 'subject' }, { conceptId: 'cB', role: 'outcome', valueDescription: 'strong' }], relationDescription: 'Same words as the inference.' });
  const copy = correction('t5', { factors: [{ conceptId: 'cB', role: 'outcome', valueDescription: 'strong' }, { conceptId: 'cA', role: 'subject' }], relationDescription: '  Same words as the inference. ' });
  assert.equal(correct([inf], { predecessorIds: ['rRel1'], successor: copy, userOriginTurnId: 't5' }).code, 'CORRECTION_IDENTICAL_TO_PREDECESSOR');
  assert.equal(T.planSupersede({ predecessors: [inf], concepts: KNOWN }, req({ predecessorIds: ['rRel1'], successor: correction('t5'), ids: ids(4, { recordId: 'rGen' }) }), 2000, 'SERVER', P).code, 'AUTHORITY');
  assert.equal(T.planCreateRecord({ concepts: KNOWN }, { draft: draft(), userId: 'u1', ids: ids(2, { recordId: 'rSrv' }) }, 2000, 'SERVER', P).code, 'AUTHORITY');
  assert.equal(T.planCreateRecord({ concepts: KNOWN }, { draft: draft({ source: 'migrated', evidenceClass: 'CO_OCCURRENCE' }), userId: 'u1', ids: ids(2, { recordId: 'rMig' }) }, 2000, 'CLIENT', P).code, 'AUTHORITY', 'migrated is not creatable in E.0.2c');
});
