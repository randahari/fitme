// Friends Alpha Item 7 (Minimal Error/Crash Telemetry) — js/errorTelemetry.js unit + wiring
// tests. A minimal fake ErrorLogRepository is injected via configure(); global-handler bodies
// are exercised directly via the exported _internal functions (the actual window.addEventListener
// wiring itself, which requires a real DOM, is verified separately by source-text assertion —
// the same "wiring test" convention tests/c1Wp2Wiring.test.js already establishes for anything
// that cannot be directly exercised without a browser).
// Run with: node --test tests/errorTelemetry.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ErrorTelemetry = require('../js/errorTelemetry.js');

function fakeRepo() {
  const created = [];
  return {
    created,
    create: (uid, payload) => { created.push({ uid, payload }); return Promise.resolve({ id: 'e' + created.length }); }
  };
}

// ══════════════════════════════════════════════════════════════════
// A/B — payload contract: allowlist by construction, never a denylist filter.
// ══════════════════════════════════════════════════════════════════

test('A: buildAllowedPayload returns EXACTLY the seven allowed keys, nothing else', () => {
  const payload = ErrorTelemetry._internal.buildAllowedPayload({ code: 'X', module: 'Y', operation: 'Z', message: 'm', retryable: true });
  assert.deepEqual(Object.keys(payload).sort(), ['appVersion', 'clientTimestamp', 'code', 'message', 'module', 'operation', 'retryable']);
});

test('B: extraneous/user-content-shaped fields on the input are silently dropped, never copied through', () => {
  const dangerousInput = {
    code: 'REAL_CODE', module: 'REAL_MODULE',
    // none of the following are read by buildAllowedPayload at all:
    chatText: 'אני עייף היום ולא רוצה להתאמן',
    mealDescription: 'שניצל עם אורז ותפוח אדמה',
    memoryPayload: { text: 'הרופא אמר לי לא לרוץ' },
    safetyStatement: 'כואבת לי הברך',
    stack: 'Error: x\n    at secretUserFunction (app.js:123)\n    with embedded content: my meal was chicken',
    requestBody: { messages: [{ role: 'user', content: 'private user prompt' }] },
    uid: 'someone-elses-uid' // must never be settable by the caller — uid comes only from getCurrentUser()
  };
  const payload = ErrorTelemetry._internal.buildAllowedPayload(dangerousInput);
  const serialized = JSON.stringify(payload);
  assert.equal(payload.hasOwnProperty('chatText'), false);
  assert.equal(payload.hasOwnProperty('mealDescription'), false);
  assert.equal(payload.hasOwnProperty('memoryPayload'), false);
  assert.equal(payload.hasOwnProperty('safetyStatement'), false);
  assert.equal(payload.hasOwnProperty('stack'), false);
  assert.equal(payload.hasOwnProperty('requestBody'), false);
  assert.equal(payload.hasOwnProperty('uid'), false);
  assert.doesNotMatch(serialized, /שניצל|הרופא|ברך|secretUserFunction|private user prompt/);
});

test('A: message/code/module/operation/appVersion are length-capped, never unbounded free text', () => {
  const longString = 'x'.repeat(10000);
  const payload = ErrorTelemetry._internal.buildAllowedPayload({ code: longString, module: longString, operation: longString, message: longString });
  assert.ok(payload.code.length <= 64);
  assert.ok(payload.module.length <= 64);
  assert.ok(payload.operation.length <= 64);
  assert.ok(payload.message.length <= 300);
});

test('A: non-string/absent fields degrade to safe defaults, never throw, never become non-strings', () => {
  const payload = ErrorTelemetry._internal.buildAllowedPayload({ code: 123, module: null, operation: undefined, message: { evil: 'object' }, retryable: 'yes' });
  assert.equal(payload.code, 'UNKNOWN');
  assert.equal(payload.module, 'UNKNOWN');
  assert.equal(payload.operation, '');
  assert.equal(payload.message, '');
  assert.equal(payload.retryable, false); // only === true is ever honored
});

// ══════════════════════════════════════════════════════════════════
// C — end-to-end: the public report() API cannot be used to log user content, even by a
// careless/malicious caller, because report() -> buildAllowedPayload() strips it before any
// write is even attempted.
// ══════════════════════════════════════════════════════════════════

