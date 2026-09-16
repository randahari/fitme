// CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md) — static source/wiring checks, mirroring
// tests/ccc001Wiring.test.js's own established "read the actual repository files as text and
// assert structural facts" convention for anything not independently unit-testable without a
// DOM/live-Firebase harness (js/app.js's submitCoachConversationTurn()/persistCpiPreferenceRecord(),
// exactly like every prior *Wiring.test.js in this repository).
// Run with: node --test tests/cpi001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const memoryJsSrc = fs.readFileSync(path.join(ROOT, 'js/memory.js'), 'utf8');
const orchestratorSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
const gateSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/preferenceIntakeGate.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');

// ── Load order / script registration ──────────────────────────────────────

test('wiring: explicitPreferenceStatementInterpreter.js and preferenceIntakeGate.js load before internalPipelineOrchestrator.js', () => {
  const epsiIdx = indexHtml.indexOf('src="js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js"');
  const gateIdx = indexHtml.indexOf('src="js/coachDecisionSystem/preferenceIntakeGate.js"');
  const orchIdx = indexHtml.indexOf('src="js/coachDecisionSystem/internalPipelineOrchestrator.js"');
  assert.notEqual(epsiIdx, -1);
  assert.notEqual(gateIdx, -1);
  assert.ok(epsiIdx < orchIdx);
  assert.ok(gateIdx < orchIdx);
  // safetyContextInterpreter.js (already loaded far earlier, USC-001) must still precede the gate,
  // which resolves it at top-of-module require/window time.
  const safetyIdx = indexHtml.indexOf('src="js/coachDecisionSystem/safetyContextInterpreter.js"');
  assert.ok(safetyIdx < gateIdx);
});

test('wiring: both new modules are in the sw.js SHELL cache list', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js'), -1);
  assert.notEqual(swJs.indexOf('/fitme/js/coachDecisionSystem/preferenceIntakeGate.js'), -1);
});

test('wiring: app.js configures ExplicitPreferenceStatementInterpreter with the same callClaude seam as every other interpreter', () => {
  assert.match(appJs, /ExplicitPreferenceStatementInterpreter\.configure\(\{\s*callClaude: function \(body\) \{ return callClaude\(body\); \}\s*\}\);/);
});

// ── Persistence boundary (§11/§12) — app.js only, never inside the governed pipeline ──────

test('wiring: persistCpiPreferenceRecord() is defined in app.js and uses only the existing js/memory.js CRUD API (FitMeMemory.get/create/update) — never a new Firestore access', () => {
  const idx = appJs.indexOf('async function persistCpiPreferenceRecord');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n}', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /FitMeMemory\.get\(/);
  assert.match(body, /FitMeMemory\.create\(/);
  assert.match(body, /FitMeMemory\.update\(/);
  assert.equal(body.indexOf('db.collection'), -1, 'must never touch Firestore directly — only through js/memory.js');
});

test('wiring: persistCpiPreferenceRecord() implements the §12 deterministic table — absent/active/rejected branches, fail-closed on any other status', () => {
  const idx = appJs.indexOf('async function persistCpiPreferenceRecord');
  const endIdx = appJs.indexOf('\n}', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /if \(!existing\)/);
  assert.match(body, /existing\.status === 'active'/);
  assert.match(body, /existing\.status === 'rejected'/);
  assert.match(body, /wasReactivatedFromRejected = true/);
  assert.match(body, /return \{ success: false \};/); // the fail-closed "any other status" branch
});

test('wiring: the deterministic memory ID reuses FitMeMemory.safeKey() — the same helper migrateIfNeeded() already uses, never a locally re-implemented encoding', () => {
  assert.match(appJs, /function cpiDeterministicMemoryId\(preferenceClass, target\) \{\s*return 'conv_pref_' \+ preferenceClass \+ '_' \+ FitMeMemory\.safeKey\(target\);/);
});

test('wiring: js/memory.js exports get() and safeKey() on its main, browser-reachable API (additive to the existing CRUD surface)', () => {
  assert.match(memoryJsSrc, /get: getMemory,/);
  assert.match(memoryJsSrc, /safeKey: safeKey\s*\n\s*\};/);
});

// ── CCC-001 lifecycle deferral (§14) — never a second write path, never SILENCE -> COMPLETED ──

// Friends Alpha Item 6 (USER_DISCLOSURE V1) generalized the single authorized-branch guard from
// cpiAuthorized alone to deferAuthorized (cpiAuthorized || disclosureCaptureAuthorized) — CPI-001
// turns (disclosureCaptureAuthorized always false for them) behave byte-identically; these tests
// are updated to the new guard name while verifying the exact same invariants.
test('wiring: submitCoachConversationTurn() branches on deferAuthorized (cpiAuthorized || disclosureCaptureAuthorized) BEFORE any rendering/completeTurn() call, and the pre-existing (neither authorized) branch is otherwise untouched', () => {
  const idx = appJs.indexOf('async function submitCoachConversationTurn()');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n// CCC-001', appJs.indexOf('async function loadCoachConversationHistory()'));
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /var cpiAuthorized = !!\(preferenceIntakeAuthorization && preferenceIntakeAuthorization\.authorized === true\);/);
  assert.match(body, /var disclosureCaptureAuthorized = !!\(disclosureCaptureAuthorization && disclosureCaptureAuthorization\.authorized === true\);/);
  assert.match(body, /var deferAuthorized = cpiAuthorized \|\| disclosureCaptureAuthorized;/);
  const branchIdx = body.indexOf('if (!deferAuthorized) {');
  assert.notEqual(branchIdx, -1);
  // The existing DUC-001 rendering logic (renderResponse for a DISPATCHED expression) occurs
  // textually AFTER the branch guard, inside it.
  const existingRenderIdx = body.indexOf("expression.status === 'DISPATCHED'");
  assert.ok(branchIdx < existingRenderIdx);
});

