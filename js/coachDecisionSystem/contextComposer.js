// ══════════════════════════════════════════════════════════════════
// FitMe — Context Composer (WP0 Phase A, docs/specs/WP0_SPEC_v1.0.md §17/§18,
// Product/Architecture-approved Revision 3)
// Exclusive responsibility: own the ContextFragmentProvider catalogue (a flat, extensible
// registry of named, bounded context readers — §17) and assemble() a capability's context for
// a given Need, using ContextRelevancePlanner (§18) to bound what gets proactively included.
// requiredContext fragments are ALWAYS assembled, never subject to relevance filtering — a
// required fragment reporting UNAVAILABLE makes the capability non-viable for this turn
// (REQUIRED_CONTEXT_UNAVAILABLE), handled by capabilityRegistry.js's resolve() (§16).
//
// Phase A registered NO real fragment providers pointing at memoryLayer.js/stateAccess.js —
// this module was "built and unit-tested in isolation, not yet wired into the live pipeline"
// (WP0_SPEC_v1.0.md §31 Phase A). memoryLayer.js is still not imported, read, or modified by
// this file.
//
// PHASE B ADDITION (disclosed, an Engineering-level realization of the already-approved §17/§18
// contract, discovered while migrating TRR's real fragments — mirrors the Phase A precedent
// already accepted for contextBaseline/needShapeDefaults): assemble() and invoke() now
// additionally thread an optional `pipelineContext` argument through to each
// ContextFragmentProvider.invoke(pipelineContext). Real fragment providers read from the
// already-assembled, per-turn Pipeline Context (memoryLayer.js's assembleContext() output) —
// they are not independently re-invokable global reads, so invoke() needed a way to receive
// that per-turn object. This is purely additive: a zero-arg provider (every Phase A test
// fixture) still works unchanged, since JS ignores an unused extra argument.
//
// WP0 PHASE E.0.1 ADDITION (Product/Architecture-approved, Governed Context Need Planning
// Foundation) — introduces CONTEXT_RELEVANCE_KINDS, the closed taxonomy of functional roles a
// ContextFragmentProvider's relevanceTags may declare (§17), and tightens validateProvider() to
// reject any relevanceTags entry outside it. This is validation-only: ContextRelevancePlanner's
// tag-overlap matching mechanism (contextRelevancePlanner.js §18) is unchanged — it still simply
// intersects whatever tags a provider declares against a Need's openEntityMentions roughKinds,
// with no awareness of this taxonomy itself. Existing provider registrations (trrCapabilityAdapter.js,
// generalReasoningCapability.js) were migrated onto the canonical kinds in the same change so
// registration continues to succeed.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ContextRelevancePlanner = (typeof module !== 'undefined' && module.exports)
    ? require('./contextRelevancePlanner.js')
    : window.ContextRelevancePlanner;
  var ConsentScopeRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('./consentScopeRegistry.js')
    : window.ConsentScopeRegistry;

  var CONTEXT_COMPOSER_VERSION = '1.3.0'; // WP0 Phase E.0.1, extended additively at WP0 Phase E.0.2a, activated at WP0 Phase E.0.2a Activation Amendment

  var AVAILABILITY_VALUES = Object.freeze(['AVAILABLE', 'UNAVAILABLE', 'PARTIAL']);

  // WP0 Phase E.0.1 (Product/Architecture-approved) — the closed, canonical vocabulary of
  // FUNCTIONAL ROLES personal context can play when reasoning about the user. These describe
  // *why* a ContextFragmentProvider is relevant (its structural role), never a world concept, a
  // product vertical, a professional capability, or a concrete provider/data source — mirroring
  // capabilityRegistry.js's own NEED_SHAPES precedent exactly (a closed governance enum owned by
  // the module whose contract it constrains, never extended per-domain/per-topic, §10 Invariant).
  // Closed-by-default: a new provider/domain/food/sport/data-source never justifies a new kind —
  // it maps itself onto one or more of these eight. Adding a ninth requires an explicit
  // Product/Architecture canonical decision proving a genuinely new structural role.
  var CONTEXT_RELEVANCE_KINDS = Object.freeze([
    'CURRENT_PHYSICAL_STATE',
    'BEHAVIORAL_HISTORY',
    'GOALS_AND_INTENT',
    'PREFERENCES_AND_BOUNDARIES',
    'SAFETY_AND_MEDICAL',
    'SITUATIONAL_CONTEXT',
    'RELATIONSHIP_CONTEXT',
    'RECENT_INTERACTION'
  ]);

  // WP0 Phase E.0.2a (docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md
  // §05.1/§06) — governance sensitivity only, never semantic content classification (that remains
  // relevanceTags/CONTEXT_RELEVANCE_KINDS's job, unchanged). Deliberately mirrors GCUK Ch.09's own
  // frozen safetyFlag:'STANDARD'|'SAFETY_ADJACENT' for User Knowledge records.
  var SENSITIVITY_TIERS = Object.freeze(['STANDARD', 'SAFETY_ADJACENT']);

  var _providers = {}; // id -> ContextFragmentProvider

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isStringArray(a) { return Array.isArray(a) && a.every(isNonEmptyString); }
  function isValidRelevanceKind(tag) { return isNonEmptyString(tag) && CONTEXT_RELEVANCE_KINDS.indexOf(tag) !== -1; }
  function isValidRelevanceTags(tags) { return isStringArray(tags) && tags.every(isValidRelevanceKind); }

  // §17 — ContextFragmentProvider shape validation. `invoke` may return either a plain
  // {value, availability} object or a Promise resolving to one — real fragment providers
  // (Phase B) will typically be asynchronous (StateAccess reads are async), so assemble()
  // always awaits `Promise.resolve(provider.invoke())` regardless of which shape a given
  // provider returns.
  function validateProvider(def) {
    if (!isPlainObject(def)) {
      return { ok: false, error: { code: 'INVALID_PROVIDER', message: 'ContextFragmentProvider must be an object' } };
    }
    if (!isNonEmptyString(def.id)) {
      return { ok: false, error: { code: 'INVALID_ID', message: 'ContextFragmentProvider.id must be a non-empty string' } };
    }
    if (_providers[def.id]) {
      return { ok: false, error: { code: 'DUPLICATE_ID', message: 'ContextFragmentProvider already registered: ' + def.id } };
    }
    if (typeof def.invoke !== 'function') {
      return { ok: false, error: { code: 'INVALID_INVOKE', message: 'ContextFragmentProvider.invoke must be a function' } };
    }
    if ('relevanceTags' in def) {
      if (!isStringArray(def.relevanceTags)) {
        return { ok: false, error: { code: 'INVALID_RELEVANCE_TAGS', message: 'ContextFragmentProvider.relevanceTags, if present, must be an array of strings' } };
      }
      // WP0 Phase E.0.1 — relevanceTags may declare one or more canonical CONTEXT_RELEVANCE_KINDS
      // (a provider MAY span multiple functional roles), never an arbitrary/world-concept tag.
      if (!def.relevanceTags.every(isValidRelevanceKind)) {
        return { ok: false, error: { code: 'INVALID_RELEVANCE_TAG', message: 'ContextFragmentProvider.relevanceTags must contain only canonical CONTEXT_RELEVANCE_KINDS values, got: ' + JSON.stringify(def.relevanceTags) } };
      }
    }
    // WP0 Phase E.0.2a §06 — required, closed, no implicit default.
    if (SENSITIVITY_TIERS.indexOf(def.sensitivityTier) === -1) {
      return { ok: false, error: { code: 'INVALID_SENSITIVITY_TIER', message: 'ContextFragmentProvider.sensitivityTier must be exactly one of ' + SENSITIVITY_TIERS.join('/') } };
    }
    // WP0 Phase E.0.2a §06 — required; null is an explicit, valid value (no separate consent
    // requirement for this provider class); any other value must be a member of the Consent
    // Scope Registry (consentScopeRegistry.js) — never an unregistered/free-text id.
    if (!ConsentScopeRegistry.isValidConsentScope(def.consentScope)) {
      return { ok: false, error: { code: 'INVALID_CONSENT_SCOPE', message: 'ContextFragmentProvider.consentScope must be null or a scope id registered in ConsentScopeRegistry' } };
    }
    return { ok: true };
  }

  function registerFragmentProvider(def) {
    var validation = validateProvider(def);
    if (!validation.ok) return validation;
    _providers[def.id] = {
      id: def.id,
      relevanceTags: Array.isArray(def.relevanceTags) ? def.relevanceTags.slice() : [],
      sensitivityTier: def.sensitivityTier,
      consentScope: def.consentScope,
      invoke: def.invoke
    };
    return { ok: true };
  }

  function getFragmentProvider(id) { return _providers[id] || null; }
  function getAllFragmentProviderIds() { return Object.keys(_providers); }

  // כלי לבדיקות בלבד — מנקה את הקטלוג בין test cases. אינו חלק מהחוזה הפרודקשני.
  function __resetForTests__() { _providers = {}; }

  function isValidResult(r) {
    return isPlainObject(r) && AVAILABILITY_VALUES.indexOf(r.availability) !== -1 && ('value' in r);
  }

  async function invokeProvider(id, pipelineContext) {
    var provider = _providers[id];
    if (!provider) {
      // Not registered — honestly UNAVAILABLE, never a thrown error and never fabricated.
      return { value: null, availability: 'UNAVAILABLE' };
    }
    var raw;
    try { raw = await Promise.resolve(provider.invoke(pipelineContext)); }
    catch (e) { raw = null; }
    if (!isValidResult(raw)) { return { value: null, availability: 'UNAVAILABLE' }; }
    return raw;
  }

  // §18 — assemble(need, capability). Required fragments first (always, never relevance-
  // filtered); on the first UNAVAILABLE required fragment, returns viable:false immediately
  // (deterministic, auditable — never a silent guess, never a partial required-context set).
  // Optional fragments are the ContextRelevancePlanner-selected subset only — never the full
  // ceiling — satisfying the binding "must never receive unrestricted access to all FITME
  // state" constraint at the composition boundary.
  //
  // WP0 Phase E.0.2a Activation Amendment §08 — isReasoningAccessAuthorized is a new, additive,
  // fourth parameter: a plain (provider) => boolean closure, built and injected by the caller
  // (e.g. trrCapabilityAdapter.js), never required by this file directly — EligibilityPolicy
  // itself is not required here (would create a circular require: eligibilityPolicy.js already
  // requires this file). Passed straight through to ContextRelevancePlanner.select(), which is
  // the sole enforcement seam (§08's own binding text). requiredContext's own unconditional
  // invocation loop above is deliberately NOT gated by this closure — the Amendment's named seam
  // is select()'s own final filter only (§08), and both currently-registered capabilities declare
  // requiredContext:[] today, so this is a documented scope boundary, not an oversight.
  async function assemble(need, capability, pipelineContext, isReasoningAccessAuthorized) {
    capability = capability || {};
    var requiredContext = Array.isArray(capability.requiredContext) ? capability.requiredContext : [];
    var requiredResults = {};
    for (var i = 0; i < requiredContext.length; i++) {
      var id = requiredContext[i];
      var result = await invokeProvider(id, pipelineContext);
      requiredResults[id] = result;
      if (result.availability === 'UNAVAILABLE') {
        return { viable: false, reason: 'REQUIRED_CONTEXT_UNAVAILABLE', missingId: id };
      }
    }

    var relevantFragmentIds = ContextRelevancePlanner.select(need, capability, getFragmentProvider, isReasoningAccessAuthorized);
    var optionalResults = {};
    for (var j = 0; j < relevantFragmentIds.length; j++) {
      var oid = relevantFragmentIds[j];
      if (oid in requiredResults) continue; // already assembled above; never double-invoked
      optionalResults[oid] = await invokeProvider(oid, pipelineContext);
    }

    var context = {};
    Object.keys(requiredResults).forEach(function (k) { context[k] = requiredResults[k]; });
    Object.keys(optionalResults).forEach(function (k) { context[k] = optionalResults[k]; });

    return { viable: true, context: context };
  }

  var API = {
    VERSION: CONTEXT_COMPOSER_VERSION,
    AVAILABILITY_VALUES: AVAILABILITY_VALUES,
    CONTEXT_RELEVANCE_KINDS: CONTEXT_RELEVANCE_KINDS,
    SENSITIVITY_TIERS: SENSITIVITY_TIERS,
    isValidRelevanceKind: isValidRelevanceKind,
    isValidRelevanceTags: isValidRelevanceTags,
    validateProvider: validateProvider,
    registerFragmentProvider: registerFragmentProvider,
    getFragmentProvider: getFragmentProvider,
    getAllFragmentProviderIds: getAllFragmentProviderIds,
    assemble: assemble,
    __resetForTests__: __resetForTests__
  };

  if (typeof window !== 'undefined') { window.ContextComposer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
