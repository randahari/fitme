// TASK-008 WP10 — Composition Rules: inline-style-override classification tests
// (TASK_008_SPEC_v1.0.md §19.2; docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP10).
// Pure classification/regression guard — no visible change is made by this Work Package.
// Verifies: the total inline `style=` count in index.html (40, matching original evidence)
// and js/*.js (43, correcting the original 35-instance count) remain exactly as classified;
// the seven catalog-component instances in index.html still use their catalog class; the
// seven catalog-adjacent near-duplicates in js/*.js remain unmigrated (recorded as future
// candidates only, not touched here).
// Run with: node --test tests/compositionInlineStyleAudit.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function countInlineStyles(source) {
  return (source.match(/style="[^"]*"/g) || []).length;
}

const JS_FILES = [
  'js/app.js',
  'js/adaptive/adaptiveTdeeController.js',
  'js/nutrition/barcodeFlowController.js',
  'js/nutrition/mealEditorPresenter.js',
  'js/ui/dayNavigationController.js',
  'js/ui/foodScreenPresenter.js',
  'js/ui/homePresenter.js',
  'js/ui/profilePresenter.js'
];

test('index.html has exactly 40 inline style= occurrences, matching original evidence', () => {
  assert.equal(countInlineStyles(html), 40);
});

test('every catalog-component instance in index.html still uses its catalog class, unmigrated', () => {
  const expected = [
    { line: /class="btn-ghost" style="width:auto;padding:8px 12px;margin:0"/ },
    { line: /class="btn-small" onclick="logMeasurements\(\)" style="width:100%;margin-bottom:24px"/ },
    { line: /class="btn-ghost" onclick="dismissQuickLearn\(\)" style="margin-top:0"/ },
    { line: /class="btn-primary" onclick="getWeeklyLetter\(\)" style="margin-top:8px"/ },
    { line: /class="btn-ghost" onclick="testCoachMessage\(\)" style="margin-top:10px"/ },
    { line: /class="btn-danger" onclick="signOut\(\)" style="margin-top:20px"/ },
    { line: /class="btn-danger" onclick="resetApp\(\)" style="margin-top:8px;margin-bottom:32px"/ }
  ];
  for (const { line } of expected) {
    assert.match(html, line);
  }
});

test('js/*.js inline style= occurrences total 43 across the eight files known to contain them (corrects the original 35-count evidence)', () => {
  let total = 0;
  for (const rel of JS_FILES) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    total += countInlineStyles(content);
  }
  assert.equal(total, 43, 'total inline style= count across js/*.js changed since WP10\'s classification');
});

test('the seven catalog-adjacent near-duplicates remain unmigrated (recorded as future candidates only)', () => {
  const barcode = fs.readFileSync(path.join(ROOT, 'js/nutrition/barcodeFlowController.js'), 'utf8');
  const mealEditor = fs.readFileSync(path.join(ROOT, 'js/nutrition/mealEditorPresenter.js'), 'utf8');
  const dayNav = fs.readFileSync(path.join(ROOT, 'js/ui/dayNavigationController.js'), 'utf8');

  assert.match(barcode, /style="width:100%;padding:14px;background:var\(--gold\);color:#fff;border:none;border-radius:12px/, 'the .btn-primary-shaped near-duplicate must remain unmigrated');
  assert.match(barcode, /style="width:100%;padding:12px;background:none;color:var\(--text-2\);border:none;font-size:14px/, 'the .btn-ghost-shaped near-duplicate must remain unmigrated');
  assert.match(mealEditor, /border-radius:20px;padding:5px 12px;font-size:12px;font-weight:500;margin-bottom:10px/, 'the badge-shaped near-duplicate must remain unmigrated');
  const iconBtnShaped = (dayNav.match(/border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer/g) || []).length;
  assert.equal(iconBtnShaped, 2, 'both .icon-btn-shaped near-duplicates must remain unmigrated, at their own 38px size');
});
