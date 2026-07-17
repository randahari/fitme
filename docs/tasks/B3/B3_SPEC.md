# B3 --- State Ownership and Access Boundaries

**Document:** `docs/tasks/B3/SPEC.md`  
**Version:** 1.1  
**Status:** COMPLETED  
**Phase:** Architecture Remediation Program --- Phase B  
**Finding:** F2  
**Owner:** FITME AI Architecture  
**Depends On:** B1 --- Canonical Memory Decision (CLOSED); B2 --- Engine Contract and Registry (CLOSED)  
**Implementation Version:** 2.22.0  
**Completion Date:** 2026-07-17  
**Blocks:** B4, B5 and Recommendation Engine implementation --- now unblocked

---

## 1. Objective

Define explicit ownership for FITME application and intelligence state, establish enforceable read and write boundaries, and prevent engines or feature modules from directly mutating state owned by another domain.

B3 SHALL ensure that:

- Every state namespace has one recognized architectural owner.
- Registered engines receive only the state capabilities required for their approved actions.
- Cross-domain reads occur through explicit read interfaces.
- Cross-domain writes occur through owner-controlled commands.
- Mutable internal objects are not shared as unrestricted references.
- The Engine Registry remains an orchestration authority only.
- B1 canonical-memory decisions and B2 engine-orchestration decisions remain unchanged.
- The architecture remains compatible with a future native mobile client without requiring premature native implementation.

B3 SHALL NOT redesign engine algorithms, define the shared durable persistence mechanism, or define how Habit and Pattern outputs influence recommendations.

---

## 2. Architectural Decision

FITME SHALL use one logical **State Access Layer** composed of explicit domain-owned access interfaces.

The State Access Layer SHALL NOT be:

- A second application store.
- A copy of Firestore.
- A generic mutable key-value map.
- An unrestricted service locator.
- A new memory authority.
- A persistence transaction manager.
- A replacement for the Engine Registry.

For each registered engine invocation, the orchestration adapter SHALL provide an **Engine State Access Capability** scoped to:

1. The current authenticated user.
2. The current REM-002 session generation.
3. The current engine ID.
4. The approved engine action.
5. The explicit read and write permissions declared for that engine/action.

An engine SHALL NOT receive unrestricted access to `userProfile`, `todayData`, Firestore, browser globals, or another engine's mutable namespace through its B2 `context`, `payload`, dependency results, closures, or global variables.

The architectural unit of ownership SHALL be the **state domain**, not the physical JavaScript object or Firestore document in which the state currently happens to reside.

---

## 3. Core Principles

1. **One owner per namespace** --- every mutable state namespace has one recognized owner.
2. **Capability-based access** --- an engine receives only the operations approved for its current action.
3. **Read by snapshot** --- cross-domain reads return immutable or defensively copied views, not live mutable references.
4. **Write through the owner** --- only the owning domain may apply mutations to its namespace.
5. **No implied permission** --- registry membership, dependency order, shared persistence location, or function visibility does not grant state access.
6. **User and session scope** --- every user-scoped access is bound to the authenticated user and current session generation.
7. **Authority preservation** --- state access does not bypass REM-003 authority rules.
8. **Memory preservation** --- state access does not merge canonical memory, source history, derived intelligence, generative data, or transient state.
9. **Persistence separation** --- B3 defines who may request and apply state changes; B4 defines shared durable persistence, retry, rollback, conflict and transaction behavior.
10. **Incremental adoption** --- current storage shapes MAY remain temporarily, but direct cross-domain mutation SHALL be removed from registered-engine paths.
11. **Portable business boundaries** --- domain interfaces SHALL avoid unnecessary browser-only assumptions so they can later be reused behind Web, PWA or native clients.
12. **No over-engineering** --- B3 SHALL introduce only the minimum interfaces required to make current engine access explicit and safe.

---

## 4. Definitions

### 4.1 State Domain

A cohesive set of data with one lifecycle, one semantic owner and one mutation policy.

A state domain MAY currently span several JavaScript variables or Firestore fields.

Several state domains MAY currently be persisted inside the same `users/{uid}` document without sharing ownership.

### 4.2 Namespace Owner

The component or domain contract exclusively authorized to validate and apply state transitions for a namespace.

Ownership does not necessarily mean the owner performs the final Firestore write itself. B4 may later centralize persistence while preserving domain ownership.

### 4.3 Read Interface

An explicit operation that returns a bounded snapshot or projection of state needed by a consumer.

### 4.4 Write Command

An explicit request to the owning domain to apply one approved state transition.

A write command is not direct mutation of a returned object.

### 4.5 Engine State Access Capability

The per-engine, per-action set of state operations made available during one orchestration run.

### 4.6 Cross-Domain Mutation

Any code path that directly changes state whose architectural owner is another domain, including:

- Assigning fields on another domain's object.
- Pushing into another domain's array.
- Replacing another domain's namespace.
- Writing another domain's Firestore fields directly.
- Passing a mutable reference to another engine for modification.
- Using a generic callback or payload to evade an owner-controlled command.

---

## 5. State Classification Inherited From B1

B3 SHALL preserve the following separate state classes:

1. **Authoritative Source History**  
   Records of what happened: meals, workouts, weight, measurements, water, steps and other validated user logs.

2. **Canonical User Memory**  
   Durable learned knowledge owned by the Canonical Memory Domain.

3. **Derived Intelligence Views**  
   Recomputable outputs such as Habit and Pattern views.

4. **Generative Persistent Data**  
   Persistent LLM-generated content that has not become authoritative through an approved transition.

5. **Transient Runtime / Session State**  
   In-memory candidates, UI workflow state, caches and in-flight work.

