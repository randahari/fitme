// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation (WP0 Phase E.0.2d coordinator)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md (v1.1) §07-§27.
//
// Exclusive responsibility: one bounded, off-turn consolidation pass (§13) — learning consent, A3
// source eligibility, bounded observation reads through the injected Observation Port, Typed Memory
// and User Knowledge ownership, owner concept resolution, Safety exclusion, bounded presentation under
// pass-local keys (§14.4), the Generator call, the deterministic pre-verification gate, the Verifier
// call only when at least one plan exists, deterministic post-verification authorization, and
// execution of exactly the authorized plans through the injected User Knowledge store (configured by
// the host with writer authority SERVER and producer e02d.consolidation). At most two model calls. E.0.2d discovers and formulates FITME-inferred candidates only: it never
// assesses confidence, judges confounds, promotes, expires, retrieves knowledge for reasoning,
// prompts the user or touches a user-stated record.
//
// Testable-not-live (§06, §29): no production caller, scheduler or shell wiring exists; this module
// is Node-only, not script-tagged, not cached and not configured by js/app.js. The pass-local
// concept map (§14.2) and every read below live only for one pass and are never persisted.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CC = (typeof module !== 'undefined' && module.exports)
    ? require('./consolidationContract.js')
    : window.ConsolidationContract;
  var Interpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./consolidationInterpreter.js')
    : window.ConsolidationInterpreter;
  var Verifier = (typeof module !== 'undefined' && module.exports)
    ? require('./consolidationVerifier.js')
    : window.ConsolidationVerifier;
  var Gate = (typeof module !== 'undefined' && module.exports)
    ? require('./consolidationGate.js')
    : window.ConsolidationGate;
  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;
  var EligibilityPolicy = (typeof module !== 'undefined' && module.exports)
    ? require('./eligibilityPolicy.js')
    : window.EligibilityPolicy;

  var CONSOLIDATION_VERSION = '1.0.0';
  var L = CC.LIMITS;
  var UL = C.LIMITS;
  var STORE_FUNCTIONS = ['createRecord', 'appendEvidence', 'supersede', 'queryRecordsBySupportingRefs', 'queryRecentConcepts', 'queryRecordsByConcepts', 'getConcepts'];
  var PORT_FUNCTIONS = ['readObservations', 'readOwnershipClaims', 'readUserStatedReferences'];
  var PRESENTED_STATUSES = ['candidate', 'active'];

  var deps = null;

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function copy(v) {
    if (Array.isArray(v)) return v.map(copy);
    if (v !== null && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = copy(v[k]); }); return o; }
    return v;
  }

  // §09 / A3 §04.3 — the frozen declaration must be well-formed for the single eligibility policy
  // (its breadth tier is validated by that policy) and must keep NOT_AUTHORIZED (A3 §07.2).
  function isValidConsumerDeclaration(d) {
    if (!C.isPlainObject(d)) return false;
    if (d.consumerType !== 'GOVERNED_BACKGROUND_PROCESS' || d.sensitiveContextAccessPolicy !== 'NOT_AUTHORIZED') return false;
    return EligibilityPolicy.eligible({ sensitivityTier: 'STANDARD', consentScope: null }, d, {}) === true;
  }

  // §11 item 1 — configuration. Every dependency is injected by the host composition root.
  function configure(injected) {
    deps = null;
    var d = injected || {};
    if (!isValidConsumerDeclaration(CC.CONSUMER_DECLARATION)) return { status: 'NOT_CONFIGURED' };
    if (!C.isPlainObject(d.store) || !STORE_FUNCTIONS.every(function (f) { return typeof d.store[f] === 'function'; })) return { status: 'NOT_CONFIGURED' };
    if (!C.isPlainObject(d.port) || !PORT_FUNCTIONS.every(function (f) { return typeof d.port[f] === 'function'; })) return { status: 'NOT_CONFIGURED' };
    if (typeof d.modelTransport !== 'function' || typeof d.now !== 'function') return { status: 'NOT_CONFIGURED' };
    if (typeof d.isLearningConsentGranted !== 'function' || typeof d.getConsentState !== 'function') return { status: 'NOT_CONFIGURED' };
    if (!C.isId(d.userId) || !Array.isArray(d.observationSources)) return { status: 'NOT_CONFIGURED' };
    if (!(d.referenceSource === null || C.isPlainObject(d.referenceSource))) return { status: 'NOT_CONFIGURED' };
    if (d.verifierModel !== undefined && !(typeof d.verifierModel === 'string' && d.verifierModel.length)) return { status: 'NOT_CONFIGURED' };
    // Both model stages use the same injected transport, each with its own body and bounds (§08, §27).
    if (!Interpreter.configure({ modelTransport: d.modelTransport, timeoutMs: d.timeoutMs })) return { status: 'NOT_CONFIGURED' };
    if (!Verifier.configure({ modelTransport: d.modelTransport, timeoutMs: d.verifierTimeoutMs, model: d.verifierModel })) return { status: 'NOT_CONFIGURED' };
    deps = {
      store: d.store, port: d.port, now: d.now, consent: d.isLearningConsentGranted, consentState: d.getConsentState,
      userId: d.userId, observationSources: d.observationSources.slice(), referenceSource: d.referenceSource
    };
    return { status: 'CONFIGURED' };
  }

  function result(status, extra) {
    return Object.freeze(Object.assign({ status: status, sourcesRead: Object.freeze([]), observationsPresented: 0, modelCalls: 0, proposals: Object.freeze([]) }, extra || {}));
  }

  // §11 item 3 — eligibility by the single A3 policy; never by consumer or source identity.
  function isEligible(desc, consentState, kinds) {
    if (!CC.isValidDescriptor(desc) || desc.protectedSource !== false || kinds.indexOf(desc.evidenceRefKind) === -1) return false;
    return EligibilityPolicy.computeEligibility(desc, CC.CONSUMER_DECLARATION, consentState).reasoningAccessAuthorized === true;
  }

  function validWindow(w) {
    return C.isPlainObject(w) && Object.keys(w).length === 2 && Number.isInteger(w.fromEpochMs) && Number.isInteger(w.toEpochMs) &&
      w.fromEpochMs >= 0 && w.fromEpochMs <= w.toEpochMs && (w.toEpochMs - w.fromEpochMs) <= L.WINDOW_MAX_DAYS * L.DAY_MS;
  }

  // ── concepts: pass-local map, bounded reads, merge resolution ──
  // Reads the ids absent from the map in batches of MAX_READ_BATCH; every requested id must come back.
  async function readConceptsInto(map, ids) {
    var missing = ids.filter(function (id, i) { return !has(map, id) && ids.indexOf(id) === i; });
    for (var i = 0; i < missing.length; i += UL.MAX_READ_BATCH) {
      var batch = missing.slice(i, i + UL.MAX_READ_BATCH);
      var r = await deps.store.getConcepts({ conceptIds: batch });
      if (!r || r.status !== 'OK' || !Array.isArray(r.concepts)) return false;
      r.concepts.forEach(function (c) { map[c.conceptId] = c; });
      if (!batch.every(function (id) { return has(map, id); })) return false;
    }
    return true;
  }
  // Follows mergedInto targets absent from the map for at most MAX_MERGE_CHAIN_DEPTH levels.
  async function followChains(map, startIds) {
    for (var level = 0; level < UL.MAX_MERGE_CHAIN_DEPTH; level++) {
      var targets = [];
      startIds.forEach(function (id) {
        var cur = map[id];
        var guard = 0;
        while (cur && cur.mergedInto !== null && has(map, cur.mergedInto) && guard++ <= UL.MAX_MERGE_CHAIN_DEPTH) cur = map[cur.mergedInto];
        if (cur && cur.mergedInto !== null && !has(map, cur.mergedInto) && targets.indexOf(cur.mergedInto) === -1) targets.push(cur.mergedInto);
      });
      if (!targets.length) return true;
      if (!(await readConceptsInto(map, targets))) return false;
    }
    return true;
  }
  function rootIn(map, id) {
    return C.resolveConceptRoot(id, function (cid) { return has(map, cid) ? map[cid] : null; });
  }

  // §23.1 — User Knowledge ownership: bounded covering procedure over the presented refIds.
  async function determineOwnership(refIds) {
    var owned = {};
    var owners = {};
    var Q = refIds.slice().sort();
    for (var i = 0; i < Q.length; i += UL.MAX_QUERY_REF_IDS) {
      var pending = Q.slice(i, i + UL.MAX_QUERY_REF_IDS);
      while (pending.length) {
        var r = await deps.store.queryRecordsBySupportingRefs({
          refIdsAny: pending.slice(), sources: ['user_stated'], statuses: CC.OWNER_STATUSES.slice(), limit: UL.MAX_QUERY_LIMIT
        });
        if (!r || r.status !== 'OK' || !Array.isArray(r.records)) return null;
        var progressed = false;
        r.records.forEach(function (rec) {
          owners[rec.recordId] = rec;
          rec.supportingRefIds.forEach(function (id) {
            if (pending.indexOf(id) !== -1 && !owned[id]) { owned[id] = true; progressed = true; }
          });
        });
        if (r.records.length < UL.MAX_QUERY_LIMIT) break;
        if (!progressed) return null; // impossible with a conforming store; fail closed
        pending = pending.filter(function (id) { return !owned[id]; });
      }
    }
    return { owned: owned, owners: Object.keys(owners).sort().map(function (k) { return owners[k]; }) };
  }

  // §14.1 — observation rendering (data only). FITME-authored segments are never presented (E3).
  // Observation-level time fields are always rendered (null when unknown); the optional segment-level
  // time fields are rendered only when non-null.
  var SEGMENT_TIME_KEYS = ['localDate', 'localTime', 'utcOffsetMinutes'];
  function renderSegment(s) {
    var out = s.text !== null ? { segmentId: s.segmentId, authorship: s.authorship, text: s.text } : { segmentId: s.segmentId, authorship: s.authorship, data: copy(s.data) };
    SEGMENT_TIME_KEYS.forEach(function (k) { var v = CC.segmentTime(s, k); if (v !== null) out[k] = v; });
    return out;
  }
  function renderObservation(o, obsKey, description) {
    return {
      obsKey: obsKey,
      sourceDescription: description,
      localDate: o.localDate,
      localTime: o.localTime,
      observedAt: o.observedAt === null ? null : CC.epochToIsoUtc(o.observedAt),
      utcOffsetMinutes: o.utcOffsetMinutes,
      segments: o.segments.map(renderSegment)
    };
  }
  // §14.1 — the gate context of one presented observation: structural time at observation and
  // segment level, each segment's authorship and text, and the user-authored texts for E2/U6.
  function observationContext(ob) {
    return {
      ref: copy(ob.ref), refId: CC.refIdOf(ob.ref), observedAt: ob.observedAt, localDate: ob.localDate, localTime: ob.localTime, utcOffsetMinutes: ob.utcOffsetMinutes,
      segments: ob.segments.map(function (s) {
        return { segmentId: s.segmentId, authorship: s.authorship, text: s.text, localDate: CC.segmentTime(s, 'localDate'), localTime: CC.segmentTime(s, 'localTime'), utcOffsetMinutes: CC.segmentTime(s, 'utcOffsetMinutes') };
      }),
      userTexts: ob.segments.filter(function (s) { return s.authorship === 'USER_AUTHORED' && s.text !== null; }).map(function (s) { return s.text; })
    };
  }
  function presentableSegments(o) {
    return o.segments.filter(function (s) { return s.authorship !== 'FITME_AUTHORED'; });
  }

  function byRecency(idKey) {
    return function (a, b) { return (b.updatedAt - a.updatedAt) || (a[idKey] < b[idKey] ? -1 : (a[idKey] > b[idKey] ? 1 : 0)); };
  }
  // §14.2 — a presented FITME-sourced record, under its pass-local record key and with concept keys.
  // No durable recordId or conceptId and no confidence is ever presented.
  function renderRecord(r, recordKey, conceptKeyOf) {
    var rel = r.relationDescription;
    return {
      recordKey: recordKey, status: r.status, evidenceClass: r.evidenceClass, temporality: r.temporality,
      factors: r.factors.map(function (f) { return { conceptKey: conceptKeyOf(f.conceptId), role: f.role, valueDescription: f.valueDescription }; }),
      relationDescription: rel.length > L.PRESENTED_RELATION_MAX_CHARS ? rel.slice(0, L.PRESENTED_RELATION_MAX_CHARS) : rel
    };
  }
  // §14.4 — deterministic concept keys: presented concepts first, in presentation order, then any root
  // they resolve to that is not itself presented (rendered, but never resolvable by the gate).
  function conceptKeyMap(presentedIds, rootMap) {
    var ids = presentedIds.slice();
    presentedIds.forEach(function (id) { var root = rootMap[id]; if (root !== undefined && ids.indexOf(root) === -1) ids.push(root); });
    var keyOf = {};
    ids.forEach(function (id, i) { keyOf[id] = CC.passKey(CC.KEY_PREFIXES.concept, i); });
    return keyOf;
  }
  // §15.4 — a target rendered from trusted stored state, for the Verifier.
  function renderTarget(r, recordKey, labelsOf) {
    return {
      recordKey: recordKey,
      factors: r.factors.map(function (f) { return { labels: labelsOf(f.conceptId), role: f.role, valueDescription: f.valueDescription }; }),
      relationDescription: r.relationDescription, evidenceClass: r.evidenceClass, temporality: r.temporality
    };
  }
  // §15.4 — one verification item rendered from a plan (never from the Generator's raw text).
  function renderItem(plan, itemKey, labelsOf) {
    if (plan.operation === 'APPEND_EVIDENCE') {
      return { item: itemKey, operation: plan.operation, claim: null, supporting: null, contradicting: null, target: plan.targetKey, list: plan.list, observations: plan.observations.slice() };
    }
    var c = plan.claim;
    return {
      item: itemKey, operation: plan.operation,
      claim: {
        factors: c.factors.map(function (f) {
          var out = f.conceptId !== null ? { labels: labelsOf(f.conceptId) } : { newConceptLabel: f.newConceptLabel };
          out.role = f.role; out.valueText = f.valueText; out.byReference = f.byReference;
          return out;
        }),
        relationText: c.relationText, evidenceClass: c.evidenceClass, temporality: c.temporality, grounding: copy(c.grounding)
      },
      supporting: c.supporting.slice(), contradicting: c.contradicting.slice(),
      target: plan.operation === 'SUPERSEDE' ? plan.targetKey : null, list: null, observations: null
    };
  }
  function recordTexts(r) {
    return [r.relationDescription].concat(r.factors.map(function (f) { return f.valueDescription; }).filter(function (v) { return v !== null; }));
  }
  function segmentTexts(segments) {
    var out = [];
    segments.forEach(function (s) {
      if (s.text !== null) out.push(s.text);
      else s.data.forEach(function (e) { out.push(e.label); if (typeof e.value === 'string') out.push(e.value); });
    });
    return out;
  }

  async function runPassInner(request, stage) {
    // 1 — request
    stage.status = 'INVALID_REQUEST';
    if (!C.isPlainObject(request) || Object.keys(request).length !== 2 || !C.isId(request.passId) || !validWindow(request.window)) return result('INVALID_REQUEST');
    // 2 — learning consent (authorizes what E.0.2d persists; never a source)
    var granted = false;
    try { granted = deps.consent() === true; } catch (e) { granted = false; }
    if (!granted) return result('CONSENT_NOT_GRANTED');
    // 3 — A3 source eligibility; authorization is evaluated silently and never requested (§11 item 4)
    var consentState = null;
    try { consentState = deps.consentState(); } catch (e) { consentState = null; }
    var sources = deps.observationSources.filter(function (d) { return isEligible(d, consentState, CC.V1_OBSERVATION_REF_KINDS); });
    var referenceEligible = deps.referenceSource !== null && isEligible(deps.referenceSource, consentState, ['TYPED_MEMORY_RECORD']);
    if (!sources.length) return result('NO_ELIGIBLE_SOURCE');
    var sourceIds = sources.map(function (s) { return s.sourceId; });
    var descriptorOf = {};
    sources.forEach(function (s) { descriptorOf[s.sourceId] = s; });

    // 4 — bounded observation read (no duplicate store: read directly each pass)
    stage.status = 'OBSERVATION_READ_INVALID';
    var raw = await deps.port.readObservations(deps.userId, { sourceIds: sourceIds.slice(), window: copy(request.window), limit: L.OBS_MAX_PER_PASS });
    if (!Array.isArray(raw) || raw.length > L.OBS_MAX_PER_PASS) return result('OBSERVATION_READ_INVALID');
    var seen = {};
    for (var i = 0; i < raw.length; i++) {
      var o = raw[i];
      if (!CC.isValidObservation(o) || !has(descriptorOf, o.sourceId) || o.ref.kind !== descriptorOf[o.sourceId].evidenceRefKind) return result('OBSERVATION_READ_INVALID');
      var rid = CC.refIdOf(o.ref);
      if (seen[rid]) return result('OBSERVATION_READ_INVALID');
      seen[rid] = true;
    }
    var observations = raw.map(copy).filter(function (ob) { return presentableSegments(ob).length > 0; })
      .map(function (ob) { ob.segments = presentableSegments(ob); return ob; });
    if (!observations.length) return result('NO_OBSERVATIONS', { sourcesRead: Object.freeze(sourceIds) });

    // 5 — Typed Memory ownership: one keyed lookup by sourceTurnId for exactly these refs
    stage.status = 'OWNERSHIP_READ_FAILED';
    var requested = observations.map(function (ob) { return CC.refIdOf(ob.ref); });
    var claims = await deps.port.readOwnershipClaims(deps.userId, { refs: observations.map(function (ob) { return copy(ob.ref); }) });
    if (!Array.isArray(claims) || !claims.every(function (c) { return CC.isValidClaim(c) && requested.indexOf(CC.refIdOf(c.ref)) !== -1; })) return result('OWNERSHIP_READ_FAILED');
    var safetyOwned = {};
    var typedMemoryOwned = {};
    claims.forEach(function (c) {
      if (c.claimant === 'SAFETY_INTAKE') safetyOwned[CC.refIdOf(c.ref)] = true;
      else typedMemoryOwned[CC.refIdOf(c.ref)] = true;
    });
    observations = observations.filter(function (ob) { return !safetyOwned[CC.refIdOf(ob.ref)]; });

    // 6 — presentation bound: whole observations only, within the block bound
    var kept = [];
    var used = 0;
    observations.forEach(function (ob) {
      var size = JSON.stringify(renderObservation(ob, 'o0', descriptorOf[ob.sourceId].description)).length;
      if (used + size <= L.OBS_BLOCK_MAX_CHARS) { kept.push(ob); used += size; }
    });
    if (!kept.length) return result('NO_OBSERVATIONS', { sourcesRead: Object.freeze(sourceIds) });

    // 7 — User Knowledge ownership (covering procedure) and owner concept resolution
    var ownership = await determineOwnership(kept.map(function (ob) { return CC.refIdOf(ob.ref); }));
    if (!ownership) return result('OWNERSHIP_READ_FAILED');
    var conceptMap = {};
    var ownerConceptIds = [];
    ownership.owners.forEach(function (rec) { rec.conceptIds.forEach(function (id) { if (ownerConceptIds.indexOf(id) === -1) ownerConceptIds.push(id); }); });
    if (!(await readConceptsInto(conceptMap, ownerConceptIds))) return result('OWNERSHIP_READ_FAILED');
    if (!(await followChains(conceptMap, ownerConceptIds))) return result('OWNERSHIP_READ_FAILED');
    var rootMap = {};
    for (var oi = 0; oi < ownerConceptIds.length; oi++) {
      var res = rootIn(conceptMap, ownerConceptIds[oi]);
      if (!res.ok) return result('OWNERSHIP_READ_FAILED');
      rootMap[ownerConceptIds[oi]] = res.rootId;
    }
    var ownersByRefId = {};
    var safetyAdjacentOwned = {};
    ownership.owners.forEach(function (rec) {
      rec.supportingRefIds.forEach(function (id) {
        if (!ownership.owned[id]) return;
        (ownersByRefId[id] = ownersByRefId[id] || []).push(rec);
        if (rec.safetyFlag === 'SAFETY_ADJACENT') safetyAdjacentOwned[id] = true;
      });
    });
    kept = kept.filter(function (ob) { return !safetyAdjacentOwned[CC.refIdOf(ob.ref)]; });
    if (!kept.length) return result('NO_OBSERVATIONS', { sourcesRead: Object.freeze(sourceIds) });

    // 8 — presentation of concepts, FITME-sourced records and user-stated references (§14.2-§14.3)
    stage.status = 'STORE_READ_FAILED';
    var cr = await deps.store.queryRecentConcepts({ limit: L.PRESENTED_CONCEPTS_MAX });
    if (!cr || cr.status !== 'OK' || !Array.isArray(cr.concepts)) return result('STORE_READ_FAILED');
    var presentedIds = [];
    cr.concepts.slice().sort(byRecency('conceptId')).forEach(function (c) { conceptMap[c.conceptId] = c; presentedIds.push(c.conceptId); });
    var records = [];
    if (presentedIds.length) {
      var rr = await deps.store.queryRecordsByConcepts({
        conceptIdsAny: presentedIds.slice(0, L.PRESENTED_RECORD_QUERY_CONCEPT_IDS), statuses: PRESENTED_STATUSES.slice(), limit: L.PRESENTED_RECORDS_MAX
      });
      if (!rr || rr.status !== 'OK' || !Array.isArray(rr.records)) return result('STORE_READ_FAILED');
      records = rr.records.filter(function (r) { return PRESENTED_STATUSES.indexOf(r.status) !== -1; }).slice().sort(byRecency('recordId'));
    }
    var extra = [];
    records.forEach(function (r) { r.conceptIds.forEach(function (id) { if (presentedIds.indexOf(id) === -1 && extra.indexOf(id) === -1) extra.push(id); }); });
    if (!(await readConceptsInto(conceptMap, extra))) return result('STORE_READ_FAILED');
    extra.forEach(function (id) { if (presentedIds.length < L.PRESENTED_CONCEPTS_TOTAL_MAX) presentedIds.push(id); });
    if (!(await followChains(conceptMap, presentedIds))) return result('STORE_READ_FAILED');
    presentedIds = presentedIds.filter(function (id) {
      var res2 = rootIn(conceptMap, id);
      if (res2.ok) rootMap[id] = res2.rootId;
      return res2.ok; // §14.2: an unresolvable chain removes the concept from presentation
    });
    records = records.filter(function (r) { return r.conceptIds.every(function (id) { return presentedIds.indexOf(id) !== -1; }); });
    var fitme = records.filter(function (r) { return C.FITME_SOURCES.indexOf(r.source) !== -1; });
    var ukRefs = records.filter(function (r) { return r.source === 'user_stated' && r.status === 'active' && r.safetyFlag === 'STANDARD'; });

    var tmRefs = [];
    if (referenceEligible) {
      stage.status = 'OBSERVATION_READ_INVALID';
      var tr = await deps.port.readUserStatedReferences(deps.userId, { limit: L.PRESENTED_USER_STATED_MAX });
      if (!Array.isArray(tr) || tr.length > L.PRESENTED_USER_STATED_MAX || !tr.every(CC.isValidTypedMemoryReference)) return result('OBSERVATION_READ_INVALID');
      tmRefs = tr.map(copy);
    }
    var references = [];
    ukRefs.forEach(function (r) { references.push({ type: 'USER_KNOWLEDGE', record: r }); });
    tmRefs.forEach(function (t) { references.push({ type: 'TYPED_MEMORY', tm: t }); });
    references = references.slice(0, L.PRESENTED_USER_STATED_MAX);

    // concept/record block bound: drop least-recent FITME records, then unreferenced concepts.
    // Measured on the keyed rendering actually presented (§14.2, §14.4).
    var keyOfFor = function () { return conceptKeyMap(presentedIds, rootMap); };
    var renderConcept = function (keyOf) {
      return function (id) { return { conceptKey: keyOf[id], rootConceptKey: keyOf[rootMap[id]], labels: conceptMap[id].labels.slice(0, L.PRESENTED_LABELS_MAX) }; };
    };
    var renderRecords = function (keyOf) {
      return fitme.map(function (r, i) { return renderRecord(r, CC.passKey(CC.KEY_PREFIXES.record, i), function (id) { return keyOf[id]; }); });
    };
    var blockSize = function () { var k = keyOfFor(); return JSON.stringify(presentedIds.map(renderConcept(k))).length + JSON.stringify(renderRecords(k)).length; };
    while (blockSize() > L.PRESENTED_BLOCK_MAX_CHARS && fitme.length) fitme.pop();
    var needed = function (id) {
      return fitme.some(function (r) { return r.conceptIds.indexOf(id) !== -1; }) ||
        references.some(function (x) { return x.type === 'USER_KNOWLEDGE' && x.record.conceptIds.indexOf(id) !== -1; });
    };
    for (var ci = presentedIds.length - 1; ci >= 0 && blockSize() > L.PRESENTED_BLOCK_MAX_CHARS; ci--) {
      if (!needed(presentedIds[ci])) presentedIds.splice(ci, 1);
    }

    // §14.4 — pass-local key maps for every namespace, and the gate context
    var keyOf = keyOfFor();
    var conceptKeyOf = function (id) { return keyOf[id]; };
    var labelsOf = function (id) { return conceptMap[id] ? conceptMap[id].labels.slice(0, L.PRESENTED_LABELS_MAX) : []; };
    var obsCtx = {};
    var renderedObs = kept.map(function (ob, k) {
      var key = CC.passKey(CC.KEY_PREFIXES.observation, k);
      obsCtx[key] = observationContext(ob);
      return renderObservation(ob, key, descriptorOf[ob.sourceId].description);
    });
    var refCtx = {};
    var renderedRefs = references.map(function (x, k) {
      var key = CC.passKey(CC.KEY_PREFIXES.userStated, k);
      if (x.type === 'USER_KNOWLEDGE') {
        refCtx[key] = {
          type: 'USER_KNOWLEDGE', recordRef: { kind: 'USER_KNOWLEDGE_RECORD', ref: x.record.recordId },
          roots: x.record.conceptIds.map(function (id) { return rootMap[id]; }), texts: recordTexts(x.record),
          claimedRefIds: x.record.supportingRefIds.slice()
        };
        return { uKey: key, factors: renderRecord(x.record, null, conceptKeyOf).factors, relationDescription: x.record.relationDescription };
      }
      refCtx[key] = {
        type: 'TYPED_MEMORY', recordRef: copy(x.tm.recordRef), roots: [], texts: segmentTexts(x.tm.segments),
        claimedRefIds: x.tm.claimedObservationRefs.map(CC.refIdOf)
      };
      return { uKey: key, segments: x.tm.segments.map(renderSegment) };
    });
    var recordCtx = {};
    var recordKeyOf = {};
    fitme.forEach(function (r, i) { var key = CC.passKey(CC.KEY_PREFIXES.record, i); recordCtx[key] = r; recordKeyOf[r.recordId] = key; });
    var conceptKeys = {};
    presentedIds.forEach(function (id) { conceptKeys[keyOf[id]] = id; }); // presented concepts only (§14.4)
    var ownedRefIds = {};
    Object.keys(ownership.owned).forEach(function (id) { ownedRefIds[id] = true; });
    Object.keys(typedMemoryOwned).forEach(function (id) { ownedRefIds[id] = true; });
    var ctx = {
      observations: obsCtx,
      conceptKeys: conceptKeys,
      presentedConcepts: presentedIds.map(function (id) { return { conceptId: id, labels: conceptMap[id].labels.slice() }; }),
      rootOf: function (id) { return has(rootMap, id) ? rootMap[id] : ('\u0000unresolved\u0000' + id); },
      records: recordCtx,
      references: refCtx,
      userStatedStructures: ukRefs.filter(function (r) { return references.some(function (x) { return x.record === r; }); }).concat(ownership.owners),
      ownedRefIds: ownedRefIds,
      ownersByRefId: ownersByRefId
    };
    var base = { sourcesRead: Object.freeze(sourceIds), observationsPresented: renderedObs.length };

    // §13 step 8 — the Generator: one call
    stage.status = 'INTERPRETER_FAILED';
    var modelCalls = 1;
    stage.modelCalls = modelCalls;
    var generated = await Interpreter.interpret({
      observations: renderedObs,
      concepts: presentedIds.map(renderConcept(keyOf)),
      records: renderRecords(keyOf),
      userStated: renderedRefs
    });
    if (!generated || generated.status !== 'OK') return result('INTERPRETER_FAILED', Object.assign({ modelCalls: modelCalls }, base));

    // §13 steps 9-10 — proposal isolation and the pre-verification gate
    var screened = Gate.preVerify(generated.entries, ctx);
    var plans = screened.filter(function (s) { return s.outcome === 'PLAN'; }).map(function (s) { return s.plan; });
    var outcomes = {};
    screened.forEach(function (s) {
      if (s.outcome !== 'PLAN') outcomes[s.index] = { index: s.index, operation: s.operation, outcome: s.outcome, code: s.code, verification: null, recordIds: [] };
    });
    // §13 step 11 — no plan: no Verifier call, no writes
    if (!plans.length) return finish('COMPLETED', outcomes, modelCalls, base);

    // §13 step 12 — the Verifier: one batched call over every plan, rendered from plans and trusted state
    stage.status = 'VERIFIER_FAILED';
    modelCalls = 2;
    stage.modelCalls = modelCalls;
    var targetKeys = [];
    plans.forEach(function (p) { if (p.targetKey && targetKeys.indexOf(p.targetKey) === -1) targetKeys.push(p.targetKey); });
    var verification = await Verifier.verify({
      observations: renderedObs,
      userStated: renderedRefs,
      targets: targetKeys.map(function (k) { return renderTarget(recordCtx[k], k, labelsOf); }),
      items: plans.map(function (p, i) { return renderItem(p, CC.passKey(CC.KEY_PREFIXES.item, i), labelsOf); })
    });

    // §13 step 13 — post-verification authorization (the only grant of execution, §16.5)
    var authorization = Gate.authorizePlans(plans, verification);
    var verifierFailed = !verification || verification.status !== 'OK';

    // §13 step 14 — execute exactly the authorized plans, in output order, after authorization completes
    stage.status = 'PARTIAL';
    stage.writesPossible = true;
    var passNewIds = {};
    for (var di = 0; di < authorization.decisions.length; di++) {
      var d = authorization.decisions[di];
      if (d.outcome !== 'AUTHORIZED' || !authorization.permits(d.plan)) {
        outcomes[d.index] = { index: d.index, operation: d.operation, outcome: 'REJECTED', code: d.code, verification: d.verification, recordIds: [] };
        continue;
      }
      outcomes[d.index] = Object.assign(await execute(d.plan, authorization, passNewIds), { verification: d.verification });
    }
    var anyFailed = Object.keys(outcomes).some(function (k) { return outcomes[k].outcome === 'ADMITTED_FAILED'; });
    return finish(verifierFailed ? 'VERIFIER_FAILED' : (anyFailed ? 'PARTIAL' : 'COMPLETED'), outcomes, modelCalls, base);
  }

  // §13 step 15 — PassResult: ids, closed codes and closed verdict tokens only, in output order.
  function finish(status, outcomes, modelCalls, base) {
    var list = Object.keys(outcomes).map(Number).sort(function (a, b) { return a - b; }).map(function (k) {
      var x = outcomes[k];
      return Object.freeze({ index: x.index, operation: x.operation, outcome: x.outcome, code: x.code, verification: x.verification || null, recordIds: Object.freeze(x.recordIds.slice()) });
    });
    return result(status, Object.assign({ modelCalls: modelCalls, proposals: Object.freeze(list) }, base));
  }

  // §17 — execution through the injected store. Equal new labels within a pass map to one concept.
  function withPassConcepts(plan, passNewIds) {
    var labels = [];
    var keys = [];
    var draft = copy(plan.draft);
    draft.factors = draft.factors.map(function (f) {
      if (!has(f, 'newConcept')) return f;
      var key = plan.newKeys[f.newConcept];
      if (has(passNewIds, key)) return { conceptId: passNewIds[key], role: f.role, valueDescription: f.valueDescription };
      var idx = keys.indexOf(key);
      if (idx === -1) { keys.push(key); labels.push(plan.newConceptLabels[f.newConcept]); idx = keys.length - 1; }
      return { newConcept: idx, role: f.role, valueDescription: f.valueDescription };
    });
    return { draft: draft, newConcepts: labels.map(function (l) { return [l]; }), keys: keys };
  }
  // Executes one plan only if this pass's authorization permits that exact plan object (§16.5). An
  // APPEND writes exactly the plan's verified materialized refs (§16.3 A5).
  async function execute(plan, authorization, passNewIds) {
    var out = { index: plan.index, operation: plan.operation, outcome: 'ADMITTED_FAILED', code: 'STORE_FAILED', recordIds: [] };
    if (!authorization || !authorization.permits(plan)) return Object.assign(out, { outcome: 'REJECTED', code: 'VERIFICATION_UNAVAILABLE' });
    var r;
    try {
      if (plan.operation === 'APPEND_EVIDENCE') {
        r = await deps.store.appendEvidence({ recordId: plan.targetRecordId, list: plan.list, refs: copy(plan.refs) });
        if (r && r.status === 'NO_CHANGE') return Object.assign(out, { outcome: 'NO_CHANGE', code: 'NO_CHANGE' });
        if (r && r.status === 'COMMITTED') return Object.assign(out, { outcome: 'ADMITTED_EXECUTED', code: null, recordIds: [plan.targetRecordId] });
      } else {
        var prepared = withPassConcepts(plan, passNewIds);
        r = plan.operation === 'CREATE'
          ? await deps.store.createRecord({ draft: prepared.draft, newConcepts: prepared.newConcepts })
          : await deps.store.supersede({ predecessorIds: [plan.targetRecordId], successor: prepared.draft, newConcepts: prepared.newConcepts });
        if (r && r.status === 'COMMITTED') {
          (r.ids.conceptIds || []).forEach(function (id, k) { if (k < prepared.keys.length) passNewIds[prepared.keys[k]] = id; });
          return Object.assign(out, { outcome: 'ADMITTED_EXECUTED', code: null, recordIds: r.ids.recordIds.slice() });
        }
      }
    } catch (e) { r = null; }
    return Object.assign(out, { code: (r && typeof r.status === 'string') ? (r.code || r.status) : 'STORE_FAILED' });
  }

  // runPass({passId, window}) → PassResult. Never throws. Carries ids and codes only (§13 step 11).
  async function runPass(request) {
    if (!deps) return result('NOT_CONFIGURED');
    var stage = { status: 'INVALID_REQUEST', writesPossible: false, modelCalls: 0 };
    try {
      return await runPassInner(request, stage);
    } catch (e) {
      return result(stage.writesPossible ? 'PARTIAL' : stage.status, { modelCalls: stage.modelCalls });
    }
  }

  var API = {
    VERSION: CONSOLIDATION_VERSION,
    configure: configure,
    runPass: runPass,
    _internal: { isValidConsumerDeclaration: isValidConsumerDeclaration, determineOwnership: function (ids) { return determineOwnership(ids); } }
  };

  if (typeof window !== 'undefined') { window.Consolidation = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
