// B2 — static source/wiring checks. Dependency-free: reads the actual repository
// files as text and asserts structural facts about them. Does NOT execute app.js
// (no DOM/Firebase harness — intentionally out of scope for B2, per review
// instructions). Run with: node --test tests/b2Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

test('1. all four B2 engines are registered with the approved id/triggers', () => {
  const expectations = [
    { id: 'habitEngine', triggers: ["triggers: ['APP_READY']"] },
    { id: 'patternEngine', triggers: ["triggers: ['APP_READY']"] },
    { id: 'adaptiveTdeeEngine', triggers: ["triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL']"] },
    { id: 'triggerEngine', triggers: ["triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'AUTH_SESSION_READY']"] }
  ];
  expectations.forEach((exp) => {
    const idPattern = new RegExp("id:\\s*'" + exp.id + "'");
    assert.match(appJs, idPattern, exp.id + ' must be registered');
    const idIndex = appJs.search(idPattern);
    const nearby = appJs.slice(idIndex, idIndex + 300);
    const hasExpectedTriggers = exp.triggers.some((t) => nearby.indexOf(t) !== -1);
    assert.ok(hasExpectedTriggers, exp.id + ' must declare its approved triggers[] near its id');
  });
});

test('2. all four engines declare dependsOn: [] (locked, per B2 SPEC §11 Rule 10)', () => {
  const ids = ['habitEngine', 'patternEngine', 'adaptiveTdeeEngine', 'triggerEngine'];
  ids.forEach((id) => {
    const idIndex = appJs.search(new RegExp("id:\\s*'" + id + "'"));
    const nearby = appJs.slice(idIndex, idIndex + 300);
    assert.match(nearby, /dependsOn:\s*\[\]/, id + ' must declare dependsOn: []');
  });
});

test('3. old Engine orchestration override-chain symbols are gone', () => {
  const removedSymbols = ['_s4_showApp', '_s4_logWeight', '_s5_showApp', '_s5_saveWorkout', '_s6_showApp', '_s7_showApp'];
  removedSymbols.forEach((sym) => {
    assert.equal(appJs.indexOf(sym), -1, sym + ' must no longer appear in js/app.js');
  });
});

// C1-WP6 legitimately consolidated _s5_buildCoachSystemPrompt's two historical layers into
// one function inside js/coach/coachPromptComposer.js (intentional — see
// tests/c1Wp6Wiring.test.js) — it no longer exists in app.js at all, so it was removed from
// this list. The other three non-engine wrappers are untouched, still out of scope for both
// B2 and WP6.
test('4. non-engine wrappers were left untouched', () => {
  const preserved = ['_s4_renderProfile', '_s5_callClaude', '_s5_renderSettings_u'];
  preserved.forEach((sym) => {
    assert.notEqual(appJs.indexOf(sym), -1, sym + ' must still exist (non-engine wrapper, out of B2 scope)');
  });
});

