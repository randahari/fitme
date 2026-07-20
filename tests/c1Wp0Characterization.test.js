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

assertChain('renderProfile', { declPattern: /async function renderProfile\(\)/ }, [
  { captureName: '_s4_renderProfile', capturePattern: /const _s4_renderProfile = renderProfile;/, callsPriorPattern: /await _s4_renderProfile\(\)/ }
]);

assertChain('renderSettings', { declPattern: /function renderSettings\(\)/ }, [
  { captureName: '_origRenderSettings', capturePattern: /const _origRenderSettings = renderSettings;/, callsPriorPattern: /_origRenderSettings\(\)/ },
  { captureName: '_s4_renderSettings', capturePattern: /const _s4_renderSettings = renderSettings;/, callsPriorPattern: /_s4_renderSettings\(\)/ },
  { captureName: '_s5_renderSettings_u', capturePattern: /const _s5_renderSettings_u = renderSettings;/, callsPriorPattern: /_s5_renderSettings_u\(\)/ }
]);

assertChain('showMealEditor', { declPattern: /function showMealEditor\(meal\)/ }, [
  { captureName: '_showMealEditor', capturePattern: /const _showMealEditor = showMealEditor;/, callsPriorPattern: /_showMealEditor\(meal\)/ }
]);

assertChain('renderEditor', { declPattern: /function renderEditor\(\)/ }, [
  { captureName: '_renderEditor', capturePattern: /const _renderEditor = renderEditor;/, callsPriorPattern: /_renderEditor\(\)/ }
]);

assertChain('addMeal', { declPattern: /async function addMeal\(\)/ }, [
  { captureName: '_addMeal', capturePattern: /const _addMeal = addMeal;/, callsPriorPattern: /_addMeal\(\)/ }
]);

assertChain('loadUserData', { declPattern: /async function loadUserData\(\)/ }, [
  { captureName: '_loadUserData', capturePattern: /const _loadUserData = loadUserData;/, callsPriorPattern: /await _loadUserData\(\)/ }
]);

// ══════════════════════════════════════════════════════════════════
// 3. Silent-replacement overrides — known, frozen dead code (docs/architecture/C1_WP0_INVENTORY.md §2.2)
// ══════════════════════════════════════════════════════════════════

test('3. goToScreen: base declaration is dead code; final runtime definition is the day-navigation-wrapped version', () => {
  assert.match(appJs, /function goToScreen\(name\)/, 'base declaration must still exist (frozen, unreachable)');
  const assignCount = countMatches(/^\s*goToScreen\s*=\s*function/gm);
  assert.equal(assignCount, 2, 'goToScreen must have exactly 2 reassignments: one silent replacement, one proper wrap');
  assert.match(appJs, /const _goToScreen = goToScreen;/, 'the final layer must preserve a reference to the silently-replaced layer');
  assert.match(appJs, /_goToScreen\(name\)/, 'the final layer must call the preserved reference');
});

test('4. renderHome: base declaration is dead code; final runtime definition is the day-navigation-wrapped version', () => {
  assert.match(appJs, /function renderHome\(\)/, 'base declaration must still exist (frozen, unreachable)');
  const assignCount = countMatches(/^\s*renderHome\s*=\s*function/gm);
  assert.equal(assignCount, 2, 'renderHome must have exactly 2 reassignments: one silent replacement, one proper wrap');
  assert.match(appJs, /const _renderHome = renderHome;/, 'the final layer must preserve a reference to the silently-replaced layer');
  assert.match(appJs, /_renderHome\(\)/, 'the final layer must call the preserved reference');
});

test('5. renderMealsInHome: base declaration is dead code; single silent-replacement layer is the final runtime definition', () => {
  assert.match(appJs, /function renderMealsInHome\(\)/, 'base declaration must still exist (frozen, unreachable)');
  const assignCount = countMatches(/^\s*renderMealsInHome\s*=\s*function/gm);
  assert.equal(assignCount, 1, 'renderMealsInHome must have exactly 1 reassignment (no third layer exists today)');
});

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

test('7. exactly four top-level IIFEs exist in app.js', () => {
  const count = countMatches(/^\(function\s*\(\s*\)\s*\{/gm);
  assert.equal(count, 4, 'expected the Day Navigation, Habit Engine, Pattern Engine, and B2 Engine Registration IIFEs only');
});

test('8. the Day Navigation IIFE (js/app.js:3071 region) contains its full documented compatibility and override surface, entirely before the Habit Engine IIFE begins', () => {
  const dayNavAnchorIdx = appJs.indexOf('window.dayNavPrev');
  const habitEngineAnchorIdx = appJs.indexOf('STAGE 6 / TASK-002');
  assert.notEqual(dayNavAnchorIdx, -1, 'window.dayNavPrev must exist');
  assert.notEqual(habitEngineAnchorIdx, -1, 'Habit Engine STAGE 6 marker must exist');
  assert.ok(dayNavAnchorIdx < habitEngineAnchorIdx, 'Day Navigation IIFE must appear entirely before the Habit Engine IIFE');

  // functions the Day Navigation IIFE wraps with a preserved capture (renderMealsInHome is
  // excluded — its wrap in this IIFE is the silent replacement itself, no capture exists).
  const wrappedWithCapture = {
    renderHome: '_renderHome', goToScreen: '_goToScreen', showMealEditor: '_showMealEditor',
    renderEditor: '_renderEditor', addMeal: '_addMeal', loadUserData: '_loadUserData'
  };
  Object.keys(wrappedWithCapture).forEach((fn) => {
    const captureName = wrappedWithCapture[fn];
    const idx = appJs.indexOf('const ' + captureName + ' = ' + fn + ';');
    assert.ok(idx !== -1, 'expected "const ' + captureName + ' = ' + fn + ';" inside the Day Navigation IIFE');
    assert.ok(idx > dayNavAnchorIdx - 200 && idx < habitEngineAnchorIdx,
      captureName + ' capture must sit within the Day Navigation IIFE region');
  });

  // renderMealsInHome's silent-replacement layer must also sit in this same region.
  const renderMealsIdx = appJs.lastIndexOf('renderMealsInHome = function ()');
  assert.ok(renderMealsIdx > dayNavAnchorIdx - 200 && renderMealsIdx < habitEngineAnchorIdx,
    'renderMealsInHome silent-replacement layer must sit within the Day Navigation IIFE region');
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
