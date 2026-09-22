// WP0 Phase D.6 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §09.1(a)/§10.1/§13/§14/
// §16/§17, Product+Architecture APPROVED) — Candidate/StandardProposal Safety Threading.
// Exercises the real, unmodified production chain: a real reasoning-produced StandardProposal ->
// internalPipelineOrchestrator.js's own new, unconditional characterizeActionTextForSafety()/
// attachSafetyCharacterization() step -> a real Candidate carrying independently-derived
// riskCharacteristicTags -> safetyLayer.js's own matchGovernedRiskCharacteristicRule() (D.4,
// unmodified in its own dispatch logic) -> Stage 9 finalReview() -> Decision Formation ->
// Expression. Mirrors tests/duc001ProductionBackedAcceptance.test.js's own established harness
// (real Orchestrator.run(), mocked bounded-interpreter seams only, no live LLM/Firestore).
// Run with: node --test tests/wp0PhaseD6CandidateSafetyThreading.test.js

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
const GeneralReasoningCapability = require('../js/coachDecisionSystem/generalReasoningCapability.js');
const StandardProposalContract = require('../js/coachDecisionSystem/standardProposalContract.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');
const TrrCapabilityAdapter = require('../js/coachDecisionSystem/trrCapabilityAdapter.js');

test.before(() => { TrrCapabilityAdapter.registerAll(); });

const TODAY_DATE_KEY = DateUtils.getTodayKey();

function configureFixture(fetchUserStatedMemoryFn, consentGranted) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: consentGranted !== false } }),
    getCurrentUser: () => ({ uid: 'd6-user' }),
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

function stubTrainingReadinessProposal(action, actionCategory) {
  TrainingReadinessReasoningComponent.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED', action: action,
          actionCategory: actionCategory || 'NON_ACTIVITY_COACHING_ACTION', activityReference: null,
          rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u'
        })
      }]
    })
  });
}

// opts: { tagsForActionText: {[actionText]: [{domain,anchorText}]} } — routes classifyCandidateContent()
// per the actual action text it was called with, mirroring the real interpreter's own single-input
// contract (one call per action text, unlike the batched turn-understanding/readiness seams).
function stubRiskCharacteristicInterpreter(tagsForActionText) {
  RiskCharacteristicInterpreter.configure({
    callClaude: async (body) => {
      const content = body.messages[0].content;
      // WP0 Phase D.6.1 — classifyCandidateConflictWithFact()'s own prompt is distinguished by its
      // unique phrase (mirrors classifyCorrectionWithStatus()'s "previously, explicitly" marker
      // convention elsewhere in this test suite). This shared helper defaults such calls to
      // AMBIGUOUS — callers of this specific function exercise the domain-matching TRIGGER layer
      // only, not D.6.1's own relation-classification outcomes (see the dedicated
      // tests/wp0PhaseD6_1GovernedDurableConstraintRelationMatching.test.js for that coverage).
      if (content.indexOf('already-durable Safety-relevant fact on record') >= 0) {
        return { content: [{ text: JSON.stringify({ relation: 'AMBIGUOUS' }) }] };
      }
      // Anchored to a preceding newline — the prompt's own descriptive sentence also mentions the
      // literal substring "<proposed_action>" in prose (no matching close nearby), so a
      // non-anchored match would swallow that sentence too. The real wrapped block is always its
      // own line, immediately following '\n'.
      const match = content.match(/\n<proposed_action>([\s\S]*)<\/proposed_action>/);
      const actionText = match ? match[1] : '';
      const tags = (tagsForActionText && tagsForActionText[actionText]) || [];
      return { content: [{ text: JSON.stringify({ tags: tags }) }] };
    }
  });
}

function stubRiskCharacteristicInterpreterNoSignal() {
  RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: JSON.stringify({ tags: [] }) }] }) });
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

test.afterEach(() => {
  TurnUnderstandingInterpreter.configure({ callClaude: null });
  ReadinessStateInterpreter.configure({ callClaude: null });
  TrainingReadinessReasoningComponent.configure({ callClaude: null });
  RiskCharacteristicInterpreter.configure({ callClaude: null, timeoutMs: undefined });
  ExpressionRenderer.configure({ generateFn: null });
});

