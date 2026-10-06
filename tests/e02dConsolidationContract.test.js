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
  assert.equal(CC.PRODUCER.producerVersion, '1.0.0'); // v1.1 keeps the canonical producerVersion (§17)
});

// ═══ v1.1 contract (SPEC v1.1 §10.2, §14.4, §15.2, §15.5, §16.5, §20.2, §25) ═══

test('AC-D57 (contract): segment-level time is optional, absent equals null, and a non-null value must be well-formed', () => {
  assert.equal(CC.isValidSegment(seg()), true); // the v1.0 four-key segment stays valid
  assert.equal(CC.isValidSegment(seg({ localDate: null, localTime: null, utcOffsetMinutes: null })), true);
  assert.equal(CC.isValidSegment(seg({ localTime: '22:40' })), true);
  assert.equal(CC.isValidSegment(seg({ localDate: '2026-01-02', utcOffsetMinutes: 120 })), true);
  assert.equal(CC.isValidSegment(seg({ localTime: '10pm' })), false);
  assert.equal(CC.isValidSegment(seg({ localDate: '02/01/2026' })), false);
  assert.equal(CC.isValidSegment(seg({ utcOffsetMinutes: 5000 })), false);
  assert.equal(CC.isValidSegment(seg({ observedAt: 5 })), false); // no segment-level instant exists
  assert.equal(CC.isValidSegment(seg({ extra: 1 })), false);
  assert.equal(CC.segmentTime(seg(), 'localTime'), null);
  assert.equal(CC.segmentTime(seg({ localTime: '7:05' }), 'localTime'), '7:05');
  assert.equal(CC.isValidObservation(obs({ segments: [seg({ localTime: '22:40' })] })), true);
  assert.equal(CC.isValidObservation(obs({ segments: [seg({ localTime: 'late' })] })), false);
});

const F = (o) => Object.assign({ conceptKey: 'k1', newConceptLabel: null, role: 'subject', valueText: null }, o);
const anchor = (o) => Object.assign({ kind: 'SOURCE_TIME', obsKey: 'o1', segmentId: null, field: 'LOCAL_DATE' }, o);
const G = (o) => Object.assign({ recurrence: { form: 'OBSERVED', anchors: [anchor()] }, window: { form: 'SOURCE_LOCAL', anchors: [anchor()] } }, o);
const CREATE = (o) => Object.assign({ operation: 'CREATE', factors: [F()], relationText: 'An association.', evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE',
  grounding: null, supporting: ['o1'], contradicting: [], reference: null, restatesUserStatement: false, safetyAdjacent: false }, o);
const APPEND = (o) => Object.assign({ operation: 'APPEND_EVIDENCE', target: 'r1', list: 'supporting', observations: ['o1'], restatesUserStatement: false, safetyAdjacent: false }, o);

