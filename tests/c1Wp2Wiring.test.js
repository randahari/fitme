// C1-WP2 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP2).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as
// tests/b2Wiring.test.js / tests/b5Wiring.test.js / tests/c1Wp0Characterization.test.js /
// tests/c1Wp1Wiring.test.js).
// Run with: node --test tests/c1Wp2Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const firebaseConfigJs = fs.readFileSync(path.join(__dirname, '../js/firebase-config.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

const ADAPTER_FILES = [
  'js/adapters/authAdapter.js', 'js/adapters/notificationAdapter.js', 'js/adapters/imageAdapter.js',
  'js/adapters/barcodeScannerAdapter.js', 'js/adapters/openFoodFactsClient.js', 'js/adapters/claudeProxyClient.js'
];

test('all six WP2 adapter modules are registered in index.html, loaded before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  ADAPTER_FILES.forEach((f) => {
    const idx = indexHtml.indexOf(f);
    assert.notEqual(idx, -1, f + ' script tag must exist');
    assert.ok(idx < appIdx, f + ' must load before app.js');
  });
});

test('all six WP2 adapter modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  ADAPTER_FILES.forEach((f) => assert.notEqual(swJs.indexOf('/fitme/' + f), -1, f + ' must be in the SHELL cache list'));
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.34.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.34.0');
});

test('all six adapters are configured in app.js before first use', () => {
  ['AuthAdapter.configure(', 'NotificationAdapter.configure(', 'ImageAdapter.configure(',
    'BarcodeScannerAdapter.configure(', 'OpenFoodFactsClient.configure(', 'ClaudeProxyClient.configure('
  ].forEach((call) => assert.notEqual(appJs.indexOf(call), -1, call + ' must appear in app.js'));
});

test('callClaude is a facade delegating to ClaudeProxyClient.send, and CLAUDE_PROXY_URL no longer lives in app.js', () => {
  assert.match(appJs, /async function callClaude\(body\) \{ return ClaudeProxyClient\.send\(body, currentUser\); \}/);
  assert.equal(appJs.indexOf('CLAUDE_PROXY_URL'), -1);
});

