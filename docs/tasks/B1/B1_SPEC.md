# B1 --- Canonical Memory Decision

**Document:** `docs/tasks/B1/SPEC.md`\
**Version:** 1.1\
**Status:** APPROVED --- TASK CLOSED\
**Phase:** Architecture Remediation Program --- Phase B\
**Finding:** F11\
**Owner:** FITME AI Architecture\
**Blocks:** B2, B3, B4, B5 and Recommendation Engine implementation

------------------------------------------------------------------------

## 1. Objective

Define one canonical memory architecture for FITME and remove ambiguity
between existing user-memory representations, derived intelligence,
source history, generative persistent data, and authoritative
application state.

B1 is an architecture-foundation task.

It SHALL establish the canonical logical memory model, ownership
boundaries, memory categories, identity rules, authority rules,
lifecycle requirements, and compatibility direction for existing memory
data.

B1 SHALL NOT implement a broad memory migration or redesign downstream
engines.

------------------------------------------------------------------------

## 2. Architectural Decision

FITME SHALL have exactly one **Canonical User Memory Model** per
authenticated user.

The existing `coachMemory` model SHALL be treated as the migration base
and current logical root of canonical coach memory.

No parallel memory system SHALL be introduced.

Canonical memory SHALL represent the coach's durable, user-specific
learned knowledge.

The following SHALL remain distinct from canonical memory:

1.  Raw authoritative source history, including diary and activity
    records.
2.  Deterministically derived engine outputs that can be recomputed from
    source history.
3.  Generative persistent data that has not passed an approved authority
    boundary.
4.  Transient runtime/session state.
5.  Application configuration and non-user-scoped state.

These domains MAY contribute to memory but SHALL NOT be treated as
interchangeable representations of memory.

------------------------------------------------------------------------

## 3. Core Principle

The canonical model is a **logical ownership contract**, not a
requirement that every memory type immediately move into one physical
Firestore document or one JavaScript object.

Canonical means:

-   One recognized owner for durable coach knowledge.
-   One shared identity model.
-   One authority model.
-   One provenance model.
-   One lifecycle model.
-   One contract for how downstream systems consume memory.

Physical persistence MAY remain compatible with the current application
during remediation, provided no second competing memory authority is
created.

------------------------------------------------------------------------

## 4. Canonical Memory Definition

A record belongs to Canonical User Memory only when all of the following
are true:

1.  It represents durable knowledge about one authenticated user.
2.  Retaining it can improve future coaching.
3.  Its source or derivation is identifiable.
4.  Its authority tier is explicit.
5.  Its lifecycle can be managed.
6.  Its ownership belongs to the canonical memory domain.
7.  It is scoped to exactly one authenticated user.
8.  It is eligible for use by future coaching intelligence under defined
    confidence and authority rules.

Data that fails these conditions SHALL NOT be treated as canonical
memory.

------------------------------------------------------------------------

## 5. Canonical Memory Categories

The canonical logical model SHALL support the memory categories
established by the FITME Product Bible and AI Constitution:

-   Facts
-   Preferences
-   Coach Notes
-   Conversation Memories
-   Recurring Meals
-   Achievements
-   Recommendation Memory

Existing typed-memory categories MAY map into these canonical categories
where semantically equivalent.

`Habits` and `Patterns` require special treatment defined in Section 8
because they are recomputable derived intelligence rather than ordinary
durable memories.

Future memory categories MAY be added only through architecture
approval.

------------------------------------------------------------------------

## 6. Canonical Memory Record Contract

Every canonical memory record SHALL have a stable logical contract.

Minimum required metadata:

``` yaml
CanonicalMemoryRecord:
  id: string
  type: string
  value: any
  authority:
    tier: VALIDATED | AUTHORITATIVE
    source: string
  provenance:
    sourceType: string
    sourceRef: string | null
    derivedBy: string | null
  confidence: number | null
  createdAt: timestamp
  updatedAt: timestamp
  lastConfirmedAt: timestamp | null
  status: ACTIVE | SUPERSEDED | OBSOLETE
  schemaVersion: string
```

The exact physical field names MAY be adapted during implementation
planning, but the semantic contract SHALL be preserved.

Generative-only content SHALL NOT become canonical memory merely because
it is persisted.

------------------------------------------------------------------------

## 7. Memory Identity

Every canonical memory record SHALL have stable identity.

Identity SHALL support:

-   Updating an existing belief without uncontrolled duplication.
-   Superseding outdated knowledge.
-   Tracing the origin of a memory.
-   Preventing multiple competing active memories for the same semantic
    fact when the domain requires singularity.
