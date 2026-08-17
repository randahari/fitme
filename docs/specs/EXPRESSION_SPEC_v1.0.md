# EXPRESSION_SPEC_v1.0

## Expression — Canonical Delivery-Intent Production Contracts

**Document Type:** Task Specification
**Work Item:** Expression — D3 §17's sixth and final Coach Decision System internal collaborator
**Status:** DONE — implemented, tested, reviewed, approved, and closed (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP1–WP15, closed 2026-08-17; see §33.5 Closure Record). §11 (Delivery Intent Contract) resolved by Canonical Decision CD-EXP-01. §14 resolved as to REFUSAL, ESCALATION, and Safety-intervention disclosure by Canonical Decisions CD-EXP-02, CD-EXP-03, and CD-EXP-04. Only the bounded-modification content-generation algorithm (§14.5, `EXP-OD-10`) remains open, classified non-blocking (§31), carried forward as a tracked follow-up per §33.5.
**Source-of-Truth Rank:** 6 of 8, per `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §3 / RCD-07 — subordinate to AI Constitution, Product Bible, Coach Bible, Architecture, Engineering Workflow; superior to Roadmap and Changelog.
**Authored From:** `EXPRESSION_SPEC_SKELETON.md` (approved — Product Review: APPROVED, Architecture Review: APPROVED, Skeleton Review: APPROVED).
**Repository Baseline:** branch `main`, commit `372aa9e`; factual claims below must be re-verified if the repository has advanced since.

---

# 1. Document Control and Status

| Field | Value |
|---|---|
| Work Item | Expression |
| Target filename | `EXPRESSION_SPEC_v1.0.md` (this document) |
| Location | `docs/specs/` |
| Document type | Task Specification |
| Source-of-Truth rank | 6 of 8 (RCD-07) |
| Lifecycle state | Draft (authored) → Canonical Review → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed |
| Owners | Head of Product + AI Architect (Product/Architecture decisions, Canonical Review, Approval); Claude Code / Lead Engineer (repository evidence, drafting, implementation, tests) |
| Version | 1.4 (draft) |

**Revision History**

| Version | Date | Author Role | Summary |
|---|---|---|---|
| 1.0 (draft) | initial authoring pass | Lead Engineer | Initial full authoring from the approved `EXPRESSION_SPEC_SKELETON.md`; §11 and §14 intentionally left unresolved |
| 1.1 (draft) | prior revision pass | Lead Engineer | §11 (Delivery Intent Contract) updated to reflect approved Canonical Decision CD-EXP-01; directly affected traceability references, Acceptance Criteria, Open Decision Register, and Engineering Readiness Review updated; §14 untouched, remains the sole READY Blocker |
| 1.2 (draft) | prior revision pass | Lead Engineer | §14 updated to reflect approved Canonical Decisions CD-EXP-02 (REFUSAL), CD-EXP-03 (ESCALATION), and CD-EXP-04 (Unified Coach Transparency/Disclosure); directly affected cross-references in §11.2, §15, §29, Acceptance Criteria (§30, new AC-12–19), Traceability Matrix (§32), Engineering Readiness Review (§31), Open Decision Register (Appendix C), and Global Forbidden Changes updated; §14.5 (bounded-modification content-generation algorithm) untouched, remains open but classified non-blocking; followed by a separate documentation-precision pass correcting Findings A–F from the final Engineering Readiness Gate Review (EXP-33, EXP-69, §4.5, Appendix C `EXP-OD-11`, §28/`EXP-OD-5` due-date note, §25 Ownership Matrix) |
| 1.3 (draft) | prior revision pass | Lead Engineer | §28 and Appendix C `EXP-OD-5` updated to record the official Product/Architecture confirmation that the inherited `js/coachDecisionSystem/*` No-Touch restriction does not apply to Expression; directly affected cross-references in §31 (Engineering Readiness Review) and §33.4 (Architecture Approval Checklist) updated; `EXPRESSION_IMPLEMENTATION_PLAN.md`'s prerequisite gate updated in parallel |
| 1.4 (draft) | this revision pass | Lead Engineer | New §10.1 (EXP-73–78) added, recording Canonical Decision 8 (D2 Unit 04 Stage 10 Amendment 1; D3 Decision 7): Expression receives a second, narrow, closed, Memory-Layer-produced input, the Expression Rendering Context (`{schemaVersion, relationshipMaturityStage}`, no `immutable` payload field — immutability is a contract/implementation rule, not carried data), resolving `D1-PER-03`'s previously-unaddressed signal-availability gap without modifying `TerminalDecision`. §12 EXP-26 annotated resolved for `D1-PER-03`; §25 Architecture Ownership Matrix (Expression/Delivery Intent/Memory Layer rows), §32 Traceability Matrix, and Appendix C (new `EXP-OD-12`, resolved) updated accordingly. Companion amendments recorded in `D2_SPEC_v1.0.md` (Unit 04 Stage 10, Amendment 1; CDR-2) and `D3_SPEC.md` (v1.3; new Decision 7; §6.3, §11.1, §11.2, §17). `EXPRESSION_IMPLEMENTATION_PLAN.md` updated in parallel to record WP4's remaining implementation scope under this Architecture Decision. |

**Antecedent documents (non-canonical, Engineering-authored, cited but not treated as canonical sources in their own right — Skeleton §3.5):** `docs/specs/EXPRESSION_SPEC_AUTHORING_PREPARATION.md`; `docs/specs/EXPRESSION_SPEC_SKELETON.md`.

---

# 2. Executive Summary and Purpose

Five of D3 §17's six Coach Decision System internal collaborators are built and closed: Memory Layer, Recommendation Engine, Initiative Engine, and Decision Engine (TASK-004/005/006), and the Safety Layer (SL-001). Each of these produces or consumes a `TerminalDecision`. But `js/coachDecisionSystem/internalPipelineOrchestrator.js:144-199`'s `runDecisionPass()` — the function that drives Stage 5 through Stage 9 to completion — currently returns that `TerminalDecision` and stops. No component anywhere in the repository turns it into anything a user can see: a repository-wide search (`grep -rn "DeliveryIntent\|deliveryIntent\|delivery_intent"` across every `.js` and `.md` file) returns zero matches.

This was the problem Expression exists to solve. Per D2 Unit 04, Stage 10, Expression is the pipeline stage that translates an already-formed `TerminalDecision` into a platform-neutral Delivery Intent (D3 §8.6, Decision 5), performed by a generative/LLM layer, without originating any decision content (`D1-CDO-03`). At authoring time, it was the last of D3 §17's six internal collaborators, and the only one not yet built; as of this document's closure (§33.5), Expression is now implemented, and D3 §17's Composite Engine is fully realized — see §33.5's Closure Record for Repository Gap G-2's own, separate, still-unresolved effect on the live-production observability of Expression's output.

**Why now.** This is the accepted outcome of an independent Canonical Work Item Selection review (Repository Investigation, Adversarial Review, Authoring Preparation Report, and Final Validation, all accepted by Product/Architecture), which found Expression the only unbuilt member of an otherwise fully architected system, with no other open Repository Gap or Canonical Gap blocking or depending on it.

**What Expression is not.** It is not a delivery mechanism, a UI, a notification scheduler, or a second communication authority (D3 Decision 6; `TASK_007_SPEC_v1.0.md` §13.5). Those remain the existing Coach Runtime's territory — realized on Web today by `js/coach/coachPresenter.js` and `js/trigger/triggerController.js` — entirely unchanged by this document.

**Canonical Dependencies.** `D1_SPEC_v1.0.md` (Units 10, 11, 13, 14, 15); `D2_SPEC_v1.0.md` (Unit 04 Stage 10, Amendment 1; `D2-INV-04/05/06`; `D2-EF-07`; `D2-DL-04`; CDR-2; Unit 10 Acceptance Criteria); `D3_SPEC.md` (§6.3, §8.6, §10.4, §11.1, §17 Decisions 1/5/6/7); `TASK_006_SPEC_v1.0.md` (§25, §30, §31, §32); `TASK_005_SPEC_v1.0.md` (§17.7, Section 36 item E-2); `SL-001_SPEC_v1.0.md` (§17–§21); `TASK_007_SPEC_v1.0.md` (§13–§15, §24, §26.4); `FITME_Coach_Bible.md` (Ch.2 §3/§4.3/§5, Ch.4, Ch.19 §2, Ch.20).

---

# 3. Canonical Foundation

## 3.1 Governing Sources (Canonical Index)

`docs/product/Product_Bible.md.docx`; `docs/constitution/FITME_AI_Constitution_v1.0.md`; `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`; `docs/governance/FITME_Coach_Bible.md` (Chapters 1–22, Canonical); `docs/architecture/FITME_ARCHITECTURE_v1.md`; `docs/specs/D1_SPEC_v1.0.md`, `D2_SPEC_v1.0.md`, `D3_SPEC.md`; `docs/specs/TASK_004_SPEC_v1.0.md`, `TASK_005_SPEC_v1.0.md`, `TASK_006_SPEC_v1.0.md`; `docs/specs/SL-001_SPEC_v1.0.md`; `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`; `docs/specs/TASK_007_SPEC_v1.0.md`, `TASK_008_SPEC_v1.0.md`; `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md`; `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`; `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`.

## 3.2 Approved Direction Carried Forward

The single accepted Canonical Decision this document is authored against: **Expression is officially designated as the next Canonical Work Item of the FITME project**, per the completed and accepted Canonical Work Item Selection review. No further Product/Architecture premise has been supplied. Every normative statement below is traced to a citation in §3.1's index, not invented for this document.

## 3.3 Interpretation Rule

Where this document is silent, ambiguous, or in apparent tension with a higher-ranked canonical source, the higher-ranked source governs (RCD-07 precedence), and the tension is classified per §3.4 — never silently resolved in this document's favor.

## 3.4 Classification Taxonomy

Every unresolved matter in this document is classified as exactly one of: Canonical Conflict; Repository Gap; Product Decision Pending; Architecture Decision Pending; Engineering Decision Pending — per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`. No sixth category is used.

## 3.5 Status of Non-Canonical Antecedents

`EXPRESSION_SPEC_AUTHORING_PREPARATION.md`, `EXPRESSION_SPEC_SKELETON.md`, and the intervening Adversarial Review/Final Validation exchanges are Engineering-authored and non-canonical. Every citation inside them traces to an underlying canonical document; this SPEC cites those underlying documents directly, not the intermediate artifacts.

---

# 4. Scope, Responsibilities and Non-Goals

## 4.1 In Scope

Per D2 Unit 04 Stage 10 and D3 §8.6:

- Translation of an already-formed `TerminalDecision` (`TASK_006_SPEC_v1.0.md` §25) into a platform-neutral Delivery Intent.
- Rendering of the Terminal Decision's content, rationale, and confidence into language (Coach Bible Ch.4).
- Calibration of delivery firmness to established confidence (`D1-ER-05`).
- Application of D1 Unit 13 personalization to tone and framing only, never to content already fixed.

## 4.2 Explicit Exclusions

- **EXP-01.** Expression SHALL NOT originate decision content, priority, or rationale (`D1-CDO-03`; `D2-INV-04`).
- **EXP-02.** Expression SHALL NOT select a platform, UI, chat surface, trigger card, notification, widget, or push mechanism (D3 §8.6, Decision 5; `TASK_007_SPEC_v1.0.md` §13.3 UX-13.2).
- **EXP-03.** Expression SHALL NOT perform any durable write (D3 §11.1 — reserved exclusively to the Memory Layer).
- **EXP-04.** Expression SHALL NOT produce a feedback path back into the Decision Layer (D3 §8.6 — one-directional only).
- **EXP-05.** Expression SHALL NOT be independently registered with the B2 Engine Registry (D3 §17 Decision 1).
- **EXP-06.** Expression SHALL NOT perform notification scheduling, platform mapping, or UI/UX implementation (`TASK_006_SPEC_v1.0.md` §8 — Coach Runtime's/TASK-007's territory).
- **EXP-07.** Expression SHALL NOT become a second communication authority (`TASK_007_SPEC_v1.0.md` §13.5 UX-13.4).

## 4.3 Boundaries with Prior/Future Work

| Component | Status | Relationship to Expression |
|---|---|---|
| Decision Engine (TASK-006) | Built, closed | Produces the `TerminalDecision` Expression consumes; unchanged by this document |
| Safety Layer (SL-001) | Built, closed | Produces `safetyDisposition`/`reasonCode`/`reasonDetail`/`modification` fields Expression must be able to render; unchanged by this document |
| Coach Runtime | Existing, realized on Web by `js/coach/coachPresenter.js`/`js/trigger/triggerController.js` | The exclusive hand-off target for Expression's Delivery Intent (D3 Decision 6); unchanged by this document |
| TASK-007 (UX System) / TASK-008 (Design System) | Built, closed | Govern how Coach Runtime ultimately presents a surface, not what Expression produces |

## 4.4 Required Repository Evidence

The current, live state of `js/coachDecisionSystem/internalPipelineOrchestrator.js`, `js/coach/coachPresenter.js`, and `js/trigger/triggerController.js` was re-verified against the live repository at this document's authoring baseline (commit `372aa9e`) and must be re-confirmed at Engineering Readiness Review if the repository has advanced.

## 4.5 Required Decisions

None beyond §14.5 — this chapter's boundary is fully fixed by existing canonical text.

---

# 5. Terminology and Canonical Vocabulary

| Term | Definition | Canonical Source |
|---|---|---|
| Terminal Decision | The fully-formed, four-family (`RECOMMENDATION`/`INITIATIVE`/`SILENCE`/`BOUNDARY`) decision object produced by Stage 9 (Decision Formation); Expression's fixed input | `TASK_006_SPEC_v1.0.md` §25 |
| Delivery Intent | The platform-neutral artifact Expression produces; content categories, prohibitions, and Coach Runtime consumption rules fixed by Canonical Decision CD-EXP-01 (§11); literal field-level schema remains Engineering's to derive | D3 §8.6; CD-EXP-01 |
| Coach Runtime | The existing, unchanged architectural owner that maps a Delivery Intent to platform-specific presentation | D3 §10.4, Decision 6 |
| `reasonCode` | The closed, 13-value canonical Safety authority value; sole canonical authority for a Safety-affected decision's reason | `SL-001_SPEC_v1.0.md` §17 |
| `reasonDetail` | Structured supporting information (`{secondaryReasonCodes: ReasonCode[]}` or `null`); never itself canonical authority | `SL-001_SPEC_v1.0.md` §18 |
| `boundaryType` | `REFUSAL` or `ESCALATION`; present iff `kind === 'BOUNDARY'` | `TASK_006_SPEC_v1.0.md` §25 |
| Decision Pass | One complete traversal of the D2 Pipeline from Decision Input to (at most) one Terminal Decision | D2 Unit 03 |
| Expression | D2 Unit 04 Stage 10; the pipeline stage this document specifies | D2 Unit 04 |
| Pre-/Post-Expression User Correction | A user correction received before/after Expression runs; governs whether a Terminal Decision is withheld | `D2-EF-07` |

**Reconciliation requirement.** Every term above is cross-checked against `TASK_006_SPEC_v1.0.md` §11 and `SL-001_SPEC_v1.0.md`'s own vocabulary; none is assigned a meaning that conflicts with, narrows, or widens any term already fixed by them.

**Prohibition.** This document introduces no term implying a new architectural component beyond "Expression" itself — no "Delivery Engine," "Expression Runtime," or "Rendering Pipeline" — consistent with D3 §17 Decision 1's six-collaborator, single-Composite-Engine model.

---

# 6. Expression's Position in the Coach Decision System

Expression is dispatched from `internalPipelineOrchestrator.js` after Stage 9 (Decision Formation) completes, consuming `runDecisionPass()`'s eventual output (`js/coachDecisionSystem/internalPipelineOrchestrator.js:144-199`). Its current `API` export (`run`, `runForOpportunity`, `runForInitiativeOpportunity`, `detectInitiativeOpportunities`, `detectSafetyOpportunities`, `runDecisionPass`) contains no Expression-equivalent stage today.

**EXP-08.** The concrete dispatch mechanism — whether Expression is invoked as an extension of `runDecisionPass()`'s own internal call chain (matching how the Safety Layer's Stage 8/9 calls are already internal to it, `js/coachDecisionSystem/internalPipelineOrchestrator.js:190-198`) or as a separate function invoked by a caller after receiving `runDecisionPass()`'s return value — is **not fixed by this document** and is an **Engineering Decision Pending**, properly deferred to Engineering Readiness Review, by direct analogy to D3 §17's Coaching History Persistence Gateway operation precedent (§10.3 there). No specific mechanism is asserted here.

**EXP-09.** Expression remains an internal collaborator of the single registered `coachDecisionSystem` Composite Engine (D3 §17 Decision 1). It is never independently registered with the B2 Engine Registry, and introduces no second orchestration authority.

`docs/tasks/B2/B2_SPEC.md` line 122 (`run(context) -> EngineRunResult | Promise<EngineRunResult>`) and its existing session-generation-safe async/in-flight-`Promise` guards (§8, lines ~484–498) already support an async/generative Stage without further Architecture Decision — see §20.

**Explicit Out of Scope.** Any change to the B2 Engine Registry contract, StateAccess, or Persistence Gateway.

---

# 7. Product Objectives

Grounded exclusively in already-approved canonical text, following the same citation-compilation discipline `TASK_006_SPEC_v1.0.md` §7 used for the Decision Engine:

- **A correct decision must survive its own delivery.** Coach Bible Ch.4 §1: *"A correct decision delivered in the wrong words is not a correct decision that happened to be phrased badly — it is a failed piece of coaching, because coaching only exists in the moment it reaches a person and changes what they believe, feel, or do next."* Expression exists to protect the judgment's arrival, not to originate it.
- **Decision precedes expression, always.** `D1-CDO-03`: *"A generative or LLM layer SHALL express a decision already reached; it SHALL NOT originate the underlying decision, its priority, or its rationale."*
- **Honest confidence communication.** `D1-ER-05`: confidence SHALL be communicated honestly and SHALL calibrate delivery firmness; the underlying commitment to honesty about uncertainty never varies by confidence level (one of Coach Bible Ch.19 §2's five permanent commitments — see §33.4).
- **Silence is a first-class outcome, not a gap to paper over.** `D1-SP-01`: Silence SHALL be treated as a first-class, deliberately reasoned decision outcome. Mandatory Product Principle 6 (`TASK_007_SPEC_v1.0.md` §24): *"Silence may be correct; disappearance is not."*
- **Trust before engagement; respect is invariant.** Mandatory Product Principles 2 and 7 (`TASK_007_SPEC_v1.0.md` §24) — no volume, frequency, or persuasiveness objective governs Expression's own output.

**Explicit Out of Scope.** This section does not define UX wording, notification design, engagement targets, or delivery-channel behavior — those belong to Coach Runtime and TASK-007/008, unchanged, mirroring `TASK_006_SPEC_v1.0.md` §7's own closing discipline.

**Required decisions.** None — this chapter is fully inheritable by direct citation compilation, confirmed by the Expression Final Validation (item 1).

---

# 8. Mission and Positive Responsibilities

Per D2 Unit 04, Stage 10 (`D2_SPEC_v1.0.md` lines 879-911), quoted directly:

- **Purpose.** Translate the already-formed Terminal Decision into language, tone, and timing appropriate to the user, without altering what was decided.
- **Inputs.** The Terminal Decision.
- **Outputs.** The user-facing message, for Recommendation/Initiative/refusal kinds; no user-facing output for a Silence kind (§13).
- **Responsibilities.** Render the Terminal Decision's content, rationale, and confidence into language (Coach Bible Ch.4); calibrate delivery firmness to the confidence already established at Decision Formation (`D1-ER-05`); apply D1 Unit 13 personalization to tone and framing only, never to content already fixed.
- **Entry Criteria.** A Terminal Decision exists.
- **Exit Criteria.** For Recommendation/Initiative/refusal kinds not superseded by a Pre-Expression User Correction, a user-facing message (Delivery Intent) has been produced. For a Silence kind, or a superseded decision, none is produced, and the cycle proceeds toward Memory Update with Feedback Processing as a no-op (D2 Unit 08).

**EXP-10.** Expression is performed by a generative/LLM layer that is not itself one of the five D2 Unit 07 engines (D2 Unit 04 Stage 10, Dependencies).

---

# 9. Explicit Forbidden Responsibilities

Consolidated, closed list, every item already approved elsewhere (mirroring `TASK_006_SPEC_v1.0.md` §13's equivalent chapter for the Decision Engine):

- **EXP-11.** SHALL NOT originate the underlying decision, priority, or rationale (`D1-CDO-03`; `D2-INV-04`).
- **EXP-12.** SHALL NOT soften, escalate, or otherwise alter the decision's substance while phrasing it (D2 Stage 10 Forbidden Actions; Coach Bible Ch.2 §4.3).
- **EXP-13.** SHALL NOT deliver a Terminal Decision superseded by a Pre-Expression User Correction (`D2-EF-07`).
- **EXP-14.** SHALL NOT produce a user-facing message for a Silence-kind Terminal Decision (D2 Stage 10 Outputs/Exit Criteria; §13).
- **EXP-15.** SHALL NOT reference chat, trigger cards, notifications, widgets, push, UI, or platform in any form (D3 §8.6, Decision 5).
- **EXP-16.** SHALL NOT perform any durable write (D3 §11.1).
- **EXP-17.** SHALL NOT produce feedback into the Decision Layer (D3 §8.6 — strictly one-directional).
- **EXP-18.** SHALL NOT become a second communication authority (`TASK_007_SPEC_v1.0.md` §13.5).

**Explicit Out of Scope.** None — this is a closed, already-evidenced list.

---

# 10. Inputs and Upstream Contracts

Expression's fixed input is the complete `TerminalDecision` object literal, reused verbatim from `TASK_006_SPEC_v1.0.md` §25 — no field is redefined:

```
TerminalDecision {
  kind: 'RECOMMENDATION' | 'INITIATIVE' | 'SILENCE' | 'BOUNDARY',
  boundaryType: 'REFUSAL' | 'ESCALATION',   // iff kind === 'BOUNDARY'
  rationale: { rationale, evidenceBasis, expectedValue, uncertainty },
  confidence: <0..1>,                       // RECOMMENDATION/INITIATIVE only
  hierarchyTier: <1-10>,                    // RECOMMENDATION/INITIATIVE only
  candidateProvenance: [ opportunityProvenance, ... ],
  options: [ InitiativeCandidate | RecommendationCandidate, ... ],  // multi-option exception only
  modification: { modifiedContent },        // MODIFIED disposition only
  safetyDisposition: { disposition, originalKind },
  decisionPassTrace: { opportunitiesConsidered, candidatePoolSize, disqualifiedCandidates },
  immutable: true
}
```

Governed by `TASK_006_SPEC_v1.0.md` §25.1–§25.13 in full: Required/Optional Fields, Allowed Kinds (exactly four), Invariants (§25.4 — including the hard, testable mapping between `safetyDisposition.disposition` and `kind`/`boundaryType`), Validation Rules (§25.5), Immutability Expectations, Provenance/Trace Fields, Confidence/Hierarchy Representation, Tied-Option Representation, Refusal/Escalation Representation, Silence Representation, and Versioning.

Also consumed: the closed, 13-value `reasonCode` catalogue (`SL-001_SPEC_v1.0.md` §17 — `NO_SAFETY_CONFLICT`, `KNOWN_ALLERGY_CONFLICT`, `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, `ACTIVE_HIGH_RISK_SYMPTOM`, `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, `DANGEROUS_OR_EXTREME_REQUEST`, `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, `PSYCHOLOGICAL_DISTRESS_CONCERN`, `OUTSIDE_COACHING_SCOPE`, `INSUFFICIENT_SAFETY_CONTEXT`, `INFERRED_SIGNAL_NOT_SUFFICIENT`, `PROFESSIONAL_SUPPORT_REQUIRED`) and the `reasonDetail` shape (`SL-001_SPEC_v1.0.md` §18 — `{secondaryReasonCodes: ReasonCode[]}` or `null`).

**EXP-19 (defensive input validation).** Notwithstanding `TASK_006_SPEC_v1.0.md` §25.5's upstream validation guarantee ("Decision Formation does not hand an incompletely-formed or internally-contradictory decision to Expression"), Expression SHALL defensively validate its own input against the §25 contract before rendering it. An upstream guarantee is not a substitute for boundary-level validation anywhere else in this repository, and is not treated as one here — matching the Decision Engine's own established pattern of validating Candidates arriving from upstream engines despite their contracts already being fixed (`TASK_006_SPEC_v1.0.md` §16.3, §31: *"Malformed Candidate... Rejected from the pool"*). See §19 for Expression's own handling of a `TerminalDecision` that fails this validation.

**Explicit Out of Scope.** Any change to the `TerminalDecision` contract itself.

**Required decisions.** None — fully pre-fillable by direct reuse.

## 10.1 The Expression Rendering Context — Resolved, Canonical Decision 8 (D2 Unit 04 Stage 10 Amendment 1; D3 Decision 7)

Expression's second, and only other, declared input — resolving the Repository Gap the accepted Architecture investigation confirmed (D1-PER-03 required a signal `TerminalDecision` structurally could not carry, per D1-CDO-03's decide/express separation), via an Architecture-level decision extending D3 Decision 3, not by modifying `TerminalDecision` and not by exposing Pipeline Context.

- **EXP-73 (existence and cardinality).** Expression SHALL receive exactly one Expression Rendering Context alongside the Terminal Decision, for every Stage 10 invocation. It is produced exclusively by the Memory Layer (D3 Decision 3/7) and consumed exclusively by Expression — never by Coach Runtime, never embedded inside a Delivery Intent.
- **EXP-74 (closed shape).** Its current, complete, closed field list is exactly:

  ```
  ExpressionRenderingContext {
    schemaVersion: 'coach-decision-system-expression-rendering-context/1.0',
    relationshipMaturityStage: 'UNKNOWN' | 'OBSERVER' | 'ASSISTANT' | 'TRUSTED_COACH' | 'PERSONAL_COACH'
  }
  ```

  Immutability is a contract discipline (structural, e.g. `Object.freeze`), not a payload field — no `immutable` key is carried inside this object, unlike `TerminalDecision`'s own convention.
- **EXP-75 (prohibited content).** This Context SHALL NOT contain: decision content (`kind`, `rationale`, `confidence`, `hierarchyTier`, `boundaryType`); ranking/priority or candidate-pool information (`candidateProvenance`, `decisionPassTrace`); Safety decision authority, including `reasonCode`/`reasonDetail` (preserving, not reopening, EXP-33's existing boundary); platform/UI/surface information; any other Pipeline Context member (`derivedIntelligence`, `feedbackHistory`, `initiativeIntelligence`, `lifeEventContext`, `capacityState`, `availability`, `userId`, `sessionGeneration`, `assembledAt`); or unrelated user state (profile fields, goals, `coachStyle`/`coachChatter`, `coachMemory`).
- **EXP-76 (`UNKNOWN` handling, realizing D1-PER-03).** Expression SHALL treat `relationshipMaturityStage: 'UNKNOWN'` at least as conservatively as Observer-stage scope — no elevated depth or directiveness assumed — by direct analogy to the Initiative Engine's own already-accepted treatment of the identical value (`TASK_005_SPEC_v1.0.md` §17.7, item E-2). D1-PER-03's "SHALL scale with Relationship Maturity Stage" requirement is satisfied structurally by a correctly-branching function over this field's full closed vocabulary, including its universal current value — it does not require the upstream Relationship Maturity source gap (`TASK_005_SPEC_v1.0.md`, Section 36 item E-2 / CD-T005-01) to be resolved first, which remains separate, non-blocking, and outside this document's scope.
- **EXP-77 (defensive validation).** Expression SHALL defensively validate the Expression Rendering Context against this shape before use, by the same discipline EXP-19 already establishes for `TerminalDecision` — an upstream guarantee is never a substitute for boundary-level validation.
- **EXP-78 (extensibility discipline).** A future field may be added only when a specific, already-approved Expression requirement needs a further tone/framing-only signal `TerminalDecision` cannot carry — never speculatively, and never as a general-purpose context bag. Each addition is an Engineering-level act of populating an already-open channel with an already-approved requirement's data (direct analogy to `EXP-OD-9`'s residual Delivery Intent schema items), not a new Architecture Decision, provided it stays within EXP-75's prohibitions.

**Explicit Out of Scope.** Defining the Relationship Maturity source itself (whether `relationshipMaturityStage` ever produces a value other than `UNKNOWN`) — that is `TASK_005_SPEC_v1.0.md`'s own tracked, non-blocking gap (Section 36 item E-2 / CD-T005-01), not reopened or resolved here.

**Required decisions.** None — resolved in full by Canonical Decision 8 (D3 Decision 7).

---

# 11. Delivery Intent Contract

## Resolved — Canonical Decision CD-EXP-01

**Canonical Decision CD-EXP-01**, approved by Head of Product + AI Architect, resolves the Repository Gap the Expression Final Validation (item 2) confirmed (zero repository matches for `DeliveryIntent`/`deliveryIntent` anywhere, prior to this decision). It fixes the Delivery Intent Contract at the content-category and consumption-boundary level. It does **not** fix a literal field-level schema (property names, types) — see §11.5.

### 11.1 Cardinality and Lifecycle

- **EXP-50.** Expression SHALL produce exactly one immutable, platform-neutral Delivery Intent for every expressible non-Silence Terminal Decision (CD-EXP-01) — "expressible" meaning `RECOMMENDATION`, `INITIATIVE`, or `BOUNDARY` kind, not superseded by a Pre-Expression User Correction (`D2-EF-07`, §9 EXP-13). A `SILENCE`-kind Terminal Decision SHALL produce no Delivery Intent (CD-EXP-01, reaffirming EXP-29, §13).

### 11.2 Required Content Categories

Per CD-EXP-01, the Delivery Intent SHALL contain exactly the following three categories:

- **EXP-51 (rendered language).** Fully rendered user-facing language, authored by Expression — consistent with D2 Stage 10's own "render... into language" responsibility (§8) and Coach Bible Ch.4's rendering doctrine (§12).
- **EXP-52 (structured semantic signals).** Structured semantic signals required for Coach Runtime to fulfill its already-approved responsibilities — presentation, prominence, interruption level, disposition-aware behavior, and delivery-surface selection (D3 Decision 6; `TASK_007_SPEC_v1.0.md` §12, §15) — without Coach Runtime interpreting or rewriting the rendered language to derive them. Where this signal must reflect a Safety-affected decision, it derives from the closed `safetyDisposition`/`boundaryType` values (§10, §14.1 EXP-33) — never from an independent judgment Coach Runtime forms by parsing prose. For `REFUSAL`, `ESCALATION`, and disclosure, the specific content this signal supports is now fixed by CD-EXP-02/03/04 (§14.2–14.4); for the `MODIFIED` disposition's own content, it remains bounded by §14.5's still-open bounded-modification content-generation question. CD-EXP-01 fixes that the category exists; §14 fixes most, but not all, of what it contains.
- **EXP-53 (correlation metadata).** Correlation metadata sufficient to associate the Delivery Intent with its originating Terminal Decision and downstream feedback lifecycle (D2 Unit 04 Stage 11, Feedback Processing), **without** embedding or duplicating the complete `TerminalDecision` (§10) inside the Delivery Intent.

### 11.3 Coach Runtime Consumption Rules

Per CD-EXP-01, restated here as the consumption-side half of this same Canonical Decision (cross-referencing, not modifying, §16's Coach Runtime Handoff Boundary):

- **EXP-54.** Coach Runtime SHALL map the Delivery Intent to the appropriate delivery surface and determine presentation according to its own existing canonical responsibilities (D3 Decision 6).
- **EXP-55.** Coach Runtime SHALL NEVER generate, rewrite, reinterpret, soften, strengthen, or otherwise alter the semantic content Expression produced (CD-EXP-01) — extending, in binding form, D3 §10.4's existing "without altering any of the decision's content" rule and EXP-38.

### 11.4 Prohibited Content

- **EXP-56.** The Delivery Intent SHALL NOT contain: platform-specific information; UI information; notification implementation; widget information; chat implementation; push implementation; layout information; or presentation implementation details (CD-EXP-01) — superseding and subsuming the narrower prior list at legacy EXP-24 without contradicting it.
- **EXP-57.** The Delivery Intent SHALL remain platform-neutral and immutable (CD-EXP-01, reaffirming EXP-20/EXP-21).

### 11.5 What Remains Not Fixed (Engineering-Level, Non-Blocking)

CD-EXP-01 fixes categories and boundaries, not a literal schema. The following remain open, **none of them Product/Architecture-level**, all properly deferred to Engineering Readiness Review by direct analogy to D3 §17's Coaching History Persistence Gateway operation precedent and `TASK_006_SPEC_v1.0.md`'s own E-2 (concrete file decomposition, resolved at implementation) precedent:

- The object's literal field list (property names, types) realizing EXP-51/52/53.
- The concrete mechanism realizing EXP-53's correlation metadata.
- How EXP-52's structured semantic signal is concretely populated for a `reasonCode`-carrying Safety-affected decision, once §14 fixes the rendering rule it must reflect.
- How the multi-option (`options[]`) tied-set case (§15) is concretely represented within EXP-51/52/53's categories.
- Its `schemaVersion` string (per the convention noted at `TASK_006_SPEC_v1.0.md` §25.13).

### 11.6 Disposition

§11 is **RESOLVED** by CD-EXP-01 and is **no longer a READY Blocker** (§31). The residual items at §11.5 were Engineering Decision Pending, non-blocking, and are now **RESOLVED** (Appendix C, EXP-OD-9; `EXPRESSION_IMPLEMENTATION_PLAN.md` WP1).

---

# 12. Rendering Model — General Principles

Structural rules governing *how* Expression turns a Terminal Decision's content into language, independent of the per-disposition wording questions reserved to §14:

- **EXP-25.** Render content, rationale, and confidence into language per Coach Bible Ch.4; calibrate firmness to confidence per `D1-ER-05` (D2 Stage 10 Responsibilities).
- **EXP-26.** Apply D1 Unit 13 personalization (`D1-PER-01–06`) to tone and framing only, never to content already fixed: earned through evidence, never assumed from category (`D1-PER-01`); never overrides or weakens a Unit 02 absolute override (`D1-PER-02`); scales with Relationship Maturity Stage (`D1-PER-03` — **RESOLVED**, EXP-73–78/§10.1, Canonical Decision 8: the Expression Rendering Context supplies `relationshipMaturityStage`, consumed per EXP-76's `UNKNOWN`-conservative discipline); reduces user effort (`D1-PER-04`); never exploitative (`D1-PER-05`); no cross-user overlearning (`D1-PER-06`).
- **EXP-27.** SHALL NOT use fear, shame, guilt, urgency, or manufactured dependency as a motivational tool, and SHALL NOT let commercial incentive, advertising, or engagement metrics influence content (D1 Unit 14 "permanent core").

**EXP-28 (no phrasebook, by design).** Coach Bible Ch.4 §1 explicitly and deliberately declines to specify particular sentences or catalog phrases: *"It does not specify particular sentences the coach should say, nor does it catalog phrases to use or avoid... What follows instead is a set of durable principles about what communication is for, so that the specific words, whenever and however they are generated, can be judged against a stable standard rather than a rotating list of examples."* This absence is inherited, not treated as a gap this document fills with invented specificity.

**Explicit Out of Scope.** Any actual wording, phrase, or sentence template — Coach Bible Ch.4 forecloses this by design, at every level, not only for §14's harder cases.

---

# 13. Silence Handling

**EXP-29.** Expression produces **no Delivery Intent** for a `SILENCE`-kind Terminal Decision (D2 Unit 04 Stage 10, Outputs and Exit Criteria, quoted at §8), whether that Silence originated from a Decision-Pass-level zero-Candidates outcome or a Safety `DEFERRED` disposition (`TASK_006_SPEC_v1.0.md` §25.12) — the treatment is identical in both cases.

This is consistent with `D1-CDO-01` (Silence is as fully formed and retrievable a decision as any other — never the mere absence of one) and `D1-SP-01–06` (Silence Policy). It does not conflict with `TASK_007_SPEC_v1.0.md` §14's Seven-States table or its OD-6 (the single-instance communicative-silence question, still recorded there as open) — OD-6 concerns whether Coach Runtime/Presenters ever show an ambient signal for an ordinary single-instance Silence, a question entirely downstream of, and immaterial to, Expression's own "no output" rule, which D2 Stage 10 already answers unconditionally at Expression's own boundary.

**Explicit Out of Scope.** Any UI/continuity signal for prolonged absence — `TASK_007_SPEC_v1.0.md` UX-14.1a's already-resolved obligation on Coach Runtime/Presenters, unrelated to Expression.

**Required decisions.** None — fully pre-fillable.

---

# 14. Refusal, Escalation, and Modification Rendering

## Resolved (REFUSAL, ESCALATION, Disclosure) — Canonical Decisions CD-EXP-02, CD-EXP-03, CD-EXP-04

**Canonical Decisions CD-EXP-02 (REFUSAL Rendering Principle), CD-EXP-03 (ESCALATION Rendering Principle), and CD-EXP-04 (Unified Coach Transparency Principle)**, approved by Head of Product + AI Architect, resolve the REFUSAL, ESCALATION, and Safety-intervention-disclosure questions this chapter previously left open, closing that part of the Repository Gap the Expression Final Validation (item 3) confirmed. `SL-001_SPEC_v1.0.md` §19's original deferral (*"Expression's own rendering of a `BOUNDARY`-kind or `MODIFIED` Terminal Decision into user-facing wording is out of this SPEC's scope"*) is discharged for `REFUSAL` and `ESCALATION` in full, and for `MODIFIED` as to disclosure only. The **bounded-modification content-generation algorithm** (§14.5) is **not** addressed by any of the three decisions and remains explicitly open.

### 14.1 Background Constraints (unchanged, already fixed prior to CD-EXP-02/03/04)

- **EXP-30.** `ESCALATED` SHALL NOT contact healthcare providers, notify third parties, open support tickets, or communicate externally; *"the Safety Layer classifies; Expression communicates"* (`[SLDP RCD-04]`).
- **EXP-31.** The Decision Engine *"does not draft, phrase, or soften refusal/escalation language; it produces the structured decision Expression will later render"* (`[T006 §24.7]`, quoted at `SL-001_SPEC_v1.0.md` §19).
- **EXP-32.** A refusal SHALL be framed as protective, not judgmental, and SHALL offer a safer alternative where one exists (`D1-AB-03`).
- **EXP-33.** The only structured inputs that would ever be canonically authoritative to condition rendering on are the closed `reasonCode` catalogue and `reasonDetail`/`secondaryReasonCodes` (§10) — no free text is canonically authoritative. Per the accepted architecture investigation, `reasonCode`/`reasonDetail` do not currently reach the `TerminalDecision` object at all (a non-blocking Repository Gap, EXP-OD-9-adjacent, not required by CD-EXP-02/03/04, which are anchored to `disposition`/`kind`/`boundaryType` only).
- **EXP-34.** A `MODIFIED` disposition's `modification.modifiedContent` is authored by the Safety Layer, not by Expression and not by the Decision Engine (`TASK_006_SPEC_v1.0.md` §25); what content that object contains is exactly the open question at §14.5. CD-EXP-04 (§14.4) governs only whether its presence is disclosed, not what it says.

Scenario-level tone guidance in Coach Bible (Ch.9, 13, 15, 17 — "gently and respectfully suggest professional support," consolidated at Ch.17) and AI Constitution §23.6/§23.14 remains "non-binding and illustrative only" (D1 Unit 16) where cited as scenario, but the operative rules below are traced to binding sources, not to the scenarios themselves.

### 14.2 REFUSAL Rendering Principle — Canonical Decision CD-EXP-02

Per `D1-AB-03` (*"framed as protective, not judgmental, and SHALL offer a safer alternative where one exists"*), AI Constitution §23.14 (*"Refusal should feel protective. Not judgmental"*), AI Constitution §22.9/§3.9/§9.17/§17.20 (*"No recommendation... No business goal... No optimization... Should ever reduce the user's dignity"*), D1 Unit 14's "permanent core" (no fear, shame, guilt), `TASK_006_SPEC_v1.0.md` §24.5 (no disguised recommendation after a block), and the accepted architecture investigation (a safer alternative is honestly, structurally absent at the current repository baseline — not a gap to fill by fabrication):

- **EXP-58.** Every `REFUSAL` (`kind: 'BOUNDARY'`, `boundaryType: 'REFUSAL'`) rendering SHALL explicitly and unambiguously state that the specific request cannot be fulfilled — never presented as an ordinary recommendation that merely omits the blocked content (extends EXP-12/§24.5's anti-disguise rule).
- **EXP-59.** The rendering SHALL attribute the limitation to the situation or principle at stake, never to the user's judgment, character, or worth.
- **EXP-60.** The rendering SHALL NOT contain language of blame, shame, failure, or wrongdoing (extends EXP-27's D1 Unit 14 prohibition to this specific case).
- **EXP-61.** Where the data Expression receives includes a concrete alternative, the rendering SHALL present it as the natural next step; where it does not — the current, universal case per the accepted architecture investigation — the rendering SHALL proceed directly to continued support without asserting, implying, or drawing attention to the absence of one. This branch is presently vacuous at the current repository baseline and is not a directive to build a safer-alternative-detection capability; none is introduced by this decision.
- **EXP-62.** The rendering SHALL NOT invoke any comparison, measurement, or judgment of the user, consistent with AI Constitution §22.9's treatment of dignity as absolute.

### 14.3 ESCALATION Rendering Principle — Canonical Decision CD-EXP-03

Per `[SLDP RCD-04]`, AI Constitution §23.6 (*"The coach remains supportive. It does not attempt to replace healthcare professionals. The transition should feel natural. Not alarming"*), `D1-AB-02` (*"the coach SHALL calmly encourage appropriate professional support; it SHALL NOT diagnose, and it SHALL NOT withdraw ordinary coaching support within its own remaining scope"*), D1 Unit 14 (no diagnosis), and AI Constitution §23.15 (no false reassurance):

- **EXP-63.** Expression SHALL render every `ESCALATION` (`kind: 'BOUNDARY'`, `boundaryType: 'ESCALATION'`) it receives as already decided by the Safety Layer; Expression SHALL NOT make an independent assessment of whether escalation is warranted (extends `D1-CDO-03`/EXP-11 to this specific case).
- **EXP-64.** The rendering SHALL calmly and clearly encourage seeking appropriate professional support, without diagnosing or naming a specific condition.
- **EXP-65.** The rendering SHALL be delivered in the same register as ordinary coaching guidance — not as an alarm or a dramatic break in tone — consistent with AI Constitution §23.6's "natural... not alarming" standard. This is a single fixed register, not a severity-graduated scale; `safetyDisposition` carries no Urgency/severity dimension for Expression to calibrate against (per the accepted architecture investigation), and none is introduced by this decision.
- **EXP-66.** The rendering SHALL explicitly affirm that coaching continues alongside the suggestion, never as a replacement for it (`D1-AB-02`).
- **EXP-67.** The rendering SHALL NOT state or imply that FITME itself will contact, has contacted, or replaces any healthcare provider or third party (`[SLDP RCD-04]`; AI Constitution §23.6).
- **EXP-68.** The rendering SHALL NOT be softened to the point that its seriousness could be missed (AI Constitution §23.15, no false reassurance).

### 14.4 Unified Coach Transparency Principle (Disclosure) — Canonical Decision CD-EXP-04

Per Coach Bible Ch.19 §2 (*"Honesty about uncertainty is never replaced by manufactured confidence"*), AI Constitution §22.5 (*"The user deserves to understand why important recommendations exist... Invisible reasoning creates suspicion. Visible reasoning creates trust"*), Coach Bible Ch.4 (the coach as one continuous voice), `D1-CDO-03`/§24.7 (the decide/express separation is architectural, not a mandate to expose it to the user), and `[SLDP RCD-04]` (an internal division of labor, not a disclosure requirement):

- **EXP-69.** This principle applies exactly when `safetyDisposition.disposition` is `MODIFIED`, `BLOCKED`, or `ESCALATED` — the only three of the five disposition values for which this disclosure principle applies. It does **not** apply to `DEFERRED` (which always co-occurs with `kind: 'SILENCE'`, `TASK_006_SPEC_v1.0.md` §25.4, and produces no Delivery Intent at all per EXP-29/EXP-50) or to `UNMODIFIED` (nothing to disclose).
- **EXP-70.** For each such rendering, Expression SHALL include an honest, plain-language acknowledgment, in the coach's own voice, that the response reflects a safety-related consideration.
- **EXP-71.** The acknowledgment SHALL NOT name any internal component, processing stage, system name, disposition value, `reasonCode`, or other implementation detail.
- **EXP-72.** The acknowledgment SHALL be woven into the same message as the substantive content (the `REFUSAL` framing per §14.2, the `ESCALATION` framing per §14.3, or the adjusted content for a `MODIFIED` outcome) — never appended as a separate, distinct technical notice, consistent with the single-communication-authority discipline already fixed at EXP-18/`TASK_007_SPEC_v1.0.md` §13.5.

### 14.5 MODIFIED — What Remains Deferred

The **bounded-modification content-generation algorithm** — deciding *how* `modification.modifiedContent` is altered — has no canonical source anywhere in the repository (confirmed independently by `safetyLayer.js`'s own header comment and `SL-001_SPEC_v1.0.md`'s Closure Record) and is currently unreachable in production (`modifiedContent` is honestly `null`; `matchCanonicalSafetyRules()` unconditionally returns `[]`, per the accepted architecture investigation). CD-EXP-02/03/04 do not address this question. §14.4's disclosure principle (EXP-69–72) applies to a `MODIFIED` rendering regardless of what its content turns out to be, but does not resolve, and must not be read as resolving, what that content is.

### 14.6 What Still Remains Not Fixed

- The bounded-modification content-generation algorithm itself (§14.5) — Product Decision Pending, non-blocking (see §31).
- Any mapping from a `reasonCode` value to more granular rendering treatment than the disposition-level rules above provide — not required by any canonical source (confirmed by the accepted architecture investigation), and not introduced here.
- How, or whether, `secondaryReasonCodes` ever surfaces to the user — unaddressed by CD-EXP-02/03/04.

### 14.7 Disposition

§14 is **RESOLVED** as to `REFUSAL`, `ESCALATION`, and Safety-intervention disclosure by CD-EXP-02/03/04, and is **no longer a READY Blocker** on those three topics (§31). The bounded-modification content-generation algorithm (§14.5) remains an open, **non-blocking** Product Decision Pending item, consistent with the accepted architecture investigation's finding that `MODIFIED` is currently unreachable in production — the same non-blocking treatment already given to other currently-unreachable, no-canonical-source items elsewhere in this repository (e.g., `TASK_006_SPEC_v1.0.md` §38 item G-9). This classification is recorded for Product/Architecture's own confirmation at Engineering Readiness Review, not self-certified by this document.

---

# 15. Multi-Option (Tied-Set) Rendering

**EXP-35.** Expression receives the full, already-assembled `options[]` array unmutated (`TASK_006_SPEC_v1.0.md` §25.10) and renders it as a single Delivery Intent presenting multiple user-selectable options. The *content* of each option's rendering depends on the general rendering model (§12); where a `MODIFIED` disposition applies to the tied-set decision, the modified content's own generation remains governed by §14.5's still-open resolution — CD-EXP-02/03/04 (§14.2–14.4) otherwise apply identically to a tied-set `REFUSAL`/`ESCALATION`/disclosure case as to a single-option one.

Per `[SLDP RCD-15]`/`SL-001_SPEC_v1.0.md` Ch.27 (Decision-Level Modification): a `MODIFIED` disposition on a tied-set Terminal Decision applies `modification` at the whole-decision level, never scoped to an individual option — Expression's rendering must preserve this, not introduce a second, per-option modification representation.

**Explicit Out of Scope.** Any UI mechanism for presenting multiple options to the user — Coach Runtime's territory (D3 Decision 6), downstream of Expression's Delivery Intent.

---

# 16. Coach Runtime Handoff Boundary

Per `TASK_006_SPEC_v1.0.md` §30, restated from Expression's own side:

- **EXP-36.** The Decision Engine produces a Terminal Decision only; nothing further downstream.
- **EXP-37.** Expression alone translates it into a platform-neutral Delivery Intent; D3 §8.6: *"Expression owns Delivery Intent production only... explicitly unaware of chat, trigger cards, notifications, widgets, push, UI, or platform."*
- **EXP-38.** The Coach Runtime alone maps a Delivery Intent to a platform-specific surface; D3 §10.4 (Decision 6): *"the single architectural owner responsible for mapping a Delivery Intent into platform-specific presentation... without altering any of the decision's content."* Currently realized on Web by `js/coach/*`/`js/trigger/*`, unchanged by this document.
- **EXP-39.** Delivery failure downstream of Expression does not retroactively change the Terminal Decision, and does not reach back into the Decision Engine (§9, EXP-17).

**Required decisions.** *Which* existing Coach Runtime entry point (`js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, or a new function added to one of them) receives Expression's output, and *how* it is wired to do so, is an implementation-level question properly deferred to Engineering Readiness Review, structurally identical to how D3 §17 deferred Coaching History's concrete Persistence Gateway operation — not a Product/Architecture blocker on this chapter's own content. **Not open at all, foreclosed by D3 §17 Decision 6 itself:** whether a new delivery surface is created — it is not; Decision 6 fixes the existing Coach Runtime as sole owner and states explicitly that "no new delivery surface is created."

**Explicit Out of Scope.** Any change to `js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, or any other Coach Runtime realization — this chapter fixes the boundary, not the Runtime's own implementation.

---

# 17. Composite Engine and Pipeline Integration

**EXP-40.** No new B2 Engine Registry entry, no new trigger type, and no second orchestration authority is introduced by Expression (D3 §17 Decision 1). Expression remains an internal collaborator of the single registered `coachDecisionSystem` Composite Engine.

**Explicit Out of Scope.** Any change to `js/engineRegistry.js` or `registerCoachDecisionSystem.js`.

---

# 18. Memory, State, and Persistence Boundaries

**EXP-41.** Expression performs no durable write of any kind and has no StateAccess capability of its own (D3 §11.1 — "Only the Memory Layer may initiate a durable write on the Coach Decision System's behalf"), by direct structural analogy to the twice-already-confirmed pattern: the Decision Engine has none of its own (`TASK_006_SPEC_v1.0.md` §29.3), and the Safety Layer has none of its own by direct analogy to the Decision Engine (`SL-001_SPEC_v1.0.md` §20). Where retention is needed (e.g., as part of Coaching History), that remains the Memory Layer's responsibility (Stages 11–13), not Expression's.

**Required decisions.** None — this is a direct analogy to an already twice-confirmed pattern, not a new decision.

---

# 19. Exceptional Flows and Graceful Degradation

Extending `TASK_006_SPEC_v1.0.md` §31's already-closed upstream table with Expression's own downstream half. In particular, that table's row *"Expression unavailable after a Terminal Decision is formed"* is already resolved from the Decision Engine's side: *"The Decision Engine's own processing already completed successfully; downstream availability is Expression's/Coach Runtime's concern."*

| Exceptional Flow | Detection | Handling | Output |
|---|---|---|---|
| `TerminalDecision` fails §25.5/EXP-19 defensive validation | Expression's own boundary-level check | Treated as a failure condition, per the same discipline `D2-EF-06` applies elsewhere; not silently trusted | No Delivery Intent fabricated |
| Generative/LLM-layer call failure | Expression's own call site | Contained, structured failure result — matching `recommendationEngine.js`'s/`initiativeEngine.js`'s existing "never throws" contract | No Delivery Intent fabricated |
| Coach Runtime unavailable to receive the Delivery Intent | Downstream of Expression's own completion | Not detectable by, or Expression's own concern, once its own output is correctly produced (§16, EXP-39) | Delivery Intent produced normally; simply not yet delivered |

**EXP-42.** No Candidate, Terminal Decision, or Delivery Intent is ever fabricated as fallback content in any row above (extending `D1-DI-02`/D3 §12.3's existing no-fabrication discipline to Expression's own output).

**Explicit Out of Scope.** Any specific retry/logging/failure-detection mechanism — `SL-001_SPEC_v1.0.md`'s own unresolved ED-1 is the closest precedent for this being properly an Engineering Decision Pending, not fixed here.

---

# 20. Determinism, Repeatability, and Execution Model

**EXP-43 (determinism scope).** `D2_SPEC_v1.0.md` Unit 10, Acceptance Criteria item 3 ("Repeatability") fixes directly: *"The same Pipeline Context, replayed, SHALL produce a Terminal Decision of the same kind, rationale, confidence, and Canonical Decision Hierarchy position... — semantic determinism consistent with D1 Unit 01's own criterion, which measures agreement on kind and priority ranking, **not byte-identical generated language or internal representation**."* Expression's *decision-reaching* determinism (which Terminal Decision was produced) is unconditional and unaffected by this document; its *generated language* is explicitly not required to be byte-identical across runs.

**EXP-44 (execution model).** Whether Expression's dispatch is synchronous or asynchronous is, per `TASK_006_SPEC_v1.0.md` §32's own self-classification, *"an Engineering Interpretation, based on Repository Evidence, not a canonical requirement"* — Engineering Decision Pending, not Product/Architecture. `docs/tasks/B2/B2_SPEC.md` line 122 and its existing async/session-generation guards already support an async/generative Stage in production use (§6).

**Required decisions.** None — per the Final Validation, both halves of this chapter are already resolved by existing canonical text and require no new Product/Architecture authoring.

---

# 21. Explainability and Traceability

**EXP-45.** Expression's Delivery Intent SHALL preserve traceability back to the `TerminalDecision` it was produced from, via its correlation-metadata category (§11.2 EXP-53) — an attribution requirement, not an audit-log or persistence mandate, mirroring D2 Unit 10 item 2's own framing and extending `TASK_006_SPEC_v1.0.md` §26. The `candidateProvenance`/`decisionPassTrace` fields already present on every `TerminalDecision` (§10) are the evidentiary basis this requirement builds on; Expression does not need to reconstruct or duplicate them inside the Delivery Intent itself (§11.2 EXP-53's own "without embedding or duplicating" constraint).

---

# 22. Accessibility

**EXP-46.** Expression itself defines no accessibility behavior, since it produces no UI. `TASK_007_SPEC_v1.0.md` §15.2 states directly: *"This document does not define, and MUST NOT be read as defining... any part of Expression's or Coach Runtime's authority over whether or how a Safety-affected message is communicated."* Whatever surface eventually renders Expression's output (via Coach Runtime) must satisfy TASK-007's existing, already normative accessibility obligations (§21 there) — unchanged, unaffected, and not restated by this document.

**Explicit Out of Scope.** Any accessibility implementation detail — TASK-007's closed territory.

---

# 23. Language Generation Scope

**EXP-47.** Expression's generated language targets Hebrew, per the app's existing single-locale baseline (`index.html:2`, `lang="he" dir="rtl"`) and the existing Hebrew-language coaching content already produced by `js/coach/coachPresenter.js` (e.g., `testCoachMessage`'s existing Hebrew prompt composition, line 121). This is the entirety of Expression's own language-generation scope.

**Explicit Out of Scope.** All RTL/directional/layout rendering — icon and chevron mirroring, `dir="rtl"` structural obligations, `TASK_007_SPEC_v1.0.md` §22 (UX-22.1–22.5) in full — these are UI/platform-presentation concerns Expression has no knowledge of by design (D3 §8.6 Decision 5, §9 EXP-15) and remain Coach Runtime's/Presenters' exclusive territory, unchanged. Any non-Hebrew locale support — `TASK_007_SPEC_v1.0.md` OD-12, Product Decision Pending, inherited unchanged and unrelated to Expression's own scope.

---

# 24. Cross-Platform and Native Compatibility

**EXP-48.** Expression requires no platform-specific logic of any kind (D3 Decision 5). D3 §10.4: *"Every implementation preserves the same Delivery Intent contract, so Expression and the Decision Engine need not change across platforms."* Platform variation is entirely Coach Runtime's concern, per the Native Migration Contract already fixed at `docs/specs/C1_SPEC_v1.0.md` §27.

**Explicit Out of Scope.** Any native implementation detail, native framework choice, or native component technology.

---

# 25. Architecture Boundaries and Ownership Matrix

| Component | Owns | Must Obey | Must Not Own |
|---|---|---|---|
| Expression | Delivery Intent production only (D3 §8.6, Decision 5) | `TerminalDecision` contract as fixed input (§10); Expression Rendering Context as second, closed fixed input (§10.1, Canonical Decision 8); Coach Bible Ch.4 rendering doctrine (§12); D1 Unit 13 personalization bounds (§12); CD-EXP-02/03/04 REFUSAL/ESCALATION/disclosure rendering principles (§14.2–14.4) | Decision content/priority/rationale (§9); platform/UI/notification selection (§9); durable writes (§18); a second communication authority (§9); originating or inferring the Expression Rendering Context itself (§10.1 EXP-75) |
| Delivery Intent | Rendered language, structured semantic signals, correlation metadata (§11.2, CD-EXP-01) | Platform-neutrality, immutability, cardinality (§11.1, §11.4) | Platform-specific/UI/notification/widget/chat/push implementation or layout information (§11.4 EXP-56); the Expression Rendering Context (§10.1 EXP-73 — never embedded) |
| Coach Runtime | Platform-specific presentation mapping (D3 §10.4, Decision 6) | The Delivery Intent contract, once fixed, without altering its content | Decision content; Delivery Intent production (§16) |
| Decision Engine | `TerminalDecision` production (Stages 5/7/8/9) | — (unchanged by this document) | Candidate content; Safety judgment; delivery (`TASK_006_SPEC_v1.0.md` §24) |
| Safety Layer | `safetyDisposition`/`reasonCode`/`reasonDetail`/`modification` (Stages 3/8/9) | — (unchanged by this document) | Communication, delivery, UX presentation (`SL-001_SPEC_v1.0.md` §19/§24) |
| Memory Layer | All durable writes on the Coach Decision System's behalf (D3 §11.1); exclusive production of the Expression Rendering Context (§10.1, D3 Decision 3/7) | — (unchanged by this document) | Decision content, delivery |

**Canonical Validation Question.** Does this matrix's "Must Not Own" column, taken together, fully and consistently reproduce §4.2's and §9's exclusion lists without gaps or contradictions? — Yes, by direct construction; every EXP-## Non-Goal in §4.2/§9 appears in exactly one "Must Not Own" cell above.

---

# 26. Existing-System Baseline and Migration

**Required repository evidence.** The current, un-integrated state of `js/coach/coachPresenter.js` (chat/settings-card LLM composition, `buildCoachSystemPrompt`-style flow) and `js/trigger/triggerController.js` (Trigger-card rendering) — both verified, at this authoring baseline, to not reference `js/coachDecisionSystem/*` at all (`TASK_007_SPEC_v1.0.md` §13.4). Must be re-verified against the live repository at Engineering Readiness Review, not assumed from this document.

**EXP-49.** How Expression's eventual output reaches the user — through `js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, or a new function added to one of them (§16's Engineering-deferred question) — is not fixed here. **Not open:** whether it does so through the existing Coach Runtime at all — D3 §17 Decision 6 already fixes this ("no new delivery surface is created"). Whichever existing entry point is eventually used, no existing chat/Trigger-card behavior is altered as a side effect of this document.

---

# 27. Repository Impact

**Likely affected documents.** This SPEC; `docs/roadmap/Roadmap.md`/`Changelog.md` at closure only; `docs/architecture/FITME_ARCHITECTURE_v1.md` as factual current-state synchronization, following the existing §21–§23 pattern (TASK-006 added §23, SL-001 added §24; an Expression entry would follow the same convention).

**Likely affected implementation tiers.** `js/coachDecisionSystem/internalPipelineOrchestrator.js`; a new Expression module (exact decomposition an Engineering Decision Pending, per the precedent `TASK_006_SPEC_v1.0.md` §38 item E-2 established); `index.html`/`sw.js` script/shell wiring, per the TASK-006/SL-001 precedent; tests.

**Versioning (`APP_VERSION`/`sw.js` `VERSION`).** The applicable precedent is **not** TASK-004/005/006/SL-001's "no change" pattern, which rests on those four collaborators being structurally incapable of shipping user-visible output. Expression is not analogous — its entire purpose is eventually producing something a user can see. The closer, cautionary precedent is `TASK_007_SPEC_v1.0.md`'s own Closure Record: `APP_VERSION` was *not* advanced during WP1–WP9 despite shipping user-visible behavior, recorded there as *"a genuine deviation from §26.3's own conditional."* Whether Expression's own implementation ships any user-visible change — and therefore whether §26.3's conditional requires a version bump — depends entirely on the still-open scope of §16/§26's Coach Runtime wiring question and is **not assumed either way** by this document.

**Prohibition.** No exact file list beyond the tiers named above is finalized here.

---

# 28. No-Touch and Protected Areas

**Inherited list**, quoted in full from `TASK_007_SPEC_v1.0.md` §26.4 (`TASK_008_SPEC_v1.0.md` §26 inherits the same list): *"`js/coachDecisionSystem/*` (all files); `js/engineRegistry.js`; `js/stateAccess.js`; `js/persistenceGateway.js`; `firestore.rules`; any Product Bible, Coach Bible, AI Constitution, or D1/D2/D3 content."*

**Resolved — Official Product/Architecture Confirmation.** Product and Architecture have explicitly confirmed that the inherited `js/coachDecisionSystem/*` restriction does not apply to Expression's own implementation: Expression is a canonical collaborator of the Coach Decision System, as established by D3 Decision 6 and by this Specification; implementation work inside `js/coachDecisionSystem/*` for Expression is explicitly authorized. This confirmation records the application of existing approved architectural precedent — it introduces no new Product Decision and no new Architecture Decision. `js/engineRegistry.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `firestore.rules`, and any Product Bible/Coach Bible/AI Constitution/D1/D2/D3 content remain fully protected and unaffected by this confirmation.

**Original required decision (preserved for audit trail — not deleted).** Whether this inherited list applies to Expression unchanged, or requires an Architecture-approved variance — ~~Architecture Decision Pending~~ **RESOLVED**. `js/coachDecisionSystem/*` in particular was the one item on this list Expression's own implementation necessarily must edit (a new Expression module belongs there, and `internalPipelineOrchestrator.js` needs a new dispatch point per §6), unlike for TASK-007/008, which had no reason to touch it. This item was explicitly deferred to Engineering Readiness Review; that Review occurred (the final Engineering Readiness Gate Review), correctly recorded the confirmation as still due at that time, and the explicit, confirmatory Architecture sign-off has now been given — not self-certified by Engineering at any point in this sequence.

---

# 29. Verification and Test Strategy

**Baseline.** `node --test`; the current passing baseline (1607/1607 as of TASK-008's closure, to be re-confirmed at Engineering Readiness Review). The existing test-double discipline established by `tests/fixtures/safetyIntegrationPortTestDouble.js` (TASK-006) is the closest precedent for how Expression's own dependency on a generative/LLM layer should be tested — a deterministic test double, never production-reachable.

**Required test categories.**
- Input-contract validation tests (Expression correctly rejects/handles a malformed `TerminalDecision`, per §10 EXP-19).
- Silence no-output tests (§13, EXP-29).
- Handoff-boundary tests (§16, EXP-36–39) — no reach-back into the Decision Engine, no delivery-failure feedback.
- No-durable-write tests (§18, EXP-41).
- Determinism-of-decision-reaching tests, distinct from generated-language tests, which are explicitly not asserted (§20, EXP-43).
- Composite Engine / single-registration tests (§17, EXP-40).
- Delivery Intent content-category tests (§11.2, EXP-51–53 — rendered language present, structured semantic signals present, correlation metadata present without full `TerminalDecision` duplication) and prohibited-content tests (§11.4, EXP-56–57); the concrete field-level assertions depend on §11.5's still-open Engineering schema.
- `REFUSAL` rendering tests (§14.2, EXP-58–62); `ESCALATION` rendering tests (§14.3, EXP-63–68); disclosure tests (§14.4, EXP-69–72), including a negative test confirming no acknowledgment is produced for `DEFERRED` (no Delivery Intent at all) or `UNMODIFIED`.
- Once §14.5 resolves: `MODIFIED` content-generation conformance tests.

**Explicit Out of Scope.** Any test asserting specific generated wording — Coach Bible Ch.4's own no-phrasebook discipline (§12, EXP-28) forecloses this.

---

# 30. Acceptance Criteria

Grouped to mirror this document's own chapter groupings. No criterion below is phrased in a way that cannot be checked against a specific repository artifact, test, or contract field (`docs/specs/TASK_006_SPEC_SKELETON.md` §36's instruction, already relied upon by TASK-007/008).

**Input Contract**
- AC-1. Every `TerminalDecision` received by Expression is validated against `TASK_006_SPEC_v1.0.md` §25.1/§25.4/§25.5 before rendering (EXP-19); a validation failure produces no Delivery Intent (§19).

**Silence Handling**
- AC-2. No Delivery Intent is ever produced for `kind: 'SILENCE'` (EXP-29), verified for both the zero-Candidates and Safety-`DEFERRED` origin cases (§13).

**Handoff Boundary**
- AC-3. Expression never calls, mutates, or reaches back into any Decision Engine function (EXP-17, EXP-39).
- AC-4. Expression never references chat, trigger cards, notifications, widgets, push, UI, or platform in its own logic or output (EXP-15, EXP-20).

**Memory/Persistence Boundary**
- AC-5. Expression performs zero calls to `js/persistenceGateway.js` or any StateAccess write capability (EXP-41).

**Determinism**
- AC-6. Given an identical `TerminalDecision`, Expression's own dispatch reaches the same kind-level outcome (Delivery Intent produced or not) on every run; generated language is not asserted identical (EXP-43).

**Non-Goals**
- AC-7. No B2 Engine Registry entry exists for Expression beyond the single `coachDecisionSystem` registration (EXP-40).

**Delivery Intent Contract** (resolved by CD-EXP-01, §11)
- AC-8. Exactly one Delivery Intent is produced for every expressible non-Silence Terminal Decision, and none for a `SILENCE`-kind Terminal Decision (EXP-50).
- AC-9. Every produced Delivery Intent carries all three required content categories — rendered language, structured semantic signals, correlation metadata (EXP-51–53) — and none of the prohibited content categories (EXP-56).
- AC-10. Coach Runtime's own consumption of a Delivery Intent never generates, rewrites, reinterprets, softens, or strengthens the semantic content Expression produced (EXP-55) — verified as a negative/non-alteration test, not merely a documentation statement.
- AC-11. The Delivery Intent's correlation metadata does not embed or duplicate the complete `TerminalDecision` object (EXP-53).

**REFUSAL Rendering** (resolved by CD-EXP-02, §14.2)
- AC-12. Every `REFUSAL` rendering explicitly states the specific request cannot be fulfilled and is never presented as an ordinary recommendation (EXP-58).
- AC-13. No `REFUSAL` rendering contains language of blame, shame, failure, or wrongdoing, or invokes any comparison or judgment of the user (EXP-60, EXP-62).
- AC-14. A `REFUSAL` rendering presents a safer alternative only when one is present in the data Expression received; it never fabricates one or draws attention to its absence (EXP-61).

**ESCALATION Rendering** (resolved by CD-EXP-03, §14.3)
- AC-15. Every `ESCALATION` rendering encourages professional support without diagnosing, and without implying FITME has contacted, will contact, or replaces a healthcare provider or third party (EXP-64, EXP-67).
- AC-16. Every `ESCALATION` rendering explicitly affirms that coaching continues (EXP-66), and is not softened to the point its seriousness could be missed (EXP-68).

**Disclosure** (resolved by CD-EXP-04, §14.4)
- AC-17. Every rendering for `safetyDisposition.disposition ∈ {MODIFIED, BLOCKED, ESCALATED}` includes a plain-language acknowledgment, in the coach's own voice, that the response reflects a safety-related consideration (EXP-70).
- AC-18. No rendering, for any disposition, names an internal component, processing stage, disposition value, `reasonCode`, or other implementation detail (EXP-71).
- AC-19. No such acknowledgment is produced for `DEFERRED` (no Delivery Intent is produced at all, per AC-2) or for `UNMODIFIED` (EXP-69).

**Bounded-Modification Content-Generation Algorithm** — *cannot be populated; no canonical source exists anywhere in the repository (§14.5).* Placeholder, not to be filled by Engineering.

**Engineering**
- AC-20. Full regression suite (baseline per §29) passes unmodified alongside any new Expression tests.

**Documentation**
- AC-21. `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`, and (if applicable per §27) `docs/architecture/FITME_ARCHITECTURE_v1.md` updated at closure only, per §33.

**Expression Rendering Context** (resolved by Canonical Decision 8, §10.1)
- AC-22. Every Expression Rendering Context received is validated against the closed EXP-74 shape before use (EXP-77); an invalid Context is a failure condition, never silently substituted or fabricated. `relationshipMaturityStage: 'UNKNOWN'` is treated at least as conservatively as Observer-stage scope (EXP-76); the Expression Rendering Context is never embedded inside a produced Delivery Intent (EXP-73, EXP-75).

---

# 31. Engineering Readiness Review

**Blocker standard.** Repository evidence + canonical impact + cannot be resolved during normal SPEC authoring + would create an incorrect Expression if ignored (Spec Authoring Standard).

**Explicit, non-waivable READY Blockers, by construction:**
- **§11 — Delivery Intent Contract.** **RESOLVED** by Canonical Decision CD-EXP-01. No longer a READY Blocker.
- **§14 — Refusal, Escalation, and Modification Rendering.** **RESOLVED as to `REFUSAL`, `ESCALATION`, and Safety-intervention disclosure** by Canonical Decisions CD-EXP-02, CD-EXP-03, and CD-EXP-04. No longer a READY Blocker on those three topics.

**No item in this document is currently recorded as a non-waivable READY Blocker.** §14.5's bounded-modification content-generation algorithm remains open (Product Decision Pending) but is classified **non-blocking**, per the accepted architecture investigation's finding that `MODIFIED` is currently unreachable in production (`matchCanonicalSafetyRules()` unconditionally returns `[]`) — the same non-blocking treatment already given to other currently-unreachable, no-canonical-source items elsewhere in this repository (`TASK_006_SPEC_v1.0.md` §38 item G-9). This classification is recorded for Product/Architecture's own confirmation, not self-certified here. §6/§11.5/§16/§20/§26's Engineering/Architecture Decision Pending items remain non-blocking, consistent with the identical treatment TASK-006/SL-001/TASK-007/008 gave their own analogous open items (e.g., TASK-007's OD-11a/OD-11b, TASK-008's OD-8008-*). §28 is no longer among them — **RESOLVED** by the official Product/Architecture confirmation recorded there and at `EXP-OD-5`.

**Verdict mechanism.** With both §11 and §14's three resolved topics closed by explicit, direct, non-self-certified Canonical Decisions (CD-EXP-01 through CD-EXP-04), READY now depends only on Product Approval (§33's checklist) and Architecture Approval (§33's checklist) confirming this revision — per `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §4 and `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` — and, separately, Product/Architecture's own confirmation that §14.5's non-blocking classification above is correct.

---

# 32. Traceability Matrix

| Canonical Source | Requirement | Section | Verification Evidence | Acceptance Criterion |
|---|---|---|---|---|
| `D1-CDO-03`; `D2-INV-04` | No decision-content origination | §9 EXP-11 | AC-3, AC-4 | AC-3 |
| D2 Unit 04 Stage 10 | No output for Silence | §13 EXP-29 | Silence no-output tests | AC-2 |
| `D2-EF-07` | Pre-Expression Correction withholding | §9 EXP-13 | Handoff-boundary tests | AC-3 |
| D2 Unit 04 Stage 10 (Amendment 1, Canonical Decision 8); D3 Decision 7; `D1-PER-03` | Expression Rendering Context — second declared input, closed shape, `UNKNOWN`-conservative `relationshipMaturityStage` handling | §10.1 EXP-73–78; §12 EXP-26 (resolved) | Rendering-context contract/validation tests; personalization-scaling tests | AC-22 |
| D3 §8.6, Decision 5 | Platform-neutral, no UI/platform knowledge | §9 EXP-15, §11 EXP-20 | AC-4 | AC-4 |
| D3 §11.1 | No durable write | §18 EXP-41 | No-write tests | AC-5 |
| D3 §17 Decision 1 | Single Composite Engine registration | §17 EXP-40 | Registry inspection | AC-7 |
| D3 §17 Decision 6 | No new delivery surface | §16, §26 EXP-49 | Coach Runtime handoff tests | AC-3 |
| `TASK_006_SPEC_v1.0.md` §25 | `TerminalDecision` input contract | §10 | Input-contract validation tests | AC-1 |
| `TASK_006_SPEC_v1.0.md` §16.3/§31 | Defensive input validation | §10 EXP-19 | AC-1 | AC-1 |
| `D2` Unit 10 item 3 | Determinism excludes generated language | §20 EXP-43 | Determinism tests | AC-6 |
| CD-EXP-01 | Delivery Intent cardinality (one per expressible non-Silence decision, none for Silence) | §11.1 EXP-50 | Cardinality tests | AC-8 |
| CD-EXP-01 | Three required content categories | §11.2 EXP-51–53 | Content-category tests | AC-9 |
| CD-EXP-01 | Coach Runtime consumption rules (map/determine presentation only; never alter content) | §11.3 EXP-54–55 | Non-alteration tests | AC-10 |
| CD-EXP-01 | Prohibited content categories; platform-neutral, immutable | §11.4 EXP-56–57 | Content-category tests | AC-9 |
| CD-EXP-01 | Correlation metadata without embedding/duplicating `TerminalDecision` | §11.2 EXP-53 | Correlation tests | AC-11 |
| `SL-001_SPEC_v1.0.md` §17–18 | `reasonCode`/`reasonDetail` catalogue — structural carrying capacity fixed by CD-EXP-01 (§11.2 EXP-52); not required for, and not used by, CD-EXP-02/03/04 (disposition-level, not reasonCode-level) | §10, §11.2, §14.1 EXP-33 | AC-9 (structure) | AC-9 |
| `SL-001_SPEC_v1.0.md` §19 | Refusal/Modification rendering deferred to Expression — discharged for `REFUSAL`/`ESCALATION`/disclosure by CD-EXP-02/03/04; `MODIFIED` content-generation remains deferred | §14 | Rendering tests (§29) | AC-12–19 (resolved) / *(pending §14.5, MODIFIED content)* |
| `D1-AB-03`; AI Constitution §23.14, §22.9 | REFUSAL protective framing, dignity, safer-alternative honest-absence | §14.2 EXP-58–62 | REFUSAL rendering tests | AC-12–14 |
| `[SLDP RCD-04]`; AI Constitution §23.6; `D1-AB-02` | ESCALATION continuity, no diagnosis, no external contact, no false reassurance | §14.3 EXP-63–68 | ESCALATION rendering tests | AC-15–16 |
| Coach Bible Ch.19 §2, Ch.4; AI Constitution §22.5 | Safety-intervention disclosure, one coach voice, no internal exposure | §14.4 EXP-69–72 | Disclosure tests | AC-17–19 |
| `TASK_006_SPEC_v1.0.md` §25.4 | `DEFERRED` always co-occurs with `SILENCE`; disclosure never applies to it | §14.4 EXP-69 | Negative disclosure test | AC-19 |
| Coach Bible Ch.4 | Rendering doctrine, no phrasebook | §12 EXP-25, EXP-28 | *(qualitative — Product Review)* | — |
| `TASK_007_SPEC_v1.0.md` §13.5 | No second communication authority | §9 EXP-18 | AC-4 | AC-4 |
| `TASK_007_SPEC_v1.0.md` §26.4 | No-Touch inherited list | §28 | File-diff review at closure | — |

**Traceability Expectations.** Every citation in `EXPRESSION_SPEC_AUTHORING_PREPARATION.md` §1 is mapped above or in the chapter it supports; none is left unmapped.

---

# 33. Documentation and Closure Requirements

## 33.1 Required Updates at Closure (not performed during authoring)

This SPEC's own status header; `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md` as factual current-state synchronization only (§27).

## 33.2 SPEC Status Transitions

Draft → Canonical Review → Engineering Review → READY (§11 resolved by CD-EXP-01; §14 resolved as to REFUSAL/ESCALATION/disclosure by CD-EXP-02/03/04; §14.5 open but non-blocking, §31) → Implementation → Code Review → Documentation Update → Commit → Task Closed.

## 33.3 Product Approval Checklist (for Product Review, not self-certified here — checkboxes are the reviewer's own act, not asserted by this document)

- [ ] §11 Delivery Intent Contract — CD-EXP-01 recorded as approved per the calling turn's own report; this checklist item itself is confirmed only by an actual Product Review pass over this revision, not by this document's own drafting
- [ ] §14.2–14.4 REFUSAL/ESCALATION/Disclosure — CD-EXP-02/03/04 recorded as approved per the calling turn's own report; this checklist item itself is confirmed only by an actual Product Review pass over this revision, not by this document's own drafting
- [ ] §14.5 bounded-modification content-generation algorithm — confirmed still open, confirmed correctly classified non-blocking
- [ ] §7 Product Objectives confirmed as accurately compiled, no invented objective
- [ ] §4/§9 Non-Goals confirmed complete
- [ ] No Coach Bible, Product Bible, or AI Constitution content altered

## 33.4 Architecture Approval Checklist (for Architecture Review, not self-certified here — checkboxes are the reviewer's own act, not asserted by this document)

- [ ] §11 — CD-EXP-01 recorded as approved per the calling turn's own report; this checklist item itself is confirmed only by an actual Architecture Review pass over this revision, not by this document's own drafting
- [ ] §14.2–14.4 — CD-EXP-02/03/04 recorded as approved per the calling turn's own report; this checklist item itself is confirmed only by an actual Architecture Review pass over this revision, not by this document's own drafting
- [ ] §6/§11.5/§14.5/§16 Engineering/Architecture/Product Decision Pending items confirmed non-blocking or escalated
- [ ] §28 — `EXP-OD-5` recorded as resolved per the calling turn's own official Product/Architecture confirmation; this checklist item itself is confirmed only by an actual Architecture Review pass over this revision, not by this document's own drafting
- [ ] D3 §17 Decisions 1, 5, 6 confirmed unaltered
- [ ] No new architectural component, Runtime, or Engine introduced

## 33.5 Closure Record

Written at actual task closure (2026-08-17), per Approvals below.

- **Final status**: DONE / CLOSED.
- **Implementation summary**: realizes the sixth and final of D3 §17's six Coach Decision System internal collaborators — Expression, responsible for translating an already-formed `TerminalDecision` into a platform-neutral Delivery Intent (D3 §8.6 Decision 5). Fifteen Work Packages: WP1 `js/coachDecisionSystem/deliveryIntentContract.js` (Delivery Intent field schema, CD-EXP-01, `EXP-OD-9` resolved); WP2 `runExpressionStage()` dispatch added to `internalPipelineOrchestrator.js` as a separate function (`EXP-OD-3` resolved); WP3 `expressionInputGate.js` (defensive `TerminalDecision` validation, Silence-kind no-output); WP4 `expressionRenderer.js` (base/`UNMODIFIED` rendering) and, under Canonical Decision 8 (D3 Decision 7), `expressionRenderingContext.js` (the Expression Rendering Context, a second closed Stage-10 input); WP5–WP7 `REFUSAL`/`ESCALATION`/disclosure/`MODIFIED` rendering (CD-EXP-02/03/04); WP8 multi-option (tied-set) rendering; WP9 the live Coach Runtime handoff — `SafetyLayer` and `ExpressionRenderer` wired as production ports in `internalPipelineOrchestrator.js`'s `run()`, `TriggerController.presentDeliveryIntent()` added (reusing the existing `#trigger-card`, no new delivery surface), the D2-EF-07 supersession guarantee (`EXP-OD-4` resolved); WP10 exceptional-flow confirmation; WP11 Memory/Persistence boundary confirmation; WP12 Determinism/Explainability/Accessibility/Language/Cross-Platform confirmation; WP13 the deterministic qualitative-verification test double (`EXP-OD-11` resolved); WP14 cross-cutting audit (two AC-3/AC-4 test-coverage gaps closed; Appendix C synchronized — `EXP-OD-3`, `EXP-OD-4`, `EXP-OD-7`, `EXP-OD-9`, `EXP-OD-11` all corrected to Resolved); WP15 this documentation and closure pass, including WP4's own formal tracking-closure (its coded scope was completed and independently re-verified throughout WP9–WP14, but its own Implementation Plan row was never given its own closure turn until now).
- **Canonical Decisions realized**: CD-EXP-01 (Delivery Intent Contract), CD-EXP-02 (REFUSAL Rendering Principle), CD-EXP-03 (ESCALATION Rendering Principle), CD-EXP-04 (Unified Coach Transparency/Disclosure Principle), and Canonical Decision 8 / D3 Decision 7 (Expression Rendering Context — a second, narrow, closed Stage-10 input, resolving `D1-PER-03`'s signal-availability gap without modifying `TerminalDecision`).
- **Tests and results**: 15 test files added or extended across the full sequence (`deliveryIntentContract.test.js`, `expressionInputGate.test.js`, `expressionRenderingContext.test.js`, `expressionRenderer.test.js`, `expressionQualitativeVerificationTestDouble.test.js` new; `internalPipelineOrchestrator.test.js`, `memoryLayer.test.js`, `triggerController.test.js`, `coachDecisionSystemWiring.test.js`, `c1Wp5aWiring.test.js` extended); full suite **1796/1796 passing** (1607 pre-Expression baseline, net +189).
- **Approvals**: each of the fifteen Work Packages received its own Product Review, Architecture Review, and Engineering/Canonical Review, all APPROVED/PASSED, communicated directly and not self-certified by Engineering at any point across the sequence. Final Product Verification and Final Architecture Verification for this closure: communicated directly per the calling turn's own authorization, not derived or self-certified by Engineering.
- **Documentation updates**: this specification (Status header, Appendix C — `EXP-OD-3`/`EXP-OD-4`/`EXP-OD-7`/`EXP-OD-9`/`EXP-OD-11` corrected to Resolved, §11.6 cross-reference, this Closure Record); `EXPRESSION_IMPLEMENTATION_PLAN.md` (all fifteen WP rows, including WP4's formal closure); `docs/roadmap/Roadmap.md`; `docs/roadmap/Changelog.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md` (new §25, additive only — no prior section altered). D1, D2, D3, Engineering Workflow, Product Bible, AI Constitution, Coach Bible, and Coach Knowledge Base reviewed and intentionally left unchanged — this closure alters no rule in any of them.
- **Commit hash**: not yet committed — this closure was performed against the working tree, matching the "— (not yet committed)" status already recorded for every Work Package in `EXPRESSION_IMPLEMENTATION_PLAN.md`'s own tracking table; see `git log` after this work is committed.
- **Branch and push status**: not yet committed or pushed as of this Closure Record; see the calling turn's own report for the eventual branch name and push target.

### APP_VERSION — Objective Evidence (fact-only; disposition reserved for explicit Product approval)

Per §27's own conditional and `EXP-OD-6`, whether `APP_VERSION` advances depends entirely on whether Expression's implementation ships real, user-visible behavior. The following facts are recorded for that determination; **this Closure Record does not decide `APP_VERSION` and does not infer a disposition**:

- `js/app.js`'s `APP_VERSION` and `sw.js`'s `VERSION` both currently read `2.41.0` — unchanged throughout Expression's entire implementation (WP1–WP15); neither was edited by any Work Package in this sequence.
- The Coach Runtime handoff wiring built in WP9 is real and live in production code: `internalPipelineOrchestrator.js`'s `run()` performs the full Stage 1→10 sequence with real `SafetyLayer`/`ExpressionRenderer` ports, and `js/app.js`'s `runAppReadyEngines()` calls `TriggerController.presentDeliveryIntent()` on a `DISPATCHED` outcome — this is not a stub, and is covered by tests exercising the dispatch end-to-end.
- **Repository Gap G-2** (no live Stage 3/4 Opportunity source — pre-existing since TASK-005/TASK-006, confirmed unaffected and unresolved by any Expression Work Package) means `runDecisionPass()` is always invoked with `opportunities: []` in production, which deterministically resolves to a Decision-Pass-level Silence `TerminalDecision` (D2-INV-05) via `DecisionFormation.formDecisionPassSilence()`. A Silence-kind `TerminalDecision` produces `expression.status: 'NO_DELIVERY_INTENT'` (EXP-29/EXP-50) — `runExpressionStage()` is reached, but never produces a Delivery Intent, and `presentDeliveryIntent()` is consequently never invoked with a truthy `deliveryIntent` in production today.
- Net observable fact: a real user, running the current production build, cannot see any Expression-produced content anywhere in the app — the `#trigger-card` surface, when shown at all, is still driven exclusively by the pre-existing `TriggerDomain`-based `presentTriggerCard()` path, unchanged by this closure.
- The closest prior precedent on record is `TASK_007_SPEC_v1.0.md`'s own Closure Record, which recorded `APP_VERSION` as *not* advanced during its own WP1–WP9 "despite shipping user-visible behavior" — a different fact pattern (that closure did ship a visible change and still didn't advance the version) from Expression's own (no visible change has shipped at all).

**Disposition: reserved for explicit Product approval, not made by this document.**

- **Remaining non-blocking Follow-ups** (tracked, not decided or scheduled here; none expand Expression's own scope):
  - `EXP-OD-10` — the bounded-modification content-generation algorithm (deciding *how* `modification.modifiedContent` is altered) has no canonical source anywhere in the repository and remains open — Product/coaching-content-authoring work, explicitly out of CD-EXP-02/03/04's own scope. Currently unreachable at this repository baseline (`MODIFIED` is unreachable in production per the same G-2/Health-Safety-Profile-absence chain SL-001's own Closure Record already recorded), so non-blocking.
  - The D2-EF-07 write-side (`memoryLayer.js`'s `recordExplicitUserStatementArrival()`): real, correct, and tested, but no live chat-input UI exists anywhere in the repository to call it — closely related to the same underlying absence Repository Gap G-2 already tracks (`TASK_006_SPEC_v1.0.md` §38). Non-blocking.
  - `presentDeliveryIntent()`/`presentTriggerCard()` `#trigger-card` coexistence: both target the same DOM element under the same `APP_READY` trigger, with no established arbitration rule between them. Currently inert (G-2 keeps `presentDeliveryIntent()` permanently unreached), so no live conflict — but the policy question is real and already falls under `TASK_007_SPEC_v1.0.md`'s own pre-existing, still-open OD-5 (Home-card total precedence order, §12.2/UX-12.6), not a new gap this closure introduces.
  - Repository Gap G-2 itself (no live Stage 3/4 Opportunity source) — pre-existing since TASK-005/TASK-006, confirmed unaffected and unresolved by Expression; its own resolution is a separate, not-yet-scoped future Work Item, outside this task's own boundary.
- **Lessons Learned**: several Work Packages (WP9's D2-EF-07 investigation, WP10's exceptional-flow audit, WP12's determinism/correlation audit, WP14's AC coverage/Open-Decision audit) found that earlier Work Packages' own necessary defensive engineering had already substantially built or tested what a later Work Package was formally tasked with — not scope creep, but a natural consequence of building each Stage's boundary handling correctly and completely the first time. Each later Work Package's own value was in *confirming, attributing, and closing the remaining narrow gap*, not rebuilding what already worked; this repository's own established "investigate before implementing" discipline (mirrored in every Work Package's own investigation gate) is what made those findings possible rather than accidental. Separately, several Open Decision Register entries (`EXP-OD-3`, `EXP-OD-4`, `EXP-OD-7`, `EXP-OD-9`, `EXP-OD-11`) and one Implementation Plan row (WP4) were resolved in substance well before their own tracking records were updated to say so — a reminder that functional completion and procedural closure are distinct, and that a final audit pass (here, WP14 and WP15) is necessary specifically to catch that gap, not merely to confirm no gap exists.

This is Engineering Self-Review only, distinct from, and not a substitute for, Product Review, Architecture Review, or the READY/DONE determinations, which are made respectively by Head of Product + AI Architect and at actual implementation closure. This self-review is repeated after any substantial edit, not performed only once.

---

# 34. Appendices

## Appendix A — Vocabulary

See §5 (complete glossary).

## Appendix B — Ownership Matrix

Direct copy of §25's matrix.

## Appendix C — Open Decision Register

| ID | Item | Classification | Section | Blocking? |
|---|---|---|---|---|
| EXP-OD-1 | Delivery Intent field contract — **RESOLVED (Canonical Decision CD-EXP-01)**: content categories, prohibitions, and Coach Runtime consumption rules fixed | ~~Product/Architecture Decision Pending~~ Resolved | §11 | No |
| EXP-OD-2 | REFUSAL/ESCALATION/Disclosure rendering rules — **RESOLVED (Canonical Decisions CD-EXP-02, CD-EXP-03, CD-EXP-04)** | ~~Product Decision Pending~~ Resolved | §14.2–14.4 | No |
| EXP-OD-3 | Concrete dispatch mechanism (internal extension vs. separate call) — **RESOLVED (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP2)**: `runExpressionStage()` added to `internalPipelineOrchestrator.js` as a separate function invoked after `runDecisionPass()` returns, preserving `runDecisionPass()`'s own existing contract unchanged; no `js/engineRegistry.js`/`registerCoachDecisionSystem.js` change, per WP2's own stop condition | ~~Engineering Decision Pending~~ Resolved | §6 | No |
| EXP-OD-4 | Which Coach Runtime entry point / how wiring occurs — **RESOLVED (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP9)**: `js/trigger/triggerController.js`'s existing `#trigger-card` element, via the new `presentDeliveryIntent()` — no new delivery surface (D3 Decision 6 preserved); wired from `js/app.js`'s `runAppReadyEngines()` on a `DISPATCHED` Expression outcome | ~~Engineering Decision Pending~~ Resolved | §16, §26 | No |
| EXP-OD-5 | No-Touch list variance for `js/coachDecisionSystem/*` — **RESOLVED**: Product/Architecture explicitly confirmed the inherited restriction does not apply to Expression; implementation inside `js/coachDecisionSystem/*` is authorized | ~~Architecture Decision Pending~~ Resolved | §28 | No |
| EXP-OD-6 | `APP_VERSION` advancement, contingent on eventual shipped scope | Engineering Decision Pending | §27 | No |
| EXP-OD-7 | Concrete Expression module file decomposition — **RESOLVED (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP1–WP4)**: `deliveryIntentContract.js` (WP1), `expressionInputGate.js` (WP3), `expressionRenderingContext.js` (WP4 remainder), `expressionRenderer.js` (WP4), plus `internalPipelineOrchestrator.js`'s own dispatch extension — the final, stable decomposition since WP4's closure | ~~Engineering Decision Pending~~ Resolved | §27 | No |
| EXP-OD-8 | CDR-1/CDR-2 (Intelligence & Relationship Philosophy rank; Coach Bible self-declared supremacy scope) | Canonical Gap (inherited from D1, unaffected by this document) | §3 | No |
| EXP-OD-9 | Delivery Intent literal field-level schema (property names/types) realizing CD-EXP-01's three content categories; concrete correlation-metadata mechanism; `schemaVersion` string — **RESOLVED (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP1)**: `deliveryIntentContract.js`'s closed field schema (`schemaVersion`, `renderedLanguage`, `semanticSignal`, `correlation`, `immutable`); `SCHEMA_VERSION = 'coach-decision-system-delivery-intent/1.0'`; correlation carries an opaque `decisionId` only | ~~Engineering Decision Pending~~ Resolved | §11.5 | No |
| EXP-OD-10 | Bounded-modification content-generation algorithm (how `modification.modifiedContent` is altered) | Product Decision Pending — **new, narrowed from EXP-OD-2 by CD-EXP-02/03/04's resolution of REFUSAL/ESCALATION/disclosure**; no canonical source exists anywhere in the repository; classified non-blocking per the accepted architecture investigation (`MODIFIED` currently unreachable in production) | §14.5 | No |
| EXP-OD-11 | Verification mechanism for the qualitative content-judgment rules CD-EXP-02/03/04 introduce (EXP-59, EXP-62, EXP-65, EXP-70's "coach's own voice") — not mechanically checkable field/absence assertions — **RESOLVED (`EXPRESSION_IMPLEMENTATION_PLAN.md` WP13)**: `tests/fixtures/expressionQualitativeVerificationTestDouble.js`, a deterministic, test-only, keyword/pattern-based checker, by direct structural analogy to `tests/fixtures/safetyIntegrationPortTestDouble.js` (TASK-006); retrofitted into WP5/WP6/WP7's own test suites, never production-reachable | ~~Engineering Decision Pending~~ Resolved | §14.2–14.4, §29 | No |
| EXP-OD-12 | Signal for `D1-PER-03` (Relationship Maturity Stage) reaching Expression — **RESOLVED (Canonical Decision 8; D3 Decision 7)**: Expression Rendering Context, a second, narrow, closed Stage-10 input produced exclusively by the Memory Layer, `TerminalDecision` unchanged; identified during Work Package 4 implementation, not during original SPEC authoring | ~~Architecture Decision Pending~~ Resolved | §10.1, §12 EXP-26 | No |

## Appendix D — Evidence Index

Every repository file/section cited above: `js/coachDecisionSystem/internalPipelineOrchestrator.js`; `js/coachDecisionSystem/safetyLayer.js`; `js/coachDecisionSystem/decisionFormation.js`; `js/coach/coachPresenter.js`; `js/trigger/triggerController.js`; `docs/tasks/B2/B2_SPEC.md`; `docs/specs/D1_SPEC_v1.0.md`; `docs/specs/D2_SPEC_v1.0.md`; `docs/specs/D3_SPEC.md`; `docs/specs/TASK_006_SPEC_v1.0.md`; `docs/specs/SL-001_SPEC_v1.0.md`; `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`; `docs/specs/TASK_007_SPEC_v1.0.md`; `docs/specs/TASK_008_SPEC_v1.0.md`; `docs/governance/FITME_Coach_Bible.md` (Ch.2, Ch.4, Ch.9, Ch.13, Ch.15, Ch.17, Ch.19, Ch.20); `docs/constitution/FITME_AI_Constitution_v1.0.md` (§3.9, §9.17, §17.20, §22.5, §22.9, §23.6, §23.14, §23.15); `docs/specs/C1_SPEC_v1.0.md`; `index.html`.

## Appendix E — Revision History

Cross-referenced with §1's Document Control table.

---

# Global Forbidden Changes

This document, and any implementation performed under it, is explicitly prohibited from:

- writing implementation code during specification authoring — none was written for this document;
- changing Product philosophy, coaching philosophy, or coaching meaning/message content (Coach Bible's territory, unchanged);
- changing any TASK-007 Experience/Interaction/Presentation-Behavior Contract, or any TASK-008 token/component contract;
- changing AI reasoning, Decision Input interpretation, Recommendation/Initiative generation, or Decision Formation (D1/D2/TASK-004/005/006, unchanged);
- changing Safety classification, Safety policy, `reasonCode`, `reasonDetail`, `boundaryType`, or the Safety Decision Matrix (SL-001/SLDP, unchanged);
- changing the `TerminalDecision` contract (`TASK_006_SPEC_v1.0.md` §25);
- changing Coach Runtime's ownership or D3 Decision 6;
- changing Engine Registry contracts, StateAccess authority, or Persistence contracts;
- resolving §14.5 (the bounded-modification content-generation algorithm) by inference, interpretation, or unilateral Engineering choice;
- reopening, narrowing, widening, or otherwise altering Canonical Decisions CD-EXP-01, CD-EXP-02, CD-EXP-03, or CD-EXP-04 without a new, explicit Product/Architecture Canonical Decision — §11.5's and §14.6's residual Engineering-level items may be resolved by Engineering without reopening the Canonical Decisions themselves, but none of the four decisions' own content categories, principles, or prohibitions are Engineering's to alter;
- inventing a per-`reasonCode` rendering rule, a graduated escalation-intensity scale, or any other rendering granularity CD-EXP-02/03/04 do not themselves specify — confirmed not required by any canonical source (accepted architecture investigation);
- inventing a new Runtime, Engine, delivery surface, or top-level architectural component;
- redefining any D1/D2/D3 term or reopening any D1/D2/D3 Canonical Decision, including Decisions 1, 5, and 6;
- declaring Product, Architecture, or READY approval on its own;
- changing files outside `docs/specs/EXPRESSION_SPEC_v1.0.md` during authoring.

---

# Specification Authoring Instructions for Claude Code — Compliance Record

The approved Skeleton's instructions were followed as follows:

1. **Inspected the current repository directly before writing factual claims** — direct `grep`/`Read` verification of `internalPipelineOrchestrator.js`, `coachPresenter.js`, `triggerController.js`, `B2_SPEC.md`, and every cited canonical document, at this authoring session's own commit baseline (`372aa9e`), not re-trusted from the Skeleton's own citations without re-verification.
2. **Distinguished canonical requirements, repository facts, and open Product/Architecture questions from one another at every point** — every EXP-## rule cites its exact canonical source; every repository fact cites an exact file/line; §11 was updated only to the extent CD-EXP-01 actually resolved it (§11.5's residual items remain marked, not silently filled); §14 was updated only to the extent CD-EXP-02/03/04 actually resolved it (§14.5/§14.6's residual items remain marked, not silently filled).
3. **Cited exact files, sections, symbols, and tests wherever they exist** — throughout, per the Traceability Matrix (§32).
4. **Preserved every approved decision** from Product Bible, AI Constitution, Intelligence & Relationship Philosophy, Coach Bible, D1, D2, D3 (including Decisions 1, 5, 6), TASK-004/005/006, SL-001, TASK-007/008, and the approved Skeleton, without exception.
5. **Classified every unresolved matter using the Specification Authoring Standard's taxonomy** — Appendix C; §11 and §14 were not resolved unilaterally under any circumstance.
6. **Invented no Product or Architecture decision, Delivery Intent field value, rendering rule, or terminology** not supported by the repository or the approved Skeleton.
7. **Wrote one complete specification**, except that §14.5 (the bounded-modification content-generation algorithm) remains explicitly marked as pending a Product Canonical Decision rather than filled with placeholder content, per explicit instruction; §11 and §14.2–14.4 were updated strictly to reflect CD-EXP-01/02/03/04 as approved, introducing no content beyond what those Canonical Decisions themselves state.
8. **Performed an Engineering Self-Review before returning this file** — every chapter of the approved Skeleton's 34-chapter structure is populated; the two chapters originally marked AUTHORING REQUIRED (§11, §14) are now resolved by CD-EXP-01 through CD-EXP-04, with the one residual sub-item that remains genuinely open (§14.5, the bounded-modification content-generation algorithm) explicitly marked as such, not silently filled; no chapter was silently dropped or merged.
9. **Stopped after specification authoring and reporting** — no Engineering Readiness Review, implementation, closure documentation, commit, or push was performed as part of this activity.
10. **Did not implement code, update closure documentation, commit, or push** — confirmed.

---

# End of Specification (Draft)
