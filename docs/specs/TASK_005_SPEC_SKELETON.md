# TASK_005_SPEC_SKELETON

## Initiative Engine

**Document Type:** Canonical Specification Skeleton  
**Target Deliverable:** `TASK_005_SPEC_v1.0.md`  
**Work Item:** TASK-005 — Initiative Engine  
**Prepared By:** Head of Product + AI Architect  
**Expansion Owner:** Claude Code acting only as Lead Engineer  
**Status:** Approved Skeleton for Canonical Expansion

---

# 1. Status

Define the specification version, lifecycle state, approval state, implementation state, and repository baseline used for the review.

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

Explain why TASK-005 exists and what product and system capability it introduces.

The completed section must establish that the Initiative Engine is responsible for producing Initiative-kind Candidates under the approved Initiative Policy, within the existing Coach Decision System, without taking authority that belongs to the Decision Engine, Safety Layer, Memory Layer, Expression, Coach Runtime, or delivery systems.

---

# 3. Canonical Authority

Identify the governing canonical documents and the precedence rules applicable to TASK-005.

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
- `docs/roadmap/Roadmap.md`
- `docs/roadmap/Changelog.md`

Do not create a new authority hierarchy. Record any true conflict using the terminology required by the Specification Authoring Standard.

---

# 4. Ownership and Decision Boundaries

Define which decisions belong to:

- Head of Product
- AI Architect
- Claude Code / Lead Engineer

The completed section must state that Claude may document repository facts, implementation constraints, technical options, and engineering risks, but may not invent or change Product policy, AI behavior, canonical architecture, authority boundaries, or task scope.

---

# 5. Relationship to Previous Work

Explain precisely how TASK-005 depends on and extends prior canonical work.

Cover at minimum:

- D1 — Initiative Policy, Opportunity Detection, Eligibility, Silence, Evidence, Memory Usage, Personalization, Authority Boundaries, Canonical Decision Output
- D2 — Pipeline Stages, Stage Contracts, Initiative Engine responsibilities, exceptional flows, traceability
- D3 — Composite Engine architecture, Initiative Layer, component contracts, forbidden responsibilities, graceful degradation, native compatibility
- TASK-004 — existing Composite Engine, pipeline orchestration, shared contracts, Recommendation Engine integration, tests, and documented extension points
- B1–B5 and C1–C4 only where TASK-005 directly consumes their approved contracts or infrastructure

Do not reopen closed decisions unless direct repository evidence proves an implementation conflict that prevents faithful implementation.

---

# 6. Problem Statement

Describe the current capability gap after TASK-004.

The completed section must explain what the system can already do, what it cannot yet do without TASK-005, and why Initiative-kind Candidate production must remain distinct from Recommendation-kind Candidate production.

---

# 7. Product Objectives

Define the measurable product outcomes of TASK-005.

Include objectives for:

- timely and useful coach-originated intervention opportunities
- relationship-sensitive initiative behavior
- trust preservation
- avoidance of engagement-driven contact
- deterministic and explainable Candidate production
- correct use of evidence and uncertainty
- deliberate Silence when initiative is not justified

Do not define UX wording, notification design, engagement targets, or delivery-channel behavior.

---

# 8. Non-Goals

List explicit exclusions.

At minimum, evaluate and document exclusions for:

- Prioritization
- Winner Selection
- Terminal Decision Formation
- final Safety authority
- message wording or Expression
- notification scheduling and platform delivery
- UI and UX implementation
- durable memory ownership
- independent Engine Registry registration
- redesign of the Composite Engine or canonical pipeline
- TASK-006 Decision Engine responsibilities
- TASK-007 UX System responsibilities
- TASK-008 Design System responsibilities

---

# 9. Functional Scope

Define the exact functional capabilities included in TASK-005.

The completed section must identify which Initiative Engine capabilities are required now and which are deferred.

At minimum, address:

- participation in Opportunity Detection where assigned by D1/D2
- confirmed-pattern anticipation
- decision-window opportunities
- disruption opportunities
- milestone opportunities
- recovery-support opportunities
- Relationship-Maturity gating
- eligibility inputs consumed by the Initiative Engine versus determinations owned elsewhere
- construction of Initiative-kind Candidates
- traceability and explainability fields
- no-candidate / Silence-compatible outcomes

Do not silently include Safety-triggered Opportunity ownership unless the governing documents and existing architecture assign it to the Initiative Engine rather than the Safety Layer.

