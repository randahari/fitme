# FITME Specification Authoring Standard

# Status

-   Version: 1.0
-   Status: Draft Canonical
-   Authority: Head of Product + AI Architect
-   Engineering Authority: Lead Engineer
-   Repository: FITME

------------------------------------------------------------------------

# Scope

This standard governs FITME task specifications only — the SPEC-stage documents authored for each task under the FITME engineering lifecycle.

This standard does not govern, define, or modify any other canonical document type, including: Product Bible, AI Constitution, Architecture, Engineering Workflow, Roadmap, Changelog, Coach Bible, Coach Knowledge Base, or Intelligence & Relationship Philosophy. Those documents remain governed by their own existing authority and content. This standard does not supersede or incorporate them; it only requires that a task specification cite them as canonical sources where relevant.

------------------------------------------------------------------------

# Standard Lifecycle and Versioning

Revisions to this standard are versioned; a substantive change to this standard is a new version, not a silent edit of the current one.

Any modification to this standard requires Head of Product + AI Architect approval. Engineering may propose a revision but may not approve one.

Draft Canonical and Canonical are distinct states: a Draft Canonical version has not yet received Head of Product + AI Architect approval and does not yet govern any task specification as canonical; only an approved, Canonical version does.

------------------------------------------------------------------------

# Purpose

This standard defines the reusable requirements for authoring, evidencing, reviewing, and completing a FITME task specification. It exists so that every task specification — regardless of the feature it covers — is structured consistently, grounded in canonical sources and repository evidence, clearly separated from engineering review commentary, and evaluated by the same READY/DONE criteria.

This standard does not define the behavior of any specific FITME feature, engine, or system. It defines only how a specification about such a feature must be written.

------------------------------------------------------------------------

# Authority and Decision Boundaries

A task specification distinguishes exactly four kinds of contribution:

-   **Head of Product decisions** — product intent, philosophy, scope, coaching content, and any behavior-level decision.
-   **AI Architect decisions** — architecture, runtime placement, ownership, and system-integration decisions.
-   **Lead Engineer responsibilities** — filling implementation detail, gathering repository evidence, writing tests, and reporting gaps or conflicts, strictly inside the boundaries Product and Architecture have already set.
-   **Repository evidence** — facts about the current state of the codebase, distinct from any of the above.

Engineering authors a specification; it does not author Product or Architecture decisions. Where a specification section would otherwise require Engineering to decide behavior, ownership, or architecture, Engineering records the item as open (see Pending Decisions, Repository Gaps, and Canonical Conflicts) instead of deciding it.

This boundary is the interpretive key for every other rule in this standard. A rule elsewhere in this document that appears to grant Engineering a Product or Architecture decision must be read as not doing so.

------------------------------------------------------------------------

# Applicability

This standard applies to every FITME task specification, present and future, regardless of the system or feature the task concerns.

This standard does not redefine the FITME engineering lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed) or the Source-of-Truth hierarchy documented in the Engineering Workflow. Both are inherited unchanged; where any rule in this standard conflicts with a higher canonical source, the higher source governs, and the conflict is documented per this standard's own conflict-handling rules rather than resolved by this standard itself.

This standard is itself subject to Head of Product + AI Architect approval before it governs any task specification as Canonical.

------------------------------------------------------------------------

# Canonical Source Requirements

Every task specification must maintain a single, flat, authoritative index of every canonical source it must remain consistent with. Every other section's own source citations are a filtered subset of that index; the index must never omit a source that another section then cites, and no section may cite a source not present in the index.

Citations must resolve to a verified, current repository path and must quote version identifiers exactly as they appear in the source document.

When two canonical sources overlap on the same topic, the more specific canonical source governs for that topic. This does not authorize Engineering to declare a winner between sources that genuinely conflict — see Pending Decisions, Repository Gaps, and Canonical Conflicts.

A specification must not add a canonical source that is not already governance-approved, and must not remove one because it appears unused by the current draft.

------------------------------------------------------------------------

# Repository Evidence Requirements

Every task specification must include one dated, factual snapshot of the repository — covering, at minimum, application/repository version, module inventory, composition/entry points relevant to the task, test count, and current runtime flow — that every other section's evidence claims cite back to, rather than re-deriving or restating independently.

This snapshot section contains only verifiable repository facts: no commentary, no narrative about how the facts were obtained, and no description of intended or future module structure. It is a snapshot, not a living document; if substantial time passes before implementation, it is retaken rather than edited in place, with the prior snapshot preserved in the task's Closure Record.

A module's responsibility must never be inferred from its name alone; it must be confirmed by reading the module or its tests.

------------------------------------------------------------------------

# Evidence Classification

Every factual claim in a specification must be labeled as exactly one of:

-   **Verified repository evidence** — a file, function, or behavior directly confirmed present in the repository.
-   **Canonical-document evidence** — a rule or shape sourced from a canonical source.
-   **Engineering inference** — a reasonable but unverified connection between the two above, explicitly labeled as inference and never presented as fact.
-   **Missing repository evidence (Repository Gap)** — explicitly absent, recorded rather than filled with inference dressed as fact.

When evidence is ambiguous, the more conservative classification governs (inference or Repository Gap, not verified).

------------------------------------------------------------------------

# Required Specification Structure

A task specification is organized as a sequence of major sections, each addressing one coherent concern of the task (e.g., purpose, scope, ownership, contracts, pipeline, failure handling, testing, acceptance, lifecycle, closure). Major sections are never merged, split, reordered, or renamed once approved, and existing sections are never removed; a specification evolves by populating and, where genuinely necessary, expanding sections, not by restructuring them.

Within each major section, the per-section authoring requirements below apply, using judgment about which of them a given section genuinely needs (see Per-Section Authoring Requirements). Purely procedural or administrative sections (status, lifecycle gates, review checklists, closure records) are not forced to carry subsections that make no sense for them (e.g., "Inputs/Outputs" for a status block).

A specification's structure is itself a governance artifact: changing it (adding, removing, merging, splitting, or reordering major sections) requires Head of Product + AI Architect approval, not an engineering judgment call.

------------------------------------------------------------------------

# Per-Section Authoring Requirements

Where relevant to a given major section, Engineering completes the following concerns:

-   **Purpose** — why the section exists.
-   **Canonical Sources** — the exact canonical sources the section must remain consistent with.
-   **Existing Repository Behaviour** — current repository implementation only, never intended or future behavior.
-   **Repository Evidence Required** — the files, modules, interfaces, and tests supporting the section's claims.
-   **Responsibilities** — the explicit responsibilities of whatever owns the concern.
-   **Ownership** — a single, unambiguous owner; shared ownership is forbidden unless repository evidence or an approved canonical source establishes it.
-   **Inputs / Outputs** — every input and output the concern involves.
-   **Runtime Interaction** — execution timing, caller, callee, and lifecycle, where the concern has a runtime dimension.
-   **Dependencies** — internal and external dependencies.
-   **Constraints** — architectural and product constraints bearing on the concern.
-   **Failure Modes** — expected failures and recovery.
-   **Required Tests** — unit, integration, contract, and regression coverage implied by the concern.
-   **Forbidden Changes** — what Engineering may not change about the concern.
-   **Definition of Complete** — the completion checklist specific to the concern.
-   **Claude Fill Instructions** — exactly what Engineering must produce for the concern.

Not every concern applies to every section. A concern is omitted only when it is genuinely irrelevant to that section, never because populating it would be inconvenient; an omitted concern is a deliberate authoring judgment, not an oversight, and the standard does not require a heading to be added merely to satisfy a formatting expectation.

------------------------------------------------------------------------

# Ownership and Responsibility Rules

Every capability, integration, and contract documented in a specification has exactly one owner. Ownership is stated explicitly, never implied by physical or textual proximity. Shared ownership is forbidden unless a canonical source or verified repository evidence already establishes it.

A specification documents ownership; it does not assign or change it. Where a capability appears to require a new ownership decision, that decision belongs to Architecture (for system/runtime ownership) or Product (for behavioral ownership), not to Engineering.

Any existing system's public contract may be called by a new capability; it may not be modified by one. An engineering activity that would change an existing system's contract, rather than merely calling into it, is out of scope for that capability and must be flagged, not implemented.

------------------------------------------------------------------------

# Runtime and Integration Documentation Rules

Where a task introduces or touches a runtime component, the specification documents: its invocation point, its caller, its timing (synchronous/asynchronous, and its position relative to other components in an existing sequence), its inputs and outputs, and its consumers. Placement must not require restructuring an existing component's invocation order, and must not introduce a second source of runtime truth, a second registry, or a second orchestration mechanism where one already exists.

Where a task integrates with an existing system, the specification documents, per integration: purpose, direction (read/write/both), owner, contract reference, failure handling, and test coverage. A specification's inventory of integrations is complete only when every system the task touches has such an entry; a task claims ownership of none of the systems it merely integrates with.

If the runtime component or shell a task depends on does not yet exist in the repository, this is recorded as a Repository Gap, and the question of who is responsible for building it is recorded as an Architecture Decision Pending — the specification does not assume an answer to either.

------------------------------------------------------------------------

# Contract Documentation Rules

A contract is a precise, testable interface agreement, not a narrative description. Every specification names its formal contracts and, for each, either:

-   cites the shape and owning source already fixed by an approved canonical specification, and documents conformance only (Engineering does not alter that shape), or
-   marks the contract as new, provides an engineering-ready structural proposal for Product/Architecture to approve against, and records the contract as Product Decision Pending / Architecture Decision Pending until approved.

