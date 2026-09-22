// WP0 Phase D.3 — Risk Characteristic Intake Gate unit tests (docs/specs/WP0_SAFETY_RISK_
// CHARACTERISTIC_SUBSPEC_v1.0.md §10.2/§15, Revision 2, Product+Architecture APPROVED).
// Exercises the real, unmodified module directly. RiskCharacteristicInterpreter (the real,
// existing, closed module) is stubbed via its own configure({callClaude}) seam — never mocked/
// replaced — exactly mirroring preferenceIntakeGate.test.js/safetyDisclosureIntakeGate.test.js's
// own established convention and this gate's own production reuse.
//
// AUTHORITY CORRECTION (Product/Architecture review) — this file was rewritten after an earlier
// design used a SECOND, independent classifyTurnForDurableConstraint() call as "deterministic
// corroboration," which Product/Architecture ruled insufficient: "agreement between two AI calls
// does not transform an inference into an explicit user-stated fact." That mechanism has been
// removed from riskCharacteristicIntakeGate.js entirely (see that file's own header for the full
// correction). The tests below instead prove the corrected invariant: `severity` is accepted only
// as a structural shape discriminator and is NEVER copied into the authorized candidateRecord —
// the only durable content this gate ever authorizes is the literal, independently re-verified
// `literalStatementText` plus its coarse `domain` tag.
// Run with: node --test tests/riskCharacteristicIntakeGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Gate = require('../js/coachDecisionSystem/riskCharacteristicIntakeGate.js');
const RiskCharacteristicInterpreter = require('../js/coachDecisionSystem/riskCharacteristicInterpreter.js');

function configureStub(handler) { RiskCharacteristicInterpreter.configure({ callClaude: handler }); }

test.afterEach(() => { RiskCharacteristicInterpreter.configure({ callClaude: null, timeoutMs: undefined }); });

var VALID_TURN = { turnId: 't1', text: 'I have a peanut allergy and need to know what to order' };
var VALID_CANDIDATE = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'peanut allergy' };

// ── authorizeNewFact() ─────────────────────────────────────────────────────────────────────

test('1. a well-formed, grounded, consented candidate is authorized as NEW_FACT — no AI call is made at all (no interpreter configured, proving authorization never depends on any classifier availability)', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: null }); // deliberately unavailable — must not matter
  const result = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: VALID_CANDIDATE, memoryConsent: { granted: true } });
  assert.equal(result.authorized, true);
  assert.equal(result.reason, 'OK');
});

test('2. the authorized candidateRecord NEVER contains a severity field — the durable factual proposition is the literal text + domain only, never an AI-proposed danger/severity rating (the core authority correction)', async () => {
  const result = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: VALID_CANDIDATE, memoryConsent: { granted: true } });
  assert.deepEqual(result.candidateRecord, {
    mode: 'NEW_FACT', domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE',
    literalStatementText: 'peanut allergy', sourceTurnId: 't1', evidenceSource: 'CURRENT_TURN_USER_STATEMENT'
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.candidateRecord, 'severity'), false);
});

test('3. this holds regardless of which severity value the interpreter proposed — LIFE_CRITICAL, ADVISORY, or anything else in vocabulary, none of it ever reaches the candidateRecord', async () => {
  const severities = ['ADVISORY', 'PROHIBITIVE', 'LIFE_CRITICAL', 'REQUIRES_PROFESSIONAL_JUDGMENT'];
  for (const severity of severities) {
    const candidate = Object.assign({}, VALID_CANDIDATE, { severity: severity });
    const result = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: candidate, memoryConsent: { granted: true } });
    assert.equal(result.authorized, true, severity + ' should still authorize');
    assert.equal(Object.prototype.hasOwnProperty.call(result.candidateRecord, 'severity'), false, severity + ' must not leak into the record');
  }
});

test('4. INVALID_TURN on a missing/malformed turn', async () => {
  const r1 = await Gate.authorizeNewFact({ turn: {}, candidate: VALID_CANDIDATE, memoryConsent: { granted: true } });
  assert.equal(r1.authorized, false);
  assert.equal(r1.reason, 'INVALID_TURN');
  const r2 = await Gate.authorizeNewFact({ turn: { turnId: 't1', text: '' }, candidate: VALID_CANDIDATE, memoryConsent: { granted: true } });
  assert.equal(r2.reason, 'INVALID_TURN');
});

