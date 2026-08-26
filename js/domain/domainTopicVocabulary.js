// ══════════════════════════════════════════════════════════════════
// FitMe — Domain/Topic Shared Vocabulary (RGEF WP1, RGEF_SPEC_v1.0.md §14)
// Exclusive responsibility: the single, closed, canonical DOMAINS/TOPICS
// value lists — a pure, dependency-free data module, no logic. Promoted
// verbatim from js/derivedIntelligenceConsumer.js (B5), which remains the
// sole owner of its own Habit/Pattern-specific derivation logic
// (mapHabitTopic-equivalent switch, PATTERN_ID_MAP, mapPatternTopic) —
// none of that derivation logic moves here (RGEF_SPEC_v1.0.md §14.1/§14.3).
// A future non-B5 Opportunity source that needs Domain/Topic identity MUST
// derive its own value from this shared vocabulary using its own,
// locally-owned mapping logic — it MUST NOT call into B5's derivation
// functions (§14.3).
//
// Additive-extension only (B5 §12.5 precedent: "the initial implementation
// MAY define only the topic IDs represented by current producer records").
// No value here was invented by RGEF — every value already existed,
// unchanged, in derivedIntelligenceConsumer.js before this promotion.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var DOMAINS = ['NUTRITION', 'WORKOUT', 'WEIGHT', 'MEASUREMENT', 'ENGAGEMENT', 'GENERAL_COACHING'];
  var TOPICS = ['MEAL_TIMING', 'PROTEIN_INTAKE', 'FOOD_LOGGING', 'WORKOUT_FREQUENCY',
    'WEIGH_IN_FREQUENCY', 'WEEKDAY_BEHAVIOR', 'SEQUENCE_BEHAVIOR', 'MEASUREMENT_LOGGING'];

  var API = {
    DOMAINS: DOMAINS,
    TOPICS: TOPICS
  };

  if (typeof window !== 'undefined') { window.DomainTopicVocabulary = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
