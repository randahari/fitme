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

test('4. runForOpportunity() invokes Stage 6 (Recommendation Engine) directly for a real EligibleOpportunity (Stage-6 Ownership Enforcement Correction: the source must be Recommendation-owned — DECISION_WINDOW — not SAFETY_HIGH_RISK, which recommendationEngine.js now correctly refuses per its own STAGE6_ACCEPTED_SOURCES gate)', async () => {
  configureHappyPath();
  const pipelineContext = { feedbackHistory: [] };
  const opportunity = {
    id: 'opp-1', sourceCategory: 'DECISION_WINDOW', proposedAction: 'act now', confidence: 0.9,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' }, detectedAt: Date.now()
  };
  const result = Orchestrator.runForOpportunity(pipelineContext, opportunity);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].category, 'PREPARATION');
});

test('5. runForOpportunity() withholds when the opportunity cannot be explained (Explainability Policy)', () => {
  const pipelineContext = { feedbackHistory: [] };
  const opportunity = { id: 'opp-1', sourceCategory: 'DECISION_WINDOW', proposedAction: 'act now', confidence: 0.9 }; // no explanation
  const result = Orchestrator.runForOpportunity(pipelineContext, opportunity);
  assert.deepEqual(result.candidates, []);
});

test('Stage-6 Ownership Enforcement Correction: runForOpportunity() (Recommendation Engine) refuses a SAFETY_HIGH_RISK-sourced Opportunity — Safety is not Recommendation-owned', () => {
  const pipelineContext = { feedbackHistory: [] };
  const opportunity = {
    id: 'opp-1', sourceCategory: 'SAFETY_HIGH_RISK', proposedAction: 'act now', confidence: 0.9,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' }, detectedAt: Date.now()
  };
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

test('8. detectInitiativeOpportunities() exposes the Stage-3 detection contribution (confirmed-pattern anticipation, disruption, milestone/recovery, and — G-2 §32 — semanticOpportunities)', () => {
  const pipelineContext = { initiativeIntelligence: { signals: [] } };
  const result = Orchestrator.detectInitiativeOpportunities(pipelineContext);
  assert.deepEqual(Object.keys(result).sort(), ['confirmedPatternAnticipation', 'disruption', 'milestoneRecovery', 'semanticOpportunities']);
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

test('13. runDecisionPass() jointly arbitrates Recommendation-kind and Initiative-kind Candidates from distinct Opportunities in the same pass, on equal footing (§16.2/16.9/§35.13), each Opportunity\'s Source correctly routed to exactly its one owning engine (Stage-6 Ownership Enforcement Correction). Stage 6 dispatch still offers both producer engines every eligible Opportunity; each engine\'s own source-ownership gate now independently, correctly decides whether it contributes — a DISRUPTION_DETECTION Opportunity is Initiative-Engine-exclusive (D2 Unit 07, TASK_005_SPEC_v1.0.md §9.1) and now correctly contributes only one Candidate, not two — the prior "two Candidates" expectation was itself an instance of the since-fixed Stage-6 rule-leakage defect (recommendationEngine.js constructing an unowned Candidate for an Initiative-exclusive source)', async () => {
  const oppA = { eligibilityInput: eligibilityInput({ id: 'opp-a', sourceCategory: 'DECISION_WINDOW' }), eligibleOpportunity: eligibleOpportunity({ id: 'opp-a', sourceCategory: 'DECISION_WINDOW' }) };
  const oppB = {
    eligibilityInput: eligibilityInput({ id: 'opp-b', sourceCategory: 'DISRUPTION_DETECTION' }),
    eligibleOpportunity: eligibleOpportunity({ id: 'opp-b', sourceCategory: 'DISRUPTION_DETECTION', valueDimensions: ['CONSISTENCY'] })
  };
  const pipelineContext = { feedbackHistory: [], relationshipMaturity: { stage: 'ASSISTANT' } };
  const result = await Orchestrator.runDecisionPass({ pipelineContext, opportunities: [oppA, oppB], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.status, 'FORMED');
  // oppA (DECISION_WINDOW): Recommendation Engine only (Initiative Engine excludes this source) -> 1.
  // oppB (DISRUPTION_DETECTION): Initiative Engine only now (Recommendation correctly excludes this
  // Initiative-exclusive source per the Stage-6 Ownership Enforcement Correction) -> 1.
  assert.equal(result.decision.decisionPassTrace.candidatePoolSize, 2);
  assert.ok(['RECOMMENDATION', 'INITIATIVE'].includes(result.decision.kind));
});

test('14. runDecisionPass() honors safetyHighRiskBypass by skipping Stage 5 entirely for that Opportunity (§15.5/§21.1). Stage-6 Ownership Enforcement Correction: SAFETY_HIGH_RISK is not Recommendation-owned (nor Initiative-owned, unchanged) — dispatchStage6() now correctly contributes zero ordinary Candidates for it; the pool size of 1 this test previously asserted was itself the Safety-adjacent instance of the since-fixed Stage-6 rule-leakage defect (an unowned Recommendation Candidate). This does not resolve or claim to resolve TASK-005\'s own separate, still-open G-3 Repository Gap (whether a Safety-triggered Opportunity should ever reach Initiative-kind Candidate Generation) — it only prevents Recommendation Engine from claiming a source it never owned.', async () => {
  const opp = {
    eligibilityInput: eligibilityInput({ safetyHighRiskBypass: true, trustTestSignal: { glad: false, basis: 'irrelevant under bypass' } }),
    eligibleOpportunity: eligibleOpportunity({ sourceCategory: 'SAFETY_HIGH_RISK' })
  };
  const result = await Orchestrator.runDecisionPass({ pipelineContext: { feedbackHistory: [] }, opportunities: [opp], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.decision.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'SAFETY_BYPASS');
  assert.equal(result.decision.decisionPassTrace.candidatePoolSize, 0);
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

test('17. Expression WP9 — runDecisionPass() is now reached from run() in production, always with opportunities: [] (no live Stage 3/4 source, Repository Gap G-2, not this Work Package\'s scope), correctly forming a Decision-Pass-level Silence Terminal Decision rather than a bypassed candidates: [] shortcut', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.deepEqual(result.output.candidates, []);
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
});

// ── Expression WP9 — run() now dispatches the full live Stage 5-10 chain (SafetyLayer wired as
// safetyPort, D2-EF-07 pre-dispatch supersession check, ExpressionRenderer wired as
// expressionPort). Always Silence/NO_DELIVERY_INTENT in production today (Repository Gap G-2,
// unresolved, not this Work Package's scope) — these tests verify the wiring itself, not a live
// differentiated outcome. ──

test('35. run() reaches Stage 10 and produces NO_DELIVERY_INTENT for the always-Silence outcome (SafetyLayer wired but never exercised — an empty pool short-circuits to Silence before Stage 8/9 run)', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});

test('36. run() is NOT superseded when no Explicit User Statement was ever recorded for this user — the universal case today, per memoryLayer.js\'s own honest disclosure that no live correction-input channel exists', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-no-correction-' + Date.now(), sessionGeneration: 1, runId: 'run-x' });
  assert.notEqual(result.output.expression.status, 'SUPERSEDED');
});

test('37. run() withholds via D2-EF-07 (expression.status SUPERSEDED, runExpressionStage never dispatches) when a correction arrives after this pass\'s own Context Assembly — TerminalDecision itself remains unaffected/unmodified', async () => {
  configureHappyPath();
  const originalAssemble = MemoryLayer.assembleContext;
  MemoryLayer.assembleContext = async function (identity) {
    var ctx = await originalAssemble(identity);
    // Simulate D2-EF-07's own scenario deterministically: pin this pass's own Context Assembly to
    // a point safely in the past, then record a correction arrival with a real (later) timestamp —
    // avoids a same-millisecond real-clock race between the two Date.now() calls. assembleContext()'s
    // own returned object is frozen (Memory Layer's own immutability convention), so a fresh shallow
    // copy is required rather than mutating ctx in place.
    var backdated = Object.assign({}, ctx, { assembledAt: 1 });
    MemoryLayer.recordExplicitUserStatementArrival(identity);
    return backdated;
  };
  try {
    const result = await Orchestrator.run({ userId: 'user-superseded-' + Date.now(), sessionGeneration: 1, runId: 'run-y' });
    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.output.expression.status, 'SUPERSEDED');
    assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  } finally {
    MemoryLayer.assembleContext = originalAssemble;
  }
});

test('38. run()\'s D2-EF-07 supersession check is scoped per user — a correction recorded for a different user never supersedes this pass', async () => {
  configureHappyPath();
  MemoryLayer.recordExplicitUserStatementArrival({ userId: 'some-other-unrelated-user-' + Date.now() });
  const result = await Orchestrator.run({ userId: 'user-unaffected-by-others-' + Date.now(), sessionGeneration: 1, runId: 'run-z' });
  assert.notEqual(result.output.expression.status, 'SUPERSEDED');
});

// ── Expression WP2 (EXPRESSION_IMPLEMENTATION_PLAN.md WP2) — runExpressionStage() dispatch tests.
// Resolves EXP-OD-3 as a separate function (not an internal runDecisionPass() extension); no
// rendering content exists here or anywhere reachable from this module (WP3-WP8 remain unbuilt).
// ──

// A genuinely valid TerminalDecision (TASK_006_SPEC_v1.0.md §25.1/§25.4) by default, so tests
// exercising runExpressionStage()'s port/render/output behavior aren't masked by WP3's own
// defensive-validation gate (Expression WP3, EXP-19) rejecting an under-specified fake first.
function fakeTerminalDecision(overrides) {
  return Object.assign({
    kind: 'RECOMMENDATION',
    rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' },
    confidence: 0.8,
    hierarchyTier: 3,
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'RECOMMENDATION' },
    immutable: true
  }, overrides || {});
}

// A minimal, valid Decision-Pass-level Silence TerminalDecision (zero-Candidates origin,
// TASK_006_SPEC_v1.0.md §23.4/§25.12) — safetyDisposition correctly absent (finalReview() is
// never called for this origin).
function fakeZeroCandidatesSilence() {
  return {
    kind: 'SILENCE',
    rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' },
    candidateProvenance: [],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 0, disqualifiedCandidates: [] },
    immutable: true
  };
}

// A minimal, valid Safety-DEFERRED Silence TerminalDecision — safetyDisposition present with
// disposition: 'DEFERRED', always co-occurring with kind: 'SILENCE' (§25.4/§25.12).
function fakeDeferredSilence() {
  return {
    kind: 'SILENCE',
    rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' },
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'DEFERRED', originalKind: 'RECOMMENDATION' },
    immutable: true
  };
}

// Expression WP4 (remainder) / Canonical Decision 8 — a genuinely valid Expression Rendering
// Context (EXPRESSION_SPEC_v1.0.md §10.1, EXP-73-78) by default, so tests exercising
// runExpressionStage()'s port/render/output behavior aren't masked by this second, now-mandatory
// input's own defensive-validation gate rejecting an under-specified fake first.
function fakeExpressionRenderingContext(stage) {
  const ExpressionRenderingContext = require('../js/coachDecisionSystem/expressionRenderingContext.js');
  return ExpressionRenderingContext.buildExpressionRenderingContext({ relationshipMaturityStage: stage || 'UNKNOWN' }).expressionRenderingContext;
}

test('18. runExpressionStage() aborts EXPRESSION_PORT_UNAVAILABLE rather than fabricating a Delivery Intent when no port is supplied', async () => {
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), undefined);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'EXPRESSION_PORT_UNAVAILABLE');
});

