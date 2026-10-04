// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation Gate (WP0 Phase E.0.2d)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §16-§24.
//
// Exclusive responsibility: the pure, deterministic admission of every model proposal. A proposal
// is admitted only when every rule holds (G1-G6, C1-C5, A1-A5, S1-S5, E1-E5, U1-U7, §19 concept
// rules); otherwise it is rejected with one closed code and never executed. The gate never
// converts one operation into another, never repairs a proposal and never trusts a model-chosen id
// beyond call-scoped membership. Admitted proposals carry a plan (draft or evidence refs) that the
// coordinator executes through the injected User Knowledge store. No clock, no ids, no I/O, no
// model access.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;
  var CC = (typeof module !== 'undefined' && module.exports)
    ? require('./consolidationContract.js')
    : window.ConsolidationContract;

  var L = CC.LIMITS;
  var MAX_REFS = C.LIMITS.MAX_EVIDENCE_REFS_PER_LIST;

  function reject(code) { return { admitted: false, outcome: 'REJECTED', code: code }; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function unique(arr) { return arr.every(function (v, i) { return arr.indexOf(v) === i; }); }

  // ── shared successor/CREATE checks; returns {error} or {draft, newLabels, sigFactors} ──
  function refsOf(keys, ctx) { return keys.map(function (k) { return ctx.observations[k]; }); }
  function evidenceDrafts(obs) { return obs.map(function (o) { return { kind: o.ref.kind, ref: o.ref.ref, observedAt: o.observedAt }; }); }

  // §19 + G3 — factors. Returns {error} or {factors (contract form), newLabels, newKeys, sigFactors, refIndex}.
  function checkFactors(p, ctx) {
    var presentedKeys = {};
    ctx.presentedConcepts.forEach(function (c) { c.labels.forEach(function (l) { presentedKeys[C.normalizeLabelKey(l)] = true; }); });
    var proposalFactors = [];
    var refIndex = -1;
    for (var i = 0; i < p.factors.length; i++) {
      var f = p.factors[i];
      if ((f.conceptId === null) === (f.newConceptLabel === null)) return { error: 'INVALID_FACTOR' };
      if (f.userStatedRef !== null) refIndex = i;
      var pf = { role: f.role, valueDescription: f.valueText };
      if (f.conceptId !== null) pf.conceptId = f.conceptId;
      else {
        if (presentedKeys[C.normalizeLabelKey(f.newConceptLabel)]) return { error: 'NEW_CONCEPT_SHADOWS_PRESENTED' };
        pf.newConceptLabel = f.newConceptLabel;
      }
      proposalFactors.push(pf);
    }
    var v = C.validateFactorProposal({ factors: proposalFactors }, ctx.presentedConcepts);
    if (!v.ok) return { error: v.code };
    if (v.newConceptLabels.length > L.MAX_NEW_CONCEPTS_PER_PROPOSAL) return { error: 'NEW_CONCEPT_LIMIT' };
    var newKeys = v.newConceptLabels.map(C.normalizeLabelKey);
    var sigFactors = v.factors.map(function (f) {
      return has(f, 'newConcept') ? { newKey: newKeys[f.newConcept], role: f.role } : { conceptId: f.conceptId, role: f.role };
    });
    return { factors: v.factors, newLabels: v.newConceptLabels.slice(), newKeys: newKeys, sigFactors: sigFactors, refIndex: refIndex };
  }

  // §22 E2 / §23.2 U6 — every user text the claim text must not literally restate.
  function userTextsFor(p, cited, reference, ctx) {
    var U = [];
    cited.forEach(function (o) { U.push.apply(U, o.userTexts); });
    var citedIds = {};
    cited.forEach(function (o) { citedIds[o.refId] = true; });
    Object.keys(ctx.references).forEach(function (k) {
      var r = ctx.references[k];
      var named = reference && reference.uKey === k;
      var ownsCited = r.claimedRefIds.some(function (id) { return citedIds[id]; });
      if (named || ownsCited) U.push.apply(U, r.texts);
    });
    cited.forEach(function (o) {
      (ctx.ownersByRefId[o.refId] || []).forEach(function (rec) {
        U.push(rec.relationDescription);
        rec.factors.forEach(function (f) { if (f.valueDescription !== null) U.push(f.valueDescription); });
      });
    });
    return U;
  }

  function successorChecks(p, ctx, fc) {
    // C1
    if (p.appendList !== null || p.relationText === null || p.evidenceClass === null || p.temporality === null) return { error: 'INVALID_OPERATION_SHAPE' };
    // C2
    var n = p.supporting.length;
    if (n < 1) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    if (p.evidenceClass === 'SINGLE_OBSERVATION' && n !== 1) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    if (p.evidenceClass === 'RECURRENCE' && n < 2) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    // C3
    if (p.temporality === 'RECURRING_WINDOW' && p.evidenceClass !== 'RECURRENCE') return { error: 'TEMPORALITY_MISMATCH' };

    var supportingObs = refsOf(p.supporting, ctx);
    var contradictingObs = refsOf(p.contradicting, ctx);
    var reference = null;
    if (fc.refIndex !== -1) {
      var rf = p.factors[fc.refIndex];
      reference = ctx.references[rf.userStatedRef];
      reference = { uKey: rf.userStatedRef, ref: reference };
      // U2 — reference form
      if (rf.valueText !== null) return { error: 'USER_STATED_REFERENCE_INVALID' };
      if (rf.conceptId !== null) {
        if (reference.ref.type === 'USER_KNOWLEDGE' && reference.ref.roots.indexOf(ctx.rootOf(rf.conceptId)) === -1) return { error: 'USER_STATED_REFERENCE_INVALID' };
      } else {
        var labelKey = C.normalizeLabelKey(rf.newConceptLabel);
        var literal = reference.ref.texts.some(function (t) { return C.normalizeLabelKey(t).indexOf(labelKey) !== -1; });
        if (!labelKey || !literal) return { error: 'USER_STATED_REFERENCE_INVALID' };
      }
      // U3 — new relational meaning (structural proxy)
      if (p.factors.length < 2) return { error: 'NO_NEW_MEANING' };
      if (reference.ref.type === 'USER_KNOWLEDGE') {
        var outside = fc.sigFactors.some(function (sf) { return typeof sf.newKey === 'string' || reference.ref.roots.indexOf(ctx.rootOf(sf.conceptId)) === -1; });
        if (!outside) return { error: 'NO_NEW_MEANING' };
      }
    }
    // U4 — independent support (every CREATE and SUPERSEDE successor)
    if (!supportingObs.some(function (o) { return !ctx.ownedRefIds[o.refId]; })) return { error: 'NO_INDEPENDENT_SUPPORT' };
    // U5 — no mirror of a user-stated structure (presented references and every owning record)
    var sig = CC.signature(fc.sigFactors, ctx.rootOf);
    var mirrors = ctx.userStatedStructures.some(function (rec) { return CC.signature(rec.factors, ctx.rootOf) === sig; });
    if (mirrors) return { error: 'MIRRORS_USER_STATED' };
    // E2 / U6 — no literal restatement (normalized text only; no concept resolution)
    var claimTexts = [p.relationText].concat(p.factors.map(function (f) { return f.valueText; }).filter(function (t) { return t !== null; }));
    if (CC.literalOverlap(claimTexts, userTextsFor(p, supportingObs.concat(contradictingObs), reference, ctx), L.LITERAL_OVERLAP_MAX_CHARS)) return { error: 'LITERAL_RESTATEMENT' };

    // §17 — the draft (fields not model-composed are fixed here)
    var supporting = evidenceDrafts(supportingObs);
    if (reference) {
      supporting.push(reference.ref.type === 'USER_KNOWLEDGE'
        ? { kind: 'USER_KNOWLEDGE_RECORD', ref: reference.ref.recordRef.ref, observedAt: null }
        : { kind: 'TYPED_MEMORY_RECORD', ref: reference.ref.recordRef.ref, observedAt: null });
    }
    if (supporting.length > MAX_REFS || contradictingObs.length > MAX_REFS) return { error: 'LIST_TOO_LONG' };
    var draft = {
      factors: fc.factors.map(function (f) {
        var out = { role: f.role, valueDescription: f.valueDescription };
        if (has(f, 'newConcept')) out.newConcept = f.newConcept; else out.conceptId = f.conceptId;
        return out;
      }),
      relationDescription: p.relationText,
      evidenceClass: p.evidenceClass,
      temporality: p.temporality,
      confidence: CC.BOOTSTRAP_CONFIDENCE,
      source: CC.sourceForEvidenceClass(p.evidenceClass),
      safetyFlag: 'STANDARD',
      evidence: { supporting: supporting, contradicting: evidenceDrafts(contradictingObs) }
    };
    var dv = C.validateRecordDraft(draft, fc.newLabels.length);
    if (dv) return { error: dv.code };
    return { draft: draft, sig: sig };
  }

  function contentKeyOf(draft) {
    if (draft.factors.some(function (f) { return has(f, 'newConcept'); })) return null;
    return C.contentKey(C.materializeContent(draft, function () { return null; }));
  }

  function existingRoots(fc, ctx) {
    return fc.sigFactors.filter(function (sf) { return typeof sf.newKey !== 'string'; }).map(function (sf) { return ctx.rootOf(sf.conceptId); });
  }
  function refIdsOn(record) {
    return record.evidence.supporting.concat(record.evidence.contradicting).map(function (r) { return r.refId; });
  }

  // Evaluates one proposal against the pass context. ctx (built by the coordinator):
  //   observations: {obsKey → {ref, refId, observedAt, userTexts}}       presented observations
  //   presentedConcepts: [{conceptId, labels}]                           §19 call-scoped membership
  //   rootOf(conceptId) → root                                           pass-local merge resolution
  //   fitmeRecords: {recordId → record}                                  presented FITME-sourced records
  //   references: {uKey → {type: 'USER_KNOWLEDGE'|'TYPED_MEMORY', recordRef, roots, texts, claimedRefIds}}
  //   userStatedStructures: [record]                                     presented user-stated User Knowledge refs + owning records (U5)
  //   ownedRefIds: {refId → true}; ownersByRefId: {refId → [owning record]}
  function evaluateOne(p, ctx) {
    // G1 — declared restatement and Safety adjacency fail closed on anything but exactly false.
    if (p.restatesUserStatement !== false) return reject('DECLARED_RESTATEMENT');
    if (p.safetyAdjacent !== false) return reject('SAFETY_ADJACENT_PROPOSAL');
    if (CC.OPERATIONS.indexOf(p.operation) === -1 || !Array.isArray(p.factors) || !Array.isArray(p.supporting) || !Array.isArray(p.contradicting)) return reject('INVALID_SHAPE');
    // G2 — cited observations are presented, distinct, and never in both lists
    var all = p.supporting.concat(p.contradicting);
    if (!all.every(function (k) { return typeof k === 'string' && has(ctx.observations, k); })) return reject('UNKNOWN_OBSERVATION');
    if (!unique(p.supporting) || !unique(p.contradicting) || !unique(all)) return reject('INVALID_EVIDENCE');
    // G6 — V1 source scope (PD-D3)
    if (!all.every(function (k) { return CC.V1_OBSERVATION_REF_KINDS.indexOf(ctx.observations[k].ref.kind) !== -1; })) return reject('SOURCE_NOT_IN_SCOPE');
    // U1 — at most one reference, and it must be presented
    var refFactors = p.factors.filter(function (f) { return f && f.userStatedRef !== null && f.userStatedRef !== undefined; });
    if (refFactors.length > 1) return reject('USER_STATED_REFERENCE_INVALID');
    if (refFactors.length === 1 && !has(ctx.references, refFactors[0].userStatedRef)) return reject('USER_STATED_REFERENCE_INVALID');
    // G3 / §19
    var fc = checkFactors(p, ctx);
    if (fc.error) return reject(fc.error);

    if (p.operation === 'APPEND_EVIDENCE') {
      // A1 — a presented FITME-sourced candidate/active record (never user-stated: U7, E1)
      var target = p.targetRecordId !== null && has(ctx.fitmeRecords, p.targetRecordId) ? ctx.fitmeRecords[p.targetRecordId] : null;
      if (!target) return reject('INVALID_TARGET');
      // A2
      if (p.appendList === null || p.relationText !== null || p.evidenceClass !== null || p.temporality !== null) return reject('INVALID_OPERATION_SHAPE');
      if (fc.newLabels.length || fc.refIndex !== -1) return reject('INVALID_OPERATION_SHAPE');
      var chosen = p.appendList === 'supporting' ? p.supporting : p.contradicting;
      var other = p.appendList === 'supporting' ? p.contradicting : p.supporting;
      if (!chosen.length || other.length) return reject('INVALID_OPERATION_SHAPE');
      // A3 — structural identity with merge-resolved roots
      var sig = CC.signature(fc.sigFactors, ctx.rootOf);
      if (CC.signature(target.factors, ctx.rootOf) !== sig) return reject('STRUCTURE_MISMATCH');
      // A4 — unique grounding among presented FITME-sourced records
      var same = Object.keys(ctx.fitmeRecords).filter(function (id) { return CC.signature(ctx.fitmeRecords[id].factors, ctx.rootOf) === sig; });
      if (same.length !== 1 || same[0] !== target.recordId) return reject('AMBIGUOUS_TARGET');
      // A5 — at least one reference not already on the target
      var on = refIdsOn(target);
      var obs = refsOf(chosen, ctx);
      var fresh = obs.filter(function (o) { return on.indexOf(o.refId) === -1; });
      if (!fresh.length) return { admitted: false, outcome: 'NO_CHANGE', code: 'NO_CHANGE' };
      if (target.evidence[p.appendList].length + fresh.length > MAX_REFS) return reject('LIST_TOO_LONG');
      return { admitted: true, plan: { operation: 'APPEND_EVIDENCE', targetRecordId: target.recordId, list: p.appendList, refs: evidenceDrafts(fresh) } };
    }

    var s = successorChecks(p, ctx, fc);
    if (s.error) return reject(s.error);

    if (p.operation === 'CREATE') {
      if (p.targetRecordId !== null) return reject('INVALID_OPERATION_SHAPE');
      // C4 — not a retry duplicate of a presented FITME-sourced record
      var key = contentKeyOf(s.draft);
      if (key !== null && Object.keys(ctx.fitmeRecords).some(function (id) { return C.contentKey(ctx.fitmeRecords[id]) === key; })) return reject('DUPLICATE_OF_PRESENTED');
      // C5 — same structure as a presented candidate is admitted (prefer CREATE when uncertain).
      return { admitted: true, plan: { operation: 'CREATE', draft: s.draft, newConceptLabels: fc.newLabels, newKeys: fc.newKeys } };
    }

    // SUPERSEDE — S1: only a presented FITME-sourced candidate (never active, never user-stated)
    var pred = p.targetRecordId !== null && has(ctx.fitmeRecords, p.targetRecordId) ? ctx.fitmeRecords[p.targetRecordId] : null;
    if (!pred || pred.status !== 'candidate') return reject('INVALID_TARGET');
    // S3 — content differs
    var succKey = contentKeyOf(s.draft);
    if (succKey !== null && succKey === C.contentKey(pred)) return reject('SUPERSEDE_IDENTICAL');
    // S4 — shares at least one root concept with the target
    var predRoots = pred.factors.map(function (f) { return ctx.rootOf(f.conceptId); });
    if (!existingRoots(fc, ctx).some(function (r) { return predRoots.indexOf(r) !== -1; })) return reject('SUPERSEDE_UNRELATED');
    // S5 — rests on at least one new supporting observation
    var predOn = refIdsOn(pred);
    if (!refsOf(p.supporting, ctx).some(function (o) { return predOn.indexOf(o.refId) === -1; })) return reject('NO_NEW_EVIDENCE');
    return { admitted: true, plan: { operation: 'SUPERSEDE', targetRecordId: pred.recordId, draft: s.draft, newConceptLabels: fc.newLabels, newKeys: fc.newKeys } };
  }

  // Evaluates all proposals in output order, enforcing the per-pass new-concept cap over distinct
  // normalized labels (equal labels within a pass map to one concept, §19).
  function evaluate(proposals, ctx) {
    var passKeys = {};
    var passCount = 0;
    return proposals.map(function (p, index) {
      var r;
      try { r = evaluateOne(p, ctx); } catch (e) { r = reject('INVALID_SHAPE'); }
      if (r.admitted && r.plan.newKeys) {
        var added = r.plan.newKeys.filter(function (k) { return !passKeys[k]; });
        if (passCount + added.length > L.MAX_NEW_CONCEPTS_PER_PASS) r = reject('NEW_CONCEPT_LIMIT');
        else { added.forEach(function (k) { passKeys[k] = true; }); passCount += added.length; }
      }
      return Object.assign({ index: index, operation: p && p.operation }, r);
    });
  }

  var API = {
    evaluate: evaluate,
    evaluateOne: evaluateOne
  };

  if (typeof window !== 'undefined') { window.ConsolidationGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
