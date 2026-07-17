# B2 --- Engine Contract and Registry

**Document:** `docs/tasks/B2/SPEC.md`\
**Version:** 1.3\
**Status:** APPROVED --- IMPLEMENTED --- TASK CLOSED\
**Phase:** Architecture Remediation Program --- Phase B\
**Findings:** F1, F3\
**Owner:** FITME AI Architecture\
**Depends On:** B1 --- Canonical Memory Decision (CLOSED)\
**Blocks:** B3, B4, B5 and Recommendation Engine implementation

------------------------------------------------------------------------

## 1. Objective

Define one explicit, minimal and enforceable contract for FITME
intelligence engines and one central registry/orchestrator responsible
for engine registration, dependency visibility and deterministic
execution order.

B2 SHALL remove architectural reliance on implicit override-chaining for
future engine integration.

B2 SHALL establish the execution-control foundation required before
additional intelligence engines, including the Recommendation Engine,
are introduced.

B2 SHALL preserve approved existing engine behavior and SHALL NOT
redesign engine business logic.

------------------------------------------------------------------------

## 2. Architectural Decision

FITME SHALL have exactly one logical **Engine Registry** and one
approved **Engine Contract** for registered intelligence engines.

Registered engines SHALL declare their identity, lifecycle trigger,
dependencies and executable entry point explicitly.

The registry/orchestrator SHALL be the authoritative source for:

-   Which registered engines exist.
-   Which lifecycle trigger invokes each engine.
-   Which registered-engine dependencies exist.
-   The deterministic execution order within an orchestration run.
-   Whether a registered engine is eligible to run in the current
    context.

Future engines SHALL NOT integrate into the intelligence pipeline by
wrapping, replacing, monkey-patching or override-chaining another
engine's entry point.

Existing engines MAY be adapted incrementally, but once an engine is
registered under the B2 contract, its orchestration SHALL follow the
registry contract.

No second competing engine registry or orchestration authority SHALL be
introduced.

------------------------------------------------------------------------

## 3. Core Principles

The Engine Contract and Registry SHALL follow these principles:

1.  **Explicit over implicit** --- dependencies and order are declared,
    not inferred from function replacement or source-file position.
2.  **Deterministic orchestration** --- the same registry definition and
    eligible context produce the same execution plan.
3.  **Minimal contract** --- B2 defines only what is required to
    register and orchestrate engines safely.
4.  **Business-logic preservation** --- registration SHALL NOT change
    Habit, Pattern, Trigger, Adaptive TDEE or other approved algorithms.
5.  **No cross-engine ownership assumption** --- registration does not
    grant an engine ownership of another engine's state.
6.  **No persistence authority by registration** --- being registered
    does not authorize direct persistence.
7.  **No memory authority by registration** --- being registered does
    not make engine output canonical memory.
8.  **Session safety** --- asynchronous engine execution SHALL preserve
    REM-002 session isolation guarantees.
9.  **Authority safety** --- engine outputs SHALL preserve REM-003
    authority semantics.
10. **Incremental adoption** --- existing architecture SHALL be migrated
    only as far as required to eliminate the B2 findings without
    unnecessary rewrite.

------------------------------------------------------------------------

## 4. Engine Definition

For B2, an **Engine** is a named application intelligence component
that:

-   Performs deterministic or approved bounded computation.
-   Is invoked by an application lifecycle or orchestration trigger.
-   May depend on completion of another registered engine.
-   Produces a result, derived intelligence, proposal or approved state
    transition.

Pure utility modules, validators, UI components, persistence adapters
and generic helper functions SHALL NOT automatically be classified as
engines.

The Engineering Review SHALL identify the current repository components
that qualify for registration under this definition.

------------------------------------------------------------------------

## 5. Canonical Engine Contract

Every registered engine SHALL conform semantically to the following
contract:

``` yaml
EngineDefinition:
  id: string
  version: string
  triggers: string[]
  dependsOn: string[]
  run: function(context) -> EngineRunResult | Promise<EngineRunResult>
```

Minimum required semantics:

### `id`

-   Globally unique within the FITME Engine Registry.
-   Stable across application sessions.
-   SHALL NOT depend on runtime order.

### `version`

-   Identifies the engine contract/behavior version for diagnostics and
    future compatibility.
-   SHALL NOT be used as the application version.

### `triggers`

-   Declares the set of lifecycle triggers under which the engine is
    eligible to run.
-   SHALL contain one or more entries. An engine MAY declare more than
    one trigger.
-   Trigger names SHALL come from the approved registry trigger catalog
    (Section 10).
-   The orchestrator SHALL invoke a registered engine for a given
    orchestration run only when the current trigger is present in that
    engine's declared `triggers`.
-   A separate Engine ID SHALL NOT be created merely because one engine
    is invoked by more than one trigger. A new Engine ID is warranted
    only when the invoked logic and ownership are genuinely distinct
    from the existing engine (see Section 17 for the approved
    application of this rule to Trigger Engine and Adaptive TDEE
    Engine).

### `dependsOn`

-   Declares direct dependencies on other registered engine IDs.
-   Empty array means no registered-engine dependency.
-   Dependencies SHALL be explicit.
-   Circular dependencies SHALL be rejected.

### `run(context)`

