// WP0 Phase E.0.2c — User Knowledge Record and Concept Identity Foundation: contract tests
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §09-§13, §18, §19, §30). Deterministic; no model call exists anywhere in this Work Item.
// Run with: node --test tests/e02cUserKnowledgeContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const C = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeContract.js'));
const T = require(path.join(ROOT, 'js/coachDecisionSystem/userKnowledgeTransitions.js'));

const P = { producer: 'test.producer', producerVersion: '1.0.0' };
const clone = (o) => JSON.parse(JSON.stringify(o));

function concept(id, labels, userId) {
  const r = T.planCreateConcept({}, { labels, userId: userId || 'u1', ids: { conceptIds: [id], eventIds: ['ev_' + id] } }, 100, 'CLIENT', P);
  assert.ok(r.ok, r.code);
  return r.changeSet.creates[0];
}
const K = { a: concept('cA', ['alpha']), b: concept('cB', ['beta']), c: concept('cC', ['gamma']) };
const KNOWN = { cA: K.a, cB: K.b, cC: K.c };

function draft(overrides) {
  const source = (overrides && overrides.source) || 'user_stated';
  return Object.assign({
    factors: [{ conceptId: 'cB', role: 'subject' }, { conceptId: 'cA', role: 'condition', valueDescription: 'before' }, { conceptId: 'cC', role: 'outcome' }],
    relationDescription: 'An observed association described in open text.',
    evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
    temporality: 'DURABLE',
    confidence: source === 'user_stated' ? 1 : 0.4,
    source,
    safetyFlag: 'STANDARD',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'turn1' }] },
    provenance: { originTurnId: 'turn1' }
  }, overrides || {});
}
function record(overrides, writer) {
  const d = draft(overrides);
  const w = writer || (d.source === 'user_stated' ? 'CLIENT' : 'SERVER');
  const conf = (d.evidence && d.evidence.confoundsConsidered) ? d.evidence.confoundsConsidered.length : 0;
  const r = T.planCreateRecord({ concepts: KNOWN }, {
    draft: d, userId: 'u1', ids: { recordId: 'r1', eventIds: ['e1'], confoundIds: Array.from({ length: conf }, (_, i) => 'cf' + i) }
  }, 1000, w, P);
  assert.ok(r.ok, JSON.stringify(r));
  return r.changeSet.creates[0];
}
const mut = (doc, fn) => { const d = clone(doc); fn(d); return d; };
const code = (doc) => C.validateRecord(doc).code;

// ═══════════════════ Record contract (AC-1 … AC-6) ═══════════════════
test('AC-1: a minimal valid record for each creatable source validates', () => {
  ['user_stated', 'inferred_event', 'inferred_pattern', 'coach_generated'].forEach((s) => {
    const r = record({ source: s });
    assert.deepEqual(C.validateRecord(r), { ok: true }, s);
    assert.equal(r.status, s === 'user_stated' ? 'active' : 'candidate');
  });
});

