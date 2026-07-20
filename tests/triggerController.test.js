// C1-WP8 — js/trigger/triggerController.js unit tests.
// TriggerDomain/ProfileMetrics are required directly by the module (stable pure/WP1
// singletons, same require-cache instance as this test file); NotificationAdapter is
// monkey-patched per test, mirroring tests/barcodeFlowController.test.js's pattern for
// stable WP2 adapters. All DOM/state/app.js collaborators the module owns via configure()
// are injected as usual.
// Run with: node --test tests/triggerController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const TriggerController = require('../js/trigger/triggerController.js');
const NotificationAdapter = require('../js/adapters/notificationAdapter.js');

function fakeElement(overrides) {
  return Object.assign({ classList: { add() {}, remove() {} }, style: {}, innerHTML: '', textContent: '' }, overrides);
}
function fakeDocument(overrides) {
  const elements = {};
  const doc = { getElementById: (id) => elements[id] || null, _elements: elements };
  Object.assign(doc, overrides);
  return doc;
}

function profile(overrides) {
  return Object.assign({ goal: 'cut', goalKcal: 2000, streak: 3 }, overrides);
}

function fakeDeps(overrides) {
  const calls = [];
  let gen = 1;
  const userProfile = overrides && 'userProfile' in overrides ? overrides.userProfile : profile();
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    sessionLifecycle: { getGeneration: () => gen, isCurrent: (g) => g === gen, _bump: () => { gen++; } },
    goalLabels: { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' },
    getUserProfile: () => userProfile,
    getTodayData: () => ({ meals: [], burned: 0, steps: 0 }),
    persistenceSummaryFn: (result) => { calls.push(['persistenceSummary', result]); return result ? { requested: true } : { requested: false, status: null, requestId: null }; },
    scheduleAtFn: (hour, min, cb) => { calls.push(['scheduleAt', hour, min]); (deps._scheduled = deps._scheduled || []).push(cb); },
    sendLocalNotificationFn: (title, body) => calls.push(['sendLocalNotification', title, body]),
    coachNameFn: () => 'רן',
    coachMessageFn: async (ctx) => { calls.push(['coachMessage', ctx]); return 'הודעת מאמן'; },
    coachLineFn: (kind, d) => { calls.push(['coachLine', kind, d]); return 'שורת מאמן'; }
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc };
}

function fakeAccess(overrides) {
  const calls = [];
  const access = {
    read: {
      nutritionActivityHistory: async () => { calls.push(['read.history']); return {}; },
      adaptiveProfile: () => { calls.push(['read.adaptiveProfile']); return {}; },
      triggerProfile: () => { calls.push(['read.triggerProfile']); return { goalKcal: 2000, weight: 80, streak: 3, totalWorkouts: 5 }; },
      todayNutrition: () => { calls.push(['read.todayNutrition']); return { consumed: 1000, protein: 50, burned: 0 }; },
      canFire: () => true
    },
    write: {
      updateDailyTriggerBudget: async (arg) => { calls.push(['write.updateDailyTriggerBudget', arg]); return { status: 'APPLIED' }; },
      recordTriggerOutcome: async (arg) => { calls.push(['write.recordTriggerOutcome', arg]); return { status: 'APPLIED' }; }
    }
  };
  if (overrides) Object.assign(access.read, overrides.read || {});
  if (overrides) Object.assign(access.write, overrides.write || {});
  return { access, calls };
}

// ── runCoachTriggers ────────────────────────────────────────────────────────────────────

test('runCoachTriggers is a no-op (returns not-requested persistence) with no userProfile or no access', async () => {
  const { deps } = fakeDeps({ userProfile: null });
  TriggerController.configure(deps);
  const r = await TriggerController.runCoachTriggers({});
  assert.equal(r.trigger, null);
  assert.equal(r.persistence.requested, false);

  const { deps: deps2 } = fakeDeps();
  TriggerController.configure(deps2);
  const r2 = await TriggerController.runCoachTriggers(null);
  assert.equal(r2.trigger, null);
});

test('runCoachTriggers gathers all four snapshots, selects the highest-priority candidate, and persists both budget and event', async () => {
  const { deps } = fakeDeps();
  TriggerController.configure(deps);
  const { access, calls } = fakeAccess({
    read: {
      todayNutrition: () => { calls.push(['read.todayNutrition']); return { consumed: 1000, protein: 50, burned: 500 }; }, // workout done today — no-workout must not fire
      triggerProfile: () => { calls.push(['read.triggerProfile']); return { goalKcal: 2000, weight: 80, streak: 30, totalWorkouts: 5 }; } // streak-30 candidate
    }
  });
  const r = await TriggerController.runCoachTriggers(access);
  assert.notEqual(r.trigger, null);
  assert.equal(r.trigger.type, 'streak-30');
  assert.ok(calls.some((c) => c[0] === 'read.history'));
  assert.ok(calls.some((c) => c[0] === 'read.adaptiveProfile'));
  assert.ok(calls.some((c) => c[0] === 'read.triggerProfile'));
  assert.ok(calls.some((c) => c[0] === 'read.todayNutrition'));
  assert.ok(calls.some((c) => c[0] === 'write.updateDailyTriggerBudget' && c[1].type === 'streak-30'));
  assert.ok(calls.some((c) => c[0] === 'write.recordTriggerOutcome' && c[1].type === 'streak-30'));
});

