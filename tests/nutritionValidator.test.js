// REM-001 §21 Automated Test Requirements + §22 Manual Acceptance Scenarios (encoded as automated tests).
// Dependency-free: uses only Node's built-in test runner and assert module.
// Inputs use FitMe's existing item field names (protein/carbs/fat/amount/qty) — ER-005 mapping
// happens inside normalizeNutritionCandidate itself, exactly as a real call site would pass them.
// Run with: node --test tests/nutritionValidator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeNutritionCandidate, validateNutritionCandidate, validateNutritionMeal } = require('../js/nutritionValidator.js');

function validate(raw, sourceType, options) {
  const candidate = normalizeNutritionCandidate(raw, sourceType);
  return validateNutritionCandidate(candidate, options);
}

// 1. Valid normal meal
test('1. valid normal meal -> VALID', () => {
  const r = validate({ name: 'עוף בגריל', amount: 200, unit: 'גרם', kcal: 350, protein: 40, carbs: 5, fat: 18 }, 'photo');
  assert.equal(r.status, 'VALID');
  assert.equal(r.errors.length, 0);
});

// 2. Numeric strings normalized correctly
test('2. numeric strings normalized to finite numbers', () => {
  const r = validate({ name: 'אורז', amount: '150', kcal: '200', protein: '4', carbs: '45', fat: '1' }, 'text');
  assert.equal(r.status, 'VALID');
  assert.equal(r.normalized.kcal, 200);
  assert.equal(typeof r.normalized.kcal, 'number');
});

// 3. Missing calories rejected
test('3. missing kcal -> REJECTED (KCAL_REQUIRED)', () => {
  const r = validate({ name: 'מנה', protein: 10, carbs: 10, fat: 10 }, 'text');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'KCAL_REQUIRED'));
});

// 4. Negative calories rejected
test('4. negative kcal -> REJECTED (KCAL_NEGATIVE)', () => {
  const r = validate({ name: 'מנה', kcal: -400, protein: 25, carbs: 40, fat: 20 }, 'photo');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'KCAL_NEGATIVE'));
});

// 5. NaN rejected
test('5. NaN kcal -> REJECTED (KCAL_NON_FINITE), never coerced to 0', () => {
  const r = validate({ name: 'מנה', kcal: 'unknown', protein: '25', carbs: '40', fat: '20' }, 'photo');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'KCAL_NON_FINITE'));
  assert.notEqual(r.normalized.kcal, 0);
});

// 6. Saturated fat greater than fat rejected
test('6. saturatedFat > fat -> REJECTED (SATURATED_GT_FAT)', () => {
  const r = validate({ name: 'מנה', kcal: 500, protein: 20, carbs: 20, fat: 10, saturatedFat: 15 }, 'label');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'SATURATED_GT_FAT'));
});

// 7. Sugar greater than carbohydrates rejected
test('7. sugar > carbs -> REJECTED (SUGAR_GT_CARBS)', () => {
  const r = validate({ name: 'מנה', kcal: 400, protein: 5, carbs: 20, fat: 10, sugar: 30 }, 'label');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'SUGAR_GT_CARBS'));
});

// 8. Fiber greater than carbohydrates rejected
test('8. fiber > carbs -> REJECTED (FIBER_GT_CARBS)', () => {
  const r = validate({ name: 'מנה', kcal: 400, protein: 5, carbs: 10, fat: 10, fiber: 15 }, 'label');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'FIBER_GT_CARBS'));
});

// 9. Material macro-calorie mismatch requires review
test('9. material macro/kcal mismatch -> REVIEW_REQUIRED (MACRO_KCAL_MISMATCH)', () => {
  const r = validate({ name: 'מנה', kcal: 150, protein: 50, carbs: 70, fat: 30 }, 'photo');
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.ok(r.errors.some(e => e.code === 'MACRO_KCAL_MISMATCH'));
});

// 10. Small rounding mismatch remains valid
test('10. small rounding mismatch stays VALID', () => {
  // calculatedMacroKcal = 40*4 + 68*4 + 20*9 = 160+272+180 = 612; kcal=620 -> diff=8 (<=120) -> VALID
  const r = validate({ name: 'מנה', kcal: 620, protein: 40, carbs: 68, fat: 20 }, 'photo');
  assert.equal(r.status, 'VALID');
});

// 11. Missing macros require review
test('11. missing macros -> REVIEW_REQUIRED (MACROS_INCOMPLETE)', () => {
  const r = validate({ name: 'מנה', kcal: 300, protein: 10 }, 'text');
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.ok(r.errors.some(e => e.code === 'MACROS_INCOMPLETE'));
});

test('11b. missing macros with allowPartialMacros=true -> not incomplete', () => {
  const r = validate({ name: 'תווית חלקית', kcal: 300, protein: 10 }, 'label', { allowPartialMacros: true });
  assert.ok(!r.errors.some(e => e.code === 'MACROS_INCOMPLETE'));
});

// 12. Zero calories with positive macros requires review
test('12. zero kcal with positive macros -> REVIEW_REQUIRED (ZERO_KCAL_WITH_MACROS)', () => {
  const r = validate({ name: 'מנה', kcal: 0, protein: 10, carbs: 5, fat: 2 }, 'photo');
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.ok(r.errors.some(e => e.code === 'ZERO_KCAL_WITH_MACROS'));
});

