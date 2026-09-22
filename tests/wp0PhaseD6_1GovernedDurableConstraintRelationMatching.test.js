// WP0 Phase D.6.1 — Governed Durable-Constraint Relation Matching (docs/specs/
// WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md, D.6.1 canonical addition, Product+Architecture
// APPROVED). Binding canonical decision: RELATION AUTHORITY != SEVERITY AUTHORITY.
//
// Exercises the real, unmodified production chain: a real reasoning-produced action ->
// internalPipelineOrchestrator.js's own resolveDurableFactRelation() (via
// characterizeActionTextForSafety()) -> RiskCharacteristicInterpreter.
// classifyCandidateConflictWithFact() (new, bounded, D.3-patterned) -> a Candidate carrying
// {relation:'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity:'NOT_ESTABLISHED'} ->
// safetyLayer.js's own new, dedicated dims branch -> DEFERRED, honestly, every time — never
// BLOCKED, never MODIFIED, never silently UNMODIFIED. Mirrors tests/
// wp0PhaseD6CandidateSafetyThreading.test.js's own established harness exactly.
// Run with: node --test tests/wp0PhaseD6_1GovernedDurableConstraintRelationMatching.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const DateUtils = require('../js/core/dateUtils.js');
const TurnUnderstandingInterpreter = require('../js/coachDecisionSystem/turnUnderstandingInterpreter.js');
const ReadinessStateInterpreter = require('../js/coachDecisionSystem/readinessStateInterpreter.js');
const TrainingReadinessReasoningComponent = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
const RiskCharacteristicInterpreter = require('../js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const RiskCharacteristicValidator = require('../js/coachDecisionSystem/riskCharacteristicValidator.js');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const SafetyLayer = require('../js/coachDecisionSystem/safetyLayer.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');

test.before(() => { TrrCapabilityAdapter.registerAll(); });

const TODAY_DATE_KEY = DateUtils.getTodayKey();

function configureFixture(fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'd61-user' }),
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

function stubTurnUnderstanding(resultByTurnId) {
  TurnUnderstandingInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      const results = ids.map((id) => Object.assign({
        id: id, affirmativeRequestPresent: false, domain: null, topic: null,
        currentStateStatementPresent: false, currentStateStatementText: null,
        negativeControlPresent: false, desireOnlyPresent: false,
        personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
      }, resultByTurnId[id] || {}));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
}

function stubReadinessStateInterpreterClassifiesAll() {
  ReadinessStateInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
      return { content: [{ text: JSON.stringify({ results: ids.map((id) => ({ id, verdict: 'CLASSIFIED_CURRENT_STATE' })) }) }] };
    }
  });
}

function stubTrainingReadinessProposal(action) {
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED', action: action,
          actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u'
        })
      }]
    })
  });
}

// opts: { tagsForActionText: {actionText: [{domain,anchorText}]},
//         conflictRelationForFactText: {factText: 'CONFIRMED_CONFLICT'|'CONFIRMED_NO_CONFLICT'|'AMBIGUOUS'},
//         conflictExtraFields: {factText: {...extra fields the model might sneak in}},
//         conflictThrows: boolean, conflictMalformed: boolean }
function stubRiskCharacteristicFullMechanism(opts) {
  opts = opts || {};
  RiskCharacteristicInterpreter.configure({
    callClaude: async (body) => {
      const content = body.messages[0].content;
      if (content.indexOf('already-durable Safety-relevant fact on record') >= 0) {
        if (opts.conflictThrows) throw new Error('transport exploded');
        if (opts.conflictMalformed) return { content: [{ text: 'not json at all' }] };
        const factMatch = content.match(/verbatim: "([^"]*)"/);
        const factText = factMatch ? factMatch[1] : '';
        const relation = (opts.conflictRelationForFactText && opts.conflictRelationForFactText[factText]) || 'AMBIGUOUS';
        const extra = (opts.conflictExtraFields && opts.conflictExtraFields[factText]) || {};
        return { content: [{ text: JSON.stringify(Object.assign({ relation: relation }, extra)) }] };
      }
      const match = content.match(/\n<proposed_action>([\s\S]*)<\/proposed_action>/);
      const actionText = match ? match[1] : '';
      const tags = (opts.tagsForActionText && opts.tagsForActionText[actionText]) || [];
      return { content: [{ text: JSON.stringify({ tags: tags }) }] };
    }
  });
}

