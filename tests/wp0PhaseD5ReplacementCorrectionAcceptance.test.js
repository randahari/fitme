// WP0 Phase D.5 — REPLACEMENT correction acceptance (Product/Architecture review correction,
// post-D.5-approval round). Original D.5 evidence treated "a NEW fact was authorized" and "a
// CORRECTION was confirmed" as mutually exclusive per turn — review found this could silently
// lose Safety knowledge on a genuine replacement statement ("the restriction is actually X, not
// Y"): either the stale fact Y was left active forever (never even checked once a new-fact
// candidate for X was authorized), or Y was superseded with X never captured (if X's own
// candidate wasn't surfaced/grounded that cycle). This file exercises the fix: NEW_FACT and
// CORRECTION are now evaluated independently every turn and combined into a single
// mode:'REPLACEMENT' authorization only when BOTH have independently, genuinely passed their own
// unmodified gates — the replacement fact is never inferred FROM the correction.
//
// Mirrors tests/wp0PhaseD5ProductionBackedAcceptance.test.js's own established harness exactly:
// real internalPipelineOrchestrator.js, mocked RiskCharacteristicInterpreter.callClaude, mocked
// StateAccess/Consumer. app.js's own persistRiskCharacteristicFactRecord() (the REPLACEMENT
// write-order fix) is not require()-able under node --test (browser-only globals — a pre-existing,
// repo-wide constraint, not introduced by this file) and is instead covered by structural/textual
// assertions against its exact source, the same convention tests/wp0PhaseD5DurableMemoryWiring.
// test.js already established for every other app.js concern in this phase.
// Run with: node --test tests/wp0PhaseD5ReplacementCorrectionAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

function configureFixture(fetchUserStatedMemoryFn, consentGranted) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: consentGranted !== false } }),
    getCurrentUser: () => ({ uid: 'd5r-user' }),
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
// Required test 1 — pure explicit retraction: old fact superseded, no new fact.
// ══════════════════════════════════════════════════════════════════

test('D5R-1. "I no longer have that restriction" — correction confirmed, no independently-grounded new fact this turn -> mode:CORRECTION only, old fact superseded, nothing new captured', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [], correctionConfirmed: true });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5r-1', 'I no longer have that peanut allergy — it fully resolved');
  const result = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, true);
  assert.deepEqual(result.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, { mode: 'CORRECTION', memoryId: 'rcf1', sourceTurnId: 't-d5r-1' });
});

// ══════════════════════════════════════════════════════════════════
// Required test 2 — explicit replacement: old fact superseded + new explicit fact persisted.
// ══════════════════════════════════════════════════════════════════

test('D5R-2. "The restriction is actually shellfish, not peanuts" — correction confirmed AND an independently-grounded new fact both authorized this turn -> mode:REPLACEMENT carrying both halves', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({
    newFactCandidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'shellfish allergy' }],
    correctionConfirmed: true
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5r-2', 'The restriction is actually a shellfish allergy, not peanuts — the peanut thing was a misdiagnosis');
  const pass1 = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(pass1.output.riskCharacteristicFactCaptureAuthorization.authorized, true);
  const record = pass1.output.riskCharacteristicFactCaptureAuthorization.candidateRecord;
  assert.equal(record.mode, 'REPLACEMENT');
  assert.deepEqual(record.newFact, {
    mode: 'NEW_FACT', domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', literalStatementText: 'shellfish allergy',
    sourceTurnId: 't-d5r-2', evidenceSource: 'CURRENT_TURN_USER_STATEMENT'
  });
  assert.deepEqual(record.correction, { mode: 'CORRECTION', memoryId: 'rcf1', sourceTurnId: 't-d5r-2' });
  assert.equal(Object.prototype.hasOwnProperty.call(record.newFact, 'severity'), false);
  assert.deepEqual(pass1.output.expression, { status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });

  // Simulates app.js's own persistRiskCharacteristicFactRecord() REPLACEMENT branch having
  // durably written BOTH halves and returned the new fact's own record shape (identical to a
  // pure NEW_FACT capture) — finalization must form the same ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT
  // outcome it would for a standalone new fact.
  const confirmedRiskCharacteristicFactRecord = { riskDomain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', capturedToMemory: true };
  const finalization = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-2-finalize',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE',
    payload: { pipelineContext: pass1.output.pipelineContext, terminalDecision: pass1.output.terminalDecision, confirmedRiskCharacteristicFactRecord: confirmedRiskCharacteristicFactRecord },
    now: Date.now()
  });

  assert.equal(finalization.status, 'SUCCESS');
  assert.equal(finalization.output.terminalDecision.kind, 'ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT');
  assert.deepEqual(finalization.output.terminalDecision.riskCharacteristicFactAcknowledgment, { riskDomain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', capturedToMemory: true });
  assert.equal(finalization.output.expression.status, 'DISPATCHED');
});

