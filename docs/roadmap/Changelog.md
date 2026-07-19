# FITME — Changelog & Sprint Status

**Last Updated:** 2026-07-19

---

## Current Status

- ✅ Sprint 1 closed
- 🟢 TASK-001 approved
- 🟢 TASK-002 approved
- 🟢 TASK-003 approved
- 🟢 REM-001 approved, tested and merged
- 🟢 REM-002 approved, tested and merged
- 🟢 REM-003 approved, tested and merged
- ✅ Architecture Remediation Program — Phase A complete
- 🟢 B1 — Canonical Memory Decision approved and closed (architecture decision, no code change)
- 🟢 B2 — Engine Contract and Registry approved, tested and merged
- 🟢 B3 — State Ownership and Access Boundaries approved, tested and merged
- 🟢 B4 — Persistence Contract approved, tested and merged
- 🟢 B5 — Habit and Pattern Consumption Path approved, implemented, verified and closed
- ⏭️ Next task: C-series maintainability/scale items (per Remediation Plan Phase C)

---

## B1 — Canonical Memory Decision

**Date:** 2026-07-17
**Status:** Approved and closed (architecture decision only — no application version change)

### Decision

- One canonical logical user-memory model approved for FITME.
- `coachMemory` is designated as the migration base for canonical coach memory.
- Typed memory (`users/{uid}/memories`) is not a competing authority; it is directed to be mapped
  into the canonical model over time, not replaced or run as a parallel store.
- Habit Engine and Pattern Engine outputs are classified as Derived Intelligence Views —
  recomputable from source, not independent memory authorities.

### Verification

- Engineering Readiness Review: `READY`.
- Product/Architecture Review: `APPROVED`.
- No code, Firestore, Firebase Functions, or data migration changes.

### Next

B2 — Engine Contract and Registry is `NEXT`.

---

## v2.23.0 — B4 Persistence Contract

**Date:** 2026-07-18
**Status:** Merged to `main`

### Added

- `js/persistenceGateway.js` — one logical Persistence Gateway: closed six-operation catalog
  (`DERIVED_HABITS_REPLACE`, `DERIVED_PATTERNS_REPLACE`, `DERIVED_ADAPTIVE_PROPOSAL_APPLY`,
  `TRIGGER_RECORD_EVENT`, `TRIGGER_UPDATE_BUDGET`, `SOURCE_HISTORY_SAVE_DAY`), field-scoped
  Repository Layer, and a full validation pipeline (owner, domain, session generation,
  authority, payload, idempotency) ahead of every durable write.
- Ownership, Authority (REM-003) and Session (REM-002) validation enforced by the gateway
  itself, in addition to the existing B3 State Access Layer checks.
- Bounded retry (max 3 attempts, transient Firestore errors only, session re-checked before
  every retry) and an idempotency ledger (required for the append-style
  `TRIGGER_RECORD_EVENT`; naturally idempotent replace operations do not require a key).
- Pattern Engine conflict detection: `DERIVED_PATTERNS_REPLACE` checks `expectedVersion`
  against the durable `patternsMeta.sourceFingerprint` inside a Firestore transaction,
  returning `CONFLICT` (not a generic failure) on mismatch.
- `tests/persistenceGateway.test.js` with 52 automated tests.

### Changed

- Habit Engine, Pattern Engine, Adaptive TDEE (user-approved apply), Trigger Engine, and the
  AI-nutrition final authoritative boundary (`addMeal()`/`logQuick()`) now persist exclusively
  through the gateway instead of the broad `saveProfile()`/direct Firestore writes.
- Engine persistence outcome is reported via `output.persistence`
  (`{requested, status, requestId}`) on the `EngineRunResult` returned by each adapter —
  `js/engineRegistry.js` was not modified (its `EngineRunResult` shape stays closed).
- `applyAdaptiveUpdate()` and the meal-logging paths now use candidate-before-commit semantics
  with explicit rollback on a failed durable write, instead of mutating `userProfile`/
  `todayData` optimistically and silently swallowing persistence errors.
- `tests/stateAccess.test.js` updated for the new dependency signatures injected into
  `js/stateAccess.js`'s write operations (the operations' own contract — status/changed/
  domain/command/error/metadata — is unchanged).

### Fixed (Implementation Review)

- Habit Engine's write had no rollback on a failed durable write (unreachable before B4, since
  `saveProfile()` never rejected) — could silently advance `habitsMeta.lastRun` in memory
  without a durable save, blocking that day's retry. Aligned with Pattern's existing
  snapshot-and-rollback pattern.
- Trigger Engine's `markTriggerFired`/`recordCoachEvent` had the same class of gap —
  `markTriggerFired` in particular could permanently block `canFire()` retries for a trigger
  type after a failed write. Fixed with the same rollback pattern.
