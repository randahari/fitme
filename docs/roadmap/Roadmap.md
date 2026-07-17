# FITME Roadmap & Approvals

**Project Status:** In Progress  
**Single Source of Truth:** FITME Product Bible v1.0  
**Last Updated:** 2026-07-17

---

# Delivery Status Model

- 🟡 **Implemented** — Engineering implementation and automated checks are complete.
- 🟢 **Approved** — Product, architecture and engineering reviews passed.
- 🔵 **Validated** — Correct behavior was confirmed during real-world use.

---

# Sprint 1

## TASK-001 — Coach Brain / Typed Memory Foundation

**Status:** 🟢 APPROVED  
**Completion Date:** 2026-07-13

### Deliverables

- ✅ Product review
- ✅ Architecture review
- ✅ Typed memory infrastructure
- ✅ Transparency UI
- ✅ Engineering review
- ✅ Final approval

---

# Engineering Performance Work

## PERF-001 — Startup Performance

**Status:** ✅ COMPLETE

## PERF-002 — Startup Instrumentation

**Status:** ✅ COMPLETE — temporary instrumentation removed

## PERF-003 — Early App Shell Rendering

**Status:** ⛔ CANCELLED

---

# Sprint 2

## TASK-002 — Habit Engine

**Status:** 🟢 APPROVED  
**Implementation Version:** 2.15.0  
**Files Changed:** `js/app.js` only

### Deliverables

- ✅ Product specification
- ✅ Architecture review
- ✅ Implementation
- ✅ Engineering review
- ✅ Product and architecture approval
- ✅ Final approval
- 🔵 Long-term behavioral validation continues during normal use

---

## TASK-003 — Pattern Engine

**Status:** 🟢 APPROVED  
**Implementation Versions:** 2.16.0–2.17.1

### Deliverables

- ✅ Product specification
- ✅ Engineering architecture corrections
- ✅ Implementation design
- ✅ Deterministic pattern catalog
- ✅ Recompute-from-source lifecycle
- ✅ Fingerprint-gated persistence
- ✅ Engineering review
- ✅ Final approval
- 🔵 Long-term behavioral validation continues during normal use

---

# Architecture Remediation Program

## REM-001 — LLM Nutrition Output Validation Layer

**Status:** 🟢 APPROVED AND MERGED  
**Completion Date:** 2026-07-16  
**Implementation Version:** 2.18.0

### Deliverables

- ✅ Approved `docs/tasks/REM-001/SPEC.md`
- ✅ Formal Engineering Readiness Review — READY
- ✅ Shared deterministic nutrition validator
- ✅ Validation after AI normalization
- ✅ Validation again before authoritative persistence
- ✅ Coverage of all approved AI nutrition entry points
- ✅ Session-scoped transient validation cleanup
- ✅ 26 automated tests passed
- ✅ Commit and push to `main`
- ⏳ Broad end-to-end device QA deferred until the AI core reaches the planned integration checkpoint

---

## REM-002 — Session State Reset and Account Isolation

**Status:** 🟢 APPROVED AND MERGED
**Completion Date:** 2026-07-16
**Implementation Version:** 2.19.0

### Objective

Centralize cleanup of every user-scoped runtime variable on sign-out, authentication reset and account switch, preventing cross-account state leakage.

---

## REM-003 — Generative vs. Authoritative Boundary

**Status:** 🟢 APPROVED AND MERGED  
**Completion Date:** 2026-07-16  
**Implementation Version:** 2.20.0

### Deliverables

- ✅ Approved `docs/tasks/REM-003/SPEC.md`
- ✅ Formal Engineering Readiness Review — READY
- ✅ Authority Contract module (`js/authorityContract.js`)
- ✅ Authority Metadata + Audit Trail attached to every LLM-input write path
- ✅ Quick Learn brought into the same Authoritative Write Contract as other AI paths
- ✅ Generative Persistent Data tagging (Weekly Menu, Quick Learn catalog)
- ✅ Habit Engine / Pattern Engine / Adaptive TDEE authority metadata
- ✅ 42 automated tests passed
- ✅ Commit and push to `main`

---

**Phase A — Immediate Blockers: COMPLETE.** REM-001, REM-002 and REM-003 are all approved and merged.

---

## B1 — Canonical Memory Decision

**Status:** 🟢 APPROVED AND CLOSED  
**Completion Date:** 2026-07-17  
**Production Code Changes:** None

### Canonical Decision

FITME has exactly one Canonical User Memory Model per authenticated user. `coachMemory` is the
migration base and current logical root of canonical coach memory. No parallel memory system is
approved. Raw source history, canonical memory, derived intelligence, generative persistent data
and transient state remain explicitly separate domains. Habit Engine and Pattern Engine outputs
are classified as Derived Intelligence Views, not independent memory authorities.

### Deliverables

- ✅ Formal Engineering Readiness Review — READY
- ✅ Product/Architecture Approval — APPROVED
- ✅ Canonical memory architecture decision recorded in `docs/tasks/B1/SPEC.md`
- ✅ Downstream dependencies and risks identified for B2, B3, B4 and B5
- ✅ No implementation or migration performed (architecture decision only)

---

## B2 — Engine Contract and Registry

**Status:** 🟢 APPROVED AND MERGED  
**Completion Date:** 2026-07-17  
**Implementation Version:** 2.21.0

### Deliverables

- ✅ Approved `docs/tasks/B2/B2_SPEC.md` (v1.3)
- ✅ Formal Engineering Readiness Review Round 2 — READY
- ✅ One logical Engine Registry / Orchestrator (`js/engineRegistry.js`)
- ✅ Four engines registered: Habit Engine, Pattern Engine, Adaptive TDEE Engine, Trigger Engine
- ✅ Explicit per-engine `actions`/`payloads` (`EngineRunRequest`) — no action ever inferred from `undefined`
- ✅ Multiple triggers per engine without splitting Engine IDs
- ✅ Habit Engine single-flight (session-generation-scoped), replacing reliance on tie-break order
- ✅ No hard dependency introduced between Habit Engine and Pattern Engine
- ✅ All prior override-chaining/wrapper/replacement orchestration for these four engines removed
- ✅ REM-002 Session Lifecycle and REM-003 Authority Contract preserved unchanged
- ✅ 86 automated tests passed
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes
- ✅ Commit and push to `main`

---

**Phase B — In Progress.** B1 and B2 are closed. B3 is `NEXT`.

---

# Blocked Until Remediation Foundations Are Complete

## TASK-004 — Recommendation Engine

**Status:** ⏸️ PAUSED

Implementation must not begin until Phase A of the Architecture Remediation Plan is complete and the required Phase B architecture decisions are approved.

## TASK-005 — Initiative Engine

**Status:** ⏳ PENDING

## TASK-006 — Decision Engine

**Status:** ⏳ PENDING

## TASK-007 — UX System

**Status:** ⏳ PENDING

## TASK-008 — Design System

**Status:** ⏳ PENDING

---

# Next Step

Phase A of the Architecture Remediation Program is complete (REM-001, REM-002, REM-003).
B1 — Canonical Memory Decision is approved and closed, with no production code changes.
B2 — Engine Contract and Registry is approved, implemented (v2.21.0) and closed.

Begin B3 — State Ownership and Access Boundaries.
