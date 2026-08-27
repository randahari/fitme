# ESAF-001 — Explicit User Statement Arrival Freshness
### Foundation Correctness Vertical
### SPEC v1.0 (corrected) — AUTHORED, NOT YET IMPLEMENTED

Continues directly from: `docs/specs/USM_001_SPEC_v1.0.md` (CLOSED) and the accepted
"FITME — SEMANTIC USER UNDERSTANDING / FOUNDATION CONTRACT REPORT" investigation.

**Correction record (Head of Product + AI Architect SPEC Review):** §6/§7 tightened to a
single, consistent read-path-visibility gate; §8 corrected to (a) also fire on consent
*grant*, for architectural parity with Create, and (b) gate on `saveProfile()`'s returned
`status`, not on absence-of-throw (`saveProfile()` never throws); §10 failure-mode
terminology corrected; §11 sharpened with full production call-graph evidence. No Product
semantics were altered — see the accompanying Final SPEC Review Report for the evidence
trail behind each correction.

---

## §1. Purpose

Prove one narrow, critical correctness guarantee that the repository's own architecture
already anticipates but has never exercised:

> **New authoritative user information must be able to invalidate a Decision that was
> assembled before that information arrived.**

This is achieved by connecting two pieces of already-existing, already-tested, currently
dormant production machinery — never by inventing new mechanism:

- **Write side:** `MemoryLayer.recordExplicitUserStatementArrival(identity)`
  (`js/coachDecisionSystem/memoryLayer.js:255-259`).
- **Read side:** the Internal Pipeline Orchestrator's existing pre-dispatch supersession
  check (`js/coachDecisionSystem/internalPipelineOrchestrator.js:144-155`, D2-EF-07).

Today this path is provably dormant: `memoryLayer.js`'s own header (lines 238-252) discloses
that no live producer calls the write side, so the read side always evaluates
"not superseded." This Work Item supplies the first live producer — the existing manual
Typed Memory write path already used by USM-001 — and nothing else.

This Work Item explicitly does **not** implement semantic understanding of any kind. See §9.

---

## §2. Canonical Authorities

- **D3 §11.1 / Decision 3** — Memory Layer holds exclusive Decision-Input-intake authority.
  The write-side call this SPEC adds originates state that only the Memory Layer owns and
  exposes; `js/memory.js` calls into `memoryLayer.js`'s API, never the reverse.
- **D2-EF-07 (Pre-Expression User Correction)** — the already-approved architecture decision
  that the orchestrator's pre-dispatch check implements. This SPEC does not create D2-EF-07;
  it gives it its first real input.
- **D1 Unit 11 (Evidence Hierarchy, Tier 1 — Explicit User Statement)** — the class of input
  this mechanism reacts to. This SPEC does not assign an Evidence Tier to anything; it only
  reacts to the *fact* that a Tier-1-eligible write occurred.
- **REM-003 (Generative vs. Authoritative Boundary, Path A)** — only a successful,
  client-writable (`CLIENT_WRITABLE_SOURCES`), authoritative write may signal arrival. A
  `candidate`-status or server-only-source write must not.
- **USM-001 (`docs/specs/USM_001_SPEC_v1.0.md`)** — defines the exact producer this Work Item
  connects (`source==='user_stated'`, manual "מה המאמן יודע עליי" sheet) and the exact
  consent gate (`memoryConsent.granted`) this Work Item's consent-transition contract (§8)
  reacts to, unchanged in shape or meaning.
- **EXP-13** — Expression withholds by construction when not invoked; this SPEC relies on
  this existing guarantee and adds no new withholding mechanism.
- **B1 §10 / D1-MU-01** — AI-authored candidate memory requires user confirmation before it
  is authoritative; this boundary is why confirm/reject of non-`user_stated` records is
  excluded from this Work Item's producer contract (§4).

---

## §3. Scope

**IN SCOPE:** the five call sites identified in §4-§7 within `js/memory.js`; the smallest
required `MemoryLayer` reference inside `js/memory.js`; deterministic unit and
production-backed acceptance tests; canonical documentation closure.

