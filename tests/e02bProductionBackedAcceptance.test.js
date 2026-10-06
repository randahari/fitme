// WP0 Phase E.0.2b — Production-Backed Acceptance
// (docs/specs/WP0_PHASE_E_0_2B_SEMANTIC_CONTEXT_DISCOVERY_SPEC_v1.0.md §20, §22, §26 AC-23/AC-25/AC-26).
// Runs the real DIRECT_TURN_PASS chain (internalPipelineOrchestrator.run) through a harness that is
// byte-identical to tests/ou001ProductionBackedAcceptance.test.js's makeHarness(): the function is
// extracted from that file's own source at run time, so the two can never drift apart. Semantic
// Context Discovery is counted separately (the harness predates it): its stub is configured before
// every run, and the harness's own resetAll() never touches it.
// Run with: node --test tests/e02bProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const req = (p) => require(path.join(__dirname, '..', p));

function loadOu001Harness() {
  const src = fs.readFileSync(path.join(__dirname, 'ou001ProductionBackedAcceptance.test.js'), 'utf8');
  const start = src.indexOf('function makeHarness(req) {');
  const endMarker = '  return { runScenario, closedEntry, CALL_COUNT_SCENARIOS, FIXED_SUBMITTED_AT, resetAll };\n}';
  const end = src.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'OU-001 makeHarness() located');
  const body = src.slice(start, end + endMarker.length);
  // eslint-disable-next-line no-new-func
  return new Function('req', body + '\nreturn makeHarness(req);')(req);
}

const H = loadOu001Harness();
const Discovery = req('js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js');
const TrrCapabilityAdapter = req('js/coachDecisionSystem/trrCapabilityAdapter.js');
const GeneralReasoningCapability = req('js/coachDecisionSystem/generalReasoningCapability.js');
const SafetyLayer = req('js/coachDecisionSystem/safetyLayer.js');

test.before(() => { TrrCapabilityAdapter.registerAll(); GeneralReasoningCapability.registerAll(); });
test.afterEach(() => { H.resetAll(); Discovery.configure({ callClaude: null }); });

// Pinned on baseline commit 21f15de by OU-001 (tests/ou001ProductionBackedAcceptance.test.js), re-pinned here.
const PINNED_CALL_COUNTS = {
  DUC_TRR_ROUTED_REQUEST: { total: 9, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 2, TRR_REASONING: 1, EXPRESSION: 1 } },
  DUC_UNSUPPORTED_REQUEST: { total: 6, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, RISK_CHARACTERISTIC: 1, EXPRESSION: 1 } },
  CPI_PREFERENCE_STATEMENT: { total: 6, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 1 } },
  ITEM6_STATE_DISCLOSURE: { total: 7, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, SAFETY_CONTEXT: 1, RISK_CHARACTERISTIC: 1, EXPRESSION: 1 } },
  CASUAL_NO_REQUEST: { total: 5, byComponent: { EXPLICIT_REQUEST: 1, READINESS_STATE: 1, TURN_UNDERSTANDING: 1, EXPLICIT_PREFERENCE: 1, RISK_CHARACTERISTIC: 1 } }
};
const PINNED_TRR_BODY_SHA256 = 'af3763893eee88d13f7b1256de297b3d942e45ae4d80d7cdf5efc50fa6c8fdd5';
// Recorded on the unmodified `ad6203c` working tree before any E.0.2b production change.
const PINNED_TRR_REASONING_CONTEXT_SHA256 = '276369d30ca0fbd7920ab837d79d0d197d3f5ad57ec96a490cfdbaf9cd040a20';

const MARKER = 'E02B-DISCOVERY-MARKER-9c1d';
function withOpen(scn) {
  return Object.assign({}, scn, { openSegment: JSON.stringify({ id: scn.turnId, summary: 'The user communicates something (' + scn.name + ').', mentions: [scn.text.split(/\s+/)[0]] }) });
}
function countedDiscovery(counter) {
  Discovery.configure({ callClaude: async () => { counter.calls++; return { content: [{ type: 'text', text: JSON.stringify({ selectedIds: ['goalObjectiveContext'], informationNeeds: [MARKER] }) }] }; } });
}
async function withFixedNow(fn) {
  const orig = Date.now;
  Date.now = () => H.FIXED_SUBMITTED_AT;
  try { return await fn(); } finally { Date.now = orig; }
}
function spy(obj, name, sink) {
  const original = obj[name];
  obj[name] = function () { sink.push(Array.prototype.slice.call(arguments)); return original.apply(this, arguments); };
  return () => { obj[name] = original; };
}

