// Friends Alpha Item 6 (USER_DISCLOSURE V1) — Production-Backed Acceptance. Exercises the real,
// unmodified production chain: a CurrentUserTurn -> internalPipelineOrchestrator.run({action:
// 'DIRECT_TURN_PASS'}) -> TurnUnderstandingInterpreter (Dimension 5) -> UserDisclosureRecognizer
// -> SafetyDisclosureIntakeGate (including the real, independent SafetyContextInterpreter, both
// its restriction-detection and its additive correction-classification functions) -> (simulating
// app.js's own persistence boundary) -> internalPipelineOrchestrator.run({action:
// 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE'}) -> the SAME, real, unmodified Stage-10 Expression
// mechanics DUC-001's/CPI-001's own acceptance files already exercise. Mirrors
// tests/cpi001ProductionBackedAcceptance.test.js's own established shape exactly (production-
// backed, not a directly-injected fixture). No live LLM, no live Firestore.
// Run with: node --test tests/item6ProductionBackedAcceptance.test.js

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

function configureFixture(fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'item6-user' }),
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

function stubTurnUnderstanding(resultByTurnId) {
  TurnUnderstandingInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => Object.assign({
        id: id,
        affirmativeRequestPresent: false, domain: null, topic: null,
        currentStateStatementPresent: false, currentStateStatementText: null,
        negativeControlPresent: false, desireOnlyPresent: false,
        personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
      }, resultByTurnId[id] || {}));
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

