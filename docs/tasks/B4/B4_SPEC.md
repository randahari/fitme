# B4 — Persistence Contract

**Document:** `docs/tasks/B4/B4_SPEC.md`  
**Version:** 1.0  
**Status:** CLOSED  
**Implementation:** COMPLETED  
**Engineering Readiness Review:** READY  
**Implementation Review:** APPROVED  
**Implementation Version:** `2.23.0`  
**Closure Date:** 2026-07-18  
**Automated Tests (final):** `170 passed / 0 failed`  
**Phase:** Architecture Remediation Program — Phase B  
**Findings:** F4, F5  
**Owner:** FITME AI Architecture  
**Depends On:**  
- B1 — Canonical Memory Decision (CLOSED)  
- B2 — Engine Contract and Registry (CLOSED)  
- B3 — State Ownership and Access Boundaries (CLOSED)  
- REM-002 — Session State Reset and Account Isolation (CLOSED)  
- REM-003 — Generative vs. Authoritative Boundary (CLOSED)  

**Blocks:**  
- B5 — Habit and Pattern Consumption Path (now unblocked)  
- Recommendation Engine implementation (now unblocked, subject to B5)  
- Initiative Engine implementation  
- Decision Engine implementation  

---

## 1. Objective

Define one explicit, enforceable and minimal persistence contract for FITME.

B4 SHALL establish:

- Which system components are allowed to request durable writes.
- Which component owns execution of durable writes.
- How authoritative, derived, generative and transient data are persisted.
- How write requests are validated before persistence.
- How session validity, authority metadata, state ownership and engine orchestration are preserved.
- How write failures, retries, conflicts and partial failures are handled.
- How persistence behavior remains deterministic and testable.
- How future engines persist without creating direct Firestore coupling or parallel write authorities.

B4 SHALL remove reliance on ad hoc persistence patterns in which application code or engines write directly to Firestore without a shared contract.

B4 SHALL preserve approved current product behavior unless a change is explicitly required to close Findings F4 or F5.

---

## 2. Problem Statement

FITME currently contains several persistence styles:

- General profile persistence through broad profile-save helpers.
- Direct document writes from selected engines.
- Writes that swallow errors.
- Writes that throw and implement local rollback.
- User-confirmed authoritative writes.
- Derived-intelligence writes.
- Generative persistent data writes.
- Firestore writes that are mixed with state mutation and UI behavior.
- Persistence logic embedded directly inside engine or feature code.

These patterns create architectural risks:

1. No single logical persistence authority.
2. Inconsistent error behavior.
3. Inconsistent rollback behavior.
4. Inconsistent retry behavior.
5. Different write paths may update overlapping document surfaces.
6. A successful in-memory mutation may be incorrectly treated as a successful durable write.
7. A stale session may complete an asynchronous write after account switch.
8. Future engines may add new direct Firestore writes and bypass state ownership or authority boundaries.
9. Conflict handling is undefined.
10. Large merged profile writes may unintentionally overwrite unrelated state.
11. Persistence outcomes are difficult to test independently from business logic.
12. Engine success is not clearly separated from persistence success.

B4 SHALL replace architectural ambiguity with one approved persistence contract.

---

## 3. Architectural Decision

FITME SHALL have exactly one logical **Persistence Gateway** responsible for durable client-side persistence.

The Persistence Gateway SHALL be the only approved application-layer component that executes Firestore writes on behalf of participating domains after B4 migration.

Application features, engines, state owners and UI flows MAY create persistence requests.

They SHALL NOT directly execute durable writes once their write path is migrated under B4.

The Persistence Gateway SHALL:

- Accept typed persistence requests.
- Validate request structure.
- Validate session scope.
- Validate ownership scope.
- Validate authority metadata where required.
- Resolve the approved repository adapter.
- Execute the write.
- Normalize the result.
- Apply retry rules when approved.
- Surface conflicts and failures.
- Avoid exposing raw Firestore behavior to engines.
- Produce diagnostics without unnecessary personal data.

The Persistence Gateway SHALL NOT:

- Own product logic.
- Decide what the user should do.
- Generate recommendations.
- Become a state store.
- Become a memory store.
- Infer missing authority.
- Infer missing ownership.
- silently convert failed writes into success.
- allow unrestricted arbitrary document paths.
- replace Firestore Security Rules.
- replace REM-002 session lifecycle guarantees.
- replace REM-003 authority semantics.
- replace B3 state ownership.

No second competing persistence gateway or generic direct-write abstraction SHALL be introduced.

---

## 4. Core Principles

The B4 Persistence Contract SHALL follow these principles:

1. **One logical persistence authority**  
   Durable application writes SHALL pass through one logical gateway.

2. **Intent before implementation**  
   Callers describe what is being persisted. They do not control Firestore mechanics.

3. **Ownership before write**  
   A caller may request persistence only for state it is authorized to own or submit through an approved boundary.

4. **Authority before authoritative persistence**  
   Authoritative data SHALL carry valid REM-003 authority metadata before persistence.

5. **Session validity before and after async work**  
   User-scoped writes SHALL verify REM-002 session generation before write execution and before applying completion effects.

6. **No hidden cross-domain writes**  
   A repository adapter SHALL update only its declared durable surface.

7. **No broad merge by default**  
   Writes SHALL use the smallest safe document/field scope.

8. **Persistence success is explicit**  
   In-memory mutation and engine execution SHALL NOT imply durable success.

9. **Failure is observable**  
   Failures SHALL be normalized and diagnosable.

10. **Retry is bounded**  
    Retry SHALL be allowed only for approved transient failures.

11. **No retry of invalid intent**  
    Validation, ownership, authority and conflict failures SHALL NOT be retried automatically.

12. **No silent data loss**  
    A failed write SHALL not discard the caller’s approved pending state without an explicit recovery policy.

13. **No silent data fabrication**  
    The gateway SHALL never invent defaults to make an invalid write request pass.

14. **Deterministic contracts**  
    The same valid request and repository state SHALL produce predictable write behavior.

15. **Incremental migration**  
    B4 SHALL migrate only the required current write paths without forcing a full repository rewrite.

---

## 5. Definitions

### 5.1 Durable State

State stored beyond the current runtime session, including Firestore-backed profile data, day logs, derived intelligence and user-managed memory.

### 5.2 Persistence Request

A typed request submitted to the Persistence Gateway describing an approved durable mutation.

### 5.3 Persistence Operation

The concrete repository write executed after request validation.

### 5.4 Persistence Result

A normalized outcome returned by the gateway.

### 5.5 Repository Adapter

A scoped component that maps one approved logical persistence operation to Firestore.

### 5.6 Durable Surface

The exact document and field scope owned by one repository adapter.

### 5.7 Authoritative Data

Data that FITME treats as trusted source history or approved user/system truth under REM-003.

### 5.8 Derived Intelligence

Recomputable outputs such as Habit and Pattern views that are not canonical source history.

### 5.9 Generative Persistent Data

