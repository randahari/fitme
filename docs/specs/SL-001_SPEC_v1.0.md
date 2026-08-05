# SL-001_SPEC_v1.0.md

> **Status:** DONE / CLOSED — implemented, tested, reviewed, approved, and closed (2026-08-05). Product Review and Architecture Review (READY-stage) and Final Product Verification and Final Architecture Verification (DONE-stage) all APPROVED, per `[SAS, READY/DONE Requirements]`, communicated directly and not self-certified by Engineering. See §36 Closure Record.
> **Authority:** Head of Product + AI Architect (approval authority); Lead Engineer / Canonical Specification Author (authoring, per FITME Specification Authoring Standard v1.1 and the approved SL-001 Gold Skeleton v1.0)
> **Governing Standard:** `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`
> **Authoring Skeleton:** SL-001_SPEC_SKELETON_GOLD_v1.0 (approved, non-repository working artifact)
> **Authorizing Decision:** `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (v2.6, Closed) — all fifteen Required Canonical Decisions (RCD-01 through RCD-15) RESOLVED. RCD-15 (RG-3 Resolution — Decision-Level Modification for Tied-Set Terminal Decisions) additively resolves Ch.27/§31's RG-3; see Ch.27 and §31 below.
> **Work Item:** SL-001 — Safety Layer, a standalone canonical Work Item, architectural prerequisite before TASK-007 (RCD-01)
> **Repository baseline:** `main`, commit `67ce25b` ("docs: sync SLDP v2.5 — integrate RCD-12/13/14 and resolve GAP-14/GAP-15")

---

## Canonical Source Index

| Abbreviation | Document |
|---|---|
| AIC | AI Constitution v1.0 — `docs/constitution/FITME_AI_Constitution_v1.0.md` |
| PB | Product Bible — `docs/product/Product_Bible.md.docx` |
| CB | Coach Bible — `docs/governance/FITME_Coach_Bible.md` |
| ARCH | FITME Architecture v1 — `docs/architecture/FITME_ARCHITECTURE_v1.md` |
| EW | Engineering Workflow v1.0 — `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` |
| SAS | Specification Authoring Standard v1.1 — `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` |
| SLDP | Safety Layer Canonical Decision Package v2.6 — `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| D1 | D1 Spec v1.0 — `docs/specs/D1_SPEC_v1.0.md` |
| D2 | D2 Spec v1.0 — `docs/specs/D2_SPEC_v1.0.md` |
| D3 | D3 Spec — `docs/specs/D3_SPEC.md` |
| T004 | TASK-004 Spec v1.0 — `docs/specs/TASK_004_SPEC_v1.0.md` |
| T005 | TASK-005 Spec v1.0 — `docs/specs/TASK_005_SPEC_v1.0.md` |
| T006 | TASK-006 Spec v1.0 — `docs/specs/TASK_006_SPEC_v1.0.md` |
| RM | Roadmap — `docs/roadmap/Roadmap.md` |
| CL | Changelog — `docs/roadmap/Changelog.md` |

No source outside this table is cited anywhere in this document. The Coach Knowledge Base and the Intelligence & Relationship Philosophy document are intentionally absent — confirmed non-authoritative (`[D1 Unit 02]`, `[SLDP RCD-07]`) and rank-undecided-but-uncited-here (`[SLDP GAP-10]`) respectively.

---

# 1. Document Metadata

**Title:** SL-001 — Safety Layer Specification, v1.0 (Draft).
**Type:** Task Specification, governed by SAS; not a Decision Package, not an implementation document.
**Lifecycle stage:** DONE / CLOSED, per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed), all stages complete. Authored and Canonically synchronized with SLDP v2.6 (RCD-01 through RCD-15); READY reached via Product Review and Architecture Review (Chapter 34); DONE reached via Final Product Verification and Final Architecture Verification (§36 Closure Record) — both communicated directly to Engineering, not self-certified.
**Precedence:** Per the confirmed 8-item order (`[SLDP RCD-07]`: AI Constitution → Product Bible → Coach Bible → Architecture → Engineering Workflow → Task Specifications → Roadmap → Changelog), this document sits at rank 6, subordinate to every document above it, and to SAS for authoring-format questions (Chapter 4).
**Version:** v1.0 (Draft — first authored version of the SL-001 SPEC, filed to the repository and synchronized with SLDP v2.5's RCD-12, RCD-13, and RCD-14, additively extended by SLDP v2.6's RCD-15; `[T006 §38, G-6]`: "a future, separately-scoped Safety Layer task... implementing the port defined at Section 21.8").
**Authoring baseline:** repository `main`, commit `67ce25b`, additively synchronized with RCD-15 (SLDP v2.6) in a subsequent documentation update (this update; not yet committed as of this text).

---

# 2. Purpose

This SPEC formalizes the Safety Layer already architecturally reserved by `[D1-AB-05]`, `[D2 Unit 07]`, `[D3 §6/§11]`, and the existing, policy-free `SafetyIntegrationPort` (`[T006 §21.8]`). It formalizes all fifteen Required Canonical Decisions approved in SLDP:

- **RCD-01** — SL-001's own standalone designation (this document's authorizing basis).
- **RCD-02, RCD-09, RCD-10, RCD-12** — the Safety Decision Matrix's closed dimension vocabularies, concrete derivation, and the deterministic ordered disposition predicates (Chapters 15–16).
- **RCD-03, RCD-11, RCD-13** — the closed `reasonCode` catalogue and the complete `reasonCode`/`reasonDetail` wire contract (Chapters 17–18, 25–26).
- **RCD-04** — the meaning of `ESCALATED` (Chapter 19).
- **RCD-05** — the relationship among Constitutional Evaluation, Health Layer, and the Safety Layer (Chapter 8).
- **RCD-06, RCD-07** — documentation synchronization and canonical precedence, both already executed and confirmed (Chapters 1, 4, 5).
- **RCD-08** — the single-event safety bypass criteria (Chapters 14, 26, 27).
- **RCD-14** — the Canonical Safety Rule as the runtime unit of evaluation, its per-Rule derivation and disposition sequencing, the same-disposition tie-break, and `secondaryReasonCodes` scope (Chapters 15–16, 18, 26).
- **RCD-15** — Decision-Level Modification: how the `MODIFIED` disposition interacts with a tied-set Terminal Decision, resolving RG-3 (Chapter 27, §31).

This SPEC originates no Product or Architecture content beyond what these fifteen decisions already fix (`[SLDP Ch.10]`).

---

# 3. Scope

## SPEC Defines
- The Safety Layer's responsibilities at its three fixed checkpoints (`[D2 Unit 07]`).
- The Safety Decision Matrix's four closed-enum dimensions, their concrete derivation, and the deterministic ordered disposition predicates (RCD-02, RCD-09, RCD-10, RCD-12).
- The Canonical Safety Rule as the runtime unit of evaluation, its per-Rule derivation and cross-Rule disposition sequencing, and the complete same-disposition tie-break (RCD-14).
- The closed `reasonCode` catalogue and the complete `reasonCode`/`reasonDetail` wire contract, including `secondaryReasonCodes` scope (RCD-03, RCD-11, RCD-13, RCD-14).
- The closed meaning of `ESCALATED` (RCD-04) and the Safety Layer/Constitutional-Evaluation/Health-Layer relationship (RCD-05).
- Conformance requirements for the existing `SafetyIntegrationPort` contract (`[T006 §21.8]`, cited per `[SAS, Contract Documentation Rules]`), extended additively per RCD-13.

## SPEC Does NOT Define
- Engineering implementation (module boundaries, file names, algorithms) — `[SAS, Forbidden Authoring Practices]`; `[EW §5–6]`.
- Expression's rendering of `BOUNDARY`/`MODIFIED` Terminal Decisions (Chapter 19, Chapter 33).
- Any UI/UX treatment of safety-driven output — no canonical source addresses this.
- A migration mapping from the historical free-text `reason` field's values to the closed `reasonCode` catalogue — `[SLDP RCD-13.E]` found none is required for SL-001, since no live Safety Layer implementation currently persists or emits historical Safety results (Chapter 17).
- The interaction between a `MODIFIED` Safety disposition and the narrow multi-option (tied-set) Terminal Decision exception — `[AUTHORING PLACEHOLDER — Repository Gap: no canonical source addresses this interaction; not resolved by RCD-12, RCD-13, or RCD-14]` (Chapter 27, Chapter 31).
- The concrete failure-detection, retry, and logging mechanism behind Chapter 28's failure modes — `[AUTHORING PLACEHOLDER — Engineering Decision Pending: left open by D2-EF-06 itself; not resolved by RCD-12, RCD-13, or RCD-14]` (Chapter 28, Chapter 31).

---

# 4. Authority

Per `[EW §2]`: "Ran — Product Owner (final business decisions). ChatGPT — Product Lead, AI Architect, Specification Owner, QA & Documentation. Claude — Lead Engineer (implementation only)." Per `[EW §5]`, ChatGPT's responsibilities include "Architecture / Product decisions / SPEC / Engineering Review / Code Review / Documentation / Prompt design"; Claude's include "Code implementation / Tests / Bug fixes / Refactoring only if approved."

