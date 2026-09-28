// OU-001 — Production-Backed Acceptance (docs/specs/OU_001_SPEC_v1.0.md §14–§16, §22).
// Exercises the real DIRECT_TURN_PASS chain (internalPipelineOrchestrator.run) with every
// model-using component stubbed through its production configure() seam and COUNTED. The
// makeHarness() function below is byte-identical to the harness used to record the
// pre-implementation baselines on commit 21f15de09246c6fb8c980f3715242db06cbc297d (OU-001 §22
// "Pre-implementation baseline" (a)); the pinned call counts and the pinned TRR request-body hash
// below were recorded there, before any production file changed.
// Run with: node --test tests/ou001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const req = (p) => require(path.join(__dirname, '..', p));

function makeHarness(req) {
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
  const TrainingReadinessReasoningComponent = req('js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
  const GeneralReasoningCapability = req('js/coachDecisionSystem/generalReasoningCapability.js');
  const ExpressionRenderer = req('js/coachDecisionSystem/expressionRenderer.js');
  const TrrCapabilityAdapter = req('js/coachDecisionSystem/trrCapabilityAdapter.js');
  const Orchestrator = req('js/coachDecisionSystem/internalPipelineOrchestrator.js');

  const TODAY = DateUtils.getTodayKey();
  const FIXED_SUBMITTED_AT = 1760000000000;

  function idsIn(body, re) {
    return (body.messages[0].content.match(re) || []).map((m) => m.match(/"([^"]+)"/)[1]);
  }
  function text(obj) { return { content: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }; }

  function closedEntry(id, overrides) {
    return Object.assign({
      id: id, affirmativeRequestPresent: false, domain: null, topic: null,
      currentStateStatementPresent: false, currentStateStatementText: null,
      negativeControlPresent: false, desireOnlyPresent: false,
      personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
    }, overrides || {});
  }

  // scn: { turnId, text, tu, openSegment, epsi, rccItems, captures }
  function configureAll(scn, counts) {
    function counted(name, fn) {
      return async (body) => {
        counts.total++;
        counts.byComponent[name] = (counts.byComponent[name] || 0) + 1;
        if (scn.captures) { (scn.captures[name] = scn.captures[name] || []).push(body); }
        return fn(body);
      };
    }
    StateAccess.configure({
      getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
      getCurrentUser: () => ({ uid: 'ou-user' }),
      isSessionCurrent: (gen) => gen === 1,
      fetchUserStatedMemory: async () => [],
      fetchRecentConversation: async (pageSize, afterCreatedAt, afterTurnId) => {
        const all = scn.rccItems || [];
        let start = 0;
        if (afterCreatedAt !== undefined) {
          start = all.findIndex((t) => t.createdAt === afterCreatedAt && t.turnId === afterTurnId) + 1;
        }
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
        const closed = JSON.stringify({ results: ids.map((id) => closedEntry(id, id === scn.turnId ? scn.tu : {})) });
        const out = scn.openSegment !== undefined ? closed + '\n@@OPEN_UNDERSTANDING@@\n' + scn.openSegment : closed;
        return Object.assign(text(out), scn.stopReason ? { stop_reason: scn.stopReason } : {});
      })
    });
    ExplicitRequestInterpreter.configure({ callClaude: counted('EXPLICIT_REQUEST', async () => text({ results: [] })) });
    ReadinessStateInterpreter.configure({
      callClaude: counted('READINESS_STATE', async (body) => {
        const ids = idsIn(body, /id="([^"]+)"/g);
        return text({ results: ids.map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) });
      })
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
        return text({ results: [Object.assign({ id, preferenceClass: null, polarity: null, target: null, ineligibleReason: null }, res)] });
      })
    });
    RiskCharacteristicInterpreter.configure({
      callClaude: counted('RISK_CHARACTERISTIC', async () => text(scn.rcfResponse || { tags: [], candidates: [] }))
    });
    TrainingReadinessReasoningComponent.configure({
      callClaude: counted('TRR_REASONING', async () => text({
        outcome: 'ACTION_PROPOSED',
        action: 'שקול/י אימון קליל וקצר יותר היום.',
        actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
        rationale: 'בקשה ישירה של המשתמש.', evidenceBasis: 'בקשה ישירה של המשתמש.',
        expectedValue: 'התאמת העצימות.', uncertainty: 'נמוכה.'
      }))
    });
    GeneralReasoningCapability.configure({ callClaude: counted('GENERAL_REASONING', async () => text({})) });
    ExpressionRenderer.configure({ generateFn: counted('EXPRESSION', async () => 'תגובת מאמן לדוגמה (stub).') });
  }

  function resetAll() {
    [TurnUnderstandingInterpreter, ExplicitRequestInterpreter, ReadinessStateInterpreter, SituationalContextInterpreter,
      SafetyContextInterpreter, UserSafetyProvenanceInterpreter, ActivityPreferenceInterpreter, ActivityOppositionInterpreter,
      ExplicitPreferenceStatementInterpreter, RiskCharacteristicInterpreter, TrainingReadinessReasoningComponent,
      GeneralReasoningCapability].forEach((m) => m.configure({ callClaude: null }));
    ExpressionRenderer.configure({ generateFn: null });
  }

  async function runScenario(scn) {
    TrrCapabilityAdapter.registerAll();
    const counts = { total: 0, byComponent: {} };
    configureAll(scn, counts);
    const turn = { turnId: scn.turnId, text: scn.text, submittedAt: FIXED_SUBMITTED_AT, sessionGeneration: 1 };
    const result = await Orchestrator.run({
      userId: 'ou-user', sessionGeneration: 1, runId: 'ou-run-' + scn.turnId,
      trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: FIXED_SUBMITTED_AT
    });
    resetAll();
    return { counts, result, turn };
  }

  // The call-count baseline scenarios (DUC-001 / CPI-001 / Item 6 production-backed shapes).
  const CALL_COUNT_SCENARIOS = [
    { name: 'DUC_TRR_ROUTED_REQUEST', turnId: 'ou-cc-1', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?',
      tu: { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות' } },
    { name: 'DUC_UNSUPPORTED_REQUEST', turnId: 'ou-cc-2', text: 'כמה חלבון נשאר לי היום?',
      tu: { affirmativeRequestPresent: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE' } },
    { name: 'CPI_PREFERENCE_STATEMENT', turnId: 'ou-cc-3', text: 'אני ממש אוהב לרוץ',
      tu: {}, epsi: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'לרוץ' } },
    { name: 'ITEM6_STATE_DISCLOSURE', turnId: 'ou-cc-4', text: 'ישנתי גרוע הלילה',
      tu: { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי גרוע הלילה' } },
    { name: 'CASUAL_NO_REQUEST', turnId: 'ou-cc-5', text: 'תודה!', tu: {} }
  ];

  return { runScenario, closedEntry, CALL_COUNT_SCENARIOS, FIXED_SUBMITTED_AT, resetAll };
}

const H = makeHarness(req);
const Orchestrator = req('js/coachDecisionSystem/internalPipelineOrchestrator.js');
const TurnUnderstandingInterpreter = req('js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const NeedCreator = req('js/coachDecisionSystem/conversationalNeedCreator.js');
const CapabilityRegistry = req('js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = req('js/coachDecisionSystem/contextComposer.js');
const ContextRelevancePlanner = req('js/coachDecisionSystem/contextRelevancePlanner.js');
const EligibilityPolicy = req('js/coachDecisionSystem/eligibilityPolicy.js');
const GeneralReasoningCapability = req('js/coachDecisionSystem/generalReasoningCapability.js');
const TrrCapabilityAdapter = req('js/coachDecisionSystem/trrCapabilityAdapter.js');
const SafetyLayer = req('js/coachDecisionSystem/safetyLayer.js');
const SafetyContextInterpreter = req('js/coachDecisionSystem/safetyContextInterpreter.js');
const SafetyDisclosureIntakeGate = req('js/coachDecisionSystem/safetyDisclosureIntakeGate.js');
const PreferenceIntakeGate = req('js/coachDecisionSystem/preferenceIntakeGate.js');
const RiskCharacteristicInterpreter = req('js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const RiskCharacteristicIntakeGate = req('js/coachDecisionSystem/riskCharacteristicIntakeGate.js');

test.before(() => { TrrCapabilityAdapter.registerAll(); GeneralReasoningCapability.registerAll(); });
test.afterEach(() => { H.resetAll(); });

// ── Pinned on baseline commit 21f15de (pre-implementation baseline (a)) ──
const PINNED_CALL_COUNTS = {
  DUC_TRR_ROUTED_REQUEST: { total: 9, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 2, TRR_REASONING: 1, EXPRESSION: 1 } },
  DUC_UNSUPPORTED_REQUEST: { total: 6, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, RISK_CHARACTERISTIC: 1, EXPRESSION: 1 } },
  CPI_PREFERENCE_STATEMENT: { total: 6, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 1 } },
  ITEM6_STATE_DISCLOSURE: { total: 7, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 1, EXPRESSION: 1 } },
  CASUAL_NO_REQUEST: { total: 5, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, RISK_CHARACTERISTIC: 1 } }
};
// sha256 of JSON.stringify(captured TRR reasoning request bodies) for DUC_TRR_ROUTED_REQUEST at baseline.
const PINNED_TRR_BODY_SHA256 = 'af3763893eee88d13f7b1256de297b3d942e45ae4d80d7cdf5efc50fa6c8fdd5';

const MARKER = 'OU001-MARKER-7f3c';
const OPEN_KEYS = ['openUnderstanding', 'openScopeDescription', 'openEntityMentions'];

function firstWord(text) { return text.split(/\s+/)[0]; }
function openSegment(turnId, summary, mentions) { return JSON.stringify({ id: turnId, summary: summary, mentions: mentions }); }
function withOpen(scn) {
  return Object.assign({}, scn, { openSegment: openSegment(scn.turnId, MARKER + ' — what the user means.', [firstWord(scn.text)]) });
}
function keysDeep(value, out) {
  out = out || new Set();
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => { out.add(k); keysDeep(value[k], out); });
  }
  return out;
}
async function withFixedNow(fn) {
  const orig = Date.now;
  Date.now = () => H.FIXED_SUBMITTED_AT;
  try { return await fn(); } finally { Date.now = orig; }
}
function spy(obj, name, sink) {
  const original = obj[name];
  obj[name] = function () { sink.push(Array.prototype.slice.call(arguments)); return original.apply(this, arguments); };
  return () => { obj[name] = original; };
}

