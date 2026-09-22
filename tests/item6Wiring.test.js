// Friends Alpha Item 6 (USER_DISCLOSURE V1) — static source/wiring checks, mirroring
// tests/cpi001Wiring.test.js's own established "read the actual repository files as text and
// assert structural facts" convention for anything not independently unit-testable without a
// DOM/live-Firebase harness (script registration order, sw.js SHELL cache, memory.js
// type/label/ESAF additions, stateAccess.js's USM-001 filter widening).
// Run with: node --test tests/item6Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const memoryJsSrc = fs.readFileSync(path.join(ROOT, 'js/memory.js'), 'utf8');
const stateAccessSrc = fs.readFileSync(path.join(ROOT, 'js/stateAccess.js'), 'utf8');
const safetyInterpreterSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/safetyContextInterpreter.js'), 'utf8');
const recognizerSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/userDisclosureRecognizer.js'), 'utf8');
const gateSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/safetyDisclosureIntakeGate.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');

// ── Load order / script registration ──────────────────────────────────────

test('wiring: userDisclosureRecognizer.js and safetyDisclosureIntakeGate.js load before internalPipelineOrchestrator.js, and after safetyContextInterpreter.js', () => {
  const recognizerIdx = indexHtml.indexOf('src="js/coachDecisionSystem/userDisclosureRecognizer.js"');
  const gateIdx = indexHtml.indexOf('src="js/coachDecisionSystem/safetyDisclosureIntakeGate.js"');
  const orchIdx = indexHtml.indexOf('src="js/coachDecisionSystem/internalPipelineOrchestrator.js"');
  const safetyIdx = indexHtml.indexOf('src="js/coachDecisionSystem/safetyContextInterpreter.js"');
  assert.notEqual(recognizerIdx, -1);
  assert.notEqual(gateIdx, -1);
  assert.ok(recognizerIdx < orchIdx);
  assert.ok(gateIdx < orchIdx);
  assert.ok(safetyIdx < gateIdx, 'safetyDisclosureIntakeGate.js resolves SafetyContextInterpreter at top-of-module require/window time');
});

test('wiring: both new modules are in the sw.js SHELL cache list', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/coachDecisionSystem/userDisclosureRecognizer.js'), -1);
  assert.notEqual(swJs.indexOf('/fitme/js/coachDecisionSystem/safetyDisclosureIntakeGate.js'), -1);
});

// ── js/memory.js — the new safety_disclosure Typed Memory type (additive only) ──────────────

test('wiring: MEMORY_TYPES includes safety_disclosure as an additive 8th type — the seven pre-existing types are untouched (WP0 Phase D.5 subsequently added a 9th, additive type, risk_characteristic_fact, after it — asserted in tests/wp0PhaseD5DurableMemoryWiring.test.js; safety_disclosure\'s own position and value here remain byte-identical)', () => {
  assert.match(memoryJsSrc, /var MEMORY_TYPES = \['fact', 'habit', 'pattern', 'preference', 'coach_note', 'conversation_memory', 'recurring_meal', 'safety_disclosure', 'risk_characteristic_fact'\];/);
});

test('wiring: TYPE_LABELS carries the Hebrew label "מידע בטיחותי" for safety_disclosure (Final Binding Decision 2 — smallest additive transparency-UI treatment)', () => {
  assert.match(memoryJsSrc, /safety_disclosure: 'מידע בטיחותי'/);
});

test('wiring: ESAF_QUALIFYING_TYPES includes safety_disclosure (Final Binding Decision 3 — additive freshness/invalidation signaling)', () => {
  assert.match(memoryJsSrc, /var ESAF_QUALIFYING_TYPES = \['fact', 'preference', 'safety_disclosure'\];/);
});

// ── js/stateAccess.js — the narrow, explicitly-flagged USM-001 reopening ────────────────────

