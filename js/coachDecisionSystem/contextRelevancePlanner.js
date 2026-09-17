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

  // select(need, capability, getFragmentProvider) → array of ContextFragmentProvider ids,
  // always a subset of capability.contextCeiling. `getFragmentProvider` is injected (rather
  // than requiring contextComposer.js directly) to avoid a circular module dependency —
  // contextComposer.js is the natural caller and already owns the fragment-provider catalogue.
  // Synchronous, throws never, has no async/Promise return — a direct, structural signal (in
  // addition to containing no callClaude reference at all) that no AI round-trip can occur here.
  function select(need, capability, getFragmentProvider) {
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
    return Object.keys(selected).filter(function (id) { return ceiling.indexOf(id) !== -1; });
  }

  var API = {
    VERSION: '1.0.0', // WP0 Phase A
    select: select
  };

  if (typeof window !== 'undefined') { window.ContextRelevancePlanner = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