// ═══ AC-24 — no new model call ═══
test('AC-24: per-scenario model-call counts equal the pinned baseline, with and without an open segment; GENERAL_REASONING is never called', async () => {
  for (const scn of H.CALL_COUNT_SCENARIOS) {
    for (const variant of [scn, withOpen(scn)]) {
      const { counts } = await H.runScenario(variant);
      assert.equal(counts.total, PINNED_CALL_COUNTS[scn.name].total, scn.name + ' total');
      assert.deepEqual(counts.byComponent, PINNED_CALL_COUNTS[scn.name].byComponent, scn.name + ' by component');
      assert.equal(counts.byComponent.GENERAL_REASONING, undefined);
    }
  }
});

// ═══ AC-18 / AC-19 — not in the engine result, not in pipelineContext ═══
test('AC-18 / AC-19: OpenUnderstanding content and open keys never appear in the engine result, the terminalDecision, or pipelineContext', async () => {
  for (const scn of H.CALL_COUNT_SCENARIOS) {
    const { result } = await H.runScenario(withOpen(scn));
    assert.equal(result.status, 'SUCCESS', scn.name);
    const serialized = JSON.stringify(result);
    assert.equal(serialized.indexOf(MARKER), -1, scn.name + ': marker leaked into the engine result');
    const keys = keysDeep(result);
    OPEN_KEYS.forEach((k) => assert.equal(keys.has(k), false, scn.name + ': key ' + k + ' leaked'));
    assert.equal('openUnderstanding' in result.output.pipelineContext, false);
    assert.deepEqual(Object.keys(result.output).filter((k) => OPEN_KEYS.indexOf(k) >= 0), []);
  }
});

