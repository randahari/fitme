// CPI-001 — Conversational Preference Intake V1 Production-Backed Acceptance (docs/specs/
// CPI_001_SPEC_v1.0.md). Exercises the real, unmodified production chain: a CurrentUserTurn ->
// internalPipelineOrchestrator.run({action:'DIRECT_TURN_PASS'}) -> ExplicitPreferenceStatementInterpreter
// -> preferenceIntakeGate.js (including the real, independent SafetyContextInterpreter veto) ->
// (simulating app.js's own persistence boundary) ->
// internalPipelineOrchestrator.run({action:'PREFERENCE_ACKNOWLEDGMENT_FINALIZE'}) -> the SAME,
// real, unmodified Stage-10 Expression mechanics DUC-001's own acceptance file already exercises.
// No live LLM, no live Firestore (the Typed Memory write itself is simulated, matching
// tests/duc001ProductionBackedAcceptance.test.js's own "No live Chat" discipline — js/memory.js's
// own CRUD is browser-global-coupled and untestable in Node, per tests/memory.test.js's own
// documented convention).
// Run with: node --test tests/cpi001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const DateUtils = require('../js/core/dateUtils.js');
const TurnUnderstandingInterpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const ExplicitPreferenceStatementInterpreter = require('../js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js');
const SafetyContextInterpreter = require('../js/coachDecisionSystem/safetyContextInterpreter.js');
const ReadinessStateInterpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

const TODAY_DATE_KEY = DateUtils.getTodayKey();

function configureFixture() {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'cpi-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => []
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY,
    getWeekday: () => new Date().getDay()
  });
}

function stubTurnUnderstanding(resultByTurnId) {
  TurnUnderstandingInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => Object.assign({
        id: id,
        affirmativeRequestPresent: false, domain: null, topic: null,
        currentStateStatementPresent: false, currentStateStatementText: null,
        negativeControlPresent: false, desireOnlyPresent: false
      }, resultByTurnId[id] || {}));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
}

// Stubs ExplicitPreferenceStatementInterpreter to classify the submitted turn per a fixed result.
function stubPreferenceInterpreter(resultByTurnId) {
  ExplicitPreferenceStatementInterpreter.configure({
    callClaude: async (body) => {
      const idMatch = body.messages[0].content.match(/<turn id="([^"]+)"/);
      const id = idMatch[1];
      const r = resultByTurnId[id] || { eligible: false, ineligibleReason: 'NO_EXPLICIT_PREFERENCE' };
      return { content: [{ text: JSON.stringify({ results: [Object.assign({ id, preferenceClass: null, polarity: null, target: null, ineligibleReason: null }, r)] }) }] };
    }
  });
}

// Stubs the real SafetyContextInterpreter (USC-001) to report NO restriction for whatever id is
// submitted — the independent veto's own "clear" path, exercised via the REAL classifyWithStatus().
function stubSafetyNoRestriction() {
  SafetyContextInterpreter.configure({
    callClaude: async (body) => {
      const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
    }
  });
}

function stubSafetyRestrictionFound(restrictedActivityText) {
  SafetyContextInterpreter.configure({
    callClaude: async (body) => {
      const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: restrictedActivityText, statedDurationText: null }] }) }] };
    }
  });
}

function stubReadinessStateInterpreterClassifiesAll() {
  ReadinessStateInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return { content: [{ text: JSON.stringify({ results: ids.map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) }) }] };
    }
  });
}

function stubTrainingReadinessActionProposed() {
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED',
          action: 'שקול/י אימון קליל וקצר יותר היום.',
          actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'בקשה ישירה של המשתמש.',
          evidenceBasis: 'בקשה ישירה של המשתמש.',
          expectedValue: 'התאמת העצימות.',
          uncertainty: 'נמוכה.'
        })
      }]
    })
  });
}

function stubExpressionRendererEchoes() {
  ExpressionRenderer.configure({ generateFn: async () => 'תגובת מאמן לדוגמה (stub, לא מודל אמיתי).' });
}