LLM-generated content that may be stored but remains non-authoritative unless promoted through an approved validation and authority boundary.

### 5.10 Transient State

Runtime-only state that SHALL NOT be persisted through the B4 gateway unless a future SPEC reclassifies it.

### 5.11 Conflict

A case where the persistence request was valid when created but cannot be safely applied because the durable state changed or a version precondition no longer holds.

### 5.12 Write Receipt

A normalized record of what the gateway attempted and whether the durable operation succeeded.

---

## 6. Persistence Domain Classification

Every persistence request SHALL declare one approved data domain:

```yaml
PersistenceDomain:
  SOURCE_HISTORY
  CANONICAL_MEMORY
  DERIVED_INTELLIGENCE
  GENERATIVE_PERSISTENT
  USER_PROFILE
  SYSTEM_METADATA
```

### 6.1 SOURCE_HISTORY

Examples:

- Meals.
- Daily calorie/macronutrient totals.
- Workouts.
- Water.
- Steps.
- Weight history.
- Measurement history.

Requirements:

- Must be authoritative before persistence.
- Must use the narrowest approved repository surface.
- Must not be overwritten by derived or generative data.
- Must preserve user ownership and session scope.

### 6.2 CANONICAL_MEMORY

Examples:

- Approved user-stated facts.
- Approved preferences.
- Approved canonical coach-memory records.

Requirements:

- Must conform to B1 canonical-memory decisions.
- Must not create a second memory authority.
- Must preserve memory lifecycle and source metadata.
- Must not persist Habit or Pattern views as canonical memory unless a future approved promotion contract explicitly does so.

### 6.3 DERIVED_INTELLIGENCE

Examples:

- Habit Engine output.
- Pattern Engine output.
- Adaptive calculation artifacts where approved.
- Recomputable intelligence metadata.

Requirements:

- Must identify producer engine.
- Must identify producer version.
- Must be safe to recompute.
- Must not be treated as source history.
- Must not overwrite canonical memory.
- Must use producer-owned durable surfaces defined by B3.

### 6.4 GENERATIVE_PERSISTENT

Examples:

- Weekly menu proposals.
- LLM-created candidate content.
- Non-authoritative generated plans.

Requirements:

- Must remain explicitly non-authoritative.
- Must carry REM-003 authority metadata indicating generative status.
- Must not be consumed by deterministic engines as fact unless promoted through a future approved contract.
- Must not be written into source-history fields.

### 6.5 USER_PROFILE

Examples:

- Goal settings.
- Coach preferences.
- Dark mode or user configuration if approved for durable storage.
- Stable onboarding information.

Requirements:

- Must be user-owned.
- Must use field-scoped profile updates.
- Must not include unrelated engine-owned state in the same request.

### 6.6 SYSTEM_METADATA

Examples:

- Migration version.
- Last successful engine persistence timestamp.
- Persistence schema version.
- Approved internal bookkeeping.

Requirements:

- Must have an explicit owner.
- Must not contain user content unless necessary.
- Must not become an unbounded diagnostics store.

---

## 7. Canonical Persistence Request Contract

Every durable mutation SHALL be expressed semantically as:

```yaml
PersistenceRequest:
  requestId: string
  operation: string
  domain: PersistenceDomain
  owner: string
  userId: string | null
  sessionGeneration: string | number | null
  payload: any
  authority: AuthorityMetadata | null
  expectedVersion: string | number | null
  idempotencyKey: string | null
  createdAt: timestamp
  metadata:
    engineId: string | null
    engineVersion: string | null
    trigger: string | null
    runId: string | null
    source: string | null
```

Physical JavaScript shape MAY differ, but these semantics SHALL be preserved.

### 7.1 `requestId`

- Required.
- Unique per persistence request.
- Used for diagnostics and correlation.
- SHALL NOT be reused for a different logical mutation.

### 7.2 `operation`

- Required.
- Must be selected from a closed approved operation catalog.
- Arbitrary Firestore path or method names are forbidden.

### 7.3 `domain`

- Required.
- Must match the operation’s approved domain.

### 7.4 `owner`

- Required.
- Identifies the B3 state owner or approved feature owner submitting the request.
- Must match the operation’s allowed owner list.

### 7.5 `userId`

- Required for user-scoped writes.
- Must match the authenticated session user.
- `null` is allowed only for explicitly approved non-user-scoped writes.

### 7.6 `sessionGeneration`

- Required for asynchronous user-scoped writes.
- Must be captured before async work begins.
- Must be checked before repository execution.
- Must be checked again before applying completion callbacks or in-memory success markers.

### 7.7 `payload`

- Required unless the operation contract explicitly allows `null`.
- Must be validated by the operation-specific validator.
- Must not include unrestricted global state.

### 7.8 `authority`

- Required for authoritative and generative persistence.
- Optional only when the operation is explicitly authority-neutral.
- Must be validated through the existing REM-003 Authority Contract.

### 7.9 `expectedVersion`

- Optional.
- Used for optimistic concurrency when the repository supports a version precondition.
- A mismatch SHALL produce `CONFLICT`.

### 7.10 `idempotencyKey`

- Required for operations that may be retried or duplicated by lifecycle behavior.
- Must be stable for the same intended mutation.
- Must not be reused for different payloads.

### 7.11 `metadata`

- Optional diagnostic and orchestration context.
- Must not grant authority.
- Must not grant ownership.
- Must not override the declared operation.

---

## 8. Persistence Result Contract

Every gateway call SHALL return or resolve to:

```yaml
PersistenceResult:
  requestId: string
  operation: string
  status: SUCCESS | NO_OP | CONFLICT | REJECTED | FAILED | STALE_SESSION
  durable: boolean
  changed: boolean | null
  version: string | number | null
  error:
    code: string | null
    message: string | null
    retryable: boolean
  receipt:
    repository: string | null
    target: string | null
    committedAt: timestamp | null
    attemptCount: number
```

Rules:

- `SUCCESS` means the durable operation completed.
- `NO_OP` means the request was valid but no durable change was necessary.
- `CONFLICT` means the request could not be safely applied due to a version/state conflict.
- `REJECTED` means the request violated contract, ownership, authority or payload rules.
- `FAILED` means repository execution failed.
- `STALE_SESSION` means REM-002 invalidated the request.
- `durable: true` SHALL appear only after confirmed repository success.
- `changed` SHALL indicate whether durable data changed.
- A swallowed repository error SHALL never return `SUCCESS`.
- Raw Firestore error objects SHALL not be exposed directly to engines or UI.

---

## 9. Persistence Gateway Responsibilities

The gateway SHALL execute the following pipeline:

```text
Receive Request
→ Validate Request Structure
→ Resolve Operation Definition
→ Validate Owner
→ Validate Domain
→ Validate Session
→ Validate Authority
→ Validate Payload
→ Validate Idempotency Requirements
→ Resolve Repository Adapter
→ Execute Repository Operation
→ Normalize Result
→ Apply Bounded Retry If Allowed
→ Re-check Session Before Completion Effects
→ Return Persistence Result
```

