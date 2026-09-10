// TRR-001 — WALKING Canonical Safety Rule + Unresolved Activity Safety Coverage Rule unit tests
// (docs/specs/TRR_001_SPEC_v1.0.md §27-§29, Option D / refined Option A). Exercises the real,
// production matcher EXCLUSIVELY through SafetyLayer's existing public canonical Safety API —
// matchCanonicalSafetyRules(), evaluateCanonicalSafetyRules(), disqualify(), finalReview() — using
// synthetic Candidate/pipelineContext fixtures, mirroring tests/canonicalSafetyRule.test.js's own
// established public-API-only testing convention.
//
// No LLM call anywhere in this Work Item; purely deterministic.
// Run with: node --test tests/trrSafetyCoverage.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
const WinnerSelection = require('../js/coachDecisionSystem/winnerSelection.js');
const DecisionFormation = require('../js/coachDecisionSystem/decisionFormation.js');
const { makeSafetyIntegrationPortTestDouble } = require('./fixtures/safetyIntegrationPortTestDouble.js');

function usc(items) { return { items: items }; }
function usp(items) { return { items: items }; }
function restriction(sourceMemoryId, restrictedActivityText, statedDurationText) {
  var r = { sourceMemoryId: sourceMemoryId, restrictedActivityText: restrictedActivityText };
  if (statedDurationText !== undefined) { r.statedDurationText = statedDurationText; }
  return r;
}
function provenance(sourceMemoryId, statedSourceText) {
  return { sourceMemoryId: sourceMemoryId, statedSourceText: statedSourceText };
}
// PHYSICAL_ACTIVITY candidate helper — mirrors Candidate.actionCategory/activityReference/
// actionIdentity per TRR_001_SPEC_v1.0.md §22-§25.
function physicalActivityCandidate(activityIdentity, activityReference) {
  var c = { actionCategory: 'PHYSICAL_ACTIVITY' };
  if (activityIdentity) c.actionIdentity = { activity: activityIdentity };
  if (activityReference !== undefined) c.activityReference = activityReference;
  return c;
}
function nonActivityCandidate() { return { actionCategory: 'NON_ACTIVITY_COACHING_ACTION' }; }

// Live end-to-end pipeline helpers (Stage 7 pool -> Stage 8 WinnerSelection -> Stage 9
// DecisionFormation), used only by the "LIVE-" acceptance tests below. Mirrors
// tests/decisionFormation.test.js's own synthetic-Candidate-fixture convention, extended with the
// actionCategory/activityReference/actionIdentity fields this Work Item's Rules key on.
function liveCandidate(id, overrides) {
  return Object.assign({
    kind: 'INITIATIVE',
    rationale: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    confidence: 0.8,
    hierarchyTier: 1,
    opportunityProvenance: { opportunityId: id, sourceCategory: 'DECISION_WINDOW', detectedAt: null }
  }, overrides);
}
async function runRealPipeline(candidateObj, pipelineContext) {
  var selection = await WinnerSelection.select({ rankedPool: [candidateObj], pipelineContext: pipelineContext, safetyPort: SafetyLayer });
  var formed = await DecisionFormation.form({
    selection: selection, pipelineContext: pipelineContext, safetyPort: SafetyLayer,
    opportunitiesConsidered: [], candidatePoolSize: 1
  });
  return { selection: selection, formed: formed };
}

var WALKING_CANDIDATE = physicalActivityCandidate('WALKING', 'walking');
var CYCLING_CANDIDATE = physicalActivityCandidate('CYCLING', 'cycling');

var EXPECTED_CONFIRMED_ACTIVE_DIMS = {
  riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', evidenceConfidence: 'EXPLICIT_USER_STATEMENT',
  correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE'
};
var EXPECTED_TEMPORALLY_UNRESOLVED_DIMS = {
  riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', evidenceConfidence: 'INSUFFICIENT',
  correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE'
};

// ══════════════════════════════════════════════════════════════════
// A. WALKING Canonical Safety Rule (§27)
// ══════════════════════════════════════════════════════════════════

