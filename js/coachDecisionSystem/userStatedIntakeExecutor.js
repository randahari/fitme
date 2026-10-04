// ══════════════════════════════════════════════════════════════════
// FitMe — User-Stated Intake Executor (USI-001, docs/specs/USI_001_SPEC_v1.0.md §17-§18)
// Exclusive responsibility: turn the gate-approved plans of one USI decision into User Knowledge
// store operations — the CLIENT store for user_stated targets and new knowledge, the governed
// correction port (trusted SERVER boundary, §18.3) for FITME-sourced targets. It never selects,
// widens or narrows a target, never reads a clock, never throws, and adds nothing on top of the
// plan except the CPI-001 Typed Memory evidence reference (§16.3), and only after that record was
// persisted (§18.1-§18.2). Every E.0.2c consent, validation and authority rule still applies.
//
// NODE-ONLY in this Work Item (testable-not-live): not script-tagged, not referenced by the
// shell, and never required by the coordinator. Shell wiring belongs to live activation (§18.4).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = (typeof module !== 'undefined' && module.exports)
    ? require('./userKnowledgeContract.js')
    : window.UserKnowledgeContract;

  var CLIENT_OPERATIONS = Object.freeze(['createRecord', 'supersede', 'retractRecord', 'forgetRecord']);
  var GOVERNED_OPERATIONS = Object.freeze(['correctInferredKnowledge', 'retractRecord', 'forgetRecord']);

  var deps = { clientStore: null, governedCorrectionPort: null };
  function configure(injected) {
    var d = injected || {};
    deps = { clientStore: d.clientStore || null, governedCorrectionPort: d.governedCorrectionPort || null };
  }

  function isPlainObject(v) { return C.isPlainObject(v); }
  function clone(o) {
    if (Array.isArray(o)) return o.map(clone);
    if (o !== null && typeof o === 'object') {
      var out = {};
      Object.keys(o).forEach(function (k) { out[k] = clone(o[k]); });
      return out;
    }
    return o;
  }
  function outcome(index, status, code) {
    var o = { proposalIndex: index, status: status };
    if (code !== undefined) o.code = code;
    return Object.freeze(o);
  }

  // §16.3 — adds {kind:'TYPED_MEMORY_RECORD', ref:<CPI memory id>} to the draft's supporting
  // evidence (NEW: draft; CORRECT of user_stated targets: successor).
  function withCpiEvidence(request, memoryId) {
    var r = clone(request);
    var draft = r.draft || r.successor;
    draft.evidence = draft.evidence || {};
    draft.evidence.supporting = (draft.evidence.supporting || []).concat([{ kind: 'TYPED_MEMORY_RECORD', ref: memoryId }]);
    return r;
  }

  function mapStoreResult(index, res) {
    var status = res && res.status;
    if (status === 'COMMITTED') return outcome(index, 'COMMITTED');
    if (status === 'DELETED') return outcome(index, 'DELETED');
    if (status === 'CONFLICT') return outcome(index, 'CONFLICT');
    if (status === 'NO_CHANGE') return outcome(index, 'NO_CHANGE');
    if (status === 'REJECTED') return outcome(index, 'REJECTED', res.code);
    return outcome(index, 'FAILED', typeof status === 'string' ? status : 'FAILED');
  }

  async function executePlan(index, plan, cpiRecord) {
    var request = plan.request;
    if (plan.requiresCpiRecord === true) {
      var persisted = isPlainObject(cpiRecord) && cpiRecord.persisted === true
        && typeof cpiRecord.memoryId === 'string' && C.EVIDENCE_REF_PATTERN.test(cpiRecord.memoryId);
      if (!persisted) return outcome(index, 'SKIPPED', 'CPI_RECORD_NOT_PERSISTED');
      if (plan.route !== 'CLIENT') return outcome(index, 'REJECTED', 'INVALID_CPI_REFERENCE');
      request = withCpiEvidence(request, cpiRecord.memoryId);
    } else {
      request = clone(request);
    }
    var target;
    if (plan.route === 'CLIENT') {
      if (CLIENT_OPERATIONS.indexOf(plan.storeOperation) === -1) return outcome(index, 'FAILED', 'INVALID_PLAN');
      target = deps.clientStore;
    } else if (plan.route === 'GOVERNED') {
      if (GOVERNED_OPERATIONS.indexOf(plan.storeOperation) === -1) return outcome(index, 'FAILED', 'INVALID_PLAN');
      target = deps.governedCorrectionPort;
    } else {
      return outcome(index, 'FAILED', 'INVALID_PLAN');
    }
    if (!target || typeof target[plan.storeOperation] !== 'function') return outcome(index, 'FAILED', 'NOT_CONFIGURED');
    var res;
    try { res = await target[plan.storeOperation](request); } catch (e) { return outcome(index, 'FAILED', 'FAILED'); }
    return mapStoreResult(index, res);
  }

  // execute({decision, cpiRecord:{persisted, memoryId}}) -> {status, outcomes}. Proposals are
  // independent after the gate's cross-proposal rules (§17.3): one failure never undoes another's
  // committed effect, and every outcome is reported. Never throws.
  async function execute(params) {
    try {
      params = isPlainObject(params) ? params : {};
      var decision = params.decision;
      if (!isPlainObject(decision) || decision.status !== 'EVALUATED' || !Array.isArray(decision.results)) {
        return Object.freeze({ status: 'NO_DECISION', outcomes: Object.freeze([]) });
      }
      var outcomes = [];
      for (var i = 0; i < decision.results.length; i++) {
        var r = decision.results[i];
        var index = (r && typeof r.proposalIndex === 'number') ? r.proposalIndex : i;
        if (!r || r.status !== 'ACCEPTED' || !isPlainObject(r.plan)) {
          outcomes.push(outcome(index, 'REJECTED', r && r.code));
          continue;
        }
        try { outcomes.push(await executePlan(index, r.plan, params.cpiRecord)); }
        catch (e) { outcomes.push(outcome(index, 'FAILED', 'FAILED')); }
      }
      return Object.freeze({ status: 'EXECUTED', outcomes: Object.freeze(outcomes) });
    } catch (e) {
      return Object.freeze({ status: 'FAILED', outcomes: Object.freeze([]) });
    }
  }

  var API = { configure: configure, execute: execute };

  if (typeof window !== 'undefined') { window.UserStatedIntakeExecutor = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
