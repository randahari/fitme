// C1-WP8 — js/trigger/triggerDomain.js unit tests.
// Covers: daily budget check, all six trigger evaluators, priority selection, protein
// food hint, and local trigger text — all as pure functions of their parameters.
// Run with: node --test tests/triggerDomain.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/trigger/triggerDomain.js');

function withFixedHour(hour, fn) {
  const RealDate = Date;
  class FixedDate extends RealDate {
    getHours() { return hour; }
  }
  global.Date = FixedDate;
  try { return fn(); } finally { global.Date = RealDate; }
}

function dateKeyOffset(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ── canFire (daily budget check) ────────────────────────────────────────────────────────

test('canFire allows a type not yet fired today, under budget', () => {
  assert.equal(D.canFire({ fired: [], count: 0 }, 'x', D.PRIO.opportunity), true);
});

test('canFire blocks a type already fired today (no duplicates same day)', () => {
  assert.equal(D.canFire({ fired: ['x'], count: 1 }, 'x', D.PRIO.opportunity), false);
});

test('canFire blocks below-health priority once the daily budget is exhausted', () => {
  assert.equal(D.canFire({ fired: [], count: D.COACH_DAILY_BUDGET }, 'y', D.PRIO.opportunity), false);
  assert.equal(D.canFire({ fired: [], count: D.COACH_DAILY_BUDGET }, 'y', D.PRIO.encouragement), false);
});

test('canFire lets health-priority triggers bypass an exhausted budget', () => {
  assert.equal(D.canFire({ fired: [], count: D.COACH_DAILY_BUDGET + 5 }, 'y', D.PRIO.health), true);
});

// ── evalForgotToEat ──────────────────────────────────────────────────────────────────────

test('evalForgotToEat fires only between 14:00-20:00 with under 400 kcal consumed', () => {
  withFixedHour(15, () => {
    const t = D.evalForgotToEat({ consumed: 200 });
    assert.equal(t.type, 'forgot-eat');
    assert.equal(t.priority, D.PRIO.opportunity);
    assert.equal(t.live, false);
    assert.equal(t.data.have, 200);
  });
  withFixedHour(15, () => { assert.equal(D.evalForgotToEat({ consumed: 500 }), null); });
  withFixedHour(21, () => { assert.equal(D.evalForgotToEat({ consumed: 200 }), null); });
  withFixedHour(13, () => { assert.equal(D.evalForgotToEat({ consumed: 200 }), null); });
});

// ── evalLowProtein ───────────────────────────────────────────────────────────────────────

test('evalLowProtein fires when today AND yesterday are both under 60% of target, with enough total consumption', () => {
  const history = { [dateKeyOffset(1)]: { meals: [{ protein: 10 }] } }; // yesterday: 10g protein
  const t = D.evalLowProtein(history, { weight: 80 }, { consumed: 600, protein: 20 });
  assert.notEqual(t, null);
  assert.equal(t.type, 'low-protein');
  assert.equal(t.priority, D.PRIO.opportunity);
  assert.equal(t.data.have, 20);
});

test('evalLowProtein does not fire when there is no history for yesterday', () => {
  const t = D.evalLowProtein({}, { weight: 80 }, { consumed: 600, protein: 20 });
  assert.equal(t, null);
});

test('evalLowProtein does not fire when today\'s protein already meets target', () => {
  const history = { [dateKeyOffset(1)]: { meals: [{ protein: 10 }] } };
  const t = D.evalLowProtein(history, { weight: 80 }, { consumed: 600, protein: 200 });
  assert.equal(t, null);
});

test('evalLowProtein does not fire when total consumption is too low (under 500 kcal)', () => {
  const history = { [dateKeyOffset(1)]: { meals: [{ protein: 10 }] } };
  const t = D.evalLowProtein(history, { weight: 80 }, { consumed: 400, protein: 10 });
  assert.equal(t, null);
});

// ── evalNoWorkout ────────────────────────────────────────────────────────────────────────

test('evalNoWorkout returns null for a brand-new user (no totalWorkouts yet)', () => {
  assert.equal(D.evalNoWorkout({}, { totalWorkouts: 0 }, { burned: 0 }), null);
});

test('evalNoWorkout fires once the gap since the last workout exceeds the frequency-based threshold', () => {
  const history = {};
  for (let i = 1; i < 14; i++) history[dateKeyOffset(i)] = { burned: 0 };
  const t = D.evalNoWorkout(history, { totalWorkouts: 5, workoutFrequency: '2' }, { burned: 0 });
  assert.notEqual(t, null);
  assert.equal(t.type, 'no-workout');
  assert.ok(t.data.since > 4, 'gap threshold for the default/2x frequency is 4 days');
});

test('evalNoWorkout does not fire when a workout happened today', () => {
  const t = D.evalNoWorkout({}, { totalWorkouts: 5, workoutFrequency: '2' }, { burned: 300 });
  assert.equal(t, null);
});

test('evalNoWorkout uses a tighter gap for higher workout frequency (6x/week -> gap 2)', () => {
  const history = { [dateKeyOffset(1)]: { burned: 0 }, [dateKeyOffset(2)]: { burned: 0 } };
  const t = D.evalNoWorkout(history, { totalWorkouts: 5, workoutFrequency: '6' }, { burned: 0 });
  assert.notEqual(t, null, 'since=3 > gap=2 for 6x/week frequency');
});

// ── evalCloseToGoal ──────────────────────────────────────────────────────────────────────

test('evalCloseToGoal fires only from 19:00 with 100-300 kcal remaining', () => {
  withFixedHour(19, () => {
    const t = D.evalCloseToGoal({ goalKcal: 2000 }, { consumed: 1800 });
    assert.notEqual(t, null);
    assert.equal(t.data.remain, 200);
  });
  withFixedHour(19, () => { assert.equal(D.evalCloseToGoal({ goalKcal: 2000 }, { consumed: 1000 }), null); });
  withFixedHour(18, () => { assert.equal(D.evalCloseToGoal({ goalKcal: 2000 }, { consumed: 1800 }), null); });
});

// ── evalStreakMilestone ──────────────────────────────────────────────────────────────────

test('evalStreakMilestone fires exactly on the milestone days, "live" only from 30 days', () => {
  [7, 14].forEach((s) => {
    const t = D.evalStreakMilestone({ streak: s });
    assert.equal(t.type, 'streak-' + s);
    assert.equal(t.live, false);
  });
  [30, 60, 100].forEach((s) => {
    const t = D.evalStreakMilestone({ streak: s });
    assert.equal(t.live, true);
  });
  assert.equal(D.evalStreakMilestone({ streak: 8 }), null);
  assert.equal(D.evalStreakMilestone({ streak: 0 }), null);
});

// ── evalRedFlag ──────────────────────────────────────────────────────────────────────────

test('evalRedFlag returns null when there is insufficient adaptive data', () => {
  const t = D.evalRedFlag({}, { goalKcal: 2000 }, { meals: [] });
  assert.equal(t, null);
});

test('evalRedFlag fires when the adaptive engine detects a losing-muscle scenario', () => {
  function dk(daysAgo) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); }
  const history = {};
  for (let i = 1; i <= 13; i++) history[dk(i)] = { meals: [{ kcal: 1900 }] };
  const todayData = { meals: [{ kcal: 1900 }] };
  const profile = {
    goal: 'cut', goalKcal: 2000, currentWeight: 80,
    weightHistory: [{ date: dk(12), weight: 90 }, { date: dk(6), weight: 84 }, { date: dk(0), weight: 80 }],
    measurementHistory: [{ date: dk(20), arm: 30 }, { date: dk(0), arm: 28 }]
  };
  const t = D.evalRedFlag(history, profile, todayData);
  assert.notEqual(t, null);
  assert.equal(t.type, 'redflag');
  assert.equal(t.priority, D.PRIO.health);
  assert.equal(t.live, true);
  assert.equal(t.data.sig.redFlag, true);
});

