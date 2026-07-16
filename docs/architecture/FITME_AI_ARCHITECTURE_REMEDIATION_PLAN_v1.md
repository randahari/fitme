# FITME AI Architecture Remediation Plan v1.0

**Status:** Draft  
**Authority:** Architecture Remediation Plan  
**Source:** Independent AI Architecture Review  
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

These items MUST be resolved first.

### A1 — LLM Output Validation Layer

**Finding:** F6  
**Severity:** Critical

Required outcome:

- Validate AI-generated nutrition data before persistence.
- Reject or flag implausible calories and macros.
- Enforce required fields.
- Verify macro-to-calorie consistency.
- Prevent invalid AI output from becoming authoritative history.

### A2 — Session State Reset

**Finding:** F14  
**Severity:** High

Required outcome:

- Reset all user-scoped module state on sign-out and account switch.
- Prevent state from one account appearing in another account.
- Centralize session lifecycle cleanup.

### A3 — Generative vs. Authoritative Boundary

**Finding:** F13  
**Severity:** High

Required outcome:

- Define explicit trust tiers.
- Generative AI MUST NOT directly mutate authoritative health, goal, habit, pattern, or memory state.
- All authoritative writes MUST pass through approved deterministic write paths.

---

## Phase B — Architecture Foundations

These items MUST be resolved before the Recommendation Engine is implemented.

### B1 — Canonical Memory Decision

**Finding:** F11

Required outcome:

- Select one canonical memory system.
- Define migration and compatibility rules.
- Prevent future engines from choosing storage ad hoc.

### B2 — Engine Contract and Registry

**Findings:** F1, F3

Required outcome:

- Define one common engine interface.
- Replace override-chaining for future engines with an explicit registry/orchestrator.
- Make execution order and dependencies visible.

### B3 — State Ownership and Access Boundaries

**Finding:** F2

Required outcome:

- Define which engine owns each state namespace.
- Require state access through explicit interfaces.
- Prevent direct cross-engine mutation.

### B4 — Persistence Contract

**Findings:** F4, F5

Required outcome:

- Create one shared persistence path for engine state.
- Standardize rollback and retry behavior.
- Use transactions where concurrent writes may conflict.

### B5 — Habit and Pattern Consumption Path

**Finding:** F9

Required outcome:

- Define how habits and patterns influence recommendation and coaching behavior.
- Prevent computed intelligence from remaining unused.

---

## Phase C — Maintainability and Scale

These items SHOULD be planned after the blockers and foundations are stable.

### C1 — Modularization and Tests

**Finding:** F12

Required outcome:

- Extract pure engine logic from the monolithic runtime.
- Add automated tests for every new engine.
- Reduce regression risk without requiring an immediate full rewrite.

### C2 — Rejection and Suppression Feedback

**Finding:** F8

Required outcome:

- Allow explicit user rejection to suppress or reduce confidence in inferred memories, habits, and patterns.

### C3 — Event Model Decision

**Finding:** F7

Required outcome:

- Either make `coachEvents` a real architectural input or retire it.
- Eliminate write-only architectural concepts.

### C4 — Typed Memory Server Write Path

**Finding:** F10

Required outcome:

- Either implement the planned trusted server-side writer or remove unsupported source types until required.

---

# 3. Implementation Gate

The project MUST NOT continue to ENG-011 or Recommendation Engine implementation until all Phase A items are approved and resolved.

Phase B items MUST be architecturally specified before Recommendation Engine implementation begins.

Phase C items may be scheduled incrementally, provided they do not compromise Phase A or Phase B guarantees.

---

# 4. First Work Item

The first remediation task is:

## REM-001 — LLM Nutrition Output Validation Layer

Required deliverable:

`docs/tasks/REM-001/SPEC.md`

No code SHALL be written before the specification is approved.

---

# 5. Completion Criteria

This remediation plan is complete when:

- All Phase A risks are closed.
- Phase B architecture is approved.
- Recommendation Engine implementation can begin without relying on unsafe or ambiguous foundations.
- Remaining Phase C debt is explicitly tracked in the roadmap and changelog.