- The failure-path alert in `addMeal()`/`logQuick()`/`applyAdaptiveUpdate()` was not gated by
  session currency, unlike the success path — a user who signed out mid-flight could still see
  a stale-session failure alert. Fixed to match REM-002's completion-effect suppression rule.

### Verification

- Engineering Readiness Review: `READY`.
- Implementation Review: `APPROVED`, with the three corrections above applied and
  regression-tested.
- Automated tests: `170 passed / 0 failed`.
- B1, B2 and B3 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No B5/Recommendation Engine implementation.

### Next

B5 — Habit and Pattern Consumption Path is `NEXT`.

---

## v2.24.0 — B5 Habit and Pattern Consumption Path

**Date:** 2026-07-19
**Status:** Merged to `main`

### Added

- `js/derivedIntelligenceConsumer.js` — the sole consumption adapter for Habit/Pattern
  Derived Intelligence Views: request validation, a closed versioned Consumer Policy
  Catalog (`COACH_PROMPT_V1` fully enabled; `RECOMMENDATION_SUPPORT_V1` contract/test-only;
  `TEST_FULL_DIAGNOSTIC_V1` test-harness-only; `INITIATIVE_ENGINE`/`DECISION_ENGINE`
  disabled), `DerivedViewSnapshot` envelope construction, record normalization
  (Habit/Pattern → closed Domain/Topic/Qualifier vocabulary), duplicate resolution
  (byte-equivalent collapse, conflicting records diagnosed and excluded), eligibility
  filtering (lifecycle/confidence/evidence/freshness), the locked §22.3 freshness formula,
  relevance evaluation (domain/topic/temporal/sequence, `intent.purpose`
  `IMMEDIATE`/`REVIEW`), contradiction detection, overlap detection with deterministic
  primary selection, stable ordering, and policy-bounded truncation. Returns an immutable,
  deterministic `DerivedIntelligenceContext`. Performs zero durable writes and never
  triggers producer recomputation.
- `js/derivedIntelligencePrompt.js` — a separate, pure Hebrew prompt projector: bounded to
  8 items / 1,200 characters, cautious non-absolute wording (`ACTIVE` vs `CONFIRMED`
  lifecycle phrasing), no internal IDs/confidence values, and safe omission of any
  unsupported label key.
- New B3 State Access capability `derivedIntelligenceConsumer`/`BUILD` in
  `js/stateAccess.js`, reusing the existing `habitView`/`patternView` read operations
  unchanged, with no new write operations (`writes: []`).
- `tests/derivedIntelligenceConsumer.test.js` (66 tests) and
  `tests/derivedIntelligencePrompt.test.js` (10 tests) covering the full SPEC §57.1-§57.8
  minimum test matrix, plus `tests/b5Wiring.test.js` (10 static wiring checks) covering
  §57.9 Integration.

### Changed

- `buildCoachSystemPrompt()` (`js/app.js`) is now `async` and calls
  `DerivedIntelligenceConsumer.build()` (consumer `AI_COACH_PROMPT`, policy
  `COACH_PROMPT_V1`) followed by `DerivedIntelligencePrompt.project()` to append a bounded
  Hebrew derived-intelligence fragment to the Coach system prompt. The call is wrapped in
  try/catch — any B5 failure (state access, session, validation) degrades silently to the
  existing prompt (memory fragment + base persona), never blocking the Coach. Its one
  caller (`coachMessage()`) was updated to `await` it.
- `index.html` / `sw.js`: both new modules registered, loaded after
  `persistenceGateway.js` and before `app.js`; `APP_VERSION` / service worker `VERSION`
  bumped to `2.24.0`.

### Corrected (External Implementation Review)

The spec text in `docs/tasks/B5/B5_SPEC_v1.0.md` had since been revised to v1.2 (a canonical
correction), which locks a stricter requirement than the v1.1 text this implementation was
originally reviewed against. An independent External Implementation Review against the
current v1.2 text found two defects, both since fixed in `js/derivedIntelligenceConsumer.js`:

- **Production-safe adapter separation (§19.5/§41.2/§42.3/§51.4).** `window.DerivedIntelligenceConsumer`
  was previously the same object as the Node module export, so `TEST_HARNESS`/
  `TEST_FULL_DIAGNOSTIC_V1` (full per-signal diagnostics) were reachable from any
  browser-side caller. Added `buildProductionSafe()` and a separate `PRODUCTION_SAFE_API`
  object — `window` now receives only a production-safe adapter that accepts exclusively the
  production-enabled mapping (`AI_COACH_PROMPT` → `COACH_PROMPT_V1`) and rejects everything
  else with `POLICY_NOT_ALLOWED_FOR_CONSUMER` before the core module is ever invoked. The
  complete core module (all consumers/policies, for the Node test runner only) remains
  available exclusively via `module.exports`.
