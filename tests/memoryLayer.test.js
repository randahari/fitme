// TASK-004 — Memory Layer (Context Assembly) tests. Dependency-free: exercises the real
// js/coachDecisionSystem/memoryLayer.js configured with mock StateAccess/
// DerivedIntelligenceConsumer dependencies, mirroring the mock-dependency approach already
// used in tests/stateAccess.test.js / tests/derivedIntelligenceConsumer.test.js.
// Run with: node --test tests/memoryLayer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');

function configureHappyPath() {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [{ kind: 'feedback', surface: 'recommendation', contextId: 'opp-1', feedbackType: 'Accepted', ts: 111 }] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

test('1. assembleContext returns a frozen, well-formed ImmutablePipelineContext', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(Object.isFrozen(ctx), true);
  assert.equal(ctx.userId, 'user-1');
  assert.equal(ctx.sessionGeneration, 1);
  assert.equal(typeof ctx.assembledAt, 'number');
  assert.ok(Array.isArray(ctx.feedbackHistory));
  assert.equal(ctx.availability.feedbackHistory, 'AVAILABLE');
  assert.equal(ctx.availability.derivedIntelligence, 'AVAILABLE');
});

test('2. feedbackHistory reflects StateAccess.recommendationFeedbackHistory() (C2 read path, unchanged)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.feedbackHistory.length, 1);
  assert.equal(ctx.feedbackHistory[0].contextId, 'opp-1');
});

test('3. derivedIntelligence is populated via DerivedIntelligenceConsumer (B5, RECOMMENDATION_ENGINE consumer)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.derivedIntelligence.consumer, 'RECOMMENDATION_ENGINE');
  assert.equal(ctx.derivedIntelligence.policyId, 'RECOMMENDATION_SUPPORT_V1');
});

test('4. graceful degradation: StateAccess feedback read failure does not block context assembly (D3 §12.3)', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('profile read failed'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.feedbackHistory, 'UNAVAILABLE');
  assert.deepEqual(ctx.feedbackHistory, []);
  assert.equal(ctx.availability.derivedIntelligence, 'AVAILABLE'); // one category's absence does not block another
});

test('5. graceful degradation: DerivedIntelligenceConsumer unavailability does not block context assembly', async () => {
  configureHappyPath();
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => { throw new Error('state access unavailable'); },
    readPatternSnapshot: async () => { throw new Error('state access unavailable'); },
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.derivedIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.derivedIntelligence, null);
  assert.equal(ctx.availability.feedbackHistory, 'AVAILABLE'); // one category's absence does not block another
});

test('6. never fabricates missing context: unavailable categories are recorded as UNAVAILABLE, never substituted with fabricated data', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('unavailable'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: () => false // simulate a fully stale session for StateAccess too
  });
  Consumer.configure({
    isSessionCurrent: () => false,
    readHabitSnapshot: async () => ({ habits: [] }),
    readPatternSnapshot: async () => ({ patterns: [] }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.feedbackHistory, 'UNAVAILABLE');
  assert.equal(ctx.availability.derivedIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.derivedIntelligence, null);
  assert.deepEqual(ctx.feedbackHistory, []);
});

// ══════════════════════════════════════════════════════════════════
// TASK-005 Canonical Decision CD-T005-01 — Pipeline Context extension (Relationship Maturity
// signal, Life Event Context, Habit state, Pattern state, Capacity state). §33.7.
// ══════════════════════════════════════════════════════════════════

test('7. initiativeIntelligence is populated via DerivedIntelligenceConsumer (B5, INITIATIVE_ENGINE consumer)', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.initiativeIntelligence.consumer, 'INITIATIVE_ENGINE');
  assert.equal(ctx.initiativeIntelligence.policyId, 'INITIATIVE_SUPPORT_V1');
  assert.equal(ctx.availability.initiativeIntelligence, 'AVAILABLE');
});

test('8. habitState/patternState availability is sourced from initiativeIntelligence.sourceStatus, not fabricated', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.habitState, 'EMPTY'); // configureHappyPath supplies no habits/patterns
  assert.equal(ctx.availability.patternState, 'EMPTY');
});