-   The single orchestration entry point for the registered engine.
-   MAY delegate to existing internal engine logic.
-   SHALL NOT require another engine to override or wrap it.
-   SHALL return or resolve to a normalized run result.
-   SHALL NOT receive unrestricted orchestration authority.
-   `run(context)` SHALL only ever be invoked by the orchestrator when
    an explicit `action` was supplied for this specific engine in the
    `EngineRunRequest` (Section 6). The orchestrator itself SHALL
    SKIP an eligible engine with no explicit action for it, without
    calling `run(context)` at all (revised, v1.2 --- see Section 6).
-   Even so, the adapter SHALL still validate `context.action` against
    its own approved action set before executing action-specific logic
    and SHALL reject or skip unrecognized action *values* (e.g. a typo)
    that were nonetheless explicitly supplied.

Physical JavaScript shape MAY differ if repository constraints require
it, but these semantics SHALL be preserved.

------------------------------------------------------------------------

## 6. Engine Run Request and Engine Run Context

**Revised in v1.2** (Code Review Round 4): a single orchestration run MAY
involve several eligible engines that each require a *different* explicit
action (for example, one `APP_READY` cycle running Habit, Pattern,
Adaptive TDEE and Trigger Engine together, each with its own distinct
action). A single shared `action` value at the top of the run is
therefore insufficient and is REJECTED by this SPEC: it would force every
eligible engine to interpret the same value, or fall back to treating a
missing/`undefined` action as an implicit default per engine, which
SHALL NOT be permitted (Section 9, Rule 2A).

The orchestrator SHALL instead accept one **Engine Run Request**
describing the trigger plus an explicit action (and optional payload)
**per engine id**:

``` yaml
EngineRunRequest:
  trigger: string
  actions:
    <engineId>: string
  payloads:
    <engineId>: any | null
  context:
    userId: string
    sessionGeneration: string | number
    now: timestamp
    runId: string
```

Physical names MAY differ (e.g. `run(request)` taking one merged object),
but this semantic separation SHALL be preserved: the trigger and shared
run-level context are common to the whole run, while `action` and
`payload` are resolved **independently per engine id** and SHALL NOT be
broadcast as a single shared value to every eligible engine.

For each eligible engine, the orchestrator derives a per-engine
**Engine Run Context** and passes it to that engine's `run(context)`:

``` yaml
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
```

Rules:

1.  `userId` SHALL identify the authenticated user for user-scoped
    engines.
2.  `sessionGeneration` SHALL support REM-002 stale-session protection.
3.  `trigger` SHALL identify why orchestration started.
4.  `now` SHALL provide a consistent time reference for the
    orchestration run.
5.  `runId` SHALL uniquely identify the orchestration run for
    diagnostics.
6.  `dependencies` SHALL expose only completed dependency results
    required by the current engine.
7.  `action` SHALL be the value found at `EngineRunRequest.actions[engineId]`
    for this specific engine, and SHALL NOT be a value shared with, or
    leaked from, any other engine's action. `action` SHALL be explicit
    and SHALL additionally be validated by the engine's own adapter
    (Section 5).
8.  If `EngineRunRequest.actions[engineId]` is absent for an otherwise
    eligible engine (trigger matches), the orchestrator SHALL mark that
    engine `SKIPPED` (`NO_ACTION_FOR_ENGINE`) **without invoking its
    `run(context)` at all**. No default action based on an absent or
    `undefined` value SHALL ever be substituted.
9.  `payload` SHALL be the value found at `EngineRunRequest.payloads[engineId]`
    (or `null` if absent) --- never another engine's payload. `payload`
    SHALL NOT grant unrestricted state access, SHALL NOT become a
    generic escape hatch, and SHALL NOT preempt state-access decisions
    belonging to B3 or persistence decisions belonging to B4.

Illustrative per-engine action map confirmed against the current
repository (see Section 17 for the full per-engine action set):

``` text
APP_READY actions map:
  habitEngine:        RECOMPUTE
  patternEngine:       RECOMPUTE
  adaptiveTdeeEngine:  ADAPTIVE_CHECK
  triggerEngine:       DAILY_COACH_CHECK

SOURCE_DATA_CHANGED (weight change):
  adaptiveTdeeEngine:  WEIGHT_CHANGED

SOURCE_DATA_CHANGED (workout completion):
  triggerEngine:       WORKOUT_COMPLETED   (payload: { burn })

AUTH_SESSION_READY:
  triggerEngine:       LOCAL_NOTIFICATION_SCHEDULE

MANUAL:
  adaptiveTdeeEngine:  ADAPTIVE_RECHECK
```

Each of the above triggers SHALL only carry actions for the engines
actually being asked to participate in that specific run; an engine
eligible for the trigger but omitted from `actions` SHALL be `SKIPPED`
per Rule 8.

B2 SHALL NOT define broad state access through `context`.

State ownership and read/write interfaces belong to B3.

Persistence interfaces belong to B4.

The context SHALL NOT become a generic escape hatch for unrestricted
global mutation.

------------------------------------------------------------------------

## 7. Engine Run Result

Every registered engine SHALL return a normalized result.

Logical contract:

``` yaml
EngineRunResult:
  engineId: string
  status: SUCCESS | SKIPPED | FAILED
  changed: boolean | null
  output: any | null
  error:
    code: string
    message: string
  metadata:
    runId: string
    startedAt: timestamp
    completedAt: timestamp
```

Rules:

-   `SUCCESS` means the engine completed its run.
-   `SKIPPED` means the engine was intentionally not executed due to an
    approved eligibility condition.