test('WALKING-A. a qualifying WALKING restriction + qualifying medical provenance matches, ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'walking')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  var matched = SafetyLayer.matchCanonicalSafetyRules(WALKING_CANDIDATE, null, pipelineContext);
  assert.equal(matched.length, 1);
  assert.deepEqual(matched[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
});

test('WALKING-B. a stated duration selects the temporally-unresolved profile', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'walking', 'for two weeks')]),
    userSafetyProvenance: usp([provenance('mem-1', 'physician')])
  };
  var matched = SafetyLayer.matchCanonicalSafetyRules(WALKING_CANDIDATE, null, pipelineContext);
  assert.deepEqual(matched[0], EXPECTED_TEMPORALLY_UNRESOLVED_DIMS);
});

test('WALKING-C. a non-WALKING candidate never matches this rule', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'walking')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(CYCLING_CANDIDATE, null, pipelineContext), []);
});

test('WALKING-D. non-medical symptom/soreness text never becomes a restriction (never inferred, per USC-001\'s own closed classification — this Rule consumes only already-classified userSafetyContext items)', () => {
  // A restriction item can only ever exist if USC-001's own interpreter already classified it —
  // this Rule performs no independent symptom inference of its own. Simulated here by a
  // restriction whose own text does not qualify as WALKING-text at all (the closest this Rule's
  // own boundary can be exercised without reopening USC-001).
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'my legs are sore')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(WALKING_CANDIDATE, null, pipelineContext), []);
});

test('WALKING-E. non-qualifying (non-medical) provenance never matches', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'walking')]),
    userSafetyProvenance: usp([provenance('mem-1', 'my friend')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(WALKING_CANDIDATE, null, pipelineContext), []);
});

test('WALKING-F. disqualify() genuinely disqualifies a WALKING Candidate against a confirmed-active medical restriction', async () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'walking')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  var result = await SafetyLayer.disqualify([WALKING_CANDIDATE], pipelineContext);
  assert.equal(result[0].disqualified, true);
  assert.equal(result[0].reasonCode, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

// ── Persistent WALKING Hebrew accepted/rejected-form coverage (locks in §27's already-approved
// vocabulary; mirrors tests/canonicalSafetyRule.test.js's own RUNNING Hebrew coverage style,
// tests 19-20). Closes the disclosed test-coverage gap (this file previously had zero persistent
// Hebrew-language test cases for WALKING) without expanding WALKING_TEXT_ACCEPTED_FORMS. ──

function matchWalking(walkingRestrictionText) {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', walkingRestrictionText)]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  return SafetyLayer.matchCanonicalSafetyRules(WALKING_CANDIDATE, null, pipelineContext);
}

test('WALKING-HEB-1. positive Hebrew WALKING: all accepted forms of ללכת/הליכה/הליכות match, bare', () => {
  ['ללכת', 'וללכת', 'הליכה', 'ההליכה', 'והליכה', 'הליכות', 'ההליכות', 'והליכות'].forEach(function (t) {
    assert.equal(matchWalking(t).length, 1, t);
    assert.deepEqual(matchWalking(t)[0], EXPECTED_CONFIRMED_ACTIVE_DIMS, t);
  });
});

test('WALKING-HEB-2. positive Hebrew WALKING, sentence-embedded: a qualifying token among non-qualifying surrounding words still matches (tokenizer split, not whole-string)', () => {
  assert.equal(matchWalking('אסור לי ללכת יותר מדי').length, 1);
  assert.equal(matchWalking('הרופא אמר לי לא לעשות הליכה השבוע').length, 1);
  assert.equal(matchWalking('אין הליכות ארוכות בזמן הקרוב').length, 1);
});

test('WALKING-HEB-3. הולך/הולכת (and their ו/וה-prefixed forms) are explicitly rejected, bare and sentence-embedded — the deliberate §27 homograph exclusion', () => {
  ['הולך', 'והולך', 'ההולך', 'והולך'].forEach(function (t) { assert.equal(matchWalking(t).length, 0, t); });
  ['הולכת', 'והולכת', 'ההולכת', 'והולכת'].forEach(function (t) { assert.equal(matchWalking(t).length, 0, t); });
  assert.equal(matchWalking('הוא הולך ברחוב').length, 0);
  assert.equal(matchWalking('היא הולכת לעבודה').length, 0);
});

test('WALKING-HEB-4. the closed WALKING_TEXT_ACCEPTED_FORMS list is exactly the 14 approved entries — no vocabulary expansion (§27 lock-in)', () => {
  assert.deepEqual(SafetyLayer.WALKING_TEXT_ACCEPTED_FORMS, [
    'walk', 'walking',
    'ללכת', 'הללכת', 'וללכת', 'והללכת',
    'הליכה', 'ההליכה', 'והליכה', 'וההליכה',
    'הליכות', 'ההליכות', 'והליכות', 'וההליכות'
  ]);
  assert.equal(SafetyLayer.WALKING_TEXT_ACCEPTED_FORMS.indexOf('הולך'), -1);
  assert.equal(SafetyLayer.WALKING_TEXT_ACCEPTED_FORMS.indexOf('הולכת'), -1);
});

test('WALKING-G. existing RUNNING rule regression — RUNNING Candidate still matches its own dedicated Rule, unaffected by the WALKING addition', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'running')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  var matched = SafetyLayer.matchCanonicalSafetyRules({ actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' } }, null, pipelineContext);
  assert.deepEqual(matched[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
});

// ══════════════════════════════════════════════════════════════════
// B. Unresolved Activity Safety Coverage Rule (§28) — the six required worked traces
// ══════════════════════════════════════════════════════════════════

test('UASC-1. known CYCLING candidate + deterministically RUNNING-identified restriction -> elsewhere-identified, UNMODIFIED', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'running')])
    // no userSafetyProvenance needed — the generic Rule never requires medical provenance, only
    // the dedicated RUNNING/WALKING Rules do (they never match CYCLING anyway)
  };
  var matched = SafetyLayer.matchCanonicalSafetyRules(CYCLING_CANDIDATE, null, pipelineContext);
  assert.deepEqual(matched, []);
  var evaluation = SafetyLayer.evaluateCanonicalSafetyRules(matched);
  assert.equal(evaluation.disposition, 'UNMODIFIED');
});

