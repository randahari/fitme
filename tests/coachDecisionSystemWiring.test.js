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
const InitiativeEngine = require('../js/coachDecisionSystem/initiativeEngine.js');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const recommendationEngineJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/recommendationEngine.js'), 'utf8');
const initiativeEngineJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/initiativeEngine.js'), 'utf8');
const orchestratorJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
const memoryLayerJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
// TASK-006
const eligibilityEvaluatorJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/eligibilityEvaluator.js'), 'utf8');
const prioritizationJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/prioritization.js'), 'utf8');
const winnerSelectionJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/winnerSelection.js'), 'utf8');
const decisionFormationJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/decisionFormation.js'), 'utf8');
const safetyIntegrationPortJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/safetyIntegrationPort.js'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const TASK006_MODULES = [eligibilityEvaluatorJs, prioritizationJs, winnerSelectionJs, decisionFormationJs, safetyIntegrationPortJs];
// Expression (WP1/WP3/WP4) — the Expression module's four dedicated files, per this file's own
// #12 established enumeration ("Expression WP1 deliveryIntentContract.js + Expression WP3
// expressionInputGate.js + Expression WP4 expressionRenderingContext.js + expressionRenderer.js").
const deliveryIntentContractJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/deliveryIntentContract.js'), 'utf8');
const expressionInputGateJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/expressionInputGate.js'), 'utf8');
const expressionRenderingContextJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/expressionRenderingContext.js'), 'utf8');
const expressionRendererJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/expressionRenderer.js'), 'utf8');
const EXPRESSION_MODULES = [deliveryIntentContractJs, expressionInputGateJs, expressionRenderingContextJs, expressionRendererJs];

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

test('12. index.html loads all fifteen modules (TASK-004 five + TASK-005 initiativeEngine.js + TASK-006 five + Expression WP1 deliveryIntentContract.js + Expression WP3 expressionInputGate.js + Expression WP4 expressionRenderingContext.js + expressionRenderer.js) before js/app.js, after registerEngines.js, in dependency order', () => {
  const iReg = indexHtml.indexOf('js/engines/registerEngines.js');
  const iApp = indexHtml.indexOf('src="js/app.js"');
  const files = ['recommendationCategories.js', 'safetyIntegrationPort.js', 'prioritization.js', 'eligibilityEvaluator.js', 'recommendationEngine.js', 'initiativeEngine.js', 'winnerSelection.js', 'decisionFormation.js', 'expressionRenderingContext.js', 'memoryLayer.js', 'deliveryIntentContract.js', 'expressionInputGate.js', 'expressionRenderer.js', 'internalPipelineOrchestrator.js', 'registerCoachDecisionSystem.js'];
  var last = iReg;
  files.forEach((f) => {
    const i = indexHtml.indexOf('js/coachDecisionSystem/' + f);
    assert.notEqual(i, -1, f + ' must be present in index.html');
    assert.ok(i > iReg, f + ' must load after registerEngines.js');
    assert.ok(i < iApp, f + ' must load before app.js');
    last = i;
  });
  // prioritization.js (defines NO_SIGNAL, read at module-evaluation time via window.Prioritization
  // in the browser) must load before recommendationEngine.js/initiativeEngine.js consume it.
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/prioritization.js') < indexHtml.indexOf('js/coachDecisionSystem/recommendationEngine.js'));
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/prioritization.js') < indexHtml.indexOf('js/coachDecisionSystem/initiativeEngine.js'));
  // Expression WP2 — deliveryIntentContract.js (window.DeliveryIntentContract) must load before
  // internalPipelineOrchestrator.js, which now references it (EXP-OD-9 schema-conformance check).
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/deliveryIntentContract.js') < indexHtml.indexOf('js/coachDecisionSystem/internalPipelineOrchestrator.js'));
  // Expression WP4 — expressionRenderer.js (window.ExpressionRenderer) requires
  // DeliveryIntentContract.buildDeliveryIntent(), so it must load after deliveryIntentContract.js.
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/deliveryIntentContract.js') < indexHtml.indexOf('js/coachDecisionSystem/expressionRenderer.js'));
  // Expression WP4 (remainder) / Canonical Decision 8 — expressionRenderingContext.js
  // (window.ExpressionRenderingContext) must load before memoryLayer.js, which now requires it
  // (buildExpressionRenderingContext()), and before expressionRenderer.js, which also requires it.
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/expressionRenderingContext.js') < indexHtml.indexOf('js/coachDecisionSystem/memoryLayer.js'));
  assert.ok(indexHtml.indexOf('js/coachDecisionSystem/expressionRenderingContext.js') < indexHtml.indexOf('js/coachDecisionSystem/expressionRenderer.js'));
});