test('AC-1: every §10.2 rule has a failing fixture with the specified code', () => {
  const r = record();
  const inf = record({ source: 'inferred_pattern' });
  const cases = [
    ['rule 1 unknown key', mut(r, (d) => { d.extra = 1; }), 'UNKNOWN_FIELD'],
    ['rule 1 missing key', mut(r, (d) => { delete d.safetyFlag; }), 'MISSING_FIELD'],
    ['rule 2 closed vocab', mut(r, (d) => { d.temporality = 'FOREVER'; }), 'INVALID_VALUE'],
    ['rule 2 length', mut(r, (d) => { d.relationDescription = 'x'.repeat(401); }), 'TEXT_LENGTH'],
    ['rule 2 normalization', mut(r, (d) => { d.relationDescription = ' padded '; }), 'TEXT_NOT_NORMALIZED'],
    ['rule 3 duplicate factor', mut(r, (d) => { d.factors.push(clone(d.factors[0])); }), 'DUPLICATE_FACTOR'],
    ['rule 3 zero factors', mut(r, (d) => { d.factors = []; d.conceptIds = []; }), 'FACTOR_COUNT'],
    ['rule 4 index mismatch', mut(r, (d) => { d.conceptIds = ['cA']; }), 'CONCEPT_INDEX_MISMATCH'],
    ['rule 5 confidence', mut(r, (d) => { d.confidence = 1.2; }), 'INVALID_CONFIDENCE'],
    ['rule 6 explicit/source', mut(r, (d) => { d.evidenceClass = 'RECURRENCE'; }), 'EVIDENCE_CLASS_SOURCE_MISMATCH'],
    ['rule 7 expiry', mut(r, (d) => { d.expiresAt = 5000; }), 'INVALID_EXPIRY'],
    ['rule 8 timestamps', mut(r, (d) => { d.updatedAt = 10; }), 'INVALID_TIMESTAMPS'],
    ['rule 8 version', mut(r, (d) => { d.version = 0; }), 'INVALID_VERSION'],
    ['rule 9 self link', mut(r, (d) => { d.supersedes = ['r1']; }), 'INVALID_LINKS'],
    ['rule 9 superseded without link', mut(r, (d) => { d.status = 'superseded'; }), 'SUPERSESSION_LINK_MISMATCH'],
    ['rule 10 promotion without confound check', mut(inf, (d) => { d.status = 'active'; }), 'PROMOTION_WITHOUT_CONFOUND_CHECK'],
    ['rule 11 history start', mut(r, (d) => { d.correctionHistory[0].kind = 'PROMOTED'; }), 'INVALID_HISTORY'],
    ['rule 11 empty history', mut(r, (d) => { d.correctionHistory = []; }), 'INVALID_HISTORY'],
    ['rule 12 duplicate ref', mut(r, (d) => { d.evidence.contradicting.push(clone(d.evidence.supporting[0])); }), 'DUPLICATE_REF'],
    ['rule 12 confound shape', mut(r, (d) => { d.evidence.confoundsConsidered.push({ confoundId: 'x1', conceptId: null, description: null, source: 'user_stated', addedAt: 1 }); }), 'INVALID_CONFOUND']
  ];
  cases.forEach(([label, doc, expected]) => assert.equal(code(doc), expected, label));
});

test('AC-2: unknown top-level and nested keys are rejected (no causal/truth/taxonomy field can exist)', () => {
  const r = record();
  ['causal', 'isTrue', 'verified', 'claimType', 'category', 'domain', 'topic', 'causes'].forEach((k) => {
    assert.equal(code(mut(r, (d) => { d[k] = true; })), 'UNKNOWN_FIELD', k);
    assert.equal(code(mut(r, (d) => { d.factors[0][k] = true; })), 'UNKNOWN_FIELD', 'factor.' + k);
    assert.equal(code(mut(r, (d) => { d.evidence[k] = true; })), 'UNKNOWN_FIELD', 'evidence.' + k);
    assert.equal(code(mut(r, (d) => { d.evidence.supporting[0][k] = true; })), 'UNKNOWN_FIELD', 'ref.' + k);
    assert.equal(code(mut(r, (d) => { d.provenance[k] = true; })), 'UNKNOWN_FIELD', 'provenance.' + k);
    assert.equal(code(mut(r, (d) => { d.correctionHistory[0][k] = true; })), 'UNKNOWN_FIELD', 'history.' + k);
  });
});

test('AC-3: EXPLICIT_STATEMENT is reserved to user_stated, and user_stated always carries it', () => {
  ['inferred_event', 'inferred_pattern', 'coach_generated', 'migrated'].forEach((s) => {
    assert.equal(code(mut(record({ source: 'inferred_pattern' }), (d) => { d.source = s; d.evidenceClass = 'EXPLICIT_STATEMENT'; })), 'EVIDENCE_CLASS_SOURCE_MISMATCH', s);
  });
  ['SINGLE_OBSERVATION', 'CO_OCCURRENCE', 'RECURRENCE'].forEach((ec) => {
    assert.equal(code(mut(record(), (d) => { d.evidenceClass = ec; })), 'EVIDENCE_CLASS_SOURCE_MISMATCH', ec);
  });
});