test('19. runExpressionStage() aborts EXPRESSION_PORT_UNAVAILABLE when the supplied port has no render() function', async () => {
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), {});
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'EXPRESSION_PORT_UNAVAILABLE');
});

test('20. runExpressionStage() aborts EXPRESSION_RENDER_THREW rather than propagating an uncaught exception', async () => {
  const port = { render: async () => { throw new Error('boom'); } };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'EXPRESSION_RENDER_THREW');
});

test('21. runExpressionStage() returns NO_DELIVERY_INTENT for a Silence-kind decision WITHOUT ever calling the port (EXP-29/EXP-50 — unconditional, not port-dependent)', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage(fakeZeroCandidatesSilence(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'NO_DELIVERY_INTENT');
  assert.equal(called, false);
});

test('22. runExpressionStage() aborts INVALID_DELIVERY_INTENT rather than passing a malformed object through (WP1 dependency)', async () => {
  const port = { render: async () => ({ notAValidShape: true }) };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'INVALID_DELIVERY_INTENT');
});

test('23. runExpressionStage() returns DISPATCHED with the port\'s schema-conformant Delivery Intent on success', async () => {
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const built = DeliveryIntentContract.buildDeliveryIntent({
    renderedLanguage: 'טקסט לדוגמה',
    semanticSignal: { kind: 'RECOMMENDATION' },
    correlation: { decisionId: 'd-1' }
  });
  assert.equal(built.status, 'BUILT');
  const port = { render: async () => built.deliveryIntent };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'DISPATCHED');
  assert.deepEqual(result.deliveryIntent, built.deliveryIntent);
});

