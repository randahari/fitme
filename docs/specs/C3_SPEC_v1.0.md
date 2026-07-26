# C3_SPEC v1.0 — Event Model Decision

**Status:** CANONICAL SPECIFICATION — APPROVED FOR IMPLEMENTATION
**Governs:** The behavioral-event surface currently held in `users/{uid}.coachEvents[]` — its canonical classification, its retained schema, and its retention policy.
**Applies Canonical Decisions:** CD-C3-01 through CD-C3-12 (this document, §7)
**Input:** `C3 Event Model Architecture Discovery Report` (this repository, current session record; repository baseline commit `b39fa05`, app version `2.41.0`) — Discovery is input only; this document is the canonical specification.
**Preserves:** B1 (canonical memory/authority model), B2 (Engine Registry contract — unchanged wiring), B3 (StateAccess boundary — unchanged, no capability added or removed), B4 (Persistence Gateway closed catalog — unchanged, no operation added or removed), B5 (DerivedIntelligenceConsumer — untouched), C1 (module layout), C2 (Rejection and Suppression Feedback — `RECOMMENDATION_FEEDBACK_RECORD`, `FeedbackDomain.evaluateSuppression`, and all Dismissed/Accepted behavior are preserved byte-for-byte in observable effect)

---

## 1. Executive Summary

C3 answers the remediation question opened by Finding F7 and closed by the C3 Discovery Report: *should the existing `coachEvents` concept become a real, bounded architectural input with an explicit contract, or should some or all of it be retired?*

C3 is an **event model decision**, not a Trigger Engine, Persistence Gateway, or StateAccess implementation task. It draws the canonical boundary of what counts as a *behavioral event* in FITME going forward: the recommendation-feedback family (`kind:'feedback'`, introduced by C2) is the canonical event model, formalized here with an explicit, closed, versioned entry schema (an **Event Kind Catalog**). The ordinary Trigger-fired record family (written by the pre-existing `recordCoachEvent`/`TRIGGER_RECORD_EVENT` path since Stage 5, v2.10.0) is **removed from the canonical event model** and reclassified as legacy bookkeeping — it is not an event under this SPEC, no new architectural consumer may ever be built against it, and its schema is frozen as a read-only historical shape. Whether its producer keeps running, is deprecated, or is removed later is an **implementation-strategy question intentionally left outside C3** — this SPEC neither mandates nor forbids continuing to write it; it only forbids treating it as a canonical event or building new consumption against it.

No Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry code is added, deleted, or refactored by this SPEC. No new persistence surface, Firestore field, collection, engine, or memory model is introduced. `coachEvents` remains exactly where it is, governed exactly as it already is by the existing Persistence Gateway and StateAccess layers.

Three things fall out of this decision: (1) a canonical classification — ordinary Trigger-fired records are legacy bookkeeping, not events; (2) a closed, versioned Event Kind Catalog governing the shape of any entry that *is* written under the canonical `feedback` kind; (3) a retention **policy** — feedback evidence has retention priority over legacy bookkeeping — stated as policy only, with its implementation mechanism intentionally left to engineering. Several Discovery findings (C3-F01 concurrency, C3-F04 delivery/open tracking, C3-F05/F06/F07/F08/F09) are recorded as accepted, unresolved-by-C3 limitations, each requiring its own future, separately-approved task if ever remediated.

## 2. Problem Statement

Since Stage 5 (v2.10.0), every Trigger firing — in-app card, post-workout credit, or local notification — has appended an entry to `userProfile.coachEvents`, described in the codebase's own comments as "the raw material the memory layer will eventually infer patterns from." No consumer for these entries was ever built. C2 (v2.41.0) extended the same array with a second, structurally different, actively-consumed record family (`kind:'feedback'`) without resolving the first family's status, per its own explicit scope limit (C2_SPEC §4: "no canonical event-bus decision (remains C3's)"). The C3 Discovery Report confirmed, with direct repository evidence, that this left `coachEvents` holding two record families sharing one untyped array and one retention cap, with no schema discipline, no cross-check between the cap and C2's own suppression-window assumptions, and a fully orphaned producer. This SPEC resolves the *model* question — what is canonically an event, and how is it schemed and retained — without prescribing changes to the Trigger Engine or the persistence machinery that already exists.

## 3. Goals

1. Formally classify the ordinary Trigger-fired record family as outside the canonical behavioral-event model — legacy bookkeeping, not an event — and close the door on any new architectural consumer being built against it. Whether its producer continues, is deprecated, or is removed is explicitly left as an implementation-strategy question outside C3 (§10, §19).
2. Give the canonical (feedback) event family an explicit, closed, versioned entry schema — an Event Kind Catalog — so that "event" in `coachEvents` stops being an informal, `kind`-optional convention (§15, §16).
3. State a retention **policy** — feedback evidence has retention priority over legacy bookkeeping — closing the unanalyzed interaction the Discovery Report identified between the cap and C2's suppression-window assumptions, without prescribing a retention mechanism (§18).
4. Record, permanently and explicitly, every Discovery finding this SPEC does **not** resolve, so future engineering work does not need to rediscover them (§25).
5. Do all of the above without introducing a new engine, memory model, event model, persistence surface, Firestore field/collection, Firestore Rule, or B1–B5/C1/C2 contract change, and without deleting, refactoring, or otherwise modifying any existing Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry code.

