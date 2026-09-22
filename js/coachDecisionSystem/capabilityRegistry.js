// ══════════════════════════════════════════════════════════════════
// FitMe — Capability Registry (WP0 Phase A, docs/specs/WP0_SPEC_v1.0.md §15/§16,
// Product/Architecture-approved Revision 3)
// Exclusive responsibility: define the CapabilityDeclaration contract shape, validate and
// store registrations, and resolve a Need to exactly one capability (a specific match or the
// single mandatory FALLBACK entry) plus that capability's composed context via
// ContextComposer.assemble(). Does not itself decide domain/topic semantics, does not call an
// AI model, and does not persist anything. Never invoked from the live pipeline in Phase A
// (WP0_SPEC_v1.0.md §31 Phase A: "built and unit-tested in isolation, not yet wired into the
// live pipeline") — conversationalNeedCreator.js/internalPipelineOrchestrator.js are not
// modified by this file; wiring this Registry into them is WP0 Phase B (TRR migration), out of
// scope here.
//
// This module owns the closed NEED_SHAPES vocabulary (§14) — a governance enum describing
// conversational SHAPE, not topic, per the SPEC's Invariant that no enum may become a hidden
// taxonomy of the user's world (§10). It is never extended per-domain/per-topic.
//
// FALLBACK uniqueness (§16): exactly one registered CapabilityDeclaration may declare
// acceptedNeedCharacteristics.scopeMatch === 'FALLBACK'; a second attempt is rejected at
// registration time, mirroring stateAccess.js's own closed-permission-table discipline.
//
// Required-context-failure handling (§16, Round 3 item 3, binding): when a resolved,
// non-FALLBACK capability's required context is unavailable, resolve() reports
// 'REQUIRED_CONTEXT_UNAVAILABLE' and does NOT re-resolve against FALLBACK — General Reasoning
// FALLBACK exists for Needs with no appropriate specialized capability; it must not become a
// mechanism for bypassing a specialized capability's declared required-context contract.
// Translating this into a real TerminalDecision (reusing decisionFormation.js's existing,
// unmodified formUnsupportedCapabilityOutcome()) is pipeline-wiring work deferred to Phase B —
// this module returns the deterministic status only.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ContextComposer = (typeof module !== 'undefined' && module.exports)
    ? require('./contextComposer.js')
    : window.ContextComposer;

  var CAPABILITY_REGISTRY_VERSION = '1.1.0'; // WP0 Phase A, extended additively at WP0 Phase E.0.2a

  // §14 — the exact, exhaustive, closed NEED_SHAPES vocabulary. Describes conversational
  // shape, never topic; never extended per-domain/per-topic (§10 Invariant).
  var NEED_SHAPES = Object.freeze([
    'REQUEST_FOR_ACTION',
    'REQUEST_FOR_INFORMATION',
    'DISCLOSURE',
    'PLANNING',
    'COMPARISON',
    'RECOMMENDATION_REQUEST',
    'FOLLOW_UP',
    'MULTI_NEED'
  ]);

  var OUTPUT_CONTRACT = 'STANDARD_PROPOSAL'; // §19 — the only legal value in WP0

  // WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
  // §05.2) — governance/access-risk only, classifying a capability's own reasoning BREADTH.
  // Orthogonal to, and never consulted for, sensitive-context access authorization (§09/§10/§11
  // of the same SPEC — a binding Product/Architecture correction: capability risk classification
  // != sensitive-context access authorization).
  var CAPABILITY_RISK_TIERS = Object.freeze(['STANDARD', 'ELEVATED']);

  // WP0 Phase E.0.2a (§09) — the dedicated, independent sensitive-context-access authority.
  // Required, no implicit default: a CapabilityDeclaration omitting this field, or supplying a
  // value outside this closed pair, fails registration entirely (§12) — the strongest possible
  // fail-closed posture, since an unreviewed capability can never even enter the registry.
  // Never derived from capabilityRiskTier or any other field; always an independent, one-time,
  // Architecture-reviewed declaration about THIS capability alone.
  var SENSITIVE_CONTEXT_ACCESS_POLICIES = Object.freeze(['AUTHORIZED', 'NOT_AUTHORIZED']);

  var _capabilities = {}; // id -> CapabilityDeclaration
  var _order = [];        // registration order, used only for deterministic tie-break (§39)
  var _fallbackId = null; // id of the single registered FALLBACK declaration, or null

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isStringArray(a) { return Array.isArray(a) && a.every(isNonEmptyString); }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  function isValidNeedShapesValue(v) {
    if (v === 'ANY') return true;
    return Array.isArray(v) && v.length > 0 && v.every(function (s) { return NEED_SHAPES.indexOf(s) !== -1; });
  }

  function isValidScopeMatch(v) {
    if (v === 'FALLBACK') return true;
    if (typeof v === 'function') return true;
    if (isPlainObject(v) && isNonEmptyString(v.domain) && isNonEmptyString(v.topic)) return true;
    return false;
  }

  // §15 — full CapabilityDeclaration shape validation. Returns { ok:true } or
  // { ok:false, error:{code,message} }; never throws.
  function validateDeclaration(def) {
    if (!isPlainObject(def)) {
      return { ok: false, error: { code: 'INVALID_DECLARATION', message: 'CapabilityDeclaration must be an object' } };
    }
    if (!isNonEmptyString(def.id)) {
      return { ok: false, error: { code: 'INVALID_ID', message: 'CapabilityDeclaration.id must be a non-empty string' } };
    }
    if (_capabilities[def.id]) {
      return { ok: false, error: { code: 'DUPLICATE_ID', message: 'Capability already registered: ' + def.id } };
    }
    if (!isNonEmptyString(def.purpose)) {
      return { ok: false, error: { code: 'INVALID_PURPOSE', message: 'CapabilityDeclaration.purpose must be a non-empty string' } };
    }

    var anc = def.acceptedNeedCharacteristics;
    if (!isPlainObject(anc)) {
      return { ok: false, error: { code: 'INVALID_ACCEPTED_NEED_CHARACTERISTICS', message: 'acceptedNeedCharacteristics must be an object' } };
    }
    if (!isValidNeedShapesValue(anc.needShapes)) {
      return { ok: false, error: { code: 'INVALID_NEED_SHAPES', message: 'acceptedNeedCharacteristics.needShapes must be "ANY" or a non-empty array of NEED_SHAPES members' } };
    }
    if (!isValidScopeMatch(anc.scopeMatch)) {
      return { ok: false, error: { code: 'INVALID_SCOPE_MATCH', message: 'acceptedNeedCharacteristics.scopeMatch must be "FALLBACK", a {domain,topic} pair, or a matcher function' } };
    }
    if (typeof anc.priority !== 'number' || !isFinite(anc.priority) || Math.floor(anc.priority) !== anc.priority) {
      return { ok: false, error: { code: 'INVALID_PRIORITY', message: 'acceptedNeedCharacteristics.priority must be an integer' } };
    }
    // §16 — FALLBACK uniqueness, enforced at registration time.
    if (anc.scopeMatch === 'FALLBACK' && _fallbackId !== null) {
      return { ok: false, error: { code: 'DUPLICATE_FALLBACK', message: 'A FALLBACK capability is already registered: ' + _fallbackId } };
    }

    if (!Array.isArray(def.requiredContext) || !isStringArray(def.requiredContext)) {
      return { ok: false, error: { code: 'INVALID_REQUIRED_CONTEXT', message: 'requiredContext must be an array of ContextFragmentProvider ids (may be empty)' } };
    }
    if (!Array.isArray(def.contextCeiling) || !isStringArray(def.contextCeiling)) {
      return { ok: false, error: { code: 'INVALID_CONTEXT_CEILING', message: 'contextCeiling must be an array of ContextFragmentProvider ids (may be empty)' } };
    }
    // §18 — contextBaseline/needShapeDefaults are Engineering-elaborated, optional fields
    // implementing the SPEC's own described relevance-planning mechanism ("capability's small,
    // fixed, always-eligible subset (if declared)"; "a static default subset for need.shape") —
    // no field name was fixed by the SPEC text itself; both default to empty when omitted.
    var contextBaseline = Array.isArray(def.contextBaseline) ? def.contextBaseline : [];
    if (!isStringArray(contextBaseline)) {
      return { ok: false, error: { code: 'INVALID_CONTEXT_BASELINE', message: 'contextBaseline must be an array of ContextFragmentProvider ids' } };
    }
    for (var bi = 0; bi < contextBaseline.length; bi++) {
      if (def.contextCeiling.indexOf(contextBaseline[bi]) === -1) {
        return { ok: false, error: { code: 'BASELINE_OUTSIDE_CEILING', message: 'contextBaseline id "' + contextBaseline[bi] + '" is not present in contextCeiling' } };
      }
    }
    var needShapeDefaults = isPlainObject(def.needShapeDefaults) ? def.needShapeDefaults : {};
    var nsdKeys = Object.keys(needShapeDefaults);
    for (var ki = 0; ki < nsdKeys.length; ki++) {
      var shapeKey = nsdKeys[ki];
      if (NEED_SHAPES.indexOf(shapeKey) === -1) {
        return { ok: false, error: { code: 'INVALID_NEED_SHAPE_DEFAULT_KEY', message: 'needShapeDefaults key "' + shapeKey + '" is not a member of NEED_SHAPES' } };
      }
      var ids = needShapeDefaults[shapeKey];
      if (!Array.isArray(ids) || !isStringArray(ids)) {
        return { ok: false, error: { code: 'INVALID_NEED_SHAPE_DEFAULT_VALUE', message: 'needShapeDefaults["' + shapeKey + '"] must be an array of ContextFragmentProvider ids' } };
      }
      for (var idi = 0; idi < ids.length; idi++) {
        if (def.contextCeiling.indexOf(ids[idi]) === -1) {
          return { ok: false, error: { code: 'NEED_SHAPE_DEFAULT_OUTSIDE_CEILING', message: 'needShapeDefaults["' + shapeKey + '"] id "' + ids[idi] + '" is not present in contextCeiling' } };
        }
      }
    }

    if (!Array.isArray(def.availableTools) || !isStringArray(def.availableTools)) {
      return { ok: false, error: { code: 'INVALID_AVAILABLE_TOOLS', message: 'availableTools must be an array of ToolDeclaration ids (may be empty)' } };
    }
    if (def.outputContract !== OUTPUT_CONTRACT) {
      return { ok: false, error: { code: 'INVALID_OUTPUT_CONTRACT', message: 'outputContract must be exactly "' + OUTPUT_CONTRACT + '"' } };
    }

    // WP0 Phase E.0.2a §05.2 — required, closed, no implicit default.
    if (CAPABILITY_RISK_TIERS.indexOf(def.capabilityRiskTier) === -1) {
      return { ok: false, error: { code: 'INVALID_CAPABILITY_RISK_TIER', message: 'capabilityRiskTier must be exactly one of ' + CAPABILITY_RISK_TIERS.join('/') } };
    }
    // WP0 Phase E.0.2a §09 — required, closed, no implicit default; independent of
    // capabilityRiskTier (binding Product/Architecture correction — never derive one from the
    // other, never infer, never default).
    if (SENSITIVE_CONTEXT_ACCESS_POLICIES.indexOf(def.sensitiveContextAccessPolicy) === -1) {
      return { ok: false, error: { code: 'INVALID_SENSITIVE_CONTEXT_ACCESS_POLICY', message: 'sensitiveContextAccessPolicy must be exactly one of ' + SENSITIVE_CONTEXT_ACCESS_POLICIES.join('/') + ', with no implicit default' } };
    }

    var sr = def.safetyRequirements;
    if (!isPlainObject(sr)) {
      return { ok: false, error: { code: 'INVALID_SAFETY_REQUIREMENTS', message: 'safetyRequirements must be an object' } };
    }
    if (!Array.isArray(sr.riskCharacteristicDimensions) || !isStringArray(sr.riskCharacteristicDimensions)) {
      return { ok: false, error: { code: 'INVALID_RISK_CHARACTERISTIC_DIMENSIONS', message: 'safetyRequirements.riskCharacteristicDimensions must be an array of strings (may be empty; the closed dimension set itself is Phase D, not yet defined)' } };
    }
    if (sr.mustPassFinalReview !== true) {
      return { ok: false, error: { code: 'INVALID_MUST_PASS_FINAL_REVIEW', message: 'safetyRequirements.mustPassFinalReview must be exactly true — fixed, non-overridable (§10 Invariant)' } };
    }
    if (sr.riskTagsAreAdvisoryOnly !== true) {
      return { ok: false, error: { code: 'INVALID_RISK_TAGS_ADVISORY_FLAG', message: 'safetyRequirements.riskTagsAreAdvisoryOnly must be exactly true — a model-produced risk classification is never Safety authority in itself (§27 Round 2 correction 3)' } };
    }

    if (!Array.isArray(def.mutationPermissions)) {
      return { ok: false, error: { code: 'INVALID_MUTATION_PERMISSIONS', message: 'mutationPermissions must be an array' } };
    }

    var pr = def.provenanceRequirements;
    if (!isPlainObject(pr) || typeof pr.requiresExternalRetrieval !== 'boolean') {
      return { ok: false, error: { code: 'INVALID_PROVENANCE_REQUIREMENTS', message: 'provenanceRequirements must be an object with a boolean requiresExternalRetrieval' } };
    }

    return { ok: true };
  }

  function register(def) {
    var validation = validateDeclaration(def);
    if (!validation.ok) return validation;

    var stored = {
      id: def.id,
      purpose: def.purpose,
      acceptedNeedCharacteristics: {
        needShapes: def.acceptedNeedCharacteristics.needShapes === 'ANY' ? 'ANY' : def.acceptedNeedCharacteristics.needShapes.slice(),
        scopeMatch: def.acceptedNeedCharacteristics.scopeMatch,
        priority: def.acceptedNeedCharacteristics.priority
      },
      requiredContext: def.requiredContext.slice(),
      capabilityRiskTier: def.capabilityRiskTier,
      sensitiveContextAccessPolicy: def.sensitiveContextAccessPolicy,
      contextCeiling: def.contextCeiling.slice(),
      contextBaseline: (Array.isArray(def.contextBaseline) ? def.contextBaseline : []).slice(),
      needShapeDefaults: isPlainObject(def.needShapeDefaults) ? JSON.parse(JSON.stringify(def.needShapeDefaults)) : {},
      availableTools: def.availableTools.slice(),
      outputContract: def.outputContract,
      safetyRequirements: {
        riskCharacteristicDimensions: def.safetyRequirements.riskCharacteristicDimensions.slice(),
        mustPassFinalReview: true,
        riskTagsAreAdvisoryOnly: true
      },
      mutationPermissions: def.mutationPermissions.slice(),
      provenanceRequirements: { requiresExternalRetrieval: def.provenanceRequirements.requiresExternalRetrieval }
    };

    _capabilities[def.id] = stored;
    _order.push(def.id);
    if (stored.acceptedNeedCharacteristics.scopeMatch === 'FALLBACK') { _fallbackId = def.id; }
    return { ok: true };
  }

  function getById(id) { return _capabilities[id] || null; }
  function getAll() { return _order.map(function (id) { return _capabilities[id]; }); }
  function getFallback() { return _fallbackId !== null ? _capabilities[_fallbackId] : null; }

  // כלי לבדיקות בלבד — מנקה את ה-registry בין test cases. אינו חלק מהחוזה הפרודקשני
  // (mirrors engineRegistry.js's own __resetForTests__ precedent exactly).
  function __resetForTests__() {
    _capabilities = {};
    _order = [];
    _fallbackId = null;
  }

  function needShapeMatches(declaredNeedShapes, needShapeOrArray) {
    if (declaredNeedShapes === 'ANY') return true;
    var needShapes = Array.isArray(needShapeOrArray) ? needShapeOrArray : [needShapeOrArray];
    for (var i = 0; i < needShapes.length; i++) {
      if (declaredNeedShapes.indexOf(needShapes[i]) !== -1) return true;
    }
    return false;
  }

  function scopeMatches(scopeMatch, need) {
    if (scopeMatch === 'FALLBACK') return false; // FALLBACK never matches as a "specific" candidate
    if (typeof scopeMatch === 'function') {
      try { return scopeMatch(need) === true; } catch (e) { return false; } // fail-closed, never throws upward
    }
    // {domain, topic} — matches only against need.legacyScopeMatch (§13/§14), the demoted,
    // non-gating hint; never against openScopeDescription/openEntityMentions (§10 Invariant —
    // open semantic content never drives a closed-vocabulary match).
    var lsm = need && need.legacyScopeMatch;
    return !!lsm && lsm.domain === scopeMatch.domain && lsm.topic === scopeMatch.topic;
  }

  // §16 — pure, synchronous MATCHING-ONLY resolution: which capability would be selected for
  // this Need, with NO context acquisition and NO side effects. Split out from resolve() during
  // Phase B (disclosed): conversationalNeedCreator.js's Step B needs a capability-routing
  // decision at Need-recognition time, before Stage 4/5 eligibility has even run — invoking
  // full context assembly that early would be a genuine timing/behavior change (context
  // acquisition happens once, later, at the existing TRR reasoning-invocation step), not a
  // pure routing migration. resolve() below is unchanged in its own external contract; it is
  // now implemented in terms of this function plus ContextComposer.assemble().
  function resolveCapability(need) {
    need = need || {};
    var candidates = _order
      .map(function (id) { return _capabilities[id]; })
      .filter(function (cap) {
        return cap.acceptedNeedCharacteristics.scopeMatch !== 'FALLBACK'
          && needShapeMatches(cap.acceptedNeedCharacteristics.needShapes, need.shape)
          && scopeMatches(cap.acceptedNeedCharacteristics.scopeMatch, need);
      });

    if (candidates.length === 0) { return getFallback(); } // null if none registered

    // Highest priority wins; ties broken by registration order (first-registered-wins, §39's
    // resolved Engineering recommendation — no canonical-contract impact).
    return candidates.reduce(function (best, cap) {
      if (!best) return cap;
      if (cap.acceptedNeedCharacteristics.priority > best.acceptedNeedCharacteristics.priority) return cap;
      return best;
    }, null);
  }

  // §16 — full resolution algorithm: resolveCapability() above, then an async viability check
  // via ContextComposer.assemble() (fragment providers may be asynchronous, §18). Never throws;
  // every failure mode resolves to a defined, honest status. `pipelineContext` (Phase B
  // addition, disclosed — see contextComposer.js's own header) is threaded through to
  // ContextComposer.assemble() so real, per-turn fragment providers can read it.
  async function resolve(need, pipelineContext) {
    need = need || {};
    var resolvedCapability = resolveCapability(need);
    if (!resolvedCapability) {
      // No FALLBACK registered at all — a configuration error, not a runtime Need failure.
      return { status: 'NO_FALLBACK_REGISTERED', capability: null, context: null, reason: 'NO_FALLBACK_REGISTERED', missingContextId: null };
    }

    var composed = await ContextComposer.assemble(need, resolvedCapability, pipelineContext);
    if (!composed.viable) {
      // §16 Round 3 item 3, binding: terminate here — never re-resolve against FALLBACK, even
      // when resolvedCapability !== FALLBACK. Translating this into a real TerminalDecision
      // (reusing decisionFormation.js's existing formUnsupportedCapabilityOutcome()) is Phase B
      // pipeline-wiring work; this module reports the deterministic status only.
      return {
        status: 'REQUIRED_CONTEXT_UNAVAILABLE',
        capability: resolvedCapability,
        context: null,
        reason: 'REQUIRED_CONTEXT_UNAVAILABLE',
        missingContextId: composed.missingId
      };
    }

    return { status: 'RESOLVED', capability: resolvedCapability, context: composed.context, reason: null, missingContextId: null };
  }

  var API = {
    VERSION: CAPABILITY_REGISTRY_VERSION,
    NEED_SHAPES: NEED_SHAPES,
    OUTPUT_CONTRACT: OUTPUT_CONTRACT,
    CAPABILITY_RISK_TIERS: CAPABILITY_RISK_TIERS,
    SENSITIVE_CONTEXT_ACCESS_POLICIES: SENSITIVE_CONTEXT_ACCESS_POLICIES,
    validateDeclaration: validateDeclaration,
    register: register,
    getById: getById,
    getAll: getAll,
    getFallback: getFallback,
    resolveCapability: resolveCapability,
    resolve: resolve,
    __resetForTests__: __resetForTests__
  };

  if (typeof window !== 'undefined') { window.CapabilityRegistry = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
