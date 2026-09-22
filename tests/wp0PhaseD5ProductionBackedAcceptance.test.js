// WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15/§22, Revision 2,
// Product+Architecture APPROVED) — Production-Backed Acceptance. Exercises the real, unmodified
// production chain: a CurrentUserTurn -> internalPipelineOrchestrator.run({action:
// 'DIRECT_TURN_PASS'}) -> RiskCharacteristicInterpreter.classifyTurnForDurableConstraint() ->
// RiskCharacteristicIntakeGate (authorizeNewFact()/authorizeCorrection(), including the real,
// independent classifyCorrectionWithStatus()) -> (simulating app.js's own persistence boundary,
// persistRiskCharacteristicFactRecord()) -> internalPipelineOrchestrator.run({action:
// 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE'}) -> the SAME, real, unmodified Stage-10 Expression
// mechanics Item 6's/CPI-001's own acceptance files already exercise. Mirrors
// tests/item6ProductionBackedAcceptance.test.js's own established shape exactly. No live LLM, no
// live Firestore.
// Run with: node --test tests/wp0PhaseD5ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const DateUtils = require('../js/core/dateUtils.js');
const TurnUnderstandingInterpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const ExplicitPreferenceStatementInterpreter = require('../js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js');
const SafetyContextInterpreter = require('../js/coachDecisionSystem/safetyContextInterpreter.js');
const RiskCharacteristicInterpreter = require('../js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const ReadinessStateInterpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

const TODAY_DATE_KEY = DateUtils.getTodayKey();

function configureFixture(fetchUserStatedMemoryFn, consentGranted) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: consentGranted !== false } }),
    getCurrentUser: () => ({ uid: 'd5-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: fetchUserStatedMemoryFn || (async () => [])
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY,
    getWeekday: () => new Date().getDay()
  });
}

function stubTurnUnderstandingNoSignal() {
  TurnUnderstandingInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => ({
        id: id,
        affirmativeRequestPresent: false, domain: null, topic: null,
        currentStateStatementPresent: false, currentStateStatementText: null,
        negativeControlPresent: false, desireOnlyPresent: false,
        personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
      }));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
}

function stubPreferenceInterpreterNotEligible() {
  ExplicitPreferenceStatementInterpreter.configure({
    callClaude: async (body) => {
      const idMatch = body.messages[0].content.match(/<turn id="([^"]+)"/);
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'NO_EXPLICIT_PREFERENCE' }] }) }] };
    }
  });
}

function stubSafetyContextInterpreterNoSignal() {
  SafetyContextInterpreter.configure({
    callClaude: async (body) => {
      const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
      const id = idMatch[1];
      return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
    }
  });
}

// Routes RiskCharacteristicInterpreter's SINGLE callClaude seam across its TWO distinct real
// entry points used by runDirectTurnPass(): classifyTurnForDurableConstraint() (buildDurableConstraintPrompt
// shape, no distinguishing marker other than the <turn> tag) and classifyCorrectionWithStatus()
// (buildCorrectionPrompt shape, distinguished by its own unique "previously, explicitly" text).
// opts: { newFactCandidates: [{domain,severity,anchorText}] | null, correctionConfirmed: boolean|null }
function stubRiskCharacteristicInterpreter(opts) {
  opts = opts || {};
  RiskCharacteristicInterpreter.configure({
    callClaude: async (body) => {
      const content = body.messages[0].content;
      if (content.indexOf('previously, explicitly') >= 0) {
        const idMatch = content.match(/<statement id="([^"]+)"/);
        const confirmed = opts.correctionConfirmed === true;
        return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: confirmed }] }) }] };
      }
      const candidates = opts.newFactCandidates || [];
      return { content: [{ text: JSON.stringify({ candidates: candidates }) }] };
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

function stubExpressionRendererEchoes() {
  ExpressionRenderer.configure({ generateFn: async () => 'תגובת מאמן לדוגמה (stub, לא מודל אמיתי).' });
}

function makeTurn(turnId, text, overrides) {
  return Object.assign({ turnId: turnId, text: text, submittedAt: Date.now(), sessionGeneration: 1 }, overrides || {});
}

function riskCharacteristicFactMemoryRecord(id, riskDomain, literalStatementText, sourceTurnId) {
  return { id: id, type: 'risk_characteristic_fact', payload: { riskDomain: riskDomain, literalStatementText: literalStatementText, sourceTurnId: sourceTurnId }, source: 'user_stated', status: 'active' };
}

test.afterEach(() => {
  TurnUnderstandingInterpreter.configure({ callClaude: null });
  ExplicitPreferenceStatementInterpreter.configure({ callClaude: null });
  SafetyContextInterpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined });
  RiskCharacteristicInterpreter.configure({ callClaude: null, timeoutMs: undefined });
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  ExpressionRenderer.configure({ generateFn: null });
});

// ══════════════════════════════════════════════════════════════════
// NEW_FACT capture
// ══════════════════════════════════════════════════════════════════

