// TASK-006 — Safety Integration Port contract tests (§21.8, Canonical Decision CD-T006-05,
// §35.7). Validates the shape-checking helpers only — no Safety Layer policy logic exists here
// or anywhere in this module (Non-Goal, §8/§9.3).
// Run with: node --test tests/safetyIntegrationPort.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SafetyIntegrationPort = require('../js/coachDecisionSystem/safetyIntegrationPort.js');

const portJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/safetyIntegrationPort.js'), 'utf8');
const decisionFormationJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/decisionFormation.js'), 'utf8');
const winnerSelectionJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/winnerSelection.js'), 'utf8');
const eligibilityEvaluatorJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/eligibilityEvaluator.js'), 'utf8');
const prioritizationJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/prioritization.js'), 'utf8');
const orchestratorJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');

test('DISPOSITIONS is the exact, exhaustive five-value CD-T006-06 vocabulary', () => {
  assert.deepEqual(SafetyIntegrationPort.DISPOSITIONS, ['UNMODIFIED', 'MODIFIED', 'DEFERRED', 'BLOCKED', 'ESCALATED']);
});

test('isValidDisqualificationResultArray requires one entry per submitted Candidate, each shaped correctly', () => {
  const pool = [{ opportunityProvenance: { opportunityId: 'a' } }, { opportunityProvenance: { opportunityId: 'b' } }];
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray(
    [{ opportunityProvenance: {}, disqualified: false, reason: null }, { opportunityProvenance: {}, disqualified: true, reason: 'x' }], pool
  ), true);
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: false, reason: null }], pool), false); // length mismatch
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray('not an array', pool), false);
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ disqualified: 'yes', opportunityProvenance: {}, reason: null }, {}], pool), false); // non-boolean disqualified
});

test('isValidSafetyReviewResult accepts only the five closed dispositions', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'UNMODIFIED', reason: null }), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'MAYBE', reason: null }), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult(null), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({}), false);
});

// ── §8/§9.3/§21.8 — no Safety Layer policy logic; production never references the test double ──

test('safetyIntegrationPort.js contains no Safety Layer policy logic — no default disqualification/review implementation of its own', () => {
  assert.equal(portJs.indexOf('function disqualify'), -1);
  assert.equal(portJs.indexOf('function finalReview'), -1);
});

test('no production Decision Engine module imports or references the test-only Safety double (Canonical Decision CD-T006-05, §21.8)', () => {
  [decisionFormationJs, winnerSelectionJs, eligibilityEvaluatorJs, prioritizationJs, orchestratorJs, portJs].forEach((src) => {
    assert.equal(src.indexOf('safetyIntegrationPortTestDouble'), -1);
    assert.equal(/require\(['"].*fixtures/.test(src), false); // a documentation mention of "see tests/fixtures/" is fine; an actual require(...) is not
  });
});

test('winnerSelection.js and decisionFormation.js never construct a hard-coded "always qualified"/"always unmodified" stub in place of a real port', () => {
  // A real caller must supply safetyPort; absence aborts (§21.7) rather than defaulting.
  assert.match(winnerSelectionJs, /SAFETY_LAYER_UNAVAILABLE/);
  assert.match(decisionFormationJs, /SAFETY_LAYER_UNAVAILABLE/);
});
