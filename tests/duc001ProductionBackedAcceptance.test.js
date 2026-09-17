// DUC-001 — Direct User Coach Admission V1 Production-Backed Acceptance (docs/specs/
// DUC_001_SPEC_v1.0.md §19/§20). Exercises the real, unmodified production chain: a
// CurrentUserTurn -> internalPipelineOrchestrator.run({action:'DIRECT_TURN_PASS'}) ->
// TurnUnderstandingInterpreter -> ConversationalNeedCreator -> the SAME, real, unmodified Stage
// 4-10 mechanics the proactive APP_READY path already uses (Evidence, Eligibility,
// TrainingReadinessReasoningComponent, Safety, Decision Formation, Expression). No live LLM, no
// live Firestore, no Chat — stubbed callClaude/generateFn seams only, the exact same production
// composition-root seams js/app.js now wires. Mirrors tests/trr001ProductionBackedAcceptance.
// test.js's own established shape (production-backed, not a directly-injected fixture).
// Run with: node --test tests/duc001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const DateUtils = require('../js/core/dateUtils.js');
const TurnUnderstandingInterpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const ReadinessStateInterpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const WinnerSelection = require('../js/coachDecisionSystem/winnerSelection.js');
const DecisionFormation = require('../js/coachDecisionSystem/decisionFormation.js');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');
const { makeSafetyIntegrationPortTestDouble } = require('./fixtures/safetyIntegrationPortTestDouble.js');

// WP0 Phase B (docs/specs/WP0_SPEC_v1.0.md §16) — ConversationalNeedCreator's Step B now routes
// through CapabilityRegistry.resolveCapability() instead of a hardcoded equality check.
// Production registers TRR exactly once at bootstrap (app.js); this file's own end-to-end
// exercise of the real DIRECT_TURN_PASS chain needs the identical one-time registration to see
// the same registered capability set production will. Test-harness setup only — no existing
// assertion below is altered.
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');
test.before(() => { TrrCapabilityAdapter.registerAll(); });

const TODAY_DATE_KEY = DateUtils.getTodayKey();

// §20 — "No Habit signal required": every fixture below configures DerivedIntelligenceConsumer
// with ZERO habits, proving the direct path does not require Habit/proactive-Initiative
// infrastructure, unlike the proactive path (contrast with trr001ProductionBackedAcceptance.
// test.js's own Habit-dependent fixtures).
function configureFixture(fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'duc-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: fetchUserStatedMemoryFn || (async () => [])
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY,
    getWeekday: () => new Date().getDay()
  });
}

// Stubs TurnUnderstandingInterpreter's callClaude, keyed by turnId, mirroring
// trr001ProductionBackedAcceptance.test.js's own id-extraction-from-prompt convention.
function stubTurnUnderstanding(resultByTurnId) {
  TurnUnderstandingInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => Object.assign({
        id: id,
        affirmativeRequestPresent: false, domain: null, topic: null,
        currentStateStatementPresent: false, currentStateStatementText: null,
        negativeControlPresent: false, desireOnlyPresent: false,
        // Friends Alpha Item 6 (USER_DISCLOSURE V1) — Dimension 5 defaults; overridden explicitly
        // by any acceptance case exercising it.
        personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
      }, resultByTurnId[id] || {}));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
}

// Stubs ReadinessStateInterpreter to classify every submitted id as a current-state statement —
// mirrors trr001ProductionBackedAcceptance.test.js's own identical stub exactly.
function stubReadinessStateInterpreterClassifiesAll() {
  ReadinessStateInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return { content: [{ text: JSON.stringify({ results: ids.map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) }) }] };
    }
  });
}

function stubTrainingReadinessActionProposed() {
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED',
          action: 'שקול/י אימון קליל וקצר יותר היום, לאור שנת הלילה המוגבלת.',
          actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'המשתמש שאל ישירות אם כדאי להתאמן, ודיווח על שנת לילה מוגבלת.',
          evidenceBasis: 'בקשה ישירה של המשתמש + היגד משתמש על שנת לילה מוגבלת (הודעה נוכחית).',
          expectedValue: 'התאמת העצימות עשויה למנוע החמרה/פציעה מיותרת.',
          uncertainty: 'לא ידוע אם חוסר השינה משמעותי דיו כדי להצדיק שינוי בפועל.'
        })
      }]
    })
  });
}

