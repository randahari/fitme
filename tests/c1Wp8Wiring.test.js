// C1-WP8 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP8).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp8Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const domainJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerDomain.js'), 'utf8');
const controllerJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerController.js'), 'utf8');

test('both trigger modules are registered in index.html, loaded after adaptiveTdeeController.js, domain before controller, and both before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const adaptiveIdx = indexHtml.indexOf('js/adaptive/adaptiveTdeeController.js');
  const iDomain = indexHtml.indexOf('js/trigger/triggerDomain.js');
  const iController = indexHtml.indexOf('js/trigger/triggerController.js');
  assert.notEqual(iDomain, -1); assert.notEqual(iController, -1);
  assert.ok(adaptiveIdx < iDomain, 'triggerDomain.js must load after adaptiveTdeeController.js');
  assert.ok(iDomain < iController, 'triggerDomain.js must load before triggerController.js (direct require)');
  assert.ok(iController < appIdx, 'both must load before app.js');
});

test('both trigger modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/trigger/triggerDomain.js'), -1);
  assert.notEqual(swJs.indexOf('/fitme/js/trigger/triggerController.js'), -1);
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.38.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.38.0');
});

// ── triggerDomain.js: pure module ───────────────────────────────────────────────────────

test('triggerDomain.js is a pure module: no configure(), no window/document/db/alert/confirm/AI/persistence', () => {
  const code = domainJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function configure\(/);
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /\balert\(/);
  assert.doesNotMatch(code, /callClaude|coachMessage|DerivedIntelligenceConsumer/);
  assert.doesNotMatch(code, /PersistenceGateway|SessionLifecycle|NotificationAdapter/);
  // profile/history/todayNutrition/todayData/triggerProfile are legitimate local parameter
  // names in this module's pure functions — not references to app.js globals. Only
  // userProfile/currentUser/coachDay()/ensureCoachMemory() would indicate an actual global
  // read (deliberately left in app.js — see this file's header comment).
  assert.doesNotMatch(code, /\buserProfile\b|\bcurrentUser\b|coachDay\(\)|ensureCoachMemory\(\)/, 'must take all state as parameters, never read app.js globals');
});

test('triggerDomain.js requires AdaptiveTdeeDomain/CoachProfile/ProfileMetrics/DateUtils directly (stable WP6/WP7/WP1 pure modules, no override chain)', () => {
  assert.match(domainJs, /require\('\.\.\/adaptive\/adaptiveTdeeDomain\.js'\)/);
  assert.match(domainJs, /require\('\.\.\/coach\/coachProfile\.js'\)/);
  assert.match(domainJs, /require\('\.\.\/domain\/profileMetrics\.js'\)/);
  assert.match(domainJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
});

test('triggerDomain.js exports the ten named pure functions plus PRIO/COACH_DAILY_BUDGET, with both a window.X and module.exports surface', () => {
  assert.match(domainJs, /window\.TriggerDomain = API/);
  assert.match(domainJs, /module\.exports = API/);
  [
    'canFire', 'evalRedFlag', 'evalForgotToEat', 'evalLowProtein', 'evalNoWorkout',
    'evalCloseToGoal', 'evalStreakMilestone', 'selectTrigger', 'proteinFoodHint', 'triggerLocalText'
  ].forEach((name) => assert.match(domainJs, new RegExp(name + ':\\s*' + name)));
  assert.match(domainJs, /PRIO:\s*PRIO/);
  assert.match(domainJs, /COACH_DAILY_BUDGET:\s*COACH_DAILY_BUDGET/);
});

// ── triggerController.js ────────────────────────────────────────────────────────────────

test('triggerController.js requires TriggerDomain/NotificationAdapter/ProfileMetrics directly (stable modules, no override chain)', () => {
  assert.match(controllerJs, /require\('\.\/triggerDomain\.js'\)/);
  assert.match(controllerJs, /require\('\.\.\/adapters\/notificationAdapter\.js'\)/);
  assert.match(controllerJs, /require\('\.\.\/domain\/profileMetrics\.js'\)/);
});

test('triggerController.js does not reimplement pure trigger-evaluation logic — only calls TriggerDomain for it', () => {
  const code = controllerJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function evalRedFlag|function evalForgotToEat|function evalLowProtein|function evalNoWorkout|function evalCloseToGoal|function evalStreakMilestone|function selectTrigger/, 'must not reimplement domain logic — only call TriggerDomain');
});