The gateway SHALL NOT skip a validation stage because a request came from a registered engine.

Engine registration under B2 provides execution eligibility only.

It does not provide persistence authority.

---

## 10. Operation Catalog

B4 SHALL use a closed operation catalog.

The initial logical catalog SHALL include only operations required by current approved behavior.

Illustrative operation IDs:

```text
SOURCE_HISTORY_SAVE_DAY
SOURCE_HISTORY_APPEND_WEIGHT
SOURCE_HISTORY_APPEND_MEASUREMENT
USER_PROFILE_UPDATE_FIELDS
DERIVED_HABITS_REPLACE
DERIVED_PATTERNS_REPLACE
DERIVED_ADAPTIVE_PROPOSAL_APPLY
GENERATIVE_WEEKLY_PLAN_SAVE
CANONICAL_MEMORY_UPSERT
CANONICAL_MEMORY_DELETE
SYSTEM_METADATA_UPDATE
```

Engineering Readiness Review SHALL verify the exact current operation set against the repository.

Rules:

1. Each operation SHALL define:
   - Allowed owner(s).
   - Domain.
   - Repository adapter.
   - Payload validator.
   - Authority requirement.
   - Session requirement.
   - Idempotency requirement.
   - Conflict policy.
   - Retry policy.
   - Durable surface.

2. Callers SHALL not submit arbitrary operation strings.

3. An unknown operation SHALL return `REJECTED / UNKNOWN_OPERATION`.

4. An operation SHALL not update a durable surface outside its declaration.

5. New operations require architecture approval or an approved task SPEC.

---

## 11. Repository Adapter Contract

Each repository adapter SHALL conform semantically to:

```yaml
RepositoryAdapter:
  id: string
  operations: string[]
  execute(request, context) -> RepositoryResult | Promise<RepositoryResult>
```

Normalized repository result:

```yaml
RepositoryResult:
  status: SUCCESS | NO_OP | CONFLICT | FAILED
  changed: boolean | null
  version: string | number | null
  target: string | null
  error:
    code: string | null
    retryable: boolean
```

Repository adapters SHALL:

- Own Firestore path construction for their operations.
- Own Firestore API selection (`set`, `update`, transaction, batch).
- Use the narrowest approved mutation.
- Return normalized errors.
- Avoid UI work.
- Avoid engine logic.
- Avoid authority inference.
- Avoid session inference.
- Avoid mutating global runtime state.
- Be independently testable where practical.

Repository adapters SHALL NOT expose a generic method such as:

```javascript
write(path, data)
```

to engines or arbitrary feature code.

Generic unrestricted path-based write APIs are forbidden.

---

## 12. Durable Surface Registry

B4 SHALL define one logical durable-surface registry.

Each operation SHALL map to one owned durable surface.

Illustrative surfaces:

```yaml
DurableSurface:
  id: USER_PROFILE_CORE
  path: users/{uid}
  fields:
    - name
    - age
    - gender
    - height
    - currentWeight
    - goal
    - goalKcal
    - coachStyle
    - coachChatter
  owner: userProfileState
```

```yaml
DurableSurface:
  id: DERIVED_HABITS
  path: users/{uid}
  fields:
    - coachMemory.habits
    - coachMemory.habitsMeta
  owner: habitState
```

```yaml
DurableSurface:
  id: DERIVED_PATTERNS
  path: users/{uid}
  fields:
    - coachMemory.patterns
    - coachMemory.patternsMeta
  owner: patternState
```

Rules:

1. Two owners SHALL NOT write the same field unless an explicit shared-write contract exists.
2. Shared broad `merge:true` writes SHALL NOT be used to bypass field ownership.
3. The adapter SHALL include only the fields approved for the selected surface.
4. Unknown payload fields SHALL be rejected or stripped according to operation contract.
5. A repository adapter SHALL not write the entire in-memory `userProfile` object unless explicitly approved.
6. Durable-surface definitions SHALL be inspectable for tests and diagnostics.
7. Surface ownership SHALL align with B3.

---

## 13. Profile Persistence Rules

The existing profile document contains multiple domains.

B4 SHALL treat it as a shared physical document with multiple logical durable surfaces.

Rules:

- The physical existence of one Firestore document SHALL NOT imply one state owner.
- `saveProfile()`-style full-object merging SHALL NOT remain the general persistence mechanism for migrated operations.
- Field-scoped updates SHALL be preferred.
- Unrelated owner fields SHALL not be included in a request.
- Feature code SHALL not pass the complete `userProfile` object merely because it is convenient.
- User profile settings, derived habits, derived patterns, trigger metadata and adaptive state SHALL be treated as separate logical surfaces.
- Existing broad profile-save behavior MAY remain temporarily for out-of-scope paths, but no new code SHALL use it.
- Migration priority SHALL focus on B4-critical engine and AI-core write paths.

---

## 14. Source History Persistence

Source history is authoritative and must be protected.

Requirements:

1. Meal, workout, water, steps, weight and measurement writes SHALL use source-history operations.
2. AI-generated nutrition SHALL pass REM-001 validation and REM-003 authority promotion before source-history persistence.
3. Generative content SHALL never directly write source-history fields.
4. Day-document writes SHALL preserve unrelated day fields.
5. Append-style histories SHALL avoid read-modify-write races where feasible.
6. If an operation updates multiple logically dependent fields, the repository SHALL use a transaction or atomic write method.
7. Derived engines SHALL read source history but SHALL not modify it.
8. B4 SHALL not redefine nutrition validation rules.
9. B4 SHALL not redefine source-history ownership established by B3.

---

## 15. Canonical Memory Persistence

B4 SHALL preserve the B1 decision.

Rules:

1. FITME has one canonical logical memory model.
2. The persistence gateway SHALL not create or authorize a parallel memory store.
3. Memory operations SHALL distinguish:
   - User-stated memory.
   - Approved canonical memory updates.
   - Derived intelligence.
   - Generative persistent content.
4. Habit and Pattern outputs SHALL remain Derived Intelligence Views.
5. A future promotion of derived or generative data into canonical memory requires a separate approved promotion contract.
6. Canonical-memory writes SHALL preserve source, confidence, status and timestamps.
7. Memory deletion, rejection, archival and supersession SHALL use explicit operations.
8. A generic profile merge SHALL not be used as the canonical memory contract.
9. Firestore rules remain an independent enforcement layer and may require future server-side write architecture for certain memory sources.
10. B4 SHALL not implement the future typed-memory server write path tracked under Phase C.

---

## 16. Derived Intelligence Persistence

Derived intelligence SHALL be persisted through producer-scoped operations.

### 16.1 Habit Engine

The Habit Engine SHALL submit a `DERIVED_HABITS_REPLACE` request.

The request SHALL include:

- Full recomputed habit view.
- `habitsMeta`.
- Producer engine ID.
- Producer version.
- Source fingerprint or equivalent idempotency context where available.
- Authority metadata identifying deterministic engine output.
- Session generation.