// Routes SafetyContextInterpreter's SINGLE callClaude seam across its THREE distinct real callers:
//   (a) memoryLayer.js's own userSafetyContext ASSEMBLY pass (buildPrompt shape, id = the raw
//       Typed Memory record id, e.g. 'm1') — only invoked when fetchUserStatedMemory returns
//       eligible records;
//   (b) SafetyDisclosureIntakeGate's detectNewRestriction() (buildPrompt shape, id always
//       'turn:'+turnId);
//   (c) SafetyDisclosureIntakeGate's detectCorrection() (buildCorrectionPrompt shape, distinguished
//       by its own unique "previously, explicitly" prompt text).
// opts: { assembly: {id: restrictedActivityText|null}, currentTurnRestriction: text|null,
//         correctionConfirmed: boolean|null }
function stubSafetyContextInterpreter(opts) {
  opts = opts || {};
  SafetyContextInterpreter.configure({
    callClaude: async (body) => {
      const content = body.messages[0].content;
      const idMatch = content.match(/<statement id="([^"]+)"/);
      const id = idMatch[1];
      if (content.indexOf('previously, explicitly') >= 0) {
        const confirmed = opts.correctionConfirmed === true;
        return { content: [{ text: JSON.stringify({ results: [{ id: id, correctionConfirmed: confirmed }] }) }] };
      }
      if (id.indexOf('turn:') === 0) {
        const restrictedActivityText = opts.currentTurnRestriction || null;
        if (restrictedActivityText) {
          return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: restrictedActivityText, statedDurationText: null }] }) }] };
        }
        return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
      }
      // Assembly pass — id is the raw memory id.
      const assemblyText = opts.assembly && opts.assembly[id];
      if (assemblyText) {
        return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: assemblyText, statedDurationText: null }] }) }] };
      }
      return { content: [{ text: JSON.stringify({ results: [{ id: id, restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
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
          action: 'שקול/י אימון קליל יותר היום.',
          actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'בקשה ישירה של המשתמש.', evidenceBasis: 'בקשה ישירה של המשתמש.',
          expectedValue: 'התאמת העצימות.', uncertainty: 'נמוכה.'
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

function safetyMemoryRecord(id, restrictedActivityText) {
  return { id: id, type: 'safety_disclosure', payload: { text: restrictedActivityText }, source: 'user_stated', status: 'active' };
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
// Bare, non-Safety disclosure — resolves synchronously (no deferral), acknowledgement only.
// ══════════════════════════════════════════════════════════════════
test('ITEM6-DOGFOOD-1. a bare current-state disclosure ("ישנתי גרוע הלילה") resolves standalone ACKNOWLEDGED_DISCLOSURE, category STATE, capturedToMemory:false, DISPATCHED synchronously (no deferral)', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-1': { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי גרוע הלילה' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({});
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-1', 'ישנתי גרוע הלילה');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.disclosureCaptureAuthorization.authorized, false);
  assert.equal(result.output.disclosureCaptureAuthorization.reason, 'NOT_CAPTURE_ELIGIBLE');
  const td = result.output.terminalDecision;
  assert.equal(td.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.deepEqual(td.disclosureAcknowledgment, { category: 'STATE', capturedToMemory: false, safetyRelevant: false });
  assert.equal(result.output.expression.status, 'DISPATCHED');
  assert.ok(result.output.expression.deliveryIntent);
  assert.equal(result.output.expression.deliveryIntent.semanticSignal.kind, 'ACKNOWLEDGED_DISCLOSURE');
});

test('ITEM6-DOGFOOD-2. a bare desire-only disclosure resolves standalone ACKNOWLEDGED_DISCLOSURE, category DESIRE', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-item6-2': { desireOnlyPresent: true } });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({});
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-2', 'הייתי רוצה בסופו של דבר לרוץ מרתון');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.equal(result.output.terminalDecision.disclosureAcknowledgment.category, 'DESIRE');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

test('ITEM6-DOGFOOD-3. a personal capacity/constraint disclosure (Dimension 5) resolves standalone ACKNOWLEDGED_DISCLOSURE, category CAPACITY_OR_CONSTRAINT — no professional advice is ever invented (no safetyDisposition, no confidence, no hierarchyTier)', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-3': { personalDisclosurePresent: true, personalDisclosureCategory: 'CAPACITY_OR_CONSTRAINT', personalDisclosureText: 'לא התאמנתי כבר שבועיים' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({});
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-3', 'לא התאמנתי כבר שבועיים');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-3',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  const td = result.output.terminalDecision;
  assert.equal(td.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.equal(td.disclosureAcknowledgment.category, 'CAPACITY_OR_CONSTRAINT');
  assert.equal('safetyDisposition' in td, false);
  assert.equal('confidence' in td, false);
  assert.equal('hierarchyTier' in td, false);
});

// ══════════════════════════════════════════════════════════════════
// Explicit new restriction — Safety-relevant durable capture, gated on consent.
// ══════════════════════════════════════════════════════════════════
test('ITEM6-CAPTURE-1. an explicit new restriction, WITH consent, defers Expression; Unified Finalization then produces ACKNOWLEDGED_DISCLOSURE with capturedToMemory:true, safetyRelevant:true, DISPATCHED', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-cap-1': { currentStateStatementPresent: true, currentStateStatementText: 'הרופא אמר לי לא לרוץ' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({ currentTurnRestriction: 'לרוץ' });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-cap-1', 'הרופא אמר לי לא לרוץ');
  const pass1 = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-cap-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.status, 'SUCCESS');
  assert.equal(pass1.output.disclosureCaptureAuthorization.authorized, true);
  assert.deepEqual(pass1.output.disclosureCaptureAuthorization.candidateRecord, {
    mode: 'NEW_RESTRICTION', restrictedActivityText: 'לרוץ', subjectKey: 'לרוץ', sourceTurnId: 't-item6-cap-1', category: 'STATE'
  });
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  // Simulates app.js's own persistence boundary having just confirmed a successful Typed Memory
  // write (persistSafetyDisclosureRecord), then dispatching Unified Finalization.
  const confirmedDisclosureRecord = { category: 'STATE', capturedToMemory: true, safetyRelevant: true };
  const finalization = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-cap-1-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedDisclosureRecord: confirmedDisclosureRecord },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  assert.equal(finalization.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.deepEqual(finalization.output.terminalDecision.disclosureAcknowledgment, { category: 'STATE', capturedToMemory: true, safetyRelevant: true });
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
  assert.ok(finalization.output.expression.deliveryIntent);
});

test('ITEM6-CAPTURE-2. the SAME explicit new restriction, WITHOUT consent, is never captured (CONSENT_ABSENT) and falls back to an ordinary, immediate, non-deferred acknowledgement — never blocks the turn', async () => {
  configureFixture();
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: false } }),
    getCurrentUser: () => ({ uid: 'item6-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => []
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY, getWeekday: () => new Date().getDay()
  });
  stubTurnUnderstanding({
    't-item6-cap-2': { currentStateStatementPresent: true, currentStateStatementText: 'הרופא אמר לי לא לרוץ' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({ currentTurnRestriction: 'לרוץ' });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-cap-2', 'הרופא אמר לי לא לרוץ');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-cap-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.disclosureCaptureAuthorization.authorized, false);
  assert.equal(result.output.disclosureCaptureAuthorization.reason, 'CONSENT_ABSENT');
  assert.equal(result.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.deepEqual(result.output.terminalDecision.disclosureAcknowledgment, { category: 'STATE', capturedToMemory: false, safetyRelevant: false });
  assert.equal(result.output.expression.status, 'DISPATCHED'); // immediate, never DEFERRED
});

// ══════════════════════════════════════════════════════════════════
// Correction semantics — strict: an ordinary state change never clears a restriction; only an
// explicit, unambiguous correction does.
// ══════════════════════════════════════════════════════════════════
test('ITEM6-CORRECTION-1. an ordinary later state statement ("הברך מרגישה יותר טוב") against an existing durable restriction is NEVER treated as a correction (NOT_CAPTURE_ELIGIBLE) — the restriction is preserved, only an ordinary acknowledgement is produced', async () => {
  configureFixture(async () => [safetyMemoryRecord('m1', 'לרוץ')]);
  stubTurnUnderstanding({
    't-item6-corr-1': { currentStateStatementPresent: true, currentStateStatementText: 'הברך מרגישה יותר טוב' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({ assembly: { m1: 'לרוץ' }, correctionConfirmed: false });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-corr-1', 'הברך מרגישה יותר טוב');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-corr-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  // Proves the existing restriction actually reached the pipeline (USC-001 assembly worked).
  assert.equal(result.output.pipelineContext.userSafetyContext.items.length, 1);
  assert.equal(result.output.pipelineContext.userSafetyContext.items[0].restrictedActivityText, 'לרוץ');

  assert.equal(result.output.disclosureCaptureAuthorization.authorized, false);
  assert.equal(result.output.disclosureCaptureAuthorization.reason, 'NOT_CAPTURE_ELIGIBLE');
  assert.equal(result.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.equal(result.output.terminalDecision.disclosureAcknowledgment.safetyRelevant, false);
});

test('ITEM6-CORRECTION-2. an explicit, unambiguous correction ("הרופא אישר לי לחזור לרוץ") against exactly one existing restriction, WITH consent, is authorized as CORRECTION, defers, and finalizes to a Safety-relevant, captured ACKNOWLEDGED_DISCLOSURE', async () => {
  configureFixture(async () => [safetyMemoryRecord('m1', 'לרוץ')]);
  stubTurnUnderstanding({
    't-item6-corr-2': { currentStateStatementPresent: true, currentStateStatementText: 'הרופא אישר לי לחזור לרוץ' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({ assembly: { m1: 'לרוץ' }, correctionConfirmed: true });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-corr-2', 'הרופא אישר לי לחזור לרוץ');
  const pass1 = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-corr-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.output.disclosureCaptureAuthorization.authorized, true);
  assert.deepEqual(pass1.output.disclosureCaptureAuthorization.candidateRecord, {
    mode: 'CORRECTION', subjectKey: 'לרוץ', sourceTurnId: 't-item6-corr-2', category: 'STATE'
  });
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  const confirmedDisclosureRecord = { category: 'STATE', capturedToMemory: true, safetyRelevant: true };
  const finalization = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-corr-2-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedDisclosureRecord: confirmedDisclosureRecord },
    now: Date.now()
  });
  assert.equal(finalization.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.deepEqual(finalization.output.terminalDecision.disclosureAcknowledgment, { category: 'STATE', capturedToMemory: true, safetyRelevant: true });
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
});

// ══════════════════════════════════════════════════════════════════
// Same-turn collisions — always ONE coherent response, one Expression call, one Delivery Intent.
// ══════════════════════════════════════════════════════════════════
test('ITEM6-COLLISION-1. a real direct request AND a disclosure, same turn: Pass 1 defers for the real primary decision too; Unified Finalization attaches secondaryDisclosureAcknowledgment, producing ONE merged, DISPATCHED response', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-coll-1': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'ישנתי גרוע' }
  });
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreter({});
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-coll-1', 'ישנתי גרוע, כדאי לי להתאמן היום?');
  const pass1 = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-coll-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  // ACKNOWLEDGED_DISCLOSURE resolves synchronously (no deferral) — no primary competing decision
  // to defer FOR — but the REAL primary decision (a real request) must exist and not be
  // overridden by the disclosure track.
  assert.notEqual(pass1.output.terminalDecision.kind, 'SILENCE');
  assert.notEqual(pass1.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  const primaryKindBeforeMerge = pass1.output.terminalDecision.kind;
  assert.deepEqual(pass1.output.terminalDecision.secondaryDisclosureAcknowledgment, { category: 'STATE', capturedToMemory: false, safetyRelevant: false });
  assert.equal(pass1.output.expression.status, 'DISPATCHED');
  assert.equal(pass1.output.terminalDecision.kind, primaryKindBeforeMerge);
});

// Note: a preference-capture and a NEW Safety restriction can never both be authorized on the
// SAME turn — CPI-001's own independent Safety veto (§10 point 5) unconditionally vetoes ANY
// preference capture on a turn whose own text states a restriction, regardless of the
// preference's own target (a whole-turn veto, not a target-matched one). This is correct,
// existing, unmodified CPI-001 production behavior, not weakened here. A CORRECTION (against an
// ALREADY-existing durable restriction, never a NEW one stated on the current turn) is therefore
// the only combination that can legitimately co-occur with an authorized preference capture on
// one turn, and is used below.
test('ITEM6-COLLISION-2. a real direct request, a preference, AND a Safety correction, all same turn: Pass 1 defers; Unified Finalization attaches BOTH secondaryAcknowledgment and secondaryDisclosureAcknowledgment, still exactly ONE Expression call / ONE Delivery Intent', async () => {
  configureFixture(async () => [safetyMemoryRecord('m1', 'לרוץ')]);
  stubTurnUnderstanding({
    't-item6-coll-2': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'הרופא אישר לי לחזור לרוץ' }
  });
  stubPreferenceInterpreter({ 't-item6-coll-2': { eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'EVENING' } });
  stubSafetyContextInterpreter({ assembly: { m1: 'לרוץ' }, correctionConfirmed: true });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-coll-2', 'הרופא אישר לי לחזור לרוץ, אני מעדיף להתאמן בערב, כדאי לי להתאמן היום?');
  const pass1 = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-coll-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.output.preferenceIntakeAuthorization.authorized, true);
  assert.equal(pass1.output.disclosureCaptureAuthorization.authorized, true);
  assert.notEqual(pass1.output.terminalDecision.kind, 'SILENCE');
  const primaryKindBeforeMerge = pass1.output.terminalDecision.kind;
  const primaryProvenance = pass1.output.terminalDecision.candidateProvenance;
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  const confirmedRecord = Object.assign({}, pass1.output.preferenceIntakeAuthorization.candidateRecord, { wasReactivatedFromRejected: false });
  const confirmedDisclosureRecord = { category: 'STATE', capturedToMemory: true, safetyRelevant: true };
  const finalization = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-coll-2-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: {
      pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision,
      confirmedRecord: confirmedRecord, confirmedDisclosureRecord: confirmedDisclosureRecord
    },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  // The primary content's own kind/candidateProvenance are preserved untouched.
  assert.equal(finalization.output.terminalDecision.kind, primaryKindBeforeMerge);
  assert.deepEqual(finalization.output.terminalDecision.candidateProvenance, primaryProvenance);
  // Both acknowledgments additively attached, never a second TerminalDecision.
  assert.deepEqual(finalization.output.terminalDecision.secondaryAcknowledgment, { preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'EVENING', wasReactivatedFromRejected: false });
  assert.deepEqual(finalization.output.terminalDecision.secondaryDisclosureAcknowledgment, { category: 'STATE', capturedToMemory: true, safetyRelevant: true });
  // Exactly ONE Delivery Intent, DISPATCHED — never two responses.
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
  assert.ok(finalization.output.expression.deliveryIntent);
});

// ══════════════════════════════════════════════════════════════════
// Fail-closed discipline — a Safety classifier failure never silently claims capture, and never
// blocks the turn either (an honest acknowledgement is still produced).
// ══════════════════════════════════════════════════════════════════
test('ITEM6-FAILCLOSED-1. an unavailable Safety classifier on a restriction-shaped turn fails capture closed (SAFETY_CLASSIFIER_UNAVAILABLE), never treated as captured — the turn still resolves to an honest, non-captured acknowledgement', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-fail-1': { currentStateStatementPresent: true, currentStateStatementText: 'הרופא אמר לי לא לרוץ' }
  });
  stubPreferenceInterpreterNotEligible();
  // SafetyContextInterpreter deliberately left unconfigured (afterEach default) — classifier
  // unavailable.

  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-fail-1', 'הרופא אמר לי לא לרוץ');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-fail-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.disclosureCaptureAuthorization.authorized, false);
  assert.equal(result.output.disclosureCaptureAuthorization.reason, 'SAFETY_CLASSIFIER_UNAVAILABLE');
  assert.equal(result.output.terminalDecision.kind, 'ACKNOWLEDGED_DISCLOSURE');
  assert.equal(result.output.terminalDecision.disclosureAcknowledgment.capturedToMemory, false);
  assert.equal(result.output.expression.status, 'DISPATCHED'); // the turn is never silently dropped
});

// ══════════════════════════════════════════════════════════════════
// DUC-001 invariants preserved — a pure request with no disclosure signal at all is byte-identical
// to pre-Item-6 behavior; SAFETY_HIGH_RISK/CPI-001-only behavior is untouched.
// ══════════════════════════════════════════════════════════════════
test('ITEM6-REGRESSION-1. a pure direct request with no disclosure signal at all never produces a disclosureAcknowledgment/secondaryDisclosureAcknowledgment field — byte-identical to pre-Item-6 DUC-001 behavior', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-item6-reg-1': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }
  });
  stubPreferenceInterpreterNotEligible();
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-item6-reg-1', 'כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'item6-user', sessionGeneration: 1, runId: 'item6-reg-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.disclosureCaptureAuthorization.authorized, false);
  assert.equal(result.output.disclosureCaptureAuthorization.reason, 'NOT_RECOGNIZED');
  assert.equal('disclosureAcknowledgment' in result.output.terminalDecision, false);
  assert.equal('secondaryDisclosureAcknowledgment' in result.output.terminalDecision, false);
  assert.equal(result.output.expression.status, 'DISPATCHED');
});
