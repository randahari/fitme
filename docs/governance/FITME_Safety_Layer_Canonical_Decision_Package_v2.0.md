
# FITME — SAFETY LAYER CANONICAL DECISION PACKAGE
## v2.2 — Expanded from GOLD SKELETON v2.0 (Closed — Repository Synchronized; Safety Decision Matrix Disposition Policy Finalized)

> **Document role:** Decision Package. Not a SPEC. Not an implementation document.
> **Prepared by:** Lead Engineer / Canonical Documentation Maintainer, recording decisions approved by the Head of Product + AI Architect without reinterpretation.
> **Repository baseline:** `main`, prior to this closure commit (parent commit `ee727f8`, "docs: close FITME Spec Authoring Standard v1.1 to Canonical").
> **Revision note:** v1.1 applied Canonical Review Round 2 corrections (solution-neutral RCD/Gap wording). v1.2 applied Canonical Review Round 3 (RCD-01 reframed as a formal-designation question). v2.0 recorded the Head of Product + AI Architect's Final Canonical Update: all eight Required Canonical Decisions (RCD-01 through RCD-08) approved and RESOLVED. v2.1 records closure: the RCD-06 repository synchronization has been executed across every affected canonical document (Roadmap, Changelog, AI Constitution, Coach Bible, Product Bible, D1, D2, D3), and this Decision Package itself is filed as a canonical governance document at `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`. SL-001 — Safety Layer SPEC authoring is enabled but not started by this closure. **v2.2 records a further Final Canonical Update:** the Head of Product + AI Architect approved and RESOLVED three additional Required Canonical Decisions — RCD-09 (Safety Decision Matrix Disposition Policy), RCD-10 (Derivation of Safety Matrix Dimensions), and RCD-11 (Canonical `reasonCode` Contract) — fully specifying content that RCD-02 and RCD-03 had previously approved only at the structural level. This round is not yet repository-synchronized; the documentation-synchronization action for RCD-09 through RCD-11 (principally, updating the future SL-001 SPEC's own record of these items from Architecture Decision Pending to fixed) remains a follow-up action outside this Decision Package's own authority, per the same reasoning RCD-06 already established for the original eight decisions.

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| AIC | AI Constitution v1.0 | `docs/constitution/FITME_AI_Constitution_v1.0.md` |
| PB | Product Bible | `docs/product/Product_Bible.md.docx` |
| CB | Coach Bible | `docs/governance/FITME_Coach_Bible.md` |
| ARCH | FITME Architecture v1 | `docs/architecture/FITME_ARCHITECTURE_v1.md` |
| EW | Engineering Workflow v1.0 | `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` |
| D1 | D1 Spec v1.0 | `docs/specs/D1_SPEC_v1.0.md` |
| D2 | D2 Spec v1.0 | `docs/specs/D2_SPEC_v1.0.md` |
| D3 | D3 Spec | `docs/specs/D3_SPEC.md` |
| T004 | TASK-004 Spec v1.0 | `docs/specs/TASK_004_SPEC_v1.0.md` |
| T005 | TASK-005 Spec v1.0 | `docs/specs/TASK_005_SPEC_v1.0.md` |
| T006 | TASK-006 Spec v1.0 | `docs/specs/TASK_006_SPEC_v1.0.md` |
| RM | Roadmap | `docs/roadmap/Roadmap.md` |
| CL | Changelog | `docs/roadmap/Changelog.md` |

Citation format used throughout: `[ABBR §Section, ~LineN]`. All quotations are verbatim from the cited source as it exists in the repository at the stated baseline commit.

---

# 01. Status

## Purpose
Establish the working status of this Decision Package before any chapter is read for content, so that its conclusions are never mistaken for canonical, implemented, or Product/Architecture-approved fact.

## Canonical Sources
None — this chapter describes the Decision Package itself, not repository content.

## Required Repository Reading
The Skeleton document supplied to author this package (`FITME_SAFETY_LAYER_DECISION_PACKAGE_SKELETON_GOLD_v2.0.md`), which is explicitly non-canonical: "It is not a SPEC and not an implementation document" [Skeleton, Purpose].

## Repository Evidence
- `[RM, Next Step, ~Line 592]` — "Next Work Item: Pending Product/Architecture direction — the Safety Layer and Expression remain the last two of D3 §17's six Coach Decision System collaborators; no next canonical work item is currently named."
- `[CL, Current Status, ~Line 37]` — "⏭️ Next canonical task: pending Product/Architecture direction — the Safety Layer and Expression remain the last two of D3 §17's six collaborators; no next canonical work item is currently named."
- `[T006 §1 Status, ~Line 36]` — "CD-T006-05 (the Safety Layer is not implemented by TASK-006; only the Safety Integration Port/contract is defined...)".

## Canonical Interpretation
As of the repository baseline, the Safety Layer is an **approved architectural collaborator with no implementation, no assigned Roadmap TASK number, and no scheduled next work item.** This Decision Package is authored to remove ambiguity *before* such a task can be scheduled — it is preparatory, not authorizing.

## Explicit Non-Interpretations
This chapter does not authorize SPEC authoring, does not assign a TASK number, and does not change the Roadmap's "no next canonical work item is currently named" status.

## Repository Gaps
None specific to this chapter (status is descriptive, not evidentiary).

## Completion Checklist
- **Already decided:** The Safety Layer exists as an approved-but-unbuilt collaborator (D3 §17).
- **Remains open:** Whether/when a Safety Layer SPEC-authoring cycle begins.
- **Owner:** Product/AI Architect (per RM/CL "pending Product/Architecture direction").
- **Blocks SPEC:** Yes — no SPEC authoring should begin while this Decision Package remains open (see Ch. 31).

---

# 02. Purpose

## Purpose
State why this Decision Package exists, per the Skeleton's own mission statement.

## Canonical Sources
None — this chapter restates the Skeleton's mission, not repository content.

## Required Repository Reading
Skeleton §1 "Mission": "Produce a Decision Package that removes every remaining Product and AI Architecture ambiguity before Safety Layer SPEC authoring."

## Repository Evidence
- `[T006 §38, Repository Gap G-6, ~Line 2004]` — "Required resolution: a future, separately-scoped Safety Layer task (not named on the current Roadmap as of this document's authoring), implementing the port defined at Section 21.8."
- `[T006 §21.8, ~Line 1060]` — "TASK-006 does not implement the Safety Layer. It defines only the integration contract — the Safety Integration Port."

## Canonical Interpretation
The repository itself already anticipates and calls for the exact document this Skeleton requests: a resolution of what a future Safety Layer task must define, prior to that task being scheduled. This Decision Package's purpose is to consolidate every piece of existing repository evidence bearing on that future task, and to enumerate — without resolving — every Product or AI Architecture ambiguity that stands in its way.

## Explicit Non-Interpretations
This chapter does not itself resolve any ambiguity; it only states that the exercise is repository-anticipated and repository-necessary.

## Repository Gaps
None specific to this chapter.

## Completion Checklist
- **Already decided:** A Safety Layer implementation task will eventually be required (T006 G-6).
- **Remains open:** Everything the future task must be told before it can be specified (the subject of Ch. 06–28).
- **Owner:** N/A (procedural chapter).
- **Blocks SPEC:** N/A.

---

# 03. Scope

## Purpose
Define what this Decision Package covers and does not cover, so later chapters are read within their intended boundary.

## Canonical Sources
EW, D1, D2, D3, T006.

## Required Repository Reading
D2's and D3's own scope disclaimers; T006's "Explicitly Not Owned" sections.

## Repository Evidence
- `[D2, Scope, "D2 Does NOT Define", ~Line 69]` — "Coaching policy / Recommendation policy / Evidence policy / Memory policy / Priority policy / Personalization policy / Safety policy / Engineering implementation."
- `[D3 §2.2 Out of Scope, ~Line 87]` — "Decision policy — what the coach decides and why (D1's exclusive territory; not restated here)."
- `[T006 §9.2, ~Line 285]` — "Safety determination of any kind. The Safety Layer's three functions... remain exclusively the Safety Layer's (D2 Unit 07, D1-AB-05). The Decision Engine integrates with these functions at their fixed checkpoints; it does not perform, second-guess, or override them."
- `[T006 §38 G-6, ~Line 2004]` — Safety Layer policy logic is the explicit "required resolution" left to a future task.

## Canonical Interpretation
This Decision Package's scope is bounded to exactly what the repository has already approved about the Safety Layer as an *architectural placeholder* (its checkpoints, its port contract, its disposition vocabulary) plus the *unresolved* Product/Architecture questions that the placeholder does not answer. It does not cover Expression (the other unbuilt D3 §17 collaborator), which is a separate, independent gap.

## Explicit Non-Interpretations
This chapter does not define Safety Layer policy content itself (forbidden to Engineering per D2/D3 scope disclaimers above), and does not expand scope to Expression, UX System, or Design System (TASK-007/008), which are unrelated pending items `[RM, TASK-007/008, ~Lines 564-570]`.

## Repository Gaps
None specific to this chapter.

## Completion Checklist
- **Already decided:** Safety policy is out of scope for D1/D2/D3/T004/T005/T006 by their own text; it is reserved to a future, separately-scoped task.
- **Remains open:** The content of that future task.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes, until Ch. 28's Required Canonical Decisions are resolved.

---

# 04. Canonical Authority

## Purpose
Establish which documents govern this package's conclusions and in what order, since conflicting evidence must be resolved by precedence, not by Engineering judgment.

## Canonical Sources
EW, D1, D2, D3, T004, T005, T006, RM, CL, per Skeleton §2 "Canonical precedence."

## Required Repository Reading
EW §3; D1 "Canonical Authority Sources" and Unit 02 "Document Authority"; D2 "Canonical Authority Sources"; D3 §3.1 "Governing Documents"; T004/T005/T006 "Canonical Authority" sections.

## Repository Evidence
- `[EW §3, ~Line 18]` — "Priority: 1. AI Constitution 2. Product Bible 3. Coach Bible... 4. Architecture 5. Engineering Workflow 6. Task SPEC 7. Roadmap 8. Changelog." Also: "The Coach Knowledge Base... is a living research document, not a source of truth" `[EW §3, ~Line 24]`.
- `[D1, Canonical Authority Sources, ~Line 31]` — an 11-item list: AI Constitution, Product Bible, Coach Bible, **Coach Knowledge Base**, Intelligence & Relationship Philosophy, Architecture, C2, C3, C4, Roadmap, Changelog.
- `[D1 Unit 02, ~Line 212]` — restates EW's 8-item list verbatim as the conflict-resolution hierarchy, and separately notes: "The Coach Bible separately declares itself the highest authority for coaching philosophy specifically. No concrete conflict... was found" `[D1 Unit 02, ~Line 228]`.
- `[D2, Canonical Authority Sources, ~Line 40]` — an 11-item list that **omits Engineering Workflow entirely** and **omits Coach Knowledge Base entirely**, inserting "Intelligence & Relationship Philosophy" at #4 and "D1" at #9.
- `[D3 §3.1, ~Line 115]` — a "Governing Documents" list that **includes the Coach Knowledge Base**, directly contradicting EW's and D1's explicit statement that it is not a source of truth.
- `[T005 §3.2 / T006 §3.2, ~Lines 93-95]` — both restate EW's 8-item list identically: "1. AI Constitution → 2. Product Bible → 3. Coach Bible → 4. Architecture → 5. Engineering Workflow → 6. Task SPEC → 7. Roadmap → 8. Changelog."
- `[CB, Ground Rules, ~Line 15]` and `[CB, Canonical Maintenance Policy, ~Line 5188]` — "This document is the highest coaching authority within FITME. Where any other document, specification, or system description appears to conflict with the philosophy established here, this Bible governs." This is an unqualified self-declared supremacy statement, not scoped to a numeric rank.
- `[RM, Intelligence & Relationship Philosophy entry, ~Line 42]` — "its ranking in the Source of Truth hierarchy relative to the AI Constitution, Product Bible and Coach Bible has not yet been decided."
- `[AIC — full-document review]` — the AI Constitution contains **no explicit statement of its own precedence relative to any other named document** anywhere in its 19,865 lines (confirmed by full-text review); its supremacy is asserted only over future FITME systems/modules, never over sibling governance documents by name.
- `[PB §13 Governance References, ~Line 73]` — "This Product Bible remains the single source of truth for product scope, roles and delivery process; coaching doctrine detail is governed by the Coach Bible." No numeric precedence list appears in PB.

## Canonical Interpretation
The Skeleton's own precedence order (§2: AI Constitution → Product Bible → Coach Bible → Architecture → Engineering Workflow → D1 → D2 → D3 → TASK-004 → TASK-005 → TASK-006 → Roadmap → Changelog) is consistent with EW §3, and with T005/T006's restatement of EW §3. This package therefore adopts the Skeleton's order for resolving conflicts among these 13 documents. However, the repository itself contains **at least five distinct, non-identical precedence lists** (EW; D1's own separate "Canonical Authority Sources" list; D2's list; D3's "Governing Documents" list; and the Coach Bible's own unqualified supremacy claim), and none of the source documents reconciles them. This package does not resolve that inconsistency — it is recorded as GAP-09 (Ch. 27) and RCD-07 (Ch. 28).

## Explicit Non-Interpretations
This chapter does not decide which of the five conflicting precedence lists is correct, does not decide the Coach Bible's numeric rank, and does not decide the Intelligence & Relationship Philosophy's rank (already flagged as open by the Roadmap itself).

## Repository Gaps
**GAP-09** — see Ch. 27.

## Completion Checklist
- **Already decided:** A precedence order exists and is used by this package (Skeleton §2, corroborated by EW §3, T005 §3.2, T006 §3.2).
- **Remains open:** Which precedence order governs, and how the five inconsistent in-repository lists relate to it.
- **Owner:** Product/AI Architect (governance authority; EW §2 assigns "Architecture" and "Product decisions" exclusively to that role).
- **Blocks SPEC:** Yes.

---

# 05. Existing Canonical Decisions

## Purpose
Inventory every decision already made about the Safety Layer, so later chapters build on — rather than re-litigate — settled ground.

## Canonical Sources
AIC, D1, D2, D3, T006.

## Required Repository Reading
AIC Ch.23 Engineering Implications; D1 Unit 14; D2 Unit 05, Unit 07, Unit 08; D3 §6, §11, §12; T006 §21, §24, §25.