test('12b. positive kcal with all-zero macros -> REVIEW_REQUIRED (POSITIVE_KCAL_ALL_MACROS_ZERO)', () => {
  const r = validate({ name: 'מנה', kcal: 150, protein: 0, carbs: 0, fat: 0 }, 'photo');
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.ok(r.errors.some(e => e.code === 'POSITIVE_KCAL_ALL_MACROS_ZERO'));
});

// 13. Invalid input is never converted to zero
test('13. invalid/non-numeric input never becomes 0', () => {
  const r = validate({ name: 'מנה', kcal: 'garbage', protein: 'xx', carbs: 10, fat: 5 }, 'text');
  assert.notEqual(r.normalized.kcal, 0);
  assert.notEqual(r.normalized.proteinG, 0);
  assert.equal(r.status, 'REJECTED');
});

// 14. Same input always returns the same result (determinism)
test('14. deterministic: same input -> same output', () => {
  const input = { name: 'מנה', kcal: 400, protein: 20, carbs: 30, fat: 15 };
  const r1 = validate(input, 'photo');
  const r2 = validate(input, 'photo');
  assert.deepEqual(r1, r2);
});

// 15. REVIEW_REQUIRED and REJECTED objects never reach persistence — verified at the orchestration level:
// a meal with one rejected item must yield overallStatus REJECTED (never silently proceed to VALID).
test('15. multi-item meal: one rejected item blocks the whole meal from VALID/persist-eligible status', () => {
  const items = [
    { name: 'עוף', kcal: 300, protein: 40, carbs: 0, fat: 10 },
    { name: 'פגום', kcal: -50, protein: 5, carbs: 5, fat: 5 }
  ];
  const res = validateNutritionMeal(items, 'photo');
  assert.equal(res.overallStatus, 'REJECTED');
  assert.equal(res.itemResults[0].status, 'VALID');
  assert.equal(res.itemResults[1].status, 'REJECTED');
});

test('15b. multi-item meal: all items valid, aggregate valid -> VALID', () => {
  const items = [
    { name: 'עוף', kcal: 300, protein: 40, carbs: 0, fat: 10 },
    { name: 'אורז', kcal: 200, protein: 4, carbs: 45, fat: 1 }
  ];
  const res = validateNutritionMeal(items, 'photo');
  assert.equal(res.overallStatus, 'VALID');
  assert.equal(res.aggregateResult.normalized.kcal, 500);
});

// ── ER-005 field-mapping specific checks ──

test('ER-005a. qty multiplier folds into quantity (amount * qty)', () => {
  const c = normalizeNutritionCandidate({ name: 'ביצה', amount: 50, qty: 2, kcal: 70, protein: 6, carbs: 0, fat: 5 }, 'photo');
  assert.equal(c.quantity, 100);
});

test('ER-005b. qty defaults to 1 when absent', () => {
  const c = normalizeNutritionCandidate({ name: 'ביצה', amount: 50, kcal: 70, protein: 6, carbs: 0, fat: 5 }, 'photo');
  assert.equal(c.quantity, 50);
});

test('ER-005c. sodium is passthrough, unaffected by and not part of validation', () => {
  const r = validate({ name: 'מנה', kcal: 165, protein: 10, carbs: 20, fat: 5, sodium: 450 }, 'photo');
  assert.equal(r.normalized.sodium, 450);
  assert.equal(r.status, 'VALID');
});

test('ER-005d. negative/invalid quantity rejected (QUANTITY_INVALID)', () => {
  const r = validate({ name: 'מנה', amount: -10, kcal: 100, protein: 5, carbs: 5, fat: 5 }, 'photo');
  assert.equal(r.status, 'REJECTED');
  assert.ok(r.errors.some(e => e.code === 'QUANTITY_INVALID'));
});

// ── §22 Manual Acceptance Scenarios encoded as automated checks ──

test('Scenario A — valid photo estimate -> VALID', () => {
  const r = validate({ name: 'ארוחה', kcal: 620, protein: 42, carbs: 68, fat: 20 }, 'photo');
  assert.equal(r.status, 'VALID');
});

test('Scenario B — contradictory estimate -> REVIEW_REQUIRED', () => {
  const r = validate({ name: 'ארוחה', kcal: 150, protein: 50, carbs: 70, fat: 30 }, 'photo');
  assert.equal(r.status, 'REVIEW_REQUIRED');
});

test('Scenario C — corrupted estimate -> REJECTED', () => {
  const r = validate({ name: 'ארוחה', kcal: -400, protein: 25, carbs: 40, fat: 20 }, 'photo');
  assert.equal(r.status, 'REJECTED');
});

test('Scenario D — invalid numeric coercion -> REJECTED, kcal never 0', () => {
  const r = validate({ name: 'ארוחה', kcal: 'unknown', protein: '25', carbs: '40', fat: '20' }, 'photo');
  assert.equal(r.status, 'REJECTED');
  assert.notEqual(r.normalized.kcal, 0);
});
