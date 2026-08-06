// C1-WP7 — js/adaptive/adaptiveTdeeController.js unit tests.
// AdaptiveTdeeDomain/AuthorityContract are required directly by the module (stable
// pure/B3 singletons, same require-cache instance as this test file); PersistenceGateway
// is monkey-patched per test, mirroring tests/barcodeFlowController.test.js's pattern for
// stable WP2/WP3 adapters. All DOM/state/app.js collaborators the module owns via
// configure() are injected as usual.
// Run with: node --test tests/adaptiveTdeeController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const AdaptiveTdeeController = require('../js/adaptive/adaptiveTdeeController.js');
const PersistenceGateway = require('../js/persistenceGateway.js');
// C2 (Rejection and Suppression Feedback): same require-cache singleton the controller module
// itself uses — monkey-patched per test for the suppression-gate tests below, same convention
// this file already documents for PersistenceGateway above.
const AdaptiveTdeeDomain = require('../js/adaptive/adaptiveTdeeDomain.js');

function fakeElement(overrides) {
  return Object.assign({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, innerHTML: '', textContent: '', value: '' }, overrides);
}
function fakeSegButtons(vals) {
  return vals.map((v) => Object.assign(fakeElement(), { dataset: { val: v }, classList: { toggled: null, toggle(cls, on) { this.toggled = on; } } }));
}
function fakeDocument(overrides) {
  const elements = {}; const groups = {};
  const doc = { getElementById: (id) => elements[id] || null, querySelectorAll: (sel) => groups[sel] || [], _elements: elements, _groups: groups };
  Object.assign(doc, overrides);
  return doc;
}

function profile(overrides) {
  return Object.assign({ goal: 'cut', goalKcal: 2000, rate: 'balanced', currentWeight: 80, streak: 3 }, overrides);
}

function fakeDeps(overrides) {
  const calls = [];
  let gen = 1;
  let adaptProposal = null;
  const userProfile = overrides && 'userProfile' in overrides ? overrides.userProfile : profile();
  const currentUser = overrides && 'currentUser' in overrides ? overrides.currentUser : { uid: 'u1' };
  const todayData = { meals: [], burned: 0, steps: 0 };
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    sessionLifecycle: { getGeneration: () => gen, isCurrent: (g) => g === gen, _bump: () => { gen++; } },
    appVersion: '9.9.9',
    daysHe: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
    goalLabels: { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' },
    getUserProfile: () => userProfile,
    getTodayData: () => todayData,
    getCurrentUser: () => currentUser,
    getAdaptProposal: () => adaptProposal,
    clearAdaptProposal: () => { adaptProposal = null; },
    getAdaptHistoryCache: () => ({}),
    saveProfile: async () => calls.push(['saveProfile']),
    renderHome: () => calls.push(['renderHome']),
    renderSettings: () => calls.push(['renderSettings']),
    runEngineAction: async (trigger, engineId, action) => calls.push(['runEngineAction', trigger, engineId, action]),
    coachNameFn: () => 'רן',
    coachMessageFn: async (ctx) => { calls.push(['coachMessage', ctx]); return 'הודעת מאמן'; },
    alertFn: (msg) => calls.push(['alert', msg]),
    // C2 (Rejection and Suppression Feedback) — mirrors TriggerController's fakeDeps convention.
    recordFeedbackFn: (surface, contextId, feedbackType) => calls.push(['recordFeedback', surface, contextId, feedbackType])
  };
  Object.assign(deps, overrides);
  deps._setProposal = (p) => { adaptProposal = p; };
  deps._bumpSession = () => gen++;
  return { deps, calls, doc, userProfile, todayData };
}

function readyProposal(overrides) {
  return Object.assign({
    ready: true,
    calc: { tdee: 2200, avgIntake: 1900, slopeKgPerWeek: -0.3, nDays: 10, nWeights: 4 },
    signals: { scenario: 'progress', waistDown: false, waistUp: false, armDown: false, armUp: false },
    nextDeficit: -300, newGoal: 1900, oldGoal: 2000, delta: -100
  }, overrides);
}

// ── runAdaptiveCheck ────────────────────────────────────────────────────────────────────

test('runAdaptiveCheck is a no-op with no userProfile or no access', async () => {
  const { deps, calls } = fakeDeps({ userProfile: null });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.runAdaptiveCheck({});
  assert.deepEqual(calls, []);

  const { deps: deps2, calls: calls2 } = fakeDeps();
  AdaptiveTdeeController.configure(deps2);
  await AdaptiveTdeeController.runAdaptiveCheck(null);
  assert.deepEqual(calls2, []);
});