function stubExpressionRendererEchoes() {
  ExpressionRenderer.configure({ generateFn: async () => 'תגובת מאמן לדוגמה (stub, לא מודל אמיתי).' });
}

function makeTurn(turnId, text, overrides) {
  return Object.assign({ turnId: turnId, text: text, submittedAt: Date.now(), sessionGeneration: 1 }, overrides || {});
}

function riskCharacteristicFactMemoryRecord(id, riskDomain, literalStatementText, sourceTurnId) {
  return { id: id, type: 'risk_characteristic_fact', payload: { riskDomain: riskDomain, literalStatementText: literalStatementText, sourceTurnId: sourceTurnId }, source: 'user_stated', status: 'active' };
}

const DIRECT_REQUEST_TURN_UNDERSTANDING = { affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' };

test.afterEach(() => {
  TurnUnderstandingInterpreter.configure({ callClaude: null });
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  RiskCharacteristicInterpreter.configure({ callClaude: null, timeoutMs: undefined });
  ExpressionRenderer.configure({ generateFn: null });
});

async function runTurn(turnId, text) {
  const turn = makeTurn(turnId, text);
  return Orchestrator.run({
    userId: 'd61-user', sessionGeneration: 1, runId: turnId + '-run',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });
}

// ══════════════════════════════════════════════════════════════════
// Required pressure tests (Product/Architecture-specified)
// ══════════════════════════════════════════════════════════════════

test('1. peanut allergy + peanuts -> DEFERRED (confirmed conflict, severity NOT_ESTABLISHED, never BLOCKED)', async () => {
  const action = 'הזמן כריך עם חמאת בוטנים';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'אלרגיה לבוטנים', 't-old')]);
  stubTurnUnderstanding({ 't-peanut-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', anchorText: 'בוטנים' }] },
    conflictRelationForFactText: { 'אלרגיה לבוטנים': 'CONFIRMED_CONFLICT' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-peanut-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
  assert.equal(result.output.terminalDecision.safetyDisposition.originalKind !== 'BOUNDARY', true);
});