6. **Configuration and Non-User-Scoped State**  
   Engine definitions, trigger catalog, application constants, schema definitions and other configuration not owned by an authenticated user.

No access interface SHALL blur these classes into one generic state object.

---

## 6. Canonical Ownership Map

The following logical ownership map is approved for B3.

| State Domain | Current Representative State | Architectural Owner | Approved Producers | Approved Consumers |
|---|---|---|---|---|
| Authentication / Session | `currentUser`, session generation, cleanup registry | Session Lifecycle Domain (REM-002) | Firebase Auth adapter, Session Lifecycle Manager | Orchestrator, all user-scoped domains |
| Authoritative Nutrition History | `days/{date}.meals`, calories/macros, water | Nutrition History Domain | User-confirmed/manual/validated nutrition write paths | Habit, Pattern, Adaptive TDEE, Trigger, future Recommendation |
| Authoritative Workout / Activity History | workouts, burned calories, steps | Activity History Domain | Approved workout/activity write paths | Habit, Pattern, Adaptive TDEE, Trigger, future Recommendation |
| Authoritative Body History | weight and measurement history | Body History Domain | Approved user-entry paths | Habit, Pattern, Adaptive TDEE, Trigger, future Recommendation |
| User Profile / Goals | identity, goal, targets, coach preferences, group reference | Profile and Goals Domain | Onboarding/settings plus approved adaptive-target transition | Engines through explicit read views; UI |
| Canonical User Memory | canonical durable learned knowledge; `coachMemory` migration base | Canonical Memory Domain (B1) | Approved memory commands only | Coach, future Recommendation, approved engines |
| Habit Derived View | `coachMemory.habits`, `habitsMeta` | Habit Domain | Habit Engine only | Pattern optional enrichment; future approved B5 consumers |
| Pattern Derived View | `coachMemory.patterns`, `patternsMeta` | Pattern Domain | Pattern Engine only | Future approved B5 consumers |
| Adaptive TDEE Proposal State | pending proposal, cadence metadata, calculation result | Adaptive TDEE Domain | Adaptive TDEE Engine | Adaptive UI; approved user-confirmation path |
| Authoritative Adaptive Target | accepted `goalKcal`, adaptive TDEE history/metadata | Profile and Goals Domain | Approved user-confirmed adaptive command | UI and approved engines |
| Trigger Runtime / Budget State | `coachEvents`, `coachDay`, fired/dedup state | Trigger Domain | Trigger Engine only | Trigger Engine; future event-model decision |
| Generative Plan / Candidate Data | weekly plans, unconfirmed AI candidates | Generative Data Domain | Approved LLM features | UI and explicit validation/promotion flows only |
| UI Workflow State | overlays, editing flags, current screen, transient forms | UI Runtime Domain | UI controllers | UI only; engines SHALL NOT own or mutate it |
| Orchestration State | registry definitions, run plan, run summary | Engine Registry / Orchestrator | Registry and Orchestrator | Diagnostics and dependency execution |
| Engine In-Flight Guards | Habit single-flight and equivalent approved runtime guards | Relevant Engine Adapter Domain, session-scoped | Engine adapter | Same adapter / orchestrator only |
| Application Configuration | versions, constants, trigger catalog | Application Configuration Domain | Build/configuration code | All approved modules as read-only |

### 6.1 Physical Co-location Does Not Merge Ownership

Several domains currently live inside `userProfile` or the same Firestore profile document.

This physical co-location SHALL NOT grant one domain permission to mutate another domain's fields.

Examples:

- Habit Engine owns `coachMemory.habits` but does not own canonical memory generally.
- Pattern Engine owns `coachMemory.patterns` but does not own `coachMemory.preferences`.
- Trigger Engine owns `coachEvents` / `coachDay` but does not own meal history.
- Adaptive TDEE Engine may create a proposal but does not own the final authoritative calorie target.
- The Registry may invoke engines but owns none of their business state.

### 6.2 Shared `coachMemory.lastUpdated` Decision

`coachMemory.lastUpdated` SHALL NOT remain a shared mutable field written by both Habit Engine and Pattern Engine.

Approved ownership model:

- Habit Domain owns only `coachMemory.habits` and `coachMemory.habitsMeta`.
- Pattern Domain owns only `coachMemory.patterns` and `coachMemory.patternsMeta`.
- Each domain SHALL maintain its own update timestamp and lifecycle metadata inside its own `*Meta` namespace.
- Habit Engine and Pattern Engine SHALL stop writing the shared top-level `coachMemory.lastUpdated` field.
- No new shared replacement timestamp SHALL be introduced in B3.

Before removing or ceasing writes to `coachMemory.lastUpdated`, Engineering SHALL perform a repository-wide read-usage search.

If no active reader exists, the shared field MAY remain as legacy stored data but SHALL no longer be updated.

If an active reader exists, implementation SHALL replace that read with the correct domain-specific timestamp or introduce the minimum temporary compatibility read required to preserve approved behavior. No new shared write ownership is permitted.

This decision does not change B1 canonical-memory ownership. It removes an ambiguous shared write surface between two Derived Intelligence Domains.

---

## 7. State Access Layer

FITME SHALL expose one logical State Access Layer.

Logical shape:

```yaml
StateAccessLayer:
  createEngineAccess:
    input:
      engineId: string
      action: string
      userId: string
      sessionGeneration: string | number
      runId: string
    output:
      EngineStateAccess
```

The physical JavaScript design MAY use modules, factories or adapters compatible with the current static application.

The State Access Layer SHALL:

- Validate engine identity and action.
- Bind access to the current user and session generation.
- Expose only approved capabilities.
- Return normalized read snapshots.
- Route write commands to the owning domain.
- Reject unapproved domain access.
- Reject stale-session access.
- Support diagnostics without exposing sensitive state.

