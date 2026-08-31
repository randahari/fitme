// G-2 (docs/specs/G2_SPEC_v1.0.md §19-21) — Contextual Meaning Policy tests.
// Dependency-free: Node's built-in test runner + assert only, exercising the real
// js/coachDecisionSystem/contextualMeaningPolicy.js module directly — a pure, stateless module,
// no configure()/mock dependencies required.
// Run with: node --test tests/contextualMeaningPolicy.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ContextualMeaningPolicy = require('../js/coachDecisionSystem/contextualMeaningPolicy.js');

function makeObservation(overrides) {
  return Object.assign({
    id: 'HABIT:nutrition:log-consistency',
    sourceType: 'HABIT',
    domain: 'NUTRITION',
    topic: 'FOOD_LOGGING',
    lifecycle: 'WEAKENING',
    confidence: 0.55,
    evidence: { count: 4 },
    temporal: { firstObservedAt: '2026-01-31', lastObservedAt: '2026-05-01', expectedIntervalDays: 9 },
    provenance: { currentEpisodeEstablished: true, currentEpisodeEstablishedAt: '2026-01-31' }
  }, overrides);
}

// ══════════════════════════════════════════════════════════════════
// §19-20 — computeContextualMeaning
// ══════════════════════════════════════════════════════════════════

test('1. V1 Habit FOOD_LOGGING WEAKENING resolves alignment UNKNOWN, trajectory WORSENING', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  assert.equal(cm.alignment, 'UNKNOWN');
  assert.equal(cm.trajectory, 'WORSENING');
});

test('2. basis.priorEstablishmentBasis cites provenance.currentEpisodeEstablished === true, explicitly independent of statusOf()\'s branch ordering', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  assert.equal(typeof cm.basis.priorEstablishmentBasis, 'string');
  assert.ok(cm.basis.priorEstablishmentBasis.includes('provenance.currentEpisodeEstablished === true'));
  assert.ok(cm.basis.priorEstablishmentBasis.toLowerCase().includes('branch ordering alone'), 'must explicitly disclaim reliance on statusOf() branch order');
});

test('3. basis.priorEstablishmentBasis is null when the real establishment fact is absent (never fabricated for a matching-shape signal)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(
    makeObservation({ provenance: { currentEpisodeEstablished: false, currentEpisodeEstablishedAt: null } }), {}
  );
  assert.equal(cm.basis.priorEstablishmentBasis, null);
});

test('4. basis.contextConsulted is NOT_CONSULTED for all three categories for the V1 rule when no Situational Context is available (no Goal comparison performed; CSSC-001 §12 additive extension)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  assert.deepEqual(cm.basis.contextConsulted, { goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED', situationalContext: 'NOT_CONSULTED' });
  assert.equal(cm.basis.situationalContextBackground, null);
});

// ══════════════════════════════════════════════════════════════════
// CSSC-001 (docs/specs/CSSC_001_SPEC_v1.0.md §12) — non-causal Situational Context consultation
// ══════════════════════════════════════════════════════════════════

test('4a. basis.contextConsulted.situationalContext is CONSULTED and basis.situationalContextBackground carries the exact classified items when Pipeline Context provides them', () => {
  const pipelineContext = {
    situationalContext: { items: [
      { semanticClass: 'CURRENT_STATE_CONSTRAINT', inputCategory: 'SITUATIONAL_CONTEXT', interpretationAuthority: 'DERIVED_INTERPRETATION', classificationConfidence: 'SUFFICIENTLY_CONFIDENT', sourceMemoryId: 'mem-1', statementText: 'אני עובד בלילות עכשיו' }
    ] }
  };
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), pipelineContext);
  assert.equal(cm.basis.contextConsulted.situationalContext, 'CONSULTED');
  assert.deepEqual(cm.basis.situationalContextBackground, { items: [{ statementText: 'אני עובד בלילות עכשיו', sourceMemoryId: 'mem-1' }] });
});

