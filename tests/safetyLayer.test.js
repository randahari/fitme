// SL-001 — Safety Layer tests (docs/specs/SL-001_SPEC_v1.0.md, RCD-01 through RCD-14).
// Unit / contract / integration / tie-break / failure / regression coverage for the production
// SafetyIntegrationPort implementation (js/coachDecisionSystem/safetyLayer.js).
// Run with: node --test tests/safetyLayer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
const SafetyIntegrationPort = require('../js/coachDecisionSystem/safetyIntegrationPort.js');

function rule(overrides) {
  return Object.assign({
    riskType: 'DANGEROUS_OR_EXTREME_REQUEST',
    evidenceConfidence: 'EXPLICIT_USER_STATEMENT',
    correctability: 'NOT_APPLICABLE',
    urgency: 'ROUTINE_PROTECTIVE'
  }, overrides);
}

// ══════════════════════════════════════════════════════════════════
// Unit — closed enums (RCD-12.A-D)
// ══════════════════════════════════════════════════════════════════

test('RISK_TYPES is the exact, exhaustive, closed eleven-value RCD-12.A enum', () => {
  assert.deepEqual(SafetyLayer.RISK_TYPES, [
    'NONE', 'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PSYCHOLOGICAL_DISTRESS_CONCERN', 'OUTSIDE_COACHING_SCOPE', 'INSUFFICIENT'
  ]);
});

test('EVIDENCE_CONFIDENCE is the exact, exhaustive, closed six-value RCD-12.B enum, D1 Evidence Hierarchy order', () => {
  assert.deepEqual(SafetyLayer.EVIDENCE_CONFIDENCE, [
    'EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR', 'SINGLE_BEHAVIOUR', 'INFERENCE', 'INSUFFICIENT'
  ]);
});

test('CORRECTABILITY is the exact, exhaustive, closed four-value RCD-12.C enum', () => {
  assert.deepEqual(SafetyLayer.CORRECTABILITY, ['NOT_APPLICABLE', 'BOUNDED_MODIFICATION', 'REQUIRES_INTENT_CHANGE', 'INSUFFICIENT']);
});

test('URGENCY is the exact, exhaustive, closed four-value RCD-12.D enum', () => {
  assert.deepEqual(SafetyLayer.URGENCY, ['ROUTINE_PROTECTIVE', 'TIME_SENSITIVE', 'IMMEDIATE_PROTECTIVE', 'INSUFFICIENT']);
});

test('CANONICAL_SAFETY_RULE_ORDER is the exact, fixed, nine-item RCD-14.C.4 tie-break order', () => {
  assert.deepEqual(SafetyLayer.CANONICAL_SAFETY_RULE_ORDER, [
    'ACTIVE_HIGH_RISK_SYMPTOM', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'KNOWN_ALLERGY_CONFLICT',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PSYCHOLOGICAL_DISTRESS_CONCERN',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', 'OUTSIDE_COACHING_SCOPE'
  ]);
  // Independent of RiskType's own enum declaration order (RCD-14.C.4's own explicit requirement).
  assert.notDeepEqual(SafetyLayer.CANONICAL_SAFETY_RULE_ORDER, SafetyLayer.RISK_TYPES.filter((r) => r !== 'NONE' && r !== 'INSUFFICIENT'));
});

test('ABSOLUTE_OVERRIDE_RISK_TYPES is the exact, closed, four-value D1-AH-02 subset (Stage 8)', () => {
  assert.deepEqual(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES, [
    'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT'
  ]);
});

// ══════════════════════════════════════════════════════════════════
// Unit — matchCanonicalSafetyRules()/detectSafetyOpportunities() honestly yield zero matches
// (documented Repository Gap: no Health/Safety Profile data source exists in Pipeline Context)
// ══════════════════════════════════════════════════════════════════

test('matchCanonicalSafetyRules() yields zero matches regardless of Candidate/Terminal Decision/Pipeline Context shape — never fabricates a Rule match absent a data source', () => {
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(undefined, undefined, undefined), []);
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules({ kind: 'RECOMMENDATION' }, null, {}), []);
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(null, { kind: 'RECOMMENDATION' }, { healthSafetyProfile: { anything: true } }), []);
});

