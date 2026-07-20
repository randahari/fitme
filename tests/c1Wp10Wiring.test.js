// C1-WP10 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP10).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository). Behavioural coverage of the extracted
// presenters/controllers themselves lives in tests/navigationController.test.js,
// tests/homePresenter.test.js, tests/profilePresenter.test.js, tests/settingsPresenter.test.js,
// tests/foodScreenPresenter.test.js, and tests/dayNavigationController.test.js.
// Run with: node --test tests/c1Wp10Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const navigationControllerJs = fs.readFileSync(path.join(__dirname, '../js/ui/navigationController.js'), 'utf8');
const homePresenterJs = fs.readFileSync(path.join(__dirname, '../js/ui/homePresenter.js'), 'utf8');
const profilePresenterJs = fs.readFileSync(path.join(__dirname, '../js/ui/profilePresenter.js'), 'utf8');
const settingsPresenterJs = fs.readFileSync(path.join(__dirname, '../js/ui/settingsPresenter.js'), 'utf8');
const foodScreenPresenterJs = fs.readFileSync(path.join(__dirname, '../js/ui/foodScreenPresenter.js'), 'utf8');
const dayNavigationControllerJs = fs.readFileSync(path.join(__dirname, '../js/ui/dayNavigationController.js'), 'utf8');

// ── index.html / sw.js / version ────────────────────────────────────────────────────────

test('all six js/ui/*.js modules are registered in index.html, after registerEngines.js and before app.js', () => {
  const registerEnginesIdx = indexHtml.indexOf('js/engines/registerEngines.js');
  const iNav = indexHtml.indexOf('js/ui/navigationController.js');
  const iHome = indexHtml.indexOf('js/ui/homePresenter.js');
  const iProfile = indexHtml.indexOf('js/ui/profilePresenter.js');
  const iSettings = indexHtml.indexOf('js/ui/settingsPresenter.js');
  const iFood = indexHtml.indexOf('js/ui/foodScreenPresenter.js');
  const iDayNav = indexHtml.indexOf('js/ui/dayNavigationController.js');
  const appIdx = indexHtml.indexOf('js/app.js');
  [iNav, iHome, iProfile, iSettings, iFood, iDayNav].forEach((i) => assert.notEqual(i, -1));
  assert.ok(registerEnginesIdx < iNav, 'js/ui/*.js modules must load after registerEngines.js');
  [iNav, iHome, iProfile, iSettings, iFood, iDayNav].forEach((i) => assert.ok(i < appIdx, 'js/ui/*.js modules must load before app.js'));
});

test('all six js/ui/*.js modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  [
    'navigationController.js', 'homePresenter.js', 'profilePresenter.js',
    'settingsPresenter.js', 'foodScreenPresenter.js', 'dayNavigationController.js'
  ].forEach((f) => {
    assert.notEqual(swJs.indexOf('/fitme/js/ui/' + f), -1, f + ' must be in the SHELL cache list');
  });
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.39.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.39.0');
});

// ── module contracts: configure()/window.X/module.exports on all six modules ───────────

const MODULES = [
  { name: 'NavigationController', code: navigationControllerJs, ops: ['goToScreen'] },
  { name: 'HomePresenter', code: homePresenterJs, ops: ['renderHome', 'renderMealsInHome'] },
  { name: 'ProfilePresenter', code: profilePresenterJs, ops: ['renderProfile', 'getAvatarSVG', 'renderWeightChart', 'renderAchievements'] },
  { name: 'SettingsPresenter', code: settingsPresenterJs, ops: ['renderSettings'] },
  { name: 'FoodScreenPresenter', code: foodScreenPresenterJs, ops: ['renderFoodMeals', 'renderFavoritesList', 'switchFoodTab'] },
  {
    name: 'DayNavigationController', code: dayNavigationControllerJs,
    ops: ['applyHomeChrome', 'updateFoodDateBanner', 'dayNavPrev', 'dayNavNext', 'dayNavToday',
      'deleteHomeMeal', 'editHomeMeal', 'saveEditedMeal', 'deleteEditedMeal', 'cancelEditedMeal',
      'showMealEditor', 'renderEditor', 'addMeal', 'loadUserData']
  }
];