test('AC-4: duplicate factors, 0 and 9 factors, over-length texts and un-normalized text are rejected', () => {
  const r = record();
  assert.equal(code(mut(r, (d) => { d.factors.push(clone(d.factors[1])); })), 'DUPLICATE_FACTOR');
  assert.equal(code(mut(r, (d) => { d.factors = []; d.conceptIds = []; })), 'FACTOR_COUNT');
  assert.equal(code(mut(r, (d) => {
    d.factors = Array.from({ length: 9 }, (_, i) => ({ conceptId: 'cA', role: 'subject', valueDescription: 'v' + i }));
    d.conceptIds = ['cA'];
  })), 'FACTOR_COUNT');
  assert.equal(code(mut(r, (d) => { d.factors[0].valueDescription = 'v'.repeat(161); })), 'TEXT_LENGTH');
  assert.equal(code(mut(r, (d) => { d.factors[0].valueDescription = 'é'; })), 'TEXT_NOT_NORMALIZED');
  assert.equal(code(mut(r, (d) => { d.relationDescription = ''; })), 'TEXT_LENGTH');
  assert.equal(code(mut(r, (d) => { d.relationDescription = 'x'.repeat(400); })), undefined);
});

test('AC-5: DURABLE with expiresAt, and expiresAt ≤ createdAt, are rejected', () => {
  assert.equal(code(mut(record(), (d) => { d.expiresAt = 99999; })), 'INVALID_EXPIRY');
  const tmp = record({ temporality: 'TEMPORARY', expiresAt: 5000 });
  assert.deepEqual(C.validateRecord(tmp), { ok: true });
  assert.equal(code(mut(tmp, (d) => { d.expiresAt = d.createdAt; })), 'INVALID_EXPIRY');
  assert.deepEqual(C.validateRecord(record({ temporality: 'TEMPORARY' })), { ok: true }, 'TEMPORARY with unknown expiry is valid');
  assert.deepEqual(C.validateRecord(record({ temporality: 'RECURRING_WINDOW' })), { ok: true });
});

test('AC-6: superseded ⇔ supersededBy non-empty', () => {
  const r = record();
  assert.equal(code(mut(r, (d) => { d.status = 'superseded'; })), 'SUPERSESSION_LINK_MISMATCH');
  assert.equal(code(mut(r, (d) => { d.supersededBy = ['r9']; })), 'SUPERSESSION_LINK_MISMATCH');
  assert.deepEqual(C.validateRecord(mut(r, (d) => { d.status = 'superseded'; d.supersededBy = ['r9']; })), { ok: true });
});

// ═══════════════════ Evidence (AC-7, AC-9, AC-10) ═══════════════════
test('AC-7: evidence refs reject whitespace/prose and over-length refs; refIds are unique across both lists', () => {
  ['has space', 'quote"d', 'a'.repeat(201), '', 'line\nbreak'].forEach((ref) => {
    assert.equal(C.validateEvidenceRefDraft({ kind: 'CONVERSATION_TURN', ref }, 'r') !== null, true, JSON.stringify(ref));
    assert.equal(code(mut(record(), (d) => { d.evidence.supporting[0].ref = ref; d.evidence.supporting[0].refId = 'CONVERSATION_TURN:' + ref; })), 'INVALID_EVIDENCE_REF');
  });
  assert.equal(code(mut(record(), (d) => { d.evidence.supporting[0].refId = 'CONVERSATION_TURN:other'; })), 'INVALID_EVIDENCE_REF');
  assert.equal(code(mut(record(), (d) => { d.evidence.contradicting.push(clone(d.evidence.supporting[0])); })), 'DUPLICATE_REF');
  assert.equal(code(mut(record(), (d) => { d.evidence.supporting[0].kind = 'WEBSITE'; })), 'INVALID_EVIDENCE_REF');
  assert.equal(code(mut(record(), (d) => { d.evidence.supporting[0].text = 'copied content'; })), 'UNKNOWN_FIELD');
});

function withAvail(rec, list, avail, reason) {
  return mut(rec, (d) => {
    d.evidence[list].forEach((ref) => {
      ref.availability = avail;
      ref.availabilityCheckedAt = avail === 'UNVERIFIED' ? null : 2000;
      ref.unresolvableReason = avail === 'UNRESOLVABLE' ? (reason || 'NOT_FOUND') : null;
    });
    d.updatedAt = 2000;
  });
}

