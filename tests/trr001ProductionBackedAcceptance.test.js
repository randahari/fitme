// TRR-001 — Temporal Relevance Production-Backed Acceptance (TRR Temporal Relevance Investigation
// / Product-Architecture correction). Exercises the real, unmodified production chain the prior
// TRR-specific tests bypassed: raw WORKOUT_FREQUENCY Habit record -> DerivedIntelligenceConsumer
// normalization -> weekday-qualifier tagging -> B5's own evaluateRelevance() -> Memory Layer's
// INITIATIVE_ENGINE consumer request (now correctly supplying `intent.weekday`, per the
// Product/Architecture-authorized correction to memoryLayer.js) ->
// pipelineContext.initiativeIntelligence.signals. No test in this file directly constructs
// pipelineContext.initiativeIntelligence.signals as a fixture — every assertion is against the
// real DerivedIntelligenceConsumer.build() -> MemoryLayer.assembleContext() -> (Tests 3+)
// internalPipelineOrchestrator.run() output. No live LLM, no live Firestore, no Chat. Mirrors
// tests/cssc001ProductionBackedAcceptance.test.js's own established shape.
// Run with: node --test tests/trr001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const DateUtils = require('../js/core/dateUtils.js');
const ReadinessStateInterpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
// WP0 Phase D.6 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §09.3/§13/§17) — the
// new, unconditional independent Candidate-content characterization step now runs against every
// real Candidate this TRR branch produces, including this file's own. Stubbed here the same way
// every other bounded-interpreter seam already is — an honest "touches nothing" CLASSIFIED
// response — so TRR's own golden-master proof (a real Candidate is produced) is not obscured by
// this Sub-Spec's own separate, deliberate fail-closed-on-unconfigured behavior (binding
// requirement 6: an unconfigured/failed characterization must defer, never silently pass through
// as if it never ran — proven directly by tests/wp0PhaseD6CandidateSafetyThreading.test.js).
const RiskCharacteristicInterpreter = require('../js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

// Deterministic relative to whatever real day the suite runs on — never mocks the global Date
// object (which would risk destabilizing every other test file's own timing-sensitive behavior).
// memoryLayer.js's own new intent.weekday computation uses the real `new Date().getDay()`
// (FITME's existing browser/system-local convention, unchanged by this test) — so the SAME-DAY
// fixture below uses TODAY's own real weekday, and the DIFFERENT-DAY fixture uses the adjacent one.
const TODAY_WEEKDAY = new Date().getDay();
const MISMATCHED_WEEKDAY = (TODAY_WEEKDAY + 1) % 7;
const TODAY_DATE_KEY = DateUtils.getTodayKey();

function makeWorkoutHabitRecord(weekday) {
  return {
    id: 'workout:weekday:' + weekday, type: 'workout', key: 'weekday:' + weekday,
    status: 'active', confidence: 0.8, sourceEvents: { count: 5 }, lastObserved: TODAY_DATE_KEY
  };
}

function configureFixture(habitRecord, fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'trr-temporal-user' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: fetchUserStatedMemoryFn || (async () => [])
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [habitRecord], habitsMeta: { lastRun: TODAY_DATE_KEY, version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: TODAY_DATE_KEY, version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => TODAY_DATE_KEY,
    getWeekday: () => TODAY_WEEKDAY
  });
}

function stubRiskCharacteristicInterpreterNoSignal() {
  RiskCharacteristicInterpreter.configure({
    callClaude: async () => ({ content: [{ text: JSON.stringify({ tags: [] }) }] })
  });
}

test.afterEach(() => {
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  RiskCharacteristicInterpreter.configure({ callClaude: null });
  ExpressionRenderer.configure({ generateFn: null });
});

// ══════════════════════════════════════════════════════════════════
// SAME-DAY CASE — the Habit's own weekday qualifier matches today. Exercises exactly the chain
// the temporal-relevance investigation traced: raw Habit record -> normalizeHabitRecord() ->
// evaluateRelevance() (B5, unmodified) -> MemoryLayer's own INITIATIVE_ENGINE request (corrected).
// ══════════════════════════════════════════════════════════════════
test('TRR-TEMPORAL-1. SAME-DAY: a WORKOUT_FREQUENCY Habit whose weekday qualifier matches today survives B5 relevance evaluation and reaches pipelineContext.initiativeIntelligence.signals (real DerivedIntelligenceConsumer.build() chain, not a directly-injected fixture)', async () => {
  configureFixture(makeWorkoutHabitRecord(TODAY_WEEKDAY));

  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'trr-temporal-user', sessionGeneration: 1, runId: 'trr-temporal-1' });

  assert.equal(pipelineContext.availability.initiativeIntelligence, 'AVAILABLE');
  const signals = pipelineContext.initiativeIntelligence && pipelineContext.initiativeIntelligence.signals;
  assert.ok(Array.isArray(signals), 'expected a real signals array from the production chain');
  const workoutSignal = signals.find((s) => s.domain === 'WORKOUT' && s.topic === 'WORKOUT_FREQUENCY');
  assert.notEqual(workoutSignal, undefined, 'expected the same-day WORKOUT_FREQUENCY Habit signal to survive B5 relevance evaluation');
  assert.equal(workoutSignal.lifecycle, 'ACTIVE');
});