-   `FAILED` means execution failed.
-   A failed engine SHALL NOT be reported as successful.
-   `changed` indicates whether the engine reports a meaningful
    state/output change where applicable.
-   `output` SHALL contain only data intentionally exposed to dependent
    engines.
-   Raw internal mutable state SHALL NOT be exposed automatically.
-   Error handling SHALL be normalized enough for orchestration
    decisions and diagnostics.

Detailed persistence retry and rollback behavior is deferred to B4.

------------------------------------------------------------------------

## 8. Engine Registry

FITME SHALL maintain one logical Engine Registry.

The registry SHALL:

-   Register engine definitions.
-   Reject duplicate engine IDs.
-   Validate required contract fields.
-   Validate declared dependencies.
-   Reject dependencies on unknown registered engines at execution-plan
    validation time.
-   Reject circular dependencies.
-   Expose registered engine metadata for diagnostics.
-   Build a deterministic execution plan for a requested trigger.
-   Prevent accidental duplicate execution of the same engine within one
    orchestration run unless explicitly supported by a future approved
    contract.

The registry SHALL NOT:

-   Own engine business logic.
-   Own arbitrary engine state.
-   Persist engine state directly.
-   Grant authority to outputs.
-   Decide product behavior.
-   Infer hidden dependencies from source code.
-   Mutate one engine to invoke another.

------------------------------------------------------------------------

## 9. Orchestrator

One logical Engine Orchestrator SHALL execute registered engines.

Responsibilities:

1.  Receive an approved `EngineRunRequest`: a lifecycle trigger plus a
    per-engine-id map of explicit `action` (and, where applicable,
    `payload`) values (Section 6).
2.  Resolve eligible registered engines --- an engine is eligible for a
    given run only when the current trigger is present in that
    engine's declared `triggers` (Section 5).
2A. For each eligible engine, resolve its `action` strictly from
    `EngineRunRequest.actions[engineId]`. An eligible engine with no
    entry in `actions` SHALL be marked `SKIPPED`
    (`NO_ACTION_FOR_ENGINE`) and its `run(context)` SHALL NOT be
    invoked. No default action SHALL ever be derived from an absent or
    `undefined` value (v1.2, Code Review Round 4).
3.  Resolve their declared dependency graph.
4.  Validate the execution plan.
5.  Execute engines in deterministic dependency order.
6.  Provide dependency results to downstream registered engines.
7.  Respect session-generation validity before and after asynchronous
    work.
8.  Normalize run outcomes.
9.  Stop or isolate execution according to the failure policy defined in
    this SPEC.
10. Produce a run summary suitable for diagnostics.

The orchestrator SHALL NOT become a new monolithic business-logic layer.

------------------------------------------------------------------------

## 10. Trigger Catalog

B2 SHALL use a small explicit trigger catalog.

Initial logical triggers:

-   `APP_READY`
-   `AUTH_SESSION_READY`
-   `DAILY_REFRESH`
-   `SOURCE_DATA_CHANGED`
-   `MANUAL`

Engineering Review SHALL verify which triggers are actually required by
current engines.

Unused trigger values SHALL NOT be implemented merely because they
appear in this logical catalog.

A registered engine MAY declare one or more triggers via `triggers`
(Section 5). The orchestrator SHALL run a registered engine for a given
orchestration cycle only when the current trigger is present in that
engine's declared `triggers`.

Multiple triggers on one engine SHALL NOT, by themselves, justify
splitting that engine into multiple Engine IDs. A split is only
justified when the invoked logic and ownership are genuinely distinct
(Section 5, Section 17).

------------------------------------------------------------------------

## 11. Dependency Model

Dependencies SHALL represent execution prerequisites between registered
engines.

Example:

``` text
Habit Engine
    ↓
Pattern Engine
    ↓
Future Recommendation Engine
```

This diagram is illustrative only. Engineering Review SHALL verify
actual required dependencies.

Rules:

1.  `dependsOn` SHALL contain only direct dependencies.
2.  Transitive order SHALL be resolved by the orchestrator.
3.  Source-code declaration order SHALL NOT define dependency order.
4.  Registration order SHALL NOT define dependency order.
5.  Cycles SHALL fail validation.
6.  Missing required dependencies SHALL fail plan validation.
7.  A dependency relationship SHALL NOT imply state ownership.
8.  A dependency relationship SHALL NOT imply persistence permission.
9.  An engine SHALL consume only explicitly exposed dependency results
    or future approved access interfaces.
10. Pattern Engine's `dependsOn` is locked to `[]`, and Habit Engine's
    `dependsOn` is locked to `[]`. Pattern Engine's existing internal
    call into Habit Engine's logic is a soft, optional enrichment call
    with graceful degradation on failure, confirmed by repository
    evidence (Engineering Readiness Review, Round 1). It SHALL remain
    an internal call inside Pattern Engine's own `run()` and SHALL NOT
    be promoted to a registry-level `dependsOn` entry, because doing so
    would invoke the Failure Policy (Section 13) and change the
    approved existing failure behavior, where Pattern Engine continues
    to run successfully on raw data alone if Habit Engine fails.