MODULES.forEach((m) => {
  test(m.name + ' exports configure() + its named operations, with both a window.X and module.exports surface, and exactly one top-level IIFE', () => {
    assert.match(m.code, new RegExp('window\\.' + m.name + ' = API'));
    assert.match(m.code, /module\.exports = API/);
    assert.match(m.code, /configure:\s*configure/);
    m.ops.forEach((op) => assert.match(m.code, new RegExp(op + ':\\s*' + op)));
    const iifeCount = (m.code.match(/^\(function\s*\(\s*\)\s*\{/gm) || []).length;
    assert.equal(iifeCount, 1);
  });
});

test('none of the six js/ui/*.js modules touch Firebase/db, PersistenceGateway, or SessionAccess directly — all durable-write and session-guard vocabulary is injected', () => {
  MODULES.forEach((m) => {
    if (m.name === 'DayNavigationController') return; // sessionLifecycle is legitimately injected (a dependency name, not a bare reference)
    const code = m.code.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    assert.doesNotMatch(code, /\bdb\./, m.name + ' must not touch Firestore directly');
    assert.doesNotMatch(code, /PersistenceGateway/, m.name + ' must not reference PersistenceGateway directly');
  });
});

test('DayNavigationController requires DateUtils/MealDraft/MealEditorPresenter/MealCommitService directly (stable B1/WP1/WP5 modules, no override chain) and never touches db/PersistenceGateway itself', () => {
  assert.match(dayNavigationControllerJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
  assert.match(dayNavigationControllerJs, /require\('\.\.\/nutrition\/mealDraft\.js'\)/);
  assert.match(dayNavigationControllerJs, /require\('\.\.\/nutrition\/mealEditorPresenter\.js'\)/);
  assert.match(dayNavigationControllerJs, /require\('\.\.\/nutrition\/mealCommitService\.js'\)/);
  const code = dayNavigationControllerJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /PersistenceGateway/);
});

test('HomePresenter requires StringUtils directly (stable B1/WP1 module) and does not reimplement esc() inline', () => {
  assert.match(homePresenterJs, /require\('\.\.\/core\/stringUtils\.js'\)/);
  assert.doesNotMatch(homePresenterJs, /function esc\(/);
});

test('ProfilePresenter requires ProfileMetrics directly (stable B1/WP1 module) and does not reimplement calcBMI/getBMICategory/calcBodyFat inline', () => {
  assert.match(profilePresenterJs, /require\('\.\.\/domain\/profileMetrics\.js'\)/);
  assert.doesNotMatch(profilePresenterJs, /function calcBMI\(|function getBMICategory\(|function calcBodyFat\(/);
});

// ── app.js: composition + facades, no controller logic remains ─────────────────────────

test('app.js configures all six js/ui/*.js modules', () => {
  ['NavigationController.configure({', 'HomePresenter.configure({', 'ProfilePresenter.configure({',
    'SettingsPresenter.configure({', 'FoodScreenPresenter.configure({', 'DayNavigationController.configure({'
  ].forEach((snippet) => assert.notEqual(appJs.indexOf(snippet), -1, snippet + ' must exist in app.js'));
});

test('NavigationController is configured with documentRef and closures for every per-screen render/update call, plus updateFoodDateBanner', () => {
  const idx = appJs.indexOf('NavigationController.configure({');
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  [
    'documentRef: document,', 'renderHome: function () { renderHome(); },',
    'renderFoodMeals: function () { renderFoodMeals(); },', 'renderFavoritesList: function () { renderFavoritesList(); },',
    'renderQuickStrip: function () { renderQuickStrip(); },', 'maybeShowQuickLearn: function () { maybeShowQuickLearn(); },',
    'renderProfile: function () { renderProfile(); },', 'renderSettings: function () { renderSettings(); },',
    'updateWorkout: function () { updateWorkout(); },'
  ].forEach((snippet) => assert.ok(body.includes(snippet), 'missing or altered: ' + snippet));
  assert.match(body, /updateFoodDateBanner: function \(\) \{ return DayNavigationController\.updateFoodDateBanner\(\); \}/);
});

test('HomePresenter is configured with applyDateNavChrome routed through DayNavigationController.applyHomeChrome', () => {
  const idx = appJs.indexOf('HomePresenter.configure({');
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /applyDateNavChrome: function \(\) \{ return DayNavigationController\.applyHomeChrome\(\); \}/);
  assert.match(body, /renderMealsInHome: function \(\) \{ renderMealsInHome\(\); \}/);
});

test('ProfilePresenter/SettingsPresenter are configured with goalLabels: GOAL_LABELS (shared constant, not re-declared)', () => {
  const profileIdx = appJs.indexOf('ProfilePresenter.configure({');
  const profileBody = appJs.slice(profileIdx, appJs.indexOf('});', profileIdx));
  assert.match(profileBody, /goalLabels: GOAL_LABELS,/);
  assert.match(profileBody, /achievements: ACHIEVEMENTS,/);

  const settingsIdx = appJs.indexOf('SettingsPresenter.configure({');
  const settingsBody = appJs.slice(settingsIdx, appJs.indexOf('});', settingsIdx));
  assert.match(settingsBody, /goalLabels: GOAL_LABELS,/);
  assert.match(settingsBody, /appVersion: APP_VERSION,/);
});

test('DayNavigationController is configured with getter/setter closures for currentDayKey/todayData/waterCount/realTodayData/realWaterCount/editingExisting/editingItemIdx/pendingMeal, plus dayRepository/sessionLifecycle/appVersion', () => {
  const idx = appJs.indexOf('DayNavigationController.configure({');
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  [
    'documentRef: document,', 'sessionLifecycle: SessionLifecycle,', 'appVersion: APP_VERSION,', 'dayRepository: DayRepository,',
    'getCurrentDayKey: function () { return currentDayKey; },', 'setCurrentDayKey: function (v) { currentDayKey = v; },',
    'getTodayData: function () { return todayData; },', 'setTodayData: function (v) { todayData = v; },',
    'getWaterCount: function () { return waterCount; },', 'setWaterCount: function (v) { waterCount = v; },',
    'getRealTodayData: function () { return realTodayData; },', 'setRealTodayData: function (v) { realTodayData = v; },',
    'getRealWaterCount: function () { return realWaterCount; },', 'setRealWaterCount: function (v) { realWaterCount = v; },',
    'getEditingExisting: function () { return editingExisting; },', 'setEditingExisting: function (v) { editingExisting = v; },',
    'getEditingItemIdx: function () { return editingItemIdx; },', 'setEditingItemIdx: function (v) { editingItemIdx = v; },',
    'getPendingMeal: function () { return pendingMeal; },', 'setPendingMeal: function (v) { pendingMeal = v; },',
    "loadUserDataCore: function () { return _loadUserDataCore(); }"
  ].forEach((snippet) => assert.ok(body.includes(snippet), 'missing or altered: ' + snippet));
});

test('_loadUserDataCore exists exactly once in app.js (the renamed base loadUserData body) and there is no bare "loadUserData" async function other than the public facade', () => {
  const coreMatches = appJs.match(/^async function _loadUserDataCore\(\)/gm) || [];
  assert.equal(coreMatches.length, 1);
  const facadeMatches = appJs.match(/^async function loadUserData\(\)/gm) || [];
  assert.equal(facadeMatches.length, 1);
});

test('window.dayNavPrev/dayNavNext/dayNavToday/deleteHomeMeal/editHomeMeal/saveEditedMeal/deleteEditedMeal/cancelEditedMeal/updateFoodDateBanner are one-line facades delegating to DayNavigationController (WP0 compatibility surface preserved)', () => {
  [
    ['dayNavPrev', ''], ['dayNavNext', ''], ['dayNavToday', ''],
    ['deleteHomeMeal', 'idx'], ['editHomeMeal', 'idx'], ['saveEditedMeal', ''],
    ['deleteEditedMeal', ''], ['cancelEditedMeal', ''], ['updateFoodDateBanner', '']
  ].forEach(([name, arg]) => {
    const argPattern = arg ? '\\(' + arg + '\\)' : '\\(\\s*\\)';
    const re = new RegExp('window\\.' + name + ' = function ' + argPattern + ' \\{ return DayNavigationController\\.' + name + '\\(' + arg + '\\); \\};');
    assert.match(appJs, re, 'window.' + name + ' facade missing or altered');
  });
});

test('app.js no longer contains any UI controller/presenter rendering logic (DOM template strings previously in goToScreen/renderHome/renderMealsInHome/renderProfile/renderSettings/showMealEditor/renderEditor/renderFoodMeals/renderFavoritesList/switchFoodTab, or the Day Navigation IIFE)', () => {
  [
    'OVERRIDE: goToScreen', 'OVERRIDE: renderHome with ring', 'ring-arc', 'prof-avatar-svg',
    'plan-targets-settings', 'fitme-version-tag', 'food-meals-list', 'favorites-list',
    'date-nav', 'food-date-banner', 'MAX_PAST_DAYS'
  ].forEach((needle) => {
    assert.equal(appJs.indexOf(needle), -1, needle + ' must no longer appear in js/app.js');
  });
});

// ── no unexpected files/vocabulary introduced ───────────────────────────────────────────

test('js/ui/ contains exactly the six expected WP10 files', () => {
  const files = fs.readdirSync(path.join(__dirname, '../js/ui')).sort();
  assert.deepEqual(files, [
    'dayNavigationController.js', 'foodScreenPresenter.js', 'homePresenter.js',
    'navigationController.js', 'profilePresenter.js', 'settingsPresenter.js'
  ]);
});

test('none of the six js/ui/*.js modules reference each other directly (all cross-module wiring goes through app.js facades, same convention as every prior WP)', () => {
  const names = MODULES.map((m) => m.name);
  MODULES.forEach((m) => {
    names.filter((n) => n !== m.name).forEach((other) => {
      // word-boundary lookbehind so 'NavigationController.' doesn't false-positive-match inside
      // 'DayNavigationController.' (a different, legitimately-distinct module name).
      const re = new RegExp('(?<![A-Za-z])' + other + '\\.');
      assert.doesNotMatch(m.code, re, m.name + ' must not reference ' + other + ' directly');
    });
  });
});
