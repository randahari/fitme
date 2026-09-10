
# FITME — TRR PRODUCTION REACHABILITY — CANONICAL CORRECTION
## v1.0 — CANONICAL / IMPLEMENTED / VERIFIED / CLOSED

> **Document role:** Canonical Decision record. Not a SPEC, not a Decision Package requiring the full per-chapter Skeleton apparatus — a narrow, two-issue production-reachability correction, authored at that scope deliberately, mirroring `docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md`'s own precedent.
> **Prepared by:** Lead Engineer / Repository Maintainer, recording a decision approved by the Head of Product + AI Architect without reinterpretation.
> **Status:** CANONICAL / IMPLEMENTED / VERIFIED / CLOSED. Implementation performed exactly per §6/§9 below. Full repository regression: 2486/2486 passing (2478 pre-correction baseline, net +8: +5 production-wiring regression, +3 temporal production-backed regression). See §14, Closure Record, for the exact evidence this closure rests on.

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| TRR-001 | Training Readiness & Recovery Spec v1.0 | `docs/specs/TRR_001_SPEC_v1.0.md` |
| TDP | Training Readiness & Recovery V1 Canonical Decision Package v1.0 | `docs/governance/FITME_Training_Readiness_And_Recovery_V1_Canonical_Decision_Package_v1.0.md` |
| B5 | Habit and Pattern Consumption Path Spec v1.2 | `docs/tasks/B5/B5_SPEC_v1.0.md` |
| Stage-9 Correction | The prior narrow canonical correction restoring Stage-9 Candidate-identity reachability | `docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md` |

Citation format: `[FILE:LINE]`, verbatim from the repository as it exists at the baseline this document was authored against (uncommitted working tree, `main`, HEAD `37620c815ee68a64f9aac4315bf02ac06cadb853`).

---

## 1. Purpose

Record two narrow, independently-verified corrections that together restore TRR-001's already-approved production reachability, discovered during a post-closure Dogfooding Milestone 1 readiness investigation: **(A)** a production-wiring completeness defect (four already-implemented, already-tested TRR-001 AI collaborators were never configured with a real production model dependency), and **(B)** a Product/Architecture clarification of TRR V1's own temporal-relevance semantics for its one live Opportunity source, resolving an ambiguity TRR-001's own closed canonical documents left unspecified. Neither correction reopens TRR-001 or B5.

## 2. Trigger / Discovered Production Gaps

During a read-only Dogfooding Milestone 1 investigation (not itself a canonical document), direct inspection of `js/app.js`'s composition root proved that `ReadinessStateInterpreter`, `ActivityPreferenceInterpreter`, `ActivityOppositionInterpreter`, and `TrainingReadinessReasoningComponent` — all script-loaded, all unit/integration-tested against injected mocks, all part of TRR-001's own closed implementation — were never `.configure({callClaude})`'d with the real production model dependency, unlike their four sibling interpreters. A subsequent production-backed behavioral verification of the resulting fix then surfaced a second, independent gap: the Memory Layer's own `INITIATIVE_ENGINE` consumer request never supplied `intent.weekday`, causing B5's own closed `evaluateRelevance()` gate to exclude every real `WORKOUT_FREQUENCY` Habit signal unconditionally, on every day of the week — not merely on a non-matching day.

## 3. Repository Evidence