// ═══ AC-23 — production model-call counts, TRR hash, TRR reasoning context ═══
test('AC-23: per-scenario model-call counts equal the pinned baseline (with and without an open segment); Semantic Context Discovery is never called in production traffic', async () => {
  for (const scn of H.CALL_COUNT_SCENARIOS) {
    for (const variant of [scn, withOpen(scn)]) {
      const discovery = { calls: 0 };
      countedDiscovery(discovery);
      const { counts } = await H.runScenario(variant);
      assert.equal(counts.total, PINNED_CALL_COUNTS[scn.name].total, scn.name + ' total');
      assert.deepEqual(counts.byComponent, PINNED_CALL_COUNTS[scn.name].byComponent, scn.name + ' by component');
      assert.equal(counts.byComponent.GENERAL_REASONING, undefined);
      assert.equal(discovery.calls, 0, scn.name + ': SEMANTIC_CONTEXT_DISCOVERY must never be called');
    }
  }
});

test('AC-23: the TRR reasoning request body is byte-identical to the pinned baseline, with and without an OpenUnderstanding, with discovery configured', async () => {
  for (const variant of [H.CALL_COUNT_SCENARIOS[0], withOpen(H.CALL_COUNT_SCENARIOS[0])]) {
    countedDiscovery({ calls: 0 });
    const captured = Object.assign({}, variant, { captures: {} });
    await H.runScenario(captured);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(captured.captures.TRR_REASONING)).digest('hex'), PINNED_TRR_BODY_SHA256);
  }
});

test('AC-23: TrrCapabilityAdapter.buildReasoningContext() output is byte-identical to its pre-implementation value', async () => {
  const ids = ['readinessStateContext', 'userSafetyContext', 'userSafetyProvenance', 'explicitRequestControls', 'activityPreference', 'recentConversationContext', 'currentStateContext', 'goalObjectiveContext'];
  const pc = { availability: {} };
  ids.forEach((id, i) => { pc[id] = { marker: id, n: i }; pc.availability[id] = 'AVAILABLE'; });
  const ctx = await TrrCapabilityAdapter.buildReasoningContext(pc, { contextualMeaning: { basis: { observation: 'o' } }, validReasonCategory: 'ADAPT_TO_CURRENT_STATE' }, { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } });
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(ctx)).digest('hex'), PINNED_TRR_REASONING_CONTEXT_SHA256);
});

// ═══ AC-25 — unreachable from live traffic ═══
test('AC-25: with the interpreter configured to emit a unique marker, no DIRECT_TURN_PASS result contains it', async () => {
  for (const scn of H.CALL_COUNT_SCENARIOS) {
    const discovery = { calls: 0 };
    countedDiscovery(discovery);
    const { result } = await H.runScenario(withOpen(scn));
    assert.equal(result.status, 'SUCCESS', scn.name);
    assert.equal(JSON.stringify(result).indexOf(MARKER), -1, scn.name + ': discovery output leaked into the engine result');
    assert.equal(discovery.calls, 0);
  }
});

// ═══ AC-26 — Safety independence ═══
test('AC-26: every Safety input is identical with the discovery interpreter configured and unconfigured', async () => {
  for (const scn of [H.CALL_COUNT_SCENARIOS[0], H.CALL_COUNT_SCENARIOS[3]]) {
    const observed = [];
    for (const configured of [false, true]) {
      if (configured) countedDiscovery({ calls: 0 }); else Discovery.configure({ callClaude: null });
      const calls = [];
      const restore = [spy(SafetyLayer, 'detectSafetyOpportunities', calls), spy(SafetyLayer, 'disqualify', calls), spy(SafetyLayer, 'finalReview', calls)];
      const captured = Object.assign({}, withOpen(scn), { captures: {} });
      try { await withFixedNow(() => H.runScenario(captured)); } finally { restore.forEach((r) => r()); }
      observed.push({
        safetyLayer: JSON.stringify(calls),
        safetyContext: JSON.stringify(captured.captures.SAFETY_CONTEXT || []),
        risk: JSON.stringify(captured.captures.RISK_CHARACTERISTIC || [])
      });
    }
    assert.ok(observed[0].safetyLayer.length > 2, scn.name + ': sanity — SafetyLayer was exercised');
    assert.deepEqual(observed[1], observed[0], scn.name);
    assert.equal(observed[1].safetyLayer.indexOf(MARKER), -1);
  }
});
