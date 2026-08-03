// TASK-006 — Decision Formation tests (D2 Stage 9, §22, §35.8), Terminal Decision Contract tests
// (§25, §35.9), Silence Semantics tests (§23, §35.10), Refusal/Deferral/Modification tests
// (§24, §35.11). Run with: node --test tests/decisionFormation.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const DecisionFormation = require('../js/coachDecisionSystem/decisionFormation.js');
const Prioritization = require('../js/coachDecisionSystem/prioritization.js');
const { makeSafetyIntegrationPortTestDouble } = require('./fixtures/safetyIntegrationPortTestDouble.js');

const NS = Prioritization.NO_SIGNAL;

function candidate(id, overrides) {
  return Object.assign({
    kind: 'Recommendation',
    category: 'PREPARATION',
    action: 'do the thing',
    rationale: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    confidence: 0.7,
    hierarchyTier: 5,
    evidenceTier: NS, trustImpact: NS, timingQuality: NS, triggeringEvidenceTime: NS, problemMagnitude: NS,
    recommendationImpactTier: NS,
    opportunityProvenance: { opportunityId: id, sourceCategory: 'DECISION_WINDOW', detectedAt: null }
  }, overrides);
}

function initiativeCandidate(id, overrides) {
  const c = candidate(id, overrides);
  delete c.category; delete c.recommendationImpactTier;
  c.kind = 'INITIATIVE';
  return c;
}

function singleWinnerSelection(c) {
  return { status: 'SINGLE_WINNER', winner: c, disqualifiedCandidates: [] };
}

// ── §22.3/23.4 — Decision-Pass-level Silence from zero surviving Candidates ──

test('formDecisionPassSilence() produces a fully-formed SILENCE Terminal Decision, no safetyDisposition, empty candidateProvenance', () => {
  const r = DecisionFormation.formDecisionPassSilence({ opportunitiesConsidered: [{ opportunityId: 'o1', sourceCategory: 'DECISION_WINDOW', internalOutcome: 'INELIGIBLE' }] });
  assert.equal(r.status, 'FORMED');
  assert.equal(r.decision.kind, 'SILENCE');
  assert.equal('safetyDisposition' in r.decision, false);
  assert.deepEqual(r.decision.candidateProvenance, []);
  assert.equal(r.decision.decisionPassTrace.opportunitiesConsidered.length, 1);
  assert.equal(r.decision.immutable, true);
  assert.ok(Object.isFrozen(r.decision));
});

// ── §22.1 — assembly from one winning Candidate, UNMODIFIED ──

test('a single winning Recommendation-kind Candidate with UNMODIFIED Safety review forms kind: RECOMMENDATION', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble();
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'FORMED');
  assert.equal(r.decision.kind, 'RECOMMENDATION');
  assert.equal(r.decision.confidence, c.confidence);
  assert.equal(r.decision.hierarchyTier, c.hierarchyTier);
  assert.equal(r.decision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(r.decision.safetyDisposition.originalKind, 'RECOMMENDATION');
  assert.deepEqual(r.decision.candidateProvenance, [c.opportunityProvenance]);
  assert.equal('options' in r.decision, false);
  assert.equal('boundaryType' in r.decision, false);
});

test('a single winning Initiative-kind Candidate with UNMODIFIED Safety review forms kind: INITIATIVE', async () => {
  const c = initiativeCandidate('i1');
  const port = makeSafetyIntegrationPortTestDouble();
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.decision.kind, 'INITIATIVE');
});

test("Stage 9's final-review call is invoked exactly once per Decision Pass with a winning Candidate", async () => {
  const port = makeSafetyIntegrationPortTestDouble();
  await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(port.calls.finalReview, 1);
});

// ── §22.2/25.10 — assembly from the full permitted tied set ──

test('a tied set is assembled into exactly one Terminal Decision carrying multiple user-selectable options', async () => {
  const a = candidate('a'); const b = candidate('b');
  const port = makeSafetyIntegrationPortTestDouble();
  const selection = { status: 'TIED_SET', tiedSet: [a, b], disqualifiedCandidates: [] };
  const r = await DecisionFormation.form({ selection, pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 2 });
  assert.equal(r.status, 'FORMED');
  assert.equal(r.decision.options.length, 2);
  assert.deepEqual(r.decision.options[0], a);
  assert.deepEqual(r.decision.options[1], b);
  assert.equal(r.decision.candidateProvenance.length, 2);
});

// ── §21.5/22.4/24.1 Canonical Decision CD-T006-06 — the five-disposition mapping ──

test('MODIFIED keeps the original kind and attaches a modification record, never BOUNDARY/SILENCE', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'MODIFIED', modifiedContent: { action: 'a softened version' }, reason: 'toned down' }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.decision.kind, 'RECOMMENDATION');
  assert.deepEqual(r.decision.modification.modifiedContent, { action: 'a softened version' });
  assert.equal(r.decision.safetyDisposition.disposition, 'MODIFIED');
});

test('DEFERRED reforms the Terminal Decision to kind: SILENCE', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'DEFERRED', modifiedContent: null, reason: 'timing not right' }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.decision.kind, 'SILENCE');
  assert.equal(r.decision.safetyDisposition.disposition, 'DEFERRED');
  assert.equal('modification' in r.decision, false);
  assert.equal('boundaryType' in r.decision, false);
});

