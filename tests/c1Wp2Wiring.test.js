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
  assert.equal(versionMatch[1], '2.47.5');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.47.5');
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

test('firebase-config.js routes Google sign-in through AuthAdapter, with no direct popup/redirect platform calls', () => {
  assert.match(firebaseConfigJs, /AuthAdapter\.signInWithGoogle\(\)/);
  assert.equal(firebaseConfigJs.indexOf('signInWithPopup'), -1, 'no direct signInWithPopup call should remain in firebase-config.js');
  assert.equal(firebaseConfigJs.indexOf('signInWithRedirect'), -1, 'no direct signInWithRedirect call should remain in firebase-config.js');
  assert.equal(firebaseConfigJs.indexOf('getRedirectResult'), -1, 'no direct getRedirectResult call should remain in firebase-config.js (moved into AuthAdapter)');
});

// BUGFIX (Friends Alpha Item 1 — Service Worker production defect, docs/governance investigation
// "FITME Friends Alpha Completion Audit" / "Friends Alpha P0/P1 Integration Plan"): previously,
// firebase-config.js called AuthAdapter.handleRedirectResult() at its own top level — but
// firebase-config.js is loaded (index.html) BEFORE js/adapters/authAdapter.js, so AuthAdapter was
// undefined at that point. The resulting uncaught ReferenceError prevented the Service Worker
// registration code immediately below it (same synchronous script block) from ever executing in
// production. Fix: firebase-config.js no longer references AuthAdapter for redirect-result
// handling at all (dependency direction fixed, not hidden); the call moved to js/app.js,
// immediately after AuthAdapter.configure() — the first point at which AuthAdapter is both loaded
// and configured — with byte-identical .catch() behavior. Service Worker registration is also now
// isolated in its own try/catch, independent of anything that precedes it in either file.
test('BUGFIX (SW defect): firebase-config.js no longer depends on AuthAdapter for redirect-result orchestration', () => {
  assert.equal(firebaseConfigJs.indexOf('AuthAdapter.handleRedirectResult'), -1,
    'firebase-config.js must not call AuthAdapter.handleRedirectResult() — see Friends Alpha Item 1 fix');
  assert.equal(firebaseConfigJs.indexOf('getRedirectResult'), -1);
  // signInWithGoogle() is intentionally unchanged and still delegates to AuthAdapter.signInWithGoogle()
  // (asserted separately above) — that call site is inside a function body, only ever invoked by a
  // user click after the whole page has loaded, so it carries none of the top-level load-order risk
  // handleRedirectResult() did. This is not a residual dependency this fix needs to remove.
  assert.match(firebaseConfigJs, /AuthAdapter\.signInWithGoogle\(\)/);
});

test('BUGFIX (SW defect): Service Worker registration in firebase-config.js is isolated in its own try/catch, and no AuthAdapter call precedes it at top level', () => {
  const registerIdx = firebaseConfigJs.indexOf("navigator.serviceWorker.register('/fitme/sw.js')");
  assert.notEqual(registerIdx, -1, 'sw.js registration call must still exist');
  const beforeRegister = firebaseConfigJs.slice(0, registerIdx);
  const tryIdx = beforeRegister.lastIndexOf('try {');
  assert.notEqual(tryIdx, -1, 'the registration call must be inside a try block');
  // The only AuthAdapter reference left in the file (signInWithGoogle(), asserted above) lives
  // inside a function DECLARATION, never executed at top-level script-load time — so, unlike
  // before this fix, nothing that can actually throw during the synchronous top-level execution of
  // this file precedes the Service Worker registration block.
  assert.equal(beforeRegister.indexOf('AuthAdapter.handleRedirectResult'), -1);
  // This test additionally confirms the register() call's own promise rejection is still handled
  // (never left to become an unhandled rejection), preserving pre-existing behavior.
  const afterRegister = firebaseConfigJs.slice(registerIdx);
  assert.match(afterRegister, /\.catch\(e => console\.log\('SW:', e\)\)/);
});

test('BUGFIX (SW defect): redirect-result handling moved to app.js, positioned after AuthAdapter.configure() — never before', () => {
  const configureIdx = appJs.indexOf('AuthAdapter.configure(');
  const handleRedirectIdx = appJs.indexOf('AuthAdapter.handleRedirectResult()');
  assert.notEqual(configureIdx, -1, 'AuthAdapter.configure( must exist in app.js');
  assert.notEqual(handleRedirectIdx, -1, 'AuthAdapter.handleRedirectResult() must now exist in app.js');
  assert.ok(handleRedirectIdx > configureIdx,
    'AuthAdapter.handleRedirectResult() must be invoked strictly after AuthAdapter.configure(), never before it');
});

test('BUGFIX (SW defect): redirect-result handling body (error-code filtering) is preserved unchanged, and occurs exactly once repository-wide', () => {
  assert.match(appJs, /AuthAdapter\.handleRedirectResult\(\)\.catch\(err => \{\s*const code = err && err\.code;\s*if \(code && code !== 'auth\/no-auth-event'\) \{\s*console\.error\('Redirect error:', code, err\.message\);\s*\}\s*\}\);/);
  const occurrencesInAppJs = (appJs.match(/AuthAdapter\.handleRedirectResult\(/g) || []).length;
  const occurrencesInFirebaseConfig = (firebaseConfigJs.match(/AuthAdapter\.handleRedirectResult\(/g) || []).length;
  assert.equal(occurrencesInAppJs, 1, 'exactly one call site in app.js — no duplicate redirect-result handling');
  assert.equal(occurrencesInFirebaseConfig, 0, 'no call site remains in firebase-config.js');
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
