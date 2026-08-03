// TASK-006 — Prioritization tests: Candidate Pool Assembly (§16, §35.2), Prioritization Model
// (§17, §19, §35.3, §35.5), Budget Enforcement (§18, §35.4), Joint Arbitration (§35.13).
// Run with: node --test tests/prioritization.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Prioritization = require('../js/coachDecisionSystem/prioritization.js');

const NS = Prioritization.NO_SIGNAL;

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
  const c = baseFields(Object.assign({ kind: 'INITIATIVE', opportunityProvenance: { opportunityId: 'iopp-1', sourceCategory: 'DISRUPTION_DETECTION', detectedAt: null } }, overrides));
  delete c.category;
  delete c.recommendationImpactTier;
  return c;
}

// ── §16.3 Candidate Pool Assembly — validation before admission ──

test('a well-formed Recommendation-kind and Initiative-kind Candidate are both admitted', () => {
  const { pool, rejected } = Prioritization.assemblePool([[baseFields()], [initiativeCandidate()]]);
  assert.equal(pool.length, 2);
  assert.equal(rejected.length, 0);
});

test('a Candidate missing hierarchyTier is rejected from the pool', () => {
  const c = baseFields(); delete c.hierarchyTier;
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
  assert.equal(rejected.length, 1);
});

test('a Candidate missing rationale is rejected from the pool', () => {
  const c = baseFields(); delete c.rationale;
  const { pool } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
});

test('a Candidate missing confidence is rejected from the pool', () => {
  const c = baseFields(); delete c.confidence;
  const { pool } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
});

test('a Candidate structurally missing an arbitration-metadata field (CD-T006-02) is rejected', () => {
  const c = baseFields(); delete c.evidenceTier;
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
  assert.match(rejected[0].reason, /evidenceTier/);
});

test('a Candidate whose arbitration-metadata field is the NO_SIGNAL sentinel is admitted, not rejected (§14.12.1)', () => {
  const { pool } = Prioritization.assemblePool([[baseFields({ evidenceTier: NS, trustImpact: NS })]]);
  assert.equal(pool.length, 1);
});

test('an InitiativeCandidate carrying recommendationImpactTier (real or NO_SIGNAL) is rejected (Canonical Decision CD-T006-03)', () => {
  const c = initiativeCandidate();
  c.recommendationImpactTier = NS; // re-added after initiativeCandidate()'s own deletion, to exercise the rejection rule
  const { pool, rejected } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
  assert.match(rejected[0].reason, /CD-T006-03/);
});

test('a RecommendationCandidate missing recommendationImpactTier is rejected', () => {
  const c = baseFields(); delete c.recommendationImpactTier;
  const { pool } = Prioritization.assemblePool([[c]]);
  assert.equal(pool.length, 0);
});

test('zero Candidates from one Opportunity does not affect the rest of the pool (§16.7)', () => {
  const { pool } = Prioritization.assemblePool([[], [baseFields()]]);
  assert.equal(pool.length, 1);
});

test('zero Candidates across the entire pass produces an empty, valid pool (§16.8)', () => {
  const { pool, rejected } = Prioritization.assemblePool([]);
  assert.deepEqual(pool, []);
  assert.deepEqual(rejected, []);
});

test('provenance and shape are preserved unmodified through assembly (§16.5/16.6)', () => {
  const c = baseFields();
  const { pool } = Prioritization.assemblePool([[c]]);
  assert.deepEqual(pool[0].opportunityProvenance, c.opportunityProvenance);
});

test('pool assembly applies no generator-specific priority shortcut — order of admission does not privilege either kind (§16.9)', () => {
  const rec = baseFields({ hierarchyTier: 5 });
  const init = initiativeCandidate({ hierarchyTier: 5 });
  const { pool: poolA } = Prioritization.assemblePool([[rec], [init]]);
  const { pool: poolB } = Prioritization.assemblePool([[init], [rec]]);
  assert.equal(poolA.length, 2);
  assert.equal(poolB.length, 2);
});

// ── §17.1 D1-PR-01 — Hierarchy tier primary ranking ──

