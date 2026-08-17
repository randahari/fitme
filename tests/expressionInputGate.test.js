// Expression WP3 — Expression Input Gate tests (EXPRESSION_SPEC_v1.0.md §10/§13/§19, EXP-19,
// EXP-29/EXP-50; EXPRESSION_IMPLEMENTATION_PLAN.md WP3). Validates isValidTerminalDecision()/
// isSilenceKind() in isolation — no rendering, dispatch, or REFUSAL/ESCALATION/disclosure content
// exists here or anywhere in this module (later Work Packages' scope, not WP3's).
// Run with: node --test tests/expressionInputGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ExpressionInputGate = require('../js/coachDecisionSystem/expressionInputGate.js');

function validRecommendation(overrides) {
  return Object.assign({
    kind: 'RECOMMENDATION',
    rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' },
    confidence: 0.7,
    hierarchyTier: 2,
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'RECOMMENDATION' },
    immutable: true
  }, overrides || {});
}

// ── §25.1 Required Fields ──

test('a fully-formed RECOMMENDATION TerminalDecision is valid', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation()), true);
});

test('a fully-formed INITIATIVE TerminalDecision is valid', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation({ kind: 'INITIATIVE', safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'INITIATIVE' } })), true);
});

test('missing rationale, decisionPassTrace, candidateProvenance, or immutable is invalid', () => {
  ['rationale', 'decisionPassTrace', 'candidateProvenance', 'immutable'].forEach((field) => {
    const bad = validRecommendation();
    delete bad[field];
    assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false, field);
  });
});

test('a rationale object missing any of the four required sub-fields is invalid', () => {
  ['rationale', 'evidenceBasis', 'expectedValue', 'uncertainty'].forEach((sub) => {
    const rationale = { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' };
    delete rationale[sub];
    assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation({ rationale: rationale })), false, sub);
  });
});

test('an unknown kind value is invalid', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation({ kind: 'NOT_A_KIND' })), false);
});

test('immutable: false is invalid', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation({ immutable: false })), false);
});

// ── §25.4 boundaryType present iff kind === 'BOUNDARY' ──

test('a BOUNDARY TerminalDecision requires a valid boundaryType', () => {
  const noBoundaryType = validRecommendation({ kind: 'BOUNDARY', confidence: undefined, hierarchyTier: undefined, safetyDisposition: { disposition: 'BLOCKED', originalKind: 'RECOMMENDATION' } });
  delete noBoundaryType.confidence; delete noBoundaryType.hierarchyTier;
  assert.equal(ExpressionInputGate.isValidTerminalDecision(noBoundaryType), false);

  const withBoundaryType = Object.assign({}, noBoundaryType, { boundaryType: 'REFUSAL' });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(withBoundaryType), true);

  const unknownBoundaryType = Object.assign({}, withBoundaryType, { boundaryType: 'WARNING' });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(unknownBoundaryType), false);
});

test('boundaryType present on a non-BOUNDARY kind is invalid', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(validRecommendation({ boundaryType: 'REFUSAL' })), false);
});

// ── confidence/hierarchyTier required for RECOMMENDATION/INITIATIVE only ──