test('9. Relationship Maturity is NOT derived from generic feedback-event count — a large feedback history still yields UNKNOWN (Correction 1)', async () => {
  const manyFeedbackEvents = Array.from({ length: 20 }, (_, i) => ({ kind: 'feedback', surface: 'recommendation', contextId: 'a' + i, feedbackType: 'Accepted', ts: i }));
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: manyFeedbackEvents }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.feedbackHistory.length, 20); // the feedback history itself is real and populated...
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // ...but is never used to derive a maturity stage
  assert.equal(ctx.relationshipMaturity.basis, null);
});

test('10. Relationship Maturity is NOT derived from confirmed Habit/Pattern signal count — many ACTIVE/CONFIRMED signals still yield UNKNOWN (Correction 1)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({
      habits: [
        { id: 'h1', type: 'nutrition', key: 'meal:evening', confidence: 0.9, consistency: 0.9, status: 'active', firstObserved: '2026-06-01', lastObserved: '2026-07-29', sourceEvents: { count: 10, window: 42 } },
        { id: 'h2', type: 'workout', key: 'weekday:1', confidence: 0.9, consistency: 0.9, status: 'active', firstObserved: '2026-06-01', lastObserved: '2026-07-29', sourceEvents: { count: 10, window: 42 } }
      ],
      habitsMeta: { lastRun: '2026-07-01', version: 1 }
    }),
    readPatternSnapshot: async () => ({
      patterns: [
        { id: 'frequency.meals_per_day', confidence: 0.9, status: 'confirmed', firstSeen: '2026-06-01', lastSeen: '2026-07-29', evidenceCount: 10 }
      ],
      patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' }
    }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.ok(ctx.initiativeIntelligence.signals.length >= 1); // the Habit/Pattern signals themselves are real...
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // ...but are never used to derive a maturity stage
  assert.equal(ctx.relationshipMaturity.basis, null);
});

test('10b. Relationship Maturity resolves to UNKNOWN when no approved source exists, regardless of read availability (never fabricated, no replacement heuristic)', async () => {
  configureHappyPath();
  const ctxAvailable = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctxAvailable.relationshipMaturity.stage, 'UNKNOWN');
  assert.equal(ctxAvailable.availability.relationshipMaturity, 'UNAVAILABLE');

  StateAccess.configure({
    getUserProfile: () => { throw new Error('unavailable'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: () => false
  });
  Consumer.configure({
    isSessionCurrent: () => false,
    readHabitSnapshot: async () => ({ habits: [] }),
    readPatternSnapshot: async () => ({ patterns: [] }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctxUnavailable = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctxUnavailable.relationshipMaturity.stage, 'UNKNOWN');
  assert.equal(ctxUnavailable.relationshipMaturity.basis, null);
});

test('10c. no replacement maturity heuristic exists in the source: no evidence-count derivation, no thresholds, no elapsed-time read', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
  ['ENGINEERING_PROVISIONAL_EVIDENCE_COUNT_V1', 'evidenceScore', 'confirmedSignalCount', 'createdAt', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'].forEach((token) => {
    assert.equal(src.indexOf(token), -1, 'must not contain ' + token);
  });
});

test('11. Life Event Context and Capacity State are honestly reported UNAVAILABLE (no repository data source exists), never fabricated', async () => {
  configureHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.lifeEventContext, null);
  assert.equal(ctx.capacityState, null);
  assert.equal(ctx.availability.lifeEventContext, 'UNAVAILABLE');
  assert.equal(ctx.availability.capacityState, 'UNAVAILABLE');
});

test('12. graceful degradation: initiativeIntelligence unavailability does not block context assembly or the rest of the extension', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => { throw new Error('state access unavailable'); },
    readPatternSnapshot: async () => { throw new Error('state access unavailable'); },
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.availability.initiativeIntelligence, 'UNAVAILABLE');
  assert.equal(ctx.initiativeIntelligence, null);
  assert.equal(ctx.availability.habitState, 'UNAVAILABLE');
  assert.equal(ctx.availability.patternState, 'UNAVAILABLE');
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN'); // always UNKNOWN — no approved source exists (Correction 1)
  assert.equal(Object.isFrozen(ctx), true);
});

