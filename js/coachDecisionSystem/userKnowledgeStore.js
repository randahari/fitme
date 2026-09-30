// ══════════════════════════════════════════════════════════════════
// FitMe — User Knowledge Store (WP0 Phase E.0.2c)
// docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §15.5, §16, §17, §20.
//
// Exclusive responsibility: the configured service over the two logical stores (User Knowledge
// Records, User Knowledge Concepts). Every write runs: consent gate → request shape → bounded
// reads through the injected port → id minting through the port → a pure planner → the
// writer-authority matrix → change-set validation → one atomic port.commit(). Forget and erase
// run through the port's delete operations under the same authority matrix and are never
// consent-gated. Never throws; never retries.
//
// Writer authority (CLIENT = the user-agent side; SERVER = the governed authority boundary,
// wherever it is hosted) is fixed at configure() time by the host's composition root. No
// operation accepts a writer, a source override, an initial status or a permission-shaped
// argument. The port knows nothing about authority. No platform, vendor or model dependency.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;
  var T = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeTransitions.js')
    : window.UserKnowledgeTransitions;

  var USER_KNOWLEDGE_STORE_VERSION = '1.0.0';
  var L = C.LIMITS;

  var PORT_FUNCTIONS = Object.freeze(['newId', 'getRecords', 'getConcepts', 'queryRecordsByConcepts', 'queryRecentConcepts', 'queryConceptsMergedInto', 'commit', 'deleteRecord', 'deleteConcept', 'deleteRecordsBySources', 'deleteAll']);

  var deps = null;

  function result(status, extra) { var r = { status: status }; if (extra) { Object.keys(extra).forEach(function (k) { r[k] = extra[k]; }); } return Object.freeze(r); }
  function rejected(code, path) { return result('REJECTED', { code: code, path: path || '' }); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isFitmeSource(s) { return C.FITME_SOURCES.indexOf(s) !== -1; }

  function configure(injected) {
    deps = null;
    var d = injected || {};
    if (!d.port || typeof d.port !== 'object') return result('NOT_CONFIGURED');
    for (var i = 0; i < PORT_FUNCTIONS.length; i++) {
      if (typeof d.port[PORT_FUNCTIONS[i]] !== 'function') return result('NOT_CONFIGURED');
    }
    if (typeof d.now !== 'function') return result('NOT_CONFIGURED');
    if (C.WRITER_AUTHORITIES.indexOf(d.writerAuthority) === -1) return result('NOT_CONFIGURED');
    if (typeof d.isLearningConsentGranted !== 'function') return result('NOT_CONFIGURED');
    if (!C.isId(d.userId)) return result('NOT_CONFIGURED');
    if (!C.isProducer(d.producer) || !C.isProducer(d.producerVersion)) return result('NOT_CONFIGURED');
    deps = {
      port: d.port,
      now: d.now,
      writer: d.writerAuthority,
      consent: d.isLearningConsentGranted,
      userId: d.userId,
      producer: { producer: d.producer, producerVersion: d.producerVersion }
    };
    return result('CONFIGURED');
  }

  function consentGranted() {
    try { return deps.consent() === true; } catch (e) { return false; }
  }
  function nowValue() {
    var t;
    try { t = deps.now(); } catch (e) { return null; }
    return (typeof t === 'number' && Number.isInteger(t) && t >= 0) ? t : null;
  }

  // ── request shape (exact keys; unknown keys such as writer/writerAuthority are rejected) ──
  function checkRequest(req, required, optional) {
    if (!C.isPlainObject(req)) return rejected('INVALID_REQUEST', 'request');
    var keys = Object.keys(req);
    for (var i = 0; i < keys.length; i++) {
      if (required.indexOf(keys[i]) === -1 && optional.indexOf(keys[i]) === -1) return rejected('UNKNOWN_FIELD', 'request.' + keys[i]);
    }
    for (var j = 0; j < required.length; j++) {
      if (!has(req, required[j])) return rejected('MISSING_FIELD', 'request.' + required[j]);
    }
    return null;
  }

  // ── bounded port reads (validated) ──
  async function readRecords(recordIds) {
    if (!recordIds.length) return { records: {} };
    if (recordIds.length > L.MAX_READ_BATCH) return { error: rejected('READ_BOUND_EXCEEDED', 'recordIds') };
    var raw;
    try { raw = await deps.port.getRecords(deps.userId, recordIds.slice()); } catch (e) { return { error: result('FAILED') }; }
    if (!Array.isArray(raw)) return { error: result('FAILED') };
    var out = {};
    for (var i = 0; i < raw.length; i++) {
      var v = C.validateRecord(raw[i]);
      if (!v.ok || raw[i].userId !== deps.userId) return { error: rejected('STORED_DOCUMENT_INVALID', v.path) };
      out[raw[i].recordId] = raw[i];
    }
    return { records: out };
  }
  async function readConcepts(conceptIds) {
    var unique = conceptIds.filter(function (id, i) { return conceptIds.indexOf(id) === i; });
    if (!unique.length) return { concepts: {} };
    if (unique.length > L.MAX_READ_BATCH) return { error: rejected('READ_BOUND_EXCEEDED', 'conceptIds') };
    var raw;
    try { raw = await deps.port.getConcepts(deps.userId, unique); } catch (e) { return { error: result('FAILED') }; }
    if (!Array.isArray(raw)) return { error: result('FAILED') };
    var out = {};
    for (var i = 0; i < raw.length; i++) {
      var v = C.validateConcept(raw[i]);
      if (!v.ok || raw[i].userId !== deps.userId) return { error: rejected('STORED_DOCUMENT_INVALID', v.path) };
      out[raw[i].conceptId] = raw[i];
    }
    return { concepts: out };
  }

  function mintIds(counts) {
    var ids = { recordId: null, eventIds: [], confoundIds: [], conceptIds: [] };
    try {
      if (counts.record) ids.recordId = deps.port.newId('record');
      for (var e = 0; e < (counts.event || 0); e++) ids.eventIds.push(deps.port.newId('event'));
      for (var f = 0; f < (counts.confound || 0); f++) ids.confoundIds.push(deps.port.newId('confound'));
      for (var c = 0; c < (counts.concept || 0); c++) ids.conceptIds.push(deps.port.newId('concept'));
    } catch (err) { return null; }
    var all = [ids.recordId].concat(ids.eventIds, ids.confoundIds, ids.conceptIds).filter(function (x) { return x !== null; });
    for (var i = 0; i < all.length; i++) { if (!C.isId(all[i])) return null; }
    return ids;
  }

  // ── §16.2 authority matrix, applied to the complete change set ──
  function sourceWritableBy(writer, source) {
    return writer === 'CLIENT' ? source === 'user_stated' : isFitmeSource(source);
  }
  function authorizeChangeSet(operation, changeSet, currentRecords) {
    var writer = deps.writer;
    for (var i = 0; i < changeSet.creates.length; i++) {
      var doc = changeSet.creates[i];
      if (C.docKind(doc) !== 'record') continue; // concepts: both authorities
      if (doc.source === 'user_stated' && writer === 'SERVER') {
        if (operation !== 'correctInferredKnowledge') return 'AUTHORITY';
        continue;
      }
      if (!sourceWritableBy(writer, doc.source)) return 'AUTHORITY';
    }
    for (var j = 0; j < changeSet.updates.length; j++) {
      var u = changeSet.updates[j];
      if (u.kind !== 'record') continue;
      var prev = currentRecords[u.id];
      if (!prev || prev.source !== u.doc.source) return 'AUTHORITY';
      if (!sourceWritableBy(writer, prev.source)) return 'AUTHORITY';
    }
    return null;
  }

  async function commit(operation, planned, currentRecords) {
    if (!planned.ok) {
      if (planned.code === 'NO_CHANGE') return result('NO_CHANGE');
      return rejected(planned.code, planned.path);
    }
    var authz = authorizeChangeSet(operation, planned.changeSet, currentRecords || {});
    if (authz) return rejected(authz, 'changeSet');
    var v = C.validateChangeSet(planned.changeSet);
    if (!v.ok) return rejected(v.code, v.path);
    var outcome;
    try { outcome = await deps.port.commit(deps.userId, planned.changeSet); } catch (e) { return result('FAILED'); }
    if (!outcome || outcome.status === 'FAILED') return result('FAILED');
    if (outcome.status === 'CONFLICT') return result('CONFLICT');
    if (outcome.status !== 'COMMITTED') return result('FAILED');
    var created = planned.changeSet.creates;
    return result('COMMITTED', {
      ids: Object.freeze({
        recordIds: Object.freeze(created.filter(function (d) { return C.docKind(d) === 'record'; }).map(function (d) { return d.recordId; })),
        conceptIds: Object.freeze(created.filter(function (d) { return C.docKind(d) === 'concept'; }).map(function (d) { return d.conceptId; })),
        updatedIds: Object.freeze(planned.changeSet.updates.map(function (u) { return u.id; }))
      })
    });
  }

  // Wraps an operation: configured check, optional consent gate, never throws.
  // `emptyOnDeny` gives consent-refused reads their empty result (§17 item 3).
  function op(consentGated, body, emptyOnDeny) {
    return async function (request) {
      if (!deps) return result('NOT_CONFIGURED');
      if (consentGated && !consentGranted()) return result('CONSENT_NOT_GRANTED', emptyOnDeny);
      try { return await body(request); } catch (e) { return result('FAILED'); }
    };
  }

  function draftConceptRefs(draft) {
    var refs = [];
    if (!C.isPlainObject(draft)) return refs;
    (Array.isArray(draft.factors) ? draft.factors : []).forEach(function (f) { if (f && typeof f.conceptId === 'string') refs.push(f.conceptId); });
    var ev = C.isPlainObject(draft.evidence) ? draft.evidence : {};
    (Array.isArray(ev.confoundsConsidered) ? ev.confoundsConsidered : []).forEach(function (c) { if (c && typeof c.conceptId === 'string') refs.push(c.conceptId); });
    return refs;
  }
  function confoundCount(draft) {
    var ev = (C.isPlainObject(draft) && C.isPlainObject(draft.evidence)) ? draft.evidence : {};
    return Array.isArray(ev.confoundsConsidered) ? ev.confoundsConsidered.length : 0;
  }
  function newConceptCount(req) { return Array.isArray(req.newConcepts) ? req.newConcepts.length : 0; }
  // Pre-check that needs no read: forbidden creations fail before any port call.
  function preAuthorizeSource(source, operation) {
    if (source === 'user_stated') {
      if (deps.writer === 'CLIENT') return operation === 'correctInferredKnowledge' ? 'AUTHORITY' : null;
      return operation === 'correctInferredKnowledge' ? null : 'AUTHORITY';
    }
    if (isFitmeSource(source)) return deps.writer === 'SERVER' ? null : 'AUTHORITY';
    return 'AUTHORITY';
  }

  // ── records: create ──
  var createRecord = op(true, async function (req) {
    var bad = checkRequest(req, ['draft'], ['newConcepts']); if (bad) return bad;
    if (C.isPlainObject(req.draft) && preAuthorizeSource(req.draft.source, 'createRecord')) return rejected('AUTHORITY', 'draft.source');
    var cr = await readConcepts(draftConceptRefs(req.draft)); if (cr.error) return cr.error;
    var nc = newConceptCount(req);
    var ids = mintIds({ record: true, event: 1 + nc, confound: confoundCount(req.draft), concept: nc });
    if (!ids) return result('FAILED');
    var planned = T.planCreateRecord({ concepts: cr.concepts }, {
      draft: req.draft, newConcepts: req.newConcepts || [], userId: deps.userId, ids: ids
    }, nowValue(), deps.writer, deps.producer);
    return commit('createRecord', planned, {});
  });

  // ── records: single-record transitions and mutations ──
  function singleRecordOp(name, planner, required, optional, eventCount, extraReads) {
    return op(true, async function (req) {
      var bad = checkRequest(req, ['recordId'].concat(required), optional); if (bad) return bad;
      if (!C.isId(req.recordId)) return rejected('INVALID_ID', 'request.recordId');
      var rr = await readRecords([req.recordId]); if (rr.error) return rr.error;
      var record = rr.records[req.recordId];
      if (!record) return rejected('NOT_FOUND', 'request.recordId');
      if (!sourceWritableBy(deps.writer, record.source)) return rejected('AUTHORITY', 'record.source');
      var concepts = {};
      if (extraReads) {
        var cr = await readConcepts(extraReads(req)); if (cr.error) return cr.error;
        concepts = cr.concepts;
      }
      var ids = mintIds({ event: eventCount(req), confound: name === 'addConfound' ? 1 : 0 });
      if (!ids) return result('FAILED');
      var request = { userId: deps.userId, ids: ids };
      required.concat(optional).forEach(function (k) { if (has(req, k)) request[k] = req[k]; });
      var planned = planner({ record: record, concepts: concepts }, request, nowValue(), deps.writer, deps.producer);
      var current = {}; current[record.recordId] = record;
      return commit(name, planned, current);
    });
  }
  function one() { return 1; }

  var promoteRecord = singleRecordOp('promoteRecord', T.planPromoteRecord, [], [], one);
  var retractRecord = singleRecordOp('retractRecord', T.planRetractRecord, [], ['userOriginTurnId'], one);
  var archiveRecord = singleRecordOp('archiveRecord', T.planArchiveRecord, [], ['userOriginTurnId'], one);
  var appendEvidence = singleRecordOp('appendEvidence', T.planAppendEvidence, ['list', 'refs'], [], one);
  var applyEvidenceAvailability = singleRecordOp('applyEvidenceAvailability', T.planEvidenceAvailability, ['results'], [],
    function (req) { return Array.isArray(req.results) ? Math.min(req.results.length, 2 * L.MAX_EVIDENCE_REFS_PER_LIST) : 0; });
  var addConfound = singleRecordOp('addConfound', T.planAddConfound, ['confound'], [], one,
    function (req) { return (C.isPlainObject(req.confound) && typeof req.confound.conceptId === 'string') ? [req.confound.conceptId] : []; });
  var recordConfoundCheck = singleRecordOp('recordConfoundCheck', T.planRecordConfoundCheck, [], [], one);
  var setConfidence = singleRecordOp('setConfidence', T.planSetConfidence, ['confidence'], [], one);
  var raiseSafetyFlag = singleRecordOp('raiseSafetyFlag', T.planRaiseSafetyFlag, [], [], one);

  // ── records: supersession (generic) and the governed correction (§15.4) ──
  // §16.4 item 2: decides from the persisted targets alone (never from caller input).
  function resolvePredecessorAuthority(operation, predecessorIds, predecessors) {
    var governed = operation === 'correctInferredKnowledge';
    if (predecessors.length !== predecessorIds.length) {
      return governed ? rejected('INVALID_USER_CORRECTION', 'request.predecessorIds') : rejected('NOT_FOUND', 'request.predecessorIds');
    }
    var fitme = predecessors.filter(function (p) { return isFitmeSource(p.source); }).length;
    if (governed) return fitme === predecessors.length ? null : rejected('INVALID_USER_CORRECTION', 'request.predecessorIds');
    if (predecessors.some(function (p) { return !sourceWritableBy('CLIENT', p.source) && !sourceWritableBy('SERVER', p.source); })) return rejected('AUTHORITY', 'predecessor.source');
    if (fitme !== 0 && fitme !== predecessors.length) return rejected('MIXED_AUTHORITY_PREDECESSORS', 'request.predecessorIds');
    return predecessors.every(function (p) { return sourceWritableBy(deps.writer, p.source); }) ? null : rejected('AUTHORITY', 'predecessor.source');
  }
  function supersessionOp(name, planner, required) {
    return op(true, async function (req) {
      var bad = checkRequest(req, required, ['confoundsForPredecessors', 'newConcepts']); if (bad) return bad;
      if (name === 'correctInferredKnowledge' && deps.writer !== 'SERVER') return rejected('AUTHORITY', 'writer');
      if (C.isPlainObject(req.successor) && preAuthorizeSource(req.successor.source, name)) return rejected('AUTHORITY', 'successor.source');
      if (!Array.isArray(req.predecessorIds) || req.predecessorIds.length < 1 || req.predecessorIds.length > L.MAX_LINKS) return rejected('INVALID_VALUE', 'request.predecessorIds');
      for (var i = 0; i < req.predecessorIds.length; i++) {
        if (!C.isId(req.predecessorIds[i])) return rejected('INVALID_ID', 'request.predecessorIds[' + i + ']');
        if (req.predecessorIds.indexOf(req.predecessorIds[i]) !== i) return rejected('INVALID_VALUE', 'request.predecessorIds[' + i + ']');
      }
      // §16.4 — the minimum authority-resolution read; authority is decided from the persisted
      // targets before any concept read, id allocation or successor construction.
      var rr = await readRecords(req.predecessorIds); if (rr.error) return rr.error;
      var predecessors = req.predecessorIds.map(function (id) { return rr.records[id]; }).filter(Boolean);
      var unauthorized = resolvePredecessorAuthority(name, req.predecessorIds, predecessors);
      if (unauthorized) return unauthorized;
      var confoundDrafts = Array.isArray(req.confoundsForPredecessors) ? req.confoundsForPredecessors : [];
      var refs = draftConceptRefs(req.successor);
      confoundDrafts.forEach(function (c) { if (c && typeof c.conceptId === 'string') refs.push(c.conceptId); });
      var cr = await readConcepts(refs); if (cr.error) return cr.error;
      var nc = newConceptCount(req);
      var p = predecessors.length;
      var ids = mintIds({
        record: true,
        event: nc + 1 + p * (confoundDrafts.length + 1),
        confound: confoundCount(req.successor) + p * confoundDrafts.length,
        concept: nc
      });
      if (!ids) return result('FAILED');
      var request = {
        predecessorIds: req.predecessorIds,
        successor: req.successor,
        confoundsForPredecessors: confoundDrafts,
        newConcepts: req.newConcepts || [],
        userId: deps.userId,
        ids: ids
      };
      if (name === 'correctInferredKnowledge') request.userOriginTurnId = req.userOriginTurnId;
      var planned = planner({ predecessors: predecessors, concepts: cr.concepts }, request, nowValue(), deps.writer, deps.producer);
      return commit(name, planned, rr.records);
    });
  }
  var supersede = supersessionOp('supersede', T.planSupersede, ['predecessorIds', 'successor']);
  var correctInferredKnowledge = supersessionOp('correctInferredKnowledge', T.planCorrectInferredKnowledge, ['predecessorIds', 'successor', 'userOriginTurnId']);

  // ── concepts ──
  var createConcept = op(true, async function (req) {
    var bad = checkRequest(req, ['labels'], []); if (bad) return bad;
    var ids = mintIds({ concept: 1, event: 1 }); if (!ids) return result('FAILED');
    var planned = T.planCreateConcept({}, { labels: req.labels, userId: deps.userId, ids: ids }, nowValue(), deps.writer, deps.producer);
    return commit('createConcept', planned, {});
  });

  function singleConceptOp(name, planner, required, optional) {
    return op(true, async function (req) {
      var bad = checkRequest(req, ['conceptId'].concat(required), optional); if (bad) return bad;
      if (!C.isId(req.conceptId)) return rejected('INVALID_ID', 'request.conceptId');
      var cr = await readConcepts([req.conceptId]); if (cr.error) return cr.error;
      var concept = cr.concepts[req.conceptId];
      if (!concept) return rejected('NOT_FOUND', 'request.conceptId');
      var ids = mintIds({ event: 1 }); if (!ids) return result('FAILED');
      var request = { userId: deps.userId, ids: ids };
      required.concat(optional).forEach(function (k) { if (has(req, k)) request[k] = req[k]; });
      var planned = planner({ concept: concept }, request, nowValue(), deps.writer, deps.producer);
      return commit(name, planned, {});
    });
  }
  var addConceptLabel = singleConceptOp('addConceptLabel', T.planAddConceptLabel, ['label'], []);
  var removeConceptLabel = singleConceptOp('removeConceptLabel', T.planRemoveConceptLabel, ['label'], []);
  var unmergeConcept = singleConceptOp('unmergeConcept', T.planUnmergeConcept, [], ['reason']);

  var mergeConcept = op(true, async function (req) {
    var bad = checkRequest(req, ['fromConceptId', 'intoConceptId'], ['reason']); if (bad) return bad;
    if (!C.isId(req.fromConceptId) || !C.isId(req.intoConceptId)) return rejected('INVALID_ID', 'request');
    var cr = await readConcepts([req.fromConceptId, req.intoConceptId]); if (cr.error) return cr.error;
    var chain = Object.assign({}, cr.concepts);
    // Bounded walk of the target's merge chain (at most MAX_MERGE_CHAIN_DEPTH single reads).
    var cursor = chain[req.intoConceptId];
    for (var hops = 0; cursor && cursor.mergedInto !== null && !chain[cursor.mergedInto] && hops < L.MAX_MERGE_CHAIN_DEPTH; hops++) {
      var nextRead = await readConcepts([cursor.mergedInto]); if (nextRead.error) return nextRead.error;
      Object.assign(chain, nextRead.concepts);
      cursor = chain[cursor.mergedInto];
    }
    var ids = mintIds({ event: 1 }); if (!ids) return result('FAILED');
    var planned = T.planMergeConcept({
      from: chain[req.fromConceptId],
      into: chain[req.intoConceptId],
      getConcept: function (id) { return chain[id] || null; }
    }, { intoConceptId: req.intoConceptId, reason: req.reason, userId: deps.userId, ids: ids }, nowValue(), deps.writer, deps.producer);
    return commit('mergeConcept', planned, {});
  });

  // ── bounded reads (consent-gated) ──
  var getRecords = op(true, async function (req) {
    var bad = checkRequest(req, ['recordIds'], []); if (bad) return bad;
    if (!Array.isArray(req.recordIds) || req.recordIds.length < 1 || req.recordIds.length > L.MAX_READ_BATCH || !req.recordIds.every(C.isId)) return rejected('INVALID_VALUE', 'request.recordIds');
    var rr = await readRecords(req.recordIds); if (rr.error) return rr.error;
    return result('OK', { records: Object.freeze(req.recordIds.map(function (id) { return rr.records[id]; }).filter(Boolean)) });
  }, { records: Object.freeze([]) });
  var getConcepts = op(true, async function (req) {
    var bad = checkRequest(req, ['conceptIds'], []); if (bad) return bad;
    if (!Array.isArray(req.conceptIds) || req.conceptIds.length < 1 || req.conceptIds.length > L.MAX_READ_BATCH || !req.conceptIds.every(C.isId)) return rejected('INVALID_VALUE', 'request.conceptIds');
    var cr = await readConcepts(req.conceptIds); if (cr.error) return cr.error;
    return result('OK', { concepts: Object.freeze(req.conceptIds.map(function (id) { return cr.concepts[id]; }).filter(Boolean)) });
  }, { concepts: Object.freeze([]) });

  // ── §15.5 user control: forget and erase (never consent-gated; authority still applies) ──
  function deleteOutcome(outcome) {
    if (outcome && outcome.status === 'DELETED') return result('DELETED');
    if (outcome && outcome.status === 'NOT_FOUND') return rejected('NOT_FOUND', '');
    return result('FAILED');
  }
  var forgetRecord = op(false, async function (req) {
    var bad = checkRequest(req, ['recordId'], []); if (bad) return bad;
    if (!C.isId(req.recordId)) return rejected('INVALID_ID', 'request.recordId');
    var rr = await readRecords([req.recordId]); if (rr.error) return rr.error;
    var record = rr.records[req.recordId];
    if (!record) return rejected('NOT_FOUND', 'request.recordId');
    if (!sourceWritableBy(deps.writer, record.source)) return rejected('AUTHORITY', 'record.source');
    var outcome;
    try { outcome = await deps.port.deleteRecord(deps.userId, req.recordId); } catch (e) { return result('FAILED'); }
    return deleteOutcome(outcome);
  });
  var forgetConcept = op(false, async function (req) {
    var bad = checkRequest(req, ['conceptId'], []); if (bad) return bad;
    if (!C.isId(req.conceptId)) return rejected('INVALID_ID', 'request.conceptId');
    var cr = await readConcepts([req.conceptId]); if (cr.error) return cr.error;
    if (!cr.concepts[req.conceptId]) return rejected('NOT_FOUND', 'request.conceptId');
    var users, children;
    try {
      users = await deps.port.queryRecordsByConcepts(deps.userId, { conceptIdsAny: [req.conceptId], statuses: C.STATUSES.slice(), limit: 1 });
      children = await deps.port.queryConceptsMergedInto(deps.userId, req.conceptId, { limit: 1 });
    } catch (e) { return result('FAILED'); }
    if (!Array.isArray(users) || !Array.isArray(children)) return result('FAILED');
    if (users.length || children.length) return rejected('CONCEPT_IN_USE', 'request.conceptId');
    var outcome;
    try { outcome = await deps.port.deleteConcept(deps.userId, req.conceptId); } catch (e2) { return result('FAILED'); }
    return deleteOutcome(outcome);
  });
  var eraseAllForUser = op(false, async function (req) {
    var bad = checkRequest(req === undefined ? {} : req, [], []); if (bad) return bad;
    var outcome;
    try {
      outcome = deps.writer === 'SERVER'
        ? await deps.port.deleteAll(deps.userId)
        : await deps.port.deleteRecordsBySources(deps.userId, ['user_stated']);
    } catch (e) { return result('FAILED'); }
    return deleteOutcome(outcome);
  });

  var API = {
    VERSION: USER_KNOWLEDGE_STORE_VERSION,
    PORT_FUNCTIONS: PORT_FUNCTIONS,
    configure: configure,
    createRecord: createRecord,
    promoteRecord: promoteRecord,
    retractRecord: retractRecord,
    archiveRecord: archiveRecord,
    supersede: supersede,
    correctInferredKnowledge: correctInferredKnowledge,
    appendEvidence: appendEvidence,
    applyEvidenceAvailability: applyEvidenceAvailability,
    addConfound: addConfound,
    recordConfoundCheck: recordConfoundCheck,
    setConfidence: setConfidence,
    raiseSafetyFlag: raiseSafetyFlag,
    createConcept: createConcept,
    addConceptLabel: addConceptLabel,
    removeConceptLabel: removeConceptLabel,
    mergeConcept: mergeConcept,
    unmergeConcept: unmergeConcept,
    getRecords: getRecords,
    getConcepts: getConcepts,
    forgetRecord: forgetRecord,
    forgetConcept: forgetConcept,
    eraseAllForUser: eraseAllForUser
  };

  if (typeof window !== 'undefined') { window.UserKnowledgeStore = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
