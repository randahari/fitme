# FITME Roadmap & Approvals

**Project Status:** In Progress  
**Single Source of Truth:** FITME Product Bible v1.0  
**Last Updated:** 2026-07-26

---

# Delivery Status Model

- 🟡 **Implemented** — Engineering implementation and automated checks are complete.
- 🟢 **Approved** — Product, architecture and engineering reviews passed.
- 🔵 **Validated** — Correct behavior was confirmed during real-world use.

---

# Governance Documentation

## Coach Bible — Chapter 1

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-07-22

`docs/governance/FITME_Coach_Bible.md` is the canonical coaching doctrine document (Chapter 1: "How Humans Actually Change" — approved). `docs/governance/FITME_Coach_Knowledge_Base.md` remains the living research/pre-canonical repository that future Bible chapters are derived from. Referenced from the Product Bible and the Engineering Workflow's Source of Truth hierarchy. Documentation-only change; no product behaviour, UX, or code affected.

---

## Coach Knowledge Base — Authoring Program Complete

**Status:** 🟢 COMPLETED
**Completion Date:** 2026-07-23

`docs/governance/FITME_Coach_Knowledge_Base.md` v2.0 is complete. Its Canonical Rules, Knowledge Map, Canonical Topic Structure and Knowledge Authoring Standard are approved, and all 36 Topics across all four Parts — Human Nature (01–10), Health Psychology (11–20), The FITME Coach (21–30) and Product Translation (31–36) — are authored and Canonical. Topic 01 — "Why do people fail?" (v1.1) remains the approved Gold Standard; Topics 02–36 were authored to match its structure, depth and writing style, each grounded in its corresponding FITME Coach Bible chapter(s). No Topics remain pending. This is a separate workstream from engineering delivery and does not change engineering order or priorities — C3 and C4 are both closed, completing Phase C (C4 closed 2026-07-26). Documentation-only change; no product behaviour, UX, or code affected.

---

## FITME Intelligence & Relationship Philosophy v1.1

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-07-26

`docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` (canonical content, revised to v1.1 during editorial review) is the canonical intelligence and relationship philosophy document, defining how FITME understands people and the kind of relationship it is designed to build with every user — independent of feature, implementation or architecture detail. Documentation-only change; no product behaviour, UX, or code affected. The document's own Governance section (Canonical Authority, Document Scope, Authority Hierarchy, Amendment Process, Interpretation Rules) is currently headings-only pending separately-supplied policy content; its ranking in the Source of Truth hierarchy relative to the AI Constitution, Product Bible and Coach Bible has not yet been decided and is not reflected in `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §3 or the Product Bible's Governance References by this entry.

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

## B3 — State Ownership and Access Boundaries

**Status:** 🟢 APPROVED AND MERGED  
**Completion Date:** 2026-07-17  
**Implementation Version:** 2.22.0

### Deliverables

- ✅ Approved `docs/tasks/B3/SPEC.md` (v1.1)
- ✅ Formal Engineering Readiness Review + focused Re-Review — READY
- ✅ One logical State Access Layer (`js/stateAccess.js`), scoped by user, session generation,
  engine ID and action
- ✅ `context.state` added additively to `EngineRunContext` as the sole capability-delivery channel
- ✅ Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine migrated to explicit
  scoped read snapshots and owner-controlled write commands
- ✅ Habit Engine and Pattern Engine stopped writing the shared `coachMemory.lastUpdated` field
- ✅ Engine computation separated from UI rendering; visible product behavior preserved
- ✅ Code Review: one architectural clarification raised and resolved (Habit single-flight
  self-provisioning — `NO SPEC VIOLATION`), two mechanical test/session-check corrections applied
- ✅ REM-002 Session Lifecycle and REM-003 Authority Contract preserved unchanged
- ✅ B1 and B2 preserved unchanged
- ✅ 116 automated tests passed
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes
- ✅ Commit and push to `main`

---

## B4 — Persistence Contract

**Status:** 🟢 APPROVED AND MERGED  
**Completion Date:** 2026-07-18  
**Implementation Version:** 2.23.0

### Deliverables

- ✅ Approved `docs/tasks/B4/B4_SPEC.md` (v1.0)
- ✅ Formal Engineering Readiness Review — READY
- ✅ One logical Persistence Gateway (`js/persistenceGateway.js`), closed six-operation catalog
- ✅ Field-scoped Repository Layer replacing broad `saveProfile()`/direct Firestore writes on
  the migrated paths
- ✅ Ownership, Authority (REM-003) and Session (REM-002) validation enforced by the gateway
- ✅ Bounded retry, Pattern conflict detection (`expectedVersion` + transaction), and
  idempotency for append-style operations
- ✅ Habit Engine, Pattern Engine, Adaptive TDEE (user-approved apply), Trigger Engine and the
  AI-nutrition authoritative boundary migrated to the gateway
- ✅ `output.persistence` used for engine persistence reporting — `js/engineRegistry.js`
  unchanged
