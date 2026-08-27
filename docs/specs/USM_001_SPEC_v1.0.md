# USM-001 SPEC v1.0 — User-Stated Memory Foundation, First Vertical

# 1. Status

- Version: 1.0
- Status: **IMPLEMENTED / VERIFIED / CLOSED.** Authored per explicit authorization from Head of Product + AI Architect following the FOUNDATION BOUNDARY INVESTIGATION REPORT and the FIRST VERTICAL SPEC-READINESS REPORT (this session, unpublished as separate documents — their accepted findings are cited throughout this SPEC by content, not by file reference). Underwent Engineering Readiness Review (READY FOR IMPLEMENTATION, with three named corrections applied — §8.2, §11.4, §12/§10.2/§15 — before implementation began), was implemented across six Work Packages, production-backed verified, and closed by Head of Product + AI Architect. See §26 (Closure Record) for full evidence.
- Authored by: Lead Engineer / Repository Analyst / SPEC Author, per the authority granted by Head of Product + AI Architect for this task.
- Authority for approval: Head of Product + AI Architect (Canonical Review, Product Approval, Architecture Approval, READY determination — none of which this document performs on its own authority).
- Repository baseline: `main`, commit `978b90501eebd5d6cef5f1cf61a9c7ebb78860af` (`feat(rgef): implement Relationship-Guided Engagement Foundation (WP1-WP8)`); test baseline per RGEF Closure Record (1946/1946 passing), not independently re-run by this authoring activity.
- Governing meta-standard: `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`.
- **Investigation-to-SPEC authority chain (binding, this pass):** every Product/Architecture boundary decision this SPEC encodes (Model B; the approved knowledge-class subset; the consent rule; the StateAccess/Memory-Layer/projector layering; the Coach Prompt consumer choice; the correction/forgetting semantics; the Safety disclosure requirement; the out-of-scope boundary) was reached explicitly by Head of Product + AI Architect in this session's preceding rounds, not invented during authoring. This SPEC does not reopen, narrow, or widen any of them; it operationalizes them into a concrete, testable contract set. Where this SPEC proposes an exact field name, identity string, module location, or numeric bound not already fixed by those rounds, it is marked explicitly as an Engineering-authored proposal for Engineering Readiness Review confirmation, per the governing standard's Contract Documentation Rules — never presented as already-approved.

------------------------------------------------------------------------

# 2. Purpose and Scope Boundary

## 2.1 Purpose

This Work Item proves, end-to-end, that a manually user-stated Typed Memory fact/preference can become a real, currently-authoritative Coaching Decision Input — reaching an existing, live Coach consumer, observably personalizing its output content, and remaining fully correctable and forgettable — without creating a second durable user-memory store, without redesigning Typed Memory, Habit/Pattern/B5, Feedback, or Profile, and without inventing new Domain/Topic/Opportunity/Trust semantics from raw text. It is the first vertical of the FITME Authoritative User Understanding Foundation, proving Model B (§5) with the smallest possible new surface area.

## 2.2 In Scope

- One new StateAccess read capability exposing an authoritative, consent-gated, filtered view of user-stated Typed Memory (§8).
- One new, additive export on the existing Memory Layer module (`js/coachDecisionSystem/memoryLayer.js`) assembling that view into a small, honest fragment (§9).
- One new, small, bounded, deterministic projector module rendering that fragment into Coach-Prompt-safe text (§10).
- One additive integration point in `coachPromptComposer.js`'s `buildSystemPrompt()` (§11).
- The consent enforcement rule (§7).
- Correction and forgetting semantics as already provided by existing, unmodified `js/memory.js` behavior, verified end-to-end through the new read chain (§13, §14).
- Mechanical script/shell wiring for the one new file (§17).

## 2.3 Explicitly Out of Scope

Per Head of Product + AI Architect direction, none of the following is touched, designed, or implied by this Work Item:

1. Chat/Conversation UI, voice, conversation extraction, or LLM-side memory extraction of any kind.
2. Wiring a caller to C4's existing, unwired server write capability (`functions/typedMemoryServerWrite.js`); `inferred_event`/`inferred_pattern`/`coach_generated` sources.
3. Explicit-request scope/duration representation or implementation.
4. Temporal/future-event memory, effective-from/effective-until semantics.
5. Historical retention / true supersession (the `status:'superseded'` value is not activated by this Work Item — §13.4).
6. Goal + Why, multi-goal, Dynamic Plan.
7. Relationship Maturity, Trust, or any change to `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` (remains paused, untouched — §16).
8. Habit/Pattern mirroring into Typed Memory; Feedback/`coachEvents` unification with Typed Memory.
9. Legacy `coachMemory.observations/preferences` migration, expansion, or redesign (§12).
10. Medical/safety semantic classification; any Health/Safety Profile construction (§15).
11. Any new Domain/Topic classifier, Opportunity source, or Decision-System Stage 3-10 change of any kind.

------------------------------------------------------------------------

# 3. Canonical Authority Index

- **D3 §11.1** — Memory Layer's exclusive Decision-Input/Context-Assembly authority ("No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context"), as already implemented in `js/coachDecisionSystem/memoryLayer.js`'s existing `assembleContext()`.
- **TASK-004 CD-02** — the Memory Layer's original, still-standing scope decision that it does not read `js/memory.js` directly. This Work Item does not violate CD-02: it does not grant Memory Layer a direct `js/memory.js` or Firestore read; it grants Memory Layer a new StateAccess-mediated read, following the exact extension mechanism CD-T005-01 (TASK-005) and G-2 (`goalObjectiveContext`/`currentStateContext`) already used to add new producers to Memory Layer's read set.
- **B1 §6/§7/§11/§15 (Canonical Memory Decision)** — Typed Memory's fixed record contract, deferred-identity-strategy precedent, ownership statement, and "no obsolete memory shall continue influencing coaching as if current" invariant — used, not altered.
- **REM-003 §5 (Authoritative Creation Paths)** — Path A (Explicit User Declaration). The manual "add fact" flow already satisfies Path A in full (validated via `js/memory.js`'s own `validateMemory()`, self-approved by the user's own submission act).
- **REM-003 §6/§7 (Evidence First / Single Observation Rule)** — not engaged by this Work Item in the Habit/Pattern sense; cited only to confirm that a `status:'active'` user-stated fact is already, structurally, a Path-A Authoritative Fact, not an Observation requiring accumulation.
- **C4_SPEC v1.0 CD-C4-10** — "Typed Memory remains the canonical persisted representation," CD-C4-06 ("`js/memory.js` remains unchanged"), CD-C4-03 ("Legacy Memory and Typed Memory both remain unchanged. No migration, replacement, or synchronization").
- **B3 SPEC (StateAccess)** — the closed accessor-surface discipline (no `get(path)`/`set(path)`, per-engine/action permission matrix, frozen snapshots, session-currency re-check after every async boundary) governs the new read capability's shape.
- **`firestore.rules:57-74`** — owner-only read/write on `users/{uid}/memories`, client `create`/`update`/`delete` restricted to `source ∈ {user_stated, migrated}`. Unmodified; this Work Item introduces no new Firestore access pattern (it reuses `js/memory.js`'s existing `listMemories()` read, itself already governed by this rule).
- **Coach Semantic Foundation Ch.26/CSF-04** — the "never invent Meaning/Reason without a matching rule" discipline, cited as the governing precedent for §2.3 item 11's prohibition.
- **This session's FOUNDATION BOUNDARY INVESTIGATION REPORT and FIRST VERTICAL SPEC-READINESS REPORT** — the direct authority for every Model-B, consent, StateAccess-ownership, projection, consumer, correction/forgetting, legacy-isolation, and safety-disclosure decision this SPEC operationalizes.

------------------------------------------------------------------------

# 4. Relationship to Prior Canonical Work

No existing canonical contract is altered. `js/coachDecisionSystem/memoryLayer.js`'s existing `assembleContext()` (TASK-004/TASK-005/G-2/Expression) is untouched — this Work Item adds one new, independent, additive export to the same file, serving a different consumer (Coach Prompt Composition, not the `coachDecisionSystem` Composite Engine's Decision Pass). `js/memory.js` (B1/C4) is untouched — reused exactly as-is via its existing public `list()` export. `js/stateAccess.js`'s existing `PERMISSIONS`/`READ_OPS`/`WRITE_OPS` entries are untouched — this Work Item adds one new `READ_OPS` entry and one new `PERMISSIONS` identity, following the exact same additive-extension pattern TASK-005, G-2, and RGEF each already used. `coachPromptComposer.js`'s existing `buildBasePrompt()`, `coachMemoryFragment()`, and B5 `derived` fragment logic are untouched — this Work Item adds one new, additive, structurally distinct fragment step. No Engine Registry entry, no new engine, no new orchestration authority, no change to Stage 3-10 of the Decision System, no change to Safety, no change to Affirmative Trust.