test('13. Memory Layer performs no Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation (CD-T005-01 rule 5)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
  ['prioritize', 'selectWinner', 'formDecision', 'rank(', '.generate('].forEach((token) => {
    assert.equal(src.indexOf(token), -1, 'must not contain ' + token);
  });
});

// ── Expression WP4 (remainder) / Canonical Decision 8 — buildExpressionRenderingContext():
// strict pass-through of an already-assembled Pipeline Context's own relationshipMaturity.stage;
// never resolves, infers, calculates, estimates, or otherwise computes a Relationship Maturity
// Stage of its own (reiterated implementation constraint, EXPRESSION_IMPLEMENTATION_PLAN.md WP4).

test('14. buildExpressionRenderingContext produces a schema-conformant, closed-shape Context from an assembled Pipeline Context', async () => {
  configureHappyPath();
  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  const result = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
  assert.equal(result.status, 'BUILT');
  assert.equal(result.expressionRenderingContext.relationshipMaturityStage, 'UNKNOWN');
  assert.deepEqual(Object.keys(result.expressionRenderingContext).sort(), ['relationshipMaturityStage', 'schemaVersion']);
});

test('15. buildExpressionRenderingContext is a strict pass-through — it never derives relationshipMaturityStage from feedback count, Habit/Pattern signal count, or any other heuristic (mirrors test 9/10\'s own evidence)', async () => {
  configureHappyPath();
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: Array.from({ length: 500 }, (_, i) => ({ kind: 'feedback', surface: 'recommendation', contextId: 'opp-' + i, feedbackType: 'Accepted', ts: i })) }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  const result = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
  assert.equal(result.expressionRenderingContext.relationshipMaturityStage, 'UNKNOWN'); // still UNKNOWN, regardless of feedback volume
});

test('16. buildExpressionRenderingContext never exposes any other Pipeline Context member', async () => {
  configureHappyPath();
  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  const result = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
  const serialized = JSON.stringify(result.expressionRenderingContext);
  ['derivedIntelligence', 'feedbackHistory', 'initiativeIntelligence', 'lifeEventContext', 'capacityState', 'availability', 'userId', 'sessionGeneration', 'assembledAt', 'basis'].forEach((forbidden) => {
    assert.equal(serialized.indexOf(forbidden), -1, forbidden);
  });
});

test('17. buildExpressionRenderingContext handles a missing/malformed Pipeline Context defensively (falls back to UNKNOWN, never throws, never fabricates a different stage)', () => {
  assert.equal(MemoryLayer.buildExpressionRenderingContext(null).status, 'BUILT');
  assert.equal(MemoryLayer.buildExpressionRenderingContext(null).expressionRenderingContext.relationshipMaturityStage, 'UNKNOWN');
  assert.equal(MemoryLayer.buildExpressionRenderingContext({}).expressionRenderingContext.relationshipMaturityStage, 'UNKNOWN');
  assert.equal(MemoryLayer.buildExpressionRenderingContext({ relationshipMaturity: {} }).expressionRenderingContext.relationshipMaturityStage, 'UNKNOWN');
});

// ── Expression WP9 / D2-EF-07 — recordExplicitUserStatementArrival() / getExplicitUserStatement
// ArrivalTimestamp() (accepted Architecture investigation's own approved mechanism). In-memory
// only, per-user, within the Memory Layer's own existing Decision-Input-intake ownership.

test('18. getExplicitUserStatementArrivalTimestamp returns null for a user with no recorded arrival', () => {
  assert.equal(MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'never-recorded-user' }), null);
});

test('19. recordExplicitUserStatementArrival()/getExplicitUserStatementArrivalTimestamp() round-trip a real timestamp', () => {
  const before = Date.now();
  MemoryLayer.recordExplicitUserStatementArrival({ userId: 'user-arrival-1' });
  const after = Date.now();
  const ts = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'user-arrival-1' });
  assert.equal(typeof ts, 'number');
  assert.ok(ts >= before && ts <= after);
});

