
# FITME — G-2 CANONICAL DECISION PACKAGE
## v1.5 — CANONICAL (Expanded — CD-G2-01/02/03 and AD-G2-01/02/03 Approved and Synchronized; PD-G2-05 Recorded; Coach Semantic Foundation Package cross-referenced)

> **Document role:** Decision Package. Not a SPEC. Not an implementation document. Modeled structurally on `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (the repository's only prior standalone Canonical Decision Package), per the repository-architecture precedent review that preceded this document.
> **Prepared by:** Lead Engineer / Repository Analyst / Repository Maintainer, recording decisions presented as approved by the Head of Product + AI Architect, without reinterpretation.
> **Repository baseline:** `main`, post-Expression closure (commit `752f88b`).
> **Origin:** This Package resolves open questions surfaced by the "G-2 Investigation" series — a dedicated, multi-part root-cause and canonical-contradiction review of Repository Gap G-2 (no live Stage 3/4 Opportunity source) — conducted after `docs/specs/D1_SPEC_v1.0.md` and `docs/specs/TASK_005_SPEC_v1.0.md` were both already closed, canonical documents. Per the repository-architecture precedent this Package follows (`RCD-15`/`RG-3`, below), a question of this shape — discovered outside any live SPEC-authoring window, touching more than one already-closed canonical document — is recorded in a standalone Package and synchronized outward, not resolved by editing the affected documents directly.
> **Title note (v1.3):** This Package's title is broadened from "Opportunity & Evidence Semantics" to "G-2 Canonical Decision Package" to accurately reflect its now-expanded scope (semantic decisions CD-G2-01/02/03 plus the architecture decision AD-G2-01), following the same growth-without-fragmentation pattern the Safety Layer Canonical Decision Package (SLDP) itself demonstrated when its own content grew from policy-semantic RCDs into architecture-defining ones (RCD-12, RCD-13) without ever splitting into a second document. No prior content is altered by this title change.
> **Revision note:** v1.0 recorded CD-G2-01 and CD-G2-02 as DRAFT, pending Product & Architecture review of this Package itself (content resolved, document not yet accepted). **v1.1 recorded closure:** Product & Architecture reviewed and APPROVED this Package in full, including the correction removing an unsupported illustrative mapping from CD-G2-01's Decision Statement. Repository synchronization into `D1_SPEC_v1.0.md` and `TASK_005_SPEC_v1.0.md` was executed and independently reviewed, per Chapter 06. **v1.2 records a further Final Canonical Update:** Product approved **PD-G2-05** ("Proactive Contextual Presence," a Product decision, recorded for traceability at Chapter 07 — this Package did not make that decision) and the Head of Product + AI Architect approved **CD-G2-03** ("Initiative May Express Minimal Contextual Assistance," Chapter 04), resolving a previously-identified open ambiguity in the required `InitiativeCandidate.action` field. A minimal, additive cross-reference synchronization into `TASK_005_SPEC_v1.0.md`'s `InitiativeCandidate.action` field description was executed, per Chapter 08. **v1.3 records a further Final Canonical Update:** following an Adversarial Canonical & Repository Review of a proposed G-2 Recognition Architecture (19 items, G2-RA-01 through G2-RA-19), Product/Architecture authority accepted the review's findings — no Product Blocker, no Architecture Blocker, no Contract Blocker, no Canonical Contradiction — subject to three exact clarifications (to `G2-RA-05`, `G2-RA-09`, `G2-RA-14`). The Head of Product + AI Architect approved the architecture as clarified, recorded as **AD-G2-01** (Chapter 09). AD-G2-01 establishes the first live canonical Opportunity Recognition path connecting existing real signals to Stage 3 of the existing Coach Decision System; it introduces no new engine, no new Composite Engine registration, no new Terminal Decision type, no new Candidate family, and no user-opt-in/deferred-reasoning pipeline. It does not resolve Repository Gap G-2 itself (which requires actual implementation, not yet performed) and does not resolve the Decision Window closing criterion, which remains explicitly unresolved and, per `AD-G2-01`'s own terms, non-load-bearing for G-2 Core. `docs/roadmap/Changelog.md` updated per repository precedent, per Chapter 10; `docs/roadmap/Roadmap.md` requires no update — this remains a canonical architecture decision, not a completed or in-progress implementation task, consistent with the precedent already applied at v1.1/v1.2. This Package remains CANONICAL and CLOSED at each recorded decision. It does not resolve Repository Gap G-2 itself, which remains open.
> **v1.4 further records:** following the Pre-G-2 Canonical Decisions Architecture Recommendation (advisory, not itself canonical), the Head of Product + AI Architect reviewed and approved its two recommendations as **AD-G2-02** ("Stage 4 Evidence Evaluation Orchestration," Chapter 11) and **AD-G2-03** ("Coach Decision Context Foundation," Chapter 13). AD-G2-02 assigns the Decision Engine narrow, explicit Stage-4 orchestration authority — resolving `T005`'s/`T006`'s previously-tracked Stage-4 ownership gap (T006 §38 item G-2) — exercised through a dedicated internal execution component, with D1 Unit 11 remaining the sole Evidence-policy authority. AD-G2-03 establishes a bounded Goal/Objective and Current-State extension to the existing Memory Layer / Pipeline Context foundation, preserving Memory Layer's exclusive Context Assembly authority and introducing no new engine, no direct StateAccess reads for any Stage-3 contributor, and no general-purpose Profile exposure. Unlike AD-G2-01, AD-G2-02 required minimal, additive-only synchronization into `D2_SPEC_v1.0.md`, `D3_SPEC.md`, and `TASK_006_SPEC_v1.0.md`, each of which previously stated, in various closed-list or "no owner" form, that Stage 4 carried no assigned orchestration authority — now corrected, with original text preserved per this Package's established audit-trail discipline (Chapter 12). AD-G2-03 required no synchronization beyond this Package (Chapter 14) — it adds new capability without contradicting any existing closed statement. Neither decision reopens CD-G2-01/02/03, PD-G2-05, AD-G2-01, or the Decision Window closing criterion, which remains explicitly unresolved and non-load-bearing.
> **v1.5 further records:** a bounded cross-reference (Chapter 15) to the newly-closed `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` — the Product + Architecture foundation supplying the Contextual Meaning/`validReasonCategory` derivation that G-2's Stage-3 construction requires. This is additive cross-reference only; no content from that Package is duplicated here, and no decision recorded in this Package (`CD-G2-01/02/03`, `PD-G2-05`, `AD-G2-01/02/03`) is reopened, reinterpreted, or altered by it.
> **Status of this version:** CANONICAL — CLOSED for CD-G2-01, CD-G2-02, CD-G2-03, AD-G2-01, AD-G2-02, and AD-G2-03; PD-G2-05 recorded for traceability only (approved by Product outside this Package). See Chapter 05 (Status and Closure). **Closure update (post-v1.5, recorded via `docs/specs/G2_SPEC_v1.0.md` and the Coach Semantic Foundation Canonical Decision Package Chapter 29.8, not a revision of this Package's own decisions): G-2 itself has since been implemented, tested, and production-backed verified, closing the live-implementation work item this Package's Architecture Decisions (AD-G2-01/02/03) planned for but did not themselves perform.** Every other reference in this Package's own body to "Repository Gap G-2 itself remains open" describes that individual decision's own non-implementing scope, accurately, as of when it was authored — none of AD-G2-01/02/03 ever claimed to implement G-2, and none is altered by G-2's subsequent implementation. See `docs/specs/G2_SPEC_v1.0.md` §53 (Closure Record) for the current, authoritative implementation status.

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| D1 | D1 Spec v1.0 | `docs/specs/D1_SPEC_v1.0.md` |
| D2 | D2 Spec v1.0 | `docs/specs/D2_SPEC_v1.0.md` |
| T005 | TASK-005 Spec v1.0 | `docs/specs/TASK_005_SPEC_v1.0.md` |
| T006 | TASK-006 Spec v1.0 | `docs/specs/TASK_006_SPEC_v1.0.md` |
| CB | Coach Bible | `docs/governance/FITME_Coach_Bible.md` |
| SLDP | Safety Layer Canonical Decision Package v2.0 (v2.6, Closed) | `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| RM | Roadmap | `docs/roadmap/Roadmap.md` |
| CL | Changelog | `docs/roadmap/Changelog.md` |

Citation format used throughout: `[ABBR §Section/Chapter, ~LineN]` for prose documents, `[filename:LineN]` for code. All quotations are verbatim from the cited source as it exists in the repository at the stated baseline.

---

# 01. Status

## Purpose

Establish the working status of this Decision Package before either chapter is read for content, so its conclusions are never mistaken for already-synchronized, implemented, or code-affecting fact.

## Canonical Interpretation

As of the repository baseline, Repository Gap G-2 (`[ARCH §23-25]`, `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`) remains open at the architecture level (no live Stage 3/4 Opportunity source). This Package does **not** resolve G-2 itself. It resolves two narrower, prerequisite questions of *Opportunity and Evidence semantics* discovered while investigating G-2 — questions that must be settled before any future SPEC addressing G-2's live wiring could be authored without inheriting unresolved ambiguity.

## Explicit Non-Interpretations

