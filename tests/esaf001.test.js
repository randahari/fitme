// ESAF-001 — Explicit User Statement Arrival Freshness (docs/specs/ESAF_001_SPEC_v1.0.md).
// Covers: the read-path-visibility qualifying filter (esafQualifies), the content-blind arrival
// signal (esafSignalArrival) against the real js/coachDecisionSystem/memoryLayer.js singleton,
// per-user scoping, and a production-backed acceptance vertical proving the real, unmodified
// D2-EF-07 pre-dispatch supersession check (internalPipelineOrchestrator.js) actually withholds
// Expression once a qualifying arrival is recorded after Pipeline Context assembly.
//
// js/memory.js's own D6 transparency-sheet UI handlers (openSheet/renderItem — the actual
// create/edit/reject/delete/consent click handlers) are DOM-coupled closures with no exported
// entry point, matching this file's own pre-existing, already-documented testing boundary
// (tests/memory.test.js's header: "were never designed for Node testing — only its pure
// helpers are exposed"). ESAF-001 does not change that boundary or export those closures (doing
// so would be a redesign beyond the SPEC's "smallest required hook"); this file instead proves,
// against the real production modules, exactly the two units those handlers call
// (esafQualifies/esafSignalArrival) and the real cross-module contract they feed into
// (memoryLayer.js's arrival store -> internalPipelineOrchestrator.js's freshness check).
//
// Run with: node --test tests/esaf001.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Memory = require('../js/memory.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

const { esafQualifies, esafSignalArrival } = Memory._internal;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function configureHappyPath(uid) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [] }),
    getCurrentUser: () => ({ uid: uid }),
    isSessionCurrent: (gen) => gen === 1
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

// ── esafQualifies — the exact USM-001 read-path-visibility filter (SPEC §6/§7) ──────────────

test('ESAF-QUAL-1. a fact/user_stated/active record qualifies', () => {
  assert.equal(esafQualifies({ type: 'fact', source: 'user_stated', status: 'active' }), true);
});

test('ESAF-QUAL-2. a preference/user_stated/active record qualifies', () => {
  assert.equal(esafQualifies({ type: 'preference', source: 'user_stated', status: 'active' }), true);
});

test('ESAF-QUAL-3. a non-fact/preference type (e.g. habit) never qualifies, even if source/status match', () => {
  assert.equal(esafQualifies({ type: 'habit', source: 'user_stated', status: 'active' }), false);
});

test('ESAF-QUAL-4. an inferred/coach_generated/migrated source never qualifies', () => {
  ['inferred_event', 'inferred_pattern', 'coach_generated', 'migrated'].forEach((source) => {
    assert.equal(esafQualifies({ type: 'fact', source: source, status: 'active' }), false, source + ' must not qualify');
  });
});

test('ESAF-QUAL-5. a non-active status (candidate/rejected/superseded/archived) never qualifies', () => {
  ['candidate', 'rejected', 'superseded', 'archived'].forEach((status) => {
    assert.equal(esafQualifies({ type: 'fact', source: 'user_stated', status: status }), false, status + ' must not qualify');
  });
});

test('ESAF-QUAL-6. null/undefined/malformed input never qualifies and never throws', () => {
  assert.equal(esafQualifies(null), false);
  assert.equal(esafQualifies(undefined), false);
  assert.doesNotThrow(() => esafQualifies({}));
  assert.equal(esafQualifies({}), false);
});

// ── esafSignalArrival — content-blind arrival signal against the real MemoryLayer singleton ──

test('ESAF-SIG-1. esafSignalArrival records a fresh arrival timestamp for the current user', () => {
  global.currentUser = { uid: 'esaf-sig-1' };
  try {
    const before = Date.now();
    esafSignalArrival();
    const recorded = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-sig-1' });
    assert.equal(typeof recorded, 'number');
    assert.ok(recorded >= before, 'recorded timestamp must be at/after the call');
  } finally { delete global.currentUser; }
});