---

# 10. Repository Baseline and Evidence

Document the actual repository state before implementation.

The completed section must include verified evidence for:

- current branch and relevant commit baseline
- existing Composite Engine and orchestrator locations
- existing Recommendation Engine and Candidate contracts
- existing shared types, validators, registries, state access, persistence, runtime wiring, and test structure
- any actual Initiative-related stubs, hooks, placeholders, or absence thereof
- current test-suite baseline
- current application/version metadata where relevant

Use exact file paths and symbols. Do not infer repository behavior from older specifications when the source code can be inspected.

---

# 11. Canonical Vocabulary and Domain Definitions

Define the terms used by TASK-005 without replacing the vocabulary already fixed by D1 and D2.

At minimum, clarify:

- Initiative
- Initiative-kind Candidate
- Opportunity
- Decision Window
- confirmed pattern
- disruption
- milestone
- recovery-support moment
- Relationship Maturity
- Eligibility
- Evidence
- Confidence
- Silence
- Pipeline Context
- Terminal Decision

Where a term is already canonical, reference it rather than redefining it inconsistently.

---

# 12. Initiative Engine Mission and Responsibilities

State the Initiative Engine's positive responsibilities.

The completed section must identify:

- what the engine owns
- what it contributes to Stage 3
- what it owns in Stage 6
- what inputs it may consume
- what output it must produce
- how it applies D1 Unit 09 in full
- how it preserves the distinction between initiative policy and recommendation policy

---

# 13. Explicit Forbidden Responsibilities

Create a consolidated, testable list of responsibilities the Initiative Engine must never perform.

At minimum include the prohibitions inherited from D1, D2, and D3, including:

- no Prioritization
- no Winner Selection
- no Terminal Decision Formation
- no engagement- or retention-driven initiative
- no repeated initiative merely because an earlier initiative was ignored
- no bypass of Safety authority
- no durable state ownership
- no authoritative promotion of AI-inferred memory
- no platform or delivery-channel selection
- no independent Engine Registry registration outside the Composite Engine
- no mutation of unrelated pipeline responsibilities

---

# 14. Inputs and Pipeline Context

Define the complete input contract.

The completed section must specify:

- required inputs
- optional inputs
- source of every input
- read authority
- validation rules
- handling of missing or stale inputs
- handling of conflicting signals
- whether absence itself is evidence
- native/platform-neutral representation requirements

Do not add an input source that cannot be traced to the canonical Decision Input categories or an approved repository contract.

---

# 15. Opportunity Sources and Detection Rules

Define the Opportunity sources relevant to Initiative behavior and the exact rules for recognizing them.

Provide separate subsections for:

## 15.1 Decision Windows

## 15.2 Confirmed-Pattern Anticipation

## 15.3 Known Calendar Disruptions

## 15.4 Structural Disruptions

## 15.5 Genuine Milestones

## 15.6 Recovery-Support Moments

## 15.7 Explicit User Statements or Actions

## 15.8 Safety / High-Risk Signals and the Boundary with the Safety Layer

For every source, document:

- required evidence
- confidence requirement
- timing relevance
- exclusions
- ownership
- output or pass condition
- examples only where they clarify an already-approved rule

Do not invent numeric thresholds that the canonical sources do not define.

---

# 16. Evidence and Confidence Requirements

Define how evidence quality and confidence affect Initiative-kind Candidate generation.

The completed section must cover:

- event versus evidence
- single-instance limitations
- explicit user statements and actions
- confirmed patterns
- evidence hierarchy
- uncertainty representation
- insufficient-evidence behavior
- prohibition on manufactured confidence
- traceability from evidence to Candidate

Any concrete threshold not already canonical must be marked with the correct Pending Decision or Engineering Decision classification rather than invented.

---

# 17. Relationship Maturity, Trust, and Personalization

Define how Relationship Maturity and trust constrain Initiative behavior.

The completed section must specify:

- maturity-stage inputs
- evidence required to rely on maturity
- how initiative frequency, timing, directness, category, and confidence depend on maturity
- protections against premature familiarity
- protection of user autonomy
- personalization boundaries
- handling when relationship state is unknown or unreliable

Do not define presentation copy or emotional tone templates; those belong to later Expression/UX work unless an existing canonical contract requires metadata for them.

---

# 18. Intervention Eligibility Integration

Explain how Initiative opportunities interact with Stage 5 Eligibility Evaluation.