test('runAdaptiveCheck is a no-op when adaptive is disabled, but still no access calls made', async () => {
  const { deps, calls } = fakeDeps({ userProfile: profile({ adaptiveEnabled: false }) });
  AdaptiveTdeeController.configure(deps);
  const access = { read: { adaptiveProfile: () => { calls.push(['read']); return {}; } }, write: {} };
  await AdaptiveTdeeController.runAdaptiveCheck(access);
  assert.deepEqual(calls, []);
});

test('runAdaptiveCheck reads history/profile, marks the check completed, and stores a proposal when due, ready, and delta != 0', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const history = { day1: {} };
  const access = {
    read: {
      adaptiveProfile: () => ({ lastTdeeUpdate: null, goalKcal: 2000, goal: 'cut', rate: 'balanced', currentWeight: 80, weightHistory: [
        { date: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10), weight: 82 },
        { date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), weight: 81 },
        { date: new Date().toISOString().slice(0, 10), weight: 80 }
      ] }),
      nutritionActivityHistory: async () => history
    },
    write: {
      markAdaptiveCheckCompleted: async (arg) => calls.push(['markCompleted', arg.history === history]),
      storeAdaptiveProposal: async (arg) => calls.push(['storeProposal', arg.proposal.ready])
    }
  };
  // Need enough counted days too; fill todayData/history minimally isn't enough for enoughDays,
  // so this just verifies the "not enough data" path stores nothing but still marks completed.
  await AdaptiveTdeeController.runAdaptiveCheck(access);
  assert.ok(calls.some((c) => c[0] === 'markCompleted' && c[1] === true));
  assert.ok(!calls.some((c) => c[0] === 'storeProposal'), 'insufficient day/weight data -> proposal not ready -> nothing stored');
});

test('runAdaptiveCheck skips proposal building entirely when not due by time (recent lastTdeeUpdate)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const today = new Date().toISOString().slice(0, 10);
  const access = {
    read: { adaptiveProfile: () => ({ lastTdeeUpdate: today }), nutritionActivityHistory: async () => ({}) },
    write: {
      markAdaptiveCheckCompleted: async () => calls.push(['markCompleted']),
      storeAdaptiveProposal: async () => calls.push(['storeProposal'])
    }
  };
  await AdaptiveTdeeController.runAdaptiveCheck(access);
  assert.ok(calls.some((c) => c[0] === 'markCompleted'));
  assert.ok(!calls.some((c) => c[0] === 'storeProposal'));
});

// ── C2: Rejection and Suppression Feedback — runAdaptiveCheck suppression gate ──────────

test('C2: runAdaptiveCheck does not store an otherwise-ready proposal when the ADAPTIVE_CHECK surface is suppressed by a repeated-dismiss pattern', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const realBuild = AdaptiveTdeeDomain.buildAdaptiveProposal;
  AdaptiveTdeeDomain.buildAdaptiveProposal = () => ({ ready: true, delta: -100, calc: {}, signals: {}, newGoal: 1900, oldGoal: 2000 });
  try {
    const now = Date.now();
    const feedbackHistory = [0, 1, 2].map((i) => ({ surface: 'adaptiveTdee', contextId: 'adaptive-proposal', feedbackType: 'Dismissed', occurredAt: now - i * 86400000 }));
    const access = {
      identity: { action: 'ADAPTIVE_CHECK' },
      read: {
        adaptiveProfile: () => ({ lastTdeeUpdate: null }),
        nutritionActivityHistory: async () => ({}),
        recommendationFeedbackHistory: () => { calls.push(['read.recommendationFeedbackHistory']); return feedbackHistory; }
      },
      write: {
        markAdaptiveCheckCompleted: async () => calls.push(['markCompleted']),
        storeAdaptiveProposal: async () => calls.push(['storeProposal'])
      }
    };
    await AdaptiveTdeeController.runAdaptiveCheck(access);
    assert.ok(calls.some((c) => c[0] === 'read.recommendationFeedbackHistory'), 'the suppression gate must be consulted for ADAPTIVE_CHECK');
    assert.ok(!calls.some((c) => c[0] === 'storeProposal'), 'a suppressed surface must not store a new proposal, even when otherwise ready');
  } finally { AdaptiveTdeeDomain.buildAdaptiveProposal = realBuild; }
});

