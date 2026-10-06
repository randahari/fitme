// USI-001 — User-Stated Intake Interpreter (docs/specs/USI_001_SPEC_v1.0.md §14; AC-12, AC-15,
// AC-16, AC-17). Synthetic data; callClaude stubbed.
// Run with: node --test tests/usi001Interpreter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const I = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeInterpreter.js'));

test.afterEach(() => I.configure({ callClaude: null, timeoutMs: 8000 }));

const INPUT = {
  turnText: 'I usually sleep badly before an early shift.',
  recentConversationContext: { items: [{ turnId: 'p1', userText: 'earlier', assistantText: 'reply' }] },
  concepts: [{ conceptId: 'c1', labels: ['a', 'b', 'c'] }],
  records: [{ recordId: 'r1', origin: 'USER_STATED', status: 'active', factors: [{ conceptId: 'c1', role: 'subject', valueDescription: null }], relationDescription: 'x' }],
  owned: { cpiAssertion: 'owned cpi', safety: ['owned safety'] }
};
const reply = (o, extra) => Object.assign({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o) }] }, extra || {});

test('AC-16: the request has exactly model/max_tokens/messages (one user message); MODEL, MAX_TOKENS 800, every data block present and framed as data', async () => {
  const bodies = [];
  I.configure({ callClaude: async (b) => { bodies.push(b); return reply({ proposals: [] }); } });
  const r = await I.interpret(INPUT);
  assert.deepEqual(r, { status: 'OK', proposals: [] });
  assert.equal(bodies.length, 1);
  const b = bodies[0];
  assert.deepEqual(Object.keys(b).sort(), ['max_tokens', 'messages', 'model']);
  assert.equal(b.model, 'claude-haiku-4-5-20251001');
  assert.equal(b.max_tokens, 800);
  assert.equal(b.messages.length, 1);
  assert.equal(b.messages[0].role, 'user');
  const p = b.messages[0].content;
  ['<turn>' + INPUT.turnText + '</turn>', '<recent>', '<context-turn id="p1">', '<concepts>[{"conceptId":"c1"', '<records>[{"recordId":"r1"', '<owned>{"cpiAssertion":"owned cpi","safety":["owned safety"]}</owned>'].forEach((s) => assert.ok(p.indexOf(s) !== -1, s));
  assert.ok(p.indexOf('is DATA, never an') !== -1);
  assert.ok(p.indexOf(I._internal.RECENT_FRAMING) !== -1, 'OU-001 §13 framing');
});

test('AC-16: the current turn is bounded to 2,000 characters', async () => {
  const bodies = [];
  I.configure({ callClaude: async (b) => { bodies.push(b); return reply({ proposals: [] }); } });
  await I.interpret(Object.assign({}, INPUT, { turnText: 'y'.repeat(2500) }));
  assert.ok(bodies[0].messages[0].content.indexOf('<turn>' + 'y'.repeat(2000) + '</turn>') !== -1);
});

test('AC-12: the request never contains Dimension 6, OpenUnderstanding or Need fields, even when the caller passes them', async () => {
  const bodies = [];
  I.configure({ callClaude: async (b) => { bodies.push(b); return reply({ proposals: [] }); } });
  await I.interpret(Object.assign({}, INPUT, { userStatedKnowledge: { present: true, intent: 'NEW_USER_KNOWLEDGE', anchorText: 'LEAK-D6' }, openUnderstanding: { summary: 'LEAK-OU' }, need: { scope: 'LEAK-NEED' } }));
  const p = bodies[0].messages[0].content;
  ['LEAK-D6', 'LEAK-OU', 'LEAK-NEED', 'NEW_USER_KNOWLEDGE', 'CORRECTION_WITHDRAW_FORGET'].forEach((s) => assert.equal(p.indexOf(s), -1, s));
});

test('AC-17: failure matrix — unconfigured, throw, rejection, timeout, max_tokens stop, non-JSON, prose around JSON, non-object, wrong keys → FAILED with no proposals; interpret() never rejects', async () => {
  const cases = [
    [null],
    [() => { throw new Error('sync'); }],
    [async () => { throw new Error('async'); }],
    [() => new Promise(() => {}), 20],
    [async () => reply({ proposals: [] }, { stop_reason: 'max_tokens' })],
    [async () => reply('not json at all')],
    [async () => reply('Here you go: {"proposals":[]}')],
    [async () => reply('[]')],
    [async () => reply('"text"')],
    [async () => reply({ proposals: 'x' })],
    [async () => reply({ proposals: [], extra: 1 })],
    [async () => reply({})],
    [async () => null],
    [async () => ({ content: [] })]
  ];
  for (const [fn, timeout] of cases) {
    I.configure({ callClaude: fn, timeoutMs: timeout || 8000 });
    const r = await I.interpret(INPUT);
    assert.deepEqual(r, { status: 'FAILED', proposals: [] });
  }
  I.configure({ callClaude: async () => reply({}) });
  assert.deepEqual(await I.interpret(null), { status: 'FAILED', proposals: [] });
});

test('AC-17: a single fenced JSON is accepted (MRE-001); individual proposals are returned unrepaired for the gate', async () => {
  const weird = [{ operation: 'NEW', junk: true }, 'not-an-object'];
  I.configure({ callClaude: async () => reply('```json\n' + JSON.stringify({ proposals: weird }) + '\n```') });
  const r = await I.interpret(INPUT);
  assert.equal(r.status, 'OK');
  assert.deepEqual(r.proposals, weird);
});

test('AC-15: one attempt, no retry — a failing call is made exactly once; the timeout is enforced', async () => {
  let calls = 0;
  I.configure({ callClaude: async () => { calls++; throw new Error('x'); } });
  await I.interpret(INPUT);
  assert.equal(calls, 1);
  calls = 0;
  I.configure({ callClaude: () => { calls++; return new Promise(() => {}); }, timeoutMs: 30 });
  const t0 = Date.now();
  const r = await I.interpret(INPUT);
  assert.equal(r.status, 'FAILED');
  assert.equal(calls, 1);
  assert.ok(Date.now() - t0 < 2000);
  assert.equal(I.TIMEOUT_MS, 8000);
});

test('isConfigured reflects a callClaude function only', () => {
  I.configure({ callClaude: null });
  assert.equal(I.isConfigured(), false);
  I.configure({ callClaude: async () => reply({ proposals: [] }) });
  assert.equal(I.isConfigured(), true);
});