// C1-WP4 relocated the subscription itself out of app.js into
// js/app/authSessionController.js (AuthSessionController.start(), which calls
// deps.authAdapter.onAuthStateChanged) — intentional, per docs/specs/C1_SPEC_v1.0.md
// §C1-WP4. This test now asserts app.js wires AuthAdapter into that controller instead
// of subscribing directly, while still confirming no bare `auth.onAuthStateChanged(`
// call exists anywhere.
test('the Firebase auth state subscription is registered through AuthAdapter via AuthSessionController, not auth directly', () => {
  assert.match(appJs, /AuthSessionController\.configure\(\{[\s\S]*?authAdapter: AuthAdapter,/);
  assert.match(appJs, /AuthSessionController\.start\(\);/);
  assert.equal(appJs.indexOf('AuthAdapter.onAuthStateChanged('), -1, 'the subscription call itself must live in authSessionController.js, not app.js');
  assert.equal(appJs.indexOf('auth.onAuthStateChanged('), -1, 'no direct auth.onAuthStateChanged call should remain in app.js');
});

test('signOut keeps its confirm() UI decision and delegates the platform call to AuthAdapter', () => {
  const idx = appJs.indexOf('async function signOut()');
  assert.notEqual(idx, -1);
  const body = appJs.slice(idx, idx + 150);
  assert.match(body, /confirm\('להתנתק\?'\)/);
  assert.match(body, /AuthAdapter\.signOut\(\)/);
  assert.equal(appJs.indexOf('auth.signOut()'), -1, 'no direct auth.signOut() call should remain in app.js');
});

test('firebase-config.js routes Google sign-in and redirect-result handling through AuthAdapter', () => {
  assert.match(firebaseConfigJs, /AuthAdapter\.signInWithGoogle\(\)/);
  assert.match(firebaseConfigJs, /AuthAdapter\.handleRedirectResult\(\)/);
  assert.equal(firebaseConfigJs.indexOf('signInWithPopup'), -1, 'no direct signInWithPopup call should remain in firebase-config.js');
  assert.equal(firebaseConfigJs.indexOf('signInWithRedirect'), -1, 'no direct signInWithRedirect call should remain in firebase-config.js');
  assert.equal(firebaseConfigJs.indexOf('getRedirectResult'), -1, 'no direct getRedirectResult call should remain in firebase-config.js (moved into AuthAdapter)');
});

test('no direct Notification/serviceWorker platform calls remain in app.js outside the single configure() injection', () => {
  const occurrences = (appJs.match(/Notification\.|navigator\.serviceWorker/g) || []).length;
  assert.equal(occurrences, 1, 'the only reference should be the NotificationAdapter.configure(...) injection line');
  assert.match(appJs, /NotificationAdapter\.configure\(\{ notificationApi:/);
});

test('sendLocalNotification and scheduleAt are facades delegating to NotificationAdapter', () => {
  assert.match(appJs, /function sendLocalNotification\(title, body\) \{\s*return NotificationAdapter\.showNotification\(title, body\);\s*\}/);
  assert.match(appJs, /function scheduleAt\(hour, min, callback\) \{ return NotificationAdapter\.scheduleAt\(hour, min, callback\); \}/);
});

test('compressImageForUpload is a facade delegating to ImageAdapter, with no residual FileReader/canvas logic in app.js', () => {
  assert.match(appJs, /function compressImageForUpload\(file, maxDim, quality\) \{ return ImageAdapter\.compressImageForUpload\(file, maxDim, quality\); \}/);
  assert.equal(appJs.indexOf('new FileReader()'), -1);
  assert.equal(appJs.indexOf("createElement('canvas')"), -1);
});

test('startCamera/startLabelCamera keep their photoMode product-state assignment and delegate activation to ImageAdapter', () => {
  assert.match(appJs, /function startCamera\(\) \{ photoMode = 'plate'; ImageAdapter\.triggerFileInput\('camera-input'\); \}/);
  assert.match(appJs, /function startLabelCamera\(\) \{ photoMode = 'label'; ImageAdapter\.triggerFileInput\('camera-input'\); \}/);
});

// C1-WP5F subsequently relocated the scanner start/stop sequence and lookupBarcode()'s body
// into js/nutrition/barcodeFlowController.js (intentional — see tests/c1Wp5fWiring.test.js).
// This test now only confirms app.js itself stays free of direct Html5Qrcode/CDN references
// (still true — app.js only calls the facade, which delegates to the controller, which is the
// only place that calls BarcodeScannerAdapter directly), and that the relocated calls exist in
// their new home.
test('no direct Html5Qrcode/CDN references remain in app.js — scanner lifecycle routes through BarcodeScannerAdapter (now via barcodeFlowController.js)', () => {
  assert.equal(appJs.indexOf('Html5Qrcode'), -1);
  assert.equal(appJs.indexOf('unpkg.com'), -1);
  const controllerJs = fs.readFileSync(path.join(__dirname, '../js/nutrition/barcodeFlowController.js'), 'utf8');
  assert.match(controllerJs, /await BarcodeScannerAdapter\.loadLibrary\(\)/);
  assert.match(controllerJs, /BarcodeScannerAdapter\.createScanner\('barcode-reader'\)/);
  assert.match(controllerJs, /await BarcodeScannerAdapter\.start\(h5qr, function \(decodedText\) \{ onBarcodeDetected\(decodedText, statusEl\); \}\)/);
  assert.match(controllerJs, /BarcodeScannerAdapter\.stop\(r\)/);
});

// C1-WP5F subsequently relocated lookupBarcode()'s full body into barcodeFlowController.js —
// this test now checks the relocated body, not app.js's one-line facade.
test('lookupBarcode routes the Open Food Facts request through OpenFoodFactsClient, with UI branching preserved in barcodeFlowController.js', () => {
  const controllerJs = fs.readFileSync(path.join(__dirname, '../js/nutrition/barcodeFlowController.js'), 'utf8');
  assert.match(controllerJs, /await OpenFoodFactsClient\.lookupProduct\(code\)/);
  assert.equal(controllerJs.indexOf('world.openfoodfacts.org'), -1);
  const idx = controllerJs.indexOf('async function lookupBarcode(code)');
  assert.notEqual(idx, -1);
  const body = controllerJs.slice(idx, controllerJs.indexOf('\n  }', idx));
  assert.match(body, /showLabelPrompt\(code\)/);
  assert.match(body, /deps\.showMealEditor\(/);
  assert.match(body, /deps\.alertFn\('שגיאה בחיפוש המוצר/);
});

test('no adapter file contains DOM/product-decision leakage: no alert()/confirm() calls', () => {
  const jsDir = path.join(__dirname, '../js/adapters');
  ADAPTER_FILES.forEach((f) => {
    const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.doesNotMatch(content, /\balert\(/, f + ' must not call alert() (UI decision belongs to the caller)');
    assert.doesNotMatch(content, /\bconfirm\(/, f + ' must not call confirm() (UI decision belongs to the caller)');
  });
});
