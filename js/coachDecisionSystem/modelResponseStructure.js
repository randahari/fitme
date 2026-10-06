// ══════════════════════════════════════════════════════════════════
// FitMe — Model Response Structure (MRS-001, docs/specs/MRS_001_SPEC_v1.0.md §07–§10)
// Exclusive responsibility: the structural boundary between a provider model response and the
// single answer text a Coach Decision System stage interprets. Canonical order (§05):
//
//   provider response → extractAnswerText (this module) → MRE-001 → JSON.parse → stage validation
//
// extractAnswerText(rawResponse, contract) resolves the governing request contract explicitly
// supplied by the calling site (§07.1, §07.3 step 1) — a FROZEN_CONTRACT inventory entry (§10) or an
// EXPLICIT_PROFILE reasoning mode (§08.3) — and returns the text of exactly one block typed 'text',
// or a closed structural failure (§07.5). A block without an explicit string `type` is MALFORMED
// (§07.2): it is never inferred to be answer text. Reasoning blocks are never read and are admitted
// only under reasoning ON. A provider refusal always fails (§06.2 item 6).
//
// Never: concatenates, selects among several texts, repairs, reorders, guesses, parses JSON,
// applies a stop-reason policy other than refusal, defaults a contract, branches on a model id,
// logs, reads a clock or throws. Pure and deterministic. Grants nothing: the extracted text is
// ordinary untrusted text (§05).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var OK = 'OK';
  var FAILED = 'FAILED';
  var FROZEN_CONTRACT = 'FROZEN_CONTRACT';
  var EXPLICIT_PROFILE = 'EXPLICIT_PROFILE';
  var REASONING_MODES = Object.freeze(['OFF', 'ON']);

  // §07.5 — the closed structural failure vocabulary.
  var FAILURES = Object.freeze({
    CONTRACT_UNRESOLVED: 'CONTRACT_UNRESOLVED',
    REFUSAL: 'REFUSAL',
    NOT_A_RESPONSE: 'NOT_A_RESPONSE',
    MALFORMED_BLOCK: 'MALFORMED_BLOCK',
    UNSUPPORTED_BLOCK: 'UNSUPPORTED_BLOCK',
    REASONING_NOT_PERMITTED: 'REASONING_NOT_PERMITTED',
    NO_ANSWER_TEXT: 'NO_ANSWER_TEXT',
    MULTIPLE_ANSWER_TEXT: 'MULTIPLE_ANSWER_TEXT'
  });

  var MODEL = 'claude-haiku-4-5-20251001';
  var KEYS = Object.freeze(['model', 'max_tokens', 'messages']);
  function entry(file, fn, maxTokens, timeoutMs) {
    return Object.freeze({ file: file, fn: fn, model: MODEL, maxTokens: maxTokens, timeoutMs: timeoutMs, keys: KEYS, reasoning: 'OFF' });
  }

  // §10.2 — the canonical FROZEN-CONTRACT inventory (M2). Every entry's response-side reasoning
  // allowance is OFF (§08.2). Entries may only be removed, by the change that migrates the site (M6).
  var FROZEN_CONTRACT_INVENTORY = Object.freeze({
    'F-1': entry('turnUnderstandingInterpreter.js', 'buildRequestBody', 1400, 8000),
    'F-2': entry('explicitPreferenceStatementInterpreter.js', 'classifyBatch', 400, 8000),
    'F-3': entry('explicitRequestInterpreter.js', 'classifyBatch', 400, 8000),
    'F-4': entry('readinessStateInterpreter.js', 'classifyBatch', 300, 8000),
    'F-5': entry('activityPreferenceInterpreter.js', 'classifyBatch', 400, 8000),
    'F-6': entry('activityOppositionInterpreter.js', 'classifyBatch', 400, 8000),
    'F-7': entry('situationalContextInterpreter.js', 'classifyBatch', 300, 8000),
    'F-8': entry('safetyContextInterpreter.js', 'classifyBatch', 400, 8000),
    'F-9': entry('safetyContextInterpreter.js', 'classifyBatchWithStatus', 400, 8000),
    'F-10': entry('safetyContextInterpreter.js', 'classifyCorrectionWithStatus', 200, 8000),
    'F-11': entry('userSafetyProvenanceInterpreter.js', 'classifyBatch', 400, 8000),
    'F-12': entry('riskCharacteristicInterpreter.js', 'classifyCandidateContent', 500, 8000),
    'F-13': entry('riskCharacteristicInterpreter.js', 'classifyTurnForDurableConstraint', 500, 8000),
    'F-14': entry('riskCharacteristicInterpreter.js', 'classifyCorrectionWithStatus', 200, 8000),
    'F-15': entry('riskCharacteristicInterpreter.js', 'classifyCandidateConflictWithFact', 200, 8000),
    'F-16': entry('trainingReadinessReasoningComponent.js', 'propose', 700, 12000),
    'F-17': entry('generalReasoningCapability.js', 'reason', 700, 12000),
    'F-18': entry('semanticContextDiscoveryInterpreter.js', 'buildRequestBody', 400, 6000),
    'F-19': entry('userStatedIntakeInterpreter.js', 'buildRequestBody', 800, 8000)
  });

  function isPlainObject(v) {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
    var proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function exactKeys(o, keys) {
    var own = Object.keys(o);
    return own.length === keys.length && keys.every(function (k) { return has(o, k); });
  }

  // §07.3 step 1 — the allowance ('OFF' | 'ON') or null when the contract does not resolve.
  function resolveAllowance(contract) {
    if (!isPlainObject(contract)) return null;
    if (contract.state === FROZEN_CONTRACT && exactKeys(contract, ['state', 'entry'])) {
      if (typeof contract.entry !== 'string' || !has(FROZEN_CONTRACT_INVENTORY, contract.entry)) return null;
      return FROZEN_CONTRACT_INVENTORY[contract.entry].reasoning;
    }
    if (contract.state === EXPLICIT_PROFILE && exactKeys(contract, ['state', 'reasoning'])) {
      return REASONING_MODES.indexOf(contract.reasoning) !== -1 ? contract.reasoning : null;
    }
    return null;
  }

  // §07.2 — each content element belongs to exactly one class.
  function classify(block) {
    if (!isPlainObject(block) || typeof block.type !== 'string') return 'MALFORMED';
    if (block.type === 'text') return typeof block.text === 'string' ? 'ANSWER_TEXT' : 'MALFORMED';
    if (block.type === 'thinking' || block.type === 'redacted_thinking') return 'REASONING';
    return 'UNSUPPORTED';
  }

  function result(status, text, stopReason, failure, refusal) {
    return Object.freeze({ status: status, text: text, stopReason: stopReason, failure: failure, refusal: refusal });
  }
  function fail(stopReason, failure, refusal) { return result(FAILED, null, stopReason, failure, refusal || null); }

  // §07.1 / §07.3 — never throws, never mutates its input.
  function extractAnswerText(rawResponse, contract) {
    var isObj = isPlainObject(rawResponse);
    var stopReason = (isObj && rawResponse.stop_reason !== undefined) ? rawResponse.stop_reason : null; // §07.6 — unchanged
    var allowance = resolveAllowance(contract);
    if (allowance === null) return fail(stopReason, FAILURES.CONTRACT_UNRESOLVED);
    if (isObj && rawResponse.stop_reason === 'refusal') {
      var sd = rawResponse.stop_details;
      var supplied = isPlainObject(sd);
      return fail(stopReason, FAILURES.REFUSAL, Object.freeze({
        category: (supplied && has(sd, 'category')) ? sd.category : null,
        details: supplied ? sd : null
      }));
    }
    if (!isObj || !Array.isArray(rawResponse.content)) return fail(stopReason, FAILURES.NOT_A_RESPONSE);
    var classes = rawResponse.content.map(classify);
    if (classes.indexOf('MALFORMED') !== -1) return fail(stopReason, FAILURES.MALFORMED_BLOCK);
    if (classes.indexOf('UNSUPPORTED') !== -1) return fail(stopReason, FAILURES.UNSUPPORTED_BLOCK);
    if (classes.indexOf('REASONING') !== -1 && allowance !== 'ON') return fail(stopReason, FAILURES.REASONING_NOT_PERMITTED);
    var answers = [];
    classes.forEach(function (c, i) { if (c === 'ANSWER_TEXT') answers.push(i); });
    if (answers.length === 0) return fail(stopReason, FAILURES.NO_ANSWER_TEXT);
    if (answers.length > 1) return fail(stopReason, FAILURES.MULTIPLE_ANSWER_TEXT);
    return result(OK, rawResponse.content[answers[0]].text, stopReason, null, null);
  }

  var API = {
    extractAnswerText: extractAnswerText,
    FROZEN_CONTRACT_INVENTORY: FROZEN_CONTRACT_INVENTORY,
    FAILURES: FAILURES,
    REASONING_MODES: REASONING_MODES,
    FROZEN_CONTRACT: FROZEN_CONTRACT,
    EXPLICIT_PROFILE: EXPLICIT_PROFILE,
    OK: OK,
    FAILED: FAILED
  };

  if (typeof window !== 'undefined') { window.ModelResponseStructure = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
