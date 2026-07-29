# TASK_004_SPEC_v1.0

## Recommendation Engine

### Canonical Skeleton (Consolidated Draft)

> This document consolidates all skeleton sections produced in the
> conversation.

------------------------------------------------------------------------

# Status

-   Status: DONE
-   Authority: Head of Product + AI Architect
-   Engineering Authority: Lead Engineer (Claude Code)
-   Implementation Status: COMPLETE
-   Repository: FITME

## Purpose

States the current lifecycle position of this task and who holds authority over each kind of decision.

## Canonical Sources

-   Engineering Workflow (`docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md`) §4/§14 — lifecycle is **Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed**. This document's Status field maps onto that sequence: "DRAFT" = pre-Engineering-Review, "READY" = Engineering Review passed, "DONE" = Task Closed.
-   Roadmap (`docs/roadmap/Roadmap.md`) — TASK-004 entry.

## Canonical Conflict — Roadmap Status

Conflicting sources:
-   `docs/roadmap/Roadmap.md`'s top-level TASK-004 entry: *"Status: ⏸️ PAUSED — Implementation must not begin until Phase A of the Architecture Remediation Plan is complete and the required Phase B architecture decisions are approved."*
-   `docs/roadmap/Roadmap.md`'s own B5 closure note: *"Remediation Finding F9 is closed; Recommendation Engine is formally unblocked (subject to its own separate specification and approval)."*

Decision required: which status line is authoritative, and whether Roadmap.md's TASK-004 status line should be updated.

Decision owner: Head of Product + AI Architect.

## Ownership

-   Product/Architecture authority: scope, philosophy, and architecture decisions.
-   Engineering authority: filling implementation detail inside the boundaries this document sets.

## Constraints

-   The Status block must be updated whenever lifecycle state changes; it must not be left stale.
-   "Implementation Status" must reflect the repository's actual state. `js/coachDecisionSystem/` now exists and is wired into `js/app.js`/`index.html`/`sw.js` (see Closure Record), so "COMPLETE" is accurate.

## Forbidden Changes