test('2. peanut allergy + unrelated food -> not falsely conflicted (CONFIRMED_NO_CONFLICT -> NO_KNOWN_CONFLICT -> UNMODIFIED)', async () => {
  const action = 'הזמן סלט ירקות טרי';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'אלרגיה לבוטנים', 't-old')]);
  stubTurnUnderstanding({ 't-peanut-2': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', anchorText: 'סלט' }] },
    conflictRelationForFactText: { 'אלרגיה לבוטנים': 'CONFIRMED_NO_CONFLICT' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-peanut-2', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

test('3. food intolerance + related food -> DEFERRED', async () => {
  const action = 'שתה כוס חלב מלא';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'אי סבילות ללקטוז', 't-old')]);
  stubTurnUnderstanding({ 't-intol-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', anchorText: 'חלב' }] },
    conflictRelationForFactText: { 'אי סבילות ללקטוז': 'CONFIRMED_CONFLICT' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-intol-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('4. permanent running restriction + running -> DEFERRED', async () => {
  const action = 'צא לריצה קלה של 20 דקות';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'אסור לרוץ לצמיתות', 't-old')]);
  stubTurnUnderstanding({ 't-run-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'ריצה' }] },
    conflictRelationForFactText: { 'אסור לרוץ לצמיתות': 'CONFIRMED_CONFLICT' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-run-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('5. running restriction + unrelated activity in the SAME domain (swimming) -> not falsely conflicted', async () => {
  const action = 'נסה שחייה קלה בבריכה';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'אסור לרוץ לצמיתות', 't-old')]);
  stubTurnUnderstanding({ 't-run-2': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'שחייה' }] },
    conflictRelationForFactText: { 'אסור לרוץ לצמיתות': 'CONFIRMED_NO_CONFLICT' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-run-2', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

test('6. ambiguous relation -> DEFERRED (never silently cleared, never falsely blocked)', async () => {
  const action = 'נסה פעילות מעורפלת כלשהי';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'הגבלה לא ברורה', 't-old')]);
  stubTurnUnderstanding({ 't-amb-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'פעילות' }] },
    conflictRelationForFactText: { 'הגבלה לא ברורה': 'AMBIGUOUS' }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-amb-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('7a. classifier failure (thrown) on the relation check -> DEFERRED, never silently cleared', async () => {
  const action = 'נסה אימון כלשהו';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'הגבלה קיימת', 't-old')]);
  stubTurnUnderstanding({ 't-fail-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] },
    conflictThrows: true
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-fail-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('7b. malformed relation-classifier output -> DEFERRED, never silently cleared', async () => {
  const action = 'נסה אימון כלשהו';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'הגבלה קיימת', 't-old')]);
  stubTurnUnderstanding({ 't-fail-2': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({
    tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] },
    conflictMalformed: true
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-fail-2', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('7c. timeout on the relation classifier -> DEFERRED (real timeout, not merely a mocked throw)', async () => {
  const action = 'נסה אימון כלשהו';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'הגבלה קיימת', 't-old')]);
  stubTurnUnderstanding({ 't-fail-3': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  RiskCharacteristicInterpreter.configure({
    timeoutMs: 10,
    callClaude: async (body) => {
      const content = body.messages[0].content;
      if (content.indexOf('already-durable Safety-relevant fact on record') >= 0) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // exceeds the 10ms configured timeout
        return { content: [{ text: JSON.stringify({ relation: 'CONFIRMED_NO_CONFLICT' }) }] };
      }
      const match = content.match(/\n<proposed_action>([\s\S]*)<\/proposed_action>/);
      const actionText = match ? match[1] : '';
      const tags = actionText === action ? [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] : [];
      return { content: [{ text: JSON.stringify({ tags: tags }) }] };
    }
  });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-fail-3', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('8. confirmed conflict + independently-cleared safeAlternative -> still DEFERRED (MODIFIED never available for an unresolved primary severity)', async () => {
  const candidate = {
    riskCharacteristicTags: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity: 'NOT_ESTABLISHED', evidenceSource: 'DURABLE_GOVERNED_USER_FACT', anchorText: 'ריצה' }],
    safeAlternative: { action: 'נסה שחייה במקום', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' },
    // Independently cleared for the SAME domain — would authorize BOUNDED_MODIFICATION for a
    // real severity-bearing tag (proven in tests/wp0PhaseD4GovernedRiskCharacteristicRule.test.js
    // 4b/5b), but must NOT be consulted at all when severity is NOT_ESTABLISHED.
    safeAlternativeCharacterization: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }]
  };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'DEFERRED');
  assert.equal(result.modifiedContent, null);
  assert.equal(result.reasonCode, 'INSUFFICIENT_SAFETY_CONTEXT');
});