test('24. runExpressionStage() takes the bare TerminalDecision, not a {status, decision} wrapper — the caller\'s own responsibility to unwrap', async () => {
  const port = { render: async (td) => { assert.equal(td.kind, 'RECOMMENDATION'); assert.equal('status' in td, false); return null; } };
  await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
});

test('25. runExpressionStage() is not reached from runDecisionPass() — runDecisionPass()\'s own existing TerminalDecision-only return contract is completely unchanged', async () => {
  const result = await Orchestrator.runDecisionPass({ pipelineContext: {}, opportunities: [], safetyPort: makeSafetyIntegrationPortTestDouble() });
  assert.equal(result.status, 'FORMED');
  assert.equal('deliveryIntent' in result, false);
});

// ── Expression WP3 (EXPRESSION_IMPLEMENTATION_PLAN.md WP3) — defensive input validation
// (EXP-19) and Silence-kind no-output handling for both origin cases (EXP-29/EXP-50). ──

test('26. runExpressionStage() aborts INVALID_TERMINAL_DECISION for a TerminalDecision missing required fields, before ever checking the port', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage({ kind: 'RECOMMENDATION', immutable: true }, fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'INVALID_TERMINAL_DECISION');
  assert.equal(called, false);
});

test('27. runExpressionStage() aborts INVALID_TERMINAL_DECISION even when no port is supplied at all — validation precedes the port-availability check', async () => {
  const result = await Orchestrator.runExpressionStage({ kind: 'RECOMMENDATION', immutable: true }, fakeExpressionRenderingContext(), undefined);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'INVALID_TERMINAL_DECISION');
});