11. **Habit Engine single-flight invariant (v1.2, Code Review Round 4).**
    Because Pattern Engine's internal call (Rule 10) and the Registry's
    own `habitEngine` registration can both, independently, invoke the
    Habit Engine's underlying computation, and because that computation
    contains a once-per-day gate that is checked and then only updated
    after an internal `await`, correctness against double-execution
    SHALL NOT depend on the orchestrator's execution order (topological
    or lexicographic tie-break, Section 12) between `habitEngine` and
    `patternEngine`. Instead, the Habit orchestration path SHALL provide
    a single-flight mechanism such that:
    -   A second call for the same session generation, made while a
        Habit run is already in flight, SHALL be handed the same
        in-flight `Promise` rather than starting a new run.
    -   The in-flight reference SHALL be cleared on completion or
        failure (e.g. in a `finally`), so a subsequent call --- once no
        run is in flight --- always starts a genuinely new run.
    -   The in-flight `Promise` SHALL NOT be shared across different
        session generations: a call made under a new session generation
        SHALL start its own independent run rather than reuse or await
        a previous generation's in-flight `Promise`.
    -   This mechanism SHALL live in the Habit orchestration/adapter
        layer, not inside Habit Engine's own detection algorithm or
        once-per-day gate, both of which remain unchanged.
    -   This invariant SHALL hold independently of whether the
        orchestrator executes independent engines sequentially or
        concurrently; sequential execution (Section 9) reduces the
        practical likelihood of overlap but is not, by itself, treated
        as the correctness guarantee.

B5 SHALL define the actual Habit/Pattern consumption path for coaching
and Recommendation behavior.

B2 SHALL NOT prematurely define that product behavior.

------------------------------------------------------------------------

## 12. Deterministic Ordering

The orchestrator SHALL use topological dependency ordering.

When multiple eligible engines have no dependency relationship,
execution order SHALL be deterministic through a stable registry rule.

Recommended rule:

**lexicographic ordering by stable engine `id` among equally eligible
nodes.**

This tie-breaker exists only for determinism.

Engines SHALL NOT rely on tie-break ordering for hidden dependencies.

If order matters semantically, the dependency SHALL be declared
explicitly.

**v1.2 clarification (Code Review Round 4):** correctness between Habit
Engine and Pattern Engine specifically SHALL NOT depend on
`habitEngine` happening to sort lexicographically before
`patternEngine`. That correctness is provided by the single-flight
invariant (Section 11, Rule 11), not by tie-break order. Tie-break
order remains solely a determinism/diagnostics property.

------------------------------------------------------------------------

## 13. Failure Policy

B2 SHALL distinguish dependency failure from unrelated engine failure.

Rules:

1.  If an engine fails, any engine that directly or transitively depends
    on it SHALL NOT run in that orchestration cycle.
2.  Dependent engines SHALL return or be recorded as `SKIPPED` with a
    dependency-failure reason.
3.  Independent engines MAY continue.
4.  One engine failure SHALL NOT silently corrupt another engine's
    state.
5.  The orchestrator SHALL surface the failure in its run summary.
6.  B2 SHALL NOT implement persistence rollback semantics; that belongs
    to B4.
7.  Existing production error behavior SHALL not be made less safe
    during migration.

------------------------------------------------------------------------

## 14. Eligibility and Idempotency

The registry MAY invoke an engine when its declared trigger occurs.

Each engine remains responsible for its domain-specific eligibility and
idempotency rules unless a future shared policy is approved.

Examples include:

-   Once-per-day execution.
-   Minimum source-history requirements.
-   No-op when source fingerprint is unchanged.

B2 SHALL NOT move existing Habit or Pattern detection/idempotency logic
into the orchestrator.

The orchestrator coordinates execution; it does not own domain
eligibility logic.

An engine MAY return `SKIPPED` when its own approved eligibility rule is
not satisfied.

------------------------------------------------------------------------

## 15. Override-Chaining Prohibition

After B2 adoption, future engines SHALL NOT be integrated through
patterns equivalent to:

``` javascript
const previous = someFunction;
someFunction = async function (...) {
  await previous(...);
  await runNewEngine(...);
};
```

or any mechanism where:

-   One engine replaces another engine's function.
-   Execution order depends on wrapper nesting.
-   Dependencies are hidden inside function reassignment.
-   Adding a new engine changes behavior by modifying another engine's
    entry point.

Existing override-chaining identified by Engineering Review SHALL be
handled according to the approved B2 migration scope.

No new override-chain SHALL be introduced.

------------------------------------------------------------------------

## 16. Existing Engine Migration Strategy

B2 SHALL use incremental migration.

The Engineering Review SHALL identify:

-   Current engine-like components.
-   Their actual entry points.
-   Current invocation triggers.
-   Existing override/wrapper chains.
-   Existing ordering assumptions.
-   Existing async/session guards.
-   Existing direct persistence behavior.
-   Existing dependencies.

Implementation, if required, SHALL migrate only the minimum current
execution chain necessary to establish the registry as the orchestration
authority for the affected engines.

For the Initial Registration Scope approved in Section 17 (Habit
Engine, Pattern Engine, Adaptive TDEE Engine, Trigger Engine), the
minimum required migration SHALL remove the following confirmed
orchestration-level override/replacement points and replace them with
registry-driven invocation:

-   The `showApp` override-chain wrappers currently used to invoke
    Adaptive TDEE Engine, Trigger Engine, Habit Engine and Pattern
    Engine.
-   The `logWeight` override-chain wrapper currently used to invoke
    Adaptive TDEE Engine.
-   The `saveWorkout` override-chain wrapper currently used to invoke
    Trigger Engine.
-   The full function-replacement of `scheduleLocalNotifications`
    currently used as an orchestration mechanism for Trigger Engine.

