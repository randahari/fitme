// USI-001 — Production-Backed Acceptance (docs/specs/USI_001_SPEC_v1.0.md §08, §25, §28, §30
// AC-2, AC-3, AC-12, AC-53, AC-60 … AC-89). Exercises the real DIRECT_TURN_PASS chain
// (internalPipelineOrchestrator.run) with every model-using component stubbed through its
// production configure() seam and COUNTED. Gate off: request bodies, call counts and the TRR
// request-body hash equal the values pinned on baseline 5b5c15d BEFORE any production file changed.
// Gate on: every §28 pressure test runs end to end — real orchestrator, real coordinator and gate,
// real E.0.2c store over the in-memory port, the governed-port test double, and the executor.
// Run with: node --test tests/usi001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const req = (p) => require(path.join(__dirname, '..', p));
const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');
const { createGovernedCorrectionPortTestDouble } = require('./fixtures/usiGovernedCorrectionPortTestDouble.js');

const StateAccess = req('js/stateAccess.js');
const Consumer = req('js/derivedIntelligenceConsumer.js');
const DateUtils = req('js/core/dateUtils.js');
const TurnUnderstandingInterpreter = req('js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const ExplicitRequestInterpreter = req('js/coachDecisionSystem/explicitRequestInterpreter.js');
const ReadinessStateInterpreter = req('js/coachDecisionSystem/readinessStateInterpreter.js');
const SituationalContextInterpreter = req('js/coachDecisionSystem/situationalContextInterpreter.js');
const SafetyContextInterpreter = req('js/coachDecisionSystem/safetyContextInterpreter.js');
const UserSafetyProvenanceInterpreter = req('js/coachDecisionSystem/userSafetyProvenanceInterpreter.js');
const ActivityPreferenceInterpreter = req('js/coachDecisionSystem/activityPreferenceInterpreter.js');
const ActivityOppositionInterpreter = req('js/coachDecisionSystem/activityOppositionInterpreter.js');
const ExplicitPreferenceStatementInterpreter = req('js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js');
const RiskCharacteristicInterpreter = req('js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const RiskCharacteristicValidator = req('js/coachDecisionSystem/riskCharacteristicValidator.js');
const TrainingReadinessReasoningComponent = req('js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
const GeneralReasoningCapability = req('js/coachDecisionSystem/generalReasoningCapability.js');
const ExpressionRenderer = req('js/coachDecisionSystem/expressionRenderer.js');
const TrrCapabilityAdapter = req('js/coachDecisionSystem/trrCapabilityAdapter.js');
const Orchestrator = req('js/coachDecisionSystem/internalPipelineOrchestrator.js');
const Gate = req('js/coachDecisionSystem/userStatedIntakeActivationGate.js');
const UsiInterpreter = req('js/coachDecisionSystem/userStatedIntakeInterpreter.js');
const UserStatedIntake = req('js/coachDecisionSystem/userStatedIntake.js');
const Executor = req('js/coachDecisionSystem/userStatedIntakeExecutor.js');
const Store = req('js/coachDecisionSystem/userKnowledgeStore.js');

const TODAY = DateUtils.getTodayKey();
const FIXED_SUBMITTED_AT = 1760000000000;
const UK_USER = 'usi-user';
const CPI_MEMORY_ID = 'conv_pref_TEST_record';

const sha = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
function text(obj) { return { content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }; }
function idsIn(body, re) { return (body.messages[0].content.match(re) || []).map((m) => m.match(/"([^"]+)"/)[1]); }

function closedEntry(id, overrides) {
  return Object.assign({
    id: id, affirmativeRequestPresent: false, domain: null, topic: null,
    currentStateStatementPresent: false, currentStateStatementText: null,
    negativeControlPresent: false, desireOnlyPresent: false,
    personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
  }, overrides || {});
}

// scn: { turnId, text, tu, d6, d6Raw, epsi, anchor, rccItems, captures, consent, safetyRestrictedActivityText,
//        rcfResponse, usi: (body) => proposals|string }
function configureAll(scn, counts) {
  function counted(name, fn) {
    return async (body) => {
      counts.total++;
      counts.byComponent[name] = (counts.byComponent[name] || 0) + 1;
      if (scn.captures) (scn.captures[name] = scn.captures[name] || []).push(body);
      return fn(body);
    };
  }
  const consent = scn.consent !== false;
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: consent } }),
    getCurrentUser: () => ({ uid: 'ou-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => [],
    fetchRecentConversation: async (pageSize, afterCreatedAt, afterTurnId) => {
      const all = scn.rccItems || [];
      let start = 0;
      if (afterCreatedAt !== undefined) start = all.findIndex((t) => t.createdAt === afterCreatedAt && t.turnId === afterTurnId) + 1;
      return all.slice(start, start + pageSize);
    }
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY,
    getWeekday: () => new Date().getDay()
  });
  TurnUnderstandingInterpreter.configure({
    callClaude: counted('TURN_UNDERSTANDING', async (body) => {
      const ids = idsIn(body, /<turn id="([^"]+)"/g);
      const withD6 = body.messages[0].content.indexOf('"userStatedKnowledgePresent"') !== -1;
      return text({ results: ids.map((id) => {
        const e = closedEntry(id, id === scn.turnId ? scn.tu : {});
        if (withD6) {
          if (id === scn.turnId && scn.d6Raw) Object.assign(e, scn.d6Raw);
          else {
            const d = (id === scn.turnId && scn.d6) || { present: false, intent: null, anchorText: null };
            Object.assign(e, { userStatedKnowledgePresent: d.present, userStatedKnowledgeIntent: d.intent, userStatedKnowledgeAnchorText: d.anchorText });
          }
        }
        return e;
      }) });
    })
  });
  ExplicitRequestInterpreter.configure({ callClaude: counted('EXPLICIT_REQUEST', async () => text({ results: [] })) });
  ReadinessStateInterpreter.configure({
    callClaude: counted('READINESS_STATE', async (body) => text({ results: idsIn(body, /id="([^"]+)"/g).map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) }))
  });
  SituationalContextInterpreter.configure({ callClaude: counted('SITUATIONAL_CONTEXT', async () => text({ results: [] })) });
  SafetyContextInterpreter.configure({
    callClaude: counted('SAFETY_CONTEXT', async (body) => {
      const ids = idsIn(body, /<statement id="([^"]+)"/g);
      const restricted = scn.safetyRestrictedActivityText;
      return text({ results: ids.map((id) => ({
        id, restrictionClassification: restricted ? 'RESTRICTION_STATED' : 'NOT_RESTRICTION_OR_NOT_CLASSIFIED',
        restrictedActivityText: restricted || null, statedDurationText: null
      })) });
    })
  });
  UserSafetyProvenanceInterpreter.configure({ callClaude: counted('USER_SAFETY_PROVENANCE', async () => text({ results: [] })) });
  ActivityPreferenceInterpreter.configure({ callClaude: counted('ACTIVITY_PREFERENCE', async () => text({ results: [] })) });
  ActivityOppositionInterpreter.configure({ callClaude: counted('ACTIVITY_OPPOSITION', async () => text({ results: [] })) });
  ExplicitPreferenceStatementInterpreter.configure({
    callClaude: counted('EXPLICIT_PREFERENCE', async (body) => {
      const id = body.messages[0].content.match(/<turn id="([^"]+)"/)[1];
      const res = (id === scn.turnId && scn.epsi) ? scn.epsi : { eligible: false, ineligibleReason: 'NO_EXPLICIT_PREFERENCE' };
      const entry = Object.assign({ id, preferenceClass: null, polarity: null, target: null, ineligibleReason: null }, res);
      if (body.messages[0].content.indexOf('"assertionAnchorText"') !== -1 && scn.anchor !== undefined) entry.assertionAnchorText = id === scn.turnId ? scn.anchor : null;
      return text({ results: [entry] });
    })
  });
  RiskCharacteristicInterpreter.configure({
    callClaude: counted('RISK_CHARACTERISTIC', async () => (scn.rcfFails ? text('not json') : text(scn.rcfResponse || { tags: [], candidates: [] })))
  });
  TrainingReadinessReasoningComponent.configure({
    callClaude: counted('TRR_REASONING', async () => text({
      outcome: 'ACTION_PROPOSED', action: 'שקול/י אימון קליל וקצר יותר היום.',
      actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
      rationale: 'בקשה ישירה של המשתמש.', evidenceBasis: 'בקשה ישירה של המשתמש.',
      expectedValue: 'התאמת העצימות.', uncertainty: 'נמוכה.'
    }))
  });
  GeneralReasoningCapability.configure({ callClaude: counted('GENERAL_REASONING', async () => text({})) });
  ExpressionRenderer.configure({ generateFn: counted('EXPRESSION', async () => 'stub') });
  UsiInterpreter.configure({
    callClaude: counted('USER_STATED_INTAKE', async (body) => {
      const out = scn.usi ? scn.usi(body) : [];
      return text(typeof out === 'string' ? out : { proposals: out });
    })
  });
}

