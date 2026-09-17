// DUC-001 — Conversational Need Creator unit tests (docs/specs/DUC_001_SPEC_v1.0.md §06/§09/§12a).
// Exercises the real, unmodified module directly against synthetic TurnUnderstanding shapes
// (turnUnderstandingInterpreter.js's own output contract) — no live model, no orchestrator.
// Run with: node --test tests/conversationalNeedCreator.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NeedCreator = require('../js/coachDecisionSystem/conversationalNeedCreator.js');

// WP0 Phase B (docs/specs/WP0_SPEC_v1.0.md §16) — resolveProfessionalCapability() now routes
// through CapabilityRegistry.resolveCapability() instead of a hardcoded equality check.
// Production registers TRR exactly once at bootstrap (app.js, mirroring
// RegisterCoachDecisionSystem.registerAll()'s own established pattern); this test file mirrors
// that same one-time registration so the module under test sees the identical registered
// capability set it will see in production. This is test-harness setup only — no existing
// assertion below is altered.
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
test.before(() => { TrrCapabilityAdapter.registerAll(); });

function turn(turnId) { return { turnId: turnId, text: 'x', submittedAt: 1000, sessionGeneration: 1 }; }
function pipelineContext(assembledAt) { return { assembledAt: assembledAt !== undefined ? assembledAt : 5000 }; }

function classified(overrides) {
  return Object.assign({
    interpretationStatus: 'CLASSIFIED',
    affirmativeRequest: { present: false, domain: null, topic: null },
    currentStateStatement: { present: false, text: null },
    negativeControlPresent: false,
    desireOnlyPresent: false
  }, overrides || {});
}
function failed() {
  return {
    interpretationStatus: 'FAILED',
    affirmativeRequest: { present: false, domain: null, topic: null },
    currentStateStatement: { present: false, text: null },
    negativeControlPresent: false,
    desireOnlyPresent: false
  };
}

// ── §17 Case A / Case C — no Need is ever recognized ────────────────────────────────────────

test('1. §17 Case A — a CLASSIFIED turn with no affirmative request never produces a Need (returns null)', () => {
  const result = NeedCreator.recognizeDirectUserNeed(turn('t1'), classified(), pipelineContext());
  assert.equal(result, null);
});

test('2. §17 Case C — a FAILED interpretation never produces a Need (returns null), never treated as a genuine no-request turn', () => {
  const result = NeedCreator.recognizeDirectUserNeed(turn('t1'), failed(), pipelineContext());
  assert.equal(result, null);
});

test('3. desireOnlyPresent alone (no affirmativeRequest) never produces a Need — Step A never gates on it', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ desireOnlyPresent: true }),
    pipelineContext()
  );
  assert.equal(result, null);
});

test('4. a structurally invalid turn (missing turnId) never produces a Need', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    { text: 'x' },
    classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } }),
    pipelineContext()
  );
  assert.equal(result, null);
});

// ── §06 Step A — domain-agnostic Need recognition (Blocker 2) ──────────────────────────────

test('5. Step A recognizes a real Need even when domain/topic are unresolved (null/null) — admission never gated on vocabulary match', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: null, topic: null } }),
    pipelineContext()
  );
  assert.notEqual(result, null);
  assert.equal(result.kind, 'UNSUPPORTED');
  assert.equal(result.need.needRef, 'duc:direct-user-request:t1');
  assert.equal(result.need.turnId, 't1');
  assert.equal(result.need.domain, null);
  assert.equal(result.need.topic, null);
});

test('6. Step A recognizes a real Need for a NUTRITION-tagged request (a domain the closed vocabulary knows, but TRR does not own) — routes to UNSUPPORTED at Step B, never fails to recognize the Need itself (Blocker 3 proof)', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE' } }),
    pipelineContext()
  );
  assert.equal(result.kind, 'UNSUPPORTED');
  assert.equal(result.need.domain, 'NUTRITION');
  assert.equal(result.need.topic, 'PROTEIN_INTAKE');
});

