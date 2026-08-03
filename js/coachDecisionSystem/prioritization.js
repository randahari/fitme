// ══════════════════════════════════════════════════════════════════
// FitMe — Prioritization (TASK-006, D2 Stage 7 — Candidate Pool Assembly +
// Prioritization, TASK_006_SPEC_v1.0.md §16-19)
// Exclusive responsibility: (1) assemble the full, validated shared
// Candidate pool across every Opportunity and both producer engines this
// Decision Pass (§16), and (2) rank that pool per D1 Unit 07's fixed
// lexicographic sequence — Hierarchy tier (D1-PR-01) -> impact tier, same-
// kind Recommendation ties only (D1-PR-02, Canonical Decision CD-T006-03)
// -> biggest-problem-first (D1-PR-03) -> D1-PR-06's four-step tie-break
// order (§19) — never a numeric composite score (§17.7). internal
// collaborator only; not independently registered. Pure, deterministic:
// identical pool -> identical ranking (§27.1).
//
// The NO_SIGNAL sentinel (Canonical Decision CD-T006-02, Engineering Fill
// §14.12) is defined here — the single source of truth reused, not
// duplicated, by recommendationEngine.js/initiativeEngine.js (population)
// and this module (comparison semantics, §14.12.1): a NO_SIGNAL value never
// outranks a real value, and NO_SIGNAL vs NO_SIGNAL never distinguishes a
// tie — the sequence simply proceeds to the next criterion.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Canonical Decision CD-T006-02 / Engineering Fill §14.12.1 — the literal sentinel value for
  // "no classification source currently exists for this arbitration-metadata field." Never a
  // fabricated number; never simply omitted.
  var NO_SIGNAL = 'NO_SIGNAL';

  var ARBITRATION_METADATA_FIELDS = Object.freeze([
    'evidenceTier', 'trustImpact', 'timingQuality', 'triggeringEvidenceTime', 'problemMagnitude'
  ]);

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }
  function isValidConfidence(n) { return isFiniteNumber(n) && n >= 0 && n <= 1; }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined; }

  // §16.3 — validation before admission to the shared pool, extended by the CD-T006-02
  // arbitration-metadata set (§14.3). A field carrying the literal NO_SIGNAL sentinel is present,
  // valid, and fully specified (§14.12.1) — rejection occurs only when a field is structurally
  // absent from the object entirely.
  function validateCandidateForPool(c) {
    if (!isPlainObject(c)) return 'candidate is not an object';
    if (c.kind !== 'Recommendation' && c.kind !== 'INITIATIVE') return 'candidate.kind must be Recommendation or INITIATIVE';
    if (!isFiniteNumber(c.hierarchyTier)) return 'candidate.hierarchyTier is required';
    if (!isValidConfidence(c.confidence)) return 'candidate.confidence must be a number in [0,1]';
    if (!isPlainObject(c.rationale)) return 'candidate.rationale is required';
    if (!isPlainObject(c.opportunityProvenance)) return 'candidate.opportunityProvenance is required';
    for (var i = 0; i < ARBITRATION_METADATA_FIELDS.length; i++) {
      var f = ARBITRATION_METADATA_FIELDS[i];
      if (!hasOwn(c, f)) return 'candidate.' + f + ' is required (Canonical Decision CD-T006-02)';
    }
    if (c.kind === 'Recommendation') {
      if (!hasOwn(c, 'recommendationImpactTier')) return 'candidate.recommendationImpactTier is required on Recommendation-kind Candidates';
    } else if (hasOwn(c, 'recommendationImpactTier')) {
      return 'InitiativeCandidate must not carry recommendationImpactTier (Canonical Decision CD-T006-03)';
    }
    return null;
  }

  // §16 — aggregation across every Opportunity's Stage-6 output this cycle, across both producer
  // engines, into one shared, unified pool (§16.2/16.9 — never two pools ranked independently).
  // candidateLists: array of arrays (each inner array a single Stage-6 dispatch's `candidates`).
  function assemblePool(candidateLists) {
    var pool = [];
    var rejected = [];
    (candidateLists || []).forEach(function (list) {
      (list || []).forEach(function (c) {
        var err = validateCandidateForPool(c);
        if (err) {
          rejected.push(freezeShallow({ candidate: c, reason: err }));
        } else {
          pool.push(c);
        }
      });
    });
    return freezeShallow({ pool: freezeShallow(pool), rejected: freezeShallow(rejected) });
  }

  // §14.12.1 comparison semantics, applied uniformly to every arbitration-metadata field.
  // direction 'asc': lower value wins (sorts first). direction 'desc': higher value wins.
  // Returns <0 if a should sort before b (a wins), >0 if b wins, 0 if this field does not
  // distinguish them (either genuinely equal, or both NO_SIGNAL).
  function compareField(a, b, direction) {
    var aSignal = (a === NO_SIGNAL);
    var bSignal = (b === NO_SIGNAL);
    if (aSignal && bSignal) return 0;
    if (aSignal) return 1;  // a carries no signal, b is real -> b wins
    if (bSignal) return -1; // b carries no signal, a is real -> a wins
    if (a === b) return 0;
    if (direction === 'asc') return a < b ? -1 : 1;
    return a > b ? -1 : 1;
  }

  // D1-PR-01 -> D1-PR-02 (same-kind Recommendation ties only, CD-T006-03) -> D1-PR-03 ->
  // D1-PR-06(a)-(d) (§19.1), in this exact, fixed lexicographic order — never a weighted
  // composite (§17.7). Returns <0 if a outranks b, >0 if b outranks a, 0 if genuinely tied.
  function compareCandidates(a, b) {
    // D1-PR-01 — Canonical Decision Hierarchy tier. Tier 1 (Safety) is the highest-priority
    // tier; lower tier number wins (ascending).
    var c = compareField(a.hierarchyTier, b.hierarchyTier, 'asc');
    if (c !== 0) return c;

    // D1-PR-02 — recommendation impact tier, same-kind Recommendation ties only (§17.2,
    // Canonical Decision CD-T006-03). A cross-kind tie, or a both-Initiative tie, skips this
    // step entirely and falls through directly to problemMagnitude below.
    if (a.kind === 'Recommendation' && b.kind === 'Recommendation') {
      // Level 1 Critical (1) outranks Level 4 Educational (4) -> lower number wins (ascending).
      c = compareField(a.recommendationImpactTier, b.recommendationImpactTier, 'asc');
      if (c !== 0) return c;
    }

    // D1-PR-03 — biggest-problem-first: larger magnitude wins (descending).
    c = compareField(a.problemMagnitude, b.problemMagnitude, 'desc');
    if (c !== 0) return c;

    // D1-PR-06(a) — higher Evidence Hierarchy tier wins. Per D1 Unit 11's own numbering, Tier 1
    // (Explicit User Statement) is the highest/strongest tier and Tier 5 (Inference) is the
    // lowest/weakest — the same inverted-numbering convention as the Canonical Decision Hierarchy
    // above (lower tier number = higher priority) — so the stronger (lower-numbered) evidenceTier
    // wins (ascending), not the numerically larger one.
    c = compareField(a.evidenceTier, b.evidenceTier, 'asc');
    if (c !== 0) return c;

    // D1-PR-06(b) — higher expected trust impact wins (descending).
    c = compareField(a.trustImpact, b.trustImpact, 'desc');
    if (c !== 0) return c;

    // D1-PR-06(c) — higher timing quality wins (descending).
    c = compareField(a.timingQuality, b.timingQuality, 'desc');
    if (c !== 0) return c;

    // D1-PR-06(d) — more recent triggering evidence wins (descending: larger timestamp = more
    // recent).
    c = compareField(a.triggeringEvidenceTime, b.triggeringEvidenceTime, 'desc');
    if (c !== 0) return c;

    return 0; // genuinely tied — every criterion exhausted without distinguishing (§19.2)
  }

  // Stable sort per §27.1/32 — Array.prototype.sort is not guaranteed stable in every legacy
  // engine, so a Schwartzian-style index-tiebreak guarantees stability regardless of runtime.
  function rank(pool) {
    var indexed = (pool || []).map(function (c, i) { return { c: c, i: i }; });
    indexed.sort(function (x, y) {
      var d = compareCandidates(x.c, y.c);
      return d !== 0 ? d : (x.i - y.i);
    });
    return indexed.map(function (e) { return e.c; });
  }

  var API = {
    NO_SIGNAL: NO_SIGNAL,
    ARBITRATION_METADATA_FIELDS: ARBITRATION_METADATA_FIELDS,
    validateCandidateForPool: validateCandidateForPool,
    assemblePool: assemblePool,
    compareCandidates: compareCandidates,
    rank: rank
  };

  if (typeof window !== 'undefined') { window.Prioritization = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