- ✅ Implementation Review: `APPROVED`, with three corrections applied (Habit rollback,
  Trigger rollback, stale-session failure-alert suppression) and regression-tested
- ✅ B1, B2 and B3 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged
- ✅ 170 automated tests passed
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes
- ✅ Commit and push to `main`

---

## B5 — Habit and Pattern Consumption Path

**Status:** 🟢 APPROVED AND MERGED
**Completion Date:** 2026-07-19
**Implementation Version:** 2.24.0

### Deliverables

- ✅ Approved `docs/tasks/B5/B5_SPEC_v1.0.md` (canonical content, revised to v1.2 during review) — `CLOSED`
- ✅ External Architecture Audit and two-pass External Engineering Readiness Review — READY
  (against v1.1); an External Implementation Review against the subsequent v1.2 correction
  found two defects (production-safe adapter separation, contradiction category), both fixed
  and independently re-verified; External Engineering Re-Review (v1.2): READY
- ✅ One logical `DerivedIntelligenceConsumer` (`js/derivedIntelligenceConsumer.js`) — closed
  versioned Consumer Policy Catalog, `DerivedViewSnapshot` construction, normalization,
  eligibility/relevance filtering, contradiction detection, overlap detection with
  deterministic primary selection, stable ordering, policy-bounded truncation, immutable
  `DerivedIntelligenceContext` output
- ✅ Separate `js/derivedIntelligencePrompt.js` prompt projector — bounded (8 items / 1,200
  chars), cautious Hebrew wording, no internal IDs/confidence values
- ✅ New B3 State Access capability (`derivedIntelligenceConsumer`/`BUILD`) reusing the
  existing `habitView`/`patternView` read operations — no new writes
- ✅ AI Coach (`buildCoachSystemPrompt()`) integrated as the sole consumer, wrapped in
  try/catch so any B5 failure never blocks the Coach
- ✅ 92 new automated tests (`derivedIntelligenceConsumer.test.js`,
  `derivedIntelligencePrompt.test.js`, `b5Wiring.test.js`) covering SPEC §57's full minimum
  test matrix plus the two Implementation Review corrections
- ✅ B1, B2, B3 and B4 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged
- ✅ 262 automated tests passed (170 pre-existing + 92 new)
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes
- ✅ No new Persistence Gateway operation; B5 is not a B2-registered Engine (ADR-B5-008)
- ✅ Commit created and pushed to `main`
- ✅ Remediation Finding F9 is closed; Recommendation Engine is formally unblocked (subject to
  its own separate specification and approval)

---

**Phase B — Complete.** B1, B2, B3, B4 and B5 are all closed.

---

# Phase C — Maintainability and Scale

## C1 — Modularization and Tests

**Status:** 🟢 APPROVED AND MERGED
**Completion Date:** 2026-07-21
**Implementation Versions:** 2.25.0–2.40.0 (WP1–WP11)

### Deliverables

- ✅ Approved `docs/specs/C1_SPEC_v1.0.md` (v1.1)
- ✅ WP0 — Characterization harness and repository inventory (pre-implementation baseline: 262 tests passed)
- ✅ WP1 — Shared pure utilities (`js/core/*`, `js/domain/*`)
- ✅ WP2 — Platform adapters (`js/adapters/*`)
- ✅ WP3 — Repository layer (`js/repositories/*`)
- ✅ WP4 — Session and application bootstrap (`js/app/*`)
- ✅ WP5A–F — Nutrition application domain (`js/nutrition/*`)
- ✅ WP6 — Coach and prompt composition (`js/coach/*`)
- ✅ WP7 — Adaptive TDEE domain (`js/adaptive/*`)
- ✅ WP8 — Trigger and notification domain (`js/trigger/*`)
- ✅ WP9 — Habit and Pattern engine extraction (`js/engines/*`)
- ✅ WP10 — UI controllers and override consolidation (`js/ui/*`)
- ✅ WP11 — Final composition root cleanup
- ✅ B1–B5 contracts preserved unchanged throughout
- ✅ 995 automated tests passed / 0 failed
- ✅ No product behaviour, UX, Firestore schema or Firestore Security Rules changes
- ✅ Commit and push to `main`

## C2 — Rejection and Suppression Feedback

**Status:** 🟢 APPROVED AND MERGED
**Completion Date:** 2026-07-26
**Implementation Version:** 2.41.0

### Deliverables

- ✅ Approved `docs/specs/C2_SPEC_v1.1.md`
- ✅ New shared pure utility `js/feedback/feedbackDomain.js` (feedback classification + named/versioned suppression-recovery policy, same tier as `ProfileMetrics`/`DateUtils`/`CoachProfile`)
- ✅ Persistence Gateway closed catalog extended with `RECOMMENDATION_FEEDBACK_RECORD` (reuses the existing `coachEvents` durable surface and the existing `triggerState`/`profileGoalsState` owners — no new owner, no new field)
- ✅ StateAccess permission matrix extended with `recommendationFeedbackHistory` / `recordRecommendationFeedback`, scoped only to `triggerEngine/DAILY_COACH_CHECK` and `adaptiveTdeeEngine/ADAPTIVE_CHECK`
- ✅ Trigger card dismiss gesture added; `runCoachTriggers` filters suppressed candidates (`TriggerDomain.canFire` unchanged)
- ✅ Adaptive TDEE `applyAdaptiveUpdate`/`dismissAdaptiveUpdate` record Accepted/Dismissed feedback; `runAdaptiveCheck` consults the suppression gate for `ADAPTIVE_CHECK` only
- ✅ B1–B5 and C1 contracts preserved unchanged throughout
- ✅ 1044 automated tests passed / 0 failed
- ✅ No new engines, memory models, event models, or persistence models
- ✅ Commit `14755fc` on `main`