function makeTurn(turnId, text, overrides) {
  return Object.assign({ turnId: turnId, text: text, submittedAt: Date.now(), sessionGeneration: 1 }, overrides || {});
}

test.afterEach(() => {
  TurnUnderstandingInterpreter.configure({ callClaude: null });
  ExplicitPreferenceStatementInterpreter.configure({ callClaude: null });
  SafetyContextInterpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined });
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  ExpressionRenderer.configure({ generateFn: null });
});

// ══════════════════════════════════════════════════════════════════
// Ordinary case: "אני לא אוהב לרוץ" — no request, no primary content this cycle.
// ══════════════════════════════════════════════════════════════════
test('CPI-DOGFOOD-1. Pass 1 authorizes and DEFERS Expression dispatch; Unified Finalization then produces the standalone ACKNOWLEDGED_PREFERENCE, DISPATCHED, via the real chain', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-cpi-1': {} }); // affirmativeRequestPresent defaults to false — never a request
  stubPreferenceInterpreter({ 't-cpi-1': { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ' } });
  stubSafetyNoRestriction();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-cpi-1', 'אני לא אוהב לרוץ');
  const pass1 = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.status, 'SUCCESS');
  assert.equal(pass1.output.preferenceIntakeAuthorization.authorized, true);
  assert.equal(pass1.output.preferenceIntakeAuthorization.reason, 'OK');
  assert.deepEqual(pass1.output.preferenceIntakeAuthorization.candidateRecord, { preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', sourceTurnId: 't-cpi-1' });
  // §14 step 5 — no Expression call happened in Pass 1 at all; the primary decision (SILENCE, no
  // request) is fully formed but deliberately unrendered.
  assert.equal(pass1.output.terminalDecision.kind, 'SILENCE');
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  // Simulates app.js's own persistence boundary having just confirmed a successful Typed Memory
  // write, then dispatching Unified Finalization through the SAME governed engine entry point.
  const confirmedRecord = Object.assign({}, pass1.output.preferenceIntakeAuthorization.candidateRecord, { wasReactivatedFromRejected: false });
  const finalization = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-1-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedRecord: confirmedRecord },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  assert.equal(finalization.output.terminalDecision.kind, 'ACKNOWLEDGED_PREFERENCE');
  assert.deepEqual(finalization.output.terminalDecision.preferenceAcknowledgment, { preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', wasReactivatedFromRejected: false });
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
  assert.ok(finalization.output.expression.deliveryIntent);
  assert.equal(finalization.output.expression.deliveryIntent.semanticSignal.kind, 'ACKNOWLEDGED_PREFERENCE');
});

// ══════════════════════════════════════════════════════════════════
// Same-turn collision: a real direct request AND an authorized preference, same turn.
// ══════════════════════════════════════════════════════════════════
test('CPI-COLLISION-1. Pass 1 defers Expression for a real primary decision too; Unified Finalization attaches secondaryAcknowledgment, producing ONE merged, DISPATCHED response', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-cpi-collision-1': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }
  });
  stubPreferenceInterpreter({ 't-cpi-collision-1': { eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'EVENING' } });
  stubSafetyNoRestriction();
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-cpi-collision-1', 'אני מעדיף להתאמן בערב, כדאי לי להתאמן היום?');
  const pass1 = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-collision-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.status, 'SUCCESS');
  assert.equal(pass1.output.preferenceIntakeAuthorization.authorized, true);
  // A real primary decision was formed (not SILENCE) — Safety/professional content always primary.
  assert.notEqual(pass1.output.terminalDecision.kind, 'SILENCE');
  assert.notEqual(pass1.output.terminalDecision.kind, 'ACKNOWLEDGED_PREFERENCE');
  const primaryKindBeforeMerge = pass1.output.terminalDecision.kind;
  const primaryProvenance = pass1.output.terminalDecision.candidateProvenance;
  // No rendering happened yet — deferred, exactly like the ordinary case.
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  const confirmedRecord = Object.assign({}, pass1.output.preferenceIntakeAuthorization.candidateRecord, { wasReactivatedFromRejected: false });
  const finalization = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-collision-1-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedRecord: confirmedRecord },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  // The primary content's own kind/candidateProvenance/decisionPassTrace are preserved untouched —
  // never overridden or replaced by the merge.
  assert.equal(finalization.output.terminalDecision.kind, primaryKindBeforeMerge);
  assert.deepEqual(finalization.output.terminalDecision.candidateProvenance, primaryProvenance);
  // The acknowledgment is additively attached, never a second TerminalDecision.
  assert.deepEqual(finalization.output.terminalDecision.secondaryAcknowledgment, { preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'EVENING', wasReactivatedFromRejected: false });
  // Exactly ONE Delivery Intent, DISPATCHED — never two responses.
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
  assert.ok(finalization.output.expression.deliveryIntent);
});