test('detectSafetyOpportunities() yields zero Opportunities at this repository baseline, mirroring detectDisruptionOpportunities()/detectMilestoneRecoveryOpportunities() precedent', () => {
  assert.deepEqual(SafetyLayer.detectSafetyOpportunities(undefined), []);
  assert.deepEqual(SafetyLayer.detectSafetyOpportunities({ lifeEventContext: null }), []);
});

// ══════════════════════════════════════════════════════════════════
// Unit — each of the five RCD-12.E disposition predicates individually satisfied
// ══════════════════════════════════════════════════════════════════

test('ESCALATED — escalationRequired flag', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ escalationRequired: true, riskType: 'DANGEROUS_OR_EXTREME_REQUEST' })), 'ESCALATED');
});

test('ESCALATED — ACTIVE_HIGH_RISK_SYMPTOM + IMMEDIATE_PROTECTIVE', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', urgency: 'IMMEDIATE_PROTECTIVE' })), 'ESCALATED');
  // ACTIVE_HIGH_RISK_SYMPTOM alone, without IMMEDIATE_PROTECTIVE, does not escalate by this predicate
  assert.notEqual(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', urgency: 'TIME_SENSITIVE', correctability: 'BOUNDED_MODIFICATION' })), 'ESCALATED');
});

test('ESCALATED — PSYCHOLOGICAL_DISTRESS_CONCERN + immediate protective/professional-support flag', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'PSYCHOLOGICAL_DISTRESS_CONCERN', immediateProtectiveOrProfessionalSupportRequired: true })), 'ESCALATED');
});

test('ESCALATED — outsideCoachingAuthorityRequiringProfessionalSupport flag', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'OUTSIDE_COACHING_SCOPE', outsideCoachingAuthorityRequiringProfessionalSupport: true })), 'ESCALATED');
});

test('BLOCKED — real RiskType, real EvidenceConfidence, Correctability REQUIRES_INTENT_CHANGE', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ correctability: 'REQUIRES_INTENT_CHANGE' })), 'BLOCKED');
});

test('DEFERRED — each INSUFFICIENT/INFERENCE trigger individually', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'INSUFFICIENT' })), 'DEFERRED');
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ evidenceConfidence: 'INFERENCE' })), 'DEFERRED');
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ evidenceConfidence: 'INSUFFICIENT' })), 'DEFERRED');
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ correctability: 'INSUFFICIENT' })), 'DEFERRED');
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ urgency: 'INSUFFICIENT' })), 'DEFERRED');
});

test('MODIFIED — real RiskType, real EvidenceConfidence, Correctability BOUNDED_MODIFICATION', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ correctability: 'BOUNDED_MODIFICATION' })), 'MODIFIED');
});

test('UNMODIFIED — RiskType NONE, no other predicate satisfied', () => {
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ riskType: 'NONE', correctability: 'NOT_APPLICABLE' })), 'UNMODIFIED');
});

test('precedence order is respected within a single Rule: ESCALATED beats BLOCKED beats DEFERRED beats MODIFIED', () => {
  // escalationRequired + REQUIRES_INTENT_CHANGE -> ESCALATED wins, not BLOCKED
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ escalationRequired: true, correctability: 'REQUIRES_INTENT_CHANGE' })), 'ESCALATED');
  // REQUIRES_INTENT_CHANGE + evidenceConfidence INFERENCE -> DEFERRED wins, not BLOCKED (BLOCKED requires real evidence)
  assert.equal(SafetyLayer.evaluateRulePredicate(rule({ correctability: 'REQUIRES_INTENT_CHANGE', evidenceConfidence: 'INFERENCE' })), 'DEFERRED');
});

// ══════════════════════════════════════════════════════════════════
// Unit — reasonCode mapping (RCD-12.E fixed codes, RCD-14.E preserved special mappings)
// ══════════════════════════════════════════════════════════════════

test('reasonCodeForRule: UNMODIFIED -> NO_SAFETY_CONFLICT, ESCALATED -> PROFESSIONAL_SUPPORT_REQUIRED', () => {
  assert.equal(SafetyLayer.reasonCodeForRule(rule(), 'UNMODIFIED'), 'NO_SAFETY_CONFLICT');
  assert.equal(SafetyLayer.reasonCodeForRule(rule(), 'ESCALATED'), 'PROFESSIONAL_SUPPORT_REQUIRED');
});

