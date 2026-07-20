// C1-WP5E — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5E).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5eWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const moduleFile = 'js/nutrition/quickLogService.js';
const moduleContent = fs.readFileSync(path.join(__dirname, '..', moduleFile), 'utf8');

test('quickLogService.js is registered in index.html, loaded after mealCommitService.js and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const commitIdx = indexHtml.indexOf('js/nutrition/mealCommitService.js');
  const idx = indexHtml.indexOf(moduleFile);
  assert.notEqual(idx, -1, moduleFile + ' script tag must exist');
  assert.ok(idx > commitIdx, moduleFile + ' must load after js/nutrition/mealCommitService.js');
  assert.ok(idx < appIdx, moduleFile + ' must load before app.js');
});

test('quickLogService.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + moduleFile), -1, moduleFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.35.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.35.0');
});

test('QuickLogService is configured with closures for every collaborator (never bare references)', () => {
  const idx = appJs.indexOf('QuickLogService.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  [
    'logValidation: function (status, sourceType, errorCodes) { logNutritionValidation(status, sourceType, errorCodes); }',
    'collectErrorCodes: function (gate) { return collectNutritionErrorCodes(gate); }',
    'persistDaySnapshot: function (meals, burned, steps, water, authority, gen) { return persistDaySnapshot(meals, burned, steps, water, authority, gen); }',
    'alertFn: function (msg) { alert(msg); }'
  ].forEach((snippet) => assert.ok(body.includes(snippet), 'missing or altered: ' + snippet));
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
  assert.match(body, /nutritionOutputValidator: window\.NutritionOutputValidator,/);
});

test('learnQuickItems/capQuick/scoreQuick are one-line-bodied facades delegating to QuickLogService, preserving the original guard', () => {
  assert.match(appJs, /function learnQuickItems\(meal\) \{\s*if \(!meal \|\| !Array\.isArray\(meal\.items\)\) return;\s*quickItems = QuickLogService\.learnQuickItems\(meal, quickItems, r1\);\s*if \(userProfile\) userProfile\.quickItems = quickItems;\s*\}/);
  assert.match(appJs, /function capQuick\(\) \{\s*quickItems = QuickLogService\.capQuick\(quickItems\);\s*\}/);
  assert.match(appJs, /function scoreQuick\(q\) \{ return QuickLogService\.scoreQuick\(q\); \}/);
});

test('logQuick delegates the commit to QuickLogService.commitQuickItem with the same authorityOptions shape addMeal uses (minus authoritySource, which is fixed inside the service)', () => {
  const idx = appJs.indexOf('async function logQuick(gi, btn) {');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /QuickLogService\.commitQuickItem\(q, todayData, waterCount, \{\s*createdByUid: currentUser && currentUser\.uid,\s*systemVersion: APP_VERSION\s*\}\)/);
  assert.match(body, /if \(!committed\) return;/);
  assert.doesNotMatch(body, /renderQuickStrip\(\)/, 'the original logQuick never called renderQuickStrip() on success — this asymmetry vs. addMeal must be preserved exactly');
});

test('pinQuick/removeQuick are one-line-bodied facades delegating to QuickLogService.togglePin/removeItem', () => {
  const pinIdx = appJs.indexOf('async function pinQuick(gi) {');
  assert.notEqual(pinIdx, -1);
  const pinBody = appJs.slice(pinIdx, appJs.indexOf('\n}', pinIdx));
  assert.match(pinBody, /if \(!QuickLogService\.togglePin\(quickItems, gi\)\) return;/);

  const removeIdx = appJs.indexOf('async function removeQuick(gi) {');
  assert.notEqual(removeIdx, -1);
  const removeBody = appJs.slice(removeIdx, appJs.indexOf('\n}', removeIdx));
  assert.match(removeBody, /QuickLogService\.removeItem\(quickItems, gi\);/);
});

