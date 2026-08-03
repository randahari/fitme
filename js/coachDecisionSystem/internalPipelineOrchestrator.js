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
// Recommendation Engine); TASK-005 מוסיף את השלישי (Initiative Engine) —
// Decision Engine/Safety Layer/Expression שייכים ל-TASK-006 ואילך ומחוץ
// ל-scope (Explicitly Forbidden Work). ל-D2 Stage 6 (Candidate Generation)
// יש להגיע דרך Stage 5 (Eligibility Evaluation) — וזו סמכות תזמור של
// ה-Decision Engine (D2 Unit 07), שאינו קיים עדיין. run() למטה, המורץ
// בפועל ע"י EngineRegistry, לכן אינו יכול להפיק כרגע EligibleOpportunity
// אמיתי מ-trigger חי: לבנות Stage 4/5 כאן משמעו לבנות חלק מה-Decision
// Engine — אסור. לפי D3 §12.3 (לעולם לא להמציא החלטה כאשר תלות אינה
// נגישה) ו-D2-INV-05 ("Silence is fully formed"), run() מבצע Context
// Assembly אמיתי (Stage 1-2, Memory Layer) ומחזיר candidates ריק — תוצאה
// תקינה ומלאה, לא כשל (ר' Repository Gaps בדוח היישום). runForOpportunity()/
// runForInitiativeOpportunity() למטה חושפים את Stage 6 עצמו (Recommendation
// / Initiative בהתאמה) כ-collaborator הניתן להפעלה ישירה ברגע שקיים
// EligibleOpportunity אמיתי (TASK-006 העתידי, או בדיקות).
// detectInitiativeOpportunities() חושף את תרומת ה-Initiative Engine ל-Stage
// 3 (D2 Unit 07) — confirmed-pattern anticipation ו-disruption/milestone
// detection בלבד, לעולם לא Decision Window (Recommendation Engine
// contribution) ולא Safety/high-risk (Safety Layer).
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

    // See file header: Stage 4/5 (Evidence/Eligibility Evaluation) are Decision-Engine-owned
    // and not yet built — no genuine EligibleOpportunity exists yet, so Stage 6 yields no
    // candidates this cycle. Silence is a fully-formed, valid outcome (D2-INV-05).
    return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, candidates: [] } };
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

  // TASK-006 — Decision Engine entry point: Stage 5 (Eligibility Evaluation) -> Stage 6 dispatch
  // (existing runForOpportunity/runForInitiativeOpportunity pattern, per-Opportunity) -> Stage 7
  // (Candidate Pool Assembly + Prioritization) -> Stage 8 (Winner Selection) -> Stage 9 (Decision
  // Formation), producing exactly one Terminal Decision (D2 Unit 02, Canonical Decision 1) or an
  // explicit Pipeline Abort (§31). Not reached from run() above — no live Stage 3/4 Opportunity
  // source exists yet in this repository (Repository Gap G-2, non-blocking, §9.2/§38) — exposed
  // as a direct dispatch function for a future Stage 3/4 caller, or tests, structurally parallel
  // to runForOpportunity/runForInitiativeOpportunity (§28.10).
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

  var API = {
    run: run,
    runForOpportunity: runForOpportunity,
    runForInitiativeOpportunity: runForInitiativeOpportunity,
    detectInitiativeOpportunities: detectInitiativeOpportunities,
    runDecisionPass: runDecisionPass
  };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemOrchestrator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