test('ESAF-SIG-2. esafSignalArrival is a no-op (never throws) when there is no current user', () => {
  delete global.currentUser;
  assert.doesNotThrow(() => esafSignalArrival());
});

test('ESAF-SIG-3. esafSignalArrival passes only {userId} to the real arrival hook — content-blind (SPEC §9)', () => {
  global.currentUser = { uid: 'esaf-sig-3' };
  const original = MemoryLayer.recordExplicitUserStatementArrival;
  let capturedArg = null;
  MemoryLayer.recordExplicitUserStatementArrival = function (identity) { capturedArg = identity; return original(identity); };
  try {
    esafSignalArrival();
    assert.deepEqual(Object.keys(capturedArg).sort(), ['userId']);
    assert.equal(capturedArg.userId, 'esaf-sig-3');
  } finally {
    MemoryLayer.recordExplicitUserStatementArrival = original;
    delete global.currentUser;
  }
});

// ── User / session scoping (SPEC §10, Review Issue 5) ───────────────────────────────────────

test('ESAF-SCOPE-1. User A\'s arrival does not invalidate User B\'s independent record (16)', () => {
  global.currentUser = { uid: 'esaf-scope-A' };
  esafSignalArrival();
  const aTs = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-scope-A' });
  delete global.currentUser;
  const bTs = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-scope-B' });
  assert.equal(typeof aTs, 'number');
  assert.equal(bTs, null, 'a user who never had a qualifying write must show no arrival at all');
});

test('ESAF-SCOPE-2. latest qualifying arrival is maintained independently per user, never cross-contaminated (17)', async () => {
  global.currentUser = { uid: 'esaf-scope-C' };
  esafSignalArrival();
  const cFirst = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-scope-C' });
  global.currentUser = { uid: 'esaf-scope-D' };
  await sleep(2);
  esafSignalArrival();
  const dTs = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-scope-D' });
  const cAfter = MemoryLayer.getExplicitUserStatementArrivalTimestamp({ userId: 'esaf-scope-C' });
  delete global.currentUser;
  assert.equal(cAfter, cFirst, 'user D\'s later arrival must not move user C\'s own timestamp');
  assert.ok(dTs > cFirst, 'user D\'s independently-recorded arrival must have its own, later timestamp');
});

// ── Production-backed acceptance: the real D2-EF-07 freshness contract end to end ───────────

