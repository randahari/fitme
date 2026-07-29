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

test('3. OPPORTUNITY_SOURCES is exactly D1 Unit 05\'s five sources', () => {
  assert.deepEqual(RecommendationCategories.OPPORTUNITY_SOURCES, [
    'DECISION_WINDOW', 'CONFIRMED_PATTERN_ANTICIPATION', 'DISRUPTION_DETECTION', 'MILESTONE_RECOVERY', 'SAFETY_HIGH_RISK'
  ]);
});

test('4. every opportunity source maps to exactly one valid canonical category', () => {
  RecommendationCategories.OPPORTUNITY_SOURCES.forEach((s) => {
    const c = RecommendationCategories.categoryForSource(s);
    assert.equal(RecommendationCategories.isValidCategory(c), true, 'source ' + s + ' must map to a valid category');
  });
});

test('5. every opportunity source maps to a Canonical Decision Hierarchy tier in [1,10]', () => {
  RecommendationCategories.OPPORTUNITY_SOURCES.forEach((s) => {
    const t = RecommendationCategories.hierarchyTierForSource(s);
    assert.equal(typeof t, 'number');
    assert.ok(t >= 1 && t <= 10, 'tier for ' + s + ' must be in [1,10], got ' + t);
  });
});

test('6. unknown source maps to null category and null tier (never a fabricated default)', () => {
  assert.equal(RecommendationCategories.categoryForSource('NOT_A_SOURCE'), null);
  assert.equal(RecommendationCategories.hierarchyTierForSource('NOT_A_SOURCE'), null);
  assert.equal(RecommendationCategories.categoryForSource(undefined), null);
});

test('7. mapping is deterministic (repeated calls, same input, same output)', () => {
  const a = RecommendationCategories.categoryForSource('SAFETY_HIGH_RISK');
  const b = RecommendationCategories.categoryForSource('SAFETY_HIGH_RISK');
  assert.equal(a, b);
  assert.equal(a, 'IMMEDIATE_ACTION');
});