No Engine orchestration for any of the four initially registered
engines SHALL remain reachable through override-chaining, wrapper
reassignment or function replacement once this migration is complete.

Business logic SHALL remain in existing engine functions/modules
wherever practical. Adapters registered with the Engine Registry MAY
call the existing engine functions unchanged; this migration SHALL NOT
alter Habit, Pattern, Adaptive TDEE or Trigger Engine business logic,
detection rules, or algorithms.

B2 SHALL NOT require full extraction of all engines from `js/app.js`.

Broader modularization belongs to C1.

------------------------------------------------------------------------

## 17. Initial Registration Scope

The Initial Registration Scope is locked to exactly four engines:

-   Habit Engine
-   Pattern Engine
-   Adaptive TDEE Engine
-   Trigger Engine

A partial registry that leaves any of these four engines' orchestration
active outside the Registry (via override-chaining, wrapper
reassignment or function replacement) SHALL NOT be approved, because it
would create two competing orchestration authorities, contradicting
Section 2.

Engineering Review SHALL also identify any additional component
currently acting as an intelligence engine under Section 4; a component
SHALL NOT be registered merely because its name contains "engine."

### Habit Engine and Pattern Engine

**v1.2 (Code Review Round 4):** both now declare one explicit,
confirmed action rather than relying on an absent/`undefined` action
being treated as an implicit default (Section 6, Rule 8):

-   `APP_READY / RECOMPUTE` (Habit Engine)
-   `APP_READY / RECOMPUTE` (Pattern Engine)

Both remain locked to `dependsOn: []` (Section 11, Rule 10) and are
subject to the Habit Engine single-flight invariant (Section 11,
Rule 11).

### Trigger Engine

Trigger Engine SHALL remain **one logical Engine** with multiple
declared `triggers` and multiple approved `action` values, per Section
5 and Section 6. It SHALL NOT be split into multiple Engine IDs merely
because it is invoked by more than one trigger, because all of its
entry points share the same logical ownership: the shared daily budget,
deduplication (`canFire`/`markFired`), and the shared `coachEvents` /
`coachDay` write surface (via `logCoachEvent`).

Confirmed approved actions for Trigger Engine:

-   `APP_READY / DAILY_COACH_CHECK`
-   `SOURCE_DATA_CHANGED / WORKOUT_COMPLETED`
-   `AUTH_SESSION_READY / LOCAL_NOTIFICATION_SCHEDULE`

### Adaptive TDEE Engine

Adaptive TDEE Engine registration SHALL be split logically into two
concerns:

-   `runAdaptiveCheck()` --- the Engine orchestration surface. It SHALL
    be registered with the Engine Registry and SHALL declare its
    confirmed triggers/actions below.
-   `applyAdaptiveUpdate()` --- a manual, user-approved action that
    performs authoritative promotion of the pending proposal. It is
    **not required to be an Engine run** under this SPEC. It SHALL
    continue to use the existing Authority Contract (REM-003)
    unchanged. See Section 19 for its session-safety treatment.

Confirmed approved actions for the registered Adaptive TDEE Engine
(`runAdaptiveCheck()`):

-   `APP_READY / ADAPTIVE_CHECK`
-   `SOURCE_DATA_CHANGED / WEIGHT_CHANGED`
-   `MANUAL / ADAPTIVE_RECHECK`

The final initial registration set is fixed by this section and SHALL
be based on actual execution behavior confirmed by Engineering Review.

------------------------------------------------------------------------

## 18. Relationship to B1 Canonical Memory

B2 SHALL preserve B1.

Rules:

-   Engine registration does not create memory ownership.
-   Habit and Pattern outputs remain Derived Intelligence Views.
-   Engines MAY propose candidate memory only through future approved
    memory contracts.
-   No registered engine may create a parallel memory authority.
-   The Engine Registry SHALL NOT become a memory store.
-   Dependency results SHALL NOT automatically become canonical memory.

------------------------------------------------------------------------

## 19. Relationship to REM-002 Session Lifecycle

All user-scoped orchestration SHALL preserve REM-002.

Requirements:

-   Orchestration SHALL capture current session generation.
-   Async engine completion SHALL verify session validity before
    applying user-scoped effects.
-   A stale run SHALL NOT write or expose results into a new
    authenticated session.
-   Sign-out/account switch cleanup SHALL invalidate in-flight
    user-scoped orchestration.
-   Every user-scoped `action` invoked through the Registry SHALL use
    the existing REM-002 Session Lifecycle Manager. In particular, the
    Trigger Engine adapter handling `SOURCE_DATA_CHANGED /
    WORKOUT_COMPLETED` (the current `fireWorkoutTrigger()` path, which
    Engineering Review confirmed has no session guard today) SHALL
    capture and check session generation before applying its effects
    once migrated behind the Registry.
-   No parallel or additional session-generation mechanism SHALL be
    introduced beyond the existing Session Lifecycle Manager.
-   A stale orchestration result SHALL NOT be permitted to mutate
    state.

`applyAdaptiveUpdate()` is explicitly exempted from this section's
orchestration-level session requirement: it is a manual, synchronous,
immediate user-approval action rather than asynchronous Registry
orchestration (see Section 17). Its current absence of an explicit
session-generation guard is documented here as a known, pre-existing
condition that remains **out of B2 scope** and is not introduced or
worsened by B2.

Engineering Review SHALL verify how the current Session Lifecycle
Manager can be reused.

------------------------------------------------------------------------

