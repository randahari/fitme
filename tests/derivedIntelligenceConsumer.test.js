// B5 — Derived Intelligence Consumer tests (SPEC §57.1-§57.7).
// Dependency-free: Node's built-in test runner + assert only, exercising the real
// js/derivedIntelligenceConsumer.js module directly, configured with mock dependencies
// mirroring app.js's actual injected shapes (session {uid, generation}, readHabitSnapshot/
// readPatternSnapshot returning the exact {habits,habitsMeta}/{patterns,patternsMeta} shape
// js/stateAccess.js's readHabitView/readPatternView return). Same approach as
// tests/stateAccess.test.js / tests/persistenceGateway.test.js.
// Run with: node --test tests/derivedIntelligenceConsumer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Consumer = require('../js/derivedIntelligenceConsumer.js');

const TODAY = '2026-07-19';

function daysBefore(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function makeHabit(overrides) {
  return Object.assign({
    id: 'nutrition:meal:evening', type: 'nutrition', key: 'meal:evening',
    description: 'x', frequency: 1, confidence: 0.9, consistency: 0.9, streak: 5,
    status: 'active', firstObserved: daysBefore(TODAY, 60), lastObserved: TODAY,
    period: 'daily', expectedIntervalDays: 2,
    sourceEvents: { count: 10, window: 42, dates: [] }
  }, overrides);
}
function makePattern(overrides) {
  return Object.assign({
    id: 'weekday.active.5', category: 'weekday', description: 'x',
    confidence: 0.9, status: 'confirmed', firstSeen: daysBefore(TODAY, 60), lastSeen: TODAY,
    missedPeriods: 0, period: 'weekly', expectedIntervalDays: 9, window: 90,
    patternVersion: 1, strength: 0.8, evidenceCount: 8, opportunityCount: 10, sampleDates: [], meta: {}
  }, overrides);
}

// makeEnv reconfigures the module-level Consumer.configure() (mirrors makeEnv() pattern in
// tests/stateAccess.test.js) — each test calls this before build() so state never leaks
// across tests despite configure() being shared module state.
function makeEnv(opts) {
  opts = opts || {};
  let generation = (typeof opts.generation === 'number') ? opts.generation : 1;
  const habits = opts.habits || [];
  const patterns = opts.patterns || [];
  const calls = { habitReads: 0, patternReads: 0 };
  const isSessionCurrentImpl = opts.isSessionCurrent || ((gen) => gen === generation);
  Consumer.configure({
    isSessionCurrent: isSessionCurrentImpl,
    readHabitSnapshot: opts.readHabitSnapshot || (async () => {
      calls.habitReads++;
      return opts.habitsUnavailable ? null : { habits, habitsMeta: { version: 1, lastRun: TODAY } };
    }),
    readPatternSnapshot: opts.readPatternSnapshot || (async () => {
      calls.patternReads++;
      return opts.patternsUnavailable ? null : { patterns, patternsMeta: { version: 1, sourceFingerprint: opts.sourceFingerprint || 'fp1', lastRun: TODAY } };
    }),
    getLocalDate: opts.getLocalDate || (() => opts.now || TODAY),
    getWeekday: () => 0
  });
  return { setGeneration: (g) => { generation = g; }, calls };
}

// Default purpose is REVIEW (not IMMEDIATE) so that tests unrelated to temporal/sequence
// relevance (eligibility, normalization, ordering, session, immutability...) aren't
// coupled to whether the default fixture's qualifiers happen to match "right now" — under
// REVIEW a qualifier mismatch relaxes rather than hard-excludes (SPEC §12.6). Tests that
// specifically exercise IMMEDIATE-vs-REVIEW semantics (35-40, 42/43) set their own intent.
function baseRequest(overrides) {
  return Object.assign({
    requestId: 'req-1', consumer: 'AI_COACH_PROMPT', policyId: 'COACH_PROMPT_V1',
    session: { uid: 'user-1', generation: 1 },
    intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' }
  }, overrides);
}
function signalIds(result) { return result.context.signals.map((s) => s.id); }

// ══════════════════════════════════════════════════════════════════
// 57.1 Request and Policy
// ══════════════════════════════════════════════════════════════════

test('1. valid Coach request accepted', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.status, 'SUCCESS');
  assert.ok(result.context);
  assert.equal(result.error, null);
  assert.deepEqual(signalIds(result), ['HABIT:nutrition:meal:evening']);
});

