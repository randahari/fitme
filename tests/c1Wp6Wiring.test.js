// C1-WP6 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP6).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository).
// Run with: node --test tests/c1Wp6Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

const profileJs = fs.readFileSync(path.join(__dirname, '../js/coach/coachProfile.js'), 'utf8');
const composerJs = fs.readFileSync(path.join(__dirname, '../js/coach/coachPromptComposer.js'), 'utf8');
const clientJs = fs.readFileSync(path.join(__dirname, '../js/coach/coachClient.js'), 'utf8');
const presenterJs = fs.readFileSync(path.join(__dirname, '../js/coach/coachPresenter.js'), 'utf8');

const MODULES = [
  ['js/coach/coachProfile.js', profileJs],
  ['js/coach/coachPromptComposer.js', composerJs],
  ['js/coach/coachClient.js', clientJs],
  ['js/coach/coachPresenter.js', presenterJs]
];

test('all four coach modules are registered in index.html, loaded after barcodeFlowController.js, in dependency order, and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const barcodeIdx = indexHtml.indexOf('js/nutrition/barcodeFlowController.js');
  const iProfile = indexHtml.indexOf('js/coach/coachProfile.js');
  const iComposer = indexHtml.indexOf('js/coach/coachPromptComposer.js');
  const iClient = indexHtml.indexOf('js/coach/coachClient.js');
  const iPresenter = indexHtml.indexOf('js/coach/coachPresenter.js');
  [iProfile, iComposer, iClient, iPresenter].forEach((idx) => assert.notEqual(idx, -1));
  assert.ok(barcodeIdx < iProfile, 'coachProfile.js must load after barcodeFlowController.js');
  assert.ok(iProfile < iComposer, 'coachProfile.js must load before coachPromptComposer.js (direct require)');
  assert.ok(iComposer < iClient, 'coachPromptComposer.js must load before coachClient.js (direct require)');
  assert.ok(iComposer < iPresenter, 'coachPromptComposer.js must load before coachPresenter.js (direct require)');
  assert.ok(iClient < appIdx && iPresenter < appIdx, 'all coach modules must load before app.js');
});

test('all four coach modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  MODULES.forEach(([file]) => {
    assert.notEqual(swJs.indexOf('/fitme/' + file), -1, file + ' must be in the SHELL cache list');
  });
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.39.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.39.0');
});

// ── coachProfile.js: pure module ────────────────────────────────────────────────────────

test('coachProfile.js is a pure module: no configure(), no window/document/db/alert/confirm/AI', () => {
  const code = profileJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /function configure\(/);
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /\balert\(/);
  assert.doesNotMatch(code, /callClaude|DerivedIntelligenceConsumer/);
  assert.doesNotMatch(code, /\btodayData\b|\bcurrentUser\b/);
});

test('coachProfile.js exports the five named operations, with both a window.X and module.exports surface', () => {
  assert.match(profileJs, /window\.CoachProfile = API/);
  assert.match(profileJs, /module\.exports = API/);
  ['coachName', 'coachStyle', 'coachChatter', 'setStyle', 'setChatter'].forEach((name) => {
    assert.match(profileJs, new RegExp(name + ':\\s*' + name));
  });
});

// ── coachPromptComposer.js ──────────────────────────────────────────────────────────────

test('coachPromptComposer.js requires CoachProfile/DateUtils/DerivedIntelligenceConsumer/DerivedIntelligencePrompt directly (stable modules, no override chain)', () => {
  assert.match(composerJs, /require\('\.\/coachProfile\.js'\)/);
  assert.match(composerJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
  assert.match(composerJs, /require\('\.\.\/derivedIntelligenceConsumer\.js'\)/);
  assert.match(composerJs, /require\('\.\.\/derivedIntelligencePrompt\.js'\)/);
});

test('coachPromptComposer.js does not own DOM, AI requests, or durable writes — only orchestrates injected/required collaborators', () => {
  const code = composerJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\bdocument\./);
  assert.doesNotMatch(code, /\bdb\./);
  assert.doesNotMatch(code, /callClaude/);
  assert.doesNotMatch(code, /PersistenceGateway\.|persistDaySnapshot/);
});

