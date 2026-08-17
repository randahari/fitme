// Expression WP13 — conformance tests for the deterministic qualitative-verification test double
// (tests/fixtures/expressionQualitativeVerificationTestDouble.js), resolving `EXP-OD-11`. Each
// checker is proven to actually discriminate: a hand-written violating example is flagged, a
// hand-written compliant example (drawn from wording already used elsewhere in this repository's
// own REFUSAL/ESCALATION/disclosure test fixtures) is not.
// Run with: node --test tests/expressionQualitativeVerificationTestDouble.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Checker = require('./fixtures/expressionQualitativeVerificationTestDouble.js');

test('containsBlameLanguage flags blame/shame/failure language attributed to the user (EXP-59/EXP-60)', () => {
  assert.equal(Checker.containsBlameLanguage('נכשלת שוב השבוע, זו הבעיה שלך.'), true);
});
test('containsBlameLanguage does not flag a compliant REFUSAL example attributing the limitation to the situation, not the user', () => {
  assert.equal(Checker.containsBlameLanguage('אני לא יכול למלא את הבקשה הזו, אבל אני כאן להמשיך ללוות אותך.'), false);
});

test('containsComparisonLanguage flags comparison/measurement/judgment of the user against others (EXP-62)', () => {
  assert.equal(Checker.containsComparisonLanguage('ההתקדמות שלך פחות טוב מ90% מהמשתמשים האחרים.'), true);
});
test('containsComparisonLanguage does not flag an ordinary, non-comparative coaching statement', () => {
  assert.equal(Checker.containsComparisonLanguage('יש לך כמה כיוונים טובים כאן — תבחר את מה שמתאים לך.'), false);
});

test('containsDiagnosisLanguage flags a named medical/psychological condition or a diagnostic act (EXP-64)', () => {
  assert.equal(Checker.containsDiagnosisLanguage('נראה שיש לך תסמינים של דיכאון קליני.'), true);
});
test('containsDiagnosisLanguage does not flag calm encouragement toward professional support without naming a condition', () => {
  assert.equal(Checker.containsDiagnosisLanguage('חשוב שתדבר על זה עם איש מקצוע שיכול לעזור.'), false);
});

test('hasAlarmRegister flags a dramatic/alarm-register rendering (EXP-65)', () => {
  assert.equal(Checker.hasAlarmRegister('זה מצב חירום!!! עליך לפעול מיד!!!'), true);
});
test('hasAlarmRegister does not flag the same, single, calm coaching register ESCALATION must otherwise use', () => {
  assert.equal(Checker.hasAlarmRegister('אני ממשיך ללוות אותך, וחשוב שתפנה גם לתמיכה מקצועית.'), false);
});

test('impliesThirdPartyContact flags a statement implying FITME contacted or will contact a healthcare provider/third party (EXP-67)', () => {
  assert.equal(Checker.impliesThirdPartyContact('פנינו לרופא שלך בשמך כדי לעדכן אותו.'), true);
});
test('impliesThirdPartyContact does not flag the coach affirming it continues to accompany the user itself', () => {
  assert.equal(Checker.impliesThirdPartyContact('אני ממשיך ללוות אותך לאורך הדרך.'), false);
});

test('leaksInternalImplementationDetail flags a rendering that names an internal component/disposition/reasonCode (EXP-71)', () => {
  assert.equal(Checker.leaksInternalImplementationDetail('הבקשה שונתה בגלל disposition MODIFIED מה-Safety Layer.'), true);
});
test('leaksInternalImplementationDetail does not flag ordinary coach-voice wording naming no internal identifier', () => {
  assert.equal(Checker.leaksInternalImplementationDetail('התאמתי מעט את ההצעה כדי שתתאים לך יותר.'), false);
});

// ── Every checker never throws on empty/malformed input, matching this repository's established
// defensive-input discipline for every other test-only double. ──

test('every checker function returns false, never throws, for null/undefined/empty input', () => {
  [Checker.containsBlameLanguage, Checker.containsComparisonLanguage, Checker.containsDiagnosisLanguage, Checker.hasAlarmRegister, Checker.impliesThirdPartyContact, Checker.leaksInternalImplementationDetail].forEach((fn) => {
    assert.doesNotThrow(() => fn(null));
    assert.doesNotThrow(() => fn(undefined));
    assert.equal(fn(''), false);
  });
});
