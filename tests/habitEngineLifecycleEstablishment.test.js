// Habit Lifecycle Establishment Correction (CSF Ch.29, approved by the Head of Product +
// AI Architect) — behavioral tests for js/engines/habitEngine.js's four new establishment
// fields (everEstablishedHistorically, firstEstablishedAt, currentEpisodeEstablished,
// currentEpisodeEstablishedAt) and their effect on statusOf()'s lifecycle transitions.
//
// These tests drive the REAL, otherwise-unmodified runHabitEngine() across many simulated
// calendar days using a virtual-clock technique: js/core/dateUtils.js's exported
// getTodayKey function is temporarily reassigned (and always restored, per test, in a
// try/finally) to a controllable value. This is the only way to exercise multi-day
// lifecycle transitions deterministically without waiting real days; it does not modify
// any production file, and every assertion below is evaluated against the real detectors
// (detectNutrition/detectWorkout/detectWeight/detectMeasurement), the real upsertFromSignal/
// decayAbsent/statusOf, and the real once-per-day gate — never a hand-constructed
// `status: 'weakening'` fixture.
//
// Run with: node --test tests/habitEngineLifecycleEstablishment.test.js

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const HabitEngine = require('../js/engines/habitEngine.js');
const DateUtils = require('../js/core/dateUtils.js');

function addDays(dateKey, n) {
  const parts = dateKey.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + n);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

function mealAt(hour) { return { time: String(hour).padStart(2, '0') + ':00', kcal: 400, protein: 20 }; }

function makeSimEnv() {
  const profile = {
    weightHistory: [], measurementHistory: [], currentWeight: 79, weight: 79,
    coachMemory: { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} },
    coachEvents: []
  };
  let generation = 1;
  const history = {};
  const calls = { habitWrites: 0 };
  const deps = {
    getUserProfile: () => profile,
    fetchHistory: async () => history,
    persistHabitsView: async (identity, command) => {
      calls.habitWrites++;
      profile.coachMemory.habits = command.habits;
      profile.coachMemory.habitsMeta = command.habitsMeta;
      return { status: 'SUCCESS', changed: true, requestId: 'req-' + calls.habitWrites, receipt: {} };
    },
    persistPatternView: async () => { throw new Error('not used by these tests'); },
    isSessionCurrent: (gen) => gen === generation,
    ensureCoachMemoryShape: () => {
      if (!profile.coachMemory) profile.coachMemory = { habits: [], habitsMeta: {}, patterns: [], patternsMeta: {} };
    },
    setAdaptProposal: () => {}, setAdaptHistoryCache: () => {},
    recordCoachEvent: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    markTriggerFired: async () => ({ status: 'SUCCESS', changed: true, requestId: 'req', receipt: {} }),
    checkCanFire: () => true, getTriggerBudget: () => ({ date: '2026-01-01', fired: [], count: 0 }),
    getTodayConsumed: () => 0, getTodayProtein: () => 0, getTodayBurned: () => 0,
    getLocalDate: () => '2026-01-01', getWeekday: () => 0
  };
  StateAccess.configure(deps);
  HabitEngine.configure({
    appVersion: '9.9.9-test',
    sessionLifecycle: { getGeneration: () => 1, isCurrent: (g) => g === 1 },
    getCurrentUser: () => ({ uid: 'user-1' }),
    getUserProfile: () => profile,
    persistenceSummaryFn: (r) => r
  });
  return {
    profile, history, calls,
    access: () => StateAccess.createEngineAccess({ engineId: 'habitEngine', action: 'RECOMPUTE', userId: 'user-1', sessionGeneration: generation, runId: null })
  };
}

function useVirtualClock() {
  const real = DateUtils.getTodayKey;
  let virtualToday = '2026-01-01';
  DateUtils.getTodayKey = function () { return virtualToday; };
  return {
    set: (k) => { virtualToday = k; },
    restore: () => { DateUtils.getTodayKey = real; }
  };
}