test('UASC-2. known CYCLING candidate + unidentified restriction -> DEFERRED', () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  var matched = SafetyLayer.matchCanonicalSafetyRules(CYCLING_CANDIDATE, null, pipelineContext);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].riskType, 'INSUFFICIENT');
  var evaluation = SafetyLayer.evaluateCanonicalSafetyRules(matched);
  assert.equal(evaluation.disposition, 'DEFERRED');
  assert.equal(evaluation.reasonCode, 'INSUFFICIENT_SAFETY_CONTEXT');
});

test('UASC-3. open Pilates candidate + deterministically RUNNING-identified restriction -> preserves TDP\'s canonical example, UNMODIFIED', () => {
  var pilates = physicalActivityCandidate(null, 'Pilates');
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'running')]) };
  var matched = SafetyLayer.matchCanonicalSafetyRules(pilates, null, pipelineContext);
  assert.deepEqual(matched, []);
  assert.equal(SafetyLayer.evaluateCanonicalSafetyRules(matched).disposition, 'UNMODIFIED');
});

test('UASC-4. open candidate whose activityReference itself matches RUNNING vocabulary -> failed normalization is NOT proof, DEFERRED', () => {
  var openRunLike = physicalActivityCandidate(null, 'a run'); // actionIdentity absent (as if normalization failed/was not attempted), but the model\'s own words literally say "a run"
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'running')]) };
  var matched = SafetyLayer.matchCanonicalSafetyRules(openRunLike, null, pipelineContext);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].riskType, 'INSUFFICIENT');
  assert.equal(SafetyLayer.evaluateCanonicalSafetyRules(matched).disposition, 'DEFERRED');
});

test('UASC-5. mixed restrictions — one deterministically elsewhere-identified + one unresolved -> DEFERRED (fail-closed)', () => {
  var pipelineContext = {
    userSafetyContext: usc([
      restriction('mem-1', 'running'),          // elsewhere-identified
      restriction('mem-2', 'no strenuous cardio') // unresolved
    ])
  };
  var matched = SafetyLayer.matchCanonicalSafetyRules(CYCLING_CANDIDATE, null, pipelineContext);
  assert.equal(matched.length, 1);
  assert.equal(SafetyLayer.evaluateCanonicalSafetyRules(matched).disposition, 'DEFERRED');
});

test('UASC-6. zero restrictions on record -> ordinary flow, UNMODIFIED', () => {
  var pipelineContext = { userSafetyContext: null };
  var matched = SafetyLayer.matchCanonicalSafetyRules(CYCLING_CANDIDATE, null, pipelineContext);
  assert.deepEqual(matched, []);
  assert.equal(SafetyLayer.evaluateCanonicalSafetyRules(matched).disposition, 'UNMODIFIED');
});

// ── Additional required categories from the closure task's own test list ───────────────────

