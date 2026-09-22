// WP0 Phase D.4 — Canonical Safety Rule for Governed Risk Characteristics tests
// (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §12/§13/§14, Revision 2,
// Product+Architecture APPROVED).
// Exercises the real, unmodified SafetyLayer module directly — pure, synchronous, no AI call.
// Run with: node --test tests/wp0PhaseD4GovernedRiskCharacteristicRule.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
const RiskCharacteristicValidator = require('../js/coachDecisionSystem/riskCharacteristicValidator.js');

function tag(overrides) {
  return Object.assign({
    domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE',
    relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',
    severity: 'LIFE_CRITICAL',
    evidenceSource: 'DURABLE_GOVERNED_USER_FACT',
    anchorText: 'peanut allergy'
  }, overrides || {});
}
function noKnownConflictTag(overrides) {
  return Object.assign({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }, overrides || {});
}
function candidateWith(tags) { return { riskCharacteristicTags: tags }; }

// ── §12 — evidenceConfidenceForTag() ──────────────────────────────────────────────────────────

test('evidenceConfidenceForTag: AI_CANDIDATE_CHARACTERIZATION maps to INFERENCE, everything else to EXPLICIT_USER_STATEMENT', () => {
  assert.equal(SafetyLayer.evidenceConfidenceForTag({ evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION' }), 'INFERENCE');
  assert.equal(SafetyLayer.evidenceConfidenceForTag({ evidenceSource: 'CURRENT_TURN_USER_STATEMENT' }), 'EXPLICIT_USER_STATEMENT');
  assert.equal(SafetyLayer.evidenceConfidenceForTag({ evidenceSource: 'DURABLE_GOVERNED_USER_FACT' }), 'EXPLICIT_USER_STATEMENT');
});

// ── §12 mapping table — every approved row, verified end to end through evaluateRulePredicate() ─

test('ROW 1 — PHYSICAL_EXERTION_OR_MOVEMENT + LIFE_CRITICAL + ACUTE_STATE_INDICATED_THIS_TURN => ACTIVE_HIGH_RISK_SYMPTOM, IMMEDIATE_PROTECTIVE => ESCALATED (existing branch, no new predicate)', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'LIFE_CRITICAL', relation: 'ACUTE_STATE_INDICATED_THIS_TURN', evidenceSource: 'CURRENT_TURN_USER_STATEMENT' }), {});
  assert.deepEqual(dims, { riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', evidenceConfidence: 'EXPLICIT_USER_STATEMENT', correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'IMMEDIATE_PROTECTIVE' });
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'ESCALATED');
});

test('ROW 2 — PHYSICAL_EXERTION_OR_MOVEMENT + PROHIBITIVE + DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT => SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT (never ACTIVE_MEDICAL_INSTRUCTION_CONFLICT — no medical-source-provenance signal available to this Rule), REQUIRES_INTENT_CHANGE (no safeAlternative) => BLOCKED', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  assert.equal(dims.riskType, 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT');
  assert.equal(dims.correctability, 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'BLOCKED');
  // This Rule never produces ACTIVE_MEDICAL_INSTRUCTION_CONFLICT for any input — that RiskType
  // remains exclusively reachable through the existing, provenance-joined Rules.
  ['LIFE_CRITICAL', 'PROHIBITIVE', 'ADVISORY', 'REQUIRES_PROFESSIONAL_JUDGMENT'].forEach((sev) => {
    ['DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', 'ACUTE_STATE_INDICATED_THIS_TURN', 'UNRESOLVED_RELEVANCE'].forEach((rel) => {
      const d = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: sev, relation: rel }), {});
      assert.notEqual(d.riskType, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', sev + '/' + rel + ' must never produce ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
    });
  });
});

test('ROW 2b — the same row, but the candidate carries a safeAlternative — CORRECTED (Product/Architecture authority correction, this round): bare presence is NEVER sufficient; correctability stays REQUIRES_INTENT_CHANGE => BLOCKED, exactly as if no safeAlternative existed', () => {
  const candidate = { riskCharacteristicTags: [], safeAlternative: { action: 'a gentler alternative' } };
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), candidate);
  assert.equal(dims.correctability, 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'BLOCKED');
});

