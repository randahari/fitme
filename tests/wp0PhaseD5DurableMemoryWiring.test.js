// WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15/§20/§22, Revision 2,
// Product+Architecture APPROVED) — Durable Memory Wiring structural/textual tests. app.js/
// memoryLayer.js/stateAccess.js are browser-loaded (memoryLayer.js/stateAccess.js are safely
// require()-able; app.js is not — structural/textual assertions for it only, mirroring
// cpi001Wiring.test.js/item6Wiring.test.js's own established convention exactly).
// Run with: node --test tests/wp0PhaseD5DurableMemoryWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const memoryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'memory.js'), 'utf8');
const stateAccessJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'stateAccess.js'), 'utf8');
const memoryLayerJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'memoryLayer.js'), 'utf8');
const disclosureGateSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'safetyDisclosureIntakeGate.js'), 'utf8');

function functionBody(src, startMarker, nextMarkerPattern) {
  const idx = src.indexOf(startMarker);
  assert.notEqual(idx, -1, startMarker + ' not found');
  const rest = src.slice(idx + startMarker.length);
  const relEnd = nextMarkerPattern ? rest.search(nextMarkerPattern) : rest.indexOf('\n}');
  const endIdx = relEnd === -1 ? src.length : idx + startMarker.length + relEnd;
  return src.slice(idx, endIdx);
}

// ── js/memory.js — closed type vocabulary + transparency label (re-added, D.3's own reverted work) ──