The Habit Engine SHALL NOT write directly to Firestore after migration.

### 16.2 Pattern Engine

The Pattern Engine SHALL submit a `DERIVED_PATTERNS_REPLACE` request.

The request SHALL include:

- Full recomputed pattern view.
- `patternsMeta`.
- Producer engine ID.
- Producer version.
- Source fingerprint.
- Expected previous fingerprint/version where used.
- Authority metadata.
- Session generation.

The current Pattern Engine rollback behavior SHALL be replaced or adapted so that:

- In-memory success markers are not finalized before durable success.
- A failed gateway result leaves the engine retryable.
- A conflict does not overwrite newer durable state.
- The engine receives an explicit persistence result.

### 16.3 Adaptive TDEE

The deterministic proposal calculation itself does not grant persistence authority.

User-approved application of an adaptive update SHALL:

- Use an approved persistence operation.
- Carry authority metadata for user-approved deterministic adaptation.
- Persist only the adaptive-owned profile fields.
- Return explicit durable success or failure.
- Not mark the update applied if persistence fails.

### 16.4 Trigger Engine

Trigger state such as daily budget, fired types and event log SHALL use trigger-owned persistence operations if included in B4 migration scope.

The Trigger Engine SHALL not use a broad profile save that includes unrelated profile or engine state.

---

## 17. Generative Persistent Data

Generative persistent data SHALL use dedicated operations.

Requirements:

- Must carry REM-003 generative authority metadata.
- Must be stored in an approved non-authoritative surface.
- Must not be read as source fact by deterministic engines.
- Must not share a source-history operation.
- Must not be silently promoted because a user opened or viewed it.
- Promotion into authoritative state requires a separate validated user action.
- A failed generative persistence write SHALL not affect source-history data.
- Retry MAY be allowed only when the operation is idempotent.

---

## 18. Session Safety

B4 SHALL preserve REM-002.

For every user-scoped asynchronous write:

1. Capture the current session generation before async work.
2. Include it in the persistence request.
3. Gateway validates it before repository execution.
4. Repository completion SHALL not be applied to runtime state until session validity is checked again.
5. Sign-out or account switch SHALL invalidate pending requests.
6. A stale request SHALL return `STALE_SESSION`.
7. A stale request SHALL not mutate the new user’s runtime state.
8. A stale request SHALL not retry.
9. A stale request SHALL not be converted to a generic failure.
10. No second session-generation mechanism SHALL be introduced.

Where Firestore execution has already committed before a session becomes stale:

- The durable write remains committed to the original authenticated user.
- Completion effects for the stale runtime SHALL be suppressed.
- The result SHALL be logged as committed but stale-on-completion.
- The new session SHALL not receive the old session’s completion state.

---

## 19. Authority Validation

B4 SHALL preserve REM-003.

Rules:

1. The gateway SHALL validate authority metadata for operations that require it.
2. Missing authority SHALL produce `REJECTED / AUTHORITY_REQUIRED`.
3. Invalid authority/source combination SHALL produce `REJECTED / AUTHORITY_INVALID`.
4. Generative authority SHALL not be accepted for source-history operations.
5. Deterministic engine authority SHALL be accepted only for approved derived-intelligence operations.
6. User-confirmed AI estimates SHALL be accepted only after REM-001 revalidation.
7. Repository adapters SHALL not modify authority metadata.
8. The gateway SHALL not infer authority based on caller name.
9. Engine success SHALL not grant authority.
10. UI confirmation alone SHALL not bypass validation rules.

---

## 20. Ownership Validation

B4 SHALL preserve B3.

Rules:

1. Every operation SHALL declare allowed owners.
2. A caller SHALL identify its owner.
3. Owner mismatch SHALL produce `REJECTED / OWNER_NOT_ALLOWED`.
4. One engine SHALL not persist another engine’s owned state.
5. The orchestrator SHALL not become the owner of engine data.
6. The Persistence Gateway SHALL not become the owner of persisted data.
7. Repository adapters execute writes but do not own the domain state.
8. Shared physical documents SHALL still respect logical field ownership.
9. Ownership metadata SHALL be testable.
10. No operation may use a generic “system” owner to bypass boundaries.

---

## 21. Atomicity

B4 SHALL define atomicity at the operation level.

Rules:

1. One persistence request SHALL represent one logical durable mutation.
2. Fields that must succeed together SHALL be written atomically.
3. Independent domain mutations SHOULD be separate requests.
4. Multi-document atomic operations SHALL use Firestore transactions or batches when required.
5. A caller SHALL not assume multiple separate successful writes form one atomic operation.
6. If current behavior requires two dependent writes, the Engineering Review SHALL decide whether:
   - they belong in one transaction, or
   - one write is authoritative and the other is recoverable derived state.
7. Atomicity SHALL not be added merely for convenience where it increases contention.
8. B4 SHALL not create distributed-transaction semantics outside Firestore capabilities.

---

## 22. Retry Policy

Automatic retries SHALL be bounded and operation-specific.

### 22.1 Retryable Failures

Examples MAY include:

- Temporary network unavailability.
- Firestore transient internal errors.
- Retryable transaction contention.
- Temporary offline state where local SDK semantics are approved.

### 22.2 Non-Retryable Failures

The gateway SHALL not automatically retry:

- Invalid request.
- Unknown operation.
- Ownership violation.
- Authority violation.
- Payload validation failure.
- Stale session.
- Explicit conflict requiring recomputation.
- Permission denied.
- Missing authentication.
- Unsupported schema version.
- Non-idempotent operation without an idempotency key.

### 22.3 Retry Limits

Initial policy:

- Maximum automatic attempts: 3.
- Exponential or bounded backoff.
- Retry count included in result receipt.
- Session validity checked before every retry.
- The same idempotency key SHALL be reused.
- Retry SHALL stop immediately on non-retryable classification.

Engineering Review MAY adjust numeric limits if current Firebase SDK behavior requires it.

---

## 23. Idempotency

Operations exposed to duplicate lifecycle triggers or retry SHALL define idempotency behavior.

Rules:

1. Idempotency requirements SHALL be operation-specific.
2. Replacement operations such as derived-view replace MAY be naturally idempotent when payload and version are unchanged.
3. Append operations require an explicit stable entry ID or idempotency key.
4. The gateway SHALL reject retryable non-idempotent operations that lack an idempotency key.
5. The same idempotency key with different payload content SHALL produce `REJECTED / IDEMPOTENCY_MISMATCH`.
6. Idempotency SHALL be scoped to user and operation.
7. Idempotency metadata SHALL not grow without bounds.
8. B4 SHALL not require a new Firestore collection unless Engineering Review proves it necessary.
9. Existing deterministic IDs SHOULD be reused where safe.
10. Engine run IDs alone SHALL not automatically be treated as idempotency keys unless the operation contract approves it.

---

## 24. Conflict Handling

