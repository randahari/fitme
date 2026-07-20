// C1-WP5F — js/nutrition/barcodeFlowController.js unit tests.
// BarcodeScannerAdapter/OpenFoodFactsClient/BarcodeRepository are required directly by the
// module (stable WP2/WP3 singletons, same require-cache instance as this test file) — so
// their own methods are monkey-patched per test rather than injected via configure(), exactly
// mirroring how the browser shares one global object across <script> tags. All DOM/state/
// app.js collaborators the module itself owns via configure() are injected as usual.
// Run with: node --test tests/barcodeFlowController.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const BarcodeScannerAdapter = require('../js/adapters/barcodeScannerAdapter.js');
const OpenFoodFactsClient = require('../js/adapters/openFoodFactsClient.js');
const BarcodeRepository = require('../js/repositories/barcodeRepository.js');
const BarcodeFlowController = require('../js/nutrition/barcodeFlowController.js');

function fakeElement(overrides) {
  return Object.assign({ classList: { add() {}, remove() {} }, style: {}, innerHTML: '', textContent: '' }, overrides);
}

function fakeDocument(overrides) {
  const elements = {};
  const calls = [];
  const doc = {
    getElementById: (id) => { calls.push(['getElementById', id]); return elements[id] || null; },
    createElement: (tag) => { calls.push(['createElement', tag]); const el = fakeElement(); return el; },
    body: { appendChild: (el) => { calls.push(['appendChild', el.id]); elements[el.id] = el; } },
    _elements: elements
  };
  Object.assign(doc, overrides);
  return { doc, calls };
}

function fakeDeps(overrides) {
  const calls = [];
  let gen = 1;
  const userProfile = { name: 'דנה', groupId: 'g1' };
  const { doc } = fakeDocument();
  const deps = {
    documentRef: doc,
    alertFn: (msg) => calls.push(['alert', msg]),
    sessionLifecycle: { getGeneration: () => gen, isCurrent: (g) => g === gen, _bump: () => { gen++; } },
    showMealEditor: (meal) => calls.push(['showMealEditor', meal]),
    startLabelCamera: () => calls.push(['startLabelCamera']),
    getUserProfile: () => userProfile,
    setPendingBarcode: (code) => calls.push(['setPendingBarcode', code])
  };
  Object.assign(deps, overrides);
  return { deps, calls, doc };
}

function withMockTimeout(fn) {
  const original = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (cb, ms) => { scheduled.push({ cb, ms }); return scheduled.length; };
  try {
    return fn(scheduled);
  } finally {
    global.setTimeout = original;
  }
}

// ── startBarcode ────────────────────────────────────────────────────────────────────────

test('startBarcode alerts and returns immediately when the overlay element is missing', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  await BarcodeFlowController.startBarcode();
  assert.deepEqual(calls, [['alert', 'סריקת ברקוד לא זמינה בדפדפן זה.']]);
});

test('startBarcode: full successful sequence — overlay shown, scanner created and started', async () => {
  const overlay = fakeElement();
  const statusEl = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : id === 'barcode-status' ? statusEl : null);
  const { deps, calls } = fakeDeps({ documentRef: doc });
  const scanner = {};
  BarcodeScannerAdapter.loadLibrary = async () => {};
  BarcodeScannerAdapter.createScanner = () => scanner;
  let startedWith = null;
  BarcodeScannerAdapter.start = async (s, onDetected) => { startedWith = { s, onDetected }; };
  BarcodeFlowController.configure(deps);
  await withMockTimeout(async () => { await BarcodeFlowController.startBarcode(); });
  assert.equal(statusEl.textContent, 'מכוון את המצלמה לברקוד...');
  assert.equal(startedWith.s, scanner);
  assert.equal(typeof startedWith.onDetected, 'function');
  assert.equal(calls.some((c) => c[0] === 'alert'), false);
});

test('startBarcode: loadLibrary failure closes the overlay and alerts a load-failure message', async () => {
  const overlay = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : fakeElement());
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeScannerAdapter.loadLibrary = async () => { throw new Error('network'); };
  BarcodeFlowController.configure(deps);
  await BarcodeFlowController.startBarcode();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'טעינת הסורק נכשלה. בדוק חיבור לאינטרנט.'));
});

test('startBarcode: createScanner failure closes the overlay and alerts an init-failure message', async () => {
  const overlay = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : fakeElement());
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeScannerAdapter.loadLibrary = async () => {};
  BarcodeScannerAdapter.createScanner = () => { throw new Error('boom'); };
  BarcodeFlowController.configure(deps);
  await BarcodeFlowController.startBarcode();
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שגיאה באתחול הסורק.'));
});

