// WP0 Phase E.0.2d — Consolidation Contract
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §09, §10, §16, §21, §22; AC-D1, AC-D27,
// AC-D46). Pure contract tests; no model, store or port.
// Run with: node --test tests/e02dConsolidationContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CC = require(path.join(ROOT, 'js/coachDecisionSystem/consolidationContract.js'));
const Consolidation = require(path.join(ROOT, 'js/coachDecisionSystem/consolidation.js'));

const desc = (o) => Object.assign({ sourceId: 'conversationTurns', evidenceRefKind: 'CONVERSATION_TURN', sensitivityTier: 'STANDARD', consentScope: null, protectedSource: false, description: 'Turns.' }, o);
const seg = (o) => Object.assign({ segmentId: 's1', authorship: 'USER_AUTHORED', text: 'hello', data: null }, o);
const obs = (o) => Object.assign({ ref: { kind: 'CONVERSATION_TURN', ref: 't1' }, sourceId: 'conversationTurns', observedAt: 10, localDate: null, localTime: null, utcOffsetMinutes: null, segments: [seg()] }, o);

test('§09 / AC-D1: the governed-consumer declaration is frozen, NOT_AUTHORIZED, and validated fail-closed', () => {
  assert.deepEqual(CC.CONSUMER_DECLARATION, { consumerId: 'E02D_CONSOLIDATION', consumerType: 'GOVERNED_BACKGROUND_PROCESS', capabilityRiskTier: 'ELEVATED', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' });
  assert.equal(Object.isFrozen(CC.CONSUMER_DECLARATION), true);
  const valid = Consolidation._internal.isValidConsumerDeclaration;
  assert.equal(valid(CC.CONSUMER_DECLARATION), true);
  assert.equal(valid(Object.assign({}, CC.CONSUMER_DECLARATION, { sensitiveContextAccessPolicy: 'AUTHORIZED' })), false);
  assert.equal(valid(Object.assign({}, CC.CONSUMER_DECLARATION, { capabilityRiskTier: 'HIGH' })), false);
  assert.equal(valid(Object.assign({}, CC.CONSUMER_DECLARATION, { consumerType: 'CAPABILITY' })), false);
  assert.equal(valid(null), false);
});

test('§10.1: source descriptor validation (exact keys, closed tiers, boolean protectedSource, bounded description)', () => {
  assert.equal(CC.isValidDescriptor(desc()), true);
  assert.equal(CC.isValidDescriptor(desc({ evidenceRefKind: 'SOMETHING' })), false);
  assert.equal(CC.isValidDescriptor(desc({ sensitivityTier: 'HIGH' })), false);
  assert.equal(CC.isValidDescriptor(desc({ protectedSource: 'no' })), false);
  assert.equal(CC.isValidDescriptor(desc({ description: '' })), false);
  assert.equal(CC.isValidDescriptor(desc({ description: 'x'.repeat(401) })), false);
  assert.equal(CC.isValidDescriptor(Object.assign(desc(), { extra: 1 })), false);
  assert.equal(CC.isValidDescriptor(desc({ sourceId: 'has space' })), false);
});

test('§10.2: observation and segment validation; time fields are shape-checked, never converted', () => {
  assert.equal(CC.isValidObservation(obs()), true);
  assert.equal(CC.isValidObservation(obs({ localDate: '2026-03-03', localTime: '7:05', observedAt: null })), true);
  assert.equal(CC.isValidObservation(obs({ localDate: '03/03/2026' })), false);
  assert.equal(CC.isValidObservation(obs({ observedAt: -1 })), false);
  assert.equal(CC.isValidObservation(obs({ utcOffsetMinutes: 5000 })), false);
  assert.equal(CC.isValidObservation(obs({ segments: [] })), false);
  assert.equal(CC.isValidObservation(obs({ segments: Array.from({ length: 13 }, (_, i) => seg({ segmentId: 's' + i })) })), false);
  assert.equal(CC.isValidObservation(obs({ segments: [seg(), seg()] })), false); // duplicate segment ids
  assert.equal(CC.isValidObservation(obs({ ref: { kind: 'CONVERSATION_TURN', ref: 'has space' } })), false);
  assert.equal(CC.isValidSegment(seg({ text: 'x', data: [{ label: 'a', value: 1, unit: null }] })), false); // both
  assert.equal(CC.isValidSegment(seg({ text: null, data: null })), false); // neither
  assert.equal(CC.isValidSegment(seg({ text: null, data: [{ label: 'kcal', value: 512, unit: 'kcal' }] })), true);
  assert.equal(CC.isValidSegment(seg({ text: null, data: [{ label: 'x', value: NaN, unit: null }] })), false);
  assert.equal(CC.isValidSegment(seg({ authorship: 'SOMEONE' })), false);
  assert.equal(CC.isValidSegment(seg({ text: 'x'.repeat(2001) })), false);
});

test('§10.3: ownership claims and Typed Memory references are closed shapes; references never carry a Safety claimant', () => {
  const claim = { ref: { kind: 'CONVERSATION_TURN', ref: 't1' }, claimant: 'SAFETY_INTAKE', recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: 'm1' } };
  assert.equal(CC.isValidClaim(claim), true);
  assert.equal(CC.isValidClaim(Object.assign({}, claim, { claimant: 'USER_STATED_USER_KNOWLEDGE' })), false);
  assert.equal(CC.isValidClaim(Object.assign({}, claim, { recordRef: { kind: 'USER_KNOWLEDGE_RECORD', ref: 'r1' } })), false);
  const tm = { recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: 'm1' }, claimant: 'CPI_PREFERENCE', claimedObservationRefs: [{ kind: 'CONVERSATION_TURN', ref: 't1' }], segments: [seg()] };
  assert.equal(CC.isValidTypedMemoryReference(tm), true);
  assert.equal(CC.isValidTypedMemoryReference(Object.assign({}, tm, { claimant: 'SAFETY_INTAKE' })), false);
});

