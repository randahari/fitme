// ══════════════════════════════════════════════════════════════════
// FitMe — Consolidation Gate (WP0 Phase E.0.2d)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md (v1.1) §14.4, §16, §20.2, §22-§24.
//
// Exclusive responsibility: deterministic authority over every Generator proposal, in two separate
// stages (§16):
//   1. preVerify(entries, ctx) — the pre-verification gate. Each well-formed proposal is evaluated
//      independently (G1-G6, C1-C5, A1-A5, S1-S5, E1-E5, U1-U7, §19 concept rules, §20.2 grounding);
//      an admissible one becomes a frozen PLAN built only from trusted state and resolved keys. It
//      never consults another proposal.
//   2. authorizePlans(plans, verification) — post-verification authorization. Applies the Verifier's
//      closed verdicts (reject-only) and then the cross-proposal rules in output order (§16.5). It
//      returns a per-pass Authorization whose permits(plan) is the only way the coordinator may
//      execute a plan: a plan that did not pass this call cannot be written.
// The gate never converts one operation into another, never repairs a proposal, and never trusts a
// model-chosen key beyond its resolution in the namespace its field requires. Pure: no clock, no ids,
// no I/O, no model access.
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
  var TARGET_STATUSES = ['candidate', 'active'];
  var EXPRESSION_AUTHORSHIP = ['USER_AUTHORED', 'USER_RECORDED'];

  function reject(code) { return { outcome: 'REJECTED', code: code }; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function unique(arr) { return arr.every(function (v, i) { return arr.indexOf(v) === i; }); }
  function deepFreeze(v) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.keys(v).forEach(function (k) { deepFreeze(v[k]); });
      Object.freeze(v);
    }
    return v;
  }

  // ── context accessors (ctx is built by the coordinator, §14.1-§14.4) ──
  //   observations: {oKey → {ref, refId, observedAt, localDate, localTime, utcOffsetMinutes,
  //                          segments: [{segmentId, authorship, text, localDate, localTime, utcOffsetMinutes}], userTexts}}
  //   conceptKeys: {kKey → conceptId}            presented concepts only (a root-only key never resolves)
  //   presentedConcepts: [{conceptId, labels}]   §19 call-scoped membership
  //   rootOf(conceptId) → root                   pass-local merge resolution
  //   records: {rKey → record}                   presented FITME-sourced records
  //   references: {uKey → {type, recordRef, roots, texts, claimedRefIds}}
  //   userStatedStructures: [record]; ownedRefIds: {refId → true}; ownersByRefId: {refId → [record]}
  function obsOf(ctx, key) { return has(ctx.observations, key) ? ctx.observations[key] : null; }
  function refsOf(keys, ctx) { return keys.map(function (k) { return ctx.observations[k]; }); }
  function evidenceDrafts(obs) { return obs.map(function (o) { return { kind: o.ref.kind, ref: o.ref.ref, observedAt: o.observedAt }; }); }
  function refIdsOn(record) {
    return record.evidence.supporting.concat(record.evidence.contradicting).map(function (r) { return r.refId; });
  }
  function targetOf(ctx, key) { return has(ctx.records, key) ? ctx.records[key] : null; }

  // ── §16.1 G3 / §19 — factors: concept keys resolved to presented conceptIds, then E.0.2c §19 ──
  // Returns {error} or {factors (contract form), resolved (for the plan), newLabels, newKeys, sigFactors}.
  function checkFactors(p, ctx) {
    var presentedKeys = {};
    ctx.presentedConcepts.forEach(function (c) { c.labels.forEach(function (l) { presentedKeys[C.normalizeLabelKey(l)] = true; }); });
    var proposalFactors = [];
    for (var i = 0; i < p.factors.length; i++) {
      var f = p.factors[i];
      if ((f.conceptKey === null) === (f.newConceptLabel === null)) return { error: 'INVALID_FACTOR' };
      var pf = { role: f.role, valueDescription: f.valueText };
      if (f.conceptKey !== null) {
        if (!has(ctx.conceptKeys, f.conceptKey)) return { error: 'UNKNOWN_CONCEPT_KEY' };
        pf.conceptId = ctx.conceptKeys[f.conceptKey];
      } else {
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
    var resolved = proposalFactors.map(function (pf, i) {
      return { conceptId: has(pf, 'conceptId') ? pf.conceptId : null, newConceptLabel: has(pf, 'newConceptLabel') ? pf.newConceptLabel : null,
        role: pf.role, valueText: pf.valueDescription, byReference: (p.reference && p.reference.factorIndex === i) ? p.reference.uKey : null };
    });
    return { factors: v.factors, resolved: resolved, newLabels: v.newConceptLabels.slice(), newKeys: newKeys, sigFactors: sigFactors };
  }

  // ── §20.2 — recurring-window grounding: structural existence and declared form only ──
  // Deterministic code verifies WHERE grounding lives (anchors into cited supporting evidence) and
  // that the declared structural form is satisfied. What the window means is the Verifier's (§20.3).
  function findSegment(o, segmentId) {
    for (var i = 0; i < o.segments.length; i++) { if (o.segments[i].segmentId === segmentId) return o.segments[i]; }
    return null;
  }
  // Returns {error} or {anchor (resolved, with its structural value)}.
  function resolveAnchor(a, p, ctx) {
    if (a.kind === CC.RESERVED_GROUNDING.anchorKind) return { error: 'GROUNDING_FORM_UNAVAILABLE' };
    var o = obsOf(ctx, a.obsKey);
    if (!o) return { error: 'UNKNOWN_OBSERVATION' };
    if (p.supporting.indexOf(a.obsKey) === -1) return { error: 'GROUNDING_ANCHOR_INVALID' };
    var seg = null;
    if (a.segmentId !== null) {
      seg = findSegment(o, a.segmentId);
      if (!seg) return { error: 'GROUNDING_ANCHOR_INVALID' };
    }
    if (a.kind === 'SOURCE_TIME') {
      var value = null;
      if (a.field === 'INSTANT') {
        if (seg !== null || o.observedAt === null) return { error: 'GROUNDING_ANCHOR_INVALID' };
        value = CC.epochToIsoUtc(o.observedAt);
      } else {
        var holder = seg !== null ? seg : o;
        value = a.field === 'LOCAL_DATE' ? holder.localDate : holder.localTime;
      }
      if (value === null || value === undefined) return { error: 'GROUNDING_ANCHOR_INVALID' };
      return { anchor: { kind: a.kind, obsKey: a.obsKey, segmentId: a.segmentId, field: a.field, value: value } };
    }
    // USER_EXPRESSION — a literal substring (normalized) of a user-authored or user-recorded text segment.
    if (EXPRESSION_AUTHORSHIP.indexOf(seg.authorship) === -1 || seg.text === null) return { error: 'GROUNDING_ANCHOR_INVALID' };
    var key = C.normalizeLabelKey(a.text);
    if (!key || C.normalizeLabelKey(seg.text).indexOf(key) === -1) return { error: 'GROUNDING_ANCHOR_INVALID' };
    return { anchor: { kind: a.kind, obsKey: a.obsKey, segmentId: a.segmentId, value: a.text } };
  }
  function anchoredItems(anchors) {
    var items = [];
    anchors.forEach(function (a) { var id = a.obsKey + '\u0000' + (a.segmentId === null ? '' : a.segmentId); if (items.indexOf(id) === -1) items.push(id); });
    return items.length;
  }
  function countOf(anchors, pred) { return anchors.filter(pred).length; }
  function recurrenceSatisfied(form, anchors) {
    if (form === 'OBSERVED') return anchors.every(function (a) { return a.kind === 'SOURCE_TIME'; }) && anchoredItems(anchors) >= 2;
    return countOf(anchors, function (a) { return a.kind === 'USER_EXPRESSION'; }) >= 1; // STATED
  }
  function windowSatisfied(form, anchors) {
    if (form === 'SOURCE_LOCAL') return countOf(anchors, function (a) { return a.kind === 'SOURCE_TIME' && a.field !== 'INSTANT'; }) >= 1;
    if (form === 'SEQUENCE') return anchoredItems(anchors.filter(function (a) { return a.kind === 'SOURCE_TIME'; })) >= 2;
    return countOf(anchors, function (a) { return a.kind === 'USER_EXPRESSION'; }) >= 1; // STATED
  }
  function checkGrounding(p, ctx) {
    var g = p.grounding;
    var recurrencePart = g.recurrence;
    var windowPart = g['window'];
    if (recurrencePart.form === CC.RESERVED_GROUNDING.form || windowPart.form === CC.RESERVED_GROUNDING.form) return { error: 'GROUNDING_FORM_UNAVAILABLE' };
    var out = {};
    var parts = ['recurrence', 'window'];
    for (var i = 0; i < parts.length; i++) {
      var part = g[parts[i]];
      var seen = [];
      var resolved = [];
      for (var j = 0; j < part.anchors.length; j++) {
        var identity = JSON.stringify(part.anchors[j]);
        if (seen.indexOf(identity) !== -1) return { error: 'GROUNDING_ANCHOR_INVALID' };
        seen.push(identity);
        var r = resolveAnchor(part.anchors[j], p, ctx);
        if (r.error) return r;
        resolved.push(r.anchor);
      }
      out[parts[i]] = { form: part.form, anchors: resolved };
    }
    // (The grounding part named "window" (§20.2) is read by key, never as `<obj>.window.<field>`, so the
    // static scan for browser-global use (AC-D41) stays exact.)
    var resolvedWindow = out['window'];
    if (!recurrenceSatisfied(out.recurrence.form, out.recurrence.anchors)) return { error: 'GROUNDING_INSUFFICIENT' };
    if (!windowSatisfied(resolvedWindow.form, resolvedWindow.anchors)) return { error: 'GROUNDING_INSUFFICIENT' };
    return { grounding: out };
  }

  // §22 E2 / §23.2 U6 — every user text the claim text must not literally restate.
  function userTextsFor(cited, reference, ctx) {
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

  // ── CREATE and SUPERSEDE successor checks (C1-C3, U2-U6, E2, §17 draft) ──
  function successorChecks(p, ctx, fc) {
    // C2 — evidence-class counts over supporting observations only
    var n = p.supporting.length;
    if (n < 1) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    if (p.evidenceClass === 'SINGLE_OBSERVATION' && n !== 1) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    if (p.evidenceClass === 'RECURRENCE' && n < 2) return { error: 'EVIDENCE_CLASS_MISMATCH' };
    // C3 (R-4) — grounding is present exactly for RECURRING_WINDOW and must satisfy §20.2
    if ((p.temporality === 'RECURRING_WINDOW') !== (p.grounding !== null)) return { error: 'INVALID_OPERATION_SHAPE' };
    var grounding = null;
    if (p.grounding !== null) {
      var gr = checkGrounding(p, ctx);
      if (gr.error) return gr;
      grounding = gr.grounding;
    }

    var supportingObs = refsOf(p.supporting, ctx);
    var contradictingObs = refsOf(p.contradicting, ctx);
    var reference = null;
    if (p.reference !== null) {
      var rf = p.factors[p.reference.factorIndex];
      reference = { uKey: p.reference.uKey, ref: ctx.references[p.reference.uKey] };
      // U2 — reference form
      if (rf.valueText !== null) return { error: 'USER_STATED_REFERENCE_INVALID' };
      if (rf.conceptKey !== null) {
        if (reference.ref.type === 'USER_KNOWLEDGE' && reference.ref.roots.indexOf(ctx.rootOf(ctx.conceptKeys[rf.conceptKey])) === -1) return { error: 'USER_STATED_REFERENCE_INVALID' };
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
    if (ctx.userStatedStructures.some(function (rec) { return CC.signature(rec.factors, ctx.rootOf) === sig; })) return { error: 'MIRRORS_USER_STATED' };
    // E2 / U6 — no literal restatement (normalized text only; no concept resolution)
    var claimTexts = [p.relationText].concat(p.factors.map(function (f) { return f.valueText; }).filter(function (t) { return t !== null; }));
    if (CC.literalOverlap(claimTexts, userTextsFor(supportingObs.concat(contradictingObs), reference, ctx), L.LITERAL_OVERLAP_MAX_CHARS)) return { error: 'LITERAL_RESTATEMENT' };

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
    return { draft: draft, grounding: grounding };
  }

  function contentKeyOf(draft) {
    if (draft.factors.some(function (f) { return has(f, 'newConcept'); })) return null;
    return C.contentKey(C.materializeContent(draft, function () { return null; }));
  }
  function existingRoots(fc, ctx) {
    return fc.sigFactors.filter(function (sf) { return typeof sf.newKey !== 'string'; }).map(function (sf) { return ctx.rootOf(sf.conceptId); });
  }

  // ── §16.1 G2 / G6 — every cited observation key resolves in the observation namespace ──
  function citedKeys(p) {
    if (p.operation === 'APPEND_EVIDENCE') return { lists: [p.observations], anchors: [] };
    var anchors = [];
    if (p.grounding !== null) {
      ['recurrence', 'window'].forEach(function (part) { p.grounding[part].anchors.forEach(function (a) { anchors.push(a.obsKey); }); });
    }
    return { lists: [p.supporting, p.contradicting], anchors: anchors };
  }

  // ── §16.3 — APPEND_EVIDENCE (R-1): structure, uniqueness and freshness from trusted state ──
  function appendPlan(p, ctx) {
    // A1 — the record key resolves to a presented FITME-sourced candidate or active record
    var target = targetOf(ctx, p.target);
    if (!target || C.FITME_SOURCES.indexOf(target.source) === -1 || TARGET_STATUSES.indexOf(target.status) === -1) return reject('INVALID_TARGET');
    // A3 — the structure is the target's stored structure, merge-resolved; no model-supplied structure
    var sig = CC.signature(target.factors, ctx.rootOf);
    // A4 — unique grounding among presented FITME-sourced records
    var same = Object.keys(ctx.records).filter(function (k) { return CC.signature(ctx.records[k].factors, ctx.rootOf) === sig; });
    if (same.length !== 1 || same[0] !== p.target) return reject('AMBIGUOUS_TARGET');
    // A5 — the materialized observations: cited and not already on the target
    var on = refIdsOn(target);
    var materialized = p.observations.filter(function (k) { return on.indexOf(ctx.observations[k].refId) === -1; });
    if (!materialized.length) return { outcome: 'NO_CHANGE', code: 'NO_CHANGE' };
    if (target.evidence[p.list].length + materialized.length > MAX_REFS) return reject('LIST_TOO_LONG');
    return {
      outcome: 'PLAN',
      plan: {
        operation: 'APPEND_EVIDENCE', targetKey: p.target, targetRecordId: target.recordId, list: p.list,
        observations: materialized.slice(), refs: evidenceDrafts(refsOf(materialized, ctx)), newKeys: []
      }
    };
  }

  // Evaluates one well-formed proposal (§15.2 shape already established, §15.3).
  function evaluateProposal(p, ctx) {
    // G1 — early, reject-only model flags (E4, §24 item 3); false grants nothing
    if (p.restatesUserStatement !== false) return reject('DECLARED_RESTATEMENT');
    if (p.safetyAdjacent !== false) return reject('SAFETY_ADJACENT_PROPOSAL');
    // G2 — observation keys resolve; distinct within each list; never in both evidence lists
    var cited = citedKeys(p);
    var listed = [].concat.apply([], cited.lists);
    if (!listed.concat(cited.anchors).every(function (k) { return obsOf(ctx, k) !== null; })) return reject('UNKNOWN_OBSERVATION');
    if (!cited.lists.every(unique) || !unique(listed)) return reject('INVALID_EVIDENCE');
    // G6 — V1 source scope (PD-D3)
    if (!listed.every(function (k) { return CC.V1_OBSERVATION_REF_KINDS.indexOf(ctx.observations[k].ref.kind) !== -1; })) return reject('SOURCE_NOT_IN_SCOPE');

    if (p.operation === 'APPEND_EVIDENCE') return appendPlan(p, ctx);

    // U1 — the single reference resolves in the user-stated namespace and names an existing factor
    if (p.reference !== null && (!has(ctx.references, p.reference.uKey) || p.reference.factorIndex >= p.factors.length)) return reject('USER_STATED_REFERENCE_INVALID');
    // G3 / §19
    var fc = checkFactors(p, ctx);
    if (fc.error) return reject(fc.error);
    var s = successorChecks(p, ctx, fc);
    if (s.error) return reject(s.error);

    var claim = { factors: fc.resolved, relationText: p.relationText, evidenceClass: p.evidenceClass, temporality: p.temporality, grounding: s.grounding,
      supporting: p.supporting.slice(), contradicting: p.contradicting.slice(), reference: p.reference === null ? null : p.reference.uKey };
    if (p.operation === 'CREATE') {
      // C4 — not a retry duplicate of a presented FITME-sourced record
      var key = contentKeyOf(s.draft);
      if (key !== null && Object.keys(ctx.records).some(function (k) { return C.contentKey(ctx.records[k]) === key; })) return reject('DUPLICATE_OF_PRESENTED');
      // C5 — same structure as a presented candidate is admissible (prefer CREATE when uncertain)
      return { outcome: 'PLAN', plan: { operation: 'CREATE', draft: s.draft, claim: claim, newConceptLabels: fc.newLabels, newKeys: fc.newKeys } };
    }

    // SUPERSEDE — S1: only a presented FITME-sourced candidate (never active, never user-stated)
    var pred = targetOf(ctx, p.target);
    if (!pred || C.FITME_SOURCES.indexOf(pred.source) === -1 || pred.status !== 'candidate') return reject('INVALID_TARGET');
    // S3 — content differs
    var succKey = contentKeyOf(s.draft);
    if (succKey !== null && succKey === C.contentKey(pred)) return reject('SUPERSEDE_IDENTICAL');
    // S4 — shares at least one root concept with the target
    var predRoots = pred.factors.map(function (f) { return ctx.rootOf(f.conceptId); });
    if (!existingRoots(fc, ctx).some(function (r) { return predRoots.indexOf(r) !== -1; })) return reject('SUPERSEDE_UNRELATED');
    // S5 — rests on at least one new supporting observation
    var predOn = refIdsOn(pred);
    if (!refsOf(p.supporting, ctx).some(function (o) { return predOn.indexOf(o.refId) === -1; })) return reject('NO_NEW_EVIDENCE');
    return { outcome: 'PLAN', plan: { operation: 'SUPERSEDE', targetKey: p.target, targetRecordId: pred.recordId, draft: s.draft, claim: claim,
      newConceptLabels: fc.newLabels, newKeys: fc.newKeys } };
  }

  // §16.1-§16.4 — the pre-verification gate. `entries` is the Generator's isolated result
  // ([{index, ok, proposal} | {index, ok:false, operation}], §15.3). Returns, in output order,
  // [{index, operation, outcome: 'PLAN'|'REJECTED'|'NO_CHANGE', code, plan}] with every plan frozen.
  function preVerify(entries, ctx) {
    return entries.map(function (e) {
      if (!e.ok) return Object.freeze({ index: e.index, operation: e.operation, outcome: 'REJECTED', code: 'MALFORMED_PROPOSAL', plan: null });
      var r;
      try { r = evaluateProposal(e.proposal, ctx); } catch (err) { r = reject('MALFORMED_PROPOSAL'); }
      var plan = r.outcome === 'PLAN' ? deepFreeze(Object.assign({ index: e.index }, r.plan)) : null;
      return Object.freeze({ index: e.index, operation: e.proposal.operation, outcome: r.outcome, code: r.outcome === 'PLAN' ? null : r.code, plan: plan });
    });
  }

  // §16.5 — post-verification authorization (R-2): authorizePlans.
  //   plans: the frozen plans from preVerify, in output order; plan i is verification item p(i+1).
  //   verification: {status:'FAILED'} | {status:'OK', verdicts: {pKey → {ok:true, tokens} | {ok:false}}}
  //     — the Verifier's closed result (§15.6). Only closed tokens are read from it.
  // Returns a per-pass Authorization: {decisions, permits(plan)}. `decisions` lists every plan with
  // outcome AUTHORIZED or REJECTED, its code and its verdict tokens. `permits` closes over a private
  // set built here, so execution can be granted only by this call, for these exact plan objects.
  function authorizePlans(plans, verification) {
    var permitted = new Set();
    var failed = !verification || verification.status !== 'OK' || !verification.verdicts;
    var decisions = plans.map(function (plan, i) {
      var base = { index: plan.index, operation: plan.operation, plan: plan, verification: null };
      if (failed) return Object.assign(base, { outcome: 'REJECTED', code: 'VERIFICATION_UNAVAILABLE' });
      var key = CC.passKey(CC.KEY_PREFIXES.item, i);
      var v = has(verification.verdicts, key) ? verification.verdicts[key] : null;
      if (!v) return Object.assign(base, { outcome: 'REJECTED', code: 'VERIFICATION_MISSING' });
      if (!v.ok) return Object.assign(base, { outcome: 'REJECTED', code: 'VERIFICATION_MALFORMED' });
      var tokens = {};
      CC.VERDICT_DIMENSIONS.forEach(function (d) { tokens[d] = v.tokens[d]; });
      base.verification = Object.freeze(tokens);
      var code = CC.firstFailingVerdict(tokens, plan.operation);
      return Object.assign(base, code ? { outcome: 'REJECTED', code: code } : { outcome: 'AUTHORIZED', code: null });
    });

    // Step 2 — cross-proposal rules over the plans that passed step 1, in output order.
    var passing = decisions.filter(function (d) { return d.outcome === 'AUTHORIZED'; });
    var supersedeTargets = {};
    passing.forEach(function (d) { if (d.operation === 'SUPERSEDE') supersedeTargets[d.plan.targetRecordId] = true; });
    var supersededInPass = {};
    var passKeys = {};
    var passCount = 0;
    passing.forEach(function (d) {
      var p = d.plan;
      if (p.operation === 'SUPERSEDE') {
        if (supersededInPass[p.targetRecordId]) { d.outcome = 'REJECTED'; d.code = 'TARGET_CONFLICT_IN_PASS'; return; }
        supersededInPass[p.targetRecordId] = true;
      }
      if (p.operation === 'APPEND_EVIDENCE' && supersedeTargets[p.targetRecordId]) { d.outcome = 'REJECTED'; d.code = 'TARGET_CONFLICT_IN_PASS'; return; }
      var added = p.newKeys.filter(function (k, j) { return !passKeys[k] && p.newKeys.indexOf(k) === j; });
      if (passCount + added.length > L.MAX_NEW_CONCEPTS_PER_PASS) { d.outcome = 'REJECTED'; d.code = 'NEW_CONCEPT_LIMIT'; return; }
      added.forEach(function (k) { passKeys[k] = true; });
      passCount += added.length;
    });

    decisions.forEach(function (d) {
      if (d.outcome === 'AUTHORIZED') permitted.add(d.plan); else d.plan = null;
      Object.freeze(d);
    });
    return Object.freeze({
      decisions: Object.freeze(decisions),
      permits: function (plan) { return permitted.has(plan); }
    });
  }

  var API = {
    preVerify: preVerify,
    authorizePlans: authorizePlans,
    _internal: { evaluateProposal: evaluateProposal, checkGrounding: checkGrounding }
  };

  if (typeof window !== 'undefined') { window.ConsolidationGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