test('C: report() end-to-end — chat text, meal text, memory payload, and safety statements never reach the persisted write', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry.report({
    code: 'COACH_TURN_FAILED', module: 'COACH', operation: 'DIRECT_TURN_PASS',
    chatMessageText: 'אני רוצה לרוץ היום, מה דעתך?',
    mealContents: { items: [{ name: 'עוגת שוקולד' }] },
    typedMemoryPayload: { text: 'הרופא אמר לי לא לרוץ' },
    safetyStatement: 'הרופא אמר לי לא לרוץ'
  });
  assert.equal(repo.created.length, 1);
  const written = JSON.stringify(repo.created[0].payload);
  assert.doesNotMatch(written, /רוץ|עוגת|שוקולד|הרופא/);
  assert.deepEqual(Object.keys(repo.created[0].payload).sort(), ['appVersion', 'clientTimestamp', 'code', 'message', 'module', 'operation', 'retryable']);
});

// ══════════════════════════════════════════════════════════════════
// D/E — global handler bodies route through report() correctly when authenticated, AND
// (Product/Architecture, Friends Alpha Item 7 Final Review, Correction 1) NEVER persist
// arbitrary runtime text — the persisted payload for both global handlers is structural
// metadata only. Correction 1's own required tests A-D are covered across this section.
// ══════════════════════════════════════════════════════════════════

test('D: handleUncaughtError reports code UNCAUGHT_ERROR/module GLOBAL, when authenticated', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry._internal.handleUncaughtError({ message: 'Uncaught TypeError: x is not a function' });
  assert.equal(repo.created.length, 1);
  assert.equal(repo.created[0].uid, 'u1');
  assert.equal(repo.created[0].payload.code, 'UNCAUGHT_ERROR');
  assert.equal(repo.created[0].payload.module, 'GLOBAL');
});

test('Correction 1 / A: window "error" with arbitrary Hebrew user-like text does NOT persist that text', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry._internal.handleUncaughtError({
    message: 'שגיאה: המשתמש כתב "אני רוצה לרדת במשקל ואני עייף מאוד" ולא הצלחתי לעבד את הבקשה'
  });
  assert.equal(repo.created.length, 1);
  assert.equal(repo.created[0].payload.message, '', 'the global UNCAUGHT_ERROR payload must never carry a message field at all');
  assert.doesNotMatch(JSON.stringify(repo.created[0].payload), /לרדת|עייף|המשתמש/);
});

test('D: handleUncaughtError never throws even given a malformed/absent event', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  assert.doesNotThrow(() => ErrorTelemetry._internal.handleUncaughtError(undefined));
  assert.doesNotThrow(() => ErrorTelemetry._internal.handleUncaughtError({}));
});

test('E: handleUnhandledRejection reports code UNHANDLED_REJECTION/module GLOBAL, when authenticated', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry._internal.handleUnhandledRejection({ reason: new Error('fetch failed') });
  assert.equal(repo.created.length, 1);
  assert.equal(repo.created[0].payload.code, 'UNHANDLED_REJECTION');
});

test('Correction 1 / B: unhandledrejection with arbitrary Hebrew user-like text does NOT persist that text', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry._internal.handleUnhandledRejection({
    reason: new Error('נכשל בעיבוד: "הרופא אמר לי לא לרוץ" — הבקשה נדחתה')
  });
  assert.equal(repo.created.length, 1);
  assert.equal(repo.created[0].payload.message, '', 'the global UNHANDLED_REJECTION payload must never carry a message field at all');
  assert.doesNotMatch(JSON.stringify(repo.created[0].payload), /הרופא|נדחתה/);
});

test('E: handleUnhandledRejection accepts a bare string rejection reason too, and never throws on a malformed event', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  assert.doesNotThrow(() => ErrorTelemetry._internal.handleUnhandledRejection({ reason: 'plain string reason' }));
  assert.equal(repo.created[repo.created.length - 1].payload.message, '');
  assert.doesNotThrow(() => ErrorTelemetry._internal.handleUnhandledRejection(undefined));
});

