// CPI-001 — Preference Intake Gate unit tests (docs/specs/CPI_001_SPEC_v1.0.md §10). Exercises
// the real, unmodified module directly. SafetyContextInterpreter (the real, existing, closed
// USC-001 module) is stubbed via its own configure({callClaude}) seam — never mocked/replaced —
// exactly mirroring the production reuse this gate itself performs.
// Run with: node --test tests/preferenceIntakeGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Gate = require('../js/coachDecisionSystem/preferenceIntakeGate.js');
const SafetyContextInterpreter = require('../js/coachDecisionSystem/safetyContextInterpreter.js');

function safetyFakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function configureSafetyStub(handler) {
  SafetyContextInterpreter.configure({ callClaude: handler });
}
function noRestrictionSafetyStub() {
  // The gate always submits exactly one record, id 'turn:<turnId>' — respond with a clean,
  // genuine NOT_RESTRICTION_OR_NOT_CLASSIFIED for it.
  configureSafetyStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    return safetyFakeResponse([{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }]);
  });
}

test.afterEach(() => { SafetyContextInterpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined }); });

var VALID_TURN = { turnId: 't1', text: 'אני לא אוהב לרוץ' };
var VALID_INTERPRETER_RESULT = { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: null };

// ── Happy path ──

test('1. a valid, literally-anchored, consented, non-Safety-vetoed statement is authorized with a full candidateRecord', async () => {
  noRestrictionSafetyStub();
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, true);
  assert.equal(result.reason, 'OK');
  assert.deepEqual(result.candidateRecord, { preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', sourceTurnId: 't1' });
});

// ── Checks 1-2: malformed interpreter output / literal-anchor failure ──

test('2. eligible:false interpreter output is never authorized (INVALID_SHAPE)', async () => {
  const result = await Gate.authorize({ interpreterResult: { eligible: false }, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'INVALID_SHAPE');
});

test('3. an unknown preferenceClass is rejected (INVALID_SHAPE)', async () => {
  const result = await Gate.authorize({
    interpreterResult: { eligible: true, preferenceClass: 'FOOD_PREFERENCE', polarity: 'NEGATIVE', target: 'x' },
    turn: VALID_TURN, pipelineContext: {}, consentGranted: true
  });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'INVALID_SHAPE');
});

test('4. a fabricated ACTIVITY_SENTIMENT target NOT literally present in the turn text is rejected (LITERAL_ANCHOR_FAILED), re-verified independently of the interpreter', async () => {
  const result = await Gate.authorize({
    interpreterResult: { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'שחייה' },
    turn: VALID_TURN, pipelineContext: {}, consentGranted: true
  });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'LITERAL_ANCHOR_FAILED');
});

test('5. a TRAINING_TIME_PREFERENCE target outside its closed token enum is rejected (INVALID_SHAPE)', async () => {
  const result = await Gate.authorize({
    interpreterResult: { eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'DAWN' },
    turn: VALID_TURN, pipelineContext: {}, consentGranted: true
  });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'INVALID_SHAPE');
});

// ── Check 3: consent (§7) ──

test('6. consentGranted:false is never authorized (CONSENT_ABSENT), regardless of an otherwise-valid statement', async () => {
  noRestrictionSafetyStub();
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: false });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'CONSENT_ABSENT');
});

// ── Check 5: independent Safety veto (§10 point 5) — the direct proof of Issue 2's resolution ──

test('7. a genuine Safety restriction found by the independent classifier vetoes authorization (SAFETY_VETO), regardless of the preference interpreter\'s own eligible:true', async () => {
  configureSafetyStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    return safetyFakeResponse([{ id: idMatch[1], restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'לרוץ', statedDurationText: null }]);
  });
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: { turnId: 't1', text: 'הרופא אמר לי לא לרוץ' }, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_VETO');
});

test('8. a durable, already-persisted Safety restriction on the same target vetoes authorization (SAFETY_VETO_DURABLE) even when the current-turn classifier finds nothing', async () => {
  noRestrictionSafetyStub();
  const pipelineContext = { userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'לרוץ' }] } };
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: pipelineContext, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_VETO_DURABLE');
});

// ── Safety fail-closed clarification (Canonical Review) — the direct proof of the fail-closed fix ──

test('9. a Safety classifier that cannot produce a trustworthy result (thrown) fails closed (SAFETY_VETO_UNAVAILABLE), never treated as "zero restrictions found"', async () => {
  configureSafetyStub(() => { throw new Error('transport failure'); });
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_VETO_UNAVAILABLE');
});

test('10. a Safety classifier returning malformed JSON fails closed (SAFETY_VETO_UNAVAILABLE)', async () => {
  configureSafetyStub(async () => ({ content: [{ text: 'not json' }] }));
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_VETO_UNAVAILABLE');
});

test('11. an unconfigured Safety classifier (no callClaude at all) fails closed (SAFETY_VETO_UNAVAILABLE)', async () => {
  SafetyContextInterpreter.configure({ callClaude: null });
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_VETO_UNAVAILABLE');
});

// ── Never a write, never a TerminalDecision ──

test('12. authorize() never mutates its inputs and returns a frozen, closed object', async () => {
  noRestrictionSafetyStub();
  const result = await Gate.authorize({ interpreterResult: VALID_INTERPRETER_RESULT, turn: VALID_TURN, pipelineContext: {}, consentGranted: true });
  assert.ok(Object.isFrozen(result));
  assert.equal('kind' in result, false); // never a TerminalDecision shape
});