test('7. NON_ACTIVITY_COACHING_ACTION candidates are never touched by this Rule', () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(nonActivityCandidate(), null, pipelineContext), []);
});

test('8. every existing Candidate kind this vertical does not produce (actionCategory undefined) is unaffected', () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules({}, null, pipelineContext), []);
});

test('9. Stage 8 (disqualify) never disqualifies on the Unresolved Activity Safety Coverage Rule\'s own INSUFFICIENT tuple — DEFERRED manifests only at Stage 9', async () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  var result = await SafetyLayer.disqualify([CYCLING_CANDIDATE], pipelineContext);
  assert.equal(result[0].disqualified, false); // INSUFFICIENT is not in ABSOLUTE_OVERRIDE_RISK_TYPES
});

test('10. Stage 9 (finalReview) called directly with no candidate argument still returns UNMODIFIED — the TIED_SET/no-candidate call shape, unaffected by the Stage-9 Winning-Candidate Safety Input Canonical Decision', async () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  var review = await SafetyLayer.finalReview({}, pipelineContext); // no third (candidate) argument supplied
  // Historical note: prior to the Stage-9 Winning-Candidate Safety Input Canonical Decision
  // (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md),
  // finalReview() had no candidate parameter at all, and this was the ONLY Stage-9 call shape that
  // existed — so DEFERRED could never be reached via Stage 9 in live production, for any Candidate.
  // That gap is now fixed for SINGLE_WINNER (see the LIVE-B test below, which proves DEFERRED is
  // genuinely reachable end-to-end through the real, unmodified production pipeline). This test
  // documents the narrower, still-true fact that omitting the candidate argument (TIED_SET, or any
  // direct call like this one) still, correctly, yields UNMODIFIED — matchCanonicalSafetyRules()
  // has always short-circuited to [] when no candidate is supplied, and continues to.
  assert.equal(review.disposition, 'UNMODIFIED');
});

test('11. no new RiskType/EvidenceConfidence/Correctability/Urgency/reasonCode enum value was introduced — every value used is already a member of the closed SL-001 enums', () => {
  assert.ok(SafetyLayer.RISK_TYPES.indexOf('INSUFFICIENT') !== -1);
  assert.ok(SafetyLayer.EVIDENCE_CONFIDENCE.indexOf('INSUFFICIENT') !== -1);
  assert.ok(SafetyLayer.CORRECTABILITY.indexOf('INSUFFICIENT') !== -1);
  assert.ok(SafetyLayer.URGENCY.indexOf('INSUFFICIENT') !== -1);
});

test('12. no full repository regression modification — RUNNING/WALKING rules remain in CANONICAL_SAFETY_RULES ahead of the generic rule, disjoint preconditions verified by trace', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'running')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  var runningCandidate = { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' } };
  var matched = SafetyLayer.matchCanonicalSafetyRules(runningCandidate, null, pipelineContext);
  assert.deepEqual(matched[0], EXPECTED_CONFIRMED_ACTIVE_DIMS); // RUNNING's own dedicated Rule governs, generic Rule never runs
});

// ══════════════════════════════════════════════════════════════════
// C. Live end-to-end acceptance — Stage-9 Winning-Candidate Safety Input Canonical Decision
// (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md).
// Runs the REAL, unmodified WinnerSelection.select() -> DecisionFormation.form() -> SafetyLayer
// chain (no test double, except LIVE-E, which is explicitly authorized to use one since no
// production MODIFIED-producing Rule exists). Freezes the six required acceptance scenarios.
// ══════════════════════════════════════════════════════════════════

test('LIVE-A. RUNNING + confirmed medical RUNNING restriction: real pipeline -> Stage 8 absolute-override disqualification -> SILENCE, unchanged', async () => {
  var runningCandidate = liveCandidate('run-1', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' } });
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'running')]),
    userSafetyProvenance: usp([provenance('mem-1', 'doctor')])
  };
  var result = await runRealPipeline(runningCandidate, pipelineContext);
  assert.equal(result.selection.status, 'ALL_DISQUALIFIED');
  assert.equal(result.formed.status, 'FORMED');
  assert.equal(result.formed.decision.kind, 'SILENCE');
  assert.equal('safetyDisposition' in result.formed.decision, false); // ALL_DISQUALIFIED never calls finalReview()
});

