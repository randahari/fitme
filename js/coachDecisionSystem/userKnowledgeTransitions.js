// ══════════════════════════════════════════════════════════════════
// FitMe — User Knowledge Transitions (WP0 Phase E.0.2c)
// docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §13-§15; GCUK Ch.10-13.
//
// Exclusive responsibility: pure transition planners. Each planner takes the current documents,
// a request (which carries every id it may use — ids are minted by the store through the port,
// never here), a timestamp, the configured writer authority and the producer identity, and
// returns either a complete change set {creates, updates} or {ok:false, code}. Planners never
// read a clock, never mint ids, never persist, never delete, and validate every document they
// return. Semantic content (factors, conceptIds, prose) is fixed at creation and never mutated
// in place; changing meaning always goes through supersession (§14.3, §15).
//
// INV-UC-S (§15.4, ADP-5): a `user_stated` record may be emitted while the writer is SERVER only
// by planCorrectInferredKnowledge. buildRecord() enforces this through its single
// `viaGovernedCorrection` flag, which only that planner sets.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;

  var USER_KNOWLEDGE_TRANSITIONS_VERSION = '1.0.0';
  var L = C.LIMITS;

  function fail(code, path) { return { ok: false, code: code, path: path || '' }; }
  function noChange() { return { ok: false, code: 'NO_CHANGE', path: '' }; }
  function done(creates, updates) { return { ok: true, changeSet: { creates: creates, updates: updates } }; }
  // Structural deep copy of plain document data (objects, arrays, primitives). Deliberately not a
  // parse-based copy: this module never parses text, and MRE-001 reserves JSON parsing in this
  // directory for model-output sites.
  function clone(o) {
    if (Array.isArray(o)) return o.map(clone);
    if (o !== null && typeof o === 'object') {
      var out = {};
      Object.keys(o).forEach(function (k) { out[k] = clone(o[k]); });
      return out;
    }
    return o;
  }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isFitmeSource(s) { return C.FITME_SOURCES.indexOf(s) !== -1; }
  function isTerminal(status) { return C.TERMINAL_STATUSES.indexOf(status) !== -1; }

  function checkContext(now, writer, producer) {
    if (typeof now !== 'number' || !Number.isInteger(now) || now < 0) return fail('INVALID_TIME', 'now');
    if (C.WRITER_AUTHORITIES.indexOf(writer) === -1) return fail('INVALID_WRITER', 'writer');
    if (!producer || !C.isProducer(producer.producer) || !C.isProducer(producer.producerVersion)) return fail('INVALID_PRODUCER', 'producer');
    return null;
  }

  // Id supply: the request carries pre-minted ids; planners consume them in order.
  function idSupply(ids) {
    ids = ids || {};
    var pools = {
      event: Array.isArray(ids.eventIds) ? ids.eventIds.slice() : [],
      confound: Array.isArray(ids.confoundIds) ? ids.confoundIds.slice() : [],
      concept: Array.isArray(ids.conceptIds) ? ids.conceptIds.slice() : []
    };
    return {
      recordId: ids.recordId || null,
      take: function (kind) { return pools[kind].length ? pools[kind].shift() : null; }
    };
  }

  function recordHistory(kind, eventId, now, writer, producer, extra) {
    extra = extra || {};
    return {
      eventId: eventId,
      kind: kind,
      at: now,
      writer: writer,
      producer: producer.producer,
      fromStatus: has(extra, 'fromStatus') ? extra.fromStatus : null,
      toStatus: has(extra, 'toStatus') ? extra.toStatus : null,
      relatedRecordIds: extra.relatedRecordIds || [],
      refIds: extra.refIds || [],
      confoundId: has(extra, 'confoundId') ? extra.confoundId : null,
      previousConfidence: has(extra, 'previousConfidence') ? extra.previousConfidence : null,
      newConfidence: has(extra, 'newConfidence') ? extra.newConfidence : null,
      reason: has(extra, 'reason') ? extra.reason : null,
      userOriginTurnId: has(extra, 'userOriginTurnId') ? extra.userOriginTurnId : null
    };
  }
  function conceptHistory(kind, eventId, now, writer, producer, extra) {
    extra = extra || {};
    return {
      eventId: eventId,
      kind: kind,
      at: now,
      writer: writer,
      producer: producer.producer,
      label: has(extra, 'label') ? extra.label : null,
      into: has(extra, 'into') ? extra.into : null,
      reason: has(extra, 'reason') ? extra.reason : null
    };
  }

  function normalizeReason(reason) {
    if (reason === undefined || reason === null) return { ok: true, value: null };
    if (typeof reason !== 'string') return { ok: false };
    var r = C.normalizeText(reason);
    if (r.length < 1 || r.length > L.REASON_MAX_CHARS) return { ok: false };
    return { ok: true, value: r };
  }
  function optionalTurnId(v) {
    if (v === undefined || v === null) return { ok: true, value: null };
    return C.isId(v) ? { ok: true, value: v } : { ok: false };
  }

  // In-place mutations and promotion must leave the last history slot for a terminal transition.
  function hasInPlaceCapacity(record, entries) {
    return record.correctionHistory.length + entries <= L.MAX_HISTORY_ENTRIES - 1;
  }
  function hasTerminalCapacity(record, inPlaceEntries) {
    return record.correctionHistory.length + inPlaceEntries <= L.MAX_HISTORY_ENTRIES - 1;
  }

  function nextRecord(record, now) {
    var next = clone(record);
    next.version = record.version + 1;
    next.updatedAt = now;
    return next;
  }
  function recordUpdate(prev, next) { return { kind: 'record', id: prev.recordId, expectedVersion: prev.version, doc: next }; }
  function conceptUpdate(prev, next) { return { kind: 'concept', id: prev.conceptId, expectedVersion: prev.version, doc: next }; }

  function checked(docs) {
    for (var i = 0; i < docs.length; i++) {
      var kind = C.docKind(docs[i]);
      var v = kind === 'record' ? C.validateRecord(docs[i]) : C.validateConcept(docs[i]);
      if (!v.ok) return v;
    }
    return null;
  }

  function checkCurrentRecord(record, userId) {
    if (!record) return fail('NOT_FOUND', 'record');
    var v = C.validateRecord(record);
    if (!v.ok) return fail('STORED_DOCUMENT_INVALID', v.path);
    if (userId !== undefined && record.userId !== userId) return fail('FOREIGN_USER', 'record.userId');
    return null;
  }

  // ── concepts created in the same change set (§13.7) ──
  function buildNewConcepts(newConcepts, userId, now, writer, producer, ids) {
    var list = newConcepts || [];
    if (!Array.isArray(list) || list.length > L.MAX_FACTORS) return { error: fail('INVALID_VALUE', 'newConcepts') };
    var docs = [];
    for (var i = 0; i < list.length; i++) {
      var planned = planCreateConceptDoc(list[i], userId, now, writer, producer, ids);
      if (planned.error) return planned;
      docs.push(planned.doc);
    }
    return { docs: docs };
  }

  function buildEvidenceRefs(drafts, now) {
    return (drafts || []).map(function (d) {
      return {
        refId: d.kind + ':' + d.ref,
        kind: d.kind,
        ref: d.ref,
        observedAt: (has(d, 'observedAt') && d.observedAt !== null) ? d.observedAt : null,
        addedAt: now,
        availability: 'UNVERIFIED',
        availabilityCheckedAt: null,
        unresolvableReason: null
      };
    });
  }
  function buildConfound(draft, now, ids) {
    var confoundId = ids.take('confound');
    if (!confoundId) return { error: fail('ID_EXHAUSTED', 'confoundIds') };
    return {
      confound: {
        confoundId: confoundId,
        conceptId: has(draft, 'conceptId') ? draft.conceptId : null,
        description: (has(draft, 'description') && draft.description !== null) ? C.normalizeText(draft.description) : null,
        source: draft.source,
        addedAt: now
      }
    };
  }

  // Referential integrity (§13.7): every referenced concept exists for this user.
  function checkConceptRefs(conceptIds, knownConcepts, userId) {
    for (var i = 0; i < conceptIds.length; i++) {
      var c = knownConcepts[conceptIds[i]];
      if (!c || c.userId !== userId) return fail('UNKNOWN_CONCEPT', 'conceptId:' + conceptIds[i]);
    }
    return null;
  }

  // Shared record construction. `opts.viaGovernedCorrection` is the single INV-UC-S switch.
  function buildRecord(draft, opts, now, writer, producer, ids) {
    var dv = C.validateRecordDraft(draft, (opts.newConceptIds || []).length);
    if (dv) return { error: dv };
    if (draft.source === 'migrated') return { error: fail('AUTHORITY', 'draft.source') };
    if (draft.source === 'user_stated' && writer === 'SERVER' && opts.viaGovernedCorrection !== true) {
      return { error: fail('AUTHORITY', 'draft.source') };
    }
    var recordId = ids.recordId;
    if (!recordId) return { error: fail('ID_EXHAUSTED', 'recordId') };
    var content = C.materializeContent(draft, function (i) { return opts.newConceptIds[i]; });

    var ev = has(draft, 'evidence') ? draft.evidence : {};
    var supporting = buildEvidenceRefs(ev.supporting, now);
    var contradicting = buildEvidenceRefs(ev.contradicting, now);
    var confounds = [];
    var confoundDrafts = ev.confoundsConsidered || [];
    for (var i = 0; i < confoundDrafts.length; i++) {
      var built = buildConfound(confoundDrafts[i], now, ids);
      if (built.error) return built;
      confounds.push(built.confound);
    }
    var refConceptIds = content.conceptIds.slice();
    confounds.forEach(function (cf) { if (cf.conceptId !== null) refConceptIds.push(cf.conceptId); });
    var integrity = checkConceptRefs(refConceptIds, opts.knownConcepts, opts.userId);
    if (integrity) return { error: integrity };

    var status = draft.source === 'user_stated' ? 'active' : 'candidate';
    var eventId = ids.take('event');
    if (!eventId) return { error: fail('ID_EXHAUSTED', 'eventIds') };
    var record = Object.assign({
      schemaVersion: L.SCHEMA_VERSION,
      recordId: recordId,
      userId: opts.userId,
      version: 1
    }, content, {
      evidence: { supporting: supporting, contradicting: contradicting, confoundsConsidered: confounds, confoundCheck: null },
      evidenceClass: draft.evidenceClass,
      temporality: draft.temporality,
      expiresAt: has(draft, 'expiresAt') ? draft.expiresAt : null,
      confidence: draft.confidence,
      status: status,
      source: draft.source,
      safetyFlag: draft.safetyFlag,
      provenance: {
        producer: producer.producer,
        producerVersion: producer.producerVersion,
        originTurnId: (has(draft, 'provenance') && has(draft.provenance, 'originTurnId')) ? draft.provenance.originTurnId : null
      },
      supersedes: (opts.supersedes || []).slice(),
      supersededBy: [],
      createdAt: now,
      updatedAt: now,
      lastEvidenceAt: (supporting.length + contradicting.length) > 0 ? now : null,
      correctionHistory: [recordHistory('CREATED', eventId, now, writer, producer, {
        toStatus: status,
        relatedRecordIds: (opts.supersedes || []).slice(),
        refIds: supporting.concat(contradicting).map(function (r) { return r.refId; }),
        userOriginTurnId: opts.userOriginTurnId || null
      })]
    });
    var v = C.validateRecord(record);
    if (!v.ok) return { error: v };
    return { record: record };
  }

  // ── §14.2 create ──
  function planCreateRecord(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var ids = idSupply(request.ids);
    var nc = buildNewConcepts(request.newConcepts, request.userId, now, writer, producer, ids);
    if (nc.error) return nc.error;
    var known = Object.assign({}, (currentDocs && currentDocs.concepts) || {});
    nc.docs.forEach(function (d) { known[d.conceptId] = d; });
    var built = buildRecord(request.draft, {
      userId: request.userId,
      knownConcepts: known,
      newConceptIds: nc.docs.map(function (d) { return d.conceptId; }),
      supersedes: [],
      viaGovernedCorrection: false
    }, now, writer, producer, ids);
    if (built.error) return built.error;
    return done(nc.docs.concat([built.record]), []);
  }

  // ── §14.2 status transitions ──
  function planPromoteRecord(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    var record = currentDocs && currentDocs.record;
    var cr = checkCurrentRecord(record, request && request.userId); if (cr) return cr;
    if (record.status !== 'candidate') return fail('INVALID_TRANSITION', 'record.status');
    if (record.source !== 'user_stated') {
      var usable = record.evidence.supporting.some(function (r) { return r.availability !== 'UNRESOLVABLE'; });
      if (record.evidence.confoundCheck === null || !usable) return fail('PROMOTION_CONDITIONS_NOT_MET', 'record.evidence');
    }
    if (!hasInPlaceCapacity(record, 1)) return fail('HISTORY_CAPACITY', 'record.correctionHistory');
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextRecord(record, now);
    next.status = 'active';
    next.correctionHistory.push(recordHistory('PROMOTED', eventId, now, writer, producer, { fromStatus: 'candidate', toStatus: 'active' }));
    var e = checked([next]); if (e) return e;
    return done([], [recordUpdate(record, next)]);
  }

  function planTerminal(kind, fromAllowed, toStatus, currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var record = currentDocs && currentDocs.record;
    var cr = checkCurrentRecord(record, request.userId); if (cr) return cr;
    if (fromAllowed.indexOf(record.status) === -1) return fail('INVALID_TRANSITION', 'record.status');
    var turn = optionalTurnId(request.userOriginTurnId);
    if (!turn.ok) return fail('INVALID_ID', 'userOriginTurnId');
    if (!hasTerminalCapacity(record, 0)) return fail('HISTORY_CAPACITY', 'record.correctionHistory');
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextRecord(record, now);
    next.status = toStatus;
    next.correctionHistory.push(recordHistory(kind, eventId, now, writer, producer, { fromStatus: record.status, toStatus: toStatus, userOriginTurnId: turn.value }));
    var e = checked([next]); if (e) return e;
    return done([], [recordUpdate(record, next)]);
  }
  function planRetractRecord(currentDocs, request, now, writer, producer) {
    return planTerminal('RETRACTED', ['candidate', 'active'], 'rejected', currentDocs, request, now, writer, producer);
  }
  function planArchiveRecord(currentDocs, request, now, writer, producer) {
    return planTerminal('ARCHIVED', ['active'], 'archived', currentDocs, request, now, writer, producer);
  }

  // ── §14.3 in-place process mutations ──
  function beginInPlace(currentDocs, request, now, writer, producer, entries) {
    var cx = checkContext(now, writer, producer); if (cx) return { error: cx };
    var record = currentDocs && currentDocs.record;
    var cr = checkCurrentRecord(record, request && request.userId); if (cr) return { error: cr };
    if (isTerminal(record.status)) return { error: fail('INVALID_TRANSITION', 'record.status') };
    if (!hasInPlaceCapacity(record, entries)) return { error: fail('HISTORY_CAPACITY', 'record.correctionHistory') };
    return { record: record, next: nextRecord(record, now) };
  }

  function planAppendEvidence(currentDocs, request, now, writer, producer) {
    request = request || {};
    if (request.list !== 'supporting' && request.list !== 'contradicting') return fail('INVALID_VALUE', 'list');
    if (!Array.isArray(request.refs) || request.refs.length < 1) return fail('INVALID_VALUE', 'refs');
    for (var i = 0; i < request.refs.length; i++) {
      var rv = C.validateEvidenceRefDraft(request.refs[i], 'refs[' + i + ']'); if (rv) return rv;
    }
    var b = beginInPlace(currentDocs, request, now, writer, producer, 1); if (b.error) return b.error;
    var existing = {};
    b.record.evidence.supporting.concat(b.record.evidence.contradicting).forEach(function (r) { existing[r.refId] = true; });
    var fresh = buildEvidenceRefs(request.refs, now).filter(function (r) {
      if (existing[r.refId]) return false;
      existing[r.refId] = true;
      return true;
    });
    if (!fresh.length) return noChange();
    if (b.next.evidence[request.list].length + fresh.length > L.MAX_EVIDENCE_REFS_PER_LIST) return fail('LIST_TOO_LONG', 'evidence.' + request.list);
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    b.next.evidence[request.list] = b.next.evidence[request.list].concat(fresh);
    b.next.lastEvidenceAt = now;
    b.next.correctionHistory.push(recordHistory('EVIDENCE_ADDED', eventId, now, writer, producer, { refIds: fresh.map(function (r) { return r.refId; }) }));
    var e = checked([b.next]); if (e) return e;
    return done([], [recordUpdate(b.record, b.next)]);
  }

  // §11.3: applies resolver results. Changes availability fields only; never removes, replaces,
  // or re-points a reference; never touches status, confidence, source or content.
  function planEvidenceAvailability(currentDocs, request, now, writer, producer) {
    request = request || {};
    if (!Array.isArray(request.results) || request.results.length < 1) return fail('INVALID_VALUE', 'results');
    var results = [];
    var seen = {};
    for (var i = 0; i < request.results.length; i++) {
      var res = request.results[i];
      var p = 'results[' + i + ']';
      if (!C.isPlainObject(res)) return fail('INVALID_VALUE', p);
      var keys = Object.keys(res);
      for (var k = 0; k < keys.length; k++) {
        if (['refId', 'availability', 'reason'].indexOf(keys[k]) === -1) return fail('UNKNOWN_FIELD', p + '.' + keys[k]);
      }
      if (typeof res.refId !== 'string' || seen[res.refId]) return fail('INVALID_VALUE', p + '.refId');
      seen[res.refId] = true;
      if (res.availability !== 'RESOLVABLE' && res.availability !== 'UNRESOLVABLE') return fail('INVALID_VALUE', p + '.availability');
      var reason = null;
      if (res.availability === 'UNRESOLVABLE') {
        reason = (res.reason === undefined || res.reason === null) ? 'NOT_FOUND' : res.reason;
        if (C.UNRESOLVABLE_REASONS.indexOf(reason) === -1) return fail('INVALID_VALUE', p + '.reason');
      } else if (res.reason !== undefined && res.reason !== null) {
        return fail('INVALID_VALUE', p + '.reason');
      }
      results.push({ refId: res.refId, availability: res.availability, reason: reason });
    }
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    var record = currentDocs && currentDocs.record;
    var cr = checkCurrentRecord(record, request.userId); if (cr) return cr;
    if (isTerminal(record.status)) return fail('INVALID_TRANSITION', 'record.status');
    var next = nextRecord(record, now);
    var refsById = {};
    ['supporting', 'contradicting'].forEach(function (list) { next.evidence[list].forEach(function (r) { refsById[r.refId] = r; }); });
    var changed = [];
    for (var j = 0; j < results.length; j++) {
      var ref = refsById[results[j].refId];
      if (!ref) return fail('UNKNOWN_REF', 'results[' + j + '].refId');
      if (ref.availability === results[j].availability && ref.unresolvableReason === results[j].reason) continue;
      ref.availability = results[j].availability;
      ref.availabilityCheckedAt = now;
      ref.unresolvableReason = results[j].reason;
      changed.push(results[j]);
    }
    if (!changed.length) return noChange();
    if (!hasInPlaceCapacity(record, changed.length)) return fail('HISTORY_CAPACITY', 'record.correctionHistory');
    var ids = idSupply(request.ids);
    for (var c = 0; c < changed.length; c++) {
      var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
      next.correctionHistory.push(recordHistory('EVIDENCE_AVAILABILITY_CHANGED', eventId, now, writer, producer, { refIds: [changed[c].refId], reason: changed[c].reason }));
    }
    var e = checked([next]); if (e) return e;
    return done([], [recordUpdate(record, next)]);
  }

  function planAddConfound(currentDocs, request, now, writer, producer) {
    request = request || {};
    var dv = C.validateConfoundDraft(request.confound, 'confound'); if (dv) return dv;
    var b = beginInPlace(currentDocs, request, now, writer, producer, 1); if (b.error) return b.error;
    if (b.next.evidence.confoundsConsidered.length + 1 > L.MAX_CONFOUNDS) return fail('LIST_TOO_LONG', 'evidence.confoundsConsidered');
    var ids = idSupply(request.ids);
    var built = buildConfound(request.confound, now, ids); if (built.error) return built.error;
    if (built.confound.conceptId !== null) {
      var integrity = checkConceptRefs([built.confound.conceptId], (currentDocs && currentDocs.concepts) || {}, b.record.userId);
      if (integrity) return integrity;
    }
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    b.next.evidence.confoundsConsidered.push(built.confound);
    b.next.correctionHistory.push(recordHistory('CONFOUND_ADDED', eventId, now, writer, producer, { confoundId: built.confound.confoundId }));
    var e = checked([b.next]); if (e) return e;
    return done([], [recordUpdate(b.record, b.next)]);
  }

  function planRecordConfoundCheck(currentDocs, request, now, writer, producer) {
    request = request || {};
    var b = beginInPlace(currentDocs, request, now, writer, producer, 1); if (b.error) return b.error;
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    b.next.evidence.confoundCheck = { performedAt: now, producer: producer.producer, producerVersion: producer.producerVersion };
    b.next.correctionHistory.push(recordHistory('CONFOUND_CHECK_RECORDED', eventId, now, writer, producer));
    var e = checked([b.next]); if (e) return e;
    return done([], [recordUpdate(b.record, b.next)]);
  }

  function planSetConfidence(currentDocs, request, now, writer, producer) {
    request = request || {};
    var value = request.confidence;
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 1) return fail('INVALID_CONFIDENCE', 'confidence');
    var b = beginInPlace(currentDocs, request, now, writer, producer, 1); if (b.error) return b.error;
    if (b.record.confidence === value) return noChange();
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    b.next.confidence = value;
    b.next.correctionHistory.push(recordHistory('CONFIDENCE_CHANGED', eventId, now, writer, producer, { previousConfidence: b.record.confidence, newConfidence: value }));
    var e = checked([b.next]); if (e) return e;
    return done([], [recordUpdate(b.record, b.next)]);
  }

  // Monotonic: the only expressible change is STANDARD → SAFETY_ADJACENT (§24).
  function planRaiseSafetyFlag(currentDocs, request, now, writer, producer) {
    request = request || {};
    var b = beginInPlace(currentDocs, request, now, writer, producer, 1); if (b.error) return b.error;
    if (b.record.safetyFlag === 'SAFETY_ADJACENT') return noChange();
    var ids = idSupply(request.ids);
    var eventId = ids.take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    b.next.safetyFlag = 'SAFETY_ADJACENT';
    b.next.correctionHistory.push(recordHistory('SAFETY_FLAG_RAISED', eventId, now, writer, producer));
    var e = checked([b.next]); if (e) return e;
    return done([], [recordUpdate(b.record, b.next)]);
  }

  // ── §15 supersession (shared by the generic path and the governed correction path) ──
  function buildSupersession(currentDocs, request, now, writer, producer, governed) {
    var predecessorIds = request.predecessorIds;
    if (!Array.isArray(predecessorIds) || predecessorIds.length < 1 || predecessorIds.length > L.MAX_LINKS) return { error: fail('INVALID_VALUE', 'predecessorIds') };
    var seen = {};
    for (var i = 0; i < predecessorIds.length; i++) {
      if (!C.isId(predecessorIds[i]) || seen[predecessorIds[i]]) return { error: fail('INVALID_VALUE', 'predecessorIds[' + i + ']') };
      seen[predecessorIds[i]] = true;
    }
    var byId = {};
    ((currentDocs && currentDocs.predecessors) || []).forEach(function (r) { if (r && r.recordId) byId[r.recordId] = r; });
    var predecessors = [];
    for (var j = 0; j < predecessorIds.length; j++) {
      var p = byId[predecessorIds[j]];
      var cr = checkCurrentRecord(p, request.userId);
      if (cr) return { error: governed ? fail('INVALID_USER_CORRECTION', 'predecessor:' + predecessorIds[j]) : cr };
      if (p.status !== 'candidate' && p.status !== 'active') {
        return { error: governed ? fail('INVALID_USER_CORRECTION', 'predecessor:' + p.recordId) : fail('INVALID_TRANSITION', 'predecessor:' + p.recordId) };
      }
      predecessors.push(p);
    }
    var userStatedCount = predecessors.filter(function (p) { return p.source === 'user_stated'; }).length;
    var fitmeCount = predecessors.filter(function (p) { return isFitmeSource(p.source); }).length;
    if (governed) {
      if (fitmeCount !== predecessors.length) return { error: fail('INVALID_USER_CORRECTION', 'predecessorIds') };
    } else if (!(userStatedCount === predecessors.length || fitmeCount === predecessors.length)) {
      return { error: fail('MIXED_AUTHORITY_PREDECESSORS', 'predecessorIds') };
    }

    var confoundDrafts = request.confoundsForPredecessors || [];
    if (!Array.isArray(confoundDrafts) || confoundDrafts.length > L.MAX_CONFOUNDS) return { error: fail('INVALID_VALUE', 'confoundsForPredecessors') };
    for (var c = 0; c < confoundDrafts.length; c++) {
      var cv = C.validateConfoundDraft(confoundDrafts[c], 'confoundsForPredecessors[' + c + ']'); if (cv) return { error: cv };
      if (governed && confoundDrafts[c].source !== 'user_stated') return { error: fail('INVALID_USER_CORRECTION', 'confoundsForPredecessors[' + c + '].source') };
    }

    var ids = idSupply(request.ids);
    var nc = buildNewConcepts(request.newConcepts, request.userId, now, writer, producer, ids);
    if (nc.error) return nc;
    var known = Object.assign({}, (currentDocs && currentDocs.concepts) || {});
    nc.docs.forEach(function (d) { known[d.conceptId] = d; });
    var turnId = governed ? request.userOriginTurnId : null;

    var built = buildRecord(request.successor, {
      userId: request.userId,
      knownConcepts: known,
      newConceptIds: nc.docs.map(function (d) { return d.conceptId; }),
      supersedes: predecessorIds.slice(),
      viaGovernedCorrection: governed === true,
      userOriginTurnId: turnId
    }, now, writer, producer, ids);
    if (built.error) return built;
    var successor = built.record;

    var updates = [];
    for (var k = 0; k < predecessors.length; k++) {
      var prev = predecessors[k];
      if (!hasTerminalCapacity(prev, confoundDrafts.length)) return { error: fail('HISTORY_CAPACITY', 'predecessor:' + prev.recordId) };
      if (prev.supersededBy.length + 1 > L.MAX_LINKS) return { error: fail('INVALID_LINKS', 'predecessor:' + prev.recordId) };
      if (prev.evidence.confoundsConsidered.length + confoundDrafts.length > L.MAX_CONFOUNDS) return { error: fail('LIST_TOO_LONG', 'predecessor:' + prev.recordId) };
      var next = nextRecord(prev, now);
      for (var m = 0; m < confoundDrafts.length; m++) {
        var bc = buildConfound(confoundDrafts[m], now, ids); if (bc.error) return bc;
        if (bc.confound.conceptId !== null) {
          var integrity = checkConceptRefs([bc.confound.conceptId], known, request.userId);
          if (integrity) return { error: integrity };
        }
        var ceId = ids.take('event'); if (!ceId) return { error: fail('ID_EXHAUSTED', 'eventIds') };
        next.evidence.confoundsConsidered.push(bc.confound);
        next.correctionHistory.push(recordHistory('CONFOUND_ADDED', ceId, now, writer, producer, { confoundId: bc.confound.confoundId, userOriginTurnId: turnId }));
      }
      var seId = ids.take('event'); if (!seId) return { error: fail('ID_EXHAUSTED', 'eventIds') };
      next.status = 'superseded';
      next.supersededBy = prev.supersededBy.concat([successor.recordId]);
      next.correctionHistory.push(recordHistory('SUPERSEDED', seId, now, writer, producer, {
        fromStatus: prev.status, toStatus: 'superseded', relatedRecordIds: [successor.recordId], userOriginTurnId: turnId
      }));
      updates.push(recordUpdate(prev, next));
    }
    var e = checked(updates.map(function (u) { return u.doc; })); if (e) return { error: e };
    return { changeSet: { creates: nc.docs.concat([successor]), updates: updates }, predecessors: predecessors, successor: successor };
  }

  // §15.1 — generic supersession. Never emits `user_stated` under SERVER (INV-UC-S).
  function planSupersede(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var r = buildSupersession(currentDocs, request, now, writer, producer, false);
    if (r.error) return r.error;
    return done(r.changeSet.creates, r.changeSet.updates);
  }

  // §15.4 — the governed correction operation (ADP-5). Only path that may emit `user_stated`
  // while the writer is SERVER, and only when every INV-UC-S condition holds.
  function planCorrectInferredKnowledge(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    if (writer !== 'SERVER') return fail('AUTHORITY', 'writer');
    var turnId = request.userOriginTurnId;
    // condition 2
    if (!C.isId(turnId)) return fail('INVALID_USER_CORRECTION', 'userOriginTurnId');
    // condition 3 (checked on the draft before any construction)
    var s = request.successor;
    if (!C.isPlainObject(s) || s.source !== 'user_stated' || s.evidenceClass !== 'EXPLICIT_STATEMENT') return fail('INVALID_USER_CORRECTION', 'successor.source');
    if (!C.isPlainObject(s.provenance) || s.provenance.originTurnId !== turnId) return fail('INVALID_USER_CORRECTION', 'successor.provenance.originTurnId');
    var ev = C.isPlainObject(s.evidence) ? s.evidence : {};
    var supporting = Array.isArray(ev.supporting) ? ev.supporting : [];
    if (supporting.length !== 1 || !C.isPlainObject(supporting[0]) || supporting[0].kind !== 'CONVERSATION_TURN' || supporting[0].ref !== turnId) {
      return fail('INVALID_USER_CORRECTION', 'successor.evidence.supporting');
    }
    if (has(ev, 'contradicting') && (!Array.isArray(ev.contradicting) || ev.contradicting.length !== 0)) return fail('INVALID_USER_CORRECTION', 'successor.evidence.contradicting');
    var ownConfounds = Array.isArray(ev.confoundsConsidered) ? ev.confoundsConsidered : [];
    for (var i = 0; i < ownConfounds.length; i++) {
      if (!C.isPlainObject(ownConfounds[i]) || ownConfounds[i].source !== 'user_stated') return fail('INVALID_USER_CORRECTION', 'successor.evidence.confoundsConsidered[' + i + ']');
    }
    // conditions 1, 4 and 6 are enforced by buildSupersession(governed=true)
    var r = buildSupersession(currentDocs, request, now, writer, producer, true);
    if (r.error) return r.error;
    // condition 5 — a genuine correction, never a relabel of an inferred record
    var successorKey = C.contentKey(r.successor);
    for (var p = 0; p < r.predecessors.length; p++) {
      if (C.contentKey(r.predecessors[p]) === successorKey) return fail('CORRECTION_IDENTICAL_TO_PREDECESSOR', 'successor');
    }
    return done(r.changeSet.creates, r.changeSet.updates);
  }

  // ── §13 concepts ──
  function planCreateConceptDoc(labels, userId, now, writer, producer, ids) {
    if (!Array.isArray(labels)) return { error: fail('INVALID_LABELS', 'labels') };
    var normalized = labels.map(function (l) { return C.normalizeText(l); });
    var lv = C.validateLabels(normalized, 'labels'); if (lv) return { error: lv };
    var conceptId = ids.take('concept'); if (!conceptId) return { error: fail('ID_EXHAUSTED', 'conceptIds') };
    var eventId = ids.take('event'); if (!eventId) return { error: fail('ID_EXHAUSTED', 'eventIds') };
    var doc = {
      schemaVersion: L.SCHEMA_VERSION,
      conceptId: conceptId,
      userId: userId,
      version: 1,
      labels: normalized,
      mergedInto: null,
      createdAt: now,
      updatedAt: now,
      history: [conceptHistory('CREATED', eventId, now, writer, producer)]
    };
    var v = C.validateConcept(doc);
    if (!v.ok) return { error: v };
    return { doc: doc };
  }

  function planCreateConcept(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var planned = planCreateConceptDoc(request.labels, request.userId, now, writer, producer, idSupply(request.ids));
    if (planned.error) return planned.error;
    return done([planned.doc], []);
  }

  function checkCurrentConcept(concept, userId, path) {
    if (!concept) return fail('NOT_FOUND', path);
    var v = C.validateConcept(concept);
    if (!v.ok) return fail('STORED_DOCUMENT_INVALID', v.path);
    if (userId !== undefined && concept.userId !== userId) return fail('FOREIGN_USER', path);
    return null;
  }
  function nextConcept(concept, now) {
    var next = clone(concept);
    next.version = concept.version + 1;
    next.updatedAt = now;
    return next;
  }

  function planAddConceptLabel(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var concept = currentDocs && currentDocs.concept;
    var cc = checkCurrentConcept(concept, request.userId, 'concept'); if (cc) return cc;
    if (typeof request.label !== 'string') return fail('INVALID_VALUE', 'label');
    var label = C.normalizeText(request.label);
    if (label.length < 1 || label.length > L.LABEL_MAX_CHARS) return fail('TEXT_LENGTH', 'label');
    var key = C.normalizeLabelKey(label);
    if (concept.labels.some(function (l) { return C.normalizeLabelKey(l) === key; })) return noChange();
    if (concept.labels.length + 1 > L.MAX_LABELS_PER_CONCEPT || concept.history.length + 1 > L.MAX_CONCEPT_HISTORY_ENTRIES) return fail('CAPACITY_EXCEEDED', 'concept');
    var eventId = idSupply(request.ids).take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextConcept(concept, now);
    next.labels.push(label);
    next.history.push(conceptHistory('LABEL_ADDED', eventId, now, writer, producer, { label: label }));
    var e = checked([next]); if (e) return e;
    return done([], [conceptUpdate(concept, next)]);
  }

  // Label removal is correction, not forgetting: the removed label stays in history (§13.6).
  function planRemoveConceptLabel(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var concept = currentDocs && currentDocs.concept;
    var cc = checkCurrentConcept(concept, request.userId, 'concept'); if (cc) return cc;
    var idx = concept.labels.indexOf(request.label);
    if (idx === -1) return fail('NOT_FOUND', 'label');
    if (concept.labels.length <= 1) return fail('LAST_LABEL', 'label');
    if (concept.history.length + 1 > L.MAX_CONCEPT_HISTORY_ENTRIES) return fail('CAPACITY_EXCEEDED', 'concept');
    var eventId = idSupply(request.ids).take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextConcept(concept, now);
    next.labels.splice(idx, 1);
    next.history.push(conceptHistory('LABEL_REMOVED', eventId, now, writer, producer, { label: concept.labels[idx] }));
    var e = checked([next]); if (e) return e;
    return done([], [conceptUpdate(concept, next)]);
  }

  // §13.3 — sets only mergedInto + history. Rewrites no record, moves no label, deletes nothing.
  function planMergeConcept(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var from = currentDocs && currentDocs.from;
    var into = currentDocs && currentDocs.into;
    var cf = checkCurrentConcept(from, request.userId, 'from'); if (cf) return cf;
    var ci = checkCurrentConcept(into, request.userId, 'into'); if (ci) return ci;
    if (from.userId !== into.userId) return fail('FOREIGN_USER', 'into');
    if (from.conceptId === into.conceptId) return fail('INVALID_MERGE', 'into');
    if (from.mergedInto !== null) return fail('INVALID_MERGE', 'from.mergedInto');
    var reason = normalizeReason(request.reason); if (!reason.ok) return fail('INVALID_VALUE', 'reason');
    var getConcept = (currentDocs && typeof currentDocs.getConcept === 'function') ? currentDocs.getConcept : function () { return null; };
    var root = C.resolveConceptRoot(into.conceptId, function (id) { return id === into.conceptId ? into : getConcept(id); });
    if (!root.ok) return fail(root.code, 'into');
    if (root.rootId === from.conceptId || root.depth >= L.MAX_MERGE_CHAIN_DEPTH) return fail('INVALID_MERGE', 'into');
    if (from.history.length + 1 > L.MAX_CONCEPT_HISTORY_ENTRIES) return fail('CAPACITY_EXCEEDED', 'from');
    var eventId = idSupply(request.ids).take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextConcept(from, now);
    next.mergedInto = into.conceptId;
    next.history.push(conceptHistory('MERGED', eventId, now, writer, producer, { into: into.conceptId, reason: reason.value }));
    var e = checked([next]); if (e) return e;
    return done([], [conceptUpdate(from, next)]);
  }

  function planUnmergeConcept(currentDocs, request, now, writer, producer) {
    var cx = checkContext(now, writer, producer); if (cx) return cx;
    request = request || {};
    var concept = currentDocs && currentDocs.concept;
    var cc = checkCurrentConcept(concept, request.userId, 'concept'); if (cc) return cc;
    if (concept.mergedInto === null) return fail('INVALID_MERGE', 'concept.mergedInto');
    var reason = normalizeReason(request.reason); if (!reason.ok) return fail('INVALID_VALUE', 'reason');
    if (concept.history.length + 1 > L.MAX_CONCEPT_HISTORY_ENTRIES) return fail('CAPACITY_EXCEEDED', 'concept');
    var eventId = idSupply(request.ids).take('event'); if (!eventId) return fail('ID_EXHAUSTED', 'eventIds');
    var next = nextConcept(concept, now);
    next.mergedInto = null;
    next.history.push(conceptHistory('UNMERGED', eventId, now, writer, producer, { into: concept.mergedInto, reason: reason.value }));
    var e = checked([next]); if (e) return e;
    return done([], [conceptUpdate(concept, next)]);
  }

  var API = {
    VERSION: USER_KNOWLEDGE_TRANSITIONS_VERSION,
    planCreateRecord: planCreateRecord,
    planPromoteRecord: planPromoteRecord,
    planRetractRecord: planRetractRecord,
    planArchiveRecord: planArchiveRecord,
    planAppendEvidence: planAppendEvidence,
    planEvidenceAvailability: planEvidenceAvailability,
    planAddConfound: planAddConfound,
    planRecordConfoundCheck: planRecordConfoundCheck,
    planSetConfidence: planSetConfidence,
    planRaiseSafetyFlag: planRaiseSafetyFlag,
    planSupersede: planSupersede,
    planCorrectInferredKnowledge: planCorrectInferredKnowledge,
    planCreateConcept: planCreateConcept,
    planAddConceptLabel: planAddConceptLabel,
    planRemoveConceptLabel: planRemoveConceptLabel,
    planMergeConcept: planMergeConcept,
    planUnmergeConcept: planUnmergeConcept
  };

  if (typeof window !== 'undefined') { window.UserKnowledgeTransitions = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