test('wiring: for deferAuthorized === true, no rendering or completeTurn() call occurs before either persistCpiPreferenceRecord() or persistSafetyDisclosureRecord() resolves', () => {
  const idx = appJs.indexOf("if (!deferAuthorized) {");
  const endOfPreExistingBranch = appJs.indexOf('} // end: if (!deferAuthorized)', idx);
  assert.notEqual(endOfPreExistingBranch, -1);
  const authorizedBranch = appJs.slice(endOfPreExistingBranch, appJs.indexOf("} catch (e) {\n    CoachConversationPresenter.renderNoResponse(turn.turnId);\n    CoachConversationPresenter.showError('לא הצלחנו לקבל תשובה מהמאמן. נסה שוב.');\n    // Friends Alpha Item 7", endOfPreExistingBranch));
  const persistIdx = authorizedBranch.indexOf('persistCpiPreferenceRecord(');
  const disclosurePersistIdx = authorizedBranch.indexOf('persistSafetyDisclosureRecord(');
  const firstRenderIdx = authorizedBranch.indexOf('CoachConversationPresenter.renderResponse(');
  const firstCompleteTurnIdx = authorizedBranch.indexOf('ConversationRepository.completeTurn(');
  assert.notEqual(persistIdx, -1);
  assert.notEqual(disclosurePersistIdx, -1);
  assert.notEqual(firstRenderIdx, -1);
  assert.notEqual(firstCompleteTurnIdx, -1);
  assert.ok(persistIdx < firstRenderIdx, 'CPI persistence must resolve before any rendering in the authorized branch');
  assert.ok(persistIdx < firstCompleteTurnIdx, 'CPI persistence must resolve before any completeTurn() call in the authorized branch');
  assert.ok(disclosurePersistIdx < firstRenderIdx, 'disclosure persistence must resolve before any rendering in the authorized branch');
  assert.ok(disclosurePersistIdx < firstCompleteTurnIdx, 'disclosure persistence must resolve before any completeTurn() call in the authorized branch');
});