test('BLOCKED reforms the Terminal Decision to kind: BOUNDARY, boundaryType: REFUSAL', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'BLOCKED', modifiedContent: null, reason: 'conflicts with a safety principle' }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.decision.kind, 'BOUNDARY');
  assert.equal(r.decision.boundaryType, 'REFUSAL');
  assert.equal(r.decision.safetyDisposition.disposition, 'BLOCKED');
});

test('ESCALATED reforms the Terminal Decision to kind: BOUNDARY, boundaryType: ESCALATION', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'ESCALATED', modifiedContent: null, reason: 'professional referral threshold met' }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.decision.kind, 'BOUNDARY');
  assert.equal(r.decision.boundaryType, 'ESCALATION');
});

test('a BLOCKED disposition never disguises a different, unblocked Candidate as the winner (§24.5) — the original provenance is preserved as evidence', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'BLOCKED', modifiedContent: null, reason: 'blocked' }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.deepEqual(r.decision.candidateProvenance, [c.opportunityProvenance]);
  assert.equal(r.decision.rationale, c.rationale);
});

// ── §25.4 invariants ──

test('boundaryType is present if and only if kind === BOUNDARY', async () => {
  const port = makeSafetyIntegrationPortTestDouble();
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal('boundaryType' in r.decision, false);
});

test('confidence and hierarchyTier are absent for a SILENCE (DEFERRED) Terminal Decision', async () => {
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'DEFERRED', modifiedContent: null, reason: null }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal('confidence' in r.decision, false);
  assert.equal('hierarchyTier' in r.decision, false);
});

test('confidence and hierarchyTier are absent for a BOUNDARY (BLOCKED) Terminal Decision', async () => {
  const port = makeSafetyIntegrationPortTestDouble({ reviewRule: () => ({ disposition: 'BLOCKED', modifiedContent: null, reason: null }) });
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal('confidence' in r.decision, false);
  assert.equal('hierarchyTier' in r.decision, false);
});

// ── §20.5/23.5 — all-Candidates-disqualified: Silence (flagged engineering default, see decisionFormation.js header) ──

test('an ALL_DISQUALIFIED selection resolves to kind: SILENCE, candidateProvenance populated with the disqualified Candidates, no safetyDisposition (no finalReview() call)', async () => {
  const disq = [{ opportunityId: 'a', sourceCategory: 'DECISION_WINDOW' }];
  const r = await DecisionFormation.form({
    selection: { status: 'ALL_DISQUALIFIED', disqualifiedCandidates: disq },
    pipelineContext: {}, safetyPort: makeSafetyIntegrationPortTestDouble(),
    opportunitiesConsidered: [], candidatePoolSize: 1
  });
  assert.equal(r.status, 'FORMED');
  assert.equal(r.decision.kind, 'SILENCE');
  assert.deepEqual(r.decision.candidateProvenance, disq);
  assert.equal('safetyDisposition' in r.decision, false);
});

// ── §21.7/31 — invalid/unavailable Safety response aborts, never fabricates ──

test('Safety-Layer-unavailable at Stage 9 aborts rather than fabricating a Terminal Decision', async () => {
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'ABORTED');
  assert.equal(r.reason, 'SAFETY_LAYER_UNAVAILABLE');
});

test('an invalid Safety disposition value aborts rather than being coerced', async () => {
  const port = { finalReview: async () => ({ disposition: 'MAYBE', reason: null }) };
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'ABORTED');
  assert.equal(r.reason, 'INVALID_SAFETY_REVIEW_RESPONSE');
});

test('a MODIFIED disposition missing modifiedContent aborts rather than fabricating modified content', async () => {
  const port = { finalReview: async () => ({ disposition: 'MODIFIED', modifiedContent: null, reason: 'x' }) };
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'ABORTED');
});

test('a thrown finalReview() aborts rather than propagating uncontrolled', async () => {
  const port = { finalReview: async () => { throw new Error('boom'); } };
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'ABORTED');
  assert.equal(r.reason, 'SAFETY_FINAL_REVIEW_THREW');
});

test('winner selection ABORT status propagates as a Decision Formation ABORTED result, never a fabricated decision', async () => {
  const r = await DecisionFormation.form({ selection: { status: 'ABORT', reason: 'SAFETY_LAYER_UNAVAILABLE' }, pipelineContext: {}, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(r.status, 'ABORTED');
});

// ── §22.7/25.4 — never more than one Terminal Decision; immutability ──

test('the produced TerminalDecision object is frozen (immutable, §25.6/27.5)', async () => {
  const port = makeSafetyIntegrationPortTestDouble();
  const r = await DecisionFormation.form({ selection: singleWinnerSelection(candidate('a')), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.ok(Object.isFrozen(r.decision));
});

// ── §27.6 determinism ──

test('identical selection/input produces an identical Terminal Decision on repeated formation', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble();
  const r1 = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  const r2 = await DecisionFormation.form({ selection: singleWinnerSelection(c), pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.deepEqual(r1.decision, r2.decision);
});
