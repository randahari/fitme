// C1-WP5F — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP5F).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp5fWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const moduleFile = 'js/nutrition/barcodeFlowController.js';
const moduleContent = fs.readFileSync(path.join(__dirname, '..', moduleFile), 'utf8');

test('barcodeFlowController.js is registered in index.html, loaded after quickLogService.js and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const quickLogIdx = indexHtml.indexOf('js/nutrition/quickLogService.js');
  const idx = indexHtml.indexOf(moduleFile);
  assert.notEqual(idx, -1, moduleFile + ' script tag must exist');
  assert.ok(idx > quickLogIdx, moduleFile + ' must load after js/nutrition/quickLogService.js');
  assert.ok(idx < appIdx, moduleFile + ' must load before app.js');
});

test('barcodeFlowController.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/' + moduleFile), -1, moduleFile + ' must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.36.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.36.0');
});

test('BarcodeFlowController is configured with closures for its DOM/app.js collaborators (never bare references)', () => {
  const idx = appJs.indexOf('BarcodeFlowController.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  [
    'alertFn: function (msg) { alert(msg); }',
    'showMealEditor: function (meal) { showMealEditor(meal); }',
    'startLabelCamera: function () { startLabelCamera(); }',
    'getUserProfile: function () { return userProfile; }',
    'setPendingBarcode: function (code) { pendingBarcode = code; }'
  ].forEach((snippet) => assert.ok(body.includes(snippet), 'missing or altered: ' + snippet));
  assert.match(body, /documentRef: document,/);
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
});

test('startBarcode/onBarcodeDetected/armBarcodeHint/barcodeToLabel/stopBarcodeReader/closeBarcode are one-line facades delegating to BarcodeFlowController', () => {
  assert.match(appJs, /async function startBarcode\(\) \{ return BarcodeFlowController\.startBarcode\(\); \}/);
  assert.match(appJs, /function onBarcodeDetected\(code, statusEl\) \{ return BarcodeFlowController\.onBarcodeDetected\(code, statusEl\); \}/);
  assert.match(appJs, /function armBarcodeHint\(statusEl\) \{ return BarcodeFlowController\.armBarcodeHint\(statusEl\); \}/);
  assert.match(appJs, /function barcodeToLabel\(\) \{ return BarcodeFlowController\.barcodeToLabel\(\); \}/);
  assert.match(appJs, /function stopBarcodeReader\(\) \{ return BarcodeFlowController\.stopBarcodeReader\(\); \}/);
  assert.match(appJs, /function closeBarcode\(\) \{ return BarcodeFlowController\.closeBarcode\(\); \}/);
});

test('showLabelPrompt/labelPromptCapture/closeLabelPrompt are one-line facades delegating to BarcodeFlowController', () => {
  assert.match(appJs, /function showLabelPrompt\(code\) \{ return BarcodeFlowController\.showLabelPrompt\(code\); \}/);
  assert.match(appJs, /function labelPromptCapture\(\) \{ return BarcodeFlowController\.labelPromptCapture\(\); \}/);
  assert.match(appJs, /function closeLabelPrompt\(\) \{ return BarcodeFlowController\.closeLabelPrompt\(\); \}/);
});

test('getSharedBarcodeGroup/lookupBarcodeInCache/saveBarcodeToCache/lookupBarcode are one-line facades delegating to BarcodeFlowController', () => {
  assert.match(appJs, /function getSharedBarcodeGroup\(\) \{ return BarcodeFlowController\.getSharedBarcodeGroup\(\); \}/);
  assert.match(appJs, /async function lookupBarcodeInCache\(code\) \{ return BarcodeFlowController\.lookupBarcodeInCache\(code\); \}/);
  assert.match(appJs, /async function saveBarcodeToCache\(code, item, existingAddedByName\) \{ return BarcodeFlowController\.saveBarcodeToCache\(code, item, existingAddedByName\); \}/);
  assert.match(appJs, /async function lookupBarcode\(code\) \{ return BarcodeFlowController\.lookupBarcode\(code\); \}/);
});

