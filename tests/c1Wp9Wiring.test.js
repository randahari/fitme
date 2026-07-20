// C1-WP9 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP9).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as every
// prior *Wiring.test.js in this repository). Behavioural coverage of the extracted producer
// logic itself lives in tests/habitEngine.test.js and tests/patternEngine.test.js.
// Run with: node --test tests/c1Wp9Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const habitEngineJs = fs.readFileSync(path.join(__dirname, '../js/engines/habitEngine.js'), 'utf8');
const patternEngineJs = fs.readFileSync(path.join(__dirname, '../js/engines/patternEngine.js'), 'utf8');
const adaptiveAdapterJs = fs.readFileSync(path.join(__dirname, '../js/engines/adaptiveTdeeEngineAdapter.js'), 'utf8');
const triggerAdapterJs = fs.readFileSync(path.join(__dirname, '../js/engines/triggerEngineAdapter.js'), 'utf8');
const registerEnginesJs = fs.readFileSync(path.join(__dirname, '../js/engines/registerEngines.js'), 'utf8');

// ── index.html / sw.js / version ────────────────────────────────────────────────────────

test('all five js/engines/*.js modules are registered in index.html, in dependency order, after triggerController.js and before app.js', () => {
  const triggerControllerIdx = indexHtml.indexOf('js/trigger/triggerController.js');
  const iHabit = indexHtml.indexOf('js/engines/habitEngine.js');
  const iPattern = indexHtml.indexOf('js/engines/patternEngine.js');
  const iAdaptiveAdapter = indexHtml.indexOf('js/engines/adaptiveTdeeEngineAdapter.js');
  const iTriggerAdapter = indexHtml.indexOf('js/engines/triggerEngineAdapter.js');
  const iRegister = indexHtml.indexOf('js/engines/registerEngines.js');
  const appIdx = indexHtml.indexOf('js/app.js');
  [iHabit, iPattern, iAdaptiveAdapter, iTriggerAdapter, iRegister].forEach((i) => assert.notEqual(i, -1));
  assert.ok(triggerControllerIdx < iHabit, 'engines must load after triggerController.js');
  assert.ok(iHabit < iPattern, 'habitEngine.js must load before patternEngine.js (direct require)');
  assert.ok(iPattern < iAdaptiveAdapter && iAdaptiveAdapter < iTriggerAdapter, 'adapters load after habit/pattern');
  assert.ok(iTriggerAdapter < iRegister, 'registerEngines.js must load after all four engine/adapter modules (direct require)');
  assert.ok(iRegister < appIdx, 'registerEngines.js must load before app.js');
});

test('all five js/engines/*.js modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  ['habitEngine.js', 'patternEngine.js', 'adaptiveTdeeEngineAdapter.js', 'triggerEngineAdapter.js', 'registerEngines.js'].forEach((f) => {
    assert.notEqual(swJs.indexOf('/fitme/js/engines/' + f), -1, f + ' must be in the SHELL cache list');
  });
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.39.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.39.0');
});

// ── js/engines/habitEngine.js ───────────────────────────────────────────────────────────

