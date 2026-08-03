# TASK_006_SPEC_SKELETON

## Coach Decision Engine

**Document Type:** Canonical Specification Skeleton  
**Target Deliverable:** `TASK_006_SPEC_v1.0.md`  
**Work Item:** TASK-006 — Coach Decision Engine  
**Prepared By:** Head of Product + AI Architect  
**Expansion Owner:** Claude Code acting only as Lead Engineer  
**Status:** Approved Skeleton for Canonical Expansion

---

# 1. Status

Define the specification version, lifecycle state, approval state, implementation state, and repository baseline used for review.

The completed specification must distinguish clearly between:

- Draft
- Canonical Review
- Engineering Review
- READY
- In Implementation
- Implemented
- DONE / CLOSED

Do not declare READY, APPROVED, implemented, DONE, or CLOSED without the evidence required by the Engineering Workflow and Specification Authoring Standard.

---

# 2. Purpose

Explain why TASK-006 exists and what product and system capability it introduces.

The completed section must establish that the Coach Decision Engine is the exclusive owner of:

- Stage 5 — Eligibility Evaluation orchestration
- Stage 7 — Prioritization
- Stage 8 — Winner Selection
- Stage 9 — Decision Formation
- production of exactly one Terminal Decision for each entered Decision Pass

It must also establish that the Decision Engine does not generate Candidate content, does not own Safety authority, does not perform Expression, does not select delivery platforms, and does not own durable memory writes.

---

# 3. Canonical Authority

Identify the governing canonical documents and the precedence rules applicable to TASK-006.

At minimum, inspect and cite the current repository versions of:

- `docs/product/Product_Bible.md.docx`
- `docs/constitution/FITME_AI_Constitution_v1.0.md`
- `docs/governance/FITME_Coach_Bible.md`
- `docs/governance/FITME_Coach_Knowledge_Base.md`
- `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md`
- `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md`
- `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md`
- `docs/architecture/FITME_ARCHITECTURE_v1.md`
- `docs/specs/D1_SPEC_v1.0.md`
- `docs/specs/D2_SPEC_v1.0.md`
- `docs/specs/D3_SPEC.md`
- `docs/specs/TASK_004_SPEC_v1.0.md`
- `docs/specs/TASK_005_SPEC_v1.0.md`
- `docs/roadmap/Roadmap.md`
- `docs/roadmap/Changelog.md`

Do not create a new authority hierarchy. Record any genuine contradiction using the classifications required by the Specification Authoring Standard.

---

# 4. Ownership and Decision Boundaries

Define which decisions belong to:

- Head of Product
- AI Architect
- Claude Code / Lead Engineer

The completed section must state that Claude may document repository facts, implementation constraints, technical options, and engineering risks, but may not invent or change Product policy, AI behavior, canonical architecture, authority boundaries, stage ownership, Decision kinds, prioritization rules, or task scope.

---

# 5. Relationship to Previous Work

Explain precisely how TASK-006 depends on and continues prior canonical work.

Cover at minimum:

- D1 — Intervention Eligibility, Prioritization, Recommendation Policy, Initiative Policy, Silence Policy, Evidence Requirements, Authority Boundaries, Canonical Decision Output
- D2 — Stages 5, 7, 8, and 9; Engine Responsibilities; Decision Lifecycle; Exceptional Flows; Traceability
- D3 — Composite Engine architecture, Decision Layer, component contracts, ownership rules, forbidden responsibilities, graceful degradation, native compatibility
- TASK-004 — Composite Engine, pipeline orchestration, shared contracts, Recommendation Engine integration, Candidate production, tests, and extension points
- TASK-005 — Initiative Engine, Initiative-kind Candidate production, Stage 3 participation, shared Candidate contracts, no-candidate behavior, tests, and integration into the Composite Engine
- B1–B5 and C1–C4 only where TASK-006 directly consumes their approved contracts or infrastructure

Do not reopen closed decisions unless direct repository evidence proves an implementation conflict that prevents faithful implementation.

---

# 6. Problem Statement

Describe the current capability gap after TASK-004 and TASK-005.

The completed section must explain that the system can generate Recommendation-kind and Initiative-kind Candidates, but still lacks the canonical component that:

- evaluates intervention eligibility where assigned by D2
- arbitrates all surviving Candidates jointly
- applies the canonical hierarchy and prioritization rules
- selects one winner or the narrow permitted tied set
- forms one complete Terminal Decision
- resolves the Decision Pass to Silence or refusal when required

Explain why Candidate generation is not equivalent to decision-making and why arbitration must remain centralized.

---

# 7. Product Objectives

Define the measurable product outcomes of TASK-006.

Include objectives for:

- better decision quality rather than greater message volume
- deterministic arbitration across Recommendation and Initiative Candidates
- prioritization according to the Canonical Decision Hierarchy
- biggest-problem-first behavior within the permitted hierarchy
- deliberate Silence when no justified action survives
- single-winner simplicity by default
- narrow multi-option behavior only when canonically permitted
- trust, autonomy, honesty, and explainability
- safe refusal, deferral, modification, or escalation when required

Do not define UX wording, notification design, engagement targets, or delivery-channel behavior.

---

# 8. Non-Goals

List explicit exclusions.

At minimum, evaluate and document exclusions for:

- Recommendation Candidate generation
- Initiative Candidate generation
- invention of new Candidate kinds
- final Safety ownership
- message wording or Expression
- platform-specific delivery
- notification scheduling
- UI and UX implementation
- durable memory ownership
- Pipeline Context ownership
- redesign of the Composite Engine
- redesign of the canonical D2 pipeline
- independent Engine Registry registration
- new trigger types
- TASK-007 UX System responsibilities
- TASK-008 Design System responsibilities
- unrelated remediation of legacy systems

---

# 9. Functional Scope

Define the exact functional capabilities included in TASK-006.

The completed section must address:

- Stage 5 Eligibility Evaluation orchestration and ownership boundary
- collection of the full Candidate set across all Opportunities in one Decision Pass
- Stage 7 Prioritization
- Stage 8 Winner Selection
- Stage 9 Decision Formation
- shared recommendation/initiative budget enforcement
- Canonical Decision Hierarchy ordering
- recommendation impact-tier handling where applicable
- biggest-problem-first behavior
- canonical tie-break order
- single-winner default
- narrow permitted multi-option exception
- Safety disqualification integration
- Terminal Decision formation
- Decision-Pass-level Silence
- refusal/escalation formation when Safety modifies, defers, or blocks
- traceability and explainability
- deterministic no-candidate and all-disqualified behavior

Do not silently absorb Stage 4 Evidence Evaluation, Stage 6 Candidate Generation, Stage 10 Expression, or any Memory Layer responsibility.

---

# 10. Repository Baseline and Evidence

Document the actual repository state before implementation.

The completed section must include verified evidence for:

- branch and commit baseline
- Composite Engine and Internal Pipeline Orchestrator locations
- Recommendation Engine integration
- Initiative Engine integration
- shared Opportunity, Candidate, Pipeline Context, Safety, and decision-related contracts
- validators and normalization logic
- StateAccess and Memory Layer boundaries
- Engine Registry registration
- runtime wiring
- test structure and current full-suite baseline
- current application/version metadata where relevant
- actual Decision Engine stubs, placeholders, extension points, or confirmed absence

Use exact file paths and symbols. Do not infer repository behavior from old specifications when source code can be inspected.

---

# 11. Canonical Vocabulary and Domain Definitions

Define the terms used by TASK-006 without replacing vocabulary already fixed by D1, D2, and D3.

At minimum, clarify:

- Opportunity
- Eligibility
- Candidate
- Recommendation-kind Candidate
- Initiative-kind Candidate
- full Candidate set
- ranking
- Canonical Decision Hierarchy tier
- recommendation impact tier
- winner
- permitted tied set
- Decision Pass
- internal Silence outcome
- Decision-Pass-level Silence
- Canonical Decision
- Terminal Decision
- refusal
- escalation
- deferral
- Safety disqualification
- rationale
- confidence
- Pipeline Context
- Delivery Intent

Where a term is already canonical, reference it rather than redefining it inconsistently.

---

# 12. Decision Engine Mission and Positive Responsibilities

State the Decision Engine's positive responsibilities.

The completed section must identify:

- what the engine owns
- what it consumes
- what it produces
- how it applies D1 Units 06, 07, 10, 14, and 15
- how it executes D2 Stages 5, 7, 8, and 9
- how it coordinates with the Internal Pipeline Orchestrator without becoming a second orchestration authority
- how it preserves strict separation from Recommendation, Initiative, Safety, Memory, Expression, and Coach Runtime
- how it guarantees one Terminal Decision when Stage 9 is entered

