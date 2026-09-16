// Friends Alpha Item 6 (USER_DISCLOSURE V1) — Safety Disclosure Intake Gate unit tests.
// Exercises the real, unmodified module directly. SafetyContextInterpreter (the real, existing,
// closed USC-001 module) is stubbed via its own configure({callClaude}) seam — never mocked/
// replaced — exactly mirroring preferenceIntakeGate.test.js's own established convention and this
// gate's own production reuse.
// Run with: node --test tests/safetyDisclosureIntakeGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Gate = require('../js/coachDecisionSystem/safetyDisclosureIntakeGate.js');
const SafetyContextInterpreter = require('../js/coachDecisionSystem/safetyContextInterpreter.js');

function configureSafetyStub(handler) {
  SafetyContextInterpreter.configure({ callClaude: handler });
}

// The gate's detectNewRestriction() always submits exactly one record, id 'turn:<turnId>'.
function noNewRestrictionStub() {
  configureSafetyStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
  });
}

function newRestrictionFoundStub(restrictedActivityText) {
  configureSafetyStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: restrictedActivityText, statedDurationText: null }] }) }] };
  });
}

test.afterEach(() => { SafetyContextInterpreter.configure({ callClaude: null, maxRecordsPerBatch: undefined, timeoutMs: undefined }); });

var VALID_TURN = { turnId: 't1', text: 'הרופא אמר לי לא לרוץ' };

// ── NEW_RESTRICTION path ──

test('1. a new restriction literally stated on the current turn, with consent, is authorized as NEW_RESTRICTION', async () => {
  newRestrictionFoundStub('לרוץ');
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, true);
  assert.equal(result.reason, 'OK');
  assert.deepEqual(result.candidateRecord, { mode: 'NEW_RESTRICTION', restrictedActivityText: 'לרוץ', subjectKey: 'לרוץ', sourceTurnId: 't1', category: 'STATE' });
});

test('2. a new restriction without consent is never authorized (CONSENT_ABSENT)', async () => {
  newRestrictionFoundStub('לרוץ');
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: false, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'CONSENT_ABSENT');
  assert.equal(result.candidateRecord, null);
});

// ── No new restriction, no durable restrictions to check -> NOT_CAPTURE_ELIGIBLE ──

test('3. no new restriction and no existing durable restrictions is never authorized (NOT_CAPTURE_ELIGIBLE) — an ordinary disclosure is acknowledgement-only', async () => {
  noNewRestrictionStub();
  const result = await Gate.authorize({ turn: { turnId: 't2', text: 'אני אוהב לרוץ בבוקר' }, pipelineContext: {}, consentGranted: true, category: 'DESIRE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'NOT_CAPTURE_ELIGIBLE');
});

// ── CORRECTION path ──

function correctionConfirmedStub(expectedRestrictionSubstring, confirmed) {
  configureSafetyStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    // buildCorrectionPrompt embeds the existing restriction text directly into the prompt.
    assert.match(body.messages[0].content, new RegExp(expectedRestrictionSubstring));
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: confirmed }] }) }] };
  });
}

test('4. an explicit, unambiguous correction against exactly one existing restriction, with consent, is authorized as CORRECTION', async () => {
  noNewRestrictionStub(); // no NEW_RESTRICTION on the current turn itself
  // detectNewRestriction and detectCorrection both call SafetyContextInterpreter, so this test
  // configures a handler that answers both shapes correctly based on which prompt was sent.
  configureSafetyStub(async (body) => {
    const content = body.messages[0].content;
    const idMatch = content.match(/<statement id="([^"]+)"/);
    if (content.indexOf('previously, explicitly') >= 0) {
      // This is the correction-check prompt.
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: true }] }) }] };
    }
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
  });
  const pipelineContext = { userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'לרוץ' }] } };
  const result = await Gate.authorize({ turn: { turnId: 't3', text: 'הרופא אישר לי לחזור לרוץ' }, pipelineContext: pipelineContext, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, true);
  assert.deepEqual(result.candidateRecord, { mode: 'CORRECTION', subjectKey: 'לרוץ', sourceTurnId: 't3', category: 'STATE' });
});

