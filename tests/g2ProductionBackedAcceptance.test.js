// G-2 (docs/specs/G2_SPEC_v1.0.md §22, §42 item 2) — CRITICAL PRODUCTION-BACKED ACCEPTANCE
// PROOF for the first real, non-Safety Coach Decision System opportunity path.
//
// This file drives the REAL production Habit Engine, B5 (Derived Intelligence Consumer), Memory
// Layer, Initiative Engine, ContextualMeaningPolicy, Evidence Evaluator, and Internal Pipeline
// Orchestrator end-to-end, using the same virtual-clock technique proven in
// tests/habitEngineLifecycleEstablishment.test.js (monkeypatching js/core/dateUtils.js's
// getTodayKey, restored after every test) to drive real, non-fixture FOOD_LOGGING history through
// the real, unmodified-elsewhere runHabitEngine() across simulated calendar days.
//
// Nothing here hand-constructs a `status:'weakening'` Habit record, a DetectedOpportunity, or a
// ContextualMeaning — every one of those is produced by the real modules listed above, from real
// meal-logging history alone.
//
// Run with: node --test tests/g2ProductionBackedAcceptance.test.js

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const HabitEngine = require('../js/engines/habitEngine.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');
const DateUtils = require('../js/core/dateUtils.js');

function addDays(dateKey, n) {
  const parts = dateKey.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + n);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function mealAt(hour) { return { time: String(hour).padStart(2, '0') + ':00', kcal: 400, protein: 20 }; }
function nutritionLoggingPlan() { return { meals: [mealAt(8), mealAt(13), mealAt(19)] }; }
function nutritionStopPlan() { return { meals: [] }; }
function plansOf(fn, n) { const out = []; for (let i = 0; i < n; i++) out.push(fn); return out; }