test('runCoachTriggers returns a null trigger (no writes) when canFire rejects every candidate', async () => {
  const { deps } = fakeDeps();
  TriggerController.configure(deps);
  const { access, calls } = fakeAccess({
    read: {
      triggerProfile: () => ({ goalKcal: 2000, weight: 80, streak: 30, totalWorkouts: 5 }),
      canFire: () => false
    }
  });
  const r = await TriggerController.runCoachTriggers(access);
  assert.equal(r.trigger, null);
  assert.ok(!calls.some((c) => c[0] === 'write.updateDailyTriggerBudget'));
});

test('runCoachTriggers reports the worse of the two write outcomes (event write failure not masked by a successful budget write)', async () => {
  const { deps, calls: depsCalls } = fakeDeps();
  TriggerController.configure(deps);
  const { access } = fakeAccess({
    read: { todayNutrition: () => ({ consumed: 1000, protein: 50, burned: 500 }), triggerProfile: () => ({ goalKcal: 2000, weight: 80, streak: 30, totalWorkouts: 5 }) },
    write: { recordTriggerOutcome: async () => ({ status: 'FAILED', metadata: { persistenceStatus: 'FAILED' } }) }
  });
  const r = await TriggerController.runCoachTriggers(access);
  assert.notEqual(r.trigger, null);
  assert.ok(depsCalls.find((c) => c[0] === 'persistenceSummary' && c[1] && c[1].status === 'FAILED'));
});

// ── presentTriggerCard ──────────────────────────────────────────────────────────────────

test('presentTriggerCard is a no-op when the card element is missing', async () => {
  const { deps } = fakeDeps();
  TriggerController.configure(deps);
  await assert.doesNotReject(TriggerController.presentTriggerCard({ type: 'forgot-eat', data: { have: 1 } }, 1));
});

test('presentTriggerCard hides the card when there is no trigger', async () => {
  const card = fakeElement();
  let hidden = false;
  card.classList.add = (c) => { if (c === 'hidden') hidden = true; };
  const { deps } = fakeDeps();
  deps.documentRef._elements['trigger-card'] = card;
  TriggerController.configure(deps);
  await TriggerController.presentTriggerCard(null, 1);
  assert.equal(hidden, true);
});

test('presentTriggerCard shows local text immediately, and reveals the card without waiting for AI on a non-live trigger', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  let revealed = false;
  card.classList.remove = (c) => { if (c === 'hidden') revealed = true; };
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['trigger-card'] = card;
  deps.documentRef._elements['trigger-card-text'] = textEl;
  TriggerController.configure(deps);
  await TriggerController.presentTriggerCard({ type: 'forgot-eat', live: false, data: { have: 100 } }, 1);
  assert.match(textEl.textContent, /לא שכחת לרשום/);
  assert.equal(revealed, true);
  assert.ok(!calls.some((c) => c[0] === 'coachMessage'), 'a non-live trigger must never request an AI message');
});

test('presentTriggerCard upgrades to the live coach message for a live trigger, when the session is still current', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps } = fakeDeps();
  deps.documentRef._elements['trigger-card'] = card;
  deps.documentRef._elements['trigger-card-text'] = textEl;
  TriggerController.configure(deps);
  await TriggerController.presentTriggerCard({ type: 'redflag', live: true, data: {} }, 1);
  assert.equal(textEl.textContent, 'הודעת מאמן');
});

test('presentTriggerCard suppresses the live-text upgrade when the session goes stale mid-request', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps } = fakeDeps({ coachMessageFn: async () => { deps._bump(); return 'הודעה חדשה'; } });
  deps._bump = () => deps.sessionLifecycle._bump();
  deps.documentRef._elements['trigger-card'] = card;
  deps.documentRef._elements['trigger-card-text'] = textEl;
  TriggerController.configure(deps);
  await TriggerController.presentTriggerCard({ type: 'redflag', live: true, data: {} }, 1);
  assert.notEqual(textEl.textContent, 'הודעה חדשה');
});

// ── triggerLiveText ─────────────────────────────────────────────────────────────────────

test('triggerLiveText requests an AI message and falls back to the local text on failure', async () => {
  const { deps } = fakeDeps();
  TriggerController.configure(deps);
  const r = await TriggerController.triggerLiveText({ type: 'streak-30', data: { streak: 30 } });
  assert.equal(r, 'הודעת מאמן');

  const { deps: depsFail } = fakeDeps({ coachMessageFn: async () => { throw new Error('network'); } });
  TriggerController.configure(depsFail);
  const rFail = await TriggerController.triggerLiveText({ type: 'streak-30', data: { streak: 30 } });
  assert.match(rFail, /30 ימים ברצף/);
});