test('5. INVALID_CANDIDATE_SHAPE on an out-of-vocabulary domain or severity — severity is still checked for vocabulary membership as a shape discriminator, even though its value is never persisted', async () => {
  const badDomain = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: Object.assign({}, VALID_CANDIDATE, { domain: 'NOT_REAL' }), memoryConsent: { granted: true } });
  assert.equal(badDomain.reason, 'INVALID_CANDIDATE_SHAPE');
  const badSeverity = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: Object.assign({}, VALID_CANDIDATE, { severity: 'NOT_REAL' }), memoryConsent: { granted: true } });
  assert.equal(badSeverity.reason, 'INVALID_CANDIDATE_SHAPE');
});

test('6. INVALID_CANDIDATE_SHAPE on a classifyCandidateContent()-shaped {domain,anchorText} pair with NO severity — the structural boundary keeping candidate-content characterization out of durable capture (binding requirements 7/8, §15)', async () => {
  const candidateContentShaped = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', anchorText: 'peanut allergy' }; // no severity field
  const result = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: candidateContentShaped, memoryConsent: { granted: true } });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'INVALID_CANDIDATE_SHAPE');
});

test('7. LITERAL_ANCHOR_FAILED on a fabricated anchorText not actually present in the turn text — never trusts the caller\'s claim', async () => {
  const fabricated = Object.assign({}, VALID_CANDIDATE, { anchorText: 'shellfish allergy' });
  const result = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: fabricated, memoryConsent: { granted: true } });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'LITERAL_ANCHOR_FAILED');
});

test('8. CONSENT_ABSENT when memoryConsent.granted is not exactly true', async () => {
  const r1 = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: VALID_CANDIDATE, memoryConsent: { granted: false } });
  assert.equal(r1.reason, 'CONSENT_ABSENT');
  const r2 = await Gate.authorizeNewFact({ turn: VALID_TURN, candidate: VALID_CANDIDATE, memoryConsent: null });
  assert.equal(r2.reason, 'CONSENT_ABSENT');
});

test('9. two distinct facts sharing the same domain can BOTH be independently authorized (no domain-level collapsing at the gate)', async () => {
  const peanut = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'peanut allergy' };
  const shellfish = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'shellfish allergy' };
  const turn = { turnId: 't1', text: 'I have a peanut allergy and a shellfish allergy' };
  const r1 = await Gate.authorizeNewFact({ turn: turn, candidate: peanut, memoryConsent: { granted: true } });
  const r2 = await Gate.authorizeNewFact({ turn: turn, candidate: shellfish, memoryConsent: { granted: true } });
  assert.equal(r1.authorized, true);
  assert.equal(r2.authorized, true);
  assert.notEqual(r1.candidateRecord.literalStatementText, r2.candidateRecord.literalStatementText);
});

// ── The worked examples from Product/Architecture's own correction ─────────────────────────
// These illustrate the corrected invariant precisely: the gate's OWN literal-anchor check can
// only ever validate that a TEXT SPAN is genuine — it structurally strips severity so that even
// if a hypothetical upstream classifier over-infers ("peanuts don't sit well with me" =>
// LIFE_CRITICAL), the durable record can never carry that fabricated severity/diagnosis claim,
// only the user's own literal words. (Whether the interpreter's own prompt discipline should have
// proposed such a candidate at all remains that module's unchanged, existing responsibility —
// this gate's own job is to guarantee that IF it did, no diagnosis-shaped claim survives into
// durable memory.)

test('10. "I am allergic to peanuts" (explicit, literal) is authorized and stores exactly the literal text, no severity', async () => {
  const turn = { turnId: 't1', text: 'I am allergic to peanuts' };
  const candidate = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'I am allergic to peanuts' };
  const result = await Gate.authorizeNewFact({ turn: turn, candidate: candidate, memoryConsent: { granted: true } });
  assert.equal(result.authorized, true);
  assert.deepEqual(result.candidateRecord, {
    mode: 'NEW_FACT', domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE',
    literalStatementText: 'i am allergic to peanuts', sourceTurnId: 't1', evidenceSource: 'CURRENT_TURN_USER_STATEMENT'
  });
});