// ══════════════════════════════════════════════════════════════════
// DIFFERENT-DAY CASE — the Habit's own weekday qualifier does NOT match today. Proves the
// correction did not weaken B5's own conservative relevance semantics: this signal must remain
// excluded, exactly as B5_SPEC_v1.0.md §23.3's own "Friday Pattern on Tuesday: exclude" example
// requires under an IMMEDIATE-purpose request.
// ══════════════════════════════════════════════════════════════════
test('TRR-TEMPORAL-2. DIFFERENT-DAY: a WORKOUT_FREQUENCY Habit whose weekday qualifier does NOT match today is excluded from pipelineContext.initiativeIntelligence.signals — the correction restores temporal context without broadening B5\'s own conservative IMMEDIATE-purpose relevance semantics', async () => {
  configureFixture(makeWorkoutHabitRecord(MISMATCHED_WEEKDAY));

  const pipelineContext = await MemoryLayer.assembleContext({ userId: 'trr-temporal-user', sessionGeneration: 1, runId: 'trr-temporal-2' });

  assert.equal(pipelineContext.availability.initiativeIntelligence, 'AVAILABLE');
  const signals = pipelineContext.initiativeIntelligence && pipelineContext.initiativeIntelligence.signals;
  assert.ok(Array.isArray(signals));
  const workoutSignal = signals.find((s) => s.domain === 'WORKOUT' && s.topic === 'WORKOUT_FREQUENCY');
  assert.equal(workoutSignal, undefined, 'a non-matching-weekday WORKOUT_FREQUENCY Habit must not become relevant to today\'s immediate Initiative decision');
});

// ══════════════════════════════════════════════════════════════════
// SAME-DAY, EXTENDED — proves the full, already-authorized proactive TRR path is reachable end to
// end from the real Habit/relevance chain (never a directly-injected
// pipelineContext.initiativeIntelligence.signals fixture), through CONFIRMED_PATTERN_ANTICIPATION
// -> ADAPT_TO_CURRENT_STATE -> Eligibility -> the real TrainingReadinessReasoningComponent ->
// Candidate -> Safety -> Decision Formation -> Expression. Stubbed callClaude/generateFn seams
// only (ReadinessStateInterpreter, TrainingReadinessReasoningComponent, ExpressionRenderer) — the
// exact same production composition-root seams js/app.js now wires, no live external AI.
// ══════════════════════════════════════════════════════════════════
test('TRR-TEMPORAL-3. SAME-DAY, extended: a same-day WORKOUT_FREQUENCY Habit + a real user_stated readiness statement together reach a FORMED, DISPATCHED Expression outcome via the real, unmodified production chain', async () => {
  const readinessRecord = {
    _id: 'mem-sleep-temporal-1', type: 'fact',
    payload: { text: 'ישנתי רק 5 שעות הלילה' },
    confidence: 1, source: 'user_stated', status: 'active', updated_at: Date.now()
  };
  configureFixture(makeWorkoutHabitRecord(TODAY_WEEKDAY), async () => [readinessRecord]);

  ReadinessStateInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return { content: [{ text: JSON.stringify({ results: ids.map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) }) }] };
    }
  });

  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED',
          action: 'שקול/י אימון קליל וקצר יותר היום, או מנוחה, לאור שנת הלילה המוגבלת.',
          actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'הרגל אימון קבוע קיים, אך המשתמש דיווח על שנת לילה מוגבלת הערב.',
          evidenceBasis: 'הרגל WORKOUT_FREQUENCY פעיל (יום תואם) + היגד משתמש על שנת לילה מוגבלת.',
          expectedValue: 'הפחתת עומס עשויה למנוע החמרה/פציעה מיותרת.',
          uncertainty: 'לא ידוע אם חוסר השינה משמעותי דיו כדי להצדיק שינוי בפועל.'
        })
      }]
    })
  });

  ExpressionRenderer.configure({
    generateFn: async () => 'תגובת מאמן לדוגמה (stub, לא מודל אמיתי) — התאמת אימון היום.'
  });

  stubRiskCharacteristicInterpreterNoSignal();

  const result = await Orchestrator.run({
    userId: 'trr-temporal-user', sessionGeneration: 1, runId: 'trr-temporal-3',
    trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now()
  });

  assert.equal(result.status, 'SUCCESS');
  const pc = result.output.pipelineContext;
  assert.equal(pc.readinessStateContext.items.length, 1, 'expected the real readiness statement to classify');
  assert.equal(pc.readinessStateContext.items[0].sourceMemoryId, 'mem-sleep-temporal-1');

  const terminalDecision = result.output.terminalDecision;
  assert.notEqual(terminalDecision, undefined, 'expected a real TerminalDecision, not a Decision-Pass-level Silence');
  assert.notEqual(terminalDecision.kind, 'SILENCE', 'the same-day Habit + real readiness statement should have produced a real Candidate, not Silence');

  const provenance = terminalDecision.candidateProvenance;
  assert.ok(Array.isArray(provenance) && provenance.length === 1);
  assert.match(provenance[0].opportunityId, /^trr-adapt-to-current-state:/);

  assert.equal(result.output.expression.status, 'DISPATCHED');
  assert.ok(result.output.expression.deliveryIntent, 'expected a real Delivery Intent from the real, unmodified Expression stage');
});