test('ROW 3 — INGESTION_OR_SUBSTANCE_EXPOSURE + LIFE_CRITICAL/PROHIBITIVE + DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT => KNOWN_ALLERGY_CONFLICT => BLOCKED (and an ABSOLUTE_OVERRIDE_RISK_TYPE, Stage 8 eligible)', () => {
  ['LIFE_CRITICAL', 'PROHIBITIVE'].forEach((sev) => {
    const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: sev, relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
    assert.equal(dims.riskType, 'KNOWN_ALLERGY_CONFLICT');
    assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'BLOCKED');
    assert.ok(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('KNOWN_ALLERGY_CONFLICT') !== -1);
  });
});

test('ROW 4 — EATING_PATTERN_OR_BODY_IMAGE + PROHIBITIVE/ADVISORY + DIRECT_CONFLICT.../ACUTE_STATE... => DISORDERED_EATING_OR_BODY_IMAGE_CONCERN => BLOCKED, always — CORRECTED: a safeAlternative no longer produces MODIFIED merely from its presence', () => {
  const dims1 = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'EATING_PATTERN_OR_BODY_IMAGE', severity: 'PROHIBITIVE', relation: 'ACUTE_STATE_INDICATED_THIS_TURN' }), {});
  assert.equal(dims1.riskType, 'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims1), 'BLOCKED');

  const dims2 = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'EATING_PATTERN_OR_BODY_IMAGE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), { safeAlternative: {} });
  assert.equal(dims2.correctability, 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims2), 'BLOCKED');
});

test('ROW 5 — PSYCHOLOGICAL_OR_EMOTIONAL_STATE + REQUIRES_PROFESSIONAL_JUDGMENT + ACUTE_STATE_INDICATED_THIS_TURN => PSYCHOLOGICAL_DISTRESS_CONCERN + immediateProtectiveOrProfessionalSupportRequired:true => ESCALATED (existing branch, no new predicate)', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'REQUIRES_PROFESSIONAL_JUDGMENT', relation: 'ACUTE_STATE_INDICATED_THIS_TURN' }), {});
  assert.equal(dims.riskType, 'PSYCHOLOGICAL_DISTRESS_CONCERN');
  assert.equal(dims.immediateProtectiveOrProfessionalSupportRequired, true);
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'ESCALATED');
});

test('ROW 6 — PSYCHOLOGICAL_OR_EMOTIONAL_STATE + ADVISORY => PSYCHOLOGICAL_DISTRESS_CONCERN — CORRECTED: the approved table\'s own unconditional BOUNDED_MODIFICATION phrasing is now routed through the same safe-alternative gate as every other BOUNDED_MODIFICATION-eligible row (MODIFIED content has to come from somewhere, and safeAlternative is the only content source §14 names) => REQUIRES_INTENT_CHANGE => BLOCKED, with or without a safeAlternative present', () => {
  const withoutAlt = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  assert.equal(withoutAlt.riskType, 'PSYCHOLOGICAL_DISTRESS_CONCERN');
  assert.equal(withoutAlt.correctability, 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.evaluateRulePredicate(withoutAlt), 'BLOCKED');

  const withAlt = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), { safeAlternative: { action: 'a gentler approach' } });
  assert.equal(withAlt.correctability, 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.evaluateRulePredicate(withAlt), 'BLOCKED');
});

test('ROW 7 — STANDING_OR_IRREVERSIBLE_COMMITMENT + LIFE_CRITICAL => PERMANENT_SAFETY_COMMITMENT_CONFLICT => BLOCKED (and an ABSOLUTE_OVERRIDE_RISK_TYPE)', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'STANDING_OR_IRREVERSIBLE_COMMITMENT', severity: 'LIFE_CRITICAL', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  assert.equal(dims.riskType, 'PERMANENT_SAFETY_COMMITMENT_CONFLICT');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'BLOCKED');
  assert.ok(SafetyLayer.ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf('PERMANENT_SAFETY_COMMITMENT_CONFLICT') !== -1);
});

test('ROW 8 — MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED + REQUIRES_PROFESSIONAL_JUDGMENT => OUTSIDE_COACHING_SCOPE + outsideCoachingAuthorityRequiringProfessionalSupport:true => ESCALATED (existing branch, no new predicate)', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED', severity: 'REQUIRES_PROFESSIONAL_JUDGMENT', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  assert.equal(dims.riskType, 'OUTSIDE_COACHING_SCOPE');
  assert.equal(dims.outsideCoachingAuthorityRequiringProfessionalSupport, true);
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'ESCALATED');
});