This Package does not resolve Repository Gap G-2 itself (no live Opportunity source is introduced). It does not assign engine ownership for any Stage-3 detection work. It does not authorize SPEC authoring for G-2's own resolution. It does not modify the Coach Bible, the Constitution, the Roadmap, or the Changelog. It introduces no architectural, behavioral, or implementation change.

## Repository Gaps

None introduced by this chapter.

---

# 02. Purpose

This Package formally records CD-G2-01 and CD-G2-02 — two Canonical Decisions resolving ambiguity identified across `D1_SPEC_v1.0.md` (Units 03, 05, 11) and `TASK_005_SPEC_v1.0.md` (§9.2, §15.2, §15.7, §36 Repository Gap G-2) during the G-2 Investigation series — and records the repository synchronization those decisions required, now performed and independently reviewed (Chapter 06).

---

# 03. Background — What the G-2 Investigation Found

## Repository Evidence

- `[D1 Unit 05, ~Line 441-464]` — the "Canonical Opportunity Sources" list contains exactly five items: Decision Windows, Anticipation from confirmed patterns, Disruption detection, Milestone/recovery triggers, Safety/high-risk triggers.
- `[D1 D1-OD-01, ~Line 468-472]` — *"Except for safety/high-risk triggers (which act on a single occurrence) and explicit user statements or actions, a single event SHALL be treated as data, not evidence; only a pattern meeting the Unit 11 threshold constitutes evidence sufficient to detect a standing opportunity."*
- `[D1 D1-OD-04, ~Line 480-482]` — *"Safety/high-risk triggers SHALL bypass the pattern requirement in D1-OD-01 and SHALL be treated as opportunities on first occurrence."* No parallel rule extends this status to explicit user statements/actions.
- `[T005 §15.7, ~Line 570]` — *"D1 Unit 05 lists this as a canonical source category but no canonical source assigns its Stage-3 detection to any specific engine."*
- `[T005 §36, G-2, ~Line 1286-1287]` — *"D1 Unit 05 lists this as a canonical Opportunity source; no canonical source (D1 or D2) assigns its Stage-3 detection to any specific engine... Tracked as future work: Architecture (AI Architect) to assign ownership, or confirm it is intentionally unowned/deferred."*
- `[D1 Unit 03, ~Line 313-316]` — *"Behavioral Events — records of what the user did or how they responded, retained by the system as evidence (C3)."*
- `[D1 Unit 11, ~Line 800-803]` — *"The following ranked tiers of evidentiary support apply throughout this specification."*
- `[CB Ch.3, Canonical principle, ~Line 2485]` — *"The coach never reacts to one event. A single occurrence is data. Only a pattern is evidence."* Restated verbatim at `[CB, ~Line 4605]` and among the Ten Canonical Principles at `[CB, ~Line 5170]`.
- `[CB Ch.3 §4, ~Line 2475]` — *"A single instance of almost anything is weak evidence on its own. The same observation recurring across multiple, independent occasions is far stronger evidence..."*
- `[SLDP RCD-08, ~Line 1049/1175]` — *"a single event may bypass the normal pattern requirement only when it represents an explicit constitutional safety signal... inference alone does not qualify"* — the resolved, governing decision on single-event bypass, scoped to safety signals only.
- `[SLDP RCD-12.B, ~Line 1217]` — *"a closed 6-value enum reusing D1 Unit 11's Evidence Hierarchy unaltered (EXPLICIT_USER_STATEMENT, EXPLICIT_USER_ACTION, REPEATED_BEHAVIOUR, SINGLE_BEHAVIOUR, INFERENCE, INSUFFICIENT)."*
- `[js/coachDecisionSystem/safetyLayer.js:75-78]` — the closed `EvidenceConfidence` enum, implemented and tested, matches RCD-12.B exactly.
- `[js/coachDecisionSystem/recommendationCategories.js:26-32]` — `OPPORTUNITY_SOURCES`, a closed, "do not add, remove, or rename," five-item enum, already excludes Explicit User Statement/Action as an independent source.
- `[D2 §Stage 3, ~Line 517-519]` — Stage 3's contributors are named as exactly three: the Recommendation Engine, the Initiative Engine, and the Safety Layer.
- `[D2 D2-EF-07, ~Line 1500-1523]` — a user correction is routed as *"a new, highest-tier (Explicit User Statement, D1 Unit 11 tier 1) Decision Input"* into a fresh Decision Pass at Stage 1 — not injected directly as a Stage-3 Opportunity.

## Repository Conflict Identified

`T005 §15.7`/`§36 G-2`'s characterization of D1 Unit 05 is not supported by Unit 05's own enumerated list. Separately, `D1 Unit 03`'s unqualified "retained... as evidence" and `D1-OD-01`/`D1-ER-02`/`CB Ch.3`'s repeated categorical "data, not evidence" framing were found to create unreconciled textual tension. Both questions were investigated adversarially (Supporting/Contradicting Evidence, Dependency Analysis, attempted stronger competing interpretations) before being submitted for Product/Architecture decision. Neither question was found, by repository evidence alone, to have a single, uniquely-derivable resolution — each required an actual Product/Architecture choice among evidence-grounded interpretations, in the same manner `SLDP RCD-15` records of its own resolution: *"a Product/Architecture choice among multiple canonically-valid architectures, not a conclusion uniquely derivable from prior text"* `[SLDP RCD-15, ~Line 1272]`.

---

# 04. Canonical Decisions

**CD-G2-01 — Explicit User Statement / Action Are Not Independent Canonical Opportunity Sources — RESOLVED**