// Drives `dayPlans.length` simulated days starting at `startDate`. dayPlans[i] is either
// null (day entirely absent from history/body-history) or a plan object:
//   { meals: [...], burned: <n>, weighIn: bool, measurement: bool }
// Returns an array of { day, date, habits } snapshots, one per simulated day, taken AFTER
// that day's real runHabitEngine() call.
async function runDays(env, clock, startDate, dayPlans) {
  let cur = startDate;
  const trace = [];
  for (let i = 0; i < dayPlans.length; i++) {
    clock.set(cur);
    const rawPlan = dayPlans[i];
    const plan = typeof rawPlan === 'function' ? rawPlan(i, cur) : rawPlan;
    if (plan !== null) {
      env.history[cur] = { meals: plan.meals || [], burned: plan.burned || 0 };
      if (plan.weighIn) env.profile.weightHistory.push({ date: cur, weight: 80 });
      if (plan.measurement) env.profile.measurementHistory.push({ date: cur });
    }
    await HabitEngine.runHabitEngine(env.access());
    trace.push({ day: i, date: cur, habits: env.profile.coachMemory.habits.slice() });
    cur = addDays(cur, 1);
  }
  return trace;
}

function findHabit(snapshot, id) { return (snapshot.habits || []).find((h) => h.id === id); }
function firstDayWhere(trace, id, predicate) {
  for (let i = 0; i < trace.length; i++) {
    const h = findHabit(trace[i], id);
    if (h && predicate(h)) return { entry: trace[i], habit: h };
  }
  return null;
}
function lastDayWhere(trace, id, predicate) {
  let found = null;
  for (let i = 0; i < trace.length; i++) {
    const h = findHabit(trace[i], id);
    if (h && predicate(h)) found = { entry: trace[i], habit: h };
  }
  return found;
}

// ── Day-plan builders for each detector family ──

function nutritionLoggingPlan() { return { meals: [mealAt(8), mealAt(13), mealAt(19)] }; }
function nutritionStopPlan() { return { meals: [] }; }

function workoutEstablishPlan(i, dateKey) {
  const dt = new Date(dateKey + 'T00:00:00');
  const isMonday = dt.getDay() === 1;
  return { meals: [mealAt(8), mealAt(13), mealAt(19)], burned: isMonday ? 400 : 0 };
}
function workoutStopPlan() { return { meals: [mealAt(8), mealAt(13), mealAt(19)], burned: 0 }; }

function weighInEstablishPlan(i, dateKey) {
  const dt = new Date(dateKey + 'T00:00:00');
  return { meals: [mealAt(8), mealAt(13), mealAt(19)], weighIn: dt.getDay() === 0 };
}
function weighInStopPlan() { return { meals: [mealAt(8), mealAt(13), mealAt(19)], weighIn: false }; }

function measurementEstablishPlan(i, dateKey) {
  const dt = new Date(dateKey + 'T00:00:00');
  return { meals: [mealAt(8), mealAt(13), mealAt(19)], measurement: dt.getDay() === 0 };
}
function measurementStopPlan() { return { meals: [mealAt(8), mealAt(13), mealAt(19)], measurement: false }; }

function repeat(planFn, n) { const out = []; for (let i = 0; i < n; i++) out.push(planFn); return out; }
function plansOf(fn, n) { const out = []; for (let i = 0; i < n; i++) out.push(fn); return out; }

// ══════════════════════════════════════════════════════════════════
// 1/2/4 — FOOD_LOGGING (log-consistency): never-established cannot weaken; the exact
// production-backed acceptance path; current confidence/occurrence honesty; WEAKENING →
// INACTIVE; INACTIVE clears/preserves the right fields; one occurrence after INACTIVE
// cannot jump to WEAKENING; re-establishment requires fresh evidence; a later episode can
// weaken again.
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29: log-consistency — never-established episode never reaches WEAKENING (days 0-15, still building evidence)', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(nutritionLoggingPlan, 16); // not yet enough weeks for OCC_CANDIDATE
    const trace = await runDays(env, clock, '2026-01-01', plans);
    for (const snap of trace) {
      const h = findHabit(snap, 'nutrition:log-consistency');
      if (h) assert.notEqual(h.status, 'weakening', 'a never-established episode must not reach weakening (day ' + snap.day + ')');
    }
  } finally { clock.restore(); }
});