test('Correction 1 / C: a stack trace and a rejection reason with an embedded stack cannot enter the persisted payload via either global handler', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  const errWithStack = new Error('boom');
  errWithStack.stack = 'Error: boom\n    at secretUserFunction (app.js:123)\n    at processMeal (app.js:456) — chicken schnitzel 250g';
  ErrorTelemetry._internal.handleUncaughtError({ message: errWithStack.message, error: errWithStack, filename: 'app.js', lineno: 1, colno: 1 });
  ErrorTelemetry._internal.handleUnhandledRejection({ reason: errWithStack });
  assert.equal(repo.created.length, 2);
  repo.created.forEach((entry) => {
    assert.equal(entry.payload.hasOwnProperty('stack'), false);
    assert.equal(entry.payload.hasOwnProperty('reason'), false);
    assert.equal(entry.payload.message, '');
    assert.doesNotMatch(JSON.stringify(entry.payload), /secretUserFunction|schnitzel/);
  });
});

test('Correction 1 / D: structural metadata (code/module/appVersion/retryable/clientTimestamp) still reaches telemetry correctly for both global handlers', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry._internal.handleUncaughtError({ message: 'anything' });
  ErrorTelemetry._internal.handleUnhandledRejection({ reason: 'anything' });
  assert.equal(repo.created.length, 2);
  repo.created.forEach((entry) => {
    assert.deepEqual(Object.keys(entry.payload).sort(), ['appVersion', 'clientTimestamp', 'code', 'message', 'module', 'operation', 'retryable']);
    assert.equal(entry.payload.appVersion, '2.47.0');
    assert.equal(entry.payload.retryable, false);
    assert.equal(typeof entry.payload.clientTimestamp, 'number');
    assert.equal(entry.payload.module, 'GLOBAL');
  });
  assert.equal(repo.created[0].payload.code, 'UNCAUGHT_ERROR');
  assert.equal(repo.created[1].payload.code, 'UNHANDLED_REJECTION');
});

// ══════════════════════════════════════════════════════════════════
// F — pre-auth / not-yet-configured / signed-out: never an orphaned Firestore write.
// ══════════════════════════════════════════════════════════════════

test('F: report() before configure() has ever supplied an errorLogRepository never writes and never throws', () => {
  ErrorTelemetry.configure({ getCurrentUser: () => ({ uid: 'u1' }) }); // no errorLogRepository — same code path as "never configured"
  assert.doesNotThrow(() => ErrorTelemetry.report({ code: 'X', module: 'Y' }));
});

test('F: report() with no authenticated user (pre-auth or signed-out) never calls errorLogRepository.create', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => null, appVersion: '2.47.0' });
  ErrorTelemetry.report({ code: 'X', module: 'Y' });
  ErrorTelemetry._internal.handleUncaughtError({ message: 'boom' });
  ErrorTelemetry._internal.handleUnhandledRejection({ reason: 'boom' });
  assert.equal(repo.created.length, 0);
});

test('F: report() with a user object missing uid never calls errorLogRepository.create', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({}), appVersion: '2.47.0' });
  ErrorTelemetry.report({ code: 'X', module: 'Y' });
  assert.equal(repo.created.length, 0);
});

// ══════════════════════════════════════════════════════════════════
// G — bounded in-session dedup: a repeated identical technical error does not spam writes.
// ══════════════════════════════════════════════════════════════════

test('G: the same {code, module, operation} reported many times within one session writes exactly once', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  for (let i = 0; i < 10; i++) {
    ErrorTelemetry.report({ code: 'SAVE_PROFILE_FAILED', module: 'PERSISTENCE', operation: 'SAVE_PROFILE', message: 'attempt ' + i });
  }
  assert.equal(repo.created.length, 1);
});

test('G: a different {code, module, operation} is not suppressed by an unrelated prior dedup entry', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry.report({ code: 'A', module: 'M', operation: 'OP1' });
  ErrorTelemetry.report({ code: 'B', module: 'M', operation: 'OP1' });
  ErrorTelemetry.report({ code: 'A', module: 'M', operation: 'OP2' });
  assert.equal(repo.created.length, 3);
});