test('reasonCodeForRule: DEFERRED -> INFERRED_SIGNAL_NOT_SUFFICIENT when caused by inference, INSUFFICIENT_SAFETY_CONTEXT otherwise', () => {
  assert.equal(SafetyLayer.reasonCodeForRule(rule({ evidenceConfidence: 'INFERENCE' }), 'DEFERRED'), 'INFERRED_SIGNAL_NOT_SUFFICIENT');
  assert.equal(SafetyLayer.reasonCodeForRule(rule({ riskType: 'INSUFFICIENT' }), 'DEFERRED'), 'INSUFFICIENT_SAFETY_CONTEXT');
});

test('reasonCodeForRule: BLOCKED/MODIFIED -> the matched RiskType literal', () => {
  assert.equal(SafetyLayer.reasonCodeForRule(rule({ riskType: 'KNOWN_ALLERGY_CONFLICT' }), 'BLOCKED'), 'KNOWN_ALLERGY_CONFLICT');
  assert.equal(SafetyLayer.reasonCodeForRule(rule({ riskType: 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT' }), 'MODIFIED'), 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT');
});

test('every reasonCode reasonCodeForRule produces, for every riskType/disposition pairing evaluateRulePredicate can actually produce, belongs to the closed RCD-11/RCD-13.A catalogue', () => {
  // UNMODIFIED/ESCALATED/DEFERRED are fixed regardless of RiskType (RCD-12.E/RCD-14.E); BLOCKED/
  // MODIFIED only ever occur (per evaluateRulePredicate's own guard) when RiskType is a real,
  // positively-matched conflict — never NONE or INSUFFICIENT, so those two are excluded here to
  // mirror the actual reachable state space, not an artificial combination the engine never produces.
  var realRiskTypes = SafetyLayer.RISK_TYPES.filter(function (rt) { return rt !== 'NONE' && rt !== 'INSUFFICIENT'; });
  ['UNMODIFIED', 'ESCALATED', 'DEFERRED'].forEach(function (d) {
    SafetyLayer.RISK_TYPES.forEach(function (rt) {
      ['INFERENCE', 'EXPLICIT_USER_STATEMENT'].forEach(function (ec) {
        var code = SafetyLayer.reasonCodeForRule(rule({ riskType: rt, evidenceConfidence: ec }), d);
        assert.ok(SafetyIntegrationPort.REASON_CODES.indexOf(code) !== -1, 'unexpected code: ' + code);
      });
    });
  });
  ['BLOCKED', 'MODIFIED'].forEach(function (d) {
    realRiskTypes.forEach(function (rt) {
      var code = SafetyLayer.reasonCodeForRule(rule({ riskType: rt }), d);
      assert.ok(SafetyIntegrationPort.REASON_CODES.indexOf(code) !== -1, 'unexpected code: ' + code);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// Integration — cross-Rule disposition precedence (RCD-14.B)
// ══════════════════════════════════════════════════════════════════

test('cross-Rule precedence: ESCALATED beats BLOCKED beats DEFERRED beats MODIFIED beats UNMODIFIED', () => {
  var order = ['ESCALATED', 'BLOCKED', 'DEFERRED', 'MODIFIED', 'UNMODIFIED'];
  var dimsFor = {
    ESCALATED: rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', urgency: 'IMMEDIATE_PROTECTIVE' }),
    BLOCKED: rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', correctability: 'REQUIRES_INTENT_CHANGE' }),
    DEFERRED: rule({ riskType: 'OUTSIDE_COACHING_SCOPE', evidenceConfidence: 'INSUFFICIENT' }),
    MODIFIED: rule({ riskType: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', correctability: 'BOUNDED_MODIFICATION' }),
    UNMODIFIED: rule({ riskType: 'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', correctability: 'NOT_APPLICABLE' })
  };
  for (var i = 0; i < order.length; i++) {
    for (var j = i + 1; j < order.length; j++) {
      var matched = [dimsFor[order[i]], dimsFor[order[j]]];
      var result = SafetyLayer.evaluateCanonicalSafetyRules(matched);
      assert.equal(result.disposition, order[i], order[i] + ' should beat ' + order[j]);
    }
  }
});

test('zero matched Rules resolves directly to UNMODIFIED/NO_SAFETY_CONFLICT/null (RCD-12.E\'s own definition, not a synthesized NONE Rule)', () => {
  assert.deepEqual(SafetyLayer.evaluateCanonicalSafetyRules([]), { disposition: 'UNMODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null });
});

// ══════════════════════════════════════════════════════════════════
// Tie-break — RCD-14.C, all four levels
// ══════════════════════════════════════════════════════════════════

test('tie-break level 2 — Urgency: more time-sensitive Rule Result wins', () => {
  var a = rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE' });
  var b = rule({ riskType: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'TIME_SENSITIVE' });
  var result = SafetyLayer.evaluateCanonicalSafetyRules([a, b]);
  assert.equal(result.disposition, 'BLOCKED');
  assert.equal(result.reasonCode, 'PERMANENT_SAFETY_COMMITMENT_CONFLICT');
  assert.deepEqual(result.reasonDetail, { secondaryReasonCodes: ['DANGEROUS_OR_EXTREME_REQUEST'] });
});

test('tie-break level 3 — EvidenceConfidence: higher D1 Evidence Hierarchy tier wins when Urgency ties', () => {
  var a = rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'TIME_SENSITIVE', evidenceConfidence: 'SINGLE_BEHAVIOUR' });
  var b = rule({ riskType: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'TIME_SENSITIVE', evidenceConfidence: 'EXPLICIT_USER_STATEMENT' });
  var result = SafetyLayer.evaluateCanonicalSafetyRules([a, b]);
  assert.equal(result.reasonCode, 'PERMANENT_SAFETY_COMMITMENT_CONFLICT');
});

test('tie-break level 4 — Canonical Safety Rule Order: lower (higher-precedence) index wins when disposition, Urgency, and EvidenceConfidence all tie', () => {
  var a = rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', correctability: 'REQUIRES_INTENT_CHANGE' });
  var b = rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', correctability: 'REQUIRES_INTENT_CHANGE' });
  var result = SafetyLayer.evaluateCanonicalSafetyRules([a, b]);
  assert.equal(result.reasonCode, 'ACTIVE_HIGH_RISK_SYMPTOM'); // index 0, ahead of DANGEROUS_OR_EXTREME_REQUEST (index 4)
});

test('a tie-break-losing Rule Result appears only in secondaryReasonCodes, never as primary; never duplicated; never equal to primary', () => {
  var a = rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', correctability: 'REQUIRES_INTENT_CHANGE' });
  var b = rule({ riskType: 'KNOWN_ALLERGY_CONFLICT', correctability: 'REQUIRES_INTENT_CHANGE' });
  var c = rule({ riskType: 'OUTSIDE_COACHING_SCOPE', correctability: 'REQUIRES_INTENT_CHANGE' });
  var result = SafetyLayer.evaluateCanonicalSafetyRules([a, b, c]);
  assert.equal(result.reasonCode, 'ACTIVE_HIGH_RISK_SYMPTOM');
  assert.deepEqual(result.reasonDetail.secondaryReasonCodes.slice().sort(), ['KNOWN_ALLERGY_CONFLICT', 'OUTSIDE_COACHING_SCOPE'].sort());
  assert.ok(result.reasonDetail.secondaryReasonCodes.indexOf(result.reasonCode) === -1);
});

test('a Rule Result supporting a lower-precedence (losing) disposition never appears inside secondaryReasonCodes', () => {
  var escalated = rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', urgency: 'IMMEDIATE_PROTECTIVE' });
  var blocked = rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', correctability: 'REQUIRES_INTENT_CHANGE' });
  var result = SafetyLayer.evaluateCanonicalSafetyRules([escalated, blocked]);
  assert.equal(result.disposition, 'ESCALATED');
  assert.equal(result.reasonDetail, null); // BLOCKED-supporting Rule is filtered out entirely, not demoted into secondaries
});

test('when every winning-disposition Rule Result collapses to the identical reasonCode (ESCALATED, or same-cause DEFERRED), reasonDetail is null, per RCD-13.F\'s no-duplicate/no-primary-as-secondary rule applied uniformly', () => {
  var e1 = rule({ riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', urgency: 'IMMEDIATE_PROTECTIVE' });
  var e2 = rule({ riskType: 'PSYCHOLOGICAL_DISTRESS_CONCERN', immediateProtectiveOrProfessionalSupportRequired: true });
  var escalatedResult = SafetyLayer.evaluateCanonicalSafetyRules([e1, e2]);
  assert.equal(escalatedResult.disposition, 'ESCALATED');
  assert.equal(escalatedResult.reasonDetail, null);

  var d1 = rule({ riskType: 'DANGEROUS_OR_EXTREME_REQUEST', evidenceConfidence: 'INFERENCE' });
  var d2 = rule({ riskType: 'OUTSIDE_COACHING_SCOPE', evidenceConfidence: 'INFERENCE' });
  var deferredResult = SafetyLayer.evaluateCanonicalSafetyRules([d1, d2]);
  assert.equal(deferredResult.disposition, 'DEFERRED');
  assert.equal(deferredResult.reasonCode, 'INFERRED_SIGNAL_NOT_SUFFICIENT');
  assert.equal(deferredResult.reasonDetail, null);
});

// ══════════════════════════════════════════════════════════════════
// Contract — disqualify()/finalReview() outputs always conform to SafetyIntegrationPort validators
// ══════════════════════════════════════════════════════════════════

test('disqualify() output always conforms to isValidDisqualificationResultArray (no matches -> not disqualified)', async () => {
  var pool = [{ opportunityProvenance: { opportunityId: 'a' } }, { opportunityProvenance: { opportunityId: 'b' } }];
  var results = await SafetyLayer.disqualify(pool, {});
  assert.equal(SafetyIntegrationPort.isValidDisqualificationResultArray(results, pool), true);
  results.forEach(function (r) { assert.equal(r.disqualified, false); assert.equal(r.reasonCode, 'NO_SAFETY_CONFLICT'); });
});

test('finalReview() output always conforms to isValidSafetyReviewResult (no matches -> UNMODIFIED)', async () => {
  var result = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, {});
  assert.equal(SafetyIntegrationPort.isValidSafetyReviewResult(result), true);
  assert.equal(result.disposition, 'UNMODIFIED');
});

test('disqualify() results are frozen (immutable) and one entry per submitted Candidate, positionally matched', async () => {
  var pool = [{ opportunityProvenance: { opportunityId: 'x' } }];
  var results = await SafetyLayer.disqualify(pool, {});
  assert.equal(results.length, 1);
  assert.deepEqual(results[0].opportunityProvenance, { opportunityId: 'x' });
  assert.ok(Object.isFrozen(results[0]));
});

test('finalReview() result is frozen (immutable)', async () => {
  var result = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, {});
  assert.ok(Object.isFrozen(result));
});

test('disqualify() only checks the four D1-AH-02 absolute-override Rule types, not the full nine — a Rule outside that subset never disqualifies at Stage 8', async () => {
  // matchCanonicalSafetyRules() always yields [] at this baseline, so this documents the filter's
  // own intent directly against selectPrimaryAndSecondary/ABSOLUTE_OVERRIDE_RISK_TYPES, since no
  // live signal exists yet to exercise the filter end-to-end (see file header Repository Gap).
  assert.equal(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('DANGEROUS_OR_EXTREME_REQUEST'), -1);
  assert.equal(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('DISORDERED_EATING_OR_BODY_IMAGE_CONCERN'), -1);
  assert.equal(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('PSYCHOLOGICAL_DISTRESS_CONCERN'), -1);
  assert.equal(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('OUTSIDE_COACHING_SCOPE'), -1);
});

// ══════════════════════════════════════════════════════════════════
// Failure — never fabricate; MODIFIED's unreachable modifiedContent path degrades honestly
// ══════════════════════════════════════════════════════════════════

test('finalReview() never returns a MODIFIED disposition with fabricated modifiedContent — honestly null, letting the caller\'s own invariant check Pipeline-Abort (unreachable at this baseline: no Rule can match to produce Correctability=BOUNDED_MODIFICATION)', async () => {
  var result = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, {});
  if (result.disposition === 'MODIFIED') {
    assert.equal(result.modifiedContent, null);
  } else {
    assert.equal(result.disposition, 'UNMODIFIED'); // the only reachable outcome given zero matched Rules
  }
});

test('disqualify()/finalReview() never throw for empty, null, or malformed pipelineContext', async () => {
  await assert.doesNotReject(SafetyLayer.disqualify([{ opportunityProvenance: {} }], null));
  await assert.doesNotReject(SafetyLayer.disqualify([{ opportunityProvenance: {} }], undefined));
  await assert.doesNotReject(SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, null));
  await assert.doesNotReject(SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, undefined));
});

test('disqualify() on an empty candidatePool returns an empty array, never fabricating an entry', async () => {
  assert.deepEqual(await SafetyLayer.disqualify([], {}), []);
});

// ══════════════════════════════════════════════════════════════════
// Regression
// ══════════════════════════════════════════════════════════════════

test('ESCALATED never carries any external-communication field — Safety Layer classifies, Expression communicates (RCD-04)', async () => {
  // Structural regression: the SafetyReviewResult shape has no field of any kind representing an
  // external contact/notification/ticket action; disposition/reasonCode/reasonDetail/reason/
  // modifiedContent is the full, exhaustive field set (RCD-13.D).
  var result = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, {});
  var allowedKeys = ['disposition', 'modifiedContent', 'reasonCode', 'reasonDetail', 'reason'];
  assert.deepEqual(Object.keys(result).sort(), allowedKeys.sort());
});

test('every reasonCode ever returned by disqualify()/finalReview() belongs to the closed catalogue (no drift)', async () => {
  var d = await SafetyLayer.disqualify([{ opportunityProvenance: {} }], {});
  var r = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION' }, {});
  assert.ok(SafetyIntegrationPort.REASON_CODES.indexOf(d[0].reasonCode) !== -1);
  assert.ok(SafetyIntegrationPort.REASON_CODES.indexOf(r.reasonCode) !== -1);
});

test('safetyLayer.js is never imported by production code outside the two SafetyIntegrationPort-conformant collaborators it is meant to serve, and never bypasses the port shape validators', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const winnerSelectionJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/winnerSelection.js'), 'utf8');
  const decisionFormationJs = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/decisionFormation.js'), 'utf8');
  // Confirms Stage 8/9 continue to be invoked only through the generic safetyPort parameter
  // (caller-supplied), never a hard-coded require of safetyLayer.js inside these two modules —
  // preserving the exact "no bypass, no hard-coded stub" shape already tested for T006.
  assert.equal(winnerSelectionJs.indexOf('safetyLayer.js'), -1);
  assert.equal(decisionFormationJs.indexOf('safetyLayer.js'), -1);
});

// ══════════════════════════════════════════════════════════════════
// CSR-001 (docs/specs/CSR_001_SPEC_v1.0.md) — matchCanonicalSafetyRules()/disqualify()/
// finalReview() integration for the one V1 Canonical Safety Rule. Matcher-internal behavior
// (tokenizer, vocabulary, sourceMemoryId join, temporal profiles) is covered exhaustively and
// separately in tests/canonicalSafetyRule.test.js — this block proves the real, unmodified
// SafetyIntegrationPort call paths (Stage 8 disqualify, Stage 9 finalReview) become behaviorally
// effective, and that the existing, unmodified Safety Decision Matrix produces the expected
// dispositions from CSR-001's own two dimension profiles.
// ══════════════════════════════════════════════════════════════════

function csrCandidate(activity, overrides) {
  return Object.assign({
    actionIdentity: activity ? { activity: activity } : undefined,
    opportunityProvenance: { opportunityId: 'opp-1' }
  }, overrides);
}
function csrPipelineContext(restrictedActivityText, statedSourceText, statedDurationText) {
  var restriction = { sourceMemoryId: 'mem-1', restrictedActivityText: restrictedActivityText };
  if (statedDurationText !== undefined) { restriction.statedDurationText = statedDurationText; }
  return {
    userSafetyContext: { items: [restriction] },
    userSafetyProvenance: { items: [{ sourceMemoryId: 'mem-1', statedSourceText: statedSourceText }] }
  };
}

// ── matchCanonicalSafetyRules() integration — N ─────────────────────────────────────────────

test('CSR1-A. matchCanonicalSafetyRules() Stage-8 call path returns a real match for a qualifying RUNNING Candidate', () => {
  const pc = csrPipelineContext('run', 'my doctor');
  const result = SafetyLayer.matchCanonicalSafetyRules(csrCandidate('RUNNING'), null, pc);
  assert.equal(result.length, 1);
  assert.equal(result[0].riskType, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

test('CSR1-B. matchCanonicalSafetyRules() returns [] for a non-RUNNING Candidate against the same restriction', () => {
  const pc = csrPipelineContext('run', 'my doctor');
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(csrCandidate('WALKING'), null, pc), []);
});

test('CSR1-C. matchCanonicalSafetyRules() Stage-9 call path (candidate null) always returns [] for this rule', () => {
  const pc = csrPipelineContext('run', 'my doctor');
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(null, { kind: 'RECOMMENDATION' }, pc), []);
});

// ── evaluateCanonicalSafetyRules() re-verification against CSR-001's own two profiles — N ──
// Dims come from the real matchCanonicalSafetyRules() output (a synthetic fixture, no duration vs.
// a stated duration) — never from a private builder — then fed into the real, unmodified Matrix
// evaluator: fixture -> matchCanonicalSafetyRules() -> real dims -> evaluateCanonicalSafetyRules().
// This proves both the matcher's own dims construction AND the existing Matrix interpretation.

test('CSR1-D. the confirmed-active dims profile (no statedDurationText) evaluates to BLOCKED under the real, unmodified Matrix evaluator', () => {
  const pc = csrPipelineContext('run', 'my doctor');
  const matched = SafetyLayer.matchCanonicalSafetyRules(csrCandidate('RUNNING'), null, pc);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].evidenceConfidence, 'EXPLICIT_USER_STATEMENT');
  const evaluation = SafetyLayer.evaluateCanonicalSafetyRules(matched);
  assert.equal(evaluation.disposition, 'BLOCKED');
  assert.equal(evaluation.reasonCode, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

test('CSR1-E. the temporally-unresolved dims profile (statedDurationText present) evaluates to DEFERRED under the real, unmodified Matrix evaluator', () => {
  const pc = csrPipelineContext('run', 'my doctor', 'for a month');
  const matched = SafetyLayer.matchCanonicalSafetyRules(csrCandidate('RUNNING'), null, pc);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].evidenceConfidence, 'INSUFFICIENT');
  const evaluation = SafetyLayer.evaluateCanonicalSafetyRules(matched);
  assert.equal(evaluation.disposition, 'DEFERRED');
  assert.equal(evaluation.reasonCode, 'INSUFFICIENT_SAFETY_CONTEXT');
});

// ── disqualify() end-to-end — O ─────────────────────────────────────────────────────────────

test('CSR1-F. disqualify() genuinely disqualifies a RUNNING Candidate against a confirmed-active medical restriction', async () => {
  const pc = csrPipelineContext('run', 'my doctor');
  const results = await SafetyLayer.disqualify([csrCandidate('RUNNING')], pc);
  assert.equal(results.length, 1);
  assert.equal(results[0].disqualified, true);
  assert.equal(results[0].reasonCode, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

test('CSR1-G. disqualify() genuinely disqualifies a RUNNING Candidate against a temporally-unresolved medical restriction — Stage 8 does not distinguish the two profiles (PD-FC-06)', async () => {
  const pc = csrPipelineContext('run', 'my doctor', 'for a month');
  const results = await SafetyLayer.disqualify([csrCandidate('RUNNING')], pc);
  assert.equal(results.length, 1);
  assert.equal(results[0].disqualified, true);
  assert.equal(results[0].reasonCode, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

test('CSR1-H. disqualify() leaves a non-RUNNING Candidate in the same pool unaffected', async () => {
  const pc = csrPipelineContext('run', 'my doctor');
  const results = await SafetyLayer.disqualify([csrCandidate('RUNNING'), csrCandidate('WALKING', { opportunityProvenance: { opportunityId: 'opp-2' } })], pc);
  assert.equal(results.length, 2);
  assert.equal(results[0].disqualified, true);
  assert.equal(results[1].disqualified, false);
  assert.equal(results[1].reasonCode, 'NO_SAFETY_CONFLICT');
});

test('CSR1-I. disqualify() does not disqualify when no qualifying restriction/provenance exists', async () => {
  const results = await SafetyLayer.disqualify([csrCandidate('RUNNING')], {});
  assert.equal(results[0].disqualified, false);
});

// ── Stage-9 boundary via finalReview() — P ──────────────────────────────────────────────────

test('CSR1-J. finalReview() never re-derives this rule regardless of Terminal Decision content — Stage 9 remains contract-compatible and unaffected', async () => {
  const pc = csrPipelineContext('run', 'my doctor');
  const result = await SafetyLayer.finalReview({ kind: 'RECOMMENDATION', options: [csrCandidate('RUNNING')] }, pc);
  assert.equal(result.disposition, 'UNMODIFIED');
  assert.equal(result.reasonCode, 'NO_SAFETY_CONFLICT');
});