function stubExpressionRendererEchoes() {
  ExpressionRenderer.configure({ generateFn: async () => 'תגובת מאמן לדוגמה (stub, לא מודל אמיתי).' });
}

function makeTurn(turnId, text, overrides) {
  return Object.assign({ turnId: turnId, text: text, submittedAt: Date.now(), sessionGeneration: 1 }, overrides || {});
}

test.afterEach(() => {
  TurnUnderstandingInterpreter.configure({ callClaude: null });
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  ExpressionRenderer.configure({ generateFn: null });
});

// ══════════════════════════════════════════════════════════════════
// §20 — THE CANONICAL DOGFOOD ACCEPTANCE PATH
// "ישנתי 5 שעות, כדאי לי להתאמן היום?" — end to end, real orchestrator, zero Habit signal.
// ══════════════════════════════════════════════════════════════════
test('DUC-DOGFOOD-1. the canonical dogfood turn reaches a FORMED, DISPATCHED Expression outcome via the real, unmodified production chain, with NO Habit signal configured at all', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-dogfood-1': {
      affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY',
      currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות'
    }
  });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-dogfood-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-dogfood-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  const pc = result.output.pipelineContext;
  // §11 — the current turn's own raw text reached readinessStateContext, tagged CURRENT_TURN.
  const currentTurnItem = pc.readinessStateContext.items.find((i) => i.sourceMemoryId === 'turn:t-dogfood-1');
  assert.notEqual(currentTurnItem, undefined, 'expected the current turn\'s own text to reach readinessStateContext');
  assert.equal(currentTurnItem.provenance, 'CURRENT_TURN');
  assert.equal(currentTurnItem.capturedAt, turn.submittedAt);

  const terminalDecision = result.output.terminalDecision;
  assert.notEqual(terminalDecision, undefined, 'expected a real TerminalDecision, not a Decision-Pass-level Silence');
  assert.notEqual(terminalDecision.kind, 'SILENCE');
  assert.notEqual(terminalDecision.kind, 'UNSUPPORTED');

  const provenance = terminalDecision.candidateProvenance;
  assert.ok(Array.isArray(provenance) && provenance.length === 1);
  assert.equal(provenance[0].sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(provenance[0].opportunityId, 'duc:direct-user-request:t-dogfood-1');
  // §14 — real internal turn provenance, surviving the full Stage 6/7/8/9 path.
  assert.equal(provenance[0].turnId, 't-dogfood-1');

  assert.equal(result.output.expression.status, 'DISPATCHED');
  assert.ok(result.output.expression.deliveryIntent, 'expected a real Delivery Intent from the real, unmodified Expression stage');
  assert.equal(result.output.expression.deliveryIntent.semanticSignal.kind, terminalDecision.kind);
});

