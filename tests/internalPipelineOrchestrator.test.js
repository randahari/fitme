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

// ── TASK-005 — Initiative Engine Stage-6 dispatch, Stage-3 detection dispatch ──

test('6. runForInitiativeOpportunity() invokes Stage 6 (Initiative Engine) directly for a real EligibleOpportunity', async () => {
  configureHappyPath();
  const pipelineContext = { feedbackHistory: [], relationshipMaturity: { stage: 'ASSISTANT' } };
  const opportunity = {
    id: 'iopp-1', sourceCategory: 'DISRUPTION_DETECTION', proposedAction: 'prepare ahead', confidence: 0.8,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    valueDimensions: ['CONSISTENCY'], detectedAt: Date.now()
  };
  const result = Orchestrator.runForInitiativeOpportunity(pipelineContext, opportunity);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].kind, 'INITIATIVE');
});

test('7. runForInitiativeOpportunity() withholds when Relationship-Maturity gating is not satisfied', () => {
  const pipelineContext = { feedbackHistory: [], relationshipMaturity: { stage: 'OBSERVER' } };
  const opportunity = {
    id: 'iopp-2', sourceCategory: 'DISRUPTION_DETECTION', proposedAction: 'prepare ahead', confidence: 0.8,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    valueDimensions: ['CONSISTENCY'], detectedAt: Date.now()
  };
  const result = Orchestrator.runForInitiativeOpportunity(pipelineContext, opportunity);
  assert.deepEqual(result.candidates, []);
});

test('8. detectInitiativeOpportunities() exposes the Stage-3 detection contribution (confirmed-pattern anticipation, disruption, milestone/recovery)', () => {
  const pipelineContext = { initiativeIntelligence: { signals: [] } };
  const result = Orchestrator.detectInitiativeOpportunities(pipelineContext);
  assert.deepEqual(Object.keys(result).sort(), ['confirmedPatternAnticipation', 'disruption', 'milestoneRecovery']);
});

test('9. run()\'s overall contract is preserved unchanged by the TASK-005 extension (still candidates: [] at this baseline)', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.output.candidates, []);
});

// ── TASK-006 — runDecisionPass(): Stage 5-9 end-to-end dispatch (Composite Engine Integration
// tests §35.12, Recommendation/Initiative Joint Arbitration tests §35.13, Failure and Graceful-
// Degradation tests §35.16, Determinism and Idempotency tests §35.17) ──

const { makeSafetyIntegrationPortTestDouble } = require('./fixtures/safetyIntegrationPortTestDouble.js');

function eligibilityInput(overrides) {
  return Object.assign({
    id: 'opp-1',
    sourceCategory: 'DECISION_WINDOW',
    validReasonCategory: 'PREVENT_PREDICTABLE_MISTAKE',
    trustTestSignal: { glad: true, basis: 'historically responsive' },
    lowCoachingValuePeriodActive: false,
    safetyHighRiskBypass: false
  }, overrides);
}

function eligibleOpportunity(overrides) {
  return Object.assign({
    id: 'opp-1',
    sourceCategory: 'DECISION_WINDOW',
    proposedAction: 'act now',
    confidence: 0.8,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    detectedAt: 1700000000000
  }, overrides);
}