// ══════════════════════════════════════════════════════════════════
// Required test 3 — ambiguous correction: old fact remains active.
// ══════════════════════════════════════════════════════════════════

test('D5R-3. an ambiguous statement (correction not confirmed, no new fact recognized either) -> not authorized at all; the existing fact is left untouched', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({ newFactCandidates: [], correctionConfirmed: false });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5r-3', 'my eating has been going a bit better lately');
  const result = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-3',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, null);
});

// ══════════════════════════════════════════════════════════════════
// Required test 4 — AI-inferred replacement: old fact remains active; no new durable fact.
// ══════════════════════════════════════════════════════════════════

test('D5R-4. an AI-proposed "replacement" that is NOT genuinely grounded (new-fact anchorText hallucinated — not a literal substring of the turn; correction not confirmed either) -> neither half is authorized; old fact remains active, nothing new is captured', async () => {
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'peanut allergy', 't-old')]);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  // anchorText "shellfish allergy" is never actually literally present in the turn text below —
  // classifyTurnForDurableConstraint()'s own parser would itself drop a non-literal anchor in
  // production (parseDurableConstraintResponse()'s isLiteralSubstringOf() check), but this stub
  // bypasses that upstream filter deliberately, to prove riskCharacteristicIntakeGate.js's own
  // independent, second literal-anchor re-verification (Check 2 in authorizeNewFact()) is what
  // actually enforces this — never trusting the interpreter's own claim.
  stubRiskCharacteristicInterpreter({
    newFactCandidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'shellfish allergy' }],
    correctionConfirmed: false
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5r-4', 'I think something might be different about my restriction these days');
  const result = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-4',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, false);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.candidateRecord, null);
});

// ══════════════════════════════════════════════════════════════════
// Regression — pre-existing NEW_FACT-only and CORRECTION-only single-track behavior (no existing
// facts / no correction signal) remain byte-identical to the original D.5 evidence.
// ══════════════════════════════════════════════════════════════════