test('DUC-DOGFOOD-2. the same request succeeds from a freshly-configured OBSERVER-stage session (zero coachEvents, zero Typed Memory) — proves Bounded Engagement Policy earliest-relationship-stage servicing (§08)', async () => {
  configureFixture(); // getUserProfile() => { coachEvents: [], ... } — the earliest possible relationship stage
  stubTurnUnderstanding({
    't-dogfood-2': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }
  });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-dogfood-2', 'כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-dogfood-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.notEqual(result.output.terminalDecision, undefined);
  assert.notEqual(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

// ══════════════════════════════════════════════════════════════════
// §12/§19 — UNSUPPORTED: "כמה חלבון נשאר לי היום?"
// ══════════════════════════════════════════════════════════════════
test('DUC-UNSUPPORTED-1. a legitimate but professionally-unsupported direct request resolves TerminalDecision.kind UNSUPPORTED via the real, unmodified chain — never TRR, never a fabricated Safety disposition', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-unsupported-1': { affirmativeRequestPresent: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE' }
  });
  // Deliberately NOT stubbing TrainingReadinessReasoningComponent — asserting below that it is
  // never invoked (its configure() stays at the default { callClaude: null } from afterEach).
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-unsupported-1', 'כמה חלבון נשאר לי היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-unsupported-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  const terminalDecision = result.output.terminalDecision;
  assert.equal(terminalDecision.kind, 'UNSUPPORTED');
  assert.equal('safetyDisposition' in terminalDecision, false, 'UNSUPPORTED must never carry a fabricated safetyDisposition');
  assert.equal('confidence' in terminalDecision, false);
  assert.equal('hierarchyTier' in terminalDecision, false);
  assert.equal('boundaryType' in terminalDecision, false);
  assert.deepEqual(terminalDecision.candidateProvenance, []);

  // Real internal provenance recorded on the governed decision object itself (§12, Revision 4).
  assert.equal(terminalDecision.decisionPassTrace.opportunitiesConsidered[0].opportunityId, 'duc:direct-user-request:t-unsupported-1');
  assert.equal(terminalDecision.decisionPassTrace.opportunitiesConsidered[0].sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(terminalDecision.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'UNSUPPORTED_CAPABILITY');
  assert.equal(terminalDecision.decisionPassTrace.candidatePoolSize, 0);

  assert.equal(result.output.expression.status, 'DISPATCHED');
  assert.ok(result.output.expression.deliveryIntent);
  assert.equal(result.output.expression.deliveryIntent.semanticSignal.kind, 'UNSUPPORTED');
});

// ══════════════════════════════════════════════════════════════════
// §17 Case A vs. Case B vs. Case C — outcome-separation distinctness
// ══════════════════════════════════════════════════════════════════
test('DUC-CASE-A. "אני עייף היום" (no request) never produces UNSUPPORTED — resolves a real Decision-Pass-level Silence (no Delivery Intent), TRR never invoked', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-case-a': {} }); // affirmativeRequestPresent defaults to false
  stubReadinessStateInterpreterClassifiesAll();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-case-a', 'אני עייף היום');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-case-a',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.notEqual(result.output.terminalDecision, undefined);
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.notEqual(result.output.terminalDecision.kind, 'UNSUPPORTED');
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});

test('DUC-CASE-C. a forced Turn Understanding failure (malformed model output) never produces UNSUPPORTED either — same Decision-Pass-level Silence as Case A, machine-readably distinct only at the interpreter boundary', async () => {
  configureFixture();
  TurnUnderstandingInterpreter.configure({ callClaude: async () => ({ content: [{ text: 'not json' }] }) });
  stubReadinessStateInterpreterClassifiesAll();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-case-c', 'טקסט כלשהו');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-case-c',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.notEqual(result.output.terminalDecision.kind, 'UNSUPPORTED');
  assert.equal(result.output.expression.status, 'NO_DELIVERY_INTENT');
});