B4 SHALL distinguish conflicts from failures.

A conflict occurs when a request is structurally valid but cannot be safely applied because durable state no longer matches the expected state.

Examples:

- Pattern fingerprint/version changed.
- User edited a profile field after an engine prepared a write.
- A newer derived view was already persisted.
- A transaction precondition failed.

Rules:

1. Conflicts SHALL return `CONFLICT`.
2. Conflicts SHALL not be automatically converted into overwrite.
3. Conflict handling is operation-specific.
4. Derived engines MAY recompute from source after conflict.
5. User profile updates MAY require reload and user retry.
6. Generative content MAY be discarded or re-saved under a new version if non-authoritative.
7. The gateway SHALL not choose product behavior after conflict.
8. Last-write-wins SHALL not be the default for overlapping owner fields.
9. Expected version/fingerprint SHOULD be used where stale overwrite risk is material.
10. Conflict diagnostics SHALL avoid storing full personal payloads.

---

## 25. Rollback Policy

B4 SHALL not promise rollback beyond what the underlying atomic operation can guarantee.

Rules:

1. If a Firestore transaction or batch fails, no partial commit SHALL be reported.
2. If a single write fails, the runtime owner SHALL retain or restore its prior committed-state representation.
3. In-memory state SHALL not be finalized as persisted before `SUCCESS`.
4. A feature MAY optimistically update UI only if it has an explicit rollback or pending-state model.
5. Rollback logic SHALL remain inside the state owner, not the repository adapter.
6. The gateway returns the result required for the owner to commit or rollback runtime state.
7. The gateway SHALL not mutate arbitrary owner state.
8. A committed write SHALL not be “rolled back” by issuing a blind compensating write unless explicitly specified.
9. Compensating transactions require separate architecture approval.
10. Pattern Engine’s existing local rollback behavior SHALL be aligned with this contract.

---

## 26. In-Memory Commit Protocol

State owners SHALL distinguish:

```text
candidate state
→ pending persistence
→ durably committed state
```

Rules:

1. A state owner MAY compute candidate state before persistence.
2. Candidate state SHALL not be marked durable.
3. While persistence is pending, the owner SHALL retain the last committed snapshot.
4. On `SUCCESS`, the owner MAY promote candidate state to committed state.
5. On `NO_OP`, the owner MAY align to the already-durable equivalent.
6. On `FAILED`, the owner SHALL keep or restore the last committed snapshot.
7. On `CONFLICT`, the owner SHALL not overwrite durable state and SHOULD reload/recompute according to its operation policy.
8. On `STALE_SESSION`, no completion mutation is permitted.
9. UI SHALL not claim a save succeeded before durable confirmation unless explicitly labeled as pending.
10. Engine run results SHALL report persistence outcome separately from computation outcome.

---

## 27. Engine Integration Contract

A registered engine that requires persistence SHALL separate computation from durable write.

Logical flow:

```text
Engine.run(context)
→ compute candidate output
→ create PersistenceRequest
→ await PersistenceGateway.persist(request)
→ return normalized EngineRunResult with persistence metadata
```

Engine run result MAY include:

```yaml
persistence:
  requested: boolean
  status: SUCCESS | NO_OP | CONFLICT | REJECTED | FAILED | STALE_SESSION | null
  requestId: string | null
```

Rules:

1. An engine SHALL not call Firestore directly.
2. An engine SHALL not report `changed: true` as durable unless persistence succeeded.
3. Computation success with persistence failure SHALL be represented honestly.
4. Dependency results exposed under B2 SHALL not include mutable repository internals.
5. An engine SHALL not retry persistence independently if the gateway owns retry.
6. An engine MAY recompute after conflict if its domain contract allows it.
7. Engine adapters SHALL validate their action before computation as required by B2.
8. B4 SHALL not change B2 trigger or dependency behavior.

---

## 28. Failure Semantics for Engine Orchestration

B2 dependency failure and B4 persistence failure SHALL remain distinct.

Rules:

- If an engine’s required persistence fails, that engine SHALL return `FAILED` unless its operation contract explicitly allows a non-durable success.
- A dependent engine SHALL not consume an output that required persistence but was not durably committed.
- If an engine output is intentionally runtime-only, persistence failure semantics do not apply.
- Independent engines MAY continue under B2.
- The orchestrator SHALL include persistence failure in the run summary.
- A write failure SHALL not automatically trigger rollback of independent engine writes.
- Multi-engine all-or-nothing orchestration is out of scope.

---

## 29. Offline and Connectivity Behavior

B4 SHALL define conservative offline semantics.

Rules:

1. The gateway SHALL not claim server durability if the SDK has only queued a local write unless the operation explicitly accepts Firestore local-ack semantics.
2. Engineering Review SHALL verify current Firebase SDK behavior for each migrated operation.
3. Source-history user actions MAY preserve the current usable offline experience if safely supported.
4. Engine-derived writes SHOULD prefer explicit confirmed completion before updating durable markers.
5. A pending offline write SHALL not be treated as fully committed for conflict-sensitive metadata unless approved.
6. No new custom offline queue SHALL be introduced in B4.
7. A future offline-first repository layer may be specified separately if needed.

---

## 30. Security and Firestore Rules

The Persistence Contract is an application architecture boundary.

It SHALL NOT replace Firestore Security Rules.

Requirements:

- Every repository operation must still satisfy Firestore rules.
- Client-side validation is not a security boundary.
- The gateway SHALL not expose arbitrary paths.
- Permission failures SHALL be non-retryable.
- No authentication token or secret shall be logged.
- B4 does not require Firebase Functions changes unless repository review proves a client write is impossible or unsafe.
- B4 does not authorize bypassing current rule restrictions.
- Future server-authoritative writes require separate design and deployment review.

---

## 31. Observability

The gateway SHALL produce minimal diagnostics.

Logical diagnostic record:

```yaml
PersistenceDiagnostic:
  requestId: string
  operation: string
  domain: string
  owner: string
  status: string
  errorCode: string | null
  retryable: boolean
  attemptCount: number
  durationMs: number
  engineId: string | null
  runId: string | null
  sessionGeneration: string | number | null
```

Diagnostics SHALL NOT include:

- Full meal contents.
- Full memory text.
- Raw LLM output.
- Image bytes or URLs.
- Authentication tokens.
- Full user profile.
- Sensitive health details unless strictly required.
- Arbitrary payload dumps.

B4 SHALL not require a new Firestore diagnostics collection.

Runtime logging and test-visible receipts are sufficient for initial scope.

---

## 32. Schema and Versioning

Every persistence operation SHALL have a contract version.

Logical metadata:

```yaml
PersistenceContractVersion:
  gatewayVersion: string
  operationVersion: string
  payloadSchemaVersion: string
```

Rules:

1. Versioning SHALL support future migration.
2. Unknown future payload versions SHALL be rejected safely.
3. Repository adapters SHALL not silently interpret unsupported schemas.
4. Derived intelligence payloads SHOULD include producer engine version.
5. App version and persistence-contract version are separate.
6. B4 implementation SHALL not require a global Firestore schema rewrite.
7. Existing documents SHALL remain readable during incremental migration.

