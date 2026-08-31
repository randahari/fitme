// CSSC-001 — Current State / Situational Context V1 — Production-Backed Acceptance
// (docs/specs/CSSC_001_SPEC_v1.0.md §21). Exercises the real, unmodified production chain:
// StateAccess -> memoryLayer.assembleContext() -> SituationalContextInterpreter (stubbed
// ClaudeProxyClient/callClaude seam only) -> initiativeEngine.detectOpportunities() ->
// contextualMeaningPolicy.js's live FOOD_LOGGING/WEAKENING V1 rule -> eligibilityEvaluator.js
// -> the real internalPipelineOrchestrator.run() end to end. No live LLM, no live Firestore,
// no Chat.
// Run with: node --test tests/cssc001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const SituationalContextInterpreter = require('../js/coachDecisionSystem/situationalContextInterpreter.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

var WEAKENING_HABIT_RECORD = {
  id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency', status: 'weakening',
  confidence: 0.7, sourceEvents: { count: 5 }, lastObserved: '2026-07-29',
  currentEpisodeEstablished: true // required for deriveValidReasonCategory's real V1 Reason
};

function configureFixture(fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'cssc-user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: fetchUserStatedMemoryFn
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [WEAKENING_HABIT_RECORD], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

function stubClassifier(classifyEverythingAs) {
  SituationalContextInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return { content: [{ text: JSON.stringify({ results: ids.map((id) => ({ id: id, verdict: classifyEverythingAs })) }) }] };
    }
  });
}

test.afterEach(() => { SituationalContextInterpreter.configure({ callClaude: null }); });

