# C1-WP0 — Characterization Harness and Repository Inventory

**Governing specification:** `docs/specs/C1_SPEC_v1.0.md` (canonical content v1.1), Work Package C1-WP0
**Status:** COMPLETE
**Repository baseline:** FITME client `2.24.0`, `js/app.js` 4,453 lines
**Purpose:** Freeze current runtime behavior before any C1 code movement begins. This document, together with `tests/c1Wp0Characterization.test.js`, is the WP0 output required by the specification (final-runtime-definition and override-chain inventory, `window` assignment and compatibility-facade inventory, dependency map, regression baseline).

No product code was moved to produce this document. No behavior was changed.

---

## 1. Regression Baseline

Verified by direct execution at WP0 completion time:

```
node --test tests/*.test.js
→ 262 passed / 0 failed
```

All 11 pre-existing test files are present at the canonical root-level `tests/` layout:
`authorityContract.test.js`, `b2Wiring.test.js`, `b5Wiring.test.js`, `derivedIntelligenceConsumer.test.js`, `derivedIntelligencePrompt.test.js`, `engineRegistry.test.js`, `habitSingleFlight.test.js`, `nutritionValidator.test.js`, `persistenceGateway.test.js`, `sessionLifecycle.test.js`, `stateAccess.test.js`.

This baseline is re-asserted structurally by `tests/c1Wp0Characterization.test.js` (test 1) so that a future work package silently losing or relocating a test file is caught immediately.

---

## 2. Final-Runtime-Definition and Override-Chain Inventory

For every identified override chain: the original definition, each later replacement/wrapper in source order, and the final runtime definition. "Silent replacement" means the later assignment does **not** capture or call the prior definition — the earlier code is unreachable dead code even though it remains physically present in the file.

### 2.1 Safely-chained overrides (each layer calls the prior layer)

| Function | Base definition | Wrap 1 | Wrap 2 | Wrap 3 | Final runtime definition |
|---|---|---|---|---|---|
| `callClaude` | `js/app.js:6` | `js/app.js:2935` (`_s5_callClaude`, usage tracking) | — | — | line 2935 |
| `buildCoachSystemPrompt` | `js/app.js:349` | `js/app.js:2962` (`_s5_buildCoachSystemPrompt`, B5 derived-intelligence fragment) | — | — | **[C1-WP6]** No longer an override chain. Both layers were consolidated into `js/coach/coachPromptComposer.js`'s `buildSystemPrompt()`; `js/app.js` now has a single one-line facade (`async function buildCoachSystemPrompt() { return CoachPromptComposer.buildSystemPrompt(userProfile, todayData, currentUser); }`), no reassignment. See `tests/c1Wp6Wiring.test.js`. |
| `renderProfile` | `js/app.js:1834` | `js/app.js:2621` (`_s4_renderProfile`, adds `renderMeasurements()`) | — | — | **[C1-WP10]** No longer an override chain. Both layers were consolidated into `js/ui/profilePresenter.js`'s `renderProfile()`; `js/app.js` now has a single one-line facade (`async function renderProfile() { return ProfilePresenter.renderProfile(); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |
| `renderSettings` | `js/app.js:1924` | `js/app.js:2091` (`_origRenderSettings`, adds plan targets) | `js/app.js:2627` (`_s4_renderSettings`, adds adaptive settings) | `js/app.js:2998` (`_s5_renderSettings_u`, adds usage display) | **[C1-WP10]** No longer an override chain. All four layers were consolidated, in the same call order, into `js/ui/settingsPresenter.js`'s `renderSettings()`; `js/app.js` now has a single one-line facade (`function renderSettings() { return SettingsPresenter.renderSettings(); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |
| `showMealEditor` | `js/app.js:1075` | `js/app.js:3204` (`_showMealEditor`, resets edit-mode flag) | — | — | **[C1-WP10]** No longer an override chain. Both layers were consolidated into `js/ui/dayNavigationController.js`'s `showMealEditor()`; `js/app.js` now has a single one-line facade (`function showMealEditor(meal) { return DayNavigationController.showMealEditor(meal); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |
| `renderEditor` | `js/app.js:1127` | `js/app.js:3263` (`_renderEditor`, adds edit-mode action buttons) | — | — | **[C1-WP10]** No longer an override chain. Both layers were consolidated into `js/ui/dayNavigationController.js`'s `renderEditor()`; `js/app.js` now has a single one-line facade (`function renderEditor() { return DayNavigationController.renderEditor(); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |
| `addMeal` | `js/app.js:1286` | `js/app.js:3222` (`_addMeal`, routes to `saveEditedMeal()` when editing) | — | — | **[C1-WP10]** No longer an override chain. Both layers were consolidated into `js/ui/dayNavigationController.js`'s `addMeal()`; `js/app.js` now has a single one-line facade (`async function addMeal() { return DayNavigationController.addMeal(); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |
| `loadUserData` | `js/app.js:183` | `js/app.js:3304` (`_loadUserData`, resets day-navigation state, session-guarded) | — | — | **[C1-WP10]** No longer an override chain. The base definition was renamed `_loadUserDataCore()` and injected into `js/ui/dayNavigationController.js`'s `loadUserData()`, which reproduces the wrap's session-guarded day-navigation-state reset; `js/app.js` now has a single one-line facade (`async function loadUserData() { return DayNavigationController.loadUserData(); }`), no reassignment. See `tests/c1Wp10Wiring.test.js`. |