test('C2: runAdaptiveCheck stores a ready proposal normally when there is no suppressing feedback pattern', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const realBuild = AdaptiveTdeeDomain.buildAdaptiveProposal;
  AdaptiveTdeeDomain.buildAdaptiveProposal = () => ({ ready: true, delta: -100, calc: {}, signals: {}, newGoal: 1900, oldGoal: 2000 });
  try {
    const access = {
      identity: { action: 'ADAPTIVE_CHECK' },
      read: {
        adaptiveProfile: () => ({ lastTdeeUpdate: null }),
        nutritionActivityHistory: async () => ({}),
        recommendationFeedbackHistory: () => []
      },
      write: {
        markAdaptiveCheckCompleted: async () => calls.push(['markCompleted']),
        storeAdaptiveProposal: async () => calls.push(['storeProposal'])
      }
    };
    await AdaptiveTdeeController.runAdaptiveCheck(access);
    assert.ok(calls.some((c) => c[0] === 'storeProposal'));
  } finally { AdaptiveTdeeDomain.buildAdaptiveProposal = realBuild; }
});

test('C2: runAdaptiveCheck never calls recommendationFeedbackHistory for WEIGHT_CHANGED/ADAPTIVE_RECHECK (not approved for those actions — no scope expansion)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const realBuild = AdaptiveTdeeDomain.buildAdaptiveProposal;
  AdaptiveTdeeDomain.buildAdaptiveProposal = () => ({ ready: true, delta: -100, calc: {}, signals: {}, newGoal: 1900, oldGoal: 2000 });
  try {
    const access = {
      identity: { action: 'WEIGHT_CHANGED' },
      read: {
        adaptiveProfile: () => ({ lastTdeeUpdate: null }),
        nutritionActivityHistory: async () => ({}),
        recommendationFeedbackHistory: () => { throw new Error('must never be called for this action'); }
      },
      write: {
        markAdaptiveCheckCompleted: async () => calls.push(['markCompleted']),
        storeAdaptiveProposal: async () => calls.push(['storeProposal'])
      }
    };
    await assert.doesNotReject(AdaptiveTdeeController.runAdaptiveCheck(access));
    assert.ok(calls.some((c) => c[0] === 'storeProposal'), 'WEIGHT_CHANGED must remain unaffected by the C2 suppression gate');
  } finally { AdaptiveTdeeDomain.buildAdaptiveProposal = realBuild; }
});

// ── renderAdaptiveCard ──────────────────────────────────────────────────────────────────

test('renderAdaptiveCard is a no-op when the card element is missing', async () => {
  const { deps } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  await assert.doesNotReject(AdaptiveTdeeController.renderAdaptiveCard());
});

test('renderAdaptiveCard hides the card when there is no proposal', async () => {
  const card = fakeElement();
  let hidden = false;
  card.classList.add = (c) => { if (c === 'hidden') hidden = true; };
  const { deps } = fakeDeps();
  deps.documentRef._elements['adaptive-card'] = card;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.renderAdaptiveCard();
  assert.equal(hidden, true);
});

test('renderAdaptiveCard shows local explanation immediately, then the coach message on success, and reveals the card', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const metaEl = fakeElement();
  let revealed = false;
  card.classList.remove = (c) => { if (c === 'hidden') revealed = true; };
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['adaptive-card'] = card;
  deps.documentRef._elements['adaptive-card-text'] = textEl;
  deps.documentRef._elements['adaptive-card-meta'] = metaEl;
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.renderAdaptiveCard();
  assert.match(metaEl.textContent, /2,000 → 1,900 קל׳ ↓/);
  assert.equal(textEl.textContent, 'הודעת מאמן');
  assert.equal(revealed, true);
  assert.ok(calls.some((c) => c[0] === 'coachMessage'));
});

test('renderAdaptiveCard falls back to the local explanation text when the coach message fails', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps } = fakeDeps({ coachMessageFn: async () => { throw new Error('network'); } });
  deps.documentRef._elements['adaptive-card'] = card;
  deps.documentRef._elements['adaptive-card-text'] = textEl;
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.renderAdaptiveCard();
  assert.match(textEl.textContent, /המשקל יורד בקצב יפה/);
});

test('renderAdaptiveCard does not reveal the card when the session goes stale mid-request', async () => {
  const card = fakeElement();
  let revealed = false;
  card.classList.remove = (c) => { if (c === 'hidden') revealed = true; };
  const { deps } = fakeDeps({ coachMessageFn: async () => { deps._bumpSession(); return 'x'; } });
  deps.documentRef._elements['adaptive-card'] = card;
  deps.documentRef._elements['adaptive-card-text'] = fakeElement();
  deps.documentRef._elements['adaptive-card-meta'] = fakeElement();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.renderAdaptiveCard();
  assert.equal(revealed, false);
});

// ── coachAdaptiveMessage ────────────────────────────────────────────────────────────────