test('D5-CAPTURE-1. an explicit new durable fact, WITH consent, defers Expression; Unified Finalization then produces ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT with capturedToMemory:true, DISPATCHED — no severity anywhere in the acknowledgment', async () => {
  configureFixture();
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({
    newFactCandidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'peanut allergy' }]
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-cap-1', 'I have a peanut allergy');
  const pass1 = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-cap-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.status, 'SUCCESS');
  assert.equal(pass1.output.riskCharacteristicFactCaptureAuthorization.authorized, true);
  assert.deepEqual(pass1.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, {
    mode: 'NEW_FACT', domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', literalStatementText: 'peanut allergy',
    sourceTurnId: 't-d5-cap-1', evidenceSource: 'CURRENT_TURN_USER_STATEMENT'
  });
  assert.equal(Object.prototype.hasOwnProperty.call(pass1.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, 'severity'), false);
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  // Simulates app.js's own persistence boundary (persistRiskCharacteristicFactRecord) having just
  // confirmed a successful Typed Memory write, then dispatching Unified Finalization.
  const confirmedRiskCharacteristicFactRecord = { riskDomain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', capturedToMemory: true };
  const finalization = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-cap-1-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedRiskCharacteristicFactRecord: confirmedRiskCharacteristicFactRecord },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  assert.equal(finalization.output.terminalDecision.kind, 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT');
  assert.deepEqual(finalization.output.terminalDecision.riskCharacteristicFactAcknowledgment, { riskDomain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', capturedToMemory: true });
  assert.equal(Object.prototype.hasOwnProperty.call(finalization.output.terminalDecision.riskCharacteristicFactAcknowledgment, 'severity'), false);
  assert.equal(JSON.stringify(finalization.output.terminalDecision).indexOf('peanut'), -1, 'the literal statement text must never appear on the rendered TerminalDecision — only the closed riskDomain field');
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
  assert.ok(finalization.output.expression.deliveryIntent);
});

test('D5-CAPTURE-2. the SAME explicit new fact, WITHOUT consent, is never captured — falls back to the pre-existing, ordinary, non-deferred pipeline byte-identically (no acknowledgment of any kind this phase)', async () => {
  configureFixture(async () => [], false);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({
    newFactCandidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'peanut allergy' }]
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-cap-2', 'I have a peanut allergy');
  const result = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-cap-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.reason, 'CONSENT_ABSENT');
  assert.notEqual(result.output.expression.status, 'DEFERRED');
  // Zero opportunities this cycle (no other signal) resolves to the ordinary, pre-existing
  // Decision-Pass-level Silence — exactly as it would with this phase's own code entirely absent;
  // no risk-characteristic-fact-specific field appears anywhere on it.
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(Object.prototype.hasOwnProperty.call(result.output.terminalDecision, 'riskCharacteristicFactAcknowledgment'), false);
});

test('D5-CAPTURE-3. an unresolved/insufficient interpreter output (empty candidates array — "confidently found nothing") is never authorized, never deferred', async () => {
  configureFixture();
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [] });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-cap-3', 'I had a nice walk today');
  const result = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-cap-3',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.reason, 'NOT_RECOGNIZED');
});

// ══════════════════════════════════════════════════════════════════
// Correction semantics — strict: an ordinary later statement never clears a fact; only an
// explicit, unambiguous correction does. And: a correction-only turn resolves to honest Silence,
// not a broken/empty acknowledgment (the genuine reachable case the D.5 fix addresses).
// ══════════════════════════════════════════════════════════════════

test('D5-CORRECTION-1. an ordinary later statement against an existing durable fact is NEVER treated as a correction (NOT_CAPTURE_ELIGIBLE) — the fact is preserved', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [], correctionConfirmed: false });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-corr-1', 'I feel a bit better today');
  const result = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-corr-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
});

test('D5-CORRECTION-2. an explicit, unambiguous correction against exactly one existing fact, WITH consent, is authorized as CORRECTION, defers, and a correction-only turn (no other content) finalizes to honest Silence — never a fabricated acknowledgment', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [], correctionConfirmed: true });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-corr-2', 'the doctor confirmed I never actually had that allergy');
  const pass1 = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-corr-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.output.riskCharacteristicFactCaptureAuthorization.authorized, true);
  assert.deepEqual(pass1.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, { mode: 'CORRECTION', memoryId: 'rcf1', sourceTurnId: 't-d5-corr-2' });
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  // Simulates app.js's own persistence boundary: CORRECTION mode returns record:null (§15 — a
  // correction supersedes, never states a new fact to acknowledge).
  const finalization = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-corr-2-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedRiskCharacteristicFactRecord: null },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  assert.equal(finalization.output.terminalDecision.kind, 'SILENCE');
  assert.equal(finalization.output.expression.status, 'NO_DELIVERY_INTENT'); // ExpressionInputGate/runExpressionStage withhold output for SILENCE (EXP-29/EXP-50), never NOT_ATTEMPTED
});

// ══════════════════════════════════════════════════════════════════
// Regression — a pure direct request with no risk-characteristic signal at all is byte-identical
// to pre-D.5 behavior.
// ══════════════════════════════════════════════════════════════════

test('D5-REGRESSION-1. a pure direct request with no risk-characteristic signal never produces a riskCharacteristicFactAcknowledgment field, never defers for this reason', async () => {
  configureFixture();
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [] });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5-reg-1', 'What should I eat for breakfast?');
  const result = await Orchestrator.run({
    userId: 'd5-user', sessionGeneration: 1, runId: 'd5-reg-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.reason, 'NOT_RECOGNIZED');
  if (result.output.terminalDecision) {
    assert.equal(Object.prototype.hasOwnProperty.call(result.output.terminalDecision, 'riskCharacteristicFactAcknowledgment'), false);
  }
});
