# C2_SPEC v1.1 — CLOSED

**Status:** Implemented and closed
**Governs:** Rejection and Suppression Feedback on existing recommendation surfaces (Trigger Engine, Adaptive TDEE Engine)
**Applies Canonical Decisions:** CD-01 through CD-11 (`FITME_C2_Canonical_Product_Architecture_Decisions_Condensed.md`, temporary decision record, superseded by incorporation into this document per its own terms)
**Preserves:** B1 (canonical memory/authority model), B2 (Engine Registry contract), B3 (StateAccess boundary), B4 (Persistence Gateway closed catalog), B5 (DerivedIntelligenceConsumer — untouched), C1 (module layout)

---

## 1. Executive Summary
C2 gives FITME a retained, structured record of how a user responds to the two existing recommendation-like surfaces — Trigger cards/notifications and Adaptive TDEE proposals — and uses that record to temporarily and reversibly suppress recommendations that a pattern of evidence shows aren't landing, without ever treating a single event as a verdict and without touching any frozen architecture. It is implemented entirely as an extension of the existing Persistence Gateway catalog and StateAccess permission matrix, plus one new pure domain module following the exact pattern already established by `TriggerDomain`/`AdaptiveTdeeDomain`.

## 2. Problem Statement
No code path recorded "the user rejected recommendation X" as a distinct, retained fact prior to C2. `dismissAdaptiveUpdate()` only overwrote a timestamp; Trigger cards had no reject gesture at all; the existing budget/dedup mechanism suppressed by time/count only, never by outcome. This contradicted Constitution §10.11/§11.16/Ch.13 and Coach Bible §55.4/Ch.6§5. CD-01–CD-11 authorized and bounded exactly how to close this gap.

## 3. Goals
1. Record explicit user feedback on Trigger cards/notifications and Adaptive TDEE proposals as one of the eight canonical feedback types (CD-04), distinct from silence.
2. Apply the CD-03 evidence hierarchy so explicit action always outranks inferred/repeated signals.
3. Derive temporary, reversible suppression per CD-07 from repeated evidence only (CD-02, CD-06) — never a single event, never permanent.
4. Do so entirely through the existing Persistence Gateway (CD-08) and StateAccess boundary (B3), with zero new engines/memory models/event models/persistence models (CD-09).