- **Decision Statement:** Approved. Explicit User Statement and Explicit User Action are Decision Inputs and high-authority evidentiary signals (D1 Unit 11, Tiers 1-2) — they are **not** independent Canonical Opportunity Sources. The closed, five-item Canonical Opportunity Sources taxonomy fixed by D1 Unit 05 (Decision Windows, Anticipation from confirmed patterns, Disruption detection, Milestone/recovery triggers, Safety/high-risk triggers) is unchanged; no sixth source is introduced. Stage 3 MAY use Explicit User Statement/Action, made available through Pipeline Context, as high-authority evidentiary support toward detecting an Opportunity belonging to one of the existing five sources, but such use never itself constitutes a sixth, independent source. This decision does not identify which of the five sources such use would apply to in a given case, nor does it establish any preferred, primary, or default mapping between Explicit User Statement/Action and any specific one of the five — no repository evidence was found to support such a mapping, and none is introduced here.
- **Canonical Rationale:** Resolves `T005 §36 G-2` by confirming the ownership question it left open ("Architecture... to assign ownership, or confirm it is intentionally unowned/deferred") in favor of the latter: no ownership assignment is required because no independent source exists to own. Consistent with `D1-OD-04`, which confers "treated as opportunities on first occurrence" status only on safety/high-risk triggers, never extending it to explicit user statements/actions; consistent with `SLDP RCD-08`, the governing resolved decision on single-event bypass, which scopes the exception to constitutional safety signals only; consistent with `D2-EF-07`'s existing routing of a user correction as a Decision Input entering a fresh Decision Pass at Stage 1, not as a direct Stage-3 injection; and consistent with the already-implemented, closed `OPPORTUNITY_SOURCES`/`EvidenceConfidence` enums in `recommendationCategories.js` and `safetyLayer.js`, both of which already reflect exactly this model. `T005 §15.7`/`§36 G-2`'s own characterization of D1 Unit 05 ("lists this as a canonical source category") is superseded by this decision as an inaccurate reading of Unit 05's actual five-item list.
- **Approval Evidence:** Head of Product + AI Architect, Canonical Review — G-2 Investigation Canonical Update.
- **Documents Affected:** `D1_SPEC_v1.0.md` (Unit 05's source list — cross-reference addition only, no new source; `D1-OD-01` — wording clarification separating the evidentiary-sufficiency exemption from any implication of source independence). `T005_SPEC_v1.0.md` (§9.2, §15.7, §36 G-2 — correction of the Unit-05 characterization; closure of the Follow-up). See Chapter 06 — synchronization performed and independently reviewed.
- **Consequences:** `T005`'s G-2 Follow-up is closed — no future Architecture task is required to assign Stage-3 ownership for this source, because none is owed. Repository Gap G-2 (the architecture-level "no live Stage 3/4 Opportunity source" gap) is unaffected in substance — it remains open — but is no longer entangled with this now-resolved sub-question.
- **Backward Compatibility:** N/A — no prior independent-source status existed to be broken; this decision also forecloses any future engineering addition of a sixth `OPPORTUNITY_SOURCES` value for this purpose, consistent with `recommendationCategories.js`'s existing "do not add, remove, or rename" discipline.

**CD-G2-02 — One Canonical Evidence Concept, Distinguished by Sufficiency — RESOLVED**

- **Decision Statement:** Approved. FITME has exactly one canonical Evidence concept, governed by D1 Unit 11's Evidence Hierarchy. Behavioral Events (D1 Unit 03) and other Decision Inputs may contribute evidentiary information without, by themselves, constituting evidence *sufficient* for detecting a standing Opportunity. The distinction between a single Behavioral Event and a confirmed pattern is one of evidentiary **sufficiency**, not two different Evidence concepts. Accordingly, `D1-OD-01`'s wording — "a single event SHALL be treated as data, not evidence" — and `D1-ER-02`'s citation of the same Coach Bible principle are to be read as "a single event does not, by itself, constitute sufficient evidence for detecting a standing Opportunity," not as introducing a second, competing definition of Evidence alongside Unit 11's.
- **Canonical Rationale:** Resolves the Unit 03 / Unit 05 / Unit 11 terminological tension identified during the G-2 Investigation. Consistent with Unit 11's own self-declared scope, *"apply throughout this specification"* `[D1 Unit 11, ~Line 800-803]`, and with Unit 03's own cross-reference deferring to Unit 11 for how confidence attaches to its inputs `[D1 Unit 03, ~Line 354-357]`. Directly consistent with the Coach Bible's own adjacent, non-Canonical-Principle prose — *"weak evidence... far stronger evidence"* `[CB Ch.3 §4, ~Line 2475]` — which already frames single-instance observations on a sufficiency gradient rather than a strict binary. Directly consistent with, and precedented by, the already-resolved `SLDP RCD-12.B`, which built its closed `EvidenceConfidence` enum by *"reusing D1 Unit 11's Evidence Hierarchy unaltered"* and adding exactly one further value, `INSUFFICIENT` — a sufficiency-gradient extension of the same hierarchy, not a second hierarchy — and which is already implemented in production at `[js/coachDecisionSystem/safetyLayer.js:75-78]`. The three-times-repeated verbatim Coach Bible Canonical Principle ("a single event is data, only a pattern is evidence," `[CB, ~Line 2485, 4605, 5170]`) is not altered or reinterpreted by this decision — it remains the governing philosophy text — but its translation into D1's own SHALL-rule commentary (`D1-OD-01`, `D1-ER-02`) is clarified to state explicitly that it expresses a sufficiency threshold, matching the reading Unit 11 and RCD-12.B already establish operationally.
- **Approval Evidence:** Head of Product + AI Architect, Canonical Review — G-2 Investigation Canonical Update.
- **Documents Affected:** `D1_SPEC_v1.0.md` (Unit 03 — sufficiency-qualified wording; `D1-OD-01` — wording clarification, shared with CD-G2-01's edit at the same location; Unit 11 — cross-reference confirming its governing scope; `D1-ER-02` — clarifying annotation of its existing Coach Bible citation, without altering the Coach Bible's own text). `T005_SPEC_v1.0.md` (§15.2 Exclusions — corrected quotation of `D1-OD-01`). The Coach Bible itself is explicitly **not** modified by this decision — see Explicit Non-Interpretations, Chapter 01, and Chapter 06. See Chapter 06 — synchronization performed and independently reviewed.
- **Consequences:** Removes the textual basis for reading Unit 03 and Unit 05/Unit 11 as describing two different things called "evidence." Confirms, at the canonical-decision level, the semantics `SLDP RCD-12.B` already operationalized for the Safety Layer specifically, now stated as D1's own general-purpose reading.
- **Backward Compatibility:** N/A — no prior canonical statement declared two distinct Evidence concepts to be broken; this decision also forecloses any future engineering design introducing a second, competing Evidence Hierarchy.

**CD-G2-03 — Initiative May Express Minimal Contextual Assistance — RESOLVED**

- **Ambiguity Being Resolved:** Prior repository investigation established that the canonical Initiative definition (`D1 Shared Vocabulary`; `D1 Unit 09`) is content-agnostic — it requires only coach-originated contact, not any specific content type — while the required `InitiativeCandidate.action` field in `T005` is described as *"the substance of the Initiative"* (`~Line 734`), a phrasing that connotes, without ever stating, concrete proposed content. The repository did not previously settle whether that required substance may consist of a minimal proactive offer of contextual assistance rather than behavioral advice, a recommendation, an instruction, or an insight. This was recorded as an open interpretive question ("Initiative Capable but Canonically Ambiguous"), not a settled contradiction, in the investigation immediately preceding this decision.
- **Decision Statement:** Approved. A minimal proactive offer of contextual assistance is a valid form of the existing canonical Initiative. For Initiative semantics, the required `action` does NOT have to contain behavioral advice, a recommendation, a specific instruction, or an insight. `action` represents the substantive intent of the coach-originated contact. Therefore an action such as `offer contextual assistance` may validly satisfy the `InitiativeCandidate.action` requirement, provided the Initiative satisfies all existing canonical eligibility, relationship, value, restraint, evidence, prioritization, and other Initiative rules (D1-IP-01 through D1-IP-09; D1 Unit 06). The rendered user-facing sentence (e.g., "If you need help choosing a meal, I'm here.") is not the canonical `action` itself — Expression remains solely responsible for rendering an already-formed `action` into language, per `D1-CDO-03`. This decision does not create a new Terminal Decision type, a new Candidate family, or a new pipeline Stage; does not introduce a user-opt-in gate; does not require Candidate Generation or Decision Formation to wait for a user reply; does not change Initiative eligibility or prioritization rules; and does not change the existing Stage sequence. If the user subsequently responds to the Initiative, that new input is evaluated through an ordinary fresh Decision Pass — no deferred continuation of the original pass is established.
- **Canonical Rationale:** Consistent with `D1 Shared Vocabulary`'s and `D1 Unit 09`'s own content-agnostic definition of Initiative ("coach-originated contact," not "an intentional attempt to improve the user's next decision" — the latter phrase belonging only to Recommendation's definition, which explicitly excludes "a notification, tip, or passive observation"). Consistent with `D1-IP-03`'s value-increase test, which names Trust and Relationship — not only Decision quality — among the qualifying dimensions a minimal, respectful offer plausibly satisfies. Consistent with `D1-CDO-03` ("decision precedes expression"): this decision preserves that separation exactly, keeping the decided `action` distinct from its later Expression rendering. Consistent with `PD-G2-05` ("Proactive Contextual Presence," Chapter 07), which this decision operationalizes within the existing Initiative category rather than introducing a new one. No canonical source in D1, D2, D3, `T005`, `T006`, or Expression was found, on adversarial review, to require Initiative `action` to be behavioral advice, a recommendation, an instruction, or an insight — the requirement was connoted by field naming and an implementation population pattern (`action: opportunity.proposedAction`, `js/coachDecisionSystem/initiativeEngine.js:246`), never stated as a rule.
- **Approval Evidence:** Head of Product + AI Architect, Canonical Review — G-2 Investigation Canonical Update (PD-G2-05 / CD-G2-03 round).
- **Documents Affected:** `T005_SPEC_v1.0.md` (`InitiativeCandidate.action` field description — additive cross-reference only, no semantic change to the field's required status or shape). See Chapter 08 — synchronization performed and independently reviewed.
- **Consequences:** The previously-open interpretive question of whether `action` must be substantive coaching content is resolved. No existing closed SPEC content is corrected or superseded — the ambiguity is filled, not a stated rule overturned. `PD-G2-05` now has a canonical representation path within the existing Initiative category, without any new pipeline element.
- **Backward Compatibility:** Additive only — the `InitiativeCandidate` contract's required fields, shapes, and validation rules are unchanged; this decision only clarifies what content may populate the existing, unmodified `action` field.

---

# 05. Status and Closure

## Completion Checklist

- **Decided and approved:** CD-G2-01, CD-G2-02, CD-G2-03, AD-G2-01 (Chapter 09), AD-G2-02 (Chapter 11), AD-G2-03 (Chapter 13). This Package itself is reviewed and accepted by Product & Architecture at each round.
- **Recorded for traceability, not decided by this Package:** PD-G2-05 (Chapter 07) — a Product decision approved separately by Product; recorded here only because CD-G2-03 and AD-G2-01 operationalize it.
- **Performed:** Repository synchronization into `D1_SPEC_v1.0.md` and `T005_SPEC_v1.0.md` for CD-G2-01/CD-G2-02 (Chapter 06), including two additional `T005` locations (§9.2, §15.2) found during the post-synchronization consistency review and corrected under the same, already-approved decisions. A further, minimal, additive-only synchronization into `T005_SPEC_v1.0.md`'s `InitiativeCandidate.action` field description for CD-G2-03 (Chapter 08). No repository synchronization was required for AD-G2-01 beyond this Package itself (Chapter 10). For AD-G2-02, minimal, additive-only, audit-trail-preserving synchronization into `D2_SPEC_v1.0.md` (Stage Overview item 4, Stage 4 Dependencies), `D3_SPEC.md` (§6.4 Responsibility Matrix, §8.3 Decision Layer), and `TASK_006_SPEC_v1.0.md` (§9.2, §13 item 5, §23.1, §14.7 table, §31 table, §38 item G-2 — now marked RESOLVED) (Chapter 12). No repository synchronization was required for AD-G2-03 beyond this Package itself (Chapter 14) — it adds a new, bounded capability without contradicting any existing closed statement. `docs/roadmap/Changelog.md` updated at each round per repository precedent (see header Revision note).
- **Confirmed out of scope, unmodified for AD-G2-02 and AD-G2-03:** Coach Bible, Constitution, Product Bible, D1, TASK-005, SL-001, Expression, Architecture doc, Engineering Workflow, `docs/roadmap/Roadmap.md`, and all implementation files — none required modification (Chapter 12, Chapter 14). D2, D3, and TASK-006 required minimal additive synchronization for AD-G2-02 only (see Performed, above) — each remains otherwise unmodified and none required any change for AD-G2-03. Repository-wide consistency sweeps at each round found no remaining reference to the pre-resolution state of any decision outside this Package's own historical citations (Chapter 03; Chapter 07's ambiguity record for CD-G2-03; Chapter 09's own review record for AD-G2-01; Chapter 11's review record for AD-G2-02; Chapter 13's review record for AD-G2-03).
- **Owner:** Head of Product + AI Architect — reviewed and approved at each round.
- **Blocks synchronization:** No — synchronization is complete, independently reviewed, and closed for all three Canonical Decisions and all three Architecture Decisions.
- **Status of Repository Gap G-2 itself (architecture-level, no live Stage 3/4 Opportunity source):** AD-G2-01 was the approved *plan* for resolving it; AD-G2-02 and AD-G2-03 were foundational architecture closed in preparation for it. **G-2 has since been implemented, tested, and closed through its own SPEC** (`docs/specs/G2_SPEC_v1.0.md`, IMPLEMENTED / VERIFIED / CLOSED) — see that SPEC's §53 Closure Record and Coach Semantic Foundation Canonical Decision Package Chapter 29.8 for the complete evidence. This closure update does not alter any decision recorded in this Package.
- **No deferred-reasoning or opt-in pipeline established:** explicitly confirmed — CD-G2-03, PD-G2-05, AD-G2-01, AD-G2-02, and AD-G2-03 all explicitly disclaim any pause, gate, or deferred continuation of the pipeline; any subsequent user response is handled by an ordinary fresh Decision Pass, an existing, unmodified mechanism.
- **No implementation status falsely recorded as complete:** explicitly confirmed — AD-G2-01, AD-G2-02, and AD-G2-03 are approved architecture, not built or tested features; no test count, `APP_VERSION`, or "implemented" status is claimed anywhere in this Package for any of them.
- **Decision Window closing criterion:** not reopened by AD-G2-02 or AD-G2-03; remains explicitly unresolved and non-load-bearing, per `AD-G2-01`'s own terms (Chapter 09).

---

# 06. Repository Synchronization — Performed and Reviewed

This chapter records the Canonical Synchronization Plan as executed, plus the two further locations corrected under the same authorization during the post-synchronization consistency review.

## Dependency Order (as executed)

1. This Package was the cited authority for every downstream change.
2. `D1_SPEC_v1.0.md` — Units 03, 05, 11, and `D1-OD-01`/`D1-ER-02` — synchronized first, since `T005`'s own correction cites D1's corrected text as its authority.
3. `T005_SPEC_v1.0.md` — §15.7 and §36 G-2 — synchronized next, closing the Follow-up with a citation to CD-G2-01.
4. `T005_SPEC_v1.0.md` — §9.2 and §15.2 — two further locations, found during the post-synchronization consistency review to carry the same pre-correction claims, corrected under the same CD-G2-01/CD-G2-02 authorization (no new decision required).

## Modifications Performed

| Location | Type | Status |
|---|---|---|
| D1 Unit 03 (~Line 313-320) | Wording correction — sufficiency-qualified, per CD-G2-02 | Performed |
| D1 Unit 05, source list (~Line 445-477) | Cross-reference update only — no content added to the five-item list, per CD-G2-01 | Performed |
| D1 `D1-OD-01` (~Line 481-490) | Wording correction — serves both CD-G2-01 (separates the evidentiary exemption from source-independence) and CD-G2-02 (sufficiency framing) | Performed |
| D1 Unit 11 (~Line 818-826) | Cross-reference update — confirms governing scope, per CD-G2-02 | Performed |
| D1 `D1-ER-02` (~Line 846-851) | Clarification only — annotates the existing Coach Bible citation, per CD-G2-02; Coach Bible text itself unchanged | Performed |
| T005 §15.7, Ownership + Output/pass condition (~Line 570-571) | Wording correction, per CD-G2-01 | Performed |
| T005 §36, G-2 (~Line 1286-1287) | Obsolete statement removal + cross-reference update to this Package, per CD-G2-01 | Performed |
| T005 §9.2, Initiative Engine Stage-3 exclusions (~Line 272) | Wording correction, audit history preserved, per CD-G2-01 | Performed (post-sync review extension) |
| T005 §15.2, Confirmed-Pattern Anticipation Exclusions (~Line 524) | Wording correction, audit history preserved, per CD-G2-02 | Performed (post-sync review extension) |

## Verification Performed

No architectural change. No behavioral change. No implementation change. No new Product decision beyond CD-G2-01/CD-G2-02. A final repository-wide sweep (docs, `js/`, `tests/`) confirmed no remaining reference to the pre-resolution state of either decision outside this Package's own deliberate historical citations in Chapter 03. `docs/roadmap/Changelog.md` updated per repository precedent (header Revision note); `docs/roadmap/Roadmap.md` requires no update, per the same precedent.

---

# 07. Product Decision Context — PD-G2-05 (Recorded, Not Made by This Package)

**PD-G2-05 — Proactive Contextual Presence — PRODUCT APPROVED**

This Package did not make this decision; it is recorded here, per the SLDP precedent of recording the Product decision a Canonical Decision operationalizes, because CD-G2-03 (Chapter 04) exists specifically to resolve the canonical-representability question PD-G2-05 exposed.

- **Decision Statement (as approved by Product):** FITME SHALL be capable of proactively recognizing contextually relevant moments in which the user may benefit from coaching support, even when the user has not explicitly requested assistance. FITME SHALL NOT treat recognition of such a moment as an automatic requirement to provide substantive coaching advice. Where appropriate, FITME MAY instead initiate a minimal, context-aware offer of assistance that communicates availability while preserving user autonomy and minimizing unnecessary interruption. Whether FITME proactively engages, and the appropriate degree of that engagement, SHALL remain sensitive to the user's goals, current context, relationship, relevance, and expected value of the interruption.
- **Clarification (as approved by Product):** PD-G2-05 does NOT establish a requirement to defer Coach reasoning until after user acceptance. No user-opt-in gate, paused pipeline, or deferred continuation is established.
- **Approval Evidence:** Head of Product, Product Decision Workshop.
- **Repository Review Prior to Approval:** an adversarial canonical review found the Product intent fully supported across the Constitution (Ch.8, Ch.12), the Coach Bible (Ch.2 §10, Ch.3 §11), the Intelligence & Relationship Philosophy document (Ch.3 "Independence Is Success," Ch.4 "Less Advice Can Produce Better Results"), and D1 (Units 05, 06, 07, 09), with no contradiction found in any reviewed source; the review separately identified a canonical-model representation question (whether the minimal-offer content is representable within the existing Initiative category), which this Package's CD-G2-03 (Chapter 04) resolves.
- **Relationship to G-2:** PD-G2-05 does not resolve, and does not depend on the resolution of, Repository Gap G-2 (no live Stage 3/4 Opportunity source). It is a Product-intent decision; its canonical representability was the open question CD-G2-03 addresses.

---

# 08. Repository Synchronization — CD-G2-03 (Performed and Reviewed)

## Modification Performed

| Location | Type | Status |
|---|---|---|
| `T005_SPEC_v1.0.md`, `InitiativeCandidate.action` field description (~Line 734) | Additive cross-reference only — clarifies that minimal contextual-assistance content satisfies the existing, unmodified `action` requirement, per CD-G2-03; no change to the field's required status, shape, or any other contract element | Performed |

## Verification Performed

No architectural change. No behavioral change. No implementation change. No new Product decision beyond PD-G2-05 (approved separately by Product) and CD-G2-03. No new Terminal Decision type, Candidate family, pipeline Stage, or user-opt-in gate was introduced anywhere in this synchronization. A repository-wide contradiction check (docs, `js/`, `tests/`) for "minimal proactive assistance," "Initiative content semantics," "InitiativeCandidate.action," "deferred reasoning / user opt-in," and "Terminal Decision taxonomy" found no remaining contradiction — see the Documentation Update Report accompanying this revision for the full sweep. `docs/roadmap/Changelog.md` updated per repository precedent (header Revision note); `docs/roadmap/Roadmap.md` requires no update, per the same precedent already applied at v1.1.

---

# 09. Architecture Decision — AD-G2-01: G-2 Recognition Architecture

**Status: APPROVED (Architecture Decision, not yet implemented)**

## Purpose and Scope

AD-G2-01 establishes FITME's first live canonical Opportunity Recognition path. It connects existing real user data and derived intelligence to Stage 3 Opportunity Detection of the *existing* Coach Decision System. AD-G2-01 does not redefine FITME's coaching philosophy, does not reopen CD-G2-01/02/03 or PD-G2-05, and does not itself resolve Repository Gap G-2 — resolution requires actual implementation, which this decision authorizes the future SPEC to pursue but does not itself perform.

## Review Record

An Adversarial Canonical & Repository Review evaluated a 19-item proposed architecture (`G2-RA-01` through `G2-RA-19`) against the complete canonical corpus (Constitution, Coach Bible, Intelligence & Relationship Philosophy, D1, D2, D3, TASK-004/005/006, SL-001, Expression, B5, this Package, Architecture doc, Engineering Workflow) and current production code. The review's overall verdict was **APPROVE WITH REQUIRED CLARIFICATIONS** — explicitly: no Product Blocker, no Architecture Blocker, no Contract Blocker, no Canonical Contradiction — conditioned on three exact wording clarifications, all incorporated below. The review's Contract Trace confirmed neither existing closed contract (`OpportunityEligibilityInput`, Stage 5; `EligibleOpportunity`, Stage 6) currently has an assigned constructor, and that `proposedAction`/`evidenceBasis` are correctly pre-Stage-6 responsibilities (Stage 6's own code copies rather than generates them). The review's Decision Window special review returned **CONDITIONAL**: G-2 Core can remain deterministic without resolving the closing criterion, provided actual Stage-3 detection logic never needs to evaluate window-closure as part of its own pass/fail logic — this condition is carried forward as an explicit, binding limitation in `G2-RA-09` below.

## The Nineteen Items (as approved, with three corrected)

**G2-RA-01 — Purpose.** G-2 establishes FITME's first live canonical Opportunity Recognition path. It connects existing real user data and derived intelligence to Stage 3 Opportunity Detection of the existing Coach Decision System. G-2 does not redefine FITME's coaching philosophy.

**G2-RA-02 — Pipeline.** The intended architecture remains: Canonical Data Sources → Memory Layer / Pipeline Context → Stage 3 Opportunity Detection → Stage 4 Evidence Evaluation → Stage 5 Eligibility → Stage 6 Candidate Generation → Stage 7 Prioritization → Stage 8 Winner Selection → Stage 9 Decision Formation → Stage 10 Expression. No parallel coaching pipeline is introduced. The existing Composite Engine remains the single orchestration authority.

**G2-RA-03 — No New Context Engine.** G-2 does not introduce a separate Context Engine. Existing Memory Layer / Pipeline Context remains the context assembly boundary. Stage-3 contributors interpret approved context for Opportunity Detection.

**G2-RA-04 — Stage-3 Contributors.** Stage 3 continues to have exactly the already-canonical contributors: Recommendation Engine, Initiative Engine, Safety Layer. No fourth Opportunity reasoning authority is introduced.

**G2-RA-05 — Stage-3 Aggregation (CORRECTED).** The existing Composite Engine orchestration SHALL invoke the authorized Stage-3 contributors and aggregate their detected Opportunities before the pipeline continues. The aggregation function is NOT a reasoning authority. It may: invoke authorized Stage-3 detectors; collect their outputs; perform contract normalization where canonically permitted; pass detected Opportunities forward. It SHALL NOT: invent coaching rationale; invent evidence; invent confidence; invent proposed action; perform Eligibility; prioritize Opportunities; choose a winner; create Expression. **A Safety-sourced detection SHALL preserve its canonical unconditional-bypass status throughout aggregation and normalization. It SHALL NOT be subjected to ordinary Recommendation/Initiative treatment that could weaken, remove, reinterpret, or lose the existing `safetyHighRiskBypass` semantics.**

**G2-RA-06 — Detected Opportunity Contract.** G-2 SHALL establish one canonical Stage-3 output contract representing a Detected Opportunity. The future SPEC must reconcile this contract with existing contracts (`OpportunityEligibilityInput`, `EligibleOpportunity`) rather than create an unnecessary parallel schema, and must explicitly address how one Stage-3 representation serves both existing downstream consumers. Semantically, Stage 3 must provide the information required downstream, including where applicable: stable identity; source category; recognition/reason basis; evidence/evidence basis; confidence/uncertainty; detected time; substantive/proposed intent where required by the contributor; sufficient information for Stage 4 and Stage 5 to construct/use their already-canonical inputs. Exact field names are not decided by this architecture statement and must be derived from existing canonical contracts during SPEC authoring.

**G2-RA-07 — Semantic Ownership.** The Stage-3 contributor that detects an Opportunity owns the semantic judgment that produced it. The contributor, not the orchestrator, is responsible for the meaning of: why the Opportunity exists; what evidence supports the recognition; confidence/uncertainty attributable to recognition; substantive intent/proposed action where that contributor requires one. The orchestrator must not manufacture missing semantic judgments.

**G2-RA-08 — Evidence vs. Confidence.** Evidence and Confidence remain distinct. Evidence describes what supports the recognition. Confidence describes the strength/certainty of FITME's interpretation. `CD-G2-02` remains authoritative. Stage 3 may recognize an Opportunity under uncertainty. Stage 4 retains its canonical Evidence Evaluation responsibility. G-2 must not collapse Stage 3 and Stage 4.

**G2-RA-09 — Decision Window (CORRECTED).** G-2 SHALL NOT require a globally observable boolean such as `decisionWindowOpen = true/false` as a prerequisite for Opportunity Detection. FITME is not required to possess certain knowledge of hidden real-world decision state. Stage 3 may recognize that a relevant Decision Moment/Opportunity may exist based on evidence and confidence. The unresolved question of the exact canonical Decision Window closing criterion is NOT resolved by G-2 and is confirmed NOT BLOCKING G-2 Core Recognition. This decision does not delete, rewrite, or redefine existing Decision Window canon. **G-2 Core SHALL NOT make evaluation of the Decision Window closing state a required pass/fail condition for Stage-3 Opportunity Detection. Stage-3 detection for G-2 Core SHALL rely only on already-canonical, deterministic recognition inputs such as: approved evidence; confidence/uncertainty; the established Decision Window/recognition opening semantics; other already-canonical Stage-3 inputs. If any future detector requires an explicit rule equivalent to "reject this Opportunity because the Decision Window has closed," then the unresolved canonical Decision Window closing criterion SHALL first be resolved through a separate Product/Architecture decision before that rule may be introduced. This clarification does not choose between Event-occurrence, Reversibility, or Influence Capability — it keeps that question explicitly unresolved and non-load-bearing for G-2 Core.**

**G2-RA-10 — G-2 Core Signal Scope.** G-2 Core uses only signals that already have a legitimate implemented source or approved existing access path. Candidate existing sources include, subject to repository verification: nutrition/history/current nutrition data where actually available; workout/body history; Habit intelligence; Pattern intelligence; recommendation feedback; Profile/Goal data only where an approved read path can be proven; other already-implemented canonical signals reachable through approved paths. G-2 must not fabricate unavailable context.

**G2-RA-11 — Out of Scope Data Acquisition.** The following are NOT added as new acquisition capabilities by G-2 Core: Location/GPS/Places; inbound free-text Coach Chat; new Life Event acquisition; new Capacity-state acquisition; new Relationship-Maturity acquisition. Their canonical concepts are not removed. They remain future signal/context acquisition capabilities that may later feed the same Recognition Architecture.

**G2-RA-12 — Time.** G-2 distinguishes bookkeeping timestamps from temporal recognition context. A timestamp such as `assembledAt` must not automatically be treated as a canonical time-of-day recognition signal merely because it exists. Where Stage 3 requires temporal context, its authority and representation must be explicit and deterministic.

**G2-RA-13 — Derived Intelligence.** G-2 SHALL NOT re-derive Habit or Pattern intelligence. Existing canonical derivation authorities remain unchanged. Stage 3 consumes approved derived intelligence through the existing B5 consumption path.

**G2-RA-14 — Recommendation Detection (CORRECTED).** Recommendation Engine SHALL fulfill its existing canonical Stage-3 responsibility for Decision-Window detection. Its Stage-3 responsibility is to determine whether the current approved evidence/context supports carrying forward a Decision-Window-sourced Opportunity. At Stage 3 it SHALL NOT: choose the final recommendation; perform downstream prioritization; perform winner selection; perform Expression. This clarification narrows the architecture to the exact responsibility already assigned by D2 Stage 3.

**G2-RA-15 — Initiative Detection.** Existing Initiative detection logic is the starting point for the Initiative Engine's Stage-3 contribution. G-2 SHALL connect that capability to the live production orchestration path and reconcile its output with the canonical Detected Opportunity contract. `CD-G2-03` remains authoritative: a valid Initiative may represent minimal contextual assistance and does not have to contain behavioral advice.

**G2-RA-16 — Safety.** G-2 does not redesign Safety Layer authority. Any Stage-3 Safety contribution must integrate into the same canonical Stage-3 path without creating a competing pipeline or weakening existing Safety governance/override authority. (See `G2-RA-05`'s corrected wording for the specific mechanism preserving this.)

**G2-RA-17 — Opportunity Does Not Require Engagement.** Detected Opportunity does NOT mean: notification; recommendation; Initiative; mandatory engagement. It means only that a situation is worth carrying forward for downstream evaluation. Existing Eligibility, prioritization, restraint, expected-value, Trust, Safety, and Decision Formation rules remain responsible for determining whether the result is engagement or Silence.

**G2-RA-18 — Extensibility.** Future signals such as Location or inbound conversation should be able to enter the same Recognition Architecture without creating a second Coach Decision System. G-2 is not required to implement those sources now.

**G2-RA-19 — Minimum Live Completion.** At minimum, G-2 must make it possible for at least one real production signal path to flow from real user/system data, through approved context/derived intelligence, through a Stage-3 contributor, to a real Detected Opportunity, through Stage 4+, into the existing Coach Decision System — without hand-authored Opportunity fixtures, hardcoded `opportunities:[]`, or test-only injection. The architecture must also establish a valid integration path for all three canonical Stage-3 contributors even if their internal detection logic differs (an honest, permanently-empty detector, such as Safety Layer's current one, satisfies this for that contributor).

## Explicit Preserved Boundaries

This Package explicitly confirms AD-G2-01 preserves, unchanged: exactly three Stage-3 contributors (`G2-RA-04`); single Composite Engine orchestration authority (`G2-RA-02`, D3 Decision 1); exclusive Memory Layer / Pipeline Context assembly ownership (`G2-RA-03`, D3 §11.1); the existing B5 derived-intelligence authorities (`G2-RA-13`); Safety Layer's unconditional-bypass authority (`G2-RA-05` corrected, `G2-RA-16`); Stage 4's existing Evidence Evaluation authority, undiminished by Stage-3 evidence/confidence reporting (`G2-RA-08`); and Stage 5 through Stage 10's existing, unmodified authority (`G2-RA-02`, `G2-RA-17`).

## Explicit Non-Scope

This Package explicitly confirms AD-G2-01 does not add: Location/GPS/Places acquisition; inbound free-text Coach Chat acquisition; new Life Event Context acquisition; new Capacity-State acquisition; new Relationship-Maturity acquisition (`G2-RA-11`). Each remains a valid, canonical future signal source, not removed or diminished by this decision (`G2-RA-18`).

## Explicit Conceptual Separation

Opportunity Detection ≠ engagement ≠ notification ≠ Recommendation ≠ Initiative (`G2-RA-17`). A Detected Opportunity means only that a situation is worth carrying forward for downstream evaluation; whether FITME ultimately engages, and in what form, remains the exclusive responsibility of Stage 5 (Eligibility), Stage 6 (Candidate Generation, including `CD-G2-03`'s minimal-Initiative representation), Stage 7-9 (Prioritization/Winner Selection/Decision Formation), and Stage 10 (Expression) — all unchanged by this decision.

## Decision Window Status

The precise Decision Window closing criterion (Event-occurrence / Reversibility / Influence Capability) remains explicitly unresolved and is NOT decided by AD-G2-01. Per `G2-RA-09`'s corrected wording, G-2 Core's Stage-3 detection logic must not depend on resolving it; if a future detector's design would require doing so, that detector may not be introduced until the closing criterion is separately resolved by Product/Architecture.

## Approval Evidence

Head of Product + AI Architect, Canonical Review — Adversarial Canonical & Repository Review of the G-2 Recognition Architecture, accepted subject to the three corrections above, all incorporated into the text recorded here.

## Documents Affected

None beyond this Package. AD-G2-01 is a forward-looking architecture decision, not yet implemented; it creates no stale statement in any other closed canonical document (see Chapter 10).

## Consequences

The G-2 Recognition Architecture is now canonically approved and available to a future SPEC. Repository Gap G-2 itself remains open — this decision authorizes, but does not perform, its resolution.

## Backward Compatibility

Additive only. No existing contract, Stage boundary, engine responsibility, or closed Canonical/Architecture Decision is altered.

---

# 10. Synchronization Review — AD-G2-01

## Documents Inspected and Confirmed Unchanged

| Document | Why unchanged |
|---|---|
| `D1_SPEC_v1.0.md` | Defines policy only (Opportunity sources, Evidence Hierarchy, Eligibility, Initiative Policy); AD-G2-01 operationalizes existing D1 policy without altering it. No stale statement created. |
| `D2_SPEC_v1.0.md` | Stage 3/4/5/6 definitions remain fully accurate; AD-G2-01 builds strictly within their existing boundaries (confirmed by this Package's own Contract Trace, Chapter 09). D2's own statement that Stage 4 has no named orchestration owner remains true — AD-G2-01 does not assign one. |
| `D3_SPEC.md` | Describes the approved architecture (Composite Engine, Orchestrator boundaries) that AD-G2-01 extends by direct analogy (Stage-3 aggregation mirrors the already-approved `dispatchStage6` pattern); no existing D3 statement becomes false. |
| `TASK_005_SPEC_v1.0.md` | Initiative semantics and the `InitiativeCandidate` contract are explicitly not altered by AD-G2-01 (`G2-RA-15`); `CD-G2-03`'s prior additive cross-reference (Chapter 08) remains sufficient. |
| `TASK_006_SPEC_v1.0.md` | Decision Engine's Stage 5/7/8/9 contracts are unmodified; AD-G2-01 does not touch them. |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | This document describes *current, implemented* state ("Current-State Architecture"). AD-G2-01 is an approved plan, not yet built — recording it in the Architecture doc now would misrepresent implementation status, which this synchronization review explicitly avoids. To be updated only at a future implementation closure. |
| `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` | Governs the generic task lifecycle; unaffected by the content of any specific architecture decision. |
| `docs/roadmap/Roadmap.md` | No task implementing G-2's live wiring exists yet; per the precedent already applied at v1.1/v1.2, Decision Packages are referenced from their eventual implementing task's own Roadmap entry, not given a standalone entry. AD-G2-01 does not change this. |

## Document Updated

`docs/roadmap/Changelog.md` — updated per repository precedent (SLDP's and this Package's own established multi-round Changelog-update pattern). See the Documentation Update Report for the exact change.

---

# 11. Architecture Decision — AD-G2-02: Stage 4 Evidence Evaluation Orchestration

**Status: APPROVED (Architecture Decision, not yet implemented)**

## Purpose and Scope

AD-G2-02 closes the Stage-4 orchestration-ownership gap first identified during the G-2 Investigation series and tracked as `T006` §38 item G-2 ("Stage 4 Evidence Evaluation orchestration ownership... Required resolution: Architecture (AI Architect), to assign Stage 4 ownership or confirm it is intentionally unowned"). It assigns the Decision Engine narrow, explicit Stage-4 orchestration authority. It does not reopen CD-G2-01/02/03, PD-G2-05, or AD-G2-01, and does not itself resolve Repository Gap G-2.

## Approval Record

Approved directly by the Head of Product + AI Architect, following a Pre-G-2 Canonical Decisions Architecture Recommendation (advisory) that identified Stage-4 ownership as one of two decisions worth closing before G-2 SPEC authoring, to avoid near-term architectural rework once Recommendation Engine's Stage-3 detector is built. No adversarial repository review round preceded this approval within this Package; the decision text below is recorded as approved, verbatim in substance.

## The Decision (as approved)

**1. Stage 4 remains mandatory and distinct.** Evidence Evaluation is a separate, mandatory Stage in the Coach Decision Pipeline. The order remains: Stage 3 (Opportunity Detection) → Stage 4 (Evidence Evaluation) → Stage 5 (Eligibility Evaluation). G-2 SHALL NOT merge Stage 3 with Stage 4. G-2 SHALL NOT merge Stage 4 with Stage 5.

**2. Decision Engine receives narrow Stage-4 orchestration authority.** The Decision Engine receives narrow, explicit authority to orchestrate Stage 4 only. This authority does NOT grant the Decision Engine: Stage-3 Opportunity Detection authority; ownership of D1 Evidence policy; authority to invent evidence; authority to invent rationale; authority to invent confidence; authority to invent `proposedAction`; authority to redefine the Evidence Hierarchy; Expression authority; Safety authority; direct Decision Input read authority; broader Pipeline Context read authority.

**3. Stage-4 execution.** Stage 4 is executed by a dedicated internal, pure, deterministic component within the Decision Engine's boundary. This component is NOT a new Engine; is NOT a seventh collaborator; is NOT registered in the Engine Registry; is NOT an independent canonical top-level component; and receives no independent authority. It is an internal execution component only. A name such as `EvidenceEvaluator` may be used at SPEC/implementation level, but this canonical decision does not mandate any specific filename or symbol name.

**4. Evidence policy authority.** D1 Unit 11 / the canonical Evidence Hierarchy remain the sole source of Evidence policy. Stage 4 implements that policy. Stage 4 has no authority to change it or to create a parallel policy.

**5. Stage-4 input boundary.** Stage 4 receives the Opportunity detected at Stage 3 and the evidence/confidence basis supplied by the detecting contributor. Stage 4 has no authority to invent evidence, rationale, confidence, or proposed action. Pipeline Context may be used only within canonically approved authority.

**6. Stage-4 output boundary.** Stage 4 must produce an explicit Evidence Evaluation result distinguishing at least sufficient evidence from insufficient evidence. The result must preserve or record the canonical Evidence tier, or equivalent canonical traceability to the Evidence Hierarchy. Exact contract fields/types remain for the G-2 SPEC.

**7. Insufficient-evidence behavior.** An Opportunity with insufficient evidence terminates internally within the pipeline, before Stage 5. No fabricated Silence, synthetic user-facing outcome, or replacement Opportunity may be created. This behavior must remain consistent with D2 and with D1-SP-02/03 (already-canonical, unmodified).

**8. Sufficient-evidence behavior.** An Opportunity with sufficient evidence may proceed to Stage 5. Stage 4 does not perform Eligibility Evaluation.

**9. Internal Pipeline Orchestrator.** The Internal Pipeline Orchestrator sequences Stage 4; invokes the Stage-4 execution component; passes sufficient Opportunities to Stage 5; stops insufficient Opportunities before Stage 5. The Orchestrator is not: the Evidence-policy owner; an Evidence-classification authority; a seventh collaborator; a replacement for Decision Engine authority.

**10. Architectural boundary.** AD-G2-02 adds no new Engine and no new collaborator. It closes the Stage-4 ownership gap within the existing Coach Decision System Composite Engine.

## Explicit Preserved Boundaries

AD-G2-02 preserves, unchanged: exactly three Stage-3 contributors (`AD-G2-01` `G2-RA-04`); single Composite Engine orchestration authority (D3 Decision 1); exclusive Memory Layer / Pipeline Context assembly ownership (D3 §11.1); D1 Unit 11 as the sole Evidence-policy authority (Item 4, above); the existing, unmodified Stage 3/Stage 5 boundary and every other Stage's existing authority (Item 1, above); Safety Layer's unconditional Stage-4/Stage-5 bypass for safety/high-risk-triggered Opportunities (D2 §Stage 4 Entry Criteria; `AD-G2-01` `G2-RA-05`/`G2-RA-16`, unaffected).

## Explicit Non-Scope

AD-G2-02 does not: assign Stage-3 Opportunity Detection authority to the Decision Engine (Item 2); create a new Terminal Decision type, Candidate family, or pipeline Stage; define the exact Evidence-tier classification algorithm or contract field names (Item 6 — left to SPEC/implementation); reopen CD-G2-01, CD-G2-02, CD-G2-03, PD-G2-05, AD-G2-01, or the Decision Window closing criterion.

## Approval Evidence

Head of Product + AI Architect, Canonical Review — Pre-G-2 Canonical Decisions round.

## Documents Affected

`D2_SPEC_v1.0.md`, `D3_SPEC.md`, `TASK_006_SPEC_v1.0.md` — minimal, additive-only, audit-trail-preserving synchronization, performed and reviewed at Chapter 12.

## Consequences

`TASK_006_SPEC_v1.0.md` §38 item G-2 is resolved. The Stage 3/4/5 seam, which G-2 Core's own minimum live path must construct (`OpportunityEligibilityInput`/`EligibleOpportunity` from a raw detected signal), now has a canonically assigned owner before SPEC authoring, avoiding an unauthorized ad-hoc engineering choice at that seam and the near-term rework that would follow once Recommendation Engine's Stage-3 detector is added. Repository Gap G-2 itself remains open — this decision authorizes, but does not perform, part of its resolution.

## Backward Compatibility

Additive only. No existing contract, Stage boundary, other engine's responsibility, or closed Canonical/Architecture Decision is altered.

---

# 12. Synchronization Review — AD-G2-02

## Modifications Performed

| Location | Type | Status |
|---|---|---|
| `D2_SPEC_v1.0.md`, Stage Overview item 4 (Evidence Evaluation, ~Line 520-523) | Additive — adds an "Orchestration authority: Decision Engine" sentence, matching the existing pattern already used for Stages 5/7/8/9 in the same list, per AD-G2-02 | Performed |
| `D2_SPEC_v1.0.md`, Stage 4 detailed section, Dependencies (~Line 698-699) | Additive — adds "Decision Engine (orchestration authority, per AD-G2-02)", matching Stage 5's existing Dependencies-line pattern | Performed |
| `D3_SPEC.md` §6.4 Responsibility Matrix (~Line 478) | Additive correction — "Decision Engine \| Stages 5, 7, 8, 9" corrected to include Stage 4 (narrow orchestration only), per AD-G2-02 | Performed |
| `D3_SPEC.md` §8.3 Decision Layer (~Line 593) | Additive correction — "host the Decision Engine (D2 Stages 5, 7, 8, 9)" corrected to include narrow Stage-4 orchestration, per AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §9.2 (~Line 281) | Corrective annotation, original text preserved — the closed-list "no canonical source assigns Stage 4's orchestration authority" statement updated per AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §13 item 5 (~Line 510) | Additive annotation — the item's own conditional wording ("unless a canonical source explicitly assigns a narrow orchestration responsibility") is noted as now satisfied by AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §23.1 (~Line 1169) | Corrective annotation, original text preserved — the "Stage 4 is not owned by the Decision Engine" note updated per AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §14.7 table (~Line 584) | Corrective annotation — "no named owner at Stage 4" cell updated per AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §31 table (~Line 1627) | Corrective annotation — "Attributed to Stage 4, not the Decision Engine" cell clarified per AD-G2-02 | Performed |
| `TASK_006_SPEC_v1.0.md` §38 item G-2 (~Line 1995-1996) | Marked **RESOLVED (AD-G2-02)**, matching the existing G-6/G-7/G-8 resolved-item pattern; original text preserved | Performed |

## Documents Inspected and Confirmed Unchanged

| Document | Why unchanged |
|---|---|
| `D1_SPEC_v1.0.md` | Unit 11 (Evidence Hierarchy) already governs Stage 4's substantive policy without naming an orchestration owner; AD-G2-02 assigns orchestration only, leaving D1's own policy text fully accurate. No exhaustive/closed statement of Stage-4 ownership exists in D1. |
| `TASK_005_SPEC_v1.0.md` | Makes no claim about Stage-4 ownership; Initiative semantics and the `InitiativeCandidate` contract are unaffected. |
| `SL-001_SPEC_v1.0.md` | Governs Safety Layer semantics; Stage 4's safety/high-risk bypass (already-canonical, unmodified) is unaffected by AD-G2-02's narrow, non-safety-Opportunity scope. |
| Expression documents | No Stage-4 reference exists; Expression's boundary (Stage 10) is untouched. |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | Describes current, implemented state; AD-G2-02 is an approved plan, not yet built. To be updated only at future implementation closure, consistent with the AD-G2-01 precedent (Chapter 10). |
| `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` | Governs the generic task lifecycle; unaffected by the content of any specific architecture decision. |
| `docs/roadmap/Roadmap.md` | No task implementing G-2's live wiring exists yet; per the precedent already applied at v1.1/v1.2/v1.3, this Package is referenced from its eventual implementing task's own Roadmap entry, not given a standalone entry. |

## Document Updated

`docs/roadmap/Changelog.md` — updated per repository precedent. See the Documentation Update Report for the exact change.

## Verification Performed

No architectural change beyond AD-G2-02 itself. No behavioral change. No implementation change. Every synchronization edit is additive/corrective and preserves the original text it corrects, per this Package's established audit-trail discipline (Chapter 06). A repository-wide sweep for "Stage 4," "Evidence Evaluation orchestration," and "no owner at Stage 4" confirmed no remaining unaddressed contradiction outside this Package's own deliberate historical citations.

---

# 13. Architecture Decision — AD-G2-03: Coach Decision Context Foundation

**Status: APPROVED (Architecture Decision, not yet implemented)**

## Purpose and Scope

Before Recommendation Engine / Stage-3 recognition becomes live under G-2, the Coach Decision System is given an explicit Decision Context foundation for User Goals/Objectives and Current State. This does not grant general `userProfile` access — it defines bounded canonical Decision Inputs only.

## Approval Record

Approved directly by the Head of Product + AI Architect, following the same Pre-G-2 Canonical Decisions Architecture Recommendation as AD-G2-02, as the second of its two recommended decisions — intended to prevent the Recommendation Engine's Stage-3 contribution (which, per `AD-G2-01` `G2-RA-07`, owns the pre-Stage-6 substance of `proposedAction`/`explanation`) from being built without goal/current-state awareness and requiring near-term rework. The decision operationalizes, architecturally, Product permission already granted by `PD-G2-05` ("...SHALL remain sensitive to the user's goals, current context...") — it does not reopen or expand that Product decision.

## The Decision (as approved)

**1. Purpose.** As stated above.

**2. Memory Layer remains the exclusive Context Assembly boundary.** The Memory Layer remains the only component permitted to originate a Decision Input read or assemble Pipeline Context. No direct StateAccess reads are introduced for the Recommendation Engine, Initiative Engine, Safety Layer, or Decision Engine. Stage-3 contributors remain consumers of Pipeline Context only.

**3. Canonical data path.** Every new Context item must travel: Canonical State Source → dedicated bounded StateAccess read → Memory Layer → immutable Pipeline Context → authorized Coach Decision System consumer. No parallel context path may be created. Memory Layer may not be bypassed.

**4. Least-authority StateAccess design.** Broad reuse of `readAdaptiveProfile()`/`readTriggerProfile()` as bulk Coach Decision reads is not permitted. Bounded reads exposing only the information the Decision Context requires must be used instead. Exact function names remain for SPEC/implementation.

**5. Goal/Objective Context.** Pipeline Context receives a separate semantic category for Goal/Objective Context. Initial canonical field scope: `goal`, `goalKcal`. These fields originate from the existing profile source, through a bounded StateAccess read and the Memory Layer. No further Profile fields are added automatically.

**6. Current-State Context.** Pipeline Context receives a separate semantic category for Current State. Initial canonical field scope: `consumed`, `protein`, `burned`. The existing source is Today Nutrition state / a `readTodayNutrition`-equivalent bounded source. Goal/Objective Context and Current-State Context are not the same category and are not merged into a general-purpose `coachContext`.

**7. Semantic separation.** Decision Context must preserve the distinction between what the user wants, what is happening now, and what the system has learned over time. Accordingly: Goal/Objective Context ≠ Current-State Context ≠ Derived Intelligence. The existing `derivedIntelligence` and `initiativeIntelligence` remain derived layers. Raw nutrition/body history must not be introduced into Pipeline Context merely to duplicate information already available through Habit/Pattern Engine derivation.

**8. Availability semantics.** New Context must use honest availability semantics consistent with Pipeline Context's existing pattern. Where information is unavailable: no value may be fabricated; no default that changes a decision may be assumed; no goal/current state may be inferred where none exists. Exact sentinel/contract representation remains for SPEC, provided it is consistent with existing canonical availability semantics.

**9. Initial scope boundary.** AD-G2-03 approves, now, only the foundation and the following initial field set — Goal/Objective: `goal`, `goalKcal`; Current State: `consumed`, `protein`, `burned`. It does NOT approve, now, introducing: `workoutFrequency`; `totalWorkouts`; `days`; `weight`; `currentWeight`; adaptive-TDEE internals; raw nutrition history; raw body history; `foods`; historical arrays. These are not deferred because they are unimportant — they are outside the initial G-2 Decision Context scope until a corresponding canonical/Product need is shown.

**10. Explicitly deferred capabilities.** This decision does not open and does not introduce into G-2 Core: Location acquisition; inbound Coach Chat acquisition; Life Event acquisition; Capacity acquisition; Relationship-Maturity acquisition. The Decision Window closing criterion remains unresolved/non-blocking per `AD-G2-01`.

**11. Extensibility principle.** The architecture must allow future addition of semantic Decision Context categories or bounded fields without: changing Memory Layer's exclusive authority; granting direct reads to collaborators; creating general-purpose user-profile exposure; changing Stage-3 contributor boundaries. Future additions still require appropriate canonical authority.

**12. Relationship to G-2.** AD-G2-03 is architectural foundation for G-2. It does not define: detector algorithm; Recommendation Decision-Window rules; numeric thresholds; exact StateAccess function names; exact Pipeline Context schema/type names; exact availability object shape. These remain for the G-2 SPEC, within the decisions above.

## Explicit Preserved Boundaries

AD-G2-03 preserves, unchanged: exclusive Memory Layer / Pipeline Context assembly ownership (D3 §11.1; `AD-G2-01` `G2-RA-03`); exactly three Stage-3 contributors, as consumers only (`AD-G2-01` `G2-RA-04`); the existing B5 derived-intelligence authorities (`AD-G2-01` `G2-RA-13`); `PD-G2-05`'s existing Product scope (Item 2, above — this decision operationalizes, not expands, it).

## Explicit Non-Scope

AD-G2-03 does not add: Activity/Training-profile context (`workoutFrequency`, `totalWorkouts`); Body-metric context (`weight`, `currentWeight`), including any resolution of their documented pairing/ambiguity, which travels with the deferred field; Location/Chat/Life-Event/Capacity/Relationship-Maturity acquisition (Item 10, above, consistent with `AD-G2-01` `G2-RA-11`); any numeric Decision-Window or CDR-4 threshold; any change to `PD-G2-05` or to Initiative/Recommendation content rules.

## Approval Evidence

Head of Product + AI Architect, Canonical Review — Pre-G-2 Canonical Decisions round.

## Documents Affected

None beyond this Package. AD-G2-03 is a forward-looking architecture decision, not yet implemented; it adds new capability without contradicting any existing closed statement (Chapter 14).

## Consequences

The Coach Decision Context now has a canonically approved, bounded foundation for Goal/Objective and Current-State awareness, available to the G-2 SPEC before Recommendation Engine's Stage-3 contribution (which owns pre-Stage-6 `proposedAction`/`explanation` substance, per `AD-G2-01` `G2-RA-07`) is built — reducing the likelihood that engine will need to be rebuilt once such context is expected. Repository Gap G-2 itself remains open — this decision authorizes, but does not perform, part of its resolution.

## Backward Compatibility

Additive only. No existing contract, Stage boundary, engine responsibility, or closed Canonical/Architecture Decision is altered.

---

# 14. Synchronization Review — AD-G2-03

## Documents Inspected and Confirmed Unchanged

| Document | Why unchanged |
|---|---|
| `D1_SPEC_v1.0.md` | Defines Pipeline Context conceptually (User State Model, Unit 04) without an exhaustive/closed field list; AD-G2-03 adds bounded fields without contradicting any D1 statement. |
| `D2_SPEC_v1.0.md` | Stage 2 (Context Assembly) and Stage 3 definitions remain fully accurate; AD-G2-03 operates strictly within Memory Layer's existing Context Assembly authority. |
| `D3_SPEC.md` | Describes Memory Layer's exclusive Pipeline Context ownership (§8.1, §11.1, Decision 3) without enumerating a closed field set; AD-G2-03 is additive within that existing authority. |
| `TASK_005_SPEC_v1.0.md` | States both engines "consume the identical Pipeline Context shape" without enumerating a closed, exhaustive field list; unaffected. |
| `TASK_006_SPEC_v1.0.md` | Decision Engine's Stage 5/7/8/9 contracts and its explicit non-authority over Pipeline Context assembly (§9.2) are unaffected; AD-G2-03 grants no new read authority to the Decision Engine. |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | Describes current, implemented state; AD-G2-03 is an approved plan, not yet built. To be updated only at future implementation closure. |
| `docs/roadmap/Roadmap.md` | No task implementing G-2's live wiring exists yet; unchanged, per the precedent already applied at v1.1/v1.2/v1.3. |

## Document Updated

`docs/roadmap/Changelog.md` — updated per repository precedent. See the Documentation Update Report for the exact change.

## Verification Performed

No architectural change beyond AD-G2-03 itself. No behavioral change. No implementation change. No direct StateAccess read authority was granted to any Stage-3 contributor. A repository-wide sweep for "Pipeline Context," "goal," "goalKcal," "Decision Context," and "Profile/Goals" found no existing closed/exhaustive statement contradicted by this decision.

---

---

# 15. Cross-Reference — Coach Semantic Foundation Canonical Decision Package

## Purpose

Records this Package's relationship to `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` (CSF), closed at v1.1, without duplicating its content.

## Relationship to G-2

- CSF is now a canonical prerequisite/dependency of G-2's Stage-3 construction: it supplies the Observation → User Context → Contextual Meaning → Coaching Opportunity → Engagement Permission sequence and the `validReasonCategory` derivation mechanism that `AD-G2-01` (`G2-RA-06`, `G2-RA-07`) always required but left to a future SPEC to operationalize.
- CSF's first approved ordinary semantic path: Habit-sourced `FOOD_LOGGING` Observation → Habit lifecycle `WEAKENING` → `validReasonCategory: REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION` → well-formed `DetectedOpportunity` → Stage 4 → Stage 5 → `TRUST_TEST_UNCERTAIN` → Silence.
- CSF's Lifecycle-Aware B5 Eligibility Architecture Decision (its Chapter 27) is synchronized into `docs/tasks/B5/B5_SPEC_v1.0.md` §19.3 and Appendix A.3.

## Explicit Non-Reopening

This cross-reference does not reopen, reinterpret, or narrow/widen `CD-G2-01`, `CD-G2-02`, `CD-G2-03`, `PD-G2-05`, `AD-G2-01` (including `G2-RA-01`–`G2-RA-19`), `AD-G2-02`, or `AD-G2-03` — all remain exactly as previously approved. CSF's own scope (Contextual Meaning derivation) is additive to, not a substitute for or amendment of, any of them.

## G-2 Status, Restated

Repository Gap G-2 (no live Stage 3/4 Opportunity source) **remains open**. Neither this cross-reference nor CSF's own closure implements, closes, or marks G-2 READY. `docs/specs/G2_SPEC_v1.0.md` requires substantial revision (CSF Chapter 24) before it can proceed to Canonical Review, Engineering Review, and READY. No implementation has begun.

## Approval Evidence

Head of Product + AI Architect, Canonical Synchronization — Coach Semantic Foundation closure round.

## Documents Affected

None beyond this Package and `B5_SPEC_v1.0.md` (already synchronized, see above).

---

**This Package is CANONICAL and CLOSED for CD-G2-01, CD-G2-02, CD-G2-03, AD-G2-01, AD-G2-02, and AD-G2-03, all approved and fully synchronized. PD-G2-05 is recorded for traceability, approved by Product outside this Package. No deferred-reasoning or user-opt-in pipeline has been established by any decision in this Package. Repository Gap G-2 itself (no live Stage 3/4 Opportunity source) — for which AD-G2-01 was the approved architecture, and AD-G2-02/AD-G2-03 were foundational architecture closed in preparation — has since been implemented, tested, and closed through its own SPEC (`docs/specs/G2_SPEC_v1.0.md`, IMPLEMENTED / VERIFIED / CLOSED; Coach Semantic Foundation Canonical Decision Package Chapter 29.8). This closure update does not alter any decision recorded in this Package. The Coach Semantic Foundation Canonical Decision Package (Chapter 15) is cross-referenced, not duplicated, as G-2's Contextual Meaning dependency.**