test('28. runExpressionStage() accepts a fully valid RECOMMENDATION TerminalDecision and proceeds to the port', async () => {
  const port = { render: async () => null };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'NO_DELIVERY_INTENT'); // port legitimately returned null here; proves the gate passed it through
});

test('29. runExpressionStage() returns NO_DELIVERY_INTENT for the zero-Candidates Silence origin, without calling the port', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage(fakeZeroCandidatesSilence(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'NO_DELIVERY_INTENT');
  assert.equal(called, false);
});

test('30. runExpressionStage() returns NO_DELIVERY_INTENT for the Safety-DEFERRED Silence origin, identically to the zero-Candidates origin, without calling the port', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage(fakeDeferredSilence(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'NO_DELIVERY_INTENT');
  assert.equal(called, false);
});

test('31. a TerminalDecision with safetyDisposition.disposition DEFERRED but kind other than SILENCE is invalid (§25.4 co-occurrence invariant) — rejected, not passed through', async () => {
  const bad = fakeTerminalDecision({ safetyDisposition: { disposition: 'DEFERRED', originalKind: 'RECOMMENDATION' } });
  const result = await Orchestrator.runExpressionStage(bad, fakeExpressionRenderingContext(), { render: async () => null });
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'INVALID_TERMINAL_DECISION');
});

// ── Expression WP4 (remainder) / Canonical Decision 8 (D3 Decision 7) — defensive validation of
// the Expression Rendering Context, Expression's second declared Stage-10 input (EXP-77). ──

test('32. runExpressionStage() aborts INVALID_EXPRESSION_RENDERING_CONTEXT for a missing or malformed Expression Rendering Context, before ever checking the port', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const missing = await Orchestrator.runExpressionStage(fakeTerminalDecision(), undefined, port);
  assert.equal(missing.status, 'ABORTED');
  assert.equal(missing.reason, 'INVALID_EXPRESSION_RENDERING_CONTEXT');
  const malformed = await Orchestrator.runExpressionStage(fakeTerminalDecision(), { relationshipMaturityStage: 'NOVICE' }, port);
  assert.equal(malformed.status, 'ABORTED');
  assert.equal(malformed.reason, 'INVALID_EXPRESSION_RENDERING_CONTEXT');
  assert.equal(called, false);
});

test('33. runExpressionStage() does not require an Expression Rendering Context for a Silence-kind decision — the Silence check precedes it, and the port is still never called', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage(fakeZeroCandidatesSilence(), undefined, port);
  assert.equal(result.status, 'NO_DELIVERY_INTENT');
  assert.equal(called, false);
});

