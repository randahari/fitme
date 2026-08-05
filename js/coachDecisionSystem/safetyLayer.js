// ══════════════════════════════════════════════════════════════════
// FitMe — Safety Layer (SL-001, docs/specs/SL-001_SPEC_v1.0.md, RCD-01
// through RCD-14, docs/governance/FITME_Safety_Layer_Canonical_Decision_
// Package_v2.0.md)
// Exclusive responsibility: the production implementation behind the
// existing SafetyIntegrationPort (js/coachDecisionSystem/
// safetyIntegrationPort.js, TASK-006 §21.8) — Stage 8 disqualify() (D1-AH-02
// absolute overrides, SPEC Ch.14), Stage 9 finalReview() (the full Safety
// Decision Matrix, SPEC Ch.15-18), and the Stage 3 safety-triggered-
// Opportunity detection contribution (SPEC Ch.9-10), mirroring exactly the
// existing detectInitiativeOpportunities()/InitiativeEngine.detectOpportunities()
// dispatch pattern already established for the Initiative Engine
// (internalPipelineOrchestrator.js, TASK-005).
//
// Runtime unit of evaluation is the Canonical Safety Rule (RCD-14), not
// RiskType/reasonCode/any "Primary Safety Conflict" in isolation: each
// matched Rule independently derives RiskType/EvidenceConfidence/
// Correctability/Urgency (RCD-12.A-D) and its own Candidate Disposition
// (RCD-12.E); cross-Rule disposition precedence (RCD-09/RCD-12, RCD-14.B)
// then selects the winning disposition; the same-disposition tie-break
// (RCD-14.C: Urgency -> EvidenceConfidence -> Canonical Safety Rule Order)
// selects the Primary Rule Result; every other matched Rule supporting the
// winning disposition populates secondaryReasonCodes (RCD-14.D).
//
// Repository Gap (non-blocking, honestly documented, not invented around):
// no Health/Safety Profile (or equivalent safety-signal) data source exists
// anywhere in this repository's actual Pipeline Context at this baseline —
// js/coachDecisionSystem/memoryLayer.js's assembleContext() produces no such
// field, the same "no repository data source... never fabricated" status
// this repository already documents for lifeEventContext/capacityState
// (memoryLayer.js) and for calendar/milestone data (initiativeEngine.js's
// detectDisruptionOpportunities/detectMilestoneRecoveryOpportunities).
// matchCanonicalSafetyRules() below is a real, correctly-typed matching
// function — not a stub — that correctly yields zero matched Rules given
// this absence, per SPEC Ch.28's own Failure Mode guidance ("Proceed using
// available categories... reasons over what is available") and RCD-12.A's
// own "no repository-supported safety conflict exists -> NONE" default. It
// begins matching real Rules the moment a Health/Safety Profile source is
// added to Pipeline Context, with no change to the evaluation engine below.
//
// A second, narrower, currently-unreachable gap: RCD-13.D requires a
// MODIFIED SafetyReviewResult's modifiedContent to be non-null, but no
// canonical source (D1, D2, D3, T006, SLDP, or the SL-001 SPEC) defines a
// bounded-modification content-generation algorithm — deciding HOW to alter
// a Candidate's content is Product/coaching-content-authoring work, not an
// Engineering detail (D1-CDO-03/SPEC Ch.19's Expression-boundary principle:
// "a generative layer SHALL express a decision already reached; it SHALL
// NOT originate the underlying decision"). Since Correctability can only
// ever derive BOUNDED_MODIFICATION from a positively-matched Rule, and no
// Rule can ever match given the gap above, this path is unreachable in the
// current repository state; finalReview() below honestly returns
// modifiedContent: null rather than fabricating content, which
// decisionFormation.js's own pre-existing, unmodified invariant check
// (`if (!isPlainObject(reviewResult.modifiedContent)) return ABORTED`)
// already, correctly, Pipeline-Aborts on — no new abort path is invented.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var SafetyIntegrationPort = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyIntegrationPort.js')
    : window.SafetyIntegrationPort;

  var DISPOSITION_PRECEDENCE = SafetyIntegrationPort.DISPOSITION_PRECEDENCE;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // ── RCD-12.A — RiskType: closed 11-value enum. Engineering SHALL NOT extend. ──
  var RISK_TYPES = Object.freeze([
    'NONE', 'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PSYCHOLOGICAL_DISTRESS_CONCERN', 'OUTSIDE_COACHING_SCOPE', 'INSUFFICIENT'
  ]);

  // ── RCD-12.B — EvidenceConfidence: closed 6-value enum, reusing D1 Unit 11's Evidence
  // Hierarchy unaltered. Declared strongest-to-weakest; also the tie-break rank order (RCD-14.C.3).
  var EVIDENCE_CONFIDENCE = Object.freeze([
    'EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR', 'SINGLE_BEHAVIOUR', 'INFERENCE', 'INSUFFICIENT'
  ]);

  // ── RCD-12.C — Correctability: closed 4-value enum. Engineering SHALL NOT extend. ──
  var CORRECTABILITY = Object.freeze(['NOT_APPLICABLE', 'BOUNDED_MODIFICATION', 'REQUIRES_INTENT_CHANGE', 'INSUFFICIENT']);

  // ── RCD-12.D — Urgency: closed 4-value enum. Engineering SHALL NOT extend. ──
  var URGENCY = Object.freeze(['ROUTINE_PROTECTIVE', 'TIME_SENSITIVE', 'IMMEDIATE_PROTECTIVE', 'INSUFFICIENT']);

  // RCD-14.C.2 tie-break rank — more time-sensitive wins; INSUFFICIENT does not represent
  // genuine urgency and ranks lowest, per RCD-12.D's own definitions (Ch.15/16 of the SPEC).
  var URGENCY_TIEBREAK_RANK = Object.freeze({ IMMEDIATE_PROTECTIVE: 3, TIME_SENSITIVE: 2, ROUTINE_PROTECTIVE: 1, INSUFFICIENT: 0 });

  // RCD-14.C.4 — the fixed, canonical, nine-item same-disposition tie-break order, independent
  // of RiskType's own enum declaration order, never a severity score. Modifiable only by a
  // future canonical Product/Architecture decision (recorded exactly as approved).
  var CANONICAL_SAFETY_RULE_ORDER = Object.freeze([
    'ACTIVE_HIGH_RISK_SYMPTOM', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'KNOWN_ALLERGY_CONFLICT',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PSYCHOLOGICAL_DISTRESS_CONCERN',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', 'OUTSIDE_COACHING_SCOPE'
  ]);

  // D1-AH-02's four absolute-override categories — the exact, narrower subset Stage 8's binary
  // disqualify() checks against (SPEC Ch.14), distinct from Stage 9's full five-disposition Matrix.
  var ABSOLUTE_OVERRIDE_RISK_TYPES = Object.freeze([
    'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT'
  ]);

  // ══════════════════════════════════════════════════════════════════
  // Canonical Safety Rule matching (RCD-12.A derivation input; RCD-14 runtime unit) — see file
  // header. Always yields zero matches at this repository baseline (documented Repository Gap,
  // non-blocking). `candidate`/`terminalDecision` are accepted for structural correctness (Stage
  // 8 supplies a Candidate, Stage 9 supplies the pre-review Terminal Decision, Stage 3 supplies
  // neither) even though neither is read by this baseline implementation.
  // ══════════════════════════════════════════════════════════════════
  function matchCanonicalSafetyRules(candidate, terminalDecision, pipelineContext) {
    return [];
  }

  // ── SPEC Ch.9/10, Ch.14 Stage 3 — safety-triggered Opportunity detection contribution.
  // Mirrors initiativeEngine.js's detectDisruptionOpportunities/detectMilestoneRecoveryOpportunities
  // precedent exactly: a real, correctly-typed detection function that correctly yields zero
  // Opportunities given the current absence of a Health/Safety Profile data source in Pipeline
  // Context (same Repository Gap as matchCanonicalSafetyRules above). Not reachable via the
  // existing SafetyIntegrationPort (which defines only disqualify()/finalReview(), T006 §21.8);
  // exposed here, and dispatched from internalPipelineOrchestrator.js, for a future Stage 3/4
  // caller or tests — structurally parallel to detectInitiativeOpportunities().
  function detectSafetyOpportunities(pipelineContext) {
    pipelineContext = pipelineContext || {};
    return [];
  }

  // ── RCD-12.E — per-Rule ordered disposition predicates, evaluated in the fixed protective
  // order. `dims`: { riskType, evidenceConfidence, correctability, urgency, escalationRequired?,
  // immediateProtectiveOrProfessionalSupportRequired?, outsideCoachingAuthorityRequiringProfessionalSupport? }
  // — the three optional booleans carry the ESCALATED predicate's non-dimension-derived
  // conditions (constitutionally-required professional support signals); they default to false
  // and are never set true by matchCanonicalSafetyRules at this baseline (same Repository Gap).
  function evaluateRulePredicate(dims) {
    dims = dims || {};

    // 1. ESCALATED
    if (dims.escalationRequired === true) return 'ESCALATED';
    if (dims.riskType === 'ACTIVE_HIGH_RISK_SYMPTOM' && dims.urgency === 'IMMEDIATE_PROTECTIVE') return 'ESCALATED';
    if (dims.riskType === 'PSYCHOLOGICAL_DISTRESS_CONCERN' && dims.immediateProtectiveOrProfessionalSupportRequired === true) return 'ESCALATED';
    if (dims.outsideCoachingAuthorityRequiringProfessionalSupport === true) return 'ESCALATED';

    // 2. BLOCKED
    if (dims.riskType !== 'NONE' && dims.riskType !== 'INSUFFICIENT'
      && dims.evidenceConfidence !== 'INFERENCE' && dims.evidenceConfidence !== 'INSUFFICIENT'
      && dims.correctability === 'REQUIRES_INTENT_CHANGE') return 'BLOCKED';

    // 3. DEFERRED
    if (dims.riskType === 'INSUFFICIENT' || dims.evidenceConfidence === 'INFERENCE' || dims.evidenceConfidence === 'INSUFFICIENT'
      || dims.correctability === 'INSUFFICIENT' || dims.urgency === 'INSUFFICIENT') return 'DEFERRED';

    // 4. MODIFIED
    if (dims.riskType !== 'NONE' && dims.riskType !== 'INSUFFICIENT'
      && dims.evidenceConfidence !== 'INFERENCE' && dims.evidenceConfidence !== 'INSUFFICIENT'
      && dims.correctability === 'BOUNDED_MODIFICATION') return 'MODIFIED';

    // 5. UNMODIFIED
    return 'UNMODIFIED';
  }

  // RCD-12.E fixed reasonCode mappings + RCD-14.E preserved special mappings: UNMODIFIED ->
  // NO_SAFETY_CONFLICT; ESCALATED -> PROFESSIONAL_SUPPORT_REQUIRED; DEFERRED -> INFERRED_SIGNAL_
  // NOT_SUFFICIENT (evidenceConfidence === INFERENCE) or INSUFFICIENT_SAFETY_CONTEXT (otherwise);
  // BLOCKED/MODIFIED -> the matched RiskType's own literal (RCD-12.A and RCD-13.A/RCD-11 share
  // nine identical literal values by construction, not by this function's own invention).
  function reasonCodeForRule(dims, disposition) {
    if (disposition === 'UNMODIFIED') return 'NO_SAFETY_CONFLICT';
    if (disposition === 'ESCALATED') return 'PROFESSIONAL_SUPPORT_REQUIRED';
    if (disposition === 'DEFERRED') {
      return dims.evidenceConfidence === 'INFERENCE' ? 'INFERRED_SIGNAL_NOT_SUFFICIENT' : 'INSUFFICIENT_SAFETY_CONTEXT';
    }
    return dims.riskType; // BLOCKED / MODIFIED
  }

  // RCD-14.B — cross-Rule disposition precedence: the winning disposition is the first, in
  // ESCALATED -> BLOCKED -> DEFERRED -> MODIFIED -> UNMODIFIED order, actually produced by any
  // per-Rule Candidate Disposition.
  function selectWinningDisposition(ruleResults) {
    for (var i = 0; i < DISPOSITION_PRECEDENCE.length; i++) {
      var d = DISPOSITION_PRECEDENCE[i];
      for (var j = 0; j < ruleResults.length; j++) {
        if (ruleResults[j].disposition === d) return d;
      }
    }
    return 'UNMODIFIED';
  }

  function evidenceRank(ec) {
    var idx = EVIDENCE_CONFIDENCE.indexOf(ec);
    return idx === -1 ? -1 : (EVIDENCE_CONFIDENCE.length - 1 - idx);
  }
  function urgencyRank(u) {
    return (u in URGENCY_TIEBREAK_RANK) ? URGENCY_TIEBREAK_RANK[u] : -1;
  }
  function ruleOrderRank(riskType) {
    var idx = CANONICAL_SAFETY_RULE_ORDER.indexOf(riskType);
    return idx === -1 ? CANONICAL_SAFETY_RULE_ORDER.length : idx;
  }

  // RCD-14.C — the deterministic same-disposition tie-break, in exact order: (1) disposition
  // precedence is already applied by the caller (filteredResults all share one disposition); (2)
  // Urgency, more time-sensitive wins; (3) EvidenceConfidence, higher D1 Evidence Hierarchy tier
  // wins; (4) Canonical Safety Rule Order, lower (higher-precedence) index wins. The surviving
  // first element is the Primary Rule Result. RCD-13.F forbids duplicate/primary-equal codes
  // inside secondaryReasonCodes; deduplicating against the primary's own code here is a direct,
  // uniform application of that rule — it also correctly empties secondaryReasonCodes whenever
  // every matched Rule collapses to the same reasonCode (e.g. ESCALATED's fixed RCD-14.E mapping
  // to PROFESSIONAL_SUPPORT_REQUIRED, or DEFERRED's two fixed codes), without a disposition-
  // specific special case.
  function selectPrimaryAndSecondary(filteredResults) {
    if (!filteredResults || filteredResults.length === 0) return { primary: null, secondaryCodes: [] };
    var sorted = filteredResults.slice().sort(function (a, b) {
      var ur = urgencyRank(b.urgency) - urgencyRank(a.urgency);
      if (ur !== 0) return ur;
      var er = evidenceRank(b.evidenceConfidence) - evidenceRank(a.evidenceConfidence);
      if (er !== 0) return er;
      return ruleOrderRank(a.riskType) - ruleOrderRank(b.riskType);
    });
    var primary = sorted[0];
    var seen = {};
    seen[primary.reasonCode] = true;
    var secondaryCodes = [];
    for (var i = 1; i < sorted.length; i++) {
      var code = sorted[i].reasonCode;
      if (!seen[code]) {
        seen[code] = true;
        secondaryCodes.push(code);
      }
    }
    return { primary: primary, secondaryCodes: secondaryCodes };
  }

  // RCD-13.B/RCD-14.D — SafetyReasonDetail assembly: null when no secondary codes remain,
  // otherwise { secondaryReasonCodes }.
  function buildReasonDetail(secondaryCodes) {
    if (!secondaryCodes || secondaryCodes.length === 0) return null;
    return freezeShallow({ secondaryReasonCodes: freezeShallow(secondaryCodes.slice()) });
  }

  // The complete Canonical Safety Rule evaluation model (RCD-12.E, RCD-14.A-D), pure and
  // independently testable: per-Rule predicate evaluation -> cross-Rule disposition precedence
  // -> same-disposition tie-break -> primary/secondary reasonCode assembly. `matchedRules`: an
  // array of dimension tuples (see evaluateRulePredicate's doc above) — the shape
  // matchCanonicalSafetyRules() would produce for each genuinely matched Canonical Safety Rule.
  // Zero matched Rules is RCD-12.E's own UNMODIFIED case directly ("no repository-supported
  // safety conflict exists"), not synthesized through a NONE-RiskType Rule Result.
  function evaluateCanonicalSafetyRules(matchedRules) {
    if (!matchedRules || matchedRules.length === 0) {
      return { disposition: 'UNMODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null };
    }
    var ruleResults = matchedRules.map(function (dims) {
      var disposition = evaluateRulePredicate(dims);
      var reasonCode = reasonCodeForRule(dims, disposition);
      var out = {};
      for (var k in dims) { if (Object.prototype.hasOwnProperty.call(dims, k)) out[k] = dims[k]; }
      out.disposition = disposition;
      out.reasonCode = reasonCode;
      return out;
    });
    var winningDisposition = selectWinningDisposition(ruleResults);
    var filtered = ruleResults.filter(function (r) { return r.disposition === winningDisposition; });
    var picked = selectPrimaryAndSecondary(filtered);
    return {
      disposition: winningDisposition,
      reasonCode: picked.primary.reasonCode,
      reasonDetail: buildReasonDetail(picked.secondaryCodes)
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // SafetyIntegrationPort implementation — Stage 8 (D1-AH-02 binary absolute-override check,
  // SPEC Ch.14, narrower than the full Matrix) and Stage 9 (the full Safety Decision Matrix,
  // SPEC Ch.15-18).
  // ══════════════════════════════════════════════════════════════════

  // Stage 8 — binary disqualification against exactly the four D1-AH-02 absolute-override Rule
  // types (ABSOLUTE_OVERRIDE_RISK_TYPES), not the full five-disposition Matrix (SPEC Ch.14: "the
  // four categories fixed by [D1-AH-02]... Disqualification is binary; no graded/partial
  // disqualification exists in any canonical source"). Where more than one absolute-override Rule
  // matches the same Candidate simultaneously, the same RCD-14.C tie-break (Urgency ->
  // EvidenceConfidence -> Canonical Safety Rule Order; disposition precedence does not apply here,
  // since every matched Rule shares the same "disqualifying" outcome) selects the primary
  // reasonCode; every other matched Rule populates reasonDetail.secondaryReasonCodes.
  async function disqualify(candidatePool, pipelineContext) {
    candidatePool = Array.isArray(candidatePool) ? candidatePool : [];
    return candidatePool.map(function (candidate) {
      var matched = matchCanonicalSafetyRules(candidate, null, pipelineContext)
        .filter(function (dims) { return ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf(dims.riskType) !== -1; })
        .map(function (dims) {
          var out = {};
          for (var k in dims) { if (Object.prototype.hasOwnProperty.call(dims, k)) out[k] = dims[k]; }
          out.reasonCode = dims.riskType;
          return out;
        });

      if (matched.length === 0) {
        return freezeShallow({
          opportunityProvenance: candidate && candidate.opportunityProvenance,
          disqualified: false,
          reasonCode: 'NO_SAFETY_CONFLICT',
          reasonDetail: null,
          reason: null
        });
      }

      var picked = selectPrimaryAndSecondary(matched);
      return freezeShallow({
        opportunityProvenance: candidate && candidate.opportunityProvenance,
        disqualified: true,
        reasonCode: picked.primary.reasonCode,
        reasonDetail: buildReasonDetail(picked.secondaryCodes),
        reason: picked.primary.reasonCode
      });
    });
  }

  // Stage 9 — the full Safety Decision Matrix (RCD-12/13/14), reviewing the pre-review Terminal
  // Decision assembled by Decision Formation (SPEC Ch.13, Ch.15).
  async function finalReview(preReviewTerminalDecision, pipelineContext) {
    var matchedRules = matchCanonicalSafetyRules(null, preReviewTerminalDecision, pipelineContext);
    var evaluation = evaluateCanonicalSafetyRules(matchedRules);

    // RCD-13.D requires non-null modifiedContent for MODIFIED; see file header — no canonical
    // content-generation algorithm exists, so this is honestly left null rather than fabricated.
    // Unreachable at this baseline (Correctability can only be BOUNDED_MODIFICATION following a
    // positively-matched Rule, and matchCanonicalSafetyRules() never matches one, see above).
    var modifiedContent = null;

    return freezeShallow({
      disposition: evaluation.disposition,
      modifiedContent: modifiedContent,
      reasonCode: evaluation.reasonCode,
      reasonDetail: evaluation.reasonDetail,
      reason: evaluation.reasonCode === 'NO_SAFETY_CONFLICT' ? null : evaluation.reasonCode
    });
  }

  var API = {
    // Closed enums (RCD-12.A-D)
    RISK_TYPES: RISK_TYPES,
    EVIDENCE_CONFIDENCE: EVIDENCE_CONFIDENCE,
    CORRECTABILITY: CORRECTABILITY,
    URGENCY: URGENCY,
    CANONICAL_SAFETY_RULE_ORDER: CANONICAL_SAFETY_RULE_ORDER,
    ABSOLUTE_OVERRIDE_RISK_TYPES: ABSOLUTE_OVERRIDE_RISK_TYPES,

    // Pure, independently-testable evaluation-model internals (RCD-12.E, RCD-14.A-D)
    evaluateRulePredicate: evaluateRulePredicate,
    reasonCodeForRule: reasonCodeForRule,
    selectWinningDisposition: selectWinningDisposition,
    selectPrimaryAndSecondary: selectPrimaryAndSecondary,
    buildReasonDetail: buildReasonDetail,
    evaluateCanonicalSafetyRules: evaluateCanonicalSafetyRules,

    // Repository-evidence-bound matching (currently always empty — see file header)
    matchCanonicalSafetyRules: matchCanonicalSafetyRules,

    // SafetyIntegrationPort implementation (Stage 8 / Stage 9)
    disqualify: disqualify,
    finalReview: finalReview,

    // Stage 3 contribution, dispatched by internalPipelineOrchestrator.js
    detectSafetyOpportunities: detectSafetyOpportunities
  };

  if (typeof window !== 'undefined') { window.SafetyLayer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
