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
    [{ opportunityProvenance: {}, disqualified: false, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null },
     { opportunityProvenance: {}, disqualified: true, reasonCode: 'KNOWN_ALLERGY_CONFLICT', reasonDetail: null, reason: 'KNOWN_ALLERGY_CONFLICT' }], pool
  ), true);
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: false, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }], pool), false); // length mismatch
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray('not an array', pool), false);
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ disqualified: 'yes', opportunityProvenance: {}, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }, {}], pool), false); // non-boolean disqualified
});

test('isValidSafetyReviewResult accepts only the five closed dispositions', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'UNMODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'MAYBE', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult(null), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({}), false);
});

// ── RCD-11/RCD-13.A — closed reasonCode catalogue ──

test('REASON_CODES is the exact, exhaustive, closed thirteen-value RCD-11/RCD-13.A catalogue', () => {
  assert.deepEqual(SafetyIntegrationPort.REASON_CODES, [
    'NO_SAFETY_CONFLICT', 'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT',
    'ACTIVE_HIGH_RISK_SYMPTOM', 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST',
    'PERMANENT_SAFETY_COMMITMENT_CONFLICT', 'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PSYCHOLOGICAL_DISTRESS_CONCERN',
    'OUTSIDE_COACHING_SCOPE', 'INSUFFICIENT_SAFETY_CONTEXT', 'INFERRED_SIGNAL_NOT_SUFFICIENT', 'PROFESSIONAL_SUPPORT_REQUIRED'
  ]);
});

test('DISPOSITION_PRECEDENCE is the exact, most- to least-protective RCD-09/RCD-12 order', () => {
  assert.deepEqual(SafetyIntegrationPort.DISPOSITION_PRECEDENCE, ['ESCALATED', 'BLOCKED', 'DEFERRED', 'MODIFIED', 'UNMODIFIED']);
});

// ── RCD-13.C — DisqualificationResult reasonCode/reasonDetail invariants ──

test('a DisqualificationResult with reasonCode absent, unknown, or NO_SAFETY_CONFLICT while disqualified is invalid', () => {
  const pool = [{ opportunityProvenance: {} }];
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: true, reasonDetail: null, reason: 'x' }], pool), false); // reasonCode absent
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: true, reasonCode: 'NOT_A_CODE', reasonDetail: null, reason: 'x' }], pool), false); // unknown code
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: true, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }], pool), false); // disqualified=true requires a real conflict code
});

test('a DisqualificationResult with disqualified=false requires reasonCode NO_SAFETY_CONFLICT and null reasonDetail/reason', () => {
  const pool = [{ opportunityProvenance: {} }];
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: false, reasonCode: 'KNOWN_ALLERGY_CONFLICT', reasonDetail: null, reason: null }], pool), false);
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray([{ opportunityProvenance: {}, disqualified: false, reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: 'NO_SAFETY_CONFLICT' }], pool), false); // reason must be null too
});

// ── RCD-13.D — SafetyReviewResult per-disposition reasonCode invariants (SPEC Ch.26 table) ──

test('UNMODIFIED requires reasonCode NO_SAFETY_CONFLICT and null reasonDetail/reason', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'UNMODIFIED', reasonCode: 'DANGEROUS_OR_EXTREME_REQUEST', reasonDetail: null, reason: 'DANGEROUS_OR_EXTREME_REQUEST' }), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'UNMODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: 'NO_SAFETY_CONFLICT' }), false); // reason must mirror null too
});

test('DEFERRED requires reasonCode to be exactly one of the two RCD-12.E-fixed codes', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'DEFERRED', reasonCode: 'INSUFFICIENT_SAFETY_CONTEXT', reasonDetail: null, reason: 'INSUFFICIENT_SAFETY_CONTEXT' }), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'DEFERRED', reasonCode: 'INFERRED_SIGNAL_NOT_SUFFICIENT', reasonDetail: null, reason: 'INFERRED_SIGNAL_NOT_SUFFICIENT' }), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'DEFERRED', reasonCode: 'DANGEROUS_OR_EXTREME_REQUEST', reasonDetail: null, reason: 'DANGEROUS_OR_EXTREME_REQUEST' }), false);
});

test('ESCALATED requires reasonCode PROFESSIONAL_SUPPORT_REQUIRED exactly (RCD-14.E fixed mapping)', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'ESCALATED', reasonCode: 'PROFESSIONAL_SUPPORT_REQUIRED', reasonDetail: null, reason: 'PROFESSIONAL_SUPPORT_REQUIRED' }), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'ESCALATED', reasonCode: 'ACTIVE_HIGH_RISK_SYMPTOM', reasonDetail: null, reason: 'ACTIVE_HIGH_RISK_SYMPTOM' }), false);
});

test('BLOCKED and MODIFIED reject reasonCode NO_SAFETY_CONFLICT', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'BLOCKED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'MODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null, reason: null }), false);
});

// ── RCD-13.E — deprecated `reason` compatibility mirror ──

test('reason must exactly mirror reasonCode (or null iff NO_SAFETY_CONFLICT) — free text is invalid', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'BLOCKED', reasonCode: 'KNOWN_ALLERGY_CONFLICT', reasonDetail: null, reason: 'the user has a known allergy' }), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({ disposition: 'BLOCKED', reasonCode: 'KNOWN_ALLERGY_CONFLICT', reasonDetail: null, reason: 'KNOWN_ALLERGY_CONFLICT' }), true);
});

// ── RCD-13.B/RCD-13.F — SafetyReasonDetail / secondaryReasonCodes rules ──

test('isValidSafetyReasonDetail accepts null and a well-formed secondaryReasonCodes array', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail(null, 'KNOWN_ALLERGY_CONFLICT'), true);
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail({ secondaryReasonCodes: ['ACTIVE_MEDICAL_INSTRUCTION_CONFLICT'] }, 'KNOWN_ALLERGY_CONFLICT'), true);
});

test('isValidSafetyReasonDetail rejects an unknown code, a duplicate, the primary code, and NO_SAFETY_CONFLICT as secondary', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail({ secondaryReasonCodes: ['NOT_A_CODE'] }, 'KNOWN_ALLERGY_CONFLICT'), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail({ secondaryReasonCodes: ['ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT'] }, 'KNOWN_ALLERGY_CONFLICT'), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail({ secondaryReasonCodes: ['KNOWN_ALLERGY_CONFLICT'] }, 'KNOWN_ALLERGY_CONFLICT'), false);
  assert.equal(SafetyIntegrationPort.isValidSafetyReasonDetail({ secondaryReasonCodes: ['NO_SAFETY_CONFLICT'] }, 'KNOWN_ALLERGY_CONFLICT'), false);
});

test('a SafetyReviewResult carrying a malformed reasonDetail is invalid overall', () => {
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult({
    disposition: 'BLOCKED', reasonCode: 'KNOWN_ALLERGY_CONFLICT', reasonDetail: { secondaryReasonCodes: ['KNOWN_ALLERGY_CONFLICT'] }, reason: 'KNOWN_ALLERGY_CONFLICT'
  }), false);
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