test('persistDaySnapshot, r1, saveProfile, updateStreak, renderFoodMeals, renderHome are not duplicated: each still has exactly one declaration in app.js', () => {
  ['persistDaySnapshot', 'r1', 'saveProfile', 'updateStreak', 'renderFoodMeals', 'renderHome'].forEach((name) => {
    const declRe = new RegExp('^(async )?function ' + name + '\\(', 'm');
    const matches = appJs.match(new RegExp(declRe.source, 'gm')) || [];
    assert.equal(matches.length, 1, name + ' must have exactly one declaration in app.js (shared, not duplicated into the service)');
  });
  assert.doesNotMatch(moduleContent, /function persistDaySnapshot|function saveProfile|function updateStreak|function renderFoodMeals|function renderHome/, 'the service must not reimplement any of these — only call the injected closures');
});

test('persistDaySnapshot is still shared with addMeal (WP5D) — confirms the quick-log service did not steal exclusive ownership of a cross-WP utility', () => {
  const occurrences = (appJs.match(/persistDaySnapshot\(/g) || []).length;
  // 1 declaration + 1 call inside the MealCommitService.configure() closure + 1 call inside the
  // QuickLogService.configure() closure = at least 3.
  assert.ok(occurrences >= 3, 'expected the declaration plus both configure() closure calls to remain');
});

test('submitQuickLearn (AI onboarding), renderQuickStrip, toggleQuickManage, maybeShowQuickLearn, and dismissQuickLearn are untouched — explicitly out of WP5E scope', () => {
  assert.match(appJs, /async function submitQuickLearn\(\) \{/);
  assert.match(appJs, /function renderQuickStrip\(\) \{/);
  assert.match(appJs, /function toggleQuickManage\(\) \{/);
  assert.doesNotMatch(appJs.slice(appJs.indexOf('async function submitQuickLearn(')), /QuickLogService/, 'submitQuickLearn must not delegate to QuickLogService — AI-onboarding request construction is not in the WP5E extraction list');
});

test('quickLogService.js requires AuthorityContract directly (stable pure module, no override chain) — matching the mealCommitService.js/mealDraft.js precedent', () => {
  assert.match(moduleContent, /require\('\.\.\/authorityContract\.js'\)/);
  assert.match(moduleContent, /AuthorityContract\.buildAuthorityMetadata\(/);
});

test('quickLogService.js does not own DOM rendering markup, AI requests, or Firestore access directly — only orchestrates injected collaborators', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /callClaude|NutritionAnalysisService/);
  assert.doesNotMatch(code, /\.innerHTML\s*=/, 'rendering markup construction belongs to app.js/MealEditorPresenter, not the quick-log service');
  assert.doesNotMatch(code, /PersistenceGateway\./, 'must go through the injected persistDaySnapshot, never call PersistenceGateway directly (B4 is frozen and shared with WP5D)');
  assert.doesNotMatch(code, /renderQuickStrip|MealDraft|mealCommitService/, 'must not own rendering, meal-draft math, or the addMeal commit sequence');
});

// C1-WP5F legitimately added js/nutrition/barcodeFlowController.js after this test was written —
// the closed set below was updated in the same commit to include it. quickLogService.js itself
// must still never reference it or any WP6+ name.
test('no WP6+ vocabulary was introduced into quickLogService.js; only the C1-WP5F file was added', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['barcodeFlowController.js', 'mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js', 'quickLogService.js']);
  assert.doesNotMatch(moduleContent, /foodController|barcodeFlowController/);
});

test('quickLogService.js exports configure() and the six named operations, with both a window.X and module.exports surface', () => {
  assert.match(moduleContent, /window\.QuickLogService = API/);
  assert.match(moduleContent, /module\.exports = API/);
  assert.match(moduleContent, /configure: configure,/);
  ['capQuick', 'learnQuickItems', 'scoreQuick', 'togglePin', 'removeItem', 'commitQuickItem'].forEach((name) => {
    assert.match(moduleContent, new RegExp(name + ':\\s*' + name));
  });
});
