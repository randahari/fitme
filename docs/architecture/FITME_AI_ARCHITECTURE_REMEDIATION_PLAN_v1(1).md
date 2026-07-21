# FITME AI Architecture Remediation Plan v1.0

**Status:** Active  
**Authority:** Architecture Remediation Plan  
**Source:** Independent AI Architecture Review  
**Last Updated:** 2026-07-21 (C1 closure)  
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
**Status:** ✅ COMPLETED — v2.22.0

Recorded outcomes:

- ✅ One logical State Access Layer implemented (`js/stateAccess.js`), scoped by user, session
  generation, engine ID and action.
- ✅ `context.state` added additively to `EngineRunContext` as the sole capability-delivery channel;
  no parallel `run(context, access)` channel introduced.
- ✅ Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine migrated to explicit
  scoped read snapshots and owner-controlled write commands.
- ✅ Habit Engine and Pattern Engine stopped writing the shared `coachMemory.lastUpdated` field;
  domain-specific timestamps moved into `habitsMeta` / `patternsMeta`.
- ✅ Engine computation separated from UI rendering (Section 17); visible behavior preserved.
- ✅ Architecture clarification recorded and approved: Habit single-flight self-provisioning on
  Pattern's internal soft-invocation path is orchestration-helper code, not a second capability
  channel — `NO SPEC VIOLATION` (see `docs/tasks/B3/SPEC.md` Appendix B.4).
- ✅ B1 and B2 preserved unchanged; REM-002 and REM-003 preserved unchanged.
- ✅ 116 automated tests passed.
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes.

### B4 — Persistence Contract

**Findings:** F4, F5  
**Status:** ✅ COMPLETED — v2.23.0

Recorded outcomes:

- ✅ One logical Persistence Gateway implemented (`js/persistenceGateway.js`), closed
  six-operation catalog (`DERIVED_HABITS_REPLACE`, `DERIVED_PATTERNS_REPLACE`,
  `DERIVED_ADAPTIVE_PROPOSAL_APPLY`, `TRIGGER_RECORD_EVENT`, `TRIGGER_UPDATE_BUDGET`,
  `SOURCE_HISTORY_SAVE_DAY`).
- ✅ Field-scoped Repository Layer replacing broad `saveProfile()`/direct Firestore writes for
  Habit, Pattern, Adaptive TDEE (user-approved apply), Trigger, and the AI-nutrition
  authoritative boundary (`addMeal()`/`logQuick()`).
- ✅ Ownership, Authority (REM-003) and Session (REM-002) validation enforced by the gateway
  ahead of every durable write.
- ✅ Bounded retry, Pattern conflict detection (`expectedVersion` + Firestore transaction), and
  idempotency for the append-style `TRIGGER_RECORD_EVENT`.
- ✅ `output.persistence` used for engine persistence reporting — `js/engineRegistry.js`
  unmodified.
- ✅ Implementation Review `APPROVED`, with three corrections applied and regression-tested
  (Habit rollback, Trigger rollback, stale-session failure-alert suppression).
- ✅ B1, B2 and B3 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- ✅ 170 automated tests passed.
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes.

### B5 — Habit and Pattern Consumption Path

**Finding:** F9 — CLOSED  
**Status:** ✅ COMPLETED, APPROVED AND MERGED — v2.24.0

Recorded outcomes:

- ✅ One logical `DerivedIntelligenceConsumer` implemented (`js/derivedIntelligenceConsumer.js`),
  the sole consumption adapter for Habit/Pattern Derived Intelligence Views.
- ✅ Closed, versioned Consumer Policy Catalog (`COACH_PROMPT_V1` fully enabled;
  `RECOMMENDATION_SUPPORT_V1` contract/test-only; `TEST_FULL_DIAGNOSTIC_V1` test-harness-only;
  `INITIATIVE_ENGINE`/`DECISION_ENGINE` disabled).
- ✅ `DerivedViewSnapshot` envelope, normalization, the locked §22.3 freshness formula,
  eligibility and relevance filtering, duplicate/contradiction handling, overlap detection with
  deterministic primary selection, stable ordering and policy-bounded truncation — all
  deterministic, no LLM ranking.
- ✅ Separate `js/derivedIntelligencePrompt.js` prompt projector (bounded, cautious wording,
  no internal IDs/confidence values).
- ✅ New B3 State Access capability (`derivedIntelligenceConsumer`/`BUILD`) reusing the existing
  `habitView`/`patternView` read operations unchanged — no new writes.
- ✅ AI Coach integrated as the sole consumer (`buildCoachSystemPrompt()`), failure-isolated so
  B5 never blocks existing Coach behavior.
- ✅ No new Persistence Gateway operation; B5 is not a B2-registered Engine (ADR-B5-008,
  capability-holder under B3 only).
- ✅ B1, B2, B3 and B4 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- ✅ An External Implementation Review against the B5 v1.2 spec correction found two defects
  (missing production-safe browser-adapter separation per §41.2/§42.3/§51.4; a mislabeled
  `OPPOSING_BEHAVIOR` contradiction reported as `LIFECYCLE_CONFLICT` per §26.2) — both fixed
  in `js/derivedIntelligenceConsumer.js`, with 6 new regression tests.
- ✅ 262 automated tests passed (170 pre-existing + 92 new).
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes.
- ✅ Commit created and pushed to `main`. Finding F9 is closed. Recommendation Engine
  implementation is formally unblocked, subject to its own separate specification and approval.

**Phase B Status:** ✅ COMPLETE (B1, B2, B3, B4, B5)

---

## Phase C — Maintainability and Scale

### C1 — Modularization and Tests

**Finding:** F12  
**Status:** ✅ COMPLETE — v2.25.0–v2.40.0, WP1–WP11, closed 2026-07-21

REM-001 established the first standalone pure module and automated test suite. `docs/specs/C1_SPEC_v1.0.md`
(approved) then drove the full incremental modularization of `js/app.js` across eleven work packages
(WP0 characterization through WP11 final composition-root cleanup), preserving B1–B5 contracts and
product behaviour unchanged. 995 automated tests passed / 0 failed. See
`docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md` for full deliverables.

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

Phase B (B1-B5) is complete. C1 (Modularization and Tests) is complete. Current work item:
none — C1 closure complete, awaiting Product/Architecture direction on Phase C continuation.
Next work item: C2 (Rejection and Suppression Feedback), pending its own approved
specification; implementation has not begun. C3 (Event Model Decision) and C4 (Typed Memory
Server Write Path) remain pending, scheduled incrementally per §3, provided they do not
compromise Phase A or Phase B guarantees.

---

# 5. Completion Criteria

This remediation program is complete when:

- All Phase A risks are closed.
- Phase B architecture is approved.
- Recommendation Engine implementation can begin without unsafe or ambiguous foundations.
- Remaining Phase C debt is explicitly tracked in the roadmap and changelog.