test('4b. Situational Context consultation never changes Alignment/Trajectory/priorEstablishmentBasis — identical with or without it (CSSC-001 §13, non-causal guarantee)', () => {
  const withoutContext = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  const withContext = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {
    situationalContext: { items: [{ sourceMemoryId: 'mem-1', statementText: 'אני עובד בלילות עכשיו' }] }
  });
  assert.equal(withContext.alignment, withoutContext.alignment);
  assert.equal(withContext.trajectory, withoutContext.trajectory);
  assert.equal(withContext.basis.priorEstablishmentBasis, withoutContext.basis.priorEstablishmentBasis);
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(makeObservation(), withContext), ContextualMeaningPolicy.deriveValidReasonCategory(makeObservation(), withoutContext));
});

test('4c. an empty situationalContext.items array resolves NOT_CONSULTED, not CONSULTED (an attempted-but-empty classification is not the same as a truthful background note)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), { situationalContext: { items: [] } });
  assert.equal(cm.basis.contextConsulted.situationalContext, 'NOT_CONSULTED');
  assert.equal(cm.basis.situationalContextBackground, null);
});

test('4d. the non-V1-rule branch (every other Observation) is completely unaffected by situationalContext — contextConsulted stays two-key, no situationalContextBackground field at all', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(
    makeObservation({ topic: 'WORKOUT_FREQUENCY' }),
    { situationalContext: { items: [{ sourceMemoryId: 'mem-1', statementText: 'אני עובד בלילות עכשיו' }] } }
  );
  assert.deepEqual(cm.basis.contextConsulted, { goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED' });
  assert.ok(!Object.prototype.hasOwnProperty.call(cm.basis, 'situationalContextBackground'));
});

test('5. basis.unavailableOrUncertain is empty — NOT_CONSULTED never populates it, regardless of Pipeline Context availability', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {
    availability: { goalObjectiveContext: 'UNAVAILABLE', currentStateContext: 'UNAVAILABLE' }
  });
  assert.deepEqual(cm.basis.unavailableOrUncertain, []);
});

test('6. basis.observation carries every required field (sourceType, signalId, domain, topic, lifecycle, confidence, evidence.count, temporal)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  const o = cm.basis.observation;
  assert.equal(o.sourceType, 'HABIT');
  assert.equal(o.signalId, 'HABIT:nutrition:log-consistency');
  assert.equal(o.domain, 'NUTRITION');
  assert.equal(o.topic, 'FOOD_LOGGING');
  assert.equal(o.lifecycle, 'WEAKENING');
  assert.equal(o.confidence, 0.55);
  assert.equal(o.evidence.count, 4);
  assert.equal(o.temporal.firstObservedAt, '2026-01-31');
  assert.equal(o.temporal.lastObservedAt, '2026-05-01');
  assert.equal(o.temporal.expectedIntervalDays, 9);
});

test('7. current (honestly decayed) confidence is preserved on basis.observation.confidence, never inflated', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation({ confidence: 0.21 }), {});
  assert.equal(cm.basis.observation.confidence, 0.21);
});

test('8. no prohibited inference is asserted anywhere on the constructed ContextualMeaning (why logging declined, poor nutrition behavior, motivation, dietary failure, Goal deviation)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  const json = JSON.stringify(cm).toLowerCase();
  ['motivation', 'poor nutrition', 'dietary failure', 'goal deviation', 'why logging declined'].forEach((phrase) => {
    assert.ok(!json.includes(phrase), 'must not assert prohibited inference: ' + phrase);
  });
});

test('9. every other Observation resolves alignment/trajectory UNKNOWN honestly (never fabricated) — ACTIVE lifecycle', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation({ lifecycle: 'ACTIVE' }), {});
  assert.equal(cm.alignment, 'UNKNOWN');
  assert.equal(cm.trajectory, 'UNKNOWN');
  assert.equal(cm.basis.priorEstablishmentBasis, null);
});

test('10. every other Observation resolves UNKNOWN — non-FOOD_LOGGING topic, WEAKENING lifecycle', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation({ topic: 'WORKOUT_FREQUENCY', domain: 'WORKOUT' }), {});
  assert.equal(cm.trajectory, 'UNKNOWN');
  assert.equal(cm.basis.priorEstablishmentBasis, null);
});

test('11. every other Observation resolves UNKNOWN — Pattern-sourced FOOD_LOGGING WEAKENING (defensive; excluded upstream at B5)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation({ sourceType: 'PATTERN' }), {});
  assert.equal(cm.trajectory, 'UNKNOWN');
  assert.equal(cm.basis.priorEstablishmentBasis, null);
});