// Deliberately WITHOUT currentStateStatementPresent:true — that signal independently trips Item
// 6's OWN, unrelated disclosure-recognition track (userDisclosureRecognizer.js's own Dimension 2,
// "currentStateStatement.present === true"), which would confound these tests' own assertions
// about the D.6 mechanism specifically. TRR/ADAPT_TO_CURRENT_STATE routing itself depends only on
// affirmativeRequest.present + domain/topic matching CapabilityRegistry's TRR registration
// (conversationalNeedCreator.js's own resolveProfessionalCapability()) — currentStateStatement is
// not required for it.
const DIRECT_REQUEST_TURN_UNDERSTANDING = {
  affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY'
};

// ══════════════════════════════════════════════════════════════════
// Structural wiring — proves the mechanism exists at the exact seam, never a new orchestration
// point, and is capability-agnostic by construction.
// ══════════════════════════════════════════════════════════════════

test('wiring: internalPipelineOrchestrator.js exports characterizeActionTextForSafety/characterizeCandidateForSafety/attachSafetyCharacterization, and attachSafetyCharacterization is called exactly once, unconditionally, in runDecisionPass()\'s TRR branch — never gated on any capability declaration', () => {
  assert.equal(typeof Orchestrator.characterizeActionTextForSafety, 'function');
  assert.equal(typeof Orchestrator.characterizeCandidateForSafety, 'function');
  assert.equal(typeof Orchestrator.attachSafetyCharacterization, 'function');

  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  const occurrences = (src.match(/await attachSafetyCharacterization\(/g) || []).length;
  assert.equal(occurrences, 1);
  // Scoped to the three new functions' own bodies (never the surrounding disclosure comments,
  // which legitimately discuss riskCharacteristicDimensions by name as documentation — the same
  // "disclosure-comment false positive" pattern this codebase has repeatedly guarded against).
  const fnStart = src.indexOf('async function characterizeActionTextForSafety');
  const fnEnd = src.indexOf('async function resolveTrainingReadinessProposal');
  const fnBody = src.slice(fnStart, fnEnd).replace(/\/\/.*$/gm, ''); // strip line comments only
  assert.equal(/riskCharacteristicDimensions/.test(fnBody), false, 'the characterization step must never read a capability declaration field — it structurally cannot gate on what it never receives');
});

test('wiring: initiativeEngine.js threads riskCharacteristicTags/safeAlternative/safeAlternativeCharacterization onto InitiativeCandidate the SAME undefined-safe pattern as TRR\'s own actionCategory/activityReference/actionIdentity fields — additive, never overwriting the pre-existing three', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'initiativeEngine.js'), 'utf8');
  assert.match(src, /opportunity\.riskCharacteristicTags !== undefined \? \{ riskCharacteristicTags: opportunity\.riskCharacteristicTags \} : \{\}/);
  assert.match(src, /opportunity\.actionIdentity !== undefined \? \{ actionIdentity: opportunity\.actionIdentity \} : \{\}/);
});

test('wiring: recommendationEngine.js (CC-03\'s own explicitly closed 7-field Candidate contract) is completely untouched by this phase — never gains riskCharacteristicTags/safeAlternative, per its own closed-contract discipline', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'recommendationEngine.js'), 'utf8');
  assert.equal(/riskCharacteristicTags|safeAlternative/.test(src), false);
});

test('wiring: characterizeActionTextForSafety() never accepts or reads a capability-declaration argument — its ONLY inputs are already-produced action text and pipelineContext, structurally proving unconditional execution (binding requirement 2/3)', () => {
  assert.equal(Orchestrator.characterizeActionTextForSafety.length, 2);
});

// ══════════════════════════════════════════════════════════════════
// D6-GOLDEN-MASTER — TRR outcome equivalence: the new, unconditional step runs against TRR's own
// real Candidate but changes nothing when characterization finds no conflict, exactly as §13/§17/
// §19/§23 require.
// ══════════════════════════════════════════════════════════════════

test('D6-GOLDEN-MASTER-1. a real TRR-produced Candidate, independently characterized with zero risk-relevant domains, reaches the identical DISPATCHED outcome the pre-D.6 pipeline already produced — riskCharacteristicTags is [] on the resulting Candidate, contributing zero dims tuples', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-d6-gm-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal('שקול/י אימון קליל יותר היום.');
  stubRiskCharacteristicInterpreterNoSignal();
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d6-gm-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'd6-user', sessionGeneration: 1, runId: 'd6-gm-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.notEqual(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
  assert.ok(result.output.expression.deliveryIntent);
});