test('11. even if a candidate for "Peanuts don\'t sit well with me" carries an inflated LIFE_CRITICAL severity, the durable record never stores that severity — only the user\'s own literal words survive, never labeled as an allergy or any diagnosis', async () => {
  const turn = { turnId: 't1', text: 'Peanuts don\'t sit well with me' };
  const overInferredCandidate = { domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'LIFE_CRITICAL', anchorText: 'Peanuts don\'t sit well with me' };
  const result = await Gate.authorizeNewFact({ turn: turn, candidate: overInferredCandidate, memoryConsent: { granted: true } });
  // The literal text IS genuinely grounded, so shape/anchor checks pass — but critically:
  assert.equal(Object.prototype.hasOwnProperty.call(result.candidateRecord, 'severity'), false);
  assert.equal(result.candidateRecord.literalStatementText, 'peanuts don\'t sit well with me');
  assert.equal(/allerg/i.test(JSON.stringify(result.candidateRecord)), false, 'no diagnosis word may appear anywhere in the stored record');
});

test('12. "I have a permanent restriction from running because of my knee" (explicit, literal) is authorized, storing the literal restriction statement verbatim', async () => {
  const turn = { turnId: 't1', text: 'I have a permanent restriction from running because of my knee' };
  const candidate = { domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', severity: 'PROHIBITIVE', anchorText: 'I have a permanent restriction from running because of my knee' };
  const result = await Gate.authorizeNewFact({ turn: turn, candidate: candidate, memoryConsent: { granted: true } });
  assert.equal(result.authorized, true);
  assert.equal(result.candidateRecord.literalStatementText, 'i have a permanent restriction from running because of my knee');
  assert.equal(Object.prototype.hasOwnProperty.call(result.candidateRecord, 'severity'), false);
});

// ── authorizeCorrection() ──────────────────────────────────────────────────────────────────

var EXISTING_FACT = { memoryId: 'risk_char_abc', literalStatementText: 'peanut allergy' };

function correctionStub(confirmed) {
  configureStub(async (body) => {
    const idMatch = body.messages[0].content.match(/<statement id="([^"]+)"/);
    assert.match(body.messages[0].content, /peanut allergy/); // buildCorrectionPrompt embeds the existing fact text
    return { content: [{ text: JSON.stringify({ results: [{ id: idMatch[1], correctionConfirmed: confirmed }] }) }] };
  });
}

test('13. an explicit, unambiguous correction is authorized (CORRECTION mode)', async () => {
  correctionStub(true);
  const result = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: EXISTING_FACT, memoryConsent: { granted: true } });
  assert.equal(result.authorized, true);
  assert.deepEqual(result.candidateRecord, { mode: 'CORRECTION', memoryId: 'risk_char_abc', sourceTurnId: 't1' });
});

test('14. an ambiguous/non-explicit statement is NOT_CAPTURE_ELIGIBLE — the existing fact is preserved', async () => {
  correctionStub(false);
  const result = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: EXISTING_FACT, memoryConsent: { granted: true } });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'NOT_CAPTURE_ELIGIBLE');
});

test('15. CONSENT_ABSENT on a correction attempt without consent', async () => {
  correctionStub(true);
  const result = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: EXISTING_FACT, memoryConsent: { granted: false } });
  assert.equal(result.reason, 'CONSENT_ABSENT');
});

test('16. INVALID_EXISTING_FACT on a malformed existingFact', async () => {
  correctionStub(true);
  const r1 = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: {}, memoryConsent: { granted: true } });
  assert.equal(r1.reason, 'INVALID_EXISTING_FACT');
  const r2 = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: { memoryId: 'x' }, memoryConsent: { granted: true } });
  assert.equal(r2.reason, 'INVALID_EXISTING_FACT');
});