function resetAll() {
  [TurnUnderstandingInterpreter, ExplicitRequestInterpreter, ReadinessStateInterpreter, SituationalContextInterpreter,
    SafetyContextInterpreter, UserSafetyProvenanceInterpreter, ActivityPreferenceInterpreter, ActivityOppositionInterpreter,
    ExplicitPreferenceStatementInterpreter, RiskCharacteristicInterpreter, TrainingReadinessReasoningComponent,
    GeneralReasoningCapability, UsiInterpreter].forEach((m) => m.configure({ callClaude: null }));
  ExpressionRenderer.configure({ generateFn: null });
}

async function runScenario(scn) {
  TrrCapabilityAdapter.registerAll();
  const counts = { total: 0, byComponent: {} };
  configureAll(scn, counts);
  const turn = { turnId: scn.turnId, text: scn.text, submittedAt: FIXED_SUBMITTED_AT, sessionGeneration: 1 };
  const result = await Orchestrator.run({
    userId: 'ou-user', sessionGeneration: 1, runId: 'usi-run-' + scn.turnId,
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: FIXED_SUBMITTED_AT
  });
  resetAll();
  return { counts, result, turn };
}

// ── User Knowledge environment: real E.0.2c store (CLIENT) + governed SERVER double, one port ──
function makeUk() {
  const { port, hooks } = createInMemoryPort();
  let clock = 1000;
  const env = { consent: true };
  const now = () => (clock += 10);
  Store.configure({ port, now, writerAuthority: 'CLIENT', isLearningConsentGranted: () => env.consent, userId: UK_USER, producer: 'usi-001.intake', producerVersion: '1.0.0' });
  const governed = createGovernedCorrectionPortTestDouble({ port, now, userId: UK_USER, isLearningConsentGranted: () => env.consent });
  UserStatedIntake.configure({ store: Store });
  Executor.configure({ clientStore: Store, governedCorrectionPort: governed.port });
  async function concept(label) {
    const r = await Store.createConcept({ labels: [label] });
    assert.equal(r.status, 'COMMITTED', 'seed concept ' + label);
    return r.ids.conceptIds[0];
  }
  function draftOf(source, factors, relation, originTurnId) {
    return {
      factors, relationDescription: relation,
      evidenceClass: source === 'user_stated' ? 'EXPLICIT_STATEMENT' : 'CO_OCCURRENCE',
      temporality: 'DURABLE', confidence: source === 'user_stated' ? 1 : 0.6, source, safetyFlag: 'STANDARD',
      evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: originTurnId || 'seed-turn' }] },
      provenance: { originTurnId: originTurnId || 'seed-turn' }
    };
  }
  async function userRecord(factors, relation, originTurnId) {
    const r = await Store.createRecord({ draft: draftOf('user_stated', factors, relation, originTurnId) });
    assert.equal(r.status, 'COMMITTED', 'seed user record ' + JSON.stringify(r));
    return r.ids.recordIds[0];
  }
  async function inferredRecord(factors, relation, originTurnId) {
    const r = await governed.store.createRecord({ draft: draftOf('inferred_pattern', factors, relation, originTurnId) });
    assert.equal(r.status, 'COMMITTED', 'seed inferred record ' + JSON.stringify(r));
    return r.ids.recordIds[0];
  }
  const peek = () => hooks.peek(UK_USER);
  const record = (id) => peek().records.find((r) => r.recordId === id) || null;
  return { port, hooks, env, governed, concept, userRecord, inferredRecord, peek, record };
}

function unconfigureUk() {
  Store.configure({});
  UserStatedIntake.configure({ store: null });
  Executor.configure({});
}

const D6_NEW = (anchorText) => ({ present: true, intent: 'NEW_USER_KNOWLEDGE', anchorText });
const D6_CWF = (anchorText) => ({ present: true, intent: 'CORRECTION_WITHDRAW_FORGET', anchorText });

function proposal(o) {
  return Object.assign({
    operation: 'NEW', targetRecordIds: [], requestText: null, referenceText: null, referenceKind: null,
    statementText: null, factors: [], temporality: null, confoundText: null, safetyAdjacent: false
  }, o);
}
function factor(o) {
  return Object.assign({ conceptId: null, newConceptLabel: null, mentionText: null, role: 'subject', valueText: null, cpiReference: false }, o);
}
const newFactor = (label, role) => factor({ newConceptLabel: label, mentionText: label, role: role || 'subject' });
function mutation(operation, targetId, requestText, referenceText, kind, extra) {
  return proposal(Object.assign({ operation, targetRecordIds: [targetId], requestText, referenceText, referenceKind: kind }, extra || {}));
}

async function runUsi(scn) {
  Gate.__setEnabledForTests__(true);
  try {
    const full = Object.assign({ turnId: 'usi-t-1', tu: {} }, scn);
    const out = await runScenario(full);
    assert.equal(out.result.status, 'SUCCESS');
    out.decision = out.result.output.userStatedIntakeDecision;
    return out;
  } finally {
    Gate.__setEnabledForTests__(false);
  }
}
async function execute(uk, decision, cpiRecord) {
  const before = uk.hooks.writeCalls().length;
  const res = await Executor.execute({ decision, cpiRecord: cpiRecord || { persisted: false, memoryId: null } });
  return { res, writes: uk.hooks.writeCalls().length - before };
}
const codes = (decision) => decision.results.map((r) => (r.status === 'ACCEPTED' ? 'ACCEPTED' : r.code));

