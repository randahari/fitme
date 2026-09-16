// CCC-001 (docs/specs/CCC_001_SPEC_v1.0.md) — static source/wiring checks, mirroring
// tests/c1Wp2Wiring.test.js's own established "read the actual repository files as text and
// assert structural facts" convention for anything not independently unit-testable without a
// DOM/live-Firebase harness (js/app.js's submitCoachConversationTurn()/resetApp()/showApp(),
// exactly like every prior *Wiring.test.js in this repository).
// Run with: node --test tests/ccc001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const conversationRepoSrc = fs.readFileSync(path.join(ROOT, 'js/repositories/conversationRepository.js'), 'utf8');
const memorySrc = fs.readFileSync(path.join(ROOT, 'js/memory.js'), 'utf8');
const orchestratorSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
const presenterSrc = fs.readFileSync(path.join(ROOT, 'js/ui/coachConversationPresenter.js'), 'utf8');

// ── Load order / script registration ──────────────────────────────────────

test('wiring: js/repositories/conversationRepository.js loads before js/app.js', () => {
  const repoIdx = indexHtml.indexOf('src="js/repositories/conversationRepository.js"');
  const appIdx = indexHtml.indexOf('src="js/app.js"');
  assert.notEqual(repoIdx, -1);
  assert.ok(repoIdx < appIdx);
});

test('wiring: conversationRepository.js is in the sw.js SHELL cache list, and VERSION was bumped to 2.47.3', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/repositories/conversationRepository.js'), -1);
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.47.3');
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.47.3');
});

test('wiring: app.js configures ConversationRepository (including the cursor-stability documentIdField injection) and injects fetchRecentConversation into StateAccess.configure', () => {
  // Cursor stability correction: ConversationRepository.configure() now also receives
  // documentIdField (a live-SDK FieldPath.documentId() factory, injected exactly like
  // serverTimestamp, never referenced directly inside the repository module) — required so
  // fetchRecent()'s query can use a documentId() tie-breaker alongside orderBy('createdAt').
  assert.match(appJs, /ConversationRepository\.configure\(\{ db: db, serverTimestamp: _fsServerTimestamp, documentIdField: _fsDocumentIdField \}\)/);
  assert.match(appJs, /function _fsDocumentIdField\(\) \{ return firebase\.firestore\.FieldPath\.documentId\(\); \}/);
  // Pagination correction: fetchRecentConversation forwards an optional afterCreatedAt cursor to
  // ConversationRepository.fetchRecent(), so Memory Layer can paginate deterministically for the
  // "latest 6 COMPLETED turns" bound. Cursor stability correction: a second cursor part,
  // afterTurnId, is forwarded alongside it (createdAt alone is not guaranteed unique across
  // documents). The display path (2-arg call, no cursor at all) is unaffected either way.
  assert.match(appJs, /fetchRecentConversation: function \(limitCount, afterCreatedAt, afterTurnId\) \{ return ConversationRepository\.fetchRecent\(currentUser\.uid, limitCount, afterCreatedAt, afterTurnId\); \}/);
});

// ── R: internalPipelineOrchestrator threads recentConversationContext into classify() ──────

test('R/wiring: runDirectTurnPass() passes pipelineContext.recentConversationContext as classify()\'s second argument', () => {
  assert.match(orchestratorSrc, /TurnUnderstandingInterpreter\.classify\(turn, pipelineContext\.recentConversationContext\)/);
});

test('R: internalPipelineOrchestrator.js only ever PASSES THROUGH pipelineContext.recentConversationContext (an already-assembled field) — it never independently reads the RECENT_CONVERSATION_READ StateAccess capability itself (that assembly remains Memory Layer\'s exclusive job)', () => {
  assert.equal(orchestratorSrc.indexOf('RECENT_CONVERSATION_READ'), -1, 'only js/coachDecisionSystem/memoryLayer.js may create this StateAccess capability access');
  assert.equal(orchestratorSrc.indexOf('ConversationRepository'), -1, 'internalPipelineOrchestrator.js must never read the repository directly (CD-02-style discipline)');
  // resolveTrainingReadinessProposal() itself (the TRR-specific mapping function) never
  // references recentConversationContext at all — that field reaches the reasoning component
  // exclusively via buildTrainingReadinessReasoningContext() (memoryLayer.js, tested separately).
  const idx = orchestratorSrc.indexOf('function resolveTrainingReadinessProposal');
  const endIdx = orchestratorSrc.indexOf('\n  }', idx);
  assert.equal(orchestratorSrc.slice(idx, endIdx).indexOf('recentConversationContext'), -1);
});

