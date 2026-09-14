// TASK-004 — Recommendation Categories tests (CC-03 category vocabulary + D1 Unit 05
// Opportunity Source -> Category/Hierarchy-tier mapping).
// Run with: node --test tests/recommendationCategories.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const RecommendationCategories = require('../js/coachDecisionSystem/recommendationCategories.js');

test('1. CATEGORIES is exactly the four canonical values, in order, and frozen', () => {
  assert.deepEqual(RecommendationCategories.CATEGORIES, ['IMMEDIATE_ACTION', 'PREPARATION', 'RECOVERY', 'SYSTEM_BUILDING']);
  assert.equal(Object.isFrozen(RecommendationCategories.CATEGORIES), true);
});

test('2. isValidCategory accepts only the four canonical values', () => {
  RecommendationCategories.CATEGORIES.forEach((c) => assert.equal(RecommendationCategories.isValidCategory(c), true));
  assert.equal(RecommendationCategories.isValidCategory('NUTRITION'), false);
  assert.equal(RecommendationCategories.isValidCategory(''), false);
  assert.equal(RecommendationCategories.isValidCategory(null), false);
  assert.equal(RecommendationCategories.isValidCategory('immediate_action'), false); // case-sensitive, no fuzzy match
});

test('3. OPPORTUNITY_SOURCES is exactly D1 Unit 05\'s five sources plus DUC-001\'s own Product/Architecture-approved sixth source (docs/specs/DUC_001_SPEC_v1.0.md §07 — "added wherever currently declared as a closed set")', () => {
  assert.deepEqual(RecommendationCategories.OPPORTUNITY_SOURCES, [
    'DECISION_WINDOW', 'CONFIRMED_PATTERN_ANTICIPATION', 'DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'SAFETY_HIGH_RISK', 'DIRECT_USER_REQUEST'
  ]);
});

// DUC-001 Post-Implementation Turn-Serving Correction (Product/Architecture-approved, Decision 2/4,
// frozen this turn) — DIRECT_USER_REQUEST is now the one deliberate, disclosed exception to "every
// source maps to a category/tier": it describes WHY FITME is responding now (turn-causality), never
// a global professional category/hierarchy assertion. See tests 7/8 below for its own, narrow,
// Source x Reason-scoped resolution (owned by initiativeEngine.js, not this file).
const SOURCES_WITH_GLOBAL_MAPPING = RecommendationCategories.OPPORTUNITY_SOURCES.filter((s) => s !== 'DIRECT_USER_REQUEST');

test('4. every opportunity source EXCEPT DIRECT_USER_REQUEST maps to exactly one valid canonical category', () => {
  SOURCES_WITH_GLOBAL_MAPPING.forEach((s) => {
    const c = RecommendationCategories.categoryForSource(s);
    assert.equal(RecommendationCategories.isValidCategory(c), true, 'source ' + s + ' must map to a valid category');
  });
});

test('5. every opportunity source EXCEPT DIRECT_USER_REQUEST maps to a Canonical Decision Hierarchy tier in [1,10]', () => {
  SOURCES_WITH_GLOBAL_MAPPING.forEach((s) => {
    const t = RecommendationCategories.hierarchyTierForSource(s);
    assert.equal(typeof t, 'number');
    assert.ok(t >= 1 && t <= 10, 'tier for ' + s + ' must be in [1,10], got ' + t);
  });
});

test('7. DIRECT_USER_REQUEST has NO global, source-only category mapping (Decision 4 — categoryForSource() is unused by the DUC-001 path; InitiativeCandidate carries no category field)', () => {
  assert.equal(RecommendationCategories.categoryForSource('DIRECT_USER_REQUEST'), null);
});

test('8. DIRECT_USER_REQUEST has NO global, source-only hierarchy-tier mapping (Decision 2 — the narrow DIRECT_USER_REQUEST x ADAPT_TO_CURRENT_STATE -> 5 pair is resolved by initiativeEngine.js\'s own SOURCE_REASON_HIERARCHY_TIER_OVERRIDES, never asserted here at the source-only level)', () => {
  assert.equal(RecommendationCategories.hierarchyTierForSource('DIRECT_USER_REQUEST'), null);
});

test('6. unknown source maps to null category and null tier (never a fabricated default)', () => {
  assert.equal(RecommendationCategories.categoryForSource('NOT_A_SOURCE'), null);
  assert.equal(RecommendationCategories.hierarchyTierForSource('NOT_A_SOURCE'), null);
  assert.equal(RecommendationCategories.categoryForSource(undefined), null);
});

test('9. mapping is deterministic (repeated calls, same input, same output)', () => {
  const a = RecommendationCategories.categoryForSource('SAFETY_HIGH_RISK');
  const b = RecommendationCategories.categoryForSource('SAFETY_HIGH_RISK');
  assert.equal(a, b);
  assert.equal(a, 'IMMEDIATE_ACTION');
});
