// ══════════════════════════════════════════════════════════════════
// FitMe — Consent Scope Registry (WP0 Phase E.0.2a,
// docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md §07)
// Exclusive responsibility: own the closed-but-deliberately-extensible registry of consent
// "scope" ids a ContextFragmentProvider MAY declare (via its own new consentScope field,
// contextComposer.js). Structurally identical to memory.js's own MEMORY_TYPES precedent
// (memory.js:45) and contextComposer.js's own CONTEXT_RELEVANCE_KINDS precedent — never edited
// implicitly, extended only by a deliberate, reviewed, one-time registration act, satisfying
// GCUK's own "New Source Principle" (Ch.19) at the consent layer specifically.
//
// Scope ids are named by PURPOSE-OF-USE (why the data is processed), never by CONTENT DOMAIN
// (what the data is about) — this is what keeps this registry a governance/process taxonomy,
// never a forbidden world/domain taxonomy (WP0_PHASE_E_0_2A_SPEC §07). eligibilityPolicy.js
// never branches on a specific scope id's value — it only performs a generic map lookup against
// a user's own ConsentState, so this registry's own internal contents can grow without
// eligibilityPolicy.js's own code changing at all.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CONSENT_SCOPE_REGISTRY_VERSION = '1.0.0'; // WP0 Phase E.0.2a

  // §08.2 — the sole scope registered as of E.0.2a: the purpose `memoryConsent.granted` already
  // gates today (stored/cross-session learned personalization). Not attached to any of the 8
  // currently-registered ContextFragmentProviders (none of them are backed by memoryConsent-gated
  // data today — see the SPEC's own §04/§17 evidence) — it exists here for a future provider that
  // genuinely reads Typed Memory / learned personalization data.
  var REGISTERED_CONSENT_SCOPES = Object.freeze([
    'LEARNED_MEMORY_PERSONALIZATION'
  ]);

  // A provider's consentScope is valid when it is exactly null (an explicit, governed
  // declaration that this provider class requires no separate consent — never a silent default)
  // or a member of the registry above. Never any other value.
  function isValidConsentScope(scopeId) {
    return scopeId === null || REGISTERED_CONSENT_SCOPES.indexOf(scopeId) !== -1;
  }

  var API = {
    VERSION: CONSENT_SCOPE_REGISTRY_VERSION,
    REGISTERED_CONSENT_SCOPES: REGISTERED_CONSENT_SCOPES,
    isValidConsentScope: isValidConsentScope
  };

  if (typeof window !== 'undefined') { window.ConsentScopeRegistry = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
