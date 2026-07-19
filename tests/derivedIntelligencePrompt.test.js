// B5 — Derived Intelligence Prompt Projector tests (SPEC §57.8).
// Dependency-free: Node's built-in test runner + assert only, exercising the real
// js/derivedIntelligencePrompt.js module directly. Items 67/68 (candidate/contradiction
// not projected) are integration-style — they combine the real consumer module with the
// real projector, since the projector itself has no lifecycle filter of its own; the
// omission guarantee comes from the consumer's eligibility/contradiction pipeline
// (already covered unit-by-unit in tests/derivedIntelligenceConsumer.test.js items 23/45).
// Run with: node --test tests/derivedIntelligencePrompt.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Prompt = require('../js/derivedIntelligencePrompt.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');

function sig(overrides) {
  return Object.assign({
    id: 'HABIT:weight:weigh-in', sourceType: 'HABIT', sourceId: 'weight:weigh-in',
    lifecycle: 'ACTIVE', qualifiers: []
  }, overrides);
}
const ABSOLUTE_WORDS = ['תמיד', 'חייב', 'עובדה'];

test('65. active signal uses non-absolute wording', () => {
  const out = Prompt.project({ signals: [sig({ lifecycle: 'ACTIVE' })] });
  assert.ok(out.indexOf('בדרך כלל') !== -1);
  ABSOLUTE_WORDS.forEach((w) => assert.equal(out.indexOf(w), -1, 'must not contain "' + w + '"'));
});

test('66. confirmed signal uses cautious wording', () => {
  const out = Prompt.project({ signals: [sig({ lifecycle: 'CONFIRMED' })] });
  assert.ok(out.indexOf('נראה') !== -1);
  ABSOLUTE_WORDS.forEach((w) => assert.equal(out.indexOf(w), -1, 'must not contain "' + w + '"'));
});

test('67. candidate not projected (integration: consumer excludes it, projector never sees it)', async () => {
  const TODAY = '2026-07-19';
  Consumer.configure({
    isSessionCurrent: () => true,
    readHabitSnapshot: async () => ({
      habits: [{
        id: 'weight:weigh-in', type: 'weight', key: 'weigh-in', confidence: 0.9, consistency: 0.9,
        status: 'candidate', firstObserved: TODAY, lastObserved: TODAY, period: 'daily', expectedIntervalDays: 2,
        sourceEvents: { count: 10, window: 42, dates: [] }
      }],
      habitsMeta: { version: 1 }
    }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { version: 1 } }),
    getLocalDate: () => TODAY, getWeekday: () => 0
  });
  const result = await Consumer.build({
    requestId: 'r1', consumer: 'AI_COACH_PROMPT', policyId: 'COACH_PROMPT_V1',
    session: { uid: 'u1', generation: 1 }, intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }
  });
  const out = Prompt.project(result.context);
  assert.equal(out, '');
});

test('68. contradiction not projected (integration: unresolved contradiction excluded under Coach policy)', async () => {
  const TODAY = '2026-07-19';
  function pattern(id) {
    return {
      id: id, category: 'weekday', confidence: 0.9, status: 'confirmed',
      firstSeen: TODAY, lastSeen: TODAY, period: 'weekly', expectedIntervalDays: 9, window: 90,
      evidenceCount: 8, opportunityCount: 10, sampleDates: []
    };
  }
  Consumer.configure({
    isSessionCurrent: () => true,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [pattern('weekday.active.5'), pattern('weekday.skip.5')], patternsMeta: { version: 1, sourceFingerprint: 'fp' } }),
    getLocalDate: () => TODAY, getWeekday: () => 0
  });
  const result = await Consumer.build({
    requestId: 'r1', consumer: 'AI_COACH_PROMPT', policyId: 'COACH_PROMPT_V1',
    session: { uid: 'u1', generation: 1 }, intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 }
  });
  assert.equal(result.context.contradictions.length, 1);
  const out = Prompt.project(result.context);
  assert.equal(out, '');
});

test('69. internal IDs not projected', () => {
  const out = Prompt.project({ signals: [sig()] });
  assert.equal(out.indexOf('HABIT:'), -1);
  assert.equal(out.indexOf('weight:weigh-in'), -1);
});

test('70. confidence decimals not projected', () => {
  const out = Prompt.project({ signals: [sig(), sig({ id: 'HABIT:measurement:measure', sourceId: 'measurement:measure', lifecycle: 'CONFIRMED' })] });
  assert.doesNotMatch(out, /\d\.\d/);
});

test('71. prompt budget enforced', () => {
  const ids = ['weight:weigh-in', 'measurement:measure', 'nutrition:log-consistency',
    'nutrition:meal:morning', 'nutrition:meal:midday', 'nutrition:meal:evening', 'nutrition:meal:night',
    'workout:weekday:0', 'workout:weekday:1', 'workout:weekday:2', 'workout:weekday:3', 'workout:weekday:4'];
  const signals = ids.map((id, i) => sig({ id: 'HABIT:' + id, sourceId: id, lifecycle: i % 2 ? 'ACTIVE' : 'CONFIRMED', qualifiers: [] }));
  const out = Prompt.project({ signals: signals });
  const lines = out.split('\n').filter((l) => l.indexOf('- ') === 0);
  assert.ok(lines.length <= Prompt.MAX_ITEMS);
  assert.ok(out.length <= Prompt.MAX_CHARS);
});

test('72. empty context produces empty fragment', () => {
  assert.equal(Prompt.project(null), '');
  assert.equal(Prompt.project({ signals: [] }), '');
  assert.equal(Prompt.project({}), '');
});

test('73. unsupported label omitted safely', () => {
  const unsupported = sig({ id: 'HABIT:unknown:x', sourceId: 'unknown:x' });
  const outAlone = Prompt.project({ signals: [unsupported] });
  assert.equal(outAlone, '');
  const outMixed = Prompt.project({ signals: [unsupported, sig()] });
  assert.notEqual(outMixed, '');
  assert.equal(outMixed.split('\n').filter((l) => l.indexOf('- ') === 0).length, 1);
});

test('74. Hebrew text remains plain and concise', () => {
  const out = Prompt.project({ signals: [sig(), sig({ id: 'HABIT:measurement:measure', sourceId: 'measurement:measure', lifecycle: 'CONFIRMED' })] });
  assert.doesNotMatch(out, /<[a-zA-Z]/);
  ['#', '*', '`', '['].forEach((ch) => assert.equal(out.indexOf(ch), -1, 'must not contain markdown char "' + ch + '"'));
  out.split('\n').forEach((line) => assert.ok(line.length < 150, 'line too long: ' + line));
});