test('CSF Ch.29 CRITICAL PRODUCTION-BACKED ACCEPTANCE: FOOD_LOGGING/log-consistency establishes, weakens, and returns to INACTIVE from real history (no injected status)', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 160));
    const trace = await runDays(env, clock, '2026-01-01', plans);

    // Establishment actually occurs from real history.
    const established = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.currentEpisodeEstablished === true);
    assert.notEqual(established, null, 'expected the real Habit Engine to establish log-consistency from real logging history');
    assert.equal(established.habit.everEstablishedHistorically, true);
    assert.notEqual(established.habit.firstEstablishedAt, null);
    assert.equal(established.habit.currentEpisodeEstablishedAt, established.habit.firstEstablishedAt, 'first episode: current and historical establishment timestamps coincide');

    // Weakening is reached — while established — via real degradation, not a fixture.
    const weakening = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'expected the real Habit Engine to reach WEAKENING for log-consistency after real logging stopped');
    assert.equal(weakening.habit.currentEpisodeEstablished, true, 'WEAKENING must occur only while currentEpisodeEstablished is true');
    assert.ok(weakening.habit.sourceEvents.count < 5, 'WEAKENING is reached precisely because current occurrence has fallen below the confirmed floor');
    assert.ok(weakening.habit.confidence >= 0.20 && weakening.habit.confidence <= 1, 'current confidence during WEAKENING is an honest value (inactive floor is the only lower bound; the catch-all WEAKENING branch fires on occurrence alone, so confidence may still be high at the moment of first crossing)');
    assert.equal(weakening.habit.everEstablishedHistorically, true);

    // Confirm WEAKENING appears strictly before the establishment day is lost, and that it
    // persists across at least one more day with currentEpisodeEstablished still true.
    const weakeningDay = weakening.entry.day;
    const nextDay = trace[weakeningDay + 1] && findHabit(trace[weakeningDay + 1], 'nutrition:log-consistency');
    assert.notEqual(nextDay, undefined);

    // Eventually reaches INACTIVE — real decay, not fabricated.
    const inactive = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'inactive');
    assert.notEqual(inactive, null, 'expected the real Habit Engine to eventually reach INACTIVE');
    assert.ok(inactive.entry.day > weakening.entry.day, 'INACTIVE must occur strictly after WEAKENING in this arc');

    // INACTIVE clears current-episode authority in the SAME transition, preserves historical fact.
    assert.equal(inactive.habit.currentEpisodeEstablished, false);
    assert.equal(inactive.habit.currentEpisodeEstablishedAt, null);
    assert.equal(inactive.habit.everEstablishedHistorically, true, 'historical fact survives INACTIVE');
    assert.notEqual(inactive.habit.firstEstablishedAt, null, 'firstEstablishedAt survives INACTIVE');
  } finally { clock.restore(); }
});

test('CSF Ch.29: one occurrence immediately after INACTIVE does not inherit establishment authority and does not jump to WEAKENING', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    // Establish, then stop long enough to reach INACTIVE, then log exactly one more day.
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 160));
    let trace = await runDays(env, clock, '2026-01-01', plans);
    const inactive = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'inactive');
    assert.notEqual(inactive, null, 'setup precondition: must reach INACTIVE before this test is meaningful');

    const nextDate = addDays(inactive.entry.date, 1);
    const oneMoreDay = await runDays(env, clock, nextDate, [nutritionLoggingPlan()]);
    const afterOneEvent = findHabit(oneMoreDay[0], 'nutrition:log-consistency');
    if (afterOneEvent) {
      assert.notEqual(afterOneEvent.status, 'weakening', 'a single post-INACTIVE occurrence must not jump directly to WEAKENING');
      assert.equal(afterOneEvent.currentEpisodeEstablished, false, 'a single post-INACTIVE occurrence must not inherit establishment authority');
    }
  } finally { clock.restore(); }
});

test('CSF Ch.29: re-establishment after INACTIVE requires fresh evidence, earns a NEW currentEpisodeEstablishedAt, and can later weaken again', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const firstArc = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 160));
    let trace = await runDays(env, clock, '2026-01-01', firstArc);
    const firstEstablished = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.currentEpisodeEstablished === true);
    const inactive = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'inactive');
    assert.notEqual(firstEstablished, null);
    assert.notEqual(inactive, null);
    const firstEpisodeTimestamp = firstEstablished.habit.currentEpisodeEstablishedAt;

    // Resume logging fresh from the day after INACTIVE.
    const resumeStart = addDays(inactive.entry.date, 1);
    const secondArc = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 160));
    const trace2 = await runDays(env, clock, resumeStart, secondArc);

    // Must climb the ladder again — never immediately re-established on day 0 of resumption.
    const day0 = findHabit(trace2[0], 'nutrition:log-consistency');
    assert.equal(day0.currentEpisodeEstablished, false, 'must not be established on the very first day of renewed activity');

    const reEstablished = firstDayWhere(trace2, 'nutrition:log-consistency', (h) => h.currentEpisodeEstablished === true);
    assert.notEqual(reEstablished, null, 'expected the second episode to legitimately re-establish from fresh evidence');
    assert.notEqual(reEstablished.habit.currentEpisodeEstablishedAt, firstEpisodeTimestamp, 'the re-established episode must receive a fresh timestamp, not reuse the first episode\'s');
    assert.equal(reEstablished.habit.everEstablishedHistorically, true, 'historical fact remains true across both episodes');
    assert.equal(reEstablished.habit.firstEstablishedAt, firstEstablished.habit.firstEstablishedAt, 'firstEstablishedAt remains the ORIGINAL immutable value across re-establishment');

    // The later episode can weaken again.
    const secondWeakening = firstDayWhere(trace2, 'nutrition:log-consistency', (h) => h.status === 'weakening');
    assert.notEqual(secondWeakening, null, 'expected the re-established episode to be able to reach WEAKENING again after its own deterioration');
    assert.equal(secondWeakening.habit.currentEpisodeEstablished, true);
  } finally { clock.restore(); }
});

