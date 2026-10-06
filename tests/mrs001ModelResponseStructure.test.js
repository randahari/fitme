// MRS-001 — S-M: the structural-extraction primitive (docs/specs/MRS_001_SPEC_v1.0.md §07, §19 S-M).
// Every §07.3 step and §07.5 code, contract resolution, refusal, stop-reason pass-through and purity.
// Run with: node --test tests/mrs001ModelResponseStructure.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const MRS = require(path.join(__dirname, '../js/coachDecisionSystem/modelResponseStructure.js'));
const X = MRS.extractAnswerText;
const OFF = { state: 'EXPLICIT_PROFILE', reasoning: 'OFF' };
const ON = { state: 'EXPLICIT_PROFILE', reasoning: 'ON' };
const F1 = { state: 'FROZEN_CONTRACT', entry: 'F-1' };
const T = (text) => ({ type: 'text', text });
const R = (content, extra) => Object.assign({ content }, extra || {});
const THINK = { type: 'thinking', thinking: 'secret reasoning', signature: 's' };
const REDACTED = { type: 'redacted_thinking', data: 'opaque' };

function failsWith(raw, contract, code) {
  const r = X(raw, contract);
  assert.equal(r.status, 'FAILED');
  assert.equal(r.text, null);
  assert.equal(r.failure, code);
  return r;
}

test('S-M §07.3 step 7: a single typed text block returns its text byte-for-byte (Z-1), with the stop reason unchanged', () => {
  for (const text of ['{"a":1}', '```json\n{"a":1}\n```', 'ünïcødé ✓ עברית', ' padded \n']) {
    const raw = R([T(text)], { stop_reason: 'end_turn', usage: { output_tokens: 3 } });
    const r = X(raw, OFF);
    assert.deepEqual(r, { status: 'OK', text, stopReason: 'end_turn', failure: null, refusal: null });
    assert.ok(r.text === raw.content[0].text, 'strictly identical (===)');
    assert.ok(Object.isFrozen(r));
  }
});

test('S-M: an empty text block is one answer text, returned as "" (then fails in the stage\'s unchanged JSON.parse)', () => {
  assert.equal(X(R([T('')]), OFF).status, 'OK');
  assert.equal(X(R([T('')]), OFF).text, '');
});

test('S-M §07.3 step 5 / §06.2: reasoning before the answer — rejected under OFF (FROZEN and EXPLICIT), accepted and never read under ON', () => {
  for (const block of [THINK, REDACTED]) {
    failsWith(R([block, T('{"a":1}')]), OFF, 'REASONING_NOT_PERMITTED');
    failsWith(R([block, T('{"a":1}')]), F1, 'REASONING_NOT_PERMITTED');
    const on = X(R([block, T('{"a":1}')]), ON);
    assert.equal(on.status, 'OK');
    assert.equal(on.text, '{"a":1}');
    assert.equal(JSON.stringify(on).indexOf('secret reasoning'), -1, 'reasoning is never read or returned');
  }
  // reasoning alone is not an answer, even under ON
  failsWith(R([THINK]), ON, 'NO_ANSWER_TEXT');
});

test('S-M §07.3 step 6: zero answer texts → NO_ANSWER_TEXT; two → MULTIPLE_ANSWER_TEXT (never concatenated, never selected)', () => {
  failsWith(R([]), OFF, 'NO_ANSWER_TEXT');
  failsWith(R([T('{"a":1}'), T('{"b":2}')]), OFF, 'MULTIPLE_ANSWER_TEXT');
  failsWith(R([THINK, T('a'), T('b')]), ON, 'MULTIPLE_ANSWER_TEXT');
});