## Repository Evidence
- `[AIC Ch.23, ~Line 19758]` — "Every recommendation generated by the FITME Coach should pass through a dedicated Safety Layer before reaching the user." `[AIC Ch.23, ~Line 19762]` — "This layer should operate independently from the Recommendation Engine and have the authority to modify, defer, or block recommendations when necessary."
- `[D1-AB-05, Unit 14, ~Line 1013]` — "Every Recommendation SHALL pass through a safety evaluation with authority to modify, defer, or block it, executed independently of and before the recommendation logic proper. No part of the system, including any future AI agent, may bypass this evaluation... the evaluation's own implementation is Architecture/Task-SPEC territory (see CDR-3)."
- `[D1-AB-03, Unit 14, ~Line 1003]` — "The coach MAY refuse a request that conflicts with a safety or health principle. The refusal SHALL be framed as protective, not judgmental, and SHALL offer a safer alternative where one exists."
- `[D1-AB-02, Unit 14, ~Line 993]` — professional-referral threshold: the coach "SHALL calmly encourage appropriate professional support; it SHALL NOT diagnose, and it SHALL NOT withdraw ordinary coaching support within its own remaining scope."
- `[D2 Unit 07, "Safety Layer", ~Line 1322]` — the Safety Layer's authority is "exercised through three distinct functions": (a) mandatory Opportunity injection at Opportunity Detection, (b) Candidate disqualification at Winner Selection, (c) final modify/defer/block review at Decision Formation `[~Lines 1329-1345]`.
- `[D2-INV-06, Unit 05, ~Line 1085]` — "Safety is non-bypassable whenever its Stage executes... No Stage or engine SHALL provide a path that skips a Safety Layer function for a Stage that does execute (D1-AB-05)."
- `[D3 §11.1, ~Line 803]` — "Only the Safety Layer may disqualify a Candidate or modify/defer/block a Terminal Decision."
- `[D3 §11.3, ~Line 838]` — "no component may bypass the Safety Layer at any of its three checkpoints (AI-06 does not permit an exception)."
- `[D3 §12.3, ~Line 886]` — "Where the Safety Layer or Decision Engine cannot be reached at all, the architecture SHALL NOT substitute a default Terminal Decision; D1-DI-02's prohibition on fabricating data extends, architecturally, to prohibiting a fabricated decision."
- `[T006 CD-T006-05, §1, ~Line 36]` — the Safety Layer is not implemented; only its integration contract (Safety Integration Port) is defined, with production code prohibited from bypassing or faking a Safety determination.
- `[T006 CD-T006-06, §1, ~Line 36]` — the deterministic mapping of the Safety Layer's five dispositions (`UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`) onto the four Terminal Decision kinds (`RECOMMENDATION`/`INITIATIVE`/`SILENCE`/`BOUNDARY`, with `boundaryType: REFUSAL | ESCALATION`).
- `[T006 §21.8, ~Lines 1064-1078]` — the `SafetyIntegrationPort` contract itself: `disqualify(candidatePool, pipelineContext): DisqualificationResult[]` and `finalReview(preReviewTerminalDecision, pipelineContext): SafetyReviewResult`.

## Canonical Interpretation
Six things are already canonically decided about the Safety Layer, and this package treats them as fixed, non-reopenable inputs: (1) it exists as one of six D3 §17 collaborators; (2) it has independent, non-bypassable authority at exactly three checkpoints; (3) its authority is limited to modify/defer/block/escalate of already-produced content — it does not originate ordinary Recommendation/Initiative content; (4) its absence must cause a Decision Pass to abort, never fabricate; (5) its five-value disposition vocabulary and their deterministic mapping onto four Terminal Decision kinds are fixed by CD-T006-06; (6) its integration contract (`disqualify()`/`finalReview()`) is fixed by CD-T006-05 and already implemented as a policy-free port.

## Explicit Non-Interpretations
This chapter does not restate these as if newly decided by this package — they are pre-existing canonical decisions cited, not authored, here. This chapter does not extend, narrow, or reinterpret any of the six items above.

## Repository Gaps
None specific to this chapter (it is an inventory of settled ground).

## Completion Checklist
- **Already decided:** The six items listed above.
- **Remains open:** Everything not listed above — see Ch. 16-28.
- **Owner:** N/A (already-approved decisions, per AIC/D1/D2/D3/T006).
- **Blocks SPEC:** No, for the six items themselves; the open items do block SPEC.

---

# 06. Safety Philosophy

## Purpose
Establish the philosophical foundation the Safety Layer must implement, as distinct from its architecture.

## Canonical Sources
AIC, CB.

## Required Repository Reading
AIC Ch.23 (full); CB Ch.1 §55-58, Ch.2 §5-6, Canonical Maintenance Policy, Manifesto.

## Repository Evidence
- `[AIC §23.1, ~Line 19024]` — "Safety Is Invisible Until It Is Needed"; "Safety should be embedded into every coaching decision. Not added afterwards."
- `[AIC §23.2, ~Line 19048]` — "Safety Overrides Every Other Objective... Safety always wins. This rule has no exceptions."
- `[AIC §23.20, ~Line 19646]` — "Safety Creates Freedom... Strong safety allows stronger coaching. Safety does not weaken coaching. It enables coaching."
- `[AIC Constitutional Reminder Ch.23, ~Line 19840]` — "The safest coach is not the one who says 'no' most often. The safest coach is the one who consistently helps users move toward better health while recognizing exactly where responsible coaching ends. That balance is the constitutional definition of safety inside FITME."
- `[CB Ch.2 §5, ~Line 2167]` — "At the base of the pyramid sits Safety and Trust. Nothing above this layer has any value if this layer is compromised... This layer is non-negotiable and is never traded away for a gain higher up the pyramid."
- `[CB Ch.1 §55.8, ~Line 1856]` — "No preference, goal, or adherence benefit may override safety or medical responsibility."
- `[CB Ch.2 §6, ~Line 2198]` — "When priorities conflict, the higher priority always wins. A lower priority is never permitted to override a higher one, regardless of how compelling the argument for doing so may seem in a specific case."

## Canonical Interpretation
Both AIC and CB independently and consistently establish safety as absolute, non-negotiable, and foundational rather than incremental — safety is not one factor weighed against others but a precondition for any coaching value to exist at all. Both frame safety as enabling rather than restricting coaching. This is convergent evidence across the two highest-precedence documents in the Skeleton's hierarchy with no contradiction found between them.

## Explicit Non-Interpretations
This chapter does not translate this philosophy into an engineering severity model, taxonomy, or disposition rule — that is Architecture/Task-SPEC territory per D1-AB-05's own boundary statement `[D1 Unit 14, ~Line 1018]`.

## Repository Gaps
None — philosophy is fully and consistently evidenced.

## Completion Checklist
- **Already decided:** Safety is absolute, foundational, and non-competing with other coaching priorities (AIC, CB, convergent).
- **Remains open:** Nothing at the philosophy level.
- **Owner:** N/A — settled.
- **Blocks SPEC:** No.

---

# 07. Safety Objectives

## Purpose
Establish the specific, actionable objectives the philosophy in Ch. 06 translates into.

## Canonical Sources
AIC, CB, D1.

## Required Repository Reading
AIC §23.7, Constitutional Principle 23, Decision Hierarchy (Ch.5); CB §55-58, Canonical Decision Hierarchy; D1 Unit 02.

## Repository Evidence
- `[AIC, Decision Hierarchy Ch.5, ~Line 3004]` — "1. Safety" is listed first among the constitutional decision-hierarchy tiers; "This hierarchy is constitutional. No future system may reverse it without changing the Constitution itself" `[~Line 3020]`.
- `[AIC Principle 23, ~Line 19678]` — "The FITME Coach should never ask: 'Can I answer this?' It should first ask: 'Can I answer this safely?' Safety is evaluated before intelligence. Always."
- `[CB §57, ~Line 1911]` — 10-tier Canonical Decision Hierarchy: "1. Safety 2. Medical responsibility 3. Trust 4. Long-term adherence 5. Context relevance 6. Goal alignment 7. User autonomy 8. Behavioral effort 9. Nutritional or training optimization 10. Product engagement."
- `[D1, Canonical Decision Hierarchy, Unit 02, ~Line 241]` — "1. Safety — no action may create physical or psychological harm."
- `[T004, Canonical Authority, ~Line 86]` — restates the identical 10-tier hierarchy at the engineering-spec level, confirming it has propagated unchanged from CB through D1 into the Composite Engine specs.

## Canonical Interpretation
The objective is precisely and consistently specified across four documents at different precedence levels: safety evaluation precedes every other coaching consideration, and "no action may create physical or psychological harm" is the operative standard. This propagation is unbroken — CB's 10-tier hierarchy reaches D1 and then T004 without alteration, satisfying D2's own "Governing Principle" that "every normative statement... MUST be traceable to D1 or an earlier approved canonical document" `[D2, Governing Principle, ~Line 84]`.

## Explicit Non-Interpretations
This chapter does not define what counts as "harm" in a way that could be operationalized into a severity score (see Ch. 17, GAP-01) — the objective is stated qualitatively, not quantitatively, in every source document reviewed.

## Repository Gaps
None specific to this chapter beyond GAP-01 (Ch. 17), which this chapter's evidence exposes but does not itself constitute.

## Completion Checklist
- **Already decided:** Safety is Tier 1 of the Canonical Decision Hierarchy, evaluated before intelligence, defined as "no physical or psychological harm."
- **Remains open:** Quantification/operationalization of "harm" (deferred to Ch. 17).
- **Owner:** N/A for the objective itself — settled.
- **Blocks SPEC:** No, for the objective; the operationalization gap does (see Ch. 17).

---

# 08. Responsibilities

## Purpose
Enumerate what the Safety Layer is affirmatively responsible for, per already-approved canonical decisions.

## Canonical Sources
D1, D2, D3, T006.

## Required Repository Reading
D2 Unit 07 "Safety Layer"; D3 §6.3-6.4, §11.1; T006 §21.

## Repository Evidence
- `[D2 Unit 07, ~Lines 1329-1345]` — three functions: "(a) Safety-triggered Opportunity creation — at Opportunity Detection... (b) Safety disqualification — at Winner Selection... (c) Final safety review — at Decision Formation, performs a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision."
- `[D2 Unit 07, "Outputs", ~Line 1349]` — "Mandatory Opportunities; disqualification determinations; modify/defer/block determinations."
- `[D2 Unit 07, "Dependencies", ~Line 1356]` — "None upstream — an independent authority. Every other engine is subordinate to it at the three checkpoints named above, and only at those checkpoints."
- `[D3 §6.4 Responsibility Matrix, ~Line 458]` — "Safety Layer | Cross-cutting checks at Stages 3, 8, 9 | Ordinary (non-safety) Recommendation/Initiative content."
- `[T006 §21.1-21.3, ~Lines 1022-1030]` — restates the three functions with Stage-specific mechanics: unconditional Opportunity injection bypassing Evidence/Eligibility gating (Stage 3); disqualification of Candidates conflicting with a D1 Unit 02 absolute override (Stage 8); final modify/defer/block authority (Stage 9).

## Canonical Interpretation
The Safety Layer's responsibilities are fixed and specific: it is the sole authority for three named actions at three named pipeline stages, and it is independent of every other collaborator at those stages ("None upstream"). This chapter treats these three functions as exhaustively defining "what the Safety Layer does" per current canonical decisions.

## Explicit Non-Interpretations
This chapter does not define *how* the Safety Layer decides to disqualify, modify, defer, block, or escalate (i.e., the policy logic behind these functions) — that is precisely the unresolved territory this package exists to flag, not fill (see Ch. 27-28).

## Repository Gaps
None specific to this chapter — the three functions are unambiguously and consistently evidenced across D2/D3/T006.

## Completion Checklist
- **Already decided:** The three functions, their checkpoints, and their independence from other collaborators.
- **Remains open:** The policy logic inside each function.
- **Owner:** Product/AI Architect, for the policy logic (Ch. 28, RCD-01).
- **Blocks SPEC:** No, for the three-function structure itself; the policy-logic gap does.

---

# 09. Non-Responsibilities

## Purpose
Enumerate what the Safety Layer must never do, and what other collaborators must never do in its place.

## Canonical Sources
D1, D2, D3, T004, T005, T006.

## Required Repository Reading
D2 Unit 07 "Forbidden Responsibilities"; D3 §6.4, §11.2, §11.3; T004/T005/T006 "Never owns" and Non-Goals sections.

## Repository Evidence
- `[D2 Unit 07, "Forbidden Responsibilities", ~Line 1351]` — "SHALL NOT be bypassed by any other engine or Stage, under any circumstance, at any of the three checkpoints above (D1-AB-05). SHALL NOT itself originate ordinary (non-safety) Recommendation or Initiative content — its authority is limited to the three functions above."
- `[D3 §6.4, ~Line 458]` — Forbidden column: "Ordinary (non-safety) Recommendation/Initiative content."
- `[D3 §11.2, ~Line 832]` — "Forbidden To Touch" table: Safety Layer forbidden from "Ordinary Recommendation/Initiative content generation."
- `[T004, Relationship to Previous Work, ~Line 482]` — the Recommendation Engine "Never owns... the final recommendation decision or its safety evaluation."
- `[T005 §2, ~Line 54]` and `[T005 §8, ~Line 233]` — the Initiative Engine explicitly does not hold "disqualification, modification, deferral, or blocking of any Candidate or Terminal Decision, and the mandatory pre-Expression safety evaluation."
- `[T006 §2, ~Line 57]` — the Decision Engine "does not own Safety authority (that remains the Safety Layer's exclusive authority at all three of its checkpoints)."
- `[T006 §9.2, ~Line 285]` — "The Decision Engine integrates with these functions at their fixed checkpoints; it does not perform, second-guess, or override them."
- `[T006 §13 item 7, ~Line 512]` — "No independent Safety judgment. (D2 Unit 07 Decision Engine Forbidden Responsibilities: 'SHALL NOT override the Safety Layer's disqualification or block/defer authority.')"

## Canonical Interpretation
Non-responsibility is symmetric and doubly enforced: the Safety Layer must not generate ordinary coaching content, and every other collaborator (Recommendation Engine, Initiative Engine, Decision Engine) must not perform any safety determination. This boundary is stated identically and without exception across all three built engines' specs, giving it strong convergent evidence.

## Explicit Non-Interpretations
This chapter does not address Expression's (the sixth, also-unbuilt collaborator's) relationship to Safety Layer output, since no canonical document yet describes Expression's responsibilities in detail — this is noted, not resolved, and is out of this package's scope (Ch. 03).

## Repository Gaps
None specific to this chapter — the boundary is unambiguous and repeated identically across every relevant document.

## Completion Checklist
- **Already decided:** The Safety Layer never originates ordinary content; no other collaborator ever makes a safety determination.
- **Remains open:** Nothing at the boundary-definition level.
- **Owner:** N/A — settled.
- **Blocks SPEC:** No.

---

# 10. Ownership Boundaries

## Purpose
Establish who owns which category of decision about the Safety Layer — Product, AI Architecture, or Engineering — per the Skeleton's Decision Ownership rules (§2, §Decision Ownership).

