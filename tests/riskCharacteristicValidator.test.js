// WP0 Phase D.1 — Risk Characteristic Validator tests (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_
// SUBSPEC_v1.0.md §08/§10, Revision 2, Product+Architecture APPROVED).
// Run with: node --test tests/riskCharacteristicValidator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RiskCharacteristicValidator = require('../js/coachDecisionSystem/riskCharacteristicValidator.js');

function noKnownConflictTag(overrides) {
  return Object.assign({
    domain: 'PHYSICAL_EXERTION_OR_MOVEMENT',
    relation: 'NO_KNOWN_CONFLICT',
    severity: null,
    evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION',
    anchorText: null
  }, overrides || {});
}

function realTag(overrides) {
  return Object.assign({
    domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE',
    relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',
    severity: 'LIFE_CRITICAL',
    evidenceSource: 'DURABLE_GOVERNED_USER_FACT',
    anchorText: 'peanut allergy'
  }, overrides || {});
}

// ── §08 — closed taxonomy, exact values ──────────────────────────────────────

test('RISK_DOMAINS is the exact, exhaustive, frozen 7-value closed taxonomy (§08.1)', () => {
  assert.deepEqual(RiskCharacteristicValidator.RISK_DOMAINS, [
    'PHYSICAL_EXERTION_OR_MOVEMENT',
    'INGESTION_OR_SUBSTANCE_EXPOSURE',
    'EATING_PATTERN_OR_BODY_IMAGE',
    'PSYCHOLOGICAL_OR_EMOTIONAL_STATE',
    'STANDING_OR_IRREVERSIBLE_COMMITMENT',
    'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED',
    'EXTREME_OR_UNBOUNDED_INTENSITY'
  ]);
  assert.ok(Object.isFrozen(RiskCharacteristicValidator.RISK_DOMAINS));
});

test('RISK_RELATION_KINDS is the exact, exhaustive, frozen 4-value closed taxonomy (§08.2)', () => {
  assert.deepEqual(RiskCharacteristicValidator.RISK_RELATION_KINDS, [
    'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',
    'ACUTE_STATE_INDICATED_THIS_TURN',
    'UNRESOLVED_RELEVANCE',
    'NO_KNOWN_CONFLICT'
  ]);
  assert.ok(Object.isFrozen(RiskCharacteristicValidator.RISK_RELATION_KINDS));
});

test('CONSTRAINT_SEVERITY is the exact, exhaustive, frozen 4-value closed taxonomy (§08.3)', () => {
  assert.deepEqual(RiskCharacteristicValidator.CONSTRAINT_SEVERITY, [
    'ADVISORY', 'PROHIBITIVE', 'LIFE_CRITICAL', 'REQUIRES_PROFESSIONAL_JUDGMENT'
  ]);
  assert.ok(Object.isFrozen(RiskCharacteristicValidator.CONSTRAINT_SEVERITY));
});

test('EVIDENCE_SOURCES is the exact, exhaustive, frozen 3-value closed taxonomy (§08.4)', () => {
  assert.deepEqual(RiskCharacteristicValidator.EVIDENCE_SOURCES, [
    'DURABLE_GOVERNED_USER_FACT', 'CURRENT_TURN_USER_STATEMENT', 'AI_CANDIDATE_CHARACTERIZATION'
  ]);
  assert.ok(Object.isFrozen(RiskCharacteristicValidator.EVIDENCE_SOURCES));
});

test('ANCHOR_TEXT_MAX_CHARS matches the codebase-wide 80-char literal-anchor convention', () => {
  assert.equal(RiskCharacteristicValidator.ANCHOR_TEXT_MAX_CHARS, 80);
});

// ── isValidRiskCharacteristicTagShape() — §10.1 ──────────────────────────────

test('rejects a non-object tag', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(null), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape('x'), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape([]), false);
});

test('rejects an out-of-vocabulary domain/relation/evidenceSource', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ domain: 'NOT_REAL' })), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ relation: 'NOT_REAL' })), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ evidenceSource: 'NOT_REAL' })), false);
});

test('NO_KNOWN_CONFLICT: valid only with anchorText===null and severity null/undefined (the honest, common, no-dims-tuple case per §12)', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag()), true);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ severity: undefined })), true);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ anchorText: 'something' })), false); // §08: anchorText null ONLY when NO_KNOWN_CONFLICT — must actually be null here
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noKnownConflictTag({ severity: 'ADVISORY' })), false); // no dims tuple produced for NO_KNOWN_CONFLICT — severity carries no meaning
});

test('non-NO_KNOWN_CONFLICT relations: severity required, in-vocabulary; anchorText required, non-empty, non-null, bounded', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag()), true);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ severity: null })), false); // missing severity
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ severity: 'NOT_REAL' })), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ anchorText: null })), false); // missing anchor
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ anchorText: '' })), false);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ anchorText: 'x'.repeat(81) })), false); // exceeds the 80-char bound
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ anchorText: 'x'.repeat(80) })), true); // exactly at the bound
});