test('D5R-5. a brand-new fact with NO pre-existing facts at all never attempts a correction check (existingRiskCharacteristicFacts is empty) -> mode:NEW_FACT only, unchanged from original D.5 behavior', async () => {
  configureFixture(async () => []);
  stubTurnUnderstandingNoSignal();
  stubPreferenceInterpreterNotEligible();
  stubSafetyContextInterpreterNoSignal();
  stubRiskCharacteristicInterpreter({
    newFactCandidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'peanut allergy' }]
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d5r-5', 'I have a peanut allergy');
  const result = await Orchestrator.run({
    userId: 'd5r-user', sessionGeneration: 1, runId: 'd5r-5',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.authorized, true);
  assert.equal(result.output.riskCharacteristicFactCaptureAuthorization.candidateRecord.mode, 'NEW_FACT');
});

// ══════════════════════════════════════════════════════════════════
// Required test 5 (structural — app.js is not require()-able under node --test; browser-only
// globals, a pre-existing repo-wide constraint) — replacement persistence failure must never
// produce a false user confirmation, and the write ORDER must guarantee Safety memory is never
// left weaker than before the turn started, even under a partial failure.
// ══════════════════════════════════════════════════════════════════

function persistRiskCharacteristicFactRecordBody() {
  const startIdx = appJs.indexOf('async function persistRiskCharacteristicFactRecord');
  const endIdx = appJs.indexOf('\nasync function runPreferenceAcknowledgmentFinalizationEngine');
  assert.notEqual(startIdx, -1);
  assert.notEqual(endIdx, -1);
  return appJs.slice(startIdx, endIdx);
}

test('D5R-6. persistRiskCharacteristicFactRecord() REPLACEMENT branch writes the NEW fact FIRST and only supersedes the OLD fact after that write succeeds — never the reverse order', () => {
  const body = persistRiskCharacteristicFactRecordBody();
  const replIdx = body.indexOf("candidateRecord.mode === 'REPLACEMENT'");
  assert.notEqual(replIdx, -1);
  const newFactCallIdx = body.indexOf('persistRiskCharacteristicFactRecord(candidateRecord.newFact)', replIdx);
  const correctionCallIdx = body.indexOf('persistRiskCharacteristicFactRecord(candidateRecord.correction)', replIdx);
  assert.notEqual(newFactCallIdx, -1);
  assert.notEqual(correctionCallIdx, -1);
  assert.ok(newFactCallIdx < correctionCallIdx, 'the new-fact write must be attempted before the supersede write, so a new-fact failure never leaves the old fact already superseded');
});

test('D5R-7. a failed new-fact write in a REPLACEMENT aborts immediately with success:false — the supersede write for the old fact is never even attempted, so the old fact remains fully active', () => {
  const body = persistRiskCharacteristicFactRecordBody();
  const replBlock = body.slice(body.indexOf("candidateRecord.mode === 'REPLACEMENT'"), body.indexOf("candidateRecord.mode === 'CORRECTION'"));
  assert.match(replBlock, /var replacementNewFactResult = await persistRiskCharacteristicFactRecord\(candidateRecord\.newFact\);\s*\n\s*if \(!replacementNewFactResult\.success\) return \{ success: false \};/);
});

test('D5R-8. a failed supersede write in a REPLACEMENT (after the new fact already succeeded) also returns success:false, never a false confirmation — even though by then the new fact IS durably captured (the deliberate fail-safe direction: an extra active fact, never a missing one)', () => {
  const body = persistRiskCharacteristicFactRecordBody();
  const replBlock = body.slice(body.indexOf("candidateRecord.mode === 'REPLACEMENT'"), body.indexOf("candidateRecord.mode === 'CORRECTION'"));
  assert.match(replBlock, /var replacementCorrectionResult = await persistRiskCharacteristicFactRecord\(candidateRecord\.correction\);\s*\n\s*if \(!replacementCorrectionResult\.success\) return \{ success: false \};/);
});

test('D5R-9. the REPLACEMENT branch reuses this SAME function recursively for both halves — never a parallel, duplicated write path, and never a Firestore transaction API this codebase does not otherwise use', () => {
  const body = persistRiskCharacteristicFactRecordBody();
  const replBlock = body.slice(body.indexOf("candidateRecord.mode === 'REPLACEMENT'"), body.indexOf("candidateRecord.mode === 'CORRECTION'"));
  const recursiveCalls = (replBlock.match(/await persistRiskCharacteristicFactRecord\(/g) || []).length;
  assert.equal(recursiveCalls, 2);
  assert.equal(/runTransaction|batch\(\)/.test(replBlock), false);
});

test('D5R-10. submitCoachConversationTurn() all-or-nothing failure check for riskCharacteristicFactCaptureAuthorized is generic over the authorization outcome (never special-cased per mode) — REPLACEMENT is covered by the SAME check that already covers NEW_FACT/CORRECTION, unmodified by this round', () => {
  const startIdx = appJs.indexOf('async function submitCoachConversationTurn');
  const endIdx = appJs.indexOf('\nasync function ', startIdx + 10);
  const body = appJs.slice(startIdx, endIdx);
  assert.match(body, /if \(riskCharacteristicFactCaptureAuthorized && !riskCharacteristicFactPersistResult\.success\) \{/);
  // Exactly one such gate — proves REPLACEMENT was not given its own, separate (and possibly
  // inconsistent) failure-handling branch at the app.js call site.
  const occurrences = (body.match(/if \(riskCharacteristicFactCaptureAuthorized && !riskCharacteristicFactPersistResult\.success\) \{/g) || []).length;
  assert.equal(occurrences, 1);
});

test('D5R-11. persistRiskCharacteristicFactRecord()\'s REPLACEMENT-derived success record is identical in shape to a standalone NEW_FACT capture — {riskDomain, capturedToMemory} only, still no severity — so no new acknowledgment shape/consumer was introduced for this fix', () => {
  const body = persistRiskCharacteristicFactRecordBody();
  const replBlock = body.slice(body.indexOf("candidateRecord.mode === 'REPLACEMENT'"), body.indexOf("candidateRecord.mode === 'CORRECTION'"));
  assert.match(replBlock, /return \{ success: true, record: replacementNewFactResult\.record \};/);
  assert.equal(/severity/i.test(replBlock), false);
});
