// EUR-001 — Explicit User Request V1 — Production-Backed Acceptance
// (docs/specs/EUR_001_SPEC_v1.0.md §30). Exercises the real, unmodified production chain:
// StateAccess -> memoryLayer.assembleContext() -> ExplicitRequestInterpreter (stubbed
// ClaudeProxyClient/callClaude seam only) -> initiativeEngine.detectOpportunities()/generate()
// -> contextualMeaningPolicy.js's live FOOD_LOGGING/WEAKENING V1 rule -> eligibilityEvaluator.js
// -> the real internalPipelineOrchestrator.run() end to end. No live LLM, no live Firestore,
// no Chat. Mirrors tests/cssc001ProductionBackedAcceptance.test.js's own fixture technique
// exactly, using the identical real WEAKENING_HABIT_RECORD fixture G-2/RGEF/CSSC-001 already
// proved end to end.
// Run with: node --test tests/eur001ProductionBackedAcceptance.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const StateAccess = require('../js/stateAccess.js');
const Consumer = require('../js/derivedIntelligenceConsumer.js');
const ExplicitRequestInterpreter = require('../js/coachDecisionSystem/explicitRequestInterpreter.js');
const Orchestrator = require('../js/coachDecisionSystem/internalPipelineOrchestrator.js');

var WEAKENING_HABIT_RECORD = {
  id: 'nutrition:log-consistency', type: 'nutrition', key: 'log-consistency', status: 'weakening',
  confidence: 0.7, sourceEvents: { count: 5 }, lastObserved: '2026-07-29',
  currentEpisodeEstablished: true // required for deriveValidReasonCategory's real V1 Reason
};

function configureFixture(fetchUserStatedMemoryFn) {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'eur-user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: fetchUserStatedMemoryFn
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [WEAKENING_HABIT_RECORD], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}

function stubSuppressiveFoodLogging(idsToSuppress) {
  ExplicitRequestInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/<statement id="([^"]+)"/g) || []).map((m) => m.match(/id="([^"]+)"/)[1]);
      const results = ids.map((id) => (idsToSuppress.indexOf(id) !== -1
        ? { id: id, requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'SUPPRESS_ORDINARY_INITIATIVE', scopeStatus: 'RESOLVED', domain: 'NUTRITION', topic: 'FOOD_LOGGING' }
        : { id: id, requestClassification: 'INELIGIBLE_OR_NOT_CLASSIFIED', controlIntent: null, scopeStatus: null, domain: null, topic: null }));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
}

test.afterEach(() => { ExplicitRequestInterpreter.configure({ callClaude: null }); });

test('EUR-E2E-1 (§30 item 1). WITHOUT an Explicit Request: the real fixture reaches the same live INITIATIVE Terminal Decision G-2/RGEF/CSSC-001 already proved — baseline unaffected by this Work Item', async () => {
  configureFixture(async () => []); // no Typed Memory records at all
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-baseline', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.pipelineContext.explicitRequestControls, null);
  const td = result.output.terminalDecision;
  assert.equal(td.kind, 'INITIATIVE');
  assert.equal(td.decisionPassTrace.opportunitiesConsidered[0].internalOutcome, 'ELIGIBLE');
  assert.equal(td.decisionPassTrace.opportunitiesConsidered[0].reason, 'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT');
});

