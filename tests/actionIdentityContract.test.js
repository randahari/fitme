// MAI-001 — Minimum Action Identity V1: Candidate-contract / Stage 7 / Stage 8 / Stage 9-boundary
// integration tests (docs/specs/MAI_001_SPEC_v1.0.md §11-§14). Exercises the real, unmodified
// js/coachDecisionSystem/prioritization.js, winnerSelection.js, and decisionFormation.js modules
// directly against synthetic Candidate fixtures, reusing the exact synthetic-Candidate-fixture
// convention already established in tests/prioritization.test.js/tests/winnerSelection.test.js —
// no live Candidate producer, no LLM call, no StateAccess dependency. Deliberately does NOT modify
// tests/prioritization.test.js, tests/winnerSelection.test.js, or tests/decisionFormation.test.js
// (the last of which carries unrelated pre-existing working-tree changes) — this is its own,
// dedicated, additive contract test file.
// Run with: node --test tests/actionIdentityContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Prioritization = require('../js/coachDecisionSystem/prioritization.js');
const WinnerSelection = require('../js/coachDecisionSystem/winnerSelection.js');
const DecisionFormation = require('../js/coachDecisionSystem/decisionFormation.js');
const Vocabulary = require('../js/domain/activityIdentityVocabulary.js');
const { makeSafetyIntegrationPortTestDouble } = require('./fixtures/safetyIntegrationPortTestDouble.js');

const NS = Prioritization.NO_SIGNAL;

// Mirrors tests/prioritization.test.js's/tests/winnerSelection.test.js's own local
// baseFields()/candidate() helper convention exactly — a fully synthetic Candidate, no live
// producer involved.
function baseFields(overrides) {
  return Object.assign({
    kind: 'Recommendation',
    category: 'PREPARATION',
    action: 'do the thing',
    rationale: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    confidence: 0.7,
    hierarchyTier: 5,
    evidenceTier: NS,
    trustImpact: NS,
    timingQuality: NS,
    triggeringEvidenceTime: NS,
    problemMagnitude: NS,
    recommendationImpactTier: NS,
    opportunityProvenance: { opportunityId: 'opp-1', sourceCategory: 'DECISION_WINDOW', detectedAt: null }
  }, overrides);
}

function initiativeCandidate(overrides) {
  const c = baseFields(Object.assign({
    kind: 'INITIATIVE',
    opportunityProvenance: { opportunityId: 'iopp-1', sourceCategory: 'DISRUPTION_DETECTION', detectedAt: null }
  }, overrides));
  delete c.category;
  delete c.recommendationImpactTier;
  return c;
}

// ── §4/§6 — vocabulary re-exposed here only for fixture construction; MAI-001 §6/§7's own module
//    is exhaustively covered by tests/activityIdentityVocabulary.test.js, not repeated here. ────

test('0. sanity: the fixture activity token used throughout this file is a real, valid V1 token', () => {
  assert.equal(Vocabulary.isValidActivity('RUNNING'), true);
});

// ── §11 — Stage 7 passthrough: validateCandidateForPool()/assemblePool() unmodified ────────────

test('1. a Candidate with a valid actionIdentity is admitted to the Stage 7 pool unchanged', () => {
  const c = baseFields({ actionIdentity: { activity: 'RUNNING' } });
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(rejected.length, 0);
  assert.equal(pool.length, 1);
  assert.deepEqual(pool[0].actionIdentity, { activity: 'RUNNING' });
});

test('2. actionIdentity survives Stage 7 ranking (compareCandidates) intact and by reference', () => {
  const withIdentity = baseFields({ hierarchyTier: 2, actionIdentity: { activity: 'SWIMMING' } });
  const without = baseFields({ hierarchyTier: 5, opportunityProvenance: { opportunityId: 'opp-2', sourceCategory: 'DECISION_WINDOW', detectedAt: null } });
  const { pool } = Prioritization.assemblePool([[withIdentity, without]]);
  const ranked = Prioritization.rank(pool);
  const top = ranked[0];
  assert.equal(top.opportunityProvenance.opportunityId, 'opp-1');
  assert.deepEqual(top.actionIdentity, { activity: 'SWIMMING' });
});

// ── §12 — Stage 8 accessibility: winnerSelection.select() passes the pool through unchanged ────

test('3. a Candidate\'s actionIdentity reaches the pool Stage 8\'s disqualify() receives, fully intact', async () => {
  const ranked = [baseFields({ actionIdentity: { activity: 'RUNNING' } })];
  let receivedPool = null;
  const port = {
    disqualify: async (pool) => { receivedPool = pool; return pool.map(() => null); },
    finalReview: async (decision) => ({ status: 'UNMODIFIED', terminalDecision: decision })
  };
  await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.ok(receivedPool, 'disqualify() must have been called with the pool');
  assert.equal(receivedPool.length, 1);
  assert.deepEqual(receivedPool[0].actionIdentity, { activity: 'RUNNING' });
});

