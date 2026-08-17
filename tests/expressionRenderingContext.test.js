// Expression WP4 (remainder) — Expression Rendering Context Contract tests
// (EXPRESSION_SPEC_v1.0.md §10.1, EXP-73-78, Canonical Decision 8; EXPRESSION_IMPLEMENTATION_PLAN.md
// WP4). Validates the schema-conformance builder/validator only — this module never computes,
// infers, resolves, or estimates a Relationship Maturity Stage of its own; every value is
// caller-supplied (js/coachDecisionSystem/memoryLayer.js), already computed there.
// Run with: node --test tests/expressionRenderingContext.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ExpressionRenderingContext = require('../js/coachDecisionSystem/expressionRenderingContext.js');

function validParams(overrides) {
  return Object.assign({ relationshipMaturityStage: 'UNKNOWN' }, overrides || {});
}

// ── EXP-74: schemaVersion, closed field set, no `immutable` payload field ──

test('schemaVersion follows the existing memoryLayer.js/deliveryIntentContract.js convention', () => {
  assert.equal(ExpressionRenderingContext.SCHEMA_VERSION, 'coach-decision-system-expression-rendering-context/1.0');
});

test('a successfully built Expression Rendering Context is immutable (Object.freeze), with no `immutable` payload field', () => {
  const result = ExpressionRenderingContext.buildExpressionRenderingContext(validParams());
  assert.equal(result.status, 'BUILT');
  const ctx = result.expressionRenderingContext;
  assert.equal(Object.isFrozen(ctx), true);
  assert.equal(Object.prototype.hasOwnProperty.call(ctx, 'immutable'), false);
  assert.throws(() => { 'use strict'; ctx.relationshipMaturityStage = 'PERSONAL_COACH'; }, TypeError);
});

test('the built object carries exactly {schemaVersion, relationshipMaturityStage} — nothing else', () => {
  const result = ExpressionRenderingContext.buildExpressionRenderingContext(validParams());
  assert.equal(result.status, 'BUILT');
  assert.deepEqual(Object.keys(result.expressionRenderingContext).sort(), ['relationshipMaturityStage', 'schemaVersion']);
});

// ── EXP-74: closed vocabulary — all five values accepted, each round-trips exactly ──

test('all five closed relationshipMaturityStage values are accepted and round-trip unchanged', () => {
  ['UNKNOWN', 'OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'].forEach((stage) => {
    const result = ExpressionRenderingContext.buildExpressionRenderingContext(validParams({ relationshipMaturityStage: stage }));
    assert.equal(result.status, 'BUILT', stage);
    assert.equal(result.expressionRenderingContext.relationshipMaturityStage, stage, stage);
  });
});

test('an unrecognized relationshipMaturityStage value is rejected, never silently coerced', () => {
  const result = ExpressionRenderingContext.buildExpressionRenderingContext(validParams({ relationshipMaturityStage: 'BEGINNER' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_RELATIONSHIP_MATURITY_STAGE');
});

test('missing relationshipMaturityStage is rejected', () => {
  const result = ExpressionRenderingContext.buildExpressionRenderingContext({});
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_RELATIONSHIP_MATURITY_STAGE');
});

// ── EXP-75 (prohibited content): structural rejection of any unrecognized field ──

test('a top-level field outside {relationshipMaturityStage} is rejected — enforces EXP-75 structurally', () => {
  ['basis', 'kind', 'rationale', 'confidence', 'hierarchyTier', 'reasonCode', 'reasonDetail', 'candidateProvenance', 'decisionPassTrace', 'platform', 'ui', 'userId', 'userProfile', 'coachStyle', 'coachChatter'].forEach((key) => {
    const params = validParams();
    params[key] = 'anything';
    const result = ExpressionRenderingContext.buildExpressionRenderingContext(params);
    assert.equal(result.status, 'REJECTED', key);
    assert.equal(result.reason, 'UNRECOGNIZED_FIELD', key);
  });
});

// ── Defensive input handling — never throws ──

test('non-object params are rejected rather than throwing', () => {
  assert.equal(ExpressionRenderingContext.buildExpressionRenderingContext(null).status, 'REJECTED');
  assert.equal(ExpressionRenderingContext.buildExpressionRenderingContext(undefined).status, 'REJECTED');
  assert.equal(ExpressionRenderingContext.buildExpressionRenderingContext('not an object').status, 'REJECTED');
  assert.equal(ExpressionRenderingContext.buildExpressionRenderingContext([]).status, 'REJECTED');
});

// ── isValidExpressionRenderingContext as a standalone downstream conformance check ──

test('isValidExpressionRenderingContext accepts every correctly-built Context', () => {
  ['UNKNOWN', 'OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'].forEach((stage) => {
    const result = ExpressionRenderingContext.buildExpressionRenderingContext(validParams({ relationshipMaturityStage: stage }));
    assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext(result.expressionRenderingContext), true, stage);
  });
});

test('isValidExpressionRenderingContext rejects a plausible-looking but malformed candidate', () => {
  assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext(null), false);
  assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext({}), false);
  assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext({
    schemaVersion: 'wrong/1.0', relationshipMaturityStage: 'UNKNOWN'
  }), false); // wrong schemaVersion
  assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext({
    schemaVersion: ExpressionRenderingContext.SCHEMA_VERSION, relationshipMaturityStage: 'UNKNOWN', immutable: true
  }), false); // no `immutable` payload field is ever valid — approved adjustment (EXP-74)
  assert.equal(ExpressionRenderingContext.isValidExpressionRenderingContext({
    schemaVersion: ExpressionRenderingContext.SCHEMA_VERSION, relationshipMaturityStage: 'NOVICE'
  }), false); // unrecognized stage value
});

// ── Vocabulary closure ──

test('RELATIONSHIP_MATURITY_STAGES is exactly the four canonical stages plus UNKNOWN', () => {
  assert.deepEqual(ExpressionRenderingContext.RELATIONSHIP_MATURITY_STAGES, ['UNKNOWN', 'OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']);
});
