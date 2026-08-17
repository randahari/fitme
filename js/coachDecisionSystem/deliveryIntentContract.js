// ══════════════════════════════════════════════════════════════════
// FitMe — Delivery Intent Contract (Expression, D2 Stage 10 — Expression,
// EXPRESSION_SPEC_v1.0.md §11, Canonical Decision CD-EXP-01)
// WP1 of EXPRESSION_IMPLEMENTATION_PLAN.md — resolves EXP-OD-9 (the
// Delivery Intent's literal field-level schema), an Engineering Decision
// Pending per the Specification's own classification (§11.5), not a
// Product/Architecture Canonical Decision.
//
// Scope, restated from the Specification, not redefined here: this module
// defines and validates the Delivery Intent SHAPE only. It does not
// render language, does not decide REFUSAL/ESCALATION/disclosure content,
// and does not dispatch Expression from the Internal Pipeline Orchestrator
// — all of that is later Work Packages' scope (WP2-WP9), not this one's.
// Every field this module accepts is supplied by its caller, already
// computed; this module never originates decision or rendering content
// (D1-CDO-03, EXP-01/EXP-11).
//
// Fixes, per CD-EXP-01 (EXPRESSION_SPEC_v1.0.md §11.2/§11.4):
//   EXP-51 — renderedLanguage:  fully rendered user-facing language.
//   EXP-52 — semanticSignal:    structured, non-prose signal for Coach
//                                Runtime's own presentation/prominence/
//                                disposition-aware decisions, derived only
//                                from the already-closed kind/boundaryType/
//                                safetyDisposition values (never reasonCode
//                                — EXP-33, not currently available on
//                                TerminalDecision; never free text).
//   EXP-53 — correlation:       correlation metadata sufficient to
//                                associate this Delivery Intent with its
//                                originating Terminal Decision, WITHOUT
//                                embedding or duplicating the complete
//                                TerminalDecision object. The concrete
//                                correlation mechanism (how `decisionId`
//                                is generated/derived) is a later Work
//                                Package's own concern (§11.5); this
//                                module only fixes that the field exists
//                                and must be a non-empty, caller-supplied
//                                opaque string.
//
// EXP-56 (prohibited content) is enforced structurally, not by a
// banned-word list: only the three fields above are ever accepted or
// produced. Any other top-level key supplied by a caller — including any
// platform/UI/notification/widget/chat/push/layout/presentation-
// implementation field — is rejected (REJECTED / UNRECOGNIZED_FIELD),
// never silently dropped, never silently accepted.
//
// EXP-50 (cardinality/lifecycle): a Delivery Intent's own `kind` is never
// 'SILENCE' — this module refuses to build one for kind: 'SILENCE',
// consistent with Expression producing no Delivery Intent at all for a
// Silence-kind Terminal Decision (EXP-29). Enforcing that a SILENCE
// Terminal Decision is never even attempted to be dispatched to this
// builder remains the dispatcher's own responsibility (WP2/WP3), not
// this module's — this module is the last defensive check, not the only
// one.
//
// `safetyDisposition` never includes 'DEFERRED': a DEFERRED disposition
// always co-occurs with kind: 'SILENCE' (TASK_006_SPEC_v1.0.md §25.4)
// and therefore never reaches this builder either.
//
// schemaVersion follows the existing memoryLayer.js convention exactly
// (`'coach-decision-system-pipeline-context/1.0'`), per
// TASK_006_SPEC_v1.0.md §25.13.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }

  var SCHEMA_VERSION = 'coach-decision-system-delivery-intent/1.0';

  // Never 'SILENCE' — EXP-50/EXP-29; the four Terminal Decision kinds minus the one that never
  // produces a Delivery Intent at all.
  var KINDS = freezeShallow(['RECOMMENDATION', 'INITIATIVE', 'BOUNDARY']);
  var BOUNDARY_TYPES = freezeShallow(['REFUSAL', 'ESCALATION']);
  // Never 'DEFERRED' — always co-occurs with kind: 'SILENCE' (TASK_006_SPEC_v1.0.md §25.4), which
  // never reaches this builder.
  var SAFETY_DISPOSITIONS = freezeShallow(['UNMODIFIED', 'MODIFIED', 'BLOCKED', 'ESCALATED']);

  var TOP_LEVEL_KEYS = freezeShallow(['renderedLanguage', 'semanticSignal', 'correlation']);
  var SEMANTIC_SIGNAL_KEYS = freezeShallow(['kind', 'boundaryType', 'safetyDisposition']);
  var CORRELATION_KEYS = freezeShallow(['decisionId']);

  function hasOnlyRecognizedKeys(obj, allowed) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (allowed.indexOf(keys[i]) === -1) return false;
    }
    return true;
  }

  function isValidSemanticSignal(signal) {
    if (!isPlainObject(signal)) return false;
    if (!hasOnlyRecognizedKeys(signal, SEMANTIC_SIGNAL_KEYS)) return false;
    if (KINDS.indexOf(signal.kind) === -1) return false;

    var hasBoundaryType = Object.prototype.hasOwnProperty.call(signal, 'boundaryType');
    if (signal.kind === 'BOUNDARY') {
      if (!hasBoundaryType || BOUNDARY_TYPES.indexOf(signal.boundaryType) === -1) return false;
    } else if (hasBoundaryType) {
      return false; // boundaryType present iff kind === 'BOUNDARY' (mirrors TerminalDecision, §25.4)
    }

    var hasSafetyDisposition = Object.prototype.hasOwnProperty.call(signal, 'safetyDisposition');
    if (hasSafetyDisposition && SAFETY_DISPOSITIONS.indexOf(signal.safetyDisposition) === -1) return false;

    return true;
  }

  function isValidCorrelation(correlation) {
    if (!isPlainObject(correlation)) return false;
    if (!hasOnlyRecognizedKeys(correlation, CORRELATION_KEYS)) return false;
    return isNonEmptyString(correlation.decisionId);
  }

  // Validates an already-built (or externally-constructed) candidate Delivery Intent against the
  // full EXP-51/52/53/56/57 shape — the downstream conformance check §29's Delivery Intent
  // content-category tests, and later Work Packages' own consumers, rely on.
  function isValidDeliveryIntent(candidate) {
    if (!isPlainObject(candidate)) return false;
    if (candidate.schemaVersion !== SCHEMA_VERSION) return false;
    if (candidate.immutable !== true) return false;
    if (!isNonEmptyString(candidate.renderedLanguage)) return false;
    if (!isValidSemanticSignal(candidate.semanticSignal)) return false;
    if (!isValidCorrelation(candidate.correlation)) return false;
    var expectedKeys = ['schemaVersion', 'renderedLanguage', 'semanticSignal', 'correlation', 'immutable'];
    return hasOnlyRecognizedKeys(candidate, expectedKeys);
  }

  // Builds and freezes a Delivery Intent from already-computed inputs. Never generates rendered
  // language, never decides semantic-signal content, never derives a correlation identifier —
  // every value is supplied by the caller (a later Work Package), already decided elsewhere.
  // Returns { status: 'BUILT', deliveryIntent } or { status: 'REJECTED', reason: <CODE> },
  // mirroring decisionFormation.js's own FORMED/ABORTED result-wrapping convention.
  function buildDeliveryIntent(params) {
    if (!isPlainObject(params)) {
      return freezeShallow({ status: 'REJECTED', reason: 'INVALID_PARAMS' });
    }
    if (!hasOnlyRecognizedKeys(params, TOP_LEVEL_KEYS)) {
      return freezeShallow({ status: 'REJECTED', reason: 'UNRECOGNIZED_FIELD' });
    }
    if (!isNonEmptyString(params.renderedLanguage)) {
      return freezeShallow({ status: 'REJECTED', reason: 'MISSING_RENDERED_LANGUAGE' });
    }
    if (!isValidSemanticSignal(params.semanticSignal)) {
      return freezeShallow({ status: 'REJECTED', reason: 'INVALID_SEMANTIC_SIGNAL' });
    }
    if (!isValidCorrelation(params.correlation)) {
      return freezeShallow({ status: 'REJECTED', reason: 'INVALID_CORRELATION' });
    }

    // boundaryType/safetyDisposition are included as own properties only when actually present —
    // "absent, not merely falsy/undefined" — mirroring TASK_006_SPEC_v1.0.md §25.4's own
    // "not `null` — absent" discipline for the identical boundaryType field on TerminalDecision.
    var semanticSignal = { kind: params.semanticSignal.kind };
    if (params.semanticSignal.kind === 'BOUNDARY') {
      semanticSignal.boundaryType = params.semanticSignal.boundaryType;
    }
    if (Object.prototype.hasOwnProperty.call(params.semanticSignal, 'safetyDisposition')) {
      semanticSignal.safetyDisposition = params.semanticSignal.safetyDisposition;
    }

    var deliveryIntent = freezeShallow({
      schemaVersion: SCHEMA_VERSION,
      renderedLanguage: params.renderedLanguage,
      semanticSignal: freezeShallow(semanticSignal),
      correlation: freezeShallow({ decisionId: params.correlation.decisionId }),
      immutable: true
    });

    return freezeShallow({ status: 'BUILT', deliveryIntent: deliveryIntent });
  }

  var API = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    KINDS: KINDS,
    BOUNDARY_TYPES: BOUNDARY_TYPES,
    SAFETY_DISPOSITIONS: SAFETY_DISPOSITIONS,
    buildDeliveryIntent: buildDeliveryIntent,
    isValidDeliveryIntent: isValidDeliveryIntent
  };

  if (typeof window !== 'undefined') { window.DeliveryIntentContract = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