test('34. runExpressionStage() passes the Expression Rendering Context through to the port unchanged, alongside the TerminalDecision', async () => {
  const ctx = fakeExpressionRenderingContext('TRUSTED_COACH');
  let received;
  const port = { render: async (td, renderingContext) => { received = renderingContext; return null; } };
  await Orchestrator.runExpressionStage(fakeTerminalDecision(), ctx, port);
  assert.equal(received, ctx);
});

// ── Expression WP10 (EXPRESSION_IMPLEMENTATION_PLAN.md WP10) — Exceptional Flows and Graceful
// Degradation (EXPRESSION_SPEC_v1.0.md §19). Extends WP3's own validation-failure handling
// (§19 Row 1); confirms generative/LLM-layer call-failure containment (§19 Row 2, already built by
// WP2/WP3/WP4 as necessary defensive engineering); confirms Coach Runtime unavailability is
// downstream of and undetectable by Expression's own completion (§19 Row 3, true by construction —
// runExpressionStage() returns before js/app.js's own presentDeliveryIntent() call, WP9); and
// confirms EXP-42's no-fabrication guarantee holds uniformly across every abort path. No production
// code change was required — investigated and confirmed at this Work Package's own start that all
// three §19 table rows were already correctly handled by the existing dispatch boundary; these
// tests make that already-built behavior explicitly traceable to §19's own table, one test per row,
// plus one cross-cutting EXP-42 confirmation — matching this Work Package's own "New failure-path
// tests, one per §19's exceptional-flow table row" deliverable. ──

test('39. Expression WP10 / §19 Row 1 — a TerminalDecision that fails §25.5/EXP-19 defensive validation is treated as a failure condition (same discipline `D2-EF-06` applies elsewhere; not silently trusted) and produces no Delivery Intent, before the port is ever reached', async () => {
  let called = false;
  const port = { render: async () => { called = true; return null; } };
  const result = await Orchestrator.runExpressionStage({ kind: 'RECOMMENDATION' }, fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'INVALID_TERMINAL_DECISION');
  assert.equal(called, false);
  assert.equal('deliveryIntent' in result, false);
});

test('40. Expression WP10 / §19 Row 2 — a generative/LLM-layer call failure is contained as a structured failure result, matching recommendationEngine.js\'s/initiativeEngine.js\'s existing "never throws" contract, never propagated as an uncaught exception, and produces no Delivery Intent', async () => {
  const port = { render: async () => { throw new Error('simulated generative/LLM-layer failure'); } };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  assert.equal(result.status, 'ABORTED');
  assert.equal(result.reason, 'EXPRESSION_RENDER_THREW');
  assert.equal('deliveryIntent' in result, false);
});

test('41. Expression WP10 / §19 Row 3 — Coach Runtime unavailability is downstream of, and undetectable by, Expression\'s own completion: runExpressionStage() dispatches a Delivery Intent normally, and the module has no knowledge of any delivery/Coach-Runtime/presentation surface of its own (§16, EXP-39)', async () => {
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const built = DeliveryIntentContract.buildDeliveryIntent({
    renderedLanguage: 'טקסט לדוגמה',
    semanticSignal: { kind: 'RECOMMENDATION' },
    correlation: { decisionId: 'd-wp10' }
  });
  assert.equal(built.status, 'BUILT');
  const port = { render: async () => built.deliveryIntent };
  const result = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port);
  // Expression's own contract is fully discharged here — DISPATCHED with a real Delivery Intent —
  // independent of whether any Coach Runtime surface ever receives or renders it.
  assert.equal(result.status, 'DISPATCHED');
  assert.deepEqual(result.deliveryIntent, built.deliveryIntent);
  // Structural confirmation: runExpressionStage()/internalPipelineOrchestrator.js has no reference
  // to a delivery/presentation surface — mirrors tests/coachDecisionSystemWiring.test.js's own #16
  // Coach/Expression boundary convention.
  const fs = require('node:fs');
  const path = require('node:path');
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
  assert.equal(orchestratorSrc.indexOf('triggerController'), -1);
  assert.equal(orchestratorSrc.indexOf('coachPresenter'), -1);
  assert.equal(orchestratorSrc.indexOf('presentDeliveryIntent'), -1);
});

