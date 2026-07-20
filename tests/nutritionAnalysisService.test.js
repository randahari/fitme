// C1-WP5A — js/nutrition/nutritionAnalysisService.js unit tests.
// callClaude/parseModelJSON/NutritionOutputValidator/UI callbacks are injected via
// configure() so every AI-call construction and the validation-routing branch are
// testable without a browser or a real Claude proxy.
// Run with: node --test tests/nutritionAnalysisService.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NutritionAnalysisService = require('../js/nutrition/nutritionAnalysisService.js');

function fakeDeps(overrides) {
  const calls = [];
  const deps = {
    callClaude: async (body) => { calls.push(body); return { content: [{ text: JSON.stringify({ ok: true }) }] }; },
    parseModelJSON: (raw) => JSON.parse(raw),
    nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'VALID', itemResults: [], aggregateResult: { errors: [] } }) },
    logValidation: () => {},
    collectErrorCodes: () => [],
    onRejected: () => {},
    onValid: () => {}
  };
  Object.assign(deps, overrides);
  return { deps, calls };
}

test('requestQuestionnaire builds the exact original prompt and returns the parsed JSON', async () => {
  const { deps, calls } = fakeDeps({ parseModelJSON: (raw) => ({ questions: JSON.parse(raw).questions }) });
  deps.callClaude = async (body) => { calls.push(body); return { content: [{ text: '{"questions":[{"q":"כמה?","options":["א","ב"]}]}' }] }; };
  NutritionAnalysisService.configure(deps);
  const result = await NutritionAnalysisService.requestQuestionnaire('פסטה');
  assert.equal(calls[0].model, 'claude-sonnet-4-6');
  assert.equal(calls[0].max_tokens, 600);
  assert.match(calls[0].messages[0].content, /המשתמש רשם: "פסטה"/);
  assert.match(calls[0].messages[0].content, /עד 3 שאלות/);
  assert.deepEqual(result.questions, [{ q: 'כמה?', options: ['א', 'ב'] }]);
});

