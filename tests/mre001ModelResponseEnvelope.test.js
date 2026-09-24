// MRE-001 — ModelResponseEnvelope.unwrapSingleJsonFence() unit tests and the full adversarial
// acceptance/rejection matrix (docs/specs/MRE_001_SPEC_v1.0.md §06, §07, §17).
// Run with: node --test tests/mre001ModelResponseEnvelope.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Envelope = require('../js/coachDecisionSystem/modelResponseEnvelope.js');

const unwrap = Envelope.unwrapSingleJsonFence;
const F = '```';
const P = '{"results":[{"id":"t1","ok":true}]}';

// MRE-001 §17 — every row: [row, label, input, expected output].
const MATRIX = [
  [1, 'plain JSON (identity)', P, P],
  [2, '```json fence', F + 'json\n' + P + '\n' + F, P],
  [3, '```JSON fence (uppercase marker)', F + 'JSON\n' + P + '\n' + F, P],
  [4, '```Json fence (mixed-case marker)', F + 'Json\n' + P + '\n' + F, P],
  [5, 'bare ``` fence (no language)', F + '\n' + P + '\n' + F, P],
  [6, 'CRLF line endings', F + 'json\r\n' + P + '\r\n' + F, P],
  [7, 'surrounding whitespace', '  \n ' + F + 'json\n' + P + '\n' + F + '  \n ', P],
  [8, 'trailing spaces/tabs after marker', F + 'json \t \n' + P + '\n' + F, P],
  [9, 'indented closing fence', F + 'json\n' + P + '\n  ' + F, P],
  [10, 'prose before the fence', 'Here you go:\n' + F + 'json\n' + P + '\n' + F, null],
  [11, 'prose after the fence', F + 'json\n' + P + '\n' + F + '\nHope this helps', null],
  [12, 'two fenced blocks', F + 'json\n' + P + '\n' + F + '\n' + F + 'json\n' + P + '\n' + F, null],
  [13, 'nested fence', F + 'json\n' + F + 'json\n' + P + '\n' + F + '\n' + F, null],
  [14, 'four backticks', '`' + F + 'json\n' + P + '\n`' + F, null],
  [14.1, 'four-backtick closer only', F + 'json\n' + P + '\n`' + F, null],
  [15, 'tilde fence', '~~~json\n' + P + '\n~~~', null],
  [16, 'js marker', F + 'js\n' + P + '\n' + F, null],
  [16.1, 'javascript marker', F + 'javascript\n' + P + '\n' + F, null],
  [16.2, 'jsonc marker', F + 'jsonc\n' + P + '\n' + F, null],
  [17, 'space before the marker', F + ' json\n' + P + '\n' + F, null],
  [18, 'no newline after opener (single line)', F + 'json' + P + F, null],
  [18.1, 'payload on the opener line', F + 'json ' + P + '\n' + F, null],
  [19, 'payload on the closer line', F + 'json\n' + P + F, null],
  [20, 'truncated closer (two backticks)', F + 'json\n' + P + '\n``', null],
  [20.1, 'missing closer', F + 'json\n' + P, null],
  [21, 'empty inner payload', F + 'json\n' + F, null],
  [21.1, 'whitespace-only inner payload', F + 'json\n  \t \n' + F, null],
  [22, 'malformed inner JSON (accepted envelope, still malformed)', F + 'json\n{"a":1,}\n' + F, '{"a":1,}'],
  [23, 'wrong schema inside valid JSON (accepted envelope)', F + 'json\n{"unexpected":true}\n' + F, '{"unexpected":true}'],
  [24, 'leading BOM', '﻿' + F + 'json\n' + P + '\n' + F, null]
];

test('§17 matrix: accepted rows return the inner payload; rejected rows return the input unchanged (===)', () => {
  for (const [row, label, input, expected] of MATRIX) {
    const out = unwrap(input);
    if (expected === null) assert.equal(out, input, 'row ' + row + ' (' + label + ') must be returned unchanged');
    else assert.equal(out, expected, 'row ' + row + ' (' + label + ')');
  }
});

test('row 22/23: the envelope never repairs — malformed inner JSON still throws in the exact parser; wrong-schema JSON parses and is left to the validator', () => {
  assert.throws(() => JSON.parse(unwrap(F + 'json\n{"a":1,}\n' + F)));
  assert.deepEqual(JSON.parse(unwrap(F + 'json\n{"unexpected":true}\n' + F)), { unexpected: true });
});

test('row 25: non-string input is returned unchanged (identity)', () => {
  const obj = { a: 1 };
  assert.equal(unwrap(undefined), undefined);
  assert.equal(unwrap(null), null);
  assert.equal(unwrap(obj), obj);
  assert.equal(unwrap(42), 42);
});

test('row 26: the observed OU two-part form — each part (split at the unchanged sentinel) unwraps to its own payload', () => {
  const C = JSON.stringify({ results: [] }, null, 2);
  const O = JSON.stringify({ id: 't1', summary: 's', mentions: [] }, null, 2);
  const response = F + 'json\n' + C + '\n' + F + '\n\n@@OPEN_UNDERSTANDING@@\n' + F + 'json\n' + O + '\n' + F;
  const i = response.indexOf('@@OPEN_UNDERSTANDING@@');
  assert.equal(unwrap(response.slice(0, i)), C);
  assert.equal(unwrap(response.slice(i + '@@OPEN_UNDERSTANDING@@'.length)), O);
  assert.equal(unwrap(response), response, 'the whole two-part response is not a single envelope');
});

test('byte-for-byte inner payload: internal whitespace, blank lines, CRLF and backslashes are preserved; only the terminator CR is dropped', () => {
  const inner = '{\r\n  "a": "x\\ny",\r\n\r\n  "b": [1,  2]\t\r\n}';
  assert.equal(unwrap(F + 'json\r\n' + inner + '\r\n' + F), inner);
  const lfInner = '{\n  "a": 1\n}\n';
  assert.equal(unwrap(F + '\n' + lfInner + '\n' + F), lfInner, 'a trailing blank line inside the block is part of the payload');
  assert.equal(unwrap(F + 'json\n' + 'He said `hi` and ``ok``' + '\n' + F), 'He said `hi` and ``ok``', 'single and double backticks inside the payload are fine');
});

test('identity for every plain (unfenced) JSON response shape used across the interpreter suites', () => {
  const plains = [
    P, '{}', '[]', '', ' ', 'null', '{"tags":[]}', '{"relation":"CONFIRMED_CONFLICT"}',
    JSON.stringify({ results: [] }, null, 2), '  {"a":1}  \n', 'not json', '`{"a":1}`', '``' + P + '``'
  ];
  plains.forEach((p) => assert.equal(unwrap(p), p));
});

test('purity and determinism: same input gives the same output, the input string is not altered, and the function never throws', () => {
  const input = F + 'json\n' + P + '\n' + F;
  const copy = input.slice();
  assert.equal(unwrap(input), unwrap(input));
  assert.equal(input, copy);
  ['\u0000', '```', '````', '```\n```', '```json\n```\n```', '\n\n\n', F.repeat(50)].forEach((s) => assert.doesNotThrow(() => unwrap(s)));
});

test('API surface is exactly { unwrapSingleJsonFence }', () => {
  assert.deepEqual(Object.keys(Envelope), ['unwrapSingleJsonFence']);
});