test('20. the arrival marker is scoped per user — recording for one user never affects another\'s', () => {
  MemoryLayer.recordExplicitUserStatementArrival({ userId: 'user-arrival-a' });
  assert.equal(MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'user-arrival-b-untouched' }), null);
});

test('21. recordExplicitUserStatementArrival()/getExplicitUserStatementArrivalTimestamp() never throw on a missing/malformed identity', () => {
  assert.doesNotThrow(() => MemoryLayer.recordExplicitUserStatementArrival(null));
  assert.doesNotThrow(() => MemoryLayer.recordExplicitUserStatementArrival(undefined));
  assert.doesNotThrow(() => MemoryLayer.recordExplicitUserStatementArrival({}));
  assert.equal(MemoryLayer.getExplicitUserStatementArrivalTimestamp(null), null);
  assert.equal(MemoryLayer.getExplicitUserStatementArrivalTimestamp(undefined), null);
  assert.equal(MemoryLayer.getExplicitUserStatementArrivalTimestamp({}), null);
});

test('22. a later recordExplicitUserStatementArrival() call for the same user overwrites (updates) the marker, never accumulates a history', async () => {
  MemoryLayer.recordExplicitUserStatementArrival({ userId: 'user-arrival-overwrite' });
  const first = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'user-arrival-overwrite' });
  await new Promise((resolve) => setTimeout(resolve, 2));
  MemoryLayer.recordExplicitUserStatementArrival({ userId: 'user-arrival-overwrite' });
  const second = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'user-arrival-overwrite' });
  assert.ok(second >= first);
  assert.equal(typeof second, 'number'); // a single scalar, not an array/history
});

// ══════════════════════════════════════════════════════════════════
// G-2 (docs/specs/G2_SPEC_v1.0.md §12-13, §15) — GoalObjectiveContext / CurrentStateContext
// Pipeline Context extension.
// ══════════════════════════════════════════════════════════════════