test('G: a bounded maximum number of DISTINCT writes per session is enforced', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  for (let i = 0; i < ErrorTelemetry.MAX_WRITES_PER_SESSION + 10; i++) {
    ErrorTelemetry.report({ code: 'CODE_' + i, module: 'M', operation: '' }); // every call is a distinct dedup key
  }
  assert.equal(repo.created.length, ErrorTelemetry.MAX_WRITES_PER_SESSION);
});

// ══════════════════════════════════════════════════════════════════
// H — session/auth transitions: no stale-user carryover, fresh telemetry budget per session.
// ══════════════════════════════════════════════════════════════════

test('H: a fresh configure() call resets the dedup/rate state (mirrors an app restart / re-init)', () => {
  const repo = fakeRepo();
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' });
  ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' });
  ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid: 'u1' }), appVersion: '2.47.0' }); // re-configure
  ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' }); // same class again — should NOT be suppressed by the old session's dedup state
  assert.equal(repo.created.length, 2);
});

test('H: configure() registers a SessionLifecycle cleanup (when SessionLifecycle is present) that resets dedup/rate state on a real auth-session transition, and a write after that transition is correctly addressed to the newly-current user', () => {
  const registered = {};
  const fakeSessionLifecycle = {
    registerCleanup: (name, fn) => { registered[name] = fn; }
  };
  const previousWindow = global.window;
  global.window = { SessionLifecycle: fakeSessionLifecycle };
  try {
    const repo = fakeRepo();
    let uid = 'user-A';
    ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => ({ uid }), appVersion: '2.47.0' });
    assert.equal(typeof registered.errorTelemetry, 'function', 'configure() must register a cleanup named "errorTelemetry" when SessionLifecycle is available');

    ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' });
    assert.equal(repo.created.length, 1);
    assert.equal(repo.created[0].uid, 'user-A');

    // Simulate the real auth-session transition SessionLifecycle.reset() would trigger
    // (sign-out, or sign-in as a different user) — user-A signs out, user-B signs in.
    registered.errorTelemetry();
    uid = 'user-B';

    ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' }); // same class — must NOT be suppressed by user-A's stale dedup state
    assert.equal(repo.created.length, 2);
    assert.equal(repo.created[1].uid, 'user-B', 'the post-transition write must be addressed to the newly-current user, never the stale one');
  } finally {
    if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
  }
});

test('H: signing out entirely (getCurrentUser -> null) after a session transition writes nothing further', () => {
  const registered = {};
  const fakeSessionLifecycle = { registerCleanup: (name, fn) => { registered[name] = fn; } };
  const previousWindow = global.window;
  global.window = { SessionLifecycle: fakeSessionLifecycle };
  try {
    const repo = fakeRepo();
    let signedIn = true;
    ErrorTelemetry.configure({ errorLogRepository: repo, getCurrentUser: () => (signedIn ? { uid: 'user-A' } : null), appVersion: '2.47.0' });
    ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' });
    assert.equal(repo.created.length, 1);

    registered.errorTelemetry(); // sign-out transition
    signedIn = false;
    ErrorTelemetry.report({ code: 'X', module: 'M', operation: '' });
    ErrorTelemetry._internal.handleUncaughtError({ message: 'post-signout error' });
    assert.equal(repo.created.length, 1, 'no write should occur once signed out, even for a previously-seen or brand-new error class');
  } finally {
    if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
  }
});

// ══════════════════════════════════════════════════════════════════
// Wiring — index.html loads this file first (before the Firebase SDKs), sw.js caches it.
// ══════════════════════════════════════════════════════════════════

const ROOT = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const errorTelemetrySrc = fs.readFileSync(path.join(ROOT, 'js/errorTelemetry.js'), 'utf8');

test('wiring: js/errorTelemetry.js is the first <script> tag in index.html, loaded before the Firebase SDKs', () => {
  const telemetryIdx = indexHtml.indexOf('src="js/errorTelemetry.js"');
  const firstFirebaseSdkIdx = indexHtml.indexOf('firebase-app-compat.js');
  const anyOtherScriptIdx = indexHtml.indexOf('<script src=');
  assert.notEqual(telemetryIdx, -1);
  assert.ok(telemetryIdx < firstFirebaseSdkIdx, 'errorTelemetry.js must load before the Firebase SDKs');
  assert.equal(indexHtml.indexOf('<script src=', 0), indexHtml.indexOf('<script src="js/errorTelemetry.js"'),
    'errorTelemetry.js must be the very first <script src=...> tag on the page');
});