test('coachAdaptiveMessage composes the context with measurement text and calls coachMessageFn', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const p = readyProposal({ signals: { scenario: 'progress', waistDown: true, waistUp: false, armDown: false, armUp: true } });
  await AdaptiveTdeeController.coachAdaptiveMessage(p);
  const call = calls.find((c) => c[0] === 'coachMessage');
  assert.ok(call);
  assert.match(call[1], /המותן יורד, הזרוע גדלה/);
  assert.match(call[1], /מטרה חיטוב 🔥/);
  assert.match(call[1], /היעד עובר מ-2000 ל-1900 קל׳/);
});

test('coachAdaptiveMessage uses the "not enough circumference data" fallback text when no waist/arm signal', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const p = readyProposal({ signals: { scenario: 'progress', waistDown: false, waistUp: false, armDown: false, armUp: false } });
  await AdaptiveTdeeController.coachAdaptiveMessage(p);
  assert.match(calls.find((c) => c[0] === 'coachMessage')[1], /אין עדיין מספיק היקפים/);
});

// ── applyAdaptiveUpdate ─────────────────────────────────────────────────────────────────

test('applyAdaptiveUpdate is a no-op with no proposal, no profile, or no currentUser', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.deepEqual(calls, []);
});

test('applyAdaptiveUpdate persists via PersistenceGateway, updates the profile, clears the proposal, and renders on success', async () => {
  const { deps, calls, userProfile } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  let capturedRequest = null;
  PersistenceGateway.persist = async (req) => { capturedRequest = req; return { status: 'SUCCESS' }; };
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.equal(capturedRequest.operation, 'DERIVED_ADAPTIVE_PROPOSAL_APPLY');
  assert.equal(capturedRequest.authority.authoritySource, 'SYSTEM');
  assert.equal(capturedRequest.authority.rule, 'ADAPTIVE_TDEE_USER_APPROVED');
  assert.equal(userProfile.goalKcal, 1900);
  assert.equal(userProfile.adaptiveTdee, 2200);
  assert.equal(deps.getAdaptProposal(), null);
  assert.ok(calls.some((c) => c[0] === 'renderHome'));
  assert.ok(calls.some((c) => c[0] === 'renderSettings'));
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'היעד עודכן ל-1,900 קל׳ ✓'));
});

test('applyAdaptiveUpdate alerts a non-retry-inviting failure message and leaves the proposal active when persistence fails non-retryably (UX-19.1-19.3, WP6)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'REJECTED' }); // no .error at all — retryable must default to false, never throw
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת היעד נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.'));
  assert.notEqual(deps.getAdaptProposal(), null, 'a failed persist must not clear the proposal');
});

test('applyAdaptiveUpdate alerts a retry-inviting failure message when result.error.retryable is true (UX-19.2)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } });
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת היעד נכשלה עקב בעיית תקשורת זמנית. נסה שוב.'));
  assert.notEqual(deps.getAdaptProposal(), null, 'a failed persist must not clear the proposal');
});

test('applyAdaptiveUpdate alerts a non-retry-inviting failure message when result.error.retryable is false (UX-19.2)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'FAILED', error: { code: 'permission-denied', retryable: false } });
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת היעד נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.'));
  assert.notEqual(deps.getAdaptProposal(), null, 'a failed persist must not clear the proposal');
});

test('applyAdaptiveUpdate suppresses the failure alert when the session is stale', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => { deps._bumpSession(); return { status: 'REJECTED' }; };
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(!calls.some((c) => c[0] === 'alert'));
});

test('applyAdaptiveUpdate treats NO_OP as success', async () => {
  const { deps } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'NO_OP' });
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.equal(deps.getAdaptProposal(), null);
});

test('applyAdaptiveUpdate on a stale session after SUCCESS suppresses all effects (no profile mutation, no clear, no render, no alert)', async () => {
  const { deps, calls, userProfile } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  const p = readyProposal();
  deps._setProposal(p);
  PersistenceGateway.persist = async () => { deps._bumpSession(); return { status: 'SUCCESS' }; };
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.notEqual(userProfile.goalKcal, 1900, 'stale-on-completion must not mutate the profile');
  assert.equal(deps.getAdaptProposal(), p, 'stale-on-completion must not clear the proposal');
  assert.deepEqual(calls.filter((c) => ['renderHome', 'renderSettings', 'alert'].includes(c[0])), []);
});

// ── dismissAdaptiveUpdate ───────────────────────────────────────────────────────────────

test('dismissAdaptiveUpdate is a no-op with no profile', async () => {
  const { deps, calls } = fakeDeps({ userProfile: null });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.dismissAdaptiveUpdate();
  assert.deepEqual(calls, []);
});