## C3 — Event Model Decision

**Status:** 🟢 APPROVED AND CLOSED
**Completion Date:** 2026-07-26
**Production Code Changes:** None

### Canonical Decision

The recommendation-feedback family (`kind:'feedback'`, introduced by C2) is confirmed as FITME's
canonical behavioral-event model, formalized with a closed event vocabulary and a versioned entry
schema (version 1). The pre-existing ordinary Trigger-fired record family
(`recordCoachEvent`/`TRIGGER_RECORD_EVENT`) is reclassified as legacy bookkeeping, outside the
canonical event model — no new architectural consumer may be built against it. A retention policy
(feedback evidence has priority over legacy bookkeeping within the existing cap) is recorded
canonically; its implementation mechanism is intentionally left unspecified for future engineering.
No Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry code was added, removed, or
refactored.

### Deliverables

- ✅ Approved `docs/specs/C3_SPEC_v1.0.md` (its Architecture Discovery input was a reviewed, session-based analysis, not a separately committed repository file)
- ✅ Canonical event vocabulary and schema (version 1) recorded
- ✅ Ordinary Trigger-fired records reclassified as legacy bookkeeping — no new consumer permitted
- ✅ Retention policy recorded (feedback prioritized over legacy bookkeeping); mechanism left to future engineering
- ✅ Known limitations (C3-F01 concurrency, C3-F04 delivery/open tracking, C3-F05/F06/F07/F08/F09) recorded as accepted, unresolved
- ✅ B1–B5 and C1/C2 contracts preserved unchanged
- ✅ No Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry changes
- ✅ 1044 automated tests passed / 0 failed, unmodified
- ✅ No Firestore schema, Firestore rules or Firebase Functions changes
- ✅ No new engines, memory models, event models, or persistence models
- ✅ Commit and push to `main`

## C4 — Typed Memory Server Write Path

**Status:** 🟢 APPROVED AND CLOSED
**Completion Date:** 2026-07-26
**Implementation Version:** 2.41.0 (unchanged — server-side only; no client script or `APP_VERSION` change)

### Deliverables

- ✅ Approved `docs/specs/C4_SPEC_v1.0.md`
- ✅ New trusted server-side Typed Memory write capability, `functions/typedMemoryServerWrite.js` (`configure`/`write`), restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, targeting `users/{uid}/memories/{memoryId}` only
- ✅ Every created record written with `status: 'candidate'` unconditionally — the REM-003/B1 Generative-vs-Authoritative compliance mechanism; no request-supplied `status` value is ever honored
- ✅ `source`, `status` and `type` immutable after creation; deterministic identity derived from `(uid, source, idempotencyKey)`; timestamps server-computed only
- ✅ No client-reachable interface added — no new `exports.*` in `functions/index.js`; no caller/producer wired (a complete, tested, unconsumed capability, the same status the Habit and Pattern Engines already have for their own output)
- ✅ `js/memory.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/authorityContract.js`, `js/app.js`, `firestore.rules`, `index.html`, `sw.js`, and every existing Engine preserved unchanged
- ✅ B1–B5, REM-003 and C1–C3 contracts preserved unchanged
- ✅ 1082 automated tests passed / 0 failed (1044 baseline + 38 new)
- ✅ No Firestore schema, Firestore Rules, or client-permission changes
- ✅ No new engines, memory models, event models, or persistence models
- ✅ Commit `f026123` on `main`

---

**Phase C — C1, C2, C3 and C4 complete.**

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
B3 — State Ownership and Access Boundaries is approved, implemented (v2.22.0) and closed.
B4 — Persistence Contract is approved, implemented (v2.23.0) and closed.
B5 — Habit and Pattern Consumption Path is approved, implemented (v2.24.0) and closed.
C1 — Modularization and Tests is approved, implemented (WP1–WP11, v2.25.0–v2.40.0) and closed.
C2 — Rejection and Suppression Feedback is approved, implemented (v2.41.0) and closed.
C3 — Event Model Decision is approved and closed (canonical decision, no production code changes).
C4 — Typed Memory Server Write Path is approved, implemented and closed (server-side only, no `APP_VERSION` change).

Current Work Item: none — C4 closure complete. Phase C (C1–C4) is complete.
Next Work Item: not yet named. No Phase C item beyond C4 is currently defined in the Architecture Remediation Plan; the next canonical task is pending Product/Architecture direction.