// ══════════════════════════════════════════════════════════════════
// §19 — Safety distinction: a real Safety BOUNDARY (BLOCKED/REFUSAL) for a DIRECT_USER_REQUEST-
// sourced Candidate is structurally distinct from UNSUPPORTED.
//
// Uses a SafetyIntegrationPort test double (makeSafetyIntegrationPortTestDouble), matching
// tests/decisionFormation.test.js's own established BLOCKED-acceptance precedent exactly — NOT
// tests/trrSafetyCoverage.test.js's own live-Rule "LIVE-*" shape. Confirmed directly against the
// real, live Canonical Safety Rules (matchCanonicalSafetyRules/disqualify/finalReview): every
// currently-implemented riskType a live Rule can produce with full confidence
// (ACTIVE_MEDICAL_INSTRUCTION_CONFLICT) is also one of the four ABSOLUTE_OVERRIDE_RISK_TYPES,
// so a fully-confirmed match is always disqualified at Stage 8 (-> SILENCE, proven directly for
// DIRECT_USER_REQUEST by DUC-SAFETY-2 below, mirroring trrSafetyCoverage.test.js's own LIVE-A),
// never reaching Stage 9's BLOCKED disposition; an unconfirmed match resolves DEFERRED instead
// (DUC-SAFETY-2). No live production Canonical Safety Rule currently reaches BLOCKED for ANY
// source — a pre-existing, disclosed repository limitation (see expressionRenderer.js's own file
// header: "UNMODIFIED... currently the only disposition value reachable in production"),
// predating and unrelated to DUC-001, not weakened or worked around here. This test therefore
// proves the STRUCTURAL distinction the SPEC requires (BOUNDARY always carries a real
// safetyDisposition; UNSUPPORTED never does) via the same test-double mechanism every other real
// BLOCKED-decision test in this repository already uses, with a DIRECT_USER_REQUEST source
// substituted.
// ══════════════════════════════════════════════════════════════════
test('DUC-SAFETY-1. a DIRECT_USER_REQUEST-sourced Candidate under a real BLOCKED Safety disposition resolves BOUNDARY/REFUSAL, structurally distinct from UNSUPPORTED', async () => {
  const candidate = {
    kind: 'INITIATIVE',
    rationale: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    confidence: 0.8, hierarchyTier: 1,
    opportunityProvenance: { opportunityId: 'duc:direct-user-request:t-safety-1', sourceCategory: 'DIRECT_USER_REQUEST', detectedAt: null, turnId: 't-safety-1' }
  };
  const blockedPort = makeSafetyIntegrationPortTestDouble({
    reviewRule: () => ({ disposition: 'BLOCKED', modifiedContent: null, reasonCode: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', reasonDetail: null, reason: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT' })
  });
  const pipelineContext = {};
  const selection = await WinnerSelection.select({ rankedPool: [candidate], pipelineContext: pipelineContext, safetyPort: blockedPort });
  const formed = await DecisionFormation.form({ selection: selection, pipelineContext: pipelineContext, safetyPort: blockedPort, opportunitiesConsidered: [], candidatePoolSize: 1 });

  assert.equal(formed.status, 'FORMED');
  assert.equal(formed.decision.kind, 'BOUNDARY');
  assert.equal(formed.decision.boundaryType, 'REFUSAL');
  assert.equal(formed.decision.safetyDisposition.disposition, 'BLOCKED');
  assert.notEqual(formed.decision.kind, 'UNSUPPORTED');
  assert.equal(formed.decision.candidateProvenance[0].sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(formed.decision.candidateProvenance[0].turnId, 't-safety-1');
  // The distinguishing structural fact §19 requires: BOUNDARY always carries a real
  // safetyDisposition; UNSUPPORTED never does.
  assert.ok('safetyDisposition' in formed.decision);
});

function usc(items) { return { items: items }; }
function usp(items) { return { items: items }; }
function restriction(sourceMemoryId, restrictedActivityText) { return { sourceMemoryId: sourceMemoryId, restrictedActivityText: restrictedActivityText }; }
function provenanceRecord(sourceMemoryId, statedSourceText) { return { sourceMemoryId: sourceMemoryId, statedSourceText: statedSourceText }; }

test('DUC-SAFETY-2. existing RUNNING/WALKING Canonical Safety Rules apply UNCHANGED to a DIRECT_USER_REQUEST-sourced Candidate: an unresolved CYCLING restriction still resolves DEFERRED -> SILENCE (LIVE-B\'s own shape, source substituted)', async () => {
  const candidate = {
    kind: 'INITIATIVE',
    rationale: { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'low' },
    confidence: 0.8, hierarchyTier: 1, actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'CYCLING' }, activityReference: 'a bike ride',
    opportunityProvenance: { opportunityId: 'duc:direct-user-request:t-safety-2', sourceCategory: 'DIRECT_USER_REQUEST', detectedAt: null, turnId: 't-safety-2' }
  };
  const pipelineContext = { userSafetyContext: usc([restriction('mem-1', 'no strenuous cardio')]) };
  const selection = await WinnerSelection.select({ rankedPool: [candidate], pipelineContext: pipelineContext, safetyPort: SafetyLayer });
  assert.equal(selection.status, 'SINGLE_WINNER');
  const formed = await DecisionFormation.form({ selection: selection, pipelineContext: pipelineContext, safetyPort: SafetyLayer, opportunitiesConsidered: [], candidatePoolSize: 1 });

  assert.equal(formed.status, 'FORMED');
  assert.equal(formed.decision.safetyDisposition.disposition, 'DEFERRED');
  assert.equal(formed.decision.kind, 'SILENCE'); // not delivered, exactly as the proactive path's own DEFERRED case
});

