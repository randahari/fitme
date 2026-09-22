// ══════════════════════════════════════════════════════════════════
// FitMe — Eligibility Policy (WP0 Phase E.0.2a,
// docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md §10/§11)
// Exclusive responsibility: the pure, deterministic policy function that will eventually replace
// CapabilityDeclaration.contextCeiling as the eligibility authority. Computes {eligible,
// reasoningAccessAuthorized} from a ContextFragmentProvider's own declared sensitivityTier/
// consentScope, a CapabilityDeclaration's own declared sensitiveContextAccessPolicy, and a
// user's own ConsentState — never from provider.id or capability.id, never a provider×capability
// matrix, never an AI call of any kind, under any implementation path (same family discipline
// contextRelevancePlanner.js already documents for itself).
//
// SHADOW-MODE ONLY (§13, binding): nothing in the production runtime calls this module in WP0
// Phase E.0.2a. contextRelevancePlanner.js's select() continues to read capability.contextCeiling
// exactly as it does today, byte-for-byte, unmodified. This module exists to be proven
// equivalent (tests/wp0PhaseE02aZeroDriftProof.test.js) before any future, separately-approved
// SPEC ever re-points select()'s own universe at this module's output.
//
// BINDING CORRECTION (Product/Architecture, Narrow Contract Review, §09/§10/§11 of the SPEC
// above): capabilityRiskTier is NEVER read by reasoningAccessAuthorized() below. Capability risk
// classification (reasoning breadth) and sensitive-context access authorization are orthogonal
// governance questions; the sole input to the latter is the capability's own independently
// declared sensitiveContextAccessPolicy.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ContextComposer = (typeof module !== 'undefined' && module.exports)
    ? require('./contextComposer.js')
    : window.ContextComposer;
  var CapabilityRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('./capabilityRegistry.js')
    : window.CapabilityRegistry;
  var ConsentScopeRegistry = (typeof module !== 'undefined' && module.exports)
    ? require('./consentScopeRegistry.js')
    : window.ConsentScopeRegistry;

  var ELIGIBILITY_POLICY_VERSION = '1.0.0'; // WP0 Phase E.0.2a

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // §10 — the base eligibility gate. Never inspects provider.id or capability.id. Fail-closed
  // (§12) for every missing/malformed/unknown input — no branch below ever resolves an unknown
  // condition to true.
  function eligible(provider, capability, consentState) {
    if (!isPlainObject(provider) || !isPlainObject(capability)) return false;
    if (ContextComposer.SENSITIVITY_TIERS.indexOf(provider.sensitivityTier) === -1) return false;
    if (CapabilityRegistry.CAPABILITY_RISK_TIERS.indexOf(capability.capabilityRiskTier) === -1) return false;
    if (!ConsentScopeRegistry.isValidConsentScope(provider.consentScope)) return false;

    if (provider.consentScope === null) return true;

    var grant = isPlainObject(consentState) ? consentState[provider.consentScope] : null;
    if (!grant || grant.granted !== true) return false;
    if (grant.expiresAt && grant.expiresAt <= Date.now()) return false;
    return true;
  }

  // §11 — reasoningAccessAuthorized. capabilityRiskTier is deliberately NOT read here (binding
  // correction, see header). The sole input for the SAFETY_ADJACENT branch is the capability's
  // own declared, registration-time, Architecture-reviewed sensitiveContextAccessPolicy.
  function reasoningAccessAuthorized(provider, capability, consentState) {
    if (!eligible(provider, capability, consentState)) return false;
    if (provider.sensitivityTier === 'STANDARD') return true;
    if (provider.sensitivityTier === 'SAFETY_ADJACENT') {
      return capability.sensitiveContextAccessPolicy === 'AUTHORIZED';
    }
    return false; // unreachable given eligible()'s own guard, kept as an explicit fail-closed floor
  }

  function computeEligibility(provider, capability, consentState) {
    var e = eligible(provider, capability, consentState);
    return freezeShallow({
      eligible: e,
      reasoningAccessAuthorized: e ? reasoningAccessAuthorized(provider, capability, consentState) : false
    });
  }

  // §08.2 — the ONLY point in this SPEC's new code that reads userProfile.memoryConsent. Used
  // exclusively by the shadow-verification test harness (§13) — never by any production runtime
  // path, since nothing production-facing calls eligibilityPolicy in E.0.2a.
  function deriveConsentStateFromProfile(userProfile) {
    var granted = !!(userProfile && userProfile.memoryConsent && userProfile.memoryConsent.granted === true);
    return freezeShallow({
      LEARNED_MEMORY_PERSONALIZATION: freezeShallow({ granted: granted, source: 'migrated' })
    });
  }

  var API = {
    VERSION: ELIGIBILITY_POLICY_VERSION,
    eligible: eligible,
    reasoningAccessAuthorized: reasoningAccessAuthorized,
    computeEligibility: computeEligibility,
    deriveConsentStateFromProfile: deriveConsentStateFromProfile
  };

  if (typeof window !== 'undefined') { window.EligibilityPolicy = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