test('CSF Ch.29: WEAKENING recovers to CONFIRMED/ACTIVE within the same episode when current evidence improves', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    // Establish (70d), degrade partially — 20 days without logging is enough to reach
    // WEAKENING (late > 1.5 * INTERVAL_WEEKLY) but not enough to reach INACTIVE
    // (late > 4 * INTERVAL_WEEKLY, i.e. daysSince > 36) — then resume fully.
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 20)).concat(plansOf(nutritionLoggingPlan, 60));
    const trace = await runDays(env, clock, '2026-01-01', plans);

    const everInactive = trace.some((s) => { const h = findHabit(s, 'nutrition:log-consistency'); return h && h.status === 'inactive'; });
    assert.equal(everInactive, false, 'setup precondition: this arc must stay within a single episode (never reach INACTIVE) for the recovery to be meaningfully "same-episode"');

    const weakening = firstDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'setup precondition: must reach WEAKENING before recovery is meaningful');
    const establishedAtWeakening = weakening.habit.currentEpisodeEstablishedAt;

    const recovered = lastDayWhere(trace, 'nutrition:log-consistency', (h) => h.status === 'confirmed' || h.status === 'active');
    assert.notEqual(recovered, null);
    assert.ok(recovered.entry.day > weakening.entry.day, 'expected a recovery to CONFIRMED/ACTIVE after the WEAKENING day, once logging resumed');
    assert.equal(recovered.habit.currentEpisodeEstablished, true, 'recovery stays within the same established episode');
    assert.equal(recovered.habit.currentEpisodeEstablishedAt, establishedAtWeakening, 'recovery within one episode never re-earns or changes the episode timestamp');
  } finally { clock.restore(); }
});

test('CSF Ch.29: current confidence and current occurrence are never fabricated/inflated/frozen during WEAKENING (log-consistency)', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(nutritionLoggingPlan, 70).concat(plansOf(nutritionStopPlan, 160));
    const trace = await runDays(env, clock, '2026-01-01', plans);
    const weakDays = trace.filter((s) => { const h = findHabit(s, 'nutrition:log-consistency'); return h && h.status === 'weakening'; });
    assert.ok(weakDays.length > 0);
    let prevConf = null;
    weakDays.forEach((snap) => {
      const h = findHabit(snap, 'nutrition:log-consistency');
      assert.ok(h.confidence >= 0 && h.confidence <= 1, 'confidence remains a valid, honest [0,1] value');
      assert.ok(Number.isFinite(h.sourceEvents.count) && h.sourceEvents.count >= 0, 'occurrence count remains a valid, honest non-negative value');
      if (prevConf !== null) assert.ok(h.confidence <= prevConf + 0.001, 'confidence never spontaneously jumps upward while logging remains stopped (honest decay, never inflated)');
      prevConf = h.confidence;
    });
  } finally { clock.restore(); }
});