-   Preserving history where useful without allowing obsolete records to
    influence current coaching.

Identity strategy MAY differ by memory type.

Examples:

-   A singular user fact may have one active semantic key.
-   A preference may evolve over time.
-   An achievement may be append-only.
-   A conversation memory may remain independently identifiable.

The implementation strategy for semantic keys is deferred until the
relevant persistence work, but duplicate competing authority is
forbidden.

------------------------------------------------------------------------

## 8. Habits and Patterns

Habit Engine and Pattern Engine outputs SHALL NOT become independent
canonical memory authorities.

They SHALL be classified as **Derived Intelligence Views**.

Rules:

1.  Raw authoritative history remains their source.
2.  Habit and Pattern outputs remain recomputable from source.
3.  Their existing persisted namespaces MAY remain for performance and
    continuity.
4.  Their persisted outputs SHALL carry explicit provenance and
    authority metadata according to the Authority Contract.
5.  Downstream systems SHALL consume them through approved engine/access
    contracts rather than assuming they are equivalent to manually or
    explicitly learned memories.
6.  Their existence SHALL NOT create a second memory system.

B5 --- Habit and Pattern Consumption Path SHALL define the approved
downstream consumption mechanism.

------------------------------------------------------------------------

## 9. Source History vs. Memory

Authoritative source history and canonical memory are separate domains.

Examples of source history:

-   Meal diary entries.
-   Weight records.
-   Workout records.
-   Activity records.
-   Other validated user logs.

Source history answers:

> What happened?

Canonical memory answers:

> What durable knowledge about this user should the coach retain?

Derived intelligence answers:

> What can the system infer deterministically from what happened?

These three concepts SHALL NOT be merged.

Canonical memory MAY reference source history through provenance.

It SHALL NOT duplicate raw history unnecessarily.

------------------------------------------------------------------------

## 10. Generative Persistent Data

Generative Persistent Data SHALL remain non-authoritative unless it
passes an explicitly approved validation and authority transition.

Persistence alone SHALL NOT grant canonical-memory status.

An LLM MAY propose a candidate memory.

The candidate SHALL remain generative until an approved deterministic,
user-confirmed, or otherwise architecturally authorized path promotes
it.

No LLM SHALL directly create authoritative canonical memory.

This rule inherits and preserves the REM-003 Generative
vs. Authoritative Boundary.

------------------------------------------------------------------------

## 11. Ownership

The Canonical User Memory Model SHALL have one architectural owner:

**Canonical Memory Domain**

Individual engines MAY:

-   Read approved memory.
-   Propose candidate memory.
-   Derive intelligence from authoritative source data.
-   Update memory only through an approved memory write contract.

Individual engines SHALL NOT:

-   Define competing memory schemas independently.
-   Persist durable coach knowledge into arbitrary namespaces and call
    it memory.
-   Bypass authority or provenance requirements.
-   Treat transient state as durable memory.

B2 and B3 SHALL formalize engine registration, state ownership, and
access boundaries.

------------------------------------------------------------------------

## 12. Read Contract Direction

Future downstream coaching systems, including the Recommendation Engine,
SHALL consume user memory through a canonical memory read contract.

They SHALL NOT be designed around direct knowledge of multiple competing
storage representations.

The read contract SHALL eventually provide a normalized view that can
combine:

-   Canonical durable memories.
-   Approved derived intelligence.
-   Relevant authoritative current state.

This does not authorize implementation in B1.

B1 establishes the architectural direction only.

------------------------------------------------------------------------

## 13. Write Contract Direction

All future durable memory writes SHALL pass through one approved
canonical memory write boundary.

The boundary SHALL enforce at minimum:

-   Authenticated user scope.
-   Memory type validity.
-   Authority eligibility.
-   Provenance.
-   Stable identity.
-   Lifecycle behavior.
-   Schema versioning.

Direct arbitrary writes to canonical memory by feature modules SHALL be
forbidden once the write contract is implemented.

The detailed persistence mechanics belong to B4 --- Persistence Contract
and, where applicable, C4 --- Typed Memory Server Write Path.

------------------------------------------------------------------------

## 14. Confidence

Confidence is part of canonical memory semantics.

Rules:

1.  Inferred knowledge SHOULD carry confidence.
2.  Explicitly user-confirmed facts MAY carry higher confidence
    according to future policy.
3.  Confidence SHALL NOT substitute for authority.
4.  High confidence SHALL NOT convert generative data into authoritative
    data.
