# FITME Roadmap & Approvals

**Project Status:** In Progress  
**Single Source of Truth:** FITME Product Bible v1.0  
**Last Updated:** 2026-07-16

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
Phase B architecture decisions (Canonical Memory, Engine Contract and Registry, State Ownership,
Persistence Contract, Habit/Pattern Consumption Path) require Product & Architecture review before
any implementation begins.
