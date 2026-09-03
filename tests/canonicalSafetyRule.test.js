// CSR-001 — Canonical Safety Rule V1 + Real Matcher unit tests (docs/specs/CSR_001_SPEC_v1.0.md).
// Exercises the real, unmodified matcher EXCLUSIVELY through SafetyLayer's existing public
// canonical Safety API — matchCanonicalSafetyRules() and evaluateCanonicalSafetyRules() — using
// synthetic Candidate / pipelineContext fixtures, mirroring the repository-wide synthetic-fixture
// testing convention (tests/prioritization.test.js, tests/winnerSelection.test.js,
// tests/decisionFormation.test.js). No production internals (tokenizer, accepted-form generation,
// vocabulary constants, the rule-check function, the dimension-profile builders) are exported or
// depended upon anywhere in this file — they remain private implementation details of
// safetyLayer.js, proven only through their observable effect on the public matcher's output
// (Final Review / Implementation Correction Report, this pass — see that report for the
// _internal-removal rationale).
//
// Coverage note (disclosed, not silent): tokenize()'s own internal non-string-input fallback
// (`typeof text === 'string' ? text : ''`) is unreachable from any public call path — every caller
// (isQualifyingRunningRestrictionText / isQualifyingMedicalSourceText) already short-circuits with
// its own `typeof === 'string'` guard before ever invoking tokenize(). Test 3 below proves that
// same defensive behavior at the reachable public boundary (non-string restriction/provenance
// fields never throw and never fabricate a match) — the literal internal fallback line itself is
// no longer independently unit-tested, since no public path can ever reach it with a non-string
// argument.
//
// No LLM call anywhere in this Work Item; purely deterministic.
// Run with: node --test tests/canonicalSafetyRule.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');

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
function candidate(activity) {
  return activity === undefined ? {} : { actionIdentity: { activity: activity } };
}
var RUNNING = candidate('RUNNING');

// The sole mechanism this suite uses to prove tokenizer/vocabulary/join/boundary behavior: one
// restriction + one provenance item sharing sourceMemoryId 'mem-1', run through the real, public
// matchCanonicalSafetyRules(). Returns the real result array — never fabricated, never pulled from
// a private builder.
function matchOne(restrictedActivityText, statedSourceText, statedDurationText) {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', restrictedActivityText, statedDurationText)]),
    userSafetyProvenance: usp([provenance('mem-1', statedSourceText)])
  };
  return SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext);
}

// Expected-value literals, per SPEC §12/§13 — used ONLY as the independent expected side of an
// assertion against the real matcher's returned dims; never fed into the matcher, never a
// substitute for proving the matcher actually constructed them.
var EXPECTED_CONFIRMED_ACTIVE_DIMS = {
  riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', evidenceConfidence: 'EXPLICIT_USER_STATEMENT',
  correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE'
};
var EXPECTED_TEMPORALLY_UNRESOLVED_DIMS = {
  riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', evidenceConfidence: 'INSUFFICIENT',
  correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE'
};

// ── A. Applicability / no-match matrix (§14) ────────────────────────────────────────────────

test('1. no match: candidate is null (Stage-9 short-circuit, AD-MAI-01)', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'run')]),
    userSafetyProvenance: usp([provenance('mem-1', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(null, { options: [RUNNING] }, pipelineContext), []);
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(null, {}, pipelineContext), []);
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(null, null, pipelineContext), []);
});

test('2. no match: candidate has no actionIdentity', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'run')]),
    userSafetyProvenance: usp([provenance('mem-1', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(candidate(), null, pipelineContext), []);
});

test('3. defensive: non-string restriction/provenance fields never throw and never fabricate a match', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 42)]),
    userSafetyProvenance: usp([provenance('mem-1', null)])
  };
  assert.doesNotThrow(() => SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext));
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('4. no match: candidate.actionIdentity.activity is not RUNNING', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'run')]),
    userSafetyProvenance: usp([provenance('mem-1', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(candidate('WALKING'), null, pipelineContext), []);
});

test('5. no match: pipelineContext is absent entirely', () => {
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, undefined), []);
});

test('6. no match: userSafetyContext absent/null', () => {
  var pipelineContext = { userSafetyProvenance: usp([provenance('mem-1', 'my doctor')]) };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('7. no match: userSafetyProvenance absent/null', () => {
  var pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'run')]) };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('8. no match: userSafetyContext has no RUNNING-matching restriction', () => {
  assert.deepEqual(matchOne('swimming', 'my doctor'), []);
});