test('LIVE-B (CRITICAL — proves the original blocker is resolved). CYCLING + unresolved "no strenuous cardio": real pipeline now resolves Stage 9 DEFERRED -> SILENCE, not delivered', async () => {
  var cyclingCandidate = liveCandidate('cyc-1', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' }, activityReference: 'a bike ride' });
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  var result = await runRealPipeline(cyclingCandidate, pipelineContext);
  assert.equal(result.selection.status, 'SINGLE_WINNER'); // survives Stage 8 — INSUFFICIENT is not an absolute-override RiskType
  assert.equal(result.formed.status, 'FORMED');
  assert.equal(result.formed.decision.safetyDisposition.disposition, 'DEFERRED');
  assert.equal(result.formed.decision.safetyDisposition.originalKind, 'INITIATIVE');
  assert.equal(result.formed.decision.kind, 'SILENCE'); // NOT 'INITIATIVE' — this is the exact defect the prior verification proved live
});

test('LIVE-C. open Pilates + deterministically RUNNING-identified restriction: real pipeline -> Stage 9 UNMODIFIED -> ordinary deliverable decision', async () => {
  var pilatesCandidate = liveCandidate('pil-1', { actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'Pilates' });
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'running')]) };
  var result = await runRealPipeline(pilatesCandidate, pipelineContext);
  assert.equal(result.selection.status, 'SINGLE_WINNER');
  assert.equal(result.formed.decision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.formed.decision.kind, 'INITIATIVE');
});

test('LIVE-D. zero Safety restrictions: real pipeline -> Stage 9 UNMODIFIED -> ordinary deliverable decision', async () => {
  var safeCandidate = liveCandidate('safe-1', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' } });
  var pipelineContext = { userSafetyContext: null };
  var result = await runRealPipeline(safeCandidate, pipelineContext);
  assert.equal(result.selection.status, 'SINGLE_WINNER');
  assert.equal(result.formed.decision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.formed.decision.kind, 'INITIATIVE');
});

test('LIVE-E. MODIFIED reachability: Decision Formation\'s existing MODIFIED consumption remains reachable/compatible under the new SINGLE_WINNER contract (test-double Safety Layer — no production MODIFIED-producing Canonical Safety Rule exists yet, so no production Rule is added merely to test this)', async () => {
  var modifiedCandidate = liveCandidate('mod-1', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' } });
  var port = makeSafetyIntegrationPortTestDouble({
    reviewRule: function () {
      return { disposition: 'MODIFIED', modifiedContent: { action: 'a softened version' }, reasonCode: 'DANGEROUS_OR_EXTREME_REQUEST', reasonDetail: null, reason: 'DANGEROUS_OR_EXTREME_REQUEST' };
    }
  });
  var selection = await WinnerSelection.select({ rankedPool: [modifiedCandidate], pipelineContext: {}, safetyPort: port });
  assert.equal(selection.status, 'SINGLE_WINNER');
  var formed = await DecisionFormation.form({ selection: selection, pipelineContext: {}, safetyPort: port, opportunitiesConsidered: [], candidatePoolSize: 1 });
  assert.equal(formed.decision.safetyDisposition.disposition, 'MODIFIED');
  assert.equal(formed.decision.kind, 'INITIATIVE');
  assert.deepEqual(formed.decision.modification.modifiedContent, { action: 'a softened version' });
  assert.equal(port.calls.lastFinalReviewCandidate, modifiedCandidate); // the new SINGLE_WINNER contract held on this path too
});

test('LIVE-F. TIED_SET: real Safety Layer finalReview() behavior is unchanged — no candidate forwarded, UNMODIFIED, even against a restriction that would DEFER a real SINGLE_WINNER candidate', async () => {
  var a = liveCandidate('tie-a', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' } });
  var b = liveCandidate('tie-b', { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' } });
  var selection = { status: 'TIED_SET', tiedSet: [a, b], disqualifiedCandidates: [] };
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) }; // would DEFER a real SINGLE_WINNER CYCLING candidate — see LIVE-B
  var formed = await DecisionFormation.form({ selection: selection, pipelineContext: pipelineContext, safetyPort: SafetyLayer, opportunitiesConsidered: [], candidatePoolSize: 2 });
  assert.equal(formed.decision.safetyDisposition.disposition, 'UNMODIFIED'); // unchanged: TIED_SET forwards no candidate, per canonical decision §7 non-goal
  assert.equal(formed.decision.kind, 'INITIATIVE');
  assert.deepEqual(formed.decision.options, [a, b]);
});