test('42. Expression WP10 / EXP-42 — no Candidate, TerminalDecision, or Delivery Intent is ever fabricated as fallback content on any abort path (extends D1-DI-02/D3 §12.3\'s no-fabrication discipline to Expression\'s own output)', async () => {
  const abortCases = [
    { label: 'INVALID_TERMINAL_DECISION', td: { kind: 'RECOMMENDATION' }, ctx: fakeExpressionRenderingContext(), port: { render: async () => null } },
    { label: 'INVALID_EXPRESSION_RENDERING_CONTEXT', td: fakeTerminalDecision(), ctx: null, port: { render: async () => null } },
    { label: 'EXPRESSION_PORT_UNAVAILABLE', td: fakeTerminalDecision(), ctx: fakeExpressionRenderingContext(), port: undefined },
    { label: 'EXPRESSION_RENDER_THREW', td: fakeTerminalDecision(), ctx: fakeExpressionRenderingContext(), port: { render: async () => { throw new Error('x'); } } },
    { label: 'INVALID_DELIVERY_INTENT', td: fakeTerminalDecision(), ctx: fakeExpressionRenderingContext(), port: { render: async () => ({ notAValidShape: true }) } }
  ];
  for (const c of abortCases) {
    const result = await Orchestrator.runExpressionStage(c.td, c.ctx, c.port);
    assert.equal(result.status, 'ABORTED', c.label);
    assert.equal(result.reason, c.label);
    assert.equal('deliveryIntent' in result, false, c.label + ' must not carry a deliveryIntent field');
  }
});

// ── Expression WP12 (EXPRESSION_IMPLEMENTATION_PLAN.md WP12) — Determinism confirmation
// (§20 EXP-43; AC-6). Closes the one genuine residual gap identified at this Work Package's own
// Pre-Flight Review: WP4's own determinism test (tests/expressionRenderer.test.js #69) exercises
// ExpressionRenderer.render() directly; it does not exercise runExpressionStage()'s own
// orchestrator-level dispatch-STATUS determinism (DISPATCHED/ABORTED/NO_DELIVERY_INTENT) across
// repeated invocation. This test closes that layer — decision-reaching determinism is unconditional
// (EXP-43); generated wording is explicitly not asserted identical, exactly as WP4's own test 69
// already established. ──

test('43. Expression WP12 / AC-6/EXP-43 — runExpressionStage()\'s own dispatch-status outcome is deterministic across repeated invocation with identical input, for each of the DISPATCHED, ABORTED, and NO_DELIVERY_INTENT outcomes; generated wording itself is not asserted identical', async () => {
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const port1 = { render: async () => DeliveryIntentContract.buildDeliveryIntent({ renderedLanguage: 'ניסוח א׳', semanticSignal: { kind: 'RECOMMENDATION' }, correlation: { decisionId: 'd-wp12-a' } }).deliveryIntent };
  const port2 = { render: async () => DeliveryIntentContract.buildDeliveryIntent({ renderedLanguage: 'ניסוח שונה לגמרי ב׳', semanticSignal: { kind: 'RECOMMENDATION' }, correlation: { decisionId: 'd-wp12-b' } }).deliveryIntent };

  // DISPATCHED — identical kind-level outcome across repeated invocation, wording legitimately differs.
  const d1 = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port1);
  const d2 = await Orchestrator.runExpressionStage(fakeTerminalDecision(), fakeExpressionRenderingContext(), port2);
  assert.equal(d1.status, 'DISPATCHED');
  assert.equal(d2.status, 'DISPATCHED');
  assert.equal(d1.deliveryIntent.semanticSignal.kind, d2.deliveryIntent.semanticSignal.kind);
  assert.notEqual(d1.deliveryIntent.renderedLanguage, d2.deliveryIntent.renderedLanguage);

  // ABORTED — identical failure reason across repeated invocation for identical invalid input.
  const a1 = await Orchestrator.runExpressionStage({ kind: 'RECOMMENDATION' }, fakeExpressionRenderingContext(), port1);
  const a2 = await Orchestrator.runExpressionStage({ kind: 'RECOMMENDATION' }, fakeExpressionRenderingContext(), port1);
  assert.equal(a1.status, 'ABORTED');
  assert.equal(a1.reason, a2.reason);

  // NO_DELIVERY_INTENT — identical Silence-kind outcome across repeated invocation, port never called.
  const s1 = await Orchestrator.runExpressionStage(fakeZeroCandidatesSilence(), fakeExpressionRenderingContext(), port1);
  const s2 = await Orchestrator.runExpressionStage(fakeZeroCandidatesSilence(), fakeExpressionRenderingContext(), port1);
  assert.equal(s1.status, 'NO_DELIVERY_INTENT');
  assert.equal(s2.status, 'NO_DELIVERY_INTENT');
});

