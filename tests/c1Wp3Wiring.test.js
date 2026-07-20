// C1-WP3 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP3).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as
// tests/b2Wiring.test.js / tests/b5Wiring.test.js / tests/c1Wp0Characterization.test.js /
// tests/c1Wp1Wiring.test.js / tests/c1Wp2Wiring.test.js).
// Run with: node --test tests/c1Wp3Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

const REPO_FILES = [
  'js/repositories/profileRepository.js', 'js/repositories/dayRepository.js',
  'js/repositories/favoritesRepository.js', 'js/repositories/groupRepository.js',
  'js/repositories/barcodeRepository.js'
];

test('all five WP3 repository modules are registered in index.html, loaded after the WP2 adapters and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const lastAdapterIdx = indexHtml.indexOf('js/adapters/claudeProxyClient.js');
  REPO_FILES.forEach((f) => {
    const idx = indexHtml.indexOf(f);
    assert.notEqual(idx, -1, f + ' script tag must exist');
    assert.ok(idx > lastAdapterIdx, f + ' must load after the WP2 adapters');
    assert.ok(idx < appIdx, f + ' must load before app.js');
  });
});

test('all five WP3 repository modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  REPO_FILES.forEach((f) => assert.notEqual(swJs.indexOf('/fitme/' + f), -1, f + ' must be in the SHELL cache list'));
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.37.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.37.0');
});

test('all five repositories are configured in app.js before first use', () => {
  ['ProfileRepository.configure(', 'DayRepository.configure(', 'FavoritesRepository.configure(',
    'GroupRepository.configure(', 'BarcodeRepository.configure('
  ].forEach((call) => assert.notEqual(appJs.indexOf(call), -1, call + ' must appear in app.js'));
});

// C1-WP4 relocated the Promise.all parallel-fetch mechanic itself out of app.js into
// js/app/bootstrapController.js (BootstrapController.loadUserSnapshot) — intentional, per
// docs/specs/C1_SPEC_v1.0.md §C1-WP4. The three repositories are now called from inside
// that module (see tests/bootstrapController.test.js for the parallel-call proof); this
// test now asserts loadUserData delegates to it instead of calling the repositories directly.
test('loadUserData reads profile/day/favorites through BootstrapController.loadUserSnapshot (parallel-read parity preserved, mechanic relocated in C1-WP4)', () => {
  assert.match(appJs, /const \[profileDoc, todayDoc, favDoc\] = await BootstrapController\.loadUserSnapshot\(currentUser\.uid, todayKey\);/);
});