test('triggerController.js exports configure() and the six named operations, with both a window.X and module.exports surface', () => {
  assert.match(controllerJs, /window\.TriggerController = API/);
  assert.match(controllerJs, /module\.exports = API/);
  [
    'runCoachTriggers', 'presentTriggerCard', 'triggerLiveText', 'fireWorkoutTrigger',
    'presentWorkoutTriggerCard', 'scheduleLocalNotifications'
  ].forEach((name) => assert.match(controllerJs, new RegExp(name + ':\\s*' + name)));
});

// ── app.js facades ──────────────────────────────────────────────────────────────────────

test('TriggerController is configured in app.js with closures for DOM/session/state/persistence/notification/coach (wrapped or cross-boundary)', () => {
  const idx = appJs.indexOf('TriggerController.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /documentRef: document,/);
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
  assert.match(body, /goalLabels: GOAL_LABELS,/);
  assert.match(body, /getUserProfile: function \(\) \{ return userProfile; \}/);
  assert.match(body, /getTodayData: function \(\) \{ return todayData; \}/);
  assert.match(body, /persistenceSummaryFn: function \(result\) \{ return persistenceSummary\(result\); \}/);
  assert.match(body, /scheduleAtFn: function \(hour, min, callback\) \{ return scheduleAt\(hour, min, callback\); \}/);
  assert.match(body, /sendLocalNotificationFn: function \(title, body\) \{ return sendLocalNotification\(title, body\); \}/);
  assert.match(body, /coachNameFn: function \(\) \{ return coachName\(\); \}/);
  assert.match(body, /coachMessageFn: function \(context\) \{ return coachMessage\(context\); \}/);
  assert.match(body, /coachLineFn: function \(kind, d\) \{ return coachLine\(kind, d\); \}/);
});

test('the six application/UI functions are one-line facades delegating to TriggerController', () => {
  assert.match(appJs, /async function triggerLiveText\(t\) \{ return TriggerController\.triggerLiveText\(t\); \}/);
  assert.match(appJs, /async function runCoachTriggers\(access\) \{ return TriggerController\.runCoachTriggers\(access\); \}/);
  assert.match(appJs, /async function presentTriggerCard\(t, sessionGeneration\) \{ return TriggerController\.presentTriggerCard\(t, sessionGeneration\); \}/);
  assert.match(appJs, /async function fireWorkoutTrigger\(burn, access\) \{ return TriggerController\.fireWorkoutTrigger\(burn, access\); \}/);
  assert.match(appJs, /async function presentWorkoutTriggerCard\(burn, goal, sessionGeneration\) \{ return TriggerController\.presentWorkoutTriggerCard\(burn, goal, sessionGeneration\); \}/);
  assert.match(appJs, /function scheduleLocalNotifications\(access\) \{ return TriggerController\.scheduleLocalNotifications\(access\); \}/);
});

test('the eight pure evaluator/helper functions are one-line facades delegating to TriggerDomain, supplying userProfile/todayData explicitly where the original read them implicitly', () => {
  assert.match(appJs, /function proteinFoodHint\(\) \{ return TriggerDomain\.proteinFoodHint\(userProfile\); \}/);
  assert.match(appJs, /function evalRedFlag\(history, profile\) \{ return TriggerDomain\.evalRedFlag\(history, profile, todayData\); \}/);
  assert.match(appJs, /function evalForgotToEat\(todayNutrition\) \{ return TriggerDomain\.evalForgotToEat\(todayNutrition\); \}/);
  assert.match(appJs, /function evalLowProtein\(history, triggerProfile, todayNutrition\) \{ return TriggerDomain\.evalLowProtein\(history, triggerProfile, todayNutrition\); \}/);
  assert.match(appJs, /function evalNoWorkout\(history, triggerProfile, todayNutrition\) \{ return TriggerDomain\.evalNoWorkout\(history, triggerProfile, todayNutrition\); \}/);
  assert.match(appJs, /function evalCloseToGoal\(triggerProfile, todayNutrition\) \{ return TriggerDomain\.evalCloseToGoal\(triggerProfile, todayNutrition\); \}/);
  assert.match(appJs, /function evalStreakMilestone\(triggerProfile\) \{ return TriggerDomain\.evalStreakMilestone\(triggerProfile\); \}/);
  assert.match(appJs, /function triggerLocalText\(t\) \{ return TriggerDomain\.triggerLocalText\(userProfile, t\); \}/);
});

test('canFire is a one-line facade: TriggerDomain.canFire(coachDay(), type, priority) — coachDay() itself untouched (frozen B3 territory)', () => {
  assert.match(appJs, /function canFire\(type, priority\) \{ return TriggerDomain\.canFire\(coachDay\(\), type, priority\); \}/);
});

test('PRIO and COACH_DAILY_BUDGET no longer exist as app.js top-level constants (relocated to triggerDomain.js)', () => {
  assert.equal(appJs.indexOf('const PRIO ='), -1);
  assert.equal(appJs.indexOf('const COACH_DAILY_BUDGET ='), -1);
});

// ── frozen B3 territory left untouched ──────────────────────────────────────────────────

test('COACH_EVENTS_CAP stays in app.js — still used at the frozen B3 recordCoachEvent wiring site, unlike PRIO/COACH_DAILY_BUDGET', () => {
  assert.match(appJs, /const COACH_EVENTS_CAP = 200;/);
  assert.match(appJs, /COACH_EVENTS_CAP/);
});

test('ensureCoachMemory/coachDay (frozen B3 StateAccess.configure() entanglement) are untouched — still full implementations in app.js, not delegated to TriggerDomain/TriggerController', () => {
  const ensureIdx = appJs.search(/function ensureCoachMemory\s*\(/);
  assert.notEqual(ensureIdx, -1);
  const ensureBody = appJs.slice(ensureIdx, appJs.indexOf('\n}', ensureIdx));
  assert.doesNotMatch(ensureBody, /TriggerDomain|TriggerController/);

  const coachDayIdx = appJs.search(/function coachDay\s*\(/);
  assert.notEqual(coachDayIdx, -1);
  const coachDayBody = appJs.slice(coachDayIdx, appJs.indexOf('\n}', coachDayIdx));
  assert.doesNotMatch(coachDayBody, /TriggerDomain|TriggerController/);
});

test('the frozen B3 StateAccess.configure() checkCanFire/getTriggerBudget/ensureCoachMemoryShape bare-reference wiring is untouched', () => {
  assert.match(appJs, /checkCanFire: canFire,/);
  assert.match(appJs, /getTriggerBudget: coachDay/);
  assert.match(appJs, /ensureCoachMemoryShape: ensureCoachMemory,/);
});

test('computeProteinTarget/proteinTarget (WP1 permanent facade, out of WP8 scope) are untouched — triggerDomain.js requires ProfileMetrics directly instead of duplicating or routing through them', () => {
  assert.match(appJs, /function computeProteinTarget\(weight\) \{ return ProfileMetrics\.computeProteinTarget\(weight\); \}/);
  assert.doesNotMatch(domainJs, /computeProteinTarget\s*:\s*function|function computeProteinTarget/);
});

// C1-WP9 relocated the triggerEngine Engine Registry registration out of app.js's B2
// STAGE 8 tail IIFE into js/engines/triggerEngineAdapter.js (intentional — see
// tests/c1Wp9Wiring.test.js) — it now calls TriggerController.runCoachTriggers/
// presentTriggerCard directly instead of via app.js facade names, same tier as every
// other WP9 adapter calling its WP7/WP8 controller directly.
test('the triggerEngine Engine Registry registration now lives in js/engines/triggerEngineAdapter.js (C1-WP9) — still calls TriggerController.runCoachTriggers/presentTriggerCard', () => {
  const adapterJs = fs.readFileSync(path.join(__dirname, '../js/engines/triggerEngineAdapter.js'), 'utf8');
  assert.match(adapterJs, /await TriggerController\.runCoachTriggers\(ctx\.state\)/);
  assert.match(adapterJs, /TriggerController\.presentTriggerCard\(/);
  assert.equal(appJs.indexOf("id: 'triggerEngine'"), -1, 'the registration itself must no longer be inline in app.js');
});

test('no repository/domain module is duplicated: NotificationAdapter/ProfileMetrics each still have exactly one require() inside triggerController.js, and NotificationAdapter is not required by triggerDomain.js', () => {
  assert.equal((controllerJs.match(/require\('\.\.\/adapters\/notificationAdapter\.js'\)/g) || []).length, 1);
  assert.equal((controllerJs.match(/require\('\.\.\/domain\/profileMetrics\.js'\)/g) || []).length, 1);
  assert.doesNotMatch(domainJs, /notificationAdapter/);
});

test('no WP9+ vocabulary or unexpected files were introduced into js/trigger/', () => {
  const triggerDirFiles = fs.readdirSync(path.join(__dirname, '../js/trigger')).sort();
  assert.deepEqual(triggerDirFiles, ['triggerController.js', 'triggerDomain.js']);
  [domainJs, controllerJs].forEach((content) => {
    assert.doesNotMatch(content, /habitDomain|patternDomain|notificationDomain|triggerPresenter/);
  });
});