The completed section must distinguish clearly between:

- checks performed locally before emitting a Candidate
- eligibility data attached to an Opportunity or Candidate
- determinations owned by the Decision Engine
- unconditional or exceptional handling owned by the Safety Layer
- reasons for rejection, suppression, deferment, or no-candidate output

Do not move orchestration authority from the Decision Engine into the Initiative Engine.

---

# 19. Initiative Candidate Contract

Define the complete Initiative-kind Candidate contract.

At minimum, document:

- required fields
- optional fields
- identifiers
- Candidate kind/type
- source Opportunity reference
- evidence references
- confidence representation
- timing / decision-window metadata
- category or hierarchy metadata where already canonical
- relationship-maturity context
- explainability / reason data
- safety-relevant metadata
- suppression or exclusion information where applicable
- validation result
- immutability expectations
- serialization/platform-neutral constraints

Reuse approved shared Candidate contracts where possible. Any extension must preserve compatibility with TASK-004 and the future Decision Engine.

---

# 20. Candidate Generation Process

Define the deterministic process by which an eligible Initiative opportunity becomes an Initiative-kind Candidate.

The completed section should describe:

1. entry conditions
2. input validation
3. Opportunity classification
4. evidence and confidence evaluation
5. Relationship-Maturity gating
6. initiative-policy checks
7. Candidate construction
8. Candidate validation
9. output or no-output result
10. trace generation

This section must not perform downstream ranking or selection.

---

# 21. Silence, Suppression, and No-Candidate Outcomes

Define when the Initiative Engine must deliberately emit no Candidate.

Cover at minimum:

- insufficient evidence
- low confidence
- poor timing
- closed decision window
- trust risk
- excessive user effort
- recent ignored initiative where additional initiative is prohibited
- rejection/suppression feedback from C2 where relevant
- missing required context
- conflict with an absolute override
- absence of a useful action

Differentiate deliberate Silence-compatible outcomes from runtime failure.

---

# 22. Interaction with Recommendation Engine

Define the boundary between Recommendation-kind and Initiative-kind Candidate generation.

The completed section must explain:

- shared contracts and shared Pipeline Context
- separate policy ownership
- prohibition on rule leakage between the two engines
- how duplicate or overlapping Opportunities/Candidates are represented for later Decision Engine handling
- what each engine must not decide about the other's output
- whether either engine may call the other directly

Do not add cross-engine prioritization logic.

---

# 23. Interaction with Decision Engine

Define the handoff contract to TASK-006.

The completed section must specify:

- what the Initiative Engine sends
- what it must not decide
- how the future Decision Engine consumes Initiative Candidates
- compatibility requirements for mixed Candidate sets
- error behavior when the Decision Engine is absent or unreachable during the TASK-005 repository stage
- temporary integration boundaries that do not pre-implement TASK-006

Do not implement a substitute Decision Engine inside TASK-005.

---

# 24. Interaction with Safety Layer

Define all applicable Safety checkpoints and ownership boundaries.

The completed section must state:

- what safety-related context the Initiative Engine may read
- what it may annotate
- what it may locally reject
- what only the Safety Layer may determine
- how safety-triggered Opportunities enter the shared pipeline
- how the Initiative Engine avoids bypassing or duplicating Safety authority
- failure behavior when required Safety evaluation is unavailable

---

# 25. Interaction with Memory, State, and Persistence

Define read/write boundaries.

The completed section must cover:

- Pipeline Context reads
- approved StateAccess usage
- B5 consumption path
- C3 event-model interactions where relevant
- C4 typed-memory write-path constraints
- whether TASK-005 writes anything durably
- history or trace data ownership
- no-authoritative-inference rule
- session/account isolation
- stateless or pure-domain requirements

Do not grant the Initiative Engine new persistence authority without explicit canonical support.

---

# 26. Runtime Placement and Composition

Define where TASK-005 is placed in the existing repository and runtime.

The completed section must specify:

- component/module boundary
- composition within the existing Composite Engine
- invocation point(s)
- ordering relative to Recommendation, Decision, Safety, Memory, Expression, and Coach Runtime
- public versus internal APIs
- registry behavior
- dependency direction
- platform-neutral implementation constraints

Do not redesign the canonical Composite Engine unless repository evidence proves the approved architecture cannot be implemented.

---

# 27. Integration Map

Provide a complete integration table.

For every integration point include:

- producer
- consumer
- file/module/symbol
- input contract
- output contract
- owner
- failure behavior
- required tests
- implementation status

Include both production code and test wiring.

---

# 28. Determinism, Explainability, and Traceability

Define the engineering requirements needed to preserve deterministic and reviewable behavior.

The completed section must cover:

- identical-input expectations
- rule identifiers
- source Opportunity trace
- evidence trace
- reason codes
- no-candidate reason codes
- canonical-source traceability where practical
- separation between machine-readable trace and future user-facing explanation
- debugging without exposing private or sensitive data unnecessarily

---

# 29. Failure Handling and Graceful Degradation

Create a failure catalogue covering at minimum:

- invalid input contract
- missing optional context
- missing required context
- malformed memory/state data
- conflicting evidence
- unavailable dependency
- unavailable Safety or Decision components
- Candidate validation failure
- unexpected exception
- duplicate Candidate generation
- stale decision window
- unsupported Opportunity type

For every failure define:

- detection
- handling
- output
- logging/trace behavior
- whether the pipeline continues, returns no Candidate, defers, or aborts
- required test

Do not fabricate a Candidate or Terminal Decision as fallback content.

---

# 30. Performance and Operational Constraints

Define only requirements justified by the repository and current product stage.

At minimum consider:

- synchronous versus asynchronous execution
- bounded runtime
- repeated invocation/idempotency
- duplicate prevention
- memory and payload size
- no unnecessary network dependency in pure-domain logic
- startup impact
- pilot-scale requirements without creating a scale bottleneck
- future native compatibility

Do not invent arbitrary performance numbers without evidence or an explicit engineering rationale.

---

# 31. Security, Privacy, and Safety Constraints

Document constraints relevant to the data consumed or produced by the Initiative Engine.

Cover:

- least-privilege data access
- avoidance of unnecessary sensitive-data duplication
- no private-data leakage in logs
- account/session isolation
- medical and safety boundaries
- user autonomy
- non-manipulative behavior
- no engagement optimization

Do not expand TASK-005 into a separate security-remediation project.

---

# 32. Repository Changes

List the expected repository impact based on verified evidence.

Separate:

- new production files
- modified production files
- new tests
- modified tests
- registration/composition changes
- documentation changes
- version/cache/service-worker changes where genuinely required
- explicit no-touch areas

The final SPEC must identify candidate paths and symbols, but engineering may adjust exact filenames only where repository evidence justifies the change without altering architecture or scope.

---

# 33. Test Strategy

Define a complete test plan.

Provide separate subsections for:

## 33.1 Unit Tests

## 33.2 Contract Tests

## 33.3 Pipeline Integration Tests

## 33.4 Composite Engine Wiring Tests

## 33.5 Recommendation/Initiative Separation Tests

## 33.6 Safety Boundary Tests

## 33.7 Memory and State Boundary Tests

## 33.8 Silence and No-Candidate Tests

## 33.9 Failure and Degradation Tests

## 33.10 Regression Tests

## 33.11 Native/Platform-Neutral Contract Tests

Map every normative behavior, invariant, and acceptance criterion to at least one required test.

---

# 34. Acceptance Criteria

Provide objective, verifiable acceptance criteria grouped by:

## 34.1 Product

## 34.2 Functional

## 34.3 Pipeline

## 34.4 Architecture

## 34.5 Contracts

## 34.6 Safety

## 34.7 Memory and State

## 34.8 Failure Handling

## 34.9 Testing

## 34.10 Documentation

Every criterion must be testable or reviewable from repository evidence. Avoid vague criteria such as “works correctly” or “is user friendly.”

---

# 35. Engineering Constraints

Consolidate implementation constraints, including:

- no Product or Architecture invention
- no scope expansion
- no unrelated refactoring
- no duplicated shared contract where reuse is possible
- pure-domain separation
- native compatibility
- existing coding and module conventions
- deterministic behavior
- complete automated tests
- no hidden fallback behavior
- no implementation of TASK-006/007/008

---

# 36. Pending Decisions, Repository Gaps, and Canonical Conflicts

Record only genuine unresolved items using the classifications required by the Specification Authoring Standard.

For each item include:

- classification
- exact question or conflict
- evidence
- authority owner
- whether it blocks READY
- required resolution

Do not label a Follow-up as a READY Blocker unless the governing documents explicitly make it a prerequisite to faithful TASK-005 implementation.

