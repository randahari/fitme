# TASK_006_SPEC_v1.0

## Coach Decision Engine

**Document Type:** Canonical Task Specification
**Work Item:** TASK-006 — Coach Decision Engine
**Prepared By:** Head of Product + AI Architect (skeleton); Claude Code acting as Lead Engineer (expansion)
**Expansion Owner:** Claude Code, Lead Engineer only
**Skeleton Source:** `docs/specs/TASK_006_SPEC_SKELETON.md`
**Repository Baseline Commit:** `a5aa1c9edd5372fa85d7127072dee6ebeb9fab5c` (2026-08-02, `feat(task-005): implement and close Initiative Engine (Composite Engine)`), branch `main`, `APP_VERSION = '2.41.0'` (`js/app.js:2`)

---

# 1. Status

**Specification Version:** v1.0 (first canonical expansion of the approved skeleton)

**Lifecycle State:** **DONE / CLOSED**

**Closure Update (2026-08-03):** the paragraph and bullet list immediately below describe this document's status as authored, at the **SPEC** stage, and are preserved unchanged as the historical record of that stage. Since then, TASK-006 has completed Engineering Readiness Review, Implementation, an External Implementation Review (one blocker identified — an inverted D1-PR-06(a) Evidence Hierarchy comparator in `prioritization.js` — corrected and independently re-verified, APPROVED), Product Approval, and Architecture Approval, and is now **DONE / CLOSED** per the Engineering Workflow's Standard Task Lifecycle below. See Section 47 (Closure Record) for the full closure record.

Per the Engineering Workflow's Standard Task Lifecycle (`docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §4, reproduced identically in the Spec Authoring Standard's Applicability section): `Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed`. This document is the **SPEC** stage output. At the SPEC stage, it had not yet undergone Engineering Review, had not been marked READY, and no Implementation had occurred (all now complete — see the Closure Update above and Section 47).

This document explicitly is NOT yet:
- Canonical Review complete (Product/Architecture review has not occurred)
- Engineering Review complete
- READY
- In Implementation
- Implemented
- DONE / CLOSED

Per the Spec Authoring Standard ("READY Requirements"): *"Marking a specification READY is a Product/Architecture determination made after their review. A specification does not mark itself READY."* Per the same document's "DONE Requirements": *"DONE is evaluated once, at actual task closure, not populated speculatively during specification authoring."* Accordingly, Sections 41–42 (READY/DONE Definitions) below state conditions, not verdicts, and Section 47 (Closure Record) is left reserved and empty.

**Engineering Fill (this version).** Engineering Blocker 1, identified during Engineering Readiness Review, is resolved in this version by completing — not altering — Canonical Decision CD-T006-02's already-approved field list with the concrete representation and derivation contract Section 34.2 always required but never specified (Section 14.12). This is an Engineering Fill, not a new Canonical Decision: it introduces no numeric threshold, no scoring formula, and no new Product or Architecture policy; it defines only how each already-approved field is populated from data that already exists, and an honestly-labeled, non-fabricated placeholder where no such data yet exists — consistent with D1 Unit 11's own CDR-4, which reserves exactly this kind of gap to the Task-SPEC/Engineering layer ("A future engine requiring a new threshold not already set must raise it as a new CDR at implementation time; D1 does not pre-set it") without requiring D1's own text to change. No field is removed, no ranking rule is altered, and CD-T006-01 through CD-T006-09 remain exactly as previously applied.

**Canonical Decisions Applied (Correction Pass, prior version).** Nine canonical decisions, issued by Head of Product + AI Architect, are applied throughout this document: **CD-T006-01** (Stage 5 Eligibility input contract, Section 15.11); **CD-T006-02** (Stage 7 arbitration metadata — hierarchy tier, evidence tier, trust impact, timing quality, triggering evidence time, problem magnitude, recommendation impact tier where applicable, Section 14.3); **CD-T006-03** (Initiative-kind Candidates carry no impact tier; cross-kind ties proceed to problem magnitude then D1-PR-06, Section 17.2 — resolves the former P-1); **CD-T006-04** (the shared attention/trust budget is per-Decision-Pass only — one shared pool, one Terminal Decision, non-winners resolve to Silence; no daily/weekly quota, no new persistent budget state, Section 18 — resolves the former E-1); **CD-T006-05** (the Safety Layer is not implemented by TASK-006; only the Safety Integration Port/contract is defined; a deterministic test double is permitted in tests; production SHALL NOT bypass or fake Safety, Section 21.8); **CD-T006-06** (the Terminal Decision contract carries exactly four canonical decision families — Recommendation, Initiative, Silence, Boundary; Boundary carries `boundaryType: REFUSAL | ESCALATION`; Safety Layer dispositions map deterministically — defer → Silence, block → Boundary/Refusal, escalate → Boundary/Escalation, modify → the original kind with a modification record, Section 25); **CD-T006-07** (`js/coachDecisionSystem/recommendationCategories.js`'s existing `SOURCE_HIERARCHY_TIER_MAP` is approved as the TASK-006 v1.0 canonical Hierarchy-tier baseline, Section 10.2, 17.1, 38 item G-8); **CD-T006-08** (Test Strategy — Section 35 — is a required READY precondition; passing implementation and regression tests are a required DONE precondition, Sections 41–42); **CD-T006-09** (this document invents no Stage 3/Stage 4 behavior; it defines only the Decision Engine's input boundary and integration contract with those Stages, and preserves every ownership boundary already fixed by D2/D3, Section 9.2). These decisions are recorded once here for traceability and applied, without restatement of their own history, at each section they govern.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Status | TASK-004, TASK-005, Spec Authoring Standard, Engineering Workflow |

---

# 2. Purpose

TASK-006 exists to give the Coach Decision System — the single Composite Engine approved by D3 §17 and already realized to three of its six internal collaborators by TASK-004 (Memory Layer, Recommendation Engine) and TASK-005 (Initiative Engine) — its **Decision Engine** internal collaborator: the component that holds orchestration authority for **Stage 5 (Eligibility Evaluation)**, **Stage 7 (Prioritization)**, **Stage 8 (Winner Selection)**, and **Stage 9 (Decision Formation)** of the D2 13-Stage Canonical Pipeline (`docs/specs/D2_SPEC_v1.0.md`, Unit 07, Decision Engine subsection), and that produces exactly one Terminal Decision for each Decision Pass in which Stage 9 is entered (D2 Unit 02, Canonical Decision 1; D2 Unit 03 Acceptance Criteria).

The Decision Engine is the exclusive owner of:
- **Stage 5 — Eligibility Evaluation** orchestration, applying D1 Unit 06's Intervention Eligibility gate to each Opportunity as a whole, before any Candidate is generated for it (D2 Unit 04, Stage 5; D2 Unit 06, Canonical Decision 2 — Eligibility Evaluation is a Pipeline Gate, not a Decision Lifecycle state);
- **Stage 7 — Prioritization**, ranking every Candidate produced by any Opportunity this cycle, jointly, applying D1 Unit 07 in full (D2 Unit 04, Stage 7);
- **Stage 8 — Winner Selection**, selecting exactly one winning Candidate by default, or the narrow permitted tied set under D1-PR-05's exception, subject to Safety Layer disqualification (D2 Unit 04, Stage 8);
- **Stage 9 — Decision Formation**, assembling the Decision Pass's single, fully-formed Terminal Decision (D1 Unit 15; D2 Unit 04, Stage 9), subject to the Safety Layer's final, non-bypassable evaluation (D1-AB-05);
- production of **exactly one Terminal Decision for each entered Decision Pass** — never zero where at least one Opportunity was detected and Decision Formation is entered, and never more than one under any circumstance, including the narrow multi-option exception (D2 Unit 02, Canonical Decision 1 and Canonical Decision 7).