The State Access Layer SHALL NOT:

- Persist arbitrary objects.
- Accept generic field paths.
- Accept generic `get(path)` / `set(path, value)` access.
- Return raw `userProfile` or raw Firestore document references.
- Let a caller select its own permissions.
- Infer permissions from JavaScript call-stack position.
- Become a replacement for domain validation.

---

## 8. Engine State Access Contract

Logical contract:

```yaml
EngineStateAccess:
  identity:
    engineId: string
    action: string
    userId: string
    sessionGeneration: string | number
    runId: string

  read:
    <approvedDomainReadOperation>: function(input?) -> snapshot

  write:
    <approvedOwnerCommand>: function(command) -> StateCommandResult
```

`read` and `write` SHALL contain only operations approved for the specific engine/action.

An absent capability SHALL mean access is forbidden.

The contract SHALL NOT expose:

- A general `state` object.
- A generic document reference.
- A generic mutation callback.
- A raw database client.
- Another engine's private mutable state.
- Mutable dependency results.

### 8.1 Context Integration With B2

B2's `EngineRunContext` SHALL be extended additively with one scoped capability:

```yaml
EngineRunContext:
  userId: string
  sessionGeneration: string | number
  trigger: string
  action: string
  payload: any | null
  now: timestamp
  runId: string
  dependencies:
    <engineId>: EngineRunResult
  state:
    EngineStateAccess
```

Rules:

1. `context.state` SHALL be the sole approved delivery channel for B3 engine state capabilities.
2. `context.state` SHALL be created by trusted orchestration code using the registered engine ID and the resolved per-engine action.
3. The external `EngineRunRequest` caller SHALL NOT be allowed to supply or override `context.state`.
4. Engines SHALL NOT receive a parallel state-access parameter such as `run(context, access)` or any equivalent second capability channel.
5. It SHALL be scoped to the current user, session generation, engine ID, action and run ID.
6. One engine's capability SHALL never be delivered to another engine.
7. `payload` SHALL remain action data only and SHALL NOT contain state services, database clients or raw mutable state.
8. Dependency results SHALL remain explicit immutable outputs, not state-access channels.
9. Adding `context.state` is an additive B3 extension of the B2 execution context. It SHALL NOT change B2 engine IDs, triggers, actions, payload routing, dependencies, ordering, failure policy, single-flight behavior or run-result semantics.
10. The Orchestrator SHALL remain free of business-state ownership. It creates and delivers scoped capabilities but does not validate or apply domain business mutations itself.

---

## 9. Read Boundary Rules

All cross-domain reads SHALL follow these rules:

1. Reads SHALL occur through named domain operations.
2. Reads SHALL return a snapshot or projection sufficient for the approved computation.
3. Returned arrays and objects SHALL be immutable by contract and SHOULD be defensively copied or frozen where practical.
4. A consumer's local mutation of a snapshot SHALL NOT mutate authoritative or owner-held state.
5. Read operations SHALL avoid exposing unrelated sensitive fields.
6. Read operations SHALL be user-scoped.
7. Read operations SHALL verify current session validity before returning user-scoped data.
8. Async read completion SHALL re-check session validity before exposing results.
9. Read contracts SHALL distinguish:
   - source history,
   - profile/current state,
   - canonical memory,
   - derived intelligence.
10. A read SHALL NOT grant write permission.
11. A dependency result SHALL contain only intentionally exposed data and SHALL not substitute for a domain read contract.
12. Engines SHALL NOT read state through UI elements, DOM state, browser storage or undocumented globals when an approved domain read interface exists.

---

## 10. Write Boundary Rules

All state transitions initiated by registered engines SHALL follow these rules:

1. Only the namespace owner may apply a mutation.
2. Engines SHALL issue named owner commands.
3. A command SHALL express intent, not an arbitrary field patch.
4. The owner SHALL validate command shape and domain invariants.
5. The owner SHALL validate authenticated user scope and session generation.
6. The owner SHALL preserve REM-003 authority metadata requirements.
7. The owner SHALL reject stale-session commands.
8. The owner SHALL not expose its mutable internal state after applying a command.
9. Cross-domain write commands SHALL be explicit in the engine/action permission matrix.
10. No engine may write to another engine's namespace by calling Firestore directly.
11. No engine may modify `userProfile`, `todayData`, `coachMemory`, `coachEvents`, target fields or history arrays by shared reference outside its owned namespace.
12. Write commands SHALL return a normalized result.
13. B3 SHALL NOT define final retry, rollback, transaction or durable conflict behavior; those belong to B4.
14. Until B4, an owner command MAY delegate to the existing persistence mechanism only when the ownership and validation boundary is preserved.

Logical result:

```yaml
StateCommandResult:
  status: APPLIED | NO_CHANGE | REJECTED | FAILED
  changed: boolean
  domain: string
  command: string
  error:
    code: string | null
    message: string | null
  metadata:
    runId: string
    sessionGeneration: string | number
```

---

## 11. Forbidden Generic Patch Contract

The following contract patterns are forbidden:

```javascript
state.set("userProfile.coachMemory.patterns", value)
state.patch({ "goalKcal": 1800 })
state.update(path, arbitraryObject)
context.payload.state = userProfile
context.services.db = db
```

B3 requires semantic commands such as:

```text
Habit Domain:
  replaceDerivedHabitView(result)

Pattern Domain:
  replaceDerivedPatternView(result)

Trigger Domain:
  recordTriggerOutcome(event)
  updateDailyTriggerBudget(state)

Adaptive TDEE Domain:
  storeAdaptiveProposal(proposal)
  markAdaptiveCheckCompleted(metadata)

Profile and Goals Domain:
  applyUserApprovedAdaptiveTarget(command)
```