A new contract is never marked final by Engineering. Adding a contract beyond those already named requires Product/Architecture approval.

------------------------------------------------------------------------

# Dependency and Traceability Rules

A specification documents, for its major capabilities: required modules, required contracts, and dependencies by category (e.g., runtime, persistence, memory, event, authority), distinguishing required from optional dependencies where repository evidence supports the distinction.

Traceability and dependency summaries (matrices, mapping tables) are derived artifacts: they are built after the substantive sections they summarize are complete, they introduce no relationship not already stated in the section they summarize, and they are kept in sync with those sections rather than allowed to drift. Where a specification already states a citation or relationship in its narrative sections, a summary table restates it rather than duplicating the underlying analysis a second time.

------------------------------------------------------------------------

# Testing Requirements

A specification maps its functional capabilities, contracts, and integrations to concrete categories of required test coverage (at minimum: unit, contract, integration, regression, and failure), such that nothing the specification defines ships untested. Each category traces back to the section(s) it covers: contract tests to the specification's Canonical Contracts, integration tests to its Integration Map, failure tests to its Failure Handling catalogue, and regression tests to its Repository Baseline.

New tests follow the conventions of the existing test suite (naming, structure, invocation method) rather than introducing a new testing pattern. A specification does not write implementation-specific test code; it lists required test cases by name or scenario, each traceable to the section it verifies, and leaves authoring the tests to implementation.

A contract that is Product Decision Pending or Architecture Decision Pending cannot yet have a test written against it; this is recorded as deferred, not silently dropped from the test plan.

------------------------------------------------------------------------

# Failure-Handling Documentation Requirements

Every failure mode named anywhere else in a specification is catalogued once, in one place, with a consistent structure: detection, owner, recovery, fallback, logging, and testing. The catalogue is built by walking every other section's own failure-related content; it does not invent failure modes not already implied elsewhere, and it does not omit one that is.

A fallback must resolve to a defined, safe state. A specification never defines a fallback that fabricates output in place of a genuine failure; where a system-level invariant already prohibits fabrication, the fallback must be consistent with that invariant, not merely consistent with convenience.

Where the concrete mechanism for detecting, retrying, or logging a failure is left open by a higher canonical source, this is recorded as Engineering Decision Pending, not as a Repository Gap — the distinction matters because one is a design decision still to be made, the other is missing evidence about what already exists.

------------------------------------------------------------------------

# Pending Decisions, Repository Gaps, and Canonical Conflicts

A specification distinguishes exactly these unresolved-item categories, and never mixes them:

-   **Repository Gap** — repository evidence that does not yet exist or could not be confirmed (e.g., a module not yet built, a measurement not yet taken).
-   **Product Decision Pending** — a behavioral, philosophical, or content decision that only Head of Product may make.
-   **Architecture Decision Pending** — a runtime, ownership, or system-design decision that only AI Architect may make.
-   **Engineering Decision Pending** — a decision a higher canonical source has explicitly and knowingly left to Engineering's own implementation judgment, as distinct from a decision Engineering merely has not yet made.
-   **Canonical Conflict** — two or more canonical sources (or two statements within the same canonical source) that disagree.

A Canonical Conflict is documented, never resolved, analyzed, or interpreted by Engineering. Its documentation consists of exactly three elements: the conflicting sources (quoted or precisely cited), the decision required to resolve them, and who owns that decision. No further commentary, no reasoning about which source should prevail, and no recommended resolution is included. Once those three elements are recorded, Engineering stops and escalates.

An unresolved item is recorded only when it is genuinely unresolved at the time of authoring. A specification does not pre-populate hypothetical gaps or decisions for situations that have not actually arisen; it records what is actually missing or actually undecided.

------------------------------------------------------------------------

# Forbidden Authoring Practices

Engineering, when authoring or populating a specification, does not:

-   redesign product behavior, coaching philosophy, or AI personality;
-   redefine architecture, runtime ownership, orchestration, or any previously approved contract;
-   change an authority boundary, an ownership assignment, or an execution order already fixed by an approved canonical source;
-   introduce a new system, engine, registry, or architectural layer without canonical approval;
-   introduce speculative behavior, speculative optimization, or speculative repository behavior not supported by evidence;
-   resolve a Product, Architecture, or Canonical conflict by inference, interpretation, or unilateral choice;
-   mark a specification READY or DONE, or self-certify a Product or Architecture review checklist, on its own authority;
-   describe, in the specification itself, how evidence was gathered, what happened during a review, or what a previous draft said — a specification states what is true and what is required, not the history of its own authoring.