test('ESAF-E2E-1. NEGATIVE — with no qualifying arrival recorded, a freshly-assembled Decision Pass is never SUPERSEDED (18)', async () => {
  configureHappyPath('esaf-e2e-1');
  const result = await Orchestrator.run({ userId: 'esaf-e2e-1', sessionGeneration: 1, runId: 'run-e2e-1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  assert.notEqual(result.output.expression && result.output.expression.status, 'SUPERSEDED');
});

test('ESAF-E2E-2. POSITIVE — a qualifying arrival recorded after Pipeline Context assembly withholds Expression via the real, unmodified D2-EF-07 check (19, 22)', async () => {
  configureHappyPath('esaf-e2e-2');
  const originalAssemble = MemoryLayer.assembleContext;
  // Simulate the real-world race the SPEC describes: a qualifying authoritative write's arrival
  // signal lands a moment AFTER this Decision's Pipeline Context was assembled, before Expression
  // dispatch — exactly the window js/memory.js's own call sites populate in production. This
  // wraps the REAL assembleContext (no logic stubbed) and only choreographs timing.
  MemoryLayer.assembleContext = async function (identity) {
    const ctx = await originalAssemble(identity);
    await sleep(2);
    MemoryLayer.recordExplicitUserStatementArrival({ userId: identity && identity.userId });
    return ctx;
  };
  try {
    const result = await Orchestrator.run({ userId: 'esaf-e2e-2', sessionGeneration: 1, runId: 'run-e2e-2', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    assert.equal(result.status, 'SUCCESS', 'SPEC §11: orchestrator-level status remains SUCCESS even when Expression is withheld');
    assert.equal(result.output.expression.status, 'SUPERSEDED');
    assert.equal(typeof result.output.terminalDecision, 'object', 'the Decision Pass itself must still be FORMED/completed — only Expression is withheld (SPEC §11)');
  } finally {
    MemoryLayer.assembleContext = originalAssemble;
  }
});

test('ESAF-E2E-3. the SUPERSEDED branch never reaches Expression rendering at all (20)', async () => {
  configureHappyPath('esaf-e2e-3');
  const originalAssemble = MemoryLayer.assembleContext;
  const originalBuildERC = MemoryLayer.buildExpressionRenderingContext;
  let ercCalled = false;
  MemoryLayer.buildExpressionRenderingContext = function () { ercCalled = true; return originalBuildERC.apply(this, arguments); };
  MemoryLayer.assembleContext = async function (identity) {
    const ctx = await originalAssemble(identity);
    await sleep(2);
    MemoryLayer.recordExplicitUserStatementArrival({ userId: identity && identity.userId });
    return ctx;
  };
  try {
    const result = await Orchestrator.run({ userId: 'esaf-e2e-3', sessionGeneration: 1, runId: 'run-e2e-3', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    assert.equal(result.output.expression.status, 'SUPERSEDED');
    assert.equal(ercCalled, false, 'buildExpressionRenderingContext must never be invoked once superseded — Expression withholds by never being reached');
  } finally {
    MemoryLayer.assembleContext = originalAssemble;
    MemoryLayer.buildExpressionRenderingContext = originalBuildERC;
  }
});

test('ESAF-E2E-4. no retry/reassembly occurs — a single run() performs exactly one context assembly, and back-to-back runs never reuse a stale context (21, 23)', async () => {
  configureHappyPath('esaf-e2e-4');
  const originalAssemble = MemoryLayer.assembleContext;
  let assembleCalls = 0;
  MemoryLayer.assembleContext = async function (identity) { assembleCalls++; return originalAssemble(identity); };
  try {
    const r1 = await Orchestrator.run({ userId: 'esaf-e2e-4', sessionGeneration: 1, runId: 'run-e2e-4a', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    assert.equal(assembleCalls, 1, 'run() must assemble exactly once per call — no internal retry loop');
    await sleep(2);
    const r2 = await Orchestrator.run({ userId: 'esaf-e2e-4', sessionGeneration: 1, runId: 'run-e2e-4b', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
    assert.equal(assembleCalls, 2, 'a second, independent run() must assemble fresh again, not reuse the first');
    assert.ok(r2.output.pipelineContext.assembledAt >= r1.output.pipelineContext.assembledAt, 'the later run must carry a later (or equal-tick) assembledAt, never a cached/stale one');
  } finally {
    MemoryLayer.assembleContext = originalAssemble;
  }
});

test('ESAF-E2E-5. the freshness mechanism produces no new Domain/Topic/Trust/Relationship-Maturity signal — Pipeline Context shape is unchanged (25, 26, 27)', async () => {
  configureHappyPath('esaf-e2e-5');
  const result = await Orchestrator.run({ userId: 'esaf-e2e-5', sessionGeneration: 1, runId: 'run-e2e-5', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  const pc = result.output.pipelineContext;
  assert.deepEqual(pc.relationshipMaturity, { stage: 'UNKNOWN', basis: null }, 'unchanged — no Relationship Maturity signal is produced by ESAF-001');
  assert.equal(pc.lifeEventContext, null);
  assert.ok(!Object.prototype.hasOwnProperty.call(pc, 'domain'));
  assert.ok(!Object.prototype.hasOwnProperty.call(pc, 'topic'));
  assert.ok(!Object.prototype.hasOwnProperty.call(pc, 'trust'));
});
