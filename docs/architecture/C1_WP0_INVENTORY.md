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
| `buildCoachSystemPrompt` | `js/app.js:349` | `js/app.js:2962` (`_s5_buildCoachSystemPrompt`, B5 derived-intelligence fragment) | — | — | line 2962 |
| `renderProfile` | `js/app.js:1834` | `js/app.js:2621` (`_s4_renderProfile`, adds `renderMeasurements()`) | — | — | line 2621 |
| `renderSettings` | `js/app.js:1924` | `js/app.js:2091` (`_origRenderSettings`, adds plan targets) | `js/app.js:2627` (`_s4_renderSettings`, adds adaptive settings) | `js/app.js:2998` (`_s5_renderSettings_u`, adds usage display) | line 2998 |
| `showMealEditor` | `js/app.js:1075` | `js/app.js:3204` (`_showMealEditor`, resets edit-mode flag) | — | — | line 3204 |
| `renderEditor` | `js/app.js:1127` | `js/app.js:3263` (`_renderEditor`, adds edit-mode action buttons) | — | — | line 3263 |
| `addMeal` | `js/app.js:1286` | `js/app.js:3222` (`_addMeal`, routes to `saveEditedMeal()` when editing) | — | — | line 3222 |
| `loadUserData` | `js/app.js:183` | `js/app.js:3304` (`_loadUserData`, resets day-navigation state, session-guarded) | — | — | line 3304 |

All eight chains preserve the prior definition via an explicit local `const _xxx = <name>;` capture before reassignment, and every wrap calls the captured prior definition. These are safe to consolidate in a later work package (e.g. WP10) by inlining the full chain into one function body, preserving call order exactly.

### 2.2 Silent-replacement overrides (dead code — DO NOT extract from the base definition)

| Function | Base definition (DEAD, unreachable at runtime) | Silent replacement | Later proper wrap | Final runtime definition |
|---|---|---|---|---|
| `goToScreen` | `js/app.js:602` | `js/app.js:2014` (comment: "OVERRIDE: goToScreen (4-tab version)"; does not call line 602) | `js/app.js:3297` (`_goToScreen`, properly wraps line 2014's version; refreshes food date banner) | line 3297 |
| `renderHome` | `js/app.js:517` | `js/app.js:2029` (comment: "OVERRIDE: renderHome with ring"; does not call line 517) | `js/app.js:3172` (`_renderHome`, properly wraps line 2029's version; adds date-nav chrome) | line 3172 |
| `renderMealsInHome` | `js/app.js:540` | `js/app.js:3179` (comment labels it "עטיפת renderMealsInHome" / "wrapper", but the body is a full replacement with no preserved reference) | *(none — this is the final layer)* | line 3179 |

**Engineering note:** `js/app.js:517`, `602`, and `540` are dead code today. A work package that extracts "the `renderHome`/`goToScreen`/`renderMealsInHome` implementation" by reading the file top-to-bottom and taking the first definition it finds would silently ship a regression. Any future extraction of these three functions MUST use the **final runtime definition** column above as the source of truth, per C1-WP10's explicit rule: "do not extract or consolidate any superseded navigation definition as though it were authoritative."

---

## 3. `window` Assignment and Compatibility-Facade Inventory

Complete list of explicit `window.X = ...` assignments in `js/app.js` (13 assignment sites, 12 distinct properties):

| Property | Assignment site(s) | Owner | Purpose |
|---|---|---|---|
| `window._adaptHistoryCache` | `js/app.js:99` (init to `null`), `js/app.js:4164` (`StateAccess.configure` → `setAdaptHistoryCache`) | Adaptive TDEE | runtime cache, not durable |
| `window.dayNavPrev` | `js/app.js:3153` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.dayNavNext` | `js/app.js:3154` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.dayNavToday` | `js/app.js:3155` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.deleteHomeMeal` | `js/app.js:3192` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.editHomeMeal` | `js/app.js:3207` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.saveEditedMeal` | `js/app.js:3227` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.deleteEditedMeal` | `js/app.js:3241` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.cancelEditedMeal` | `js/app.js:3254` | Day Navigation IIFE | inline `onclick` compatibility entry point |
| `window.updateFoodDateBanner` | `js/app.js:3293` | Day Navigation IIFE | inline compatibility entry point |
| `window.runHabitEngine` | `js/app.js:3633` | Habit Engine IIFE | exposes IIFE-private function to the outer scope for `EngineRegistry` adapter wiring |
| `window.runPatternEngine` | `js/app.js:4067` | Pattern Engine IIFE | exposes IIFE-private function to the outer scope for `EngineRegistry` adapter wiring |

This set is closed and asserted exhaustively by `tests/c1Wp0Characterization.test.js` — any new `window.*` assignment added by a later work package without updating this table will fail that test.

---

## 4. IIFE Boundary Map

Four top-level `(function () { ... })();` blocks exist in `js/app.js`, in addition to the plain global-scope code that makes up the rest of the file:

| # | Range | Identity | `window` exports | Notes |
|---|---|---|---|---|
| 1 | `js/app.js:3071`–`3311` | **Day Navigation IIFE** (unnamed in source comments) | `dayNavPrev`, `dayNavNext`, `dayNavToday`, `deleteHomeMeal`, `editHomeMeal`, `saveEditedMeal`, `deleteEditedMeal`, `cancelEditedMeal`, `updateFoodDateBanner` | Implements viewing/editing past days on the home/food screens. Wraps `renderHome`, `renderMealsInHome`, `goToScreen`, `showMealEditor`, `renderEditor`, `addMeal`, `loadUserData` (see §2). Closure-private state includes `currentDayKey`, `realTodayData`, `realWaterCount`, `editingExisting`. |
| 2 | `js/app.js:3345`–`~3640` | **Habit Engine IIFE** (STAGE 6 / TASK-002, comment at `3328`) | `runHabitEngine` | Producer logic for the Habit Derived Intelligence View (B1/B5 scope). |
| 3 | `js/app.js:3658`–`~4310` | **Pattern Engine IIFE** (STAGE 7 / TASK-003, comment at `3641`) | `runPatternEngine` | Producer logic for the Pattern Derived Intelligence View (B1/B5 scope). |
| 4 | `js/app.js:4317`–`4453` (EOF) | **B2 Engine Registration IIFE** | *(none)* | Registers all four B2 engines (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`) with `EngineRegistry.register()`. |

IIFEs 2–4 are already governed by the closed B1–B5 contracts and are the explicit target of C1-WP9 (Habit and Pattern Engine Extraction). IIFE 1 (Day Navigation) has no prior architectural documentation anywhere in the repository before this inventory and is the explicit target of C1-WP10 per the updated specification.

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