// ══════════════════════════════════════════════════════════════════
// Consent absent — existing, unmodified, immediate CCC-001-equivalent lifecycle (Product Decision C).
// ══════════════════════════════════════════════════════════════════
test('CPI-CONSENT-1. memoryConsent.granted !== true — Pass 1 authorization fails closed (CONSENT_ABSENT), and Expression dispatch remains IMMEDIATE (unchanged pre-CPI-001 behavior)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: false } }),
    getCurrentUser: () => ({ uid: 'cpi-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => []
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY,
    getWeekday: () => new Date().getDay()
  });
  stubTurnUnderstanding({ 't-cpi-consent-1': {} });
  stubPreferenceInterpreter({ 't-cpi-consent-1': { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ' } });
  stubSafetyNoRestriction();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-cpi-consent-1', 'אני לא אוהב לרוץ');
  const result = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-consent-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.preferenceIntakeAuthorization.authorized, false);
  assert.equal(result.output.preferenceIntakeAuthorization.reason, 'CONSENT_ABSENT');
  // Unaffected: Expression already dispatched immediately in Pass 1 (real NO_DELIVERY_INTENT, not
  // the DEFERRED sentinel) — byte-identical to pre-CPI-001 bare-statement behavior.
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});

// ══════════════════════════════════════════════════════════════════
// Safety veto — independent of the preference interpreter's own (here, correct) judgment.
// ══════════════════════════════════════════════════════════════════
test('CPI-SAFETY-1. an independent Safety restriction on the current turn vetoes authorization (SAFETY_VETO), regardless of the preference interpreter — immediate dispatch, unaffected', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-cpi-safety-1': {} });
  stubPreferenceInterpreter({ 't-cpi-safety-1': { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ' } });
  stubSafetyRestrictionFound('לרוץ');
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-cpi-safety-1', 'הרופא אמר לי לא לרוץ');
  const result = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-safety-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.preferenceIntakeAuthorization.authorized, false);
  assert.equal(result.output.preferenceIntakeAuthorization.reason, 'SAFETY_VETO');
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});

// ══════════════════════════════════════════════════════════════════
// Not eligible at all (interpreter itself) — the gate is never even invoked (§10's own contract).
// ══════════════════════════════════════════════════════════════════
test('CPI-INELIGIBLE-1. an unconfigured preference interpreter (fails closed to eligible:false) never reaches the gate; authorized:false, reason:NOT_ELIGIBLE', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-cpi-ineligible-1': {} });
  // ExplicitPreferenceStatementInterpreter deliberately left unconfigured (afterEach default).
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-cpi-ineligible-1', 'בדרך כלל אני מתאמן שלוש פעמים בשבוע');
  const result = await Orchestrator.run({
    userId: 'cpi-user', sessionGeneration: 1, runId: 'cpi-ineligible-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.preferenceIntakeAuthorization.authorized, false);
  assert.equal(result.output.preferenceIntakeAuthorization.reason, 'NOT_ELIGIBLE');
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});