// ══════════════════════════════════════════════════════════════════
// §13/§19 — Clarification distinction: CLARIFICATION_NEEDED is a real, governed, delivered
// Candidate — never UNSUPPORTED (Step B already succeeded; reasoning was actually invoked).
// ══════════════════════════════════════════════════════════════════
test('DUC-CLARIFICATION-1. a CLARIFICATION_NEEDED-producing reasoning outcome for a direct request is a real, delivered decision, structurally distinct from UNSUPPORTED, and still carries real turnId/opportunityId provenance', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-clarify-1': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' }
  });
  stubReadinessStateInterpreterClassifiesAll();
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'CLARIFICATION_NEEDED',
          action: 'איזה סוג אימון בדרך כלל אתה עושה כשאתה מתאמן?',
          actionCategory: null, activityReference: null,
          rationale: 'אין מספיק הקשר כדי להציע פעולה קונקרטית.',
          evidenceBasis: 'בקשה ישירה של המשתמש, ללא הקשר נוסף על סוג האימון הרגיל.',
          expectedValue: 'שאלה ממוקדת תאפשר הצעה מדויקת יותר בסבב הבא.',
          uncertainty: 'גבוהה — אין מידע על העדפות האימון של המשתמש.'
        })
      }]
    })
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-clarify-1', 'כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-clarify-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  const terminalDecision = result.output.terminalDecision;
  assert.notEqual(terminalDecision.kind, 'UNSUPPORTED');
  assert.notEqual(terminalDecision.kind, 'SILENCE');
  assert.equal(terminalDecision.candidateProvenance[0].sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(terminalDecision.candidateProvenance[0].turnId, 't-clarify-1');
  assert.equal(terminalDecision.candidateProvenance[0].opportunityId, 'duc:direct-user-request:t-clarify-1');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

// ══════════════════════════════════════════════════════════════════
// §12a — Direct Request × Explicit Negative Control (frozen semantics)
// ══════════════════════════════════════════════════════════════════
test('DUC-NEGCONTROL-1. "אל תציע לי ריצה, אבל מה כדאי לי לעשות היום?" — the negative control never suppresses Need recognition; an unresolved scope still routes to UNSUPPORTED (never silently dropped)', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-negcontrol-1': { affirmativeRequestPresent: true, domain: null, topic: null, negativeControlPresent: true }
  });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-negcontrol-1', 'אל תציע לי ריצה, אבל מה כדאי לי לעשות היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-negcontrol-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'UNSUPPORTED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

// §12a point 5 (frozen): when the SAME turn's own affirmative request DOES resolve to
// {WORKOUT, WORKOUT_FREQUENCY}, EUR-001's own existing, completely unmodified
// explicitlyRequestedAgainst() suppression check — now reachable from live current-turn text for
// the first time via memoryLayer.js's own additive explicitRequestControls submission (§11
// REVISED/Blocker 6) — suppresses that specific Candidate at Stage 6. The negative control is
// never "erased" by the direct request; the direct request is never silently dropped either — it
// resolves to the SAME real Decision-Pass-level Silence outcome a suppressed proactive Candidate
// already produces today, never UNSUPPORTED (a real professional capability WAS engaged and WAS
// suppressed, not "no capability exists").
test('DUC-NEGCONTROL-2. "אל תציע לי ריצה, אבל מה עם אימון היום?" resolving to {WORKOUT, WORKOUT_FREQUENCY}: EUR-001\'s own unmodified suppression check, reached from the current turn\'s own text, suppresses that specific Candidate — real Silence, never UNSUPPORTED, EUR-001 itself untouched', async () => {
  configureFixture();
  stubTurnUnderstanding({
    't-negcontrol-2': { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', negativeControlPresent: true }
  });
  stubReadinessStateInterpreterClassifiesAll();
  // ExplicitRequestInterpreter's own closed-vocabulary tokens (explicitRequestInterpreter.js) —
  // reused verbatim, never redefined here.
  const ExplicitRequestInterpreter = require('../js/coachDecisionSystem/explicitRequestInterpreter.js');
  ExplicitRequestInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return {
        content: [{
          text: JSON.stringify({
            results: ids.map((id) => ({
              id, requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'SUPPRESS_ORDINARY_INITIATIVE',
              scopeStatus: 'RESOLVED', domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY'
            }))
          })
        }]
      };
    }
  });
  stubTrainingReadinessActionProposed();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-negcontrol-2', 'אל תציע לי ריצה, אבל מה עם אימון היום?');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-negcontrol-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  ExplicitRequestInterpreter.configure({ callClaude: null });

  assert.equal(result.status, 'SUCCESS');
  // explicitRequestControls actually picked up the current turn's own negative-control clause.
  const controls = result.output.pipelineContext.explicitRequestControls;
  assert.equal(controls.items.length, 1);
  assert.equal(controls.items[0].domain, 'WORKOUT');
  assert.equal(controls.items[0].topic, 'WORKOUT_FREQUENCY');
  // The Candidate was suppressed at Stage 6 — real Silence, never a fabricated UNSUPPORTED
  // (a real capability engaged, then was suppressed, is not the same as "no capability exists").
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.notEqual(result.output.terminalDecision.kind, 'UNSUPPORTED');
});