Where repository evidence conflicts with an approved specification, Engineering stops work on the affected section and reports the conflict rather than resolving it by inference. A list of forbidden changes, once stated, applies globally; it is not narrowed by a later, more specific-sounding section, and it is not weakened by consolidation with another such list.

------------------------------------------------------------------------

# Cross-Section Consistency Requirements

Once a specification's sections are individually complete, they are reviewed together for: ownership consistency (no two sections assign a different owner to the same concern), terminology consistency (the same concept is named the same way everywhere it appears), runtime consistency, contract consistency, documentation consistency, testability (every capability traces to an existing or planned test), and traceability (every citation resolves back to the specification's own canonical-source index).

Where a genuine terminology or structural mismatch exists between two canonical sources referenced by the specification (for example, an older placeholder structure and a newer, more specific approved source), the mismatch is recorded as a Canonical Conflict rather than silently harmonized in either direction.

------------------------------------------------------------------------

# Section Completion and Exit Criteria

A section is complete only when: repository evidence is cited, canonical sources are referenced, ownership is unambiguous, runtime interaction (where relevant) is documented, dependencies are documented, forbidden changes are documented, required tests are identified, inputs/outputs (where relevant) are complete, and the section's own Definition of Complete is satisfied.

A section carrying an open Repository Gap, Product Decision Pending, Architecture Decision Pending, Engineering Decision Pending, or Canonical Conflict in a required, non-deferrable area has not met these exit criteria and is not marked complete — it states plainly why it is not yet complete instead.

------------------------------------------------------------------------

# READY Requirements

A specification reaches READY only when: the repository has been analyzed and documented per Repository Evidence Requirements; every contract is either documented and conformant to its owning source, or explicitly marked Product Decision Pending / Architecture Decision Pending pending approval; every dependency is documented; and no unresolved ambiguity remains in a section required for READY, as distinct from items legitimately deferred to implementation time.

Marking a specification READY is a Product/Architecture determination made after their review. A specification does not mark itself READY; Engineering's role is to report the current state of each condition above accurately, including any open items, so that determination can be made.

------------------------------------------------------------------------

# DONE Requirements

A task reaches DONE only when: implementation is complete as documented, all required tests pass, and documentation (Roadmap, Changelog, Architecture, and any other implicated canonical source) has been updated, both review checklists (Product and Architecture) are signed off, and the task is marked closed.

Implementation does not begin before READY. DONE is evaluated once, at actual task closure, not populated speculatively during specification authoring.

------------------------------------------------------------------------

# Product Review Requirements

Head of Product reviews a specification for product intent, philosophy, scope, and governance consistency against the Product Bible and any other product-level canonical source. This review is owned exclusively by Head of Product; Engineering does not fill in or self-certify this checklist. Engineering's role is limited to presenting the specification and surfacing the items most likely to require Product attention (open Product Decision Pending items, any Canonical Conflict with a Product dimension).

------------------------------------------------------------------------

# Architecture Review Requirements

AI Architect reviews a specification for runtime, ownership, composition, state ownership, persistence, memory, event-model, and isolation consistency against the Architecture canon and any other architecture-level canonical source. This review is owned exclusively by AI Architect; Engineering does not fill in or self-certify this checklist. Engineering's role is limited to presenting the specification and surfacing the items most likely to require Architecture attention (open Architecture Decision Pending items, any Canonical Conflict with an architectural dimension).

------------------------------------------------------------------------

# Engineering Self-Review Requirements

Before requesting Product or Architecture review, Engineering performs its own review verifying: every section is complete or explicitly and correctly marked otherwise; no placeholder or template-only text remains; no non-evidenced claim is asserted as fact; and every documented contract preserves previously approved ownership. This self-review is repeated after any substantial edit, not performed only once.

------------------------------------------------------------------------

# Engineering Handoff Requirements

Once a specification reaches READY, Engineering assembles a handoff package: the completed specification, a consolidated repository-evidence appendix (cross-referenced, not duplicated), all open questions and gaps consolidated into one list, an implementation sequence following the specification's own internal ordering, and an impact assessment. A specification is not handed off before it has passed READY.

------------------------------------------------------------------------

# Closure Record Requirements

A task's closure record — dates, repository version, commit hash, approvals, documentation updates, final status, lessons learned, and follow-up work items — is written once, at actual task closure. It is never pre-filled speculatively during specification authoring, and it is left empty until closure actually occurs.

------------------------------------------------------------------------

# Definition of Complete

This standard is complete when: every section above states a rule rather than an example of one; no rule is specific to any one FITME feature, engine, or task; every rule preserves, rather than alters, the FITME engineering lifecycle and Source-of-Truth hierarchy documented in the Engineering Workflow; the four unresolved-item categories and the Canonical Conflict category are each defined exactly once; and the document is reviewable, as a whole, by Head of Product + AI Architect without requiring reference to any single task's specification.

# End of Standard
