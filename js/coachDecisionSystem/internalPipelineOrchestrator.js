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
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §19) — CARF Ch.08/09's bounded reasoning component,
  // instantiated for this vertical. Required directly here, mirroring SafetyLayer/ExpressionRenderer
  // above — invoked only by the new, narrowly-scoped reasoning step inside runDecisionPass() below,
  // active only for validReasonCategory === 'ADAPT_TO_CURRENT_STATE'.
  var TrainingReadinessReasoningComponent = (typeof module !== 'undefined' && module.exports)
    ? require('./trainingReadinessReasoningComponent.js')
    : window.TrainingReadinessReasoningComponent;
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §20) — the sole, deterministic producer of
  // actionIdentity from an open activityReference. The reasoning component's own output schema
  // carries no actionIdentity field at all (TDP's non-negotiable item 18) — this module is what
  // actually computes it, downstream, never the model.
  var ActivityReferenceNormalizer = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/activityReferenceNormalizer.js')
    : window.ActivityReferenceNormalizer;
  // WP0 Phase B (docs/specs/WP0_SPEC_v1.0.md §20) — TRR's reasoning-context acquisition now
  // routes through CapabilityRegistry/ContextComposer via this adapter instead of calling
  // MemoryLayer.buildTrainingReadinessReasoningContext() directly. The reasoning-invocation
  // gate itself (validReasonCategory === 'ADAPT_TO_CURRENT_STATE', below) is unchanged — this
  // is a context-acquisition migration only, never a change to when reasoning is invoked, per
  // WP0's own binding scope for this Phase.
  var TrrCapabilityAdapter = (typeof module !== 'undefined' && module.exports)
    ? require('./trrCapabilityAdapter.js')
    : window.TrrCapabilityAdapter;
  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §04) — bounded Turn Understanding, invoked only on
  // the new DIRECT_TURN_PASS action path (runDirectTurnPass() below); never reached from the
  // existing APP_READY/DECISION_PASS path above, which supplies no CurrentUserTurn at all.
  var TurnUnderstandingInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./turnUnderstandingInterpreter.js')
    : window.TurnUnderstandingInterpreter;
  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §06) — the fifth Stage-3 contributor, dispatched
  // only from runDirectTurnPass() below, structurally parallel to how SafetyLayer/InitiativeEngine
  // are already required directly above.
  var ConversationalNeedCreator = (typeof module !== 'undefined' && module.exports)
    ? require('./conversationalNeedCreator.js')
    : window.ConversationalNeedCreator;
  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §9/§10) — two new, narrow collaborators, dispatched
  // only from runDirectTurnPass() below, in parallel with TurnUnderstandingInterpreter/
  // ConversationalNeedCreator above — never gated on, and never gating, Need recognition.
  var ExplicitPreferenceStatementInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./explicitPreferenceStatementInterpreter.js')
    : window.ExplicitPreferenceStatementInterpreter;
  var PreferenceIntakeGate = (typeof module !== 'undefined' && module.exports)
    ? require('./preferenceIntakeGate.js')
    : window.PreferenceIntakeGate;
  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — two new, narrow collaborators, dispatched only
  // from runDirectTurnPass() below, in parallel with TurnUnderstandingInterpreter/
  // ConversationalNeedCreator/ExplicitPreferenceStatementInterpreter/PreferenceIntakeGate above —
  // never gated on, and never gating, Need recognition or CPI's own preference intake.
  var UserDisclosureRecognizer = (typeof module !== 'undefined' && module.exports)
    ? require('./userDisclosureRecognizer.js')
    : window.UserDisclosureRecognizer;
  var SafetyDisclosureIntakeGate = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyDisclosureIntakeGate.js')
    : window.SafetyDisclosureIntakeGate;
  // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15/§22) — two new,
  // narrow collaborators, dispatched only from runDirectTurnPass() below, in parallel with
  // UserDisclosureRecognizer/SafetyDisclosureIntakeGate above — never gated on, and never gating,
  // Need recognition, CPI's own preference intake, or Item 6's own disclosure track.
  var RiskCharacteristicInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicInterpreter.js')
    : window.RiskCharacteristicInterpreter;
  var RiskCharacteristicIntakeGate = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicIntakeGate.js')
    : window.RiskCharacteristicIntakeGate;
  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §14 step 3) — the new memoryLayer/
  // PREFERENCE_CONSENT_READ StateAccess capability-holder identity, a sibling to the existing
  // memoryLayer identities (user-stated-memory / recent-conversation) MemoryLayer.js itself
  // already uses — required directly here (not through MemoryLayer) since this single,
  // narrow boolean read is consumed only by PreferenceIntakeGate.authorize(), never by Pipeline
  // Context assembly itself (CD-02-style discipline: a narrow, purpose-specific read, not a
  // widening of an existing capability grant).
  var StateAccess = (typeof module !== 'undefined' && module.exports)
    ? require('../stateAccess.js')
    : window.StateAccess;

  // Registered as this Composite Engine's `run(ctx)` (B2 EngineRegistry contract) — ctx shape
  // per js/engineRegistry.js: {userId, sessionGeneration, trigger, action, payload, now, runId,
  // dependencies}.
  async function run(ctx) {
    ctx = ctx || {};
    var identity = { userId: ctx.userId, sessionGeneration: ctx.sessionGeneration, runId: ctx.runId };

    // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §03) — a distinct action, DIRECT_TURN_PASS (never
    // DECISION_PASS), branched on additively, before any of the existing APP_READY/DECISION_PASS
    // logic below — which remains fully untouched, byte-identical, for every other action value
    // (including the existing implicit APP_READY dispatch, which never sets ctx.action to this
    // value).
    if (ctx.action === 'DIRECT_TURN_PASS') {
      return runDirectTurnPass(ctx, identity);
    }

    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §14 step 11-13) — a second, distinct, additively-
    // branched action value, mirroring DIRECT_TURN_PASS's own precedent exactly: branched on
    // before any of the existing APP_READY/DECISION_PASS/DIRECT_TURN_PASS logic, which remains
    // fully untouched for every other action value.
    if (ctx.action === 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE') {
      return runPreferenceAcknowledgmentFinalization(ctx, identity);
    }

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

  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — applies a synchronous (non-deferred) disclosure
  // acknowledgment onto whatever decision this Decision Pass already produced this turn (or
  // builds a standalone ACKNOWLEDGED_DISCLOSURE when none exists / the only decision is SILENCE)
  // — mirrors runPreferenceAcknowledgmentFinalization()'s own standalone-vs-attach branching
  // exactly (decisionFormation.js:387-393), reused here for the case that needs no deferral at
  // all (acknowledgement without capture has nothing async to wait for). A no-op (returns
  // baseDecision unchanged) whenever no disclosure was recognized, or capture was authorized (in
  // which case Unified Finalization handles it instead, after persistence resolves).
  function applyDisclosureAcknowledgmentIfNeeded(baseDecision, disclosureRecognizedOnly, category) {
    if (!disclosureRecognizedOnly) return baseDecision;
    var ack = { category: category, capturedToMemory: false, safetyRelevant: false };
    if (!baseDecision || baseDecision.kind === 'SILENCE') {
      return DecisionFormation.formAcknowledgedDisclosureOutcome(ack).decision;
    }
    return DecisionFormation.attachSecondaryDisclosureAcknowledgment(baseDecision, ack);
  }

  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §03/§04/§06/§07/§10/§12) — the DIRECT_TURN_PASS
  // action path, dispatched only from run() above when ctx.action === 'DIRECT_TURN_PASS'. Reuses
  // every existing Stage 4-10 mechanism completely unmodified (buildOpportunitiesForDecisionPass,
  // runDecisionPass, runExpressionStage — the same functions the APP_READY path above already
  // calls); the only new logic here is: (a) threading the CurrentUserTurn into Context Assembly
  // (§11), (b) the new Stage-3 Turn Understanding / Need Creator steps (§04/§06), and (c) the new,
  // narrow UNSUPPORTED dispatch (§12) for the one outcome that never reaches Stage 4 at all.
  async function runDirectTurnPass(ctx, identity) {
    var turn = ctx.payload && ctx.payload.turn;
    if (!turn || typeof turn.turnId !== 'string' || turn.turnId.length === 0) {
      // Defensive only — runUserMessageEngine() (§03, app.js) never constructs a payload without
      // a valid turn; never fabricate a Decision Pass output for a malformed one.
      return { status: 'FAILED', error: { code: 'INVALID_TURN', message: 'DIRECT_TURN_PASS requires a valid turn payload' } };
    }

    var pipelineContext;
    try {
      // §11 — the additive second parameter; this is the ONLY call site in this file that ever
      // supplies it. The existing APP_READY call above (MemoryLayer.assembleContext(identity))
      // remains byte-identical.
      pipelineContext = await MemoryLayer.assembleContext(identity, turn);
    } catch (e) {
      return { status: 'FAILED', error: { code: 'CONTEXT_ASSEMBLY_FAILED', message: (e && e.message) || 'Memory Layer context assembly failed' } };
    }

    // §04 — Bounded Turn Understanding. Never throws (classify() itself is fail-closed by
    // contract); the defensive catch below exists only for symmetry with every other collaborator
    // call in this file, never because classify() is known to throw.
    // CCC-001 (docs/specs/CCC_001_SPEC_v1.0.md §10.1) — pipelineContext.recentConversationContext
    // (already assembled by MemoryLayer.assembleContext() above) is threaded through as an
    // additive second argument — undefined/null when unavailable, in which case classify()
    // behaves byte-identically to its pre-CCC-001 contract.
    var turnUnderstanding;
    try {
      turnUnderstanding = await TurnUnderstandingInterpreter.classify(turn, pipelineContext.recentConversationContext);
    } catch (e) {
      turnUnderstanding = TurnUnderstandingInterpreter._internal.failedResult();
    }

    // §06 — Conversational Need Creator, Step A (domain-agnostic Need recognition) + Step B
    // (professional-capability resolution), a single combined call per its own contract. Returns
    // null for §17 Case A (no request) / Case C (interpretation failure) — neither ever produces
    // a Need — or {kind: 'DETECTED_OPPORTUNITY', opportunity} / {kind: 'UNSUPPORTED', need}.
    var needCreatorResult = ConversationalNeedCreator.recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext);

    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §9/§10/§14 steps 2-5) — the new, parallel
    // Preference Intake Authorization computation: never gated on, and never gating,
    // needCreatorResult above (a bare preference statement is never a request). The gate
    // (PreferenceIntakeGate.authorize()) is invoked ONLY when the interpreter itself returns
    // eligible:true (§10's own "invoked only when..." contract) — a not-eligible turn never
    // reaches it at all, and reason:'NOT_ELIGIBLE' is set directly here instead (a value the gate
    // itself never produces).
    var preferenceIntakeAuthorization;
    try {
      var preferenceInterpreterResult = await ExplicitPreferenceStatementInterpreter.classify(turn, pipelineContext.recentConversationContext);
      if (preferenceInterpreterResult && preferenceInterpreterResult.eligible === true) {
        var consentGranted = false;
        try {
          var consentAccess = StateAccess.createEngineAccess({
            engineId: 'memoryLayer', action: 'PREFERENCE_CONSENT_READ',
            userId: identity.userId, sessionGeneration: identity.sessionGeneration, runId: identity.runId
          });
          consentGranted = consentAccess.read.memoryConsentGranted() === true;
        } catch (e) {
          consentGranted = false; // fail closed — never authorize on a consent-read failure
        }
        preferenceIntakeAuthorization = await PreferenceIntakeGate.authorize({
          interpreterResult: preferenceInterpreterResult,
          turn: turn,
          pipelineContext: pipelineContext,
          consentGranted: consentGranted
        });
      } else {
        preferenceIntakeAuthorization = { authorized: false, reason: 'NOT_ELIGIBLE', candidateRecord: null };
      }
    } catch (e) {
      preferenceIntakeAuthorization = { authorized: false, reason: 'NOT_ELIGIBLE', candidateRecord: null };
    }
    var preferenceAuthorized = !!(preferenceIntakeAuthorization && preferenceIntakeAuthorization.authorized === true);

    // Friends Alpha Item 6 (USER_DISCLOSURE V1) — a third, independent, parallel track: never
    // gated on, and never gating, Need recognition or CPI's own preference intake (a disclosure
    // is never a request, and is entirely orthogonal to whether a preference was also stated).
    // Recognition reuses turnUnderstanding's own already-computed Dimension 2/4/5 output — no
    // second AI call for recognition itself. Capture-eligibility is a separate, independent gate
    // (mirrors PreferenceIntakeGate's own shape exactly), reusing SafetyContextInterpreter — never
    // a second Safety authority.
    var userDisclosureResolution = UserDisclosureRecognizer.recognize(turn, turnUnderstanding, pipelineContext);
    var disclosureCaptureAuthorization = { authorized: false, reason: 'NOT_RECOGNIZED', candidateRecord: null };
    if (userDisclosureResolution && userDisclosureResolution.recognized === true) {
      try {
        var disclosureConsentAccess = StateAccess.createEngineAccess({
          engineId: 'memoryLayer', action: 'PREFERENCE_CONSENT_READ',
          userId: identity.userId, sessionGeneration: identity.sessionGeneration, runId: identity.runId
        });
        var disclosureConsentGranted = disclosureConsentAccess.read.memoryConsentGranted() === true;
        disclosureCaptureAuthorization = await SafetyDisclosureIntakeGate.authorize({
          turn: turn, pipelineContext: pipelineContext, consentGranted: disclosureConsentGranted,
          category: userDisclosureResolution.category
        });
      } catch (e) {
        disclosureCaptureAuthorization = { authorized: false, reason: 'GATE_THREW', candidateRecord: null };
      }
    }
    var disclosureCaptureAuthorized = !!(disclosureCaptureAuthorization && disclosureCaptureAuthorization.authorized === true);
    // Acknowledgement without capture has nothing async to wait for and resolves synchronously,
    // within THIS Decision Pass — only a capture-authorized disclosure requires deferral, for the
    // same honesty reason CPI-001 already established (never claim a durable write before it is
    // confirmed). Product Decision (Final Binding Decisions #4): a turn that successfully crosses
    // the bounded USER_DISCLOSURE V1 recognition boundary produces a governed acknowledgement.
    var disclosureRecognizedOnly = !!(userDisclosureResolution && userDisclosureResolution.recognized === true) && !disclosureCaptureAuthorized;
    var disclosureCategory = userDisclosureResolution && userDisclosureResolution.category;

    // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15/§22, Revision 2,
    // Product+Architecture APPROVED) — a fourth, independent, parallel track: never gated on, and
    // never gating, Need recognition, CPI's own preference intake, or Item 6's own disclosure
    // track (a durable risk-characteristic fact is never a request, and is entirely orthogonal to
    // whether a preference or disclosure was also stated this turn). Unlike Item 6's own
    // recognition (reused from turnUnderstanding's own already-computed dimensions), this
    // mechanism requires its own dedicated AI classification call (RiskCharacteristicInterpreter
    // has never been integrated with TurnUnderstandingInterpreter's own dimensions — Phase D.2's
    // own, unmodified contract).
    //
    // D.5 POST-REVIEW CORRECTION (Product/Architecture review, this round) — read before editing.
    // The original D.5 wiring treated "a NEW fact was authorized" and "a CORRECTION was
    // confirmed" as mutually exclusive (try NEW_FACT; only on failure, try CORRECTION). Review
    // found this loses Safety knowledge on a genuine REPLACEMENT statement ("the restriction is
    // actually X, not Y"): if the turn's OWN new-fact candidate (X) happened to be authorized,
    // the correction half was never even attempted, so the stale fact Y was left durably active
    // forever alongside X. Worse, if the classifier did NOT surface a new-fact candidate for X
    // (or it failed its own literal-anchor check) but DID confirm the correction against Y, Y was
    // superseded with NO replacement ever captured — Safety knowledge silently lost.
    //
    // Fixed by running BOTH checks unconditionally, independently, then combining:
    //   - NEW_FACT check: the interpreter's own first candidate is used (D.5's own disclosed
    //     scoping decision: a turn stating multiple distinct new facts captures the first this
    //     cycle; a later turn may capture the rest) — authorized via
    //     RiskCharacteristicIntakeGate.authorizeNewFact(), completely unmodified (Phase D.3,
    //     closed/approved). Never told about, and never influenced by, the correction check below
    //     — the replacement proposition must independently satisfy the SAME explicit,
    //     literal-user-grounding and consent requirements as any standalone NEW_FACT; it is never
    //     inferred FROM the correction.
    //   - CORRECTION check: against each existing active fact
    //     (pipelineContext.riskCharacteristicFactContext.items, Phase D.5's own context field) —
    //     exactly one confirmed match required (safetyDisclosureIntakeGate.js's own proven
    //     single-match-required discipline, reused BY PATTERN here since
    //     riskCharacteristicIntakeGate.js itself, Phase D.3, is not modified by this correction
    //     either); any single classifier failure among the existing facts fails the WHOLE
    //     correction check closed, never a partial evaluation. This now runs even when a NEW_FACT
    //     was already authorized (a disclosed, accepted efficiency cost — only paid on turns
    //     where the user already has at least one existing durable fact — mirroring
    //     memoryLayer.js's own EUR-001/situationalContext precedent of two sub-tracks each
    //     reading Typed Memory in the same pass).
    //   - Both confirmed -> mode:'REPLACEMENT' (supersede the old fact AND persist the new one,
    //     both durably, gated by the SAME two independent authorizations — see
    //     persistRiskCharacteristicFactRecord() in app.js for the failure-safe write ORDER this
    //     requires). Only correction confirmed -> mode:'CORRECTION' (pure retraction, unchanged
    //     from the original D.5 behavior — no replacement was independently authorized, so none is
    //     fabricated). Only new-fact authorized -> mode:'NEW_FACT' (unchanged). Neither -> not
    //     authorized (unchanged).
    var riskCharacteristicFactCaptureAuthorization = { authorized: false, reason: 'NOT_RECOGNIZED', candidateRecord: null };
    try {
      var rcfConsentAccess = StateAccess.createEngineAccess({
        engineId: 'memoryLayer', action: 'PREFERENCE_CONSENT_READ',
        userId: identity.userId, sessionGeneration: identity.sessionGeneration, runId: identity.runId
      });
      var rcfConsentGranted = rcfConsentAccess.read.memoryConsentGranted() === true;

      var rcfNewFactAuth = null;
      var rcfClassification = await RiskCharacteristicInterpreter.classifyTurnForDurableConstraint(turn.text);
      if (rcfClassification && rcfClassification.status === 'CLASSIFIED'
        && Array.isArray(rcfClassification.candidates) && rcfClassification.candidates.length > 0) {
        rcfNewFactAuth = await RiskCharacteristicIntakeGate.authorizeNewFact({
          turn: turn, candidate: rcfClassification.candidates[0], memoryConsent: { granted: rcfConsentGranted }
        });
      }
      var rcfNewFactAuthorized = !!(rcfNewFactAuth && rcfNewFactAuth.authorized === true);

      var rcfCorrectionAuth = null;
      var existingRiskCharacteristicFacts = (pipelineContext.riskCharacteristicFactContext
        && Array.isArray(pipelineContext.riskCharacteristicFactContext.items))
        ? pipelineContext.riskCharacteristicFactContext.items : [];
      if (existingRiskCharacteristicFacts.length > 0) {
        var rcfCorrectionCheckFailed = false;
        var rcfConfirmedMatches = [];
        for (var rcfi = 0; rcfi < existingRiskCharacteristicFacts.length; rcfi++) {
          var rcfExistingFact = existingRiskCharacteristicFacts[rcfi];
          var rcfOneCorrectionAuth = await RiskCharacteristicIntakeGate.authorizeCorrection({
            turn: turn,
            existingFact: { memoryId: rcfExistingFact.memoryId, literalStatementText: rcfExistingFact.literalStatementText },
            memoryConsent: { granted: rcfConsentGranted }
          });
          if (rcfOneCorrectionAuth.reason === 'SAFETY_CLASSIFIER_UNAVAILABLE') { rcfCorrectionCheckFailed = true; break; }
          if (rcfOneCorrectionAuth.authorized === true) rcfConfirmedMatches.push(rcfOneCorrectionAuth);
        }
        // Exactly one confirmed match required — 0 (nothing addressed), >1 (ambiguous), or any
        // single classifier failure all preserve every existing fact untouched, never a
        // fabricated change (mirrors safetyDisclosureIntakeGate.js's own detectCorrection()
        // discipline).
        if (!rcfCorrectionCheckFailed && rcfConfirmedMatches.length === 1) {
          rcfCorrectionAuth = rcfConfirmedMatches[0];
        }
      }
      var rcfCorrectionAuthorized = !!(rcfCorrectionAuth && rcfCorrectionAuth.authorized === true);

      if (rcfNewFactAuthorized && rcfCorrectionAuthorized) {
        riskCharacteristicFactCaptureAuthorization = Object.freeze({
          authorized: true, reason: 'OK',
          candidateRecord: Object.freeze({
            mode: 'REPLACEMENT',
            newFact: rcfNewFactAuth.candidateRecord,
            correction: rcfCorrectionAuth.candidateRecord
          })
        });
      } else if (rcfNewFactAuthorized) {
        riskCharacteristicFactCaptureAuthorization = rcfNewFactAuth;
      } else if (rcfCorrectionAuthorized) {
        riskCharacteristicFactCaptureAuthorization = rcfCorrectionAuth;
      } else if (rcfNewFactAuth) {
        // Neither half was authorized this turn — preserve the new-fact attempt's OWN, more
        // specific failure reason (e.g. CONSENT_ABSENT/LITERAL_ANCHOR_FAILED/INVALID_CANDIDATE_
        // SHAPE) rather than collapsing to the generic NOT_RECOGNIZED default, exactly as the
        // pre-correction D.5 wiring already did when a new-fact candidate existed but failed its
        // own gate. The correction attempt's own internal failure reason (NOT_CAPTURE_ELIGIBLE /
        // SAFETY_CLASSIFIER_UNAVAILABLE) is deliberately never surfaced here either — unchanged
        // from the original D.5 behavior, where an unconfirmed correction never overwrote
        // whatever authorization state already existed.
        riskCharacteristicFactCaptureAuthorization = rcfNewFactAuth;
      }
      // else: no new-fact candidate was ever produced and no correction was confirmed — stays at
      // the initial NOT_RECOGNIZED default, unchanged.
    } catch (e) {
      riskCharacteristicFactCaptureAuthorization = { authorized: false, reason: 'GATE_THREW', candidateRecord: null };
    }
    var riskCharacteristicFactCaptureAuthorized = !!(riskCharacteristicFactCaptureAuthorization && riskCharacteristicFactCaptureAuthorization.authorized === true);

    // §14 step 5 — the deferred-Expression-dispatch sentinel, used identically across every
    // branch below whenever preferenceAuthorized OR disclosureCaptureAuthorized OR
    // riskCharacteristicFactCaptureAuthorized is true: this turn's own primary decision is
    // returned fully formed (Stage 1-9 complete) but deliberately unrendered, for the caller
    // (app.js) to hand to Unified Finalization only after persistence resolves. A single, shared
    // sentinel and a single, shared Unified Finalization step (never a second finalization
    // pipeline) — generalized to accept any/all of the three confirmed records.
    var DEFERRED_EXPRESSION = Object.freeze({ status: 'DEFERRED', reason: 'PREFERENCE_FINALIZATION_PENDING' });
    var deferForFinalization = preferenceAuthorized || disclosureCaptureAuthorized || riskCharacteristicFactCaptureAuthorized;

    if (needCreatorResult && needCreatorResult.kind === 'UNSUPPORTED') {
      // §12 — bypasses Stage 4 (Evidence)/Stage 5 (Eligibility)/Stage 6 (Candidate)/Stage 8-9's
      // Safety-review branch entirely: there is no Candidate to evaluate, so safetyPort.
      // finalReview() is never called, exactly as it is already never called for
      // formDecisionPassSilence()'s own zero-Candidate path. No fake Candidate or Safety data is
      // ever attached.
      var unsupportedDecision = DecisionFormation.formUnsupportedCapabilityOutcome({ need: needCreatorResult.need });
      if (deferForFinalization) {
        return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, terminalDecision: unsupportedDecision.decision, preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: DEFERRED_EXPRESSION } };
      }
      var unsupportedFinalDecision = applyDisclosureAcknowledgmentIfNeeded(unsupportedDecision.decision, disclosureRecognizedOnly, disclosureCategory);
      var unsupportedRenderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
      var unsupportedExpressionResult = (unsupportedRenderingContextResult && unsupportedRenderingContextResult.status === 'BUILT')
        ? await runExpressionStage(unsupportedFinalDecision, unsupportedRenderingContextResult.expressionRenderingContext, ExpressionRenderer)
        : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };
      return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, terminalDecision: unsupportedFinalDecision, preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: unsupportedExpressionResult } };
    }

    // §06/§07 — a real DETECTED_OPPORTUNITY (or nothing, for Case A/C/UNSUPPORTED-already-handled)
    // joins the SAME Stage-3->4->5->6->7->8->9 aggregation/flow every other Stage-3 contributor
    // already uses, reused entirely unmodified — buildOpportunitiesForDecisionPass()'s own
    // additive second parameter (collectDetectedOpportunities()'s own additive branch) is the
    // ONLY mechanism threading this contribution in; nothing about Evidence/Eligibility/
    // Candidate/Prioritization/Winner-Selection/Decision-Formation/Safety is touched.
    var directOpportunity = (needCreatorResult && needCreatorResult.kind === 'DETECTED_OPPORTUNITY') ? needCreatorResult.opportunity : null;
    // DUC-001 Post-Implementation Turn-Serving Correction — turn.turnId, the ONLY call site in
    // this file that ever supplies buildOpportunitiesForDecisionPass()'s third parameter. See its
    // own header comment there for the full rationale.
    var opportunities = buildOpportunitiesForDecisionPass(pipelineContext, directOpportunity, turn.turnId);
    var passResult = await runDecisionPass({ pipelineContext: pipelineContext, opportunities: opportunities, safetyPort: SafetyLayer });

    if (passResult.status !== 'FORMED') {
      // Defensive only — mirrors the APP_READY path's own identical defensive branch above. No
      // terminalDecision exists in this case; runPreferenceAcknowledgmentFinalization() treats a
      // missing base terminalDecision exactly like a SILENCE one (§14) — the standalone
      // ACKNOWLEDGED_PREFERENCE/ACKNOWLEDGED_DISCLOSURE shape, never an attach attempt against a
      // nonexistent object.
      if (deferForFinalization) {
        return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: DEFERRED_EXPRESSION } };
      }
      if (disclosureRecognizedOnly) {
        var standaloneDisclosureDecision = applyDisclosureAcknowledgmentIfNeeded(null, disclosureRecognizedOnly, disclosureCategory);
        var passNotFormedRenderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
        var passNotFormedExpressionResult = (passNotFormedRenderingContextResult && passNotFormedRenderingContextResult.status === 'BUILT')
          ? await runExpressionStage(standaloneDisclosureDecision, passNotFormedRenderingContextResult.expressionRenderingContext, ExpressionRenderer)
          : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };
        return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], terminalDecision: standaloneDisclosureDecision, preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: passNotFormedExpressionResult } };
      }
      return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: { status: 'NOT_ATTEMPTED', reason: passResult.reason || 'PASS_NOT_FORMED' } } };
    }

    var terminalDecision = passResult.decision;
    if (deferForFinalization) {
      return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], terminalDecision: terminalDecision, preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: DEFERRED_EXPRESSION } };
    }
    var finalTerminalDecision = applyDisclosureAcknowledgmentIfNeeded(terminalDecision, disclosureRecognizedOnly, disclosureCategory);
    var renderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
    var expressionResult = (renderingContextResult && renderingContextResult.status === 'BUILT')
      ? await runExpressionStage(finalTerminalDecision, renderingContextResult.expressionRenderingContext, ExpressionRenderer)
      : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };

    return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [], terminalDecision: finalTerminalDecision, preferenceIntakeAuthorization: preferenceIntakeAuthorization, disclosureCaptureAuthorization: disclosureCaptureAuthorization, riskCharacteristicFactCaptureAuthorization: riskCharacteristicFactCaptureAuthorization, expression: expressionResult } };
  }

  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §14 steps 11-13) — Unified Finalization: dispatched
  // only via run(ctx) with ctx.action === 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE', only by app.js,
  // only after it has confirmed every attempted, authorized Typed Memory write (§11/§12).
  // Performs exactly the following deterministic/Stage-10-only calls — NO Stage 1-9 re-run, no
  // Context re-assembly, no interpreter/AI classification call of its own, and no
  // TrainingReadinessReasoningComponent or any other professional reasoning component:
  //   (a) select formAcknowledgedPreferenceOutcome()/formAcknowledgedDisclosureOutcome()
  //       (standalone) when the base terminalDecision is absent or SILENCE-kind, else
  //       attachSecondaryAcknowledgment()/attachSecondaryDisclosureAcknowledgment() (attached) —
  //       PURE, additive copy-plus-one-field operations that never re-invoke Safety/Eligibility/
  //       Evidence/Prioritization/Winner-Selection;
  //   (b) MemoryLayer.buildExpressionRenderingContext(pipelineContext) — the SAME pipelineContext
  //       object Pass 1 already assembled, threaded forward via ctx.payload, never re-assembled;
  //   (c) runExpressionStage(...) — the exact same, already-exported function every other
  //       rendering path already calls, exactly once.
  //
  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — generalized to accept a SECOND, independent,
  // optional confirmed record (confirmedDisclosureRecord) alongside CPI's own confirmedRecord —
  // never a second finalization pipeline, the SAME single step, still exactly one Expression
  // call/one Delivery Intent/one CCC terminal write regardless of how many of the two records are
  // present. When only one is present, the other's own attach/standalone step is simply skipped
  // (a no-op) — CPI-only turns behave byte-identically to before this generalization. When
  // NEITHER base decision exists and BOTH records are present, ACKNOWLEDGED_PREFERENCE is built
  // as the standalone base (matching the existing, already-tested precedent) with the disclosure
  // attached onto it as a secondary — an arbitrary but harmless ordering choice, since both are
  // equally bounded, non-advice acknowledgments.
  // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15) — generalized to
  // accept a THIRD, independent, optional confirmed record (confirmedRiskCharacteristicFactRecord)
  // alongside CPI's own confirmedRecord and Item 6's own confirmedDisclosureRecord — still the SAME
  // single Unified Finalization step. Disclosed scope decision (see decisionFormation.js's own
  // formAcknowledgedRiskCharacteristicFactOutcome() header): this record is standalone-ONLY in this
  // phase — when hasRealBase is true, it is deliberately not attached (the fact is already
  // persisted regardless; only the in-turn acknowledgment text is narrower in scope this phase). It
  // participates in the standalone else-if chain after confirmedRecord/confirmedDisclosureRecord,
  // matching their own established "arbitrary but harmless ordering" precedent when multiple are
  // present without a real base.
  // ctx.payload: { pipelineContext, terminalDecision (Pass 1's own, or null/undefined),
  // confirmedRecord: {preferenceClass, polarity, target, sourceTurnId, wasReactivatedFromRejected}
  // | null, confirmedDisclosureRecord: {category, capturedToMemory, safetyRelevant} | null,
  // confirmedRiskCharacteristicFactRecord: {riskDomain, capturedToMemory} | null }.
  async function runPreferenceAcknowledgmentFinalization(ctx, identity) {
    var payload = ctx.payload || {};
    var pipelineContext = payload.pipelineContext;
    var baseTerminalDecision = payload.terminalDecision || null;
    var confirmedRecord = payload.confirmedRecord || null;
    var confirmedDisclosureRecord = payload.confirmedDisclosureRecord || null;
    var confirmedRiskCharacteristicFactRecord = payload.confirmedRiskCharacteristicFactRecord || null;

    var finalTerminalDecision;
    var hasRealBase = !!(baseTerminalDecision && baseTerminalDecision.kind !== 'SILENCE');

    if (hasRealBase) {
      finalTerminalDecision = baseTerminalDecision;
      if (confirmedRecord) finalTerminalDecision = DecisionFormation.attachSecondaryAcknowledgment(finalTerminalDecision, confirmedRecord);
      if (confirmedDisclosureRecord) finalTerminalDecision = DecisionFormation.attachSecondaryDisclosureAcknowledgment(finalTerminalDecision, confirmedDisclosureRecord);
      // confirmedRiskCharacteristicFactRecord is deliberately NOT attached here in this phase —
      // see the header disclosure above. The fact is already durably persisted regardless.
    } else if (confirmedRecord) {
      finalTerminalDecision = DecisionFormation.formAcknowledgedPreferenceOutcome(confirmedRecord).decision;
      if (confirmedDisclosureRecord) finalTerminalDecision = DecisionFormation.attachSecondaryDisclosureAcknowledgment(finalTerminalDecision, confirmedDisclosureRecord);
    } else if (confirmedDisclosureRecord) {
      finalTerminalDecision = DecisionFormation.formAcknowledgedDisclosureOutcome(confirmedDisclosureRecord).decision;
    } else if (confirmedRiskCharacteristicFactRecord) {
      finalTerminalDecision = DecisionFormation.formAcknowledgedRiskCharacteristicFactOutcome(confirmedRiskCharacteristicFactRecord).decision;
    } else {
      // WP0 Phase D.5 — this branch IS now genuinely reachable (not merely defensive): a
      // CORRECTION-mode risk-characteristic fact authorization defers for finalization (its
      // persistence write must still resolve before the turn completes, per binding requirement
      // 10) but deliberately produces no acknowledgment record at all (candidateRecord for
      // CORRECTION mode is superseding an existing fact, never stating a new one to acknowledge —
      // see persistRiskCharacteristicFactRecord()'s own header in app.js). A pure
      // correction-only turn therefore reaches here with every confirmed record null and no real
      // base: the honest outcome is Decision-Pass-level Silence — nothing new to say this turn —
      // never the previous, genuinely-unreachable-before-this-phase, broken empty-preference
      // fallback.
      finalTerminalDecision = DecisionFormation.formDecisionPassSilence({ opportunitiesConsidered: [] }).decision;
    }

    var renderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
    var expressionResult = (renderingContextResult && renderingContextResult.status === 'BUILT')
      ? await runExpressionStage(finalTerminalDecision, renderingContextResult.expressionRenderingContext, ExpressionRenderer)
      : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };

    return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, terminalDecision: finalTerminalDecision, expression: expressionResult } };
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
  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §06/§07) — `directOpportunity`, an additive,
  // optional second parameter: a single already-complete DetectedOpportunity object, supplied
  // ONLY by the new DIRECT_TURN_PASS path (runDirectTurnPass() above), which is the sole caller
  // that ever passes it — the existing APP_READY path's own call site below (inside
  // buildOpportunitiesForDecisionPass(pipelineContext), invoked with a single argument from
  // run() above) never supplies it, so this branch is always a no-op there. Mirrors the existing
  // trainingReadinessOpportunities branch immediately above it: purely additive collection, no
  // semantic construction performed here.
  function collectDetectedOpportunities(pipelineContext, directOpportunity) {
    var out = [];
    var recDetections = RecommendationEngine.detectOpportunities(pipelineContext);
    if (Array.isArray(recDetections)) out = out.concat(recDetections);

    var initDetections = InitiativeEngine.detectOpportunities(pipelineContext);
    if (initDetections && Array.isArray(initDetections.semanticOpportunities)) {
      out = out.concat(initDetections.semanticOpportunities);
    }
    // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §12; TDP Ch.13 item 3 — "collection-bucket fix").
    // Additive to the existing semanticOpportunities collection immediately above, which remains
    // byte-identical.
    if (initDetections && Array.isArray(initDetections.trainingReadinessOpportunities)) {
      out = out.concat(initDetections.trainingReadinessOpportunities);
    }

    var safetyDetections = SafetyLayer.detectSafetyOpportunities(pipelineContext);
    if (Array.isArray(safetyDetections)) out = out.concat(safetyDetections);

    // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §06/§07) — the Conversational Need Creator's own
    // Step-B contribution, active only when the caller supplies one (DIRECT_TURN_PASS only). Only
    // ever a kind: 'DETECTED_OPPORTUNITY' result's own `.opportunity` — a kind: 'UNSUPPORTED'
    // result is never collected here at all; it is handled by the orchestrator's own separate,
    // pre-Stage-4 branch (§12, runDirectTurnPass() above).
    if (directOpportunity) out = out.concat([directOpportunity]);

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

  // DUC-001 Post-Implementation Turn-Serving Correction (Product/Architecture-approved,
  // frozen this turn) — DIRECT_TURN_PASS is a turn-serving Decision Pass: an unrelated
  // autonomous/proactive Opportunity MUST NOT displace the legitimate Need created from the
  // originating Current User Turn. This is a Decision-Pass-causality/turn-serving-SCOPE concern
  // (which Opportunities are even ADMITTED into this specific pass), structurally separate from
  // Canonical Candidate hierarchy (Prioritization/hierarchyTier — entirely untouched by this
  // function; a DetectedOpportunity admitted here still competes on hierarchyTier exactly as
  // before, against whatever else was also admitted).
  //
  // Domain-agnostic by construction (never sourceCategory/domain/topic/opaque needRef-or-
  // sameNeedId parsing): a DetectedOpportunity is admitted to a turn-serving pass iff it carries
  // the existing, pre-existing safetyHighRiskBypass:true flag (Safety's own unconditional
  // authority — never gated by turn-causality, never required to carry the originating turnId),
  // OR its own turnId matches the pass's originating turn. turnId is already set, generically,
  // by ConversationalNeedCreator's own Step B (conversationalNeedCreator.js) on any Opportunity it
  // constructs — not TRR-specific code — so a future, non-TRR, non-DIRECT_USER_REQUEST-sourced
  // turn-caused capability participates correctly here with zero changes to this function.
  function isAdmittedForTurnServingPass(d, currentTurnId) {
    if (d.safetyHighRiskBypass === true) return true; // Safety — unconditional, never gated by turnId
    return d.turnId === currentTurnId;
  }

  // G-2 (docs/specs/G2_SPEC_v1.0.md §29) — orchestrates Stage 3 detection (collectDetectedOpportunities
  // above) -> Stage 4 Evidence Evaluation (§24-26) -> Stage 4->5 handoff (buildEligibilityAndCandidateInputs
  // above), producing the exact `opportunities` array runDecisionPass() already expects
  // (unchanged shape). A safetyHighRiskBypass:true DetectedOpportunity routes around Stage 4
  // entirely (D1-OD-04/D2-EF-01(a); §18.2) — EvidenceEvaluator.evaluate() is never called for it.
  // An INSUFFICIENT DetectedOpportunity is excluded here — it never reaches Stage 5 (§26); no
  // fabricated Silence or synthetic outcome is created for it, it is simply not included in the
  // array runDecisionPass() iterates.
  // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §06/§07) — `directOpportunity`, threaded straight
  // through to collectDetectedOpportunities()'s own identically-named, identically-optional
  // parameter (see there). The existing APP_READY call site (run() above,
  // buildOpportunitiesForDecisionPass(pipelineContext)) never supplies it.
  //
  // DUC-001 Post-Implementation Turn-Serving Correction — `currentTurnId`, a third, additive,
  // optional parameter: supplied ONLY by runDirectTurnPass() below (the sole DIRECT_TURN_PASS
  // call site), never by the existing APP_READY call site (run() above,
  // buildOpportunitiesForDecisionPass(pipelineContext), a single argument) — so this filter is
  // structurally a no-op for APP_READY, exactly mirroring directOpportunity's own established
  // additive-parameter discipline immediately above. Applied AFTER Stage-3 mechanical collection
  // and BEFORE ordinary Stage-4 Evidence evaluation, per the approved architecture.
  function buildOpportunitiesForDecisionPass(pipelineContext, directOpportunity, currentTurnId) {
    var detected = collectDetectedOpportunities(pipelineContext, directOpportunity);
    if (typeof currentTurnId === 'string' && currentTurnId.length > 0) {
      detected = detected.filter(function (d) { return !!d && isAdmittedForTurnServingPass(d, currentTurnId); });
    }
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
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §19-21) — resolves the bounded reasoning component's
  // own structured output into a real EligibleOpportunity carrying the actual proposedAction, or
  // returns null (NO_VIABLE_PROPOSAL / any failure mode) — in which case the originating
  // Opportunity contributes nothing to this Decision Pass, exactly as CARF Ch.09's own frozen
  // failure semantics require. actionIdentity is computed here, deterministically, from
  // activityReference — the model's own output schema carries no actionIdentity field at all
  // (TDP's non-negotiable item 18), so there is no channel through which the model could
  // self-declare it.
  function resolveTrainingReadinessProposal(eligibleOpportunity, proposal) {
    if (!proposal) return null; // propose() already returns null for every invalid/failed case
    if (proposal.outcome === 'NO_VIABLE_PROPOSAL') return null;

    var actionIdentity = null;
    if (proposal.actionCategory === 'PHYSICAL_ACTIVITY') {
      var token = ActivityReferenceNormalizer.normalize(proposal.activityReference);
      if (token) actionIdentity = { activity: token };
    }

    var resolved = {};
    for (var k in eligibleOpportunity) { if (Object.prototype.hasOwnProperty.call(eligibleOpportunity, k)) resolved[k] = eligibleOpportunity[k]; }
    resolved.proposedAction = proposal.action;
    resolved.explanation = {
      rationale: proposal.rationale, evidenceBasis: proposal.evidenceBasis,
      expectedValue: proposal.expectedValue, uncertainty: proposal.uncertainty
    };
    // TDP's own V1 Action Envelope table row 8 (Clarification) — "Neither field," mirroring the
    // existing G-2 info-request precedent exactly: fields are left absent (undefined), never set
    // to a literal null, so initiativeEngine.js's own `!== undefined` gate (§22/§25) correctly
    // omits them from the Candidate rather than constructing an invalid
    // actionCategory:null shape that validateCandidateShape() would then reject.
    if (proposal.actionCategory === 'PHYSICAL_ACTIVITY' || proposal.actionCategory === 'NON_ACTIVITY_COACHING_ACTION') {
      resolved.actionCategory = proposal.actionCategory;
      if (proposal.actionCategory === 'PHYSICAL_ACTIVITY') {
        resolved.activityReference = proposal.activityReference;
        if (actionIdentity) resolved.actionIdentity = actionIdentity; // present only when normalization succeeded
      }
    }
    resolved.sameNeedId = eligibleOpportunity.id;
    // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §10/§14) — additive, undefined-safe field,
    // mirroring sameNeedId's own precedent immediately above: absent (undefined) for every
    // proactive/non-DUC Candidate (eligibleOpportunity.turnId is never set on those), real for a
    // DIRECT_USER_REQUEST-sourced one — carrying §14's own correlation chain into the Candidate
    // itself (Candidate.opportunityProvenance.turnId, via initiativeEngine.js's own generic
    // opportunityProvenance copy).
    resolved.turnId = eligibleOpportunity.turnId;
    try { return Object.freeze(resolved); } catch (e) { return resolved; }
  }

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

      // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §19) — a new, narrowly-scoped step, active ONLY
      // for validReasonCategory === 'ADAPT_TO_CURRENT_STATE'; every other Reason category's own
      // dispatch immediately below is untouched, byte-identical. CARF's own canonical seam: bounded
      // Reasoning Context -> AI Reasoning -> strict validation, all BETWEEN Stage 5 (already
      // ELIGIBLE, above) and Stage 6 (dispatchStage6, below) — never before, never after.
      if (eligibilityInput && eligibilityInput.validReasonCategory === 'ADAPT_TO_CURRENT_STATE') {
        // WP0 Phase B — was MemoryLayer.buildTrainingReadinessReasoningContext(pipelineContext,
        // eligibleOpportunity); now routes through CapabilityRegistry/ContextComposer via the
        // adapter, producing a byte-identical reasoning-context shape (verified: golden-master
        // regression, tests/trrCapabilityAdapter.test.js).
        var reasoningContext = await TrrCapabilityAdapter.buildReasoningContext(pipelineContext, eligibleOpportunity);
        var proposal;
        try { proposal = await TrainingReadinessReasoningComponent.propose(reasoningContext); }
        catch (e) { proposal = null; } // defensive — propose() itself never throws, kept for safety
        var resolvedOpportunity = resolveTrainingReadinessProposal(eligibleOpportunity, proposal);
        if (!resolvedOpportunity) continue; // NO_VIABLE_PROPOSAL / any failure — contributes nothing this pass
        candidateLists.push(dispatchStage6(pipelineContext, resolvedOpportunity));
        continue;
      }

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
    // DUC-001 (docs/specs/DUC_001_SPEC_v1.0.md §03) — exposed for direct unit/integration
    // testing, structurally parallel to the other direct-dispatch exports below. Production never
    // calls this directly — always through run(ctx) with ctx.action === 'DIRECT_TURN_PASS'.
    runDirectTurnPass: runDirectTurnPass,
    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §14) — exposed for direct unit/integration
    // testing, structurally parallel to runDirectTurnPass above. Production never calls this
    // directly — always through run(ctx) with ctx.action === 'PREFERENCE_ACKNOWLEDGMENT_FINALIZE'.
    runPreferenceAcknowledgmentFinalization: runPreferenceAcknowledgmentFinalization,
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
    buildOpportunitiesForDecisionPass: buildOpportunitiesForDecisionPass,
    // DUC-001 Post-Implementation Turn-Serving Correction — exposed for direct unit testing.
    isAdmittedForTurnServingPass: isAdmittedForTurnServingPass,
    // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §19-21) — exposed for direct unit testing.
    resolveTrainingReadinessProposal: resolveTrainingReadinessProposal
  };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemOrchestrator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