---

# 13. Explicit Forbidden Responsibilities

Create a consolidated, testable list of responsibilities the Decision Engine must never perform.

At minimum include:

- no Recommendation Candidate generation
- no Initiative Candidate generation
- no rewriting Candidate content to improve ranking
- no ownership of Stage 3 Opportunity Detection
- no ownership of Stage 4 Evidence Evaluation unless a canonical source explicitly assigns a narrow orchestration responsibility
- no bypass of the Safety Layer at any checkpoint
- no independent Safety judgment
- no durable state ownership
- no direct persistence
- no Pipeline Context assembly
- no Expression
- no message wording
- no Delivery Intent production
- no platform or UI selection
- no notification scheduling
- no independent Engine Registry registration
- no engagement- or retention-driven ranking
- no new hierarchy tiers or decision kinds
- no multiple Terminal Decisions from one Decision Pass

---

# 14. Inputs and Upstream Contracts

Define the complete input contract.

The completed section must specify:

- eligible or safety-bypassed Opportunities
- Candidate sets from Recommendation and Initiative Engines
- Candidate fields required for arbitration
- Pipeline Context fields the Decision Engine may read
- Safety Layer inputs and returned determinations
- required versus optional fields
- source and owner of every field
- validation rules
- handling of missing, stale, malformed, duplicated, or conflicting inputs
- native/platform-neutral representation requirements

Do not add an input source that cannot be traced to D1 Decision Inputs, D2 Stage Contracts, D3 component contracts, or an approved repository contract.

---

# 15. Eligibility Evaluation

Define how TASK-006 implements or orchestrates D2 Stage 5.

The completed section must cover:

- valid reasons from D1 Intervention Eligibility
- Trust Test application
- reduced-frequency adjustment during low-coaching-value periods
- prohibition on eligibility merely because an event occurred
- safety/high-risk bypass behavior
- eligible and ineligible outcomes
- per-Opportunity internal Silence behavior
- separation between Eligibility Evaluation and Candidate Generation
- separation between eligibility and final winner selection
- traceability of every eligibility determination

Do not invent numeric thresholds that the canonical sources do not define.

---

# 16. Candidate Pool Assembly

Define how all Candidate outputs are collected for a single Decision Pass.

The completed section must specify:

- aggregation across every Opportunity in the cycle
- aggregation across Recommendation and Initiative Engines
- validation before admission to the shared pool
- duplicate handling
- preservation of Candidate immutability
- preservation of Candidate provenance
- handling of zero Candidates from individual Opportunities
- handling of zero Candidates across the entire Decision Pass
- prohibition on generator-specific priority shortcuts

The shared pool must be complete before Stage 7 begins.

---

# 17. Prioritization Model

Define Stage 7 in full.

The completed section must specify the exact order and relationship among:

- Canonical Decision Hierarchy tier
- recommendation impact tiers where applicable
- biggest-problem-first
- shared recommendation/initiative budget
- D1 canonical tie-break order
- confidence and evidence only where the canonical rules permit them to influence ordering
- exclusion of Product Engagement as a ranking objective

The specification must distinguish mandatory canonical ordering from implementation-level sorting mechanics.

Do not invent new scoring systems, weights, utility functions, or numeric priority formulas.

---

# 18. Budget Enforcement

Define how the shared recommendation/initiative budget is applied.

The completed section must address:

- the canonical source of the budget
- whether enforcement occurs during ranking, admission, or selection
- interaction between Recommendation and Initiative Candidates
- interaction with already-fired or suppressed interventions where relevant
- deterministic behavior when the pool exceeds the budget
- no special reserve for either Candidate kind unless canonically required
- no engagement-based expansion of the budget

Any repository gap in budget representation must be classified rather than resolved through invented Product policy.

---

# 19. Tie-Breaking and Conflict Resolution

Define the canonical tie-break sequence and conflict-resolution behavior.

The completed section must:

- cite D1's exact tie-break order
- distinguish a resolvable tie from a genuine unresolved tie
- state when the narrow multi-option exception may be used
- prohibit menus for convenience
- preserve single-winner default behavior
- specify deterministic handling of semantically duplicate or equivalent Candidates
- specify behavior when canonical fields are missing or contradictory