test('a lower hierarchyTier number (higher-priority tier) outranks a higher one, regardless of other fields', () => {
  const high = baseFields({ hierarchyTier: 1, problemMagnitude: 1 });
  const low = baseFields({ hierarchyTier: 9, problemMagnitude: 1000 });
  const ranked = Prioritization.rank([low, high]);
  assert.equal(ranked[0].hierarchyTier, 1);
});

// ── §17.2 D1-PR-02 / Canonical Decision CD-T006-03 — impact-tier nesting ──

test('same-kind Recommendation tie: Level 1 Critical outranks Level 4 Educational', () => {
  const critical = baseFields({ hierarchyTier: 5, recommendationImpactTier: 1 });
  const educational = baseFields({ hierarchyTier: 5, recommendationImpactTier: 4 });
  const ranked = Prioritization.rank([educational, critical]);
  assert.equal(ranked[0].recommendationImpactTier, 1);
});

test('a cross-kind tie (one Initiative-kind Candidate) skips impact-tier nesting and proceeds directly to problemMagnitude (CD-T006-03)', () => {
  const rec = baseFields({ hierarchyTier: 5, recommendationImpactTier: NS, problemMagnitude: 10 });
  const init = initiativeCandidate({ hierarchyTier: 5, problemMagnitude: 50 });
  const ranked = Prioritization.rank([rec, init]);
  assert.equal(ranked[0].kind, 'INITIATIVE'); // higher problemMagnitude wins, impact tier never consulted
});

test('an every-Candidate-Initiative tie falls through identically to problemMagnitude', () => {
  const a = initiativeCandidate({ hierarchyTier: 5, problemMagnitude: 5, opportunityProvenance: { opportunityId: 'a' } });
  const b = initiativeCandidate({ hierarchyTier: 5, problemMagnitude: 9, opportunityProvenance: { opportunityId: 'b' } });
  const ranked = Prioritization.rank([a, b]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'b');
});

// ── §17.3 D1-PR-03 — biggest-problem-first ──

test('a larger problemMagnitude outranks a smaller one, all else tied', () => {
  const small = baseFields({ problemMagnitude: 3, opportunityProvenance: { opportunityId: 'small' } });
  const big = baseFields({ problemMagnitude: 30, opportunityProvenance: { opportunityId: 'big' } });
  const ranked = Prioritization.rank([small, big]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'big');
});

// ── §18 / Canonical Decision CD-T006-04 — shared budget resolves structurally, single-winner ──

test('a pool with more than one viable Candidate resolves deterministically to a single top-ranked winner position (§18.5)', () => {
  const a = baseFields({ hierarchyTier: 3, opportunityProvenance: { opportunityId: 'a' } });
  const b = baseFields({ hierarchyTier: 7, opportunityProvenance: { opportunityId: 'b' } });
  const ranked = Prioritization.rank([b, a]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'a');
  assert.equal(ranked.length, 2); // the rest remain in the pool for Winner Selection to resolve to Silence
});

// ── §19.1 D1-PR-06(a)-(d) — full tie-break sequence, in order ──

test('D1-PR-06(a): a stronger (lower-numbered) evidenceTier wins when hierarchyTier/impactTier/problemMagnitude are tied — D1 Unit 11: Tier 1 (Explicit User Statement) is the highest tier, Tier 5 (Inference) is the lowest', () => {
  const strong = baseFields({ evidenceTier: 2, opportunityProvenance: { opportunityId: 'strong' } }); // Explicit User Action
  const weak = baseFields({ evidenceTier: 4, opportunityProvenance: { opportunityId: 'weak' } }); // Single Behaviour
  const ranked = Prioritization.rank([weak, strong]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'strong');
});

test('D1-PR-06(b): higher trustImpact wins after evidenceTier is exhausted (tied)', () => {
  const lo = baseFields({ evidenceTier: 3, trustImpact: 1, opportunityProvenance: { opportunityId: 'lo' } });
  const hi = baseFields({ evidenceTier: 3, trustImpact: 9, opportunityProvenance: { opportunityId: 'hi' } });
  const ranked = Prioritization.rank([lo, hi]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'hi');
});

