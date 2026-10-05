// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation Contract (WP0 Phase E.0.2d)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md (v1.1) §08-§10, §12, §14.4, §15-§16,
// §19-§23, §27.
//
// Exclusive responsibility: the platform-neutral, deterministic contract of E.0.2d — closed
// process/governance vocabularies, provisional constants, the frozen governed-consumer declaration
// (A3), the Observation Port descriptor and observation validators, the Generator's per-operation
// proposal shapes (§15.2), the recurring-window grounding vocabulary (§20.2), the Verifier's verdict
// vocabulary and applicability (§15.5), the structural signature, the literal-overlap function and
// the isConfidenceAssessed view. Pure and synchronous: no clock, no id
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
    'INTERPRETER_FAILED', 'VERIFIER_FAILED']);
  var OUTCOMES = Object.freeze(['ADMITTED_EXECUTED', 'ADMITTED_FAILED', 'REJECTED', 'NO_CHANGE']);

  // §14.4 — pass-local key namespaces. A key is assigned deterministically in presentation order,
  // lives only for one pass, and is never persisted or returned.
  var KEY_PREFIXES = Object.freeze({ observation: 'o', userStated: 'u', record: 'r', concept: 'k', item: 'p' });
  function passKey(prefix, index) { return prefix + (index + 1); }

  // §15.2 — per-operation proposal shapes: each operation has exactly its own key set.
  var FACTOR_KEYS = Object.freeze(['conceptKey', 'newConceptLabel', 'role', 'valueText']);
  var CREATE_KEYS = Object.freeze(['operation', 'factors', 'relationText', 'evidenceClass', 'temporality', 'grounding',
    'supporting', 'contradicting', 'reference', 'restatesUserStatement', 'safetyAdjacent']);
  var OPERATION_KEYS = Object.freeze({
    CREATE: CREATE_KEYS,
    SUPERSEDE: Object.freeze(CREATE_KEYS.concat(['target'])),
    APPEND_EVIDENCE: Object.freeze(['operation', 'target', 'list', 'observations', 'restatesUserStatement', 'safetyAdjacent'])
  });

  // §20.2 — recurring-window grounding. Process vocabularies only: they say WHERE temporal grounding
  // lives in the evidence, never what it means. SOURCE forms and SOURCE_RECURRENCE are reserved.
  var RECURRENCE_FORMS = Object.freeze(['OBSERVED', 'STATED', 'SOURCE']);
  var WINDOW_FORMS = Object.freeze(['SOURCE_LOCAL', 'SEQUENCE', 'STATED', 'SOURCE']);
  var ANCHOR_KINDS = Object.freeze(['SOURCE_TIME', 'USER_EXPRESSION', 'SOURCE_RECURRENCE']);
  var SOURCE_TIME_FIELDS = Object.freeze(['LOCAL_DATE', 'LOCAL_TIME', 'INSTANT']);
  var RESERVED_GROUNDING = Object.freeze({ form: 'SOURCE', anchorKind: 'SOURCE_RECURRENCE' });

  // §15.5 — Verifier verdicts: five separate closed dimensions, applicability fixed by operation.
  var VERDICT_DIMENSIONS = Object.freeze(['restatement', 'unsupported', 'safety', 'temporal', 'direction']);
  var VERDICT_VALUES = Object.freeze({
    restatement: Object.freeze(['NOT_RESTATED', 'RESTATED', 'UNCERTAIN']),
    unsupported: Object.freeze(['NONE', 'PRESENT', 'UNCERTAIN', 'NOT_APPLICABLE']),
    safety: Object.freeze(['NOT_SAFETY_ADJACENT', 'SAFETY_ADJACENT', 'UNCERTAIN']),
    temporal: Object.freeze(['FAITHFUL', 'UNFAITHFUL', 'UNCERTAIN', 'NOT_APPLICABLE']),
    direction: Object.freeze(['CONSISTENT', 'INCONSISTENT', 'UNCERTAIN', 'NOT_APPLICABLE'])
  });
  var PASSING_VERDICT = Object.freeze({ restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'FAITHFUL', direction: 'CONSISTENT' });
  var CLAIM_DIMENSIONS = Object.freeze({ restatement: true, unsupported: true, safety: true, temporal: true, direction: false });
  var VERDICT_APPLICABILITY = Object.freeze({
    CREATE: CLAIM_DIMENSIONS,
    SUPERSEDE: CLAIM_DIMENSIONS,
    APPEND_EVIDENCE: Object.freeze({ restatement: true, unsupported: false, safety: true, temporal: false, direction: true })
  });
  // §16.5 — fixed order in which a failing dimension is reported.
  var VERDICT_ORDER = Object.freeze(['safety', 'restatement', 'unsupported', 'temporal', 'direction']);
  var VERDICT_CODES = Object.freeze({
    safety: Object.freeze({ SAFETY_ADJACENT: 'SAFETY_VETO', UNCERTAIN: 'SAFETY_UNCERTAIN' }),
    restatement: Object.freeze({ RESTATED: 'RESTATED', UNCERTAIN: 'RESTATEMENT_UNCERTAIN' }),
    unsupported: Object.freeze({ PRESENT: 'UNSUPPORTED_CONTENT', UNCERTAIN: 'UNSUPPORTED_UNCERTAIN' }),
    temporal: Object.freeze({ UNFAITHFUL: 'TEMPORAL_UNFAITHFUL', UNCERTAIN: 'TEMPORAL_UNCERTAIN' }),
    direction: Object.freeze({ INCONSISTENT: 'DIRECTION_INCONSISTENT', UNCERTAIN: 'DIRECTION_UNCERTAIN' })
  });

  // E.0.2d's own closed reason codes. Codes from E.0.2c validators (validateFactorProposal,
  // validateRecordDraft) and from the store pass through unchanged and are not listed here.
  var REASON_CODES = Object.freeze([
    'MALFORMED_PROPOSAL', 'DECLARED_RESTATEMENT', 'SAFETY_ADJACENT_PROPOSAL', 'UNKNOWN_OBSERVATION', 'INVALID_EVIDENCE',
    'SOURCE_NOT_IN_SCOPE', 'USER_STATED_REFERENCE_INVALID', 'UNKNOWN_CONCEPT_KEY', 'INVALID_FACTOR', 'NEW_CONCEPT_SHADOWS_PRESENTED',
    'NEW_CONCEPT_LIMIT', 'INVALID_OPERATION_SHAPE', 'EVIDENCE_CLASS_MISMATCH', 'GROUNDING_ANCHOR_INVALID', 'GROUNDING_INSUFFICIENT',
    'GROUNDING_FORM_UNAVAILABLE', 'NO_NEW_MEANING', 'NO_INDEPENDENT_SUPPORT', 'MIRRORS_USER_STATED', 'LITERAL_RESTATEMENT',
    'LIST_TOO_LONG', 'DUPLICATE_OF_PRESENTED', 'INVALID_TARGET', 'AMBIGUOUS_TARGET', 'NO_CHANGE', 'SUPERSEDE_IDENTICAL',
    'SUPERSEDE_UNRELATED', 'NO_NEW_EVIDENCE', 'VERIFICATION_UNAVAILABLE', 'VERIFICATION_MALFORMED', 'VERIFICATION_MISSING',
    'SAFETY_VETO', 'SAFETY_UNCERTAIN', 'RESTATED', 'RESTATEMENT_UNCERTAIN', 'UNSUPPORTED_CONTENT', 'UNSUPPORTED_UNCERTAIN',
    'TEMPORAL_UNFAITHFUL', 'TEMPORAL_UNCERTAIN', 'DIRECTION_INCONSISTENT', 'DIRECTION_UNCERTAIN', 'TARGET_CONFLICT_IN_PASS',
    'STORE_FAILED'
  ]);

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
    MAX_GROUNDING_ANCHORS: 8,
    ANCHOR_TEXT_MAX_CHARS: 120,
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
  function isValidLocalDate(v) { return typeof v === 'string' && LOCAL_DATE.test(v); }
  function isValidLocalTime(v) { return typeof v === 'string' && LOCAL_TIME.test(v); }
  function isValidOffset(v) { return typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= LIMITS.UTC_OFFSET_MAX_MINUTES; }

  var SEGMENT_KEYS = ['segmentId', 'authorship', 'text', 'data'];
  var SEGMENT_TIME_KEYS = ['localDate', 'localTime', 'utcOffsetMinutes'];
  // §10.2 (v1.1) — a segment's optional structural time. An absent key is null.
  function segmentTime(s, key) { return has(s, key) ? s[key] : null; }

  // §10.2 — Segment: exactly one of text/data is non-null. The v1.1 segment-level time fields are
  // optional; when present and non-null they must be well-formed (never converted, D-4).
  function isValidSegment(s) {
    if (!C.isPlainObject(s)) return false;
    var own = Object.keys(s);
    if (!SEGMENT_KEYS.every(function (k) { return has(s, k); })) return false;
    if (!own.every(function (k) { return SEGMENT_KEYS.indexOf(k) !== -1 || SEGMENT_TIME_KEYS.indexOf(k) !== -1; })) return false;
    if (!C.isId(s.segmentId) || AUTHORSHIP.indexOf(s.authorship) === -1) return false;
    if ((s.text === null) === (s.data === null)) return false;
    var d = segmentTime(s, 'localDate');
    var t = segmentTime(s, 'localTime');
    var off = segmentTime(s, 'utcOffsetMinutes');
    if (d !== null && !isValidLocalDate(d)) return false;
    if (t !== null && !isValidLocalTime(t)) return false;
    if (off !== null && !isValidOffset(off)) return false;
    if (s.text !== null) return boundedText(s.text, LIMITS.OBS_TEXT_MAX_CHARS);
    return Array.isArray(s.data) && s.data.length >= 1 && s.data.every(isValidDataEntry);
  }
  // §10.2 — Observation. Time fields are validated for shape only and never converted (D-4).
  function isValidObservation(o) {
    if (!exactKeys(o, ['ref', 'sourceId', 'observedAt', 'localDate', 'localTime', 'utcOffsetMinutes', 'segments'])) return false;
    if (!isValidRef(o.ref) || !C.isId(o.sourceId)) return false;
    if (o.observedAt !== null && !isNonNegInt(o.observedAt)) return false;
    if (o.localDate !== null && !isValidLocalDate(o.localDate)) return false;
    if (o.localTime !== null && !isValidLocalTime(o.localTime)) return false;
    if (o.utcOffsetMinutes !== null && !isValidOffset(o.utcOffsetMinutes)) return false;
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

  // ── §15.2 / §15.3 — per-operation proposal shapes (type, bound and vocabulary only) ──
  // A proposal failing these checks is MALFORMED_PROPOSAL and is rejected alone. Key resolution,
  // membership and every semantic or structural rule belong to the gate (§16), never to the shape.
  function isStringOrNull(v) { return v === null || typeof v === 'string'; }
  function isStringArray(a) { return Array.isArray(a) && a.every(function (s) { return typeof s === 'string'; }); }

  function isValidFactorShape(f) {
    return exactKeys(f, FACTOR_KEYS) && isStringOrNull(f.conceptKey) && isStringOrNull(f.newConceptLabel) &&
      C.FACTOR_ROLES.indexOf(f.role) !== -1 && isStringOrNull(f.valueText);
  }
  function isValidAnchorShape(a) {
    if (!C.isPlainObject(a) || ANCHOR_KINDS.indexOf(a.kind) === -1) return false;
    if (a.kind === 'SOURCE_TIME') {
      return exactKeys(a, ['kind', 'obsKey', 'segmentId', 'field']) && typeof a.obsKey === 'string' &&
        isStringOrNull(a.segmentId) && SOURCE_TIME_FIELDS.indexOf(a.field) !== -1;
    }
    if (a.kind === 'USER_EXPRESSION') {
      return exactKeys(a, ['kind', 'obsKey', 'segmentId', 'text']) && typeof a.obsKey === 'string' &&
        typeof a.segmentId === 'string' && typeof a.text === 'string' && a.text.length >= 1 && a.text.length <= LIMITS.ANCHOR_TEXT_MAX_CHARS;
    }
    return exactKeys(a, ['kind', 'obsKey', 'segmentId']) && typeof a.obsKey === 'string' && isStringOrNull(a.segmentId);
  }
  function isValidGroundingPart(part, forms) {
    return exactKeys(part, ['form', 'anchors']) && forms.indexOf(part.form) !== -1 && Array.isArray(part.anchors) &&
      part.anchors.length >= 1 && part.anchors.length <= LIMITS.MAX_GROUNDING_ANCHORS && part.anchors.every(isValidAnchorShape);
  }
  // §20.2 — RecurringWindowGrounding.
  function isValidGroundingShape(g) {
    return exactKeys(g, ['recurrence', 'window']) && isValidGroundingPart(g.recurrence, RECURRENCE_FORMS) && isValidGroundingPart(g.window, WINDOW_FORMS);
  }
  function isValidReferenceShape(r) {
    return exactKeys(r, ['uKey', 'factorIndex']) && typeof r.uKey === 'string' && isNonNegInt(r.factorIndex);
  }
  function isValidClaimFields(p) {
    return Array.isArray(p.factors) && p.factors.length >= 1 && p.factors.length <= C.LIMITS.MAX_FACTORS && p.factors.every(isValidFactorShape) &&
      typeof p.relationText === 'string' && PROPOSABLE_EVIDENCE_CLASSES.indexOf(p.evidenceClass) !== -1 &&
      C.TEMPORALITIES.indexOf(p.temporality) !== -1 && (p.grounding === null || isValidGroundingShape(p.grounding)) &&
      isStringArray(p.supporting) && isStringArray(p.contradicting) && (p.reference === null || isValidReferenceShape(p.reference));
  }
  // Returns true only for a proposal in exactly one operation's shape (§15.2).
  function isValidProposalShape(p) {
    if (!C.isPlainObject(p) || !has(OPERATION_KEYS, p.operation) || !exactKeys(p, OPERATION_KEYS[p.operation])) return false;
    if (typeof p.restatesUserStatement !== 'boolean' || typeof p.safetyAdjacent !== 'boolean') return false;
    if (p.operation === 'APPEND_EVIDENCE') {
      return typeof p.target === 'string' && APPEND_LISTS.indexOf(p.list) !== -1 && isStringArray(p.observations) && p.observations.length >= 1;
    }
    if (p.operation === 'SUPERSEDE' && typeof p.target !== 'string') return false;
    return isValidClaimFields(p);
  }
  // The operation of a proposal when it can be read, else null (for PassResult reporting, §15.3).
  function readableOperation(p) {
    return C.isPlainObject(p) && OPERATIONS.indexOf(p.operation) !== -1 ? p.operation : null;
  }

  // ── §15.5 — Verifier verdict entries ──
  // The body of one attributable entry: exact keys, closed vocabulary per dimension, and the
  // applicability fixed by the item's operation (NOT_APPLICABLE exactly where it does not apply).
  function isValidVerdictBody(entry, operation) {
    if (!has(VERDICT_APPLICABILITY, operation)) return false;
    if (!exactKeys(entry, ['item'].concat(VERDICT_DIMENSIONS))) return false;
    var applies = VERDICT_APPLICABILITY[operation];
    return VERDICT_DIMENSIONS.every(function (d) {
      var v = entry[d];
      if (VERDICT_VALUES[d].indexOf(v) === -1) return false;
      return applies[d] ? v !== 'NOT_APPLICABLE' : v === 'NOT_APPLICABLE';
    });
  }
  // §16.5 step 1 — the reason code of the first failing applicable dimension in the fixed order, or
  // null when every applicable dimension holds exactly its passing value. UNCERTAIN never passes.
  function firstFailingVerdict(tokens, operation) {
    var applies = VERDICT_APPLICABILITY[operation];
    for (var i = 0; i < VERDICT_ORDER.length; i++) {
      var d = VERDICT_ORDER[i];
      if (!applies[d] || tokens[d] === PASSING_VERDICT[d]) continue;
      return VERDICT_CODES[d][tokens[d]] || 'VERIFICATION_MALFORMED';
    }
    return null;
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
    KEY_PREFIXES: KEY_PREFIXES,
    OPERATION_KEYS: OPERATION_KEYS,
    FACTOR_KEYS: FACTOR_KEYS,
    RECURRENCE_FORMS: RECURRENCE_FORMS,
    WINDOW_FORMS: WINDOW_FORMS,
    ANCHOR_KINDS: ANCHOR_KINDS,
    SOURCE_TIME_FIELDS: SOURCE_TIME_FIELDS,
    RESERVED_GROUNDING: RESERVED_GROUNDING,
    VERDICT_DIMENSIONS: VERDICT_DIMENSIONS,
    VERDICT_VALUES: VERDICT_VALUES,
    PASSING_VERDICT: PASSING_VERDICT,
    VERDICT_APPLICABILITY: VERDICT_APPLICABILITY,
    VERDICT_ORDER: VERDICT_ORDER,
    VERDICT_CODES: VERDICT_CODES,
    REASON_CODES: REASON_CODES,
    LIMITS: LIMITS,
    PRODUCER: PRODUCER,
    BOOTSTRAP_CONFIDENCE: BOOTSTRAP_CONFIDENCE,
    passKey: passKey,
    isValidDescriptor: isValidDescriptor,
    isValidRef: isValidRef,
    refIdOf: refIdOf,
    isValidSegment: isValidSegment,
    segmentTime: segmentTime,
    isValidProposalShape: isValidProposalShape,
    isValidGroundingShape: isValidGroundingShape,
    readableOperation: readableOperation,
    isValidVerdictBody: isValidVerdictBody,
    firstFailingVerdict: firstFailingVerdict,
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
