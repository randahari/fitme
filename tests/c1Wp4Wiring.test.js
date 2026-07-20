// C1-WP4 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP4).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as
// tests/b2Wiring.test.js / tests/b5Wiring.test.js / tests/c1Wp0Characterization.test.js /
// tests/c1Wp1Wiring.test.js / tests/c1Wp2Wiring.test.js / tests/c1Wp3Wiring.test.js.
// Run with: node --test tests/c1Wp4Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const memoryJs = fs.readFileSync(path.join(__dirname, '../js/memory.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

const WP4_FILES = [
  'js/app/runtimeState.js', 'js/app/bootstrapController.js', 'js/app/authSessionController.js'
];

test('all three WP4 modules are registered in index.html, loaded after the WP3 repositories and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const lastRepoIdx = indexHtml.indexOf('js/repositories/barcodeRepository.js');
  WP4_FILES.forEach((f) => {
    const idx = indexHtml.indexOf(f);
    assert.notEqual(idx, -1, f + ' script tag must exist');
    assert.ok(idx > lastRepoIdx, f + ' must load after the WP3 repositories');
    assert.ok(idx < appIdx, f + ' must load before app.js');
  });
});

test('all three WP4 modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  WP4_FILES.forEach((f) => assert.notEqual(swJs.indexOf('/fitme/' + f), -1, f + ' must be in the SHELL cache list'));
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.29.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.29.0');
});