---

## 33. Initial Migration Scope

B4 implementation SHALL migrate the minimum set of persistence paths required to close Findings F4 and F5 and establish the gateway as the approved authority for engine and AI-core persistence.

The initial migration scope SHALL include:

1. Habit Engine derived-intelligence persistence.
2. Pattern Engine derived-intelligence persistence.
3. Adaptive TDEE user-approved persistence.
4. Trigger Engine owned persistence where it currently writes trigger-owned state.
5. AI-core source-history persistence points already governed by REM-001 and REM-003, at least at the final authoritative boundary.
6. Any broad profile-save call directly used by these paths.
7. Required tests proving no migrated path writes directly to Firestore.

The initial migration scope SHALL NOT require every legacy application write to be migrated.

Out-of-scope legacy paths MAY remain temporarily, but:

- They SHALL be documented.
- No new direct-write path SHALL be added.
- They SHALL not be used by future engines.
- Future work SHALL migrate them incrementally.

Engineering Readiness Review SHALL identify exact file/function call sites.

---

## 34. Expected Production Components

B4 implementation is expected to add:

```text
js/persistenceGateway.js
```

and MAY add scoped repository modules such as:

```text
js/repositories/profileRepository.js
js/repositories/dayRepository.js
js/repositories/memoryRepository.js
```

Because the current application is static and unbundled, physical organization MAY be flatter, for example:

```text
js/persistenceRepositories.js
```

The implementation SHALL prioritize architectural clarity without introducing an unnecessary build system.

Expected integration updates MAY include:

- `index.html`
- `js/app.js`
- `sw.js`
- Tests
- Architecture documentation
- Task documentation

No Firebase Functions or Firestore Rules change is expected unless Engineering Review identifies a strictly required mismatch.

Any such deviation requires explicit architecture approval before implementation.

---

## 35. Required Automated Test Coverage

The B4 test suite SHALL cover at minimum:

### Gateway Contract

1. Valid request resolves the correct operation.
2. Unknown operation is rejected.
3. Missing request ID is rejected.
4. Missing owner is rejected.
5. Domain mismatch is rejected.
6. Invalid payload is rejected.
7. Raw Firestore paths cannot be supplied by caller.
8. Repository failure is not reported as success.
9. `durable` is true only on confirmed success.
10. Result normalization is deterministic.

### Ownership

11. Allowed owner can submit the operation.
12. Wrong owner is rejected.
13. One engine cannot write another engine’s durable surface.
14. Shared profile document does not bypass field ownership.

### Authority

15. Missing required authority is rejected.
16. Generative authority cannot write source history.
17. Deterministic engine authority can write approved derived intelligence.
18. User-confirmed validated AI estimate can write source history.
19. Authority metadata is preserved unchanged.

### Session Safety

20. Current session request may write.
21. Stale session request is rejected before repository execution.
22. Session invalidated during async write suppresses completion effects.
23. Stale requests are not retried.
24. Account switch cannot apply prior user completion state.

### Retry

25. Approved transient failure retries within limit.
26. Retry stops after success.
27. Non-retryable failure does not retry.
28. Retry limit is enforced.
29. Session is checked before each retry.
30. Attempt count is returned.

### Idempotency

31. Same idempotency key and same payload is safe.
32. Same idempotency key with different payload is rejected.
33. Append operation without required idempotency key is rejected.
34. Replacement operation can return `NO_OP`.

### Conflict

35. Expected-version mismatch returns `CONFLICT`.
36. Conflict does not overwrite durable state.
37. Conflict is not reported as generic failure.
38. Derived engine can be instructed to recompute after conflict.

### Engine Integration

39. Habit Engine no longer writes Firestore directly.
40. Pattern Engine no longer writes Firestore directly.
41. Adaptive TDEE apply path uses the gateway.
42. Trigger-owned persistence uses the gateway if in migration scope.
43. Engine computation success with persistence failure is represented accurately.
44. Dependent engine does not receive output requiring failed persistence.
45. B2 orchestration triggers and actions remain unchanged.

### Durable Surfaces

46. Habit operation writes only habit fields.
47. Pattern operation writes only pattern fields.
48. Adaptive operation writes only adaptive-owned fields.
49. AI source-history operation cannot include unrelated profile fields.
50. Broad full-profile merge is absent from migrated paths.

### Regression

51. Existing valid meal logging still works.
52. Existing Habit output remains behaviorally unchanged.
53. Existing Pattern output remains behaviorally unchanged.
54. Existing Adaptive TDEE approval behavior remains unchanged.
55. Existing Trigger daily budget behavior remains unchanged.
56. REM-001 validator tests remain passing.
57. REM-002 session tests remain passing.
58. REM-003 authority tests remain passing.
59. B2 Engine Registry tests remain passing.
60. B3 state ownership tests remain passing.

---

## 36. Manual Acceptance Scenarios

### Scenario A — Valid AI Meal Save

Given:

- AI nutrition result passed REM-001.
- User confirmed or edited values.
- Final values revalidated.
- Authority metadata is `USER_CONFIRMED_AI_ESTIMATE`.
- Current session is valid.

Expected:

- Source-history operation succeeds.
- Day document updates once.
- Daily totals update once.
- Result returns `SUCCESS`.
- No unrelated profile fields are written.

### Scenario B — Invalid Generative Authority

Given:

- A generative weekly-plan object attempts to use a source-history operation.

Expected:

- Gateway returns `REJECTED / AUTHORITY_INVALID`.
- No Firestore call occurs.
- No day history changes.

### Scenario C — Pattern Write Failure

Given:

- Pattern computation succeeds.
- Repository returns a transient failure after retry limit.

Expected:

- Engine result indicates computation success but persistence failure.
- Pattern durable markers are not advanced.
- Previous committed runtime snapshot remains active.
- Next eligible run can retry.

### Scenario D — Pattern Conflict

Given:

- Pattern candidate is based on fingerprint `A`.
- Durable state was already advanced to fingerprint `B`.

Expected:

- Gateway returns `CONFLICT`.
- Candidate does not overwrite newer durable state.
- Engine remains eligible to reload/recompute.

### Scenario E — Account Switch During Write

Given:

- User A starts an engine persistence request.
- Session switches to User B before completion.

Expected:

- No completion state is applied to User B.
- No retry occurs under User B.
- Result is stale on completion or `STALE_SESSION`.
- User A durable commit, if already completed, remains isolated to User A.

### Scenario F — Wrong Owner

Given:

- Trigger Engine attempts to submit `DERIVED_PATTERNS_REPLACE`.

Expected:

- Gateway rejects before repository execution.
- No pattern fields change.

### Scenario G — Retryable Network Error

Given:

- First repository attempt returns an approved transient error.
- Second attempt succeeds.
- Session remains valid.