// ═══ AC-21 — Safety independence ═══
test('AC-21: every Safety input (Safety interpreters and SafetyLayer detect/disqualify/finalReview arguments) is identical with a valid OpenUnderstanding and with none', async () => {
  const scenarios = [H.CALL_COUNT_SCENARIOS[0], H.CALL_COUNT_SCENARIOS[3]]; // TRR-routed request; Item 6 disclosure
  for (const scn of scenarios) {
    const observed = [];
    for (const variant of [scn, withOpen(scn)]) {
      const calls = [];
      const restore = [spy(SafetyLayer, 'detectSafetyOpportunities', calls), spy(SafetyLayer, 'disqualify', calls), spy(SafetyLayer, 'finalReview', calls)];
      const captured = Object.assign({}, variant, { captures: {} });
      try { await withFixedNow(() => H.runScenario(captured)); } finally { restore.forEach((r) => r()); }
      assert.ok(calls.length >= 1, scn.name + ': sanity — SafetyLayer was exercised');
      observed.push({
        safetyLayer: JSON.stringify(calls),
        safetyContext: JSON.stringify(captured.captures.SAFETY_CONTEXT || []),
        risk: JSON.stringify(captured.captures.RISK_CHARACTERISTIC || [])
      });
    }
    assert.ok(observed[0].safetyLayer.length > 2, scn.name + ': sanity — SafetyLayer was exercised');
    assert.deepEqual(observed[1], observed[0], scn.name + ': Safety inputs differ when OpenUnderstanding is present');
    assert.equal(observed[1].safetyLayer.indexOf(MARKER), -1);
  }
});

