# FITME Roadmap & Approvals

**Project Status:** In Progress  
**Single Source of Truth:** FITME Product Bible v1.0  
**Last Updated:** 2026-08-03

---

# Delivery Status Model

- 🟡 **Implemented** — Engineering implementation and automated checks are complete.
- 🟢 **Approved** — Product, architecture and engineering reviews passed.
- 🔵 **Validated** — Correct behavior was confirmed during real-world use.

---

# Governance Documentation

## Coach Bible — Chapters 1–22 (Complete)

**Status:** 🟢 APPROVED AND CANONICAL
**Chapter 1 Completion Date:** 2026-07-22
**Chapters 2–22 Completion Date:** 2026-08-05

`docs/governance/FITME_Coach_Bible.md` is the canonical coaching doctrine document. Chapter 1 ("How Humans Actually Change") was approved and integrated into project governance on 2026-07-22. Chapters 2–22 — added to the repository 2026-07-27, and since relied upon by the FITME Safety Layer Canonical Decision Package v2.0 and `docs/specs/SL-001_SPEC_v1.0.md` (Ch.17/Ch.19 citations) and by TASK-004's Canonical Source Inventory, and amended (Chapter 3 §4) to v1.1 on 2026-08-03 per RCD-08 of that Decision Package — completed an independent Product and AI Architecture review on 2026-08-05: no Product blockers, no Architecture blockers, no Safety blockers, and no Authority-boundary violations were found. The document (Chapters 1–22, "Status: Canonical — Complete" per its own header) is confirmed APPROVED AND CANONICAL in full as of this entry. `docs/governance/FITME_Coach_Bible_Canonical_Review.md` is a Chapter 21–22/Manifesto content excerpt, not a separate review record. `docs/governance/FITME_Coach_Knowledge_Base.md` remains the living research/pre-canonical repository that Bible chapters are derived from. Referenced from the Product Bible and the Engineering Workflow's Source of Truth hierarchy. Documentation-only synchronization; no Coach Bible content, product behaviour, UX, or code affected by this entry.

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

## FITME Specification Authoring Standard v1.1

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-08-03

`docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` (supersedes `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md`) is the standard governing how FITME task specifications are authored, evidenced, reviewed, and completed, consolidating reusable specification-authoring rules into a single source of truth for that purpose. It governs task specifications only; it does not govern the Product Bible, AI Constitution, Architecture, Engineering Workflow, Roadmap, Changelog, Coach Bible, Coach Knowledge Base, or Intelligence & Relationship Philosophy, and it does not redefine the Engineering Workflow's task lifecycle or Source of Truth hierarchy. `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §4 references this standard as the authoring requirements for the lifecycle's SPEC stage. Documentation-only change; no product behaviour, UX, or code affected.

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

# D-Series — Coach Decision Policy

## D1 — Coach Intelligence Translation Model

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-07-27
**Production Code Changes:** None

### Canonical Decision

`docs/specs/D1_SPEC_v1.0.md` is the canonical decision-policy specification translating FITME's
approved governance and coaching philosophy (AI Constitution, Product Bible, Coach Bible, Coach
Knowledge Base, Intelligence & Relationship Philosophy) into deterministic decision rules covering
Decision Inputs, User State Model, Opportunity Detection, Intervention Eligibility, Prioritization,
Recommendation Policy, Initiative Policy, Silence Policy, Evidence Requirements, Memory Usage,
Personalization, Authority Boundaries and Canonical Decision Output. D1 defines policy only; it
does not define architecture, prompts, APIs, UI or implementation, and it does not itself implement
the Recommendation Engine (TASK-004), Initiative Engine (TASK-005) or Decision Engine (TASK-006).

### Deliverables

- ✅ Approved `docs/specs/D1_SPEC_v1.0.md`
- ✅ 17 Units expanded into deterministic SHALL/SHALL NOT decision rules, each traceable to an approved canonical source
- ✅ 5 Canonical Decision Required (CDR) items recorded for gaps that could not be derived from an approved canonical source
- ✅ No architecture, prompt, API, UI or implementation decisions made
- ✅ No code, tests, Firestore schema, Firestore Rules or Firebase Functions changes
- ✅ Product/AI Architect review and canonical approval complete

---

## D2 — Coach Decision Pipeline Specification

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-07-27
**Production Code Changes:** None

### Canonical Decision

`docs/specs/D2_SPEC_v1.0.md` is the canonical orchestration specification governing how coach
decisions flow from input through execution: the single canonical Pipeline (Stage ordering, Stage
Contracts, Pipeline Invariants, Decision Lifecycle, Engine Responsibilities, Exceptional Flows, and
Pipeline Traceability) that independently-built implementations of the Recommendation Engine
(TASK-004), Initiative Engine (TASK-005) and Decision Engine (TASK-006) — together with the
cross-cutting Safety Layer and Memory Layer — must conform to. D2 defines orchestration only; it
does not define coaching, recommendation, evidence, memory, priority, personalization or safety
policy (D1's, or an earlier canonical document's, exclusive territory), does not define engineering
implementation, and does not itself implement TASK-004, TASK-005 or TASK-006.

### Deliverables

- ✅ Approved `docs/specs/D2_SPEC_v1.0.md`
- ✅ 12 Units (00–11) plus Consolidated Canonical Decision Requirements, each traceable to D1 or an
  approved canonical document
- ✅ 1 Canonical Decision Required (CDR) item raised during specification derivation, resolved by
  Product/AI Architecture decision during Canonical Review; D1's own open CDR items (CDR-1, CDR-2,
  CDR-4) remain inherited and unresolved, unaffected by D2's scope
- ✅ No architecture, prompt, API, UI or implementation decisions made
- ✅ No code, tests, Firestore schema, Firestore Rules or Firebase Functions changes
- ✅ Product/AI Architect review and canonical approval complete

---

## D3 — Coach Decision System Architecture

**Status:** 🟢 APPROVED AND CANONICAL
**Completion Date:** 2026-07-27
**Production Code Changes:** None

### Canonical Decision

`docs/specs/D3_SPEC.md` is the canonical architecture specification governing how D1's decision
policy and D2's orchestration pipeline are realized inside FITME's existing system architecture:
architectural responsibilities, ownership, runtime role, and integration boundaries for the Coach
Decision System's six internal collaborators (Memory Layer, Recommendation Engine, Initiative
Engine, Decision Engine, Safety Layer, Expression) and its Internal Pipeline Orchestrator, all
registered as a single Composite Engine in the existing B2 Engine Registry. D3 defines architecture
only; it does not define coaching, recommendation, evidence, memory, priority, personalization or
safety policy (D1's, or an earlier canonical document's, exclusive territory), does not define
engineering implementation, and does not itself implement TASK-004, TASK-005 or TASK-006.

### Deliverables

- ✅ Approved `docs/specs/D3_SPEC.md` (v1.2)
- ✅ 17 sections positioning D1's and D2's logical components against the existing architecture —
  the Engine Registry (B2), StateAccess (B3), the Persistence Gateway (B4), the Derived Intelligence
  Consumer (B5), the module layering and native-portability boundary (C1), the canonical event model
  (C3), and the Typed Memory Server Write Path (C4) — each traceable to D1, D2, or an approved
  B/C-series specification
- ✅ 6 Canonical Decisions issued by the Head of Product and AI Architect across Canonical Review,
  resolving every architectural composition question raised during authoring: Composite Engine
  registration (Decision 1), reuse of the existing Trigger Catalog with no new trigger type
  (Decision 2), exclusive Memory Layer ownership of Pipeline Context Assembly (Decision 3),
  separation of Coaching History from Typed Memory (Decision 4), a platform-neutral, immutable
  Delivery Intent produced by Expression (Decision 5), and the Coach Runtime as the sole
  platform-mapping owner across Web and future Native clients (Decision 6)