test('5. scheduleLocalNotifications has exactly one definition (no base + replacement pair)', () => {
  const matches = appJs.match(/function scheduleLocalNotifications\s*\(/g) || [];
  assert.equal(matches.length, 1, 'scheduleLocalNotifications must be defined exactly once');
  assert.equal(appJs.indexOf('scheduleLocalNotifications = function'), -1, 'no bare reassignment (override-chain) form should remain');
});

test('6. Registry orchestration calls exist at the six approved invocation points (B2 Code Review Round 4 API)', () => {
  const expectations = [
    { fn: 'showApp', call: 'runAppReadyEngines()' },
    { fn: 'initNotifications', call: 'runAuthSessionReadyEngines()' },
    { fn: 'logWeight', call: "runEngineAction('SOURCE_DATA_CHANGED', 'adaptiveTdeeEngine', 'WEIGHT_CHANGED')" },
    { fn: 'saveWorkout', call: "runEngineAction('SOURCE_DATA_CHANGED', 'triggerEngine', 'WORKOUT_COMPLETED'" },
    { fn: 'confirmDayLight', call: "runEngineAction('SOURCE_DATA_CHANGED', 'adaptiveTdeeEngine', 'WEIGHT_CHANGED')" },
    { fn: 'setAdaptiveRate', call: "runEngineAction('MANUAL', 'adaptiveTdeeEngine', 'ADAPTIVE_RECHECK')" },
    { fn: 'toggleAdaptive', call: "runEngineAction('MANUAL', 'adaptiveTdeeEngine', 'ADAPTIVE_RECHECK')" }
  ];
  expectations.forEach((exp) => {
    const fnIndex = appJs.search(new RegExp('function ' + exp.fn + '\\s*\\('));
    assert.notEqual(fnIndex, -1, exp.fn + ' must exist');
    const fnBody = appJs.slice(fnIndex, fnIndex + 1200);
    assert.ok(fnBody.indexOf(exp.call) !== -1, exp.fn + '() must call ' + exp.call);
  });
});

test('6b. runAppReadyEngines() supplies an explicit, distinct action for all four engines (no shared/undefined action)', () => {
  const fnIndex = appJs.search(/function runAppReadyEngines\s*\(/);
  assert.notEqual(fnIndex, -1);
  const fnBody = appJs.slice(fnIndex, fnIndex + 600);
  assert.match(fnBody, /habitEngine:\s*'RECOMPUTE'/);
  assert.match(fnBody, /patternEngine:\s*'RECOMPUTE'/);
  assert.match(fnBody, /adaptiveTdeeEngine:\s*'ADAPTIVE_CHECK'/);
  assert.match(fnBody, /triggerEngine:\s*'DAILY_COACH_CHECK'/);
});

test('6c. no adapter uses the old lenient "ctx.action &&" default-on-undefined pattern', () => {
  assert.equal(appJs.indexOf("if (ctx.action &&"), -1, 'no adapter may treat a missing action as "run my default" any more — the Registry itself now gates on NO_ACTION_FOR_ENGINE');
});

test('6d. Habit Engine single-flight wrapper exists and is used by both the registered adapter and Pattern\'s internal call', () => {
  assert.match(appJs, /function runHabitEngineSingleFlight\s*\(/);
  assert.match(appJs, /var _habitInFlight/);
  // registered habitEngine adapter must call the single-flight wrapper, not the raw function directly
  // (B3: now passed ctx.state as an explicit argument — runHabitEngineSingleFlight(ctx.state))
  const habitAdapterIndex = appJs.search(/id:\s*'habitEngine'/);
  const habitAdapterBody = appJs.slice(habitAdapterIndex, habitAdapterIndex + 1200);
  assert.match(habitAdapterBody, /runHabitEngineSingleFlight\(/);
  assert.equal(/await runHabitEngine\(ctx\.state\)/.test(habitAdapterBody), false, 'the adapter must go through the single-flight wrapper, not call runHabitEngine directly');
  // Pattern's internal call site must also go through the single-flight wrapper (no access
  // argument available there — B3: it self-provisions its own habitEngine capability)
  const patternFnIndex = appJs.search(/async function runPatternEngine\s*\(/);
  const patternFnBody = appJs.slice(patternFnIndex, patternFnIndex + 1200);
  assert.match(patternFnBody, /runHabitEngineSingleFlight\(\)/);
  assert.equal(/await runHabitEngine\(effectiveAccess\)|await runHabitEngine\(\)/.test(patternFnBody), false, 'Pattern must no longer call the raw runHabitEngine() directly');
});

test('7. adaptiveTdeeEngine and triggerEngine declare exactly the SPEC-approved actions', () => {
  const adaptiveActions = ['ADAPTIVE_CHECK', 'WEIGHT_CHANGED', 'ADAPTIVE_RECHECK'];
  const triggerActions = ['DAILY_COACH_CHECK', 'WORKOUT_COMPLETED', 'LOCAL_NOTIFICATION_SCHEDULE'];
  const adaptiveIndex = appJs.search(/id:\s*'adaptiveTdeeEngine'/);
  const adaptiveBody = appJs.slice(adaptiveIndex, adaptiveIndex + 2600);
  adaptiveActions.forEach((a) => assert.ok(adaptiveBody.indexOf(a) !== -1, 'adaptiveTdeeEngine must reference action ' + a));

  const triggerIndex = appJs.search(/id:\s*'triggerEngine'/);
  const triggerBody = appJs.slice(triggerIndex, triggerIndex + 2600);
  triggerActions.forEach((a) => assert.ok(triggerBody.indexOf(a) !== -1, 'triggerEngine must reference action ' + a));
});

test('7b. habitEngine and patternEngine adapters check the explicit RECOMPUTE action', () => {
  ['habitEngine', 'patternEngine'].forEach((id) => {
    const idIndex = appJs.search(new RegExp("id:\\s*'" + id + "'"));
    const body = appJs.slice(idIndex, idIndex + 500);
    assert.match(body, /ctx\.action !== 'RECOMPUTE'/, id + ' adapter must check for the explicit RECOMPUTE action');
  });
});

test('8. applyAdaptiveUpdate is not registered with the Engine Registry (stays manual, per B2 SPEC §17)', () => {
  assert.equal(appJs.indexOf("run: async function () {\n      await applyAdaptiveUpdate"), -1);
  // negative check: applyAdaptiveUpdate's own definition must not contain an EngineRegistry.register/_registerEngine call
  const fnIndex = appJs.search(/async function applyAdaptiveUpdate\s*\(/);
  assert.notEqual(fnIndex, -1);
  const fnEnd = appJs.indexOf('\n}', fnIndex);
  const fnBody = appJs.slice(fnIndex, fnEnd);
  assert.equal(fnBody.indexOf('EngineRegistry'), -1, 'applyAdaptiveUpdate() must not touch EngineRegistry');
});

test('9. fireWorkoutTrigger accepts a State Access capability and writes only through it (B3: session guard now enforced by the access layer)', () => {
  const fnIndex = appJs.search(/async function fireWorkoutTrigger\s*\(/);
  assert.notEqual(fnIndex, -1);
  const fnBody = appJs.slice(fnIndex, fnIndex + 300);
  assert.match(fnBody, /fireWorkoutTrigger\s*\(\s*burn\s*,\s*access\s*\)/);
  assert.match(fnBody, /access\.write\.recordTriggerOutcome/, 'fireWorkoutTrigger must write only through the State Access capability, not saveProfile()/logCoachEvent() directly');
  const callSiteIndex = appJs.search(/await fireWorkoutTrigger\(burn, ctx\.state\)/);
  assert.notEqual(callSiteIndex, -1, 'the triggerEngine adapter must pass its State Access capability into fireWorkoutTrigger');
  // the adapter itself still guards before/after with SessionLifecycle, independent of the access layer's own internal check
  const adapterIndex = appJs.search(/id:\s*'triggerEngine'/);
  const adapterBody = appJs.slice(adapterIndex, adapterIndex + 2600);
  assert.match(adapterBody, /if \(!SessionLifecycle\.isCurrent\(gen\)\) return \{ status: 'SKIPPED', error: \{ code: 'STALE_SESSION'/);
});

test('10. index.html loads engineRegistry.js before app.js', () => {
  const engineIdx = indexHtml.indexOf('js/engineRegistry.js');
  const appIdx = indexHtml.indexOf('js/app.js');
  assert.notEqual(engineIdx, -1, 'engineRegistry.js script tag must exist');
  assert.notEqual(appIdx, -1, 'app.js script tag must exist');
  assert.ok(engineIdx < appIdx, 'engineRegistry.js must load before app.js');
});

test('11. service worker SHELL includes engineRegistry.js and cache version was bumped', () => {
  assert.match(swJs, /\/fitme\/js\/engineRegistry\.js/, 'engineRegistry.js must be in the SHELL cache list');
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.notEqual(versionMatch, null);
  assert.equal(versionMatch[1], '2.35.0');
});

test('12. APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.notEqual(appVersionMatch, null);
  assert.equal(appVersionMatch[1], '2.35.0');
});

test('13. engineRegistry.js stays a pure orchestration module — no Firestore/DOM API calls (only doc comments may mention them)', () => {
  // static structural guard: strip comment lines first so the header's own
  // "does NOT read Firestore/DOM" doc comment doesn't trip a naive substring check.
  const engineRegistryJs = fs.readFileSync(path.join(__dirname, '../js/engineRegistry.js'), 'utf8');
  const codeOnly = engineRegistryJs
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  ['firebase.', '.collection(', 'document.', 'window.location'].forEach((needle) => {
    assert.equal(codeOnly.indexOf(needle), -1, 'engineRegistry.js code (outside comments) must stay free of ' + needle);
  });
});