test('all 4 RISK_RELATION_KINDS round-trip correctly through the shape validator with an otherwise-valid tag', () => {
  RiskCharacteristicValidator.RISK_RELATION_KINDS.forEach((relation) => {
    const tag = relation === 'NO_KNOWN_CONFLICT' ? noKnownConflictTag({ relation: relation }) : realTag({ relation: relation });
    assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(tag), true, relation + ' should round-trip');
  });
});

test('all 7 RISK_DOMAINS and all 3 EVIDENCE_SOURCES round-trip correctly (governance-shape genericity — no domain-specific code path exists)', () => {
  RiskCharacteristicValidator.RISK_DOMAINS.forEach((domain) => {
    assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ domain: domain })), true, domain + ' should round-trip');
  });
  RiskCharacteristicValidator.EVIDENCE_SOURCES.forEach((evidenceSource) => {
    assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(realTag({ evidenceSource: evidenceSource })), true, evidenceSource + ' should round-trip');
  });
});

// ── isLiteralAnchorValid() — independent re-verification, §10.1 ─────────────

test('NO_KNOWN_CONFLICT tags trivially pass anchor verification (nothing to anchor)', () => {
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(noKnownConflictTag(), 'any source text at all'), true);
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(noKnownConflictTag(), ''), true);
});

test('accepts a literal, case-insensitive, whitespace-trimmed substring match (mirrors preferenceIntakeGate.js\'s own isLiteralSubstringOf() exactly)', () => {
  const tag = realTag({ anchorText: 'Peanut Allergy' });
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(tag, 'I have a PEANUT ALLERGY and need to know if this is safe'), true);
});

test('rejects a fabricated anchorText not actually present in the source text — never trusts the interpreter\'s own claim', () => {
  const tag = realTag({ anchorText: 'shellfish allergy' });
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(tag, 'I have a peanut allergy'), false);
});

test('rejects a non-object tag for anchor verification', () => {
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(null, 'x'), false);
});

// ── isValidRiskCharacteristicTag() — combined §10.1 contract ────────────────

test('isValidRiskCharacteristicTag combines shape + anchor verification: both must pass', () => {
  const validTag = realTag({ anchorText: 'peanut allergy' });
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTag(validTag, 'I have a peanut allergy'), true);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTag(validTag, 'no mention of any allergen here'), false); // shape OK, anchor fails
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTag(realTag({ severity: 'NOT_REAL' }), 'peanut allergy'), false); // shape fails
});

// ── Open-world proof (mirrors WP0 Phase C's own "קרלינג"/curling precedent) ──

test('a genuinely novel, never-enumerated activity concept is correctly validated by domain alone, with zero code added for that concept', () => {
  const noveltyTag = realTag({
    domain: 'PHYSICAL_EXERTION_OR_MOVEMENT',
    relation: 'ACUTE_STATE_INDICATED_THIS_TURN',
    severity: 'ADVISORY',
    evidenceSource: 'CURRENT_TURN_USER_STATEMENT',
    anchorText: 'קרלינג'
  });
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(noveltyTag), true);
  assert.equal(RiskCharacteristicValidator.isLiteralAnchorValid(noveltyTag, 'אני רוצה לנסות קרלינג היום'), true);
});

// ── Phase D.1 scope-purity structural proof: zero pipeline wiring ───────────

test('riskCharacteristicValidator.js is not referenced from any live routing/orchestration seam (Phase D.1 is taxonomy+validator only, zero pipeline wiring per §22)', () => {
  const seams = [
    'conversationalNeedCreator.js',
    'internalPipelineOrchestrator.js',
    'memoryLayer.js',
    'app.js'
  ];
  seams.forEach((fileName) => {
    const filePath = path.join(__dirname, '..', 'js', fileName === 'app.js' ? 'app.js' : path.join('coachDecisionSystem', fileName));
    const src = fs.readFileSync(filePath, 'utf8');
    assert.equal(/riskCharacteristicValidator|RiskCharacteristicValidator/.test(src), false, fileName + ' must not yet reference RiskCharacteristicValidator');
  });
});

test('only standardProposalContract.js (Phase D.1), riskCharacteristicInterpreter.js (Phase D.2), and riskCharacteristicIntakeGate.js (Phase D.3, added as its own legitimate closed-vocabulary consumer for shape validation) require riskCharacteristicValidator.js — no other production file does', () => {
  const jsDir = path.join(__dirname, '..', 'js');
  function walk(dir) {
    let matches = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) matches = matches.concat(walk(full));
      else if (entry.name.endsWith('.js') && entry.name !== 'riskCharacteristicValidator.js') {
        const src = fs.readFileSync(full, 'utf8');
        if (/require\(['"]\.\/?riskCharacteristicValidator\.js['"]\)/.test(src) || /require\(['"].*riskCharacteristicValidator\.js['"]\)/.test(src)) {
          matches.push(full);
        }
      }
    });
    return matches;
  }
  const requirers = walk(jsDir).map((p) => path.basename(p)).sort();
  assert.deepEqual(requirers, ['riskCharacteristicIntakeGate.js', 'riskCharacteristicInterpreter.js', 'standardProposalContract.js']);
});