// ═══ AC-22 — durable intake stays current-turn anchored ═══
const PRIOR_ONLY = 'running by the harbour';
const CURRENT = { turnId: 't-anchor', text: 'Should I do it again tomorrow?', submittedAt: H.FIXED_SUBMITTED_AT, sessionGeneration: 1 };

test('AC-22 (orchestrator): a prior-turn-only span named by OpenUnderstanding and proposed by the preference interpreter is never authorized for intake', async () => {
  const rccItems = [{ turnId: 't-prior', status: 'COMPLETED', createdAt: 1, userText: 'I loved ' + PRIOR_ONLY + ' this morning.', assistantText: 'Sounds great.', submittedAt: 1 }];
  const { result } = await H.runScenario({
    name: 'AC22', turnId: 't-anchor', text: CURRENT.text, tu: {}, rccItems: rccItems,
    epsi: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: PRIOR_ONLY },
    openSegment: openSegment('t-anchor', 'The user asks whether to go ' + PRIOR_ONLY + ' again.', [PRIOR_ONLY])
  });
  assert.notEqual(result.output.preferenceIntakeAuthorization.authorized, true);
});

test('AC-22 (a): PreferenceIntakeGate rejects a prior-turn-only ACTIVITY_SENTIMENT target with LITERAL_ANCHOR_FAILED', async () => {
  const auth = await PreferenceIntakeGate.authorize({
    interpreterResult: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: PRIOR_ONLY },
    turn: CURRENT, pipelineContext: {}, consentGranted: true
  });
  assert.equal(CURRENT.text.indexOf(PRIOR_ONLY), -1);
  assert.equal(auth.authorized, false);
  assert.equal(auth.reason, 'LITERAL_ANCHOR_FAILED');
  // Positive control: the SAME target stated in the current turn passes the literal-anchor check.
  const control = PreferenceIntakeGate._internal.validateInterpreterResult(
    { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: PRIOR_ONLY }, 'I really enjoy ' + PRIOR_ONLY);
  assert.equal(control.ok, true);
});