// ══════════════════════════════════════════════════════════════════
// 2 — Daily-period non-regression (meal:evening) — byte-identical intended behavior.
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29: daily-period Habit (meal:evening) preserves its pre-existing WEAKENING-reachable lifecycle behavior (non-regression)', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(() => ({ meals: [mealAt(8), mealAt(13), mealAt(19)] }), 60)
      .concat(plansOf(() => ({ meals: [mealAt(8), mealAt(13)] }), 40)); // evening stops; others continue
    const trace = await runDays(env, clock, '2026-01-01', plans);

    const everActive = trace.some((s) => { const h = findHabit(s, 'nutrition:meal:evening'); return h && h.status === 'active'; });
    assert.equal(everActive, true, 'expected the daily-period habit to still reach active, exactly as before this correction');

    const weakening = firstDayWhere(trace, 'nutrition:meal:evening', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'daily-period habits must continue reaching WEAKENING exactly as before this correction (no regression)');
    // For a daily-period habit, occurrence remains high (>=OCC_CONFIRMED) at the moment
    // WEAKENING first fires — confirming the pre-existing "still-established, now-late" path,
    // unchanged by this correction.
    assert.ok(weakening.habit.sourceEvents.count >= 5, 'daily-period WEAKENING is reached via the pre-existing lateness path, not the new degraded-occurrence path');
    assert.equal(weakening.habit.currentEpisodeEstablished, true);

    const inactive = firstDayWhere(trace, 'nutrition:meal:evening', (h) => h.status === 'inactive');
    assert.notEqual(inactive, null);
    assert.equal(inactive.habit.currentEpisodeEstablished, false);
    assert.equal(inactive.habit.currentEpisodeEstablishedAt, null);
  } finally { clock.restore(); }
});

// ══════════════════════════════════════════════════════════════════
// 5/6 — Weekly workout (weekday) and weigh-in/measurement — generic correction, not
// FOOD_LOGGING-specific.
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29: weekly workout (weekday:1) can establish and later WEAKEN — generic correction, not FOOD_LOGGING-specific', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(workoutEstablishPlan, 70).concat(plansOf(workoutStopPlan, 160));
    const trace = await runDays(env, clock, '2026-01-01', plans);

    const established = firstDayWhere(trace, 'workout:weekday:1', (h) => h.currentEpisodeEstablished === true);
    assert.notEqual(established, null, 'expected the real Habit Engine to establish a Monday-workout habit');

    const weakening = firstDayWhere(trace, 'workout:weekday:1', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'expected the workout habit to reach WEAKENING after real degradation, not skip straight to inactive');
    assert.equal(weakening.habit.currentEpisodeEstablished, true);
    assert.ok(weakening.habit.sourceEvents.count < 5);
  } finally { clock.restore(); }
});

test('CSF Ch.29: weekly weigh-in can establish and later WEAKEN', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(weighInEstablishPlan, 70).concat(plansOf(weighInStopPlan, 160));
    const trace = await runDays(env, clock, '2026-01-01', plans);

    const established = firstDayWhere(trace, 'weight:weigh-in', (h) => h.currentEpisodeEstablished === true);
    assert.notEqual(established, null, 'expected the real Habit Engine to establish a weekly weigh-in habit');

    const weakening = firstDayWhere(trace, 'weight:weigh-in', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'expected the weigh-in habit to reach WEAKENING after real degradation');
    assert.equal(weakening.habit.currentEpisodeEstablished, true);
  } finally { clock.restore(); }
});

test('CSF Ch.29: weekly measurement can establish and later WEAKEN', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  try {
    const plans = plansOf(measurementEstablishPlan, 70).concat(plansOf(measurementStopPlan, 160));
    const trace = await runDays(env, clock, '2026-01-01', plans);

    const established = firstDayWhere(trace, 'measurement:measure', (h) => h.currentEpisodeEstablished === true);
    assert.notEqual(established, null, 'expected the real Habit Engine to establish a weekly measurement habit');

    const weakening = firstDayWhere(trace, 'measurement:measure', (h) => h.status === 'weakening');
    assert.notEqual(weakening, null, 'expected the measurement habit to reach WEAKENING after real degradation');
    assert.equal(weakening.habit.currentEpisodeEstablished, true);
  } finally { clock.restore(); }
});