**OUT OF SCOPE (unchanged by this Work Item):** semantic classification of any kind; Domain
Topic; any new Pipeline Context field; Preference/Current-State/Life-Event/Goal/Explicit-
Request/Intervention-Feedback/Behavioral-Report consumers; `EXPLICIT_USER_STATEMENT` as an
Evidence-Tier producer; Contextual Meaning; EvidenceEvaluator; Eligibility; Trust;
Relationship Maturity; Conversation/Voice; C4 (`typedMemoryServerWrite.js`) wiring; Goal
architecture; Safety semantic classification; per-memory consent; any change to
`index.html` script ordering (§14 confirms none is required).

---

## §4. Producer Contract

**Approved producer:** `js/memory.js`'s existing D6 transparency-sheet write actions —
the same production module and the same physical write path already used by USM-001's own
read side (`StateAccess.userStatedMemory` reads exactly the records these actions write).

**Boundary rule (governs §5-§7):** the signal fires **only** for writes where
`source === 'user_stated'` both before and after the write (i.e., the record was, and
remains, a manual Path-A user statement). It does **not** fire for:

- any write with `source ∈ {inferred_event, inferred_pattern, coach_generated, migrated}`;
- a failed write (caught exception — no call is made from inside a `catch` block, ever);
- the generic "אישור" (confirm) action (`memory.js:368-379`) applied to a non-`user_stated`
  record — confirming an AI-proposed candidate is a materially different act (REM-003 Path B
  confirmation) explicitly reserved for a future Work Item, not silently absorbed here.

Confirming an *already-`user_stated`* record via "אישור" is excluded too, on a narrower
ground: manual facts are created `status:'active'` directly (§5) — by the time "אישור" could
apply to one, it is already authoritative, and re-confirming is reinforcement of existing
information, not arrival of new information. Including it would not be wrong, but is not
required for the correctness guarantee in §1, and is left out to keep this Work Item's
producer surface minimal and auditable.

**No duplicate persistence:** the signal is a single synchronous, in-memory call
(`MemoryLayer.recordExplicitUserStatementArrival({userId: currentUser.uid})`) made
immediately after the underlying Firestore write's `await` resolves successfully, using the
identical `currentUser.uid` that write itself already used via `memCol()`. No second store,
no new collection, no new field on the Typed Memory record itself.

---

## §5. Create Contract

**Call site:** the "+ הוסף משהו שהמאמן צריך לדעת" handler (`memory.js:337-344`).

**Trigger:** immediately after `await createMemory({type:'fact', payload:{text}, confidence:1,
source:'user_stated', status:'active'})` resolves without throwing, before `openSheet()`.

**Rule:** every successful call always qualifies (this creation path is unconditionally
`source:'user_stated'`, `status:'active'` — no branching needed).

---

## §6. Edit / Correction Contract

**Call sites:** the "עריכה" handler (`memory.js:393-406`) and the "לא נכון" (reject) handler
(`memory.js:382-390`) — both operate on an existing record `m` already held in closure from
the just-rendered list, so `m.type`/`m.source`/`m.status` are all known **before** the write,
with no extra read.

**Trigger:** immediately after `await updateMemory(m._id, patch)` resolves without throwing,
before `openSheet()`.

