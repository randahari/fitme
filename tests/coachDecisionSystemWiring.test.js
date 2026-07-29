// TASK-004 — Coach Decision System wiring/integration tests: Composite Engine registration,
// Engine Registry compatibility, StateAccess boundary, DerivedIntelligenceConsumer production
// wiring, Composition Root wiring, Coach/Expression boundary. Static source checks follow the
// same convention as tests/b5Wiring.test.js / tests/b2Wiring.test.js (index.html/app.js are
// browser scripts and cannot be require()'d from Node).
// Run with: node --test tests/coachDecisionSystemWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EngineRegistry = require('../js/engineRegistry.js');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const RegisterCoachDecisionSystem = require('../js/coachDecisionSystem/registerCoachDecisionSystem.js');
const RecommendationEngine = require('../js/coachDecisionSystem/recommendationEngine.js');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const recommendationEngineJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/recommendationEngine.js'), 'utf8');
const orchestratorJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
const memoryLayerJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');

function freshRegistry() { EngineRegistry.__resetForTests__(); }

// ── Composite Engine registration (D3 §17 Decision 1, CC-05) ──

test('1. registerAll() registers exactly one engine, id "coachDecisionSystem"', () => {
  freshRegistry();
  const r = RegisterCoachDecisionSystem.registerAll();
  assert.equal(r.ok, true);
  const all = EngineRegistry.getAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, 'coachDecisionSystem');
});

test('2. the Composite Engine declares triggers[] and empty dependsOn, matching the existing four engines\' convention', () => {
  freshRegistry();
  RegisterCoachDecisionSystem.registerAll();
  const def = EngineRegistry.getAll()[0];
  assert.ok(Array.isArray(def.triggers) && def.triggers.length > 0);
  assert.deepEqual(def.dependsOn, []);
});