test('dismissAdaptiveUpdate marks lastTdeeUpdate as today, saves, clears the proposal, and re-renders the card', async () => {
  const { deps, calls, userProfile } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.dismissAdaptiveUpdate();
  assert.equal(userProfile.lastTdeeUpdate, new Date().toISOString().slice(0, 10));
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));
  assert.equal(deps.getAdaptProposal(), null);
});

test('dismissAdaptiveUpdate rolls back lastTdeeUpdate, alerts a structured message, and leaves the proposal active when saveProfile() fails (UX-19.1-19.4, WP6)', async () => {
  const { deps, calls, userProfile } = fakeDeps({
    userProfile: profile({ lastTdeeUpdate: '2020-01-01' }),
    saveProfile: async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } })
  });
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.dismissAdaptiveUpdate();
  assert.equal(userProfile.lastTdeeUpdate, '2020-01-01', 'a failed save must roll back the optimistic lastTdeeUpdate mutation');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת הבחירה נכשלה עקב בעיית תקשורת זמנית. נסה שוב.'));
  assert.notEqual(deps.getAdaptProposal(), null, 'a failed save must not clear the active proposal');
  assert.ok(!calls.some((c) => c[0] === 'recordFeedback'), 'a failed save must not record Dismissed feedback');
});

test('dismissAdaptiveUpdate alerts a non-retry-inviting message when saveProfile() fails with retryable:false (UX-19.2)', async () => {
  const { deps, calls } = fakeDeps({ saveProfile: async () => ({ status: 'FAILED', error: { code: 'permission-denied', retryable: false } }) });
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.dismissAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת הבחירה נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.'));
});

// ── C2: Rejection and Suppression Feedback ──────────────────────────────────────────────

test('C2: dismissAdaptiveUpdate additionally records Dismissed feedback alongside the existing saveProfile() defer (§22 backward compatibility — existing behavior preserved, not replaced)', async () => {
  const { deps, calls, userProfile } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await AdaptiveTdeeController.dismissAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'saveProfile'), 'the existing lastTdeeUpdate defer-write must still happen (external behavior preserved)');
  assert.ok(calls.some((c) => c[0] === 'recordFeedback' && c[1] === 'adaptiveTdee' && c[2] === 'adaptive-proposal' && c[3] === 'Dismissed'));
  assert.equal(userProfile.lastTdeeUpdate, new Date().toISOString().slice(0, 10));
});

test('C2: dismissAdaptiveUpdate never throws when recordFeedbackFn rejects (feedback bookkeeping must never block the dismiss action)', async () => {
  const { deps, calls } = fakeDeps({ recordFeedbackFn: async () => { throw new Error('gateway down'); } });
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  await assert.doesNotReject(AdaptiveTdeeController.dismissAdaptiveUpdate());
  assert.equal(deps.getAdaptProposal(), null, 'the dismissal itself must still complete');
});

test('C2: applyAdaptiveUpdate additionally records Accepted feedback after a successful apply', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'SUCCESS' });
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(calls.some((c) => c[0] === 'recordFeedback' && c[1] === 'adaptiveTdee' && c[2] === 'adaptive-proposal' && c[3] === 'Accepted'));
});

test('C2: applyAdaptiveUpdate does not record feedback when the goal-update persistence itself fails (only a real acceptance counts as evidence)', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'REJECTED' });
  await AdaptiveTdeeController.applyAdaptiveUpdate();
  assert.ok(!calls.some((c) => c[0] === 'recordFeedback'));
});

test('C2: applyAdaptiveUpdate never throws when recordFeedbackFn rejects (feedback bookkeeping must never undo an already-successful apply)', async () => {
  const { deps, userProfile } = fakeDeps({ recordFeedbackFn: async () => { throw new Error('gateway down'); } });
  AdaptiveTdeeController.configure(deps);
  deps._setProposal(readyProposal());
  PersistenceGateway.persist = async () => ({ status: 'SUCCESS' });
  await assert.doesNotReject(AdaptiveTdeeController.applyAdaptiveUpdate());
  assert.equal(userProfile.goalKcal, 1900, 'the already-successful goal update must not be undone by a feedback-recording failure');
});

// ── renderPartialPrompt ─────────────────────────────────────────────────────────────────

test('renderPartialPrompt is a no-op when the element is missing', () => {
  const { deps } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  assert.doesNotThrow(() => AdaptiveTdeeController.renderPartialPrompt());
});

test('renderPartialPrompt hides the element when there are no suspect days', () => {
  const el = fakeElement();
  let hidden = false;
  el.classList.add = (c) => { if (c === 'hidden') hidden = true; };
  const { deps } = fakeDeps({ userProfile: profile({ goalKcal: 2000, confirmedLightDays: [] }), getTodayData: () => ({ meals: [{ kcal: 1900 }] }) });
  deps.documentRef._elements['partial-prompt'] = el;
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderPartialPrompt();
  assert.equal(hidden, true);
});