test('7. need.recognizedAt is taken from pipelineContext.assembledAt', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: null, topic: null } }),
    pipelineContext(9999)
  );
  assert.equal(result.need.recognizedAt, 9999);
});

// ── §06 Step B / §09 — the one deterministic equality check (TRR-supported path) ───────────

test('8. Step B returns a real DETECTED_OPPORTUNITY for {WORKOUT, WORKOUT_FREQUENCY}', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } }),
    pipelineContext()
  );
  assert.equal(result.kind, 'DETECTED_OPPORTUNITY');
  const o = result.opportunity;
  assert.equal(o.id, 'duc:direct-user-request:t1');
  assert.equal(o.sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(o.detectingContributor, 'CONVERSATIONAL_NEED_CREATOR');
  assert.equal(o.turnId, 't1');
  assert.equal(o.proposedAction, '__DUC_PENDING_REASONING__');
  assert.equal(o.domain, 'WORKOUT');
  assert.equal(o.topic, 'WORKOUT_FREQUENCY');
  assert.equal(o.validReasonCategory, 'ADAPT_TO_CURRENT_STATE');
  assert.equal(o.safetyHighRiskBypass, false);
  assert.equal(o.confidence, 1); // mechanically required by initiativeEngine.js's own validateRequest()
  assert.deepEqual(o.valueDimensions, ['DECISION_QUALITY']); // mechanically required by initiativeEngine.js's own validateRequest() (D1-IP-03)
  assert.deepEqual(o.trustTestSignal.glad, null);
  assert.ok(typeof o.trustTestSignal.basis === 'string' && o.trustTestSignal.basis.length > 0);
});

test('9. Step B never fabricates trustTestSignal.glad as true — admission flows through the Bounded Engagement Policy, not a fabricated Trust source (§08)', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } }),
    pipelineContext()
  );
  assert.equal(result.opportunity.trustTestSignal.glad, null);
});

// ── §09 — proof against the "nutrition accidentally reaches TRR" failure mode (Blocker 3) ──

test('10. "כמה חלבון נשאר לי היום?" (NUTRITION/PROTEIN_INTAKE) never reaches DETECTED_OPPORTUNITY — resolves UNSUPPORTED', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE' } }),
    pipelineContext()
  );
  assert.equal(result.kind, 'UNSUPPORTED');
});

test('11. an unresolved (null/null) domain/topic also resolves UNSUPPORTED, never accidentally matched to TRR', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: null, topic: null } }),
    pipelineContext()
  );
  assert.equal(result.kind, 'UNSUPPORTED');
});

test('12. only the exact {WORKOUT, WORKOUT_FREQUENCY} pair matches — a near-miss (WORKOUT/SEQUENCE_BEHAVIOR) resolves UNSUPPORTED', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'SEQUENCE_BEHAVIOR' } }),
    pipelineContext()
  );
  assert.equal(result.kind, 'UNSUPPORTED');
});

// ── §12a — negative control never suppresses Need recognition (Blocker 6, frozen) ──────────

test('13. negativeControlPresent:true alongside affirmativeRequest.present:true still recognizes a real Need — EUR-001 machinery is independent, never reinterpreted here', () => {
  const result = NeedCreator.recognizeDirectUserNeed(
    turn('t1'),
    classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }, negativeControlPresent: true }),
    pipelineContext()
  );
  assert.equal(result.kind, 'DETECTED_OPPORTUNITY');
  assert.equal(result.opportunity.domain, 'WORKOUT');
});

// ── Determinism ──────────────────────────────────────────────────────────────────────────

test('14. an identical (turn, turnUnderstanding, pipelineContext) input reaches the same result on every call', () => {
  const tu = classified({ affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' } });
  const r1 = NeedCreator.recognizeDirectUserNeed(turn('t1'), tu, pipelineContext());
  const r2 = NeedCreator.recognizeDirectUserNeed(turn('t1'), tu, pipelineContext());
  assert.deepEqual(r1, r2);
});