## 20. Relationship to REM-003 Authority Contract

Engine registration SHALL NOT alter authority semantics.

Requirements:

-   Existing authority metadata remains valid.
-   Deterministic engine outputs SHALL retain their approved authority
    source.
-   Generative output remains non-authoritative unless promoted through
    an approved boundary.
-   The orchestrator SHALL NOT assign authority merely because an engine
    completed successfully.
-   Authority belongs to the producing domain/write contract, not the
    orchestration layer.

------------------------------------------------------------------------

## 21. Relationship to B3 and B4

B2 defines execution orchestration only.

### Deferred to B3

-   State namespace ownership.
-   Read interfaces.
-   Write interfaces.
-   Cross-engine state-access rules.
-   Prevention of direct cross-engine mutation.

### Deferred to B4

-   Shared persistence path.
-   Persistence transactions.
-   Retry behavior.
-   Rollback behavior.
-   Conflict handling.
-   Canonical durable write boundaries.

B2 implementation SHALL NOT preempt these decisions by creating ad hoc
state or persistence abstractions.

------------------------------------------------------------------------

## 22. Observability

The orchestrator SHALL make execution behavior inspectable.

Minimum run summary:

``` yaml
EngineRunSummary:
  runId: string
  trigger: string
  startedAt: timestamp
  completedAt: timestamp
  executionOrder: string[]
  results:
    <engineId>: EngineRunResult
```

This summary MAY remain runtime-only in B2.

B2 SHALL NOT require a new Firestore diagnostics collection.

Logging SHALL avoid exposing sensitive user data unnecessarily.

------------------------------------------------------------------------

## 22A. Required Automated Test Coverage

If Engineering Review confirms implementation is required, the
automated test suite for B2 SHALL cover at minimum:

-   An engine declaring multiple `triggers`.
-   Valid and invalid `action` values for a multi-action engine.
-   Trigger filtering (an engine SHALL NOT run for a trigger not in its
    declared `triggers`).
-   Deterministic execution ordering.
-   Duplicate Engine ID rejection.
-   Unknown-dependency rejection.
-   Circular-dependency rejection.
-   Dependency-failure propagation (a dependent engine SHALL be
    `SKIPPED`, per Section 13).
-   Session invalidation (a stale orchestration run SHALL NOT apply
    user-scoped effects).
-   All four approved engines (Habit, Pattern, Adaptive TDEE, Trigger)
    successfully registered.
-   No orchestration wrapper (`showApp`, `logWeight`, `saveWorkout`,
    `scheduleLocalNotifications` replacement) remains active for any of
    the four engines after implementation.
-   Business outputs and eligibility gates of Habit Engine, Pattern
    Engine, Adaptive TDEE Engine and Trigger Engine remain unchanged
    (regression coverage against pre-migration behavior).

**Added in v1.2 (Code Review Round 4):**

-   An `APP_READY`-shaped `EngineRunRequest` with a full per-engine
    action map invokes all four registered engines with the correct,
    distinct action each.
-   An eligible engine with no entry in `actions` is marked `SKIPPED`
    (`NO_ACTION_FOR_ENGINE`) and its `run(context)` is never invoked.
-   One engine's `action` is never delivered to, or observable by,
    another engine.
-   `payload` is routed only to the engine it was addressed to.
-   An explicitly-supplied but invalid/unrecognized action value
    returns a normalized `SKIPPED` result and does not invoke the
    engine's real business logic.
-   Habit Engine single-flight: two overlapping same-session calls
    invoke the underlying computation exactly once.
-   Habit Engine single-flight: a Registry-invoked call and Pattern
    Engine's internal call, overlapping in time, receive the identical
    in-flight `Promise`.
-   Habit Engine single-flight: a failure clears the in-flight
    reference and a subsequent call performs a genuine retry.
-   Habit Engine single-flight: a call made under a different session
    generation never reuses (or waits on) a previous generation's
    in-flight `Promise`.

------------------------------------------------------------------------

## 23. Scope

B2 includes:

-   Common Engine Contract.
-   One logical Engine Registry.
-   One logical Engine Orchestrator.
-   Explicit engine IDs.
-   Explicit triggers (one or more per engine).
-   Explicit actions for engines with more than one approved entry
    point.
-   Explicit dependencies.
-   Deterministic execution planning.
-   Cycle and missing-dependency detection.
-   Normalized engine run results.
-   Dependency-aware failure behavior.
-   Session-lifecycle compatibility.
-   Authority-contract compatibility.
-   Prohibition of future override-chaining.
-   Repository-based verification of the locked Initial Registration
    Scope (Section 17): Habit Engine, Pattern Engine, Adaptive TDEE
    Engine, Trigger Engine.
-   Minimum migration necessary to make the registry authoritative for
    all four engines in the Initial Registration Scope, including
    removal of the confirmed `showApp`, `logWeight`, `saveWorkout` and
    `scheduleLocalNotifications` override/replacement points
    (Section 16), if Engineering Review confirms implementation is
    required.

------------------------------------------------------------------------

## 24. Out of Scope

B2 SHALL NOT:

-   Redesign engine algorithms.
-   Change Habit detection rules.
-   Change Pattern detection rules.
-   Define how Habits/Patterns influence recommendations.
-   Implement Recommendation Engine behavior.
-   Define canonical state ownership.
-   Define shared persistence transactions or rollback.
-   Migrate canonical memory.
-   Add new Firestore collections.
-   Change Firestore rules unless Engineering Review proves an
    unavoidable requirement and the SPEC is returned for architecture
    approval.
