// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation (WP0 Phase E.0.2d coordinator)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §07-§26.
//
// Exclusive responsibility: one bounded, off-turn consolidation pass — learning consent, A3 source
// eligibility, bounded observation reads through the injected Observation Port, Typed Memory and
// User Knowledge ownership, owner concept resolution, Safety exclusion, bounded presentation, one
// interpreter call, the deterministic gate, and execution of admitted operations through the
// injected User Knowledge store (configured by the host with writer authority SERVER and producer
// e02d.consolidation). E.0.2d discovers and formulates FITME-inferred candidates only: it never
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
    if (!Interpreter.configure({ modelTransport: d.modelTransport, timeoutMs: d.timeoutMs })) return { status: 'NOT_CONFIGURED' };
    deps = {
      store: d.store, port: d.port, now: d.now, consent: d.isLearningConsentGranted, consentState: d.getConsentState,
      userId: d.userId, observationSources: d.observationSources.slice(), referenceSource: d.referenceSource
    };
    return { status: 'CONFIGURED' };
  }

  function result(status, extra) {
    return Object.freeze(Object.assign({ status: status, sourcesRead: Object.freeze([]), observationsPresented: 0, proposals: Object.freeze([]) }, extra || {}));
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
  function renderObservation(o, obsKey, description) {
    return {
      obsKey: obsKey,
      sourceDescription: description,
      localDate: o.localDate,
      localTime: o.localTime,
      observedAt: o.observedAt === null ? null : CC.epochToIsoUtc(o.observedAt),
      utcOffsetMinutes: o.utcOffsetMinutes,
      segments: o.segments.map(function (s) {
        return s.text !== null ? { segmentId: s.segmentId, authorship: s.authorship, text: s.text } : { segmentId: s.segmentId, authorship: s.authorship, data: copy(s.data) };
      })
    };
  }
  function presentableSegments(o) {
    return o.segments.filter(function (s) { return s.authorship !== 'FITME_AUTHORED'; });
  }

  function byRecency(idKey) {
    return function (a, b) { return (b.updatedAt - a.updatedAt) || (a[idKey] < b[idKey] ? -1 : (a[idKey] > b[idKey] ? 1 : 0)); };
  }
  function renderRecord(r) {
    var rel = r.relationDescription;
    return {
      recordId: r.recordId, status: r.status, evidenceClass: r.evidenceClass, temporality: r.temporality,
      factors: r.factors.map(function (f) { return { conceptId: f.conceptId, role: f.role, valueDescription: f.valueDescription }; }),
      relationDescription: rel.length > L.PRESENTED_RELATION_MAX_CHARS ? rel.slice(0, L.PRESENTED_RELATION_MAX_CHARS) : rel
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

    // concept/record block bound: drop least-recent FITME records, then unreferenced concepts
    var renderConcept = function (id) { return { conceptId: id, rootConceptId: rootMap[id], labels: conceptMap[id].labels.slice(0, L.PRESENTED_LABELS_MAX) }; };
    var blockSize = function () { return JSON.stringify(presentedIds.map(renderConcept)).length + JSON.stringify(fitme.map(renderRecord)).length; };
    while (blockSize() > L.PRESENTED_BLOCK_MAX_CHARS && fitme.length) fitme.pop();
    var needed = function (id) {
      return fitme.some(function (r) { return r.conceptIds.indexOf(id) !== -1; }) ||
        references.some(function (x) { return x.type === 'USER_KNOWLEDGE' && x.record.conceptIds.indexOf(id) !== -1; });
    };
    for (var ci = presentedIds.length - 1; ci >= 0 && blockSize() > L.PRESENTED_BLOCK_MAX_CHARS; ci--) {
      if (!needed(presentedIds[ci])) presentedIds.splice(ci, 1);
    }

    // obsKeys and gate context
    var obsCtx = {};
    var renderedObs = kept.map(function (ob, k) {
      var key = 'o' + (k + 1);
      obsCtx[key] = {
        ref: copy(ob.ref), refId: CC.refIdOf(ob.ref), observedAt: ob.observedAt,
        userTexts: ob.segments.filter(function (s) { return s.authorship === 'USER_AUTHORED' && s.text !== null; }).map(function (s) { return s.text; })
      };
      return renderObservation(ob, key, descriptorOf[ob.sourceId].description);
    });
    var refCtx = {};
    var renderedRefs = references.map(function (x, k) {
      var key = 'u' + (k + 1);
      if (x.type === 'USER_KNOWLEDGE') {
        refCtx[key] = {
          type: 'USER_KNOWLEDGE', recordRef: { kind: 'USER_KNOWLEDGE_RECORD', ref: x.record.recordId },
          roots: x.record.conceptIds.map(function (id) { return rootMap[id]; }), texts: recordTexts(x.record),
          claimedRefIds: x.record.supportingRefIds.slice()
        };
        return { uKey: key, factors: renderRecord(x.record).factors, relationDescription: x.record.relationDescription };
      }
      refCtx[key] = {
        type: 'TYPED_MEMORY', recordRef: copy(x.tm.recordRef), roots: [], texts: segmentTexts(x.tm.segments),
        claimedRefIds: x.tm.claimedObservationRefs.map(CC.refIdOf)
      };
      return { uKey: key, segments: renderObservation({ segments: x.tm.segments, localDate: null, localTime: null, observedAt: null, utcOffsetMinutes: null }, key, null).segments };
    });
    var fitmeById = {};
    fitme.forEach(function (r) { fitmeById[r.recordId] = r; });
    var ownedRefIds = {};
    Object.keys(ownership.owned).forEach(function (id) { ownedRefIds[id] = true; });
    Object.keys(typedMemoryOwned).forEach(function (id) { ownedRefIds[id] = true; });
    var ctx = {
      observations: obsCtx,
      presentedConcepts: presentedIds.map(function (id) { return { conceptId: id, labels: conceptMap[id].labels.slice() }; }),
      rootOf: function (id) { return has(rootMap, id) ? rootMap[id] : ('\u0000unresolved\u0000' + id); },
      fitmeRecords: fitmeById,
      references: refCtx,
      userStatedStructures: ukRefs.filter(function (r) { return references.some(function (x) { return x.record === r; }); }).concat(ownership.owners),
      ownedRefIds: ownedRefIds,
      ownersByRefId: ownersByRefId
    };

    // 9 — one interpreter call
    stage.status = 'INTERPRETER_FAILED';
    var interpreted = await Interpreter.interpret({
      observations: renderedObs,
      concepts: presentedIds.map(renderConcept),
      records: fitme.map(renderRecord),
      userStated: renderedRefs
    });
    if (!interpreted || interpreted.status !== 'OK') {
      return result('INTERPRETER_FAILED', { sourcesRead: Object.freeze(sourceIds), observationsPresented: renderedObs.length });
    }

    // 10 — gate, then execute admitted proposals in output order
    stage.status = 'PARTIAL';
    stage.writesPossible = true;
    var verdicts = Gate.evaluate(interpreted.proposals, ctx);
    var passNewIds = {};
    var outcomes = [];
    for (var v = 0; v < verdicts.length; v++) {
      var verdict = verdicts[v];
      if (!verdict.admitted) {
        outcomes.push({ index: verdict.index, operation: verdict.operation, outcome: verdict.outcome, code: verdict.code, recordIds: [] });
        continue;
      }
      outcomes.push(await execute(verdict, passNewIds));
    }
    var anyFailed = outcomes.some(function (x) { return x.outcome === 'ADMITTED_FAILED'; });
    return result(anyFailed ? 'PARTIAL' : 'COMPLETED', {
      sourcesRead: Object.freeze(sourceIds),
      observationsPresented: renderedObs.length,
      proposals: Object.freeze(outcomes.map(function (x) { return Object.freeze(Object.assign({}, x, { recordIds: Object.freeze(x.recordIds) })); }))
    });
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
  async function execute(verdict, passNewIds) {
    var plan = verdict.plan;
    var out = { index: verdict.index, operation: plan.operation, outcome: 'ADMITTED_FAILED', code: 'STORE_FAILED', recordIds: [] };
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
    var stage = { status: 'INVALID_REQUEST', writesPossible: false };
    try {
      return await runPassInner(request, stage);
    } catch (e) {
      return result(stage.writesPossible ? 'PARTIAL' : stage.status);
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