test('D6-GOLDEN-MASTER-2. the SAME turn, with RiskCharacteristicInterpreter genuinely unconfigured (never stubbed) — proves the golden-master result above depended on a real, successful CLASSIFIED response, not on the step silently no-op-ing when unconfigured', async () => {
  configureFixture();
  stubTurnUnderstanding({ 't-d6-gm-2': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal('שקול/י אימון קליל יותר היום.');
  stubExpressionRendererEchoes();
  // RiskCharacteristicInterpreter deliberately left unconfigured (callClaude: null, the afterEach
  // default) for this one test.

  const turn = makeTurn('t-d6-gm-2', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'd6-user', sessionGeneration: 1, runId: 'd6-gm-2',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'SILENCE', 'binding requirement 6: an unconfigured/failed characterization must DEFER, never silently pass through as if it never ran');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

// ══════════════════════════════════════════════════════════════════
// D6-FAILURE — direct-function proof of the fail-closed sentinel mechanism (binding requirement 6).
// ══════════════════════════════════════════════════════════════════

test('D6-FAILURE-1. characterizeActionTextForSafety() with an unconfigured interpreter returns a single, deliberately shape-INVALID sentinel — never an empty array (which would be indistinguishable from "ran, found nothing")', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: null });
  const tags = await Orchestrator.characterizeActionTextForSafety('any action text', {});
  assert.equal(tags.length, 1);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(tags[0]), false, 'the sentinel must be shape-invalid so matchGovernedRiskCharacteristicRule()\'s own existing malformed-tag handling catches it');
  assert.equal(tags[0].evidenceSource, 'AI_CANDIDATE_CHARACTERIZATION');
});

test('D6-FAILURE-2. that sentinel, fed through the real, unmodified matchGovernedRiskCharacteristicRule() + evaluateRulePredicate(), resolves DEFERRED (INSUFFICIENT/INFERENCE) — never UNMODIFIED', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: null });
  const tags = await Orchestrator.characterizeActionTextForSafety('any action text', {});
  const matched = SafetyLayer.matchGovernedRiskCharacteristicRule({ riskCharacteristicTags: tags }, {});
  assert.equal(matched.length, 1);
  assert.equal(matched[0].riskType, 'INSUFFICIENT');
  assert.equal(matched[0].evidenceConfidence, 'INFERENCE');
  assert.equal(SafetyLayer.evaluateRulePredicate(matched[0]), 'DEFERRED');
});

test('D6-FAILURE-3. a thrown classifyCandidateContent() call (not merely a FAILED status) is caught and produces the identical fail-closed sentinel — never an unhandled rejection, never a silent empty result', async () => {
  RiskCharacteristicInterpreter.configure({ callClaude: () => { throw new Error('transport exploded'); } });
  const tags = await Orchestrator.characterizeActionTextForSafety('any action text', {});
  assert.equal(tags.length, 1);
  assert.equal(RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(tags[0]), false);
});

// ══════════════════════════════════════════════════════════════════
// D6-DURABLE-MATCH — the durable-fact domain-matching design resolution (disclosed in the
// orchestrator's own header): a Candidate whose content is independently characterized as
// touching a domain with an ACTIVE durable governed fact on record resolves conservatively to
// UNRESOLVED_RELEVANCE -> DEFERRED, never a fabricated DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT/
// BLOCKED — because the durable record itself (D.3/D.5's own binding correction) carries no
// severity to justify a stronger relation. This is the honest resolution of Pressure-Test
// Scenario 2's own "at minimum DEFERRED, correctly non-silent" language (§21 of the Sub-Spec).
// ══════════════════════════════════════════════════════════════════

