// ══════════════════════════════════════════════════════════════════
// FitMe — User-Stated Intake Gate (USI-001, docs/specs/USI_001_SPEC_v1.0.md §15-§17)
// Exclusive responsibility: the deterministic validation and routing of the USI interpreter's
// proposals for ONE turn. Pure and synchronous; never throws; no clock, no model call, no
// persistence, no platform reference. Input: the raw proposals, the bounded current turn, the
// presented concepts/records (full stored forms, §13), the higher-precedence recognition record
// (§11) and the recent-conversation projection. Output: per proposal either an accepted plan or a
// rejection code. It never repairs, narrows, widens, downgrades or re-targets a proposal.
//
// What is PROVEN here (§15.4.7): every user-attributed text is an exact substring of the current
// turn (§15.2 L1); every concept/record id is a presented one; for CORRECT/WITHDRAW/FORGET the
// request and reference are literal current-turn text, the reference lies inside the request, and
// the single target is the UNIQUE presented record grounded by the user's own words (a stored
// concept label contained in the reference, when the whole turn names no other presented record)
// or, when the whole turn names no presented record, by the record's origin in the recent
// conversation. What remains MODEL JUDGMENT (measured by calibration CAL-8): that the user meant
// the grounded record, whether a mutation was asked for and which one, and word-sense
// coincidences of lexical overlap.
//
// It never reads Turn Understanding's detector dimension (DUC detector amendment §07), and holds
// no word list, synonym table, pronoun list, ontology or semantic mapping: grounding is string
// containment of Concept Identity's own stored labels (§15.4.2).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;

  var USER_STATED_INTAKE_GATE_VERSION = '1.0.0';

  // §14.4 — closed PROCESS/STRUCTURE vocabularies (roles and temporalities are the E.0.2c
  // contract's own). None describes content.
  var OPERATIONS = Object.freeze(['NEW', 'CORRECT', 'WITHDRAW', 'FORGET']);
  var REFERENCE_KINDS = Object.freeze(['NAMED', 'DEICTIC']);
  var MUTATING_OPERATIONS = Object.freeze(['CORRECT', 'WITHDRAW', 'FORGET']);

  // §24 — deterministic bounds.
  var BOUNDS = Object.freeze({
    PROPOSALS_PER_TURN_MAX: 3,
    FACTORS_PER_PROPOSAL_MAX: 6,
    NEW_CONCEPTS_PER_TURN_MAX: 6,
    REQUEST_TEXT_MAX_CHARS: 200,
    REFERENCE_TEXT_MAX_CHARS: 80,
    STATEMENT_TEXT_MAX_CHARS: 400,  // E.0.2c RELATION_DESCRIPTION_MAX_CHARS
    MENTION_TEXT_MAX_CHARS: 80,     // E.0.2c LABEL_MAX_CHARS
    NEW_CONCEPT_LABEL_MAX_CHARS: 80,
    VALUE_TEXT_MAX_CHARS: 160,
    CONFOUND_TEXT_MAX_CHARS: 200,
    LEXICAL_GROUNDING_MIN_CHARS: 3  // [PROVISIONAL]
  });

  var PROPOSAL_KEYS = Object.freeze(['operation', 'targetRecordIds', 'requestText', 'referenceText', 'referenceKind', 'statementText', 'factors', 'temporality', 'confoundText', 'safetyAdjacent']);
  var FACTOR_KEYS = Object.freeze(['conceptId', 'newConceptLabel', 'mentionText', 'role', 'valueText', 'cpiReference']);
  var CURRENT_STATUSES = Object.freeze(['candidate', 'active']);

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isPlainObject(v) { return C.isPlainObject(v); }
  function inList(list, v) { return list.indexOf(v) !== -1; }
  function isString(v) { return typeof v === 'string'; }

  function deepFreeze(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.keys(v).forEach(function (k) { deepFreeze(v[k]); });
      Object.freeze(v);
    }
    return v;
  }
  function reject(code) { return { status: 'REJECTED', code: code }; }

  // ── §15.2 literal user authority ──
  function nfc(s) { return s.normalize('NFC'); }
  // L1: t.trim() non-empty and NFC(t.trim()) is an exact substring of NFC(turnText). Returns the
  // stored value NFC(t.trim()), or null.
  function literal(t, turnNfc) {
    if (!isString(t)) return null;
    var v = nfc(t.trim());
    if (v.length < 1) return null;
    return turnNfc.indexOf(v) >= 0 ? v : null;
  }
  function storedLength(t) { return isString(t) ? nfc(t.trim()).length : 0; }

  // ── §11.2 occurrence intervals ──
  function allOccurrences(needle, hay) {
    var out = [];
    if (!needle.length) return out;
    var from = 0;
    for (;;) {
      var i = hay.indexOf(needle, from);
      if (i < 0) break;
      out.push([i, i + needle.length]);
      from = i + 1;
    }
    return out;
  }
  function overlapSpace(s) { return nfc(s).toLowerCase(); } // O(s)
  function intervalsO(span, turnO) { return isString(span) ? allOccurrences(overlapSpace(span.trim()), turnO) : []; }
  function intervalsExact(span, turnNfc) { return isString(span) ? allOccurrences(nfc(span.trim()), turnNfc) : []; }
  function anyOverlap(a, b) {
    for (var i = 0; i < a.length; i++) {
      for (var j = 0; j < b.length; j++) { if (a[i][0] < b[j][1] && b[j][0] < a[i][1]) return true; }
    }
    return false;
  }
  function anyWithin(inner, outer) {
    for (var i = 0; i < inner.length; i++) {
      for (var j = 0; j < outer.length; j++) { if (outer[j][0] <= inner[i][0] && inner[i][1] <= outer[j][1]) return true; }
    }
    return false;
  }

  // ── §15.4.2 grounding ──
  function groundingKey(s) { return C.normalizeLabelKey(s); } // G(s)
  function lexicalGrounding(text, ctx) {
    var key = groundingKey(text);
    var out = [];
    ctx.candidates.forEach(function (r) {
      var grounded = r.factors.some(function (f) {
        var concept = ctx.conceptById[f.conceptId];
        if (!concept || !Array.isArray(concept.labels)) return false;
        return concept.labels.some(function (label) {
          var lk = groundingKey(label);
          return lk.length >= BOUNDS.LEXICAL_GROUNDING_MIN_CHARS && key.indexOf(lk) >= 0;
        });
      });
      if (grounded) out.push(r.recordId);
    });
    return out;
  }
  function conversationalGrounding(ctx) {
    var out = [];
    if (!ctx.recentTurnIds.length) return out;
    ctx.candidates.forEach(function (r) {
      var origin = r.provenance && r.provenance.originTurnId;
      var byOrigin = isString(origin) && inList(ctx.recentTurnIds, origin);
      var supporting = (r.evidence && Array.isArray(r.evidence.supporting)) ? r.evidence.supporting : [];
      var byEvidence = supporting.some(function (ref) { return ref && ref.kind === 'CONVERSATION_TURN' && inList(ctx.recentTurnIds, ref.ref); });
      if (byOrigin || byEvidence) out.push(r.recordId);
    });
    return out;
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) { if (!inList(b, a[i])) return false; }
    return true;
  }

  // ── §15.1 shape and bounds ──
  function checkExactKeys(obj, keys) {
    var own = Object.keys(obj);
    if (own.length !== keys.length) return false;
    for (var i = 0; i < keys.length; i++) { if (!has(obj, keys[i])) return false; }
    return true;
  }
  function isNullableString(v) { return v === null || isString(v); }

  function checkFactorShape(f) {
    if (!isPlainObject(f) || !checkExactKeys(f, FACTOR_KEYS)) return false;
    if (!isNullableString(f.conceptId) || !isNullableString(f.newConceptLabel)) return false;
    if ((f.conceptId === null) === (f.newConceptLabel === null)) return false; // exactly one
    if (!isNullableString(f.mentionText) || !isNullableString(f.valueText)) return false;
    if (!inList(C.FACTOR_ROLES, f.role)) return false;
    if (typeof f.cpiReference !== 'boolean') return false;
    if (storedLength(f.mentionText) > BOUNDS.MENTION_TEXT_MAX_CHARS) return false;
    if (storedLength(f.newConceptLabel) > BOUNDS.NEW_CONCEPT_LABEL_MAX_CHARS) return false;
    if (storedLength(f.valueText) > BOUNDS.VALUE_TEXT_MAX_CHARS) return false;
    return true;
  }

  function checkShape(p) {
    if (!isPlainObject(p) || !checkExactKeys(p, PROPOSAL_KEYS)) return false;
    if (!inList(OPERATIONS, p.operation)) return false;
    if (!Array.isArray(p.targetRecordIds) || !p.targetRecordIds.every(isString)) return false;
    if (typeof p.safetyAdjacent !== 'boolean') return false;
    var mutating = inList(MUTATING_OPERATIONS, p.operation);
    if (p.targetRecordIds.length !== (mutating ? 1 : 0)) return false;
    if (mutating) {
      if (!isString(p.requestText) || !isString(p.referenceText) || !inList(REFERENCE_KINDS, p.referenceKind)) return false;
    } else if (p.requestText !== null || p.referenceText !== null || p.referenceKind !== null) {
      return false;
    }
    if (p.operation === 'NEW' || p.operation === 'CORRECT') {
      if (!isString(p.statementText) || storedLength(p.statementText) > BOUNDS.STATEMENT_TEXT_MAX_CHARS) return false;
      if (!Array.isArray(p.factors) || p.factors.length < 1 || p.factors.length > BOUNDS.FACTORS_PER_PROPOSAL_MAX) return false;
      if (!p.factors.every(checkFactorShape)) return false;
      if (!inList(C.TEMPORALITIES, p.temporality)) return false;
      if (p.operation === 'NEW' && p.confoundText !== null) return false;
      if (!isNullableString(p.confoundText) || storedLength(p.confoundText) > BOUNDS.CONFOUND_TEXT_MAX_CHARS) return false;
    } else {
      if (p.statementText !== null || p.temporality !== null || p.confoundText !== null) return false;
      if (!(p.factors === null || (Array.isArray(p.factors) && p.factors.length === 0))) return false;
    }
    return true;
  }

  // ── §15.2 literal checks; returns {code} or {factors: [{..., mention, label, value}]} ──
  function checkLiteral(p, ctx) {
    if (p.operation !== 'NEW' && p.operation !== 'CORRECT') return { factors: [] };
    if (!literal(p.statementText, ctx.turnNfc)) return { code: 'NOT_LITERAL' };
    if (p.confoundText !== null && !literal(p.confoundText, ctx.turnNfc)) return { code: 'NOT_LITERAL' };
    var out = [];
    var anchored = 0;
    for (var i = 0; i < p.factors.length; i++) {
      var f = p.factors[i];
      var mention = null;
      if (f.mentionText === null) {
        // Carry-forward (CORRECT only): structure, never user-attributed text. Membership of the
        // concept in the target is checked after target membership (checkCarryForward).
        var carry = p.operation === 'CORRECT' && f.conceptId !== null && f.newConceptLabel === null
          && f.cpiReference === false && f.valueText === null;
        if (!carry) return { code: 'NOT_LITERAL' };
      } else {
        mention = literal(f.mentionText, ctx.turnNfc);
        if (!mention) return { code: 'NOT_LITERAL' };
        anchored++;
      }
      var label = null;
      if (f.newConceptLabel !== null) {
        label = literal(f.newConceptLabel, ctx.turnNfc);
        if (!label || label !== mention) return { code: 'NOT_LITERAL' };
      }
      var value = null;
      if (f.valueText !== null) {
        value = literal(f.valueText, ctx.turnNfc);
        if (!value) return { code: 'NOT_LITERAL' };
      }
      out.push({ source: f, mention: mention, label: label, value: value });
    }
    if (anchored < 1) return { code: 'NO_ANCHORED_FACTOR' };
    return { factors: out };
  }

  // ── §15.4 target authority for CORRECT / WITHDRAW / FORGET ──
  function checkTargetAuthority(p, target, ctx) {
    // T1 — request anchored in the current turn.
    var request = literal(p.requestText, ctx.turnNfc);
    if (!request || request.length > BOUNDS.REQUEST_TEXT_MAX_CHARS) return 'REQUEST_NOT_ANCHORED';
    // T2 — reference anchored, and inside the request.
    var reference = literal(p.referenceText, ctx.turnNfc);
    if (!reference || reference.length > BOUNDS.REFERENCE_TEXT_MAX_CHARS) return 'REFERENCE_NOT_ANCHORED';
    if (!anyWithin(intervalsExact(reference, ctx.turnNfc), intervalsExact(request, ctx.turnNfc))) return 'REFERENCE_NOT_ANCHORED';
    // T3 — higher-precedence ownership of the authority anchors.
    var anchorsO = intervalsO(request, ctx.turnO).concat(intervalsO(reference, ctx.turnO));
    if (anyOverlap(anchorsO, ctx.safetyIntervals)) return 'SAFETY_OWNED_SPAN';
    if (ctx.cpiRecognized && anyOverlap(anchorsO, ctx.cpiIntervals)) return 'CPI_OWNED_SPAN';

    // §15.4.2 — the grounding set, computed by the gate itself.
    var groundingSet;
    if (p.referenceKind === 'NAMED') {
      groundingSet = lexicalGrounding(reference, ctx);
      if (!groundingSet.length) return 'TARGET_NOT_GROUNDED';
      // The model cannot narrow what the WHOLE turn names.
      if (!sameSet(ctx.turnLexical, groundingSet)) return 'AMBIGUOUS_TARGET';
    } else {
      if (ctx.turnLexical.length) return 'REFERENCE_KIND_MISMATCH';
      groundingSet = ctx.conversational;
      if (!groundingSet.length) return 'TARGET_NOT_GROUNDED';
    }
    // §15.4.3 — exact-set rule, unique single target.
    if (!inList(groundingSet, target.recordId)) return 'TARGET_NOT_GROUNDED';
    if (groundingSet.length !== 1) return 'AMBIGUOUS_TARGET';
    return null;
  }

  // ── §15.5 owned-span routing ──
  function checkRouting(p, literalFactors, target, ctx) {
    var spans = [];
    if (p.statementText !== null) spans.push(p.statementText);
    if (p.confoundText !== null) spans.push(p.confoundText);
    var cpiFactors = [];
    literalFactors.forEach(function (lf) {
      if (lf.source.cpiReference === true) { cpiFactors.push(lf); return; }
      if (lf.mention) spans.push(lf.mention);
      if (lf.label) spans.push(lf.label);
      if (lf.value) spans.push(lf.value);
    });
    // rule 1 — Safety: no user-attributed span (including a CPI reference factor's) overlaps.
    var allSpans = spans.concat(cpiFactors.map(function (lf) { return lf.mention; }));
    for (var i = 0; i < allSpans.length; i++) {
      if (anyOverlap(intervalsO(allSpans[i], ctx.turnO), ctx.safetyIntervals)) return 'SAFETY_OWNED_SPAN';
    }
    // rule 3 — a CPI reference needs a CPI recognition, and never appears in a correction of
    // FITME-sourced knowledge (its successor's evidence is exactly the turn, §17.2).
    if (cpiFactors.length) {
      if (!ctx.cpiRecognized) return 'INVALID_CPI_REFERENCE';
      if (p.operation === 'CORRECT' && target && target.source !== 'user_stated') return 'INVALID_CPI_REFERENCE';
    }
    if (!ctx.cpiRecognized) return null;
    // rule 2 — CPI owns its assertion span.
    for (var j = 0; j < spans.length; j++) {
      if (anyOverlap(intervalsO(spans[j], ctx.turnO), ctx.cpiIntervals)) return 'CPI_OWNED_SPAN';
    }
    if (cpiFactors.length) {
      if (cpiFactors.length !== 1 || ctx.cpiAuthorized !== true) return 'INVALID_CPI_REFERENCE';
      var ref = cpiFactors[0];
      if (!ref.mention || ref.value !== null) return 'INVALID_CPI_REFERENCE';
      if (!anyWithin(intervalsO(ref.mention, ctx.turnO), ctx.cpiIntervals)) return 'INVALID_CPI_REFERENCE';
      var additional = literalFactors.some(function (lf) {
        if (lf === ref || !lf.mention) return false;
        var iv = intervalsO(lf.mention, ctx.turnO);
        return !anyOverlap(iv, ctx.cpiIntervals) && !anyOverlap(iv, ctx.safetyIntervals);
      });
      if (!additional) return 'NO_ADDITIONAL_KNOWLEDGE';
    }
    return null;
  }

  // ── §16 / §17 drafts ──
  function buildContent(literalFactors, presentedConceptList) {
    var proposalFactors = literalFactors.map(function (lf) {
      var f = { role: lf.source.role };
      if (lf.source.conceptId !== null) f.conceptId = lf.source.conceptId; else f.newConceptLabel = lf.label;
      if (lf.value !== null) f.valueDescription = lf.value;
      return f;
    });
    return C.validateFactorProposal({ factors: proposalFactors }, presentedConceptList);
  }
  function buildDraft(p, validated, ctx, safetyFlag) {
    return {
      factors: validated.factors.map(function (f) {
        var out = { role: f.role, valueDescription: f.valueDescription };
        if (has(f, 'conceptId')) out.conceptId = f.conceptId; else out.newConcept = f.newConcept;
        return out;
      }),
      relationDescription: literal(p.statementText, ctx.turnNfc),
      evidenceClass: 'EXPLICIT_STATEMENT',
      temporality: p.temporality,
      expiresAt: null,
      confidence: 1,
      source: 'user_stated',
      safetyFlag: safetyFlag,
      evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: ctx.turnId }] },
      provenance: { originTurnId: ctx.turnId }
    };
  }
  function contentKeyOfDraft(validated, statement) {
    return C.contentKey({ factors: validated.factors, relationDescription: statement });
  }

  function evaluateOne(p, ctx) {
    if (!checkShape(p)) return reject('INVALID_SHAPE');
    var lit = checkLiteral(p, ctx);
    if (lit.code) return reject(lit.code);

    // §15.3 membership — fabricated ids never reach the store.
    for (var i = 0; i < lit.factors.length; i++) {
      var cid = lit.factors[i].source.conceptId;
      if (cid !== null && !has(ctx.presentedConceptIndex, cid)) return reject('UNKNOWN_CONCEPT');
    }
    var target = null;
    if (inList(MUTATING_OPERATIONS, p.operation)) {
      var tid = p.targetRecordIds[0];
      if (!has(ctx.recordById, tid)) return reject('UNKNOWN_TARGET');
      target = ctx.recordById[tid];
      // §15.4.4 — only a current record can be targeted.
      if (!inList(CURRENT_STATUSES, target.status)) return reject('TARGET_NOT_CURRENT');
      // §15.2 carry-forward — the carried concept must be one of the target's.
      for (var k = 0; k < lit.factors.length; k++) {
        var lf = lit.factors[k];
        if (lf.mention === null && !target.factors.some(function (tf) { return tf.conceptId === lf.source.conceptId; })) {
          return reject('NOT_LITERAL');
        }
      }
      var authority = checkTargetAuthority(p, target, ctx);
      if (authority) return reject(authority);
    }

    var routing = checkRouting(p, lit.factors, target, ctx);
    if (routing) return reject(routing);

    // §15.7 plans. Authority route is selected ONLY by the single target's persisted source.
    var route = (target === null || target.source === 'user_stated') ? 'CLIENT' : 'GOVERNED';
    if (p.operation === 'WITHDRAW') {
      return { status: 'ACCEPTED', newConceptCount: 0, plan: {
        operation: 'WITHDRAW', route: route, storeOperation: 'retractRecord', targetRecordId: target.recordId,
        requiresCpiRecord: false, request: { recordId: target.recordId, userOriginTurnId: ctx.turnId }
      } };
    }
    if (p.operation === 'FORGET') {
      return { status: 'ACCEPTED', newConceptCount: 0, plan: {
        operation: 'FORGET', route: route, storeOperation: 'forgetRecord', targetRecordId: target.recordId,
        requiresCpiRecord: false, request: { recordId: target.recordId }
      } };
    }

    var validated = buildContent(lit.factors, ctx.presentedConceptList);
    if (!validated.ok) return reject(validated.code === 'UNKNOWN_CONCEPT' ? 'UNKNOWN_CONCEPT' : 'INVALID_SHAPE');
    var statement = literal(p.statementText, ctx.turnNfc);
    var newConcepts = validated.newConceptLabels.map(function (label) { return [label]; });
    var requiresCpiRecord = lit.factors.some(function (f) { return f.source.cpiReference === true; });

    // §15.6 duplicate / no-op checks (only meaningful when no new concept is created).
    if (!newConcepts.length) {
      var key = contentKeyOfDraft(validated, statement);
      if (p.operation === 'NEW') {
        var duplicate = ctx.presentedRecords.some(function (r) {
          return r.source === 'user_stated' && r.status === 'active' && C.contentKey(r) === key;
        });
        if (duplicate) return reject('DUPLICATE_OF_PRESENTED');
      } else if (target.source === 'user_stated' && C.contentKey(target) === key) {
        return reject('CORRECTION_IDENTICAL_TO_PREDECESSOR');
      }
    }

    // §21 item 3 — the model may only raise the Safety flag, never lower it (a correction keeps
    // its predecessor's raised flag).
    var raised = p.safetyAdjacent === true || (target !== null && target.safetyFlag === 'SAFETY_ADJACENT');
    var draft = buildDraft(p, validated, ctx, raised ? 'SAFETY_ADJACENT' : 'STANDARD');

    if (p.operation === 'NEW') {
      return { status: 'ACCEPTED', newConceptCount: newConcepts.length, plan: {
        operation: 'NEW', route: 'CLIENT', storeOperation: 'createRecord', targetRecordId: null,
        requiresCpiRecord: requiresCpiRecord, request: { draft: draft, newConcepts: newConcepts }
      } };
    }
    var confounds = p.confoundText !== null ? [{ description: literal(p.confoundText, ctx.turnNfc), source: 'user_stated' }] : [];
    var request = { predecessorIds: [target.recordId], successor: draft, confoundsForPredecessors: confounds, newConcepts: newConcepts };
    if (route === 'GOVERNED') request.userOriginTurnId = ctx.turnId;
    return { status: 'ACCEPTED', newConceptCount: newConcepts.length, plan: {
      operation: 'CORRECT', route: route, storeOperation: route === 'CLIENT' ? 'supersede' : 'correctInferredKnowledge',
      targetRecordId: target.recordId, requiresCpiRecord: requiresCpiRecord, request: request
    } };
  }

  function buildContext(input) {
    var turnText = input.turn && isString(input.turn.text) ? input.turn.text : '';
    var turnNfc = nfc(turnText);
    var turnO = overlapSpace(turnText);
    var concepts = Array.isArray(input.presentedConcepts) ? input.presentedConcepts.filter(isPlainObject) : [];
    var records = Array.isArray(input.presentedRecords) ? input.presentedRecords.filter(isPlainObject) : [];
    var conceptById = {};
    var presentedConceptIndex = {};
    concepts.forEach(function (c) { if (isString(c.conceptId)) { conceptById[c.conceptId] = c; presentedConceptIndex[c.conceptId] = true; } });
    var recordById = {};
    records.forEach(function (r) { if (isString(r.recordId)) recordById[r.recordId] = r; });
    var recognition = isPlainObject(input.recognition) ? input.recognition : {};
    var safety = isPlainObject(recognition.safety) ? recognition.safety : {};
    var cpi = isPlainObject(recognition.cpi) ? recognition.cpi : {};
    var safetyIntervals = [];
    (Array.isArray(safety.ownedSpans) ? safety.ownedSpans : []).forEach(function (s) { safetyIntervals = safetyIntervals.concat(intervalsO(s, turnO)); });
    var cpiRecognized = cpi.recognized === true;
    var cpiAnchorText = (cpiRecognized && isPlainObject(cpi.anchor) && cpi.anchor.valid === true && isString(cpi.anchor.text)) ? cpi.anchor.text : null;
    var rcc = input.recentConversationContext;
    var recentTurnIds = (rcc && Array.isArray(rcc.items))
      ? rcc.items.filter(function (it) { return isPlainObject(it) && isString(it.turnId); }).map(function (it) { return it.turnId; })
      : [];
    var ctx = {
      turnId: input.turn && input.turn.turnId,
      turnNfc: turnNfc,
      turnO: turnO,
      presentedConceptList: concepts,
      presentedConceptIndex: presentedConceptIndex,
      conceptById: conceptById,
      presentedRecords: records,
      recordById: recordById,
      candidates: records.filter(function (r) { return inList(CURRENT_STATUSES, r.status) && Array.isArray(r.factors); }),
      safetyIntervals: safetyIntervals,
      cpiRecognized: cpiRecognized,
      cpiAuthorized: cpi.authorized === true,
      cpiIntervals: cpiAnchorText !== null ? intervalsO(cpiAnchorText, turnO) : [],
      recentTurnIds: recentTurnIds
    };
    ctx.turnLexical = lexicalGrounding(turnText, ctx);   // L(turnText), the WHOLE bounded turn
    ctx.conversational = conversationalGrounding(ctx);   // C
    return ctx;
  }

  // §15.4.6 — cross-proposal rules, applied over every proposal the model returned.
  function crossProposalCodes(proposals) {
    var codes = {};
    var forgets = 0;
    var others = 0;
    var targetUse = {};
    proposals.forEach(function (p, i) {
      if (!isPlainObject(p) || !inList(MUTATING_OPERATIONS, p.operation)) return;
      if (p.operation === 'FORGET') forgets++; else others++;
      (Array.isArray(p.targetRecordIds) ? p.targetRecordIds : []).forEach(function (id) {
        if (!isString(id)) return;
        (targetUse[id] = targetUse[id] || []).push(i);
      });
    });
    var forgetNotExclusive = forgets > 1 || (forgets >= 1 && others >= 1);
    proposals.forEach(function (p, i) {
      if (!isPlainObject(p) || !inList(MUTATING_OPERATIONS, p.operation)) return;
      if (forgetNotExclusive) { codes[i] = 'FORGET_NOT_EXCLUSIVE'; return; }
      var conflict = Object.keys(targetUse).some(function (id) {
        var users = targetUse[id].filter(function (x, k, arr) { return arr.indexOf(x) === k; });
        return users.length > 1 && inList(users, i);
      });
      if (conflict) codes[i] = 'TARGET_CONFLICT';
    });
    return codes;
  }

  // evaluate(input) -> {results: [{proposalIndex, status:'ACCEPTED', plan} | {proposalIndex,
  // status:'REJECTED', code}]}, one result per returned proposal, in order. Never throws.
  function evaluate(input) {
    try {
      input = isPlainObject(input) ? input : {};
      var proposals = Array.isArray(input.proposals) ? input.proposals : [];
      var ctx = buildContext(input);
      if (!C.isId(ctx.turnId)) {
        return deepFreeze({ results: proposals.map(function (p, i) { return { proposalIndex: i, status: 'REJECTED', code: 'INVALID_SHAPE' }; }) });
      }
      var cross = crossProposalCodes(proposals);
      var newConceptsUsed = 0;
      var results = proposals.map(function (p, i) {
        var r;
        if (i >= BOUNDS.PROPOSALS_PER_TURN_MAX) r = reject('INVALID_SHAPE');
        else if (has(cross, i)) r = reject(cross[i]);
        else {
          try { r = evaluateOne(p, ctx); } catch (e) { r = reject('INVALID_SHAPE'); }
        }
        if (r.status === 'ACCEPTED') {
          // §15.1 — at most NEW_CONCEPTS_PER_TURN_MAX new concepts across accepted proposals.
          if (newConceptsUsed + r.newConceptCount > BOUNDS.NEW_CONCEPTS_PER_TURN_MAX) r = reject('INVALID_SHAPE');
          else newConceptsUsed += r.newConceptCount;
        }
        return r.status === 'ACCEPTED'
          ? { proposalIndex: i, status: 'ACCEPTED', plan: r.plan }
          : { proposalIndex: i, status: 'REJECTED', code: r.code };
      });
      return deepFreeze({ results: results });
    } catch (e) {
      var all = (isPlainObject(input) && Array.isArray(input.proposals)) ? input.proposals : [];
      return deepFreeze({ results: all.map(function (p, i) { return { proposalIndex: i, status: 'REJECTED', code: 'INVALID_SHAPE' }; }) });
    }
  }

  var API = {
    VERSION: USER_STATED_INTAKE_GATE_VERSION,
    OPERATIONS: OPERATIONS,
    REFERENCE_KINDS: REFERENCE_KINDS,
    BOUNDS: BOUNDS,
    evaluate: evaluate,
    _internal: {
      literal: literal,
      intervalsO: intervalsO,
      anyOverlap: anyOverlap,
      lexicalGrounding: lexicalGrounding,
      buildContext: buildContext
    }
  };

  if (typeof window !== 'undefined') { window.UserStatedIntakeGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
