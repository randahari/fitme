// C1-WP0 — Characterization Harness (docs/specs/C1_SPEC_v1.0.md, Work Package C1-WP0).
// Static source/wiring checks. Dependency-free: reads js/app.js as text and asserts
// structural facts about it — final runtime definitions, override chains, window
// assignments, IIFE boundaries, and the closed Firebase/external-API surface. Does NOT
// execute app.js (no DOM/Firebase harness — same intentional scope limit as
// tests/b2Wiring.test.js / tests/b5Wiring.test.js).
//
// Purpose: freeze current behavior (docs/architecture/C1_WP0_INVENTORY.md) before any
// C1 work package moves code. A failure here means either a later work package changed
// behavior it should not have, or the inventory document is stale and must be updated.
//
// Run with: node --test tests/c1Wp0Characterization.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const testsDir = __dirname;

function countMatches(re) {
  return (appJs.match(re) || []).length;
}

// ══════════════════════════════════════════════════════════════════
// 1. Regression baseline
// ══════════════════════════════════════════════════════════════════

test('1. the canonical pre-C1 test suite (11 files) is present at the root-level tests/ layout', () => {
  const expected = [
    'authorityContract.test.js', 'b2Wiring.test.js', 'b5Wiring.test.js',
    'derivedIntelligenceConsumer.test.js', 'derivedIntelligencePrompt.test.js',
    'engineRegistry.test.js', 'habitSingleFlight.test.js', 'nutritionValidator.test.js',
    'persistenceGateway.test.js', 'sessionLifecycle.test.js', 'stateAccess.test.js'
  ];
  expected.forEach((f) => {
    assert.ok(fs.existsSync(path.join(testsDir, f)), f + ' must exist at tests/');
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. Safely-chained overrides — each layer must preserve and call the prior layer
// ══════════════════════════════════════════════════════════════════

function assertChain(name, base, wraps) {
  test('2. override chain "' + name + '" has exactly ' + (wraps.length + 1) + ' runtime definition(s), each wrap preserving the prior', () => {
    assert.match(appJs, base.declPattern, name + ' base declaration must exist');
    const assignCount = countMatches(new RegExp('^\\s*' + name + '\\s*=\\s*(async\\s+)?function', 'gm'));
    assert.equal(assignCount, wraps.length, name + ' must have exactly ' + wraps.length + ' reassignment(s)');
    wraps.forEach((w) => {
      assert.match(appJs, w.capturePattern, name + ': expected a preserved reference "' + w.captureName + '"');
      assert.match(appJs, w.callsPriorPattern, name + ' wrap must call its captured prior definition (' + w.captureName + '())');
    });
  });
}

assertChain('callClaude', { declPattern: /async function callClaude\(body\)/ }, [
  { captureName: '_s5_callClaude', capturePattern: /const _s5_callClaude = callClaude;/, callsPriorPattern: /await _s5_callClaude\(body\)/ }
]);

// C1-WP6 legitimately consolidated buildCoachSystemPrompt's two historical layers (this
// override chain) into one function, CoachPromptComposer.buildSystemPrompt() (intentional —
// "B5 derived-intelligence prompt-fragment integration" is explicit C1-WP6 scope; see
// tests/c1Wp6Wiring.test.js and docs/architecture/C1_WP0_INVENTORY.md §2.1, updated in the
// same commit). It is no longer an override chain in app.js at all — just a single
// one-line async facade, like capQuick()/getSharedBarcodeGroup() and the other WP5-series
// facades. This replaces the assertChain('buildCoachSystemPrompt', ...) call that used to
// live here.
test('2. "buildCoachSystemPrompt" is now a single plain facade (no override chain) — relocated by C1-WP6', () => {
  assert.match(appJs, /async function buildCoachSystemPrompt\(\) \{ return CoachPromptComposer\.buildSystemPrompt\(userProfile, todayData, currentUser\); \}/);
  const assignCount = countMatches(/^\s*buildCoachSystemPrompt\s*=\s*(async\s+)?function/gm);
  assert.equal(assignCount, 0, 'buildCoachSystemPrompt must have zero reassignments now — the override chain was consolidated into CoachPromptComposer.buildSystemPrompt()');
});

// C1-WP10 legitimately consolidated all six of these override chains — each into a single
// authoritative implementation inside a new js/ui/*.js module (intentional — "UI Controllers
// and Override Consolidation" is explicit C1-WP10 scope; see tests/c1Wp10Wiring.test.js and
// docs/architecture/C1_WP0_INVENTORY.md §2.1, updated in the same commit). None of them are
// override chains in app.js any more — each is now a single one-line facade, exactly like
// buildCoachSystemPrompt() was after C1-WP6. This replaces the six assertChain(...) calls
// that used to live here (renderProfile, renderSettings, showMealEditor, renderEditor,
// addMeal, loadUserData).
function assertSingleFacade(section, name, declPattern) {
  test(section + '. "' + name + '" is now a single plain facade (no override chain) — relocated by C1-WP10', () => {
    assert.match(appJs, declPattern, name + ' facade declaration must exist');
    const assignCount = countMatches(new RegExp('^\\s*' + name + '\\s*=\\s*(async\\s+)?function', 'gm'));
    assert.equal(assignCount, 0, name + ' must have zero reassignments now — the override chain was consolidated into a js/ui/*.js module');
  });
}

assertSingleFacade(2, 'renderProfile', /async function renderProfile\(\) \{ return ProfilePresenter\.renderProfile\(\); \}/);
assertSingleFacade(2, 'renderSettings', /function renderSettings\(\) \{ return SettingsPresenter\.renderSettings\(\); \}/);
assertSingleFacade(2, 'showMealEditor', /function showMealEditor\(meal\) \{ return DayNavigationController\.showMealEditor\(meal\); \}/);
assertSingleFacade(2, 'renderEditor', /function renderEditor\(\) \{ return DayNavigationController\.renderEditor\(\); \}/);
assertSingleFacade(2, 'addMeal', /async function addMeal\(\) \{ return DayNavigationController\.addMeal\(\); \}/);
assertSingleFacade(2, 'loadUserData', /async function loadUserData\(\) \{ return DayNavigationController\.loadUserData\(\); \}/);

// ══════════════════════════════════════════════════════════════════
// 3. Silent-replacement overrides (docs/architecture/C1_WP0_INVENTORY.md §2.2) —
// C1-WP10 legitimately consolidated all three into single authoritative implementations
// inside js/ui/navigationController.js and js/ui/homePresenter.js (intentional — see
// tests/c1Wp10Wiring.test.js and docs/architecture/C1_WP0_INVENTORY.md §2.2, updated in the
// same commit). The dead base declarations and the silent-replacement/wrap layers are gone
// from app.js entirely — each is now a single one-line facade, same pattern as section 2
// above. This replaces the three tests that used to live here.
// ══════════════════════════════════════════════════════════════════

assertSingleFacade(3, 'goToScreen', /function goToScreen\(name\) \{ return NavigationController\.goToScreen\(name\); \}/);
assertSingleFacade(3, 'renderHome', /function renderHome\(\) \{ return HomePresenter\.renderHome\(\); \}/);
assertSingleFacade(3, 'renderMealsInHome', /function renderMealsInHome\(\) \{ return HomePresenter\.renderMealsInHome\(\); \}/);

// ══════════════════════════════════════════════════════════════════
// 6. window assignment inventory — closed set (docs/architecture/C1_WP0_INVENTORY.md §3)
// ══════════════════════════════════════════════════════════════════

test('6. window assignments in app.js match the closed WP0 inventory exactly', () => {
  const found = (appJs.match(/window\.(\w+)\s*=/g) || []).map((m) => m.replace(/window\.(\w+)\s*=/, '$1'));
  const expectedProps = [
    '_adaptHistoryCache', 'dayNavPrev', 'dayNavNext', 'dayNavToday',
    'deleteHomeMeal', 'editHomeMeal', 'saveEditedMeal', 'deleteEditedMeal', 'cancelEditedMeal',
    'updateFoodDateBanner', 'runHabitEngine', 'runPatternEngine'
  ];
  const foundUnique = Array.from(new Set(found)).sort();
  assert.deepEqual(foundUnique, expectedProps.slice().sort(),
    'a new or removed window.* assignment was found — update docs/architecture/C1_WP0_INVENTORY.md §3 and this test together');
  assert.equal(found.length, 13, 'total window.* assignment sites (including the two for _adaptHistoryCache) must be 13');
});

// ══════════════════════════════════════════════════════════════════
// 7. IIFE boundary map (docs/architecture/C1_WP0_INVENTORY.md §4)
// ══════════════════════════════════════════════════════════════════

// C1-WP9 relocated the Habit Engine, Pattern Engine, and B2 Engine Registration IIFEs out
// of app.js into js/engines/habitEngine.js, js/engines/patternEngine.js, and
// js/engines/registerEngines.js (+ js/engines/adaptiveTdeeEngineAdapter.js /
// js/engines/triggerEngineAdapter.js) — intentional, per docs/specs/C1_SPEC_v1.0.md
// §C1-WP9. C1-WP10 then relocated the last remaining top-level IIFE — the Day Navigation
// IIFE — into js/ui/dayNavigationController.js (intentional, per docs/specs/C1_SPEC_v1.0.md
// §C1-WP10; see tests/c1Wp10Wiring.test.js for the up-to-date module-contract assertions and
// docs/architecture/C1_WP0_INVENTORY.md §4, updated in the same commit). app.js therefore now
// contains zero top-level IIFEs — every extracted module keeps its own single top-level IIFE
// instead (verified in tests/c1Wp9Wiring.test.js / tests/c1Wp10Wiring.test.js).
test('7. app.js contains zero top-level IIFEs (Day Navigation — the last one — moved to js/ui/dayNavigationController.js in C1-WP10)', () => {
  const count = countMatches(/^\(function\s*\(\s*\)\s*\{/gm);
  assert.equal(count, 0, 'expected no top-level IIFEs left in app.js; Day Navigation/Habit Engine/Pattern Engine/B2 Engine Registration IIFEs all relocated out of app.js');
});

// C1-WP10 relocated the entire Day Navigation IIFE (date-nav bar, food-date banner,
// loadDay/shiftDay, dayNavPrev/Next/Today, deleteHomeMeal/editHomeMeal/saveEditedMeal/
// deleteEditedMeal/cancelEditedMeal, and the showMealEditor/renderEditor/addMeal/
// loadUserData consolidations) out of app.js into js/ui/dayNavigationController.js — see the
// prior test and tests/c1Wp10Wiring.test.js. What remains in app.js is only the public
// loadUserData() facade and the nine window.* compatibility facades the WP0 inventory locks
// in (test 6, above) — this test replaces the old "Day Navigation IIFE region" test.
test('8. app.js keeps only loadUserData() and the nine Day Navigation window facades — no IIFE body remains', () => {
  assert.match(appJs, /async function loadUserData\(\) \{ return DayNavigationController\.loadUserData\(\); \}/);
  const windowFacades = [
    'dayNavPrev', 'dayNavNext', 'dayNavToday', 'deleteHomeMeal', 'editHomeMeal',
    'saveEditedMeal', 'deleteEditedMeal', 'cancelEditedMeal', 'updateFoodDateBanner'
  ];
  windowFacades.forEach((name) => {
    const pattern = new RegExp('window\\.' + name + ' = function [\\s\\S]{0,20}?\\{ return DayNavigationController\\.' + name + '\\(');
    assert.match(appJs, pattern, 'window.' + name + ' must be a one-line facade delegating to DayNavigationController.' + name + '()');
  });
  // none of the IIFE's internal helpers (private to the module now) leak back into app.js
  ['MAX_PAST_DAYS', 'function keyToDate', 'function ensureDateNav', 'function applyDayViewChrome'].forEach((needle) => {
    assert.equal(appJs.indexOf(needle), -1, needle + ' must no longer appear in js/app.js');
  });
});

test('9. Habit Engine and Pattern Engine IIFEs each expose exactly one run function to window', () => {
  assert.match(appJs, /window\.runHabitEngine = runHabitEngine;/);
  assert.match(appJs, /window\.runPatternEngine = runPatternEngine;/);
  assert.equal(countMatches(/window\.runHabitEngine\s*=/g), 1);
  assert.equal(countMatches(/window\.runPatternEngine\s*=/g), 1);
});

// ══════════════════════════════════════════════════════════════════
// 10. Dependency surface — Firebase collections and external endpoints (closed sets)
// ══════════════════════════════════════════════════════════════════

// C1-WP3 relocated most Firestore collection access out of app.js into dedicated
// repository modules (js/repositories/*.js) — intentional, per
// docs/specs/C1_SPEC_v1.0.md §C1-WP3. Two direct references remain in app.js by
// design: 'users'/'days' inside PersistenceGateway.configure's injected callbacks
// (the sole authoritative meal-write path, explicitly excluded from WP3) and
// 'users' inside resetApp() (account deletion, not a named WP3 responsibility).
// This test now asserts the closed set of 7 collection names exists verbatim
// across app.js + the five repository files combined, instead of app.js alone.
test('10. Firebase collections referenced in app.js + WP3 repositories match the closed WP0 inventory exactly', () => {
  const repoFiles = [
    'js/repositories/profileRepository.js', 'js/repositories/dayRepository.js',
    'js/repositories/favoritesRepository.js', 'js/repositories/groupRepository.js',
    'js/repositories/barcodeRepository.js'
  ];
  const combined = appJs + repoFiles.map((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n');
  const found = (combined.match(/collection\('([a-zA-Z]+)'\)/g) || []).map((m) => m.replace(/collection\('([a-zA-Z]+)'\)/, '$1'));
  const expected = ['data', 'days', 'groupBarcodes', 'groups', 'members', 'products', 'users'];
  const foundUnique = Array.from(new Set(found)).sort();
  assert.deepEqual(foundUnique, expected,
    'a new or removed Firestore collection reference was found — update docs/architecture/C1_WP0_INVENTORY.md §5.1 and this test together');
});

// C1-WP2 relocated all three external endpoints out of app.js into dedicated platform
// adapters (js/adapters/claudeProxyClient.js, openFoodFactsClient.js,
// barcodeScannerAdapter.js) — intentional, per docs/specs/C1_SPEC_v1.0.md §C1-WP2. This
// test now asserts the endpoints exist verbatim in their new homes instead of in app.js.
test('11. external network endpoints exist verbatim in their C1-WP2 adapter homes (relocated from app.js)', () => {
  const claudeProxyJs = fs.readFileSync(path.join(__dirname, '../js/adapters/claudeProxyClient.js'), 'utf8');
  const offJs = fs.readFileSync(path.join(__dirname, '../js/adapters/openFoodFactsClient.js'), 'utf8');
  const barcodeJs = fs.readFileSync(path.join(__dirname, '../js/adapters/barcodeScannerAdapter.js'), 'utf8');
  assert.match(claudeProxyJs, /var CLAUDE_PROXY_URL = 'https:\/\/us-central1-fitme-f9289\.cloudfunctions\.net\/anthropicProxy';/);
  assert.match(offJs, /var BASE_URL = 'https:\/\/world\.openfoodfacts\.org\/api\/v0\/product\/';/);
  assert.match(barcodeJs, /var LIBRARY_URL = 'https:\/\/unpkg\.com\/html5-qrcode@2\.3\.8\/html5-qrcode\.min\.js';/);
  assert.equal(appJs.indexOf('CLAUDE_PROXY_URL'), -1, 'CLAUDE_PROXY_URL must no longer be defined in app.js');
  assert.equal(appJs.indexOf('world.openfoodfacts.org'), -1, 'the Open Food Facts endpoint must no longer be defined in app.js');
  assert.equal(appJs.indexOf('unpkg.com/html5-qrcode'), -1, 'the html5-qrcode CDN endpoint must no longer be defined in app.js');
});