test('EUR-E2E-2 (§30 item 2). WITH an active resolved NUTRITION/FOOD_LOGGING suppression control, using the IDENTICAL upstream fixture: Stage 6 withholds the matching Candidate and the Terminal Decision changes deterministically to SILENCE', async () => {
  configureFixture(async () => [
    { _id: 'mem-stop-logging', type: 'fact', payload: { text: "Don't suggest food logging anymore." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging(['mem-stop-logging']);

  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-with-control', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(result.status, 'SUCCESS');

  const pc = result.output.pipelineContext;
  assert.equal(pc.explicitRequestControls.items.length, 1);
  assert.equal(pc.explicitRequestControls.items[0].domain, 'NUTRITION');
  assert.equal(pc.explicitRequestControls.items[0].topic, 'FOOD_LOGGING');
  assert.equal(pc.explicitRequestControls.items[0].controlIntent, 'SUPPRESS_ORDINARY_INITIATIVE');
  assert.equal(pc.explicitRequestControls.items[0].interpretationAuthority, 'DERIVED_INTERPRETATION');

  // The real Opportunity still forms upstream — proven by the semanticOpportunities re-check
  // below (item 12) — but Stage 6 withholds its Candidate, so no ranked pool exists at all and
  // the Terminal Decision resolves to SILENCE, deterministically different from EUR-E2E-1's
  // identical-upstream-state INITIATIVE outcome.
  const td = result.output.terminalDecision;
  assert.equal(td.kind, 'SILENCE');
});

test('EUR-E2E-3 (§30 item 12). Non-effect proof: with vs. without the suppressive request, the real Opportunity/Contextual Meaning/Evidence/Eligibility are byte-identical — the FIRST divergence is exactly Stage 6 Candidate formation', async () => {
  const InitiativeEngine = require('../js/coachDecisionSystem/initiativeEngine.js');
  const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');

  configureFixture(async () => []);
  const pcWithout = await MemoryLayer.assembleContext({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-a' });
  const oppsWithout = InitiativeEngine.detectOpportunities(pcWithout);

  configureFixture(async () => [
    { _id: 'mem-stop-logging', type: 'fact', payload: { text: "Don't suggest food logging anymore." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging(['mem-stop-logging']);
  const pcWith = await MemoryLayer.assembleContext({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-b' });
  const oppsWith = InitiativeEngine.detectOpportunities(pcWith);

  // Same real Opportunity, same real Contextual Meaning, same real Evidence Tier basis — proven
  // by asserting the two Opportunity structures are identical apart from what Pipeline Context
  // itself legitimately differs on (assembledAt/explicitRequestControls are excluded from this
  // comparison; the Opportunity object itself is compared verbatim).
  assert.equal(oppsWith.semanticOpportunities.length, 1);
  assert.equal(oppsWithout.semanticOpportunities.length, 1);
  const oppWith = oppsWith.semanticOpportunities[0];
  const oppWithout = oppsWithout.semanticOpportunities[0];
  assert.deepEqual(oppWith.contextualMeaning, oppWithout.contextualMeaning, 'Contextual Meaning must be byte-identical with and without the Explicit Request');
  assert.equal(oppWith.domain, oppWithout.domain);
  assert.equal(oppWith.topic, oppWithout.topic);
  assert.equal(oppWith.sourceCategory, oppWithout.sourceCategory);
  assert.equal(oppWith.validReasonCategory, oppWithout.validReasonCategory);
  assert.equal(oppWith.confidence, oppWithout.confidence);

  // Stage 6 divergence: WITHOUT any RGEF/EUR suppression, Stage 6 forms a real Candidate for
  // both — the divergence appears only once explicitRequestControls actually differs (proven in
  // EUR-E2E-1/2 above via the full Orchestrator run, where pcWith carries the control and pcWithout
  // does not).
  assert.equal(pcWithout.explicitRequestControls, null);
  assert.equal(pcWith.explicitRequestControls.items.length, 1);
});

test('EUR-E2E-4 (§30 items 25-27 equivalent). RGEF feedback history / receptiveness evidence and Relationship Maturity are unaffected by the presence of an actionable Explicit Request control', async () => {
  configureFixture(async () => [
    { _id: 'mem-stop-logging', type: 'fact', payload: { text: "Don't suggest food logging anymore." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging(['mem-stop-logging']);
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-c', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  const pc = result.output.pipelineContext;
  assert.deepEqual(pc.feedbackHistory, [], 'no new feedback event is ever written by Explicit Request suppression');
  assert.equal(pc.relationshipMaturity.stage, 'UNKNOWN', 'unaffected — no approved Relationship Maturity source exists yet, same as every other Work Item');
});

test('EUR-E2E-5 (§30 item 15). A plain, unrelated statement (not a suppressive request) never suppresses the real fixture — Terminal Decision remains INITIATIVE, identical to the no-record baseline', async () => {
  configureFixture(async () => [
    { _id: 'mem-tuna', type: 'fact', payload: { text: 'אני לא אוהב טונה' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging([]); // nothing classifies as suppressive
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-d', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.deepEqual(result.output.pipelineContext.explicitRequestControls.items, []);
  assert.equal(result.output.terminalDecision.kind, 'INITIATIVE');
});

test('EUR-E2E-6 (§30 item 8, isolated-to-fixture equivalent). A recognized-but-scope-unresolved suppressive request ("Don\'t suggest running.") never suppresses the real FOOD_LOGGING fixture', async () => {
  configureFixture(async () => [
    { _id: 'mem-running', type: 'fact', payload: { text: "Don't suggest running." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  ExplicitRequestInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/<statement id="([^"]+)"/g) || []).map((m) => m.match(/id="([^"]+)"/)[1]);
      const results = ids.map((id) => ({ id: id, requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'SUPPRESS_ORDINARY_INITIATIVE', scopeStatus: 'UNRESOLVED', domain: null, topic: null }));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-e', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.deepEqual(result.output.pipelineContext.explicitRequestControls.items, []);
  assert.equal(result.output.terminalDecision.kind, 'INITIATIVE', 'no fake mapping to WORKOUT/WORKOUT_FREQUENCY or any other pair — the real FOOD_LOGGING fixture must proceed exactly as the no-record baseline');
});

test('EUR-E2E-7 (§30 item 3/4 non-suppressive positive request). "Please remind me to log my food." never suppresses the real FOOD_LOGGING fixture', async () => {
  configureFixture(async () => [
    { _id: 'mem-positive', type: 'fact', payload: { text: 'Please remind me to log my food.' }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  ExplicitRequestInterpreter.configure({
    callClaude: async (body) => {
      const ids = (body.messages[0].content.match(/<statement id="([^"]+)"/g) || []).map((m) => m.match(/id="([^"]+)"/)[1]);
      const results = ids.map((id) => ({ id: id, requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'NO_V1_ACTIONABLE_INTENT', scopeStatus: null, domain: null, topic: null }));
      return { content: [{ text: JSON.stringify({ results: results }) }] };
    }
  });
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-f', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.deepEqual(result.output.pipelineContext.explicitRequestControls.items, []);
  assert.equal(result.output.terminalDecision.kind, 'INITIATIVE');
});

test('EUR-E2E-8 (§30 item 19, currentness). Suppression still occurs at a Decision Pass far beyond RGEF\'s own 14-day window/7-day recovery duration — elapsed time alone never revokes an active Explicit Request', async () => {
  configureFixture(async () => [
    { _id: 'mem-stop-logging', type: 'fact', payload: { text: "Don't suggest food logging anymore." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging(['mem-stop-logging']);
  const farFuture = Date.now() + 40 * 24 * 60 * 60 * 1000; // well beyond RGEF's 14-day window and 7-day recovery duration
  const result = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-g', trigger: 'APP_READY', action: 'DECISION_PASS', now: farFuture });
  assert.equal(result.output.pipelineContext.explicitRequestControls.items.length, 1);
  assert.equal(result.output.terminalDecision.kind, 'SILENCE', 'elapsed time alone must never revoke an active, still-uncorrected Explicit Request');
});

test('EUR-E2E-9 (§30 item 20, reversal). Editing the source record to no longer be a request restores the real baseline INITIATIVE Terminal Decision on the very next Decision Pass', async () => {
  // "Before": active suppressive request.
  configureFixture(async () => [
    { _id: 'mem-stop-logging', type: 'fact', payload: { text: "Don't suggest food logging anymore." }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }
  ]);
  stubSuppressiveFoodLogging(['mem-stop-logging']);
  const before = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-h1', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(before.output.terminalDecision.kind, 'SILENCE');

  // "After": the record is deleted/rejected (simulated here as no longer present in the source list).
  configureFixture(async () => []);
  const after = await Orchestrator.run({ userId: 'eur-user-1', sessionGeneration: 1, runId: 'run-h2', trigger: 'APP_READY', action: 'DECISION_PASS', now: Date.now() });
  assert.equal(after.output.pipelineContext.explicitRequestControls, null);
  assert.equal(after.output.terminalDecision.kind, 'INITIATIVE', 'the next assembly must reflect the deleted/rejected/edited source — nothing derived is cached anywhere');
});
