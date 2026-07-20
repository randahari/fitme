// C1-WP6 — js/coach/coachClient.js unit tests.
// Covers: request shape (model/max_tokens/system/messages), max_tokens varying by
// chatter, the injected callClaude closure, and trimmed-text-extraction from the
// response — matching the original coachMessage() exactly.
// Run with: node --test tests/coachClient.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CoachClient = require('../js/coach/coachClient.js');
const CoachPromptComposer = require('../js/coach/coachPromptComposer.js');

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };

function profile(overrides) {
  return Object.assign({ name: 'רן', coachStyle: 'mixed', coachChatter: 'balanced', goal: 'cut', goalKcal: 2000, weight: 80, streak: 3 }, overrides);
}

function setup(callClaudeImpl) {
  CoachPromptComposer.configure({ sessionLifecycle: { getGeneration: () => 1 }, goalLabels: GOAL_LABELS });
  CoachClient.configure({ callClaude: callClaudeImpl });
}

test('sendMessage sends model/max_tokens/system/messages matching the original coachMessage() request shape', async () => {
  let captured = null;
  setup(async (body) => { captured = body; return { content: [{ text: 'שלום!' }] }; });
  await CoachClient.sendMessage('בדיקה', profile(), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(captured.model, 'claude-sonnet-4-6');
  assert.equal(captured.max_tokens, 120);
  assert.equal(typeof captured.system, 'string');
  assert.deepEqual(captured.messages, [{ role: 'user', content: 'המצב כרגע: בדיקה\nכתוב הודעת מאמן אחת בהתאם לאופי ולאורך שהוגדרו.' }]);
});

test('sendMessage uses max_tokens 220 for "gentle" chatter, 120 otherwise', async () => {
  let captured = null;
  setup(async (body) => { captured = body; return { content: [{ text: 'x' }] }; });
  await CoachClient.sendMessage('ctx', profile({ coachChatter: 'gentle' }), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(captured.max_tokens, 220);
  await CoachClient.sendMessage('ctx', profile({ coachChatter: 'minimal' }), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(captured.max_tokens, 120);
});

test('sendMessage returns the trimmed first content text', async () => {
  setup(async () => ({ content: [{ text: '  הודעה עם רווחים  ' }] }));
  const result = await CoachClient.sendMessage('ctx', profile(), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(result, 'הודעה עם רווחים');
});

test('sendMessage returns empty string when the response has no content', async () => {
  setup(async () => ({}));
  const result = await CoachClient.sendMessage('ctx', profile(), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(result, '');
});

test('sendMessage uses the injected callClaude closure (never a bare captured reference)', async () => {
  let calls = 0;
  setup(async () => { calls++; return { content: [{ text: 'x' }] }; });
  await CoachClient.sendMessage('ctx', profile(), { meals: [], burned: 0, steps: 0 }, null);
  assert.equal(calls, 1);
});