test('evalRedFlag swallows any internal error and returns null', () => {
  // profile.goalKcal undefined etc. must never throw out of evalRedFlag
  assert.doesNotThrow(() => D.evalRedFlag(null, null, null));
});

// ── selectTrigger ────────────────────────────────────────────────────────────────────────

test('selectTrigger returns null for an empty or all-null candidate list', () => {
  assert.equal(D.selectTrigger([]), null);
  assert.equal(D.selectTrigger([null, null]), null);
});

test('selectTrigger returns the single highest-priority candidate', () => {
  const low = { type: 'a', priority: D.PRIO.encouragement };
  const high = { type: 'b', priority: D.PRIO.health };
  const mid = { type: 'c', priority: D.PRIO.opportunity };
  assert.equal(D.selectTrigger([null, low, high, mid]), high);
});

// ── proteinFoodHint ──────────────────────────────────────────────────────────────────────

test('proteinFoodHint returns a food from the user\'s own list when it matches a protein-rich keyword', () => {
  assert.equal(D.proteinFoodHint({ foods: ['תפוח', 'עוף בגריל'] }), 'עוף בגריל');
});

test('proteinFoodHint falls back to the default hint when no profile food matches', () => {
  assert.equal(D.proteinFoodHint({ foods: ['תפוח', 'בננה'] }), 'ביצה, קוטג׳ או עוף');
  assert.equal(D.proteinFoodHint({}), 'ביצה, קוטג׳ או עוף');
  assert.equal(D.proteinFoodHint(null), 'ביצה, קוטג׳ או עוף');
});