Expected:

- Result returns `SUCCESS`.
- Attempt count is `2`.
- Mutation is applied once through idempotent semantics.

### Scenario H — Duplicate Append

Given:

- Same source-history append request is submitted twice with the same idempotency key.

Expected:

- One logical entry exists.
- Second request returns `NO_OP` or equivalent idempotent success.
- Totals are not doubled.

---

## 37. Out of Scope

B4 SHALL NOT:

- Build the Recommendation Engine.
- Build the Initiative Engine.
- Build the Decision Engine.
- Define Habit and Pattern coaching consumption behavior.
- Redesign B1 canonical memory.
- Redesign B2 Engine Registry.
- Redesign B3 state ownership.
- Replace REM-001 validation.
- Replace REM-002 session lifecycle.
- Replace REM-003 authority contract.
- Introduce a new event bus.
- Introduce a build system.
- Move the full application to a framework.
- Migrate every legacy write in one task.
- Add server-side typed-memory production unless strictly required.
- Create a global Firestore diagnostics collection.
- Implement cross-engine transactions.
- Implement distributed rollback.
- Implement a custom offline queue.
- Change nutrition algorithms.
- Change Habit detection logic.
- Change Pattern detection logic.
- Change Adaptive TDEE calculations.
- Change Trigger ranking or budget behavior.
- Change product UI except minimal save/error recovery required by persistence outcomes.

---

## 38. Acceptance Criteria

B4 is complete only when all conditions are met:

- [ ] One logical Persistence Gateway exists.
- [ ] Migrated engines and AI-core write paths use typed persistence operations.
- [ ] No migrated path writes directly to Firestore.
- [ ] Operation catalog is closed and validated.
- [ ] Durable surfaces are explicit.
- [ ] B3 ownership is enforced.
- [ ] REM-003 authority is enforced.
- [ ] REM-002 session generation is enforced.
- [ ] Persistence success is distinct from computation success.
- [ ] Failed writes are never reported as success.
- [ ] Retry is bounded and only used for approved transient failures.
- [ ] Conflict results are distinct from failures.
- [ ] Idempotency is defined for retryable/duplicate-prone operations.
- [ ] Pattern and Habit durable markers advance only after persistence success.
- [ ] Adaptive TDEE user-approved changes are not marked applied before durable success.
- [ ] Broad profile merging is removed from migrated write paths.
- [ ] Repository adapters write only declared fields.
- [ ] Existing algorithms remain unchanged.
- [ ] Existing valid meal logging remains functional.
- [ ] Automated tests cover all required cases.
- [ ] All prior remediation tests remain passing.
- [ ] No unapproved Firestore Rules or Firebase Functions change.
- [ ] Architecture review passes.
- [ ] Engineering Readiness Review returns `READY`.
- [ ] Implementation review passes.
- [ ] Documentation is synchronized.
- [ ] Commit and push are completed.
- [ ] Task is marked closed.

---

## 39. Engineering Readiness Review Requirements

Before implementation, Claude Code SHALL perform a repository-based Engineering Readiness Review.

The review SHALL identify:

1. Every current direct Firestore write.
2. Every current broad `saveProfile()` use.
3. Exact Habit Engine persistence call sites.
4. Exact Pattern Engine persistence call sites.
5. Exact Adaptive TDEE persistence call sites.
6. Exact Trigger Engine persistence call sites.
7. Exact AI nutrition final authoritative persistence boundary.
8. Existing rollback behavior.
9. Existing swallowed-error behavior.
10. Existing retry behavior.
11. Existing session guards.
12. Existing authority metadata.
13. Existing field overlap between logical owners.
14. Current Firestore rule constraints.
15. Whether any operation requires a transaction.
16. Whether any operation requires idempotency metadata.
17. Whether Firebase Functions or Firestore Rules changes are actually required.
18. Exact minimum implementation file scope.
19. Exact test plan.
20. Any conflict between this SPEC and repository reality.

Claude Code SHALL return one of:

- `READY`
- `NOT READY`

If `NOT READY`, the report SHALL list precise required SPEC corrections.

No production implementation SHALL begin before this SPEC is updated and the review returns `READY`.

---

## 40. Required Engineering Review Questions

Claude Code SHALL answer explicitly:

1. Can one Persistence Gateway be introduced without a bundler?
2. Can repository adapters remain pure enough for Node-based tests?
3. Which current paths swallow Firestore failures?
4. Which current paths mutate in-memory state before persistence?
5. Which current paths already implement rollback?
6. Which write paths can conflict on the shared profile document?
7. Does `saveProfile()` currently write the entire profile or a scoped object?
8. Can Habit and Pattern writes use field-scoped updates?
9. Does Pattern Engine require an expected fingerprint/version precondition?
10. Which source-history append operations require idempotency keys?
11. Can current Firestore rules support every initial operation?
12. Does any migrated operation require a transaction?
13. Can session generation be validated without creating a second session system?
14. Can REM-003 authority metadata be reused unchanged?
15. Can B2 EngineRunResult be extended without breaking tests?
16. What is the exact minimal migration scope needed to close F4 and F5?
17. What legacy direct-write paths remain after B4?
18. Are any legacy paths unsafe enough that they must be included now?
19. What version bump is appropriate?
20. What documentation files must be updated on completion?

---

## 41. Documentation Update Requirements

After successful implementation and approval, update:

- `docs/tasks/B4/B4_SPEC.md`
- `FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1.0.md`
- `FITME_ARCHITECTURE_v1.md`
- `Roadmap.md`
- `Changelog.md`

The B4 SPEC SHALL be updated to:

```text
Status: APPROVED — IMPLEMENTED — TASK CLOSED
```

The documentation SHALL record:

- Final gateway and repository architecture.
- Final operation catalog.
- Final migration scope.
- Test totals.
- Version number.
- Commit status.
- Any intentionally deferred legacy write paths.
- B5 as the next task.

---

## 42. Definition of Done

B4 is done only when:

```text
Architecture Approved
→ Engineering Readiness Review READY
→ Implementation Complete
→ Automated Tests Pass
→ Code Review Approved
→ Documentation Updated
→ Version Updated
→ Commit Created
→ Push Completed
→ Task Closed
```

No partial completion SHALL be reported as closed.

---

## 43. Next Task

After B4 is approved, implemented and closed:

```text
B5 — Habit and Pattern Consumption Path
```

B5 SHALL define how approved Habit and Pattern Derived Intelligence Views are consumed by coaching and future Recommendation behavior without violating B1, B2, B3 or B4.

---

# Appendix A — Initial Operation Definition Template

```yaml
PersistenceOperationDefinition:
  operation: string
  version: string
  domain: PersistenceDomain
  allowedOwners: string[]
  repositoryAdapter: string
  durableSurface: string
  requiresUser: boolean
  requiresSessionGeneration: boolean
  requiresAuthority: boolean
  acceptedAuthoritySources: string[]
  requiresIdempotencyKey: boolean
  conflictPolicy: string
  retryPolicy: string
  payloadValidator: string
```