test.before(() => { TrrCapabilityAdapter.registerAll(); GeneralReasoningCapability.registerAll(); });
test.afterEach(() => { resetAll(); Gate.__setEnabledForTests__(false); unconfigureUk(); });

// ═══════════════════ AC-2 / AC-3 — gate off: zero drift ═══════════════════
// Pinned on baseline 5b5c15d3adc9b0b7d0747ee1c543286ae825783c BEFORE any production file changed
// (sha256 of JSON.stringify(captured request bodies)), using the OU-001 harness scenarios.
const BASELINE_SCENARIOS = [
  { name: 'DUC_TRR_ROUTED_REQUEST', turnId: 'ou-cc-1', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?',
    tu: { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות' } },
  { name: 'DUC_UNSUPPORTED_REQUEST', turnId: 'ou-cc-2', text: 'כמה חלבון נשאר לי היום?', tu: { affirmativeRequestPresent: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE' } },
  { name: 'CPI_PREFERENCE_STATEMENT', turnId: 'ou-cc-3', text: 'אני ממש אוהב לרוץ', tu: {}, epsi: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'לרוץ' } },
  { name: 'ITEM6_STATE_DISCLOSURE', turnId: 'ou-cc-4', text: 'ישנתי גרוע הלילה', tu: { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי גרוע הלילה' } },
  { name: 'CASUAL_NO_REQUEST', turnId: 'ou-cc-5', text: 'תודה!', tu: {} }
];
const BASELINE_RCC = [
  { turnId: 'usi-prev-1', createdAt: 1759999990000, userText: 'I sleep badly before early shifts', assistantText: 'Noted.' },
  { turnId: 'usi-prev-2', createdAt: 1759999995000, userText: 'אני אוהב לרוץ', assistantText: 'מעולה' }
];
const PINNED = {
  'DUC_TRR_ROUTED_REQUEST:plain': { total: 9, TU: 'ce6c551df0d787eb9daf02d38ab825dedc5aa8ef417e474b9c12c1aefcb35432', CPI: 'c338919f2b7bcdd40ea90d69bd0a1630686217de1b632811e54fe4ec7e6fdb46', TRR: 'af3763893eee88d13f7b1256de297b3d942e45ae4d80d7cdf5efc50fa6c8fdd5' },
  'DUC_TRR_ROUTED_REQUEST:rcc': { total: 9, TU: '608db9f54c1f28a06343b9c72997bda507ae92514ec5b3ea6579f9a7f542b028', CPI: 'b6e920ce89742151b86c79ec0ba412002e59a1f4075a9bb5fbf97a6c7ea19120', TRR: 'd766cf40c3bc8a1ba7dee380f08fc5d01d190f0a9214500fc11dde84330b2c4f' },
  'DUC_UNSUPPORTED_REQUEST:plain': { total: 6, TU: 'd100e15d9aaea55d9fabe435fa121b625d9f2b6d2f6b8671af38015e07895c38', CPI: '46341c79906be33ae5d8248e389898362a902d2bcfeebd63f41787c1c4c9e1b1', TRR: null },
  'DUC_UNSUPPORTED_REQUEST:rcc': { total: 6, TU: '6c7edfad7acec6e2a443a451d492c1f709c7baf363e8d38996eac6fe544f6b1a', CPI: '09738a38d32709ef4336d80e3204960e72672d290da993d3d7e136f886829e1d', TRR: null },
  'CPI_PREFERENCE_STATEMENT:plain': { total: 6, TU: '97104793a523c921f506663bdd0f6c5f8b94a3ccc3da6570a55d6ed5b4cfddd4', CPI: 'f10d51a0c9d05816e66a7f38bf665bb076f4a49791eccd5359476dee5067ac72', TRR: null },
  'CPI_PREFERENCE_STATEMENT:rcc': { total: 6, TU: '5207021792a26fd2e80a82d55f5fd67ae20399eeb062d37d07e9536a35d20f1d', CPI: 'a17ec6146b216b4ff7a328593553be5f6264d55f44d8ad4e02c2c01b92948bee', TRR: null },
  'ITEM6_STATE_DISCLOSURE:plain': { total: 7, TU: 'db7bc681892a1965f188602eddbd25f807e89d98f8a79a1e703e6d3c220d790c', CPI: 'aceeccdffb59a8e449d3c57d99af9c42b1d1aee6da145c3037d4f43220bd1fdf', TRR: null },
  'ITEM6_STATE_DISCLOSURE:rcc': { total: 7, TU: '40823de9b2e15890eb2397d7963c162d4d246d280f24dbebb75ff2dcfe211200', CPI: 'f29b3e1f4c1573f870df64f262f9c50617c2f4819f7ea899aab04bcffd11e78d', TRR: null },
  'CASUAL_NO_REQUEST:plain': { total: 5, TU: 'fa531f855dced00fb5951321b41aed74fd9a6c9bc286a737da6be13b90f723ba', CPI: '0f4900595e2f5705b723607bac84ea2b70960a19bf7e5a44e918f5dcd621efeb', TRR: null },
  'CASUAL_NO_REQUEST:rcc': { total: 5, TU: 'da6c98889124a736c91ad152581c876fdf50322051ad8c7bc2095681e72b2590', CPI: '1b64b6cce7e0b0ae3a9ed0757abcb8f330a4ae2f73f6df8bf9dc7e115eb3d8f9', TRR: null }
};

test('AC-2 / AC-3: gate false — Turn Understanding and CPI request bodies, model-call counts and the TRR request-body hash equal the pre-implementation pins; no USI call, no USI key, no Dimension 6 key', async () => {
  assert.equal(Gate.isEnabled(), false);
  const uk = makeUk();
  const orig = Date.now;
  Date.now = () => FIXED_SUBMITTED_AT;
  try {
    for (const base of BASELINE_SCENARIOS) {
      for (const variant of ['plain', 'rcc']) {
        const scn = Object.assign({}, base, { captures: {} }, variant === 'rcc' ? { rccItems: BASELINE_RCC } : {});
        const { counts, result } = await runScenario(scn);
        const pin = PINNED[base.name + ':' + variant];
        assert.equal(sha(scn.captures.TURN_UNDERSTANDING), pin.TU, base.name + ':' + variant + ' TU body');
        assert.equal(sha(scn.captures.EXPLICIT_PREFERENCE), pin.CPI, base.name + ':' + variant + ' CPI body');
        assert.equal(scn.captures.TRR_REASONING ? sha(scn.captures.TRR_REASONING) : null, pin.TRR, base.name + ':' + variant + ' TRR body');
        assert.equal(counts.total, pin.total, base.name + ':' + variant + ' total calls');
        assert.equal(counts.byComponent.USER_STATED_INTAKE, undefined);
        assert.equal('userStatedIntakeDecision' in result.output, false);
        assert.equal(JSON.stringify(result).indexOf('userStatedKnowledge'), -1);
        assert.equal(JSON.stringify(result).indexOf('assertionAnchorText'), -1);
      }
    }
    assert.equal(uk.hooks.calls.length, 0, 'gate off: the User Knowledge store is never read');
  } finally { Date.now = orig; }
});

test('AC-3: gate false even with a would-be-positive detector stub — the USI interpreter is never called and nothing is read or written', async () => {
  const uk = makeUk();
  const { counts, result } = await runScenario({ turnId: 'usi-off-1', text: 'I usually sleep badly before an early shift.', tu: {}, d6: D6_NEW('I usually sleep badly'), usi: () => { throw new Error('must not be called'); } });
  assert.equal(counts.byComponent.USER_STATED_INTAKE, undefined);
  assert.equal('userStatedIntakeDecision' in result.output, false);
  assert.equal(uk.hooks.calls.length, 0);
});

// ═══════════════════ Gate on — model-call budget (AC-13, AC-15) ═══════════════════
test('AC-13 / AC-25 budget: gate on, detector negative — 0 USI calls; only output tokens change on existing calls', async () => {
  makeUk();
  const { counts, decision } = await runUsi({ text: 'תודה!' });
  assert.equal(counts.byComponent.USER_STATED_INTAKE, undefined);
  assert.equal(counts.total, 5);
  assert.deepEqual(decision, { status: 'SKIPPED', reason: 'DETECTOR_NEGATIVE' });
});

// ═══════════════════ §28 pressure tests 1-14 (AC-60 … AC-73) ═══════════════════
test('AC-60 (case 1): "I usually sleep badly before an early shift." → one NEW user_stated EXPLICIT_STATEMENT record, literal relationDescription, factors anchored in the turn', async () => {
  const uk = makeUk();
  const textIn = 'I usually sleep badly before an early shift.';
  const { counts, decision } = await runUsi({
    text: textIn, d6: D6_NEW('I usually sleep badly before an early shift'),
    usi: () => [proposal({ statementText: 'I usually sleep badly before an early shift', factors: [newFactor('sleep badly', 'outcome'), newFactor('an early shift', 'condition')], temporality: 'RECURRING_WINDOW' })]
  });
  assert.equal(counts.byComponent.USER_STATED_INTAKE, 1);
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  const records = uk.peek().records;
  assert.equal(records.length, 1);
  const r = records[0];
  assert.equal(r.source, 'user_stated');
  assert.equal(r.evidenceClass, 'EXPLICIT_STATEMENT');
  assert.equal(r.status, 'active');
  assert.equal(r.relationDescription, 'I usually sleep badly before an early shift');
  assert.ok(textIn.indexOf(r.relationDescription) >= 0);
  assert.deepEqual(uk.peek().concepts.map((c) => c.labels[0]).sort(), ['an early shift', 'sleep badly']);
  uk.peek().concepts.forEach((c) => assert.ok(textIn.indexOf(c.labels[0]) >= 0));
});

test('AC-61 (case 2): "Large meals before training make me feel heavy." → NEW record with 3 literal factors (condition/subject/outcome)', async () => {
  const uk = makeUk();
  const textIn = 'Large meals before training make me feel heavy.';
  const { decision } = await runUsi({
    text: textIn, d6: D6_NEW('Large meals before training make me feel heavy'),
    usi: () => [proposal({ statementText: 'Large meals before training make me feel heavy', factors: [newFactor('Large meals', 'subject'), newFactor('before training', 'condition'), newFactor('feel heavy', 'outcome')], temporality: 'DURABLE' })]
  });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  await execute(uk, decision);
  const r = uk.peek().records[0];
  assert.deepEqual(r.factors.map((f) => f.role).sort(), ['condition', 'outcome', 'subject']);
  uk.peek().concepts.forEach((c) => assert.ok(textIn.indexOf(c.labels[0]) >= 0));
});

const PREF_MORNING = { eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'MORNING' };

test('AC-62 (case 3): "I prefer training in the morning." — CPI owns the whole assertion; every USI proposal is rejected (CPI_OWNED_SPAN / NO_ADDITIONAL_KNOWLEDGE); no User Knowledge write', async () => {
  const uk = makeUk();
  const { decision, result } = await runUsi({
    text: 'I prefer training in the morning.', epsi: PREF_MORNING, anchor: 'I prefer training in the morning',
    d6: D6_NEW('I prefer training in the morning'),
    usi: () => [
      proposal({ statementText: 'I prefer training in the morning', factors: [newFactor('training', 'subject')], temporality: 'DURABLE' }),
      proposal({ statementText: 'I prefer training in the morning', factors: [factor({ newConceptLabel: 'training', mentionText: 'training', cpiReference: true })], temporality: 'DURABLE' })
    ]
  });
  assert.equal(result.output.preferenceIntakeAuthorization.authorized, true, 'CPI capture unchanged');
  assert.deepEqual(codes(decision), ['CPI_OWNED_SPAN', 'CPI_OWNED_SPAN']);
  const { writes } = await execute(uk, decision, { persisted: true, memoryId: CPI_MEMORY_ID });
  assert.equal(writes, 0);
  assert.equal(uk.peek().records.length, 0);
  // A proposal whose only other content is still CPI-owned fails NO_ADDITIONAL_KNOWLEDGE.
  const { decision: d2 } = await runUsi({
    text: 'I prefer training in the morning.', epsi: PREF_MORNING, anchor: 'I prefer training in the morning', d6: D6_NEW('I prefer training in the morning'),
    usi: () => [proposal({ statementText: 'I prefer training in the morning.'.slice(-1), factors: [factor({ newConceptLabel: 'training', mentionText: 'training', cpiReference: true })], temporality: 'DURABLE' })]
  });
  assert.deepEqual(codes(d2), ['NO_ADDITIONAL_KNOWLEDGE']);
});

test('AC-63 (case 4): "I prefer training in the morning because evenings are for my children." — USI NEW cites the CPI record by reference; executed only after the CPI record persists', async () => {
  const uk = makeUk();
  const textIn = 'I prefer training in the morning because evenings are for my children.';
  const { decision, result } = await runUsi({
    text: textIn, epsi: PREF_MORNING, anchor: 'I prefer training in the morning', d6: D6_NEW('evenings are for my children'),
    usi: () => [proposal({
      statementText: 'evenings are for my children',
      factors: [factor({ newConceptLabel: 'training in the morning', mentionText: 'training in the morning', cpiReference: true }), newFactor('evenings', 'condition'), newFactor('my children', 'subject')],
      temporality: 'RECURRING_WINDOW'
    })]
  });
  assert.equal(result.output.preferenceIntakeAuthorization.authorized, true);
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const skipped = await execute(uk, decision, { persisted: false, memoryId: null });
  assert.deepEqual(skipped.res.outcomes.map((o) => [o.status, o.code]), [['SKIPPED', 'CPI_RECORD_NOT_PERSISTED']]);
  assert.equal(skipped.writes, 0);
  const done = await execute(uk, decision, { persisted: true, memoryId: CPI_MEMORY_ID });
  assert.deepEqual(done.res.outcomes.map((o) => o.status), ['COMMITTED']);
  const r = uk.peek().records[0];
  assert.equal(r.relationDescription, 'evenings are for my children');
  assert.deepEqual(r.evidence.supporting.map((e) => e.refId), ['CONVERSATION_TURN:usi-t-1', 'TYPED_MEMORY_RECORD:' + CPI_MEMORY_ID]);
  assert.equal(JSON.stringify(uk.peek()).indexOf('I prefer'), -1, 'the CPI assertion is never restated in User Knowledge');
  assert.deepEqual(r.factors.map((f) => f.valueDescription), [null, null, null]);
});

test('AC-64 (case 5): "I enjoy running because it clears my head." — CPI (class A) owns "I enjoy running"; USI records "it clears my head" with a CPI reference factor', async () => {
  const uk = makeUk();
  const { decision } = await runUsi({
    text: 'I enjoy running because it clears my head.', epsi: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running' },
    anchor: 'I enjoy running', d6: D6_NEW('it clears my head'),
    usi: () => [proposal({ statementText: 'it clears my head', factors: [factor({ newConceptLabel: 'running', mentionText: 'running', cpiReference: true }), newFactor('clears my head', 'outcome')], temporality: 'DURABLE' })]
  });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  await execute(uk, decision, { persisted: true, memoryId: CPI_MEMORY_ID });
  const r = uk.peek().records[0];
  assert.equal(r.relationDescription, 'it clears my head');
  assert.ok(r.evidence.supporting.some((e) => e.refId === 'TYPED_MEMORY_RECORD:' + CPI_MEMORY_ID));
});

test('AC-65 (case 6): correction of a presented FITME-inferred record, uniquely grounded → governed correctInferredKnowledge; successor user_stated, predecessor superseded, INV-UC-S', async () => {
  const uk = makeUk();
  const coffee = await uk.concept('coffee');
  const slump = await uk.concept('afternoon slump');
  const inferred = await uk.inferredRecord([{ conceptId: coffee, role: 'condition' }, { conceptId: slump, role: 'outcome' }], 'coffee co-occurs with an afternoon slump');
  const textIn = 'Actually it is not the coffee, it is skipping lunch.';
  const { decision } = await runUsi({
    text: textIn, d6: D6_CWF('it is not the coffee'),
    usi: () => [mutation('CORRECT', inferred, textIn.slice(0, -1), 'the coffee', 'NAMED', {
      statementText: 'it is skipping lunch', factors: [newFactor('skipping lunch', 'condition'), factor({ conceptId: slump, role: 'outcome' })], temporality: 'DURABLE'
    })]
  });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  assert.equal(decision.results[0].plan.route, 'GOVERNED');
  const clientBefore = uk.governed.calls.length;
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  assert.deepEqual(uk.governed.calls.slice(clientBefore).map((c) => c.name), ['correctInferredKnowledge']);
  const pred = uk.record(inferred);
  assert.equal(pred.status, 'superseded');
  const succ = uk.record(pred.supersededBy[0]);
  assert.equal(succ.source, 'user_stated');
  assert.equal(succ.relationDescription, 'it is skipping lunch');
  assert.deepEqual(succ.evidence.supporting.map((e) => e.refId), ['CONVERSATION_TURN:usi-t-1']);
  assert.equal(succ.provenance.originTurnId, 'usi-t-1');
  assert.ok(succ.correctionHistory.every((h) => h.userOriginTurnId === 'usi-t-1'));
  assert.ok(pred.correctionHistory.slice(-1)[0].userOriginTurnId === 'usi-t-1');
});

test('AC-66 (case 7): a withdrawal naming exactly one presented user-stated record → retractRecord on the CLIENT store; rejected, history keeps userOriginTurnId', async () => {
  const uk = makeUk();
  const nights = await uk.concept('night shifts');
  const r1 = await uk.userRecord([{ conceptId: nights, role: 'condition' }], 'I work night shifts');
  const textIn = 'What I said about night shifts is not true anymore.';
  const { decision } = await runUsi({ text: textIn, d6: D6_CWF(textIn), usi: () => [mutation('WITHDRAW', r1, textIn, 'night shifts', 'NAMED')] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  const rec = uk.record(r1);
  assert.equal(rec.status, 'rejected');
  const last = rec.correctionHistory.slice(-1)[0];
  assert.equal(last.kind, 'RETRACTED');
  assert.equal(last.userOriginTurnId, 'usi-t-1');
  assert.equal(uk.governed.calls.length, 0);
});

test('AC-67 (case 8): an explicit forget request naming exactly one presented user-stated record → forgetRecord CLIENT; record removed; links elsewhere remain ids', async () => {
  const uk = makeUk();
  const brother = await uk.concept('brother');
  const r1 = await uk.userRecord([{ conceptId: brother, role: 'subject' }], 'my brother visits on weekends');
  const other = await uk.concept('weekends');
  const draft = {
    factors: [{ conceptId: other, role: 'condition' }], relationDescription: 'weekends are busy', evidenceClass: 'EXPLICIT_STATEMENT', temporality: 'DURABLE',
    confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD',
    evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: 'seed-turn' }, { kind: 'USER_KNOWLEDGE_RECORD', ref: r1 }] }, provenance: { originTurnId: 'seed-turn' }
  };
  const linking = (await Store.createRecord({ draft })).ids.recordIds[0];
  const textIn = 'Please forget what I told you about my brother.';
  const { decision } = await runUsi({ text: textIn, d6: D6_CWF(textIn), usi: () => [mutation('FORGET', r1, textIn, 'my brother', 'NAMED')] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['DELETED']);
  assert.equal(uk.record(r1), null);
  assert.ok(uk.record(linking).evidence.supporting.some((e) => e.refId === 'USER_KNOWLEDGE_RECORD:' + r1));
});

test('AC-68 (case 9): ambiguous "maybe I\'ll try something new someday" — no proposal, or failing proposals; no write', async () => {
  const uk = makeUk();
  const textIn = "maybe I'll try something new someday";
  const a = await runUsi({ text: textIn, d6: D6_NEW(textIn), usi: () => [] });
  assert.deepEqual(a.decision.results, []);
  const b = await runUsi({ text: textIn, d6: D6_NEW(textIn), usi: () => [proposal({ statementText: 'The user wants to try new things', factors: [newFactor('new things')], temporality: 'DURABLE' })] });
  assert.deepEqual(codes(b.decision), ['NOT_LITERAL']);
  assert.equal((await execute(uk, b.decision)).writes, 0);
  assert.equal(uk.peek().records.length, 0);
});

test('AC-69 (case 10): malformed Dimension 6 → detector absent; USI skipped with no call; Dimensions 1-5 unchanged', async () => {
  makeUk();
  const tu = { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי גרוע הלילה' };
  const valid = await runUsi({ text: 'ישנתי גרוע הלילה', tu, d6: D6_NEW('ישנתי גרוע'), captures: {} });
  const bad = await runUsi({ text: 'ישנתי גרוע הלילה', tu, d6Raw: { userStatedKnowledgePresent: true, userStatedKnowledgeIntent: 'SOMETHING', userStatedKnowledgeAnchorText: 'x' } });
  assert.deepEqual(bad.decision, { status: 'SKIPPED', reason: 'DETECTOR_NEGATIVE' });
  assert.equal(bad.counts.byComponent.USER_STATED_INTAKE, undefined);
  // Every outcome Dimensions 1-5 drive (Need/terminal decision kind, every intake authorization,
  // Expression dispatch) is identical with a valid and with a malformed Dimension 6.
  const stable = (r) => ({
    kind: r.result.output.terminalDecision && r.result.output.terminalDecision.kind,
    disclosure: r.result.output.terminalDecision && r.result.output.terminalDecision.disclosureAcknowledgment,
    pref: r.result.output.preferenceIntakeAuthorization,
    disc: r.result.output.disclosureCaptureAuthorization,
    rcf: r.result.output.riskCharacteristicFactCaptureAuthorization,
    expression: r.result.output.expression.status,
    calls: Object.assign({}, r.counts.byComponent, { USER_STATED_INTAKE: undefined })
  });
  assert.deepEqual(stable(bad), stable(valid));
});

test('AC-70 (case 11): CPI recognized with a missing or invalid anchor → USI skipped (no call); CPI capture unchanged', async () => {
  makeUk();
  for (const anchor of [null, 'not in the turn at all', 'I enjoy']) {
    const { decision, counts, result } = await runUsi({
      text: 'I enjoy running because it clears my head.', epsi: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running' },
      anchor, d6: D6_NEW('it clears my head'), usi: () => { throw new Error('no call'); }
    });
    assert.deepEqual(decision, { status: 'SKIPPED', reason: 'CPI_ANCHOR_INVALID' }, String(anchor));
    assert.equal(counts.byComponent.USER_STATED_INTAKE, undefined);
    assert.equal(result.output.preferenceIntakeAuthorization.authorized, true);
  }
});

test('AC-71 (case 12): CPI blocked by consent → USI skipped (consent); CPI Safety veto → USI skipped (§12 item 5)', async () => {
  makeUk();
  const base = { text: 'I prefer training in the morning because evenings are for my children.', epsi: PREF_MORNING, anchor: 'I prefer training in the morning', d6: D6_NEW('evenings are for my children'), usi: () => { throw new Error('no call'); } };
  const noConsent = await runUsi(Object.assign({}, base, { consent: false }));
  assert.equal(noConsent.result.output.preferenceIntakeAuthorization.reason, 'CONSENT_ABSENT');
  assert.deepEqual(noConsent.decision, { status: 'SKIPPED', reason: 'CONSENT_NOT_GRANTED' });
  const veto = await runUsi(Object.assign({}, base, { safetyRestrictedActivityText: 'training' }));
  assert.equal(veto.result.output.preferenceIntakeAuthorization.reason, 'SAFETY_VETO');
  assert.deepEqual(veto.decision, { status: 'SKIPPED', reason: 'CPI_SAFETY_VETO' });
  assert.equal(noConsent.counts.byComponent.USER_STATED_INTAKE, undefined);
  assert.equal(veto.counts.byComponent.USER_STATED_INTAKE, undefined);
});

test('AC-72 (case 13): fabricated recordId / conceptId → UNKNOWN_TARGET / UNKNOWN_CONCEPT; nothing written', async () => {
  const uk = makeUk();
  const knee = await uk.concept('knee');
  await uk.userRecord([{ conceptId: knee, role: 'subject' }], 'my knee clicks');
  const textIn = 'Forget what I told you about my knee';
  const { decision } = await runUsi({
    text: textIn, d6: D6_CWF(textIn),
    usi: () => [mutation('FORGET', 'm_record_999', textIn, 'my knee', 'NAMED'),
      proposal({ statementText: 'my knee', factors: [factor({ conceptId: 'M_CONCEPT_1', mentionText: 'knee' })], temporality: 'DURABLE' })]
  });
  assert.deepEqual(codes(decision), ['UNKNOWN_TARGET', 'UNKNOWN_CONCEPT']);
  assert.equal((await execute(uk, decision)).writes, 0);
});

test('AC-73 (case 14): AI-composed prose in statementText / valueText / label → NOT_LITERAL', async () => {
  const uk = makeUk();
  const textIn = 'I usually sleep badly before an early shift.';
  const { decision } = await runUsi({
    text: textIn, d6: D6_NEW(textIn),
    usi: () => [
      proposal({ statementText: 'The user sleeps poorly before early shifts', factors: [newFactor('sleep badly')], temporality: 'DURABLE' }),
      proposal({ statementText: 'I usually sleep badly', factors: [factor({ newConceptLabel: 'sleep badly', mentionText: 'sleep badly', valueText: 'poor quality' })], temporality: 'DURABLE' }),
      proposal({ statementText: 'I usually sleep badly', factors: [factor({ newConceptLabel: 'Poor Sleep', mentionText: 'Poor Sleep' })], temporality: 'DURABLE' })
    ]
  });
  assert.deepEqual(codes(decision), ['NOT_LITERAL', 'NOT_LITERAL', 'NOT_LITERAL']);
  assert.equal((await execute(uk, decision)).writes, 0);
});

// ═══════════════════ §28 target-authority pressure tests 15a … 22b (AC-74 … AC-89) ═══════════════════
const FORGET_KNEE = 'Forget what I told you about my knee';

async function kneeWorld(uk, opts) {
  const o = opts || {};
  const ids = {};
  ids.knee = await uk.concept('knee');
  ids.sleep = await uk.concept('sleep');
  ids.coffee = await uk.concept('coffee');
  ids.R1 = await uk.userRecord([{ conceptId: ids.knee, role: 'subject' }], 'my knee clicks on the way down', o.r1Origin);
  ids.R2 = await uk.userRecord([{ conceptId: ids.sleep, role: 'subject' }], 'I nap after lunch', o.r2Origin);
  ids.R3 = await uk.userRecord([{ conceptId: ids.coffee, role: 'subject' }], 'one cup a day', o.r3Origin);
  if (o.withR4) {
    ids.stairs = await uk.concept('stairs');
    ids.R4 = await uk.userRecord([{ conceptId: ids.knee, role: 'subject' }, { conceptId: ids.stairs, role: 'condition' }], 'my knee hurts on steps');
  }
  return ids;
}
async function expectZeroMutation(uk, decision, expectedCodes) {
  assert.deepEqual(codes(decision), expectedCodes);
  const govBefore = uk.governed.calls.length;
  const { writes } = await execute(uk, decision);
  assert.equal(writes, 0, 'zero store/port mutation calls');
  assert.equal(uk.governed.calls.length, govBefore, 'zero governed-port calls');
}

test('AC-74 (case 15a): "Forget what I told you about my knee", R1(knee)/R2(sleep)/R3(coffee) → executes forgetRecord(R1)', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const { decision } = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R1, FORGET_KNEE, 'my knee', 'NAMED')] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['DELETED']);
  assert.equal(uk.record(w.R1), null);
  assert.ok(uk.record(w.R2) && uk.record(w.R3));
});

test('AC-75 (case 15b): R1(knee) and R4(knee, stairs) both presented → [R1] AMBIGUOUS_TARGET; [R1, R4] INVALID_SHAPE; nothing deleted', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk, { withR4: true });
  const a = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R1, FORGET_KNEE, 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, a.decision, ['AMBIGUOUS_TARGET']);
  const b = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: () => [proposal({ operation: 'FORGET', targetRecordIds: [w.R1, w.R4], requestText: FORGET_KNEE, referenceText: 'my knee', referenceKind: 'NAMED' })] });
  await expectZeroMutation(uk, b.decision, ['INVALID_SHAPE']);
  assert.ok(uk.record(w.R1) && uk.record(w.R4));
});