test('§05 signature: sorted multiset of (root, role); new concepts are their own identity', () => {
  const rootOf = (id) => ({ a: 'R', b: 'R', c: 'C' })[id];
  assert.equal(CC.signature([{ conceptId: 'a', role: 'subject' }, { conceptId: 'c', role: 'outcome' }], rootOf),
    CC.signature([{ conceptId: 'c', role: 'outcome' }, { conceptId: 'b', role: 'subject' }], rootOf));
  assert.notEqual(CC.signature([{ conceptId: 'a', role: 'subject' }], rootOf), CC.signature([{ conceptId: 'a', role: 'outcome' }], rootOf));
  assert.notEqual(CC.signature([{ newKey: 'r', role: 'subject' }], rootOf), CC.signature([{ conceptId: 'a', role: 'subject' }], () => 'r'));
});

test('AC-D27 (contract): literal overlap at, below and above the bound; containment; normalization', () => {
  const u = ['Twenty-four characters!! and more'];
  assert.equal(CC.literalOverlap(['zz twenty-four characters!! zz'], u, 24), true);  // 24 shared
  assert.equal(CC.literalOverlap(['zz twenty-four characters! zz'], u, 24), false);  // 23 shared
  assert.equal(CC.literalOverlap(['a b'], ['A   B'], 24), true);                      // wholly contained (short user text)
  assert.equal(CC.literalOverlap(['TWENTY-FOUR\tCHARACTERS!!  and'], u, 24), true);  // case and whitespace normalized
  assert.equal(CC.literalOverlap([null, 'x'], [undefined, ''], 24), false);
});

test('AC-D46: isConfidenceAssessed is true only with a CONFIDENCE_CHANGED history entry; reads no confidence value', () => {
  assert.equal(CC.isConfidenceAssessed({ confidence: 0.9, correctionHistory: [{ kind: 'CREATED' }] }), false);
  assert.equal(CC.isConfidenceAssessed({ confidence: 0, correctionHistory: [{ kind: 'CREATED' }, { kind: 'CONFIDENCE_CHANGED' }] }), true);
  assert.equal(CC.isConfidenceAssessed(null), false);
  assert.equal(CC.BOOTSTRAP_CONFIDENCE, 0);
});

test('§17 / §14.1: source from evidence class; arithmetic ISO-UTC rendering without a clock', () => {
  assert.equal(CC.sourceForEvidenceClass('RECURRENCE'), 'inferred_pattern');
  assert.equal(CC.sourceForEvidenceClass('SINGLE_OBSERVATION'), 'inferred_event');
  assert.equal(CC.sourceForEvidenceClass('CO_OCCURRENCE'), 'inferred_event');
  for (const ms of [0, 951782400000, 1709251199999, 1772582400123, 4102444800000]) assert.equal(CC.epochToIsoUtc(ms), new Date(ms).toISOString());
  assert.equal(CC.epochToIsoUtc(-5), null);
});

test('§12 / §28: closed vocabularies are process/governance only; V1 scope is exactly Conversation + Day Logs', () => {
  assert.deepEqual(CC.V1_OBSERVATION_REF_KINDS, ['CONVERSATION_TURN', 'DAY_LOG']);
  assert.deepEqual(CC.OPERATIONS, ['CREATE', 'APPEND_EVIDENCE', 'SUPERSEDE']);
  assert.deepEqual(CC.OWNER_STATUSES, ['active', 'superseded', 'rejected', 'archived']);
  assert.deepEqual(CC.CLAIMANTS, ['SAFETY_INTAKE', 'CPI_PREFERENCE', 'USER_STATED_TYPED_MEMORY']);
  assert.equal(CC.PRODUCER.producer, 'e02d.consolidation');
});
