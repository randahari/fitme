// DUC-001 — Turn Understanding Interpreter unit tests (docs/specs/DUC_001_SPEC_v1.0.md §04/§05).
// Exercises the real, unmodified module directly, with a stubbed callClaude closure (matching
// the existing explicitRequestInterpreter.js/expressionRenderer.js configure() convention) — no
// live model.
// Run with: node --test tests/turnUnderstandingInterpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Interpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');

const CLASSIFIED = 'CLASSIFIED';
const FAILED = 'FAILED';

function fakeResponse(results) {
  return { content: [{ text: JSON.stringify({ results: results }) }] };
}
function fakeResponseFromRawText(text) { return { content: [{ text: text }] }; }

function entry(id, overrides) {
  return Object.assign({
    id: id,
    affirmativeRequestPresent: false,
    domain: null,
    topic: null,
    currentStateStatementPresent: false,
    currentStateStatementText: null,
    negativeControlPresent: false,
    desireOnlyPresent: false
  }, overrides || {});
}

function configureStub(handler) {
  Interpreter.configure({ callClaude: handler });
}

test.afterEach(() => { Interpreter.configure({ callClaude: null, timeoutMs: undefined }); });

// ── Batch partitioning (§04 — single-turn V1 input, shape reused for structural consistency) ──

test('1. partitionIntoBatches produces exactly one batch of exactly one record for a valid turn', () => {
  const batches = Interpreter._internal.partitionIntoBatches({ turnId: 't1', text: 'hello' }, 2000);
  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 1);
  assert.equal(batches[0][0].sourceTurnId, 't1');
  assert.equal(batches[0][0].statementText, 'hello');
});

test('2. partitionIntoBatches returns no batches for a turn with a missing/empty turnId — never fabricates classification for it', () => {
  assert.deepEqual(Interpreter._internal.partitionIntoBatches({ text: 'x' }, 2000), []);
  assert.deepEqual(Interpreter._internal.partitionIntoBatches({ turnId: '', text: 'x' }, 2000), []);
  assert.deepEqual(Interpreter._internal.partitionIntoBatches(null, 2000), []);
});

test('3. per-turn text is truncated to the character cap', () => {
  const batches = Interpreter._internal.partitionIntoBatches({ turnId: 't1', text: 'x'.repeat(500) }, 50);
  assert.equal(batches[0][0].statementText.length, 50);
});

// ── Prompt construction (§04 — closed vocabulary, per-turn delimiting) ─────────────────────

test('4. buildPrompt delimits the turn by its own id and lists the closed domain/topic vocabulary', () => {
  const prompt = Interpreter._internal.buildPrompt([{ sourceTurnId: 't1', statementText: 'ישנתי 5 שעות' }]);
  assert.ok(prompt.includes('<turn id="t1">ישנתי 5 שעות</turn>'));
  assert.ok(prompt.includes('WORKOUT/WORKOUT_FREQUENCY'));
  assert.ok(prompt.includes('NUTRITION/PROTEIN_INTAKE'));
});

// ── parseAndValidate — fail-closed-by-omission discipline (§04) ────────────────────────────

test('5. a well-formed CLASSIFIED entry with no request/state/control is accepted verbatim', () => {
  const accepted = Interpreter._internal.parseAndValidate(fakeResponse([entry('t1')]), ['t1']);
  assert.deepEqual(accepted.t1, {
    affirmativeRequest: { present: false, domain: null, topic: null },
    currentStateStatement: { present: false, text: null },
    negativeControlPresent: false,
    desireOnlyPresent: false
  });
});

test('6. an affirmative request resolved against a valid closed pair is accepted', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })]),
    ['t1']
  );
  assert.deepEqual(accepted.t1.affirmativeRequest, { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' });
});

test('7. an affirmative request with an unresolved (null/null) scope is accepted — never guessed', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: true, domain: null, topic: null })]),
    ['t1']
  );
  assert.deepEqual(accepted.t1.affirmativeRequest, { present: true, domain: null, topic: null });
});

test('8. an affirmative request with a domain/topic pair OUTSIDE the closed vocabulary fails closed (the whole id is dropped)', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: true, domain: 'HABITS', topic: 'CONSISTENCY' })]),
    ['t1']
  );
  assert.equal(accepted.t1, undefined);
});