Exact implementation names MAY differ, but generic arbitrary mutation is prohibited.

---

## 12. Initial Engine/Action Permission Matrix

The initial matrix is locked to the four engines registered by B2.

### 12.1 Habit Engine

Approved action:

- `APP_READY / RECOMPUTE`

Approved reads:

- Nutrition History snapshot.
- Workout / Activity History snapshot.
- Body History snapshot.
- Minimal Profile snapshot required for approved Habit computation.
- Current Habit Derived View metadata required for lifecycle continuity.

Approved writes:

- Replace/update Habit Derived View through the Habit Domain owner command.
- Update Habit runtime metadata owned by the Habit Domain.

Forbidden:

- Writing Pattern state.
- Writing canonical memory categories other than its owned derived Habit view.
- Writing Trigger state.
- Writing profile goals.
- Writing authoritative source history.
- Writing UI state.
- Direct Firestore/profile mutation outside the Habit Domain command.

### 12.2 Pattern Engine

Approved action:

- `APP_READY / RECOMPUTE`

Approved reads:

- Nutrition History snapshot.
- Workout / Activity History snapshot.
- Body History snapshot.
- Minimal Profile snapshot required for thresholds.
- Current Pattern Derived View metadata required for lifecycle continuity.
- Optional Habit Derived View through a read-only snapshot.

Approved writes:

- Replace/update Pattern Derived View through the Pattern Domain owner command.
- Update Pattern runtime metadata owned by the Pattern Domain.

Forbidden:

- Mutating Habit Derived View.
- Promoting Habit data into canonical memory.
- Writing Trigger state.
- Writing profile goals.
- Writing authoritative source history.
- Direct Firestore/profile mutation outside the Pattern Domain command.

The existing soft Habit enrichment behavior remains optional and SHALL NOT become ownership or a hard B2 dependency.

### 12.3 Adaptive TDEE Engine

Approved actions:

- `APP_READY / ADAPTIVE_CHECK`
- `SOURCE_DATA_CHANGED / WEIGHT_CHANGED`
- `MANUAL / ADAPTIVE_RECHECK`

Approved reads:

- Nutrition History snapshot.
- Body History snapshot.
- Activity History snapshot where required by the approved algorithm.
- Minimal Profile / Goal snapshot.
- Adaptive TDEE Domain metadata and current proposal state.

Approved writes:

- Store/update a pending Adaptive TDEE proposal through the Adaptive TDEE Domain.
- Update calculation/cadence metadata owned by the Adaptive TDEE Domain.
- Record approved engine diagnostics/authority metadata for the proposal.

Forbidden:

- Directly changing the authoritative target.
- Directly changing `goalKcal`.
- Writing Habit or Pattern state.
- Writing source history.
- Writing Trigger state.
- Treating a proposal as authoritative.

`applyAdaptiveUpdate()` remains a separate user-confirmed command to the Profile and Goals Domain. B3 SHALL not convert it into an Engine action or weaken its authority boundary.

### 12.4 Trigger Engine

Approved actions:

- `APP_READY / DAILY_COACH_CHECK`
- `SOURCE_DATA_CHANGED / WORKOUT_COMPLETED`
- `AUTH_SESSION_READY / LOCAL_NOTIFICATION_SCHEDULE`

Approved reads by action:

`DAILY_COACH_CHECK`:
- Minimal Profile / Goal snapshot.
- Nutrition, Activity and Body History snapshots required by approved trigger evaluators.
- Trigger daily budget/dedup snapshot.
- Approved Adaptive TDEE calculations exposed through pure logic or explicit state reads.
- No unrestricted Habit/Pattern consumption before B5.

`WORKOUT_COMPLETED`:
- Explicit workout payload.
- Minimal Profile / Goal snapshot if required.
- Trigger budget/dedup snapshot where applicable.

`LOCAL_NOTIFICATION_SCHEDULE`:
- Minimal Profile / preferences snapshot.
- Trigger budget/dedup snapshot.
- Current notification eligibility data required by approved behavior.

Approved writes:

- Record Trigger events through the Trigger Domain.
- Update Trigger daily budget/dedup state through the Trigger Domain.
- Store Trigger runtime metadata owned by the Trigger Domain.

Forbidden:

- Writing meal/workout/body history.
- Writing canonical memory.
- Mutating Habit or Pattern outputs.
- Changing profile goals.
- Writing UI state directly as a substitute for a UI presentation adapter.
- Using notification scheduling as a general state-mutation path.

---

## 13. Source History Access

Authoritative source history SHALL be read through domain projections.

Initial logical operations MAY include:

```yaml
NutritionHistoryReads:
  getNutritionHistoryWindow(range)
  getDayNutrition(date)

ActivityHistoryReads:
  getWorkoutHistoryWindow(range)
  getActivityDay(date)

BodyHistoryReads:
  getWeightHistoryWindow(range)
  getMeasurementHistoryWindow(range)
```

Rules:

- Read APIs SHALL preserve authoritative values and metadata.
- Engines SHALL NOT receive mutation methods with history snapshots.
- B3 does not replace the approved validation and authority transitions used when history is created.
- Engines SHALL NOT append or correct source history.
- User edits to source history remain feature/domain operations outside engine ownership.
- Query optimization and shared history caching MAY be proposed during Engineering Review only if it does not create a second state authority or expand B3 scope.

---

## 14. Profile and Goal Access

Profile and Goals Domain SHALL expose bounded projections rather than the complete mutable profile.

Logical examples:

