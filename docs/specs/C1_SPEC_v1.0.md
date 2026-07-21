# FITME — C1_SPEC_v1.1

## Phase C — Modularization and Tests

**Status:** CANONICAL SPECIFICATION — CLOSED  
**Version:** 1.1  
**Product / Architecture Authority:** FITME Head of Product + AI Architect  
**Engineering Role:** Claude Code — Lead Engineer, implementation authority only  
**Repository Baseline Reviewed:** FITME client version `2.24.0`  
**Primary Target:** `js/app.js` (4,453 lines at reviewed baseline)  
**Change Class:** Internal maintainability refactor with zero intended product-behaviour change

---

# 0. Canonical Authority

This document is the single source of truth for C1.

C1 may not be implemented from memory, engineering preference, generic refactoring conventions, or assumptions about how FITME “should” be structured. The current approved FITME product behaviour, the B1–B5 architecture contracts, the governing project documents, and this specification jointly define the permitted implementation.

Where repository reality and an earlier generic statement in this document conflict, the repository-grounded requirements in Sections 8–24 take precedence.

Any deviation that could change product behaviour, user-visible flow, AI output semantics, state ownership, persistence authority, engine ordering, memory meaning, or future-native portability requires explicit Product and Architecture approval before implementation.

---

# 1. Executive Summary

C1 is the first task in Phase C. It converts FITME’s current architecture from a strong set of contracts wrapped around a large browser-oriented orchestration file into a maintainable modular application structure.

C1 is not a rewrite.

C1 is not a product redesign.

C1 is not an opportunity to improve, simplify, reinterpret, or modernize FITME’s behaviour.

The user must not be able to distinguish the application before and after C1, except for incidental improvements that arise solely from reduced defects and are explicitly approved during review.

The reviewed baseline already contains strong modular foundations:

- `sessionLifecycle.js`
- `nutritionValidator.js`
- `authorityContract.js`
- `engineRegistry.js`
- `stateAccess.js`
- `persistenceGateway.js`
- `derivedIntelligenceConsumer.js`
- `derivedIntelligencePrompt.js`
- `memory.js`

However, `app.js` still owns or coordinates most application responsibilities: authentication lifecycle, Firestore reads, UI rendering, nutrition flows, camera and barcode integration, coach prompting, adaptive TDEE, triggers, engines, profile flows, group flows, and browser-specific integration.

C1 shall reduce this concentration through small, contract-preserving extractions.

The governing success condition is:

> Same approved input + same approved state + same trigger = same externally observable FITME behaviour.

This invariant applies to the current PWA and to any future iOS or Android shell that consumes the same platform-neutral modules.

---

# 2. Product Intent

FITME is moving toward a 20-person real-world pilot. The pilot is not disposable prototype code. It is the first production-validating form of the intended product.

If the pilot succeeds, the future App Store and Google Play applications must preserve the product users validated:

- the same nutrition logging semantics;
- the same memory model;
- the same Habit and Pattern outputs;
- the same derived-intelligence filtering;
- the same recommendation and coach context rules;
- the same authority boundaries;
- the same persistence meaning;
- the same user confirmation requirements;
- the same session-isolation guarantees.

C1 therefore exists to ensure that future platform migration replaces UI and platform adapters rather than re-creating FITME’s decision logic.

---

# 3. Goals

C1 shall:

1. Reduce `app.js` from a multi-domain implementation file toward an application composition and orchestration entry point.
2. Extract coherent responsibilities into independently testable modules.
3. preserve every B1–B5 contract.
4. expand automated regression protection around the extracted behaviour.
5. isolate browser, DOM, Firebase compat SDK, camera, notification, service-worker, and third-party API mechanics.
6. make dependency direction explicit.
7. remove avoidable override/hook layering where it can be replaced safely without behaviour change.
8. improve engineering readability and future maintainability.
9. preserve the static-client deployment model unless a separate approved task changes it.
10. maintain compatibility with the current script-loading model during C1.
11. improve future native-app portability without selecting a native framework.

---

# 4. Non-Goals

C1 shall not:

- add product features;
- redesign the UI;
- change copy, tone, coach personality, prompt meaning, or output limits;
- change caloric, macro, BMR, TDEE, adaptive-TDEE, habit, pattern, trigger, or recommendation formulas;
- change the AI provider or model selection;
- redesign authentication;
- change Firestore schema;
- change Firestore Security Rules except where a strictly mechanical module path change requires no semantic rule change;
- create a new store;
- introduce Redux, MobX, Zustand, RxJS, event sourcing, or another state framework;
- create a new event model;
- implement C2 feedback semantics;
- make the C3 event-model decision;
- implement the C4 typed memory server write path;
- move existing client logic to the server;
- migrate to React, React Native, Flutter, Swift, Kotlin, TypeScript, ESM, a bundler, or a package framework;
- replace global script loading with a new build system;
- normalize all historical naming;
- perform broad performance optimization;
- remove legacy fields or migrations;
- change persistence conflict policy;
- generalize closed catalogs into runtime-extensible registries;
- redesign the memory transparency UI;
- redesign service-worker caching.

Any such change requires a separate approved specification.

---

# 5. Governing Architecture Invariants

## 5.1 B1 — Canonical Memory

The canonical memory model remains authoritative.

C1 must not:

- create a parallel memory store;
- change memory types, sources, statuses, or meaning;
- reinterpret `coachMemory` compatibility data;
- remove migrations;
- alter consent or transparency behaviour.

## 5.2 B2 — Engine Contract and Registry

`EngineRegistry` remains the sole approved orchestrator for registered engines.

C1 must preserve:

- explicit engine registration;
- explicit per-engine actions;
- trigger eligibility;
- dependency closure;
- deterministic topological ordering;
- sequential execution;
- normalized engine results;
- independent-engine continuation after unrelated failure;
- dependency-failure skipping;
- single-flight protections already present in adapters.

No extraction may reintroduce direct ad hoc engine sequencing outside approved adapters and registry entry points.

## 5.3 B3 — State Ownership and Access

`StateAccess` remains the approved engine-facing state boundary.

C1 must not:

- expose raw `db`, `userProfile`, or `todayData` to extracted engines;
- add generic `get(path)` or `set(path)` operations;
- widen an engine’s read or write authority;
- bypass session-generation checks;
- return mutable live references where snapshots are required.

## 5.4 B4 — Persistence Contract

`PersistenceGateway` remains the logical durable-write channel for approved AI/core-engine operations.

C1 must preserve:

- the closed operation catalog;
- owner/domain checks;
- authority requirements;
- session checks;
- conflict semantics;
- retry rules;
- stale-on-completion semantics;
- repository-specific write behaviour;
- optimistic candidate plus rollback behaviour for authoritative meal writes.

Legacy broad writes may only be moved behind a module boundary. C1 does not automatically migrate every legacy write into the Gateway.

## 5.5 B5 — Derived Intelligence Consumption

`DerivedIntelligenceConsumer` remains the sole approved runtime consumption adapter for Habit/Pattern derived views.

C1 must preserve:

- policy resolution;
- eligibility and relevance filtering;
- contradiction treatment;
- limits;
- diagnostics boundaries;
- context schema;
- prompt projection wording rules;
- no producer recomputation during consumption;
- no direct raw Habit/Pattern injection into prompts.

---

# 6. Reviewed Repository Baseline

The reviewed client loads the following local scripts in order:

1. `js/firebase-config.js`
2. `js/sessionLifecycle.js`
3. `js/nutritionValidator.js`
4. `js/authorityContract.js`
5. `js/engineRegistry.js`
6. `js/stateAccess.js`
7. `js/persistenceGateway.js`
8. `js/derivedIntelligenceConsumer.js`
9. `js/derivedIntelligencePrompt.js`
10. `js/app.js`
11. `js/memory.js`

This order is currently a runtime contract because the application uses browser globals rather than ESM imports.

C1 may add new script files, but it must update all of the following consistently:

- `index.html` script order;
- `sw.js` shell cache;
- application version;
- service-worker cache version;
- tests;
- architecture documentation.

No extracted module may rely on being loaded after `app.js` unless that dependency is explicitly documented and justified. New business and orchestration modules should normally load before `app.js`, with dependencies injected or exposed through a narrow global API consistent with existing project modules.

---

# 7. Current Architecture Assessment

## 7.1 Strong Existing Foundations

The repository already demonstrates several correct architecture patterns:

- pure IIFE modules with browser and Node export support;
- closed catalogs;
- dependency injection through `configure()`;
- immutable or protected snapshots;
- session-generation guarding around asynchronous work;
- explicit authority metadata;
- operation-specific persistence;
- deterministic orchestration;
- pure prompt projection;
- isolated nutrition validation;
- versioned module contracts.

These patterns shall be reused.

## 7.2 Primary Remaining Weakness

The central weakness is not absence of architecture. It is concentration of application composition, domain logic, UI logic, platform mechanics, and historical overrides in `app.js`.

At the reviewed baseline, `app.js` is approximately 4,453 lines and includes the following responsibility clusters:

- global application state;
- session cleanup;
- authentication lifecycle;
- profile/day/favourites/history persistence;
- notifications;
- coach prompt assembly and messaging;
- onboarding;
- home rendering;
- water and weekly chart rendering;
- weight logging;
- food analysis and questionnaires;
- image compression and camera analysis;
- barcode scanner lifecycle;
- Open Food Facts integration;
- group barcode cache;
- meal editor model and UI;
- authoritative meal write orchestration;
- favourites;
- quick logging;
- workouts;
- streaks and achievements;
- groups;
- plans;
- profile metrics;
- settings;
- adaptive TDEE;
- measurement tracking;
- trigger engine behaviour;
- usage accounting;
- historical override hooks;
- Habit Engine;
- Pattern Engine;
- B2 engine adapters;
- StateAccess and PersistenceGateway composition.

This concentration creates three major risks:

1. a small change can affect unrelated domains;
2. tests must often load broad application context;
3. future native migration cannot reuse logic cleanly until platform mechanics are separated.

## 7.3 Historical Override Debt

`app.js` contains later-stage overrides and hooks that replace or wrap earlier definitions, including navigation and home rendering sections.

This is understandable during iterative product development, but it creates hidden final-definition semantics:

- the function visible earlier in the file may not be the runtime function;
- behaviour depends on declaration order;
- extractions can accidentally capture a superseded definition;
- code review becomes harder.

C1 shall remove selected override layering only when behaviour is frozen by regression tests. No override may be removed based solely on visual similarity.

---

# 8. Technical Debt Inventory

## 8.1 Critical for C1

### TD-C1-001 — Multi-domain `app.js`

Severity: High  
Treatment: Required

### TD-C1-002 — Direct DOM access mixed with calculations and state transitions

Severity: High  
Treatment: Required for selected extraction targets

### TD-C1-003 — Direct Firebase compat SDK access throughout application orchestration

Severity: High  
Treatment: Extract repositories/adapters without schema changes

### TD-C1-004 — Browser globals as implicit dependencies

Severity: High  
Treatment: Narrow APIs and injected dependencies

### TD-C1-005 — Override-based final behaviour

Severity: Medium/High  
Treatment: Consolidate targeted overrides after parity tests

### TD-C1-006 — Cross-domain global mutable state

Severity: High  
Treatment: Introduce explicit runtime-state ownership modules where safe; do not introduce a new store

### TD-C1-007 — Incomplete module-level testability of application flows

Severity: High  
Treatment: Add characterization and contract tests before extraction

## 8.2 Important but Not Fully Solved by C1

### TD-C1-008 — Inline event handlers in HTML

C1 may preserve them. Removing them would broaden scope into UI event architecture.

### TD-C1-009 — Firebase compat SDK and global Firebase objects

C1 isolates usage but does not migrate SDK style.

### TD-C1-010 — Static script composition

C1 preserves it.

### TD-C1-011 — Mixed Hebrew/English identifiers and comments

C1 does not perform broad renaming.

### TD-C1-012 — Legacy broad-save operations

C1 may wrap them in repositories but does not redefine B4 scope.

## 8.3 Deferred

- typed server write path;
- canonical event bus;
- feedback suppression model;
- native framework selection;
- CSS and visual component architecture;
- service-worker redesign;
- backend domain decomposition.

---

# 9. Target Architecture

```text
index.html / Browser Events
            │
            ▼
UI Controllers / Presenters
            │
            ▼
Application Services / Use-Case Orchestrators
            │
            ├──────────────► Pure Domain Services
            │
            ├──────────────► Existing Engine Registry + Engine Adapters
            │
            ├──────────────► StateAccess
            │
            └──────────────► Repository / Platform Adapters
                                      │
                                      ├── Firebase
                                      ├── Browser APIs
                                      ├── Camera / Barcode
                                      ├── Notifications
                                      └── External HTTP
```

## 9.1 Dependency Direction

Allowed:

- UI → application service;
- application service → pure domain service;
- application service → repository contract;
- app composition → module `configure()`;
- engine adapter → StateAccess;
- StateAccess → approved persistence dependency;
- repository adapter → Firebase/browser/external API.

Forbidden:

- pure domain module → DOM;
- pure domain module → `window`;
- pure domain module → Firebase;
- pure domain module → `currentUser`, `userProfile`, or `todayData`;
- UI renderer → direct durable write;
- extracted module → generic path-based state mutation;
- application service → raw Habit/Pattern view bypassing B5;
- engine → direct persistence bypassing B3/B4.

---

# 10. C1 Modularization Strategy

C1 shall use incremental extraction, not a big-bang rewrite.

Every extraction follows:

1. identify final runtime behaviour;
2. add characterization tests;
3. define module contract;
4. extract pure logic first;
5. inject platform dependencies;
6. preserve existing entry point;
7. run complete test suite;
8. verify manual smoke scenarios;
9. update service-worker shell where needed;
10. commit separately.

The current global functions called by inline HTML may remain as thin compatibility facades during C1.

Example:

```js
function analyzeFood() {
  return FitMeFoodController.analyzeText();
}
```

The facade must contain no duplicated business logic.

---

# 11. Approved Extraction Work Packages

C1 shall be implemented as the following ordered work packages. Claude may propose a narrower safe grouping during readiness review, but may not reorder high-risk packages ahead of their prerequisites without approval.

## C1-WP0 — Characterization Harness and Repository Inventory

### Purpose

Freeze current behaviour before moving code.

### Required Work

- inventory every final runtime function, including overridden and wrapped definitions;
- identify every override chain and record, for each chain:
  - the original definition;
  - each later replacement or wrapper;
  - the final runtime definition;
  - all compatibility aliases or facades that remain callable;
- inventory all explicit `window` assignments and dynamically exposed globals;
- identify all global state reads/writes per function;
- identify DOM IDs used per flow;
- identify Firebase collections/documents used per flow;
- identify external APIs;
- inventory existing tests;
- verify the canonical regression suite from the repository root with `node --test`;
- add missing high-value characterization tests.

### Outputs

- machine-readable or documented function map;
- complete final-runtime-definition and override-chain inventory;
- `window` assignment and compatibility-facade inventory;
- dependency map;
- initial regression suite;
- recorded regression baseline showing `262` tests passed and `0` failed at specification revision time;
- no product code movement except test seams if strictly required.

### Exit Gate

No extraction begins until:

- the complete final-runtime-definition inventory is reviewed;
- every override chain has one explicitly identified final runtime implementation;
- the Day Navigation IIFE and its callable compatibility surface are mapped;
- critical meal, auth/session, engine, adaptive, coach, navigation, and day-navigation flows have baseline tests;
- the full repository test suite passes from the canonical root-level `tests/` layout.

---

## C1-WP1 — Shared Pure Utilities

### Candidate Functions

- `dateKey`
- `getTodayKey` through injected clock wrapper
- `daysBetween`
- `linearSlope`
- `dayKcal`
- `calcBMI`
- `getBMICategory`
- `calcBodyFat`
- `esc`
- numeric formatting/rounding helpers where semantics are identical
- `parseModelJSON`
- `normalizeItem`
- image-independent nutrition data helpers
- protein-target calculation

### Target Modules

- `js/core/dateUtils.js`
- `js/core/numberUtils.js`
- `js/core/jsonUtils.js`
- `js/domain/profileMetrics.js`
- `js/domain/nutritionModel.js`

Folder names may be adjusted to match repository conventions, but responsibilities may not be collapsed into a generic “utils” dumping ground.

### Rules

- clock-dependent functions must accept `now` or a clock dependency in tests;
- no DOM access;
- no global state;
- Node-loadable;
- no behaviour changes from normalization.

### Exit Gate

All extracted utilities have direct unit tests and callers retain identical output.

---

## C1-WP2 — Platform Adapters

### Purpose

Isolate browser and external-service mechanics.

### Approved Adapters

#### Authentication Adapter

Wrap:

- Firebase auth state subscription;
- Google popup/redirect sign-in;
- sign-out;
- token acquisition.

No auth behaviour change.

#### Notification Adapter

Wrap:

- permission checks;
- permission request;
- service-worker readiness;
- local notification display;
- timer scheduling.

#### Camera/Image Adapter

Wrap:

- file reading;
- image loading;
- canvas compression;
- camera input activation.

#### Barcode Scanner Adapter

Wrap:

- dynamic `html5-qrcode` loading;
- scanner lifecycle;
- camera errors;
- stop/clear semantics.

#### External Food Catalog Adapter

Wrap:

- Open Food Facts request;
- response mapping;
- network error mapping.

#### Claude Proxy Client

Wrap:

- token acquisition;
- authenticated POST;
- response parsing;
- error normalization.

### Rules

- adapters do not decide product policy;
- adapters return normalized results;
- UI text remains at the controller/presenter boundary unless it is already a fixed platform error message;
- network retry behaviour may not change;
- daily quota behaviour remains server-owned.

### Exit Gate

All direct platform calls in selected flows route through named adapters.

---

## C1-WP3 — Repository Layer for Existing Application Data

### Purpose

Isolate Firestore mechanics that are currently implemented directly in `app.js`.

### Approved Repositories

#### Profile Repository

Current behaviours to preserve:

- load user profile;
- merge profile;
- one-time `groupCode` → `groupId` migration;
- favourites/profile quick-items interactions where currently stored.

#### Day Repository

Current behaviours to preserve:

- load current day;
- save legacy day data;
- fetch up to the last 400 stored day documents through client-side ordering;
- authoritative meal snapshot write remains through PersistenceGateway.

#### Favourites Repository

Preserve document path and payload shape.

#### Group Repository

Preserve:

- membership reads;
- profile/day lookup behaviour;
- join behaviour;
- group code semantics.

#### Barcode Repository

Preserve:

- group-scoped product cache;
- data validity checks;
- metadata fields;
- merge semantics.

### Rules

- no Firestore path changes;
- no schema changes;
- no query change that alters returned data;
- session guards remain in application services;
- broad saves remain explicitly marked legacy where applicable;
- B4 operations remain in PersistenceGateway and are not duplicated here.

### Exit Gate

UI/application services no longer construct Firestore paths for extracted responsibilities.

---

## C1-WP4 — Session and Application Bootstrap

### Current Responsibilities

- global runtime initialization;
- `SessionLifecycle.reset`;
- `_resetAppCoreState`;
- auth transition;
- loading profile/day/favourites;
- showing login/onboarding/app;
- memory migration kickoff;
- notification initialization;
- engine startup.