test('AC-22 (b): RiskCharacteristicInterpreter drops, and RiskCharacteristicIntakeGate rejects, a prior-turn-only anchor', async () => {
  const anchor = 'allergic to peanuts';
  const turn = { turnId: 't-rcf', text: 'Should I eat it?' };
  RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: JSON.stringify({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: anchor }] }) }] }) });
  const classified = await RiskCharacteristicInterpreter.classifyTurnForDurableConstraint(turn.text);
  assert.equal(classified.status, 'CLASSIFIED');
  assert.deepEqual(classified.candidates, []);
  const auth = await RiskCharacteristicIntakeGate.authorizeNewFact({
    turn: turn, candidate: { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: anchor }, memoryConsent: { granted: true }
  });
  assert.equal(auth.authorized, false);
  assert.equal(auth.reason, 'LITERAL_ANCHOR_FAILED');
  // Positive control: the same anchor stated in the current turn is authorized.
  const control = await RiskCharacteristicIntakeGate.authorizeNewFact({
    turn: { turnId: 't-rcf-2', text: 'I am ' + anchor + ', should I eat it?' },
    candidate: { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: anchor }, memoryConsent: { granted: true }
  });
  assert.equal(control.authorized, true);
});

test('AC-22 (c): SafetyContextInterpreter\'s own literal check drops a prior-turn-only restriction, so SafetyDisclosureIntakeGate authorizes no NEW_RESTRICTION capture', async () => {
  SafetyContextInterpreter.configure({
    callClaude: async (body) => {
      const id = body.messages[0].content.match(/<statement id="([^"]+)"/)[1];
      return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: PRIOR_ONLY, statedDurationText: null }] }) }] };
    }
  });
  const auth = await SafetyDisclosureIntakeGate.authorize({ turn: CURRENT, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.equal(auth.authorized, false);
  assert.equal(auth.candidateRecord, null);
  // Positive control: the same restriction stated in the current turn is captured as NEW_RESTRICTION.
  const control = await SafetyDisclosureIntakeGate.authorize({
    turn: { turnId: 't-sd-2', text: 'My doctor said no ' + PRIOR_ONLY + ' for now.', submittedAt: 1, sessionGeneration: 1 },
    pipelineContext: {}, consentGranted: true, category: 'CAPACITY_OR_CONSTRAINT'
  });
  assert.equal(control.authorized, true);
  assert.equal(control.candidateRecord.mode, 'NEW_RESTRICTION');
  SafetyContextInterpreter.configure({ callClaude: null });
});

