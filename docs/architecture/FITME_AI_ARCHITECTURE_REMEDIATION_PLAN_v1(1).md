# FITME AI Architecture Remediation Plan v1.0

**Status:** Active  
**Authority:** Architecture Remediation Plan  
**Source:** Independent AI Architecture Review  
**Last Updated:** 2026-07-16  
**Scope:** Required corrections before continuing ENG-011 or implementing the Recommendation Engine

---

# 1. Objective

Stabilize the current FITME AI architecture without performing an unnecessary full rewrite.

The remediation work SHALL:

- Resolve immediate safety and privacy risks.
- Establish enforceable engine boundaries.
- Remove architectural ambiguity before additional engines are added.
- Preserve already-approved product behavior.
- Avoid over-engineering the pilot.

---

# 2. Execution Order

## Phase A — Immediate Blockers

### A1 — LLM Output Validation Layer

**Finding:** F6  
**Severity:** Critical  
**Task:** REM-001  
**Status:** ✅ COMPLETED — v2.18.0, merged 2026-07-16

Implemented outcomes:

- ✅ Shared deterministic nutrition validator.
- ✅ Validation before persistence.
- ✅ Re-validation at the final authoritative write boundary.
- ✅ Hard rejection and user-review paths.
- ✅ Macro/calorie consistency checks.
- ✅ Invalid values are not silently converted to zero.
- ✅ Coverage across approved AI nutrition entry points.
- ✅ 26 automated tests passed.

### A2 — Session State Reset

**Finding:** F14  
**Severity:** High  
**Task:** REM-002  
**Status:** ⏭️ NEXT

Required outcome:

- Reset all user-scoped module state on sign-out and account switch.
- Prevent state from one account appearing in another account.
- Centralize session lifecycle cleanup.
- Define an explicit contract future engines must follow.

Note: REM-001 added narrow cleanup for transient nutrition-analysis state. REM-002 remains required because it must cover all user-scoped runtime state across the application.

### A3 — Generative vs. Authoritative Boundary

**Finding:** F13  
**Severity:** High  
**Task:** REM-003  
**Status:** ⏳ PENDING

Required outcome:

- Define explicit trust tiers.
- Generative AI MUST NOT directly mutate authoritative health, goal, habit, pattern or memory state.
- All authoritative writes MUST pass through approved deterministic write paths.

---

## Phase B — Architecture Foundations

### B1 — Canonical Memory Decision

**Finding:** F11  
**Status:** ⏳ PENDING

### B2 — Engine Contract and Registry

**Findings:** F1, F3  
**Status:** ⏳ PENDING

### B3 — State Ownership and Access Boundaries

**Finding:** F2  
**Status:** ⏳ PENDING

### B4 — Persistence Contract

**Findings:** F4, F5  
**Status:** ⏳ PENDING

### B5 — Habit and Pattern Consumption Path

**Finding:** F9  
**Status:** ⏳ PENDING

---

## Phase C — Maintainability and Scale

### C1 — Modularization and Tests

**Finding:** F12  
**Status:** 🟡 STARTED INCREMENTALLY

REM-001 established the first standalone pure module and automated test suite. Broader modularization remains pending.

### C2 — Rejection and Suppression Feedback

**Finding:** F8  
**Status:** ⏳ PENDING

### C3 — Event Model Decision

**Finding:** F7  
**Status:** ⏳ PENDING

### C4 — Typed Memory Server Write Path

**Finding:** F10  
**Status:** ⏳ PENDING

---

# 3. Implementation Gate

The project MUST NOT continue to ENG-011 or Recommendation Engine implementation until all Phase A items are approved and resolved.

Phase B items MUST be architecturally specified before Recommendation Engine implementation begins.

Phase C items may be scheduled incrementally, provided they do not compromise Phase A or Phase B guarantees.

---

# 4. Current Work Item

## REM-002 — Session State Reset and Account Isolation

Required deliverable:

`docs/tasks/REM-002/SPEC.md`

No implementation SHALL begin before the specification passes Engineering Readiness Review.

---

# 5. Completion Criteria

This remediation program is complete when:

- All Phase A risks are closed.
- Phase B architecture is approved.
- Recommendation Engine implementation can begin without unsafe or ambiguous foundations.
- Remaining Phase C debt is explicitly tracked in the roadmap and changelog.