```yaml
ProfileReads:
  getIdentitySnapshot()
  getGoalSnapshot()
  getCoachPreferenceSnapshot()
  getEngineThresholdSnapshot(engineId, action)
```

The exact fields in each projection SHALL be verified during Engineering Review against actual engine requirements.

Engines SHALL not receive fields solely because they are physically co-located in `userProfile`.

Authoritative target mutation SHALL remain owned by the Profile and Goals Domain.

---

## 15. Canonical Memory Access

B3 SHALL preserve B1:

- Canonical Memory Domain is the sole owner of durable coach knowledge.
- Habit and Pattern views are not canonical-memory write permissions.
- Registered engines MAY read canonical memory only through approved memory projections.
- Registered engines MAY propose candidate memory only through a future approved command.
- No current B3 engine/action requires a new canonical-memory write command.
- B3 SHALL NOT implement the future normalized canonical memory read view defined directionally in B1 unless Engineering Review proves a minimal interface is necessary for current behavior.
- Recommendation Engine memory consumption remains blocked until B5 and later Recommendation SPEC work.

No direct mutation of arbitrary `coachMemory` fields is permitted under the B3 target architecture.

---

## 16. Derived Intelligence Access

Habit and Pattern outputs SHALL be exposed as read-only Derived Intelligence Views.

Logical operations:

```yaml
HabitReads:
  getHabitViewSnapshot()

PatternReads:
  getPatternViewSnapshot()
```

Only the owning engine domain may replace its own derived view.

Downstream consumption rules, ranking, confidence thresholds and coaching behavior remain deferred to B5.

B3 only makes safe access possible.

---

## 17. UI Boundary

Engines SHALL NOT own UI state.

An engine MAY return an output or issue an approved presentation request through an adapter, but SHALL NOT:

- Directly open or close overlays through state capabilities.
- Mutate DOM nodes as a substitute for a domain state transition.
- Store durable business state only in UI variables.
- Read authoritative values from rendered DOM text.
- Treat an on-screen card as canonical state.

Existing UI calls embedded in current engine functions SHALL be identified during Engineering Review.

Implementation MAY preserve current visible behavior through adapters, but ownership SHALL remain separated:

```text
Engine computation / state command
            ↓
Engine result or presentation model
            ↓
UI adapter renders
```

B3 SHALL NOT redesign the product UI.

---

## 18. Session Isolation

All Engine State Access capabilities SHALL preserve REM-002.

Requirements:

1. Capability creation SHALL require the current session generation.
2. Every read SHALL verify the session before returning user-scoped state.
3. Every async read SHALL verify the session again after completion.
4. Every write command SHALL verify the session immediately before applying mutation.
5. Every async write completion SHALL verify the session before exposing a successful result or applying follow-up runtime effects.
6. A capability created for one session generation SHALL become invalid after sign-out/account switch.
7. A capability SHALL NOT be reusable by a later session.
8. Cached snapshots SHALL be session-scoped and cleared through the existing Session Lifecycle Manager.
9. No second session-generation mechanism SHALL be introduced.

---

## 19. Authority Boundary

B3 SHALL preserve REM-003.

State ownership and authority are separate concepts.

Rules:

- A domain owner may apply only commands whose authority transition is approved.
- Ownership does not allow generative content to become authoritative.
- State commands carrying AI-derived input SHALL include required Authority Metadata.
- The State Access Layer SHALL not invent or upgrade authority.
- Authority metadata SHALL remain attached to approved writes.
- A successful engine run does not grant its output canonical-memory or authoritative-history status.
- User confirmation requirements, including Adaptive TDEE acceptance, remain unchanged.

---

## 20. Registry and Orchestrator Boundary

The Registry / Orchestrator SHALL own:

- Engine registration.
- Trigger eligibility.
- Per-engine action and payload routing.
- Dependency planning.
- Deterministic execution order.
- Run summaries.
- Creation and delivery of scoped `context.state` capabilities through a trusted State Access factory.

The Registry / Orchestrator SHALL NOT own:

- Profile state.
- Source history.
- Memory.
- Habit output.
- Pattern output.
- Adaptive proposals.
- Trigger events.
- UI workflow state.
- Domain mutation validation.
- Persistence transactions.

The Orchestrator SHALL not inspect or rewrite domain state except as required to create properly scoped capabilities.

---

## 21. Dependency Results vs. State Access

A B2 dependency result and a B3 state read serve different purposes.

Dependency result:

- Communicates an intentional output produced during the same orchestration run.
- Is immutable by contract.
- Contains only explicitly exposed result data.

State read:

- Retrieves an approved snapshot from an owned domain.
- May represent state produced before the current run.
- Is independently permissioned.

An engine SHALL NOT expose its entire namespace in `EngineRunResult.output`.

An engine SHALL NOT use dependency output to evade B3 permissions.

---

## 22. Failure Behavior

State-access failures SHALL be explicit.

Required logical error codes include:

- `STATE_ACCESS_DENIED`
- `UNKNOWN_ENGINE_ACTION`
- `STALE_SESSION`
- `INVALID_STATE_COMMAND`
- `DOMAIN_INVARIANT_VIOLATION`
- `STATE_READ_FAILED`
- `STATE_WRITE_FAILED`

Rules:

1. Access denial SHALL fail or skip the affected engine according to the adapter's approved policy.
2. Access denial SHALL never fall back to unrestricted global access.
3. A stale session SHALL not apply mutation.
4. A failed owner command SHALL not be reported as applied.
5. Independent engines MAY continue according to B2 Failure Policy.
6. Detailed durable rollback/retry remains deferred to B4.
7. User-facing UI SHALL not expose internal architecture error codes directly.

---