test('triggerLiveText composes a specific context for redflag vs. streak vs. any other type', async () => {
  const { deps, calls } = fakeDeps();
  TriggerController.configure(deps);
  await TriggerController.triggerLiveText({ type: 'redflag', data: {} });
  assert.match(calls.find((c) => c[0] === 'coachMessage')[1], /דגל אדום מהמנוע המסתגל/);
  await TriggerController.triggerLiveText({ type: 'streak-60', data: { streak: 60 } });
  assert.match(calls[calls.length - 1][1], /הגיע ל-60 ימים ברצף/);
  await TriggerController.triggerLiveText({ type: 'workout-logged', data: {} });
  assert.match(calls[calls.length - 1][1], /אירוע: workout-logged/);
});

// ── fireWorkoutTrigger ──────────────────────────────────────────────────────────────────

test('fireWorkoutTrigger returns null with no access, otherwise records the workout-logged outcome', async () => {
  assert.equal(await TriggerController.fireWorkoutTrigger(300, null), null);
  const { access, calls } = fakeAccess();
  const r = await TriggerController.fireWorkoutTrigger(300, access);
  assert.equal(r.status, 'APPLIED');
  assert.deepEqual(calls.find((c) => c[0] === 'write.recordTriggerOutcome')[1], { type: 'workout-logged', data: { burn: 300 } });
});

// ── presentWorkoutTriggerCard ───────────────────────────────────────────────────────────

test('presentWorkoutTriggerCard is a no-op when either DOM element is missing', async () => {
  const { deps } = fakeDeps();
  TriggerController.configure(deps);
  await assert.doesNotReject(TriggerController.presentWorkoutTriggerCard(300, 'cut', 1));
});

test('presentWorkoutTriggerCard shows the local coach-line immediately, then the AI credit message', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['trigger-card'] = card;
  deps.documentRef._elements['trigger-card-text'] = textEl;
  TriggerController.configure(deps);
  await TriggerController.presentWorkoutTriggerCard(300, 'cut', 1);
  assert.ok(calls.some((c) => c[0] === 'coachLine' && c[1] === 'workout' && c[2].burn === '300'));
  assert.equal(textEl.textContent, 'הודעת מאמן');
  assert.match(calls.find((c) => c[0] === 'coachMessage')[1], /שרף 300 קל׳ \(מטרה: חיטוב 🔥\)/);
});

// ── scheduleLocalNotifications ──────────────────────────────────────────────────────────

test('scheduleLocalNotifications is a no-op without notification permission, userProfile, or access', () => {
  NotificationAdapter.getPermission = () => 'default';
  const { deps, calls } = fakeDeps();
  TriggerController.configure(deps);
  TriggerController.scheduleLocalNotifications({});
  assert.deepEqual(calls, []);

  NotificationAdapter.getPermission = () => 'granted';
  const { deps: deps2, calls: calls2 } = fakeDeps({ userProfile: null });
  TriggerController.configure(deps2);
  TriggerController.scheduleLocalNotifications({});
  assert.deepEqual(calls2, []);
});

test('scheduleLocalNotifications schedules only the still-upcoming daily windows, and each callback pushes a notification when its own condition is met', async () => {
  const RealDate = Date;
  class FixedDate extends RealDate { getHours() { return 6; } } // before all 5 windows
  global.Date = FixedDate;
  try {
    NotificationAdapter.getPermission = () => 'granted';
    const { deps, calls } = fakeDeps();
    TriggerController.configure(deps);
    const { access } = fakeAccess({ read: { todayNutrition: () => ({ consumed: 100, protein: 10, burned: 0 }), triggerProfile: () => ({ goalKcal: 2000, weight: 80, streak: 5 }) } });
    TriggerController.scheduleLocalNotifications(access);
    const scheduledHours = calls.filter((c) => c[0] === 'scheduleAt').map((c) => c[1]);
    assert.deepEqual(scheduledHours, [7, 14, 17, 20, 21]);

    // fire the morning callback
    await deps._scheduled[0]();
    assert.ok(calls.some((c) => c[0] === 'sendLocalNotification'));
  } finally { global.Date = RealDate; }
});

test('scheduleLocalNotifications: a scheduled callback checks canFire before sending, and never throws if the session goes stale by execution time', async () => {
  const RealDate = Date;
  class FixedDate extends RealDate { getHours() { return 6; } }
  global.Date = FixedDate;
  try {
    NotificationAdapter.getPermission = () => 'granted';
    const { deps, calls } = fakeDeps();
    TriggerController.configure(deps);
    const { access } = fakeAccess({ read: { canFire: () => false, todayNutrition: () => ({ consumed: 100, protein: 10, burned: 0 }), triggerProfile: () => ({ goalKcal: 2000, weight: 80, streak: 5 }) } });
    TriggerController.scheduleLocalNotifications(access);
    await deps._scheduled[0]();
    assert.ok(!calls.some((c) => c[0] === 'sendLocalNotification'), 'canFire()=false must suppress the notification');

    const { access: throwingAccess } = fakeAccess({ read: { triggerProfile: () => { throw new Error('stale session'); } } });
    TriggerController.scheduleLocalNotifications(throwingAccess);
    const lastCallback = deps._scheduled[deps._scheduled.length - 1];
    assert.doesNotThrow(() => lastCallback());
  } finally { global.Date = RealDate; }
});