test('AC-D55 (contract): each operation has exactly its own key set; type, bound and vocabulary violations are malformed', () => {
  assert.equal(CC.isValidProposalShape(CREATE()), true);
  assert.equal(CC.isValidProposalShape(Object.assign(CREATE({ operation: 'SUPERSEDE' }), { target: 'r1' })), true);
  assert.equal(CC.isValidProposalShape(APPEND()), true);
  // a key of another operation, a missing key, an extra key
  assert.equal(CC.isValidProposalShape(Object.assign(APPEND(), { factors: null })), false);
  assert.equal(CC.isValidProposalShape(Object.assign(CREATE(), { target: 'r1' })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ operation: 'SUPERSEDE' })), false);
  const noRef = CREATE(); delete noRef.reference;
  assert.equal(CC.isValidProposalShape(noRef), false);
  assert.equal(CC.isValidProposalShape(Object.assign(CREATE(), { confidence: 0.9 })), false);
  // vocabularies and types
  assert.equal(CC.isValidProposalShape(CREATE({ operation: 'DELETE' })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ evidenceClass: 'EXPLICIT_STATEMENT' })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ temporality: 'FOREVER' })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ restatesUserStatement: 'false' })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ safetyAdjacent: undefined })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ supporting: [1] })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ factors: [] })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ factors: Array.from({ length: 9 }, () => F()) })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ factors: [F({ role: 'cause' })] })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ factors: [Object.assign(F(), { conceptId: 'c1' })] })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ reference: { uKey: 'u1', factorIndex: -1 } })), false);
  assert.equal(CC.isValidProposalShape(CREATE({ reference: { uKey: 'u1', factorIndex: 0 } })), true);
  assert.equal(CC.isValidProposalShape(APPEND({ list: 'both' })), false);
  assert.equal(CC.isValidProposalShape(APPEND({ observations: [] })), false);
  assert.equal(CC.isValidProposalShape(APPEND({ target: null })), false);
  assert.equal(CC.readableOperation(APPEND({ list: 'both' })), 'APPEND_EVIDENCE');
  assert.equal(CC.readableOperation({ operation: 'X' }), null);
  assert.equal(CC.readableOperation('text'), null);
});

test('AC-D56 (contract): grounding shape — closed process forms and anchor kinds, bounded anchors and expression text', () => {
  assert.equal(CC.isValidProposalShape(CREATE({ temporality: 'RECURRING_WINDOW', grounding: G() })), true);
  assert.equal(CC.isValidGroundingShape(G({ recurrence: { form: 'STATED', anchors: [{ kind: 'USER_EXPRESSION', obsKey: 'o1', segmentId: 'user', text: 'every evening' }] } })), true);
  assert.equal(CC.isValidGroundingShape(G({ recurrence: { form: 'SOURCE', anchors: [{ kind: 'SOURCE_RECURRENCE', obsKey: 'o1', segmentId: null }] } })), true); // reserved; the gate rejects it
  assert.equal(CC.isValidGroundingShape(G({ recurrence: { form: 'WEEKLY', anchors: [anchor()] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'OBSERVED', anchors: [anchor()] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'SOURCE_LOCAL', anchors: [] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'SOURCE_LOCAL', anchors: Array.from({ length: 9 }, () => anchor()) } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'SOURCE_LOCAL', anchors: [anchor({ field: 'DAYPART' })] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'STATED', anchors: [{ kind: 'USER_EXPRESSION', obsKey: 'o1', segmentId: null, text: 'x' }] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'STATED', anchors: [{ kind: 'USER_EXPRESSION', obsKey: 'o1', segmentId: 's', text: 'x'.repeat(121) }] } })), false);
  assert.equal(CC.isValidGroundingShape(G({ window: { form: 'STATED', anchors: [{ kind: 'EVENT', obsKey: 'o1', segmentId: 's' }] } })), false);
  // the vocabularies describe where grounding lives, never an event or life situation
  assert.deepEqual(CC.RECURRENCE_FORMS, ['OBSERVED', 'STATED', 'SOURCE']);
  assert.deepEqual(CC.WINDOW_FORMS, ['SOURCE_LOCAL', 'SEQUENCE', 'STATED', 'SOURCE']);
  assert.deepEqual(CC.ANCHOR_KINDS, ['SOURCE_TIME', 'USER_EXPRESSION', 'SOURCE_RECURRENCE']);
});