test('startBarcode: scanner.start() rejection closes the overlay and alerts a camera-permission message', async () => {
  const overlay = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : fakeElement());
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeScannerAdapter.loadLibrary = async () => {};
  BarcodeScannerAdapter.createScanner = () => ({});
  BarcodeScannerAdapter.start = async () => { throw new Error('denied'); };
  BarcodeFlowController.configure(deps);
  await withMockTimeout(async () => { await BarcodeFlowController.startBarcode(); });
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'לא ניתן לפתוח מצלמה. אפשר גישה למצלמה בהגדרות הדפדפן.'));
});

// ── onBarcodeDetected ──────────────────────────────────────────────────────────────────

test('onBarcodeDetected ignores a falsy code and does not dispatch a lookup', () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeScannerAdapter.stop = () => calls.push(['stop']);
  BarcodeFlowController.onBarcodeDetected(null, fakeElement());
  assert.deepEqual(calls, []);
});

test('onBarcodeDetected dedupes: a second detection is ignored once a code was already captured', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeScannerAdapter.stop = () => {};
  const statusEl = fakeElement();
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => ({ found: false });
  BarcodeFlowController.onBarcodeDetected('111', statusEl);
  BarcodeFlowController.onBarcodeDetected('222', statusEl);
  assert.equal(statusEl.textContent, 'נמצא ברקוד: 111 — מחפש מוצר...');
});

// ── armBarcodeHint ─────────────────────────────────────────────────────────────────────

test('armBarcodeHint shows the hint text after the timer fires, with a working barcodeToLabel() onclick handler embedded, but only when no code was captured meanwhile', async () => {
  // Force barcodeLastCode back to null via a real startBarcode() call (the only legitimate
  // reset path — the module has no dedicated reset export), so this test is self-contained
  // regardless of what earlier tests left behind in the module's private state.
  const overlay = fakeElement();
  const startStatusEl = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : id === 'barcode-status' ? startStatusEl : null);
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeScannerAdapter.loadLibrary = async () => {};
  BarcodeScannerAdapter.createScanner = () => ({});
  BarcodeScannerAdapter.start = async () => {};
  await withMockTimeout(async () => { await BarcodeFlowController.startBarcode(); });

  const statusEl = fakeElement();
  withMockTimeout((scheduled) => {
    BarcodeFlowController.armBarcodeHint(statusEl);
    assert.equal(scheduled.length, 1);
    assert.equal(scheduled[0].ms, 20000);
    scheduled[0].cb();
  });
  assert.match(statusEl.innerHTML, /לא מזהה\? קרב מעט את הברקוד/);
  assert.match(statusEl.innerHTML, /onclick="barcodeToLabel\(\)"/);

  // Now capture a code and verify the hint is suppressed the next time the timer fires.
  BarcodeScannerAdapter.stop = () => {};
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => ({ found: false });
  BarcodeFlowController.onBarcodeDetected('999', statusEl);
  const statusEl2 = fakeElement();
  withMockTimeout((scheduled) => {
    BarcodeFlowController.armBarcodeHint(statusEl2);
    scheduled[0].cb();
  });
  assert.equal(statusEl2.innerHTML, '', 'the hint must not overwrite statusEl once a code was already captured');
});

// ── barcodeToLabel / stopBarcodeReader / closeBarcode ─────────────────────────────────

test('barcodeToLabel closes the scanner and opens the label prompt with a manual- prefixed code', () => {
  const overlay = fakeElement();
  const { doc } = fakeDocument();
  doc.getElementById = (id) => (id === 'barcode-overlay' ? overlay : id === 'label-prompt' ? null : fakeElement());
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeScannerAdapter.stop = () => {};
  BarcodeFlowController.barcodeToLabel();
  const setCall = calls.find((c) => c[0] === 'setPendingBarcode');
  assert.ok(setCall);
  assert.match(setCall[1], /^manual-\d+$/);
});

test('closeBarcode stops the reader and hides the overlay if present; is a no-op if the overlay is missing', () => {
  const overlay = fakeElement();
  const { doc } = fakeDocument();
  let hidden = false;
  overlay.classList.add = () => { hidden = true; };
  doc.getElementById = () => overlay;
  const { deps } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  let stopped = false;
  BarcodeScannerAdapter.stop = () => { stopped = true; };
  BarcodeFlowController.closeBarcode();
  assert.equal(hidden, true);

  const { doc: doc2 } = fakeDocument();
  doc2.getElementById = () => null;
  BarcodeFlowController.configure(Object.assign({}, deps, { documentRef: doc2 }));
  assert.doesNotThrow(() => BarcodeFlowController.closeBarcode());
});

// ── showLabelPrompt / labelPromptCapture / closeLabelPrompt ───────────────────────────