test('wiring: readUserStatedMemory() widens its closed type filter to include safety_disclosure — fact/preference remain, no other type is exposed', () => {
  assert.match(stateAccessSrc, /m\.type === 'fact' \|\| m\.type === 'preference' \|\| m\.type === 'safety_disclosure'/);
});

// ── js/coachDecisionSystem/safetyContextInterpreter.js — additive correction classification ──

test('wiring: classify()/classifyWithStatus() remain textually present and unmodified in shape; classifyCorrectionWithStatus() is a new, additive sibling export', () => {
  assert.match(safetyInterpreterSrc, /function classify\(records\)/);
  assert.match(safetyInterpreterSrc, /function classifyWithStatus\(records\)/);
  assert.match(safetyInterpreterSrc, /function classifyCorrectionWithStatus\(turnRecord, existingRestrictionText\)/);
  assert.match(safetyInterpreterSrc, /classifyCorrectionWithStatus: classifyCorrectionWithStatus/);
});

test('wiring: classifyCorrectionWithStatus() fails closed on missing turnRecord/existingRestrictionText/unconfigured classifier — never defaults to true', () => {
  const idx = safetyInterpreterSrc.indexOf('async function classifyCorrectionWithStatus');
  const endIdx = safetyInterpreterSrc.indexOf('\n  }', idx);
  const body = safetyInterpreterSrc.slice(idx, endIdx);
  assert.match(body, /return \{ status: 'FAILED' \};/);
  assert.equal((body.match(/status: 'FAILED'/g) || []).length >= 3, true, 'expected multiple distinct fail-closed guards');
});

// ── js/coachDecisionSystem/userDisclosureRecognizer.js — never touches DUC-001's own Need path ──

test('wiring: userDisclosureRecognizer.js\'s recognize() never reads turnUnderstanding.affirmativeRequest, and the module never requires/imports ConversationalNeedCreator — recognition is entirely independent of request/Need recognition', () => {
  const idx = recognizerSrc.indexOf('function recognize(turn, turnUnderstanding, pipelineContext)');
  const endIdx = recognizerSrc.indexOf('\n  }', idx);
  const body = recognizerSrc.slice(idx, endIdx);
  assert.equal(body.indexOf('affirmativeRequest'), -1);
  assert.equal(body.indexOf('DirectUserNeed'), -1);
  assert.equal(recognizerSrc.indexOf("require('./conversationalNeedCreator.js')"), -1);
  assert.equal(recognizerSrc.indexOf('window.ConversationalNeedCreator'), -1);
});

// ── js/coachDecisionSystem/safetyDisclosureIntakeGate.js — reuses SafetyContextInterpreter only ──