- **Contradiction category (§26.2).** `detectContradictions()` labeled every detected
  contradiction `LIFECYCLE_CONFLICT`; the only case implemented (opposing `ACTIVE`/`SKIP`
  tendency on identical domain/topic/qualifiers) is `OPPOSING_BEHAVIOR` per the spec's own
  closed taxonomy. Corrected; diagnostic-only, no behavioral change.

6 new regression tests added (5 in `tests/derivedIntelligenceConsumer.test.js`, 1 static check
in `tests/b5Wiring.test.js`) covering both corrections.

### Verification

- Engineering Readiness Review: the v1.1-era review returned `READY`; the spec was
  subsequently revised to v1.2 specifically to close the production-safe-adapter gap.
  External Implementation Review against the v1.2 text found that gap (plus the
  contradiction-category mislabel) still open; both were corrected as described above and
  independently re-verified at runtime (simulated browser `window` global plus direct
  output inspection, not just passing tests).
- External Engineering Re-Review (v1.2): `READY`. Implementation Review: `APPROVED`.
- Automated tests: `262 passed / 0 failed` (170 pre-existing + 86 B5 + 6 correction tests).
- B1, B2, B3 and B4 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No new Persistence Gateway operation; no new Engine Registry registration (B5 is a
  capability-holder under B3, not a B2 Engine — ADR-B5-008).
- B5_SPEC Appendix F closure record completed. B5 is `CLOSED`. Finding F9 is closed.

### Next

Phase C (maintainability/scale) items, per the Architecture Remediation Plan, are next.

---

## v2.22.0 — B3 State Ownership and Access Boundaries

**Date:** 2026-07-17
**Status:** Merged to `main`

### Added

- `js/stateAccess.js` — one logical State Access Layer module: `createEngineAccess()` factory,
  scoped read/write capability objects, and the locked permission matrix for the four B2 engines.
- `tests/stateAccess.test.js` with 34 automated tests.

### Changed

- `context.state` added additively to `EngineRunContext`, created exclusively by trusted adapter
  code in `js/app.js`; no parallel `run(context, access)` channel exists.
- Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine now read and write
  exclusively through scoped `context.state` capabilities instead of direct `userProfile` /
  `todayData` / Firestore access.
- Habit Engine and Pattern Engine stopped writing the shared `coachMemory.lastUpdated` field;
  each now maintains its own timestamp inside `habitsMeta` / `patternsMeta`.
- Engine computation separated from UI rendering (`presentTriggerCard`,
  `presentWorkoutTriggerCard`); visible card content and timing unchanged.
- `tests/b2Wiring.test.js` and `tests/habitSingleFlight.test.js` updated/extended for the new
  signatures and for behavioral coverage of the Habit single-flight self-provisioning path.
- `APP_VERSION` and service-worker cache version advanced to `2.22.0`.

### Verification

- Engineering Readiness Review + focused Re-Review: `READY`.
- Code Review: `APPROVED`, with two mechanical corrections applied (post-await session re-check on
  three write commands; added behavioral test coverage) and one architectural clarification —
  Habit single-flight self-provisioning on Pattern's internal soft-invocation path is orchestration
  helper code, not a second capability channel: `NO SPEC VIOLATION`, confirmed by Product/Architecture.
- Automated tests: `116 passed / 0 failed`.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No B4/B5/Recommendation Engine implementation.

### Next

B4 — Persistence Contract is `NEXT`.

---

## v2.21.0 — B2 Engine Contract and Registry

**Date:** 2026-07-17
**Status:** Merged to `main`

### Added

- `js/engineRegistry.js` — pure Engine Registry / Orchestrator module.
- Explicit per-engine `actions` and `payloads` (`EngineRunRequest`): every orchestration run supplies
  each engine its own action from a per-engine-id map — no engine's behavior is ever selected by
  treating an absent/`undefined` action as an implicit default.
- Habit Engine single-flight (session-generation-scoped), guaranteeing Habit Engine's underlying
  computation cannot run twice when both the Registry and Pattern Engine's internal call invoke it
  around the same time — independent of execution order.
- `tests/engineRegistry.test.js`, `tests/habitSingleFlight.test.js`, `tests/b2Wiring.test.js`.

### Changed

- Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine are now registered with, and
  invoked exclusively through, the Engine Registry.
- Removed the prior engine-orchestration override-chain wrappers on `showApp` (Stages 4–7),
  `logWeight` and `saveWorkout`.
- `scheduleLocalNotifications` consolidated to a single definition (previously a base function fully
  replaced by a later version — the base was dead code, never reached in production).