test('wiring: the authorized branch dispatches Unified Finalization through the governed EngineRegistry.run() entry point, never a direct internalPipelineOrchestrator call', () => {
  const idx = appJs.indexOf('async function runPreferenceAcknowledgmentFinalizationEngine');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n}', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /EngineRegistry\.run\(/);
  assert.match(body, /actions: \{ coachDecisionSystem: 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE' \}/);
  assert.equal(body.indexOf('internalPipelineOrchestrator'), -1, 'app.js must never reference internalPipelineOrchestrator.js directly');
});

test('wiring: exactly one completeTurn() call site exists in the authorized branch for each of COMPLETED/SILENCE — no duplicate/second write path', () => {
  const idx = appJs.indexOf("} // end: if (!deferAuthorized)");
  const authorizedBranch = appJs.slice(idx, appJs.indexOf('} catch (e) {', idx));
  const completedCount = (authorizedBranch.match(/status: 'COMPLETED'/g) || []).length;
  const silenceCount = (authorizedBranch.match(/status: 'SILENCE'/g) || []).length;
  assert.equal(completedCount, 1);
  assert.equal(silenceCount, 1);
});

// Friends Alpha Item 6 — the CPI write's own failure guard is now conditional on cpiAuthorized
// (never attempted at all when only a disclosure was authorized), but preserves the exact same
// all-or-nothing failure discipline: return before Unified Finalization / completeTurn().
test('wiring: on a CPI persistence failure, the authorized branch returns before dispatching Unified Finalization or calling completeTurn() — the record is left PENDING', () => {
  const idx = appJs.indexOf('if (cpiAuthorized && !cpiPersistResult.success) {');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n    }', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /return;/);
  // Checks the actual call-site shapes (never the bare word, which this block's own explanatory
  // comment legitimately also contains as documentation).
  assert.equal(body.indexOf('ConversationRepository.completeTurn('), -1);
  assert.equal(body.indexOf('runPreferenceAcknowledgmentFinalizationEngine('), -1);
});

// Friends Alpha Item 6 — the disclosure write's own, structurally identical failure guard.
test('wiring: on a disclosure persistence failure, the authorized branch returns before dispatching Unified Finalization or calling completeTurn() — the record is left PENDING', () => {
  const idx = appJs.indexOf('if (disclosureCaptureAuthorized && !disclosurePersistResult.success) {');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n    }', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /return;/);
  assert.equal(body.indexOf('ConversationRepository.completeTurn('), -1);
  assert.equal(body.indexOf('runPreferenceAcknowledgmentFinalizationEngine('), -1);
});

// ── Independent Safety veto (§10) — reuses the existing, unmodified SafetyContextInterpreter ──

test('wiring: preferenceIntakeGate.js calls SafetyContextInterpreter.classifyWithStatus() — the additive sibling export, never a new Safety interpreter', () => {
  assert.match(gateSrc, /SafetyContextInterpreter\.classifyWithStatus\(/);
  assert.equal(gateSrc.indexOf('new '), -1, 'no new class/interpreter instantiation');
});

test('wiring: preferenceIntakeGate.js treats a non-CLASSIFIED status as an unconditional veto, never coerced into "zero restrictions"', () => {
  assert.match(gateSrc, /result\.status !== 'CLASSIFIED'/);
  assert.match(gateSrc, /SAFETY_VETO_UNAVAILABLE/);
});

// ── No LLM/model direct write to Typed Memory/Firestore (Canonical Contract 7) ──────────────

test('wiring: neither explicitPreferenceStatementInterpreter.js nor preferenceIntakeGate.js ever references Firestore/db/FitMeMemory — the interpreter/gate only classify and authorize, never persist', () => {
  const epsiSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js'), 'utf8');
  [epsiSrc, gateSrc].forEach((src) => {
    assert.equal(src.indexOf('FitMeMemory'), -1);
    assert.equal(src.indexOf('.collection('), -1);
    assert.equal(src.indexOf('createMemory'), -1);
  });
});

// ── Firestore rules unchanged (§11/§21) ─────────────────────────────────────

test('wiring: firestore.rules memories block is unchanged by this Item — still owner-scoped, source-restricted, no CPI-specific carve-out', () => {
  assert.match(firestoreRules, /allow create: if isSignedIn\(\) && request\.auth\.uid == uid\s*\n\s*&& request\.resource\.data\.source in \['user_stated', 'migrated'\];/);
  assert.equal(firestoreRules.indexOf('conv_pref'), -1, 'the deterministic ID prefix requires no rule-level special-casing');
});

// ── D6 transparency surface untouched (§19) ─────────────────────────────────

test('wiring: js/memory.js\'s D6 sheet functions (openSheet/renderItem/installSettingsButton) are textually unmodified in shape by this Item — get()/safeKey() export additions only', () => {
  assert.match(memoryJsSrc, /function openSheet/);
  assert.match(memoryJsSrc, /function renderItem/);
  assert.match(memoryJsSrc, /'\+ הוסף משהו שהמאמן צריך לדעת'/);
});