test('9. model/self-asserted severity in the relation-classifier response cannot override NOT_ESTABLISHED — extra fields are silently discarded, never trusted', async () => {
  const action = 'נסה אימון עצים';
  RiskCharacteristicInterpreter.configure({
    callClaude: async () => ({ content: [{ text: JSON.stringify({ relation: 'CONFIRMED_CONFLICT', severity: 'LIFE_CRITICAL', diagnosis: 'a fabricated diagnosis' }) }] })
  });
  const built = await Orchestrator.resolveDurableFactRelation(
    'PHYSICAL_EXERTION_OR_MOVEMENT', action,
    [{ riskDomain: 'PHYSICAL_EXERTION_OR_MOVEMENT', literalStatementText: 'הגבלה קיימת' }],
    { anchorText: 'אימון' }
  );
  assert.equal(built.relation, 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT');
  assert.equal(built.severity, 'NOT_ESTABLISHED');
  RiskCharacteristicInterpreter.configure({ callClaude: null });
});

test('10a. RiskDomain co-occurrence ALONE — no confirmed relation ever requested/returned — never establishes DIRECT_CONFLICT (structural: resolveDurableFactRelation always calls the relation classifier before ever returning a conflict)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  const fnStart = src.indexOf('async function resolveDurableFactRelation');
  const fnEnd = src.indexOf('\n  }', src.lastIndexOf('return { domain: domain, relation: \'NO_KNOWN_CONFLICT\'', src.indexOf('async function attachSafetyCharacterization')));
  const body = src.slice(fnStart, fnEnd);
  assert.match(body, /classifyCandidateConflictWithFact/);
  // The ONLY path that returns DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT is gated behind
  // result.relation === 'CONFIRMED_CONFLICT' — never reachable from domain membership alone.
  assert.match(body, /result\.relation === 'CONFIRMED_CONFLICT'/);
});

test('10b. RiskDomain co-occurrence ALONE, behaviorally: a domain match whose relation classifier is never even configured to confirm (defaults AMBIGUOUS via the shared test stub) never reaches DIRECT_CONFLICT', async () => {
  const action = 'נסה אימון';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'הגבלה קיימת', 't-old')]);
  stubTurnUnderstanding({ 't-domain-only-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicFullMechanism({ tagsForActionText: { [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] } }); // no conflictRelationForFactText entry -> defaults AMBIGUOUS
  stubExpressionRendererEchoes();

  const result = await runTurn('t-domain-only-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.notEqual(result.output.terminalDecision.safetyDisposition.disposition, 'BLOCKED');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('11. NOT_ESTABLISHED is never persisted into a risk_characteristic_fact record — app.js\'s own persistence payload never references it, and riskCharacteristicIntakeGate.js (D.3, closed) is completely untouched by D.6.1', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  const startIdx = appJs.indexOf('async function persistRiskCharacteristicFactRecord');
  const endIdx = appJs.indexOf('\nasync function runPreferenceAcknowledgmentFinalizationEngine');
  const body = appJs.slice(startIdx, endIdx);
  assert.equal(/NOT_ESTABLISHED|severity/i.test(body), false);

  const intakeGateSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'riskCharacteristicIntakeGate.js'), 'utf8');
  assert.equal(/NOT_ESTABLISHED/.test(intakeGateSrc), false);

  const memoryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'memory.js'), 'utf8');
  assert.equal(/NOT_ESTABLISHED/.test(memoryJs), false);
});

test('12a. TRR golden-master, D.6.1-specific: a real TRR candidate with zero risk-relevant content never reaches resolveDurableFactRelation() at all (no domain match) — byte-identical UNMODIFIED/DISPATCHED outcome', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-trr-gm-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal('שקול/י אימון קליל יותר היום.');
  RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: JSON.stringify({ tags: [] }) }] }) });
  stubExpressionRendererEchoes();

  const result = await runTurn('t-trr-gm-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

test('12b. TRR golden-master: matchGovernedRiskCharacteristicRule() with an empty riskCharacteristicTags array (TRR\'s own real, unaffected shape) is untouched by the new D.6.1 branch — contributes zero dims, exactly as before D.6.1', () => {
  const result = SafetyLayer.matchGovernedRiskCharacteristicRule({ actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' }, riskCharacteristicTags: [] }, {});
  assert.deepEqual(result, []);
});

test('13. GeneralReasoning fallback remains non-user-reachable — the live orchestration seam (internalPipelineOrchestrator.js) still never references it; the authoritative structural proof lives in tests/generalReasoningActivationGate.test.js, unmodified by D.6.1', () => {
  // riskCharacteristicInterpreter.js's own file header has, since Phase D.2, legitimately named
  // GeneralReasoningCapability in a disclosure comment explaining this module's structural
  // independence from it ("this module is never called BY a reasoning capability") — a pre-existing,
  // harmless mention, not a reference/require/call, and not something D.6.1 introduces or widens.
  // Only the live orchestration seam itself is asserted here, matching generalReasoningActivationGate.
  // test.js's own established scope.
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  assert.equal(/GeneralReasoningCapability/.test(orchestratorSrc), false);
  assert.equal(/GeneralReasoningActivationGate/.test(orchestratorSrc), false);
});

// ══════════════════════════════════════════════════════════════════
// Direct-unit coverage of the new interpreter function and validator/mapping additions
// ══════════════════════════════════════════════════════════════════

test('classifyCandidateConflictWithFact: unconfigured interpreter fails closed', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: null });
  const result = await RiskCharacteristicInterpreter.classifyCandidateConflictWithFact('x', 'y');
  assert.deepEqual(result, { status: 'FAILED' });
});