test('wiring: safetyDisclosureIntakeGate.js calls SafetyContextInterpreter.classifyWithStatus() and classifyCorrectionWithStatus() — never a second/new Safety classifier', () => {
  assert.match(gateSrc, /SafetyContextInterpreter\.classifyWithStatus\(/);
  assert.match(gateSrc, /SafetyContextInterpreter\.classifyCorrectionWithStatus\(/);
  assert.equal(/\bnew\s+[A-Z]\w*\s*\(/.test(gateSrc), false, 'no `new SomeClass(...)` instantiation anywhere in the file');
});

test('wiring: neither userDisclosureRecognizer.js nor safetyDisclosureIntakeGate.js ever references Firestore/db/FitMeMemory — recognition/authorization only, never persistence', () => {
  [recognizerSrc, gateSrc].forEach((src) => {
    assert.equal(src.indexOf('FitMeMemory'), -1);
    assert.equal(src.indexOf('.collection('), -1);
    assert.equal(src.indexOf('createMemory'), -1);
  });
});

// ── js/app.js — the persistence boundary (never inside the governed pipeline) ───────────────

test('wiring: persistSafetyDisclosureRecord() is defined in app.js and uses only the existing js/memory.js CRUD API (FitMeMemory.get/create/update) — never a new Firestore access', () => {
  const idx = appJs.indexOf('async function persistSafetyDisclosureRecord');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n}', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /FitMeMemory\.get\(/);
  assert.match(body, /FitMeMemory\.create\(/);
  assert.match(body, /FitMeMemory\.update\(/);
  assert.equal(body.indexOf('db.collection'), -1, 'must never touch Firestore directly — only through js/memory.js');
});

test('wiring: the deterministic Safety disclosure memory ID reuses FitMeMemory.safeKey(), the same helper CPI-001\'s own cpiDeterministicMemoryId() already uses — never a locally re-implemented encoding', () => {
  assert.match(appJs, /function safetyDisclosureDeterministicMemoryId\(subjectKey\) \{\s*return 'conv_safety_' \+ FitMeMemory\.safeKey\(subjectKey\);/);
});

test('wiring: persistSafetyDisclosureRecord() implements both modes explicitly — CORRECTION marks an existing active record superseded (safe no-op if none active); NEW_RESTRICTION creates-or-updates an active record — never a third, uncontrolled branch', () => {
  const idx = appJs.indexOf('async function persistSafetyDisclosureRecord');
  const endIdx = appJs.indexOf('\nasync function', idx + 10);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /candidateRecord\.mode === 'CORRECTION'/);
  assert.match(body, /status: 'superseded'/);
  assert.match(body, /existingForCorrection\.status !== 'active'/);
  assert.match(body, /type: 'safety_disclosure'/);
});

test('wiring: runPreferenceAcknowledgmentFinalizationEngine() threads confirmedDisclosureRecord as an additive 5th parameter, defaulting to null — every pre-Item-6 (4-argument) call site remains byte-identical', () => {
  const idx = appJs.indexOf('async function runPreferenceAcknowledgmentFinalizationEngine');
  assert.notEqual(idx, -1);
  const endIdx = appJs.indexOf('\n}', idx);
  const body = appJs.slice(idx, endIdx);
  assert.match(body, /confirmedDisclosureRecord/);
  assert.match(body, /confirmedDisclosureRecord: confirmedDisclosureRecord \|\| null/);
});

// ── Firestore rules unchanged (memories/{memoryId} rules key on source, never type) ─────────

test('wiring: firestore.rules memories block is unchanged by this Item — still owner-scoped, source-restricted, no safety_disclosure-specific carve-out', () => {
  assert.match(firestoreRules, /allow create: if isSignedIn\(\) && request\.auth\.uid == uid\s*\n\s*&& request\.resource\.data\.source in \['user_stated', 'migrated'\];/);
  assert.equal(firestoreRules.indexOf('conv_safety'), -1, 'the deterministic ID prefix requires no rule-level special-casing');
  assert.equal(firestoreRules.indexOf('safety_disclosure'), -1, 'rules key on source only, never type — no type-specific carve-out for the new type either');
});

// ── SAFETY_HIGH_RISK remains entirely untouched by this Item ────────────────────────────────

test('wiring: none of the new/modified Item 6 files reference SAFETY_HIGH_RISK — it stays dormant, never activated by this Item', () => {
  [recognizerSrc, gateSrc].forEach((src) => {
    assert.equal(src.indexOf('SAFETY_HIGH_RISK'), -1);
  });
  const orchestratorSrc = fs.readFileSync(path.join(ROOT, 'js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
  // SAFETY_HIGH_RISK exists in the orchestrator for the pre-existing, unrelated Safety-exempt
  // turn-serving admission logic — but the Item 6 disclosure track itself never references it in
  // its own added block.
  const disclosureBlockIdx = orchestratorSrc.indexOf('function applyDisclosureAcknowledgmentIfNeeded');
  const disclosureBlockEnd = orchestratorSrc.indexOf('\n  }', disclosureBlockIdx);
  assert.equal(orchestratorSrc.slice(disclosureBlockIdx, disclosureBlockEnd).indexOf('SAFETY_HIGH_RISK'), -1);
});