test('S-M §07.2 / §07.3 step 4: MALFORMED blocks — untyped {text}, non-string type, non-string text, non-object element', () => {
  failsWith(R([{ text: '{"a":1}' }]), OFF, 'MALFORMED_BLOCK');               // the explicit discriminator is required (AD-1)
  failsWith(R([{ type: 1, text: 'x' }]), OFF, 'MALFORMED_BLOCK');
  failsWith(R([{ type: null, text: 'x' }]), OFF, 'MALFORMED_BLOCK');
  failsWith(R([{ type: 'text', text: 42 }]), OFF, 'MALFORMED_BLOCK');
  failsWith(R([{ type: 'text' }]), OFF, 'MALFORMED_BLOCK');
  failsWith(R(['{"a":1}']), OFF, 'MALFORMED_BLOCK');
  failsWith(R([null]), OFF, 'MALFORMED_BLOCK');
  failsWith(R([[T('x')]]), OFF, 'MALFORMED_BLOCK');
  failsWith(R([T('x'), { text: 'y' }]), OFF, 'MALFORMED_BLOCK');
  // MALFORMED is decided before UNSUPPORTED and before reasoning
  failsWith(R([{ type: 'tool_use' }, { text: 'y' }]), ON, 'MALFORMED_BLOCK');
  failsWith(R([THINK, { text: 'y' }]), OFF, 'MALFORMED_BLOCK');
});

test('S-M §07.2: UNSUPPORTED blocks — tool use, server tools, unknown and future types — always fail, under OFF and ON', () => {
  for (const type of ['tool_use', 'server_tool_use', 'web_search_tool_result', 'image', 'fallback', 'some_future_block']) {
    failsWith(R([{ type }, T('{"a":1}')]), OFF, 'UNSUPPORTED_BLOCK');
    failsWith(R([T('{"a":1}'), { type }]), ON, 'UNSUPPORTED_BLOCK');
  }
  failsWith(R([THINK, { type: 'tool_use' }, T('x')]), OFF, 'UNSUPPORTED_BLOCK'); // unsupported precedes reasoning
});

test('S-M §07.3 step 3: not a response — non-object, array, missing or non-array content', () => {
  for (const raw of [null, undefined, 'text', 7, true, [T('x')], {}, { content: 'x' }, { content: { type: 'text', text: 'x' } }, { content: null }]) {
    failsWith(raw, OFF, 'NOT_A_RESPONSE');
  }
  assert.equal(X(null, OFF).stopReason, null);
});

test('S-M §07.3 step 2: refusal fails closed regardless of content, preserving the supplied category/details unchanged', () => {
  const details = { type: 'refusal', category: 'cyber', explanation: 'declined' };
  const withDetails = failsWith(R([T('{"a":1}')], { stop_reason: 'refusal', stop_details: details }), OFF, 'REFUSAL');
  assert.deepEqual(withDetails.refusal, { category: 'cyber', details });
  assert.equal(withDetails.refusal.details, details, 'details passed through unchanged');
  assert.equal(withDetails.stopReason, 'refusal');
  assert.deepEqual(failsWith(R([], { stop_reason: 'refusal' }), OFF, 'REFUSAL').refusal, { category: null, details: null });
  failsWith(R([T('partial')], { stop_reason: 'refusal' }), ON, 'REFUSAL');
  failsWith({ stop_reason: 'refusal' }, F1, 'REFUSAL');                                  // precedes NOT_A_RESPONSE
  failsWith(R([{ text: 'x' }], { stop_reason: 'refusal' }), OFF, 'REFUSAL');             // precedes MALFORMED_BLOCK
  failsWith(R([THINK, T('x')], { stop_reason: 'refusal' }), OFF, 'REFUSAL');             // precedes REASONING_NOT_PERMITTED
});

test('S-M §07.6: every stop reason passes through unchanged; none but refusal changes the outcome', () => {
  for (const sr of ['end_turn', 'max_tokens', 'stop_sequence', 'pause_turn', 'tool_use', 'model_context_window_exceeded', null, 'anything']) {
    const r = X(R([T('{"a":1}')], { stop_reason: sr }), OFF);
    assert.equal(r.status, 'OK', String(sr));
    assert.equal(r.stopReason, sr);
  }
  assert.equal(X(R([T('x')]), OFF).stopReason, null);
  assert.equal(X(R([]), OFF, 'NO_ANSWER_TEXT').stopReason, null);
  assert.equal(X(R([], { stop_reason: 'max_tokens' }), OFF).stopReason, 'max_tokens');
});

