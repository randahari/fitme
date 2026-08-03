// TASK-006 — Winner Selection tests (D2 Stage 8, TASK_006_SPEC_v1.0.md §20, §35.6) and Safety
// Integration tests at the Stage-8 checkpoint (§21, §35.7).
// Run with: node --test tests/winnerSelection.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const WinnerSelection = require('../js/coachDecisionSystem/winnerSelection.js');
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

// ── §20.1 exactly one winner by default ──

test('the ordinary case selects exactly one winner: the top-ranked, non-disqualified Candidate', async () => {
  const ranked = [candidate('top', { hierarchyTier: 2 }), candidate('second', { hierarchyTier: 5 })];
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'SINGLE_WINNER');
  assert.equal(result.winner.opportunityProvenance.opportunityId, 'top');
});

// ── §20.2/19.3 narrow tied-set exception ──

test('a genuinely tied top group is carried forward as the full permitted tied set, not an arbitrary subset', async () => {
  const ranked = [candidate('a'), candidate('b'), candidate('c', { hierarchyTier: 9 })];
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'TIED_SET');
  assert.equal(result.tiedSet.length, 2);
  assert.deepEqual(result.tiedSet.map((c) => c.opportunityProvenance.opportunityId).sort(), ['a', 'b']);
});

// ── §20.3/20.4 Safety disqualification before final selection, promotes next survivor ──

test('Safety disqualification removes a top-ranked Candidate and promotes the next-ranked survivor', async () => {
  const ranked = [candidate('top', { hierarchyTier: 1 }), candidate('second', { hierarchyTier: 5 })];
  const port = makeSafetyIntegrationPortTestDouble({ disqualifyRule: (c) => c.opportunityProvenance.opportunityId === 'top' });
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'SINGLE_WINNER');
  assert.equal(result.winner.opportunityProvenance.opportunityId, 'second');
});

test('the ranking itself is not recomputed by disqualification — only removal occurs (§20.4/20.8)', async () => {
  const ranked = [candidate('a', { hierarchyTier: 1 }), candidate('b', { hierarchyTier: 2 }), candidate('c', { hierarchyTier: 3 })];
  const port = makeSafetyIntegrationPortTestDouble({ disqualifyRule: (c) => c.opportunityProvenance.opportunityId === 'a' });
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.winner.opportunityProvenance.opportunityId, 'b');
});

// ── §20.5/23.5 all-Candidates-disqualified — no fabricated winner ──

test('all-Candidates-disqualified produces an explicit ALL_DISQUALIFIED result, never a fabricated winner', async () => {
  const ranked = [candidate('a'), candidate('b')];
  const port = makeSafetyIntegrationPortTestDouble({ disqualifyRule: () => true });
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'ALL_DISQUALIFIED');
  assert.equal(result.disqualifiedCandidates.length, 2);
});

// ── §20.6 provenance/rationale preserved unmutated ──

test('the winning Candidate object is returned unmutated (provenance/rationale preserved)', async () => {
  const c = candidate('a');
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: [c], pipelineContext: {}, safetyPort: port });
  assert.equal(result.winner, c);
});

// ── §20.7 deterministic repeated evaluation ──

test('identical ranked pool and identical Safety results produce the identical winner on repeated evaluation', async () => {
  const ranked = [candidate('a', { hierarchyTier: 2 }), candidate('b', { hierarchyTier: 5 })];
  const port = makeSafetyIntegrationPortTestDouble();
  const r1 = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  const r2 = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(r1.winner.opportunityProvenance.opportunityId, r2.winner.opportunityProvenance.opportunityId);
});

// ── §21.2 disqualify() invoked for every Candidate in the ranked pool ──

test("Stage 8's disqualification call is invoked for every Candidate in the ranked pool", async () => {
  const ranked = [candidate('a'), candidate('b'), candidate('c', { hierarchyTier: 9 })];
  const port = makeSafetyIntegrationPortTestDouble();
  await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(port.calls.disqualify, 1); // one batched call covering the whole pool, per the port contract (§21.8)
});

// ── §21.6/§21.7/§35.7 — no bypass, downgrade, or fabrication; unavailable Safety Layer aborts ──

test('Safety-Layer-unavailable (no port supplied) aborts rather than fabricating a winner', async () => {
  const ranked = [candidate('a')];
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {} });
  assert.equal(result.status, 'ABORT');
  assert.equal(result.reason, 'SAFETY_LAYER_UNAVAILABLE');
});

test('a structurally invalid disqualification response (wrong length) aborts rather than being silently coerced', async () => {
  const ranked = [candidate('a'), candidate('b')];
  const port = { disqualify: async () => [{ opportunityProvenance: {}, disqualified: false, reason: null }] }; // length mismatch
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'ABORT');
  assert.equal(result.reason, 'INVALID_SAFETY_DISQUALIFICATION_RESPONSE');
});

test('a thrown Safety disqualify() call aborts rather than propagating uncontrolled', async () => {
  const ranked = [candidate('a')];
  const port = { disqualify: async () => { throw new Error('boom'); } };
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'ABORT');
  assert.equal(result.reason, 'SAFETY_DISQUALIFY_THREW');
});

test('an empty ranked pool aborts rather than proceeding (Stage 8 Entry Criteria require a non-empty pool)', async () => {
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: [], pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'ABORT');
  assert.equal(result.reason, 'EMPTY_RANKED_POOL');
});