The Decision Engine does **not** generate Candidate content (that remains the Recommendation Engine's and Initiative Engine's exclusive Stage-6 authority, D2 Unit 07); does **not** own Safety authority (that remains the Safety Layer's exclusive authority at all three of its checkpoints, D1-AB-05, D2 Unit 07); does **not** perform Expression (that remains Stage 10, D1-CDO-03, D3 §8.6); does **not** select delivery platforms (that remains the Coach Runtime's exclusive authority, D3 §10.4, Decision 5/6); and does **not** own durable memory writes (that remains the Memory Layer's exclusive authority, D3 §11.1).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Purpose | D1, D2, D3, TASK-004, TASK-005, Repository |

---

# 3. Canonical Authority

## 3.1 Governing Documents Inspected

| Document | Version / Status | Role for TASK-006 |
|---|---|---|
| `docs/product/Product_Bible.md.docx` | v1.0 | Names "Decision Engine" as a Roadmap backlog item; defers coaching-doctrine detail to the Coach Bible |
| `docs/constitution/FITME_AI_Constitution_v1.0.md` | v1.0 | Ch.11 (Recommendation Intelligence, §11.6 hierarchy, §11.7 biggest-problem-first, §11.9 budget, §11.10 Silence, §11.15 narrow multi-option exception) and Ch.23 (AI Safety Constitution, non-bypassable Safety Layer) are the primary product-philosophy sources this document's Stage 5/7/8/9 rules operationalize |
| `docs/governance/FITME_Coach_Bible.md` | Ch.1 approved (per Product Bible §13) | Canonical coaching doctrine; Ch.2 (Canonical Decision Hierarchy, decision-vs-delivery separation), Ch.1 §46 and Ch.3 §11 (Silence doctrine) |
| `docs/governance/FITME_Coach_Knowledge_Base.md` | Living research document | Non-governing per Engineering Workflow §3; cited only where consistent with Coach Bible/Constitution |
| `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` | v1.0 | Secondary/contextual source, same unresolved-precedence status recorded by TASK-005 (Section 3.3 there; restated at Section 38 G-1 here) |
| `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md` | v1.0, "Draft Canonical" | Governs this document's structure, evidence classification, and unresolved-item taxonomy |
| `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` | Draft v1.0 | Governs task lifecycle, roles, and Definition of Done |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | Updated through §22 (TASK-005) | Architectural placement of the Coach Decision System and its six collaborators |
| `docs/specs/D1_SPEC_v1.0.md` | v1.0 | Units 02 (Authority Hierarchy/Canonical Decision Hierarchy), 06 (Intervention Eligibility), 07 (Prioritization), 10 (Silence), 11 (Evidence), 14 (Authority Boundaries), 15 (Canonical Decision Output) — the direct product-policy content Stages 5/7/8/9 apply |
| `docs/specs/D2_SPEC_v1.0.md` | v1.0 | 13-Stage Canonical Pipeline, Stage Contracts (Unit 04, Stages 5/7/8/9 specifically), Decision Lifecycle (Unit 06), Engine Responsibilities (Unit 07, Decision Engine subsection), Exceptional Flows (Unit 08), Traceability (Unit 09) |
| `docs/specs/D3_SPEC.md` | v1.2, approved (§17 decisions) | Composite Engine architecture, Decision Layer (§8.3), component contracts (§11.2), forbidden responsibilities (§11.3), graceful degradation (§12), native compatibility (§5.5, §14) |
| `docs/specs/TASK_004_SPEC_v1.0.md` | v1.0, DONE/CLOSED | Existing Composite Engine, Recommendation Engine, Memory Layer, Candidate contract pattern (CC-02/CC-03), test structure |
| `docs/specs/TASK_005_SPEC_v1.0.md` | v1.0, DONE/CLOSED | Initiative Engine, Initiative-kind Candidate contract, Memory Layer Pipeline Context extension (CD-T005-01), Follow-up items G-2 through G-5 directly bearing on Stage 5/7/8 routing questions this document must inherit rather than re-litigate |
| `docs/roadmap/Roadmap.md` | Last updated 2026-08-02 | TASK-006 status: "⏳ PENDING"; confirms TASK-004/TASK-005 are the current closed baseline |
| `docs/roadmap/Changelog.md` | Last updated 2026-08-02 | TASK-005 implementation detail; confirms Decision Engine as the fourth of six D3 §17 collaborators, unbuilt |
| `docs/tasks/B1/B1_SPEC.md`, `B2/B2_SPEC.md`, `B3/B3_SPEC.md`, `B4/B4_SPEC.md`, `B5/B5_SPEC_v1.0.md` | all CLOSED | Engine Registry/Contract (B2), State Access (B3), Persistence Gateway (B4), Derived Intelligence Consumer including the disabled `DECISION_ENGINE` consumer id (B5) |
| `docs/specs/C1_SPEC_v1.0.md`, `C2_SPEC_v1.1.md`, `C3_SPEC_v1.0.md`, `C4_SPEC_v1.0.md` | all CLOSED | Modularization map (C1), rejection/suppression feedback (C2), event model (C3), typed-memory server write path (C4) |

## 3.2 Precedence

Per Engineering Workflow §3 ("Source of Truth"), the governing precedence order is: **1. AI Constitution → 2. Product Bible → 3. Coach Bible → 4. Architecture → 5. Engineering Workflow → 6. Task SPEC → 7. Roadmap → 8. Changelog.** The Coach Knowledge Base is explicitly excluded from this ordering. This specification does not create a new authority hierarchy; it applies the existing one, unchanged from TASK-004's and TASK-005's own statement of it.

## 3.3 Observation on `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`

As recorded identically by TASK-005 (its Section 3.3): this document is not listed in Engineering Workflow §3's Source of Truth ordering, yet the approved skeleton directs its inspection. No content conflict was found between it and the Coach Bible/Constitution chain during this document's research. Its precedence relative to the Coach Bible remains recorded as **Repository Gap** (Section 38, item G-1, inherited from TASK-005's own G-1, not re-litigated) rather than **Canonical Conflict**.

## 3.4 True Conflicts Recorded

Genuine conflicts (evidence contradicting evidence) discovered during this document's research are recorded in Section 38 using the three-element format the Spec Authoring Standard requires for a Canonical Conflict. No conflict is analyzed or resolved in this section or elsewhere in this document.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 3.1 Governing Documents Inspected | D1, D2, D3, TASK-004, TASK-005, Constitution, Coach Bible, Product Bible, B1–B5, C1–C4, Spec Authoring Standard, Engineering Workflow, Roadmap, Changelog |
| 3.2 Precedence | Constitution, Coach Bible, Coach Knowledge Base, Product Bible, Engineering Workflow, Roadmap, Changelog |
| 3.3 Observation on `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` | Constitution, Coach Bible, Engineering Workflow, TASK-005 |
| 3.4 True Conflicts Recorded | Spec Authoring Standard |

---

# 4. Ownership and Decision Boundaries

Per the Spec Authoring Standard ("Authority and Decision Boundaries"), four distinct kinds of contribution exist, and this entire document is authored inside that boundary:

- **Head of Product decisions** — product intent, philosophy, scope, coaching content, and any behavior-level decision. Already fixed for TASK-006 by D1 Units 02, 06, 07, 10, 14, 15 (already-approved canonical product policy, not reopened here) and by the Product Bible's backlog placement.
- **AI Architect decisions** — architecture, runtime placement, ownership, and system-integration decisions. Already fixed for TASK-006 by D2 (pipeline/stage ownership, Unit 07's Decision Engine subsection), D3 §8.3/§11 (Decision Layer placement, contracts, forbidden responsibilities), and TASK-004/TASK-005 (existing Composite Engine shape, three of six collaborators already built).
- **Lead Engineer responsibilities** (this document's author) — filling implementation detail, gathering repository evidence, writing tests, and reporting gaps or conflicts, strictly inside the boundaries Product and Architecture have already set. Claude may document repository facts, implementation constraints, technical options (candidate file paths, candidate test names), and engineering risks. Claude may **not** invent or change Product policy (e.g., numeric priority thresholds), AI/coach behavior, canonical architecture (the six-collaborator Composite Engine shape), authority boundaries (e.g., who owns Safety disqualification), Decision kinds, prioritization rules, or task scope.
- **Repository evidence** — facts about the current state of the codebase, classified per the Standard's Evidence Classification scheme (verified repository evidence / canonical-document evidence / engineering inference / missing repository evidence). Every factual claim in this document is labeled, implicitly by citation form, as one of these four; unlabeled prose is canonical-document paraphrase with an inline citation.

Where this document must record something Product or Architecture has not yet decided, it uses the exact classification the Standard defines (Section 38), not an invented category, and it does not attempt to resolve the gap itself.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Ownership and Decision Boundaries | D1, D2, D3, TASK-004, TASK-005, Product Bible, Spec Authoring Standard |

---

# 5. Relationship to Previous Work

## 5.1 D1 — Intervention Eligibility, Prioritization, Recommendation Policy, Initiative Policy, Silence Policy, Evidence Requirements, Authority Boundaries, Canonical Decision Output

D1 Unit 06 (Intervention Eligibility, D1-IE-01 through D1-IE-05) is the direct product-policy specification Stage 5 implements. D1 Unit 07 (Prioritization, D1-PR-01 through D1-PR-06) is the direct product-policy specification Stage 7 implements. D1 Unit 08 (Recommendation Policy) and D1 Unit 09 (Initiative Policy) govern Candidate *content*, produced upstream at Stage 6 by the Recommendation Engine and Initiative Engine respectively — TASK-006 consumes, and does not re-derive, either. D1 Unit 10 (Silence Policy, D1-SP-01 through D1-SP-06) governs when the Decision Pass resolves to Silence — a Decision Engine Stage-9 output. D1 Unit 11 (Evidence Requirements) governs the confidence/Evidence-Hierarchy validation Stage 7 performs on already-attached Candidate fields (D2-PP-05), not fresh evidence evaluation (that remains Stage 4, upstream and outside this task's scope, per Section 9). D1 Unit 14 (Authority Boundaries, D1-AB-01 through D1-AB-06) fixes the non-bypassable Safety evaluation Stage 8/9 must integrate with. D1 Unit 15 (Canonical Decision Output, D1-CDO-01 through D1-CDO-04) fixes what Stage 9's Terminal Decision must establish. TASK-006 does not reopen any of these approved Units; it implements them.

## 5.2 D2 — Stages 5, 7, 8, and 9; Engine Responsibilities; Decision Lifecycle; Exceptional Flows; Traceability

D2 fixes the 13-Stage Canonical Pipeline and assigns the Decision Engine explicit orchestration authority for Stage 5 (Eligibility Evaluation), Stage 7 (Prioritization), Stage 8 (Winner Selection), and Stage 9 (Decision Formation) (Unit 07, Decision Engine subsection, quoted in full at Section 12 below). It fixes the Decision Lifecycle's nine states (Unit 06) and the specific rule that a Candidate cannot exist unless its Opportunity has cleared the Stage 5 gate (D2-DL-01). It fixes the Exceptional Flows (Unit 08) governing No Opportunity, No Evidence, No Eligible Candidate, Multiple Winners (the narrow multi-option exception, Canonical Decision 7), Pipeline Abort, User Correction (Canonical Decision 4/6), Missing Context, and Recovery Rules — all of which the Decision Engine must correctly implement or correctly defer to, per Section 31. It fixes Pipeline Traceability (Unit 09) requirements the Decision Engine's own output must satisfy.

## 5.3 D3 — Composite Engine Architecture, Decision Layer, Component Contracts, Ownership Rules, Forbidden Responsibilities, Graceful Degradation, Native Compatibility

D3 §17 (Decision 1) fixes the Coach Decision System as a single B2-registered Composite Engine with six internal, non-independently-registered collaborators: Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, Expression, sequenced by an Internal Pipeline Orchestrator that itself has no decision-content authority. §8.3 defines the Decision Layer (quoted in full at Section 12). §6.4 (Responsibility Matrix) and §11.2 (Component Contracts) fix what the Decision Engine consumes (Candidates from the Recommendation and Initiative Layers; disqualification/modify-defer-block results from the Safety Layer), produces (a Terminal Decision, to Expression), and is forbidden to touch (Candidate content generation, durable state). §11.1 and §11.3 consolidate the architecture-level forbidden-responsibility list — most critically, that only the Decision Engine may produce a Terminal Decision, and that no component may bypass the Safety Layer at any of its three checkpoints. §12 fixes graceful-degradation requirements; §5.5 and §14 fix native-compatibility/Pure-Domain-shape expectations, naming the Decision Engine explicitly in both.

## 5.4 TASK-004 — Composite Engine, Pipeline Orchestration, Shared Contracts, Recommendation Engine Integration, Candidate Production, Tests, and Extension Points

TASK-004 (DONE/CLOSED, commit `f2c734d`) built the first two of the six D3 §17 collaborators: a minimal, read-only Memory Layer (`js/coachDecisionSystem/memoryLayer.js`) and the Recommendation Engine (`recommendationEngine.js`, `recommendationCategories.js`), registered as a single Composite Engine (`registerCoachDecisionSystem.js`, engine id `'coachDecisionSystem'`) via an Internal Pipeline Orchestrator (`internalPipelineOrchestrator.js`). TASK-004 established the shared Candidate contract pattern (CC-02/CC-03: `RecommendationRequest { opportunity, pipelineContext }` → `RecommendationResult { candidates: RecommendationCandidate[] }`, each candidate carrying `kind, category, action, rationale, confidence, hierarchyTier, opportunityProvenance`) that TASK-005 reused structurally for `InitiativeCandidate`, and that this document's Terminal Decision contract (Section 25) and Candidate Pool Assembly (Section 16) build on as the direct structural precedent. TASK-004's own Closure Record names TASK-005/TASK-006 as "the path to a live, non-empty candidate flow" and states Stage 5's Decision-Engine ownership explicitly as not TASK-004's own scope.

## 5.5 TASK-005 — Initiative Engine, Initiative-kind Candidate Production, Stage 3 Participation, Shared Candidate Contracts, No-Candidate Behavior, Tests, and Integration into the Composite Engine

TASK-005 (DONE/CLOSED, commit `a5aa1c9`) built the third collaborator, the Initiative Engine (`js/coachDecisionSystem/initiativeEngine.js`), contributing to Stage 3 (confirmed-pattern anticipation, disruption/milestone detection) and owning Stage 6 for Initiative-kind Candidates, applying D1 Unit 09 in full including Relationship-Maturity gating. It extended the Memory Layer (Canonical Decision CD-T005-01) to assemble Relationship Maturity signal (reported `UNKNOWN`, no approved source), Life Event Context and Capacity State (both reported `UNAVAILABLE`, no repository source), and Habit/Pattern state (via a second B5 read). It fixed `InitiativeCandidate`'s contract (no `category` field, Canonical Decision CD-T005-02) as structurally parallel to, but not identical with, `RecommendationCandidate` — both share `kind, action, rationale, confidence, hierarchyTier, opportunityProvenance` but only `RecommendationCandidate` carries `category`. It extended `internalPipelineOrchestrator.js` with `runForInitiativeOpportunity`/`detectInitiativeOpportunities`, parallel to the existing `runForOpportunity`. It left five Follow-up items (G-2 through G-5, A-2, Section 36 of TASK-005) directly relevant to this document's own scope, most importantly **G-5** — whether Initiative-kind Candidates receive a nested impact-tier scheme analogous to D1-PR-02's Recommendation-specific one at Stage 7 — which TASK-005 explicitly deferred to "Product/Architecture, at or before TASK-006's specification" (TASK-005 Section 36, G-5). This document inherits, and does not itself resolve, that deferral (Section 17, Section 38).

## 5.6 B1–B5 and C1–C4 — Consumed Contracts and Infrastructure, Where Directly Used

TASK-006 consumes, or is directly constrained by, the following approved infrastructure:
- **B2** (Engine Registry/Contract) — the `run(context)`/`EngineRunResult` shape any Decision Engine wiring must respect; no second registration.
- **B3** (State Access) — `js/stateAccess.js`'s `EngineStateAccess` capability and closed permission matrix; the Memory Layer's existing `coachDecisionSystem.DECISION_PASS` entry (`js/stateAccess.js:403-408`) remains the only current permission-matrix entry for the Composite Engine. The Decision Engine, like the Recommendation and Initiative Engines before it, has no StateAccess capability of its own (D3 §8.1, §11.1).
- **B5** (Derived Intelligence Consumer) — names `DECISION_ENGINE` as a reserved-but-fully-disabled consumer id (`js/derivedIntelligenceConsumer.js:32`), distinct from `RECOMMENDATION_ENGINE`/`INITIATIVE_ENGINE`, both now enabled. Whether the Decision Engine requires any Derived Intelligence consumption of its own (as opposed to reading only what the Memory Layer already assembles into Pipeline Context) is addressed at Section 14.
- **C2** (Rejection/Suppression Feedback) — `js/feedback/feedbackDomain.js`'s `evaluateSuppression()`, already consumed by the Recommendation Engine, explicitly scoped by C2 itself to the Trigger and Adaptive TDEE surfaces only, not the Decision Engine.
- **C3** (Event Model) — the closed `feedback`-kind event schema in `users/{uid}.coachEvents[]`; no second event kind exists or may be introduced without a future SPEC revision.
- **C4** (Typed Memory Server Write Path) — `functions/typedMemoryServerWrite.js`, restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, every write forced to `status: 'candidate'`. The Decision Engine has no persistence authority of its own (Section 29); any Coaching History write remains the Memory Layer's exclusive function (D3 §10.1 Decision 4).

B1 and B4 are cited only for their binding, engine-agnostic rules (B1 §10: no LLM may directly create authoritative canonical memory; B4's persistence-operation catalog contains no Decision-Engine-related operation).

## 5.7 No Reopening of Closed Decisions

No content in this document reopens a decision closed by D1, D2, D3, TASK-004, or TASK-005. Where repository evidence appears to narrow or complicate a closed decision, or where a TASK-005 Follow-up (G-2 through G-5, A-2) directly bears on this document's own scope, it is recorded as evidence and cross-referenced (Section 38), not treated as license to alter the closed decision.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 5.1 D1 | D1 |
| 5.2 D2 | D1, D2 |
| 5.3 D3 | D3, B2 |
| 5.4 TASK-004 | D3, TASK-004, TASK-006, Repository |
| 5.5 TASK-005 | D1, D3, TASK-004, TASK-005, Repository |
| 5.6 B1–B5, C1–C4 | B1, B2, B3, B4, B5, C1, C2, C3, C4, Repository |
| 5.7 No Reopening of Closed Decisions | D1, D2, D3, TASK-004, TASK-005 |

---

# 6. Problem Statement

After TASK-004 and TASK-005, the Coach Decision System exists as a registered Composite Engine with a working Memory Layer (Pipeline Context assembly, with graceful degradation), a working Recommendation Engine (deterministic, validated `RecommendationCandidate` generation from an `EligibleOpportunity`), and a working Initiative Engine (deterministic, validated `InitiativeCandidate` generation, Relationship-Maturity-gated). It **cannot yet** produce any Terminal Decision, because Stage 5 (Eligibility Evaluation), Stage 7 (Prioritization), Stage 8 (Winner Selection), and Stage 9 (Decision Formation) are not built. The current `internalPipelineOrchestrator.js`'s `run()` method assembles a real Pipeline Context and then returns `candidates: []` unconditionally, because no `EligibleOpportunity` object is ever constructed — Stage 3 (Opportunity Detection) and Stage 4/5 (Evidence/Eligibility Evaluation) are not wired into a live end-to-end flow. `runForOpportunity()` and `runForInitiativeOpportunity()` exist and are wired directly to `RecommendationEngine.generate()`/`InitiativeEngine.generate()` respectively, exposing Stage 6 directly for a real `EligibleOpportunity`, but nothing today ranks, arbitrates, or selects between the Recommendation-kind and Initiative-kind Candidates those two engines are each independently capable of producing, and nothing forms a Terminal Decision from either.

Specifically, before TASK-006, the system **cannot**:
- evaluate intervention eligibility where D2 assigns that orchestration responsibility to the Decision Engine (Stage 5) — no component currently applies D1 Unit 06's gate at the Opportunity level;
- arbitrate all surviving Candidates jointly — Recommendation-kind and Initiative-kind Candidates, even if both existed for the same cycle, have no shared pool, no joint ranking, and no shared budget enforcement (D1-PR-04) applied across them;
- apply the canonical hierarchy and prioritization rules (D1 Unit 07) to rank Candidates against each other;
- select one winner, or the narrow permitted tied set, from a ranked pool (Stage 8);
- form one complete Terminal Decision (D1 Unit 15; D2 Unit 04, Stage 9) — the system has never produced this object;
- resolve the Decision Pass to Silence, or to a refusal/escalation, when required (D1 Unit 10, D1 Unit 14).

Candidate generation is not equivalent to decision-making: a Candidate is "a not-yet-selected... decision object... competing for selection at Winner Selection" (D2 Shared Vocabulary) — it carries no guarantee of being acted on, ranked correctly against a competing Candidate from the other engine, or surviving Safety disqualification. D3 §8.3 states the architectural reason arbitration must remain centralized: D1 Unit 07's Canonical Decision Hierarchy and D2's requirement that exactly one Terminal Decision be produced per Decision Pass "require a single component with the authority to evaluate eligibility, rank, select a winner, and form the decision — mirroring... the same 'exactly one orchestration authority' principle B2 already established for engine orchestration generally." Without this single component, two independently correct Candidate producers (the Recommendation Engine and the Initiative Engine) would have no way to jointly resolve which one, if either, the user actually sees — and D1's own determinism guarantee (D1 Unit 01) is void without it (D2 Unit 00, Design Philosophy).

TASK-006 closes this specific, scoped gap — it does not rebuild Stage 3 (Opportunity Detection, already partially contributed to by the Recommendation and Initiative Engines), does not perform Stage 4 (Evidence Evaluation, which D2 names no single owner for and which this document does not silently absorb, per Section 9), does not perform Stage 6 (Candidate Generation, exclusively the Recommendation/Initiative Engines'), and does not build the Safety Layer, Memory Layer's durable-write path, or Expression.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Problem Statement | D1, D2, D3, TASK-004, TASK-005 |

---

# 7. Product Objectives

Grounded in Coach Bible Ch.1–2, Constitution Ch.11, and D1 Units 02, 06, 07, 10:

- **Better decision quality rather than greater message volume.** Constitution §11.10: "A recommendation competes against Silence, not against nothing." D1's ultimate success criterion (D1 Unit 01): the decision policy "is evaluated by whether it moves users toward durable, independent capability — not by engagement, session count, or notification volume."
- **Deterministic arbitration across Recommendation and Initiative Candidates.** D2 Unit 00 (Design Philosophy): "Consistency across independently-built engines requires agreement on sequence, not only on content" — the Decision Engine is D2's closing of that gap.
- **Prioritization according to the Canonical Decision Hierarchy.** D1-PR-01: "Candidates SHALL be ranked first by which tier of the Canonical Decision Hierarchy (Unit 02) they serve."
- **Biggest-problem-first behavior within the permitted hierarchy.** D1-PR-03: "The coach SHALL address the largest meaningful problem before a smaller one."
- **Deliberate Silence when no justified action survives.** D1-SP-01: "Silence SHALL be treated as a first-class, deliberately reasoned decision outcome — never an absence of a decision, and never a failure state."
- **Single-winner simplicity by default.** D1-PR-05: "the coach SHALL surface exactly one recommendation rather than a menu."
- **Narrow multi-option behavior only when canonically permitted.** D1-PR-05's stated exception, Constitution §11.15, operationalized as Canonical Decision 7 (D2 Unit 08, D2-EF-05): a tied set is always assembled into exactly one Terminal Decision carrying multiple user-selectable options, never multiple Terminal Decisions.
- **Trust, autonomy, honesty, and explainability.** D1-AH-01/02 (Trust tier of the Hierarchy; the five permanent commitments); D1-ER-05/06 (honest confidence communication, no manufactured certainty); D2 Unit 09 (Pipeline Traceability).
- **Safe refusal, deferral, modification, or escalation when required.** D1-AB-03 (refusal is permitted and protective); D1-AB-05 (non-bypassable Safety evaluation with authority to modify, defer, or block).

This section does not define UX wording, notification design, engagement targets, or delivery-channel behavior — those belong to Expression (D3 §8.6), the Coach Runtime (D3 §10.4), and future UX/Design System work (TASK-007/008), none of which TASK-006 implements.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Product Objectives | D1, D2, Constitution, Coach Bible |

---

# 8. Non-Goals

| Excluded Responsibility | Owner Instead | Canonical Basis |
|---|---|---|
| Recommendation Candidate generation | Recommendation Engine (TASK-004) | D2 Unit 07; D1 Unit 08 |
| Initiative Candidate generation | Initiative Engine (TASK-005) | D2 Unit 07; D1 Unit 09 |
| Invention of new Candidate kinds | N/A — only Recommendation-kind and Initiative-kind exist | D2 Shared Vocabulary; D1 Unit 15 (four Canonical Decision kinds only) |
| Final Safety ownership | Safety Layer | D1-AB-05; D3 §11.1 ("Only the Safety Layer may disqualify a Candidate or modify/defer/block a Terminal Decision") |
| Message wording or Expression | Expression, Stage 10 | D1-CDO-03; D2 Unit 04 Stage 10; D3 §8.6 |
| Platform-specific delivery | Coach Runtime | D3 §10.4 (Decision 5, Decision 6) |
| Notification scheduling | Coach Runtime | D3 §10.4; §11.3 |
| UI and UX implementation | Coach Runtime / future TASK-007 | D3 §4.1 |
| Durable memory ownership | Memory Layer | D3 §8.1, §11.1 |
| Pipeline Context ownership | Memory Layer (Decision 3) | D3 §6.3, §7.2, §8.1, §11.1 |
| Redesign of the Composite Engine | N/A | D3 §17; this document does not alter D2's 13-Stage Pipeline |
| Redesign of the canonical D2 pipeline | N/A | D2 Unit 03; Governing Principle |
| Independent Engine Registry registration | N/A — Decision Engine is an internal collaborator of the single `coachDecisionSystem` registration | D3 §17 Decision 1; §11.1, §11.3; AI-01 |
| New trigger types | N/A | D3 §7.1 Decision 2; reuses the existing B2 Trigger Catalog unchanged |
| TASK-007 UX System responsibilities | Future UX System | Product Bible backlog position 7 |
| TASK-008 Design System responsibilities | Future Design System | Product Bible backlog position 8 |
| Unrelated remediation of legacy systems | N/A | Out of Scope; no unrelated refactoring |

Additionally excluded, per D2 Unit 07's Forbidden Responsibilities for the Decision Engine specifically: **Candidate content generation of any kind** and **letting Product Engagement (Hierarchy Tier 10) influence any ranking the Decision Engine performs** (D1-AH-03) — these are behavioral non-goals, not component-boundary non-goals, and are enforced inside the Decision Engine's own logic (Sections 17, 20, 22), not delegated elsewhere.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Non-Goals | D1, D2, D3, TASK-004, TASK-005, TASK-007, TASK-008, Product Bible |

---

# 9. Functional Scope

## 9.1 Required Now

- **Stage 5 ownership (Eligibility Evaluation).** Per D2 Unit 07: "Holds orchestration authority for Eligibility Evaluation (Stage 5)... applying D1 Units 02, 06, 07, and 15." This is a Pipeline Gate (D2 Unit 06, Canonical Decision 2), applied per-Opportunity, before any Candidate is generated for it.
- **Collection of the full Candidate set across all Opportunities in one Decision Pass.** D2-PP-06 (cardinality/pooling rule): "Candidates from every Opportunity that generates them are pooled at Prioritization." This is a Decision Engine-owned assembly step preceding Stage 7 proper (Section 16).
- **Stage 7 ownership (Prioritization).** D1 Unit 07 in full: primary Hierarchy-tier ranking (D1-PR-01), nested recommendation impact tiers (D1-PR-02), biggest-problem-first (D1-PR-03), shared recommendation/initiative budget (D1-PR-04), single-winner default (D1-PR-05), canonical tie-break order (D1-PR-06).
- **Stage 8 ownership (Winner Selection).** Exactly one winning Candidate by default (D1-PR-05); the narrow permitted tied set only where ranking genuinely cannot produce one clear winner (Constitution §11.15, Canonical Decision 7); Safety Layer disqualification integration ahead of final selection (D1-RP-07, D1-AB-05).
- **Stage 9 ownership (Decision Formation).** Assembly of the Decision Pass's single, fully-formed Terminal Decision (D1 Unit 15) — from a winning Candidate, a tied set, or a Decision-Pass-level Silence determination — subject to the Safety Layer's final, non-bypassable evaluation (D1-AB-05).
- **Decision-Pass-level Silence.** Where no Opportunity this cycle produces a surviving Candidate, Decision Formation still runs, once, to produce a fully-formed Silence Terminal Decision (D2-INV-05, D1-CDO-01).
- **Refusal/escalation formation.** Where the Safety Layer's final review modifies, defers, or blocks the winning Candidate, Decision Formation reforms the Terminal Decision as a refusal/escalation instead of its original kind (D1 Unit 14; D2 Unit 04 Stage 9).
- **Traceability and explainability** per D2 Unit 09 (Section 26).
- **Deterministic no-candidate and all-disqualified behavior** (D2-EF-04, D2-EF-05, and the "all Candidates disqualified" path at Stage 8's Exit Criteria).

## 9.2 Explicitly Not Owned by the Decision Engine (Deferred / Owned Elsewhere)

- **Stage 4 Evidence Evaluation.** D2 Unit 04 names no single orchestration-authority owner for Stage 4 (unlike Stages 5/7/8/9, each of which explicitly states "Orchestration authority: Decision Engine"). This document does not silently absorb Stage 4 into the Decision Engine's own scope — per the skeleton's own explicit instruction (§9: "Do not silently absorb Stage 4 Evidence Evaluation... into" this task). Recorded as **Repository Gap** (Section 38, item G-2) — no canonical source assigns Stage 4's orchestration authority to any named engine.
- **Stage 6 Candidate Generation.** Exclusively the Recommendation Engine's (Recommendation-kind) and Initiative Engine's (Initiative-kind) orchestration authority (D2 Unit 07); the Decision Engine consumes, never generates, Candidate content (D2 Unit 07, Decision Engine Forbidden Responsibilities: "SHALL NOT generate Candidate content itself").
- **Stage 10 Expression.** D1-CDO-03; D3 §8.6. Explicitly not one of D2 Unit 07's engines with decision content authority in the sense Expression requires; the Decision Engine hands a fully-formed Terminal Decision to Expression and has no further role.
- **Any Memory Layer responsibility.** Pipeline Context Assembly (Stages 1–2) and the Post-Decision Continuation (Stages 11–13) remain the Memory Layer's exclusive responsibility (D3 §17 Decision 3). The Decision Engine reads Pipeline Context as delivered; it does not assemble it, and it does not perform Feedback Processing, Evidence Update, or Memory Update.
- **Safety determination of any kind.** The Safety Layer's three functions — mandatory Opportunity injection, Candidate disqualification, and final modify/defer/block review — remain exclusively the Safety Layer's (D2 Unit 07, D1-AB-05). The Decision Engine integrates with these functions at their fixed checkpoints; it does not perform, second-guess, or override them (Section 21).

## 9.3 Deferred (Out of Scope for TASK-006)

Everything listed in Section 8. The Safety Layer and Expression collaborators remain unbuilt after TASK-006, per D3 §17's six-collaborator design being realized incrementally (TASK-004: two of six; TASK-005: three of six; TASK-006: four of six).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 9.1 Required Now | D1, D2 |
| 9.2 Explicitly Not Owned by the Decision Engine | D1, D2, D3 |
| 9.3 Deferred | D3 |

---

# 10. Repository Baseline and Evidence

## 10.1 Branch and Commit Baseline (Verified Repository Evidence)

- Current branch: `main`.
- HEAD commit: `a5aa1c9edd5372fa85d7127072dee6ebeb9fab5c`, dated 2026-08-02, message `feat(task-005): implement and close Initiative Engine (Composite Engine)` — verified via `git log -1`. This is simultaneously the repository's current HEAD and TASK-005's own closure commit; no commits exist on `main` after TASK-005's closure.
- `APP_VERSION = '2.41.0'` — verified at `js/app.js:2`, unchanged since TASK-004's closure.
- No root `package.json` exists (verified; the project is a browser-script PWA plus `functions/package.json`, a Firebase Functions manifest). Tests run via `node --test tests/<file>.test.js` against CommonJS-wrapped browser scripts, no npm script.

## 10.2 Composite Engine and Internal Pipeline Orchestrator Locations (Verified Repository Evidence)

Directory `js/coachDecisionSystem/` contains exactly six files (verified via exhaustive directory listing):
- `recommendationCategories.js` (75 lines) — pure vocabulary module; exports `CATEGORIES` (4-value: `IMMEDIATE_ACTION`/`PREPARATION`/`RECOVERY`/`SYSTEM_BUILDING`), `OPPORTUNITY_SOURCES` (5-value: `DECISION_WINDOW`, `CONFIRMED_PATTERN_ANTICIPATION`, `DISRUPTION_DETECTION`, `MILESTONE_RECOVERY`, `SAFETY_HIGH_RISK`), `isValidCategory`, `isValidOpportunitySource`, `categoryForSource`, `hierarchyTierForSource`. Its `SOURCE_CATEGORY_MAP`/`SOURCE_HIERARCHY_TIER_MAP` (lines 38–55) map each Opportunity source to one of D1 Unit 02's ten Hierarchy tiers; both are marked in-code as "provisional... Repository-Gap status." **Canonical Decision CD-T006-07** approves `SOURCE_HIERARCHY_TIER_MAP` as the TASK-006 v1.0 canonical Hierarchy-tier baseline (Section 17.1, Section 38 item G-8); the in-code comment's own "provisional" wording is a documentation-update item for implementation time (Section 40), not an unresolved Product question as of this version.
- `recommendationEngine.js` (119 lines) — single export `generate(request)`, pure/deterministic, never throws. Its header (lines 8–10) states explicitly: it "never ranks... never selects Winner... never performs Tie Breaking" and reserves those to "the future Decision Engine, TASK-006."
- `initiativeEngine.js` (341 lines) — exports `generate(request)` (Stage 6), `detectOpportunities(pipelineContext)` (Stage 3 contribution), `validateCandidateShape`, `VALUE_DIMENSIONS`, `MATURITY_STAGES`. Its header (lines 14–16) states explicitly, in the original Hebrew: it "does not prioritize (Prioritization), does not select a Winner, does not perform Decision Formation — all of these belong exclusively to the future Decision Engine (TASK-006)."
- `memoryLayer.js` (166 lines) — single export `assembleContext(identity)` (async). Its header (lines 26–27) states explicitly that it "does not permit Opportunity Detection/Evidence Evaluation/Eligibility Evaluation/Candidate Generation/Prioritization/Winner Selection/Decision Formation within the Memory Layer itself."
- `internalPipelineOrchestrator.js` (97 lines) — header comment names all six D3 §17 collaborators and states the orchestrator "is not itself a seventh Engine, does not register independently, and is not a second orchestration authority." Exports `run(ctx)` (line 47, registered as the engine's B2 `run`), `runForOpportunity(pipelineContext, eligibleOpportunity)` (line 66, dispatches to `RecommendationEngine.generate`), `runForInitiativeOpportunity(pipelineContext, eligibleOpportunity)` (line 76, dispatches to `InitiativeEngine.generate`, added by TASK-005), and `detectInitiativeOpportunities(pipelineContext)` (line 84, dispatches to `InitiativeEngine.detectOpportunities`, added by TASK-005). `run()` always returns `{ status: 'SUCCESS', output: { pipelineContext, candidates: [] } }` — its own comment (lines 14–25, 58–60) states: "Stage 4/5 (Evidence/Eligibility Evaluation) are Decision-Engine-owned and not yet built... Silence is a fully-formed, valid outcome (D2-INV-05)." None of `runForOpportunity`, `runForInitiativeOpportunity`, or `detectInitiativeOpportunities` is reached from `run()` today — each is exposed directly, by design, "for future Decision Engine or tests."
- `registerCoachDecisionSystem.js` (39 lines) — registers `{ id: 'coachDecisionSystem', version: '1.0.0', triggers: ['APP_READY'], dependsOn: [], run: Orchestrator.run }` via the B2 Engine Registry. Exports `registerAll`.

`js/app.js`'s `runAppReadyEngines()` invokes the Composite Engine with the fixed action `coachDecisionSystem: 'DECISION_PASS'` in its `APP_READY` actions map (alongside the four pre-existing engines); the composition root calls `RegisterEngines.registerAll();` followed immediately by `RegisterCoachDecisionSystem.registerAll();`. `index.html` loads the six `js/coachDecisionSystem/*.js` files, in dependency order, after the four existing engines and before `js/app.js`; `sw.js` lists the same six paths in its service-worker cache manifest.

## 10.3 Recommendation Engine and Initiative Engine Integration (Verified Repository Evidence)

Both Stage-6 producer engines are fully built and tested (TASK-004, TASK-005; Section 5.4/5.5). Both expose a single `generate(request)` entry point, are pure/deterministic, and never throw. Neither exposes any ranking, selection, tie-breaking, disqualification, or decision-formation function — `tests/coachDecisionSystemWiring.test.js` test 17b explicitly asserts `InitiativeEngine.rank`, `.prioritize`, `.selectWinner`, `.formDecision`, and `.disqualify` are all `typeof undefined` today, confirming Stage 7/8/9 responsibility is entirely unclaimed territory in the current codebase.

## 10.4 Shared Opportunity, Candidate, Pipeline Context, Safety, and Decision-Related Contracts (Verified Repository Evidence)

**`EligibleOpportunity`** — no dedicated contract file exists; its shape is enforced only by each Stage-6 engine's own inline `validateRequest()`. Fields checked in code, common to both engines: `id` (non-empty string), `sourceCategory` (must pass `RecommendationCategories.isValidOpportunitySource`), `proposedAction` (non-empty string), `confidence` (number in `[0,1]`), `explanation.rationale`/`explanation.evidenceBasis`/`explanation.expectedValue` (each non-empty string), `explanation.uncertainty` (must not be empty/null/undefined). The Initiative Engine additionally requires `valueDimensions` (non-empty array drawn from `VALUE_DIMENSIONS`) and, for `sourceCategory === 'MILESTONE_RECOVERY'`, an explicit `genuine === true` flag. `detectedAt` (finite number, else `null`) is read by both engines but not validated as required. **No shared/reusable `EligibleOpportunity` validator module exists** — each engine duplicates its own `isPlainObject`/`isFiniteNumber`/`isNonEmptyString`/`isValidConfidence` helpers locally, not shared between them.

**`RecommendationCandidate`** (constructed at `recommendationEngine.js:91–110`, exactly seven fields):
```
kind: 'Recommendation'
category: <one of the 4 canonical categories>
action: <string>
rationale: { rationale, evidenceBasis, expectedValue, uncertainty }
confidence: <number>
hierarchyTier: <number, 1-10>
opportunityProvenance: { opportunityId, sourceCategory, detectedAt }
```

**`InitiativeCandidate`** (constructed at `initiativeEngine.js:239–263`; validated by the exported `validateCandidateShape()`, lines 174–192):
```
kind: 'INITIATIVE'
action: <string>
rationale: { rationale, evidenceBasis, expectedValue, uncertainty }
confidence: <number>
hierarchyTier: <number>
relationshipMaturityContext: { stage, gatingRuleApplied: 'D1-IP-02', sourceCategory }
opportunitySource: <sourceCategory>
opportunityProvenance: { opportunityId, sourceCategory, detectedAt }
validationResult: { passed: true, reason: 'Section 19 contract validated' }
immutable: true
```
`validateCandidateShape()` explicitly rejects any object carrying a `category` field (line 177) — Initiative-kind Candidates are contractually forbidden from having the Recommendation-kind `category` field, per TASK-005's Canonical Decision CD-T005-02. **The `kind` field's own literal values are not normalized between the two engines** (`'Recommendation'` vs. `'INITIATIVE'` — differing case/word-form) — recorded as **Repository Gap** (Section 38, item G-3), bearing directly on the shared pool this document must assemble at Section 16.

**Pipeline Context** — the exact frozen object returned by `memoryLayer.js`'s `assembleContext()` (lines 136–159):
```
schemaVersion: 'coach-decision-system-pipeline-context/1.0'
userId, sessionGeneration, assembledAt
derivedIntelligence
feedbackHistory
initiativeIntelligence
relationshipMaturity: { stage: 'UNKNOWN', basis: null }   // always this value today
lifeEventContext: null                                     // always null today
capacityState: null                                        // always null today
availability: { derivedIntelligence, feedbackHistory, initiativeIntelligence, habitState, patternState, relationshipMaturity: 'UNAVAILABLE', lifeEventContext: 'UNAVAILABLE', capacityState: 'UNAVAILABLE' }
```

**Safety Layer input/output contract** — no such contract exists in code (Section 10.6). **"Terminal Decision"** — confirmed absent as code anywhere in the repository; the term appears only in comments and documentation (`internalPipelineOrchestrator.js`'s own header, this document's canonical sources), never as a defined type, factory function, or object shape.

## 10.5 Validators and Normalization Logic (Verified Repository Evidence)

No file named `candidateValidator.js`, `opportunityValidator.js`, or equivalent exists. Validation logic lives inline, privately, inside each Stage-6 engine (`recommendationEngine.js`'s unexported `validateRequest()`; `initiativeEngine.js`'s unexported `validateRequest()` and exported `validateCandidateShape()`). No shared validator is reused between the two engines — a duplication this document's own Candidate Pool Assembly (Section 16) must account for without silently "fixing" it as a side effect (Out of Scope discipline, Section 37).

## 10.6 StateAccess and Memory Layer Boundaries (Verified Repository Evidence)

`js/stateAccess.js`'s permission matrix grants exactly one engineId/action pair for the Composite Engine (lines 403–406):
```js
coachDecisionSystem: {
  DECISION_PASS: {
    reads: ['recommendationFeedbackHistory'],
    writes: []
  }
}
```
`memoryLayer.js` is the sole caller of this entry (`StateAccess.createEngineAccess({engineId:'coachDecisionSystem', action:'DECISION_PASS', ...})`, calling only `.read.recommendationFeedbackHistory()`) — confirmed as the only direct `StateAccess` touchpoint anywhere in `js/coachDecisionSystem/` by `tests/coachDecisionSystemWiring.test.js` test 15b, which asserts `initiativeEngine.js` never requires `stateAccess.js` at all. `js/memory.js` (the separate, pre-existing client memory module) and `functions/typedMemoryServerWrite.js` (C4's server write path) remain untouched by any `coachDecisionSystem/` file; `memoryLayer.js`'s own header states this explicitly. No Decision-Engine-specific StateAccess capability exists.

## 10.7 Engine Registry Registration (Verified Repository Evidence)

`js/engineRegistry.js` (`REGISTRY_VERSION = '2.0.0'`) is a generic, business-logic-agnostic registry with no knowledge of `coachDecisionSystem` specifically. `js/engines/registerEngines.js` registers only the four pre-existing engines (`habitEngine`, `patternEngine`, `adaptiveTdeeEngine`, `triggerEngine`) — it does not register `coachDecisionSystem`. `registerCoachDecisionSystem.js` is the sole registration path for the Composite Engine, in the exact same pattern.

## 10.8 Runtime Wiring (Verified Repository Evidence)

Documented in full at Section 10.2. `js/app.js`'s composition root calls `RegisterEngines.registerAll();` then `RegisterCoachDecisionSystem.registerAll();`; `runAppReadyEngines()` invokes both via a single `EngineRegistry.run({trigger:'APP_READY', actions:{...}, context})` call.

## 10.9 Test Structure and Current Full-Suite Baseline (Verified Repository Evidence)

`tests/` is a flat directory (no subdirectories). Directly relevant test files, verified present: `tests/coachDecisionSystemWiring.test.js` (215 lines, 19 numbered tests covering registration, Engine Registry invocation, StateAccess boundary, DerivedIntelligenceConsumer production wiring, composition-root wiring, C2 suppression reuse, no-persistence checks, no-Coach/Expression-boundary checks — including test 17b, which asserts neither Stage-6 engine exposes any Stage-7/8/9 function today), `tests/initiativeEngine.test.js` (47 tests, TASK-005), `tests/recommendationEngine.test.js`, `tests/recommendationCategories.test.js`, `tests/memoryLayer.test.js`, `tests/internalPipelineOrchestrator.test.js` (both extended by TASK-005), and `tests/derivedIntelligenceConsumer.test.js` (extended by TASK-005).

Current test-suite baseline, per `docs/roadmap/Changelog.md`'s Current Status bullets (quoted, not independently re-run as part of this specification-authoring activity): **TASK-004 closure: 1144/1144 passing** (1082 pre-existing + 62 new). **TASK-005 closure: 1212/1212 passing** (1144 unchanged + 68 new/changed). This document treats 1212/1212 as the current full-suite baseline; it was not independently re-executed during this specification's authoring (consistent with TASK-005's own Section 10.6 disclosure of the same limitation for its own baseline).

## 10.10 Application/Version Metadata

`APP_VERSION = '2.41.0'` (`js/app.js:2`), unchanged since TASK-004's closure and through TASK-005's closure. `index.html`/`sw.js` currently list all six `js/coachDecisionSystem/` files (Section 10.2) in the load order TASK-004 established and TASK-005 preserved.

## 10.11 Decision Engine Stubs, Placeholders, Extension Points, or Confirmed Absence

**Confirmed absent**, by exhaustive directory listing and case-insensitive full-text search for `eligib|prioritiz|winnerSelection|winner|decisionFormation|terminalDecision|silence` across `js/coachDecisionSystem/`: no `eligibilityEvaluator.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `decisionEngine.js`, or similarly-named file exists anywhere in the repository. Every match against those terms inside `js/coachDecisionSystem/` is a comment naming Stage 5/7/8/9 and the Decision Engine as **future** TASK-006 responsibilities (quoted in full at Sections 10.2/10.3 above) — never a function definition, exported symbol, or placeholder implementation. The three existing Orchestrator functions exposed for direct Stage-6 invocation (`runForOpportunity`, `runForInitiativeOpportunity`, `detectInitiativeOpportunities`) are, by their own code comments, the intended integration points for this task, but they are not themselves Stage 5/7/8/9 implementations of any kind, and they are not called from `run()` today.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 10.1 Branch and Commit Baseline | TASK-005, Repository |
| 10.2 Composite Engine and Internal Pipeline Orchestrator Locations | D3, B2, Repository |
| 10.3 Recommendation Engine and Initiative Engine Integration | D1, D3, TASK-004, TASK-005, Repository |
| 10.4 Shared Contracts | D1, D3, TASK-004, TASK-005, Repository |
| 10.5 Validators and Normalization Logic | TASK-004, TASK-005, Repository |
| 10.6 StateAccess and Memory Layer Boundaries | B3, D3, TASK-004, Repository |
| 10.7 Engine Registry Registration | B2, TASK-004, Repository |
| 10.8 Runtime Wiring | TASK-004, Repository |
| 10.9 Test Structure and Current Full-Suite Baseline | TASK-004, TASK-005, Repository |
| 10.10 Application/Version Metadata | TASK-004, TASK-005, Repository |
| 10.11 Decision Engine Stubs, Placeholders, Extension Points, or Confirmed Absence | TASK-004, TASK-005, Repository |

---

# 11. Canonical Vocabulary and Domain Definitions

Terms already fixed by D1 or D2 are referenced, not redefined. Where a term's source document is ambiguous, this is stated explicitly rather than resolved by invention.

- **Opportunity** — "a candidate situation that may warrant a Recommendation, an Initiative, or a deliberate Silence decision" (D1 Shared Vocabulary; detected at Stage 3 per D2 Unit 04).
- **Eligibility** — no standalone glossary definition in D1; operationalized entirely by D1 Unit 06's Eligibility Test prose and the Stage 5 Stage Contract (D2 Unit 04) — this document's own Section 15 is the authoritative operational reading.
- **Candidate** — "a not-yet-selected Recommendation-kind (D1 Unit 08) or Initiative-kind (D1 Unit 09) decision object produced by Candidate Generation, competing for selection at Winner Selection" (D2 Shared Vocabulary).
- **Recommendation-kind Candidate** — a Candidate whose `kind` denotes Recommendation, produced only by the Recommendation Engine at Stage 6, applying D1 Unit 08 in full (D2 Unit 07; TASK-004 §CC-03).
- **Initiative-kind Candidate** — a Candidate whose `kind` denotes Initiative, produced only by the Initiative Engine at Stage 6, applying D1 Unit 09 in full (D2 Unit 07; TASK-005 §19).
- **Full Candidate set** — "every Candidate surviving Candidate Generation across every Opportunity detected this cycle, jointly" (D2 Unit 04, Stage 7 Purpose) — the complete pool this document assembles at Section 16 before Prioritization begins.
- **Ranking** — the ordered output of Prioritization (Stage 7); D2 Unit 06 Decision Lifecycle names "Ranked" as the lifecycle state Prioritization assigns.
- **Canonical Decision Hierarchy tier** — one of the ten ordered priority tiers fixed by D1 Unit 02 (Safety → Medical responsibility → Trust → Long-term adherence → Context relevance → Goal alignment → User autonomy → Behavioral effort → Nutritional/training optimization → Product engagement).
- **Recommendation impact tier** — D1-PR-02's Level 1 Critical / Level 2 High Impact / Level 3 Optimization / Level 4 Educational scheme, nested within Canonical Decision Hierarchy tiers 1–2 and 9, applying only where the underlying Candidate is Recommendation-kind (Section 17).
- **Winner** — a status Winner Selection (Stage 8) assigns to exactly one Candidate from the shared pool, or, under the narrow multi-option exception, to every Candidate in the permitted tied set — never a separate entity of its own (D2 Unit 06).
- **Permitted tied set** — the full set of Candidates carried forward from Winner Selection under D1-PR-05's narrow exception, where ranking genuinely cannot produce one clear winner (Constitution §11.15; D2 Unit 08, D2-EF-05; Canonical Decision 7).
- **Decision Pass** — Stages 1–10 of a Pipeline cycle, "the portion... that produces and delivers a Terminal Decision" (D2 Unit 03).
- **Internal Silence outcome** — a per-Opportunity outcome (Evidence Evaluation failure, Eligibility Evaluation failure, or zero Candidates from Stage 6) that terminates that Opportunity's own processing without itself invoking Decision Formation or constituting a Terminal Decision (D2 Unit 02, Canonical Decision 1).
- **Decision-Pass-level Silence** — the Decision Engine's own Stage 9 output where no Opportunity this cycle produced a surviving Candidate: a single, fully-formed Silence Terminal Decision for the Decision Pass as a whole (D2-INV-05, D2-PP-04).
- **Canonical Decision** — D1 Unit 15's term for the fully-formed decision this document's Stage 9 responsibility produces: a Recommendation, an Initiative, a deliberate Silence, or a refusal/escalation.
- **Terminal Decision** — D2's name for the same output-formation concept (Stage 9), always exactly one per Decision Pass in which Stage 9 is entered (D2 Shared Vocabulary, Canonical Decision 1). Per **Canonical Decision CD-T006-06**, every Terminal Decision this document produces carries exactly one of four canonical decision families — `RECOMMENDATION`, `INITIATIVE`, `SILENCE`, `BOUNDARY` — never a fifth (Section 25).
- **Boundary** — the single decision family realizing D1 Unit 14's "refusal or escalation" (D1 Unit 15), carrying a required `boundaryType` of `REFUSAL` or `ESCALATION` (Section 24, Section 25; Canonical Decision CD-T006-06). Not two independent Terminal Decision kinds.
- **Refusal** — a `BOUNDARY`-kind Terminal Decision with `boundaryType: 'REFUSAL'`, resulting from the Safety Layer's `BLOCKED` disposition at Stage 9 (D1-AB-03, D1 Unit 14; Section 21.5).
- **Escalation** — a `BOUNDARY`-kind Terminal Decision with `boundaryType: 'ESCALATION'`, resulting from the Safety Layer's `ESCALATED` disposition at Stage 9 under D1-AB-02's professional-referral threshold or a comparable Unit 14 determination (Section 21.5).
- **Deferral** — the Safety Layer's `DEFERRED` disposition of a Terminal Decision at Stage 9 (D1-AB-05). Per **Canonical Decision CD-T006-06**, a deferral resolves to `kind: 'SILENCE'`, not to a distinct Terminal Decision kind of its own (Section 21.5, 22.4, 24.1) — this resolves what was, before this canonical decision, an undefined mapping; D1 does not separately define "deferral" as a Stage-6 Candidate-Generation outcome (TASK-005 §18.5 records this identically), and this document does not invent a Stage-6 meaning for it.
- **Safety disqualification** — the Safety Layer's Stage-8 function: disqualifying any Candidate conflicting with a D1 Unit 02 absolute override, ahead of ranking position (D1-RP-07, D2 Unit 07 Safety Layer function (b)).
- **Rationale** — the statable reason required for every Candidate (D1-RP-02) and carried forward, unmodified in substance, into the Terminal Decision (D1 Unit 15).
- **Confidence** — "an estimate of how well-supported a belief is. Confidence is not authority" (D1 Shared Vocabulary; D1-ER-07).
- **Pipeline Context** — "the assembled working set of Decision Inputs (D1 Unit 03) and User State (D1 Unit 04)... produced once by Context Assembly and immutable for the remainder of that Decision Pass" (D2 Shared Vocabulary; D3 §17 Decision 3).
- **Delivery Intent** — the platform-neutral artifact Expression (Stage 10) produces from a Terminal Decision (D3 §8.6, Decision 5) — downstream of, and never produced by, the Decision Engine (Section 30).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Canonical Vocabulary and Domain Definitions | D1, D2, D3, Constitution, TASK-004, TASK-005 |

---

# 12. Decision Engine Mission and Positive Responsibilities

D2 Unit 07's Decision Engine subsection, quoted in full (the single authoritative statement of this engine's positive responsibilities):

> **Responsibilities.** Holds orchestration authority for Eligibility Evaluation (Stage 5), Prioritization (Stage 7), Winner Selection (Stage 8), and Decision Formation (Stage 9), coordinating across all Candidates from all engines in a given cycle, applying D1 Units 02, 06, 07, and 15.
> **Inputs.** Opportunities (for Eligibility Evaluation); the full Candidate set (for Prioritization/Winner Selection); the winning Candidate, or, under the narrow multi-option exception, the tied set (D2-EF-05), or, absent either, a Decision-Pass-level Silence determination (for Decision Formation, Canonical Decisions 1, 7).
> **Outputs.** Eligibility determinations; a ranked Candidate set; a winning Candidate or tied set; exactly one Terminal Decision — never more than one, even from a tied set (Canonical Decision 7).
> **Forbidden Responsibilities.** SHALL NOT generate Candidate content itself — reserved, within this specification's orchestration model, to the Recommendation Engine and Initiative Engine. SHALL NOT override the Safety Layer's disqualification or block/defer authority (D1-AB-05). SHALL NOT let Product Engagement influence any ranking it performs (D1-AH-03).
> **Dependencies.** Recommendation Engine; Initiative Engine; Safety Layer.

D3 §8.3 (Decision Layer) supplies the architectural rationale: "D1 Unit 07's Canonical Decision Hierarchy and D2's requirement that exactly one Terminal Decision be produced per Decision Pass require a single component with the authority to evaluate eligibility, rank, select a winner, and form the decision — mirroring, at the Coach Decision System's own internal scope, the same 'exactly one orchestration authority' principle B2 already established for engine orchestration generally." §8.3 further fixes: "**Ownership:** the Decision Engine component, an internal collaborator of that Composite Engine, subject to the Safety Layer's disqualification and final-review authority... **Runtime role:** central arbiter of the Decision Pass; the only component permitted to produce a Terminal Decision... **Interaction:** receives Candidates, never generates them."

**What the engine owns:** Stage 5 orchestration authority (per-Opportunity eligibility gating); Stage 7 orchestration authority (joint ranking of the full Candidate set); Stage 8 orchestration authority (winner or tied-set selection, subject to Safety disqualification); Stage 9 orchestration authority (Terminal Decision assembly, subject to the Safety Layer's final review).

**What it consumes:** eligible or safety-bypassed Opportunities (Stage 5 input); the full Candidate set from the Recommendation Engine and Initiative Engine (Stage 7 input); Safety Layer disqualification and modify/defer/block determinations (Stage 8/9 inputs, respectively); Pipeline Context, read-only, as delivered by the Memory Layer (Section 14).

**What it produces:** per-Opportunity eligibility determinations (Stage 5); an ordered ranking of the full Candidate set (Stage 7); a winning Candidate or the permitted tied set (Stage 8); exactly one Terminal Decision per Decision Pass in which Stage 9 is entered (Stage 9).

**How it applies D1 Units 06, 07, 10, 14, and 15:** Unit 06 (Intervention Eligibility) governs Stage 5 in full (Section 15); Unit 07 (Prioritization) governs Stage 7 in full (Section 17); Unit 10 (Silence Policy) governs the Decision-Pass-level Silence output Stage 9 may produce (Section 23); Unit 14 (Authority Boundaries) governs the non-bypassable Safety integration at Stages 8/9 (Section 21) and the refusal/escalation Terminal Decision kinds Stage 9 may produce (Section 24); Unit 15 (Canonical Decision Output) governs what every Terminal Decision Stage 9 forms must establish (Section 25).

**How it executes D2 Stages 5, 7, 8, and 9:** exactly as each Stage's own Stage Contract (D2 Unit 04) fixes — Purpose, Inputs, Outputs, Responsibilities, Forbidden Actions, Dependencies, Entry Criteria, and Exit Criteria, reproduced and applied section-by-section at Sections 15, 17, 20, and 22 below.

**How it coordinates with the Internal Pipeline Orchestrator without becoming a second orchestration authority:** the Orchestrator is "an internal execution mechanism of the Composite Engine that sequences the already-defined D2 Stages... not a seventh collaborator with decision content authority" (D3 §6.1). The Decision Engine is one of the six collaborators the Orchestrator sequences; it does not itself sequence Stages, invoke other collaborators, or hold any authority over when it runs — it is invoked, and its output is handed to the next Stage, entirely by the Orchestrator (D3 §11.1: "The Internal Pipeline Orchestrator... may only sequence D2 Stage execution across the six internal collaborators; it SHALL NOT itself generate Candidate content, rank, select a winner, form a Terminal Decision, or produce a Delivery Intent").

**How it preserves strict separation from Recommendation, Initiative, Safety, Memory, Expression, and Coach Runtime:** by owning exactly the four Stages D2 Unit 07 assigns it and no others (D2-INV-03, Stage isolation), by never generating Candidate content (reserved to the Recommendation/Initiative Engines), by never disqualifying or modifying a Candidate/Terminal Decision itself (reserved to the Safety Layer, D1-AB-05), by never assembling Pipeline Context or performing a durable write (reserved to the Memory Layer, D3 §17 Decision 3), by never translating a Terminal Decision into language (reserved to Expression, D1-CDO-03), and by never selecting a delivery platform (reserved to the Coach Runtime, D3 §10.4).

**How it guarantees one Terminal Decision when Stage 9 is entered:** D2-PP-04 (Decision-Pass-level Silence is fully formed) and D2-INV-05 together require that Decision Formation "SHALL still run, once, to produce a fully-formed... Terminal Decision for the Decision Pass" whenever one or more Opportunities were detected this cycle — whether the input is a single winning Candidate, the narrow multi-option tied set (assembled into one Terminal Decision carrying multiple user-selectable options, Canonical Decision 7), or a Decision-Pass-level Silence determination. D2-PP-06 and D2 Unit 08 (D2-EF-02) together fix the sole exception: where Opportunity Detection produces zero Opportunities, Decision Formation is never invoked at all, and no Terminal Decision is produced for that cycle.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Decision Engine Mission and Positive Responsibilities | D1, D2, D3 |

---

# 13. Explicit Forbidden Responsibilities

Consolidated, testable list — every item below is inherited from D1, D2, or D3, not invented here:

1. **No Recommendation Candidate generation.** (D2 Unit 07 Decision Engine Forbidden Responsibilities: "SHALL NOT generate Candidate content itself... reserved... to the Recommendation Engine and Initiative Engine.")
2. **No Initiative Candidate generation.** (Same source.)
3. **No rewriting Candidate content to improve ranking.** (D2-PP-05: confidence and hierarchy tier are "validated against D1's own rules, and, where still correct under D1, preserved" — not arbitrarily recomputed; D2-INV-03, Stage isolation.)
4. **No ownership of Stage 3 Opportunity Detection.** (D2 Unit 04, Stage 3: "Contributed to by the Recommendation Engine, Initiative Engine, and Safety Layer" — the Decision Engine is not named as a Stage-3 contributor.)
5. **No ownership of Stage 4 Evidence Evaluation unless a canonical source explicitly assigns a narrow orchestration responsibility.** (D2 Unit 04, Stage 4 names no orchestration-authority owner at all, unlike Stages 5/7/8/9 each of which explicitly states "Orchestration authority: Decision Engine" — Section 9.2, Section 38 item G-2.)
6. **No bypass of the Safety Layer at any checkpoint.** (D1-AB-05: "No part of the system, including any future AI agent, may bypass this evaluation"; D3 §11.3: "no component may bypass the Safety Layer at any of its three checkpoints (AI-06 does not permit an exception).")
7. **No independent Safety judgment.** (D2 Unit 07 Decision Engine Forbidden Responsibilities: "SHALL NOT override the Safety Layer's disqualification or block/defer authority (D1-AB-05).")
8. **No durable state ownership.** (D3 §11.1: "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf.")
9. **No direct persistence.** (D3 §10.3: every durable write "SHALL occur through the Persistence Gateway's closed operation catalog"; the Decision Engine has no Persistence Gateway capability of its own.)
10. **No Pipeline Context assembly.** (D3 §8.1, §11.1: "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context.")
11. **No Expression.** (D1-CDO-03: a generative/LLM layer "SHALL express a decision already reached; it SHALL NOT originate the underlying decision, its priority, or its rationale.")
12. **No message wording.** (Same source; D3 §8.6.)
13. **No Delivery Intent production.** (D3 §8.6: "Expression owns Delivery Intent production only.")
14. **No platform or UI selection.** (D3 §11.3: "no component may select or reference a delivery platform except the existing Coach Runtime.")
15. **No notification scheduling.** (D3 §10.4.)
16. **No independent Engine Registry registration.** (D3 §17 Decision 1; §11.1: "no internal collaborator... is independently registered.")
17. **No engagement- or retention-driven ranking.** (D1-AH-03: "Product engagement (Tier 10) SHALL NOT be permitted to influence a decision ahead of any other tier, under any circumstance.")
18. **No new hierarchy tiers or decision kinds.** (D1 Unit 02 fixes exactly ten tiers; D1 Unit 15 fixes exactly four Canonical Decision kinds — this document introduces neither.)
19. **No multiple Terminal Decisions from one Decision Pass.** (D2 Unit 02, Canonical Decision 1: "never more than one Terminal Decision per Decision Pass, under any circumstance"; Canonical Decision 7: the narrow multi-option exception is always assembled into exactly one Terminal Decision.)

Each prohibition above is independently testable per Section 35 (e.g., a unit test asserting the Decision Engine's public interface exposes no Candidate-content-generation function, and a wiring test asserting no second Engine Registry entry is created).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Explicit Forbidden Responsibilities | D1, D2, D3 |

---

# 14. Inputs and Upstream Contracts

## 14.1 Eligible or Safety-Bypassed Opportunities

The Decision Engine's Stage 5 input is every Opportunity that survived Stage 4 (Evidence Evaluation) this cycle — an Opportunity Detection output (Stage 3, contributed by the Recommendation Engine, Initiative Engine, and Safety Layer, per D2 Unit 03/04), that then cleared Stage 4's evidence bar. A safety/high-risk-triggered Opportunity bypasses Stage 4 and Stage 5 entirely, admitted unconditionally by the Safety Layer (D1-OD-04, D2-EF-01(a)) and proceeding directly to Stage 6; the Decision Engine's Stage 5 responsibility is therefore never invoked for such an Opportunity (Section 15).

## 14.2 Candidate Sets from Recommendation and Initiative Engines

The Decision Engine's Stage 7 input is "every Candidate surviving Candidate Generation across every Opportunity detected this cycle, jointly" (D2 Unit 04, Stage 7 Purpose) — the union of every `RecommendationCandidate` the Recommendation Engine produced and every `InitiativeCandidate` the Initiative Engine produced this cycle, across every eligible Opportunity. Per D2-PP-06: "Candidates from every Opportunity that generates them are pooled at Prioritization." Section 16 fixes how this pool is assembled.

## 14.3 Candidate Fields Required for Arbitration

**Canonical Decision CD-T006-02** fixes the complete arbitration-metadata contract every Candidate the Decision Engine consumes must carry, in addition to each engine's own existing TASK-004/TASK-005 fields:

- `kind` — Recommendation or Initiative, the sole discriminator distinguishing the two producer engines' output (D2 Shared Vocabulary).
- `hierarchyTier` — the Canonical Decision Hierarchy tier, 1–10 (D1 Unit 02/07), required on every Candidate.
- `evidenceTier` — the D1 Unit 11 Evidence Hierarchy tier (1–5) supporting the Candidate, required on every Candidate — the structured field D1-PR-06(a) ranks on.
- `trustImpact` — the expected trust impact of surfacing this Candidate, required on every Candidate — the structured field D1-PR-06(b) ranks on.
- `timingQuality` — a structured measure of how well-timed this Candidate is relative to its Opportunity, required on every Candidate — the structured field D1-PR-06(c) ranks on.
- `triggeringEvidenceTime` — the timestamp of the evidence that triggered this Candidate, required on every Candidate — the structured field D1-PR-06(d) ranks on (recency).
- `problemMagnitude` — a structured measure of the size of the problem this Candidate addresses, required on every Candidate — the structured field D1-PR-03 (biggest-problem-first) ranks on.
- `recommendationImpactTier` — the D1-PR-02 Level 1–4 impact tier (Critical/High Impact/Optimization/Educational). **Per Canonical Decision CD-T006-03, this field is populated only on `RecommendationCandidate`; `InitiativeCandidate` never carries it** (Section 17.2) — structurally parallel to `InitiativeCandidate`'s existing, TASK-005-established absence of a `category` field.
- `rationale` — D1-RP-02, the statable reason without which a Candidate would not exist at all, required on every Candidate.
- `confidence` — D1 Unit 11, required on every Candidate.
- `opportunityProvenance` — traceability (Section 26), required on every Candidate.

None of these fields is a numeric composite score — each is an independent, categorical or ordinal value consumed by exactly one step of the fixed D1-PR-01→06 sequence (Section 17), never blended together (Section 17.7). `RecommendationCandidate` additionally carries `category` (TASK-004 §CC-03); `InitiativeCandidate` additionally carries `relationshipMaturityContext`, `opportunitySource`, `validationResult`, and `immutable` (TASK-005 §19). Section 16 treats the two shapes as structurally compatible for pooling purposes on this shared arbitration-metadata set, without requiring either engine to adopt the other's engine-specific fields. Populating this arbitration-metadata set on each engine's own Candidate output is a focused, additive extension to `recommendationEngine.js`'s and `initiativeEngine.js`'s existing Stage-6 output shape (Section 34.2) — it does not move Candidate-content-generation authority, or any D1 Unit 08/09 policy application, away from either engine (Section 9.2, Section 13 items 1–2).

## 14.11 Stage 5 Eligibility Input Contract Cross-Reference

The concrete, closed-field contract governing what the Decision Engine reads to perform Stage 5 (so that eligibility is never inferred from free text or a missing field) is fixed at Section 15.11, not restated here.

## 14.4 Pipeline Context Fields the Decision Engine May Read

The Decision Engine reads Pipeline Context exclusively as delivered by the Memory Layer (Section 29); it does not originate a Decision Input read of its own (D3 §8.1, §11.1). Per the current `memoryLayer.js` shape (Section 10.4), this includes `relationshipMaturity`, `lifeEventContext`, `capacityState`, `derivedIntelligence`, `feedbackHistory`, `initiativeIntelligence`, and the `availability` map — the same immutable object every other Stage-3/6 collaborator reads, unmodified, unextended, and un-reassembled by the Decision Engine.

## 14.5 Safety Layer Inputs and Returned Determinations

At Stage 8, the Decision Engine submits the ranked Candidate pool to the Safety Layer's disqualification function, through the Safety Integration Port (Section 21.8), and receives back a disqualification determination per Candidate (D1-RP-07; D2 Unit 07, Safety Layer function (b)). At Stage 9, the Decision Engine submits the assembled (pre-final-review) Terminal Decision to the Safety Layer's final review function, through the same port, and receives back exactly one of five dispositions — `UNMODIFIED`, `MODIFIED`, `DEFERRED`, `BLOCKED`, or `ESCALATED` (D1-AB-05, D1-AB-02; D2 Unit 07, Safety Layer function (c)) — deterministically mapped to Terminal Decision content per Canonical Decision CD-T006-06 (Section 25). Neither function's internal reasoning is available to, or reviewable by, the Decision Engine — it receives only the determination (Section 21).

## 14.6 Required Versus Optional Fields

Required (no Stage 7/8/9 processing may proceed without them): `kind`, `confidence`, `hierarchyTier`, `rationale`, `opportunityProvenance`, and the full Canonical Decision CD-T006-02 arbitration-metadata set (`evidenceTier`, `trustImpact`, `timingQuality`, `triggeringEvidenceTime`, `problemMagnitude`) on every Candidate; `recommendationImpactTier` on every `RecommendationCandidate` only (Canonical Decision CD-T006-03); the eligible/ineligible determination, per the closed `OpportunityEligibilityInput` contract (Section 15.11), on every Opportunity reaching Stage 5; the disqualification determination on every Candidate reaching Stage 8; the `UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED` determination on every Terminal Decision reaching Stage 9's final review (Canonical Decision CD-T006-06). Optional: `category` (Recommendation-kind only); `relationshipMaturityContext`, `opportunitySource`, `validationResult`, `immutable` (Initiative-kind only) — these engine-specific fields inform traceability (Section 26) but are not required for arbitration itself.

## 14.7 Source and Owner of Every Field

| Field | Source | Owner |
|---|---|---|
| Eligible/safety-bypassed Opportunity | Stage 3 (Opportunity Detection) / Stage 4 (Evidence Evaluation) | Recommendation Engine, Initiative Engine, Safety Layer (Stage 3 contribution); no named owner at Stage 4 (Section 9.2) |
| Candidate set | Stage 6 (Candidate Generation) | Recommendation Engine (Recommendation-kind), Initiative Engine (Initiative-kind) |
| Pipeline Context | Stage 2 (Context Assembly) | Memory Layer exclusively (D3 §17 Decision 3) |
| Disqualification determination | Stage 8 checkpoint | Safety Layer exclusively |
| Modify/defer/block determination | Stage 9 checkpoint | Safety Layer exclusively |

## 14.8 Validation Rules

The Decision Engine must validate the shape of every Candidate it consumes before admitting it to the shared pool (Section 16) — an invalid shape is a failure condition (Section 31), not an arbitration input. Per D1-DI-02 (applied by analogy, consistent with TASK-004's `validateRequest()` and TASK-005's `validateCandidateShape()` precedent): the Decision Engine must not fabricate a value for a missing or malformed Candidate field.

## 14.9 Handling of Missing, Stale, Malformed, Duplicated, or Conflicting Inputs

- **Missing** — a Candidate missing a required field (Section 14.6) is rejected from the pool, not silently defaulted (Section 16, Section 31).
- **Stale** — a Pipeline Context from a superseded Decision Pass must not be acted on; per D2-EF-07, this is an Orchestrator-level sequencing guarantee the Decision Engine relies on rather than re-validates (consistent with TASK-005 §14.5's identical treatment).
- **Malformed** — an unparseable or shape-violating Candidate is rejected (Section 16, Section 31).
- **Duplicated** — Section 16 fixes duplicate-handling rules explicitly; the Decision Engine does not silently merge or silently drop a duplicate without a defined rule.
- **Conflicting** — where two Candidates' fields disagree in a way that would affect ranking (e.g., contradictory `hierarchyTier` claims for what is otherwise the same underlying situation), D1-ER-01's claim-type discipline governs: the higher Evidence Hierarchy tier's Candidate is treated as authoritative for the disputed dimension; a genuinely unresolved conflict does not fabricate a resolution (Section 19).

## 14.10 Native/Platform-Neutral Representation Requirements

Per D3 §5.5 and §14, the Decision Engine is named explicitly, alongside the Recommendation Engine, Initiative Engine, and Safety Layer, as naturally Pure-Domain-shaped: "none of D1's or D2's rules require a DOM, browser, or Firebase reference to evaluate." Every input it consumes (Opportunities, Candidates, Pipeline Context, Safety determinations) must be a plain, serializable data structure with no platform-specific reference, consistent with `memoryLayer.js`'s existing frozen, schema-versioned object pattern.

No input source not traceable to D1 Unit 03's eight Decision Input categories, D2's Stage Contracts, D3's component contracts, or an approved repository contract is introduced by this document.

## 14.12 Arbitration Metadata Representation and Derivation Contract (Engineering Fill)

This subsection resolves Engineering Blocker 1 by completing Canonical Decision CD-T006-02's field list (Section 14.3) with an exact, engineering-ready population rule for every arbitration-metadata field, so that Section 16.3's validation never faces an undefined field. It introduces no new Product policy, no numeric threshold, and no scoring formula — it defines only (a) which fields already have an unambiguous source in already-existing, already-approved data, and (b) a uniform, honestly-labeled placeholder for every field that does not yet have one, consistent with D1-ER-06 ("The coach SHALL NOT manufacture false certainty or false reassurance; absence of evidence is not evidence of absence") and D1-DI-04/D1-ER-04 ("the absence of expected data SHALL itself be treated as evidence, not ignored").

### 14.12.1 The `NO_SIGNAL` Sentinel

For any arbitration-metadata field for which no already-existing, already-canonical data source is currently traceable in the repository, the field's value is the literal sentinel `NO_SIGNAL` — never a fabricated number, never an inferred estimate, and never simply omitted. `NO_SIGNAL` is not a ranking value; it is a disclosure that no classification exists yet for that dimension. Its comparison semantics, applied uniformly wherever the field is used in Stage 7 (Sections 17, 19), are exactly two rules:

- **`NO_SIGNAL` never outranks a real, non-`NO_SIGNAL` value.** Where D1-PR-06 or D1-PR-02/03 compares two Candidates on a field and one carries a real value while the other carries `NO_SIGNAL`, the real value wins — consistent with D1-ER-06's prohibition on manufactured certainty producing a false win, and preserving correct behavior automatically for any future Candidate that does carry a real value, without requiring this document to be revised when one becomes available.
- **`NO_SIGNAL` versus `NO_SIGNAL` never distinguishes a tie.** Where both compared Candidates carry `NO_SIGNAL` for a given field, that field does not distinguish them, and Stage 7 proceeds to the next criterion in the fixed D1-PR-01→06 sequence (Section 17.7) — this is the exact behavior Section 19.2 already defines for "a criterion's underlying data is genuinely unavailable for both tied Candidates," extended here uniformly to every field that may carry `NO_SIGNAL`.

`NO_SIGNAL` is therefore never rejected by Section 16.3's validation (Section 16.3 is corrected accordingly, below) — a field set to `NO_SIGNAL` is present, valid, and fully specified; it simply carries no discriminating power yet.

### 14.12.2 Per-Field Derivation Status

| Field | Derivation at current repository baseline | Source |
|---|---|---|
| `hierarchyTier` | Real value. Derived via `recommendationCategories.js`'s `hierarchyTierForSource()`, applied to the Opportunity's `sourceCategory`, using the approved `SOURCE_HIERARCHY_TIER_MAP` baseline. | Canonical Decision CD-T006-07 (Section 10.2, 17.1); no change. |
| `triggeringEvidenceTime` | Real value. Direct alias of the Opportunity's existing `detectedAt` field, already present (though not currently validated as required) on both engines' Opportunity input contract (Section 10.4). If the underlying `detectedAt` is itself `null` (already a permitted value on the existing contract), this field is set to `NO_SIGNAL` rather than fabricating a timestamp. | Existing `EligibleOpportunity.detectedAt` (TASK-004 §CC-02 pattern; Section 10.4). No new field is added to `EligibleOpportunity`; this is a same-value carry-forward onto the Candidate. |
| `evidenceTier` | `NO_SIGNAL`. D2 Unit 04, Stage 4 Outputs canonically requires an Evidence Hierarchy tier to be "recorded" once Stage 4 runs, but Stage 4 is not built in the current repository (Section 9.2, item G-2) and the current `EligibleOpportunity` contract (Section 10.4) carries no field for it. This document does not add one, consistent with CD-T006-09's preservation of the Stage 3/4 ownership boundary — doing so would require extending a Stage 3/4-owned producer contract, which is outside TASK-006's own Stage 5/7/8/9 scope. Once Stage 4 (a separately-scoped future item, Section 38 item G-2) records and exposes this tier, Stage 6 carries it forward onto the Candidate by the same pass-through principle as `triggeringEvidenceTime` above — no new rule is required at that time, only the upstream field becoming available. |
| `trustImpact` | `NO_SIGNAL`. Named in D1-PR-06(b) and Constitution Ch.13's "Trust Impact Score" item, but Constitution Ch.13 itself lists it only as a factor "the system should evaluate," with no scale, formula, or classification rule anywhere in the canonical corpus (Constitution, Coach Bible, Knowledge Base, Intelligence & Relationship Philosophy, D1, D2, D3 — none defines one). D1 Unit 06's own Eligibility Test already draws on the identical Constitution Ch.13 list and resolves it as a qualitative "SHALL weigh" test, not a scored field — this document does not invent a scale D1 itself declined to invent. |
| `timingQuality` | `NO_SIGNAL`. Same basis as `trustImpact` — named in D1-PR-06(c) and Constitution Ch.13's "Timing Quality" item, with no formula anywhere in the canonical corpus. |
| `problemMagnitude` | `NO_SIGNAL`. D1-PR-03 and Constitution §11.7 state the rule only as a qualitative, illustrated principle ("the coach always solves the biggest meaningful problem first"); no numeric or categorical scale for "magnitude" exists in any canonical source. |
| `recommendationImpactTier` (Recommendation-kind only) | `NO_SIGNAL`. D1-PR-02 names four levels (Critical/High Impact/Optimization/Educational) and cross-references "the ranking already used by the existing Trigger Engine (Architecture §8)" — but the existing Trigger Engine's own priority scheme (`js/trigger/triggerDomain.js`, `PRIO: health=3 > opportunity=2 > encouragement=1`) is a three-value scheme, not a four-value one, and does not correspond 1:1 to D1-PR-02's four named levels. TASK-004's own Recommendation Categories section explicitly distinguishes the four `CATEGORIES` (`IMMEDIATE_ACTION`/`PREPARATION`/`RECOVERY`/`SYSTEM_BUILDING`) from D1-PR-02's impact/urgency tier system as two separate taxonomies ("an impact/urgency tier system... not a content-domain taxonomy") — this document does not map one onto the other, since doing so would introduce a new, unapproved relationship between two taxonomies TASK-004 deliberately kept independent. Absent a canonical or repository-verified source, this field is `NO_SIGNAL` at the current baseline, per the same principle applied to `trustImpact`/`timingQuality`/`problemMagnitude`. |

### 14.12.3 Consequence for Stage 6 Population (Cross-Reference)

Per Section 34.2, `recommendationEngine.js`'s and `initiativeEngine.js`'s additive extension populates `triggeringEvidenceTime` (real value, per 14.12.2) and sets `evidenceTier`, `trustImpact`, `timingQuality`, and, for `RecommendationCandidate` only, `recommendationImpactTier` (`InitiativeCandidate` never carries this last field, per Canonical Decision CD-T006-03) to the literal `NO_SIGNAL` sentinel. This is a fixed, mechanical, non-judgmental assignment — it requires no classification logic, no formula, and no engineering discretion beyond copying the value this document already fixes.

### 14.12.4 Future Resolution Path

Where a canonical or repository-verified source for `evidenceTier`, `trustImpact`, `timingQuality`, `problemMagnitude`, or `recommendationImpactTier` becomes available (for example, Stage 4's own future implementation recording an Evidence Hierarchy tier, or a future Product-approved impact-tier classification), Stage 6 is expected to populate the real value instead of `NO_SIGNAL` for that field, without any change to Section 14.12.1's comparison semantics or to Stage 7's ranking sequence (Section 17) — the `NO_SIGNAL` design is forward-compatible by construction. Fixing any such future source is recorded as a non-blocking Repository Gap (Section 38, item G-9), not resolved by invention in this document.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 14.1 Eligible or Safety-Bypassed Opportunities | D1, D2 |
| 14.2 Candidate Sets from Recommendation and Initiative Engines | D2 |
| 14.3 Candidate Fields Required for Arbitration | D1, D2, TASK-004, TASK-005 |
| 14.4 Pipeline Context Fields the Decision Engine May Read | D3, TASK-004, TASK-005, Repository |
| 14.5 Safety Layer Inputs and Returned Determinations | D1, D2 |
| 14.6 Required Versus Optional Fields | D1, D2, TASK-004, TASK-005 |
| 14.7 Source and Owner of Every Field | D2, D3 |
| 14.8 Validation Rules | D1, TASK-004, TASK-005 |
| 14.9 Handling of Missing, Stale, Malformed, Duplicated, or Conflicting Inputs | D1, D2, TASK-005 |
| 14.10 Native/Platform-Neutral Representation Requirements | D1, D2, D3 |
| 14.12 Arbitration Metadata Representation and Derivation Contract | D1, D2, Constitution, TASK-004, Repository |

---

# 15. Eligibility Evaluation

## 15.1 Valid Reasons from D1 Intervention Eligibility

D1-IE-01 (verbatim): "Before intervening, the coach SHALL be able to state a valid reason from this enumerated set: preventing a predictable mistake; helping before a difficult decision; celebrating meaningful progress; supporting recovery; preparing for a foreseeable challenge; requesting information that will significantly improve coaching; protecting the user's stated long-term goals (Constitution Ch.12 §12.3). Absent a valid reason, the coach SHALL NOT intervene." Stage 5 requires the Decision Engine to confirm that the Opportunity reaching it states at least one of these seven reasons, applying D2 Unit 04's own restatement: "Confirm a valid reason from D1-IE-01's enumerated set."

## 15.2 Trust Test Application

D1-IE-02: "The coach SHALL apply the Trust Test before any interruption: if it is uncertain whether the user will be glad to have been interrupted, the coach SHALL NOT intervene (Constitution Ch.13 §13.4)." This is applied at the Opportunity level, before any Candidate exists for it (D2 Unit 04, Stage 5 Purpose: "Apply the D1 Unit 06 Intervention Eligibility gate to a sufficiently-evidenced Opportunity, at the opportunity level, before any Candidate is generated for it").

## 15.3 Reduced-Frequency Adjustment During Low-Coaching-Value Periods

D1-IE-04: "During low-coaching-value life periods (work-critical stretches, holidays, family events, vacations, religious observances) and during genuine, evidenced stress or burnout, the coach SHALL reduce intervention frequency; this reduction is a legitimate response, not a lowered standard (Constitution Ch.13 §13.11, Ch.16 §16.11)." Stage 5 applies this adjustment using whatever Life Event Context and Capacity State fields Pipeline Context supplies (Section 14.4); per current repository evidence (Section 10.4), both are reported `null`/`UNAVAILABLE` today — Section 32 records the resulting behavior as a graceful-degradation case, not an eligibility-gate failure of the mechanism itself.

## 15.4 Prohibition on Eligibility Merely Because an Event Occurred

D1-IE-03: "The coach SHALL NOT intervene merely because an event occurred, or merely because it is technically capable of generating a message (Constitution Ch.13 §13.1, Ch.12 §12.1)." This is Stage 5's own Forbidden Action (D2 Unit 04): "SHALL NOT declare an Opportunity eligible merely because an event occurred or because the pipeline is technically capable of proceeding."

## 15.5 Safety/High-Risk Bypass Behavior

D1-IE-05: "Safety/high-risk opportunities (Unit 05, D1-OD-04) SHALL bypass this Unit's ordinary gating and SHALL always be eligible (Constitution Ch.23)." Per D2-EF-01(a), a safety/high-risk-triggered Opportunity is admitted unconditionally by the Safety Layer at Stage 3, bypassing both Stage 4 (Evidence Evaluation) and Stage 5 (Eligibility Evaluation) entirely, and proceeds directly to Stage 6 — the Decision Engine's Stage 5 responsibility is never invoked for it (D2 Unit 04, Stage 5 Entry Criteria: "...and it is not a safety/high-risk-triggered Opportunity — those bypass this Stage entirely, admitted unconditionally").

## 15.6 Eligible and Ineligible Outcomes

Per D2 Unit 04, Stage 5 Exit Criteria: "Ineligible → this Opportunity resolves to Silence internally (D1-SP-02) — an internal orchestration outcome, not an independent Terminal Decision (Canonical Decision 1); it does not proceed to Candidate Generation. Eligible → proceeds to Candidate Generation." The Decision Engine's Stage 5 output is therefore binary per Opportunity: eligible (the Opportunity proceeds to Stage 6) or ineligible (the Opportunity terminates internally, at Stage 5, without ever reaching Candidate Generation).

## 15.7 Per-Opportunity Internal Silence Behavior

An ineligible Opportunity's resolution is an internal Silence outcome (Section 11) — it is not itself a Terminal Decision, does not itself invoke Decision Formation, and produces no independent user-facing or persisted output (D2 Unit 02, Canonical Decision 1; D1-SP-02). Where every Opportunity detected this cycle is ultimately ineligible (or otherwise fails to produce a surviving Candidate), the Decision Pass as a whole still resolves to a single, fully-formed Decision-Pass-level Silence Terminal Decision at Stage 9 (Section 23) — the per-Opportunity ineligibility itself is never separately reported as a Terminal Decision.

## 15.8 Separation Between Eligibility Evaluation and Candidate Generation

D2 Unit 04, Stage 5's own framing: eligibility is evaluated "at the opportunity level, before any Candidate is generated for it." The Decision Engine's Stage 5 responsibility never inspects, requires, or waits for a Candidate — it operates on the Opportunity alone. D2-DL-01: "A Candidate SHALL NOT exist unless the underlying Opportunity has already cleared the Eligibility Evaluation gate."

## 15.9 Separation Between Eligibility and Final Winner Selection

Eligibility Evaluation (Stage 5) is "a Pipeline Gate, not a Decision Lifecycle state" (D2 Unit 06, Canonical Decision 2) — it determines whether an Opportunity may proceed to Candidate Generation at all; it does not rank, compare, or select among Candidates, which remains exclusively Stage 7 (Prioritization) and Stage 8 (Winner Selection)'s function, applied only after Stage 6 has already produced Candidates from eligible Opportunities. An Opportunity being eligible at Stage 5 carries no guarantee that any Candidate later generated from it will win at Stage 8.

## 15.10 Traceability of Every Eligibility Determination

Per D2 Unit 09, every eligibility determination that actually ran must be logically attributable to Stage 5's own output — which valid reason (D1-IE-01) was cited, whether the Trust Test was applied and its result, and whether the reduced-frequency adjustment applied (Section 26). Where Stage 5 was bypassed by the Safety Layer (Section 15.5), the bypass itself is the complete and sufficient trace for Stage 5's absence (D2-TR-05) — no fabricated eligibility determination is recorded for a bypassed Opportunity.

No numeric threshold is invented in this section — D1 Unit 06 fixes categorical rules only (a valid reason from an enumerated set, the Trust Test, the reduced-frequency adjustment during named periods), and D1 Unit 11's Acceptance Criteria (CDR-4) reserves numeric thresholds to an approved Task SPEC or a future CDR raised at implementation time; none is fixed here.

## 15.11 Stage 5 Eligibility Input Contract (Canonical Decision CD-T006-01)

To ensure Eligibility is never inferred from free text or from a missing field, the Decision Engine's Stage 5 responsibility consumes exactly the following closed-field contract on every Opportunity it evaluates — no other signal, and no free-text parsing of an Opportunity's `proposedAction`, `explanation`, or any other narrative field, is ever used to determine eligibility:

```
OpportunityEligibilityInput {
  id: <string>,                              // required, non-empty
  sourceCategory: <one of the 5 D1 Unit 05 OPPORTUNITY_SOURCES>,  // required
  validReasonCategory: 'PREVENT_PREDICTABLE_MISTAKE'
    | 'HELP_BEFORE_DIFFICULT_DECISION'
    | 'CELEBRATE_MEANINGFUL_PROGRESS'
    | 'SUPPORT_RECOVERY'
    | 'PREPARE_FOR_FORESEEABLE_CHALLENGE'
    | 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'
    | 'PROTECT_STATED_LONG_TERM_GOALS',       // required, closed enum — the exact seven
                                               // reasons D1-IE-01 enumerates (Section 15.1);
                                               // absent or out-of-enum SHALL NOT be treated
                                               // as an inferred/default valid reason
  trustTestSignal: {                          // required object
    glad: true | false | null,                // required — null means "uncertain," which,
                                               // per D1-IE-02, itself resolves to ineligible
                                               // ("if it is uncertain... SHALL NOT intervene");
                                               // never inferred from confidence or any other field
    basis: <string>                           // required, non-empty — the structured basis for
                                               // the glad/uncertain determination, supplied
                                               // upstream, never fabricated by the Decision Engine
  },
  lowCoachingValuePeriodActive: true | false,  // required boolean — sourced only from Pipeline
                                               // Context's lifeEventContext/capacityState fields
                                               // (Section 14.4); defaults to false only when
                                               // both are structurally UNAVAILABLE (Section 15.3),
                                               // never inferred from any other field
  safetyHighRiskBypass: true | false           // required boolean — true only for an Opportunity
                                               // already admitted via the Safety Layer's Stage-3
                                               // unconditional bypass (D1-OD-04, D2-EF-01(a));
                                               // when true, Stage 5 is not invoked at all
                                               // (Section 15.5)
}
```

**Required fields:** every field above; none is optional, and no field's absence is treated as an implicit default other than the single named exception (`lowCoachingValuePeriodActive` defaulting to `false` when its Pipeline Context sources are both `UNAVAILABLE`). An `OpportunityEligibilityInput` missing a required field, or carrying a `validReasonCategory` value outside the closed enum, is rejected at Stage 5 entry as a malformed input (Section 31), never defaulted to eligible or ineligible by inference. This contract is the sole basis for every determination in Sections 15.1–15.7; it is populated upstream (Opportunity Detection/Stage 3, and the Pipeline Context fields Stage 2 already assembles), not by the Decision Engine itself, consistent with Section 9.2's boundary against absorbing Stage 3/4 responsibility.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 15.1 Valid Reasons from D1 Intervention Eligibility | D1 |
| 15.2 Trust Test Application | D1 |
| 15.3 Reduced-Frequency Adjustment During Low-Coaching-Value Periods | D1, Repository |
| 15.4 Prohibition on Eligibility Merely Because an Event Occurred | D1, D2 |
| 15.5 Safety/High-Risk Bypass Behavior | D1, D2 |
| 15.6 Eligible and Ineligible Outcomes | D1, D2 |
| 15.7 Per-Opportunity Internal Silence Behavior | D1, D2 |
| 15.8 Separation Between Eligibility Evaluation and Candidate Generation | D2 |
| 15.9 Separation Between Eligibility and Final Winner Selection | D2 |
| 15.10 Traceability of Every Eligibility Determination | D2 |
| 15.11 Stage 5 Eligibility Input Contract | D1, D2 |

---

# 16. Candidate Pool Assembly

## 16.1 Aggregation Across Every Opportunity in the Cycle

Per D2-PP-06: "Multiple Opportunities and multiple Candidates MAY exist within a single Pipeline cycle... Among the Candidates surviving to the shared pool at Prioritization, Winner Selection SHALL by default select exactly one winning Candidate." The Decision Engine's pool-assembly responsibility collects the output of every Stage-6 invocation across every eligible Opportunity this cycle — not only the first, not only the highest-confidence one — before Stage 7 (Prioritization) begins.

## 16.2 Aggregation Across Recommendation and Initiative Engines

Per D2 Unit 04, Stage 7 Purpose: "Rank every Candidate surviving Candidate Generation across every Opportunity detected this cycle, jointly, against the shared recommendation/initiative budget (D1-PR-04)." The pool is a single, unified collection spanning both `RecommendationCandidate` and `InitiativeCandidate` objects, discriminated by `kind` (Section 11) — never two separate pools ranked independently and merged afterward, which would violate D1-PR-04's requirement that the two Candidate kinds compete for one shared budget, not two separate ones.

## 16.3 Validation Before Admission to the Shared Pool

Every Candidate is validated against its own engine's contract (`RecommendationCandidate` per TASK-004 §CC-03; `InitiativeCandidate` per TASK-005 §19), **extended by the Canonical Decision CD-T006-02 arbitration-metadata set** (`hierarchyTier`, `evidenceTier`, `trustImpact`, `timingQuality`, `triggeringEvidenceTime`, `problemMagnitude`, and, for `RecommendationCandidate` only, `recommendationImpactTier`; Section 14.3), before admission — reusing, not duplicating, each engine's own validation discipline (`recommendationEngine.js`'s internal `validateRequest()`; `initiativeEngine.js`'s exported `validateCandidateShape()`, Section 10.5). Per Section 14.12, every arbitration-metadata field is always present — either a real value or the `NO_SIGNAL` sentinel (Section 14.12.1) — so a Candidate is rejected on arbitration-metadata grounds only where a field is **structurally absent from the object entirely** (neither a real value nor `NO_SIGNAL` was set), not merely because its value happens to be `NO_SIGNAL`; `NO_SIGNAL` is a valid, fully-specified value, never a validation failure. A Candidate failing its own contract's validation, or structurally missing a required field, is rejected from the pool, not silently admitted with a fabricated value (D1-DI-02, applied by analogy). Per Canonical Decision CD-T006-03, an `InitiativeCandidate` carrying a `recommendationImpactTier` field (real or `NO_SIGNAL`) is itself a validation failure and is rejected — structurally identical to the existing, TASK-005-established rejection of any `InitiativeCandidate` carrying a `category` field.

## 16.4 Duplicate Handling

D1 and D2 do not define a semantic-duplicate-detection rule for Candidates at pool-assembly time (distinct from Winner Selection's own duplicate-Candidate handling, Section 19). Two Candidates originating from genuinely distinct Opportunities are never treated as duplicates merely because their content is similar — Opportunity provenance is preserved per-Candidate (Section 14.3) precisely so that Prioritization and Winner Selection can distinguish them. Where the *same* Opportunity somehow produces more than one Candidate from the *same* engine invocation (a condition neither Stage-6 engine's current contract permits — `generate()` in both `recommendationEngine.js` and `initiativeEngine.js` returns at most one Candidate per call, Section 10.4), this document does not invent a merge or dedupe rule; it is recorded as **Repository Gap** (Section 38, item G-4) rather than resolved by invention.

## 16.5 Preservation of Candidate Immutability

Per D2-PP-05: "The confidence... and Canonical Decision Hierarchy tier... attached to a Candidate at Candidate Generation SHALL be validated against D1's own rules, and, where still correct under D1, preserved, by Prioritization, Winner Selection, and Decision Formation... a later Stage SHALL NOT arbitrarily recompute either value from scratch." Pool assembly does not mutate any Candidate field; it only collects, validates, and — where invalid — rejects. `InitiativeCandidate`'s own `immutable: true` field (Section 10.4) is consistent with, but does not itself constitute, this canonical requirement, which applies identically to `RecommendationCandidate` even though that contract carries no equivalent explicit field.

## 16.6 Preservation of Candidate Provenance

Every admitted Candidate's `opportunityProvenance` field (present on both contracts, Section 10.4) is preserved unmodified through pool assembly, Prioritization, and Winner Selection, satisfying D2 Unit 09's requirement that a Terminal Decision be traceable to "the Opportunity that produced the winning Candidate" (Section 26).

## 16.7 Handling of Zero Candidates from Individual Opportunities

Per D2-EF-04: "If Candidate Generation produces zero Candidates for an eligible Opportunity, that Opportunity resolves to Silence internally... an internal orchestration outcome, not an independent Terminal Decision... This does not affect Prioritization or Winner Selection for any other Opportunity's Candidates in the same cycle's shared pool." Pool assembly simply contributes nothing from that Opportunity; it does not fabricate a placeholder Candidate, and it does not treat the zero-Candidate Opportunity as a failure requiring special handling distinct from any other Opportunity that happened not to produce a Candidate.

## 16.8 Handling of Zero Candidates Across the Entire Decision Pass

Per D2-INV-05 and D2-PP-04: where no Opportunity this cycle produces a surviving Candidate, the pool is empty, Stage 7/8 do not have a meaningful ranking/selection to perform (Section 17.1's Entry Criteria; Section 20's Entry Criteria), and Decision Formation still runs, once, to produce a single, fully-formed Decision-Pass-level Silence Terminal Decision (Section 23) — never a silently-dropped cycle.

## 16.9 Prohibition on Generator-Specific Priority Shortcuts

D2-INV-07 (Policy Separation): "No Stage or engine covered by this specification SHALL introduce a coaching, recommendation, priority, evidence, memory, personalization, or safety policy not already fixed by D1." Pool assembly does not favor Recommendation-kind Candidates over Initiative-kind Candidates (or vice versa) by construction, by admission order, or by any implicit weighting — every admitted Candidate enters the same shared pool on equal footing, with priority determined exclusively by Stage 7's application of D1 Unit 07 (Section 17), never by which engine produced the Candidate.

The shared pool must be complete — every Opportunity's Stage-6 output collected, validated, and admitted or rejected — before Stage 7 begins, per D2 Unit 04, Stage 7 Entry Criteria: "One or more Candidates exist for this cycle."

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 16.1 Aggregation Across Every Opportunity in the Cycle | D2 |
| 16.2 Aggregation Across Recommendation and Initiative Engines | D1, D2 |
| 16.3 Validation Before Admission to the Shared Pool | D1, TASK-004, TASK-005 |
| 16.4 Duplicate Handling | D1, D2, Repository |
| 16.5 Preservation of Candidate Immutability | D2, TASK-004, TASK-005 |
| 16.6 Preservation of Candidate Provenance | D2, TASK-004, TASK-005 |
| 16.7 Handling of Zero Candidates from Individual Opportunities | D2 |
| 16.8 Handling of Zero Candidates Across the Entire Decision Pass | D1, D2 |
| 16.9 Prohibition on Generator-Specific Priority Shortcuts | D2 |

---

# 17. Prioritization Model

## 17.1 Canonical Decision Hierarchy Tier — Primary Ranking

D1-PR-01: "Candidates SHALL be ranked first by which tier of the Canonical Decision Hierarchy (Unit 02) they serve. A candidate serving a higher tier SHALL always outrank a candidate serving a lower tier, regardless of how much larger the lower-tier candidate's apparent benefit is (Coach Bible Ch.2, Canonical Principle)." This is Stage 7's mandatory first-order sort key, applied identically to Recommendation-kind and Initiative-kind Candidates alike, using each Candidate's `hierarchyTier` field (Section 14.3) — the Canonical Decision Hierarchy (D1 Unit 02) governs both. Per **Canonical Decision CD-T006-07**, `hierarchyTier` values sourced from Opportunity `sourceCategory` use `recommendationCategories.js`'s existing `SOURCE_HIERARCHY_TIER_MAP` as the approved TASK-006 v1.0 canonical baseline (Section 10.2, Section 38 item G-8) — this document does not invent a competing mapping.

## 17.2 Recommendation Impact-Tier Handling Where Applicable (Resolved — Canonical Decision CD-T006-03)

D1-PR-02: "Within candidates that are otherwise tied on Hierarchy tier, recommendations are further ranked: Level 1 Critical (immediate health/safety, overrides almost everything) > Level 2 High Impact (long-term success) > Level 3 Optimization > Level 4 Educational (SHALL NOT interrupt an important coaching moment) (Constitution Ch.11 §11.6)." This nested tiering applies **only within Canonical Decision Hierarchy tiers 1–2 and 9**, using the `recommendationImpactTier` field (Section 14.3).

TASK-005 recorded this exact gap and deferred it explicitly to this document: "whether Initiative Candidates receive an analogous nested tiering or rank by Hierarchy tier alone is a D1 Unit 07/09 policy matter D2 does not itself re-derive" (TASK-005 §23; TASK-005 §36, item G-5, addressed "to Product/Architecture, at or before TASK-006's specification"). **Canonical Decision CD-T006-03 resolves this** (the former Product Decision Pending item P-1, Section 38): `recommendationImpactTier` is populated only on `RecommendationCandidate`; `InitiativeCandidate` never carries it (Section 14.3, 16.3). The rule is applied as follows:

- **Same-kind tie (every tied Candidate is Recommendation-kind).** D1-PR-02 applies exactly as written: Level 1 Critical > Level 2 High Impact > Level 3 Optimization > Level 4 Educational.
- **Cross-kind tie (at least one tied Candidate is Initiative-kind).** Impact-tier nesting is skipped entirely for that tied sub-population — it proceeds directly to `problemMagnitude` (D1-PR-03, Section 17.3) and, if still tied, to the D1-PR-06 tie-break order (Section 19) — never to an invented Initiative-equivalent impact tier, and never by treating the absent field as tier-4/lowest by default.
- **Every-Candidate-Initiative tie.** Falls through identically to the cross-kind case above, since no tied Candidate carries `recommendationImpactTier` at all.

Per Section 14.12.2, `recommendationImpactTier` is `NO_SIGNAL` on every `RecommendationCandidate` at the current repository baseline (no canonical or repository-verified classification source is yet available). Per Section 14.12.1's comparison semantics, a same-kind Recommendation tie in which both Candidates carry `NO_SIGNAL` does not distinguish them at this step and falls through to `problemMagnitude` (Section 17.3) — this is the expected, non-blocking behavior of the rule as specified, not a defect; the rule itself remains fully and correctly defined for the case where a real `recommendationImpactTier` value becomes available in the future.

## 17.3 Biggest-Problem-First Behavior

D1-PR-03: "The coach SHALL address the largest meaningful problem before a smaller one; it SHALL NOT optimize a minor detail while a materially larger problem is active (Constitution Ch.11 §11.7)." Per **Canonical Decision CD-T006-02**, this is applied using each Candidate's `problemMagnitude` field (Section 14.3) — after Hierarchy-tier and (where applicable, per Section 17.2) impact-tier ranking, as a further ordering consideration among Candidates that remain tied, and as the first ranking step reached by a cross-kind tie once impact-tier nesting is skipped. D1 does not define "largest meaningful problem" numerically, and this document does not invent a numeric scale or derivation formula for `problemMagnitude` — the field's presence and role in the ranking sequence are fixed by CD-T006-02, and its representation is fully specified at Section 14.12: `NO_SIGNAL` at the current repository baseline (no canonical or repository source exists for a magnitude scale), meaning this step does not distinguish Candidates until a real source is approved, and falls through to Section 19's tie-break sequence exactly as Section 14.12.1 defines.

## 17.4 Shared Recommendation/Initiative Budget

D1-PR-04: "Recommendations compete for a limited attention/trust budget within a given period; only the highest-value candidates SHALL be surfaced, and the rest SHALL resolve to Silence." Per D2 Unit 04, Stage 7 Purpose, this budget is explicitly "shared recommendation/initiative" — both Candidate kinds draw from one budget, not two independently-tracked ones. Full budget-enforcement mechanics are addressed at Section 18; this subsection establishes only that the budget is a Stage-7 ranking input, not a Stage-8 filter applied after ranking is otherwise complete.

## 17.5 Confidence and Evidence Influence Where Canonically Permitted

D1-PR-06 (tie-break order, reproduced in full at Section 19) permits `evidenceTier`, `trustImpact`, `timingQuality`, and `triggeringEvidenceTime` (Section 14.3) to influence ordering, but **only** as tie-break criteria applied after D1-PR-01 through D1-PR-03 have already been exhausted — never as an independent, freestanding ranking factor ahead of Hierarchy tier. D1-ER-07 reinforces this boundary generally: "A high confidence score SHALL NOT substitute for the authority required to treat a belief as authoritative" — confidence informs tie-breaking; it does not itself establish priority.

## 17.6 Exclusion of Product Engagement as a Ranking Objective

D1-AH-03: "Product engagement (Tier 10) SHALL NOT be permitted to influence a decision ahead of any other tier, under any circumstance." D2 Unit 04, Stage 7 Forbidden Actions: "SHALL NOT let Product Engagement (Hierarchy tier 10) influence ranking." Tier 10 remains the lowest tier in the Hierarchy (D1 Unit 02); no Candidate's ranking position is ever adjusted based on engagement, retention, or usage considerations at any point in Stage 7's logic.

## 17.7 Mandatory Canonical Ordering Versus Implementation-Level Sorting Mechanics

The mandatory ordering is exactly the sequence D1-PR-01 → D1-PR-02 (where applicable) → D1-PR-03 → D1-PR-04 (budget) → D1-PR-06 (tie-break, Section 19) fixes — a strict lexicographic precedence, not a weighted composite score. The specific sort algorithm, data structure, or comparator implementation used to realize this ordering is implementation-level engineering detail, not itself a canonical requirement; any correct implementation of the fixed lexicographic ordering above satisfies this section.

This document does not invent new scoring systems, weights, utility functions, or numeric priority formulas. Every ranking factor above is a categorical, ordered comparison (tier vs. tier, tie-break criterion vs. tie-break criterion) — never a numeric blend of multiple factors into a single composite score, which D1 nowhere authorizes and which would itself constitute an invented Product decision.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 17.1 Canonical Decision Hierarchy Tier | D1, D2, TASK-004 |
| 17.2 Recommendation Impact-Tier Handling Where Applicable (Resolved — CD-T006-03) | D1, D2, Constitution, TASK-005 |
| 17.3 Biggest-Problem-First Behavior | D1, Constitution |
| 17.4 Shared Recommendation/Initiative Budget | D1, D2 |
| 17.5 Confidence and Evidence Influence Where Canonically Permitted | D1 |
| 17.6 Exclusion of Product Engagement as a Ranking Objective | D1, D2 |
| 17.7 Mandatory Canonical Ordering Versus Implementation-Level Sorting Mechanics | D1, D2 |

---

# 18. Budget Enforcement

**Resolved by Canonical Decision CD-T006-04** (the former Engineering Decision Pending item E-1, Section 38): for TASK-006 v1.0, the shared attention/trust budget is enforced entirely at the level of a single Decision Pass — one shared Candidate pool (Section 16), one Terminal Decision (Section 22), with every non-winning Candidate resolving to Silence. No daily or weekly quota, no per-period counter, and no new persistent budget-tracking state of any kind is introduced by this document.

## 18.1 Canonical Source of the Budget

D1-PR-04 is the sole canonical source: "Recommendations compete for a limited attention/trust budget within a given period; only the highest-value candidates SHALL be surfaced, and the rest SHALL resolve to Silence (Constitution Ch.11 §11.9; Unit 10)." Per CD-T006-04, TASK-006 v1.0 satisfies this rule entirely through the per-Decision-Pass single-winner-plus-Silence mechanic (Section 18.5) — D1 fixes no numeric budget size, and none is introduced by this document, at this version.

## 18.2 Whether Enforcement Occurs During Ranking, Admission, or Selection

D2 Unit 04, Stage 7 Purpose folds the budget into ranking itself: "Rank every Candidate... jointly, against the shared recommendation/initiative budget (D1-PR-04)." Per CD-T006-04, the budget is enforced structurally, by Stage 7's ranking and Stage 8's single-winner selection together (Section 17, Section 20) — not by a separate, distinct Stage-8 filtering pass, and not by any counter checked at admission time (Section 16).

## 18.3 Interaction Between Recommendation and Initiative Candidates

Per Section 17.4 and CD-T006-04, the budget is shared, not partitioned per Candidate kind, and is not tracked as a numeric allocation of either kind — a cycle in which the Recommendation Engine and Initiative Engine both produce viable Candidates does not grant either kind a reserved allocation; every Candidate, regardless of `kind`, competes for the one shared pool on the same Hierarchy-tier-first ordering (Section 17), and exactly one Terminal Decision results.

## 18.4 Interaction with Already-Fired or Suppressed Interventions

Where relevant, suppression (C2's `evaluateSuppression()` mechanism) is applied upstream, at Stage 6, by each producer engine before a Candidate is even generated (TASK-004 §CC-09; TASK-005 §18.5/§21, noting the mechanism is not currently wired to any Initiative surface — TASK-005 §36 item A-2, a Follow-up). The Decision Engine's own Stage-7 budget logic does not re-run suppression; it operates only on the Candidates that already survived Stage 6, whatever suppression state applied there. CD-T006-04 introduces no new persistent suppression- or budget-adjacent state of its own.

## 18.5 Deterministic Behavior When the Pool Exceeds the Budget

Per CD-T006-04, "exceeding the budget" has no independent meaning at v1.0 beyond the ordinary case D1-PR-05's single-winner default (Section 20) already resolves: exactly one Candidate wins per Decision Pass, and every other Candidate in the pool resolves to Silence at Decision Formation, consistent with D1-PR-04's "the rest SHALL resolve to Silence." No numeric budget size is fixed, and no distinct "budget-exceeded" code path exists beyond this single-winner-plus-Silence resolution.

## 18.6 No Special Reserve for Either Candidate Kind Unless Canonically Required

No canonical source reserves a portion of the shared budget to Recommendation-kind or Initiative-kind Candidates specifically; none is invented here (Section 18.3).

## 18.7 No Engagement-Based Expansion of the Budget

Per D1-AH-03 (Section 17.6), no engagement, retention, or usage consideration ever expands, contracts, or otherwise adjusts the budget — the budget's only canonical purpose is protecting the user's limited attention/trust, never protecting or growing product usage. CD-T006-04's per-Decision-Pass model gives no mechanism through which an engagement signal could even be applied to expand a numeric quota, since none exists.

**Resolution status:** Per CD-T006-04, the former item E-1 (numeric budget size, Section 38) is resolved — no numeric budget is required for TASK-006 v1.0, and none is introduced. A future version introducing a cross-Decision-Pass, multi-period budget (a daily or weekly quota, or persistent budget state) would require its own, separately-approved canonical decision; this document does not anticipate or partially implement one.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 18.1 Canonical Source of the Budget | D1, TASK-006 (CD-T006-04) |
| 18.2 Whether Enforcement Occurs During Ranking, Admission, or Selection | D1, D2, TASK-006 (CD-T006-04) |
| 18.3 Interaction Between Recommendation and Initiative Candidates | D1, D2, TASK-006 (CD-T006-04) |
| 18.4 Interaction with Already-Fired or Suppressed Interventions | TASK-004, TASK-005 |
| 18.5 Deterministic Behavior When the Pool Exceeds the Budget | D1, TASK-006 (CD-T006-04) |
| 18.6 No Special Reserve for Either Candidate Kind | D1 |
| 18.7 No Engagement-Based Expansion of the Budget | D1, TASK-006 (CD-T006-04) |

---

# 19. Tie-Breaking and Conflict Resolution

## 19.1 D1's Exact Tie-Break Order

D1-PR-06 (verbatim): "When two candidates remain tied after D1-PR-01 through D1-PR-03, ties SHALL be broken in this order: (a) higher Evidence Hierarchy tier (Unit 11), (b) higher expected trust impact, (c) higher timing quality, (d) more recent triggering evidence (Constitution Ch.13)." This four-step sequence is applied, using each Candidate's `evidenceTier`, `trustImpact`, `timingQuality`, and `triggeringEvidenceTime` fields respectively (Section 14.3, Canonical Decision CD-T006-02), in this exact order, only to Candidates still tied after Hierarchy tier (D1-PR-01), impact tier where applicable (D1-PR-02, Section 17.2 — same-kind Recommendation ties only, per CD-T006-03), and biggest-problem-first (D1-PR-03, using `problemMagnitude`) have already been applied and have failed to distinguish them. A cross-kind tie (Section 17.2) reaches this sequence directly from `problemMagnitude`, having skipped impact-tier nesting entirely — the sequence itself is unaffected by which path led to it.

## 19.2 Resolvable Versus Genuinely Unresolved Tie

A tie is **resolvable** if D1-PR-06's four criteria, applied in order, eventually distinguish the tied Candidates — the tie-break sequence stops at the first criterion that produces a difference. A tie is **genuinely unresolved** only if all four criteria are exhausted and the Candidates remain indistinguishable on every one of them. This document does not treat a tie as genuinely unresolved merely because it is inconvenient to break, or because a criterion's underlying data is imprecise rather than truly absent — D1-ER-04/D1-DI-04's "absence of expected data is itself evidence" principle applies here: where a criterion's data is genuinely unavailable for both tied Candidates (e.g., neither carries a usable timing-quality signal — formally, both carry `NO_SIGNAL` per Section 14.12.1), that criterion is skipped for both, and the sequence continues to the next criterion, consistent with treating unavailability symmetrically rather than as an artificial tie-breaker. Per Section 14.12.2, at the current repository baseline `evidenceTier`, `trustImpact`, and `timingQuality` are `NO_SIGNAL` on every Candidate (no canonical or repository source yet populates a real value for any of them), so D1-PR-06's tie-break sequence resolves, at this baseline, almost entirely on criterion (d) (`triggeringEvidenceTime`, which does have a real source, Section 14.12.2) — this is the correct and fully-specified behavior of the rule as written, not an incomplete implementation of it; the sequence resolves on criteria (a)–(c) automatically and without further specification once real values become available for them (Section 14.12.4).

## 19.3 When the Narrow Multi-Option Exception May Be Used

Only where a tie is genuinely unresolved per Section 19.2 does the narrow permitted exception apply: "Presenting multiple options is permitted only as the fallback for the narrow case where ranking genuinely cannot produce one clear winner (Constitution Ch.11 §11.15)" (D1-PR-05). This is operationalized as Canonical Decision 7 (D2 Unit 08, D2-EF-05): the full permitted set of genuinely-tied Candidates is carried forward from Winner Selection and assembled by Decision Formation into exactly one Terminal Decision carrying multiple user-selectable options — never multiple Terminal Decisions, and never a menu offered merely for user convenience.

## 19.4 Prohibition on Menus for Convenience

D2 Unit 04, Stage 8 Forbidden Actions: "SHALL NOT select a menu of options as a matter of convenience when a single winner is in fact determinable (D1-PR-05)." The narrow exception is invoked only after D1-PR-06's full four-step sequence has been genuinely exhausted (Section 19.2/19.3) — never as a default, never to avoid the work of applying the tie-break sequence, and never because multiple options might seem more helpful to the user than one.

## 19.5 Preservation of Single-Winner Default Behavior

D1-PR-05: "When multiple candidates are similarly acceptable and no single option is clearly superior, the coach SHALL surface exactly one recommendation rather than a menu (Coach Bible Ch.2 §10; Knowledge Base Topic 27, Topic 32)." This remains the default outcome of Stage 8 in the overwhelming majority of cases — the narrow exception (Section 19.3) is exactly that: narrow, not an alternate co-equal mode of operation.

## 19.6 Deterministic Handling of Semantically Duplicate or Equivalent Candidates

Where two Candidates from different Opportunities (or, in principle, different engines) describe semantically equivalent actions, D1/D2 do not define a semantic-equivalence detection or merge rule (distinct from Section 16.4's pool-assembly-time duplicate handling, which concerns identical-Opportunity duplication only). This document does not invent a semantic-similarity algorithm; two Candidates that are not identical by the fields Section 14.3 fixes are treated as distinct Candidates, each proceeding through D1-PR-01 through D1-PR-06 on its own merits, even where a human reader might judge them "similar." **Recorded as Repository Gap** (Section 38, item G-5) — no canonical source defines semantic-equivalence handling for Candidates originating from distinct Opportunities.

## 19.7 Behavior When Canonical Fields Are Missing or Contradictory

A Candidate missing a field D1-PR-01 through D1-PR-06 requires (Hierarchy tier, confidence, timing/evidence-recency data) cannot be correctly ranked or tie-broken; per Section 14.9, such a Candidate is rejected at pool-assembly time rather than admitted with a fabricated default value, so this condition should not arise during Prioritization/Winner Selection proper if Section 16's assembly discipline is correctly applied. Where two Candidates' fields genuinely contradict each other for the same tie-break criterion in a way that cannot be resolved by the higher-Evidence-Hierarchy-tier rule (D1-PR-06(a)) — for example, two structurally distinct rationale claims of equally-tiered evidence — the contradiction persists through the remaining criteria (b)–(d) in order; if it survives all four, it is a genuinely unresolved tie (Section 19.2/19.3), not a fabricated resolution.

This document does not replace the canonical tie-break sequence with an engineering preference; D1-PR-06's four criteria, in D1-PR-06's exact order, are the entire tie-break rule.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 19.1 D1's Exact Tie-Break Order | D1 |
| 19.2 Resolvable Versus Genuinely Unresolved Tie | D1 |
| 19.3 When the Narrow Multi-Option Exception May Be Used | D1, D2, Constitution |
| 19.4 Prohibition on Menus for Convenience | D1, D2 |
| 19.5 Preservation of Single-Winner Default Behavior | D1 |
| 19.6 Deterministic Handling of Semantically Duplicate or Equivalent Candidates | D1, D2, Repository |
| 19.7 Behavior When Canonical Fields Are Missing or Contradictory | D1 |

---

# 20. Winner Selection

## 20.1 Exactly One Winner by Default

D1-PR-05 (Section 19.5) governs. Stage 8's Purpose (D2 Unit 04): "Select exactly one winning Candidate — or, under the narrow permitted exception, the full permitted set of tied Candidates — from the ranking produced by Prioritization." The default, ordinary-case output of Winner Selection is a single winning Candidate — the highest-ranked survivor of Stage 7's ordering (Section 17) and this section's own Safety disqualification pass (Section 20.3).

## 20.2 The Narrow Permitted Tied Set Exception

Where Stage 7's ranking, including the full D1-PR-06 tie-break sequence, genuinely cannot distinguish two or more Candidates (Section 19.2/19.3), Winner Selection carries forward the full permitted tied set rather than an arbitrarily-chosen single Candidate from among them (D2-EF-05, Canonical Decision 7). This set is not itself a Terminal Decision — it remains a set of tied Candidates until Decision Formation (Stage 9) assembles it into exactly one Terminal Decision (Section 23).

## 20.3 Safety Disqualification Before Final Selection

D2 Unit 04, Stage 8 Responsibilities: "Apply Safety Layer disqualification of any Candidate conflicting with a D1 Unit 02 absolute override, ahead of ranking position (D1-RP-07, D1-AH-02)." Safety disqualification is applied to the ranked pool from Stage 7 before final selection — a Candidate's rank alone never overrides its disqualification; a lower-ranked, non-disqualified Candidate may become the winner over a higher-ranked, disqualified one (Section 21).

## 20.4 Repeated Selection After a Disqualification Where Another Candidate Remains

Where the top-ranked Candidate is disqualified, Winner Selection proceeds to the next-highest-ranked non-disqualified Candidate in Stage 7's ordering — the ranking itself is not re-computed from scratch (D2-PP-05 preservation); disqualification removes a Candidate from eligibility for winner status without altering the relative order of the Candidates that remain.

## 20.5 All-Candidates-Disqualified Behavior

Per D2 Unit 04, Stage 8 Exit Criteria: "If every Candidate is disqualified by the Safety Layer, the cycle SHALL resolve to Silence or refusal at Decision Formation, as D1 Unit 14 requires." Winner Selection itself does not fabricate a substitute winner in this case; it passes an empty (all-disqualified) result to Decision Formation, which then applies D1 Unit 14's authority-boundary rules to determine whether the Decision Pass resolves to `kind: 'SILENCE'` or to `kind: 'BOUNDARY'`/`boundaryType: 'REFUSAL'` (Section 23.5, Section 24) — D2's own text names exactly these two outcomes for this specific path.

## 20.6 Preservation of Candidate Provenance and Rationale

Per Section 16.5/16.6, the winning Candidate's (or tied set's) `opportunityProvenance` and `rationale` are carried forward unmodified into Decision Formation — Winner Selection does not rewrite, summarize, or otherwise alter either field.

## 20.7 Deterministic Selection

Given an identical ranked pool and identical Safety Layer disqualification results, Winner Selection must produce the identical winner (or tied set) on repeated evaluation — no hidden randomness, no reliance on invocation order beyond what Stage 7's own deterministic ordering already fixes (Section 27).

## 20.8 No Mutation or Regeneration During Selection

D2 Unit 04, Stage 8 Forbidden Actions (restated from Section 19.4): no menu-for-convenience. Additionally, per D2-INV-03 (Stage isolation) and Section 13 item 3: Winner Selection never rewrites a Candidate's content to improve its ranking position, and never asks the Recommendation Engine or Initiative Engine to regenerate a Candidate — Stage 8 operates exclusively on the Candidates Stage 6 already produced and Stage 7 already ranked.

Per D2 Unit 04, Stage 8 Purpose's own final clause: "Winner Selection must not itself form a Terminal Decision" — its output (a winning Candidate, a tied set, or an all-disqualified result) is exclusively an input to Stage 9; it is never itself the Decision Pass's output.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 20.1 Exactly One Winner by Default | D1, D2 |
| 20.2 The Narrow Permitted Tied Set Exception | D1, D2, Constitution |
| 20.3 Safety Disqualification Before Final Selection | D1, D2 |
| 20.4 Repeated Selection After a Disqualification | D2 |
| 20.5 All-Candidates-Disqualified Behavior | D1, D2 |
| 20.6 Preservation of Candidate Provenance and Rationale | D2 |
| 20.7 Deterministic Selection | D2 |
| 20.8 No Mutation or Regeneration During Selection | D2 |

---

# 21. Safety Layer Integration

## 21.1 Safety/High-Risk Opportunity Admission Bypass Where Canonically Assigned

D2 Unit 07, Safety Layer function (a): "at Opportunity Detection, injects a safety/high-risk-triggered Opportunity unconditionally (D1-OD-04, D1-IE-05), which then bypasses only the ordinary Evidence Evaluation and Eligibility Evaluation gating for that specific Opportunity." This checkpoint precedes the Decision Engine's own Stage 5 responsibility entirely (Section 15.5) — the Decision Engine does not perform, second-guess, or re-apply this bypass; it simply never receives the bypassed Opportunity at Stage 5, and instead first encounters its resulting Candidate(s) at Stage 7, exactly like any other eligible Opportunity's Candidates (D2-EF-01(a): "no separate Safety pipeline exists").

## 21.2 Candidate Disqualification Before Final Winner Selection

D2 Unit 07, Safety Layer function (b): "at Winner Selection, disqualifies any Candidate conflicting with a D1 Unit 02 absolute override (D1-RP-07), without affecting any other Opportunity's or Candidate's path through the ordinary gates." The Decision Engine submits the full ranked pool to this function at Stage 8 (Section 20.3) and receives back a per-Candidate disqualification determination; it does not itself evaluate whether a Candidate conflicts with an absolute override.

## 21.3 Final Independent Safety Evaluation During Decision Formation

D2 Unit 07, Safety Layer function (c): "at Decision Formation, performs a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision (D1-AB-05)." The Decision Engine submits its assembled (pre-final-review) Terminal Decision to this function at Stage 9, through the Safety Integration Port (Section 21.8), and receives back exactly one of five dispositions: `UNMODIFIED`, `MODIFIED`, `DEFERRED`, `BLOCKED`, or `ESCALATED` (Section 23.5, Section 24, Canonical Decision CD-T006-06).

## 21.4 Safety Authority to Modify, Defer, or Block

D1-AB-05 (verbatim): "Every Recommendation SHALL pass through a safety evaluation with authority to modify, defer, or block it, executed independently of and before the recommendation logic proper. No part of the system, including any future AI agent, may bypass this evaluation." D1-AB-02 separately fixes the professional-referral escalation authority the `ESCALATED` disposition realizes. Constitution Ch.23's Engineering Implications state the modify/defer/block authority identically for the architecture generally, and — as TASK-005 §24 records — this binds Initiative-kind output exactly as it binds Recommendation-kind output: "an Initiative is, functionally, a form of proactive recommendation for this purpose, and D1-AB-05 does not carve out an exception for it." This document treats the final Stage-9 Safety review as applying identically regardless of the winning Candidate's `kind`.

## 21.5 Conversion of Modified/Deferred/Blocked/Escalated Outcomes — Canonical Decision CD-T006-06

D2 Unit 04, Stage 9 Responsibilities: "where modified, deferred, or blocked, reform the Terminal Decision as a refusal/escalation (D1 Unit 14) instead of its original kind." **Canonical Decision CD-T006-06 fixes the exact, non-contradictory mapping** the Decision Engine's Stage 9 logic applies to the Safety Layer's five possible dispositions:

| Safety Disposition | Terminal Decision Result |
|---|---|
| `UNMODIFIED` | Original kind (`RECOMMENDATION`/`INITIATIVE`) proceeds unchanged. |
| `MODIFIED` | Original kind (`RECOMMENDATION`/`INITIATIVE`) proceeds, carrying a `modification` record (Section 25) — the kind itself is never reformed for a modification. |
| `DEFERRED` | Reformed to `kind: 'SILENCE'` (Section 23, Section 24.1). |
| `BLOCKED` | Reformed to `kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'` (Section 24.1, Section 25). |
| `ESCALATED` | Reformed to `kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'` (Section 24.1, Section 25). |

This mapping is deterministic and exhaustive — every one of the five possible Safety dispositions maps to exactly one Terminal Decision shape, and no disposition is left unmapped or ambiguously mapped (Section 25 fixes the resulting contract in full).

## 21.6 No Bypass, Downgrade, Reinterpretation, or Silent Suppression of Safety Output

D1-AB-05's "no part of the system... may bypass this evaluation" and D3 §11.3's "no component may bypass the Safety Layer at any of its three checkpoints (AI-06 does not permit an exception)" together fix an absolute rule: the Decision Engine never treats a disqualification, modification, deferral, or block as advisory, never overrides it with its own judgment, never silently drops a Safety determination it disagrees with, and never reinterprets "block" as "modify" or any other weaker outcome. D2 Unit 07, Decision Engine Forbidden Responsibilities: "SHALL NOT override the Safety Layer's disqualification or block/defer authority."

## 21.7 Behavior if the Safety Layer Is Unavailable or Returns an Invalid Response

Per D3 §12.3 (Graceful Degradation): "Where the Safety Layer or Decision Engine cannot be reached at all, the architecture SHALL NOT substitute a default Terminal Decision." At the current repository baseline, no Safety Layer implementation exists at all (Section 10.11) — this is not a runtime failure mode to be handled defensively within this document's scope, but a build-sequencing precondition: **in production**, the Decision Engine cannot complete Stage 8's disqualification pass or Stage 9's final review without a real Safety Layer implementation behind the Safety Integration Port (Section 21.8) to submit to, and per D1-DI-02's prohibition on fabricating data (extended architecturally by D3 §12.3 to prohibiting a fabricated decision), production code must never simulate, stub, bypass, or fake Safety Layer evaluation to produce a deliverable Terminal Decision in its absence (Canonical Decision CD-T006-05). **In tests only**, a deterministic test double implementing the same port is permitted (Section 21.8, Section 35.7) — this is a test-fixture allowance, not a production behavior, and never blurs the two. Where the Safety Layer returns a structurally invalid response (neither disqualification-determination-shaped at Stage 8, nor one of the five CD-T006-06 dispositions at Stage 9), this is a Pipeline Abort condition (D2-EF-06); no Terminal Decision is fabricated in its place (Section 31).

TASK-006 integrates with Safety authority without implementing the Safety Layer's own independent policy scope — the Safety Layer's internal reasoning for any of its determinations is not something the Decision Engine inspects, replicates, or is required to understand; it consumes only the determination itself, through the port.

## 21.8 Safety Integration Port/Contract (Canonical Decision CD-T006-05)

TASK-006 does not implement the Safety Layer. It defines only the integration contract — the **Safety Integration Port** — through which Stage 8 and Stage 9 call into whatever Safety Layer implementation a future, separately-scoped task provides (Section 38 item G-6). The port is a plain, platform-neutral interface, consistent with D3 §5.5/§14's Pure-Domain-shape expectation:

```
SafetyIntegrationPort {
  disqualify(candidatePool: Candidate[], pipelineContext): DisqualificationResult[]
    // Stage 8 call (Section 20.3, 21.2). One entry per submitted Candidate.
    // DisqualificationResult { opportunityProvenance, disqualified: boolean, reason: <string|null> }

  finalReview(preReviewTerminalDecision, pipelineContext): SafetyReviewResult
    // Stage 9 call (Section 21.3, 21.5). Exactly one call per Decision Pass in which Stage 9 is
    // entered with a winning Candidate or tied set (never called for a Decision-Pass-level
    // Silence formed from zero surviving Candidates, Section 23.4, since there is no Candidate
    // content for Safety to review).
    // SafetyReviewResult { disposition: 'UNMODIFIED'|'MODIFIED'|'DEFERRED'|'BLOCKED'|'ESCALATED',
    //                       modifiedContent: <object|null>,   // present only when MODIFIED
    //                       reason: <string|null> }
}
```

**Production requirement.** Production code SHALL call a real implementation of this port, backed by an actually-built Safety Layer; it SHALL NOT bypass the port, SHALL NOT substitute a hard-coded "always unmodified"/"always qualified" stub, and SHALL NOT otherwise fake a Safety determination (Section 21.6, Section 21.7, Section 13 items 6–7). Until a real Safety Layer implementation exists, the Decision Engine cannot complete a production Decision Pass past Stage 8 (Section 21.7) — this is the intended, safe failure mode, not a defect to be engineered around.

**Test requirement.** Tests (Section 35.7) MAY substitute a deterministic test double implementing the same `SafetyIntegrationPort` shape, so that Stage 5/7/8/9 logic can be exercised in isolation before a real Safety Layer exists. A test double is explicitly a test-only fixture; nothing in this document authorizes its use, or the use of any structurally similar stand-in, in a production code path.

This port is the complete Safety-facing contract this document defines; it introduces no Safety Layer policy content of its own (Section 9.2, Section 13 items 6–7) — only the shape of the call and response the Decision Engine relies on.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 21.1 Safety/High-Risk Opportunity Admission Bypass | D1, D2 |
| 21.2 Candidate Disqualification Before Final Winner Selection | D1, D2 |
| 21.3 Final Independent Safety Evaluation During Decision Formation | D1, D2, TASK-006 (CD-T006-06) |
| 21.4 Safety Authority to Modify, Defer, or Block | D1, D3, Constitution, TASK-005 |
| 21.5 Conversion of Modified/Deferred/Blocked/Escalated Outcomes | D1, D2, TASK-006 (CD-T006-06) |
| 21.6 No Bypass, Downgrade, Reinterpretation, or Silent Suppression | D1, D2, D3 |
| 21.7 Behavior if the Safety Layer Is Unavailable or Returns an Invalid Response | D1, D2, D3, TASK-006 (CD-T006-05), Repository |
| 21.8 Safety Integration Port/Contract | D1, D3, TASK-006 (CD-T006-05) |

---

# 22. Decision Formation

## 22.1 Assembly from One Winning Candidate

The ordinary case: Decision Formation takes the single winning Candidate from Stage 8 and assembles it into a Terminal Decision of the same kind (Recommendation or Initiative), carrying that Candidate's rationale, confidence, and Hierarchy position forward (D2-PP-05 preservation), subject to Stage 9's own Safety review (Section 21.3).

## 22.2 Assembly from the Full Permitted Tied Set

Under the narrow multi-option exception (Section 19.3, Section 20.2), Decision Formation assembles the entire tied set into **exactly one** Terminal Decision carrying multiple user-selectable options — never multiple Terminal Decisions, and never a separate Expression event per tied Candidate (D2-EF-05, Canonical Decision 7: "Decision Formation SHALL process that set as a single pass, producing exactly one Terminal Decision that MAY contain multiple user-selectable options — never multiple passes and never multiple Terminal Decisions sharing a single Expression event").

## 22.3 Assembly from a Decision-Pass-Level Silence Determination

Where no Opportunity this cycle produced a surviving Candidate (Section 16.8), Decision Formation still runs, once, to assemble a single, fully-formed Silence Terminal Decision (D2-INV-05, D1-CDO-01) — carrying whatever trace Section 26 requires (which Opportunities were considered and their internal outcomes), but no winning-Candidate content, since none exists.

## 22.4 Assembly from a Safety-Modified, Deferred, Blocked, or Escalated Outcome (Canonical Decision CD-T006-06)

Where the Safety Layer's Stage-9 final review (Section 21.3/21.5) returns a disposition other than `UNMODIFIED`, Decision Formation applies the exact mapping fixed at Section 21.5: `MODIFIED` keeps the winning Candidate's original kind (`RECOMMENDATION`/`INITIATIVE`) and attaches a `modification` record; `DEFERRED` reforms the Terminal Decision to `kind: 'SILENCE'`; `BLOCKED` reforms it to `kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'`; `ESCALATED` reforms it to `kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'`. Every reformation happens *within* Stage 9's single execution, not as a separate subsequent pass or a second Terminal Decision (Section 24).

## 22.5 The Terminal Decision Contract's Minimum Required Fields

Per D1 Unit 15, D2 Unit 04 (Stage 9 Outputs), and **Canonical Decision CD-T006-06**: every Terminal Decision, regardless of which of the four paths above produced it, carries at minimum:

- **kind** — exactly one of `RECOMMENDATION`, `INITIATIVE`, `SILENCE`, or `BOUNDARY` — the four canonical decision families (Section 11, Section 25).
- **boundaryType** — `REFUSAL` or `ESCALATION`, present if and only if `kind === 'BOUNDARY'` (Section 24, Section 25).
- **rationale** — the statable reason (D1-RP-02, carried from the winning Candidate where one exists; independently stated for a Decision-Pass-level Silence per D1-SP-02's enumerated Silence reasons, Section 23).
- **confidence** — D1 Unit 11, preserved from the winning Candidate where one exists (D2-PP-05).
- **Canonical Decision Hierarchy position** — D1 Unit 02/07, preserved from the winning Candidate where one exists.
- **Candidate provenance** — `opportunityProvenance`, preserved unmodified (Section 16.6).
- **traceability** — sufficient to reconstruct which Stage produced which element, per D2 Unit 09 (Section 26).
- **multiple user-selectable options only under the narrow permitted exception** — present only when Section 22.2 applies; absent otherwise.

The full field-by-field contract is fixed at Section 25.

## 22.6 Prohibition on Incomplete Decisions

D1-CDO-03: "A generative or LLM layer SHALL express a decision already reached; it SHALL NOT originate the underlying decision, its priority, or its rationale." D2 Unit 04, Stage 9 Forbidden Actions: "SHALL NOT pass an incompletely-formed decision to Expression." Decision Formation does not hand an in-progress or partially-assembled Terminal Decision downstream — every field Section 22.5 requires is present, and correct for the path that produced it, before Expression is ever invoked.

## 22.7 Prohibition on More Than One Terminal Decision Per Decision Pass

D2 Unit 04, Stage 9 Forbidden Actions: "SHALL NOT independently form a separate Terminal Decision for an individual Opportunity's internal termination or Silence outcome... SHALL NOT form more than one Terminal Decision from a tied Candidate set — the narrow multi-option exception SHALL always be assembled into exactly one Terminal Decision, never several." This is the same rule stated at Section 9.1 and Section 13 item 19, restated here as Stage 9's own binding constraint on its own output.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 22.1 Assembly from One Winning Candidate | D1, D2 |
| 22.2 Assembly from the Full Permitted Tied Set | D2 |
| 22.3 Assembly from a Decision-Pass-Level Silence Determination | D1, D2 |
| 22.4 Assembly from a Safety-Modified, Deferred, Blocked, or Escalated Outcome | D1, D2, TASK-006 (CD-T006-06) |
| 22.5 The Terminal Decision Contract's Minimum Required Fields | D1, D2, TASK-006 (CD-T006-06) |
| 22.6 Prohibition on Incomplete Decisions | D1, D2 |
| 22.7 Prohibition on More Than One Terminal Decision Per Decision Pass | D2 |

---

# 23. Silence Semantics

D1-SP-01 fixes the governing principle for every path below: "Silence SHALL be treated as a first-class, deliberately reasoned decision outcome — never an absence of a decision, and never a failure state." The five paths below are distinguished precisely because they are not interchangeable — each has a different relationship to Stage 9 and to Terminal Decision status. A sixth situation also produces `kind: 'SILENCE'` but is not itself a distinct "path" in the sense of 23.1–23.5: per **Canonical Decision CD-T006-06** (Section 21.5, Section 22.4), a Safety Layer `DEFERRED` disposition at Stage 9's final review reforms an already-winning Candidate's Terminal Decision to `kind: 'SILENCE'`. This is documented in full at Section 22.4 and Section 24, not repeated below, because unlike 23.1–23.5 it presupposes a winning Candidate already existed and reached Stage 9 — it is a Safety-driven reformation, not a zero-Candidate or ineligibility outcome.

## 23.1 Stage 4 Internal Termination

- **Internal or terminal:** internal. D2-EF-03: "An Evidence Evaluation failure SHALL cause that Opportunity to terminate internally (D1-SP-02) — an internal orchestration outcome, not an independent Terminal Decision."
- **Is Stage 9 entered:** not on account of this Opportunity alone; if other Opportunities this cycle produce surviving Candidates, Stage 9 runs for the Decision Pass as a whole regardless.
- **Trace preserved:** the Evidence Hierarchy tier reached and the insufficiency determination (D2 Unit 09).
- **Output produced:** none for this Opportunity individually.
- **Is Expression invoked:** no, for this Opportunity.
- **Duplicate/multiple prevention:** each Opportunity terminates independently; no cross-Opportunity aggregation of Stage-4 failures into a single reported outcome is performed, since none of them is itself a Terminal Decision to aggregate.
- **Note:** Stage 4 is not owned by the Decision Engine (Section 9.2); this subsection is documented for completeness of the Silence taxonomy, not as a Decision-Engine-owned behavior.

## 23.2 Stage 5 Ineligible Opportunity

- **Internal or terminal:** internal. Section 15.7: an ineligible Opportunity "resolves to Silence internally... it is not itself a Terminal Decision."
- **Is Stage 9 entered:** not on account of this Opportunity alone (same as 23.1).
- **Trace preserved:** which of D1-IE-01's valid reasons was absent, or which specific eligibility check (Trust Test, reduced-frequency adjustment) failed (Section 15.10).
- **Output produced:** none for this Opportunity individually.
- **Is Expression invoked:** no.
- **Duplicate/multiple prevention:** each Opportunity's Stage-5 determination is independent; no aggregation into a single reported outcome.

## 23.3 Stage 6 Zero-Candidate Opportunity

- **Internal or terminal:** internal. D2-EF-04: "If Candidate Generation produces zero Candidates for an eligible Opportunity, that Opportunity resolves to Silence internally (D1-RP-02, D1-CDO-02) — an internal orchestration outcome, not an independent Terminal Decision."
- **Is Stage 9 entered:** not on account of this Opportunity alone.
- **Trace preserved:** that the Opportunity was eligible but its assigned Stage-6 engine (Recommendation or Initiative) produced no Candidate — not itself a Decision-Engine-owned determination to explain further, since it originates upstream (Section 9.2).
- **Output produced:** none for this Opportunity individually.
- **Is Expression invoked:** no.
- **Duplicate/multiple prevention:** independent per Opportunity, as above.

## 23.4 Decision-Pass-Level Zero Surviving Candidates

- **Internal or terminal:** **terminal.** This is the sole per-cycle (not per-Opportunity) Silence path that itself constitutes a Terminal Decision. D2-INV-05: "Where no Opportunity detected this cycle produces a surviving Candidate, Decision Formation SHALL still run, once, to produce a fully-formed Silence Terminal Decision for the Decision Pass; the Decision Pass SHALL NOT simply stop without one." D2-PP-04 restates this as a SHALL rule identically.
- **Is Stage 9 entered:** **yes** — this is the defining feature distinguishing 23.4 from 23.1–23.3. Per D2-EF-02, the sole case in which Stage 9 is *not* entered at all is "No Opportunity" (zero Opportunities detected, Section 31) — a distinct, earlier-terminating case from 23.4, in which one or more Opportunities *were* detected but none produced a surviving Candidate.
- **Trace preserved:** per D2 Unit 09, "for a Decision-Pass-level Silence, every Opportunity considered and its internal outcome" — i.e., the aggregated trace of every 23.1/23.2/23.3 outcome that occurred this cycle (Section 26).
- **Output produced:** one fully-formed Silence Terminal Decision, carrying the fields Section 22.5/25 require, with no winning-Candidate content (none exists).
- **Is Expression invoked:** per D2 Unit 04, Stage 10 Outputs: "no user-facing output for a Silence kind" — Expression is invoked with the Silence Terminal Decision (Stage 10 still runs), but produces no user-facing message.
- **Duplicate/multiple prevention:** D2-PP-04/D2-INV-05 fix that this path produces exactly one Silence Terminal Decision per Decision Pass, never one per Opportunity that individually resolved to an internal outcome — the per-Opportunity outcomes of 23.1/23.2/23.3 are aggregated into this single Decision Pass-level output, not each independently reported as its own Silence.

## 23.5 All Candidates Disqualified by Safety

- **Internal or terminal:** this path's Stage-9 disposition depends on D1 Unit 14's application (Section 24) — it resolves to a Decision-Pass-level Silence Terminal Decision (`kind: 'SILENCE'`, terminal, structurally identical to 23.4's output shape) or to a Boundary/Refusal Terminal Decision (`kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'`), depending on what D1 Unit 14 requires for the specific disqualification reason. D2 Unit 04, Stage 8 Exit Criteria: "If every Candidate is disqualified by the Safety Layer, the cycle SHALL resolve to Silence or refusal at Decision Formation, as D1 Unit 14 requires" — D2's own text names exactly these two outcomes for this specific path (never escalation, which per Canonical Decision CD-T006-06 is reserved to a Stage-9 `ESCALATED` disposition on an already-formed pre-review Terminal Decision, Section 21.5, a structurally distinct situation from an all-disqualified Stage-8 pool). D2 itself does not fix which of Silence or Refusal applies in every all-disqualified case; that determination is D1 Unit 14's (and, functionally, the Safety Layer's own reasoning, which the Decision Engine does not inspect, Section 21.7).
- **Is Stage 9 entered:** **yes** — one or more Candidates existed (they reached Stage 8), so Stage 9 is entered exactly as in 23.4.
- **Trace preserved:** which Candidates were disqualified and (to the extent the Safety Layer's determination discloses it) why, per D2 Unit 09's explicit requirement to trace "which Candidates were disqualified and why."
- **Output produced:** one Terminal Decision, either `kind: 'SILENCE'` or `kind: 'BOUNDARY'`/`boundaryType: 'REFUSAL'`, depending on D1 Unit 14's application to this specific case.
- **Is Expression invoked:** yes for a Boundary/Refusal kind (a user-facing message is produced, per D2 Unit 04 Stage 10 Outputs: "the user-facing message, for Recommendation/Initiative/refusal kinds"); no user-facing output for a Silence-shaped outcome, exactly as 23.4.
- **Duplicate/multiple prevention:** exactly one Terminal Decision, never one per disqualified Candidate.

Under no circumstance does the Decision Engine create an independent Terminal Decision for each Opportunity that terminates internally (23.1–23.3) — Sections 23.1 through 23.3 explicitly document paths that are *not* Terminal Decisions at all, precisely to prevent that conflation.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 23.1 Stage 4 Internal Termination | D1, D2 |
| 23.2 Stage 5 Ineligible Opportunity | D1, D2 |
| 23.3 Stage 6 Zero-Candidate Opportunity | D1, D2 |
| 23.4 Decision-Pass-Level Zero Surviving Candidates | D1, D2 |
| 23.5 All Candidates Disqualified by Safety | D1, D2 |

---

# 24. Refusal, Deferral, Modification, and Escalation

## 24.1 Permitted Resulting Terminal Decision Kinds (Canonical Decision CD-T006-06)

D1 Unit 15 fixes exactly four Canonical Decision kinds: Recommendation, Initiative, Silence, or "a refusal or escalation (Unit 14)." **Canonical Decision CD-T006-06 fixes the exact, non-contradictory realization of this fourth kind**: it is a single family, `BOUNDARY`, carrying a required `boundaryType` of `REFUSAL` or `ESCALATION` — not two separate top-level kinds, and not a fifth or sixth kind of any name. The Safety Layer's Stage-9 disposition (Section 21.5/21.8) maps to this model deterministically:

- **`MODIFIED`** → the Terminal Decision keeps its **original kind** (`RECOMMENDATION` or `INITIATIVE`) — the modification's substance originates from the Safety Layer, not from the Decision Engine re-authoring the Candidate itself, and is carried in a `modification` record (Section 25); `MODIFIED` never produces a `BOUNDARY` kind.
- **`DEFERRED`** → reformed to **`kind: 'SILENCE'`** — D1-AB-05's "defer" disposition resolves this cycle without delivering the original content, using the same Terminal Decision shape as a Decision-Pass-level Silence (Section 23, Section 25); a deferral is never a `BOUNDARY` kind.
- **`BLOCKED`** → reformed to **`kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'`** — D1-AB-03: "The coach MAY refuse a request that conflicts with a safety or health principle... framed as protective, not judgmental."
- **`ESCALATED`** → reformed to **`kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'`** — D1-AB-02's professional-referral threshold, or a Constitution Ch.23 §23.7 high-risk-symptom Opportunity's Stage-9 disposition.

This document does not invent a fifth Terminal Decision kind, and does not invent a `boundaryType` value beyond `REFUSAL`/`ESCALATION`.

## 24.2 Required Rationale and Traceability

Every `BOUNDARY`-kind and every Safety-`DEFERRED`/`MODIFIED` Terminal Decision carries a statable rationale exactly as any other Terminal Decision kind does (D1-RP-02, applied via D1-CDO-02's general rule; Section 22.5) — the rationale for a `MODIFIED` outcome states that a Safety determination was applied, without requiring the Decision Engine to reproduce the Safety Layer's own internal reasoning (which it does not have access to, Section 21.7).

## 24.3 Preservation of the Original Candidate and Safety Determination as Evidence

The winning Candidate that triggered a `MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED` determination, and the determination itself, are preserved as part of the Terminal Decision's trace (D2 Unit 09: "any Safety Layer intervention... is itself the complete and sufficient trace for why those Stages' outputs are absent," applied here to why the original kind was superseded) — the original Candidate's content is not discarded merely because it did not survive Safety review `UNMODIFIED`; it remains part of the record Decision Formation assembles (Section 26).

## 24.4 User-Autonomy and Honesty Requirements

D1-AB-03: a refusal "SHALL be framed as protective, not judgmental, and SHALL offer a safer alternative where one exists." D1-ER-05/06: confidence and uncertainty are communicated honestly; no manufactured certainty or false reassurance. These requirements bind primarily at Expression (Stage 10, wording) rather than Decision Formation (Stage 9, content) — Decision Formation's responsibility is to ensure the Terminal Decision it hands to Expression carries whatever structured information (e.g., a safer-alternative reference, where the Safety Layer's determination supplies one) Expression would need to honor them; Decision Formation does not itself generate the protective, non-judgmental phrasing (D1-CDO-03).

## 24.5 No Disguised Recommendation After a Block

Where the Safety Layer returns `BLOCKED`, Decision Formation does not silently substitute a different, unblocked Candidate in its place and present it as though it were the original winner — per D1-DI-02 (extended architecturally by D3 §12.3), no fabricated content stands in for a genuine block. The Terminal Decision is explicitly formed as `kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'` (or, where the disposition is `ESCALATED`, `boundaryType: 'ESCALATION'`), not quietly reframed as an ordinary Recommendation/Initiative that happens to avoid the blocked content.

## 24.6 No Fabricated Fallback Candidate

Per D2-EF-06 ("no Terminal Decision SHALL be fabricated") and D3 §12.3 ("the architecture SHALL NOT substitute a default Terminal Decision"), the Decision Engine never invents a Candidate that was not actually produced by the Recommendation Engine or Initiative Engine at Stage 6, and never invents Terminal Decision content, to fill the gap left by an all-disqualified or `BLOCKED` outcome. Section 20.5/23.5's Silence-or-Boundary/Refusal resolution is the entire permitted response to this situation.

## 24.7 Separation Between Decision Formation and Expression Wording

D1-CDO-03 (restated throughout this document, most directly at Section 22.6): Decision Formation assembles the Terminal Decision's *content* — kind, `boundaryType` where applicable, rationale, confidence, Hierarchy position, and whatever structured data the Boundary decision carries; Expression (Stage 10, out of this task's scope, Section 30) is exclusively responsible for the *wording* a user ultimately sees. This separation applies with the same force to a `BOUNDARY`-kind Terminal Decision as to any other kind — the Decision Engine does not draft, phrase, or soften refusal/escalation language; it produces the structured decision Expression will later render.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 24.1 Permitted Resulting Terminal Decision Kinds | D1, TASK-006 (CD-T006-06) |
| 24.2 Required Rationale and Traceability | D1, D2 |
| 24.3 Preservation of the Original Candidate and Safety Determination | D2 |
| 24.4 User-Autonomy and Honesty Requirements | D1 |
| 24.5 No Disguised Recommendation After a Block | D1, D3 |
| 24.6 No Fabricated Fallback Candidate | D2, D3 |
| 24.7 Separation Between Decision Formation and Expression Wording | D1 |

---

# 25. Terminal Decision Contract (Corrected — Canonical Decision CD-T006-06)

Reusing TASK-004's CC-02/CC-03 and TASK-005's `InitiativeCandidate` shapes (Section 10.4) as the structural precedent, and applying Canonical Decision CD-T006-06's exact four-family model (Section 21.5, 22.4, 24.1), this document fixes the Terminal Decision object Stage 9 produces. This corrected contract replaces, without ambiguity or residual contradiction, any five-kind or Stage-9-modify/defer/block-reforms-to-refusal/escalation reading of D2 Unit 04's more general text — CD-T006-06 is the exact, binding realization of D1 Unit 15's fourth "refusal or escalation" kind for TASK-006:

```
TerminalDecision {
  kind: 'RECOMMENDATION' | 'INITIATIVE' | 'SILENCE' | 'BOUNDARY',
    // exactly four canonical decision families (D1 Unit 15's four Canonical Decision kinds,
    // with D1 Unit 14's "refusal or escalation" realized as the single BOUNDARY family,
    // per CD-T006-06). No fifth value, and no separate top-level REFUSAL/ESCALATION kind,
    // is ever valid.

  boundaryType: 'REFUSAL' | 'ESCALATION',   // required if and only if kind === 'BOUNDARY';
                                             // absent for every other kind (Section 24.1)

  rationale: {                              // required for every kind, including SILENCE
    rationale: <statable reason>,           // D1-RP-02 / D1-SP-02's enumerated Silence
                                             // reasons / D1-AB-03's protective framing basis
    evidenceBasis: <Evidence Hierarchy tier + basis>,
    expectedValue: <D1-IP-03/D1-RP-01 value dimension(s), where applicable>,
    uncertainty: <confidence caveat, honestly stated>
  },

  confidence: <0..1>,                       // required for RECOMMENDATION/INITIATIVE kinds
                                             // (including a MODIFIED outcome, which keeps its
                                             // original kind); preserved from the winning
                                             // Candidate (D2-PP-05). Not independently
                                             // meaningful, and therefore absent, for SILENCE
                                             // (no winning Candidate exists for a Decision-
                                             // Pass-level Silence, Section 23.4) or BOUNDARY
                                             // (Safety authority, not confidence, governs)

  hierarchyTier: <Canonical Decision Hierarchy tier, 1-10>,   // D1 Unit 02/07; preserved from
                                             // the winning Candidate where one exists; absent
                                             // under the same conditions as confidence, above

  candidateProvenance: [ opportunityProvenance, ... ],  // one entry per Candidate that
                                             // contributed (the winner; every Candidate in a
                                             // tied set; the original Candidate a MODIFIED/
                                             // DEFERRED/BLOCKED/ESCALATED disposition
                                             // superseded); array, not a single object, to
                                             // support the multi-option case (below) and the
                                             // Silence-trace case (Section 23.4); empty array
                                             // only for a Decision-Pass-level Silence produced
                                             // from zero surviving Candidates across the pass

  options: [ InitiativeCandidate | RecommendationCandidate, ... ],  // present ONLY under the
                                             // narrow multi-option exception (Section 19.3,
                                             // 22.2); absent for every other kind. Each entry
                                             // is the full winning-tied Candidate object,
                                             // unmutated (Section 20.6)

  modification: {                           // present ONLY when the Safety Layer's Stage-9
                                             // final review returned MODIFIED (Section 21.5);
                                             // absent for every other disposition. kind stays
                                             // RECOMMENDATION/INITIATIVE when this is present —
                                             // MODIFIED never produces BOUNDARY or SILENCE
    modifiedContent: <object>,              // the Safety Layer's own modified content, per the
                                             // Safety Integration Port's SafetyReviewResult
                                             // (Section 21.8) — not authored by the Decision
                                             // Engine itself
  },

  safetyDisposition: {                      // required whenever the Safety Integration Port's
                                             // finalReview() was actually called this Decision
                                             // Pass (i.e., a winning Candidate or tied set
                                             // reached Stage 9); absent only for a Decision-
                                             // Pass-level Silence formed from zero surviving
                                             // Candidates (Section 23.4), since finalReview()
                                             // is never called when there is no Candidate
                                             // content for Safety to review (Section 21.8)
    disposition: 'UNMODIFIED' | 'MODIFIED' | 'DEFERRED' | 'BLOCKED' | 'ESCALATED',
    originalKind: <the winning Candidate's kind before this disposition's mapping applied>
  },

  decisionPassTrace: {                      // required for every kind (Section 26)
    opportunitiesConsidered: [ { opportunityId, sourceCategory, internalOutcome }, ... ],
    candidatePoolSize: <integer>,
    disqualifiedCandidates: [ opportunityProvenance, ... ]   // empty array if none
  },

  immutable: true                            // required — matches D2-PP-05's preservation
                                             // discipline and the Delivery Intent immutability
                                             // philosophy (D3 §8.6) this contract feeds into
}
```

## 25.1 Required Fields

`kind`, `rationale` (all four sub-fields), `decisionPassTrace`, `immutable`. `boundaryType` is required if and only if `kind === 'BOUNDARY'`. `safetyDisposition` is required whenever the Safety Integration Port's `finalReview()` was actually invoked this Decision Pass (Section 21.8) — i.e., for every kind except a Decision-Pass-level Silence produced from zero surviving Candidates (Section 23.4). `confidence` and `hierarchyTier` are required for `RECOMMENDATION`/`INITIATIVE` kinds (preserved from the winning Candidate, including a `MODIFIED` outcome); they are not independently meaningful, and are therefore absent, for `SILENCE` or `BOUNDARY`. `candidateProvenance` is required whenever at least one Candidate existed this cycle (every kind except a Decision-Pass-level Silence produced from zero surviving Candidates across the whole pass, per Section 23.4, where it is an empty array).

## 25.2 Optional Fields

`options` (multi-option kind only, Section 22.2); `modification` (a `MODIFIED` Safety disposition only, Section 21.5).

## 25.3 Allowed Kinds

Exactly `RECOMMENDATION`, `INITIATIVE`, `SILENCE`, `BOUNDARY` — no other value is valid (Section 13 item 18; D1 Unit 15; Canonical Decision CD-T006-06). `boundaryType` is exactly `REFUSAL` or `ESCALATION` when present.

## 25.4 Invariants

- Exactly one `TerminalDecision` object exists per Decision Pass in which Stage 9 is entered (Section 22.7).
- `options` is present if and only if the narrow multi-option exception applies (Section 19.3).
- `boundaryType` is present if and only if `kind === 'BOUNDARY'`; every other kind carries no `boundaryType` field at all (not `null` — absent).
- `modification` is present if and only if `safetyDisposition.disposition === 'MODIFIED'`.
- `safetyDisposition.disposition === 'DEFERRED'` always co-occurs with `kind === 'SILENCE'`; `'BLOCKED'` always co-occurs with `kind === 'BOUNDARY'`/`boundaryType === 'REFUSAL'`; `'ESCALATED'` always co-occurs with `kind === 'BOUNDARY'`/`boundaryType === 'ESCALATION'` — CD-T006-06's mapping (Section 21.5) is enforced as a hard, testable invariant of this contract, never merely a suggestion (Section 35.9).
- `confidence` and `hierarchyTier`, where present, are the values preserved from the winning Candidate, never independently recomputed (D2-PP-05).

## 25.5 Validation Rules

A `TerminalDecision` missing a required field (Section 25.1), or violating any Section 25.4 invariant (for example, `kind: 'SILENCE'` co-occurring with `safetyDisposition.disposition: 'BLOCKED'`), is not a valid output of Stage 9 — per Section 22.6, Decision Formation does not hand an incompletely-formed or internally-contradictory decision to Expression; a validation failure at this boundary is a failure condition (Section 31), not a deliverable Terminal Decision.

## 25.6 Immutability Expectations

Once assembled, a `TerminalDecision`'s fields are not mutated by any later Stage — Expression (Stage 10) renders it into a Delivery Intent without altering its content (D1-CDO-03; D3 §8.6), and Feedback Processing/Evidence Update/Memory Update (Stages 11–13, Memory Layer) act on the classified user response to it, never on the object itself.

## 25.7 Provenance and Trace Fields

`candidateProvenance` and `decisionPassTrace` together satisfy D2 Unit 09's traceability requirements (Section 26) — the former identifies which Candidate(s) produced the decision; the latter identifies every Opportunity considered this cycle and their internal outcomes, satisfying the Decision-Pass-level Silence trace requirement (Section 23.4) even when no winning Candidate exists.

## 25.8 Confidence Representation

A single scalar in `[0, 1]`, identical in shape to `RecommendationCandidate.confidence`/`InitiativeCandidate.confidence` (Section 10.4) — preserved, not reinvented (Section 25.4).

## 25.9 Hierarchy Representation

A single integer, 1–10, identical in shape to `RecommendationCandidate.hierarchyTier`/`InitiativeCandidate.hierarchyTier` — preserved, not reinvented.

## 25.10 Tied-Option Representation

The `options` array (Section 25 above), each entry the full, unmutated winning-tied Candidate object — satisfying Canonical Decision 7's requirement that the narrow exception be "assembled into one Terminal Decision carrying multiple user-selectable options" without inventing a second, summarized representation of each option.

## 25.11 Refusal/Escalation Representation

The `kind: 'BOUNDARY'` value together with its required `boundaryType` (`REFUSAL` or `ESCALATION`), together with the required `safetyDisposition` object (Section 25 above) — satisfying Section 24's requirement that the original Candidate and Safety determination remain part of the record. `REFUSAL` and `ESCALATION` are sub-values of one family, never two independent top-level kinds (Canonical Decision CD-T006-06).

## 25.12 Silence Representation

The `kind: 'SILENCE'` value — produced either from a Decision-Pass-level zero-surviving-Candidates outcome (Section 23.4, `decisionPassTrace.opportunitiesConsidered` carrying every Opportunity's internal outcome this cycle, `candidateProvenance` empty, `safetyDisposition` absent since Safety's `finalReview()` was never called) or from a Safety `DEFERRED` disposition on an already-formed pre-review Terminal Decision (Section 21.5, 22.4, `candidateProvenance` populated with the deferred Candidate's provenance, `safetyDisposition.disposition: 'DEFERRED'` present). For the "all disqualified, resolves to Silence" path of Section 23.5, `candidateProvenance` is populated with the disqualified Candidates' provenance even though none of them won, and `safetyDisposition` is present per the general rule above.

## 25.13 Versioning or Compatibility Rules Where Required

Consistent with `memoryLayer.js`'s existing `schemaVersion` pattern (`'coach-decision-system-pipeline-context/1.0'`, Section 10.4), a `TerminalDecision` contract of this shape would carry an equivalent `schemaVersion` field at implementation time; this document does not fix the literal version string, which is an implementation-level detail consistent with the existing repository convention, not a canonical requirement.

This contract carries no platform, UI, notification, chat, card, widget, voice, or push field of any kind — consistent with D3 §8.6's requirement that Expression alone, downstream of this contract, introduces platform-specific concerns via the separately-defined Delivery Intent (Section 30).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Terminal Decision Contract (25.1–25.13) | D1, D2, D3, TASK-004, TASK-005, TASK-006 (CD-T006-06) |

---

# 26. Explainability and Traceability

Per D2 Unit 09 (Pipeline Traceability), the following must be determinable for every Decision Pass in which Stage 9 is entered:

- **Which Opportunities were evaluated** — recorded in `decisionPassTrace.opportunitiesConsidered` (Section 25).
- **Which Opportunities failed eligibility** — each such Opportunity's entry carries `internalOutcome: 'INELIGIBLE'` with the Section 15.10 trace (valid-reason absence, Trust Test failure, or reduced-frequency adjustment).
- **Which Candidates were generated** — attributable to Stage 6, upstream of the Decision Engine (Section 9.2); the Decision Engine's own trace begins at pool assembly (Section 16), where it records which Candidates it received.
- **Which Candidates entered the shared pool** — the validated, admitted subset (Section 16.3); a Candidate rejected at pool-assembly time (Section 16.3, Section 14.9) is recorded as rejected, with the reason, not silently dropped from the trace.
- **How each Candidate was ranked** — the D1-PR-01 through D1-PR-06 sequence's outcome for each Candidate, per D2-TR-01: "Every Terminal Decision's kind, rationale, confidence, and Hierarchy position SHALL each be logically attributable to the specific Stage that produced it."
- **Which canonical rules affected ordering** — which of D1-PR-01/02/03/04/06 actually distinguished the final ordering, versus which criteria were reached but did not distinguish (consistent with Section 19.1's "stops at the first criterion that produces a difference").
- **Which Candidates were disqualified and why** — `decisionPassTrace.disqualifiedCandidates`, populated from the Safety Layer's Stage-8 determination (Section 21.2); "why" is recorded to the extent the Safety Layer's determination discloses it (Section 21.7 — the Decision Engine does not fabricate a reason the Safety Layer did not supply).
- **Why the winner or tied set was selected** — the final D1-PR-06 tie-break outcome (resolvable) or the explicit basis for invoking the narrow exception (genuinely unresolved, Section 19.2/19.3).
- **Why Silence or refusal occurred** — Section 23 (which of the five Silence paths, the Safety-`DEFERRED` path, and for 23.4/23.5, the full aggregated per-Opportunity trace) or Section 24 (which of the five Safety dispositions, per Canonical Decision CD-T006-06's mapping, triggered the reformation).
- **What Safety evaluation occurred** — the disqualification pass at Stage 8 and the final review at Stage 9, both invoked through the Safety Integration Port (Section 21.8) and each recorded per Section 21, even when the outcome was `UNMODIFIED` (an evaluation that ran and produced no change is still a recorded evaluation, not an absent one) — `decisionPassTrace`/`safetyDisposition` (Section 25) are the fields this trace populates.
- **Which Terminal Decision was formed** — the completed `TerminalDecision` object itself (Section 25).

Per D2-TR-05: where a Stage is bypassed by a canonical short-circuit or a Safety Layer function (for example, Stage 5 for a safety/high-risk-triggered Opportunity, Section 15.5), traceability does not require that Stage's output — the bypass itself, and the rule that caused it, constitute the complete and sufficient trace for that Stage's absence. Traceability for a Decision Pass is complete once every Stage that actually executed is attributed; a correctly-bypassed Stage's absence of output is never treated as a traceability gap.

Per D2-TR-03: traceability from a Feedback Type back to the Terminal Decision it responds to is not required at finer granularity than the grouped-context correlation model C3 already established as sufficient — this document does not introduce, and is not read as requiring, per-instance correlation beyond that accepted limitation (this specific requirement belongs to Feedback Processing, Stage 11, a Memory Layer responsibility outside this task's scope, Section 9.2/29, but the Decision Engine's own trace output must remain structurally compatible with it).

Per D2-TR-06: where the narrow multi-option exception applies, traceability attributes the full tied Candidate set and the Prioritization/Winner Selection reasoning to the single resulting Terminal Decision — never to multiple Terminal Decisions.

Traceability is useful for tests and review without leaking sensitive user data into logs — consistent with D1-MU-05 ("SHALL NOT retain personal details that carry no coaching value") and B3's least-privilege discipline (Section 33): trace output favors rule identifiers, Opportunity/Candidate provenance references, and Hierarchy-tier/Evidence-tier values over raw sensitive payload content wherever the former suffices, exactly as TASK-005 §28 records for the Initiative Engine's own trace output.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Explainability and Traceability | D1, D2, D3, C3, TASK-005 |

---

# 27. Determinism and Immutability

## 27.1 Stable Ordering

Given an identical Candidate pool and identical Safety Layer determinations, Stage 7's application of D1-PR-01 through D1-PR-06 must produce the identical ordering on every evaluation — no reliance on object-insertion order, hash-iteration order, or any other non-deterministic collection-traversal behavior beyond what the fixed lexicographic ordering (Section 17.7) itself specifies.

## 27.2 Deterministic Tie Handling

Section 19.2's resolvable/genuinely-unresolved distinction is itself deterministic: the same pool, evaluated twice, must reach the same conclusion about whether a given tie is resolvable, and, where resolvable, must resolve it identically both times (Section 20.7).

## 27.3 Immutable Pipeline Context Consumption

Per D2-PP-02 (restated at Section 14.4/29): Pipeline Context is assembled once, by the Memory Layer, and is immutable for the remainder of the Decision Pass. The Decision Engine reads it without mutation across Stages 5, 7, 8, and 9 — the same Pipeline Context object is valid throughout a single Decision Pass's Decision Engine processing.

## 27.4 Immutable Candidate Consumption After Generation

Per D2-PP-05 (Section 16.5, Section 20.6): a Candidate's fields, once produced at Stage 6, are validated and preserved, not arbitrarily recomputed, by Stages 7, 8, and 9. The Decision Engine never writes back to a Candidate object it receives.

## 27.5 Immutable Terminal Decision After Formation

Per Section 25.6: once Decision Formation assembles a `TerminalDecision`, no later Stage (Expression, Feedback Processing, Evidence Update, Memory Update) mutates it.

## 27.6 Idempotent Repeated Evaluation Where Inputs Are Unchanged

Re-running Stages 5, 7, 8, and 9 against an identical Pipeline Context and Candidate pool must produce an identical Terminal Decision — consistent with D2 Unit 10's Repeatability criterion: "The same Pipeline Context, replayed, SHALL produce a Terminal Decision of the same kind, rationale, confidence, and Canonical Decision Hierarchy position, with the same Stage-by-stage attribution."

## 27.7 Prevention of Hidden Randomness

No Stage the Decision Engine owns introduces randomness (random tie-breaking, random sampling of the Candidate pool, etc.) — every ordering and selection decision is fully determined by the canonical rules fixed in Sections 15/17/19/20/22.

## 27.8 Prevention of Time-Dependent Behavior Unless Time Is an Explicit Input

Where timing quality (D1-PR-06(c)) or triggering-evidence recency (D1-PR-06(d)) inform tie-breaking, the relevant time values must arrive as explicit fields on the Opportunity/Candidate/Pipeline Context (e.g., `detectedAt`, already present on both engines' current Opportunity contracts per Section 10.4) — the Decision Engine does not read the system clock directly inside its own Stage 5/7/8/9 logic to determine "now," consistent with TASK-005 §28's identical requirement for the Initiative Engine ("any time-sensitivity... must be expressed as an explicit field... not read from the system clock inside the engine").

## 27.9 Explicit Handling of Clock/Time-Zone Data

Any timestamp field the Decision Engine consumes (`detectedAt`, `assembledAt` on Pipeline Context, Section 10.4) is treated as an opaque, already-resolved numeric or ISO value supplied upstream — the Decision Engine performs no timezone conversion, localization, or clock-skew correction of its own; any such normalization, if required, belongs to the component that originates the timestamp (Memory Layer for `assembledAt`; the Stage-3-contributing engine for `detectedAt`).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Determinism and Immutability | D1, D2, TASK-005 |

---

# 28. Composite Engine and Pipeline Integration

## 28.1 Invocation by the Existing Internal Pipeline Orchestrator

Per D3 §6.1: "The handoffs shown between Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, and Expression above are coordinated by an Internal Pipeline Orchestrator: an internal execution mechanism of the Composite Engine that sequences the already-defined D2 Stages across these six collaborators." The Decision Engine, like the Recommendation and Initiative Engines before it, is invoked by the Orchestrator, not by `js/app.js` or `runAppReadyEngines()` directly, and not by the Coach layer directly (consistent with TASK-004 §Runtime Placement and TASK-005 §26's identical framing for their own respective components).

## 28.2 Stage Entry and Exit Contracts

Exactly as fixed at D2 Unit 04 for Stages 5, 7, 8, and 9 (reproduced and applied throughout Sections 15/17/19/20/22 above) — Entry Criteria gate when each Stage may run; Exit Criteria fix what each Stage hands to the next.

## 28.3 Handoff from Recommendation and Initiative Engines

Per Section 16: the Decision Engine's Stage 7 responsibility receives the full Candidate pool from both Stage-6 producer engines' output this cycle — the existing `runForOpportunity`/`runForInitiativeOpportunity` Orchestrator functions (Section 10.2) are, per their own code comments, "exposed for future Decision Engine or tests," directly anticipating this handoff.

## 28.4 Safety Layer Calls

Per Section 21: at Stage 8 (disqualification) and Stage 9 (final review) — both checkpoints the Safety Layer collaborator, once built, exposes; the Decision Engine calls into it at exactly these two points, and at no other point.

## 28.5 Handoff to Expression

Per Section 22.6/30: the completed `TerminalDecision` object is handed to Expression (Stage 10) as the Decision Engine's final output for a given Decision Pass.

## 28.6 No Second Orchestrator

Per D3 §11.1: "The Internal Pipeline Orchestrator... may only sequence D2 Stage execution across the six internal collaborators; it SHALL NOT itself generate Candidate content, rank, select a winner, form a Terminal Decision, or produce a Delivery Intent." The Decision Engine does not itself sequence other collaborators, does not invoke the Recommendation/Initiative Engines directly (it only receives their already-produced output via the Orchestrator's handoff), and introduces no second execution-coordination mechanism alongside the existing Orchestrator.

## 28.7 No New B2 Engine Registry Entry

Per D3 §17 Decision 1 and §11.1: the Decision Engine is an internal collaborator of the single, already-registered `coachDecisionSystem` Composite Engine — `registerCoachDecisionSystem.js`'s existing single `register()` call (Section 10.2/10.7) already covers it; no new `register()` call, no new engine id, is introduced.

## 28.8 No New Trigger Type

Per D3 §7.1 Decision 2 (reused unchanged by TASK-004 and TASK-005): the existing B2 Trigger Catalog (`APP_READY`, `AUTH_SESSION_READY`, the ad hoc `SOURCE_DATA_CHANGED`/`WORKOUT_COMPLETED` path) governs Decision Pass entry; TASK-006 introduces no new trigger.

## 28.9 No Direct Coach Runtime Invocation

Per D3 §10.4/§11.1: the Decision Engine has no knowledge of, and no invocation path to, the Coach Runtime (`js/coach/*`, `js/trigger/*`) — its sole downstream handoff is to Expression, which is itself distinct from the Coach Runtime (Section 30).

## 28.10 Compatibility with Existing TASK-004 and TASK-005 Wiring

The Decision Engine's Stage 5/7/8/9 responsibilities compose with, and do not require modification to, `recommendationEngine.js`'s or `initiativeEngine.js`'s existing public contracts (`generate(request)`, unchanged), `memoryLayer.js`'s existing `assembleContext()` output shape (read as-is, Section 29), or `registerCoachDecisionSystem.js`'s existing single registration. Any change this task genuinely requires to `internalPipelineOrchestrator.js` (to wire Stage 5/7/8/9 into `run()`'s currently-unconditional `candidates: []` path) is an additive extension, structurally parallel to how TASK-005 added `runForInitiativeOpportunity`/`detectInitiativeOpportunities` without altering `run()`'s or `runForOpportunity()`'s existing contracts (Section 34).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Composite Engine and Pipeline Integration | D3, B2, TASK-004, TASK-005, Repository |

---

# 29. Memory, State, and Persistence Boundaries

## 29.1 Pipeline Context as the Only Approved Assembled Context Input

Per D3 §8.1/§11.1 (restated identically for the Recommendation and Initiative Engines at TASK-004/TASK-005): "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context." The Decision Engine reads Pipeline Context exclusively as delivered by the Memory Layer's `assembleContext()` output (Section 10.4/14.4); it does not reassemble, supplement, or independently re-derive any portion of it.

## 29.2 Memory Layer Ownership of Reads and Context Assembly

Per D3 §17 Decision 3: "Pipeline Context Assembly is an internal responsibility of the Memory Layer, not an independent or shared architectural owner." This ownership is unaffected by TASK-006 — the Decision Engine introduces no change to `memoryLayer.js`'s Context Assembly responsibility (Stages 1–2), and no new Pipeline Context field this document requires (none is identified; Section 14.4's existing field set already suffices for Stage 5/7/8/9's canonical requirements).

## 29.3 StateAccess Boundary

Per B3 and Section 10.6: the Decision Engine has no StateAccess capability of its own — no `engineId`/`action` permission-matrix entry is added for it, exactly as neither the Recommendation Engine nor the Initiative Engine has one beyond the Memory Layer's own single `coachDecisionSystem.DECISION_PASS` entry. The Decision Engine never calls `StateAccess.createEngineAccess(...)` directly.

## 29.4 No Direct Firestore or Storage Access

The Decision Engine never reads `js/memory.js`, `coachEvents[]`, Firestore, or any repository directly — every input it consumes arrives via Pipeline Context (Memory Layer) or via the Recommendation/Initiative Engines' already-produced Candidates (Section 14).

## 29.5 No Durable Decision-History Write by the Decision Engine

Per D3 §11.1: "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf, and only through the Persistence Gateway or the C4 write path, including Coaching History." Coaching History persistence (recommendation/decision history, D1-MU-03) remains exclusively the Memory Layer's Stage 11–13 responsibility, applied *after* Feedback Processing observes the user's response to the delivered Terminal Decision — the Decision Engine itself performs zero durable writes of any kind, at any Stage it owns. Per **Canonical Decision CD-T006-04** (Section 18), this includes zero durable budget-tracking state — no daily/weekly quota counter, no per-period record, and no new persistent structure of any kind is written by, or on behalf of, the budget-enforcement logic Section 18 describes.

## 29.6 No Typed Memory Promotion

Per D1-MU-01/C4 §13.4: AI/inference-authored memory remains a non-authoritative candidate until user-confirmed; the Decision Engine has no write capability of any kind (Section 29.5) and therefore no ability to promote, demote, or otherwise alter any Typed Memory record's authority status.

## 29.7 No Coaching History Ownership

Coaching History belongs exclusively to the Memory Layer (D3 §10.1 Decision 4) — the Decision Engine does not read, write, or otherwise own any part of it; the Terminal Decision it produces is handed to Expression and, eventually, becomes Coaching History only through the Memory Layer's own Stage-13 processing of the user's later response, entirely outside the Decision Engine's own execution.

## 29.8 Any Post-Decision Write Request Handed to the Memory Layer Through Approved Contracts Only

Where a future implementation determines that some element of the Decision Engine's own Stage 5/7/8/9 trace (Section 26) should be durably retained (for example, as part of Coaching History), that retention request is handed to the Memory Layer through its existing, approved write path — the Decision Engine itself never initiates a `PersistenceGateway.persist()` call, a `typedMemoryServerWrite` invocation, or any other durable-write operation directly (Section 13 items 8–9).

## 29.9 Account/Session Isolation

Inherited from B3's existing per-user, per-session-generation scoping — the same discipline the Memory Layer's existing `coachDecisionSystem.DECISION_PASS` permission-matrix entry already enforces (Section 10.6); this document introduces no weakening of that boundary, and no new isolation mechanism, since the Decision Engine operates entirely on already-scoped Pipeline Context and Candidate inputs it never independently re-fetches.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Memory, State, and Persistence Boundaries | D1, D3, B3, B4, C4, TASK-004, TASK-005, Repository |

---

# 30. Expression and Delivery Boundary

- **The Decision Engine produces a Terminal Decision only.** Per Section 22.6/25 and D2 Unit 04, Stage 9's Outputs: a fully-formed `TerminalDecision` object — nothing further downstream.
- **Expression alone translates it into a platform-neutral Delivery Intent.** D3 §8.6: "Expression owns Delivery Intent production only... explicitly unaware of chat, trigger cards, notifications, widgets, push, UI, or platform." D1-CDO-03: a generative/LLM layer (Expression) expresses a decision already reached; it never originates it.
- **Coach Runtime alone maps Delivery Intent to a platform-specific surface.** D3 §10.4 (Decision 6): "the single architectural owner responsible for mapping a Delivery Intent into platform-specific presentation... without altering any of the decision's content." Currently realized on Web by `js/coach/*`/`js/trigger/*` (D3 §6.2), unchanged by this document.
- **The Decision Engine has no knowledge of chat, trigger cards, notifications, widgets, push, voice, or native UI.** Per Section 13 items 11–15 and D3 §11.3: "no component may select or reference a delivery platform except the existing Coach Runtime."
- **Delivery failure does not retroactively change the Terminal Decision.** Once Decision Formation completes and hands the `TerminalDecision` to Expression, a subsequent failure at Expression, the Coach Runtime, or any platform surface is entirely downstream of, and has no causal path back into, the Decision Engine's own Stage 9 output — the Decision Engine does not receive, and does not need to handle, a delivery-failure signal of any kind, consistent with Section 27.5's immutability requirement.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Expression and Delivery Boundary | D1, D3 |

---

# 31. Exceptional Flows and Graceful Degradation

Per D1-DI-02 (extended architecturally by D3 §12.3 to prohibit a fabricated *decision*, not only fabricated *data*): no row below ever fabricates a Candidate or an unsafe Terminal Decision as fallback content.

| Exceptional Flow | Detection | Handling | Output | Trace Behavior | Pass Continues, Resolves to Silence/Refusal, or Aborts? | Required Test |
|---|---|---|---|---|---|---|
| No Opportunities | Opportunity Detection (Stage 3, upstream) produces zero Opportunities | Decision Engine is never invoked this cycle | No Terminal Decision produced (D2-EF-02) | No trace to produce — Stage 5/7/8/9 never ran | Cycle ends at Stage 3; not a Decision-Engine-owned flow | 35.16 |
| Opportunities with insufficient evidence | Stage 4 (upstream, Section 9.2) evidence failure | Opportunity terminates internally (23.1); Decision Engine never sees it | None for that Opportunity | Attributed to Stage 4, not the Decision Engine | Pass continues if another Opportunity survives; else resolves to Decision-Pass-level Silence (23.4) | 35.16 |
| All Opportunities ineligible | Stage 5 (23.2) applied to every Opportunity this cycle | Every Opportunity resolves to internal Silence | None per Opportunity | Section 15.10/26 per Opportunity | Resolves to Decision-Pass-level Silence (23.4) | 35.1, 35.16 |
| Zero Candidates from one Opportunity | Stage 6 (upstream, 23.3) yields none for an otherwise-eligible Opportunity | That Opportunity's contribution to the pool is empty | None for that Opportunity | Attributed to Stage 6, not the Decision Engine | Pass continues for other Opportunities; else resolves to Decision-Pass-level Silence | 35.2, 35.16 |
| Zero Candidates across the pass | Pool assembly (16.8) finds an empty pool | Stage 7/8 have nothing to rank/select; Stage 9 still runs | Decision-Pass-level Silence Terminal Decision (23.4) | Full per-Opportunity aggregated trace (23.4, 26) | Resolves to Decision-Pass-level Silence | 35.2, 35.10, 35.16 |
| Malformed Candidate | Pool-assembly validation (16.3) | Rejected from the pool | Not admitted; not a Terminal Decision input | Trace records rejection reason | Pass continues with the remaining valid pool | 35.2, 35.16 |
| Duplicate Candidate | Section 16.4 (same-Opportunity duplication, structurally not producible by either engine's current `generate()` contract) | Recorded as Repository Gap (G-4), not resolved by invented dedupe logic | N/A at this baseline | N/A | Pass continues normally (condition does not arise given current engine contracts) | 35.16 |
| Missing hierarchy tier | Pool-assembly validation (16.3, 14.6) | Rejected from the pool | Not admitted | Trace records missing-field rejection | Pass continues with the remaining valid pool | 35.2, 35.16 |
| Missing rationale | Pool-assembly validation (16.3, 14.6); equivalently, D1-CDO-02 at the originating engine (upstream) | Rejected from the pool | Not admitted | Trace records missing-field rejection | Pass continues with the remaining valid pool | 35.2, 35.16 |
| Missing confidence | Pool-assembly validation (16.3, 14.6) | Rejected from the pool | Not admitted | Trace records missing-field rejection | Pass continues with the remaining valid pool | 35.2, 35.16 |
| Unresolved tie | D1-PR-06's four criteria exhausted without distinguishing the tied Candidates (19.2) | Narrow multi-option exception invoked (19.3) | Single Terminal Decision with `options` (22.2, 25.10) | Full tie-break trace, all four criteria's outcomes recorded (26) | Pass continues to a single, multi-option Terminal Decision — never aborts | 35.5, 35.6 |
| Invalid Safety response | Structurally malformed `DisqualificationResult`/`SafetyReviewResult` return value from the Safety Integration Port (21.7, 21.8), or a `disposition` outside the five CD-T006-06 values | Treated as a Pipeline Abort condition for this Decision Pass | No Terminal Decision fabricated | Trace records the invalid-response condition | Aborts (per D2-EF-06; no substitute decision) | 35.16 |
| Safety Layer unavailable (production) | No real implementation behind the Safety Integration Port reachable (21.7, 21.8; also a build-sequencing precondition at the current repository baseline, Section 10.11) | Decision Engine cannot complete Stage 8/9; production SHALL NOT substitute a test double or a stub (Canonical Decision CD-T006-05) | No Terminal Decision fabricated | Trace records unavailability | Aborts this Decision Pass rather than fabricate or fake Safety | 35.16 |
| All Candidates disqualified | Every Candidate in the pool is disqualified at Stage 8 (20.5, 23.5) | Stage 9 still runs; resolves per D1 Unit 14, using only the two outcomes D2 Unit 04's Stage 8 Exit Criteria names for this specific path | `kind: 'SILENCE'` or `kind: 'BOUNDARY'`/`boundaryType: 'REFUSAL'` Terminal Decision — never `'ESCALATION'` for this path (Section 23.5) | Full disqualification trace (26) | Resolves to Silence or Refusal — never aborts once Stage 9 is entered | 35.6, 35.7, 35.9 |
| Invalid Pipeline Context | Structurally malformed object from the Memory Layer (e.g., missing `schemaVersion`) | Decision Engine does not consume it; upstream (Memory Layer) responsibility to detect/degrade | No Terminal Decision fabricated by the Decision Engine on this account | Trace records receipt of an invalid context, where detectable | Aborts this Decision Pass rather than fabricate | 35.16 |
| Incompatible contract version | `schemaVersion` (Pipeline Context) or an equivalent Candidate-contract version marker does not match what the Decision Engine expects | Rejected, not silently coerced | No Terminal Decision fabricated from an incompatible input | Trace records the version mismatch | Aborts this Decision Pass rather than fabricate | 35.16 |
| Unexpected exception | Standard try/catch discipline, matching `recommendationEngine.js`'s/`initiativeEngine.js`'s existing "never throws" contract | Caught, converted to a structured failure result, never left to propagate and abort the whole Pipeline cycle uncontrolled | No Terminal Decision fabricated | Trace records exception context, sanitized per Section 26's privacy note | Contained to this Decision Pass (D2-EF-06) | 35.16 |
| Expression unavailable after a Terminal Decision is formed | Downstream of Stage 9's completion — not detectable by, or the Decision Engine's concern (Section 30) | N/A — the Decision Engine's own Stage 9 responsibility is already complete | `TerminalDecision` produced normally; simply not yet delivered | N/A at the Decision Engine's own boundary | The Decision Engine's own processing already completed successfully; downstream availability is Expression's/Coach Runtime's concern | 35.16 |

No Candidate or Terminal Decision is ever fabricated as fallback content in any row above — every row resolves to either a valid Terminal Decision (`kind: RECOMMENDATION`/`INITIATIVE`/`SILENCE`/`BOUNDARY`, Section 25), a deliberate zero-output internal outcome (Section 23.1–23.3), or an explicit, distinguishable Pipeline Abort; none of the three is ever silently converted into another.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Exceptional Flows and Graceful Degradation | D1, D2, D3, TASK-005 |

---

# 32. Performance and Operational Constraints

**Synchronous versus asynchronous execution (Engineering Interpretation, based on Repository Evidence, not a canonical requirement):** consistent with `recommendationEngine.js`'s and `initiativeEngine.js`'s existing pattern, Stage 5/7/8's own arbitration logic (eligibility gating, ranking, selection) should be synchronous/pure — all data arrives pre-assembled via Pipeline Context and the already-produced Candidate pool, no I/O inside the logic itself. Stage 8's Safety disqualification call and Stage 9's Safety final-review call are the sole points at which the Decision Engine's own flow depends on an external collaborator's (the Safety Layer's) response, which may itself be asynchronous depending on that collaborator's own eventual implementation — a detail this document does not fix, since the Safety Layer's own execution model is outside TASK-006's scope.

**Bounded runtime:** no specific numeric bound is fixed by any canonical source inspected; none is invented here, per the skeleton's own instruction not to invent arbitrary performance numbers without evidence or explicit engineering rationale.

**Repeated invocation and idempotency:** per Section 27.6, the Decision Engine's output for a given (Candidate pool, Pipeline Context, Safety determinations) input set must be idempotent within a single cycle; no cross-cycle caching of partial state is permitted (D3 §12.2: "no component may cache or retain a partial Pipeline Context across cycles as an optimization" — applied by extension to any Decision-Engine-internal state as well).

**Candidate-set size:** no specific numeric bound is fixed; the Decision Engine's Stage 7/8 logic must correctly handle a pool ranging from one Candidate (trivial single-winner case) to an arbitrarily large joint pool spanning both producer engines, without assuming a fixed maximum.

**Stable sort and deterministic arbitration:** per Section 27.1, Stage 7's ranking must be a stable sort with respect to D1-PR-01 through D1-PR-06's fixed lexicographic ordering — two Candidates that remain genuinely tied after all criteria are exhausted are handled per Section 19.3 (the narrow exception), never by an arbitrary, non-reproducible tiebreak internal to the sort implementation itself.

**No unnecessary network dependency in pure-domain logic:** consistent with D3 §5.5/§14 (Section 33) — the Decision Engine's Stage 5/7/8/9 decision logic has no inherent network dependency; any I/O (Pipeline Context assembly, Safety Layer calls) happens either upstream (Memory Layer) or through the one collaborator boundary this document explicitly names (the Safety Layer, Section 21).

**Startup impact:** the Decision Engine is dispatched only when the Orchestrator reaches Stage 5/7/8/9 for a given cycle; it adds no new `APP_READY`-trigger registration (Section 28.7/28.8 — no new Engine Registry entry, no new trigger type).

**Pilot-scale requirements without creating a future bottleneck:** no evidence in the repository or canonical sources suggests a scale requirement beyond what the existing Recommendation/Initiative Engines already satisfy at their own pipeline positions; this document does not invent a distinct scale target for the Decision Engine.

**Native compatibility:** per D3 §14, the Decision Engine is expected to belong to C1's Pure Domain tier, Node-loadable, with no DOM/`window`/Firebase/service-worker dependency, reusable unchanged in a future native shell — exactly as the Recommendation Engine, Initiative Engine, and Safety Layer's own evaluation logic are already positioned (D3 §5.5, naming the Decision Engine explicitly).

**Observability without sensitive-data leakage:** per Section 26's traceability discussion — trace/debug output favors rule identifiers, provenance references, and tier values over raw sensitive payload content wherever the former suffices.

No arbitrary performance number is invented in this section; every constraint above is either inherited from an already-approved canonical source or explicitly framed as an Engineering Interpretation grounded in existing repository convention.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Performance and Operational Constraints | D2, D3, TASK-004, TASK-005, C1 |

---

# 33. Security, Privacy, Ethics, and Safety Constraints

**Least-privilege access.** The Decision Engine reads only what its Stage 5/7/8/9 responsibilities require — Pipeline Context (as delivered, Section 29.1), the Candidate pool (Section 16), and Safety Layer determinations (Section 21) — never raw storage, never another engine's namespace (B3 §2), and never a StateAccess capability of its own (Section 29.3).

**No unnecessary sensitive-data duplication.** The Decision Engine does not persist anything durably itself (Section 29.5); any evidence or context it reasons over remains owned by its Memory Layer/producer-engine source, never independently copied or cached beyond the current Decision Pass's execution (Section 27.3/32).

**No private-data leakage in logs.** Per Section 26's debugging note: trace output favors rule identifiers and provenance/tier references over raw sensitive content.

**Account/session isolation.** Inherited from B3's existing per-user, per-session-generation scoping (Section 29.9).

**Medical and safety boundaries.** The Decision Engine never itself makes a medical/safety determination — that is exclusively the Safety Layer's (Section 21). D1-IE-01's valid-reason set and D1 Unit 02's absolute overrides bound what the Decision Engine may treat as eligible or as a valid winner, but final safety authority remains external to it at every checkpoint.

**User autonomy.** D1-AH-02's Tier-7 "user autonomy — the coach recommends; the user decides" and Constitution §22.6 ("the final decision always belongs to the user") bound every Terminal Decision the Decision Engine forms — it selects and forms a decision *for the user to act on*, never one that itself substitutes for or forecloses the user's own choice; this is why the narrow multi-option exception (Section 19.3) preserves user-selectable options rather than the Decision Engine silently picking among tied Candidates on the user's behalf.

**Non-manipulative behavior.** D1-IP-04 (applied to Initiative-kind Candidates the Decision Engine may select), Constitution §22.7 ("Never Manipulate Emotion"), and Constitution Principle 22 ("The FITME Coach never asks: 'What benefits the product?' It first asks: 'What genuinely benefits the person using it?'") bound every ranking and selection decision the Decision Engine performs — it never adjusts a Candidate's standing in the pool based on manipulative-engagement considerations.

**No engagement optimization.** D1-AH-03 (Section 17.6, Section 13 item 17): "Product engagement (Tier 10) SHALL NOT be permitted to influence a decision ahead of any other tier, under any circumstance." This is the single most load-bearing constraint on Stage 7's own ranking logic specifically.

**No dark-pattern ranking.** No Candidate's Hierarchy tier, impact tier, or tie-break position is ever adjusted to make a lower-tier, product-favorable Candidate appear more urgent or more favorable than its canonically-determined position — the entire ranking sequence (D1-PR-01 through D1-PR-06) is categorical and rule-based, not a tunable score susceptible to such manipulation (Section 17.7).

**Honest uncertainty.** D1-ER-05/06 (Section 24.4): confidence is preserved and communicated honestly, never manufactured or inflated to make a Candidate appear more winnable than its actual evidentiary basis supports.

**Refusal when authority is insufficient.** D1-AB-03: the coach "MAY refuse a request that conflicts with a safety or health principle." Where the Safety Layer's determination requires it, the Decision Engine correctly forms a refusal Terminal Decision (Section 24) rather than attempting to salvage a blocked outcome through its own independent judgment (Section 21.6 — the Decision Engine has no authority of its own to override a Safety determination, and does not attempt to construct a workaround).

This document does not expand TASK-006 into a separate security-remediation project — every constraint above is inherited from an already-approved canonical source, applied to this specific component's boundary, exactly as TASK-005 §31 records for the Initiative Engine.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Security, Privacy, Ethics, and Safety Constraints | D1, D2, Constitution, B3, TASK-005 |

---

# 34. Repository Changes

This specification is authored under a spec-authoring-only mandate (Section 48); nothing below has been implemented by this document. All paths are **candidate paths** — engineering proposals consistent with TASK-004's and TASK-005's existing pattern, subject to adjustment at implementation time per the skeleton's own allowance ("engineering may adjust exact filenames only where repository evidence justifies the change without altering architecture or scope").

## 34.1 New Production Files (Candidate)

- `js/coachDecisionSystem/eligibilityEvaluator.js` — Stage 5 orchestration (Section 15), consuming the `OpportunityEligibilityInput` contract (Section 15.11), structurally parallel to `recommendationEngine.js`/`initiativeEngine.js`.
- `js/coachDecisionSystem/prioritization.js` — Stage 7 ranking (Section 17/18/19), consuming the assembled Candidate pool and its arbitration-metadata fields (Section 14.3).
- `js/coachDecisionSystem/winnerSelection.js` — Stage 8 selection (Section 20), consuming Stage 7's ranked output and the Safety Integration Port's disqualification determination (Section 21.8).
- `js/coachDecisionSystem/decisionFormation.js` — Stage 9 Terminal Decision assembly (Section 22/23/24/25), consuming Stage 8's winner/tied-set output and the Safety Integration Port's final-review determination.
- `js/coachDecisionSystem/safetyIntegrationPort.js` — the `SafetyIntegrationPort` interface/contract definition only (Section 21.8, Canonical Decision CD-T006-05) — no Safety Layer policy logic; the shape of the call and response Stage 8/9 rely on. Its production implementation (a real Safety Layer behind this port) is explicitly out of TASK-006's scope (Section 8, 9.3, 38 item G-6).
- `tests/fixtures/` (or an equivalent existing test-support location) — a deterministic Safety Integration Port test double, satisfying the same interface, for test-only use (Section 21.8, Section 35.7) — never imported by production code.

These candidate files are offered as one plausible decomposition matching D2's own Stage boundaries one-to-one; a single combined `decisionEngine.js` module implementing all four Stages behind one internal API would equally satisfy this document's requirements — the specific file-per-Stage decomposition above is an engineering proposal, not a canonical requirement (Section 37, Section 38 item E-2).

## 34.2 Modified Production Files (Candidate)

- `js/coachDecisionSystem/internalPipelineOrchestrator.js` — wire Stage 5/7/8/9 into `run()`'s currently-unconditional `candidates: []`/no-Terminal-Decision path, and/or expose a direct Stage 5–9 dispatch function structurally analogous to the existing `runForOpportunity`/`runForInitiativeOpportunity` pattern (Section 28.10).
- `js/coachDecisionSystem/recommendationEngine.js` — a focused, additive extension to its existing Stage-6 Candidate output only: populate the Canonical Decision CD-T006-02 arbitration-metadata fields on every `RecommendationCandidate` it returns, exactly per the fixed, mechanical rule at Section 14.12: `triggeringEvidenceTime` = the Opportunity's existing `detectedAt` value (or `NO_SIGNAL` if `detectedAt` is `null`); `evidenceTier`, `trustImpact`, `timingQuality`, `problemMagnitude`, `recommendationImpactTier` = the literal `NO_SIGNAL` sentinel (Section 14.12.2/14.12.3). No classification logic, formula, or engineering judgment is required. No change to its existing D1 Unit 08 policy application, its `kind`/`category`/`action`/`rationale`/`confidence`/`hierarchyTier`/`opportunityProvenance` fields, or its Stage-6/Stage-3-contribution ownership (Section 9.2).
- `js/coachDecisionSystem/initiativeEngine.js` — the identical focused, additive extension: `triggeringEvidenceTime` per the same `detectedAt`/`NO_SIGNAL` rule; `evidenceTier`, `trustImpact`, `timingQuality`, `problemMagnitude` = `NO_SIGNAL` (Section 14.12.2/14.12.3). Per Canonical Decision CD-T006-03, `recommendationImpactTier` is never added to this engine's output (Section 14.3, 16.3, 17.2). No change to its existing D1 Unit 09 policy application, Relationship-Maturity gating, or Stage-6/Stage-3-contribution ownership.
- `js/coachDecisionSystem/recommendationCategories.js` — **not modified.** Per **Canonical Decision CD-T006-07**, its existing `SOURCE_HIERARCHY_TIER_MAP` is approved as the TASK-006 v1.0 canonical Hierarchy-tier baseline as-is (Section 10.2, 17.1, 38 item G-8) — no Product-review blocker remains before the Decision Engine may rely on it for Stage-7 ranking.

## 34.3 New Tests (Candidate)

See Section 35 for the full list, following TASK-004's/TASK-005's flat `tests/*.test.js` naming pattern.

## 34.4 Modified Tests (Candidate)

`tests/internalPipelineOrchestrator.test.js` and `tests/coachDecisionSystemWiring.test.js` would need extension to cover the new Stage 5–9 dispatch path(s); `tests/coachDecisionSystemWiring.test.js`'s existing test 17b (which currently asserts no Stage 7/8/9 function exists on either producer engine) would need to be read consistently with the new Decision Engine module(s) existing as a *separate* component, not as an extension of either producer engine's own public interface.

## 34.5 Shared Contract Changes

`EligibleOpportunity`'s and both Candidate contracts' existing shapes (Section 10.4) are not modified by this document — the Decision Engine consumes them as-is. One narrow gap is recorded (Section 38, item G-3): the two engines' `kind` literal values (`'Recommendation'` vs. `'INITIATIVE'`) are not normalized between them; whether resolving this normalization is in scope for TASK-006's own implementation, or is itself an out-of-scope contract change requiring separate approval (per the Spec Authoring Standard's rule that "any existing system's public contract may be called by a new capability; it may not be modified by one"), is recorded as **Architecture Decision Pending** (Section 38, item A-1), not decided here.

## 34.6 Validator Changes

No shared validator currently exists between the two producer engines (Section 10.5); this document does not authorize consolidating `recommendationEngine.js`'s and `initiativeEngine.js`'s duplicated internal validation helpers as a side effect of building the Decision Engine — that would be unrelated refactoring (Section 37), even though the Decision Engine's own pool-assembly validation (Section 16.3) necessarily reuses the *shape* of both engines' existing validation logic.

## 34.7 Composite Engine Wiring Changes

None to the Engine Registry itself (Section 28.7) — no new `register()` call; the existing single `coachDecisionSystem` registration already covers the Decision Engine as a fourth internal collaborator.

## 34.8 Documentation Changes

See Section 40.

## 34.9 Version/Cache/Service-Worker Changes Where Genuinely Required

`index.html` and `sw.js`'s script/shell lists would need the new file(s) (Section 34.1) added, following the exact pattern TASK-004 and TASK-005 already established for the existing six `js/coachDecisionSystem/` files.

## 34.10 Explicit No-Touch Areas

`recommendationEngine.js`'s and `initiativeEngine.js`'s existing D1 Unit 08/09 policy-application logic, existing required fields, and Stage-6/Stage-3-contribution ownership are not modified by TASK-006's scope — only the narrow, additive arbitration-metadata extension named at Section 34.2 is authorized; no redesign, no Relationship-Maturity-gating change, no new Candidate-content-generation behavior of any kind. `recommendationCategories.js` is not modified at all — Canonical Decision CD-T006-07 approves its existing mapping as-is (Section 34.2). `memoryLayer.js`'s existing Context Assembly responsibility is not modified — the Decision Engine reads its output as-is (Section 29.1/29.2); no new Pipeline Context field is required by this document. The B4 Persistence Gateway operation catalog is not modified — the Decision Engine performs no persistence of any kind, including no new persistent budget state (Section 29.5, Canonical Decision CD-T006-04). `firestore.rules`, `functions/typedMemoryServerWrite.js`, and `js/memory.js` are not touched. `js/stateAccess.js` is not modified — the Decision Engine has no StateAccess capability of its own (Section 29.3). No Safety Layer implementation is built — only the integration port/contract (Section 21.8, Canonical Decision CD-T006-05).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Repository Changes | TASK-004, TASK-005, B4, C4, Repository |

---

# 35. Test Strategy

**Per Canonical Decision CD-T006-08, this section is a required READY precondition** (Section 41) — TASK-006 does not reach READY with any of the nineteen subsections below unpopulated or without at least one identified, traceable test case. Passing implementation of these tests, together with the full regression suite (Section 35.18), is a required DONE precondition (Section 42).

## 35.1 Eligibility Unit Tests
Pure-function tests of Stage 5's per-Opportunity eligibility gate, driven exclusively by the closed `OpportunityEligibilityInput` contract (Section 15.11) — never by free-text parsing: each of D1-IE-01's seven `validReasonCategory` values individually exercised; a missing or out-of-enum `validReasonCategory` is rejected, not defaulted (15.11); `trustTestSignal.glad === null` (uncertain) produces ineligible (D1-IE-02); `lowCoachingValuePeriodActive` correctly lowers eligibility when true; an event-occurred-alone Opportunity (no valid reason) is rejected (D1-IE-03); `safetyHighRiskBypass === true` is confirmed to bypass this Stage entirely, never reaching the eligibility function at all (Section 15.5).

## 35.2 Candidate Pool Assembly Tests
Aggregation across multiple Opportunities and both producer engines into one shared pool; validation-before-admission, including the full Canonical Decision CD-T006-02 arbitration-metadata set (`hierarchyTier`, `evidenceTier`, `trustImpact`, `timingQuality`, `triggeringEvidenceTime`, `problemMagnitude`, and, Recommendation-kind only, `recommendationImpactTier`) — malformed/structurally-missing-field Candidates rejected (Section 16.3); a Candidate whose arbitration-metadata field is the `NO_SIGNAL` sentinel (Section 14.12.1) is correctly **admitted**, not rejected (16.3); an `InitiativeCandidate` carrying `recommendationImpactTier` (real or `NO_SIGNAL`) is rejected (16.3, Canonical Decision CD-T006-03); provenance and immutability preserved unmodified through assembly; zero-Candidates-from-one-Opportunity does not affect the rest of the pool (16.7); zero-Candidates-across-the-pass produces an empty, valid pool (16.8); no generator-specific priority shortcut is applied at assembly time (16.9).

## 35.3 Prioritization Unit Tests
One test per D1-PR rule, using each Candidate's arbitration-metadata fields (Section 14.3): Hierarchy-tier-first ordering via `hierarchyTier` (D1-PR-01); impact-tier nesting via `recommendationImpactTier` within same-kind Recommendation ties (D1-PR-02) and the resolved fallthrough directly to `problemMagnitude` for any cross-kind tie (D1-PR-03, Section 17.2, Canonical Decision CD-T006-03); `problemMagnitude` as the biggest-problem-first criterion (D1-PR-03); the shared per-Decision-Pass budget model correctly resolving to a single winner (D1-PR-04, Section 18, Canonical Decision CD-T006-04); single-winner-default ordering (D1-PR-05); the full four-step `evidenceTier`/`trustImpact`/`timingQuality`/`triggeringEvidenceTime` tie-break sequence in order (D1-PR-06, Section 19.1); a negative test confirming Product Engagement (Tier 10) never influences ordering (D1-AH-03). Additionally, per Section 14.12.1: a `NO_SIGNAL`-vs-real-value comparison always resolves in the real value's favor; a `NO_SIGNAL`-vs-`NO_SIGNAL` comparison never distinguishes and correctly falls through to the next criterion in the sequence.

## 35.4 Budget Enforcement Tests
Per Canonical Decision CD-T006-04: a pool with more than one viable Candidate correctly resolves to single-winner-plus-Silence-for-the-rest within one Decision Pass (18.5); no reserved allocation exists for either Candidate kind (18.3/18.6); no daily/weekly quota or persistent budget-tracking state is ever written or read (18.1, 29.5); no engagement-based expansion occurs (18.7).

## 35.5 Tie-Breaking Tests
Each of D1-PR-06(a)–(d) individually exercised, confirming the sequence stops at the first distinguishing criterion (19.1/19.2); a genuinely-exhausted tie correctly invokes the narrow multi-option exception (19.3); a resolvable tie never triggers the exception (19.4/19.5); semantically-similar-but-distinct Candidates from different Opportunities are never merged (19.6).

## 35.6 Winner Selection Tests
Exactly-one-winner in the ordinary case (20.1); the narrow tied-set exception carries forward the full permitted set, not an arbitrary subset (20.2); Safety disqualification correctly removes a top-ranked Candidate and promotes the next-ranked survivor (20.3/20.4); all-Candidates-disqualified correctly produces an empty (not fabricated) result for Stage 9 to resolve (20.5); provenance/rationale preserved unmutated (20.6); deterministic repeated evaluation (20.7); no menu-for-convenience when a single winner is determinable (19.4).

## 35.7 Safety Integration Tests
Stage 8's disqualification call is invoked, through the Safety Integration Port and a deterministic test double (Section 21.8), for every Candidate in the ranked pool (21.2); Stage 9's final-review call is invoked, through the same port/double, for every assembled pre-review Terminal Decision that has a winning Candidate or tied set (21.3); each of the five dispositions (`UNMODIFIED`, `MODIFIED`, `DEFERRED`, `BLOCKED`, `ESCALATED`) is individually exercised and confirmed to produce exactly the Canonical Decision CD-T006-06 mapping (21.5); no bypass, downgrade, or reinterpretation of any Safety determination occurs under any tested condition (21.6); Safety-Layer-unavailable correctly aborts rather than fabricates or fakes a determination (21.7); a dedicated negative test confirms no production code path constructs, imports, or otherwise references the test double (21.8).

## 35.8 Decision Formation Tests
Assembly from a single winning Candidate (22.1); assembly from a tied set into exactly one multi-option Terminal Decision (22.2); assembly from a Decision-Pass-level Silence determination with no winning Candidate (22.3); assembly from a Safety-modified/deferred/blocked outcome (22.4); every required field present per path (22.5); no incomplete decision ever reaches the point of being handed downstream (22.6); never more than one Terminal Decision per Decision Pass, under any tested condition (22.7).

## 35.9 Terminal Decision Contract Tests
Full field-by-field validation against the Section 25 contract for every one of the four `kind` values (`RECOMMENDATION`, `INITIATIVE`, `SILENCE`, `BOUNDARY`); `boundaryType` present if and only if `kind === 'BOUNDARY'`, and never for any other kind (25.4); `options` present if and only if the multi-option exception applies (25.4); `modification` present if and only if `safetyDisposition.disposition === 'MODIFIED'`; every Section 25.4 disposition↔kind/boundaryType invariant individually tested (`DEFERRED`↔`SILENCE`, `BLOCKED`↔`BOUNDARY`/`REFUSAL`, `ESCALATED`↔`BOUNDARY`/`ESCALATION`); confidence/hierarchyTier preserved, never reinvented, wherever present; a `TerminalDecision` missing a required field, or violating any Section 25.4 invariant, is rejected as an invalid Stage-9 output (25.5), not silently delivered.

## 35.10 Silence Semantics Tests
One test per Section 23 path (23.1 through 23.5), each confirming: correct internal-versus-terminal classification; whether Stage 9 is entered; the correct trace shape; the correct output (none, versus a fully-formed `kind: 'SILENCE'` Terminal Decision); whether Expression would be invoked; and that duplicate/multiple Silence outcomes never occur for a single Decision Pass. A further test confirms the Safety `DEFERRED` path (Section 21.5, 22.4) also produces `kind: 'SILENCE'`, correctly distinguished in trace from the 23.1–23.5 paths by a populated `candidateProvenance`/`safetyDisposition`.

## 35.11 Refusal / Deferral / Modification Tests
One test per Canonical Decision CD-T006-06's five dispositions (`UNMODIFIED`, `MODIFIED` staying its original kind, `DEFERRED`→`SILENCE`, `BLOCKED`→`BOUNDARY`/`REFUSAL`, `ESCALATED`→`BOUNDARY`/`ESCALATION`); rationale/traceability present for each (24.2); the original Candidate and Safety determination preserved as evidence (24.3); no disguised recommendation after a `BLOCKED` disposition (24.5); no fabricated fallback Candidate under any all-disqualified/`BLOCKED` condition (24.6).

## 35.12 Composite Engine Integration Tests
Extend `tests/coachDecisionSystemWiring.test.js`: confirm the Decision Engine introduces no second Engine Registry entry (28.7); confirm the Orchestrator dispatches Stage 5/7/8/9 without altering `run()`'s or `runForOpportunity()`'s/`runForInitiativeOpportunity()`'s existing external contracts (28.10); confirm no new trigger type is introduced (28.8); confirm no direct Coach Runtime invocation exists anywhere in the Decision Engine's code (28.9).

## 35.13 Recommendation/Initiative Joint Arbitration Tests
A pool containing both Recommendation-kind and Initiative-kind Candidates simultaneously is ranked jointly, on equal footing, per Section 16.2/16.9 — confirming no `kind`-based ordering bias exists anywhere in Stage 7's implementation; confirming the shared budget (Section 18.3) is genuinely shared, not partitioned per kind.

## 35.14 Memory and Persistence Boundary Tests
Confirm the Decision Engine never calls `StateAccess`, `PersistenceGateway`, `DerivedIntelligenceConsumer`, `js/memory.js`, or `functions/typedMemoryServerWrite.js` directly (29.3/29.4/29.5); confirm it consumes Pipeline Context only as delivered by the Memory Layer, with no reassembly (29.1); confirm zero durable writes occur under any tested condition, including all failure paths (29.5/29.8).

## 35.15 Expression and Delivery Boundary Tests
Confirm the Decision Engine's public interface exposes no platform-selection, wording-generation, or Delivery-Intent-production function (30, Section 13 items 11–15); confirm a `TerminalDecision` is produced normally and correctly even when no Expression/Coach Runtime component is reachable at this baseline (31, "Expression unavailable" row).

## 35.16 Failure and Graceful-Degradation Tests
One test per Section 31 row (17 rows total), confirming the correct, non-fabricated outcome for each — a valid Terminal Decision, a deliberate zero-output internal outcome, or an explicit Pipeline Abort, never silently converted between the three.

## 35.17 Determinism and Idempotency Tests
Identical input (Candidate pool, Pipeline Context, Safety determinations) twice → identical Terminal Decision, including identical Stage-by-Stage trace attribution (27.1/27.2/27.6); no hidden randomness (27.7); no direct system-clock read inside Stage 5/7/8/9 logic (27.8).

## 35.18 Regression Tests
Full existing suite (1212/1212 at the TASK-005 baseline, Section 10.9) must continue passing unmodified except for the specific extensions listed in Section 34.4; no pre-existing Recommendation Engine, Initiative Engine, Memory Layer, or Orchestrator test's assertions should require weakening to accommodate the Decision Engine — including `tests/coachDecisionSystemWiring.test.js` test 17b, which must continue to confirm the two producer engines expose no Stage 7/8/9 function of their own (the Decision Engine is a separate component, not an extension of either producer engine).

## 35.19 Native / Platform-Neutral Contract Tests
Confirm every new Decision Engine module (Section 34.1) is Node-loadable with no DOM/`window`/Firebase reference, consistent with D3 §5.5/§14 and C1's existing Pure Domain classification pattern.

Every normative behavior, invariant, and acceptance criterion elsewhere in this document maps to at least one subsection above; Section 39's Traceability Matrix makes this mapping explicit per-rule.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 35.1 Eligibility Unit Tests | D1, D2 |
| 35.2 Candidate Pool Assembly Tests | D2 |
| 35.3 Prioritization Unit Tests | D1, D2 |
| 35.4 Budget Enforcement Tests | D1 |
| 35.5 Tie-Breaking Tests | D1 |
| 35.6 Winner Selection Tests | D1, D2 |
| 35.7 Safety Integration Tests | D1, D2 |
| 35.8 Decision Formation Tests | D1, D2 |
| 35.9 Terminal Decision Contract Tests | D1, D2 |
| 35.10 Silence Semantics Tests | D1, D2 |
| 35.11 Refusal / Deferral / Modification Tests | D1 |
| 35.12 Composite Engine Integration Tests | D3, Repository |
| 35.13 Recommendation/Initiative Joint Arbitration Tests | D1, D2 |
| 35.14 Memory and Persistence Boundary Tests | D3, B3, B4, C4 |
| 35.15 Expression and Delivery Boundary Tests | D1, D3 |
| 35.16 Failure and Graceful-Degradation Tests | D1, D2, D3 |
| 35.17 Determinism and Idempotency Tests | D2 |
| 35.18 Regression Tests | TASK-004, TASK-005, Repository |
| 35.19 Native / Platform-Neutral Contract Tests | D3, C1 |

---

# 36. Acceptance Criteria

## 36.1 Product
- Every Terminal Decision satisfies D1 Unit 15's requirement to carry a clear answer to what is decided, why, how confident, and where it sits in the Canonical Decision Hierarchy (Section 25).
- Silence is produced whenever no Opportunity this cycle produces a surviving Candidate, and is never a silently-dropped cycle (Section 23.4).
- No Terminal Decision's formation is ever influenced by Product Engagement (Section 17.6, 33).

## 36.2 Functional
- Stage 5 correctly gates every Opportunity per D1 Unit 06 before any Candidate is generated for it (Section 15).
- Stage 7 correctly ranks the full joint Candidate pool per D1 Unit 07 in the fixed lexicographic order (Section 17, 19).
- Stage 8 correctly selects exactly one winner by default, or the narrow permitted tied set, subject to Safety disqualification (Section 20).
- Stage 9 correctly assembles exactly one Terminal Decision from every one of the four possible inputs (winning Candidate, tied set, Silence determination, Safety-modified outcome) (Section 22).

## 36.3 Eligibility
- Every one of D1-IE-01's seven valid reasons is individually recognized (35.1).
- The Trust Test and reduced-frequency adjustment are correctly applied (15.2/15.3).
- Safety/high-risk-triggered Opportunities correctly bypass this Stage entirely (15.5).

## 36.4 Prioritization
- The fixed lexicographic order (D1-PR-01 → D1-PR-02 same-kind only → D1-PR-03 → D1-PR-04 → D1-PR-06), using the Canonical Decision CD-T006-02 arbitration-metadata fields, is applied exactly, never replaced by a weighted composite score (17.7).
- Every cross-kind tie (at least one Initiative-kind Candidate) skips impact-tier nesting and proceeds directly to `problemMagnitude` then D1-PR-06, per Canonical Decision CD-T006-03 (17.2, 35.3).
- Recommendation-kind and Initiative-kind Candidates are ranked jointly, on equal footing, within one shared per-Decision-Pass pool, per Canonical Decision CD-T006-04 (16.2, 18.3, 35.13).
- No numeric priority formula, weight, or utility function is ever introduced (17.7).
- `hierarchyTier` values sourced from Opportunity `sourceCategory` use the Canonical-Decision-CD-T006-07-approved `SOURCE_HIERARCHY_TIER_MAP` baseline (17.1).
- Every arbitration-metadata field is always present as either a real value or the defined `NO_SIGNAL` sentinel (Section 14.12); no Candidate is ever rejected from the pool merely for carrying `NO_SIGNAL` (16.3, 35.2).

## 36.5 Winner Selection
- Exactly one winner is selected by default; the narrow tied-set exception is invoked only when genuinely unresolved (Section 19.2/19.3, 20.1/20.2).
- Safety disqualification is applied before final selection, correctly promoting the next-ranked survivor when the top-ranked Candidate is disqualified (20.3/20.4).
- All-Candidates-disqualified never produces a fabricated winner (20.5).

## 36.6 Decision Formation
- Exactly one Terminal Decision is produced per Decision Pass in which Stage 9 is entered, under every tested condition, including the multi-option case (22.2/22.7).
- Every required Terminal Decision field (Section 25.1) is present and correctly populated for the path that produced it.
- The Safety Layer's final review is applied before any Terminal Decision is handed to Expression, without exception (21.3, 22.4).

## 36.7 Silence and Refusal
- Every one of Section 23's five Silence paths is correctly classified and handled, including which is/is not itself a Terminal Decision (35.10).
- Every one of Canonical Decision CD-T006-06's five Safety-disposition mappings (`UNMODIFIED`/`MODIFIED`/`DEFERRED`→Silence/`BLOCKED`→Refusal/`ESCALATED`→Escalation) is correctly formed when the Safety Layer's determination requires it (35.11).
- No disguised recommendation, and no fabricated fallback Candidate, is ever produced after a `BLOCKED` disposition (24.5/24.6).
- The Terminal Decision contract never produces a fifth kind, and never produces `boundaryType` on a non-`BOUNDARY` kind (25.4, 35.9).

## 36.8 Safety
- The Decision Engine never bypasses, downgrades, reinterprets, or silently suppresses a Safety Layer determination, under any tested condition (21.6, 35.7).
- The Decision Engine's public interface exposes no independent safety-judgment function of any kind (Section 13 items 6–7).
- Production code never constructs, imports, or otherwise references a Safety test double; a test double is permitted in tests only (Canonical Decision CD-T006-05, Section 21.8, 35.7).

## 36.9 Architecture
- No second Engine Registry entry, second orchestration authority, or second session mechanism is introduced (28.6/28.7/28.8).
- The Decision Engine is Pure-Domain-shaped, with no DOM/browser/Firebase reference (35.19).
- `EngineRegistry`, `StateAccess`, and `PersistenceGateway`'s existing public contracts are unmodified (34.10).

## 36.10 Contracts
- The Terminal Decision contract (Section 25) is fully implemented and validated field-by-field for every one of its four `kind` values and, where applicable, `boundaryType` (35.9).
- Both existing Candidate contracts (`RecommendationCandidate`, `InitiativeCandidate`) receive only the narrow, additive Canonical Decision CD-T006-02 arbitration-metadata extension, with no change to either engine's existing D1 Unit 08/09 policy logic (34.2, 34.10).
- The Stage 5 `OpportunityEligibilityInput` contract (15.11) and the Safety Integration Port contract (21.8) are both fully specified, closed-field, and free of any reliance on free-text inference.
- The arbitration-metadata representation and derivation contract (14.12) is fully specified for every field, with no fabricated value ever produced in place of a genuinely absent classification source.

## 36.11 Memory and State
- No StateAccess capability of its own, no direct Firestore/storage access, and zero durable writes are ever performed by the Decision Engine, under any tested condition, including all failure paths (29.3/29.4/29.5, 35.14).
- Pipeline Context is consumed read-only, exactly as delivered by the Memory Layer, with no reassembly (29.1).

## 36.12 Failure Handling
- Every Section 31 exceptional flow resolves to one of: a valid Terminal Decision, a deliberate zero-output internal outcome, or an explicit, distinguishable Pipeline Abort — never silently converted between the three (35.16).

## 36.13 Testing
- All nineteen Section 35 subsections have at least one passing test before this task may be considered for READY (Section 41).
- Full regression suite (35.18) passes unmodified except for documented, intentional extensions.

## 36.14 Documentation
- Section 40's required documentation updates are completed at actual implementation closure, not during specification authoring (Section 40, 47).

Every criterion above is testable or reviewable from repository evidence once implementation exists; none reduces to "works correctly," "makes the best decision," or "is user friendly."

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 36.1 Product | D1 |
| 36.2 Functional | D1, D2 |
| 36.3 Eligibility | D1 |
| 36.4 Prioritization | D1 |
| 36.5 Winner Selection | D1, D2 |
| 36.6 Decision Formation | D1, D2 |
| 36.7 Silence and Refusal | D1 |
| 36.8 Safety | D1, D3 |
| 36.9 Architecture | D3 |
| 36.10 Contracts | D2, TASK-004, TASK-005 |
| 36.11 Memory and State | D3 |
| 36.12 Failure Handling | D1, D2, D3 |
| 36.13 Testing | — |
| 36.14 Documentation | — |

---

# 37. Engineering Constraints

- No Product or Architecture invention — no scope expansion beyond Section 9's Functional Scope — no unrelated refactoring of `recommendationEngine.js`, `initiativeEngine.js`, `recommendationCategories.js`, or `memoryLayer.js` beyond what Section 34 explicitly names (Section 34.10's explicit no-touch areas).
- No replacement of the canonical hierarchy (D1 Unit 02) with a score model — every ranking factor in Section 17 is categorical and rule-based, never a numeric composite (Section 17.7).
- No duplicated shared contract where reuse is possible — `EligibleOpportunity`, `RecommendationCandidate`, and `InitiativeCandidate` are all consumed as-is (Section 10.4, 14); the Terminal Decision contract (Section 25) is new precisely because no existing contract already covers it, not duplicated where one does.
- Pure-domain separation maintained (Section 14.10, 27, 32, 35.19).
- Native compatibility maintained (same sections).
- Existing coding and module conventions followed (flat `js/coachDecisionSystem/` module pattern, flat `tests/*.test.js` pattern, Section 34).
- Deterministic behavior required (Section 27).
- Complete automated tests required before READY (Section 35, 36.13, 41).
- No hidden fallback behavior — every failure mode is explicit (Section 31).
- No implementation of Recommendation, Initiative, Safety, Expression, UX, notification, or Design System scope beyond required integration (Section 8, 9.2, 21, 30).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Constraints | TASK-004, TASK-005, Repository |

---

# 38. Pending Decisions, Repository Gaps, Canonical Conflicts, and Follow-ups

Per the Spec Authoring Standard's actual taxonomy (five categories: Repository Gap, Product Decision Pending, Architecture Decision Pending, Engineering Decision Pending, Canonical Conflict). A **Follow-up** status may only be applied by an actual Product/Architecture Canonical Closure Decision (the precedent TASK-005's own Section 36 records); this document does not pre-apply that status to any item below on its own authority — it records each item's classification and a recommended "Blocks READY" position for Product/Architecture to confirm or overrule.

### G-1 — Repository Gap (inherited from TASK-005 G-1): Precedence of `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`
Unresolved since D1's own authoring, restated identically by TASK-005. **Blocks READY:** No. **Required resolution:** unchanged from TASK-005's own recommendation — a future Engineering Workflow revision.

### G-2 — Repository Gap: Stage 4 Evidence Evaluation orchestration ownership
D2 Unit 04 names no orchestration-authority owner for Stage 4, unlike Stages 5/7/8/9 (Section 9.2). This document does not assign it to the Decision Engine, consistent with the skeleton's explicit instruction not to silently absorb it. **Blocks READY:** No — TASK-006's own scope (Stage 5/7/8/9) is unaffected by this gap; it affects only whether a live, end-to-end Decision Pass can run with real Opportunities (a pre-existing condition inherited from TASK-004/TASK-005, not introduced here). **Required resolution:** Architecture (AI Architect), to assign Stage 4 ownership or confirm it is intentionally unowned.

### G-3 — Repository Gap: `kind` literal value mismatch between producer engines
`RecommendationCandidate.kind` is `'Recommendation'`; `InitiativeCandidate.kind` is `'INITIATIVE'` — differing case/word-form, verified in current source (Section 10.4). **Blocks READY:** No — Stage 7's pool-assembly and ranking logic can correctly discriminate both literal values without requiring either producer engine's contract to change; this is an internal Decision-Engine implementation detail (Section 34.5), not a blocking ambiguity. **Required resolution:** none required for TASK-006 itself; recorded for engineering awareness at implementation time.

### G-4 — Repository Gap: No merge/dedupe rule for same-Opportunity duplicate Candidates
Neither producer engine's current `generate()` contract can produce more than one Candidate per invocation (Section 16.4), so this condition cannot arise given the current repository baseline. **Blocks READY:** No. **Required resolution:** none required unless a future engine change permits multiple Candidates per Opportunity per engine, at which point this would need Product/Architecture attention.

### G-5 — Repository Gap: No semantic-equivalence rule for Candidates from distinct Opportunities
D1/D2 do not define one; none is invented here (Section 19.6). **Blocks READY:** No — this is a deliberate absence, not a gap requiring resolution; two distinct Candidates are always ranked on their own canonical merits regardless of apparent similarity. **Required resolution:** none; recorded for completeness.

### G-6 — Repository Gap: No Safety Layer implementation exists — **Port now defined (Canonical Decision CD-T006-05)**
Confirmed absent by exhaustive search (Section 10.11). Per CD-T006-05, TASK-006 defines the Decision Engine's integration contract with the Safety Layer as a formal **Safety Integration Port** (Section 21.8) — including the exact five-disposition response shape and the explicit production/test-double distinction — without building the Safety Layer itself (Non-Goal, Section 8) — the same relationship TASK-004/TASK-005 had with the (then-and-still) unbuilt Decision Engine. **Blocks READY:** No — the *contract* is now complete (satisfying the skeleton's "complete... Safety... contracts" READY criterion, Section 41); only the Safety Layer's own *implementation* remains absent, consistent with TASK-004's and TASK-005's own precedent of specifying against a not-yet-built downstream/cross-cutting collaborator. **Required resolution:** a future, separately-scoped Safety Layer task (not named on the current Roadmap as of this document's authoring), implementing the port defined at Section 21.8.

### G-7 — Repository Gap: No Expression implementation exists
Confirmed absent by exhaustive search (Section 10.11). TASK-006 defines the Decision Engine's handoff boundary to Expression (Section 30) without building Expression itself (Non-Goal, Section 8). **Blocks READY:** No, for the same reason as G-6. **Required resolution:** a future, separately-scoped Expression task.

### G-8 — Repository Gap: `recommendationCategories.js`'s Source→Hierarchy-Tier mapping — **RESOLVED (Canonical Decision CD-T006-07)**
`SOURCE_HIERARCHY_TIER_MAP` was marked in-code as "provisional... Repository-Gap status," not Product-approved (Section 10.2), and is the origin of every Candidate's `hierarchyTier` field that Stage 7's D1-PR-01 primary ranking depends on. This gap was inherited from TASK-004 and was not resolved by TASK-005. **Canonical Decision CD-T006-07 resolves it**: the existing mapping is approved as the TASK-006 v1.0 canonical Hierarchy-tier baseline, as-is, with no invented change (Section 10.2, 17.1). **Blocks READY:** No — resolved. **Remaining item:** the in-code comment's own "provisional" wording is a Documentation Updates Required item at implementation time (Section 40), not an unresolved Product question.

### G-9 — Repository Gap: No canonical or repository-verified derivation source for `evidenceTier`, `trustImpact`, `timingQuality`, `problemMagnitude`, or `recommendationImpactTier`
Per Section 14.12 (Engineering Fill resolving the former Engineering Blocker 1), all five fields are represented at the current repository baseline by the defined `NO_SIGNAL` sentinel, since no canonical source (D1, D2, D3, Constitution, Coach Bible, Knowledge Base, Intelligence & Relationship Philosophy) or repository precedent defines a scale or classification rule for any of them — verified by exhaustive search of the full canonical corpus and of `js/trigger/triggerDomain.js` (the repository component D1-PR-02 itself cross-references), which uses a three-value priority scheme not reconcilable 1:1 with D1-PR-02's four named impact levels. `NO_SIGNAL`'s comparison semantics (Section 14.12.1) make the ranking sequence fully correct and non-blocking in the absence of these sources; the sequence resolves automatically on `triggeringEvidenceTime` and higher-precedence criteria (Hierarchy tier, budget) without requiring them. **Blocks READY:** No — the representation contract (Section 14.12) is complete and implementable without any of the five real sources existing; Stage 7 functions correctly and produces real, non-Silence Terminal Decisions using Hierarchy tier, budget, and `triggeringEvidenceTime` alone. **Required resolution:** Product/Architecture, only if and when a real classification source for any of the five fields is to be introduced (e.g., a future Stage 4 implementation for `evidenceTier`, or a future Product-approved impact-tier scheme for `recommendationImpactTier`) — tracked as future work, not decided or scheduled here.

### P-1 — Product Decision Pending (inherited from TASK-005 §36 item G-5) — **RESOLVED (Canonical Decision CD-T006-03)**: Nested impact-tier scheme for Initiative-kind Candidates
TASK-005 explicitly deferred this "to Product/Architecture, at or before TASK-006's specification." **Canonical Decision CD-T006-03 resolves it**: `InitiativeCandidate` never carries a `recommendationImpactTier` field; any tie involving at least one Initiative-kind Candidate skips impact-tier nesting entirely and proceeds directly to `problemMagnitude` (D1-PR-03) then the D1-PR-06 tie-break order (Section 17.2, Section 19.1). No Initiative-specific nested impact-tier scheme is introduced. **Blocks READY:** No — resolved.

### A-1 — Architecture Decision Pending: Scope of a possible `recommendationEngine.js`/`initiativeEngine.js` `kind`-literal contract change
Whether G-3's `kind`-literal mismatch (`'Recommendation'` vs. `'INITIATIVE'`) should ever be corrected at its source (which would modify an existing system's public contract, requiring separate approval per the Spec Authoring Standard's rule that "any existing system's public contract may be called by a new capability; it may not be modified by one") is not decided here. **Blocks READY:** No — this document's own Decision Engine implementation does not require the source contract to change (Section 34.5, G-3). Note: the Canonical-Decision-CD-T006-02 arbitration-metadata extension to both engines (Section 34.2) is itself already approved and is not part of this open item — A-1 concerns only the unrelated `kind`-literal spelling question. **Required resolution:** AI Architect, only if a future correction to the `kind`-literal spelling is proposed.

### E-1 — Engineering Decision Pending: Numeric budget size — **RESOLVED (Canonical Decision CD-T006-04)**
Per D1 Unit 11 Acceptance Criteria and CDR-4, no numeric budget size was fixed by D1 for the shared recommendation/initiative budget. **Canonical Decision CD-T006-04 resolves this**: for TASK-006 v1.0, no numeric budget is used at all — the shared budget is enforced entirely through the per-Decision-Pass single-winner-plus-Silence mechanic (Section 18). **Blocks READY:** No — resolved. A future version introducing a cross-Decision-Pass, multi-period numeric budget would require its own, separately-approved canonical decision.

### E-2 — Engineering Decision Pending: Concrete file decomposition for Stage 5/7/8/9 and the Safety Integration Port test double — **RESOLVED (Implementation)**
Section 34.1's five-file proposal (`eligibilityEvaluator.js`/`prioritization.js`/`winnerSelection.js`/`decisionFormation.js`/`safetyIntegrationPort.js`) versus a single combined module, and the exact location of the test-only Safety Integration Port double, were engineering choices, not canonical requirements (Section 34.1, Section 37). **Resolved at implementation**: the five-file decomposition was adopted exactly as proposed; the test-only double lives at `tests/fixtures/safetyIntegrationPortTestDouble.js`, confirmed by a dedicated negative test (`tests/safetyIntegrationPort.test.js`) that no production module imports or references it. **Blocks READY:** No — resolved.

### C-1 — Canonical Conflict (inherited from TASK-004, restated by TASK-005): "repository hooks" conflict
D1 CDR-5's claim that "Engineering hooks for the Recommendation, Initiative, and Decision Engines already exist in the codebase but remain disabled" versus TASK-004's own repository-inventory finding of no such hooks beyond a narrow set of reserved consumer-id constants (now including the confirmed-absent `DECISION_ENGINE` consumer id in `js/derivedIntelligenceConsumer.js:32`, itself fully disabled, Section 5.6). **Decision required:** whether D1 CDR-5's claim is now considered substantiated by the accumulated evidence across TASK-004/TASK-005/TASK-006's own research, or remains open in its original form. **Owner:** AI Architect (this document does not resolve it; it only adds the `DECISION_ENGINE` consumer-id finding as further evidence already disclosed above, per Section 10).

Per the nine canonical decisions applied throughout this document (Section 1), items **P-1**, **E-1**, and **G-8** are resolved and no longer open. **Engineering Blocker 1** (identified during Engineering Readiness Review — Section 16.3's arbitration-metadata fields had no defined representation or derivation, forcing every Candidate to be rejected from the pool) is resolved by the Engineering Fill at Section 14.12: every arbitration-metadata field is now always present (a real value or the defined `NO_SIGNAL` sentinel), so Section 16.3 never rejects a Candidate on this account. **G-9** records, as a non-blocking Repository Gap, that five of the six fields currently populate as `NO_SIGNAL` pending a future real classification source — this does not block READY (see G-9). Every remaining item (G-1 through G-7, G-9, A-1, E-2, C-1) is recommended non-blocking, for Product/Architecture to confirm at Engineering Review (Section 41) — no item in this Section is labeled a definite READY Blocker by this document on its own authority (Spec Authoring Standard, Forbidden Authoring Practices).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Pending Decisions, Repository Gaps, Canonical Conflicts, and Follow-ups | D1, D2, D3, TASK-004, TASK-005, Spec Authoring Standard, Repository |

---

# 39. Traceability Matrix

| TASK-006 Requirement | Canonical Source (exact section/rule) | Repository Component | Acceptance Criterion | Required Test | Implementation Evidence |
|---|---|---|---|---|---|
| Stage 5 Eligibility Evaluation orchestration | D2 Unit 04 Stage 5; D1 Unit 06 | (new) `eligibilityEvaluator.js` (candidate) | 36.2, 36.3 | 35.1 | pending implementation |
| Full Candidate pool assembly across all Opportunities/engines | D2-PP-06; D2 Unit 04 Stage 7 Purpose | (new) pool-assembly logic (candidate) | 36.2 | 35.2 | pending implementation |
| Stage 7 Prioritization | D1 Unit 07 (D1-PR-01–06); D2 Unit 04 Stage 7 | (new) `prioritization.js` (candidate) | 36.2, 36.4 | 35.3, 35.5, 35.13 | pending implementation |
| Shared recommendation/initiative budget | D1-PR-04 | (new) `prioritization.js` (candidate) | 36.4 | 35.4 | pending implementation |
| Stage 8 Winner Selection | D2 Unit 04 Stage 8 | (new) `winnerSelection.js` (candidate) | 36.2, 36.5 | 35.6 | pending implementation |
| Safety disqualification/final-review integration | D1-AB-05, D1-RP-07; D2 Unit 07 Safety Layer functions (b)/(c) | (new) Stage 8/9 modules (candidate) | 36.6, 36.8 | 35.7 | pending implementation |
| Stage 9 Decision Formation | D1 Unit 15; D2 Unit 04 Stage 9 | (new) `decisionFormation.js` (candidate) | 36.2, 36.6 | 35.8 | pending implementation |
| Terminal Decision contract (4-family, corrected) | Section 25; Canonical Decision CD-T006-06; D1 Unit 15, D2 Unit 04 Stage 9, TASK-004 CC-02/03, TASK-005 §19 pattern | (new) Terminal Decision shape (candidate) | 36.10 | 35.9 | pending implementation |
| Decision-Pass-level Silence | D1-SP-01–06; D2-INV-05, D2-PP-04 | (new) `decisionFormation.js` (candidate) | 36.1, 36.7 | 35.10 | pending implementation |
| Safety-disposition→kind mapping (defer→Silence, block→Refusal, escalate→Escalation, modify→original kind) | Canonical Decision CD-T006-06; D1 Unit 14; D2 Unit 04 Stage 9 | (new) `decisionFormation.js` (candidate) | 36.7 | 35.11 | pending implementation |
| Stage 7 arbitration metadata (hierarchyTier, evidenceTier, trustImpact, timingQuality, triggeringEvidenceTime, problemMagnitude, recommendationImpactTier) | Canonical Decision CD-T006-02, CD-T006-03; D1-PR-01–06 | `recommendationEngine.js`, `initiativeEngine.js` (focused extension, candidate) | 36.4, 36.10 | 35.2, 35.3 | pending implementation |
| Stage 5 closed eligibility input contract (no free-text/inferred eligibility) | Canonical Decision CD-T006-01; D1 Unit 06 | (new) `eligibilityEvaluator.js` (candidate) | 36.3, 36.10 | 35.1 | pending implementation |
| Safety Integration Port (contract only; production never bypasses/fakes; test double permitted) | Canonical Decision CD-T006-05; D1-AB-05 | (new) `safetyIntegrationPort.js` (candidate) | 36.8 | 35.7 | pending implementation |
| Approved Source→Hierarchy-Tier baseline | Canonical Decision CD-T006-07 | `recommendationCategories.js` (unchanged) | 36.4 | 35.3 | already true; must remain unchanged |
| Per-Decision-Pass shared budget, no persistent state | Canonical Decision CD-T006-04; D1-PR-04 | (new) `prioritization.js`/`winnerSelection.js` (candidate) | 36.4, 36.11 | 35.4, 35.14 | pending implementation |
| No Candidate content generation by the Decision Engine | D2 Unit 07 Decision Engine Forbidden Responsibilities | (new) Decision Engine public interface | 36.9 | 35.12 | pending implementation |
| No Safety bypass | D1-AB-05; D3 §11.3 | (new) Decision Engine's Safety-call sites | 36.8 | 35.7 | pending implementation |
| Single Engine Registry entry preserved | D3 §17 Decision 1; §11.1 | `registerCoachDecisionSystem.js` (unchanged) | 36.9 | 35.12 | already true (TASK-004); must remain true |
| Pipeline Context read-only, Memory-Layer-sourced | D3 §8.1, §11.1, §11.2 | (new) Decision Engine input handling | 36.11 | 35.14 | pending implementation |
| No durable write authority | D3 §11.1 | (new) Decision Engine (absence of any write call) | 36.11 | 35.14 | pending implementation |
| Determinism (identical input → identical output) | D2-INV-01; D2 Unit 10 | (new) all four Stage modules (candidate) | 36.13 | 35.17 | pending implementation |
| Native/platform-neutral shape | D3 §5.5, §14 | (new) all four Stage modules (candidate) | 36.9 | 35.19 | pending implementation |
| Full regression suite unaffected | TASK-005 Closure Record (1212/1212) | entire `tests/` suite | 36.13 | 35.18 | must be re-verified at implementation |
| Joint arbitration of Recommendation-kind and Initiative-kind Candidates | D1-PR-04; D2-PP-06 | (new) `prioritization.js` (candidate) | 36.4 | 35.13 | pending implementation |

This matrix traces all applicable D1 Prioritization/Eligibility/Silence/Authority-Boundary/Canonical-Decision-Output rules, the applicable D2 Stage Contracts (Stages 5, 7, 8, 9, and the Decision Engine's Forbidden Responsibilities in Unit 07), the applicable D3 architecture invariants (§8.3, §11.1–§11.3, §5.5, §14), and TASK-004's/TASK-005's integration contracts (Engine Registry entry, Pipeline Context shape, Candidate shape patterns).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Traceability Matrix | D1, D2, D3, TASK-004, TASK-005, Repository |

---

# 40. Documentation Updates Required

At implementation closure (not during this specification-authoring phase — see Section 48), the following require updates:

- **`docs/specs/TASK_006_SPEC_v1.0.md`** (this document) — Section 47 (Closure Record) populated; any section whose pending items (Section 38) were resolved during implementation updated to reflect the resolution.
- **`docs/roadmap/Roadmap.md`** — TASK-006 status updated from "⏳ PENDING" to reflect actual progress (e.g., READY, DONE) at each real transition, not speculatively.
- **`docs/roadmap/Changelog.md`** — a TASK-006 implementation entry following the same structure as the existing TASK-004/TASK-005 entries (files added/changed, test counts, collaborator count now built out of six).
- **Architecture documentation** (`docs/architecture/FITME_ARCHITECTURE_v1.md`) — only if the implemented repository requires a factual current-state update without changing the approved D3 §17 architecture; a new §23 section analogous to the existing §21/§22 would be the expected form, documenting the Decision Engine's realization as the fourth of six collaborators.
- **Repository inventories or engineering overview** — only if such documents are active/maintained at implementation time.

No closure updates are performed during this initial specification-authoring phase, per the skeleton's explicit instruction and the Spec Authoring Standard's Closure Record Requirements.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Documentation Updates Required | D3, TASK-004, TASK-005, Spec Authoring Standard, Roadmap, Changelog |

---

# 41. READY Definition

Per the Spec Authoring Standard's READY Requirements, the skeleton's own list, and **Canonical Decision CD-T006-08**, TASK-006 reaches READY only when:

- Completed canonical expansion — this document, reviewed and accepted as complete by Head of Product and AI Architect.
- Complete repository evidence review — Section 10's evidence independently re-verified as current at review time (repository state may have changed since this document's authoring commit baseline, `a5aa1c9`).
- Resolution of all true READY Blockers — every Section 38 item Product/Architecture confirms as blocking resolved by its named owner. **P-1** (nested-impact-tier), **E-1** (numeric budget), and **G-8** (Source-to-Hierarchy mapping) are already resolved by Canonical Decisions CD-T006-03/04/07 (Section 38) and do not require further resolution. **Engineering Blocker 1** (arbitration-metadata representation, identified during Engineering Readiness Review) is resolved by the Engineering Fill at Section 14.12; the residual item it leaves open, **G-9** (no real classification source yet for five of the six fields), is non-blocking (Section 38).
- Product approval — Head of Product sign-off via Section 43's checklist.
- Architecture approval — AI Architect sign-off via Section 44's checklist.
- Engineering Readiness Review — per Engineering Workflow §4's lifecycle stage of the same name.
- Complete input, Candidate, Safety, and Terminal Decision contracts — Section 14 (inputs), Section 14.12 (arbitration-metadata representation and derivation contract), Section 15.11 (Stage 5 input contract), Section 16 (Candidate pool), Section 21.8 (Safety Integration Port contract — the *contract* is complete even though the Safety Layer *implementation* remains a tracked, non-blocking Repository Gap, item G-6), and Section 25 (Terminal Decision, corrected per CD-T006-06) all fully closed.
- Complete prioritization and tie-break rules — Section 17, 18, 19, resolved per CD-T006-02/03/04.
- Complete Silence and refusal behavior — Section 23, 24, resolved per CD-T006-06.
- Complete acceptance criteria — Section 36, reflecting the above resolutions.
- **Complete Test Strategy — Section 35, a required precondition per Canonical Decision CD-T006-08, not merely a contingent/deferred item.**
- No unresolved Product or Architecture decision required for implementation — i.e., no outstanding item in Section 38 whose "Blocks READY" position Product/Architecture confirms as "Yes" remains open.

This document does not itself declare TASK-006 READY. Per the Standard: "Marking a specification READY is a Product/Architecture determination made after their review. A specification does not mark itself READY." Nothing in this correction pass performs, or substitutes for, that determination.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| READY Definition | Spec Authoring Standard, Engineering Workflow, Repository |

---

# 42. DONE Definition

Per the Spec Authoring Standard's DONE Requirements, Engineering Workflow §14's Definition of Done, and **Canonical Decision CD-T006-08**, TASK-006 reaches DONE only when:

- Implementation matches the approved READY specification.
- **Passing implementation tests and passing regression tests are both required before DONE** (Canonical Decision CD-T006-08) — all required tests pass (Section 35 in full) and the full regression suite passes (Section 35.18, 36.13); neither is optional or deferrable at this gate.
- Focused engineering review is APPROVED (Section 45, re-performed post-implementation).
- Product and Architecture review is APPROVED (Sections 43–44, re-performed post-implementation).
- Required documentation is updated (Section 40).
- Repository is clean (no stray uncommitted changes).
- Commit and push are complete.
- Closure record is written (Section 47).
- Task marked closed (Engineering Workflow §14's distinct, final step).

This document does not itself declare TASK-006 DONE. DONE is evaluated once, at actual task closure, not populated speculatively during specification authoring.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| DONE Definition | Spec Authoring Standard, Engineering Workflow |

---

# 43. Product Review Checklist

For Head of Product to verify:

- [ ] Decision Philosophy fidelity — Sections 2, 7, 12 faithfully represent D1's decision-formation policy without introducing new coaching content.
- [ ] Canonical Decision Hierarchy fidelity — Section 17's ranking sequence matches D1 Unit 02/07 exactly, with no invented tier or weight.
- [ ] Biggest-problem-first behavior — Section 17.3 correctly instantiates D1-PR-03.
- [ ] Single-winner simplicity — Section 20.1/19.5 correctly instantiates D1-PR-05's default.
- [ ] Narrow multi-option exception discipline — Section 19.3/19.4/20.2 correctly bound the exception to genuinely unresolved ties only, never convenience.
- [ ] Deliberate Silence — Section 23 correctly instantiates D1 Unit 10 across all five paths, with the Decision-Pass-level path (23.4) correctly treated as a fully-formed Terminal Decision.
- [ ] User autonomy and trust — Section 33's autonomy/non-manipulation constraints, and Section 24's refusal/escalation handling, correctly preserve D1-AB-03/D1-AH-02.
- [ ] No engagement-driven ranking — Sections 8, 13, 17.6, 33 correctly and consistently exclude Product Engagement (Tier 10) from every ranking decision.
- [ ] Explainability — Section 26 makes every Terminal Decision's formation reconstructible without leaking sensitive data.
- [ ] No Product scope invention — nothing in this document introduces coaching content, priority weights, or behavioral policy beyond what D1/Constitution/Coach Bible already fix; every remaining open item (Section 38) is correctly left open, not invented; the nine applied canonical decisions (Section 1) — including **P-1**'s now-resolved Initiative-impact-tier question (CD-T006-03) — are correctly and consistently reflected throughout.
- [ ] Objective acceptance criteria — Section 36.1 is testable/reviewable, not vague.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Product Review Checklist | D1, Constitution, Coach Bible |

---

# 44. Architecture Review Checklist

For AI Architect to verify:

- [ ] Decision Layer ownership fidelity — the Decision Engine's boundary matches D3 §8.3 and §11.2 exactly (Sections 12, 28).
- [ ] Stage 5/7/8/9 boundaries — each Stage's Entry/Exit Criteria and Responsibilities match D2 Unit 04 exactly (Sections 15, 17–20, 22).
- [ ] Composite Engine integration — no second Engine Registry entry; internal collaborator only (Sections 13, 28.6–28.8).
- [ ] Internal Pipeline Orchestrator boundary — the Orchestrator's own no-decision-authority constraint (D3 §11.1) is respected; the Decision Engine does not itself sequence other collaborators (Section 28.6).
- [ ] Recommendation/Initiative separation — the Decision Engine never generates Candidate content of either kind, and ranks both kinds jointly without bias (Sections 9.2, 13, 16.2/16.9, 35.13).
- [ ] Safety boundary — no bypass, no independent judgment, correct integration at all three checkpoints the Decision Engine touches (Stage 8 disqualification, Stage 9 final review) (Section 21).
- [ ] Memory/state/persistence boundary — no durable write authority, no direct StateAccess/Firestore bypass of the Memory Layer (Section 29).
- [ ] Expression and Coach Runtime boundary — the Decision Engine produces a Terminal Decision only, with no platform/wording knowledge (Section 30).
- [ ] Exactly one Terminal Decision — verified across every Section 31 exceptional flow, including the multi-option and all-disqualified cases (Sections 22.7, 23, 31).
- [ ] No independent registration — Section 28.7.
- [ ] Deterministic and platform-neutral design — Sections 27, 32, 35.17, 35.19.
- [ ] Safety Integration Port completeness and no-bypass/no-fake guarantee — Section 21.8, Canonical Decision CD-T006-05; confirm production code cannot construct, import, or otherwise reach a Safety test double.
- [ ] Arbitration-metadata representation and derivation contract (Section 14.12) introduces no numeric threshold, scoring formula, or new Product/Architecture policy — confirm the `NO_SIGNAL` sentinel and its comparison semantics (14.12.1) are the only mechanism added, and that this is Engineering Fill completing CD-T006-02, not a new canonical decision.
- [ ] All Architecture-owned Section 38 items reviewed: confirm **P-1**, **E-1**, and **G-8** are correctly resolved (Canonical Decisions CD-T006-03, CD-T006-04, CD-T006-07) and no longer open; confirm Engineering Blocker 1 is correctly resolved by Section 14.12 and that **G-9** correctly records the residual, non-blocking future-derivation item; confirm the recommended "Blocks READY" positions for the remaining items (G-1 through G-7, G-9, A-1, E-2, C-1) are correctly reflected throughout.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Architecture Review Checklist | D2, D3 |

---

# 45. Engineering Self-Review Checklist

Completed by Claude Code (Lead Engineer) before submitting this document:

- [x] Every one of the skeleton's 49 sections is present and completed (no section skipped, merged, split, reordered, or renamed).
- [x] Every repository claim in Section 10 is evidenced — verified directly via `git log`, `Grep`, `Glob`, and `Bash` inspection of the live repository at commit `a5aa1c9`, in addition to an independently-run research agent's findings, cross-checked against both.
- [x] No section introduces an unauthorized Product, AI-behavior, architecture, authority-boundary, or scope decision — every normative statement cites an existing canonical source; every remaining unresolved item is flagged per Section 38's taxonomy rather than filled by inference presented as fact. This version applies exactly the nine canonical decisions supplied for this correction pass (Section 1) and no others — P-1 (the Initiative-impact-tier question TASK-005 explicitly deferred to this document) is now resolved by CD-T006-03, applied consistently at every section that referenced it.
- [x] All pending items are classified using the Spec Authoring Standard's actual five-category taxonomy (Section 38); resolved items (P-1, E-1, G-8) are marked resolved rather than left in a stale "pending" state; Engineering Blocker 1 is resolved by Engineering Fill (Section 14.12), not by a fabricated Canonical Decision, and its residual, non-blocking item is recorded as G-9 rather than left undocumented.
- [x] All normative rules identified in this document map to at least one required test (Section 35, Section 39's Traceability Matrix).
- [x] All acceptance criteria (Section 36) are objective and reviewable from repository evidence once implementation exists; none reduces to a vague standard.
- [x] Cross-section terminology and contracts are consistent — the Terminal Decision contract (Section 25) is referenced identically in Sections 22–31, 34–36, 39; the Stage 4/Decision Engine ownership boundary (Section 9.2) is restated consistently in Sections 13, 15, 23.1, 38 rather than contradicted anywhere.
- [x] No implementation was performed — no production or test code was written, edited, or executed as part of authoring this document.
- [x] No repository files were edited except this specification file (`docs/specs/TASK_006_SPEC_v1.0.md`); all repository inspection was read-only.
- [x] The SPEC does not self-approve READY, Product, or Architecture authority — Sections 41, 42, 46 explicitly decline to do so.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Self-Review Checklist | Spec Authoring Standard, Repository |

---

# 46. Engineering Handoff

- **File created or updated:** `docs/specs/TASK_006_SPEC_v1.0.md` (created).
- **Repository files inspected:** all documents listed in Section 3.1, plus direct, verified inspection of `js/coachDecisionSystem/*.js` (all six files), `js/stateAccess.js` (lines 403–408), `js/derivedIntelligenceConsumer.js` (line 32 and its consumer/policy tables), `js/app.js` (line 2 and `runAppReadyEngines()`), `js/engineRegistry.js`, `js/engines/registerEngines.js`, the `tests/` directory listing, `docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md`, `docs/architecture/FITME_ARCHITECTURE_v1.md` §§20–22, and `git log` for the current branch/commit baseline — both directly and via an independently-run research agent, cross-checked against each other.
- **Branch and commit baseline:** branch `main`, commit `a5aa1c9edd5372fa85d7127072dee6ebeb9fab5c` (2026-08-02), `APP_VERSION '2.41.0'`, test baseline 1212/1212 (per TASK-005 Closure Record, not independently re-run by this specification-authoring activity).
- **Concise summary of specification coverage:** all 49 skeleton sections expanded using only D1/D2/D3/TASK-004/TASK-005/B1–B5/C1–C4/Constitution/Product Bible/Coach Bible/Coach KB/Intelligence & Relationship Philosophy content, with every normative statement cited to its exact source, then corrected by a focused pass applying nine Product/Architecture-approved canonical decisions (Section 1). The central architectural finding carried consistently throughout is that the Decision Engine is the fourth of D3 §17's six internal collaborators, owning Stage 5/7/8/9 exclusively, never generating Candidate content, never exercising independent Safety judgment, and always producing exactly one Terminal Decision — now fixed to exactly four canonical decision families (`RECOMMENDATION`/`INITIATIVE`/`SILENCE`/`BOUNDARY`) — per Decision Pass in which Stage 9 is entered, including the narrow multi-option exception.
- **All Repository Gaps:** G-1 through G-7 open; **G-8 resolved** by CD-T006-07; **G-9** newly recorded (non-blocking future-derivation item for the five `NO_SIGNAL`-baseline fields, Section 38).
- **All Product Decisions Required:** none remain open — **P-1** (the Initiative-kind nested-impact-tier question) is resolved by CD-T006-03.
- **All Architecture Decisions Required:** **A-1** (scope of a possible future `kind`-literal-spelling contract correction); none identified as strictly blocking TASK-006's own implementation.
- **All Engineering Decisions Pending:** **E-1 resolved** by CD-T006-04; E-2 (file/test-double decomposition) remains open, non-blocking (Section 38).
- **All Canonical Conflicts:** C-1 (Section 38) — inherited from TASK-004, restated by TASK-005, further informed by this document's confirmation that `DECISION_ENGINE` remains a reserved-but-fully-disabled B5 consumer id.
- **All non-blocking Follow-ups (recommended, pending Product/Architecture confirmation):** G-1 through G-7, A-1, E-2, C-1.
- **Proposed Engineering Readiness verdict:** This document, as corrected, applies the nine supplied canonical decisions and completes CD-T006-02 with the Section 14.12 Engineering Fill, without introducing any further Product or Architecture decision of its own. No item in Section 38 is recommended as a READY blocker as of this version, and the previously-identified Engineering Blocker 1 is resolved. This document does not itself declare TASK-006 READY, Product-approved, or Architecture-approved — per Section 41, that remains a Product/Architecture determination made through the Engineering Readiness Review process, which this correction pass does not perform.
- **Confirmation that no code or unrelated documentation was changed:** confirmed — only `docs/specs/TASK_006_SPEC_v1.0.md` was created during this activity; all repository inspection was read-only.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Handoff | D1, D2, D3, TASK-004, TASK-005, Constitution, Coach Bible, Product Bible, B1–B5, C1–C4, Repository |

---

# 47. Closure Record

Written at actual task closure (2026-08-03), per Approvals below.

- **Final status**: DONE / CLOSED.
- **Implementation summary**: realizes the fourth of D3 §17's six Coach Decision System internal collaborators — the Decision Engine, owning Stage 5 (Eligibility Evaluation), Stage 7 (Candidate Pool Assembly + Prioritization), Stage 8 (Winner Selection), and Stage 9 (Decision Formation). New: `js/coachDecisionSystem/eligibilityEvaluator.js` (Stage 5, driven by the closed `OpportunityEligibilityInput` contract, Canonical Decision CD-T006-01); `prioritization.js` (Stage 7 pool assembly + the fixed D1-PR-01→06 lexicographic ranking; defines the `NO_SIGNAL` sentinel, Section 14.12); `winnerSelection.js` (Stage 8, single-winner default / narrow tied-set exception, Safety disqualification integration); `decisionFormation.js` (Stage 9, the four-family Terminal Decision contract per Canonical Decision CD-T006-06); `safetyIntegrationPort.js` (the Safety Integration Port contract only, Canonical Decision CD-T006-05 — no Safety Layer policy logic). Modified (focused, additive only, no existing public contract changed): `recommendationEngine.js`/`initiativeEngine.js` (Canonical Decision CD-T006-02 arbitration-metadata fields populated on every Candidate — real `triggeringEvidenceTime` carried from `detectedAt`, every other field `NO_SIGNAL` at this baseline per Section 14.12.2; `recommendationImpactTier` on Recommendation-kind Candidates only, per Canonical Decision CD-T006-03); `internalPipelineOrchestrator.js` (new `runDecisionPass()` dispatch function, structurally parallel to the existing `runForOpportunity`/`runForInitiativeOpportunity` pattern — `run()`'s existing unconditional `candidates: []` contract is unchanged, since no live Stage 3/4 Opportunity source exists yet in this repository, Repository Gap G-2); `index.html`/`sw.js` (script/shell wiring for the five new files). `recommendationCategories.js` is unchanged (Canonical Decision CD-T006-07 approves its existing `SOURCE_HIERARCHY_TIER_MAP` as-is); `memoryLayer.js`, `registerCoachDecisionSystem.js`, `js/stateAccess.js` are unchanged (no new StateAccess capability; no new Engine Registry entry). No `APP_VERSION` change.
- **Tests and results**: 106 new/changed tests across five new test files (`tests/eligibilityEvaluator.test.js`, `prioritization.test.js`, `winnerSelection.test.js`, `decisionFormation.test.js`, `safetyIntegrationPort.test.js`) plus a test-only Safety Integration Port double (`tests/fixtures/safetyIntegrationPortTestDouble.js`) and extensions to `tests/coachDecisionSystemWiring.test.js`, `internalPipelineOrchestrator.test.js`, `recommendationEngine.test.js`, `initiativeEngine.test.js`; full suite **1318/1318 passing** (TASK-005 baseline 1212/1212 unchanged and still passing).
- **Approvals**: Engineering Readiness Review, External Implementation Review, focused Re-Review (post-correction), Product Approval, and Architecture Approval — all APPROVED, communicated directly, not derived or self-certified by Engineering. The External Implementation Review identified one genuine implementation blocker — the D1-PR-06(a) Evidence Hierarchy tie-break comparator in `prioritization.js` was implemented with inverted polarity (numerically higher `evidenceTier` winning, when D1 Unit 11 fixes Tier 1/Explicit User Statement as strongest and Tier 5/Inference as weakest) — corrected in a single focused pass (`prioritization.js` and `tests/prioritization.test.js` only; no other file touched), independently re-verified, and re-approved.
- **Documentation updates**: this specification (Section 1 Status, Section 38 item E-2, this Closure Record); `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md` (new §23). Engineering Workflow, Product Bible, AI Constitution, Coach Bible, Coach Knowledge Base, and D1/D2/D3 reviewed and intentionally left unchanged.
- **Commit hash**: the single commit introducing this implementation and this Closure Record (this file cannot self-reference its own resulting hash — see `git log -1 -- docs/specs/TASK_006_SPEC_v1.0.md` after this commit, following the same disclosure TASK-004's and TASK-005's own Closure Records used).
- **Branch and push status**: committed to `main` and pushed to `origin/main`.
- **Remaining non-blocking Follow-ups** (tracked, not decided or scheduled here; none expand TASK-006's own scope):
  - G-1 through G-7 and G-9 (Section 38) remain open Follow-ups, unchanged by implementation — most centrally G-2 (Stage 4 Evidence Evaluation orchestration ownership, unassigned) and G-6/G-7 (no Safety Layer or Expression implementation exists yet — TASK-006 defines only the Safety Integration Port and the Expression handoff boundary, per Non-Goal). G-9 (no real classification source yet for `evidenceTier`/`trustImpact`/`timingQuality`/`problemMagnitude`/`recommendationImpactTier`, all `NO_SIGNAL` at this baseline) is unaffected by the External Implementation Review's correction — that correction fixed the comparator's *polarity* for when a real `evidenceTier` value eventually exists; it did not, and could not, introduce one.
  - A-1 (Section 38): whether the `kind`-literal spelling mismatch between `RecommendationCandidate` (`'Recommendation'`) and `InitiativeCandidate` (`'INITIATIVE'`) should ever be corrected at its source remains open, AI-Architect-owned; the Decision Engine's own pool-assembly and Decision-Formation logic (`prioritization.js`, `decisionFormation.js`) correctly discriminates both literal values as implemented.
  - E-2 (Section 38): now resolved — the five-file decomposition was adopted as proposed.
  - C-1 (Section 38): the TASK-004-recorded Canonical Conflict about repository hooks remains open, AI-Architect-owned, unaffected by this closure.
  - Two additional, non-blocking engineering interpretations were surfaced and confirmed (not altered) during the External Implementation Review: (1) `lowCoachingValuePeriodActive: true` (D1-IE-04) resolves an Opportunity to ineligible for the whole Decision Pass, absent any canonical numeric/graduated-reduction formula — dormant at this baseline since its Pipeline Context sources are always `UNAVAILABLE`; (2) an all-Candidates-disqualified Decision Pass (§23.5) resolves to `kind: 'SILENCE'` rather than `BOUNDARY`/`REFUSAL`, and does not invoke `finalReview()`, absent any Safety-Layer-communicated signal to distinguish the two outcomes (no Safety Layer implementation exists yet to supply one). Both are recorded for Product/Architecture confirmation, same non-blocking status as G-9.
- **Lessons Learned**: the External Implementation Review process caught a genuine, dormant-but-real ranking-polarity defect that a green 1318/1318 test suite alone did not surface, because the defective comparator's own test asserted the incorrect direction as correct. The fix was scoped to exactly the two files responsible (`prioritization.js`, `tests/prioritization.test.js`), verified by an independent, from-first-principles re-read of the canonical source (D1 Unit 11's explicit tier-numbering list) rather than by re-trusting the original implementation's own citation of "the rule's own 'higher' wording" — a reminder that an inverted-numbering convention (already correctly applied elsewhere in the same file, for `hierarchyTier`/`recommendationImpactTier`) is easy to get backwards for a new field sharing the same "tier" vocabulary without the same explicit ordering nearby.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Closure Record | Spec Authoring Standard |

---

# 48. Global Forbidden Changes

This specification, and any implementation performed under it, is explicitly prohibited from:

- Writing implementation code during specification authoring — none was written for this document.
- Changing Product behavior — no D1/Constitution/Coach Bible/Product Bible rule was altered; every behavioral rule cited above is quoted or paraphrased from an existing approved source.
- Changing canonical architecture — D3 §17's six-collaborator Composite Engine shape is preserved exactly; no seventh collaborator, no new orchestration authority, no redesign proposed.
- Adding engines or pipeline stages — none added; the 13-Stage Canonical Pipeline (D2) is unchanged.
- Moving authority between components — every ownership assignment in this document matches D2 Unit 07/D3 §11 exactly.
- Changing D1 hierarchy, priority, Silence, or output policy — Sections 17, 18, 19, 23, 25 cite D1 exactly, inventing nothing.
- Replacing deterministic rules with opaque scoring — Section 17.7 explicitly prohibits this.
- Generating Recommendation or Initiative content inside the Decision Engine — explicitly prohibited (Section 8, 9.2, 13 items 1–2).
- Implementing the Safety Layer as part of TASK-006 — explicitly excluded (Section 8, 9.3, 38 item G-6), except for the required integration contract/port and a test-only deterministic double, per Canonical Decision CD-T006-05 (Section 21.8) — never a production bypass or fake.
- Implementing Expression, UX, notification, or Design System scope — explicitly excluded (Section 8, 9.2, 9.3, 30, 38 item G-7).
- Adding engagement or retention objectives — explicitly prohibited throughout (Sections 8, 13, 17.6, 33).
- Inventing evidence, confidence, priority, budget, or tie thresholds — explicitly declined; no numeric threshold is invented anywhere in this document (Section 15.10, 17.3), and the shared budget is resolved structurally, with no numeric size, per Canonical Decision CD-T006-04 (Section 18, 38 item E-1, resolved).
- Treating AI inference as authoritative memory — not applicable to this document's own scope (the Decision Engine performs no memory writes at all, Section 29.6), and not introduced.
- Bypassing Safety — explicitly prohibited (Section 13 items 6–7, 21.6).
- Adding direct persistence from the Decision Engine — explicitly prohibited (Section 13 items 8–9, 29.4–29.5).
- Introducing browser-only domain dependencies — explicitly prohibited (Section 14.10, 27, 32, 35.19).
- Changing unrelated files — none changed; only this specification file was created (Section 45, 46).
- Declaring Product or Architecture approval on its own — explicitly declined (Sections 41, 42, 46's proposed-not-final verdict).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Global Forbidden Changes | D1, D2, D3, Constitution, Coach Bible, Product Bible |

---

# 49. Specification Authoring Instructions for Claude Code — Compliance Record

The skeleton's instructions to Claude (§49) were followed as follows:

1. **Inspected the current repository and every relevant canonical source before writing conclusions** — full-text reading of D1, D2, D3, the Spec Authoring Standard, the Engineering Workflow, D3's architecture sections §20–22, TASK-004's and TASK-005's specifications in full (including their Closure Records), plus a dedicated, independently-run repository-evidence research pass, both completed before this document's drafting began and cross-checked against direct `git log`/`Grep`/`Bash` verification.
2. **Distinguished canonical requirements from repository facts and engineering proposals** — canonical requirements are cited to D1/D2/D3/Constitution/etc.; repository facts are cited to exact file paths and, where available, line numbers (Section 10); engineering proposals (candidate file paths, candidate test names, candidate module decomposition) are explicitly labeled "candidate" throughout (Sections 25.13, 34, 38 item E-2).
3. **Cited exact files, sections, rules, symbols, and tests wherever possible** — done throughout; see in particular Sections 10, 15–26, 39.
4. **Preserved all approved decisions from D1, D2, D3, TASK-004, and TASK-005** — no decision from any of these five sources was reopened, altered, or contradicted; every deferred item TASK-004/TASK-005 left open and relevant to this document's scope (most centrally, TASK-005's G-5, carried forward here as P-1) is restated as still open, not silently resolved.
5. **Classified unresolved matters using the approved taxonomy** — Section 38 uses the Spec Authoring Standard's actual five-category taxonomy.
6. **Avoided inventing Product or Architecture decisions** — every remaining gap is recorded as a gap (Section 38), never silently resolved. This version's correction pass applied exactly the nine canonical decisions supplied by Head of Product + AI Architect (Section 1) and introduced no additional Product or Architecture decision of its own — P-1, in particular, was resolved by the supplied Canonical Decision CD-T006-03, not by engineering inference.
7. **Wrote one complete specification rather than a partial draft** — all 49 sections are fully expanded; none is a placeholder.
8. **Performed an Engineering Self-Review before returning the file** — Section 45.
9. **Stopped after specification authoring and reporting** — no implementation, closure documentation, commit, or push was performed as part of this activity.
10. **Did not implement code, update closure documentation, commit, or push** — confirmed (Section 46).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Specification Authoring Instructions for Claude Code — Compliance Record | D1, D2, D3, TASK-004, TASK-005, Constitution, Spec Authoring Standard, Repository |

---

# End of Specification