**Wiring gap:**
- `js/app.js:276-303` (pre-correction) — `SituationalContextInterpreter`, `ExplicitRequestInterpreter`, `SafetyContextInterpreter`, `UserSafetyProvenanceInterpreter` each receive `configure({callClaude: function (body) { return callClaude(body); }})`.
- Repo-wide search (`grep -rn "ReadinessStateInterpreter\.configure\|ActivityPreferenceInterpreter\.configure\|ActivityOppositionInterpreter\.configure\|TrainingReadinessReasoningComponent\.configure" --include=*.js . | grep -v tests/`) returned zero results before correction.
- `js/coachDecisionSystem/trainingReadinessReasoningComponent.js:154-155` — `if (typeof deps.callClaude !== 'function') return null;` — the component's own documented, never-throw, fail-closed contract: unconfigured, it silently produces nothing, with no visible error.
- `tests/coachDecisionSystemWiring.test.js:384-390` (test #21) — an equivalent production-wiring assertion already existed for `ExpressionRenderer`; no equivalent assertion existed for these four components before this correction.

**Temporal gap:**
- `js/coachDecisionSystem/memoryLayer.js:187` (pre-correction) — `intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }`, no `weekday`.
- `js/derivedIntelligenceConsumer.js:56` — `WEEKDAY_QUALIFIER = ['ON_SUNDAY', ..., 'ON_SATURDAY']`.
- `js/derivedIntelligenceConsumer.js:122-124` — `mapHabitTopic()`'s only path to `topic:'WORKOUT_FREQUENCY'` unconditionally attaches a weekday qualifier.
- `js/derivedIntelligenceConsumer.js:442-447` — `evaluateRelevance()`'s temporal-match gate: an absent `intent.weekday` resolves `weekdayQualifier = null`, which never equals any real qualifier value, under `purpose: 'IMMEDIATE'`.
- `[B5_SPEC_v1.0.md:537]` — "`IMMEDIATE` — ... Temporal and sequence qualifiers must match the current request context."
- `[B5_SPEC_v1.0.md:1090-1091]` — "Friday Pattern on Friday: relevant. Friday Pattern on Tuesday: exclude unless the consumer is asking for a weekly review."
- `js/coach/coachPromptComposer.js:211` — an existing sibling Coach-Prompt consumer request already supplies `weekday: now.getDay()` for its own `build()` call, proving the field is real, supported, and already in live production use elsewhere.
- `js/app.js:2177` (pre- and post-correction, unchanged) — `DerivedIntelligenceConsumer.configure({..., getWeekday: function () { return new Date().getDay(); }})` — an already-injected weekday source, confirmed never read anywhere inside `js/derivedIntelligenceConsumer.js` itself; not consumed by this correction, recorded here only as evidence the omission was not a deliberate design choice.

## 4. Root Cause

**Wiring gap:** the four TRR-001 collaborators were built and tested to the same standard as their siblings, but the composition-root wiring step — a single, mechanical, already-established pattern — was never applied to them. No test asserted production wiring for this component family; the one test file that asserts production wiring for a sibling module (`ExpressionRenderer`) was never extended to cover TRR-001's own four additions.

**Temporal gap:** B5's own closed relevance contract (§12.6/§23.3) has always required an `IMMEDIATE`-purpose caller to supply the current temporal context it expects matched. TRR-001's own governance package asserted, without independently re-verifying, that the real `WORKOUT_FREQUENCY` Habit signal "reaches `pipelineContext.initiativeIntelligence.signals`" once B5-admitted — an inherited assumption about already-closed foundation behavior that was never actually true in production, because the one real caller never supplied the field B5's own contract requires for a match.

## 5. Approved Product/Architecture Decision

**Approved — TRR V1 Temporal Relevance.** A weekday-qualified established `WORKOUT_FREQUENCY` Habit is legitimate evidence for a current proactive Training Readiness & Recovery Opportunity **only when its temporal qualifier matches the current decision-day context**, under B5's existing `purpose: 'IMMEDIATE'` semantics:

- `ON_WEDNESDAY` + current decision day Wednesday → **may** contribute to TRR Opportunity formation.
- `ON_WEDNESDAY` + current decision day Thursday → **must NOT** contribute to the current TRR Opportunity solely because that historical Habit exists.

This resolves the previously-unspecified TRR temporal question by confirming TRR V1 inherits B5's own already-closed, conservative default — it does not relax, broaden, or reinterpret B5's semantics in any way.

**This decision does NOT define** future semantics for: explicit planned workouts; calendar-backed training; direct user requests; near-future training plans; device-derived planned activity; or any-day historical training patterns. Those remain separate, future Product/Architecture concerns, not addressed, not implied, and not foreclosed by this decision.

**Approved — Architectural Ownership.** For this TRR V1 path, **the consumer requesting intelligence for an immediate decision owns supplying the temporal context necessary for B5 relevance evaluation.** The approved implementation is: the `INITIATIVE_ENGINE` request, under `purpose: 'IMMEDIATE'`, supplies the current browser-local weekday in its own `intent`. B5's relevance semantics are not changed. `DerivedIntelligenceConsumer` does not synthesize missing temporal context on a caller's behalf. Habit qualifier mapping is not changed. `REVIEW` is not substituted for `IMMEDIATE`.

**Approved — Production-Wiring Defect.** The four already-implemented, already-tested TRR-001 collaborators are restored to their own already-approved `configure({callClaude})` contract in the production composition root. This is an implementation-completeness correction. It does not change TRR Product semantics, does not add a capability, and does not alter any component's schema, prompt, timeout, batching, or fallback behavior.

## 6. Exact Correction Contracts

**Production wiring** (`js/app.js`, composition root, mirroring the existing four-sibling pattern at `js/app.js:276-303`):

```
ReadinessStateInterpreter.configure({ callClaude: function (body) { return callClaude(body); } });          // js/app.js:312
ActivityPreferenceInterpreter.configure({ callClaude: function (body) { return callClaude(body); } });      // js/app.js:320
ActivityOppositionInterpreter.configure({ callClaude: function (body) { return callClaude(body); } });      // js/app.js:329
TrainingReadinessReasoningComponent.configure({ callClaude: function (body) { return callClaude(body); } }); // js/app.js:342
```

No new transport, no new auth path. Each reuses the exact `callClaude` closure (`js/app.js:23`) → `ClaudeProxyClient.send()` → the real `anthropicProxy` Cloud Function already used by every sibling.

**Temporal context** (`js/coachDecisionSystem/memoryLayer.js:204`, the `INITIATIVE_ENGINE` request only):

```diff
- intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE' }
+ intent: { domain: 'GENERAL_COACHING', purpose: 'IMMEDIATE', weekday: new Date().getDay() }
```

`new Date().getDay()` — FITME's existing browser/system-local "today" convention, computed inline, no new dependency, no new timezone/date/calendar subsystem. `js/derivedIntelligenceConsumer.js` is not modified by this correction.

## 7. Explicit RECOMMENDATION_ENGINE Non-Fix

`memoryLayer.js`'s separate `RECOMMENDATION_ENGINE`/`RECOMMENDATION_SUPPORT_V1` request (`memoryLayer.js:160-166`) carries the identical temporal-context omission. It is explicitly OUT OF SCOPE for this correction and is NOT modified. It is not currently blocking any live V1 behavior — its one live rule (`FOOD_LOGGING`/`WEAKENING`) carries no temporal qualifier (`qualifiers: []`), so the omission is dormant, not active. Recorded here as a follow-up finding only, per §17 below.

## 8. B5 Invariant

`js/derivedIntelligenceConsumer.js` — B5, CLOSED (`docs/tasks/B5/B5_SPEC_v1.0.md`, Status: CLOSED, Implementation: COMPLETED) — is untouched by this correction in its entirety: `evaluateRelevance()`, `mapHabitTopic()`, `WEEKDAY_QUALIFIER`, and every other B5-owned function or table are byte-identical before and after. This correction only changes what one caller's own request payload supplies; B5's own matching logic and its own already-closed semantics are not reinterpreted, relaxed, or reopened.

## 9. TRR-001 Invariant

TRR-001 SPEC (`docs/specs/TRR_001_SPEC_v1.0.md`) is not modified, not reopened, and remains IMPLEMENTED / VERIFIED / CLOSED. Neither correction changes: TRR's Source category (`CONFIRMED_PATTERN_ANTICIPATION`, unchanged); its Product Reason (`ADAPT_TO_CURRENT_STATE`, unchanged); its Reasoning Context contract; its Candidate/Safety/Decision-Formation/Expression path; the `BOUNDED_ENGAGEMENT_POLICY` table; or any capability in the V1 Action Envelope. No direct-user-request path into TRR is introduced by either correction — TRR V1 remains exclusively an Observer-initiated, proactive path, exactly as `docs/governance/FITME_Training_Readiness_And_Recovery_V1_Canonical_Decision_Package_v1.0.md` already authorized.

## 10. Non-Goals

This decision does NOT:
- Change B5's relevance semantics, qualifier mapping, or `IMMEDIATE`/`REVIEW` definitions.
- Introduce a `DerivedIntelligenceConsumer`-level default/synthesis of missing temporal context (Option E, considered and explicitly rejected in favor of caller-owned temporal context — Option A).
- Fix, modify, or touch the `RECOMMENDATION_ENGINE` request's own identical, dormant omission (§7).
- Introduce any direct-user-request path, new Source category, planned-workout/calendar semantics, or device-derived activity semantics.
- Modify Safety, Decision Formation, or Expression in any way.
- Modify Preference V1 (remains paused, untouched).
- Constitute a Roadmap/Changelog update — see §16.
- Reopen TRR-001 or B5.

## 11. Required Implementation Surface

**Production files:**
- `js/app.js` — four `configure({callClaude})` calls added.
- `js/coachDecisionSystem/memoryLayer.js` — `weekday` added to the `INITIATIVE_ENGINE` request's own `intent`.

**Test files:**
- `tests/coachDecisionSystemWiring.test.js` — tests 33-37 added (production-wiring proof, four component-specific + one self-discovering enumeration safeguard).
- `tests/trr001ProductionBackedAcceptance.test.js` — new file, three production-backed regression tests (same-day, different-day, full end-to-end proactive path).

No other file is authorized or required by this correction.

## 12. Required Regression/Acceptance Evidence

| # | Scenario | Required result |
|---|---|---|
| A | Production wiring: each of the four components' `configure(...)` call in `js/app.js` references a real `callClaude(...)` | Confirmed, `tests/coachDecisionSystemWiring.test.js` #33-36 |
| B | Self-discovering safeguard: every `coachDecisionSystem` module sharing the `callClaude: null` default-dependency shape is configured | Confirmed, `tests/coachDecisionSystemWiring.test.js` #37 |
| C | SAME-DAY: a `WORKOUT_FREQUENCY` Habit whose weekday qualifier matches today survives B5 relevance evaluation and reaches `pipelineContext.initiativeIntelligence.signals` | Confirmed, `tests/trr001ProductionBackedAcceptance.test.js`, `TRR-TEMPORAL-1` |
| D | DIFFERENT-DAY: a non-matching-weekday `WORKOUT_FREQUENCY` Habit is excluded | Confirmed, `TRR-TEMPORAL-2` |
| E | Full path: same-day Habit + real `user_stated` readiness statement → `CONFIRMED_PATTERN_ANTICIPATION` → `ADAPT_TO_CURRENT_STATE` → Eligibility → real `TrainingReadinessReasoningComponent` (stubbed model seam) → Candidate → Safety → Decision Formation → Expression `DISPATCHED` with a real Delivery Intent | Confirmed, `TRR-TEMPORAL-3` |

Plus: full repository regression passing with no unexpected failure, and explicit confirmation that no existing test's asserted outcome changed.

## 13. Closure Criteria

This document may be marked CLOSED only after: (a) the implementation surface in §11 is built exactly as scoped, with no expansion beyond it; (b) all scenarios in §12 are demonstrated against the real, unmodified production chain; (c) full repository regression passes with reported exact counts; (d) Product/Architecture Final Review explicitly approves closure. **All four conditions are met — see §14.**

---

## 14. Closure Record

Implementation performed exactly per §6/§11, no deviation.

**All scenarios in §12 demonstrated against the real, unmodified production chain** (`tests/coachDecisionSystemWiring.test.js` #33-37; `tests/trr001ProductionBackedAcceptance.test.js`, `TRR-TEMPORAL-1` through `TRR-TEMPORAL-3`):

- **Production wiring (A/B):** all four components' `configure(...)` calls proven present and referencing real `callClaude(...)`; the self-discovering enumeration safeguard confirmed covering all eight current bounded `callClaude`-dependent modules. ✅
- **SAME-DAY (C):** the real `DerivedIntelligenceConsumer.build()` chain admits a matching-weekday `WORKOUT_FREQUENCY` signal into `pipelineContext.initiativeIntelligence.signals`. ✅
- **DIFFERENT-DAY (D):** the identical chain correctly excludes a non-matching-weekday signal — B5's own conservative semantics confirmed intact, not weakened. ✅
- **Full path (E):** a same-day Habit plus a real, representative `user_stated` readiness statement reaches a `FORMED` Terminal Decision (`candidateProvenance[0].opportunityId` matching `trr-adapt-to-current-state:*`) and a `DISPATCHED` Expression outcome carrying a real Delivery Intent, using controlled/stubbed model responses at the three seams TRR-001's own contract already isolates for this purpose (`ReadinessStateInterpreter`, `TrainingReadinessReasoningComponent`, `ExpressionRenderer`). ✅

**This evidence proves production-path reachability and deterministic governance wiring against representative, production-shaped data. It does NOT constitute, and is not represented as, live external-AI verification or live-user dogfooding — no request in this evidence chain was sent to a real model provider.**

**Implementation surface, exactly as scoped in §11, no expansion:** `js/app.js`, `js/coachDecisionSystem/memoryLayer.js` (production); `tests/coachDecisionSystemWiring.test.js`, `tests/trr001ProductionBackedAcceptance.test.js` (tests). `js/derivedIntelligenceConsumer.js` was inspected and confirmed to require no change; `memoryLayer.js`'s own `RECOMMENDATION_ENGINE` request was inspected and confirmed to require no change for this correction's own scope (§7).

**Full repository regression: 2486/2486 passing, 0 failing** (2478 pre-correction baseline, net +8: +5 production-wiring regression in `tests/coachDecisionSystemWiring.test.js`, +3 temporal production-backed regression in `tests/trr001ProductionBackedAcceptance.test.js`).

**Invariants confirmed unbroken:** B5's `evaluateRelevance()`/`mapHabitTopic()`/`WEEKDAY_QUALIFIER` unchanged; TRR-001's Source category, Product Reason, Candidate/Safety/Decision-Formation/Expression path, and `BOUNDED_ENGAGEMENT_POLICY` unchanged; no direct-request path introduced; `RECOMMENDATION_ENGINE`'s own identical omission left untouched, recorded only (§7).

**Product/Architecture verdict:** APPROVED / VERIFIED — production reachability RESOLVED for the already-authorized proactive TRR V1 path; full and TRR-specific regression accepted.

## 15. RECOMMENDATION_ENGINE Follow-Up (recorded, not resolved by this decision)

Status: **FOLLOW-UP — NOT PART OF THIS CORRECTION.** `memoryLayer.js`'s `RECOMMENDATION_ENGINE`/`RECOMMENDATION_SUPPORT_V1` request has the same missing-temporal-context pattern this correction fixed for `INITIATIVE_ENGINE`. It does not currently block any live V1 behavior. Should a future temporally-qualified signal ever become relevant to that consumer, this correction's own precedent (§5/§6) is the evidence base a future, separately-scoped correction should cite — this document does not itself authorize that future correction.

## 16. Roadmap / Changelog Assessment

Engineering has not modified `docs/roadmap/Roadmap.md` or `docs/roadmap/Changelog.md` in this correction, per explicit instruction to report rather than edit. Engineering's assessment: a Changelog entry recording this correction's closure would be consistent with this repository's own existing convention (prior canonical corrections and closures are reflected there) — Product/Architecture should decide whether to authorize that entry separately; it is not created here.

---

## Approvals

- **Product/Architecture decision approving the Temporal Relevance clarification and Architectural Ownership decision (§5):** APPROVED — Head of Product + AI Architect.
- **Product/Architecture decision approving the Production-Wiring correction (§5):** APPROVED — Head of Product + AI Architect.
- **Engineering Readiness Verification:** PASSED — implementation matches §6/§11 exactly; scope-purity confirmed via `git diff --stat`.
- **Final Product Verification:** APPROVED — full and TRR-specific production-backed evidence accepted (§14).
- **Final Architecture Verification:** APPROVED — B5 and TRR-001 invariants (§8/§9) confirmed honored exactly as recorded above; neither is reopened.

**CLOSED.**