test('requestCalculation builds the exact original prompt including ITEMS_JSON_SPEC and both interpolated fields', async () => {
  const { deps, calls } = fakeDeps();
  NutritionAnalysisService.configure(deps);
  await NutritionAnalysisService.requestCalculation('פסטה ברוטב', 'כמה ספגטי?: 200 גרם');
  assert.equal(calls[0].max_tokens, 1200);
  assert.match(calls[0].messages[0].content, /מאכל: "פסטה ברוטב"/);
  assert.match(calls[0].messages[0].content, /פרטים: כמה ספגטי\?: 200 גרם/);
  assert.match(calls[0].messages[0].content, new RegExp(NutritionAnalysisService.ITEMS_JSON_SPEC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('requestPhotoAnalysis selects PLATE_PROMPT for plate mode and builds the correct image message', async () => {
  const { deps, calls } = fakeDeps();
  NutritionAnalysisService.configure(deps);
  await NutritionAnalysisService.requestPhotoAnalysis('plate', 'B64DATA', 'image/jpeg');
  assert.equal(calls[0].messages[0].content[0].type, 'image');
  assert.deepEqual(calls[0].messages[0].content[0].source, { type: 'base64', media_type: 'image/jpeg', data: 'B64DATA' });
  assert.equal(calls[0].messages[0].content[1].text.indexOf(NutritionAnalysisService.PLATE_PROMPT), 0);
});

test('requestPhotoAnalysis selects LABEL_PROMPT for label mode', async () => {
  const { deps, calls } = fakeDeps();
  NutritionAnalysisService.configure(deps);
  await NutritionAnalysisService.requestPhotoAnalysis('label', 'B64DATA2', 'image/png');
  assert.equal(calls[0].messages[0].content[1].text.indexOf(NutritionAnalysisService.LABEL_PROMPT), 0);
});

test('requestItemEstimate builds the exact original single-item prompt', async () => {
  const { deps, calls } = fakeDeps();
  NutritionAnalysisService.configure(deps);
  await NutritionAnalysisService.requestItemEstimate('תפוח בינוני');
  assert.equal(calls[0].max_tokens, 300);
  assert.match(calls[0].messages[0].content, /הערך תזונתית פריט בודד: "תפוח בינוני"/);
});

test('a rejected AI response (parseModelJSON throwing or callClaude rejecting) propagates to the caller unmodified', async () => {
  const { deps } = fakeDeps({ callClaude: async () => { throw new Error('proxy down'); } });
  NutritionAnalysisService.configure(deps);
  await assert.rejects(() => NutritionAnalysisService.requestQuestionnaire('x'), /proxy down/);
});

test('routeMeal calls the validator with meal.items and sourceType, and routes VALID to onValid', () => {
  const seen = {};
  const { deps } = fakeDeps({
    nutritionOutputValidator: { validateNutritionMeal: (items, sourceType) => { seen.items = items; seen.sourceType = sourceType; return { overallStatus: 'VALID', itemResults: [], aggregateResult: { errors: [] } }; } },
    onValid: (meal) => { seen.onValidMeal = meal; },
    onRejected: () => { seen.onRejectedCalled = true; }
  });
  NutritionAnalysisService.configure(deps);
  const meal = { items: [{ name: 'תפוח' }], source: 'text' };
  NutritionAnalysisService.routeMeal(meal, 'text', null);
  assert.deepEqual(seen.items, meal.items);
  assert.equal(seen.sourceType, 'text');
  assert.equal(seen.onValidMeal, meal);
  assert.equal(seen.onRejectedCalled, undefined);
});

test('routeMeal routes REJECTED to onRejected with the retryFn and original meal, not onValid', () => {
  const seen = {};
  const retryFn = () => {};
  const { deps } = fakeDeps({
    nutritionOutputValidator: { validateNutritionMeal: () => ({ overallStatus: 'REJECTED', itemResults: [], aggregateResult: { errors: [] } }) },
    onRejected: (rf, meal) => { seen.retryFn = rf; seen.meal = meal; },
    onValid: () => { seen.onValidCalled = true; }
  });
  NutritionAnalysisService.configure(deps);
  const meal = { items: [], source: 'photo' };
  NutritionAnalysisService.routeMeal(meal, 'photo', retryFn);
  assert.equal(seen.retryFn, retryFn);
  assert.equal(seen.meal, meal);
  assert.equal(seen.onValidCalled, undefined);
});

test('routeMeal defaults meal.items to [] when missing or not an array, without throwing', () => {
  const seen = {};
  const { deps } = fakeDeps({
    nutritionOutputValidator: { validateNutritionMeal: (items) => { seen.items = items; return { overallStatus: 'VALID', itemResults: [], aggregateResult: { errors: [] } }; } }
  });
  NutritionAnalysisService.configure(deps);
  NutritionAnalysisService.routeMeal({ items: 'not-an-array' }, 'text', null);
  assert.deepEqual(seen.items, []);
  NutritionAnalysisService.routeMeal(null, 'text', null);
  assert.deepEqual(seen.items, []);
});

test('routeMeal forwards the validator gate through logValidation via collectErrorCodes', () => {
  const seen = {};
  const gate = { overallStatus: 'REJECTED', itemResults: [{ errors: [{ code: 'E1' }] }], aggregateResult: { errors: [] } };
  const { deps } = fakeDeps({
    nutritionOutputValidator: { validateNutritionMeal: () => gate },
    collectErrorCodes: (g) => { seen.gateSeenByCollect = g; return ['E1']; },
    logValidation: (status, sourceType, codes) => { seen.status = status; seen.sourceType = sourceType; seen.codes = codes; }
  });
  NutritionAnalysisService.configure(deps);
  NutritionAnalysisService.routeMeal({ items: [] }, 'label', null);
  assert.equal(seen.gateSeenByCollect, gate);
  assert.equal(seen.status, 'REJECTED');
  assert.equal(seen.sourceType, 'label');
  assert.deepEqual(seen.codes, ['E1']);
});