// ═══ AC-23 — no authorization expansion ═══
test('AC-23: ContextRelevancePlanner.select() output is identical for {} and for projected/forged Needs (TRR and GENERAL_REASONING); GENERAL_REASONING never receives Safety-adjacent context', async () => {
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } };
  const projected = { needRef: 'n', openScopeDescription: 'The user asks about a run in Mykonos.', openEntityMentions: [{ text: 'Mykonos', origin: 'CURRENT_TURN', sourceTurnId: 't' }] };
  const forged = { needRef: 'n', openScopeDescription: 'medical and safety history please', openEntityMentions: [{ text: 'my heart condition medication', origin: 'CURRENT_TURN', sourceTurnId: 't' }, { text: 'SAFETY_AND_MEDICAL', origin: 'CURRENT_TURN', sourceTurnId: 't' }] };
  for (const capId of ['TRR', 'GENERAL_REASONING']) {
    const cap = CapabilityRegistry.getById(capId);
    const authorize = (p) => EligibilityPolicy.computeEligibility(p, cap, consentState).reasoningAccessAuthorized === true;
    const base = ContextRelevancePlanner.select({}, cap, ContextComposer.getFragmentProvider, authorize);
    assert.deepEqual(ContextRelevancePlanner.select(projected, cap, ContextComposer.getFragmentProvider, authorize), base, capId);
    assert.deepEqual(ContextRelevancePlanner.select(forged, cap, ContextComposer.getFragmentProvider, authorize), base, capId + ' (forged)');
  }
  const pipelineContext = {
    recentConversationContext: { items: [] }, userSafetyContext: { items: [{ restrictedActivityText: 'x' }] }, userSafetyProvenance: { items: [] },
    availability: { recentConversationContext: 'AVAILABLE', userSafetyContext: 'AVAILABLE', userSafetyProvenance: 'AVAILABLE' }
  };
  const withNeed = await GeneralReasoningCapability.buildAuthorizedComposedContext(pipelineContext, consentState, forged);
  const withoutNeed = await GeneralReasoningCapability.buildAuthorizedComposedContext(pipelineContext, consentState);
  const withoutDiscovery = ({ discovery, ...rest }) => rest;   // removes only the E.0.2b-authorized key
  assert.deepEqual(withoutDiscovery(withNeed), withoutDiscovery(withoutNeed));
  assert.deepEqual(withNeed.discovery.selectedIds, []);        // precondition: discovery added nothing
  assert.equal('userSafetyContext' in withNeed.context, false);
  assert.equal('userSafetyProvenance' in withNeed.context, false);
});

// ═══ AC-27 / AC-28 — Need projection; registryNeed and Opportunities unchanged ═══
function closedResponse(turnId, closedOverrides, open) {
  const closed = JSON.stringify({ results: [H.closedEntry(turnId, closedOverrides)] });
  return { content: [{ text: open === undefined ? closed : closed + '\n@@OPEN_UNDERSTANDING@@\n' + JSON.stringify(open) }] };
}
async function understandWith(turn, closedOverrides, open, rcc) {
  TurnUnderstandingInterpreter.configure({ callClaude: async () => closedResponse(turn.turnId, closedOverrides, open) });
  try { return await TurnUnderstandingInterpreter.understand(turn, rcc); } finally { TurnUnderstandingInterpreter.configure({ callClaude: null }); }
}

test('AC-27: a request turn\'s Need carries the projection; a non-request turn has OpenUnderstanding but no Need; a null OpenUnderstanding leaves the Need key-for-key identical to its pre-OU-001 shape', async () => {
  const turn = { turnId: 't-req', text: 'Can I swim in the Aegean before breakfast?' };
  const open = { id: 't-req', summary: 'The user asks whether swimming in the Aegean before breakfast is a good idea.', mentions: ['swim in the Aegean', 'before breakfast'] };
  const pair = await understandWith(turn, { affirmativeRequestPresent: true }, open);
  const result = NeedCreator.recognizeDirectUserNeed(turn, pair.turnUnderstanding, { assembledAt: 5 }, pair.openUnderstanding);
  assert.equal(result.kind, 'UNSUPPORTED');
  assert.deepEqual(Object.keys(result.need).sort(), ['domain', 'needRef', 'openEntityMentions', 'openScopeDescription', 'recognizedAt', 'topic', 'turnId']);
  assert.equal(result.need.openScopeDescription, open.summary);
  assert.deepEqual(result.need.openEntityMentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [['swim in the Aegean', 'CURRENT_TURN', 't-req'], ['before breakfast', 'CURRENT_TURN', 't-req']]);
  assert.equal('shape' in result.need, false);
  result.need.openEntityMentions.forEach((m) => assert.equal('roughKind' in m, false));

  const casualTurn = { turnId: 't-casual', text: 'I am in Mykonos and slept five hours.' };
  const casual = await understandWith(casualTurn, { currentStateStatementPresent: true, currentStateStatementText: 'slept five hours' }, { id: 't-casual', summary: 'The user shares that they are in Mykonos and slept five hours.', mentions: ['Mykonos'] });
  assert.notEqual(casual.openUnderstanding, null);
  assert.equal(NeedCreator.recognizeDirectUserNeed(casualTurn, casual.turnUnderstanding, { assembledAt: 5 }, casual.openUnderstanding), null);

  const noOpen = await understandWith(turn, { affirmativeRequestPresent: true });
  assert.equal(noOpen.openUnderstanding, null);
  const legacy = NeedCreator.recognizeDirectUserNeed(turn, noOpen.turnUnderstanding, { assembledAt: 5 }, noOpen.openUnderstanding);
  const legacyNoArg = NeedCreator.recognizeDirectUserNeed(turn, noOpen.turnUnderstanding, { assembledAt: 5 });
  assert.deepEqual(Object.keys(legacy.need), ['needRef', 'turnId', 'domain', 'topic', 'recognizedAt']);
  assert.deepEqual(legacy, legacyNoArg);
  // A different turn's OpenUnderstanding is never projected.
  const mismatched = NeedCreator.recognizeDirectUserNeed(turn, noOpen.turnUnderstanding, { assembledAt: 5 }, casual.openUnderstanding);
  assert.deepEqual(mismatched, legacyNoArg);
});

