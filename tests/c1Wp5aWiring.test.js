// C1-WP5A — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5A).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5aWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const serviceFile = 'js/nutrition/nutritionAnalysisService.js';
const serviceContent = fs.readFileSync(path.join(__dirname, '..', serviceFile), 'utf8');

test('nutritionAnalysisService.js is registered in index.html, loaded after the WP4 modules and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const lastWp4Idx = indexHtml.indexOf('js/app/authSessionController.js');
  const idx = indexHtml.indexOf(serviceFile);
  assert.notEqual(idx, -1, serviceFile + ' script tag must exist');
  assert.ok(idx > lastWp4Idx, serviceFile + ' must load after the WP4 modules');
  assert.ok(idx < appIdx, serviceFile + ' must load before app.js');
});

test('nutritionAnalysisService.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + serviceFile), -1, serviceFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.34.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.34.0');
});

test('NutritionAnalysisService is configured in app.js with closures, not bare references, for callClaude and showMealEditor', () => {
  const idx = appJs.indexOf('NutritionAnalysisService.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  // callClaude is wrapped later in app.js (usage-tracking hook) and showMealEditor is wrapped
  // later by the Day Navigation IIFE — both must be injected as closures so the service always
  // resolves the final runtime definition, not a reference captured at configure()-time.
  assert.match(body, /callClaude: function \(body\) \{ return callClaude\(body\); \}/);
  assert.match(body, /onValid: function \(meal\) \{ showMealEditor\(meal\); \}/);
  assert.match(body, /onRejected: function \(retryFn, meal\) \{ showAiRejectedRecovery\(retryFn, meal\); \}/);
  assert.match(body, /nutritionOutputValidator: window\.NutritionOutputValidator/);
});

test('analyzeFood/calculateFoodResult/analyzePhoto/editorAddCustom delegate their AI-call construction to NutritionAnalysisService', () => {
  assert.match(appJs, /const parsed = await NutritionAnalysisService\.requestQuestionnaire\(input\);/);
  assert.match(appJs, /const meal = await NutritionAnalysisService\.requestCalculation\(foodSession\.originalInput, answersText\);/);
  assert.match(appJs, /const meal = await NutritionAnalysisService\.requestPhotoAnalysis\(mode, img\.b64, img\.mediaType\);/);
  assert.match(appJs, /const it = await NutritionAnalysisService\.requestItemEstimate\(val\);/);
});

test('routeAiMeal is a one-line facade delegating to NutritionAnalysisService.routeMeal, preserving its call sites', () => {
  const idx = appJs.indexOf('function routeAiMeal(meal, sourceType, retryFn) {');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /return NutritionAnalysisService\.routeMeal\(meal, sourceType, retryFn\);/);
  assert.match(appJs, /routeAiMeal\(meal, 'text', calculateFoodResult\);/);
  assert.match(appJs, /routeAiMeal\(meal, mode === 'label' \? 'label' : 'photo', \(\) => \{ if \(mode === 'label'\) startLabelCamera\(\); else startCamera\(\); \}\);/);
});

test('PLATE_PROMPT/LABEL_PROMPT/ITEMS_JSON_SPEC no longer exist as app.js constants', () => {
  assert.equal(appJs.indexOf('const PLATE_PROMPT ='), -1);
  assert.equal(appJs.indexOf('const LABEL_PROMPT ='), -1);
  assert.equal(appJs.indexOf('const ITEMS_JSON_SPEC ='), -1);
});

test('coach-domain callClaude call sites are untouched (out of WP5A scope)', () => {
  const coachCallSites = (appJs.match(/await callClaude\(/g) || []).length;
  assert.equal(coachCallSites, 5, 'expected exactly 5 remaining direct callClaude call sites: coachMessage, submitQuickLearn (WP5E), and 3 coach weekly-summary/menu/letter functions');
  assert.match(appJs, /אתה "המאמן"/, 'coachSystemPrompt-related content must remain untouched');
});

test('submitQuickLearn (WP5E territory) is untouched — still calls callClaude/parseModelJSON directly, not the new service', () => {
  const idx = appJs.indexOf('async function submitQuickLearn()');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /await callClaude\(/);
  assert.match(body, /parseModelJSON\(data\.content\[0\]\.text\)/);
  assert.doesNotMatch(body, /NutritionAnalysisService/);
});

test('no repository/adapter is duplicated; nutritionAnalysisService.js touches no DOM, no Firestore, no alert/confirm', () => {
  const code = serviceContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /\balert\(/);
  assert.doesNotMatch(code, /\bconfirm\(/);
  assert.doesNotMatch(code, /\bpendingMeal\b|\bfoodSession\b|\bcurrentUser\b|\buserProfile\b/);
});

// C1-WP5B legitimately added js/nutrition/mealDraft.js after this test was written — the
// closed set below was updated in the same commit to include it. nutritionAnalysisService.js
// itself must still never reference it or any WP5C-F name.
// C1-WP5C legitimately added js/nutrition/mealEditorPresenter.js after this test was written —
// the closed set below was updated in the same commit to include it. nutritionAnalysisService.js
// itself must still never reference it or any WP5D-F name.
// C1-WP5D legitimately added js/nutrition/mealCommitService.js after this test was written —
// the closed set below was updated in the same commit to include it.
// C1-WP5E legitimately added js/nutrition/quickLogService.js after this test was written — the
// closed set below was updated in the same commit to include it.
// C1-WP5F legitimately added js/nutrition/barcodeFlowController.js after this test was written —
// the closed set below was updated in the same commit to include it.
test('no WP6+ vocabulary was introduced into nutritionAnalysisService.js; only the C1-WP5B/5C/5D/5E/5F files were added', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['barcodeFlowController.js', 'mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js', 'quickLogService.js']);
  assert.doesNotMatch(serviceContent, /mealDraft|mealCommitService|quickLogService|mealEditorPresenter|foodController|barcodeFlowController/);
});

test('the B1 nutrition validator itself is referenced, not reimplemented', () => {
  const nutritionValidatorJs = fs.readFileSync(path.join(__dirname, '..', 'js/nutritionValidator.js'), 'utf8');
  assert.match(nutritionValidatorJs, /function validateNutritionMeal/);
  assert.doesNotMatch(serviceContent, /function validateNutritionMeal/, 'nutritionAnalysisService.js must not reimplement validation logic — it must call the injected validator');
});

test('nutritionAnalysisService.js exports configure() and both a window.X and module.exports surface', () => {
  assert.match(serviceContent, /window\.NutritionAnalysisService = API/);
  assert.match(serviceContent, /module\.exports = API/);
  assert.match(serviceContent, /configure: configure/);
});
