# FITME AI Architecture Remediation Plan v1.0

**Status:** Active  
**Authority:** Architecture Remediation Plan  
**Source:** Independent AI Architecture Review  
**Last Updated:** 2026-07-17  
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
**Status:** ✅ COMPLETED — v2.19.0, merged 2026-07-16

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
**Status:** ✅ COMPLETED — v2.20.0, merged 2026-07-17

Implemented outcomes:

- ✅ Explicit Generative, Validated and Authoritative trust tiers.
- ✅ Authority Contract module with authority metadata and audit trail support.
- ✅ Generative AI cannot directly mutate authoritative state without the approved validation and authority boundary.
- ✅ Quick Learn authoritative diary path gated by nutrition validation.
- ✅ Generative Persistent Data explicitly marked as non-authoritative.
- ✅ Authority metadata added to approved Habit Engine, Pattern Engine and Adaptive TDEE write paths.
- ✅ Session lifecycle compatibility preserved.
- ✅ 42 automated tests passed.

**Phase A Status:** ✅ COMPLETE

---

## Phase B — Architecture Foundations

### B1 — Canonical Memory Decision

**Finding:** F11  
**Status:** ✅ COMPLETED — architecture decision, 2026-07-17

Recorded outcomes:

- ✅ Architecture decision approved.
- ✅ Engineering Review `READY`.
- ✅ No production implementation required.
- ✅ One canonical logical user-memory model approved.
- ✅ `coachMemory` designated as migration base.
- ✅ Raw source history, canonical memory, derived intelligence, generative persistent data and transient state remain separate domains.
- ✅ Habit and Pattern outputs classified as Derived Intelligence Views.

### B2 — Engine Contract and Registry

**Findings:** F1, F3  
**Status:** ✅ COMPLETED — v2.21.0

Recorded outcomes:

- ✅ Common Engine Contract (`id`, `version`, `triggers[]`, `dependsOn`, `run(context)`) approved.
- ✅ One central Engine Registry / Orchestrator implemented (`js/engineRegistry.js`).
- ✅ Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine registered.
- ✅ Explicit per-engine `actions` and `payloads` (`EngineRunRequest`) — no engine's action is ever inferred from an undefined/absent value.
- ✅ Multiple triggers per engine supported without splitting Engine IDs (Trigger Engine, Adaptive TDEE Engine).
- ✅ All prior override-chaining/wrapper-reassignment/function-replacement orchestration for these four engines removed.
- ✅ Habit Engine single-flight (session-generation-scoped) implemented in the orchestration layer, replacing reliance on lexicographic tie-break order.
- ✅ No hard dependency introduced between Habit Engine and Pattern Engine.
- ✅ REM-002 Session Lifecycle and REM-003 Authority Contract preserved unchanged.
- ✅ 86 automated tests passed.
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes.

### B3 — State Ownership and Access Boundaries

**Finding:** F2  
**Status:** ⏭️ NEXT

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

Phase A is complete.

Phase B items MUST be architecturally specified before Recommendation Engine implementation begins.

Phase C items may be scheduled incrementally, provided they do not compromise Phase A or Phase B guarantees.

---

# 4. Current Work Item

## B3 — State Ownership and Access Boundaries

**Finding:** F2  
**Status:** ⏭️ NEXT

Required deliverable:

An approved B3 architecture specification in the project task documentation structure.

No implementation SHALL begin before the specification passes Engineering Readiness Review.

---

# 5. Completion Criteria

This remediation program is complete when:

- All Phase A risks are closed.
- Phase B architecture is approved.
- Recommendation Engine implementation can begin without unsafe or ambiguous foundations.
- Remaining Phase C debt is explicitly tracked in the roadmap and changelog.