5.  Confidence MAY change as new evidence appears.
6.  Downstream systems SHALL be able to distinguish confidence from
    authority.

Exact confidence scoring algorithms are out of scope for B1.

------------------------------------------------------------------------

## 15. Lifecycle

Canonical memory is dynamic.

The architecture SHALL support:

-   Creation.
-   Confirmation.
-   Update.
-   Supersession.
-   Obsolescence.
-   Re-evaluation.

Deleting history is not the default mechanism for handling changed
knowledge.

Where appropriate, old memory MAY remain traceable while being excluded
from active coaching through lifecycle status.

No obsolete memory SHALL continue influencing coaching as if current.

------------------------------------------------------------------------

## 16. Session and Account Isolation

Canonical memory SHALL always be scoped to the current authenticated
user.

REM-002 session lifecycle guarantees remain mandatory.

No:

-   Cached memory.
-   Candidate memory.
-   Derived memory view.
-   Pending memory write.

may survive an authentication reset in a way that can expose or apply
one user's state to another user.

------------------------------------------------------------------------

## 17. Compatibility With Current Architecture

B1 SHALL preserve the existing application while establishing a single
future direction.

Approved compatibility decision:

-   Existing `coachMemory` remains the migration base.
-   Existing typed memory SHALL be mapped into the canonical model
    rather than replaced by a parallel store.
-   Existing Habit and Pattern namespaces remain derived intelligence
    views.
-   Existing authoritative history remains source history.
-   Existing REM-003 authority metadata remains valid and SHALL be
    reused.
-   No bulk data migration is required by B1.
-   No Firestore collection change is required by B1.
-   No Firebase Function change is required by B1.

Any implementation proposal requiring a second memory store requires
explicit architecture rejection and redesign.

------------------------------------------------------------------------

## 18. Scope

B1 includes:

-   Canonical memory architectural decision.
-   Logical memory ownership.
-   Memory-domain classification.
-   Canonical record semantics.
-   Authority and provenance requirements.
-   Confidence semantics.
-   Lifecycle requirements.
-   Treatment of Habits and Patterns.
-   Treatment of source history.
-   Treatment of generative persistent data.
-   Compatibility direction for `coachMemory`.
-   Dependencies for B2--B5.

------------------------------------------------------------------------

## 19. Out of Scope

B1 SHALL NOT:

-   Implement a new memory database.
-   Perform bulk migration.
-   Refactor all existing memory code.
-   Create Recommendation Engine behavior.
-   Implement B2 Engine Contract and Registry.
-   Implement B3 State Ownership and Access Boundaries.
-   Implement B4 Persistence Contract.
-   Implement B5 Habit and Pattern Consumption Path.
-   Implement C4 server-side typed-memory writes.
-   Change product UX.
-   Change nutrition behavior.
-   Change Habit or Pattern detection algorithms.
-   Add new Firestore collections.
-   Allow LLMs to write authoritative memory directly.

------------------------------------------------------------------------

## 20. Architectural Invariants

1.  FITME has one canonical logical user-memory model.
2.  `coachMemory` is the migration base, not one of multiple competing
    memory systems.
3.  Raw source history is not canonical memory.
4.  Derived Habit and Pattern outputs are not independent memory
    authorities.
5.  Generative persistence does not imply authority.
6.  Confidence and authority are separate concepts.
7.  Every canonical memory has provenance.
8.  Every canonical memory is user-scoped.
9.  Canonical memory supports lifecycle and obsolescence.
10. No engine owns a private competing durable memory model.
11. Future Recommendation Engine consumption must rely on approved
    contracts, not ad hoc storage access.
12. No new physical storage architecture is introduced by B1.

------------------------------------------------------------------------

## 21. Engineering Review Requirements

Claude Code SHALL perform an Engineering Readiness Review only.

The review SHALL verify against the current repository:

1.  All current memory representations and write paths are identified.
2.  Existing `coachMemory` structure can serve as the migration base
    without contradiction.
3.  Habit and Pattern persistence is correctly classified as
    derived/recomputable.
4.  REM-003 authority metadata can coexist with this canonical model.
5.  No current authoritative source-history path is incorrectly
    reclassified as memory.
6.  No hidden second memory representation contradicts the
    one-canonical-model decision.
7.  B1 can be completed without implementation or migration.
8.  Dependencies and risks for B2, B3, B4 and B5 are identified.

Claude Code SHALL NOT implement code during this review.

If repository evidence contradicts this specification, the review SHALL
return `NOT READY` with exact file/function references and required SPEC
corrections.

