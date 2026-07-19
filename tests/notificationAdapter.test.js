// C1-WP2 — js/adapters/notificationAdapter.js unit tests.
// Run with: node --test tests/notificationAdapter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const NotificationAdapter = require('../js/adapters/notificationAdapter.js');

test('getPermission reads notificationApi.permission', () => {
  NotificationAdapter.configure({ notificationApi: { permission: 'denied' } });
  assert.equal(NotificationAdapter.getPermission(), 'denied');
});

test('requestPermission delegates to notificationApi.requestPermission', async () => {
  NotificationAdapter.configure({ notificationApi: { requestPermission: async () => 'granted' } });
  assert.equal(await NotificationAdapter.requestPermission(), 'granted');
});

test('showNotification does nothing when permission is not granted', async () => {
  let readyAccessed = false;
  NotificationAdapter.configure({
    notificationApi: { permission: 'denied' },
    serviceWorkerContainer: { get ready() { readyAccessed = true; return Promise.resolve({ showNotification() {} }); } }
  });
  await NotificationAdapter.showNotification('t', 'b');
  assert.equal(readyAccessed, false);
});

test('showNotification waits for service-worker readiness and shows the exact fixed options when granted', async () => {
  let captured = null;
  NotificationAdapter.configure({
    notificationApi: { permission: 'granted' },
    serviceWorkerContainer: { ready: Promise.resolve({ showNotification(title, options) { captured = { title, options }; } }) }
  });
  await NotificationAdapter.showNotification('כותרת', 'גוף ההודעה');
  assert.deepEqual(captured, {
    title: 'כותרת',
    options: { body: 'גוף ההודעה', icon: '/fitme/assets/icon-192.png', dir: 'rtl', lang: 'he', vibrate: [200, 100, 200] }
  });
});

test('scheduleAt schedules the callback when the target time is still in the future today', () => {
  const originalSetTimeout = global.setTimeout;
  const calls = [];
  global.setTimeout = (cb, ms) => { calls.push({ cb, ms }); return 1; };
  try {
    const now = new Date(2026, 6, 19, 6, 0, 0); // 06:00
    NotificationAdapter.scheduleAt(7, 0, () => {}, now); // target 07:00, one hour later
    assert.equal(calls.length, 1);
    assert.equal(calls[0].ms, 60 * 60 * 1000);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});

test('scheduleAt does not schedule when the target time has already passed today', () => {
  const originalSetTimeout = global.setTimeout;
  const calls = [];
  global.setTimeout = (cb, ms) => { calls.push({ cb, ms }); return 1; };
  try {
    const now = new Date(2026, 6, 19, 8, 0, 0); // 08:00
    NotificationAdapter.scheduleAt(7, 0, () => {}, now); // target 07:00, already passed
    assert.equal(calls.length, 0);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