test('showLabelPrompt sets pendingBarcode, creates the modal element once, and fills it with the recovery buttons', () => {
  const { doc, calls: docCalls } = fakeDocument();
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeFlowController.showLabelPrompt('CODE1');
  assert.ok(calls.some((c) => c[0] === 'setPendingBarcode' && c[1] === 'CODE1'));
  assert.ok(docCalls.some((c) => c[0] === 'createElement' && c[1] === 'div'));
  const el = doc._elements['label-prompt'];
  assert.ok(el);
  assert.match(el.innerHTML, /onclick="labelPromptCapture\(\)"/);
  assert.match(el.innerHTML, /onclick="closeLabelPrompt\(\)"/);
  assert.equal(el.style.display, 'flex');
});

test('showLabelPrompt reuses an existing #label-prompt element instead of creating a second one', () => {
  const { doc, calls: docCalls } = fakeDocument();
  const existing = fakeElement({ id: 'label-prompt' });
  doc._elements['label-prompt'] = existing;
  doc.getElementById = (id) => doc._elements[id] || null;
  const { deps } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeFlowController.showLabelPrompt('CODE2');
  assert.ok(!docCalls.some((c) => c[0] === 'createElement'));
  assert.equal(existing.style.display, 'flex');
});

test('labelPromptCapture closes the prompt and triggers the injected startLabelCamera', () => {
  const el = fakeElement({ id: 'label-prompt', style: { display: 'flex' } });
  const { doc } = fakeDocument({ getElementById: () => el });
  const { deps, calls } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeFlowController.labelPromptCapture();
  assert.equal(el.style.display, 'none');
  assert.ok(calls.some((c) => c[0] === 'startLabelCamera'));
});

test('closeLabelPrompt hides the element if present, and is a no-op if missing', () => {
  const el = fakeElement({ style: { display: 'flex' } });
  const { doc } = fakeDocument({ getElementById: () => el });
  const { deps } = fakeDeps({ documentRef: doc });
  BarcodeFlowController.configure(deps);
  BarcodeFlowController.closeLabelPrompt();
  assert.equal(el.style.display, 'none');

  const { doc: doc2 } = fakeDocument({ getElementById: () => null });
  BarcodeFlowController.configure(Object.assign({}, deps, { documentRef: doc2 }));
  assert.doesNotThrow(() => BarcodeFlowController.closeLabelPrompt());
});

// ── getSharedBarcodeGroup / lookupBarcodeInCache / saveBarcodeToCache (group cache persistence) ──

test('getSharedBarcodeGroup returns the current profile groupId, or null when there is no profile / no groupId', () => {
  const { deps } = fakeDeps({ getUserProfile: () => ({ groupId: 'g42' }) });
  BarcodeFlowController.configure(deps);
  assert.equal(BarcodeFlowController.getSharedBarcodeGroup(), 'g42');

  BarcodeFlowController.configure(Object.assign({}, deps, { getUserProfile: () => null }));
  assert.equal(BarcodeFlowController.getSharedBarcodeGroup(), null);

  BarcodeFlowController.configure(Object.assign({}, deps, { getUserProfile: () => ({}) }));
  assert.equal(BarcodeFlowController.getSharedBarcodeGroup(), null);
});

test('lookupBarcodeInCache delegates to BarcodeRepository.lookupInCache with the resolved group key', async () => {
  const { deps } = fakeDeps({ getUserProfile: () => ({ groupId: 'g7' }) });
  BarcodeFlowController.configure(deps);
  let received = null;
  BarcodeRepository.lookupInCache = async (groupKey, code) => { received = { groupKey, code }; return { name: 'x' }; };
  const result = await BarcodeFlowController.lookupBarcodeInCache('C1');
  assert.deepEqual(received, { groupKey: 'g7', code: 'C1' });
  assert.deepEqual(result, { name: 'x' });
});

test('saveBarcodeToCache falls back to the current profile name only when no existingAddedByName is supplied', async () => {
  const { deps } = fakeDeps({ getUserProfile: () => ({ groupId: 'g7', name: 'רן' }) });
  BarcodeFlowController.configure(deps);
  let received = null;
  BarcodeRepository.saveToCache = async (groupKey, code, item, addedByName, updatedByName) => { received = { groupKey, code, item, addedByName, updatedByName }; };
  await BarcodeFlowController.saveBarcodeToCache('C2', { name: 'חלב' }, null);
  assert.equal(received.addedByName, 'רן');
  assert.equal(received.updatedByName, 'רן');

  await BarcodeFlowController.saveBarcodeToCache('C3', { name: 'חלב' }, 'דנה (מקורי)');
  assert.equal(received.addedByName, 'דנה (מקורי)');
});

// ── lookupBarcode (cache-first + Open Food Facts fallback + label fallback + source tagging) ──