test('ROW 9 — EXTREME_OR_UNBOUNDED_INTENSITY + PROHIBITIVE/LIFE_CRITICAL: EXPLICIT_USER_STATEMENT path => BLOCKED; AI_CANDIDATE_CHARACTERIZATION path => DEFERRED, never BLOCKED from inference alone (§12.1)', () => {
  const explicit = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'EXTREME_OR_UNBOUNDED_INTENSITY', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', evidenceSource: 'CURRENT_TURN_USER_STATEMENT' }), {});
  assert.equal(SafetyLayer.evaluateRulePredicate(explicit), 'BLOCKED');

  const inferred = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'EXTREME_OR_UNBOUNDED_INTENSITY', severity: 'LIFE_CRITICAL', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION' }), {});
  assert.equal(inferred.evidenceConfidence, 'INFERENCE');
  assert.equal(SafetyLayer.evaluateRulePredicate(inferred), 'DEFERRED');
});

test('ROW 10 — relation=UNRESOLVED_RELEVANCE, for ANY domain/severity, always resolves to INSUFFICIENT => DEFERRED, checked before any row match (never accidentally satisfies a row that does not constrain relation, e.g. PSYCHOLOGICAL_OR_EMOTIONAL_STATE/ADVISORY)', () => {
  const dims1 = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'UNRESOLVED_RELEVANCE', evidenceSource: 'CURRENT_TURN_USER_STATEMENT' }), {});
  assert.deepEqual(dims1, { riskType: 'INSUFFICIENT', evidenceConfidence: 'INSUFFICIENT', correctability: 'INSUFFICIENT', urgency: 'INSUFFICIENT' });
  assert.equal(SafetyLayer.evaluateRulePredicate(dims1), 'DEFERRED');

  const dims2 = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ relation: 'UNRESOLVED_RELEVANCE', evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION' }), {});
  assert.equal(dims2.evidenceConfidence, 'INFERENCE'); // §12's own stated exception
  assert.equal(SafetyLayer.evaluateRulePredicate(dims2), 'DEFERRED');
});

test('ROW 11 (unlisted combination) — a domain/severity/relation combination outside the approved §12 table falls to the same conservative INSUFFICIENT default, never silently invented, never UNMODIFIED', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'STANDING_OR_IRREVERSIBLE_COMMITMENT', severity: 'ADVISORY', relation: 'ACUTE_STATE_INDICATED_THIS_TURN' }), {});
  assert.equal(dims.riskType, 'INSUFFICIENT');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'DEFERRED');
});

// ── matchGovernedRiskCharacteristicRule() — the full Rule function ──────────────────────────

test('an absent/missing riskCharacteristicTags field produces zero matched dims — no candidate anywhere in production carries this field yet (D.6 not built)', () => {
  assert.deepEqual(SafetyLayer.matchGovernedRiskCharacteristicRule({}, {}), []);
  assert.deepEqual(SafetyLayer.matchGovernedRiskCharacteristicRule(null, {}), []);
  assert.deepEqual(SafetyLayer.matchGovernedRiskCharacteristicRule({ riskCharacteristicTags: undefined }, {}), []);
});

test('an empty riskCharacteristicTags array produces zero matched dims', () => {
  assert.deepEqual(SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWith([]), {}), []);
});

test('a NO_KNOWN_CONFLICT tag produces no dims tuple — the honest, common case (§12)', () => {
  assert.deepEqual(SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWith([noKnownConflictTag()]), {}), []);
});

test('a valid, risk-relevant tag produces exactly one mapped dims tuple', () => {
  const candidate = candidateWith([tag()]);
  const result = SafetyLayer.matchGovernedRiskCharacteristicRule(candidate, {});
  assert.equal(result.length, 1);
  assert.equal(result[0].riskType, 'KNOWN_ALLERGY_CONFLICT');
});

test('multiple tags across domains all contribute independently — no cross-tag interference', () => {
  const candidate = candidateWith([
    tag({ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    noKnownConflictTag()
  ]);
  const result = SafetyLayer.matchGovernedRiskCharacteristicRule(candidate, {});
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((d) => d.riskType).sort(), ['KNOWN_ALLERGY_CONFLICT', 'PSYCHOLOGICAL_DISTRESS_CONCERN']);
});

test('a malformed tag actually present in the array is never silently dropped — it reports INSUFFICIENT for that entry (binding requirement 4)', () => {
  const malformed = { domain: 'NOT_A_REAL_DOMAIN', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity: 'LIFE_CRITICAL', evidenceSource: 'CURRENT_TURN_USER_STATEMENT', anchorText: 'x' };
  const result = SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWith([malformed]), {});
  assert.equal(result.length, 1);
  assert.equal(result[0].riskType, 'INSUFFICIENT');
  assert.equal(SafetyLayer.evaluateRulePredicate(result[0]), 'DEFERRED');
});

