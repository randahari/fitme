// WP0 Phase C — Standard Proposal Contract tests (docs/specs/WP0_SPEC_v1.0.md §19).
// Run with: node --test tests/standardProposalContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StandardProposalContract = require('../js/coachDecisionSystem/standardProposalContract.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');

test('OUTCOMES is the exact, exhaustive, frozen three-value closed vocabulary, matching TRR-001\'s own outcome vocabulary exactly', () => {
  assert.deepEqual(StandardProposalContract.OUTCOMES, ['ACTION_PROPOSED', 'CLARIFICATION_NEEDED', 'NO_VIABLE_PROPOSAL']);
  assert.deepEqual(StandardProposalContract.OUTCOMES.slice().sort(), [
    TrainingReadinessReasoningComponent.ACTION_PROPOSED,
    TrainingReadinessReasoningComponent.CLARIFICATION_NEEDED,
    TrainingReadinessReasoningComponent.NO_VIABLE_PROPOSAL
  ].sort());
  assert.ok(Object.isFrozen(StandardProposalContract.OUTCOMES));
});

test('rejects a non-object', () => {
  assert.equal(StandardProposalContract.isValidStandardProposal(null), false);
  assert.equal(StandardProposalContract.isValidStandardProposal('x'), false);
});

test('rejects an unknown outcome value', () => {
  assert.equal(StandardProposalContract.isValidStandardProposal({ outcome: 'SOMETHING_ELSE' }), false);
});

test('NO_VIABLE_PROPOSAL requires no other field', () => {
  assert.equal(StandardProposalContract.isValidStandardProposal({ outcome: 'NO_VIABLE_PROPOSAL' }), true);
});

test('ACTION_PROPOSED requires action/rationale/evidenceBasis/expectedValue/uncertainty', () => {
  const base = { outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' };
  assert.equal(StandardProposalContract.isValidStandardProposal(base), true);
  ['action', 'rationale', 'evidenceBasis', 'expectedValue'].forEach((field) => {
    const missing = Object.assign({}, base);
    delete missing[field];
    assert.equal(StandardProposalContract.isValidStandardProposal(missing), false, field + ' must be required');
  });
});

test('uncertainty may be an empty-ish but non-null/non-empty-string value is required (mirrors TRR\'s own gate exactly)', () => {
  const base = { outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v' };
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { uncertainty: null })), false);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { uncertainty: '' })), false);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { uncertainty: 'low' })), true);
});

test('CLARIFICATION_NEEDED requires the same explanation fields as ACTION_PROPOSED', () => {
  const proposal = { outcome: 'CLARIFICATION_NEEDED', action: 'what do you mean?', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' };
  assert.equal(StandardProposalContract.isValidStandardProposal(proposal), true);
});

test('actionCategory/activityReference are optional and unconstrained by this shared contract (never a forced TRR-specific vocabulary — §10 Invariant)', () => {
  const base = { outcome: 'ACTION_PROPOSED', action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' };
  assert.equal(StandardProposalContract.isValidStandardProposal(base), true); // absent — fine
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { actionCategory: 'ANYTHING_AT_ALL' })), true); // unconstrained
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { activityReference: 'קרלינג' })), true); // open-world text, still valid
});

test('riskCharacteristicTags, when present, must be an array of real, closed-taxonomy RiskCharacteristicTag objects (WP0 Phase D.1, docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §10.1) — supersedes Phase C\'s own placeholder {dimension,value} shape, which no longer exists now that Phase D defines the real taxonomy', () => {
  const base = { outcome: 'NO_VIABLE_PROPOSAL' };
  const noKnownConflictTag = { domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null };
  const realTag = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', relation: 'ACUTE_STATE_INDICATED_THIS_TURN', severity: 'ADVISORY', evidenceSource: 'CURRENT_TURN_USER_STATEMENT', anchorText: 'peanut allergy' };
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: [] })), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: [noKnownConflictTag] })), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: [realTag] })), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: 'not-an-array' })), false);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: [{ dimension: 'x', value: 'y' }] })), false); // Phase C's own old placeholder shape is now rejected — the closed taxonomy is defined
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { riskCharacteristicTags: [{ domain: 'NOT_A_REAL_DOMAIN', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }] })), false); // out-of-vocabulary domain
});

test('mutationProposal, when present, must carry a non-empty mutationKind', () => {
  const base = { outcome: 'NO_VIABLE_PROPOSAL' };
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { mutationProposal: null })), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { mutationProposal: { mutationKind: 'LOG_FOOD', proposedData: {} } })), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(Object.assign({}, base, { mutationProposal: { proposedData: {} } })), false); // missing mutationKind
});

test('TRR-001\'s own real ACTION_PROPOSED output is also a valid StandardProposal (proof this contract generalizes TRR\'s shape without weakening it)', () => {
  const trrOutput = {
    outcome: 'ACTION_PROPOSED', action: 'shorten training', actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'a light swim',
    rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u'
  };
  assert.equal(TrainingReadinessReasoningComponent.isValidReasoningOutput(trrOutput), true);
  assert.equal(StandardProposalContract.isValidStandardProposal(trrOutput), true);
});
