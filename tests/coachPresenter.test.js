// C1-WP6 — js/coach/coachPresenter.js unit tests.
// Covers: refreshCoachCard (once-per-open guard, session guard, DOM update on success,
// silent failure), renderCoachSettings, saveCoachSettings, setCoachStyle/setCoachChatter
// (mutation + DOM toggle + save), and testCoachMessage — all via injected DOM/state
// closures, matching the original app.js functions exactly.
// Run with: node --test tests/coachPresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CoachPresenter = require('../js/coach/coachPresenter.js');
const CoachPromptComposer = require('../js/coach/coachPromptComposer.js');

// refreshCoachCard calls the real CoachPromptComposer.composeHomeCardContext directly
// (shared require-cache singleton, same pattern as barcodeFlowController.js's direct
// adapter requires) — it needs its own configure() independent of CoachPresenter's.
CoachPromptComposer.configure({ sessionLifecycle: { getGeneration: () => 1 }, goalLabels: { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' } });

function fakeElement(overrides) {
  return Object.assign({ classList: { add() {}, remove() {} }, style: {}, innerHTML: '', textContent: '', value: '' }, overrides);
}
// TASK-007 UX-12.5 (WP5): card double that additionally supports querySelector/appendChild,
// for the coach-card dismiss-button tests — same pattern as tests/triggerController.test.js's
// fakeCardWithChildren.
function fakeCardWithChildren() {
  const el = fakeElement();
  el._children = [];
  el.querySelector = (sel) => (sel === '.coach-card-dismiss' ? (el._children.find((c) => c.className.indexOf('coach-card-dismiss') !== -1) || null) : null);
  el.appendChild = (child) => { el._children.push(child); };
  return el;
}

function fakeSegButtons(count) {
  return Array.from({ length: count }, (_, i) => Object.assign(fakeElement(), { dataset: { val: 'v' + i }, classList: { toggled: null, toggle(cls, on) { this.toggled = on; } } }));
}

function fakeDocument(overrides) {
  const elements = {};
  const groups = {};
  const doc = {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => groups[sel] || [],
    // TASK-007 UX-12.5 (WP5): minimal createElement so ensureCoachCardDismissButton can build
    // a real-ish button double — same pattern as tests/triggerController.test.js's fakeDocument.
    createElement: (tag) => Object.assign(fakeElement(), { tagName: tag, className: '', onclick: null }),
    _elements: elements,
    _groups: groups
  };
  Object.assign(doc, overrides);
  return doc;
}

function fakeDeps(overrides) {
  const calls = [];
  let coachCardShown = false;
  const userProfile = { name: 'רן', coachName: '', coachStyle: 'mixed', coachChatter: 'balanced', goal: 'cut', goalKcal: 2000, streak: 3 };
  const todayData = { meals: [{ kcal: 400, protein: 20 }], burned: 0, steps: 0 };
  const doc = fakeDocument();
  const deps = {
    documentRef: doc,
    sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true },
    getUserProfile: () => userProfile,
    getTodayData: () => todayData,
    getCoachCardShown: () => coachCardShown,
    setCoachCardShown: (v) => { coachCardShown = v; },
    saveProfile: async () => calls.push(['saveProfile']),
    coachMessageFn: async (ctx) => { calls.push(['coachMessage', ctx]); return 'הודעת מאמן'; }
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc, userProfile, todayData };
}

// ── refreshCoachCard ────────────────────────────────────────────────────────────────────

test('refreshCoachCard is a no-op when already shown, or when there is no userProfile', async () => {
  const { deps, calls } = fakeDeps({ getCoachCardShown: () => true });
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();
  assert.deepEqual(calls, []);

  const { deps: deps2, calls: calls2 } = fakeDeps({ getUserProfile: () => null });
  CoachPresenter.configure(deps2);
  await CoachPresenter.refreshCoachCard();
  assert.deepEqual(calls2, []);
});

test('refreshCoachCard sets the shown flag before doing anything else, and is a no-op if the DOM elements are missing', async () => {
  let shownSetTo = null;
  const { deps } = fakeDeps({ setCoachCardShown: (v) => { shownSetTo = v; } });
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();
  assert.equal(shownSetTo, true);
});

test('refreshCoachCard updates the DOM with the coach message and reveals the card on success', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  let revealed = false;
  card.classList.remove = (cls) => { if (cls === 'hidden') revealed = true; };
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();
  assert.equal(textEl.textContent, 'הודעת מאמן');
  assert.equal(revealed, true);
  assert.ok(calls.some((c) => c[0] === 'coachMessage'));
});

test('refreshCoachCard silently does nothing on coachMessage failure (network error)', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps } = fakeDeps({ coachMessageFn: async () => { throw new Error('network'); } });
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  CoachPresenter.configure(deps);
  await assert.doesNotReject(CoachPresenter.refreshCoachCard());
  assert.equal(textEl.textContent, '');
});