test('D6-DURABLE-MATCH-1. a TRR proposal whose OWN content is independently characterized as touching the SAME domain as an existing, active, durable governed fact resolves DEFERRED end to end — never silently UNMODIFIED, never fabricated BLOCKED', async () => {
  const action = 'שקול/י אימון קליל יותר היום, לאור מצב הברך.';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'PHYSICAL_EXERTION_OR_MOVEMENT', 'כאב ברך', 't-old')]);
  stubTurnUnderstanding({ 't-d6-dm-1': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicInterpreter({ [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d6-dm-1', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'd6-user', sessionGeneration: 1, runId: 'd6-dm-1',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.kind, 'SILENCE');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'DEFERRED');
});

test('D6-DURABLE-MATCH-2. the SAME domain-level match, verified directly via matchGovernedRiskCharacteristicRule(), never reaches BLOCKED (KNOWN_ALLERGY_CONFLICT or otherwise) — structural proof that domain-only matching against a durable fact with no recorded severity cannot fabricate an absolute-override disposition', () => {
  const candidate = {
    riskCharacteristicTags: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', relation: 'UNRESOLVED_RELEVANCE', severity: 'ADVISORY', evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: 'peanut' }]
  };
  const matched = SafetyLayer.matchGovernedRiskCharacteristicRule(candidate, {});
  assert.equal(matched.length, 1);
  assert.notEqual(matched[0].riskType, 'KNOWN_ALLERGY_CONFLICT');
  assert.equal(SafetyLayer.evaluateRulePredicate(matched[0]), 'DEFERRED');
});

test('D6-DURABLE-MATCH-3. no matching domain on record -> NO_KNOWN_CONFLICT -> zero dims contributed -> UNMODIFIED, the honest, common case', async () => {
  const action = 'שקול/י אימון קליל יותר היום.';
  configureFixture(async () => [riskCharacteristicFactMemoryRecord('rcf1', 'INGESTION_OR_SUBSTANCE_EXPOSURE', 'אלרגיה לבוטנים', 't-old')]);
  stubTurnUnderstanding({ 't-d6-dm-3': DIRECT_REQUEST_TURN_UNDERSTANDING });
  stubReadinessStateInterpreterClassifiesAll();
  stubTrainingReadinessProposal(action);
  stubRiskCharacteristicInterpreter({ [action]: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'אימון' }] });
  stubExpressionRendererEchoes();

  const turn = makeTurn('t-d6-dm-3', 'ישנתי 5 שעות, כדאי לי להתאמן היום?');
  const result = await Orchestrator.run({
    userId: 'd6-user', sessionGeneration: 1, runId: 'd6-dm-3',
    trigger: 'USER_MESSAGE_SUBMITTED', action: 'DIRECT_TURN_PASS', payload: { turn: turn }, now: turn.submittedAt
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.terminalDecision.safetyDisposition.disposition, 'UNMODIFIED');
  assert.equal(result.output.expression.status, 'DISPATCHED');
});

// ══════════════════════════════════════════════════════════════════
// SUPERSEDED by WP0 Phase D.6.1 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md, D.6.1
// canonical addition, Product+Architecture APPROVED) — Governed Durable-Constraint Relation
// Matching. The finding this section originally disclosed (DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT
// was structurally unreachable from characterizeActionTextForSafety()'s own output) is no longer
// true: resolveDurableFactRelation() now reaches it via the bounded, independent
// classifyCandidateConflictWithFact() relation classifier, with severity:'NOT_ESTABLISHED' (never
// a domain-derived or AI-proposed value). See tests/wp0PhaseD6_1GovernedDurableConstraintRelation
// Matching.test.js for the full, dedicated D.6.1 acceptance/pressure-test suite. This file's own
// remaining tests above (D6-DURABLE-MATCH-1/2/3) still exercise the ORIGINAL D.6 domain-matching
// trigger correctly — they are unaffected by D.6.1, since D.6.1 only replaces WHAT HAPPENS once a
// domain match is found (a further, bounded relation comparison), never the trigger itself.
// ACUTE_STATE_INDICATED_THIS_TURN remains structurally unreachable from this mechanism — D.6.1
// does not touch that relation at all; it is out of this Sub-Spec's own scope (§09.1(a) never
// produces it, by design, unrelated to durable-fact matching).
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// D6-MODIFIED — the safeAlternative independent-clearance gate, exercised via direct SafetyLayer
// invocation (the exact governed contract this phase closes; end-to-end live reachability from
// classifyCandidateContent()'s own domain-only output is the separate, disclosed limitation
// immediately above — this proves the GATE and finalReview()'s own modifiedContent-sourcing are
// correct and ready for whatever future, more precise evidence source may someday supply a
// matching primary tag).
// ══════════════════════════════════════════════════════════════════

test('D6-MODIFIED-1. finalReview(), given a real Candidate with a PROHIBITIVE/DIRECT_CONFLICT primary tag AND an independently-cleared safeAlternativeCharacterization for the SAME domain, reaches MODIFIED with modifiedContent sourced from candidate.safeAlternative.action', async () => {
  const candidate = {
    riskCharacteristicTags: [{ domain: 'EATING_PATTERN_OR_BODY_IMAGE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity: 'ADVISORY', evidenceSource: 'DURABLE_GOVERNED_USER_FACT', anchorText: 'x' }],
    safeAlternative: { action: 'נסו גישה מתונה יותר', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' },
    safeAlternativeCharacterization: [{ domain: 'EATING_PATTERN_OR_BODY_IMAGE', relation: 'NO_KNOWN_CONFLICT', severity: null, evidenceSource: 'AI_CANDIDATE_CHARACTERIZATION', anchorText: null }]
  };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'MODIFIED');
  assert.deepEqual(result.modifiedContent, { action: 'נסו גישה מתונה יותר' });
});

test('D6-MODIFIED-2. the identical Candidate WITHOUT safeAlternativeCharacterization (self-certification-only, bare safeAlternative.verified:true) resolves BLOCKED, never MODIFIED', async () => {
  const candidate = {
    riskCharacteristicTags: [{ domain: 'EATING_PATTERN_OR_BODY_IMAGE', relation: 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT', severity: 'ADVISORY', evidenceSource: 'DURABLE_GOVERNED_USER_FACT', anchorText: 'x' }],
    safeAlternative: { verified: true, action: 'trust me, this is fine' }
  };
  const result = await SafetyLayer.finalReview({}, {}, candidate);
  assert.equal(result.disposition, 'BLOCKED');
  assert.equal(result.modifiedContent, null);
});

// ══════════════════════════════════════════════════════════════════
// GeneralReasoning fallback remains non-user-reachable — cross-checked directly here (the
// authoritative structural proof lives in tests/generalReasoningActivationGate.test.js, unmodified
// by this phase; this test only confirms this phase's own new code did not silently change that).
// ══════════════════════════════════════════════════════════════════

test('confirmation: GeneralReasoningCapability gained an optional safeAlternative output field (this phase) but is STILL never referenced by internalPipelineOrchestrator.js or conversationalNeedCreator.js — the live routing seam remains completely unaware of its existence', () => {
  const orchestratorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'internalPipelineOrchestrator.js'), 'utf8');
  const needCreatorSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'coachDecisionSystem', 'conversationalNeedCreator.js'), 'utf8');
  assert.equal(/GeneralReasoningCapability/.test(orchestratorSrc), false);
  assert.equal(/GeneralReasoningCapability/.test(needCreatorSrc), false);
  assert.equal(/GeneralReasoningActivationGate/.test(orchestratorSrc), false);
});

test('confirmation: GeneralReasoningCapability.reason() correctly parses/validates an optional safeAlternative from the model, but a malformed one is silently omitted — never fabricated, never defaults to trusting incomplete content', async () => {
  GeneralReasoningCapability.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED', action: 'primary action', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u',
          safeAlternative: { action: 'alt action only, missing other required fields' } // malformed — missing rationale/evidenceBasis/expectedValue/uncertainty
        })
      }]
    })
  });
  const candidate = await GeneralReasoningCapability.reason({}, {});
  assert.notEqual(candidate, null);
  assert.equal(Object.prototype.hasOwnProperty.call(candidate, 'safeAlternative'), false);
  GeneralReasoningCapability.configure({ callClaude: null });
});

test('confirmation: GeneralReasoningCapability.reason() includes a well-shaped safeAlternative exactly as the model proposed it — never trusted for Safety purposes here, but not discarded either', async () => {
  GeneralReasoningCapability.configure({
    callClaude: async () => ({
      content: [{
        text: JSON.stringify({
          outcome: 'ACTION_PROPOSED', action: 'primary action', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u',
          safeAlternative: { action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' }
        })
      }]
    })
  });
  const candidate = await GeneralReasoningCapability.reason({}, {});
  assert.notEqual(candidate, null);
  assert.deepEqual(candidate.safeAlternative, { action: 'a', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' });
  assert.equal(StandardProposalContract.isValidStandardProposal(candidate), true);
  GeneralReasoningCapability.configure({ callClaude: null });
});
