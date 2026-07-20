// C1-WP7 — js/adaptive/adaptiveTdeeDomain.js unit tests.
// Covers: rate selection, day window construction, day classification, partial-day
// detection, TDEE calculation (thresholds/fallback/softening), measurement analysis,
// weekly signal construction (full scenario matrix), deficit adjustment, proposal
// construction, and local explanation — all as pure functions of their parameters.
// Run with: node --test tests/adaptiveTdeeDomain.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/adaptive/adaptiveTdeeDomain.js');

function todayKeyOffset(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function fullHistory(days, kcalEach) {
  const h = {};
  for (let i = 1; i <= days; i++) h[todayKeyOffset(i)] = { meals: [{ kcal: kcalEach }] };
  return h;
}

function weightHistorySpanning(startDaysAgo, endDaysAgo, weights) {
  // weights: array from oldest to newest
  const points = [];
  const span = startDaysAgo - endDaysAgo;
  weights.forEach((w, i) => {
    const daysAgo = startDaysAgo - Math.round((span * i) / (weights.length - 1));
    points.push({ date: todayKeyOffset(daysAgo), weight: w });
  });
  return points;
}

// ── adaptRate / adaptEnabled ────────────────────────────────────────────────────────────

test('adaptRate defaults to "balanced" when absent, no profile, or invalid', () => {
  assert.equal(D.adaptRate({ rate: 'gentle' }), 'gentle');
  assert.equal(D.adaptRate({ rate: 'aggressive' }), 'aggressive');
  assert.equal(D.adaptRate({}), 'balanced');
  assert.equal(D.adaptRate(null), 'balanced');
  assert.equal(D.adaptRate({ rate: 'nonsense' }), 'balanced');
});

test('adaptEnabled defaults to true (enabled) unless explicitly false, or no profile', () => {
  assert.equal(D.adaptEnabled({}), true);
  assert.equal(D.adaptEnabled(null), true);
  assert.equal(D.adaptEnabled({ adaptiveEnabled: false }), false);
  assert.equal(D.adaptEnabled({ adaptiveEnabled: true }), true);
});

// ── daysInWindow ─────────────────────────────────────────────────────────────────────────

test('daysInWindow includes today (from todayData) as the first entry, and history for the rest', () => {
  const todayData = { meals: [{ kcal: 500 }] };
  const history = { [todayKeyOffset(1)]: { meals: [{ kcal: 300 }] } };
  const days = D.daysInWindow(history, todayData, 3);
  assert.equal(days.length, 3);
  assert.equal(days[0].kcal, 500);
  assert.equal(days[0].hasMeals, true);
  assert.equal(days[1].kcal, 300);
  assert.equal(days[2].kcal, 0);
  assert.equal(days[2].hasMeals, false);
});

// ── classifyDay ──────────────────────────────────────────────────────────────────────────

test('classifyDay: empty when no meals or non-positive kcal', () => {
  assert.equal(D.classifyDay({ key: 'k', kcal: 0, hasMeals: false }, 2000, []), 'empty');
  assert.equal(D.classifyDay({ key: 'k', kcal: -5, hasMeals: true }, 2000, []), 'empty');
});

test('classifyDay: full when kcal >= 50% of goal', () => {
  assert.equal(D.classifyDay({ key: 'k', kcal: 1000, hasMeals: true }, 2000, []), 'full');
  assert.equal(D.classifyDay({ key: 'k', kcal: 1500, hasMeals: true }, 2000, []), 'full');
});

test('classifyDay: light when under 50% but explicitly confirmed; otherwise partial', () => {
  assert.equal(D.classifyDay({ key: 'k', kcal: 400, hasMeals: true }, 2000, ['k']), 'light');
  assert.equal(D.classifyDay({ key: 'k', kcal: 400, hasMeals: true }, 2000, []), 'partial');
});

// ── pendingPartialDays ──────────────────────────────────────────────────────────────────

test('pendingPartialDays returns [] with no profile', () => {
  assert.deepEqual(D.pendingPartialDays({}, {}, null), []);
});

test('pendingPartialDays flags only days classified as partial', () => {
  const todayData = { meals: [{ kcal: 300 }] }; // under 50% of 2000 -> partial (not confirmed)
  const profile = { goalKcal: 2000, confirmedLightDays: [] };
  const suspects = D.pendingPartialDays({}, todayData, profile);
  assert.ok(suspects.length >= 1);
  assert.ok(suspects.every((d) => d.kcal === 300));
});

test('pendingPartialDays excludes a day once it is confirmed light', () => {
  const todayData = { meals: [{ kcal: 300 }] };
  const todayKey = todayKeyOffset(0);
  const profile = { goalKcal: 2000, confirmedLightDays: [todayKey] };
  const suspects = D.pendingPartialDays({}, todayData, profile);
  assert.ok(!suspects.some((d) => d.key === todayKey));
});

// ── computeAdaptiveTdee ──────────────────────────────────────────────────────────────────

test('computeAdaptiveTdee: enoughData is false when there are too few counted days', () => {
  const todayData = { meals: [] };
  const calc = D.computeAdaptiveTdee({}, { goalKcal: 2000 }, todayData);
  assert.equal(calc.enoughData, false);
  assert.equal(calc.enoughDays, false);
  assert.equal(calc.nDays, 0);
});

test('computeAdaptiveTdee: enoughData is false when there are too few weights or span < 10 days', () => {
  const todayData = { meals: [{ kcal: 1900 }] };
  const history = fullHistory(13, 1900);
  const profile = { goalKcal: 2000, weightHistory: weightHistorySpanning(5, 0, [80, 79.5]) }; // only 2 points, span 5
  const calc = D.computeAdaptiveTdee(history, profile, todayData);
  assert.equal(calc.enoughDays, true);
  assert.equal(calc.enoughWeights, false);
  assert.equal(calc.enoughData, false);
});

test('computeAdaptiveTdee: enoughData true with sufficient days and weights spanning >= 10 days', () => {
  const todayData = { meals: [{ kcal: 1900 }] };
  const history = fullHistory(13, 1900);
  const profile = { goalKcal: 2000, weightHistory: weightHistorySpanning(12, 0, [82, 81, 80]) };
  const calc = D.computeAdaptiveTdee(history, profile, todayData);
  assert.equal(calc.enoughData, true);
  assert.equal(calc.avgIntake, 1900);
  assert.ok(calc.slopeKgPerWeek < 0, 'losing weight should produce a negative weekly slope');
});

test('computeAdaptiveTdee: softens (clamps) the delta from the previous TDEE to +/- 250', () => {
  const todayData = { meals: [{ kcal: 4000 }] }; // very high intake, no weight loss -> would jump TDEE a lot
  const history = fullHistory(13, 4000);
  const profile = { goalKcal: 2000, adaptiveTdee: 2000, weightHistory: weightHistorySpanning(12, 0, [80, 80, 80]) };
  const calc = D.computeAdaptiveTdee(history, profile, todayData);
  assert.ok(Math.abs(calc.tdee - 2000) <= 250, 'tdee must not move more than ADAPT_MAX_STEP from the previous value');
});

test('computeAdaptiveTdee: clamps the final tdee into [1200, 5000]', () => {
  const todayData = { meals: [{ kcal: 100 }] };
  const history = fullHistory(13, 100);
  const profile = { goalKcal: 2000, weightHistory: weightHistorySpanning(12, 0, [100, 100, 100]) }; // flat weight, tiny intake
  const calc = D.computeAdaptiveTdee(history, profile, todayData);
  assert.ok(calc.tdee >= 1200 && calc.tdee <= 5000);
});

// ── analyzeMeasurements ──────────────────────────────────────────────────────────────────

test('analyzeMeasurements returns all-null trends with count 0 when no profile / no history', () => {
  assert.deepEqual(D.analyzeMeasurements(), { waist: null, arm: null, chest: null, count: 0 });
  assert.deepEqual(D.analyzeMeasurements({}), { waist: null, arm: null, chest: null, count: 0 });
});

test('analyzeMeasurements computes a weekly trend from >= 2 recent points, and null when only 1', () => {
  const mh = [
    { date: todayKeyOffset(20), waist: 90 },
    { date: todayKeyOffset(10), waist: 88 },
    { date: todayKeyOffset(0), waist: 86 }
  ];
  const meas = D.analyzeMeasurements({ measurementHistory: mh });
  assert.ok(meas.waist < 0, 'shrinking waist should produce a negative weekly trend');
  assert.equal(meas.arm, null, 'arm has no data points -> null');
  assert.equal(meas.count, 3);
});

test('analyzeMeasurements ignores entries older than the 28-day cutoff', () => {
  const mh = [{ date: todayKeyOffset(60), waist: 100 }, { date: todayKeyOffset(50), waist: 95 }];
  const meas = D.analyzeMeasurements({ measurementHistory: mh });
  assert.equal(meas.waist, null);
  assert.equal(meas.count, 0);
});

// ── buildWeeklySignals ───────────────────────────────────────────────────────────────────

function calc(slopeKgPerWeek) { return { slopeKgPerWeek }; }
function meas(overrides) { return Object.assign({ waist: null, arm: null, chest: null }, overrides); }

test('buildWeeklySignals (cut goal): losing-muscle red flag when losing fast and arm shrinking', () => {
  const sig = D.buildWeeklySignals(calc(-1.5), meas({ arm: -0.5 }), { goal: 'cut', currentWeight: 80 });
  assert.equal(sig.scenario, 'losing-muscle');
  assert.equal(sig.redFlag, true);
});

test('buildWeeklySignals (cut goal): clean-cut when waist shrinking and arm stable', () => {
  const sig = D.buildWeeklySignals(calc(-0.3), meas({ waist: -0.5 }), { goal: 'cut', currentWeight: 80 });
  assert.equal(sig.scenario, 'clean-cut');
});

test('buildWeeklySignals (cut goal): recomp when weight flat, waist shrinking, AND arm also shrinking (waistDown && !armDown takes priority otherwise -> clean-cut)', () => {
  const sig = D.buildWeeklySignals(calc(0), meas({ waist: -0.5, arm: -0.5 }), { goal: 'cut', currentWeight: 80 });
  assert.equal(sig.scenario, 'recomp');
});

test('buildWeeklySignals (cut goal): stalled when weight flat and waist not shrinking', () => {
  const sig = D.buildWeeklySignals(calc(0), meas({}), { goal: 'cut', currentWeight: 80 });
  assert.equal(sig.scenario, 'stalled');
});

test('buildWeeklySignals (cut goal): progress when weight dropping without other signals', () => {
  const sig = D.buildWeeklySignals(calc(-0.3), meas({}), { goal: 'cut', currentWeight: 80 });
  assert.equal(sig.scenario, 'progress');
});

test('buildWeeklySignals (bulk goal): dirty-bulk red flag when weight+waist rising without arm gain', () => {
  const sig = D.buildWeeklySignals(calc(0.5), meas({ waist: 0.5 }), { goal: 'bulk', currentWeight: 80 });
  assert.equal(sig.scenario, 'dirty-bulk');
  assert.equal(sig.redFlag, true);
});

test('buildWeeklySignals (bulk goal): clean-bulk when arm growing and waist stable', () => {
  const sig = D.buildWeeklySignals(calc(0.3), meas({ arm: 0.5 }), { goal: 'bulk', currentWeight: 80 });
  assert.equal(sig.scenario, 'clean-bulk');
});

test('buildWeeklySignals (bulk goal): stalled-bulk when weight flat', () => {
  const sig = D.buildWeeklySignals(calc(0), meas({}), { goal: 'bulk', currentWeight: 80 });
  assert.equal(sig.scenario, 'stalled-bulk');
});

test('buildWeeklySignals (bulk goal): gaining when weight rising without other signals', () => {
  const sig = D.buildWeeklySignals(calc(0.3), meas({}), { goal: 'bulk', currentWeight: 80 });
  assert.equal(sig.scenario, 'gaining');
});

test('buildWeeklySignals (maintain goal): drift when slope % exceeds 0.8%, else holding', () => {
  const drifting = D.buildWeeklySignals(calc(-1), meas({}), { goal: 'maintain', currentWeight: 80 });
  assert.equal(drifting.scenario, 'drift');
  const holding = D.buildWeeklySignals(calc(-0.1), meas({}), { goal: 'maintain', currentWeight: 80 });
  assert.equal(holding.scenario, 'holding');
});

// ── computeNextDeficit ───────────────────────────────────────────────────────────────────

test('computeNextDeficit returns 0 for a maintain goal, regardless of signals/rate', () => {
  assert.equal(D.computeNextDeficit({ redFlag: false }, { goal: 'maintain', currentDeficit: -300 }), 0);
});

test('computeNextDeficit uses profile.rate (not a global) to look up the step/target — pure by construction', () => {
  const signals = { redFlag: false };
  const gentle = D.computeNextDeficit(signals, { goal: 'cut', rate: 'gentle', currentDeficit: 0 });
  const aggressive = D.computeNextDeficit(signals, { goal: 'cut', rate: 'aggressive', currentDeficit: 0 });
  assert.equal(gentle, -100, 'gentle rate steps by 100');
  assert.equal(aggressive, -200, 'aggressive rate steps by 200');
});

test('computeNextDeficit (cut, redFlag): softens toward 0 (less deficit), never past 0', () => {
  assert.equal(D.computeNextDeficit({ redFlag: true }, { goal: 'cut', currentDeficit: -300 }), -200);
  assert.equal(D.computeNextDeficit({ redFlag: true }, { goal: 'cut', currentDeficit: -50 }), 0);
});

test('computeNextDeficit (bulk, redFlag): softens toward 0 (less surplus), never below 0', () => {
  assert.equal(D.computeNextDeficit({ redFlag: true }, { goal: 'bulk', currentDeficit: 300 }), 200);
  assert.equal(D.computeNextDeficit({ redFlag: true }, { goal: 'bulk', currentDeficit: 50 }), 0);
});

test('computeNextDeficit (cut, no redFlag): steps deficit down toward the rate target, never past it', () => {
  const d1 = D.computeNextDeficit({ redFlag: false }, { goal: 'cut', rate: 'balanced', currentDeficit: 0 });
  assert.equal(d1, -150);
  const dAtTarget = D.computeNextDeficit({ redFlag: false }, { goal: 'cut', rate: 'balanced', currentDeficit: -400 });
  assert.equal(dAtTarget, -400, 'must not overshoot past the target');
});

test('computeNextDeficit (bulk, no redFlag): steps surplus up toward the rate target, never past it', () => {
  const d1 = D.computeNextDeficit({ redFlag: false }, { goal: 'bulk', rate: 'balanced', currentDeficit: 0 });
  assert.equal(d1, 150);
  const dAtTarget = D.computeNextDeficit({ redFlag: false }, { goal: 'bulk', rate: 'balanced', currentDeficit: 300 });
  assert.equal(dAtTarget, 300, 'must not overshoot past the target');
});

// ── buildAdaptiveProposal ────────────────────────────────────────────────────────────────

test('buildAdaptiveProposal: not ready when there is insufficient data, and carries the calc through', () => {
  const prop = D.buildAdaptiveProposal({}, { goalKcal: 2000 }, { meals: [] });
  assert.equal(prop.ready, false);
  assert.equal(prop.calc.enoughData, false);
});

test('buildAdaptiveProposal: ready with delta = newGoal - oldGoal when data is sufficient', () => {
  const todayData = { meals: [{ kcal: 1900 }] };
  const history = fullHistory(13, 1900);
  const profile = { goal: 'cut', goalKcal: 2000, rate: 'balanced', currentWeight: 80, currentDeficit: 0, weightHistory: weightHistorySpanning(12, 0, [82, 81, 80]) };
  const prop = D.buildAdaptiveProposal(history, profile, todayData);
  assert.equal(prop.ready, true);
  assert.equal(prop.oldGoal, 2000);
  assert.equal(prop.delta, prop.newGoal - prop.oldGoal);
  assert.equal(prop.newGoal, Math.round(Math.max(1200, Math.min(5000, prop.calc.tdee + prop.nextDeficit))));
});

// ── adaptiveLocalExplain ─────────────────────────────────────────────────────────────────

test('adaptiveLocalExplain includes the scenario-specific text and the correct direction word', () => {
  const up = D.adaptiveLocalExplain({ signals: { scenario: 'gaining' }, delta: 100, newGoal: 2600 });
  assert.match(up, /עולה יפה במשקל\. בכיוון\./);
  assert.match(up, /מעלה את היעד ל-2600/);

  const down = D.adaptiveLocalExplain({ signals: { scenario: 'stalled' }, delta: -150, newGoal: 1850 });
  assert.match(down, /מוריד את היעד ל-1850/);

  const same = D.adaptiveLocalExplain({ signals: { scenario: 'holding' }, delta: 0, newGoal: 2000 });
  assert.match(same, /משאיר את היעד ל-2000/);
});

test('adaptiveLocalExplain falls back to the "steady" map entry for an unknown scenario', () => {
  const s = D.adaptiveLocalExplain({ signals: { scenario: 'nonexistent' }, delta: 0, newGoal: 2000 });
  assert.match(s, /לומד את הקצב שלך ומכייל את היעד\./);
});
