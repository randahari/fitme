// C1-WP1 — static source/wiring checks (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP1).
// Dependency-free: reads the actual repository files as text and asserts structural facts.
// Does NOT execute app.js (no DOM/Firebase harness — same intentional scope limit as
// tests/b2Wiring.test.js / tests/b5Wiring.test.js / tests/c1Wp0Characterization.test.js).
// Run with: node --test tests/c1Wp1Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

const FACADES = [
  { name: 'dateKey', body: 'function dateKey(d) { return DateUtils.dateKey(d); }' },
  { name: 'getTodayKey', body: 'function getTodayKey() { return DateUtils.getTodayKey(); }' },
  { name: 'daysBetween', body: 'function daysBetween(k1, k2) { return DateUtils.daysBetween(k1, k2); }' },
  { name: 'linearSlope', body: 'function linearSlope(points) { return NumberUtils.linearSlope(points); }' },
  { name: 'num', body: 'function num(v) { return NumberUtils.num(v); }' },
  { name: 'parseModelJSON', body: 'function parseModelJSON(raw) { return JsonUtils.parseModelJSON(raw); }' },
  { name: 'esc', body: 'function esc(s) { return StringUtils.esc(s); }' },
  { name: 'calcBMI', body: 'function calcBMI(weight, height) { return ProfileMetrics.calcBMI(weight, height); }' },
  { name: 'getBMICategory', body: 'function getBMICategory(bmi) { return ProfileMetrics.getBMICategory(bmi); }' },
  { name: 'calcBodyFat', body: 'function calcBodyFat(weight, height, age, gender) { return ProfileMetrics.calcBodyFat(weight, height, age, gender); }' },
  { name: 'computeProteinTarget', body: 'function computeProteinTarget(weight) { return ProfileMetrics.computeProteinTarget(weight); }' },
  { name: 'dayKcal', body: 'function dayKcal(dayData) { return NutritionModel.dayKcal(dayData); }' },
  { name: 'normalizeItem', body: 'function normalizeItem(it) { return NutritionModel.normalizeItem(it); }' }
];

// Anchored to the start of a line (no leading whitespace): this matches only top-level
// declarations, not the two pre-existing, independently-scoped, IIFE-private `daysBetween`
// helpers inside the Habit Engine (js/app.js, STAGE 6) and Pattern Engine (STAGE 7) IIFEs —
// those are unrelated local functions that happen to share a name; they are out of C1-WP1
// scope (WP1 candidate list names only the top-level `daysBetween`) and untouched.
FACADES.forEach((f) => {
  test('facade "' + f.name + '" is the sole top-level declaration and delegates to its extracted module', () => {
    const count = (appJs.match(new RegExp('^function ' + f.name + '\\(', 'gm')) || []).length;
    assert.equal(count, 1, f.name + ' must have exactly one top-level declaration in app.js (no leftover duplicate)');
    assert.notEqual(appJs.indexOf(f.body), -1, 'expected exact facade body for ' + f.name + ': ' + f.body);
  });
});

test('all six new WP1 modules are registered in index.html, loaded before app.js and after their own dependencies', () => {
  const files = [
    'js/core/dateUtils.js', 'js/core/numberUtils.js', 'js/core/jsonUtils.js',
    'js/core/stringUtils.js', 'js/domain/profileMetrics.js', 'js/domain/nutritionModel.js'
  ];
  const indices = {};
  files.forEach((f) => { indices[f] = indexHtml.indexOf(f); assert.notEqual(indices[f], -1, f + ' script tag must exist'); });
  const appIdx = indexHtml.indexOf('js/app.js');
  files.forEach((f) => { assert.ok(indices[f] < appIdx, f + ' must load before app.js'); });
  assert.ok(indices['js/core/numberUtils.js'] < indices['js/domain/nutritionModel.js'],
    'numberUtils.js (dependency of nutritionModel.js in the browser) must load first');
});

test('all six new WP1 modules are in the sw.js SHELL cache list, and VERSION was bumped', () => {
  const files = [
    '/fitme/js/core/dateUtils.js', '/fitme/js/core/numberUtils.js', '/fitme/js/core/jsonUtils.js',
    '/fitme/js/core/stringUtils.js', '/fitme/js/domain/profileMetrics.js', '/fitme/js/domain/nutritionModel.js'
  ];
  files.forEach((f) => assert.notEqual(swJs.indexOf(f), -1, f + ' must be in the SHELL cache list'));
  const versionMatch = swJs.match(/const VERSION = 'v([\d.]+)'/);
  assert.notEqual(versionMatch, null);
  assert.equal(versionMatch[1], '2.26.0');
});

test('APP_VERSION matches the service worker cache version', () => {
  const appVersionMatch = appJs.match(/const APP_VERSION = '([\d.]+)'/);
  assert.notEqual(appVersionMatch, null);
  assert.equal(appVersionMatch[1], '2.26.0');
});