test('AC-9: evidenceStanding / isUsableKnowledge — inferred loses usability, user-stated stays explicit (PD-1)', () => {
  const inf = mut(record({ source: 'inferred_pattern' }), (d) => {
    d.status = 'active';
    d.evidence.confoundCheck = { performedAt: 1000, producer: 'test.producer', producerVersion: '1.0.0' };
  });
  assert.equal(C.evidenceStanding(inf).basis, 'UNVERIFIED');
  assert.equal(C.isUsableKnowledge(inf, 1500), true);
  const infLost = withAvail(inf, 'supporting', 'UNRESOLVABLE');
  assert.deepEqual(C.validateRecord(infLost), { ok: true });
  assert.equal(C.evidenceStanding(infLost).basis, 'UNSUPPORTED');
  assert.equal(C.isUsableKnowledge(infLost, 2500), false, 'inferred with no remaining support is not usable');
  assert.equal(infLost.status, 'active', 'status is not changed by the view');

  const mixed = mut(inf, (d) => {
    d.evidence.supporting.push({ refId: 'DAY_LOG:2026-07-01', kind: 'DAY_LOG', ref: '2026-07-01', observedAt: null, addedAt: 1000, availability: 'RESOLVABLE', availabilityCheckedAt: 1500, unresolvableReason: null });
    d.evidence.supporting[0].availability = 'UNRESOLVABLE';
    d.evidence.supporting[0].availabilityCheckedAt = 1500;
    d.evidence.supporting[0].unresolvableReason = 'USER_DELETED';
    d.updatedAt = 1500;
  });
  assert.equal(C.evidenceStanding(mixed).basis, 'SUPPORTED');
  assert.equal(C.evidenceStanding(mixed).supportingUnresolvable, 1);

  const us = record();
  const usLost = withAvail(us, 'supporting', 'UNRESOLVABLE');
  const st = C.evidenceStanding(usLost);
  assert.equal(st.basis, 'EXPLICIT');
  assert.equal(st.statementReferenceUnresolvable, true);
  assert.equal(C.isUsableKnowledge(usLost, 2500), true, 'user-stated knowledge remains usable');
  assert.equal(C.evidenceStanding(us).statementReferenceUnresolvable, false);

  const recovered = withAvail(infLost, 'supporting', 'RESOLVABLE');
  assert.equal(C.evidenceStanding(recovered).basis, 'SUPPORTED');
});

test('AC-10: the unresolvable reason never changes any derived view', () => {
  const inf = mut(record({ source: 'inferred_event' }), (d) => { d.status = 'active'; d.evidence.confoundCheck = { performedAt: 1000, producer: 'p', producerVersion: '1' }; });
  const us = record();
  const views = (r) => JSON.stringify([C.evidenceStanding(r), C.isUsableKnowledge(r, 3000), C.isExplicit(r), C.epistemicOrigin(r), C.isContextual(r)]);
  [inf, us].forEach((base) => {
    const outcomes = C.UNRESOLVABLE_REASONS.map((reason) => views(withAvail(base, 'supporting', 'UNRESOLVABLE', reason)));
    assert.equal(new Set(outcomes).size, 1);
  });
});

// ═══════════════════ Concept Identity contract (AC-21) ═══════════════════
test('AC-21: concept labels accept any language and reject duplicates under normalizeLabelKey', () => {
  const he = concept('cH', ['פסטה', 'ארוחת ערב']);
  assert.deepEqual(C.validateConcept(he), { ok: true });
  assert.deepEqual(C.validateConcept(concept('cE', ['Spaghetti  Night'])), { ok: true });
  assert.equal(C.validateConcept(mut(he, (d) => { d.labels.push('פסטה'); })).code, 'DUPLICATE_LABEL');
  assert.equal(C.validateConcept(mut(concept('cX', ['Alpha']), (d) => { d.labels.push('  alpha'.trim().toUpperCase()); })).code, 'DUPLICATE_LABEL');
  assert.equal(C.normalizeLabelKey('  Mixed   Case\tLabel '), 'mixed case label');
  const r = T.planCreateConcept({}, { labels: ['one', 'ONE'], userId: 'u1', ids: { conceptIds: ['cz'], eventIds: ['ez'] } }, 1, 'CLIENT', P);
  assert.equal(r.code, 'DUPLICATE_LABEL');
  assert.equal(C.validateConcept(mut(he, (d) => { d.category = 'food'; })).code, 'UNKNOWN_FIELD', 'no ontology/category field');
});