## 4. Non-Goals

- No Recommendation/Initiative/Decision Engine.
- No change to Habit/Pattern detection algorithms, C2's `FeedbackDomain.evaluateSuppression` contract, `TriggerDomain.canFire`, or any trigger-evaluator condition function.
- No change to `coachDay` / `TRIGGER_UPDATE_BUDGET` (the Trigger daily budget/dedup tracker) — explicitly out of scope; it is operational state, not part of the event model (§8).
- **No removal of `TRIGGER_RECORD_EVENT` from the Persistence Gateway catalog. No removal of any StateAccess capability. No change to `TriggerController`, `TriggerEngineAdapter`, or Engine Registry wiring. No change to Trigger runtime behavior of any kind.** The disposition of the ordinary Trigger-fired producer (keep, deprecate, or remove) is an implementation-strategy question intentionally left outside this SPEC (§10, §19).
- No transactional/CAS rewrite of `RECOMMENDATION_FEEDBACK_RECORD`'s (or `TRIGGER_RECORD_EVENT`'s) write mechanics — C3-F01 is recorded as an accepted limitation, not remediated here (§25.1).
- No Firestore Rules change, no server-side validation of event content or timestamps — C3-F07 is recorded as an accepted limitation (§25.2).
- No notification delivery/open instrumentation, no change to `scheduleLocalNotifications`'s scheduling mechanics or the Notification Adapter — C3-F04 is recorded as an accepted limitation (§25.3).
- No change to B4's owner model, to the `SYSTEM_METADATA` domain/`requiresAuthority:false` classification of feedback events, or to the idempotency ledger's in-memory-only lifetime — C3-F05/F06/F08 are recorded as accepted, unchanged (§25.4–§25.6).
- No exact per-instance correlation mechanism between a recommendation presentation and its feedback — grouped `(surface, contextId)` evidence, as C2 already implements, remains permanently sufficient (§21).
- No Event Bus, no Event Sourcing, no new typed-memory (`users/{uid}/memories`) write path (unchanged, remains C4's).
- No redesign of the Trigger Engine's evaluation/selection/budget logic, the Adaptive TDEE Engine, or Memory (`js/memory.js`).
- No mandatory retention mechanism, algorithm, or helper function — retention is stated as policy only (§18); its implementation is intentionally left to a future engineering task.

## 5. Scope

**In scope:**
- Canonical classification: the ordinary Trigger-fired record family is removed from the canonical event model and reclassified as legacy bookkeeping (§8, §16).
- Definition of a closed Event Kind Catalog for the canonical (feedback) event family (§15, §16).
- A producer-side validation requirement on newly-appended feedback entries, applicable only to the feedback family (§17).
- A retention *policy* statement — feedback evidence has priority over legacy bookkeeping within the existing cap (§18).
- Explicit, permanent documentation of unresolved Discovery findings (§25).

**Not in scope:** any change to `TRIGGER_RECORD_EVENT`, any Persistence Gateway operation, any StateAccess capability, `TriggerController`, `TriggerEngineAdapter`, Engine Registry wiring, `coachDay`/`TRIGGER_UPDATE_BUDGET`; `RECOMMENDATION_FEEDBACK_RECORD`'s write mechanics, owner, domain, or authority classification; any Firestore Rules file; `js/memory.js`; any Trigger-evaluator condition function; any Adaptive TDEE Engine behavior; any future Recommendation Engine; any retention *mechanism* or algorithm.

## 6. Repository and Document Baseline

- **Branch:** `main` · **Commit at Discovery:** `b39fa05` · **App version:** `2.41.0`
- **Test baseline at Discovery:** `1044` passed / `0` failed (`node --test tests/*.test.js`)
- **Prior canonical documents governing this SPEC:** `FITME_ARCHITECTURE_v1.md`, `docs/specs/C2_SPEC_v1.1.md` (CLOSED), `docs/specs/C1_SPEC_v1.0.md` (CLOSED), `docs/tasks/B5/B5_SPEC_v1.0.md` (CLOSED), `FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1.0.md` (Finding F7), `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`
- This SPEC assumes the repository state described in the C3 Discovery Report as its factual starting point and does not re-verify it line-by-line.

## 7. Canonical Decisions Applied (CD-C3-01 – CD-C3-12)

1. **CD-C3-01.** `coachEvents` is retained as a bounded behavioral-outcome journal. The canonical event model is narrowed to the feedback family. This is the direct, approved answer to Finding F7's central question. No Event Bus, no Event Sourcing, no new persistence surface.
2. **CD-C3-02.** The ordinary Trigger-fired record family (`recordCoachEvent` / `TRIGGER_RECORD_EVENT`) is removed from the canonical event model and reclassified as **legacy bookkeeping**. No new architectural consumer may be introduced for it. Its schema is frozen as a read-only historical shape (§16). Whether its producer continues to run, is deprecated, or is removed later is an implementation-strategy question **intentionally left outside C3** — this SPEC neither requires nor forbids any change to the producer, `TriggerController`, `TriggerEngineAdapter`, or any Persistence Gateway/StateAccess entry associated with it.
3. **CD-C3-03.** `coachDay` / `TRIGGER_UPDATE_BUDGET` is explicitly outside the event model's scope and is unaffected by this SPEC in any respect.
4. **CD-C3-04.** Every entry written under the canonical `feedback` kind MUST carry an explicit `kind` value from the Event Kind Catalog (§15). Legacy entries remain valid, permanently readable, historical data regardless of this requirement — it governs only the canonical event family.
5. **CD-C3-05.** The Event Kind Catalog is closed, with exactly one active value (`feedback`) as of this SPEC. Extending it to a second kind requires a future SPEC revision — the same closure discipline already established by B4's `OPERATIONS` catalog and C2's `FEEDBACK_TYPES` vocabulary.
6. **CD-C3-06.** Feedback evidence has retention priority over legacy bookkeeping records within the existing cap. This is a **policy** statement only; no retention mechanism, algorithm, or helper function is specified or required by this SPEC (§18).
7. **CD-C3-07.** The non-transactional write mechanics of `RECOMMENDATION_FEEDBACK_RECORD` (and `TRIGGER_RECORD_EVENT`) are explicitly not changed by this SPEC. C3-F01 (concurrent-write risk) is recorded as a known, accepted architectural limitation (§25.1); remediation, if ever pursued, requires a separate, future, explicitly-approved task.
8. **CD-C3-08.** B4's owner model is unchanged: `coachEvents` remains writable under both `triggerState` and `profileGoalsState`, exactly as C2 established. C3 does not redefine "owner" (§25.4).
9. **CD-C3-09.** The `SYSTEM_METADATA` domain and `requiresAuthority:false` classification of feedback events, established by C2, is unchanged (§25.5).
10. **CD-C3-10.** No Firestore Rules change and no server-side validation of `coachEvents` content or timestamps is introduced. C3-F07 is recorded as a known, accepted limitation (§25.2).
11. **CD-C3-11.** No notification delivery/open instrumentation is introduced. `Expired` remains reserved, valid, unproduced vocabulary exactly as C2 left it (§25.3).
12. **CD-C3-12.** Exact per-instance correlation between a specific recommendation presentation and its resulting feedback is explicitly not required and not introduced. Grouped `(surface, contextId)` evidence remains permanently sufficient for this SPEC's scope (§21).

## 8. Event Model

**Canonical definition (this SPEC, binding going forward):** a *durable behavioral event* in FITME is an entry appended to `users/{uid}.coachEvents[]` whose shape conforms to a value in the Event Kind Catalog (§15) — as of this SPEC, exactly the `feedback` kind. This is the entire canonical event model. The following are explicitly **not** durable behavioral events, regardless of informal naming in code or comments, and are out of this model's scope:

- **Ordinary Trigger-fired records** (`{type, date, ts, meta}`, no `kind` field, produced historically by `recordCoachEvent`/`TRIGGER_RECORD_EVENT`) — reclassified by this SPEC as **legacy bookkeeping**, not events (CD-C3-02). No new architectural consumer may treat these as events or be built against them, regardless of whether the underlying producer continues to run.
- `EngineRunRequest.trigger`/`.actions` values (`APP_READY`, `AUTH_SESSION_READY`, `SOURCE_DATA_CHANGED`, `MANUAL`, and engine actions such as `WORKOUT_COMPLETED`, `LOCAL_NOTIFICATION_SCHEDULE`, `DAILY_COACH_CHECK`, `ADAPTIVE_CHECK`) — these are ephemeral orchestration signals, constructed fresh per `EngineRegistry.run()` call and never persisted (B2, unchanged).
- `coachDay` (`{date, fired[], count}`) — operational dedup/budget state, not an event (CD-C3-03).
- Browser/service-worker `push`/`notificationclick` events (`sw.js`) — DOM/platform events, never durable, never linked to `coachEvents` (C3-F04, §25.3, unchanged by this SPEC).
- Habit/Pattern Derived Intelligence Views — recomputed state, not accreted events (B1, unchanged).
- `users/{uid}/memories/{id}` typed memory records — a separate canonical domain (C4's, unchanged).

This resolves the naming collision identified in the Discovery Report §3: only `coachEvents` entries conforming to §15's catalog are "events" in the canonical sense this SPEC governs; ordinary Trigger-fired records are bookkeeping, whatever their future.

## 9. Architecture Overview

No new engine, no new memory model, no new event model, no new persistence model — reaffirmed, per CD-C3-01/CD-09. No Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry code changes — reaffirmed, per §4.

```
UI gesture (Trigger card dismiss / Adaptive TDEE apply|dismiss)
   → Controller (TriggerController / AdaptiveTdeeController)          [UNCHANGED — C2]
        → StateAccess.write.recordRecommendationFeedback(...)         [UNCHANGED — C2]
             → PersistenceGateway.persist({op:'RECOMMENDATION_FEEDBACK_RECORD', ...})   [UNCHANGED]
                  → field-scoped merge into coachEvents[] (EXISTING durable surface, UNCHANGED)

Suppression consultation (read path — UNCHANGED, C2):
TriggerController.runCoachTriggers() / AdaptiveTdeeController.runAdaptiveCheck()
   → StateAccess.read.recommendationFeedbackHistory()
        → FeedbackDomain.evaluateSuppression(events, surface, contextId, now)

Ordinary Trigger-fired records (UNCHANGED code path, RECLASSIFIED status only):
TriggerController.runCoachTriggers() / fireWorkoutTrigger() / scheduleLocalNotifications()
   → StateAccess.write.recordTriggerOutcome(...)   [UNCHANGED — still present, still callable]
        → PersistenceGateway.persist({op:'TRIGGER_RECORD_EVENT', ...})   [UNCHANGED]
             → field-scoped merge into coachEvents[]   [UNCHANGED]
   ── entries produced here are legacy bookkeeping (§8) — no consumer, none permitted ──
```

## 10. Affected Components

This SPEC affects **canonical classification and schema documentation only** — no source file requires modification as a consequence of this SPEC. The following are affected in the sense of being formally governed by this SPEC's canonical decisions, without any mandated code change: the conceptual status of ordinary Trigger-fired `coachEvents` entries (reclassified as legacy bookkeeping, §8); the schema of the canonical `feedback` event family (formalized as a closed, versioned catalog, §15); the retention priority of feedback evidence relative to legacy bookkeeping (stated as policy, §18). Where and how the Event Kind Catalog is represented in code, if and when engineering chooses to represent it explicitly, is an implementation detail outside this SPEC's mandate.

## 11. Unaffected Components

`js/engineRegistry.js` (wiring unchanged), `js/trigger/triggerDomain.js` (all evaluators, `canFire`, `selectTrigger`, `triggerLocalText`), `js/trigger/triggerController.js` (`runCoachTriggers`, `fireWorkoutTrigger`, `scheduleLocalNotifications` — all unchanged, including their existing `recordTriggerOutcome` calls), `js/engines/triggerEngineAdapter.js` (all three action branches unchanged), `js/stateAccess.js` (every read/write capability, including `recordTriggerOutcome`, and every `PERMISSIONS` grant, unchanged), `js/persistenceGateway.js` (every operation in the closed catalog, including `TRIGGER_RECORD_EVENT`, unchanged), `js/adaptive/adaptiveTdeeController.js` and `js/adaptive/adaptiveTdeeDomain.js`, `js/memory.js`, `js/derivedIntelligenceConsumer.js` and its policy catalog, `js/engines/habitEngine.js`, `js/engines/patternEngine.js`, `js/engines/adaptiveTdeeEngineAdapter.js`, `js/engines/registerEngines.js`, `firestore.rules`, `functions/index.js`, `FeedbackDomain.classifyFeedback`/`FeedbackDomain.evaluateSuppression`/`FeedbackDomain.FEEDBACK_TYPES`/`FeedbackDomain.RECOVERY_POLICIES`, `RECOMMENDATION_FEEDBACK_RECORD`'s owner, domain, authority requirement, and idempotency-key granularity.

## 12. Ownership Model

Unchanged from B3/B4/C2 (CD-C3-08). `coachEvents` remains writable under two owner identifiers depending on originating surface: `triggerState` (Trigger surface feedback, and ordinary Trigger-fired bookkeeping) and `profileGoalsState` (Adaptive TDEE surface feedback). `coachDay` remains solely owned by `triggerState` via `TRIGGER_UPDATE_BUDGET`, untouched. This SPEC does not introduce, remove, or redefine any owner identifier, operation, or capability.

## 13. StateAccess Contract

**No StateAccess contract change.** Every read operation (including `recommendationFeedbackHistory`) and every write operation (including `recordRecommendationFeedback`, `updateDailyTriggerBudget`, and `recordTriggerOutcome`) remains exactly as approved by B3/C2. No capability is added, removed, or reassigned. No permission-matrix entry is changed. No generic `get(path)`/`set(path)` is introduced. `recordTriggerOutcome`'s continued presence in the catalog is consistent with CD-C3-02: its producer's disposition is an implementation-strategy question outside this SPEC, and the capability existing does not make its output a canonical event.

## 14. Persistence Gateway Contract

**No Persistence Gateway contract change.** `TRIGGER_RECORD_EVENT` remains in the closed `OPERATIONS` catalog, unchanged, alongside `DERIVED_HABITS_REPLACE`, `DERIVED_PATTERNS_REPLACE`, `DERIVED_ADAPTIVE_PROPOSAL_APPLY`, `TRIGGER_UPDATE_BUDGET`, `SOURCE_HISTORY_SAVE_DAY`, and `RECOMMENDATION_FEEDBACK_RECORD`. `listOperations()` continues to return all seven operations, unchanged. `RECOMMENDATION_FEEDBACK_RECORD`'s owner list, domain, `requiresAuthority:false`, `requiresIdempotencyKey:true`, `conflictPolicy:'NONE'`, `retryPolicy:'TRANSIENT_ONLY'`, and its `validateTriggerEventPayload` structural payload validator are all unchanged. This SPEC's Event Kind Catalog (§15) and retention policy (§18) are enforced conceptually above the Gateway (at the level of what a producer constructs), not inside it — the Gateway's closed-catalog validation contract is unaffected.

## 15. Event Kind Catalog and Data Model

This SPEC defines a closed **canonical event vocabulary** — the set of `kind` values that may ever be treated as a durable behavioral event under §8. As of this SPEC, the vocabulary contains exactly one member: `feedback`.

**Versioning rule (canonical):** the schema associated with a given `kind` is versioned. The `feedback` kind's schema, as defined by this SPEC, is version 1 (§16). A future addition to the vocabulary, or a breaking change to an existing kind's schema, requires a future SPEC revision — the same closure discipline already established by B4's `OPERATIONS` catalog and C2's `FEEDBACK_TYPES` vocabulary. This is a statement about what is canonically permitted, not a prescription of a runtime registry, object, or registration mechanism.

This SPEC does not prescribe how, where, or whether engineering represents this vocabulary or its versioning rule as a concrete code artifact — that choice, including whether any such artifact exists at all, is entirely an implementation detail outside this SPEC's mandate.

**Physical storage (unchanged):** `users/{uid}.coachEvents[]`, capped at `COACH_EVENTS_CAP = 200` (unchanged value), same Firestore document, same field, no new collection.

## 16. Event Schema

**Canonical schema — `feedback` kind, version 1 (the only canonical event under this SPEC).** The following fields are canonically required on any entry recorded under this kind:

| Field | Required value / vocabulary | Meaning |
|---|---|---|
| `kind` | `'feedback'` | Canonical vocabulary discriminator (§15) |
| `surface` | `'trigger'` \| `'adaptiveTdee'` | Which recommendation surface produced the entry |
| `contextId` | string (a trigger type string, or the fixed literal `'adaptive-proposal'`) | Grouped-context identifier (§21) |
| `feedbackType` | one of `Accepted`, `Completed`, `Dismissed`, `Rejected`, `Ignored`, `Expired`, `UserCorrected`, `UserConfirmed` | CD-04 closed vocabulary (C2, unchanged) — only `Accepted`/`Dismissed` have a producer today |
| `date` | string, `'YYYY-MM-DD'` | Calendar day of the feedback event |
| `ts` | number | Point-in-time marker, client-supplied (C3-F07, §25.2, unchanged) |

This table states what the schema requires; it does not prescribe a data structure, object shape, or code representation for enforcing it.

**Legacy schema — outside the canonical event model (CD-C3-02).** Records of this shape are not governed by the versioning rule in §15; they are documented here only so their historical shape is on record:

| Field | Meaning |
|---|---|
| `type` | Trigger type, or `'workout-logged'` |
| `date` | Calendar day |
| `ts` | Point-in-time marker |
| `meta` | Small structured payload, e.g. `{burn}`, `{via:'notification'}`, `{sig,calc}`, `{streak}` |

Entries of this shape carry no `kind` field, and its absence is the discriminator (unchanged, per C2's existing `readRecommendationFeedbackHistory` filter). Whether new instances of this shape continue to be written is an implementation-strategy question intentionally left outside C3 (CD-C3-02); regardless of whether production continues, entries of this shape are not canonical events under this SPEC, and no new consumer may be built to read them as such.

## 17. Validation Rules

**Existing Gateway structural validation** (`RECOMMENDATION_FEEDBACK_RECORD.payloadValidator`, unchanged): `Array.isArray(payload.coachEvents)` only. This validates the *whole array being persisted*, which by construction may contain a mix of legacy and feedback elements — it remains permissive of the legacy shape. This SPEC changes nothing about this existing validation.

**Canonical schema-conformance requirement:** any entry recorded under the `feedback` kind is, by definition, required to contain every field listed in §16 with `kind` equal to `'feedback'`. This is a statement about what a conforming entry *is*, not a prescription of where, how, or by which code path that conformance is checked or enforced. It applies only to the canonical event family, is a property of the schema itself rather than of existing array contents, and does not apply to the legacy family.

No validation is added at the Firestore Rules layer (CD-C3-10, §25.2).

## 18. Retention Policy

`COACH_EVENTS_CAP` remains **200** (unchanged value, CD-C3-06). This SPEC states a retention **policy**, not a retention mechanism:

- **Feedback evidence has retention priority over legacy bookkeeping records** within the existing cap. When the array must be trimmed to stay within `COACH_EVENTS_CAP`, legacy (non-`feedback`) entries are the intended first candidates for eviction, ahead of canonical `feedback` entries.
- **Suppression evidence must be preserved for its intended policy window.** Any future implementation of this policy must ensure that `feedback` entries relevant to an active `RECOVERY_POLICIES` window (§13/§18 of C2_SPEC v1.1) are not evicted ahead of legacy bookkeeping records that carry no such policy relevance.
- **The implementation mechanism is intentionally unspecified.** This SPEC does not mandate an algorithm, a helper function, a tiering scheme, or any specific code change to achieve this policy. How (or whether, and when) this priority is engineered into the existing truncation behavior is left entirely to a future engineering task.

This closes the unanalyzed interaction the Discovery Report identified between the 200-entry cap and C2's 14-day suppression window (C3-F03) at the policy level; it does not, by itself, change any runtime behavior.

## 19. Runtime Behavior

**No Trigger Engine runtime behavior change is required or introduced by this SPEC.** `TriggerController.runCoachTriggers`, `fireWorkoutTrigger`, `scheduleLocalNotifications`, and `TriggerEngineAdapter`'s three action branches continue to operate exactly as they do today, including their existing calls to `access.write.recordTriggerOutcome`. Trigger selection, suppression filtering (`FeedbackDomain.evaluateSuppression`), budget/dedup tracking (`canFire`, `coachDay`), and card presentation are all unaffected by this SPEC. `AdaptiveTdeeController.applyAdaptiveUpdate`/`dismissAdaptiveUpdate`, `ensureTriggerCardDismissButton`, and `recordRecommendationFeedback` are likewise unaffected.

## 20. Error Handling and Failure Reporting

No new failure code is introduced. No existing failure code, reporting shape, or rollback/snapshot behavior is changed. `recordFeedbackEvent`'s existing in-memory snapshot-and-restore pattern on a non-`SUCCESS`/`NO_OP` Gateway result is unchanged.

## 21. Correlation Model

Unchanged from C2 (CD-C3-12). Feedback entries correlate to a recommendation by `(surface, contextId)` equality only, evaluated by `FeedbackDomain.evaluateSuppression` over a rolling window. This SPEC does not add an `eventId`, correlation ID, or any per-instance linkage between a specific trigger-card presentation and the feedback it produced. Grouped-context evidence is confirmed, by this SPEC, as permanently sufficient for the suppression mechanism's product requirements.

## 22. Security Assumptions

Unchanged from the pre-C3 baseline (CD-C3-10). `coachEvents` (both the legacy and the canonical feedback shape) is protected only as part of the whole `users/{uid}` document's existing owner-only read/write Firestore Rule — no field-level or shape validation exists or is added at the Rules layer. Timestamps (`ts`) remain client-supplied `Date.now()` values, never `serverTimestamp()`, never server-revalidated. This SPEC does not change the trust model under which `RECOMMENDATION_FEEDBACK_RECORD` operates; it is explicitly recorded as an accepted limitation (§25.2).

## 23. Native and Multi-Client Compatibility

The canonical event vocabulary and schema (§15, §16) carry no platform dependency of any kind — they are definitions, not code, and do not reference DOM, Firebase, or any browser-only construct. Since this SPEC mandates no code change to any platform adapter, engine, controller, or Gateway/StateAccess module, it has no effect on the existing native-migration boundary described in `FITME_ARCHITECTURE_v1.md` §20.5/§20.8.

## 24. Backward Compatibility and Migration

**No migration is required by this SPEC.** No producer change is mandated. Whatever mix of legacy and canonical (`feedback`) entries already exists in a user's `coachEvents` array remains fully valid, readable data, unaffected by this SPEC's reclassification of ordinary Trigger-fired entries as legacy bookkeeping. `readRecommendationFeedbackHistory`'s existing `kind === 'feedback'` filter (unchanged) continues to correctly separate the two families for every existing user, exactly as it does today (verified today by `tests/stateAccess.test.js` C2-3). If a future task chooses to change the legacy producer's behavior, migration requirements for that change are that future task's concern, not this SPEC's.

## 25. Known Limitations (Accepted, Not Resolved by This SPEC)

**25.1 — C3-F01, Concurrency (High).** `RECOMMENDATION_FEEDBACK_RECORD` performs a non-transactional, non-atomic read-modify-write on the shared `coachEvents` array field (`db...set(fields,{merge:true})`), unlike `DERIVED_PATTERNS_REPLACE`'s transaction+`expectedVersion` CAS check. Two concurrent writers (multi-tab, multi-device, or an out-of-order retry) can silently drop an event. **Explicitly not remediated by this SPEC** (CD-C3-07). Remediation, if ever undertaken, requires a separate, future, explicitly-approved task.

**25.2 — C3-F07, No server-side validation (Medium).** No Firestore Rules-level or other server-side validation of `coachEvents` shape or timestamp values exists or is added. Client-supplied `ts` values are trusted as-is by `evaluateSuppression`. Consistent with the app's existing overall trust model; not remediated by this SPEC (CD-C3-10).

**25.3 — C3-F04, No delivery/open tracking (Medium).** No producer exists, before or after this SPEC, for notification "delivered" or "opened." `Expired` remains reserved, valid, unproduced vocabulary. Not remediated by this SPEC (CD-C3-11) — building this would touch the Trigger Engine's notification-scheduling mechanics and the Notification Adapter, both explicitly out of scope.

**25.4 — C3-F05, Dual ownership of `coachEvents` (Medium).** `coachEvents` remains writable under two B4 owner identifiers (`triggerState`, `profileGoalsState`), a many-to-one relationship the original B4 owner model did not have before C2. Not redefined by this SPEC (CD-C3-08).

**25.5 — C3-F06, Domain/authority tier (Medium).** Feedback events remain classified `SYSTEM_METADATA`/`requiresAuthority:false`, the same tier as pure internal bookkeeping (`coachDay`). Not redefined by this SPEC (CD-C3-09).

**25.6 — C3-F08, Idempotency ledger lifetime (Low).** The Persistence Gateway's idempotency ledger remains in-memory only, reset on every page load; it does not inspect durable state. Unchanged by this SPEC.

**25.7 — C3-F09, SPEC-text/policy array inconsistency (Low).** C2_SPEC §7 prose names `Ignored` as tier-4 evidence; the shipped `RECOVERY_POLICIES.negativeTypes` array (unchanged by this SPEC) is `['Dismissed','Rejected']` and omits `Ignored`. Recorded here for visibility; not corrected by this SPEC, since `FeedbackDomain.RECOVERY_POLICIES` is explicitly unaffected (§11).

## 26. Data Flow and Lifecycle

**Canonical (`feedback`) event lifecycle:**
```
Cause: user gesture (Dismiss / Accept / Dismiss)
 → creation: {kind:'feedback', surface, contextId, feedbackType, date, ts}   [UNCHANGED — C2]
 → validation: presence of all canonical required fields (§16/§17)
 → in-memory mutation: append to coachEvents   [UNCHANGED]
 → retention: governed by policy (§18) — feedback prioritized over legacy; mechanism unspecified
 → persistence: PersistenceGateway.persist(RECOMMENDATION_FEEDBACK_RECORD)   [UNCHANGED]
 → reading: readRecommendationFeedbackHistory filters kind==='feedback'   [UNCHANGED]
 → consumption: FeedbackDomain.evaluateSuppression   [UNCHANGED]
 → expiration: suppression state expires per policy math; the event itself only leaves storage via retention (§18)
```

**Legacy record lifecycle (reclassified, not necessarily discontinued):**
```
Cause: existing Trigger-fired code path (unchanged, §19) — whether it continues to run is outside C3 (CD-C3-02)
 → existing/new entries of this shape: durable, read-compatible, but not canonical events under this SPEC
 → consumption: none, before or after this SPEC, and none may be newly built (§8)
 → retention: subject to §18's policy — lower priority than feedback evidence
```

## 27. Integration Points

No file-level integration change is mandated by this SPEC. The canonical event vocabulary, schema, and retention policy (§15, §16, §18) are statements of what must hold true; this SPEC does not require any specific file, function, module, or line to change, and does not prescribe where or whether engineering represents them in code. `index.html` and `sw.js` require no new script tag or SHELL entry, since no new file is introduced.

## 28. Acceptance Criteria

1. `TRIGGER_RECORD_EVENT` remains present, unmodified, in `PersistenceGateway.listOperations()`.
2. `access.write.recordTriggerOutcome` remains present, unmodified, in `StateAccess`'s `WRITE_OPS` and its existing `PERMISSIONS` grants.
3. `TriggerController` and `TriggerEngineAdapter` behavior is unchanged in every observable respect (trigger selection, suppression, budget tracking, card presentation, notification scheduling).
4. Ordinary Trigger-fired `coachEvents` entries (no `kind` field) are documented as legacy bookkeeping, outside the canonical event model, in any repository-facing documentation this SPEC touches.
5. The canonical event vocabulary is documented as closed, with exactly one active member (`feedback`, schema version 1) (§15).
6. Every entry recorded under the canonical `feedback` kind contains every field listed in §16 and carries `kind: 'feedback'`.
7. The retention policy (§18) — feedback evidence prioritized over legacy bookkeeping — is recorded canonically, without a mandated mechanism.
8. An existing user's pre-C3 `coachEvents` array (mixed legacy + feedback shapes) continues to be read correctly by `readRecommendationFeedbackHistory`, unaffected by this SPEC.
9. No Firestore schema, Firestore Security Rules, or Firebase Functions change is present.
10. No Persistence Gateway operation, StateAccess capability, Engine Registry registration, Trigger Engine behavior, or `js/memory.js` change is present.
11. Full existing regression suite continues to pass unmodified: `node --test tests/*.test.js`, `1044` passed / `0` failed, with zero test amendments required by this SPEC.

## 29. Test Requirements

This SPEC requires no change to any existing test and introduces no requirement to delete, rewrite, or add coverage for Trigger Engine, Persistence Gateway, or StateAccess behavior, since none of that behavior changes. Test requirements introduced by this SPEC are limited to:

- Characterization/documentation-level confirmation that the canonical event vocabulary (§15) is closed and correctly described (exactly one member, `feedback`, schema version 1).
- Confirmation that a newly-constructed `feedback` entry contains every field listed in §16 (canonical schema conformance, §16/§17) — this may be validated wherever and however the canonical entry is constructed, without prescribing a specific test file, function, or code artifact.
- Confirmation that an existing, pre-C3 mixed-shape `coachEvents` array continues to be read correctly by `readRecommendationFeedbackHistory` (backward compatibility, §24) — already covered today by `tests/stateAccess.test.js` C2-3; no new test is required beyond continued passage of that existing coverage.

Retention-policy (§18) test requirements are deferred to whatever future engineering task implements a retention mechanism; this SPEC does not mandate a test for a mechanism it does not specify.

**Regression requirement:** the full existing suite (`node --test tests/*.test.js`) must continue to pass with zero modifications attributable to this SPEC.

## 30. Out of Scope / Future Work

Everything listed in §4 and §25. In particular: C3-F01 (concurrency), C3-F04 (delivery/open tracking), C3-F07 (server-side validation) each remain open, explicitly accepted risks that require their own future, separately-approved task if remediation is ever undertaken. The disposition of the ordinary Trigger-fired producer — whether it continues unchanged, is deprecated, or is eventually removed — is future engineering/product work, outside this SPEC's mandate (CD-C3-02). The retention policy's implementation mechanism (§18) is likewise future engineering work. C4 (Typed Memory Server Write Path) and any future Recommendation Engine remain unaffected and unaddressed by this SPEC.

---

## Appendix A — Engineering Defaults (non-canonical, tunable without a spec revision)

```
COACH_EVENTS_CAP = 200   // unchanged value (CD-C3-06)
```
Everything in §7/§15/§16/§18 not labeled here is canonical and requires a new Product/Architecture decision to change.

## Appendix B — Definition of READY / DONE

**READY for implementation:** this document, §1–§30 and Appendix A, approved as canonical (this document's status, above).

**DONE (implementation exit criteria):** all items in §28 (Acceptance Criteria) verified; full regression suite (`node --test tests/*.test.js`) passes with zero modifications attributable to this SPEC and zero unexplained failures; `docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md` updated per this repository's standard closure convention; a Closure Record section is appended to this document at that time, following the precedent of `docs/specs/C2_SPEC_v1.1.md`'s own Closure Record.

---

## Closure Record

**Status:** Implemented — per §7–§18, in full. No source code changes were required or made; every canonical requirement of this SPEC was satisfied by the repository state already in place at C2's closure (v2.41.0), plus the canonical documentation this SPEC itself constitutes.
**Implementation Summary:** No file under `js/` was modified. The canonical event vocabulary (§15), the canonical `feedback` schema (§16), and the retention policy (§18) are recorded as canonical specification text; no runtime artifact was introduced to represent them, per this SPEC's own explicit instruction that representation is an implementation detail outside its mandate. `recordFeedbackEvent`'s existing entry construction (`js/app.js`) already produces exactly the §16 schema (`kind:'feedback', surface, contextId, feedbackType, date, ts`), confirming Acceptance Criterion 6 without modification. `TRIGGER_RECORD_EVENT`, every StateAccess capability (including `recordTriggerOutcome`), `TriggerController`, `TriggerEngineAdapter`, and Engine Registry wiring were verified unchanged, confirming Acceptance Criteria 1–3 and 10.
**Verification:** All eleven items in §28 (Acceptance Criteria) confirmed against the repository as of commit baseline `b39fa05`.
**Final Test Result:** `1044` passed / `0` failed (`node --test tests/*.test.js`) — identical to the pre-C3 baseline; zero test amendments were required or made.
**Product Review:** Completed — Product and Architecture approval granted (CD-C3-01–CD-C3-12 applied in full, across two canonical revision rounds).
**Architecture Review:** Completed — B1–B5 and C1/C2 contracts confirmed preserved unchanged; no Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry code was added, removed, or refactored; no prohibited item from §4 was introduced.
**Documentation Updated:** `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`, `docs/architecture/FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1(1).md`.
**Release Version:** No `APP_VERSION`/service-worker `VERSION` change — no code was changed (consistent with B1's precedent for a documentation-only architecture decision).
**Completion Date:** 2026-07-26
**Task Status:** CLOSED
