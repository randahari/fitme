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

  var API = {
    run: run,
    runForOpportunity: runForOpportunity,
    runForInitiativeOpportunity: runForInitiativeOpportunity,
    detectInitiativeOpportunities: detectInitiativeOpportunities
  };

  if (typeof window !== 'undefined') { window.CoachDecisionSystemOrchestrator = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