test('9. domain/topic populated when affirmativeRequestPresent is false fails closed', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: false, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })]),
    ['t1']
  );
  assert.equal(accepted.t1, undefined);
});

test('10. currentStateStatementPresent true requires a non-empty currentStateStatementText, or fails closed', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { currentStateStatementPresent: true, currentStateStatementText: null })]),
    ['t1']
  );
  assert.equal(accepted.t1, undefined);
});

test('11. currentStateStatementPresent true with real text is accepted verbatim', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות' })]),
    ['t1']
  );
  assert.deepEqual(accepted.t1.currentStateStatement, { present: true, text: 'ישנתי 5 שעות' });
});

test('12. desireOnlyPresent and affirmativeRequestPresent both true for the same turn fails closed (Decision 5B)', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: true, desireOnlyPresent: true })]),
    ['t1']
  );
  assert.equal(accepted.t1, undefined);
});

test('13. negativeControlPresent and affirmativeRequestPresent may both be true simultaneously (independent dimensions, Ch.11 worked example)', () => {
  const accepted = Interpreter._internal.parseAndValidate(
    fakeResponse([entry('t1', { affirmativeRequestPresent: true, negativeControlPresent: true })]),
    ['t1']
  );
  assert.equal(accepted.t1.affirmativeRequest.present, true);
  assert.equal(accepted.t1.negativeControlPresent, true);
});

test('14. an unknown id in the response is ignored outright', () => {
  const accepted = Interpreter._internal.parseAndValidate(fakeResponse([entry('unknown-id')]), ['t1']);
  assert.deepEqual(accepted, {});
});

test('15. a duplicate id in the response fails closed for that id', () => {
  const accepted = Interpreter._internal.parseAndValidate(fakeResponse([entry('t1'), entry('t1')]), ['t1']);
  assert.equal(accepted.t1, undefined);
});

test('16. a missing boolean dimension fails closed', () => {
  const raw = entry('t1');
  delete raw.negativeControlPresent;
  const accepted = Interpreter._internal.parseAndValidate(fakeResponse([raw]), ['t1']);
  assert.equal(accepted.t1, undefined);
});

test('17. malformed JSON at the batch level fails every id closed, never throws', () => {
  const accepted = Interpreter._internal.parseAndValidate(fakeResponseFromRawText('not json'), ['t1']);
  assert.deepEqual(accepted, {});
});

test('18. a response missing the top-level "results" array fails closed', () => {
  const accepted = Interpreter._internal.parseAndValidate({ content: [{ text: JSON.stringify({ nope: [] }) }] }, ['t1']);
  assert.deepEqual(accepted, {});
});

// ── classify() — the full, single-turn, fail-closed-by-status contract (§04/§17 Blocker 7) ──

