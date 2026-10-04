// ══════════════════════════════════════════════════════════════════
// FitMe — User-Stated Intake coordinator (USI-001, docs/specs/USI_001_SPEC_v1.0.md §07, §12-§15)
// Exclusive responsibility: for ONE direct turn, decide whether the single bounded USI interpreter
// call may run (§12 preconditions, checked in order, no model call before the last), build the
// bounded, recency-selected presentation of existing User Knowledge (§13) through the injected
// store's bounded reads, run the interpreter once, and pass its proposals to the deterministic
// gate. Returns a decision only — it never writes, never calls the executor, and never reads a
// clock. The User Knowledge store is injected (testable-not-live: production configures none).
//
// Turn Understanding's detector dimension is read here ONLY as the trigger (§12 item 2); it is
// never passed to the interpreter or the gate (DUC detector amendment §07).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;
  var UserStatedIntakeActivationGate = (typeof module !== 'undefined' && module.exports)
    ? require('./userStatedIntakeActivationGate.js')
    : window.UserStatedIntakeActivationGate;
  var UserStatedIntakeInterpreter = (typeof module !== 'undefined' && module.exports)
    ? require('./userStatedIntakeInterpreter.js')
    : window.UserStatedIntakeInterpreter;
  var UserStatedIntakeGate = (typeof module !== 'undefined' && module.exports)
    ? require('./userStatedIntakeGate.js')
    : window.UserStatedIntakeGate;

  // §13 / §24 — presentation bounds.
  var PRESENTATION = Object.freeze({
    PRESENTED_CONCEPTS_MAX: 30,
    PRESENTED_CONCEPTS_TOTAL_MAX: 40,
    PRESENTED_RECORDS_MAX: 12,
    RECORD_QUERY_CONCEPT_IDS: 10,
    PRESENTED_LABELS_MAX: 3,
    PRESENTED_RELATION_MAX_CHARS: 160,
    PRESENTED_BLOCK_MAX_CHARS: 6000,
    TURN_MAX_CHARS: 2000
  });
  var CURRENT_STATUSES = Object.freeze(['candidate', 'active']);
  var DETECTOR_INTENTS = Object.freeze(['NEW_USER_KNOWLEDGE', 'CORRECTION_WITHDRAW_FORGET']);
  var VETO_REASONS = Object.freeze(['SAFETY_VETO', 'SAFETY_VETO_DURABLE', 'SAFETY_VETO_UNAVAILABLE']);

  var deps = { store: null, interpreter: UserStatedIntakeInterpreter, gate: UserStatedIntakeGate };
  function configure(injected) { deps = Object.assign({}, deps, injected || {}); }

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function deepFreeze(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.keys(v).forEach(function (k) { deepFreeze(v[k]); });
      Object.freeze(v);
    }
    return v;
  }
  function skipped(reason) { return deepFreeze({ status: 'SKIPPED', reason: reason }); }
  function failedDecision(reason) { return deepFreeze({ status: 'FAILED', reason: reason }); }
  function truncate(text, max) { text = typeof text === 'string' ? text : ''; return text.length > max ? text.slice(0, max) : text; }

  var STORE_READS = ['queryRecentConcepts', 'queryRecordsByConcepts', 'getConcepts'];
  function storeConfigured() {
    var s = deps.store;
    return !!s && STORE_READS.every(function (k) { return typeof s[k] === 'function'; });
  }
  function interpreterConfigured() {
    var i = deps.interpreter;
    return !!i && typeof i.interpret === 'function' && typeof i.isConfigured === 'function' && i.isConfigured() === true;
  }

  function detectorPositive(turnUnderstanding) {
    var d = turnUnderstanding && turnUnderstanding.userStatedKnowledge;
    return isPlainObject(d) && d.present === true && DETECTOR_INTENTS.indexOf(d.intent) !== -1
      && typeof d.anchorText === 'string' && d.anchorText.length > 0;
  }

  // §11.2 overlap space — used only to confirm the CPI anchor is locatable in the bounded turn.
  function overlapSpace(s) { return s.normalize('NFC').toLowerCase(); }

  // §12 — preconditions, in order. Returns a SKIPPED decision or null.
  function checkPreconditions(input, boundedTurnText) {
    if (UserStatedIntakeActivationGate.isEnabled() !== true) return skipped('ACTIVATION_GATE_OFF');
    if (!detectorPositive(input.turnUnderstanding)) return skipped('DETECTOR_NEGATIVE');
    var consent;
    try { consent = typeof input.readConsent === 'function' ? input.readConsent() : false; } catch (e) { return skipped('CONSENT_READ_FAILED'); }
    if (consent !== true) return skipped('CONSENT_NOT_GRANTED');
    var recognition = isPlainObject(input.recognition) ? input.recognition : {};
    var safety = isPlainObject(recognition.safety) ? recognition.safety : {};
    var cpi = isPlainObject(recognition.cpi) ? recognition.cpi : {};
    if (safety.available !== true) return skipped('SAFETY_RECOGNITION_UNAVAILABLE');
    if (cpi.available !== true) return skipped('CPI_RECOGNITION_UNAVAILABLE');
    if (VETO_REASONS.indexOf(cpi.gateReason) !== -1) return skipped('CPI_SAFETY_VETO');
    if (cpi.recognized === true) {
      var anchor = isPlainObject(cpi.anchor) ? cpi.anchor : {};
      if (anchor.valid !== true || typeof anchor.text !== 'string') return skipped('CPI_ANCHOR_INVALID');
      // Defensive (A2 §08.3): an anchor that cannot be located in the bounded turn cannot be
      // separated from other same-turn content.
      if (overlapSpace(boundedTurnText).indexOf(overlapSpace(anchor.text.trim())) < 0) return skipped('CPI_ANCHOR_INVALID');
    }
    if (!isPlainObject(input.turn) || !C.isId(input.turn.turnId) || typeof input.turn.text !== 'string') return skipped('INVALID_TURN');
    if (!storeConfigured() || !interpreterConfigured() || !deps.gate || typeof deps.gate.evaluate !== 'function') return skipped('NOT_CONFIGURED');
    return null;
  }

  function byRecency(idKey) {
    return function (a, b) {
      if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
      return a[idKey] < b[idKey] ? -1 : (a[idKey] > b[idKey] ? 1 : 0);
    };
  }

  function renderConcept(c) { return { conceptId: c.conceptId, labels: c.labels.slice(0, PRESENTATION.PRESENTED_LABELS_MAX) }; }
  function renderRecord(r) {
    return {
      recordId: r.recordId,
      origin: C.epistemicOrigin(r),
      status: r.status,
      factors: r.factors.map(function (f) { return { conceptId: f.conceptId, role: f.role, valueDescription: f.valueDescription }; }),
      relationDescription: truncate(r.relationDescription, PRESENTATION.PRESENTED_RELATION_MAX_CHARS)
    };
  }
  function blockSize(concepts, records) {
    return JSON.stringify(concepts.map(renderConcept)).length + JSON.stringify(records.map(renderRecord)).length;
  }

  // §13 — bounded presentation. Returns {concepts, records} (full stored forms, most recent first)
  // or {error}. Store reads only; never a model call; the whole store is never read.
  async function present() {
    var cr = await deps.store.queryRecentConcepts({ limit: PRESENTATION.PRESENTED_CONCEPTS_MAX });
    if (!cr || cr.status !== 'OK' || !Array.isArray(cr.concepts)) return { error: 'STORE_READ_FAILED' };
    var concepts = cr.concepts.slice().sort(byRecency('conceptId'));
    var records = [];
    if (concepts.length) {
      var rr = await deps.store.queryRecordsByConcepts({
        conceptIdsAny: concepts.slice(0, PRESENTATION.RECORD_QUERY_CONCEPT_IDS).map(function (c) { return c.conceptId; }),
        statuses: CURRENT_STATUSES.slice(),
        limit: PRESENTATION.PRESENTED_RECORDS_MAX
      });
      if (!rr || rr.status !== 'OK' || !Array.isArray(rr.records)) return { error: 'STORE_READ_FAILED' };
      records = rr.records.filter(function (r) { return CURRENT_STATUSES.indexOf(r.status) !== -1; }).sort(byRecency('recordId'));
    }
    // item 3 — add concepts referenced by presented records, most recent first, to the combined cap.
    var presentedIds = {};
    concepts.forEach(function (c) { presentedIds[c.conceptId] = true; });
    var missing = [];
    records.forEach(function (r) { r.conceptIds.forEach(function (id) { if (!presentedIds[id] && missing.indexOf(id) === -1) missing.push(id); }); });
    var fetched = [];
    for (var i = 0; i < missing.length; i += C.LIMITS.MAX_READ_BATCH) {
      var gr = await deps.store.getConcepts({ conceptIds: missing.slice(i, i + C.LIMITS.MAX_READ_BATCH) });
      if (!gr || gr.status !== 'OK' || !Array.isArray(gr.concepts)) return { error: 'STORE_READ_FAILED' };
      fetched = fetched.concat(gr.concepts);
    }
    fetched.sort(byRecency('conceptId')).forEach(function (c) {
      if (concepts.length < PRESENTATION.PRESENTED_CONCEPTS_TOTAL_MAX && !presentedIds[c.conceptId]) {
        concepts.push(c);
        presentedIds[c.conceptId] = true;
      }
    });
    // A record is presented only if every one of its concepts is presented.
    records = records.filter(function (r) { return r.conceptIds.every(function (id) { return presentedIds[id] === true; }); });
    concepts.sort(byRecency('conceptId'));

    // item 5 — drop from the least recent end until the block fits. A concept still referenced by a
    // presented record is never dropped before that record, so the gate always holds every concept
    // of every presented record.
    while (blockSize(concepts, records) > PRESENTATION.PRESENTED_BLOCK_MAX_CHARS && (concepts.length || records.length)) {
      var referenced = {};
      records.forEach(function (r) { r.conceptIds.forEach(function (id) { referenced[id] = true; }); });
      var victim = null;
      records.forEach(function (r) { if (!victim || r.updatedAt <= victim.doc.updatedAt) victim = { kind: 'record', doc: r }; });
      concepts.forEach(function (c) {
        if (referenced[c.conceptId]) return;
        if (!victim || c.updatedAt < victim.doc.updatedAt) victim = { kind: 'concept', doc: c };
      });
      if (!victim) break;
      if (victim.kind === 'record') records = records.filter(function (r) { return r !== victim.doc; });
      else concepts = concepts.filter(function (c) { return c !== victim.doc; });
    }
    return { concepts: concepts, records: records };
  }

  // evaluate(input) — input: {turn, turnUnderstanding, recognition, recentConversationContext,
  // readConsent}. Returns a deep-frozen decision:
  //   {status:'SKIPPED', reason} | {status:'FAILED', reason} | {status:'EVALUATED', turnId, results}
  // At most ONE interpreter call (§25). Never throws.
  async function evaluate(input) {
    try {
      input = isPlainObject(input) ? input : {};
      var boundedTurnText = truncate(input.turn && input.turn.text, PRESENTATION.TURN_MAX_CHARS);
      var pre = checkPreconditions(input, boundedTurnText);
      if (pre) return pre;

      var presented;
      try { presented = await present(); } catch (e) { presented = { error: 'STORE_READ_FAILED' }; }
      if (presented.error) return failedDecision(presented.error);

      var recognition = input.recognition;
      var cpi = recognition.cpi;
      var owned = {
        cpiAssertion: (cpi.recognized === true && cpi.anchor && cpi.anchor.valid === true) ? cpi.anchor.text : null,
        safety: Array.isArray(recognition.safety.ownedSpans) ? recognition.safety.ownedSpans.slice() : []
      };
      var interpreted = await deps.interpreter.interpret({
        turnText: boundedTurnText,
        recentConversationContext: input.recentConversationContext || null,
        concepts: presented.concepts.map(renderConcept),
        records: presented.records.map(renderRecord),
        owned: owned
      });
      if (!interpreted || interpreted.status !== 'OK' || !Array.isArray(interpreted.proposals)) return failedDecision('INTERPRETER_FAILED');

      var gated = deps.gate.evaluate({
        proposals: interpreted.proposals,
        turn: { turnId: input.turn.turnId, text: boundedTurnText },
        presentedConcepts: presented.concepts,
        presentedRecords: presented.records,
        recognition: recognition,
        recentConversationContext: input.recentConversationContext || null
      });
      return deepFreeze({ status: 'EVALUATED', turnId: input.turn.turnId, results: gated.results });
    } catch (e) {
      return failedDecision('COORDINATOR_FAILED');
    }
  }

  var API = {
    configure: configure,
    evaluate: evaluate,
    PRESENTATION: PRESENTATION,
    _internal: { present: present, renderConcept: renderConcept, renderRecord: renderRecord, checkPreconditions: checkPreconditions }
  };

  if (typeof window !== 'undefined') { window.UserStatedIntake = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