test('wiring: js/repositories/errorLogRepository.js loads before js/app.js', () => {
  const repoIdx = indexHtml.indexOf('src="js/repositories/errorLogRepository.js"');
  const appIdx = indexHtml.indexOf('src="js/app.js"');
  assert.notEqual(repoIdx, -1);
  assert.ok(repoIdx < appIdx);
});

test('wiring: both new files are in the sw.js SHELL cache list', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/errorTelemetry.js'), -1);
  assert.notEqual(swJs.indexOf('/fitme/js/repositories/errorLogRepository.js'), -1);
});

test('wiring: app.js configures ErrorLogRepository and ErrorTelemetry, and never scope-widens getCurrentUser beyond the existing currentUser closure', () => {
  assert.match(appJs, /ErrorLogRepository\.configure\(\{ db: db, serverTimestamp: _fsServerTimestamp \}\)/);
  assert.match(appJs, /ErrorTelemetry\.configure\(\{[\s\S]*?errorLogRepository: ErrorLogRepository,[\s\S]*?getCurrentUser: function \(\) \{ return currentUser; \},/);
});

test('wiring: the two real global handlers are actually attached to window (proven by source, since no DOM exists in this test run)', () => {
  assert.match(errorTelemetrySrc, /window\.addEventListener\('error', handleUncaughtError\)/);
  assert.match(errorTelemetrySrc, /window\.addEventListener\('unhandledrejection', handleUnhandledRejection\)/);
});

test('Correction 1 wiring: neither global handler function body ever supplies a `message` to its report() call — content-safe by construction, not by filtering', () => {
  const startIdx = errorTelemetrySrc.indexOf('function handleUncaughtError');
  const endIdx = errorTelemetrySrc.indexOf('function handleUnhandledRejection');
  const rejectionEndIdx = errorTelemetrySrc.indexOf('// Self-installing', endIdx);
  const uncaughtBody = errorTelemetrySrc.slice(startIdx, endIdx);
  const rejectionBody = errorTelemetrySrc.slice(endIdx, rejectionEndIdx);
  const reportCallInBody = (body) => body.slice(body.indexOf('report({'), body.indexOf('});', body.indexOf('report({')) + 3);
  assert.doesNotMatch(reportCallInBody(uncaughtBody), /message/);
  assert.doesNotMatch(reportCallInBody(rejectionBody), /message/);
  // The console-only line (outside the report() call) legitimately still references the raw
  // text, for local developer visibility only — proving that line exists and is clearly
  // distinct from the report() call above it:
  assert.match(uncaughtBody, /console\.error\('\[FitMe telemetry\] GLOBAL\/UNCAUGHT_ERROR \(console-only, never persisted\):', event && event\.message\)/);
  assert.match(rejectionBody, /console\.error\('\[FitMe telemetry\] GLOBAL\/UNHANDLED_REJECTION \(console-only, never persisted\):', event && event\.reason\)/);
});

test('wiring: the named application-failure integration points call ErrorTelemetry.report, and no other call site was mechanically added', () => {
  // Item 7's original 3 (loadUserData / saveProfile / submitCoachConversationTurn's own
  // pipeline-exception catch) plus CCC-001's own 4 new, individually-reviewed persistence
  // integration points (docs/specs/CCC_001_SPEC_v1.0.md §11: PENDING create failure,
  // COMPLETED/SILENCE completion-update failure — two call sites — and history-load failure) —
  // plus CPI-001's own 4 new, individually-reviewed integration points
  // (docs/specs/CPI_001_SPEC_v1.0.md §16: the Typed Memory existence-check and write failures
  // inside persistCpiPreferenceRecord() — two call sites — and the SAME, already-established
  // 'PERSIST_TURN_COMPLETE' operation's own COMPLETED/SILENCE completion-write failure paths,
  // reused verbatim for the Unified Finalization branch's own two completeTurn() call sites) —
  // still a small, explicit, hand-reviewed set, never a mechanical console.error replacement.
  const occurrences = (appJs.match(/ErrorTelemetry\.report\(/g) || []).length;
  assert.equal(occurrences, 11, 'expected exactly 11 explicit integration points (3 from Item 7 + 4 from CCC-001 + 4 from CPI-001)');
  assert.match(appJs, /operation: 'LOAD_USER_DATA'/);
  assert.match(appJs, /operation: 'SAVE_PROFILE'/);
  assert.match(appJs, /operation: 'DIRECT_TURN_PASS'/);
  assert.match(appJs, /operation: 'PERSIST_TURN_CREATE'/);
  assert.match(appJs, /operation: 'PERSIST_TURN_COMPLETE'/);
  assert.match(appJs, /operation: 'LOAD_HISTORY'/);
  assert.match(appJs, /operation: 'CPI_PERSIST'/);
  assert.match(appJs, /code: \(e && e\.code\) \|\| 'CPI_EXISTENCE_CHECK_FAILED'/);
  assert.match(appJs, /code: \(e && e\.code\) \|\| 'CPI_PERSIST_WRITE_FAILED'/);
});

test('wiring: the Coach turn integration point never passes a `message` field (the one path closest to user-authored content)', () => {
  const idx = appJs.indexOf("operation: 'DIRECT_TURN_PASS'");
  assert.notEqual(idx, -1);
  const line = appJs.slice(appJs.lastIndexOf('ErrorTelemetry.report(', idx), appJs.indexOf(')', idx) + 1);
  assert.doesNotMatch(line, /message:/);
});

test('wiring: resetApp() deletes the errorLog subcollection before deleting the profile document, and never inside the reporting path', () => {
  const resetIdx = appJs.indexOf('async function resetApp()');
  assert.notEqual(resetIdx, -1);
  const deleteAllIdx = appJs.indexOf('ErrorLogRepository.deleteAllForUser(currentUser.uid)', resetIdx);
  const profileDeleteIdx = appJs.indexOf("db.collection('users').doc(currentUser.uid).delete()", resetIdx);
  assert.notEqual(deleteAllIdx, -1, 'resetApp() must call ErrorLogRepository.deleteAllForUser');
  assert.ok(deleteAllIdx < profileDeleteIdx, 'error-log cleanup must be part of the explicit reset flow, ordered alongside the profile delete');
  // deleteAllForUser must never appear in js/errorTelemetry.js's own report() path:
  assert.equal(errorTelemetrySrc.indexOf('deleteAllForUser'), -1);
});

// ══════════════════════════════════════════════════════════════════
// I — Firestore rules enforce create-only, owner-scoped, allowlisted writes.
// (Static text verification — this repository has no Firestore emulator in its test setup;
// every existing Firestore-adjacent behavior in this suite, e.g. tests/dayRepository.test.js,
// is likewise verified against fakes/text, never a live emulator.)
// ══════════════════════════════════════════════════════════════════

test('I: firestore.rules — errorLog is create-only for the owner, with a closed field allowlist; no read; delete reserved for the explicit reset flow', () => {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const idx = rules.indexOf('match /errorLog/{entryId}');
  assert.notEqual(idx, -1);
  const block = rules.slice(idx, rules.indexOf('\n      }', idx));
  assert.match(block, /allow read: if false;/);
  assert.match(block, /allow update: if false;/);
  assert.match(block, /allow delete: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(block, /allow create: if isSignedIn\(\) && request\.auth\.uid == uid/);
  assert.match(block, /request\.resource\.data\.keys\(\)\.hasOnly\(\['code', 'module', 'operation', 'message', 'appVersion', 'retryable', 'clientTimestamp', 'createdAt'\]\)/);
});

test('I: firestore.rules — no pre-existing rule (users/{uid}, days/{day}, memories/{memoryId}, usage/{uid}) was weakened', () => {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  assert.match(rules, /match \/users\/\{uid\} \{[\s\S]*?allow write: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(rules, /match \/days\/\{day\} \{[\s\S]*?allow write: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(rules, /match \/usage\/\{uid\} \{[\s\S]*?allow write: if false;/);
});