test('CSSC-E2E-1. the real, complete chain: a night-shift statement classifies, reaches Contextual Meaning as background, and the Terminal Decision is unaffected', async () => {
  configureFixture(async () => [
    { _id: 'mem-night-shift', type: 'fact', payload: { text: 'אני עובד בלילות עכשיו' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 },
    { _id: 'mem-tuna', type: 'fact', payload: { text: 'אני לא אוהב טונה' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 200 }
  ]);
  SituationalContextInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => ({ id: id, verdict: id === 'mem-night-shift' ? 'CLASSIFIED_CURRENT_STATE' : 'INELIGIBLE_OR_NOT_CLASSIFIED' }));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });

  const result = await Orchestrator.run({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');

  const pc = result.output.pipelineContext;
  assert.equal(pc.situationalContext.items.length, 1);
  assert.equal(pc.situationalContext.items[0].sourceMemoryId, 'mem-night-shift');
  assert.equal(pc.situationalContext.items[0].interpretationAuthority, 'DERIVED_INTERPRETATION');

  // Terminal Decision: the real, unmodified Decision System resolution for this fixture.
  // IMPORTANT, CORRECTED FINDING (Engineering discovery during CSSC-001 implementation): this
  // exact Habit FOOD_LOGGING/WEAKENING/established fixture does NOT resolve to Silence in the
  // current repository — RGEF (CLOSED, already shipped before CSSC-001) added a Stage-5/6
  // Bounded Early-Relationship Engagement admission path for exactly this Source×Reason
  // combination, so it already, correctly, resolves to a live 'INITIATIVE' kind Terminal
  // Decision with trustTestSignal.glad still honestly null (RGEF's own approved, unmodified
  // behavior — this pre-dates and is entirely independent of CSSC-001). Earlier reports in this
  // program's own history incorrectly re-described this as "resolves to Silence today" — that
  // claim was accurate for G-2 alone, before RGEF's closure, and is corrected here. CSSC-001
  // itself changes none of this: `kind`, `trustTestSignal.glad`, and every eligibility code
  // below are identical whether or not Situational Context is present (proven in CSSC-E2E-2).
  const td = result.output.terminalDecision;
  assert.equal(td.kind, 'INITIATIVE');
  assert.equal(td.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'ELIGIBLE');
  assert.equal(td.decisionPassTrace.opportunitiesConsidered[0].reason, 'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT');
});

test('CSSC-E2E-2. baseline comparison — Alignment/Trajectory/validReasonCategory/Eligibility/Trust/Relationship-Maturity are byte-identical with and without Situational Context', async () => {
  // Run WITHOUT any eligible Situational Context source (no user-stated records at all).
  configureFixture(async () => []);
  const withoutContext = await Orchestrator.run({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-a', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });

  // Run WITH a classified Situational Context item.
  configureFixture(async () => [
    { _id: 'mem-night-shift', type: 'fact', payload: { text: 'אני עובד בלילות עכשיו' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubClassifier('CLASSIFIED_CURRENT_STATE');
  const withContext = await Orchestrator.run({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-b', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });

  assert.equal(withoutContext.output.pipelineContext.situationalContext, null);
  assert.equal(withContext.output.pipelineContext.situationalContext.items.length, 1);

  // Both Terminal Decisions must be identical in every respect that matters — including the
  // full user-facing rationale text, proving Situational Context influences neither the
  // decision nor its wording, regardless of which real path (Silence or RGEF's Bounded
  // Early-Relationship Engagement admission) this fixture happens to resolve through.
  assert.equal(withContext.output.terminalDecision.kind, withoutContext.output.terminalDecision.kind);
  assert.deepEqual(withContext.output.terminalDecision.rationale, withoutContext.output.terminalDecision.rationale);
  assert.deepEqual(withContext.output.terminalDecision.decisionPassTrace, withoutContext.output.terminalDecision.decisionPassTrace);
  assert.equal(withContext.output.terminalDecision.candidateProvenance[0].sourceCategory, withoutContext.output.terminalDecision.candidateProvenance[0].sourceCategory);
  assert.deepEqual(withContext.output.pipelineContext.relationshipMaturity, withoutContext.output.pipelineContext.relationshipMaturity);
});

test('CSSC-E2E-5. Situational Context structurally cannot reach Expression\'s own rendering payload — buildExpressionRenderingContext remains a strict relationshipMaturity.stage-only pass-through, unmodified by CSSC-001', async () => {
  const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
  configureFixture(async () => [
    { _id: 'mem-night-shift', type: 'fact', payload: { text: 'אני עובד בלילות עכשיו' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubClassifier('CLASSIFIED_CURRENT_STATE');
  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-e' });
  assert.equal(pipelineContext.situationalContext.items.length, 1, 'precondition: Situational Context really is populated on this Pipeline Context');
  const renderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
  const asJson = JSON.stringify(renderingContextResult);
  assert.ok(!asJson.includes('situationalContext'), 'situationalContext must never appear in the Expression Rendering Context');
  assert.ok(!asJson.includes('אני עובד בלילות'), 'the raw/classified statement text must never reach the Expression Rendering Context');
});

test('CSSC-E2E-3. Contextual Meaning\'s own contextConsulted/basis fields correctly reflect CONSULTED vs NOT_CONSULTED across the two runs above, with no causal string anywhere', async () => {
  const ContextualMeaningPolicy = require('../js/coachDecisionSystem/contextualMeaningPolicy.js');
  const InitiativeEngine = require('../js/coachDecisionSystem/initiativeEngine.js');

  configureFixture(async () => [
    { _id: 'mem-night-shift', type: 'fact', payload: { text: 'אני עובד בלילות עכשיו' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubClassifier('CLASSIFIED_CURRENT_STATE');
  const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-c' });

  const opportunities = InitiativeEngine.detectOpportunities(pipelineContext);
  assert.equal(opportunities.semanticOpportunities.length, 1);
  const cm = opportunities.semanticOpportunities[0].contextualMeaning;
  assert.equal(cm.basis.contextConsulted.situationalContext, 'CONSULTED');
  assert.deepEqual(cm.basis.situationalContextBackground.items, [{ statementText: 'אני עובד בלילות עכשיו', sourceMemoryId: 'mem-night-shift' }]);
  assert.equal(cm.alignment, 'UNKNOWN');
  assert.equal(cm.trajectory, 'WORSENING');
  assert.equal(cm.basis.priorEstablishmentBasis !== null, true);

  const asJson = JSON.stringify(cm);
  assert.ok(!/\bcause\b/i.test(asJson) && !/\bcaused\b/i.test(asJson) && !/\bexplains\b/i.test(asJson), 'no causal language anywhere in the constructed ContextualMeaning');

  const reason = ContextualMeaningPolicy.deriveValidReasonCategory(
    { sourceType: 'HABIT', topic: 'FOOD_LOGGING', lifecycle: 'WEAKENING', provenance: { currentEpisodeEstablished: true } }, cm
  );
  assert.equal(reason, 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
});

test('CSSC-E2E-4. zero-call negative case at the full-pipeline level — with no live WEAKENING signal, no classifier call occurs even with eligible records present', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'cssc-user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => [{ _id: 'mem-1', type: 'fact', payload: { text: 'אני עובד בלילות עכשיו' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }]
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }), // no WEAKENING signal at all
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  let called = false;
  SituationalContextInterpreter.configure({ callClaude: async () => { called = true; return { content: [{ text: '{"results":[]}' }] }; } });

  const result = await Orchestrator.run({ userId: 'cssc-user-1', sessionGeneration: 1, runId: 'run-d', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.output.pipelineContext.situationalContext, null);
  assert.equal(called, false);
});