### Target Modules

- `js/app/runtimeState.js`
- `js/app/bootstrapController.js`
- `js/app/authSessionController.js`

Names may differ, but ownership must remain explicit.

### Runtime State Contract

C1 may create a runtime-state owner module, but it must not become a generic state framework.

The module may expose closed semantic accessors such as:

- `getCurrentUser()`
- `setAuthenticatedUser(user)`
- `getProfile()`
- `replaceProfile(profile)`
- `getDisplayedDay()`
- `replaceDisplayedDay(snapshot)`
- `resetForSession()`

It must not expose:

- `get(key)`
- `set(key, value)`
- arbitrary patching;
- global mutable object references to engines.

### Required Preservation

- generation increments before cleanup;
- stale async completions do not update UI/state;
- account isolation;
- user-specific UI clearing;
- camera/timer cleanup;
- migration retry per authenticated session;
- login/onboarding/app selection;
- non-blocking engine startup.

### Exit Gate

Authentication lifecycle is readable as one explicit state machine without changing product behaviour.

---

## C1-WP5 — Nutrition Application Domain

This is the largest user-facing extraction and must be split internally.

### C1-WP5A — Nutrition AI Analysis Service

Extract:

- questionnaire request construction;
- calculation request construction;
- plate prompt selection;
- label prompt selection;
- editor-item estimation;
- JSON parsing dependency;
- nutrition validation routing.

Preserve:

- models;
- token limits;
- prompt text and JSON schema;
- source types;
- validation checkpoints;
- session generation guards;
- recovery options.

### C1-WP5B — Meal Draft Model

Extract pure operations:

- normalized draft creation;
- totals;
- quantity changes;
- edit updates;
- deletion;
- suggestion promotion;
- authoritative meal construction.

Preserve:

- rounding;
- `qty`;
- source fields;
- barcode metadata;
- authority metadata;
- time format.

### C1-WP5C — Meal Editor Presenter

Own:

- rendering editor HTML;
- validation banner;
- source badge;
- binding compatibility handlers;
- recovery UI.

Must not own durable writes.

### C1-WP5D — Meal Commit Service

Own:

- final validation;
- barcode cache update;
- authority construction;
- optimistic append;
- PersistenceGateway write;
- rollback;
- stale-session effect suppression;
- quick-item learning;
- streak update;
- post-commit rendering callbacks.

This service is high risk. Its tests must prove:

- second validation gate remains mandatory;
- exempt sources remain exempt;
- failed persistence rolls back the exact candidate;
- two near-simultaneous writes compose from current mutable state as before;
- stale completion does not alert or render;
- successful write retains authority metadata.

### C1-WP5E — Quick Log Service

Extract:

- learning;
- scoring;
- cap;
- pin/remove;
- authoritative quick commit.

Preserve scoring constants and current validation behaviour.

### C1-WP5F — Barcode Flow Controller

Extract:

- scanner start/stop;
- cache-first lookup;
- Open Food Facts fallback;
- label fallback;
- source tagging;
- group cache persistence.

### Exit Gate

Nutrition logic is separated into model/service/presenter/adapters while inline HTML compatibility remains intact.

---

## C1-WP6 — Coach and Prompt Composition

### Scope

Extract:

- coach identity/style/chatter access;
- system-prompt composition;
- coach message request;
- local coach-line templates;
- home coach-card context composition;
- B5 derived-intelligence prompt-fragment integration.

### Target Modules

- `js/coach/coachProfile.js`
- `js/coach/coachPromptComposer.js`
- `js/coach/coachClient.js`
- `js/coach/coachPresenter.js`

### Rules

- exact approved prompt semantics must remain;
- B5 prompt projector remains the only Derived Intelligence text projector;
- no raw derived records enter prompts;
- max-token choices remain;
- local fallback text remains;
- no new tone category;
- no Markdown output;
- no additional user data included.

### Exit Gate

Coach composition can be tested without DOM or Firebase.

---

## C1-WP7 — Adaptive TDEE Domain

### Pure Domain Functions to Extract

- adaptive rate selection;
- day window construction;
- day classification;
- partial-day detection;
- linear trend calculation;
- adaptive TDEE calculation;
- measurement analysis;
- weekly signal construction;
- deficit adjustment;
- proposal construction;
- local explanation.

### Application/UI Responsibilities to Separate

- history loading;
- card rendering;
- AI explanation request;
- proposal application;
- dismissal;
- partial-day confirmation;
- settings updates;
- measurement logging.

### Required Preservation

- every threshold;
- every window size;
- every fallback;
- proposal-only versus authoritative apply distinction;
- StateAccess/PersistenceGateway path;
- user confirmation requirement;
- stale-session guards;
- current UI copy.

### Exit Gate

The Adaptive TDEE calculation module is pure, deterministic, and fully unit-tested with fixture histories.

---

## C1-WP8 — Trigger and Notification Domain

### Pure Domain Functions

- daily budget checks;
- trigger evaluators;
- priority selection inputs;
- protein target and hints;
- local trigger text.

### Application Responsibilities

- history/profile snapshot gathering;
- EngineRegistry action;
- StateAccess commands;
- live coach text;
- card presentation;
- local notification scheduling.

### Required Preservation

- existing priorities;
- one selected trigger where applicable;
- daily budget;
- event recording;
- direct workout response;
- local/live text choice;
- no additional notification.

### Exit Gate

Trigger decisions are testable without DOM, Firebase, or Notification APIs.

---

## C1-WP9 — Habit and Pattern Engine Extraction

The Habit and Pattern engines currently live inside the latter part of `app.js`, while their orchestration contract already exists in `EngineRegistry`.

### Purpose

Move producer logic into dedicated modules without changing B2–B5 semantics.

### Target Modules

- `js/engines/habitEngine.js`
- `js/engines/patternEngine.js`
- `js/engines/adaptiveTdeeEngineAdapter.js`
- `js/engines/triggerEngineAdapter.js`
- `js/engines/registerEngines.js`

### Required Preservation

- IDs and versions;
- triggers;
- dependencies;
- action routing;
- result shapes;
- source-event counts;
- lifecycle and confidence semantics;
- fingerprints;
- deterministic ordering;
- once-per-day gates;
- single-flight behaviour;
- StateAccess-only engine reads/writes;
- persistence summaries;
- non-blocking app startup.

### Prohibition

Do not combine Habit and Pattern into one “intelligence engine.”

### Exit Gate

`app.js` contains engine composition and app-facing invocation only, not producer algorithms.