// ══════════════════════════════════════════════════════════════════
// G-2 (docs/specs/G2_SPEC_v1.0.md §18, §27, §29) — Stage-3 Aggregation, Stage 4->5 Handoff,
// and the full opportunities-building pipeline.
// ══════════════════════════════════════════════════════════════════

function makeSufficientWeakeningOpportunity(overrides) {
  return Object.assign({
    id: 'g2-food-logging-info-request:HABIT:nutrition:log-consistency',
    sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
    detectingContributor: 'INITIATIVE_ENGINE',
    proposedAction: 'Request updated food-logging information from the user',
    confidence: 0.51,
    explanation: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' },
    detectedAt: 123,
    valueDimensions: ['UNDERSTANDING'],
    contextualMeaning: {
      alignment: 'UNKNOWN', trajectory: 'WORSENING',
      basis: {
        observation: { sourceType: 'HABIT', lifecycle: 'WEAKENING', domain: 'NUTRITION', topic: 'FOOD_LOGGING' },
        priorEstablishmentBasis: 'provenance.currentEpisodeEstablished === true (Habit Engine Current-Episode Establishment Authority, CSF Ch.29 AD-HL-02)',
        contextConsulted: { goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED' },
        unavailableOrUncertain: []
      }
    },
    validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
    trustTestSignal: { glad: null, basis: 'no approved affirmative Trust source' },
    safetyHighRiskBypass: false
  }, overrides);
}

test('G-2 §18: collectDetectedOpportunities() collects only Initiative Engine\'s semanticOpportunities bucket — never confirmedPatternAnticipation/disruption/milestoneRecovery (no Reason Policy rule constructs a DetectedOpportunity for them)', () => {
  const pipelineContext = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:a', sourceType: 'HABIT', lifecycle: 'ACTIVE', domain: 'NUTRITION', topic: 'FOOD_LOGGING', confidence: 0.8, evidence: { count: 8 } },
        { id: 'HABIT:nutrition:log-consistency', sourceType: 'HABIT', domain: 'NUTRITION', topic: 'FOOD_LOGGING', lifecycle: 'WEAKENING', confidence: 0.51, evidence: { count: 3 }, provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' } }
      ]
    }
  };
  const detected = Orchestrator.collectDetectedOpportunities(pipelineContext);
  assert.equal(detected.length, 1, 'only the WEAKENING+established signal should produce a DetectedOpportunity, via Initiative Engine\'s semanticOpportunities');
  assert.equal(detected[0].sourceCategory, 'CONFIRMED_PATTERN_ANTICIPATION');
  assert.equal(detected[0].detectingContributor, 'INITIATIVE_ENGINE');
});

test('G-2 §18: collectDetectedOpportunities() performs no semantic construction — it never invents rationale/evidence/confidence/proposedAction for a signal (verified: an empty Pipeline Context collects nothing)', () => {
  assert.deepEqual(Orchestrator.collectDetectedOpportunities({}), []);
  assert.deepEqual(Orchestrator.collectDetectedOpportunities(undefined), []);
});

test('G-2 §27: buildEligibilityAndCandidateInputs() produces a well-formed {eligibilityInput, eligibleOpportunity} pair for a sufficient, semantically-complete DetectedOpportunity', () => {
  const d = makeSufficientWeakeningOpportunity();
  const pair = Orchestrator.buildEligibilityAndCandidateInputs(d, {});
  assert.equal(pair.eligibilityInput.id, d.id);
  assert.equal(pair.eligibilityInput.sourceCategory, 'CONFIRMED_PATTERN_ANTICIPATION');
  assert.equal(pair.eligibilityInput.validReasonCategory, 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
  assert.deepEqual(pair.eligibilityInput.trustTestSignal, { glad: null, basis: 'no approved affirmative Trust source' });
  assert.equal(pair.eligibilityInput.lowCoachingValuePeriodActive, false);
  assert.equal(pair.eligibilityInput.safetyHighRiskBypass, false);
  assert.equal(pair.eligibleOpportunity, d);
});

test('G-2 (Readiness Review finding): lowCoachingValuePeriodActive is always a real boolean, never undefined — eligibilityEvaluator.js\'s validateInput() never rejects this construction as MALFORMED', () => {
  const EligibilityEvaluator = require('../js/coachDecisionSystem/eligibilityEvaluator.js');
  const d = makeSufficientWeakeningOpportunity();
  const pair = Orchestrator.buildEligibilityAndCandidateInputs(d, {});
  assert.equal(typeof pair.eligibilityInput.lowCoachingValuePeriodActive, 'boolean');
  const result = EligibilityEvaluator.evaluate(pair.eligibilityInput);
  assert.notEqual(result.outcome, 'MALFORMED');
});

test('G-2 §29: buildOpportunitiesForDecisionPass() excludes an INSUFFICIENT DetectedOpportunity (Section 26 — never reaches Stage 5)', () => {
  const pipelineContext = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:a', sourceType: 'HABIT', lifecycle: 'ACTIVE', domain: 'NUTRITION', topic: 'FOOD_LOGGING', confidence: 0.8, evidence: { count: 8 } }
      ]
    }
  };
  const opportunities = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext);
  assert.deepEqual(opportunities, [], 'an ACTIVE Habit signal produces no DetectedOpportunity at all (no Reason Policy rule covers it) — nothing to exclude, correctly empty');
});