---

# 37. Traceability Matrix

Create a matrix connecting:

- TASK-005 requirement
- canonical source and exact section/rule
- repository component
- acceptance criterion
- required test
- implementation evidence when completed

At minimum trace all inherited D1 Initiative Policy rules, applicable D2 Stage Contracts, applicable D3 architecture invariants, and TASK-004 integration contracts.

---

# 38. Documentation Updates Required

Identify the documents that must be updated at implementation closure and the exact type of update expected.

Evaluate at minimum:

- `docs/specs/TASK_005_SPEC_v1.0.md`
- `docs/roadmap/Roadmap.md`
- `docs/roadmap/Changelog.md`
- architecture documentation only if the implemented repository requires a factual update without changing the approved architecture
- repository inventories or engineering overview only if they are active maintained documents

Do not perform closure updates during the initial specification-authoring phase.

---

# 39. READY Definition

Define the conditions required before implementation may begin.

At minimum require:

- completed canonical expansion
- repository evidence review
- resolution of all true READY Blockers
- Product approval
- Architecture approval
- Engineering Readiness Review
- complete contracts
- complete acceptance criteria
- complete test strategy
- no unresolved Product or Architecture decision required for implementation

---

# 40. DONE Definition

Define the conditions required to close TASK-005 after implementation.

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

# 41. Product Review Checklist

Provide a checklist for verifying:

- Initiative Policy fidelity
- trust and autonomy protection
- correct use of evidence
- Relationship-Maturity behavior
- correct Silence behavior
- no engagement-driven initiative
- no Product scope invention
- objective acceptance criteria

---

# 42. Architecture Review Checklist

Provide a checklist for verifying:

- component boundary fidelity
- Composite Engine integration
- pipeline-stage ownership
- Recommendation/Initiative separation
- Decision Engine boundary
- Safety boundary
- Memory/state/persistence boundary
- deterministic and platform-neutral design
- no forbidden independent registration or delivery ownership

---

# 43. Engineering Self-Review Checklist

Provide a checklist Claude must complete before submitting the expanded SPEC for review.

It must verify:

- every section is completed
- every repository claim is evidenced
- no section introduces unauthorized decisions
- all pending items are classified
- all normative rules have tests
- all acceptance criteria are objective
- cross-section terminology and contracts are consistent
- no implementation was performed
- no repository files were edited except the requested specification file

---

# 44. Engineering Handoff

Define what Claude must include when returning the completed `TASK_005_SPEC_v1.0.md` for Canonical Review:

- file created or updated
- repository files inspected
- repository baseline
- concise summary of specification coverage
- all Repository Gaps
- all Product Decisions Required
- all Architecture Decisions Required
- all Engineering Decisions Pending
- all Canonical Conflicts
- proposed READY verdict, without self-approving Product or Architecture authority
- confirmation that no code or unrelated documentation was changed

---

# 45. Closure Record

Reserve the section for completion only after implementation and all reviews are finished.

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

# 46. Global Forbidden Changes

The completed SPEC must explicitly prohibit Claude from:

- writing implementation code during specification authoring
- changing Product behavior
- changing canonical architecture
- adding new engines or pipeline stages
- moving authority between components
- implementing Decision, Expression, UX, notification, or Design System scope
- adding engagement/retention objectives
- inventing evidence thresholds
- treating AI inference as authoritative memory
- bypassing Safety
- introducing browser-only domain dependencies
- changing unrelated files
- declaring Product or Architecture approval on its own

---

# 47. Specification Authoring Instructions for Claude Code

Claude must use this skeleton as the fixed top-level structure for `TASK_005_SPEC_v1.0.md`.

Claude may add lower-level subsections, tables, diagrams, contracts, examples, and evidence blocks only when they are necessary to complete a listed section and do not alter scope or authority.

Claude must:

1. inspect the current repository and every relevant canonical source before writing conclusions;
2. distinguish canonical requirements from repository facts and engineering proposals;
3. cite exact files, sections, rules, symbols, and tests wherever possible;
4. preserve all approved decisions from D1, D2, D3, and TASK-004;
5. classify unresolved matters using the approved taxonomy;
6. avoid inventing Product or Architecture decisions;
7. write one complete specification rather than a partial draft;
8. perform an Engineering Self-Review before returning the file;
9. stop after specification authoring and reporting;
10. not implement code, update closure documentation, commit, or push.

---

# End of Skeleton