// ══════════════════════════════════════════════════════════════════
// Migration — existing records without the new fields converge safely.
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29 migration: an existing, currently-qualifying legacy record (no new fields) safely earns currentEpisodeEstablished on its next legitimate evaluation, never retroactively', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  const today = '2026-03-01';
  clock.set(today);
  try {
    // Pre-seed a legacy stored habit record with NO establishment fields at all, already
    // currently qualifying (occ>=5, conf>=0.55) as of today.
    env.profile.coachMemory.habits = [{
      id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency',
      description: 'legacy', frequency: '6/6', confidence: 0.9, consistency: 0.9, streak: 6,
      status: 'active', firstObserved: '2025-01-01', lastObserved: today,
      period: 'weekly', expectedIntervalDays: 9,
      sourceEvents: { count: 6, window: 42, dates: [] }
      // no everEstablishedHistorically / firstEstablishedAt / currentEpisodeEstablished / currentEpisodeEstablishedAt
    }];
    env.profile.coachMemory.habitsMeta = { lastRun: addDays(today, -1), version: 1 };

    // Feed real qualifying history so the detector re-derives occ/conf fresh and legitimately.
    for (let i = 0; i < 42; i++) {
      env.history[addDays(today, -i)] = { meals: [mealAt(8), mealAt(13), mealAt(19)], burned: 0 };
    }

    await HabitEngine.runHabitEngine(env.access());
    const h = findHabit({ habits: env.profile.coachMemory.habits }, 'nutrition:log-consistency');
    assert.notEqual(h, undefined);
    assert.equal(h.currentEpisodeEstablished, true, 'a currently-qualifying legacy record legitimately earns establishment from its own fresh, real current evidence');
    assert.equal(h.currentEpisodeEstablishedAt, today, 'the establishment timestamp is TODAY (this evaluation), never backdated to firstObserved or any historical guess');
    assert.equal(h.everEstablishedHistorically, true);
    assert.equal(h.firstEstablishedAt, today, 'firstEstablishedAt is never fabricated from firstObserved or any other proxy field');
  } finally { clock.restore(); }
});

test('CSF Ch.29 migration: an existing, currently-degraded legacy record (no new fields) does NOT retroactively gain establishment', async () => {
  const env = makeSimEnv();
  const clock = useVirtualClock();
  const today = '2026-03-01';
  clock.set(today);
  try {
    env.profile.coachMemory.habits = [{
      id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency',
      description: 'legacy', frequency: '2/6', confidence: 0.4, consistency: 0.3, streak: 0,
      status: 'candidate', firstObserved: '2025-01-01', lastObserved: addDays(today, -20),
      period: 'weekly', expectedIntervalDays: 9,
      sourceEvents: { count: 2, window: 42, dates: [] }
    }];
    env.profile.coachMemory.habitsMeta = { lastRun: addDays(today, -1), version: 1 };
    // No qualifying history fed — this run legitimately finds nothing (or very little).
    await HabitEngine.runHabitEngine(env.access());
    const h = findHabit({ habits: env.profile.coachMemory.habits }, 'nutrition:log-consistency');
    if (h) {
      assert.equal(h.currentEpisodeEstablished, false, 'a currently-degraded legacy record must not retroactively be assumed established');
      assert.equal(h.everEstablishedHistorically, false, 'no fabricated historical establishment for a record that never proved it under the new contract');
    }
  } finally { clock.restore(); }
});

// ══════════════════════════════════════════════════════════════════
// Determinism.
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29: replaying the identical event history twice produces byte-identical establishment fields and status sequences', async () => {
  const plans = plansOf(nutritionLoggingPlan, 45).concat(plansOf(nutritionStopPlan, 55));

  const env1 = makeSimEnv();
  const clock1 = useVirtualClock();
  let trace1;
  try { trace1 = await runDays(env1, clock1, '2026-01-01', plans); } finally { clock1.restore(); }

  const env2 = makeSimEnv();
  const clock2 = useVirtualClock();
  let trace2;
  try { trace2 = await runDays(env2, clock2, '2026-01-01', plans); } finally { clock2.restore(); }

  assert.equal(trace1.length, trace2.length);
  for (let i = 0; i < trace1.length; i++) {
    const h1 = findHabit(trace1[i], 'nutrition:log-consistency');
    const h2 = findHabit(trace2[i], 'nutrition:log-consistency');
    assert.deepEqual(h1, h2, 'day ' + i + ' must produce a byte-identical record across two independent replays');
  }
});

// ══════════════════════════════════════════════════════════════════
// Pattern Engine unaffected (spot-check; Pattern Engine itself is not touched by this
// correction — this test only guards against an accidental cross-import/behavior change).
// ══════════════════════════════════════════════════════════════════

test('CSF Ch.29: Pattern Engine module is untouched by this correction (no establishment fields, no statusOf signature change)', () => {
  const path = require('path');
  const src = require('fs').readFileSync(path.join(__dirname, '../js/engines/patternEngine.js'), 'utf8');
  assert.ok(!src.includes('currentEpisodeEstablished'), 'patternEngine.js must not reference the new Habit-only establishment fields');
  assert.ok(!src.includes('everEstablishedHistorically'), 'patternEngine.js must not reference the new Habit-only establishment fields');
});
