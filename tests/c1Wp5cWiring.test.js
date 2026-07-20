// C1-WP5C — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5C).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5cWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const moduleFile = 'js/nutrition/mealEditorPresenter.js';
const moduleContent = fs.readFileSync(path.join(__dirname, '..', moduleFile), 'utf8');

test('mealEditorPresenter.js is registered in index.html, loaded after mealDraft.js and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const mealDraftIdx = indexHtml.indexOf('js/nutrition/mealDraft.js');
  const idx = indexHtml.indexOf(moduleFile);
  assert.notEqual(idx, -1, moduleFile + ' script tag must exist');
  assert.ok(idx > mealDraftIdx, moduleFile + ' must load after js/nutrition/mealDraft.js');
  assert.ok(idx < appIdx, moduleFile + ' must load before app.js');
});

test('mealEditorPresenter.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + moduleFile), -1, moduleFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.39.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.39.0');
});

test('MealEditorPresenter is configured in app.js with closures for showMealEditor (wrapped later by the Day Navigation IIFE)', () => {
  const idx = appJs.indexOf('MealEditorPresenter.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /getElementById: function \(id\) \{ return document\.getElementById\(id\); \}/);
  assert.match(body, /showMealEditor: function \(meal\) \{ showMealEditor\(meal\); \}/);
  assert.match(body, /mealRequiresNutritionValidation: function \(meal\) \{ return mealRequiresNutritionValidation\(meal\); \}/);
  assert.match(body, /nutritionOutputValidator: window\.NutritionOutputValidator/);
});

// C1-WP10 legitimately consolidated renderEditor's base body (MealEditorPresenter.renderEditor
// call) with the Day Navigation IIFE's edit-mode-buttons wrap into one function inside
// js/ui/dayNavigationController.js (intentional — see tests/c1Wp10Wiring.test.js and
// docs/architecture/C1_WP0_INVENTORY.md §2.1). app.js's renderEditor() is now a one-line
// facade delegating to DayNavigationController.renderEditor(), which itself calls
// MealEditorPresenter.renderEditor(pendingMeal, editingItemIdx) directly. The other four
// facades (sourceBadge/fmtQty/nutritionValidationBanner/showAiRejectedRecovery), untouched by
// WP10, still delegate to MealEditorPresenter straight from app.js.
test('sourceBadge/fmtQty/nutritionValidationBanner/showAiRejectedRecovery are one-line facades delegating to MealEditorPresenter; renderEditor delegates to DayNavigationController, which itself calls MealEditorPresenter', () => {
  assert.match(appJs, /function sourceBadge\(\) \{\s*return MealEditorPresenter\.sourceBadge\(pendingMeal\);\s*\}/);
  assert.match(appJs, /function fmtQty\(q\) \{ return MealEditorPresenter\.fmtQty\(q\); \}/);
  assert.match(appJs, /function nutritionValidationBanner\(\) \{\s*return MealEditorPresenter\.nutritionValidationBanner\(pendingMeal\);\s*\}/);
  assert.match(appJs, /function showAiRejectedRecovery\(retryFn, originalMeal\) \{\s*return MealEditorPresenter\.showAiRejectedRecovery\(retryFn, originalMeal, foodSession && foodSession\.originalInput\);\s*\}/);
  assert.match(appJs, /function renderEditor\(\) \{ return DayNavigationController\.renderEditor\(\); \}/);
  const dayNavJs = fs.readFileSync(path.join(__dirname, '../js/ui/dayNavigationController.js'), 'utf8');
  assert.match(dayNavJs, /MealEditorPresenter\.renderEditor\(deps\.getPendingMeal\(\), deps\.getEditingItemIdx\(\)\);/);
});

test('every renderEditor() call site in app.js still exists unchanged (the facade is called the same way everywhere)', () => {
  const callCount = (appJs.match(/\brenderEditor\(\)/g) || []).length;
  // facade definition itself doesn't match \brenderEditor\(\) as a call (it's `function renderEditor()`),
  // so this counts actual call sites only.
  assert.ok(callCount >= 10, 'expected at least the ~10 known call sites (editorQty/editorEdit/editorSaveEdit/editorDelete/editorAddSuggestion/editorAddCustom/addMeal-gate/showMealEditor/Day-Nav wrap) to remain present');
});

// C1-WP10 consolidated the base renderEditor() + the Day Navigation IIFE's edit-mode wrap
// into one function in js/ui/dayNavigationController.js — there is no override-chain capture
// left in app.js at all (see the previous test). See tests/c1Wp10Wiring.test.js.
test('the edit-mode action-button behaviour (formerly the Day Navigation IIFE wrap) still exists, now inside js/ui/dayNavigationController.js', () => {
  const dayNavJs = fs.readFileSync(path.join(__dirname, '../js/ui/dayNavigationController.js'), 'utf8');
  assert.match(dayNavJs, /if \(deps\.getEditingExisting\(\)\) \{/);
  assert.match(dayNavJs, /'<button class="btn-primary" onclick="addMeal\(\)">שמור שינויים ✓<\/button>' \+/);
});

test('mealEditorPresenter.js must not own durable writes: no db., no PersistenceGateway, no SessionLifecycle, no direct commit/rollback vocabulary', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /PersistenceGateway/);
  assert.doesNotMatch(code, /SessionLifecycle/);
  assert.doesNotMatch(code, /persistDaySnapshot|todayData\.meals\.push/);
  assert.doesNotMatch(code, /\bcurrentUser\b|\buserProfile\b|\btodayData\b|\bfoodSession\b/, 'must not reference application state directly — pendingMeal and editingItemIdx are passed as parameters');
});