// ═══════════════════ Proposal helper (AC-30) ═══════════════════
test('AC-30: validateFactorProposal accepts only literal presented ids and valid new labels; no side effect', () => {
  const presented = [{ conceptId: 'cA', labels: ['alpha'] }, { conceptId: 'cB', labels: ['beta'] }];
  const frozen = JSON.stringify(presented);
  const good = C.validateFactorProposal({ factors: [
    { conceptId: 'cA', role: 'subject' },
    { newConceptLabel: '  new thing ', role: 'outcome', valueDescription: 'strong' },
    { newConceptLabel: 'NEW THING', role: 'condition' }
  ] }, presented);
  assert.equal(good.ok, true);
  assert.deepEqual(good.newConceptLabels, ['new thing']);
  assert.deepEqual(good.factors.map((f) => f.conceptId || ('new:' + f.newConcept)), ['cA', 'new:0', 'new:0']);
  ['cZ', 'ca', 'CA', ' cA', 'cB '].forEach((id) => {
    assert.equal(C.validateFactorProposal({ factors: [{ conceptId: id, role: 'subject' }] }, presented).code, 'UNKNOWN_CONCEPT', id);
  });
  assert.equal(C.validateFactorProposal({ factors: [{ conceptId: 'cA', role: 'cause' }] }, presented).code, 'INVALID_VALUE');
  assert.equal(C.validateFactorProposal({ factors: [{ conceptId: 'cA', newConceptLabel: 'x', role: 'subject' }] }, presented).code, 'INVALID_FACTOR');
  assert.equal(C.validateFactorProposal({ factors: [{ conceptId: 'cA', role: 'subject' }], extra: 1 }, presented).code, 'UNKNOWN_FIELD');
  assert.equal(JSON.stringify(presented), frozen, 'inputs untouched');
});

// ═══════════════════ Derived views (AC-33) ═══════════════════
test('AC-33: each derived view matches its definition and never reads prose or label text', () => {
  const us = record();
  const inf = record({ source: 'inferred_pattern' });
  const coach = record({ source: 'coach_generated' });
  const ev = record({ source: 'inferred_event' });
  assert.equal(C.epistemicOrigin(us), 'USER_STATED');
  assert.equal(C.epistemicOrigin(inf), 'FITME_INFERRED');
  assert.equal(C.epistemicOrigin(ev), 'FITME_INFERRED');
  assert.equal(C.epistemicOrigin(coach), 'COACH_GENERATED');
  assert.equal(C.epistemicOrigin(mut(us, (d) => { d.source = 'migrated'; })), 'MIGRATED');
  assert.equal(C.isExplicit(us), true);
  assert.equal(C.isExplicit(inf), false);
  assert.equal(C.isExplicit(mut(us, (d) => { d.status = 'rejected'; })), false);
  assert.equal(C.isContextual(us), true);
  assert.equal(C.isContextual(mut(us, (d) => { d.factors = d.factors.filter((f) => f.role !== 'condition'); })), false);
  const tmp = record({ temporality: 'TEMPORARY', expiresAt: 5000 });
  assert.equal(C.isExpired(tmp, 4999), false);
  assert.equal(C.isExpired(tmp, 5000), true);
  assert.equal(C.isUsableKnowledge(tmp, 5000), false);
  assert.equal(C.isUsableKnowledge(inf, 1500), false, 'candidate is not usable');
  // Views are independent of prose and labels.
  const views = (r) => JSON.stringify([C.epistemicOrigin(r), C.isExplicit(r), C.isContextual(r), C.isExpired(r, 3000), C.evidenceStanding(r), C.isUsableKnowledge(r, 3000)]);
  [us, inf, tmp].forEach((r) => {
    assert.equal(views(r), views(mut(r, (d) => { d.relationDescription = 'completely different words'; d.factors.forEach((f) => { f.valueDescription = f.valueDescription === null ? null : 'other'; }); })));
  });
  const concepts = [concept('k1', ['one']), mut(concept('k2', ['two']), (d) => { d.mergedInto = 'k1'; })];
  const relabeled = concepts.map((c) => mut(c, (d) => { d.labels = d.labels.map((l) => l + ' renamed'); }));
  assert.deepEqual(C.resolveConceptRoot('k2', (id) => concepts.find((c) => c.conceptId === id)), C.resolveConceptRoot('k2', (id) => relabeled.find((c) => c.conceptId === id)));
});

