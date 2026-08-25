// ══════════════════════════════════════════════════════════════════
// FitMe — Internal Pipeline Orchestrator (TASK-004 baseline + TASK-005
// extension, D3 §17 Decision 1 / §6.1)
// אחריות בלעדית: מנגנון ההרצה הפנימי היחיד של ה-Composite Engine — מסנכרן
// את שלבי D2 בין ששת ה-collaborators (Memory Layer, Recommendation Engine,
// Initiative Engine, Decision Engine, Safety Layer, Expression). אינו
// Engine שביעי, אינו נרשם עצמאית, ואינו סמכות תזמור שנייה (D3 §6.1, §11.1).
// אינו מייצר Candidate content, אינו מדרג, אינו בוחר Winner, אינו יוצר
// Terminal Decision — כל אלה שייכים בלעדית ל-collaborator שכבר הוקצה להם.
//
// TASK-004 בנה שניים משישה ה-collaborators (Memory Layer המינימלי,
// Recommendation Engine); TASK-005 מוסיף את השלישי (Initiative Engine).
// TASK-006/SL-001 (כעת סגורים ומאושרים) בנו את ה-Decision Engine וה-Safety
// Layer עצמם; Expression WP1-8 (כעת סגורים) בנו את שכבת ה-Rendering.
//
// Expression WP9 — run() למטה, המורץ בפועל ע"י EngineRegistry ב-APP_READY,
// מחבר כעת את כל שרשרת ה-Stage 1-10 בפועל: לאחר Context Assembly (Stage
// 1-2), הוא קורא ל-runDecisionPass() עם safetyPort: SafetyLayer (הזרקת-
// ייצור רגילה של מודול שכבר קיים, נבדק, ואושר במלואו ב-SL-001 — לא בנייה
// של רכיב חדש; ר' EXPRESSION_IMPLEMENTATION_PLAN.md WP9). אין עדיין מקור
// Opportunity חי (Stage 3/4, Repository Gap G-2, TASK_006_SPEC_v1.0.md §38
// — לא נפתר, ומחוץ לסמכות WP9) — opportunities הוא תמיד [] כאן, כך
// ש-runDecisionPass() פותר באופן תקין וקנוני ל-Decision-Pass-level Silence
// (D2-INV-05), בדיוק כפי ש-run() עשה קודם באופן ידני, רק כעת דרך שרשרת
// ה-Stage 5-9 האמיתית והמאושרת במקום לעקוף אותה. לפני קריאה ל-
// runExpressionStage() מתבצעת בדיקת supersession מוקדמת (D2-EF-07, ר'
// למטה) המשתמשת ב-MemoryLayer בלבד — Expression עצמו אינו מקבל קלט חדש
// ואינו מבצע כל זיהוי משלו. runForOpportunity()/runForInitiativeOpportunity()
// למטה חושפים את Stage 6 עצמו (Recommendation/Initiative בהתאמה) כ-
// collaborator הניתן להפעלה ישירה. detectInitiativeOpportunities() חושף
// את תרומת ה-Initiative Engine ל-Stage 3 — confirmed-pattern anticipation
// ו-disruption/milestone detection בלבד, לעולם לא Decision Window
// (Recommendation Engine contribution) ולא Safety/high-risk (Safety Layer).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var MemoryLayer = (typeof module !== 'undefined' && module.exports)
    ? require('./memoryLayer.js')
    : window.CoachDecisionSystemMemoryLayer;
  var RecommendationEngine = (typeof module !== 'undefined' && module.exports)
    ? require('./recommendationEngine.js')
    : window.RecommendationEngine;
  var InitiativeEngine = (typeof module !== 'undefined' && module.exports)
    ? require('./initiativeEngine.js')
    : window.InitiativeEngine;
  // TASK-006 — Decision Engine's four Stage 5/7/8/9 collaborators (D2 Unit 07), each an internal
  // module of the single Composite Engine, not independently registered (§28.7).
  var EligibilityEvaluator = (typeof module !== 'undefined' && module.exports)
    ? require('./eligibilityEvaluator.js')
    : window.EligibilityEvaluator;
  var Prioritization = (typeof module !== 'undefined' && module.exports)
    ? require('./prioritization.js')
    : window.Prioritization;
  var WinnerSelection = (typeof module !== 'undefined' && module.exports)
    ? require('./winnerSelection.js')
    : window.WinnerSelection;
  var DecisionFormation = (typeof module !== 'undefined' && module.exports)
    ? require('./decisionFormation.js')
    : window.DecisionFormation;
  // SL-001 — Safety Layer's Stage-3 detection contribution (SPEC Ch.9-10), dispatched with the
  // same structure as detectInitiativeOpportunities() below; disqualify()/finalReview() (Stage
  // 8/9) are supplied directly as the safetyPort param by the caller, not required here.
  var SafetyLayer = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyLayer.js')
    : window.SafetyLayer;
  // G-2 (docs/specs/G2_SPEC_v1.0.md §24, AD-G2-02 Item 3) — Stage-4 Evidence Evaluation, an
  // internal Decision Engine component, structurally identical in pattern to EligibilityEvaluator
  // above (not a new Engine/collaborator/Registry entry).
  var EvidenceEvaluator = (typeof module !== 'undefined' && module.exports)
    ? require('./evidenceEvaluator.js')
    : window.EvidenceEvaluator;
  // Expression WP1 (EXPRESSION_IMPLEMENTATION_PLAN.md) — Delivery Intent schema-conformance
  // validator only; no rendering logic exists here or in this module (WP4-WP8).
  var DeliveryIntentContract = (typeof module !== 'undefined' && module.exports)
    ? require('./deliveryIntentContract.js')
    : window.DeliveryIntentContract;
  // Expression WP3 (EXPRESSION_IMPLEMENTATION_PLAN.md) — defensive TerminalDecision validation
  // (EXP-19) and Silence-kind no-output determination (EXP-29/EXP-50) only.
  var ExpressionInputGate = (typeof module !== 'undefined' && module.exports)
    ? require('./expressionInputGate.js')
    : window.ExpressionInputGate;
  // Expression WP4 (remainder, EXPRESSION_IMPLEMENTATION_PLAN.md) / Canonical Decision 8 (D3
  // Decision 7) — schema-conformance validator only for Expression's second declared Stage-10
  // input (EXP-73-78); this module never computes or supplies its value (Memory Layer's own
  // responsibility, memoryLayer.js).
  var ExpressionRenderingContext = (typeof module !== 'undefined' && module.exports)
    ? require('./expressionRenderingContext.js')
    : window.ExpressionRenderingContext;
  // Expression WP9 — the production expressionPort. Required directly here, exactly mirroring
  // how SafetyLayer is already required directly above (an already-built, already-tested,
  // already-approved module, injected at its already-declared extension point) — not a new
  // component, not a new injection mechanism.
  var ExpressionRenderer = (typeof module !== 'undefined' && module.exports)
    ? require('./expressionRenderer.js')
    : window.ExpressionRenderer;

  // Registered as this Composite Engine's `run(ctx)` (B2 EngineRegistry contract) — ctx shape
  // per js/engineRegistry.js: {userId, sessionGeneration, trigger, action, payload, now, runId,
  // dependencies}.
  async function run(ctx) {
    ctx = ctx || {};
    var identity = { userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId };

    var pipelineContext;
    try {
      pipelineContext = await MemoryLayer.assembleContext(identity);
    } catch (e) {
      return { status: 'FAILED', error: { code: 'CONTEXT_ASSEMBLY_FAILED', message: (e && e.message) || 'Memory Layer context assembly failed' } };
    }

    // G-2 (docs/specs/G2_SPEC_v1.0.md §22/§29) — Stage 3 detection -> Stage 3 aggregation
    // (mechanical collection only, §18.2) -> Stage 4 Evidence Evaluation (§24-26) -> Stage 4->5
    // handoff (§27) now runs for real. `opportunities` remains empty on every cycle that produces
    // no sufficient DetectedOpportunity (e.g. no qualifying Habit/Pattern signal this cycle) —
    // runDecisionPass() correctly, canonically resolves that to a Decision-Pass-level Silence
    // (D2-INV-05), a fully-formed, valid outcome, not a failure — exactly as before. The one real
    // V1 path (Habit FOOD_LOGGING WEAKENING, established) now reaches Stage 5 for real; its own
    // approved outcome is INELIGIBLE/TRUST_TEST_UNCERTAIN (Section 22), still Silence overall.
    // safetyPort: SafetyLayer is the real, already-approved SL-001 production implementation.
    var opportunities = buildOpportunitiesForDecisionPass(pipelineContext);
    var passResult = await runDecisionPass({ pipelineContext: pipelineContext, opportunities: opportunities, safetyPort: SafetyLayer });

    if (passResult.status !== 'FORMED') {
      // Defensive only — with opportunities always [], this cannot currently occur (an empty
      // pool always forms Silence, never aborts). Never fabricate a Terminal Decision in its
      // place; report the pass outcome honestly.
      return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], expression: { status: 'NOT_ATTEMPTED', reason: passResult.reason || 'PASS_NOT_FORMED' } } };
    }

    var terminalDecision = passResult.decision;

    // Expression WP9 / D2-EF-07 (Pre-Expression User Correction) — the accepted Architecture
    // investigation's own approved mechanism: an Orchestrator-level, pre-dispatch supersession
    // check, immediately before invoking runExpressionStage(), using freshness/correction-arrival
    // state that originates entirely within the Memory Layer's own Decision-Input-intake
    // ownership (D3 Decision 3) — never inside runExpressionStage() itself, never as a new
    // Expression input, never any detection performed by Expression itself. TerminalDecision is
    // read, never modified. See memoryLayer.js's own header for the honest disclosure that no
    // live Explicit-User-Statement/correction-input channel exists in this repository yet — this
    // check therefore always evaluates "not superseded" in production today, correctly and
    // safely, exactly the same non-blocking-absence pattern already established for G-2 and the
    // Health/Safety Profile source.
    var correctionArrivedAt = MemoryLayer.getExplicitUserStatementArrivalTimestamp(identity);
    var supersededByCorrection = typeof correctionArrivedAt === 'number'
      && typeof pipelineContext.assembledAt === 'number'
      && correctionArrivedAt > pipelineContext.assembledAt;

    if (supersededByCorrection) {
      // Expression withholds by construction (EXP-13) — runExpressionStage() is simply never
      // invoked. The correction itself becomes a new Decision Input for a future cycle
      // (D2-EF-07); this Work Package does not implement that future cycle's own intake, only the
      // withholding guarantee.
      return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], terminalDecision: terminalDecision, expression: { status: 'SUPERSEDED' } } };
    }

    var renderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
    var expressionResult = (renderingContextResult && renderingContextResult.status === 'BUILT')
      ? await runExpressionStage(terminalDecision, renderingContextResult.expressionRenderingContext, ExpressionRenderer)
      : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };

    return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], terminalDecision: terminalDecision, expression: expressionResult } };
  }

  // Direct Stage 6 invocation for a real EligibleOpportunity, once one exists (future Decision
  // Engine, or tests) — not reached from run() above.
  function runForOpportunity(pipelineContext, eligibleOpportunity) {
    return RecommendationEngine.generate({ opportunity: eligibleOpportunity, pipelineContext: pipelineContext });
  }

  // TASK-005 — Stage-6 dispatch for an Initiative-kind Candidate, structurally parallel to
  // runForOpportunity() above but routed to the Initiative Engine (D2 Unit 07: Initiative Engine
  // holds Stage-6 orchestration authority for Initiative-kind Candidates only). Not reached from
  // run() above, for the same reason runForOpportunity() isn't — no real EligibleOpportunity
  // source exists yet (Decision Engine, TASK-006, not built). Exposed for future Decision Engine
  // or tests.
  function runForInitiativeOpportunity(pipelineContext, eligibleOpportunity) {
    return InitiativeEngine.generate({ opportunity: eligibleOpportunity, pipelineContext: pipelineContext });
  }

  // TASK-005 — Stage-3 detection-contribution dispatch (confirmed-pattern anticipation,
  // disruption/milestone detection only — D2 Unit 07). Exposed for future Decision-Engine
  // Opportunity-Detection orchestration, or tests; not reached from run() above (Stage 4/5 do
  // not exist yet, so nothing currently consumes detected Opportunities).
  function detectInitiativeOpportunities(pipelineContext) {
    return InitiativeEngine.detectOpportunities(pipelineContext);
  }

  // SL-001 — Stage-3 detection-contribution dispatch for the Safety Layer (SPEC Ch.9-10, D2 Unit
  // 07), structurally parallel to detectInitiativeOpportunities() above. Exposed for future
  // Decision-Engine Opportunity-Detection orchestration, or tests; not reached from run() above
  // for the same reason detectInitiativeOpportunities() isn't (Stage 4/5 do not exist yet).
  function detectSafetyOpportunities(pipelineContext) {
    return SafetyLayer.detectSafetyOpportunities(pipelineContext);
  }

  // TASK-006 — Stage 6 dispatch for a single already-eligible Opportunity: both producer engines
  // are offered the same EligibleOpportunity, and each engine's own already-approved Stage-6
  // policy gates (source acceptance, Relationship-Maturity gating, suppression, etc. — untouched
  // by TASK-006, §34.10) determine, independently, whether it produces a Candidate or an empty
  // result. This introduces no Stage-3/Stage-6 routing policy of its own (§9.2, §13 item 4) — it
  // never decides which engine "owns" a given Opportunity source; both are simply invoked, per
  // §16.9's "no generator-specific priority shortcut."
  function dispatchStage6(pipelineContext, eligibleOpportunity) {
    var out = [];
    var rec = RecommendationEngine.generate({ opportunity: eligibleOpportunity, pipelineContext: pipelineContext });
    if (rec && Array.isArray(rec.candidates)) out = out.concat(rec.candidates);
    var init = InitiativeEngine.generate({ opportunity: eligibleOpportunity, pipelineContext: pipelineContext });
    if (init && Array.isArray(init.candidates)) out = out.concat(init.candidates);
    return out;
  }

  // G-2 (docs/specs/G2_SPEC_v1.0.md §18) — Stage-3 Aggregation: mechanical collection ONLY. Per
  // §18.2's correction from the prior draft: this step performs NO semantic construction
  // whatsoever — it only collects DetectedOpportunity objects each contributor's own Stage-3
  // function has already fully constructed. It SHALL NOT invent rationale, evidence, confidence,
  // proposedAction, contextualMeaning, or validReasonCategory for any signal a contributor did not
  // itself supply; SHALL NOT perform Eligibility Evaluation, prioritize, select a winner, or
  // produce Expression content.
  //
  // Recommendation Engine's own detectOpportunities() is a real, honestly-empty detector (RG-1,
  // §17.1). Initiative Engine's confirmedPatternAnticipation/disruption/milestoneRecovery buckets
  // remain descriptive-only and are never collected here — no Product Reason Policy rule
  // constructs a DetectedOpportunity for them at this baseline (§21.1); only its
  // semanticOpportunities bucket (§32) ever contains already-complete DetectedOpportunity objects.
  // Safety Layer's detectSafetyOpportunities() is a real, honestly-empty detector at this baseline
  // (no Health/Safety Profile source exists yet, §17.3) — a Safety-sourced detection's
  // safetyHighRiskBypass:true status is preserved unconditionally through this collection step
  // (G2-RA-05 corrected wording) since no field of any collected object is altered here.
  function collectDetectedOpportunities(pipelineContext) {
    var out = [];
    var recDetections = RecommendationEngine.detectOpportunities(pipelineContext);
    if (Array.isArray(recDetections)) out = out.concat(recDetections);

    var initDetections = InitiativeEngine.detectOpportunities(pipelineContext);
    if (initDetections && Array.isArray(initDetections.semanticOpportunities)) {
      out = out.concat(initDetections.semanticOpportunities);
    }

    var safetyDetections = SafetyLayer.detectSafetyOpportunities(pipelineContext);
    if (Array.isArray(safetyDetections)) out = out.concat(safetyDetections);

    return out;
  }

  // G-2 (docs/specs/G2_SPEC_v1.0.md §27) — Stage 4->5 Handoff, mechanical construction. Called
  // only on a DetectedOpportunity that already carries a non-null validReasonCategory and a
  // fully-formed trustTestSignal (§21.1 guarantees no DetectedOpportunity is ever constructed at
  // all when the Product Reason Policy resolves NO_VALID_REASON — §18's aggregation step above
  // never collects, and this function is therefore never called on, a semantically-incomplete
  // Opportunity). Performs no semantic invention and no defaulting — a pure field-selection copy
  // from an already-complete DetectedOpportunity into the two existing, unmodified downstream
  // contracts (AD-G2-02 Item 2, restated: grants the Decision Engine no Stage-3 detection
  // authority, no D1 Evidence-policy ownership, and no authority to invent
  // validReasonCategory/trustTestSignal values).
  //
  // G-2 Engineering Readiness Review finding: lifeEventContext/capacityState are always null at
  // this baseline (Life Event/Capacity acquisition is explicitly out of scope, §8 item 5,
  // memoryLayer.js) — lowCoachingValuePeriodActive is therefore constructed directly as false,
  // per the existing T006 §15.3 rule ("defaults to false only when both are structurally
  // UNAVAILABLE"), never as an illustrative ternary that could emit undefined and trip
  // eligibilityEvaluator.js's own strict boolean requirement (validateInput(), line ~79). This
  // does not implement Life Event Context or Capacity State acquisition — it remains hardcoded
  // false, correctly, until that separate, out-of-scope Future Item is ever approved.
  function buildEligibilityAndCandidateInputs(d, pipelineContext) {
    var eligibilityInput = {
      id: d.id,
      sourceCategory: d.sourceCategory,
      validReasonCategory: d.validReasonCategory, // always non-null here — see above
      trustTestSignal: d.trustTestSignal,          // always {glad, basis} — see above
      lowCoachingValuePeriodActive: false,
      safetyHighRiskBypass: d.safetyHighRiskBypass === true
    };
    return { eligibilityInput: eligibilityInput, eligibleOpportunity: d };
  }

  // G-2 (docs/specs/G2_SPEC_v1.0.md §29) — orchestrates Stage 3 detection (collectDetectedOpportunities
  // above) -> Stage 4 Evidence Evaluation (§24-26) -> Stage 4->5 handoff (buildEligibilityAndCandidateInputs
  // above), producing the exact `opportunities` array runDecisionPass() already expects
  // (unchanged shape). A safetyHighRiskBypass:true DetectedOpportunity routes around Stage 4
  // entirely (D1-OD-04/D2-EF-01(a); §18.2) — EvidenceEvaluator.evaluate() is never called for it.
  // An INSUFFICIENT DetectedOpportunity is excluded here — it never reaches Stage 5 (§26); no
  // fabricated Silence or synthetic outcome is created for it, it is simply not included in the
  // array runDecisionPass() iterates.
  function buildOpportunitiesForDecisionPass(pipelineContext) {
    var detected = collectDetectedOpportunities(pipelineContext);
    var out = [];
    detected.forEach(function (d) {
      if (!d) return;
      if (d.safetyHighRiskBypass === true) {
        out.push(buildEligibilityAndCandidateInputs(d, pipelineContext));
        return;
      }
      var evidence;
      try {
        evidence = EvidenceEvaluator.evaluate(d);
      } catch (e) {
        return; // defensive — never fabricate SUFFICIENT on a thrown evaluation (§26/§37)
      }
      if (!evidence || evidence.outcome !== 'SUFFICIENT') return; // §26 — INSUFFICIENT never reaches Stage 5
      out.push(buildEligibilityAndCandidateInputs(d, pipelineContext));
    });
    return out;
  }

  // TASK-006 — Decision Engine entry point: Stage 5 (Eligibility Evaluation) -> Stage 6 dispatch
  // (existing runForOpportunity/runForInitiativeOpportunity pattern, per-Opportunity) -> Stage 7
  // (Candidate Pool Assembly + Prioritization) -> Stage 8 (Winner Selection) -> Stage 9 (Decision
  // Formation), producing exactly one Terminal Decision (D2 Unit 02, Canonical Decision 1) or an
  // explicit Pipeline Abort (§31). Expression WP9 — now reached from run() above, always with
  // opportunities: [] (no live Stage 3/4 Opportunity source exists yet, Repository Gap G-2,
  // non-blocking, §9.2/§38, not this Work Package's scope) — an empty pool always, correctly
  // resolves to a Decision-Pass-level Silence (D2-INV-05), never a Pipeline Abort. Also exposed
  // as a direct dispatch function for a future Stage 3/4 caller with real Opportunities, or
  // tests, structurally parallel to runForOpportunity/runForInitiativeOpportunity (§28.10).
  //
  // params.opportunities: array of { eligibilityInput: OpportunityEligibilityInput (§15.11),
  // eligibleOpportunity: EligibleOpportunity (Stage-6 input, existing shape) }.
  // params.pipelineContext, params.safetyPort (SafetyIntegrationPort, §21.8).
  async function runDecisionPass(params) {
    params = params || {};
    var pipelineContext = params.pipelineContext;
    var opportunities = Array.isArray(params.opportunities) ? params.opportunities : [];
    var safetyPort = params.safetyPort;

    var opportunitiesConsidered = [];
    var candidateLists = [];

    for (var i = 0; i < opportunities.length; i++) {
      var entry = opportunities[i] || {};
      var eligibilityInput = entry.eligibilityInput;
      var eligibleOpportunity = entry.eligibleOpportunity;

      // §15.5/§21.1 — a safety/high-risk-triggered Opportunity bypasses Stage 5 entirely.
      if (eligibilityInput && eligibilityInput.safetyHighRiskBypass === true) {
        opportunitiesConsidered.push({
          opportunityId: eligibilityInput.id,
          sourceCategory: eligibilityInput.sourceCategory,
          internalOutcome: 'SAFETY_BYPASS'
        });
        candidateLists.push(dispatchStage6(pipelineContext, eligibleOpportunity));
        continue;
      }

      var elig = EligibilityEvaluator.evaluate(eligibilityInput);
      opportunitiesConsidered.push({
        opportunityId: eligibilityInput && eligibilityInput.id,
        sourceCategory: eligibilityInput && eligibilityInput.sourceCategory,
        internalOutcome: elig.outcome,
        reason: elig.reason
      });

      if (elig.outcome !== 'ELIGIBLE') continue; // §23.1/23.2 — internal Silence, no Stage 6 dispatch

      candidateLists.push(dispatchStage6(pipelineContext, eligibleOpportunity));
    }

    var assembly = Prioritization.assemblePool(candidateLists);
    var pool = assembly.pool;

    if (pool.length === 0) {
      return DecisionFormation.formDecisionPassSilence({ opportunitiesConsidered: opportunitiesConsidered });
    }

    var rankedPool = Prioritization.rank(pool);
    var selection = await WinnerSelection.select({ rankedPool: rankedPool, pipelineContext: pipelineContext, safetyPort: safetyPort });

    return DecisionFormation.form({
      selection: selection,
      pipelineContext: pipelineContext,
      safetyPort: safetyPort,
      opportunitiesConsidered: opportunitiesConsidered,
      candidatePoolSize: pool.length
    });
  }

  // Expression WP2 (EXPRESSION_IMPLEMENTATION_PLAN.md WP2) — Stage 10 dispatch. Resolves EXP-OD-3
  // (dispatch mechanism, EXP-08) as a SEPARATE function, structurally parallel to
  // runForOpportunity/runForInitiativeOpportunity/runDecisionPass above — NOT as an internal
  // extension of runDecisionPass()'s own call chain. Chosen specifically to preserve
  // runDecisionPass()'s existing, already-tested TerminalDecision-only return contract completely
  // unchanged (tests/internalPipelineOrchestrator.test.js asserts .decision directly in multiple
  // places); modifying that contract, even additively, is not required to satisfy EXP-08/D3 §17
  // Decision 1 and would introduce avoidable risk to an already-approved contract.
  //
  // A caller invokes this only after separately obtaining a FORMED TerminalDecision from
  // runDecisionPass()/DecisionFormation — this function takes the bare TerminalDecision itself
  // (EXPRESSION_SPEC_v1.0.md §10), not the {status, decision} wrapper; unwrapping and confirming
  // status === 'FORMED' remains the caller's own responsibility, not this function's. run() above
  // (Expression WP9) is now exactly such a caller, in production.
  //
  // expressionPort is an injected dependency (mirrors the existing safetyPort pattern, §21.8) —
  // run() above now supplies the real, already-built ExpressionRenderer (WP4-WP8, closed) as this
  // port in production; production SHALL NOT proceed without one, per the same abort-rather-than-
  // fabricate discipline already established for SAFETY_LAYER_UNAVAILABLE above (D1-DI-02/D3
  // §12.3). Silence-kind input handling (EXP-29), defensive input validation (EXP-19), and all
  // rendering content (REFUSAL/ESCALATION/disclosure/ordinary rendering) belong entirely to the
  // expressionPort implementation (expressionRenderer.js) — this function performs no
  // interpretation of terminalDecision's own content, only dispatch and schema-conformance
  // verification (EXP-OD-9, via WP1's own DeliveryIntentContract.isValidDeliveryIntent).
  //
  // expressionRenderingContext (WP4 remainder, Canonical Decision 8; D3 Decision 7, extending
  // Decision 3) is Expression's second declared Stage-10 input — a narrow, closed,
  // Memory-Layer-produced artifact (EXPRESSION_SPEC_v1.0.md §10.1, EXP-73-78), passed through to
  // expressionPort.render() unchanged, after this function's own schema-conformance check
  // (ExpressionRenderingContext.isValidExpressionRenderingContext). This function neither computes
  // nor supplies its value — only the Memory Layer does (memoryLayer.js's own
  // buildExpressionRenderingContext()); the caller is responsible for obtaining it from there
  // before invoking this function, exactly as it already is for terminalDecision.
  //
  // Expression remains an internal collaborator of the single registered coachDecisionSystem
  // Composite Engine (D3 §17 Decision 1) — no new B2 Engine Registry entry, no new trigger type;
  // js/engineRegistry.js and registerCoachDecisionSystem.js are unchanged by this addition.
  async function runExpressionStage(terminalDecision, expressionRenderingContext, expressionPort) {
    // Expression WP3 — defensive input validation (EXP-19) precedes everything else, including
    // the port-availability check: an invalid TerminalDecision is a failure condition regardless
    // of whether a real Expression implementation exists to (not) render it (§19 exceptional-flow
    // table: "TerminalDecision fails ... defensive validation" -> "No Delivery Intent fabricated").
    if (!ExpressionInputGate.isValidTerminalDecision(terminalDecision)) {
      return { status: 'ABORTED', reason: 'INVALID_TERMINAL_DECISION' };
    }

    // Expression WP3 — Silence-kind no-output (EXP-29/EXP-50): both origins (zero-Candidates and
    // Safety-DEFERRED, TASK_006_SPEC_v1.0.md §25.12) are represented identically as kind:
    // 'SILENCE' and are never even offered to expressionPort — Expression produces no output for
    // either case, unconditionally, not contingent on what a port implementation might decide.
    if (ExpressionInputGate.isSilenceKind(terminalDecision)) {
      return { status: 'NO_DELIVERY_INTENT' };
    }

    // Expression WP4 (remainder) / Canonical Decision 8 — defensive validation of Expression's
    // second declared Stage-10 input (EXP-77), performed here at the dispatch boundary, mirroring
    // EXP-19's discipline for TerminalDecision above and DeliveryIntentContract's own schema check
    // below. A Silence-kind decision never reaches this check (no rendering occurs at all), so no
    // Expression Rendering Context is required for it.
    if (!ExpressionRenderingContext.isValidExpressionRenderingContext(expressionRenderingContext)) {
      return { status: 'ABORTED', reason: 'INVALID_EXPRESSION_RENDERING_CONTEXT' };
    }

    if (!expressionPort || typeof expressionPort.render !== 'function') {
      // Mirrors SAFETY_LAYER_UNAVAILABLE (runDecisionPass, above): production never fabricates a
      // Delivery Intent in place of a real, unavailable Expression implementation.
      return { status: 'ABORTED', reason: 'EXPRESSION_PORT_UNAVAILABLE' };
    }

    var deliveryIntent;
    try {
      deliveryIntent = await expressionPort.render(terminalDecision, expressionRenderingContext);
    } catch (e) {
      return { status: 'ABORTED', reason: 'EXPRESSION_RENDER_THREW' };
    }

    // A port may correctly produce no Delivery Intent (e.g. a Silence-kind TerminalDecision, per
    // EXP-29/EXP-50) — null/undefined is a valid, not an erroneous, outcome; this function does
    // not itself decide when that is correct (WP3's own scope), only accepts it when returned.
    if (deliveryIntent === null || typeof deliveryIntent === 'undefined') {
      return { status: 'NO_DELIVERY_INTENT' };
    }

    if (!DeliveryIntentContract.isValidDeliveryIntent(deliveryIntent)) {
      // EXPRESSION_IMPLEMENTATION_PLAN.md WP2's own WP1 dependency: Expression's dispatch must
      // return a schema-conformant Delivery Intent — never pass a malformed object through.
      return { status: 'ABORTED', reason: 'INVALID_DELIVERY_INTENT' };
    }

    return { status: 'DISPATCHED', deliveryIntent: deliveryIntent };
  }

  var API = {
    run: run,
    runForOpportunity: runForOpportunity,
    runForInitiativeOpportunity: runForInitiativeOpportunity,
    detectInitiativeOpportunities: detectInitiativeOpportunities,
    detectSafetyOpportunities: detectSafetyOpportunities,
    runDecisionPass: runDecisionPass,
    runExpressionStage: runExpressionStage,
    // G-2 (docs/specs/G2_SPEC_v1.0.md §18/§27/§29) — exposed for direct unit/integration testing,
    // structurally parallel to the other direct-dispatch exports above.
    collectDetectedOpportunities: collectDetectedOpportunities,
    buildEligibilityAndCandidateInputs: buildEligibilityAndCandidateInputs,
    buildOpportunitiesForDecisionPass: buildOpportunitiesForDecisionPass
  };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemOrchestrator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