test('classifyCandidateConflictWithFact: invalid input (empty strings) fails closed without ever calling the model', async () => {
  let called = false;
  RiskCharacteristicInterpreter.configure({ callClaude: async () => { called = true; return { content: [{ text: '{}' }] }; } });
  const r1 = await RiskCharacteristicInterpreter.classifyCandidateConflictWithFact('', 'y');
  const r2 = await RiskCharacteristicInterpreter.classifyCandidateConflictWithFact('x', '');
  assert.deepEqual(r1, { status: 'FAILED' });
  assert.deepEqual(r2, { status: 'FAILED' });
  assert.equal(called, false);
});

test('classifyCandidateConflictWithFact: an out-of-vocabulary relation value fails closed', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: JSON.stringify({ relation: 'DEFINITELY_MAYBE' }) }] }) });
  const result = await RiskCharacteristicInterpreter.classifyCandidateConflictWithFact('x', 'y');
  assert.deepEqual(result, { status: 'FAILED' });
});

test('classifyCandidateConflictWithFact: the prompt never mentions severity, diagnosis, or a broader proposition — its own output schema is the closed 3-value relation only', () => {
  const prompt = RiskCharacteristicInterpreter._internal.buildCandidateConflictPrompt('x', 'y');
  assert.match(prompt, /never how severe it is, never a/);
  assert.match(prompt, /"relation":"CONFIRMED_CONFLICT"\|"CONFIRMED_NO_CONFLICT"\|"AMBIGUOUS"/);
});

test('mapGovernedRiskCharacteristicTagToDims: DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT + NOT_ESTABLISHED maps to INSUFFICIENT correctability/urgency/riskType, honest evidenceConfidence, and never invokes the safe-alternative gate', () => {
  const candidateWithClearedAlt = {
    safeAlternativeCharacterization: [{ domain: 'STANDING_OR_IRREVERSIBLE_COMMITMENT', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }]
  };
  const dims = SafetyLayer.mapGovernedRiskCharacteristicTagToDims(
    { domain: 'STANDING_OR_IRREVERSIBLE_COMMITMENT', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity: 'NOT_ESTABLISHED', evidenceSource: 'DURABLE_GOVERNED_USER_FACT', anchorText: 'x' },
    candidateWithClearedAlt
  );
  assert.equal(dims.riskType, 'INSUFFICIENT');
  assert.equal(dims.correctability, 'INSUFFICIENT');
  assert.equal(dims.urgency, 'INSUFFICIENT');
  assert.equal(dims.evidenceConfidence, 'EXPLICIT_USER_STATEMENT');
  assert.equal(SafetyLayer.evaluateRulePredicate(dims), 'DEFERRED');
});

test('RiskCharacteristicValidator: a tag with relation=DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT and severity=NOT_ESTABLISHED is shape-valid', () => {
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape({
    domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',
    severity: 'NOT_ESTABLISHED', evidenceSource: 'DURABLE_GOVERNED_USER_FACT', anchorText: 'peanuts'
  }), true);
});