test('a null/non-object entry in the tags array is also treated as malformed => INSUFFICIENT, never dropped, never thrown', () => {
  const result = SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWith([null, 'not-an-object', 42]), {});
  assert.equal(result.length, 3);
  result.forEach((d) => assert.equal(d.riskType, 'INSUFFICIENT'));
});

test('the malformed-tag shape check reuses RiskCharacteristicValidator (Phase D.1) unchanged — a genuinely valid tag round-trips through it correctly', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(tag()), true);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape({ domain: 'X' }), false);
});

// ── Round-2 invariant (binding requirement 9): declaration cannot disable runtime authority ────

test('the Rule never reads any capability-declaration field at all — riskCharacteristicDimensions is never referenced anywhere in this Rule\'s own code, structurally proving it cannot gate execution', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'safetyLayer.js'), 'utf8');
  const ruleStart = src.indexOf('function matchGovernedRiskCharacteristicRule');
  const ruleEnd = src.indexOf('\n  }', ruleStart);
  const ruleBody = src.slice(ruleStart, ruleEnd);
  assert.equal(/riskCharacteristicDimensions|CapabilityRegistry/.test(ruleBody), false);
});

test('the Rule produces identical output regardless of what a stand-in "declaring capability" claims — a candidate carrying a (non-consulted) capabilityDeclaration field with riskCharacteristicDimensions:[] still gets its tags fully processed', () => {
  const candidateWithDeclaration = Object.assign({ capabilityDeclaration: { safetyRequirements: { riskCharacteristicDimensions: [] } } }, candidateWith([tag()]));
  const candidateWithoutDeclaration = candidateWith([tag()]);
  assert.deepEqual(
    SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWithDeclaration, {}),
    SafetyLayer.matchGovernedRiskCharacteristicRule(candidateWithoutDeclaration, {})
  );
});

test('the Rule is present, unconditionally, in CANONICAL_SAFETY_RULES — reachable via matchCanonicalSafetyRules() for every Candidate, not opt-in per capability', () => {
  const candidate = candidateWith([tag()]);
  const result = SafetyLayer.matchCanonicalSafetyRules(candidate, null, {});
  assert.ok(result.some((d) => d.riskType === 'KNOWN_ALLERGY_CONFLICT'));
});

// ── ESCALATED — reuses the existing escalation architecture, no parallel mechanism (binding requirement 8) ──

test('ESCALATED dispositions from this Rule are reachable end to end through the existing, unmodified evaluateCanonicalSafetyRules()', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain: 'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED', severity: 'REQUIRES_PROFESSIONAL_JUDGMENT', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  const evaluation = SafetyLayer.evaluateCanonicalSafetyRules([dims]);
  assert.equal(evaluation.disposition, 'ESCALATED');
  assert.equal(evaluation.reasonCode, 'PROFESSIONAL_SUPPORT_REQUIRED'); // the existing, fixed RCD-14.E mapping — no new reasonCode
});

test('no new predicate branch was added to evaluateRulePredicate() — every ESCALATED path this Rule reaches is one of the three pre-existing branches', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'safetyLayer.js'), 'utf8');
  const fnStart = src.indexOf('function evaluateRulePredicate');
  const fnEnd = src.indexOf('\n  }', fnStart);
  const body = src.slice(fnStart, fnEnd);
  const escalatedChecks = (body.match(/return 'ESCALATED'/g) || []).length;
  assert.equal(escalatedChecks, 4); // dims.escalationRequired, ACTIVE_HIGH_RISK_SYMPTOM+IMMEDIATE_PROTECTIVE, PSYCHOLOGICAL_DISTRESS_CONCERN+immediateProtective..., outsideCoachingAuthority... — unchanged from before this phase
});

