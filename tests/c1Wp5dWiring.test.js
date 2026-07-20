// C1-WP5D — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5D).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5dWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const moduleFile = 'js/nutrition/mealCommitService.js';
const moduleContent = fs.readFileSync(path.join(__dirname, '..', moduleFile), 'utf8');

test('mealCommitService.js is registered in index.html, loaded after mealEditorPresenter.js and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const presenterIdx = indexHtml.indexOf('js/nutrition/mealEditorPresenter.js');
  const idx = indexHtml.indexOf(moduleFile);
  assert.notEqual(idx, -1, moduleFile + ' script tag must exist');
  assert.ok(idx > presenterIdx, moduleFile + ' must load after js/nutrition/mealEditorPresenter.js');
  assert.ok(idx < appIdx, moduleFile + ' must load before app.js');
});

test('mealCommitService.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + moduleFile), -1, moduleFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.34.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.34.0');
});

test('MealCommitService is configured with closures for every collaborator (never bare references)', () => {
  const idx = appJs.indexOf('MealCommitService.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  [
    'mealRequiresNutritionValidation: function (meal) { return mealRequiresNutritionValidation(meal); }',
    'logValidation: function (status, sourceType, errorCodes) { logNutritionValidation(status, sourceType, errorCodes); }',
    'collectErrorCodes: function (gate) { return collectNutritionErrorCodes(gate); }',
    'saveBarcodeToCache: function (code, item, addedByName) { return saveBarcodeToCache(code, item, addedByName); }',
    'persistDaySnapshot: function (meals, burned, steps, water, authority, gen) { return persistDaySnapshot(meals, burned, steps, water, authority, gen); }',
    "learnQuickItems: function (meal) { learnQuickItems(meal); }",
    'clearPendingMeal: function () { pendingMeal = null; }',
    "getElementById: function (id) { return document.getElementById(id); }",
    'saveProfile: function () { return saveProfile(); }',
    'updateStreak: function () { return updateStreak(); }',
    'renderFoodMeals: function () { renderFoodMeals(); }',
    'renderQuickStrip: function () { renderQuickStrip(); }',
    'renderHome: function () { renderHome(); }',
    'renderEditor: function () { renderEditor(); }',
    'alertFn: function (msg) { alert(msg); }'
  ].forEach((snippet) => assert.ok(body.includes(snippet), 'missing or altered: ' + snippet));
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
  assert.match(body, /nutritionOutputValidator: window\.NutritionOutputValidator,/);
});

test('addMeal() is a facade delegating to MealCommitService.commitMeal with the exact authorityOptions buildMealFromEditor also uses', () => {
  assert.match(appJs, /async function addMeal\(\) \{\s*return MealCommitService\.commitMeal\(pendingMeal, todayData, waterCount, \{\s*authoritySource: authoritySourceForMeal\(pendingMeal\),\s*createdByUid: currentUser && currentUser\.uid,\s*systemVersion: APP_VERSION\s*\}\);\s*\}/);
});

test('persistDaySnapshot, learnQuickItems, updateStreak, and saveBarcodeToCache are not duplicated: each still has exactly one function declaration in app.js', () => {
  ['persistDaySnapshot', 'learnQuickItems', 'updateStreak', 'saveBarcodeToCache', 'saveProfile', 'mealRequiresNutritionValidation'].forEach((name) => {
    const declRe = new RegExp('^(async )?function ' + name + '\\(', 'm');
    const matches = appJs.match(new RegExp(declRe.source, 'gm')) || [];
    assert.equal(matches.length, 1, name + ' must have exactly one declaration in app.js (shared, not duplicated into the service)');
  });
  assert.doesNotMatch(moduleContent, /function persistDaySnapshot|function learnQuickItems|function updateStreak|function saveBarcodeToCache/, 'the service must not reimplement any of these — only call the injected closures');
});

test('persistDaySnapshot is still shared with logQuick (WP5E) — confirms the commit service did not steal exclusive ownership of a cross-WP utility', () => {
  const occurrences = (appJs.match(/persistDaySnapshot\(/g) || []).length;
  // 1 declaration + 1 call inside addMeal's old body (now removed) replaced by 1 call inside the
  // configure() closure + 1 remaining call at the WP5E logQuick call site.
  assert.ok(occurrences >= 3, 'expected the declaration, the configure() closure call, and at least one other call site (logQuick) to remain');
});

test('mealCommitService.js requires MealDraft directly (stable pure module, no override chain) rather than reimplementing authority construction', () => {
  assert.match(moduleContent, /require\('\.\/mealDraft\.js'\)/);
  assert.match(moduleContent, /MealDraft\.buildAuthoritativeMeal\(/);
  assert.doesNotMatch(moduleContent, /buildAuthorityMetadata\(/, 'must not call AuthorityContract directly — that stays inside MealDraft');
});

test('mealCommitService.js does not own DOM rendering markup, AI requests, or Firestore access directly — only orchestrates injected collaborators', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /callClaude|NutritionAnalysisService/);
  assert.doesNotMatch(code, /\.innerHTML\s*=/, 'rendering markup construction belongs to MealEditorPresenter (WP5C), not the commit service');
  assert.doesNotMatch(code, /PersistenceGateway\./, 'must go through the injected persistDaySnapshot, never call PersistenceGateway directly (B4 is frozen and shared with WP5E)');
});

test('addMealAndFavorite/saveFavoriteFromPending remain untouched — their own validation precheck is separate glue, not the final gate', () => {
  const idx = appJs.indexOf('async function addMealAndFavorite() {');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /window\.NutritionOutputValidator\.validateNutritionMeal\(pendingMeal\.items, pendingMeal\.source \|\| 'text'\)/);
  assert.doesNotMatch(body, /MealCommitService/, 'addMealAndFavorite must keep calling addMeal(), not the service directly');
});

// C1-WP5E legitimately added js/nutrition/quickLogService.js after this test was written — the
// closed set below was updated in the same commit to include it, and moduleContent (WP5D's own
// mealCommitService.js) is still checked to never reference it. appJs necessarily now references
// the capitalized global QuickLogService (see tests/c1Wp5eWiring.test.js) — that is WP5E's own
// concern, not WP5D's; this check is narrowed to the lowercase file-path form only.
// C1-WP5F legitimately added js/nutrition/barcodeFlowController.js after this test was written —
// the closed set below was updated in the same commit to include it, for the same reason (appJs
// now references the capitalized global BarcodeFlowController — WP5F's own concern).
test('no WP6+ vocabulary or unexpected files were introduced into js/nutrition/', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['barcodeFlowController.js', 'mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js', 'quickLogService.js']);
  assert.doesNotMatch(moduleContent, /quickLogService|foodController|barcodeFlowController/);
  assert.doesNotMatch(appJs, /foodController/);
});

test('quick-log (WP5E) functions — capQuick, scoreQuick, renderQuickStrip\'s internals, submitQuickLearn — are untouched by WP5D', () => {
  assert.match(appJs, /function capQuick\(\) \{/);
  assert.match(appJs, /function scoreQuick\(q\) \{/);
  assert.match(appJs, /async function submitQuickLearn\(\) \{/);
});

test('mealCommitService.js exports configure() and commitMeal, with both a window.X and module.exports surface', () => {
  assert.match(moduleContent, /window\.MealCommitService = API/);
  assert.match(moduleContent, /module\.exports = API/);
  assert.match(moduleContent, /configure: configure, commitMeal: commitMeal/);
});
