// C1-WP7 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP7).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp7Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const domainJs = fs.readFileSync(path.join(__dirname, '../js/adaptive/adaptiveTdeeDomain.js'), 'utf8');
const controllerJs = fs.readFileSync(path.join(__dirname, '../js/adaptive/adaptiveTdeeController.js'), 'utf8');

test('both adaptive modules are registered in index.html, loaded after coachPresenter.js, domain before controller, and both before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const coachIdx = indexHtml.indexOf('js/coach/coachPresenter.js');
  const iDomain = indexHtml.indexOf('js/adaptive/adaptiveTdeeDomain.js');
  const iController = indexHtml.indexOf('js/adaptive/adaptiveTdeeController.js');
  assert.notEqual(iDomain, -1); assert.notEqual(iController, -1);
  assert.ok(coachIdx < iDomain, 'adaptiveTdeeDomain.js must load after coachPresenter.js');
  assert.ok(iDomain < iController, 'adaptiveTdeeDomain.js must load before adaptiveTdeeController.js (direct require)');
  assert.ok(iController < appIdx, 'both must load before app.js');
});

test('both adaptive modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/adaptive/adaptiveTdeeDomain.js'), -1);
  assert.notEqual(swJs.indexOf('/fitme/js/adaptive/adaptiveTdeeController.js'), -1);
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.38.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.38.0');
});

// ── adaptiveTdeeDomain.js: pure module ──────────────────────────────────────────────────

test('adaptiveTdeeDomain.js is a pure module: no configure(), no window/document/db/alert/confirm/AI/persistence', () => {
  const code = domainJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function configure\(/);
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /\balert\(/);
  assert.doesNotMatch(code, /callClaude|coachMessage|DerivedIntelligenceConsumer/);
  assert.doesNotMatch(code, /PersistenceGateway|SessionLifecycle/);
  // todayData is a legitimate local parameter name in this module's pure functions
  // (e.g. daysInWindow(history, todayData, windowDays)) — not a reference to app.js's
  // global. Only userProfile/currentUser/window._adaptHistoryCache would indicate an
  // actual global read, and they appear only in comments (checked against stripped code).
  assert.doesNotMatch(code, /\buserProfile\b|\bcurrentUser\b|window\._adaptHistoryCache/, 'must take all state as parameters, never read app.js globals');
});