## 23. Diagnostics and Observability

Minimum diagnostic event:

```yaml
StateAccessDiagnostic:
  runId: string
  engineId: string
  action: string
  domain: string
  operation: string
  accessType: READ | WRITE
  outcome: ALLOWED | DENIED | FAILED
  errorCode: string | null
  sessionGeneration: string | number
  timestamp: timestamp
```

Diagnostics SHALL NOT include:

- Full meal history.
- Full canonical memory values.
- Authentication tokens.
- Raw images.
- Full prompts.
- Unnecessary personal data.
- Raw mutable object dumps.

B3 does not require a new Firestore diagnostics collection.

---

## 24. Compatibility With Current Static Application

B3 SHALL be implementable incrementally in the current static, unbundled Web/PWA application.

Implementation SHALL NOT require:

- A framework migration.
- Redux, MobX or another third-party global store.
- A build system.
- A new backend service.
- A new Firestore collection.
- Native iOS or Android code.
- Full extraction of `js/app.js`.
- Full B4 persistence implementation.
- Full C1 modularization.

A small standalone pure/access-control module MAY be introduced if Engineering Review confirms implementation is required.

Logical interfaces SHALL remain portable so future native clients can supply equivalent domain adapters.

Browser globals MAY remain temporarily behind adapters; engines SHALL not rely on them as the long-term contract.

---

## 25. Required Engineering Readiness Review

Claude Code, acting only as Lead Engineer, SHALL review the repository against this SPEC and report:

1. Exact current read/write surfaces of each of the four B2 engines.
2. Every direct access to:
   - `userProfile`
   - `todayData`
   - `coachMemory`
   - `coachEvents`
   - `coachDay`
   - weight/measurement history
   - Firestore
   - UI/DOM state
3. Every cross-domain mutable reference.
4. Exact existing persistence calls made from each engine.
5. Exact fields required by each engine/action.
6. Which UI effects are embedded inside engine functions.
7. Which accesses already comply through pure functions or existing boundaries.
8. Minimum implementation required to enforce the permission matrix.
9. Proposed file list.
10. Automated test plan.
11. Confirmation that B1 and B2 are unchanged.
12. Confirmation that B4 and B5 are not implemented prematurely.

The review SHALL return one of:

- `READY — ARCHITECTURE ONLY`
- `READY — IMPLEMENTATION REQUIRED`
- `NOT READY — SPEC CORRECTION REQUIRED`

Claude SHALL NOT choose a new ownership model or expand permissions.

Any repository evidence that contradicts this SPEC SHALL be reported for Product/Architecture decision.

---

## 26. Expected Implementation Direction If Required

If Engineering Review returns `READY — IMPLEMENTATION REQUIRED`, the minimum implementation SHOULD consist of:

1. One small State Access Layer module or equivalent trusted factory.
2. Explicit domain read adapters for only the data required by the four current engines.
3. Explicit owner commands for:
   - Habit Derived View.
   - Pattern Derived View.
   - Adaptive TDEE proposal/metadata.
   - Trigger event/budget state.
4. Per-engine/action permission definitions.
5. Minimal additive B2 integration so the Orchestrator creates and delivers the engine's scoped capability as `context.state`.
6. Removal of any parallel state-access parameter or alternate capability channel.
7. Removal of registered-engine direct access to foreign mutable namespaces.
8. Removal of registered-engine direct Firestore writes outside owner commands.
9. Removal of Habit and Pattern writes to shared `coachMemory.lastUpdated`, subject to the repository-wide reader compatibility check in Section 6.2.
10. Defensive snapshot behavior.
11. REM-002 session checks.
12. Automated tests.

Implementation SHALL preserve existing algorithms and user-visible behavior.

Engineering MAY adapt physical names to repository constraints but SHALL NOT weaken the semantic boundaries.

---

## 27. Explicit Out of Scope

B3 SHALL NOT:

- Change B1 canonical-memory decisions.
- Change B2 engine IDs, triggers, actions, dependencies, ordering or failure policy.
- Implement Recommendation Engine behavior.
- Define how Habit or Pattern intelligence affects coaching.
- Create a shared durable persistence transaction system.
- Standardize retries, rollback or conflict handling beyond current safety.
- Create a second memory system.
- Migrate all profile fields to separate Firestore documents.
- Redesign Firestore schema.
- Change Firestore rules unless a later reviewed implementation proves it strictly necessary and Product/Architecture explicitly approves.
- Change Firebase Functions.
- Redesign engine algorithms.
- Redesign UI.
- Implement a general event bus.
- Implement native mobile clients.
- Introduce a third-party state-management framework.
- Perform broad `app.js` modularization.

---

## 28. Required Automated Test Coverage

If implementation is required, tests SHALL cover at minimum:

1. Each B2 engine/action receives only its approved read/write capabilities.
2. An unapproved domain read returns `STATE_ACCESS_DENIED`.
3. An unapproved domain write returns `STATE_ACCESS_DENIED`.
4. A capability for one engine is not usable as another engine.
5. A capability for one action does not inherit permissions from another action of the same engine.
6. A stale session cannot read user-scoped state.
7. A stale session cannot apply a state command.
8. Returned snapshots cannot mutate owner-held state.
9. Habit Engine can write only the Habit Derived View.
10. Pattern Engine can write only the Pattern Derived View.
11. Pattern Engine cannot mutate Habit state.
12. Adaptive TDEE Engine can store a proposal but cannot apply an authoritative target.
13. Trigger Engine can update Trigger state but cannot mutate history or memory.
14. Registry/Orchestrator does not become a business-state owner.
15. `payload` cannot be used as a state-service escape hatch.
16. Dependency results cannot expose mutable internal state.
17. Direct engine Firestore write paths covered by B3 are removed or inaccessible.
18. B2 orchestration tests continue to pass.
19. REM-002 session tests continue to pass.
20. REM-003 authority tests continue to pass.
21. Existing engine algorithm regression tests remain unchanged.
22. No B4/B5 behavior is introduced.
23. `context.state` is created by trusted orchestration and cannot be supplied or overridden by `EngineRunRequest`.
24. No registered engine accepts or uses a parallel `access` parameter outside `context.state`.
25. Adding `context.state` does not change B2 trigger filtering, action routing, dependency ordering, failure propagation, run summaries or Habit single-flight.
26. Habit Engine and Pattern Engine no longer write `coachMemory.lastUpdated`.
27. Repository-wide verification confirms every former reader of `coachMemory.lastUpdated` is either absent or safely redirected to domain-specific metadata.

