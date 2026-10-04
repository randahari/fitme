// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation Contract (WP0 Phase E.0.2d)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §08-§10, §12, §16, §19-§23, §27.
//
// Exclusive responsibility: the platform-neutral, deterministic contract of E.0.2d — closed
// process/governance vocabularies, provisional constants, the frozen governed-consumer declaration
// (A3), the Observation Port descriptor and observation validators, the structural signature, the
// literal-overlap function and the isConfidenceAssessed view. Pure and synchronous: no clock, no id
// minting, no persistence, no model access, no platform reference. Every closed vocabulary here
// describes process or governance (who produced content, which intake persisted a record, which
// operation is proposed) — never what a user's life is about (§28).
// Node-only in this Work Item (§08): not script-tagged, not cached, not configured by the shell.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;

  var CONSOLIDATION_CONTRACT_VERSION = '1.0.0';

  // ── §09 governed-consumer declaration (A3 §04.1, §04.3, §07.2). Frozen; never configurable. ──
  var CONSUMER_DECLARATION = Object.freeze({
    consumerId: 'E02D_CONSOLIDATION',
    consumerType: 'GOVERNED_BACKGROUND_PROCESS',
    capabilityRiskTier: 'ELEVATED',
    sensitiveContextAccessPolicy: 'NOT_AUTHORIZED'
  });

  // ── closed process/governance vocabularies ──
  var OPERATIONS = Object.freeze(['CREATE', 'APPEND_EVIDENCE', 'SUPERSEDE']);
  var AUTHORSHIP = Object.freeze(['USER_AUTHORED', 'USER_RECORDED', 'FITME_AUTHORED', 'DEVICE_MEASURED', 'EXTERNAL']);
  var CLAIMANTS = Object.freeze(['SAFETY_INTAKE', 'CPI_PREFERENCE', 'USER_STATED_TYPED_MEMORY']);
  var REFERENCE_CLAIMANTS = Object.freeze(['CPI_PREFERENCE', 'USER_STATED_TYPED_MEMORY']);
  var V1_OBSERVATION_REF_KINDS = Object.freeze(['CONVERSATION_TURN', 'DAY_LOG']);
  var PROPOSABLE_EVIDENCE_CLASSES = Object.freeze(['SINGLE_OBSERVATION', 'CO_OCCURRENCE', 'RECURRENCE']);
  var APPEND_LISTS = Object.freeze(['supporting', 'contradicting']);
  // Every status a user_stated record can hold (candidate is unreachable for user_stated, E.0.2c §14.2).
  var OWNER_STATUSES = Object.freeze(['active', 'superseded', 'rejected', 'archived']);
  var SENSITIVITY_TIERS = Object.freeze(['STANDARD', 'SAFETY_ADJACENT']);
  var PASS_STATUSES = Object.freeze(['COMPLETED', 'PARTIAL', 'NOT_CONFIGURED', 'INVALID_REQUEST', 'CONSENT_NOT_GRANTED',
    'NO_ELIGIBLE_SOURCE', 'OBSERVATION_READ_INVALID', 'OWNERSHIP_READ_FAILED', 'NO_OBSERVATIONS', 'STORE_READ_FAILED',
    'INTERPRETER_FAILED']);
  var OUTCOMES = Object.freeze(['ADMITTED_EXECUTED', 'ADMITTED_FAILED', 'REJECTED', 'NO_CHANGE']);

  // ── §27 constants [PROVISIONAL; confirmed or revised by calibration, §31] ──
  var LIMITS = Object.freeze({
    MAX_PROPOSALS: 6,
    WINDOW_MAX_DAYS: 14,
    DAY_MS: 86400000,
    OBS_MAX_PER_PASS: 40,
    OBS_MAX_SEGMENTS: 12,
    OBS_TEXT_MAX_CHARS: 2000,
    OBS_BLOCK_MAX_CHARS: 16000,
    PRESENTED_CONCEPTS_MAX: 30,
    PRESENTED_CONCEPTS_TOTAL_MAX: 40,
    PRESENTED_RECORDS_MAX: 12,
    PRESENTED_RECORD_QUERY_CONCEPT_IDS: 10,
    PRESENTED_LABELS_MAX: 3,
    PRESENTED_RELATION_MAX_CHARS: 160,
    PRESENTED_BLOCK_MAX_CHARS: 6000,
    PRESENTED_USER_STATED_MAX: 8,
    MAX_NEW_CONCEPTS_PER_PROPOSAL: 4,
    MAX_NEW_CONCEPTS_PER_PASS: 8,
    LITERAL_OVERLAP_MAX_CHARS: 24,
    DESCRIPTION_MAX_CHARS: 400,
    DATA_LABEL_MAX_CHARS: 80,
    DATA_UNIT_MAX_CHARS: 16,
    UTC_OFFSET_MAX_MINUTES: 1440
  });

  var PRODUCER = Object.freeze({ producer: 'e02d.consolidation', producerVersion: '1.0.0' });
  var BOOTSTRAP_CONFIDENCE = 0; // §21: UNASSESSED — never a probability, never evidence against.

  var LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
  var LOCAL_TIME = /^\d{1,2}:\d{2}$/;

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function exactKeys(o, keys) {
    if (!C.isPlainObject(o)) return false;
    var own = Object.keys(o);
    if (own.length !== keys.length) return false;
    for (var i = 0; i < keys.length; i++) { if (!has(o, keys[i])) return false; }
    return true;
  }
  function isNonNegInt(n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0; }
  function boundedText(s, max) { return typeof s === 'string' && s.trim().length >= 1 && s.length <= max; }

  // §10.1 — ObservationSourceDescriptor. Returns true only for a fully well-formed descriptor.
  function isValidDescriptor(d) {
    if (!exactKeys(d, ['sourceId', 'evidenceRefKind', 'sensitivityTier', 'consentScope', 'protectedSource', 'description'])) return false;
    if (!C.isId(d.sourceId)) return false;
    if (C.EVIDENCE_REF_KINDS.indexOf(d.evidenceRefKind) === -1) return false;
    if (SENSITIVITY_TIERS.indexOf(d.sensitivityTier) === -1) return false;
    if (d.consentScope !== null && (typeof d.consentScope !== 'string' || !d.consentScope.length)) return false;
    if (typeof d.protectedSource !== 'boolean') return false;
    return boundedText(d.description, LIMITS.DESCRIPTION_MAX_CHARS);
  }

  function isValidRef(r) {
    return exactKeys(r, ['kind', 'ref']) && C.EVIDENCE_REF_KINDS.indexOf(r.kind) !== -1 &&
      typeof r.ref === 'string' && C.EVIDENCE_REF_PATTERN.test(r.ref);
  }
  function refIdOf(r) { return r.kind + ':' + r.ref; }

  function isValidDataEntry(e) {
    if (!exactKeys(e, ['label', 'value', 'unit'])) return false;
    if (!boundedText(e.label, LIMITS.DATA_LABEL_MAX_CHARS)) return false;
    var v = e.value;
    if (!(typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v)))) return false;
    return e.unit === null || boundedText(e.unit, LIMITS.DATA_UNIT_MAX_CHARS);
  }
  // §10.2 — Segment: exactly one of text/data is non-null.
  function isValidSegment(s) {
    if (!exactKeys(s, ['segmentId', 'authorship', 'text', 'data'])) return false;
    if (!C.isId(s.segmentId) || AUTHORSHIP.indexOf(s.authorship) === -1) return false;
    if ((s.text === null) === (s.data === null)) return false;
    if (s.text !== null) return boundedText(s.text, LIMITS.OBS_TEXT_MAX_CHARS);
    return Array.isArray(s.data) && s.data.length >= 1 && s.data.every(isValidDataEntry);
  }
  // §10.2 — Observation. Time fields are validated for shape only and never converted (D-4).
  function isValidObservation(o) {
    if (!exactKeys(o, ['ref', 'sourceId', 'observedAt', 'localDate', 'localTime', 'utcOffsetMinutes', 'segments'])) return false;
    if (!isValidRef(o.ref) || !C.isId(o.sourceId)) return false;
    if (o.observedAt !== null && !isNonNegInt(o.observedAt)) return false;
    if (o.localDate !== null && (typeof o.localDate !== 'string' || !LOCAL_DATE.test(o.localDate))) return false;
    if (o.localTime !== null && (typeof o.localTime !== 'string' || !LOCAL_TIME.test(o.localTime))) return false;
    if (o.utcOffsetMinutes !== null && !(typeof o.utcOffsetMinutes === 'number' && Number.isInteger(o.utcOffsetMinutes) && Math.abs(o.utcOffsetMinutes) <= LIMITS.UTC_OFFSET_MAX_MINUTES)) return false;
    if (!Array.isArray(o.segments) || o.segments.length < 1 || o.segments.length > LIMITS.OBS_MAX_SEGMENTS) return false;
    if (!o.segments.every(isValidSegment)) return false;
    var ids = o.segments.map(function (s) { return s.segmentId; });
    return ids.every(function (id, i) { return ids.indexOf(id) === i; });
  }
  // §10.3 — one Typed Memory ownership claim.
  function isValidClaim(c) {
    return exactKeys(c, ['ref', 'claimant', 'recordRef']) && isValidRef(c.ref) && CLAIMANTS.indexOf(c.claimant) !== -1 &&
      isValidRef(c.recordRef) && c.recordRef.kind === 'TYPED_MEMORY_RECORD';
  }
  // §10.3 — one Typed Memory user-stated reference (never a Safety claimant).
  function isValidTypedMemoryReference(r) {
    if (!exactKeys(r, ['recordRef', 'claimant', 'claimedObservationRefs', 'segments'])) return false;
    if (!isValidRef(r.recordRef) || r.recordRef.kind !== 'TYPED_MEMORY_RECORD') return false;
    if (REFERENCE_CLAIMANTS.indexOf(r.claimant) === -1) return false;
    if (!Array.isArray(r.claimedObservationRefs) || !r.claimedObservationRefs.every(isValidRef)) return false;
    return Array.isArray(r.segments) && r.segments.length >= 1 && r.segments.length <= LIMITS.OBS_MAX_SEGMENTS && r.segments.every(isValidSegment);
  }

  // §05 / §16.1 G5 — structural signature: the sorted multiset of (root, role) over factors.
  // `rootOf(conceptId)` returns the merge-resolved root; a factor proposing a new concept carries
  // `newKey` (its normalized label) and is its own identity, which can equal no stored root.
  // Equality only; never interpreted.
  function signature(factors, rootOf) {
    var parts = [];
    for (var i = 0; i < factors.length; i++) {
      var f = factors[i];
      var id = (typeof f.newKey === 'string') ? ('new\u0000' + f.newKey) : ('root\u0000' + rootOf(f.conceptId));
      parts.push(id + '\u0001' + f.role);
    }
    parts.sort();
    return parts.join('\u0002');
  }

  // §22.1 E2 — literal restatement over normalized text N(s) = normalizeLabelKey(s). True when any
  // claim text shares a contiguous run of ≥ minChars with any user text, or wholly contains one.
  function literalOverlap(claimTexts, userTexts, minChars) {
    var T = claimTexts.filter(function (t) { return typeof t === 'string'; }).map(C.normalizeLabelKey).filter(Boolean);
    var U = userTexts.filter(function (u) { return typeof u === 'string'; }).map(C.normalizeLabelKey).filter(Boolean);
    for (var i = 0; i < T.length; i++) {
      for (var j = 0; j < U.length; j++) {
        var t = T[i];
        var u = U[j];
        if (t.indexOf(u) !== -1) return true;
        for (var k = 0; k + minChars <= t.length; k++) {
          if (u.indexOf(t.substr(k, minChars)) !== -1) return true;
        }
      }
    }
    return false;
  }

  // §21 PD-D1 — a record's confidence has been assessed iff its history holds a CONFIDENCE_CHANGED
  // entry. Reads history kinds only; never prose and never the confidence value itself.
  function isConfidenceAssessed(r) {
    return !!r && Array.isArray(r.correctionHistory) &&
      r.correctionHistory.some(function (h) { return h && h.kind === 'CONFIDENCE_CHANGED'; });
  }

  // §17 — deterministic source mapping from the evidence class; never model-chosen.
  function sourceForEvidenceClass(evidenceClass) {
    return evidenceClass === 'RECURRENCE' ? 'inferred_pattern' : 'inferred_event';
  }

  // §14.1 — absolute instant (UTC epoch ms) to an ISO-8601 UTC string, computed arithmetically (no
  // clock, no host timezone). Never used to synthesize a local time or a missing instant.
  function epochToIsoUtc(ms) {
    if (!isNonNegInt(ms)) return null;
    var days = Math.floor(ms / LIMITS.DAY_MS);
    var rem = ms - days * LIMITS.DAY_MS;
    var z = days + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400;
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp < 10 ? mp + 3 : mp - 9;
    if (m <= 2) y += 1;
    var pad = function (n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; };
    var hh = Math.floor(rem / 3600000);
    var mm = Math.floor((rem % 3600000) / 60000);
    var ss = Math.floor((rem % 60000) / 1000);
    var mss = rem % 1000;
    return pad(y, 4) + '-' + pad(m, 2) + '-' + pad(d, 2) + 'T' + pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2) + '.' + pad(mss, 3) + 'Z';
  }

  var API = {
    VERSION: CONSOLIDATION_CONTRACT_VERSION,
    CONSUMER_DECLARATION: CONSUMER_DECLARATION,
    OPERATIONS: OPERATIONS,
    AUTHORSHIP: AUTHORSHIP,
    CLAIMANTS: CLAIMANTS,
    REFERENCE_CLAIMANTS: REFERENCE_CLAIMANTS,
    V1_OBSERVATION_REF_KINDS: V1_OBSERVATION_REF_KINDS,
    PROPOSABLE_EVIDENCE_CLASSES: PROPOSABLE_EVIDENCE_CLASSES,
    APPEND_LISTS: APPEND_LISTS,
    OWNER_STATUSES: OWNER_STATUSES,
    PASS_STATUSES: PASS_STATUSES,
    OUTCOMES: OUTCOMES,
    LIMITS: LIMITS,
    PRODUCER: PRODUCER,
    BOOTSTRAP_CONFIDENCE: BOOTSTRAP_CONFIDENCE,
    isValidDescriptor: isValidDescriptor,
    isValidRef: isValidRef,
    refIdOf: refIdOf,
    isValidSegment: isValidSegment,
    isValidObservation: isValidObservation,
    isValidClaim: isValidClaim,
    isValidTypedMemoryReference: isValidTypedMemoryReference,
    signature: signature,
    literalOverlap: literalOverlap,
    isConfidenceAssessed: isConfidenceAssessed,
    sourceForEvidenceClass: sourceForEvidenceClass,
    epochToIsoUtc: epochToIsoUtc
  };

  if (typeof window !== 'undefined') { window.ConsolidationContract = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