test('12. a malformed observation returns null (not a fabricated ContextualMeaning), no crash', () => {
  assert.equal(ContextualMeaningPolicy.computeContextualMeaning(null, {}), null);
  assert.equal(ContextualMeaningPolicy.computeContextualMeaning({}, {}), null);
  assert.equal(ContextualMeaningPolicy.computeContextualMeaning({ sourceType: 'HABIT' }, {}), null);
});

test('13. determinism: same Observation + same Context yields byte-identical ContextualMeaning', () => {
  const obs = makeObservation();
  const cm1 = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  const cm2 = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  assert.deepEqual(cm1, cm2);
});

test('14. the returned ContextualMeaning and its basis are frozen (immutable, consistent with Pipeline Context conventions)', () => {
  const cm = ContextualMeaningPolicy.computeContextualMeaning(makeObservation(), {});
  assert.equal(Object.isFrozen(cm), true);
  assert.equal(Object.isFrozen(cm.basis), true);
  assert.equal(Object.isFrozen(cm.basis.observation), true);
});

// ══════════════════════════════════════════════════════════════════
// §21.1 — deriveValidReasonCategory (Product Reason Policy)
// ══════════════════════════════════════════════════════════════════

test('15. the V1 rule fires only for Habit + FOOD_LOGGING + WEAKENING (established)', () => {
  const obs = makeObservation();
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm), 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION');
});

test('16. Habit FOOD_LOGGING ACTIVE/CONFIRMED resolves NO_VALID_REASON', () => {
  ['ACTIVE', 'CONFIRMED'].forEach((lifecycle) => {
    const obs = makeObservation({ lifecycle });
    const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
    assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm), 'NO_VALID_REASON');
  });
});

test('17. Habit non-FOOD_LOGGING WEAKENING resolves NO_VALID_REASON', () => {
  const obs = makeObservation({ topic: 'WORKOUT_FREQUENCY', domain: 'WORKOUT' });
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm), 'NO_VALID_REASON');
});

test('18. Pattern FOOD_LOGGING WEAKENING resolves NO_VALID_REASON (defensive — excluded upstream at B5)', () => {
  const obs = makeObservation({ sourceType: 'PATTERN' });
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm), 'NO_VALID_REASON');
});

test('19. Habit FOOD_LOGGING WEAKENING WITHOUT the real establishment fact resolves NO_VALID_REASON (never fabricated on lifecycle label alone)', () => {
  const obs = makeObservation({ provenance: { currentEpisodeEstablished: false, currentEpisodeEstablishedAt: null } });
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm), 'NO_VALID_REASON');
});

test('20. no automatic mapping exists to any of the other six D1-IE-01 Reasons', () => {
  const others = ['PREVENT_PREDICTABLE_MISTAKE', 'HELP_BEFORE_DIFFICULT_DECISION', 'CELEBRATE_MEANINGFUL_PROGRESS',
    'SUPPORT_RECOVERY', 'PREPARE_FOR_FORESEEABLE_CHALLENGE', 'PROTECT_STATED_LONG_TERM_GOALS'];
  const obs = makeObservation({ lifecycle: 'ACTIVE' });
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  const result = ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm);
  assert.ok(others.indexOf(result) === -1);
  assert.equal(result, 'NO_VALID_REASON');
});

test('21. a malformed observation resolves NO_VALID_REASON, never throws', () => {
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory(null, null), 'NO_VALID_REASON');
  assert.equal(ContextualMeaningPolicy.deriveValidReasonCategory({}, {}), 'NO_VALID_REASON');
});

test('22. determinism: same Observation + same ContextualMeaning yields the identical Reason on repeated evaluation', () => {
  const obs = makeObservation();
  const cm = ContextualMeaningPolicy.computeContextualMeaning(obs, {});
  const r1 = ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm);
  const r2 = ContextualMeaningPolicy.deriveValidReasonCategory(obs, cm);
  assert.equal(r1, r2);
});

test('23. VALID_REASON_CATEGORIES exposes the closed, seven-value D1-IE-01 enum', () => {
  assert.equal(ContextualMeaningPolicy.VALID_REASON_CATEGORIES.length, 7);
  assert.ok(ContextualMeaningPolicy.VALID_REASON_CATEGORIES.indexOf('REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION') !== -1);
});