// ═══════════════════ conceptIds derived index (AC-38 contract half) ═══════════════════
test('AC-38: deriveConceptIds is distinct, exact-match and code-unit ordered (no case folding)', () => {
  const factors = [{ conceptId: 'b' }, { conceptId: 'B' }, { conceptId: 'a' }, { conceptId: 'b' }, { conceptId: '_x' }, { conceptId: '9' }];
  assert.deepEqual(C.deriveConceptIds(factors), ['9', 'B', '_x', 'a', 'b']);
  const r = record();
  assert.deepEqual(r.conceptIds, C.deriveConceptIds(r.factors));
  assert.deepEqual(r.conceptIds, ['cA', 'cB', 'cC']);
});

test('AC-39 (contract half): a draft carrying conceptIds is rejected; stored index divergence of any kind is rejected', () => {
  assert.equal(C.validateRecordDraft(Object.assign(draft(), { conceptIds: ['cA'] }), 0).code, 'DERIVED_FIELD_SUPPLIED');
  const r = record();
  [['omit', ['cA', 'cB']], ['add', ['cA', 'cB', 'cC', 'cD']], ['reorder', ['cC', 'cB', 'cA']], ['duplicate', ['cA', 'cA', 'cB', 'cC']]].forEach(([label, ids]) => {
    assert.equal(code(mut(r, (d) => { d.conceptIds = ids; })), 'CONCEPT_INDEX_MISMATCH', label);
  });
});

test('AC-34 (contract half): exported vocabularies are exactly §09.1', () => {
  assert.deepEqual(C.FACTOR_ROLES, ['condition', 'subject', 'outcome']);
  assert.deepEqual(C.EVIDENCE_CLASSES, ['SINGLE_OBSERVATION', 'CO_OCCURRENCE', 'RECURRENCE', 'EXPLICIT_STATEMENT']);
  assert.deepEqual(C.TEMPORALITIES, ['DURABLE', 'TEMPORARY', 'RECURRING_WINDOW']);
  assert.deepEqual(C.STATUSES, ['candidate', 'active', 'superseded', 'rejected', 'archived']);
  assert.deepEqual(C.SOURCES, ['user_stated', 'inferred_event', 'inferred_pattern', 'coach_generated', 'migrated']);
  assert.deepEqual(C.SAFETY_FLAGS, ['STANDARD', 'SAFETY_ADJACENT']);
  assert.deepEqual(C.WRITER_AUTHORITIES, ['CLIENT', 'SERVER']);
  assert.deepEqual(C.EVIDENCE_REF_KINDS, ['CONVERSATION_TURN', 'DAY_LOG', 'TYPED_MEMORY_RECORD', 'HABIT_RECORD', 'PATTERN_RECORD', 'USER_KNOWLEDGE_RECORD']);
  assert.deepEqual(C.EVIDENCE_AVAILABILITY, ['UNVERIFIED', 'RESOLVABLE', 'UNRESOLVABLE']);
  assert.deepEqual(C.UNRESOLVABLE_REASONS, ['NOT_FOUND', 'USER_DELETED', 'USER_RESET', 'RETENTION', 'SOURCE_REMOVED', 'PRIVACY_ACTION']);
  assert.deepEqual(C.RECORD_HISTORY_KINDS, ['CREATED', 'PROMOTED', 'RETRACTED', 'SUPERSEDED', 'ARCHIVED', 'EVIDENCE_ADDED', 'EVIDENCE_AVAILABILITY_CHANGED', 'CONFOUND_ADDED', 'CONFOUND_CHECK_RECORDED', 'CONFIDENCE_CHANGED', 'SAFETY_FLAG_RAISED']);
  assert.deepEqual(C.CONCEPT_HISTORY_KINDS, ['CREATED', 'LABEL_ADDED', 'LABEL_REMOVED', 'MERGED', 'UNMERGED']);
  assert.equal(C.LIMITS.MAX_FACTORS, 8);
  assert.equal(C.LIMITS.MAX_HISTORY_ENTRIES, 256);
  assert.equal(C.LIMITS.MAX_MERGE_CHAIN_DEPTH, 16);
  [C.FACTOR_ROLES, C.SOURCES, C.STATUSES, C.LIMITS].forEach((v) => assert.equal(Object.isFrozen(v), true));
});