test('AC-28: registryNeed is still exactly {legacyScopeMatch}, and the TRR Opportunity is deep-equal with and without OpenUnderstanding', async () => {
  const turn = { turnId: 't-trr', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?' };
  const pair = await understandWith(turn, { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, { id: 't-trr', summary: 'The user asks whether to train today after five hours of sleep.', mentions: ['ישנתי 5 שעות'] });
  assert.notEqual(pair.openUnderstanding, null);
  const registryArgs = [];
  const restore = spy(CapabilityRegistry, 'resolveCapability', registryArgs);
  let withOu; let withoutOu;
  try {
    withOu = NeedCreator.recognizeDirectUserNeed(turn, pair.turnUnderstanding, { assembledAt: 5 }, pair.openUnderstanding);
    withoutOu = NeedCreator.recognizeDirectUserNeed(turn, pair.turnUnderstanding, { assembledAt: 5 });
  } finally { restore(); }
  registryArgs.forEach((args) => assert.deepEqual(args[0], { legacyScopeMatch: { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } }));
  assert.equal(withOu.kind, 'DETECTED_OPPORTUNITY');
  assert.deepEqual(withOu, withoutOu);
  assert.equal(JSON.stringify(withOu).indexOf('five hours of sleep'), -1);
});

// ═══ Mykonos continuity through the real orchestrator ═══
test('Mykonos / recent-conversation continuity (orchestrator): a casual first turn creates no Need; the later "Do you think I should?" reaches the Need Creator with an OpenUnderstanding whose mentions resolve to the prior turn', async () => {
  const prior = "I'm in Mykonos, slept five hours, and I'm thinking about going for a run before dinner.";
  const needCalls = [];
  const restore = spy(NeedCreator, 'recognizeDirectUserNeed', needCalls);
  try {
    const first = await H.runScenario({
      name: 'MYK-1', turnId: 't-myk-1', text: prior,
      tu: { currentStateStatementPresent: true, currentStateStatementText: 'slept five hours', desireOnlyPresent: false },
      openSegment: openSegment('t-myk-1', 'The user is in Mykonos, slept five hours, and is considering a pre-dinner run.', ['Mykonos', 'slept five hours', 'a run before dinner'])
    });
    assert.equal(first.result.status, 'SUCCESS');
    assert.notEqual(needCalls[0][3], null, 'OpenUnderstanding is produced for a turn with no request');

    const captures = {};
    const rccItems = [{ turnId: 't-myk-1', status: 'COMPLETED', createdAt: 1, userText: prior, assistantText: 'Thanks for telling me.', submittedAt: 1 }];
    await H.runScenario({
      name: 'MYK-2', turnId: 't-myk-2', text: 'Do you think I should?', captures: captures, rccItems: rccItems,
      tu: { affirmativeRequestPresent: true },
      openSegment: openSegment('t-myk-2', 'The user asks whether to go for the pre-dinner run in Mykonos after five hours of sleep.', ['Mykonos', 'slept five hours', 'before dinner'])
    });
    assert.ok(captures.TURN_UNDERSTANDING[0].messages[0].content.indexOf(prior) >= 0, 'the prior turn reached the single TU call');
    const second = needCalls[1];
    assert.deepEqual(second[3].mentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [
      ['Mykonos', 'RECENT_USER_TURN', 't-myk-1'], ['slept five hours', 'RECENT_USER_TURN', 't-myk-1'], ['before dinner', 'RECENT_USER_TURN', 't-myk-1']
    ]);
  } finally { restore(); }
  // Results of the spied calls: first returned null (no request), second a real Need with the projection.
  const firstResult = NeedCreator.recognizeDirectUserNeed(...needCalls[0]);
  const secondResult = NeedCreator.recognizeDirectUserNeed(...needCalls[1]);
  assert.equal(firstResult, null);
  assert.equal(secondResult.kind, 'UNSUPPORTED');
  assert.equal(secondResult.need.openEntityMentions[0].origin, 'RECENT_USER_TURN');
});

// ═══ AC-29 — the real Need reaches General Reasoning's seams (still non-live) ═══
test('AC-29: a production-derived Need reaches GeneralReasoningCapability.reason() with the summary in its Need JSON; buildAuthorizedComposedContext(pc, consent, need) equals the {} composition', async () => {
  const turn = { turnId: 't-gr', text: 'How should I pace a padel tournament weekend?' };
  const pair = await understandWith(turn, { affirmativeRequestPresent: true }, { id: 't-gr', summary: 'The user asks how to pace a padel tournament weekend.', mentions: ['padel tournament weekend'] });
  const need = NeedCreator.recognizeDirectUserNeed(turn, pair.turnUnderstanding, { assembledAt: 5 }, pair.openUnderstanding).need;
  const prompts = [];
  GeneralReasoningCapability.configure({ callClaude: async (body) => { prompts.push(body.messages[0].content); return { content: [{ text: '{}' }] }; } });
  await GeneralReasoningCapability.reason(need, {});
  const needLine = prompts[0].split('\n').find((l) => l.indexOf('Need: ') === 0);
  assert.ok(needLine.indexOf('The user asks how to pace a padel tournament weekend.') >= 0);
  assert.ok(needLine.indexOf('padel tournament weekend') >= 0);
  const consentState = { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } };
  const pc = { recentConversationContext: { items: [] }, currentStateContext: { x: 1 }, availability: { recentConversationContext: 'AVAILABLE', currentStateContext: 'AVAILABLE' } };
  const withNeed = await GeneralReasoningCapability.buildAuthorizedComposedContext(pc, consentState, need);
  const withoutNeed = await GeneralReasoningCapability.buildAuthorizedComposedContext(pc, consentState);
  const withoutDiscovery = ({ discovery, ...rest }) => rest;   // removes only the E.0.2b-authorized key
  assert.deepEqual(withoutDiscovery(withNeed), withoutDiscovery(withoutNeed));
  assert.deepEqual(withNeed.discovery.selectedIds, []);        // precondition: discovery added nothing
});

// ═══ AC-31 — TRR zero drift ═══
test('AC-31: the TRR reasoning request body is byte-identical to the pinned baseline, with and without an OpenUnderstanding', async () => {
  const hashes = [];
  for (const variant of [H.CALL_COUNT_SCENARIOS[0], withOpen(H.CALL_COUNT_SCENARIOS[0])]) {
    const captured = Object.assign({}, variant, { captures: {} });
    await H.runScenario(captured);
    hashes.push(crypto.createHash('sha256').update(JSON.stringify(captured.captures.TRR_REASONING)).digest('hex'));
  }
  assert.equal(hashes[0], PINNED_TRR_BODY_SHA256);
  assert.equal(hashes[1], PINNED_TRR_BODY_SHA256);
});