-   Add Firebase Functions unless Engineering Review proves an
    unavoidable requirement and the SPEC is returned for architecture
    approval.
-   Perform broad `app.js` modularization.
-   Replace REM-002 Session Lifecycle.
-   Replace REM-003 Authority Contract.
-   Introduce an event bus as a substitute for explicit engine
    dependencies.
-   Resolve C3 `coachEvents` architecture.
-   Start B3, B4 or B5.

------------------------------------------------------------------------

## 25. Architectural Invariants

1.  FITME has one logical Engine Registry.
2.  Registered engines conform to one common semantic contract.
3.  Engine execution dependencies are explicit.
4.  Execution order is deterministic.
5.  Registration order is not dependency order.
6.  Source-file position is not dependency order.
7.  Future engines do not use override-chaining for orchestration.
8.  Circular dependencies are invalid.
9.  Missing required dependencies are invalid.
10. Engine registration grants neither state ownership nor persistence
    authority.
11. Engine registration grants no canonical-memory authority.
12. Session isolation remains enforced.
13. Authority semantics remain enforced.
14. Business logic remains inside engine domains, not the orchestrator.
15. B3 owns state-boundary decisions.
16. B4 owns persistence-contract decisions.
17. B5 owns Habit/Pattern consumption behavior.
18. No broad rewrite is required to satisfy B2.

------------------------------------------------------------------------

## 26. Engineering Readiness Review Requirements

Claude Code SHALL perform an Engineering Readiness Review only.

The review SHALL verify the current repository and report:

1.  Every current component that qualifies as an engine under Section 4.
2.  Each engine's current entry point.
3.  Each engine's current trigger(s) and, where the engine has more
    than one approved entry point, each corresponding `action`.
4.  All override-chaining, wrapper reassignment or equivalent implicit
    orchestration.
5.  Current execution order and where that order is encoded.
6.  Actual dependencies versus accidental ordering.
7.  Current session-generation guards for each relevant async engine
    path.
8.  Current authority metadata behavior for each relevant engine output.
9.  Current persistence calls made by each engine, without redesigning
    persistence.
10. Whether Habit, Pattern, Trigger and Adaptive TDEE (the locked
    Initial Registration Scope, Section 17) can each be fully migrated
    onto the Registry with no orchestration authority left outside it.
11. Whether additional engines must be included to eliminate F1/F3.
12. Whether B2 can be completed as architecture-only or requires
    implementation.
13. If implementation is required, the minimum exact file/function
    scope, including confirmation that all override-chain and
    function-replacement points identified in Section 16 are covered.
14. Whether the declared `triggers[]` and `action` set for each of the
    four locked-in engines (Section 17) matches actual repository
    lifecycle behavior.
15. Whether any additional trigger or action, beyond those already
    identified in Section 17, is required to fully eliminate
    override-chaining for the four locked-in engines.
16. Whether dependency results can be exposed without introducing B3/B4
    decisions.
17. Any contradiction with B1, REM-002 or REM-003.

Claude Code SHALL NOT implement code during this review.

If repository evidence contradicts this SPEC, return `NOT READY` with
exact file/function references and required SPEC corrections.

If no blocking contradiction exists, return `READY`.

------------------------------------------------------------------------

## 27. Engineering Review Output Format

``` text
B2 — Engine Contract and Registry
Engineering Readiness Review

Status: READY | NOT READY

Current Engine Inventory:
- ...

Current Orchestration Findings:
- ...

Contract Compatibility:
- ...

Initial Registry Scope:
- ...

Implementation Requirement:
ARCHITECTURE ONLY | IMPLEMENTATION REQUIRED

Minimum Implementation Scope:
- None | ...

Session / Authority Compatibility:
- ...

Blocking Issues:
- None | ...

Required SPEC Corrections:
- None | ...

Downstream Notes:
- ...

Final Recommendation:
READY FOR APPROVAL | RETURN TO ARCHITECTURE
```

------------------------------------------------------------------------

## 28. Acceptance Criteria

B2 is complete only when:

-   [ ] One common semantic Engine Contract is approved.
-   [ ] One logical Engine Registry is approved.
-   [ ] One logical Engine Orchestrator is approved.
-   [ ] Engine identity requirements are defined.
-   [ ] Trigger semantics are defined.
-   [ ] Dependency semantics are defined.
-   [ ] Deterministic ordering is defined.
-   [ ] Circular dependencies are rejected.
-   [ ] Missing dependencies are rejected.
-   [ ] Failure behavior is defined.
-   [ ] Override-chaining is prohibited for future engines.
-   [ ] Initial registry scope is verified against the repository.
-   [ ] REM-002 compatibility is verified.
-   [ ] REM-003 compatibility is verified.
-   [ ] B1 invariants are preserved.
-   [ ] All four approved engines (Habit, Pattern, Adaptive TDEE,
    Trigger) are registered in the Engine Registry.
-   [ ] No parallel Engine orchestration authority remains outside the
    Registry for any of the four engines.
-   [ ] Every trigger and every action is explicit and validated.
-   [ ] `showApp`, `logWeight`, `saveWorkout` and local-notification
    scheduling no longer use override-chaining, wrapper reassignment or
    function replacement to invoke the four registered engines.
-   [ ] Session isolation is preserved for every asynchronous
    Registry-invoked action.