test('memory.js: risk_characteristic_fact is a new, additive MEMORY_TYPES member — safety_disclosure and every other existing type remain present, unmodified, in order', () => {
  const match = memoryJs.match(/var MEMORY_TYPES = \[([^\]]+)\];/);
  assert.notEqual(match, null);
  const types = match[1].split(',').map((s) => s.trim().replace(/'/g, ''));
  assert.deepEqual(types, ['fact', 'habit', 'pattern', 'preference', 'coach_note', 'conversation_memory', 'recurring_meal', 'safety_disclosure', 'risk_characteristic_fact']);
});

test('memory.js: TYPE_LABELS has a Hebrew label for risk_characteristic_fact, and safety_disclosure\'s own label is untouched', () => {
  assert.match(memoryJs, /risk_characteristic_fact:\s*'[^']+'/);
  assert.match(memoryJs, /safety_disclosure:\s*'מידע בטיחותי'/);
});

test('memory.js: ESAF_QUALIFYING_TYPES is untouched by this phase — still exactly {fact, preference, safety_disclosure} (ESAF-001 is not mentioned anywhere in the approved Sub-Spec; out of scope)', () => {
  const match = memoryJs.match(/var ESAF_QUALIFYING_TYPES = \[([^\]]+)\];/);
  assert.notEqual(match, null);
  const types = match[1].split(',').map((s) => s.trim().replace(/'/g, ''));
  assert.deepEqual(types, ['fact', 'preference', 'safety_disclosure']);
});

test('memory.js: memText() gains one new, additive branch for literalStatementText — the existing p.text/p.key/p.name branches are untouched, in order, before it', () => {
  const idx = memoryJs.indexOf('function memText(m)');
  const endIdx = memoryJs.indexOf('\n  }', idx);
  const body = memoryJs.slice(idx, endIdx);
  const textIdx = body.indexOf('p.text');
  const keyIdx = body.indexOf('p.key');
  const nameIdx = body.indexOf('p.name');
  const literalIdx = body.indexOf('p.literalStatementText');
  assert.ok(textIdx < keyIdx && keyIdx < nameIdx && nameIdx < literalIdx, 'literalStatementText branch must come after the existing branches, none reordered');
});

test('memory.js: validateMemory()/createMemory()/updateMemory()/memCol() remain fully generic over MEMORY_TYPES — no type-specific branch for either safety_disclosure or risk_characteristic_fact was introduced', () => {
  const validateIdx = memoryJs.indexOf('function validateMemory(m)');
  const validateEnd = memoryJs.indexOf('\n  }', validateIdx);
  const validateBody = memoryJs.slice(validateIdx, validateEnd);
  assert.equal(/risk_characteristic_fact|safety_disclosure/.test(validateBody), false);
});

// ── js/stateAccess.js — new, narrow, sibling read capability (never widening USER_STATED_MEMORY_READ) ──

test('stateAccess.js: RISK_CHARACTERISTIC_FACT_READ is a new sibling identity under memoryLayer, reading exactly riskCharacteristicFacts, no writes — USER_STATED_MEMORY_READ\'s own reads/writes are untouched', () => {
  const StateAccess = require('../js/stateAccess.js');
  const permMatch = stateAccessJs.match(/memoryLayer:\s*\{([\s\S]*?)\n    \}\n  \};/);
  assert.notEqual(permMatch, null);
  const block = permMatch[1];
  assert.match(block, /USER_STATED_MEMORY_READ:\s*\{\s*reads:\s*\['userStatedMemory'\],\s*writes:\s*\[\]\s*\}/);
  assert.match(block, /RISK_CHARACTERISTIC_FACT_READ:\s*\{\s*reads:\s*\['riskCharacteristicFacts'\],\s*writes:\s*\[\]\s*\}/);
});

test('stateAccess.js: readRiskCharacteristicFacts() is consent-gated BEFORE any fetch is attempted (fail-closed to [], mirroring readUserStatedMemory()\'s own established discipline exactly), and reuses deps.fetchUserStatedMemory() — no new fetch dependency', async () => {
  const StateAccess = require('../js/stateAccess.js');
  let fetchCalled = false;
  StateAccess.configure({
    getUserProfile: () => ({ memoryConsent: { granted: false } }),
    isSessionCurrent: () => true,
    fetchUserStatedMemory: async () => { fetchCalled = true; return []; }
  });
  const access = StateAccess.createEngineAccess({ engineId: 'memoryLayer', action: 'RISK_CHARACTERISTIC_FACT_READ', userId: 'u1', sessionGeneration: 1, runId: 'r1' });
  const result = await access.read.riskCharacteristicFacts();
  assert.deepEqual(result, []);
  assert.equal(fetchCalled, false, 'the fetch dependency must never be invoked when consent is absent');
});

test('stateAccess.js: readRiskCharacteristicFacts() filters strictly to type===risk_characteristic_fact && source===user_stated && status===active — a safety_disclosure record in the same raw list is never returned', async () => {
  const StateAccess = require('../js/stateAccess.js');
  StateAccess.configure({
    getUserProfile: () => ({ memoryConsent: { granted: true } }),
    isSessionCurrent: () => true,
    fetchUserStatedMemory: async () => [
      { _id: 'rcf1', type: 'risk_characteristic_fact', payload: { riskDomain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', literalStatementText: 'peanut allergy', sourceTurnId: 't1' }, source: 'user_stated', status: 'active', updated_at: 100 },
      { _id: 'sd1', type: 'safety_disclosure', payload: { restrictionText: 'running' }, source: 'user_stated', status: 'active', updated_at: 200 },
      { _id: 'rcf2', type: 'risk_characteristic_fact', payload: {}, source: 'user_stated', status: 'superseded', updated_at: 300 },
      { _id: 'rcf3', type: 'risk_characteristic_fact', payload: {}, source: 'inferred_event', status: 'active', updated_at: 400 }
    ]
  });
  const access = StateAccess.createEngineAccess({ engineId: 'memoryLayer', action: 'RISK_CHARACTERISTIC_FACT_READ', userId: 'u1', sessionGeneration: 1, runId: 'r1' });
  const result = await access.read.riskCharacteristicFacts();
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'rcf1');
});

test('stateAccess.js: no other capability identity may read riskCharacteristicFacts — an unauthorized caller is denied', () => {
  const StateAccess = require('../js/stateAccess.js');
  StateAccess.configure({ getUserProfile: () => ({ memoryConsent: { granted: true } }), isSessionCurrent: () => true, fetchUserStatedMemory: async () => [] });
  const access = StateAccess.createEngineAccess({ engineId: 'coachDecisionSystem', action: 'DECISION_PASS', userId: 'u1', sessionGeneration: 1, runId: 'r1' });
  assert.throws(() => access.read.riskCharacteristicFacts(), (err) => err.code === 'STATE_ACCESS_DENIED');
});

// ── js/coachDecisionSystem/memoryLayer.js — new, bounded pipelineContext field, no AI classification ──

test('memoryLayer.js: riskCharacteristicFactContext performs NO AI/interpreter classification call of its own — records are already governed, only projected as-is (distinct from userSafetyContext\'s own SafetyContextInterpreter.classify() call)', () => {
  const startIdx = memoryLayerJs.indexOf('var riskCharacteristicFactContext = null;');
  const endIdx = memoryLayerJs.indexOf('// ── TRR-001', startIdx);
  const body = memoryLayerJs.slice(startIdx, endIdx);
  assert.equal(/\.classify\(/.test(body), false);
  assert.match(body, /RISK_CHARACTERISTIC_FACT_READ/);
});

test('memoryLayer.js: riskCharacteristicFactContext is threaded onto both the pipelineContext object and its availability sub-object, alongside (never replacing) userSafetyContext/userSafetyProvenance', () => {
  assert.match(memoryLayerJs, /userSafetyContext: userSafetyContext,/);
  assert.match(memoryLayerJs, /userSafetyProvenance: userSafetyProvenance,/);
  assert.match(memoryLayerJs, /riskCharacteristicFactContext: riskCharacteristicFactContext,/);
  assert.match(memoryLayerJs, /riskCharacteristicFactContext: riskCharacteristicFactContextAvailable \? 'AVAILABLE' : 'UNAVAILABLE',/);
});

// ── js/app.js — the persistence boundary, structurally mirroring persistSafetyDisclosureRecord() ──

test('wiring: persistRiskCharacteristicFactRecord() is defined in app.js and uses only the existing js/memory.js CRUD API (FitMeMemory.get/create/update) — never a new Firestore access', () => {
  const body = functionBody(appJs, 'async function persistRiskCharacteristicFactRecord', /\n(async )?function /);
  assert.match(body, /FitMeMemory\.get\(/);
  assert.match(body, /FitMeMemory\.create\(/);
  assert.match(body, /FitMeMemory\.update\(/);
  assert.equal(body.indexOf('db.collection'), -1, 'must never touch Firestore directly — only through js/memory.js');
});

test('wiring: the deterministic risk-characteristic-fact memory ID reuses FitMeMemory.safeKey(), never a locally re-implemented encoding', () => {
  assert.match(appJs, /function riskCharacteristicFactDeterministicMemoryId\(domain, literalStatementText\) \{\s*return 'risk_char_' \+ FitMeMemory\.safeKey\(domain \+ '::' \+ literalStatementText\);/);
});

test('wiring: persistRiskCharacteristicFactRecord() NEVER writes a severity field to the payload — the create()/update() payload object literal carries exactly {riskDomain, literalStatementText, sourceTurnId}, structurally proving the D.3 authority correction cannot be silently reintroduced at the persistence layer', () => {
  const body = functionBody(appJs, 'async function persistRiskCharacteristicFactRecord', /\n(async )?function /);
  const payloadMatch = body.match(/var payload = \{([\s\S]*?)\};/);
  assert.notEqual(payloadMatch, null);
  assert.equal(/severity/i.test(payloadMatch[1]), false);
  assert.match(payloadMatch[1], /riskDomain:/);
  assert.match(payloadMatch[1], /literalStatementText:/);
  assert.match(payloadMatch[1], /sourceTurnId:/);
});

test('wiring: persistRiskCharacteristicFactRecord() implements both modes explicitly — CORRECTION marks an existing active record superseded (safe no-op if none active, returns record:null, never fabricating an acknowledgment); NEW_FACT creates-or-updates an active risk_characteristic_fact record — never a third, uncontrolled branch, and never touches type:safety_disclosure', () => {
  const body = functionBody(appJs, 'async function persistRiskCharacteristicFactRecord', /\n(async )?function /);
  assert.match(body, /candidateRecord\.mode === 'CORRECTION'/);
  assert.match(body, /status: 'superseded'/);
  assert.match(body, /existingForCorrection\.status !== 'active'/);
  assert.match(body, /type: 'risk_characteristic_fact'/);
  assert.equal(body.indexOf('safety_disclosure'), -1);
});

test('wiring: persistSafetyDisclosureRecord() (the existing, pre-D.5 function) is completely unmodified in shape — still exactly its own two modes, still exactly type:safety_disclosure, never referencing risk_characteristic_fact', () => {
  const body = functionBody(appJs, 'async function persistSafetyDisclosureRecord', /\n(async )?function /);
  assert.match(body, /type: 'safety_disclosure'/);
  assert.equal(body.indexOf('risk_characteristic_fact'), -1);
  assert.equal(body.indexOf('RiskCharacteristic'), -1);
});

test('safetyDisclosureIntakeGate.js is completely unmodified by this phase — no reference to riskCharacteristic anything (binding requirement 8: existing safety_disclosure remains untouched and semantically distinct)', () => {
  assert.equal(/riskCharacteristic|RiskCharacteristic/i.test(disclosureGateSrc), false);
});

test('wiring: submitCoachConversationTurn() calls persistRiskCharacteristicFactRecord() exactly once, gated on riskCharacteristicFactCaptureAuthorized, with the SAME all-or-nothing failure-integrity discipline as the two pre-existing writes (a failure leaves the turn PENDING with an honest error, never a false-positive Unified Finalization — binding requirement 10)', () => {
  const body = functionBody(appJs, 'async function submitCoachConversationTurn', /\n(async )?function /);
  const occurrences = (body.match(/persistRiskCharacteristicFactRecord\(/g) || []).length;
  assert.equal(occurrences, 1);
  assert.match(body, /if \(riskCharacteristicFactCaptureAuthorized && !riskCharacteristicFactPersistResult\.success\) \{/);
});

test('wiring: runPreferenceAcknowledgmentFinalizationEngine() threads confirmedRiskCharacteristicFactRecord as an additive 6th parameter, defaulting to null — every pre-D.5 (5-argument) call site remains byte-identical', () => {
  const body = functionBody(appJs, 'async function runPreferenceAcknowledgmentFinalizationEngine', /\n(async )?function /);
  assert.match(body, /confirmedDisclosureRecord, confirmedRiskCharacteristicFactRecord\)/);
  assert.match(body, /confirmedRiskCharacteristicFactRecord: confirmedRiskCharacteristicFactRecord \|\| null/);
});

// ── js/coachDecisionSystem/internalPipelineOrchestrator.js — the live intake wiring ─────────────

test('wiring: internalPipelineOrchestrator.js requires both RiskCharacteristicInterpreter and RiskCharacteristicIntakeGate, and calls classifyTurnForDurableConstraint()/authorizeNewFact()/authorizeCorrection() live from runDirectTurnPass()', () => {
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  assert.match(orchestratorSrc, /require\('\.\/riskCharacteristicInterpreter\.js'\)/);
  assert.match(orchestratorSrc, /require\('\.\/riskCharacteristicIntakeGate\.js'\)/);
  assert.match(orchestratorSrc, /RiskCharacteristicInterpreter\.classifyTurnForDurableConstraint\(/);
  assert.match(orchestratorSrc, /RiskCharacteristicIntakeGate\.authorizeNewFact\(/);
  assert.match(orchestratorSrc, /RiskCharacteristicIntakeGate\.authorizeCorrection\(/);
});

test('wiring: deferForFinalization is the three-way OR of preferenceAuthorized/disclosureCaptureAuthorized/riskCharacteristicFactCaptureAuthorized — every one of the 7 runDirectTurnPass() return points threads riskCharacteristicFactCaptureAuthorization through', () => {
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  assert.match(orchestratorSrc, /var deferForFinalization = preferenceAuthorized \|\| disclosureCaptureAuthorized \|\| riskCharacteristicFactCaptureAuthorized;/);
  const occurrences = (orchestratorSrc.match(/riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization/g) || []).length;
  assert.equal(occurrences, 7);
});

test('wiring: runPreferenceAcknowledgmentFinalization() reads confirmedRiskCharacteristicFactRecord from ctx.payload and — when a real base decision exists — deliberately does NOT attach it as a secondary (disclosed scope decision; the fact is already durably persisted regardless)', () => {
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  const body = functionBody(orchestratorSrc, 'async function runPreferenceAcknowledgmentFinalization', /\n  \/\/ Direct Stage 6/);
  assert.match(body, /var confirmedRiskCharacteristicFactRecord = payload\.confirmedRiskCharacteristicFactRecord \|\| null;/);
  assert.match(body, /formAcknowledgedRiskCharacteristicFactOutcome\(confirmedRiskCharacteristicFactRecord\)/);
  // The hasRealBase branch attaches confirmedRecord/confirmedDisclosureRecord but never an
  // attach-shaped call for the risk-characteristic-fact record (no such function exists — see
  // decisionFormation.js's own disclosed scope decision).
  assert.equal(/attachSecondaryRiskCharacteristicFactAcknowledgment/.test(orchestratorSrc), false);
});

// ── Phase D.6/Phase E confirmation — no unrelated wiring introduced ─────────────────────────

test('confirmation: no D.6 Candidate/Proposal threading and no Phase E GeneralReasoning activation were introduced by this phase — generalReasoningActivationGate.js/generalReasoningCapability.js/standardProposalContract.js/capabilityRegistry.js remain byte-unmodified', () => {
  // A structural, indirect proof: none of these files reference anything risk-characteristic-fact
  // shaped (they were not touched at all — verified precisely via git diff in the accompanying
  // implementation report; this test guards the same invariant going forward).
  const untouchedFiles = ['generalReasoningActivationGate.js', 'generalReasoningCapability.js', 'standardProposalContract.js', 'capabilityRegistry.js'];
  untouchedFiles.forEach((fileName) => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', fileName), 'utf8');
    assert.equal(/riskCharacteristicFact|RiskCharacteristicFact|ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT/.test(src), false, fileName + ' must remain untouched by Phase D.5');
  });
});

test('confirmation: safetyLayer.js (the D.4 Safety Rule) is untouched by this phase', () => {
  const safetyLayerSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'safetyLayer.js'), 'utf8');
  assert.equal(/persistRiskCharacteristicFactRecord|riskCharacteristicFactContext|ACKNOWLEDGED_RISK_CHARACTERISTIC_FACT/.test(safetyLayerSrc), false);
});