test('coachPromptComposer.js exports configure() and the five named operations, with both a window.X and module.exports surface', () => {
  assert.match(composerJs, /window\.CoachPromptComposer = API/);
  assert.match(composerJs, /module\.exports = API/);
  ['buildBasePrompt', 'coachMemoryFragment', 'coachLine', 'composeHomeCardContext', 'buildSystemPrompt'].forEach((name) => {
    assert.match(composerJs, new RegExp(name + ':\\s*' + name));
  });
});

test('buildSystemPrompt reproduces the exact B5-integration request shape and fallback logic the removed app.js override chain had', () => {
  assert.match(composerJs, /consumer: 'AI_COACH_PROMPT'/);
  assert.match(composerJs, /policyId: 'COACH_PROMPT_V1'/);
  assert.match(composerJs, /domain: 'GENERAL_COACHING'/);
  assert.match(composerJs, /purpose: 'IMMEDIATE'/);
  assert.match(composerJs, /result\.status === 'SUCCESS' \|\| result\.status === 'PARTIAL'/);
  assert.match(composerJs, /return derived \? \(withMem \+ ' ' \+ derived\) : withMem;/);
  assert.match(composerJs, /try \{[\s\S]*DerivedIntelligenceConsumer\.build\([\s\S]*\}\s*catch/);
});

// ── coachClient.js ──────────────────────────────────────────────────────────────────────

test('coachClient.js requires CoachProfile/CoachPromptComposer directly, and is configured with a closure for callClaude', () => {
  assert.match(clientJs, /require\('\.\/coachProfile\.js'\)/);
  assert.match(clientJs, /require\('\.\/coachPromptComposer\.js'\)/);
});

test('CoachClient is configured in app.js with a closure for callClaude (wrapped later for usage-tracking, never a bare reference)', () => {
  const idx = appJs.indexOf('CoachClient.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /callClaude: function \(body\) \{ return callClaude\(body\); \}/);
});

test('coachClient.js exports configure() and sendMessage, with both a window.X and module.exports surface', () => {
  assert.match(clientJs, /window\.CoachClient = API/);
  assert.match(clientJs, /module\.exports = API/);
  assert.match(clientJs, /configure: configure,\s*sendMessage: sendMessage/);
});

// ── coachPresenter.js ───────────────────────────────────────────────────────────────────

test('CoachPresenter is configured in app.js with closures for coachCardShown (get/set) and coachMessageFn, plus documentRef/sessionLifecycle/saveProfile', () => {
  const idx = appJs.indexOf('CoachPresenter.configure({');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, appJs.indexOf('});', idx));
  assert.match(body, /documentRef: document,/);
  assert.match(body, /sessionLifecycle: SessionLifecycle,/);
  assert.match(body, /getUserProfile: function \(\) \{ return userProfile; \}/);
  assert.match(body, /getTodayData: function \(\) \{ return todayData; \}/);
  assert.match(body, /getCoachCardShown: function \(\) \{ return coachCardShown; \}/);
  assert.match(body, /setCoachCardShown: function \(v\) \{ coachCardShown = v; \}/);
  assert.match(body, /saveProfile: function \(\) \{ return saveProfile\(\); \}/);
  assert.match(body, /coachMessageFn: function \(context\) \{ return coachMessage\(context\); \}/);
});

test('coachPresenter.js requires CoachProfile/CoachPromptComposer directly, and does not perform AI requests or durable writes itself', () => {
  assert.match(presenterJs, /require\('\.\/coachProfile\.js'\)/);
  assert.match(presenterJs, /require\('\.\/coachPromptComposer\.js'\)/);
  const code = presenterJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /callClaude/);
  assert.doesNotMatch(code, /\bdb\.|PersistenceGateway\.|persistDaySnapshot/);
});

test('coachPresenter.js exports configure() and the six named operations, with both a window.X and module.exports surface', () => {
  assert.match(presenterJs, /window\.CoachPresenter = API/);
  assert.match(presenterJs, /module\.exports = API/);
  ['refreshCoachCard', 'renderCoachSettings', 'saveCoachSettings', 'setCoachStyle', 'setCoachChatter', 'testCoachMessage'].forEach((name) => {
    assert.match(presenterJs, new RegExp(name + ':\\s*' + name));
  });
});