test('adaptiveTdeeDomain.js requires DateUtils/NumberUtils/NutritionModel directly (stable WP1 pure modules, no override chain)', () => {
  assert.match(domainJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
  assert.match(domainJs, /require\('\.\.\/core\/numberUtils\.js'\)/);
  assert.match(domainJs, /require\('\.\.\/domain\/nutritionModel\.js'\)/);
});

test('adaptiveTdeeDomain.js exports the eleven named pure functions plus the nine threshold constants, with both a window.X and module.exports surface', () => {
  assert.match(domainJs, /window\.AdaptiveTdeeDomain = API/);
  assert.match(domainJs, /module\.exports = API/);
  [
    'adaptRate', 'adaptEnabled', 'daysInWindow', 'classifyDay', 'pendingPartialDays',
    'computeAdaptiveTdee', 'analyzeMeasurements', 'buildWeeklySignals', 'computeNextDeficit',
    'buildAdaptiveProposal', 'adaptiveLocalExplain'
  ].forEach((name) => assert.match(domainJs, new RegExp(name + ':\\s*' + name)));
  ['ADAPT_RATES', 'KCAL_PER_KG', 'ADAPT_WINDOW_DAYS', 'ADAPT_MIN_DAYS', 'ADAPT_MIN_WEIGHTS', 'ADAPT_MIN_SPAN', 'ADAPT_CADENCE_DAYS', 'ADAPT_MAX_STEP', 'PARTIAL_FRACTION'].forEach((name) => {
    assert.match(domainJs, new RegExp(name + ':\\s*' + name));
  });
});

// ── adaptiveTdeeController.js ───────────────────────────────────────────────────────────

test('adaptiveTdeeController.js requires AdaptiveTdeeDomain/AuthorityContract/PersistenceGateway/DateUtils directly (stable modules, no override chain)', () => {
  assert.match(controllerJs, /require\('\.\/adaptiveTdeeDomain\.js'\)/);
  assert.match(controllerJs, /require\('\.\.\/authorityContract\.js'\)/);
  assert.match(controllerJs, /require\('\.\.\/persistenceGateway\.js'\)/);
  assert.match(controllerJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
});

test('adaptiveTdeeController.js does not perform AI request construction itself, does not reimplement pure computation, and never calls PersistenceGateway outside applyAdaptiveUpdate\'s single call', () => {
  const code = controllerJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /model:\s*'claude/, 'AI request construction belongs to CoachClient, not this module');
  assert.doesNotMatch(code, /function computeAdaptiveTdee|function buildWeeklySignals|function computeNextDeficit/, 'must not reimplement domain logic — only call AdaptiveTdeeDomain');
  const persistCalls = (code.match(/PersistenceGateway\.persist\(/g) || []).length;
  assert.equal(persistCalls, 1);
});

test('adaptiveTdeeController.js exports configure() and the twelve named operations, with both a window.X and module.exports surface', () => {
  assert.match(controllerJs, /window\.AdaptiveTdeeController = API/);
  assert.match(controllerJs, /module\.exports = API/);
  [
    'runAdaptiveCheck', 'renderAdaptiveCard', 'coachAdaptiveMessage', 'applyAdaptiveUpdate',
    'dismissAdaptiveUpdate', 'renderPartialPrompt', 'confirmDayLight', 'logMeasurements',
    'renderMeasurements', 'renderAdaptiveSettings', 'setAdaptiveRate', 'toggleAdaptive'
  ].forEach((name) => assert.match(controllerJs, new RegExp(name + ':\\s*' + name)));
});

// ── app.js facades ──────────────────────────────────────────────────────────────────────

test('AdaptiveTdeeController is configured in app.js with closures for renderHome/renderSettings/runEngineAction/coachMessage (wrapped or cross-boundary), plus documentRef/sessionLifecycle/state getters', () => {
  const idx = appJs.indexOf('AdaptiveTdeeController.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /documentRef: document,/);
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
  assert.match(body, /appVersion: APP_VERSION,/);
  assert.match(body, /daysHe: DAYS_HE,/);
  assert.match(body, /goalLabels: GOAL_LABELS,/);
  assert.match(body, /getUserProfile: function \(\) \{ return userProfile; \}/);
  assert.match(body, /getTodayData: function \(\) \{ return todayData; \}/);
  assert.match(body, /getCurrentUser: function \(\) \{ return currentUser; \}/);
  assert.match(body, /getAdaptProposal: function \(\) \{ return _adaptProposal; \}/);
  assert.match(body, /clearAdaptProposal: function \(\) \{ _adaptProposal = null; \}/);
  assert.match(body, /getAdaptHistoryCache: function \(\) \{ return window\._adaptHistoryCache; \}/);
  assert.match(body, /saveProfile: function \(\) \{ return saveProfile\(\); \}/);
  assert.match(body, /renderHome: function \(\) \{ renderHome\(\); \}/);
  assert.match(body, /renderSettings: function \(\) \{ renderSettings\(\); \}/);
  assert.match(body, /runEngineAction: function \(trigger, engineId, action, payload\) \{ return runEngineAction\(trigger, engineId, action, payload\); \}/);
  assert.match(body, /coachNameFn: function \(\) \{ return coachName\(\); \}/);
  assert.match(body, /coachMessageFn: function \(context\) \{ return coachMessage\(context\); \}/);
  assert.match(body, /alertFn: function \(msg\) \{ alert\(msg\); \}/);
});

test('the twelve application/UI functions are one-line facades delegating to AdaptiveTdeeController', () => {
  assert.match(appJs, /async function runAdaptiveCheck\(access\) \{ return AdaptiveTdeeController\.runAdaptiveCheck\(access\); \}/);
  assert.match(appJs, /async function renderAdaptiveCard\(\) \{ return AdaptiveTdeeController\.renderAdaptiveCard\(\); \}/);
  assert.match(appJs, /async function coachAdaptiveMessage\(p\) \{ return AdaptiveTdeeController\.coachAdaptiveMessage\(p\); \}/);
  assert.match(appJs, /async function applyAdaptiveUpdate\(\) \{ return AdaptiveTdeeController\.applyAdaptiveUpdate\(\); \}/);
  assert.match(appJs, /async function dismissAdaptiveUpdate\(\) \{ return AdaptiveTdeeController\.dismissAdaptiveUpdate\(\); \}/);
  assert.match(appJs, /function renderPartialPrompt\(\) \{ return AdaptiveTdeeController\.renderPartialPrompt\(\); \}/);
  assert.match(appJs, /async function confirmDayLight\(key\) \{ return AdaptiveTdeeController\.confirmDayLight\(key\); \}/);
  assert.match(appJs, /async function logMeasurements\(\) \{ return AdaptiveTdeeController\.logMeasurements\(\); \}/);
  assert.match(appJs, /function renderMeasurements\(\) \{ return AdaptiveTdeeController\.renderMeasurements\(\); \}/);
  assert.match(appJs, /function renderAdaptiveSettings\(\) \{ return AdaptiveTdeeController\.renderAdaptiveSettings\(\); \}/);
  assert.match(appJs, /async function setAdaptiveRate\(v\) \{ return AdaptiveTdeeController\.setAdaptiveRate\(v\); \}/);
  assert.match(appJs, /async function toggleAdaptive\(\) \{ return AdaptiveTdeeController\.toggleAdaptive\(\); \}/);
});

test('the eleven pure functions are one-line facades delegating to AdaptiveTdeeDomain, supplying userProfile/todayData/window._adaptHistoryCache explicitly where the original read them implicitly', () => {
  assert.match(appJs, /function adaptRate\(\) \{ return AdaptiveTdeeDomain\.adaptRate\(userProfile\); \}/);
  assert.match(appJs, /function adaptEnabled\(\) \{ return AdaptiveTdeeDomain\.adaptEnabled\(userProfile\); \}/);
  assert.match(appJs, /function daysInWindow\(history, windowDays\) \{ return AdaptiveTdeeDomain\.daysInWindow\(history, todayData, windowDays\); \}/);
  assert.match(appJs, /function classifyDay\(day, goalKcal, confirmedLight\) \{ return AdaptiveTdeeDomain\.classifyDay\(day, goalKcal, confirmedLight\); \}/);
  assert.match(appJs, /function pendingPartialDays\(\) \{ return AdaptiveTdeeDomain\.pendingPartialDays\(window\._adaptHistoryCache, todayData, userProfile\); \}/);
  assert.match(appJs, /function computeAdaptiveTdee\(history, profile\) \{ return AdaptiveTdeeDomain\.computeAdaptiveTdee\(history, profile, todayData\); \}/);
  assert.match(appJs, /function analyzeMeasurements\(profile\) \{ return AdaptiveTdeeDomain\.analyzeMeasurements\(profile\); \}/);
  assert.match(appJs, /function buildWeeklySignals\(calc, meas, profile\) \{ return AdaptiveTdeeDomain\.buildWeeklySignals\(calc, meas, profile\); \}/);
  assert.match(appJs, /function computeNextDeficit\(signals, profile\) \{ return AdaptiveTdeeDomain\.computeNextDeficit\(signals, profile\); \}/);
  assert.match(appJs, /function buildAdaptiveProposal\(history, profile\) \{ return AdaptiveTdeeDomain\.buildAdaptiveProposal\(history, profile, todayData\); \}/);
  assert.match(appJs, /function adaptiveLocalExplain\(prop\) \{ return AdaptiveTdeeDomain\.adaptiveLocalExplain\(prop\); \}/);
});

// C1-WP1 established daysBetween/linearSlope/dayKcal as PERMANENT compatibility facades
// (tests/c1Wp1Wiring.test.js locks in their exact body text, the same tier as dateKey/
// getTodayKey/esc) — they stay even though nothing in app.js still calls them after this
// extraction (adaptiveTdeeDomain.js requires DateUtils/NumberUtils/NutritionModel directly).
test('daysBetween/linearSlope/dayKcal (WP1 permanent facades) are untouched — still present with their original bodies, unlike the STAGE 4 code that used to call them', () => {
  assert.match(appJs, /function daysBetween\(k1, k2\) \{ return DateUtils\.daysBetween\(k1, k2\); \}/);
  assert.match(appJs, /function linearSlope\(points\) \{ return NumberUtils\.linearSlope\(points\); \}/);
  assert.match(appJs, /function dayKcal\(dayData\) \{ return NutritionModel\.dayKcal\(dayData\); \}/);
});

test('ADAPT_RATES and the other threshold constants no longer exist as app.js top-level constants (relocated to adaptiveTdeeDomain.js)', () => {
  assert.equal(appJs.indexOf('const ADAPT_RATES ='), -1);
  assert.equal(appJs.indexOf('const KCAL_PER_KG ='), -1);
  assert.equal(appJs.indexOf('const ADAPT_WINDOW_DAYS ='), -1);
  assert.equal(appJs.indexOf('const PARTIAL_FRACTION ='), -1);
});

test('_adaptProposal remains a shared app.js module-level variable (its setter is still wired into StateAccess via setAdaptProposal, unchanged)', () => {
  assert.match(appJs, /let _adaptProposal = null;/);
  assert.match(appJs, /setAdaptProposal: function \(proposal\) \{ _adaptProposal = proposal; \}/);
});

// ── governing boundaries: WP8/WP6/frozen B2/B4 territory left untouched ────────────────

// C1-WP8 extracted evalRedFlag into js/trigger/triggerDomain.js, which calls
// AdaptiveTdeeDomain.computeAdaptiveTdee/analyzeMeasurements/buildWeeklySignals directly
// (a legitimate pure-to-pure cross-domain dependency, same tier as WP7 requiring
// core/dateUtils.js) — app.js's evalRedFlag is now a one-line facade to TriggerDomain.
// See tests/c1Wp8Wiring.test.js for the up-to-date wiring assertions on this facade.
test('evalRedFlag is a one-line facade to TriggerDomain (WP8) — no longer references AdaptiveTdeeDomain/computeAdaptiveTdee by name in app.js', () => {
  assert.match(appJs, /function evalRedFlag\(history, profile\) \{ return TriggerDomain\.evalRedFlag\(history, profile, todayData\); \}/);
});

test('logWeight (core profile/weight tracking, out of WP7 scope) is untouched — still a full implementation in app.js, only triggering the engine via the unchanged runEngineAction global', () => {
  const idx = appJs.indexOf('async function logWeight() {');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /userProfile\.weightHistory\.push\(/);
  assert.match(body, /await runEngineAction\('SOURCE_DATA_CHANGED', 'adaptiveTdeeEngine', 'WEIGHT_CHANGED'\);/);
  assert.doesNotMatch(body, /AdaptiveTdeeController|AdaptiveTdeeDomain/);
});

// C1-WP9 relocated the adaptiveTdeeEngine Engine Registry registration out of app.js's B2
// STAGE 8 tail IIFE into js/engines/adaptiveTdeeEngineAdapter.js (intentional — see
// tests/c1Wp9Wiring.test.js) — it now calls AdaptiveTdeeController.runAdaptiveCheck/
// renderAdaptiveCard/renderPartialPrompt directly instead of via app.js facade names,
// same tier as every other WP9 adapter calling its WP7/WP8 controller directly.
test('the adaptiveTdeeEngine Engine Registry registration now lives in js/engines/adaptiveTdeeEngineAdapter.js (C1-WP9) — still calls AdaptiveTdeeController.runAdaptiveCheck/renderAdaptiveCard/renderPartialPrompt', () => {
  const adapterJs = fs.readFileSync(path.join(__dirname, '../js/engines/adaptiveTdeeEngineAdapter.js'), 'utf8');
  assert.match(adapterJs, /await AdaptiveTdeeController\.runAdaptiveCheck\(ctx\.state\);/);
  assert.match(adapterJs, /AdaptiveTdeeController\.renderAdaptiveCard\(\); AdaptiveTdeeController\.renderPartialPrompt\(\);/);
  assert.equal(appJs.indexOf("id: 'adaptiveTdeeEngine'"), -1, 'the registration itself must no longer be inline in app.js');
});

test('the _s4_renderProfile/_s4_renderSettings override chains are untouched — still call the (now-facaded) renderMeasurements/renderAdaptiveSettings by their global names', () => {
  assert.match(appJs, /const _s4_renderProfile = renderProfile;/);
  assert.match(appJs, /renderMeasurements\(\);\s*\};/);
  assert.match(appJs, /const _s4_renderSettings = renderSettings;/);
  assert.match(appJs, /renderAdaptiveSettings\(\);\s*\};/);
});

test('no repository/domain module is duplicated: PersistenceGateway/AuthorityContract/DateUtils each still have exactly one require() inside adaptiveTdeeController.js, and are not required by adaptiveTdeeDomain.js', () => {
  assert.equal((controllerJs.match(/require\('\.\.\/persistenceGateway\.js'\)/g) || []).length, 1);
  assert.equal((controllerJs.match(/require\('\.\.\/authorityContract\.js'\)/g) || []).length, 1);
  assert.doesNotMatch(domainJs, /persistenceGateway|authorityContract/);
});

test('no WP8+ vocabulary or unexpected files were introduced into js/adaptive/', () => {
  const adaptiveDirFiles = fs.readdirSync(path.join(__dirname, '../js/adaptive')).sort();
  assert.deepEqual(adaptiveDirFiles, ['adaptiveTdeeController.js', 'adaptiveTdeeDomain.js']);
  [domainJs, controllerJs].forEach((content) => {
    assert.doesNotMatch(content, /triggerDomain|triggerController|triggerPresenter|notificationDomain/);
  });
});