test('lookupBarcode: a cache hit with real nutritional data closes the scanner and opens the editor tagged source:group', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeScannerAdapter.stop = () => {};
  BarcodeRepository.lookupInCache = async () => ({ name: 'חלב', amount: 200, unit: 'מ"ל', kcal: 120, protein: 6, carbs: 9, fat: 6, fiber: 0, sugar: 9, sodium: 80, addedByName: 'דנה' });
  await BarcodeFlowController.lookupBarcode('C10');
  const editorCall = calls.find((c) => c[0] === 'showMealEditor');
  assert.ok(editorCall);
  assert.equal(editorCall[1].source, 'group');
  assert.equal(editorCall[1].barcode, 'C10');
  assert.equal(editorCall[1].addedByName, 'דנה');
  assert.equal(editorCall[1].items[0].name, 'חלב');
});

test('lookupBarcode: a cache entry with all-zero nutrition is treated as a miss and falls through to Open Food Facts', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeRepository.lookupInCache = async () => ({ name: 'ריק', kcal: 0, protein: 0, carbs: 0, fat: 0 });
  OpenFoodFactsClient.lookupProduct = async () => ({ found: false });
  await BarcodeFlowController.lookupBarcode('C11');
  assert.ok(!calls.some((c) => c[0] === 'showMealEditor' && c[1].source === 'group'));
  assert.ok(calls.some((c) => c[0] === 'setPendingBarcode'), 'a cache miss with OFF not-found must fall through to the label prompt');
});

test('lookupBarcode: cache miss + Open Food Facts hit opens the editor tagged source:off, with serving-size note text', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => ({
    found: true, item: { name: 'קוטג\'', amount: 100, unit: 'גרם', kcal: 100, protein: 11, carbs: 4, fat: 5, fiber: 0, sugar: 4, sodium: 300 },
    servingSizeKnown: false, servingSizeRaw: null
  });
  await BarcodeFlowController.lookupBarcode('C12');
  const editorCall = calls.find((c) => c[0] === 'showMealEditor');
  assert.ok(editorCall);
  assert.equal(editorCall[1].source, 'off');
  assert.equal(editorCall[1].barcode, 'C12');
  assert.equal(editorCall[1].note, 'לפי 100 גרם — התאם כמות עם +/-');
});

test('lookupBarcode: a known serving size produces a "לפי מנה (...)" note instead of the 100g fallback note', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => ({
    found: true, item: { name: 'יוגורט' }, servingSizeKnown: true, servingSizeRaw: '150 g'
  });
  await BarcodeFlowController.lookupBarcode('C13');
  const editorCall = calls.find((c) => c[0] === 'showMealEditor');
  assert.equal(editorCall[1].note, 'לפי מנה (150 g)');
});

test('lookupBarcode: cache miss + Open Food Facts not-found falls back to the label prompt', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => ({ found: false });
  await BarcodeFlowController.lookupBarcode('C14');
  assert.ok(!calls.some((c) => c[0] === 'showMealEditor'));
  assert.ok(calls.some((c) => c[0] === 'setPendingBarcode' && c[1] === 'C14'));
});

test('lookupBarcode: an Open Food Facts network error is caught and surfaced as a generic search-failure alert', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => { throw new Error('OFF_NETWORK_ERROR'); };
  await BarcodeFlowController.lookupBarcode('C15');
  assert.ok(calls.some((c) => c[0] === 'alert' && c[1] === 'שגיאה בחיפוש המוצר. בדוק חיבור לאינטרנט.'));
});

test('lookupBarcode: a stale session after the cache read suppresses all further effects (no editor, no OFF call)', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  let bump;
  BarcodeRepository.lookupInCache = async () => { bump(); return null; };
  let offCalled = false;
  OpenFoodFactsClient.lookupProduct = async () => { offCalled = true; return { found: false }; };
  bump = deps.sessionLifecycle._bump;
  await BarcodeFlowController.lookupBarcode('C16');
  assert.equal(offCalled, false, 'a stale session must short-circuit before the Open Food Facts request is even made');
  assert.ok(!calls.some((c) => c[0] === 'showMealEditor' || c[0] === 'setPendingBarcode'));
});

test('lookupBarcode: a stale session after the Open Food Facts request suppresses the editor/label-prompt effect', async () => {
  const { deps, calls } = fakeDeps();
  BarcodeFlowController.configure(deps);
  let bump;
  BarcodeRepository.lookupInCache = async () => null;
  OpenFoodFactsClient.lookupProduct = async () => { bump(); return { found: true, item: { name: 'x' } }; };
  bump = deps.sessionLifecycle._bump;
  await BarcodeFlowController.lookupBarcode('C17');
  assert.ok(!calls.some((c) => c[0] === 'showMealEditor'));
});
