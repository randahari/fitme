# CCC-001 SPEC v1.0 — Coach Conversation Continuity (Friends Alpha Item 2)

## 1. Status

- Version: 1.0
- Status: **CANONICAL / CLOSED.** Authored per explicit Product/Architecture authorization following the "FITME Friends Alpha P0/P1 Integration Plan" investigation and the subsequent Item 2 read-only architecture investigation. Every boundary decision this SPEC freezes was reached explicitly by Product/Architecture, not invented during authoring. Closed following the Canonical Review recorded immediately below, which corrected the one material drift found between this document and live behavior (the continuity-admission rule) plus two smaller status-transition inconsistencies (`ABORTED`/`SUPERSEDED`) — no other section was found stale, contradicted by later canon, or otherwise unsafe to close.
- **Correction record (Product/Architecture Canonical Review — continuity-admission correction):** three corrections applied as one controlled unit of work, no other section substantively altered. **(1)** §8's conversation-context admission rule is corrected from an enumerated `status === 'COMPLETED'` filter to the durable, general primitive `status !== 'PENDING'` — a user turn belongs to bounded conversational continuity if and only if it reached a genuine governed terminal state, independent of whether that terminal state was `COMPLETED` (a response was given) or `SILENCE` (a governed decision not to respond). This corrects a real conflation in the original text between response decision and conversational value (Product invariant: *response decision ≠ conversational value ≠ long-term memory decision*) — a `SILENCE` turn's inclusion grants it conversational visibility only, never reasoning authority beyond that, never Typed Memory authority, never User Knowledge status, and never Safety authority (§9's authority boundary, restated and strengthened, below). **(2)** §5.2's `PENDING → SILENCE` table is corrected to remove `ABORTED` — the live implementation was already correct in excluding it (every `ABORTED` reason is a technical Expression-stage failure, never a governed decision) and the original spec text was wrong to have listed it alongside genuine governed outcomes; this correction aligns the document to the already-correct code, not the other way around. **(3)** `SUPERSEDED` (the D2-EF-07 pre-Expression supersession outcome — a genuine governed outcome: the pipeline completed and produced a real decision, but withheld it because newer corrective information superseded it) is now also implemented as a live `PENDING → SILENCE` trigger, closing a previously-dormant gap where the spec text already named it but the code did not yet honor it; its own triggering correction-input channel remains unreachable in production, but the persistence semantics are now already correct for when it is built.
- **Correction record (Product/Architecture SPEC Review pass 1):** two narrow corrections applied, no other section substantively altered. **(1)** §9's `recentConversationContext` no longer adds a new value to the existing `interpretationAuthority` vocabulary (that tag, everywhere else in the codebase, means "an AI classifier produced this reading" — untrue here, since transcript is raw, unclassified, verbatim text) — it instead reuses this codebase's own separate, already-established `provenance` naming convention (`readinessStateContext`'s own closed provenance tag, `memoryLayer.js:558-563`) as the pattern for a new, independently-scoped, single-value field, `provenance: 'CONVERSATION_CONTEXT'`, never injected into that other, TRR-001-owned closed enum. **(2)** §5.2's lifecycle no longer transitions a turn to `SILENCE` on a technical/exception failure — `SILENCE` is now reserved exclusively for a governed pipeline outcome that genuinely completed with no Delivery Intent; any technical failure (JS exception, or an engine-level `{status:'FAILED'}` result) leaves the turn `PENDING`, permanently, in V1 — matching PENDING's own correct meaning ("submitted, without a successfully persisted governed completion") rather than fabricating a false SILENCE record.
- **Correction record (Product/Architecture Final Review pass — implementation defect):** §8 step 1's candidate-acquisition method is corrected; no other part of §8 or §9 is altered. The implementation's first pass fetched a single bounded window (latest 20 turns of all statuses, client-filtered to `COMPLETED`, capped to 6) — Product/Architecture ruled this **not semantically equivalent** to "the most recent 6 COMPLETED turns," since a run of 20+ consecutive non-`COMPLETED` turns could yield fewer than 6 even when older `COMPLETED` turns genuinely exist further back. §8 step 1 now reads: acquire candidates via **deterministic, cursor-based Firestore pagination** (`ConversationRepository.fetchRecent(uid, pageSize, afterCreatedAt)`, `.orderBy('createdAt','desc').startAfter(cursor).limit(pageSize)`, page size 10), reading successive pages and filtering each to `status === 'COMPLETED'` until **either** 6 eligible `COMPLETED` turns have been obtained **or** a page returns fewer documents than requested (history exhausted) — with **no arbitrary page-count ceiling**, so the true latest 6 `COMPLETED` turns are always found regardless of how many intervening `PENDING`/`SILENCE` turns exist. This uses only the existing single-field `createdAt` index (no manual composite index introduced). §7's display query (`limit(50)`, no cursor, no status filter) is unchanged and remains fully decoupled from this pagination loop.
- **Correction record (Product/Architecture Final Review pass — cursor stability):** §7 and §8's query shape gains a deterministic tie-breaker; no bound, status, schema, or version is altered. `createdAt` (a Firestore server timestamp, assigned once at document creation) is not guaranteed unique across documents — two turns created in the same tick can legitimately share one — and Firestore's own documented cursor semantics warn that `.startAfter()` built from a single field with duplicate values is not guaranteed deterministic: it excludes every document equal to that value, so a page boundary landing inside an equal-`createdAt` group could silently skip sibling documents on the far side of it. Both queries now add `FieldPath.documentId()` as a second, descending `orderBy` — document IDs are always unique, so (`createdAt`, document ID) together give a total order with no possible tie — and §8's pagination cursor becomes the two-part pair (`afterCreatedAt`, `afterTurnId`), passed as `.startAfter(afterCreatedAt, afterTurnId)`. This still requires **no manual composite index**: ordering by one field plus `FieldPath.documentId()` is served by that field's own existing single-field index (a documented Firestore exception, unlike an arbitrary second field). §7's display query gains the same tie-breaker for consistency, with no other change to its own bound (latest 50, all statuses, no cursor).
- Authored by: Lead Engineer / Repository Analyst / SPEC Author, per the authority granted by Product/Architecture for this task.
- Authority for approval: Product/Architecture (Canonical Review, Product Approval, Architecture Approval, READY determination — none of which this document performs on its own authority).
- Repository baseline: `main`, commit `a0c69d01fde4389e75fa2541ecff40a78b85f62f` (`feat: add bounded Friends Alpha error telemetry`), full regression 2601/2601 passing at that commit.
- Continues directly from: `docs/specs/DUC_001_SPEC_v1.0.md` (CLOSED — §02 explicitly reserves conversation persistence as *"a separate, future, explicitly-authorized capability (Package Ch.08) — out of DUC-001 V1's own scope"*, which this SPEC is), `docs/specs/TRR_001_SPEC_v1.0.md` (CLOSED — the reasoning-component pattern this SPEC extends), and the "Friends Alpha P0/P1 Integration Plan" session (Item 2's own approved architectural direction).
- Naming: this SPEC follows the repository's established short-code Work Item convention (`TRR-001`, `USM-001`, `USC-001`, `USP-001`, `EUR-001`, `CSR-001`, `CSSC-001`, `ESAF-001`, `LCSC-001`, `MAI-001`, `DUC-001`) rather than inventing a new naming scheme — **CCC-001**, Coach Conversation Continuity.
- Governing meta-standard: `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`.

---

## 2. Purpose and Scope

Friends Alpha requires the Coach Conversation Surface (DUC-001) to survive reload, restore across devices, and support natural bounded follow-up continuity — without the persisted transcript ever becoming, or being treated as, authoritative user knowledge. This SPEC governs **both halves together**, per explicit Product direction: (1) transcript persistence for display/restoration, and (2) a bounded, non-authoritative conversational-context projection consumed by classification and reasoning.

**Explicitly out of scope** (Non-Goals, §16): semantic summarization of older conversation, embeddings, vector search/storage, a second AI summarization pass, inference of long-term/durable memory from transcript, any change to Safety's own detection/matching machinery, any change to `lastClarificationRef`'s existing contract, any TRR-specific or domain-specific conversation-history mechanism.

---

## 3. Canonical Boundary Freeze

**Frozen, non-negotiable within this SPEC's own scope:**

1. **Conversation transcript ≠ Typed Memory.** No code path introduced by this SPEC ever calls `js/memory.js`'s `createMemory()`. A persisted conversation turn's `source`/authority is never `user_stated`, never any Typed Memory source value.
2. **Conversation transcript ≠ Safety Context.** No code path introduced by this SPEC is ever read by `SafetyContextInterpreter`, `UserSafetyProvenanceInterpreter`, or `matchCanonicalSafetyRules()`. A statement appearing in transcript (e.g. *"הרופא אמר לי לא לרוץ"*) gains no Safety authority merely by having been said in a conversation — that durable-authority path is exclusively Item 6 / User Understanding intake, unaffected by this SPEC.
3. **No provider-session memory dependency.** Every AI call this SPEC touches (`TurnUnderstandingInterpreter`, the TRR reasoning component) remains stateless per-call; `recentConversationContext` (§9) is ordinary, application-controlled, auditable input data supplied fresh on every call — never reliance on the AI provider's own hidden conversation continuity or caching. This is consistent with, not a violation of, CARF's own frozen *"no provider-session memory"* principle (`DUC_001_SPEC_v1.0.md §13`).
4. **Transcript is a context/provenance class, not an authority tier.** `recentConversationContext` is non-authoritative by construction — see §9 for the exact representation, which deliberately does not extend any existing authority-ranking vocabulary.

---

## 4. Existing Mechanisms — Unchanged

- **`lastClarificationRef`** (`js/ui/coachConversationPresenter.js:31`) remains exactly within its existing one-shot, in-memory, session-scoped contract. This SPEC does not persist it, does not generalize it, and does not merge it with `recentConversationContext`. Conversation persistence and CARF clarification correlation remain two separate mechanisms serving two separate purposes (§13).
- **`turnId` propagation by closure** (`DUC_001_SPEC_v1.0.md §14`) is unchanged — `submitCoachConversationTurn()` continues to hold `turn` as a closed-over local variable across the async call; persistence writes use this same closure-held `turnId`, never extracting it from anywhere downstream.
- **`DeliveryIntentContract`'s closed shape** (`js/coachDecisionSystem/deliveryIntentContract.js`) is untouched.
- **`SessionLifecycle.isCurrent()`** stale-session guards (`DUC_001_SPEC_v1.0.md §15` step 6) are unchanged and continue to govern rendering; this SPEC's persistence writes additionally respect them (§14).

---

## 5. Firestore Design

**Path:** `users/{uid}/coachConversation/{turnId}` — document ID is the turn's own `turnId` (already generated in `submitCoachConversationTurn()`, `'turn_' + Date.now().toString(36) + '_' + ...`), needing no separate identity field.

### 5.1 Persisted Schema (frozen)

```
{
  userText:      string,                       // the user's own submitted text, verbatim, ≤4000 chars
  assistantText: string | null,                 // the Delivery Intent's own renderedLanguage; null until/unless completed
  status:        'PENDING' | 'COMPLETED' | 'SILENCE',
  submittedAt:   number,                        // client timestamp, set at create, immutable thereafter
  completedAt:   <Firestore Timestamp> | null,   // server timestamp, set exactly once, at the PENDING->{COMPLETED,SILENCE} transition
  createdAt:     <Firestore Timestamp>            // server timestamp, set at create, immutable thereafter
}
```

**`semanticSignal` is NOT persisted in V1** (Product decision — not required for transcript rendering or bounded continuity; does not justify additional persisted schema).

### 5.2 Lifecycle (frozen, PRODUCT CORRECTION 2 applied — see §1 correction record)

`SILENCE` means exactly one thing: **the governed Coach pipeline ran to genuine completion and its own real, honest outcome was no response.** It is never a stand-in for "something went wrong." A technical/infrastructure failure is a categorically different condition from a governed decision not to respond, and this SPEC keeps them distinguishable in the persisted record, not merely in a code comment.

```
CREATE (on user submit):
  { userText, assistantText: null, status: 'PENDING', submittedAt, completedAt: null, createdAt: serverTimestamp() }

UPDATE — exactly two permitted transitions, both PENDING -> terminal, never reversible, and BOTH
require that the governed pipeline itself returned a well-formed result (summary.results
.coachDecisionSystem.status === 'SUCCESS' with a real, recognized `expression` object present) —
never attempted from a JS-level exception or an engine-level {status:'FAILED'} result:

  PENDING -> COMPLETED   when expression.status === 'DISPATCHED' AND expression.deliveryIntent is
                          present (a real Delivery Intent — RECOMMENDATION / INITIATIVE / BOUNDARY /
                          UNSUPPORTED all qualify; UNSUPPORTED is a real, honest, dispatched Delivery
                          Intent per DUC_001_SPEC_v1.0.md §12, not Silence)
                          -> { assistantText: deliveryIntent.renderedLanguage, status: 'COMPLETED', completedAt: serverTimestamp() }

  PENDING -> SILENCE     when the governed pipeline completed successfully (cdsResult.status ===
                          'SUCCESS') and expression is a real, recognized, non-dispatch, genuinely
                          GOVERNED outcome — expression.status is one of NO_DELIVERY_INTENT /
                          NOT_ATTEMPTED / SUPERSEDED (Case A/C/E of DUC_001_SPEC_v1.0.md §17; a
                          SUPERSEDED outcome is the D2-EF-07 pre-Expression supersession decision —
                          a real decision existed but was intentionally withheld because newer
                          corrective information superseded it, itself unreachable in production
                          today since no live correction-input channel exists yet, but a genuine
                          governed outcome by construction whenever it does occur) — i.e. the
                          pipeline genuinely ran and genuinely decided not to respond.
                          ABORTED is deliberately NOT a member of this set (Correction record,
                          above): every ABORTED reason is a technical/defensive Expression-stage
                          failure (rendering-context construction or Expression's own render
                          throwing), never a governed decision — it falls through to the
                          NO TRANSITION AT ALL case below, exactly like any other technical failure.
                          -> { assistantText: null (unchanged), status: 'SILENCE', completedAt: serverTimestamp() }

NO TRANSITION AT ALL (turn remains PENDING) when:
  - runUserMessageEngine(turn) throws / rejects (network, transport, or any uncaught exception), OR
  - summary.results.coachDecisionSystem.status !== 'SUCCESS' (an engine-level structural failure —
    e.g. CONTEXT_ASSEMBLY_FAILED — Memory Layer's own read failed before a Decision Pass could even
    form an outcome), OR
  - cdsResult.output.expression is missing/malformed (defensive — the pipeline did not produce a
    recognized outcome shape at all)
  In every one of these cases: the live Coach UI behaves exactly as it already does today (the
  existing catch block's bounded error message, or renderNoResponse() for a malformed-but-non-
  throwing result) — this correction changes ONLY what gets persisted, never what the user sees
  live. Item 7's existing ErrorTelemetry integration point (module:'COACH', operation:
  'DIRECT_TURN_PASS') fires unchanged. No FAILED/ERROR status is introduced in V1 — PENDING already
  correctly and sufficiently represents "submitted, without a successfully persisted governed
  completion," and is already excluded from the 6-turn reasoning-context window (§8) and already
  displays identically to a genuine SILENCE turn (§7) — there is no repository evidence that PENDING
  cannot safely carry this condition, so no new status value is warranted.
```

`userText`, `submittedAt`, `createdAt` are immutable after create — enforced at the Firestore Rules layer (§6), not merely by application discipline.

A turn that remains `status: 'PENDING'` indefinitely (whether from a genuine crash/close mid-flight, or from one of the technical-failure cases above) is, by the design above, already structurally identical in every downstream respect to how a `SILENCE` turn behaves for display and reasoning-context purposes — without ever being mislabeled as `SILENCE` in the persisted record itself. Truthfulness of the persisted `status` field is preserved exactly as Product requires: `SILENCE` always means a real governed decision; `PENDING` always means no successfully persisted governed completion exists yet, for any reason.

---

## 6. Firestore Rules Contract

```
match /coachConversation/{turnId} {
  allow read: if isSignedIn() && request.auth.uid == uid;

  allow create: if isSignedIn() && request.auth.uid == uid
    && request.resource.data.keys().hasOnly(['userText','assistantText','status','submittedAt','completedAt','createdAt'])
    && request.resource.data.userText is string && request.resource.data.userText.size() <= 4000
    && request.resource.data.assistantText == null
    && request.resource.data.status == 'PENDING'
    && request.resource.data.submittedAt is number
    && request.resource.data.completedAt == null
    && request.resource.data.createdAt == request.time;

  // The ONLY permitted mutation: PENDING -> {COMPLETED, SILENCE}, exactly once, with
  // userText/submittedAt/createdAt provably unchanged. No COMPLETED/SILENCE document may ever
  // be updated again (resource.data.status == 'PENDING' is a precondition on every allowed
  // update; once status leaves PENDING, this rule can never match that document again).
  allow update: if isSignedIn() && request.auth.uid == uid
    && resource.data.status == 'PENDING'
    && request.resource.data.status in ['COMPLETED', 'SILENCE']
    && request.resource.data.userText == resource.data.userText
    && request.resource.data.submittedAt == resource.data.submittedAt
    && request.resource.data.createdAt == resource.data.createdAt
    && request.resource.data.keys().hasOnly(['userText','assistantText','status','submittedAt','completedAt','createdAt'])
    && (request.resource.data.assistantText == null
        || (request.resource.data.assistantText is string && request.resource.data.assistantText.size() <= 4000))
    && request.resource.data.completedAt == request.time;

  // Owner-scoped, reset-flow only — never invoked by the persistence write path itself
  // (mirrors the just-closed js/repositories/errorLogRepository.js precedent exactly).
  allow delete: if isSignedIn() && request.auth.uid == uid;
}
```

No pre-existing rule (`users/{uid}`, `days/{day}`, `memories/{memoryId}`, `usage/{uid}`, `errorLog/{entryId}`) is touched or weakened.

---

## 7. Display History Contract

- Restore/display **up to the most recent 50 turns** (`PENDING`, `COMPLETED`, and `SILENCE` all included — a user's own unresponded statement remains visible history).
- Query: `.orderBy('createdAt', 'desc').orderBy(documentId(), 'desc').limit(50)` — the `documentId()` clause is a deterministic tie-breaker (see §1 cursor-stability correction record); served entirely by `createdAt`'s own existing single-field index, no manual Firestore Console configuration required.
- Rendered chronologically (oldest → newest) in the thread, exactly mirroring the live in-session rendering `coachConversationPresenter.js` already produces — a `SILENCE`/orphaned-`PENDING` turn renders as the user's own bubble with no assistant bubble, identical to today's live-session `renderNoResponse()` behavior.

---

## 8. Conversation Context Contract

- **Source pool — the durable continuity-admission invariant (Canonical Review correction, see §1):** a turn is eligible for this projection if and only if it reached a genuine governed terminal state — **`status !== 'PENDING'`**. This is expressed in terms of the repository's existing terminal-vs-`PENDING` primitive (§5.2), never as an enumerated `{COMPLETED, SILENCE}` allowlist, so that any future terminal status is correctly included by construction without this projection's own logic needing to be revisited. `PENDING` turns are excluded because that status already means "no successfully persisted governed completion exists yet" (§5.2) — there is no confidence the turn was genuinely processed at all. `COMPLETED` and `SILENCE` turns are both included, on equal footing, because both already represent a governed pipeline outcome that genuinely completed — they differ only in whether that completion produced a response, an axis this projection does not consult. **Binding distinction:** whether FITME responded (the `COMPLETED`/`SILENCE` distinction) is a different question from whether the user's own statement has conversational value for understanding subsequent turns (this projection's own question), which is a different question again from whether that statement should ever become durable User Knowledge (Item 6's own, entirely separate, future-governed path — unaffected by and unreachable through this projection; see §9's authority boundary). A `SILENCE` turn's `assistantText` remains `null` in this projection exactly as persisted — never fabricated, never backfilled.
- Bound 1 (turn count): the most recent **6** eligible turns (i.e. the 6 most recent turns with `status !== 'PENDING'`).
- Bound 2 (character count): a hard cap of **6,000 characters total**, summed across `userText.length + (assistantText ? assistantText.length : 0)` for every included turn — a `SILENCE` turn's `null` `assistantText` contributes exactly 0 to this sum.
- **Trimming algorithm (deterministic, no AI pass; candidate-acquisition method corrected — see §1 correction records):**
  1. Acquire candidate turns via deterministic, cursor-based pagination: read successive pages of turns ordered newest → oldest, tie-broken by document ID (`ConversationRepository.fetchRecent(uid, 10, cursor, cursorTurnId)`), advancing the two-part cursor by each page's oldest `(createdAt, turnId)` pair, filtering each page to `status !== 'PENDING'` only. Continue until either 6 eligible turns have been obtained, or a page returns fewer documents than requested (the collection has no older turns) — whichever comes first, with no other bound on how many pages may be read. The document-ID tie-breaker guarantees no turn is skipped or duplicated even when multiple turns share the exact same `createdAt` value (§1 cursor-stability correction record).
  2. Walk the obtained eligible (`status !== 'PENDING'`) candidates newest → oldest, accumulating a running character total; include a turn only if adding it keeps the running total ≤ 6,000.
  3. Stop including turns the moment the cap would be exceeded — **whole turns only, never a partially-truncated turn**.
  4. The included set is then presented in chronological order (oldest → newest) for the actual prompt/context payload, for natural reading order, even though selection walked newest-first.
- Both bounds are hard: never more than 6 turns, never more than 6,000 characters, regardless of which is reached first.
- No summarization, no embeddings, no vector search, no second AI pass — purely deterministic selection and concatenation of already-persisted, already-rendered text.

---

## 9. `recentConversationContext` — Memory Layer Projection and Authority Boundary (PRODUCT CORRECTION 1 applied — see §1 correction record)

**Exclusive assembler:** `js/coachDecisionSystem/memoryLayer.js`, inside `assembleContext(identity, currentUserTurn)`, following the exact same pattern every existing bounded projection there already uses (`readinessStateContext`, `userSafetyContext`, `explicitRequestControls`, etc.) — read-only, recompute-from-source on every Decision Pass, graceful degradation to `UNAVAILABLE` on any failure (D3 §12.3), never a cache, never persisted anywhere by Memory Layer itself. This satisfies D3 Decision 3 (*"No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context"*) — no other module reads `ConversationRepository` directly.

**Repository evidence consulted (per Product's explicit instruction to inspect the existing vocabulary before choosing a representation):** every existing Memory-Layer-assembled item carries `interpretationAuthority: 'DERIVED_INTERPRETATION'` — `situationalContext` (`memoryLayer.js:316`), `explicitRequestControls` (`:392`), `userSafetyContext` (`:446`), `activityPreference` (`:601`), `activityOppositionControls` (`:633`) — a **flat, single-value tag with no second value anywhere in the codebase**, meaning "this item's content was produced by an AI classifier's reading of a source record." Applying it to `recentConversationContext` would be **factually wrong**, not merely imprecise: transcript items are raw, verbatim, already-rendered text — no classifier interprets them to produce this projection. Separately, `readinessStateContext` (`:557-563`) already carries a **second, different, closed field** for exactly the concept Product is asking for — `provenance`, a source/context-kind tag (`'USER_STATED'` vs `'CURRENT_TURN'`, with `'MEASURED'`/`'DERIVED_INTERPRETATION'` reserved) — explicitly documented there as **not** an authority ranking, only a statement of *where the content came from*. That field's own closed vocabulary is TRR-001-owned and scoped specifically to `readinessStateContext`'s own items; this SPEC does not inject a new value into it. Instead, `recentConversationContext` reuses the **same naming convention and design pattern** — a small, closed, single-purpose `provenance` tag — as its own, independently-scoped field, never touching `readinessStateContext`'s own enum.

**Shape (final, corrected):**
```
recentConversationContext = {
  items: [ { turnId, userText, assistantText, submittedAt }, ... ],  // chronological, oldest->newest, per §8's bounds
  provenance: 'CONVERSATION_CONTEXT'   // a NEW, independently-scoped, single-value closed field on
                                        // THIS projection only — modeled on, never injected into,
                                        // readinessStateContext's own existing provenance tag.
                                        // `interpretationAuthority` is deliberately OMITTED from this
                                        // shape entirely (never set to any value) — that tag's one
                                        // real meaning across this codebase does not apply here, and
                                        // omitting it is a stronger, more honest signal than reusing
                                        // a label that would misleadingly imply AI classification
                                        // occurred.
}
availability: 'AVAILABLE' | 'UNAVAILABLE'  // present in pipelineContext.availability, matching every
                                            // existing field's own reporting convention exactly
```

**Why this is not a new authority tier:** (1) it is named `provenance`, matching this codebase's own existing word for "source-of-content" tagging — never named or framed as an authority/trust/confidence level, and never given a value implying a rank relative to any other tag; (2) it carries exactly **one** possible value — there is no scale, no ordering, nothing to rank; (3) no consuming code anywhere in this codebase, before or after this SPEC, ever branches on `interpretationAuthority` or `provenance` to decide what to trust — trust/authority boundaries in this architecture are enforced **structurally**, by which named top-level `pipelineContext` field a given piece of governance logic chooses to read (Safety reads `userSafetyContext`, never `recentConversationContext`) — never by an inline tag a reader could misuse as a gate. `provenance: 'CONVERSATION_CONTEXT'` is documentation/audit-readable, not a live authority mechanism, exactly like every other existing tag of this kind in the file.

**Authority boundary (frozen, explicit, restated in non-tier terms):** `recentConversationContext` is a context/provenance class, never an authority tier. It is never equivalent to, and never eligible to be promoted into, Typed Memory (`user_stated`/`migrated`/etc.), User Understanding projections (`activityPreference`, `explicitRequestControls`), Safety Context (`userSafetyContext`, `userSafetyProvenance`), or any confirmed/durable preference or fact — merely because a statement previously appeared in conversation, it gains no such standing. No component downstream of Memory Layer may treat an `items[]` entry as if it carried any of those authorities.

**Clarification (Canonical Review, §1) — admission grants no additional authority:** a turn's presence in `items[]` — including a `SILENCE` turn, admitted per §8's corrected invariant — establishes only that the statement was made and remains conversationally visible for reference/continuity resolution (§10.1). It does not, by itself or in combination with anything else in this projection, establish or imply: that the statement is true; that it has become durable User Knowledge or Typed Memory of any kind; that it carries User Knowledge status; that the user has consented to anything beyond the ordinary act of sending a chat message; that it carries Safety authority; or that it authorizes any action, mutation, or capability. Widening the source pool from `COMPLETED`-only to every non-`PENDING` status (§8) changes nothing about this boundary — a `SILENCE` turn gains conversational visibility only, exactly as a `COMPLETED` turn already did before it, never more.

---

## 10. Pipeline Integration

### 10.1 Turn Understanding (Classification) — additive extension

```
TurnUnderstandingInterpreter.classify(turn, recentConversationContext)
```
- **Additive third input only** — `TurnUnderstandingInterpreter`'s own closed, four-dimension **output** shape (`interpretationStatus`, `affirmativeRequest`, `currentStateStatement`, `negativeControlPresent`, `desireOnlyPresent`) is byte-identical, unchanged. `recentConversationContext` is `undefined` for every call that predates this SPEC's own test coverage — zero behavior change for any caller that doesn't supply it (mirrors `MemoryLayer.assembleContext(identity, currentUserTurn)`'s own established additive-second-parameter precedent, `DUC_001_SPEC_v1.0.md §11`).
- `buildPrompt()` gains one new, clearly-delimited block (mirroring the existing `<turn id="...">` per-record delimiting already used for injection-safety) presenting `recentConversationContext.items[]` as **DATA, never an instruction** — same defensive framing the existing prompt already applies to the current turn's own text.
- Purpose, frozen: resolve conversational references and intent continuity only — *"ומה לגבי היום?"*, *"ומה אם ישנתי יותר טוב?"*, *"אז עדיף לי לנוח?"*, *"ומה לגבי מה שאמרתי אתמול?"*, pronouns (*"זה"*, *"שם"*, *"אז"*). The classifier **must not** extract or emit any durable-memory-shaped output from this context — its own output schema has no field through which it could (the four-dimension shape has no free-text "facts learned" field), so this is enforced structurally, not merely by instruction.

### 10.2 Professional Reasoning — selective, domain-agnostic projection

`js/coachDecisionSystem/memoryLayer.js`'s `buildTrainingReadinessReasoningContext(pipelineContext, detectedOpportunity)` gains one additive field: `recentConversationContext: pipelineContext.recentConversationContext`. Because `recentConversationContext` lives on `pipelineContext` itself — assembled once, generically, exactly like `readinessStateContext`/`userSafetyContext` already are — **any future reasoning-context builder** (a Nutrition Conversation reasoning component, per the Item-4 integration plan) selectively re-projects the same shared field with zero new assembly logic. No TRR-specific conversation-history mechanism is created.

### 10.3 Safety Isolation (frozen)

`recentConversationContext` is never passed to `SafetyContextInterpreter.classify()`, `UserSafetyProvenanceInterpreter.classify()`, or `SafetyLayer.matchCanonicalSafetyRules()`/`finalReview()`. Safety's own current-turn behavior (§3 item 2) is entirely unchanged by this SPEC — it continues to see only `Candidate.actionIdentity` and durable `userSafetyContext`/`userSafetyProvenance`, exactly as today.

---

## 11. Fail-Open Persistence Behavior

- **CREATE (PENDING) failure:** the Coach turn continues normally — classification, reasoning, Safety, Expression, and rendering are entirely unaffected by a failed create. Reported via Item 7's existing `ErrorTelemetry.report({code, module:'COACH', operation:'PERSIST_TURN_CREATE'})` — no `message` (same conservative choice already made for the existing `DIRECT_TURN_PASS` integration point, §3 item 2 of Item 7's own closed contract).
- **UPDATE (completion) failure** (the Firestore write itself rejects, distinct from a governed-pipeline failure — see §5.2): the response still renders in the current live session (rendering is driven by the in-memory Delivery Intent, never by a successful Firestore write); the document correctly remains `PENDING` in Firestore (the update simply never landed) — consistent with, not a special case of, §5.2's own truthful-`PENDING` semantics. Reported via the same `ErrorTelemetry.report({..., operation:'PERSIST_TURN_COMPLETE'})`.
- **Governed-pipeline technical failure** (§5.2's "NO TRANSITION AT ALL" case): not a persistence failure at all — no write is ever attempted, by design, because there is nothing truthful yet to write. The live Coach UI is unaffected (existing bounded error behavior, unchanged); Item 7 telemetry fires at the existing `DIRECT_TURN_PASS` integration point, unchanged.
- No automatic retry system for V1 (Product decision, explicit).
- Every write in this SPEC is fire-and-forget from the perspective of the governed pipeline — the pipeline's own success/failure is never gated on a persistence write succeeding.

---

## 12. Lifecycle — Full Summary

| Event | Behavior |
|---|---|
| Submit | Renders immediately (unchanged); fires a fail-open `PENDING` create |
| Coach completes (real Delivery Intent) | Renders (unchanged); fires a fail-open `PENDING -> COMPLETED` update |
| Governed Silence (pipeline completed, genuinely no response) | Pending bubble removed (unchanged); fires a fail-open `PENDING -> SILENCE` update |
| Technical failure / exception (§5.2) | Existing bounded error behavior (unchanged); **no status transition attempted** — turn remains `PENDING`; Item 7 telemetry fires |
| Initial load / reload | Fetch + render up to 50 most recent turns (§7); empty state if none |
| Cross-device | Works automatically — same owner-scoped Firestore read, no new mechanism |
| Sign-out | Clears the currently-rendered in-memory thread (a real, currently-missing gap — `coachConversationPresenter.js` gains a `SessionLifecycle.registerCleanup('coachConversation', ...)` mirroring `js/memory.js`'s own precedent exactly); Firestore history is preserved, untouched |
| Reset/delete | `ConversationRepository.deleteAllForUser(uid)` — same batched query-then-delete pattern as the just-closed `ErrorLogRepository.deleteAllForUser()` — called from `resetApp()` before the profile-document delete; no orphaned transcript documents survive |
| Persistence failure | §11 — Coach remains fully usable regardless |

---

## 13. Non-Goals (explicit)

No summarization of older/trimmed-out conversation. No embeddings. No semantic/vector search. No vector storage. No second AI summarization pass. No inference of long-term/durable memory from transcript by this SPEC's own mechanisms (that path is Item 6, unaffected). No TRR-specific or domain-specific history system — the projection is domain-agnostic by construction (§10.2).

---

## 14. Engineering Readiness Verification

Verified against current repository primitives (`a0c69d01fde4389e75fa2541ecff40a78b85f62f`) before freezing the above as implementable:

- **New Firestore repository:** directly follows `js/repositories/errorLogRepository.js`'s own just-closed template (`configure({db, serverTimestamp})`, `create()`, `deleteAllForUser()`) — no new pattern required.
- **StateAccess wiring for the new read:** `js/stateAccess.js`'s `PERMISSIONS` table already has a precedented capability-holder identity for exactly this shape of read — `memoryLayer.USER_STATED_MEMORY_READ` (`js/stateAccess.js:477-482`), itself wired via a single injected `deps.fetchUserStatedMemory` function (`js/app.js:2211`, `fetchUserStatedMemory: function () { return FitMeMemory.list(); }`, inside the single `StateAccess.configure({...})` call). A mirrored `memoryLayer.RECENT_CONVERSATION_READ` capability-holder identity, backed by one new injected `deps.fetchRecentConversation` function calling into `ConversationRepository`, is a direct structural copy of an already-proven, already-approved mechanism — no contradiction, no new primitive required.
- **`MemoryLayer.assembleContext()` extension:** already accepts an additive second parameter (`currentUserTurn`) per DUC-001's own precedent; adding one more `try/catch`-wrapped, gracefully-degrading read block, identical in shape to the ~10 that already exist there, is directly consistent with the file's own established internal structure.
- **`TurnUnderstandingInterpreter.classify()` additive third input:** its own `buildPrompt()` already demonstrates the exact per-record delimiting/defensive-framing technique (`<turn id="...">...</turn>`) this SPEC's new context block reuses; its `partitionIntoBatches()`/output-validation machinery is untouched (only the prompt text changes, not the response contract).
- **Firestore Rules — constrained state-transition enforcement:** directly expressible with standard Rules primitives (`resource.data.X == request.resource.data.X` for immutability, `resource.data.status == 'PENDING'` as an update precondition, `request.resource.data.status in [...]` for the closed target set) — the same rule-writing techniques already used for `errorLog`'s own allowlist enforcement (Item 7, just closed).
- **Query bound:** `.orderBy('createdAt','desc').limit(N)` is a single-field query, auto-indexed by Firestore by default — no manual composite-index configuration step is required for either the 50-turn display fetch or a (smaller) 6-turn context fetch.

**No repository contradiction was found against any of the 24 frozen decisions listed in Product's own review.** Every mechanism this SPEC requires has a direct, already-approved, already-implemented structural precedent elsewhere in the codebase.

---

## 15. Testing Requirements (for the implementation phase)

- `ConversationRepository`: create/update/deleteAllForUser Firestore-wrapper unit tests, mirroring `tests/errorLogRepository.test.js`'s own fake-db convention.
- Firestore Rules: static structural tests mirroring `tests/errorTelemetry.test.js`'s own `firestore.rules` text-verification pattern (§I precedent) — confirm the exact create/update/delete conditions, the immutable-field checks, and that no COMPLETED/SILENCE document can be further updated.
- `TurnUnderstandingInterpreter`: contract tests proving the additive `recentConversationContext` parameter changes only the prompt content, never the output shape; proving `undefined` behaves identically to the pre-SPEC contract (backward compatibility).
- `MemoryLayer`: a new test proving `recentConversationContext` degrades to `UNAVAILABLE` gracefully on a read failure, never blocking the Decision Pass; proving `PENDING` turns are excluded from the assembled `items[]` while `SILENCE` turns are included on equal footing with `COMPLETED` turns (Canonical Review correction, §8); proving a mixed `COMPLETED`/`SILENCE` history correctly obeys both the 6-turn and 6,000-character bounds; proving a `SILENCE` item's `assistantText: null` survives into `items[]` unchanged and contributes exactly 0 characters to the budget; proving the pagination/cursor/tie-breaking behavior is unaffected by the wider admission rule.
- End-to-end: a governed-pipeline test proving `recentConversationContext` is never threaded into `SafetyContextInterpreter`/`UserSafetyProvenanceInterpreter`/`SafetyLayer` call sites (a static "never-called-with" assertion, mirroring how Item 7's own tests proved certain fields never enter certain call sites).
- Lifecycle: sign-out clears the in-memory thread; reset deletes the subcollection before the profile document (mirrors `tests/errorTelemetry.test.js`'s own `resetApp()` ordering test).
- **§5.2 Correction 2 specifically:** a test proving a JS-level exception from `runUserMessageEngine()` never triggers a `PENDING -> SILENCE` (or any) update call; a test proving `summary.results.coachDecisionSystem.status !== 'SUCCESS'` never triggers a status transition either; a test proving only a real, recognized non-dispatch, genuinely-governed `expression.status` (with `cdsResult.status === 'SUCCESS'`) triggers `PENDING -> SILENCE`.
- **Canonical Review corrections specifically:** a test proving `ABORTED` never triggers `PENDING -> SILENCE` (it falls through to the "no transition" case, staying `PENDING`); a test proving `SUPERSEDED` now does trigger `PENDING -> SILENCE`, using a mocked/forced supersession condition (the real trigger remains unreachable in production, per §5.2).

---

## 16. Closure Boundary

This SPEC governs CCC-001 V1 only — the bounded persistence + bounded continuity capability described above. It does not authorize, anticipate, or reserve: summarization, embeddings, cross-conversation search, a general memory system, or any Nutrition-Conversation-specific work (Item 4 remains its own, separately-SPECed vertical, which may *reuse* `recentConversationContext` per §10.2 without requiring any change to this document).