------------------------------------------------------------------------

# 5. Model-B Boundary (Approved, Restated for This SPEC's Scope)

Approved governing architecture: **several legitimate producer stores/derived engines → ONE authoritative semantic Decision-Input projection assembled by Memory Layer.** Unified understanding means one semantic authority, not one physical store.

For this Work Item specifically:
- **Producer store:** Typed Memory (`users/{uid}/memories`, `js/memory.js`) — unchanged, unmigrated, remains the sole physical store for the record class this vertical consumes.
- **Assembly authority:** `js/coachDecisionSystem/memoryLayer.js` — gains one new, narrow, additive capability; remains the sole originator of this read.
- **Projection:** a new, dedicated, bounded module — never a raw document dump.
- **Consumer:** Coach Prompt Composition — one real, existing, production consumer; no new consumer type introduced.

Explicitly preserved, unmodified, per Model B: Profile, Habit/Pattern/B5, Feedback/`coachEvents`, Pipeline Context (the `coachDecisionSystem` Composite Engine's own, remains ephemeral and untouched by this Work Item — this vertical's fragment is a **separate, smaller, independently-assembled artifact**, not an addition to `assembleContext()`'s existing `PipelineContext` shape).

------------------------------------------------------------------------

# 6. Contract Status Note (Governing-Standard Compliance)

Per `FITME_SPEC_AUTHORING_STANDARD_v1.1.md`'s Contract Documentation Rules, every contract defined in §8-§11 below is **new** — none is already fixed by an approved canonical source at the level of exact field names, exact identity strings, exact module location, or exact numeric bounds. Each is authored here as an **engineering-ready structural proposal**, in full implementable detail, for Engineering Readiness Review to confirm or amend — not as an already-final decision. The governing *boundary* each contract sits within (StateAccess-mediated; filter-in-StateAccess; Memory-Layer-assembled; dedicated-projector; Coach-Prompt-consumer; fail-closed consent) **is** already Product/Architecture-approved (§1, §5) and is not open for reinterpretation by this SPEC or by Engineering Readiness Review.

------------------------------------------------------------------------

# 7. Consent Contract

**Ownership:** Product (meaning/wording), Architecture (enforcement point).

**Rule (approved, restated):** `memoryConsent.granted !== true` ⇒ the new read returns `[]` unconditionally — no Typed Memory knowledge reaches the Coach Prompt. Consent does not gate a user's own ability to view/edit/delete/manage their memories (unchanged, existing `js/memory.js` behavior). Consent is general permission, not per-memory approval. The existing checkbox and its existing wording (*"אני מאשר שהמאמן ילמד ויזכור עליי כדי לשפר את הליווי"*, Settings → "מה המאמן יודע עליי") are approved as-is for V1 — no UI change in this Work Item.

**Existing Repository Behaviour (verified):** `userProfile.memoryConsent` is `{granted: boolean, at: timestamp}` or absent; defaults falsy when absent. Set only by the existing checkbox's `change` handler, persisted via `saveProfile()` (unmigrated legacy write path — unmodified, out of scope). Currently read by no code path other than the checkbox's own initial `checked` state.

**Enforcement point (this Work Item):** the new StateAccess read function (§8) — checked before any Typed Memory fetch is attempted, per the fail-closed rule below. Never enforced inside `js/memory.js` itself (preserves existing view/edit/delete UI behavior unchanged, per B1 §11/CD-C4-06/CD-C4-03).

**Failure Modes:** `userProfile` unavailable / `memoryConsent` malformed (non-object) → treated as `granted !== true` → `[]`. Never treated as an error; never fabricated as `true`.

------------------------------------------------------------------------

# 8. StateAccess Contract (Proposed — Engineering Readiness Review)

## 8.1 Ownership

Single owner: `js/stateAccess.js`, following B3's existing, closed accessor-surface discipline. No CRUD is exposed — read-only, single operation.

## 8.2 New Identity

```js
memoryLayer: {
  USER_STATED_MEMORY_READ: {
    reads: ['userStatedMemory'],
    writes: []
  }
}
```

**Approved, not reused — canonical clarification (Engineering Readiness Review finding, confirmed by Head of Product + AI Architect).** `coachDecisionSystem.DECISION_PASS`'s existing grant is untouched — it is scoped to the Composite Engine's own Decision Pass, an unrelated consumer to Coach Prompt Composition; this new identity is never an alias for it and never widens it. This mints a new, honestly-scoped identity for the caller that actually performs this read (Memory Layer itself), following the exact precedent `derivedIntelligenceConsumer` already established.

**`memoryLayer` is a StateAccess capability-holder identity.** It is explicitly **not**:
- an `EngineRegistry` engine (no `EngineRegistry.register()` call is made for it, exactly as `derivedIntelligenceConsumer` itself makes none — "capability-holder חדש בלבד — לא EngineRegistry.register()," ADR-B5-008);
- a new Engine of any kind;
- an alias for `coachDecisionSystem`;
- a widening of `coachDecisionSystem.DECISION_PASS`'s existing reads/writes, which remain byte-identical before and after this Work Item.

This mirrors, verbatim in spirit, the same semantic distinction the repository already draws for `derivedIntelligenceConsumer` — a shared, cross-cutting capability serving multiple consumers (there, `AI_COACH_PROMPT`/`RECOMMENDATION_ENGINE`/`INITIATIVE_ENGINE`; here, Coach Prompt Composition) without itself being an Engine or an alias for any Engine or Composite Engine identity. The identity/action naming (`memoryLayer` / `USER_STATED_MEMORY_READ`) and this capability-holder classification are **approved** — no Architecture Decision remains open on this point.

## 8.3 Read Operation Contract

```js
function readUserStatedMemory(identity) {
  // 1. session-currency check (throw staleSessionError() if not current) — matches every existing read op.
  // 2. consent check: userProfile.memoryConsent.granted === true; else return frozen [] immediately
  //    (no fetch attempted) — §7.
  // 3. await deps.fetchUserStatedMemory() — raw array, via injected dependency (§8.4).
  // 4. re-check session currency after the async boundary (B3 §9 rule 8; matches
  //    readNutritionActivityHistory's existing pattern).
  // 5. filter: type ∈ {'fact','preference'} AND source === 'user_stated' AND status === 'active'.
  // 6. map to the closed output shape (§8.5).
  // 7. sort deterministically: updated_at descending, tie-broken by id ascending
  //    (StateAccess owns this guarantee explicitly — does not rely on js/memory.js's own
  //    internal sort as an implicit contract).
  // 8. freezeShallow + copyArrayOfObjects (existing B3 helpers) — no live reference returned.
  // No bound/cap applied here — the full authoritative, filtered, consented set is returned;
  // bounding is a projection-time concern (§10), matching B5's own maxHabits/maxPatterns
  // precedent (Consumer Policy bounds, not StateAccess bounds).
}
```

## 8.4 Injected Dependency (Composition Root)

`deps.fetchUserStatedMemory` — a new entry in `js/app.js`'s existing `StateAccess.configure({...})` call, defined as a thin closure reusing `js/memory.js`'s own existing, unmodified, exported `list()`:

```js
fetchUserStatedMemory: function () { return FitMeMemory.list(); }
```

No new Firestore query is introduced; no new index is required (`js/memory.js`'s existing `memCol().get()` — full-collection fetch, client-side filter/sort, the same deliberate no-composite-index pattern `getHistoryData()`/`fetchHistory()` already use). Testability: this dependency is injected exactly like `deps.fetchHistory()` — `stateAccess.test.js` supplies its own stub, with no live Firestore required, following the existing test convention exactly.

## 8.5 Output Shape (Proposed)

```js
[{ id, type, payload, confidence, source: 'user_stated', updatedAt }, ...]
```

`payload` is passed through unmodified (`{text}` for `fact`; `{key, value}` for `preference` — no live producer creates a `source:'user_stated'` `preference` record at this repository baseline; the filter recognizes it structurally per the approved scope, honestly, without fabricating a producer that does not exist — Repository Gap, non-blocking, §19). No Firestore-internal bookkeeping (`created_at`, `last_confirmed_at`, raw doc references) is exposed beyond `updatedAt`, per the instruction not to expose persistence bookkeeping unnecessarily.

------------------------------------------------------------------------

# 9. Memory Layer Contract (Proposed — Engineering Readiness Review)

## 9.1 Ownership

`js/coachDecisionSystem/memoryLayer.js` — the same single module already owning `assembleContext()`. This Work Item adds one new, independent, additive export. `assembleContext()` itself is unmodified — its own `PipelineContext` shape, `availability` map, and every existing field are byte-identical to before this Work Item.

## 9.2 Contract

```js
async function assembleUserStatedMemoryFragment(identity) {
  // access = StateAccess.createEngineAccess({engineId:'memoryLayer', action:'USER_STATED_MEMORY_READ', ...identity})
  // try { facts = access.read.userStatedMemory(); available = true }
  // catch (e) { facts = []; available = false }  — graceful degradation (D3 §12.3), same
  //   discipline already used throughout this file's existing assembleContext().
  // return freezeShallow({
  //   schemaVersion: 'coach-decision-system-user-stated-fragment/1.0',
  //   userId: identity.userId,
  //   assembledAt: Date.now(),
  //   facts: freezeShallow(facts),
  //   availability: available ? 'AVAILABLE' : 'UNAVAILABLE'
  // });
}
```

Deliberately a **separate, distinctly-versioned artifact**, not merged into `PipelineContext`'s existing shape — it feeds a different consumer (Coach Prompt Composition) with a different lifecycle than the Decision System's Pipeline Context, and merging the two shapes would misrepresent one as the other's field, contrary to the instruction that this vertical must not touch Stage 3-10 or influence `trustTestSignal`/`glad` in any way (§16).

## 9.3 Runtime Interaction

- **Caller:** `coachPromptComposer.js`'s `buildSystemPrompt()` (§11) — a new, narrow, disclosed cross-module dependency (mirroring the RGEF A-2 precedent: `initiativeEngine.js`'s own narrow, explicit, non-blanket dependency on `feedbackDomain.js`).
- **Timing:** asynchronous, awaited inside `buildSystemPrompt()`, wrapped in try/catch — a failure here **never blocks the Coach Prompt** (matching the existing B5 `derived` step's own "תוספתי בלבד — לעולם לא חוסם את הפרומפט" discipline verbatim).
- **Not invoked** from `internalPipelineOrchestrator.js`, `runDecisionPass()`, or any Stage 3-10 call site.

## 9.4 Failure Modes

StateAccess throws (stale session, denied access) → caught, `available: false`, `facts: []` — never propagated as an error to the caller, matching every other Memory Layer read in `assembleContext()`.

------------------------------------------------------------------------

# 10. Projection / Bounding Contract (Proposed — Engineering Readiness Review)

## 10.1 Ownership

A new, dedicated, pure, stateless module — proposed location `js/userStatedMemoryPrompt.js`, directly paralleling `js/derivedIntelligencePrompt.js`'s own placement, purpose, and dependency-free (`require`/`window`) pattern. Exact filename is Engineering's structural proposal (per §6); the *architectural fact* of a dedicated module (never bounding logic embedded directly in `coachPromptComposer.js`) is Architecture-approved and fixed.

## 10.2 Contract

```js
function project(fragment) {
  // fragment: the object returned by assembleUserStatedMemoryFragment() (§9.2).
  // Returns '' if fragment.availability !== 'AVAILABLE' or fragment.facts is empty —
  // matching derivedIntelligencePrompt.js's own falsy-empty-string convention exactly,
  // so callers need no special-case handling.
  // Deterministic: iterates fragment.facts in the order StateAccess already produced (§8.3
  // step 7) — no re-sort performed here.
  // Bounded by MAX_FACTS and MAX_CHARS (§10.3) — truncates, never throws, never overflows.
  // Renders each fact's payload.text (or 'key: value' for a preference payload) as one
  // hyphen-bulleted line under a fixed Hebrew header, structurally distinct from both
  // derivedIntelligencePrompt.js's own header ("תובנות שנצפו בדפוסי השימוש שלך:") and
  // coachMemoryFragment()'s own phrasing ("מה שלמדתי עליו עד כה:") — per the Legacy Isolation
  // requirement (§12).
}
```

**Ordering and bounding-after-edit consequence (Engineering Readiness Review finding, disclosed per Head of Product + AI Architect direction):** ordering is `updated_at` descending, then deterministic `id` ascending tie-break (§8.3 step 7) — reused unchanged from the projector's input, never re-sorted here. Because an edit updates a record's `updated_at` (§13), editing an older memory can move it higher in this order and, once the number of qualifying records exceeds `MAX_FACTS`, can cause a different, untouched, lower-ranked memory to fall outside the bounded selection on the very next read. This behavior is: deterministic (given fixed data and a fixed edit sequence, the outcome is always the same); accepted for V1 as-is; **not** evidence of deletion (the dropped record is still active and fully present in Typed Memory and in the unbounded transparency UI — only the bounded prompt projection omits it); **not** semantic supersession (§13); and **not** a Product ranking claim of any kind (recency-first is a reused display convention, not an invented prioritization policy — no priority scoring is introduced).

## 10.3 Bounding Parameters — Engineering Decision Pending

`MAX_FACTS` and `MAX_CHARS` lack canonical Product authority at this repository baseline — no existing governance fixes a numeric bound for raw user-stated free text specifically. Per the existing, accepted precedent classification already used for `feedbackDomain.js`'s `RECOVERY_POLICIES` ("ברירות מחדל הנדסיות — לא מדיניות מוצר קנונית" / engineering defaults, not canonical product policy, C2 Appendix A) and `TRUST_CONFIRMATION_POLICY_V1`'s own explicit "Product-approved... not claimed permanently optimal" pattern: this SPEC classifies `MAX_FACTS`/`MAX_CHARS` as **Engineering Decision Pending**, to be fixed at implementation time, owned exclusively by `js/userStatedMemoryPrompt.js` (never duplicated elsewhere), explicitly not claimed permanently optimal, and subject to future calibration without requiring a SPEC amendment — mirroring RGEF-OI-5's and AT-OI-1's own precedent exactly. `derivedIntelligencePrompt.js`'s own `MAX_ITEMS: 8` / `MAX_CHARS: 1200` answers a structurally different question (bounding short, templated, closed-vocabulary sentences) and is explicitly **not** silently inherited here (raw user free text can be materially longer and less curated per item than a fixed sentence template) — a smaller, independently-chosen bound is expected, proposed at implementation time.

## 10.4 Failure Modes

Malformed or missing `fragment` → `''`, never throws (matches `derivedIntelligencePrompt.js`'s own `project()` discipline for a missing/empty `context`).

------------------------------------------------------------------------

# 11. First Consumer Contract — Coach Prompt Composition

## 11.1 Ownership

`js/coach/coachPromptComposer.js`'s existing `buildSystemPrompt()` — unmodified in its existing `base`/legacy-`mem`/`derived` steps; gains one new, additive fourth step.

## 11.2 Placement and Order

Approved order: `base` (existing) → legacy `coachMemoryFragment()` (existing, unmodified) → **new user-stated fragment** → B5 `derived` (existing, unmodified). The new fragment is placed immediately after the legacy fragment and before B5's inferred/observed signals, reflecting the Product boundary's own stated priority (explicit user statements have immediate value, ahead of passively-inferred behavioral signal) — this ordering affects only prompt text sequence, not `max_tokens`, not the model, not any other existing parameter.

## 11.3 Explicit Prohibition (Restated, Binding)

`buildSystemPrompt()`'s new step SHALL NOT classify, tag, or route a raw fact/preference's text into any Domain, Topic, Opportunity, Reason, Trust signal, Goal, or professional Target. It performs exactly one operation: append already-bounded, already-rendered text to the system prompt string. The existing base prompt's own standing instruction to the model ("לעולם אל תמציא נתונים שלא נמסרו לך" / never invent data not given to you) is unmodified and continues to govern the model's own behavior around this content — this Work Item adds no new anti-hallucination instruction, since the existing one already covers this addition.

## 11.4 Runtime Resolution — Script-Order Correction (Engineering Readiness Review, Approved)

**Concrete script-load-order conflict identified during Engineering Readiness Review:** `index.html`'s existing script order places `js/coach/coachPromptComposer.js` at line 623, **before** `js/coachDecisionSystem/memoryLayer.js` at line 651 and `js/coachDecisionSystem/expressionRenderingContext.js` at line 650 (`memoryLayer.js`'s own existing dependency).

**Approved resolution: relocate the dependency pair, not lazy-resolve.** `js/coachDecisionSystem/expressionRenderingContext.js` and `js/coachDecisionSystem/memoryLayer.js` are relocated **together, preserving their existing dependency order between each other**, to immediately after `js/derivedIntelligencePrompt.js` and before `js/coach/coachPromptComposer.js`. This is a real, ordinary script-tag reorder — the established pattern this repository already uses for release wiring — not a new resolution-timing technique. `coachPromptComposer.js` retains the repository's normal top-of-module `require`/`window` dependency-resolution pattern for its two new dependencies (`CoachDecisionSystemMemoryLayer`, `UserStatedMemoryPrompt`), exactly as it already does for `CoachProfile`/`DateUtils`/`DerivedIntelligenceConsumer`/`DerivedIntelligencePrompt` — no lazy, call-time, or otherwise deviating resolution technique is introduced anywhere in this SPEC.

**Why the pair moves together, and why this is safe (verified, not assumed):**
- `memoryLayer.js` depends on `expressionRenderingContext.js` — the two must retain their relative order to each other; moving `memoryLayer.js` alone would break this existing, unmodified dependency.
- All three of `memoryLayer.js`'s own existing dependencies (`StateAccess`, `DerivedIntelligenceConsumer`, `ExpressionRenderingContext`) are already available at the new position (`js/stateAccess.js` and `js/derivedIntelligenceConsumer.js` load earlier still; `expressionRenderingContext.js` moves with it as the same pair).
- A repository-wide search for every reference to `CoachDecisionSystemMemoryLayer` or `ExpressionRenderingContext` found exactly two other referencing files — `internalPipelineOrchestrator.js` and `expressionRenderer.js` — both of which already load later (lines 654-655) than either the pair's current or proposed new position. No file loading between the new and old positions references either module. The relocation is therefore verified safe: no existing downstream consumer of either module is affected.
- No call-time global-resolution workaround is required as a result — `coachPromptComposer.js`'s own dependency-resolution style needs no exception.

New file `js/userStatedMemoryPrompt.js` has no such conflict — proposed insertion point remains immediately after `js/derivedIntelligencePrompt.js`, before the relocated pair and before `coachPromptComposer.js`, resolved normally via the existing top-of-file pattern.

## 11.5 Failure Modes

Any failure in the new step (Memory Layer assembly failure, projector failure) is caught inside `buildSystemPrompt()`'s own existing try/catch style (matching the B5 `derived` step's own discipline) — the Coach Prompt is always produced, with or without the user-stated fragment.

------------------------------------------------------------------------

# 12. Legacy `coachMemory` Isolation

Legacy `coachMemory.observations/preferences` remains exactly as it is — a compatibility layer, unmigrated, unmerged, unexpanded (§2.3 item 9). `coachMemoryFragment()` is not modified. The new fragment (§10) is structurally distinct: a separate call, a separate header string, a separate position in the composed prompt (§11.2), never reading from or writing to `coachMemory` in any way.

**Live collision is not currently reachable in ordinary production (Engineering Readiness Review finding, confirmed against actual writers).** A repository-wide search found **no live code path that writes to `coachMemory.observations` today** — the only reference anywhere in `js/` is the one-time migration's own read-side comment. Combined with the fact that the one-time migration's own output is always written with `source:'migrated'` (never `'user_stated'`, and Firestore Rules independently forbid `source` ever changing on update), and that this Work Item's V1 filter admits only `source === 'user_stated'`: **the same real-world fact cannot, through any currently-live production path, simultaneously exist as fresh content in the legacy fragment and as a `user_stated` Typed Memory fact.** This is stronger than "duplication is tolerated" — the collision scenario itself is not reachable in ordinary operation at this repository baseline. No deduplication mechanism is introduced, and none is required for this reason, not merely by instruction. If a future producer (e.g., a live writer resumes writing to `coachMemory.observations`, or Conversation begins writing `user_stated` facts that echo legacy content) makes collision possible, reconciling the two fragments' precedence is that future Work Item's own responsibility — not decided, designed, or required here.

------------------------------------------------------------------------

# 13. Correction Semantics

**Existing, unmodified `js/memory.js` behavior is sufficient and is not extended.** Editing a fact via the existing "עריכה" action (`updateMemory(id, {payload: {...}})`) patches `payload`/`updated_at` only — `status`/`source`/`confidence` are untouched, so an edited fact correctly remains `status:'active'`, `source:'user_stated'`, and continues to satisfy the read filter (§8.3) unchanged.

No cache exists anywhere in the new chain: `js/memory.js` caches nothing; the new StateAccess read (§8.3) is a fresh async fetch on every call; the new Memory Layer fragment (§9.2) is rebuilt fresh on every `buildSystemPrompt()` call; `buildSystemPrompt()` itself is called fresh on every Coach message. A fresh read after an edit is therefore structurally guaranteed to see only the corrected value.

**Explicit non-claim (binding, per instruction):** this Work Item does **not** implement historical supersession. `status:'superseded'` is not activated by any code path this Work Item introduces. An edit **overwrites** the prior `payload` value with no retained history anywhere — this is documented plainly as **correction**, never described as "supersession," consistent with the instruction not to claim history is preserved when it is destroyed. True retained-history supersession remains explicitly out of scope (§2.3 item 5), deferred to a future Conversation/User-Understanding expansion.

------------------------------------------------------------------------

# 14. Forgetting Semantics

**Existing, unmodified `js/memory.js` `deleteMemory()` is sufficient.** A deleted record is physically removed from Firestore; the next fresh read (§8.3, always a fresh fetch) structurally cannot return it. No other representation of a raw user-stated fact exists anywhere in the repository at this Work Item's scope (confirmed: not duplicated into `coachMemory`, `coachEvents`, B5, or any other producer) — deletion is therefore sufficient with no dependency-invalidation mechanism required, per explicit instruction not to build one for facts never duplicated.

**Explicit honest boundary (binding, per instruction):** deletion guarantees no **future** Coach Prompt build includes the fact. It does not, and cannot, erase a past, already-sent, stateless Anthropic API call — no such call is logged or retained anywhere in this repository (confirmed in the prior investigation). This boundary is disclosed, not solved, and is not a defect of this Work Item.

------------------------------------------------------------------------

# 15. Safety-Sensitive Memory — Disclosed Boundary (Not Solved)

**Existing Repository Behaviour (verified):** the Coach Prompt Composition path (`coachPromptComposer.js` → `CoachClient.sendMessage()` → `anthropicProxy`) is not, and has never been, governed by the `coachDecisionSystem` Composite Engine's Safety Layer (`safetyLayer.js`/`safetyIntegrationPort.js`) — that Safety Layer governs only the separate Decision System's Stage 8/9, which this Work Item does not touch. The existing, unmodified `coachMemoryFragment()` already injects raw, unclassified legacy observation text into this same unguarded path today.

**This Work Item's position (binding, per instruction):**
- This is a **pre-existing condition**, not a new risk category introduced by this Work Item — it extends an already-accepted precedent's surface area, it does not create a new one.
- No medical/safety interpretation, classification, or Health/Safety Profile is built, proposed, or implied by this Work Item.
- No claim is made, anywhere in this Work Item's contracts or copy, that user-stated content reaching the Coach Prompt has been Safety-reviewed merely because it reaches the prompt.
- **Repository Gap (not Engineering Decision Pending):** no canonical Health/Safety Profile source exists anywhere in the repository to classify user-stated content of this kind — this is a factual absence, not a decision left to Engineering, matching the identical gap already disclosed in `safetyLayer.js`'s own header comment for its own, unrelated, absent Health/Safety Profile source.
- Head of Product + AI Architect has already reviewed and accepted this disclosure as non-blocking for V1 (per the preceding round's explicit direction) — this SPEC restates it for the permanent record, per the governing standard's Failure-Handling Documentation Requirements.

**Prompt Role / Instruction Authority Boundary — Disclosed, Not Solved (Engineering Readiness Review finding, confirmed by Head of Product + AI Architect).** The current Coach Prompt architecture sends persona/system instructions, the legacy free-text fragment, the new Typed-Memory fragment (§10-§11), and any other Coach context inside **one flat Claude `system` prompt string** (`buildSystemPrompt()`'s own existing concatenation) — the same, already-shipping architecture the legacy `coachMemoryFragment()` has used for its own raw observation text since before this Work Item. USM-001 follows this existing production architecture unchanged; it does not create, propose, or redesign any prompt-role separation mechanism. Stated explicitly, per instruction:
- User-stated memory content admitted by this Work Item is semantically **user context**, never policy or instruction authority — but the current flat-string architecture does **not** structurally enforce that distinction at the Claude API role level (there is no separate, protected channel a stored fact could be prevented from resembling).
- This is a **pre-existing prompt-architecture limitation** that USM-001 extends in surface area (a second free-text source feeding the same flat string) but does not originate.
- Prompt-role hardening — a new message-channel separation, structured escaping, or any other mitigation — is explicitly **out of scope** for this Work Item. This Work Item's own memory content is not moved into a new message channel as part of this disclosure; the existing `system`-string placement (§11.2) is unchanged.
- This disclosure does not block V1 — it is recorded honestly, alongside the Safety-Sensitive Memory boundary above, as an inherited condition for the permanent record.

------------------------------------------------------------------------

# 16. Conversation Compatibility and Affirmative Trust Non-Interaction

## 16.1 Conversation Compatibility

The read-side contract (StateAccess → Memory Layer → projection → consumer, §8-§11) filters exclusively on **persisted record fields** (`type`, `source`, `status`), never on *how* a record was created. A future Conversation producer writing through the existing client `user_stated` path, or through C4's already-built (unwired) server path for `coach_generated`/`inferred_event`, would flow through this same chain unchanged, requiring only an additive filter/authority extension (admitting additional `source`/`status` values under a future, separately-approved decision) — never a new read architecture. This is a structural property of the design in §8-§11, not a claim requiring further proof by this Work Item.

## 16.2 Affirmative Trust Non-Interaction

This Work Item does not read, write, compute, or influence `trustTestSignal`, `glad`, `eligibilityEvaluator.js`, `initiativeEngine.js`'s `MATURITY_GATING`/`SOURCE_REASON_MATURITY_OVERRIDES`, or any file under `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md`'s File List (§28 of that document). No shared read or write surface exists between this Work Item's new contracts and Affirmative Trust's proposed contracts. `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` is not modified by this Work Item and remains paused. Per Head of Product + AI Architect direction, a future review of that paused SPEC — specifically whether user-stated evidence and this Work Item's provenance primitives should inform its `TrustIdentity` design — is explicitly deferred to after this foundation closes, and is not decided, proposed, or anticipated further here.

------------------------------------------------------------------------

# 17. Runtime and Integration Documentation (Script/Shell Wiring)

| File | Change | Position | Dependency-order rationale |
|---|---|---|---|
| `js/userStatedMemoryPrompt.js` | New file | `index.html`, immediately after `js/derivedIntelligencePrompt.js` and before the relocated pair below; matching `sw.js` SHELL entry, same relative position | No dependents load before it needs to be available; mirrors `derivedIntelligencePrompt.js`'s own placement exactly |
| `js/stateAccess.js` | Additive (`READ_OPS`, `PERMISSIONS`) | No tag-order change — existing file | N/A |
| `js/coachDecisionSystem/expressionRenderingContext.js` | No content change — **relocated** | Moved from its current position (index.html line 650) to immediately after `js/userStatedMemoryPrompt.js`, before `js/coachDecisionSystem/memoryLayer.js` and before `js/coach/coachPromptComposer.js` (§11.4) | Must remain immediately before `memoryLayer.js` (its existing dependent); verified no other file loading between the old and new positions references it |
| `js/coachDecisionSystem/memoryLayer.js` | Additive export; **relocated** (content change is additive only — §9) | Moved together with `expressionRenderingContext.js`, immediately after it, before `js/coach/coachPromptComposer.js` (§11.4) | Must load after its own dependency (`expressionRenderingContext.js`) and before its new consumer (`coachPromptComposer.js`); verified no other file loading between the old and new positions references it |
| `js/coach/coachPromptComposer.js` | Additive step, normal top-of-module resolution (§11.4) | No tag-order change — existing file | Resolves its two new dependencies at load time via the repository's standard `require`/`window` pattern, exactly as its existing dependencies already are — no deviation |
| `js/app.js` | Additive `StateAccess.configure()` entry | No tag-order change — composition root, already loads after every module it configures | N/A |
| `index.html`, `sw.js` | One new `<script>` tag / SHELL entry; two existing tags relocated as a verified-safe pair | See rows above | Mechanical; the relocation follows the repository's ordinary dependency-order convention, verified safe by a repository-wide reference search (§11.4) |

Two existing script tags change position (`expressionRenderingContext.js`, `memoryLayer.js`), relocated together as a verified-safe pair; no other existing script tag's position changes. This satisfies the governing standard's Runtime and Integration Documentation Rules requirement that "placement must not require restructuring an existing component's invocation order" in the sense that matters — no *dependent's* invocation order changes, only the position of one dependency pair relative to its new consumer, verified to affect no other existing relationship.

------------------------------------------------------------------------

# 18. File List

**New:**
- `js/userStatedMemoryPrompt.js`
- `docs/specs/USM_001_SPEC_v1.0.md` (this document)

**Modified (additive only):**
- `js/stateAccess.js` (§8)
- `js/coachDecisionSystem/memoryLayer.js` (§9 — additive export; §17 — script-tag position relocated)
- `js/coach/coachPromptComposer.js` (§11)
- `js/app.js` (§8.4 — `StateAccess.configure()` gains one new injected dependency; composition-root wiring only)
- `index.html`, `sw.js` (§17 — one new script tag/SHELL entry; two existing tags relocated as a verified-safe pair)

**Modified (script-tag position only — no content change):**
- `js/coachDecisionSystem/expressionRenderingContext.js` (§11.4/§17 — relocated together with `memoryLayer.js`; its own contract, exports, and behavior are byte-identical)

**Explicitly unmodified (content and position):**
- `js/memory.js` (reused as-is via its existing `list()` export)
- `firestore.rules` (no permission change required)
- `js/persistenceGateway.js` (no new write operation)
- `js/coachDecisionSystem/internalPipelineOrchestrator.js`, `eligibilityEvaluator.js`, `evidenceEvaluator.js`, `contextualMeaningPolicy.js`, `initiativeEngine.js`, `recommendationEngine.js`, `recommendationCategories.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyLayer.js`, `safetyIntegrationPort.js`, `expressionRenderer.js`, `deliveryIntentContract.js`, `expressionInputGate.js`
- `js/derivedIntelligenceConsumer.js`, `js/derivedIntelligencePrompt.js`, `js/authorityContract.js`, `js/feedback/feedbackDomain.js`
- `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md`

------------------------------------------------------------------------

# 19. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Architecture Decision Pending:** none. The StateAccess identity/action naming (`memoryLayer` / `USER_STATED_MEMORY_READ`, §8.2) and the script-order relocation of `expressionRenderingContext.js`/`memoryLayer.js` (§11.4/§17) were both confirmed by Engineering Readiness Review and approved by Head of Product + AI Architect during this SPEC's correction pass — no Architecture question remains open on either point.

**Engineering Decision Pending:**
- ED-1: Exact `MAX_FACTS`/`MAX_CHARS` numeric bounds for the projector (§10.3) — classified as engineering-bounded per existing governance precedent (C2 Appendix A / RGEF-OI-5 / AT-OI-1), not Product policy.

**Repository Gap (non-blocking):**
- RG-1: No live production writer creates a `type:'preference'`, `source:'user_stated'` Typed Memory record at this repository baseline (§8.5) — the read filter recognizes the class structurally, honestly, without a current producer exercising it. Does not block this Work Item's acceptance, since `type:'fact'` alone already supplies every acceptance scenario.
- RG-2: No canonical Health/Safety Profile source exists to classify safety-sensitive user-stated content (§15) — inherited, unrelated to this Work Item's own scope, already disclosed by `safetyLayer.js` for its own purposes.

**Product Decision Pending:** none identified — every behavioral/content question this Work Item's scope raises was already resolved by Head of Product in the preceding rounds (consent rule, knowledge-class subset, consumer choice, correction/forgetting framing, safety disclosure acceptance).

**Canonical Conflict:** none identified. A Pre-Authoring Contradiction Gate was performed against D3 §11.1, TASK-004 CD-02, B1, C4_SPEC, REM-003, B3 SPEC, and `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` — no unresolved contradiction was found between this SPEC's new contracts and any of them.

------------------------------------------------------------------------

# 20. Failure-Handling Catalogue

| Failure | Detection | Owner | Recovery | Fallback | Logging | Testing |
|---|---|---|---|---|---|---|
| Stale session at StateAccess read | `isCurrent()` check (§8.3 step 1/4) | `stateAccess.js` | Throw `staleSessionError()` | Caller (Memory Layer) catches → `UNAVAILABLE` | Existing error-code convention (`STALE_SESSION`) | Unit: stale-session rejection |
| Consent not granted | Explicit boolean check (§8.3 step 2) | `stateAccess.js` | Return `[]` immediately, no fetch attempted | N/A — `[]` is the correct, non-error result | None required (not an error) | Unit: consent-false → `[]` |
| `deps.fetchUserStatedMemory()` rejects | try/catch at Memory Layer (§9.2) | `memoryLayer.js` | Degrade to `facts: [], availability: 'UNAVAILABLE'` | Coach Prompt proceeds without the fragment | Existing graceful-degradation convention (no new logging) | Unit: fetch-rejection → `UNAVAILABLE`, prompt unaffected |
| Malformed fragment reaches projector | Defensive type check (§10.4) | `userStatedMemoryPrompt.js` | Return `''` | Coach Prompt proceeds without the fragment | None required | Unit: malformed input → `''` |
| Any failure in the new `buildSystemPrompt()` step | try/catch (§11.5) | `coachPromptComposer.js` | Coach Prompt built without the new fragment | Existing base+legacy+derived prompt, unaffected | None required (matches existing `derived` step discipline) | Integration: forced failure → prompt still produced |

------------------------------------------------------------------------

# 21. Work Packages

- **WP1 — StateAccess Read Capability.** New `READ_OPS.userStatedMemory`, new `PERMISSIONS.memoryLayer.USER_STATED_MEMORY_READ` identity, new injected `deps.fetchUserStatedMemory` (stubbed in tests, wired to `FitMeMemory.list()` in `js/app.js`). Tests: consent-false → `[]`; consent-true + mixed-status/source records → correct filter; deterministic ordering; stale-session rejection; no-live-Firestore Node testability.
- **WP2 — Memory Layer Assembly Extension.** New `assembleUserStatedMemoryFragment()` in `js/coachDecisionSystem/memoryLayer.js`, additive, `assembleContext()` byte-identical before/after. Tests: `AVAILABLE`/`UNAVAILABLE` degradation; frozen output; no interaction with existing `assembleContext()` fields.
- **WP3 — Bounded Projector Module.** New `js/userStatedMemoryPrompt.js`. Tests: bounding at `MAX_FACTS`/`MAX_CHARS`; empty/unavailable → `''`; deterministic, non-reordering rendering; structurally distinct header text from `derivedIntelligencePrompt.js` and `coachMemoryFragment()`.
- **WP4 — Coach Prompt Integration.** `coachPromptComposer.js`'s `buildSystemPrompt()` gains the new step, using the repository's normal top-of-module `require`/`window` dependency-resolution pattern for its two new dependencies (§11.4) — no lazy or call-time resolution. Tests: fragment appears in the composed prompt string when available; absent when unavailable/empty; failure isolation (prompt still produced on new-step failure); fragment ordering (`base` → legacy `mem` → new → `derived`).
- **WP5 — Composition-Root and Shell Wiring.** `js/app.js`'s `StateAccess.configure()` gains `fetchUserStatedMemory`; `index.html`/`sw.js` gain the one new script tag/SHELL entry, and relocate `js/coachDecisionSystem/expressionRenderingContext.js` + `js/coachDecisionSystem/memoryLayer.js` together to their new, verified-safe position, per §17. Tests/verification: existing Expression/Memory-Layer/Composite-Engine tests pass unmodified after relocation (position-only change, zero content diff on `expressionRenderingContext.js`); `internalPipelineOrchestrator.js`/`expressionRenderer.js` unaffected.
- **WP6 — End-to-End Production-Backed Verification and Closure.** The full acceptance list (§22), full regression, documentation synchronization (§23), Closure Record.

Each Work Package follows this program's own established precedent: implement, test, self-review, confirm, proceed.

------------------------------------------------------------------------

# 22. Acceptance Criteria / Production-Backed Verification

All SHALL be demonstrated using real, unmodified-elsewhere production code (the existing manual memory UI, the existing `js/memory.js` CRUD, the real `coachPromptComposer.js`), per this program's own standing discipline:

1. Consent `false` + an active `user_stated` fact → fact NOT present in the assembled fragment or the composed Coach Prompt.
2. Consent `true` + an active `user_stated` fact → fact present in the bounded fragment and in the composed Coach Prompt string.
3. Consent `true` + an active `user_stated` preference-shaped record (synthetic, since RG-1 notes no live producer exists) → preference present, proving the filter's structural readiness.
4. `status:'candidate'` record → excluded.
5. `status:'rejected'` record → excluded.
6. `status:'superseded'` record (synthetic — no live producer sets this today) → excluded.
7. `status:'archived'` record (synthetic) → excluded.
8. `source:'coach_generated'` record (synthetic, since no client path can create one) → excluded.
9. `source:'inferred_event'` record (synthetic) → excluded.
10. `source:'inferred_pattern'` record (synthetic) → excluded.
11. `source:'migrated'` record → excluded (does not independently satisfy `source === 'user_stated'`).
12. Edit an existing fact → next fresh read shows only the new content; old content absent.
13. Delete an existing fact → content absent from every subsequent fresh read.
14. No stale cache survives an edit or delete anywhere in the new chain (§13, §14) — verified by asserting no intermediate caching layer exists in StateAccess, Memory Layer, or the projector.
15. Multiple qualifying records → deterministic order (asserted stable across repeated calls with unchanged data).
16. Records exceeding the approved bound → deterministic truncation, never an unbounded prompt.
17. Legacy `coachMemoryFragment()` output is byte-identical before/after this Work Item.
18. The new fragment's rendered text is structurally distinct (different header, different position) from both the legacy fragment and the B5 `derived` fragment.
19. No Stage-3 Opportunity, Domain, Topic, or Reason is created from raw Typed Memory text at any point in this Work Item's own code (`internalPipelineOrchestrator.js`, `initiativeEngine.js`, `recommendationEngine.js`, `contextualMeaningPolicy.js` are unmodified — asserted by diff).
20. `trustTestSignal`/`glad`/`relationshipMaturity` are unchanged before and after every scenario above — this Work Item never reads or writes them.
21. G-2 and RGEF's own existing acceptance tests (`g2ProductionBackedAcceptance.test.js`, RGEF-added tests) pass unmodified.
22. Every existing Safety Layer test passes unmodified; `safetyLayer.js`/`safetyIntegrationPort.js` carry zero diff.
23. Full existing regression suite passes; net-new tests only added; no existing test's asserted behavior changes.

------------------------------------------------------------------------

# 23. Canonical Documentation Updates Required at Closure

- `docs/roadmap/Roadmap.md` / `docs/roadmap/Changelog.md` — new closure entry, per existing precedent format.
- `docs/architecture/FITME_ARCHITECTURE_v1.md` — additive section (following the RGEF §27/G-2 §26 precedent) describing the new Memory Layer capability, its StateAccess identity, and its Coach Prompt integration point.
- This document's own §1 (Status) and a new Closure Record section, added at closure only, per SAS convention.
- `APP_VERSION`/service-worker `VERSION` determination, recorded at closure, per this program's own "advance only if genuinely new user-visible behavior shipped" criterion (a personalized Coach Prompt fragment is user-visible — expected to advance, confirmed at closure).

------------------------------------------------------------------------

# 24. Open Items

## USM1-OI-1 — Bounding Parameters (Deferred to Implementation, §10.3/ED-1)

Not blocking. Owned exclusively by `js/userStatedMemoryPrompt.js`; future recalibration does not require a SPEC amendment.

## USM1-OI-2 — `type:'preference'` Live Producer (Deferred, RG-1)

Not blocking this Work Item's own closure. A future Work Item may add a manual "add preference" UI affordance to `js/memory.js` — not proposed, designed, or authorized here.

## USM1-OI-3 — Historical Supersession (Deferred, §2.3 item 5 / §13)

Restated for traceability. Not blocking.

## USM1-OI-4 — Safety-Sensitive Memory (Deferred, §15/RG-2)

Restated for traceability. Not blocking, already accepted by Head of Product + AI Architect.

**None of the above blocks this Work Item's own Canonical Review, Engineering Readiness Review, or closure.**

------------------------------------------------------------------------

# 25. No Canonical Conflict Identified

A Pre-Authoring Contradiction Gate, consistent with this program's own authoring discipline (G-2, RGEF, Affirmative Trust V1), was performed: no unresolved contradiction was found between this SPEC and D1/D2/D3/TASK-004/TASK-005/B1/B3/C4/REM-003/CSF/RGEF/G-2/the paused Affirmative Trust V1 SPEC; between this SPEC's own new contracts (§8-§11) and any existing enum/contract (`MEMORY_TYPES`, `MEMORY_SOURCES`, `MEMORY_STATUS`, `PERMISSIONS`, `PipelineContext`); or between this SPEC and any finding from the preceding investigation rounds that produced it. The one remaining Engineering Decision flagged in this document (ED-1, §10.3) is disclosed explicitly, not silently resolved. Every other Engineering-proposed item this SPEC originally flagged as pending (the StateAccess identity naming, the script-load-order resolution) was confirmed during Engineering Readiness Review and approved by Head of Product + AI Architect during this SPEC's correction pass — see §8.2, §11.4, §17, §19.

------------------------------------------------------------------------

# 26. Closure Record

**Status: IMPLEMENTED / VERIFIED / CLOSED.**

**Engineering-Readiness-identified corrections applied before implementation** (per the Engineering Readiness Review and the subsequent Final SPEC Correction pass, both approved by Head of Product + AI Architect): (1) §8.2 — the `memoryLayer`/`USER_STATED_MEMORY_READ` StateAccess identity was confirmed and explicitly documented as a capability-holder identity, never an Engine, never an alias for or widening of `coachDecisionSystem`/`DECISION_PASS`; (2) §11.4/§17 — the originally-proposed call-time lazy dependency-resolution technique was replaced with a verified-safe script-order relocation of `js/coachDecisionSystem/expressionRenderingContext.js` and `js/coachDecisionSystem/memoryLayer.js`, together, to immediately after `js/derivedIntelligencePrompt.js` and before `js/coach/coachPromptComposer.js`; (3) §12 — the Legacy Memory Collision finding was strengthened from "tolerated redundancy" to "not currently reachable in ordinary production," backed by a repository-wide search confirming no live writer to `coachMemory.observations` exists; (4) §10.2 — the bounding-drop-on-edit consequence was documented explicitly; (5) §15 — a "Prompt Role / Instruction Authority Boundary" disclosure was added, naming the pre-existing flat-system-prompt limitation honestly.

**Implementation-time findings, resolved without reopening any Product or Architecture decision:** the approved script relocation (correction 2 above) was found, during implementation, to violate `tests/coachDecisionSystemWiring.test.js`'s own broader-than-functionally-necessary invariant (all seventeen `coachDecisionSystem` files load after `js/engines/registerEngines.js`) and to require mechanical updates to two further tests (`tests/c1Wp6Wiring.test.js`, `tests/b5Wiring.test.js`) that asserted the exact prior literal source line of `buildSystemPrompt()`'s own final return statement. All three were corrected to reflect the newly-approved architecture — every other assertion in each test preserved exactly, no test's originally-asserted behavior weakened or removed, consistent with this program's own established precedent for approved, mechanical test updates (e.g. AFFIRMATIVE_TRUST_V1_SPEC §30 item 18's identical discipline). No other blocker, contradiction, or hidden foundation gap was found during implementation.

**Acceptance criteria (§22):** all 23 criteria demonstrated against real, unmodified-elsewhere production code. Criteria 3-11 (synthetic record shapes for classes with no live producer at this repository baseline — `preference`, `candidate`/`superseded`/`archived` status, `coach_generated`/`inferred_event`/`inferred_pattern`/`migrated` sources) verified via `tests/stateAccess.test.js`'s USM1-1 through USM1-17 using hand-constructed records passed through the real `readUserStatedMemory()` filter — honestly disclosed as synthetic per RG-1's own note, not fabricated as live-producer evidence. Criteria 1, 2, 12, 13, 17, 18, 21, 22, 23 additionally verified end-to-end in `tests/usm001ProductionBackedAcceptance.test.js` (USM1-ACCEPT-1 through 9), which constructs every record via `js/memory.js`'s own real, exported `makeMemory()`/`validateMemory()` and drives the real `js/stateAccess.js` → `js/coachDecisionSystem/memoryLayer.js` → `js/userStatedMemoryPrompt.js` → `js/coach/coachPromptComposer.js` chain, asserting on the exact composed prompt string — never a live Claude call, never asserted model wording.

**Test coverage added/extended:** `tests/stateAccess.test.js` (+17: USM1-1..17), `tests/coachDecisionSystemWiring.test.js` (test 12 mechanically corrected, 0 net new), `tests/memoryLayer.test.js` (+6: USM1-A..F), `tests/userStatedMemoryPrompt.test.js` (new, 13 tests), `tests/coachPromptComposer.test.js` (+6: USM1-27..32), `tests/c1Wp6Wiring.test.js` (1 assertion mechanically corrected), `tests/b5Wiring.test.js` (1 assertion mechanically corrected), `tests/usm001ProductionBackedAcceptance.test.js` (new, 9 tests) — net +51 tests.

**Full repository regression: 1997/1997 passing** (1946 pre-USM-001 baseline).

**`APP_VERSION`/service-worker `VERSION` determination:** advanced `2.42.0`/`v2.42.0` → `2.43.0`/`v2.43.0`, per §23's own criterion — a personalized Coach Prompt fragment is genuinely new, user-visible Coach behavior. Every pre-existing wiring test that hardcodes this literal version string (`tests/b2Wiring.test.js`, `tests/c1Wp1Wiring.test.js` through `tests/c1Wp10Wiring.test.js`, `tests/c2Wiring.test.js`) was mechanically updated to match, per this program's own established per-closure convention.

**Canonical documentation synchronized at closure:** `docs/roadmap/Roadmap.md` (new `## USM-001` section), `docs/roadmap/Changelog.md` (new Current-Status bullet), `docs/architecture/FITME_ARCHITECTURE_v1.md` (new §28). `docs/specs/AFFIRMATIVE_TRUST_V1_SPEC_v1.0.md` was not modified, per §16.2 — it remains paused.

**Scope purity confirmed:** every file changed traces to a named SPEC section (§8-§11, §17-§18) or to a directly-caused mechanical consequence of one (the three test-file corrections above, the seventeen version-string updates). No pre-existing, unrelated working-tree entry was touched, reset, or reformatted.

Approved by Head of Product + AI Architect and closed.
