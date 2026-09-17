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
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ContextRelevancePlanner = (typeof module !== 'undefined' && module.exports)
    ? require('./contextRelevancePlanner.js')
    : window.ContextRelevancePlanner;

  var CONTEXT_COMPOSER_VERSION = '1.0.0'; // WP0 Phase A

  var AVAILABILITY_VALUES = Object.freeze(['AVAILABLE', 'UNAVAILABLE', 'PARTIAL']);

  var _providers = {}; // id -> ContextFragmentProvider

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isStringArray(a) { return Array.isArray(a) && a.every(isNonEmptyString); }

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
    if ('relevanceTags' in def && !isStringArray(def.relevanceTags)) {
      return { ok: false, error: { code: 'INVALID_RELEVANCE_TAGS', message: 'ContextFragmentProvider.relevanceTags, if present, must be an array of strings' } };
    }
    return { ok: true };
  }

  function registerFragmentProvider(def) {
    var validation = validateProvider(def);
    if (!validation.ok) return validation;
    _providers[def.id] = {
      id: def.id,
      relevanceTags: Array.isArray(def.relevanceTags) ? def.relevanceTags.slice() : [],
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
  async function assemble(need, capability, pipelineContext) {
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

    var relevantFragmentIds = ContextRelevancePlanner.select(need, capability, getFragmentProvider);
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