test('saveProfile/saveTodayData/saveFavorites/getHistoryData delegate to their repositories', () => {
  assert.match(appJs, /await ProfileRepository\.mergeProfile\(currentUser\.uid, userProfile\)/);
  assert.match(appJs, /await DayRepository\.saveLegacyDay\(currentUser\.uid, currentDayKey, \{/);
  assert.match(appJs, /await FavoritesRepository\.save\(currentUser\.uid, favoriteMeals\)/);
  assert.match(appJs, /return DayRepository\.fetchHistory\(currentUser\.uid\);/);
});

test('getGroupMembers, joinGroup and finishOnboarding delegate to GroupRepository, preserving their guard clauses and UI alerts', () => {
  assert.match(appJs, /return GroupRepository\.getMembers\(userProfile\.groupId, currentUser\.uid, getTodayKey\(\)\);/);
  const joinIdx = appJs.indexOf('async function joinGroup()');
  assert.notEqual(joinIdx, -1);
  const joinBody = appJs.slice(joinIdx, appJs.indexOf('\n}', joinIdx));
  assert.match(joinBody, /const exists = await GroupRepository\.groupExists\(code\);/);
  assert.match(joinBody, /alert\('קוד לא נמצא\. בדוק שוב\.'\)/);
  assert.match(joinBody, /await GroupRepository\.addMember\(code, currentUser\.uid\);/);
  assert.match(appJs, /await GroupRepository\.addMember\(groupCode, currentUser\.uid\);/);
});

// C1-WP3 originally established that lookupBarcodeInCache/saveBarcodeToCache/getSharedBarcodeGroup
// call BarcodeRepository directly from app.js. C1-WP5F subsequently relocated all three function
// bodies into js/nutrition/barcodeFlowController.js as a group (intentional — see
// tests/c1Wp5fWiring.test.js, "group cache persistence" in the WP5F spec) — app.js now only keeps
// one-line facades. This test now checks the relocated bodies still call BarcodeRepository exactly
// as before, and that app.js's own facades still exist and delegate.
test('lookupBarcodeInCache/saveBarcodeToCache delegate to BarcodeRepository, with getSharedBarcodeGroup() now living in barcodeFlowController.js (WP5F)', () => {
  const controllerJs = fs.readFileSync(path.join(__dirname, '../js/nutrition/barcodeFlowController.js'), 'utf8');
  assert.match(controllerJs, /return BarcodeRepository\.lookupInCache\(groupKey, code\);/);
  assert.match(controllerJs, /return BarcodeRepository\.saveToCache\(groupKey, code, item, addedByName, userProfile \? userProfile\.name : ''\);/);
  assert.notEqual(controllerJs.indexOf('function getSharedBarcodeGroup()'), -1, 'product-state accessor now lives in barcodeFlowController.js');
  assert.match(appJs, /function getSharedBarcodeGroup\(\) \{ return BarcodeFlowController\.getSharedBarcodeGroup\(\); \}/);
  assert.match(appJs, /async function lookupBarcodeInCache\(code\) \{ return BarcodeFlowController\.lookupBarcodeInCache\(code\); \}/);
  assert.match(appJs, /async function saveBarcodeToCache\(code, item, existingAddedByName\) \{ return BarcodeFlowController\.saveBarcodeToCache\(code, item, existingAddedByName\); \}/);
});

test('the Day Navigation IIFE loads a specific day through DayRepository', () => {
  assert.match(appJs, /const doc = await DayRepository\.loadDay\(currentUser\.uid, key\);/);
});

test('no direct db.collection()/db.runTransaction() calls remain in app.js outside the two documented exclusions (resetApp, PersistenceGateway.configure)', () => {
  const matches = [...appJs.matchAll(/db\.collection\(|db\.runTransaction\(/g)];
  // exclusions: resetApp's delete (out of WP3 scope, not spec-named) + the B4
  // PersistenceGateway.configure callbacks (mergeUserFields/replaceDayDocument/
  // runPatternTransaction) which must remain the sole authoritative write path.
  assert.equal(matches.length, 5, 'expected exactly 1 (resetApp) + 4 (PersistenceGateway.configure block) direct db references');
  const resetAppIdx = appJs.indexOf('async function resetApp()');
  const resetAppBody = appJs.slice(resetAppIdx, appJs.indexOf('\n}', resetAppIdx));
  assert.match(resetAppBody, /db\.collection\('users'\)\.doc\(currentUser\.uid\)\.delete\(\)/);
  assert.notEqual(appJs.indexOf('PersistenceGateway.configure({'), -1);
});

test('no repository file contains DOM/product-decision leakage: no alert()/confirm()/document. calls', () => {
  REPO_FILES.forEach((f) => {
    const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    // strip // line comments first — Hebrew doc-comments legitimately mention
    // userProfile/currentUser by name to explain what stays out of this module.
    const code = content.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
    assert.doesNotMatch(code, /\balert\(/, f + ' must not call alert() (UI decision belongs to the caller)');
    assert.doesNotMatch(code, /\bconfirm\(/, f + ' must not call confirm() (UI decision belongs to the caller)');
    assert.doesNotMatch(code, /\bdocument\./, f + ' must not touch the DOM');
    assert.doesNotMatch(code, /\buserProfile\b|\bcurrentUser\b|\btodayData\b/, f + ' must not reference application state directly (must be passed in as parameters)');
  });
});

test('every repository module exports configure() and both a window.X and module.exports surface', () => {
  const NAMES = { 'js/repositories/profileRepository.js': 'ProfileRepository', 'js/repositories/dayRepository.js': 'DayRepository', 'js/repositories/favoritesRepository.js': 'FavoritesRepository', 'js/repositories/groupRepository.js': 'GroupRepository', 'js/repositories/barcodeRepository.js': 'BarcodeRepository' };
  REPO_FILES.forEach((f) => {
    const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const name = NAMES[f];
    assert.match(content, new RegExp('window\\.' + name + ' = API'));
    assert.match(content, /module\.exports = API/);
    assert.match(content, /configure: configure/);
  });
});