test('§15.5 / §16.5 (contract): verdict bodies, fixed applicability, fixed failure order; UNCERTAIN never passes', () => {
  const V = (o) => Object.assign({ item: 'p1', restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'FAITHFUL', direction: 'NOT_APPLICABLE' }, o);
  const VA = (o) => V(Object.assign({ unsupported: 'NOT_APPLICABLE', temporal: 'NOT_APPLICABLE', direction: 'CONSISTENT' }, o));
  assert.equal(CC.isValidVerdictBody(V(), 'CREATE'), true);
  assert.equal(CC.isValidVerdictBody(V(), 'SUPERSEDE'), true);
  assert.equal(CC.isValidVerdictBody(VA(), 'APPEND_EVIDENCE'), true);
  assert.equal(CC.isValidVerdictBody(V({ direction: 'CONSISTENT' }), 'CREATE'), false); // must be NOT_APPLICABLE
  assert.equal(CC.isValidVerdictBody(VA({ temporal: 'FAITHFUL' }), 'APPEND_EVIDENCE'), false);
  assert.equal(CC.isValidVerdictBody(V({ unsupported: 'NOT_APPLICABLE' }), 'CREATE'), false);
  assert.equal(CC.isValidVerdictBody(V({ safety: 'MAYBE' }), 'CREATE'), false);
  assert.equal(CC.isValidVerdictBody(Object.assign(V(), { note: 'x' }), 'CREATE'), false);
  assert.equal(CC.isValidVerdictBody(V(), 'DELETE'), false);
  assert.equal(CC.firstFailingVerdict(V(), 'CREATE'), null);
  assert.equal(CC.firstFailingVerdict(VA(), 'APPEND_EVIDENCE'), null);
  assert.equal(CC.firstFailingVerdict(V({ restatement: 'UNCERTAIN', safety: 'SAFETY_ADJACENT' }), 'CREATE'), 'SAFETY_VETO'); // safety first
  assert.equal(CC.firstFailingVerdict(V({ restatement: 'RESTATED', temporal: 'UNFAITHFUL' }), 'CREATE'), 'RESTATED');
  assert.equal(CC.firstFailingVerdict(V({ unsupported: 'UNCERTAIN' }), 'CREATE'), 'UNSUPPORTED_UNCERTAIN');
  assert.equal(CC.firstFailingVerdict(V({ temporal: 'UNCERTAIN' }), 'SUPERSEDE'), 'TEMPORAL_UNCERTAIN');
  assert.equal(CC.firstFailingVerdict(VA({ direction: 'INCONSISTENT' }), 'APPEND_EVIDENCE'), 'DIRECTION_INCONSISTENT');
  assert.equal(CC.firstFailingVerdict(VA({ safety: 'UNCERTAIN' }), 'APPEND_EVIDENCE'), 'SAFETY_UNCERTAIN');
  assert.deepEqual(CC.VERDICT_ORDER, ['safety', 'restatement', 'unsupported', 'temporal', 'direction']);
});

test('§14.4 / §25 (contract): key namespaces, VERIFIER_FAILED status, closed reason codes, v1.1 limits', () => {
  assert.deepEqual(CC.KEY_PREFIXES, { observation: 'o', userStated: 'u', record: 'r', concept: 'k', item: 'p' });
  assert.equal(CC.passKey('r', 0), 'r1');
  assert.ok(CC.PASS_STATUSES.indexOf('VERIFIER_FAILED') !== -1);
  ['MALFORMED_PROPOSAL', 'UNKNOWN_CONCEPT_KEY', 'GROUNDING_INSUFFICIENT', 'GROUNDING_FORM_UNAVAILABLE', 'VERIFICATION_UNAVAILABLE',
    'VERIFICATION_MALFORMED', 'VERIFICATION_MISSING', 'TARGET_CONFLICT_IN_PASS'].forEach((c) => assert.ok(CC.REASON_CODES.indexOf(c) !== -1, c));
  assert.equal(CC.LIMITS.MAX_GROUNDING_ANCHORS, 8);
  assert.equal(CC.LIMITS.ANCHOR_TEXT_MAX_CHARS, 120);
});