Per `[SAS, Authority and Decision Boundaries]`, this document distinguishes exactly four kinds of contribution: **Head of Product decisions** (product intent, philosophy, scope, coaching content), **AI Architect decisions** (architecture, runtime placement, ownership, integration), **Lead Engineer responsibilities** (implementation-adjacent specification detail, repository evidence, test strategy, gap reporting — strictly inside boundaries already set), and **repository evidence** (facts about current code state). Where a section would otherwise require Engineering to decide behavior, ownership, or architecture, it is recorded as open (Chapter 31) instead.

This document does not become READY, DONE, or Canonical on its own authority (`[SAS, READY/DONE Requirements]`); those determinations are made respectively at Chapter 34 (Product/Architecture Review) and at actual implementation closure (Chapter 35, DONE Requirements, out of this document's own scope).

---

# 5. Canonical Dependencies

The canonical-source index for this document is the Canonical Source Index table above. Every citation in every chapter below resolves to an entry in that table; no chapter cites a source absent from it, and no chapter's citations are omitted from it.

Per `[SLDP RCD-07]`, the confirmed canonical precedence order is: 1. AI Constitution, 2. Product Bible, 3. Coach Bible, 4. Architecture, 5. Engineering Workflow, 6. Task Specifications, 7. Roadmap, 8. Changelog. The Coach Knowledge Base is confirmed non-authoritative and is intentionally absent from the index above. The Intelligence & Relationship Philosophy document's precedence rank remains undecided (`[RM]`) and is not cited by any chapter of this document, consistent with `[SLDP GAP-10]`'s own finding that it "is not cited as evidence anywhere in the Safety Layer material reviewed" — this remains true of this SPEC as well.

---

# 6. Repository Sources

**Repository/application version at authoring baseline:** app version last recorded at `2.17.1` per `[ARCH §18]`, with the Coach Decision System's own module set most recently extended by TASK-006 (`[CL, TASK-006 entry]`). No production code change has occurred since TASK-006's closure; only documentation commits (`5aa059f` through `67ce25b`) have landed, the latest of which synchronizes RCD-12, RCD-13, and RCD-14 into the repository copy of the Safety Layer Canonical Decision Package.

**Module inventory relevant to the Safety Layer:** `js/coachDecisionSystem/safetyIntegrationPort.js` — defines the `SafetyIntegrationPort` interface/contract only; "contains no Safety Layer policy logic of its own" (`[ARCH §23]`). `tests/fixtures/safetyIntegrationPortTestDouble.js` — a deterministic test-only double, "confirmed by a dedicated regression test to be unreachable from any production module" (`[T006 §21.8]`, `[ARCH §23]`).

**Composition/entry points:** the port is called by `js/coachDecisionSystem/winnerSelection.js` (Stage 8, `disqualify()`) and `js/coachDecisionSystem/decisionFormation.js` (Stage 9, `finalReview()`), both internal collaborators of the single registered `coachDecisionSystem` Composite Engine (`[D3 §6.1]`; `[T006 §21.1–21.3]`).

**Test count:** "full suite 1318/1318 passing" as of TASK-006's closure (`[CL, TASK-006 entry]`); unchanged since, as no production code has been modified.

**Current runtime flow:** no live Safety Layer implementation exists behind the port; per `[T006 §21.7]`, "the Decision Engine cannot complete Stage 8's disqualification pass or Stage 9's final review without a real Safety Layer implementation behind the Safety Integration Port... in production."

This snapshot is retaken, not edited in place, if substantial time passes before implementation (`[SAS, Repository Evidence Requirements]`).

---

# 7. Canonical Terminology

This document adopts unaltered every term `[T006 §11]` already fixes: **Opportunity**, **Eligibility**, **Candidate**, **Recommendation-kind Candidate**, **Initiative-kind Candidate**, **Full Candidate set**, **Ranking**, **Canonical Decision Hierarchy tier**, **Recommendation impact tier**, **Winner**, **Permitted tied set**, **Decision Pass**, **Internal Silence outcome**, **Decision-Pass-level Silence**, **Canonical Decision**, **Terminal Decision**, **Boundary**, **Refusal**, **Escalation**, **Deferral**, **Safety disqualification**, **Rationale**, **Confidence**, **Pipeline Context**, **Delivery Intent**.

Terms specific to this document, defined only by already-approved canon:

- **Safety Layer** — the single architectural enforcement layer realizing `[D2 Unit 07]`'s cross-cutting role at three checkpoints; not separate from, but the enforcement point for, AIC Ch.11's Constitutional Evaluation (defines policy) and AIC Ch.17's Health Layer (supplies safety context) (`[SLDP RCD-05]`).
- **Safety Decision Matrix** — the deterministic, ordered-rule evaluation (RCD-02, RCD-09, RCD-10, RCD-12) taking Risk Type, Evidence Confidence, Correctability, and Urgency as inputs and producing exactly one of the five dispositions as output. Not a Cartesian lookup table; not a numerical severity score (`[SLDP RCD-12]`).
- **Canonical Safety Rule** — the runtime unit of Safety Layer evaluation (`[SLDP RCD-14]`): the concrete Safety Issue already referenced, but not itself defined, by RCD-12. There is no runtime entity named "Primary Safety Conflict"; `RiskType` and `reasonCode` are not themselves the runtime unit of evaluation. Each matched Canonical Safety Rule is evaluated independently and produces its own Candidate Disposition (Chapter 15, Chapter 16).
- **`reasonCode`** — the closed, canonical, machine-readable classification of why a disposition was selected (`[SLDP RCD-03, RCD-11, RCD-13]`).
- **`reasonDetail`** (`SafetyReasonDetail`) — an optional, structured, non-authoritative elaboration of a `reasonCode`, containing only `secondaryReasonCodes` (`[SLDP RCD-03, RCD-11, RCD-13.B]`).
- **Single-event safety signal** — an event bypassing the ordinary pattern-based evidence requirement (`[D1-OD-04]`) because it independently qualifies under `[SLDP RCD-08]`'s closed criteria list (Chapter 14, Chapter 27).
- **`INSUFFICIENT`** — the sentinel value a Safety Decision Matrix dimension takes when it cannot be derived from approved canonical evidence (`[SLDP RCD-10, RCD-12]`); distinct from, and not interchangeable with, `[T006 §14.12.1]`'s `NO_SIGNAL` sentinel, which governs a different contract (Decision Engine arbitration metadata).

---

# 8. Architectural Position

The Safety Layer is one of six internal collaborators of the single registered `coachDecisionSystem` Composite Engine (`[D3 §6.1]`, Decision 1) — never independently registered, never a second orchestration authority. Per `[D3 §6.3]`: "Safety Layer — architectural realization of D2 Unit 07's cross-cutting Safety Layer role, exercised at three checkpoints." The **Internal Pipeline Orchestrator** sequences D2 Stage execution across all six collaborators; per `[D3 §6.1]`, it is "not a seventh collaborator with decision content authority... not independently registered, and not a second orchestration authority."

Per `[D3 §6.4]`'s Responsibility Matrix: the Safety Layer's "Owns (D2 Stages)" column reads "Cross-cutting checks at Stages 3, 8, 9"; its "Does Not Own" column reads "Ordinary (non-safety) Recommendation/Initiative content." Per `[ARCH §23]`, the production realization of this checkpoint boundary is `js/coachDecisionSystem/safetyIntegrationPort.js`.

**RCD-05 (relationship to Constitutional Evaluation and Health Layer):** per `[SLDP RCD-05]`, "Constitutional Evaluation, Health Layer, and Safety Layer are NOT separate safety engines. Constitutional Evaluation defines policy. Health Layer provides safety context. Safety Layer is the single architectural enforcement layer." AIC Ch.11's "Constitutional Evaluation," Ch.17's "Health Layer," and Ch.23's "Safety Layer" are three roles within one architecture, not three competing gates; this document (SL-001) need only account for the three D2/D3 checkpoints already fixed (Chapter 14) — no additional filtering logic from AIC Ch.11 or Ch.17 is separately specified here.

---

# 9. Pipeline Placement

Per `[D2 Unit 03]`'s 13-stage Canonical Pipeline: "Receive Inputs → Context Assembly → Opportunity Detection → Evidence Evaluation → Eligibility Evaluation → Candidate Generation → Prioritization → Winner Selection → Decision Formation → Expression → Feedback Processing → Evidence Update → Memory Update." The Safety Layer participates at exactly three of these thirteen Stages:

- **Stage 3 (Opportunity Detection):** "Contributed to by the Recommendation Engine, Initiative Engine, and Safety Layer" (`[D2 Unit 03, Stage 3]`).
- **Stage 8 (Winner Selection):** "Orchestration authority: Decision Engine, subject to Safety Layer disqualification authority" (`[D2 Unit 03, Stage 8]`).
- **Stage 9 (Decision Formation):** "subject to the Safety Layer's final, non-bypassable evaluation (D1-AB-05)" (`[D2 Unit 03, Stage 9]`).

Per `[D3 §9]`'s sequence diagram, these three handoffs are sequenced as: `SAF-->>RL: safety-triggered Opportunity injection (Stage 3)`; `DL->>SAF: candidates for disqualification check` / `SAF-->>DL: disqualification result`; `DL->>SAF: Terminal Decision for final review` / `SAF-->>DL: modify/defer/block result`. No fourth checkpoint exists, and no other Stage's ownership is altered by this document.

---

# 10. Responsibilities

Per `[D2 Unit 07]`, the Safety Layer's authority "is exercised through three distinct functions":

1. **Safety-triggered Opportunity creation (Stage 3)** — "injects a safety/high-risk-triggered Opportunity unconditionally (D1-OD-04, D1-IE-05), which then bypasses only the ordinary Evidence Evaluation and Eligibility Evaluation gating for that specific Opportunity."
2. **Safety disqualification (Stage 8)** — "disqualifies any Candidate conflicting with a D1 Unit 02 absolute override (D1-RP-07), without affecting any other Opportunity's or Candidate's path through the ordinary gates."
3. **Final safety review (Stage 9)** — "performs a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision (D1-AB-05)."

Per `[D2 Unit 07, "Dependencies"]`: "None upstream — an independent authority. Every other engine is subordinate to it at the three checkpoints named above, and only at those checkpoints." These three functions exhaustively define the Safety Layer's positive responsibilities; the policy logic behind each function is specified separately at Chapters 14–18.

---

# 11. Explicit Non-Responsibilities

Per `[D2 Unit 07, "Forbidden Responsibilities"]`: the Safety Layer "SHALL NOT be bypassed by any other engine or Stage, under any circumstance, at any of the three checkpoints above (D1-AB-05). SHALL NOT itself originate ordinary (non-safety) Recommendation or Initiative content — its authority is limited to the three functions above." Per `[D3 §11.2]`'s Forbidden-To-Touch table, the Safety Layer is forbidden from "Ordinary Recommendation/Initiative content generation."

Symmetrically, every other collaborator is forbidden from performing a safety determination: the Recommendation Engine "Never owns... the final recommendation decision or its safety evaluation" (`[T004, Relationship to Previous Work]`); the Initiative Engine does not hold "disqualification, modification, deferral, or blocking of any Candidate or Terminal Decision, and the mandatory pre-Expression safety evaluation" (`[T005 §2, §8]`); the Decision Engine "does not own Safety authority (that remains the Safety Layer's exclusive authority at all three of its checkpoints)" (`[T006 §2]`) and "integrates with these functions at their fixed checkpoints; it does not perform, second-guess, or override them" (`[T006 §9.2]`). This boundary is stated identically across all three built engines' specs, with no exception for any caller, including a hypothetical future AI agent (`[D1-AB-05]`).

---

# 12. Inputs

| Checkpoint | Input(s) | Source |
|---|---|---|
| Stage 3 — Opportunity Detection | Pipeline Context, specifically Health/Safety Profile and behavioral/situational data corresponding to AIC §23.7's enumerated symptom categories | `[D1 Unit 03]` |
| Stage 8 — Winner Selection | The full ranked Candidate pool | `[T006 §21.8]`, `disqualify()` call |
| Stage 9 — Decision Formation | The pre-review (assembled) Terminal Decision, plus Pipeline Context | `[T006 §21.8]`, `finalReview()` call |

Per `[D2 Unit 07, "Inputs"]`: "Health/Safety Profile and Life Event Context (Decision Input categories); every Candidate reaching Winner Selection; every Terminal Decision reaching Decision Formation." No input category beyond D1 Unit 03's eight is introduced. The Safety Layer reads Pipeline Context read-only; per `[D3 §11.1]`: "No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context."

---

# 13. Outputs

| Checkpoint | Output | Contract (Chapter 25, `[T006 §21.8]` extended per `[SLDP RCD-13]`) |
|---|---|---|
| Stage 3 | A mandatory Opportunity, injected unconditionally | (produced upstream of the port; not itself a port return value) |
| Stage 8 | One `DisqualificationResult` per submitted Candidate | `{ opportunityProvenance, disqualified: boolean, reasonCode: ReasonCode, reasonDetail: SafetyReasonDetail\|null, reason: <string\|null> }` |
| Stage 9 | Exactly one `SafetyReviewResult` per Decision Pass in which Stage 9 is entered | `{ disposition: <5-value enum>, modifiedContent: <object\|null>, reasonCode: ReasonCode, reasonDetail: SafetyReasonDetail\|null, reason: <string\|null> }` |

Per `[D2 Unit 07, "Outputs"]`: "Mandatory Opportunities; disqualification determinations; modify/defer/block determinations." Per RCD-03/RCD-11/RCD-13 (Chapters 17–18), the free-text `reason` field's *authority* is superseded by the mandatory, closed `reasonCode`; `reason` is retained only as a deprecated compatibility mirror (Chapter 26), and the full wire-shape is fixed at Chapter 25.

---

# 14. Internal Stages

**Stage 3 — Opportunity Detection.** Trigger: the enumerated high-risk situations at `[AIC §23.7]` ("Persistent chest pain. Sudden severe shortness of breath. Fainting. Severe allergic reactions. Rapid unexplained physical changes. Significant injuries. Symptoms suggesting acute medical illness.") plus "sustained body-image or disordered-eating distress patterns" (`[D1 Unit 05, "Canonical Opportunity Sources"]`), and — per `[SLDP RCD-08]` — any of the following single-event signal categories bypassing the ordinary pattern requirement: high-risk symptoms; known allergy conflicts; active medical instruction conflicts; significant injuries; explicit dangerous requests; clear situations outside coaching authority. "Inference alone SHALL NOT bypass the normal evidence requirements" (`[SLDP RCD-08]`). Mechanics: per `[D1-OD-04]`, "Safety/high-risk triggers SHALL bypass the pattern requirement... and SHALL be treated as opportunities on first occurrence"; per `[D1-IE-05]`, they "SHALL bypass this Unit's ordinary gating and SHALL always be eligible." Per `[D2-INV-06]`: "mandatory Opportunity injection whenever Opportunity Detection runs — every cycle, without exception." Exit: the injected Opportunity proceeds through Candidate Generation, Prioritization, Winner Selection, and Decision Formation exactly as any other eligible Opportunity — "no separate Safety pipeline exists" (`[D2-EF-01(a)]`).

**Stage 8 — Winner Selection.** Trigger: every Candidate in the submitted pool. Mechanics: per `[D2 Unit 07(b)]`, disqualification applies against "a D1 Unit 02 absolute override (D1-RP-07)" — the four categories fixed by `[D1-AH-02]`: a known allergy; an active instruction from a licensed healthcare professional; an active safety/high-risk symptom; one of the five permanent commitments named in Coach Bible Ch.19 §2. Disqualification is binary; no graded/partial disqualification exists in any canonical source. Exit: where every Candidate is disqualified, the cycle resolves per Chapter 16's Silence-vs-Refusal rule (cross-referenced, not restated here).

**Stage 9 — Decision Formation.** Trigger: the pre-review Terminal Decision. Mechanics: per `[D2 Unit 07(c)]`, "a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision." Disposition selection is governed exclusively by Chapter 16 (cross-referenced, not restated here). Exit: exactly one `SafetyReviewResult`, mapped deterministically per Chapter 26's CD-T006-06 table.

---

# 15. Safety Decision Matrix

Per `[SLDP RCD-02]`: "The Safety Layer SHALL use a deterministic Safety Decision Matrix, not a generic numerical severity score. The matrix SHALL evaluate: Risk Type, Evidence Confidence, Correctability, and Urgency." Per `[SLDP RCD-12]`, the Matrix "is not a Cartesian lookup table and is not a numerical scoring system; it is a deterministic ordered-rule framework." No numeric scoring, weighting, averaging, probability threshold, numerical severity calculation, or Cartesian combination table is permitted, and none is introduced by this chapter.

**Runtime unit of evaluation (`[SLDP RCD-14]`):** the Matrix's four dimensions are derived per **Canonical Safety Rule** (Chapter 7), not once per Candidate/Terminal Decision as an undifferentiated whole. Each matched Canonical Safety Rule is evaluated independently: `RiskType`, `EvidenceConfidence`, `Correctability`, and `Urgency` are derived for that Rule using the derivation rules below, applied to that Rule as the specific "detected safety issue" `RCD-12.C`/`RCD-12.D` reference. Each Rule independently evaluates the disposition predicates (Chapter 16) and produces exactly one Candidate Disposition for itself; cross-Rule sequencing (disposition precedence, then the same-disposition tie-break) is specified at Chapter 16.

**Derivation inputs (`[SLDP RCD-10]`):** the four dimensions SHALL be derived exclusively from already-approved canonical inputs: Pipeline Context, the Candidate under review, the Terminal Decision under review, Health/Safety Profile, and Life Event Context. No new engines, pipeline stages, repository state, or data sources are introduced.

**RiskType** (`[SLDP RCD-12.A]`) — a closed 11-value enum: `NONE`, `KNOWN_ALLERGY_CONFLICT`, `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, `ACTIVE_HIGH_RISK_SYMPTOM`, `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, `DANGEROUS_OR_EXTREME_REQUEST`, `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, `PSYCHOLOGICAL_DISTRESS_CONCERN`, `OUTSIDE_COACHING_SCOPE`, `INSUFFICIENT`. Engineering SHALL NOT add values. Derived only from the five approved inputs above; identifies the strongest repository-supported canonical safety conflict present in the item under review. `RiskType = NONE` where no repository-supported conflict exists; `RiskType = INSUFFICIENT` where safe classification cannot be established from approved evidence. Inference alone SHALL NOT establish a positive `RiskType`.

**EvidenceConfidence** (`[SLDP RCD-12.B]`) — a closed 6-value enum reusing `[D1 Unit 11]`'s Evidence Hierarchy unaltered: `EXPLICIT_USER_STATEMENT`, `EXPLICIT_USER_ACTION`, `REPEATED_BEHAVIOUR`, `SINGLE_BEHAVIOUR`, `INFERENCE`, `INSUFFICIENT`. Engineering SHALL NOT create another confidence scale. Derived from the strongest evidence item directly supporting the selected `RiskType`; where multiple evidence items support the same `RiskType`, the strongest applicable tier SHALL be used; evidence supporting an unrelated fact SHALL NOT increase confidence in the selected `RiskType`. `INFERENCE` alone SHALL never authorize `MODIFIED`, `BLOCKED`, or `ESCALATED`. For `[SLDP RCD-08]`'s closed single-event categories (Chapter 14), `SINGLE_BEHAVIOUR` may be sufficient where the event itself directly establishes the safety condition. For `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN` and `PSYCHOLOGICAL_DISTRESS_CONCERN`: an explicit user statement or repeated behaviour may establish the concern; a single ambiguous behaviour or inference alone does not.

**Correctability** (`[SLDP RCD-12.C]`) — a closed 4-value enum: `NOT_APPLICABLE`, `BOUNDED_MODIFICATION`, `REQUIRES_INTENT_CHANGE`, `INSUFFICIENT`. Engineering SHALL NOT add values. Determines whether the user's original intent can remain materially intact under a narrow safety correction. `NOT_APPLICABLE` — no repository-supported safety conflict exists. `BOUNDED_MODIFICATION` — a specific, limited modification removes the conflict, the original objective remains materially intact, and the modification does not replace the requested objective with a different one. `REQUIRES_INTENT_CHANGE` — the original requested intent itself conflicts with a canonical safety boundary and making it safe would require replacing or fundamentally changing that intent. `INSUFFICIENT` — available evidence does not allow a safe determination of whether a bounded modification is sufficient.

**Urgency** (`[SLDP RCD-12.D]`) — a closed 4-value enum: `ROUTINE_PROTECTIVE`, `TIME_SENSITIVE`, `IMMEDIATE_PROTECTIVE`, `INSUFFICIENT`. Engineering SHALL NOT add values. Classifies when protective action is required, not numerical severity. `ROUTINE_PROTECTIVE` — the concern must affect the current decision but no immediate protective action or immediate professional support is required. `TIME_SENSITIVE` — delaying the protective response may materially increase risk; the decision must be deferred, blocked, or redirected during the current Decision Pass. `IMMEDIATE_PROTECTIVE` — current evidence requires immediate cessation, immediate protective redirection, or constitutionally required professional support. `INSUFFICIENT` — timing sensitivity cannot be determined safely from approved evidence.

If a dimension cannot be derived from approved canonical evidence, its value SHALL be `INSUFFICIENT`; Engineering SHALL NOT infer or invent a missing value. Missing critical information SHALL result in `DEFERRED` (Chapter 16) whenever safe classification cannot otherwise be established.

---

# 16. Disposition Rules

Per `[SLDP RCD-09]`: "The Safety Layer SHALL determine exactly one disposition; no numeric scoring, weighting or averaging is permitted." Per `[SLDP RCD-12]`, disposition selection is a deterministic ordered-rule evaluation: (1) derive the four Chapter 15 dimension values; (2) evaluate the disposition predicates below in the fixed protective order; (3) return the first satisfied disposition; (4) where multiple predicates are satisfied simultaneously, return the highest-protective disposition. The fixed protective order is `ESCALATED` → `BLOCKED` → `DEFERRED` → `MODIFIED` → `UNMODIFIED`.

**Per-Rule disposition predicates (`[SLDP RCD-12.E]`), evaluated for each matched Canonical Safety Rule (Chapter 15) independently:**

1. **`ESCALATED`** — returned only when at least one of: repository-supported evidence establishes that appropriate professional support is constitutionally required; `RiskType = ACTIVE_HIGH_RISK_SYMPTOM` and `Urgency = IMMEDIATE_PROTECTIVE`; `RiskType = PSYCHOLOGICAL_DISTRESS_CONCERN` and the evidence establishes an immediate protective or professional-support requirement; or another repository-approved safety condition explicitly places the situation outside FITME's coaching authority and requires professional support. `ESCALATED` never contacts any person or service and never communicates externally; Expression determines wording (Chapter 19).
2. **`BLOCKED`** — returned when all of: `ESCALATED` was not satisfied; `RiskType` is neither `NONE` nor `INSUFFICIENT`; `EvidenceConfidence` is neither `INFERENCE` nor `INSUFFICIENT`; `Correctability = REQUIRES_INTENT_CHANGE`; the original intent conflicts with an approved canonical safety boundary.
3. **`DEFERRED`** — returned when `ESCALATED` and `BLOCKED` were not satisfied and at least one of: `RiskType = INSUFFICIENT`; `EvidenceConfidence = INFERENCE`; `EvidenceConfidence = INSUFFICIENT`; `Correctability = INSUFFICIENT`; `Urgency = INSUFFICIENT`; critical safety context is missing; safe classification cannot yet be established. When `EvidenceConfidence = INFERENCE`, the primary `reasonCode` SHALL be `INFERRED_SIGNAL_NOT_SUFFICIENT`; for every other missing-critical-context case, the primary `reasonCode` SHALL be `INSUFFICIENT_SAFETY_CONTEXT`.
4. **`MODIFIED`** — returned when all of: `ESCALATED`, `BLOCKED`, and `DEFERRED` were not satisfied; `RiskType` is neither `NONE` nor `INSUFFICIENT`; `EvidenceConfidence` is neither `INFERENCE` nor `INSUFFICIENT`; `Correctability = BOUNDED_MODIFICATION`; the bounded modification removes the safety conflict while materially preserving the original user intent.
5. **`UNMODIFIED`** — returned only when all of: `ESCALATED`, `BLOCKED`, `DEFERRED`, and `MODIFIED` were not satisfied; `RiskType = NONE`; no critical safety input is missing; no repository-supported safety conflict exists.

**Cross-Rule sequencing (`[SLDP RCD-14]`):** after every matched Canonical Safety Rule independently produces its own Candidate Disposition using the predicates above, the protective precedence order (`RCD-09`/`RCD-12`) selects the winning disposition across the full set of per-Rule Candidate Dispositions; only Rule Results supporting the winning disposition remain candidates (`RCD-14.B`). If exactly one Rule Result remains, it becomes the Primary Rule Result. If multiple remain, the deterministic same-disposition tie-break applies, in this exact order (`RCD-14.C`):

1. Disposition precedence (already applied above; restated as the tie-break's own first-ranked criterion).
2. `Urgency` — the Rule Result with the more time-sensitive value wins (`IMMEDIATE_PROTECTIVE` outranks `TIME_SENSITIVE`, which outranks `ROUTINE_PROTECTIVE`, per Chapter 15's own definitions).
3. `EvidenceConfidence` — the Rule Result with the higher tier on the D1 Evidence Hierarchy wins.
4. If disposition, `Urgency`, and `EvidenceConfidence` all remain tied, the **Canonical Safety Rule Order** applies — a fixed, canonical runtime tie-break order, independent of `RiskType`'s own enum declaration order, never a severity score, and modifiable only by a future canonical Product/Architecture decision: (1) `ACTIVE_HIGH_RISK_SYMPTOM`, (2) `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, (3) `KNOWN_ALLERGY_CONFLICT`, (4) `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, (5) `DANGEROUS_OR_EXTREME_REQUEST`, (6) `PSYCHOLOGICAL_DISTRESS_CONCERN`, (7) `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, (8) `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, (9) `OUTSIDE_COACHING_SCOPE`.

The Primary Rule Result determines the primary `RiskType` and primary `reasonCode` (Chapter 17). Rule Results that supported the winning disposition but lost only the same-disposition tie-break populate `secondaryReasonCodes` (Chapter 18); Rule Results supporting a lower-precedence disposition SHALL NOT appear there.

**Silence vs. Refusal (Stage 8 all-disqualified outcome, Chapter 14):** if all Candidates are disqualified because the original request itself violates a canonical safety boundary, the Safety Layer SHALL produce Refusal; if all Candidates are disqualified because no sufficiently safe Candidate can be established due to missing context or insufficient evidence, the Safety Layer SHALL produce Silence. All-disqualified status SHALL NOT itself produce `ESCALATED` (`[SLDP RCD-09]`).

The deterministic mapping from each disposition to its Terminal Decision shape is fixed by CD-T006-06 and is cited, not restated, at Chapter 26.

---

# 17. `reasonCode` Contract

Per `[SLDP RCD-11]`: "Every Safety Layer decision SHALL expose exactly one canonical `reasonCode`, which SHALL be the canonical authority; `reasonDetail` SHALL be structured supporting information only and SHALL NEVER replace `reasonCode`." Per `[SLDP RCD-13]`, `reasonCode` is mandatory and is the sole canonical authority; no free-text explanation is authoritative inside Safety Layer output. This supersedes the existing free-text `reason` field's *authority* in `DisqualificationResult`/`SafetyReviewResult` (`[T006 §21.8]`); the field's wire-shape is fixed at Chapter 25.

**The canonical closed `reasonCode` catalogue** (`[SLDP RCD-11, RCD-13.A]`), reproduced exactly, with no addition, omission, or reordering:

`NO_SAFETY_CONFLICT`, `KNOWN_ALLERGY_CONFLICT`, `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, `ACTIVE_HIGH_RISK_SYMPTOM`, `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, `DANGEROUS_OR_EXTREME_REQUEST`, `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, `PSYCHOLOGICAL_DISTRESS_CONCERN`, `OUTSIDE_COACHING_SCOPE`, `INSUFFICIENT_SAFETY_CONTEXT`, `INFERRED_SIGNAL_NOT_SUFFICIENT`, `PROFESSIONAL_SUPPORT_REQUIRED`.

Only one primary `reasonCode` SHALL be returned. Where multiple Canonical Safety Rules match, the primary `reasonCode` is the one belonging to the Primary Rule Result, determined by Chapter 16's disposition precedence and same-disposition tie-break (`[SLDP RCD-14.C]`); every other matched Rule Result that supported the winning disposition but lost only the tie-break belongs inside `reasonDetail.secondaryReasonCodes` instead (Chapter 18). The catalogue is CLOSED; Engineering SHALL NOT extend it (`[SLDP RCD-11]`).

**Migration mapping — resolved, not required.** Per `[SLDP RCD-13.E]`: "No historical free-text migration table is required for SL-001 because no live Safety Layer implementation currently persists or emits historical Safety results." This closes the item previously recorded here as an open Repository Gap; no migration table is defined or required by this SPEC.

---

# 18. `reasonDetail` Contract

Per `[SLDP RCD-03, RCD-11]`, `reasonDetail` SHALL be structured supporting information only, and SHALL NEVER replace `reasonCode` (Chapter 17). Its field structure is fixed by `[SLDP RCD-13.B]`:

```
SafetyReasonDetail {
  secondaryReasonCodes: ReasonCode[]
}
```

or `null`.

**Rules (`[SLDP RCD-13.B]`):** `secondaryReasonCodes` contains only additional Safety conditions that actually matched; every value must belong to the closed `reasonCode` catalogue (Chapter 17); duplicate values are forbidden; the primary `reasonCode` must not appear in `secondaryReasonCodes`; `NO_SAFETY_CONFLICT` must never appear as a secondary reason; `reasonDetail` contains no free text; `reasonDetail` does not alter the disposition; `reasonDetail` is supporting information only and is never canonical authority.

**Scope, exactly (`[SLDP RCD-14.D]`):** `secondaryReasonCodes` SHALL contain ONLY Canonical Safety Rules (Rule Results, Chapter 15) that: genuinely matched; supported the winning disposition (Chapter 16); and lost only during the deterministic same-disposition tie-break (Chapter 16, `[SLDP RCD-14.C]`). Rule Results supporting a lower-precedence disposition SHALL NOT appear inside `secondaryReasonCodes`. This rule is mandatory, and resolves the ambiguity between "all other matched Rules" and "only same-disposition Rules that lost the tie-break" that RCD-13.B's more general "additional Safety conditions that actually matched" language, read alone, would have left open.

---

# 19. Expression Boundary

Per `[SLDP RCD-04]`: "`ESCALATED` means: recommend appropriate professional care when constitutionally required; recommend pausing unsafe activity when appropriate; continue coaching only inside FITME authority boundaries. `ESCALATED` SHALL NOT: contact healthcare providers, notify third parties, open support tickets, or communicate externally. The Safety Layer classifies; Expression communicates."

Expression's own rendering of a `BOUNDARY`-kind or `MODIFIED` Terminal Decision into user-facing wording is out of this SPEC's scope (`[SLDP Ch.26]` item 6) — Expression itself remains unbuilt (`[T006 §9.3]`). Per `[D1-CDO-03]`: "A generative or LLM layer SHALL express a decision already reached; it SHALL NOT originate the underlying decision, its priority, or its rationale." Per `[T006 §24.7]`: "the Decision Engine does not draft, phrase, or soften refusal/escalation language; it produces the structured decision Expression will later render" — the same separation binds the Safety Layer's own output.

---

# 20. Memory Boundary

Per `[D3 §11.1]`: "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf, and only through the Persistence Gateway or the C4 write path." No exception is carved out for the Safety Layer anywhere in D2/D3/T006; it therefore performs no write of any kind, including no persistent budget, cache, or determination-history state of its own.

Applying, by direct structural analogy, the same pattern already confirmed for the Decision Engine (`[T006 §29.3]`: no StateAccess capability of its own) — since D3 names no Safety-Layer-specific exception — the Safety Layer likewise has no StateAccess capability of its own. Where a determination needs to be retained (e.g., as part of Coaching History), that retention is the Memory Layer's responsibility (Stage 11–13), not the Safety Layer's own.

---

# 21. D1 Integration

| D1 Unit | Rule Relied On | Used In |
|---|---|---|
| Unit 02 — Authority Hierarchy | Canonical Decision Hierarchy; `D1-AH-02` absolute overrides | Ch. 14 |
| Unit 03 — Decision Inputs | Eight canonical input categories, including Health/Safety Profile and Life Event Context | Ch. 12, 15 |
| Unit 11 — Evidence Requirements | Five-tier Evidence Hierarchy | Ch. 15 |
| Unit 14 — Authority Boundaries | `D1-AB-02/03/05` (professional-referral threshold, refusal, non-bypassable evaluation) | Ch. 10, 11, 14, 19, 26 |
| Unit 15 — Canonical Decision Output | Four canonical decision kinds; deciding/expressing separation | Ch. 19, 26 |

No relationship is introduced beyond what Chapters 10–20 already state.

---

# 22. D2 Integration

| D2 Unit | Rule Relied On | Used In |
|---|---|---|
| Unit 03 — Canonical Pipeline | 13-stage pipeline; Stage 3/8/9 mechanics | Ch. 9, 12–14 |
| Unit 04 — Stage Contracts | Stage 9 Responsibilities/Forbidden Actions | Ch. 14, 16 |
| Unit 06 — Decision Lifecycle | Lifecycle states this SPEC's checkpoints map to | Ch. 14 |
| Unit 07 — Engine Responsibilities | The Safety Layer's own Responsibilities/Forbidden Responsibilities/Inputs/Outputs | Ch. 10–13, 20 |

No relationship is introduced beyond what Chapters 9–20 already state.

---

# 23. D3 Integration

| D3 Section | Rule Relied On | Used In |
|---|---|---|
| §6 — Architecture Overview | Six-collaborator Composite Engine model; Responsibility Matrix | Ch. 8, 9 |
| §9 — Decision Lifecycle | Sequence diagram fixing which component performs which Stage | Ch. 9, 14 |
| §10 — Integration with Existing Systems | State Ownership, Persistence | Ch. 20 |
| §11 — Architectural Boundaries | Ownership Rules, Component Contracts, Forbidden Responsibilities | Ch. 11, 12, 20 |
| §12 — Failure Handling | Detection, Recovery, Graceful Degradation | Ch. 28 |

No relationship is introduced beyond what Chapters 8–20 and 28 already state.

---

# 24. TASK-006 Integration

| T006 Section | Rule Relied On | Used In |
|---|---|---|
| §21 — Safety Layer Integration | The three checkpoints' Decision-Engine-side mechanics; `SafetyIntegrationPort` contract; unavailability handling | Ch. 9, 14, 25, 28 |
| §22 — Decision Formation | Assembly paths, including the Safety-modified/deferred/blocked/escalated path | Ch. 16, 26 |
| §23 — Silence Semantics | The five Silence paths, including the all-disqualified path | Ch. 14, 16, 27 |
| §24 — Refusal, Deferral, Modification, Escalation | CD-T006-06's permitted kinds; no-disguised-recommendation; no-fabricated-fallback rules | Ch. 16, 19, 26, 27 |
| §25 — Terminal Decision Contract | Required/optional fields, invariants, validation rules | Ch. 26 |

This SPEC conforms to, and does not alter, any of these existing, already-shipped contract shapes (`[SAS, Contract Documentation Rules]`).

---

# 25. Repository Interfaces

The `SafetyIntegrationPort` interface, method signatures unchanged from `[T006 §21.8]`, with `DisqualificationResult`/`SafetyReviewResult` extended additively and backward-compatibly per `[SLDP RCD-13]`:

```
SafetyIntegrationPort {
  disqualify(candidatePool: Candidate[], pipelineContext): DisqualificationResult[]
    // DisqualificationResult {
    //   opportunityProvenance,
    //   disqualified: boolean,
    //   reasonCode: ReasonCode,
    //   reasonDetail: SafetyReasonDetail | null,
    //   reason: <string|null>   // deprecated compatibility mirror — Chapter 26
    // }

  finalReview(preReviewTerminalDecision, pipelineContext): SafetyReviewResult
    // SafetyReviewResult {
    //   disposition: 'UNMODIFIED'|'MODIFIED'|'DEFERRED'|'BLOCKED'|'ESCALATED',
    //   modifiedContent: <object|null>,
    //   reasonCode: ReasonCode,
    //   reasonDetail: SafetyReasonDetail | null,
    //   reason: <string|null>   // deprecated compatibility mirror — Chapter 26
    // }
}
```

`reasonCode` and `reasonDetail` are the additive fields fixed by `[SLDP RCD-13.C, RCD-13.D]`; `SafetyReasonDetail` is defined at Chapter 18. The pre-existing `reason: <string|null>` field is preserved unchanged in shape but is no longer canonical authority (Chapter 26). No method or parameter is added or removed; no other existing field is altered. This resolves the `reasonCode`/`reasonDetail` wire-shape item previously tracked as open at this chapter and at Chapters 17–18.

---

# 26. Canonical Invariants

- **Non-bypassability.** Per `[D1-AB-05]`: "No part of the system, including any future AI agent, may bypass this evaluation." Per `[D3 §11.3]`: "no component may bypass the Safety Layer at any of its three checkpoints (AI-06 does not permit an exception)."
- **CD-T006-06 deterministic mapping** (`[T006 §21.5]`), cited unaltered:

| Safety Disposition | Terminal Decision Result |
|---|---|
| `UNMODIFIED` | Original kind proceeds unchanged. |
| `MODIFIED` | Original kind proceeds, carrying a `modification` record; kind is never reformed. |
| `DEFERRED` | Reformed to `kind: 'SILENCE'`. |
| `BLOCKED` | Reformed to `kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'`. |
| `ESCALATED` | Reformed to `kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'`. |

- **No numerical severity score, no Cartesian mapping table** (`[SLDP RCD-02, RCD-12]`): the Safety Decision Matrix is a deterministic ordered-rule framework; a Cartesian combination table is explicitly not required and must not be introduced.
- **Single-event bypass is closed-list only** (`[SLDP RCD-08]`): high-risk symptoms; known allergy conflicts; active medical instruction conflicts; significant injuries; explicit dangerous requests; clear situations outside coaching authority — no other category qualifies, and inference alone never qualifies.
- **No engagement influence**, applied by extension from `[D1-AH-03]`/`[T006 §33]`: "Product engagement (Tier 10) SHALL NOT be permitted to influence a decision ahead of any other tier, under any circumstance."
- **Preserved special `reasonCode` mappings** (`[SLDP RCD-12.E, RCD-13.D, RCD-14.E]`): `UNMODIFIED` → `NO_SAFETY_CONFLICT`; `ESCALATED` → `PROFESSIONAL_SUPPORT_REQUIRED`; `DEFERRED` caused by inference → `INFERRED_SIGNAL_NOT_SUFFICIENT`; `DEFERRED` caused by missing critical context → `INSUFFICIENT_SAFETY_CONTEXT`.
- **Per-disposition output invariants** (`[SLDP RCD-13.C, RCD-13.D]`):

  | Field | `disqualified = false` / `UNMODIFIED` | `disqualified = true` / `MODIFIED`, `DEFERRED`, `BLOCKED`, `ESCALATED` |
  |---|---|---|
  | `reasonCode` | `NO_SAFETY_CONFLICT` | Must not equal `NO_SAFETY_CONFLICT`; `DEFERRED` must be `INSUFFICIENT_SAFETY_CONTEXT` or `INFERRED_SIGNAL_NOT_SUFFICIENT`; `ESCALATED` must be `PROFESSIONAL_SUPPORT_REQUIRED` |
  | `reasonDetail` | `null` | May be `null` or contain valid `secondaryReasonCodes` (`ESCALATED`: any additional matched conflict belongs only here) |
  | `reason` | `null` | Must equal the exact `reasonCode` literal |
  | `modifiedContent` (`SafetyReviewResult` only) | `null` | `MODIFIED` must not be `null`; `DEFERRED`/`BLOCKED`/`ESCALATED` must be `null` |

- **Deprecated `reason` compatibility rule** (`[SLDP RCD-13.E]`): the existing `reason` field remains only as a compatibility mirror. `reason = null` when `reasonCode = NO_SAFETY_CONFLICT`; for every other `reasonCode`, `reason` equals the exact `reasonCode` literal; `reason` SHALL NOT contain free text. Consumers SHALL treat `reasonCode` as the sole canonical authority and MAY temporarily read `reason` only for backward compatibility.
- **Validation rules** (`[SLDP RCD-13.F]`): a Safety result is invalid if `reasonCode` is absent, not in the closed catalogue, or more than one primary `reasonCode` is returned; if `secondaryReasonCodes` contains an unknown value, a duplicate, the primary `reasonCode`, or `NO_SAFETY_CONFLICT`; if `UNMODIFIED` carries a conflict reason; if `MODIFIED` has null `modifiedContent`, or `DEFERRED`/`BLOCKED`/`ESCALATED` has non-null `modifiedContent`; or if `reason` is neither `null` nor an exact mirror of `reasonCode`, or contains free text. An invalid Safety result causes Pipeline Abort (Chapter 28); the Decision Engine SHALL NOT repair, reinterpret, infer, or replace an invalid Safety result.

---

# 27. Edge Cases

- **Every Candidate disqualified at Stage 8** resolves to Silence or Refusal per Chapter 16's rule — never Escalation, which is reserved exclusively to a Stage-9 `ESCALATED` disposition on an already-formed pre-review Terminal Decision, "a structurally distinct situation from an all-disqualified Stage-8 pool" (`[T006 §23.5]`).
- **Stage-9 `BLOCKED`** never silently substitutes an alternative Candidate: "Decision Formation does not silently substitute a different, unblocked Candidate in its place" (`[T006 §24.5]`).
- **Zero Opportunities detected this cycle** vs. **Decision-Pass-level Silence**: per `[T006 §23]`, these are distinct — zero Opportunities means Decision Formation is never invoked at all; one or more Opportunities detected but none surviving to Winner Selection produces a Decision-Pass-level Silence Terminal Decision.
- **Single-event trigger outside RCD-08's closed list** does not bypass the ordinary pattern requirement; it is evaluated through the ordinary Evidence Hierarchy (`[D1 Unit 11]`) exactly as any other candidate evidence.

- **`MODIFIED` on a tied-set Terminal Decision** (RESOLVED — `[SLDP RCD-15]`, Chapter 28): where Stage 9 returns `MODIFIED` for a pre-review Terminal Decision assembled from the narrow permitted tied-set exception (Canonical Decision 7), the Safety Decision Matrix evaluates the pre-review Terminal Decision exactly as it evaluates any other pre-review Terminal Decision — as one single, undifferentiated unit; no per-option evaluation, matching, or derivation is introduced. `options[]` is preserved exactly as assembled by Winner Selection: identical count, order, membership, and `opportunityProvenance` (`[T006 §25.10]`). The resulting `modification` record is a **Decision-Level Modification** — a Safety-Layer-authored field of the Terminal Decision itself, existing at the same structural level as the Terminal Decision's other whole-decision fields (e.g., `rationale`, `safetyDisposition`), never at the level of, or scoped to, any individual member of `options[]`; it does not target, and shall not be construed as targeting, any one option more specifically than another. Every other Safety disposition (`UNMODIFIED`, `DEFERRED`, `BLOCKED`, `ESCALATED`) continues to apply to a tied-set Terminal Decision exactly as already fixed by CD-T006-06 (Chapter 26); this decision does not alter their behavior. This resolves **RG-3** in full (see §31). Out of scope, unaffected by this resolution: the bounded-modification content-generation algorithm, the Health/Safety Profile data source, and Expression's rendering of a Decision-Level Modification — each remains a separate, unresolved item.

---

# 28. Failure Modes

| Failure Mode | Detection | Recovery | Fallback | Owner |
|---|---|---|---|---|
| Safety Layer unreachable at Stage 8/9 | Port call fails to return | Pipeline Abort — no Terminal Decision fabricated | None | Decision Engine (caller), per `[T006 §21.7]`, unaltered |
| Structurally invalid response | Response-shape validation at the calling boundary | Pipeline Abort | None | Decision Engine (caller) |
| Missing Decision Input category | Category absence at Context Assembly | Proceed using available categories | The Safety Layer reasons over what is available | Memory Layer (absence detected upstream) |

Per `[D3 §12.3]`: "Where the Safety Layer or Decision Engine cannot be reached at all, the architecture SHALL NOT substitute a default Terminal Decision; D1-DI-02's prohibition on fabricating data extends, architecturally, to prohibiting a fabricated decision."

`[AUTHORING PLACEHOLDER — Engineering Decision Pending: the concrete failure-detection, retry, and logging mechanism is left open by D2-EF-06 itself and is not specified here]`

---

# 29. Acceptance Criteria

A Safety Layer implementation is conformant to SL-001 only if:

1. It implements `SafetyIntegrationPort` exactly per Chapter 25, with no production bypass path (RCD-01's authorizing basis; Chapter 2).
2. Stage 8 disqualification is binary against the fixed absolute-override list (Chapter 14; `[D1-AH-02]`).
3. Each matched Canonical Safety Rule independently derives its four dimension values only per Chapter 15's closed enums and derivation rules, using `INSUFFICIENT` where undecidable (RCD-02, RCD-10, RCD-12).
4. Each matched Canonical Safety Rule independently selects exactly one Candidate Disposition using the ordered predicates at Chapter 16 (RCD-09, RCD-12), and the winning disposition across all matched Rules is selected by protective precedence (RCD-09, RCD-12, RCD-14.B).
5. Where multiple Rule Results support the winning disposition, the Primary Rule Result is selected by the exact four-level same-disposition tie-break at Chapter 16 (RCD-14.C), and non-primary, tie-break-losing Rule Results populate `secondaryReasonCodes` exactly per Chapter 18's scope rule (RCD-14.D) — never Rule Results supporting a lower-precedence disposition.
6. Every non-`UNMODIFIED` determination exposes a primary `reasonCode` from the closed catalogue at Chapter 17 (RCD-03, RCD-11, RCD-13.A), with `reasonDetail` conforming exactly to Chapter 18's `SafetyReasonDetail` schema (RCD-13.B) and every per-disposition and validation invariant at Chapter 26 (RCD-13.C, RCD-13.D, RCD-13.F).
7. `ESCALATED` never triggers external communication (Chapter 19; RCD-04).
8. A single-event bypass occurs only for RCD-08's six closed signal categories (Chapter 14, 27).
9. Unavailability or an invalid response causes a Pipeline Abort, never a fabricated determination (Chapter 28).
10. Where `MODIFIED` is returned for a tied-set Terminal Decision, `options[]` is preserved unmutated (count, order, membership, provenance) and the `modification` record is applied as a Decision-Level Modification, never scoped to an individual option (Chapter 27, RG-3; `[SLDP RCD-15]`).

---

# 30. Test Strategy

| Category | Required Test Scenarios (by name/scenario, not implementation) | Traces To |
|---|---|---|
| Unit | Stage 8 binary disqualification against each of the four override categories individually; each of RCD-08's six single-event signal categories individually confirmed to bypass the pattern requirement; an inferred (non-listed) single event confirmed NOT to bypass it; each of the four Chapter 15 dimensions independently returning `INSUFFICIENT` when underivable; each of the five Chapter 16 disposition predicates individually satisfied and confirmed to return the correct disposition | Ch. 14, 15, 16, 27 |
| Contract | `disqualify()`/`finalReview()` conformance to the port shape at Ch. 25, including the `reasonCode`/`reasonDetail` fields; CD-T006-06 mapping enforced as a hard invariant; every per-disposition invariant and every RCD-13.F validation rule at Ch. 26 enforced, each causing Pipeline Abort when violated | Ch. 25, 26 |
| Integration | Stage 3 mandatory-injection unconditionality; Stage 8 all-disqualified fallback to Silence/Refusal; Stage 9 `BLOCKED` never silently substituting a Candidate; multiple Canonical Safety Rules matching simultaneously, confirming disposition precedence selects the winning disposition across Rule Results (Ch. 16, RCD-14.B) | Ch. 14, 16, 27 |
| Tie-break | Two or more Rule Results tied on disposition, resolved by `Urgency`; tied on disposition and `Urgency`, resolved by `EvidenceConfidence`; tied on all three, resolved by the Canonical Safety Rule Order; confirmation that a tie-break-losing Rule Result appears only in `secondaryReasonCodes`, never as primary, and that a Rule Result supporting a lower-precedence disposition never appears in `secondaryReasonCodes` at all | Ch. 16, 18 |
| Failure | Port unreachable → Pipeline Abort; structurally invalid response → Pipeline Abort; missing Decision Input category → proceed on available categories | Ch. 28 |
| Regression | `ESCALATED` never triggers external communication (negative-assertion test) | Ch. 19 |
| Tied-set | `MODIFIED` on a tied-set Terminal Decision: `options[]` unchanged in count/order/membership/provenance; `modification` record present and applied as a Decision-Level Modification, not scoped to any one option; every other disposition (`UNMODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`) on a tied-set Terminal Decision behaves identically to the single-winner case | Ch. 27 (RG-3, RESOLVED — `[SLDP RCD-15]`) |

The `MODIFIED`-disposition/tied-set interaction (Ch. 27, RG-3) is now specified in full and its test scenario is ready to be authored (row above). The concrete failure-detection/retry/logging mechanism (Ch. 28, ED-1) remains genuinely open; its test is deferred, not dropped, pending resolution (Ch. 31).

---

# 31. Repository Impact

**Architecture Decision Pending:** None open. AD-1 (the Risk Type × Evidence Confidence × Correctability × Urgency-to-disposition mapping, Chapter 15–16) is RESOLVED by `[SLDP RCD-12]`. AD-2 (`reasonDetail`'s field structure, Chapter 18) is RESOLVED by `[SLDP RCD-13.B]`.

**Repository Gap:**
- RG-1 (no classification rule/formula for deriving dimension values, Chapter 15) is RESOLVED by `[SLDP RCD-12.A–D]`.
- RG-2 (no migration mapping from `reason` to `reasonCode`, Chapter 17) is RESOLVED by `[SLDP RCD-13.E]`'s finding that no such table is required.
- RG-3 (no canonical source addressed the `MODIFIED`-disposition/tied-set interaction, Chapter 27) is RESOLVED by `[SLDP RCD-15]`: decision-level (uniform) modification — the Safety Decision Matrix evaluates a tied-set Terminal Decision as a single unit, `options[]` is preserved unmutated, and the `modification` record is a Decision-Level Modification applying to the Terminal Decision as a whole, never to an individual option. No Repository Gap remains open in this document.

**Engineering Decision Pending:**
- ED-1 — The concrete failure-detection, retry, and logging mechanism (Chapter 28). Not resolved by RCD-12, RCD-13, or RCD-14; remains genuinely open.

**Candidate repository touch points** (illustrative only, not authorized by this document): a new `js/coachDecisionSystem/` module implementing `SafetyIntegrationPort`'s production side; no change to any existing file's public contract.

---

# 32. Traceability Matrix

| Chapter | Canonical Source(s) | RCD(s) Realized |
|---|---|---|
| 1–7 | EW, SAS, SLDP, D1, D2, T006 | RCD-01, RCD-07 |
| 8 | D3, ARCH | RCD-05 |
| 9–11 | D2, D3, T004, T005, T006 | — |
| 12–13 | D1, D2, D3, T006 | RCD-03, RCD-10, RCD-11, RCD-13 |
| 14 | D1, D2, D3, T006 | RCD-08, RCD-09 |
| 15 | SLDP | RCD-02, RCD-10, RCD-12, RCD-14 |
| 16 | SLDP, T006 | RCD-09, RCD-12, RCD-14 |
| 17–18 | SLDP | RCD-03, RCD-11, RCD-13, RCD-14 |
| 19 | SLDP, D1, D3, T006 | RCD-04 |
| 20 | D3, T006 | — |
| 21–24 | D1, D2, D3, T006, ARCH | — (consolidation only) |
| 25 | D1, D2, D3, T006, ARCH, SLDP | RCD-13 |
| 26 | D1, D2, D3, T006, SLDP | RCD-02, RCD-08, RCD-09, RCD-12, RCD-13, RCD-14 |
| 27–28 | D1, D2, D3, T006, SLDP | RCD-08, RCD-09, RCD-15 |
| 29 | SLDP (all), T006 | RCD-01–RCD-15 |
| 30–35 | SAS | — |

---

# 33. Out of Scope

- Expression's own specification (Chapter 19; `[SLDP Ch.26]` item 6).
- Any change to the Engine Registry, Composite Engine registration, or Internal Pipeline Orchestrator sequencing (Chapter 8, 9).
- Any change to D1, D2, or D3's existing text (Chapter 21–23, cited only).
- TASK-007 — explicitly unaffected (`[SLDP RCD-01]`).
- Any external notification, healthcare-provider contact, or third-party communication mechanism (Chapter 19; RCD-04).
- AI Constitution Ch.11/Ch.17's own internal content — only their relationship to the Safety Layer is in scope (Chapter 8; RCD-05).

This list is fully consistent with Chapter 3's "Does NOT Define" list; neither diverges from the other.

---

# 34. Canonical Review Checklist

**Product Review** (Head of Product, per `[SAS, Product Review Requirements]`): review this document for product intent, philosophy, scope, and governance consistency against PB and any other product-level source. Items requiring attention: none open (RCD-01, RCD-04, RCD-06, RCD-07 all resolved). **APPROVED.** Engineering does not self-certify this review; approval communicated directly.

**Architecture Review** (AI Architect, per `[SAS, Architecture Review Requirements]`): review this document for runtime, ownership, composition, and contract consistency against ARCH and any other architecture-level source. Items requiring attention: none open — AD-1 and AD-2 (formerly Chapter 31) are RESOLVED by RCD-12 and RCD-13 respectively; RG-3 (Repository Gap, Chapter 27) is RESOLVED by RCD-15. One item remains open, under a different category, informational only and not Architecture Decision Pending: ED-1 (Engineering Decision Pending, Chapter 28); it does not block this review. **APPROVED.** Engineering does not self-certify this review; approval communicated directly.

**Final Product Verification** and **Final Architecture Verification** (DONE-stage closure sign-off, per `[SAS, DONE Requirements]`, distinct from the READY-stage reviews above): both **APPROVED** (2026-08-05), communicated directly, not self-certified by Engineering. See §36 Closure Record.

---

# 35. Engineering Readiness Checklist

- [x] Every section is complete or explicitly marked otherwise (Authoring Placeholder remaining only at Ch. 28 (ED-1); the former placeholders at Ch. 15, 16, 17, 18, and Ch. 27 (RG-3) are resolved and removed, per RCD-12, RCD-13, RCD-14, and RCD-15 respectively).
- [x] No placeholder or template-only text remains outside a properly-recorded Authoring Placeholder.
- [x] No non-evidenced claim is asserted as fact.
- [x] Every documented contract preserves previously approved ownership (Chapter 24, 25); the Chapter 25 port extension is exactly RCD-13's approved additive fields, no more; RCD-15 introduces no new field, method, or parameter to that contract.
- [x] No obsolete Repository Gap, Architecture Decision Pending, or Engineering Decision Pending was left in place where an approved RCD now resolves it (Chapter 31); RG-3 was resolved and replaced with RCD-15's approved text, not removed or silently invented; ED-1 remains genuinely unresolved and is not treated as resolved here.
- [x] No Product or Architecture behaviour was invented in this synchronization; every changed sentence traces to RCD-12, RCD-13, RCD-14, or RCD-15's approved text (SLDP Ch. 28, this document's Canonical Source Index).
- [x] No Canonical contradiction was introduced; RCD-01 through RCD-11's own content is unaltered by this synchronization round, and RCD-12 through RCD-14 are integrated exactly as approved, with every chapter's substance outside Chapters 1–3, 6–7, 15–18, 25–26, 29–32, and 34–35 unchanged.

---

# 36. Closure Record

Written at actual task closure (2026-08-05), per Approvals below.

- **Final status**: DONE / CLOSED.
- **Implementation summary**: realizes the fifth of D3 §17's six Coach Decision System internal collaborators — the Safety Layer, the production implementation behind the existing, policy-free `SafetyIntegrationPort` (Canonical Decision CD-T006-05, `safetyIntegrationPort.js`). New: `js/coachDecisionSystem/safetyLayer.js` — Stage 8 `disqualify()` (D1-AH-02 absolute-override binary check), Stage 9 `finalReview()` (the full Safety Decision Matrix, RCD-09/RCD-10/RCD-12/RCD-14), and the Stage 3 `detectSafetyOpportunities()` contribution, dispatched from `internalPipelineOrchestrator.js` identically to the existing Initiative Engine pattern. `decisionFormation.js` required no change: its existing `MODIFIED` branch already carries a tied-set Terminal Decision's `options[]` through unmutated and attaches `modification.modifiedContent` as a decision-level sidecar field, exactly conforming to RCD-15 once written. `safetyIntegrationPort.js` unchanged in method/parameter shape; its `reasonCode`/`reasonDetail` validators (RCD-13) were already additively extended prior to this closure. `index.html`/`sw.js` — script/shell wiring added for the one new file (`safetyLayer.js`), matching the existing TASK-006 dependency-ordering pattern (after `safetyIntegrationPort.js`, before `internalPipelineOrchestrator.js`). No `APP_VERSION` change — this collaborator has no user-facing surface yet (Expression, D3 §17's sixth and last collaborator, is not built).
- **Canonical Decisions realized**: all fifteen Required Canonical Decisions (RCD-01 through RCD-15), per the SLDP (`docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`, v2.6, Closed). RCD-15 (RG-3 Resolution — Decision-Level Modification for Tied-Set Terminal Decisions) was approved and synchronized during this closure cycle, following a dedicated Root Cause Investigation, Canonical Architecture Investigation, and Resolution Analysis; the two other blockers identified in that investigation (Health/Safety Profile Source; MODIFIED Ownership) were found, on evidence, not to require a new Canonical Decision — already resolved by existing canonical text and the SPEC's own Ch.28 Failure Mode guidance.
- **Tests and results**: 4 new tests added to `tests/decisionFormation.test.js` (the tied-set + `MODIFIED` scenario identified by the investigation, per Ch.30's Test Strategy); full suite **1374/1374 passing** (no regression to the pre-existing baseline).
- **Approvals**: Engineering Readiness Verification, Final Product Verification, and Final Architecture Verification — all APPROVED, communicated directly, not derived or self-certified by Engineering.
- **Documentation updates**: this specification (Status/Lifecycle header, Ch.27 RG-3 resolution, §31, Ch.29-30, Ch.32, Ch.34, this Closure Record); `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (v2.6 — RCD-15, GAP-16, Addendum); `docs/specs/TASK_006_SPEC_v1.0.md` (§25/§25.10, additive cross-reference only, no semantic change); `index.html`, `sw.js` (script/shell wiring); `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`. D1, D2, D3, Engineering Workflow, Product Bible, AI Constitution, Coach Bible, and Coach Knowledge Base reviewed and intentionally left unchanged — RCD-15 alters no rule in any of them.
- **Commit hash**: the single commit introducing this implementation and this Closure Record (this file cannot self-reference its own resulting hash — see `git log -1 -- docs/specs/SL-001_SPEC_v1.0.md` after this commit, following the same disclosure TASK-004/005/006's own Closure Records used).
- **Branch and push status**: committed to a dedicated branch (not directly to `main`) and pushed; see the calling turn's report for the exact branch name and push target.
- **Remaining non-blocking Follow-ups** (tracked, not decided or scheduled here; none expand SL-001's own scope):
  - ED-1 (Chapter 28): the concrete failure-detection/retry/logging mechanism remains an open Engineering Decision Pending, Engineering-owned, non-blocking.
  - The bounded-modification content-generation algorithm (deciding *how* to alter a Candidate's content when `MODIFIED`) has no canonical source anywhere and remains open — Product/coaching-content-authoring work, explicitly out of RCD-15's own scope. Currently unreachable at this repository baseline (see next item), so non-blocking.
  - No Health/Safety Profile repository data source exists yet, so `matchCanonicalSafetyRules()` correctly yields zero matches at this baseline — a real, correctly-typed function, not a stub, per the SPEC's own Ch.28 Failure Mode row ("Missing Decision Input category → Proceed using available categories"). Non-blocking, same treatment as `lifeEventContext`/`capacityState`/`relationshipMaturity` (TASK-005).
  - GAP-06 and the inherited GAP-10 through GAP-13 (SLDP Ch.27) remain open, non-blocking, unaffected by this closure.
- **Lessons Learned**: RG-3 existed because two independently-approved canonical concepts (Canonical Decision 7's tied-set structure; RCD-10/12/14's single-unit Matrix evaluation model) were never cross-examined against each other — a reminder that a new disposition-preserving behavior (here, `MODIFIED`'s "kind never reformed" rule) can expose a latent gap between two otherwise-complete, individually-correct prior decisions. The eventual resolution (decision-level modification) required no change to either prior decision, and was found to already match the pre-existing, uncommitted implementation — the interruption was a documentation/decision gap, not an implementation defect.

This is Engineering Self-Review only, distinct from, and not a substitute for, Product Review, Architecture Review (Chapter 34), or the READY/DONE determinations (Chapter 1), which are made respectively by Head of Product + AI Architect and at actual implementation closure. This self-review is repeated after any substantial edit, not performed only once.