test('mealEditorPresenter.js does not perform AI requests (WP5A) or reimplement meal-draft math (WP5B) — it calls MealDraft.computeTotals rather than summing itself', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /callClaude|NutritionAnalysisService/);
  assert.match(moduleContent, /require\('\.\/mealDraft\.js'\)/);
  assert.match(moduleContent, /MealDraft\.computeTotals\(/);
  assert.doesNotMatch(code, /it\.kcal \* it\.qty \+|t\.kcal \+= it\.kcal/, 'totals summation must not be reimplemented inline');
});

// C1-WP5D legitimately added js/nutrition/mealCommitService.js after this test was written —
// the closed set below was updated in the same commit to include it. mealEditorPresenter.js
// itself must still never reference it or any WP5E-F name.
// C1-WP5E legitimately added js/nutrition/quickLogService.js after this test was written —
// the closed set below was updated in the same commit to include it.
// C1-WP5F legitimately added js/nutrition/barcodeFlowController.js after this test was written —
// the closed set below was updated in the same commit to include it.
test('no WP6+ vocabulary was introduced into mealEditorPresenter.js; only the C1-WP5D/5E/5F files were added', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['barcodeFlowController.js', 'mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js', 'quickLogService.js']);
  assert.doesNotMatch(moduleContent, /mealCommitService|quickLogService|foodController|barcodeFlowController/);
});

// C1-WP5D subsequently relocated addMeal()'s body into MealCommitService.commitMeal
// (intentional — see tests/c1Wp5dWiring.test.js) — this test now only confirms addMeal()
// itself still exists as a callable facade, which is all WP5C's own scope ever required.
test('addMeal (WP5D territory) still exists as a callable function, untouched by WP5C itself', () => {
  assert.match(appJs, /async function addMeal\(\) \{/);
});

test('mealEditorPresenter.js exports the five named operations plus fmtQty, with both a window.X and module.exports surface', () => {
  assert.match(moduleContent, /window\.MealEditorPresenter = API/);
  assert.match(moduleContent, /module\.exports = API/);
  ['fmtQty', 'sourceBadge', 'nutritionValidationBanner', 'renderEditor', 'showAiRejectedRecovery'].forEach((name) => {
    assert.match(moduleContent, new RegExp(name + ':\\s*' + name));
  });
});
