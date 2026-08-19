# D2_SPEC_v1.0

> **Status:** Canonical
>
> **Version:** 1.0
>
> **Document Type:** Canonical Specification
>
> **Owner:** Head of Product + AI Architect
>
> **Prepared by:** Lead Engineer (orchestration expansion only — no
> product, coaching-logic, or authority decisions were introduced beyond
> the orchestration-level derivations Unit 04's Stage Contracts and Unit
> 07's Engine Responsibilities required from D1; see Consolidated
> Canonical Decision Requirements)

**Amendment Record**

| # | Date/Context | Scope | Authority |
|---|---|---|---|
| 1 | Expression Work Package 4 (`EXPRESSION_IMPLEMENTATION_PLAN.md`), following the accepted Expression Rendering Context Architecture investigation | Unit 04, Stage 10 (Expression): Inputs, Dependencies, and Cross References amended to add the Expression Rendering Context as a second declared input, produced by the Memory Layer (D3 Decision 7, extending D3 Decision 3). No other Stage Contract, Invariant, or Exceptional Flow is affected. `TerminalDecision` (Unit 04 Stage 9's own output; fixed in full by `TASK_006_SPEC_v1.0.md` §25) is unchanged. See Consolidated Canonical Decision Requirements, CDR-2. | Product Review: APPROVED. Architecture Review: APPROVED. Canonical Review: PASSED. |

# D2 --- Coach Decision Pipeline Specification

------------------------------------------------------------------------

# Purpose of this Specification

Defines the canonical orchestration model governing how coach decisions
flow from input through execution. This document specifies execution
order and orchestration only.

D2 is not a summary of D1. D1 fixes *what* the coach decides — the
policy every rule below assumes and never restates. D2 fixes *when*,
*in what order*, and *through which stage* each piece of that policy is
applied, so that independently-built implementations of the
Recommendation Engine, Initiative Engine, and Decision Engine (Roadmap
TASK-004/005/006), together with the cross-cutting Safety Layer and
Memory Layer, interoperate against one shared pipeline rather than each
inventing its own execution order. Where a Stage Contract below states a
Responsibility, it names the D1 Unit that Responsibility applies — it
does not re-derive or restate that Unit's rule.

------------------------------------------------------------------------

# Canonical Authority Sources

1.  AI Constitution
2.  Product Bible
3.  Coach Bible
4.  Intelligence & Relationship Philosophy
5.  Architecture
6.  C2
7.  C3
8.  C4
9.  D1
10. Roadmap
11. Changelog

**Precedence Confirmation (RCD-07):** The precedence among these sources
for resolving textual conflicts is the Engineering Workflow §3 order,
confirmed by the FITME Safety Layer Canonical Decision Package v2.0
(Head of Product + AI Architect, Final Canonical Update) as: 1. AI
Constitution, 2. Product Bible, 3. Coach Bible, 4. Architecture, 5.
Engineering Workflow, 6. Task Specifications, 7. Roadmap, 8. Changelog.
The list above is a citation index for this document's own sources, not
an independent precedence order; the Coach Knowledge Base is confirmed
non-authoritative.

------------------------------------------------------------------------

# Scope

## D2 Defines

-   Pipeline orchestration
-   Stage ordering
-   Stage contracts
-   Decision lifecycle
-   Pipeline invariants
-   Engine responsibilities
-   Exceptional flows
-   Pipeline traceability

## D2 Does NOT Define

-   Coaching policy
-   Recommendation policy
-   Evidence policy
-   Memory policy
-   Priority policy
-   Personalization policy
-   Safety policy
-   Engineering implementation

------------------------------------------------------------------------

# Governing Principle

**Every normative statement in D2 MUST be traceable to D1 or an earlier
approved canonical document. D2 SHALL define orchestration only.**

------------------------------------------------------------------------

# Shared Vocabulary

-   **Pipeline** — the complete, fixed-order sequence of Stages (Unit
    03) through which every coach decision cycle passes, from Decision
    Input receipt through Memory Update. Defined fully in Unit 03.
-   **Stage** — a single, bounded step of the Pipeline governed by an
    explicit Stage Contract (Unit 04): declared inputs, outputs,
    responsibilities, and forbidden actions. Defined fully in Unit 04.
-   **Pipeline Context** — the assembled working set of Decision Inputs
    (D1 Unit 03) and User State (D1 Unit 04), representing the user's
    state at the beginning of the Decision Pass, produced once by
    Context Assembly and immutable for the remainder of that Decision
    Pass (Canonical Decision 3). Defined fully in Unit 02 and Unit 04.
-   **Candidate** — a not-yet-selected Recommendation-kind (D1 Unit 08)
    or Initiative-kind (D1 Unit 09) decision object produced by
    Candidate Generation, competing for selection at Winner Selection.
    Defined fully in Unit 04 and Unit 06.
-   **Stage Contract** — the fixed set of properties (Purpose, Inputs,
    Outputs, Responsibilities, Forbidden Actions, Dependencies, Entry
    Criteria, Exit Criteria, Cross References) that fully specifies a
    Stage. Defined fully in Unit 04.
-   **Pipeline Invariant** — a property that SHALL hold across every
    cycle of the Pipeline regardless of which specific Stage outcomes
    occur in that cycle. Defined fully in Unit 05.
-   **Terminal Decision** — the fully-formed Canonical Decision (D1
    Unit 15) that Decision Formation produces: a Recommendation, an
    Initiative, a Silence, or a refusal/escalation. A Decision Pass
    always produces exactly one Terminal Decision (Canonical Decision
    1) — the winning Candidate from the shared competitive path (which
    MAY carry multiple user-selectable options under the narrow
    multi-option exception, still counted and treated as one Terminal
    Decision, Canonical Decision 7), or, where no Opportunity produced a
    surviving Candidate, a single Silence. A per-Opportunity internal
    outcome (termination or Silence, Unit 02) is not itself a Terminal
    Decision. Defined fully in Unit 04 (Decision Formation) and Unit 06.
-   **Decision Lifecycle** — the ordered sequence of states (Unit 06) a
    Terminal Decision and its constituent Candidate pass through as
    they move through the Pipeline. Defined fully in Unit 06.

------------------------------------------------------------------------

# Table of Contents

-   Unit 00 --- Design Philosophy
-   Unit 01 --- Purpose
-   Unit 02 --- Pipeline Principles
-   Unit 03 --- Canonical Pipeline
-   Unit 04 --- Stage Contracts
-   Unit 05 --- Pipeline Invariants
-   Unit 06 --- Decision Lifecycle
-   Unit 07 --- Engine Responsibilities
-   Unit 08 --- Exceptional Flows
-   Unit 09 --- Pipeline Traceability
-   Unit 10 --- Acceptance Criteria
-   Unit 11 --- Reference Pipeline
-   Consolidated Canonical Decision Requirements (CDR)

------------------------------------------------------------------------

# Unit 00 --- Design Philosophy

## Purpose

This Unit establishes why coach reasoning must follow a fixed, disclosed
order rather than an ad hoc or emergent one, and why the *order* itself
— not any single stage in isolation — is what D2 exists to protect.

## Canonical Principles

- **Reasoning, deciding, and communicating are three distinct
  disciplines.** The Coach Bible organizes its own canonical account of
  coach behavior into exactly this sequence: Chapter 3 ("Operational
  Intelligence") supplies "the discipline of observation,
  interpretation, and reasoning that turns raw experience into a
  situation Chapter 2 can safely act on"; Chapter 2 ("The FITME Coaching
  Framework") supplies the decision itself, given an already-understood
  situation; Chapter 4 ("Coaching Communication") governs how the coach
  "communicates with users once Chapter 3's reasoning and Chapter 2's
  decision framework have already produced the correct coaching
  judgment." D2's Pipeline is the operational form of this same
  three-part separation (Unit 02, Unit 03), extended by a fourth,
  orthogonal grouping — the Post-Decision Continuation (Feedback
  Processing, Evidence Update, Memory Update; Unit 03) — that observes
  and records the outcome of what the three-part separation already
  decided and communicated.
- **Order is itself a commitment, not an implementation detail.** "What
  matters is that the order is never skipped, and the priorities are
  never inverted for convenience" (Coach Bible Ch.2 §1). D1 fixes the
  priorities (Canonical Decision Hierarchy, D1 Unit 02); D2 fixes the
  order in which those priorities are actually evaluated.
- **The decision is separate from the delivery.** "FITME deliberately
  separates *what* it has decided from *how* that decision is
  communicated... Both the judgment and the delivery must be right,
  reasoned about as two distinct steps rather than blended into one"
  (Coach Bible Ch.2 §4.3). D1 Unit 15 (D1-CDO-03) states the binding
  rule this principle produces: a generative or LLM layer expresses a
  decision already reached; it never originates one. D2's Expression
  Stage (Unit 04) is the pipeline enforcement point for that rule.
- **A pipeline is the Coaching Pyramid made operational, not a
  replacement for it.** "The pyramid describes priority under conflict,
  not chronology... All four layers are usually evaluated within the
  same moment, before a single word is produced" (Coach Bible Ch.2 §5).
  D2 imposes an actual chronology — the Pipeline — as the concrete
  mechanism through which that priority becomes consistently
  enforceable across independently-built engines, without changing what
  the priority itself is (D1 Unit 02 remains authoritative on priority;
  D2 governs only sequence).
- **Consistency across independently-built engines requires agreement on
  sequence, not only on content.** D1's ultimate success criterion (D1
  Unit 01) requires that two independently-implemented engines select
  the same kind of decision and the same priority ranking given the same
  inputs. That guarantee is void if the two engines are free to reach
  it through incompatible internal orderings — a Recommendation Engine
  that performs its own prioritization, for example, could reach a
  differently-ranked outcome than one that defers ranking to a Decision
  Engine, even while both correctly apply D1's content rules. D2 closes
  this gap.

## SHALL Rules

- **D2-DP-01 (single execution order).** The Pipeline (Unit 03) SHALL be
  the sole mechanism through which a coach decision cycle is formed; no
  engine conforming to D2 SHALL reach a Terminal Decision through any
  other execution order (Coach Bible Ch.2 §1).
- **D2-DP-02 (four distinct stage groups).** Reasoning (Receive Inputs
  through Evidence Evaluation), Deciding (Eligibility Evaluation through
  Decision Formation), and Communicating (Expression) together form the
  Decision Pass; Feedback Processing, Evidence Update, and Memory Update
  together form the Post-Decision Continuation (Unit 03). These SHALL
  remain four distinct groups of Stages; no Stage in one group SHALL
  perform the Responsibility fixed to a Stage in another group (Coach
  Bible Ch.2 §4.3; Coach Bible Ch.3, Ch.4 canonical purposes; D1 Unit 15,
  D1-CDO-03).
- **D2-DP-03 (sequence and priority are independent orderings).** A
  Pipeline cycle's chronological Stage order SHALL never itself become a
  substitute for, or reinterpretation of, the Canonical Decision
  Hierarchy's priority ordering (D1 Unit 02). Stage sequence governs
  *when* a judgment is made; Hierarchy tier governs *which* judgment
  wins. Neither ordering overrides the other's domain.

## Acceptance Criteria

Given the same Pipeline Context, two independently-built engines
conforming to D2 SHALL execute Stages in the identical fixed order
defined in Unit 03, and SHALL each be able to state, for any Terminal
Decision, which Stage produced which element of that decision.

## Cross References

D1 Unit 01 (determinism); D1 Unit 02 (Canonical Decision Hierarchy); D1
Unit 15 (decision precedes expression); Unit 02 and Unit 03 below.

------------------------------------------------------------------------

# Unit 01 --- Purpose

## Purpose

D2 exists to give the Recommendation Engine (TASK-004), Initiative
Engine (TASK-005), and Decision Engine (TASK-006) — together with the
cross-cutting Safety Layer and Memory Layer — a single, shared
orchestration contract, so that independently-built implementations of
these engines interoperate: the same Pipeline Context entering the same
Stage, in the same order, regardless of which team or system built which
engine. D2 builds directly on D1's decision policy (Units 02-15) without
restating it; where a Stage Contract's Responsibility is "apply D1 Unit
X," D2 does not re-derive Unit X's rule — it fixes only where and when
that rule is applied within the Pipeline.

## Design Goals

- Fix Stage order and Stage Contracts (Unit 03, Unit 04) precisely
  enough that two independent implementations produce structurally
  interoperable output, even where generated candidate *content* (D1
  Units 08/09 policy) differs.
- Fix the Decision Lifecycle (Unit 06) so that a Terminal Decision's
  state is unambiguous at every point in a cycle.
- Fix Engine Responsibilities (Unit 07) precisely enough to prevent one
  engine from silently absorbing another engine's authority — for
  example, a Recommendation Engine that also performs Prioritization.
- Enumerate Exceptional Flows (Unit 08) so that gaps in ordinary Stage
  sequencing — no opportunity, insufficient evidence, a safety
  override, missing context — have a defined, non-improvised
  resolution rather than being left to per-implementation judgment.
- Fix Pipeline Traceability (Unit 09) so that any Terminal Decision is
  logically attributable, at the canonical orchestration level, to the
  specific sequence of Stage outputs that produced it.

## Non-Goals

D2 does not define coaching, recommendation, evidence, memory, priority,
personalization, or safety policy (all D1's, or an earlier canonical
document's, exclusive territory — see Scope), and does not define
engineering implementation: invocation cadence, concurrency model,
scheduling, APIs, database design, algorithms, or pseudocode. Where a
Stage Contract below could be read as touching one of these, the
touching is limited to naming *which* D1 rule the Stage applies and
*when* — never restating, extending, or narrowing the rule itself.

## Acceptance Criteria

Given identical Pipeline Context and identical D1 decision-policy
inputs, two independently-built D2-conformant Pipeline implementations
SHALL produce Terminal Decisions occupying the same Decision Lifecycle
state at the same Stage boundary, even where generated candidate content
differs.

## Cross References

D1 Unit 01; Roadmap TASK-004, TASK-005, TASK-006.

------------------------------------------------------------------------

# Unit 02 --- Pipeline Principles

## Purpose

This Unit fixes the principles every Stage Contract (Unit 04) and every
Pipeline Invariant (Unit 05) conforms to, so that individual Stage
definitions do not each need to be re-justified from first principles.

## Canonical Principles

- **Fixed order, no reordering** (Coach Bible Ch.2 §1; Unit 00,
  D2-DP-01).
- **Pipeline Context is assembled once per Decision Pass and is
  immutable (Canonical Decision 3).** Pipeline Context is assembled
  once, by Context Assembly, and represents the user's state at the
  beginning of the Decision Pass. It remains immutable for the
  remainder of that Decision Pass. Newly arriving information
  participates only in the next Pipeline cycle's own Context Assembly.
  This is approved canonical architecture, not a derived assumption.
- **A Stage consumes only its own declared inputs.** Every input a
  decision process consumes SHALL be traceable to an approved category
  (D1-DI-01); this Unit applies the same discipline one level down, to
  the inputs a single Stage may draw on.
- **Silence is a first-class outcome of the Decision Pass, not of a
  single Opportunity.** A Silence Terminal Decision SHALL be as fully
  formed and retrievable a decision as a Recommendation or Initiative
  (D1-CDO-01, D1-SP-01). An individual Opportunity's internal outcome —
  terminating internally or resolving to Silence (below) — is not
  itself a Terminal Decision and does not independently invoke Decision
  Formation; where at least one Opportunity was detected, Decision
  Formation still runs, once, for the Decision Pass as a whole (Unit 04,
  Stage 9) — except the "No Opportunity" case (Unit 08, D2-EF-02), where
  Decision Formation is not invoked at all.
- **Confidence and Hierarchy tier are validated and preserved forward,
  not re-derived from scratch.** A high confidence score is not a
  substitute for authority (D1-ER-07); later Stages accordingly validate
  a Candidate's confidence and Canonical Decision Hierarchy tier against
  D1's own rules, rather than freezing either value merely because it
  originated at Candidate Generation, and preserve the value found valid
  unless applying D1 to newly-available information (for example, a
  Safety Layer determination) would produce a different one.
- **Multiple Opportunities may be evaluated; the Decision Pass always
  produces exactly one Terminal Decision (Canonical Decision 1).**
  Opportunity Detection MAY detect more than one Opportunity per cycle
  (Unit 03). Each is evaluated independently through Evidence Evaluation
  and Eligibility Evaluation. For each Opportunity, this evaluation
  resolves internally to one of: it terminates internally, it resolves
  to Silence, or it generates Candidates (Unit 08, D2-EF-03/04). These
  are internal orchestration outcomes — not independently competing
  Terminal Decisions. Candidates from every Opportunity that generates
  them are pooled at Prioritization (D1-PR-04's shared budget); Winner
  Selection then selects, by default, exactly one winning Candidate from
  that pool — or, under the narrow exception where ranking genuinely
  cannot produce one clear winner, the full permitted tied set (Unit 08,
  D2-EF-05). Either way, Decision Formation forms exactly one Terminal
  Decision for the Decision Pass: that winning Candidate (or tied set,
  assembled into a single Terminal Decision carrying multiple
  user-selectable options, Canonical Decision 7), or, where no
  Opportunity produced a surviving Candidate, a single Silence — never
  one Terminal Decision per Opportunity, and never more than one
  Terminal Decision per Decision Pass, under any circumstance.

## SHALL Rules

- **D2-PP-01 (fixed order).** Stages SHALL execute in exactly the order
  fixed by Unit 03. No Stage SHALL be skipped except via an explicit
  short-circuit path defined in Unit 05 or Unit 08.
- **D2-PP-02 (context immutability).** Pipeline Context SHALL be
  assembled once per Decision Pass, by Context Assembly, representing
  the user's state at the beginning of that Decision Pass. It SHALL NOT
  be mutated by any later Stage for the remainder of that Decision Pass.
  Newly arriving information SHALL participate only in the next Pipeline
  cycle's own Context Assembly (Canonical Decision 3). No exception
  exists for an explicit user correction received before Expression: a
  Pre-Expression User Correction SHALL NOT reopen or mutate the active
  Decision Pass's Pipeline Context; the active Decision Pass's Terminal
  Decision is instead withheld from Expression, and the correction is
  evaluated only through a newly assembled Pipeline Context in a new
  Decision Pass (Canonical Decision 4; Unit 08, D2-EF-07).
- **D2-PP-03 (declared inputs only).** A Stage SHALL consume only the
  inputs declared in its own Stage Contract (Unit 04); it SHALL NOT read
  or depend on another Stage's internal working state (D1-DI-01).
- **D2-PP-04 (Decision-Pass-level Silence is fully formed, not an
  absence of a decision).** Where one or more Opportunities were
  detected this cycle but none produces a surviving Candidate, Decision
  Formation SHALL still run, once, to produce a fully-formed Silence
  Terminal Decision for the Decision Pass; it SHALL never be a
  silently-dropped cycle (D1-CDO-01, D1-SP-01) — except the "No
  Opportunity" case (Unit 08, D2-EF-02), where no Opportunity was
  detected at all and Decision Formation is not invoked. An individual
  Opportunity's own internal termination or Silence outcome does not, by
  itself, invoke Decision Formation (Canonical Decision 1).
- **D2-PP-05 (confidence and hierarchy-tier validation and
  preservation).** The confidence (D1 Unit 11) and Canonical Decision
  Hierarchy tier (D1 Unit 02) attached to a Candidate at Candidate
  Generation SHALL be validated against D1's own rules, and, where still
  correct under D1, preserved, by Prioritization, Winner Selection, and
  Decision Formation. Neither value is fixed merely because it
  originated at Candidate Generation; a later Stage SHALL NOT
  arbitrarily recompute either value from scratch, but SHALL revise it
  where applying D1 to newly-available information (for example, a
  Safety Layer determination, Unit 07) would produce a different value.
- **D2-PP-06 (pipeline cardinality).** Multiple Opportunities and
  multiple Candidates MAY exist within a single Pipeline cycle. Each
  Opportunity that fails Evidence Evaluation or Eligibility Evaluation,
  or that produces zero Candidates, SHALL resolve internally to
  termination or Silence (D2-EF-03, D2-EF-04) — an internal orchestration
  outcome, not an independent Terminal Decision (Canonical Decision 1).
  Among the Candidates surviving to the shared pool at Prioritization,
  Winner Selection SHALL by default select exactly one winning Candidate
  — or, under the narrow exception where ranking genuinely cannot
  produce one clear winner, the full permitted tied set (D2-EF-05).
  Decision Formation SHALL always produce exactly one Terminal Decision
  per Decision Pass — the winning Candidate, or the tied set assembled
  into a single Terminal Decision carrying multiple user-selectable
  options (Canonical Decision 7), or, where no Opportunity produced a
  surviving Candidate, a single Silence. No circumstance produces more
  than one Terminal Decision per Decision Pass.

## Acceptance Criteria

See Unit 10 (consolidated).

## Cross References

D1 Units 01, 02, 11; Unit 03 (fixed order operationalized); Unit 05
(invariants); Unit 08 (exceptional short-circuit paths).

------------------------------------------------------------------------

# Unit 03 --- Canonical Pipeline

## Purpose

Fixes the single, canonical, ordered sequence of Stages that every
Pipeline cycle SHALL follow — the concrete operational form of Unit
00's and Unit 02's principles.

## End-to-End Pipeline

``` text
Receive Inputs
↓
Context Assembly
↓
Opportunity Detection
↓
Evidence Evaluation
↓
Eligibility Evaluation
↓
Candidate Generation
↓
Prioritization
↓
Winner Selection
↓
Decision Formation
↓
Expression
↓
Feedback Processing
↓
Evidence Update
↓
Memory Update
```

Stages 1-10 (Receive Inputs through Expression) constitute the
**Decision Pass** — the portion of a Pipeline cycle that produces and
delivers a Terminal Decision. Stages 11-13 (Feedback Processing through
Memory Update) constitute the **Post-Decision Continuation** — the
portion that observes the user's response, if any, and updates
confidence and memory accordingly. This is an orchestration-timing
distinction only, not a second pipeline: both remain part of one
Pipeline cycle in the fixed order fixed above. Because Feedback
Processing depends on a user response that arrives on its own timeline,
a given Terminal Decision's Post-Decision Continuation MAY still be
pending when a later cycle's Decision Pass begins for a different
Opportunity (Unit 08, D2-EF-09); this does not alter the fixed Stage
order within either cycle.

## Stage Overview

1. **Receive Inputs** — accepts the raw Decision Input categories (D1
   Unit 03) for the cycle, uninterpreted.
2. **Context Assembly** — converts raw inputs into the Pipeline Context
   (D1 Unit 04 User State Model), representing the user's state at the
   beginning of the Decision Pass and immutable for its remainder
   (Canonical Decision 3). Orchestration authority: Memory Layer (Unit
   07).
3. **Opportunity Detection** — identifies zero or more candidate
   Opportunities (D1 Unit 05). Opportunity Detection MAY detect more
   than one Opportunity per cycle; each is evaluated independently
   through Evidence Evaluation, Eligibility Evaluation, and Candidate
   Generation (Unit 02, D2-PP-06) — except a safety/high-risk-triggered
   Opportunity, admitted unconditionally, which bypasses only Evidence
   Evaluation and Eligibility Evaluation and proceeds directly to
   Candidate Generation, then continues through the same single pipeline
   as any other eligible Opportunity (Unit 07, function (a); Canonical
   Decision 5). Contributed to by the Recommendation Engine, Initiative
   Engine, and Safety Layer (Unit 07).
4. **Evidence Evaluation** — applies the Evidence Hierarchy (D1 Unit 11)
   to a detected Opportunity. Failure terminates that Opportunity
   internally — an internal orchestration outcome, not an independent
   Terminal Decision (Unit 08; Canonical Decision 1). Orchestration
   authority: Decision Engine, narrowly, exercised through a dedicated
   internal execution component (AD-G2-02, `docs/governance/
   FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`,
   Chapter 11); D1 Unit 11 remains the sole Evidence-policy authority.
5. **Eligibility Evaluation** — applies the Intervention Eligibility
   gate (D1 Unit 06) to the Opportunity as a whole, before any Candidate
   is generated; a Pipeline Gate, not a Decision Lifecycle state (Unit
   06; Canonical Decision 2). Failure resolves that Opportunity to
   Silence internally (Unit 08; Canonical Decision 1). Orchestration
   authority: Decision Engine.
6. **Candidate Generation** — produces Candidates for an eligible
   Opportunity, applying D1 Unit 08 (Recommendation) or D1 Unit 09
   (Initiative). Orchestration authority: Recommendation Engine and
   Initiative Engine respectively. Zero Candidates resolves that
   Opportunity to Silence internally (Unit 08; Canonical Decision 1).
7. **Prioritization** — ranks every Candidate produced by any
   Opportunity this cycle, jointly, per D1 Unit 07. Orchestration
   authority: Decision Engine.
8. **Winner Selection** — selects exactly one winning Candidate (D1-PR-
   05), or, under the narrow permitted exception where ranking genuinely
   cannot produce one clear winner, the full permitted tied set (Unit
   08, D2-EF-05) — which Decision Formation still assembles into a
   single Terminal Decision (Canonical Decision 7). Orchestration
   authority: Decision Engine, subject to Safety Layer disqualification
   authority.
9. **Decision Formation** — runs once per Decision Pass to assemble the
   Decision Pass's single fully-formed Terminal Decision (D1 Unit 15):
   the winning Candidate; or, under the narrow multi-option exception,
   the tied set assembled into that one Terminal Decision as multiple
   user-selectable options (Canonical Decision 7); or, where no
   Opportunity produced a surviving Candidate, a single Silence
   (Canonical Decision 1) — subject to the Safety Layer's final,
   non-bypassable evaluation (D1-AB-05). Always exactly one Terminal
   Decision, under every circumstance. Orchestration authority: Decision
   Engine and Safety Layer.
10. **Expression** — renders the already-formed Terminal Decision into
    language (Coach Bible Ch.4), without originating any of its content
    (D1-CDO-03). Withholds delivery entirely where the Terminal Decision
    has been superseded by a Pre-Expression User Correction (Unit 08,
    D2-EF-07; Canonical Decision 4). Performed by a generative/LLM layer
    outside the five Unit 07 engines.
11. **Feedback Processing** *(Post-Decision Continuation begins here)* —
    classifies the user's response, if any, into the Feedback Type
    vocabulary (Shared Vocabulary; C2 §6). A no-op for a Silence-kind
    Terminal Decision. Orchestration authority: Memory Layer.
12. **Evidence Update** — updates confidence per D1 Unit 11, using the
    classified Feedback Type. For Silence, no new input is consumed this
    cycle; the underlying belief remains open for a future cycle's own
    Evidence Evaluation and Evidence Update (Unit 08, D2-EF-03).
    Orchestration authority: Memory Layer.
13. **Memory Update** — persists the resulting belief/history change
    subject to D1 Unit 12's authority rules, or makes no write where D1
    Unit 12 determines none is warranted (D1-MU-05). Orchestration
    authority: Memory Layer.

## Acceptance Criteria

Every cycle SHALL traverse Receive Inputs and Context Assembly. Every
Opportunity detected SHALL resolve internally to termination, Silence,
or generated Candidates (Unit 02, D2-PP-06) — internal orchestration
outcomes, not independent Terminal Decisions. Every cycle SHALL
terminate in one of: the "No Opportunity" trivial completion (Unit 08),
with no Terminal Decision produced, because no Opportunity existed to
decide about; or, where one or more Opportunities were detected, exactly
one Terminal Decision, always, produced once by Decision Formation — the
winning Candidate from the shared pool; the tied set from the narrow
multi-option exception, assembled into that same single Terminal
Decision as multiple user-selectable options (Unit 08, D2-EF-05;
Canonical Decision 7); or, where no Opportunity produced a surviving
Candidate, a single Silence. No case produces more than one Terminal
Decision.

## Cross References

Unit 04 (per-stage contracts); Unit 06 (Decision Lifecycle state
mapping); Unit 07 (assigned orchestration authority per Stage); Unit 08
(exceptional/short-circuit flows); D1 Units 03-15.

------------------------------------------------------------------------

# Unit 04 --- Stage Contracts

The following fixes, for every Stage named in Unit 03, its Purpose,
Inputs, Outputs, Responsibilities, Forbidden Actions, Dependencies,
Entry Criteria, Exit Criteria, and Cross References.

## Stage 1 — Receive Inputs

- **Purpose.** Accept the raw Decision Input categories for the current
  cycle without interpretation.
- **Inputs.** Any of the eight D1 Unit 03 Decision Input categories
  currently available: Behavioral Events, Derived Intelligence, Profile
  and Runtime State, Memory, Health/Safety Profile, Life Event Context,
  Relationship Maturity signal, Situational context.
- **Outputs.** A raw, uninterpreted Decision Input set for the cycle.
- **Responsibilities.** Accept inputs exactly as received; record which
  of the eight categories are present and which are absent, since
  absence is itself later treated as evidence (D1-DI-04).
- **Forbidden Actions.** SHALL NOT interpret, weigh, rank, or filter
  inputs (reserved to Context Assembly and later Stages). SHALL NOT
  fabricate a value for a missing input (D1-DI-02).
- **Dependencies.** None — first Stage of the cycle.
- **Entry Criteria.** A new Pipeline cycle has begun.
- **Exit Criteria.** The raw Decision Input set for this cycle is fixed
  and passed to Context Assembly.
- **Cross References.** D1 Unit 03.

## Stage 2 — Context Assembly

- **Purpose.** Convert the raw Decision Input set into the Pipeline
  Context — the User State Model (D1 Unit 04) as currently understood —
  representing the user's state at the beginning of the Decision Pass
  (Canonical Decision 3).
- **Inputs.** The raw Decision Input set from Receive Inputs.
- **Outputs.** Pipeline Context: current values for each D1 Unit 04
  State Dimension (belief categories, Relationship Maturity Stage, Life
  Event Context, Health/Safety Profile, emotional/psychological-safety
  state, Habit state, Pattern state, Capacity state).
- **Responsibilities.** Reassess each State Dimension from currently
  available evidence rather than assuming a prior-cycle value still
  holds (D1-USM-02); record absent inputs as evidence, not omissions
  (D1-DI-04); consume Habit/Pattern state only via the approved
  consumption path (D1-MU-07).
- **Forbidden Actions.** SHALL NOT assume a State Dimension's
  prior-cycle value still holds without reassessing it against this
  cycle's inputs. SHALL NOT read raw Habit/Pattern storage directly
  (D1-MU-07). SHALL NOT communicate or act on a Working Hypothesis with
  Stable-Fact confidence (D1-USM-01).
- **Dependencies.** Receive Inputs; Memory Layer (Unit 07), for stored
  belief state.
- **Entry Criteria.** Raw Decision Input set available.
- **Exit Criteria.** Pipeline Context is complete and, per D2-PP-02,
  immutable for the remainder of the Decision Pass.
- **Cross References.** D1 Units 03, 04, 12.

## Stage 3 — Opportunity Detection

- **Purpose.** Identify zero or more candidate Opportunities (D1 Unit
  05) worth carrying forward for evaluation.
- **Inputs.** Pipeline Context.
- **Outputs.** A set of zero or more detected Opportunities, each tagged
  with its D1 Unit 05 source category (Decision Window, confirmed-
  pattern anticipation, disruption detection, milestone/recovery
  trigger, safety/high-risk trigger).
- **Responsibilities.** Apply D1 Unit 05's opportunity sources and
  D1-OD-01/02 thresholds — a single non-safety, non-explicit event is
  data, not evidence; admit safety/high-risk-triggered Opportunities
  unconditionally on first occurrence (D1-OD-04).
- **Forbidden Actions.** SHALL NOT detect an Opportunity from a single
  non-safety, non-explicit event (D1-OD-01). SHALL NOT anticipate from a
  single prior instance (D1-OD-02).
- **Dependencies.** Context Assembly; Safety Layer (mandatory injection
  path); Initiative Engine (anticipation); Recommendation Engine
  (Decision Window detection) — see Unit 07.
- **Entry Criteria.** Pipeline Context assembled.
- **Exit Criteria.** Zero Opportunities → cycle resolves per Unit 08,
  "No Opportunity." One or more Opportunities → each ordinary Opportunity
  proceeds independently to Evidence Evaluation; a safety/high-risk-
  triggered Opportunity (D1-OD-04) proceeds directly to Candidate
  Generation instead, bypassing only Evidence Evaluation and Eligibility
  Evaluation (Unit 07, function (a); Unit 08, D2-EF-01(a); Canonical
  Decision 5).
- **Cross References.** D1 Unit 05; Unit 08 (No Opportunity, D2-EF-01).

## Stage 4 — Evidence Evaluation

- **Purpose.** For a detected Opportunity, determine whether its
  supporting evidence meets the Evidence Hierarchy bar (D1 Unit 11)
  required to proceed.
- **Inputs.** One detected Opportunity; Pipeline Context.
- **Outputs.** A sufficient/insufficient determination for that
  Opportunity, with its Evidence Hierarchy tier recorded.
- **Responsibilities.** Classify supporting evidence by D1 Unit 11 tier;
  apply claim-type separation (D1-ER-01); apply no-single-event-state-
  change (D1-ER-02) and absence-is-evidence (D1-ER-04).
- **Forbidden Actions.** SHALL NOT treat Inference-tier (D1 Unit 11 tier
  5) evidence as sufficient on its own. SHALL NOT communicate or act on
  a Working Hypothesis with Stable-Fact confidence (D1-USM-01).
- **Dependencies.** Opportunity Detection; Memory Layer (Evidence
  Hierarchy state); Decision Engine (orchestration authority, narrow,
  per AD-G2-02).
- **Entry Criteria.** An Opportunity has been detected, and it is not a
  safety/high-risk-triggered Opportunity — those bypass this Stage
  entirely and proceed directly from Opportunity Detection to Candidate
  Generation (Unit 07, function (a); Unit 08, D2-EF-01(a); Canonical
  Decision 5).
- **Exit Criteria.** Insufficient evidence → this Opportunity terminates
  internally (D1-SP-02, D1-SP-03) — an internal orchestration outcome,
  not an independent Terminal Decision (Canonical Decision 1); it does
  not proceed to Eligibility Evaluation. Sufficient evidence → proceeds
  to Eligibility Evaluation.
- **Cross References.** D1 Unit 11; D1 Unit 10 (D1-SP-02/03); Unit 08
  (No Evidence, D2-EF-01).

## Stage 5 — Eligibility Evaluation

- **Purpose.** Apply the D1 Unit 06 Intervention Eligibility gate to a
  sufficiently-evidenced Opportunity, at the opportunity level, before
  any Candidate is generated for it. This is a Pipeline Gate, not a
  Decision Lifecycle state (Unit 06; Canonical Decision 2).
- **Inputs.** A sufficiently-evidenced Opportunity; Pipeline Context.
- **Outputs.** An eligible/ineligible determination for the Opportunity
  as a whole.
- **Responsibilities.** Confirm a valid reason from D1-IE-01's
  enumerated set; apply the Trust Test (D1-IE-02); apply D1-IE-04's
  reduced-frequency adjustment during low-coaching-value periods.
- **Forbidden Actions.** SHALL NOT declare an Opportunity eligible
  merely because an event occurred or because the pipeline is
  technically capable of proceeding (D1-IE-03).
- **Dependencies.** Evidence Evaluation; Decision Engine (orchestration
  authority).
- **Entry Criteria.** Opportunity has passed Evidence Evaluation, and it
  is not a safety/high-risk-triggered Opportunity — those bypass this
  Stage entirely, admitted unconditionally (D1-IE-05) and proceeding
  directly to Candidate Generation (Unit 07, function (a); Unit 08,
  D2-EF-01(a); Canonical Decision 5).
- **Exit Criteria.** Ineligible → this Opportunity resolves to Silence
  internally (D1-SP-02) — an internal orchestration outcome, not an
  independent Terminal Decision (Canonical Decision 1); it does not
  proceed to Candidate Generation. Eligible → proceeds to Candidate
  Generation.
- **Cross References.** D1 Unit 06; D1 Unit 10 (D1-SP-02); Unit 08
  (this Stage's failure is an internal Silence outcome; "No Eligible
  Candidate" in Unit 08 is a distinct, later outcome at Candidate
  Generation; D2-EF-01(a) for the safety bypass).

## Stage 6 — Candidate Generation

- **Purpose.** Produce one or more Candidates — Recommendation-kind (D1
  Unit 08) or Initiative-kind (D1 Unit 09) — for an eligible
  Opportunity.
- **Inputs.** An eligible Opportunity; Pipeline Context.
- **Outputs.** Zero or more Candidates, each carrying: kind
  (Recommendation/Initiative), content, a statable rationale
  (D1-RP-02), confidence, and Canonical Decision Hierarchy tier.
- **Responsibilities.** Apply D1 Unit 08 in full for Recommendation-kind
  Opportunities (three simultaneous conditions D1-RP-01, mandatory
  rationale D1-RP-02, grounded-in-real-constraints D1-RP-03, minimal
  effective intervention D1-RP-04, no verbatim repetition D1-RP-05,
  hypothesis treatment D1-RP-06, habit-formation sub-rules D1-RP-08) or
  D1 Unit 09 in full for Initiative-kind Opportunities.
- **Forbidden Actions.** SHALL NOT emit a Candidate with no statable
  rationale (D1-RP-02) — this resolves to zero Candidates, not a
  Candidate lacking one. SHALL NOT emit a Candidate that conflicts with
  a D1 Unit 02 absolute override (D1-RP-07). SHALL NOT perform
  Prioritization or Winner Selection itself (Unit 02 above; separation
  of generation from arbitration).
- **Dependencies.** Eligibility Evaluation; Recommendation Engine;
  Initiative Engine; Safety Layer (either the Opportunity-Detection-level
  bypass admission, function (a), or the disqualification check applied
  downstream at Winner Selection, function (b)).
- **Entry Criteria.** Opportunity is eligible — either through ordinary
  Eligibility Evaluation (Stage 5), or through the Safety Layer's
  unconditional bypass admission for a safety/high-risk-triggered
  Opportunity (Unit 07, function (a); Canonical Decision 5).
- **Exit Criteria.** Zero Candidates produced → this Opportunity resolves
  to Silence internally (D1-RP-02, D1-CDO-02) — an internal orchestration
  outcome, not an independent Terminal Decision (Canonical Decision 1);
  this is the "No Eligible Candidate" exceptional flow (Unit 08). One or
  more Candidates → each proceeds to Prioritization.
- **Cross References.** D1 Units 08, 09; Unit 08 (No Eligible
  Candidate); Unit 06 (Decision Lifecycle mapping).

## Stage 7 — Prioritization

- **Purpose.** Rank every Candidate surviving Candidate Generation
  across every Opportunity detected this cycle, jointly, against the
  shared recommendation/initiative budget (D1-PR-04).
- **Inputs.** The full Candidate set produced by Candidate Generation
  across all Opportunities this cycle.
- **Outputs.** An ordered ranking of all Candidates.
- **Responsibilities.** Apply D1 Unit 07 in full: primary ranking by
  Canonical Decision Hierarchy tier (D1-PR-01); recommendation impact
  tiers nested within Hierarchy tiers 1-2/9 (D1-PR-02); biggest-problem-
  first (D1-PR-03); budget enforcement (D1-PR-04); tie-break order
  (D1-PR-06).
- **Forbidden Actions.** SHALL NOT rank a lower-Hierarchy-tier Candidate
  above a higher-tier one regardless of apparent benefit (D1-AH-01).
  SHALL NOT let Product Engagement (Hierarchy tier 10) influence ranking
  (D1-AH-03).
- **Dependencies.** Candidate Generation (all Opportunities' output,
  this cycle); Safety Layer; Decision Engine (orchestration authority).
- **Entry Criteria.** One or more Candidates exist for this cycle.
- **Exit Criteria.** A fully ordered ranking is produced and passed to
  Winner Selection.
- **Cross References.** D1 Units 02, 07.

## Stage 8 — Winner Selection

- **Purpose.** Select exactly one winning Candidate — or, under the
  narrow permitted exception, the full permitted set of tied Candidates
  — from the ranking produced by Prioritization. Either way, Decision
  Formation assembles exactly one Terminal Decision from this Stage's
  output (Canonical Decision 7).
- **Inputs.** The ordered Candidate ranking.
- **Outputs.** A single winning Candidate; or, only under the narrow
  exception where ranking genuinely cannot produce one clear winner, the
  full permitted set of tied Candidates, which Decision Formation
  assembles into one Terminal Decision carrying multiple user-selectable
  options (Canonical Decision 7).
- **Responsibilities.** Apply the single-winner default (D1-PR-05);
  apply the narrow menu exception only where ranking genuinely cannot
  produce one clear winner (Constitution Ch.11 §11.15); apply Safety
  Layer disqualification of any Candidate conflicting with a D1 Unit 02
  absolute override, ahead of ranking position (D1-RP-07, D1-AH-02).
- **Forbidden Actions.** SHALL NOT select a menu of options as a matter
  of convenience when a single winner is in fact determinable
  (D1-PR-05).
- **Dependencies.** Prioritization; Safety Layer (final disqualification
  pass); Decision Engine (orchestration authority).
- **Entry Criteria.** A ranked Candidate set exists.
- **Exit Criteria.** A winning Candidate (or permitted tied set) is
  fixed and passed to Decision Formation. If every Candidate is
  disqualified by the Safety Layer, the cycle SHALL resolve to Silence
  or refusal at Decision Formation, as D1 Unit 14 requires.
- **Cross References.** D1 Unit 07 (D1-PR-05, D1-PR-06); Unit 08
  (Multiple Winners, D2-EF-05); Canonical Decision 7.

## Stage 9 — Decision Formation

- **Purpose.** Assemble the Decision Pass's single, fully-formed
  Canonical Decision (D1 Unit 15) — the Terminal Decision — before any
  language is generated. This Stage runs exactly once per Decision Pass
  in which it is entered (Canonical Decision 1) and always produces
  exactly one Terminal Decision, whether the input is a single winning
  Candidate, a tied set from the narrow multi-option exception, or a
  Decision-Pass-level Silence determination (Canonical Decision 7).
- **Inputs.** The winning Candidate from Winner Selection; or, under the
  narrow multi-option exception, the full permitted tied set of
  Candidates (Unit 08, D2-EF-05); or, where zero Opportunities produced a
  surviving Candidate, a Silence determination for the Decision Pass as
  a whole; Pipeline Context. A per-Opportunity internal termination or
  Silence outcome (Stages 4-6) is not itself an input that independently
  invokes this Stage.
- **Outputs.** A single Terminal Decision carrying: its kind
  (Recommendation/Initiative/Silence/refusal), its rationale, its
  confidence (D1 Unit 11), its Canonical Decision Hierarchy position (D1
  Units 02, 07), and, where formed from a tied set, multiple
  user-selectable options within that one Terminal Decision (Canonical
  Decision 7) — never multiple Terminal Decisions.
- **Responsibilities.** Assemble every element the Canonical Decision
  requires (D1 Unit 15), including, where the input is a tied Candidate
  set, assembling their content into the single Terminal Decision's
  multiple user-selectable options (Canonical Decision 7); apply the
  final, independent Safety Layer evaluation with authority to modify,
  defer, or block (D1-AB-05), executed before Expression; where
  modified, deferred, or blocked, reform the Terminal Decision as a
  refusal/escalation (D1 Unit 14) instead of its original kind.
- **Forbidden Actions.** SHALL NOT pass an incompletely-formed decision
  to Expression (D1-CDO-03). SHALL NOT permit any part of the system to
  bypass the safety evaluation (D1-AB-05). SHALL NOT independently form
  a separate Terminal Decision for an individual Opportunity's internal
  termination or Silence outcome (Canonical Decision 1). SHALL NOT form
  more than one Terminal Decision from a tied Candidate set — the
  narrow multi-option exception SHALL always be assembled into exactly
  one Terminal Decision, never several (Canonical Decision 7).
- **Dependencies.** Winner Selection; Safety Layer; Decision Engine
  (orchestration authority).
- **Entry Criteria.** One or more Opportunities were detected this cycle
  (Stage 3); Winner Selection has concluded if the shared pool contained
  any Candidate this cycle (Stage 8).
- **Exit Criteria.** A fully-formed Terminal Decision exists and is
  passed to Expression.
- **Cross References.** D1 Unit 15 (all D1-CDO-* rules); D1 Unit 14
  (D1-AB-05); Unit 06 (Decision Lifecycle).

## Stage 10 — Expression

- **Purpose.** Translate the already-formed Terminal Decision into
  language, tone, and timing appropriate to the user, without altering
  what was decided.
- **Inputs.** The Terminal Decision; the Expression Rendering Context —
  a second, narrow, closed, Memory-Layer-produced input, added by
  Amendment 1 (Canonical Decision 8; D3 Decision 7, extending D3
  Decision 3) to supply Expression the non-decision, tone/framing-only
  signals D1-PER-01–06 requires that TerminalDecision itself SHALL NOT
  carry (D1-CDO-03). Its current, closed content is exactly
  {schemaVersion, relationshipMaturityStage}; it SHALL NOT carry
  decision content, rationale, ranking/priority information, Safety
  decision authority (including reasonCode/reasonDetail), platform/UI/
  surface information, the full Pipeline Context, or any unrelated user
  state. Future fields may be added only when a specific,
  already-approved Expression requirement needs a further tone/framing-
  only signal TerminalDecision cannot carry — never speculatively.
- **Outputs.** The user-facing message, for Recommendation/Initiative/
  refusal kinds; no user-facing output for a Silence kind.
- **Responsibilities.** Render the Terminal Decision's content,
  rationale, and confidence into language (Coach Bible Ch.4); calibrate
  delivery firmness to the confidence already established at Decision
  Formation (D1-ER-05); apply D1 Unit 13 personalization to tone and
  framing only, never to content already fixed, using the Terminal
  Decision together with the Expression Rendering Context's
  relationshipMaturityStage value (D1-PER-03) — including its UNKNOWN
  value, which SHALL be treated at least as conservatively as
  Observer-stage scope, by direct analogy to the Initiative Engine's own
  already-accepted treatment of the identical value
  (TASK_005_SPEC_v1.0.md §17.7, item E-2).
- **Forbidden Actions.** SHALL NOT originate the underlying decision,
  its priority, or its rationale (D1-CDO-03) — this is the binding
  boundary between Decision Formation and Expression. SHALL NOT soften,
  escalate, or otherwise alter the decision's substance while phrasing
  it (Coach Bible Ch.2 §4.3). SHALL NOT deliver a Terminal Decision
  computed from a Pipeline Context superseded by a Pre-Expression User
  Correction (Unit 08, D2-EF-07; Canonical Decision 4). SHALL NOT
  originate, compute, or infer the Expression Rendering Context itself,
  or read any Pipeline Context member beyond what that Context supplies
  (D2-PP-03; D2-INV-03).
- **Dependencies.** Decision Formation (Terminal Decision); Memory Layer
  (Expression Rendering Context, D3 Decision 3/7). Performed by a
  generative/LLM layer that is not itself one of the five Unit 07
  engines (D1 Unit 15).
- **Entry Criteria.** A Terminal Decision exists.
- **Exit Criteria.** For Recommendation/Initiative/refusal kinds not
  superseded by a Pre-Expression User Correction, a user-facing message
  has been produced. For a Silence kind, or for a Terminal Decision
  superseded by a Pre-Expression User Correction (Unit 08, D2-EF-07), no
  user-facing message is produced, and the cycle proceeds toward Memory
  Update with Feedback Processing as a no-op (Unit 08).
- **Cross References.** D1 Unit 15 (D1-CDO-03); D1 Unit 13
  (D1-PER-01–06); Coach Bible Ch.4; Unit 08 (D2-EF-07); Consolidated
  Canonical Decision Requirements, CDR-2.

## Stage 11 — Feedback Processing

- **Purpose.** Classify the user's response, if any, to an expressed
  Terminal Decision into the Feedback Type vocabulary (Shared
  Vocabulary; C2 §6).
- **Inputs.** The expressed Terminal Decision; the user's subsequent
  response, if any, within the applicable window.
- **Outputs.** A classified Feedback Type (Accepted, Completed,
  Dismissed, Rejected, Ignored, Expired, User Corrected, User Confirmed)
  — or no-op, if nothing was expressed (Silence kind).
- **Responsibilities.** Classify exactly one Feedback Type per response
  using the closed vocabulary; where no response occurs within the
  applicable window, classify as Ignored or Expired per the surface's
  own definition (C2 §6).
- **Forbidden Actions.** SHALL NOT infer a Feedback Type from anything
  other than an actual user response or its absence within the defined
  window. SHALL NOT correlate a response to a Terminal Decision more
  precisely than the grouped-context evidence model already accepted as
  sufficient (C3 §21, CD-C3-12).
- **Dependencies.** Expression; Memory Layer (orchestration authority).
- **Entry Criteria.** A Terminal Decision of Recommendation, Initiative,
  or refusal kind was expressed to the user.
- **Exit Criteria.** A Feedback Type is recorded (or the Stage is
  skipped as a no-op, for a Silence-kind Terminal Decision, or for a
  Terminal Decision that was not expressed because it was superseded by
  a Pre-Expression User Correction, Unit 08 D2-EF-07) and passed to
  Evidence Update.
- **Cross References.** Shared Vocabulary; C2 §6; C3 §21; Unit 08
  (D2-EF-07).

## Stage 12 — Evidence Update

- **Purpose.** Update confidence in the underlying belief, pattern, or
  strategy behind the Terminal Decision, using the classified Feedback
  Type produced this cycle.
- **Inputs.** The Feedback Type classified this cycle (or, for a
  Silence-kind Terminal Decision, or one superseded by a Pre-Expression
  User Correction (Unit 08, D2-EF-07), no new input — see
  Responsibilities); the Terminal Decision's originating belief/pattern.
- **Outputs.** An updated confidence/Evidence Hierarchy-tier state for
  the affected belief, or, for an evidence-based Silence, that belief
  left explicitly open; or, for a Terminal Decision superseded by a
  Pre-Expression User Correction, no confidence or evidence output at
  all — this Stage produces nothing that participates in Coaching
  History for it (Canonical Decision 6).
- **Responsibilities.** Apply no-single-event-state-change (D1-ER-02)
  and rejection-reduces-confidence (D1-ER-03); apply D1-RP-06 (a single
  decline is a question, not an answer; only a repeated pattern
  constitutes evidence about fit); for an evidence-based Silence, mark
  the underlying belief as open rather than closed, so that a future
  Pipeline cycle's own Evidence Evaluation and Evidence Update — fed by
  that future cycle's own Decision Inputs (Stage 1) — may resolve it
  (D1-SP-03); for a Terminal Decision superseded by a Pre-Expression
  User Correction, no belief update occurs — the correction itself is
  the new evidence, and it is carried forward as a Decision Input to the
  new Decision Pass (Unit 08, D2-EF-07), not processed here. This Stage
  acts only on this cycle's Feedback Type; it does not reach into,
  anticipate, or consume any future cycle's inputs.
- **Forbidden Actions.** SHALL NOT let a single feedback event
  independently change a confidence-driven decision (D1-ER-02). SHALL
  NOT discard a rejection instead of recording it (D1-ER-03). SHALL NOT
  consume or anticipate any input from a future Pipeline cycle (D2-PP-02
  applied forward). SHALL NOT let a Terminal Decision superseded by a
  Pre-Expression User Correction participate in confidence or evidence
  in any way — it SHALL NOT become Coaching History (Unit 08, D2-EF-07;
  Canonical Decision 6).
- **Dependencies.** Feedback Processing; Memory Layer (orchestration
  authority).
- **Entry Criteria.** A Feedback Type is available; or an evidence-based
  Silence is awaiting resolution; or a Terminal Decision was not
  expressed because it was superseded by a Pre-Expression User
  Correction (Unit 08, D2-EF-07).
- **Exit Criteria.** Confidence state is updated (or left unchanged, for
  a Terminal Decision superseded by a Pre-Expression User Correction)
  and passed to Memory Update.
- **Cross References.** D1 Unit 11; Unit 08 (D2-EF-07).

## Stage 13 — Memory Update

- **Purpose.** Persist the resulting belief/history change, subject to
  the D1 Unit 12 authority rules — for a Terminal Decision that reached
  Expression normally. A Terminal Decision superseded by a Pre-Expression
  User Correction SHALL NOT become Coaching History through this Stage
  (Unit 08, D2-EF-07; Canonical Decision 6).
- **Inputs.** Updated confidence/Evidence state; the Terminal Decision
  itself, for history retention.
- **Outputs.** A memory write, at the appropriate authority tier; or no
  write, where applying D1 Unit 12 determines that no memory change is
  warranted (D1-MU-05); or, for a Terminal Decision superseded by a
  Pre-Expression User Correction, no Coaching History write of any kind
  — at most an internal orchestration trace (Unit 09), never a D1 Unit
  12 Coaching Memory write (Canonical Decision 6).
- **Responsibilities.** For a Terminal Decision that reached Expression:
  determine, per D1 Unit 12, whether any memory change is warranted at
  all; where it is, retain the Terminal Decision and its Feedback Type
  as recommendation/decision history (D1-MU-03), write AI-authored or
  inferred content as a non-authoritative candidate only (D1-MU-01,
  consistent with the candidate-status write discipline already
  established at the policy level by C4), update belief-tier storage
  consistent with D1 Unit 04's categories (D1-MU-02), and apply
  forgetting-well periodic release (D1-MU-06); where it is not (D1-MU-05
  — no memory retained that carries no coaching value), make no write.
  For a Terminal Decision superseded by a Pre-Expression User Correction:
  make no Coaching History write of any kind — it SHALL NOT participate
  in intervention history, recommendation history, suppression,
  confidence, relationship learning, evidence, acceptance metrics, or
  rejection metrics; it MAY be retained only as an internal orchestration
  trace, within Unit 09's traceability mechanism, never inside D1 Unit
  12's Coaching Memory (Canonical Decision 6).
- **Forbidden Actions.** SHALL NOT write inferred or AI-generated
  content as authoritative without explicit user confirmation
  (D1-MU-01). SHALL NOT bypass the approved Habit/Pattern consumption
  path (D1-MU-07). SHALL NOT retain memory that carries no coaching
  value merely to demonstrate memory (D1-MU-05). SHALL NOT write a
  Terminal Decision superseded by a Pre-Expression User Correction into
  recommendation/decision history, suppression state, confidence,
  relationship-maturity learning, evidence, or acceptance/rejection
  metrics, under any circumstance (Unit 08, D2-EF-07; Canonical Decision
  6).
- **Dependencies.** Evidence Update; Memory Layer (orchestration
  authority).
- **Entry Criteria.** Evidence state has been updated.
- **Exit Criteria.** The write is persisted; or, for a candidate-only
  write, remains pending user confirmation; or no write occurs, where
  D1 Unit 12 determines none is warranted (D1-MU-05); or, for a Terminal
  Decision superseded by a Pre-Expression User Correction, no Coaching
  History write occurs — the cycle proceeds having produced, at most, an
  internal orchestration trace (Canonical Decision 6); this Opportunity's
  processing within the cycle is complete.
- **Cross References.** D1 Unit 12; C4 (policy-level candidate-status
  discipline only — no engineering detail is imported into D2); Unit 08
  (D2-EF-07); Unit 09 (orchestration trace).

------------------------------------------------------------------------

# Unit 05 --- Pipeline Invariants

## Purpose

Fixes properties that SHALL hold across every Pipeline cycle regardless
of which specific Stage path a given cycle takes.

## Invariants

- **Determinism**
- **Fixed order / no reordering**
- **Stage isolation**
- **No hidden decisions**
- **Silence is fully formed**
- **Safety is non-bypassable**
- **Policy separation**
- **Repeatable trace**

## SHALL Rules

- **D2-INV-01 (Determinism).** Given identical Pipeline Context, two
  independently-built D2-conformant Pipelines SHALL traverse the same
  Stage path and reach a Terminal Decision of the same kind, in the same
  Canonical Decision Hierarchy position (D1 Unit 01 Acceptance
  Criteria; Unit 00 above).
- **D2-INV-02 (Fixed order / no reordering).** The Stage order fixed in
  Unit 03 SHALL hold across every cycle without exception, including
  every exceptional flow in Unit 08: a short-circuit SHALL skip
  specifically named Stages; it SHALL NOT reorder the Stages that remain
  (D2-PP-01).
- **D2-INV-03 (Stage isolation).** No Stage SHALL perform another
  Stage's Responsibilities as fixed in Unit 04, even where doing so
  would be more convenient for a given implementation (D2-PP-03;
  D1-DI-01, applied at the Stage level).
- **D2-INV-04 (No hidden decisions).** Every element the Canonical
  Decision requires — kind, rationale, confidence, Hierarchy position
  (D1 Unit 15) — SHALL be attributable to a specific Stage's output; no
  Terminal Decision content SHALL originate inside Expression
  (D1-CDO-03) or any other Stage not authorized to originate it.
- **D2-INV-05 (Silence is fully formed).** Where no Opportunity detected
  this cycle produces a surviving Candidate, Decision Formation SHALL
  still run, once, to produce a fully-formed Silence Terminal Decision
  for the Decision Pass; the Decision Pass SHALL NOT simply stop without
  one, except the "No Opportunity" case (Unit 08), where no Opportunity
  existed to decide about in the first place (D1-CDO-01, D1-SP-01). An
  individual Opportunity's own internal termination or Silence outcome
  (Stages 4-6) does not, by itself, satisfy or bypass this requirement
  (Canonical Decision 1).
- **D2-INV-06 (Safety is non-bypassable whenever its Stage executes).**
  Each of the Safety Layer's three distinct functions (Unit 07) is
  mandatory whenever the Stage it attaches to actually executes:
  mandatory Opportunity injection whenever Opportunity Detection runs —
  every cycle, without exception (Unit 04, Stage 3); Candidate
  disqualification whenever Winner Selection runs (Unit 04, Stage 8);
  and final modify/defer/block authority whenever Decision Formation
  runs (Unit 04, Stage 9). No Stage or engine SHALL provide a path that
  skips a Safety Layer function for a Stage that does execute (D1-AB-05).
  This invariant does NOT require a Safety Layer function to fire for a
  Stage that canonical short-circuit behavior intentionally bypasses.
  Two cases illustrate this: where no Opportunity produces a surviving
  Candidate (Unit 04, Stage 7, Entry Criteria), Winner Selection does
  not run and so has no Candidate to disqualify — but the Safety
  Layer's final review at Decision Formation still applies, since
  Decision Formation itself still runs (D2-INV-05). In the "No
  Opportunity" case (Unit 08, D2-EF-02), Opportunity Detection still
  runs and the mandatory-injection function is still evaluated as part
  of it, but Winner Selection and Decision Formation do not execute at
  all, so their Safety Layer functions do not fire that cycle.
- **D2-INV-07 (Policy separation).** No Stage or engine covered by this
  specification SHALL introduce a coaching, recommendation, priority,
  evidence, memory, personalization, or safety policy not already fixed
  by D1 or an earlier canonical document; a Stage's Responsibilities are
  limited to applying such policy at the correct point in the sequence
  (Governing Principle; Scope, above).
- **D2-INV-08 (Repeatable trace).** Every Terminal Decision SHALL be
  logically attributable, at the canonical orchestration level, to the
  specific sequence of Stage outputs that produced it — an attribution
  requirement, not an audit-log or persistence mandate — bounded by the
  grouped-context correlation limits already accepted in C3 (§21,
  CD-C3-12) — see Unit 09.

## Acceptance Criteria

See Unit 10 (consolidated).

## Cross References

D1 Units 01, 02, 15; C3 §21; Unit 02; Unit 08.

------------------------------------------------------------------------

# Unit 06 --- Decision Lifecycle

``` text
Opportunity
↓
Candidate
↓
Ranked
↓
Winner
↓
Decision
↓
Delivered
↓
Feedback
↓
Evidence
↓
Memory
```

Eligibility Evaluation (Stage 5) is a Pipeline Gate that Candidate
Generation (Stage 6) depends on; it is not itself a state in this
lifecycle (Canonical Decision 2).

This lifecycle names four distinct kinds of thing, not interchangeably.
An **Opportunity** (Shared Vocabulary; D1 Unit 05) is the situation-level
entity Opportunity Detection identifies. A **Candidate** (Shared
Vocabulary) is a decision object Candidate Generation derives from an
eligible Opportunity — zero, one, or many Candidates MAY be generated
per Opportunity (Unit 04, Stage 6); a Candidate is not an Opportunity
and does not replace it. **Winner** is a status Winner Selection (Stage
8) assigns to exactly one Candidate from the shared pool — or, under the
narrow multi-option exception, to every Candidate in the permitted tied
set (Unit 08, D2-EF-05) — never a separate entity of its own; a
Candidate either does or does not carry this status. The **Terminal
Decision** (Shared Vocabulary) is the single, distinct object Decision
Formation (Stage 9) always produces: from the Winner Candidate; or, under
the multi-option exception, from every Candidate in the tied set,
assembled together into that one Terminal Decision as multiple
user-selectable options (Canonical Decision 7); or, absent a Winner,
from a Decision-Pass-level Silence determination (Canonical Decision 1).
Its kind, rationale, and content are assembled at Decision Formation and
MAY differ from the Winner Candidate's (or Candidates') own content
where the Safety Layer's final review modifies, defers, or blocks it
(Unit 07, function (c)). A Winner Candidate is therefore not itself a
Terminal Decision — it is the input Decision Formation ordinarily forms
one from; multiple tied Winner Candidates are likewise never multiple
Terminal Decisions — Decision Formation always forms exactly one.

## Lifecycle Rules

Each lifecycle state is produced by exactly one Stage of Unit 03:

- **Opportunity** — produced by Opportunity Detection (Stage 3).
- **Candidate** — produced by Candidate Generation (Stage 6), for an
  Opportunity that has already passed the Eligibility Evaluation gate
  (Stage 5).
- **Ranked** — assigned by Prioritization (Stage 7).
- **Winner** — assigned by Winner Selection (Stage 8).
- **Decision** — assigned by Decision Formation (Stage 9); this state
  marks the point at which the Terminal Decision object exists.
- **Delivered** — assigned by Expression (Stage 10), for
  Recommendation/Initiative/refusal kinds only.
- **Feedback** — assigned by Feedback Processing (Stage 11); a no-op for
  undelivered decisions.
- **Evidence** — assigned by Evidence Update (Stage 12).
- **Memory** — assigned by Memory Update (Stage 13).

## SHALL Rules

- **D2-DL-01.** A Candidate SHALL NOT exist unless the underlying
  Opportunity has already cleared the Eligibility Evaluation gate (Stage
  5; Unit 04) — a Pipeline Gate, not a Decision Lifecycle state
  (Canonical Decision 2) — either through ordinary Eligibility Evaluation
  or through the Safety Layer's unconditional bypass admission for a
  safety/high-risk-triggered Opportunity (Unit 07, function (a); Unit
  08, D2-EF-01(a); Canonical Decision 5).
- **D2-DL-02.** A Silence Terminal Decision's lifecycle path depends on
  how far its Decision Pass progressed before resolving to Silence.
  Where no Opportunity this cycle produced a surviving Candidate (Unit
  02, D2-PP-06), it never reaches Candidate, Ranked, or Winner —
  proceeding directly from Opportunity to Decision. Where one or more
  Candidates existed but none was selected — for example, every
  Candidate was disqualified by the Safety Layer (Unit 04, Stage 8 Exit
  Criteria) — it reaches Candidate and Ranked but not Winner. In every
  case, it SHALL skip Delivered, since no user-facing expression occurs,
  and Feedback, since Feedback Processing is a no-op with nothing to
  respond to (Unit 04, Stages 10-11); it SHALL always continue through
  Decision, Evidence, and Memory exactly as Stages 9, 12, and 13 define
  (D1-SP-03, D1-MU-03). Its lifecycle therefore always ends at Memory —
  the same terminal state reached by every other Terminal Decision.
- **D2-DL-03.** A Terminal Decision's lifecycle state SHALL always be
  exactly one of the nine named states at any point after Opportunity
  Detection has produced an Opportunity; a cycle with no detected
  Opportunity never enters this lifecycle at all (Unit 08, No
  Opportunity).
- **D2-DL-04.** A Terminal Decision superseded by a Pre-Expression User
  Correction (Unit 08, D2-EF-07; Canonical Decision 4) reaches Candidate,
  Ranked, Winner, and Decision normally — it had a Winner, and it is not
  Silence — but, like a Silence Terminal Decision, it SHALL skip
  Delivered and Feedback for the same structural reason: Expression
  SHALL NOT deliver it (Unit 04, Stage 10), so there is no expressed
  decision for Feedback Processing to respond to. It SHALL still reach
  the Evidence and Memory lifecycle states — Stages 12-13 still execute
  for it, marking its lifecycle complete — but, unlike an ordinary
  Terminal Decision, neither Stage performs its ordinary Coaching History
  participation for it: no confidence or evidence update, no
  recommendation/decision history, suppression, relationship learning, or
  acceptance/rejection metrics (Canonical Decision 6). At most an
  internal orchestration trace (Unit 09) is retained. Its lifecycle still
  ends at Memory, structurally, but that Memory state carries no
  Coaching History content. This is distinct from D2-DL-02: its kind
  remains Recommendation, Initiative, or refusal — it was never Silence —
  it was simply never delivered, and never entered Coaching History.

## Acceptance Criteria

For any Terminal Decision, its current lifecycle state SHALL be
derivable solely from which Stage most recently produced output for it.

## Cross References

Unit 03; Unit 04.

------------------------------------------------------------------------

# Unit 07 --- Engine Responsibilities

The following fixes, for each of the five engines covered by this
specification, its Responsibilities, Inputs, Outputs, Forbidden
Responsibilities, and Dependencies. This Unit defines **logical
orchestration responsibilities** only — which engine is assigned
orchestration authority for which Stage — not implementation ownership,
module boundaries, or deployment structure; those are engineering
implementation matters outside D2's Scope, above.

## Recommendation Engine

- **Responsibilities.** Participates in Opportunity Detection (Stage 3)
  for Decision-Window-based opportunities (D1 Unit 05); holds
  orchestration authority for Candidate Generation (Stage 6) for
  Recommendation-kind Candidates, applying D1 Unit 08 in full.
- **Inputs.** Pipeline Context; eligible Opportunities.
- **Outputs.** Recommendation-kind Candidates, each with rationale,
  confidence, and Canonical Decision Hierarchy tier.
- **Forbidden Responsibilities.** SHALL NOT perform Prioritization,
  Winner Selection, or Decision Formation (Unit 02 separation
  principle; D1-CDO-03, applied by extension one Stage upstream). SHALL
  NOT bypass the Safety Layer's disqualification authority (D1-AB-05).
- **Dependencies.** Decision Engine (downstream orchestration
  authority); Safety Layer; Memory Layer (Context Assembly, Evidence
  Update).

## Initiative Engine

- **Responsibilities.** Participates in Opportunity Detection (Stage 3),
  specifically confirmed-pattern anticipation and disruption/milestone
  detection (D1 Unit 05); holds orchestration authority for Candidate
  Generation (Stage 6) for Initiative-kind Candidates, applying D1 Unit
  09 in full, including Relationship-Maturity gating (D1-IP-02).
- **Inputs.** Pipeline Context; eligible Opportunities.
- **Outputs.** Initiative-kind Candidates.
- **Forbidden Responsibilities.** SHALL NOT perform Prioritization,
  Winner Selection, or Decision Formation. SHALL NOT initiate contact
  for engagement or retention purposes (D1-IP-04). SHALL NOT respond to
  an ignored Initiative with more Initiative (D1-IP-08).
- **Dependencies.** Decision Engine; Safety Layer; Memory Layer.

## Decision Engine

- **Responsibilities.** Holds orchestration authority for Eligibility
  Evaluation (Stage 5), Prioritization (Stage 7), Winner Selection
  (Stage 8), and Decision Formation (Stage 9), coordinating across all
  Candidates from all engines in a given cycle, applying D1 Units 02,
  06, 07, and 15.
- **Inputs.** Opportunities (for Eligibility Evaluation); the full
  Candidate set (for Prioritization/Winner Selection); the winning
  Candidate, or, under the narrow multi-option exception, the tied set
  (D2-EF-05), or, absent either, a Decision-Pass-level Silence
  determination (for Decision Formation, Canonical Decisions 1, 7).
- **Outputs.** Eligibility determinations; a ranked Candidate set; a
  winning Candidate or tied set; exactly one Terminal Decision — never
  more than one, even from a tied set (Canonical Decision 7).
- **Forbidden Responsibilities.** SHALL NOT generate Candidate content
  itself — reserved, within this specification's orchestration model,
  to the Recommendation Engine and Initiative Engine. SHALL NOT override
  the Safety Layer's disqualification or block/defer authority
  (D1-AB-05). SHALL NOT let Product Engagement influence any ranking it
  performs (D1-AH-03).
- **Dependencies.** Recommendation Engine; Initiative Engine; Safety
  Layer.

## Safety Layer

The Safety Layer's orchestration authority is exercised through three
distinct functions, none of which expands its authority beyond D1 Units
02 and 14, and none of which retroactively reopens or bypasses a Stage
other than the one it names:

- **Responsibilities.**
  (a) *Safety-triggered Opportunity creation* — at Opportunity Detection,
  injects a safety/high-risk-triggered Opportunity unconditionally
  (D1-OD-04, D1-IE-05), which then bypasses only the ordinary Evidence
  Evaluation and Eligibility Evaluation gating for that specific
  Opportunity (Unit 08, D2-EF-01). It then continues through the same
  single canonical pipeline as any other eligible Opportunity — Candidate
  Generation, Prioritization, Winner Selection, and Decision Formation
  (Unit 03) — unmodified and unshortened; no separate Safety pipeline
  exists (Canonical Decision 5).
  (b) *Safety disqualification* — at Winner Selection, disqualifies any
  Candidate conflicting with a D1 Unit 02 absolute override (D1-RP-07),
  without affecting any other Opportunity's or Candidate's path through
  the ordinary gates.
  (c) *Final safety review* — at Decision Formation, performs a final,
  independent, non-bypassable evaluation with authority to modify,
  defer, or block the Terminal Decision (D1-AB-05).
- **Inputs.** Health/Safety Profile and Life Event Context (Decision
  Input categories); every Candidate reaching Winner Selection; every
  Terminal Decision reaching Decision Formation.
- **Outputs.** Mandatory Opportunities; disqualification determinations;
  modify/defer/block determinations.
- **Forbidden Responsibilities.** SHALL NOT be bypassed by any other
  engine or Stage, under any circumstance, at any of the three
  checkpoints above (D1-AB-05). SHALL NOT itself originate ordinary
  (non-safety) Recommendation or Initiative content — its authority is
  limited to the three functions above, per D1 Units 02 and 14.
- **Dependencies.** None upstream — an independent authority. Every
  other engine is subordinate to it at the three checkpoints named
  above, and only at those checkpoints.

## Memory Layer

- **Responsibilities.** Holds orchestration authority for Context
  Assembly's read of stored belief/User State (Stage 2; D1 Units 04,
  12), and for Feedback Processing (Stage 11), Evidence Update (Stage
  12), and Memory Update (Stage 13), applying D1 Units 11 and 12 in
  full; writes AI-authored or inferred content as a non-authoritative
  candidate only (D1-MU-01), consistent with the candidate-status write
  discipline established at the policy level by C4; makes no write at
  all where D1 Unit 12 determines none is warranted (D1-MU-05).
- **Inputs.** Pipeline Context requests (read); Feedback Type; updated
  confidence state; the Terminal Decision, for history retention.
- **Outputs.** Assembled Pipeline Context contributions; classified
  Feedback Type; updated Evidence Hierarchy state; a memory write,
  candidate-pending write, or no write (Unit 04, Stage 13).
- **Forbidden Responsibilities.** SHALL NOT treat inferred or AI-
  generated content as authoritative without explicit user confirmation
  (D1-MU-01). SHALL NOT bypass the approved Habit/Pattern consumption
  path (D1-MU-07). SHALL NOT participate in Prioritization, Winner
  Selection, or Decision Formation.
- **Dependencies.** Every other engine, as the shared read/write
  boundary for Context Assembly, Feedback Processing, Evidence Update,
  and Memory Update.

------------------------------------------------------------------------

# Unit 08 --- Exceptional Flows

- **D2-EF-01 (Safety Override).** The Safety Layer's three distinct
  functions (Unit 07) apply differently at each checkpoint: (a) at
  Opportunity Detection, a safety/high-risk trigger SHALL cause that
  Opportunity to be admitted unconditionally, bypassing only the
  ordinary Evidence Evaluation and Eligibility Evaluation gating for
  that Opportunity specifically (D1-OD-04, D1-IE-05), and Silence SHALL
  NOT be selected in its place (D1-SP-06). The Opportunity SHALL then
  continue through the same single canonical pipeline as any other
  eligible Opportunity — Candidate Generation, Prioritization, Winner
  Selection, and Decision Formation — in the fixed order Unit 03 fixes;
  no separate Safety pipeline exists, and no further Stage is bypassed,
  reordered, or shortened on account of the safety trigger (Canonical
  Decision 5). (b) at Winner Selection, safety disqualification of a
  conflicting Candidate does not bypass or reopen Evidence Evaluation or
  Eligibility Evaluation for any Opportunity — those gates have already
  run; (c) at Decision Formation, the final safety review's
  modify/defer/block authority likewise does not retroactively bypass
  any earlier Stage. None of the three functions expands Safety Layer
  authority beyond D1 Units 02 and 14.
- **D2-EF-02 (No Opportunity).** If Opportunity Detection produces zero
  Opportunities, the Decision Pass branch of that cycle SHALL end at
  Opportunity Detection: Evidence Evaluation through Memory Update SHALL
  NOT be invoked, and no Terminal Decision SHALL be produced. This ends
  only the Decision-producing branch of the cycle; it does not prohibit,
  and this specification does not otherwise govern, any other canonical
  observation, logging, or maintenance behavior that may occur
  independently of Decision Formation (Scope, above). This is also
  distinct from Silence, which requires an Opportunity to have been
  detected and deliberately reasoned about (Shared Vocabulary: Silence
  is "a deliberate decision").
- **D2-EF-03 (No Evidence).** An Evidence Evaluation failure SHALL cause
  that Opportunity to terminate internally (D1-SP-02) — an internal
  orchestration outcome, not an independent Terminal Decision, and not
  an independent invocation of Decision Formation (Canonical Decision
  1). It does not proceed to Eligibility Evaluation, and does not affect
  any other Opportunity's processing this cycle. The underlying belief
  SHALL remain open rather than closed (Unit 04, Stage 12); it is
  reassessed by a subsequent Pipeline cycle's own Evidence Evaluation
  and Evidence Update, once that cycle's own Decision Inputs arrive —
  Evidence Update does not itself reach into, or act during, a future
  cycle (D1-SP-03). Where no Opportunity this cycle produces a surviving
  Candidate, the Decision Pass as a whole resolves to a single Silence
  Terminal Decision at Decision Formation (Unit 02, D2-PP-06; Unit 05,
  D2-INV-05).
- **D2-EF-04 (No Eligible Candidate).** If Candidate Generation produces
  zero Candidates for an eligible Opportunity, that Opportunity resolves
  to Silence internally (D1-RP-02, D1-CDO-02) — an internal orchestration
  outcome, not an independent Terminal Decision, and not an independent
  invocation of Decision Formation (Canonical Decision 1). This does not
  affect Prioritization or Winner Selection for any other Opportunity's
  Candidates in the same cycle's shared pool (Unit 02, D2-PP-06). Where
  no Opportunity this cycle produces a surviving Candidate, the Decision
  Pass as a whole resolves to a single Silence Terminal Decision at
  Decision Formation (Unit 05, D2-INV-05).
- **D2-EF-05 (Multiple Winners — Canonical Decision 7).** Where Winner
  Selection cannot produce a single winner under the narrow exception of
  D1-PR-05 (Constitution Ch.11 §11.15), the Pipeline SHALL carry the full
  permitted set of tied Candidates forward from Winner Selection.
  Decision Formation SHALL process that set as a single pass, producing
  exactly one Terminal Decision that MAY contain multiple
  user-selectable options — never multiple passes and never multiple
  Terminal Decisions sharing a single Expression event. Pipeline,
  Lifecycle, Feedback, Memory, and Traceability all continue to treat
  this Terminal Decision as a single Terminal Decision, exactly as any
  other (Units 03, 04, 06, 09).
- **D2-EF-06 (Pipeline Abort).** Where a Stage cannot execute at all —
  not a reasoned coaching outcome, but an inability to proceed — this
  specification requires only that no Terminal Decision SHALL be
  fabricated in its place (D1-DI-02). D2 does not equate this with the
  "No Opportunity" case (D2-EF-02) and does not prescribe how such a
  failure is detected, retried, logged, or otherwise handled
  operationally; failure-handling policy is engineering implementation,
  outside this specification's Scope, above.
- **D2-EF-07 (User Correction — Canonical Decision 4).** An explicit user
  correction is treated differently depending on when it arrives,
  relative to Expression (Stage 10).

  **Pre-Expression correction** — received before Expression of the
  active Decision Pass — SHALL NOT mutate that Decision Pass. Pipeline
  Context remains immutable for the full lifetime of a Decision Pass
  (D2-PP-02); a Pre-Expression Correction does not reopen, reassemble,
  or otherwise mutate it, and SHALL NOT invalidate, in place, a Candidate
  already produced, ranked, or selected as Winner within that Decision
  Pass. Instead:
  - the Terminal Decision the active Decision Pass computes from its
    (now superseded) Pipeline Context SHALL NOT be expressed to the
    user — Expression SHALL NOT deliver it (Unit 04, Stage 10; Unit 06,
    D2-DL-04);
  - the User Correction SHALL be treated as a new, highest-tier
    (Explicit User Statement, D1 Unit 11 tier 1) Decision Input — not as
    Feedback: Feedback Processing (Stage 11) classifies responses to an
    already-expressed Terminal Decision only, and a Pre-Expression
    Correction has no expressed decision to respond to;
  - evaluation of the correction SHALL occur only through a newly
    assembled Pipeline Context, in a new Decision Pass beginning at
    Receive Inputs (Stage 1) — never by reopening or amending the
    superseded Decision Pass.

  **Coaching History exclusion (Canonical Decision 6).** A Terminal
  Decision superseded before Expression SHALL NOT become Coaching
  History. It SHALL NOT participate in: intervention history,
  recommendation history, suppression, confidence, relationship
  learning, evidence, acceptance metrics, or rejection metrics (Unit 04,
  Stages 12-13; Unit 06, D2-DL-04). It MAY be retained only as an
  internal orchestration trace, within Unit 09's traceability mechanism
  — never as a D1 Unit 12 Coaching Memory write.

  **Post-Expression correction** — received after Expression — is
  unaffected by this rule and continues to be classified by Feedback
  Processing as the User Corrected Feedback Type in the ordinary way
  (Shared Vocabulary; C2 §6); it participates in Coaching History
  normally, exactly as any other delivered Terminal Decision's feedback
  does.
- **D2-EF-08 (Missing Context).** The absence of a given Decision Input
  category at Context Assembly SHALL itself be treated as evidence
  (D1-DI-04) and SHALL NOT, by itself, force a Pipeline Abort; the cycle
  SHALL proceed using the categories that are available.
- **D2-EF-09 (Recovery Rules).** Following any exceptional flow above,
  the Pipeline SHALL resume ordinary Stage sequencing on its next cycle
  without special re-initialization. No Pipeline Context from an
  aborted or short-circuited cycle SHALL be carried into the next
  cycle's Context Assembly as if already confirmed; each cycle
  reassembles Context fresh from currently available Decision Inputs
  (D2-PP-02; D1-USM-02).

## Cross References

D1 Units 02, 05, 06, 08, 10, 11, 14; Constitution Ch.11 §11.15; Unit 04;
Unit 05; Unit 06 (D2-DL-04); Unit 09; Canonical Decisions 4, 5, 6, 7.

------------------------------------------------------------------------

# Unit 09 --- Pipeline Traceability

## Purpose

Fixes what SHALL be logically attributable, at the canonical
orchestration level, about how a Terminal Decision was produced. This is
an attribution requirement on the Pipeline's logical output, not a
mandate on audit logging, persistence, or storage — those are
engineering implementation matters outside D2's Scope, above.

## Traceability Requirements

Every Terminal Decision SHALL be logically attributable to exactly the
Stage outputs that actually occurred in producing it — never to a Stage
output that a canonical short-circuit or Safety Layer bypass (Unit 08)
caused not to occur. Where applicable to the path actually taken: the
Opportunity that produced the winning Candidate, or, for a Decision-
Pass-level Silence, every Opportunity considered and its internal
outcome (Canonical Decision 1); the Evidence Hierarchy tier relied on,
where Evidence Evaluation ran for that Opportunity; the Eligibility
determination, where Eligibility Evaluation ran for that Opportunity;
the Candidates that competed at Prioritization and why the winner (or,
under the narrow multi-option exception, the tied set assembled into
this one Terminal Decision, Canonical Decision 7) won, where
Prioritization/Winner Selection ran; any Safety Layer intervention —
including a safety-triggered bypass of Evidence Evaluation and/or
Eligibility Evaluation (Unit 08, D2-EF-01(a)), which is itself the
complete and sufficient trace for why those Stages' outputs are absent;
the Feedback Type it received, if any; and the resulting Evidence/Memory
update — or, for a Terminal Decision superseded by a Pre-Expression User
Correction, the internal orchestration trace permitted in place of a
Coaching History record (Unit 08, D2-EF-07; Canonical Decision 6). Each
element SHALL be derivable from the Stage that produced it, per its
Stage Contract (Unit 04) — not necessarily retained as a durable audit
record. Traceability for a Decision Pass is complete when every Stage
that actually executed is so attributed; it is never rendered incomplete
merely because a Stage the Pipeline correctly bypassed produced no
output to attribute.

## SHALL Rules

- **D2-TR-01.** Every Terminal Decision's kind, rationale, confidence,
  and Hierarchy position SHALL each be logically attributable to the
  specific Stage that produced it — the operational form of D1-CDO's
  requirement that a decision carry "where it sits in the Canonical
  Decision Hierarchy," applied at the orchestration level (D1 Unit 15).
- **D2-TR-02.** A Silence Terminal Decision SHALL be equally traceable
  as a Recommendation or Initiative decision (D1-CDO-01).
- **D2-TR-03.** Traceability from a Feedback Type back to the Terminal
  Decision it responds to SHALL NOT be required at finer granularity
  than the grouped-context correlation model already established as
  sufficient (C3 §21, CD-C3-12). D2 does not introduce, and SHALL NOT be
  read as requiring, per-instance correlation beyond that accepted
  limitation.
- **D2-TR-04.** Traceability is a canonical-orchestration-level
  attribution requirement on the Pipeline's logical output, not a
  mandate on audit logging, persistence, or how any given engine
  internally represents it — consistent with this specification's
  exclusion of engineering implementation (Scope, above).
- **D2-TR-05 (bypass paths remain fully traceable).** Where a Stage is
  bypassed by a canonical short-circuit or a Safety Layer function (Unit
  08, D2-EF-01(a)), traceability SHALL NOT require that Stage's output;
  the bypass itself, and the short-circuit rule or Safety Layer
  intervention that caused it, SHALL constitute the complete and
  sufficient trace for that Stage's absence. Traceability for a Decision
  Pass SHALL be considered complete once every Stage that actually
  executed is attributed (Unit 04); the absence of output from a Stage
  the Pipeline correctly bypassed SHALL NOT be treated as a traceability
  gap.
- **D2-TR-06 (multi-option Terminal Decisions trace as one).** Where the
  narrow multi-option exception applies (Unit 08, D2-EF-05), traceability
  SHALL attribute the full tied Candidate set and the Prioritization/
  Winner Selection reasoning to the single resulting Terminal Decision —
  never to multiple Terminal Decisions (Canonical Decision 7). A
  multi-option Terminal Decision's Feedback Type, Evidence Update, and
  Memory Update are likewise each attributed to that one Terminal
  Decision, exactly as for a single-option Terminal Decision.

## Acceptance Criteria

See Unit 10 (consolidated).

## Cross References

D1 Unit 15; C3 §21; Unit 08 (D2-EF-01).

------------------------------------------------------------------------

# Unit 10 --- Acceptance Criteria

The following consolidate the per-Unit acceptance criteria into
specification-level, testable requirements:

1. **Determinism.** Given identical Pipeline Context, two
   independently-built engines conforming to D2 SHALL traverse the same
   Stage path and reach a Terminal Decision of the same kind, in the
   same Canonical Decision Hierarchy position (D2-INV-01; D1 Unit 01).
2. **Traceability.** Every Terminal Decision, including Silence and a
   Terminal Decision superseded by a Pre-Expression User Correction,
   SHALL be logically attributable, at the canonical orchestration
   level, to the sequence of Stage outputs that actually occurred in
   producing it, bounded by the grouped-context correlation limits
   already accepted in C3 (Unit 09 in full). A Stage a canonical
   short-circuit or Safety Layer function correctly bypassed contributes
   no output to attribute and is not a traceability gap (D2-TR-05). This
   is an attribution requirement, not an audit-log or persistence
   mandate.
3. **Repeatability.** The same Pipeline Context, replayed, SHALL
   produce a Terminal Decision of the same kind, rationale, confidence,
   and Canonical Decision Hierarchy position, with the same Stage-by-
   stage attribution (Unit 09) — semantic determinism consistent with
   D1 Unit 01's own criterion, which measures agreement on kind and
   priority ranking, not byte-identical generated language or internal
   representation.
4. **Stage Isolation.** No Stage or engine SHALL perform a
   Responsibility fixed to a different Stage or engine (D2-INV-03;
   Unit 04; Unit 07's Forbidden Responsibilities).
5. **No Hidden Decisions.** Every element the Canonical Decision
   requires SHALL be attributable to a specific Stage's output; none
   SHALL originate in Expression or any other unauthorized Stage
   (D2-INV-04; D1-CDO-03).
6. **Policy Separation.** No Unit in this document introduces coaching,
   recommendation, priority, evidence, memory, personalization, or
   safety policy not already fixed by D1 or an earlier canonical source
   (D2-INV-07; Scope, above).

------------------------------------------------------------------------

# Unit 11 --- Reference Pipeline

The following scenarios are **non-binding and illustrative only**. Where
a scenario appears to conflict with a SHALL/SHALL NOT rule in Units
02-09, the rule governs (Coach Bible Ch.19 precedent, applied by D1 Unit
16 and carried forward here).

## Complete Reference Flow

**A confirmed evening decision-fatigue pattern.** Receive Inputs and
Context Assembly establish several consecutive weeks of a consistent
late-evening off-plan eating pattern (D1 Unit 04, Capacity state).
Opportunity Detection admits this as a standing opportunity via
confirmed-pattern anticipation (D1 Unit 05), contributed by the
Initiative Engine. Evidence Evaluation classifies the supporting
evidence as Repeated Behaviour (D1 Unit 11 tier 3) — sufficient.
Eligibility Evaluation confirms a valid reason (preparing for a
foreseeable challenge, D1-IE-01) and passes the Trust Test; the Decision
Engine marks the Opportunity eligible. Candidate Generation, under the
Initiative Engine's orchestration authority, produces one
Initiative-kind Candidate with a statable rationale, at Level 2 High
Impact. Prioritization ranks it accordingly (D1-PR-02); Winner Selection
confirms it as the single
winner (no competing Candidate this cycle); Decision Formation assembles
the Terminal Decision, passing the Safety Layer's evaluation
unmodified. Expression delivers it ahead of the evening decision window,
not after (D1-IP-05). Feedback Processing classifies the user's
response as Accepted. Evidence Update strengthens confidence in the
underlying pattern belief. Memory Update retains the decision and its
Feedback Type as history (D1-MU-03).

## Informative Examples

1. **Known allergy vs. a nutritionally optimal recommendation.**
   Candidate Generation produces a nutritionally optimal Candidate;
   the Safety Layer disqualifies it at Winner Selection because it
   conflicts with a D1 Unit 02 absolute override (the user's known
   allergy), regardless of the Candidate's ranking position (D1-RP-07).
2. **A single skipped workout, with no other signal.** Evidence
   Evaluation determines the single event does not meet the Evidence
   Hierarchy bar; this Opportunity terminates internally (D2-EF-03) — an
   internal orchestration outcome, not an independent Terminal Decision
   (Canonical Decision 1). With no other surviving Candidate this cycle,
   the Decision Pass resolves to a single Silence Terminal Decision at
   Decision Formation; the underlying belief remains open for a future
   cycle's own Evidence Evaluation rather than being closed (D1-SP-03).
3. **A low-coaching-value holiday period, with an otherwise-valid
   Candidate available.** Eligibility Evaluation applies D1-IE-04's
   reduced-frequency adjustment and determines the Opportunity
   ineligible; this Opportunity resolves to Silence internally at Stage
   5 (Canonical Decision 1), without Candidate Generation ever running
   for it. With no other surviving Candidate this cycle, the Decision
   Pass resolves to a single Silence Terminal Decision at Decision
   Formation.
4. **A safety/high-risk symptom is reported.** Opportunity Detection
   admits it unconditionally on first occurrence via Safety Layer
   injection (D2-EF-01(a)); only Evidence Evaluation and Eligibility
   Evaluation are bypassed. The Opportunity then proceeds through the
   same single canonical pipeline as any other eligible Opportunity —
   Candidate Generation produces a Candidate, Prioritization ranks it,
   Winner Selection confirms it — with no separate Safety pipeline
   (Canonical Decision 5). Decision Formation's final safety review
   (function (c)) then reforms it into an escalation-kind Terminal
   Decision per D1 Unit 14, which Expression delivers.
5. **A user sends an explicit correction while a Recommendation is
   already mid-Decision-Pass.** Winner Selection has already selected a
   winning Candidate and Decision Formation has assembled a Terminal
   Decision, but Expression has not yet run when the correction arrives.
   The active Decision Pass's Pipeline Context is not reopened or
   mutated (D2-PP-02); its Terminal Decision reaches Candidate, Ranked,
   Winner, and Decision, then skips Delivered and Feedback (Unit 06,
   D2-DL-04) — Expression withholds it (D2-EF-07). Evidence Update and
   Memory Update still execute for it, but perform no Coaching History
   participation — no confidence change, no recommendation history entry,
   no suppression or relationship-learning effect (Canonical Decision 6);
   at most an internal orchestration trace is retained. The correction
   itself becomes a new, Explicit-User-Statement-tier Decision Input for
   a new Decision Pass, beginning again at Receive Inputs.

## Non-Normative Notes

These scenarios illustrate how Units 03-09's Stage Contracts, Invariants,
and Exceptional Flows interact; they are not themselves a source of
normative rules, and they do not add to, narrow, or reinterpret any
SHALL/SHALL NOT rule fixed elsewhere in this document.

------------------------------------------------------------------------

# Consolidated Canonical Decision Requirements (CDR)

The following records every gap identified while deriving this
specification, including gaps since resolved by Product/AI Architecture
decision. No gap was ever resolved by invention.

## CDR-1 — Representation of the permitted multi-option exception (RESOLVED)

D1-PR-05's narrow exception (Constitution Ch.11 §11.15) permits
presenting multiple options when ranking genuinely cannot produce one
clear winner. This specification originally left open whether the
resulting set of tied Candidates constitutes one Terminal Decision
carrying multi-option content, or multiple independently-tracked
Terminal Decisions. **Resolved by Canonical Decision 7:** the permitted
multi-option exception SHALL always produce exactly one Terminal
Decision, which MAY contain multiple user-selectable options. Pipeline,
Lifecycle, Feedback, Memory, and Traceability all treat it as a single
Terminal Decision (Unit 04, Stage 8/9; Unit 06, Lifecycle Rules; Unit
08, D2-EF-05). No open question remains.

## CDR-2 — Signal for D1-PER-03 (Relationship Maturity Stage) reaching Expression (RESOLVED)

Surfaced during Expression's own implementation (Work Package 4,
`EXPRESSION_IMPLEMENTATION_PLAN.md`), not during this document's
original drafting: D1-PER-03 (D1 Unit 13) requires personalization
depth/directiveness to scale with Relationship Maturity Stage, but
Expression's originally-fixed single Input (the Terminal Decision alone)
carried no such signal, and TerminalDecision's own contract
(TASK_006_SPEC_v1.0.md §25) has no field for it. Investigation confirmed
this was a genuine Repository Gap (the signal already exists in Pipeline
Context, assembled by the Memory Layer, but had no canonical path to
Stage 10) whose resolution required an Architecture-level decision,
since neither TerminalDecision's contract nor a Stage's declared Input
list may be amended by Engineering unilaterally. **Resolved by Canonical
Decision 8 (D3 Decision 7, extending D3 Decision 3):** Expression
receives a second, narrow, closed, Memory-Layer-produced input — the
Expression Rendering Context, `{schemaVersion,
relationshipMaturityStage}` — documented in full at Unit 04, Stage 10,
above. TerminalDecision itself remains entirely unchanged. The
Relationship Maturity source itself (i.e., whether `relationshipMaturity
.stage` ever produces a value other than 'UNKNOWN') remains a separate,
already-tracked, non-blocking gap (`TASK_005_SPEC_v1.0.md`, Section 36
item E-2 / CD-T005-01) — not resolved or reopened by this decision.

## Inherited, Unresolved CDRs from D1

D2 inherits, and does not attempt to resolve, D1's own open Canonical
Decision Requirements. Nothing in this document's Stage Contracts,
Invariants, or Engine Responsibilities depends on their resolution:

- **D1 CDR-1** — the formal rank of the Intelligence & Relationship
  Philosophy document in the Source-of-Truth hierarchy.
- **D1 CDR-2** — the scope of the Coach Bible's self-declared supremacy
  relative to the Engineering Workflow's general document hierarchy.
- **D1 CDR-4** — numeric thresholds (pattern-window sizes, confidence
  cutoffs, suppression durations) remain categorical-rules-only in D1
  and, correspondingly, in every D2 Stage Contract that references them.

D1's CDR-3 (representation of the canonical decision) and CDR-5
(enablement of the future engines) are architecture/engineering-track
items outside D2's own Scope (Engineering implementation) and are not
restated here.
