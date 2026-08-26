# TASK_005_SPEC_v1.0

## Initiative Engine

**Document Type:** Canonical Task Specification
**Work Item:** TASK-005 — Initiative Engine
**Prepared By:** Head of Product + AI Architect (skeleton); Claude Code acting as Lead Engineer (expansion)
**Expansion Owner:** Claude Code, Lead Engineer only
**Skeleton Source:** `docs/specs/TASK_005_SPEC_SKELETON.md`
**Repository Baseline Commit:** `f2c734d40e0adbb700f863694f47e7d075f5c5cf` (2026-07-29, `feat(task-004): implement and close Recommendation Engine (Composite Engine)`), branch `main`, `APP_VERSION = '2.41.0'` (`js/app.js:2`)

---

# 1. Status

**Specification Version:** v1.0 (first canonical expansion of the approved skeleton)

**Lifecycle State:** **DONE / CLOSED**

**Closure Update (2026-08-02):** the paragraph and bullet list immediately below describe this document's status as authored, at the **SPEC** stage (2026-07-29), and are preserved unchanged as the historical record of that stage. Since then, TASK-005 has completed Canonical Review, Product Approval, Architecture Approval, and Engineering Review (all APPROVED), Implementation, a focused Code Review correction pass (four corrections applied and verified), and Documentation Update, and is now **DONE / CLOSED** per the Engineering Workflow's Standard Task Lifecycle below. See Section 45 (Closure Record) for the full closure record.

Per the Engineering Workflow's Standard Task Lifecycle (`docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §4, reproduced identically in the Spec Authoring Standard's Applicability section): `Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed`. This document is the **SPEC** stage output. It has not yet undergone **Engineering Review**, has not been marked **READY**, and no **Implementation** has occurred.

At the SPEC stage, this document explicitly was NOT yet:
- Canonical Review complete (Product/Architecture review has not occurred)
- Engineering Review complete
- READY
- In Implementation
- Implemented
- DONE / CLOSED

(All of the above are now complete — see the Closure Update above and Section 45.)

Per the Spec Authoring Standard (`docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md`, "READY Requirements"): *"Marking a specification READY is a Product/Architecture determination made after their review. A specification does not mark itself READY."* Per the same document's "DONE Requirements": *"DONE is evaluated once, at actual task closure, not populated speculatively during specification authoring."* Accordingly, Sections 39–40 (READY/DONE Definitions) below state conditions, not verdicts, and Section 45 (Closure Record) is left reserved and empty.

**Repository Evidence Note (procedural, not lifecycle):** the Specification Authoring Standard that governs this document's structure and evidence discipline is itself versioned `v1.0` and self-declared **"Draft Canonical"** (`FITME_SPEC_AUTHORING_STANDARD_v1.0.md`, Standard Lifecycle and Versioning: *"a Draft Canonical version has not yet received Head of Product + AI Architect approval and does not yet govern any task specification as canonical; only an approved, Canonical version does"*). This is recorded as **Repository Gap** context in Section 36 and does not block spec authoring — TASK-004 was completed under the same standard version without this being treated as a blocker — but it is disclosed here for completeness.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Status | TASK-004, Spec Authoring Standard, Engineering Workflow |

---

# 2. Purpose

TASK-005 exists to give the Coach Decision System — the single Composite Engine approved by D3 §17 and first partially realized by TASK-004 (`js/coachDecisionSystem/`) — its **Initiative Engine** internal collaborator: the component responsible for producing **Initiative-kind Candidates** under the Initiative Policy fixed by D1 Unit 09 (`docs/specs/D1_SPEC_v1.0.md`, lines 666–721).

An **Initiative** is coach-originated contact not directly requested by the user in the current moment (D1 Shared Vocabulary, line 98). Producing an Initiative-kind Candidate is the Initiative Engine's sole positive function within the Canonical Pipeline D2 defines (`docs/specs/D2_SPEC_v1.0.md`): it **contributes** to Stage 3 (Opportunity Detection) — specifically confirmed-pattern anticipation and disruption/milestone detection only (D2 Unit 07, Initiative Engine subsection) — and **owns orchestration authority** for Stage 6 (Candidate Generation) for Initiative-kind Candidates only, applying D1 Unit 09 in full, including Relationship-Maturity gating (D1-IP-02).

This specification must establish, and does establish throughout, that the Initiative Engine does not take authority belonging to:
- the **Decision Engine** (TASK-006) — Prioritization (Stage 7), Winner Selection (Stage 8), Terminal Decision Formation (Stage 9), and Eligibility Evaluation (Stage 5) orchestration;
- the **Safety Layer** — disqualification, modification, deferral, or blocking of any Candidate or Terminal Decision, and the mandatory pre-Expression safety evaluation (D1-AB-05);
- the **Memory Layer** — Pipeline Context assembly (Stage 2), durable writes (Stages 11–13), and all Decision Input reads (D3 §8.1, §11.1);
- **Expression** — translation of a Terminal Decision into delivery language (Stage 10);
- the **Coach Runtime** — platform-specific delivery, notification scheduling, and UI presentation (D3 §10.4, Decision 6);
- delivery systems generally — no platform or delivery-channel selection (D3 §11.3).

The Initiative Engine is architecturally and functionally distinct from, and never substitutes for, the **Recommendation Engine** (TASK-004, already implemented) — the two Candidate kinds are governed by separate D1 Units (Unit 08 vs. Unit 09) and are kept in structurally separate components specifically so that "Initiative-specific rules (D1-IP-04, D1-IP-08) cannot leak into Recommendation Candidate generation or vice versa" (D3 §8.5).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Purpose | D1, D2, D3, TASK-004, TASK-006, Repository |

---

# 3. Canonical Authority

## 3.1 Governing Documents Inspected

| Document | Version / Status | Role for TASK-005 |
|---|---|---|
| `docs/product/Product_Bible.md.docx` | v1.0 | Names "Initiative Engine" as backlog item 5 (§11); defers coaching-doctrine detail to the Coach Bible (§13) |
| `docs/constitution/FITME_AI_Constitution_v1.0.md` | v1.0 | Chapter 12 (Initiative Intelligence) and Chapter 13 (Push Notification Constitution) are the primary product-philosophy source D1 Unit 09 operationalizes; Chapter 23 (AI Safety Constitution) fixes the Safety Layer authority boundary; Chapter 22 (Ethics) fixes non-manipulation/non-engagement doctrine |
| `docs/governance/FITME_Coach_Bible.md` | Ch.1 approved (per Product Bible §13) | Canonical coaching doctrine; source for evidence/confidence philosophy (Ch.3), disruption/milestone/anticipation texture (Ch.5), silence doctrine (Ch.1 §46, Ch.2 §10, Ch.3 §11, Ch.4 §11) |
| `docs/governance/FITME_Coach_Knowledge_Base.md` | Living research document | Non-governing per Engineering Workflow §3 ("feeds future Coach Bible chapters but does not itself govern implementation"); cited only where consistent with Coach Bible/Constitution |
| `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` | v1.0 | Secondary/contextual source (see 3.3 below); cited only where non-contradictory with the Coach Bible/Constitution chain |
| `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md` | v1.0, "Draft Canonical" | Governs this document's structure, evidence classification, and unresolved-item taxonomy |
| `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` | Draft v1.0 | Governs task lifecycle, roles, and Definition of Done |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | Baseline commit `01ee236`, updated through §21 (TASK-004) | Architectural placement of the Coach Decision System and its six collaborators |
| `docs/specs/D1_SPEC_v1.0.md` | v1.0 | Initiative Policy (Unit 09), Opportunity Detection (Unit 05), Eligibility (Unit 06), Silence (Unit 10), Evidence (Unit 11), Memory Usage (Unit 12), Personalization (Unit 13), Authority Boundaries (Unit 14), Canonical Decision Output (Unit 15) |
| `docs/specs/D2_SPEC_v1.0.md` | v1.0 | 13-Stage Canonical Pipeline, Stage Contracts, per-engine orchestration responsibilities (Unit 07), exceptional flows (Unit 08), traceability (Unit 09) |
| `docs/specs/D3_SPEC.md` | approved (§17 decisions) | Composite Engine architecture, Initiative Layer (§8.5), component contracts (§11.2), forbidden responsibilities (§11.3), graceful degradation (§12), native compatibility (§5.5, §14) |
| `docs/specs/TASK_004_SPEC_v1.0.md` | v1.0, DONE/CLOSED | Existing Composite Engine, Recommendation Engine, Memory Layer, Candidate contract pattern (CC-02/CC-03), test structure |
| `docs/roadmap/Roadmap.md` | Last updated 2026-07-29 | TASK-005 status: "⏳ PENDING"; confirms TASK-004 is the current closed baseline |
| `docs/roadmap/Changelog.md` | Last updated 2026-07-29 | TASK-004 implementation detail; confirms Initiative Engine as one of six D3 §17 collaborators, unbuilt |
| `docs/tasks/B1/B1_SPEC.md`, `B2/B2_SPEC.md`, `B3/SPEC.md`, `B4/B4_SPEC.md`, `B5/B5_SPEC_v1.0.md` | all CLOSED | Engine Registry/Contract (B2), State Access (B3), Persistence Gateway (B4), Derived Intelligence Consumer including the disabled `INITIATIVE_ENGINE` consumer stub (B5) |
| `docs/specs/C1_SPEC_v1.0.md`, `C2_SPEC_v1.1.md`, `C3_SPEC_v1.0.md`, `C4_SPEC_v1.0.md` | all CLOSED | Modularization map (C1), rejection/suppression feedback (C2), event model (C3), typed-memory server write path (C4) |

## 3.2 Precedence

Per Engineering Workflow §3 ("Source of Truth"), the governing precedence order is: **1. AI Constitution → 2. Product Bible → 3. Coach Bible → 4. Architecture → 5. Engineering Workflow → 6. Task SPEC → 7. Roadmap → 8. Changelog.** The Coach Knowledge Base is explicitly excluded from this ordering ("a living research document, not a source of truth"). This specification does not create a new authority hierarchy; it applies the existing one.

## 3.3 Observation on `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`

This document is not listed in Engineering Workflow §3's Source of Truth ordering at all, yet the approved skeleton (§3) directs Claude to inspect it as a canonical source. No content conflict was found between it and the Coach Bible/Constitution chain during research (its Chapter 4/6/9/12 material on recommendation timing, confidence, and non-manipulation is consistent with, if thinner than, Constitution Ch.11/20/22 and Coach Bible Ch.3). Its precedence relative to the Coach Bible is therefore recorded as **Repository Gap** (Section 36, item G-1) rather than **Canonical Conflict** — no two sources were found to actually disagree; the ambiguity is one of unstated precedence, not contradiction. This document is cited below only where it is corroborating, never as a sole source for a normative rule.

## 3.4 True Conflicts Recorded

Genuine conflicts (evidence contradicting evidence) discovered during research are recorded in Section 36 using the three-element format the Spec Authoring Standard requires for a Canonical Conflict: the conflicting sources, the decision required, and who owns it. No conflict is analyzed or resolved in this section or elsewhere in this document.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 3.1 Governing Documents Inspected | D1, D3, TASK-004, Constitution, Coach Bible, Product Bible, B1, B2, B3, B4, B5, C1, C2, C3, C4, Spec Authoring Standard, Engineering Workflow, Roadmap, Changelog |
| 3.2 Precedence | Constitution, Coach Bible, Coach Knowledge Base, Product Bible, Engineering Workflow, Roadmap, Changelog |
| 3.3 Observation on `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` | Constitution, Coach Bible, Engineering Workflow |
| 3.4 True Conflicts Recorded | Spec Authoring Standard |

---

# 4. Ownership and Decision Boundaries

Per the Spec Authoring Standard ("Authority and Decision Boundaries"), four distinct kinds of contribution exist, and this entire document is authored inside that boundary:

- **Head of Product decisions** — "product intent, philosophy, scope, coaching content, and any behavior-level decision." Already fixed for TASK-005 by the Product Bible (§11 backlog placement) and, operationally, by D1 Unit 09's Initiative Policy (already approved canonical product policy, not reopened here).
- **AI Architect decisions** — "architecture, runtime placement, ownership, and system-integration decisions." Already fixed for TASK-005 by D2 (pipeline/stage ownership), D3 §8.5/§11 (Initiative Layer placement, contracts, forbidden responsibilities), and TASK-004 (existing Composite Engine shape).
- **Lead Engineer responsibilities** (this document's author) — "filling implementation detail, gathering repository evidence, writing tests, and reporting gaps or conflicts, strictly inside the boundaries Product and Architecture have already set." Claude may document repository facts, implementation constraints, technical options (e.g., candidate file paths, candidate test names), and engineering risks. Claude may **not** invent or change Product policy (e.g., what counts as a "genuine milestone"), AI/coach behavior, canonical architecture (e.g., the six-collaborator Composite Engine shape), authority boundaries (e.g., who owns Eligibility), or task scope (e.g., adding Prioritization to this engine).
- **Repository evidence** — facts about the current state of the codebase, classified per the Standard's Evidence Classification scheme (verified repository evidence / canonical-document evidence / engineering inference / missing repository evidence). Every factual claim in this document is labeled, implicitly by citation form, as one of these four; unlabeled prose is canonical-document paraphrase with an inline citation.

Where this document must record something Product or Architecture has not yet decided, it uses the exact classification the Standard defines (Section 36), not an invented category, and it does not attempt to resolve the gap itself.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Ownership and Decision Boundaries | D1, D2, D3, TASK-004, Product Bible, Spec Authoring Standard |

---

# 5. Relationship to Previous Work

## 5.1 D1 — Initiative Policy and Supporting Units

D1 Unit 09 (Initiative Policy, D1-IP-01 through D1-IP-10) is the direct product-policy specification this engine implements. It is gated upstream by Unit 06 (Intervention Eligibility — D1-IP-01: "Every Initiative SHALL first pass the Unit 06 Intervention Eligibility gate; there is no separate, weaker bar for Initiative") and Unit 05 (Opportunity Detection — the five canonical Opportunity sources). It interacts with Unit 10 (Silence Policy), Unit 11 (Evidence Hierarchy and confidence rules, including CDR-4's prohibition on invented numeric thresholds), Unit 12 (Memory Usage — AI-inferred memory remains Tier 5/candidate-only), Unit 13 (Personalization, D1-PER-01 through 06), Unit 14 (Authority Boundaries, including D1-AB-05's non-bypassable safety evaluation), and Unit 15 (Canonical Decision Output, D1-CDO-01 through 04). TASK-005 does not reopen any of these approved Units; it implements them.

## 5.2 D2 — Pipeline Stages, Stage Contracts, Initiative Engine Responsibilities

D2 fixes the 13-Stage Canonical Pipeline and assigns the Initiative Engine an explicit, narrow orchestration role (Unit 07, Initiative Engine subsection, quoted in full at Section 12 below): it **participates** in Stage 3 (Opportunity Detection) for confirmed-pattern anticipation and disruption/milestone detection only, and **holds orchestration authority** for Stage 6 (Candidate Generation) for Initiative-kind Candidates only. It is explicitly forbidden from Prioritization, Winner Selection, or Decision Formation (Stages 7–9, owned by the Decision Engine), and from initiating contact for engagement/retention (D1-IP-04) or repeating Initiative after it was ignored (D1-IP-08). Decision-Window detection at Stage 3 is a **Recommendation Engine** contribution, not an Initiative Engine one (D2 Unit 04, Stage 3 Dependencies: "Initiative Engine (anticipation); Recommendation Engine (Decision Window detection)") — this distinction is load-bearing throughout this document and is discussed in full at Section 9 and Section 22.

## 5.3 D3 — Composite Engine Architecture, Initiative Layer

D3 §17 (Decision 1) fixes the Coach Decision System as a single B2-registered Composite Engine with six internal, non-independently-registered collaborators: Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, Expression, sequenced by an Internal Pipeline Orchestrator that itself has no decision-content authority. §8.5 defines the Initiative Layer (quoted in full at Section 26). §6.4 (Responsibility Matrix) and §11.2 (Component Contracts) fix, byte-for-byte identically to the Recommendation Engine's row except for Candidate kind, what the Initiative Engine consumes (Pipeline Context, from the Memory Layer only), produces (output for the Decision Layer only), and is forbidden to touch (Prioritization, Winner Selection, durable state). §11.1 and §11.3 consolidate the architecture-level forbidden-responsibility list. §12 fixes graceful-degradation requirements; §5.5 and §14 fix native-compatibility/Pure-Domain-shape expectations, naming the Initiative Engine explicitly in both.

## 5.4 TASK-004 — Existing Composite Engine, Pipeline Orchestration, Shared Contracts

TASK-004 (DONE/CLOSED, commit `f2c734d`) built the first two of the six D3 §17 collaborators: a minimal, read-only Memory Layer (`js/coachDecisionSystem/memoryLayer.js`) and the Recommendation Engine (`recommendationEngine.js`, `recommendationCategories.js`), registered as a single Composite Engine (`registerCoachDecisionSystem.js`, engine id `'coachDecisionSystem'`) via an Internal Pipeline Orchestrator (`internalPipelineOrchestrator.js`) that currently always returns an empty candidate list because "no genuine EligibleOpportunity exists yet" (orchestrator source comment). TASK-004's own Closure Record states: *"Future tasks (TASK-005, TASK-006) extend this infrastructure; they do not redesign or replace it"* and names Stage 6 Initiative-kind Candidate Generation as explicitly out of TASK-004's scope. TASK-005 must reuse, and — per Canonical Decision CD-T005-01 (Section 25, Section 32) — make a focused extension to, this infrastructure: the Engine Registry entry, the Orchestrator, the Memory Layer's Pipeline Context (extended, not redesigned), and the Candidate-shape pattern established by CC-02/CC-03, rather than introduce a second registration or a competing contract shape. Full detail at Section 10 and Section 26.

## 5.5 B1–B5, C1–C4 — Consumed Contracts and Infrastructure

TASK-005 consumes, or is directly constrained by, the following approved infrastructure (full extraction at Sections 14, 25, and 27):
- **B2** (Engine Registry/Contract) — the `run(context)`/`EngineRunResult` shape any new internal collaborator wiring must respect; override-chaining is prohibited.
- **B3** (State Access) — `js/stateAccess.js`'s `EngineStateAccess` capability and closed permission matrix; the Memory Layer's existing `coachDecisionSystem.DECISION_PASS` entry (`js/stateAccess.js:403-408`) is the only current permission-matrix entry for the Composite Engine.
- **B5** (Derived Intelligence Consumer) — names `INITIATIVE_ENGINE` as a reserved consumer id (`js/derivedIntelligenceConsumer.js:32`) and `INITIATIVE_SUPPORT_V1` as a reserved-but-disabled policy (B5 §19.3, §51.1); both remain **disabled** at this baseline.
- **C2** (Rejection/Suppression Feedback) — `js/feedback/feedbackDomain.js`'s `evaluateSuppression()` mechanism, already consumed by the Recommendation Engine, explicitly scoped by C2 itself to the Trigger and Adaptive TDEE surfaces only ("No Recommendation/Initiative/Decision Engine... not built as part of C2").
- **C3** (Event Model) — the closed `feedback`-kind event schema in `users/{uid}.coachEvents[]`; no second event kind exists or may be introduced without a future SPEC revision.
- **C4** (Typed Memory Server Write Path) — `functions/typedMemoryServerWrite.js`, restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, every write forced to `status: 'candidate'`, no promotion mechanism, and **no wired caller** at this baseline.

B1 and B4 are cited only for their binding, engine-agnostic rules (B1 §10: no LLM may directly create authoritative canonical memory; B4 §37: explicitly does not build the Initiative Engine and its persistence-operation catalog contains no Initiative-related operation).

## 5.6 No Reopening of Closed Decisions

No content in this document reopens a decision closed by D1, D2, D3, or TASK-004. Where repository evidence appears to narrow or complicate a closed decision (for example, the `INITIATIVE_ENGINE` consumer stub bearing on TASK-004's own recorded Canonical Conflict about repository hooks), it is recorded as evidence in Section 10 and Section 36, not treated as license to alter the closed decision.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 5.1 D1 — Initiative Policy and Supporting Units | D1 |
| 5.2 D2 — Pipeline Stages, Stage Contracts, Initiative Engine Responsibilities | D1, D2 |
| 5.3 D3 — Composite Engine Architecture, Initiative Layer | D3, B2 |
| 5.4 TASK-004 — Existing Composite Engine, Pipeline Orchestration, Shared Contracts | D3, TASK-004, TASK-006, Repository |
| 5.5 B1–B5, C1–C4 — Consumed Contracts and Infrastructure | B1, B2, B3, B4, B5, C1, C2, C3, C4, Repository |
| 5.6 No Reopening of Closed Decisions | D1, D2, D3, TASK-004 |

---

# 6. Problem Statement

After TASK-004, the Coach Decision System exists as a registered Composite Engine with a working Memory Layer (Pipeline Context assembly, from real `StateAccess` and `DerivedIntelligenceConsumer` reads, with graceful degradation) and a working Recommendation Engine (deterministic, validated Candidate generation from an `EligibleOpportunity`, with suppression-aware output). It **cannot yet** produce any Candidate of any kind in ordinary operation, because Stages 3, 4, and 5 of the Canonical Pipeline (Opportunity Detection, Evidence Evaluation, Eligibility Evaluation) are not built — the Orchestrator's `run()` method assembles a real Pipeline Context and then returns `candidates: []` unconditionally, by design, because no `EligibleOpportunity` object is ever constructed. `runForOpportunity()` exists and is wired to `RecommendationEngine.generate()`, but nothing yet supplies it a real opportunity, and nothing at all exists to supply an Initiative-kind counterpart.

Specifically, before TASK-005, the system **cannot**:
- detect a confirmed-pattern anticipation, disruption, or milestone/recovery-support Opportunity as an Initiative Engine contribution to Stage 3 (D2 Unit 07);
- construct an Initiative-kind Candidate from such an eligible Opportunity, gated by Relationship-Maturity per D1-IP-02;
- apply Initiative-specific prohibitions (D1-IP-04 no engagement-driven initiation; D1-IP-08 no repeating an ignored Initiative) anywhere in the pipeline, since no component currently produces Initiative-kind output at all;
- exercise the D1 Unit 10 Silence doctrine specifically in its Initiative-Candidate-generation form (as distinct from the Recommendation Engine's own, already-implemented empty-candidate-list Silence path).

Initiative-kind Candidate production must remain **architecturally distinct** from Recommendation-kind Candidate production — not merely a code-reuse convenience, but a canonical requirement: D3 §8.5 states the Initiative Layer exists as "its own component boundary distinct from the Recommendation Engine... so that Initiative-specific rules (D1-IP-04, D1-IP-08) cannot leak into Recommendation Candidate generation or vice versa," because the two kinds of Candidate are governed by different D1 Units (08 vs. 09) that must not be conflated (D2 Unit 07's per-engine Forbidden Responsibilities). TASK-005 closes this specific, scoped gap — it does not build Stages 3–5 generally (Decision-Window detection, Evidence Evaluation, or Eligibility Evaluation orchestration remain owned elsewhere, per Section 9 and Section 18), and it does not build the Decision Engine, Safety Layer, or Expression.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Problem Statement | D1, D2, D3, TASK-004 |

---

# 7. Product Objectives

Grounded in Constitution Ch.12 (Initiative Intelligence), Ch.13 (Push Notification Constitution), and D1 Unit 09:

- **Timely and useful coach-originated intervention opportunities.** D1-IP-05 (predictive over reactive): "Where a Decision Window or decision-fatigue moment is foreseeable, the coach SHALL prepare and intervene before it, not react after it has passed." Constitution §12.7: "The coach anticipates decision moments... The coach prevents problems. It doesn't simply solve them."
- **Relationship-sensitive initiative behavior.** D1-IP-02 gates the scope of permissible Initiative by Relationship Maturity Stage (Observer/Assistant/Trusted Coach/Personal Coach, Constitution §12.2). D1-PER-03: personalization depth and directiveness "SHALL scale with Relationship Maturity Stage... more explanation and verification early, more anticipation and reduced friction later."
- **Trust preservation.** D1-IE-02 (Trust Test): "if it is uncertain whether the user will be glad to have been interrupted, the coach SHALL NOT intervene" (Constitution §13.4). Constitution §12.3: every Initiative must answer "Why am I reaching out?" from an enumerated valid-reason set (D1-IE-01).
- **Avoidance of engagement-driven contact.** D1-IP-04: "The coach SHALL NOT initiate contact for metrics, retention, or engagement; only for the person." Constitution Principle 12: "The coach never initiates conversation to increase engagement... only to increase the user's probability of long-term success." Constitution §12.11: "FITME measures success through outcomes. Not addiction."
- **Deterministic and explainable Candidate production.** D2-TR-01 through D2-TR-06 (traceability); D1-RP-02 (statable rationale required or the Candidate does not exist, per D1-CDO-02).
- **Correct use of evidence and uncertainty.** D1 Unit 11's Evidence Hierarchy; Constitution §20.5: "High-confidence predictions may become proactive coaching. Low-confidence predictions should remain silent."
- **Deliberate Silence when initiative is not justified.** D1 Unit 10 (Silence Policy); Constitution §12.9: "Not every day requires coaching... Sometimes the best initiative is none at all. Silence communicates confidence"; §13.19: "Sometimes the most intelligent push notification is the one that was never sent."

This section does not define UX wording, notification design, engagement targets, or delivery-channel behavior — those belong to Expression (D3 §8.6), the Coach Runtime (D3 §10.4), and future UX/Design System work (TASK-007/008), none of which TASK-005 implements.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Product Objectives | D1, D2, D3, TASK-007, Constitution |

---

# 8. Non-Goals

The Initiative Engine explicitly excludes:

| Excluded Responsibility | Owner Instead | Canonical Basis |
|---|---|---|
| Prioritization | Decision Engine (TASK-006), Stage 7 | D2 Unit 07 (Initiative Engine Forbidden Responsibilities); D3 §6.4, §11.1, §11.2, §11.3 |
| Winner Selection | Decision Engine (TASK-006), Stage 8 | Same as above |
| Terminal Decision Formation | Decision Engine (TASK-006), Stage 9 | D2 Unit 07; D1-CDO-03 ("a generative or LLM layer... SHALL NOT originate the underlying decision, its priority, or its rationale") |
| Final Safety authority | Safety Layer | D1-AB-05; D3 §11.1 ("Only the Safety Layer may disqualify a Candidate or modify/defer/block a Terminal Decision"); Constitution Ch.23 Engineering Implications |
| Message wording or Expression | Expression, Stage 10 | D2 Unit 04 Stage 10; D3 §8.6 |
| Notification scheduling and platform delivery | Coach Runtime | D3 §10.4 (Decision 5, Decision 6); D3 §11.3 ("no component may select or reference a delivery platform except the existing Coach Runtime") |
| UI and UX implementation | Coach Runtime / future TASK-007 | D3 §4.1 ("does not introduce a new delivery surface") |
| Durable memory ownership | Memory Layer | D3 §8.1, §11.1 ("Only the Memory Layer may initiate a durable write... only through the Persistence Gateway or the C4 write path") |
| Independent Engine Registry registration | N/A — Initiative Engine is an internal collaborator of the single `coachDecisionSystem` registration | D3 §17 Decision 1; §11.1, §11.3; AI-01 |
| Redesign of the Composite Engine or canonical pipeline | N/A | D3 §17; this document does not alter D2's 13-Stage Pipeline |
| TASK-006 Decision Engine responsibilities | Decision Engine | Roadmap backlog position 6 |
| TASK-007 UX System responsibilities | Future UX System | Product Bible §11 backlog position 7 |
| TASK-008 Design System responsibilities | Future Design System | Product Bible §11 backlog position 8 |

Additionally excluded, per D2 Unit 07's Forbidden Responsibilities for the Initiative Engine specifically: **engagement- or retention-driven initiative** (D1-IP-04) and **repeated initiative merely because an earlier initiative was ignored** (D1-IP-08) — these are behavioral non-goals, not component-boundary non-goals, and are enforced inside the Initiative Engine's own logic (Section 20), not delegated elsewhere.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Non-Goals | D1, D2, D3, TASK-006, TASK-007, TASK-008, Constitution, Product Bible, C4, Roadmap |

---

# 9. Functional Scope

## 9.1 Required Now

- **Stage 3 contribution (Opportunity Detection).** Per D2 Unit 07: "Participates in Opportunity Detection (Stage 3), specifically **confirmed-pattern anticipation and disruption/milestone detection** (D1 Unit 05)." This is a contribution, not sole ownership — Stage 3 as a whole has no single orchestration-authority owner (D2 Unit 03 Stage Overview: "Contributed to by the Recommendation Engine, Initiative Engine, and Safety Layer").
- **Stage 6 ownership for Initiative-kind Candidates (Candidate Generation).** Per D2 Unit 07: "holds orchestration authority for Candidate Generation (Stage 6) for Initiative-kind Candidates, applying D1 Unit 09 in full, including Relationship-Maturity gating (D1-IP-02)."
- **Confirmed-pattern anticipation.** D1 Unit 05: "a standing, well-confirmed pattern only... A single prior instance is not a basis for anticipation; it is guessing" (Coach Bible Ch.5 §3).
- **Disruption opportunities**, both **calendar disruptions** (known in advance) and **structural disruptions** (visible only once they occur) (D1 Unit 05).
- **Milestone opportunities** — genuine milestones only, celebration reserved and restrained (D1-IP-06; Coach Bible Ch.5 §8 "arrival fallacy"/"renewal").
- **Recovery-support opportunities** — post-setback moments (D1 Unit 05, citing Coach Bible Ch.2, Ch.10).
- **Relationship-Maturity gating** of the above, per D1-IP-02's four-stage scope (Section 17).
- **Construction of Initiative-kind Candidates** meeting the contract in Section 19.
- **Traceability and explainability fields** per D2 Unit 09 (Section 28).
- **No-candidate / Silence-compatible outcomes** — the Initiative Engine must be able to produce zero Candidates for an eligible Opportunity (D1-RP-02/D1-CDO-02 analog applied to Initiative; D2-EF-04).

## 9.2 Explicitly Not Owned by the Initiative Engine at Stage 3 (Deferred / Owned Elsewhere)

- **Decision Window detection.** D2 Unit 04, Stage 3 Dependencies: *"Context Assembly; Safety Layer (mandatory injection path); Initiative Engine (anticipation); **Recommendation Engine (Decision Window detection)**."* The Initiative Engine does not detect Decision Windows at Stage 3 — that Stage-3 contribution belongs to the Recommendation Engine (TASK-004, already built, though its own Decision-Window-detection logic is itself not yet implemented — see Section 10). This does not remove D1-IP-05's obligation from the Initiative Engine: where a Decision-Window-sourced Opportunity has already been detected (by the Recommendation Engine's Stage-3 contribution) and reaches Stage 6 as an eligible Opportunity being evaluated for an *Initiative*-kind Candidate (as opposed to a Recommendation-kind one), the Initiative Engine's Stage-6 logic must still apply D1-IP-05's predictive-timing rule (**Engineering Interpretation**: D1-IP-05 does not itself distinguish Stage-3 detection ownership from Stage-6 application; this document reads the rule as binding at whichever Stage the Initiative Engine actually acts, consistent with D1-IP-01's requirement that Initiative pass through the same policy regardless of Opportunity source). The distinction is about **Stage-3 detection ownership**, not about which policy applies once an Opportunity reaches Stage 6. This is documented further at Section 15.1 and Section 22.
- **Explicit user statements or actions.** Originally recorded: D1 Unit 05 lists this as a canonical source category but does not assign its Stage-3 detection to any specific engine (unlike the other four sources); D2 Unit 07 does not name the Initiative Engine as a contributor for it either; recorded as Repository Gap (Section 36, item G-2). Per CD-G2-01 (`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`), Explicit User Statement/Action is a Decision Input and evidentiary signal, not an independent Canonical Opportunity Source — D1 Unit 05's five-item list does not include it, correcting the original characterization above. No Stage-3 ownership question arises for the Initiative Engine or any other engine, since no independent source exists to own; Section 36, item G-2 is resolved accordingly.
- **Safety/high-risk-triggered Opportunity ownership.** Per D1-OD-04 and D2-EF-01(a), safety/high-risk triggers are injected by the **Safety Layer**, unconditionally, bypassing Evidence Evaluation and Eligibility Evaluation entirely — this is not a Recommendation- or Initiative-Engine-owned detection path. The skeleton's own caution (§9) is honored here: this document does **not** silently assign Safety-triggered Opportunity ownership to the Initiative Engine; Section 15.8 and Section 24 document the boundary precisely.
- **Evidence Evaluation (Stage 4) and Eligibility Evaluation (Stage 5) orchestration**, both owned by the Decision Engine (D2 Unit 04: Stage 5 "Orchestration authority: Decision Engine"; Stage 4 names no single owner but is upstream of, and distinct from, Stage 6). The Initiative Engine *consumes* their determinations; it does not perform them (Section 18).

## 9.3 Deferred (Out of Scope for TASK-005)

Everything listed in Section 8. Enabling the `INITIATIVE_ENGINE` consumer/`INITIATIVE_SUPPORT_V1` policy in B5's `derivedIntelligenceConsumer.js` production-enabled mapping is no longer deferred: Canonical Decision CD-T005-01 authorizes it, solely as part of the focused Memory Layer Pipeline Context extension described in Section 25 and Section 32 (Section 36, item A-1, resolved).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 9.1 Required Now | D1, D2, Coach Bible |
| 9.2 Explicitly Not Owned by the Initiative Engine at Stage 3 (Deferred / Owned Elsewhere) | D1, D2, TASK-004 |
| 9.3 Deferred (Out of Scope for TASK-005) | B5 |

---

# 10. Repository Baseline and Evidence

## 10.1 Branch and Commit Baseline (Verified Repository Evidence)

- Current branch: `main`.
- HEAD commit: `f2c734d40e0adbb700f863694f47e7d075f5c5cf`, dated 2026-07-29, message `feat(task-004): implement and close Recommendation Engine (Composite Engine)` — verified via `git log -1`. This is simultaneously the repository's current HEAD and TASK-004's own closure commit; no commits exist on `main` after TASK-004's closure.
- `APP_VERSION = '2.41.0'` — verified at `js/app.js:2`.
- No root `package.json` exists (verified; only `functions/package.json`, a Firebase Functions manifest with no `version`/`test` field). Tests run via `node --test tests/<file>.test.js`, no npm script.

## 10.2 Existing Composite Engine and Orchestrator (Verified Repository Evidence)

Directory `js/coachDecisionSystem/` contains exactly five files (verified via directory listing):
- `recommendationCategories.js` — pure module, no `configure()`/state; exports `CATEGORIES` (frozen 4-value array: `IMMEDIATE_ACTION`/`PREPARATION`/`RECOVERY`/`SYSTEM_BUILDING`), `OPPORTUNITY_SOURCES` (frozen: `DECISION_WINDOW`, `CONFIRMED_PATTERN_ANTICIPATION`, `DISRUPTION_DETECTION`, `MILESTONE_RECOVERY`, `SAFETY_HIGH_RISK`), and `SOURCE_CATEGORY_MAP`/`SOURCE_HIERARCHY_TIER_MAP` (in-code comment flags these as "engineering-authored... provisional... Repository-Gap status," not Product-approved).
- `recommendationEngine.js` — single export `generate(request)`, pure/deterministic, never throws; validates CC-02 request shape; calls `FeedbackDomain.evaluateSuppression(...)` before returning a candidate.
- `memoryLayer.js` — single export `assembleContext(identity)` (async); reads via `StateAccess.createEngineAccess({engineId:'coachDecisionSystem', action:'DECISION_PASS', ...}).read.recommendationFeedbackHistory()` and `DerivedIntelligenceConsumer.build({consumer:'RECOMMENDATION_ENGINE', policyId:'RECOMMENDATION_SUPPORT_V1', ...})`, both wrapped in try/catch for graceful degradation; returns a frozen `pipelineContext` with `schemaVersion: 'coach-decision-system-pipeline-context/1.0'`. Header comment: "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context" (D3 §8.1/§11.1).
- `internalPipelineOrchestrator.js` — header comment (Hebrew) explicitly names all six D3 §17 collaborators and states the orchestrator "is not itself a seventh Engine, does not register independently, and is not a second orchestration authority." Exports `run(ctx)` (registered as the engine's B2 `run`) and `runForOpportunity(pipelineContext, eligibleOpportunity)` (direct Stage-6 invocation, currently wired only to `RecommendationEngine.generate`, "exposed for future Decision Engine or tests"). `run()` always returns `{ status: 'SUCCESS', output: { pipelineContext, candidates: [] } }` — comment: "no genuine EligibleOpportunity exists yet, so Stage 6 yields no candidates this cycle."
- `registerCoachDecisionSystem.js` — registers `{ id: 'coachDecisionSystem', version: '1.0.0', triggers: ['APP_READY'], dependsOn: [], run: Orchestrator.run }` via the B2 Engine Registry.

## 10.3 Existing Recommendation Engine and Candidate Contracts (Verified Repository Evidence)

TASK-004's CC-02/CC-03 contracts (`TASK_004_SPEC_v1.0.md` lines 992–1013):
```
RecommendationRequest { opportunity: EligibleOpportunity, pipelineContext: ImmutablePipelineContext }
RecommendationResult { candidates: RecommendationCandidate[] }
RecommendationCandidate { kind, category, action, rationale: { rationale, evidenceBasis, expectedValue, uncertainty }, confidence, hierarchyTier, opportunityProvenance }
```
This shape is the direct structural precedent for the Initiative-kind Candidate contract (Section 19) — TASK-005 reuses this shape rather than inventing a divergent one, substituting Initiative-specific `kind`/category vocabulary where D1/D3 require it.

## 10.4 Existing Shared Types, Validators, Registries, State Access, Persistence, Test Structure (Verified Repository Evidence)

- **Engine Registry:** `js/engineRegistry.js`, `REGISTRY_VERSION = '2.0.0'`; `register(def)`, `getAll()`, `buildPlan(trigger)`, `run(request)`.
- **StateAccess:** `js/stateAccess.js`; the sole permission-map entry for the Composite Engine, verified at lines 403–408:
  ```js
  coachDecisionSystem: {
    DECISION_PASS: {
      reads: ['recommendationFeedbackHistory'],
      writes: []
    }
  }
  ```
  No entry exists yet for any Initiative-specific read or write.
- **Derived Intelligence Consumer:** `js/derivedIntelligenceConsumer.js`; verified at line 32: `var CONSUMERS = ['AI_COACH_PROMPT', 'RECOMMENDATION_ENGINE', 'INITIATIVE_ENGINE', 'DECISION_ENGINE', 'TEST_HARNESS'];` and line 36 (Hebrew comment): "INITIATIVE_ENGINE/DECISION_ENGINE remain fully disabled." `INITIATIVE_ENGINE` has **no entry** in the `CONSUMER_POLICY` map — a request naming it fails as `UNKNOWN_CONSUMER` before reaching policy resolution (per code structure, consistent with B5 §12.3/§51.1's statement that only `AI_COACH_PROMPT` and `TEST_HARNESS` are enabled, with `RECOMMENDATION_ENGINE` authorized only as a contract/test target).
- **Persistence Gateway:** `js/persistenceGateway.js`; closed operation catalog (B4 Appendix F.1) contains no Initiative-related operation.
- **Test directory:** flat `tests/` folder (no subdirectories), verified via glob to contain the five TASK-004 test files (`recommendationCategories.test.js`, `recommendationEngine.test.js`, `memoryLayer.test.js`, `internalPipelineOrchestrator.test.js`, `coachDecisionSystemWiring.test.js`) alongside `derivedIntelligenceConsumer.test.js`, `feedbackDomain.test.js`, `stateAccess.test.js`, `persistenceGateway.test.js`, `engineRegistry.test.js`, and the full pre-existing suite (~72 additional files spanning B1–C4 wiring tests, adapters, presenters, controllers, domain modules).

## 10.5 Initiative-Related Stubs, Hooks, or Placeholders (Verified Repository Evidence)

A case-insensitive search for "initiative" across `js/` found **exactly one** file with a match: `js/derivedIntelligenceConsumer.js` (the `CONSUMERS` array entry and the disabled-consumers comment, both quoted above at 10.4). No file, class, module, or function named for an "Initiative Engine" exists anywhere in `js/`. This is a genuine, pre-existing, disabled extension point — not a functioning hook.

**Repository Evidence Note bearing on a recorded TASK-004 Canonical Conflict:** TASK-004's own spec (line 134–142) records an open Canonical Conflict between D1_SPEC's claim that "Engineering hooks for the Recommendation, Initiative, and Decision Engines already exist in the codebase but remain disabled" (D1 CDR-5) and a repository-inventory finding of no such hooks "beyond the B5 `RECOMMENDATION_SUPPORT_V1` consumer policy." The `INITIATIVE_ENGINE` consumer-id constant verified above is itself a second, named, disabled hook, present in the same file, not called out by name in TASK-004's conflict text. This does not resolve TASK-004's recorded conflict (which concerns whether "hooks" collectively already exist as CDR-5 claims); it is additional evidence bearing on it, recorded here and carried into Section 36 rather than adjudicated.

## 10.6 Current Test-Suite Baseline (Verified Repository Evidence, TASK-004 Closure Record)

TASK-004's Closure Record states **1144/1144 tests passing** at closure (1082 pre-existing + 62 new across the 5 TASK-004 test files), at `APP_VERSION '2.41.0'`, matching the current HEAD commit. This baseline is inherited unchanged by TASK-005's authoring (no code has been touched by this specification-authoring activity, per Section 46).

## 10.7 Application/Version Metadata

`APP_VERSION = '2.41.0'` (`js/app.js:2`), unchanged since TASK-004's closure. No service-worker (`sw.js`) or `index.html` script-list change has occurred since TASK-004's closure that this specification is aware of; both currently list the five `js/coachDecisionSystem/` files in the load order documented in TASK-004's Closure Record.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 10.1 Branch and Commit Baseline (Verified Repository Evidence) | TASK-004, Repository |
| 10.2 Existing Composite Engine and Orchestrator (Verified Repository Evidence) | D3, B2, Repository |
| 10.3 Existing Recommendation Engine and Candidate Contracts (Verified Repository Evidence) | D1, D3, TASK-004, Repository |
| 10.4 Existing Shared Types, Validators, Registries, State Access, Persistence, Test Structure (Verified Repository Evidence) | TASK-004, B1, B4, B5, C4, Repository |
| 10.5 Initiative-Related Stubs, Hooks, or Placeholders (Verified Repository Evidence) | D1, TASK-004, B5, Repository |
| 10.6 Current Test-Suite Baseline (Verified Repository Evidence, TASK-004 Closure Record) | TASK-004, Repository |
| 10.7 Application/Version Metadata | TASK-004, Repository |

---

# 11. Canonical Vocabulary and Domain Definitions

Terms already fixed by D1 or D2 are referenced, not redefined. Where a term's source document is ambiguous or the term lacks a single formal glossary entry, this is stated explicitly rather than resolved by invention.

- **Initiative** — "coach-originated contact not directly requested by the user in the current moment" (D1 Shared Vocabulary, line 98; fully governed by D1 Unit 09).
- **Initiative-kind Candidate** — a Candidate (D2 Shared Vocabulary) whose `kind` is Initiative, produced only by the Initiative Engine at Stage 6, applying D1 Unit 09 in full (D2 Unit 07; D3 §8.5, §6.4, §11.2).
- **Opportunity** — "a candidate situation that may warrant a Recommendation, an Initiative, or a deliberate Silence decision" (D1 Shared Vocabulary, line 108–110; detected at Stage 3 per D2 Unit 04).
- **Decision Window** — "the bounded period before a decision becomes irreversible" (D1 Unit 05, citing Constitution Ch.8 §8.3; Coach Bible Ch.1 §7). Detected at Stage 3 as a **Recommendation Engine** contribution (D2 Unit 04, Stage 3 Dependencies), not an Initiative Engine one — see Section 9.2.
- **Confirmed pattern** — not given a standalone glossary definition in D1; assembled from D1 Unit 05's exclusion rule ("Anticipating based on a single prior instance is not planning ahead; it is guessing," Coach Bible Ch.5 §3) plus D1 Unit 11's Evidence Hierarchy Tier 3, "Repeated Behaviour — a pattern meeting a defined threshold within a defined window" (the numeric threshold itself is an engineering parameter per CDR-4, not fixed by D1 — Section 16).
- **Disruption** — not formally defined as a single term in D1; D1 Unit 05 names two subtypes without elaboration ("calendar disruptions (known in advance)" and "structural disruptions (visible only once they occur)"). Coach Bible Ch.5 §4 ("Preparing for Predictable Disruption") supplies the substantive texture: calendar disruptions are fixed-date (holidays, travel); structural disruptions are "less predictable in timing but no less important to prepare for" (new job, injury, new relationship).
- **Milestone** — not formally defined in D1 beyond "genuine" (D1-IP-06, citing Constitution §12.12, §13.14). Coach Bible Ch.5 §8 supplies substantive content: a milestone is "a genuine achievement and also... a moment of real risk" (arrival fallacy), requiring deliberate "renewal" rather than manufactured celebration.
- **Recovery-support moment** — not formally defined in D1 beyond "post-setback recovery-support moments" (D1 Unit 05, citing Coach Bible Ch.2, Ch.10). Coach Bible Ch.1 §21 ("Recovery Is More Important Than Perfection") supplies the surrounding doctrine.
- **Relationship Maturity** — "the stage of the coaching relationship (Observer → Assistant → Trusted Coach → Personal Coach) that gates how much initiative and directiveness the coach may exercise... Advances only through accumulated evidence, never through elapsed time alone" (D1 Shared Vocabulary, line 126–130; D1-USM-04). The four stages and their per-stage initiative scope are fixed verbatim by Constitution §12.2 and restated at D1-IP-02 (Section 17).
- **Eligibility** — no standalone glossary definition in D1; operationalized entirely by D1 Unit 06's Eligibility Test prose (Section 18) and the Stage 5 contract (D2 Unit 04).
- **Evidence** — governed by D1 Unit 11's five-tier Evidence Hierarchy (Explicit User Statement → Explicit User Action → Repeated Behaviour → Single Behaviour → Inference).
- **Confidence** — "an estimate of how well-supported a belief is. Confidence is not authority" (D1 Shared Vocabulary, line 113–114; D1-ER-07).
- **Silence** — "a deliberate decision to produce no Recommendation or Initiative," distinguished as priority-based or evidence-based (D1 Shared Vocabulary, line 100–104; fully governed by D1 Unit 10).
- **Pipeline Context** — "the assembled working set of Decision Inputs (D1 Unit 03) and User State (D1 Unit 04)... produced once by Context Assembly and immutable for the remainder of that Decision Pass" (D2 Shared Vocabulary; this term does not appear in D1 itself — it is a D2/D3 architectural term, verified absent from D1's full text by the D1 extraction pass).
- **Terminal Decision** — "the fully-formed Canonical Decision (D1 Unit 15) that Decision Formation produces: a Recommendation, an Initiative, a Silence, or a refusal/escalation... always exactly one Terminal Decision (Canonical Decision 1)" (D2 Shared Vocabulary). D1 itself uses "Canonical Decision"/"Canonical Decision Output" (Unit 15); "Terminal Decision" is D2's name for the same output-formation concept (Stage 9, owned by the Decision Engine — not produced by the Initiative Engine, per Section 8/13).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Canonical Vocabulary and Domain Definitions | D1, D2, D3, Constitution, Coach Bible |

---

# 12. Initiative Engine Mission and Responsibilities

D2 Unit 07's Initiative Engine subsection, quoted in full (the single authoritative statement of this engine's positive responsibilities):

> **Responsibilities.** Participates in Opportunity Detection (Stage 3), specifically confirmed-pattern anticipation and disruption/milestone detection (D1 Unit 05); holds orchestration authority for Candidate Generation (Stage 6) for Initiative-kind Candidates, applying D1 Unit 09 in full, including Relationship-Maturity gating (D1-IP-02).
> **Inputs.** Pipeline Context; eligible Opportunities.
> **Outputs.** Initiative-kind Candidates.
> **Forbidden Responsibilities.** SHALL NOT perform Prioritization, Winner Selection, or Decision Formation. SHALL NOT initiate contact for engagement or retention purposes (D1-IP-04). SHALL NOT respond to an ignored Initiative with more Initiative (D1-IP-08).
> **Dependencies.** Decision Engine; Safety Layer; Memory Layer.

**What the engine owns:** Stage 6 orchestration authority for Initiative-kind Candidates only (full D1 Unit 09 application); a Stage 3 detection contribution limited to confirmed-pattern anticipation and disruption/milestone detection.

**What it contributes to Stage 3:** detection signal for two of D1 Unit 05's five Opportunity source categories (confirmed-pattern anticipation; disruption/milestone/recovery-support), tagged with source category per the D2 Unit 04 Stage 3 output contract ("each tagged with its D1 Unit 05 source category"). It does not contribute Decision-Window detection (Section 9.2) or Safety/high-risk detection (owned by the Safety Layer, Section 24).

**What it owns in Stage 6:** sole orchestration authority for Initiative-kind Candidate Generation — given an eligible Opportunity (however sourced, including a Decision-Window-sourced one that the Recommendation Engine detected at Stage 3 but which is being evaluated here for an Initiative-kind rather than Recommendation-kind Candidate), the Initiative Engine decides whether and how to construct zero or more Initiative-kind Candidates.

**What inputs it may consume:** Pipeline Context (from the Memory Layer only, D3 §11.2) and eligible Opportunities (the output of Stage 5, Eligibility Evaluation, owned by the Decision Engine — Section 18). It may not originate its own Decision Input reads (D3 §8.1, §11.1: "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context").

**What output it must produce:** zero or more Initiative-kind Candidates per the contract in Section 19, or a Silence-compatible empty result (Section 21) — never a fabricated Candidate, never a Terminal Decision.

**How it applies D1 Unit 09 in full:** every one of D1-IP-01 through D1-IP-10 (reproduced in full at Section 15/17/20) is a binding constraint on this engine's Stage-6 logic — the shared Unit 06 Eligibility gate (D1-IP-01), Relationship-Maturity gating (D1-IP-02), the value requirement (D1-IP-03), the no-engagement rule (D1-IP-04), predictive-over-reactive timing (D1-IP-05), celebration restraint (D1-IP-06), empathy-before-frequency (D1-IP-07), no-punishing-silence (D1-IP-08), verify-don't-assume phrasing discipline (D1-IP-09, an Expression-layer concern the Candidate's rationale/explanation fields must support — Section 19), and personalized cadence (D1-IP-10, with no invented numeric cadence — Section 16).

**How it preserves the distinction between initiative policy and recommendation policy:** by remaining a structurally separate component from the Recommendation Engine (D3 §8.5), consuming the same Pipeline Context shape but applying an entirely different D1 Unit (09, not 08), and never sharing internal candidate-construction logic that would let D1-IP-04/D1-IP-08 leak into Recommendation-kind generation or D1's Recommendation-specific rules (Unit 08) leak into Initiative-kind generation.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Initiative Engine Mission and Responsibilities | D1, D2, D3 |

---

# 13. Explicit Forbidden Responsibilities

Consolidated, testable list — every item below is inherited from D1, D2, or D3, not invented here:

1. **No Prioritization.** (D2 Unit 07; D3 §6.4 "Does Not Own"; §11.1: "Only the Decision Engine may produce a Terminal Decision"; §11.2 "Forbidden To Touch: Prioritization, Winner Selection, durable state.")
2. **No Winner Selection.** (Same sources.)
3. **No Terminal Decision Formation.** (Same sources; D1-CDO-03: a downstream layer "SHALL NOT originate the underlying decision, its priority, or its rationale.")
4. **No engagement- or retention-driven initiative.** (D1-IP-04, D2 Unit 07 Forbidden Responsibilities.)
5. **No repeated initiative merely because an earlier initiative was ignored.** (D1-IP-08: "SHALL instead self-diagnose timing, content, context, or necessity before trying again.")
6. **No bypass of Safety authority.** (D1-AB-05: "No part of the system, including any future AI agent, may bypass this evaluation"; D3 §11.3: "no component may bypass the Safety Layer at any of its three checkpoints (AI-06 does not permit an exception)".)
7. **No durable state ownership.** (D3 §11.1: "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf"; §11.2 "Forbidden To Touch: ...durable state.")
8. **No authoritative promotion of AI-inferred memory.** (D1-MU-01: any inference-authored memory "SHALL remain a non-authoritative candidate... until the user explicitly confirms it"; D1-ER-07: "A high confidence score SHALL NOT substitute for the authority required to treat a belief as authoritative"; C4 §13.4: every C4-created record is forced to `status: 'candidate'` regardless of source, with no promotion mechanism in scope.)
9. **No platform or delivery-channel selection.** (D3 §11.3: "no component may select or reference a delivery platform except the existing Coach Runtime"; §10.4 Decision 5/6.)
10. **No independent Engine Registry registration outside the Composite Engine.** (D3 §17 Decision 1; §11.1: "no internal collaborator... is independently registered"; AI-01.)
11. **No mutation of unrelated pipeline responsibilities.** (D2-INV-03, Stage isolation, cited by D3 §5.1: "a Recommendation Engine component that also performed Prioritization, or a Memory Layer component that also decided which Candidate wins, would violate both" — applied symmetrically to the Initiative Engine.)

Each prohibition above is independently testable per Section 33 (e.g., a unit test asserting the Initiative Engine's public interface exposes no ranking/selection/persistence/registration function, and a wiring test asserting no second Engine Registry entry is created).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Explicit Forbidden Responsibilities | D1, D2, D3, C4 |

---

# 14. Inputs and Pipeline Context

## 14.1 Required Inputs

- **Pipeline Context** — produced exclusively by the Memory Layer's Context Assembly (Stage 2), immutable for the remainder of the Decision Pass (D2-PP-02; D3 §8.1 Decision 3). The Initiative Engine reads it as-delivered; it does not reassemble or supplement it.
- **An eligible Opportunity** — the output of Stage 5 (Eligibility Evaluation, owned by the Decision Engine) for an Opportunity that passed Evidence Evaluation (Stage 4) and Eligibility Evaluation (Stage 5), *or* an Opportunity admitted via the Safety Layer's unconditional bypass (D1-OD-04, D2-EF-01(a)) — though per Section 9.2/24, Safety-triggered Opportunities are not the Initiative Engine's to detect, and whether they are ever routed to Initiative-kind (as opposed to Recommendation-kind or a direct refusal/escalation) Candidate Generation is not fixed by any canonical source inspected; recorded as **Repository Gap** (Section 36, item G-3).

## 14.2 Optional Inputs

None beyond the above are identified by D1, D2, or D3 as available to Stage 6. The Initiative Engine's Stage-3 detection contribution (confirmed-pattern anticipation, disruption/milestone detection) reads only from Pipeline Context — it has no separate input channel from Stage 6.

## 14.3 Source of Every Input

| Input | Source | Read Authority |
|---|---|---|
| Pipeline Context | Memory Layer, Stage 2 | Read-only; Initiative Engine may not originate a Decision Input read (D3 §8.1, §11.1) |
| Eligible Opportunity | Decision Engine, Stage 5 (or Safety Layer bypass) | Read-only; Initiative Engine does not perform Eligibility Evaluation itself (Section 18) |

## 14.4 Validation Rules

The Initiative Engine must validate the shape of its Stage-6 request (eligible Opportunity + Pipeline Context) before acting on it (**Engineering Interpretation**, based on Repository Evidence: this specific validation discipline is not itself canonically mandated; it is drawn from the existing pattern TASK-004's `recommendationEngine.js` already applies to its own CC-02 request via `validateRequest()`), but must not fabricate a value for a missing or malformed field (D1-DI-02, applied by analogy). An invalid request shape is a failure condition (Section 29), not a Candidate-generation input.

## 14.5 Handling of Missing or Stale Inputs

- Missing Decision Input categories at Context Assembly are not the Initiative Engine's concern to remediate — D2-EF-08 already requires the Memory Layer to proceed with available categories and treat absence itself as evidence (D1-DI-04, D1-ER-04). The Initiative Engine receives whatever Pipeline Context the Memory Layer assembled, including its `availability` map (as implemented in `memoryLayer.js`), and must reason correctly about partial availability rather than treating it as an error.
- A stale Pipeline Context (from a superseded Decision Pass) must not be acted on — per D2-EF-07 (User Correction), a superseded Pipeline Context's Terminal Decision "is not expressed," and by extension no component, including the Initiative Engine, should treat a superseded cycle's Context as current. This is an Orchestrator-level sequencing guarantee (D2-PP-02 immutability, one Context per Decision Pass) the Initiative Engine relies on rather than re-validates.

## 14.6 Handling of Conflicting Signals

D1-ER-01 requires Fact/Observation/Inference/Hypothesis claim types to remain distinct and not be conflated; where Pipeline Context carries competing signals of different evidentiary tiers (Section 16), the higher tier governs, and a genuine unresolved contradiction is evidence-insufficiency (Silence-compatible, Section 21), not a fabricated resolution.

## 14.7 Whether Absence Itself Is Evidence

Yes — D1-ER-04 and D1-DI-04 both establish that "the absence of expected data SHALL itself be treated as evidence, not ignored." The Initiative Engine must apply this when reasoning about, for example, an expected but absent confirming data point for a candidate pattern.

## 14.8 Native/Platform-Neutral Representation Requirements

Per D3 §5.5 and §14, the Initiative Engine is named explicitly, alongside the Recommendation Engine, Decision Engine, and Safety Layer, as naturally Pure-Domain-shaped: "none of D1's or D2's rules require a DOM, browser, or Firebase reference to evaluate." All inputs it consumes (Pipeline Context, eligible Opportunity) must therefore be plain, serializable data structures with no platform-specific references, consistent with `memoryLayer.js`'s existing frozen, schema-versioned `pipelineContext` object shape.

Inputs are not sourced from anywhere not traceable to D1 Unit 03's eight Decision Input categories or an approved repository contract (B3 StateAccess, B5 DerivedIntelligenceConsumer) — no new input source is introduced by this document.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 14.1 Required Inputs | D1, D2, D3 |
| 14.2 Optional Inputs | D1, D2, D3 |
| 14.3 Source of Every Input | D3 |
| 14.4 Validation Rules | D1, TASK-004 |
| 14.5 Handling of Missing or Stale Inputs | D1, D2 |
| 14.6 Handling of Conflicting Signals | D1 |
| 14.7 Whether Absence Itself Is Evidence | D1 |
| 14.8 Native/Platform-Neutral Representation Requirements | D1, D2, D3, B3, B5 |

---

# 15. Opportunity Sources and Detection Rules

D1 Unit 05 fixes five canonical Opportunity source categories. The subsections below document each per the skeleton's required fields, using only D1/D2/Coach-Bible content — no numeric threshold is invented (D1 Unit 11 Acceptance Criteria; CDR-4).

## 15.1 Decision Windows

- **Required evidence:** a foreseeable, bounded period "before a decision becomes irreversible" (D1 Unit 05, citing Constitution §8.3, Coach Bible Ch.1 §7).
- **Confidence requirement:** not separately fixed for this source beyond the general D1 Unit 11 hierarchy.
- **Timing relevance:** central to the source — the entire point is acting "before the window closes over reacting after" (D1 Unit 05).
- **Exclusions:** none specific to this source beyond the general D1-OD-01/02 pattern requirements.
- **Ownership:** **Stage-3 detection is a Recommendation Engine contribution, not an Initiative Engine one** (D2 Unit 04, Stage 3 Dependencies, verified verbatim in Section 9.2/11). This is the single most important ownership fact in this section and is restated here to prevent the Initiative Engine's implementation from silently absorbing Decision-Window detection logic.
- **Initiative Engine's actual relationship to this source:** none at Stage 3. At Stage 6, if a Decision-Window-sourced Opportunity is presented to the Initiative Engine as eligible for evaluation toward an *Initiative*-kind Candidate (as distinct from a Recommendation-kind one — the canonical sources do not state which, if either, kind a Decision-Window Opportunity is more naturally suited to; see **Repository Gap** G-4, Section 36), the Initiative Engine applies D1-IP-05's predictive-timing requirement to how and when it constructs (or declines to construct) its Candidate (**Engineering Interpretation** — see Section 9.2 for the same reading applied to the ownership boundary).
- **Output/pass condition:** N/A for Stage 3 (not detected here); Stage 6 output per Section 20.

## 15.2 Confirmed-Pattern Anticipation

- **Required evidence:** "a standing, well-confirmed pattern only... A single prior instance is not a basis for anticipation; it is guessing" (D1 Unit 05, Coach Bible Ch.5 §3, quoted verbatim). Evidence Hierarchy Tier 3 (Repeated Behaviour) or above (D1 Unit 11).
- **Confidence requirement:** must clear the "confirmed" bar — D1-OD-02: "A single prior instance SHALL NOT be treated as sufficient basis for anticipatory action."
- **Timing relevance:** anticipatory by definition — D1-IP-05 requires preparing/intervening before the anticipated moment, not after.
- **Exclusions:** D1-OD-01: absent safety/high-risk or explicit-statement/action exemptions, a single event alone does not by itself constitute evidence sufficient to detect a standing opportunity (wording per D1-OD-01 as corrected by CD-G2-02; originally quoted here as "a single event SHALL be treated as data, not evidence").
- **Ownership:** Initiative Engine, Stage 3 contribution (D2 Unit 07: "specifically confirmed-pattern anticipation and disruption/milestone detection").
- **Output/pass condition:** a detected Opportunity tagged `CONFIRMED_PATTERN_ANTICIPATION` (matching the existing `OPPORTUNITY_SOURCES` vocabulary already defined in `js/coachDecisionSystem/recommendationCategories.js`), proceeding to Evidence Evaluation (Stage 4).

## 15.3 Known Calendar Disruptions

- **Required evidence:** a calendar-visible, fixed-date disruption "known in advance" (D1 Unit 05); Coach Bible Ch.5 §4 examples: holidays, travel, scheduled events.
- **Confidence requirement:** governed by D1-OD-01/03 generally; a known calendar entry is itself the evidentiary basis (comparable to an Explicit User Action tier, where the calendar data derives from user-provided scheduling — this mapping is **Engineering Interpretation**, not a canonical statement, and is flagged as such).
- **Timing relevance:** "warrant advance preparation once detected" (D1 Unit 05).
- **Exclusions:** none specific.
- **Ownership:** Initiative Engine, Stage 3 contribution ("disruption... detection").
- **Output/pass condition:** a detected Opportunity tagged `DISRUPTION_DETECTION`, proceeding to Evidence Evaluation.

## 15.4 Structural Disruptions

- **Required evidence:** "visible only once they occur" (D1 Unit 05); Coach Bible Ch.5 §4: "less predictable in timing but no less important to prepare for" (new job, injury, new relationship).
- **Confidence requirement:** by nature detected after onset, not anticipated in advance — the confidence question is about the disruption's *significance* and *duration*, not its occurrence, once observed.
- **Timing relevance:** "warrant advance preparation once detected" — here, "advance" means ahead of the disruption's downstream effects, not ahead of the disruption itself.
- **Exclusions:** D1-OD-01's single-event rule applies unless the disruption itself is confirmed via an Explicit User Statement/Action (Tier 1/2).
- **Ownership:** Initiative Engine, Stage 3 contribution.
- **Output/pass condition:** same as 15.3.

## 15.5 Genuine Milestones

- **Required evidence:** the milestone must be "genuine," not routine or small (D1-IP-06, citing Constitution §12.12, §13.14).
- **Confidence requirement:** not separately numeric; governed by the general Evidence Hierarchy for whatever underlying accomplishment is being recognized.
- **Timing relevance:** tied to the moment of accomplishment; Coach Bible Ch.5 §8 additionally requires attention to the "arrival fallacy" risk immediately following.
- **Exclusions:** D1-IP-06 explicitly excludes "routine or small actions" from celebratory Initiative.
- **Ownership:** Initiative Engine, Stage 3 contribution ("milestone... detection").
- **Output/pass condition:** a detected Opportunity tagged `MILESTONE_RECOVERY`, proceeding to Evidence Evaluation.

## 15.6 Recovery-Support Moments

- **Required evidence:** a post-setback situation (D1 Unit 05, citing Coach Bible Ch.2, Ch.10).
- **Confidence requirement:** general Evidence Hierarchy rules apply; no source-specific numeric bar is fixed.
- **Timing relevance:** support is most valuable close to the setback, consistent with D1-IP-07's empathy-before-frequency rule during difficult periods.
- **Exclusions:** none specific beyond D1-OD-01.
- **Ownership:** Initiative Engine, Stage 3 contribution (grouped with milestone detection under `MILESTONE_RECOVERY` per the existing `OPPORTUNITY_SOURCES` vocabulary).
- **Output/pass condition:** same as 15.5.

## 15.7 Explicit User Statements or Actions

- **Required evidence:** the statement or action itself — this is the top of the Evidence Hierarchy (Tier 1/2, D1 Unit 11) and is exempted from D1-OD-01's single-event exclusion.
- **Confidence requirement:** highest tier; no pattern requirement.
- **Timing relevance:** immediate — no anticipation delay is implied.
- **Exclusions:** none.
- **Ownership:** Per CD-G2-01 (`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`), Explicit User Statements/Actions are Decision Inputs and evidentiary signals (D1 Unit 11, Tiers 1-2), not an independent Canonical Opportunity Source — D1 Unit 05's five-item source list does not include them, correcting this section's original characterization ("D1 Unit 05 lists this as a canonical source category"). No Stage-3 detection ownership is required for this source, since none exists independently to own. Repository Gap G-2 (Section 36) is resolved accordingly; this document does not assign this source's detection to the Initiative Engine, consistent with CD-G2-01.
- **Output/pass condition:** N/A — no independent Stage-3 detection applies to this source; see Ownership above (CD-G2-01).

## 15.8 Safety / High-Risk Signals and the Boundary with the Safety Layer

- **Required evidence:** the enumerated symptom list at Constitution Ch.23 §23.7 (persistent chest pain, sudden severe shortness of breath, fainting, severe allergic reaction, rapid unexplained physical change, significant injury, symptoms suggesting acute medical illness) and sustained body-image/disordered-eating distress patterns (D1 Unit 05).
- **Confidence requirement:** the sole category exempted from the pattern requirement — "SHALL bypass the pattern requirement in D1-OD-01 and SHALL be treated as opportunities on first occurrence" (D1-OD-04).
- **Timing relevance:** immediate, unconditional.
- **Exclusions:** none — D1-SP-06: "Silence SHALL NOT be selected when a Unit 02 absolute override or a Constitution Ch.23 §23.7 high-risk symptom is present."
- **Ownership:** the Safety Layer, not the Initiative Engine and not the Recommendation Engine — D2-EF-01(a) describes admission as a pipeline-level Safety override, and D1 Unit 05 lists this source without assigning it to either Candidate-producing engine's Unit 07 responsibilities. This document does **not** assign Safety-triggered Opportunity detection to the Initiative Engine, consistent with the skeleton's explicit caution (§9) against silently doing so.
- **Output/pass condition:** unconditional admission to Candidate Generation (Stage 6), bypassing Evidence Evaluation and Eligibility Evaluation (D2-EF-01(a)). Whether a Safety-triggered Opportunity that reaches Stage 6 is ever evaluated by the Initiative Engine specifically (as opposed to the Recommendation Engine, or directly reformed into a refusal/escalation without either) is not fixed by any canonical source inspected — recorded as **Repository Gap** G-3 (Section 36), same item as 14.1.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Section introduction | D1, D2 |
| 15.1 Decision Windows | D1, D2, Constitution, Coach Bible |
| 15.2 Confirmed-Pattern Anticipation | D1, D2, Coach Bible, Repository |
| 15.3 Known Calendar Disruptions | D1, Coach Bible, Engineering Interpretation |
| 15.4 Structural Disruptions | D1, Coach Bible |
| 15.5 Genuine Milestones | D1, Constitution, Coach Bible |
| 15.6 Recovery-Support Moments | D1, Coach Bible |
| 15.7 Explicit User Statements or Actions | D1, D2 |
| 15.8 Safety / High-Risk Signals and the Boundary with the Safety Layer | D1, D2, Constitution |

---

# 16. Evidence and Confidence Requirements

- **Event vs. evidence:** "The coach never reacts to one event. A single occurrence is data. Only a pattern is evidence" (Coach Bible Ch.3 §4, restated at D1-OD-01 and Manifesto Principle 7). Formalized: D1-ER-02, "A single feedback or behavioral event SHALL NEVER, by itself, independently change a confidence-driven decision."
- **Single-instance limitations:** D1-OD-02 (anticipation specifically); D1-SP-04, "A single event SHALL NOT be treated as a trend."
- **Explicit user statements and actions:** exempted from the single-event rule (D1-OD-01); Evidence Hierarchy Tiers 1–2, always overriding Tiers 3–5 (C2 §7, CD-03, "Explicit User Action... always overrides tiers 3–5" — established for the Trigger/Adaptive-TDEE surfaces by C2 and generalized here only as the same Evidence Hierarchy D1 Unit 11 already fixes system-wide).
- **Confirmed patterns:** Tier 3 (Repeated Behaviour) — "a pattern meeting a defined threshold within a defined window (the specific thresholds are engineering parameters; see CDR-4)" (D1 Unit 11).
- **Evidence hierarchy** (D1 Unit 11, full five tiers): 1. Explicit User Statement, 2. Explicit User Action, 3. Repeated Behaviour, 4. Single Behaviour (evidence only, never independently sufficient outside a safety-tier trigger), 5. Inference (never presented or treated as fact; user must always be able to reject/correct it).
- **Uncertainty representation:** D1-ER-05, confidence "SHALL be communicated honestly and SHALL calibrate delivery firmness"; D1-ER-01, claim types (Fact/Observation/Inference/Hypothesis) "SHALL NOT be conflated." Constitution §20.5: "High-confidence predictions may become proactive coaching. Low-confidence predictions should remain silent."
- **Insufficient-evidence behavior:** resolves to Silence internally at Stage 4 (Evidence Evaluation) — "an internal orchestration outcome, not an independent Terminal Decision" (D2-EF-03); the underlying belief "SHALL remain open rather than closed," reassessed in a future cycle.
- **Prohibition on manufactured confidence:** D1-ER-06, "The coach SHALL NOT manufacture false certainty or false reassurance; absence of evidence is not evidence of absence" (Constitution §23.15). D1-ER-07: "A high confidence score SHALL NOT substitute for the authority required to treat a belief as authoritative."
- **Traceability from evidence to Candidate:** required — every Initiative-kind Candidate's confidence and rationale must be attributable to the specific evidence that produced it (D2-TR-01; Section 19/28).

**Numeric thresholds:** No concrete pattern-window size, confidence cutoff, or suppression duration is fixed by D1 for confirmed-pattern anticipation, and none is invented here. Per D1 Unit 11's own Acceptance Criteria: "Any concrete threshold used by an engine built on D1 SHALL be traceable to an approved Task SPEC (per Unit 02's document hierarchy) or SHALL be raised as a new CDR at implementation time." No approved Task SPEC currently fixes an Initiative-specific pattern-window or confidence threshold (C2's `windowDays: 14` / `patternThreshold: 3` / `suppressionDurationDays: 7` are explicitly scoped to the Trigger/Adaptive-TDEE suppression policy only, marked "non-canonical" engineering defaults even there). This is recorded as **Engineering Decision Pending** (Section 36, item E-1) — the exact threshold(s) the Initiative Engine's confirmed-pattern-anticipation logic will use must be raised as a new CDR at implementation time, not invented in this specification.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Evidence and Confidence Requirements | D1, D2, Constitution, Coach Bible, C2 |

---

# 17. Relationship Maturity, Trust, and Personalization

## 17.1 Maturity-Stage Inputs

Relationship Maturity Stage is a Pipeline Context input (D1 Unit 04 User State Model dimension), assembled by the Memory Layer, consumed read-only by the Initiative Engine — it is not computed by the Initiative Engine itself.

## 17.2 Evidence Required to Rely on Maturity

D1-USM-04: "Relationship Maturity Stage SHALL advance only on accumulated evidence, never on elapsed time alone" (Coach Bible Ch.5, Canonical Principles). The Initiative Engine must treat the Stage value delivered in Pipeline Context as itself evidence-backed by construction (it is the Memory Layer's responsibility to have applied D1-USM-04 when assembling it), not re-derive or second-guess it.

## 17.3 How Initiative Frequency, Timing, Directness, Category, and Confidence Depend on Maturity

D1-IP-02 (verbatim): "The scope of permissible Initiative is gated by Relationship Maturity Stage (Unit 04): **Observer** (mostly responds), **Assistant** (initiates only on obvious, clear opportunities), **Trusted Coach** (may anticipate needs from confirmed patterns), **Personal Coach** (initiative is expected) (Constitution Ch.12 §12.2)."

Constitution §12.2 gives the fuller per-stage description each maturity value governs:
- **Stage 1 — Observer:** "The coach primarily responds. It learns. It listens. It asks questions."
- **Stage 2 — Assistant:** "The coach occasionally initiates useful conversations. Mostly around obvious coaching opportunities."
- **Stage 3 — Trusted Coach:** "The coach begins anticipating needs. It offers help before the user asks."
- **Stage 4 — Personal Coach:** "The coach understands routines well enough to initiate conversations naturally. At this stage, initiative feels expected rather than intrusive."

This directly gates **category**: confirmed-pattern anticipation (Section 15.2) is explicitly available only from Trusted Coach upward ("may anticipate needs from confirmed patterns"); at Observer/Assistant stages, only "obvious, clear opportunities" may produce Initiative at all.

**Directness** scales per D1-PER-03: "more explanation and verification early, more anticipation and reduced friction later." **Frequency, timing, style, and category** adapt per-user per D1-IP-10: "Initiative frequency, timing, style, and category SHALL adapt per-user based on observed preference (Constitution Ch.12 §12.10, Ch.13 §13.17); D1 does not fix a global cadence" — no numeric cadence is invented here, consistent with that explicit non-fixing.

**Confidence** is not stated by D1 to be directly gated by maturity stage (no rule states "higher maturity permits lower confidence"); maturity gates *category and directness*, while confidence remains governed independently by D1 Unit 11's Evidence Hierarchy regardless of stage. This is stated explicitly to avoid an unwarranted inference the research did not find support for.

## 17.4 Protections Against Premature Familiarity

Coach Bible Ch.2 §8: "a coach that behaves as though it already knows someone it just met will feel presumptuous rather than perceptive." D1-PER-01: "Personalization SHALL be earned through evidence about this specific person and SHALL NOT be assumed from a category." Confirmed-pattern anticipation (the maturity-gated Initiative category most exposed to this risk) is unavailable below Trusted Coach specifically to guard against this.

## 17.5 Protection of User Autonomy

D1-IP-09: "Where the coach is uncertain about what happened..., it SHALL phrase Initiative as a verifying question rather than an assumption" (Constitution §12.17: "Questions preserve dignity. Assumptions damage trust."). This is an Expression-layer phrasing concern, but the Initiative Candidate's rationale/explanation fields must carry enough structure (e.g., a flag or evidence-tier indicator) for Expression to honor it later (Section 19) — the Initiative Engine does not itself generate user-facing language (D1-CDO-03).

## 17.6 Personalization Boundaries

D1-PER-02 (never above safety): "Personalization SHALL NOT override or weaken a Unit 02 absolute override." D1-PER-05 (never exploitative): "Personalization SHALL NOT be used to increase temptation toward, or otherwise work against, the user's own stated goal." D1-PER-06 (no cross-user overlearning): "A lesson learned from one user SHALL NOT be applied to a different user without independent evidence for that user." Coach Knowledge Base Topic 35 (corroborating, non-governing): ethical/safety boundaries "should never be treated as negotiable based on... relationship maturity" — maturity gates *initiative scope*, never safety or ethical constraints (Section 24, Section 31).

## 17.7 Handling When Relationship State Is Unknown or Unreliable

Not separately fixed by D1 for this specific case. By general application of D2-EF-08 (missing context is itself evidence, not an abort trigger) and the conservative default implied by D1-IP-02's ordering (Observer being the most restrictive, listed first), an unknown or unreliable maturity signal should be treated at least as conservatively as Observer-stage scope — this is **Engineering Interpretation**, not a canonical statement, and is flagged as such (Section 36, item E-2, since no canonical source explicitly states a default-stage fallback rule).

Presentation copy and emotional tone templates are explicitly excluded from this section — those belong to Expression/UX work, except where an existing canonical contract requires supporting metadata (Section 19's explanation object, reused from TASK-004's CC-03 pattern).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 17.1 Maturity-Stage Inputs | D1 |
| 17.2 Evidence Required to Rely on Maturity | D1, Coach Bible |
| 17.3 How Initiative Frequency, Timing, Directness, Category, and Confidence Depend on Maturity | D1, Constitution |
| 17.4 Protections Against Premature Familiarity | D1, Coach Bible |
| 17.5 Protection of User Autonomy | D1, Constitution |
| 17.6 Personalization Boundaries | D1, Coach Knowledge Base |
| 17.7 Handling When Relationship State Is Unknown or Unreliable | D1, D2, TASK-004, Engineering Interpretation |

---

# 18. Intervention Eligibility Integration

## 18.1 Checks Performed Locally Before Emitting a Candidate

The Initiative Engine applies D1 Unit 09's own rules at Stage 6 — the value requirement (D1-IP-03: must increase at least one of Trust/Motivation/Consistency/Understanding/Relationship/Decision quality, or "it SHALL NOT be sent"), the no-engagement rule (D1-IP-04), celebration restraint (D1-IP-06), empathy-before-frequency (D1-IP-07), no-punishing-silence (D1-IP-08), and Relationship-Maturity gating (D1-IP-02, Section 17). These are local, Stage-6, Initiative-specific checks — distinct from the Stage-5 Eligibility gate.

## 18.2 Eligibility Data Attached to an Opportunity or Candidate

The eligible-Opportunity object the Initiative Engine receives as Stage-6 input already carries the Stage-5 eligible/ineligible determination (implicitly, by virtue of having reached Stage 6 at all — D2 Unit 04 Stage 5 Exit Criteria: "Ineligible → ...does not proceed to Candidate Generation. Eligible → proceeds to Candidate Generation"). The Initiative Engine does not need to, and must not, re-derive this determination.

## 18.3 Determinations Owned by the Decision Engine

Per D2 Unit 04, Stage 5 (Eligibility Evaluation) "Orchestration authority: Decision Engine," applying D1 Unit 06's Intervention Eligibility gate: a valid reason from the enumerated D1-IE-01 set (preventing a predictable mistake; helping before a difficult decision; celebrating meaningful progress; supporting recovery; preparing for a foreseeable challenge; requesting significantly-improving information; protecting stated long-term goals), the Trust Test (D1-IE-02: "if it is uncertain whether the user will be glad to have been interrupted, the coach SHALL NOT intervene"), and the reduced-frequency adjustment during low-coaching-value periods (D1-IE-04). Per D1-IP-01: "Every Initiative SHALL first pass the Unit 06 Intervention Eligibility gate; there is no separate, weaker bar for Initiative" — the Initiative Engine benefits from, but does not perform, this gate.

## 18.4 Unconditional or Exceptional Handling Owned by the Safety Layer

Safety/high-risk-triggered Opportunities bypass Stage 5 entirely and are "always eligible" (D1-IE-05). The Safety Layer's disqualification authority at Stage 8 (Winner Selection) and its final review at Stage 9 (Decision Formation) operate downstream of, and independently from, anything the Initiative Engine does at Stage 6 (Section 24).

## 18.5 Reasons for Rejection, Suppression, Deferment, or No-Candidate Output

- **Ineligible at Stage 5** — never reaches the Initiative Engine at all (Section 18.2).
- **Rejected locally at Stage 6** — the Initiative Engine's own D1-IP-03/04/06/07/08 checks fail; resolves to zero Candidates for this Opportunity (Section 21).
- **Suppressed** — via a feedback-history mechanism analogous to C2's `evaluateSuppression()`, if and when such a mechanism is extended to an Initiative surface (Section 21, Section 25, Section 36 item A-2 — C2 explicitly does not cover an Initiative surface today).
- **Deferred** — not a distinct D1/D2 outcome category found in canonical sources for Stage 6; "deferred" appears in D1-AB-05 only as a Safety Layer disposition of a Terminal Decision at Stage 9, not a Stage-6 Candidate-Generation outcome. No deferment mechanism is invented here.

This document does not move orchestration authority from the Decision Engine (Stage 5) into the Initiative Engine; the Initiative Engine's Stage-6 checks are additive to, never a substitute for, Stage 5.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 18.1 Checks Performed Locally Before Emitting a Candidate | D1 |
| 18.2 Eligibility Data Attached to an Opportunity or Candidate | D2 |
| 18.3 Determinations Owned by the Decision Engine | D1, D2 |
| 18.4 Unconditional or Exceptional Handling Owned by the Safety Layer | D1 |
| 18.5 Reasons for Rejection, Suppression, Deferment, or No-Candidate Output | D1, D2, C2 |

---

# 19. Initiative Candidate Contract

Reusing TASK-004's CC-02/CC-03 shape (Section 10.3) as the structural precedent, substituting Initiative-specific vocabulary where D1/D2/D3 require it:

```
InitiativeRequest {
  opportunity: EligibleOpportunity,       // Stage 5 output, or Safety Layer bypass (Section 14/18)
  pipelineContext: ImmutablePipelineContext  // Memory Layer, Stage 2 output
}

InitiativeResult {
  candidates: InitiativeCandidate[]        // zero or more; empty array is a valid, first-class result (Section 21)
}

InitiativeCandidate {
  kind: 'INITIATIVE',                      // required — distinguishes from RecommendationCandidate.kind at the shared Stage-7 pool (D2 Shared Vocabulary; D3 §6.4)
  // no `category` field — Canonical Decision CD-T005-02: TASK-004's Recommendation Categories are Recommendation-specific and are not reused here; no Initiative-specific category taxonomy is approved. Classification relies on kind, opportunitySource, action, rationale, confidence, hierarchyTier, and opportunityProvenance below.
  action: <proposed content>,               // required — the substance of the Initiative, not yet expressed as user-facing language (D1-CDO-03). Per CD-G2-03 (`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`), this substance does not have to be behavioral advice, a recommendation, a specific instruction, or an insight — a minimal proactive offer of contextual assistance (e.g., `offer contextual assistance`) is a valid `action`. No change to this field's required status or shape.
  rationale: {                              // required — reused from CC-03's explanation object shape
    rationale: <statable reason>,           // required per D1-RP-02 (applied to Initiative by D1 Unit 09's cross-cutting requirement); absent rationale ⇒ zero Candidates, not a Candidate lacking one (D1-CDO-02 analog)
    evidenceBasis: <Evidence Hierarchy tier + basis>,  // required per D1 Unit 11 traceability
    expectedValue: <D1-IP-03 value dimension(s)>,       // required — must name at least one of Trust/Motivation/Consistency/Understanding/Relationship/Decision quality
    uncertainty: <confidence caveat, honestly stated>   // required per D1-ER-05/D1-ER-06
  },
  confidence: <0..1>,                        // required per D1 Unit 11
  hierarchyTier: <Canonical Decision Hierarchy tier>,   // required per D1 Unit 02/07, for Stage-7 pooling
  relationshipMaturityContext: <Stage value + gating rule applied>,  // required — Section 17; supports downstream traceability and Expression phrasing discipline (D1-IP-09)
  opportunitySource: <D1 Unit 05 category>,  // required — confirmed-pattern anticipation / disruption / milestone / recovery-support / (decision-window, if 15.1's gap is later resolved)
  opportunityProvenance: <Stage-3/4/5 trace>, // required, reused from CC-03
  validationResult: <pass/fail + reason>,    // required for internal validation before this Candidate is returned (Section 20 step 8)
  immutable: true                            // required — matches D2-PP-05 preservation-of-confidence/tier discipline through Stages 7-9
}
```

**Required fields:** `kind`, `action`, `rationale` (all four sub-fields), `confidence`, `hierarchyTier`, `opportunitySource`, `opportunityProvenance`, `validationResult`.

**Optional fields:** none beyond what is listed as required above. `relationshipMaturityContext` is marked required because D1-IP-02 makes it substantively necessary to demonstrate Relationship-Maturity-gating compliance (**Engineering Interpretation**: the decision to mark this field "required" rather than "optional" is this document's own inference from D1-IP-02's substance; no canonical source specifies field-level requiredness for a Candidate contract). No `category` field exists on the contract at all (Canonical Decision CD-T005-02) — it is neither required nor optional.

**Identifiers:** an Opportunity-derived identifier sufficient for D2-TR-01 attribution and C2-style `(surface, contextId)` correlation, should an Initiative surface ever be extended into C2's suppression model (Section 25) — the identifier's exact shape is an engineering detail, not a canonical requirement, and is left to implementation.

**Candidate kind/type:** `'INITIATIVE'`, distinguishing it from `'RECOMMENDATION'` at the shared Stage-7 pool (D2 Shared Vocabulary Candidate definition: "a not-yet-selected Recommendation-kind... or Initiative-kind... decision object").

**Source Opportunity reference, evidence references, confidence representation, timing/decision-window metadata:** carried in `opportunityProvenance`, `rationale.evidenceBasis`, `confidence`, and `relationshipMaturityContext`/`opportunitySource` respectively.

**Hierarchy metadata:** `hierarchyTier` is canonical (D1 Unit 02/07). No `category` field exists on `InitiativeCandidate` (Canonical Decision CD-T005-02): TASK-004's `recommendationCategories.js` `CATEGORIES` (`IMMEDIATE_ACTION`/`PREPARATION`/`RECOVERY`/`SYSTEM_BUILDING`) are Recommendation-specific, are not Candidate-generic, and are not reused by the Initiative Engine; no new Initiative-category taxonomy is approved, and none is invented here. Candidate classification instead relies on `kind`, `opportunitySource`, `action`, `rationale`, `confidence`, `hierarchyTier`, `opportunityProvenance`, and the other independently-approved traceability fields already present on this contract. Any future Initiative-category taxonomy requires a separate Product/Architecture decision and a future specification amendment (CD-T005-02, rule 6).

**Relationship-maturity context:** `relationshipMaturityContext`, per Section 17.

**Explainability / reason data:** the `rationale` object, structurally identical to TASK-004's `explanation` object (`rationale`, `evidenceBasis`, `expectedValue`, `uncertainty`), satisfying D2 Unit 09's traceability requirements (Section 28).

**Safety-relevant metadata:** none is added by the Initiative Engine itself — Safety Layer checkpoints operate downstream (Stage 8/9) and do not require the Initiative Engine to pre-annotate safety status; the Initiative Engine may not disqualify or safety-annotate a Candidate itself (Section 13, item 6; Section 24).

**Suppression or exclusion information:** not populated by the Initiative Engine unless/until an Initiative-specific suppression mechanism analogous to C2 is separately approved (Section 25.10, Section 36 item A-2); until then, this field does not exist on the contract.

**Validation result:** required internal field, mirroring `recommendationEngine.js`'s `validateRequest()` discipline — an Initiative Candidate that fails its own validation is not returned (resolves to zero Candidates for that Opportunity, Section 21).

**Immutability expectations:** once constructed and returned by Stage 6, the Candidate's confidence and hierarchyTier are "validated against D1's own rules, and, where still correct under D1, preserved" through Stages 7–9 (D2-PP-05) — the Initiative Engine does not mutate a Candidate after emitting it, and downstream stages do not silently invent new values.

**Serialization/platform-neutral constraints:** plain, frozen, serializable data — no DOM/browser/Firebase reference (D3 §5.5, §14), consistent with `memoryLayer.js`'s existing frozen-object pattern.

This contract reuses the approved shared Candidate shape (CC-02/CC-03 pattern) rather than duplicating it; its one substantive extension beyond that shape, the `relationshipMaturityContext` field, is flagged above as Engineering Interpretation rather than presented as settled. It deliberately omits the `category` field the shared shape's `category` slot would otherwise suggest (Canonical Decision CD-T005-02) — TASK-004's Recommendation Categories are not Candidate-generic and are not extended to Initiative-kind Candidates. It preserves compatibility with TASK-004 (same base shape, same pooling mechanics at Stage 7) and with the future Decision Engine (same `kind`-discriminated Candidate pool it will consume, per Section 23).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Initiative Candidate Contract | D1, D2, D3, TASK-004, C2 |

---

# 20. Candidate Generation Process

The deterministic process by which an eligible Initiative Opportunity becomes an Initiative-kind Candidate, or zero Candidates:

1. **Entry conditions.** An eligible Opportunity (Stage 5 output, or Safety Layer bypass per Section 14.1) and a valid, immutable Pipeline Context are present (Section 14).
2. **Input validation.** The request shape is validated (Section 14.4); an invalid shape is a failure condition (Section 29), not proceeding further.
3. **Opportunity classification.** The Opportunity's D1 Unit 05 source category is read from its Stage-3 tag (confirmed-pattern anticipation / disruption / milestone / recovery-support — Section 15); this determines which source-specific rules (15.2–15.6) apply.
4. **Evidence and confidence evaluation.** The Initiative Engine confirms the evidentiary basis it will cite still holds at Stage 6 (it does not re-run Stage 4's Evidence Evaluation, which already gated entry to Stage 5, but it does apply D1 Unit 11's honesty/uncertainty rules — Section 16 — to how it represents confidence in the Candidate it is about to construct).
5. **Relationship-Maturity gating.** D1-IP-02 is applied: is this Opportunity's category permitted at the user's current Relationship Maturity Stage (Section 17.3)? If not, this Opportunity produces zero Initiative-kind Candidates.
6. **Initiative-policy checks.** D1-IP-03 (value requirement), D1-IP-04 (no engagement motive), D1-IP-06 (celebration restraint, if milestone-sourced), D1-IP-07 (empathy-before-frequency, if during a difficult period), D1-IP-08 (no repeating an ignored Initiative), and D1-IP-01 (confirming the Stage-5 gate was in fact passed, per the eligible-Opportunity input) are each applied. Any failure resolves to zero Candidates for this Opportunity.
7. **Candidate construction.** If all prior steps pass, an `InitiativeCandidate` per Section 19 is constructed, with a statable rationale (D1-RP-02 analog) — if no rationale can be honestly stated, construction does not proceed (equivalent to D1-CDO-02: "If no rationale can be stated..., the decision SHALL resolve to Silence instead").
8. **Candidate validation.** The constructed Candidate is validated against its own contract (Section 19); a Candidate that fails validation is discarded, not returned.
9. **Output or no-output result.** Zero or more valid `InitiativeCandidate` objects are returned; zero is a first-class, valid result (Section 21), not an error.
10. **Trace generation.** Every Candidate returned (or the no-Candidate outcome for this Opportunity) carries the traceability data required by D2 Unit 09 (Section 28).

This process performs no downstream ranking or selection — steps 1–10 apply per-Opportunity, and the resulting Candidates (if any) are handed to Stage 7 (Prioritization, owned by the Decision Engine) for joint ranking against the shared recommendation/initiative budget (D1-PR-04) alongside any Recommendation-kind Candidates produced this cycle.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Candidate Generation Process | D1, D2 |

---

# 21. Silence, Suppression, and No-Candidate Outcomes

The Initiative Engine must deliberately emit no Candidate when:

- **Insufficient evidence** — the confirmed-pattern/disruption/milestone/recovery-support basis does not clear D1 Unit 11's hierarchy bar (Section 16); resolves internally at Stage 4 before ever reaching the Initiative Engine, or, where evidence weakens after Stage 4 but before Stage 6 completes, is re-checked at step 4 of Section 20.
- **Low confidence** — Constitution §20.5: "Low-confidence predictions should remain silent."
- **Poor timing** — D1-IP-05 (predictive timing), D1-IE-02 (Trust Test) applied at Stage 5, and D1-IP-07 (empathy before frequency during difficult periods).
- **Closed decision window** — where applicable to a Decision-Window-sourced Opportunity reaching Stage 6 (Section 15.1); D1 Unit 05's Decision Window definition is inherently time-bounded.
- **Trust risk** — D1-IE-02 Trust Test; D1-IP-03's value requirement (an Initiative that would not increase Trust, Motivation, Consistency, Understanding, Relationship, or Decision quality "SHALL NOT be sent").
- **Excessive user effort** — not separately named in D1 Unit 09 for Initiative specifically, but consistent with the general D1 Unit 06 Eligibility Test weighing "interruption cost" and Constitution §12.8 ("Initiative Should Reduce Effort... arrive with solutions. Not homework").
- **Recent ignored initiative where additional initiative is prohibited** — D1-IP-08: "SHALL NOT respond to an ignored Initiative with more Initiative. It SHALL instead self-diagnose timing, content, context, or necessity before trying again."
- **Rejection/suppression feedback from C2 where relevant** — C2's `evaluateSuppression()` mechanism is not currently wired to any Initiative surface (Section 18.5, Section 25.10); if and when such wiring is separately approved, its result would apply here. Until then, this is a **Repository Gap**, not an active check (Section 36, item A-2).
- **Missing required context** — Section 14.5/14.6; an Initiative Engine cannot honestly construct a rationale (step 7, Section 20) without the Pipeline Context fields it depends on.
- **Conflict with an absolute override** — D1 Unit 02's absolute overrides and D1-RP-07 ("SHALL NOT emit a Candidate that conflicts with a D1 Unit 02 absolute override").
- **Absence of a useful action** — D1-IP-03's value requirement, restated; Constitution §12.4: "Every proactive message competes against doing nothing... Will the user's day actually become better because I sent this?"

**Deliberate Silence-compatible outcomes vs. runtime failure:** every item above is a **reasoned, deterministic** outcome — the Initiative Engine evaluated the Opportunity and correctly determined no Candidate should be produced. This is categorically different from a **runtime failure** (Section 29) — an inability to evaluate at all (e.g., malformed Pipeline Context, an unhandled exception) — which must never be silently converted into, or confused with, a deliberate zero-Candidate result. D1-SP-01 governs the general principle this section instantiates for Initiative specifically: "Silence SHALL be treated as a first-class, deliberately reasoned decision outcome — never an absence of a decision, and never a failure state."

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Silence, Suppression, and No-Candidate Outcomes | D1, Constitution, C2 |

---

# 22. Interaction with Recommendation Engine

**Shared contracts and shared Pipeline Context:** both engines consume the identical Pipeline Context shape from the Memory Layer (D3 §11.2: both rows in the Component Contracts table are byte-identical except Candidate kind) and both produce into the same shared Candidate pool the Decision Engine ranks jointly at Stage 7 (D1-PR-04's shared recommendation/initiative budget).

**Separate policy ownership:** the Recommendation Engine applies D1 Unit 08 in full; the Initiative Engine applies D1 Unit 09 in full. D3 §8.5: these are kept as structurally separate components "so that Initiative-specific rules (D1-IP-04, D1-IP-08) cannot leak into Recommendation Candidate generation or vice versa."

**Prohibition on rule leakage:** neither engine may share internal candidate-construction logic that would apply the other's D1 Unit's rules to its own output. This is enforced by the component boundary itself (separate modules, separate orchestration-authority assignment at Stage 6), not by a runtime check.

**The Decision-Window ownership nuance (restated for this section specifically, per Section 9.2/15.1):** the Recommendation Engine, not the Initiative Engine, owns Stage-3 Decision-Window *detection* (D2 Unit 04, Stage 3 Dependencies). This means a Decision-Window-sourced Opportunity is detected by the Recommendation Engine's Stage-3 contribution regardless of which engine ultimately generates a Candidate from it at Stage 6. Which engine (or both, or neither) is presented such an Opportunity for Stage-6 Candidate Generation is a Stage-5-downstream routing question this document does not resolve (Repository Gap G-4, Section 36) — D2 does not state that Opportunity source category determines which engine(s) receive it at Stage 6; it states only which engine(s) contribute to *detecting* each source category at Stage 3.

**How duplicate or overlapping Opportunities/Candidates are represented for later Decision Engine handling:** D2-PP-06 (cardinality/pooling rule): "Candidates from every Opportunity that generates them are pooled at Prioritization (D1-PR-04's shared budget)." If both engines independently produce a Candidate related to the same or overlapping Opportunity, both Candidates enter the same Stage-7 pool as distinct, kind-tagged entries — the Initiative Engine does not deduplicate against, or defer to, the Recommendation Engine's output, or vice versa; that arbitration belongs to the Decision Engine (Stage 7/8).

**What each engine must not decide about the other's output:** neither engine reads, ranks, or is influenced by the other's Candidate output — D2 Unit 07's Forbidden Responsibilities exclude Prioritization/Winner Selection from both, and D3 §8.4/§8.5 each describe "one-directional handoff of Candidates to Prioritization; never receives ranking feedback that would let it re-generate" (stated for the Recommendation Layer, applying identically to the Initiative Layer per §8.5's "identical shape").

**Whether either engine may call the other directly:** no. Each is an independent internal collaborator consuming only Memory Layer output and producing only into the Stage-7 pool (D3 §11.2 Component Contracts: "Consumes From: Memory Layer (Pipeline Context)... Produces For: Decision Layer" for both, with no cross-engine dependency listed).

This document does not add cross-engine prioritization logic of any kind.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Interaction with Recommendation Engine | D1, D2, D3 |

---

# 23. Interaction with Decision Engine

**What the Initiative Engine sends:** zero or more `InitiativeCandidate` objects (Section 19) into the shared Stage-7 candidate pool.

**What it must not decide:** Prioritization (Stage 7), Winner Selection (Stage 8), or Decision Formation (Stage 9) — all Decision Engine orchestration authority (D2 Unit 04; Section 8/13).

**How the future Decision Engine consumes Initiative Candidates:** per D2 Unit 04 Stage 7, "Rank every Candidate surviving Candidate Generation across every Opportunity detected this cycle, jointly, against the shared recommendation/initiative budget (D1-PR-04)" — primary ranking by Canonical Decision Hierarchy tier (D1-PR-01), with recommendation-specific impact tiers (D1-PR-02) nested only within Hierarchy tiers 1–2/9; D2 does not restate an equivalent nested impact-tier scheme for Initiative-kind Candidates, so whether Initiative Candidates receive an analogous nested tiering or rank by Hierarchy tier alone is a D1 Unit 07/09 policy matter D2 does not itself re-derive — this document does not invent one (**Repository Gap** G-5, Section 36). At Stage 8, Winner Selection is "kind-agnostic per D2, operating over the shared ranked pool" — no Initiative-specific selection path exists. At Stage 9, a winning Initiative-kind Candidate becomes an "Initiative"-kind Terminal Decision by default, subject to the Safety Layer's final review (D1-AB-05).

**Compatibility requirements for mixed Candidate sets:** the `kind` field (Section 19) is the sole discriminator the Decision Engine needs to distinguish Initiative-kind from Recommendation-kind Candidates within the same pooled ranking pass; confidence and hierarchyTier are preserved-not-reinvented through Stages 7–9 per D2-PP-05.

**Error behavior when the Decision Engine is absent or unreachable during the TASK-005 repository stage:** at this baseline, the Decision Engine does not exist (TASK-006 is not yet started). The current Orchestrator (`internalPipelineOrchestrator.js`) already handles this by never invoking Stage 7+ at all — `run()` returns `candidates: []` unconditionally, and `runForOpportunity()` is wired only to the Recommendation Engine today. TASK-005 must not fabricate a substitute Decision Engine or a substitute Terminal Decision in its absence (D2-EF-06: "no Terminal Decision SHALL be fabricated in its place"); the Initiative Engine's own output contract (Section 19) is complete and valid on its own terms, whether or not anything downstream currently consumes it.

**Temporary integration boundaries that do not pre-implement TASK-006:** the Initiative Engine's public interface should mirror the existing `runForOpportunity(pipelineContext, eligibleOpportunity)` pattern (Section 26) so that a future Decision Engine (or, in the interim, tests) can invoke it directly without requiring Stages 5/7/8/9 to exist yet — exactly as `internalPipelineOrchestrator.js`'s own comment already anticipates ("exposed for future Decision Engine or tests"). This document does not implement a substitute Decision Engine inside TASK-005.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Interaction with Decision Engine | D1, D2, TASK-006 |

---

# 24. Interaction with Safety Layer

**What safety-related context the Initiative Engine may read:** whatever Health/Safety Profile and Life Event Context fields the Memory Layer includes in Pipeline Context (D1 Unit 03 Decision Input categories; D3 §11.2 lists "Health/Safety Profile, Life Event Context" as inputs to the Safety Layer specifically, delivered via the same Memory Layer Pipeline Context all components share) — read-only, for the purpose of applying its own D1-IP rules (e.g., recognizing a difficult period for D1-IP-07), never for making a safety determination itself.

**What it may annotate:** nothing safety-specific — the Initiative Engine's Candidate contract (Section 19) carries no safety-disqualification field; safety annotation is the Safety Layer's exclusive function (D3 §11.2: Safety Layer "Consumes From: ...Candidates and Terminal Decisions (Decision Layer)").

**What it may locally reject:** an Opportunity may fail the Initiative Engine's own D1-IP checks (Section 20 step 6) and produce zero Candidates — this is a policy rejection, not a safety rejection, and must not be conflated with Safety Layer disqualification.

**What only the Safety Layer may determine:** disqualification of a Candidate, or modification/deferral/blocking of a Terminal Decision — D1-AB-05: "Every Recommendation SHALL pass through a safety evaluation with authority to modify, defer, or block it, executed independently of and before the recommendation logic proper. No part of the system, including any future AI agent, may bypass this evaluation." Constitution Ch.23 Engineering Implications states this even more explicitly for the architecture generally: "Every recommendation generated by the FITME Coach should pass through a dedicated Safety Layer... independently from the Recommendation Engine and [with] the authority to modify, defer, or block recommendations... Safety evaluation should execute before every coaching recommendation, regardless of which subsystem generated it. No module—including future AI agents—may bypass this constitutional safety layer." This binds Initiative-kind output exactly as it binds Recommendation-kind output — an Initiative is, functionally, a form of proactive recommendation for this purpose, and D1-AB-05 does not carve out an exception for it.

**How safety-triggered Opportunities enter the shared pipeline:** via the Safety Layer's unconditional Stage-3 injection, bypassing Evidence Evaluation and Eligibility Evaluation (D1-OD-04, D2-EF-01(a)) — not detected or injected by the Initiative Engine (Section 15.8).

**How the Initiative Engine avoids bypassing or duplicating Safety authority:** by never disqualifying, modifying, deferring, or blocking anything itself (Section 13, item 6), and by never treating its own local D1-IP-policy rejections as a substitute for, or equivalent to, a Safety Layer determination.

**Failure behavior when required Safety evaluation is unavailable:** at this baseline, the Safety Layer does not yet exist (also part of the unbuilt D3 §17 collaborator set). Per D3 §12.3 (Graceful Degradation): "Where the Safety Layer or Decision Engine cannot be reached at all, the architecture SHALL NOT substitute a default Terminal Decision." The Initiative Engine producing a Candidate does not itself constitute a Terminal Decision (Section 8) — its output remains a Candidate awaiting Stage 7–9, which cannot complete without the Decision Engine and Safety Layer regardless. This document does not require the Initiative Engine to simulate, stub, or bypass Safety Layer evaluation to produce testable output; its Candidates are simply not deliverable to a user until the Decision Engine and Safety Layer exist (Section 23).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Interaction with Safety Layer | D1, D2, D3, Constitution |

---

# 25. Interaction with Memory, State, and Persistence

**Pipeline Context reads:** the Initiative Engine reads Pipeline Context exclusively as delivered by the Memory Layer (Section 14); it does not read StateAccess, DerivedIntelligenceConsumer, Firestore, repositories, persistence systems, or any other raw data source directly, under any circumstance (D3 §8.1, §11.1: "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context"; Canonical Decision CD-T005-01, rule 2 — this prohibition is unaffected by, and independent of, the Pipeline Context extension immediately below).

**Pipeline Context extension (Canonical Decision CD-T005-01):** `memoryLayer.js` is authorized to make a focused extension to its existing Context Assembly responsibility, solely to assemble and expose the approved D1 Unit 03 / D2 Stage 2 input categories the Initiative Engine requires beyond what TASK-004 already assembled: Relationship Maturity signal, Life Event Context, Habit state, Pattern state, and Capacity state (CD-T005-01 rule 3). The Memory Layer remains the sole owner of Decision Input reads and Pipeline Context Assembly (CD-T005-01 rule 1); this extension does not authorize the Memory Layer to perform Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation (CD-T005-01 rule 5). Pipeline Context remains assembled once per Decision Pass, immutable for the remainder of that Decision Pass, platform-neutral, serializable, and owned exclusively by the Memory Layer (CD-T005-01 rule 4; D2-PP-02; D3 §8.1 Decision 3). This is an extension of TASK-004's existing Memory Layer infrastructure, not a redesign or replacement of it (CD-T005-01 rule 6).

**Approved StateAccess usage:** none directly by the Initiative Engine — it continues to have no StateAccess capability of its own (CD-T005-01 rule 2). The Memory Layer's own StateAccess usage, within the existing `coachDecisionSystem.DECISION_PASS` permission-matrix entry (`js/stateAccess.js:403-408`), is extended to read whatever already-approved state domain(s) back Relationship Maturity, Life Event Context, and Capacity state, in addition to its existing `recommendationFeedbackHistory` read (B3 §2). This extension is scoped to the Memory Layer's own read authority and grants the Initiative Engine no parallel or independent StateAccess capability. A separate, Initiative-specific suppression check (Section 21) remains outside this extension's scope and is recorded independently at **Architecture Decision Pending** (Section 36, item A-2).

**B5 consumption path (Canonical Decision CD-T005-01):** `INITIATIVE_ENGINE` is a reserved consumer id (`js/derivedIntelligenceConsumer.js:32`) and `INITIATIVE_SUPPORT_V1` a reserved policy (B5 §19.3: "Reserved for future work. Disabled under B5 unless separately approved."). Habit state and Pattern state — the inputs confirmed-pattern-anticipation detection requires (Section 15.2, D2 Unit 07) — are reachable only through this consumer/policy pair, per B5's status as the sole approved runtime read path for Habit/Pattern Derived Intelligence. Enabling `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` in B5's production-enabled mapping is therefore authorized — but only as part of this focused Memory Layer Pipeline Context extension, not as a standalone or general-purpose enablement (Section 36, item A-1, resolved). Only the Memory Layer calls `DerivedIntelligenceConsumer.build({consumer: 'INITIATIVE_ENGINE', policyId: 'INITIATIVE_SUPPORT_V1', ...})`, exactly as it already does for `RECOMMENDATION_ENGINE`; this does not create a new direct Initiative Engine consumption path — the Initiative Engine continues to receive Habit/Pattern signal only as fields already present in the Pipeline Context object the Memory Layer hands it, never via direct storage reads (B5 §10.1 prohibition, applying equally; CD-T005-01 rule 2).

**C3 event-model interactions:** any behavioral event the Initiative Engine's Stage-3 contribution reasons about must conform to C3's closed `feedback`-kind schema in `users/{uid}.coachEvents[]` (D1-MU-04: "D1 does not introduce new event types; a decision process requiring one requires a future specification revision"). No second event kind is introduced by this document.

**C4 typed-memory write-path constraints:** if the Initiative Engine (or a future consumer of its output) ever wishes to persist an inferred observation as typed memory, it must do so exclusively through `functions/typedMemoryServerWrite.js`, with `source` restricted to `inferred_event`, `inferred_pattern`, or `coach_generated`, and every such write is forced to `status: 'candidate'` regardless of source (C4 §13.4) — no promotion mechanism exists, and this document does not introduce one. C4 itself currently has **no wired production caller** (C4 §21) — this is unchanged by TASK-005.

**Whether TASK-005 writes anything durably:** **no.** Nothing in this specification grants the Initiative Engine new persistence authority. Per D3 §11.1: "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf." The Initiative Engine is, like the Recommendation Engine, a pure Candidate producer with zero durable-write responsibility of its own.

**History or trace data ownership:** internal orchestration trace (D2 Unit 09 traceability, Section 28) is distinct from Coaching History (a Memory Layer / Persistence Gateway durable-write concern, D3 §10.1 Decision 4) — the Initiative Engine produces the former as part of its Candidate output; it does not itself own or write the latter.

**No-authoritative-inference rule:** any inference the Initiative Engine's own reasoning relies on (e.g., an inferred pattern not yet confirmed) remains Evidence Hierarchy Tier 5 until user-confirmed (D1-MU-01) and must never be represented in a Candidate's rationale as more certain than that (D1-ER-01, D1-ER-07).

**Session/account isolation:** inherited from B3's existing discipline — any StateAccess capability a future Initiative Engine implementation receives would be scoped to "the current authenticated user... the current REM-002 session generation" exactly as the Memory Layer's existing capability already is (B3 §2, §18); this document does not weaken that.

**Stateless or pure-domain requirements:** consistent with D3 §5.5/§14, the Initiative Engine's decision logic operates purely on already-assembled inputs and structured outputs, with no inherent DOM/browser/Firebase dependency — it is expected to belong to C1's Pure Domain tier, reusable unchanged in a future native shell.

No new persistence or raw-read authority is granted to the Initiative Engine itself by this document; Canonical Decision CD-T005-01's Pipeline Context extension applies exclusively to the Memory Layer's existing Context Assembly role. Every read/write path above either already exists (and is reused as-is), is authorized by CD-T005-01 as a focused Memory Layer extension, or remains explicitly flagged as pending a separate approval (Section 21's Initiative-specific suppression check, item A-2).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Interaction with Memory, State, and Persistence | D1, D2, D3, B2, B3, B5, C1, C2, C3, C4, Repository |

---

# 26. Runtime Placement and Composition

**Component/module boundary:** a new internal collaborator module inside the existing `js/coachDecisionSystem/` directory, structurally parallel to `recommendationEngine.js` — candidate path `js/coachDecisionSystem/initiativeEngine.js`. This is a **candidate path**, offered as an engineering proposal consistent with the existing repository pattern, not a canonical requirement — Section 32 restates this distinction. No `initiativeCategories.js` (or equivalent Initiative-specific category module) is authorized: `InitiativeCandidate` carries no `category` field (Canonical Decision CD-T005-02).

**Composition within the existing Composite Engine:** the Initiative Engine is **not** a new Engine Registry entry. It is a new internal collaborator inside the single, already-registered `coachDecisionSystem` engine (D3 §17 Decision 1), invoked by the existing Internal Pipeline Orchestrator (`internalPipelineOrchestrator.js`) — exactly as the Recommendation Engine already is.

**Invocation point(s) (Engineering Interpretation — no canonical source fixes the Orchestrator's internal dispatch mechanics; this describes a proposal consistent with Repository Evidence):** at Stage 3, as a detection contribution (confirmed-pattern anticipation, disruption/milestone detection) feeding into whatever Stage-3 aggregation the Orchestrator performs; at Stage 6, via a Stage-6 dispatch function structurally analogous to the existing `runForOpportunity(pipelineContext, eligibleOpportunity)`, which today calls `RecommendationEngine.generate(...)` and would, for an Initiative-kind request, call the new `InitiativeEngine.generate(...)` instead (or in addition, depending on how Stage-6 routing between the two engines for a given eligible Opportunity is ultimately resolved — Section 22's Repository Gap G-4 bears directly on this).

**Ordering relative to Recommendation, Decision, Safety, Memory, Expression, and Coach Runtime:** unchanged from D3 §6.1/§9 — Memory Layer (Stage 1–2) → {Recommendation Engine, Initiative Engine, Safety Layer} (Stage 3) → Decision Engine (Stage 4–5, though D2 does not name a single Stage-4 owner) → {Recommendation Engine, Initiative Engine} (Stage 6) → Decision Engine + Safety Layer (Stage 7–9) → Expression (Stage 10) → Coach Runtime (external, platform delivery) → Memory Layer (Stage 11–13). The Initiative Engine sits at exactly the same two pipeline positions the Recommendation Engine already occupies, never before Memory Layer's Context Assembly and never after Decision Engine's Winner Selection.

**Public versus internal APIs:** per the existing pattern, a single module-level `generate(request)` export (mirroring `recommendationEngine.js`) is the Initiative Engine's public surface; any Stage-3-specific detection helper functions are internal to the module, exactly as `recommendationCategories.js`'s helpers are internal to its own concerns today.

**Registry behavior:** no new `register()` call, no new engine id — the existing `registerCoachDecisionSystem.js` registration (`id: 'coachDecisionSystem'`) already covers the Initiative Engine as an internal collaborator, per D3 §17 Decision 1 and §11.1 ("no internal collaborator... is independently registered").

**Dependency direction:** Memory Layer → Initiative Engine → Decision Engine (D3 §11.2 Component Contracts row for Initiative Engine: "Consumes From: Memory Layer (Pipeline Context)... Produces For: Decision Layer"). The Initiative Engine has no dependency on, and is not depended on by, the Recommendation Engine, Safety Layer, or Expression directly.

**Platform-neutral implementation constraints:** per Section 14.8/25, no DOM/browser/Firebase reference; Pure-Domain-shaped per D3 §5.5/§14.

This document does not redesign the canonical Composite Engine — no repository evidence inspected during this specification's authoring suggests the approved D3 §17 architecture cannot be implemented as designed; TASK-004's implementation of the first two collaborators is itself evidence that the architecture is implementable as specified.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Runtime Placement and Composition | D2, D3, TASK-004, Repository |

---

# 27. Integration Map

| Producer | Consumer | File/Module/Symbol | Input Contract | Output Contract | Owner | Failure Behavior | Required Tests | Implementation Status |
|---|---|---|---|---|---|---|---|---|
| Memory Layer | Initiative Engine | `memoryLayer.js` (focused extension, Canonical Decision CD-T005-01) → (new) `initiativeEngine.js` | none (Memory Layer has no input from Initiative Engine) | `ImmutablePipelineContext`, extended with Relationship Maturity signal, Life Event Context, Habit state, Pattern state, Capacity state | Memory Layer | Graceful degradation already implemented (try/catch, `availability` map), extended to the new reads; Initiative Engine must reason correctly under partial availability (Section 14.5) | Extend `tests/memoryLayer.test.js` for the CD-T005-01 extension; new consumption tests in Section 33.7 | Memory Layer (TASK-004 baseline): DONE. CD-T005-01 extension: NOT BUILT. Initiative Engine consumption: NOT BUILT |
| Initiative Engine | Decision Engine (TASK-006, not yet built) | (new) `initiativeEngine.js` → future Decision Engine module | `InitiativeRequest` (Section 19) | `InitiativeResult` / `InitiativeCandidate[]` | Initiative Engine (production); Decision Engine (consumption, unbuilt) | Per D2-EF-06/D3 §12.3: no Terminal Decision fabricated in Decision Engine's absence; Initiative Engine's own output remains valid and complete regardless (Section 23) | New: `tests/initiativeEngine.test.js` (Section 33.1–33.2) | NOT BUILT |
| Internal Pipeline Orchestrator | Initiative Engine | `internalPipelineOrchestrator.js` (`run`, `runForOpportunity`) | Stage-3 dispatch (detection contribution); Stage-6 dispatch (`pipelineContext`, `eligibleOpportunity`) | detected Opportunities (Stage 3); `InitiativeCandidate[]` (Stage 6) | Orchestrator (dispatch only, no decision content per D3 §11.1) | Orchestrator continues Stage sequencing per D2-EF-09 Recovery Rules regardless of Initiative Engine's per-cycle outcome | Extend `tests/internalPipelineOrchestrator.test.js` (Section 33.4) | Orchestrator exists and dispatches to Recommendation Engine only (TASK-004); Initiative Engine dispatch NOT BUILT |
| B5 DerivedIntelligenceConsumer | Memory Layer only (never the Initiative Engine directly, CD-T005-01 rule 2) | `derivedIntelligenceConsumer.js` (`INITIATIVE_ENGINE` consumer id, `INITIATIVE_SUPPORT_V1` policy), called from `memoryLayer.js` | `DerivedIntelligenceBuildRequest` | `DerivedIntelligenceBuildResult` | B5 (production-enabled mapping); Memory Layer (caller) | Currently `UNKNOWN_CONSUMER`/`POLICY_NOT_ALLOWED_FOR_CONSUMER` by design until the production-enabled mapping is updated | Extend `tests/derivedIntelligenceConsumer.test.js` and `tests/memoryLayer.test.js` once enabled | Consumer id and policy name reserved; enablement authorized by Canonical Decision CD-T005-01 (Section 36, item A-1, resolved); NOT YET BUILT |
| B3 StateAccess | Initiative Engine | `stateAccess.js` (new permission-matrix entry, if any read/write is needed beyond Pipeline Context) | `EngineStateAccess` capability | scoped read/write per approved operation | B3 (any new entry requires its own approval) | `STATE_ACCESS_DENIED` for anything not explicitly granted | New wiring test if a new entry is added | NOT BUILT (no entry exists beyond `coachDecisionSystem.DECISION_PASS`, Section 10.4) |
| C2 FeedbackDomain | Initiative Engine (if extended) | `feedback/feedbackDomain.js` (`evaluateSuppression`) | `(feedbackEvents, surface, contextId, nowTs, policyId)` | `{suppressed, reason, suppressedUntil, policyId}` | C2 (scope extension is Architecture-owned; C2 itself explicitly excludes an Initiative surface) | N/A until extended | N/A until extended | NOT WIRED to any Initiative surface (Repository Gap A-2, Section 36) |
| Initiative Engine | Test harness | (new) `tests/initiativeEngine.test.js` | direct `generate(request)` calls | assertions | Lead Engineer (implementation phase, not this document) | N/A | Section 33 in full | NOT BUILT |

Both production code and test wiring are represented above; every "NOT BUILT" row is explicitly TASK-005 implementation scope (pending READY), not something this specification itself constructs (Section 46).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Integration Map | D2, D3, TASK-004, TASK-006, B3, B5, C2, Repository |

---

# 28. Determinism, Explainability, and Traceability

**Identical-input expectations:** consistent with `recommendationEngine.js`'s existing discipline ("pure/deterministic, never throws"), the Initiative Engine's `generate(request)` must be a pure function of its `InitiativeRequest` — identical `(opportunity, pipelineContext)` input must yield identical output, with no reliance on wall-clock time, randomness, or external I/O inside the Stage-6 decision logic itself (any time-sensitivity, e.g. "is this Decision Window still open," must be expressed as an explicit field within the Opportunity/Pipeline Context, not read from the system clock inside the engine).

**Rule identifiers:** each Candidate (or no-Candidate outcome) should be traceable to the specific D1-IP rule(s) applied (D1-IP-01 through D1-IP-10), consistent with D2-TR-01: "Kind, rationale, confidence, and Hierarchy position SHALL each be logically attributable to the specific Stage that produced it."

**Source Opportunity trace:** `opportunityProvenance` (Section 19), satisfying D2 Unit 09's requirement to attribute "the Opportunity that produced the winning Candidate (or every Opportunity considered + internal outcome, for Silence)."

**Evidence trace:** `rationale.evidenceBasis` (Section 19), satisfying the Evidence Hierarchy tier attribution requirement (D2 Unit 09).

**Reason codes:** the `rationale.rationale` field (Section 19) is the statable reason required by D1-RP-02 (applied to Initiative); this document does not fix a closed reason-code enum, since none is fixed canonically for Initiative specifically — an implementation-level detail, not a canonical gap requiring escalation.

**No-candidate reason codes:** each Section 21 category (insufficient evidence, low confidence, poor timing, closed window, trust risk, effort, ignored-initiative repeat, suppression, missing context, absolute-override conflict, no useful action) should be independently distinguishable in trace output — per D2-TR-02: "A Silence Terminal Decision SHALL be equally traceable as a Recommendation or Initiative decision," applied by extension to a per-Opportunity internal Silence outcome at Stage 6.

**Canonical-source traceability where practical:** every normative statement in this document already cites its exact D1/D2/D3 rule id; an implementation should preserve this same granularity in code comments and trace payloads where practical, consistent with how `memoryLayer.js`'s own header comment already cites D3 §8.1/§11.1.

**Separation between machine-readable trace and future user-facing explanation:** per D1-CDO-03, the Candidate's rationale/trace data is machine-readable input to Expression (Stage 10), not user-facing language itself — the Initiative Engine does not generate the words a user eventually sees; it generates the structured basis Expression will translate, honoring D1-IP-09's verify-don't-assume phrasing discipline (Section 17.5) as a downstream Expression concern informed by, but not performed by, this Candidate.

**Debugging without exposing private or sensitive data unnecessarily:** consistent with D1-MU-05 ("SHALL NOT retain personal details that carry no coaching value") and B3's least-privilege discipline (Section 31), trace/debug output should carry rule identifiers and evidence-tier references rather than raw sensitive payload content wherever the former suffices.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Determinism, Explainability, and Traceability | D1, D2, D3, B3 |

---

# 29. Failure Handling and Graceful Degradation

| Failure | Detection | Handling | Output | Logging/Trace | Pipeline Continues? | Required Test |
|---|---|---|---|---|---|---|
| Invalid input contract | Request-shape validation (Section 14.4, step 2 of Section 20) | Reject before Candidate construction | No Candidate for this Opportunity; failure recorded distinctly from deliberate Silence (Section 21) | Trace records validation failure reason | Yes — this Opportunity's failure is contained (D2-EF-06: contained "to the Opportunity it was processing") | 33.9 |
| Missing optional context | D2-EF-08: absence itself treated as evidence | Proceed using available categories | May still produce a Candidate, or resolve to Silence if the absence is itself decisive (Section 14.7) | Trace records which categories were available | Yes | 33.7 |
| Missing required context | Cannot honestly construct rationale (Section 20 step 7) | Do not construct Candidate | Zero Candidates (Silence-compatible, Section 21) | Trace records "missing required context" reason | Yes | 33.8, 33.9 |
| Malformed memory/state data | Memory Layer's own graceful-degradation try/catch (already implemented in `memoryLayer.js`); Initiative Engine additionally validates what it receives | Treat as missing/degraded, not fabricated | Degraded but non-fabricated output, or zero Candidates | Trace records degradation | Yes | 33.7, 33.9 |
| Conflicting evidence | D1-ER-01 claim-type discipline (Section 14.6) | Higher Evidence Hierarchy tier governs; unresolved conflict ⇒ insufficient evidence | Zero Candidates for the conflicting basis | Trace records conflict | Yes | 33.8 |
| Unavailable dependency (Memory Layer itself unreachable) | Orchestrator-level (upstream of Initiative Engine; Memory Layer already handles its own upstream failures via try/catch) | Initiative Engine is never invoked without a Pipeline Context (Stage 2 precedes Stage 3/6) | N/A — Initiative Engine not reached | Orchestrator-level trace | Cycle proceeds per D2-EF-09 | 33.4 (orchestrator level) |
| Unavailable Safety or Decision components | Not detectable by the Initiative Engine itself (it has no dependency on either at Stage 6 production time) | Initiative Engine still produces valid Candidates; no Terminal Decision fabricated downstream (D3 §12.3, Section 23–24) | `InitiativeCandidate[]` produced normally; simply not consumed further at this baseline | N/A at Initiative Engine level | Yes, Initiative Engine's own step completes | 33.6, 33.9 |
| Candidate validation failure | Step 8 of Section 20 | Discard the invalid Candidate | Not returned; treated as zero Candidates for that construction attempt | Trace records validation failure | Yes | 33.2, 33.9 |
| Unexpected exception | Standard try/catch discipline, matching `recommendationEngine.js`'s "never throws" contract | Caught, converted to a structured failure result, never left to propagate and abort the pipeline | No Candidate; explicit failure status, distinct from deliberate Silence | Trace records exception context (sanitized per Section 28's privacy note) | Per D2-EF-06: contained to the Opportunity being processed | 33.9 |
| Duplicate Candidate generation | Not separately detected by the Initiative Engine (it operates per-Opportunity, once per cycle per D2-PP-02's one-Pipeline-Context-per-cycle discipline); cross-engine duplication is a Decision Engine (Stage 7) concern (Section 22) | N/A at this component's boundary | N/A | N/A | Yes | 33.5 |
| Stale decision window | Section 14.5 (stale Pipeline Context is an Orchestrator-level guarantee, not re-validated by the Initiative Engine); a Decision-Window Opportunity whose window has since closed is an evidence/timing question (Section 21) | Resolves to zero Candidates (poor timing / closed window) | Zero Candidates | Trace records "closed window" | Yes | 33.8 |
| Unsupported Opportunity type | An Opportunity tagged with a source category the Initiative Engine does not recognize (e.g., outside D1 Unit 05's five categories) | Reject as invalid input | No Candidate | Trace records unsupported type | Yes | 33.9 |

No Candidate or Terminal Decision is ever fabricated as fallback content, per D1-DI-02 (extended architecturally by D3 §12.3: "the architecture SHALL NOT substitute a default Terminal Decision") — every row above resolves to either a valid Candidate, a deliberate zero-Candidate/Silence-compatible outcome, or an explicit, distinguishable failure status; none of the three is ever silently converted into another.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Failure Handling and Graceful Degradation | D1, D2, D3 |

---

# 30. Performance and Operational Constraints

**Synchronous versus asynchronous execution (Engineering Interpretation, based on Repository Evidence, not a canonical requirement):** the Initiative Engine's Stage-6 `generate(request)` should be synchronous/pure, matching `recommendationEngine.js`'s existing pattern (no I/O inside Candidate-construction logic — all data arrives pre-assembled via Pipeline Context). Its Stage-3 detection contribution may need to be invoked from within the Orchestrator's existing async flow (`memoryLayer.js`'s `assembleContext` is async), but the detection logic itself operates on already-fetched Pipeline Context data, not live I/O.

**Bounded runtime:** no specific numeric bound is fixed by any canonical source inspected; this document does not invent one (per the skeleton's own instruction not to invent arbitrary performance numbers without evidence or explicit engineering rationale).

**Repeated invocation/idempotency:** consistent with D2-PP-02 (one immutable Pipeline Context per Decision Pass), the Initiative Engine's output for a given `(opportunity, pipelineContext)` pair should be idempotent within a single cycle; no cross-cycle caching of partial state is permitted (D3 §12.2: "no component may cache or retain a partial Pipeline Context across cycles as an optimization").

**Duplicate prevention:** at the Initiative Engine's own boundary, none is required beyond per-Opportunity, per-cycle invocation discipline (Section 29, "Duplicate Candidate generation" row) — cross-Candidate deduplication across engines is a Decision Engine concern (Section 22).

**Memory and payload size:** no specific numeric bound is fixed; the Candidate contract (Section 19) is comparable in size/shape to TASK-004's existing `RecommendationCandidate`.

**No unnecessary network dependency in pure-domain logic:** consistent with D3 §5.5/§14 — the Initiative Engine's decision logic has no inherent network dependency; any I/O (Pipeline Context assembly, Derived Intelligence consumption) happens upstream, in the Memory Layer.

**Startup impact:** the Initiative Engine is dispatched only when the Orchestrator reaches Stage 3/6 for a given cycle; it adds no new `APP_READY`-trigger registration (Section 26 — no new Engine Registry entry).

**Pilot-scale requirements without creating a scale bottleneck:** no evidence in the repository or canonical sources suggests a scale requirement beyond what the existing Recommendation Engine already satisfies at the same pipeline positions; this document does not invent a distinct scale target for the Initiative Engine.

**Future native compatibility:** per D3 §14, the Initiative Engine is expected to belong to C1's Pure Domain tier, Node-loadable, with no DOM/`window`/Firebase/service-worker dependency, reusable unchanged in a future native shell.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Performance and Operational Constraints | D2, D3, TASK-004, C1 |

---

# 31. Security, Privacy, and Safety Constraints

**Least-privilege data access:** the Initiative Engine reads only what its D1 Unit 09 responsibilities require, via the Memory Layer's Pipeline Context and, if separately approved, a scoped StateAccess/DerivedIntelligenceConsumer capability (Section 25) — never raw storage, never another engine's namespace (B3 §2).

**Avoidance of unnecessary sensitive-data duplication:** the Initiative Engine does not persist anything durably itself (Section 25); any evidence it reasons over remains owned by its Memory Layer source.

**No private-data leakage in logs:** per Section 28's debugging note, trace output favors rule identifiers and evidence-tier references over raw sensitive content.

**Account/session isolation:** inherited from B3's existing per-user, per-session-generation scoping (Section 25).

**Medical and safety boundaries:** the Initiative Engine never itself makes a medical/safety determination — that is exclusively the Safety Layer's (Section 24); D1-IE-01's valid-reason set and D1 Unit 02's absolute overrides bound what the Initiative Engine may even consider proposing, but final safety authority remains external to it.

**User autonomy:** D1-IP-09 (verify, don't assume), Constitution §22.6 ("The final decision always belongs to the user"), and D1-PER-01/05 (personalization earned, never exploitative) all bound the Initiative Engine's construction logic — it proposes; it never asserts control.

**Non-manipulative behavior:** D1-IP-04, Constitution §22.7 ("Never Manipulate Emotion" — no fear, shame, dependency, urgency, or manufactured scarcity), and Constitution Principle 22 ("The FITME Coach never asks: 'What benefits the product?' It first asks: 'What genuinely benefits the person using it?'") bound every Candidate the Initiative Engine constructs.

**No engagement optimization:** D1-IP-04, Constitution §12.11 ("Never Chase Engagement... FITME measures success through outcomes. Not addiction"), and the Canonical Decision Hierarchy's ranking of Product Engagement last (D1 Unit 02) — the Initiative Engine's `hierarchyTier` field (Section 19) must never be influenced by engagement/retention considerations, consistent with D1-AH-03 (cited at D2 Unit 04 Stage 7: "SHALL NOT let Product Engagement... influence ranking," a Decision Engine rule the Initiative Engine's own tier assignment must not undermine by construction).

This document does not expand TASK-005 into a separate security-remediation project; every constraint above is inherited from an already-approved canonical source, applied to this specific component's boundary.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Security, Privacy, and Safety Constraints | D1, D2, Constitution, B3 |

---

# 32. Repository Changes

This specification is authored under a spec-authoring-only mandate (Section 46); nothing below has been implemented by this document. All paths are **candidate paths** — engineering proposals consistent with TASK-004's existing pattern, subject to adjustment at implementation time per the skeleton's own allowance ("engineering may adjust exact filenames only where repository evidence justifies the change without altering architecture or scope").

**New production files (candidate):**
- `js/coachDecisionSystem/initiativeEngine.js` — Stage-6 `generate(request)`, structurally parallel to `recommendationEngine.js`. Its `InitiativeCandidate` output carries no `category` field (Canonical Decision CD-T005-02); no companion categories module is created.

**Modified production files (candidate):**
- `js/coachDecisionSystem/internalPipelineOrchestrator.js` — add Stage-3 detection dispatch and a Stage-6 Initiative-kind dispatch path (analogous to the existing `runForOpportunity` → `RecommendationEngine.generate` wiring).
- `js/coachDecisionSystem/memoryLayer.js` — per Canonical Decision CD-T005-01, a focused extension (not a redesign) to assemble and expose the additional D1 Unit 03 / D2 Stage 2 input categories the Initiative Engine requires: Relationship Maturity signal, Life Event Context, Habit state, Pattern state, and Capacity state (Section 25). The Memory Layer remains the sole owner of Decision Input reads and Pipeline Context Assembly; this extension does not authorize Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation inside the Memory Layer.
- `js/stateAccess.js` — extend the existing `coachDecisionSystem.DECISION_PASS` permission-matrix entry (or add an entry) for the Memory Layer's additional reads backing Relationship Maturity, Life Event Context, and Capacity state (Section 25).
- `js/derivedIntelligenceConsumer.js` — enable `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` in the production-enabled mapping, authorized by Canonical Decision CD-T005-01 solely as part of the Memory Layer extension above (Section 25, Section 36 item A-1, resolved).

**New tests (candidate):** see Section 33 for the full list, following TASK-004's flat `tests/*.test.js` naming pattern.

**Modified tests (candidate):** `tests/internalPipelineOrchestrator.test.js` and `tests/coachDecisionSystemWiring.test.js` would need extension to cover the new Stage-3/Stage-6 dispatch paths.

**Registration/composition changes:** none to the Engine Registry itself (Section 26) — no new `register()` call.

**Documentation changes:** see Section 38.

**Version/cache/service-worker changes where genuinely required:** `index.html` and `sw.js`'s `SHELL` cache list would need the new file(s) added, following the exact pattern TASK-004 already established for the five existing `js/coachDecisionSystem/` files.

**Explicit no-touch areas:** `recommendationEngine.js` and `recommendationCategories.js` are not modified by TASK-005's scope (their existing behavior is reused, not changed). `memoryLayer.js` is no longer a blanket no-touch area: Canonical Decision CD-T005-01 authorizes exactly the focused Pipeline Context extension described above (Relationship Maturity signal, Life Event Context, Habit state, Pattern state, Capacity state) and nothing beyond it — `memoryLayer.js` remains off-limits to any change that would add Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation to the Memory Layer, or that would grant the Initiative Engine a direct StateAccess/DerivedIntelligenceConsumer/Firestore read path. The B4 Persistence Gateway operation catalog is not modified unless a new, separately-approved persistence operation is required (none is identified as necessary by this document); `firestore.rules`, `functions/typedMemoryServerWrite.js`, and `js/memory.js` are not touched (C4's write path is consumed as-is, if at all, not modified).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Repository Changes | TASK-004, B4, C4, Repository |

---

# 33. Test Strategy

## 33.1 Unit Tests
`tests/initiativeEngine.test.js` — pure-function tests of `generate(request)`: valid request → valid Candidate(s); each D1-IP-01 through D1-IP-10 rule individually exercised (e.g., a request that fails the value requirement D1-IP-03 produces zero Candidates); each Relationship-Maturity stage's category gating (D1-IP-02, Section 17.3) individually exercised; deterministic-output test (identical input twice → identical output).

## 33.2 Contract Tests
Request/response shape validation against the `InitiativeRequest`/`InitiativeResult`/`InitiativeCandidate` contract (Section 19); required-field presence; confirms no `category` field is present on `InitiativeCandidate` (Canonical Decision CD-T005-02); rejection of a Candidate missing a statable rationale (D1-RP-02 analog, D1-CDO-02 analog).

## 33.3 Pipeline Integration Tests
End-to-end Stage 3 → Stage 6 flow using a real (or realistic fixture) Pipeline Context from `memoryLayer.js`'s existing shape; confirms the Initiative Engine's output is consumable by the existing Candidate-pool shape TASK-004 already established.

## 33.4 Composite Engine Wiring Tests
Extend `tests/internalPipelineOrchestrator.test.js`: confirm the Orchestrator dispatches Stage-3 detection and Stage-6 generation to the Initiative Engine without introducing a second Engine Registry entry; confirm `run()`'s overall contract (`{status, output: {pipelineContext, candidates}}`) is preserved.

## 33.5 Recommendation/Initiative Separation Tests
Confirm no shared internal state or logic leak between `recommendationEngine.js` and `initiativeEngine.js` (Section 22); confirm each engine's Candidates carry the correct, distinct `kind` value; confirm neither engine's output is influenced by the other's (D3 §8.4/§8.5 "one-directional handoff... never receives ranking feedback").

## 33.6 Safety Boundary Tests
Confirm the Initiative Engine's public interface exposes no disqualification/modification/deferral/blocking function (Section 13 item 6, Section 24); confirm a Candidate is produced normally even when no Safety Layer component exists at this baseline (Section 24, 29).

## 33.7 Memory and State Boundary Tests
Confirm the Initiative Engine never calls StateAccess, DerivedIntelligenceConsumer, or Firestore directly, only consuming the Memory Layer's already-assembled Pipeline Context (Section 25); confirm correct behavior under partial `availability` (Section 14.5). Extend `tests/memoryLayer.test.js` to cover the Canonical Decision CD-T005-01 Pipeline Context extension: Relationship Maturity signal, Life Event Context, Habit state, Pattern state, and Capacity state are each correctly assembled into Pipeline Context, including graceful degradation when any individual read is unavailable, and confirm the extended Memory Layer still performs no Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation.

## 33.8 Silence and No-Candidate Tests
One test per Section 21 category (insufficient evidence, low confidence, poor timing, closed window, trust risk, effort, ignored-initiative repeat, missing context, absolute-override conflict, no useful action) confirming zero Candidates is returned and is distinguishable from a failure.

## 33.9 Failure and Degradation Tests
One test per Section 29 row (invalid input, missing optional/required context, malformed data, conflicting evidence, unavailable dependency, unavailable Safety/Decision components, Candidate validation failure, unexpected exception, unsupported Opportunity type) confirming the correct, non-fabricated outcome.

## 33.10 Regression Tests
Full existing suite (1144/1144 at TASK-004 baseline, Section 10.6) must continue passing unmodified except for the specific extensions listed in Section 32; no pre-existing Recommendation Engine, Memory Layer, or Orchestrator test's assertions should require weakening to accommodate the Initiative Engine.

## 33.11 Native/Platform-Neutral Contract Tests
Confirm `initiativeEngine.js` is Node-loadable with no DOM/`window`/Firebase reference, consistent with D3 §5.5/§14 and C1's existing Pure Domain classification pattern (`c1Wp*Wiring.test.js` precedent).

Every normative behavior, invariant, and acceptance criterion elsewhere in this document maps to at least one subsection above; Section 37's Traceability Matrix makes this mapping explicit per-rule.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 33.1 Unit Tests | D1, Repository |
| 33.2 Contract Tests | D1 |
| 33.3 Pipeline Integration Tests | TASK-004 |
| 33.4 Composite Engine Wiring Tests | Repository |
| 33.5 Recommendation/Initiative Separation Tests | D3 |
| 33.6 Safety Boundary Tests | — |
| 33.7 Memory and State Boundary Tests | — |
| 33.8 Silence and No-Candidate Tests | — |
| 33.9 Failure and Degradation Tests | — |
| 33.10 Regression Tests | TASK-004 |
| 33.11 Native/Platform-Neutral Contract Tests | D3, C1 |

---

# 34. Acceptance Criteria

## 34.1 Product
- Every produced Initiative-kind Candidate satisfies D1-IP-03's value requirement (names at least one of Trust/Motivation/Consistency/Understanding/Relationship/Decision quality).
- No Candidate is ever produced for an engagement/retention motive (D1-IP-04) — verifiable by absence of any engagement/retention-derived field in the Candidate contract or its construction logic.
- Celebratory Candidates are produced only for milestones marked genuine, never routine/small actions (D1-IP-06).

## 34.2 Functional
- Stage-3 detection contribution covers confirmed-pattern anticipation and disruption/milestone detection only (D2 Unit 07); Decision-Window and explicit-statement/action detection are not performed by this engine (Section 9.2, 15.1, 15.7).
- Stage-6 generation applies D1-IP-02's Relationship-Maturity gating correctly at all four stages (Section 17.3, 33.1).
- Zero-Candidate/Silence-compatible output is a first-class, tested outcome, not an error path (Section 21, 33.8).

## 34.3 Pipeline
- The Orchestrator dispatches to the Initiative Engine at Stage 3 and Stage 6 only, never at Stages 1–2, 4–5, or 7–13 (Section 26, 33.4).
- No fabricated Terminal Decision is ever produced when the Decision Engine/Safety Layer are absent (Section 23, 24, 29).

## 34.4 Architecture
- No second Engine Registry entry is created (Section 13 item 10, 26, 33.4).
- The Initiative Engine's public interface exposes no Prioritization/Winner Selection/Decision Formation function (Section 13 items 1–3, 33.6).
- The module is Pure-Domain-shaped per D3 §5.5/§14 (Section 33.11).

## 34.5 Contracts
- Every returned `InitiativeCandidate` conforms fully to the Section 19 contract, including all required fields.
- `InitiativeCandidate` contains no `category` field; classification relies only on `kind`, `opportunitySource`, `action`, `rationale`, `confidence`, `hierarchyTier`, and `opportunityProvenance` (Canonical Decision CD-T005-02, Section 19, 33.2).
- Confidence and hierarchyTier are preserved, not reinvented, once emitted (D2-PP-05, Section 19, 20).

## 34.6 Safety
- No disqualification/modification/deferral/blocking capability exists on the Initiative Engine (Section 13 item 6, 24, 33.6).
- Health/Safety-relevant Pipeline Context fields are read-only for the Initiative Engine's own policy checks, never used to make a safety determination (Section 24, 31).

## 34.7 Memory and State
- No durable write is ever performed by the Initiative Engine (Section 13 item 7, 25, 33.7).
- No direct StateAccess/DerivedIntelligenceConsumer/Firestore call bypasses the Memory Layer — the Initiative Engine itself makes none (Section 25, 33.7).
- The Memory Layer's Pipeline Context extension (Canonical Decision CD-T005-01) assembles exactly the approved categories (Relationship Maturity signal, Life Event Context, Habit state, Pattern state, Capacity state) and performs no Opportunity Detection, Evidence Evaluation, Eligibility Evaluation, Candidate Generation, Prioritization, Winner Selection, or Decision Formation (Section 25, 32, 33.7).

## 34.8 Failure Handling
- Every Section 29 failure category resolves to one of: valid Candidate, deliberate zero-Candidate outcome, or explicit distinguishable failure — never silently converted between the three (Section 29, 33.9).

## 34.9 Testing
- All eleven Section 33 subsections have at least one passing test before this task may be considered for READY (Section 39).
- Full regression suite (Section 33.10) passes unmodified except for documented, intentional extensions.

## 34.10 Documentation
- Section 38's required documentation updates are completed at actual implementation closure, not during specification authoring (Section 38, 45).

Every criterion above is testable or reviewable from repository evidence once implementation exists; none reduces to "works correctly" or "is user friendly."

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| 34.1 Product | D1 |
| 34.2 Functional | D1, D2 |
| 34.3 Pipeline | — |
| 34.4 Architecture | D3 |
| 34.5 Contracts | D2 |
| 34.6 Safety | — |
| 34.7 Memory and State | — |
| 34.8 Failure Handling | — |
| 34.9 Testing | — |
| 34.10 Documentation | — |

---

# 35. Engineering Constraints

- No Product or Architecture invention — every normative rule in this document cites an existing canonical source (Section 3–4).
- No scope expansion beyond Section 9's Functional Scope.
- No unrelated refactoring of `recommendationEngine.js` or `internalPipelineOrchestrator.js`'s existing Recommendation-Engine wiring; no modification to `memoryLayer.js` beyond the focused Pipeline Context extension Canonical Decision CD-T005-01 authorizes (Section 32's explicit no-touch areas).
- No duplicated shared contract where reuse is possible — the Candidate shape (Section 19), Engine Registry entry (Section 26), and StateAccess pattern (Section 25) are all reused, not reinvented.
- Pure-domain separation maintained (Section 14.8, 25, 30).
- Native compatibility maintained (Section 14.8, 25, 30, 33.11).
- Existing coding and module conventions followed (flat `js/coachDecisionSystem/` module pattern, flat `tests/*.test.js` pattern, Section 26/32/33).
- Deterministic behavior required (Section 28).
- Complete automated tests required before READY (Section 33, 34.9, 39).
- No hidden fallback behavior — every failure mode is explicit (Section 29).
- No implementation of TASK-006 (Decision Engine), TASK-007 (UX System), or TASK-008 (Design System) responsibilities (Section 8).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Constraints | TASK-006, TASK-007, TASK-008, Repository |

---

# 36. Pending Decisions, Repository Gaps, and Canonical Conflicts

Per the Specification Authoring Standard's actual taxonomy (`FITME_SPEC_AUTHORING_STANDARD_v1.0.md`, "Pending Decisions, Repository Gaps, and Canonical Conflicts" — five categories: Repository Gap, Product Decision Pending, Architecture Decision Pending, Engineering Decision Pending, Canonical Conflict). This is the classification scheme actually used below; where the approved skeleton's own inline instructions asked for the labels "Product Decision Required" / "Architecture Decision Required" / "Engineering Verification Required," those labels are treated as synonyms of Product Decision Pending / Architecture Decision Pending / Repository Gap respectively and are noted in parentheses for cross-reference. A **Follow-up** is a further closure-level status a Product/Architecture Canonical Closure Decision may apply to a Repository Gap or Architecture/Engineering Decision Pending item: it keeps the item's underlying classification and description intact for future work, while removing it from this specification's READY-blocking set.

### G-1 — Repository Gap (Engineering Verification Required): Precedence of `FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`
This document is not listed in Engineering Workflow §3's Source of Truth ordering, yet the approved skeleton directs its inspection. No content conflict was found with the Coach Bible/Constitution chain. **Blocks READY:** No. **Required resolution:** confirm its precedence position (or non-canonical/contextual status) in a future Engineering Workflow revision.

### G-2 — Repository Gap — **Status: RESOLVED (CD-G2-01)**: Stage-3 ownership of "Explicit User Statements or Actions"
Originally recorded: D1 Unit 05 lists this as a canonical Opportunity source; no canonical source (D1 or D2) assigns its Stage-3 detection to any specific engine. **Resolution:** CD-G2-01 (`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`) confirms Explicit User Statement/Action is a Decision Input and evidentiary signal, not an independent Canonical Opportunity Source — D1 Unit 05's five-item list does not include it, correcting this entry's original characterization — so no Stage-3 detection ownership is owed. **Blocks READY:** No (unaffected — this document was already closed prior to this resolution). **Tracked as future work:** None; this item requires no further Architecture assignment.

### G-3 — Repository Gap — **Status: Follow-up (Canonical Closure Decision)**: Whether Safety-triggered Opportunities ever reach Initiative-kind Candidate Generation
D1-OD-04/D2-EF-01(a) establish unconditional Stage-3 admission and Stage-5 bypass for safety/high-risk Opportunities, but no canonical source states whether such an Opportunity is then routed to the Initiative Engine, the Recommendation Engine, both, or neither at Stage 6. **Blocks READY:** No — reclassified as a Follow-up by the Canonical Closure Decision. **Tracked as future work:** Architecture (AI Architect), for full Stage-6 routing-logic completeness.

### G-4 — Repository Gap — **Status: Follow-up (Canonical Closure Decision)**: Stage-6 routing for Decision-Window-sourced Opportunities
The Recommendation Engine owns Stage-3 Decision-Window detection (D2 Unit 04 Stage 3 Dependencies), but no canonical source states which engine(s) receive a Decision-Window-sourced Opportunity at Stage 6 for Candidate Generation. **Blocks READY:** No — reclassified as a Follow-up by the Canonical Closure Decision. **Tracked as future work:** Architecture (AI Architect), for full Section 22/26 routing-logic completeness.

### G-5 — Repository Gap (Engineering Verification Required): Whether Initiative-kind Candidates receive a nested impact-tier scheme at Stage 7
D1-PR-02's nested impact tiers are described as "recommendation impact tiers" specifically; D2 does not restate an analogous scheme for Initiative-kind Candidates. **Blocks READY:** No — this is a Decision Engine (TASK-006) Stage-7 concern, not a TASK-005 Stage-6 concern, but is recorded here because it affects how `hierarchyTier` (Section 19) should be populated. **Required resolution:** Product/Architecture, at or before TASK-006's specification.

### A-1 — Architecture Decision Pending: Enabling `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` in B5 — **Status: Resolved by Canonical Decision CD-T005-01**
Both were reserved-but-disabled (Section 10.5). D1 CDR-5 states enabling such hooks "requires a future, separately-approved specification revision." Canonical Decision CD-T005-01 is that separately-approved revision: it authorizes enabling `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` in B5's production-enabled mapping, solely as part of the focused Memory Layer Pipeline Context extension (Section 25, Section 32) — not as a standalone enablement and not as a new direct Initiative Engine consumption path. **Blocks READY:** No (resolved). **Historical record:** originally recorded as blocking pending Architecture confirmation of whether SPEC approval itself constituted the required revision; CD-T005-01 supplies that confirmation directly.

### A-2 — Architecture Decision Pending — **Status: RESOLVED, narrowly (RGEF, `docs/specs/RGEF_SPEC_v1.0.md` §5.4/§5.6/§19.1, IMPLEMENTED AND VERIFIED)**: Extending C2's suppression mechanism to an Initiative surface
**Originally recorded:** C2 explicitly scopes `evaluateSuppression()` to the Trigger and Adaptive TDEE surfaces only ("No Recommendation/Initiative/Decision Engine... not built as part of C2"). Section 21's "rejection/suppression feedback from C2 where relevant" cannot be implemented without this extension. Reclassified as a Follow-up by the Canonical Closure Decision, tracked as future Architecture work. **This deferral was correct as originally authored** — no Product/Architecture authority existed at that time for the Initiative Engine to depend on `feedbackDomain.js`, and `initiativeEngine.js` itself, plus an existing passing test, correctly enforced that absence until RGEF. **Resolution (RGEF, narrow):** Head of Product + AI Architect approved exactly one such dependency — `initiativeEngine.js` may depend on `js/feedback/feedbackDomain.js` for exactly its new `evaluateDomainTopicReceptiveness()` capability (Domain/Topic-scoped learned receptiveness, RGEF §18/§19), reusing `RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1` by reference. D1-IP-08's own exact-Opportunity-id check (`wasIgnoredBefore()`) remains local, self-contained, and unchanged by this resolution — it does not call `feedbackDomain.js` and was never moved into it. **This is not blanket permission for any other `FeedbackDomain` capability** (`evaluateSuppression()`/`classifyFeedback()` remain Trigger/Adaptive-TDEE-exclusive) and does not itself implement true `Ignored`-feedback production (still deferred, RGEF-OI-2). **Blocks READY:** N/A (already implemented). **Tracked as future work:** none for this narrow capability; a general, unbounded FeedbackDomain-access grant for the Initiative Engine remains undecided and out of RGEF's scope.

### E-1 — Engineering Decision Pending: Numeric thresholds for confirmed-pattern anticipation
Per D1 Unit 11 Acceptance Criteria and CDR-4, no numeric pattern-window size or confidence cutoff is fixed by D1 for Initiative's confirmed-pattern detection, and none is invented in this document. **Blocks READY:** No — per CDR-4's own process, this is properly raised as a new CDR at implementation time, not resolved during specification authoring. **Required resolution:** raise a new CDR at implementation time (Lead Engineer, subject to whatever approval CDR-raising itself requires).

### E-2 — Engineering Decision Pending — **Status: Resolved for one specific combination only (RGEF, `docs/specs/RGEF_SPEC_v1.0.md` §13, IMPLEMENTED AND VERIFIED); general question otherwise unchanged**: Default behavior when Relationship Maturity Stage is unknown/unreliable
**Originally recorded:** No canonical source states an explicit fallback stage. Section 17.7 records a conservative (Observer-equivalent) default as engineering inference only. **Blocks READY:** No, if the conservative default is accepted as a reasonable implementation choice; **Yes** if Product/Architecture wants this made an explicit rule rather than an inference. **Required resolution:** confirm at Engineering Review, or escalate to Head of Product if the default itself is judged to be a product decision. **Partial resolution (RGEF):** Head of Product approved a closed Source×Reason override admitting exactly one combination — `sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION'` with `validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'` — at every Relationship Maturity Stage including Observer, layered atop (not replacing) the conservative Observer-equivalent default this item originally recorded. **This resolves E-2 only for that one combination** (RGEF's own Open Item RGEF-OI-4). Observer's permitted scope for every other `sourceCategory`/`validReasonCategory` combination remains exactly as undecided as before RGEF — this item otherwise remains open.

### C-1 — Canonical Conflict: TASK-004's "repository hooks" conflict, narrowed by the `INITIATIVE_ENGINE` consumer-id finding
**Conflicting sources:** D1 CDR-5 ("Engineering hooks for the Recommendation, Initiative, and Decision Engines already exist in the codebase but remain disabled") vs. TASK-004 Spec's own repository-inventory finding recorded as a Canonical Conflict ("no such hooks exist... beyond the B5 `RECOMMENDATION_SUPPORT_V1` consumer policy"), now further informed by this document's verified finding that `js/derivedIntelligenceConsumer.js:32` does contain a second, named, disabled `INITIATIVE_ENGINE` consumer-id constant (Section 10.5). **Decision required:** whether D1 CDR-5's "hooks... exist but remain disabled" claim is now considered substantiated (at least for the Initiative Engine specifically) by this additional evidence, or whether the conflict remains open in its original TASK-004 form. **Owner:** AI Architect (this document does not resolve it; it only adds evidence already disclosed in TASK-004's own spec, per Section 10.5's Repository Evidence Note).

A-1 is resolved by Canonical Decision CD-T005-01; the former A-3 is removed by Canonical Decision CD-T005-02 (the `category` field it concerned no longer exists on the contract, per Section 19); G-2, G-3, G-4, and A-2 are reclassified as Follow-ups by the Canonical Closure Decision and no longer block READY, though they remain documented above as future work. No remaining item in this Section is labeled a READY Blocker, and no item is treated as blocking implementation of the portions of Sections 9–33 that do not depend on it.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Pending Decisions, Repository Gaps, and Canonical Conflicts | D1, D2, TASK-004, TASK-006, Constitution, Coach Bible, B5, C2, Spec Authoring Standard, Engineering Workflow, Repository |

---

# 37. Traceability Matrix

| TASK-005 Requirement | Canonical Source (exact section/rule) | Repository Component | Acceptance Criterion | Required Test | Implementation Evidence |
|---|---|---|---|---|---|
| Stage-3 confirmed-pattern anticipation detection | D2 Unit 07 (Initiative Engine Responsibilities); D1 Unit 05, D1-OD-01/02 | (new) `initiativeEngine.js` Stage-3 contribution | 34.2 | 33.1, 33.3 | pending implementation |
| Stage-3 disruption/milestone detection | D2 Unit 07; D1 Unit 05 | (new) `initiativeEngine.js` Stage-3 contribution | 34.2 | 33.1, 33.3 | pending implementation |
| Stage-6 Initiative-kind Candidate Generation authority | D2 Unit 07; D2 Unit 04 Stage 6 | (new) `initiativeEngine.js` `generate()` | 34.2, 34.5 | 33.1, 33.2 | pending implementation |
| Relationship-Maturity gating (D1-IP-02) | D1-IP-02; Constitution §12.2 | (new) `initiativeEngine.js` gating logic | 34.1, 34.2 | 33.1 | pending implementation |
| No Prioritization/Winner Selection/Decision Formation | D2 Unit 07 Forbidden Responsibilities; D3 §6.4, §11.1–§11.3 | (new) `initiativeEngine.js` public interface | 34.4 | 33.6 | pending implementation |
| No engagement/retention-driven initiation (D1-IP-04) | D1-IP-04 | (new) `initiativeEngine.js` value-requirement check | 34.1 | 33.1 | pending implementation |
| No repeating ignored Initiative (D1-IP-08) | D1-IP-08 | `initiativeEngine.js`'s `wasIgnoredBefore()`, local/exact-id, unaffected by A-2 | 34.1 | 33.8 | IMPLEMENTED (TASK-005); A-2 (Domain/Topic-scoped receptiveness, a separate, additive check) narrowly resolved and implemented by RGEF, `docs/specs/RGEF_SPEC_v1.0.md` §19 |
| Single Engine Registry entry preserved | D3 §17 Decision 1; §11.1 | `registerCoachDecisionSystem.js` (unchanged) | 34.4 | 33.4 | already true (TASK-004); must remain true |
| Pipeline Context read-only, Memory-Layer-sourced | D3 §8.1, §11.1, §11.2 | (new) `initiativeEngine.js` input handling | 34.7 | 33.7 | pending implementation |
| No durable write authority | D3 §11.1 | (new) `initiativeEngine.js` (absence of any write call) | 34.7 | 33.7 | pending implementation |
| Candidate contract completeness | Section 19 (derived from D2 CC-02/CC-03 pattern, D1-RP-02, D2-TR-01) | (new) `initiativeEngine.js` output shape | 34.5 | 33.2 | pending implementation |
| Statable rationale or zero Candidates | D1-RP-02; D1-CDO-02 | (new) `initiativeEngine.js` step 7 (Section 20) | 34.5 | 33.2, 33.8 | pending implementation |
| Silence/no-candidate as first-class outcome | D1-SP-01 through D1-SP-06; D2-EF-03/04 | (new) `initiativeEngine.js` (Section 21) | 34.2, 34.8 | 33.8 | pending implementation |
| No fabricated Terminal Decision under Decision-Engine/Safety-Layer absence | D2-EF-06; D3 §12.3 | (new) `initiativeEngine.js`; `internalPipelineOrchestrator.js` | 34.3, 34.8 | 33.9 | pending implementation |
| No safety disqualification capability | D1-AB-05; D3 §11.1–§11.3; Constitution Ch.23 | (new) `initiativeEngine.js` public interface | 34.6 | 33.6 | pending implementation |
| Determinism (identical input → identical output) | D2-TR-01 through D2-TR-06; general pipeline determinism principle | (new) `initiativeEngine.js` (pure function) | 34.9 | 33.1, 33.11 | pending implementation |
| Native/platform-neutral shape | D3 §5.5, §14 | (new) `initiativeEngine.js` (no DOM/window/Firebase ref) | 34.4 | 33.11 | pending implementation |
| Full regression suite unaffected | TASK-004 Closure Record (1144/1144) | entire `tests/` suite | 34.9 | 33.10 | must be re-verified at implementation |
| Pipeline Context extension (Relationship Maturity, Life Event Context, Habit/Pattern/Capacity state) | Canonical Decision CD-T005-01; D1 Unit 03/D2 Stage 2 | `memoryLayer.js` (extended) | 34.7 | 33.7 | pending implementation |
| No `category` field on `InitiativeCandidate`; classification via approved fields only | Canonical Decision CD-T005-02 | (new) `initiativeEngine.js` output shape | 34.5 | 33.2 | pending implementation |

This matrix traces all inherited D1 Initiative Policy rules (D1-IP-01 through D1-IP-10), the applicable D2 Stage Contracts (Stage 3, Stage 6, and the Forbidden Responsibilities in Unit 07), the applicable D3 architecture invariants (§8.5, §11.1–§11.3, §5.5, §14), and TASK-004's integration contracts (Engine Registry entry, Pipeline Context shape, Candidate shape pattern).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Traceability Matrix | D1, D2, D3, TASK-004, Constitution, C2, Repository |

---

# 38. Documentation Updates Required

At implementation closure (not during this specification-authoring phase — see Section 46), the following require updates:

- **`docs/specs/TASK_005_SPEC_v1.0.md`** (this document) — Section 45 (Closure Record) populated; any section whose pending items (Section 36) were resolved during implementation updated to reflect the resolution, per whatever process governs post-READY specification amendment.
- **`docs/roadmap/Roadmap.md`** — TASK-005 status updated from "⏳ PENDING" to reflect actual progress (e.g., READY, DONE) at each real transition, not speculatively.
- **`docs/roadmap/Changelog.md`** — a TASK-005 implementation entry following the same structure as the existing TASK-004 entry (files added/changed, test counts, collaborator count now built out of six).
- **Architecture documentation** (`docs/architecture/FITME_ARCHITECTURE_v1.md`) — only if the implemented repository requires a factual update without changing the approved D3 §17 architecture; a new §22 section analogous to the existing §21 ("TASK-004 — Coach Decision System") would be the expected form, documenting the Initiative Engine's realization as the third of six collaborators.
- **Repository inventories or engineering overview** — only if such documents are active/maintained at implementation time (none beyond the above were identified as requiring updates by this specification's research).

No closure updates are performed during this initial specification-authoring phase, per the skeleton's explicit instruction and the Spec Authoring Standard's Closure Record Requirements ("written once, at actual task closure... left empty until closure actually occurs").

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Documentation Updates Required | D3, TASK-004, Spec Authoring Standard, Roadmap, Changelog |

---

# 39. READY Definition

Per the Spec Authoring Standard's READY Requirements and the skeleton's own list, TASK-005 reaches READY only when:

- Completed canonical expansion — this document, reviewed and accepted as complete by Head of Product and AI Architect.
- Repository evidence review — Section 10's evidence independently re-verified as current at review time (repository state may have changed since this document's authoring commit baseline, `f2c734d`).
- Resolution of all true READY Blockers — every Section 36 item marked "Blocks READY: Yes" resolved by its named owner. (A-1 is resolved by Canonical Decision CD-T005-01; the former A-3 is removed by Canonical Decision CD-T005-02; G-2, G-3, G-4, and A-2 are reclassified as Follow-ups by the Canonical Closure Decision and no longer count toward this condition.)
- Product approval — Head of Product sign-off via Section 41's checklist.
- Architecture approval — AI Architect sign-off via Section 42's checklist.
- Engineering Readiness Review — per Engineering Workflow §4's lifecycle stage of the same name.
- Complete contracts — Section 19's Candidate contract fully closed (no longer contingent on a pending category-taxonomy decision; the `category` field is removed per Canonical Decision CD-T005-02).
- Complete acceptance criteria — Section 34, contingent on the above resolutions being reflected back into it if they change any criterion's shape.
- Complete test strategy — Section 33, contingent on the above.
- No unresolved Product or Architecture decision required for implementation — i.e., no outstanding item in Section 36 whose "Blocks READY" value is "Yes" remains open.

This document does not itself declare TASK-005 READY. Per the Standard: "Marking a specification READY is a Product/Architecture determination made after their review. A specification does not mark itself READY."

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| READY Definition | Spec Authoring Standard, Engineering Workflow, Repository |

---

# 40. DONE Definition

Per the Spec Authoring Standard's DONE Requirements and Engineering Workflow §14's Definition of Done, TASK-005 reaches DONE only when:

- Architecture approved (Section 42).
- SPEC approved / READY (Section 39).
- Engineering Review = READY.
- Implementation complete, matching this approved READY specification.
- All required tests pass (Section 33 in full) and the full regression suite passes (Section 33.10, 34.9).
- Focused engineering review is APPROVED (Section 43, re-performed post-implementation).
- Product and Architecture review is APPROVED (Sections 41–42, re-performed post-implementation).
- Required documentation is updated (Section 38).
- Repository is clean (no stray uncommitted changes).
- Commit and push are complete.
- Closure record is written (Section 45).
- Task marked closed (Engineering Workflow §14's distinct, final step).

This document does not itself declare TASK-005 DONE. DONE is evaluated once, at actual task closure, not populated speculatively during specification authoring.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| DONE Definition | Spec Authoring Standard, Engineering Workflow |

---

# 41. Product Review Checklist

For Head of Product to verify:

- [ ] Initiative Policy fidelity — every D1-IP-01 through D1-IP-10 rule is faithfully represented (Sections 12, 17, 18, 20, 21).
- [ ] Trust and autonomy protection — Trust Test (D1-IE-02), value requirement (D1-IP-03), verify-don't-assume (D1-IP-09), autonomy (Constitution §22.6) correctly bound the engine's behavior (Sections 17, 20, 21, 31).
- [ ] Correct use of evidence — Evidence Hierarchy (D1 Unit 11) and no-manufactured-confidence rules correctly applied (Section 16).
- [ ] Relationship-Maturity behavior — D1-IP-02's four-stage gating correctly scopes category/directness (Section 17).
- [ ] Correct Silence behavior — D1 Unit 10's doctrine correctly instantiated for Initiative specifically (Section 21).
- [ ] No engagement-driven initiative — D1-IP-04 and the Canonical Decision Hierarchy's Product-Engagement-last ranking are respected throughout (Sections 8, 13, 31).
- [ ] No Product scope invention — nothing in this document introduces coaching content, category taxonomy, or behavioral policy beyond what D1/Constitution/Coach Bible already fix (flagged pending items in Section 36 are correctly left open, not invented).
- [ ] Objective acceptance criteria — Section 34.1 is testable/reviewable, not vague.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Product Review Checklist | D1, Constitution, Coach Bible |

---

# 42. Architecture Review Checklist

For AI Architect to verify:

- [ ] Component boundary fidelity — the Initiative Engine's boundary matches D3 §8.5 and §11.2 exactly (Sections 12, 26).
- [ ] Composite Engine integration — no second Engine Registry entry; internal collaborator only (Sections 13, 26, 33.4).
- [ ] Pipeline-stage ownership — Stage 3 contribution and Stage 6 ownership match D2 Unit 07 exactly, including the Decision-Window exclusion (Sections 9, 12, 15.1).
- [ ] Recommendation/Initiative separation — no rule leakage, no cross-engine dependency (Section 22).
- [ ] Decision Engine boundary — no Prioritization/Winner Selection/Decision Formation absorbed (Sections 13, 23).
- [ ] Safety boundary — no bypass, no disqualification capability (Section 24).
- [ ] Memory/state/persistence boundary — no durable write authority, no direct StateAccess bypass of the Memory Layer (Section 25).
- [ ] Deterministic and platform-neutral design — Section 28, 30, 33.11.
- [ ] No forbidden independent registration or delivery ownership — Sections 13, 26.
- [ ] All Architecture-owned Section 36 items reviewed: confirm A-1's resolution by Canonical Decision CD-T005-01, the former A-3's removal by Canonical Decision CD-T005-02, and G-2/G-3/G-4/A-2's reclassification as Follow-ups by the Canonical Closure Decision are all correctly reflected throughout (G-5 remains non-blocking under its original classification, unaffected by this decision).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Architecture Review Checklist | D2, D3 |

---

# 43. Engineering Self-Review Checklist

Completed by Claude Code (Lead Engineer) before submitting this document:

- [x] Every one of the skeleton's 47 sections is present and completed (no section skipped, merged, split, reordered, or renamed).
- [x] Every repository claim in Section 10 is evidenced — verified directly via `git log`, `Grep`, and `Glob` against the live repository at commit `f2c734d`, in addition to the six research agents' independently-verified findings.
- [x] No section introduces an unauthorized Product, AI-behavior, architecture, authority-boundary, or scope decision — every normative statement cites an existing canonical source; every place this document could not find canonical support is flagged per Section 36's taxonomy rather than filled by inference presented as fact.
- [x] All pending items are classified using the Spec Authoring Standard's actual five-category taxonomy (Section 36), with the skeleton's alternate phrasing cross-referenced for compatibility.
- [x] All normative rules identified in this document map to at least one required test (Section 33, Section 37's Traceability Matrix).
- [x] All acceptance criteria (Section 34) are objective and reviewable from repository evidence once implementation exists; none reduces to a vague standard.
- [x] Cross-section terminology and contracts are consistent — the `InitiativeCandidate` contract (Section 19) is referenced identically in Sections 20–29, 32–34, 37; the Decision-Window ownership distinction (Section 9.2) is restated consistently in Sections 15.1, 22, 26, 36 rather than contradicted anywhere.
- [x] No implementation was performed — no production or test code was written, edited, or executed as part of authoring this document.
- [x] No repository files were edited except this specification file (`docs/specs/TASK_005_SPEC_v1.0.md`); all repository inspection was read-only (`git log`, `Grep`, `Glob`, and delegated read-only research agents).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Self-Review Checklist | Spec Authoring Standard, Repository |

---

# 44. Engineering Handoff

- **File created or updated:** `docs/specs/TASK_005_SPEC_v1.0.md` (created).
- **Repository files inspected:** all documents listed in Section 3.1, plus direct, verified inspection of `js/coachDecisionSystem/*.js` (all five files), `js/stateAccess.js` (lines 403–408), `js/derivedIntelligenceConsumer.js` (lines 32, 36), `js/app.js` (line 2), the `tests/` directory listing, and `git log` for the current branch/commit baseline.
- **Repository baseline:** branch `main`, commit `f2c734d40e0adbb700f863694f47e7d075f5c5cf` (2026-07-29), `APP_VERSION '2.41.0'`, test baseline 1144/1144 (per TASK-004 Closure Record, not independently re-run by this specification-authoring activity).
- **Concise summary of specification coverage:** all 47 skeleton sections expanded using only D1/D2/D3/TASK-004/B1–B5/C1–C4/Constitution/Product Bible/Coach Bible/Coach KB/Intelligence & Relationship Philosophy content, with every normative statement cited to its exact source. The central architectural finding carried consistently throughout is that Decision-Window Opportunity detection at Stage 3 belongs to the Recommendation Engine, not the Initiative Engine, which instead owns confirmed-pattern anticipation and disruption/milestone/recovery-support detection at Stage 3 and full Initiative-kind Candidate Generation at Stage 6.
- **All Repository Gaps:** G-1 through G-5 (Section 36).
- **All Product Decisions Required:** none identified as strictly blocking, and E-2 (if Product wants the Relationship-Maturity-unknown default made an explicit rule).
- **All Architecture Decisions Required:** none remain blocking. A-1 is resolved by Canonical Decision CD-T005-01 (Section 25, 32, 36). The former A-3 is removed by Canonical Decision CD-T005-02 — `InitiativeCandidate` carries no `category` field, so no category-taxonomy decision remains to make (Section 19, 36). A-2 is reclassified as a Follow-up by the Canonical Closure Decision (Section 36) — documented as future work, not a blocking Architecture Decision.
- **All Engineering Decisions Pending:** E-1, E-2 (Section 36).
- **All Canonical Conflicts:** C-1 (Section 36) — additional evidence bearing on a conflict TASK-004 already recorded, not a newly discovered conflict.
- **All Follow-ups:** G-2, G-3, G-4, and A-2 (Section 36), reclassified from Repository Gap / Architecture Decision Pending by the Canonical Closure Decision; each remains documented as future work and no longer blocks READY.
- **Proposed READY verdict:** Following the Canonical Closure Decision, no item in Section 36 remains marked "Blocks READY: Yes" (G-2, G-3, G-4, and A-2 are reclassified as Follow-ups; A-1 is resolved by CD-T005-01; the former A-3 is removed by CD-T005-02). This document does not itself declare TASK-005 READY — per Section 39, that remains a Product/Architecture determination made through the Engineering Readiness Review process, which this specification-editing activity does not perform.
- **Confirmation that no code or unrelated documentation was changed:** confirmed — only `docs/specs/TASK_005_SPEC_v1.0.md` was created/modified during this activity; all repository inspection was read-only.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Engineering Handoff | D1, D2, D3, TASK-004, Constitution, Coach Bible, Product Bible, B1, B5, C1, C4, Repository |

---

# 45. Closure Record

Written at actual task closure (2026-08-02), per Approvals below.

- **Final status**: DONE / CLOSED.
- **Implementation summary**: `js/coachDecisionSystem/initiativeEngine.js` (new) implements the Initiative Engine — Stage-3 detection contribution (confirmed-pattern anticipation from real Habit/Pattern signals; disruption/milestone detection, currently yielding zero Opportunities given no repository data source for either) and Stage-6 `generate()` (D1 Unit 09 in full: value requirement, celebration restraint, no-repeat-ignored, Relationship-Maturity gating). `js/coachDecisionSystem/memoryLayer.js` extended per Canonical Decision CD-T005-01 (Habit/Pattern state via a second B5 `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` read; Life Event Context and Capacity State reported honestly `UNAVAILABLE`, no repository source existing for either; Relationship Maturity reported `UNKNOWN` pending an approved Product/Architecture-defined source — see Lessons below). `js/coachDecisionSystem/internalPipelineOrchestrator.js` extended with `runForInitiativeOpportunity`/`detectInitiativeOpportunities` (existing `run`/`runForOpportunity` unchanged). `js/derivedIntelligenceConsumer.js` enables `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` (B5 §19.3's reserved-but-undefined pair; concrete policy values are Engineering-authored provisional logic mirroring `RECOMMENDATION_SUPPORT_V1`'s shape, CDR candidate). `index.html`/`sw.js` updated with the new file. `recommendationEngine.js`/`recommendationCategories.js` untouched, reused as-is (only `hierarchyTierForSource`/`isValidOpportunitySource` — D1 Unit 05 source vocabulary, never the Recommendation Category taxonomy). No `js/stateAccess.js` change was required (every read reuses an already-granted permission). No `APP_VERSION` change.
- **Tests and results**: 68 new/changed tests across `tests/initiativeEngine.test.js` (new, 47 tests) and extensions to `tests/memoryLayer.test.js`, `tests/internalPipelineOrchestrator.test.js`, `tests/coachDecisionSystemWiring.test.js`, `tests/derivedIntelligenceConsumer.test.js`; full suite **1212/1212 passing** (TASK-004 baseline 1144/1144 unchanged and still passing).
- **Approvals**: Canonical Review, Product Approval, Architecture Approval, and Engineering Review — all APPROVED, via the TASK-005 Canonical Closure directive; approval was communicated directly, not derived or self-certified by Engineering.
- **Documentation updates**: this specification (Section 1 Status, this Closure Record); `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md` (new §22). Engineering Workflow, Product Bible, AI Constitution, Coach Bible, Coach Knowledge Base, and D1/D2/D3 reviewed and intentionally left unchanged.
- **Commit hash**: the single commit introducing this implementation and this Closure Record (this file cannot self-reference its own resulting hash — see `git log -1 -- docs/specs/TASK_005_SPEC_v1.0.md` after this commit, following the same disclosure TASK-004's own Closure Record used).
- **Branch and push status**: committed to `main` and pushed to `origin/main`.
- **Remaining non-blocking Follow-ups** (tracked, not decided or scheduled here; none expand TASK-005's own scope):
  - G-2, G-3, G-4, A-2 (Section 36) remain open Follow-ups, unchanged by implementation — explicit-statement/action Stage-3 ownership, Safety-triggered and Decision-Window Stage-6 routing, and the C2 suppression-mechanism extension to an Initiative surface are all still unassigned; `initiativeEngine.js` conservatively excludes `SAFETY_HIGH_RISK` and `DECISION_WINDOW` from Stage-6 construction rather than assign either to itself (a focused code-review correction confirmed and hardened this exclusion — see Lessons below).
  - E-1 (Section 36): the `INITIATIVE_SUPPORT_V1` B5 policy's concrete threshold values, and the Stage-3 confirmed-pattern-anticipation lifecycle gate, remain Engineering-authored provisional logic pending a future CDR.
  - E-2 (Section 36): an unknown/unreliable Relationship Maturity signal is treated at least as conservatively as Observer by the Initiative Engine, per the existing Engineering Interpretation — unchanged.
  - No approved Relationship Maturity source exists anywhere in the repository (new Repository Gap, surfaced during code review): `memoryLayer.js` reports `relationshipMaturity.stage: 'UNKNOWN'` unconditionally rather than deriving it from generic feedback-event or Habit/Pattern signal counts, which a focused code-review correction found to be an unapproved Product/Coaching policy decision, not an engineering detail. Defining an approved source is Product/Architecture-owned future work.
  - No repository data source exists for Life Event Context, Capacity State, or calendar/milestone/setback events — all reported honestly `UNAVAILABLE`/empty rather than fabricated; adding such sources is future work, tracked but not scoped here.
  - C-1 (Section 36): the TASK-004-recorded Canonical Conflict about repository hooks remains open, AI-Architect-owned, unaffected by this closure.
- **Lessons Learned**: (1) A focused code review after initial implementation found four issues — an invented Relationship Maturity evidence-count heuristic (removed, replaced with honest `UNKNOWN`, no replacement heuristic), `DECISION_WINDOW` incorrectly accepted at Stage 6 (removed — G-4 is a Follow-up, not an Engineering routing decision), `SAFETY_HIGH_RISK` handling under-documented as a policy-driven Silence rather than an out-of-contract exclusion (comments and tests corrected), and comments overstating the reused `recommendationCategories.js` mapping's status as a canonical/shared contract (reworded to state plainly it is TASK-004's own provisional mapping, reused unmodified, still a CDR candidate). All four were corrected in a single focused pass with no Product/Architecture decision introduced. (2) As with TASK-004, no `APP_VERSION` bump was performed — no existing engine's runtime behavior changed, and a version bump is left to a future release act.

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Closure Record | Spec Authoring Standard |

---

# 46. Global Forbidden Changes

This specification, and any implementation performed under it, is explicitly prohibited from:

- Writing implementation code during specification authoring — none was written for this document.
- Changing Product behavior — no D1/Constitution/Coach Bible/Product Bible rule was altered; every behavioral rule cited above is quoted or paraphrased from an existing approved source.
- Changing canonical architecture — D3 §17's six-collaborator Composite Engine shape is preserved exactly; no seventh collaborator, no new orchestration authority, no redesign proposed.
- Adding new engines or pipeline stages — none added; the 13-Stage Canonical Pipeline (D2) is unchanged.
- Moving authority between components — every ownership assignment in this document matches D2 Unit 07/D3 §11 exactly.
- Implementing Decision, Expression, UX, notification, or Design System scope — explicitly excluded (Section 8).
- Adding engagement/retention objectives — explicitly prohibited throughout (Sections 8, 13, 31).
- Inventing evidence thresholds — explicitly declined; numeric thresholds are recorded as Engineering Decision Pending (Section 16, 36 item E-1), not invented.
- Treating AI inference as authoritative memory — explicitly prohibited (Section 13 item 8, 25).
- Bypassing Safety — explicitly prohibited (Section 13 item 6, 24).
- Introducing browser-only domain dependencies — explicitly prohibited (Section 14.8, 25, 30).
- Changing unrelated files — none changed; only this specification file was created (Section 43, 44).
- Declaring Product or Architecture approval on its own — explicitly declined (Sections 39, 40, 44's proposed-not-final READY verdict).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Global Forbidden Changes | D1, D2, D3, Constitution, Coach Bible, Product Bible |

---

# 47. Specification Authoring Instructions for Claude Code — Compliance Record

The skeleton's instructions to Claude (§47) were followed as follows:

1. **Inspected the current repository and every relevant canonical source before writing conclusions** — six parallel research passes covering all documents in Section 3.1, plus direct `git log`/`Grep`/`Glob` verification of the live repository, completed before this document's drafting began.
2. **Distinguished canonical requirements from repository facts and engineering proposals** — canonical requirements are cited to D1/D2/D3/Constitution/etc.; repository facts are cited to exact file paths and line numbers (Section 10); engineering proposals (candidate file paths, candidate test names) are explicitly labeled "candidate" throughout (Sections 19, 26, 32).
3. **Cited exact files, sections, rules, symbols, and tests wherever possible** — done throughout; see in particular Sections 10, 15–28, 37.
4. **Preserved all approved decisions from D1, D2, D3, and TASK-004** — no decision from any of these four sources was reopened, altered, or contradicted; the one nuance surfaced (Decision-Window detection ownership) is a faithful reading of D2's existing text, not a reopening of it.
5. **Classified unresolved matters using the approved taxonomy** — Section 36 uses the Spec Authoring Standard's actual five-category taxonomy, cross-referenced against the skeleton's alternate phrasing.
6. **Avoided inventing Product or Architecture decisions** — every gap found is recorded as a gap (Section 36), never silently resolved.
7. **Wrote one complete specification rather than a partial draft** — all 47 sections are fully expanded; none is a placeholder.
8. **Performed an Engineering Self-Review before returning the file** — Section 43.
9. **Stopped after specification authoring and reporting** — no implementation, closure documentation, commit, or push was performed as part of this activity.
10. **Did not implement code, update closure documentation, commit, or push** — confirmed (Section 44).

**Authority Matrix**

| Requirement / Decision | Canonical Source |
|---|---|
| Specification Authoring Instructions for Claude Code — Compliance Record | D1, D2, D3, TASK-004, Constitution, Spec Authoring Standard, Repository |

---

# End of Specification
