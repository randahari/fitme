// OU-001 — OpenUnderstanding unit acceptance (docs/specs/OU_001_SPEC_v1.0.md §07–§12, §22).
// Exercises TurnUnderstandingInterpreter.understand()/classify() and ConversationalNeedCreator's
// projection with stubbed callClaude only — no live model. Pinned closed-classification values
// below were recorded on baseline commit 21f15de09246c6fb8c980f3715242db06cbc297d BEFORE any
// production change (OU-001 §22 "Pre-implementation baseline" (b)).
// Run with: node --test tests/ou001OpenUnderstanding.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Interpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const NeedCreator = require('../js/coachDecisionSystem/conversationalNeedCreator.js');
const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');

const I = Interpreter._internal;
const SENTINEL = '@@OPEN_UNDERSTANDING@@';

function e(id, o) {
  return Object.assign({
    id: id, affirmativeRequestPresent: false, domain: null, topic: null,
    currentStateStatementPresent: false, currentStateStatementText: null,
    negativeControlPresent: false, desireOnlyPresent: false,
    personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
  }, o || {});
}
const J = (entries) => JSON.stringify({ results: entries });
function resp(text, stopReason) { return Object.assign({ content: [{ type: 'text', text: text }] }, stopReason ? { stop_reason: stopReason } : {}); }
function stubResponse(response, capture) {
  Interpreter.configure({ callClaude: async (body) => { if (capture) capture.push(body); return response; } });
}
function withOpen(closedText, openObjOrText) {
  return closedText + '\n' + SENTINEL + '\n' + (typeof openObjOrText === 'string' ? openObjOrText : JSON.stringify(openObjOrText));
}
const TURN = { turnId: 't1', text: 'טקסט בדיקה' };

test.afterEach(() => { Interpreter.configure({ callClaude: null, timeoutMs: 8000 }); });

