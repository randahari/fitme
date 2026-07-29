// TASK-004 — Internal Pipeline Orchestrator tests (D3 §17 Decision 1 / §6.1).
// Run with: node --test tests/internalPipelineOrchestrator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

function configureHappyPath() {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

test('1. run() returns SUCCESS with an assembled pipelineContext and empty candidates (no live Opportunity source yet — see file header)', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.output.candidates, []);
  assert.equal(typeof result.output.pipelineContext, 'object');
  assert.equal(result.output.pipelineContext.userId, 'user-1');
});

test('2. run() never blocks/throws even with a bare/empty ctx', async () => {
  configureHappyPath();
  await assert.doesNotReject(() => Orchestrator.run({}));
  await assert.doesNotReject(() => Orchestrator.run(undefined));
});

test('3a. run() stays resilient (SUCCESS, degraded context) even under a total StateAccess/DerivedIntelligenceConsumer outage — Memory Layer\'s own per-category graceful degradation (D3 §12.3) absorbs it before it ever reaches the orchestrator', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('boom'); },
    getCurrentUser: () => { throw new Error('boom'); },
    isSessionCurrent: () => { throw new Error('simulated total State Access outage'); }
  });
  Consumer.configure({
    isSessionCurrent: () => { throw new Error('simulated outage'); },
    readHabitSnapshot: async () => { throw new Error('boom'); },
    readPatternSnapshot: async () => { throw new Error('boom'); },
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.output.candidates, []);
  assert.equal(result.output.pipelineContext.availability.feedbackHistory, 'UNAVAILABLE');
  assert.equal(result.output.pipelineContext.availability.derivedIntelligence, 'UNAVAILABLE');
});

test('3b. run() failure handling: if Memory Layer itself throws (e.g. a defect upstream of its own try/catch), the orchestrator normalizes it to FAILED rather than propagating', async () => {
  const original = MemoryLayer.assembleContext;
  MemoryLayer.assembleContext = async () => { throw new Error('simulated Memory Layer defect'); };
  try {
    const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
    assert.equal(result.status, 'FAILED');
    assert.equal(result.error.code, 'CONTEXT_ASSEMBLY_FAILED');
  } finally {
    MemoryLayer.assembleContext = original;
  }
});

test('4. runForOpportunity() invokes Stage 6 (Recommendation Engine) directly for a real EligibleOpportunity', async () => {
  configureHappyPath();
  const pipelineContext = { feedbackHistory: [] };
  const opportunity = {
    id: 'opp-1', sourceCategory: 'SAFETY_HIGH_RISK', proposedAction: 'act now', confidence: 0.9,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' }, detectedAt: Date.now()
  };
  const result = Orchestrator.runForOpportunity(pipelineContext, opportunity);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].category, 'IMMEDIATE_ACTION');
});

test('5. runForOpportunity() withholds when the opportunity cannot be explained (Explainability Policy)', () => {
  const pipelineContext = { feedbackHistory: [] };
  const opportunity = { id: 'opp-1', sourceCategory: 'SAFETY_HIGH_RISK', proposedAction: 'act now', confidence: 0.9 }; // no explanation
  const result = Orchestrator.runForOpportunity(pipelineContext, opportunity);
  assert.deepEqual(result.candidates, []);
});