function configureGoalObjectiveHappyPath() {
  StateAccess.configure({
    getUserProfile: () => ({ goal: 'lose_weight', goalKcal: 1800, coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    getTodayConsumed: () => 1200, getTodayProtein: () => 90, getTodayBurned: () => 300
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

test('23. goalObjectiveContext carries exactly {goal, goalKcal} when the underlying read succeeds', async () => {
  configureGoalObjectiveHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.deepEqual(ctx.goalObjectiveContext, { goal: 'lose_weight', goalKcal: 1800 });
  assert.equal(ctx.availability.goalObjectiveContext, 'AVAILABLE');
});

test('24. goalObjectiveContext is null with availability UNAVAILABLE when the underlying read throws (never fabricated)', async () => {
  StateAccess.configure({
    getUserProfile: () => { throw new Error('profile read failed'); },
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.goalObjectiveContext, null);
  assert.equal(ctx.availability.goalObjectiveContext, 'UNAVAILABLE');
});

test('25. currentStateContext carries exactly {consumed, protein, burned} when the underlying read succeeds (readTodayNutrition reused, not duplicated)', async () => {
  configureGoalObjectiveHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.deepEqual(ctx.currentStateContext, { consumed: 1200, protein: 90, burned: 300 });
  assert.equal(ctx.availability.currentStateContext, 'AVAILABLE');
});

test('26. currentStateContext is null with availability UNAVAILABLE when the underlying read throws (never fabricated)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ goal: 'lose_weight', goalKcal: 1800, coachEvents: [] }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1
    // getTodayConsumed/getTodayProtein/getTodayBurned intentionally omitted — readTodayNutrition throws
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.currentStateContext, null);
  assert.equal(ctx.availability.currentStateContext, 'UNAVAILABLE');
  // one category's absence does not block another
  assert.deepEqual(ctx.goalObjectiveContext, { goal: 'lose_weight', goalKcal: 1800 });
});

test('27. goalObjectiveContext/currentStateContext do not affect any other existing Pipeline Context field (regression)', async () => {
  configureGoalObjectiveHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(ctx.userId, 'user-1');
  assert.equal(ctx.sessionGeneration, 1);
  assert.ok(Array.isArray(ctx.feedbackHistory));
  assert.equal(ctx.relationshipMaturity.stage, 'UNKNOWN');
  assert.equal(ctx.lifeEventContext, null);
  assert.equal(ctx.capacityState, null);
  assert.equal(Object.isFrozen(ctx), true);
});

test('28. Pipeline Context (including the two new fields) is frozen exactly as every existing field already is', async () => {
  configureGoalObjectiveHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(Object.isFrozen(ctx), true);
  assert.equal(Object.isFrozen(ctx.availability), true);
});

// ══════════════════════════════════════════════════════════════════
// USM-001 (docs/specs/USM_001_SPEC_v1.0.md §9) — assembleUserStatedMemoryFragment(): a second,
// independent, additively-versioned assembly entry point, entirely separate from
// assembleContext()/PipelineContext above. Uses StateAccess's own new
// memoryLayer/USER_STATED_MEMORY_READ capability-holder identity — never coachDecisionSystem.
// ══════════════════════════════════════════════════════════════════

function configureUserStatedHappyPath(records) {
  StateAccess.configure({
    getUserProfile: () => ({ memoryConsent: { granted: true, at: 1 } }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => records || [
      { _id: 'm1', type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 500 }
    ]
  });
}

test('USM1-A. assembleUserStatedMemoryFragment returns a frozen, well-formed fragment, AVAILABLE on the happy path', async () => {
  configureUserStatedHappyPath();
  const fragment = await MemoryLayer.assembleUserStatedMemoryFragment({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(Object.isFrozen(fragment), true);
  assert.equal(fragment.userId, 'user-1');
  assert.equal(typeof fragment.assembledAt, 'number');
  assert.equal(fragment.availability, 'AVAILABLE');
  assert.equal(fragment.schemaVersion, 'coach-decision-system-user-stated-fragment/1.0');
  assert.equal(fragment.facts.length, 1);
  assert.equal(fragment.facts[0].id, 'm1');
});

test('USM1-B. a StateAccess failure (e.g. stale session) degrades honestly to UNAVAILABLE/[] — never throws to the caller (D3 §12.3)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => { throw new Error('boom'); }
  });
  const fragment = await MemoryLayer.assembleUserStatedMemoryFragment({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(fragment.availability, 'UNAVAILABLE');
  assert.deepEqual(fragment.facts, []);
});

test('USM1-C. a stale session degrades honestly to UNAVAILABLE/[] — never throws to the caller', async () => {
  configureUserStatedHappyPath();
  const fragment = await MemoryLayer.assembleUserStatedMemoryFragment({ userId: 'user-1', sessionGeneration: 99, runId: 'run-1' });
  assert.equal(fragment.availability, 'UNAVAILABLE');
  assert.deepEqual(fragment.facts, []);
});

test('USM1-D. consent not granted resolves an AVAILABLE, empty fragment (StateAccess itself fails closed to [], not an error — §7)', async () => {
  StateAccess.configure({
    getUserProfile: () => ({ memoryConsent: { granted: false } }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => { throw new Error('must never be called when consent is false'); }
  });
  const fragment = await MemoryLayer.assembleUserStatedMemoryFragment({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal(fragment.availability, 'AVAILABLE');
  assert.deepEqual(fragment.facts, []);
});

test('USM1-E. assembleUserStatedMemoryFragment does not affect assembleContext()/PipelineContext in any way (no shared/competing assembler)', async () => {
  configureGoalObjectiveHappyPath();
  const ctx = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'run-1' });
  assert.equal('facts' in ctx, false);
  assert.equal('userStatedMemory' in ctx, false);
  assert.ok(!('USER_STATED_MEMORY_READ' in ctx));
});

test('USM1-F. this file does not read js/memory.js or Firestore directly — CD-02 remains honored exactly as before', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../js/coachDecisionSystem/memoryLayer.js'), 'utf8');
  assert.equal(src.indexOf("require('../memory.js"), -1);
  assert.equal(src.indexOf('firestore'), -1);
  assert.equal(src.indexOf('FitMeMemory'), -1);
});