---

## C1-WP10 — UI Controllers and Override Consolidation

### Scope

Consolidate final runtime definitions for:

- navigation;
- home rendering;
- food screen rendering;
- profile rendering;
- settings rendering;
- date navigation compatibility functions;
- the Day Navigation IIFE, including its final runtime implementation, internal closure dependencies, public compatibility functions, and any related `window` assignments.

### Rules

- preserve inline handler names where HTML depends on them;
- preserve the Day Navigation IIFE behaviour and callable surface exactly unless a characterization test proves an equivalent thin facade;
- do not extract or consolidate any superseded navigation definition as though it were authoritative;
- move rendering into presenters/controllers;
- keep compatibility facade functions on `window` only where necessary;
- do not redesign HTML;
- do not change DOM IDs;
- do not change visual copy;
- do not remove fallback paths without tests.

### Exit Gate

There is one authoritative implementation per controller action, and the Day Navigation IIFE has one explicitly documented authoritative runtime path with all required compatibility entry points preserved.

---

## C1-WP11 — Final Composition Root Cleanup

At completion, `app.js` should primarily contain:

- version constants;
- module configuration;
- application composition;
- compatibility facades required by HTML;
- startup calls;
- small cross-module orchestration that does not belong to a domain module.

C1 does not define a mandatory line-count target. A line-count target could incentivize unsafe movement or meaningless fragmentation.

Success is based on responsibility reduction and testability.

---

# 12. Target Module Contracts

Every new module must declare in its header:

- name;
- version;
- sole responsibility;
- dependencies;
- forbidden responsibilities;
- browser and Node exposure;
- governing C1 section.

## 12.1 Public API Rules

A module API shall:

- be closed and explicit;
- use semantic operation names;
- validate structural inputs;
- return normalized results for failure-prone operations;
- avoid leaking mutable internal state;
- avoid exposing generic path/key operations;
- be versioned if consumed across architectural boundaries.

## 12.2 Dependency Injection Rules

Use `configure()` when a module needs runtime dependencies such as:

- clock;
- repository;
- current-session checker;
- state snapshot getter;
- renderer callback;
- external client.

`configure()` must not become a service locator.

The dependency object must have a fixed documented shape.

## 12.3 Error Rules

Pure modules may throw only for programmer-contract violations when consistent with existing modules.

Application services handling user flows should return or normalize operational failures so controllers can preserve current UI behaviour.

Error messages exposed to users must remain unchanged unless approval is granted.

## 12.4 Immutability Rules

- input objects shall not be mutated unless the module is the explicit owner of that draft/runtime state;
- engine-facing snapshots remain protected;
- output arrays/objects should be frozen where practical and consistent with existing architecture;
- cloning depth must match actual mutation risk.

---

# 13. Runtime State Ownership Map

The following ownership map is canonical for C1.

| State | Owner | Permitted Consumers | Durable Source |
|---|---|---|---|
| authenticated user | auth/session controller | application services | Firebase Auth |
| profile snapshot | profile runtime owner | UI/application services; StateAccess through configured getter | `users/{uid}` |
| displayed day | day runtime owner | home/food/workout UI; approved commit services | `users/{uid}/days/{day}` |
| real current day alias | day runtime owner | date navigation/home charts | same day document |
| water count | day runtime owner | water presenter/day persistence | day document |
| meal draft | nutrition draft owner | meal editor/commit service | not durable until commit |
| food questionnaire session | nutrition analysis controller | food UI | runtime only |
| barcode scanner instance | barcode adapter | barcode controller | runtime only |
| adaptive proposal | adaptive controller | adaptive UI/apply service | proposal runtime only |
| trigger daily budget | trigger state owner via StateAccess | trigger engine | profile `coachDay` |
| Habit view | Habit state owner via StateAccess | B5 consumer | profile `coachMemory` |
| Pattern view | Pattern state owner via StateAccess | B5 consumer | profile `coachMemory` |
| typed memories | Memory module | transparency UI / approved future consumers | memories collection |
| favourites | favourites owner | food UI | data/favourites |
| quick items | quick-log owner/profile | food UI | profile |
| UI open/hidden state | relevant presenter | DOM only | non-durable |

No extracted module may take ownership merely because it needs to read state.

---

# 14. Browser and Native Portability Rules

## 14.1 Platform-Neutral Modules

The following categories must be platform-neutral after extraction:

- nutrition draft calculations;
- prompt composition;
- profile metrics;
- adaptive TDEE calculation;
- trigger evaluation;
- Habit producer;
- Pattern producer;
- quick-item scoring;
- date-window calculations;
- authority mapping;
- domain validation.

## 14.2 Platform Adapters

The following remain platform-specific:

- DOM rendering;
- browser file input;
- Canvas image compression;
- barcode camera integration;
- Notification API;
- service worker;
- Firebase compat SDK;
- Google popup/redirect mechanics;
- Web Share API;
- browser cache.

## 14.3 Native Equivalence Standard

A future native adapter must be able to provide equivalent inputs to platform-neutral modules.

The portability test is:

> Can the module run under Node tests without DOM, browser globals, Firebase, or service worker?

Where the answer is no, the module must be explicitly classified as a platform adapter or UI presenter.

---

# 15. Test Strategy

## 15.1 General Rule

No behaviour is moved before it is protected.

## 15.2 Test Categories

### Unit Tests

Required for all pure modules.

### Contract Tests

Required for:

- EngineRegistry interactions;
- StateAccess;
- PersistenceGateway;
- B5 consumer/projector;
- new repositories;
- new application services.

### Characterization Tests

Required where existing behaviour is historically layered or not fully specified.

### Integration Tests

Required for cross-module flows with injected fakes.

### Browser Smoke Tests

Required for DOM, camera entry points, auth transitions, and script ordering.

## 15.3 Mandatory Regression Matrix

| Flow | Required Evidence |
|---|---|
| unauthenticated startup | login screen shown |
| authenticated user with profile | app shown, data loaded, engines started |
| authenticated user without profile | onboarding shown |
| account switch during async load | stale load produces no state/UI effects |
| text meal analysis | same questionnaire and result path |
| photo meal analysis | same compression parameters, prompt, validation |
| label analysis | same barcode association and source |
| cached barcode | cache wins before network |
| Open Food Facts hit | same serving conversion |
| Open Food Facts miss | label prompt shown |
| rejected AI nutrition | same recovery choices |
| meal edit | same totals and rounding |
| meal commit success | same day record and authority metadata |
| meal commit failure | optimistic candidate rolled back |
| quick log | same score/order/validation/authority |
| favourite add | same persisted payload |
| water change | same day save |
| workout save | same burn and trigger path |
| weight log | same profile update and engine action |
| adaptive proposal | same calculation and explanation |
| adaptive apply | same confirmed write path |
| trigger selection | same priority and budget |
| Habit run | same records/meta |
| Pattern run | same records/meta/fingerprint |
| B5 prompt context | same eligible signals and text |
| sign-out | all registered runtime state cleared |
| service-worker update | new modules cached and old cache removed |