test('12b. sw.js caches all fifteen modules in its SHELL manifest, matching index.html', () => {
  ['recommendationCategories.js', 'safetyIntegrationPort.js', 'prioritization.js', 'eligibilityEvaluator.js', 'recommendationEngine.js', 'initiativeEngine.js', 'winnerSelection.js', 'decisionFormation.js', 'expressionRenderingContext.js', 'memoryLayer.js', 'deliveryIntentContract.js', 'expressionInputGate.js', 'expressionRenderer.js', 'internalPipelineOrchestrator.js', 'registerCoachDecisionSystem.js'].forEach((f) => {
    assert.notEqual(swJs.indexOf('js/coachDecisionSystem/' + f), -1, f + ' must be present in sw.js');
  });
});

// ── Expression WP2 — single-registration assertion extended: Expression's dispatch introduces no
// second Composite Engine registration, no new B2 Engine Registry entry, no new trigger type ──

test('12c. runExpressionStage is exported alongside the existing five dispatch functions — Expression remains an internal collaborator, never independently registered', () => {
  const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');
  assert.equal(typeof Orchestrator.runExpressionStage, 'function');
  freshRegistry();
  RegisterCoachDecisionSystem.registerAll();
  assert.equal(EngineRegistry.getAll().length, 1); // still exactly one Composite Engine registration
});

test('12d. registerCoachDecisionSystem.js and js/engineRegistry.js are unchanged by Expression WP2 (stop-condition check, per EXPRESSION_IMPLEMENTATION_PLAN.md WP2)', () => {
  const registerJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/registerCoachDecisionSystem.js'), 'utf8');
  assert.equal(registerJs.indexOf('runExpressionStage'), -1); // registers only Orchestrator.run, never a per-function entry
  assert.equal(registerJs.indexOf('trigger:'), -1); // no new trigger type
});