test('confidence/hierarchyTier present on a SILENCE-shaped or BOUNDARY-shaped decision is invalid', () => {
  const silence = { kind: 'SILENCE', rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' }, candidateProvenance: [], decisionPassTrace: {}, immutable: true, confidence: 0.5 };
  assert.equal(ExpressionInputGate.isValidTerminalDecision(silence), false);
});

test('confidence or hierarchyTier missing on a RECOMMENDATION/INITIATIVE decision is invalid', () => {
  const noConfidence = validRecommendation(); delete noConfidence.confidence;
  assert.equal(ExpressionInputGate.isValidTerminalDecision(noConfidence), false);
  const noTier = validRecommendation(); delete noTier.hierarchyTier;
  assert.equal(ExpressionInputGate.isValidTerminalDecision(noTier), false);
});

// ── safetyDisposition: required except zero-Candidates Silence; §25.4 co-occurrence invariants ──

test('safetyDisposition absent is valid only for a SILENCE-kind decision (zero-Candidates origin)', () => {
  const zeroCandidatesSilence = { kind: 'SILENCE', rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' }, candidateProvenance: [], decisionPassTrace: {}, immutable: true };
  assert.equal(ExpressionInputGate.isValidTerminalDecision(zeroCandidatesSilence), true);

  const missingOnRecommendation = validRecommendation(); delete missingOnRecommendation.safetyDisposition;
  assert.equal(ExpressionInputGate.isValidTerminalDecision(missingOnRecommendation), false);
});

test('DEFERRED must co-occur with kind SILENCE', () => {
  const ok = { kind: 'SILENCE', rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' }, candidateProvenance: [{ opportunityId: 'x' }], decisionPassTrace: {}, immutable: true, safetyDisposition: { disposition: 'DEFERRED', originalKind: 'RECOMMENDATION' } };
  assert.equal(ExpressionInputGate.isValidTerminalDecision(ok), true);
  const bad = validRecommendation({ safetyDisposition: { disposition: 'DEFERRED', originalKind: 'RECOMMENDATION' } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

test('BLOCKED must co-occur with kind BOUNDARY / boundaryType REFUSAL', () => {
  const bad = validRecommendation({ safetyDisposition: { disposition: 'BLOCKED', originalKind: 'RECOMMENDATION' } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

test('ESCALATED must co-occur with kind BOUNDARY / boundaryType ESCALATION', () => {
  const bad = validRecommendation({ safetyDisposition: { disposition: 'ESCALATED', originalKind: 'RECOMMENDATION' } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

test('an unknown safetyDisposition.disposition value is invalid', () => {
  const bad = validRecommendation({ safetyDisposition: { disposition: 'MAYBE', originalKind: 'RECOMMENDATION' } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

// ── §25.4 modification present iff safetyDisposition.disposition === 'MODIFIED' ──

test('modification present without a MODIFIED disposition is invalid', () => {
  const bad = validRecommendation({ modification: { modifiedContent: {} } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

test('MODIFIED disposition without a modification object is invalid', () => {
  const bad = validRecommendation({ safetyDisposition: { disposition: 'MODIFIED', originalKind: 'RECOMMENDATION' } });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(bad), false);
});

test('MODIFIED disposition with a well-formed modification object is valid', () => {
  const ok = validRecommendation({
    safetyDisposition: { disposition: 'MODIFIED', originalKind: 'RECOMMENDATION' },
    modification: { modifiedContent: { text: 'adjusted' } }
  });
  assert.equal(ExpressionInputGate.isValidTerminalDecision(ok), true);
});

// ── isSilenceKind — both origins covered by a single check ──

test('isSilenceKind is true for kind SILENCE regardless of origin, false otherwise', () => {
  assert.equal(ExpressionInputGate.isSilenceKind({ kind: 'SILENCE' }), true);
  assert.equal(ExpressionInputGate.isSilenceKind({ kind: 'SILENCE', safetyDisposition: { disposition: 'DEFERRED' } }), true);
  assert.equal(ExpressionInputGate.isSilenceKind({ kind: 'RECOMMENDATION' }), false);
  assert.equal(ExpressionInputGate.isSilenceKind(null), false);
  assert.equal(ExpressionInputGate.isSilenceKind(undefined), false);
});

// ── Non-object / malformed input never throws ──

test('non-object candidates are rejected, not thrown', () => {
  assert.equal(ExpressionInputGate.isValidTerminalDecision(null), false);
  assert.equal(ExpressionInputGate.isValidTerminalDecision(undefined), false);
  assert.equal(ExpressionInputGate.isValidTerminalDecision('not an object'), false);
  assert.equal(ExpressionInputGate.isValidTerminalDecision([]), false);
});