Do not replace the canonical tie-break sequence with an engineering preference.

---

# 20. Winner Selection

Define Stage 8 in full.

The completed section must cover:

- exactly one winner by default
- the narrow permitted tied set exception
- Safety disqualification before final selection
- repeated selection after a disqualification where another Candidate remains
- all-Candidates-disqualified behavior
- preservation of Candidate provenance and rationale
- deterministic selection
- no mutation or regeneration during selection

Winner Selection must not itself form a Terminal Decision.

---

# 21. Safety Layer Integration

Define all Decision Engine interactions with the Safety Layer.

The completed section must cover the applicable D2/D3 checkpoints, including:

- safety/high-risk Opportunity admission bypass where canonically assigned
- Candidate disqualification before final Winner Selection
- final independent Safety evaluation during Decision Formation
- Safety authority to modify, defer, or block
- conversion of modified/deferred/blocked outcomes into a refusal or escalation Terminal Decision where required
- no bypass, downgrade, reinterpretation, or silent suppression of Safety output
- behavior if the Safety Layer is unavailable or returns an invalid response

TASK-006 must integrate with Safety authority without implementing the Safety Layer's independent policy scope.

---

# 22. Decision Formation

Define Stage 9 in full.

The completed section must specify how the Decision Engine forms one complete Terminal Decision from:

- one winning Candidate
- the full permitted tied set
- a Decision-Pass-level Silence determination
- a Safety-modified, deferred, or blocked outcome

The Terminal Decision contract must include every field required by D1 Unit 15 and D2 Stage 9, including at minimum:

- kind
- rationale
- confidence
- Canonical Decision Hierarchy position
- Candidate provenance
- traceability
- multiple user-selectable options only under the narrow permitted exception

The completed section must prohibit incomplete decisions and prohibit more than one Terminal Decision per Decision Pass.

---

# 23. Silence Semantics

Define all Silence paths without conflating them.

Provide separate treatment for:

## 23.1 Stage 4 Internal Termination

## 23.2 Stage 5 Ineligible Opportunity

## 23.3 Stage 6 Zero-Candidate Opportunity

## 23.4 Decision-Pass-Level Zero Surviving Candidates

## 23.5 All Candidates Disqualified by Safety

For each path, define:

- whether it is internal or terminal
- whether Stage 9 is entered
- what trace is preserved
- what output is produced
- whether Expression is invoked
- how duplicate or multiple Silence outcomes are prevented

Do not create an independent Terminal Decision for each Opportunity that terminates internally.

---

# 24. Refusal, Deferral, Modification, and Escalation

Define the Decision Engine behavior when Safety or authority boundaries prevent the original Candidate from becoming the final decision.

The completed section must specify:

- permitted resulting Terminal Decision kinds
- required rationale and traceability
- preservation of the original Candidate and Safety determination as evidence
- user-autonomy and honesty requirements
- no disguised recommendation after a block
- no fabricated fallback Candidate
- separation between Decision Formation and Expression wording

---

# 25. Terminal Decision Contract

Define a platform-neutral, implementation-ready Terminal Decision contract.

The completed section must specify:

- required fields
- optional fields
- allowed kinds
- invariants
- validation rules
- immutability expectations
- provenance and trace fields
- confidence representation
- hierarchy representation
- tied-option representation
- refusal/escalation representation
- Silence representation
- versioning or compatibility rules where required

Do not include platform, UI, notification, chat, card, widget, voice, or push fields.

---

# 26. Explainability and Traceability

Define the evidence required to explain every Decision Pass.

The completed section must make it possible to determine:

- which Opportunities were evaluated
- which Opportunities failed eligibility
- which Candidates were generated
- which Candidates entered the shared pool
- how each Candidate was ranked
- which canonical rules affected ordering
- which Candidates were disqualified and why
- why the winner or tied set was selected
- why Silence or refusal occurred
- what Safety evaluation occurred
- which Terminal Decision was formed

Traceability must be useful for tests and review without leaking sensitive user data into logs.

---

# 27. Determinism and Immutability

Define deterministic behavior for equivalent inputs.

The completed section must cover:

- stable ordering
- deterministic tie handling
- immutable Pipeline Context consumption
- immutable Candidate consumption after generation
- immutable Terminal Decision after formation
- idempotent repeated evaluation where inputs are unchanged
- prevention of hidden randomness
- prevention of time-dependent behavior unless time is an explicit input
- explicit handling of clock/time-zone data

