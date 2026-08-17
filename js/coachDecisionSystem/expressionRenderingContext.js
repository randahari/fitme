// ══════════════════════════════════════════════════════════════════
// FitMe — Expression Rendering Context Contract (D2 Unit 04 Stage 10,
// Amendment 1; D3 Decision 7, extending D3 Decision 3; EXPRESSION_SPEC_v1.0.md
// §10.1, Canonical Decision 8)
// WP4 (remainder) of EXPRESSION_IMPLEMENTATION_PLAN.md — resolves the
// Repository Gap the accepted Architecture investigation confirmed:
// D1-PER-03 required a non-decision, tone/framing-only signal
// (Relationship Maturity Stage) that neither TerminalDecision nor
// Expression's original single-input declaration could carry.
//
// Scope, restated from the Specification, not redefined here: this module
// defines and validates the Expression Rendering Context SHAPE only — the
// narrow, closed, second declared Stage-10 input, distinct from Pipeline
// Context itself. It does not compute, infer, resolve, or estimate a
// Relationship Maturity Stage of its own; every value it accepts is
// supplied by its caller (the Memory Layer, memoryLayer.js), already
// computed there. This module never originates the value it validates —
// exactly the same discipline deliveryIntentContract.js (WP1) already
// establishes for the Delivery Intent's own shape.
//
// EXP-74 (closed shape): schemaVersion, relationshipMaturityStage — and
// nothing else. No `immutable` payload field — immutability is enforced
// structurally (Object.freeze below), never carried as contract data
// (approved adjustment to the original proposal).
// EXP-75 (prohibited content) is enforced structurally, not by a
// banned-word list: only the one recognized field above is ever accepted
// or produced. Any other top-level key — including decision content,
// ranking/priority information, rationale, Safety decision authority
// (reasonCode/reasonDetail), platform/UI information, any other Pipeline
// Context member, or unrelated user state — is rejected
// (REJECTED / UNRECOGNIZED_FIELD), never silently dropped or accepted.
// EXP-78 (extensibility): a future field is added only when a specific,
// already-approved Expression requirement needs a further tone/framing-
// only signal — never speculatively. This module's own closed key list is
// the structural enforcement of that discipline, not merely a comment.
//
// schemaVersion follows the existing memoryLayer.js/deliveryIntentContract.js
// convention exactly.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  var SCHEMA_VERSION = 'coach-decision-system-expression-rendering-context/1.0';

  // Closed vocabulary — the four canonical Relationship Maturity stages (Constitution §12.2,
  // D1 Unit 04) plus 'UNKNOWN' (memoryLayer.js's own honest-absence value, per the pre-existing,
  // separate, non-blocking TASK-005 Relationship Maturity source gap — Section 36 item E-2 /
  // CD-T005-01 — not addressed or resolved by this module).
  var RELATIONSHIP_MATURITY_STAGES = freezeShallow(['UNKNOWN', 'OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']);

  var TOP_LEVEL_KEYS = freezeShallow(['relationshipMaturityStage']);

  function hasOnlyRecognizedKeys(obj, allowed) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (allowed.indexOf(keys[i]) === -1) return false;
    }
    return true;
  }

  // Validates an already-built (or externally-constructed) candidate Expression Rendering
  // Context against the full EXP-74/75 shape — the boundary-level defensive validation EXP-77
  // requires, both at the Orchestrator's dispatch point and, defensively, inside Expression's own
  // rendering module.
  function isValidExpressionRenderingContext(candidate) {
    if (!isPlainObject(candidate)) return false;
    if (candidate.schemaVersion !== SCHEMA_VERSION) return false;
    if (RELATIONSHIP_MATURITY_STAGES.indexOf(candidate.relationshipMaturityStage) === -1) return false;
    var expectedKeys = ['schemaVersion', 'relationshipMaturityStage'];
    return hasOnlyRecognizedKeys(candidate, expectedKeys);
  }

  // Builds and freezes an Expression Rendering Context from an already-computed
  // relationshipMaturityStage value — never generates, infers, or estimates one itself. Returns
  // { status: 'BUILT', expressionRenderingContext } or { status: 'REJECTED', reason: <CODE> },
  // mirroring deliveryIntentContract.js's own BUILT/REJECTED result-wrapping convention.
  function buildExpressionRenderingContext(params) {
    if (!isPlainObject(params)) {
      return freezeShallow({ status: 'REJECTED', reason: 'INVALID_PARAMS' });
    }
    if (!hasOnlyRecognizedKeys(params, TOP_LEVEL_KEYS)) {
      return freezeShallow({ status: 'REJECTED', reason: 'UNRECOGNIZED_FIELD' });
    }
    if (RELATIONSHIP_MATURITY_STAGES.indexOf(params.relationshipMaturityStage) === -1) {
      return freezeShallow({ status: 'REJECTED', reason: 'INVALID_RELATIONSHIP_MATURITY_STAGE' });
    }

    var expressionRenderingContext = freezeShallow({
      schemaVersion: SCHEMA_VERSION,
      relationshipMaturityStage: params.relationshipMaturityStage
    });

    return freezeShallow({ status: 'BUILT', expressionRenderingContext: expressionRenderingContext });
  }

  var API = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    RELATIONSHIP_MATURITY_STAGES: RELATIONSHIP_MATURITY_STAGES,
    buildExpressionRenderingContext: buildExpressionRenderingContext,
    isValidExpressionRenderingContext: isValidExpressionRenderingContext
  };

  if (typeof window !== 'undefined') { window.ExpressionRenderingContext = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