function makeEnv() {
  const profile = {
    weightHistory: [], measurementHistory: [], currentWeight: 79, weight: 79,
    goal: 'cut', goalKcal: 2000,
    coachMemory: { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} },
    coachEvents: []
  };
  const history = {};
  let generation = 1;
  const deps = {
    getUserProfile: () => profile,
    getCurrentUser: () => ({ uid: 'user-1' }),
    fetchHistory: async () => history,
    persistHabitsView: async (identity, command) => {
      profile.coachMemory.habits = command.habits;
      profile.coachMemory.habitsMeta = command.habitsMeta;
      return { status: 'SUCCESS', changed: true, requestId: 'req-habits', receipt: {} };
    },
    persistPatternView: async () => { throw new Error('not used by this acceptance test'); },
    isSessionCurrent: (gen) => gen === generation,
    ensureCoachMemoryShape: () => {
      if (!profile.coachMemory) profile.coachMemory = { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} };
    },
    setAdaptProposal: () => {}, setAdaptHistoryCache: () => {},
    recordCoachEvent: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    markTriggerFired: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    checkCanFire: () => true, getTriggerBudget: () => ({ date: '2026-01-01', fired: [], count: 0 }),
    getTodayConsumed: () => 1200, getTodayProtein: () => 90, getTodayBurned: () => 300,
    getLocalDate: () => DateUtils.getTodayKey(), getWeekday: () => 0
  };
  StateAccess.configure(deps);
  HabitEngine.configure({
    appVersion: '9.9.9-test',
    sessionLifecycle: { getGeneration: () => 1, isCurrent: (g) => g === 1 },
    getCurrentUser: () => ({ uid: 'user-1' }),
    getUserProfile: () => profile,
    persistenceSummaryFn: (r) => r
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === generation,
    readHabitSnapshot: async () => ({ habits: profile.coachMemory.habits, habitsMeta: profile.coachMemory.habitsMeta }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-01-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => DateUtils.getTodayKey(),
    getWeekday: () => 0
  });
  return {
    profile, history,
    habitAccess: () => StateAccess.createEngineAccess({ engineId: 'habitEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: generation, runId: null })
  };
}

function useVirtualClock() {
  const real = DateUtils.getTodayKey;
  let virtualToday = '2026-01-01';
  DateUtils.getTodayKey = function () { return virtualToday; };
  return { set: (k) => { virtualToday = k; }, restore: () => { DateUtils.getTodayKey = real; } };
}

// Drives the real runHabitEngine() across `dayPlans.length` simulated days, feeding real meal
// history day by day. Returns the day-by-day trace of the log-consistency Habit record. If
// `stopWhen(habit)` is supplied and returns true for a given day's real habit record, the drive
// stops immediately on that exact day — leaving env.profile.coachMemory.habits (and the virtual
// clock, left pointed at that same day) reflecting that day's real, non-overwritten state, so a
// caller can inspect/consume it via the real B5/Memory Layer/Orchestrator before any further
// simulated day continues to decay it.
async function driveRealHabitEngine(env, clock, startDate, dayPlans, stopWhen) {
  let cur = startDate;
  const trace = [];
  for (let i = 0; i < dayPlans.length; i++) {
    clock.set(cur);
    const rawPlan = dayPlans[i];
    const plan = typeof rawPlan === 'function' ? rawPlan(i, cur) : rawPlan;
    if (plan !== null) env.history[cur] = { meals: plan.meals || [], burned: plan.burned || 0 };
    await HabitEngine.runHabitEngine(env.habitAccess());
    const habit = env.profile.coachMemory.habits.find((h) => h.id === 'nutrition:log-consistency');
    trace.push({ day: i, date: cur, habit: habit ? Object.assign({}, habit) : null });
    if (typeof stopWhen === 'function' && habit && stopWhen(habit, i)) {
      clock.set(cur); // leave the virtual clock pinned to the exact day that produced this state
      return trace;
    }
    cur = addDays(cur, 1);
  }
  return trace;
}

test('G-2 CRITICAL PRODUCTION-BACKED ACCEPTANCE PROOF: real FOOD_LOGGING history -> Habit Engine -> established WEAKENING -> B5 -> Memory Layer -> Initiative Engine -> ContextualMeaning -> Product Reason Policy -> DetectedOpportunity -> Stage-3 aggregation -> Stage-4 Evidence Evaluation -> Stage 4->5 handoff -> EligibilityEvaluator -> INELIGIBLE/TRUST_TEST_UNCERTAIN -> Silence', async () => {
  const env = makeEnv();
  const clock = useVirtualClock();
  try {
    // ── Step 1: real, non-fixture FOOD_LOGGING history through the real Habit Engine ──
    // 70 days of full logging (establishes the habit), then stopped (drives it into WEAKENING).
    // This is the exact, already-proven arc from tests/habitEngineLifecycleEstablishment.test.js's
    // own CRITICAL PRODUCTION-BACKED ACCEPTANCE test — reused here to reach the same real state,
    // then continued through the full G-2 pipeline this task adds.
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 90));
    const trace = await driveRealHabitEngine(env, clock, '2026-01-01', plans, (h) => h.status === 'weakening');

    const weakeningDay = trace[trace.length - 1];
    assert.notEqual(weakeningDay.habit, null);
    assert.equal(weakeningDay.habit.status, 'weakening', 'expected the real Habit Engine to reach WEAKENING for log-consistency — this is a precondition of this test, not the thing being tested');
    assert.equal(weakeningDay.habit.currentEpisodeEstablished, true, 'the real Habit Engine must report a genuine, non-injected current-episode establishment fact');
    assert.notEqual(weakeningDay.habit.currentEpisodeEstablishedAt, null);
    // The drive stopped exactly on this day (driveRealHabitEngine's stopWhen) — env.profile and
    // the virtual clock both still reflect this exact real day's state, not any later, further-
    // decayed day. Every downstream real module (B5 freshness, Memory Layer, Orchestrator) below
    // evaluates "today" as this same real day — no time-travel, no re-deriving a different day.

    // ── Step 2: real B5 (Derived Intelligence Consumer) — INITIATIVE_ENGINE/INITIATIVE_SUPPORT_V1 ──
    const b5Result = await Consumer.build({
      requestId: 'acceptance-test-b5', consumer: 'INITIATIVE_ENGINE', policyId: 'INITIATIVE_SUPPORT_V1',
      session: { uid: 'user-1', generation: 1 }, intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }
    });
    assert.equal(b5Result.status, 'SUCCESS');
    const b5Signal = b5Result.context.signals.find((s) => s.id === 'HABIT:nutrition:log-consistency');
    assert.notEqual(b5Signal, undefined, 'expected the real, established WEAKENING Habit signal to be admitted by the real B5 eligibility logic — not hand-injected');
    assert.equal(b5Signal.lifecycle, 'WEAKENING');
    assert.equal(b5Signal.provenance.currentEpisodeEstablished, true, 'B5 must carry the real establishment fact through faithfully — not re-derived, not fabricated');

    // ── Step 3: real Memory Layer + Internal Pipeline Orchestrator, end-to-end via run() ──
    const runResult = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'acceptance-run-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    assert.equal(runResult.status, 'SUCCESS');

    const pipelineContext = runResult.output.pipelineContext;
    assert.equal(pipelineContext.availability.initiativeIntelligence, 'AVAILABLE');
    const realSignal = pipelineContext.initiativeIntelligence.signals.find((s) => s.id === 'HABIT:nutrition:log-consistency');
    assert.notEqual(realSignal, undefined, 'the real established WEAKENING signal must reach Pipeline Context via the real Memory Layer assembly, unaltered');
    assert.equal(realSignal.provenance.currentEpisodeEstablished, true);

    // ── Step 4-9: real Initiative Engine (ContextualMeaning -> Product Reason Policy ->
    // DetectedOpportunity) -> real Stage-3 aggregation -> real Stage-4 Evidence Evaluation ->
    // real Stage 4->5 handoff -> real EligibilityEvaluator -> Silence. All of this already ran
    // inside Orchestrator.run() above; verify its real trace below. ──
    const terminalDecision = runResult.output.terminalDecision;
    assert.equal(terminalDecision.kind, 'SILENCE', 'the approved V1 path resolves to a Decision-Pass-level Silence — this is correct, expected Product behavior, not a failure');

    const considered = terminalDecision.decisionPassTrace.opportunitiesConsidered;
    const ourEntry = considered.find((c) => c.sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION' && String(c.opportunityId || '').indexOf('log-consistency') !== -1);
    assert.notEqual(ourEntry, undefined, 'expected the real, non-fabricated DetectedOpportunity to actually reach Stage 5 and be recorded in the Decision Pass trace');
    assert.equal(ourEntry.internalOutcome, 'INELIGIBLE');
    assert.equal(ourEntry.reason, 'TRUST_TEST_UNCERTAIN', 'the expected Stage-5 result for this V1 path');
    assert.notEqual(ourEntry.internalOutcome, 'MALFORMED', 'this path must never resolve MALFORMED — validReasonCategory/trustTestSignal/lowCoachingValuePeriodActive must all be well-formed');

    // ── Determinism: replaying the exact same real state twice produces the identical Stage-5 outcome ──
    const runResult2 = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'acceptance-run-2', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    const considered2 = runResult2.output.terminalDecision.decisionPassTrace.opportunitiesConsidered;
    const ourEntry2 = considered2.find((c) => c.sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION' && String(c.opportunityId || '').indexOf('log-consistency') !== -1);
    assert.equal(ourEntry2.internalOutcome, ourEntry.internalOutcome);
    assert.equal(ourEntry2.reason, ourEntry.reason);
  } finally {
    clock.restore();
  }
});

test('G-2 acceptance: the real recovery arc (WEAKENING -> CONFIRMED/ACTIVE within the same episode) produces no DetectedOpportunity once recovered — the V1 rule fires only during real WEAKENING', async () => {
  const env = makeEnv();
  const clock = useVirtualClock();
  try {
    // Establish (70d), degrade into WEAKENING but not INACTIVE (20d stop — proven arc), then
    // resume real logging until real recovery to CONFIRMED/ACTIVE.
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 20)).concat(plansOf(nutritionLoggingPlan, 60));
    // Stop only once the real establish->weaken arc has actually happened (day >= 90, i.e. past
    // the 70-day establish + 20-day weaken phases) — guards against accidentally stopping during
    // day 0-69's own initial establishment-to-active climb.
    const trace = await driveRealHabitEngine(env, clock, '2026-01-01', plans, (h, day) => day >= 90 && (h.status === 'confirmed' || h.status === 'active'));

    const recovered = trace[trace.length - 1];
    assert.notEqual(recovered.habit, null);
    assert.ok(recovered.habit.status === 'confirmed' || recovered.habit.status === 'active', 'setup precondition: the real Habit Engine must recover to CONFIRMED/ACTIVE after the real WEAKENING phase');
    assert.equal(recovered.habit.currentEpisodeEstablished, true);
    const runResult = await Orchestrator.run({ userId: 'user-1', sessionGeneration: 1, runId: 'acceptance-recovery-run', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    const considered = runResult.output.terminalDecision.decisionPassTrace.opportunitiesConsidered;
    const ourEntry = considered.find((c) => String(c.opportunityId || '').indexOf('log-consistency') !== -1);
    assert.equal(ourEntry, undefined, 'once recovered to CONFIRMED/ACTIVE, no Reason Policy rule applies — no DetectedOpportunity should reach Stage 5 for this signal at all');
  } finally {
    clock.restore();
  }
});