// ── MODIFIED / safeAlternative — Phase D.4's authority correction PRESERVED, Phase D.6 closes the
//    extension point it deliberately left open: bare presence/self-certification of a
//    model-proposed safeAlternative is STILL never sufficient to authorize BOUNDED_MODIFICATION —
//    every test below that exercises the ungoverned case is UNCHANGED from D.4 (same assertions,
//    same protection). What changed: genuinely independently-derived evidence
//    (candidate.safeAlternativeCharacterization, produced only by
//    internalPipelineOrchestrator.js's own re-characterization step, never settable by the
//    proposing capability) now CAN authorize it — tests 4/5/6 below are extended, not weakened, to
//    also prove the newly-reachable governed path.

test('1. bare safeAlternative PRESENCE (with no independently-derived safeAlternativeCharacterization) cannot authorize BOUNDED_MODIFICATION — every row that used to be gated on presence alone still always resolves to REQUIRES_INTENT_CHANGE, with a safeAlternative present or not', () => {
  const rows = [
    { domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' },
    { domain: 'EATING_PATTERN_OR_BODY_IMAGE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' },
    { domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }
  ];
  rows.forEach((row) => {
    const withoutAlt = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag(row), {});
    const withAlt = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag(row), { safeAlternative: { action: 'a proposed alternative' } });
    assert.equal(withoutAlt.correctability, 'REQUIRES_INTENT_CHANGE', JSON.stringify(row) + ' without safeAlternative');
    assert.equal(withAlt.correctability, 'REQUIRES_INTENT_CHANGE', JSON.stringify(row) + ' with safeAlternative present but uncharacterized');
    assert.equal(SafetyLayer.evaluateRulePredicate(withAlt), 'BLOCKED', JSON.stringify(row) + ' must resolve BLOCKED, never MODIFIED, without governed evidence');
  });
});

test('2. AI/model output cannot SELF-CERTIFY its own alternative as safe — a safeAlternative object that itself CLAIMS to be verified/safe/cleared is treated identically to any other proposal, because this Rule never inspects .safeAlternative\'s own content at all, only the SEPARATE, independently-derived .safeAlternativeCharacterization field, which a self-certifying claim never populates', () => {
  const selfCertifyingClaims = [
    { verified: true, safe: true, action: 'do this instead' },
    { riskCharacterization: { relation: 'NO_KNOWN_CONFLICT' } }, // a fabricated, self-asserted "clearance"
    { safeAlternativeVerified: true },
    { __proto__: null, verified: true } // even an unusual shape claiming verification
  ];
  selfCertifyingClaims.forEach((claim) => {
    const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
      tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
      { safeAlternative: claim }
    );
    assert.equal(dims.correctability, 'REQUIRES_INTENT_CHANGE', 'a self-certifying claim must never be trusted: ' + JSON.stringify(claim));
  });
});

test('3. absent verified alternative evidence follows the conservative REQUIRES_INTENT_CHANGE/BLOCKED path — the governed default when no independently-derived evidence exists', () => {
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }), {});
  assert.equal(dims.correctability, 'REQUIRES_INTENT_CHANGE');
});

test('4. MODIFIED is unreachable from ungoverned safeAlternative content — no combination of domain/severity/relation/bare-safeAlternative content can produce correctability=BOUNDED_MODIFICATION without a matching, independently-derived safeAlternativeCharacterization entry', () => {
  const domains = RiskCharacteristicValidator.RISK_DOMAINS;
  const severities = RiskCharacteristicValidator.CONSTRAINT_SEVERITY;
  const relations = ['DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', 'ACUTE_STATE_INDICATED_THIS_TURN', 'UNRESOLVED_RELEVANCE'];
  const alternatives = [undefined, null, {}, { verified: true }, { action: 'x', riskCharacterization: { relation: 'NO_KNOWN_CONFLICT' } }];
  domains.forEach((domain) => {
    severities.forEach((severity) => {
      relations.forEach((relation) => {
        alternatives.forEach((safeAlternative) => {
          const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(tag({ domain, severity, relation }), { safeAlternative });
          assert.notEqual(dims.correctability, 'BOUNDED_MODIFICATION');
          assert.notEqual(SafetyLayer.evaluateRulePredicate(dims), 'MODIFIED');
        });
      });
    });
  });
});

