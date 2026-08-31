// ══════════════════════════════════════════════════════════════════
// FitMe — Contextual Meaning Policy (G-2, docs/specs/G2_SPEC_v1.0.md §19-21;
// Coach Semantic Foundation Canonical Decision Package CSF-02 through CSF-11, Ch.26)
// אחריות בלעדית: שתי פונקציות טהורות, stateless — (1) פירוש Observation תוך Context זמין
// למבנה ContextualMeaning (§19-20); (2) מיפוי (Observation + ContextualMeaning) ל-Product
// Reason Policy (§21.1) — 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION' | 'NO_VALID_REASON',
// הכלל האחד המאושר ל-v1 (CSF Ch.26). אינו: Engine, collaborator, Registry entry, StateAccess
// reader, Pipeline Context assembler, Opportunity creator, Eligibility authority, Trust
// authority, או orchestration authority (CSF-08, closed constraint list, verbatim). מוזמן
// אך ורק ע"י ה-Stage-3 contributor המזהה (Initiative Engine, initiativeEngine.js Section 32)
// — האחריות הסמנטית נשארת אצל הקורא, לעולם לא עוברת ל-utility המשותף (CSF-08).
//
// Contextual Meaning אינה כותבת ל-Pipeline Context (CSF-09) — היא ephemeral, מקומית לצעד
// Stage-3 אחד של Decision Pass אחד. NOT_CONSULTED / UNAVAILABLE / UNCERTAIN הם שלושה מצבים
// נבדלים שלעולם אינם מתמזגים (G2_SPEC §16/§19-20) — קטגוריה שהכלל אינו קורא לה כלל היא
// NOT_CONSULTED ולעולם אינה מאכלסת basis.unavailableOrUncertain.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── §21.1 — Product Reason Policy: הכלל האחד המאושר ל-v1 (CSF Ch.26), ממצה — אין ענף אחר.
  var VALID_REASON_CATEGORIES = [
    'PREVENT_PREDICTABLE_MISTAKE', 'HELP_BEFORE_DIFFICULT_DECISION', 'CELEBRATE_MEANINGFUL_PROGRESS',
    'SUPPORT_RECOVERY', 'PREPARE_FOR_FORESEEABLE_CHALLENGE', 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION',
    'PROTECT_STATED_LONG_TERM_GOALS'
  ];

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }

  // G2_SPEC §20's exact V1 rule condition — the only Observation class this policy interprets
  // with a non-UNKNOWN/non-fabricated basis.
  function isV1FoodLoggingWeakening(observation) {
    return !!observation && observation.sourceType === 'HABIT' && observation.topic === 'FOOD_LOGGING'
      && observation.lifecycle === 'WEAKENING';
  }

  // §20 basis.priorEstablishmentBasis — the exact fixed string G2_SPEC §20 specifies, cited only
  // when the V1 rule's condition holds AND the real, persisted CSF Ch.29 establishment fact is
  // present. Never derived from statusOf()'s branch order (the superseded Ch.27.1 basis), and
  // never from everEstablishedHistorically/firstEstablishedAt (not authoritative here — CSF Ch.29
  // PD-HL-05). Historical-ever establishment is never used as current authority anywhere in this
  // module.
  var PRIOR_ESTABLISHMENT_BASIS_V1 =
    'provenance.currentEpisodeEstablished === true (Habit Engine Current-Episode Establishment ' +
    'Authority, CSF Ch.29 AD-HL-02) — the current, uninterrupted lifecycle episode has itself ' +
    'earned confirmed-tier authority (occ>=OCC_CONFIRMED(5) and conf>=CONF_CONFIRMED(0.55) held ' +
    'within this episode), independent of statusOf()\'s branch ordering alone.';

  // ══════════════════════════════════════════════════════════════════
  // ── §19-20 — Contextual Meaning construction ──
  // ══════════════════════════════════════════════════════════════════
  // computeContextualMeaning(observation, pipelineContext) → ContextualMeaning | null
  // Returns null (not a fabricated/default ContextualMeaning) for a malformed observation — the
  // caller (Initiative Engine, §32) treats this exactly as it treats any other construction
  // failure: the signal contributes nothing to semanticOpportunities, no crash, no invention.
  function computeContextualMeaning(observation, pipelineContext) {
    if (!isPlainObject(observation) || typeof observation.sourceType !== 'string'
      || typeof observation.lifecycle !== 'string') {
      return null;
    }
    pipelineContext = pipelineContext || {};

    var basisObservation = freezeShallow({
      sourceType: observation.sourceType,
      signalId: observation.id,
      domain: observation.domain,
      topic: observation.topic,
      lifecycle: observation.lifecycle,
      confidence: observation.confidence, // current, honestly decayed — never inflated (CSF Ch.26.4/27.2)
      evidence: freezeShallow({ count: observation.evidence && observation.evidence.count }),
      temporal: freezeShallow({
        firstObservedAt: observation.temporal && observation.temporal.firstObservedAt,
        lastObservedAt: observation.temporal && observation.temporal.lastObservedAt,
        expectedIntervalDays: observation.temporal && observation.temporal.expectedIntervalDays
      })
    });

    if (isV1FoodLoggingWeakening(observation)) {
      // §20: Trajectory WORSENING (direct from the real Habit lifecycle degradation, CSF Ch.26.4);
      // Alignment UNKNOWN (no Goal comparison performed for this rule — CSF-04's own worked
      // example: a Trajectory-only finding is real Meaning even absent a Goal comparison,
      // resolving UNKNOWN, not an assessed-and-found-neutral NEUTRAL).
      var established = !!(observation.provenance && observation.provenance.currentEpisodeEstablished === true);
      // CSSC-001 (docs/specs/CSSC_001_SPEC_v1.0.md §11-§13) — the one approved, narrow Product
      // Reason Policy extension: this V1 rule ONLY may additively consult Situational Context as
      // NON-CAUSAL BACKGROUND. situationalContextBackground is a categorically separate field
      // from priorEstablishmentBasis (the actual Reason-basis field, above) — it is never merged
      // into it and never read by deriveValidReasonCategory() below, so it cannot alter
      // Alignment/Trajectory/validReasonCategory/Evidence Tier by construction, not merely by
      // convention. No causal claim is ever made or implied by this field's presence.
      var situationalItems = (pipelineContext.situationalContext && Array.isArray(pipelineContext.situationalContext.items))
        ? pipelineContext.situationalContext.items : [];
      var situationalConsulted = situationalItems.length > 0;
      return freezeShallow({
        alignment: 'UNKNOWN',
        trajectory: 'WORSENING',
        basis: freezeShallow({
          observation: basisObservation,
          // Only populated when the real, persisted establishment fact is actually present —
          // never fabricated for a signal that merely matches sourceType/topic/lifecycle without it.
          priorEstablishmentBasis: established ? PRIOR_ESTABLISHMENT_BASIS_V1 : null,
          contextConsulted: freezeShallow({
            goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED',
            situationalContext: situationalConsulted ? 'CONSULTED' : 'NOT_CONSULTED'
          }),
          // Non-causal only — never a Reason/cause signal, never read by deriveValidReasonCategory.
          situationalContextBackground: situationalConsulted
            ? freezeShallow({ items: freezeShallow(situationalItems.map(function (it) {
                return freezeShallow({ statementText: it.statementText, sourceMemoryId: it.sourceMemoryId });
              })) })
            : null,
          // Both G-2 categories remain NOT_CONSULTED for this rule (never read at all), never
          // UNAVAILABLE/UNCERTAIN for this specific rule regardless of Pipeline Context's own
          // availability map (§16/§19-20 — NOT_CONSULTED never populates unavailableOrUncertain).
          unavailableOrUncertain: freezeShallow([])
        })
      });
    }

    // Every other Observation: no V1 rule interprets it with non-UNKNOWN Meaning. Alignment/
    // Trajectory resolve UNKNOWN honestly (CSF-04) — never fabricated. contextConsulted remains
    // NOT_CONSULTED for both categories (no rule below reads them yet); priorEstablishmentBasis is
    // null (no establishment claim is made for a non-V1 Observation).
    return freezeShallow({
      alignment: 'UNKNOWN',
      trajectory: 'UNKNOWN',
      basis: freezeShallow({
        observation: basisObservation,
        priorEstablishmentBasis: null,
        contextConsulted: freezeShallow({ goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED' }),
        unavailableOrUncertain: freezeShallow([])
      })
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── §21.1 — Product Reason Policy ──
  // ══════════════════════════════════════════════════════════════════
  // deriveValidReasonCategory(observation, contextualMeaning) →
  //   'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION' | 'NO_VALID_REASON'
  //
  // Exhaustive V1 rule body (§21.1, verbatim): the exact, narrow condition CSF Ch.26.1/26.3
  // approves. Every other Observation — including ACTIVE/CONFIRMED signals of any domain/topic,
  // any non-FOOD_LOGGING WEAKENING, and (defensively, though excluded upstream at B5) a
  // Pattern-derived FOOD_LOGGING WEAKENING — resolves NO_VALID_REASON, because no Product Reason
  // Policy rule exists for them (CSF Ch.13, Ch.26.6). The real, persisted establishment fact is
  // required, not merely the lifecycle label — a WEAKENING signal whose ContextualMeaning was not
  // constructed with the established basis (priorEstablishmentBasis === null) resolves
  // NO_VALID_REASON, never REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION.
  function deriveValidReasonCategory(observation, contextualMeaning) {
    if (!isV1FoodLoggingWeakening(observation)) return 'NO_VALID_REASON';
    if (!isPlainObject(contextualMeaning) || !isPlainObject(contextualMeaning.basis)
      || contextualMeaning.basis.priorEstablishmentBasis == null) {
      return 'NO_VALID_REASON';
    }
    return 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION';
  }

  var API = {
    VALID_REASON_CATEGORIES: VALID_REASON_CATEGORIES,
    computeContextualMeaning: computeContextualMeaning,
    deriveValidReasonCategory: deriveValidReasonCategory
  };

  if (typeof window !== 'undefined') { window.ContextualMeaningPolicy = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