---

# Appendix B — Initial Persistence Gateway Interface

Illustrative only:

```javascript
window.FitMePersistence = {
  registerOperation(definition),
  persist(request),
  getOperation(id),
  listOperations()
};
```

The physical API MAY differ.

The following semantics are mandatory:

- Closed operation registration.
- Duplicate operation rejection.
- Request validation.
- Ownership validation.
- Authority validation.
- Session validation.
- Repository resolution.
- Normalized result.
- Bounded retry.
- No generic arbitrary-path write method.

---

# Appendix C — Example Habit Persistence Request

```yaml
requestId: persist-habits-2026-07-18-001
operation: DERIVED_HABITS_REPLACE
domain: DERIVED_INTELLIGENCE
owner: habitState
userId: USER_UID
sessionGeneration: 14
payload:
  habits: [...]
  habitsMeta:
    lastRun: 2026-07-18
    engineVersion: 2.0
authority:
  authoritySource: HABIT_ENGINE
  createdBy: SYSTEM
  createdAt: 2026-07-18T10:00:00Z
  rule: DETERMINISTIC_DERIVED_INTELLIGENCE
expectedVersion: null
idempotencyKey: habits:USER_UID:2026-07-18:2.0
createdAt: 2026-07-18T10:00:00Z
metadata:
  engineId: habitEngine
  engineVersion: 2.0
  trigger: APP_READY
  runId: run-123
```

---

# Appendix D — Example Pattern Persistence Conflict

```yaml
request:
  operation: DERIVED_PATTERNS_REPLACE
  expectedVersion: fingerprint-A

durableState:
  version: fingerprint-B

result:
  status: CONFLICT
  durable: false
  changed: false
  error:
    code: EXPECTED_VERSION_MISMATCH
    retryable: false
```

The Pattern Engine SHOULD reload source/durable state and recompute on a future approved run.

---

# Appendix E — Architectural Invariants

The following invariants are mandatory:

1. No registered engine writes directly to Firestore after its B4 migration.
2. No generative output becomes source history without REM-001 and REM-003.
3. No stale session completion mutates a new session.
4. No owner writes another owner’s fields.
5. No gateway operation accepts arbitrary Firestore paths.
6. No failed repository write returns durable success.
7. No retry occurs for invalid authority, ownership or session.
8. No derived intelligence becomes canonical memory by persistence alone.
9. No broad profile merge is used to bypass durable-surface ownership.
10. No future engine may introduce a new direct durable write path.

---

# Appendix F — Completion Summary and Final Approval

### F.1 Implementation Summary

- One logical Persistence Gateway implemented (`js/persistenceGateway.js`) with a closed
  six-operation catalog (`DERIVED_HABITS_REPLACE`, `DERIVED_PATTERNS_REPLACE`,
  `DERIVED_ADAPTIVE_PROPOSAL_APPLY`, `TRIGGER_RECORD_EVENT`, `TRIGGER_UPDATE_BUDGET`,
  `SOURCE_HISTORY_SAVE_DAY`), field-scoped Repository Adapters, and full validation of
  owner/domain/session/authority/payload/idempotency per Section 9's pipeline.
- Habit Engine, Pattern Engine, Adaptive TDEE (user-approved apply), Trigger Engine, and the
  AI-nutrition final authoritative boundary (`addMeal()`/`logQuick()`) migrated off the broad
  `saveProfile()`/direct Firestore writes onto the Gateway.
- Pattern Engine's `DERIVED_PATTERNS_REPLACE` enforces `expectedVersion` against the durable
  `patternsMeta.sourceFingerprint` inside a Firestore transaction, returning `CONFLICT` on
  mismatch (Section 24).
- Bounded retry (3 attempts, transient Firestore errors only) and an idempotency ledger
  (required for the append-style `TRIGGER_RECORD_EVENT`; naturally idempotent replace
  operations do not require a key) are implemented and tested.
- `context.state`/`EngineRunResult` were not restructured; per the Engineering Readiness
  Review's own finding, persistence outcome is reported through `output.persistence`
  (`{requested, status, requestId}`), keeping `js/engineRegistry.js` untouched.

### F.2 Engineering Readiness Review

Returned `READY`. No SPEC correction was required; one design question (§40 Q15,
`EngineRunResult` extension) was answered within the review itself (`output.persistence`,
not a new top-level Registry field).

### F.3 Implementation Review — Corrections Applied

Three issues were found and fixed during Implementation Review, all mechanical and requiring
no architecture or SPEC change:

1. **Habit rollback.** `writeReplaceDerivedHabitView` (`js/stateAccess.js`) had no rollback of
   `habits`/`habitsMeta` on a failed write, unlike Pattern. Before B4 this was unreachable
   (`saveProfile()` never rejected); the Gateway makes genuine failure reachable, so without a
   fix `habitsMeta.lastRun` could silently advance in memory on a failed durable write,
   permanently blocking that day's retry via the once-per-day gate. Fixed by aligning Habit's
   write with Pattern's existing snapshot-and-rollback pattern (Section 26 Rule 6).
2. **Trigger rollback.** The same class of gap in `recordCoachEvent`/`markTriggerFired`
   (`js/app.js`) — `markTriggerFired` in particular could leave a trigger `type` marked fired
   in `coachDay.fired` after a failed write, permanently blocking `canFire()` for that type for
   the rest of the day. Fixed with the same snapshot-and-rollback pattern.
3. **Stale-session failure-alert suppression.** The failure-path `alert()` in `addMeal()`,
   `logQuick()`, and `applyAdaptiveUpdate()` was not gated by `SessionLifecycle.isCurrent()` —
   only the success path checked it, so a user who signed out or switched accounts mid-flight
   could still see a stale-session failure alert (Section 18: "Completion effects for the stale
   runtime SHALL be suppressed"). Fixed by gating all three failure alerts identically to the
   success path.

Three regression tests were added covering these fixes (`tests/stateAccess.test.js` test 19b;
`tests/persistenceGateway.test.js` tests 19c and 24b).

### F.4 Verification

- Automated tests: `170 passed / 0 failed` (`node --test tests/*.test.js`).
- B1, B2, B3 confirmed unchanged; `js/engineRegistry.js`, `js/sessionLifecycle.js`,
  `js/authorityContract.js`, `js/nutritionValidator.js` untouched.
- No Firestore schema, Firestore Rules, or Firebase Functions changes.
- No B5, Recommendation Engine, Initiative Engine, or Decision Engine behavior introduced.

### F.5 Definition of Done (Section 42)

All steps confirmed complete: Architecture Approved → Engineering Readiness Review `READY` →
Implementation Complete → Automated Tests Pass → Code Review (Implementation Review)
`APPROVED` → Documentation Updated → Version Updated (`2.23.0`) → Commit Created → Push
Completed → Task Closed.

### F.6 Final Approval

Product/Architecture Approval: **APPROVED**. B4 is closed.