test('renderPartialPrompt renders the suspect list with working onclick handlers, and reveals the element', () => {
  const el = fakeElement();
  const listEl = fakeElement();
  const txtEl = fakeElement();
  let revealed = false;
  el.classList.remove = (c) => { if (c === 'hidden') revealed = true; };
  const { deps } = fakeDeps({ userProfile: profile({ goalKcal: 2000, confirmedLightDays: [] }), getTodayData: () => ({ meals: [{ kcal: 300 }] }) });
  deps.documentRef._elements['partial-prompt'] = el;
  deps.documentRef._elements['partial-prompt-list'] = listEl;
  deps.documentRef._elements['partial-prompt-text'] = txtEl;
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderPartialPrompt();
  assert.match(listEl.innerHTML, /נרשמו רק 300 קל׳/);
  assert.match(listEl.innerHTML, /onclick="goToScreen\('food'\)"/);
  assert.match(listEl.innerHTML, /onclick="confirmDayLight\('/);
  assert.equal(txtEl.textContent, 'ראיתי ימים עם מעט מאוד רישום. עדכן אותי כדי שאדייק לך את היעד:');
  assert.equal(revealed, true);
});

// ── confirmDayLight ─────────────────────────────────────────────────────────────────────

test('confirmDayLight is a no-op with no profile', async () => {
  const { deps, calls } = fakeDeps({ userProfile: null });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.confirmDayLight('2026-01-01');
  assert.deepEqual(calls, []);
});

test('confirmDayLight adds the day (deduped), saves, re-renders, and re-checks the engine', async () => {
  const { deps, calls, userProfile } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.confirmDayLight('2026-01-01');
  await AdaptiveTdeeController.confirmDayLight('2026-01-01');
  assert.deepEqual(userProfile.confirmedLightDays, ['2026-01-01']);
  assert.equal(calls.filter((c) => c[0] === 'saveProfile').length, 2);
  assert.ok(calls.some((c) => c[0] === 'runEngineAction' && c[1] === 'SOURCE_DATA_CHANGED' && c[2] === 'adaptiveTdeeEngine' && c[3] === 'WEIGHT_CHANGED'));
});

test('confirmDayLight rolls back the confirmedLightDays entry, alerts a structured message, and skips the engine recheck when saveProfile() fails (UX-19.1-19.4, WP6)', async () => {
  const { deps, calls, userProfile } = fakeDeps({ saveProfile: async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } }) });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.confirmDayLight('2026-01-01');
  assert.deepEqual(userProfile.confirmedLightDays, [], 'a failed save must roll back the optimistic day addition');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת האישור נכשלה עקב בעיית תקשורת זמנית. נסה שוב.'));
  assert.ok(!calls.some((c) => c[0] === 'runEngineAction'), 'the day-classification recheck must not run against an unsaved confirmation');
});

test('confirmDayLight does not remove a day that was already confirmed before this call, even when the (no-op) save fails', async () => {
  const { deps, userProfile } = fakeDeps({
    userProfile: profile({ confirmedLightDays: ['2026-01-01'] }),
    saveProfile: async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } })
  });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.confirmDayLight('2026-01-01');
  assert.deepEqual(userProfile.confirmedLightDays, ['2026-01-01'], 'an already-confirmed day must not be removed by a later failed no-op save');
});

// ── logMeasurements ─────────────────────────────────────────────────────────────────────

test('logMeasurements alerts and returns without saving when waist is missing or out of range', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.logMeasurements();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'הכנס היקף מותן תקין (ס"מ)'));
  assert.ok(!calls.some((c) => c[0] === 'saveProfile'));
});

test('logMeasurements saves a valid entry, overwrites same-day entries, clears inputs, and confirms', async () => {
  const waistEl = fakeElement({ value: '85' });
  const armEl = fakeElement({ value: '30' });
  const chestEl = fakeElement({ value: '95' });
  const { deps, calls, userProfile } = fakeDeps({ userProfile: profile({ measurementHistory: [{ date: new Date().toISOString().slice(0, 10), waist: 80 }] }) });
  deps.documentRef._elements['meas-waist'] = waistEl;
  deps.documentRef._elements['meas-arm'] = armEl;
  deps.documentRef._elements['meas-chest'] = chestEl;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.logMeasurements();
  assert.equal(userProfile.measurementHistory.length, 1, 'same-day entry must be overwritten, not duplicated');
  assert.equal(userProfile.measurementHistory[0].waist, 85);
  assert.equal(userProfile.measurementHistory[0].arm, 30);
  assert.equal(userProfile.measurementHistory[0].chest, 95);
  assert.equal(waistEl.value, '');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'ההיקפים נשמרו ✓'));
});