// ── X: fail-open persistence ────────────────────────────────────────────────

test('X: the PENDING create is awaited but wrapped in try/catch — a failure never throws out of submitCoachConversationTurn()', () => {
  const idx = appJs.indexOf('ConversationRepository.createPending(');
  assert.notEqual(idx, -1);
  const before = appJs.slice(Math.max(0, idx - 300), idx);
  assert.match(before, /try \{/);
  const after = appJs.slice(idx, idx + 400);
  assert.match(after, /catch \(e\) \{/);
  assert.match(after, /pendingPersisted = false;/);
  assert.match(after, /ErrorTelemetry\.report\(\{ code: \(e && e\.code\) \|\| 'PERSIST_TURN_CREATE_FAILED', module: 'COACH', operation: 'PERSIST_TURN_CREATE' \}\);/);
});

test('X: the completion update is fire-and-forget (.catch(), never awaited) — a failure never blocks or delays the already-rendered response', () => {
  const completedIdx = appJs.indexOf("ConversationRepository.completeTurn(currentUser.uid, turn.turnId, { status: 'COMPLETED'");
  const silenceIdx = appJs.indexOf("ConversationRepository.completeTurn(currentUser.uid, turn.turnId, { status: 'SILENCE'");
  assert.notEqual(completedIdx, -1);
  assert.notEqual(silenceIdx, -1);
  [completedIdx, silenceIdx].forEach((idx) => {
    const line = appJs.slice(idx, appJs.indexOf(';', appJs.indexOf('.catch(', idx)) + 1);
    assert.doesNotMatch(line, /^\s*await /);
    assert.match(line, /\.catch\(function \(e\) \{ ErrorTelemetry\.report\(/);
  });
});

test('X: loadCoachConversationHistory() and resetApp()\'s conversation cleanup are both wrapped defensively (try/catch), never able to break app boot or the reset flow', () => {
  const loadIdx = appJs.indexOf('async function loadCoachConversationHistory()');
  assert.notEqual(loadIdx, -1);
  const loadBody = appJs.slice(loadIdx, appJs.indexOf('\n}', loadIdx));
  assert.match(loadBody, /try \{[\s\S]*?\} catch \(e\) \{/);

  // B3 (Reset Integrity): resetApp() now composes every delete through a shared attempt() helper
  // (itself try/catch-wrapped) rather than a separate inline try/catch per call — the defensive
  // guarantee is unchanged (a failure here can never throw uncaught), only the expression shape.
  const resetIdx = appJs.indexOf('async function resetApp()');
  assert.notEqual(resetIdx, -1);
  const resetBody = appJs.slice(resetIdx, appJs.indexOf('\n}', resetIdx));
  assert.match(resetBody, /async function attempt\(fn\) \{ try \{ await fn\(\); \} catch \(e\) \{ allOk = false; \} \}/);
  const resetCleanupIdx = resetBody.indexOf('ConversationRepository.deleteAllForUser(currentUser.uid)');
  assert.notEqual(resetCleanupIdx, -1);
  const resetLine = resetBody.slice(resetBody.lastIndexOf('await attempt(', resetCleanupIdx), resetBody.indexOf('\n', resetCleanupIdx) + 1);
  assert.match(resetLine, /await attempt\(function \(\) \{ return ConversationRepository\.deleteAllForUser\(currentUser\.uid\); \}\);/);
});

// ── Y: stale session/user cannot persist to the wrong uid ──────────────────

test('Y: every CCC-001 persistence call site uses currentUser.uid evaluated directly at the call — never a deferred/closed-over reference that could resolve to a LATER user', () => {
  const callSites = [
    'ConversationRepository.createPending(currentUser.uid,',
    "ConversationRepository.completeTurn(currentUser.uid, turn.turnId, { status: 'COMPLETED'",
    "ConversationRepository.completeTurn(currentUser.uid, turn.turnId, { status: 'SILENCE'",
    'ConversationRepository.fetchRecent(currentUser.uid, 50)',
    'ConversationRepository.deleteAllForUser(currentUser.uid)'
  ];
  callSites.forEach((snippet) => assert.notEqual(appJs.indexOf(snippet), -1, 'missing exact call-site shape: ' + snippet));
});

test('Y: submitCoachConversationTurn() re-checks SessionLifecycle.isCurrent(turn.sessionGeneration) before any rendering, and the completion writes are gated by the SAME already-verified turn — no separate, later, ungated write path exists', () => {
  const idx = appJs.indexOf('async function submitCoachConversationTurn()');
  const endIdx = appJs.indexOf('\n// helper', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /if \(!SessionLifecycle\.isCurrent\(turn\.sessionGeneration\)\) return;/);
  // Both completion call sites occur textually AFTER the guard above, inside the same function
  // body — never in a separately-scheduled callback that could run after a session transition.
  const guardIdx = body.indexOf('if (!SessionLifecycle.isCurrent(turn.sessionGeneration)) return;');
  const completedCallIdx = body.indexOf('completeTurn(currentUser.uid, turn.turnId, { status: \'COMPLETED\'');
  const silenceCallIdx = body.indexOf('completeTurn(currentUser.uid, turn.turnId, { status: \'SILENCE\'');
  assert.ok(guardIdx < completedCallIdx);
  assert.ok(guardIdx < silenceCallIdx);
});

// ── U: reset/delete ordering ─────────────────────────────────────────────

test('U: resetApp() deletes the coachConversation subcollection before deleting the profile document, and never inside the reporting/completion path itself', () => {
  const resetIdx = appJs.indexOf('async function resetApp()');
  assert.notEqual(resetIdx, -1);
  const deleteAllIdx = appJs.indexOf('ConversationRepository.deleteAllForUser(currentUser.uid)', resetIdx);
  const profileDeleteIdx = appJs.indexOf("db.collection('users').doc(currentUser.uid).delete()", resetIdx);
  assert.notEqual(deleteAllIdx, -1);
  assert.ok(deleteAllIdx < profileDeleteIdx, 'conversation cleanup must be ordered before the profile delete, exactly like errorLog cleanup');
  // deleteAllForUser must never be CALLED from within createPending()'s or completeTurn()'s own
  // bodies — it is reset-only, never part of the reporting/completion path itself.
  const createPendingIdx = conversationRepoSrc.indexOf('function createPending');
  const createPendingBody = conversationRepoSrc.slice(createPendingIdx, conversationRepoSrc.indexOf('\n  }', createPendingIdx));
  const completeTurnIdx = conversationRepoSrc.indexOf('function completeTurn');
  const completeTurnBody = conversationRepoSrc.slice(completeTurnIdx, conversationRepoSrc.indexOf('\n  }', completeTurnIdx));
  assert.equal(createPendingBody.indexOf('deleteAllForUser'), -1);
  assert.equal(completeTurnBody.indexOf('deleteAllForUser'), -1);
});

test('U: resetApp() deletes BOTH errorLog and coachConversation subcollections before the profile document (Item 7 + CCC-001 together, no regression to either)', () => {
  const resetIdx = appJs.indexOf('async function resetApp()');
  const errorLogIdx = appJs.indexOf('ErrorLogRepository.deleteAllForUser(currentUser.uid)', resetIdx);
  const conversationIdx = appJs.indexOf('ConversationRepository.deleteAllForUser(currentUser.uid)', resetIdx);
  const profileDeleteIdx = appJs.indexOf("db.collection('users').doc(currentUser.uid).delete()", resetIdx);
  assert.notEqual(errorLogIdx, -1);
  assert.notEqual(conversationIdx, -1);
  assert.ok(errorLogIdx < profileDeleteIdx);
  assert.ok(conversationIdx < profileDeleteIdx);
});

// ── S/T: sign-out clears the rendered thread only, never Firestore ─────────

test('S: coachConversationPresenter.js registers a SessionLifecycle cleanup, named \'coachConversation\', inside configure()', () => {
  assert.match(presenterSrc, /window\.SessionLifecycle\.registerCleanup\('coachConversation', function \(\) \{/);
  const idx = presenterSrc.indexOf("registerCleanup('coachConversation'");
  const configureIdx = presenterSrc.indexOf('function configure(injected)');
  assert.ok(idx > configureIdx, 'the registration must live inside configure(), not at module-load time (SessionLifecycle is not yet loaded at this file\'s own load time is not the constraint here, but consistency with the established deferred-registration pattern is)');
});

test('S: the registered cleanup calls clearThread() (DOM only)', () => {
  const cleanupIdx = presenterSrc.indexOf("registerCleanup('coachConversation'");
  const cleanupBody = presenterSrc.slice(cleanupIdx, presenterSrc.indexOf('});', cleanupIdx));
  assert.match(cleanupBody, /clearThread\(\);/);
});

test('T: the registered sign-out cleanup never references Firestore, ConversationRepository, or any delete/write operation — it only touches in-memory/DOM state', () => {
  const cleanupIdx = presenterSrc.indexOf("registerCleanup('coachConversation'");
  const cleanupBody = presenterSrc.slice(cleanupIdx, presenterSrc.indexOf('});', cleanupIdx));
  assert.equal(cleanupBody.indexOf('ConversationRepository'), -1);
  assert.equal(cleanupBody.indexOf('.delete('), -1);
  assert.equal(cleanupBody.indexOf('db.collection'), -1);
});

test('clearThread() only clears DOM content (innerHTML), never calls any repository', () => {
  const idx = presenterSrc.indexOf('function clearThread()');
  const body = presenterSrc.slice(idx, presenterSrc.indexOf('}', idx) + 1);
  assert.match(body, /container\.innerHTML = '';/);
  assert.equal(body.indexOf('Repository'), -1);
});

// ── Z: transcript never enters Typed Memory or Safety Context ──────────────

test('Z: js/repositories/conversationRepository.js never references js/memory.js\'s createMemory/FitMeMemory, and never references any Safety module', () => {
  ['createMemory', 'FitMeMemory', 'SafetyContextInterpreter', 'UserSafetyProvenanceInterpreter', 'SafetyLayer', 'matchCanonicalSafetyRules'].forEach((token) => {
    assert.equal(conversationRepoSrc.indexOf(token), -1, 'conversationRepository.js must never reference ' + token);
  });
});

test('Z: js/memory.js never references ConversationRepository or the coachConversation collection — Typed Memory writes remain entirely independent of transcript persistence', () => {
  assert.equal(memorySrc.indexOf('ConversationRepository'), -1);
  assert.equal(memorySrc.indexOf('coachConversation'), -1);
});

test('Z: js/app.js\'s CCC-001 persistence call sites never call FitMeMemory.create/createMemory — a persisted turn can never silently become a Typed Memory record', () => {
  const idx = appJs.indexOf('async function submitCoachConversationTurn()');
  const endIdx = appJs.indexOf('\n// helper', idx);
  const body = appJs.slice(idx, endIdx);
  assert.equal(body.indexOf('FitMeMemory'), -1);
  assert.equal(body.indexOf('createMemory'), -1);
});

test('Z: firestore.rules coachConversation block never references memories, Typed Memory sources, or Safety-related fields', () => {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const blockStart = rules.indexOf('match /coachConversation/{turnId}');
  const blockEnd = rules.indexOf('\n      }', blockStart);
  const block = rules.slice(blockStart, blockEnd);
  assert.equal(block.indexOf('user_stated'), -1);
  assert.equal(block.indexOf('memories'), -1);
});