test('19. classify() resolves interpretationStatus CLASSIFIED for a well-formed turn/response', async () => {
  configureStub(async () => fakeResponse([entry('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'כדאי לי להתאמן היום?' });
  assert.equal(result.interpretationStatus, CLASSIFIED);
  assert.deepEqual(result.affirmativeRequest, { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' });
});

test('20. classify() resolves interpretationStatus FAILED (never CLASSIFIED with fabricated content) when callClaude is not configured', async () => {
  Interpreter.configure({ callClaude: null });
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני עייף היום' });
  assert.equal(result.interpretationStatus, FAILED);
  assert.equal(result.affirmativeRequest.present, false);
});

test('21. classify() resolves interpretationStatus FAILED when callClaude throws', async () => {
  configureStub(() => { throw new Error('boom'); });
  const result = await Interpreter.classify({ turnId: 't1', text: 'x' });
  assert.equal(result.interpretationStatus, FAILED);
});

test('22. classify() resolves interpretationStatus FAILED when callClaude times out', async () => {
  configureStub(() => new Promise(() => {})); // never resolves
  Interpreter.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  const result = await Interpreter.classify({ turnId: 't1', text: 'x' });
  assert.equal(result.interpretationStatus, FAILED);
});

test('23. classify() resolves interpretationStatus FAILED for malformed model output — distinct from, but user-facing-identical to, a genuine no-request turn (§17 Case A vs. C)', async () => {
  configureStub(async () => fakeResponseFromRawText('not json'));
  const failed = await Interpreter.classify({ turnId: 't1', text: 'x' });
  configureStub(async () => fakeResponse([entry('t1')]));
  const noRequest = await Interpreter.classify({ turnId: 't1', text: 'אני עייף היום' });
  assert.equal(failed.interpretationStatus, FAILED);
  assert.equal(noRequest.interpretationStatus, CLASSIFIED);
  assert.equal(noRequest.affirmativeRequest.present, false);
  // Both currently degrade to the same downstream (no Need created) — but are machine-readably
  // distinct at this module's own boundary, which is the entire point of Blocker 7's correction.
  assert.notEqual(failed.interpretationStatus, noRequest.interpretationStatus);
});

// ── §05's own six-example semantic-distinction table ────────────────────────────────────────

test('24. "אני רוצה לרוץ היום" (desire only, no question) resolves affirmativeRequest.present:false, desireOnlyPresent:true', async () => {
  configureStub(async () => fakeResponse([entry('t1', { desireOnlyPresent: true })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני רוצה לרוץ היום' });
  assert.equal(result.affirmativeRequest.present, false);
  assert.equal(result.desireOnlyPresent, true);
});

test('25. "אני רוצה לרוץ היום, מה דעתך?" (desire + question) resolves affirmativeRequest.present:true, desireOnlyPresent:false', async () => {
  configureStub(async () => fakeResponse([entry('t1', { affirmativeRequestPresent: true })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אני רוצה לרוץ היום, מה דעתך?' });
  assert.equal(result.affirmativeRequest.present, true);
  assert.equal(result.desireOnlyPresent, false);
});

test('26. "אל תציע לי ריצה" (pure negative control) resolves affirmativeRequest.present:false, desireOnlyPresent:false, negativeControlPresent:true', async () => {
  configureStub(async () => fakeResponse([entry('t1', { negativeControlPresent: true })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אל תציע לי ריצה' });
  assert.equal(result.affirmativeRequest.present, false);
  assert.equal(result.desireOnlyPresent, false);
  assert.equal(result.negativeControlPresent, true);
});

test('27. "ישנתי 5 שעות, כדאי לי להתאמן היום?" resolves both an affirmativeRequest and a currentStateStatement simultaneously (Ch.11 worked example)', async () => {
  configureStub(async () => fakeResponse([entry('t1', {
    affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY',
    currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות'
  })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?' });
  assert.equal(result.affirmativeRequest.present, true);
  assert.deepEqual(result.affirmativeRequest, { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' });
  assert.deepEqual(result.currentStateStatement, { present: true, text: 'ישנתי 5 שעות' });
});

test('28. "אל תציע לי ריצה, אבל מה כדאי לי לעשות היום?" resolves negativeControlPresent AND affirmativeRequest.present simultaneously (§12a worked example)', async () => {
  configureStub(async () => fakeResponse([entry('t1', { affirmativeRequestPresent: true, negativeControlPresent: true })]));
  const result = await Interpreter.classify({ turnId: 't1', text: 'אל תציע לי ריצה, אבל מה כדאי לי לעשות היום?' });
  assert.equal(result.affirmativeRequest.present, true);
  assert.equal(result.negativeControlPresent, true);
});

test('29. an identical turn reaches the same interpretationStatus/shape on every run (determinism of the interpreter contract, not of generated wording)', async () => {
  configureStub(async () => fakeResponse([entry('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })]));
  const r1 = await Interpreter.classify({ turnId: 't1', text: 'כדאי לי להתאמן היום?' });
  const r2 = await Interpreter.classify({ turnId: 't1', text: 'כדאי לי להתאמן היום?' });
  assert.deepEqual(r1, r2);
});

test('30. classify() never throws even when callClaude rejects', async () => {
  configureStub(async () => { throw new Error('transport failure'); });
  await assert.doesNotReject(Interpreter.classify({ turnId: 't1', text: 'x' }));
});

test('31. isValidPair reuses the closed vocabulary correctly (true for a real pair, false for an invented one)', () => {
  assert.equal(Interpreter.isValidPair('WORKOUT', 'WORKOUT_FREQUENCY'), true);
  assert.equal(Interpreter.isValidPair('HABITS', 'CONSISTENCY'), false);
  assert.equal(Interpreter.isValidPair(null, null), false);
});