test('the authentication lifecycle routes through AuthSessionController — no direct AuthAdapter.onAuthStateChanged call remains in app.js', () => {
  assert.match(appJs, /RuntimeState\.configure\(\{/);
  assert.match(appJs, /BootstrapController\.configure\(\{/);
  assert.match(appJs, /AuthSessionController\.configure\(\{/);
  assert.match(appJs, /AuthSessionController\.start\(\);/);
  assert.equal(appJs.indexOf('AuthAdapter.onAuthStateChanged('), -1, 'no direct subscription should remain in app.js — it must live in authSessionController.js');
});

test('loadUserData delegates its parallel fetch to BootstrapController.loadUserSnapshot, keeping its own post-load decisions (darkMode/migration/waterCount/favorites/quickItems) in app.js', () => {
  assert.match(appJs, /const \[profileDoc, todayDoc, favDoc\] = await BootstrapController\.loadUserSnapshot\(currentUser\.uid, todayKey\);/);
  assert.match(appJs, /darkMode = userProfile\.darkMode \|\| false;/);
  assert.match(appJs, /if \(!userProfile\.groupId && userProfile\.groupCode\)/);
});

test('RuntimeState is configured with closures over the bare currentUser/userProfile/todayData variables (not bare references), preserving js/memory.js compatibility', () => {
  const idx = appJs.indexOf('RuntimeState.configure({');
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /getCurrentUser: function \(\) \{ return currentUser; \}/);
  assert.match(body, /setCurrentUser: function \(u\) \{ currentUser = u; \}/);
  assert.match(body, /getProfile: function \(\) \{ return userProfile; \}/);
  assert.match(body, /setProfile: function \(p\) \{ userProfile = p; \}/);
  assert.match(body, /getDisplayedDay: function \(\) \{ return todayData; \}/);
  assert.match(body, /setDisplayedDay: function \(d\) \{ todayData = d; \}/);
});

test('AuthSessionController is configured with a loadUserData closure (not a bare reference), since loadUserData is reassigned later by the Day Navigation IIFE', () => {
  const idx = appJs.indexOf('AuthSessionController.configure({');
  const body = appJs.slice(idx, appJs.indexOf('\nAuthSessionController.start();', idx));
  assert.match(body, /loadUserData: function \(\) \{ return loadUserData\(\); \}/);
});

// Independent Engineering Review (C1-WP4) blocking finding: docs/specs/C1_SPEC_v1.0.md §25
// maps _resetAppCoreState to "runtime-state owner + session cleanup registration" — its
// identity/displayed-day reset must route through RuntimeState.resetForSession() rather than
// bypassing it with raw assignments. Every other domain's reset (day-navigation bookkeeping,
// workout/onboarding/coach/adaptive state, camera/timer cleanup, DOM clearing) stays untouched.
test('_resetAppCoreState routes its identity/displayed-day reset through RuntimeState.resetForSession(), leaving every other domain reset and the cleanup registration untouched', () => {
  const idx = appJs.indexOf('function _resetAppCoreState()');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\nSessionLifecycle.registerCleanup', idx));
  assert.match(body, /function _resetAppCoreState\(\) \{\s*RuntimeState\.resetForSession\(\);/);
  assert.equal(body.indexOf('currentUser = null;'), -1, 'the direct currentUser assignment must be removed — it now lives inside RuntimeState.resetForSession()');
  assert.equal(body.indexOf('userProfile = null;'), -1, 'the direct userProfile assignment must be removed — it now lives inside RuntimeState.resetForSession()');
  assert.equal(body.indexOf('todayData = { meals: [], burned: 0, steps: 0 };'), -1, 'the direct todayData assignment must be removed — it now lives inside RuntimeState.resetForSession()');
  assert.match(body, /waterCount = 0;/);
  assert.match(body, /currentDayKey = getTodayKey\(\);/);
  assert.match(body, /realTodayData = todayData;/);
  assert.match(body, /realWaterCount = 0;/);
  assert.match(body, /workoutType = null;/);
  assert.match(body, /obData = \{ gender: 'male', days: '2', goal: null, coachStyle: 'mixed', coachChatter: 'balanced' \};/);
  assert.match(body, /pendingMeal = null;/);
  assert.match(body, /_adaptProposal = null;/);
  assert.match(body, /try \{ stopBarcodeReader\(\); \} catch \(e\) \{\}/);
  assert.match(body, /try \{ closeBarcode\(\); \} catch \(e\) \{\}/);
  assert.match(body, /try \{ closeLabelPrompt\(\); \} catch \(e\) \{\}/);
  assert.match(appJs, /SessionLifecycle\.registerCleanup\('app-core-state', _resetAppCoreState\)/);
});

test('RuntimeState.resetForSession() is actually wired into production code (not dead API surface)', () => {
  assert.match(appJs, /RuntimeState\.resetForSession\(\);/);
});

test('js/memory.js compatibility: currentUser/userProfile/saveProfile still exist as bare app.js identifiers memory.js can read', () => {
  assert.match(appJs, /let currentUser = null;/);
  assert.match(appJs, /let userProfile = null;/);
  assert.match(appJs, /async function saveProfile\(\)/);
  // memory.js itself must be untouched by this work package
  assert.match(memoryJs, /if \(!currentUser\) throw new Error\('no user'\);/);
  assert.match(memoryJs, /if \(!currentUser \|\| !userProfile\) return;/);
});

test('runtimeState.js exposes no generic get(key)/set(key,value), no arbitrary patching, and no service-locator surface', () => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'js/app/runtimeState.js'), 'utf8');
  const code = content.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function get\(key/);
  assert.doesNotMatch(code, /function set\(key/);
  assert.doesNotMatch(code, /\bpatch\(/);
  const API_NAMES = ['configure', 'getCurrentUser', 'setAuthenticatedUser', 'getProfile', 'replaceProfile', 'getDisplayedDay', 'replaceDisplayedDay', 'resetForSession'];
  const exportMatch = code.match(/var API = \{([\s\S]*?)\};/);
  assert.notEqual(exportMatch, null);
  API_NAMES.forEach((name) => assert.match(exportMatch[1], new RegExp('\\b' + name + '\\b'), name + ' must be part of the exported API'));
});

test('no repository/adapter is duplicated or re-implemented by the WP4 modules; BootstrapController only wraps the three repositories via configure()', () => {
  const bootstrapContent = fs.readFileSync(path.join(__dirname, '..', 'js/app/bootstrapController.js'), 'utf8');
  assert.doesNotMatch(bootstrapContent, /\bdb\./, 'bootstrapController.js must not touch Firestore directly — only through injected repositories');
  assert.doesNotMatch(bootstrapContent, /collection\(/);
  ['profileRepository', 'dayRepository', 'favoritesRepository'].forEach((name) => {
    assert.match(bootstrapContent, new RegExp('deps\\.' + name));
  });
});

// C1-WP5A legitimately added js/nutrition/ (nutritionAnalysisService.js) after this test was
// written — the closed set below was updated in the same commit to include it. The three WP4
// modules themselves must still never reference nutritionAnalysisService or any WP5B-F name.
test('no WP5B+ vocabulary was introduced into the WP4 modules; only the C1-WP5A directory was added', () => {
  const dirs = fs.readdirSync(path.join(__dirname, '../js'));
  assert.deepEqual(dirs.filter((d) => fs.statSync(path.join(__dirname, '../js', d)).isDirectory()).sort(),
    ['adapters', 'app', 'core', 'domain', 'nutrition', 'repositories']);
  const appDirFiles = fs.readdirSync(path.join(__dirname, '../js/app')).sort();
  assert.deepEqual(appDirFiles, ['authSessionController.js', 'bootstrapController.js', 'runtimeState.js']);
  [fs.readFileSync(path.join(__dirname, '..', 'js/app/runtimeState.js'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '..', 'js/app/bootstrapController.js'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '..', 'js/app/authSessionController.js'), 'utf8')
  ].forEach((content) => {
    assert.doesNotMatch(content, /nutritionAnalysisService|mealDraft|mealCommitService|quickLogService|mealEditorPresenter|foodController/);
    assert.doesNotMatch(content, /coachPromptComposer|coachService|coachPresenter/);
    assert.doesNotMatch(content, /adaptiveTdeeDomain|adaptiveTdeeController|adaptiveTdeePresenter/);
    assert.doesNotMatch(content, /triggerDomain|triggerController|triggerPresenter/);
  });
});

test('SessionLifecycle itself remains untouched and authoritative — reset()/registerCleanup()/isCurrent()/getGeneration() calls route through the real module, not a WP4 re-implementation', () => {
  const sessionLifecycleJs = fs.readFileSync(path.join(__dirname, '..', 'js/sessionLifecycle.js'), 'utf8');
  assert.match(sessionLifecycleJs, /function reset\(reason\) \{/);
  assert.match(sessionLifecycleJs, /_generation\+\+;/);
  const authControllerContent = fs.readFileSync(path.join(__dirname, '..', 'js/app/authSessionController.js'), 'utf8');
  assert.doesNotMatch(authControllerContent, /_generation/, 'authSessionController.js must not reimplement generation tracking — it must delegate to the injected sessionLifecycle');
  assert.match(authControllerContent, /deps\.sessionLifecycle\.reset\(/);
  assert.match(authControllerContent, /deps\.sessionLifecycle\.isCurrent\(/);
});

test('no adapter/UI-decision leakage: no alert()/confirm()/document. calls in any WP4 module', () => {
  WP4_FILES.forEach((f) => {
    const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const code = content.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
    assert.doesNotMatch(code, /\balert\(/, f + ' must not call alert()');
    assert.doesNotMatch(code, /\bconfirm\(/, f + ' must not call confirm()');
    assert.doesNotMatch(code, /\bdocument\./, f + ' must not touch the DOM');
  });
});

test('every WP4 module exports configure() and both a window.X and module.exports surface', () => {
  const NAMES = { 'js/app/runtimeState.js': 'RuntimeState', 'js/app/bootstrapController.js': 'BootstrapController', 'js/app/authSessionController.js': 'AuthSessionController' };
  WP4_FILES.forEach((f) => {
    const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const name = NAMES[f];
    assert.match(content, new RegExp('window\\.' + name + ' = API'));
    assert.match(content, /module\.exports = API/);
    assert.match(content, /configure: configure/);
  });
});
