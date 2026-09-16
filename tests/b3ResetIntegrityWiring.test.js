// Friends Alpha Blocker B3 (Reset Integrity) — static source/wiring checks, same
// dependency-free "read the actual repository files as text and assert structural facts"
// convention as tests/c1Wp4Wiring.test.js / tests/ccc001Wiring.test.js / tests/errorTelemetry.test.js.
// js/app.js's resetApp() cannot be executed here (no DOM/Firebase/confirm()/alert() harness —
// the same intentional scope limit those files already document); js/memory.js's Firestore-
// touching functions are likewise "tightly coupled to browser globals (document, window, db,
// currentUser)" per that file's own tests/memory.test.js header — so both are verified
// structurally here. The four repository-level primitives (DayRepository/FavoritesRepository/
// GroupRepository.deleteAllForUser/deleteForUser/removeMember) already have real dynamic tests
// in their own test files (tests/dayRepository.test.js etc.) — not duplicated here.
// Run with: node --test tests/b3ResetIntegrityWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const memoryJs = fs.readFileSync(path.join(__dirname, '../js/memory.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function resetAppBody() {
  const idx = appJs.indexOf('async function resetApp()');
  assert.notEqual(idx, -1, 'resetApp() must exist');
  return appJs.slice(idx, appJs.indexOf('\n}', idx));
}

// ── Typed Memory bulk deletion (js/memory.js) ──────────────────────────────────────────────

test('js/memory.js exposes deleteAllMemories(), batches deletes, and filters to CLIENT_WRITABLE_SOURCES (respecting firestore.rules — server-sourced records are never targeted)', () => {
  const idx = memoryJs.indexOf('async function deleteAllMemories()');
  assert.notEqual(idx, -1, 'deleteAllMemories() must exist');
  const body = memoryJs.slice(idx, memoryJs.indexOf('\n  }', idx));
  assert.match(body, /await memCol\(\)\.get\(\)/);
  assert.match(body, /CLIENT_WRITABLE_SOURCES\.indexOf\(v\.source\) >= 0/, 'must filter by the same client-writable-source vocabulary the Firestore delete rule enforces');
  assert.match(body, /var BATCH_SIZE = 400;/);
  assert.match(body, /db\.batch\(\)/);
  assert.match(body, /batch\.delete\(ref\)/);
  assert.match(body, /await batch\.commit\(\)/);
});

test('deleteAllMemories is exported on the FitMe Memory API surface', () => {
  const apiIdx = memoryJs.indexOf('var API = {');
  const apiBody = memoryJs.slice(apiIdx, memoryJs.indexOf('};', apiIdx));
  assert.match(apiBody, /deleteAllMemories: deleteAllMemories/);
});

test('deleteAllMemories is never called from createMemory()/updateMemory()/deleteMemory() themselves — reset-only', () => {
  ['function createMemory', 'function updateMemory', 'async function deleteMemory'].forEach((sig) => {
    const idx = memoryJs.indexOf(sig);
    assert.notEqual(idx, -1);
    const body = memoryJs.slice(idx, memoryJs.indexOf('\n  }', idx));
    assert.equal(body.indexOf('deleteAllMemories'), -1, sig + ' must never call deleteAllMemories()');
  });
});

// ── resetApp() composition and ordering ────────────────────────────────────────────────────

test('resetApp() attempts every required deletion: errorLog, coachConversation, days, memories, favorites, and (conditionally) group membership', () => {
  const body = resetAppBody();
  [
    'ErrorLogRepository.deleteAllForUser(currentUser.uid)',
    'ConversationRepository.deleteAllForUser(currentUser.uid)',
    'DayRepository.deleteAllForUser(currentUser.uid)',
    'FitMeMemory.deleteAllMemories()',
    'FavoritesRepository.deleteForUser(currentUser.uid)',
    'GroupRepository.removeMember(groupIdAtReset, currentUser.uid)',
    "db.collection('users').doc(currentUser.uid).delete()"
  ].forEach((snippet) => assert.notEqual(body.indexOf(snippet), -1, 'missing required deletion: ' + snippet));
});