---

# 28. Composite Engine and Pipeline Integration

Define how TASK-006 integrates with the existing Composite Engine.

The completed section must specify:

- invocation by the existing Internal Pipeline Orchestrator
- stage entry and exit contracts
- handoff from Recommendation and Initiative Engines
- Safety Layer calls
- handoff to Expression
- no second orchestrator
- no new B2 Engine Registry entry
- no new trigger type
- no direct Coach Runtime invocation
- compatibility with existing TASK-004 and TASK-005 wiring

---

# 29. Memory, State, and Persistence Boundaries

Define what the Decision Engine may read and what it must never own or write.

The completed section must cover:

- Pipeline Context as the only approved assembled context input
- Memory Layer ownership of reads and context assembly
- StateAccess boundary
- no direct Firestore or storage access
- no durable decision-history write by the Decision Engine
- no Typed Memory promotion
- no Coaching History ownership
- any post-decision write request handed to the Memory Layer through approved contracts only
- account/session isolation

---

# 30. Expression and Delivery Boundary

Define the downstream boundary after Terminal Decision formation.

The completed section must state that:

- the Decision Engine produces a Terminal Decision only
- Expression alone translates it into a platform-neutral Delivery Intent
- Coach Runtime alone maps Delivery Intent to a platform-specific surface
- the Decision Engine has no knowledge of chat, trigger cards, notifications, widgets, push, voice, or native UI
- delivery failure does not retroactively change the Terminal Decision

---

# 31. Exceptional Flows and Graceful Degradation

Create a complete catalogue covering at minimum:

- no Opportunities
- Opportunities with insufficient evidence
- all Opportunities ineligible
- zero Candidates from one Opportunity
- zero Candidates across the pass
- malformed Candidate
- duplicate Candidate
- missing hierarchy tier
- missing rationale
- missing confidence
- unresolved tie
- invalid Safety response
- Safety Layer unavailable
- all Candidates disqualified
- invalid Pipeline Context
- incompatible contract version
- unexpected exception
- Expression unavailable after a Terminal Decision is formed

For each flow define:

- detection
- handling
- output
- trace behavior
- whether the pass continues, resolves to Silence/refusal, or aborts
- required test

Do not fabricate a Candidate or unsafe Terminal Decision as fallback content.

---

# 32. Performance and Operational Constraints

Define only requirements justified by the repository and current product stage.

At minimum consider:

- synchronous versus asynchronous execution
- bounded runtime
- repeated invocation and idempotency
- Candidate-set size
- stable sort and deterministic arbitration
- no unnecessary network dependency in pure-domain logic
- startup impact
- pilot-scale requirements without creating a future bottleneck
- native compatibility
- observability without sensitive-data leakage

Do not invent arbitrary performance numbers without evidence or an explicit engineering rationale.

---

# 33. Security, Privacy, Ethics, and Safety Constraints

Document constraints relevant to Decision Engine inputs and outputs.

Cover:

- least-privilege access
- no unnecessary sensitive-data duplication
- no private-data leakage in logs
- account/session isolation
- medical and safety boundaries
- user autonomy
- non-manipulative behavior
- no engagement optimization
- no dark-pattern ranking
- honest uncertainty
- refusal when authority is insufficient

Do not expand TASK-006 into a separate security-remediation project.

---

# 34. Repository Changes

List the expected repository impact based on verified evidence.

Separate:

- new production files
- modified production files
- new tests
- modified tests
- shared contract changes
- validator changes
- Composite Engine wiring changes
- documentation changes
- version/cache/service-worker changes where genuinely required
- explicit no-touch areas

The final SPEC must identify candidate paths and symbols. Engineering may adjust exact filenames only where repository evidence justifies the change without altering architecture or scope.

---

# 35. Test Strategy

Define a complete test plan.

Provide separate subsections for:

## 35.1 Eligibility Unit Tests

## 35.2 Candidate Pool Assembly Tests

## 35.3 Prioritization Unit Tests

## 35.4 Budget Enforcement Tests

## 35.5 Tie-Breaking Tests

## 35.6 Winner Selection Tests

## 35.7 Safety Integration Tests

## 35.8 Decision Formation Tests

## 35.9 Terminal Decision Contract Tests

