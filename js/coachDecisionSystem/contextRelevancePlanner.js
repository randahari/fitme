// ══════════════════════════════════════════════════════════════════
// FitMe — Context Relevance Planner (WP0 Phase A, docs/specs/WP0_SPEC_v1.0.md §18,
// Product/Architecture-approved Revision 3, Round 3 item 4)
// Exclusive responsibility: select the subset of a CapabilityDeclaration's contextCeiling
// that is relevant to a given Need, before ContextComposer assembles it. This is a PURE,
// DETERMINISTIC function — it contains no AI/model call of any kind, under any implementation
// path, and never will (this is a binding, tested invariant, not an incidental Phase A
// implementation detail — Round 3 item 4: "must not become another general reasoning engine").
//
// select() never returns an id outside capability.contextCeiling, under any input — the
// ceiling is enforced defensively here even though every caller is expected to have already
// validated it (§15's registration-time checks) — a second, independent enforcement point,
// mirroring the same "never merely trusted from one layer" discipline CPI-001's
// preferenceIntakeGate.js already established (literal-anchor re-verification, never trusting
// the interpreter's own classification alone).
//
// Matching is by two purely deterministic mechanisms, per Round 3 item 4's explicit preference
// for deterministic Need/context metadata: (a) a capability-declared, per-NEED_SHAPES default
// subset (capability.needShapeDefaults), and (b) a lightweight relevance-tag overlap between a
// ContextFragmentProvider's own declared, static relevanceTags (§17) and the Need's
// openEntityMentions[].roughKind values. Neither mechanism ever blocks Need creation, capability
// resolution, or a concept from being discussed (§10 Invariant) — a tag/default mismatch only
// affects what is proactively pre-loaded; the remainder of contextCeiling stays reachable via
// the governed, observable, on-demand tool-mediated path (§17/§24, WP0 Phase F — not built in
// Phase A, since ToolRegistry does not exist yet; Phase A's contract here is unaffected by that
// later addition).
//
// WP0 PHASE E.0.2a ACTIVATION AMENDMENT (docs/specs/WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md
// §06/§08) — the deterministic eligibility/authorization policy (eligibilityPolicy.js, E.0.2a,
// shadow-mode since 359d7d9) becomes AUTHORITATIVE at this exact seam: select()'s own final
// return line is now the single, non-bypassable point every candidate — however it was selected
// (baseline, needShapeDefaults, tag-overlap) — must additionally satisfy
// `reasoningAccessAuthorized === true` to survive. contextCeiling remains the outer bound,
// unchanged, retained per GCUK Ch.06's own transitional "override/cap" framing — authorization is
// a narrower, ADDITIONAL requirement layered on top of it, never a replacement. This module still
// never requires eligibilityPolicy.js directly (would reintroduce the exact circular-require this
// file's own header already explains getFragmentProvider avoids: eligibilityPolicy.js itself
// requires contextComposer.js, which requires this file) — the caller (contextComposer.js, itself
// injected from trrCapabilityAdapter.js/generalReasoningCapability.js) supplies a plain
// (provider) => boolean closure instead, the same injection pattern getFragmentProvider already
// established. Fail-closed, by construction: if isReasoningAccessAuthorized is not a real
// function, or returns anything other than true for a given provider, that provider does not
// survive — no permissive fallback, no semantic mechanism may compensate (Amendment §10).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  function normalizeNeedShapes(needShapeOrArray) {
    if (!needShapeOrArray) return [];
    return Array.isArray(needShapeOrArray) ? needShapeOrArray : [needShapeOrArray];
  }

  function entityRoughKinds(need) {
    var mentions = (need && Array.isArray(need.openEntityMentions)) ? need.openEntityMentions : [];
    var kinds = {};
    mentions.forEach(function (m) {
      if (m && isNonEmptyString(m.roughKind)) { kinds[m.roughKind] = true; }
    });
    return kinds;
  }

  function tagsOverlap(relevanceTags, roughKinds) {
    if (!Array.isArray(relevanceTags) || relevanceTags.length === 0) return false;
    for (var i = 0; i < relevanceTags.length; i++) {
      if (roughKinds[relevanceTags[i]]) return true;
    }
    return false;
  }

  // select(need, capability, getFragmentProvider, isReasoningAccessAuthorized) → array of
  // ContextFragmentProvider ids, always a subset of capability.contextCeiling AND always a
  // subset of the isReasoningAccessAuthorized-approved set (Activation Amendment §08). Both
  // `getFragmentProvider` and `isReasoningAccessAuthorized` are injected (rather than requiring
  // contextComposer.js/eligibilityPolicy.js directly) to avoid a circular module dependency —
  // contextComposer.js is the natural caller and already owns the fragment-provider catalogue;
  // eligibilityPolicy.js is never required here for the same reason (see file header). Synchronous,
  // throws never, has no async/Promise return — a direct, structural signal (in addition to
  // containing no callClaude reference at all) that no AI round-trip can occur here.
  function select(need, capability, getFragmentProvider, isReasoningAccessAuthorized) {
    need = need || {};
    capability = capability || {};
    var ceiling = Array.isArray(capability.contextCeiling) ? capability.contextCeiling : [];
    if (ceiling.length === 0) return [];

    var baseline = Array.isArray(capability.contextBaseline) ? capability.contextBaseline : [];
    var needShapeDefaults = (capability.needShapeDefaults && typeof capability.needShapeDefaults === 'object') ? capability.needShapeDefaults : {};
    var roughKinds = entityRoughKinds(need);

    var selected = {};
    baseline.forEach(function (id) { selected[id] = true; });

    normalizeNeedShapes(need.shape).forEach(function (shape) {
      var ids = needShapeDefaults[shape];
      if (Array.isArray(ids)) { ids.forEach(function (id) { selected[id] = true; }); }
    });

    if (typeof getFragmentProvider === 'function') {
      ceiling.forEach(function (id) {
        if (selected[id]) return;
        var provider = getFragmentProvider(id);
        if (provider && tagsOverlap(provider.relevanceTags, roughKinds)) { selected[id] = true; }
      });
    }

    // Defensive, independent re-enforcement of the ceiling bound (see header) — never trust
    // upstream validation alone for the one invariant this whole correction exists to guarantee.
    //
    // WP0 Phase E.0.2a Activation Amendment §08/§10 — the SAME final filter additionally
    // enforces reasoningAccessAuthorized, covering every candidate regardless of which mechanism
    // above selected it (baseline, needShapeDefaults, tag-overlap) — the one, non-bypassable
    // chokepoint every selection path and every future one (a future E.0.2b discovery proposal)
    // already funnels through. Fail-closed: a missing getFragmentProvider, a missing/non-function
    // isReasoningAccessAuthorized, an unresolvable provider, or an authorization check that
    // returns anything other than exactly `true` all resolve the SAME way — the candidate does
    // not survive. No permissive fallback exists for any of these cases.
    return Object.keys(selected).filter(function (id) {
      if (ceiling.indexOf(id) === -1) return false;
      if (typeof getFragmentProvider !== 'function' || typeof isReasoningAccessAuthorized !== 'function') return false;
      var provider = getFragmentProvider(id);
      return !!provider && isReasoningAccessAuthorized(provider) === true;
    });
  }

  var API = {
    VERSION: '2.0.0', // WP0 Phase A, activated at WP0 Phase E.0.2a Activation Amendment
    select: select
  };

  if (typeof window !== 'undefined') { window.ContextRelevancePlanner = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