// ═══ v1.2 §27.1 / AC-D68 — request-profile validation (MRS-001 §08.3–§08.7) ═══
test('AC-D68: the default profiles are valid, frozen, and exactly §27.1; STAGE_FAILURE_REASONS is the closed §15.0 vocabulary', () => {
  assert.deepEqual(CC.DEFAULT_GENERATOR_PROFILE, { model: 'claude-haiku-4-5-20251001', reasoning: 'OFF', effort: 'NOT_APPLICABLE', maxOutputTokens: 1600, timeoutMs: 20000, providerBinding: { thinking: { type: 'disabled' } } });
  assert.deepEqual(CC.DEFAULT_VERIFIER_PROFILE, { model: 'claude-haiku-4-5-20251001', reasoning: 'OFF', effort: 'NOT_APPLICABLE', maxOutputTokens: 800, timeoutMs: 20000, providerBinding: { thinking: { type: 'disabled' } } });
  [CC.DEFAULT_GENERATOR_PROFILE, CC.DEFAULT_VERIFIER_PROFILE].forEach((p) => {
    assert.equal(CC.isValidRequestProfile(p), true);
    assert.ok(Object.isFrozen(p) && Object.isFrozen(p.providerBinding) && Object.isFrozen(p.providerBinding.thinking));
  });
  assert.deepEqual(CC.STAGE_FAILURE_REASONS, ['TRANSPORT_FAILED', 'TIMEOUT', 'CONTRACT_UNRESOLVED', 'REFUSAL', 'MAX_TOKENS', 'NOT_A_RESPONSE', 'MALFORMED_BLOCK',
    'UNSUPPORTED_BLOCK', 'REASONING_NOT_PERMITTED', 'NO_ANSWER_TEXT', 'MULTIPLE_ANSWER_TEXT', 'INVALID_ENVELOPE', 'ATTRIBUTION_ANOMALY']);
  assert.deepEqual(CC.PROFILE_KEYS, ['model', 'reasoning', 'effort', 'maxOutputTokens', 'timeoutMs', 'providerBinding']);
});

test('AC-D68: every invalid profile is rejected — missing/extra/ill-typed keys, vocabularies, inexact bindings, effort/binding disagreement under OFF and ON, foreign binding fields', () => {
  const base = () => ({ model: 'm', reasoning: 'OFF', effort: 'NOT_APPLICABLE', maxOutputTokens: 100, timeoutMs: 1000, providerBinding: { thinking: { type: 'disabled' } } });
  const P = (o) => Object.assign(base(), o);
  const B = (b, o) => P(Object.assign({ providerBinding: b }, o || {}));
  const invalid = {
    notObject: null, array: [], missingKey: (() => { const p = base(); delete p.effort; return p; })(), extraKey: P({ extra: 1 }),
    emptyModel: P({ model: '' }), nonStringModel: P({ model: 7 }),
    reasoningCase: P({ reasoning: 'off' }), reasoningOther: P({ reasoning: 'AUTO' }), effortOther: P({ effort: 'XHIGH' }), effortLower: P({ effort: 'low' }),
    zeroTokens: P({ maxOutputTokens: 0 }), floatTokens: P({ maxOutputTokens: 1.5 }), stringTimeout: P({ timeoutMs: '1000' }), negativeTimeout: P({ timeoutMs: -1 }),
    bindingNotObject: B(null), bindingMissingThinking: B({}),
    offWithAdaptive: B({ thinking: { type: 'adaptive' } }),
    offDisabledWithDisplay: B({ thinking: { type: 'disabled', display: 'summarized' } }),        // C4: exact objects only
    offDisabledWithBudget: B({ thinking: { type: 'disabled', budget_tokens: 1024 } }),
    offBetweenToolsWithBinding: B({ thinking: { type: 'between_tools', block_binding: 'x' } }, { effort: 'HIGH' }),
    offEnabled: B({ thinking: { type: 'enabled', budget_tokens: 1024 } }),
    onWithDisabled: B({ thinking: { type: 'disabled' } }, { reasoning: 'ON' }),
    onAdaptiveExtraField: B({ thinking: { type: 'adaptive', display: 'summarized' } }, { reasoning: 'ON' }),
    explicitEffortWithoutControl: P({ effort: 'LOW' }),                                           // C3
    naWithControl: B({ thinking: { type: 'disabled' }, output_config: { effort: 'low' } }),        // C3
    controlValueDiffers: B({ thinking: { type: 'disabled' }, output_config: { effort: 'high' } }, { effort: 'LOW' }),
    controlExtraField: B({ thinking: { type: 'disabled' }, output_config: { effort: 'low', format: {} } }, { effort: 'LOW' }),
    onExplicitEffortWithoutControl: B({ thinking: { type: 'adaptive' } }, { reasoning: 'ON', effort: 'MEDIUM' }),
    betweenToolsWithoutExplicitEffort: B({ thinking: { type: 'between_tools' } }),               // C5
    foreignBindingModel: B({ thinking: { type: 'disabled' }, model: 'x' }),
    foreignBindingMaxTokens: B({ thinking: { type: 'disabled' }, max_tokens: 5 }),
    foreignBindingMessages: B({ thinking: { type: 'disabled' }, messages: [] }),
    foreignBindingTools: B({ thinking: { type: 'disabled' }, tools: [] })
  };
  for (const [name, p] of Object.entries(invalid)) assert.equal(CC.isValidRequestProfile(p), false, name);
  // valid: reasoning and effort are independent — OFF with an explicit effort and matching control is valid (C3)
  const valid = {
    offDisabledNoEffort: base(),
    offDisabledLow: B({ thinking: { type: 'disabled' }, output_config: { effort: 'low' } }, { effort: 'LOW' }),
    offBetweenToolsHigh: B({ thinking: { type: 'between_tools' }, output_config: { effort: 'high' } }, { effort: 'HIGH' }),
    onAdaptiveNoEffort: B({ thinking: { type: 'adaptive' } }, { reasoning: 'ON' }),
    onAdaptiveMedium: B({ thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } }, { reasoning: 'ON', effort: 'MEDIUM' })
  };
  for (const [name, p] of Object.entries(valid)) assert.equal(CC.isValidRequestProfile(p), true, name);
});

