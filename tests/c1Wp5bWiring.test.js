// C1-WP5B — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5B).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5bWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const moduleFile = 'js/nutrition/mealDraft.js';
const moduleContent = fs.readFileSync(path.join(__dirname, '..', moduleFile), 'utf8');

test('mealDraft.js is registered in index.html, loaded after its dependencies and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const nutritionModelIdx = indexHtml.indexOf('js/domain/nutritionModel.js');
  const authorityContractIdx = indexHtml.indexOf('js/authorityContract.js');
  const idx = indexHtml.indexOf(moduleFile);
  assert.notEqual(idx, -1, moduleFile + ' script tag must exist');
  assert.ok(idx > nutritionModelIdx, moduleFile + ' must load after js/domain/nutritionModel.js');
  assert.ok(idx > authorityContractIdx, moduleFile + ' must load after js/authorityContract.js');
  assert.ok(idx < appIdx, moduleFile + ' must load before app.js');
});

test('mealDraft.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + moduleFile), -1, moduleFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.32.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.32.0');
});

test('mealDraft.js is a pure module: no configure(), no window/document/db/alert/confirm, and depends only on NutritionModel/AuthorityContract via direct require (matching the WP1 pure-module precedent)', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function configure\(/, 'a pure deterministic module (per spec) must not need configure() — matching js/domain/nutritionModel.js, which has none');
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /\balert\(/);
  assert.doesNotMatch(code, /\bconfirm\(/);
  assert.doesNotMatch(code, /\bpendingMeal\b|\bcurrentUser\b|\buserProfile\b|\btodayData\b/);
  assert.doesNotMatch(code, /PersistenceGateway|SessionLifecycle|renderEditor/, 'must not own persistence, session lifecycle, or rendering');
  assert.match(moduleContent, /require\('\.\.\/domain\/nutritionModel\.js'\)/);
  assert.match(moduleContent, /require\('\.\.\/authorityContract\.js'\)/);
});

test('showMealEditor/mealTotals/editorQty/editorSaveEdit/editorDelete/editorAddSuggestion/buildMealFromEditor delegate to MealDraft', () => {
  assert.match(appJs, /pendingMeal = MealDraft\.buildDraft\(meal\);/);
  assert.match(appJs, /return MealDraft\.computeTotals\(pendingMeal \? pendingMeal\.items : \[\]\);/);
  assert.match(appJs, /MealDraft\.changeQty\(it, dir\);/);
  assert.match(appJs, /MealDraft\.applyEdit\(it, \{/);
  assert.match(appJs, /MealDraft\.removeItem\(pendingMeal\.items, i\);/);
  assert.match(appJs, /MealDraft\.promoteSuggestion\(pendingMeal\.items, pendingMeal\.suggestions, i\);/);
  assert.match(appJs, /return MealDraft\.buildAuthoritativeMeal\(pendingMeal, \{/);
});

test('DOM/state/rendering responsibilities remain in app.js facades: editingItemIdx reset, renderEditor() calls, and the food-result visibility toggle are all still present', () => {
  const showMealEditorIdx = appJs.indexOf('function showMealEditor(meal) {');
  const showMealEditorBody = appJs.slice(showMealEditorIdx, appJs.indexOf('\n}', showMealEditorIdx));
  assert.match(showMealEditorBody, /editingItemIdx = null;/);
  assert.match(showMealEditorBody, /renderEditor\(\);/);
  assert.match(showMealEditorBody, /document\.getElementById\('food-result'\)\.classList\.remove\('hidden'\);/);

  ['function editorQty(i, dir) {', 'function editorDelete(i) {', 'function editorAddSuggestion(i) {'].forEach((sig) => {
    const idx = appJs.indexOf(sig);
    assert.notEqual(idx, -1, sig + ' must still exist in app.js');
    const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
    assert.match(body, /renderEditor\(\);/, sig + ' must still call renderEditor()');
  });

  const saveEditIdx = appJs.indexOf('function editorSaveEdit(i) {');
  const saveEditBody = appJs.slice(saveEditIdx, appJs.indexOf('\n}', saveEditIdx));
  assert.match(saveEditBody, /document\.getElementById\(id\)/, 'DOM reads for the edit form must remain in app.js');
  assert.match(saveEditBody, /editingItemIdx = null;/);
});

test('buildMealFromEditor still supplies authoritySourceForMeal/currentUser/APP_VERSION from app.js — MealDraft never reads application state directly', () => {
  const idx = appJs.indexOf('function buildMealFromEditor() {');
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /authoritySource: authoritySourceForMeal\(pendingMeal\)/);
  assert.match(body, /createdByUid: currentUser && currentUser\.uid/);
  assert.match(body, /systemVersion: APP_VERSION/);
});

// C1-WP5D subsequently relocated addMeal()'s body into MealCommitService.commitMeal
// (intentional — see tests/c1Wp5dWiring.test.js) — this test now only confirms addMeal()
// and persistDaySnapshot() still exist, and that buildMealFromEditor() (WP5B's own facade,
// still used by saveFavoriteFromPending) is untouched.
test('addMeal/persistDaySnapshot (WP5D territory) still exist; buildMealFromEditor (WP5B) is untouched', () => {
  assert.match(appJs, /async function addMeal\(\) \{/);
  assert.match(appJs, /async function persistDaySnapshot\(/);
  assert.match(appJs, /function buildMealFromEditor\(\) \{\s*return MealDraft\.buildAuthoritativeMeal\(pendingMeal, \{/);
});

// C1-WP5C and C1-WP5D legitimately added js/nutrition/mealEditorPresenter.js and
// mealCommitService.js after this test was written — the closed set below was updated in
// the same commits to include them. mealDraft.js itself must still never reference either
// of them or any WP5E-F name.
test('no WP5D-F vocabulary was introduced into mealDraft.js; only the C1-WP5C/5D files were added', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js']);
  assert.doesNotMatch(moduleContent, /mealCommitService|quickLogService|mealEditorPresenter|foodController|barcodeFlowController/);
});

test('mealDraft.js exports the seven named operations, with both a window.X and module.exports surface', () => {
  assert.match(moduleContent, /window\.MealDraft = API/);
  assert.match(moduleContent, /module\.exports = API/);
  ['buildDraft', 'computeTotals', 'changeQty', 'applyEdit', 'removeItem', 'promoteSuggestion', 'buildAuthoritativeMeal'].forEach((name) => {
    assert.match(moduleContent, new RegExp(name + ':\\s*' + name));
  });
});
