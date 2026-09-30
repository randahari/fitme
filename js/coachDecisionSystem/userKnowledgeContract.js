// ══════════════════════════════════════════════════════════════════
// FitMe — User Knowledge Contract (WP0 Phase E.0.2c)
// docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §09-§13, §18, §19; GCUK Ch.09-13, Ch.20.
//
// Exclusive responsibility: the platform-neutral, deterministic contract of User Knowledge —
// closed process/governance vocabularies, constants, the exact-key validators for records,
// concepts, evidence references, confounds, history entries and change sets, the derived views
// every future consumer must use, and the call-scoped proposal validator for future bounded
// interpreters. Pure and synchronous: no clock, no id minting, no persistence, no model access,
// no platform reference. Every closed vocabulary here describes process, governance, grammar or
// which governed store a reference points into — never what a user's life is about (§22).
// No field can express causation, truth or verification (§23); the exact-key rule rejects any
// attempt to add one.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var USER_KNOWLEDGE_CONTRACT_VERSION = '1.0.0';

  // ── §09.1 closed vocabularies (process/governance only) ──
  var FACTOR_ROLES = Object.freeze(['condition', 'subject', 'outcome']);
  var EVIDENCE_CLASSES = Object.freeze(['SINGLE_OBSERVATION', 'CO_OCCURRENCE', 'RECURRENCE', 'EXPLICIT_STATEMENT']);
  var TEMPORALITIES = Object.freeze(['DURABLE', 'TEMPORARY', 'RECURRING_WINDOW']);
  var STATUSES = Object.freeze(['candidate', 'active', 'superseded', 'rejected', 'archived']);
  var SOURCES = Object.freeze(['user_stated', 'inferred_event', 'inferred_pattern', 'coach_generated', 'migrated']);
  var SAFETY_FLAGS = Object.freeze(['STANDARD', 'SAFETY_ADJACENT']);
  var WRITER_AUTHORITIES = Object.freeze(['CLIENT', 'SERVER']);
  var EVIDENCE_REF_KINDS = Object.freeze(['CONVERSATION_TURN', 'DAY_LOG', 'TYPED_MEMORY_RECORD', 'HABIT_RECORD', 'PATTERN_RECORD', 'USER_KNOWLEDGE_RECORD']);
  var EVIDENCE_AVAILABILITY = Object.freeze(['UNVERIFIED', 'RESOLVABLE', 'UNRESOLVABLE']);
  var UNRESOLVABLE_REASONS = Object.freeze(['NOT_FOUND', 'USER_DELETED', 'USER_RESET', 'RETENTION', 'SOURCE_REMOVED', 'PRIVACY_ACTION']);
  var RECORD_HISTORY_KINDS = Object.freeze(['CREATED', 'PROMOTED', 'RETRACTED', 'SUPERSEDED', 'ARCHIVED', 'EVIDENCE_ADDED', 'EVIDENCE_AVAILABILITY_CHANGED', 'CONFOUND_ADDED', 'CONFOUND_CHECK_RECORDED', 'CONFIDENCE_CHANGED', 'SAFETY_FLAG_RAISED']);
  var CONCEPT_HISTORY_KINDS = Object.freeze(['CREATED', 'LABEL_ADDED', 'LABEL_REMOVED', 'MERGED', 'UNMERGED']);

  // Derived groupings of SOURCES (not a vocabulary of their own).
  var FITME_SOURCES = Object.freeze(['inferred_event', 'inferred_pattern', 'coach_generated']);
  var TERMINAL_STATUSES = Object.freeze(['superseded', 'rejected', 'archived']);

  // ── §09.2 constants ──
  var LIMITS = Object.freeze({
    SCHEMA_VERSION: 1,
    MAX_FACTORS: 8,
    VALUE_DESCRIPTION_MAX_CHARS: 160,
    RELATION_DESCRIPTION_MAX_CHARS: 400,
    MAX_EVIDENCE_REFS_PER_LIST: 64,
    EVIDENCE_REF_MAX_CHARS: 200,
    MAX_CONFOUNDS: 16,
    CONFOUND_DESCRIPTION_MAX_CHARS: 200,
    MAX_LINKS: 8,
    MAX_HISTORY_ENTRIES: 256,
    MAX_LABELS_PER_CONCEPT: 32,
    LABEL_MAX_CHARS: 80,
    MAX_CONCEPT_HISTORY_ENTRIES: 256,
    MAX_MERGE_CHAIN_DEPTH: 16,
    MAX_READ_BATCH: 50,
    MAX_QUERY_LIMIT: 50,
    MAX_QUERY_CONCEPT_IDS: 10,
    REASON_MAX_CHARS: 200
  });

  var ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
  var EVIDENCE_REF_PATTERN = /^[A-Za-z0-9_.:\-]{1,200}$/;
  var PRODUCER_PATTERN = /^[A-Za-z0-9_.\-]{1,64}$/;
  var REF_ID_PATTERN = /^[A-Z_]{1,32}:[A-Za-z0-9_.:\-]{1,200}$/;

  // ── exact key sets ──
  var RECORD_KEYS = Object.freeze(['schemaVersion', 'recordId', 'userId', 'version', 'factors', 'conceptIds', 'relationDescription', 'evidence', 'evidenceClass', 'temporality', 'expiresAt', 'confidence', 'status', 'source', 'safetyFlag', 'provenance', 'supersedes', 'supersededBy', 'createdAt', 'updatedAt', 'lastEvidenceAt', 'correctionHistory']);
  var FACTOR_KEYS = Object.freeze(['conceptId', 'role', 'valueDescription']);
  var EVIDENCE_KEYS = Object.freeze(['supporting', 'contradicting', 'confoundsConsidered', 'confoundCheck']);
  var EVIDENCE_REF_KEYS = Object.freeze(['refId', 'kind', 'ref', 'observedAt', 'addedAt', 'availability', 'availabilityCheckedAt', 'unresolvableReason']);
  var CONFOUND_KEYS = Object.freeze(['confoundId', 'conceptId', 'description', 'source', 'addedAt']);
  var CONFOUND_CHECK_KEYS = Object.freeze(['performedAt', 'producer', 'producerVersion']);
  var PROVENANCE_KEYS = Object.freeze(['producer', 'producerVersion', 'originTurnId']);
  var RECORD_HISTORY_KEYS = Object.freeze(['eventId', 'kind', 'at', 'writer', 'producer', 'fromStatus', 'toStatus', 'relatedRecordIds', 'refIds', 'confoundId', 'previousConfidence', 'newConfidence', 'reason', 'userOriginTurnId']);
  var CONCEPT_KEYS = Object.freeze(['schemaVersion', 'conceptId', 'userId', 'version', 'labels', 'mergedInto', 'createdAt', 'updatedAt', 'history']);
  var CONCEPT_HISTORY_KEYS = Object.freeze(['eventId', 'kind', 'at', 'writer', 'producer', 'label', 'into', 'reason']);

  // Draft shapes accepted by planners (§10.4 rule 2: never contains conceptIds).
  var RECORD_DRAFT_REQUIRED = Object.freeze(['factors', 'relationDescription', 'evidenceClass', 'temporality', 'confidence', 'source', 'safetyFlag']);
  var RECORD_DRAFT_OPTIONAL = Object.freeze(['evidence', 'expiresAt', 'provenance', 'status']);
  var FACTOR_DRAFT_KEYS = Object.freeze(['conceptId', 'newConcept', 'role', 'valueDescription']);
  var EVIDENCE_DRAFT_KEYS = Object.freeze(['supporting', 'contradicting', 'confoundsConsidered']);
  var EVIDENCE_REF_DRAFT_KEYS = Object.freeze(['kind', 'ref', 'observedAt']);
  var CONFOUND_DRAFT_KEYS = Object.freeze(['conceptId', 'description', 'source']);
  var PROVENANCE_DRAFT_KEYS = Object.freeze(['originTurnId']);

  // ── primitives ──
  function ok() { return { ok: true }; }
  function fail(code, path) { return { ok: false, code: code, path: path || '' }; }
  function isPlainObject(v) {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
    var proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }
  function isInt(n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0; }
  function isId(s) { return typeof s === 'string' && ID_PATTERN.test(s); }
  function isProducer(s) { return typeof s === 'string' && PRODUCER_PATTERN.test(s); }
  function isConfidence(n) { return typeof n === 'number' && isFinite(n) && n >= 0 && n <= 1; }
  function inList(list, v) { return list.indexOf(v) !== -1; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function normalizeText(s) {
    return typeof s === 'string' ? s.normalize('NFC').trim() : s;
  }
  function normalizeLabelKey(label) {
    return typeof label === 'string' ? label.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim() : '';
  }

  function checkExactKeys(obj, keys, path) {
    var own = Object.keys(obj);
    for (var i = 0; i < own.length; i++) {
      if (keys.indexOf(own[i]) === -1) return fail('UNKNOWN_FIELD', path + '.' + own[i]);
    }
    for (var j = 0; j < keys.length; j++) {
      if (!has(obj, keys[j])) return fail('MISSING_FIELD', path + '.' + keys[j]);
    }
    return null;
  }
  function checkAllowedKeys(obj, required, optional, path) {
    var own = Object.keys(obj);
    for (var i = 0; i < own.length; i++) {
      if (required.indexOf(own[i]) === -1 && optional.indexOf(own[i]) === -1) return fail('UNKNOWN_FIELD', path + '.' + own[i]);
    }
    for (var j = 0; j < required.length; j++) {
      if (!has(obj, required[j])) return fail('MISSING_FIELD', path + '.' + required[j]);
    }
    return null;
  }
  function checkText(s, min, max, path) {
    if (typeof s !== 'string') return fail('INVALID_VALUE', path);
    if (s !== normalizeText(s)) return fail('TEXT_NOT_NORMALIZED', path);
    if (s.length < min || s.length > max) return fail('TEXT_LENGTH', path);
    return null;
  }
  function checkNullableText(s, max, path) {
    if (s === null) return null;
    return checkText(s, 1, max, path);
  }
  function checkIdArray(arr, max, path) {
    if (!Array.isArray(arr) || arr.length > max) return fail('INVALID_LINKS', path);
    var seen = {};
    for (var i = 0; i < arr.length; i++) {
      if (!isId(arr[i]) || seen[arr[i]]) return fail('INVALID_LINKS', path + '[' + i + ']');
      seen[arr[i]] = true;
    }
    return null;
  }

  // ── §10.4 derived index ──
  function deriveConceptIds(factors) {
    var out = [];
    if (!Array.isArray(factors)) return out;
    var seen = {};
    for (var i = 0; i < factors.length; i++) {
      var id = factors[i] && factors[i].conceptId;
      if (typeof id === 'string' && !seen[id]) { seen[id] = true; out.push(id); }
    }
    out.sort();
    return out;
  }
  function sameStringArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) { if (a[i] !== b[i]) return false; }
    return true;
  }

  // ── component validators ──
  function validateFactor(f, path) {
    if (!isPlainObject(f)) return fail('INVALID_FACTOR', path);
    var k = checkExactKeys(f, FACTOR_KEYS, path); if (k) return k;
    if (!isId(f.conceptId)) return fail('INVALID_ID', path + '.conceptId');
    if (!inList(FACTOR_ROLES, f.role)) return fail('INVALID_VALUE', path + '.role');
    var t = checkNullableText(f.valueDescription, LIMITS.VALUE_DESCRIPTION_MAX_CHARS, path + '.valueDescription'); if (t) return t;
    return null;
  }

  function validateEvidenceRef(r, path) {
    if (!isPlainObject(r)) return fail('INVALID_EVIDENCE_REF', path);
    var k = checkExactKeys(r, EVIDENCE_REF_KEYS, path); if (k) return k;
    if (!inList(EVIDENCE_REF_KINDS, r.kind)) return fail('INVALID_EVIDENCE_REF', path + '.kind');
    if (typeof r.ref !== 'string' || !EVIDENCE_REF_PATTERN.test(r.ref)) return fail('INVALID_EVIDENCE_REF', path + '.ref');
    if (r.refId !== r.kind + ':' + r.ref) return fail('INVALID_EVIDENCE_REF', path + '.refId');
    if (r.observedAt !== null && !isInt(r.observedAt)) return fail('INVALID_EVIDENCE_REF', path + '.observedAt');
    if (!isInt(r.addedAt)) return fail('INVALID_EVIDENCE_REF', path + '.addedAt');
    if (!inList(EVIDENCE_AVAILABILITY, r.availability)) return fail('INVALID_EVIDENCE_REF', path + '.availability');
    if (r.availability === 'UNVERIFIED') {
      if (r.availabilityCheckedAt !== null) return fail('INVALID_EVIDENCE_REF', path + '.availabilityCheckedAt');
    } else if (!isInt(r.availabilityCheckedAt)) {
      return fail('INVALID_EVIDENCE_REF', path + '.availabilityCheckedAt');
    }
    if (r.availability === 'UNRESOLVABLE') {
      if (!inList(UNRESOLVABLE_REASONS, r.unresolvableReason)) return fail('INVALID_EVIDENCE_REF', path + '.unresolvableReason');
    } else if (r.unresolvableReason !== null) {
      return fail('INVALID_EVIDENCE_REF', path + '.unresolvableReason');
    }
    return null;
  }

  function validateConfound(c, path) {
    if (!isPlainObject(c)) return fail('INVALID_CONFOUND', path);
    var k = checkExactKeys(c, CONFOUND_KEYS, path); if (k) return k;
    if (!isId(c.confoundId)) return fail('INVALID_ID', path + '.confoundId');
    if (c.conceptId !== null && !isId(c.conceptId)) return fail('INVALID_ID', path + '.conceptId');
    var t = checkNullableText(c.description, LIMITS.CONFOUND_DESCRIPTION_MAX_CHARS, path + '.description'); if (t) return t;
    if (c.conceptId === null && c.description === null) return fail('INVALID_CONFOUND', path);
    if (!inList(SOURCES, c.source)) return fail('INVALID_VALUE', path + '.source');
    if (!isInt(c.addedAt)) return fail('INVALID_VALUE', path + '.addedAt');
    return null;
  }

  function validateConfoundCheck(c, path) {
    if (c === null) return null;
    if (!isPlainObject(c)) return fail('INVALID_VALUE', path);
    var k = checkExactKeys(c, CONFOUND_CHECK_KEYS, path); if (k) return k;
    if (!isInt(c.performedAt)) return fail('INVALID_VALUE', path + '.performedAt');
    if (!isProducer(c.producer)) return fail('INVALID_VALUE', path + '.producer');
    if (!isProducer(c.producerVersion)) return fail('INVALID_VALUE', path + '.producerVersion');
    return null;
  }

  function validateProvenance(p, path) {
    if (!isPlainObject(p)) return fail('INVALID_VALUE', path);
    var k = checkExactKeys(p, PROVENANCE_KEYS, path); if (k) return k;
    if (!isProducer(p.producer)) return fail('INVALID_VALUE', path + '.producer');
    if (!isProducer(p.producerVersion)) return fail('INVALID_VALUE', path + '.producerVersion');
    if (p.originTurnId !== null && !isId(p.originTurnId)) return fail('INVALID_ID', path + '.originTurnId');
    return null;
  }

  function validateRecordHistoryEntry(h, path) {
    if (!isPlainObject(h)) return fail('INVALID_HISTORY', path);
    var k = checkExactKeys(h, RECORD_HISTORY_KEYS, path); if (k) return k;
    if (!isId(h.eventId)) return fail('INVALID_HISTORY', path + '.eventId');
    if (!inList(RECORD_HISTORY_KINDS, h.kind)) return fail('INVALID_HISTORY', path + '.kind');
    if (!isInt(h.at)) return fail('INVALID_HISTORY', path + '.at');
    if (!inList(WRITER_AUTHORITIES, h.writer)) return fail('INVALID_HISTORY', path + '.writer');
    if (!isProducer(h.producer)) return fail('INVALID_HISTORY', path + '.producer');
    if (h.fromStatus !== null && !inList(STATUSES, h.fromStatus)) return fail('INVALID_HISTORY', path + '.fromStatus');
    if (h.toStatus !== null && !inList(STATUSES, h.toStatus)) return fail('INVALID_HISTORY', path + '.toStatus');
    if (checkIdArray(h.relatedRecordIds, LIMITS.MAX_LINKS, path + '.relatedRecordIds')) return fail('INVALID_HISTORY', path + '.relatedRecordIds');
    if (!Array.isArray(h.refIds) || h.refIds.length > 2 * LIMITS.MAX_EVIDENCE_REFS_PER_LIST) return fail('INVALID_HISTORY', path + '.refIds');
    for (var i = 0; i < h.refIds.length; i++) {
      if (typeof h.refIds[i] !== 'string' || !REF_ID_PATTERN.test(h.refIds[i])) return fail('INVALID_HISTORY', path + '.refIds[' + i + ']');
    }
    if (h.confoundId !== null && !isId(h.confoundId)) return fail('INVALID_HISTORY', path + '.confoundId');
    if (h.previousConfidence !== null && !isConfidence(h.previousConfidence)) return fail('INVALID_HISTORY', path + '.previousConfidence');
    if (h.newConfidence !== null && !isConfidence(h.newConfidence)) return fail('INVALID_HISTORY', path + '.newConfidence');
    if (h.reason !== null && !inList(UNRESOLVABLE_REASONS, h.reason)) return fail('INVALID_HISTORY', path + '.reason');
    if (h.userOriginTurnId !== null && !isId(h.userOriginTurnId)) return fail('INVALID_HISTORY', path + '.userOriginTurnId');
    return null;
  }

  function validateHistoryOrder(list, max, path) {
    if (!Array.isArray(list) || list.length < 1 || list.length > max) return fail('INVALID_HISTORY', path);
    if (list[0] === null || typeof list[0] !== 'object' || list[0].kind !== 'CREATED') return fail('INVALID_HISTORY', path + '[0]');
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      if (i > 0 && list[i] && list[i - 1] && list[i].at < list[i - 1].at) return fail('INVALID_HISTORY', path + '[' + i + '].at');
      if (list[i] && seen[list[i].eventId]) return fail('INVALID_HISTORY', path + '[' + i + '].eventId');
      if (list[i]) seen[list[i].eventId] = true;
    }
    return null;
  }

  // ── §10.2 record validator ──
  function validateRecord(doc) {
    if (!isPlainObject(doc)) return fail('NOT_OBJECT', 'record');
    var k = checkExactKeys(doc, RECORD_KEYS, 'record'); if (k) return k;
    if (doc.schemaVersion !== LIMITS.SCHEMA_VERSION) return fail('INVALID_VALUE', 'record.schemaVersion');
    if (!isId(doc.recordId)) return fail('INVALID_ID', 'record.recordId');
    if (!isId(doc.userId)) return fail('INVALID_ID', 'record.userId');
    if (!isInt(doc.version) || doc.version < 1) return fail('INVALID_VERSION', 'record.version');

    if (!Array.isArray(doc.factors) || doc.factors.length < 1 || doc.factors.length > LIMITS.MAX_FACTORS) return fail('FACTOR_COUNT', 'record.factors');
    var factorKeys = {};
    for (var i = 0; i < doc.factors.length; i++) {
      var fe = validateFactor(doc.factors[i], 'record.factors[' + i + ']'); if (fe) return fe;
      var fk = JSON.stringify([doc.factors[i].conceptId, doc.factors[i].role, doc.factors[i].valueDescription]);
      if (factorKeys[fk]) return fail('DUPLICATE_FACTOR', 'record.factors[' + i + ']');
      factorKeys[fk] = true;
    }
    if (!sameStringArray(doc.conceptIds, deriveConceptIds(doc.factors))) return fail('CONCEPT_INDEX_MISMATCH', 'record.conceptIds');

    var rt = checkText(doc.relationDescription, 1, LIMITS.RELATION_DESCRIPTION_MAX_CHARS, 'record.relationDescription'); if (rt) return rt;

    var ev = doc.evidence;
    if (!isPlainObject(ev)) return fail('INVALID_VALUE', 'record.evidence');
    var ek = checkExactKeys(ev, EVIDENCE_KEYS, 'record.evidence'); if (ek) return ek;
    var refIds = {};
    var lists = ['supporting', 'contradicting'];
    for (var li = 0; li < lists.length; li++) {
      var list = ev[lists[li]];
      var lp = 'record.evidence.' + lists[li];
      if (!Array.isArray(list) || list.length > LIMITS.MAX_EVIDENCE_REFS_PER_LIST) return fail('LIST_TOO_LONG', lp);
      for (var r = 0; r < list.length; r++) {
        var re = validateEvidenceRef(list[r], lp + '[' + r + ']'); if (re) return re;
        if (refIds[list[r].refId]) return fail('DUPLICATE_REF', lp + '[' + r + ']');
        refIds[list[r].refId] = true;
      }
    }
    if (!Array.isArray(ev.confoundsConsidered) || ev.confoundsConsidered.length > LIMITS.MAX_CONFOUNDS) return fail('LIST_TOO_LONG', 'record.evidence.confoundsConsidered');
    var confoundIds = {};
    for (var c = 0; c < ev.confoundsConsidered.length; c++) {
      var ce = validateConfound(ev.confoundsConsidered[c], 'record.evidence.confoundsConsidered[' + c + ']'); if (ce) return ce;
      if (confoundIds[ev.confoundsConsidered[c].confoundId]) return fail('INVALID_CONFOUND', 'record.evidence.confoundsConsidered[' + c + ']');
      confoundIds[ev.confoundsConsidered[c].confoundId] = true;
    }
    var cc = validateConfoundCheck(ev.confoundCheck, 'record.evidence.confoundCheck'); if (cc) return cc;

    if (!inList(EVIDENCE_CLASSES, doc.evidenceClass)) return fail('INVALID_VALUE', 'record.evidenceClass');
    if (!inList(TEMPORALITIES, doc.temporality)) return fail('INVALID_VALUE', 'record.temporality');
    if (doc.expiresAt !== null && !isInt(doc.expiresAt)) return fail('INVALID_EXPIRY', 'record.expiresAt');
    if (!isConfidence(doc.confidence)) return fail('INVALID_CONFIDENCE', 'record.confidence');
    if (!inList(STATUSES, doc.status)) return fail('INVALID_VALUE', 'record.status');
    if (!inList(SOURCES, doc.source)) return fail('INVALID_VALUE', 'record.source');
    if (!inList(SAFETY_FLAGS, doc.safetyFlag)) return fail('INVALID_VALUE', 'record.safetyFlag');
    var pe = validateProvenance(doc.provenance, 'record.provenance'); if (pe) return pe;
    var s1 = checkIdArray(doc.supersedes, LIMITS.MAX_LINKS, 'record.supersedes'); if (s1) return s1;
    var s2 = checkIdArray(doc.supersededBy, LIMITS.MAX_LINKS, 'record.supersededBy'); if (s2) return s2;
    if (!isInt(doc.createdAt) || !isInt(doc.updatedAt)) return fail('INVALID_TIMESTAMPS', 'record.createdAt');
    if (doc.lastEvidenceAt !== null && !isInt(doc.lastEvidenceAt)) return fail('INVALID_TIMESTAMPS', 'record.lastEvidenceAt');
    if (!Array.isArray(doc.correctionHistory)) return fail('INVALID_HISTORY', 'record.correctionHistory');
    for (var h = 0; h < doc.correctionHistory.length; h++) {
      var he = validateRecordHistoryEntry(doc.correctionHistory[h], 'record.correctionHistory[' + h + ']'); if (he) return he;
    }

    // cross-field rules (§10.2 rules 6-11)
    if ((doc.evidenceClass === 'EXPLICIT_STATEMENT') !== (doc.source === 'user_stated')) return fail('EVIDENCE_CLASS_SOURCE_MISMATCH', 'record.evidenceClass');
    if (doc.temporality === 'DURABLE' && doc.expiresAt !== null) return fail('INVALID_EXPIRY', 'record.expiresAt');
    if (doc.expiresAt !== null && doc.expiresAt <= doc.createdAt) return fail('INVALID_EXPIRY', 'record.expiresAt');
    if (doc.createdAt > doc.updatedAt) return fail('INVALID_TIMESTAMPS', 'record.updatedAt');
    if (doc.lastEvidenceAt !== null && doc.lastEvidenceAt > doc.updatedAt) return fail('INVALID_TIMESTAMPS', 'record.lastEvidenceAt');
    if (doc.supersedes.indexOf(doc.recordId) !== -1 || doc.supersededBy.indexOf(doc.recordId) !== -1) return fail('INVALID_LINKS', 'record.supersedes');
    if ((doc.status === 'superseded') !== (doc.supersededBy.length >= 1)) return fail('SUPERSESSION_LINK_MISMATCH', 'record.supersededBy');
    if (doc.source !== 'user_stated' && doc.status === 'active' && doc.evidence.confoundCheck === null) return fail('PROMOTION_WITHOUT_CONFOUND_CHECK', 'record.evidence.confoundCheck');
    var ho = validateHistoryOrder(doc.correctionHistory, LIMITS.MAX_HISTORY_ENTRIES, 'record.correctionHistory'); if (ho) return ho;
    return ok();
  }

  // ── §13.1 concept validator ──
  function validateConceptHistoryEntry(h, path) {
    if (!isPlainObject(h)) return fail('INVALID_HISTORY', path);
    var k = checkExactKeys(h, CONCEPT_HISTORY_KEYS, path); if (k) return k;
    if (!isId(h.eventId)) return fail('INVALID_HISTORY', path + '.eventId');
    if (!inList(CONCEPT_HISTORY_KINDS, h.kind)) return fail('INVALID_HISTORY', path + '.kind');
    if (!isInt(h.at)) return fail('INVALID_HISTORY', path + '.at');
    if (!inList(WRITER_AUTHORITIES, h.writer)) return fail('INVALID_HISTORY', path + '.writer');
    if (!isProducer(h.producer)) return fail('INVALID_HISTORY', path + '.producer');
    if (h.label !== null && checkText(h.label, 1, LIMITS.LABEL_MAX_CHARS, path + '.label')) return fail('INVALID_HISTORY', path + '.label');
    if (h.into !== null && !isId(h.into)) return fail('INVALID_HISTORY', path + '.into');
    if (h.reason !== null && checkText(h.reason, 1, LIMITS.REASON_MAX_CHARS, path + '.reason')) return fail('INVALID_HISTORY', path + '.reason');
    return null;
  }

  function validateLabels(labels, path) {
    if (!Array.isArray(labels) || labels.length < 1 || labels.length > LIMITS.MAX_LABELS_PER_CONCEPT) return fail('INVALID_LABELS', path);
    var keys = {};
    for (var i = 0; i < labels.length; i++) {
      var t = checkText(labels[i], 1, LIMITS.LABEL_MAX_CHARS, path + '[' + i + ']'); if (t) return t;
      var key = normalizeLabelKey(labels[i]);
      if (keys[key]) return fail('DUPLICATE_LABEL', path + '[' + i + ']');
      keys[key] = true;
    }
    return null;
  }

  function validateConcept(doc) {
    if (!isPlainObject(doc)) return fail('NOT_OBJECT', 'concept');
    var k = checkExactKeys(doc, CONCEPT_KEYS, 'concept'); if (k) return k;
    if (doc.schemaVersion !== LIMITS.SCHEMA_VERSION) return fail('INVALID_VALUE', 'concept.schemaVersion');
    if (!isId(doc.conceptId)) return fail('INVALID_ID', 'concept.conceptId');
    if (!isId(doc.userId)) return fail('INVALID_ID', 'concept.userId');
    if (!isInt(doc.version) || doc.version < 1) return fail('INVALID_VERSION', 'concept.version');
    var l = validateLabels(doc.labels, 'concept.labels'); if (l) return l;
    if (doc.mergedInto !== null && (!isId(doc.mergedInto) || doc.mergedInto === doc.conceptId)) return fail('INVALID_ID', 'concept.mergedInto');
    if (!isInt(doc.createdAt) || !isInt(doc.updatedAt) || doc.createdAt > doc.updatedAt) return fail('INVALID_TIMESTAMPS', 'concept.updatedAt');
    if (!Array.isArray(doc.history)) return fail('INVALID_HISTORY', 'concept.history');
    for (var h = 0; h < doc.history.length; h++) {
      var he = validateConceptHistoryEntry(doc.history[h], 'concept.history[' + h + ']'); if (he) return he;
    }
    var ho = validateHistoryOrder(doc.history, LIMITS.MAX_CONCEPT_HISTORY_ENTRIES, 'concept.history'); if (ho) return ho;
    return ok();
  }

  // ── §14.1 change set validator ──
  function docKind(doc) {
    if (isPlainObject(doc) && has(doc, 'recordId')) return 'record';
    if (isPlainObject(doc) && has(doc, 'conceptId') && has(doc, 'labels')) return 'concept';
    return null;
  }
  function validateDoc(doc) {
    var kind = docKind(doc);
    if (kind === 'record') return validateRecord(doc);
    if (kind === 'concept') return validateConcept(doc);
    return fail('NOT_OBJECT', 'doc');
  }
  function docId(doc) { return docKind(doc) === 'record' ? doc.recordId : doc.conceptId; }

  function validateChangeSet(cs) {
    if (!isPlainObject(cs)) return fail('INVALID_CHANGE_SET', 'changeSet');
    var k = checkExactKeys(cs, ['creates', 'updates'], 'changeSet'); if (k) return k;
    if (!Array.isArray(cs.creates) || !Array.isArray(cs.updates)) return fail('INVALID_CHANGE_SET', 'changeSet');
    if (cs.creates.length + cs.updates.length === 0) return fail('INVALID_CHANGE_SET', 'changeSet');
    var seen = {};
    for (var i = 0; i < cs.creates.length; i++) {
      var v = validateDoc(cs.creates[i]); if (!v.ok) return v;
      if (cs.creates[i].version !== 1) return fail('INVALID_VERSION', 'changeSet.creates[' + i + ']');
      var key = docKind(cs.creates[i]) + ':' + docId(cs.creates[i]);
      if (seen[key]) return fail('INVALID_CHANGE_SET', 'changeSet.creates[' + i + ']');
      seen[key] = true;
    }
    for (var j = 0; j < cs.updates.length; j++) {
      var u = cs.updates[j];
      if (!isPlainObject(u)) return fail('INVALID_CHANGE_SET', 'changeSet.updates[' + j + ']');
      var uk = checkExactKeys(u, ['kind', 'id', 'expectedVersion', 'doc'], 'changeSet.updates[' + j + ']'); if (uk) return uk;
      if (u.kind !== 'record' && u.kind !== 'concept') return fail('INVALID_CHANGE_SET', 'changeSet.updates[' + j + '].kind');
      if (docKind(u.doc) !== u.kind || docId(u.doc) !== u.id) return fail('INVALID_CHANGE_SET', 'changeSet.updates[' + j + '].id');
      if (!isInt(u.expectedVersion) || u.expectedVersion < 1 || u.doc.version !== u.expectedVersion + 1) return fail('INVALID_VERSION', 'changeSet.updates[' + j + ']');
      var uv = validateDoc(u.doc); if (!uv.ok) return uv;
      var ukey = u.kind + ':' + u.id;
      if (seen[ukey]) return fail('INVALID_CHANGE_SET', 'changeSet.updates[' + j + ']');
      seen[ukey] = true;
    }
    return ok();
  }

  // ── drafts (§10.4 rule 2; §14.1) ──
  function validateEvidenceRefDraft(r, path) {
    if (!isPlainObject(r)) return fail('INVALID_EVIDENCE_REF', path);
    var k = checkAllowedKeys(r, ['kind', 'ref'], ['observedAt'], path); if (k) return k;
    if (!inList(EVIDENCE_REF_KINDS, r.kind)) return fail('INVALID_EVIDENCE_REF', path + '.kind');
    if (typeof r.ref !== 'string' || !EVIDENCE_REF_PATTERN.test(r.ref)) return fail('INVALID_EVIDENCE_REF', path + '.ref');
    if (has(r, 'observedAt') && r.observedAt !== null && !isInt(r.observedAt)) return fail('INVALID_EVIDENCE_REF', path + '.observedAt');
    return null;
  }
  function validateConfoundDraft(c, path) {
    if (!isPlainObject(c)) return fail('INVALID_CONFOUND', path);
    var k = checkAllowedKeys(c, ['source'], ['conceptId', 'description'], path); if (k) return k;
    var conceptId = has(c, 'conceptId') ? c.conceptId : null;
    var description = has(c, 'description') ? c.description : null;
    if (conceptId !== null && !isId(conceptId)) return fail('INVALID_ID', path + '.conceptId');
    if (description !== null) {
      if (typeof description !== 'string') return fail('INVALID_VALUE', path + '.description');
      var t = checkText(normalizeText(description), 1, LIMITS.CONFOUND_DESCRIPTION_MAX_CHARS, path + '.description'); if (t) return t;
    }
    if (conceptId === null && description === null) return fail('INVALID_CONFOUND', path);
    if (!inList(SOURCES, c.source)) return fail('INVALID_VALUE', path + '.source');
    return null;
  }
  function validateRecordDraft(draft, newConceptCount) {
    if (!isPlainObject(draft)) return fail('NOT_OBJECT', 'draft');
    if (has(draft, 'conceptIds')) return fail('DERIVED_FIELD_SUPPLIED', 'draft.conceptIds');
    var k = checkAllowedKeys(draft, RECORD_DRAFT_REQUIRED, RECORD_DRAFT_OPTIONAL, 'draft'); if (k) return k;
    if (!Array.isArray(draft.factors) || draft.factors.length < 1 || draft.factors.length > LIMITS.MAX_FACTORS) return fail('FACTOR_COUNT', 'draft.factors');
    for (var i = 0; i < draft.factors.length; i++) {
      var f = draft.factors[i];
      var p = 'draft.factors[' + i + ']';
      if (!isPlainObject(f)) return fail('INVALID_FACTOR', p);
      var fk = checkAllowedKeys(f, ['role'], ['conceptId', 'newConcept', 'valueDescription'], p); if (fk) return fk;
      var hasExisting = has(f, 'conceptId');
      var hasNew = has(f, 'newConcept');
      if (hasExisting === hasNew) return fail('INVALID_FACTOR', p);
      if (hasExisting && !isId(f.conceptId)) return fail('INVALID_ID', p + '.conceptId');
      if (hasNew && (!isInt(f.newConcept) || f.newConcept >= (newConceptCount || 0))) return fail('INVALID_FACTOR', p + '.newConcept');
      if (!inList(FACTOR_ROLES, f.role)) return fail('INVALID_VALUE', p + '.role');
      if (has(f, 'valueDescription') && f.valueDescription !== null) {
        if (typeof f.valueDescription !== 'string') return fail('INVALID_VALUE', p + '.valueDescription');
        var vt = checkText(normalizeText(f.valueDescription), 1, LIMITS.VALUE_DESCRIPTION_MAX_CHARS, p + '.valueDescription'); if (vt) return vt;
      }
    }
    if (typeof draft.relationDescription !== 'string') return fail('INVALID_VALUE', 'draft.relationDescription');
    var rt = checkText(normalizeText(draft.relationDescription), 1, LIMITS.RELATION_DESCRIPTION_MAX_CHARS, 'draft.relationDescription'); if (rt) return rt;
    if (has(draft, 'evidence')) {
      var ev = draft.evidence;
      if (!isPlainObject(ev)) return fail('INVALID_VALUE', 'draft.evidence');
      var ek = checkAllowedKeys(ev, [], EVIDENCE_DRAFT_KEYS, 'draft.evidence'); if (ek) return ek;
      var lists = ['supporting', 'contradicting'];
      for (var li = 0; li < lists.length; li++) {
        if (!has(ev, lists[li])) continue;
        var list = ev[lists[li]];
        if (!Array.isArray(list) || list.length > LIMITS.MAX_EVIDENCE_REFS_PER_LIST) return fail('LIST_TOO_LONG', 'draft.evidence.' + lists[li]);
        for (var r = 0; r < list.length; r++) {
          var re = validateEvidenceRefDraft(list[r], 'draft.evidence.' + lists[li] + '[' + r + ']'); if (re) return re;
        }
      }
      if (has(ev, 'confoundsConsidered')) {
        if (!Array.isArray(ev.confoundsConsidered) || ev.confoundsConsidered.length > LIMITS.MAX_CONFOUNDS) return fail('LIST_TOO_LONG', 'draft.evidence.confoundsConsidered');
        for (var c = 0; c < ev.confoundsConsidered.length; c++) {
          var ce = validateConfoundDraft(ev.confoundsConsidered[c], 'draft.evidence.confoundsConsidered[' + c + ']'); if (ce) return ce;
        }
      }
    }
    if (!inList(EVIDENCE_CLASSES, draft.evidenceClass)) return fail('INVALID_VALUE', 'draft.evidenceClass');
    if (!inList(TEMPORALITIES, draft.temporality)) return fail('INVALID_VALUE', 'draft.temporality');
    if (has(draft, 'expiresAt') && draft.expiresAt !== null && !isInt(draft.expiresAt)) return fail('INVALID_EXPIRY', 'draft.expiresAt');
    if (!isConfidence(draft.confidence)) return fail('INVALID_CONFIDENCE', 'draft.confidence');
    if (!inList(SOURCES, draft.source)) return fail('INVALID_VALUE', 'draft.source');
    if (!inList(SAFETY_FLAGS, draft.safetyFlag)) return fail('INVALID_VALUE', 'draft.safetyFlag');
    if (has(draft, 'provenance')) {
      if (!isPlainObject(draft.provenance)) return fail('INVALID_VALUE', 'draft.provenance');
      var pk = checkAllowedKeys(draft.provenance, [], PROVENANCE_DRAFT_KEYS, 'draft.provenance'); if (pk) return pk;
      if (has(draft.provenance, 'originTurnId') && draft.provenance.originTurnId !== null && !isId(draft.provenance.originTurnId)) return fail('INVALID_ID', 'draft.provenance.originTurnId');
    }
    // `status` is accepted and ignored: initial status is never caller-controlled (§07 item 3).
    return null;
  }

  // Materializes the semantic content of a validated draft. `resolveNewConcept(index)` returns the
  // concept id minted for draft.factors[i].newConcept. The only place the content field names are
  // assembled into a record-shaped object (§23: prose is stored, never interpreted).
  function materializeContent(draft, resolveNewConcept) {
    var factors = draft.factors.map(function (f) {
      return {
        conceptId: has(f, 'conceptId') ? f.conceptId : resolveNewConcept(f.newConcept),
        role: f.role,
        valueDescription: (has(f, 'valueDescription') && f.valueDescription !== null) ? normalizeText(f.valueDescription) : null
      };
    });
    return {
      factors: factors,
      conceptIds: deriveConceptIds(factors),
      relationDescription: normalizeText(draft.relationDescription)
    };
  }

  // Canonical comparison key of a record's (or materialized draft's) semantic content —
  // INV-UC-S condition 5 (no relabeling). Compared for equality only; never interpreted.
  function contentKey(content) {
    var factors = (content.factors || []).map(function (f) {
      return [f.conceptId, f.role, f.valueDescription === null ? null : normalizeText(f.valueDescription)];
    });
    factors.sort(function (a, b) {
      var sa = JSON.stringify(a), sb = JSON.stringify(b);
      return sa < sb ? -1 : (sa > sb ? 1 : 0);
    });
    return JSON.stringify([deriveConceptIds(content.factors), factors, normalizeText(content.relationDescription)]);
  }

  // ── §18 derived views (never read prose or label text) ──
  function epistemicOrigin(r) {
    if (!r) return null;
    if (r.source === 'user_stated') return 'USER_STATED';
    if (r.source === 'inferred_event' || r.source === 'inferred_pattern') return 'FITME_INFERRED';
    if (r.source === 'coach_generated') return 'COACH_GENERATED';
    if (r.source === 'migrated') return 'MIGRATED';
    return null;
  }
  function isExplicit(r) { return !!r && r.source === 'user_stated' && r.status === 'active'; }
  function isContextual(r) {
    return !!r && Array.isArray(r.factors) && r.factors.some(function (f) { return f && f.role === 'condition'; });
  }
  function isExpired(r, now) { return !!r && r.expiresAt !== null && typeof now === 'number' && now >= r.expiresAt; }
  function countByAvailability(list) {
    var out = { RESOLVABLE: 0, UNVERIFIED: 0, UNRESOLVABLE: 0 };
    (Array.isArray(list) ? list : []).forEach(function (ref) { if (ref && has(out, ref.availability)) out[ref.availability]++; });
    return out;
  }
  function evidenceStanding(r) {
    var ev = (r && r.evidence) || {};
    var s = countByAvailability(ev.supporting);
    var c = countByAvailability(ev.contradicting);
    var basis;
    if (r && r.source === 'user_stated') basis = 'EXPLICIT';
    else if (s.RESOLVABLE >= 1) basis = 'SUPPORTED';
    else if (s.UNVERIFIED >= 1) basis = 'UNVERIFIED';
    else basis = 'UNSUPPORTED';
    return Object.freeze({
      basis: basis,
      supportingResolvable: s.RESOLVABLE,
      supportingUnverified: s.UNVERIFIED,
      supportingUnresolvable: s.UNRESOLVABLE,
      contradictingResolvable: c.RESOLVABLE,
      contradictingUnverified: c.UNVERIFIED,
      contradictingUnresolvable: c.UNRESOLVABLE,
      statementReferenceUnresolvable: !!(r && r.source === 'user_stated' && s.UNRESOLVABLE >= 1)
    });
  }
  function isUsableKnowledge(r, now) {
    return !!r && r.status === 'active' && !isExpired(r, now) && evidenceStanding(r).basis !== 'UNSUPPORTED';
  }

  // §13.4 — follows mergedInto to a root; bounded; cycle-safe.
  function resolveConceptRoot(conceptId, getConcept) {
    if (typeof getConcept !== 'function') return { ok: false, code: 'MERGE_CHAIN_INVALID' };
    var visited = {};
    var current = conceptId;
    for (var hops = 0; hops <= LIMITS.MAX_MERGE_CHAIN_DEPTH; hops++) {
      if (visited[current]) return { ok: false, code: 'MERGE_CHAIN_INVALID' };
      visited[current] = true;
      var concept = getConcept(current);
      if (!concept) return { ok: false, code: 'UNKNOWN_CONCEPT' };
      if (concept.mergedInto === null) return { ok: true, rootId: current, depth: hops };
      current = concept.mergedInto;
    }
    return { ok: false, code: 'MERGE_CHAIN_INVALID' };
  }
  function effectiveLabels(rootId, concepts) {
    var byId = {};
    (Array.isArray(concepts) ? concepts : []).forEach(function (c) { if (c && typeof c.conceptId === 'string') byId[c.conceptId] = c; });
    var get = function (id) { return byId[id] || null; };
    var out = [];
    var keys = {};
    Object.keys(byId).sort().forEach(function (id) {
      var res = resolveConceptRoot(id, get);
      if (!res.ok || res.rootId !== rootId) return;
      byId[id].labels.forEach(function (label) {
        var key = normalizeLabelKey(label);
        if (!keys[key]) { keys[key] = true; out.push(label); }
      });
    });
    return out;
  }

  // ── §19 proposal validator (future interpreters; returns data only) ──
  function validateFactorProposal(proposal, presentedConcepts) {
    if (!isPlainObject(proposal) || !Array.isArray(proposal.factors)) return fail('INVALID_PROPOSAL', 'proposal');
    if (Object.keys(proposal).length !== 1) return fail('UNKNOWN_FIELD', 'proposal');
    if (proposal.factors.length < 1 || proposal.factors.length > LIMITS.MAX_FACTORS) return fail('FACTOR_COUNT', 'proposal.factors');
    var presented = {};
    (Array.isArray(presentedConcepts) ? presentedConcepts : []).forEach(function (c) {
      if (c && typeof c.conceptId === 'string') presented[c.conceptId] = true;
    });
    var factors = [];
    var newLabels = [];
    var newKeys = {};
    for (var i = 0; i < proposal.factors.length; i++) {
      var f = proposal.factors[i];
      var p = 'proposal.factors[' + i + ']';
      if (!isPlainObject(f)) return fail('INVALID_FACTOR', p);
      var k = checkAllowedKeys(f, ['role'], ['conceptId', 'newConceptLabel', 'valueDescription'], p); if (k) return k;
      if (has(f, 'conceptId') === has(f, 'newConceptLabel')) return fail('INVALID_FACTOR', p);
      if (!inList(FACTOR_ROLES, f.role)) return fail('INVALID_VALUE', p + '.role');
      var valueDescription = null;
      if (has(f, 'valueDescription') && f.valueDescription !== null) {
        if (typeof f.valueDescription !== 'string') return fail('INVALID_VALUE', p + '.valueDescription');
        valueDescription = normalizeText(f.valueDescription);
        var vt = checkText(valueDescription, 1, LIMITS.VALUE_DESCRIPTION_MAX_CHARS, p + '.valueDescription'); if (vt) return vt;
      }
      if (has(f, 'conceptId')) {
        if (typeof f.conceptId !== 'string' || !presented[f.conceptId]) return fail('UNKNOWN_CONCEPT', p + '.conceptId');
        factors.push(Object.freeze({ conceptId: f.conceptId, role: f.role, valueDescription: valueDescription }));
      } else {
        if (typeof f.newConceptLabel !== 'string') return fail('INVALID_VALUE', p + '.newConceptLabel');
        var label = normalizeText(f.newConceptLabel);
        var lt = checkText(label, 1, LIMITS.LABEL_MAX_CHARS, p + '.newConceptLabel'); if (lt) return lt;
        var key = normalizeLabelKey(label);
        if (!has(newKeys, key)) { newKeys[key] = newLabels.length; newLabels.push(label); }
        factors.push(Object.freeze({ newConcept: newKeys[key], role: f.role, valueDescription: valueDescription }));
      }
    }
    return Object.freeze({ ok: true, factors: Object.freeze(factors), newConceptLabels: Object.freeze(newLabels) });
  }

  var API = {
    VERSION: USER_KNOWLEDGE_CONTRACT_VERSION,
    FACTOR_ROLES: FACTOR_ROLES,
    EVIDENCE_CLASSES: EVIDENCE_CLASSES,
    TEMPORALITIES: TEMPORALITIES,
    STATUSES: STATUSES,
    SOURCES: SOURCES,
    SAFETY_FLAGS: SAFETY_FLAGS,
    WRITER_AUTHORITIES: WRITER_AUTHORITIES,
    EVIDENCE_REF_KINDS: EVIDENCE_REF_KINDS,
    EVIDENCE_AVAILABILITY: EVIDENCE_AVAILABILITY,
    UNRESOLVABLE_REASONS: UNRESOLVABLE_REASONS,
    RECORD_HISTORY_KINDS: RECORD_HISTORY_KINDS,
    CONCEPT_HISTORY_KINDS: CONCEPT_HISTORY_KINDS,
    FITME_SOURCES: FITME_SOURCES,
    TERMINAL_STATUSES: TERMINAL_STATUSES,
    LIMITS: LIMITS,
    ID_PATTERN: ID_PATTERN,
    EVIDENCE_REF_PATTERN: EVIDENCE_REF_PATTERN,
    PRODUCER_PATTERN: PRODUCER_PATTERN,
    isId: isId,
    isProducer: isProducer,
    isPlainObject: isPlainObject,
    normalizeText: normalizeText,
    normalizeLabelKey: normalizeLabelKey,
    deriveConceptIds: deriveConceptIds,
    validateRecord: validateRecord,
    validateConcept: validateConcept,
    validateChangeSet: validateChangeSet,
    validateRecordDraft: validateRecordDraft,
    validateConfoundDraft: validateConfoundDraft,
    validateEvidenceRefDraft: validateEvidenceRefDraft,
    validateLabels: validateLabels,
    docKind: docKind,
    materializeContent: materializeContent,
    contentKey: contentKey,
    epistemicOrigin: epistemicOrigin,
    isExplicit: isExplicit,
    isContextual: isContextual,
    isExpired: isExpired,
    evidenceStanding: evidenceStanding,
    isUsableKnowledge: isUsableKnowledge,
    resolveConceptRoot: resolveConceptRoot,
    effectiveLabels: effectiveLabels,
    validateFactorProposal: validateFactorProposal
  };

  if (typeof window !== 'undefined') { window.UserKnowledgeContract = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