test('AC-D68 (static): no profile rule mentions a model id or derives effort from reasoning; no capability registry', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/consolidationContract.js'), 'utf8');
  const body = src.slice(src.indexOf('function isValidRequestProfile('), src.indexOf('function clonePlain('));
  assert.ok(body.length > 0);
  assert.equal(/claude|haiku|sonnet|opus|p\.model\s*===|p\.model\.(indexOf|startsWith|match)/i.test(body), false, 'no model-id rule');
  assert.equal(/reasoning\s*===\s*'OFF'\s*\?\s*'NOT_APPLICABLE'|effort\s*=\s*p\.reasoning/.test(body), false, 'effort is never derived from reasoning');
  assert.equal(/capabilit/i.test(body), false);
});

test('§15.1 / §15.4: buildProfileRequestBody emits model, max_tokens, the binding fields in their stated order, then messages — never aliasing the profile', () => {
  const p = { model: 'm', reasoning: 'OFF', effort: 'LOW', maxOutputTokens: 9, timeoutMs: 1, providerBinding: { thinking: { type: 'disabled' }, output_config: { effort: 'low' } } };
  const body = CC.buildProfileRequestBody(p, 'prompt');
  assert.deepEqual(Object.keys(body), ['model', 'max_tokens', 'thinking', 'output_config', 'messages']);
  assert.deepEqual(body, { model: 'm', max_tokens: 9, thinking: { type: 'disabled' }, output_config: { effort: 'low' }, messages: [{ role: 'user', content: 'prompt' }] });
  body.thinking.type = 'mutated';
  assert.equal(p.providerBinding.thinking.type, 'disabled');
  const copy = CC.copyProfile(p);
  assert.deepEqual(copy, p);
  assert.ok(Object.isFrozen(copy.providerBinding.output_config));
  assert.notEqual(copy.providerBinding, p.providerBinding);
});