---

## 29. Manual Acceptance Scenarios

### Scenario A --- Habit recomputation

Given a valid authenticated session:

- Habit Engine reads approved source-history snapshots.
- Habit Engine reads only its own lifecycle metadata.
- Habit Engine applies a Habit Domain command.
- Pattern, Trigger, Profile and Canonical Memory state remain unmodified.

### Scenario B --- Pattern optional Habit enrichment

Given Pattern Engine recomputation:

- Pattern Engine may read a Habit snapshot.
- Pattern Engine cannot mutate Habit state.
- Habit failure or absence remains gracefully degradable.
- Pattern Engine writes only Pattern Domain state.

### Scenario C --- Adaptive proposal

Given a valid Adaptive TDEE check:

- The engine reads history and goal snapshots.
- It stores a proposal in Adaptive TDEE Domain.
- `goalKcal` remains unchanged.
- Only an explicit user-confirmed Profile/Goals command may apply the target.

### Scenario D --- Trigger after workout

Given a `WORKOUT_COMPLETED` action:

- Trigger Engine receives the approved payload.
- It may read only its action-specific profile/trigger state.
- It may record a Trigger event.
- It cannot alter the workout entry that triggered it.

### Scenario E --- Account switch during async work

Given an engine begins a read or command under session generation A and authentication switches to generation B:

- Generation A capability becomes invalid.
- No state from user A is exposed or applied to user B.
- The engine returns a normalized stale-session failure/skip.

### Scenario F --- Unauthorized mutation attempt

Given Pattern Engine attempts to write Habit state:

- Access is denied.
- Habit state remains unchanged.
- The denial is observable through diagnostics.
- No fallback direct global or Firestore write occurs.

---

## 30. Acceptance Criteria

B3 is complete only when:

- [ ] One canonical ownership map is approved.
- [ ] One logical State Access Layer is approved.
- [ ] Engine capabilities are scoped by user, session, engine and action.
- [ ] Cross-domain reads use explicit snapshot interfaces.
- [ ] Cross-domain writes use owner-controlled commands.
- [ ] Generic path-based mutation is forbidden.
- [ ] Physical co-location does not imply shared ownership.
- [ ] The four B2 engines have an approved permission matrix.
- [ ] Habit and Pattern outputs remain Derived Intelligence Views.
- [ ] Adaptive TDEE proposal and authoritative target ownership remain separate.
- [ ] Trigger state ownership is explicit.
- [ ] Canonical Memory ownership remains consistent with B1.
- [ ] Engine Registry ownership remains consistent with B2.
- [ ] REM-002 session isolation is preserved.
- [ ] REM-003 authority semantics are preserved.
- [ ] B4 persistence mechanics are not preempted.
- [ ] B5 consumption behavior is not preempted.
- [ ] `context.state` is the only engine state-capability delivery channel.
- [ ] No parallel `access` parameter or alternate state-capability channel exists.
- [ ] Habit and Pattern no longer write shared `coachMemory.lastUpdated`.
- [ ] Existing readers of `coachMemory.lastUpdated`, if any, are handled without changing approved behavior.
- [ ] All existing B2 orchestration semantics remain unchanged except for the additive `context.state` field.
- [ ] Engineering Readiness Review returns `READY`.
- [ ] Any required implementation is completed and code-reviewed.
- [ ] Product/Architecture Approval is recorded.
- [ ] Relevant documentation is synchronized.
- [ ] Commit is created and pushed.
- [ ] B3 is marked closed.
- [ ] B4 is explicitly marked `NEXT`.

---

## 31. Implementation Gate

No implementation SHALL begin until:

1. Engineering Readiness Review returns `READY`.
2. Product/Architecture approves the reviewed implementation scope.

If the review determines `READY — ARCHITECTURE ONLY`, no production code SHALL change.

If the review determines `READY — IMPLEMENTATION REQUIRED`, implementation SHALL be limited to the minimum approved scope required to enforce B3 ownership and access boundaries for the four current registered engines.

Any requirement to change ownership decisions, B1, B2, authority semantics or persistence architecture SHALL return B3 to Architecture/SPEC revision before coding.

---

## 32. Documentation Closure Requirements

At B3 closure, update:

- Roadmap.
- Changelog.
- FITME AI Architecture Remediation Plan.
- `docs/tasks/B3/SPEC.md`.
- Current-State Architecture if production state access changed.
- Any architecture document whose ownership/access definition changed in practice.

The closure update SHALL:

- Mark B3 completed.
- Record the approved ownership model.
- Record whether implementation was required.
- Record the implemented State Access Layer and permission matrix if applicable.
- Record verification and automated test results.
- Confirm that B1 and B2 remain unchanged.
- Confirm that B4 and B5 were not implemented prematurely.
- Mark **B4 --- Persistence Contract** as `NEXT`.

---

