// ══════════════════════════════════════════════════════════════════
// FitMe — Recommendation Categories (TASK-004, Stage 2 Canonical Decision)
// אחריות בלעדית: אוצר המילים הסגור של ארבע קטגוריות ההמלצה הקנוניות
// (IMMEDIATE_ACTION/PREPARATION/RECOVERY/SYSTEM_BUILDING — Resolved by
// Canonical Decision, TASK-004 Stage 2, Head of Product + AI Architect,
// docs/specs/TASK_004_SPEC_v1.0.md § Recommendation Categories), ומיפוי
// הנדסי דטרמיניסטי מ-D1 Unit 05 Opportunity Source אל קטגוריה קנונית
// ואל Canonical Decision Hierarchy tier (D1 Unit 02). המיפוי עצמו הוא
// Repository Gap ברמת implementation-time engineering work (לא Product
// Decision נוסף — ר' TASK_004_SPEC_v1.0.md § Recommendation Categories >
// Ownership: "Now that the category list is approved (Stage 2)... this is
// implementation-time engineering work, not a further Product decision").
// אינו ממציא קטגוריה חדשה, אינו ממציא tier חדש מעבר לעשרת הרמות של D1
// Unit 02. מודול טהור — ללא configure(), ללא state, ללא I/O.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Resolved by Canonical Decision — TASK-004 Stage 2 (Head of Product + AI Architect).
  // Do not add, remove, or rename (SPEC "Forbidden Changes").
  var CATEGORIES = Object.freeze(['IMMEDIATE_ACTION', 'PREPARATION', 'RECOVERY', 'SYSTEM_BUILDING']);

  // D1 Unit 05's five canonical Opportunity Sources, transcribed as a closed engineering
  // vocabulary (D1 names these in prose, not as an enum — this is a verbatim transcription,
  // not a new category).
  var OPPORTUNITY_SOURCES = Object.freeze([
    'DECISION_WINDOW',
    'CONFIRMED_PATTERN_ANTICIPATION',
    'DISRUPTION_DETECTION',
    'MILESTONE_RECOVERY',
    'SAFETY_HIGH_RISK'
  ]);

  // Engineering-authored, deterministic mapping (implementation-time work per the SPEC's own
  // Ownership note above — not a further Product decision). No canonical source defines this
  // mapping today; it is provisional and flagged for future Product confirmation (see TASK-004
  // implementation report, Open Items / Follow-up).
  var SOURCE_CATEGORY_MAP = Object.freeze({
    SAFETY_HIGH_RISK: 'IMMEDIATE_ACTION',
    DECISION_WINDOW: 'PREPARATION',
    DISRUPTION_DETECTION: 'PREPARATION',
    CONFIRMED_PATTERN_ANTICIPATION: 'SYSTEM_BUILDING',
    MILESTONE_RECOVERY: 'RECOVERY'
  });

  // D1 Unit 02's 10-tier Canonical Decision Hierarchy (1 Safety ... 10 Product Engagement).
  // Engineering-authored mapping from Opportunity Source to the tier it most directly serves —
  // same provisional/Repository-Gap status as SOURCE_CATEGORY_MAP above.
  var SOURCE_HIERARCHY_TIER_MAP = Object.freeze({
    SAFETY_HIGH_RISK: 1,                // Safety
    MILESTONE_RECOVERY: 3,              // Trust
    CONFIRMED_PATTERN_ANTICIPATION: 4,  // Long-term adherence
    DECISION_WINDOW: 5,                 // Context relevance
    DISRUPTION_DETECTION: 5             // Context relevance
  });

  function isValidCategory(c) { return CATEGORIES.indexOf(c) !== -1; }
  function isValidOpportunitySource(s) { return OPPORTUNITY_SOURCES.indexOf(s) !== -1; }
  function categoryForSource(sourceCategory) { return SOURCE_CATEGORY_MAP[sourceCategory] || null; }
  function hierarchyTierForSource(sourceCategory) {
    return (typeof SOURCE_HIERARCHY_TIER_MAP[sourceCategory] === 'number') ? SOURCE_HIERARCHY_TIER_MAP[sourceCategory] : null;
  }

  var API = {
    CATEGORIES: CATEGORIES,
    OPPORTUNITY_SOURCES: OPPORTUNITY_SOURCES,
    isValidCategory: isValidCategory,
    isValidOpportunitySource: isValidOpportunitySource,
    categoryForSource: categoryForSource,
    hierarchyTierForSource: hierarchyTierForSource
  };

  if (typeof window !== 'undefined') { window.RecommendationCategories = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