## Canonical Sources
EW, D1, D3, T006.

## Required Repository Reading
EW §2, §5, §6; D1 document header; D3 §2.3; T006 header.

## Repository Evidence
- `[EW §2, ~Line 11]` — "Ran — Product Owner (final business decisions). ChatGPT — Product Lead, AI Architect, Specification Owner, QA & Documentation. Claude — Lead Engineer (implementation only)."
- `[EW §5, ~Line 36]` — ChatGPT's responsibilities: "Architecture / Product decisions / SPEC / Engineering Review / Code Review / Documentation / Prompt design." Claude's: "Code implementation / Tests / Bug fixes / Refactoring only if approved."
- `[EW §6, ~Line 55]` — "No architecture changes without approval. No scope expansion."
- `[D1, document header, ~Line 6]` — "Owner: Head of Product + AI Architect. Prepared by: Lead Engineer (engineering expansion only — no product, coaching-logic, or authority decisions were introduced; see Consolidated Canonical Decision Requirements)."
- `[D1-AB-05, Unit 14, ~Line 1018]` — "D1 treats this as a binding constraint on any engine built to this specification; the evaluation's own implementation is Architecture/Task-SPEC territory (see CDR-3)."
- `[D3 §2.3, ~Line 107]` — "D3 introduces no product or coaching-logic policy at any point; Decisions 1-6 are exclusively architectural — they fix composition, ownership, and delivery boundaries, never what the coach decides." Also: "D3 is authored under the Engineering Workflow's role definitions (§2, §5): architecture and product decisions belong to the Head of Product and AI Architect; the Lead Engineer authors specifications against decisions already approved" `[~Line 100]`.
- `[T006, header, ~Line 8]` — "Applies Canonical Decisions: Decision 1 through Decision 6 (this document, §17), issued by the Head of Product and AI Architect, Canonical Review for D3."

## Canonical Interpretation
Ownership is unambiguous at the process level: every architectural and policy decision governing the Safety Layer to date has been issued by "the Head of Product and AI Architect," with Engineering (Lead Engineer) authoring specifications strictly against already-approved decisions. This is the same ownership structure this Decision Package itself must respect — consistent with the Skeleton's own Authority section (§2) naming the Lead Engineer/Canonical Documentation Expander role as forbidden from inventing Product policy, AI behaviour, or Architecture.

## Explicit Non-Interpretations
This chapter does not assign ownership of the *specific, still-undecided* Safety Layer policy content (severity model, reason codes, escalation mechanism, etc.) to any named individual beyond the general "Head of Product + AI Architect" role — no document names who will author or approve the eventual Safety Layer SPEC.

## Repository Gaps
None specific to this chapter — the ownership *process* is fully evidenced; the ownership of *specific open decisions* is addressed per-decision in Ch. 28.

## Completion Checklist
- **Already decided:** Product/Architecture decisions belong to Head of Product + AI Architect; Engineering implements only against approved decisions.
- **Remains open:** Nothing about the ownership *process* itself.
- **Owner:** N/A — settled (this is itself the answer).
- **Blocks SPEC:** No.

---

# 11. Pipeline Placement

## Purpose
Fix exactly where the Safety Layer sits within the canonical Coach Decision System pipeline.

## Canonical Sources
D2, D3, T006, PB, ARCH.

## Required Repository Reading
D2 Unit 03 "Canonical Pipeline"; D3 §6.1, §7.3; T006 §5.3, §21; PB §6; ARCH §21-23.

## Repository Evidence
- `[D2 Unit 03, ~Lines 442-468]` — full 13-stage pipeline: "Receive Inputs → Context Assembly → Opportunity Detection → Evidence Evaluation → Eligibility Evaluation → Candidate Generation → Prioritization → Winner Selection → Decision Formation → Expression → Feedback Processing → Evidence Update → Memory Update."
- `[D2 Unit 03, Stage 3, ~Line 493]` — Opportunity Detection: "Contributed to by the Recommendation Engine, Initiative Engine, and Safety Layer."
- `[D2 Unit 03, Stage 8, ~Line 522]` — Winner Selection: "Orchestration authority: Decision Engine, subject to Safety Layer disqualification authority."
- `[D2 Unit 03, Stage 9, ~Line 529]` — Decision Formation: "subject to the Safety Layer's final, non-bypassable evaluation (D1-AB-05)."
- `[D3 §6.1, ~Lines 351-393]` — Mermaid diagram places `SAF["Safety Layer"]` inside `CDS["Coach Decision System — one registered B2 Composite Engine"]` alongside Memory/Recommendation/Initiative/Decision/Expression, with `SAF -.watches.-> DEC`.
- `[D3 §7.3, ~Line 503]` — "with the Safety Layer attached at its three fixed checkpoints (D2 Unit 07)... D3 fixes only that these are distinct components with a narrow handoff between them; the sequencing logic itself remains exactly as D2 Unit 03 and Unit 04 define it."
- `[T006 §5.3, ~Line 145]` — restates the six-collaborator, single-Composite-Engine, single-B2-registration design.
- `[ARCH §23, ~Lines 875-881]` — "`js/coachDecisionSystem/safetyIntegrationPort.js` defines the Safety Integration Port — the platform-neutral call/response contract (`disqualify()` at Stage 8, `finalReview()` at Stage 9)... Production code has no path to bypass, downgrade, or fake a Safety determination through this port."
- **Contrast:** `[PB §6, ~Line 44]` — Product Bible's own stated pipeline: "Context → Memory → Patterns → Goals → Recommendation → Learning" — a flat six-node chain naming no safety/gate stage at all.

## Canonical Interpretation
At the D2/D3/Architecture level, pipeline placement is precise and consistent: the Safety Layer contributes at Stage 3, holds disqualification authority at Stage 8, and holds final review authority at Stage 9, with a concrete, already-implemented integration contract (`disqualify()`/`finalReview()`) confirmed in the repository. The Product Bible's own pipeline description, however, does not reflect any of this — see GAP-07 (Ch. 27).

## Explicit Non-Interpretations
This chapter does not resolve the Product Bible/Architecture pipeline-description mismatch (GAP-07) — it records it as evidence for Ch. 27, not as something Engineering may reconcile unilaterally.

## Repository Gaps
**GAP-07** — see Ch. 27.