## 15.4 Golden Fixtures

Create fixtures for:

- nutrition AI result shapes;
- day-history windows;
- adaptive TDEE histories;
- trigger profiles;
- Habit source history;
- Pattern source history;
- B5 Habit/Pattern views;
- persistence responses;
- stale-session transitions.

Fixtures must contain no real user data.

## 15.5 Mutation Safety Tests

Tests must verify that:

- engine snapshots cannot mutate owner state;
- repository results do not expose mutable internal cache;
- meal draft operations do not mutate source AI objects unexpectedly;
- B5 projected context remains immutable as currently defined.

## 15.6 Failure Tests

Include:

- Firebase unavailable;
- transient PersistenceGateway failure;
- non-retryable failure;
- Pattern conflict;
- invalid AI JSON;
- nutrition hard rejection;
- stale session before and after await;
- scanner load failure;
- camera permission failure;
- Open Food Facts network failure;
- Claude proxy non-2xx.

---

# 16. Performance Requirements

C1 must not materially degrade:

- authenticated startup;
- first render;
- food editor responsiveness;
- barcode scanner startup;
- engine execution;
- history loading;
- service-worker shell load.

Specific safeguards:

- preserve parallel profile/day/favourites loading;
- do not add duplicate history reads;
- do not run engines twice;
- do not rebuild B5 context redundantly in a single prompt path;
- do not deep-clone full history unnecessarily;
- preserve non-blocking engine startup;
- preserve image compression dimensions and quality;
- preserve cache strategy.

Performance changes should be measured where possible, but C1 is not a performance-optimization project.

---

# 17. Security and Privacy Requirements

C1 must preserve:

- Firebase token use for Claude proxy;
- server-side API secret;
- authenticated proxy requirement;
- daily quotas;
- CSP intent;
- Firestore rules;
- no sensitive nutrition content in validator logs;
- no raw prompt/image/token logging;
- session isolation;
- no cross-user cached runtime data;
- no private data in test fixtures;
- no expanded global exposure of user state.

Extracted adapters must not log access tokens, image payloads, prompts, meals, or memory contents.

---

# 18. Service Worker and Deployment Requirements

Every new production script must be added to `SHELL` in `sw.js`.

For each implementation release:

- increment `APP_VERSION`;
- increment service-worker `VERSION`;
- verify script paths;
- verify cache activation removes old cache;
- verify offline shell contains every required local module;
- verify external APIs remain network-only;
- preserve `/fitme/` scope and paths.

A missing service-worker entry is a release blocker because it can cause mixed-version runtime failures.

---

# 19. Commit and Review Strategy

## 19.1 Commit Rules

- one logical work package or sub-package per commit;
- tests in the same commit as extraction;
- no unrelated formatting;
- no mixed feature work;
- no documentation-only claim of completion before implementation evidence.

## 19.2 Review Order

1. Engineering self-review
2. automated tests
3. external engineering implementation review
4. Product behaviour review
5. Architecture contract review
6. documentation synchronization
7. commit/push
8. task closure

## 19.3 Rollback

Every extraction must be independently revertible.

If production or review detects behaviour drift:

1. stop subsequent work packages;
2. revert the smallest responsible commit;
3. restore passing baseline;
4. add a failing regression test;
5. correct extraction;
6. repeat all gates.

---

# 20. Acceptance Gates Per Work Package

Each work package must pass:

## Architecture Gate

- responsibility is cohesive;
- dependency direction is valid;
- no contract widening;
- no platform leakage into domain logic.

## Behaviour Gate

- characterization tests pass;
- manual flow unchanged;
- user copy unchanged;
- state and persistence results unchanged.

## Reliability Gate

- stale-session paths tested;
- operational failures normalized;
- cleanup ownership preserved.

## Portability Gate

- domain module runs in Node;
- platform-specific code is classified correctly;
- no browser globals in pure module.

## Release Gate

- script order correct;
- service worker updated;
- version updated;
- full suite passes.

---

# 21. Definition of READY

C1 is READY for implementation only when Claude’s External Engineering Readiness Review confirms:

- repository baseline matches this document;
- all referenced modules exist;
- proposed work packages are implementable without product decisions;
- the complete final-runtime-definition inventory is present;
- every override chain, including navigation and home-rendering chains, has an explicitly identified final runtime definition;
- the Day Navigation IIFE, its closure dependencies, compatibility functions, and `window` assignments are mapped;
- the canonical root-level regression suite is runnable and passes;
- the verified pre-implementation regression baseline remains `262` passed and `0` failed, or a later repository-grounded count is documented with explanation;
- the test harness can cover required flows;
- no unresolved blocker exists around script order, state ownership, persistence, runtime override selection, or day navigation;
- any requested clarification is resolved canonically.

A “READY with assumptions” result is not sufficient where repository evidence is available.

---

# 22. Definition of DONE

C1 is DONE only when:

1. approved work packages are implemented;
2. `app.js` is reduced to composition, compatibility facades, and limited orchestration;
3. domain logic identified in scope is independently testable;
4. all existing tests pass;
5. all new tests pass;
6. zero approved behaviour regressions remain;
7. service-worker and versioning are synchronized;
8. Architecture is updated with final module map;
9. Roadmap is updated;
10. Changelog is updated;
11. Architecture Remediation Plan is updated;
12. C1 specification includes a closure record;
13. Product and Architecture approval is granted;
14. commit and push are complete;
15. C1 is marked CLOSED.

---

# 23. Required Documentation Updates

## FITME_ARCHITECTURE

Add:

- final layer diagram;
- composition root;
- runtime state ownership;
- repository adapters;
- UI/application/domain separation;
- final module list;
- native adapter boundary.

## Roadmap

Mark C1 complete and set C2 as next only after closure.

## Changelog

Record:

- version;
- modules added;
- modules moved;
- tests added;
- behaviour-preservation statement;
- final test result;
- commit.

## Architecture Remediation Plan

Close C1 with evidence and preserve C2–C4 ordering.

## C1_SPEC

Append closure:

- implementation summary;
- approved deviations;
- test evidence;
- review result;
- version;
- commit;
- status CLOSED.

---

# 24. Engineering Prohibitions

Claude Code must not:

- redesign folder structure beyond what is needed for this task;
- add a framework;
- convert all code to classes;
- convert all code to TypeScript;
- replace IIFE modules with ESM;
- replace Firebase compat SDK;
- rewrite working engines “more elegantly”;
- merge domains;
- change prompt text;
- change UI strings;
- change thresholds;
- change data models;
- change write authority;
- remove session guards;
- replace optimistic meal commit semantics;
- change cache strategy;
- remove inline handlers globally;
- create a generic service locator;
- create generic repository path operations;
- add a new event bus;
- perform C2, C3, or C4 work.

---

# 25. Repository-Grounded Function-to-Module Map

This map is directional and authoritative at the responsibility level. Exact private helper grouping may be refined during implementation if no public behaviour or boundary changes.

| Current Area / Functions | Target Responsibility |
|---|---|
| `callClaude` | Claude proxy client |
| `_resetAppCoreState` | runtime-state owner + session cleanup registration |
| auth callback, `showLogin`, `showOnboarding`, `showApp` | auth/session controller + shell presenter |
| `loadUserData`, `saveProfile`, `saveTodayData`, `saveFavorites`, `getHistoryData` | repositories + user-data service |
| `persistDaySnapshot` | meal commit service using PersistenceGateway |
| notification functions | notification adapter/controller |
| coach profile/system/message functions | coach prompt modules |
| onboarding functions | onboarding controller/presenter |
| home, water, week-chart renderers | home presenter/controllers |
| food questionnaire and AI analysis | nutrition analysis service |
| validation glue | nutrition analysis/commit policy adapter |
| image compression | image adapter |
| barcode scanner functions | barcode adapter/controller |
| barcode cache and OFF lookup | barcode repository + external catalog adapter |
| editor normalization/totals/edit operations | meal draft model |
| editor rendering | meal editor presenter |
| `addMeal` and favourite commit functions | meal commit/favourites services |
| quick-item functions | quick-log model/service/presenter |
| workout functions | workout service/controller |
| streak/achievement functions | engagement domain service |
| group functions | group repository/controller |
| plan generation | plan controller + coach/AI client |
| profile metrics/rendering | profile metrics + profile presenter |
| settings functions | settings controller/presenter |
| adaptive functions | adaptive domain + controller/presenter |
| trigger functions | trigger domain + adapter/presenter |
| usage tracking | usage client/presenter |
| Habit implementation | `habitEngine.js` |
| Pattern implementation | `patternEngine.js` |
| B2 wiring | engine adapters + registration/composition |

---

# 26. Suggested Final Directory Structure

This is the preferred structure, not permission to introduce unrelated files.

```text
js/
  app.js
  firebase-config.js
  memory.js

  core/
    dateUtils.js
    numberUtils.js
    jsonUtils.js

  app/
    runtimeState.js
    bootstrapController.js
    authSessionController.js

  adapters/
    authAdapter.js
    notificationAdapter.js
    imageAdapter.js
    barcodeScannerAdapter.js
    claudeProxyClient.js
    openFoodFactsClient.js

  repositories/
    profileRepository.js
    dayRepository.js
    favoritesRepository.js
    groupRepository.js
    barcodeRepository.js

  nutrition/
    nutritionAnalysisService.js
    mealDraft.js
    mealCommitService.js
    quickLogService.js
    mealEditorPresenter.js
    foodController.js

  coach/
    coachProfile.js
    coachPromptComposer.js
    coachService.js
    coachPresenter.js

  adaptive/
    adaptiveTdeeDomain.js
    adaptiveTdeeController.js
    adaptiveTdeePresenter.js

  triggers/
    triggerDomain.js
    triggerController.js
    triggerPresenter.js

  engines/
    habitEngine.js
    patternEngine.js
    engineAdapters.js
    registerEngines.js

  ui/
    shellPresenter.js
    homePresenter.js
    onboardingController.js
    profilePresenter.js
    settingsPresenter.js

  sessionLifecycle.js
  nutritionValidator.js
  authorityContract.js
  engineRegistry.js
  stateAccess.js
  persistenceGateway.js
  derivedIntelligenceConsumer.js
  derivedIntelligencePrompt.js
```

The implementation may use fewer files where two responsibilities are inseparable and independently testable. It may not use fewer files merely to avoid modularization.

---

# 27. Native Migration Contract

At C1 closure, the following should be reusable unchanged in a future native application:

- nutrition model and validation;
- meal draft;
- authority mapping;
- adaptive TDEE domain;
- trigger domain;
- Habit Engine;
- Pattern Engine;
- Engine Registry;
- State Access contract;
- Persistence request/result contracts;
- B5 consumer and projector;
- prompt composers;
- profile metrics;
- quick-item scoring;
- repository interfaces.

The following will be replaced:

- DOM presenters;
- browser auth adapter;
- browser notification adapter;
- camera/image adapter;
- barcode scanner adapter;
- service worker;
- browser storage/cache mechanics;
- Firebase compat-specific repository implementations if the native stack differs.

The product equivalence criterion remains:

> Same canonical data and trigger must yield the same domain result regardless of PWA or native shell.

---

# 28. Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| extracting an earlier overridden function instead of final runtime definition | High | final-definition inventory and characterization tests |
| mixed-version service-worker cache | High | mandatory shell/version update per new script |
| stale session updates from moved async logic | High | injected generation checker and failure tests |
| changed meal write composition | Critical | dedicated concurrency and rollback tests |
| accidental bypass of B3/B4 | Critical | architecture review of every write |
| direct raw derived intelligence in coach prompt | Critical | B5 contract tests |
| excessive fragmentation | Medium | cohesive module review |
| generic utility dumping ground | Medium | single-responsibility contract |
| UI regression from presenter extraction | High | DOM smoke tests and unchanged IDs |
| Firestore path/schema drift | Critical | repository contract fixtures |
| changed engine order | Critical | EngineRegistry plan tests |
| native-portability claim without proof | Medium | Node execution requirement |
| scope creep into C2–C4 | High | explicit prohibition and review checklist |

---

# 29. External Engineering Readiness Review Questions

Claude must answer with repository evidence:

1. Does the reviewed repository match client version `2.24.0`?
2. Is `app.js` still approximately 4,453 lines, and what are the exact final runtime override definitions, override chains, compatibility facades, and `window` assignments?
3. Are all B1–B5 modules loaded in the documented order?
4. Are there tests already covering each work package?
5. Which work package should be split further for safe implementation?
6. Are any proposed module boundaries inconsistent with actual closures/global dependencies?
7. Which global functions are required by inline HTML?
8. Which functions are assigned to `window` dynamically?
9. What is the exact Day Navigation IIFE runtime path, including its closure dependencies, final callable functions, and compatibility surface?
11. Are there hidden dependencies from `memory.js` back into `app.js` globals?
11. Are there any direct B4-scope writes outside PersistenceGateway that this document missed?
12. Are there any direct raw Habit/Pattern prompt consumers outside B5?
13. Can Habit and Pattern be moved without changing their IIFE and Node-test pattern?
14. What is the safest commit sequence?
15. Does the full canonical regression suite run from the repository root, and does it preserve the verified baseline of `262` passed and `0` failed? What missing characterization tests still block READY?
16. Are any sections over-specified in a way that conflicts with current code?
17. Is C1 READY, NOT READY, or READY WITH NON-BLOCKING NOTES?

Claude must not implement during this review.

---

# 30. Final Canonical Decisions

1. C1 is a refactor, not a rewrite.
2. Product behaviour is frozen.
3. B1–B5 contracts are frozen.
4. `app.js` becomes composition-oriented.
5. Pure logic is extracted before UI logic.
6. platform mechanics are isolated in adapters.
7. Firestore mechanics are isolated in repositories.
8. Runtime state receives explicit ownership but not a generic store.
9. Inline HTML handlers may remain through thin compatibility facades.
10. Habit and Pattern become dedicated modules.
11. The current static deployment model remains.
12. Node-testability is the practical portability gate.
13. Service-worker synchronization is mandatory.
14. Every extraction is separately revertible.
15. C2, C3, and C4 remain separate tasks.
16. No engineer may fill product or architecture gaps by preference.

---

# 31. Closure Record

**Status:** Implemented — WP0 through WP11, incrementally, per §11  
**Pre-Implementation Regression Baseline:** `262` passed / `0` failed (`node --test`, canonical root-level `tests/` layout)  
**Implementation Summary:** `js/app.js` (4,453 lines at the reviewed baseline) modularized into
`js/core/`, `js/domain/`, `js/adapters/`, `js/repositories/`, `js/app/`, `js/nutrition/`,
`js/coach/`, `js/adaptive/`, `js/trigger/`, `js/engines/` and `js/ui/` — see
`docs/roadmap/Changelog.md` ("C1 — Modularization and Tests (WP1–WP11)") for the full
per-package module list. `app.js` retains composition/configuration, backward-compatible
facades required by inline HTML, and startup orchestration only.  
**Implementation Review:** Completed — external engineering review performed per work package,
per §19.2.  
**Product Review:** Completed — Product and Architecture approval granted.  
**Architecture Review:** Completed — B1–B5 contracts confirmed preserved unchanged; no
prohibited item from §4/§24 introduced.  
**Final Test Result:** `995` passed / `0` failed (`node --test`, canonical root-level `tests/` layout)  
**Release Version:** `2.40.0`  
**Commit:** `5890a1a` (WP11, final composition-root cleanup); full WP0–WP11 commit range
`2d1b2c7`..`5890a1a` on `main`  
**Task Status:** CLOSED

---

# Appendix A — Work Package Checklist

For every package:

- [ ] final runtime behaviour identified
- [ ] override chain and final runtime definition identified
- [ ] `window` assignments and compatibility facades identified
- [ ] Day Navigation IIFE mapped where applicable
- [ ] current callers identified
- [ ] global dependencies identified
- [ ] DOM dependencies identified
- [ ] persistence dependencies identified
- [ ] characterization tests added
- [ ] module contract documented
- [ ] implementation extracted
- [ ] compatibility facade preserved where required
- [ ] unit tests pass
- [ ] contract tests pass
- [ ] integration tests pass
- [ ] manual smoke tests pass
- [ ] session-stale tests pass
- [ ] service worker updated if a file was added
- [ ] version updated
- [ ] architecture reviewed
- [ ] commit isolated

---

# Appendix B — Product Parity Checklist

- [ ] login behaviour identical
- [ ] onboarding behaviour identical
- [ ] navigation identical
- [ ] calorie and macro display identical
- [ ] meal analysis prompts identical
- [ ] validation outcomes identical
- [ ] barcode fallback identical
- [ ] meal editor calculations identical
- [ ] meal commit semantics identical
- [ ] quick logging identical
- [ ] workout logging identical
- [ ] streaks identical
- [ ] achievements identical
- [ ] coach tone and wording rules identical
- [ ] adaptive TDEE identical
- [ ] trigger behaviour identical
- [ ] Habit output identical
- [ ] Pattern output identical
- [ ] B5 context identical
- [ ] sign-out cleanup identical

---

# Appendix C — Native Readiness Checklist

- [ ] pure module loads in Node
- [ ] no DOM access
- [ ] no `window` dependency
- [ ] no Firebase dependency
- [ ] no Notification dependency
- [ ] no service-worker dependency
- [ ] clock injected where time-sensitive
- [ ] repository dependency injected
- [ ] session checker injected
- [ ] deterministic fixtures available
- [ ] output contract documented

---

# Appendix D — Manual Smoke Suite

1. Cold start while signed out.
2. Google sign-in.
3. Existing-user startup.
4. New-user onboarding completion.
5. Sign out and sign in as a different user in the same tab.
6. Text meal questionnaire.
7. Plate photo.
8. Nutrition label photo.
9. Cached group barcode.
10. Open Food Facts barcode.
11. Unknown barcode fallback.
12. Edit quantity and macros.
13. Save valid meal.
14. Force meal persistence failure and confirm rollback.
15. Quick log.
16. Add/remove favourite.
17. Log water.
18. Log weight.
19. Log workout.
20. Open profile and settings.
21. Adaptive proposal and apply.
22. Trigger card.
23. Habit/Pattern run on app ready.
24. Coach prompt using B5 context.
25. PWA reload after service-worker update.

---

# Appendix E — Engineering Review Output Format

Claude shall return:

```text
C1 ENGINEERING READINESS REVIEW

Verdict:
READY / NOT READY

Repository Baseline:
...

Blocking Findings:
1. ...

Non-Blocking Findings:
1. ...

Required Canonical Corrections:
1. ...

Recommended Implementation Sequence:
1. ...

Test Gaps:
1. ...

Evidence:
file:line-range
```

No code, patch, commit, or implementation is permitted during readiness review.

---

**END OF CANONICAL SPECIFICATION**