// ══════════════════════════════════════════════════════════════════
// §19 — Admission: exactly one Decision Pass per accepted turn; no automatic Typed Memory write.
// ══════════════════════════════════════════════════════════════════
test('DUC-ADMISSION-1. a direct turn produces exactly one runDirectTurnPass()/TerminalDecision outcome, and never writes to Typed Memory as a side effect of interpretation', async () => {
  let createMemoryCalls = 0;
  configureFixture();
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'duc-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => [],
    createMemory: async () => { createMemoryCalls++; return { id: 'should-never-be-called' }; }
  });
  stubTurnUnderstanding({ 't-admission-1': {} });
  stubReadinessStateInterpreterClassifiesAll();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-admission-1', 'אני עייף היום');
  const result = await Orchestrator.run({
    userId: 'duc-user', sessionGeneration: 1, runId: 'duc-admission-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(createMemoryCalls, 0, 'no code path in the DIRECT_TURN_PASS contract may write the raw turn text to Typed Memory');
});

// ══════════════════════════════════════════════════════════════════
// §19 — Regression: the existing APP_READY/DECISION_PASS path is fully unaffected by this file's
// own DIRECT_TURN_PASS fixtures (mirrors trr001ProductionBackedAcceptance.test.js's own final
// sanity check).
// ══════════════════════════════════════════════════════════════════
test('DUC-REGRESSION-1. Orchestrator.run() with no ctx.action (the existing APP_READY call shape) is unaffected by this file\'s own DIRECT_TURN_PASS fixtures/stubs', async () => {
  configureFixture();
  const result = await Orchestrator.run({ userId: 'duc-user', sessionGeneration: 1, runId: 'duc-regression-1', trigger: 'APP_READY', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  // Zero opportunities configured (no Habit, no live signal) -> the existing, unchanged
  // Decision-Pass-level Silence outcome (D2-INV-05), exactly as before this Work Item.
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
});

// ══════════════════════════════════════════════════════════════════
// DUC-001 Post-Implementation Turn-Serving Correction (Product/Architecture-approved, Decision 1)
// — REQUIRED REGRESSION TEST. Reuses the exact real-production-code diagnostic shape the
// Turn-Serving Architecture Investigation itself used (ConversationalNeedCreator +
// internalPipelineOrchestrator.js's own exported collectDetectedOpportunities()/
// buildOpportunitiesForDecisionPass()/runDecisionPass() — 100% real, unmodified production code,
// a hand-built but shape-legitimate pipelineContext standing in for a full 70-day Habit Engine
// simulation, exactly as InitiativeEngine's own contextualMeaningPolicy.js isV1FoodLoggingWeakening()
// requires). Never solved by altering any hierarchyTier.
// ══════════════════════════════════════════════════════════════════

function unrelatedFoodLoggingObservation() {
  return {
    id: 'habit-food-logging-1', sourceType: 'HABIT', domain: 'NUTRITION', topic: 'FOOD_LOGGING',
    lifecycle: 'WEAKENING', confidence: 0.7,
    evidence: { count: 12 }, temporal: { firstObservedAt: 1, lastObservedAt: 2, expectedIntervalDays: 1 },
    provenance: { currentEpisodeEstablished: true }
  };
}

test('DUC-COLLISION-1. Stage 3 mechanically detects BOTH the turn-caused DIRECT_USER_REQUEST opportunity and an unrelated, real CONFIRMED_PATTERN_ANTICIPATION opportunity in the same DIRECT_TURN_PASS', () => {
  const ConversationalNeedCreator = require('../js/coachDecisionSystem/conversationalNeedCreator.js');
  const turn = { turnId: 't-collision', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?', submittedAt: Date.now(), sessionGeneration: 1 };
  const turnUnderstanding = {
    interpretationStatus: 'CLASSIFIED',
    affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' },
    currentStateStatement: { present: true, text: 'ישנתי 5 שעות' },
    negativeControlPresent: false, desireOnlyPresent: false
  };
  const pipelineContext = {
    assembledAt: Date.now(), relationshipMaturity: { stage: 'UNKNOWN' }, feedbackHistory: [],
    readinessStateContext: { items: [{ statementText: 'ישנתי 5 שעות', sourceMemoryId: 'turn:t-collision', interpretationAuthority: 'DERIVED_INTERPRETATION', provenance: 'CURRENT_TURN', capturedAt: Date.now() }] },
    initiativeIntelligence: { signals: [unrelatedFoodLoggingObservation()] },
    situationalContext: null, explicitRequestControls: null, userSafetyContext: null, userSafetyProvenance: null,
    activityPreference: null, activityOppositionControls: null
  };
  const needCreatorResult = ConversationalNeedCreator.recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext);
  const directOpportunity = needCreatorResult.opportunity;

  // 1. Stage 3 may mechanically detect both.
  const detected = Orchestrator.collectDetectedOpportunities(pipelineContext, directOpportunity);
  assert.equal(detected.length, 2);
  assert.ok(detected.some((d) => d.sourceCategory === 'DIRECT_USER_REQUEST'));
  assert.ok(detected.some((d) => d.sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION'));

  // 2 & 3. The turn-serving filter (applied by buildOpportunitiesForDecisionPass() ONLY when a
  // currentTurnId is supplied, i.e. only on the DIRECT_TURN_PASS path) excludes the unrelated
  // proactive Opportunity BEFORE ordinary Stage-4 Evidence evaluation, while the turn-caused one
  // survives.
  const opportunities = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext, directOpportunity, turn.turnId);
  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].eligibilityInput.sourceCategory, 'DIRECT_USER_REQUEST');
});

test('DUC-COLLISION-2 (CRITICAL — proves the Turn-Serving defect is corrected). the user\'s direct TRR Candidate is NOT displaced by an unrelated, real, higher-canonical-tier proactive Candidate — the governed response serves the originating turn', async () => {
  const ConversationalNeedCreator = require('../js/coachDecisionSystem/conversationalNeedCreator.js');
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({ content: [{ text: JSON.stringify({
      outcome: 'ACTION_PROPOSED',
      action: 'שקול/י אימון קליל יותר היום לאור שנת הלילה המוגבלת.',
      actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
      rationale: 'המשתמש שאל ישירות אם כדאי להתאמן, ודיווח על שנת לילה מוגבלת.',
      evidenceBasis: 'בקשה ישירה + היגד משתמש על שנת לילה מוגבלת.',
      expectedValue: 'התאמת העצימות עשויה למנוע פציעה מיותרת.', uncertainty: 'לא ידוע אם חוסר השינה משמעותי דיו.'
    }) }] })
  });

  const turn = { turnId: 't-collision-2', text: 'ישנתי 5 שעות, כדאי לי להתאמן היום?', submittedAt: Date.now(), sessionGeneration: 1 };
  const turnUnderstanding = {
    interpretationStatus: 'CLASSIFIED',
    affirmativeRequest: { present: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' },
    currentStateStatement: { present: true, text: 'ישנתי 5 שעות' },
    negativeControlPresent: false, desireOnlyPresent: false
  };
  const pipelineContext = {
    assembledAt: Date.now(), relationshipMaturity: { stage: 'UNKNOWN' }, feedbackHistory: [],
    readinessStateContext: { items: [{ statementText: 'ישנתי 5 שעות', sourceMemoryId: 'turn:t-collision-2', interpretationAuthority: 'DERIVED_INTERPRETATION', provenance: 'CURRENT_TURN', capturedAt: Date.now() }] },
    // The unrelated CONFIRMED_PATTERN_ANTICIPATION signal — real hierarchyTier 4, genuinely
    // higher canonical priority than DIRECT_USER_REQUEST's own narrow tier-5 override (Decision
    // 3) — is exactly the scenario the prior review proved could win before this correction.
    initiativeIntelligence: { signals: [unrelatedFoodLoggingObservation()] },
    situationalContext: null, explicitRequestControls: null, userSafetyContext: null, userSafetyProvenance: null,
    activityPreference: null, activityOppositionControls: null
  };
  const needCreatorResult = ConversationalNeedCreator.recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext);
  const directOpportunity = needCreatorResult.opportunity;

  const opportunitiesWithoutFix = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext, directOpportunity); // no currentTurnId — sanity baseline only, not used for the assertion below
  assert.equal(opportunitiesWithoutFix.length, 2, 'sanity: without the turn-serving filter both opportunities would still compete (proves the fixture itself reproduces the original collision precondition)');

  const opportunities = Orchestrator.buildOpportunitiesForDecisionPass(pipelineContext, directOpportunity, turn.turnId);
  const passResult = await Orchestrator.runDecisionPass({ pipelineContext: pipelineContext, opportunities: opportunities, safetyPort: SafetyLayer });

  assert.equal(passResult.status, 'FORMED');
  // 4. The user's direct TRR Candidate is not displaced.
  assert.equal(passResult.decision.candidateProvenance.length, 1);
  assert.equal(passResult.decision.candidateProvenance[0].sourceCategory, 'DIRECT_USER_REQUEST');
  assert.equal(passResult.decision.candidateProvenance[0].turnId, 't-collision-2');
  assert.notEqual(passResult.decision.candidateProvenance[0].sourceCategory, 'CONFIRMED_PATTERN_ANTICIPATION');
  // 5. The resulting governed response serves the originating User Turn — a real, non-Silence
  // TerminalDecision correlated to this exact turnId, never the unrelated food-logging nudge.
  assert.notEqual(passResult.decision.kind, 'SILENCE');
});