## 4. Non-Goals
- No Recommendation/Initiative/Decision Engine (CD-01, not built as part of C2).
- No change to Habit/Pattern **detection algorithms** or their own confidence fields — confidence there remains exclusively recomputed from source by the existing engines (CD-06). C2's suppression signal is its own independently-recomputed quantity, never a mutation of `coachMemory.habits`/`patterns`.
- No canonical event-bus decision (remains C3's).
- No typed-memory (`users/{uid}/memories`) writes of any kind (remains C4's; CD-08/09 confine C2 to the existing Gateway/`coachEvents` surface).
- No new detection heuristics for passive outcomes (e.g., inferring "the user quietly complied" from later behavior) — out of scope for v1.1.

## 5. Scope
**In scope surfaces (CD-01, "existing recommendation surfaces only"):**
- Trigger Engine: the single selected trigger card per `runCoachTriggers()`, and scheduled local notifications (`scheduleLocalNotifications`).
- Adaptive TDEE Engine: the proposal card (`applyAdaptiveUpdate` / `dismissAdaptiveUpdate`).

**Not in scope:** typed-memory fact reject flow in `js/memory.js` (pre-existing, separate, unmodified), Quick Learn dismiss (`dismissQuickLearn` — not a recommendation surface), any future surface.

## 6. Canonical Feedback Type Vocabulary (CD-04 — closed, no additions)
`Accepted`, `Completed`, `Dismissed`, `Rejected`, `Ignored`, `Expired`, `User Corrected`, `User Confirmed`.

Mapping to the two in-scope surfaces (engineering operationalization of an approved vocabulary — not a new category):

| Surface | Gesture | Feedback Type |
|---|---|---|
| Adaptive TDEE proposal | `applyAdaptiveUpdate()` | `Accepted` |
| Adaptive TDEE proposal | `dismissAdaptiveUpdate()` | `Dismissed` |
| Trigger card | dismiss gesture | `Dismissed` |
| Trigger card | card shown, superseded/replaced with no dismiss and no dismiss-equivalent action by day end | `Ignored` |
| Local notification | scheduled but window elapses unopened | `Expired` |
| Typed-memory reject action (`js/memory.js`, pre-existing) | *(unmodified — out of C2's write path, see §4)* | — |

`Rejected`, `User Corrected`, `User Confirmed` are reserved, valid schema values for future surfaces (e.g. a future chat-based "no, stop suggesting this" statement, which would be CD-03 tier 1 — Explicit User Statement) but have no producer in v1.1 since neither in-scope surface currently supports free-text correction. `Ignored`/`Expired` are structurally supported values in the schema but have no active producer in v1.1 (documented simplification, not a defect — see Implementation Notes).

## 7. Evidence Hierarchy (CD-03) Applied
1. Explicit User Statement — no producer in v1.1 (§6).
2. Explicit User Action — `Accepted`/`Dismissed` gestures on both surfaces. **Highest tier actually reachable; always overrides tiers 3–5.**
3. Repeated Behaviour — ≥`patternThreshold` `Dismissed` events for the same `(surface, contextId)` within `windowDays` → contributes suppression evidence.
4. Single Behaviour — one `Dismissed`/`Ignored` event → evidence only, per CD-02 never independently suppresses.
5. Inference — not applicable; C2 introduces no inferred feedback.

An `Accepted` event newer than the most recent `Dismissed` event immediately lifts any suppression for that `(surface, contextId)`, because tier-2 explicit-action evidence outranks the tier-3 pattern that produced the suppression (CD-03, CD-07 "future positive evidence may restore eligibility").

## 8. Architecture Overview
No new engine, no new memory model, no new event model, no new persistence model (CD-09).

**Component necessity check (Issue 1):** `TriggerDomain` and `AdaptiveTdeeDomain` are each surface-specific pure domains with no cross-surface responsibility; feedback classification/suppression is inherently cross-surface by CD-01's own scope, so it cannot be owned by either single domain without forcing an unrelated cross-domain dependency. It is placed instead in the codebase's existing shared-pure-utility tier — the same tier as `ProfileMetrics`, `DateUtils`, and `CoachProfile` — not a new architectural tier.

```
UI gesture (Trigger card dismiss / Adaptive TDEE apply|dismiss)
   → Controller (TriggerController / AdaptiveTdeeController)
        → StateAccess.write.recordRecommendationFeedback(...)        [new named capability, existing matrix]
             → PersistenceGateway.persist({op:'RECOMMENDATION_FEEDBACK_RECORD', ...})   [new catalog entry, existing catalog]
                  → field-scoped merge into coachEvents[] (EXISTING durable surface)

Suppression consultation (read path only):
TriggerController.runCoachTriggers() / AdaptiveTdeeController.runAdaptiveCheck()
   → StateAccess.read.recommendationFeedbackHistory()                 [new named capability, existing matrix]
        → FeedbackDomain.evaluateSuppression(events, surface, contextId, now)   [shared pure utility, same tier as ProfileMetrics/DateUtils/CoachProfile]
```

## 9. Affected Components
`js/trigger/triggerDomain.js` (**unaffected** — see Implementation Notes for the resolved deviation), `js/trigger/triggerController.js`, `js/adaptive/adaptiveTdeeController.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/app.js` (integration wiring), `index.html`/`sw.js` (module registration), and new file `js/feedback/feedbackDomain.js` — placed alongside `js/domain/profileMetrics.js`/`js/core/dateUtils.js` as a peer shared utility, not alongside `js/engines/` (never registered with `EngineRegistry`).

## 10. Unaffected Components
`js/engineRegistry.js`, `js/memory.js`, `js/derivedIntelligenceConsumer.js` and its policy catalog, Habit/Pattern detection algorithms, Firestore rules, Cloud Function, REM-001/002/003 boundaries (feedback events are `SYSTEM_METADATA` bookkeeping, not Generative/Authoritative content per REM-003 §12/§13).

## 11. Persistence Gateway Extension (CD-08, Issue 2)

**Options considered, and why each was rejected in favor of the chosen extension:**

| Option | Verdict | Reason |
|---|---|---|
| A. Reuse `TRIGGER_RECORD_EVENT` as-is for both surfaces | Rejected | Its `allowedOwners` is `['triggerState']` only; an Adaptive TDEE-originated call would fail B4's ownership validation by design. |
| B. New Firestore field/collection for feedback | Rejected | Barred by CD-09; `coachEvents[]` is already documented as "the raw material the memory layer will eventually infer patterns from." |
| C. New operation, new owner identifier (`feedbackState`) | Rejected | Introduces a net-new owner vocabulary item where none is required. |
| **D. New operation, reusing only existing owner identifiers** | **Selected** | Minimal net-new vocabulary: one new operation name, zero new owner identifiers, zero new durable surfaces. |

**Delivered catalog entry:**

| Field | Value |
|---|---|
| Operation | `RECOMMENDATION_FEEDBACK_RECORD` |
| Owner | `allowedOwners: ['triggerState', 'profileGoalsState']` — both already-existing B4 owner identifiers |
| Domain | `SYSTEM_METADATA` |
| Durable surface | `coachEvents` (existing array — no new field) |
| Conflict policy | `NONE` |
| Idempotency | required, key = `{uid}:{surface}:{contextId}:{feedbackType}:{date}` |
| Retry policy | `TRANSIENT_ONLY`, bounded 3 attempts (B4 §5.5) |
| Requires authority | `false` |
| Payload | `{ surface, contextId, feedbackType, occurredAt }` (via `{coachEvents: nextEvents}`) |

## 12. StateAccess Permission Matrix Extension
```
triggerEngine.DAILY_COACH_CHECK.reads    += ['recommendationFeedbackHistory']
triggerEngine.DAILY_COACH_CHECK.writes   += ['recordRecommendationFeedback']
adaptiveTdeeEngine.ADAPTIVE_CHECK.reads  += ['recommendationFeedbackHistory']
adaptiveTdeeEngine.ADAPTIVE_CHECK.writes += ['recordRecommendationFeedback']
```
Deliberately **not** extended to `WORKOUT_COMPLETED`, `LOCAL_NOTIFICATION_SCHEDULE`, `WEIGHT_CHANGED`, or `ADAPTIVE_RECHECK` — no expansion beyond approved scope.

## 13. FeedbackDomain — Interfaces (Issue 3, Issue 4)

**Product policy (canonical, from CD-02/CD-06/CD-07 — stable, not tunable by Engineering):**
- A single feedback event never independently changes suppression state (CD-02).
- Suppression is always temporary and reversible, never punitive or permanent (CD-07).
- Suppression state is always recomputed from retained source events, never stored as a mutated flag (CD-06).
- Explicit positive user action outranks and can restore eligibility over prior negative evidence (CD-03, CD-07).

**Recovery mechanism — decoupled from the contract, named and versioned:**
```
evaluateSuppression(feedbackEvents, surface, contextId, nowTs, policyId = 'SUPPRESSION_RECOVERY_POLICY_V1')
    -> { suppressed: bool, reason, suppressedUntil, policyId }
```
Follows the same named/versioned policy-catalog pattern already established by B5's `DerivedIntelligenceConsumer` (`CONSUMER_POLICY`). `evaluateSuppression`'s signature and the four contractual guarantees above are permanent; the recovery *strategy* is resolved by `policyId` from `RECOVERY_POLICIES`, so a future `SUPPRESSION_RECOVERY_POLICY_V2` can be added without changing the contract or any caller.

`SUPPRESSION_RECOVERY_POLICY_V1` algorithm:
1. Filter events to this `(surface, contextId)` within the policy's window.
2. If the most recent qualifying event is `Accepted`/`Completed`/`UserConfirmed` → not suppressed.
3. Else, if negative-event count in window ≥ the policy's pattern threshold → suppressed until `lastEvent.occurredAt + duration`.
4. Else → not suppressed.

## 14–24. Data Flow, Lifecycle, State Changes, Failure Modes/Edge Cases, Integration Points, Acceptance Criteria, Engineering/Testing/Migration Requirements, Backward Compatibility, Out of Scope, Future Work
As specified in the approved v1.1 review cycle; see the delivered code and its accompanying test suites (`tests/feedbackDomain.test.js`, `tests/persistenceGateway.test.js` C2-1–C2-8, `tests/stateAccess.test.js` C2-1–C2-6, `tests/triggerController.test.js`, `tests/adaptiveTdeeController.test.js`, `tests/c2Wiring.test.js`) for the authoritative, verified behavior. Key acceptance criteria (all verified — see §"Closure Record" below):
1. Dismissing a Trigger card records a `Dismissed` event via the Gateway, idempotently.
2. A repeated-dismiss pattern (≥ policy threshold) within the policy window suppresses that context, without affecting other contexts.
3. An `Accepted` signal immediately lifts any existing suppression on that surface.
4. No write in this feature ever bypasses `PersistenceGateway`.
5. No write in this feature touches `coachMemory.habits`, `coachMemory.patterns`, or any `confidence` field.
6. No write in this feature touches `users/{uid}/memories`.
7. A single event alone never suppresses anything (CD-02).

## 25. Implementation Notes (resolved deviations, see Closure Record)
Two deviations from the letter of the pre-implementation draft were made and reported at closure:
1. §9 ("`canFire` gains an additional pure suppression check") was implemented instead as a separate controller-level filter in `runCoachTriggers`, per the more detailed and mutually-consistent §8/§13/§14. `TriggerDomain.canFire`'s signature is unchanged.
2. `dismissAdaptiveUpdate()`'s existing `saveProfile()` call was **supplemented**, not replaced, by the new Gateway-routed feedback write — preserving the exact external "defer a week" behavior and its durability (§22), rather than risk losing either.

Both are implementation-level judgment calls made to satisfy this document's own stronger, more specific guarantees; neither touches a Product or Architecture decision.

## Appendix A — Engineering Defaults (non-canonical, tunable without a spec revision)
```
SUPPRESSION_RECOVERY_POLICY_V1 = {
  windowDays:          14,  // mirrors ADAPT_WINDOW_DAYS
  patternThreshold:     3,  // mirrors COACH_DAILY_BUDGET / MISS_INACTIVE_PERIODS
  suppressionDurationDays: 7  // mirrors ADAPT_CADENCE_DAYS
}
```
Everything in §7/§13 labeled "Product Policy" is canonical and requires a new Product/Architecture decision to change. The values above are Engineering-set implementation defaults only.

---

## Closure Record

**Status:** Implemented — per §8–§13, in full
**Implementation Summary:** `js/feedback/feedbackDomain.js` (new shared pure utility) + one Persistence Gateway catalog entry (`RECOMMENDATION_FEEDBACK_RECORD`) + two StateAccess capabilities (`recommendationFeedbackHistory` / `recordRecommendationFeedback`) + `TriggerController`/`AdaptiveTdeeController` integration — see `docs/roadmap/Changelog.md` ("C2 — Rejection and Suppression Feedback") for the full file list.
**Implementation Review:** Completed — four review issues raised against the pre-implementation draft (Architectural Responsibility, Persistence, Product Policy vs. Engineering Defaults, Recovery Behaviour) were resolved into this v1.1 text before implementation began.
**Product Review:** Completed — Product and Architecture approval granted (CD-01–CD-11 applied in full).
**Architecture Review:** Completed — B1–B5 and C1 contracts confirmed preserved unchanged; no prohibited item from §4/§9 introduced.
**Final Test Result:** `1044` passed / `0` failed (`node --test tests/*.test.js`, canonical root-level `tests/` layout)
**Release Version:** `2.41.0`
**Commit:** `14755fc`
**Completion Date:** 2026-07-26
**Task Status:** CLOSED