## Appendix A --- Engineering Readiness Review Resolution (v1.1)

The initial Engineering Readiness Review returned:

`READY --- IMPLEMENTATION REQUIRED`

with one ownership ambiguity and one implementation-direction proposal requiring Product/Architecture resolution.

### A.1 Shared `coachMemory.lastUpdated` --- RESOLVED

Engineering evidence confirmed that Habit Engine and Pattern Engine both write the shared top-level `coachMemory.lastUpdated` field.

Approved resolution:

- The shared field has no continuing write owner under B3.
- Habit and Pattern SHALL use their own domain metadata namespaces.
- Both engines SHALL cease writing `coachMemory.lastUpdated`.
- Engineering SHALL verify readers before removal or write cessation and preserve behavior through the minimum domain-specific compatibility correction if required.

### A.2 State Capability Delivery --- RESOLVED

Engineering proposed passing a separate `access` parameter directly from the Stage 8 adapters while leaving `EngineRunContext` unchanged.

That proposal is rejected.

Approved resolution:

- B3 extends `EngineRunContext` additively with `context.state`.
- `context.state` is the sole engine capability-delivery channel.
- Trusted orchestration creates the capability.
- The external run request cannot supply it.
- No parallel `run(context, access)` contract is permitted.
- All B2 orchestration behavior remains unchanged apart from the additive context field.

### A.3 Review Status

The v1.0 review findings are incorporated into this v1.1 SPEC.

Required next step:

A focused Engineering Readiness Re-Review of v1.1 only.

No implementation may begin until Claude Code confirms that these resolutions are technically feasible and returns a final `READY` verdict without unresolved architecture questions.

---

## Appendix B --- Completion Summary and Final Approval

### B.1 Engineering Readiness Review

Two rounds returned `READY --- IMPLEMENTATION REQUIRED`: the initial review flagged one ownership
ambiguity (`coachMemory.lastUpdated`) and one implementation-direction question (`context.state`
delivery), both resolved in SPEC v1.1 (Appendix A) and confirmed feasible in the focused Re-Review.

### B.2 Implementation Summary

- One State Access Layer module (`js/stateAccess.js`) implementing `createEngineAccess()`, scoped
  read/write capabilities, and the locked permission matrix for the four B2 engines.
- `context.state` added additively to `EngineRunContext`, created exclusively by trusted adapter code
  in `js/app.js`; no parallel `run(context, access)` channel introduced.
- Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine migrated to read/write
  exclusively through `context.state`; direct `userProfile`/`todayData`/Firestore access removed from
  all four engines' business logic.
- Habit Engine and Pattern Engine stopped writing the shared `coachMemory.lastUpdated` field;
  timestamps relocated to `habitsMeta.lastUpdated` / `patternsMeta.lastUpdated` respectively, with no
  new shared write surface introduced.
- Engine computation separated from UI rendering per Section 17; presentation moved to adapter-called
  functions (`presentTriggerCard`, `presentWorkoutTriggerCard`), content and timing unchanged.

### B.3 Code Review Outcome

Code Review identified no Critical or High findings. One architectural question was raised and
resolved by Product/Architecture (Appendix B.4). Two Medium-severity gaps were found and corrected
mechanically during review, with no Architecture change required:

- Async write commands (`replaceDerivedPatternView`, `recordTriggerOutcome`,
  `updateDailyTriggerBudget`) now re-verify session validity after their `await` completes, matching
  the pattern already used for reads and for `replaceDerivedHabitView` (Section 18, Rule 5).
- Added behavioral test coverage for the Habit single-flight self-provisioning path (previously
  covered only by a static source check), verifying the self-provisioned capability is correctly and
  non-forgeably scoped to `habitEngine`/`RECOMPUTE` regardless of caller.

### B.4 Architecture Clarification --- Final Decision

**Question:** Does `runHabitEngineSingleFlight()` self-provisioning a `habitEngine`/`RECOMPUTE`
capability on Pattern Engine's internal soft-invocation path (when called with no `access` argument)
conflict with `context.state` being the sole capability-delivery channel (Section 8.1, Rule 1)?

**Decision:** `NO SPEC VIOLATION`. `runHabitEngineSingleFlight()` is orchestration-helper code, not
Engine business code --- it contains no domain reads, computation or writes, and lives in the
orchestration-wiring section of `js/app.js`, separate from Habit's business-logic module. The
self-provisioning path is never invoked through the Registry, produces no `EngineRunContext`, and is
the same pre-existing, SPEC-preserved (Section 12.2) non-Registry Pattern-to-Habit relationship that
predates B3. The capability it creates uses the same single approved factory
(`StateAccess.createEngineAccess`) and the same permission matrix as every Registry-driven capability,
with `engineId`/`action` hardcoded and uninfluenced by the calling code; Pattern Engine never receives,
holds or uses this capability. Product/Architecture reviewed and approved this conclusion; no code
change was required or made.

### B.5 Verification

- Automated tests: `116 passed / 0 failed` (`node --test tests/*.test.js`).
- B1 and B2 confirmed unchanged (`js/engineRegistry.js`, `js/sessionLifecycle.js`,
  `js/authorityContract.js`, `js/nutritionValidator.js` untouched).
- B4 and B5 confirmed not implemented; no transaction/retry/rollback-policy, ranking or recommendation
  vocabulary introduced.
- No Firestore schema, Firestore rules, or Firebase Functions changes.

### B.6 Final Approval

Product/Architecture Approval: **APPROVED**. B3 is closed.

---

## 33. Next Task

After B3 is approved, implemented if required, reviewed, documented, committed, pushed and closed:

**B4 --- Persistence Contract**

Status after B3 closure:

`NEXT`
