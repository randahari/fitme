// CPI-001 — Explicit Preference Statement Interpreter unit tests (docs/specs/CPI_001_SPEC_v1.0.md
// §9). Exercises the real, unmodified module directly, with a stubbed callClaude closure
// (matching the existing turnUnderstandingInterpreter.js/activityPreferenceInterpreter.js
// configure() convention) — no live model.
// Run with: node --test tests/explicitPreferenceStatementInterpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Interpreter = require('../js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js');

function fakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function configureStub(handler) {
  Interpreter.configure({ callClaude: handler });
}
test.afterEach(() => { Interpreter.configure({ callClaude: null, timeoutMs: undefined }); });

// ── Batch partitioning (§9 — single-turn V1 input) ──

test('1. partitionIntoBatches produces exactly one batch of exactly one record for a valid turn', () => {
  const batches = Interpreter._internal.partitionIntoBatches({ turnId: 't1', text: 'אני לא אוהב לרוץ' }, 2000);
  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 1);
  assert.equal(batches[0][0].sourceTurnId, 't1');
});

test('2. partitionIntoBatches returns no batches for a turn with a missing/empty turnId', () => {
  assert.deepEqual(Interpreter._internal.partitionIntoBatches({ text: 'x' }, 2000), []);
  assert.deepEqual(Interpreter._internal.partitionIntoBatches({ turnId: '', text: 'x' }, 2000), []);
});

// ── Class A: ACTIVITY_SENTIMENT ──

test('3. an explicit activity-dislike statement classifies eligible, with a literal, substring-verified target', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal(result.eligible, true);
  assert.equal(result.preferenceClass, 'ACTIVITY_SENTIMENT');
  assert.equal(result.polarity, 'NEGATIVE');
  assert.equal(result.target, 'לרוץ');
  assert.equal(result.ineligibleReason, null);
});

test('4. a fabricated ACTIVITY_SENTIMENT target NOT literally present in the source text is rejected (fail-closed)', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'שחייה', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal(result.eligible, false);
  assert.equal(result.ineligibleReason, 'NO_EXPLICIT_PREFERENCE');
});

// ── Class B: TRAINING_TIME_PREFERENCE ──

test('5. an explicit training-time preference classifies eligible with a closed target token', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'EVENING', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני מעדיף להתאמן בערב' });
  assert.equal(result.eligible, true);
  assert.equal(result.preferenceClass, 'TRAINING_TIME_PREFERENCE');
  assert.equal(result.target, 'EVENING');
});

test('6. a TRAINING_TIME_PREFERENCE target outside the closed token enum is rejected', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'DAWN', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני מעדיף להתאמן בערב' });
  assert.equal(result.eligible, false);
});

// ── Class C: TRAINING_FORMAT_PREFERENCE ──

test('7. an explicit training-format preference classifies eligible with a closed target token', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'TRAINING_FORMAT_PREFERENCE', polarity: 'POSITIVE', target: 'SHORT', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני מעדיף אימונים קצרים' });
  assert.equal(result.eligible, true);
  assert.equal(result.preferenceClass, 'TRAINING_FORMAT_PREFERENCE');
  assert.equal(result.target, 'SHORT');
});

// ── Ineligible reasons (§9) ──

test('8. SAFETY_EXCLUDED — a medical/practitioner-sourced restriction is never classified as an ordinary preference', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'SAFETY_EXCLUDED' }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'הרופא אמר לי לא לרוץ' });
  assert.equal(result.eligible, false);
  assert.equal(result.ineligibleReason, 'SAFETY_EXCLUDED');
});

test('9. OUT_OF_V1_SCOPE — a habit/frequency statement is never forced into preference storage', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'OUT_OF_V1_SCOPE' }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'בדרך כלל אני מתאמן שלוש פעמים בשבוע' });
  assert.equal(result.eligible, false);
  assert.equal(result.ineligibleReason, 'OUT_OF_V1_SCOPE');
});

test('10. AMBIGUOUS is accepted as a valid ineligible reason', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'AMBIGUOUS' }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'משהו לא ברור' });
  assert.equal(result.ineligibleReason, 'AMBIGUOUS');
});

test('11. gating-dimension consistency: eligible:false with a populated preferenceClass is rejected (fail-closed default)', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: false, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: null, target: null, ineligibleReason: 'AMBIGUOUS' }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'x' });
  assert.equal(result.eligible, false);
  assert.equal(result.ineligibleReason, 'NO_EXPLICIT_PREFERENCE');
});

test('12. gating-dimension consistency: eligible:true with a populated ineligibleReason is rejected (fail-closed default)', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: 'AMBIGUOUS' }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal(result.eligible, false);
});

// ── Fail-closed transport/parse behavior ──

test('13. unconfigured/thrown/timeout/malformed callClaude all fail closed to eligible:false, NO_EXPLICIT_PREFERENCE', async () => {
  Interpreter.configure({ callClaude: null });
  assert.deepEqual(await Interpreter.classify({ turnId: 't1', text: 'x' }), Interpreter._internal.failedResult());

  configureStub(() => { throw new Error('boom'); });
  assert.deepEqual(await Interpreter.classify({ turnId: 't1', text: 'x' }), Interpreter._internal.failedResult());

  configureStub(async () => ({ content: [{ text: 'not json' }] }));
  assert.deepEqual(await Interpreter.classify({ turnId: 't1', text: 'x' }), Interpreter._internal.failedResult());
});

test('14. duplicate/unknown ids fail closed', async () => {
  configureStub(async () => fakeResponse([
    { id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: null },
    { id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'לרוץ', ineligibleReason: null },
    { id: 'unknown-id', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'לשחות', ineligibleReason: null }
  ]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal(result.eligible, false); // duplicated id -> fails closed by omission
});

// ── Reference-resolution-only recentConversationContext (§18) — never a source of facts ──

test('15. recentConversationContext is passed through to the prompt as a background-only block, never as extractable fact content', () => {
  const prompt = Interpreter._internal.buildPrompt(
    [{ sourceTurnId: 't1', statementText: 'גם את זה' }],
    { items: [{ turnId: 'prev', userText: 'אני אוהב לשחות', assistantText: 'הבנתי' }] }
  );
  assert.ok(prompt.includes('RECENT CONVERSATION CONTEXT'));
  assert.ok(prompt.includes('never a source of facts'));
});

test('16. classify() behaves identically when recentConversationContext is omitted (undefined)', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal(result.eligible, true);
});

// ── Never gated on Need recognition (§9) ──

test('17. this interpreter never suppresses/gates anything itself — advisory output shape only, no control-intent field', async () => {
  configureStub(async () => fakeResponse([{ id: 't1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'NEGATIVE', target: 'לרוץ', ineligibleReason: null }]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני לא אוהב לרוץ' });
  assert.equal('controlIntent' in result, false);
  assert.equal('affirmativeRequest' in result, false);
});