test('5. an ordinary state statement (correction never confirmed) preserves the existing restriction (NOT_CAPTURE_ELIGIBLE), never inferring recovery', async () => {
  configureSafetyStub(async (body) => {
    const content = body.messages[0].content;
    const idMatch = content.match(/<statement id="([^"]+)"/);
    if (content.indexOf('previously, explicitly') >= 0) {
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: false }] }) }] }; // "my knee feels better" alone
    }
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
  });
  const pipelineContext = { userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'לרוץ' }] } };
  const result = await Gate.authorize({ turn: { turnId: 't4', text: 'הברך שלי מרגישה יותר טוב' }, pipelineContext: pipelineContext, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'NOT_CAPTURE_ELIGIBLE');
});

test('6. ambiguity — more than one confirmed correction match against multiple existing restrictions — preserves every restriction untouched (NOT_CAPTURE_ELIGIBLE)', async () => {
  configureSafetyStub(async (body) => {
    const content = body.messages[0].content;
    const idMatch = content.match(/<statement id="([^"]+)"/);
    if (content.indexOf('previously, explicitly') >= 0) {
      return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: true }] }) }] }; // confirms EVERY restriction — ambiguous
    }
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
  });
  const pipelineContext = { userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'לרוץ' }, { sourceMemoryId: 'm2', restrictedActivityText: 'לשחות' }] } };
  const result = await Gate.authorize({ turn: { turnId: 't5', text: 'אני מרגיש הרבה יותר טוב' }, pipelineContext: pipelineContext, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'NOT_CAPTURE_ELIGIBLE');
});

// ── Fail-closed on classifier unavailability ──

test('7. a thrown/unavailable classifier on the new-restriction check fails closed (SAFETY_CLASSIFIER_UNAVAILABLE), never treated as "no restriction"', async () => {
  configureSafetyStub(() => { throw new Error('transport failure'); });
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_CLASSIFIER_UNAVAILABLE');
});

test('8. an unconfigured classifier (no callClaude at all) fails closed (SAFETY_CLASSIFIER_UNAVAILABLE)', async () => {
  SafetyContextInterpreter.configure({ callClaude: null });
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_CLASSIFIER_UNAVAILABLE');
});

test('9. a classifier that fails ONLY on the correction-check leg (new-restriction check succeeds clean) fails the whole authorization closed, never partially trusts the sequence', async () => {
  configureSafetyStub(async (body) => {
    const content = body.messages[0].content;
    const idMatch = content.match(/<statement id="([^"]+)"/);
    if (content.indexOf('previously, explicitly') >= 0) {
      throw new Error('correction transport failure');
    }
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] }) }] };
  });
  const pipelineContext = { userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'לרוץ' }] } };
  const result = await Gate.authorize({ turn: { turnId: 't6', text: 'משהו' }, pipelineContext: pipelineContext, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_CLASSIFIER_UNAVAILABLE');
});

// ── Defensive input validation ──

test('10. an invalid turn (missing turnId/text) is rejected (INVALID_TURN), no classifier call attempted', async () => {
  let called = false;
  configureSafetyStub(async () => { called = true; return { content: [{ text: '{}' }] }; });
  const result = await Gate.authorize({ turn: {}, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'INVALID_TURN');
  assert.equal(called, false);
});

// ── Never a write, never a TerminalDecision, never mutates inputs ──

test('11. authorize() never mutates its inputs and returns a frozen, closed object', async () => {
  newRestrictionFoundStub('לרוץ');
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: true, category: 'STATE' });
  assert.ok(Object.isFrozen(result));
  assert.equal('kind' in result, false); // never a TerminalDecision shape
});

test('12. category is passed through unchanged, never re-derived by this module', async () => {
  newRestrictionFoundStub('לרוץ');
  const result = await Gate.authorize({ turn: VALID_TURN, pipelineContext: {}, consentGranted: true, category: 'CAPACITY_OR_CONSTRAINT' });
  assert.equal(result.candidateRecord.category, 'CAPACITY_OR_CONSTRAINT');
});
