# FITME — Changelog & Sprint Status

**Last Updated:** 2026-07-16

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

Phase A of the Architecture Remediation Program is complete. Phase B (Canonical Memory, Engine
Contract and Registry, State Ownership, Persistence Contract, Habit/Pattern Consumption Path)
requires Product & Architecture review before implementation begins.