test('AC-76 (case 15c): a Safety intake recognized a span overlapping "my knee" → SAFETY_OWNED_SPAN', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const rcf = { candidates: [{ domain: RiskCharacteristicValidator.RISK_DOMAINS[0], severity: RiskCharacteristicValidator.CONSTRAINT_SEVERITY[0], anchorText: 'my knee' }] };
  const { decision } = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), rcfResponse: rcf, usi: () => [mutation('FORGET', w.R1, FORGET_KNEE, 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, decision, ['SAFETY_OWNED_SPAN']);
});

const RCC_W = [
  { turnId: 'usi-w-1', createdAt: 1759999990000, userText: 'something earlier', assistantText: 'ok' },
  { turnId: 'usi-w-2', createdAt: 1759999995000, userText: 'something else', assistantText: 'ok' }
];

test('AC-77 (case 16): "Forget that", R5 is the only presented record originating in W → executes forgetRecord(R5)', async () => {
  const uk = makeUk();
  await kneeWorld(uk);
  const c = await uk.concept('balcony plants');
  const R5 = await uk.userRecord([{ conceptId: c, role: 'subject' }], 'I water the balcony plants daily', 'usi-w-2');
  const { decision } = await runUsi({ text: 'Forget that', rccItems: RCC_W, d6: D6_CWF('Forget that'), usi: () => [mutation('FORGET', R5, 'Forget that', 'that', 'DEICTIC')] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['DELETED']);
});

test('AC-78 (case 17): "Forget that", R5 and R6 both originate in W → AMBIGUOUS_TARGET', async () => {
  const uk = makeUk();
  await kneeWorld(uk);
  const c = await uk.concept('balcony plants');
  const R5 = await uk.userRecord([{ conceptId: c, role: 'subject' }], 'I water the balcony plants daily', 'usi-w-2');
  await uk.userRecord([{ conceptId: c, role: 'condition' }], 'balcony plants calm me', 'usi-w-1');
  const { decision } = await runUsi({ text: 'Forget that', rccItems: RCC_W, d6: D6_CWF('Forget that'), usi: () => [mutation('FORGET', R5, 'Forget that', 'that', 'DEICTIC')] });
  await expectZeroMutation(uk, decision, ['AMBIGUOUS_TARGET']);
});

test('AC-79 (case 17b): "Forget that" after FITME talked about an older R7 whose origin is not in W → TARGET_NOT_GROUNDED', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const { decision } = await runUsi({ text: 'Forget that', rccItems: RCC_W, d6: D6_CWF('Forget that'), usi: () => [mutation('FORGET', w.R3, 'Forget that', 'that', 'DEICTIC')] });
  await expectZeroMutation(uk, decision, ['TARGET_NOT_GROUNDED']);
});