-   Do not change "Authority" or "Engineering Authority" values.
-   Do not mark Status as READY or DONE unilaterally — see [READY Definition](#ready-definition) and [DONE Definition](#done-definition). Populating this specification does not itself constitute Engineering Review approval or a READY determination; both remain Product/Architecture acts.

## Definition of Complete

-   Status block present, accurate, and consistent with the READY/DONE Definition sections, with the Roadmap Canonical Conflict above recorded rather than resolved.

## Claude Fill Instructions

Update only "Implementation Status" and "Status," and only when a corresponding READY/DONE gate has been satisfied and evidenced. Do not edit "Authority" fields.

------------------------------------------------------------------------

# Canonical Authority

This document defines the canonical engineering structure for TASK-004.

Engineering is responsible for filling implementation details only.

Engineering MUST NOT: - redesign product behavior - redefine
architecture - modify runtime ownership - change authority boundaries -
introduce new engines - redefine previously approved contracts

If repository evidence conflicts with this document, engineering must
stop and report the conflict.

## Purpose

Establishes the boundary between what Engineering may author (implementation detail, tests, repository evidence, traceability) and what only Product/Architecture may author (behavior, philosophy, ownership, contracts). Every other section's authority language inherits from this boundary rather than restating it.

## Canonical Sources

-   AI Constitution (`docs/constitution/FITME_AI_Constitution_v1.0.md`)
-   Engineering Workflow (`docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md`) §3 — Source-of-Truth hierarchy: AI Constitution > Product Bible > Coach Bible > Architecture > Engineering Workflow > Task SPEC > Roadmap > Changelog. The Coach Knowledge Base is not on this hierarchy — Engineering Workflow §3 calls it "a living research document, not a source of truth."
-   Architecture (`docs/architecture/FITME_ARCHITECTURE_v1.md`)
-   D1_SPEC_v1.0.md, Unit 02 — restates this same document-authority hierarchy, plus the separate 10-tier Canonical Decision Hierarchy used at decision time (Safety → Medical responsibility → Trust → Long-term adherence → Context relevance → Goal alignment → User autonomy → Behavioral effort → Nutritional/training optimization → Product engagement).

## Responsibilities

-   Engineering: fill the skeleton, gather repository evidence, write tests, report gaps and conflicts.
-   Product/Architecture: approve or reject any change to behavior, ownership, contracts, or scope; own CC-02, CC-03, Recommendation Categories, Ranking Policy, and Explainability Policy.

## Failure Modes

-   If repository evidence contradicts this document, stop work on the affected section, record the conflict under that section's Repository Gaps, and escalate rather than resolving it by inference. Canonical Conflicts in this specification are recorded under Status, Purpose, and Recommendation Evaluation Pipeline.

## Forbidden Changes

-   The six prohibitions above are the single interpretive key for every other "Forbidden Changes" subsection in this document; they are restated by reference elsewhere, not re-litigated.

## Definition of Complete

-   No section contains a decision that falls into one of the six prohibited categories without an explicit citation to an approved Product/Architecture source.

## Claude Fill Instructions

Before filling any section, re-read this boundary. If a section's instructions seem to require a Product or Architecture decision, record it as an open question for Product/Architecture rather than deciding it.

------------------------------------------------------------------------

# Purpose

TASK-004 introduces the Recommendation Engine.

The Recommendation Engine becomes the canonical decision layer
responsible for selecting recommendations while operating on top of the
runtime defined by D2 and D3.

## Canonical Sources

-   Architecture (`docs/architecture/FITME_ARCHITECTURE_v1.md`) §20 — layered runtime this engine sits inside (Composition Root → UI Presenters → App Services → Pure Domain Services → Engine Registry/Engines → Repository/Platform Adapters).
-   D2_SPEC_v1.0.md, Unit 07 — assigns the Recommendation Engine orchestration responsibility for **Stage 6 (Candidate Generation, Recommendation-kind candidates)** of the canonical 13-stage Decision Pass, and a contributing role in **Stage 3 (Opportunity Detection)**.
-   D3_SPEC.md §17, Decision 1 — architecturally, the Recommendation Engine is one of six **internal collaborators** (Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, Expression) inside a single Composite Engine registered once in the existing B2 Engine Registry — it is not an independently registered engine.
-   Product Bible §6 "Decision Engine" — the product-level pipeline diagram: **"Context → Memory → Patterns → Goals → Recommendation → Learning."**
-   AI Constitution Ch.11 "Recommendation Intelligence" §11.1 — *"A recommendation is not a notification. It is not a tip. It is not advice. It is an intentional attempt to improve the user's next decision."*
-   Intelligence & Relationship Philosophy Ch.4 "Recommendation Philosophy."

## Existing Repository Behaviour

No Recommendation Engine module exists in `js/`. The repository's four registered engines (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`, wired via `js/engines/registerEngines.js` into `js/engineRegistry.js`) produce derived-intelligence signals (habits, patterns, adaptive TDEE proposals, trigger events) that a Recommendation Engine would plausibly consume, but none of them rank, prioritize, or select recommendations — Architecture §9/§10 scopes Habit and Pattern Engines as "observation layers only... explicitly no recommendations, coaching, initiatives, decisions, or UI."

B5 (`js/derivedIntelligenceConsumer.js`, `js/derivedIntelligencePrompt.js`) defines a closed consumer-policy catalog that includes `RECOMMENDATION_SUPPORT_V1` alongside the currently-used `COACH_PROMPT_V1` — a consumption contract anticipating this engine, tested (262/262 tests at B5 closure), with no current consumer invoking it under that policy name.

## Canonical Conflict — Repository Hooks

Conflicting sources:
-   D1_SPEC_v1.0.md (CDR-5, and its own Scope section): *"Engineering hooks for the Recommendation, Initiative, and Decision Engines already exist in the codebase but remain disabled pending the policy this specification provides."*
-   Repository inventory of `js/`: no file, registry entry, or disabled hook named for a Recommendation/Initiative/Decision Engine, beyond the B5 `RECOMMENDATION_SUPPORT_V1` consumer policy above.

Decision required: reconciliation of D1's stated claim with the repository's current module inventory.

Decision owner: AI Architect.

## Repository Evidence Required

`js/engineRegistry.js`, `js/engines/registerEngines.js`, `js/derivedIntelligenceConsumer.js`, `js/derivedIntelligencePrompt.js`.

## Responsibilities

This engine is responsible for one decision: **generating and selecting candidate recommendations (D2 Stage 6, "Recommendation-kind Candidates")** from context, memory, and derived-intelligence signals, for downstream ranking/decision-formation by the Decision Engine (D2 Stages 7–9, out of this task's scope — see Relationship to Previous Work). It is not responsible for final winner selection, decision formation, safety evaluation, or expression/delivery — those are D2/D3-assigned responsibilities of the Decision Engine, Safety Layer, and Expression collaborators respectively.

## Traceability

Downstream consumer: the Decision Engine (D2 Stages 7–9) and, ultimately, Expression (realized, per D3 §6.2, by `js/coach/coachPresenter.js` and `js/trigger/triggerController.js`). Upstream dependencies: the D2/D3 runtime (Composite Engine, Internal Pipeline Orchestrator), existing signal producers (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine` via B5's `DerivedIntelligenceConsumer`), and the Memory Layer (Stage 2 Context Assembly, per D2/D3).

## Repository Gaps

None remaining — at spec-authoring time no prior implementation of this engine existed in the repository (the baseline state, not a defect, consistent with "Implementation Status: NOT STARTED"); the engine is now implemented (`js/coachDecisionSystem/`, see Closure Record).

## Engineering Notes

Keep this section a single, stable statement of intent. Downstream sections (Scope, Functional Scope, Pipeline) are where that intent is decomposed — do not pre-decompose it here.

## Forbidden Changes

Do not expand this section into a design document; it states purpose only.

## Definition of Complete

Traceable to Architecture, D2 (Stage 6/3 assignment), and D3 (Composite Engine collaborator status), consistent with the Product Bible's and AI Constitution's framing of what a recommendation is.

## Claude Fill Instructions

Do not alter the existing purpose statement. If repository evidence suggests the stated purpose is already partially satisfied elsewhere, record that as an open overlap question for Product/Architecture rather than resolving it.

------------------------------------------------------------------------

# Scope

Claude must define: - responsibilities - execution flow - engine
ownership - ranking - prioritization - explanation generation -
lifecycle - integration contracts - persistence interaction - memory
interaction - suppression interaction

## Purpose

Bounds what this specification covers so that engineering and review effort are spent on the same items, in the same order, without silent scope creep in either direction.

## Canonical Sources

-   D2_SPEC_v1.0.md Unit 07 — execution flow and engine-ownership boundaries (Recommendation Engine = Stage 6 + Stage 3 contribution only).
-   D3_SPEC.md §17 — engine ownership (Composite Engine collaborator, not independent registration).
-   C2_SPEC_v1.1.md — feedback/suppression interaction (single module, `js/feedback/feedbackDomain.js`).
-   C4_SPEC_v1.0.md — memory interaction (write-only server path, `functions/typedMemoryServerWrite.js`; client read via `js/memory.js`).
-   B4_SPEC.md — persistence interaction (`js/persistenceGateway.js`).

## Existing Repository Behaviour

-   **Persistence**: `js/persistenceGateway.js` (v1.0.0), closed operation catalog, `persist(request)` never throws.
-   **Memory**: `js/memory.js` (client read/write, `CLIENT_WRITABLE_SOURCES=['user_stated','migrated']`) and `functions/typedMemoryServerWrite.js` (server write-only, no read contract).
-   **Feedback/Suppression**: `js/feedback/feedbackDomain.js` — one module, both `classifyFeedback()` and `evaluateSuppression()`.
-   **Engine ownership**: per D3, this engine is not independently registered in `js/engineRegistry.js` the way `habitEngine`/`patternEngine`/`adaptiveTdeeEngine`/`triggerEngine` currently are — it is an internal collaborator of one Composite Engine.
-   **Ranking / prioritization**: per Ranking Policy (Canonical Decision, Stage 5), this engine builds no ranking/prioritization capability of any kind — the Decision Engine exclusively owns prioritization, winner selection, tie-breaking, recommendation budget, and decision formation.
-   **Explanation generation / lifecycle**: no repository precedent exists for these as engine capabilities; they are new, to be built per D2's Stage Contracts (Stages 6–10).

## Repository Evidence Required

Persistence/memory/feedback/suppression/engine-ownership are each cited above. Explanation-generation/lifecycle are new-capability items with no existing module. Ranking/prioritization is resolved (Stage 5) as a capability this engine does not build, rather than a new capability to construct.

## Responsibilities

Each item is expanded elsewhere in this document (Functional Scope, Ranking Framework, Recommendation Evaluation Pipeline, Integration Map); this section only enumerates, it does not define.

## Constraints

The listed items are the complete scope; adding an item here requires Product/Architecture sign-off, not engineering judgment. Per D2 Unit 07, "ranking"/"prioritization" as full Decision-Engine-level concepts (D2 Stages 7–8, "Prioritization"/"Winner Selection") are not owned by the Recommendation Engine. Per Ranking Policy (Canonical Decision, Stage 5), this engine performs no internal candidate-ordering of any kind — it produces unordered, well-formed candidates only, per Ranking Framework and Recommendation Evaluation Pipeline below.

## Repository Gaps

None beyond what is recorded under Existing Repository Behaviour above.

## Traceability

Every item in this list maps to exactly one section later in the document (see Traceability Matrix) — no item should map to zero or more than one primary owning section.

## Forbidden Changes

Do not add or remove items from this list without Product/Architecture approval.

## Definition of Complete

All items are traceable to exactly one downstream section that defines them in full. Ranking Policy and Explainability Policy are resolved per Canonical Decisions (Stages 5–6, Head of Product + AI Architect) in their owning sections.

## Claude Fill Instructions

Do not expand the list itself. Use it as a checklist when filling downstream sections and confirm nothing here is left undefined by the time the document reaches READY.

# Out of Scope

## Product

-   No new coaching philosophy
-   No AI personality redesign
-   No nutrition redesign
-   No workout redesign
-   No UX redesign
-   No notification redesign
-   No memory redesign
-   No authority redesign

## Architecture

-   No runtime redesign
-   No orchestration redesign
-   No engine registry redesign
-   No persistence redesign
-   No event model redesign
-   No feedback redesign
-   No suppression redesign

These prohibitions bar Engineering from inventing new architecture. Per Canonical Decisions CD-03/CD-04 (Head of Product + AI Architect, 2026-07-29), they do not bar TASK-004 from implementing the Composite Engine architecture already approved by D3_SPEC.md §17: the Canonical Architecture (D3 §17's six-collaborator Composite Engine, already approved) is distinct from the Engineering Implementation TASK-004 performs (building that already-approved architecture and making the Recommendation Engine its first operational collaborator). No new architectural layer beyond what D3 §17 already specifies is introduced.

## Engineering

-   No speculative optimization
-   No browser-only assumptions
-   No native-only assumptions

## Purpose

Draws the negative space around this task: everything here is explicitly untouched, so silence elsewhere in the document must never be read as implicit permission to change it.

## Canonical Sources

-   Product Bible — coaching philosophy, nutrition, workout, UX, and notification boundaries.
-   AI Constitution Ch.1–10, Ch.23 — AI personality and safety boundaries.
-   D3_SPEC.md Invariant AI-01 (Single Registry) — no second engine registry/orchestration authority.
-   C2_SPEC_v1.1.md, C3_SPEC_v1.0.md — feedback/suppression and event-model boundaries.

## Existing Repository Behaviour

Runtime/orchestration/engine-registration are implemented by `js/app.js` (composition root) and `js/engineRegistry.js` (v2.0.0). Per CD-03/CD-04, this task adds one new Composite Engine registration through `js/engineRegistry.js`'s existing `register()` contract — it does not restructure that contract, add a second registry, or introduce a second orchestration authority (Invariant AI-01 preserved).

## Responsibilities

Any engineering activity that would change `js/engineRegistry.js`, `js/persistenceGateway.js`, `js/memory.js`, or `js/feedback/feedbackDomain.js`'s existing public contracts, rather than merely calling into them, is out of scope and must be flagged, not implemented.

## Constraints

-   "No speculative optimization" bars adding caching, batching, or async strategies not required by a stated Performance Requirement. Architecture §14 separately notes that engines currently each independently call `getHistoryData()` with no shared cache; this task must not "fix" that pre-existing condition as a side effect.
-   "No browser-only / native-only assumptions" requires every new code path to be platform-neutral unless Architecture already partitions by platform.

## Failure Modes

If implementation cannot proceed without touching an out-of-scope item, treat this as a blocking conflict per Canonical Authority and escalate.

## Repository Gaps

None; no pre-existing repository behavior crosses these boundaries.

## Traceability

Mirrors "Global Forbidden Changes" later in this document; the two lists must stay consistent.

## Forbidden Changes

This entire section is itself a Forbidden Changes list. Do not weaken, narrow, or reinterpret any bullet.

## Definition of Complete

Every bullet here has a corresponding "Forbidden Changes" callout in the relevant functional section.

## Claude Fill Instructions

Treat this list as immutable. If a later section's implementation appears to require crossing one of these lines, do not adjust the boundary — report the conflict.

------------------------------------------------------------------------

# Repository Baseline

Claude must document: - Repository version - Current app version -
Module inventory - Runtime - Test count - Build status - Composition
root - Recommendation entry points - Coach entry points - Runtime flow

Repository evidence required.

## Purpose

A factual, dated snapshot of the repository, so every later section's "Existing Repository Behaviour" can cite back to one authoritative baseline instead of restating ad hoc observations.

## Canonical Sources

-   Changelog (`docs/roadmap/Changelog.md`) — current app version.
-   Architecture — composition root and runtime flow definitions.

## Existing Repository Behaviour

-   **App version**: `APP_VERSION = '2.41.0'` (`js/app.js:2`), set at C2 closure. C3/C4/D1/D2/D3 are documentation/decision-only or server-only tasks and did not bump `APP_VERSION`.
-   **Repository version**: no root `package.json` exists; the only `package.json` is `functions/package.json` (Firebase Cloud Functions manifest, no `version` field, no `test` script).
-   **Module inventory** (`js/` tree): `js/app.js` (composition root); `js/app/` (`authSessionController.js`, `bootstrapController.js`, `runtimeState.js`); `js/adapters/` (auth, barcode, Claude proxy, image, notification, OpenFoodFacts); `js/adaptive/` (`adaptiveTdeeController.js`, `adaptiveTdeeDomain.js`); `js/coach/` (`coachClient.js`, `coachPresenter.js`, `coachProfile.js`, `coachPromptComposer.js`); `js/core/` (date/json/number/string utils); `js/domain/` (`nutritionModel.js`, `profileMetrics.js`); `js/engineRegistry.js`; `js/engines/` (`adaptiveTdeeEngineAdapter.js`, `habitEngine.js`, `patternEngine.js`, `registerEngines.js`, `triggerEngineAdapter.js`); `js/feedback/feedbackDomain.js`; `js/memory.js`; `js/authorityContract.js`; `js/derivedIntelligenceConsumer.js`, `js/derivedIntelligencePrompt.js`; `js/nutrition/`; `js/persistenceGateway.js`; `js/repositories/`; `js/sessionLifecycle.js`; `js/stateAccess.js`; `js/trigger/` (`triggerController.js`, `triggerDomain.js`); `js/ui/`. Server-side: `functions/typedMemoryServerWrite.js`.
-   **Runtime**: sequential, dependency-ordered engine execution via `js/engineRegistry.js` (v2.0.0; `register`/`getAll`/`buildPlan`/`run`), invoked non-blocking from the UI lifecycle (`runAppReadyEngines()` in `js/app.js`, triggered from `showApp()`), not at module load.
-   **Composition root**: `js/app.js`. `js/app/bootstrapController.js` is a narrow parallel-fetch helper, not the composition root. `js/app.js` configures adapters and repositories, configures `RuntimeState`, starts `AuthSessionController`, configures coach/nutrition/adaptive/trigger modules, configures `PersistenceGateway`/`StateAccess`/`DerivedIntelligenceConsumer`, and calls `RegisterEngines.registerAll()` as its last line.
-   **Recommendation entry points**: none exist, aside from the B5 `RECOMMENDATION_SUPPORT_V1` consumer-policy definition (see Purpose for the related Canonical Conflict).
-   **Coach entry points**: `js/coach/coachClient.js` (`sendMessage`), `js/coach/coachPresenter.js` (DOM rendering), `js/coach/coachProfile.js` (pure style/name getters), `js/coach/coachPromptComposer.js` (`buildSystemPrompt(userProfile, todayData, currentUser)`, which folds in a B5 Derived Intelligence fragment, best-effort/non-blocking).
-   **Runtime flow**: `js/app.js` load → adapter/repository configuration → `AuthSessionController.start()` → on auth success, `showApp()` → `runAppReadyEngines()` → `EngineRegistry.run({trigger:'APP_READY', actions:{...}, context})` → sequential engine execution (`habitEngine` → `patternEngine` → `adaptiveTdeeEngine` → `triggerEngine`, all `dependsOn: []`) → each engine persists its derived output via `js/persistenceGateway.js` → Coach prompt composition (`coachPromptComposer.js`) reads current profile/day state plus B5 derived intelligence, independent of engine-run completion.
-   **Test count**: 72 files under `tests/` (flat directory). No npm `test` script exists; tests run via `node --test tests/<file>.test.js`.
-   **Build status**: no CI/build pipeline configuration exists in the repository. Static PWA (`index.html` + `js/*`) plus a Firebase Cloud Functions deployment (`functions/`).

## Repository Evidence Required

See Purpose for the related Canonical Conflict on repository hooks.

## Runtime Interaction

Documented above under "Runtime flow." This is the chain Runtime Placement describes this engine's insertion point relative to.

## Constraints

This baseline reflects repository state as of Changelog's most recent entry (2026-07-27, app version 2.41.0). If significant time passes before implementation, retake it rather than relying on this one, and preserve this snapshot in the Closure Record's history.

## Repository Gaps

No automated build-status signal exists; the closest available signal is the per-task test-pass count recorded in Changelog.md (most recent: 1082/1082 at C4 closure).

## Traceability

Feeds Runtime Placement, Runtime Ownership, and Integration Map directly; those sections reference this baseline rather than re-deriving the module inventory.

## Forbidden Changes

Do not infer a module's responsibility from its name alone; verify by reading the file or its test.

## Definition of Complete

Repository version, module inventory, test count, composition root, and both entry-point categories are each cited with a verified reference; build status is recorded as a Repository Gap.

## Claude Fill Instructions

Populate this section only with facts verifiable in the repository at fill-time. Do not describe intended or future module structure here.

------------------------------------------------------------------------

# Canonical Sources

## Governance

-   Product Bible
-   AI Constitution
-   Architecture
-   Engineering Workflow
-   Roadmap
-   Changelog
-   Intelligence & Relationship Philosophy
-   Coach Bible
-   Coach Knowledge Base

## Specifications

-   B1--B5
-   C1--C4
-   D1--D3

## Purpose

The single authoritative index of every governing document and prior specification this task must remain consistent with. Every other section's "Canonical Sources" subsection is a filtered subset of this index; this section must never omit a document that a later section then cites.

## Repository Evidence Required

-   Product Bible → `docs/product/Product_Bible.md.docx` (OOXML `.docx`).
-   AI Constitution → `docs/constitution/FITME_AI_Constitution_v1.0.md` (23 chapters).
-   Architecture → `docs/architecture/FITME_ARCHITECTURE_v1.md`.
-   Engineering Workflow → `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md`.
-   Roadmap → `docs/roadmap/Roadmap.md`.
-   Changelog → `docs/roadmap/Changelog.md` (header "Last Updated: 2026-07-27").
-   Intelligence & Relationship Philosophy → `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` (Canonical v1.1).
-   Coach Bible → `docs/governance/FITME_Coach_Bible.md` (22 chapters) plus `docs/governance/FITME_Coach_Bible_Canonical_Review.md` (Ch.21–22 + closing Manifesto).
-   Coach Knowledge Base → `docs/governance/FITME_Coach_Knowledge_Base.md` (v2.0, 36 Topics across 4 Parts).
-   B1–B5 → `docs/tasks/B1/B1_SPEC.md`, `B2/B2_SPEC.md`, `B3/B3_SPEC.md`, `B4/B4_SPEC.md`, `B5/B5_SPEC_v1.0.md`.
-   C1–C4 → `docs/specs/C1_SPEC_v1.0.md`, `C2_SPEC_v1.1.md`, `C3_SPEC_v1.0.md`, `C4_SPEC_v1.0.md`.
-   D1–D3 → `docs/specs/D1_SPEC_v1.0.md`, `D2_SPEC_v1.0.md`, `D3_SPEC.md`.

## Constraints

-   No section elsewhere in this document may cite a governing document or spec not listed here without first adding it here.
-   Version identifiers must be quoted exactly as they appear in the repository.
-   `docs/specs/C1_SPEC_v1.0.md`'s filename differs from its internal document header, which reads "C1_SPEC_v1.1."

## Canonical Conflict — Coach Knowledge Base Precedence

Conflicting sources:
-   Coach Knowledge Base front matter: the Knowledge Base "is subordinate to the FITME Coach Bible and superordinate to the FITME AI Constitution, Architecture, and Implementation."
-   Engineering Workflow §3: places the AI Constitution above the Coach Bible in the Source-of-Truth hierarchy, and states the Knowledge Base "is a living research document, not a source of truth."

Decision required: which document's characterization of the Knowledge Base's precedence governs.

Decision owner: Head of Product + AI Architect.

## Repository Gaps

None, aside from the documented inconsistencies above.

## Traceability

This section is the traceability root; the Traceability Matrix, Canonical Source Mapping, and every per-section "Canonical Sources" subsection must resolve back to entries on this list.

## Forbidden Changes

Do not add documents not already governance-approved. Do not remove a document because it seems unused by the current draft — this task may still need to prove consistency against it.

## Definition of Complete

Every entry resolves to a verified repository path; every downstream "Canonical Sources" subsection cites only entries from this list.

## Claude Fill Instructions

Keep this list flat and complete. When any other section is expanded, cross-check its citations against this index rather than inventing new document names.

------------------------------------------------------------------------

# Relationship to Previous Work

Document: - What TASK-004 consumes - What it extends - What it never
replaces - What it never owns - Dependencies - Downstream consumers

## Purpose

Positions this engine precisely inside the existing chain of completed work so that ownership boundaries already settled by prior tasks are inherited, not renegotiated.

## Canonical Sources

-   D1_SPEC_v1.0.md — the canonical decision-policy layer this task must implement without introducing further product decisions of its own.
-   D2_SPEC_v1.0.md, D3_SPEC.md — the runtime and runtime ownership this task sits on top of.
-   C2_SPEC_v1.1.md, C4_SPEC_v1.0.md — feedback/suppression and memory systems this task consumes.
-   B4_SPEC.md — persistence ownership this task must not duplicate.
-   B5_SPEC_v1.0.md — the precedent for consuming Habit/Pattern derived intelligence, including a policy (`RECOMMENDATION_SUPPORT_V1`) anticipating this engine.

## Existing Repository Behaviour

-   **Consumes**: Habit/Pattern/Adaptive-TDEE/Trigger derived-intelligence signals, via B5's `DerivedIntelligenceConsumer.build(...)` (policy `RECOMMENDATION_SUPPORT_V1`, defined and tested, currently unused); feedback/suppression history via `StateAccess.read.recommendationFeedbackHistory()` and `FeedbackDomain.evaluateSuppression(...)`; memory context via `js/memory.js` (client-readable typed memories). The server-only `functions/typedMemoryServerWrite.js` write path has no read contract and is not a source of context for this engine.
-   **Extends**: the D2/D3 runtime — this engine is one of six internal collaborators inside the single Composite Engine D3 registers in the existing B2 Engine Registry (D3 §17, Decision 1).
-   **Never replaces**: `js/engineRegistry.js` registration semantics (D3 Invariant AI-01 — no second registry); B4 persistence ownership (`js/persistenceGateway.js` remains the only write path for durable client-side data); C4 memory write-path ownership (`functions/typedMemoryServerWrite.js` remains the only server-side typed-memory write path); D3's Decision Engine, Safety Layer, and Expression collaborators' own responsibilities (Stages 5/7/8/9, safety checkpoints, and delivery, respectively).
-   **Never owns**: coaching voice/personality (Coach Bible), nutrition/workout logic (`js/nutrition/`, `js/domain/nutritionModel.js`), memory storage schema (`js/memory.js`/C4), the final recommendation decision or its safety evaluation (D2 Stages 7–9, D1-AB-05's non-bypassable Safety Layer).

## Repository Evidence Required

See Existing Repository Behaviour above. The B5 `RECOMMENDATION_SUPPORT_V1` consumption path is present but unused by any caller; this task is expected to be its first consumer.

## Dependencies

-   **Upstream**: the D3 Composite Engine's Internal Pipeline Orchestrator (D1–D3 are approved decision/architecture specifications, not yet implemented in `js/`); the Memory Layer (D2 Stage 2, D3 Decision 3) must complete Context Assembly for the current Decision Pass before this engine's Stage 6 responsibility can execute.
-   **Downstream**: the Decision Engine (D2 Stages 5, 7, 8, 9) consumes this engine's candidates; Expression (`js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, per D3 §6.2) is the ultimate downstream consumer of whatever the Decision Engine selects.

## Constraints

"Never replaces" and "never owns" items are hard boundaries inherited from Canonical Authority and Out of Scope — restated here in relationship terms, not re-decided.

## Repository Gaps

No part of the D2 Canonical Pipeline or the D3 Composite Engine architecture is implemented in the repository — D1, D2, and D3 are decision/architecture documents only. No Composite Engine, Internal Pipeline Orchestrator, or Memory Layer implementation exists for this engine to plug into.

## Architecture Decision Pending (Resolved)

Resolved by Canonical Decisions CD-03/CD-04 (Head of Product + AI Architect, 2026-07-29): TASK-004 implements the Composite Engine architecture already approved by D3_SPEC.md §17 — the Composite Engine Shell and Internal Pipeline Runtime are built as part of TASK-004, not assumed to be a prerequisite task's output. This is engineering implementation of an already-approved architecture, not a new architecture decision; the Composite Engine is permanent canonical infrastructure, and the Recommendation Engine is its first operational collaborator. Future tasks (TASK-005, TASK-006) extend this infrastructure; they do not redesign or replace it.

## Traceability

Cross-reference Integration Map and Dependency Matrix — this section is the narrative form of what those matrices formalize.

## Forbidden Changes

Do not reinterpret what a prior task already decided about ownership; only describe how this task relates to that decision.

## Definition of Complete

Each of the six bullets is populated with a cited, verified relationship. The Composite Engine shell question is resolved above per CD-03/CD-04.

## Claude Fill Instructions

Fill using only relationships confirmable against the cited specs and repository modules. If a relationship is assumed but unverified, mark it "candidate, pending confirmation" rather than asserting it as fact.

------------------------------------------------------------------------

# Problem Statement

Document: - Current repository limitation - Why Recommendation Engine is
required - Why existing runtime is insufficient

Repository evidence required.

## Purpose

Justifies this task's existence with evidence rather than assertion.

## Canonical Sources

-   Roadmap — TASK-004 sequencing.
-   Architecture §12 — "the Habit Engine and Pattern Engine currently compute and persist data that no other part of the app reads back — they are write-only observation layers" (pre-B5; partially superseded).
-   D2_SPEC_v1.0.md Unit 07 — assigns Stage 6 (Candidate Generation) to a Recommendation Engine that does not yet exist.

## Existing Repository Behaviour

Four independently-triggered engines (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`) each produce signals through `js/engineRegistry.js` with no shared ranking, prioritization, conflict-resolution, or selection layer across them: all four declare `dependsOn: []` in `js/engines/registerEngines.js`, and each independently persists its own derived output via `js/persistenceGateway.js` without cross-engine arbitration. B5 (`js/derivedIntelligenceConsumer.js`) provides a read aggregation boundary over Habit/Pattern output (with overlap/contradiction detection), but forbids the adapter itself from "calling an LLM or deciding recommendations" (B5 §8) — it is a consumption boundary, not a decision layer.

## Repository Evidence Required

`js/engines/registerEngines.js` shows all four engines with empty `dependsOn`; `js/derivedIntelligenceConsumer.js`'s own invariants (§8, Invariants 16–17) prohibit it from making recommendation decisions.

## Constraints

The problem statement describes a limitation, not a solution; solution shape belongs in Purpose/Scope/Pipeline, not here.

## Repository Gaps

No repository test exercises "two engines disagree" or "candidates require ranking" as a scenario.

## Traceability

Agrees with Purpose and Scope: the limitation named here (no shared decision/ranking layer across engine signals) is the responsibility claimed in Purpose (D2 Stage 6 ownership).

## Forbidden Changes

Do not use this section to justify scope not already listed in Scope/Out of Scope.

## Definition of Complete

All three bullets are populated with evidence-backed statements, each citing a specific file or documented gap rather than a general claim.

## Claude Fill Instructions

Every claim here must be falsifiable against the repository. If evidence cannot be found, record the absence as a Repository Gap rather than asserting the limitation as fact.

------------------------------------------------------------------------

# Product Objectives

All objectives must be measurable, observable and repository-traceable.

## Purpose

Defines what "success" for this task looks like in terms that can be checked against the repository.

## Canonical Sources

-   Product Bible §1 "Vision," §3 "Coach Philosophy."
-   AI Constitution Ch.11 §11.2 "The Objective Of Every Recommendation."
-   Intelligence & Relationship Philosophy Ch.4 "Every Recommendation Must Create Value."

## Existing Canonical Documentation

The AI Constitution (§11.2) states every recommendation must simultaneously: (1) improve the user's decision, (2) strengthen the coaching relationship, (3) increase probability of future adherence — *"If a recommendation improves nutrition but weakens trust... it is not a successful recommendation."* Intelligence & Relationship Philosophy Ch.4: *"Before making any recommendation FITME should be able to answer one question: 'How does this improve this person's future?' If no meaningful answer exists, the recommendation should not be made."*

Resolved by Canonical Decision — TASK-004 Stage 1 (Head of Product + AI Architect): the canonical Product Objective is that the Recommendation Engine generates recommendation candidates that improve the user's next decision, strengthen the coaching relationship, and improve long-term adherence; it does not perform final winner selection. This objective is stated qualitatively, consistent with the Constitution/Philosophy citations above — no additional numeric target or proxy metric was provided, and none is required beyond this canonical statement.

## Responsibilities

Product/Architecture author the measurable objectives; Engineering may only add measurement mechanics (e.g., via feedback-event telemetry already flowing through `js/feedback/feedbackDomain.js` and `coachEvents[]`), not the objective itself.

## Validation Rules

-   Every objective must have a corresponding entry in Acceptance Criteria and, where applicable, a Required Test.
-   An objective that cannot be observed in the repository is not yet valid.

## Product Decision Pending (Resolved)

Resolved by Canonical Decision — TASK-004 Stage 1 (Head of Product + AI Architect): see Existing Canonical Documentation above for the canonical Product Objective statement.

## Traceability

Must map to entries in Acceptance Criteria → Functional/Product subsections, once defined.

## Forbidden Changes

Engineering must not invent objectives on Product's behalf.

## Definition of Complete

The canonical Product Objective is fixed (Stage 1, above); it is stated qualitatively rather than as a numeric target, which is what Product/Architecture approved. It is now mirrored in Acceptance Criteria (Product), verified against the completed implementation.

## Claude Fill Instructions

Do not alter the canonical Product Objective (Stage 1). Mirror it in Acceptance Criteria once implementation exists to verify against.

# Non Goals

Explicitly list excluded features, deferred work and excluded
optimizations.

## Purpose

Prevents scope creep by naming what was considered and deliberately deferred or excluded, distinct from what was never in scope at all (that distinction belongs in Out of Scope).

## Canonical Sources

-   Roadmap — TASK-005 (Initiative Engine) and TASK-006 (Decision Engine) are both listed as separate, subsequent, currently-PENDING tasks.

## Existing Canonical Documentation

D2_SPEC_v1.0.md Unit 07 separates this engine's responsibility (Stage 6, Recommendation-kind candidates) from the Initiative Engine (also Stage 6, but Initiative-kind candidates — TASK-005) and the Decision Engine (Stages 5/7/8/9 — TASK-006). Initiative-triggered (proactive/unprompted) recommendations and final winner-selection/decision-formation logic are out of this task's scope, deferred to their own named future tasks per the Roadmap.

## Constraints

A Non Goal must name a specific deferred capability, not restate an Out of Scope boundary.

## Repository Gaps

None beyond the general Product Objectives gap already recorded.

## Traceability

TASK-005 (Initiative Engine) and TASK-006 (Decision Engine) are named, currently-PENDING Roadmap entries.

## Forbidden Changes

Engineering must not decide what is deferred; only record what Product/Architecture has already decided.

## Definition of Complete

Every deferred feature, work item, and optimization is named, with a Roadmap reference if one exists.

## Claude Fill Instructions

If empty at fill-time, record as an open Product/Architecture input rather than inferring non-goals from the Scope list.

# Functional Scope

For every capability document: - Purpose - Owner - Inputs - Outputs -
Consumers - Dependencies - Repository evidence

## Purpose

The per-capability breakdown of the Scope section's items.

## Canonical Sources

Same set as Scope (D2 Unit 07 Stage Contracts, D3 §17, C2, C4, B4), filtered per capability below.

## Capability Table

**1. Responsibilities** — Purpose: define this engine's single decision responsibility. Owner: this engine (Recommendation Engine collaborator). Inputs: Pipeline Context (D2 Stage 2, Memory Layer output). Outputs: a one-sentence responsibility statement (see Purpose section above). Consumers: this document's own Scope/Functional Scope sections. Dependencies: D2 Stage assignment (Unit 07). Repository evidence: none (policy-level, not code).

**2. Execution flow** — Purpose: fix invocation order. Owner: D3's Internal Pipeline Orchestrator (this engine is invoked by the orchestrator, per D2's Stage sequence). Inputs: current Decision Pass state at Stage 6. Outputs: control returns to the orchestrator for Stage 7 (Decision Engine's Prioritization). Consumers: Decision Engine. Dependencies: D2 Stages 1–5 must have completed for the current cycle. Repository evidence: `js/coachDecisionSystem/internalPipelineOrchestrator.js` (implemented; see Relationship to Previous Work and Closure Record). Stages 4–5 are not built by TASK-004 (Decision-Engine-owned/no canonical Decision-Window detection rule exists — see Closure Record, Follow-up Work Items), so the live path currently yields empty candidates every cycle; `runForOpportunity()` exposes Stage 6 directly for a real `EligibleOpportunity` once one exists.

**3. Engine ownership** — Purpose/Owner: per D3 §17 Decision 1, this engine is an internal collaborator of the single Composite Engine registered in `js/engineRegistry.js`; it is not independently registered (unlike `habitEngine`/`patternEngine`/`adaptiveTdeeEngine`/`triggerEngine`, which each have their own `registerEngines.js` entry). Repository evidence: `js/engines/registerEngines.js` (existing pattern, not replicated for this engine), D3_SPEC.md §17.

**4. Ranking** — see Ranking Framework (Ranking Policy resolved — Canonical Decision Stage 5: this engine performs no internal ranking).

**5. Prioritization** — Purpose: per D2 Unit 07, full Prioritization (Stage 7) is a Decision Engine responsibility, not this engine's. Owner: Decision Engine (TASK-006, out of scope here). Per Ranking Policy (Canonical Decision, Stage 5), this engine's role is limited to producing well-formed, unordered candidates for Stage 7 to prioritize across engine types (Recommendation vs. Initiative) — no internal priority score or semantic ordering of any kind is permitted. Repository evidence: D2_SPEC_v1.0.md Unit 07.

**6. Explanation generation** — see Explainability (Explainability Policy resolved — Canonical Decision Stage 6). Consumer: Expression collaborator (`js/coach/coachPresenter.js`/`js/trigger/triggerController.js`, per D3 §6.2).

**7. Lifecycle** — see Runtime Ownership. Owner: this engine's own internal state; overall Composite Engine lifecycle owned by `js/engineRegistry.js` + D3's Internal Pipeline Orchestrator (`js/coachDecisionSystem/internalPipelineOrchestrator.js`, built).

**8. Integration contracts** — see Canonical Contracts and Integration Map.

**9. Persistence interaction** — Owner: `js/persistenceGateway.js` (existing, unchanged). Any persistence need (e.g., a candidate audit trail) must go through the existing closed operation catalog — adding a new operation requires a B4-conformant catalog entry, not a bypass. Repository evidence: `js/persistenceGateway.js` v1.0.0.

**10. Memory interaction** — Owner: `js/memory.js` (client read) for context; `functions/typedMemoryServerWrite.js` (server write-only) if this engine's output is ever persisted as a typed memory (e.g., `source: 'coach_generated'`) — a new caller of an existing, currently-unconsumed capability. Repository evidence: both files exist, unchanged by this task.

**11. Suppression interaction** — Owner: `js/feedback/feedbackDomain.js` (`evaluateSuppression`), consumed via `StateAccess.read.recommendationFeedbackHistory()`. Repository evidence: `js/feedback/feedbackDomain.js`, `js/stateAccess.js`.

## Repository Evidence Required

Documented per capability above.

## Ownership

Documented per capability above; no capability claims sole ownership of a system already owned elsewhere (Decision Engine, Expression, Persistence Gateway, Memory).

## Consumers

Documented per capability above.

## Dependencies

Documented per capability above; the dominant cross-cutting dependency is the not-yet-built D3 Composite Engine/Internal Pipeline Orchestrator shell.

## Constraints

A capability table row is not complete until all seven columns are addressed or explicitly marked Repository Gap / Product Decision Pending.

## Repository Gaps

None remaining — the Internal Pipeline Orchestrator now exists (`js/coachDecisionSystem/internalPipelineOrchestrator.js`).

## Product Decision Pending (Resolved)

Ranking Policy (Stage 5 — see Ranking Framework) and Explainability Policy (Stage 6 — see Explainability) are resolved per the Canonical Decisions (Head of Product + AI Architect).

## Traceability

Each capability row traces back to its Scope bullet and forward to its corresponding Pipeline stage/section.

## Forbidden Changes

Do not merge two Scope items into a single capability row, or split one Scope item across two rows, without flagging the mismatch for Product/Architecture review.

## Definition of Complete

Eleven capability entries exist (one per Scope item), each addressed above with evidence or an explicit Repository Gap / Product Decision Pending marker.

## Claude Fill Instructions

Author one table per Scope item, in Scope's original order. Do not skip an item because it seems "obvious" — obviousness is not repository evidence.

# Runtime Placement

Define: - Invocation point - Caller - Timing - Inputs - Outputs -
Consumers

## Purpose

Pinpoints where in the runtime this engine is invoked.

## Canonical Sources

-   D2_SPEC_v1.0.md Unit 03/07 — this engine executes at Stage 6 of the Decision Pass, contributing to Stage 3.
-   D3_SPEC.md §7.1, §17 — entry point and registration model.

## Existing Repository Behaviour

Per D3 (§17, Decision 1), this engine is invoked internally by the Internal Pipeline Orchestrator, inside the single Composite Engine registered in `js/engineRegistry.js` — not invoked directly by `js/app.js` or `runAppReadyEngines()` the way the four existing engines are (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`).

**Caller**: the Internal Pipeline Orchestrator (D3), not the runtime/UI layer directly and not the Coach layer directly.

**Timing**: per D3 §7.1 (Decision 2), a Decision Pass begins from an existing B2 lifecycle trigger — `APP_READY`, `AUTH_SESSION_READY`, or the ad hoc `SOURCE_DATA_CHANGED`/`WORKOUT_COMPLETED` path — reusing the existing Trigger Catalog unchanged; no new trigger type is introduced. Within a Decision Pass, this engine executes at Stage 6, after Stages 1–5 (Receive Inputs, Context Assembly, Opportunity Detection, Evidence Evaluation, Eligibility Evaluation) have completed for that cycle.

## Repository Evidence Required

None remaining — both now exist (`js/coachDecisionSystem/registerCoachDecisionSystem.js`, `internalPipelineOrchestrator.js`), per CD-03/CD-04 (TASK-004's scope, see Relationship to Previous Work). The live `run()` path currently yields empty candidates every cycle, since Stage 3/4/5 (Opportunity Detection/Evidence/Eligibility Evaluation) are not built by this task — see Closure Record, Follow-up Work Items.

## Inputs

Whatever the Stage 6 Stage Contract (D2 Unit 04) defines as inputs to Candidate Generation — at minimum, the outputs of Stages 2–5 (assembled Pipeline Context, detected opportunities, evaluated evidence, eligible candidates-in-progress). Repository Gap: the literal D2 Unit 04 Stage 6 Stage Contract table (Inputs/Outputs/Forbidden Actions/Entry/Exit Criteria) has not been transcribed into this specification.

## Outputs

Recommendation-kind Candidates (D2 Unit 07 terminology), handed to Stage 7 (Prioritization, owned by the Decision Engine).

## Consumers

The Decision Engine (Stages 7–9), not the Coach layer directly and not the runtime directly.

## Runtime Interaction

Synchronous within a single Decision Pass cycle, sequenced by the Internal Pipeline Orchestrator; this engine does not decide when a Decision Pass runs (governed by the existing B2 trigger catalog, per D3 Decision 2).

## Dependencies

D2 Stages 1–5 must have already executed in the current cycle; the D3 Composite Engine/Orchestrator shell must exist — built (`js/coachDecisionSystem/`).

## Constraints

Placement must not require restructuring the existing four engines' invocation order, and must not introduce a second engine registry or trigger mechanism (D3 Invariant AI-01; "No runtime redesign"/"No orchestration redesign," Out of Scope).

## Failure Modes

If the Composite Engine/Orchestrator does not exist, this engine cannot be invoked — a build-sequencing precondition, not a runtime failure to handle defensively.

## Repository Gaps

None remaining — the call site now exists: `js/app.js`'s `runAppReadyEngines()` includes `coachDecisionSystem: 'DECISION_PASS'` in its `APP_READY` actions map, invoking the Composite Engine registered via `RegisterCoachDecisionSystem.registerAll()`. Build responsibility was resolved per CD-03/CD-04 (see Relationship to Previous Work) — TASK-004 built it.

## Traceability

Feeds directly into Runtime Ownership and Integration Map, both of which inherit the same "internal collaborator, not independently registered" placement.

## Forbidden Changes

Do not alter the existing invocation order of `habitEngine`/`patternEngine`/`adaptiveTdeeEngine`/`triggerEngine` to accommodate this placement.

## Definition of Complete

Invocation point, caller, timing, inputs, and consumers are each cited to D2/D3 sections; the Orchestrator shell is now built (build responsibility resolved per CD-03/CD-04, never an open ownership question).

## Claude Fill Instructions

If the invocation point does not exist, do not invent one. Describe constraints the eventual placement must satisfy instead.

# Runtime Ownership

Define: - Owner - Lifetime - State ownership - Initialization -
Shutdown - Error ownership - Recovery ownership

## Purpose

Requires a single, unambiguous owner to be documented for every runtime-lifecycle concern this engine introduces, consistent with the canonical runtime ownership model.

## Canonical Sources

-   D3_SPEC.md §17 (Decision 1), Invariants AI-01/AI-05, §12 (Failure Handling).

## Existing Repository Behaviour

`js/engineRegistry.js` (v2.0.0) is the existing single point of engine registration and lifecycle (via its sequential `run()` execution). D3 requires this engine's registration to occur once, as part of the single Composite Engine, not as its own registry entry.

## Ownership

**Owner**: this engine owns its own internal candidate-generation state (in-progress candidate list, its own working data during Stage 6). It does not own: overall Composite Engine lifecycle (owned by `js/engineRegistry.js` + the Internal Pipeline Orchestrator, D3 §17); Pipeline Context Assembly (owned by the Memory Layer collaborator, D3 §17 Decision 3 — *"Pipeline Context Assembly is an internal responsibility of the Memory Layer, not an independent or shared architectural owner"*); session lifecycle (owned by `js/sessionLifecycle.js` / REM-002 Session Lifecycle Manager, per D3 Invariant AI-05 — *"no parallel session-generation mechanism SHALL be introduced"*).

## Runtime Interaction

**Lifetime**: scoped to a single Decision Pass cycle (Stage 6 execution only); no state persists across cycles, consistent with D3 §12.2's "recompute from source" discipline (matching the existing Habit/Pattern Engines' pattern, per Architecture §15 Constraint 2). **Initialization/Shutdown**: this engine has no independent init/shutdown hook of its own — it is constructed/invoked as part of the Composite Engine's single registration lifecycle in `js/engineRegistry.js`; it must not introduce a second, parallel lifecycle.

## Failure Modes

**Error ownership**: per D3 §12.1, this engine inherits the existing principle that "an intelligence component's failure must never block application startup or the UI" (Architecture §15 Constraint 1; Architecture §19.6). D3 does not resolve the concrete detection/retry/logging mechanism (§12.3, citing D2-EF-06): *"The concrete detection/retry/logging mechanism is engineering implementation, explicitly out of D2's and D3's scope."*

## Engineering Decision Pending

The concrete error-detection/retry/logging mechanism for this engine (D2-EF-06 leaves this to engineering).

**Recovery ownership**: per D2-EF-09 (quoted in D3 §12.2), the Pipeline resumes ordinary sequencing on its next cycle "without special re-initialization," and no partial Pipeline Context from an aborted cycle is carried forward. Per D3 §12.3 (Graceful Degradation): if a Decision Input category is absent, proceed with the categories available rather than treating absence as a Pipeline Abort; if the Safety Layer or Decision Engine is unreachable, do not substitute a default/fabricated decision — "fail-open-for-availability, never-fabricate-for-content."

## Dependencies

D3's Composite Engine/Orchestrator shell (not built — see Runtime Placement); `js/engineRegistry.js`'s existing lifecycle model; the existing session-lifecycle mechanism (`js/sessionLifecycle.js`).

## Constraints

Must not introduce a second source of runtime truth alongside `js/engineRegistry.js` (D3 Invariant AI-01; "No runtime redesign," Out of Scope).

## Repository Gaps

None; the associated open item (concrete error mechanism) is Engineering Decision Pending, not a repository gap — see Failure Modes above.

## Traceability

Consistent with D3 and with Runtime Placement above.

## Forbidden Changes

Do not redefine D3's runtime ownership model itself — only describe how this engine's internal state fits within it.

## Definition of Complete

Owner, lifetime, state ownership, initialization, shutdown, error ownership, and recovery ownership are each documented for this engine specifically and shown consistent with D3, with the Engineering Decision Pending item explicitly flagged.

## Claude Fill Instructions

Cite the specific D3 clause each ownership statement is consistent with. Do not assert ownership that D3 does not already permit.

------------------------------------------------------------------------

# Integration Map

Include: - Coach - Runtime - Memory - Persistence - Feedback -
Suppression - Events - Authority - StateAccess - Engine Registry -
Composition Root

Each integration: - Purpose - Direction - Owner - Contract - Failure
handling - Testing

## Purpose

The complete inventory of every existing system this engine touches, with a full contract description per integration.

## Canonical Sources

D1–D3 (Runtime, Composition Root, Engine Registry, Authority), B4 (Persistence), C2 (Feedback/Suppression), C3 (Events), B5 (Derived Intelligence).

## Integration Table

| Integration | Direction | Owner (existing module/spec) | Contract | Failure handling | Testing |
|---|---|---|---|---|---|
| **Coach** | Read (context) / hand-off (Expression) | `js/coach/coachPromptComposer.js` (`buildSystemPrompt`), `js/coach/coachPresenter.js`, `js/trigger/triggerController.js` (D3 §6.2 — Expression realized by these two) | This engine does not call Coach directly; its output reaches Expression only after Decision Engine selection (D2 Stages 7–9) | Coach-side failures are Coach's own concern (best-effort, non-blocking per `coachPromptComposer.js`'s existing pattern for B5 data) | `tests/coachClient.test.js`, `coachPresenter.test.js`, `coachProfile.test.js`, `coachPromptComposer.test.js` |
| **Runtime** | Invoked-by | `js/app.js` (composition root) → `js/engineRegistry.js` → Composite Engine/Orchestrator (D3 §17, not built) | This engine is invoked by the Orchestrator at Stage 6, not by `js/app.js` directly | Runtime-level failure handling per D3 §12 (see Runtime Ownership) | `tests/runtimeState.test.js`, `tests/engineRegistry.test.js` |
| **Memory** | Read (context assembly, via Memory Layer collaborator) | `js/memory.js` (client read/write); `functions/typedMemoryServerWrite.js` (server write, no read contract) | This engine does not read `js/memory.js` directly — Memory Layer (D3 §17 Decision 3) owns Context Assembly and hands prepared context to Stage 6, per D2 Stage 2 | Memory unavailability handled per D3 §12.3 graceful degradation | `tests/typedMemoryServerWrite.test.js` (write path only) |
| **Persistence** | Write (optional, if candidate audit trail is required) | `js/persistenceGateway.js` (closed operation catalog) | Any new persistence need requires a new B4-conformant catalog entry, not a bypass | `persist()` never throws; returns `{status, durable, changed, version, error, receipt}` | `tests/persistenceGateway.test.js` |
| **Feedback** | Read | `js/feedback/feedbackDomain.js` (`classifyFeedback`) via `StateAccess.read.recommendationFeedbackHistory()` | Existing CD-04 vocabulary (8 types); this engine consumes classified feedback, does not classify it | N/A (read-only) | `tests/feedbackDomain.test.js` |
| **Suppression** | Read | `js/feedback/feedbackDomain.js` (`evaluateSuppression`) — same module as Feedback, not a separate one | `evaluateSuppression(feedbackEvents, surface, contextId, nowTs, policyId)` → `{suppressed, reason, suppressedUntil, policyId}` | N/A (read-only; suppression state is always recomputed, never a stored flag, per C2) | `tests/feedbackDomain.test.js` |
| **Events** | Read (indirect, via `coachEvents[]`) | No dedicated Event Bus module exists. The canonical event kind (`'feedback'`, C3) is stored in and read from `users/{uid}.coachEvents[]` (capped at 200), accessed via `StateAccess.read.recommendationFeedbackHistory()` | This engine reads feedback history via StateAccess, consistent with C3's existing producer/consumer path | N/A | Covered indirectly by `tests/feedbackDomain.test.js` |
| **Authority** | Read (metadata tagging, if this engine's output requires authority provenance) | `js/authorityContract.js` (`AUTHORITY_SOURCES`, `buildAuthorityMetadata`/`buildGenerativeMetadata`) — pure vocabulary/metadata builder, not a decision engine | If this engine's candidates are ever persisted with provenance, they would use `buildGenerativeMetadata` (`GENERATIVE` source) | N/A | `tests/authorityContract.test.js` |
| **StateAccess** | Read | `js/stateAccess.js` (B3 State Access Layer) — `read.recommendationFeedbackHistory()` capability (C2 addition) | Per B3, this engine needs its own approved read/write capability added to the canonical ownership map — no generic path-based mutation | Per B3 §11 (forbidden generic path mutation) | Covered by `tests/feedbackDomain.test.js`/B3's own wiring tests |
| **Engine Registry** | Registered-via (indirectly, as part of Composite Engine) | `js/engineRegistry.js` (v2.0.0) | `register(def)` / `run(request)` — this engine is not separately registered; it is invoked internally by the Composite Engine's Orchestrator, which is the one registry entry | Registry-level failures (`ENGINE_THREW`, `DEPENDENCY_FAILED`, etc.) apply to the Composite Engine as a whole | `tests/engineRegistry.test.js` |
| **Composition Root** | N/A (does not invoke this engine directly) | `js/app.js` | `js/app.js` calls `RegisterEngines.registerAll()`; the future Composite Engine registration would be a new call in this same file | N/A | No dedicated composition-root test file exists |

## Repository Evidence Required

See Integration Table.

## Responsibilities / Ownership

Documented per row; this engine owns none of these eleven systems, consistent with Canonical Contracts' ownership rule.

## Failure Modes

Documented per row; the concrete error-mechanism question is tracked as Engineering Decision Pending under Runtime Ownership, not repeated here.

## Required Tests

Existing test files identified per row above are the conventions new tests extend, per Test Strategy.

## Repository Gaps

None remaining — the Composite Engine/Orchestrator and its `js/app.js` registration call now exist (`RegisterCoachDecisionSystem.registerAll();`, called immediately after the existing `RegisterEngines.registerAll();`), per CD-03/CD-04 (TASK-004's scope, see Relationship to Previous Work). All eleven Integration Table rows are exercised by `tests/coachDecisionSystemWiring.test.js`.

## Traceability

This section's rows match Test Strategy → Integration Tests' system list exactly.

## Forbidden Changes

Do not assign this engine ownership over any of these eleven systems.

## Definition of Complete

Eleven integration rows, each populated with a verified Owner and Contract reference, with the Composite Engine shell gap named rather than invented around.

## Claude Fill Instructions

Do not guess module names for unconfirmed integrations. Confirm each against the relevant canonical spec and the actual repository before filling; if still unconfirmed at fill-time, leave as Repository Gap rather than asserting a location.

------------------------------------------------------------------------

# Canonical Contracts

CC-01 Runtime Contract

CC-02 Recommendation Request Contract

CC-03 Recommendation Result Contract

CC-04 Recommendation Lifecycle

CC-05 Recommendation Ownership

CC-06 Coach Contract

CC-07 Memory Contract

CC-08 Feedback Contract

CC-09 Suppression Contract

CC-10 Event Contract

CC-11 Authority Contract

CC-12 Persistence Contract

All require repository evidence and must preserve previous canonical
ownership.

## Purpose

Names every formal contract this engine must satisfy or produce. A contract here is a precise, testable interface agreement — not a narrative description (that belongs in Integration Map).

## Contract-by-Contract Population

**CC-01 Runtime Contract** → D2's Stage Contract concept (Unit 04: Purpose/Inputs/Outputs/Responsibilities/Forbidden Actions/Dependencies/Entry Criteria/Exit Criteria/Cross References), applied to Stage 6. D2's own term is "Stage Contract," not "Runtime Contract."

**CC-02 Recommendation Request Contract** — Resolved by Canonical Decision — TASK-004 Stage 3 (Head of Product + AI Architect):

```text
RecommendationRequest
{
    opportunity: EligibleOpportunity,
    pipelineContext: ImmutablePipelineContext
}
```

The engine consumes an eligible Opportunity and an immutable Pipeline Context only.

**CC-03 Recommendation Result Contract** — Resolved by Canonical Decision — TASK-004 Stage 4 (Head of Product + AI Architect):

```text
RecommendationResult
{
    candidates: RecommendationCandidate[]
}
```

Each candidate contains: `kind`, `category` (per Recommendation Categories), `action`, `rationale`, `confidence`, `hierarchyTier`, `opportunityProvenance`. An empty candidate list is valid.

**CC-04 Recommendation Lifecycle** → D2's Decision Pass Stages 1–10 plus Post-Decision Continuation Stages 11–13 (Unit 03), scoped to this engine's own Stage 6/Stage 3-contribution portion; D3 §12 (Failure Handling/recovery) for abort/resume behavior.

**CC-05 Recommendation Ownership** → D3 §17 Decision 1: this engine is an internal collaborator of the single Composite Engine, never independently owned/registered.

**CC-06 Coach Contract** → `js/coach/coachPromptComposer.js`'s existing `buildSystemPrompt(userProfile, todayData, currentUser)` contract, and D3 §6.2's identification of `js/coach/coachPresenter.js`/`js/trigger/triggerController.js` as the current Expression realization.

**CC-07 Memory Contract** → `js/memory.js` (client read: `list()`) for context; `functions/typedMemoryServerWrite.js`'s `TypedMemoryServerWriteRequest` shape (C4 §12) if this engine's candidates are ever persisted as typed memories (`source: 'coach_generated'`, unconditionally `status: 'candidate'`).

**CC-08 Feedback Contract** → C2's CD-04 classification vocabulary (`Accepted, Completed, Dismissed, Rejected, Ignored, Expired, User Corrected, User Confirmed`), implemented in `js/feedback/feedbackDomain.js`'s `classifyFeedback`.

**CC-09 Suppression Contract** → `js/feedback/feedbackDomain.js`'s `evaluateSuppression(feedbackEvents, surface, contextId, nowTs, policyId)` → `{suppressed, reason, suppressedUntil, policyId}`, with default `SUPPRESSION_RECOVERY_POLICY_V1` (`windowDays:14, patternThreshold:3, suppressionDurationDays:7`).

**CC-10 Event Contract** → C3's canonical event kind `'feedback'` (schema v1: `kind, surface, contextId, feedbackType, date, ts`), stored in `users/{uid}.coachEvents[]` (capped 200). No Event Bus module exists.

**CC-11 Authority Contract** → `js/authorityContract.js`'s `AUTHORITY_SOURCES` vocabulary and `buildAuthorityMetadata`/`buildGenerativeMetadata` — a pure metadata builder, not a decision authority; D1's separate Canonical Decision Hierarchy governs decision-time authority, not this module.

**CC-12 Persistence Contract** → `js/persistenceGateway.js`'s `PersistenceRequest`/`PersistenceResult` shapes and its closed operation catalog (B4 §7–§11); any new operation this engine requires must be added to that catalog through the existing approval mechanism, not bypassed.

## Repository Evidence Required

Documented per contract above, aside from the CC-01 transcription gap. CC-02/CC-03 shapes are fixed per Canonical Decisions Stage 3/4 (see Contract-by-Contract Population above).

## Responsibilities

CC-02/CC-03 are now Product/Architecture-approved (Stages 3–4); engineering documents conformance for all twelve contracts, including CC-02/CC-03, rather than drafting proposed shapes.

## Ownership

Each contract has exactly one owning spec/system, as cited above; no contract is jointly owned.

## Repository Gaps

CC-01's Stage 6 table has not been verbatim-transcribed from D2_SPEC_v1.0.md Unit 04.

## Product Decision Pending (Resolved)

CC-02, CC-03 shapes are resolved per Canonical Decisions Stage 3/4 (Head of Product + AI Architect) — see Contract-by-Contract Population above.

## Traceability

Every CC appears in the Traceability Matrix and, where it corresponds to a system integration, in the Integration Matrix.

## Forbidden Changes

Do not alter the shape of CC-01–CC-12 beyond what their owning spec already defines (CC-02/CC-03 per Canonical Decisions Stage 3/4). Do not add a new CC without Product/Architecture approval.

## Definition of Complete

All twelve contracts are documented with cited shape and owning source (CC-02/CC-03 per Canonical Decisions Stage 3/4), and each preserves previously approved ownership.

## Claude Fill Instructions

For CC-01–CC-12 (including CC-02/CC-03, resolved per Canonical Decisions Stage 3/4), quote the owning spec's actual contract shape rather than re-deriving it.

------------------------------------------------------------------------

# Recommendation Evaluation Pipeline

Canonical stages (13, per D2_SPEC_v1.0.md Unit 03's Canonical Pipeline): 1. Receive Inputs 2. Context Assembly 3. Opportunity Detection 4. Evidence Evaluation 5. Eligibility Evaluation 6. Candidate Generation 7. Prioritization 8. Winner Selection 9. Decision Formation 10. Expression 11. Feedback Processing 12. Evidence Update 13. Memory Update. Stages 1–10 = "Decision Pass," 11–13 = "Post-Decision Continuation." This engine is assigned Stage 6 (Candidate Generation) plus a contributing role in Stage 3 (Opportunity Detection), per D2 Unit 07 and D3 §17.

No implementation details.

## Canonical Conflict — Pipeline Definition (Resolved)

Conflicting sources (historical record):
-   This specification's original stage list (ten stages: Candidate discovery → ... → Delivery) — superseded.
-   D2_SPEC_v1.0.md Unit 03's Canonical Pipeline (thirteen stages, listed above), which assigns this engine only Stage 6 (Candidate Generation) plus a contributing role in Stage 3 (Opportunity Detection), per D2 Unit 07 and D3 §17.

Resolved by Canonical Decision CD-01 (Head of Product + AI Architect, 2026-07-29): the canonical FITME runtime pipeline consists of the 13 stages defined by D2_SPEC_v1.0.md Unit 03. This specification's original ten-stage list was a documentation inconsistency, now aligned with the canonical model above.

## Purpose

This section's canonical operational content is D2's Decision Pass; this engine's scope within it is Stage 6 (+ Stage 3 contribution).

## Canonical Sources

D2_SPEC_v1.0.md Units 03, 04, 05, 07.

## Existing Repository Behaviour

No pipeline of either shape exists in repository code.

## Responsibilities

This engine is directly responsible only for Stage 6 (and a contributing role in Stage 3); it is not responsible for Stages 7–9 (Decision Engine), Stage 10 (Expression), or Stages 11–13 (Feedback/Evidence/Memory Update, split across Feedback processing and the Memory Layer).

## Dependencies

Stage 6 depends on Stages 1–5 having executed in the current cycle (D2 Unit 05's Pipeline Invariants — fixed order, no reordering, D2-INV-02).

## Constraints

D2-INV-07 (Policy Separation): *"No Stage or engine covered by this specification SHALL introduce a coaching, recommendation, priority, evidence, memory, personalization, or safety policy not already fixed by D1."* This directly constrains Ranking Framework and Explainability below.

## Failure Modes

D2-EF-06 (Pipeline Abort): no Terminal Decision shall be fabricated if a Stage cannot execute; the concrete detection/retry/logging mechanism is Engineering Decision Pending (see Runtime Ownership).

## Repository Gaps

This engine's assigned scope (Stage 6, Candidate Generation) now exists in code (`js/coachDecisionSystem/recommendationEngine.js`); the full 13-stage Canonical Pipeline does not, and is not this task's scope — Stages 5/7/8/9 remain the Decision Engine's (TASK-006), Stage 6 Initiative-kind remains the Initiative Engine's (TASK-005), consistent with Non Goals.

## Traceability

Ranking Framework confirms (per Canonical Decision Stage 5) that this engine performs no internal candidate-ordering; it produces unordered candidates feeding D2's Stage 7 (Decision Engine's Prioritization), which exclusively owns ordering and winner selection.

## Forbidden Changes

Do not reorder, rename, merge, or split the canonical 13-stage list. Do not reinterpret CD-01 beyond what it states.

## Definition of Complete

Complete — the Pipeline Definition conflict is resolved per CD-01; this engine's Stage 6 (+ Stage 3 contribution) scope is unchanged by the resolution.

## Claude Fill Instructions

Reference D2's actual stage numbers/names when describing this engine's real behavior; the specification's original ten-stage list is historical placeholder language, superseded by CD-01.

------------------------------------------------------------------------

# Ranking Framework

Document: - Inputs - Weights - Priority sources - Conflict resolution -
Tie breaking - Ordering guarantees

Repository evidence required.

## Purpose

Resolved by Canonical Decision — TASK-004 Stage 5 (Head of Product + AI Architect): the Recommendation Engine performs no semantic ranking. The Decision Engine exclusively owns prioritization, winner selection, tie-breaking, recommendation budget, and final decision formation. No internal priority score or semantic ordering is permitted for this engine's output — not full cross-engine prioritization, which D2 assigns to the Decision Engine.

## Canonical Sources

-   D2_SPEC_v1.0.md Unit 07 — Stage 7 (Prioritization) is a Decision Engine responsibility, not this engine's.
-   Coach Bible Ch.2 "Canonical Decision Hierarchy" / D1 Unit 02 — the 10-tier ladder (Safety → Medical → Trust → Long-term adherence → Context relevance → Goal alignment → User autonomy → Behavioral effort → Nutritional/training optimization → Product engagement) governs final priority ordering, applied by the Decision Engine (Stage 7/8), consistent with D2-INV-07's Policy Separation rule.

## Existing Repository Behaviour

No ranking/weighting mechanism for cross-engine signals exists in `js/engineRegistry.js` or elsewhere.

## Repository Evidence Required

None of the existing four engines expose a confidence/priority score usable as a ranking input (`habitEngine`/`patternEngine` return only `{status, output:{persistence}}`; `adaptiveTdeeEngineAdapter`/`triggerEngineAdapter` similarly return status/persistence only, no numeric confidence field).

## Inputs

Candidates surfaced during this engine's own Stage 6 execution, plus whatever Stage 3/4/5 (Opportunity Detection, Evidence Evaluation, Eligibility Evaluation) have already attached to them by the time Stage 6 runs.

## Dependencies

Stages 3–5's outputs are required inputs, per D2's fixed pipeline order.

## Validation Rules

Per Canonical Decision Stage 5, this engine SHALL NOT apply any internal ordering, priority score, or semantic ranking to candidates before handing them to Stage 7. Candidate generation itself must remain deterministic and testable (same input yields the same candidate set) across repeated runs with identical input.

## Failure Modes

Tie-breaking is exclusively a Decision Engine responsibility (Canonical Decision, Stage 5); this engine has no tie-breaking logic of its own.

## Required Tests

Unit tests for: candidate-generation determinism (same input yields the same candidate set) across repeated runs with identical input, and a negative test confirming this engine does not attach or apply any priority score or ordering to its output.

## Ranking Policy (Resolved)

Resolved by Canonical Decision — TASK-004 Stage 5 (Head of Product + AI Architect): the Recommendation Engine performs no semantic ranking. The Decision Engine exclusively owns prioritization, winner selection, tie-breaking, recommendation budget, and final decision formation. No internal priority score or semantic ordering is permitted. The Canonical Decision Hierarchy governs final cross-candidate prioritization, but that remains the Decision Engine's Stage 7/8 responsibility, not this engine's.

## Traceability

Attaches to D2 Stage 6 (feeding Stage 7); consistent with D2-INV-07 (Policy Separation) and Ranking Policy (Stage 5).

## Forbidden Changes

Do not let this engine perform any internal ordering, priority scoring, tie-breaking, or Stage 7/8 Prioritization/Winner Selection — all of that remains exclusively the Decision Engine's responsibility (Canonical Decision, Stage 5).

## Definition of Complete

Complete — Ranking Policy is resolved per Canonical Decision Stage 5 (no internal ranking or ordering performed by this engine).

## Claude Fill Instructions

Ranking Policy is finalized (Stage 5); do not introduce ranking weights, priority scores, or ordering logic into this engine — none are authorized.

# Recommendation Categories

For each: - Purpose - Owner - Priority - Producer - Consumers -
Dependencies - Explanation strategy

## Purpose

Requires the distinct kinds of recommendation this engine can produce to be enumerated. Resolved by Canonical Decision — TASK-004 Stage 2 (Head of Product + AI Architect): the canonical Recommendation Category list is `IMMEDIATE_ACTION`, `PREPARATION`, `RECOVERY`, `SYSTEM_BUILDING`.

## Canonical Sources

-   Product Bible §4 "Coach Brain — Knowledge domains" (Identity, Goals, Health, Current Status, Habits, Patterns, Preferences, Communication Style, Memories, Achievements) — a knowledge-domain taxonomy, not a recommendation-content-category taxonomy.
-   AI Constitution Ch.11 §11.6 "Recommendation Hierarchy" — an impact/urgency tier system (Level 1 Critical → Level 2 High Impact → Level 3 Optimization → Level 4 Educational), not a content-domain taxonomy (nutrition/workout/habit/etc.).

## Existing Repository Behaviour

No canonical list of recommendation content categories previously existed in the Product Bible, AI Constitution, or Coach Bible; the canonical list is now fixed by Stage 2 (`IMMEDIATE_ACTION`, `PREPARATION`, `RECOVERY`, `SYSTEM_BUILDING`). Candidate category producers exist in the repository (`js/engines/habitEngine.js`, `patternEngine.js`, `adaptiveTdeeEngineAdapter.js`, `triggerEngineAdapter.js`), but their mapping to these four canonical categories has not yet been evidenced (see Repository Gaps).

## Repository Evidence Required

The four existing engines above are candidate producers only; their mapping to the four canonical categories is implementation-time repository evidence, not yet established.

## Ownership

Now that the category list is approved (Stage 2), each category's Producer is the specific existing engine (or a new one) that originates its underlying signal; this engine remains the consumer/generator of candidates from those signals, not the producer of the underlying observation.

## Constraints

No category may be introduced beyond the four canonical categories fixed by Stage 2 (`IMMEDIATE_ACTION`, `PREPARATION`, `RECOVERY`, `SYSTEM_BUILDING`).

## Repository Gaps

Coach Knowledge Base Topics 09–36 have not been incorporated into this specification and have not been checked for a category taxonomy. The per-category Purpose/Owner/Priority/Producer/Consumers/Dependencies/Explanation-strategy breakdown (per this section's skeleton) has not yet been mapped against repository evidence — this is implementation-time engineering work, not a further Product decision, per Ownership above.

## Recommendation Categories (Resolved)

Resolved by Canonical Decision — TASK-004 Stage 2 (Head of Product + AI Architect): `IMMEDIATE_ACTION`, `PREPARATION`, `RECOVERY`, `SYSTEM_BUILDING`.

## Traceability

Ties to Explainability's per-category explanation strategy (Stage 6) and to CC-03's `category` field (Stage 4). Ranking Framework does not assign priority by category, per Stage 5 (no internal ranking performed by this engine).

## Forbidden Changes

Do not add, remove, or rename any of the four canonical categories (`IMMEDIATE_ACTION`, `PREPARATION`, `RECOVERY`, `SYSTEM_BUILDING`) fixed by Stage 2.

## Definition of Complete

Complete: the canonical category list is resolved per Stage 2. The per-category Purpose/Owner/Producer/Consumer/Dependencies/Explanation-strategy breakdown remains a Repository Gap for implementation time, not a Product Decision Pending item.

## Claude Fill Instructions

The canonical category list (Stage 2) is fixed; do not infer additional categories from existing engine names or introduce new ones. Map existing engines to these four categories using repository evidence at implementation time.

# Personalization

Document: - Memory modifiers - Feedback modifiers - Suppression
modifiers - Time modifiers - Context modifiers

No speculative personalization.

## Purpose

Documents how per-user state is allowed to modify recommendation selection or ranking — strictly the modifiers already sanctioned elsewhere.

## Canonical Sources

-   Intelligence & Relationship Philosophy Ch.6 "Memory Creates Intelligence," "Confidence Matters"; Ch.7 "Learning Requires Feedback"; Principles 5–8 (Personalization Is Mandatory, Context Determines Meaning, Memory Creates Continuity, Patterns Matter More Than Events).
-   C2_SPEC_v1.1.md — feedback/suppression modifier semantics.

## Existing Repository Behaviour

-   **Memory modifier**: `js/memory.js`'s `list()` (client-readable typed memories). The D2/D3 architecture routes memory access through the Memory Layer collaborator's Context Assembly (Stage 2), not a direct call from this engine.
-   **Feedback modifier**: `js/feedback/feedbackDomain.js`'s `classifyFeedback`, via `StateAccess.read.recommendationFeedbackHistory()`.
-   **Suppression modifier**: same module, `evaluateSuppression(...)`, with default policy `SUPPRESSION_RECOVERY_POLICY_V1` (`windowDays:14, patternThreshold:3, suppressionDurationDays:7`).
-   **Time / context modifiers**: no dedicated repository module exists. Per D2 Unit 07, Context Assembly (Stage 2, Memory Layer) is the architectural owner of assembling contextual/time-based inputs into the Pipeline Context this engine receives.

## Repository Evidence Required

Confirmed above for memory/feedback/suppression; time/context modifiers arrive pre-assembled via Stage 2.

## Constraints

"No speculative personalization" bars introducing a modifier type not in this five-item list, and bars this engine from sourcing its own time/context signals directly (that would duplicate D2 Stage 2 ownership).

## Validation Rules

A modifier must be traceable to a specific field or event in its owning system.

## Repository Gaps

None remaining — the minimal Memory Layer / Context Assembly shell now exists (`js/coachDecisionSystem/memoryLayer.js`), per CD-02 (TASK-004's scope, not a prerequisite task's responsibility — see Relationship to Previous Work).

## Architecture Decision Pending (Resolved)

Resolved by Canonical Decision CD-02 (Head of Product + AI Architect, 2026-07-29): TASK-004 includes a minimal Memory Layer whose sole responsibility is Context Assembly for this engine. This engine consumes memory context via the Memory Layer's Context Assembly (Stage 2) output; it does not read `js/memory.js` or `coachEvents[]` directly. CD-02 does not authorize any memory redesign, migration, memory architecture change, memory model change, or memory API change — the existing memory infrastructure (`js/memory.js`, `functions/typedMemoryServerWrite.js`) remains unchanged.

## Traceability

Attaches to D2 Stage 3 (Opportunity Detection, where this engine contributes) and Stage 6 (Candidate Generation).

## Forbidden Changes

Do not add a sixth modifier category.

## Definition of Complete

Each of the five modifiers is documented with a cited data source (memory/feedback/suppression) or an architectural ownership statement (time/context via Stage 2); none are speculative.

## Claude Fill Instructions

If a modifier's data source cannot be confirmed in the repository, record it as Repository Gap rather than describing a plausible-sounding mechanism.

# Explainability

Document: - Source - Ownership - Format - Guarantees - Missing
explanation behavior

## Purpose

Requires "explanation generation" to guarantee something specific about every recommendation surfaced downstream. Resolved by Canonical Decision — TASK-004 Stage 6 (Head of Product + AI Architect): the Recommendation Engine owns structured Decision Truth; Expression owns only user-facing rendering. A candidate that cannot be explained truthfully must not be returned.

## Canonical Sources

-   AI Constitution Ch.11 §11.5 "Every Recommendation Must Have A Reason," §11.14 "The Coach Explains Just Enough."
-   Intelligence & Relationship Philosophy Ch.6 "Explainability Builds Trust"; Ch.9 Principle 14 "Intelligence Must Be Explainable."
-   Coach Bible Ch.4 §8 "Explaining Decisions": *"Explanation should also be calibrated to the confidence... assigned to the underlying reasoning. A recommendation built on months of consistent evidence can be explained plainly... A recommendation built on a single recent, unconfirmed observation should be explained more tentatively, framed openly as an experiment rather than a certainty."*

## Existing Repository Behaviour

`js/coach/coachPromptComposer.js`'s `buildSystemPrompt(userProfile, todayData, currentUser)` is the module that would render this engine's output as part of the coaching interaction, via its existing B5 Derived Intelligence fragment mechanism (best-effort, non-blocking).

## Repository Evidence Required

`js/coach/coachPromptComposer.js`'s existing signature and B5-fragment pattern is the precedent to extend.

## Ownership

This engine is responsible for generating the structured `explanation` object (Decision Truth: `rationale`, `evidenceBasis`, `expectedValue`, `uncertainty` — Stage 6); Coach (`coachPromptComposer.js`/`coachPresenter.js`) is responsible only for final user-facing voice/tone rendering of that explanation, per Coach Bible Ch.4's tone rules — these are not the same responsibility.

## Outputs

Format: Resolved by Canonical Decision Stage 6 (Explainability Policy):

```text
explanation
{
    rationale,
    evidenceBasis,
    expectedValue,
    uncertainty
}
```

Coach Bible Ch.4 §8's confidence-calibration requirement is satisfied structurally by the candidate's `confidence` field (CC-03, Stage 4), independent of this separately-defined `explanation` object (Stage 6).

## Failure Modes

Missing explanation behavior: resolved by Canonical Decision Stage 6 — a candidate that cannot be explained truthfully must not be returned. AI Constitution §11.5: *"If the coach cannot explain why... the recommendation should not exist."*

## Repository Gaps

`js/coach/coachPromptComposer.js` has no existing field for a recommendation-explanation object.

## Traceability

Attaches to D2's Expression stage (Stage 10), realized by `coachPresenter.js`/`triggerController.js` (D3 §6.2). The `explanation` object's shape is fixed by Stage 6, independently of CC-03's own field list (Stage 4).

## Forbidden Changes

Do not let this engine perform final coaching-voice rendering — that remains Coach's responsibility ("No AI personality redesign," Out of Scope).

## Definition of Complete

Complete: Explainability Policy is resolved per Canonical Decision Stage 6 (structured `explanation` object — `rationale`, `evidenceBasis`, `expectedValue`, `uncertainty`; a candidate that cannot be explained truthfully must not be returned). The confidence-calibration requirement from Coach Bible Ch.4 §8 is satisfied via the candidate's `confidence` field (CC-03), independent of this object.

## Claude Fill Instructions

Explainability Policy is finalized (Stage 6); do not alter the `explanation` object's fields. Verify the downstream consumption contract (Coach/Expression rendering) remains compatible with this fixed shape.

# Failure Handling

For every failure: - Detection - Owner - Recovery - Fallback - Logging -
Testing

## Purpose

The single place every failure mode named elsewhere in this document is catalogued with a consistent detection/owner/recovery/fallback/logging/testing structure.

## Canonical Sources

D3_SPEC.md §12; B4_SPEC.md §22–25 (persistence retry/conflict/rollback conventions); C2_SPEC_v1.1.md (feedback/suppression conventions).

## Existing Repository Behaviour

`js/persistenceGateway.js` never throws, returns a typed `status`/`error` result (`REJECTED`/`STALE_SESSION`/`CONFLICT`/`FAILED`/`NO_OP`/`SUCCESS`); `js/engineRegistry.js` catches a thrown engine `run()` and normalizes it to `{status:'FAILED', error:{code:'ENGINE_THROWN',...}}` rather than propagating; Habit/Pattern Engines apply their own try/catch discipline (Architecture §15).

## Failure Catalogue

| Failure | Detection | Owner | Recovery | Fallback | Logging/Testing |
|---|---|---|---|---|---|
| Candidate discovery/Stage 6 yields zero candidates | This engine's own Stage 6 return value is empty | This engine | Per D2, "Silence is fully formed" (D2-INV-05) — an empty result is a valid, complete outcome | No recommendation delivered this cycle (AI Constitution §11.10, "Recommendation Competes Against Silence") | New test required |
| Upstream Memory Layer / Context Assembly unavailable or incomplete | Per D3 §12.3, graceful degradation | Memory Layer (not this engine) | Proceed with available context categories | Never fabricate missing context | Precedent: existing engines' `getHistoryData()` failure handling (Architecture §15) |
| Composite Engine/Orchestrator itself fails | `js/engineRegistry.js`'s existing `ENGINE_THREW`/`DEPENDENCY_FAILED` normalization | `js/engineRegistry.js` (existing, unchanged) | Registry-level, not engine-specific | Existing registry behavior applies unmodified | `tests/engineRegistry.test.js` |
| Explanation generation fails | See Explainability | This engine (rationale generation) vs. Coach (rendering) | Per Stage 6: the candidate must not be returned if it cannot be explained truthfully | Withholding is the confirmed default per Stage 6 (Explainability Policy), consistent with AI Constitution §11.5 | New test required |
| Persistence write for this engine's output fails | `js/persistenceGateway.js`'s existing typed result | `js/persistenceGateway.js` (existing, unchanged) | Bounded retry per B4 §22 (transient only, max 3 attempts) | `durable:false` result surfaced to caller | `tests/persistenceGateway.test.js` |
| Contract violation on request/result shape (CC-02/CC-03) | Malformed `RecommendationRequest`/`RecommendationResult` shape, per CC-02/CC-03 (Stages 3–4) | This engine | N/A | N/A | New tests required (CC-02/CC-03 now fixed — Stages 3–4) |

## Required Tests

See table; several entries require new tests once their upstream Product/Architecture decision lands.

## Engineering Decision Pending

The concrete detection/retry/logging mechanism for this engine's own internal failures (D2-EF-06).

## Traceability

Cross-references Recommendation Evaluation Pipeline, Runtime Ownership, and Explainability.

## Forbidden Changes

Do not define a fallback that silently fabricates a recommendation in place of a genuine failure — a D2/D3 invariant, not merely good practice.

## Definition of Complete

Every failure mode named elsewhere in this document has one catalogued entry above; the two entries previously pending Product/Architecture decisions (Explainability, CC-02/CC-03) are now resolved per Canonical Decisions Stages 3/4/6.

## Claude Fill Instructions

Build this catalogue by walking every other section's Failure Modes subsection — do not invent failure modes not already implied elsewhere.

# Performance Requirements

Define measurable runtime requirements supported by repository evidence.

## Purpose

States the quantitative runtime bar this engine must meet, grounded in the existing runtime's actual measured behavior.

## Canonical Sources

Architecture §2/§3 (Cloud Function limits), §11 (sequential engine execution trade-off), §14 (per-engine `getHistoryData()` risk).

## Existing Repository Behaviour

No numeric runtime performance envelope exists in canonical documentation. The only quantitative constraints found relate to the `anthropicProxy` Cloud Function (512MiB memory / 60s timeout / ≤2000 `max_tokens` / per-user daily quotas: 50 photo, 300 text), not to engine runtime cost. Architecture §11: Engine Registry execution is sequential, not concurrent — a deliberate correctness-over-latency trade-off — meaning adding this engine to the existing sequence adds its own duration to the cumulative sum of all engine durations for a given trigger.

## Repository Evidence Required

No baseline measurement of the current four-engine sequential execution time exists.

## Validation Rules

Any performance requirement must be expressed as a testable number relative to a captured baseline.

## Constraints

Per Out of Scope ("No speculative optimization"), this task must not introduce caching/batching to compensate for the existing, separately-tracked `getHistoryData()` per-engine condition (Architecture §14) as a side effect of adding this engine.

## Repository Gaps

No baseline measurement exists; no performance requirement can be stated as a specific number.

## Traceability

Consistent with Runtime Placement.

## Forbidden Changes

Do not set a performance target unsupported by a measured baseline.

## Definition of Complete

Not complete — no baseline measurement exists yet.

## Claude Fill Instructions

Capture the baseline measurement first (of the existing four-engine sequential execution); only then express a requirement relative to it.

------------------------------------------------------------------------

# Test Strategy

## Unit Tests

Recommendation creation, ranking, lifecycle, suppression, feedback,
memory, authority, persistence, error handling.

## Contract Tests

Every canonical contract.

## Integration Tests

Coach, Runtime, Memory, Persistence, Feedback, Suppression, Events,
Authority, StateAccess, Composition Root.

## Regression Tests

Protect existing behavior.

## Failure Tests

Invalid requests, missing memory, suppression, persistence failures,
runtime failures, authority failures.

### Purpose

Maps every functional area, contract, and integration named earlier in this document to a concrete category of required test coverage.

### Canonical Sources

Engineering Workflow §14 ("Tests passed" is a Definition-of-Done gate).

### Existing Repository Behaviour

72 test files exist under `tests/`, run via `node --test tests/<file>.test.js` (no npm script; no root `package.json`). Directly relevant existing conventions: `tests/engineRegistry.test.js`, `tests/runtimeState.test.js` (runtime/registry); `tests/persistenceGateway.test.js` (persistence); `tests/feedbackDomain.test.js` (feedback + suppression, same file); `tests/typedMemoryServerWrite.test.js` (memory write path); `tests/authorityContract.test.js` (authority); `tests/coachClient.test.js`, `coachPresenter.test.js`, `coachProfile.test.js`, `coachPromptComposer.test.js` (coach); `tests/habitEngine.test.js`, `patternEngine.test.js` (engine signal producers). Most recent full-suite count per Changelog: 1082/1082 passing at C4 closure.

### Repository Evidence Required

Documented above. Engineering Workflow defines no formal unit/integration/contract/regression taxonomy; the categories in this Test Strategy section are this specification's own organizing scheme.

### Validation Rules

Contract Tests must cover all twelve CCs, including CC-02/CC-03 (shapes resolved per Canonical Decisions Stage 3/4). Failure Tests must cover every entry in the Failure Handling catalogue.

### Repository Gaps

None remaining — five engine-specific test files now exist (`tests/recommendationCategories.test.js`, `tests/recommendationEngine.test.js`, `tests/memoryLayer.test.js`, `tests/internalPipelineOrchestrator.test.js`, `tests/coachDecisionSystemWiring.test.js`; 62 tests total), alongside the unmodified 1082 pre-existing tests (1144/1144 passing at closure).

### Traceability

Unit Tests ↔ Functional Scope; Contract Tests ↔ Canonical Contracts; Integration Tests ↔ Integration Map (eleven systems, matching exactly); Failure Tests ↔ Failure Handling; Regression Tests ↔ Repository Baseline (72 existing files / 1082 passing tests).

### Forbidden Changes

Do not reduce test coverage below what is implied by the functional/contract/integration lists above without Product/Architecture sign-off.

### Definition of Complete

Every item in each of the five test categories has at least one corresponding test case planned; CC-02/CC-03-dependent tests are no longer deferred — their contract shapes are resolved (Stages 3–4) and tests may be planned against them.

### Claude Fill Instructions

Do not write implementation-specific test code in this document. Follow the existing suite's `node --test` convention when tests are authored.

------------------------------------------------------------------------

# Acceptance Criteria

## Functional

-   `RecommendationEngine.generate(RecommendationRequest)` returns a well-formed `RecommendationResult` for a valid request, and an empty (but well-formed, frozen) `RecommendationResult` for any invalid/malformed request, without throwing — verified: `tests/recommendationEngine.test.js` #1–8.
-   Determinism: identical `{opportunity, pipelineContext}` input yields an identical candidate set across repeated calls — verified: `tests/recommendationEngine.test.js` #9.
-   Every produced candidate's `category` is one of the four canonical values — verified: `tests/recommendationEngine.test.js` #10.
-   A candidate whose Decision Truth (`rationale`/`evidenceBasis`/`expectedValue`/`uncertainty`) is incomplete is withheld, never fabricated — verified: `tests/recommendationEngine.test.js` #11–12c.
-   No internal ranking, priority score, tie-breaking, or winner selection is performed anywhere in the engine — verified: `tests/recommendationEngine.test.js` #13–15, `tests/coachDecisionSystemWiring.test.js` #17.
-   Suppression (C2, D1-RP-05) is consulted and honored before a candidate is returned — verified: `tests/recommendationEngine.test.js` #19–20.

## Runtime

-   Exactly one Composite Engine (`id: 'coachDecisionSystem'`) is registered with the existing B2 Engine Registry; a second registration attempt is rejected as `DUPLICATE_ID` — verified: `tests/coachDecisionSystemWiring.test.js` #1–3.
-   The Composite Engine is invocable end-to-end through the real `EngineRegistry.run()`, and its result is normalized per the existing registry contract (including `ENGINE_THREW` on a thrown error) — verified: `tests/coachDecisionSystemWiring.test.js` #4–5.
-   The Memory Layer performs real Context Assembly (StateAccess + B5 Derived Intelligence Consumer) and degrades gracefully, per-category, without fabricating missing context, when either dependency is unavailable — verified: `tests/memoryLayer.test.js` #1–6, `tests/internalPipelineOrchestrator.test.js` #3a.
-   A Memory Layer/Orchestrator internal failure is normalized to a `FAILED` engine result, never propagated as an uncaught exception — verified: `tests/internalPipelineOrchestrator.test.js` #3b.

## Architecture

-   No second Engine Registry, second orchestration authority, or second session mechanism is introduced (D3 Invariant AI-01, AI-05) — verified: `tests/coachDecisionSystemWiring.test.js` #18, and by inspection (no `.register(` call outside `registerCoachDecisionSystem.js`, no new session-generation logic anywhere in the new modules).
-   `EngineRegistry`, `StateAccess`, and `PersistenceGateway`'s existing public contracts are unmodified — only their already-established extension points are used (a new `PERMISSIONS` entry keyed by a new `engineId`/`action` pair; a new `PRODUCTION_ENABLED_MAPPING` entry activating an already-approved, already-tested B5 consumer/policy pair) — verified: `tests/coachDecisionSystemWiring.test.js` #6–9, and the diffs to `js/stateAccess.js` / `js/derivedIntelligenceConsumer.js` themselves.
-   No write to `PersistenceGateway` and no direct read of `js/memory.js`/`coachEvents[]` exists in any new module (no speculative persistence; Memory Layer only) — verified: `tests/coachDecisionSystemWiring.test.js` #14–15.

## Product

-   The canonical Product Objective (Stage 1) is unaltered by the implementation; the engine generates candidates only, never a final decision — structurally guaranteed by CC-03's `RecommendationResult` shape (no winner/ranked-list field exists) and verified above under Functional.
-   Only the four canonical Recommendation Categories (Stage 2) are ever produced — verified: `tests/recommendationEngine.test.js` #10, `tests/recommendationCategories.test.js` #2.

## Documentation

-   This specification's Status/Implementation Status, Acceptance Criteria, READY/DONE Definitions, and Closure Record are updated to reflect the completed implementation (this closure).
-   `docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md` are updated per the existing per-task convention (see Documentation Updates Required, below).

All objectively verifiable — each bullet above cites the exact test(s) that verify it, or the exact diff that structurally guarantees it.

### Purpose

The final, checkable gate for each dimension of the task.

### Canonical Sources

Mirrors the Review Checklists later in this document.

### Validation Rules

-   **Functional**: implementation exists; every criterion above cites the specific test(s) that verify it.
-   **Runtime**: implementation exists; every criterion above cites the specific test(s) that verify it.
-   **Architecture**: implementation exists; every criterion above cites the specific test(s) or diff that verifies it.
-   **Product**: the canonical Product Objective (Stage 1) is verified structurally by CC-03's fixed shape, not re-derived here.
-   **Documentation**: verified by the state of this specification and of `Roadmap.md`/`Changelog.md` as of this closure.

### Repository Gaps

None remaining for this section — implementation exists and every criterion above is verified against it (Implementation Status: COMPLETE).

### Product Decision Pending (Resolved)

Product Objectives (Stage 1), Recommendation Categories (Stage 2), CC-02 (Stage 3), CC-03 (Stage 4), Ranking Policy (Stage 5), and Explainability Policy (Stage 6) are all resolved per the Canonical Decisions (Head of Product + AI Architect), and are now verified against the completed implementation above.

### Architecture Decision Pending

None remaining — the Composite Engine/Orchestrator shell question is resolved by CD-03/CD-04 (TASK-004 built it, per Runtime/Architecture above).

### Traceability

Every criterion above cites the section/test it verifies.

### Forbidden Changes

Do not add an acceptance criterion that tests something outside this document's Scope.

### Definition of Complete

Complete — every criterion in Functional/Runtime/Architecture/Product/Documentation above is populated and cites its verifying test or diff.

### Claude Fill Instructions

This section is now closed. Do not add a criterion that tests something outside Scope; do not remove a criterion without a new Product/Architecture decision.

------------------------------------------------------------------------

# READY Definition

Repository analyzed. Contracts documented. Dependencies documented. No
unresolved ambiguity.

## Purpose

The gate this document must pass before Engineering may begin implementation.

## Canonical Sources

Engineering Workflow §4/§14.

## Current State

-   **"Repository analyzed"**: satisfied — Repository Baseline is fully populated with verified, cited evidence.
-   **"Contracts documented"**: satisfied — all twelve contracts (CC-01–CC-12) are documented and cited to their owning specs; CC-02 and CC-03 are resolved per Canonical Decisions Stage 3/4.
-   **"Dependencies documented"**: satisfied — Relationship to Previous Work is fully populated; the Composite Engine shell question is resolved per CD-03/CD-04 (TASK-004 builds it).
-   **"No unresolved ambiguity"**: satisfied for READY. CC-02, CC-03, Recommendation Categories, Ranking Policy, Explainability Policy, and Product Objectives are now resolved per the Canonical Decisions (Stages 1–6, Head of Product + AI Architect). The remaining Canonical Conflicts (Roadmap-status, repository-hooks, Coach Knowledge Base precedence) are explicitly identified, documented, assigned to their proper authority, and intentionally carried forward. They are tracked work items rather than unresolved ambiguities and therefore do not block the READY state.

## Approval

Approved for Canonical READY by Head of Product + AI Architect via the Final Canonical Gate Review. At the time of that approval, the items listed under Current State (Product Decision Pending, Architecture Decision Pending, and the Canonical Conflicts) remained individually open, carried forward for resolution as implementation reached them; that determination did not itself resolve them. Since then, CC-02, CC-03, Recommendation Categories, Ranking Policy, Explainability Policy, and Product Objectives have been resolved by Canonical Decisions Stages 1–6 (Head of Product + AI Architect) and integrated into this specification during Canonical Consolidation. The Roadmap-status, repository-hooks, and Coach Knowledge Base precedence Canonical Conflicts remain open (none were found to block implementation — see Relationship to Previous Work / Canonical Conflicts). Implementation has since been completed and approved by Head of Product + AI Architect (TASK-004 Canonical Closure) — see DONE Definition and Closure Record below.

## Repository Gaps

See Current State above for the complete list of items carried forward, unresolved by the READY approval.

## Traceability

References every other section transitively.

## Forbidden Changes

Do not mark Status as READY unilaterally; that determination is recorded above as a Product/Architecture act, not an engineering one. Do not treat this approval as resolving any Product Decision Pending, Architecture Decision Pending, or Canonical Conflict item.

## Definition of Complete

All four conditions are satisfied for the purpose of this READY determination, per Approval above; the individually-tracked open items under Current State remain open and unresolved.

## Claude Fill Instructions

Do not alter the Approval record above without a new Product/Architecture decision. Do not reopen or resolve the items it carries forward.

# DONE Definition

Implementation complete. Tests pass. Docs updated. Roadmap updated.
Changelog updated. Approvals complete. Task closed.

## Purpose

The gate that closes this task after implementation.

## Current State

-   **Implementation complete**: yes — `js/coachDecisionSystem/` (`recommendationCategories.js`, `recommendationEngine.js`, `memoryLayer.js`, `internalPipelineOrchestrator.js`, `registerCoachDecisionSystem.js`), wired into `js/app.js`/`index.html`/`sw.js`, plus additive extensions to `js/stateAccess.js` and `js/derivedIntelligenceConsumer.js`.
-   **Tests pass**: yes — 62 new tests (unit/contract/integration/failure, across `tests/recommendationCategories.test.js`, `tests/recommendationEngine.test.js`, `tests/memoryLayer.test.js`, `tests/internalPipelineOrchestrator.test.js`, `tests/coachDecisionSystemWiring.test.js`), plus the full existing suite (1082 pre-existing tests, unchanged) — 1144/1144 passing, 0 failures, at closure.
-   **Docs updated**: yes — this specification (Status, Acceptance Criteria, READY/DONE Definitions, Documentation Updates Required, Closure Record), `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md` reviewed (see Documentation Updates Required for the disposition of each).
-   **Roadmap updated**: yes — TASK-004 status line reflects implementation complete.
-   **Changelog updated**: yes — a new per-task entry added, per the existing convention.
-   **Approvals complete**: implementation approved by Head of Product + AI Architect via the TASK-004 Canonical Closure directive; Product Review Checklist and Architecture Review Checklist statuses updated accordingly (see those sections above).
-   **Task closed**: yes, per this Closure Record.

## Repository Gaps

None blocking closure. The Roadmap-status, repository-hooks, and Coach Knowledge Base precedence Canonical Conflicts remain open (unresolved by this closure, per Forbidden Changes elsewhere in this document) but were confirmed, before and during implementation, not to block it.

## Forbidden Changes

Do not mark DONE without every criterion in Test Strategy and Acceptance Criteria independently verified — satisfied above.

## Definition of Complete

Satisfied — every item under Current State above is true and evidenced.

## Claude Fill Instructions

This section is now closed at actual task closure, per Approvals in Current State above.

------------------------------------------------------------------------

# Documentation Updates Required

Evaluate updates for: - Roadmap - Changelog - Architecture - Engineering
Workflow - Product Bible - AI Constitution - Coach Bible - Knowledge
Base - Related specifications

## Current Assessment

-   **Roadmap**: Updated — TASK-004 status line now reflects implementation complete (`docs/roadmap/Roadmap.md`).
-   **Changelog**: Updated — a new per-task entry added (`docs/roadmap/Changelog.md`), per the existing convention.
-   **Architecture**: Reviewed — `FITME_ARCHITECTURE_v1.md` §20's layered-runtime description already documents the Coach Decision System / Composite Engine placement at the architecture-decision level (D3 §17, cited there); no further edit was needed to describe this implementation, which builds exactly what §20/D3 §17 already specify. Reviewed and intentionally left unchanged.
-   **Engineering Workflow**: Reviewed — no update needed; this closure follows its existing lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed) without modification. Reviewed and intentionally left unchanged.
-   **Product Bible**: Reviewed — the four Recommendation Categories (Stage 2) were approved as a Canonical Decision directly in this specification; no Product Bible edit was directed as part of this closure. Reviewed and intentionally left unchanged; remains a candidate for a future, separately-scoped Product Bible update, not decided here.
-   **AI Constitution**: Reviewed — Ch.11 already comprehensively governs recommendation behavior; no update needed. Reviewed and intentionally left unchanged.
-   **Coach Bible**: Reviewed — Ch.2/Ch.4's existing rules already govern explanation/tone, unmodified by this implementation (the engine never performs final voice/tone rendering). Reviewed and intentionally left unchanged.
-   **Coach Knowledge Base**: Reviewed — Topics 27, 29, 33, 34 remain not incorporated into this specification; this is carried forward as a Repository Gap, not resolved by this closure (no Product/Architecture decision was given to incorporate them). Reviewed and intentionally left unchanged.
-   **Related specifications (D1/D2/D3)**: Reviewed — D1/D2/D3 remain canonical, decision/architecture-only documents; none requires a content edit to describe TASK-004's completed implementation, since none claims to implement it. Reviewed and intentionally left unchanged.

## Repository Gaps

Coach Knowledge Base Topics 27, 29, 33, 34 remain not incorporated into this specification; carried forward as a tracked, non-blocking gap (see Repository Gaps under DONE Definition).

## Forbidden Changes

Do not update governance documents' content directly as part of this task without Product/Architecture approval — this section only identifies that an update may be needed.

## Definition of Complete

All nine categories assessed above, each with an explicit updated/reviewed-unchanged disposition.

## Claude Fill Instructions

This section is now closed at task closure.

------------------------------------------------------------------------

# Engineering Constraints

Engineering SHALL NOT: - introduce speculative behavior - change
ownership - change runtime order - change authority - reinterpret
previous specifications

## Purpose

A restatement of Canonical Authority's boundary, scoped to engineering conduct during implementation.

## Application

These prohibitions apply throughout specification authoring and implementation. Every documented decision in this specification cites an approved source rather than introducing new behavior; every conflict is escalated rather than resolved by redefinition.

## Traceability

Restates Canonical Authority and Global Forbidden Changes.

## Forbidden Changes

This section is itself a Forbidden Changes list; it may not be weakened.

## Claude Fill Instructions

Re-check consistency with Canonical Authority and Global Forbidden Changes whenever either is edited.

------------------------------------------------------------------------

# Engineering Self Review

See `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md` § Engineering Self-Review Requirements for the general verification criteria applied here.

## Result

-   **All sections complete**: Yes, for closure purposes — CC-02, CC-03, Recommendation Categories, Ranking Policy, Explainability Policy, and Product Objectives are resolved per Canonical Decisions Stages 1–6 (Head of Product + AI Architect); implementation is complete and Acceptance Criteria are populated and verified against it. Open items remaining: the Roadmap-status and repository-hooks Canonical Conflicts, and Coach Knowledge Base Topics 27/29/33/34 (see Documentation Updates Required) — none of these were found to block implementation or closure, and none is resolved by this closure; they remain individually tracked. The Composite Engine shell question is resolved per CD-03/CD-04; the Pipeline-definition Canonical Conflict is resolved per CD-01.
-   **No placeholders**: Satisfied — every subsection contains real cited content or an explicit Repository Gap / Product Decision Pending / Architecture Decision Pending / Engineering Decision Pending marker.
-   **No speculation**: Satisfied — every factual claim cites repository evidence or canonical documentation; the Roadmap-status and repository-hooks Canonical Conflicts remain documented without resolution; the Pipeline-definition Canonical Conflict is resolved per CD-01, cited rather than re-argued.
-   **Contracts consistent**: Satisfied for all twelve contracts, CC-01–CC-12; CC-02/CC-03 resolved per Canonical Decisions Stage 3/4 and verified consistent with CC-01, CC-04–CC-12 elsewhere in this document.

# Product Review Checklist

Verify: - Product intent - Philosophy - Scope - Governance consistency

## Status

Performed and approved — Head of Product + AI Architect, via the TASK-004 Canonical Closure directive ("TASK-004 implementation has been approved") — Engineering did not self-certify this checklist; approval was communicated directly, not derived by Engineering. The Roadmap-status Canonical Conflict and Coach Knowledge Base Topics 27/29/33/34 remain individually open and are not resolved by this approval (see Documentation Updates Required).

## Claude Fill Instructions

This checklist is now closed. Engineering did not self-certify it.

# Architecture Review Checklist

Verify: - Runtime - Ownership - Composition Root - State ownership -
Persistence - Memory - Event model - Recommendation isolation

## Status

Performed and approved — Head of Product + AI Architect, via the TASK-004 Canonical Closure directive. "Recommendation isolation" is confirmed by the completed implementation: the Recommendation Engine owns no independently-registered engine slot (`tests/coachDecisionSystemWiring.test.js` #1–3) and no system in Integration Map (`tests/coachDecisionSystemWiring.test.js` #6, #14–16). The repository-hooks Canonical Conflict remains individually open and is not resolved by this approval.

## Claude Fill Instructions

This checklist is now closed. Engineering did not self-certify it.

# Engineering Handoff

Deliver: - Completed specification - Repository evidence - Open
questions - Gaps - Implementation sequence - Impact assessment

## Status

Assembled and delivered — the completed specification (this document), repository evidence, open questions, gaps, and impact assessment were delivered as two Engineering reports during implementation (Work Packages 1–6) and closure; the implementation sequence followed was: Recommendation Categories → Recommendation Engine core → Memory Layer + StateAccess/Derived Intelligence Consumer wiring → Internal Pipeline Orchestrator + Composite Engine registration → tests → full-suite verification → this closure.

## Claude Fill Instructions

This handoff is complete.

------------------------------------------------------------------------

# Closure Record

To complete after implementation: - Dates - Repository Version - Commit
Hash - Approvals - Documentation updates - Final Status - Lessons
Learned - Follow-up Work Items

## Status

Written at actual task closure, per Approvals below.

-   **Dates**: Implementation and closure performed 2026-07-29.
-   **Repository Version**: `APP_VERSION = '2.41.0'` (`js/app.js`), unchanged by this task — no runtime behavior visible to existing engines changed; a version bump is left to a future task/release act rather than performed speculatively here.
-   **Commit Hash**: the single commit introducing this implementation and this Closure Record (this file cannot self-reference its own resulting hash; see `git log -1 -- docs/specs/TASK_004_SPEC_v1.0.md` after this commit, or the closure report delivered alongside it).
-   **Approvals**: Head of Product + AI Architect, via the TASK-004 Canonical Closure directive ("TASK-004 implementation has been approved"); see Product Review Checklist / Architecture Review Checklist above.
-   **Documentation updates**: this specification (Status, Acceptance Criteria, READY/DONE Definitions, Documentation Updates Required, Engineering Self Review, both Review Checklists, Engineering Handoff, this Closure Record); `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`. `docs/architecture/FITME_ARCHITECTURE_v1.md`, Engineering Workflow, Product Bible, AI Constitution, Coach Bible, Coach Knowledge Base, and D1/D2/D3 were reviewed and intentionally left unchanged (see Documentation Updates Required for the disposition of each).
-   **Final Status**: DONE.
-   **Lessons Learned**: (1) An uncommitted working-tree edit to this specification, resolving six previously `Product Decision Pending` items, was found and flagged before implementation began rather than assumed authoritative; the user confirmed it was a legitimate record of already-taken Canonical Decisions. (2) `EligibleOpportunity`'s content fields (`proposedAction`, `explanation`) were deliberately scoped as required, externally-supplied inputs rather than engine-generated content, since no canonical source defines concrete recommendation-content-generation rules and inventing one would be new coaching philosophy (Out of Scope) — this kept Stage 6 to validation/categorization/structural-assembly, its actual D2/D3-assigned responsibility. (3) A version bump was attempted, then reverted, after discovering it would require editing ~17 unrelated test files that hardcode the current version literal — a reminder to check ripple effects before a version bump, not just the two canonical version constants.
-   **Follow-up Work Items** (tracked, not decided or scheduled here; none expand TASK-004's own scope):
    -   TASK-005 (Initiative Engine) / TASK-006 (Decision Engine) remain the path to a live, non-empty candidate flow — Stage 3 (Decision-Window detection) and Stage 4/5 (Evidence/Eligibility Evaluation) are not built by TASK-004 (see Repository Gaps under DONE Definition, and the implementation report delivered during Work Packages 1–6).
    -   The engineering-authored Opportunity-Source → Category / Hierarchy-Tier mapping (`js/coachDecisionSystem/recommendationCategories.js`) is provisional pending Product review.
    -   The Roadmap-status, repository-hooks, and Coach Knowledge Base precedence Canonical Conflicts remain open, per Head of Product + AI Architect / AI Architect's respective ownership.
    -   Coach Knowledge Base Topics 27, 29, 33, 34 remain not incorporated into this specification.

## Claude Fill Instructions

This section is now closed.

# End of Specification

------------------------------------------------------------------------

# Global Forbidden Changes

The following apply to the entire specification:

-   Do not redefine D1 authority.
-   Do not redefine D2 runtime orchestration.
-   Do not redefine D3 runtime ownership.
-   Do not redefine B4 persistence ownership.
-   Do not redefine C2 feedback/suppression behaviour.
-   Do not redefine C3 event model.
-   Do not redefine C4 typed memory ownership.
-   Do not introduce new architectural layers without canonical
    approval.
-   Do not introduce speculative repository behaviour.

## Application

D1–D3, B4, C2–C4 are cited, not redefined, throughout this specification. The Pipeline stage-list Canonical Conflict is resolved per CD-01 (Head of Product + AI Architect), not by engineering redefinition. TASK-004 implements the Composite Engine architecture already approved by D3 §17, per CD-03/CD-04 — no new architectural layer beyond what D3 §17 already specifies is introduced; the Composite Engine/Orchestrator is now built (`js/coachDecisionSystem/`), and was never an open ownership question. No speculative repository behaviour is asserted — every "Existing Repository Behaviour" subsection is evidence-backed or marked Repository Gap.

## Claude Fill Instructions

Treat as immutable.

------------------------------------------------------------------------

# Specification Authoring Reference

This specification's authoring, evidencing, review, and completion requirements are governed by `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md`, the single source of truth for how FITME task specifications are structured, evidenced, classified, cross-checked, and brought to READY/DONE. That standard's rules are not repeated here.