test('S-M §07.3 step 1: CONTRACT_UNRESOLVED for every missing, unknown, malformed, extra or conflicting contract — never a default', () => {
  const ok = R([T('{"a":1}')]);
  const bad = [undefined, null, 'OFF', 1, [], {}, { state: 'FROZEN_CONTRACT' }, { state: 'FROZEN_CONTRACT', entry: 'F-20' }, { state: 'FROZEN_CONTRACT', entry: 'F-0' },
    { state: 'FROZEN_CONTRACT', entry: 1 }, { state: 'FROZEN_CONTRACT', entry: 'F-1', reasoning: 'OFF' }, { state: 'EXPLICIT_PROFILE' },
    { state: 'EXPLICIT_PROFILE', reasoning: 'off' }, { state: 'EXPLICIT_PROFILE', reasoning: 'AUTO' }, { state: 'EXPLICIT_PROFILE', reasoning: null },
    { state: 'EXPLICIT_PROFILE', reasoning: 'OFF', entry: 'F-1' }, { state: 'EXPLICIT_PROFILE', reasoning: 'OFF', extra: true },
    { state: 'IMPLICIT', reasoning: 'OFF' }, { entry: 'F-1' }, { reasoning: 'OFF' }, Object.create({ state: 'EXPLICIT_PROFILE', reasoning: 'OFF' })];
  bad.forEach((c, i) => failsWith(ok, c, 'CONTRACT_UNRESOLVED', i));
  assert.equal(X(ok).failure, 'CONTRACT_UNRESOLVED');
});

test('S-M: CONTRACT_UNRESOLVED takes precedence over every response-dependent outcome, including refusal', () => {
  for (const raw of [R([], { stop_reason: 'refusal' }), null, R([{ text: 'x' }]), R([{ type: 'tool_use' }]), R([THINK, T('x')]), R([]), R([T('a'), T('b')]), R([T('ok')])]) {
    failsWith(raw, { state: 'FROZEN_CONTRACT', entry: 'F-99' }, 'CONTRACT_UNRESOLVED');
    failsWith(raw, null, 'CONTRACT_UNRESOLVED');
  }
});

test('S-M §10: the frozen inventory has exactly the 19 canonical entries, each resolving to reasoning OFF', () => {
  const inv = MRS.FROZEN_CONTRACT_INVENTORY;
  const ids = Array.from({ length: 19 }, (_, i) => 'F-' + (i + 1));
  assert.deepEqual(Object.keys(inv), ids);
  assert.ok(Object.isFrozen(inv));
  ids.forEach((id) => {
    assert.ok(Object.isFrozen(inv[id]));
    assert.equal(inv[id].reasoning, 'OFF');
    assert.deepEqual(inv[id].keys, ['model', 'max_tokens', 'messages']);
    assert.equal(inv[id].model, 'claude-haiku-4-5-20251001');
    failsWith(R([THINK, T('x')]), { state: 'FROZEN_CONTRACT', entry: id }, 'REASONING_NOT_PERMITTED');
    assert.equal(X(R([T('x')]), { state: 'FROZEN_CONTRACT', entry: id }).status, 'OK');
  });
});

test('S-M §07.5: the failure vocabulary is exactly the eight closed codes', () => {
  assert.deepEqual(Object.values(MRS.FAILURES).sort(), ['CONTRACT_UNRESOLVED', 'MALFORMED_BLOCK', 'MULTIPLE_ANSWER_TEXT', 'NOT_A_RESPONSE', 'NO_ANSWER_TEXT',
    'REASONING_NOT_PERMITTED', 'REFUSAL', 'UNSUPPORTED_BLOCK']);
});

test('S-M purity: no input mutation; same input, same output; never throws', () => {
  const raw = R([THINK, T('{"a":1}')], { stop_reason: 'end_turn', stop_details: null, usage: { output_tokens: 9 } });
  const contract = { state: 'EXPLICIT_PROFILE', reasoning: 'ON' };
  const before = JSON.stringify([raw, contract]);
  const a = X(raw, contract);
  const b = X(raw, contract);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify([raw, contract]), before);
  const hostile = { get content() { return [T('x')]; }, stop_reason: 'end_turn' };
  assert.doesNotThrow(() => X(hostile, OFF));
  assert.doesNotThrow(() => X(Object.freeze(R(Object.freeze([Object.freeze(T('x'))]))), OFF));
});