## 35.10 Silence Semantics Tests

## 35.11 Refusal / Deferral / Modification Tests

## 35.12 Composite Engine Integration Tests

## 35.13 Recommendation/Initiative Joint Arbitration Tests

## 35.14 Memory and Persistence Boundary Tests

## 35.15 Expression and Delivery Boundary Tests

## 35.16 Failure and Graceful-Degradation Tests

## 35.17 Determinism and Idempotency Tests

## 35.18 Regression Tests

## 35.19 Native / Platform-Neutral Contract Tests

Map every normative behavior, invariant, and acceptance criterion to at least one required test.

---

# 36. Acceptance Criteria

Provide objective, verifiable acceptance criteria grouped by:

## 36.1 Product

## 36.2 Functional

## 36.3 Eligibility

## 36.4 Prioritization

## 36.5 Winner Selection

## 36.6 Decision Formation

## 36.7 Silence and Refusal

## 36.8 Safety

## 36.9 Architecture

## 36.10 Contracts

## 36.11 Memory and State

## 36.12 Failure Handling

## 36.13 Testing

## 36.14 Documentation

Every criterion must be testable or reviewable from repository evidence. Avoid vague criteria such as “works correctly,” “makes the best decision,” or “is user friendly.”

---

# 37. Engineering Constraints

Consolidate implementation constraints, including:

- no Product or Architecture invention
- no scope expansion
- no unrelated refactoring
- no replacement of canonical hierarchy with a score model
- no duplicated shared contract where reuse is possible
- pure-domain separation
- native compatibility
- existing coding and module conventions
- deterministic behavior
- complete automated tests
- no hidden fallback behavior
- no implementation of Recommendation, Initiative, Safety, Expression, UX, notification, or Design System scope beyond required integration

---

# 38. Pending Decisions, Repository Gaps, Canonical Conflicts, and Follow-ups

Record only genuine unresolved items using the classifications required by the Specification Authoring Standard.

At minimum verify the current status of:

- Stage 4 Evidence Evaluation ownership and repository implementation
- Safety Layer availability and integration contract
- Expression availability and handoff contract
- shared Candidate category / hierarchy representation
- shared budget representation
- Decision Window routing follow-up
- Relationship Maturity, Life Event Context, and Capacity State availability only where TASK-006 actually consumes them through existing Pipeline Context
- provisional mappings or adapters inherited from TASK-004 or TASK-005

For each item include:

- classification
- exact question or conflict
- evidence
- authority owner
- whether it blocks READY
- required resolution

Do not label a Follow-up as a READY Blocker unless the governing documents explicitly make it a prerequisite to faithful TASK-006 implementation.

---

# 39. Traceability Matrix

Create a matrix connecting:

- TASK-006 requirement
- canonical source and exact section/rule
- repository component
- acceptance criterion
- required test
- implementation evidence when completed

At minimum trace:

- D1 Intervention Eligibility rules
- D1 Prioritization rules
- D1 Silence Policy
- D1 Authority Boundaries
- D1 Canonical Decision Output
- D2 Stages 5, 7, 8, and 9
- D2 Decision Lifecycle
- D2 Exceptional Flows
- D2 Decision Engine responsibilities
- D3 Decision Layer contracts and invariants
- TASK-004 Candidate and Composite Engine contracts
- TASK-005 Initiative integration contracts

---

# 40. Documentation Updates Required

Identify the documents that must be updated at implementation closure and the exact type of update expected.

Evaluate at minimum:

- `docs/specs/TASK_006_SPEC_v1.0.md`
- `docs/roadmap/Roadmap.md`
- `docs/roadmap/Changelog.md`
- `docs/architecture/FITME_ARCHITECTURE_v1.md` only if the implemented repository requires a factual current-state update without changing approved architecture
- `docs/engineering/001_ai_system_overview.md` only if it is an active maintained current-state document
- repository inventories only if they are active maintained documents

Do not perform closure updates during initial specification authoring.

---

# 41. READY Definition

Define the conditions required before implementation may begin.

At minimum require:

- completed canonical expansion
- complete repository evidence review
- resolution of all true READY Blockers
- Product approval
- Architecture approval
- Engineering Readiness Review
- complete input, Candidate, Safety, and Terminal Decision contracts
- complete prioritization and tie-break rules
- complete Silence and refusal behavior
- complete acceptance criteria
- complete test strategy
- no unresolved Product or Architecture decision required for implementation