test('refreshCoachCard suppresses the DOM update when the session goes stale mid-request', async () => {
  const card = fakeElement();
  const textEl = fakeElement();
  const { deps } = fakeDeps({ sessionLifecycle: { getGeneration: () => 1, isCurrent: () => false } });
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();
  assert.equal(textEl.textContent, '');
});

// ── TASK-007 UX-12.5 (WP5) — coach-card Dismiss affordance ─────────────────────────────

test('refreshCoachCard adds a Dismiss button that hides the card and does not record C2 feedback (UX-12.5, UX-11.1)', async () => {
  const card = fakeCardWithChildren();
  const textEl = fakeElement();
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();

  const btn = card._children.find((c) => c.className.indexOf('coach-card-dismiss') !== -1);
  assert.ok(btn, 'a dismiss button must be appended to the card');
  let hidden = false;
  card.classList.add = (c) => { if (c === 'hidden') hidden = true; };
  btn.onclick();
  assert.equal(hidden, true);
  assert.ok(!calls.some((c) => c[0] === 'recordFeedback'), 'coach-card is not a Recommendation/Initiative/Trigger/Adaptive-proposal-like surface — its Dismiss must not record C2 feedback (UX-11.1)');
});

test('refreshCoachCard is a no-op after the first successful call, so the dismiss button is never duplicated (once-per-open guard already covers idempotency)', async () => {
  const card = fakeCardWithChildren();
  const textEl = fakeElement();
  const { deps } = fakeDeps();
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  CoachPresenter.configure(deps);
  await CoachPresenter.refreshCoachCard();
  await CoachPresenter.refreshCoachCard(); // guarded by getCoachCardShown() — must not run again
  assert.equal(card._children.filter((c) => c.className.indexOf('coach-card-dismiss') !== -1).length, 1);
});

test('refreshCoachCard does not throw when the card DOM double lacks querySelector/appendChild (defensive, same discipline as trigger-card)', async () => {
  const card = fakeElement(); // plain double — no querySelector/appendChild
  const textEl = fakeElement();
  const { deps } = fakeDeps();
  deps.documentRef._elements['coach-card'] = card;
  deps.documentRef._elements['coach-card-text'] = textEl;
  let revealed = false;
  card.classList.remove = (cls) => { if (cls === 'hidden') revealed = true; };
  CoachPresenter.configure(deps);
  await assert.doesNotReject(CoachPresenter.refreshCoachCard());
  assert.equal(revealed, true, 'the card must still be revealed even when the dismiss-button helper cannot attach');
});

// ── renderCoachSettings ─────────────────────────────────────────────────────────────────

test('renderCoachSettings is a no-op with no userProfile', () => {
  const { deps } = fakeDeps({ getUserProfile: () => null });
  CoachPresenter.configure(deps);
  assert.doesNotThrow(() => CoachPresenter.renderCoachSettings());
});

test('renderCoachSettings fills the name input and toggles the active style/chatter buttons', () => {
  const nameEl = fakeElement();
  const styleButtons = fakeSegButtons(2);
  styleButtons[1].dataset.val = 'mixed';
  const { deps } = fakeDeps();
  deps.documentRef._elements['set-coach-name'] = nameEl;
  deps.documentRef._groups['#set-coach-style .seg-btn'] = styleButtons;
  deps.documentRef._groups['#set-coach-chatter .seg-btn'] = [];
  CoachPresenter.configure(deps);
  CoachPresenter.renderCoachSettings();
  assert.equal(nameEl.value, 'רן');
  assert.equal(styleButtons[0].classList.toggled, false);
  assert.equal(styleButtons[1].classList.toggled, true);
});