test('17. SAFETY_CLASSIFIER_UNAVAILABLE on a failed/unavailable correction classification — fails closed, preserving the existing fact', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: null });
  const result = await Gate.authorizeCorrection({ turn: VALID_TURN, existingFact: EXISTING_FACT, memoryConsent: { granted: true } });
  assert.equal(result.authorized, false);
  assert.equal(result.reason, 'SAFETY_CLASSIFIER_UNAVAILABLE');
});

test('18. INVALID_TURN on a malformed turn for a correction attempt', async () => {
  correctionStub(true);
  const result = await Gate.authorizeCorrection({ turn: {}, existingFact: EXISTING_FACT, memoryConsent: { granted: true } });
  assert.equal(result.reason, 'INVALID_TURN');
});

// ── Structural/independence proofs ────────────────────────────────────────────────────────

test('19. this gate never CALLS Firestore/db/FitMeMemory — authorization only, never persistence (mirrors preferenceIntakeGate.js/safetyDisclosureIntakeGate.js\'s own boundary exactly; the header\'s own prose disclosing this boundary by name is expected and excluded from this check)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'riskCharacteristicIntakeGate.js'), 'utf8');
  assert.equal(/\bFitMeMemory\./.test(src), false);
  assert.equal(/\.collection\(|\.doc\(|db\.collection/.test(src), false);
});

test('20. this gate never imports, requires, or CALLS SafetyContextInterpreter/safetyContextInterpreter.js — USC-001 is not broadened or reopened (Product decision 3, binding requirement 11)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'riskCharacteristicIntakeGate.js'), 'utf8');
  assert.equal(/require\(['"].*safetyContextInterpreter\.js['"]\)/.test(src), false);
  assert.equal(/\bSafetyContextInterpreter\./.test(src), false);
});

test('21. this gate never imports, requires, or CALLS safetyDisclosureIntakeGate.js, and never writes/compares against the safety_disclosure type in actual code — structurally independent additive gate for a NEW type only (§15; the header\'s own prose disclosing this boundary by name, including the quoted type name, is expected and excluded from this check)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'riskCharacteristicIntakeGate.js'), 'utf8');
  assert.equal(/require\(['"].*safetyDisclosureIntakeGate\.js['"]\)/.test(src), false);
  assert.equal(/\bSafetyDisclosureIntakeGate\./.test(src), false);
  assert.equal(/type\s*[:=]\s*['"]safety_disclosure['"]/.test(src), false);
});

test('22. this gate is not CALLED from any live routing/orchestration seam (conversationalNeedCreator.js, internalPipelineOrchestrator.js, memoryLayer.js, app.js) — Phase D.3 is gate+interpreter-addition only, zero pipeline wiring; a disclosure comment merely naming this file is expected and excluded from this check', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const seams = [
    path.join('coachDecisionSystem', 'conversationalNeedCreator.js'),
    path.join('coachDecisionSystem', 'internalPipelineOrchestrator.js'),
    path.join('coachDecisionSystem', 'memoryLayer.js'),
    'app.js'
  ];
  seams.forEach((rel) => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', rel), 'utf8');
    assert.equal(/\bRiskCharacteristicIntakeGate\./.test(src), false, rel + ' must not yet call RiskCharacteristicIntakeGate');
  });
});

test('23. no production file anywhere in js/ requires riskCharacteristicIntakeGate.js yet (zero callers)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const jsDir = path.join(__dirname, '..', 'js');
  function walk(dir) {
    let matches = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) matches = matches.concat(walk(full));
      else if (entry.name.endsWith('.js') && entry.name !== 'riskCharacteristicIntakeGate.js') {
        const src = fs.readFileSync(full, 'utf8');
        if (/require\(['"].*riskCharacteristicIntakeGate\.js['"]\)/.test(src)) matches.push(full);
      }
    });
    return matches;
  }
  assert.deepEqual(walk(jsDir), []);
});

test('24. the corroboration mechanism removed by this correction is gone from the module surface — no _internal.corroborateCandidate export, no NOT_INDEPENDENTLY_CORROBORATED reason code anywhere in the file', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'riskCharacteristicIntakeGate.js'), 'utf8');
  assert.equal(/corroborateCandidate/.test(src), false);
  assert.equal(/NOT_INDEPENDENTLY_CORROBORATED/.test(src), false);
});
