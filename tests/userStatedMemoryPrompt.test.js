// USM-001 — User-Stated Memory Prompt Projector tests (docs/specs/USM_001_SPEC_v1.0.md §10).
// Dependency-free: Node's built-in test runner + assert only, exercising the real
// js/userStatedMemoryPrompt.js module directly, mirroring the style of
// tests/derivedIntelligencePrompt.test.js.
// Run with: node --test tests/userStatedMemoryPrompt.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Prompt = require('../js/userStatedMemoryPrompt.js');

function fact(overrides) {
  return Object.assign({ id: 'm1', type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', updatedAt: 1000 }, overrides);
}
function fragment(facts, availability) {
  return { schemaVersion: 'coach-decision-system-user-stated-fragment/1.0', userId: 'u1', assembledAt: Date.now(), facts: facts || [], availability: availability || 'AVAILABLE' };
}

test('1. a fact renders under the fixed header, structurally distinct from derivedIntelligencePrompt.js and coachMemoryFragment()', () => {
  const out = Prompt.project(fragment([fact()]));
  assert.ok(out.indexOf('דברים שהמשתמש סיפר למאמן במפורש:') === 0);
  assert.ok(out.indexOf('אני שונא לרוץ') !== -1);
  assert.equal(out.indexOf('תובנות שנצפו בדפוסי השימוש שלך'), -1); // derivedIntelligencePrompt.js's own header
  assert.equal(out.indexOf('מה שלמדתי עליו עד כה'), -1); // legacy coachMemoryFragment()'s own header
});

test('2. a preference-shaped payload renders as "key: value"', () => {
  const out = Prompt.project(fragment([fact({ type: 'preference', payload: { key: 'workoutTime', value: 'morning' } })]));
  assert.ok(out.indexOf('workoutTime: morning') !== -1);
});

test('3. unavailable fragment -> "" (matches derivedIntelligencePrompt.js\'s own falsy-empty-string convention)', () => {
  assert.equal(Prompt.project(fragment([fact()], 'UNAVAILABLE')), '');
});

test('4. empty facts array -> ""', () => {
  assert.equal(Prompt.project(fragment([])), '');
});

test('5. missing/malformed fragment never throws, returns ""', () => {
  assert.equal(Prompt.project(null), '');
  assert.equal(Prompt.project(undefined), '');
  assert.equal(Prompt.project({}), '');
  assert.equal(Prompt.project({ availability: 'AVAILABLE', facts: 'not-an-array' }), '');
});

test('6. malformed individual payload is skipped silently, never fabricated, never throws', () => {
  const out = Prompt.project(fragment([fact({ payload: null }), fact({ id: 'm2', payload: {} }), fact({ id: 'm3' })]));
  // only the one well-formed fact (m3) should render
  const lines = out.split('\n').filter((l) => l.indexOf('- ') === 0);
  assert.equal(lines.length, 1);
});

test('7. deterministic: does not re-sort — reflects the input order verbatim', () => {
  const facts = [fact({ id: 'a', payload: { text: 'A' } }), fact({ id: 'b', payload: { text: 'B' } })];
  const out1 = Prompt.project(fragment(facts));
  const out2 = Prompt.project(fragment(facts));
  assert.equal(out1, out2);
  assert.ok(out1.indexOf('A') < out1.indexOf('B'));
});

test('8. MAX_FACTS bounds the number of rendered lines even when more facts are available', () => {
  const many = [];
  for (let i = 0; i < Prompt.MAX_FACTS + 5; i++) many.push(fact({ id: 'f' + i, payload: { text: 'fact number ' + i } }));
  const out = Prompt.project(fragment(many));
  const lines = out.split('\n').filter((l) => l.indexOf('- ') === 0);
  assert.ok(lines.length <= Prompt.MAX_FACTS);
});

test('9. MAX_CHARS bounds total output length (never overflows, truncates deterministically)', () => {
  const longFacts = [];
  for (let i = 0; i < 20; i++) longFacts.push(fact({ id: 'f' + i, payload: { text: 'x'.repeat(100) } }));
  const out = Prompt.project(fragment(longFacts));
  assert.ok(out.length <= Prompt.MAX_CHARS + 50); // small slack for the header itself
});

test('10. no persistence bookkeeping (created_at/status/_id/Firestore doc refs) ever leaks into the rendered text', () => {
  const out = Prompt.project(fragment([fact({ id: 'shouldnotappear-id-12345' })]));
  assert.equal(out.indexOf('shouldnotappear-id-12345'), -1);
  assert.equal(out.indexOf('created_at'), -1);
  assert.equal(out.indexOf('status'), -1);
});

test('11. no confidence score, no classification label, no Domain/Topic value appears in the rendered text (raw text is context, not a classifier output)', () => {
  const out = Prompt.project(fragment([fact({ confidence: 0.73 })]));
  assert.equal(out.indexOf('0.73'), -1);
  assert.equal(out.indexOf('NUTRITION'), -1);
  assert.equal(out.indexOf('FOOD_LOGGING'), -1);
});

test('12. MAX_FACTS/MAX_CHARS are exposed as documented, engineering-bounded parameters (not Product policy) — own, independent values, not a copy of derivedIntelligencePrompt.js\'s differently-scoped bounds', () => {
  const DerivedPrompt = require('../js/derivedIntelligencePrompt.js');
  assert.equal(typeof Prompt.MAX_FACTS, 'number');
  assert.equal(typeof Prompt.MAX_CHARS, 'number');
  assert.ok(Prompt.MAX_FACTS > 0 && Prompt.MAX_CHARS > 0);
  assert.notEqual(Prompt.MAX_CHARS, DerivedPrompt.MAX_CHARS, 'must own an independent bound, not silently inherit B5\'s MAX_ITEMS/MAX_CHARS (SPEC §10.3)');
});

test('13. module exposes both window.UserStatedMemoryPrompt and module.exports surfaces', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../js/userStatedMemoryPrompt.js'), 'utf8');
  assert.match(src, /window\.UserStatedMemoryPrompt = API/);
  assert.match(src, /module\.exports = API/);
});