test('group-membership removal is conditional on groupIdAtReset, captured before any deletion or local-state reset', () => {
  const body = resetAppBody();
  const captureIdx = body.indexOf('var groupIdAtReset = userProfile && userProfile.groupId;');
  const guardIdx = body.indexOf('if (groupIdAtReset) {');
  const removeIdx = body.indexOf('GroupRepository.removeMember(groupIdAtReset, currentUser.uid)');
  const firstDeleteIdx = body.indexOf('ErrorLogRepository.deleteAllForUser');
  assert.notEqual(captureIdx, -1);
  assert.notEqual(guardIdx, -1);
  assert.ok(captureIdx < firstDeleteIdx, 'groupIdAtReset must be captured before any deletion is attempted');
  assert.ok(guardIdx < removeIdx, 'the removeMember call must be inside the groupIdAtReset guard');
  // no unconditional (unguarded) second call to removeMember exists
  assert.equal(body.indexOf('GroupRepository.removeMember', removeIdx + 1), -1);
});

test('the profile document is deleted last, after every subcollection/reference delete', () => {
  const body = resetAppBody();
  const subcollectionSnippets = [
    'ErrorLogRepository.deleteAllForUser(currentUser.uid)',
    'ConversationRepository.deleteAllForUser(currentUser.uid)',
    'DayRepository.deleteAllForUser(currentUser.uid)',
    'FitMeMemory.deleteAllMemories()',
    'FavoritesRepository.deleteForUser(currentUser.uid)',
    'GroupRepository.removeMember(groupIdAtReset, currentUser.uid)'
  ];
  const profileDeleteIdx = body.indexOf("db.collection('users').doc(currentUser.uid).delete()");
  assert.notEqual(profileDeleteIdx, -1);
  subcollectionSnippets.forEach((snippet) => {
    const idx = body.indexOf(snippet);
    assert.notEqual(idx, -1);
    assert.ok(idx < profileDeleteIdx, snippet + ' must be deleted before the profile document');
  });
});

test('every deletion is attempted through the shared idempotent attempt() helper, so an earlier failure never prevents a later delete from being tried', () => {
  const body = resetAppBody();
  assert.match(body, /async function attempt\(fn\) \{ try \{ await fn\(\); \} catch \(e\) \{ allOk = false; \} \}/);
  [
    'ErrorLogRepository.deleteAllForUser(currentUser.uid)',
    'ConversationRepository.deleteAllForUser(currentUser.uid)',
    'DayRepository.deleteAllForUser(currentUser.uid)',
    'FitMeMemory.deleteAllMemories()',
    'FavoritesRepository.deleteForUser(currentUser.uid)',
    'GroupRepository.removeMember(groupIdAtReset, currentUser.uid)',
    "db.collection('users').doc(currentUser.uid).delete()"
  ].forEach((snippet) => {
    const wrapped = 'await attempt(function () { return ' + snippet + '; });';
    assert.notEqual(body.indexOf(wrapped), -1, 'not routed through attempt(): ' + snippet);
  });
});

// ── Success / failure branching ────────────────────────────────────────────────────────────

test('a FAILED reset (allOk === false) never reaches SessionLifecycle.reset or showOnboarding — an early return follows the failure branch', () => {
  const body = resetAppBody();
  const failureIdx = body.indexOf('if (!allOk) {');
  const returnIdx = body.indexOf('return;', failureIdx);
  const sessionResetIdx = body.indexOf("SessionLifecycle.reset('data-reset')");
  const onboardingIdx = body.indexOf('showOnboarding();');
  assert.notEqual(failureIdx, -1);
  assert.notEqual(returnIdx, -1);
  assert.notEqual(sessionResetIdx, -1);
  assert.notEqual(onboardingIdx, -1);
  assert.ok(failureIdx < returnIdx && returnIdx < sessionResetIdx, 'the failure branch must return before SessionLifecycle.reset is ever reached');
  assert.ok(returnIdx < onboardingIdx, 'the failure branch\'s return must precede showOnboarding()');
});

test('full success calls SessionLifecycle.reset(\'data-reset\') before showOnboarding(), and restores currentUser afterward so the same account can re-onboard without signing in again', () => {
  const body = resetAppBody();
  const sessionResetIdx = body.indexOf("SessionLifecycle.reset('data-reset')");
  const restoreIdx = body.indexOf('currentUser = userAtReset;');
  const onboardingIdx = body.indexOf('showOnboarding();');
  assert.notEqual(sessionResetIdx, -1);
  assert.notEqual(restoreIdx, -1);
  assert.notEqual(onboardingIdx, -1);
  assert.ok(sessionResetIdx < restoreIdx, 'SessionLifecycle.reset() must run before currentUser is restored');
  assert.ok(restoreIdx < onboardingIdx, 'currentUser must be restored before showOnboarding()');
});