// ── app.js facades ──────────────────────────────────────────────────────────────────────

test('coachName/coachStyle/coachChatter/coachLine are one-line facades delegating to CoachProfile/CoachPromptComposer', () => {
  assert.match(appJs, /function coachName\(\) \{ return CoachProfile\.coachName\(userProfile\); \}/);
  assert.match(appJs, /function coachStyle\(\) \{ return CoachProfile\.coachStyle\(userProfile\); \}/);
  assert.match(appJs, /function coachChatter\(\) \{ return CoachProfile\.coachChatter\(userProfile\); \}/);
  assert.match(appJs, /function coachLine\(kind, d\) \{ return CoachPromptComposer\.coachLine\(userProfile, kind, d\); \}/);
});

test('buildCoachSystemPrompt/coachMessage/refreshCoachCard are one-line facades delegating to the new modules, passing userProfile/todayData/currentUser explicitly', () => {
  assert.match(appJs, /async function buildCoachSystemPrompt\(\) \{ return CoachPromptComposer\.buildSystemPrompt\(userProfile, todayData, currentUser\); \}/);
  assert.match(appJs, /async function coachMessage\(context\) \{ return CoachClient\.sendMessage\(context, userProfile, todayData, currentUser\); \}/);
  assert.match(appJs, /async function refreshCoachCard\(\) \{ return CoachPresenter\.refreshCoachCard\(\); \}/);
});

test('coachMemoryPromptFragment and the five coach-settings functions are one-line facades delegating to the new modules', () => {
  assert.match(appJs, /function coachMemoryPromptFragment\(\) \{ return CoachPromptComposer\.coachMemoryFragment\(userProfile\); \}/);
  assert.match(appJs, /function renderCoachSettings\(\) \{ return CoachPresenter\.renderCoachSettings\(\); \}/);
  assert.match(appJs, /async function saveCoachSettings\(\) \{ return CoachPresenter\.saveCoachSettings\(\); \}/);
  assert.match(appJs, /async function setCoachStyle\(v\) \{ return CoachPresenter\.setCoachStyle\(v\); \}/);
  assert.match(appJs, /async function setCoachChatter\(v\) \{ return CoachPresenter\.setCoachChatter\(v\); \}/);
  assert.match(appJs, /async function testCoachMessage\(\) \{ return CoachPresenter\.testCoachMessage\(\); \}/);
});