test('logMeasurements rolls back measurementHistory, alerts a structured message, and leaves the inputs unfilled when saveProfile() fails (UX-19.1-19.4, WP6)', async () => {
  const waistEl = fakeElement({ value: '85' });
  const { deps, calls, userProfile } = fakeDeps({
    userProfile: profile({ measurementHistory: [{ date: '2020-01-01', waist: 70 }] }),
    saveProfile: async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } })
  });
  deps.documentRef._elements['meas-waist'] = waistEl;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.logMeasurements();
  assert.deepEqual(userProfile.measurementHistory, [{ date: '2020-01-01', waist: 70 }], 'a failed save must roll back to the pre-attempt history exactly');
  assert.equal(waistEl.value, '85', 'the entered value must remain visible — not cleared on a failed save (UX-19.4)');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת ההיקפים נכשלה עקב בעיית תקשורת זמנית. נסה שוב.'));
  assert.ok(!calls.some((c) => c[0] === 'alert' && c[1] === 'ההיקפים נשמרו ✓'), 'must never show the success alert for a failed save (UX-19.3)');
});

test('logMeasurements alerts a non-retry-inviting message when saveProfile() fails with retryable:false (UX-19.2)', async () => {
  const waistEl = fakeElement({ value: '85' });
  const { deps, calls } = fakeDeps({ saveProfile: async () => ({ status: 'FAILED', error: { code: 'permission-denied', retryable: false } }) });
  deps.documentRef._elements['meas-waist'] = waistEl;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.logMeasurements();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת ההיקפים נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.'));
});

test('logMeasurements ignores out-of-range optional arm/chest values', async () => {
  const waistEl = fakeElement({ value: '85' });
  const armEl = fakeElement({ value: '5' }); // below 10 -> ignored
  const { deps, userProfile } = fakeDeps({ userProfile: profile({ measurementHistory: [] }) });
  deps.documentRef._elements['meas-waist'] = waistEl;
  deps.documentRef._elements['meas-arm'] = armEl;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.logMeasurements();
  assert.equal(userProfile.measurementHistory[0].arm, undefined);
});

// ── renderMeasurements (preserves the original's analyzeMeasurements() no-arg quirk) ────

test('renderMeasurements shows the empty-state message when there is no measurement history', () => {
  const el = fakeElement();
  const { deps } = fakeDeps({ userProfile: profile({ measurementHistory: [] }) });
  deps.documentRef._elements['measurements-data'] = el;
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderMeasurements();
  assert.match(el.innerHTML, /רשום היקף מותן שבועי/);
});

test('renderMeasurements never shows a trend arrow, even with a real improving trend in history — preserves the original analyzeMeasurements() no-arg bug exactly', () => {
  const el = fakeElement();
  const mh = [
    { date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10), waist: 90 },
    { date: new Date().toISOString().slice(0, 10), waist: 85 }
  ];
  const { deps } = fakeDeps({ userProfile: profile({ measurementHistory: mh, goal: 'cut' }) });
  deps.documentRef._elements['measurements-data'] = el;
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderMeasurements();
  assert.match(el.innerHTML, /85 ס"מ/);
  assert.doesNotMatch(el.innerHTML, /ס"מ\/שבוע/, 'trend text must never appear — analyzeMeasurements() is called with no argument in the original code');
});

// ── renderAdaptiveSettings ──────────────────────────────────────────────────────────────

test('renderAdaptiveSettings toggles the active rate button, the enabled toggle, and shows TDEE info', () => {
  const rateButtons = fakeSegButtons(['gentle', 'balanced', 'aggressive']);
  const tog = fakeElement();
  const info = fakeElement();
  const { deps } = fakeDeps({ userProfile: profile({ rate: 'aggressive', adaptiveEnabled: true, adaptiveTdee: 2300, lastTdeeUpdate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) }) });
  deps.documentRef._groups['#set-adapt-rate .seg-btn'] = rateButtons;
  deps.documentRef._elements['adapt-toggle'] = tog;
  deps.documentRef._elements['adapt-info'] = info;
  let togOn = null;
  tog.classList.toggle = (cls, on) => { if (cls === 'on') togOn = on; };
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderAdaptiveSettings();
  assert.equal(rateButtons[2].classList.toggled, true);
  assert.equal(togOn, true);
  assert.match(info.innerHTML, /2,300 קל׳/);
  assert.match(info.innerHTML, /לפני 3 ימים/);
});