**Rule (corrected — read-path-visibility gate, unified with §7):** fires **iff**, at the
moment of the write, `m.type ∈ {'fact','preference'} && m.source === 'user_stated' &&
m.status === 'active'` — i.e., the record being changed was, at that moment, actually within
USM-001's `assembleUserStatedMemoryFragment()` visible set. Neither handler's `patch` changes
`type`, `source`, or `status` except the reject handler's own `status:'rejected'` (which is
exactly the transition being signaled), so checking the pre-write values is equivalent to
checking what changes. A correction of the user's own prior statement (edit) or a retraction
of it (reject) is, per D1-ER-03, itself new authoritative information ("the earlier fact no
longer holds") — both are Create-Vs-Edit "YES" cases per the Product's own resolution.

**Why the tightened gate (not merely `source==='user_stated'`):** editing or rejecting a
`user_stated` record that is *not currently* `status:'active'` (e.g. already `rejected`,
or a not-yet-confirmed `candidate`) changes nothing the read path could see before or after —
USM-001's filter only ever surfaces `status==='active'` records. Firing in that case would be
freshness churn with no corresponding visibility change, which the Product's own
"if deleting the record changes what the authorized read path could legitimately see"
principle (Review Issue 3) applies equally to edit/reject, not only to delete. Rejecting or
editing an inferred/coach-generated/migrated record does not fire, for the same reason given
in §4. The `type ∈ {fact,preference}` clause is currently always true for `source==='user_stated'`
records (no live producer creates a `user_stated` record of any other type today) but is
included defensively to mirror USM-001's filter exactly, so a future producer cannot silently
widen this gate beyond what the read path actually surfaces.

---

## §7. Delete / Forgetting Contract

**Call site:** the "מחק" handler (`memory.js:409-417`).

**Trigger:** immediately after `await deleteMemory(m._id)` resolves without throwing, before
`openSheet()`.

**Rule:** fires **iff**, at the moment of deletion, `m.type ∈ {'fact','preference'} &&
m.source === 'user_stated' && m.status === 'active'` — the same read-path-visibility gate as
§6, i.e. the deleted record was actually eligible to have been part of what USM-001's
`assembleUserStatedMemoryFragment()` could have surfaced. Deleting a
`rejected`/`archived`/`candidate`/non-`user_stated` record cannot have changed what was
legitimately knowable, so it does not fire.

**Determination (per the explicit instruction not to guess):** the existing freshness
mechanism (§8) is unconditional by construction — it has never, for create or edit,
attempted to establish that a specific prior Decision *actually used* the specific changed
fact; it conservatively treats "the assembled picture may now be stale" as sufficient reason
to withhold. Extending the identical, already-conservative call to a qualifying delete
introduces no new or stronger claim of dependency than creates/edits already carry. It is
therefore the same mechanism, not a new one, applied consistently — satisfying
"forgotten information must not continue influencing a future output" without inventing a
Terminal Decision or a dependency-tracing capability that does not exist today.

---

## §8. Consent Transition Contract (corrected — fires on both revoke and grant)

**Call site:** the memory-consent checkbox `change` handler (`memory.js:287-291`).

**Trigger (corrected):** `saveProfile()` (`app.js:560-569`) never throws — it internally
catches persistence failure and *returns* `{status:'FAILED', error}` instead of rejecting.
The original SPEC's "resolves without throwing" gate was therefore incorrect for this one
call site: it would have fired even on a failed write. The correct, verified gate is:

```js
var result = await saveProfile();
if (result && result.status === 'SUCCESS') {
  MemoryLayer.recordExplicitUserStatementArrival({ userId: currentUser.uid });
}
```

fired only when `result.status === 'SUCCESS'` — never on `'FAILED'` or `'NO_OP'`.

**Rule (corrected — fires on both transitions):** fires on **both** `granted:false→true`
(grant) and `granted:true→false` (revoke), determined by comparing the checkbox's prior
rendered state (captured at the top of `openSheet()`, line 286) to `cb.checked` after the
change. The original SPEC's revoke-only rule is corrected: the Product's own already-accepted
Core Contract requires *Create* to fire because it changes the set of information USM-001's
read path can legitimately see from `[]`-relevant-to-empty to including a new fact. Consent
*grant* changes that exact same read-path-visible set in the exact same direction and by the
exact same mechanism (`memoryConsent.granted` gates `assembleUserStatedMemoryFragment()`
fail-closed to `[]`/`UNAVAILABLE` when false, per USM-001) — there is no architectural basis
to treat "a new fact becomes visible because it was just written" differently from "a set of
already-written facts becomes visible because permission was just granted." Both are, from
the read path's perspective, the visible set growing at a specific moment; treating only one
of them as staleness-inducing was an inconsistency, not a genuine distinction, once compared
directly against Create's own accepted rule. Revoke continues to fire for the reason already
given: it can make an **already-assembled** context rely on information the user has just
withdrawn permission for, and "immediately" (per Product) is met via the same existing
withhold mechanism. No per-memory consent is introduced; the gate remains the single
profile-level `memoryConsent` field, unchanged in shape or meaning (§2).

---

## §9. No-Semantic-Interpretation Boundary

Every call site above passes only `{userId: currentUser.uid}` to
`recordExplicitUserStatementArrival`. No call site reads, forwards, or branches on
`m.payload`, `m.type` (beyond the `source`/`status` gates above, which are metadata about
*authorship and authority*, not content), or any text the user wrote. The signal answers
exactly one question — "did a qualifying authoritative write happen, and when" — and answers
it identically regardless of whether the statement was a Preference, a Life Event, a Goal, or
anything else. No Domain, Topic, classifier, Contextual Meaning input, Evidence Tier, Trust
signal, or Relationship Maturity signal is produced, read, or persisted by this Work Item.

---

## §10. Timestamp / Session Contract

Traced from the existing, unmodified implementation (`memoryLayer.js:253-266`) — **preserved
exactly, not redesigned**:

- **Owner:** `js/coachDecisionSystem/memoryLayer.js`, via a single module-closure variable
  `_explicitUserStatementArrivals` (in-memory only; not a Persistence Gateway write; matches
  `sessionLifecycle.js`'s own generation-counter pattern).
- **Timestamp source:** `Date.now()`, generated **inside** `recordExplicitUserStatementArrival`
  itself at call time — the function's real signature is `recordExplicitUserStatementArrival(identity)`,
  **not** `(timestamp)`. (See §14 — this SPEC corrects the Work Item authorization's
  shorthand description against the verified production signature; the production function is
  unchanged and correct as-is.) This is the same clock (`Date.now()`, same JS runtime) that
  `pipelineContext.assembledAt` (`memoryLayer.js:180,302`) already uses — no cross-clock skew
  is possible.
- **Comparison semantics:** `correctionArrivedAt > pipelineContext.assembledAt`
  (`internalPipelineOrchestrator.js:144-147`) — strict greater-than, unchanged.
- **Session/user scoping:** keyed by `identity.userId` only (`sessionGeneration`/`runId` on
  the passed `identity` are ignored by both the read and write side today). Multi-user
  switching is safe: user A's arrival timestamp cannot affect user B's check, since each has
  an independent dictionary key. This Work Item's new call sites all read `currentUser.uid`
  at the same synchronous point the just-completed underlying Firestore write already used it
  via `memCol()` — no new staleness window is introduced beyond what the write itself already
  carries (existing REM-002 concern, unchanged, out of scope here).
- **Ordering/determinism:** synchronous map write; deterministic given call order.
- **Multiple arrivals:** `record()` unconditionally overwrites
  (`_explicitUserStatementArrivals[userId] = Date.now()`), so multiple arrivals collapse
  safely to the latest timestamp — correct for this mechanism's purpose, since the comparison
  only needs "has anything newer than assembly arrived," and the latest arrival time is always
  `>=` any earlier one.
- **Failure behavior (terminology corrected):** `record()` no-ops silently if
  `identity.userId` is falsy; `get()` returns `null` if no `userId` or no recorded entry. The
  orchestrator's `typeof correctionArrivedAt === 'number'` guard treats `null` as
  "not superseded" — i.e. the existing mechanism's default when no arrival signal is present
  is to **allow dispatch** (fail-*open* with respect to the freshness check itself, not
  fail-closed — the original SPEC's "permissive fail-closed" wording was self-contradictory
  and is withdrawn). This is not a conflict with "never deliver a known-stale output": the
  guarantee is about *known* staleness — a `correctionArrivedAt` that is a real number greater
  than `assembledAt`. When no arrival was ever recorded (or recording is impossible, e.g. no
  `userId`), the system has no staleness *signal* at all, known or unknown — it is not
  detecting freshness-state-unavailability and overriding it, it is simply in the same state
  the whole pipeline has always been in before ESAF-001 existed. This Work Item does not
  change that default and is not authorized to (§3). Its own, separate, new fail-closed rule
  sits one level up, at the write side: a failed or ambiguous write must never reach the
  record call (§4-§8 all gate on a **verified success signal** — a resolved `await` with no
  throw for `createMemory`/`updateMemory`/`deleteMemory`, which do reject on Firestore
  failure; and `saveProfile()`'s own returned `status==='SUCCESS'`, corrected in §8, since
  that function does not reject on failure).
- **Page reload / session reset:** verified already correct, unchanged. On reload, both
  `_explicitUserStatementArrivals` (in-memory) and any subsequent `pipelineContext.assembledAt`
  reset independently at their own next natural occurrence — since a reload necessarily
  produces a fresh context assembly before any Decision Pass can run again, the specific
  staleness scenario this mechanism guards against (an *already-assembled* context surviving
  past a *later* arrival) cannot span a reload boundary. No special reload handling is required
  or added.
- **Logout / login as another user (reported, not fixed):** `_explicitUserStatementArrivals`
  is a module-level, tab-lifetime dictionary keyed by `userId`. Logging out and into a
  different user within the same tab (no full reload) leaves the previous user's key in the
  dictionary; it is never read again because the new user's `identity.userId` differs — no
  cross-user contamination occurs, but this is a real, harmless, unbounded-for-the-tab's-life
  memory leak, one stale key per user ever logged into that tab. Not fixed, per the explicit
  instruction not to add mechanism beyond what the existing canonical contract requires.
- **Multiple tabs, same user (real limitation, reported not fixed):** each browser tab runs
  its own independent JS module instance, hence its own independent
  `_explicitUserStatementArrivals` dictionary. A qualifying write made in Tab A is invisible
  to Tab B's copy of this in-memory signal — Tab B's freshness check would not detect it. This
  is a pre-existing property of the already-approved mechanism (it predates ESAF-001, which
  only supplies its first producer) and is not introduced or worsened by this Work Item. Per
  §1's own scope of guarantee (a single tab's assemble-then-dispatch window) and the explicit
  instruction not to add cross-tab synchronization, this is reported as a known limitation of
  the underlying mechanism, not remediated here.
- **Millisecond collision:** in the (`===`) tie case, `correctionArrivedAt > assembledAt` is
  `false` — a same-millisecond arrival would be treated as not-superseded. Practically
  unreachable: `pipelineContext.assembledAt` is captured synchronously inside
  `assembleContext()`, strictly before the orchestrator later performs the comparison, and
  every producer's qualifying write in §5-§8 requires an awaited Firestore network round-trip
  (createMemory/updateMemory/deleteMemory/saveProfile) between any user action and the
  recording call — a duration that cannot coincide with a separate, already-in-progress,
  synchronous context assembly at millisecond resolution. No monotonic-counter or other
  over-engineering is warranted.

---

## §11. Existing Freshness Consumer — Full Dispatch Lifecycle (traced, unmodified)

**Decision Pass vs. Expression — these are not the same completion boundary.** By the time
the supersession check runs, `runDecisionPass()` has already returned `status:'FORMED'`
(`internalPipelineOrchestrator.js:122-131`) — the Decision Pass itself is **completed**
(D2-INV-05 Silence or a real recommendation, either way a validly formed TerminalDecision).
D2-EF-07's check operates strictly *after* that, at the Expression boundary only: it decides
whether to render/dispatch the already-completed decision, never whether to form one.
"Superseded" therefore means **Expression withheld**, not **Decision Pass aborted/skipped**.

**Return chain, traced end to end:**

1. `internalPipelineOrchestrator.run(ctx)` returns
   `{status:'SUCCESS', output:{pipelineContext, candidates:[], terminalDecision, expression:{status:'SUPERSEDED'}}}`
   (line 154) — `status:'SUCCESS'` at this module's own level; the `SUPERSEDED` detail lives
   only inside `output.expression.status`.
2. This is the `run` function registered as `coachDecisionSystem`'s `run` in
   `registerCoachDecisionSystem.js:26-33` (`triggers: ['APP_READY']` — the **only** trigger
   this Composite Engine is ever registered for).
3. `EngineRegistry.run()`'s `normalizeResult()` (`engineRegistry.js:116-129`) reduces every
   engine result to one of exactly `SUCCESS`/`SKIPPED`/`FAILED` at its own level; a raw
   `status:'SUCCESS'` (regardless of the nested `expression.status`) normalizes to
   `SUCCESS` — **EngineRegistry itself never sees or reacts to `'SUPERSEDED'`**; it is not a
   failure, not a skip, not treated specially in any way at this layer.
4. The **sole caller** of `EngineRegistry.run({trigger:'APP_READY', ...})` is
   `runAppReadyEngines()` in `app.js:2117-2157`, invoked once at app startup. It is explicitly
   documented as non-blocking ("לא חוסם עלייה" — does not block startup) and is called
   fire-and-forget: `.then(function(summary){...}).catch(function(){})` — **never awaited by
   any synchronous, user-facing code path.**
5. Its `.then()` callback (`app.js:2140-2154`) reads
   `cdsResult.output.expression` and acts **only if** `expression.status === 'DISPATCHED' &&
   expression.deliveryIntent` (line 2142) — calling `TriggerController.presentDeliveryIntent(...)`
   to surface a Coach card. Every other status value — `'SUPERSEDED'`, `'NOT_ATTEMPTED'`,
   `'ABORTED'`, or simply Silence with no `deliveryIntent` (the actual, universal outcome
   today per line 2137-2139, since no live Opportunity source exists yet) — falls through
   this `if` silently. **No caller anywhere assumes Expression was produced, and no caller
   treats a withheld/`SUPERSEDED` result as an error**; `SUPERSEDED` joins a set of
   already-existing, already-handled "no output this cycle" outcomes, not a new risk category.

**Answers to the twelve required questions:**

1. Returns `{status:'SUCCESS', output:{..., expression:{status:'SUPERSEDED'}}}` (never throws,
   never rejects).
2. `EngineRegistry` receives it, normalizes to engine-level `SUCCESS`, and includes it
   unexamined in the `EngineRunSummary` it returns to `runAppReadyEngines()`.
3. The Decision Pass itself is **completed** (FORMED); only Expression is **withheld**
   (a new, already-declared value alongside `DISPATCHED`/`NOT_ATTEMPTED`/`ABORTED` — no new
   Terminal Decision state is introduced).
4. No. Nothing in this call chain schedules another pass.
5. The next pass occurs only at the next `APP_READY` trigger — i.e., the next app load/reload
   for that session. Nothing else in the current repository fires this Composite Engine.
6. **No** — see the definitive evidence in point 7 below.
7. **Confirmed: this path is autonomous/background-only in current production.** The
   `coachDecisionSystem` engine's only trigger is `APP_READY`; its only caller
   (`runAppReadyEngines`) is fire-and-forget and non-blocking; its only consumer of the result
   renders, at most, a passive Coach card via `TriggerController.presentDeliveryIntent` — it
   does not respond to any user-initiated request awaiting a reply. This matches the
   independently-confirmed, disclosed fact (`memoryLayer.js`'s own header, and this
   investigation chain's earlier findings) that **no live chat/message-send UI exists in this
   repository at all** — there is no synchronous user-awaited interaction for this branch to
   ever occur inside.
8. No (point 5).
9. No (point 5) — `SUPERSEDED` is invisible at the `EngineRegistry` level (`SUCCESS`) and
   silently ignored at the `app.js` consumption level.
10. No retry loop exists anywhere in this chain; `.catch(function(){})` swallows without
    rescheduling.
11. Yes — `pipelineContext` is a local variable of `run()`; nothing outside this single
    invocation stores or reuses it (`app.js`'s `.then()` callback never reads
    `cdsResult.output.pipelineContext`).
12. Yes — the next `APP_READY`-triggered `run()` calls `MemoryLayer.assembleContext(identity)`
    fresh, which already re-reads Typed Memory and consent live each time (USM-001, unchanged).

There is no separate reassembly step today, and this Work Item does not add one (the
orchestrator's own comment, lines 150-153, is explicit that a future re-intake cycle is a
separate, later concern). This Work Item does not invent a new Terminal Decision — it only
ensures the check's one existing input, `correctionArrivedAt`, can for the first time become
non-null in production.

**Product Acceptance Rule verification:** given points 6-7 above, the scenario the Product
guarded against — a user actively awaiting a response receiving silent non-response — **does
not exist in the current production call graph**. This is not a Product policy judgment call;
it is a direct, traced consequence of `coachDecisionSystem` having exactly one trigger
(`APP_READY`) and exactly one, non-blocking, background caller. No STOP condition is reached.

---

## §12. Conversation Compatibility

The contract surface this Work Item establishes is exactly
`MemoryLayer.recordExplicitUserStatementArrival({userId})` called after **any** successful,
authoritative (`source==='user_stated'`, non-`candidate`), qualifying Typed Memory write —
never anything shaped like "settings UI changed." A future Conversation/Voice producer that
writes an authoritative Typed Memory record through the same `createMemory`/`updateMemory`/
`deleteMemory` path (or an equivalent future authoritative write surface) would call the
identical function with the identical argument shape. No producer-specific branch exists
inside `memoryLayer.js`; the manual sheet in `js/memory.js` is simply the first caller.

---

## §13. Production-Backed Acceptance (required, to be implemented in a future turn)

Using real production modules (`js/memory.js`, `js/coachDecisionSystem/memoryLayer.js`,
`js/coachDecisionSystem/internalPipelineOrchestrator.js`), no live Claude call, no Chat, no
new UI, no Trust, no classification:

1. Assemble a real `pipelineContext` at `T1` via `MemoryLayer.assembleContext(identity)`.
2. At `T2 > T1`, perform a real `createMemory({..., source:'user_stated', status:'active'})`
   through `js/memory.js`'s add-fact path (or its handler function directly, invoked with a
   test DOM/prompt double, consistent with existing UI-handler test conventions in this repo).
3. Assert `MemoryLayer.getExplicitUserStatementArrivalTimestamp(identity) === T2` (recorded).
4. Call `internalPipelineOrchestrator.run(ctx)` (or its internal equivalent used by existing
   orchestrator tests) with the `pipelineContext` assembled at `T1`; assert the result is
   `expression:{status:'SUPERSEDED'}` and that `runExpressionStage`/`ExpressionRenderer` was
   never invoked (spy/mock, matching existing test patterns in `tests/internalPipelineOrchestrator.test.js`).
5. Repeat 2-4 for: an edit of a `user_stated`/`active` record; a reject of one; a delete of
   one; a consent revoke (`granted:true→false`); and a consent grant (`granted:false→true`).
   For each, also assert the **negative** case: the equivalent action on a non-`user_stated`,
   non-`active`, or no-op (`status==='NO_OP'`/`'FAILED'` from `saveProfile()`) input does
   **not** advance the recorded timestamp.
6. Regression: full existing suite green, including `tests/memoryLayer.test.js`,
   `tests/internalPipelineOrchestrator.test.js`, and all USM-001 tests, unmodified in their
   existing assertions except where a new, additive test is appended.

---

## §14. Hidden Foundation Verification

Checked per the required list; no blocker found:

- **Where the hook can legally be called:** only from within `js/memory.js`'s own write
  handlers, after their own successful `await` — matches D3 §11.1 (Memory Layer's own API is
  the sole legitimate origin point of this Decision-Input-adjacent signal; `js/memory.js`
  calls into it, one direction only).
- **Circular module dependencies:** none. `memoryLayer.js`'s own header (lines 13-16)
  explicitly states it "does not read `js/memory.js` directly." Adding a require from
  `js/memory.js` → `memoryLayer.js` is one-directional and introduces no cycle.
- **Client vs server ownership:** entirely client-side/in-browser; no Cloud Function, no
  server write, matching the existing mechanism's own in-memory-only design.
- **Timestamp source:** verified same-clock (`Date.now()`) on both sides; no skew possible.
- **Session generation:** verified ignored by both sides of the existing mechanism (keyed by
  `userId` only) — not a defect this Work Item is authorized to fix; documented as existing
  behavior, unchanged.
- **Multi-user switching:** verified safe (per-`userId` key).
- **Consent timing:** resolved in §8 (both transitions fire, revoke for immediate-effect
  correctness, grant for parity with Create; both gated on `saveProfile()`'s returned
  `status==='SUCCESS'`, corrected — see below).
- **Create/edit/delete sequencing:** each call site's signal fires strictly after its own
  write's success is confirmed and strictly before that handler's own `openSheet()` refresh —
  no interleaving risk.
- **Write failure:** for `createMemory`/`updateMemory`/`deleteMemory`, every call site is
  gated inside the `try` block's success path only, never inside a `catch` (these functions
  reject on Firestore failure, so absence-of-throw is a valid success signal). For
  `saveProfile()` specifically, absence-of-throw is **not** a valid success signal — that
  function catches internally and returns `{status:'FAILED'}` rather than rejecting
  (`app.js:560-569`) — so §8 is corrected to gate on the returned `status` value instead. This
  discrepancy was found during this review and is documented as a genuine, now-corrected
  finding, not assumed away.