- `APP_VERSION` and service-worker cache version advanced to `2.21.0`.

### Verification

- Engineering Readiness Review Round 2: `READY`.
- Code Review: two correction rounds applied and re-verified (Habit single-flight, explicit
  per-engine action routing), `FIXED AND APPROVED`.
- Automated tests: `86 passed / 0 failed`.
- No Firestore rules changes.
- No Firebase Functions changes.
- No B3/B4/B5 implementation.

### Next

B3 — State Ownership and Access Boundaries is `NEXT`.

---

## v2.20.0 — REM-003 Generative vs. Authoritative Boundary

**Date:** 2026-07-16
**Status:** Merged to `main`

### Added

- `js/authorityContract.js` — pure Authority Contract module (Authority Metadata + Audit Trail).
- `tests/authorityContract.test.js` with 7 automated tests.

### Changed

- Every write path that receives LLM-generated content as input now attaches Authority Metadata
  (`authoritySource`, `createdBy`, `createdAt`, `rule`, `systemVersion`) before persistence.
- Quick Learn (`submitQuickLearn` / `logQuick`) brought into the same Authoritative Write Contract
  as every other AI entry point: the quick-log catalog is tagged as Generative Persistent Data,
  and the moment an item is actually logged to the diary it is re-validated and tagged
  `USER_CONFIRMED_AI_ESTIMATE` before it becomes authoritative.
- Weekly Menu (`generatePlan`) is explicitly tagged as Generative Persistent Data — not read by
  any deterministic engine, not treated as fact.
- Habit Engine, Pattern Engine and Adaptive TDEE writes now carry explicit authority metadata
  (`HABIT_ENGINE`, `PATTERN_ENGINE`, `SYSTEM` with rule `ADAPTIVE_TDEE_USER_APPROVED`) without any
  change to their existing detection/computation logic.
- `APP_VERSION` and service-worker cache version advanced to `2.20.0`.

### Verification

- Engineering Readiness Review: `READY` (after one round of SPEC corrections).
- Automated tests: `42 passed / 0 failed` (26 REM-001 + 9 REM-002 + 7 REM-003).
- No changes to Firebase Functions or Firestore rules.
- No Phase B work included (Canonical Memory, Engine Registry, State Ownership, full Persistence
  Contract remain explicitly out of scope and unstarted).

---

## v2.19.0 — REM-002 Session State Reset and Account Isolation

**Date:** 2026-07-16
**Status:** Merged to `main`

- Central Session Lifecycle Manager.
- Runtime session isolation.
- Async session generation guards.
- Runtime cleanup across user-scoped state.
- APP_VERSION updated to 2.19.0.

---

## v2.18.0 — REM-001 Nutrition Output Validation

**Date:** 2026-07-16  
**Status:** Merged to `main`

### Added

- `js/nutritionValidator.js` — shared pure deterministic validator.
- Validation statuses: `VALID`, `REVIEW_REQUIRED`, `REJECTED`.
- Hard validation for malformed, missing, negative, non-finite and contradictory nutrition values.
- Soft validation for macro completeness, macro/calorie mismatch and zero-value plausibility.
- Minimal review/recovery handling for suspicious or rejected AI estimates.
- `tests/nutritionValidator.test.js` with 26 automated tests.
- Architecture remediation plan.
- Approved REM-001 specification.

### Changed

- Every approved AI nutrition entry path now uses the shared normalization and validation layer.
- AI-generated nutrition is validated immediately after normalization.
- Final edited values are validated again before authoritative persistence.
- Invalid AI values are no longer silently coerced to zero.
- Transient nutrition-analysis state is cleared on authentication reset/sign-out.
- `APP_VERSION` and service-worker cache version advanced to `2.18.0`.

### Verification

- Engineering Readiness Review: `READY`.
- Automated tests: `26 passed / 0 failed`.
- Scope check confirmed no changes to Firebase Functions, Firestore rules, Habit Engine, Pattern Engine, Trigger Engine or Adaptive TDEE logic.
- Broad manual end-to-end QA is deferred to the planned AI-core integration checkpoint.

### Deployment

- Static application changes only.
- Published by commit and push to the configured GitHub Pages branch.
- No Firebase deploy required.

---

## v2.17.1 — Pattern Engine Stabilization

- Pattern Engine completed and approved.
- Full-history retrieval bug fixed.
- Current-state architecture documented.

---

## v2.15.0 — Habit Engine

- Habit Engine added to `js/app.js`.
- Daily non-blocking recomputation from source history.
- Results stored in `coachMemory.habits[]` and `coachMemory.habitsMeta`.
- No new UI, collection, Cloud Function or Firestore-rules change.

---

## Next

B3 — State Ownership and Access Boundaries.
