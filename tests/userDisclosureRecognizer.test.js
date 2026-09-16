// Friends Alpha Item 6 (USER_DISCLOSURE V1) — User Disclosure Recognizer unit tests. Exercises
// the real, unmodified module directly: a single, deterministic recognition gate over an
// already-classified Turn Understanding result. Never a Need, never a request — DUC-001 Decision
// 5B (statement != request) is never touched by this module or these tests.
// Run with: node --test tests/userDisclosureRecognizer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Recognizer = require('../js/coachDecisionSystem/userDisclosureRecognizer.js');

function classifiedTU(overrides) {
  return Object.assign({
    interpretationStatus: 'CLASSIFIED',
    currentStateStatement: { present: false, text: null },
    desireOnlyPresent: false,
    personalDisclosure: { present: false, category: null, text: null }
  }, overrides || {});
}

var TURN = { turnId: 't1', text: 'טקסט כלשהו' };

// ── Priority order: STATE, then DESIRE, then the Dimension-5 category ──

test('1. currentStateStatement.present:true recognizes category STATE', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({ currentStateStatement: { present: true, text: 'ישנתי גרוע' } }), {});
  assert.deepEqual(result, { recognized: true, turnId: 't1', category: 'STATE' });
});

test('2. desireOnlyPresent:true (with no currentStateStatement) recognizes category DESIRE', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({ desireOnlyPresent: true }), {});
  assert.deepEqual(result, { recognized: true, turnId: 't1', category: 'DESIRE' });
});

test('3. personalDisclosure.present:true (with neither STATE nor DESIRE) recognizes its own closed category', () => {
  const result1 = Recognizer.recognize(TURN, classifiedTU({ personalDisclosure: { present: true, category: 'CAPACITY_OR_CONSTRAINT', text: 'x' } }), {});
  assert.deepEqual(result1, { recognized: true, turnId: 't1', category: 'CAPACITY_OR_CONSTRAINT' });

  const result2 = Recognizer.recognize(TURN, classifiedTU({ personalDisclosure: { present: true, category: 'COACHING_RELEVANT_EXPERIENCE', text: 'x' } }), {});
  assert.deepEqual(result2, { recognized: true, turnId: 't1', category: 'COACHING_RELEVANT_EXPERIENCE' });
});

test('4. when STATE and personalDisclosure are both present, STATE wins (priority order, never both)', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({
    currentStateStatement: { present: true, text: 'ישנתי גרוע' },
    personalDisclosure: { present: true, category: 'CAPACITY_OR_CONSTRAINT', text: 'x' }
  }), {});
  assert.equal(result.category, 'STATE');
});

test('5. when DESIRE and personalDisclosure are both present, DESIRE wins', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({
    desireOnlyPresent: true,
    personalDisclosure: { present: true, category: 'COACHING_RELEVANT_EXPERIENCE', text: 'x' }
  }), {});
  assert.equal(result.category, 'DESIRE');
});

// ── No signal at all — never a general biography/personal-facts intake ──

test('6. no signal present at all returns null — never recognized regardless of content', () => {
  assert.equal(Recognizer.recognize(TURN, classifiedTU(), {}), null);
});

// ── Fails closed on interpretation failure (mirrors §17 Case C) ──

test('7. interpretationStatus !== CLASSIFIED returns null, even if the (untrustworthy) fields look like a signal', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({ interpretationStatus: 'FAILED', desireOnlyPresent: true }), {});
  assert.equal(result, null);
});

// ── Defensive input validation ──

test('8. a malformed turn (missing/empty turnId, non-object) returns null rather than throwing', () => {
  assert.equal(Recognizer.recognize(null, classifiedTU({ desireOnlyPresent: true }), {}), null);
  assert.equal(Recognizer.recognize({ turnId: '' }, classifiedTU({ desireOnlyPresent: true }), {}), null);
  assert.equal(Recognizer.recognize({}, classifiedTU({ desireOnlyPresent: true }), {}), null);
});

test('9. a non-object turnUnderstanding returns null rather than throwing', () => {
  assert.equal(Recognizer.recognize(TURN, null, {}), null);
  assert.equal(Recognizer.recognize(TURN, 'not an object', {}), null);
});

// ── Never a Need, never a DirectUserNeed shape ──

test('10. a recognized result is frozen and carries only {recognized, turnId, category} — never affirmativeRequest/DirectUserNeed fields', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({ desireOnlyPresent: true }), {});
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(Object.keys(result).sort(), ['category', 'recognized', 'turnId']);
});

// ── Independent of ConversationalNeedCreator / DUC-001 Decision 5B ──

test('11. recognition is entirely independent of any request signal — an affirmativeRequest field on turnUnderstanding is never read by this module', () => {
  const tu = classifiedTU({ desireOnlyPresent: true });
  tu.affirmativeRequest = { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' };
  const result = Recognizer.recognize(TURN, tu, {});
  assert.equal(result.category, 'DESIRE'); // unaffected by the presence of a request signal
});

test('12. pipelineContext is accepted but never required to be a particular shape (this module never reads it)', () => {
  const result = Recognizer.recognize(TURN, classifiedTU({ desireOnlyPresent: true }), null);
  assert.equal(result.recognized, true);
});