const NOT_TRUE = "That's not true anymore";

test('AC-80 (case 18): "That\'s not true anymore", one user-stated record originates in W → retractRecord(R5); rejected, not deleted', async () => {
  const uk = makeUk();
  await kneeWorld(uk);
  const c = await uk.concept('balcony plants');
  const R5 = await uk.userRecord([{ conceptId: c, role: 'subject' }], 'I water the balcony plants daily', 'usi-w-2');
  const { decision } = await runUsi({ text: NOT_TRUE, rccItems: RCC_W, d6: D6_CWF(NOT_TRUE), usi: () => [mutation('WITHDRAW', R5, NOT_TRUE, 'That', 'DEICTIC')] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  await execute(uk, decision);
  assert.equal(uk.record(R5).status, 'rejected');
  assert.equal(uk.record(R5).correctionHistory.slice(-1)[0].userOriginTurnId, 'usi-t-1');
});

test('AC-81 (case 18b): "That\'s not true anymore", no presented record originates in W → TARGET_NOT_GROUNDED', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const { decision } = await runUsi({ text: NOT_TRUE, rccItems: RCC_W, d6: D6_CWF(NOT_TRUE), usi: () => [mutation('WITHDRAW', w.R2, NOT_TRUE, 'That', 'DEICTIC')] });
  await expectZeroMutation(uk, decision, ['TARGET_NOT_GROUNDED']);
});

test('AC-82 (case 19): "That\'s not true anymore", R5 and R6 originate in W → AMBIGUOUS_TARGET', async () => {
  const uk = makeUk();
  await kneeWorld(uk);
  const c = await uk.concept('balcony plants');
  const R5 = await uk.userRecord([{ conceptId: c, role: 'subject' }], 'I water the balcony plants daily', 'usi-w-2');
  await uk.userRecord([{ conceptId: c, role: 'condition' }], 'balcony plants calm me', 'usi-w-1');
  const { decision } = await runUsi({ text: NOT_TRUE, rccItems: RCC_W, d6: D6_CWF(NOT_TRUE), usi: () => [mutation('WITHDRAW', R5, NOT_TRUE, 'That', 'DEICTIC')] });
  await expectZeroMutation(uk, decision, ['AMBIGUOUS_TARGET']);
});

const PASTA_TURN = 'Actually, it wasn\'t pasta — it was the huge portion';
async function pastaWorld(uk, withR9) {
  const pasta = await uk.concept('pasta');
  const heavy = await uk.concept('feeling heavy');
  const R8 = await uk.inferredRecord([{ conceptId: pasta, role: 'condition' }, { conceptId: heavy, role: 'outcome' }], 'pasta before evening training co-occurs with feeling heavy');
  const out = { pasta, heavy, R8 };
  if (withR9) {
    const late = await uk.concept('late dinners');
    out.R9 = await uk.inferredRecord([{ conceptId: pasta, role: 'subject' }, { conceptId: late, role: 'condition' }], 'pasta at late dinners');
  }
  return out;
}
const pastaCorrection = (w, targets) => proposal({
  operation: 'CORRECT', targetRecordIds: targets, requestText: PASTA_TURN, referenceText: 'pasta', referenceKind: 'NAMED',
  statementText: 'it was the huge portion', factors: [newFactor('huge portion', 'condition'), factor({ conceptId: w.heavy, role: 'outcome' })], temporality: 'DURABLE'
});

test('AC-83 (case 20): "Actually, it wasn\'t pasta — it was the huge portion" against FITME-inferred R8 → governed correctInferredKnowledge; successor user_stated "it was the huge portion"; R8 superseded; INV-UC-S', async () => {
  const uk = makeUk();
  const w = await pastaWorld(uk, false);
  const { decision } = await runUsi({ text: PASTA_TURN, d6: D6_CWF(PASTA_TURN), usi: () => [pastaCorrection(w, [w.R8])] });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['COMMITTED']);
  const r8 = uk.record(w.R8);
  assert.equal(r8.status, 'superseded');
  const succ = uk.record(r8.supersededBy[0]);
  assert.equal(succ.source, 'user_stated');
  assert.equal(succ.relationDescription, 'it was the huge portion');
  assert.ok(succ.factors.some((f) => f.conceptId === w.heavy && f.valueDescription === null), 'carry-forward concept is structure, not text');
  assert.deepEqual(succ.evidence.supporting.map((e) => e.refId), ['CONVERSATION_TURN:usi-t-1']);
  assert.ok(succ.correctionHistory.concat(r8.correctionHistory.slice(-1)).every((h) => h.userOriginTurnId === 'usi-t-1'));
});