## Completion Checklist
- **Already decided:** Three-stage placement (3, 8, 9) within the 13-stage D2 pipeline; single-Composite-Engine registration; existing policy-free integration port.
- **Remains open:** Whether the Product Bible's pipeline description should be revisited in light of the approved architecture.
- **Owner:** Product (Product Bible is PB's own stated territory, `[PB §13, ~Line 73]`).
- **Blocks SPEC:** No for placement itself (settled); the PB reconciliation is tracked as RCD-06 and does not block Safety-policy SPEC authoring specifically, but should be resolved for documentation consistency.

---

# 12. Safety Opportunity

## Purpose
Establish what evidence/trigger causes the Safety Layer to inject a mandatory Opportunity at Stage 3 — the first of its three checkpoints.

## Canonical Sources
AIC, D1, D2, T005, T006.

## Required Repository Reading
AIC §23.7; D1 Unit 05 (Opportunity Detection), Unit 06 (Intervention Eligibility); D2 Unit 07(a); T005 §15.8; T006 §10.2, §21.1.

## Repository Evidence
- `[AIC §23.7, ~Lines 19214-19230]` — enumerated high-risk situations: "Persistent chest pain. Sudden severe shortness of breath. Fainting. Severe allergic reactions. Rapid unexplained physical changes. Significant injuries. Symptoms suggesting acute medical illness."
- `[D1-OD-04, Unit 05, ~Line 470]` — "Safety/high-risk triggers SHALL bypass the pattern requirement in D1-OD-01 and SHALL be treated as opportunities on first occurrence."
- `[D1-IE-05, Unit 06, ~Line 520]` — "Safety/high-risk opportunities SHALL bypass this Unit's ordinary gating and SHALL always be eligible."
- `[D1 Unit 05, "Canonical Opportunity Sources", ~Line 449]` — "the enumerated symptom list in Constitution Ch.23 §23.7... and sustained body-image or disordered-eating distress patterns (Knowledge Base Topics 11, 20)."
- `[D2 Unit 07(a), ~Line 1329]` — "at Opportunity Detection, injects a safety/high-risk-triggered Opportunity unconditionally... which then bypasses only the ordinary Evidence Evaluation and Eligibility Evaluation gating for that specific Opportunity."
- `[T005 §15.8, ~Line 575]` — restates the same enumerated symptom list and the "first occurrence, no pattern required" exemption.
- `[T006 §10.2, ~Line 312]` — `OPPORTUNITY_SOURCES` vocabulary includes `SAFETY_HIGH_RISK` as one of five defined source categories.
- `[T005 §24, ~Line 896]` — confirms the Initiative Engine does not itself detect or inject this Opportunity — it arrives "via the Safety Layer's unconditional Stage-3 injection."

## Canonical Interpretation
The trigger condition for the Safety Layer's Stage-3 function is precisely enumerated (the AIC §23.7 symptom list plus disordered-eating/body-image patterns) and its exemption from ordinary evidence/eligibility gating is doubly confirmed by D1 and D2. `SAFETY_HIGH_RISK` is already a recognized, named category in the Decision Engine's own vocabulary, even though no engine yet produces it.

## Explicit Non-Interpretations
This chapter does not decide whether the AIC §23.7 list is exhaustive or illustrative, nor does it add categories beyond what is enumerated — any expansion of the trigger list is a Product/Coaching-philosophy decision, not an Engineering one.

## Repository Gaps
None specific to this chapter — the trigger definition itself is well-evidenced; what happens *after* injection (severity grading, disposition) is addressed in Ch. 16-18.

## Completion Checklist
- **Already decided:** The enumerated trigger list and its unconditional, pattern-exempt injection behavior.
- **Remains open:** Whether the list requires expansion or refinement (Product territory, not flagged as a gap by this package absent evidence of insufficiency).
- **Owner:** N/A for current scope — settled.
- **Blocks SPEC:** No.

---

# 13. Checkpoint One — Opportunity Detection (Stage 3)

## Purpose
Fully specify the Safety Layer's first checkpoint as a discrete decision point.

## Canonical Sources
D2, D3, T006.

## Required Repository Reading
D2 Unit 07(a); D2-INV-06; D3 §6.3; T006 §21.1.

## Repository Evidence
- `[D2 Unit 07(a), ~Line 1329]` — quoted in full in Ch. 12.
- `[D2-INV-06, Unit 05, ~Line 1085]` — "mandatory Opportunity injection whenever Opportunity Detection runs — every cycle, without exception."
- `[D3 §6.3, ~Line 434]` — "Safety Layer — architectural realization of D2 Unit 07's cross-cutting Safety Layer role, exercised at three checkpoints."
- `[T006 §21.1, ~Line 1022]` — restates the mechanics: unconditional injection, bypassing only Evidence/Eligibility gating for that specific Opportunity.

## Canonical Interpretation
Checkpoint One is an *injection* checkpoint, not an evaluative one — its output is a new Opportunity into the shared candidate pool, not a judgment on existing content. It runs unconditionally every cycle. This is architecturally and behaviorally distinct from Checkpoints Two and Three (Ch. 14-15), which act on content already produced by other collaborators.

## Explicit Non-Interpretations
This chapter does not define what happens to the injected Opportunity downstream beyond what D2's Stage 4-9 pipeline already specifies generically for any Opportunity — no safety-specific downstream handling beyond Checkpoints Two/Three is evidenced or should be assumed.

## Repository Gaps
None specific to this chapter.

## Completion Checklist
- **Already decided:** Mechanics, timing, and unconditional nature of Checkpoint One.
- **Remains open:** Nothing at the architectural level.
- **Owner:** N/A — settled.
- **Blocks SPEC:** No.

---

# 14. Checkpoint Two — Winner Selection (Stage 8)

## Purpose
Fully specify the Safety Layer's disqualification checkpoint.

## Canonical Sources
D1, D2, D3, T006.

## Required Repository Reading
D1-RP-07 (referenced); D2 Unit 07(b); D3 §11.1; T006 §21.2.

## Repository Evidence
- `[D2 Unit 07(b), ~Line 1339]` — "at Winner Selection, disqualifies any Candidate conflicting with a D1 Unit 02 absolute override (D1-RP-07), without affecting any other Opportunity's or Candidate's path through the ordinary gates."
- `[D1-AH-02, Unit 02, ~Line 266]` — the "categorical, absolute overrides" this checkpoint enforces: "a known allergy... an active instruction from a licensed healthcare professional... an active safety/high-risk symptom... and the five permanent commitments named in Coach Bible Ch.19 §2."
- `[D3 §11.1, ~Line 803]` — "Only the Safety Layer may disqualify a Candidate."
- `[T006 §21.2, ~Line 1026]` and `[ARCH §23, ~Lines 860-862]` — "`winnerSelection.js` (Stage 8 — exactly one winner by default... subject to Safety Layer disqualification ahead of final selection)."
- `[D2, Stage 8, ~Line 815]` — "If every Candidate is disqualified by the Safety Layer, the cycle SHALL resolve to Silence or refusal at Decision Formation, as D1 Unit 14 requires."

## Canonical Interpretation
Checkpoint Two is a *filtering* checkpoint operating on the already-assembled Candidate pool: it removes Candidates matching a fixed, categorical set of absolute overrides. Disqualification is binary (a Candidate either matches an absolute override or it does not) — no graded/partial disqualification concept exists in any document reviewed. The all-disqualified edge case is explicitly handled (falls through to Silence or refusal).

## Explicit Non-Interpretations
This chapter does not expand the absolute-override list beyond what D1-AH-02 already enumerates, and does not introduce a graded disqualification concept not present in the source documents.

## Repository Gaps
None specific to this chapter — the mechanics are fully evidenced; the *severity* question (whether disqualification should ever be partial/graded rather than binary) is addressed as GAP-01 (Ch. 27), since it touches the disposition model broadly, not this checkpoint's mechanics specifically.

## Completion Checklist
- **Already decided:** Binary disqualification mechanics, the fixed absolute-override list, and the all-disqualified fallback.
- **Remains open:** Whether disqualification should ever be non-binary (tracked under GAP-01/RCD-02, not unique to this checkpoint).
- **Owner:** N/A for current mechanics — settled; Product/AI Architect for RCD-02.
- **Blocks SPEC:** No for mechanics; RCD-02 blocks SPEC generally (Ch. 28).

---

# 15. Checkpoint Three — Decision Formation (Stage 9)

## Purpose
Fully specify the Safety Layer's final-review checkpoint, the most consequential of the three.

## Canonical Sources
D1, D2, D3, T006.

## Required Repository Reading
D1-AB-05; D2 Unit 07(c), Unit 04 Stage 9; D3 §11.1, §9; T006 §21.3-21.8, §24-25.

## Repository Evidence
- `[D2 Unit 07(c), ~Line 1343]` — "at Decision Formation, performs a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision (D1-AB-05)."
- `[D2 Unit 04, Stage 9, ~Line 846]` — "apply the final, independent Safety Layer evaluation with authority to modify, defer, or block, executed before Expression; where modified, deferred, or blocked, reform the Terminal Decision as a refusal/escalation instead of its original kind."
- `[D3, §9 Decision Lifecycle sequence diagram, ~Line 670]` — "DL->>SAF: Terminal Decision for final review / SAF-->>DL: modify/defer/block result."
- `[T006 §21.8, ~Lines 1064-1078]` — `finalReview()` contract: `SafetyReviewResult { disposition: 'UNMODIFIED'|'MODIFIED'|'DEFERRED'|'BLOCKED'|'ESCALATED', modifiedContent, reason }`.
- `[T006 §21.5, ~Line 1040]` — the CD-T006-06 mapping table (`UNMODIFIED`→unchanged; `MODIFIED`→original kind + modification record; `DEFERRED`→`SILENCE`; `BLOCKED`→`BOUNDARY`/`REFUSAL`; `ESCALATED`→`BOUNDARY`/`ESCALATION`).
- `[T006 §21.7, ~Line 1056]` — "production code must never simulate, stub, bypass, or fake Safety Layer evaluation to produce a deliverable Terminal Decision in its absence."

## Canonical Interpretation
Checkpoint Three is the *only* checkpoint with five possible outcomes and the only one that can alter a Terminal Decision's fundamental kind. It is fully specified at the contract level (input/output shape, deterministic mapping) but not at the policy level (what conditions produce which of the five dispositions) — that policy is exactly what remains undecided (Ch. 27-28).

## Explicit Non-Interpretations
This chapter does not decide what conditions should produce `MODIFIED` versus `DEFERRED` versus `BLOCKED` versus `ESCALATED` — no document reviewed states this, and inventing it would be an invented severity/disposition policy, forbidden to this package.

## Repository Gaps
**GAP-01, GAP-02, GAP-04** apply directly to this checkpoint — see Ch. 27.

## Completion Checklist
- **Already decided:** Contract shape, five-value vocabulary, deterministic mapping onto Terminal Decision kinds, non-bypassability, fail-closed behavior on Safety Layer absence.
- **Remains open:** The policy logic that selects among the five dispositions; the reason-code taxonomy; the escalation mechanism.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 16. Safety Taxonomy

## Purpose
Determine whether a formal categorization of risk/harm types exists that a Safety Layer implementation could apply.

## Canonical Sources
AIC, CB, D1, T005.

## Required Repository Reading
AIC §17.5, §17.10, §23.7, §23.9; D1 Unit 03, Unit 05; T005 §15.8.

## Repository Evidence
- `[AIC §17.5, ~Lines 13436-13468]` — Health Profile data fields: "Allergies, Food intolerances, Chronic diseases, Previous surgeries, Previous injuries, Medications, Pregnancy status, Recovery limitations, Digestive conditions, Blood pressure, Cholesterol, Diabetes, Kidney disease, Heart disease."
- `[AIC §23.7, ~Lines 19214-19230]` — high-risk situations (quoted in Ch. 12).
- `[AIC §23.9, ~Lines 19282-19298]` — eating-disorder indicators: "Extreme restriction. Compulsive exercise. Obsessive calorie fixation. Fear of eating."
- `[D1 Unit 03, "Health/Safety Profile", ~Line 315]` — "This category feeds the absolute overrides in Unit 02."
- `[D1-AB-02, Unit 14, ~Line 993]` — "sustained or severe distress or dysfunction that exceeds ordinary coaching scope — including disordered eating, sustained body-image distress, chronic unresponsive stress, or a mental-health concern."
- `[CB Ch.17 §3, ~Line 4594]` — "These are not three separate boundaries that happen to resemble each other. They are one boundary... safety and medical responsibility outrank every other consideration this book has ever described." (CB deliberately treats "exceeds coaching scope" as a single unified trigger, not a differentiated taxonomy.)
- `[T005 §15.8, ~Line 575]` — restates the AIC §23.7 list identically; no new categories added.

## Canonical Interpretation
A taxonomy exists, but it is a flat list of triggers (physical symptoms, health-profile categories, and a small set of behavioral-distress patterns), not a structured, hierarchical, or coded classification system. The Coach Bible explicitly and deliberately resists building a differentiated harm taxonomy, treating "exceeds coaching scope" as one unified trigger applied identically across domains. This is a philosophical choice, not an oversight — CB frames it as intentional (`[CB Ch.17 §3, ~Line 4594]`).

## Explicit Non-Interpretations
This chapter does not construct a graded or coded taxonomy where the source documents deliberately chose a flat, unified one — doing so would contradict CB's explicit "one boundary, not three" framing.

## Repository Gaps
None specific to this chapter in the sense of missing categories; but the flat, non-coded nature of the taxonomy is directly relevant to GAP-02 (Ch. 27) since a reason-code taxonomy would need to decide whether to preserve this flatness or adopt a different structure than CB describes.

## Completion Checklist
- **Already decided:** The trigger list itself, and CB's explicit philosophical choice to keep it unified rather than differentiated.
- **Remains open:** Whether an engineering reason-code taxonomy should mirror this flatness or add structure (RCD-03, Ch. 28).
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes (via RCD-03).

---

# 17. Severity Model

## Purpose
Determine whether a formal severity/harm-grading model exists for the Safety Layer to apply.

## Canonical Sources
AIC, CB, D1, T006 (absence checked across all).

## Required Repository Reading
Full-text review for severity/grading/scoring language across AIC, CB, D1, D2, D3, T004-T006 (already performed during evidence extraction).

## Repository Evidence
- `[AIC §11.6, ~Lines 7666-7796]` — Recommendation Hierarchy Levels 1-4 (Critical/High Impact/Optimization/Educational) — an **impact/priority** ranking, not a harm-severity score.
- `[D1-PR-02, Unit 07, ~Line 547]` — "Level 1 Critical (immediate health/safety, overrides almost everything) > Level 2 High Impact > Level 3 Optimization > Level 4 Educational" — restates the same impact tiers, explicitly nested *within* Hierarchy tiers, not a harm-severity axis.
- `[CB Ch.3 §10, ~Line 2578]` — a confidence gradient exists ("Because confidence is graded rather than binary...") but this grades **epistemic certainty**, not harm severity.
- `[CB Ch.3 §4, ~Line 2486]` — "an isolated event can be serious enough, on its own terms, to warrant a response regardless of whether it repeats" — the single closest approach to a severity concept in the entire repository, and it is stated once, with no criteria for what makes an event "serious enough," and never revisited elsewhere (see GAP-08).
- `[T006 §21.2, ~Line 1026]` — disqualification is a binary match/no-match against a fixed absolute-override list, confirmed to carry no severity gradation.
- Full-text review across all 13 documents confirms: **no numeric, tiered, or coded harm/risk severity scale exists anywhere in the repository.**

## Canonical Interpretation
No severity model exists. Every candidate mechanism found (Recommendation impact tiers, confidence gradients, the single-event exception) grades something other than harm severity, or grades it only implicitly and without operational criteria. This is a genuine, repository-wide absence, not a matter of interpretation.

## Explicit Non-Interpretations
This chapter does not construct a severity model from the adjacent mechanisms above (impact tiers, confidence gradients) — doing so would be inventing a severity model, which is explicitly forbidden to this package.

## Repository Gaps
**GAP-01** (primary), **GAP-08** (contributing) — see Ch. 27.

## Completion Checklist
- **Already decided:** Nothing — this is a confirmed absence.
- **Remains open:** Whether/how a severity model should be defined at all.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 18. Disposition Model

## Purpose
Fully specify what happens to content once the Safety Layer acts on it.

## Canonical Sources
D1, D2, D3, T006.

## Required Repository Reading
D1 Unit 14, Unit 15; D2 Unit 04 Stage 9, Unit 07; D3 §9; T006 §21.5, §24-25.

## Repository Evidence
- `[D1, Unit 15, ~Lines 1047-1055]` — "Every decision produced under this specification resolves to exactly one of four kinds: a Recommendation, an Initiative, a deliberate Silence, or a refusal or escalation."
- `[T006 §21.5, ~Line 1040]`, mapping table (quoted in full at Ch. 15): `UNMODIFIED`→unchanged; `MODIFIED`→original kind + modification record (never reformed to `BOUNDARY`); `DEFERRED`→`SILENCE`; `BLOCKED`→`BOUNDARY`/`REFUSAL`; `ESCALATED`→`BOUNDARY`/`ESCALATION`.
- `[T006 §25, ~Lines 1324-1333]` — the `modification` field on a Terminal Decision: "present ONLY when the Safety Layer's Stage-9 final review returned MODIFIED... `modifiedContent: <object>` // the Safety Layer's own modified content, per the Safety Integration Port's SafetyReviewResult — not authored by the Decision Engine itself."
- `[T006 §24.5, ~Line 1246]` — "Where the Safety Layer returns BLOCKED, Decision Formation does not silently substitute a different, unblocked Candidate in its place."
- `[T006 §21.4, ~Line 1034]` — "D1-AB-02 separately fixes the professional-referral escalation authority the ESCALATED disposition realizes."

## Canonical Interpretation
The disposition model is fully specified at the *contract* level: five dispositions, a deterministic mapping onto four decision kinds, and explicit rules preventing silent substitution or re-authoring. It is not specified at the *policy* level: no document states the conditions under which the Safety Layer should choose `MODIFIED` over `DEFERRED` over `BLOCKED` over `ESCALATED` for a given input.

## Explicit Non-Interpretations
This chapter does not infer disposition-selection policy from the disposition *vocabulary* — a five-value enum does not itself imply decision criteria, and none should be assumed.

## Repository Gaps
**GAP-01, GAP-02** apply — see Ch. 27.

## Completion Checklist
- **Already decided:** The five-value vocabulary, the deterministic mapping, and the no-silent-substitution rule.
- **Remains open:** The policy that selects among the five values for a given input.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 19. Refusal Policy

## Purpose
Establish what is already decided about refusal as a Safety Layer disposition.

## Canonical Sources
AIC, D1, T006.

## Required Repository Reading
AIC §23.14; D1-AB-03; T006 §24.1, §24.4, §11, §33.

## Repository Evidence
- `[AIC §23.14, ~Lines 19438-19462]` — "Sometimes the safest coaching decision is refusal. When a request conflicts with the constitutional principles of health and safety... the coach should respectfully decline while offering safer alternatives whenever appropriate. Refusal should feel protective. Not judgmental."
- `[D1-AB-03, Unit 14, ~Line 1003]` — "The coach MAY refuse a request that conflicts with a safety or health principle. The refusal SHALL be framed as protective, not judgmental, and SHALL offer a safer alternative where one exists."
- `[T006 §24.1, ~Line 1229]` — "`BLOCKED` → reformed to `kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'` — D1-AB-03: 'The coach MAY refuse a request that conflicts with a safety or health principle... framed as protective, not judgmental.'"
- `[T006 §24.4, ~Line 1244]` — "a refusal SHALL be framed as protective, not judgmental, and SHALL offer a safer alternative where one exists."
- `[T006 §33, ~Line 1705]` — "Refusal when authority is insufficient... Where the Safety Layer's determination requires it, the Decision Engine correctly forms a refusal Terminal Decision rather than attempting to salvage a blocked outcome through its own independent judgment."

## Canonical Interpretation
Refusal policy is well-specified at the *tone/framing* level (protective, not judgmental, safer-alternative-offered where possible) and at the *contract* level (`BLOCKED` → `BOUNDARY`/`REFUSAL`), consistently from AIC through D1 through T006 with no contradiction. It is not specified at the *trigger* level beyond "conflicts with a safety or health principle" — no enumerated list of refusal-triggering conditions distinct from the general disqualification/block criteria exists.

## Explicit Non-Interpretations
This chapter does not enumerate specific refusal-triggering scenarios beyond what AIC/D1 already state in general terms — doing so would invent policy content.

## Repository Gaps
None beyond what is already captured in GAP-01/GAP-02 (the general disposition-policy gap covers refusal's trigger conditions too).

## Completion Checklist
- **Already decided:** Framing/tone requirements, and the `BLOCKED`→`REFUSAL` contract mapping.
- **Remains open:** Specific trigger conditions beyond the general "conflicts with a safety or health principle" standard (covered by GAP-01/GAP-02).
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes, via GAP-01/GAP-02.

---

# 20. Escalation Policy

## Purpose
Establish what is already decided about escalation as a Safety Layer disposition, and what remains entirely undefined.

## Canonical Sources
AIC, D1, T006.

## Required Repository Reading
AIC §23.6; D1-AB-02; T006 §21.4, §24.1, §11.

## Repository Evidence
- `[AIC §23.6, ~Lines 19178-19206]` — "Certain situations require a different kind of coaching. When the coach identifies signs suggesting that professional medical evaluation may be appropriate, it should encourage the user to seek appropriate care. The coach remains supportive. It does not attempt to replace healthcare professionals. The transition should feel natural. Not alarming."
- `[D1-AB-02, Unit 14, ~Line 993]` — "On recognizing this threshold, the coach SHALL calmly encourage appropriate professional support; it SHALL NOT diagnose, and it SHALL NOT withdraw ordinary coaching support within its own remaining scope."
- `[T006 §24.1, ~Line 1230]` — "`ESCALATED` → reformed to `kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'` — D1-AB-02's professional-referral threshold, or a Constitution Ch.23 §23.7 high-risk-symptom Opportunity's Stage-9 disposition."
- `[T006 §11, ~Line 450]` — "Escalation — a BOUNDARY-kind Terminal Decision with boundaryType: 'ESCALATION', resulting from the Safety Layer's ESCALATED disposition at Stage 9 under D1-AB-02's professional-referral threshold or a comparable Unit 14 determination."
- **Critical absence:** No document reviewed — AIC, CB, D1, D2, D3, T004, T005, T006, RM, or CL — states what "escalation" *does* beyond producing a user-facing message encouraging professional care. No document names a receiving system, a human-in-the-loop process, a support-ticket mechanism, or any downstream action beyond the coach's own words to the user. AIC itself only lists "Risk Escalation" as a **required future module**, not yet built: `[AIC Ch.17 Engineering Implications, ~Line 14228]` — "* Risk Escalation" among modules "alongside Allergy Safety, Medication Awareness, Recovery Coaching, Chronic Condition Adaptation, Laboratory Trend Analysis, Medical Referral Guidance."

## Canonical Interpretation
Escalation, as currently defined end-to-end, means: the coach's own next message encourages the user to seek professional care, framed supportively and non-alarmingly. It does **not** currently mean any escalation to a human, support system, or external process — that broader meaning is named only as an aspirational, unbuilt "Risk Escalation" module in AIC's own engineering-implications list. Conflating the `ESCALATED` disposition with a "someone gets notified" mechanism is not supported by any document.

## Explicit Non-Interpretations
This chapter does not assume escalation implies human notification, a support queue, or any system beyond the coach's own conversational output — no evidence supports that inference, and assuming it would invent AI/Product behavior.

## Repository Gaps
**GAP-04** — see Ch. 27. This is one of the most consequential gaps in this package: "escalation" is the disposition most likely to be assumed (by a future implementer) to mean something it has never been defined to mean.

## Completion Checklist
- **Already decided:** Escalation's tone/framing and its contract mapping (`ESCALATED`→`BOUNDARY`/`ESCALATION`).
- **Remains open:** Whether escalation means anything beyond a coach message — i.e., the entire downstream mechanism.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 21. Modification Policy

## Purpose
Establish what is already decided about modification as a Safety Layer disposition.

## Canonical Sources
D1, D2, T006.

## Required Repository Reading
D1-AB-05; D2 Unit 06; T006 §21.5, §24.1, §25.

## Repository Evidence
- `[D1-AB-05, Unit 14, ~Line 1013]` — "authority to modify, defer, or block it."
- `[D2 Unit 06, ~Line 1171]` — "Its kind, rationale, and content are assembled at Decision Formation and MAY differ from the Winner Candidate's (or Candidates') own content where the Safety Layer's final review modifies, defers, or blocks it."
- `[T006 §24.1, ~Line 1227]` — "`MODIFIED` → the Terminal Decision keeps its original kind... the modification's substance originates from the Safety Layer, not from the Decision Engine re-authoring the Candidate itself... `MODIFIED` never produces a BOUNDARY kind."
- `[T006 §25, ~Lines 1324-1333]` — the `modification` record field: present only on `MODIFIED`, carries `modifiedContent` authored by the Safety Layer itself, "not authored by the Decision Engine."
- `[T006 §25.4, ~Line 1376]` — "`modification` is present if and only if `safetyDisposition.disposition === 'MODIFIED'`."

## Canonical Interpretation
Modification is fully specified at the contract level: it preserves the original decision kind, carries an explicit record distinguishing Safety-Layer-authored content from Decision-Engine-authored content, and is mutually exclusive with the `BOUNDARY` kinds. It is not specified at the policy level: no document states what kinds of content changes the Safety Layer is expected to make (e.g., softening language, removing a specific unsafe instruction, adding a caveat) versus when it should instead defer/block/escalate entirely.

## Explicit Non-Interpretations
This chapter does not enumerate example modifications or infer a threshold between "modify" and "block" — no such threshold is stated anywhere in the repository.

## Repository Gaps
Covered by **GAP-01/GAP-02** (general disposition-policy gap) — no new gap unique to modification beyond what those two already capture.

## Completion Checklist
- **Already decided:** Contract shape and provenance-tracking (modification record, kind preservation).
- **Remains open:** The threshold/criteria for choosing modification over other dispositions.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes, via GAP-01/GAP-02.

---

# 22. Missing Context Policy

## Purpose
Establish what the Safety Layer, and the pipeline around it, must do when required context or the Safety Layer itself is unavailable.

## Canonical Sources
AIC, CB, D1, D2, D3, T006.

## Required Repository Reading
AIC §23.15; CB Ch.3 §7, §10-11; D1-DI-04, D1-ER-04, D1-ER-06; D2-EF-08; D3 §12.3; T006 §14.12, §21.7.

## Repository Evidence
- `[AIC §23.15, ~Lines 19466-19478]` — "The coach should never make users believe they are medically safe simply because no obvious concerns are visible. Absence of evidence is not evidence of absence. Humility protects users."
- `[CB Ch.3 §7, ~Line 2534]` — "Missing information becomes relevant, and it deserves to be treated as a first-class part of reasoning rather than an inconvenience... the absence itself is a form of evidence, not simply a blank to be ignored."
- `[D1-DI-04, Unit 03, ~Line 340]` and `[D1-ER-04, Unit 11, ~Line 822]` — "The absence of an expected input... SHALL itself be treated as evidence, not ignored."
- `[D1-ER-06, Unit 11, ~Line 831]` — "The coach SHALL NOT manufacture false certainty or false reassurance; absence of evidence is not evidence of absence."
- `[D2-EF-08, Unit 08, ~Line 1501]` — "The absence of a given Decision Input category at Context Assembly SHALL itself be treated as evidence and SHALL NOT, by itself, force a Pipeline Abort; the cycle SHALL proceed using the categories that are available."
- `[D3 §12.3, ~Lines 884-890]` — "Where a Decision Input category is absent, the architecture SHALL proceed using the categories available rather than treating absence as a Pipeline Abort. Where the Safety Layer or Decision Engine cannot be reached at all, the architecture SHALL NOT substitute a default Terminal Decision; D1-DI-02's prohibition on fabricating data extends, architecturally, to prohibiting a fabricated decision."
- `[T006 §14.12.1, ~Line 613]` — "For any arbitration-metadata field for which no already-existing, already-canonical data source is currently traceable in the repository, the field's value is the literal sentinel `NO_SIGNAL` — never a fabricated number, never an inferred estimate, and never simply omitted." Also: "`NO_SIGNAL` never outranks a real, non-`NO_SIGNAL` value" `[~Line 615]`.
- `[T006 §21.7, ~Line 1056]` — "production code must never simulate, stub, bypass, or fake Safety Layer evaluation to produce a deliverable Terminal Decision in its absence."

## Canonical Interpretation
This is one of the most thoroughly and consistently evidenced policies in the entire repository, propagating unbroken from AIC and CB (philosophical level) through D1/D2 (policy level) to D3/T006 (architectural/contract level): missing context is itself evidence, never grounds for fabrication, and never grounds for silently proceeding as if nothing were missing. Applied specifically to the Safety Layer: its unavailability must abort the Decision Pass rather than produce a fabricated or default-safe Terminal Decision.

## Explicit Non-Interpretations
This chapter does not decide what user-facing behavior should occur when a Decision Pass aborts due to Safety Layer unavailability (e.g., what message, if any, reaches the user) — no document specifies this, and it borders on Expression's (unbuilt) territory.

## Repository Gaps
The user-facing behavior on abort is a minor, narrow gap not separately numbered here, since it is subsumed by Expression being wholly unbuilt (out of this package's scope per Ch. 03) rather than being Safety-Layer-specific.

## Completion Checklist
- **Already decided:** Missing-context-as-evidence principle; fail-abort (never fail-fabricate) behavior on Safety Layer unavailability; `NO_SIGNAL` sentinel mechanics.
- **Remains open:** User-facing abort behavior (Expression territory, out of scope here).
- **Owner:** N/A for the core policy — settled.
- **Blocks SPEC:** No.

---

# 23. Evidence Policy

## Purpose
Establish what standard of evidence the Safety Layer must meet or apply before acting.

## Canonical Sources
AIC, CB, D1, T006.

## Required Repository Reading
AIC §22.11; CB Ch.3 §4, §10; D1 Unit 11 "Evidence Hierarchy"; D1-RP-02; T006 §14.3, §24.4.

## Repository Evidence
- `[AIC §22.11, ~Lines 18510-18534]` — "Whenever scientific evidence exists... the coach should prefer evidence. Whenever evidence is uncertain... the coach should communicate uncertainty."
- `[CB Ch.3 §4, ~Line 2484]` — "The coach never reacts to one event. A single occurrence is data. Only a pattern is evidence" — qualified immediately by the single-event exception already discussed in Ch. 17/GAP-08.
- `[D1, Unit 11 "Evidence Hierarchy", ~Lines 790-804]` — five ranked tiers: "1. Explicit User Statement (highest) 2. Explicit User Action 3. Repeated Behaviour 4. Single Behaviour... 5. Inference (lowest) — SHALL NOT be presented to the user, or treated internally, as fact."
- `[D1-RP-02, Unit 08, ~Line 604]` — "Every Recommendation SHALL have an explicit, statable coaching rationale. If no rationale can be stated, the Recommendation SHALL NOT be delivered — it resolves to Silence instead."
- `[T006 §14.3, ~Line 558]` — "`rationale` — D1-RP-02, the statable reason without which a Candidate would not exist at all, required on every Candidate."
- `[T006 §33, ~Line 1703]` — "Honest uncertainty... confidence is preserved and communicated honestly, never manufactured or inflated to make a Candidate appear more winnable than its actual evidentiary basis supports."
- Note (Ch. 12): the Safety-trigger exemption (`D1-OD-04`) is explicitly a **carve-out from** the ordinary pattern-based evidence requirement — safety triggers act on single occurrences by design, which is the one place the general Evidence Hierarchy is deliberately overridden.

## Canonical Interpretation
A five-tier evidence hierarchy governs ordinary coaching decisions, with Inference (the lowest tier) barred from being treated as fact. The Safety Layer's own trigger mechanism is the one explicit, canonical exception to the "pattern over single event" default — consistent with, not contradicting, the general evidence policy, since the exception is itself codified (D1-OD-04) rather than inferred.

## Explicit Non-Interpretations
This chapter does not extend the single-event safety exception beyond the enumerated AIC §23.7 list — doing so would re-open the taxonomy question addressed in Ch. 16, not the evidence-standard question addressed here.

## Repository Gaps
None specific to this chapter beyond GAP-08 (Ch. 17/27), which concerns the undeveloped "how serious is serious enough" criterion, not the evidence-tier structure itself.

## Completion Checklist
- **Already decided:** The five-tier Evidence Hierarchy and its safety-specific exception.
- **Remains open:** GAP-08's operationalization question.
- **Owner:** Product/AI Architect (for GAP-08 only).
- **Blocks SPEC:** Yes, via GAP-08.

---

# 24. Reason Code Catalog

## Purpose
Determine whether a closed, machine-readable taxonomy of reasons exists for Safety Layer determinations specifically.

## Canonical Sources
D1, T005, T006 (absence checked; adjacent enums documented for contrast).

## Required Repository Reading
D1 "Shared Vocabulary"; T005 §28; T006 §14.11, §15.11, §21.8, §25.

## Repository Evidence
- `[D1, Shared Vocabulary, ~Line 115]` — the closed **Feedback Type** vocabulary (Accepted, Completed, Dismissed, Rejected, Ignored, Expired, User Corrected, User Confirmed) is the closest analogue to a reason-code system anywhere in D1, and it classifies user *responses*, not Safety Layer *determinations*.
- `[T005 §28, ~Line 1004]` — explicit acknowledgment of absence: "this document does not fix a closed reason-code enum, since none is fixed canonically for Initiative specifically — an implementation-level detail, not a canonical gap requiring escalation" (T005's own framing, concerning Initiative rationale text, not Safety).
- `[T006 §15.11, ~Lines 711-717]` — a **closed** 7-value `validReasonCategory` enum exists, but it classifies *why an Opportunity is worth acting on* (`PREVENT_PREDICTABLE_MISTAKE`, `HELP_BEFORE_DIFFICULT_DECISION`, etc.) — it is the Decision Engine's Stage-5 eligibility vocabulary, not the Safety Layer's.
- `[T006 §21.8, ~Lines 1064-1078]` — the Safety Integration Port's own contracts: `DisqualificationResult { opportunityProvenance, disqualified: boolean, reason: <string|null> }` and `SafetyReviewResult { disposition: <5-value enum>, modifiedContent, reason: <string|null> }`. **The `disposition` field is a closed enum; the `reason` field accompanying it is an open, unconstrained string in both contracts.**

## Canonical Interpretation
No closed reason-code taxonomy exists for *why* the Safety Layer disqualifies, modifies, defers, blocks, or escalates something. The `disposition` enum (5 values) tells a caller *what* happened; the `reason` field, which would tell a caller *why*, is deliberately left as free text at the current baseline — not a canonical omission error, but an explicitly unresolved policy question (T005 §28 shows the project is aware such gaps exist and does not treat every open enum as automatically blocking; this package nonetheless flags this one as blocking, per Ch. 27's reasoning, because it is Safety-specific and downstream systems — e.g., analytics, audit, future Expression logic — cannot safely branch on unconstrained free text for a non-bypassable authority).

## Explicit Non-Interpretations
This chapter does not construct a reason-code enum from the taxonomy evidence in Ch. 16 — doing so would invent a taxonomy the source documents do not themselves specify at the reason-code level of granularity.

## Repository Gaps
**GAP-02** — see Ch. 27.

## Completion Checklist
- **Already decided:** The `disposition` enum (what) and the free-text `reason` field (unconstrained why).
- **Remains open:** Whether/how to constrain `reason` into a closed taxonomy.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 25. Safety Layer v1 Scope

## Purpose
Establish precisely what has and has not been built for the Safety Layer as of the repository baseline.

## Canonical Sources
T006, ARCH, CL.

## Required Repository Reading
T006 §1, §9.3, §21.7-21.8, §38 (G-6), §48; ARCH §23; CL TASK-006 entry.

## Repository Evidence
- `[T006 §1, ~Line 36]` — "CD-T006-05 (the Safety Layer is not implemented by TASK-006; only the Safety Integration Port/contract is defined; a deterministic test double is permitted in tests; production SHALL NOT bypass or fake Safety)."
- `[T006 §9.3, ~Line 289]` — "The Safety Layer and Expression collaborators remain unbuilt after TASK-006, per D3 §17's six-collaborator design being realized incrementally (TASK-004: two of six; TASK-005: three of six; TASK-006: four of six)."
- `[T006 §21.8, ~Line 1060]` — "TASK-006 does not implement the Safety Layer. It defines only the integration contract."
- `[ARCH §23, ~Lines 875-883]` — confirms `safetyIntegrationPort.js` "contains no Safety Layer policy logic of its own," and a test-only double exists (`tests/fixtures/safetyIntegrationPortTestDouble.js`) "confirmed by a dedicated regression test to be unreachable from any production module."
- `[T006 §38, G-6, ~Line 2004]` — "Repository Gap: No Safety Layer implementation exists — Port now defined (Canonical Decision CD-T006-05)... Required resolution: a future, separately-scoped Safety Layer task (not named on the current Roadmap as of this document's authoring)."
- `[T006 §48, ~Line 2286]` — "Implementing the Safety Layer as part of TASK-006 — explicitly excluded... except for the required integration contract/port and a test-only deterministic double... never a production bypass or fake."
- `[CL, TASK-006 entry, ~Lines 56-62, 105-107]` — confirms the same at the changelog level: the port contract shipped; policy logic did not; production cannot reach the test double.

## Canonical Interpretation
"Safety Layer v1," as it exists in the repository today, consists **exclusively** of: (1) a policy-free integration port (`safetyIntegrationPort.js`) with two methods (`disqualify()`, `finalReview()`); (2) the deterministic disposition-to-decision-kind mapping (CD-T006-06); (3) fail-abort behavior on Safety Layer absence; (4) a test-only double, verified unreachable from production. No policy logic, severity model, reason-code taxonomy, or escalation mechanism exists in any implemented form.

## Explicit Non-Interpretations
This chapter does not treat the port's existence as implying that policy logic is "mostly done" or "just needs plugging in" — the port is a boundary contract only; the entire decision-making substance behind it is unbuilt and unspecified.

## Repository Gaps
None new — this chapter consolidates GAP-01 through GAP-04 as they apply to "what's missing to go from port to real Safety Layer."

## Completion Checklist
- **Already decided:** The exact boundary of what v1 contains (port + mapping + fail-abort + test double).
- **Remains open:** Everything behind the port (Ch. 27-28).
- **Owner:** Product/AI Architect, for authorizing and scoping the next task.
- **Blocks SPEC:** Yes.

---

# 26. Out-of-Scope

## Purpose
Enumerate what a future Safety Layer SPEC would need to define that this package explicitly does not and cannot define.

## Canonical Sources
D2, D3, T006 (scope disclaimers), Skeleton §2, §6.

## Required Repository Reading
D2/D3 "Does NOT Define" sections; T006 §9.2, §48; Skeleton "Forbidden" instructions per chapter.

## Repository Evidence
- `[D2, "D2 Does NOT Define", ~Line 69]` — "Safety policy... Engineering implementation."
- `[D3 §2.2, ~Line 87]` — "Decision policy... not restated here."
- `[T006 §48, ~Line 2286]` — Safety Layer policy logic "explicitly excluded" from TASK-006.
- Skeleton §2 — "Forbidden: Invent Product policy. Invent AI behaviour. Invent Architecture... Write implementation. Write code."

## Canonical Interpretation
Out of scope for this package, and reserved for a future SPEC once Ch. 28's Required Canonical Decisions are resolved: (1) the actual policy logic behind `disqualify()`/`finalReview()`; (2) what distinguishes the Safety Layer's available dispositions from one another; (3) how Safety decisions should communicate their rationale; (4) what escalation means within the FITME coaching system; (5) how AIC's three overlapping filter concepts (Ch.11/Ch.17/Ch.23 — GAP-05) relate to one another; (6) Expression's handling of `BOUNDARY`-kind and `MODIFIED` Terminal Decisions (Expression itself is unbuilt); (7) any UI/UX treatment of safety-driven output.

## Explicit Non-Interpretations
This chapter does not sketch even a preliminary design for any of the seven items above — doing so, even as a "strawman," would cross into Product/Architecture territory this package's Authority section forbids.

## Repository Gaps
Cross-references GAP-01 through GAP-05.

## Completion Checklist
- **Already decided:** The exact boundary of what remains out of scope.
- **Remains open:** All seven items, pending Ch. 28.
- **Owner:** Product/AI Architect.
- **Blocks SPEC:** Yes.

---

# 27. Canonical Gap Analysis

## Purpose
Consolidate every gap identified across Ch. 01-26 into the Skeleton's required Gap format (§7).

## Canonical Sources
All 13 documents, as evidenced in preceding chapters.

## Required Repository Reading
N/A — this chapter aggregates, it does not introduce new reading.

## Repository Evidence
Aggregated from Ch. 06-26; see each gap entry below for its originating citations.

## Canonical Interpretation

### Primary Gaps (created by the absence of a future Safety Layer SPEC)

**GAP-01 — No Severity Model — RESOLVED**
- Gap Type: Repository / Architecture
- Repository Evidence: Ch. 17 (AIC §11.6 impact tiers, D1-PR-02, CB Ch.3 §4/§10 — none of which grade harm severity; full-text review confirms total absence).
- Why this was a gap: The Safety Layer had to choose among five dispositions (Ch. 15, Ch. 18) with no stated criteria distinguishing them by severity.
- Resolution: RCD-02 (Ch. 28) — the Head of Product + AI Architect approved a deterministic Safety Decision Matrix evaluating Risk Type, Evidence Confidence, Correctability, and Urgency, explicitly ruling out a generic numerical severity score.
- Further specified by: RCD-09 and RCD-10 (Ch. 28) — the Head of Product + AI Architect subsequently fixed the Matrix's disposition-selection policy (protective precedence, per-disposition trigger conditions, the all-disqualified Silence/Refusal split) and the derivation rule for each of the four dimensions. No Safety Decision Matrix content remains undefined at the canonical-decision level.
- Blocks SPEC: **No** (resolved).

**GAP-02 — No Closed Reason-Code Taxonomy for Safety Determinations — RESOLVED**
- Gap Type: Repository / Architecture
- Repository Evidence: Ch. 24 (T006 §21.8's free-text `reason` field alongside the closed `disposition` enum).
- Why this was a gap: Downstream systems (audit, analytics, a future Expression collaborator) could not safely branch on unconstrained text for a non-bypassable authority's output.
- Resolution: RCD-03 (Ch. 28) — the Head of Product + AI Architect approved a closed canonical `reasonCode` plus an optional structured `reasonDetail`; free-text explanations are no longer the canonical authority. The specific enumerated `reasonCode` values remain SL-001 SPEC-authoring content, not a further Product/Architecture ambiguity.
- Further specified by: RCD-11 (Ch. 28) — the Head of Product + AI Architect superseded this chapter's earlier framing and fixed the closed `reasonCode` catalogue directly at the Decision Package level, rather than leaving the specific values to SL-001 SPEC-authoring discretion. One item remains genuinely open: RCD-11 does not state a migration mapping from the existing free-text `reason` field (T006 §21.8) to the new closed catalogue — see RCD-11's own Explicit Non-Interpretations.
- Blocks SPEC: **No** (resolved).

**GAP-03 — No TASK Number or Roadmap Entry for the Safety Layer — RESOLVED**
- Gap Type: Repository / Product
- Repository Evidence: Ch. 01 (RM/CL: "no next canonical work item is currently named"); D1/D2/D3 consistently name TASK-004/005/006 for the other three engines but never a TASK number for Safety Layer.
- Why this was a gap: There was no scheduled vehicle for the future SPEC this package exists to prepare.
- Resolution: RCD-01 (Ch. 28) — the Head of Product + AI Architect approved SL-001 — Safety Layer as a standalone canonical Work Item, an architectural prerequisite before TASK-007; TASK-007 itself is explicitly unaffected.
- Blocks SPEC: **No** (resolved).

**GAP-04 — No Escalation Mechanism or Destination Defined — RESOLVED**
- Gap Type: Repository / Product
- Repository Evidence: Ch. 20 (AIC §23.6/D1-AB-02 define only the coach's own message; AIC's "Risk Escalation" is listed only as an unbuilt future module).
- Why this was a gap: "Escalation" was the disposition most susceptible to being silently over-implemented (e.g., an engineer assuming it triggers human notification) without this being decided anywhere.
- Resolution: RCD-04 (Ch. 28) — the Head of Product + AI Architect approved that `ESCALATED` means the coach recommends appropriate professional care and/or pausing unsafe activity, continuing to coach only within FITME authority boundaries, and explicitly excludes contacting healthcare providers, notifying third parties, opening support tickets, or communicating externally. The Safety Layer classifies; Expression communicates.
- Blocks SPEC: **No** (resolved).

**GAP-05 — Three "Filter" Concepts in the AI Constitution With No Stated Relationship — RESOLVED**
- Gap Type: Repository
- Repository Evidence: AIC Ch.11 "Constitutional Evaluation" (9-stage pipeline stage 5, `[AIC §11 Eng. Implications, ~Line 8432]`), Ch.17 "Health Layer" (`[AIC §17 Eng. Implications, ~Line 14190]`), and Ch.23 "Safety Layer" (`[AIC §23 Eng. Implications, ~Line 19754]`) are three separately named filtering concepts; no document stated how they relate to each other or to the single D2/D3 Safety Layer.
- Why this was a gap: A future SPEC author could not know whether these are the same component under three names, nested components, or genuinely distinct gates.
- Resolution: RCD-05 (Ch. 28) — the Head of Product + AI Architect approved that these are not separate safety engines: Constitutional Evaluation defines policy, Health Layer provides safety context, and the Safety Layer is the single architectural enforcement layer.
- Blocks SPEC: **No** (resolved).

**GAP-06 — "Safety Layer" Terminology Used Inconsistently Within the Constitution**
- Gap Type: Repository
- Repository Evidence: `[AIC §22.1, ~Line 18098]` ("Ethics is not an additional safety layer" — dismissive metaphor) vs. `[AIC §23, ~Line 19758]` (mandated architectural component of the same name).
- Why this is a gap: Purely terminological, but could confuse future readers cross-referencing the Constitution.
- Why Engineering cannot decide: Constitution wording changes are Product/AI Architecture territory.
- Impact: Low — clarity issue only, no policy consequence identified.
- Status: Open — not addressed by any approved decision above (RCD-01 through RCD-08 do not reach Constitution wording changes at this level of detail).
- Blocks SPEC: **No.**

**GAP-07 — Product Bible Does Not Reflect the Approved Safety Layer — RESOLVED (repository update pending)**
- Gap Type: Product
- Repository Evidence: Ch. 11 (PB §6 pipeline omits Safety Layer entirely; PB §11 "Initial Backlog" of 8 components never lists it).
- Why this was a gap: The single source of truth for "product scope" (`[PB §13, ~Line 73]`) did not itself document a component that Architecture treats as already-approved.
- Resolution: RCD-06 (Ch. 28) — the Head of Product + AI Architect approved that the repository SHALL be updated to reflect the finalized Safety Layer decisions in the appropriate canonical documents. The physical edit is a follow-up repository action outside this package's own authority (Ch. 01, Ch. 03).
- Blocks SPEC: **No** (already non-blocking; the decision to update is now approved).

**GAP-08 — Coach Bible's Single-Event Severity Exception Is Undeveloped — RESOLVED**
- Gap Type: Repository
- Repository Evidence: Ch. 17/23 (`[CB Ch.3 §4, ~Line 2486]`: "an isolated event can be serious enough... to warrant a response" — stated once, never operationalized, never cross-referenced elsewhere in CB's 22 chapters).
- Why this was a gap: This was the one place CB itself gestured toward a severity concept, and it is exactly the concept GAP-01 needed — but CB gave no criteria.
- Resolution: RCD-08 (Ch. 28) — the Head of Product + AI Architect approved that a single event may bypass the normal pattern requirement only when it represents an explicit constitutional safety signal (high-risk symptoms, known allergy conflicts, active medical instruction conflicts, significant injuries, explicit dangerous requests, clear situations outside coaching authority); inference alone does not qualify.
- Blocks SPEC: **No** (resolved).

### Inherited Gaps (pre-existing, not created by this package — carried forward for completeness)

**GAP-09 — Five Inconsistent Canonical-Precedence Lists — RESOLVED** (Ch. 04): EW's 8-item list; D1's separate 11-item "Canonical Authority Sources" list; D2's 11-item list (omitting EW and the Coach Knowledge Base); D3's "Governing Documents" list (including the Coach Knowledge Base, contradicting EW/D1's explicit exclusion of it); CB's own unqualified supremacy claim. Resolution: RCD-07 (Ch. 28) — the Head of Product + AI Architect confirmed the 8-item order (AI Constitution → Product Bible → Coach Bible → Architecture → Engineering Workflow → Task Specifications → Roadmap → Changelog) as canonical, with the Coach Knowledge Base confirmed non-authoritative; this is the same order this package already adopted in Ch. 04. Blocks SPEC: **No** (resolved).

**GAP-10 — Rank of "Intelligence & Relationship Philosophy"** (inherited, D1 CDR-1, restated at `[RM, ~Line 42]`): "its ranking in the Source of Truth hierarchy... has not yet been decided." Not created by this package. Blocks SPEC: **No** for Safety Layer specifically (this document is not cited as evidence anywhere in the Safety Layer material reviewed).

**GAP-11 — Scope of Coach Bible's Self-Declared Supremacy** (inherited, D1 CDR-2): unresolved tension between CB's "highest coaching authority" claim and EW's general hierarchy ranking CB third. Not created by this package. Blocks SPEC: **No** for Safety Layer specifically (no concrete conflict was found in the Safety Layer evidence itself, per D1 Unit 02's own finding, `[D1 Unit 02, ~Line 228]`).

**GAP-12 — Roadmap-Status, Repository-Hooks, and Coach Knowledge Base Precedence Conflicts** (inherited from T004/T005/T006, explicitly still open per `[CL, ~Line 206]`: "confirmed, not to block it"). Not created by this package, and explicitly already ruled non-blocking for prior tasks. Blocks SPEC: **No**, on the precedent already set by T004/T005/T006's own treatment of these conflicts.

**GAP-13 — `kind` Field Literal-Value Casing Mismatch** (inherited, T006 Repository Gap G-3, `['Recommendation' vs. 'INITIATIVE']`): implementation-level, not policy-level. Blocks SPEC: **No.**

## Explicit Non-Interpretations
This chapter records resolutions approved by the Head of Product + AI Architect (Ch. 28); it does not itself resolve, reinterpret, improve, or replace any decision. GAP-06 and the inherited GAP-10 through GAP-13 remain open because no approved decision above addresses them — this chapter does not resolve them either.

## Repository Gaps
This chapter *is* the Repository Gaps register.

## Completion Checklist
- **Already decided:** GAP-01 through GAP-05, GAP-07, GAP-08, and GAP-09 are resolved, per the approved decisions recorded in Ch. 28.
- **Remains open:** GAP-06 (non-blocking terminology issue) and GAP-10 through GAP-13 (inherited, already non-blocking for Safety Layer specifically) — none addressed by any approved decision above.
- **Owner:** N/A for the resolved gaps (already decided by the Head of Product + AI Architect); Product/AI Architect remains owner of GAP-06/GAP-10–13 if ever revisited.
- **Blocks SPEC:** No — no blocking gap remains open.

---

# 28. Required Canonical Decisions

## Purpose
State, in the Skeleton's required format (§8), every decision required before Safety Layer SPEC authoring, and record the resolution of each as approved by the Head of Product + AI Architect (Canonical Review, Final Canonical Update).

## Canonical Sources
Derived from Ch. 27's gap register.

## Required Repository Reading
N/A — this chapter converts gaps into decisions required to close them.

## Repository Evidence
See Ch. 06-27 for full citations underlying each decision below.

## Canonical Interpretation

**RCD-01 — Safety Layer Standalone Work Item (SL-001) — RESOLVED**
- Decision Statement: Approved. Safety Layer shall be introduced as a standalone canonical Work Item before TASK-007, under the canonical identifier SL-001 — Safety Layer. This is an architectural prerequisite. TASK-007 remains unchanged.
- Canonical Rationale: Every other D3 §17 collaborator has an assigned TASK number and completed or in-progress SPEC; the Safety Layer's formal designation was the remaining gap (GAP-03), now closed by this approval.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update (this Decision Package's governing conversation; not a citation to any of the 13 repository documents, since none of them yet reflects SL-001).
- Documents Affected: Roadmap, Changelog (to record SL-001 — a repository update outside this package's own authority; see RCD-06).
- Consequences: Establishes SL-001 as the vehicle within which RCD-02, RCD-03, RCD-04, RCD-05, and RCD-08's resolved content will be formally specified.
- Backward Compatibility: TASK-007 explicitly unaffected, per the approved decision itself.

**RCD-02 — Safety Decision Matrix (No Numerical Severity Score) — RESOLVED**
- Decision Statement: Approved. The Safety Layer SHALL use a deterministic Safety Decision Matrix, not a generic numerical severity score. The matrix SHALL evaluate: Risk Type, Evidence Confidence, Correctability, and Urgency. The resulting disposition SHALL be one of `UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`.
- Canonical Rationale: Closes GAP-01. The disposition contract (CD-T006-06) already fixed the five-value vocabulary; this decision fixes what drives selection among them, and explicitly rules out a numerical severity score as the mechanism.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: The future Safety Layer SPEC (SL-001), which must formalize the matrix's four input dimensions and their mapping onto the five dispositions.
- Consequences: `finalReview()`/`disqualify()` can now be specified against a fixed input model (Risk Type × Evidence Confidence × Correctability × Urgency) rather than an undefined severity axis.
- Backward Compatibility: N/A — no prior severity mechanism existed to be broken; this decision also forecloses any future numerical-score design for this purpose.

**RCD-03 — Closed Canonical `reasonCode` (No Free-Text Authority) — RESOLVED**
- Decision Statement: Approved. Safety decisions SHALL expose a closed canonical `reasonCode` and an optional structured `reasonDetail`. Free-text explanations SHALL NOT be the canonical authority.
- Canonical Rationale: Closes GAP-02. Answers the open policy question (closed vs. free text) that T006 §21.8's `reason: <string|null>` field left unresolved; the specific enumerated `reasonCode` values remain SPEC-authoring content within SL-001, not a further Product/Architecture ambiguity.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: The future Safety Layer SPEC (SL-001).
- Consequences: Downstream systems (audit, analytics, a future Expression collaborator) can now be specified to branch on a closed `reasonCode` rather than unconstrained text; the existing free-text `reason` field in `DisqualificationResult`/`SafetyReviewResult` (T006 §21.8) becomes non-authoritative pending SL-001's formal replacement.
- Backward Compatibility: The existing free-text `reason` field's migration to `reasonCode`/`reasonDetail` is SL-001 SPEC-authoring content, not resolved by this decision itself.

**RCD-04 — Meaning of ESCALATED (Safety Layer Classifies; Expression Communicates) — RESOLVED**
- Decision Statement: Approved. `ESCALATED` means: recommend appropriate professional care when constitutionally required; recommend pausing unsafe activity when appropriate; continue coaching only inside FITME authority boundaries. `ESCALATED` SHALL NOT: contact healthcare providers, notify third parties, open support tickets, or communicate externally. The Safety Layer classifies; Expression communicates.
- Canonical Rationale: Closes GAP-04, the highest-impact gap identified in this package. Confirms that `ESCALATED` extends no further than the coach's own conversational output, consistent with AIC §23.6's coach-remains-supportive framing, and forecloses any external-notification interpretation.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: The future Safety Layer SPEC (SL-001); no Architecture change to add an external integration is required, since this decision rules that path out.
- Consequences: Removes the highest-risk source of implementer over-inference identified in Ch. 20; confirms the Decision Engine/Safety Layer boundary (Expression communicates, Safety Layer classifies) without requiring a new system integration.
- Backward Compatibility: N/A — no external-notification mechanism existed; none is introduced.

**RCD-05 — Constitutional Evaluation, Health Layer, and Safety Layer Are One Enforcement Architecture — RESOLVED**
- Decision Statement: Approved. Constitutional Evaluation, Health Layer, and Safety Layer are NOT separate safety engines. Constitutional Evaluation defines policy. Health Layer provides safety context. Safety Layer is the single architectural enforcement layer.
- Canonical Rationale: Closes GAP-05. Establishes that AIC Ch.11's "Constitutional Evaluation," Ch.17's "Health Layer," and Ch.23's "Safety Layer" are three roles within one architecture rather than three competing gates, and confirms the single D2/D3 Safety Layer is that architecture's enforcement point.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: AI Constitution (Ch.11/Ch.17/Ch.23 cross-references would benefit from this clarification being reflected there — see RCD-06); the future Safety Layer SPEC (SL-001).
- Consequences: SL-001 need only account for the three D2/D3 checkpoints already fixed (Ch. 13-15); no additional filtering logic from AIC Ch.11 or Ch.17 need be separately specified.
- Backward Compatibility: No existing D2/D3/T006 component or contract is altered by this clarification.

**RCD-06 — Repository Documentation Synchronization — RESOLVED**
- Decision Statement: Approved. Following approval of this Decision Package, the repository SHALL be updated to reflect the finalized Safety Layer decisions in the appropriate canonical documents. No additional Product decisions are introduced by this update.
- Canonical Rationale: Closes GAP-07, and provides the mechanism by which RCD-01 through RCD-05 and RCD-08's approved content reaches the Product Bible, AI Constitution, Coach Bible, and Roadmap/Changelog.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: Product Bible (§6, §11), AI Constitution (Ch.11/Ch.17/Ch.23 cross-references per RCD-05), Coach Bible (via its own versioned-amendment process per RCD-08), Roadmap, Changelog.
- Consequences: The physical edits to these documents are a follow-up action performed outside this Decision Package's own authority (this package is prepared by the Lead Engineer / Canonical Documentation Editor role, which is not authorized to make Product or AI Architecture decisions or to perform repository updates itself).
- Backward Compatibility: Additive only — no existing canonical content is contradicted by this decision.

**RCD-07 — Canonical Precedence Confirmed — RESOLVED**
- Decision Statement: Approved. Canonical precedence SHALL remain: 1. AI Constitution, 2. Product Bible, 3. Coach Bible, 4. Architecture, 5. Engineering Workflow, 6. Task Specifications, 7. Roadmap, 8. Changelog. The Coach Knowledge Base remains non-authoritative.
- Canonical Rationale: Closes GAP-09. Confirms, as the authoritative canonical order, the same 8-item order already found at `[EW §3]` and restated identically by `[T005 §3.2]`/`[T006 §3.2]`, which this package itself already adopted in Ch. 04 absent a settled order.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: D1's and D2's own separate internal "Canonical Authority Sources" lists and D3's "Governing Documents" list (which included the Coach Knowledge Base) would need to be reconciled to this confirmed order as a repository update (see RCD-06); this package's own Ch. 04 already matches it and requires no change.
- Consequences: Removes the standing five-way inconsistency identified in Ch. 04/GAP-09 as the governing order for this and future canonical documents.
- Backward Compatibility: Existing citations to any of the five prior differing lists would need review during the repository update in RCD-06, but this is a documentation, not runtime, concern.

**RCD-08 — Single-Event Safety Bypass Criteria — RESOLVED**
- Decision Statement: Approved. A single event may bypass the normal pattern requirement ONLY when it represents an explicit constitutional safety signal. Examples include: high-risk symptoms; known allergy conflicts; active medical instruction conflicts; significant injuries; explicit dangerous requests; clear situations outside coaching authority. Inference alone SHALL NOT bypass the normal evidence requirements.
- Canonical Rationale: Closes GAP-08, and directly resolves RCD-02's Evidence Confidence input dimension for single-event triggers. Operationalizes CB Ch.3 §4's previously undeveloped "an isolated event can be serious enough... to warrant a response" exception with an explicit, closed list of qualifying signal types.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Final Canonical Update.
- Documents Affected: Coach Bible (via its own versioned-amendment process, `[CB, ~Line 5192]`, required to fold this criteria list into Ch.3 §4 — see RCD-06); the future Safety Layer SPEC (SL-001).
- Consequences: Provides the missing bridge between CB's philosophy and RCD-02's Safety Decision Matrix — the enumerated signal types are exactly the class of inputs the matrix's Evidence Confidence dimension must recognize as pattern-exempt.
- Backward Compatibility: CB's Canonical Maintenance Policy requires this addition to be "recorded openly, as a new version of this Bible, with the change and its reasoning stated plainly" `[CB, ~Line 5192]` — a repository update per RCD-06, not performed by this package itself.

**RCD-09 — Safety Decision Matrix Disposition Policy — RESOLVED**
- Decision Statement: Approved. The Safety Layer SHALL determine exactly one disposition; no numeric scoring, weighting, or averaging is permitted. The four RCD-02 dimensions (Risk Type, Evidence Confidence, Correctability, Urgency) are evaluated together. Disposition selection SHALL always follow protective precedence, in this fixed order — the first satisfied rule determines the result, and where multiple rules match simultaneously, the highest-protective disposition SHALL always win:
  1. `ESCALATED` — returned only when repository-approved safety evidence requires professional support or immediate protective escalation. `ESCALATED` never creates external communication by itself; Expression determines wording (consistent with RCD-04).
  2. `BLOCKED` — returned when the user's requested intent fundamentally violates an approved canonical safety boundary and cannot become safe without changing the original intent.
  3. `DEFERRED` — returned when a safe decision cannot yet be made because required safety information is missing or uncertainty is too high.
  4. `MODIFIED` — returned when the original intent can remain intact by applying a bounded safety modification.
  5. `UNMODIFIED` — returned only when no repository-supported safety conflict exists and no missing critical safety information prevents a safe decision.

  Silence vs. Refusal (Stage 8 all-disqualified outcome, Ch. 14): if all Candidates are disqualified because the original request itself violates a canonical safety boundary, the Safety Layer SHALL produce Refusal; if all Candidates are disqualified because no sufficiently safe Candidate can be established due to missing context or insufficient evidence, the Safety Layer SHALL produce Silence. All-disqualified status SHALL NOT itself produce `ESCALATED`.
- Canonical Rationale: Completes RCD-02's Safety Decision Matrix by fixing the disposition-selection policy operating over its four already-approved dimensions; resolves the "Remains open" item recorded at Ch. 14, Ch. 15, Ch. 17, and Ch. 18 (the policy logic selecting among the five dispositions), and the Silence-vs-Refusal question left to "the Safety Layer's own reasoning" at `[T006 §23.5]`. The `ESCALATED` trigger condition is stated consistently with, and does not alter, RCD-04's own definition of what `ESCALATED` means once selected. The `BLOCKED`/permanent-commitment framing is consistent with D1-AH-02's existing absolute-override list (Ch. 14); no new override category is introduced.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Disposition Policy Canonical Update (not a citation to any of the 13 original repository documents, since none of them yet reflects this policy; recorded here per this Decision Package's established practice for RCD-01 through RCD-08).
- Documents Affected: The future Safety Layer SPEC (SL-001) — a repository update outside this package's own authority (see RCD-06's precedent).
- Consequences: `finalReview()` can now be specified against a complete, ordered disposition-selection rule rather than an undefined mapping; the Stage-8 all-disqualified Silence/Refusal ambiguity (Ch. 14, Ch. 19) is closed.
- Backward Compatibility: N/A — no prior disposition-selection policy existed to be broken; this decision also forecloses any future numerical-scoring design for this purpose, consistent with RCD-02.

**RCD-10 — Derivation of Safety Matrix Dimensions — RESOLVED**
- Decision Statement: Approved. The four Safety Matrix dimensions SHALL be derived exclusively from already-approved canonical inputs: Pipeline Context, the Candidate under review, the Terminal Decision under review, Health/Safety Profile, and Life Event Context. No new engines, pipeline stages, repository state, or data sources are introduced. Risk Type SHALL classify only canonical safety conflict type. Evidence Confidence SHALL reflect only the repository-supported Evidence Hierarchy (D1 Unit 11). Correctability SHALL determine whether the detected safety issue can be resolved while preserving the user's original intent. Urgency SHALL classify only the timing sensitivity of the required protective action. If a dimension cannot be derived from approved canonical evidence, its value SHALL be `INSUFFICIENT`; Engineering SHALL NOT infer or invent a missing value. Missing critical information SHALL result in `DEFERRED` whenever safe classification cannot otherwise be established.
- Canonical Rationale: Completes RCD-02 by fixing how each of its four dimensions is derived, without introducing any input source beyond what D1 Unit 03 already enumerates (Ch. 11). The `INSUFFICIENT` sentinel and its consequence (`DEFERRED`) directly implement RCD-09's own `DEFERRED` trigger condition ("required safety information is missing") and are structurally consistent with, though not identical to, the `NO_SIGNAL` sentinel pattern T006 §14.12 already established for the Decision Engine's own arbitration metadata.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Disposition Policy Canonical Update.
- Documents Affected: The future Safety Layer SPEC (SL-001) — a repository update outside this package's own authority.
- Consequences: Closes the "no real classification source exists for the Safety Decision Matrix's own input dimensions" gap; the Matrix is now fully specified from input derivation through disposition selection (RCD-09).
- Backward Compatibility: N/A — no prior derivation rule existed to be broken; introduces no new engine, pipeline stage, repository state, or data source, per the decision's own explicit terms.

**RCD-11 — Canonical `reasonCode` Contract — RESOLVED**
- Decision Statement: Approved. Every Safety Layer decision SHALL expose exactly one canonical `reasonCode`, which SHALL be the canonical authority; `reasonDetail` SHALL be structured supporting information only and SHALL NEVER replace `reasonCode`. The canonical closed `reasonCode` catalogue is: `NO_SAFETY_CONFLICT`, `KNOWN_ALLERGY_CONFLICT`, `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, `ACTIVE_HIGH_RISK_SYMPTOM`, `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, `DANGEROUS_OR_EXTREME_REQUEST`, `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, `PSYCHOLOGICAL_DISTRESS_CONCERN`, `OUTSIDE_COACHING_SCOPE`, `INSUFFICIENT_SAFETY_CONTEXT`, `INFERRED_SIGNAL_NOT_SUFFICIENT`, `PROFESSIONAL_SUPPORT_REQUIRED`. Only one primary `reasonCode` SHALL be returned; where multiple safety conditions exist simultaneously, the `reasonCode` corresponding to the highest-protective disposition (RCD-09's precedence order) SHALL be selected, and secondary information belongs only inside `reasonDetail`. The catalogue is CLOSED; Engineering SHALL NOT extend it.
- Canonical Rationale: Completes RCD-03 by fixing the specific closed enumeration that chapter approved only structurally, superseding this Decision Package's own earlier framing (Ch. 24, Ch. 27/GAP-02) that the enumerated values would be left to SL-001 SPEC-authoring discretion. The catalogue's categories align with, and do not expand, D1-AH-02's absolute-override list, D1-AB-02's professional-referral threshold, and RCD-08's single-event bypass signal list — no new safety-trigger category is introduced by this decision.
- Approval Evidence: Head of Product + AI Architect, Canonical Review — Disposition Policy Canonical Update.
- Documents Affected: The future Safety Layer SPEC (SL-001) — a repository update outside this package's own authority.
- Consequences: The existing free-text `reason` field in `DisqualificationResult`/`SafetyReviewResult` (T006 §21.8) is superseded in authority by the closed `reasonCode`. **Not addressed by this decision:** a migration mapping from the existing free-text `reason` field's historical values to the new closed catalogue — this was requested as part of the same decision round but was not supplied with the approved content; it is recorded as a genuinely open item, not invented here (see Explicit Non-Interpretations, below, and Ch. 27/GAP-02).
- Backward Compatibility: The free-text `reason` field's migration to `reasonCode`/`reasonDetail` remains SL-001 SPEC-authoring content per RCD-03's original framing, except that the target catalogue is now fixed by this decision rather than left open.

## Explicit Non-Interpretations
This chapter records the Head of Product + AI Architect's approved decisions verbatim; it does not reinterpret, improve, or replace them, and it does not itself perform the repository updates RCD-06 requires — those remain outside this Decision Package's own authority (Ch. 01, Ch. 03). RCD-11 does not state, and this chapter does not invent, a migration mapping from the existing free-text `reason` field to the new closed `reasonCode` catalogue; that mapping remains unresolved and is not supplied by inference.

## Repository Gaps
N/A — this chapter records the resolution of Ch. 27's gaps via approved decisions; it does not introduce new gaps.

## Completion Checklist
- **Already decided:** RCD-01 through RCD-08 — approved by the Head of Product + AI Architect (Canonical Review, Final Canonical Update); the RCD-06 repository synchronization (Product Bible, AI Constitution, Coach Bible, Roadmap, Changelog, D1, D2, D3) has been executed. RCD-09 through RCD-11 — approved by the Head of Product + AI Architect (Canonical Review, Disposition Policy Canonical Update); repository synchronization for this round has been executed (Roadmap, Changelog — see repository commit).
- **Remains open:** The free-text-`reason`-to-`reasonCode` migration mapping (RCD-11's own Explicit Non-Interpretations).
- **Owner:** Head of Product + AI Architect approved all eleven decisions; repository synchronization for RCD-01 through RCD-08 executed under the prior closure; synchronization for RCD-09 through RCD-11 has since also been executed (Roadmap, Changelog; per Ch. 29, no other canonical document is a synchronization target for these three decisions).
- **Blocks SPEC:** No — all eleven RCDs resolved; the two remaining open items above are non-blocking, consistent with this package's treatment of every other non-blocking open item (Ch. 27).

---

# 29. Cross-Document Impact

## Purpose
Identify which repository documents each open item in Ch. 27-28 would require updating, so the eventual resolution work is traceable.

## Canonical Sources
All 13 documents.

## Required Repository Reading
N/A — aggregated from prior chapters.

## Repository Evidence
See "Documents Affected" fields in Ch. 28.

## Canonical Interpretation

| Item | Status | Documents Affected (RCD-06 follow-up repository action) |
|---|---|---|
| RCD-01 (SL-001 standalone Work Item) | RESOLVED | Roadmap, Changelog |
| RCD-02 (Safety Decision Matrix) | RESOLVED | Future SL-001 SPEC |
| RCD-03 (closed `reasonCode`) | RESOLVED | Future SL-001 SPEC |
| RCD-04 (meaning of ESCALATED) | RESOLVED | Future SL-001 SPEC |
| RCD-05 (filter-concept relationship) | RESOLVED | AI Constitution; future SL-001 SPEC |
| RCD-06 (documentation synchronization) | RESOLVED | Product Bible, AI Constitution, Coach Bible, Roadmap, Changelog |
| RCD-07 (precedence confirmed) | RESOLVED | D1, D2, D3 (internal alternate lists), by reference |
| RCD-08 (single-event bypass criteria) | RESOLVED | Coach Bible (versioned amendment); future SL-001 SPEC |
| RCD-09 (Safety Decision Matrix disposition policy) | RESOLVED | Future SL-001 SPEC |
| RCD-10 (derivation of Safety Matrix dimensions) | RESOLVED | Future SL-001 SPEC |
| RCD-11 (canonical `reasonCode` contract) | RESOLVED | Future SL-001 SPEC |
| GAP-06 (terminology) | Open, non-blocking | AI Constitution (optional clarity pass) |
| GAP-10/11/12/13 (inherited) | Open, non-blocking | Already tracked by their originating documents (D1 CDRs, T004-T006 Canonical Conflicts); not newly introduced here |
| RCD-11 free-text-to-`reasonCode` migration mapping | Open, non-blocking | Future SL-001 SPEC (not yet supplied — see RCD-11's Explicit Non-Interpretations) |

This package itself, once accepted, becomes a candidate for citation by SL-001's future SPEC (RCD-01) — but it is not itself canonical (Ch. 01), and the physical repository updates listed above remain RCD-06's (for RCD-01 through RCD-08) or an equivalent follow-up action's (for RCD-09 through RCD-11) responsibility, not performed by this package.

## Explicit Non-Interpretations
This chapter does not sequence or prioritize the RCD-06 (or RCD-09–11) repository updates relative to each other — sequencing is a Product/AI Architecture planning decision. It does not invent the missing RCD-11 migration mapping to fill the open row above.

## Repository Gaps
None new. The RCD-11 migration-mapping item is tracked in the table above, not restated as a numbered GAP, since it originates from this v2.2 round rather than the original Ch. 27 gap-discovery pass.

## Completion Checklist
- **Already decided:** The mapping table above; every RCD-linked item is resolved. RCD-01 through RCD-08 are synchronized to their listed document(s) per RCD-06; RCD-09 through RCD-11 are approved but not yet synchronized.
- **Remains open:** GAP-06, GAP-10 through GAP-13 (unaddressed, non-blocking, inherited), and the RCD-11 migration-mapping item (non-blocking, new to this round) — informational only.
- **Owner:** Head of Product + AI Architect (decisions approved; synchronization for RCD-01–08 complete, for RCD-09–11 pending).
- **Blocks SPEC:** No.

---

# 30. Validation Matrix

## Purpose
Verify this package against every rule in the Skeleton's §10 Validation Rules before it is returned.

## Canonical Sources
All 13 documents; Skeleton §9-10.

## Required Repository Reading
N/A — self-validation against prior chapters.

## Repository Evidence
N/A — this is a compliance check, not a new evidentiary claim.

## Canonical Interpretation

| Validation Rule (Skeleton §10) | Result |
|---|---|
| No contradiction with Constitution | Pass — every AIC citation used verbatim; no AIC content restated in altered form. |
| No contradiction with Product Bible | Pass — PB's silence on safety/pipeline is recorded as a gap (GAP-07), not overridden. |
| No contradiction with Coach Bible | Pass — CB's philosophy (Ch. 06) and its deliberate flat taxonomy (Ch. 16) are preserved, not restructured. |
| No contradiction with D1 | Pass — D1's absolute-override list, Evidence Hierarchy, and Unit 14 boundaries are cited, not altered. |
| No contradiction with D2 | Pass — D2's three-function Safety Layer model and pipeline stages are cited, not altered. |
| No contradiction with D3 | Pass — D3's component/ownership/forbidden-touch tables are cited, not altered. |
| No implementation guidance | Pass — no code, algorithm, data structure, or API beyond what T006 already implements (`safetyIntegrationPort.js`, already-shipped) is described. |
| No invented Product decisions | Pass — Ch. 27-28 record gaps and required decisions without proposing resolutions. |
| No invented Architecture decisions | Pass — Ch. 11-15 describe only already-approved D2/D3/T006 architecture; no new component, stage, or contract is proposed. |

## Explicit Non-Interpretations
This chapter does not certify that every conceivable ambiguity has been found — only that the ambiguities found are recorded without being resolved, and that no rule violation occurred in the process.

## Repository Gaps
None new.

## Completion Checklist
- **Already decided:** All nine validation rules pass.
- **Remains open:** Nothing at the validation level.
- **Owner:** N/A.
- **Blocks SPEC:** No (validation itself does not block; the underlying gaps it validates against do).

---

# 31. Readiness Verdict

## Purpose
Render the Final Acceptance Gate verdict required by Skeleton §12.

## Canonical Sources
Ch. 27, Ch. 28.

## Required Repository Reading
Skeleton §12 "Final Acceptance Gate."

## Repository Evidence
- Skeleton §12: "The completed Decision Package may recommend SPEC authoring ONLY if: 1. No Product ambiguity remains. 2. No Architecture ambiguity remains. 3. Engineering will not need to invent behaviour. 4. Every required decision is explicit. 5. Every remaining gap is classified. 6. Readiness verdict is justified by repository evidence. If any criterion fails: Final verdict MUST be: NOT READY FOR SPEC."
- Ch. 27: of the 8 primary gaps, 7 are now RESOLVED (GAP-01 through GAP-05, GAP-07, GAP-08) per approved decisions RCD-01 through RCD-08, with GAP-01 and GAP-02 subsequently further specified in full by RCD-09/RCD-10 and RCD-11 respectively; GAP-06 remains open, non-blocking. Of the inherited gaps, GAP-09 is now RESOLVED (RCD-07); GAP-10 through GAP-13 remain open, already non-blocking for Safety Layer specifically.
- Ch. 28: all 11 Required Canonical Decisions (RCD-01 through RCD-11) are RESOLVED, approved by the Head of Product + AI Architect (Canonical Review, Final Canonical Update for RCD-01–08; Disposition Policy Canonical Update for RCD-09–11).

## Canonical Interpretation
Criterion 1 (no Product ambiguity remains) — satisfied: RCD-01 (SL-001 designation), RCD-04 (meaning of ESCALATED), RCD-06 (documentation synchronization), and RCD-07 (precedence confirmed) are all resolved. Criterion 2 (no Architecture ambiguity remains) — satisfied, and now more completely than at v2.1: RCD-02/RCD-09/RCD-10 (Safety Decision Matrix, its disposition-selection policy, and its dimension-derivation rules), RCD-03/RCD-11 (closed `reasonCode` contract and its specific catalogue), and RCD-05 (filter-concept relationship) are all resolved. Criterion 3 (Engineering will not need to invent behaviour) — satisfied, and strengthened by this round: a future SL-001 SPEC can now be authored against a fixed disposition-selection *policy* (not merely a fixed input model), a fixed `reasonCode` catalogue (not merely a fixed field shape), a fixed meaning of escalation, a fixed relationship among the Constitution's three filter concepts, and a fixed single-event bypass criteria list — none of which requires Engineering to originate Product or AI Architecture policy. The single remaining item Engineering cannot originate on its own — the free-text-`reason`-to-`reasonCode` migration mapping (RCD-11) — is recorded as open, not invented, and does not itself require Engineering to originate Product or Architecture policy to proceed with the rest of SL-001. Criterion 4 (every required decision explicit) — satisfied (Ch. 28). Criterion 5 (every remaining gap classified) — satisfied (Ch. 27, Ch. 29; the open items — GAP-06, the inherited GAP-10 through GAP-13, and the new RCD-11 migration-mapping item — are explicitly classified as non-blocking). Criterion 6 (verdict justified by repository evidence) — satisfied by this chapter's citations to Ch. 27/28/29 and by the approved decisions' own recorded text.

No unresolved canonical blocker was found that is not addressed by the approved decisions above. GAP-06 (Constitution terminology inconsistency between Ch.22's metaphorical use of "safety layer" and Ch.23's named component), the inherited GAP-10 through GAP-13, and the RCD-11 migration-mapping item remain open, but all are classified non-blocking for Safety Layer SPEC authoring (Ch. 27, Ch. 29), and none of the approved decisions above reopens them.

All six criteria are now satisfied, and more completely than at v2.1.

## Explicit Non-Interpretations
This chapter does not itself perform SPEC authoring or design work — SL-001 remains a formally designated but unauthored Work Item; this closure enables it but does not begin it.

## Repository Gaps
None new — GAP-06 and GAP-10 through GAP-13 remain open exactly as classified in Ch. 27, unaffected by this verdict.

## Completion Checklist
- **Already decided:** All eleven RCDs resolved (Ch. 28); the RCD-06 repository documentation synchronization for RCD-01 through RCD-08 has been executed (Roadmap, Changelog, AI Constitution, Coach Bible, Product Bible, D1, D2, D3 — see repository commit); RCD-09 through RCD-11 are approved and repository-synchronized (Roadmap, Changelog — see repository commit); the verdict logic (Skeleton §12) applied to that resolved state.
- **Remains open:** GAP-06, GAP-10 through GAP-13 (open, non-blocking, inherited), and the RCD-11 migration-mapping item (open, non-blocking, new to this round) — informational only, none required for SL-001 SPEC authoring to proceed.
- **Owner:** Head of Product + AI Architect (all eleven decisions already made; synchronization for RCD-01–08 and RCD-09–11 both complete).
- **Blocks SPEC:** No.

## Final Verdict

# **READY FOR SPEC**

All eleven Required Canonical Decisions (RCD-01 through RCD-11) are resolved, approved by the Head of Product + AI Architect (Canonical Review — Final Canonical Update for RCD-01 through RCD-08, Disposition Policy Canonical Update for RCD-09 through RCD-11). The RCD-06 repository documentation synchronization has been executed across every affected canonical document for RCD-01 through RCD-08 (Roadmap, Changelog, AI Constitution, Coach Bible, Product Bible, D1, D2, D3); synchronization for RCD-09 through RCD-11 has also been executed (Roadmap, Changelog — see repository commit). No unresolved canonical blocker remains: GAP-06, the inherited GAP-10 through GAP-13, and the RCD-11 migration-mapping item remain open but are classified non-blocking (Ch. 27, Ch. 29) and are unaffected by this update. SL-001 — Safety Layer SPEC authoring may now proceed against a fully specified Safety Decision Matrix (disposition policy, dimension derivation, and reasonCode catalogue), per the Skeleton's Final Acceptance Gate (§12).

---

*End of Decision Package.*