test('4b (WP0 Phase D.6, new). MODIFIED IS reachable once genuinely independently-derived evidence clears the SAME domain — a safeAlternativeCharacterization entry with relation=NO_KNOWN_CONFLICT for the matching domain authorizes BOUNDED_MODIFICATION; a mismatched domain, or one still showing UNRESOLVED_RELEVANCE, does not', () => {
  const cleared = { domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null };
  const clearedDims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    { safeAlternativeCharacterization: [cleared] });
  assert.equal(clearedDims.correctability, 'BOUNDED_MODIFICATION');
  assert.equal(SafetyLayer.evaluateRulePredicate(clearedDims), 'MODIFIED');

  const wrongDomain = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null };
  const wrongDomainDims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    { safeAlternativeCharacterization: [wrongDomain] });
  assert.equal(wrongDomainDims.correctability, 'REQUIRES_INTENT_CHANGE', 'a clearance for a DIFFERENT domain must never authorize this one');

  const stillUnresolved = { domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'UNRESOLVED_RELEVANCE', severity: 'ADVISORY', evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: 'x' };
  const stillUnresolvedDims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    { safeAlternativeCharacterization: [stillUnresolved] });
  assert.equal(stillUnresolvedDims.correctability, 'REQUIRES_INTENT_CHANGE', 'the alternative itself still showing a domain-level conflict must never authorize MODIFIED');

  // A shape-invalid (e.g. failure-sentinel) entry is never trusted as clearance either.
  const sentinelDims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    tag({ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' }),
    { safeAlternativeCharacterization: [{ evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION' }] });
  assert.equal(sentinelDims.correctability, 'REQUIRES_INTENT_CHANGE');
});

test('5. finalReview() cannot reach MODIFIED via bare safeAlternative — disposition resolves BLOCKED, and modifiedContent remains honestly null, exactly as before Phase D.6', async () => {
  const candidate = { riskCharacteristicTags: [tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' })], safeAlternative: { action: 'try this instead', verified: true } };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'BLOCKED');
  assert.equal(result.modifiedContent, null);
});

test('5b (WP0 Phase D.6, new). finalReview() DOES reach MODIFIED, with modifiedContent sourced from candidate.safeAlternative.action, once governed evidence clears the matching domain', async () => {
  const candidate = {
    riskCharacteristicTags: [tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' })],
    safeAlternative: { action: 'try a gentler approach instead', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' },
    safeAlternativeCharacterization: [{ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }]
  };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'MODIFIED');
  assert.deepEqual(result.modifiedContent, { action: 'try a gentler approach instead' });
});

test('5c (WP0 Phase D.6, new). finalReview() never fabricates modifiedContent when the winning MODIFIED tuple\'s own candidate carries no usable safeAlternative.action, even if disposition still resolves MODIFIED by construction', async () => {
  // Constructed directly (not via a real pipeline) to exercise finalReview()'s own defensive
  // honest-null path — a real orchestrator never produces safeAlternativeCharacterization without
  // an accompanying safeAlternative (attachSafetyCharacterization() always sets both together).
  const candidate = {
    riskCharacteristicTags: [tag({ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', severity: 'ADVISORY', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' })],
    safeAlternativeCharacterization: [{ domain: 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }]
  };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'MODIFIED');
  assert.equal(result.modifiedContent, null, 'never fabricate content — the ABORTED path this feeds into (decisionFormation.js) is the correct, honest failure mode here');
});

test('6. governedCorrectabilityWithSafeAlternativeGate is REQUIRES_INTENT_CHANGE for every ungoverned input shape (no safeAlternativeCharacterization, or one that does not clear the given domain), and BOUNDED_MODIFICATION only for a genuinely matching, shape-valid, NO_KNOWN_CONFLICT entry', () => {
  const domain = 'PHYSICAL_EXERTION_OR_MOVEMENT';
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate({ safeAlternative: { anything: 'at all, even garbage' } }, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate({ safeAlternative: null }, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate({}, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate(null, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate(undefined, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate({ safeAlternativeCharacterization: 'not-an-array' }, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate({ safeAlternativeCharacterization: [] }, domain), 'REQUIRES_INTENT_CHANGE');
  assert.equal(SafetyLayer.governedCorrectabilityWithSafeAlternativeGate(
    { safeAlternativeCharacterization: [{ domain: domain, relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }] }, domain
  ), 'BOUNDED_MODIFICATION');
});

// ── TRR outcome equivalence — proved by construction, not merely by test observation ─────────

test('riskCharacteristicTags is never set anywhere in production Candidate-construction code outside the WP0 Phase D.1-D.6 modules themselves — structurally confirms the ONLY production writer is internalPipelineOrchestrator.js\'s own D.6 characterization step (tests/wp0PhaseD6CandidateSafetyThreading.test.js proves that writer\'s own behavior directly)', () => {
  const jsDir = path.join(__dirname, '..', 'js');
  const exemptFiles = ['riskCharacteristicValidator.js', 'riskCharacteristicInterpreter.js', 'riskCharacteristicIntakeGate.js', 'standardProposalContract.js', 'generalReasoningCapability.js', 'safetyLayer.js', 'internalPipelineOrchestrator.js', 'initiativeEngine.js'];
  function walk(dir) {
    let matches = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) matches = matches.concat(walk(full));
      else if (entry.name.endsWith('.js') && exemptFiles.indexOf(entry.name) === -1) {
        const src = fs.readFileSync(full, 'utf8');
        if (/riskCharacteristicTags/.test(src)) matches.push(full);
      }
    });
    return matches;
  }
  assert.deepEqual(walk(jsDir), []);
});

test('safeAlternative is never set anywhere in production Candidate-construction code outside the WP0 Phase D.6-authorized writers — the same structural guarantee for the MODIFIED content-sourcing gate, narrowed to exactly the files this phase authorized to touch it', () => {
  const jsDir = path.join(__dirname, '..', 'js');
  const exemptFiles = ['safetyLayer.js', 'standardProposalContract.js', 'generalReasoningCapability.js', 'internalPipelineOrchestrator.js', 'initiativeEngine.js'];
  function walk(dir) {
    let matches = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) matches = matches.concat(walk(full));
      else if (entry.name.endsWith('.js') && exemptFiles.indexOf(entry.name) === -1) {
        const src = fs.readFileSync(full, 'utf8');
        if (/safeAlternative/.test(src)) matches.push(full);
      }
    });
    return matches;
  }
  assert.deepEqual(walk(jsDir), []);
});

test('TRR golden-master: a real, exact TRR RUNNING Candidate shape (actionIdentity/actionCategory, no riskCharacteristicTags) run through matchCanonicalSafetyRules() produces IDENTICAL results with and without the new Rule present in CANONICAL_SAFETY_RULES — the new Rule contributes exactly zero entries', () => {
  const trrCandidate = { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' } };
  const pipelineContext = {
    userSafetyContext: { items: [{ sourceMemoryId: 'm1', restrictedActivityText: 'running', statedDurationText: null }] },
    userSafetyProvenance: { items: [{ sourceMemoryId: 'm1', statedSourceText: 'doctor' }] }
  };
  const withRule = SafetyLayer.matchCanonicalSafetyRules(trrCandidate, null, pipelineContext);
  const fromGovernedRuleOnly = SafetyLayer.matchGovernedRiskCharacteristicRule(trrCandidate, pipelineContext);
  assert.deepEqual(fromGovernedRuleOnly, []);
  // The only matched dims for this TRR candidate come from matchRunningMedicalRestrictionRule —
  // exactly one, ACTIVE_MEDICAL_INSTRUCTION_CONFLICT, unaffected by the new Rule's presence.
  assert.equal(withRule.length, 1);
  assert.equal(withRule[0].riskType, 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT');
});

// ── No new enums introduced (binding requirement 5) ──────────────────────────────────────────

test('every riskType this Rule can ever produce is already a member of the closed, pre-existing RISK_TYPES enum', () => {
  const producedRiskTypes = [
    'ACTIVE_HIGH_RISK_SYMPTOM', 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'KNOWN_ALLERGY_CONFLICT',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PSYCHOLOGICAL_DISTRESS_CONCERN', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT',
    'OUTSIDE_COACHING_SCOPE', 'DANGEROUS_OR_EXTREME_REQUEST', 'INSUFFICIENT'
  ];
  producedRiskTypes.forEach((rt) => assert.ok(SafetyLayer.RISK_TYPES.indexOf(rt) !== -1, rt + ' must be a pre-existing RISK_TYPES member'));
  assert.equal(SafetyLayer.RISK_TYPES.length, 11); // unchanged
  assert.equal(SafetyLayer.EVIDENCE_CONFIDENCE.length, 6); // unchanged
  assert.equal(SafetyLayer.CORRECTABILITY.length, 4); // unchanged
  assert.equal(SafetyLayer.URGENCY.length, 4); // unchanged
});