If no blocking contradiction exists, the review SHALL return `READY`.

------------------------------------------------------------------------

## 22. Engineering Review Output Format

``` text
B1 — Canonical Memory Decision
Engineering Readiness Review

Status: READY | NOT READY

Repository Findings:
- ...

Architecture Compatibility:
- ...

Blocking Issues:
- None | ...

Required SPEC Corrections:
- None | ...

Downstream Notes for B2–B5:
- ...

Final Recommendation:
READY FOR APPROVAL | RETURN TO ARCHITECTURE
```

------------------------------------------------------------------------

## 23. Acceptance Criteria

B1 is complete only when:

-   [ ] Canonical memory is defined as one logical user-memory model.
-   [ ] `coachMemory` is formally designated as the migration base.
-   [ ] No parallel memory system is approved.
-   [ ] Source history, canonical memory, derived intelligence,
    generative persistent data, and transient state are explicitly
    separated.
-   [ ] Canonical ownership is defined.
-   [ ] Minimum memory record semantics are defined.
-   [ ] Authority and confidence are explicitly separated.
-   [ ] Provenance requirements are defined.
-   [ ] Memory lifecycle is defined.
-   [ ] Habit and Pattern outputs are classified as Derived Intelligence
    Views.
-   [ ] Generative data cannot directly become authoritative canonical
    memory.
-   [ ] Session/account isolation requirements are preserved.
-   [ ] Engineering Readiness Review returns `READY`.
-   [ ] Product/Architecture Approval is recorded.
-   [ ] Relevant project documentation is synchronized.
-   [ ] Commit is created.
-   [ ] B1 is marked closed.
-   [ ] B2 is explicitly marked `NEXT`.

------------------------------------------------------------------------

## 24. Implementation Gate

B1 is primarily an architecture decision.

No production implementation SHALL begin merely because this SPEC
exists.

After Engineering Review returns `READY`, FITME Product/Architecture
Approval SHALL lock the decision.

Any code changes discovered as necessary during Engineering Review SHALL
be scoped as an explicit approved implementation step or assigned to the
appropriate downstream Phase B task.

------------------------------------------------------------------------

## 25. Documentation Closure Requirements

At B1 closure, update:

-   `Roadmap`
-   `Changelog`
-   `FITME AI Architecture Remediation Plan`
-   `docs/tasks/B1/SPEC.md`
-   Any architecture document whose canonical-memory definition changed
    in practice

The closure update SHALL:

-   Mark B1 completed.
-   Record the approved canonical-memory decision.
-   Record whether B1 required code changes.
-   Mark **B2 --- Engine Contract and Registry** as `NEXT`.

------------------------------------------------------------------------

## 26. Next Task

After B1 is approved, documented, committed and closed:

**B2 --- Engine Contract and Registry**

Status after B1 closure:

`NEXT`

------------------------------------------------------------------------

# Engineering Review Resolution (v1.1)

This section records the closure of B1 following Engineering Readiness Review and Product/Architecture Approval. It does not alter the canonical decision recorded in Sections 1--20 above.

- **Engineering Review:** `READY`
- **Product/Architecture Approval:** `APPROVED`
- **Implementation:** No production code changes required. B1 is an architecture decision only; the current repository already satisfies its preconditions without modification.
- **Canonical decision locked.** FITME has exactly one Canonical User Memory Model per authenticated user. `coachMemory` is the migration base and current logical root of canonical coach memory. No parallel memory system is approved.
- **B2 --- Engine Contract and Registry** is marked `NEXT`.

## Downstream Notes (Approved)

**B2 --- Engine Contract and Registry**
Must define registration and ownership for Habit and Pattern producers and prevent unregulated direct writes.

**B3 --- State Ownership and Access Boundaries**
Must formalize ownership and access for:
- `coachMemory`
- `coachEvents`
- `coachDay`
- `quickItems`
- `favoriteMeals`

**B4 --- Persistence Contract**
Must:
- Reconcile the REM-003 Authority Contract structure with the Canonical Memory Record.
- Define the Canonical Memory Write Boundary.
- Decide how `coachMemory` and `users/{uid}/memories` integrate without becoming a parallel system.
- Decide the status of `quickItems` and `favoriteMeals` relative to Recurring Meals.
- Define provenance and lifecycle for legacy `observations`/`preferences` before any migration or reactivation.

**B5 --- Habit and Pattern Consumption Path**
Must define an official consumer for Habits and Patterns, since they currently have no active consumer.