// ── Pre-implementation baseline (b): 20 closed fixtures and their pinned baseline classify() results ──
const CLOSED_FIXTURES = [
  ['all-false', J([e('t1')])],
  ['affirmative-valid-pair', J([e('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })])],
  ['affirmative-null-pair', J([e('t1', { affirmativeRequestPresent: true })])],
  ['affirmative-invalid-pair', J([e('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'PROTEIN_INTAKE' })])],
  ['domain-without-request', J([e('t1', { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })])],
  ['current-state', J([e('t1', { currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות' })])],
  ['current-state-missing-text', J([e('t1', { currentStateStatementPresent: true })])],
  ['negative-control', J([e('t1', { negativeControlPresent: true })])],
  ['desire-only', J([e('t1', { desireOnlyPresent: true })])],
  ['desire-and-request-conflict', J([e('t1', { desireOnlyPresent: true, affirmativeRequestPresent: true })])],
  ['disclosure-valid', J([e('t1', { personalDisclosurePresent: true, personalDisclosureCategory: 'CAPACITY_OR_CONSTRAINT', personalDisclosureText: 'נפצעתי בברך' })])],
  ['disclosure-invalid-category', J([e('t1', { personalDisclosurePresent: true, personalDisclosureCategory: 'BIOGRAPHY', personalDisclosureText: 'x' })])],
  ['non-boolean-field', J([e('t1', { negativeControlPresent: 'no' })])],
  ['duplicate-id', J([e('t1'), e('t1', { desireOnlyPresent: true })])],
  ['unknown-id-only', J([e('t9')])],
  ['extra-unknown-key', J([Object.assign(e('t1', { affirmativeRequestPresent: true }), { openUnderstanding: { summary: 'x' } })])],
  ['results-not-array', JSON.stringify({ results: {} })],
  ['not-json', 'I think the user wants to run.'],
  ['code-fenced', '```json\n' + J([e('t1')]) + '\n```'],
  ['empty-text', '']
];
const FAILED_BASELINE = {"interpretationStatus":"FAILED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}};
const PINNED_BASELINE = {
  "all-false": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "affirmative-valid-pair": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":true,"domain":"WORKOUT","topic":"WORKOUT_FREQUENCY"},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "affirmative-null-pair": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":true,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "affirmative-invalid-pair": FAILED_BASELINE,
  "domain-without-request": FAILED_BASELINE,
  "current-state": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":true,"text":"ישנתי 5 שעות"},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "current-state-missing-text": FAILED_BASELINE,
  "negative-control": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":true,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "desire-only": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":true,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "desire-and-request-conflict": FAILED_BASELINE,
  "disclosure-valid": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":true,"category":"CAPACITY_OR_CONSTRAINT","text":"נפצעתי בברך"}},
  "disclosure-invalid-category": FAILED_BASELINE,
  "non-boolean-field": FAILED_BASELINE,
  "duplicate-id": FAILED_BASELINE,
  "unknown-id-only": FAILED_BASELINE,
  "extra-unknown-key": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":true,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "results-not-array": FAILED_BASELINE,
  "not-json": FAILED_BASELINE,
  // MRE-001 §12.4 — the single authorized re-pin: a closed response wrapped in exactly one ```json
  // fence is now unwrapped by the shared envelope and classifies exactly as its inner payload
  // (the "all-false" entry above). Every other pinned value is unchanged.
  "code-fenced": {"interpretationStatus":"CLASSIFIED","affirmativeRequest":{"present":false,"domain":null,"topic":null},"currentStateStatement":{"present":false,"text":null},"negativeControlPresent":false,"desireOnlyPresent":false,"personalDisclosure":{"present":false,"category":null,"text":null}},
  "empty-text": FAILED_BASELINE
};
const CLOSED_KEYS = ['affirmativeRequest', 'currentStateStatement', 'desireOnlyPresent', 'interpretationStatus', 'negativeControlPresent', 'personalDisclosure'];
const VALID_OPEN = { id: 't1', summary: 'The user describes a test text.', mentions: ['טקסט בדיקה'] };

// ═══ Zero drift (closed) — AC-2 / AC-3 ═══
test('AC-2: for every pinned closed fixture, classify() equals the pinned baseline in all three forms (no sentinel; + valid open segment; + invalid open segment)', async () => {
  assert.equal(CLOSED_FIXTURES.length, Object.keys(PINNED_BASELINE).length);
  for (const [name, closedText] of CLOSED_FIXTURES) {
    const forms = [closedText, withOpen(closedText, VALID_OPEN), withOpen(closedText, '{not json')];
    for (const text of forms) {
      stubResponse(resp(text));
      const result = await Interpreter.classify(TURN);
      assert.deepEqual(result, PINNED_BASELINE[name], 'fixture ' + name + ' drifted for form: ' + text.slice(0, 60));
    }
  }
});

test('AC-3: classify() and understand().turnUnderstanding both carry exactly the six existing closed keys, and are deep-equal', async () => {
  stubResponse(resp(withOpen(J([e('t1', { affirmativeRequestPresent: true })]), VALID_OPEN)));
  const closed = await Interpreter.classify(TURN);
  const pair = await Interpreter.understand(TURN);
  assert.deepEqual(Object.keys(closed).sort(), CLOSED_KEYS);
  assert.deepEqual(Object.keys(pair.turnUnderstanding).sort(), CLOSED_KEYS);
  assert.deepEqual(pair.turnUnderstanding, closed);
  assert.deepEqual(Object.keys(pair).sort(), ['openUnderstanding', 'turnUnderstanding']);
});

// ═══ Poisoning / truncation / order — AC-4 … AC-9, Case O ═══
const VALID_CLOSED = J([e('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })]);

test('AC-4: every malformed open segment leaves the closed result deep-equal to the no-open-segment result, and openUnderstanding follows §10', async () => {
  stubResponse(resp(VALID_CLOSED));
  const reference = (await Interpreter.understand(TURN)).turnUnderstanding;
  const tooLong = 'x'.repeat(I.OU_SUMMARY_MAX_CHARS + 1);
  const cases = [
    ['invalid JSON', '{"id":"t1","summary":', null],
    ['wrong id', { id: 't2', summary: 's', mentions: [] }, null],
    ['missing summary', { id: 't1', mentions: [] }, null],
    ['empty summary', { id: 't1', summary: '   ', mentions: [] }, null],
    ['over-length summary', { id: 't1', summary: tooLong, mentions: [] }, null],
    ['non-array mentions', { id: 't1', summary: 's', mentions: 'טקסט' }, null],
    ['array top level', '[1,2,3]', null],
    ['non-string mentions dropped individually', { id: 't1', summary: 's', mentions: [42, { text: 'טקסט' }, 'טקסט'] }, 'VALID'],
    ['extra keys ignored', { id: 't1', summary: 's', mentions: [], shape: 'PLANNING', roughKind: 'food', confidence: 0.9 }, 'VALID'],
    ['model-supplied origin ignored', { id: 't1', summary: 's', mentions: ['טקסט'], origin: 'RECENT_USER_TURN' }, 'VALID']
  ];
  for (const [label, open, expectation] of cases) {
    stubResponse(resp(withOpen(VALID_CLOSED, open)));
    const pair = await Interpreter.understand(TURN);
    assert.deepEqual(pair.turnUnderstanding, reference, label + ': closed result was altered');
    if (expectation === null) {
      assert.equal(pair.openUnderstanding, null, label);
    } else {
      assert.notEqual(pair.openUnderstanding, null, label);
      assert.deepEqual(Object.keys(pair.openUnderstanding).sort(), ['interpretationAuthority', 'mentions', 'summary', 'turnId'], label);
      pair.openUnderstanding.mentions.forEach((m) => assert.equal(m.origin, 'CURRENT_TURN', label));
    }
  }
  // extra keys never leak into the result
  stubResponse(resp(withOpen(VALID_CLOSED, { id: 't1', summary: 's', mentions: [], shape: 'PLANNING', roughKind: 'food' })));
  const ou = (await Interpreter.understand(TURN)).openUnderstanding;
  assert.equal('shape' in ou, false);
  assert.equal('roughKind' in ou, false);
});

test('AC-5: valid closed + sentinel + partial open + stop_reason max_tokens → closed valid and unchanged, openUnderstanding null; a COMPLETE open segment with stop_reason max_tokens is also null', async () => {
  stubResponse(resp(VALID_CLOSED));
  const reference = (await Interpreter.understand(TURN)).turnUnderstanding;
  stubResponse(resp(VALID_CLOSED + '\n' + SENTINEL + '\n{"id":"t1","summ', 'max_tokens'));
  let pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, reference);
  assert.equal(pair.turnUnderstanding.interpretationStatus, 'CLASSIFIED');
  assert.equal(pair.openUnderstanding, null);
  stubResponse(resp(withOpen(VALID_CLOSED, VALID_OPEN), 'max_tokens'));
  pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, reference);
  assert.equal(pair.openUnderstanding, null);
});

test('AC-6: a closed segment truncated before the sentinel → FAILED, openUnderstanding null', async () => {
  stubResponse(resp(VALID_CLOSED.slice(0, 60), 'max_tokens'));
  const pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
});

test('AC-7: a FAILED closed result with a perfectly valid open segment → openUnderstanding null (one-way independence)', async () => {
  stubResponse(resp(withOpen(J([e('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'PROTEIN_INTAKE' })]), VALID_OPEN)));
  const pair = await Interpreter.understand(TURN);
  assert.equal(pair.turnUnderstanding.interpretationStatus, 'FAILED');
  assert.equal(pair.openUnderstanding, null);
});

test('AC-8: a timeout → FAILED, openUnderstanding null', async () => {
  Interpreter.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  const pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
  Interpreter.configure({ callClaude: async () => { throw new Error('transport'); }, timeoutMs: 8000 });
  const pair2 = await Interpreter.understand(TURN);
  assert.deepEqual(pair2.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair2.openUnderstanding, null);
  Interpreter.configure({ callClaude: null });
  const pair3 = await Interpreter.understand(TURN);
  assert.deepEqual(pair3.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair3.openUnderstanding, null);
});

test('AC-9: exactly one model call per understand(); body uses the exported max_tokens constant (≤ proxy clamp 2000), the unchanged model id, one message; timeout constant is 8000', async () => {
  const captured = [];
  stubResponse(resp(withOpen(VALID_CLOSED, VALID_OPEN)), captured);
  await Interpreter.understand(TURN);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].max_tokens, I.MAX_TOKENS);
  assert.ok(I.MAX_TOKENS <= 2000);
  assert.equal(captured[0].model, 'claude-haiku-4-5-20251001');
  assert.equal(captured[0].messages.length, 1);
  assert.equal(I.TIMEOUT_MS, 8000);
  const captured2 = [];
  stubResponse(resp(VALID_CLOSED), captured2);
  await Interpreter.classify(TURN);
  assert.equal(captured2.length, 1, 'classify() also makes exactly one call');
});

test('Case O: out-of-order output (open segment first) and a missing sentinel with trailing open JSON both fail closed', async () => {
  stubResponse(resp(JSON.stringify(VALID_OPEN) + '\n' + SENTINEL + '\n' + VALID_CLOSED));
  let pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
  stubResponse(resp(VALID_CLOSED + '\n' + JSON.stringify(VALID_OPEN)));
  pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
  stubResponse(resp('Sure! ' + withOpen(VALID_CLOSED, VALID_OPEN)));
  pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
});

test('an invalid turn never calls the model and yields FAILED/null', async () => {
  const captured = [];
  stubResponse(resp(VALID_CLOSED), captured);
  const pair = await Interpreter.understand({ text: 'no id' });
  assert.equal(captured.length, 0);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
});

// ═══ Open world — AC-10 ═══
function jsSourceText() {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.js')) out.push(fs.readFileSync(p, 'utf8').toLowerCase());
    }
  })(path.join(__dirname, '..', 'js'));
  return out.join('\n');
}

test('AC-10: an unfamiliar food, a new activity, a place and a personal relationship — none present anywhere in js/ — are understood with no registry, provider or vocabulary registered', async () => {
  const cases = [
    { turnId: 'ow-food', text: 'Can I eat kohlrabi miso fritters before training?', span: 'kohlrabi miso fritters' },
    { turnId: 'ow-activity', text: 'Is sepak takraw a good warm-up for me?', span: 'sepak takraw' },
    { turnId: 'ow-place', text: 'I am in Mykonos this week — should I train outdoors?', span: 'Mykonos' },
    { turnId: 'ow-relationship', text: 'My sister-in-law opened a pottery studio and I help there every morning; should I move my workouts?', span: 'my sister-in-law' }
  ];
  const source = jsSourceText();
  cases.forEach((c) => assert.equal(source.indexOf(c.span.toLowerCase()), -1, 'expected "' + c.span + '" to be absent from js/'));

  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  assert.equal(CapabilityRegistry.getAll().length, 0);
  assert.equal(ContextComposer.getAllFragmentProviderIds().length, 0);

  for (const c of cases) {
    stubResponse(resp(withOpen(J([e(c.turnId, { affirmativeRequestPresent: true })]), { id: c.turnId, summary: 'The user asks about ' + c.span + '.', mentions: [c.span] })));
    const pair = await Interpreter.understand({ turnId: c.turnId, text: c.text });
    assert.equal(pair.turnUnderstanding.interpretationStatus, 'CLASSIFIED');
    assert.notEqual(pair.openUnderstanding, null, c.turnId);
    assert.deepEqual(pair.openUnderstanding.mentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [[c.span, 'CURRENT_TURN', c.turnId]]);
    const needResult = NeedCreator.recognizeDirectUserNeed({ turnId: c.turnId, text: c.text }, pair.turnUnderstanding, { assembledAt: 1 }, pair.openUnderstanding);
    assert.equal(needResult.kind, 'UNSUPPORTED'); // nothing registered at all — the Need still exists and carries the projection
    assert.equal(needResult.need.openScopeDescription, pair.openUnderstanding.summary);
    assert.equal(needResult.need.openEntityMentions, pair.openUnderstanding.mentions);
  }
});

// ═══ Recent conversation and provenance — AC-11 … AC-17, C6 ═══
const MYKONOS_PRIOR = "I'm in Mykonos, slept five hours, and I'm thinking about going for a run before dinner.";
function rcc(items) { return { items: items, provenance: 'CONVERSATION_CONTEXT' }; }

test('AC-11: the Mykonos pair — "Do you think I should?" resolves its referents; mentions carry RECENT_USER_TURN with the prior turn id; the prior turn reached the prompt', async () => {
  const captured = [];
  const current = { turnId: 't-follow', text: 'Do you think I should?' };
  stubResponse(resp(withOpen(J([e('t-follow', { affirmativeRequestPresent: true })]), {
    id: 't-follow',
    summary: 'The user asks whether they should go for the run before dinner in Mykonos they mentioned, after about five hours of sleep.',
    mentions: ['Mykonos', 'slept five hours', 'before dinner']
  })), captured);
  const pair = await Interpreter.understand(current, rcc([{ turnId: 't-prior', userText: MYKONOS_PRIOR, assistantText: 'Noted — tell me more when you are ready.', submittedAt: 1 }]));
  assert.ok(captured[0].messages[0].content.indexOf(MYKONOS_PRIOR) >= 0);
  assert.deepEqual(pair.openUnderstanding.mentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [
    ['Mykonos', 'RECENT_USER_TURN', 't-prior'],
    ['slept five hours', 'RECENT_USER_TURN', 't-prior'],
    ['before dinner', 'RECENT_USER_TURN', 't-prior']
  ]);
  assert.match(pair.openUnderstanding.summary, /Mykonos/);
});

test('AC-12 / AC-13 / AC-14 / AC-15: assistant-only spans, current-turn precedence, newest prior turn, invented spans dropped, model-supplied provenance ignored', async () => {
  const context = rcc([
    { turnId: 'old', userText: 'I ran by the harbour yesterday.', assistantText: null, submittedAt: 1 },
    { turnId: 'new', userText: 'The harbour was windy again today.', assistantText: 'Try an easy 20-minute jog tomorrow.', submittedAt: 2 }
  ]);
  const current = { turnId: 't-now', text: 'Should I still go to the harbour?' };
  stubResponse(resp(withOpen(J([e('t-now', { affirmativeRequestPresent: true })]), {
    id: 't-now', summary: 'The user asks whether to keep going to the harbour.',
    mentions: ['easy 20-minute jog', 'harbour', 'windy', 'ran by the harbour', 'a volcano marathon', { text: 'windy', origin: 'CURRENT_TURN' }],
    origin: 'CURRENT_TURN', provenance: { windy: 'CURRENT_TURN' }
  })));
  const ou = (await Interpreter.understand(current, context)).openUnderstanding;
  assert.deepEqual(ou.mentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [
    ['easy 20-minute jog', 'RECENT_ASSISTANT_TURN', 'new'], // AC-12
    ['harbour', 'CURRENT_TURN', 't-now'],                    // AC-13 current turn wins over prior turns
    ['windy', 'RECENT_USER_TURN', 'new'],                     // AC-15 model's CURRENT_TURN claim ignored
    ['ran by the harbour', 'RECENT_USER_TURN', 'old']        // found only in the older prior turn
  ]);                                                          // AC-14 'a volcano marathon' and the object mention dropped
  // AC-13 (second half): a span present in two prior turns resolves to the newest.
  stubResponse(resp(withOpen(J([e('t-now', { affirmativeRequestPresent: true })]), { id: 't-now', summary: 's', mentions: ['the harbour'] })));
  const ou2 = (await Interpreter.understand({ turnId: 't-now', text: 'Should I go?' }, context)).openUnderstanding;
  assert.deepEqual(ou2.mentions.map((m) => [m.origin, m.sourceTurnId]), [['RECENT_USER_TURN', 'new']]);
});

test('AC-16: normalization — case, NFC/NFD, repeated whitespace — resolves identically; Hebrew spans resolve', async () => {
  const decomposed = 'café'; // NFD "café"
  const current = { turnId: 't-n', text: 'I slept   five\thours near the Café, ישנתי חמש שעות בלבד' };
  stubResponse(resp(withOpen(J([e('t-n')]), { id: 't-n', summary: 's', mentions: ['SLEPT FIVE HOURS', decomposed, 'ישנתי חמש שעות'] })));
  const ou = (await Interpreter.understand(current)).openUnderstanding;
  assert.deepEqual(ou.mentions.map((m) => [m.text, m.origin]), [
    ['SLEPT FIVE HOURS', 'CURRENT_TURN'], [decomposed, 'CURRENT_TURN'], ['ישנתי חמש שעות', 'CURRENT_TURN']
  ]);
});

test('AC-17: an over-length mention is dropped (never shortened); beyond the count cap the first are kept; duplicates removed keeping the first', async () => {
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet'];
  const long = 'z'.repeat(I.OU_MENTION_MAX_CHARS + 1);
  const current = { turnId: 't-c', text: words.join(' ') + ' ' + long };
  stubResponse(resp(withOpen(J([e('t-c')]), { id: 't-c', summary: 's', mentions: [long, 'alpha', 'ALPHA'].concat(words.slice(1)) })));
  const ou = (await Interpreter.understand(current)).openUnderstanding;
  assert.equal(ou.mentions.length, I.OU_MENTIONS_MAX_COUNT);
  assert.deepEqual(ou.mentions.map((m) => m.text), words.slice(0, I.OU_MENTIONS_MAX_COUNT));
  assert.equal(ou.mentions.some((m) => m.text.indexOf('zzz') >= 0), false);
});

test('C6: provenance searches only the bounded (2,000-char) turn text actually sent to the model', async () => {
  const text = 'a'.repeat(1990) + ' early-span ' + 'b'.repeat(100) + ' late-span-beyond-bound';
  const current = { turnId: 't-long', text: text };
  const captured = [];
  stubResponse(resp(withOpen(J([e('t-long')]), { id: 't-long', summary: 's', mentions: ['early-span', 'late-span-beyond-bound'] })), captured);
  const ou = (await Interpreter.understand(current)).openUnderstanding;
  assert.equal(captured[0].messages[0].content.indexOf('late-span-beyond-bound'), -1, 'sanity: the late span was never sent');
  assert.deepEqual(ou.mentions.map((m) => m.text), []); // 'early-' is cut at the bound too: only text actually supplied counts
  stubResponse(resp(withOpen(J([e('t-long')]), { id: 't-long', summary: 's', mentions: ['aaaa'] })));
  const ou2 = (await Interpreter.understand(current)).openUnderstanding;
  assert.deepEqual(ou2.mentions.map((m) => [m.text, m.origin]), [['aaaa', 'CURRENT_TURN']]);
});

// ═══ No taxonomy — AC-25 (runtime) / AC-26 ═══
test('AC-25 (runtime): OpenUnderstanding has exactly turnId/summary/mentions/interpretationAuthority; each mention exactly text/origin/sourceTurnId; origin among its three values', async () => {
  stubResponse(resp(withOpen(VALID_CLOSED, { id: 't1', summary: ' padded summary ', mentions: ['טקסט', 'בדיקה'] })));
  const ou = (await Interpreter.understand(TURN)).openUnderstanding;
  assert.deepEqual(Object.keys(ou).sort(), ['interpretationAuthority', 'mentions', 'summary', 'turnId']);
  assert.equal(ou.interpretationAuthority, 'DERIVED_INTERPRETATION');
  assert.equal(ou.summary, 'padded summary');
  assert.deepEqual([...I.OU_ORIGINS], ['CURRENT_TURN', 'RECENT_USER_TURN', 'RECENT_ASSISTANT_TURN']);
  ou.mentions.forEach((m) => {
    assert.deepEqual(Object.keys(m).sort(), ['origin', 'sourceTurnId', 'text']);
    assert.ok(I.OU_ORIGINS.indexOf(m.origin) >= 0);
  });
  assert.ok(Object.isFrozen(ou) && Object.isFrozen(ou.mentions) && ou.mentions.every(Object.isFrozen));
});

// Byte-for-byte copy of the closed schema text as it followed 'Respond with STRICT JSON only, no
// other text: ' at baseline commit 21f15de (turnUnderstandingInterpreter.js:171-178).
const BASELINE_CLOSED_SCHEMA_TEXT = '{"results":[{"id":"<id>",' +
  '"affirmativeRequestPresent":true|false,"domain":"<DOMAIN>"|null,"topic":"<TOPIC>"|null,' +
  '"currentStateStatementPresent":true|false,"currentStateStatementText":"<verbatim>"|null,' +
  '"negativeControlPresent":true|false,"desireOnlyPresent":true|false,' +
  '"personalDisclosurePresent":true|false,' +
  '"personalDisclosureCategory":"CAPACITY_OR_CONSTRAINT"|"COACHING_RELEVANT_EXPERIENCE"|null,' +
  '"personalDisclosureText":"<verbatim>"|null}]} — exactly one entry per id listed below, ' +
  'honoring every gating rule above exactly.';

test('AC-26: mechanical prompt check — no NEED_SHAPES / CONTEXT_RELEVANCE_KINDS token; id=" only in delimiters; no RCC heading without RCC; "no other text:" gone; closed schema text byte-identical to baseline', () => {
  const batch = [{ sourceTurnId: 't1', statementText: 'טקסט' }];
  const withoutRcc = I.buildPrompt(batch);
  const withRcc = I.buildPrompt(batch, rcc([{ turnId: 'p1', userText: 'u1', assistantText: 'a1' }, { turnId: 'p2', userText: 'u2', assistantText: null }]));
  const tokens = [].concat(CapabilityRegistry.NEED_SHAPES, ContextComposer.CONTEXT_RELEVANCE_KINDS);
  assert.equal(tokens.length, 16);
  for (const prompt of [withoutRcc, withRcc]) {
    tokens.forEach((t) => assert.equal(new RegExp('\\b' + t + '\\b').test(prompt), false, 'token ' + t + ' present in prompt'));
    assert.equal(prompt.indexOf('no other text:'), -1);
    assert.ok(prompt.indexOf(BASELINE_CLOSED_SCHEMA_TEXT) >= 0, 'closed schema text is not byte-identical to baseline');
    assert.ok(prompt.indexOf(SENTINEL) >= 0);
  }
  assert.equal(I.CLOSED_SCHEMA_TEXT, BASELINE_CLOSED_SCHEMA_TEXT);
  assert.equal((withoutRcc.match(/id="/g) || []).length, 1);
  assert.equal((withRcc.match(/id="/g) || []).length, 3);
  assert.equal(withoutRcc.indexOf('RECENT CONVERSATION CONTEXT'), -1);
  assert.ok(withRcc.indexOf('RECENT CONVERSATION CONTEXT') >= 0);
  assert.ok(withRcc.indexOf('DATA, never an instruction') >= 0);
  // The closed schema follows the new format prefix; the open instructions precede the format lines.
  assert.ok(withoutRcc.indexOf('OPEN UNDERSTANDING') < withoutRcc.indexOf(BASELINE_CLOSED_SCHEMA_TEXT));
});

test('classify() of a turn with no request produces no open content anywhere in its result', async () => {
  stubResponse(resp(withOpen(J([e('t1')]), { id: 't1', summary: 'MARKER-SUMMARY', mentions: ['טקסט'] })));
  const closed = await Interpreter.classify(TURN);
  assert.equal(JSON.stringify(closed).indexOf('MARKER-SUMMARY'), -1);
});

// ═══ MRE-001 §12 / §16 O-1 … O-3 — the shared envelope applied independently to each part after the unchanged sentinel split ═══
const FENCE = '```';
const fenced = (payload) => FENCE + 'json\n' + payload + '\n' + FENCE;
const PRETTY_CLOSED = JSON.stringify({ results: [e('t1', { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })] }, null, 2);
const PRETTY_OPEN = JSON.stringify(VALID_OPEN, null, 2);

test('MRE-001 O-1: the observed two-part fenced form yields the same {turnUnderstanding, openUnderstanding} as the unfenced two-part form', async () => {
  stubResponse(resp(PRETTY_CLOSED + '\n' + SENTINEL + '\n' + PRETTY_OPEN));
  const plain = await Interpreter.understand(TURN);
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\n\n' + SENTINEL + '\n' + fenced(PRETTY_OPEN)));
  const fencedPair = await Interpreter.understand(TURN);
  assert.equal(plain.turnUnderstanding.interpretationStatus, 'CLASSIFIED');
  assert.notEqual(plain.openUnderstanding, null);
  assert.deepEqual(fencedPair, plain);
  // A fenced closed part with an unfenced open part (and vice versa) also matches.
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\n' + SENTINEL + '\n' + PRETTY_OPEN));
  assert.deepEqual(await Interpreter.understand(TURN), plain);
  stubResponse(resp(PRETTY_CLOSED + '\n' + SENTINEL + '\n' + fenced(PRETTY_OPEN)));
  assert.deepEqual(await Interpreter.understand(TURN), plain);
});

test('MRE-001 O-2: a fenced closed part plus a truncated fenced open part with stop_reason max_tokens → closed valid and unchanged, open null', async () => {
  stubResponse(resp(PRETTY_CLOSED));
  const reference = (await Interpreter.understand(TURN)).turnUnderstanding;
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\n\n' + SENTINEL + '\n' + FENCE + 'json\n{\n  "id": "t1",\n  "summ', 'max_tokens'));
  const pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, reference);
  assert.equal(pair.turnUnderstanding.interpretationStatus, 'CLASSIFIED');
  assert.equal(pair.openUnderstanding, null);
  // A truncated open fence without max_tokens is a rejected envelope — the open part is null.
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\n' + SENTINEL + '\n' + FENCE + 'json\n' + PRETTY_OPEN + '\n``'));
  const pair2 = await Interpreter.understand(TURN);
  assert.deepEqual(pair2.turnUnderstanding, reference);
  assert.equal(pair2.openUnderstanding, null);
});

test('MRE-001 O-3: a fenced closed part followed by prose, or two closed fences, fails closed (FAILED, open null)', async () => {
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\nHope this helps!\n' + SENTINEL + '\n' + fenced(PRETTY_OPEN)));
  let pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
  stubResponse(resp(fenced(PRETTY_CLOSED) + '\n' + fenced(PRETTY_CLOSED) + '\n' + SENTINEL + '\n' + fenced(PRETTY_OPEN)));
  pair = await Interpreter.understand(TURN);
  assert.deepEqual(pair.turnUnderstanding, FAILED_BASELINE);
  assert.equal(pair.openUnderstanding, null);
});

// ═══ OU-001 AC-CAL-4 prompt-quality amendment (OU_001_SPEC_v1.0.md §07 change 2, §22 AC-32) ═══
// Deterministic tests can pin only the instruction the model receives and how the unchanged
// validator/provenance treats outputs; real-model behavior is measured by the AC-CAL calibration.
function openInstructionLine(rccValue) {
  return I.buildPrompt([{ sourceTurnId: 't1', statementText: 'x' }], rccValue).split('\n').find((l) => l.indexOf('OPEN UNDERSTANDING') === 0);
}

test('AC-32 (1/2): the open instruction requires the summary in the language of the current turn — Hebrew for a Hebrew turn, English for an English turn — regardless of instruction/earlier-turn language', () => {
  const line = openInstructionLine();
  assert.match(line, /Write the summary in the language of the turn itself/);
  assert.match(line, /a Hebrew turn gets a Hebrew summary, an English turn gets an English summary/);
  assert.match(line, /even though these instructions and any earlier turns may be in another language/);
  assert.equal(line.indexOf('in the same language as the turn,'), -1, 'the weaker pre-amendment wording is gone');
});

test('AC-32 (1/2): Hebrew and English summaries pass the unchanged validator exactly as written (no translation, no language rewriting)', async () => {
  stubResponse(resp(withOpen(J([e('t1')]), { id: 't1', summary: 'המשתמש ישן חמש שעות.', mentions: [] })));
  assert.equal((await Interpreter.understand({ turnId: 't1', text: 'ישנתי חמש שעות' })).openUnderstanding.summary, 'המשתמש ישן חמש שעות.');
  stubResponse(resp(withOpen(J([e('t1')]), { id: 't1', summary: 'The user slept five hours.', mentions: [] })));
  assert.equal((await Interpreter.understand({ turnId: 't1', text: 'I slept five hours' })).openUnderstanding.summary, 'The user slept five hours.');
});

test('AC-32 (3/4): the open instruction forbids unstated facts — no background knowledge about anything mentioned, no assumptions about the user\'s circumstances, no unexpressed implications', () => {
  const line = openInstructionLine();
  assert.match(line, /Include only meaning the user actually expressed in the turn, plus what earlier turns of this conversation are needed to resolve a reference in it/);
  assert.match(line, /never add background knowledge about anything mentioned, assumptions about the user's circumstances, or implications the user did not express/);
  assert.match(line, /this is a record of what the user communicated, not reasoning about it/);
});

test('AC-32 (5): list items become separate short verbatim mentions — the instruction says so, and provenance accepts each list item while a clause-length span is dropped by the unchanged 48-char cap', async () => {
  const line = openInstructionLine();
  assert.match(line, /each one short name or phrase copied exactly/);
  assert.match(line, /When several things are listed together, give each one as its own separate mention, never one long span containing several of them/);
  const turn = { turnId: 't-list', text: 'I train with my cousin Rafa, my running club Os Galgos, and a coach named Inês.' };
  stubResponse(resp(withOpen(J([e('t-list')]), { id: 't-list', summary: 'The user names who they train with.', mentions: ['Rafa', 'Os Galgos', 'Inês', 'my cousin Rafa, my running club Os Galgos, and a coach named Inês'] })));
  const ou = (await Interpreter.understand(turn)).openUnderstanding;
  assert.deepEqual(ou.mentions.map((m) => [m.text, m.origin]), [['Rafa', 'CURRENT_TURN'], ['Os Galgos', 'CURRENT_TURN'], ['Inês', 'CURRENT_TURN']]);
});

test('AC-32 (6): a referring turn\'s mentions are verbatim earlier-turn spans, which provenance accepts as RECENT_USER_TURN; a reconstructed phrase found nowhere is dropped', async () => {
  const line = openInstructionLine();
  assert.match(line, /from the turn itself or, when the turn refers back to an earlier turn of this conversation, from that earlier turn/);
  assert.match(line, /never write a mention that does not appear word for word in the conversation/);
  const prior = "I'm in Mykonos, slept five hours, and I'm thinking about going for a run before dinner.";
  stubResponse(resp(withOpen(J([e('t-ref', { affirmativeRequestPresent: true })]), {
    id: 't-ref', summary: 'The user asks whether to go for the run before dinner they mentioned, after five hours of sleep.',
    mentions: ["I'm in Mykonos", 'going for a run before dinner', 'should I?', 'run in Mykonos after little sleep']
  })));
  const ou = (await Interpreter.understand({ turnId: 't-ref', text: 'Do you think I should?' }, { items: [{ turnId: 't-prior', userText: prior, assistantText: 'Thanks for telling me.' }], provenance: 'CONVERSATION_CONTEXT' })).openUnderstanding;
  assert.deepEqual(ou.mentions.map((m) => [m.text, m.origin, m.sourceTurnId]), [
    ["I'm in Mykonos", 'RECENT_USER_TURN', 't-prior'],
    ['going for a run before dinner', 'RECENT_USER_TURN', 't-prior']
  ]);
});

test('AC-32 (7): the amendment changed only the open instruction line — every other prompt line (closed dimensions, schema, format, delimiting) is unchanged, and the open line still enumerates no kind/type/category', () => {
  const line = openInstructionLine();
  const prompt = I.buildPrompt([{ sourceTurnId: 't1', statementText: 'x' }]);
  assert.equal(prompt.split('\n').filter((l) => l.indexOf('OPEN UNDERSTANDING') === 0).length, 1);
  assert.ok(prompt.indexOf(BASELINE_CLOSED_SCHEMA_TEXT) >= 0);
  assert.equal(/\b(kind|type|category|categories|types|kinds)\b/i.test(line), false, 'no mention kind/type/category wording');
  assert.equal(line.indexOf('RECENT CONVERSATION CONTEXT'), -1);
  assert.equal(line.indexOf('id="'), -1);
});