// ── saveCoachSettings ───────────────────────────────────────────────────────────────────

test('saveCoachSettings trims the name input into userProfile.coachName, falling back to userProfile.name when blank', async () => {
  const nameEl = fakeElement({ value: '  קפטן  ' });
  const { deps, userProfile, calls } = fakeDeps();
  deps.documentRef._elements['set-coach-name'] = nameEl;
  CoachPresenter.configure(deps);
  await CoachPresenter.saveCoachSettings();
  assert.equal(userProfile.coachName, 'קפטן');
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));

  nameEl.value = '   ';
  await CoachPresenter.saveCoachSettings();
  assert.equal(userProfile.coachName, 'רן');
});

// ── setCoachStyle / setCoachChatter ─────────────────────────────────────────────────────

test('setCoachStyle mutates userProfile, toggles the matching button active, and saves', async () => {
  const buttons = fakeSegButtons(2);
  buttons[0].dataset.val = 'friendly';
  buttons[1].dataset.val = 'professional';
  const { deps, userProfile, calls } = fakeDeps();
  deps.documentRef._groups['#set-coach-style .seg-btn'] = buttons;
  CoachPresenter.configure(deps);
  await CoachPresenter.setCoachStyle('professional');
  assert.equal(userProfile.coachStyle, 'professional');
  assert.equal(buttons[0].classList.toggled, false);
  assert.equal(buttons[1].classList.toggled, true);
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));
});

test('setCoachChatter mutates userProfile, toggles the matching button active, and saves', async () => {
  const buttons = fakeSegButtons(2);
  buttons[0].dataset.val = 'gentle';
  buttons[1].dataset.val = 'minimal';
  const { deps, userProfile, calls } = fakeDeps();
  deps.documentRef._groups['#set-coach-chatter .seg-btn'] = buttons;
  CoachPresenter.configure(deps);
  await CoachPresenter.setCoachChatter('gentle');
  assert.equal(userProfile.coachChatter, 'gentle');
  assert.equal(buttons[0].classList.toggled, true);
  assert.ok(calls.some((c) => c[0] === 'saveProfile'));
});

test('setCoachStyle/setCoachChatter are no-ops with no userProfile', async () => {
  const { deps, calls } = fakeDeps({ getUserProfile: () => null });
  CoachPresenter.configure(deps);
  await CoachPresenter.setCoachStyle('friendly');
  await CoachPresenter.setCoachChatter('gentle');
  assert.deepEqual(calls, []);
});

// ── testCoachMessage ────────────────────────────────────────────────────────────────────

test('testCoachMessage saves settings first, shows a loading state, then the result', async () => {
  const out = fakeElement();
  const nameEl = fakeElement();
  const { deps, calls } = fakeDeps();
  deps.documentRef._elements['coach-test-out'] = out;
  deps.documentRef._elements['set-coach-name'] = nameEl;
  CoachPresenter.configure(deps);
  await CoachPresenter.testCoachMessage();
  assert.ok(calls.findIndex((c) => c[0] === 'saveProfile') < calls.findIndex((c) => c[0] === 'coachMessage'));
  assert.equal(out.textContent, 'הודעת מאמן');
});

test('testCoachMessage falls back to a not-received message when coachMessage resolves empty', async () => {
  const out = fakeElement();
  const { deps } = fakeDeps({ coachMessageFn: async () => '' });
  deps.documentRef._elements['coach-test-out'] = out;
  CoachPresenter.configure(deps);
  await CoachPresenter.testCoachMessage();
  assert.equal(out.textContent, 'לא התקבלה תשובה.');
});

test('testCoachMessage surfaces a thrown error message', async () => {
  const out = fakeElement();
  const { deps } = fakeDeps({ coachMessageFn: async () => { throw new Error('boom'); } });
  deps.documentRef._elements['coach-test-out'] = out;
  CoachPresenter.configure(deps);
  await CoachPresenter.testCoachMessage();
  assert.equal(out.textContent, 'שגיאה: boom');
});

test('testCoachMessage is a no-op if the output element is missing', async () => {
  const { deps } = fakeDeps();
  CoachPresenter.configure(deps);
  await assert.doesNotReject(CoachPresenter.testCoachMessage());
});