- **Optimistic local state:** `js/memory.js` has no optimistic local cache — `listMemories()`
  always re-reads from Firestore on `openSheet()`; no divergence risk.
- **Reassembly behavior:** confirmed there is none today beyond withholding (§11); this SPEC
  does not add any.
- **Expression dispatch ordering:** confirmed the check already runs strictly before
  `runExpressionStage()` is ever invoked (§11); unchanged.
- **Signature discrepancy (flagged, not a blocker):** the Work Item authorization described
  the write-side call as `recordExplicitUserStatementArrival(timestamp)`; the verified
  production signature is `recordExplicitUserStatementArrival(identity)`, self-timestamping
  internally. §10 documents and preserves the real signature; no code or contract in this
  SPEC assumes a `timestamp` parameter exists.

**No genuine blocker was found. SPEC authoring proceeds.**

---

## §15. Work Packages

- **WP1 — Producer wiring.** Add the smallest required `MemoryLayer` reference to
  `js/memory.js` (identical dual-environment pattern to the existing `PersistenceGateway`
  reference, lines 14-16); add the five gated call sites per §5-§8.
- **WP2 — Unit tests.** Deterministic tests for each of the five call sites' positive and
  negative gating conditions (§4-§8), isolated from Firestore (existing test-double
  conventions for `js/memory.js`).