-   [ ] The function-replacement of `scheduleLocalNotifications` no
    longer exists as an orchestration mechanism.
-   [ ] Every eligible engine receives its action from an explicit
    per-engine-id `actions` map (`EngineRunRequest`, Section 6); no
    engine's behavior is selected by treating an absent or `undefined`
    action as an implicit default.
-   [ ] An eligible engine with no entry in `actions` is `SKIPPED`
    (`NO_ACTION_FOR_ENGINE`) without its `run(context)` being invoked.
-   [ ] Habit Engine correctness against double-execution (Registry vs.
    Pattern Engine's internal call) is provided by the single-flight
    invariant (Section 11, Rule 11), not by lexicographic tie-break
    order, and is session-safe (never shares an in-flight run across
    session generations).
-   [ ] No hard `dependsOn` was introduced between Habit Engine and
    Pattern Engine to achieve the above.
-   [ ] Engineering Readiness Review returns `READY`.
-   [ ] Any required implementation is completed and reviewed.
-   [ ] Product/Architecture Approval is recorded.
-   [ ] Relevant documentation is synchronized.
-   [ ] Commit is created and pushed.
-   [ ] B2 is marked closed.
-   [ ] B3 is explicitly marked `NEXT`.

------------------------------------------------------------------------

## 29. Implementation Gate

No implementation SHALL begin until Engineering Readiness Review returns
`READY` and Product/Architecture approves the reviewed implementation
scope.

If the review determines `ARCHITECTURE ONLY`, no production code SHALL
be changed for B2.

If the review determines `IMPLEMENTATION REQUIRED`, implementation SHALL
be limited to the minimum approved scope necessary to establish the
Engine Contract/Registry and eliminate the identified F1/F3
orchestration ambiguity.

Any requirement to change architecture beyond this SPEC SHALL return B2
to Architecture/SPEC revision before coding.

------------------------------------------------------------------------

## 30. Documentation Closure Requirements

At B2 closure, update:

-   Roadmap
-   Changelog
-   FITME AI Architecture Remediation Plan
-   `docs/tasks/B2/SPEC.md`
-   Any Architecture document whose engine-orchestration definition
    changed in practice

The closure update SHALL:

-   Mark B2 completed.
-   Record the approved Engine Contract and Registry decision.
-   Record the initial registered-engine scope.
-   Record whether production implementation was required.
-   Record verification/test results if implementation occurred.
-   Mark **B3 --- State Ownership and Access Boundaries** as `NEXT`.

------------------------------------------------------------------------

## 31. Next Task

After B2 is approved, implemented if required, reviewed, documented,
committed, pushed and closed:

**B3 --- State Ownership and Access Boundaries**

Status after B2 closure:

`NEXT`

------------------------------------------------------------------------

# Final Closure (v1.3)

This section records the closure of B2 following implementation, Code
Review (including two correction rounds) and Product/Architecture
Approval. It does not alter the contract recorded in Sections 1--28
above.

- **Engineering Readiness Review Round 2:** `READY`
- **Implementation:** `COMPLETE`
- **Code Review:** `FIXED AND APPROVED` (two correction rounds applied
  during review, both re-verified)
- **Product/Architecture Approval:** `APPROVED`
- **Tests:** `86/86 PASSED`
- **Implementation Version:** `2.21.0`
- **Commit:** recorded after this document was written as part of the
  single closure commit `feat(architecture): complete B2 engine
  registry`; the exact hash is reported in the closure report rather
  than injected here via a second commit.
- **B3 --- State Ownership and Access Boundaries:** marked `NEXT`.

## Final Architectural Decisions

- FITME has one logical Engine Registry and one logical Engine
  Orchestrator (`js/engineRegistry.js`).
- Exactly four engines are registered: Habit Engine, Pattern Engine,
  Adaptive TDEE Engine, Trigger Engine.
- Every orchestration run is an explicit `EngineRunRequest`: one
  trigger plus a per-engine-id `actions` map and optional `payloads`
  map. No engine's action is ever inferred from an absent/`undefined`
  value; an eligible engine with no explicit action is `SKIPPED`
  (`NO_ACTION_FOR_ENGINE`) without its `run()` being invoked.
- A registered engine may declare more than one trigger (`triggers[]`)
  without being split into multiple Engine IDs, provided its logic and
  ownership remain genuinely one engine (Trigger Engine, Adaptive TDEE
  Engine).
- Habit Engine correctness against double-execution (the Registry's
  own invocation vs. Pattern Engine's internal soft call) is guaranteed
  by a session-generation-scoped single-flight mechanism in the
  orchestration/adapter layer, not by lexicographic tie-break order and
  not by any `dependsOn` relationship.
- Habit Engine's and Pattern Engine's `dependsOn` remain locked to
  `[]`; no hard dependency was introduced between them, preserving
  Pattern's approved graceful-degradation-on-Habit-failure behavior.
- All prior override-chaining/wrapper-reassignment/function-replacement
  orchestration for these four engines (`showApp` Stages 4--7,
  `logWeight`, `saveWorkout`, the `scheduleLocalNotifications`
  base+replacement pair) has been removed and replaced by explicit
  Registry-driven invocation.
- REM-002 `SessionLifecycle` and REM-003 `AuthorityContract` are
  reused unchanged; the Registry/Orchestrator introduces no parallel
  session mechanism and assigns no authority itself.
- No Firestore schema, Firestore rules, or Firebase Functions changes
  were made or required.