test('userAtReset is captured before any deletion is attempted (so a mid-reset currentUser mutation cannot be lost)', () => {
  const body = resetAppBody();
  const captureIdx = body.indexOf('var userAtReset = currentUser;');
  const firstDeleteIdx = body.indexOf('ErrorLogRepository.deleteAllForUser');
  assert.notEqual(captureIdx, -1);
  assert.ok(captureIdx < firstDeleteIdx);
});

test('resetApp() does not hand-maintain a second local-state cleanup list on success — no direct userProfile/todayData/waterCount reset exists there; SessionLifecycle.reset() is the only cleanup mechanism used', () => {
  const body = resetAppBody();
  assert.equal(body.indexOf('userProfile = null;'), -1);
  assert.equal(body.indexOf('todayData = { meals:'), -1);
  assert.equal(body.indexOf('waterCount = 0;'), -1);
});

// ── Failure UX: honest message + retry, no large framework ────────────────────────────────

test('a failure surfaces the exact approved honest message and relabels the reset button to the retry action, without redesigning the confirmation flow', () => {
  const body = resetAppBody();
  assert.match(body, /alert\('לא הצלחנו להשלים את איפוס הנתונים\.\\nחלק מהנתונים שלך עדיין עשויים להישאר\. נסה שוב\.'\);/);
  assert.match(body, /resetBtn\.textContent = 'נסה שוב';/);
  assert.match(body, /_resetFailedPending = true;/);
});

test('retry re-runs the exact same complete deletion sequence (skips only the confirmation dialog when a prior attempt failed) — not a separate/reduced retry path', () => {
  const body = resetAppBody();
  assert.match(body, /if \(!_resetFailedPending && !confirm\('לאפס את נתוני FitMe שלך\?'\)\) return;/);
  // exactly one confirm() call in the whole function — retry does not show a second dialog
  const confirmMatches = body.match(/confirm\(/g) || [];
  assert.equal(confirmMatches.length, 1);
  // the confirmation gate is the FIRST statement — every delete attempt below is unconditionally
  // reached afterward regardless of _resetFailedPending, proving retry re-attempts everything.
  const gateIdx = body.indexOf("if (!_resetFailedPending && !confirm(");
  const firstDeleteIdx = body.indexOf('ErrorLogRepository.deleteAllForUser');
  assert.ok(gateIdx !== -1 && gateIdx < firstDeleteIdx);
});

test('_resetAppCoreState() reverts _resetFailedPending and the reset button label back to default — a fresh sign-in or a successful reset never starts in "retry" mode', () => {
  const idx = appJs.indexOf('function _resetAppCoreState()');
  const body = appJs.slice(idx, appJs.indexOf('\nSessionLifecycle.registerCleanup', idx));
  assert.match(body, /_resetFailedPending = false;/);
  assert.match(body, /resetBtn\.textContent = 'איפוס נתונים';/);
});

// ── Confirmation copy: truthful, scoped to personal FITME data ─────────────────────────────

test('the confirmation dialog refers to the user\'s personal FitMe data, not a broad/ambiguous "all your data" claim', () => {
  assert.equal(appJs.indexOf('למחוק את כל הנתונים שלך?'), -1, 'the old, broader wording must be fully replaced');
  assert.match(appJs, /confirm\('לאפס את נתוני FitMe שלך\?'\)/);
});

test('index.html: the reset button has a stable id so its label can be toggled between the default and retry states', () => {
  assert.match(indexHtml, /<button id="reset-data-btn" class="btn-danger" onclick="resetApp\(\)"/);
});

// ── Explicitly out-of-scope targets are never touched by resetApp() ───────────────────────

test('resetApp() never attempts to delete the shared group document, another member, groupBarcodes, usage/{uid}, or the Firebase Auth account', () => {
  const body = resetAppBody();
  assert.equal(body.indexOf("collection('groups').doc(groupIdAtReset).delete"), -1, 'must never delete the shared group document itself');
  assert.equal(body.indexOf('groupBarcodes'), -1);
  assert.equal(body.indexOf("collection('usage')"), -1);
  assert.equal(body.indexOf('signOut'), -1);
  assert.equal(body.indexOf('AuthAdapter'), -1, 'resetApp() must not touch the Firebase Auth account');
});