The first row (`callClaude`) and `buildCoachSystemPrompt` (already consolidated by C1-WP6, see the row above) were out of C1-WP10 scope and remain as documented. The other six chains were consolidated by C1-WP10 as noted above — each was safe to inline in full because every wrap preserved the prior definition via an explicit local `const _xxx = <name>;` capture and called it, so the consolidated body reproduces the exact original call order.

### 2.2 Silent-replacement overrides — consolidated by C1-WP10

| Function | Base definition (was DEAD, unreachable at runtime) | Silent replacement (was) | Later proper wrap (was) | Current status |
|---|---|---|---|---|
| `goToScreen` | `js/app.js:602` | `js/app.js:2014` (comment: "OVERRIDE: goToScreen (4-tab version)"; did not call line 602) | `js/app.js:3297` (`_goToScreen`, properly wrapped line 2014's version; refreshed food date banner) | **[C1-WP10]** Consolidated into `js/ui/navigationController.js`'s `goToScreen()` (the silent-replacement layer's body plus the wrap's food-date-banner refresh, inlined in original call order). `js/app.js` now has a single one-line facade (`function goToScreen(name) { return NavigationController.goToScreen(name); }`), no reassignment, and the dead base definition no longer exists anywhere. See `tests/c1Wp10Wiring.test.js`. |
| `renderHome` | `js/app.js:517` | `js/app.js:2029` (comment: "OVERRIDE: renderHome with ring"; did not call line 517) | `js/app.js:3172` (`_renderHome`, properly wrapped line 2029's version; added date-nav chrome) | **[C1-WP10]** Consolidated into `js/ui/homePresenter.js`'s `renderHome()` (the ring-rendering layer's body, calling `js/ui/dayNavigationController.js`'s `applyHomeChrome()` at the end in place of the wrap's `ensureDateNav()`/`applyDayViewChrome()` calls). `js/app.js` now has a single one-line facade (`function renderHome() { return HomePresenter.renderHome(); }`), no reassignment, and the dead base definition no longer exists anywhere. See `tests/c1Wp10Wiring.test.js`. |
| `renderMealsInHome` | `js/app.js:540` | `js/app.js:3179` (comment labels it "עטיפת renderMealsInHome" / "wrapper", but the body was a full replacement with no preserved reference) | *(none — this was the final layer)* | **[C1-WP10]** Consolidated into `js/ui/homePresenter.js`'s `renderMealsInHome()` (the final silent-replacement layer's body, unchanged). `js/app.js` now has a single one-line facade (`function renderMealsInHome() { return HomePresenter.renderMealsInHome(); }`), no reassignment, and the dead base definition no longer exists anywhere. See `tests/c1Wp10Wiring.test.js`. |

**Engineering note (historical):** `js/app.js:517`, `602`, and `540` were dead code before C1-WP10. This section previously warned that a work package extracting "the `renderHome`/`goToScreen`/`renderMealsInHome` implementation" by reading the file top-to-bottom and taking the first definition it finds would silently ship a regression — C1-WP10 followed the explicit rule ("do not extract or consolidate any superseded navigation definition as though it were authoritative") and extracted from the **final runtime definition** column above, not the dead base. The dead base definitions no longer exist in `js/app.js` at all (removed, not merely superseded) — see `tests/c1Wp10Wiring.test.js` and `tests/c1Wp0Characterization.test.js`.

---

## 3. `window` Assignment and Compatibility-Facade Inventory

Complete list of explicit `window.X = ...` assignments in `js/app.js` (13 assignment sites, 12 distinct properties):

| Property | Assignment site(s) | Owner | Purpose |
|---|---|---|---|
| `window._adaptHistoryCache` | `js/app.js:99` (init to `null`), `js/app.js:4164` (`StateAccess.configure` → `setAdaptHistoryCache`) | Adaptive TDEE | runtime cache, not durable |
| `window.dayNavPrev` | `js/app.js:3153` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.dayNavNext` | `js/app.js:3154` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.dayNavToday` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.deleteHomeMeal` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.editHomeMeal` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.saveEditedMeal` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.deleteEditedMeal` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.cancelEditedMeal` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline `onclick` compatibility entry point |
| `window.updateFoodDateBanner` | `js/app.js` (facade, `js/ui/dayNavigationController.js` for the implementation — see §4) | Day Navigation Controller | inline compatibility entry point |
| `window.runHabitEngine` | `js/app.js:3633` | Habit Engine IIFE | exposes IIFE-private function to the outer scope for `EngineRegistry` adapter wiring |
| `window.runPatternEngine` | `js/app.js:4067` | Pattern Engine IIFE | exposes IIFE-private function to the outer scope for `EngineRegistry` adapter wiring |

This set is closed and asserted exhaustively by `tests/c1Wp0Characterization.test.js` — any new `window.*` assignment added by a later work package without updating this table will fail that test. **[C1-WP10]** All nine Day Navigation `window.*` assignments remain in `js/app.js` (per this repository's established compatibility-facade convention — see e.g. `window.runHabitEngine`/`window.runPatternEngine`, which likewise stayed in `js/app.js` after C1-WP9 relocated their implementations), but each is now a one-line facade delegating to `DayNavigationController.<name>()`; the implementation itself lives in `js/ui/dayNavigationController.js`. The property names, assignment count (13 sites / 12 properties), and their status as *the* runtime entry points are otherwise unchanged. See `tests/c1Wp10Wiring.test.js`.

---

## 4. IIFE Boundary Map

**[C1-WP10]** `js/app.js` now contains **zero** top-level `(function () { ... })();` blocks — the Day Navigation IIFE (row 1, below) was the last one remaining after C1-WP9, and C1-WP10 relocated it in full into `js/ui/dayNavigationController.js`, which keeps its own single top-level IIFE (same pattern as the four `js/engines/*.js` modules). The table below is retained as a historical snapshot of where each IIFE originated; the "Current location" column records where each now actually lives.

| # | WP0-baseline range (`js/app.js`) | Identity | `window` exports | Current location | Notes |
|---|---|---|---|---|---|
| 1 | `3071`–`3311` | **Day Navigation IIFE** (unnamed in source comments) | `dayNavPrev`, `dayNavNext`, `dayNavToday`, `deleteHomeMeal`, `editHomeMeal`, `saveEditedMeal`, `deleteEditedMeal`, `cancelEditedMeal`, `updateFoodDateBanner` (all still assigned from `js/app.js` as facades — see §3) | **[C1-WP10]** `js/ui/dayNavigationController.js` | Implements viewing/editing past days on the home/food screens. Owns `renderHome`'s date-nav chrome (exposed as `applyHomeChrome()`, called from `js/ui/homePresenter.js`) and the consolidated `showMealEditor`/`renderEditor`/`addMeal`/`loadUserData` (see §2.1). `currentDayKey`/`realTodayData`/`realWaterCount`/`editingExisting` remain shared mutable state owned by `js/app.js` (not IIFE-private — they are read by other `js/app.js` functions such as `saveTodayData`/`buildWeekChart`/`updateStreak`), injected into the controller via getter/setter closures, same pattern as `_adaptProposal`/`coachCardShown` elsewhere. See `tests/c1Wp10Wiring.test.js`. |
| 2 | `3345`–`~3640` | **Habit Engine IIFE** (STAGE 6 / TASK-002, comment at `3328`) | `runHabitEngine` (assigned from `js/app.js` as a facade) | **[C1-WP9]** `js/engines/habitEngine.js` | Producer logic for the Habit Derived Intelligence View (B1/B5 scope). See `tests/c1Wp9Wiring.test.js`. |
| 3 | `3658`–`~4310` | **Pattern Engine IIFE** (STAGE 7 / TASK-003, comment at `3641`) | `runPatternEngine` (assigned from `js/app.js` as a facade) | **[C1-WP9]** `js/engines/patternEngine.js` | Producer logic for the Pattern Derived Intelligence View (B1/B5 scope). See `tests/c1Wp9Wiring.test.js`. |
| 4 | `4317`–`4453` (EOF) | **B2 Engine Registration IIFE** | *(none)* | **[C1-WP9]** `js/engines/registerEngines.js` (+ `js/engines/adaptiveTdeeEngineAdapter.js` / `js/engines/triggerEngineAdapter.js`) | Registers all four B2 engines (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`) with `EngineRegistry.register()`. See `tests/c1Wp9Wiring.test.js`. |

IIFEs 2–4 are governed by the closed B1–B5 contracts and were relocated by C1-WP9 (Habit and Pattern Engine Extraction). IIFE 1 (Day Navigation) had no prior architectural documentation anywhere in the repository before this inventory and was relocated by C1-WP10 (UI Controllers and Override Consolidation) per the updated specification.

---

## 5. Dependency Map — Critical Flows

### 5.1 Firebase collections referenced directly in `js/app.js` (closed set, 7 collection names)

`users`, `days` (subcollection of `users/{uid}`), `data` (subcollection of `users/{uid}`, used for `favorites`), `groups`, `members` (subcollection of `groups/{code}`), `groupBarcodes`, `products` (subcollection of `groupBarcodes/{key}`).

No other collection name is referenced by `js/app.js` at WP0 baseline. This set is asserted exhaustively by the characterization test.

**Updated by C1-WP3:** most access to these 7 collection names moved out of `js/app.js`
into dedicated repository modules, per `docs/specs/C1_SPEC_v1.0.md` §C1-WP3 (Profile/Day/
Favourites/Group/Barcode Repositories). The literal collection names are unchanged; only
their location moved. Two references remain directly in `js/app.js` by design: `users`/`days`
inside `PersistenceGateway.configure`'s injected callbacks (the sole authoritative meal-write
path, explicitly excluded from WP3 per spec — "B4 operations remain in PersistenceGateway
and are not duplicated here"), and `users` inside `resetApp()` (account deletion, not a named
WP3 responsibility). `tests/c1Wp0Characterization.test.js` was updated in the same commit to
assert the closed set across `js/app.js` + the five repository files combined, instead of
`js/app.js` alone. The WP0-baseline location of each collection is preserved below alongside
its current (post-WP3) location(s), consistent with the historical-preservation treatment
used in §5.2/§5.3.

| Collection | WP0 baseline location | Current (post-WP3) location(s) |
|---|---|---|
| `users` | `js/app.js` | `js/repositories/profileRepository.js`, `js/repositories/dayRepository.js`, `js/repositories/favoritesRepository.js`, `js/repositories/groupRepository.js`; also remains in `js/app.js` (`PersistenceGateway.configure`, `resetApp()`) |
| `days` (subcollection of `users/{uid}`) | `js/app.js` | `js/repositories/dayRepository.js`; also remains in `js/app.js` (`PersistenceGateway.configure`) |
| `data` (subcollection of `users/{uid}`) | `js/app.js` | `js/repositories/favoritesRepository.js` |
| `groups` | `js/app.js` | `js/repositories/groupRepository.js` |
| `members` (subcollection of `groups/{code}`) | `js/app.js` | `js/repositories/groupRepository.js` |
| `groupBarcodes` | `js/app.js` | `js/repositories/barcodeRepository.js` |
| `products` (subcollection of `groupBarcodes/{key}`) | `js/app.js` | `js/repositories/barcodeRepository.js` |

### 5.2 External network endpoints (closed set, 3 endpoints)

**Updated by C1-WP2:** all three endpoints were intentionally relocated out of `js/app.js`
into dedicated platform adapters, per `docs/specs/C1_SPEC_v1.0.md` §C1-WP2 (External Food
Catalog Adapter, Claude Proxy Client). The literal values are unchanged; only their location
moved. `tests/c1Wp0Characterization.test.js` was updated in the same commit to assert the
new locations instead of `js/app.js`. The WP0-baseline location of each endpoint is preserved
below alongside its current (post-WP2) location, consistent with the historical-preservation
treatment used in §5.3.

| Endpoint | Constant / literal | WP0 baseline location | Current (post-WP2) location | Purpose |
|---|---|---|---|---|
| Claude proxy | `CLAUDE_PROXY_URL = 'https://us-central1-fitme-f9289.cloudfunctions.net/anthropicProxy'` | `js/app.js:3` | `js/adapters/claudeProxyClient.js` | AI nutrition/coach requests |
| Open Food Facts | `BASE_URL = 'https://world.openfoodfacts.org/api/v0/product/'` | `js/app.js:1007` | `js/adapters/openFoodFactsClient.js` | barcode fallback lookup |
| html5-qrcode CDN | `LIBRARY_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'` | `js/app.js:845` | `js/adapters/barcodeScannerAdapter.js` | dynamically loaded barcode scanner library, pinned version |

### 5.3 DOM ID surface

127 unique `document.getElementById(...)` references existed in `js/app.js` at WP0 baseline; 126 remain after C1-WP2 (`startCamera`/`startLabelCamera` now call `ImageAdapter.triggerFileInput('camera-input')` instead of resolving the element directly — the element-lookup mechanic moved into the adapter, camera activation behavior is unchanged). This count is a descriptive snapshot, not an enforced invariant. A full per-ID listing is deferred to the work package that first touches each screen (WP5–WP10), consistent with the specification's incremental-extraction model; enumerating all 127 in this document would not add engineering value beyond what `grep -oE "getElementById\('[a-zA-Z0-9_-]+'\)" js/app.js` already provides on demand. The Day Navigation IIFE's own DOM surface (`meals-list`, `food-result`, plus the date-nav banner elements it creates/toggles) is characterized structurally by `tests/c1Wp0Characterization.test.js`.

### 5.4 Existing test coverage vs. gap

Existing tests (`sessionLifecycle`, `nutritionValidator`, `authorityContract`, `engineRegistry`, `habitSingleFlight`, `b2Wiring`, `stateAccess`, `persistenceGateway`, `derivedIntelligenceConsumer`, `derivedIntelligencePrompt`, `b5Wiring`) cover the pure/isolated B1–B5 modules and their wiring into `js/app.js` at the contract level. None of them execute `js/app.js` itself (it is a browser script and cannot be `require()`'d — see e.g. `tests/stateAccess.test.js` header comment), and none characterize the DOM-dependent flows named in the WP0 exit gate (meal editor/commit UI, auth/session bootstrap, home/navigation rendering, day navigation). `tests/c1Wp0Characterization.test.js` closes this gap at the structural level (function/override/window-assignment/dependency-surface characterization via static source inspection), matching the repository's existing convention for `app.js`-touching tests (`b2Wiring.test.js`, `b5Wiring.test.js`). Full DOM/Firebase behavioral characterization would require a browser or mock DOM/Firestore test harness, which does not exist in the repository today and is not required by WP0 ("no product code movement except test seams if strictly required"); introducing one is left to the work package that first needs it (per §12.2, dependency injection is required before such a harness is meaningful).

---

## 6. WP0 Exit Gate — Status

| Exit Gate Requirement | Status |
|---|---|
| Complete final-runtime-definition inventory reviewed | ✅ §2 |
| Every override chain has one explicitly identified final runtime implementation | ✅ §2.1, §2.2 |
| Day Navigation IIFE and its callable compatibility surface mapped | ✅ §3, §4 (row 1) |
| Critical meal, auth/session, engine, adaptive, coach, navigation, and day-navigation flows have baseline tests | ✅ structural characterization in `tests/c1Wp0Characterization.test.js`; engine/coach/adaptive already covered at the contract level by existing B1–B5 tests |
| Full repository test suite passes from the canonical root-level `tests/` layout | ✅ §1 |