// ── triggerLocalText ─────────────────────────────────────────────────────────────────────

function profile(overrides) { return Object.assign({ name: 'רן', coachStyle: 'mixed', coachChatter: 'balanced' }, overrides); }

test('triggerLocalText produces the warm vs. neutral variant per coachChatter, for each trigger type', () => {
  const warm = profile({ coachChatter: 'gentle' });
  const neutral = profile({ coachChatter: 'balanced' });

  assert.equal(D.triggerLocalText(warm, { type: 'forgot-eat', data: { have: 200 } }), 'רן, עוד לא ראיתי הרבה רישום היום — מה אכלת עד עכשיו? בוא נעדכן.');
  assert.equal(D.triggerLocalText(neutral, { type: 'forgot-eat', data: { have: 200 } }), 'לא שכחת לרשום? עד עכשיו רק 200 קל׳. מה אכלת היום?');

  assert.match(D.triggerLocalText(neutral, { type: 'low-protein', data: { have: 40, target: 130 } }), /רן, יומיים שהחלבון נמוך \(40g מתוך 130g\)\./);

  assert.equal(D.triggerLocalText(warm, { type: 'no-workout', data: { since: 5 } }), 'רן, כבר 5 ימים בלי אימון — הגוף שלך מוכן, גם 20 דקות זה ניצחון.');
  assert.equal(D.triggerLocalText(neutral, { type: 'no-workout', data: { since: 5 } }), '5 ימים בלי אימון. מה דעתך על אימון קצר היום?');

  assert.equal(D.triggerLocalText(neutral, { type: 'close-goal', data: { remain: 150 } }), 'רן, נותרו רק 150 קל׳ ליעד — עוד ארוחה קטנה וסגרת יום מושלם.');

  assert.equal(D.triggerLocalText(neutral, { type: 'streak-30', data: { streak: 30 } }), 'רן, 30 ימים ברצף! 🔥 אתה במומנטום מעולה.');
});

test('triggerLocalText returns empty string for an unrecognized trigger type', () => {
  assert.equal(D.triggerLocalText(profile(), { type: 'nonexistent', data: {} }), '');
});