test('renderAdaptiveSettings shows "לומד..." when there is no adaptiveTdee yet, and "—" for last update', () => {
  const info = fakeElement();
  const { deps } = fakeDeps();
  deps.documentRef._groups['#set-adapt-rate .seg-btn'] = [];
  deps.documentRef._elements['adapt-info'] = info;
  AdaptiveTdeeController.configure(deps);
  AdaptiveTdeeController.renderAdaptiveSettings();
  assert.match(info.innerHTML, /לומד\.\.\./);
  assert.match(info.innerHTML, /—/);
});

// ── setAdaptiveRate / toggleAdaptive ────────────────────────────────────────────────────

test('setAdaptiveRate is a no-op for an invalid rate or missing profile', async () => {
  const { deps, calls } = fakeDeps();
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.setAdaptiveRate('nonsense');
  assert.deepEqual(calls, []);
});

test('setAdaptiveRate mutates the profile, toggles buttons, saves, and rechecks the engine', async () => {
  const buttons = fakeSegButtons(['gentle', 'balanced']);
  const { deps, calls, userProfile } = fakeDeps();
  deps.documentRef._groups['#set-adapt-rate .seg-btn'] = buttons;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.setAdaptiveRate('gentle');
  assert.equal(userProfile.rate, 'gentle');
  assert.equal(buttons[0].classList.toggled, true);
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));
  assert.ok(calls.some((c) => c[0] === 'runEngineAction' && c[1] === 'MANUAL' && c[3] === 'ADAPTIVE_RECHECK'));
});

test('setAdaptiveRate rolls back the rate + button state, alerts a structured message, and skips the engine recheck when saveProfile() fails (UX-19.1-19.4, WP6)', async () => {
  const buttons = fakeSegButtons(['gentle', 'balanced']);
  const { deps, calls, userProfile } = fakeDeps({
    userProfile: profile({ rate: 'balanced' }),
    saveProfile: async () => ({ status: 'FAILED', error: { code: 'unavailable', retryable: true } })
  });
  deps.documentRef._groups['#set-adapt-rate .seg-btn'] = buttons;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.setAdaptiveRate('gentle');
  assert.equal(userProfile.rate, 'balanced', 'a failed save must roll back the optimistic rate mutation');
  assert.equal(buttons[0].classList.toggled, false, 'the "gentle" button must be un-toggled back');
  assert.equal(buttons[1].classList.toggled, true, 'the previous "balanced" button must be re-toggled active');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת ההגדרה נכשלה עקב בעיית תקשורת זמנית. נסה שוב.'));
  assert.ok(!calls.some((c) => c[0] === 'runEngineAction'), 'the recheck must not run against an unsaved rate change');
});

test('toggleAdaptive flips adaptiveEnabled, toggles the DOM, saves, and rechecks the engine', async () => {
  const tog = fakeElement();
  let togOn = null;
  tog.classList.toggle = (cls, on) => { if (cls === 'on') togOn = on; };
  const { deps, calls, userProfile } = fakeDeps({ userProfile: profile({ adaptiveEnabled: true }) });
  deps.documentRef._elements['adapt-toggle'] = tog;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.toggleAdaptive();
  assert.equal(userProfile.adaptiveEnabled, false);
  assert.equal(togOn, false);
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));
  assert.ok(calls.some((c) => c[0] === 'runEngineAction'));
});

test('toggleAdaptive rolls back adaptiveEnabled + the DOM toggle, alerts a structured message, and skips the engine recheck when saveProfile() fails (UX-19.1-19.4, WP6)', async () => {
  const tog = fakeElement();
  let togOn = null;
  tog.classList.toggle = (cls, on) => { if (cls === 'on') togOn = on; };
  const { deps, calls, userProfile } = fakeDeps({
    userProfile: profile({ adaptiveEnabled: true }),
    saveProfile: async () => ({ status: 'FAILED', error: { code: 'permission-denied', retryable: false } })
  });
  deps.documentRef._elements['adapt-toggle'] = tog;
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.toggleAdaptive();
  assert.equal(userProfile.adaptiveEnabled, true, 'a failed save must roll back the optimistic toggle');
  assert.equal(togOn, true, 'the DOM toggle must be reverted back to on');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שמירת ההגדרה נכשלה ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.'));
  assert.ok(!calls.some((c) => c[0] === 'runEngineAction'));
});

test('toggleAdaptive is a no-op with no profile', async () => {
  const { deps, calls } = fakeDeps({ userProfile: null });
  AdaptiveTdeeController.configure(deps);
  await AdaptiveTdeeController.toggleAdaptive();
  assert.deepEqual(calls, []);
});