test('10. runDecisionPass() with zero Opportunities forms a Decision-Pass-level Silence Terminal Decision (D2-EF-02 boundary: still Decision-Engine-owned here since the caller supplies the empty list explicitly)', async () => {
  const result = await Orchestrator.runDecisionPass({ pipelineContext: {}, opportunities: [], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.status, 'FORMED');
  assert.equal(result.decision.kind, 'SILENCE');
});

test('11. runDecisionPass() with a single ineligible Opportunity resolves to Decision-Pass-level Silence, with the ineligibility recorded in trace (§23.2/23.4)', async () => {
  const result = await Orchestrator.runDecisionPass({
    pipelineContext: { feedbackHistory: [] },
    opportunities: [{ eligibilityInput: eligibilityInput({ trustTestSignal: { glad: false, basis: 'declined before' } }), eligibleOpportunity: eligibleOpportunity() }],
    safetyPort: makeSafetyIntegrationPortTestDouble()
  });
  assert.equal(result.decision.kind, 'SILENCE');
  assert.equal(result.decision.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'INELIGIBLE');
});

test('12. runDecisionPass() with a single eligible DECISION_WINDOW Opportunity dispatches to the Recommendation Engine and forms a RECOMMENDATION Terminal Decision', async () => {
  const result = await Orchestrator.runDecisionPass({
    pipelineContext: { feedbackHistory: [] },
    opportunities: [{ eligibilityInput: eligibilityInput(), eligibleOpportunity: eligibleOpportunity() }],
    safetyPort: makeSafetyIntegrationPortTestDouble()
  });
  assert.equal(result.status, 'FORMED');
  assert.equal(result.decision.kind, 'RECOMMENDATION');
  assert.equal(result.decision.decisionPassTrace.candidatePoolSize, 1);
});

test('13. runDecisionPass() jointly arbitrates Recommendation-kind and Initiative-kind Candidates from distinct Opportunities in the same pass, on equal footing (§16.2/16.9/§35.13). Stage 6 dispatch offers both producer engines every eligible Opportunity — each engine\'s own already-approved policy gates independently decide whether it contributes; a DISRUPTION_DETECTION Opportunity is accepted by both engines\' existing (unchanged) gates, so it contributes two Candidates', async () => {
  const oppA = { eligibilityInput: eligibilityInput({ id: 'opp-a', sourceCategory: 'DECISION_WINDOW' }), eligibleOpportunity: eligibleOpportunity({ id: 'opp-a', sourceCategory: 'DECISION_WINDOW' }) };
  const oppB = {
    eligibilityInput: eligibilityInput({ id: 'opp-b', sourceCategory: 'DISRUPTION_DETECTION' }),
    eligibleOpportunity: eligibleOpportunity({ id: 'opp-b', sourceCategory: 'DISRUPTION_DETECTION', valueDimensions: ['CONSISTENCY'] })
  };
  const pipelineContext = { feedbackHistory: [], relationshipMaturity: { stage: 'ASSISTANT' } };
  const result = await Orchestrator.runDecisionPass({ pipelineContext, opportunities: [oppA, oppB], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.status, 'FORMED');
  // oppA (DECISION_WINDOW): Recommendation Engine only (Initiative Engine excludes this source).
  // oppB (DISRUPTION_DETECTION): both engines' existing, unchanged gates accept it -> 2 Candidates.
  assert.equal(result.decision.decisionPassTrace.candidatePoolSize, 3);
  assert.ok(['RECOMMENDATION', 'INITIATIVE'].includes(result.decision.kind));
});

test('14. runDecisionPass() honors safetyHighRiskBypass by skipping Stage 5 entirely for that Opportunity (§15.5/§21.1)', async () => {
  const opp = {
    eligibilityInput: eligibilityInput({ safetyHighRiskBypass: true, trustTestSignal: { glad: false, basis: 'irrelevant under bypass' } }),
    eligibleOpportunity: eligibleOpportunity({ sourceCategory: 'SAFETY_HIGH_RISK' })
  };
  const result = await Orchestrator.runDecisionPass({ pipelineContext: { feedbackHistory: [] }, opportunities: [opp], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.decision.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'SAFETY_BYPASS');
  assert.equal(result.decision.decisionPassTrace.candidatePoolSize, 1);
});

test('15. runDecisionPass() aborts rather than fabricating a decision when the Safety Layer is unavailable (§21.7, Graceful Degradation)', async () => {
  const result = await Orchestrator.runDecisionPass({
    pipelineContext: { feedbackHistory: [] },
    opportunities: [{ eligibilityInput: eligibilityInput(), eligibleOpportunity: eligibleOpportunity() }]
    // no safetyPort supplied
  });
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'SAFETY_LAYER_UNAVAILABLE');
});

test('16. runDecisionPass() is deterministic: identical input produces an identical Terminal Decision on repeated invocation', async () => {
  const params = {
    pipelineContext: { feedbackHistory: [] },
    opportunities: [{ eligibilityInput: eligibilityInput(), eligibleOpportunity: eligibleOpportunity() }],
    safetyPort: makeSafetyIntegrationPortTestDouble()
  };
  const r1 = await Orchestrator.runDecisionPass(params);
  const r2 = await Orchestrator.runDecisionPass(params);
  assert.deepEqual(r1.decision, r2.decision);
});

test('17. runDecisionPass() is not reached from run() — run() still returns candidates: [] unconditionally at this repository baseline (no live Stage 3/4 source, Repository Gap G-2)', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.deepEqual(result.output.candidates, []);
  assert.equal('decision' in result.output, false);
});