test('12e. internalPipelineOrchestrator.js introduces no new trigger type via runExpressionStage', () => {
  assert.equal(/trigger:\s*\[/.test(orchestratorJs), false);
});

// ── Feedback and Suppression consumption (C2, unchanged ownership) ──

test('13. Recommendation Engine consumes FeedbackDomain.evaluateSuppression — does not define its own suppression logic', () => {
  assert.match(recommendationEngineJs, /FeedbackDomain\.evaluateSuppression\(/);
  assert.equal(recommendationEngineJs.indexOf('SUPPRESSION_RECOVERY_POLICY'), -1); // no re-declared policy
});

// ── Persistence: no writes anywhere in the new modules (no speculative persistence) ──

test('14. no new module writes to PersistenceGateway (no candidate audit trail — none required by Acceptance Criteria)', () => {
  [recommendationEngineJs, initiativeEngineJs, orchestratorJs, memoryLayerJs].concat(TASK006_MODULES).forEach((src) => {
    assert.equal(src.indexOf('PersistenceGateway.persist'), -1);
    assert.equal(src.indexOf("require('../persistenceGateway"), -1);
  });
});

// ── TASK-006 — Memory and Persistence Boundary tests (§29, §35.14) ──

test('14b. no TASK-006 module calls StateAccess, DerivedIntelligenceConsumer, js/memory.js, or typedMemoryServerWrite directly (§29.3/29.4/29.5)', () => {
  TASK006_MODULES.forEach((src) => {
    assert.equal(src.indexOf("require('../stateAccess"), -1);
    assert.equal(src.indexOf("require('../derivedIntelligenceConsumer"), -1);
    assert.equal(src.indexOf("require('../memory.js"), -1);
    assert.equal(src.indexOf('typedMemoryServerWrite'), -1);
    assert.equal(src.indexOf('firestore'), -1);
    assert.equal(src.indexOf('window.StateAccess'), -1);
  });
});

test('14c. no TASK-006 module performs any durable write of any kind — zero write-capable calls anywhere in Stage 5/7/8/9 (§29.5, Canonical Decision CD-T006-04: no persistent budget state)', () => {
  TASK006_MODULES.forEach((src) => {
    assert.equal(src.indexOf('.write.'), -1);
    assert.equal(src.indexOf('.persist('), -1);
  });
});

// ── Derived Intelligence consumption (B5, read-only, correct consumer/policy pair) ──

test('15. Memory Layer requests exactly the RECOMMENDATION_ENGINE/RECOMMENDATION_SUPPORT_V1 and INITIATIVE_ENGINE/INITIATIVE_SUPPORT_V1 consumer/policy pairs', () => {
  assert.match(memoryLayerJs, /consumer:\s*'RECOMMENDATION_ENGINE'/);
  assert.match(memoryLayerJs, /policyId:\s*'RECOMMENDATION_SUPPORT_V1'/);
  assert.match(memoryLayerJs, /consumer:\s*'INITIATIVE_ENGINE'/);
  assert.match(memoryLayerJs, /policyId:\s*'INITIATIVE_SUPPORT_V1'/);
});

test('15b. the Initiative Engine itself never calls StateAccess, DerivedIntelligenceConsumer, or Firestore directly (Memory-Layer-only read path, D3 §8.1/§11.1)', () => {
  assert.equal(initiativeEngineJs.indexOf("require('../stateAccess"), -1);
  assert.equal(initiativeEngineJs.indexOf("require('../derivedIntelligenceConsumer"), -1);
  assert.equal(initiativeEngineJs.indexOf('firestore'), -1);
  assert.equal(initiativeEngineJs.indexOf('window.StateAccess'), -1);
  assert.equal(initiativeEngineJs.indexOf('window.DerivedIntelligenceConsumer'), -1);
});

// ── Coach/Expression boundary — no final expression performed here ──

test('16. none of the new modules reference Coach rendering/voice/tone surfaces (final expression stays out of scope)', () => {
  [recommendationEngineJs, initiativeEngineJs, orchestratorJs, memoryLayerJs].concat(TASK006_MODULES).forEach((src) => {
    assert.equal(src.indexOf('coachPresenter'), -1);
    assert.equal(src.indexOf('coachPromptComposer'), -1);
    assert.equal(src.indexOf('triggerController'), -1);
    assert.equal(src.indexOf('innerHTML'), -1);
  });
});

// ── TASK-006 — Expression and Delivery Boundary tests (§30, §35.15) ──

test('16b. no TASK-006 module has any knowledge of platform/UI/notification/push/voice surfaces — the Decision Engine produces a Terminal Decision only', () => {
  TASK006_MODULES.concat([orchestratorJs]).forEach((src) => {
    ['notification', 'pushNotification', 'chatCard', 'triggerCard', 'document.', 'window.alert'].forEach((needle) => {
      assert.equal(src.toLowerCase().indexOf(needle.toLowerCase()), -1, needle + ' found in ' + src.slice(0, 40));
    });
  });
});

test('16c. decisionFormation.js exposes no Expression/Delivery-Intent-production or wording-generation function', () => {
  const DecisionFormation = require('../js/coachDecisionSystem/decisionFormation.js');
  assert.deepEqual(Object.keys(DecisionFormation).sort(), ['form', 'formDecisionPassSilence']);
});

// ── TASK-006 — Native / Platform-Neutral Contract tests (§35.19, D3 §5.5/§14) ──

test('16d. every TASK-006 module is Node-loadable with no DOM/window/Firebase reference', () => {
  TASK006_MODULES.forEach((src) => {
    assert.equal(/\bdocument\./.test(src), false);
    assert.equal(/\bnavigator\./.test(src), false);
    assert.equal(src.indexOf('firebase'), -1);
  });
});

// ── TASK-006 — Forbidden Responsibilities (§13) ──

test('16e. no TASK-006 module generates Candidate content, and no module bypasses/downgrades/reinterprets a Safety determination (§13 items 1-2, 6-7)', () => {
  [eligibilityEvaluatorJs, prioritizationJs, winnerSelectionJs, decisionFormationJs].forEach((src) => {
    assert.equal(src.indexOf('opportunity.proposedAction'), -1); // never authors Candidate action content
  });
  assert.equal(winnerSelectionJs.indexOf('disqualified = false'), -1); // never force-clears a disqualification
  assert.equal(decisionFormationJs.indexOf("disposition = 'UNMODIFIED'"), -1); // never overrides a returned disposition
});

test('16f. the Decision Engine has no direct Coach Runtime invocation path anywhere (§28.9)', () => {
  TASK006_MODULES.concat([orchestratorJs]).forEach((src) => {
    assert.equal(src.indexOf("require('../coach/"), -1);
    assert.equal(src.indexOf("require('../trigger/"), -1);
  });
});

// ── No ranking / no second registry / no parallel runtime (Ranking Policy, D3 Invariant AI-01) ──

test('17. the Recommendation Engine module exposes generate() only — no rank/prioritize/selectWinner export', () => {
  assert.deepEqual(Object.keys(RecommendationEngine).sort(), ['generate']);
});

test('17b. the Initiative Engine module exposes no rank/prioritize/selectWinner/formDecision export (D2 Unit 07 Forbidden Responsibilities)', () => {
  ['rank', 'prioritize', 'selectWinner', 'formDecision', 'disqualify'].forEach((fn) => {
    assert.equal(typeof InitiativeEngine[fn], 'undefined', fn);
  });
});

test('18. no second EngineRegistry-like registration surface is introduced anywhere in the new modules', () => {
  [orchestratorJs, memoryLayerJs, initiativeEngineJs].concat(TASK006_MODULES).forEach((src) => {
    assert.equal(src.indexOf('.register('), -1);
  });
});

test('18b. no TASK-006 module introduces a new trigger type beyond the existing B2 Trigger Catalog (§28.8)', () => {
  TASK006_MODULES.concat([orchestratorJs]).forEach((src) => {
    assert.equal(/trigger:\s*\[/.test(src), false);
  });
});

// ── TASK-005 — no StateAccess permission-matrix entry beyond TASK-004's baseline was required ──

test('19. StateAccess coachDecisionSystem/DECISION_PASS permission entry is unchanged by TASK-005 (Habit/Pattern/Relationship-Maturity signal reach the Initiative Engine only via the Memory Layer\'s existing B5 read path, not a new raw StateAccess grant)', () => {
  StateAccess.configure({ getUserProfile: () => ({ coachEvents: [] }), getCurrentUser: () => ({ uid: 'u' }), isSessionCurrent: () => true });
  const access = StateAccess.createEngineAccess({ engineId: 'coachDecisionSystem', action: 'DECISION_PASS', userId: 'u', sessionGeneration: 1, runId: 'r' });
  assert.doesNotThrow(() => access.read.recommendationFeedbackHistory());
  assert.throws(() => access.read.habitView());
  assert.throws(() => access.read.patternView());
});

// ── Expression WP9 — Coach Runtime handoff wiring (Safety Layer production injection as ordinary
// Engineering integration within the already-approved architecture; ExpressionRenderer wired as the
// production expressionPort; TriggerController.presentDeliveryIntent wired as the presentation call,
// reusing the existing #trigger-card — D3 Decision 6, no new delivery surface) ──

test('20. internalPipelineOrchestrator.js requires the real SafetyLayer (SL-001) and ExpressionRenderer (Expression WP4) as production ports — no stub/mock port constructed inline', () => {
  assert.match(orchestratorJs, /require\(['"]\.\/safetyLayer\.js['"]\)/);
  assert.match(orchestratorJs, /require\(['"]\.\/expressionRenderer\.js['"]\)/);
});

test('21. js/app.js configures ExpressionRenderer with a real generateFn (reusing the existing callClaude/ClaudeProxyClient path — no new generation mechanism invented)', () => {
  assert.match(appJs, /ExpressionRenderer\.configure\(/);
  const start = appJs.indexOf('ExpressionRenderer.configure(');
  const end = appJs.indexOf('\n});', start);
  const body = appJs.slice(start, end);
  assert.match(body, /generateFn/);
  assert.match(body, /callClaude\(/);
});

test('22. js/app.js dispatches a DISPATCHED Expression outcome to TriggerController.presentDeliveryIntent — no direct DOM manipulation performed from app.js itself', () => {
  assert.match(appJs, /TriggerController\.presentDeliveryIntent\(/);
  const start = appJs.indexOf('function runAppReadyEngines()');
  const end = appJs.indexOf('\nfunction ', start + 1);
  const body = appJs.slice(start, end === -1 ? undefined : end);
  assert.match(body, /expression\.status === 'DISPATCHED'/);
  assert.match(body, /TriggerController\.presentDeliveryIntent\(/);
});

test('23. triggerController.js\'s new presentDeliveryIntent() reuses the existing #trigger-card element — introduces no new delivery surface (D3 Decision 6)', () => {
  const triggerControllerJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerController.js'), 'utf8');
  const start = triggerControllerJs.indexOf('function presentDeliveryIntent');
  assert.notEqual(start, -1);
  const end = triggerControllerJs.indexOf('\n  }', start);
  const body = triggerControllerJs.slice(start, end);
  assert.match(body, /getElementById\(['"]trigger-card['"]\)/);
});

test('24. memoryLayer.js\'s new D2-EF-07 correction-arrival functions stay within the Memory Layer\'s own Decision-Input intake ownership — no PersistenceGateway/Firestore durable write introduced by them', () => {
  assert.match(memoryLayerJs, /function recordExplicitUserStatementArrival/);
  assert.match(memoryLayerJs, /function getExplicitUserStatementArrivalTimestamp/);
  assert.equal(memoryLayerJs.indexOf('PersistenceGateway.persist'), -1);
});

test('25. internalPipelineOrchestrator.js\'s run() performs the D2-EF-07 pre-dispatch supersession check itself — Expression receives no new correction-detection input, and runExpressionStage()\'s own existing signature is unchanged', () => {
  assert.match(orchestratorJs, /getExplicitUserStatementArrivalTimestamp/);
  // runExpressionStage's own signature — (terminalDecision, expressionRenderingContext, port) — is
  // unchanged; the supersession check happens in run() strictly before the call, never inside it.
  assert.match(orchestratorJs, /runExpressionStage\(terminalDecision, renderingContextResult\.expressionRenderingContext, ExpressionRenderer\)/);
});

// ── Expression WP11 (EXPRESSION_IMPLEMENTATION_PLAN.md WP11) — Memory/Persistence boundary
// confirmation (§18, EXP-41; AC-5). Audit only, by direct structural analogy to the already-
// confirmed absence of one for the Decision Engine (`TASK_006_SPEC_v1.0.md` §29.3, this file's own
// #14/#16 above) and the Safety Layer (`SL-001_SPEC_v1.0.md` §20/§303) — Expression has no
// StateAccess capability of its own and performs no durable write of its own; where retention is
// needed (e.g. Coaching History), that remains the Memory Layer's responsibility (Stages 11-13),
// not Expression's. This file's own #14/#16 checks above never covered these four files — they
// cover recommendationEngineJs/initiativeEngineJs/orchestratorJs/memoryLayerJs/TASK006_MODULES
// only — so this is genuinely new coverage, not a duplicate of existing assertions. ──

test('26. the Expression module (deliveryIntentContract.js, expressionInputGate.js, expressionRenderingContext.js, expressionRenderer.js) performs zero calls to js/persistenceGateway.js (EXP-41, AC-5)', () => {
  EXPRESSION_MODULES.forEach((src) => {
    assert.equal(src.indexOf('PersistenceGateway.persist'), -1);
    assert.equal(src.indexOf("require('../persistenceGateway"), -1);
    assert.equal(src.indexOf('.persist('), -1);
  });
});

test('27. the Expression module holds no StateAccess capability of its own — no StateAccess.createEngineAccess call, no direct require, no window.StateAccess reference (EXP-41, AC-5)', () => {
  EXPRESSION_MODULES.forEach((src) => {
    assert.equal(src.indexOf('StateAccess.createEngineAccess'), -1);
    assert.equal(src.indexOf("require('../stateAccess"), -1);
    assert.equal(src.indexOf('window.StateAccess'), -1);
  });
});

// ── Expression WP12 (EXPRESSION_IMPLEMENTATION_PLAN.md WP12) — Determinism, Explainability,
// Accessibility, Language, and Cross-Platform confirmation (§20-§24; AC-6, AC-11). Audit findings,
// cited rather than duplicated: EXP-44 (execution model) and AC-6/EXP-43 (determinism) are
// confirmed by tests/internalPipelineOrchestrator.test.js's own #16/#43 and
// tests/expressionRenderer.test.js's own #69; EXP-45/EXP-53/AC-11 (correlation carries traceability
// without duplication) are already fully, precisely tested by tests/deliveryIntentContract.test.js
// (correlation schema-locked to ['decisionId']; missing/empty decisionId and any extra field are
// both REJECTED) — not re-tested here. This section closes the one remaining, previously-unchecked
// audit surface identified at this Work Package's own Pre-Flight Review: §21/§22/§24
// accessibility/RTL/native-platform code absence in the Expression module's own four files
// (Expression produces no UI by construction, D3 §8.6 Decision 5). The `window.X = API`/
// `window.OtherModule` lines already present in these files are the repository's own established
// dual-export/module-resolution convention (confirmed identical in every `js/coachDecisionSystem/*`
// module, TASK-004 onward) — not UI code, and correctly not flagged here. ──

test('28. the Expression module contains no accessibility markup, no RTL/directional layout rule, and no native-platform-specific code of its own (§21 EXP-46; §22 EXP-47\'s Explicit Out of Scope; §24 EXP-48)', () => {
  EXPRESSION_MODULES.forEach((src) => {
    assert.equal(/\bdocument\./.test(src), false);
    assert.equal(/\baria-[a-z]+/i.test(src), false);
    assert.equal(/\brole\s*=/.test(src), false);
    assert.equal(/dir\s*=\s*['"]?rtl/i.test(src), false);
    assert.equal(/direction\s*:/.test(src), false);
    assert.equal(/Platform\.OS|NativeModules|react-native/i.test(src), false);
  });
});

test('29. runExpressionStage() and ExpressionRenderer.render() both use the async/await execution model already established for the B2 async contract (EXP-44) — no further Architecture Decision was required or introduced', () => {
  assert.match(orchestratorJs, /async function runExpressionStage/);
  assert.match(expressionRendererJs, /async function render/);
});

// ── Expression WP13 (EXPRESSION_IMPLEMENTATION_PLAN.md WP13) — resolves `EXP-OD-11`, the
// deterministic verification mechanism for CD-EXP-02/CD-EXP-03/CD-EXP-04's qualitative
// content-judgment rules. By direct structural analogy to `tests/safetyIntegrationPort.test.js`'s
// own identical negative-test convention for `safetyIntegrationPortTestDouble.js` (Canonical
// Decision CD-T006-05, §21.8) — the qualitative-verification double
// (tests/fixtures/expressionQualitativeVerificationTestDouble.js) is a test-only fixture and MUST
// never be reachable from any production Expression/orchestrator module. ──

test('30. no production Expression/orchestrator module imports or references the test-only qualitative-verification double (EXP-OD-11 resolution, mirrors CD-T006-05\'s identical Safety-double guarantee)', () => {
  EXPRESSION_MODULES.concat([orchestratorJs]).forEach((src) => {
    assert.equal(src.indexOf('expressionQualitativeVerificationTestDouble'), -1);
    assert.equal(/require\(['"].*fixtures/.test(src), false); // a documentation mention of "see tests/fixtures/" is fine; an actual require(...) is not
  });
});

// ── Expression WP14 (EXPRESSION_IMPLEMENTATION_PLAN.md WP14) — cross-cutting audit. Extends this
// file's own existing #16 (Coach/Expression boundary) and #14 (Decision Engine reach-back adjacent)
// checks — which cover only the older TASK-004/005/006 module set — to the Expression module's own
// four dedicated files, closing the narrow AC-3/AC-4 coverage gap identified at WP14's own
// Pre-Flight Review. No production code changed; this is additive test coverage of already-correct,
// already-verified-by-inspection behavior. ──

test('31. the Expression module performs no Decision Engine reach-back (AC-3, EXP-17/EXP-39) — no require() of eligibilityEvaluator.js, winnerSelection.js, decisionFormation.js, recommendationEngine.js, initiativeEngine.js, or prioritization.js', () => {
  var DECISION_ENGINE_FILES = ['eligibilityEvaluator.js', 'winnerSelection.js', 'decisionFormation.js', 'recommendationEngine.js', 'initiativeEngine.js', 'prioritization.js'];
  EXPRESSION_MODULES.forEach((src) => {
    DECISION_ENGINE_FILES.forEach((f) => {
      assert.equal(src.indexOf("require('./" + f + "')"), -1, f + ' must not be required by the Expression module');
      assert.equal(src.indexOf("require('../" + f + "')"), -1, f + ' must not be required by the Expression module');
    });
  });
});

test('32. the Expression module has no unauthorized chat/trigger/UI/delivery-surface dependency of its own (AC-4, EXP-15/EXP-20) — no coachPresenter, coachPromptComposer, triggerController, or innerHTML reference in actual code, extending this file\'s own #16 check (previously scoped to the older module set only) to the Expression module', () => {
  // Investigation-gate comments legitimately cite other files by name (e.g. expressionRenderer.js's
  // own WP4 investigation-gate note reviewing coachPresenter.js's/coachPromptComposer.js's
  // dependency-injection pattern before reusing its *shape*, never the module itself) — the same
  // "a documentation mention is fine; an actual require()/reference is not" discipline already
  // established by this file's own #30 above and by tests/safetyIntegrationPort.test.js. Line
  // comments are stripped before matching, mirroring tests/c1Wp5aWiring.test.js's own convention.
  EXPRESSION_MODULES.forEach((src) => {
    var code = src.split('\n').map(function (line) { return line.replace(/\/\/.*$/, ''); }).join('\n');
    assert.equal(code.indexOf('coachPresenter'), -1);
    assert.equal(code.indexOf('coachPromptComposer'), -1);
    assert.equal(code.indexOf('triggerController'), -1);
    assert.equal(code.indexOf('innerHTML'), -1);
  });
});