test('2. missing request ID rejected', async () => {
  makeEnv();
  const req = baseRequest(); delete req.requestId;
  const result = await Consumer.build(req);
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'INVALID_REQUEST');
  assert.equal(result.context, null);
});

test('3. missing session rejected', async () => {
  makeEnv();
  const req = baseRequest(); delete req.session;
  const result = await Consumer.build(req);
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'INVALID_REQUEST');
});

test('4. unknown consumer rejected', async () => {
  makeEnv();
  const result = await Consumer.build(baseRequest({ consumer: 'NOT_A_REAL_CONSUMER' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'UNKNOWN_CONSUMER');
});

test('4b. disabled consumers (INITIATIVE_ENGINE/DECISION_ENGINE) rejected as unknown/unauthorized', async () => {
  makeEnv();
  const r1 = await Consumer.build(baseRequest({ consumer: 'INITIATIVE_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  const r2 = await Consumer.build(baseRequest({ consumer: 'DECISION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.equal(r1.status, 'REJECTED');
  assert.equal(r1.error.code, 'UNKNOWN_CONSUMER');
  assert.equal(r2.status, 'REJECTED');
  assert.equal(r2.error.code, 'UNKNOWN_CONSUMER');
});

test('5. unknown policy rejected', async () => {
  makeEnv();
  const result = await Consumer.build(baseRequest({ policyId: 'NOT_A_REAL_POLICY' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'UNKNOWN_POLICY');
});

test('6. consumer-policy mismatch rejected', async () => {
  makeEnv();
  const result = await Consumer.build(baseRequest({ consumer: 'AI_COACH_PROMPT', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'POLICY_NOT_ALLOWED_FOR_CONSUMER');
});

test('7. unknown domain rejected', async () => {
  makeEnv();
  const result = await Consumer.build(baseRequest({ intent: { domain: 'NOT_A_DOMAIN', purpose: 'IMMEDIATE' } }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'UNKNOWN_DOMAIN');
});

test('8. duplicate topic IDs normalized deterministically', async () => {
  makeEnv({ habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency' })] });
  const withDup = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', topics: ['FOOD_LOGGING', 'FOOD_LOGGING'] } }));
  makeEnv({ habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency' })] });
  const withoutDup = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', topics: ['FOOD_LOGGING'] } }));
  assert.deepEqual(signalIds(withDup), ['HABIT:nutrition:log-consistency']);
  assert.deepEqual(signalIds(withDup), signalIds(withoutDup));
});

test('9. requested limit clamps to policy maximum', async () => {
  const habits = [0, 1, 2, 3, 4, 5].map((n) => makeHabit({ id: 'workout:weekday:' + n, type: 'workout', key: 'weekday:' + n }));
  makeEnv({ habits });
  const result = await Consumer.build(baseRequest({ limits: { maxSignals: 999 }, intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' } }));
  assert.ok(result.context.signals.length <= 8, 'COACH_PROMPT_V1 maxSignals is 8');
  assert.ok(result.context.diagnostics.warnings.indexOf('REQUEST_LIMIT_CLAMPED') !== -1);
});

test('10. negative limit rejected', async () => {
  makeEnv();
  const result = await Consumer.build(baseRequest({ limits: { maxSignals: -1 } }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'INVALID_REQUEST');
});

// ══════════════════════════════════════════════════════════════════
// 57.2 Validation
// ══════════════════════════════════════════════════════════════════

test('11. valid Habit normalized', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.build(baseRequest());
  const sig = result.context.signals[0];
  assert.equal(sig.sourceType, 'HABIT');
  assert.equal(sig.domain, 'NUTRITION');
  assert.equal(sig.topic, 'MEAL_TIMING');
  assert.deepEqual(sig.qualifiers, ['EVENING']);
});

test('12. valid Pattern normalized', async () => {
  makeEnv({ patterns: [makePattern()] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  const sig = result.context.signals[0];
  assert.equal(sig.sourceType, 'PATTERN');
  assert.equal(sig.domain, 'NUTRITION');
  assert.equal(sig.topic, 'WEEKDAY_BEHAVIOR');
});

test('13. missing source ID excluded', async () => {
  const bad = makeHabit(); delete bad.id;
  makeEnv({ habits: [bad, makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in' })] });
  const result = await Consumer.build(baseRequest());
  assert.deepEqual(signalIds(result), ['HABIT:weight:weigh-in']);
});

test('14. invalid confidence excluded', async () => {
  makeEnv({ habits: [makeHabit({ confidence: 1.5 })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('15. negative evidence excluded', async () => {
  makeEnv({ habits: [makeHabit({ sourceEvents: { count: -1, window: 42, dates: [] } })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('16. unknown lifecycle excluded', async () => {
  makeEnv({ habits: [makeHabit({ status: 'not-a-real-status' })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('17. unknown additive field ignored', async () => {
  makeEnv({ habits: [makeHabit({ someFutureField: { nested: true } })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 1);
});

test('18. legacy unsupported shape excluded', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'unknown-type:x', type: 'unknown-type', key: 'x' })],
    patterns: [makePattern({ id: 'not.a.catalog.id' })]
  });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('19. duplicate identical record collapsed', async () => {
  const h = makeHabit();
  makeEnv({ habits: [h, Object.assign({}, h)] });
  const result = await Consumer.build(baseRequest());
  assert.deepEqual(signalIds(result), ['HABIT:nutrition:meal:evening']);
});

test('20. duplicate conflicting record diagnosed', async () => {
  makeEnv({ habits: [makeHabit({ confidence: 0.9 }), makeHabit({ confidence: 0.5 })] });
  const result = await Consumer.build(baseRequest({ consumer: 'TEST_HARNESS', policyId: 'TEST_FULL_DIAGNOSTIC_V1' }));
  assert.equal(result.context.signals.length, 0);
  const codes = result.context.diagnostics.exclusions.map((e) => e.codes).flat();
  assert.ok(codes.indexOf('DUPLICATE_SOURCE_ID_CONFLICT') !== -1);
});

// ══════════════════════════════════════════════════════════════════
// 57.3 Eligibility (COACH_PROMPT_V1 unless noted)
// ══════════════════════════════════════════════════════════════════

test('21. active signal above threshold included', async () => {
  makeEnv({ habits: [makeHabit({ status: 'active', confidence: 0.9 })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 1);
  assert.equal(result.context.signals[0].lifecycle, 'ACTIVE');
});

test('22. confirmed signal at threshold included', async () => {
  makeEnv({ habits: [makeHabit({ status: 'confirmed', confidence: 0.75 })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 1);
});

test('23. candidate signal excluded', async () => {
  makeEnv({ habits: [makeHabit({ status: 'candidate' })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('24. inactive signal excluded', async () => {
  makeEnv({ habits: [makeHabit({ status: 'inactive' })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('25. weakening excluded under Coach policy', async () => {
  makeEnv({ habits: [makeHabit({ status: 'weakening' })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('26. weakening retained as supporting-only under Recommendation policy when fresh', async () => {
  makeEnv({ habits: [makeHabit({ status: 'weakening', confidence: 0.7 })] });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.equal(result.context.signals.length, 1);
  assert.equal(result.context.signals[0].lifecycle, 'WEAKENING');
});

test('27. stale active signal excluded', async () => {
  makeEnv({ habits: [makeHabit({ status: 'active', lastObserved: daysBefore(TODAY, 10), expectedIntervalDays: 2 })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('28. missing freshness excluded under Coach policy', async () => {
  makeEnv({ habits: [makeHabit({ lastObserved: null })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('29. insufficient evidence excluded', async () => {
  makeEnv({ habits: [makeHabit({ sourceEvents: { count: 1, window: 42, dates: [] } })] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.signals.length, 0);
});

test('30. not-durably-committed signal excluded', async () => {
  const env = makeEnv({ habitsUnavailable: true, patterns: [makePattern()] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(env.calls.habitReads, 1);
  assert.ok(result.context.signals.every((s) => s.sourceType !== 'HABIT'));
  assert.ok(result.context.diagnostics.warnings.indexOf('HABIT_VIEW_INVALID') !== -1);
  assert.equal(result.status, 'PARTIAL');
});

// ══════════════════════════════════════════════════════════════════
// 57.4 Relevance
// ══════════════════════════════════════════════════════════════════

test('31. exact domain included', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'NUTRITION', purpose: 'REVIEW' } }));
  assert.equal(result.context.signals.length, 1);
});

test('32. domain mismatch excluded', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'WORKOUT', purpose: 'IMMEDIATE' } }));
  assert.equal(result.context.signals.length, 0);
});

test('33. exact topic prioritized', async () => {
  makeEnv({ habits: [makeHabit(), makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW', topics: ['MEAL_TIMING'] } }));
  assert.deepEqual(signalIds(result), ['HABIT:nutrition:meal:evening']);
  assert.ok(result.context.signals[0].consumption.inclusionReasons.indexOf('TOPIC_MATCH') !== -1);
});

test('34. topic mismatch excluded', async () => {
  makeEnv({ habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', topics: ['PROTEIN_INTAKE'] } }));
  assert.equal(result.context.signals.length, 0);
});

test('35. Friday Pattern relevant on Friday', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(result.context.signals.length, 1);
});

test('36. Friday Pattern excluded for immediate Tuesday request', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 2 } }));
  assert.equal(result.context.signals.length, 0);
});

test('37. Friday Pattern relevant for weekly-review topic if policy permits', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW', weekday: 2 } }));
  assert.equal(result.context.signals.length, 1);
});

test('38. evening Habit relevant in evening', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', localTimeSegment: 'EVENING' } }));
  assert.equal(result.context.signals.length, 1);
  assert.ok(result.context.signals[0].consumption.inclusionReasons.indexOf('CURRENT_TEMPORAL_MATCH') !== -1);
});

test('39. sequence Pattern excluded without prerequisite', async () => {
  makeEnv({ patterns: [makePattern({ id: 'sequence.workout_day_high_protein' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', contextEvents: [] } }));
  assert.equal(result.context.signals.length, 0);
});

test('40. sequence Pattern included with prerequisite', async () => {
  makeEnv({ patterns: [makePattern({ id: 'sequence.workout_day_high_protein' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', contextEvents: ['WORKOUT_COMPLETED'] } }));
  assert.equal(result.context.signals.length, 1);
});

// ══════════════════════════════════════════════════════════════════
// 57.5 Overlap and Contradiction
// ══════════════════════════════════════════════════════════════════

test('41. compatible Habit and Pattern grouped', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency', confidence: 0.9 })],
    patterns: [makePattern({ id: 'frequency.meals_per_day', confidence: 0.85 })]
  });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.context.groups.length, 1);
  const g = result.context.groups[0];
  assert.deepEqual(g.memberSignalIds, ['HABIT:nutrition:log-consistency', 'PATTERN:frequency.meals_per_day']);
  assert.equal(g.primarySignalId, 'HABIT:nutrition:log-consistency');
  assert.deepEqual(signalIds(result), ['HABIT:nutrition:log-consistency']);
});

test('42. specific current qualifier selected as primary', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'workout:weekday:5', type: 'workout', key: 'weekday:5' })],
    patterns: [makePattern({ id: 'frequency.workouts_per_week' })]
  });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  const g = result.context.groups[0];
  assert.equal(g.primarySignalId, 'HABIT:workout:weekday:5');
});

test('43. general signal selected when specific qualifier does not match', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'workout:weekday:5', type: 'workout', key: 'weekday:5' })],
    patterns: [makePattern({ id: 'frequency.workouts_per_week' })]
  });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW', weekday: 1 } }));
  const g = result.context.groups[0];
  assert.equal(g.primarySignalId, 'PATTERN:frequency.workouts_per_week');
});

test('44. same-scope opposing signals create contradiction', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' }), makePattern({ id: 'weekday.skip.5' })] });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1', intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(result.context.contradictions.length, 1);
  assert.deepEqual(result.context.contradictions[0].signalIds, ['PATTERN:weekday.active.5', 'PATTERN:weekday.skip.5']);
});

test('45. unresolved contradictory signals omitted from Coach projection', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' }), makePattern({ id: 'weekday.skip.5' })] });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(result.context.signals.length, 0);
  assert.ok(result.context.diagnostics.warnings.indexOf('UNRESOLVED_CONTRADICTION') !== -1);
});

test('46. Recommendation policy retains contradiction annotation', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' }), makePattern({ id: 'weekday.skip.5' })] });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1', intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(result.context.contradictions.length, 1);
  assert.deepEqual(signalIds(result).sort(), ['PATTERN:weekday.active.5', 'PATTERN:weekday.skip.5']);
});

test('47. group ID deterministic', async () => {
  const fixture = () => makeEnv({
    habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency', confidence: 0.9 })],
    patterns: [makePattern({ id: 'frequency.meals_per_day', confidence: 0.85 })]
  });
  fixture();
  const r1 = await Consumer.build(baseRequest());
  fixture();
  const r2 = await Consumer.build(baseRequest({ requestId: 'req-2' }));
  assert.equal(r1.context.groups[0].id, r2.context.groups[0].id);
});

test('48. member order deterministic', async () => {
  const fixture = () => makeEnv({
    habits: [makeHabit({ id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency', confidence: 0.9 })],
    patterns: [makePattern({ id: 'frequency.meals_per_day', confidence: 0.85 })]
  });
  fixture();
  const r1 = await Consumer.build(baseRequest());
  fixture();
  const r2 = await Consumer.build(baseRequest({ requestId: 'req-2' }));
  assert.deepEqual(r1.context.groups[0].memberSignalIds, r2.context.groups[0].memberSignalIds);
});

// ══════════════════════════════════════════════════════════════════
// 57.6 Ordering and Limits
// ══════════════════════════════════════════════════════════════════

test('49. higher relevance sorts first', async () => {
  makeEnv({
    habits: [
      makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in', lastObserved: TODAY }),
      makeHabit({ id: 'measurement:measure', type: 'measurement', key: 'measure', lastObserved: daysBefore(TODAY, 3) })
    ]
  });
  const result = await Consumer.build(baseRequest());
  assert.deepEqual(signalIds(result), ['HABIT:weight:weigh-in', 'HABIT:measurement:measure']);
});

test('50. confidence tie-break works', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in', confidence: 0.8, lastObserved: TODAY })],
    patterns: [makePattern({ id: 'frequency.workouts_per_week', confidence: 0.95, lastSeen: TODAY })]
  });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.deepEqual(signalIds(result), ['PATTERN:frequency.workouts_per_week', 'HABIT:weight:weigh-in']);
});

test('51. freshness tie-break works', async () => {
  makeEnv({
    patterns: [
      makePattern({ id: 'weekday.active.1', confidence: 0.8, expectedIntervalDays: 10, lastSeen: daysBefore(TODAY, 3), evidenceCount: 8 }),
      makePattern({ id: 'frequency.workouts_per_week', confidence: 0.8, expectedIntervalDays: 10, lastSeen: daysBefore(TODAY, 18), evidenceCount: 8 })
    ]
  });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1', intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW', weekday: 6 } }));
  assert.deepEqual(signalIds(result), ['PATTERN:weekday.active.1', 'PATTERN:frequency.workouts_per_week']);
});

test('52. evidence tie-break works', async () => {
  makeEnv({
    habits: [makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in', confidence: 0.8, lastObserved: TODAY, sourceEvents: { count: 20, window: 42, dates: [] } })],
    patterns: [makePattern({ id: 'frequency.workouts_per_week', confidence: 0.8, lastSeen: TODAY, evidenceCount: 5 })]
  });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.deepEqual(signalIds(result), ['HABIT:weight:weigh-in', 'PATTERN:frequency.workouts_per_week']);
});

test('53. stable source-ID tie-break works', async () => {
  makeEnv({
    habits: [
      makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in', confidence: 0.8, lastObserved: TODAY, sourceEvents: { count: 10, window: 42, dates: [] } }),
      makeHabit({ id: 'measurement:measure', type: 'measurement', key: 'measure', confidence: 0.8, lastObserved: TODAY, sourceEvents: { count: 10, window: 42, dates: [] } })
    ]
  });
  const result = await Consumer.build(baseRequest());
  assert.deepEqual(signalIds(result), ['HABIT:measurement:measure', 'HABIT:weight:weigh-in']);
});

test('54. total limit enforced', async () => {
  // 3 habits + 3 patterns, all in distinct domain|topic buckets (no accidental overlap
  // suppression, ר' test 41) — 6 eligible candidates total, all relevant.
  makeEnv({
    habits: ['weight:weigh-in', 'measurement:measure', 'nutrition:log-consistency'].map((id) => makeHabit({ id: id, type: id.split(':')[0], key: id.split(':').slice(1).join(':') })),
    patterns: ['sequence.workout_back_to_back', 'frequency.workouts_per_week', 'time.first_meal_window'].map((id) => makePattern({ id: id }))
  });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1', limits: { maxSignals: 5 } }));
  assert.equal(result.context.signals.length, 5);
  assert.equal(result.context.summary.truncated, true);
});

test('55. per-source limit enforced', async () => {
  makeEnv({
    habits: [0, 1, 2, 3, 4, 5].map((n) => makeHabit({ id: 'workout:weekday:' + n, type: 'workout', key: 'weekday:' + n })),
    patterns: [0, 1, 2, 3, 4, 5].map((n) => makePattern({ id: 'weekday.active.' + n }))
  });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' } }));
  assert.equal(result.context.summary.habitCount, 4);
  assert.equal(result.context.summary.patternCount, 4);
  assert.equal(result.context.signals.length, 8);
});

test('56. truncation flag set', async () => {
  makeEnv({
    habits: [0, 1, 2, 3, 4, 5].map((n) => makeHabit({ id: 'workout:weekday:' + n, type: 'workout', key: 'weekday:' + n })),
    patterns: [0, 1, 2, 3, 4, 5].map((n) => makePattern({ id: 'weekday.active.' + n }))
  });
  const result = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' } }));
  assert.equal(result.context.summary.truncated, true);
  assert.ok(result.context.diagnostics.warnings.indexOf('DERIVED_CONTEXT_TRUNCATED') !== -1);
});

test('57. no random sampling (deterministic truncation across identical calls)', async () => {
  const fixture = () => makeEnv({
    habits: [0, 1, 2, 3, 4, 5].map((n) => makeHabit({ id: 'workout:weekday:' + n, type: 'workout', key: 'weekday:' + n })),
    patterns: [0, 1, 2, 3, 4, 5].map((n) => makePattern({ id: 'weekday.active.' + n }))
  });
  fixture();
  const r1 = await Consumer.build(baseRequest({ intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' } }));
  fixture();
  const r2 = await Consumer.build(baseRequest({ requestId: 'req-2', intent: { domain: 'GENERAL_COACHING', purpose: 'REVIEW' } }));
  assert.deepEqual(signalIds(r1).sort(), signalIds(r2).sort());
});

// ══════════════════════════════════════════════════════════════════
// 57.7 Session and Immutability
// ══════════════════════════════════════════════════════════════════

test('58. stale pre-read session rejected', async () => {
  const env = makeEnv({ habits: [makeHabit()], isSessionCurrent: () => false });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.status, 'STALE_SESSION');
  assert.equal(result.error.code, 'SESSION_STALE');
  assert.equal(env.calls.habitReads, 0, 'must reject before any read when already stale');
});

test('59. stale post-read session rejected', async () => {
  let checks = 0;
  makeEnv({ habits: [makeHabit()], isSessionCurrent: () => { checks++; return checks === 1; } });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.status, 'STALE_SESSION');
  assert.equal(result.context, null);
});

test('60. context detached from source arrays', async () => {
  const habits = [makeHabit()];
  makeEnv({ habits });
  const result = await Consumer.build(baseRequest());
  habits[0].confidence = 0;
  habits.push(makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in' }));
  assert.equal(result.context.signals[0].confidence, 0.9);
  assert.equal(result.context.signals.length, 1);
});

test('61. consumer mutation does not change producer state', async () => {
  const habits = [makeHabit()];
  makeEnv({ habits });
  const result = await Consumer.build(baseRequest());
  // Plain property assignment on a frozen object silently no-ops outside strict-mode callers
  // (this test file is sloppy-mode CJS) rather than throwing, so assert the real invariant
  // (nothing actually changes). Array#push is different: it throws unconditionally on a
  // non-extensible array regardless of caller strict mode (Set-with-Throw semantics).
  assert.ok(Object.isFrozen(result.context.signals[0]));
  assert.ok(Object.isFrozen(result.context.signals[0].consumption));
  assert.ok(Object.isFrozen(result.context.signals));
  result.context.signals[0].confidence = 999;
  result.context.signals[0].consumption.relevanceScore = 999;
  assert.throws(() => { result.context.signals.push({}); }, TypeError);
  assert.equal(result.context.signals[0].confidence, 0.9);
  assert.notEqual(result.context.signals[0].consumption.relevanceScore, 999);
  assert.equal(result.context.signals.length, 1);
  assert.equal(habits[0].confidence, 0.9);
});

test('62. cache does not cross generation (no shared state between independent builds)', async () => {
  makeEnv({ generation: 1, habits: [makeHabit({ id: 'weight:weigh-in', type: 'weight', key: 'weigh-in' })] });
  const r1 = await Consumer.build(baseRequest({ session: { uid: 'user-1', generation: 1 } }));
  makeEnv({ generation: 2, habits: [makeHabit({ id: 'measurement:measure', type: 'measurement', key: 'measure' })] });
  const r2 = await Consumer.build(baseRequest({ session: { uid: 'user-2', generation: 2 } }));
  assert.deepEqual(signalIds(r1), ['HABIT:weight:weigh-in']);
  assert.deepEqual(signalIds(r2), ['HABIT:measurement:measure']);
});

test('63. output reflects current source data, never a stale prior fingerprint (no durable context cache)', async () => {
  makeEnv({ patterns: [makePattern({ id: 'frequency.meals_per_day', confidence: 0.9 })], sourceFingerprint: 'fp1' });
  const r1 = await Consumer.build(baseRequest());
  makeEnv({ patterns: [makePattern({ id: 'time.first_meal_window', confidence: 0.9 })], sourceFingerprint: 'fp2' });
  const r2 = await Consumer.build(baseRequest({ requestId: 'req-2' }));
  assert.deepEqual(signalIds(r1), ['PATTERN:frequency.meals_per_day']);
  assert.deepEqual(signalIds(r2), ['PATTERN:time.first_meal_window']);
});

test('64. cache disabled produces same semantic output (no caching layer — pure per-call determinism)', async () => {
  const fixture = () => makeEnv({ habits: [makeHabit()], patterns: [makePattern({ id: 'time.first_meal_window' })] });
  fixture();
  const r1 = await Consumer.build(baseRequest());
  fixture();
  const r2 = await Consumer.build(baseRequest());
  const strip = (r) => JSON.stringify(r.context.signals.map((s) => Object.assign({}, s, {})));
  assert.equal(strip(r1), strip(r2));
});

// ── Bonus robustness (supports 57.9 items 78/79/80): a state-access read failure
// never throws out of build() — it degrades to FAILED, which the Coach integration
// (js/coach/coachPromptComposer.js buildSystemPrompt, relocated by C1-WP6) catches and
// treats as "no derived intelligence". ──
test('bonus. a readHabitSnapshot rejection does not throw — build() resolves FAILED', async () => {
  makeEnv({ readHabitSnapshot: async () => { throw new Error('boom'); }, patterns: [] });
  const result = await Consumer.build(baseRequest());
  assert.equal(result.status, 'FAILED');
  assert.equal(result.error.code, 'STATE_ACCESS_UNAVAILABLE');
});

// ══════════════════════════════════════════════════════════════════
// External Implementation Review corrections (B5 v1.2 §41.2/§42.3/§51.4 — production-safe
// adapter separation; §26.2 — contradiction category).
// ══════════════════════════════════════════════════════════════════

test('correction. contradiction category is OPPOSING_BEHAVIOR, not LIFECYCLE_CONFLICT (§26.2)', async () => {
  makeEnv({ patterns: [makePattern({ id: 'weekday.active.5' }), makePattern({ id: 'weekday.skip.5' })] });
  const result = await Consumer.build(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1', intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: 5 } }));
  assert.equal(result.context.contradictions.length, 1);
  assert.equal(result.context.contradictions[0].category, 'OPPOSING_BEHAVIOR');
});

test('correction. buildProductionSafe allows the production-enabled mapping (AI_COACH_PROMPT/COACH_PROMPT_V1)', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.buildProductionSafe(baseRequest());
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(signalIds(result), ['HABIT:nutrition:meal:evening']);
});

test('correction. buildProductionSafe rejects TEST_HARNESS/TEST_FULL_DIAGNOSTIC_V1 before invoking the core module', async () => {
  const env = makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.buildProductionSafe(baseRequest({ consumer: 'TEST_HARNESS', policyId: 'TEST_FULL_DIAGNOSTIC_V1' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'POLICY_NOT_ALLOWED_FOR_CONSUMER');
  assert.equal(result.context, null);
  assert.equal(env.calls.habitReads, 0, 'the core module (and its state reads) must never be invoked for a rejected production request');
});

test('correction. buildProductionSafe rejects RECOMMENDATION_ENGINE/RECOMMENDATION_SUPPORT_V1 (not production-enabled per §51.4)', async () => {
  makeEnv({ habits: [makeHabit()] });
  const result = await Consumer.buildProductionSafe(baseRequest({ consumer: 'RECOMMENDATION_ENGINE', policyId: 'RECOMMENDATION_SUPPORT_V1' }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'POLICY_NOT_ALLOWED_FOR_CONSUMER');
});

test('correction. buildProductionSafe rejects a malformed request without throwing', async () => {
  makeEnv();
  const result = await Consumer.buildProductionSafe({});
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.error.code, 'POLICY_NOT_ALLOWED_FOR_CONSUMER');
});
