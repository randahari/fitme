// ══════════════════════════════════════════════════════════════════
// FitMe — User Disclosure Recognizer (Friends Alpha Item 6, USER_DISCLOSURE V1)
// Exclusive responsibility: domain-agnostic recognition of a USER_DISCLOSURE from an already-
// classified Turn Understanding result — never a Need, never a Candidate, never a request.
// Structurally parallel to conversationalNeedCreator.js's own Step A (a single, deterministic
// gate over TurnUnderstandingInterpreter's output) but produces a THIRD, independent
// representation: neither a DirectUserNeed nor an UNSUPPORTED outcome.
//
// Preserves DUC-001 Decision 5B unmodified: this module never reads or writes anything related
// to affirmativeRequest/DirectUserNeed, and is never gated on, and never gates,
// ConversationalNeedCreator's own Need recognition (runs independently, in parallel, exactly
// like ExplicitPreferenceStatementInterpreter already does for CPI-001).
//
// Bounded V1 recognition (Product/Architecture binding correction): USER_DISCLOSURE is
// recognized only when at least one of three already-classified, closed signals is present —
// currentStateStatement (Dimension 2, unchanged), desireOnlyPresent (Dimension 4, unchanged), or
// personalDisclosure (Dimension 5, additive, itself closed to CAPACITY_OR_CONSTRAINT |
// COACHING_RELEVANT_EXPERIENCE). This is never a general biography/personal-facts intake — a
// turn where none of the three signals fired is never recognized, regardless of content.
//
// Admission ≠ intervention ≠ persistence: recognizing a USER_DISCLOSURE here decides nothing
// about whether/what to say (decisionFormation.js's own concern) and nothing about whether
// anything is durably captured (safetyDisclosureIntakeGate.js's own, entirely separate concern).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // The single, deterministic recognition gate. Priority order (STATE, then DESIRE, then the
  // Dimension-5 category) only decides which category label is reported when more than one
  // signal happens to be true on the same turn — it never changes whether recognition occurs.
  function recognize(turn, turnUnderstanding, pipelineContext) {
    if (!isPlainObject(turn) || typeof turn.turnId !== 'string' || turn.turnId.length === 0) return null;
    if (!isPlainObject(turnUnderstanding)) return null;
    if (turnUnderstanding.interpretationStatus !== 'CLASSIFIED') return null; // fails closed, mirrors §17 Case C

    var category = null;
    if (turnUnderstanding.currentStateStatement && turnUnderstanding.currentStateStatement.present === true) {
      category = 'STATE';
    } else if (turnUnderstanding.desireOnlyPresent === true) {
      category = 'DESIRE';
    } else if (turnUnderstanding.personalDisclosure && turnUnderstanding.personalDisclosure.present === true) {
      category = turnUnderstanding.personalDisclosure.category; // 'CAPACITY_OR_CONSTRAINT' | 'COACHING_RELEVANT_EXPERIENCE'
    }
    if (!category) return null;

    return freezeShallow({
      recognized: true,
      turnId: turn.turnId,
      category: category
    });
  }

  var API = {
    recognize: recognize
  };

  if (typeof window !== 'undefined') { window.UserDisclosureRecognizer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