- ✅ No architecture invented beyond composing D1 and D2 with the approved system; no product or
  coaching-logic policy introduced
- ✅ No code, tests, Firestore schema, Firestore Rules or Firebase Functions changes
- ✅ Product/AI Architect review and canonical approval complete

---

**D-Series — Complete.** D1, D2 and D3 are all approved and Canonical. This concludes the D-series
architecture phase.

---

# Blocked Until Remediation Foundations Are Complete

## TASK-004 — Recommendation Engine

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/TASK_004_SPEC_v1.0.md` passed the Final Canonical Gate Review and was approved by Head of Product + AI Architect for Canonical READY, per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed). Implementation is complete: `js/coachDecisionSystem/` (Composite Engine registration, Internal Pipeline Orchestrator, minimal Memory Layer, Recommendation Engine — D3 §17's first two of six collaborators), 62 new tests, full suite 1144/1144 passing. Approved by Head of Product + AI Architect and closed 2026-07-29 — see `docs/specs/TASK_004_SPEC_v1.0.md`'s Closure Record for details, evidence, and tracked follow-up items (none of which expand this task's own scope).

## TASK-005 — Initiative Engine

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/TASK_005_SPEC_v1.0.md` completed Canonical Review, Product Approval, Architecture Approval, and Engineering Review (all approved), per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed). Implementation is complete: `js/coachDecisionSystem/initiativeEngine.js` (new — the Initiative Engine, D3 §17's third of six internal collaborators), with a focused extension to `memoryLayer.js` (Canonical Decision CD-T005-01) and `internalPipelineOrchestrator.js`; 68 new/changed tests, full suite 1212/1212 passing. A focused code-review correction pass (four corrections) was applied and verified before approval. Approved by Head of Product + AI Architect and closed 2026-08-02 — see `docs/specs/TASK_005_SPEC_v1.0.md`'s Closure Record for details, evidence, and tracked follow-up items (none of which expand this task's own scope).

## TASK-006 — Decision Engine

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/TASK_006_SPEC_v1.0.md` completed Engineering Readiness Review, Implementation, External Implementation Review, Product Approval, and Architecture Approval (all approved), per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed). Implementation is complete: `js/coachDecisionSystem/eligibilityEvaluator.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyIntegrationPort.js` (new — the Decision Engine, D3 §17's fourth of six internal collaborators, owning Stage 5/7/8/9), with a focused arbitration-metadata extension to `recommendationEngine.js`/`initiativeEngine.js` (Canonical Decision CD-T006-02) and a new `runDecisionPass()` dispatch on `internalPipelineOrchestrator.js`; 106 new/changed tests, full suite 1318/1318 passing. The External Implementation Review found one blocker (an inverted Evidence Hierarchy tie-break comparator), corrected in a single focused pass and independently re-verified before approval. Approved by Head of Product + AI Architect and closed 2026-08-03 — see `docs/specs/TASK_006_SPEC_v1.0.md`'s Closure Record for details, evidence, and tracked follow-up items (none of which expand this task's own scope).

## SL-001 — Safety Layer

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/SL-001_SPEC_v1.0.md` completed Canonical Review, Root Cause Investigation (RG-3), Resolution Analysis, Product Approval, and Architecture Approval (all approved), per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed). Implementation is complete: `js/coachDecisionSystem/safetyLayer.js` (new — the Safety Layer, D3 §17's fifth of six internal collaborators, the production implementation behind the existing, policy-free `safetyIntegrationPort.js`, Canonical Decision CD-T006-05), with `index.html`/`sw.js` script/shell wiring for the one new file; 4 new tests, full suite **1374/1374 passing**. All fifteen Required Canonical Decisions (RCD-01 through RCD-15) in the FITME Safety Layer Canonical Decision Package (v2.6, Closed) are resolved, including the Safety Decision Matrix (RCD-02/09/10/12/14), the closed `reasonCode`/`reasonDetail` contract (RCD-03/11/13), the meaning of `ESCALATED` (RCD-04), and RCD-15 (RG-3 Resolution — Decision-Level Modification for tied-set Terminal Decisions), approved following a dedicated Root Cause Investigation that also confirmed the Health/Safety Profile Source and MODIFIED Ownership questions were already resolved by existing canonical text, requiring no new decision. Approved by Head of Product + AI Architect and closed 2026-08-05 — see `docs/specs/SL-001_SPEC_v1.0.md`'s Closure Record for details, evidence, and tracked follow-up items (none of which expand this task's own scope).

## TASK-007 — UX System

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/TASK_007_SPEC_v1.0.md` completed implementation across ten Work Packages (C1 precedent — implement, test, self-review, and commit one Work Package at a time, each requiring its own Product Review and Architecture Review before commit), per the Engineering Workflow lifecycle. Implementation is complete: WP1–WP3 static accessibility baseline (`aria-live`, `aria-label`, `<label for>`, `prefers-reduced-motion`) across onboarding, Home, Settings, Food, and Workout; WP4 keyboard operability and deterministic focus management on the barcode overlay; WP5 deterministic Home-card sequencing plus a Dismiss affordance added to the coach card; WP6–WP7 structured failure/success presentation (replacing generic `alert()` calls with messages differentiated by the Persistence Gateway's actual `status`/`error.code`/`error.retryable`) across the Adaptive/Settings and Nutrition domains; WP8 a return-after-absence continuity signal on Home, sourced from existing day-history data with no new Persistence field; WP9 a cross-cutting audit fixing two RTL icon-directionality gaps and one cross-surface context-handoff gap (the Adaptive partial-day prompt's "Complete" button, now day-scoped via a method added to `DayNavigationController`'s own already-exposed API object rather than a new `js/app.js` facade, preserving the C1-characterized window-assignment inventory unchanged); WP10 documentation and closure only. 12 test files extended or added, 97 net new/changed tests, full suite **1471/1471 passing** (from the pre-TASK-007 baseline of 1374/1374). Approved by Head of Product + AI Architect and closed 2026-08-06 — see `docs/specs/TASK_007_SPEC_v1.0.md`'s Closure Record (§31.4) for details, evidence, and two tracked follow-up items surfaced during closure verification (an additive, previously-approved `js/persistenceGateway.js` export that is a literal exception to §26.4's No-Touch list; `APP_VERSION` not advanced despite shipped user-visible behavior — both explicitly non-blocking, neither expanding this task's own scope, both awaiting Product/Architecture disposition).

## TASK-008 — Design System

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/TASK_008_SPEC_v1.0.md` completed implementation across fourteen Work Packages (WP4 retired as Not Applicable per OD-8008-6 — no elevation/shadow token system), per the Engineering Workflow lifecycle. Implementation is complete: WP1–WP3 foundational design tokens (color/spacing/radius, typography, motion) formalizing the existing primitive layer, no value changed; WP5–WP6 iconography convention and theme-mechanism formalization; WP7–WP8 Component Catalog consolidation (buttons, toggle, empty-state, segmented controls, cards, badges) via a property-by-property objective-derivation methodology, with the four properties lacking an objective winner resolved by explicit Product/Architecture decision; WP9 semantic communication surface taxonomy (Coach Message / Adaptive Update); WP10 inline-style-override classification (composition rules); WP11–WP13 incremental screen migration (Home/Food; Workout/Profile/Settings; Onboarding/Login/Barcode overlay) to the token layer, building and progressively extending the WCAG 2.1 AA contrast fixture (§20.1/§20.2, OD-11a/OD-11b); WP14 cross-cutting audit, finding and fixing two gaps never assigned to a prior Work Package (the loading screen, the persistent bottom navbar) and confirming §26/§28's structural requirements. A Semantic Token Usage Contract (Option E, extending OD-8008-11's objective-derivation precedent) was approved mid-implementation to resolve recurring WCAG findings without a fresh Decision Package per instance; three findings requiring an actual visual-identity judgment (`.btn-primary`/`.btn-small`/`.int-btn.active` white-on-primary text; `.confidence-badge.high`/`.quick-chip[disabled]` success-on-success-subtle; `.confidence-badge.low` danger-on-danger-subtle — all dark-mode only) were explicitly deferred to a future Brand/Visual Identity phase, not resolved. 15 test files added/extended; full suite **1607/1607 passing** (1471 pre-TASK-008 baseline, net +136). Two governance-sequencing deviations occurred during implementation (WP10, WP12) and are recorded accurately, not omitted, in the Specification's own Closure Record. Approved by Head of Product + AI Architect and closed 2026-08-09 — see `docs/specs/TASK_008_SPEC_v1.0.md`'s Closure Record (§31.4) for full details, evidence, and tracked follow-up items (none of which expand this task's own scope).

---

## Expression — D3 §17's Sixth and Final Coach Decision System Collaborator

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/EXPRESSION_SPEC_v1.0.md` completed implementation across fifteen Work Packages, per the Engineering Workflow lifecycle. Implementation is complete: WP1 the Delivery Intent field-level schema (`deliveryIntentContract.js`, `EXP-OD-9` resolved); WP2 the dispatch mechanism (`runExpressionStage()` added to `internalPipelineOrchestrator.js` as a separate function, `EXP-OD-3` resolved); WP3 defensive `TerminalDecision` input validation and Silence-kind no-output handling (`expressionInputGate.js`); WP4 base-case (`UNMODIFIED`) rendering (`expressionRenderer.js`) plus, under Canonical Decision 8 (D3 Decision 7), the Expression Rendering Context — a second, narrow, closed Stage-10 input (`expressionRenderingContext.js`) resolving `D1-PER-03`'s signal-availability gap without modifying `TerminalDecision`; WP5–WP7 `REFUSAL`/`ESCALATION`/Safety-intervention-disclosure rendering (Canonical Decisions CD-EXP-02/03/04); WP8 multi-option (tied-set) rendering; WP9 the live Coach Runtime handoff — `SafetyLayer` (SL-001) and `ExpressionRenderer` wired as production ports in `internalPipelineOrchestrator.js`'s `run()`, `TriggerController.presentDeliveryIntent()` reusing the existing `#trigger-card` element (no new delivery surface, D3 Decision 6 preserved), and the D2-EF-07 Pre-Expression User Correction supersession guarantee (`EXP-OD-4` resolved); WP10 exceptional-flow confirmation (§19, EXP-42); WP11 Memory/Persistence boundary confirmation (§18, EXP-41 — zero calls to `js/persistenceGateway.js`, no StateAccess capability of its own); WP12 Determinism/Explainability/Accessibility/Language/Cross-Platform confirmation (§20–§24); WP13 the deterministic qualitative-content-verification mechanism (`tests/fixtures/expressionQualitativeVerificationTestDouble.js`, `EXP-OD-11` resolved), by direct structural analogy to `safetyIntegrationPortTestDouble.js` (TASK-006), test-only and never production-reachable; WP14 cross-cutting audit, closing two narrow AC-3/AC-4 test-coverage gaps and synchronizing Appendix C's Open Decision Register; WP15 documentation and closure. 15 test files added/extended across the full sequence; full suite **1796/1796 passing** (1607 pre-Expression baseline, net +189). Repository Gap G-2 (no live Stage 3/4 Opportunity source, pre-existing since TASK-005/006, unaffected by Expression) means the Coach Decision System's Delivery Intent is not yet actually produced in production today — the full Stage 1→10 wiring is real, live, and tested, but currently dormant pending that separate, not-yet-scoped gap's resolution; `APP_VERSION` was accordingly **not** advanced (no shipped user-visible change — see the Specification's own Closure Record for the full evidence). Two further non-blocking follow-ups carried forward at closure: `EXP-OD-10` (bounded-modification content-generation algorithm — no canonical source exists, `MODIFIED` currently unreachable in production) and the `presentDeliveryIntent()`/`presentTriggerCard()` `#trigger-card` coexistence question (dormant given G-2; falls under `TASK_007_SPEC_v1.0.md`'s own pre-existing, still-open OD-5). Approved by Head of Product + AI Architect and closed 2026-08-17 — see `docs/specs/EXPRESSION_SPEC_v1.0.md`'s Closure Record (§33.5) for full details, evidence, and tracked follow-up items (none of which expand this task's own scope).

---

## G-2 — Live Stage 3/4 Opportunity Recognition

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/G2_SPEC_v1.0.md` completed implementation, closing Repository Gap G-2 (no live Stage 3/4 Opportunity source, open since TASK-005/006 and unaffected by Expression) for its one approved V1 path: Habit-derived `FOOD_LOGGING`/`log-consistency` `WEAKENING`, established via the Habit Lifecycle Establishment Correction's `provenance.currentEpisodeEstablished===true` fact (Coach Semantic Foundation Canonical Decision Package Chapter 29). A G-2 Post-Prerequisite Engineering Readiness Review found no remaining Product, Architecture, or Canonical blocker (READY FOR IMPLEMENTATION) before implementation began. New: `js/coachDecisionSystem/contextualMeaningPolicy.js` (Contextual Meaning construction and the one approved V1 Product Reason Policy rule, `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`) and `js/coachDecisionSystem/evidenceEvaluator.js` (Stage-4 Evidence Evaluation, `SUFFICIENT`/`REPEATED_BEHAVIOUR` on the real establishment fact). Modified: `js/stateAccess.js` (bounded `GoalObjectiveContext` read), `js/coachDecisionSystem/memoryLayer.js` (Pipeline Context extension), `js/coachDecisionSystem/recommendationEngine.js` (honestly-empty Stage-3 detector, RG-1 preserved non-blocking), `js/coachDecisionSystem/initiativeEngine.js` (additive `semanticOpportunities`, existing behavior byte-identical), `js/coachDecisionSystem/internalPipelineOrchestrator.js` (`run()` now builds a real `opportunities` array via mechanical Stage-3 collection → Stage-4 Evidence Evaluation → Stage 4→5 handoff, replacing the previously-hardcoded empty array), `js/derivedIntelligenceConsumer.js` (B5 lifecycle-aware `INITIATIVE_SUPPORT_V1` branching — Habit-derived `WEAKENING` admitted only on the real establishment fact, Pattern-derived excluded unconditionally), `index.html`/`sw.js` (registration for the two new modules). Production-backed verified end-to-end using the real, unmodified-elsewhere Habit Engine (virtual-clock technique, no hand-injected status): real establishment → real `WEAKENING` → real B5 admission → real Memory Layer → real Initiative Engine → real `ContextualMeaningPolicy` → real `EvidenceEvaluator` → real, unmodified `eligibilityEvaluator.js` → `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` (Decision-Pass-level Silence), confirmed not `MALFORMED` — this Silence outcome is intentional and correct, since no affirmative Trust source is approved for v1 and none was fabricated. 10 test files added/extended; full suite **1896/1896 passing** (1816 pre-G-2 baseline, net +80). `APP_VERSION`/service-worker `VERSION` left unchanged (`2.41.0`/`v2.41.0`), matching Expression's own precedent, since no new user-visible Coach behavior ships. RG-1, RG-2, and all Future Items recorded in the Specification's own Open Items section remain open/future, unresolved by this closure. Approved by Head of Product + AI Architect and closed — see `docs/specs/G2_SPEC_v1.0.md`'s Closure Record (§53) for full details and evidence.

---

## RGEF — Relationship-Guided Engagement Foundation

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/RGEF_SPEC_v1.0.md` completed implementation across eight Work Packages, per the Engineering Workflow lifecycle — the first Work Item to make the G-2 Opportunity actually reach the user. Implementation is complete: WP1 a promoted `js/domain/domainTopicVocabulary.js` Domain/Topic shared vocabulary (moved verbatim out of `derivedIntelligenceConsumer.js`, B5's own derivation logic unchanged); WP2 Domain/Topic propagation onto `DetectedOpportunity`; WP3 a closed Stage-5 "Bounded Early-Relationship Engagement" admission path in `eligibilityEvaluator.js` for exactly one Source×Reason combination (`CONFIRMED_PATTERN_ANTICIPATION`/`REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, `glad === null`, never mutated — never fabricating Trust); WP4 a matching closed Stage-6 Source×Reason maturity-gating override in `initiativeEngine.js`, admitting that one combination at Observer stage; WP5 feedback identity, shared-card precedence, and the write path — `stateAccess.js` gains an honest `PERMISSIONS.coachDecisionSystem.DECISION_PASS.writes: ['recordRecommendationFeedback']` grant, `app.js`'s composition root derives `opportunityId`/`domain`/`topic` from the real `terminalDecision.candidateProvenance[0]` (never `opportunitiesConsidered`, never a heuristic), and `triggerController.js`'s `presentDeliveryIntent()` gains its own Dismiss-control creation/binding and same-cycle Composite-Initiative-over-Trigger `#trigger-card` precedence, per Head of Product's Shared Coach Card Architecture Decision; WP6 Domain/Topic pattern aggregation (`feedbackDomain.js`'s new `evaluateDomainTopicReceptiveness()`, reusing `RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1` by reference — an explicit RGEF V1 Product-approved policy reuse, not an invented policy); WP7 Stage-6 consumption of that Domain/Topic receptiveness signal in `initiativeEngine.js`; WP8 end-to-end production-backed verification and closure.

Two genuine implementation-time blockers were found, escalated, and explicitly resolved by Head of Product + AI Architect rather than patched around: **(1)** a latent Stage-6 rule-leakage defect in `recommendationEngine.js` (no source-ownership gate — would have constructed an unowned `'Recommendation'`-kind Candidate for Initiative-exclusive/Safety-exclusive Opportunity sources), closed by a new `STAGE6_ACCEPTED_SOURCES` gate on both `recommendationEngine.js` (`['DECISION_WINDOW']`) and `initiativeEngine.js`; **(2)** WP7's design required `initiativeEngine.js`'s first-ever dependency on `js/feedback/feedbackDomain.js`, contradicting an existing passing test and TASK-005 §36's deliberately-left-open Repository Gap A-2 — resolved by an explicit, narrow Architecture Decision granting exactly `evaluateDomainTopicReceptiveness()` consumption, never a blanket coupling; `wasIgnoredBefore()` (D1-IP-08) remains local and unchanged.

Production-backed verified end-to-end using the real, unmodified-elsewhere `runHabitEngine()` arc (virtual-clock technique): real `FOOD_LOGGING` history → established `WEAKENING` → real B5 → real Memory Layer → real Internal Pipeline Orchestrator → a real `INITIATIVE` Terminal Decision (`glad` verified to remain `null`) → real Expression → real `presentDeliveryIntent()` → a simulated Dismiss → a real `coachDecisionSystem`-identified StateAccess feedback write, attribution derived only from the real `terminalDecision.candidateProvenance[0]`. All fourteen Section 28 acceptance criteria plus the five Section 28.1 shared-card-precedence/dismiss-ownership criteria demonstrated against real production code. Test coverage added/extended across nine test files; full suite **1946/1946 passing** (1896 pre-RGEF baseline, net +50). `APP_VERSION`/service-worker `VERSION` advanced from `2.41.0`/`v2.41.0` to **`2.42.0`/`v2.42.0`** — the first closure in this program where the G-2 Opportunity actually reaches Expression/presentation, a genuinely new user-visible Coach behavior. Open/deferred, explicitly not resolved by this closure: TASK-005 §36 Repository Gap G-3, TASK-007's own OD-5, true `Ignored`-feedback production, Stage-7 Domain/Topic-informed prioritization, general TASK-005 §36 E-2 resolution, and future receptiveness-policy calibration. Approved by Head of Product + AI Architect and closed — see `docs/specs/RGEF_SPEC_v1.0.md`'s Closure Record (§32) for full details and evidence.

---

## USM-001 — Authoritative User Understanding Foundation, First Vertical

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/USM_001_SPEC_v1.0.md` completed implementation across six Work Packages — the first Work Item of the Authoritative User Understanding Foundation, proving Model B (several legitimate producer stores/derived engines → one authoritative semantic projection assembled by Memory Layer) with the smallest possible new surface area: an existing, manually user-stated Typed Memory fact/preference becomes a real, currently-authoritative Coaching Decision Input, reaching the existing Coach Prompt Composition consumer, observably personalizing its content, and remaining fully correctable and forgettable — without creating a second durable user-memory store and without inventing any new Domain/Topic/Opportunity/Trust/Goal semantics from raw text.

New: `js/userStatedMemoryPrompt.js` (a small, dedicated, bounded, deterministic projector — Engineering-bounded `MAX_FACTS`/`MAX_CHARS`, independent of and not inherited from B5's `derivedIntelligencePrompt.js`'s own, differently-scoped bounds). Modified, additively only: `js/stateAccess.js` (new `userStatedMemory` read op and a new, dedicated `memoryLayer`/`USER_STATED_MEMORY_READ` StateAccess capability-holder identity — explicitly not an `EngineRegistry` engine, not an alias for and not a widening of `coachDecisionSystem`/`DECISION_PASS`; consent-gated fail-closed to `[]` before any fetch is attempted; filters to exactly `type ∈ {fact, preference}` × `source: 'user_stated'` × `status: 'active'`; deterministic `updated_at` desc / `id` asc ordering); `js/coachDecisionSystem/memoryLayer.js` (one new, independent, additively-versioned export, `assembleUserStatedMemoryFragment()` — structurally separate from `assembleContext()`/`PipelineContext`, since it serves a different consumer, Coach Prompt Composition, never the Decision Pass; `assembleContext()` itself is byte-identical before/after); `js/coach/coachPromptComposer.js` (`buildSystemPrompt()` gains one new, additive, structurally distinct fragment step, positioned between the legacy `coachMemoryFragment()` and B5's derived-intelligence fragment, per the Product priority that explicit user statements have immediate value ahead of passively-inferred behavioral signal; never classifies, tags, or routes raw text into any Domain/Topic/Opportunity/Trust/Goal/Target); `js/app.js` (`StateAccess.configure()` gains one new injected dependency reusing `js/memory.js`'s own existing, unmodified `list()` export — no new Firestore query, no direct Firestore access from Memory Layer). `js/memory.js`, `firestore.rules`, `js/persistenceGateway.js`, every Decision-System Stage 3-10 module, Safety Layer, and `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` (remains paused) are explicitly unmodified.

An Engineering Readiness Review found and resolved, before implementation, a genuine script-load-order conflict (`coachPromptComposer.js` loaded before `memoryLayer.js`/`expressionRenderingContext.js` in `index.html`): resolved by relocating `js/coachDecisionSystem/expressionRenderingContext.js` and `js/coachDecisionSystem/memoryLayer.js` together, preserving their own dependency order, to immediately after `js/derivedIntelligencePrompt.js` and before `js/coach/coachPromptComposer.js` — a verified-safe, ordinary script-tag reorder (confirmed via a repository-wide reference search: no file loading between the old and new positions depends on either relocated file), not a new resolution-timing technique. During implementation, this relocation was found to violate an existing wiring test's own broader-than-necessary invariant (`tests/coachDecisionSystemWiring.test.js`'s "all seventeen modules load after `registerEngines.js`") and two further tests asserting the exact prior literal source line of `buildSystemPrompt()`'s own final return statement (`tests/c1Wp6Wiring.test.js`, `tests/b5Wiring.test.js`) — all three were mechanically corrected to reflect the newly-approved architecture, preserving every other assertion in each test unchanged, per this program's own established precedent for approved, mechanical test updates.

Production-backed verified end-to-end using the real, unmodified-elsewhere `js/stateAccess.js`, `js/coachDecisionSystem/memoryLayer.js`, `js/userStatedMemoryPrompt.js`, and `js/coach/coachPromptComposer.js`, with only the Firestore-backed `js/memory.js` CRUD boundary simulated (via `js/memory.js`'s own real, exported `makeMemory()`/`validateMemory()` helpers, `js/memory.js`'s own D6 UI functions being pre-existing, unrelated-to-this-Work-Item, not Node-testable): consent `false` → fact absent from the composed prompt, fetch never attempted; consent `true` → fact present under its own distinct header; edit → next fresh prompt shows only the corrected value; delete → next fresh prompt shows neither; consent revoke → next fresh prompt shows no Typed Memory content, with no page reload; the legacy `coachMemoryFragment()` and the new fragment coexist without interference; a session that goes stale mid-fetch degrades honestly, never leaking stale data; two independently-configured users never see each other's facts. Test coverage added across five test files (four extended, one new production-backed acceptance file); full suite **1997/1997 passing** (1946 pre-USM-001 baseline, net +51). `APP_VERSION`/service-worker `VERSION` advanced from `2.42.0`/`v2.42.0` to **`2.43.0`/`v2.43.0`** — a genuinely new, user-visible Coach behavior (personalized prompt content) ships. Open/deferred, explicitly not resolved by this closure: `type:'preference'` has no live producer yet (RG-1), true historical supersession, Chat/Conversation/Voice, C4 producer wiring, explicit-request scope/duration, temporal/future-event memory, Goal+Why, Relationship Maturity, Trust (Affirmative Trust V1 remains paused, to be reviewed — not modified — after this foundation), Habit/Pattern mirroring into Typed Memory, and medical/safety semantic classification. Approved by Head of Product + AI Architect and closed — see `docs/specs/USM_001_SPEC_v1.0.md`'s Closure Record for full details and evidence.

---

## ESAF-001 — Explicit User Statement Arrival Freshness

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/ESAF_001_SPEC_v1.0.md` completed implementation across five Work Packages — a narrow foundation-correctness vertical proving that new authoritative user information can invalidate a Decision assembled before it arrived, by connecting two pieces of already-existing, already-tested, previously-dormant production machinery: USM-001's manual Typed Memory write path (`js/memory.js`'s D6 "מה המאמן יודע עליי" sheet) and the Internal Pipeline Orchestrator's own pre-existing D2-EF-07 pre-dispatch supersession check. This Work Item performs **no semantic interpretation** of any kind — it reacts only to the fact, never the content, of a qualifying authoritative write.

A SPEC Review, conducted before implementation against the real repository, found and corrected two genuine defects that would otherwise have shipped: **(1)** `saveProfile()` (`app.js`) never throws on persistence failure — it internally catches and returns `{status:'FAILED'}` — so the consent call site was corrected to gate on the returned `status==='SUCCESS'` rather than on absence-of-throw, which would have signaled arrival even on a failed write; **(2)** consent *grant* (`false→true`) was found, on direct comparison against the Product's own already-accepted Create rule, to require identical treatment — both change the exact same USM-001 read-path-visible set in the same direction — so the original revoke-only rule was corrected to fire on both consent transitions. The same review traced the complete production dispatch lifecycle (`registerCoachDecisionSystem.js` → `engineRegistry.js` → `app.js`'s `runAppReadyEngines()`) and confirmed the Composite Engine's only live trigger (`APP_READY`) is background and non-blocking, with no synchronous user-awaited consumer anywhere in the current call graph — so the Product's "never deliver silent non-response to an awaiting user" concern does not apply today, and no STOP condition was reached.

**Modified, additively only:** `js/memory.js` gains a `MemoryLayer` reference (identical dual-environment require pattern to the file's existing `PersistenceGateway` reference), a pure `esafQualifies(m)` helper reusing USM-001's exact read-path-visibility filter (`type ∈ {fact,preference}` × `source:'user_stated'` × `status:'active'`, never widened or narrowed), and an `esafSignalArrival()` helper that calls the existing, unmodified `MemoryLayer.recordExplicitUserStatementArrival({userId})` — passing only `{userId}`, never payload/type/source/status/reason. Five existing D6 write-action handlers (create, edit, "לא נכון" reject, delete, and the memory-consent checkbox) each call this signal immediately after their own already-existing write is verifiably successful, never before, never on failure. `js/coachDecisionSystem/memoryLayer.js`, `internalPipelineOrchestrator.js`, `index.html` script order, Contextual Meaning, EvidenceEvaluator, Eligibility, Trust, Relationship Maturity, G-2, RGEF, Safety, and every other USM-001 file are unmodified.

No reassembly or retry is added: a superseded background pass is silently withheld exactly as D2-EF-07 already specified (Expression is simply never invoked; the Decision Pass itself remains completed/`FORMED`), and a later, independent `APP_READY` pass naturally reassembles fresh context. Two pre-existing, unrelated limitations of the already-approved arrival mechanism were verified and explicitly left unfixed, per instruction not to add cross-tab synchronization: the in-memory arrival dictionary is per-browser-tab (a qualifying write in one tab is invisible to another tab's freshness check), and a same-tab user switch leaves a harmless, never-re-read stale dictionary key for the previous user.

**Production-backed verified** using the real, unmodified `js/coachDecisionSystem/memoryLayer.js` and `internalPipelineOrchestrator.js`: a Pipeline Context assembled at T1, followed by a qualifying arrival recorded at T2>T1 (choreographed via the real `MemoryLayer.assembleContext`/`recordExplicitUserStatementArrival` pair, no comparison logic stubbed), produces a real `expression:{status:'SUPERSEDED'}` result with `buildExpressionRenderingContext()` never invoked, the Decision Pass itself still validly `FORMED`, and Pipeline Context's `relationshipMaturity`/`lifeEventContext`/Domain/Topic/Trust shape completely unchanged. New test file `tests/esaf001.test.js` (16 tests: qualifying-filter unit tests, content-blind signal verification against the real `MemoryLayer` singleton, per-user scoping, and the production-backed acceptance vertical above); **full repository regression: 2013/2013 passing, 0 failing** (1997 pre-ESAF-001 baseline, net +16). `APP_VERSION`/service-worker `VERSION` inspected at this closure and left unchanged (`2.43.0`/`v2.43.0`) — matching G-2's own precedent: this closure makes a previously-dormant correctness mechanism reachable for the first time but ships no new user-visible Coach behavior on its own, since the Composite Engine's only live trigger remains background/autonomous with no live Opportunity source. Open/deferred, explicitly not resolved by this closure: `js/memory.js`'s D6 UI click handlers remain outside this repository's established Node-testing boundary (pre-existing, unchanged); Semantic User Understanding (classification, Domain/Topic, semantic projection); the recorded-but-not-implemented Explicit Request immediate-suppression Product rule; Conversation/Voice producers (architecturally compatible, not built); Decision Evidence, Trust, and Relationship Maturity (all untouched). Approved by Head of Product + AI Architect and closed — see `docs/specs/ESAF_001_SPEC_v1.0.md` for full details and evidence.

---

## CSSC-001 — Current State / Situational Context V1

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/CSSC_001_SPEC_v1.0.md` completed implementation across eight Work Packages — the first real, end-to-end Semantic User Understanding vertical: AUTHORITATIVE USER STATEMENT → DERIVED SEMANTIC INTERPRETATION → CURRENT STATE / SITUATIONAL CONTEXT → MEMORY LAYER / PIPELINE CONTEXT → the existing, live `FOOD_LOGGING`/`WEAKENING` Contextual Meaning consumer, as truthful non-causal background only. Statement authority never becomes interpretation authority: the classification is Tier-5/derived (D1 Unit 11, D1-ER-07), never persisted, never promoted to `user_stated`/authoritative memory.

**New:** `js/coachDecisionSystem/situationalContextInterpreter.js` — owns the entire classification act. Its output vocabulary is exactly two closed, machine-readable tokens, `CLASSIFIED_CURRENT_STATE`/`INELIGIBLE_OR_NOT_CLASSIFIED`, with no numeric confidence anywhere. It classifies the *complete* set of currently-active, consented, `user_stated` `fact`/`preference` records — a Final SPEC Correction established that Engineering transport bounds (`MAX_RECORDS_PER_BATCH`/`MAX_CHARS_PER_RECORD`/`MAX_CHARS_PER_BATCH`) must never silently truncate *which* records are considered, only how many ride in one model request; the module partitions the eligible set into deterministic (id-sorted, reproducibility-only) batches and issues every batch required. Batch responses validate strictly by `sourceMemoryId` — never by array position — with an explicit fail-closed rule for missing, duplicate, unknown, or malformed ids, and per-id prompt delimiting that structurally prevents one record's injected text from altering a sibling's outcome. Health/safety-adjacent content is instructed to abstain unconditionally; the Safety contract is an explicit closed-vocabulary eligibility boundary (only positively-classified output may ever enter `situationalContext`), honestly documented as a bounded, non-guaranteed instruction-level property, not a Safety Layer or medical classifier. Auth is obtained through the existing `callClaude` closure already used by `js/coach/coachClient.js`/`expressionRenderer.js` (`js/app.js`) — never a Firebase Auth object threaded through Decision identity.

**Modified, additively only:** `js/coachDecisionSystem/memoryLayer.js` (`assembleContext()` gains one new step — a cost-only mechanical pre-check confirming a live `HABIT`/`FOOD_LOGGING`/`WEAKENING` signal exists in the already-assembled `initiativeIntelligence.signals` before any classification is attempted, since Contextual Meaning's own closed V1 rule could never consult the result otherwise; reuses USM-001's existing `memoryLayer`/`USER_STATED_MEMORY_READ` StateAccess identity unchanged rather than widening `coachDecisionSystem`/`DECISION_PASS`'s own grant; new, bounded `situationalContext.items[]` Pipeline Context field), `js/coachDecisionSystem/contextualMeaningPolicy.js` (its one live V1 rule gains `contextConsulted.situationalContext`/`basis.situationalContextBackground` — a categorically separate, non-causal-only field, confirmed by direct inspection to be physically unreachable from `deriveValidReasonCategory()`, making "no Reason substitution" a structural guarantee rather than a convention), `js/app.js`/`index.html`/`sw.js` (composition wiring only).

**Engineering discovery during implementation, honestly corrected (not an architecture change):** earlier documentation in this program (including this SPEC's own first drafts) stated the `FOOD_LOGGING`/`WEAKENING` V1 path "resolves to Silence today." That was accurate for G-2 alone; RGEF — closed before this Work Item began, entirely independent of it — already admits this exact fixture to a live `INITIATIVE` Terminal Decision via its own Bounded Early-Relationship Engagement path. This does not weaken CSSC-001's guarantees; it is proven more directly: production-backed testing confirms the Terminal Decision's `kind`, `rationale`, and `decisionPassTrace` are byte-identical with and without Situational Context, and that `buildExpressionRenderingContext()` — an existing, unmodified, already-tested strict `relationshipMaturity.stage`-only pass-through — makes it structurally impossible for Situational Context to reach Expression's rendering payload at all, regardless of which Terminal Decision kind this fixture resolves to.

**Production-backed verified** using the real, unmodified `memoryLayer.js`, `contextualMeaningPolicy.js`, `initiativeEngine.js`, `eligibilityEvaluator.js`, and `internalPipelineOrchestrator.js`, with only `SituationalContextInterpreter`'s `callClaude` seam stubbed (no live LLM): a night-shift statement classifies and is consulted as background; an unrelated statement correctly abstains; more than one batch's worth of eligible records (14, batch size 6) are all classified with none dropped for recency or a fixed total count; editing/rejecting/deleting the source statement or revoking consent is reflected on the next assembly with nothing cached; a missing live signal produces zero classifier calls; malformed/duplicate/unknown-id batch responses fail closed per-id without corrupting sibling results; an injected instruction in one record cannot alter a neighboring record's verdict. New test files `tests/situationalContextInterpreter.test.js` (26 tests) and `tests/cssc001ProductionBackedAcceptance.test.js` (5 tests); `tests/memoryLayer.test.js` (+10) and `tests/contextualMeaningPolicy.test.js` (+4) extended; **full repository regression: 2058/2058 passing, 0 failing** (2013 pre-CSSC-001 baseline, net +45). `APP_VERSION`/service-worker `VERSION` inspected at this closure and left unchanged (`2.43.0`/`v2.43.0`): this Work Item adds no new occurrence, timing, or content to any dispatch — the live path it happens to touch already existed via RGEF, proven unaffected by Situational Context's presence.

**Not resolved by this closure:** Domain/Topic assignment of any kind; Preference, Life Event, Explicit Request, or Intervention Feedback as semantic classes; Conversation/Voice producers (the raw-statement contract is producer-neutral by construction, not built); a non-authoritative, cost-only classification cache (judged unnecessary at pilot scale); Trust (the paused `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` is unmodified and unread by this Work Item's own logic); Relationship Maturity; Goal architecture; historical supersession of the underlying statement. See `docs/specs/CSSC_001_SPEC_v1.0.md`'s full text for complete evidence.

---

## EUR-001 — Explicit User Request V1

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/EUR_001_SPEC_v1.0.md` completed implementation — the second real, end-to-end Semantic User Understanding vertical: AUTHORITATIVE USER STATEMENT → EXPLICIT-REQUEST CLASSIFICATION → CONTROL-INTENT INTERPRETATION → LITERAL-SCOPE RESOLUTION → DIRECT-USER AUTHORITY → Initiative Engine Stage 6, this foundation's first real, behavior-changing consumer. Two SPEC Review rounds established the binding discipline that carries through every layer: **EXPLICIT REQUEST ≠ SUPPRESSION REQUEST.** A statement can be unambiguously an Explicit Request ("Please remind me to log my food.") without authorizing any control at all — request classification, control-intent interpretation, and literal-scope resolution are three separate, never-collapsed semantic dimensions (D1-ER-01's own claim-type non-conflation, extended), feeding exactly one conjunctive actionable-control gate: only `requestClassification === 'CLASSIFIED_EXPLICIT_REQUEST'` ∧ `controlIntent === 'SUPPRESS_ORDINARY_INITIATIVE'` ∧ `scopeStatus === 'RESOLVED'` ∧ a valid closed Domain/Topic pair ever produces a control. Statement authority never becomes interpretation authority at any of the three derived layers (the same D1 Unit 11/D1-ER-07 discipline CSSC-001 established for Current State).

**New:** `js/coachDecisionSystem/explicitRequestInterpreter.js` — a separate, class-specific interpreter (`situationalContextInterpreter.js` is not modified, not widened, not merged with it). Reuses CSSC-001's proven architectural skeleton by pattern only: deterministic id-keyed batching over the *complete* eligible set, per-batch timeout, no retry, strict fail-closed output validation (extended here to also reject any gating-dimension inconsistency — e.g. a populated `domain` alongside a non-suppressive `controlIntent` — and any Domain/Topic pair outside its own closed table), per-id prompt-injection containment, no numeric confidence anywhere. Its own `EUR_VALID_DOMAIN_TOPIC_PAIRS` table is independently authored — informed by, but never calling into, `derivedIntelligenceConsumer.js`'s separate, unmodified B5 mapping (per `js/domain/domainTopicVocabulary.js`'s own "own, locally-owned mapping logic" precedent) — not a second universal Domain/Topic ontology. Auth reuses the existing `callClaude` closure (`js/app.js`) exactly as `situationalContextInterpreter.js` already does — an Engineering Readiness Review caught a `configure({getAuthToken})` seam proposal that matched no shipped convention anywhere in this repository, and it was corrected to the real `configure({callClaude})` pattern before implementation began.

**Modified, additively only:** `js/coachDecisionSystem/memoryLayer.js` (`assembleContext()` gains one new step — deliberately with *no* pre-check gate, unlike `situationalContext`'s `WEAKENING`-signal gate, since Explicit Request's real consumer, Initiative Engine Stage 6, is broader than Contextual Meaning's one V1 rule and gating this step could silently skip a suppression the user is entitled to; reuses USM-001's existing `memoryLayer`/`USER_STATED_MEMORY_READ` StateAccess identity unchanged; new `explicitRequestControls.items[]` Pipeline Context field containing *only* already-actionable controls — a recognized-but-non-actionable request, whatever its reason, never enters Pipeline Context in any form), `js/coachDecisionSystem/initiativeEngine.js` (`generate()` gains one new, additive, independent OR-branch — `explicitlyRequestedAgainst()` — inserted beside the existing RGEF WP7 `domainTopicRecentlyUnwelcome()` check, at the identical insertion pattern RGEF itself used; carries direct-user authority requiring no repeated-dismissal threshold, no Trust, no Relationship Maturity — structurally distinct from RGEF's own inferred-reluctance mechanism, which remains completely untouched, with no new dependency on `feedbackDomain.js`), `js/app.js`/`index.html`/`sw.js` (composition wiring only).

**Two SPEC corrections resolved real defects before implementation began.** The first: the initial draft's two-dimension contract (classification + scope) implicitly defined the semantic class around suppression — corrected by adding Control Intent as a fully independent third dimension, with the closed vocabulary limited to exactly one V1-actionable token, `SUPPRESS_ORDINARY_INITIATIVE`, alongside `NO_V1_ACTIONABLE_INTENT` for every positive/supportive/ambiguous-direction request; the production-backed fixture wording itself was also corrected, from "Don't remind me to log my food." (a narrower, reminder-specific reading that might not honestly authorize the full Domain/Topic-level Stage-6 control) to "Don't suggest food logging anymore." The second: the proposed `getAuthToken` auth seam, caught by Engineering Readiness Review before any code was written against it.

**Production-backed verified** using the real, unmodified `memoryLayer.js`, `contextualMeaningPolicy.js`, `initiativeEngine.js`, `eligibilityEvaluator.js`, and `internalPipelineOrchestrator.js`, with only `ExplicitRequestInterpreter`'s `callClaude` seam stubbed (no live LLM, no live Firestore, no Chat): using the identical real `HABIT`/`FOOD_LOGGING`/`WEAKENING` fixture G-2/RGEF/CSSC-001 already proved end to end, the same upstream state produces `INITIATIVE` without an Explicit Request present and `SILENCE` with an active, resolved `NUTRITION`/`FOOD_LOGGING` suppression control — the Opportunity, Contextual Meaning, Evidence Tier, Eligibility, RGEF feedback history, Trust, and Relationship Maturity proven byte-identical across both runs, the first divergence occurring exactly at Stage 6 Candidate formation, never earlier. A positive request ("Please remind me...") and a supportive request ("Help me stay consistent...") both correctly produce zero controls against the same real fixture; a suppressive-but-unresolved-scope request ("Don't suggest running.") likewise produces zero controls, never a fake `WORKOUT`/`WORKOUT_FREQUENCY` mapping; suppression persists at a Decision Pass 40 days in the future (well beyond RGEF's own 14-day/7-day windows), proving elapsed time alone never revokes an active request; deleting the source record restores the exact baseline `INITIATIVE` Terminal Decision on the very next Decision Pass. New test files `tests/explicitRequestInterpreter.test.js` (44 tests) and `tests/eur001ProductionBackedAcceptance.test.js` (9 tests); `tests/memoryLayer.test.js` (+16) and `tests/initiativeEngine.test.js` (+13) extended; **full repository regression: 2140/2140 passing, 0 failing** (2058 pre-EUR-001 baseline, net +82). `APP_VERSION`/service-worker `VERSION` advanced from `2.43.0`/`v2.43.0` to `2.44.0`/`v2.44.0`: unlike CSSC-001 (proven to change no Terminal Decision), this Work Item genuinely and deterministically changes an existing live Terminal Decision's outcome the moment a user explicitly requests it — new, real, user-visible Coach behavior.

**Not resolved by this closure:** any activity-level (Running, Swimming, etc.) or time-of-day vocabulary (no `RUNNING`/`MORNING_WORKOUT` or equivalent value exists anywhere — V1 is Domain/Topic-scoped only, per explicit Product direction); any control intent other than `SUPPRESS_ORDINARY_INITIATIVE` (`FORCE_INITIATIVE`/`PREFER_INITIATIVE`/`REMIND_MORE`/`CHANGE_FREQUENCY`/`CREATE_GOAL`/`CHANGE_PLAN` remain undefined, future work); a historical request/reversal ledger (a later, separate positive statement never silently revokes an older still-active negative one — a documented V1 limitation, not a defect, verified by its own production-backed test); Recommendation Engine, Eligibility, Contextual Meaning, and Safety as consumers (none reached by this Work Item — Safety is structurally unreachable from the Stage-6 boundary this Work Item uses); Conversation/Voice producers (the raw-statement contract is producer-neutral by construction, not built); Trust (paused, unmodified, unread by this Work Item's own logic) and Relationship Maturity (untouched). See `docs/specs/EUR_001_SPEC_v1.0.md`'s full text for complete evidence.

---

## LCSC-001 — Legacy Coach Safety Containment

**Status:** ✅ DONE (Implementation complete, approved, closed)

`docs/specs/LCSC_001_SPEC_v1.0.md` completed implementation — a narrow, interim containment Work
Item, explicitly **not** Safety Foundation design, not a Health/Safety Profile, not an Action Model,
not a new Safety Layer, and not a reopening of `docs/specs/SL-001_SPEC_v1.0.md`, which remains
closed and untouched throughout. A dedicated investigation this session found that SL-001's own
Safety Rule matcher correctly yields zero matches at this repository baseline (no Health/Safety
Profile data source exists), meaning no Candidate reaching the canonical Decision System is
currently Safety-reviewed in any meaningful way — and, independently, that the legacy,
pre-Decision-System Coach message pipeline has **zero** Safety guardrail of any kind and, in one
concrete, real, data-driven case (the Adaptive-TDEE red-flag trigger), already directs a live
generative model call to communicate a specific nutrition-behavior instruction. Head of Product +
AI Architect directed this exposure be contained before broader Safety Foundation design proceeds.

**Change A — Adaptive-TDEE red-flag deterministic containment.** `js/trigger/triggerDomain.js`'s
`evalRedFlag()` now returns `live: false` (was `true`); `triggerLocalText()` gains a new,
deterministic `'redflag'` case — none existed before, confirmed by direct inspection (the prior
fallback silently returned `''` for this type). `js/trigger/triggerController.js`'s
`triggerLiveText()` gains an unconditional early return for `type: 'redflag'`, independent of the
`live` flag, so the legacy generative Coach path (`coachMessageFn`) is unreachable for this trigger
from either entry point — proven by a dedicated test asserting a call count of exactly zero. Per
Head of Product direction, the deterministic replacement message prescribes no calorie, nutrition,
or workout adjustment of any kind — it states only that the observed pace and the accompanying
measurement change together warrant a pause and review.

**Change B — legacy Coach prompt Safety boundary.** `js/coach/coachPromptComposer.js`'s
`buildBasePrompt()` — confirmed the single function every remaining legacy generative caller's
system prompt passes through (Home coach card, Settings test message, Adaptive-TDEE weekly summary,
every non-redflag Trigger live-text case) — gains one new, unconditional, eight-concept bounded
Safety-scope instruction: no diagnosis; no unsupported medical inference from described symptoms; no
medical treatment instructions; no invented recovery timeline; respecting an explicit user-reported
active medical instruction within its literal scope; conservative behavior under materially
uncertain Safety-relevant context; no unsupported workout prescription from Safety-sensitive
context; no unsupported nutrition/recovery prescription from Safety-sensitive context.
**Defense-in-depth prompt containment only** — never Safety classification, medical reasoning
authority, deterministic validation, or a Stage-8/Stage-9 replacement; no downstream code reads or
enforces it. USM-001's `userStated` fragment, the legacy `coachMemoryFragment()`, and B5's derived
fragment remain fully intact and unaffected — the Coach continues to know the user's own
authoritative stated information.

**Change C — protein-attention template generalization.** Two independent existing deterministic
surfaces (`coachPromptComposer.js:coachLine()`'s `protein` case; `triggerDomain.js:proteinFoodHint()`,
also consumed by `triggerLocalText()`'s `'low-protein'` case) previously named a specific food (egg,
chicken, or cottage cheese) with no authoritative dietary/allergy/restriction context anywhere in
this repository to justify the choice. Both now preserve protein-gap awareness and encouragement
while naming no food; `proteinFoodHint()`'s own export key and its `js/app.js:1756` facade are
unchanged, satisfying an unrelated, pre-existing wiring-test assertion — only its internal behavior
changed.

**Legacy Coach path status, established by this closure (Product direction, not a committed
timeline):** the legacy, pre-Decision-System, LLM-generative Coach message pipeline is now
explicitly **transitional architecture** — it may continue operating, receives containment and
maintenance only, gains no new Product capability, and its responsibility is not expanded. The
long-term direction is that the canonical Coach Decision System becomes the authority for coaching
decisions, with this legacy path expected to be retired as canonical replacements become available.
This closure does **not** establish canonical Safety architecture, a Stage-8/Stage-9 substitute, or
evidence that further legacy-path Safety work is unnecessary — SL-001's own Health/Safety Profile
gap remains exactly as open as SL-001's own closure left it.

New test coverage extending `tests/triggerController.test.js`, `tests/triggerDomain.test.js`, and
`tests/coachPromptComposer.test.js` (targeted zero-call proofs, deterministic-text assertions,
prompt-contract assertions, food-name-absence assertions); no new test file; **full repository
regression: 2146/2146 passing, 0 failing** (2142 pre-LCSC-001 baseline, net +4). `APP_VERSION`/
service-worker `VERSION` advanced from `2.44.0`/`v2.44.0` to `2.45.0`/`v2.45.0`: existing,
already-live user-facing message content genuinely changed. See `docs/specs/LCSC_001_SPEC_v1.0.md`'s
full text for complete evidence.

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
D1 — Coach Intelligence Translation Model is approved and Canonical (decision-policy specification only, no production code changes).
D2 — Coach Decision Pipeline Specification is approved and Canonical (orchestration specification only, no production code changes).
D3 — Coach Decision System Architecture is approved and Canonical (architecture specification only, no production code changes).
TASK-006 — Decision Engine is approved, implemented (fourth of six D3 §17 collaborators) and closed.
SL-001 — Safety Layer is approved, implemented (fifth of six D3 §17 collaborators) and closed, per the FITME Safety Layer Canonical Decision Package v2.0 (v2.6, Closed — all fifteen Required Canonical Decisions, RCD-01 through RCD-15, resolved).
TASK-007 — UX System is approved, implemented (WP1–WP10, cross-cutting Experience/Interaction/Presentation-Behavior contracts over the existing UI Presenters/Controllers) and closed.
TASK-008 — Design System is approved, implemented (WP1–WP14, WP4 retired N/A; token/component layer, Component Catalog consolidation, semantic communication surfaces, WCAG 2.1 AA contrast fixture across all UI surfaces) and closed.
Expression — D3 §17's Sixth and Final Coach Decision System Collaborator is approved, implemented (WP1–WP15) and closed, per `docs/specs/EXPRESSION_SPEC_v1.0.md`. D3 §17's Composite Engine is now fully realized: all six internal collaborators (Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, Expression) are built.
G-2 — Live Stage 3/4 Opportunity Recognition is approved, implemented and closed, per `docs/specs/G2_SPEC_v1.0.md` — the one approved V1 path (Habit-derived `FOOD_LOGGING`/`log-consistency` `WEAKENING`) reaches Stage 5 for real, resolving `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` (Silence) at that closure, since no affirmative Trust source was yet approved.
RGEF — Relationship-Guided Engagement Foundation is approved, implemented (WP1–WP8) and closed, per `docs/specs/RGEF_SPEC_v1.0.md` (v2.42.0) — a closed, narrow Stage-5/Stage-6 admission path now legitimately carries that same real Opportunity through to a live `INITIATIVE` Terminal Decision, real Expression, and real presentation, the first time the G-2 Opportunity has actually reached the user.
ESAF-001 — Explicit User Statement Arrival Freshness is approved, implemented (WP1–WP5) and closed, per `docs/specs/ESAF_001_SPEC_v1.0.md` — USM-001's manual Typed Memory write path now signals the Internal Pipeline Orchestrator's own pre-existing D2-EF-07 pre-dispatch supersession check for the first time, proving new authoritative user information can invalidate a Decision assembled before it arrived, with no semantic interpretation and no `APP_VERSION` change.
CSSC-001 — Current State / Situational Context V1 is approved, implemented (WP1–WP8) and closed, per `docs/specs/CSSC_001_SPEC_v1.0.md` — the first real, end-to-end Semantic User Understanding vertical, reaching the existing, live `FOOD_LOGGING`/`WEAKENING` Contextual Meaning consumer as non-causal background only, with no Domain/Topic invention, no causal inference, and no `APP_VERSION` change.
EUR-001 — Explicit User Request V1 is approved, implemented and closed, per `docs/specs/EUR_001_SPEC_v1.0.md` — the second real, end-to-end Semantic User Understanding vertical, and this foundation's first real, behavior-changing consumer: a resolved, actionable `NUTRITION`/`FOOD_LOGGING` suppression request now deterministically withholds Initiative Engine Stage 6's matching Candidate, proven end to end against the same real Habit/RGEF fixture, with `APP_VERSION`/`VERSION` advanced to `2.44.0`/`v2.44.0`.
LCSC-001 — Legacy Coach Safety Containment is approved, implemented and closed, per `docs/specs/LCSC_001_SPEC_v1.0.md` — a narrow, interim containment Work Item (not Safety Foundation design, not a reopening of SL-001) closing two confirmed-live current exposure paths in the legacy, pre-Decision-System Coach message pipeline and generalizing an adjacent deterministic food-naming surface; the legacy Coach path is now explicitly recorded as transitional architecture; `APP_VERSION`/`VERSION` advanced to `2.45.0`/`v2.45.0`.

Current Work Item: None. Phase C (C1–C4), the D-series (D1–D3), TASK-004 (Recommendation Engine), TASK-005 (Initiative Engine), TASK-006 (Decision Engine), SL-001 (Safety Layer), TASK-007 (UX System), TASK-008 (Design System), Expression (D3 §17's sixth and final Coach Decision System collaborator), G-2 (Live Stage 3/4 Opportunity Recognition), RGEF (Relationship-Guided Engagement Foundation), ESAF-001 (Explicit User Statement Arrival Freshness), CSSC-001 (Current State / Situational Context V1), EUR-001 (Explicit User Request V1), and LCSC-001 (Legacy Coach Safety Containment) are complete and closed. (Note: this list pre-existingly omits USM-001 — Authoritative User Understanding Foundation, First Vertical, which has its own full section above; that omission predates this closure and is left uncorrected here, as it is unrelated to this Work Item's own scope.)
Next Work Item: Not yet designated. The next Product/Architecture activity after LCSC-001's closure will be determined separately through Canonical Work Item Selection — this Roadmap does not name or assume a successor task.