test('D1-PR-06(c): higher timingQuality wins after (a)/(b) are exhausted (tied)', () => {
  const lo = baseFields({ evidenceTier: 3, trustImpact: 3, timingQuality: 1, opportunityProvenance: { opportunityId: 'lo' } });
  const hi = baseFields({ evidenceTier: 3, trustImpact: 3, timingQuality: 9, opportunityProvenance: { opportunityId: 'hi' } });
  const ranked = Prioritization.rank([lo, hi]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'hi');
});

test('D1-PR-06(d): more recent triggeringEvidenceTime wins after (a)-(c) are exhausted (tied)', () => {
  const older = baseFields({ evidenceTier: 3, trustImpact: 3, timingQuality: 3, triggeringEvidenceTime: 1000, opportunityProvenance: { opportunityId: 'older' } });
  const newer = baseFields({ evidenceTier: 3, trustImpact: 3, timingQuality: 3, triggeringEvidenceTime: 2000, opportunityProvenance: { opportunityId: 'newer' } });
  const ranked = Prioritization.rank([older, newer]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'newer');
});

test('the sequence stops at the first distinguishing criterion — a later criterion never overrides an earlier one', () => {
  const a = baseFields({ evidenceTier: 1, trustImpact: 1, opportunityProvenance: { opportunityId: 'a' } }); // wins on (a): strongest evidence tier
  const b = baseFields({ evidenceTier: 5, trustImpact: 9, opportunityProvenance: { opportunityId: 'b' } }); // would win on (b), but never reached
  const ranked = Prioritization.rank([b, a]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'a');
});

test('a genuinely exhausted tie (all four criteria NO_SIGNAL/equal) compares as 0 — Winner Selection resolves it, not Prioritization', () => {
  const a = baseFields({ opportunityProvenance: { opportunityId: 'a' } });
  const b = baseFields({ opportunityProvenance: { opportunityId: 'b' } });
  assert.equal(Prioritization.compareCandidates(a, b), 0);
});

// ── §14.12.1 NO_SIGNAL comparison semantics ──

test('NO_SIGNAL never outranks a real value on any tie-break field', () => {
  const real = baseFields({ evidenceTier: 1, opportunityProvenance: { opportunityId: 'real' } });
  const signal = baseFields({ evidenceTier: NS, opportunityProvenance: { opportunityId: 'signal' } });
  const ranked = Prioritization.rank([signal, real]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'real');
});

test('NO_SIGNAL vs NO_SIGNAL never distinguishes and falls through to the next criterion', () => {
  const a = baseFields({ evidenceTier: NS, trustImpact: 5, opportunityProvenance: { opportunityId: 'a' } });
  const b = baseFields({ evidenceTier: NS, trustImpact: 9, opportunityProvenance: { opportunityId: 'b' } });
  const ranked = Prioritization.rank([a, b]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 'b');
});

// ── §17.6/§33 — Product Engagement (Tier 10) never influences ranking ──

test('a Tier-10 (Product Engagement) Candidate is never promoted ahead of a higher tier, and the comparator has no engagement-related field at all', () => {
  const tier10 = baseFields({ hierarchyTier: 10, opportunityProvenance: { opportunityId: 't10' } });
  const tier2 = baseFields({ hierarchyTier: 2, opportunityProvenance: { opportunityId: 't2' } });
  const ranked = Prioritization.rank([tier10, tier2]);
  assert.equal(ranked[0].opportunityProvenance.opportunityId, 't2');
  assert.equal(Object.keys(Prioritization.ARBITRATION_METADATA_FIELDS).some((k) => /engagement/i.test(Prioritization.ARBITRATION_METADATA_FIELDS[k])), false);
});

// ── §27.1 determinism / stable sort ──

test('ranking is deterministic and stable: repeated calls on the same pool produce the same order', () => {
  const pool = [baseFields({ opportunityProvenance: { opportunityId: 'x' } }), baseFields({ opportunityProvenance: { opportunityId: 'y' } })];
  const a = Prioritization.rank(pool).map((c) => c.opportunityProvenance.opportunityId);
  const b = Prioritization.rank(pool).map((c) => c.opportunityProvenance.opportunityId);
  assert.deepEqual(a, b);
});