---

# 42. DONE Definition

Define the conditions required to close TASK-006 after implementation.

At minimum require:

- implementation matches the approved READY specification
- all required tests pass
- full regression suite passes
- focused engineering review is APPROVED
- Product and Architecture review is APPROVED
- required documentation is updated
- repository is clean
- commit and push are complete
- closure record is written

---

# 43. Product Review Checklist

Provide a checklist for verifying:

- Decision Philosophy fidelity
- Canonical Decision Hierarchy fidelity
- biggest-problem-first behavior
- single-winner simplicity
- narrow multi-option exception discipline
- deliberate Silence
- user autonomy and trust
- no engagement-driven ranking
- explainability
- no Product scope invention
- objective acceptance criteria

---

# 44. Architecture Review Checklist

Provide a checklist for verifying:

- Decision Layer ownership fidelity
- Stage 5/7/8/9 boundaries
- Composite Engine integration
- Internal Pipeline Orchestrator boundary
- Recommendation/Initiative separation
- Safety boundary
- Memory/state/persistence boundary
- Expression and Coach Runtime boundary
- exactly one Terminal Decision
- no independent registration
- deterministic and platform-neutral design

---

# 45. Engineering Self-Review Checklist

Provide a checklist Claude must complete before submitting the expanded SPEC for review.

It must verify:

- every section is completed
- every repository claim is evidenced
- no section introduces unauthorized Product or Architecture decisions
- every unresolved item is classified correctly
- all normative rules map to tests
- all acceptance criteria are objective
- terminology and contracts are consistent across sections
- no implementation was performed
- no repository files were edited except the requested specification file
- the SPEC does not self-approve READY, Product, or Architecture authority

---

# 46. Engineering Handoff

Define what Claude must include when returning the completed `TASK_006_SPEC_v1.0.md` for Canonical Review:

- file created or updated
- repository files inspected
- branch and commit baseline
- concise summary of specification coverage
- all Repository Gaps
- all Product Decisions Required
- all Architecture Decisions Required
- all Engineering Decisions Pending
- all Canonical Conflicts
- all non-blocking Follow-ups
- proposed Engineering Readiness verdict, without self-approving Product or Architecture authority
- confirmation that no code or unrelated documentation was changed

---

# 47. Closure Record

Reserve this section for completion only after implementation and all reviews are finished.

It must eventually record:

- final status
- implementation summary
- tests and results
- approvals
- documentation updates
- commit hash
- branch and push status
- remaining non-blocking Follow-ups
- official closure statement

---

# 48. Global Forbidden Changes

The completed SPEC must explicitly prohibit Claude from:

- writing implementation code during specification authoring
- changing Product behavior
- changing canonical architecture
- adding engines or pipeline stages
- moving authority between components
- changing D1 hierarchy, priority, Silence, or output policy
- replacing deterministic rules with opaque scoring
- generating Recommendation or Initiative content inside the Decision Engine
- implementing the Safety Layer as part of TASK-006
- implementing Expression, UX, notification, or Design System scope
- adding engagement or retention objectives
- inventing evidence, confidence, priority, budget, or tie thresholds
- treating AI inference as authoritative memory
- bypassing Safety
- adding direct persistence from the Decision Engine
- introducing browser-only domain dependencies
- changing unrelated files
- declaring Product or Architecture approval on its own

---

# 49. Specification Authoring Instructions for Claude Code

Claude must use this skeleton as the fixed top-level structure for `TASK_006_SPEC_v1.0.md`.

Claude may add lower-level subsections, tables, diagrams, contracts, examples, and evidence blocks only when necessary to complete a listed section and only when they do not alter scope or authority.

Claude must:

1. inspect the current repository and every relevant canonical source before writing conclusions;
2. distinguish canonical requirements from repository facts and engineering proposals;
3. cite exact files, sections, rules, symbols, and tests wherever possible;
4. preserve all approved decisions from D1, D2, D3, TASK-004, and TASK-005;
5. classify unresolved matters using the approved taxonomy;
6. avoid inventing Product or Architecture decisions;
7. write one complete specification rather than a partial draft;
8. perform an Engineering Self-Review before returning the file;
9. stop after specification authoring and reporting;
10. not implement code, update closure documentation, commit, or push.

---

# End of Skeleton
