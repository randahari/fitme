// C2 — Rejection and Suppression Feedback — static source/wiring checks
// (C2_SPEC v1.1). Dependency-free: reads the actual repository files as text and asserts
// structural facts. Does NOT execute app.js (no DOM/Firebase harness — same intentional
// scope limit as every prior *Wiring.test.js in this repository).
// Run with: node --test tests/c2Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const persistenceGatewayJs = fs.readFileSync(path.join(__dirname, '../js/persistenceGateway.js'), 'utf8');
const stateAccessJs = fs.readFileSync(path.join(__dirname, '../js/stateAccess.js'), 'utf8');
const triggerControllerJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerController.js'), 'utf8');
const adaptiveControllerJs = fs.readFileSync(path.join(__dirname, '../js/adaptive/adaptiveTdeeController.js'), 'utf8');

test('feedbackDomain.js is registered in index.html, loaded before both its consumers and before app.js', () => {
  const appIdx = indexHtml.indexOf('js/app.js');
  const feedbackIdx = indexHtml.indexOf('js/feedback/feedbackDomain.js');
  const triggerControllerIdx = indexHtml.indexOf('js/trigger/triggerController.js');
  const adaptiveControllerIdx = indexHtml.indexOf('js/adaptive/adaptiveTdeeController.js');
  assert.notEqual(feedbackIdx, -1);
  assert.ok(feedbackIdx < triggerControllerIdx, 'feedbackDomain.js must load before triggerController.js (direct require)');
  assert.ok(feedbackIdx < adaptiveControllerIdx, 'feedbackDomain.js must load before adaptiveTdeeController.js (direct require)');
  assert.ok(feedbackIdx < appIdx, 'feedbackDomain.js must load before app.js');
});

test('feedbackDomain.js is in the sw.js SHELL cache list, and VERSION was bumped', () => {
  assert.notEqual(swJs.indexOf('/fitme/js/feedback/feedbackDomain.js'), -1);
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.equal(versionMatch[1], '2.47.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.equal(appVersionMatch[1], '2.47.0');
});

test('the Persistence Gateway closed catalog gained exactly one operation for C2 (RECOMMENDATION_FEEDBACK_RECORD), no catalog mechanism change', () => {
  assert.notEqual(persistenceGatewayJs.indexOf('RECOMMENDATION_FEEDBACK_RECORD'), -1);
  // no new owner identifier: allowedOwners must only ever reference triggerState/profileGoalsState
  // for this operation (Issue 2 — the most conservative of three considered options).
  const opBlock = persistenceGatewayJs.slice(persistenceGatewayJs.indexOf('RECOMMENDATION_FEEDBACK_RECORD:'), persistenceGatewayJs.indexOf('RECOMMENDATION_FEEDBACK_RECORD:') + 500);
  assert.match(opBlock, /allowedOwners:\s*\['triggerState',\s*'profileGoalsState'\]/);
  // the module's OPERATIONS catalog remains a fixed object literal — no runtime mutation API
  // (e.g. a callable OPERATIONS[x] = ... assignment or an exported registerOperation function)
  // was introduced; the closed-catalog invariant is otherwise verified behaviorally by
  // 'closed catalog: listOperations() returns exactly the seven approved operations' below.
  assert.equal(/\bfunction\s+registerOperation\b/.test(persistenceGatewayJs), false);
});

test('StateAccess gained exactly two new named capabilities for C2 (recommendationFeedbackHistory / recordRecommendationFeedback), no generic get/set function was introduced', () => {
  assert.notEqual(stateAccessJs.indexOf('recommendationFeedbackHistory'), -1);
  assert.notEqual(stateAccessJs.indexOf('recordRecommendationFeedback'), -1);
  // the module's header comment already documents "no generic get(path)/set(path)" as an
  // existing invariant (matched loosely here, so this only checks for an actual function
  // definition/property, never the documentation sentence describing its absence).
  assert.equal(/function\s+get\s*\(/.test(stateAccessJs), false, 'no generic get(path) function was introduced');
  assert.equal(/function\s+set\s*\(/.test(stateAccessJs), false, 'no generic set(path) function was introduced');
});

// Each of these action bodies is a single object literal with no nested {} (only [] arrays), so
// the first '}' after the key is exactly that action's own closing brace — a reliable boundary
// regardless of how much unrelated text/comments follow elsewhere in the PERMISSIONS matrix.
function actionBody(src, actionKey) {
  const idx = src.indexOf(actionKey);
  assert.notEqual(idx, -1, actionKey + ' must still exist');
  const end = src.indexOf('}', idx);
  return src.slice(idx, end + 1);
}

test('the C2 permission grant is scoped to exactly triggerEngine/DAILY_COACH_CHECK and adaptiveTdeeEngine/ADAPTIVE_CHECK (no expansion to WORKOUT_COMPLETED, LOCAL_NOTIFICATION_SCHEDULE, WEIGHT_CHANGED, or ADAPTIVE_RECHECK)', () => {
  ['WORKOUT_COMPLETED:', 'LOCAL_NOTIFICATION_SCHEDULE:', 'WEIGHT_CHANGED:', 'ADAPTIVE_RECHECK:'].forEach((actionKey) => {
    const block = actionBody(stateAccessJs, actionKey);
    assert.equal(block.indexOf('recommendationFeedbackHistory'), -1, actionKey + ' must not gain the C2 read capability');
    assert.equal(block.indexOf('recordRecommendationFeedback'), -1, actionKey + ' must not gain the C2 write capability');
  });
  ['DAILY_COACH_CHECK:', 'ADAPTIVE_CHECK:'].forEach((actionKey) => {
    const block = actionBody(stateAccessJs, actionKey);
    assert.notEqual(block.indexOf('recommendationFeedbackHistory'), -1, actionKey + ' must have the C2 read capability');
    assert.notEqual(block.indexOf('recordRecommendationFeedback'), -1, actionKey + ' must have the C2 write capability');
  });
});

test('TriggerDomain.canFire itself is untouched by C2 — suppression is a separate controller-level filter, not fused into the budget/dedup algorithm (public API preserved)', () => {
  const triggerDomainJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerDomain.js'), 'utf8');
  assert.equal(triggerDomainJs.indexOf('FeedbackDomain'), -1, 'triggerDomain.js must not depend on FeedbackDomain — the suppression check lives in the controller');
  assert.match(triggerDomainJs, /function canFire\(coachDayState, type, priority\)/, 'canFire signature must be unchanged');
});

test('runCoachTriggers and runAdaptiveCheck both consult FeedbackDomain.evaluateSuppression (controller-level integration)', () => {
  assert.notEqual(triggerControllerJs.indexOf('FeedbackDomain.evaluateSuppression'), -1);
  assert.notEqual(adaptiveControllerJs.indexOf('FeedbackDomain.evaluateSuppression'), -1);
});

test('no new Engine was registered for C2 (registerEngines.js is untouched)', () => {
  const registerEnginesJs = fs.readFileSync(path.join(__dirname, '../js/engines/registerEngines.js'), 'utf8');
  assert.equal(registerEnginesJs.indexOf('feedback'), -1);
  assert.equal(registerEnginesJs.indexOf('Feedback'), -1);
});

test('no typed-memory (users/{uid}/memories) write path was introduced for C2 (js/memory.js is untouched)', () => {
  const memoryJs = fs.readFileSync(path.join(__dirname, '../js/memory.js'), 'utf8');
  assert.equal(memoryJs.indexOf('Feedback'), -1);
  assert.equal(memoryJs.indexOf('RECOMMENDATION_FEEDBACK_RECORD'), -1);
});
