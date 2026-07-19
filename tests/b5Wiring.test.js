// B5 — static source/wiring checks (SPEC §57.9 Integration). Dependency-free: reads the
// actual repository files as text and asserts structural facts about them. Does NOT execute
// app.js (no DOM/Firebase harness — same intentional scope limit as tests/b2Wiring.test.js).
// Run with: node --test tests/b5Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const stateAccessJs = fs.readFileSync(path.join(__dirname, '../js/stateAccess.js'), 'utf8');
const consumerJs = fs.readFileSync(path.join(__dirname, '../js/derivedIntelligenceConsumer.js'), 'utf8');
const promptJs = fs.readFileSync(path.join(__dirname, '../js/derivedIntelligencePrompt.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

function wrapperBody() {
  const start = appJs.indexOf('buildCoachSystemPrompt = async function()');
  assert.notEqual(start, -1, 'buildCoachSystemPrompt wrapper must exist and be async');
  const end = appJs.indexOf('\n};', start);
  return appJs.slice(start, end);
}

test('75. Coach consumes the B5 adapter (buildCoachSystemPrompt calls DerivedIntelligenceConsumer.build)', () => {
  const body = wrapperBody();
  assert.match(body, /DerivedIntelligenceConsumer\.build\(/);
  assert.match(body, /DerivedIntelligencePrompt\.project\(/);
});

test('76. Coach no longer reads raw Habits directly from the prompt-building path', () => {
  const body = wrapperBody();
  assert.equal(body.indexOf('coachMemory.habits'), -1);
  assert.equal(body.indexOf('.habits'), -1);
});

test('77. Coach no longer reads raw Patterns directly from the prompt-building path', () => {
  const body = wrapperBody();
  assert.equal(body.indexOf('coachMemory.patterns'), -1);
  assert.equal(body.indexOf('.patterns'), -1);
});

test('78-79. Habit-source and Pattern-source failures do not block Coach (B5 call is wrapped in try/catch)', () => {
  const body = wrapperBody();
  assert.match(body, /try\s*\{[\s\S]*DerivedIntelligenceConsumer\.build\([\s\S]*\}\s*catch/);
});

test('80. total B5 failure does not block the existing Coach fallback (base/mem prompt still returned)', () => {
  const body = wrapperBody();
  assert.match(body, /const base = _s5_buildCoachSystemPrompt\(\);/);
  assert.match(body, /const mem = coachMemoryPromptFragment\(\);/);
  assert.match(body, /return derived \? \(withMem \+ ' ' \+ derived\) : withMem;/);
});

test('81. no B5 writes reach the Persistence Gateway (consumer is read-only)', () => {
  // js/persistenceGateway.js is mentioned once, in a header comment describing the
  // architectural pattern being followed — assert there is no actual call/require of it.
  assert.equal(consumerJs.indexOf('PersistenceGateway.persist'), -1);
  assert.equal(consumerJs.indexOf("require('../js/persistenceGateway"), -1);
  assert.doesNotMatch(consumerJs, /write\s*:/);
  const diPermission = stateAccessJs.slice(stateAccessJs.indexOf('derivedIntelligenceConsumer:'));
  assert.match(diPermission, /writes:\s*\[\]/);
});

test('82. no producer recomputation triggered by consumption (consumer never calls the Engine Registry or Habit/Pattern engines)', () => {
  assert.equal(consumerJs.indexOf('EngineRegistry'), -1);
  assert.equal(consumerJs.indexOf('runHabitEngine'), -1);
  assert.equal(consumerJs.indexOf('runPatternEngine'), -1);
  assert.equal(consumerJs.indexOf('RECOMPUTE'), -1);
});

test('module registration: both B5 modules are loaded before js/app.js in index.html and sw.js', () => {
  const iHabit = indexHtml.indexOf('js/derivedIntelligenceConsumer.js');
  const iPrompt = indexHtml.indexOf('js/derivedIntelligencePrompt.js');
  const iApp = indexHtml.indexOf('js/app.js');
  assert.ok(iHabit !== -1 && iPrompt !== -1 && iApp !== -1);
  assert.ok(iHabit < iApp && iPrompt < iApp, 'B5 modules must load before app.js');

  const sHabit = swJs.indexOf('js/derivedIntelligenceConsumer.js');
  const sPrompt = swJs.indexOf('js/derivedIntelligencePrompt.js');
  assert.ok(sHabit !== -1 && sPrompt !== -1, 'B5 modules must be in the sw.js SHELL cache list');
});

test('B5 does not register as a B2 Engine (ADR-B5-008 — capability-holder only, not EngineRegistry.register())', () => {
  assert.equal(consumerJs.indexOf('EngineRegistry.register'), -1);
  const fnStart = appJs.indexOf('function runAppReadyEngines()');
  assert.notEqual(fnStart, -1);
  const fnBody = appJs.slice(fnStart, appJs.indexOf('\n}', fnStart));
  assert.match(fnBody, /actions:\s*\{/);
  assert.doesNotMatch(fnBody, /derivedIntelligenceConsumer/);
});

test('DerivedIntelligenceConsumer is configured in js/app.js reusing the existing habitView/patternView read ops', () => {
  const start = appJs.indexOf('DerivedIntelligenceConsumer.configure(');
  assert.notEqual(start, -1);
  const end = appJs.indexOf('\n});', start);
  const body = appJs.slice(start, end);
  assert.match(body, /read\.habitView\(\)/);
  assert.match(body, /read\.patternView\(\)/);
  assert.match(body, /engineId: 'derivedIntelligenceConsumer', action: 'BUILD'/);
});

// External Implementation Review correction (B5 v1.2 §41.2/§42.3/§51.4): window must receive
// only the production-safe adapter (routed through buildProductionSafe), never the complete
// core module — TEST_HARNESS/TEST_FULL_DIAGNOSTIC_V1 must be reachable only via module.exports.
test('correction. window is assigned the production-safe adapter, not the complete core module', () => {
  const windowLine = consumerJs.match(/if \(typeof window !== 'undefined'\) \{ window\.DerivedIntelligenceConsumer = (\w+); \}/);
  assert.ok(windowLine, 'window.DerivedIntelligenceConsumer assignment must exist');
  assert.equal(windowLine[1], 'PRODUCTION_SAFE_API', 'window must be assigned the production-safe object, not the full API');

  const moduleLine = consumerJs.match(/if \(typeof module !== 'undefined' && module\.exports\) \{ module\.exports = (\w+); \}/);
  assert.ok(moduleLine);
  assert.equal(moduleLine[1], 'API', 'the Node module export must remain the complete core module for testability');

  const prodApiStart = consumerJs.indexOf('var PRODUCTION_SAFE_API');
  const prodApiBody = consumerJs.slice(prodApiStart, consumerJs.indexOf('});', prodApiStart));
  assert.doesNotMatch(prodApiBody, /TEST_HARNESS/);
  assert.doesNotMatch(prodApiBody, /TEST_FULL_DIAGNOSTIC_V1/);
  assert.doesNotMatch(prodApiBody, /RECOMMENDATION_ENGINE/);
  assert.match(prodApiBody, /build: buildProductionSafe/);
});