test('AC-84 (case 20b): a second presented record R9 also has label "pasta" → [R8] AMBIGUOUS_TARGET; [R8, R9] INVALID_SHAPE; nothing superseded', async () => {
  const uk = makeUk();
  const w = await pastaWorld(uk, true);
  const a = await runUsi({ text: PASTA_TURN, d6: D6_CWF(PASTA_TURN), usi: () => [pastaCorrection(w, [w.R8])] });
  await expectZeroMutation(uk, a.decision, ['AMBIGUOUS_TARGET']);
  const b = await runUsi({ text: PASTA_TURN, d6: D6_CWF(PASTA_TURN), usi: () => [pastaCorrection(w, [w.R8, w.R9])] });
  await expectZeroMutation(uk, b.decision, ['INVALID_SHAPE']);
  assert.equal(uk.record(w.R8).status, 'candidate');
});

test('AC-85 (case 21): the model selects real presented R2 (sleep) for "Forget what I told you about my knee" → TARGET_NOT_GROUNDED', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const { decision } = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R2, FORGET_KNEE, 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, decision, ['TARGET_NOT_GROUNDED']);
});

test('AC-86 (case 21b): label-free sub-span "I told you" to ground R2 (unique from recent turns) → NAMED TARGET_NOT_GROUNDED; DEICTIC REFERENCE_KIND_MISMATCH', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk, { r2Origin: 'usi-w-2' });
  const named = await runUsi({ text: FORGET_KNEE, rccItems: RCC_W, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R2, FORGET_KNEE, 'I told you', 'NAMED')] });
  await expectZeroMutation(uk, named.decision, ['TARGET_NOT_GROUNDED']);
  const deictic = await runUsi({ text: FORGET_KNEE, rccItems: RCC_W, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R2, FORGET_KNEE, 'I told you', 'DEICTIC')] });
  await expectZeroMutation(uk, deictic.decision, ['REFERENCE_KIND_MISMATCH']);
});

