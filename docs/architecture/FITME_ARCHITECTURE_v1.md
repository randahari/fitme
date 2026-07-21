# FitMe — Current-State Architecture (v1)

**Repository:** `randahari/fitme` (origin: `https://github.com/randahari/fitme.git`)
**Snapshot basis:** commit `01ee236` (2026-07-15), app version `2.17.1` (`APP_VERSION` in [js/app.js:2](../../js/app.js), `VERSION` in [sw.js:1](../../sw.js))
**Document status:** describes the system as it exists in the repository today. No redesign, no proposed future state. Anything not directly verifiable from repo contents is explicitly marked as an **assumption**.

---

## 1. Product and System Overview

FitMe is a Hebrew-language (RTL), mobile-first Progressive Web App for nutrition and fitness self-tracking with an AI "coach" persona. A user logs meals (by text, photo, or barcode), water, workouts, weight, and body measurements; the app computes daily calorie/macro targets and renders progress on a single home screen. Layered on top of this tracking core are several algorithmic subsystems ("engines") that observe the user's logged history and adapt targets, surface coaching messages, and build up a private, typed record of what the coach has "learned" about the user.

There is no backend application server in the traditional sense. The system is:

- A static, unbundled client (`index.html` + 3 `<script>` files) — no build step, no framework, no bundler, no package.json at the repo root.
- Firebase as the sole managed backend: **Firebase Auth** (Google sign-in), **Firestore** (all persistent data), and a single **Cloud Function** that proxies calls to the **Anthropic API** (Claude).
- Static hosting is **not configured inside this repo** (no `hosting` block in [firebase.json](../../firebase.json), no CI/deploy workflow files found). The Cloud Function's CORS allow-list (`https://randahari.github.io`, `http://localhost:5000`, `http://localhost:8080` — [functions/index.js:37-41](../../functions/index.js)) and the PWA `start_url`/`scope` of `/fitme/` ([manifest.json](../../manifest.json), [sw.js](../../sw.js)) strongly indicate the static files are served via **GitHub Pages** at a project-page path (`randahari.github.io/fitme/`). **Assumption:** this is inferred from CORS/URL evidence, not from an explicit hosting config file in the repo.

---

## 2. Main Files and Responsibilities

| File | Responsibility |
|---|---|
| [index.html](../../index.html) | Static app shell. Defines `loading-screen`, `login-screen`, `onboarding`, and `app` containers; 5 screens inside `app` (`screen-home`, `screen-food`, `screen-workout`, `screen-profile`, `screen-settings`). Loads Firebase compat SDKs (v10.12.0) from `gstatic.com`, then `js/firebase-config.js`, `js/app.js`, `js/memory.js`, in that order. |
| [js/firebase-config.js](../../js/firebase-config.js) | Initializes the Firebase app (`firebaseConfig`), creates `auth`/`db`/`googleProvider` globals, sets `LOCAL` auth persistence, implements Google sign-in with a popup→redirect fallback (`signInWithGoogle`), handles the redirect result, and registers `sw.js`. |
| [js/app.js](../../js/app.js) (~3,671 lines) | The entire application. Single global-scope script containing: auth-state wiring, Firestore read/write helpers, onboarding, home/food/workout/profile/settings screen rendering, barcode scanning, AI-assisted food logging (text + photo), notifications, and **all** algorithmic engines (Adaptive TDEE, Trigger, Habit, Pattern) and the legacy coach-memory infrastructure. Organized as sequential dated "Stage"/"TASK" blocks; later blocks modify earlier behavior via **global function reassignment** rather than editing functions in place (see §11). |
| [js/memory.js](../../js/memory.js) (~434 lines) | The **typed memory** layer (`window.FitMeMemory`): schema, validation, CRUD against `users/{uid}/memories/{id}`, one-way migration from the legacy `coachMemory.observations`/`preferences` shape, and the "מה המאמן יודע עליי" (What the coach knows about me) transparency bottom-sheet UI wired into Settings. Self-contained IIFE, loaded last, does not touch `app.js` internals except by wrapping `renderSettings`. |
| [functions/index.js](../../functions/index.js) | The only Cloud Function: `anthropicProxy` (HTTPS `onRequest`, `us-central1`, 512MiB, 60s timeout). Verifies the caller's Firebase ID token, enforces a per-user/per-day quota via a Firestore transaction, forwards the request body to `https://api.anthropic.com/v1/messages` using a server-held secret (`ANTHROPIC_API_KEY`), and logs cumulative token usage. |
| [firestore.rules](../../firestore.rules) | Security rules. Owner-only read/write on most user data; group members get **read-only** access to a user's `users/{uid}` profile and `days/{day}` documents (for a leaderboard); `memories` sub-collection writes are restricted to `source in ['user_stated','migrated']`; `usage/{uid}` is client-readable but never client-writable. |
| [sw.js](../../sw.js) | Service worker. Cache-first ("stale-while-revalidate") for the static app shell (versioned cache name `fitme-v2.17.1`); explicit network-only bypass for Firebase/Google/Anthropic/OpenFoodFacts URLs; also handles Web Push (`push`/`notificationclick`) — **note:** no server-side push-sending code was found in this repo, so the push handler's trigger source is unconfirmed from repo contents alone (assumption: push is either unused currently, or sent from an external/manual source such as the Firebase console). |
| [manifest.json](../../manifest.json) | PWA manifest: name, icons, `standalone` display, RTL, `/fitme/` scope. |
| [firebase.json](../../firebase.json) | Declares only `firestore.rules` and the `functions` source directory. No `hosting` key present. |
| [.firebaserc](../../.firebaserc) | Pins the default Firebase project to `fitme-f9289`. |
| [functions/package.json](../../functions/package.json) | Cloud Function dependencies: `firebase-admin@^13.6.0`, `firebase-functions@^7.0.0`, Node 24 engine. |

---

## 3. Data Flow — Browser, Firebase, Firestore, Cloud Functions, Anthropic

```
Browser (index.html + app.js + memory.js)
   │
   ├── Firebase Auth SDK ── Google Sign-In ──▶ Firebase Auth (Google IdP)
   │
   ├── Firestore SDK ── direct reads/writes (subject to firestore.rules) ──▶ Cloud Firestore
   │
   └── fetch() with "Authorization: Bearer <Firebase ID token>"
              │
              ▼
       Cloud Function: anthropicProxy (functions/index.js)
              │  1. admin.auth().verifyIdToken(idToken)
              │  2. Firestore transaction on usage/{uid}: enforce daily quota
              │     (photo: 50/day, text: 300/day, keyed by UTC date)
              │  3. clamp body.max_tokens to ≤ 2000
              │  4. forward body verbatim to Anthropic
              ▼
       https://api.anthropic.com/v1/messages   (model requested by client: "claude-sonnet-4-6")
              │
              ▼
       response JSON relayed back to browser; usage/{uid} incremented
       (totalInputTokens / totalOutputTokens / totalRequests) — fire-and-forget, non-blocking
```

Every AI call from the client goes through the single helper `callClaude(body)` ([js/app.js:6](../../js/app.js)), which fetches a fresh ID token per call and POSTs to the hardcoded `CLAUDE_PROXY_URL` (`https://us-central1-fitme-f9289.cloudfunctions.net/anthropicProxy`). The client **never holds an Anthropic API key**; the key exists only as a Firebase Functions secret (`defineSecret('ANTHROPIC_API_KEY')`) read server-side.

Three distinct AI call shapes exist, all going through the same proxy:
1. **Coach messages** — text-only, `system` prompt built by `buildCoachSystemPrompt()`, short `max_tokens` (120–220).
2. **Food questionnaire / calculation** — text-only, JSON-only response contract, `max_tokens` 600–1200.
3. **Photo analysis** (plate or nutrition label) — `content` array with an `image` block (base64, client-compressed to ≤1024px/JPEG 0.85 via `compressImageForUpload`) plus a text prompt, `max_tokens` 1200.

`classifyCall(body)` (duplicated independently in both [functions/index.js](../../functions/index.js) and [js/app.js](../../js/app.js)) buckets a request as `photo` if any message content block has `type: 'image'`, else `text` (server-side quota) / `coach` (client-side usage-counter bucket, using presence of `body.system` as the discriminator instead).

Barcode lookups additionally call **OpenFoodFacts** (external, unauthenticated) and a Firestore-backed **shared group barcode cache** (`groupBarcodes/{gid}/products/{code}`) — these are separate from the Anthropic flow and do not go through the Cloud Function.

---

## 4. Authentication Flow