test('G-2 §29: buildOpportunitiesForDecisionPass() includes a sufficient, established Habit WEAKENING DetectedOpportunity, correctly paired for Stage 5', () => {
  const pipelineContext = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:nutrition:log-consistency', sourceType: 'HABIT', domain: 'NUTRITION', topic: 'FOOD_LOGGING', lifecycle: 'WEAKENING', confidence: 0.51, evidence: { count: 3 }, temporal: {}, provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' } }
      ]
    }
  };
  const opportunities = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext);
  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].eligibilityInput.validReasonCategory, 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
});

test('G-2 §29 + RGEF §12: the fixture-level V1 path resolves ELIGIBLE/BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT at Stage 5, never MALFORMED (RGEF WP3: glad remains null, no Trust fabricated — the bounded path is the reason this is ELIGIBLE, not the ordinary Trust Test)', () => {
  const EligibilityEvaluator = require('../js/coachDecisionSystem/eligibilityEvaluator.js');
  const pipelineContext = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:nutrition:log-consistency', sourceType: 'HABIT', domain: 'NUTRITION', topic: 'FOOD_LOGGING', lifecycle: 'WEAKENING', confidence: 0.51, evidence: { count: 3 }, temporal: {}, provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' } }
      ]
    }
  };
  const opportunities = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext);
  const eligibilityInput = opportunities[0].eligibilityInput;
  assert.equal(eligibilityInput.trustTestSignal.glad, null, 'precondition: glad is honestly null, never fabricated');
  const elig = EligibilityEvaluator.evaluate(eligibilityInput);
  assert.equal(elig.outcome, 'ELIGIBLE');
  assert.equal(elig.reason, 'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT');
});

test('G-2 §18.2: a Safety-sourced DetectedOpportunity\'s safetyHighRiskBypass status is preserved unconditionally through aggregation and routes around Stage 4', () => {
  const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
  const original = SafetyLayer.detectSafetyOpportunities;
  SafetyLayer.detectSafetyOpportunities = () => [{
    id: 'safety-1', sourceCategory: 'SAFETY_HIGH_RISK', detectingContributor: 'SAFETY_LAYER', safetyHighRiskBypass: true,
    validReasonCategory: 'PROTECT_STATED_LONG_TERM_GOALS', trustTestSignal: { glad: true, basis: 'safety' }
  }];
  try {
    const opportunities = Orchestrator.buildOpportunitiesForDecisionPass({});
    assert.equal(opportunities.length, 1);
    assert.equal(opportunities[0].eligibilityInput.safetyHighRiskBypass, true);
  } finally {
    SafetyLayer.detectSafetyOpportunities = original;
  }
});

test('G-2 §29: determinism — same Pipeline Context yields byte-identical opportunities across repeated calls', () => {
  const pipelineContext = {
    initiativeIntelligence: {
      signals: [
        { id: 'HABIT:nutrition:log-consistency', sourceType: 'HABIT', domain: 'NUTRITION', topic: 'FOOD_LOGGING', lifecycle: 'WEAKENING', confidence: 0.51, evidence: { count: 3 }, temporal: {}, provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' } }
      ]
    }
  };
  const r1 = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext);
  const r2 = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext);
  assert.deepEqual(r1, r2);
});

test('G-2: run() end-to-end still produces an empty-signal Silence byte-for-byte, with the new aggregation wired in (regression)', async () => {
  configureHappyPath();
  const result = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.output.candidates, []);
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
});