test('3. registering twice yields DUPLICATE_ID (no second registration path / no parallel registry)', () => {
  freshRegistry();
  RegisterCoachDecisionSystem.registerAll();
  const second = EngineRegistry.register({ id: 'coachDecisionSystem', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  assert.equal(second.ok, false);
  assert.equal(second.error.code, 'DUPLICATE_ID');
});

// ── Internal Orchestrator invocation via the real Engine Registry (Engine Registry compatibility) ──

test('4. EngineRegistry.run() invokes the Composite Engine end-to-end and normalizes its result', async () => {
  freshRegistry();
  RegisterCoachDecisionSystem.registerAll();
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: () => true
  });
  Consumer.configure({
    isSessionCurrent: () => true,
    readHabitSnapshot: async () => ({ habits: [] }),
    readPatternSnapshot: async () => ({ patterns: [] }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const runResult = await EngineRegistry.run({
    trigger: 'APP_READY',
    actions: { coachDecisionSystem: 'DECISION_PASS' },
    context: { userId: 'user-1', sessionGeneration: 1, now: Date.now() }
  });
  assert.equal(runResult.results.coachDecisionSystem.status, 'SUCCESS');
  assert.deepEqual(runResult.results.coachDecisionSystem.output.candidates, []);
});

test('5. registry-level failure normalization (ENGINE_THREW) applies unmodified if the Composite Engine throws', async () => {
  freshRegistry();
  EngineRegistry.register({ id: 'coachDecisionSystem', triggers: ['APP_READY'], dependsOn: [], run: async () => { throw new Error('boom'); } });
  const runResult = await EngineRegistry.run({ trigger: 'APP_READY', actions: { coachDecisionSystem: 'DECISION_PASS' }, context: { userId: 'u', sessionGeneration: 1 } });
  assert.equal(runResult.results.coachDecisionSystem.status, 'FAILED');
  assert.equal(runResult.results.coachDecisionSystem.error.code, 'ENGINE_THREW');
});

// ── StateAccess boundary (B3, no generic path mutation) ──

test('6. StateAccess grants coachDecisionSystem/DECISION_PASS read access to recommendationFeedbackHistory only, no writes', () => {
  StateAccess.configure({ getUserProfile: () => ({ coachEvents: [] }), getCurrentUser: () => ({ uid: 'u' }), isSessionCurrent: () => true });
  const access = StateAccess.createEngineAccess({ engineId: 'coachDecisionSystem', action: 'DECISION_PASS', userId: 'u', sessionGeneration: 1, runId: 'r' });
  assert.doesNotThrow(() => access.read.recommendationFeedbackHistory());
  // an unapproved read must be denied, not silently available (B3 §11 — no generic path mutation)
  assert.throws(() => access.read.habitView());
});

test('7. an unapproved engineId/action pair receives no approved capabilities at all', () => {
  StateAccess.configure({ getUserProfile: () => ({ coachEvents: [] }), getCurrentUser: () => ({ uid: 'u' }), isSessionCurrent: () => true });
  const access = StateAccess.createEngineAccess({ engineId: 'coachDecisionSystem', action: 'NOT_A_REAL_ACTION', userId: 'u', sessionGeneration: 1, runId: 'r' });
  assert.throws(() => access.read.recommendationFeedbackHistory());
});

// ── DerivedIntelligenceConsumer production wiring (B5, "first consumer") ──

test('8. RECOMMENDATION_ENGINE/RECOMMENDATION_SUPPORT_V1 is now reachable through the production-safe adapter', () => {
  assert.equal(Consumer.PRODUCTION_ENABLED_MAPPING.RECOMMENDATION_ENGINE, 'RECOMMENDATION_SUPPORT_V1');
});

test('9. TEST_HARNESS remains unreachable through the production-safe adapter (B5 boundary unchanged)', () => {
  assert.equal(Consumer.PRODUCTION_ENABLED_MAPPING.TEST_HARNESS, undefined);
});

// ── Composition Root wiring (static source checks — js/app.js/index.html are browser scripts) ──

test('10. js/app.js calls RegisterCoachDecisionSystem.registerAll() once, after RegisterEngines.registerAll()', () => {
  const afterExisting = appJs.indexOf('RegisterEngines.registerAll();');
  const ours = appJs.indexOf('RegisterCoachDecisionSystem.registerAll();');
  assert.notEqual(afterExisting, -1);
  assert.notEqual(ours, -1);
  assert.ok(ours > afterExisting);
});

test('11. js/app.js wires coachDecisionSystem into the APP_READY actions map, alongside the four existing engines', () => {
  const start = appJs.indexOf('function runAppReadyEngines()');
  const end = appJs.indexOf('\n}', start);
  const body = appJs.slice(start, end);
  assert.match(body, /habitEngine:\s*'RECOMPUTE'/);
  assert.match(body, /coachDecisionSystem:\s*'DECISION_PASS'/);
});

test('12. index.html loads all five new modules before js/app.js, after registerEngines.js', () => {
  const iReg = indexHtml.indexOf('js/engines/registerEngines.js');
  const iApp = indexHtml.indexOf('src="js/app.js"');
  ['recommendationCategories.js', 'recommendationEngine.js', 'memoryLayer.js', 'internalPipelineOrchestrator.js', 'registerCoachDecisionSystem.js'].forEach((f) => {
    const i = indexHtml.indexOf('js/coachDecisionSystem/' + f);
    assert.notEqual(i, -1, f + ' must be present in index.html');
    assert.ok(i > iReg, f + ' must load after registerEngines.js');
    assert.ok(i < iApp, f + ' must load before app.js');
  });
});

// ── Feedback and Suppression consumption (C2, unchanged ownership) ──

test('13. Recommendation Engine consumes FeedbackDomain.evaluateSuppression — does not define its own suppression logic', () => {
  assert.match(recommendationEngineJs, /FeedbackDomain\.evaluateSuppression\(/);
  assert.equal(recommendationEngineJs.indexOf('SUPPRESSION_RECOVERY_POLICY'), -1); // no re-declared policy
});

// ── Persistence: no writes anywhere in the new modules (no speculative persistence) ──

test('14. no new module writes to PersistenceGateway (no candidate audit trail — none required by Acceptance Criteria)', () => {
  [recommendationEngineJs, orchestratorJs, memoryLayerJs].forEach((src) => {
    assert.equal(src.indexOf('PersistenceGateway.persist'), -1);
    assert.equal(src.indexOf("require('../persistenceGateway"), -1);
  });
});

// ── Derived Intelligence consumption (B5, read-only, correct consumer/policy pair) ──

test('15. Memory Layer requests exactly the RECOMMENDATION_ENGINE/RECOMMENDATION_SUPPORT_V1 consumer/policy pair', () => {
  assert.match(memoryLayerJs, /consumer:\s*'RECOMMENDATION_ENGINE'/);
  assert.match(memoryLayerJs, /policyId:\s*'RECOMMENDATION_SUPPORT_V1'/);
});

// ── Coach/Expression boundary — no final expression performed here ──

test('16. none of the new modules reference Coach rendering/voice/tone surfaces (final expression stays out of scope)', () => {
  [recommendationEngineJs, orchestratorJs, memoryLayerJs].forEach((src) => {
    assert.equal(src.indexOf('coachPresenter'), -1);
    assert.equal(src.indexOf('coachPromptComposer'), -1);
    assert.equal(src.indexOf('triggerController'), -1);
    assert.equal(src.indexOf('innerHTML'), -1);
  });
});

// ── No ranking / no second registry / no parallel runtime (Ranking Policy, D3 Invariant AI-01) ──

test('17. the Recommendation Engine module exposes generate() only — no rank/prioritize/selectWinner export', () => {
  assert.deepEqual(Object.keys(RecommendationEngine).sort(), ['generate']);
});

test('18. no second EngineRegistry-like registration surface is introduced anywhere in the new modules', () => {
  [orchestratorJs, memoryLayerJs].forEach((src) => {
    assert.equal(src.indexOf('.register('), -1);
  });
});