1. `js/firebase-config.js` initializes Firebase and sets `Auth.Persistence.LOCAL`.
2. `signInWithGoogle()` calls `auth.signInWithPopup(googleProvider)` first. On failure, only for a specific set of recoverable error codes (`auth/popup-blocked`, `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/operation-not-supported-in-this-environment`) does it fall back to `auth.signInWithRedirect(googleProvider)` — this fallback exists specifically because iOS installed-PWA redirect flows can lose state crossing from Safari into the installed app shell (per inline comment).
3. `auth.getRedirectResult()` is awaited at load time to complete any pending redirect-based sign-in.
4. `js/app.js` registers `auth.onAuthStateChanged(...)` ([js/app.js:68](../../js/app.js)) as the single source of truth for app state:
   - `user` present → set `currentUser`, call `loadUserData()` (parallel Firestore reads via `Promise.all`: profile doc, today's `days` doc, `favorites` doc), then branch: profile exists → `showApp()` + `initNotifications()`; no profile → `showOnboarding()`.
   - `user` absent → clear `currentUser`/`userProfile`, `showLogin()`.
5. `finishOnboarding()` builds the initial profile (BMR via Mifflin-St Jeor-style formula, activity multiplier from workout-days selection, initial `goalKcal`), writes it with `saveProfile()`, creates a `groups/{groupCode}/members/{uid}` membership doc (every user is auto-assigned a personal group code at signup), then calls `showApp()`.
6. `signOut()` confirms via a native `confirm()` dialog, then `auth.signOut()`.

No custom backend session/JWT exists beyond Firebase's own ID tokens; the Cloud Function is the only place those tokens are verified server-side.

---

## 5. Firestore Collections and Important Stored Data

```
users/{uid}                          — profile document (see fields below)
users/{uid}/days/{YYYY-MM-DD}        — { meals[], burned, steps, water, updatedAt }
users/{uid}/data/favorites           — { meals: [...] }               (favorite meals)
users/{uid}/memories/{memoryId}      — typed memory record (see §13)  [TASK-001]

groups/{gid}                         — group document (read-only to signed-in users; no direct writes)
groups/{gid}/members/{uid}           — membership marker { joinedAt }

groupBarcodes/{gid}/products/{code}  — shared group barcode → nutrition cache

usage/{uid}                          — { daily: { date, photo, text }, totalInputTokens,
                                          totalOutputTokens, totalRequests, lastUsed }
                                        written ONLY by the Cloud Function (admin SDK); rules forbid
                                        client writes.
```

Key fields inside the `users/{uid}` profile document (accumulated across the codebase, not an exhaustive schema — this is a single, ever-growing document, not normalized):

- Identity/plan: `name, age, gender, weight, height, currentWeight, days, goal, foods[], tdee, goalKcal, stepsGoal`
- Coach persona prefs: `coachName, coachStyle, coachChatter`
- Group: `groupId` (canonical; `groupCode` retained for backward compatibility — one-time migration copies `groupCode` → `groupId` on load if missing, see `loadUserData()`)
- Progress: `streak, totalWorkouts, perfectWaterDays, perfectNutritionDays, weightHistory[], measurementHistory[]`
- Adaptive TDEE state: `rate, adaptiveEnabled, adaptiveTdee, currentDeficit, lastTdeeUpdate, tdeeHistory[], confirmedLightDays[]`
- Legacy coach memory blob: `coachMemory { observations[], preferences{}, habits[], habitsMeta, patterns[], patternsMeta, lastUpdated }`, `coachEvents[]` (capped at 200), `coachDay { date, fired[], count }`
- Usage counters (separate from Firestore `usage/{uid}`; this is a lighter monthly client-visible mirror): `usage { month, byType: { photo, coach, text } }`
- Memory-layer migration flags: `schemaVersion, memoryMigratedAt, memoryConsent { granted, at }`
- Quick-log: `quickItems[], quickOnboarded`

`getHistoryData()` ([js/app.js:178](../../js/app.js)) reads the **entire** `days` sub-collection (no query filter/limit — deliberately, per an inline comment, to avoid requiring a composite Firestore index), sorts client-side by document ID (`YYYY-MM-DD` strings sort chronologically), and truncates to the most recent 400 entries in JS. This is the single shared history source consumed by the Adaptive TDEE, Trigger, Habit, and Pattern engines.

---

## 6. Coach Brain and Memory Architecture

"The coach" is not a persistent conversational agent with memory on the Anthropic side — every `callClaude()` invocation is a fresh, stateless request. Continuity is simulated entirely client-side by re-assembling context into the `system` prompt (or user message) on every call:

- `buildCoachSystemPrompt()` ([js/app.js:301](../../js/app.js)) composes: role framing ("אתה 'המאמן'..."), the user's coach-facing name, known profile facts (age/weight/height/goal/goal-calories/training days/preferred foods/streak), a style guide (`friendly/supportive/professional/mixed`) and a length guide (`minimal/balanced/gentle`), plus explicit anti-hallucination and formatting constraints ("never invent data not given to you", "plain text, no markdown").
- This function is later **wrapped** (not replaced) by the Stage-5 hook ([js/app.js:2633](../../js/app.js)) to append `coachMemoryPromptFragment()` — a short natural-language summary of the last 8 `coachMemory.observations` plus all `coachMemory.preferences` — onto the base prompt.
- `coachMessage(context)` sends `{ system: buildCoachSystemPrompt(), messages: [{role:'user', content: context}] }` to Claude and returns the trimmed text response, with local fallback text (`coachLine()`) whenever the network call fails.

The "memory" that feeds this prompt currently exists in **two parallel systems** — see §13.

---

## 7. Adaptive TDEE Engine ("Stage 4", `js/app.js` ~lines 1876–2340)

**Purpose:** periodically re-estimate the user's true maintenance calories (TDEE) from actual logged intake and weight/measurement trends, and gradually steer `goalKcal` toward a target deficit/surplus rather than trusting the static onboarding-time formula forever.

Pure calculation core (side-effect free, operates on a `history` map passed in):

- `computeAdaptiveTdee(history)`: filters the 14-day window (`ADAPT_WINDOW_DAYS`) to days classified `full` or `light` (see `classifyDay`); averages their intake; computes a least-squares weight-trend slope (`linearSlope`) over weigh-ins in the same window (requires ≥3 weigh-ins spanning ≥10 days); `tdee = avgIntake − slopeKgPerDay × 7700`; softens the result against the previous TDEE by at most `ADAPT_MAX_STEP` (250 kcal); clamps to [1200, 5000].
- `analyzeMeasurements()`: linear trend (cm/week) for waist/arm/chest over the last 28 days.
- `buildWeeklySignals(calc, meas)`: combines weight-trend %, waist trend, and arm trend into a named scenario (`clean-cut, recomp, stalled, losing-muscle, clean-bulk, dirty-bulk, stalled-bulk, gaining, drift, holding, steady`) and a boolean `redFlag` (e.g., cutting too fast while losing arm size). Documented principle: **"measurements win over the scale"**.
- `computeNextDeficit(signals)`: steps the current deficit/surplus by a configurable rate (`gentle/balanced/aggressive`, each with its own `step` and final `cutTarget`/`bulkTarget`) toward the goal, or pulls back 100 kcal on a red flag.
- `buildAdaptiveProposal(history)`: assembles the full proposed `newGoal`/`delta` without applying it.

Thin UI layer: `runAdaptiveCheck()` (gated to fire at most once per `ADAPT_CADENCE_DAYS` = 7 days via `userProfile.lastTdeeUpdate`) builds a proposal and shows it in a home-screen card (`renderAdaptiveCard`) with a locally-generated explanation (`adaptiveLocalExplain`) immediately, upgraded asynchronously to a Claude-generated explanation (`coachAdaptiveMessage`) if the network call succeeds. The user must explicitly confirm (`applyAdaptiveUpdate`) or dismiss (`dismissAdaptiveUpdate`) — **the engine never silently changes `goalKcal`**.

A companion sub-feature (`pendingPartialDays` / `renderPartialPrompt` / `confirmDayLight`) flags days with suspiciously low logged intake (below 50% of goal) and asks the user to confirm whether that was a genuinely light-eating day (counted) or incomplete logging (excluded from the TDEE calculation).

---

## 8. Trigger Engine ("Stage 5", `js/app.js` ~lines 2341–2705)

**Purpose:** react to real events/state on app open rather than firing on a fixed clock; surface at most a few relevant nudges per day within a budget.

- A small set of **pure condition functions**, each returning `{type, priority, live, data}` or `null`: `evalRedFlag` (reuses the Adaptive TDEE engine's `computeAdaptiveTdee`/`buildWeeklySignals`), `evalForgotToEat` (14:00–20:00 and <400 kcal logged), `evalLowProtein` (2 consecutive days under 60% of protein target), `evalNoWorkout` (gap since last workout exceeds the user's training-day cadence), `evalCloseToGoal` (evening, within 100–300 kcal of goal), `evalStreakMilestone` (streak ∈ {7,14,30,60,100}).
- `runCoachTriggers()` evaluates all candidates, filters by `canFire(type, priority)` (no repeat of the same trigger type same day; non-health triggers capped at `COACH_DAILY_BUDGET` = 3/day; health-priority triggers bypass the budget), picks the single highest-`priority` survivor (`PRIO: health=3 > opportunity=2 > encouragement=1`), renders it immediately via free local text (`triggerLocalText`), marks it fired (`markFired`) and logs it (`logCoachEvent`), then — only for `live: true` triggers (red-flag, streak milestones) — asynchronously upgrades the card text with a Claude-generated message (`triggerLiveText`).
- A separate immediate trigger, `fireWorkoutTrigger(burn)`, fires synchronously right after a workout is saved (hooked onto `saveWorkout`), independent of the daily-budget gate's "one per day" restriction path (it still logs the event and shows a card, but is not routed through `canFire`/`markFired`).
- `scheduleLocalNotifications()` is **entirely replaced** (not wrapped) by this stage to route all local push notifications through the same `canFire`/`markFired`/`logCoachEvent` budget-and-dedup mechanism the in-app cards use, so a notification and an in-app card for the same condition don't both fire.
- `logCoachEvent(type, meta)` appends to `userProfile.coachEvents` (capped at 200 entries, oldest dropped) — this is the raw event log the code's own comments describe as "the raw material the memory layer will eventually infer patterns from."

---

## 9. Habit Engine ("Stage 6 / TASK-002", `js/app.js` ~lines 2950–3249, v2.15.0)

**Purpose (explicitly scoped in the file's own header comment):** identify, maintain, and update user habits — nothing else. Explicitly *not* responsible for recommendations, coaching logic, complex pattern detection, decisions, initiatives, or UI. Runs once a day, in the background, non-blocking, with no user-facing surface at all (its output only feeds the prompt fragment / other engines).

- Wrapped in an IIFE; recomputes **from source every run** (raw `days` history, `weightHistory`, `measurementHistory` — no incremental event accounting).
- Builds a 42-day (`WINDOW_DAYS`) rolling observation window (`buildObservations`), tracking which weeks were "active" (any meal/workout/weigh-in/measurement) so a vacation/illness week doesn't count against a habit.
- Four pure detectors, each emitting a uniform `signal` object:
  - `detectNutrition`: fixed daily meal-time segments (morning/midday/evening/night) appearing in ≥50% of ≥5 timed-meal days; plus a weekly "logs food consistently" habit (≥4/7 days with a meal, over ≥3 weeks).
  - `detectWorkout`: per-weekday workout regularity (≥3 qualifying weeks, ≥50% hit rate).
  - `detectWeight` / `detectMeasurement`: weekly weigh-in / measurement logging regularity, sharing one helper (`weeklyLogHabit`).
- Lifecycle: `upsertFromSignal` blends new evidence into a smoothed `confidence` (`INERTIA` = 0.6, i.e. 60% previous / 40% new) and derives a deterministic `status` via `statusOf()`: **observed → candidate → confirmed → active**, with a **weakening** state when recent occurrence is late relative to the expected interval, and **inactive** below a confidence floor or after a long absence. A habit present before but absent this run is *decayed*, never deleted (`decayAbsent`), matching the stated principle "a temporary lapse does not erase a habit."
- Output is written to `userProfile.coachMemory.habits[]` / `coachMemory.habitsMeta` (capped at `MAX_HABITS` = 60, lowest-confidence entries dropped first if over cap). **Updated by B4 (v2.23.0):** the write no longer goes through `saveProfile()`; it is submitted as a `DERIVED_HABITS_REPLACE` request through the Persistence Gateway (`js/persistenceGateway.js`), which performs a field-scoped merge (`coachMemory.habits`/`coachMemory.habitsMeta` only) and normalizes success/failure. `js/stateAccess.js`'s `writeReplaceDerivedHabitView` snapshots and rolls back the in-memory `habits`/`habitsMeta` if the durable write does not succeed — see §19.
- Gated to run at most once per calendar day (`mem.habitsMeta.lastRun === today` short-circuits), and hooked onto `showApp` as a fire-and-forget background task (`Promise.resolve().then(runHabitEngine)`), guaranteed never to block or throw into the UI (wrapped in try/catch).

---

## 10. Pattern Engine ("Stage 7 / TASK-003", `js/app.js` ~lines 3250–3671, v2.16.0/v2.17.0)

**Purpose (explicitly scoped, same style of header comment as Habit Engine):** identify and maintain longer-range recurring behavioral patterns as an **observation layer only** — explicitly no recommendations, coaching, initiatives, decisions, or UI. Runs once per session, after the Habit Engine, in the background.

This is the most carefully engineered piece of the codebase, with the header comments describing several deliberate correctness properties:

- **90-day rolling window** (`PE_WINDOW`), anchored to the **last actual data day** (`lastDataDay`, computed from the data itself), not the calendar date — so calendar days with zero activity (vacations) don't silently shift or blank the window.
- Four detectors, each returning signals via a uniform `finalize()` helper that computes `evidenceCount`/`opportunityCount`/`rawStrength` against explicit "opportunity" sets (so a habit's *rate*, not just its raw count, is captured):
  - `detectTime`: modal day-part (morning/midday/evening/night) of the first and last meal.
  - `detectWeekday`: per-weekday tendency to be either consistently logged (`active`) or consistently skipped (`skip`).
  - `detectSequence`: cross-day/same-day associations — workout day → higher protein than baseline; workout → next-day workout ("back to back"); workout → next-day rest; weigh-in and measurement logged together (±1 day).
  - `detectFrequency`: stability of meals-per-day and workouts-per-week (low standard deviation relative to the mean ⇒ higher pattern strength).
- **Deterministic identity:** a closed catalog of pattern IDs (`isCatalogId`) with static descriptions, so the same behavior always maps to the same record rather than spawning duplicates.
- **Recompute vs. lifecycle-advance separation** (the engine's own "ISSUE 10" comment spells this out): the pattern's *source-derived* fields (`strength`, `evidenceCount`, etc.) are recomputed fresh every run; but the *lifecycle* fields (`confidence`, `status`, `missedPeriods`) only move once per **new data day** (`advance = obs.lastDataDay > patternsMeta.lastAdvanceDataDay`), never on mere calendar-day passage or app re-opens, and never on editing past data. A pattern absent from the current source is preserved (`carryAbsent`), decayed only on a genuine advance, and only marked `inactive` after `MISS_INACTIVE_PERIODS` (3) consecutive missed evaluation periods — a single gap always lands on `weakening` first.
- **Fingerprint-gated writes:** `computeFingerprint()` hashes the relevant window of raw data (including the user's "effective weight", used consistently for both the fingerprint and the protein threshold — called out as a fixed bug in the comments, "ISSUE 3/4"). If neither the fingerprint changed nor a new data day occurred, the run is a complete no-op (`if (!advance && !fpChanged) return;`) — no Firestore write at all.
- **Isolated write with rollback, now conflict-checked:** this engine writes `coachMemory.patterns`/`patternsMeta` via a scoped path that can fail, and on failure explicitly rolls the in-memory state back to a pre-mutation snapshot so a retry is possible and the fingerprint/advance-day markers are not falsely advanced. **Updated by B4 (v2.23.0):** the write is submitted as a `DERIVED_PATTERNS_REPLACE` request through the Persistence Gateway, which wraps it in a Firestore transaction comparing the request's `expectedVersion` (the fingerprint that was durable when this run started) against the currently-durable `patternsMeta.sourceFingerprint`; a mismatch returns `CONFLICT` (distinct from a generic write failure) instead of silently overwriting newer durable state. See §19.
- Runs after the Habit Engine on every `showApp` (`await runHabitEngine()` inside `runPatternEngine`, itself wrapped in its own try/catch so a Habit Engine failure doesn't cancel the Pattern Engine — it just proceeds on raw data alone), hooked as a background, non-blocking `Promise.resolve().then(runPatternEngine)`.

---

## 11. Startup and Engine Execution Order

**Updated by B2 (v2.21.0).** Prior to B2, `showApp()`, `logWeight()`, `saveWorkout()`
and `scheduleLocalNotifications` were each override-chained by successive
"Stage" blocks (`const _sN_fn = fn; fn = function(){ _sN_fn(); ...engine
call...; }`), so the effective runtime behavior of these functions was an
invisible composition of every stage's wrapper in file-definition order.
That pattern has been removed for the four intelligence engines and
replaced by one central **Engine Registry / Orchestrator**
(`js/engineRegistry.js`), with the four engines registered in a
"Stage 8 / B2" block near the end of `js/app.js`. See
`docs/tasks/B2/B2_SPEC.md` for the full contract.

1. **Base `showApp()`** ([js/app.js:161](../../js/app.js)): un-hide the `app` container, hide loading/login/onboarding, apply dark mode, `setTodayDate()`, `renderHome()` (still later overridden — see below), `renderSettings()`, `renderPlanBanner()`, `buildWater()`, then one added call: `runAppReadyEngines()` (non-blocking).
2. **`runAppReadyEngines()`** builds one explicit `EngineRunRequest` for the `APP_READY` trigger, supplying a distinct, explicit action per engine (`habitEngine`/`patternEngine` → `RECOMPUTE`, `adaptiveTdeeEngine` → `ADAPTIVE_CHECK`, `triggerEngine` → `DAILY_COACH_CHECK`) and calls `EngineRegistry.run(request)` without awaiting it.
3. **`EngineRegistry.run()`** resolves the four eligible engines' deterministic execution order (topological, lexicographic tie-break among independents: `adaptiveTdeeEngine` → `habitEngine` → `patternEngine` → `triggerEngine`) and executes them **sequentially, one at a time** (a deliberate B2 design choice — see §12 and B2 SPEC §9/§12), rather than the prior implicit concurrent fire-and-forget behavior.
4. **Habit Engine single-flight.** Because Pattern Engine's own `run()` still internally invokes Habit Engine's underlying computation (as enrichment — see §12), the Habit orchestration path wraps it in a session-generation-scoped single-flight (`runHabitEngineSingleFlight()`): a concurrent or overlapping call for the same session is handed the same in-flight `Promise` rather than starting a duplicate run. Correctness here does not depend on execution order.

Separately, `renderHome` (called from step 1) is **fully replaced** later in the file (["OVERRIDE: renderHome with ring", js/app.js:1782](../../js/app.js)) rather than wrapped — this replacement version additionally calls `refreshCoachCard()` (the home-screen LLM-generated greeting card, gated to render at most once per app-open via the `coachCardShown` flag), `buildWater()`, and `buildWeekChart()`. This non-engine override was not in B2's scope and is unchanged.

`initNotifications()` and `loadUserData()` are called from the top-level `auth.onAuthStateChanged` handler, **outside** of `showApp()` itself. `initNotifications()` now calls `runAuthSessionReadyEngines()` (also Registry-mediated, action `LOCAL_NOTIFICATION_SCHEDULE`) instead of calling `scheduleLocalNotifications()` directly; that function itself is now a single consolidated definition (the prior base-definition-plus-full-replacement pair was collapsed — the base was confirmed dead code, since the replacement always ran first at script-load time).

Sequence at cold start (from the moment a returning, already-onboarded user's auth state resolves):

```
onAuthStateChanged(user)
 → loadUserData()                         (parallel: profile, today's day doc, favorites)
 → showApp()
     → [sync] base render (home/settings/plan banner/water)
         → renderHome() (overridden) → refreshCoachCard()   [async, LLM call, gated once/open]
     → [fire-and-forget] runAppReadyEngines()
         → EngineRegistry.run({trigger: APP_READY, actions: {...}})
             → adaptiveTdeeEngine  → runAdaptiveCheck()                       [awaited, reads full history]
             → habitEngine         → runHabitEngineSingleFlight()             [awaited, reads full history, ≤1x/day]
             → patternEngine       → runPatternEngine()                       [awaited; internally awaits the same
                                                                                 single-flight Habit run — no-op if
                                                                                 already completed this cycle]
             → triggerEngine       → runCoachTriggers()                       [awaited, reads full history]
 → initNotifications() → runAuthSessionReadyEngines()   (separately, outside showApp)
```

Several of these independently call `getHistoryData()` (a full-collection Firestore read of up to 400 days) on the same app open — Adaptive TDEE, Trigger Engine, Habit Engine, and Pattern Engine each fetch it separately rather than sharing one fetched copy (see §14, Risks; unchanged by B2). Because engine execution is now sequential rather than concurrent, this app-open background work now completes in roughly the *sum* of each engine's duration rather than the *max* — a deliberate correctness-over-latency trade-off made during B2 (it does not block the synchronous UI render in step 1).

---

## 12. Dependencies Between the Engines

```
Adaptive TDEE Engine  ──(read-only reuse of computeAdaptiveTdee/buildWeeklySignals)──▶  Trigger Engine (evalRedFlag)
Habit Engine          ──(explicitly optional/no hard dependency; documented as "enrichment only, not a source")──▶  Pattern Engine
Pattern Engine        ──(internally invokes, via single-flight)──▶  Habit Engine's underlying computation, but tolerates its failure
Typed Memory (memory.js) ──(one-way, one-time)──▶  migrates legacy coachMemory.observations/preferences on first load after schema bump
Coach persona (buildCoachSystemPrompt) ──(reads)──▶  legacy coachMemory.observations/preferences via coachMemoryPromptFragment()
```

Concretely:
- The **Trigger Engine**'s red-flag condition directly calls the Adaptive TDEE Engine's pure functions (`computeAdaptiveTdee`, `analyzeMeasurements`, `buildWeeklySignals`) rather than duplicating that logic.
- **Updated by B2 (v2.21.0).** The **Pattern Engine** and **Habit Engine** are both registered independently with the Engine Registry, each with `dependsOn: []` — this is deliberately *not* a registry-level dependency, because promoting it would invoke the Registry's Failure Policy and change Pattern's approved behavior of continuing on raw data if Habit fails. Pattern Engine still internally reads Habit Engine output as optional enrichment (per its own header comment; primary source remains raw history), but that internal call now goes through a session-generation-scoped single-flight wrapper (`runHabitEngineSingleFlight()`) rather than a raw direct call, so that it cannot start a duplicate Habit computation regardless of whether the Registry has already started (or finished) its own Habit invocation for this session. See B2 SPEC §11 for the full rationale.
- The **Habit Engine** has no dependency on the Pattern Engine, Trigger Engine, or Adaptive TDEE Engine.
- The **coach system prompt** reads from the *legacy* `coachMemory.observations`/`preferences` fields only — it does **not** currently read `coachMemory.habits`, `coachMemory.patterns`, or the typed `users/{uid}/memories` collection. In other words, the Habit Engine and Pattern Engine currently compute and persist data that **no other part of the app reads back** — they are write-only observation layers as of this snapshot (consistent with their own header comments: "לא כולל... UI" / "no UI").

---

## 13. Legacy vs. Typed Memory Systems (Both Currently Exist)

There are **two separate, independently-written memory representations live in production simultaneously**:

### A. Legacy: `userProfile.coachMemory` (blob inside the single `users/{uid}` document)
Introduced in Stage 5 (v2.10.0) as an empty scaffold (`ensureCoachMemory()`), then populated by:
- `coachMemory.observations[]` / `coachMemory.preferences{}` — the original, unstructured slots (still read by `coachMemoryPromptFragment()` for the live coach prompt).
- `coachMemory.habits[]` / `habitsMeta` — written by the Habit Engine (§9).
- `coachMemory.patterns[]` / `patternsMeta` — written by the Pattern Engine (§10), with its own isolated/rollback-capable write path distinct from the ordinary `saveProfile()`.
- `coachEvents[]` (raw event log, capped 200) and `coachDay` (daily trigger-budget tracker) live alongside `coachMemory` on the profile document but are conceptually the Trigger Engine's own state.

### B. Typed: `users/{uid}/memories/{id}` (introduced TASK-001, `js/memory.js`)
A proper per-record sub-collection with an explicit schema:
- `type ∈ {fact, habit, pattern, preference, coach_note, conversation_memory, recurring_meal}`
- `source ∈ {user_stated, inferred_event, inferred_pattern, coach_generated, migrated}` — Firestore rules ([firestore.rules:57-74](../../firestore.rules)) restrict **client** create/update/delete to `source ∈ {user_stated, migrated}`; the other sources are described in code comments as server/admin-only (via a Cloud Function using the Admin SDK, bypassing rules) — **no such Cloud Function currently exists in this repo** (`functions/index.js` contains only `anthropicProxy`), so as of this snapshot **no code path writes `inferred_event`, `inferred_pattern`, or `coach_generated` memories** — the schema and rules anticipate a producer that has not yet been built.
- `status ∈ {candidate, active, superseded, rejected, archived}`, `confidence` (0–1), `created_at/updated_at/last_confirmed_at`.
- `migrateIfNeeded()` performs a **one-time, one-way** migration: legacy `coachMemory.observations[]` → typed `coach_note` records, legacy `coachMemory.preferences{}` → typed `preference` records, using deterministic IDs (`mig_obs_N`, `mig_pref_<safeKey>`) for idempotency; gated by `userProfile.schemaVersion`. It does **not** migrate `coachMemory.habits[]` or `coachMemory.patterns[]`.
- Ships a full transparency UI (a bottom sheet reachable from Settings: "מה המאמן יודע עליי") — view grouped-by-type, confirm (+0.1 confidence), reject, edit, delete, add manually, and a `memoryConsent` checkbox — none of which exists for the legacy `coachMemory` blob.

**Net effect:** the Habit Engine and Pattern Engine (the two most algorithmically sophisticated pieces of the system) write exclusively into the *legacy* blob, which has no user-facing transparency/consent surface and is not migrated into the typed collection; the typed collection currently only holds migrated legacy observations/preferences plus anything the user adds manually. These two memory systems are not yet unified.

---

## 14. Technical Risks and Technical Debt

- **Global-scope monolith with cascading function overrides.** `app.js` has no modules; every "Stage" either wraps a global function (capturing the previous version in a closure-scoped `_sN_name` variable) or fully replaces it. Correctness of any given call depends on the textual order of these reassignments in the file. This pattern is called out in the code's own comments as temporary ("יעוצב מחדש בשלב העיצוב" — will be redesigned later) and has already caused at least one regression fixed in this history: `d549b4b` ("restore Coach Memory transparency UI - re-add memory.js script tag and SW SHELL entry"). **Updated by B2 (v2.21.0):** resolved specifically for the four intelligence engines (Habit, Pattern, Adaptive TDEE, Trigger) — see §11 — via a central Engine Registry. Non-engine cascading overrides remain (e.g. `callClaude`, `buildCoachSystemPrompt`, `renderSettings`, `renderProfile`, and `renderHome`'s full replacement), out of B2's scope.
- **Two parallel, unreconciled memory systems** (§13) — the more sophisticated engines (Habit, Pattern) write to a blob with no consent/transparency UI, while the typed, consent-aware store only contains migrated legacy data. A developer adding a new memory consumer must know to check both.
- **Habit/Pattern engine output currently has no consumer.** Both are explicitly write-only observation layers per their own header comments; the coach prompt only reads the older `observations`/`preferences` fields. The substantial engineering investment in these two engines (§9, §10) is not yet connected to any user-visible behavior.
- **Single ever-growing profile document.** `weightHistory`, `measurementHistory`, `coachEvents` (capped 200), `coachMemory.habits` (capped 60), and `coachMemory.patterns` (uncapped in the code read) all live inside one `users/{uid}` document with no archival/pagination — long-lived users risk approaching Firestore's 1 MiB document size limit.
- **Redundant full-history reads per app open.** `getHistoryData()` (an uncapped-by-query, capped-in-JS-to-400 read of the entire `days` sub-collection) is called independently by the Adaptive TDEE engine, the Trigger engine, the Habit engine, and the Pattern engine on the same `showApp()` invocation — no shared/cached fetch across engines within a single session (the Adaptive TDEE engine does stash its result in `window._adaptHistoryCache`, but the other three each fetch their own copy).
- **No automated tests found.** `functions/package.json` lists `firebase-functions-test` as a dev dependency, but no test files were found anywhere in the repository (outside `node_modules`). Correctness currently rests on manual QA and unusually detailed inline comments (particularly in the Pattern Engine, which reads as if written to prevent a recurrence of specific past bugs — "ISSUE 2/3/4/10" comment labels suggest a prior review or bug-bash cycle).
- **Duplicated logic between client and server.** `classifyCall()` (photo vs. text classification) is implemented independently in both `functions/index.js` and `js/app.js`, for different purposes (server quota vs. client usage display) — they can drift.
- **Hosting configuration is not visible in this repo** (§1) — anyone reasoning about deploys from repo contents alone cannot confirm where/how the static files are actually published; this is inferred, not verified.
- **Client-computed, unverified nutrition/coaching data.** All food-photo/label parsing and nutritional math is produced by an LLM following a JSON-contract prompt with self-check instructions embedded in the prompt text itself (e.g. "verify saturated fat ≤ total fat" for labels) — there is no server-side or code-level validation of the returned JSON's nutritional plausibility before it's shown to the user or saved.
- **Minor:** an untracked file `js/fitme_dial_elegant_options.png` (~161 KB) sits in the working tree (confirmed via `git status --short`, below) — appears to be a stray design-exploration asset not referenced anywhere in `index.html` or `app.js`.

---

## 15. Architecture Constraints Future Tasks Must Preserve

Based on explicit in-code documentation and observed behavior, the following constraints appear intentional and should not be silently broken by future changes:

1. **Engines must never block the UI or break app startup.** Habit Engine and Pattern Engine internally wrap their entire body in try/catch that only `console.error`s — this is stated explicitly in both engines' header comments ("לא חוסם עלייה" / does not block startup, "לעולם לא שובר עלייה" / never breaks startup). **Updated by B2 (v2.21.0):** invocation is now via the Engine Registry (`js/engineRegistry.js`), triggered non-blockingly from `showApp()` through `runAppReadyEngines()` (the call itself is not awaited by `showApp()`), rather than the prior per-engine `Promise.resolve().then(fn)` wrappers. The engines' own internal try/catch behavior is unchanged.
2. **Recompute-from-source, not incremental accounting.** Both the Habit Engine and Pattern Engine explicitly recompute their source-derived fields fresh from raw `days`/`weightHistory`/`measurementHistory` on every run rather than maintaining running counters — this is what makes editing/deleting a past meal correctly reflect in the next run without a separate reconciliation step. Any future change must preserve this property rather than reintroducing incremental/event-sourced counters.
3. **Lifecycle advancement is gated on new data, not on time or app opens.** The Pattern Engine in particular (its own "ISSUE 10" comment) is explicit that confidence/status must only change on a genuinely new `lastDataDay`, never merely because a calendar day passed or the user reopened the app. Do not "simplify" this into a time-based cooldown.
4. **A temporary gap must never look like abandonment.** Both engines require multiple consecutive missed periods (not a single miss) before marking something `inactive`, and never delete a habit/pattern outright — decay only. Preserve the distinct `weakening`/`inactive` staging.
5. **Fingerprint/no-op write gating in the Pattern Engine must be preserved** — writes are skipped entirely when neither the data fingerprint changed nor a new data day occurred, to avoid needless Firestore writes and to keep `lastAdvanceDataDay` semantically meaningful for future retries.
6. **The Anthropic API key must never reach the client.** All AI calls must continue to route through the `anthropicProxy` Cloud Function using Firebase ID token auth; do not reintroduce a client-held API key (the commit history shows this was deliberately removed: `f7747b8 "use cloud proxy, remove per-user API keys"`).
7. **Client-writable memory sources are restricted by Firestore rules** to `user_stated`/`migrated` — any future engine that wants to write inferred memories into the *typed* `users/{uid}/memories` collection will need a server-side (Cloud Function/Admin SDK) write path, per the existing rules comment; it cannot simply write from the client with an `inferred_*` or `coach_generated` source.
8. **The coach must never fabricate data.** `buildCoachSystemPrompt()` explicitly instructs the model never to invent data not provided — any future prompt-composition change should preserve this constraint rather than loosen it.
9. **Daily/monthly quota and usage-tracking behavior must remain fail-open, not fail-closed.** The Cloud Function's rate-limit check explicitly allows the call through if the Firestore quota check itself fails (network/transaction error) — "so a legitimate user is not blocked" (inline comment) — this tolerance should be preserved rather than "hardened" into a fail-closed check without discussion.
10. **RTL/Hebrew-first UI and copy.** All user-facing strings, date formatting, and layout assume Hebrew/RTL (`dir="rtl"`, Hebrew weekday arrays, Hebrew-only coach responses enforced in the system prompt) — this is a product constraint, not an oversight, and should be preserved in any new UI/text.

---

## 16. Overall Architecture and Data Flow (Mermaid)

```mermaid
flowchart TB
    subgraph Client["Browser (PWA)"]
        HTML["index.html<br/>5 screens"]
        APPJS["js/app.js<br/>state · rendering · engines"]
        MEMJS["js/memory.js<br/>typed memory + transparency UI"]
        FBCFG["js/firebase-config.js<br/>auth init"]
        SW["sw.js<br/>service worker cache"]
    end

    subgraph FirebaseProject["Firebase project: fitme-f9289"]
        AUTH["Firebase Auth<br/>Google sign-in"]
        FS[("Cloud Firestore")]
        CF["Cloud Function:<br/>anthropicProxy<br/>(functions/index.js)"]
    end

    ANTHROPIC["Anthropic API<br/>api.anthropic.com/v1/messages"]
    OFF["OpenFoodFacts<br/>(external, unauthenticated)"]
    PAGES["Static hosting<br/>(GitHub Pages — inferred,<br/>not in repo config)"]

    HTML -->|loads| FBCFG
    HTML -->|loads| APPJS
    HTML -->|loads| MEMJS
    FBCFG -->|Google popup/redirect| AUTH
    APPJS -->|read/write, rules-checked| FS
    MEMJS -->|read/write, rules-checked| FS
    APPJS -->|"fetch + Bearer ID token"| CF
    CF -->|verifyIdToken| AUTH
    CF -->|"quota txn on usage/{uid}"| FS
    CF -->|"forward body, server-held API key"| ANTHROPIC
    APPJS -->|barcode lookup| OFF
    APPJS -->|"groupBarcodes cache"| FS
    PAGES -.->|serves static files, inferred| HTML
    SW -.->|cache-first shell,<br/>network-only for FB/Anthropic/OFF| HTML

    style Client fill:#eef,stroke:#448
    style FirebaseProject fill:#fee,stroke:#844
```

---

## 17. App Startup and Background Engine Execution (Mermaid Sequence)

**Updated by B2 (v2.21.0).** Engine invocation is now mediated by the
Engine Registry and executed sequentially (not concurrently); Habit
Engine correctness is provided by a session-scoped single-flight
wrapper rather than by this ordering. **Updated by B4 (v2.23.0):** durable
writes for Habit and Pattern now go through the Persistence Gateway
rather than directly reaching Firestore — see §19.

```mermaid
sequenceDiagram
    participant U as User
    participant Auth as Firebase Auth
    participant App as app.js (main thread)
    participant Reg as EngineRegistry
    participant FS as Firestore
    participant Gate as PersistenceGateway
    participant Adapt as Adaptive TDEE Engine
    participant Trig as Trigger Engine
    participant Habit as Habit Engine
    participant Pat as Pattern Engine
    participant Claude as anthropicProxy → Anthropic

    U->>Auth: sign in (Google popup/redirect)
    Auth-->>App: onAuthStateChanged(user)
    App->>FS: loadUserData() — parallel reads (profile, today, favorites)
    FS-->>App: profile + today's data + favorites
    App->>App: showApp() — sync render (home/settings/plan/water)
    App->>Claude: refreshCoachCard() [async, once per open]
    Claude-->>App: coach greeting text (or local fallback on failure)

    App->>Reg: runAppReadyEngines() [fire-and-forget]<br/>EngineRunRequest{trigger:APP_READY,<br/>actions:{habitEngine:RECOMPUTE, patternEngine:RECOMPUTE,<br/>adaptiveTdeeEngine:ADAPTIVE_CHECK, triggerEngine:DAILY_COACH_CHECK}}

    Note over Reg: sequential, deterministic order —<br/>adaptiveTdeeEngine → habitEngine → patternEngine → triggerEngine

    Reg->>Adapt: run(ADAPTIVE_CHECK)
    Adapt->>FS: getHistoryData() (own fetch)
    Adapt-->>Reg: proposal card (if due, delta != 0) — awaits explicit user confirm

    Reg->>Habit: run(RECOMPUTE) → runHabitEngineSingleFlight()
    Habit->>FS: getHistoryData() (own fetch)
    Habit->>Gate: DERIVED_HABITS_REPLACE (field-scoped, via Persistence Gateway) [gated: ≤1x/calendar day]
    Gate->>FS: merge coachMemory.habits/habitsMeta

    Reg->>Pat: run(RECOMPUTE)
    Pat->>Habit: runHabitEngineSingleFlight() (same in-flight/completed run — no duplicate computation)
    Pat->>FS: getHistoryData() (own fetch)
    Pat->>Pat: fingerprint check — skip write entirely if no-op
    Pat->>Gate: DERIVED_PATTERNS_REPLACE (expectedVersion = durable fingerprint at run start)
    Gate->>FS: transaction — compare + merge coachMemory.patterns/patternsMeta, or CONFLICT

    Reg->>Trig: run(DAILY_COACH_CHECK)
    Trig->>FS: getHistoryData() (own fetch)
    Trig->>Adapt: evalRedFlag() reuses computeAdaptiveTdee()
    Trig-->>Reg: at most one trigger card (local text now, Claude text if "live")

    App->>App: initNotifications() — outside showApp()
    App->>Reg: runAuthSessionReadyEngines() [fire-and-forget]<br/>EngineRunRequest{trigger:AUTH_SESSION_READY,<br/>actions:{triggerEngine:LOCAL_NOTIFICATION_SCHEDULE}}
    Reg->>Trig: run(LOCAL_NOTIFICATION_SCHEDULE) — schedules budget-aware local pushes
```

---

## 18. Current Version and Implementation Status (Repository Evidence Only)

- **App version:** `2.17.1` (`APP_VERSION` in [js/app.js:2](../../js/app.js); matches `VERSION`/cache name in [sw.js:1](../../sw.js)).
- **Latest commits at snapshot time** (`git log --oneline`, newest first): `01ee236` BUGFIX-001 (fix `getHistoryData` index error, bump to v2.17.1) → `d549b4b` BUG-001 (restore Coach Memory transparency UI) → `b712f7e` TASK-003 Pattern Engine v2.17.0 → `5bfa42e` TASK-002 Habit Engine v2.15.0 → `a0b863a`/`27ce685` PERF-002 (temporary startup instrumentation, then removed) → `4b6d432` PERF-001 (cache-first SW shell, parallelized `loadUserData`) → `05b1bcf` TASK-001 typed memory schema/migration/transparency UI.
- **Implemented and shipped:** Auth (Google), onboarding, meal logging (text/photo/barcode), water/workout/weight/measurement tracking, group leaderboard, favorites, quick-log, Adaptive TDEE engine (with explicit user confirmation gate), Trigger engine, Habit engine, Pattern engine, typed memory schema + transparency UI + one-way legacy migration, Cloud Function AI proxy with per-user daily quotas and usage tracking, PWA installability + service worker + local notifications.
- **Implemented but not yet consumed (write-only):** Habit Engine and Pattern Engine outputs (`coachMemory.habits`, `coachMemory.patterns`) — computed and persisted, but no other code path reads them back into the coach prompt or any UI as of this snapshot (§12, §14).
- **Schema/rules present but no producer exists yet:** the typed memory `source` values `inferred_event`, `inferred_pattern`, `coach_generated` are defined in `js/memory.js` and permitted server-side by `firestore.rules`, but no Cloud Function or other server-side writer for them exists in this repository yet.
- **Explicitly acknowledged as provisional by the code itself:** Adaptive TDEE, Trigger, Habit, and Pattern engines are all annotated in their own header comments as "designed functionally only — will be redesigned in the design phase" (`עוצב פונקציונלית בלבד — יעוצב מחדש בשלב העיצוב`), i.e., the current architecture is understood by its authors to be an intermediate, not final, state.
- **Since this snapshot:** the Architecture Remediation Program has closed REM-001/002/003 and B1–B4 on top of this baseline — B2 (v2.21.0, Engine Registry, §11), B3 (v2.22.0, State Access Layer), and B4 (v2.23.0, Persistence Gateway, §19) are the most recent and directly affect the persistence behavior described in §9/§10/§17 above. This section's commit/version reference (`01ee236`/`2.17.1`) is left as the original snapshot basis and is not re-verified line-by-line here; §11, §19 and the inline "Updated by BN" notes throughout this document are the authoritative record of what has changed since.

---

## 19. Persistence Gateway (B4, v2.23.0)

**Added by B4.** Prior to B4, every durable write went either through one broad, swallow-errors
`saveProfile()` (full `userProfile` object, `{merge:true}`) / `saveTodayData()` (full day
document overwrite), or — for the Pattern Engine only — a hand-rolled isolated write with local
rollback. Callers had no reliable way to distinguish a durable success from a durable failure. B4
introduces one logical **Persistence Gateway** (`js/persistenceGateway.js`) as the write boundary
for a defined set of migrated paths, without redesigning B1 canonical memory, B2 orchestration, or
B3 state ownership.

### 19.1 Shape and Position in the Stack

```
Engine business logic (runHabitEngine / runPatternEngine / runCoachTriggers / applyAdaptiveUpdate / addMeal / logQuick)
        ↓ (owner command, via js/stateAccess.js write ops, or directly for non-Engine paths)
PersistenceGateway.persist(PersistenceRequest)   — js/persistenceGateway.js
        ↓ (resolved Repository Adapter)
injected Firestore executor   — PersistenceGateway.configure({...}) in js/app.js
        ↓
Firestore (users/{uid}, users/{uid}/days/{date})
```

The gateway is a standalone, dependency-injected module (same pattern as `js/stateAccess.js`):
it never references `db`/`window`/`firebase` directly, so it loads and is fully unit-testable
in Node. `js/app.js` is the only caller of `PersistenceGateway.configure(...)`, and injects the
actual Firestore calls (`mergeUserFields`, `replaceDayDocument`, `runPatternTransaction`,
`isSessionCurrent`). `js/engineRegistry.js` was not modified: engine persistence outcomes are
reported through `output.persistence` on the existing (closed) `EngineRunResult.output` field,
not a new top-level Registry field.

### 19.2 Closed Operation Catalog

Six operations, fixed in source (no runtime registration API):

| Operation | Owner | Domain | Durable Surface | Conflict Policy | Idempotency Key |
|---|---|---|---|---|---|
| `DERIVED_HABITS_REPLACE` | `habitState` | `DERIVED_INTELLIGENCE` | `coachMemory.habits` / `habitsMeta` | none | not required |
| `DERIVED_PATTERNS_REPLACE` | `patternState` | `DERIVED_INTELLIGENCE` | `coachMemory.patterns` / `patternsMeta` | `expectedVersion` (fingerprint) | not required |
| `DERIVED_ADAPTIVE_PROPOSAL_APPLY` | `profileGoalsState` | `USER_PROFILE` | `goalKcal`, `adaptiveTdee`, `currentDeficit`, `lastTdeeUpdate`, `tdeeHistory` | none | not required |
| `TRIGGER_RECORD_EVENT` | `triggerState` | `SYSTEM_METADATA` | `coachEvents` | none | **required** (append-style) |
| `TRIGGER_UPDATE_BUDGET` | `triggerState` | `SYSTEM_METADATA` | `coachDay` | none | not required |
| `SOURCE_HISTORY_SAVE_DAY` | `nutritionHistoryState` | `SOURCE_HISTORY` | day document (`meals`/`burned`/`steps`/`water`) | none | not required |

Every operation requires authenticated `userId` and current `sessionGeneration` except the two
Trigger operations, which are authority-neutral (operational bookkeeping, not authoritative or
generative content). `DERIVED_ADAPTIVE_PROPOSAL_APPLY`'s owner is the Profile and Goals Domain
(matching B3's ownership map), not the Adaptive TDEE Engine — the Adaptive TDEE Engine's own
proposal-storage step remains in-memory only and is not persisted.

### 19.3 Pipeline

`persist(request)` runs, in order: validate request structure → resolve operation from the
closed catalog (unknown operation → `REJECTED`) → validate owner is on the operation's allowed
list → validate declared `domain` matches the operation's → validate `userId`/`sessionGeneration`
against `SessionLifecycle` (stale → `STALE_SESSION`, before any repository call) → validate
authority metadata against the operation's accepted `authoritySource` list where required →
validate payload shape → validate idempotency key where required → resolve the Repository
Adapter → execute with bounded retry → re-check session before returning (`receipt.
staleOnCompletion`) → return a normalized `PersistenceResult`.

### 19.4 Repository Adapters and Durable Surfaces

Each repository is a thin wrapper mapping a request's payload to an explicit, fixed set of
Firestore fields — never a raw pass-through of caller-supplied data — so two owners can never
collide on the same field through a shared physical document:

- **Field-scoped profile merge** (Habit, Adaptive-apply, Trigger event, Trigger budget): a
  single shared repository factory builds `{coachMemory: {habits, habitsMeta}}` /
  `{goalKcal, adaptiveTdee, currentDeficit, lastTdeeUpdate, tdeeHistory}` /
  `{coachEvents}` / `{coachDay}` respectively, then calls the injected
  `db.collection('users').doc(uid).set(fields, {merge:true})`.
- **Day-document repository** (`SOURCE_HISTORY_SAVE_DAY`): full-day-document replace
  (`meals`/`burned`/`steps`/`water`), the same shape `saveTodayData()` already used, now routed
  through the gateway for the two REM-001/REM-003-gated authoritative call sites.
- **Pattern transaction repository**: reads the durable `coachMemory.patternsMeta.
  sourceFingerprint` inside a Firestore transaction, compares it to the request's
  `expectedVersion`, aborts with `CONFLICT` on mismatch, otherwise merges
  `{coachMemory: {patterns, patternsMeta}}` atomically.

### 19.5 Retry, Conflict and Idempotency

- **Retry:** bounded to 3 attempts, only for repository failures classified transient
  (`unavailable`, `deadline-exceeded`, `aborted`, `internal`, `resource-exhausted`); session
  re-checked before every retry; attempt count returned in `receipt.attemptCount`.
- **Conflict:** `DERIVED_PATTERNS_REPLACE` only — `expectedVersion` mismatch returns `CONFLICT`,
  distinct from `FAILED`, and never overwrites newer durable state.
- **Idempotency:** a bounded, capped in-memory ledger (per user + operation + key) rejects a
  replayed key carrying a different payload (`IDEMPOTENCY_MISMATCH`) and returns `NO_OP` for an
  identical replay. `TRIGGER_RECORD_EVENT` requires a key (`{uid}:{type}:{date}`, matching the
  existing `canFire` dedup granularity); the five replace-style operations do not, since a
  replay with unchanged payload is naturally safe.

### 19.6 Failure Honesty and Rollback

`PersistenceResult.durable` is `true` only after confirmed repository success; a swallowed
repository error is never reported as success. State owners distinguish candidate state from
committed state:

- `js/stateAccess.js`'s `writeReplaceDerivedHabitView`/`writeReplaceDerivedPatternView` snapshot
  `coachMemory.habits`/`habitsMeta` and `.patterns`/`.patternsMeta` before mutating, and restore
  the snapshot if the gateway result is not `SUCCESS`/`NO_OP` (Pattern also restores on
  `CONFLICT`).
- `js/app.js`'s `recordCoachEvent`/`markTriggerFired` deps apply the same snapshot-and-rollback
  pattern to `coachEvents`/`coachDay`.
- `applyAdaptiveUpdate()` and `addMeal()`/`logQuick()` compute candidate values locally and only
  mutate `userProfile`/`todayData` after a `SUCCESS`/`NO_OP` result; on failure, `addMeal()`/
  `logQuick()` roll back the specific meal entry they optimistically pushed.
- All four failure/success completion paths (including the user-facing failure `alert()`) check
  `SessionLifecycle.isCurrent()` before applying any runtime effect, so a session that went
  stale mid-write neither re-applies old-session state nor surfaces a stale-session alert.

### 19.7 Migrated Write Paths (In Scope)

Habit Engine (`DERIVED_HABITS_REPLACE`), Pattern Engine (`DERIVED_PATTERNS_REPLACE`), Adaptive
TDEE's user-approved `applyAdaptiveUpdate()` (`DERIVED_ADAPTIVE_PROPOSAL_APPLY`), Trigger
Engine's `recordCoachEvent`/`markTriggerFired` (`TRIGGER_RECORD_EVENT`/`TRIGGER_UPDATE_BUDGET`),
and the AI-nutrition final authoritative boundary — `addMeal()`/`logQuick()`, the two call sites
already gated by REM-001 validation and REM-003 authority metadata
(`SOURCE_HISTORY_SAVE_DAY`).

### 19.8 Explicitly Out of Scope (Legacy, Unmigrated)

`saveProfile()` and `saveTodayData()` remain in active use, unmigrated, by: `saveFavorites()`,
group join/creation, barcode-cache writes, account deletion, water-count-only saves,
`saveWorkout()`, `addFavoriteToToday()`, and the `quickItems`/`streak` side effects still
attached to `addMeal()`/`logQuick()` (only their day-document write moved to the gateway). The
Adaptive TDEE Engine's own proposal-storage step (`storeAdaptiveProposal`/
`markAdaptiveCheckCompleted`) remains in-memory only — it was never persisted before B4 and
still isn't. No new direct-Firestore-write path was added anywhere in the migration.

---

## 20. C1 — Final Modularization Architecture (WP1–WP11, v2.40.0)

**Added by C1.** Prior to C1, `js/app.js` was 4,453 lines carrying most of the application's
domain logic, UI rendering, and platform mechanics directly. C1 (`docs/specs/C1_SPEC_v1.0.md`)
performed eleven incremental, contract-preserving extractions (WP1–WP11) that moved this logic
into dedicated modules, leaving `js/app.js` as a composition root. B1–B5 (§5–§19 above) are
unchanged by C1 and are not re-described here.

### 20.1 Composition Root (`js/app.js`, 2,008 lines post-WP11)

`js/app.js` now holds only:

- **Version constants** — `APP_VERSION` (`2.40.0`) and the fixed label tables (`GOAL_LABELS`,
  `DAYS_HE`, `COACH_STYLE_LABELS`/`COACH_CHATTER_LABELS`, `ACHIEVEMENTS`) that have no natural
  owning module.
- **Module configuration** — roughly three dozen `SomeModule.configure({...})` calls, each
  injecting the real platform object (`auth`, `Notification`, `navigator.serviceWorker`,
  `document`), the real Firestore handle (`db`, `firebase.firestore.FieldValue.serverTimestamp`),
  or a same-file closure (e.g. `getUserProfile: function () { return userProfile; }`) so every
  extracted module always observes the current runtime value, never a stale copy.
- **Physical runtime state** — the `let` variables (`currentUser`, `userProfile`, `todayData`,
  `waterCount`, `currentDayKey`, `realTodayData`, `realWaterCount`, `darkMode`, `workoutType`,
  `workoutInt`, `pendingMeal`, `photoMode`, `pendingBarcode`, `obData`, `quickItems`,
  `coachCardShown`, `foodSession`, `favoriteMeals`, `editingItemIdx`, `editingExisting`,
  `quickManage`, `_adaptProposal`) still physically live here — see §20.3.
- **Backward-compatible facades** — one-line functions (e.g. `function renderHome() { return
  HomePresenter.renderHome(); }`) preserved for every name inline HTML `onclick`/`window.*`
  handlers still call, per C1_SPEC §10's mandatory facade pattern.
- **Startup calls** — `AuthSessionController.start()` and `RegisterEngines.registerAll()`.
- **Small cross-module orchestration that does not belong to a domain module** — e.g.
  `runAppReadyEngines()`/`runEngineAction()`/`runAuthSessionReadyEngines()` (building an
  `EngineRunRequest` and calling `EngineRegistry.run()`), and `_resetAppCoreState()` (session
  cleanup registered with `SessionLifecycle`).

Not yet extracted (explicitly out of C1's approved scope — see `docs/roadmap/Changelog.md`'s
C1 entry): onboarding, the food questionnaire flow, meal-editor interaction handlers, workout
logging, streaks/achievements, group leaderboard/join, weekly plan generation, quick-log UI
handlers, water/week-chart rendering, and usage tracking still run as direct `js/app.js`
functions rather than dedicated modules. This is a scope decision, not an oversight — C1-WP11
(§11) sets no line-count target and defines success as responsibility reduction, not a fully
empty composition root.

### 20.2 Final Layer Diagram

```mermaid
flowchart TB
    HTML["index.html<br/>inline onclick handlers"]

    subgraph UI["UI Presenters / Controllers — js/ui/*, js/nutrition/*Presenter*,<br/>js/coach/coachPresenter, js/adaptive/*Controller, js/trigger/*Controller"]
        NAV["navigationController<br/>homePresenter · profilePresenter<br/>settingsPresenter · foodScreenPresenter<br/>dayNavigationController"]
    end

    subgraph APPSVC["Application Services — js/nutrition/*Service*, js/coach/coachClient,<br/>js/app/*Controller"]
        SVC["nutritionAnalysisService · mealCommitService<br/>quickLogService · barcodeFlowController<br/>coachClient · bootstrapController<br/>authSessionController"]
    end

    subgraph ROOT["Composition Root — js/app.js"]
        APPJS["version constants · configure() wiring<br/>physical runtime state · facades · startup calls"]
    end

    subgraph DOMAIN["Pure Domain Services — js/core/*, js/domain/*,<br/>js/nutrition/mealDraft, js/coach/coachProfile,<br/>js/adaptive/adaptiveTdeeDomain, js/trigger/triggerDomain"]
        PURE["zero DOM/window/Firebase — Node-loadable, no configure()"]
    end

    subgraph ENGINES["Engine Registry + Engines — js/engineRegistry.js (B2),<br/>js/engines/*, js/stateAccess.js (B3),<br/>js/derivedIntelligenceConsumer.js (B5)"]
        ENG["habitEngine · patternEngine<br/>adaptiveTdeeEngineAdapter · triggerEngineAdapter"]
    end

    subgraph REPO["Repository / Platform Adapters — js/repositories/*, js/adapters/*,<br/>js/persistenceGateway.js (B4)"]
        ADAPT["profileRepository · dayRepository · favoritesRepository<br/>groupRepository · barcodeRepository<br/>authAdapter · notificationAdapter · imageAdapter<br/>barcodeScannerAdapter · openFoodFactsClient · claudeProxyClient"]
    end

    FIRESTORE[("Firestore / Firebase Auth /<br/>browser & native APIs / external HTTP")]

    HTML --> NAV
    NAV --> SVC
    SVC --> DOMAIN
    SVC --> ENG
    SVC --> REPO
    ROOT -->|configure&#40;&#41;| UI
    ROOT -->|configure&#40;&#41;| APPSVC
    ROOT -->|configure&#40;&#41;| ENGINES
    ROOT -->|configure&#40;&#41;| REPO
    ENG --> REPO
    REPO --> FIRESTORE

    style ROOT fill:#eef,stroke:#448
    style DOMAIN fill:#efe,stroke:#484
    style REPO fill:#fee,stroke:#844
```

This matches the target architecture in C1_SPEC §9/§14 exactly: pure domain modules never
reference DOM/`window`/Firebase/`currentUser`/`userProfile`/`todayData` directly; only the
Repository/Platform Adapter tier and `js/app.js` itself (the sole caller of every
`.configure()`) touch real platform objects.

### 20.3 Runtime State Ownership

Confirms the C1_SPEC §13 ownership map against the actual repository:

| State | Physical storage | Access-contract owner | Notes |
|---|---|---|---|
| `currentUser` / `userProfile` / displayed-day (`todayData`) | `let` in `js/app.js` | `js/app/runtimeState.js` (`getCurrentUser`/`setAuthenticatedUser`/`getProfile`/`replaceProfile`/`getDisplayedDay`/`replaceDisplayedDay`/`resetForSession`) | Deliberately **not** physically moved: `js/memory.js` reads `currentUser`/`userProfile`/`saveProfile` as bare lexical globals, so RuntimeState wraps them via injected closures instead (its own header comment documents this explicitly). No generic `get(key)`/`set(key,value)`. |
| `currentDayKey`, `realTodayData`, `realWaterCount`, `waterCount`, `editingExisting`, `editingItemIdx`, `pendingMeal` | `let` in `js/app.js` | `js/ui/dayNavigationController.js` via injected getter/setter closure pairs | Day-navigation/meal-edit state; consolidated from the former Day Navigation IIFE (WP10). |
| `_adaptProposal`, `window._adaptHistoryCache` | `let`/`window` in `js/app.js` | `js/adaptive/adaptiveTdeeController.js` (read/clear via injected closures); `js/stateAccess.js` (`setAdaptProposal`/`setAdaptHistoryCache`, engine-facing write only) | Proposal is runtime-only — never persisted until user-confirmed apply (B4 `DERIVED_ADAPTIVE_PROPOSAL_APPLY`). |
| `coachCardShown` | `let` in `js/app.js` | `js/coach/coachPresenter.js` via injected getter/setter | Prevents duplicate coach-card generation per app open. |
| `quickItems` | `let` array in `js/app.js` | `js/nutrition/quickLogService.js` (pure scoring/learning/cap/pin/remove operations); `js/app.js` reassigns the array and mirrors it onto `userProfile.quickItems` | Matches C1_SPEC §13's "quick items … owner: quick-log owner/profile". |
| Habit view / Pattern view / trigger daily budget / typed memories / favourites | Unchanged from B3/B5 | `js/stateAccess.js`, `js/memory.js` | Not touched by C1. |
| `obData`, `foodSession`, `pendingBarcode`, `photoMode`, `workoutType`, `workoutInt`, `darkMode`, `favoriteMeals`, `quickManage` | `let` in `js/app.js` | Still directly read/written by the not-yet-extracted `js/app.js` functions listed in §20.1 | Out of C1's approved scope. |

No extracted module was given a generic `get(path)`/`set(path)` operation, and no engine-facing
snapshot is a mutable live reference — both prohibited by C1_SPEC §5.3/§12.4.

### 20.4 Repository Adapters (`js/repositories/*.js`, C1-WP3)

| Repository | Firestore path(s) | Methods | Notes |
|---|---|---|---|
| `ProfileRepository` | `users/{uid}` | `loadProfile`, `mergeProfile` | Document delete (`resetApp`) intentionally stays a direct `js/app.js` Firestore call — not in the WP3-approved behaviour list. |
| `DayRepository` | `users/{uid}/days/{key}` | `loadDay`, `saveLegacyDay`, `fetchHistory` | `fetchHistory` reproduces BUGFIX-001 exactly: no `orderBy`/`limit` (avoids a manual Firestore index), client-side sort by document ID, last 400 kept. |
| `FavoritesRepository` | `users/{uid}/data/favorites` | `load`, `save` | |
| `GroupRepository` | `groups/{code}`, `groups/{code}/members` | `getMembers`, `groupExists`, `addMember` | `getMembers` reproduces the original serial `for`/`await` profile+day lookup per member, including its empty-array failure fallback. |
| `BarcodeRepository` | `groupBarcodes/{groupKey}/products/{code}` | `lookupInCache`, `saveToCache` | `saveToCache` reproduces the original "don't cache an all-zero item" guard. |

Every repository is `configure({db, serverTimestamp})`-injected; none reference the global `db`
or `firebase` directly, and none changed a Firestore path, document shape, or query. The
authoritative day/meal write (`SOURCE_HISTORY_SAVE_DAY`) is not duplicated here — it remains
exclusively behind `PersistenceGateway` (§19).

### 20.5 Platform Adapters and the Native-Portability Boundary

Per C1_SPEC §14.3's test — *"Can the module run under Node tests without DOM, browser globals,
Firebase, or service worker?"* — grep evidence for literal `document.`/`canvas`/`FileReader`/
`Notification.`/`navigator.`/`firebase.`/`html5-qrcode` usage (excluding the standard
`if (typeof window !== 'undefined') window.Foo = API` export line every module has) against the
six WP2 adapters:

| Adapter (`js/adapters/*.js`) | Wraps | Real platform tokens in module body |
|---|---|---|
| `authAdapter.js` | Firebase Auth subscribe/sign-in/sign-out/token | 0 — `auth`/`googleProvider` injected via `configure()` |
| `claudeProxyClient.js` | Authenticated POST to the Cloud Function proxy | 0 — reuses `AuthAdapter.getIdToken`, `fetch` injected |
| `openFoodFactsClient.js` | Open Food Facts HTTP + response mapping | 0 — `fetch` injected |
| `notificationAdapter.js` | Notification permission/display, SW readiness, timers | 1 |
| `barcodeScannerAdapter.js` | `html5-qrcode` dynamic load, scanner lifecycle | 3 |
| `imageAdapter.js` | `FileReader`/`Image`/canvas compression, camera input | 12 |

All six are loaded and `configure()`d once, at composition time, in `js/app.js` (§20.1); none
decide product policy or UI text, per C1_SPEC §11 (C1-WP2) rules.

### 20.6 UI / Application / Domain Separation

The same grep-based evidence, applied repository-wide, gives a four-tier classification (the
dependency direction is enforced exactly as in C1_SPEC §9.1 — arrows only point downward):

| Tier | Modules | Evidence |
|---|---|---|
| **Pure Domain** (no `configure()`; zero DOM/`window`/Firebase reference) | `js/core/dateUtils.js`, `numberUtils.js`, `jsonUtils.js`, `stringUtils.js`; `js/domain/nutritionModel.js`, `profileMetrics.js`; `js/nutrition/mealDraft.js`; `js/coach/coachProfile.js`; `js/adaptive/adaptiveTdeeDomain.js`; `js/trigger/triggerDomain.js` | Each module's own header states "אין כאן configure() כי אין תלות בפלטפורמה" ("no `configure()` — no platform dependency"); 0 platform-token grep hits. |
| **Application Services** (`configure()`-injected callbacks/session/DOM references, but the module itself contains no literal DOM/Firebase token) | `js/nutrition/nutritionAnalysisService.js`, `quickLogService.js`, `mealCommitService.js`; `js/coach/coachPromptComposer.js`, `coachClient.js`; `js/app/runtimeState.js`, `bootstrapController.js`, `authSessionController.js` | `mealCommitService.js`'s only DOM-shaped calls are `deps.getElementById(...)` — an injected function, not the global `document`. |
| **UI Presenters / Controllers** (own rendering; injected `documentRef`, never write durably themselves) | `js/ui/navigationController.js`, `homePresenter.js`, `profilePresenter.js`, `settingsPresenter.js`, `foodScreenPresenter.js`, `dayNavigationController.js`; `js/nutrition/mealEditorPresenter.js`, `barcodeFlowController.js`; `js/coach/coachPresenter.js`; `js/adaptive/adaptiveTdeeController.js`; `js/trigger/triggerController.js` | `mealEditorPresenter.js`'s own header states it is explicitly **not** a pure module ("אינו מודול טהור") — it owns `configure()`-injected DOM access. |
| **Engine Registry, Engines, State/Persistence** (unchanged B1–B5 contracts; C1 only relocated Habit/Pattern producer code) | `js/engineRegistry.js`, `stateAccess.js`, `persistenceGateway.js`, `derivedIntelligenceConsumer.js`, `derivedIntelligencePrompt.js`; `js/engines/habitEngine.js`, `patternEngine.js`, `adaptiveTdeeEngineAdapter.js`, `triggerEngineAdapter.js`, `registerEngines.js` | 0 platform-token grep hits across all five `js/engines/*.js` files — confirms WP9's "now-Node-requirable engines" claim. |

Forbidden directions from C1_SPEC §9.1 (pure domain → DOM/`window`/Firebase/`currentUser`;
UI renderer → direct durable write; engine → persistence bypassing StateAccess/PersistenceGateway)
were checked against this same grep evidence and are not present.

### 20.7 Final Module Map

```text
js/
  app.js                              — composition root (§20.1)
  firebase-config.js                  — pre-C1
  memory.js                           — pre-C1 (B1), independent SessionLifecycle registration

  core/                     (WP1)      dateUtils.js · numberUtils.js · jsonUtils.js · stringUtils.js
  domain/                   (WP1)      profileMetrics.js · nutritionModel.js
  adapters/                 (WP2)      authAdapter.js · notificationAdapter.js · imageAdapter.js
                                        barcodeScannerAdapter.js · openFoodFactsClient.js · claudeProxyClient.js
  repositories/             (WP3)      profileRepository.js · dayRepository.js · favoritesRepository.js
                                        groupRepository.js · barcodeRepository.js
  app/                      (WP4)      runtimeState.js · bootstrapController.js · authSessionController.js
  nutrition/                (WP5A–F)   nutritionAnalysisService.js · mealDraft.js · mealEditorPresenter.js
                                        mealCommitService.js · quickLogService.js · barcodeFlowController.js
  coach/                    (WP6)      coachProfile.js · coachPromptComposer.js · coachClient.js · coachPresenter.js
  adaptive/                 (WP7)      adaptiveTdeeDomain.js · adaptiveTdeeController.js
  trigger/                  (WP8)      triggerDomain.js · triggerController.js
  engines/                  (WP9)      habitEngine.js · patternEngine.js · adaptiveTdeeEngineAdapter.js
                                        triggerEngineAdapter.js · registerEngines.js
  ui/                       (WP10)     navigationController.js · homePresenter.js · profilePresenter.js
                                        settingsPresenter.js · foodScreenPresenter.js · dayNavigationController.js

  sessionLifecycle.js                  — pre-C1 (REM-002)
  nutritionValidator.js                — pre-C1 (REM-001)
  authorityContract.js                 — pre-C1 (REM-003)
  engineRegistry.js                    — pre-C1 (B2)
  stateAccess.js                       — pre-C1 (B3)
  persistenceGateway.js                — pre-C1 (B4)
  derivedIntelligenceConsumer.js       — pre-C1 (B5)
  derivedIntelligencePrompt.js         — pre-C1 (B5)
```

56 files under `js/` in total (verified against `index.html` script order and `sw.js` `SHELL`,
which are kept in identical, matching order — a WP11 verification step). This is the actual
final structure, not the C1_SPEC §26 *suggested* structure — it differs in some naming
(`triggerDomain.js`/`triggerController.js` instead of a `triggers/` folder split identically to
`adaptive/`, no separate `plan`/`workout`/`group`/`engagement` folders since those domains were
not in C1's approved extraction scope per §20.1) but follows the same layering and dependency
rules throughout.

### 20.8 Native Migration Readiness

Per the grep evidence in §20.5/§20.6, every module listed under **Pure Domain** and **Engine
Registry, Engines, State/Persistence** in §20.6 already satisfies C1_SPEC §14.3/Appendix C
(loads and runs under `node --test` with no DOM, `window`, Firebase, Notification, or
service-worker dependency) — matching the C1_SPEC §27 Native Migration Contract's list of what
should be reusable unchanged in a future native shell. Everything under **UI Presenters /
Controllers** and the six `js/adapters/*.js` platform adapters is exactly what §27 expects to be
replaced by native-specific implementations.
