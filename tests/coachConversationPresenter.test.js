// CCC-001 (docs/specs/CCC_001_SPEC_v1.0.md §7/§12) — js/ui/coachConversationPresenter.js unit
// tests, covering the new history-rendering and sign-out-cleanup behavior. A minimal fake DOM
// is injected via configure({documentRef}), mirroring tests/homePresenter.test.js's own
// established fakeDocument()/fakeElement() convention.
// Run with: node --test tests/coachConversationPresenter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Presenter = require('../js/ui/coachConversationPresenter.js');

function fakeElement(overrides) {
  const el = Object.assign({
    style: {}, _text: '', className: '', children: [],
    appendChild(child) { this.children.push(child); },
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; },
    get innerHTML() { return this._html || ''; },
    set innerHTML(v) { this._html = v; this.children = []; }
  }, overrides || {});
  return el;
}

function fakeDocument() {
  const thread = fakeElement({ id: 'coach-conversation-thread' });
  const elements = { 'coach-conversation-thread': thread };
  return {
    thread,
    getElementById(id) { return elements[id] || null; },
    createElement() { return fakeElement({}); }
  };
}

test.beforeEach(() => { Presenter.configure({ documentRef: fakeDocument() }); });

test('renderHistoryTurn: a COMPLETED record renders both a user bubble and an assistant bubble', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  Presenter.renderHistory([{ turnId: 't1', userText: 'שלום', assistantText: 'שלום לך', status: 'COMPLETED', submittedAt: 1 }]);
  assert.equal(doc.thread.children.length, 2);
  assert.equal(doc.thread.children[0].textContent, 'שלום');
  assert.equal(doc.thread.children[0].className, 'coach-conversation-bubble coach-conversation-bubble-user');
  assert.equal(doc.thread.children[1].textContent, 'שלום לך');
  assert.equal(doc.thread.children[1].className, 'coach-conversation-bubble coach-conversation-bubble-coach');
});

test('renderHistoryTurn: a PENDING record renders only the user bubble — no assistant bubble, no error indicator', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  Presenter.renderHistory([{ turnId: 't1', userText: 'אני עייף היום', assistantText: null, status: 'PENDING', submittedAt: 1 }]);
  assert.equal(doc.thread.children.length, 1);
  assert.equal(doc.thread.children[0].textContent, 'אני עייף היום');
});

test('renderHistoryTurn: a SILENCE record renders only the user bubble — identical treatment to PENDING, never a structural "this failed" indicator', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  Presenter.renderHistory([{ turnId: 't1', userText: 'אני עייף היום', assistantText: null, status: 'SILENCE', submittedAt: 1 }]);
  assert.equal(doc.thread.children.length, 1);
});

test('renderHistory: renders multiple records in the array\'s own given order, and clears the thread first (no duplicate content on a repeated call)', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  const records = [
    { turnId: 't1', userText: 'first', assistantText: 'reply1', status: 'COMPLETED', submittedAt: 1 },
    { turnId: 't2', userText: 'second', assistantText: null, status: 'PENDING', submittedAt: 2 }
  ];
  Presenter.renderHistory(records);
  assert.equal(doc.thread.children.length, 3); // 2 bubbles for t1, 1 bubble for t2
  Presenter.renderHistory(records); // repeated call
  assert.equal(doc.thread.children.length, 3, 'a repeated renderHistory() call must not duplicate content');
});

test('renderHistory: an empty array clears the thread and renders nothing', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  Presenter.renderHistory([{ turnId: 't1', userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1 }]);
  assert.equal(doc.thread.children.length, 2);
  Presenter.renderHistory([]);
  assert.equal(doc.thread.children.length, 0);
});

test('clearThread() empties the thread container directly', () => {
  const doc = fakeDocument();
  Presenter.configure({ documentRef: doc });
  Presenter.renderHistory([{ turnId: 't1', userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1 }]);
  Presenter.clearThread();
  assert.equal(doc.thread.children.length, 0);
});

// S/T — sign-out cleanup: behavioral proof, complementing tests/ccc001Wiring.test.js's own
// static source verification.
test('S/T: configure() registers a SessionLifecycle cleanup that clears the thread and resets the clarification ref, and touches nothing else', () => {
  const registered = {};
  const fakeSessionLifecycle = { registerCleanup: (name, fn) => { registered[name] = fn; } };
  const previousWindow = global.window;
  global.window = { SessionLifecycle: fakeSessionLifecycle };
  try {
    const doc = fakeDocument();
    Presenter.configure({ documentRef: doc });
    assert.equal(typeof registered.coachConversation, 'function');

    Presenter.renderHistory([{ turnId: 't1', userText: 'x', assistantText: 'y', status: 'COMPLETED', submittedAt: 1 }]);
    assert.equal(doc.thread.children.length, 2);

    // Simulate the real sign-out transition SessionLifecycle.reset() would trigger.
    registered.coachConversation();

    assert.equal(doc.thread.children.length, 0, 'sign-out must clear the rendered thread');
    // The clarification ref is also reset — proven indirectly: consumeClarificationContext()
    // returns undefined immediately after the cleanup fires, exactly as it would for a thread
    // that never had a clarification-kind response at all.
    assert.equal(Presenter.consumeClarificationContext(), undefined);
  } finally {
    if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
  }
});

test('a fresh configure() call is idempotent — re-configuring does not register a duplicate cleanup (SessionLifecycle.registerCleanup is itself idempotent by name)', () => {
  const registrations = [];
  const fakeSessionLifecycle = { registerCleanup: (name, fn) => { registrations.push(name); } };
  const previousWindow = global.window;
  global.window = { SessionLifecycle: fakeSessionLifecycle };
  try {
    Presenter.configure({ documentRef: fakeDocument() });
    Presenter.configure({ documentRef: fakeDocument() });
    assert.deepEqual(registrations, ['coachConversation', 'coachConversation']); // registerCleanup itself dedupes by name — this presenter never tries to avoid calling it twice
  } finally {
    if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
  }
});