test('habitEngine.js requires AuthorityContract/DateUtils/StateAccess directly (stable B1/WP1/B3 modules, no override chain)', () => {
  assert.match(habitEngineJs, /require\('\.\.\/authorityContract\.js'\)/);
  assert.match(habitEngineJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
  assert.match(habitEngineJs, /require\('\.\.\/stateAccess\.js'\)/);
});

test('habitEngine.js exports configure()/VERSION/runHabitEngine/runHabitEngineSingleFlight/run, with both a window.X and module.exports surface', () => {
  assert.match(habitEngineJs, /window\.HabitEngine = API/);
  assert.match(habitEngineJs, /module\.exports = API/);
  ['configure', 'runHabitEngine', 'runHabitEngineSingleFlight', 'run'].forEach((name) => {
    assert.match(habitEngineJs, new RegExp(name + ':\\s*' + name));
  });
  assert.match(habitEngineJs, /VERSION:\s*HE_VERSION/);
});

test('habitEngine.js contains exactly one top-level IIFE (its own module wrapper)', () => {
  const count = (habitEngineJs.match(/^\(function\s*\(\s*\)\s*\{/gm) || []).length;
  assert.equal(count, 1);
});

// ── js/engines/patternEngine.js ─────────────────────────────────────────────────────────

test('patternEngine.js requires AuthorityContract/DateUtils/StateAccess/HabitEngine directly', () => {
  assert.match(patternEngineJs, /require\('\.\.\/authorityContract\.js'\)/);
  assert.match(patternEngineJs, /require\('\.\.\/core\/dateUtils\.js'\)/);
  assert.match(patternEngineJs, /require\('\.\.\/stateAccess\.js'\)/);
  assert.match(patternEngineJs, /require\('\.\/habitEngine\.js'\)/);
});

test('patternEngine.js exports configure()/VERSION/runPatternEngine/run, with both a window.X and module.exports surface', () => {
  assert.match(patternEngineJs, /window\.PatternEngine = API/);
  assert.match(patternEngineJs, /module\.exports = API/);
  ['configure', 'runPatternEngine', 'run'].forEach((name) => {
    assert.match(patternEngineJs, new RegExp(name + ':\\s*' + name));
  });
  assert.match(patternEngineJs, /VERSION:\s*PE_VERSION/);
});

test('patternEngine.js calls HabitEngine.runHabitEngineSingleFlight() for its soft internal dependency, never the raw runHabitEngine()', () => {
  assert.match(patternEngineJs, /HabitEngine\.runHabitEngineSingleFlight\(\)/);
  const codeOnly = patternEngineJs.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(codeOnly, /[^.]runHabitEngine\(/, 'must never call the bare runHabitEngine() — only HabitEngine.runHabitEngineSingleFlight()');
});

test('Habit and Pattern remain separate modules — patternEngine.js does not reimplement Habit\'s detectors, and habitEngine.js does not reference Pattern at all', () => {
  assert.doesNotMatch(patternEngineJs, /function detectNutrition|function detectWorkout|function weeklyLogHabit/);
  assert.doesNotMatch(habitEngineJs, /PatternEngine|patternEngine/);
});

// ── js/engines/adaptiveTdeeEngineAdapter.js ─────────────────────────────────────────────

test('adaptiveTdeeEngineAdapter.js requires AdaptiveTdeeController/StateAccess directly and exposes configure()/run()', () => {
  assert.match(adaptiveAdapterJs, /require\('\.\.\/adaptive\/adaptiveTdeeController\.js'\)/);
  assert.match(adaptiveAdapterJs, /require\('\.\.\/stateAccess\.js'\)/);
  assert.match(adaptiveAdapterJs, /window\.AdaptiveTdeeEngineAdapter = API/);
  assert.match(adaptiveAdapterJs, /module\.exports = API/);
  assert.match(adaptiveAdapterJs, /configure:\s*configure/);
  assert.match(adaptiveAdapterJs, /run:\s*run/);
});

test('adaptiveTdeeEngineAdapter.js reproduces all three trigger/action branches unchanged (ADAPTIVE_CHECK, WEIGHT_CHANGED, ADAPTIVE_RECHECK) plus the fallback SKIPPED', () => {
  assert.match(adaptiveAdapterJs, /ctx\.trigger === 'APP_READY' && ctx\.action === 'ADAPTIVE_CHECK'/);
  assert.match(adaptiveAdapterJs, /ctx\.trigger === 'SOURCE_DATA_CHANGED' && ctx\.action === 'WEIGHT_CHANGED'/);
  assert.match(adaptiveAdapterJs, /ctx\.trigger === 'MANUAL' && ctx\.action === 'ADAPTIVE_RECHECK'/);
  assert.match(adaptiveAdapterJs, /UNKNOWN_ACTION.*not an adaptiveTdeeEngine action for this trigger/);
  const calls = (adaptiveAdapterJs.match(/AdaptiveTdeeController\.runAdaptiveCheck\(ctx\.state\)/g) || []).length;
  assert.equal(calls, 3, 'all three branches must call AdaptiveTdeeController.runAdaptiveCheck');
});

// ── js/engines/triggerEngineAdapter.js ──────────────────────────────────────────────────

test('triggerEngineAdapter.js requires TriggerController/StateAccess directly and exposes configure()/run()', () => {
  assert.match(triggerAdapterJs, /require\('\.\.\/trigger\/triggerController\.js'\)/);
  assert.match(triggerAdapterJs, /require\('\.\.\/stateAccess\.js'\)/);
  assert.match(triggerAdapterJs, /window\.TriggerEngineAdapter = API/);
  assert.match(triggerAdapterJs, /module\.exports = API/);
  assert.match(triggerAdapterJs, /configure:\s*configure/);
  assert.match(triggerAdapterJs, /run:\s*run/);
});

test('triggerEngineAdapter.js reproduces all three trigger/action branches unchanged, including the WORKOUT_COMPLETED stale-session guards', () => {
  assert.match(triggerAdapterJs, /ctx\.trigger === 'APP_READY' && ctx\.action === 'DAILY_COACH_CHECK'/);
  assert.match(triggerAdapterJs, /ctx\.trigger === 'SOURCE_DATA_CHANGED' && ctx\.action === 'WORKOUT_COMPLETED'/);
  assert.match(triggerAdapterJs, /ctx\.trigger === 'AUTH_SESSION_READY' && ctx\.action === 'LOCAL_NOTIFICATION_SCHEDULE'/);
  const staleGuards = (triggerAdapterJs.match(/STALE_SESSION/g) || []).length;
  assert.equal(staleGuards, 2, 'both the before- and during-write session guards must be present');
});

// ── js/engines/registerEngines.js ───────────────────────────────────────────────────────

test('registerEngines.js requires EngineRegistry and all four engine/adapter modules directly, and exposes registerAll()', () => {
  assert.match(registerEnginesJs, /require\('\.\.\/engineRegistry\.js'\)/);
  assert.match(registerEnginesJs, /require\('\.\/habitEngine\.js'\)/);
  assert.match(registerEnginesJs, /require\('\.\/patternEngine\.js'\)/);
  assert.match(registerEnginesJs, /require\('\.\/adaptiveTdeeEngineAdapter\.js'\)/);
  assert.match(registerEnginesJs, /require\('\.\/triggerEngineAdapter\.js'\)/);
  assert.match(registerEnginesJs, /window\.RegisterEngines = API/);
  assert.match(registerEnginesJs, /module\.exports = API/);
  assert.match(registerEnginesJs, /registerAll:\s*registerAll/);
});

test('registerEngines.js registers each engine\'s run with the matching module (no cross-wiring)', () => {
  assert.match(registerEnginesJs, /id:\s*'habitEngine'[\s\S]{0,200}run:\s*HabitEngine\.run/);
  assert.match(registerEnginesJs, /id:\s*'patternEngine'[\s\S]{0,200}run:\s*PatternEngine\.run/);
  assert.match(registerEnginesJs, /id:\s*'adaptiveTdeeEngine'[\s\S]{0,250}run:\s*AdaptiveTdeeEngineAdapter\.run/);
  assert.match(registerEnginesJs, /id:\s*'triggerEngine'[\s\S]{0,250}run:\s*TriggerEngineAdapter\.run/);
});

test('registerEngines.js logs a diagnostic on registration failure, same as the pre-WP9 inline _registerEngine helper', () => {
  assert.match(registerEnginesJs, /if \(!r\.ok\) console\.error\('\[EngineRegistry\] registration failed:', def\.id, r\.error\);/);
});

// ── app.js: composition + facades, no producer algorithms ──────────────────────────────

test('app.js configures all four engine/adapter modules before calling RegisterEngines.registerAll()', () => {
  const configureIdx = appJs.indexOf('HabitEngine.configure({');
  const patternConfigureIdx = appJs.indexOf('PatternEngine.configure({');
  const adaptiveConfigureIdx = appJs.indexOf('AdaptiveTdeeEngineAdapter.configure({');
  const triggerConfigureIdx = appJs.indexOf('TriggerEngineAdapter.configure({');
  const registerCallIdx = appJs.indexOf('RegisterEngines.registerAll();');
  [configureIdx, patternConfigureIdx, adaptiveConfigureIdx, triggerConfigureIdx, registerCallIdx].forEach((i) => assert.notEqual(i, -1));
  assert.ok(configureIdx < registerCallIdx && patternConfigureIdx < registerCallIdx);
  assert.ok(adaptiveConfigureIdx < registerCallIdx && triggerConfigureIdx < registerCallIdx);
});

test('HabitEngine/PatternEngine are configured with appVersion/getCurrentUser/getUserProfile/persistenceSummaryFn closures (appVersion/sessionLifecycle only where actually used)', () => {
  const habitBody = appJs.slice(appJs.indexOf('HabitEngine.configure({'), appJs.indexOf('});', appJs.indexOf('HabitEngine.configure({')));
  assert.match(habitBody, /appVersion: APP_VERSION,/);
  assert.match(habitBody, /sessionLifecycle: SessionLifecycle,/);
  assert.match(habitBody, /getCurrentUser: function \(\) \{ return currentUser; \}/);
  assert.match(habitBody, /getUserProfile: function \(\) \{ return userProfile; \}/);
  assert.match(habitBody, /persistenceSummaryFn: function \(result\) \{ return persistenceSummary\(result\); \}/);

  const patternBody = appJs.slice(appJs.indexOf('PatternEngine.configure({'), appJs.indexOf('});', appJs.indexOf('PatternEngine.configure({')));
  assert.match(patternBody, /appVersion: APP_VERSION,/);
  assert.match(patternBody, /getCurrentUser: function \(\) \{ return currentUser; \}/);
  assert.match(patternBody, /getUserProfile: function \(\) \{ return userProfile; \}/);
  assert.match(patternBody, /persistenceSummaryFn: function \(result\) \{ return persistenceSummary\(result\); \}/);
});

test('AdaptiveTdeeEngineAdapter/TriggerEngineAdapter are configured with sessionLifecycle (and persistenceSummaryFn for Trigger)', () => {
  const adaptiveBody = appJs.slice(appJs.indexOf('AdaptiveTdeeEngineAdapter.configure({'), appJs.indexOf('});', appJs.indexOf('AdaptiveTdeeEngineAdapter.configure({')));
  assert.match(adaptiveBody, /sessionLifecycle: SessionLifecycle/);

  const triggerBody = appJs.slice(appJs.indexOf('TriggerEngineAdapter.configure({'), appJs.indexOf('});', appJs.indexOf('TriggerEngineAdapter.configure({')));
  assert.match(triggerBody, /sessionLifecycle: SessionLifecycle,/);
  assert.match(triggerBody, /persistenceSummaryFn: function \(result\) \{ return persistenceSummary\(result\); \}/);
});

test('window.runHabitEngine/window.runPatternEngine are one-line facades delegating to HabitEngine/PatternEngine (WP0 compatibility surface preserved)', () => {
  assert.match(appJs, /function runHabitEngine\(access\) \{ return HabitEngine\.runHabitEngine\(access\); \}/);
  assert.match(appJs, /function runPatternEngine\(access\) \{ return PatternEngine\.runPatternEngine\(access\); \}/);
  assert.match(appJs, /window\.runHabitEngine = runHabitEngine;/);
  assert.match(appJs, /window\.runPatternEngine = runPatternEngine;/);
});

test('app.js no longer contains any Habit/Pattern producer algorithm (detectors, lifecycle helpers, single-flight, or inline engine registration)', () => {
  [
    'function buildObservations', 'function detectNutrition', 'function detectWorkout',
    'function weeklyLogHabit', 'function statusOf', 'function upsertFromSignal', 'function decayAbsent',
    'function computePatterns', 'function detectTime', 'function detectWeekday', 'function detectSequence',
    'function detectFrequency', 'function computeFingerprint', 'function buildObservation',
    'function runHabitEngineSingleFlight', 'var _habitInFlight', 'function _registerEngine',
    "id: 'habitEngine'", "id: 'patternEngine'", "id: 'adaptiveTdeeEngine'", "id: 'triggerEngine'"
  ].forEach((needle) => {
    assert.equal(appJs.indexOf(needle), -1, needle + ' must no longer appear in js/app.js');
  });
});

test('app.js calls RegisterEngines.registerAll() exactly once, replacing the old per-engine _registerEngine() calls', () => {
  const matches = appJs.match(/RegisterEngines\.registerAll\(\);/g) || [];
  assert.equal(matches.length, 1);
});

// ── no unexpected files/vocabulary introduced ───────────────────────────────────────────

test('js/engines/ contains exactly the five expected WP9 files', () => {
  const files = fs.readdirSync(path.join(__dirname, '../js/engines')).sort();
  assert.deepEqual(files, [
    'adaptiveTdeeEngineAdapter.js', 'habitEngine.js', 'patternEngine.js',
    'registerEngines.js', 'triggerEngineAdapter.js'
  ]);
});