test('saveBarcodeToCache is still injected into MealCommitService by name, unchanged — the relocation is transparent to WP5D', () => {
  const idx = appJs.indexOf('MealCommitService.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /saveBarcodeToCache: function \(code, item, addedByName\) \{ return saveBarcodeToCache\(code, item, addedByName\); \}/);
});

test('h5qr/barcodeLastCode/barcodeHintTimer are no longer declared in app.js — fully relocated to module-private state', () => {
  assert.doesNotMatch(appJs, /\blet h5qr\b|\bvar h5qr\b/);
  assert.doesNotMatch(appJs, /\blet barcodeLastCode\b/);
  assert.doesNotMatch(appJs, /\blet barcodeHintTimer\b/);
});

test('pendingBarcode remains a shared app.js module-level variable (still read/reset by the WP4 session reset, AuthSessionController.onSignedOut, cancelFood, and analyzePhoto)', () => {
  assert.match(appJs, /let pendingBarcode = null;/);
  const occurrences = (appJs.match(/\bpendingBarcode\b/g) || []).length;
  assert.ok(occurrences >= 5, 'expected the declaration plus at least 4 read/write sites (reset, onSignedOut, cancelFood, analyzePhoto) to remain');
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bpendingBarcode\b/, 'the module must only ever set it through the injected setPendingBarcode closure, never reference the app.js variable by name');
});

test('barcodeFlowController.js requires BarcodeScannerAdapter/OpenFoodFactsClient/BarcodeRepository directly (stable WP2/WP3 modules, no override chain) rather than duplicating their logic', () => {
  assert.match(moduleContent, /require\('\.\.\/adapters\/barcodeScannerAdapter\.js'\)/);
  assert.match(moduleContent, /require\('\.\.\/adapters\/openFoodFactsClient\.js'\)/);
  assert.match(moduleContent, /require\('\.\.\/repositories\/barcodeRepository\.js'\)/);
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /html5-qrcode|Html5Qrcode|world\.openfoodfacts\.org|collection\('groupBarcodes'\)/, 'must not reimplement scanning, the OFF request, or raw Firestore paths — those stay owned by their respective WP2/WP3 modules');
});

test('barcodeFlowController.js does not perform AI requests (WP5A), build/edit a meal draft itself (WP5B), render meal-editor HTML (WP5C), or perform the final authoritative commit write (WP5D) — it only opens the editor via the injected showMealEditor', () => {
  const code = moduleContent.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /callClaude|NutritionAnalysisService/);
  assert.doesNotMatch(code, /MealDraft\.|buildDraft\(/);
  assert.doesNotMatch(code, /MealEditorPresenter/);
  assert.doesNotMatch(code, /MealCommitService|PersistenceGateway\.|persistDaySnapshot/, 'must not perform or own the authoritative write — showMealEditor only opens the editor, addMeal (WP5D) still performs the save when the user confirms');
  assert.doesNotMatch(code, /QuickLogService/);
});

test('no WP6+ vocabulary or unexpected files were introduced into js/nutrition/', () => {
  const nutritionDirFiles = fs.readdirSync(path.join(__dirname, '../js/nutrition')).sort();
  assert.deepEqual(nutritionDirFiles, ['barcodeFlowController.js', 'mealCommitService.js', 'mealDraft.js', 'mealEditorPresenter.js', 'nutritionAnalysisService.js', 'quickLogService.js']);
  assert.doesNotMatch(moduleContent, /coachProfile|coachPromptComposer|coachClient|coachPresenter/);
});

test('barcodeFlowController.js exports configure() and the thirteen named operations, with both a window.X and module.exports surface', () => {
  assert.match(moduleContent, /window\.BarcodeFlowController = API/);
  assert.match(moduleContent, /module\.exports = API/);
  [
    'startBarcode', 'onBarcodeDetected', 'armBarcodeHint', 'barcodeToLabel', 'stopBarcodeReader', 'closeBarcode',
    'showLabelPrompt', 'labelPromptCapture', 'closeLabelPrompt',
    'getSharedBarcodeGroup', 'lookupBarcodeInCache', 'saveBarcodeToCache', 'lookupBarcode'
  ].forEach((name) => {
    assert.match(moduleContent, new RegExp(name + ':\\s*' + name));
  });
});