test('9. no match: userSafetyProvenance has non-medical source text', () => {
  assert.deepEqual(matchOne('run', 'my coach'), []);
});

test('10. no match: mismatched sourceMemoryId (no cross-record authorization)', () => {
  var pipelineContext = {
    userSafetyContext: usc([restriction('mem-1', 'run')]),
    userSafetyProvenance: usp([provenance('mem-2', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('11. no match: malformed userSafetyContext item (missing sourceMemoryId)', () => {
  var pipelineContext = {
    userSafetyContext: usc([{ restrictedActivityText: 'run' }]),
    userSafetyProvenance: usp([provenance('mem-1', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('12. no match: empty items arrays on both inputs', () => {
  var pipelineContext = { userSafetyContext: usc([]), userSafetyProvenance: usp([]) };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

// ── B/C. English medical-source cases ───────────────────────────────────────────────────────

test('13. positive English medical-source: doctor, physician', () => {
  assert.equal(matchOne('run', 'doctor').length, 1);
  assert.equal(matchOne('run', 'physician').length, 1);
  assert.equal(matchOne('run', 'my doctor').length, 1);
});

test('14. negative English medical-source: doctorate, Dr., specialist, coach, friend', () => {
  assert.equal(matchOne('run', 'doctorate').length, 0);
  assert.equal(matchOne('run', 'Dr. Cohen').length, 0);
  assert.equal(matchOne('run', 'specialist').length, 0);
  assert.equal(matchOne('run', 'coach').length, 0);
  assert.equal(matchOne('run', 'friend').length, 0);
});

// ── D/E. English RUNNING cases ──────────────────────────────────────────────────────────────

test('15. positive English RUNNING: run, running, jog, jogging', () => {
  ['run', 'running', 'jog', 'jogging'].forEach((t) => assert.equal(matchOne(t, 'my doctor').length, 1, t));
});

test('16. negative English RUNNING: runningmate, jogger, run2026', () => {
  assert.equal(matchOne('runningmate', 'my doctor').length, 0);
  assert.equal(matchOne('jogger', 'my doctor').length, 0);
  assert.equal(matchOne('run2026', 'my doctor').length, 0);
});

// ── F/G. Hebrew medical-source accepted forms / rejected prefixes (PD-FC-07) ────────────────

test('17. positive Hebrew medical-source: רופא and רופאה, all four accepted forms each', () => {
  ['רופא', 'הרופא', 'ורופא', 'והרופא'].forEach((t) => assert.equal(matchOne('run', t).length, 1, t));
  ['רופאה', 'הרופאה', 'ורופאה', 'והרופאה'].forEach((t) => assert.equal(matchOne('run', t).length, 1, t));
});

test('18. negative Hebrew medical-source: disallowed prefixes מ/ל/ב/כ/ש on רופא', () => {
  ['מרופא', 'לרופא', 'ברופא', 'כרופא', 'שרופא'].forEach((t) => assert.equal(matchOne('run', t).length, 0, t));
});

// ── H/I. Hebrew RUNNING accepted forms / רצה exclusion (PD-FC-07/PD-FC-05) ──────────────────

test('19. positive Hebrew RUNNING: all four accepted forms for each of the four approved tokens', () => {
  ['לרוץ', 'ריצה', 'ריצות', 'רץ'].forEach((token) => {
    ['', 'ה', 'ו', 'וה'].forEach((prefix) => {
      assert.equal(matchOne(prefix + token, 'my doctor').length, 1, prefix + token);
    });
  });
});

test('20. רצה and every prefixed form of רצה never match — explicitly excluded, as restriction text or as source text', () => {
  ['רצה', 'הרצה', 'ורצה', 'והרצה'].forEach((t) => assert.equal(matchOne(t, 'my doctor').length, 0, t));
  ['רצה', 'הרצה', 'ורצה', 'והרצה'].forEach((t) => assert.equal(matchOne('run', t).length, 0, t));
});

// ── J. Alphanumeric boundary cases (PD-FC-08) ───────────────────────────────────────────────

test('21. alphanumeric attachment must not match: doctor123, 123doctor, run2026, רופא123, 123רופא', () => {
  assert.equal(matchOne('run', 'doctor123').length, 0);
  assert.equal(matchOne('run', '123doctor').length, 0);
  assert.equal(matchOne('run2026', 'my doctor').length, 0);
  assert.equal(matchOne('run', 'רופא123').length, 0);
  assert.equal(matchOne('run', '123רופא').length, 0);
});

// ── K. Punctuation / whitespace boundaries (tokenizer splitting proof) ─────────────────────

test('22. punctuation- and whitespace-adjacent forms still match: doctor., (doctor), "doctor", multi-word text, רופא,, (הרופא)', () => {
  assert.equal(matchOne('run', 'doctor.').length, 1);
  assert.equal(matchOne('run', '(doctor)').length, 1);
  assert.equal(matchOne('run', '"doctor"').length, 1);
  assert.equal(matchOne('run', 'רופא,').length, 1);
  assert.equal(matchOne('run', '(הרופא)').length, 1);
  // multi-token text, qualifying token embedded among non-qualifying ones either side —
  // proves split-based tokenization, not a whole-string/prefix/substring check.
  assert.equal(matchOne('I was told not to run.', 'my doctor said so').length, 1);
});

// ── PD-USP-02 canonical example, end to end through the real public matcher ────────────────

test('23. the canonical PD-USP-02 example matches end-to-end: "my doctor" + "run", same sourceMemoryId', () => {
  var result = matchOne('run', 'my doctor');
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
});

test('24. the Hebrew canonical example matches end-to-end: הרופא שלי + לרוץ', () => {
  var result = matchOne('לרוץ', 'הרופא שלי');
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
});

// ── L. sourceMemoryId join — explicit cross-record non-authorization proof ─────────────────

test('25. two separate records (one restriction-only, one provenance-only for an unrelated restriction) never combine', () => {
  var pipelineContext = {
    userSafetyContext: usc([
      restriction('mem-1', 'run'),               // no provenance for mem-1
      restriction('mem-2', 'swimming')            // provenance exists for mem-2, but wrong activity
    ]),
    userSafetyProvenance: usp([provenance('mem-2', 'my doctor')])
  };
  assert.deepEqual(SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext), []);
});

test('26. a genuinely qualifying record among decoys still matches, decoys are ignored', () => {
  var pipelineContext = {
    userSafetyContext: usc([
      restriction('mem-1', 'run'),                 // no matching provenance
      restriction('mem-2', 'run', undefined)        // qualifies
    ]),
    userSafetyProvenance: usp([
      provenance('mem-2', 'my physician'),
      provenance('mem-3', 'my doctor')              // unrelated restriction, unused
    ])
  };
  var result = SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
});

// ── M. Temporal profiles — real matcher output fed into the real, unmodified Matrix evaluator ──

test('27. no statedDurationText -> confirmed-active dimensions -> BLOCKED under the real Matrix', () => {
  var result = matchOne('run', 'my doctor');
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
  assert.equal(result[0].evidenceConfidence, 'EXPLICIT_USER_STATEMENT');
  var evaluation = SafetyLayer.evaluateCanonicalSafetyRules(result);
  assert.equal(evaluation.disposition, 'BLOCKED');
});

test('28. any statedDurationText -> temporally-unresolved dimensions -> DEFERRED under the real Matrix, multiple duration phrasings, no date parsing', () => {
  ['for a month', 'until September 15', 'for a while', 'for two weeks'].forEach((duration) => {
    var result = matchOne('run', 'my doctor', duration);
    assert.equal(result.length, 1, duration);
    assert.deepEqual(result[0], EXPECTED_TEMPORALLY_UNRESOLVED_DIMS, duration);
    assert.equal(result[0].evidenceConfidence, 'INSUFFICIENT', duration);
    var evaluation = SafetyLayer.evaluateCanonicalSafetyRules(result);
    assert.equal(evaluation.disposition, 'DEFERRED', duration);
  });
});

test('29. multiple qualifying sourceMemoryId pairs for one Candidate each produce their own real dims tuple', () => {
  var pipelineContext = {
    userSafetyContext: usc([
      restriction('mem-1', 'run'),
      restriction('mem-2', 'running', 'for a month')
    ]),
    userSafetyProvenance: usp([
      provenance('mem-1', 'my doctor'),
      provenance('mem-2', 'my physician')
    ])
  };
  var result = SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pipelineContext);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], EXPECTED_CONFIRMED_ACTIVE_DIMS);
  assert.deepEqual(result[1], EXPECTED_TEMPORALLY_UNRESOLVED_DIMS);
});

// ── Public output shape — no fields beyond the closed dims-tuple contract ──────────────────

test('30. matched dims objects contain exactly {riskType, evidenceConfidence, correctability, urgency}, no extra fields', () => {
  var result = matchOne('run', 'my doctor');
  assert.deepEqual(Object.keys(result[0]).sort(), ['correctability', 'evidenceConfidence', 'riskType', 'urgency']);
});