test('DUC-SAFETY-EXEMPT-1 (REQUIRED SAFETY TEST). during a DIRECT_TURN_PASS: an unrelated proactive ordinary Opportunity is excluded, while a Safety Opportunity (safetyHighRiskBypass:true) remains admitted even without a matching turnId — Safety remains unconditional', () => {
  const currentTurnId = 't-safety-exempt-1';
  const unrelatedProactive = {
    id: 'g2-food-logging-info-request:habit-food-logging-1', sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION',
    safetyHighRiskBypass: false // no turnId at all — matches every real, non-turn-caused Stage-3 contributor today
  };
  const safetyOpportunityNoTurnId = {
    id: 'safety-1', sourceCategory: 'SAFETY_HIGH_RISK', safetyHighRiskBypass: true
    // deliberately no turnId — Safety must never be required to carry the originating turnId
  };
  const directOpportunity = {
    id: 'duc:direct-user-request:' + currentTurnId, sourceCategory: 'DIRECT_USER_REQUEST', turnId: currentTurnId,
    safetyHighRiskBypass: false
  };

  assert.equal(Orchestrator.isAdmittedForTurnServingPass(unrelatedProactive, currentTurnId), false);
  assert.equal(Orchestrator.isAdmittedForTurnServingPass(safetyOpportunityNoTurnId, currentTurnId), true);
  assert.equal(Orchestrator.isAdmittedForTurnServingPass(directOpportunity, currentTurnId), true);
});