test('AC-87 (case 21c): "Forget what I said about coffee and my knee", the model narrows referenceText to "my knee" → AMBIGUOUS_TARGET (multi-record forget deferred)', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk);
  const t = 'Forget what I said about coffee and my knee';
  const { decision } = await runUsi({ text: t, d6: D6_CWF(t), usi: () => [mutation('FORGET', w.R1, t, 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, decision, ['AMBIGUOUS_TARGET']);
  // narrowed request as well as narrowed reference: still judged against the WHOLE turn
  const n = await runUsi({ text: t, d6: D6_CWF(t), usi: () => [mutation('FORGET', w.R1, 'and my knee', 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, n.decision, ['AMBIGUOUS_TARGET']);
});

test('AC-88 (case 22): the model selects the wrong real record R4 when the user means R1 → AMBIGUOUS_TARGET', async () => {
  const uk = makeUk();
  const w = await kneeWorld(uk, { withR4: true });
  const { decision } = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: () => [mutation('FORGET', w.R4, FORGET_KNEE, 'my knee', 'NAMED')] });
  await expectZeroMutation(uk, decision, ['AMBIGUOUS_TARGET']);
});

test('AC-89 (case 22b) — DOCUMENTED RESIDUAL RISK (i), §15.4.7: the intended older record is NOT presented and presented R4 is the only record with label "knee" → G* = {R4}; the forget EXECUTES. Accepted only while testable-not-live (§08.3 item 8; CAL-8(a) = 0 before live activation)', async () => {
  const uk = makeUk();
  const knee = await uk.concept('knee');
  const Rold = await uk.userRecord([{ conceptId: knee, role: 'subject' }], 'my knee was operated on');
  for (let i = 0; i < 10; i++) await uk.concept('filler concept ' + i);
  const stairs = await uk.concept('stairs');
  const R4 = await uk.userRecord([{ conceptId: knee, role: 'subject' }, { conceptId: stairs, role: 'condition' }], 'my knee hurts on steps');
  const { decision } = await runUsi({ text: FORGET_KNEE, d6: D6_CWF(FORGET_KNEE), usi: (body) => {
    assert.equal(body.messages[0].content.indexOf(Rold), -1, 'the older record is not presented');
    return [mutation('FORGET', R4, FORGET_KNEE, 'my knee', 'NAMED')];
  } });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  const { res } = await execute(uk, decision);
  assert.deepEqual(res.outcomes.map((o) => o.status), ['DELETED'], 'residual risk (i) is real and documented');
  assert.equal(uk.record(R4), null);
  assert.ok(uk.record(Rold));
});

// ═══════════════════ AC-12 / AC-53 — anchors and Dimension 6 never leak ═══════════════════
test('AC-12 / AC-53: the CPI anchor, Dimension 6, OpenUnderstanding and the authority anchors never reach pipelineContext, persisted records, history or the decision plans', async () => {
  const uk = makeUk();
  const nights = await uk.concept('night shifts');
  const r1 = await uk.userRecord([{ conceptId: nights, role: 'condition' }], 'I work night shifts');
  const REQ = 'MARKER-REQ what I said about night shifts is not true anymore';
  const { decision, result } = await runUsi({
    text: REQ, d6: D6_CWF('MARKER-REQ'), usi: () => [mutation('WITHDRAW', r1, REQ, 'night shifts', 'NAMED')]
  });
  assert.deepEqual(codes(decision), ['ACCEPTED']);
  assert.equal(JSON.stringify(decision).indexOf('MARKER-REQ'), -1, 'authority anchors are not in the plan');
  assert.equal(JSON.stringify(result.output.pipelineContext).indexOf('userStatedKnowledge'), -1);
  await execute(uk, decision);
  assert.equal(JSON.stringify(uk.peek()).indexOf('MARKER-REQ'), -1, 'authority anchors are never persisted');
  // CPI anchor and the recognition record: never in pipelineContext or the engine result (the
  // turn's own text legitimately appears in pipelineContext, so keys are checked, not substrings);
  // never in User Knowledge. The USI request carries no Dimension 6, OpenUnderstanding or Need field.
  const captures = {};
  const pref = await runUsi({
    text: 'I prefer training in the morning because evenings are for my children.', epsi: PREF_MORNING, anchor: 'I prefer training in the morning',
    d6: D6_NEW('evenings are for my children'), captures, usi: () => []
  });
  const keys = new Set();
  (function walk(v) { if (v && typeof v === 'object') Object.keys(v).forEach((k) => { keys.add(k); walk(v[k]); }); })(pref.result);
  ['assertionAnchorText', 'anchor', 'recognition', 'ownedSpans', 'userStatedKnowledge', 'openUnderstanding', 'cpiAssertion'].forEach((k) => assert.equal(keys.has(k), false, k));
  const usiBody = JSON.stringify(captures.USER_STATED_INTAKE);
  ['userStatedKnowledge', 'NEW_USER_KNOWLEDGE', 'CORRECTION_WITHDRAW_FORGET', 'openUnderstanding', 'interpretationAuthority', 'needShape', 'DERIVED_INTERPRETATION'].forEach((k) => assert.equal(usiBody.indexOf(k), -1, k));
});