- **WP3 — Production-backed acceptance.** Per §13, using real `memoryLayer.js` and
  `internalPipelineOrchestrator.js`.
- **WP4 — Regression.** Full existing suite, including every USM-001 and D2-EF-07-adjacent
  test, confirmed green with zero unrelated assertion changes.
- **WP5 — Canonical closure.** Update `docs/roadmap/Roadmap.md` /
  `docs/roadmap/Changelog.md` / `docs/architecture/FITME_ARCHITECTURE_v1.md` per the existing
  USM-001 closure pattern (§23-equivalent); `APP_VERSION` bump in `sw.js` per existing
  precedent (no new file added to the cache list — `js/memory.js` is already cached).

---

## §16. Scope Purity Statement

No file outside `js/memory.js` (production) and its corresponding test file(s) requires any
change. `memoryLayer.js`, `internalPipelineOrchestrator.js`, `index.html` script order,
Contextual Meaning, EvidenceEvaluator, Eligibility, Trust, Relationship Maturity, G-2, RGEF,
Safety, and every USM-001 file are read-only inputs to this Work Item, unmodified.

---

## §17. Canonical Closure Requirements (for the future implementation turn)

Identical in kind to USM-001's own closure record: file list, test count before/after,
regression confirmation, Roadmap/Changelog/Architecture doc updates, `APP_VERSION` bump,
commit, push — to be produced only once implementation is separately authorized.

---

*Status: SPEC v1.0 authored. Not implemented. No production code, tests, or other files
touched by this authoring turn.*
