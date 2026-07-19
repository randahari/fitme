// C1-WP2 — js/adapters/barcodeScannerAdapter.js unit tests.
// document/window are injected via configure() so library loading, scanner creation,
// and start/stop lifecycle are testable without a real DOM or the real html5-qrcode SDK.
// Run with: node --test tests/barcodeScannerAdapter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const BarcodeScannerAdapter = require('../js/adapters/barcodeScannerAdapter.js');

function fakeFormats() { return { EAN_13: 'EAN_13', EAN_8: 'EAN_8', UPC_A: 'UPC_A', UPC_E: 'UPC_E' }; }

test('loadLibrary resolves immediately without touching the DOM when Html5Qrcode is already defined', async () => {
  let appendCalled = false;
  BarcodeScannerAdapter.configure({
    documentRef: { createElement: () => { throw new Error('should not create a script tag'); }, head: { appendChild: () => { appendCalled = true; } } },
    windowRef: { Html5Qrcode: function () {} }
  });
  await BarcodeScannerAdapter.loadLibrary();
  assert.equal(appendCalled, false);
});

test('loadLibrary appends a script tag with the exact pinned CDN URL and resolves on load', async () => {
  let appendedScript = null;
  const fakeDoc = {
    createElement: () => ({}),
    head: { appendChild: (s) => { appendedScript = s; setImmediate(() => s.onload()); } }
  };
  BarcodeScannerAdapter.configure({ documentRef: fakeDoc, windowRef: {} });
  await BarcodeScannerAdapter.loadLibrary();
  assert.equal(appendedScript.src, 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js');
  assert.equal(BarcodeScannerAdapter.LIBRARY_URL, 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js');
});

test('loadLibrary rejects when the script fails to load', async () => {
  const fakeDoc = { createElement: () => ({}), head: { appendChild: (s) => setImmediate(() => s.onerror(new Error('network'))) } };
  BarcodeScannerAdapter.configure({ documentRef: fakeDoc, windowRef: {} });
  await assert.rejects(() => BarcodeScannerAdapter.loadLibrary());
});

test('createScanner constructs Html5Qrcode with the four supported barcode formats and verbose:false', () => {
  let capturedId = null, capturedOptions = null;
  function FakeHtml5Qrcode(id, options) { capturedId = id; capturedOptions = options; }
  BarcodeScannerAdapter.configure({ windowRef: { Html5Qrcode: FakeHtml5Qrcode, Html5QrcodeSupportedFormats: fakeFormats() } });
  BarcodeScannerAdapter.createScanner('barcode-reader');
  assert.equal(capturedId, 'barcode-reader');
  assert.deepEqual(capturedOptions.formatsToSupport, ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E']);
  assert.equal(capturedOptions.verbose, false);
});

test('start calls scanner.start with facingMode environment, the fixed SCAN_CONFIG, and the detection callback', async () => {
  let captured = null;
  const fakeScanner = { start: async (constraints, config, cb) => { captured = { constraints, config, cb }; } };
  const onDetected = () => {};
  await BarcodeScannerAdapter.start(fakeScanner, onDetected);
  assert.deepEqual(captured.constraints, { facingMode: 'environment' });
  assert.equal(captured.config.fps, 10);
  assert.equal(captured.config, BarcodeScannerAdapter.SCAN_CONFIG);
  assert.equal(captured.cb, onDetected);
});

test('SCAN_CONFIG.qrbox computes a bounded box from the viewport width, matching the original formula', () => {
  const box = BarcodeScannerAdapter.SCAN_CONFIG.qrbox(400);
  assert.deepEqual(box, { width: 300, height: Math.round(300 * 0.55) });
  const smallBox = BarcodeScannerAdapter.SCAN_CONFIG.qrbox(200);
  assert.deepEqual(smallBox, { width: Math.round(200 * 0.85), height: Math.round(Math.round(200 * 0.85) * 0.55) });
});

test('stop() calls scanner.stop() then clear(), and swallows a clear() failure', async () => {
  let stopCalled = false, clearCalled = false;
  const fakeScanner = { stop: async () => { stopCalled = true; }, clear: () => { clearCalled = true; throw new Error('clear failed'); } };
  await BarcodeScannerAdapter.stop(fakeScanner);
  assert.equal(stopCalled, true);
  assert.equal(clearCalled, true);
});

test('stop() still calls clear() when stop() itself rejects', async () => {
  let clearCalled = false;
  const fakeScanner = { stop: async () => { throw new Error('stop failed'); }, clear: () => { clearCalled = true; } };
  await BarcodeScannerAdapter.stop(fakeScanner);
  assert.equal(clearCalled, true);
});

test('stop() does nothing when no scanner is given', () => {
  assert.doesNotThrow(() => BarcodeScannerAdapter.stop(null));
});

test('stop() falls back to clear() when scanner.stop() throws synchronously (not just rejects)', async () => {
  let clearCalled = false;
  const fakeScanner = { stop: () => { throw new Error('sync failure'); }, clear: () => { clearCalled = true; } };
  await BarcodeScannerAdapter.stop(fakeScanner);
  assert.equal(clearCalled, true);
});