test('the historical buildCoachSystemPrompt override chain (_s5_buildCoachSystemPrompt, _s5TimeSegment, _s5ContextEvents) no longer exists in app.js — consolidated into CoachPromptComposer.buildSystemPrompt', () => {
  assert.doesNotMatch(appJs, /_s5_buildCoachSystemPrompt|_s5TimeSegment|_s5ContextEvents/);
  // buildCoachSystemPrompt now has exactly one declaration and zero reassignments.
  const decls = (appJs.match(/^(async )?function buildCoachSystemPrompt\(/gm) || []).length;
  assert.equal(decls, 1);
  assert.equal(appJs.indexOf('buildCoachSystemPrompt = async function'), -1);
  assert.equal(appJs.indexOf('buildCoachSystemPrompt = function'), -1);
});

test('COACH_STYLE_GUIDE/COACH_CHATTER_GUIDE no longer exist as app.js constants (relocated to coachPromptComposer.js); COACH_STYLE_LABELS/COACH_CHATTER_LABELS (unused, out of WP6 scope) are untouched', () => {
  assert.equal(appJs.indexOf('const COACH_STYLE_GUIDE'), -1);
  assert.equal(appJs.indexOf('const COACH_CHATTER_GUIDE'), -1);
  assert.match(appJs, /const COACH_STYLE_LABELS = \{ friendly: 'חברי', supportive: 'תומך', professional: 'מקצועי', mixed: 'מעורב' \};/);
  assert.match(appJs, /const COACH_CHATTER_LABELS = \{ minimal: 'קצר ולעניין', balanced: 'מאוזן', gentle: 'עדין' \};/);
});

test('_s5_callClaude (usage-tracking wrap, shared across many callers) is untouched — WP6 only injects a closure into it, never relocates it', () => {
  assert.match(appJs, /const _s5_callClaude = callClaude;/);
  assert.match(appJs, /callClaude = async function\(body\) \{/);
});

test('ensureCoachMemory/coachDay (shared Habit/Pattern/Trigger memory infrastructure) are untouched — out of WP6 scope', () => {
  assert.match(appJs, /function ensureCoachMemory\(\) \{/);
  assert.match(appJs, /function coachDay\(\) \{/);
  const idx = appJs.indexOf('function coachDay() {');
  const body = appJs.slice(idx, appJs.indexOf('\n}', idx));
  assert.match(body, /ensureCoachMemory\(\);/);
});

test('runCoachTriggers/fireWorkoutTrigger/triggerLocalText/triggerLiveText/presentTriggerCard/presentWorkoutTriggerCard (frozen B2/B4 Trigger Engine) are untouched, still calling the coachName/coachChatter/coachMessage/coachLine facades unchanged — never the new modules directly', () => {
  assert.match(appJs, /async function runCoachTriggers\(access\) \{/);
  assert.match(appJs, /async function fireWorkoutTrigger\(burn, access\) \{/);
  assert.match(appJs, /function triggerLocalText\(t\) \{/);
  assert.match(appJs, /async function triggerLiveText\(t\) \{/);
  const startIdx = appJs.indexOf('function triggerLocalText(t) {');
  const endIdx = appJs.indexOf('function presentWorkoutTriggerCard(');
  const section = appJs.slice(startIdx, appJs.indexOf('\n}', appJs.indexOf('function presentWorkoutTriggerCard(', endIdx)));
  assert.doesNotMatch(section, /CoachProfile|CoachPromptComposer|CoachClient|CoachPresenter/, 'the Trigger Engine section must keep calling the app.js coach facades, not the new modules directly');
});

// C1-WP7 subsequently relocated coachAdaptiveMessage()'s own body into
// js/adaptive/adaptiveTdeeController.js (intentional — "AI explanation request" is explicit
// C1-WP7 scope; see tests/c1Wp7Wiring.test.js) — app.js now holds a one-line facade. The
// relocated body still calls the coachName/coachMessage facades this WP established
// (as deps.coachNameFn/deps.coachMessageFn closures), not the coach modules directly.
test('coachAdaptiveMessage is now a one-line facade delegating to AdaptiveTdeeController (C1-WP7) — the relocated body still calls the coachName/coachMessage facades via injected closures, not the coach modules directly', () => {
  assert.match(appJs, /async function coachAdaptiveMessage\(p\) \{ return AdaptiveTdeeController\.coachAdaptiveMessage\(p\); \}/);
  const controllerJs = fs.readFileSync(path.join(__dirname, '../js/adaptive/adaptiveTdeeController.js'), 'utf8');
  const idx = controllerJs.indexOf('async function coachAdaptiveMessage(p) {');
  assert.notEqual(idx, -1);
  const body = controllerJs.slice(idx, controllerJs.indexOf('\n  }', idx));
  assert.match(body, /deps\.coachNameFn\(\)/);
  assert.match(body, /return await deps\.coachMessageFn\(ctx\);/);
  assert.doesNotMatch(body, /CoachProfile|CoachPromptComposer|CoachClient|CoachPresenter/);
});

test('no repository/domain module is duplicated: persistDaySnapshot/saveProfile/SessionLifecycle each still have exactly one declaration/const in app.js', () => {
  assert.equal((appJs.match(/^async function persistDaySnapshot\(/gm) || []).length, 1);
  assert.equal((appJs.match(/^async function saveProfile\(/gm) || []).length, 1);
});

test('no WP7+ vocabulary or unexpected files were introduced into js/coach/', () => {
  const coachDirFiles = fs.readdirSync(path.join(__dirname, '../js/coach')).sort();
  assert.deepEqual(coachDirFiles, ['coachClient.js', 'coachPresenter.js', 'coachProfile.js', 'coachPromptComposer.js']);
  MODULES.forEach(([, content]) => {
    assert.doesNotMatch(content, /adaptiveTdee|weeklyTrend|deficitAdjustment/);
  });
});