test('4. the winning Candidate returned by Stage 8 still carries actionIdentity unmutated', async () => {
  const ranked = [baseFields({ actionIdentity: { activity: 'CYCLING' } })];
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'SINGLE_WINNER');
  assert.deepEqual(result.winner.actionIdentity, { activity: 'CYCLING' });
});

// ── §5/§18 — backward compatibility: absent actionIdentity remains fully valid throughout ──────

test('5. a Candidate with NO actionIdentity is admitted to Stage 7 exactly as before (backward compatibility)', () => {
  const c = baseFields();
  assert.equal('actionIdentity' in c, false);
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(rejected.length, 0);
  assert.equal(pool.length, 1);
  assert.equal('actionIdentity' in pool[0], false);
});

test('6. a Candidate with NO actionIdentity survives Stage 8 selection exactly as before (backward compatibility)', async () => {
  const ranked = [baseFields()];
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await WinnerSelection.select({ rankedPool: ranked, pipelineContext: {}, safetyPort: port });
  assert.equal(result.status, 'SINGLE_WINNER');
  assert.equal('actionIdentity' in result.winner, false);
});

// ── both Candidate kinds can carry the field ────────────────────────────────────────────────

test('7. a Recommendation-kind Candidate can carry a valid actionIdentity and is admitted', () => {
  const c = baseFields({ kind: 'Recommendation', actionIdentity: { activity: 'STRENGTH_TRAINING' } });
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(rejected.length, 0);
  assert.equal(pool.length, 1);
});

test('8. an Initiative-kind Candidate can carry a valid actionIdentity and is admitted', () => {
  const c = initiativeCandidate({ actionIdentity: { activity: 'PADEL' } });
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(rejected.length, 0);
  assert.equal(pool.length, 1);
  assert.deepEqual(pool[0].actionIdentity, { activity: 'PADEL' });
});

// ── §13 — Stage 9 boundary: documented exactly as it actually behaves, unmodified by MAI-001 ───
//
// Discovered during implementation (reported in the Implementation Report, not silently
// corrected): decisionFormation.js's SINGLE_WINNER path reconstructs a clean summary Terminal
// Decision that never carries actionIdentity (matching MAI-001 §13's own framing exactly). Its
// pre-existing, unmodified TIED_SET path, however, populates `options[]` with the full, verbatim
// tied Candidate members (TASK-006's own already-built, production-unreachable mechanism) — which
// DOES include actionIdentity when a tied member carries one. This is pre-existing TASK-006
// behavior that MAI-001 neither introduces nor is instructed to change ("do not redesign
// decisionFormation.js"); both tests below document the real boundary precisely, in both
// directions, rather than asserting a uniform "never propagates" claim the code does not actually
// keep for the tied-set path.

test('9. actionIdentity does not appear on the SINGLE_WINNER Terminal Decision\'s own summary fields (deliberately not propagated, MAI-001 §13/AD-SF-05)', async () => {
  const winner = baseFields({ actionIdentity: { activity: 'RUNNING' } });
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await DecisionFormation.form({
    selection: { status: 'SINGLE_WINNER', winner: winner },
    pipelineContext: {},
    safetyPort: port,
    opportunitiesConsidered: ['opp-1'],
    candidatePoolSize: 1
  });
  assert.equal(result.status, 'FORMED');
  assert.deepEqual(Object.keys(result.decision).sort(), ['candidateProvenance', 'confidence', 'decisionPassTrace', 'hierarchyTier', 'immutable', 'kind', 'rationale', 'safetyDisposition'].sort());
  assert.equal('actionIdentity' in result.decision, false);
  assert.equal(JSON.stringify(result.decision).indexOf('actionIdentity'), -1, 'no field of the SINGLE_WINNER summary Terminal Decision carries actionIdentity');
});

test('10. for a TIED_SET, actionIdentity DOES survive inside options[] — pre-existing TASK-006 machinery, unmodified and untouched by MAI-001', async () => {
  const a = baseFields({ actionIdentity: { activity: 'WALKING' }, opportunityProvenance: { opportunityId: 'opp-a', sourceCategory: 'DECISION_WINDOW', detectedAt: null } });
  const b = baseFields({ actionIdentity: { activity: 'CYCLING' }, opportunityProvenance: { opportunityId: 'opp-b', sourceCategory: 'DECISION_WINDOW', detectedAt: null } });
  const port = makeSafetyIntegrationPortTestDouble();
  const result = await DecisionFormation.form({
    selection: { status: 'TIED_SET', tiedSet: [a, b] },
    pipelineContext: {},
    safetyPort: port,
    opportunitiesConsidered: ['opp-a', 'opp-b'],
    candidatePoolSize: 2
  });
  assert.equal(result.status, 'FORMED');
  assert.ok(Array.isArray(result.decision.options), 'the pre-existing TIED_SET options[] mechanism must be present, unmodified');
  assert.deepEqual(result.decision.options.map((o) => o.actionIdentity), [{ activity: 'WALKING' }, { activity: 'CYCLING' }],
    'options[] carries the full, verbatim tied Candidate members — this is pre-existing TASK-006 behavior MAI-001 does not modify, hide, or newly introduce');
});
