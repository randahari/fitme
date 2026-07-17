# FITME — Changelog & Sprint Status

**Last Updated:** 2026-07-17

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
- ⏭️ Next task: B4 — Persistence Contract

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
