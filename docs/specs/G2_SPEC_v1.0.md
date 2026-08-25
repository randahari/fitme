# G-2 SPEC v1.0 — Live Stage 3/4 Opportunity Recognition

# 1. Status

- Version: 1.0
- Status: **DRAFT — CANONICAL REVIEW PASSED (Product + Architecture APPROVED); the prior blocking prerequisite (Habit Lifecycle Establishment Correction, CSF Ch.29) is now CLOSED / IMPLEMENTED / VERIFIED — see Section 44.** G-2 implementation itself remains **NOT IMPLEMENTED** and requires its own separate Engineering Readiness / authorization gate before implementation begins. Not yet Canonical. Not yet READY. **Not authorized for implementation.**
- Authored by: Lead Engineer / Repository Analyst / SPEC Author, per the authority granted by Head of Product + AI Architect for this task.
- Authority for approval: Head of Product + AI Architect (Product Review, Architecture Review, READY determination — none of which this document performs on its own authority).
- Repository baseline: `main`, commit `ed0882eed2978a330473a682d1131b42085b0986` (`docs(coach): close semantic foundation`).
- Governing meta-standard: `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`.
- **Revision note (prior pass):** The original draft (baseline `30451b0f`) was authored before the Coach Semantic Foundation Canonical Decision Package (CSF) closed. CSF resolved the two blockers that draft recorded as Product Decision Pending (PDP-1: Source→`validReasonCategory` mapping; PDP-2: `trustTestSignal.glad` computation source) by supplying the missing Contextual Meaning capability (CSF Ch.5-21), the First Active V1 Reason Policy (CSF Ch.26), and the Lifecycle-Aware B5 Eligibility Architecture Decision (CSF Ch.27) — and by confirming, not inventing, that `trustTestSignal.glad = null` with an honest basis is the correct, intentional v1 Trust outcome (CSF Ch.18, Ch.26.5). That pass removed PDP-1/PDP-2, corrected a material runtime error in the original draft (Section 27), replaced the original draft's generic Stage-3 aggregation/normalization model with the CSF-mandated Stage-3 semantic-construction model, and added the Contextual Meaning contract, the Product Reason Policy, and the B5 lifecycle-aware branching requirement. Sections preserved without substantive change are marked **(Preserved)**.
- **Canonical Review corrections (prior pass):** Following G-2 Canonical Review of the prior revision, the Head of Product + AI Architect returned two targeted corrections, both applied at that time, with no other section substantively altered: **(1)** the Stage-4 `REPEATED_BEHAVIOUR` Evidence-tier classification for Habit-derived `WEAKENING` (Section 25.1) was recorded as an explicit approval made *during that G-2 Canonical Review* — not a mapping CSF itself had already fixed at the Stage-4 level. **(2)** the Contextual Meaning contract's `NOT_CONSULTED` / `UNAVAILABLE` / `UNCERTAIN` states were being conflated — corrected to record only genuinely `UNAVAILABLE` or `UNCERTAIN` inputs (Sections 16, 19, 20).
- **G-2 blocking prerequisite CLOSED — Habit Lifecycle Establishment Correction now implemented and verified (this pass):** Following Canonical Review's clearance, G-2 Engineering Readiness Review empirically executed the real, unmodified `habitEngine.js` against realistic simulated histories and found that `WEAKENING` was **effectively unreachable** for `period:'weekly'` Habit signals — including the exact `FOOD_LOGGING`/`log-consistency` signal this SPEC's V1 path depends on (Section 22) — under the then-current, unmodified constants. This was **not** a defect in this SPEC's own contracts (which remain correctly, deterministically implementable and testable via fixtures regardless), but it meant Section 25.1's prior Stage-4 tier justification and Sections 19/20's `priorEstablishmentBasis` reasoning — both of which relied on `habitEngine.js`'s `statusOf()` branch *ordering* as their proof — were resting on a premise the actual code did not, at that baseline, sufficiently satisfy for weekly-period habits. The Head of Product + AI Architect approved a durable correction — the **Habit Lifecycle Establishment Correction**, recorded in `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` Chapter 29 — separating a permanent Historical Fact (`everEstablishedHistorically`/`firstEstablishedAt`) from a resettable Current-Episode Establishment Authority (`currentEpisodeEstablished`/`currentEpisodeEstablishedAt`), reusing every existing numeric constant unchanged. **This correction has now been implemented, in `js/engines/habitEngine.js` and `js/derivedIntelligenceConsumer.js`, and production-backed verified** (CSF Chapter 29.7): `currentEpisodeEstablished===true` is repository-confirmed reachable for the real `log-consistency` signal via a genuine establish→degrade→`WEAKENING`→`INACTIVE` arc on real, non-fixture data, with recovery and re-establishment also verified. Sections 19, 20, 22, and 25.1 correctly cite `provenance.currentEpisodeEstablished === true` as the actual basis, per explicit instruction not to rely on the superseded branch-order inference (see Section 44, "Blocking Prerequisite — CLOSED"). **This closes the Chapter 29 prerequisite specifically. G-2 implementation itself remains explicitly NOT IMPLEMENTED and PAUSED** — this closure does not, by itself, authorize G-2 implementation — G-2 must separately return through its own Engineering Readiness / authorization gate before implementation begins. No G-2 production code (Stage 3 opportunity source, Initiative Engine detector-filter extension, or any other G-2-specific implementation) was introduced by the Habit Lifecycle Establishment Correction; the correction closed a Habit Engine/B5 prerequisite only.

------------------------------------------------------------------------

# 2. Purpose

This SPEC converts the already-approved G-2 architecture (`AD-G2-01`, `AD-G2-02`, `AD-G2-03`) and the Coach Semantic Foundation (`CSF-01`–`CSF-16`, plus CSF Ch.26-27) into one complete, implementation-ready Work Item that closes Repository Gap G-2: **no live Stage 3/4 Opportunity source reaches the existing Decision Pass.** It defines every contract, module responsibility, data-flow, invariant, and test requirement needed for an engineer to implement the first real production path — from real Habit-derived behavioral data, through Context Assembly, Contextual Meaning construction, Opportunity Detection, Evidence Evaluation, and Eligibility, into the existing, unmodified Stage 5–10 pipeline — without redesigning the Coach Decision System and without making any Product or Architecture decision this document is not authorized to make.

This SPEC does not redefine FITME's coaching philosophy, reopen any closed Canonical or Architecture Decision (including any CSF decision), or introduce a parallel pipeline. It authors requirements only; it does not implement them.

------------------------------------------------------------------------

# 3. Canonical Authority and Dependencies

## 3.1 Canonical Source Index (flat, authoritative)

| Source | Path |
|---|---|
| D1 | `docs/specs/D1_SPEC_v1.0.md` |
| D2 | `docs/specs/D2_SPEC_v1.0.md` |
| D3 | `docs/specs/D3_SPEC.md` |
| T005 | `docs/specs/TASK_005_SPEC_v1.0.md` |
| T006 | `docs/specs/TASK_006_SPEC_v1.0.md` |
| SL-001 | `docs/specs/SL-001_SPEC_v1.0.md` |
| SLDP | `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| G2P | `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (`CD-G2-01/02/03`, `PD-G2-05`, `AD-G2-01/02/03`) |
| **CSF** | **`docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` (v1.3 — `CSF-01`–`CSF-16`; First Active V1 Reason Policy, Ch.26; Lifecycle-Aware B5 Eligibility Architecture Decision, Ch.27; Habit Lifecycle Establishment Correction, Ch.29 — IMPLEMENTED AND VERIFIED, Ch.29.7)** |
| B5 | `docs/tasks/B5/B5_SPEC_v1.0.md` (Derived Intelligence Consumer; §19.3, Appendix A.3 — lifecycle-aware `INITIATIVE_SUPPORT_V1`) |
| EXPR | `docs/specs/EXPRESSION_SPEC_v1.0.md` |
| SAS | `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` |
| ARCH | `docs/architecture/FITME_ARCHITECTURE_v1.md` |
| B3 | `docs/tasks/B3/B3_SPEC.md` (StateAccess) |
| Constitution | `docs/constitution/FITME_AI_Constitution_v1.0.md` |
| Coach Bible | `docs/governance/FITME_Coach_Bible.md` |

## 3.2 Precedence

Where two sources overlap, the more specific governs (SAS, Canonical Source Requirements), except where the Engineering Workflow's Source-of-Truth hierarchy dictates otherwise. `CSF` is the specific, controlling authority for Contextual Meaning, the V1 Product Reason Policy, and B5's lifecycle-aware branching. `G2P` (`AD-G2-01/02/03`) is the specific, controlling authority for every other G-2-scoped architectural question this SPEC implements. D1/D2/D3 remain controlling for everything neither `CSF` nor `G2P` itself decides. CSF does not reopen `G2P`, and `G2P` is not reopened by this revision (CSF Ch.15, "Explicit Non-Reopening").

## 3.3 No Reopening of Closed Decisions

This SPEC does not reopen, reinterpret, or narrow/widen: `CD-G2-01`, `CD-G2-02`, `CD-G2-03`, `PD-G2-05`, `AD-G2-01` (including `G2-RA-01`–`G2-RA-19`), `AD-G2-02`, `AD-G2-03`, `CSF-01`–`CSF-16`, the First Active V1 Reason Policy (CSF Ch.26), the Lifecycle-Aware B5 Eligibility Architecture Decision (CSF Ch.27), any TASK-004/005/006 Canonical Decision, any SLDP RCD, or the Decision Window closing criterion (which remains explicitly unresolved and non-load-bearing, per `AD-G2-01` `G2-RA-09`).

------------------------------------------------------------------------

# 4. Ownership and Decision Boundaries

Per SAS: this SPEC distinguishes Head of Product decisions, AI Architect decisions, Lead Engineer responsibilities, and repository evidence. Every ownership assignment below either (a) restates an already-approved canonical assignment unchanged, or (b) is a mechanical engineering-fill consequence of an already-approved assignment. No section below assigns ownership of a capability that does not already have one, and no section resolves a Product or Architecture question CSF/G2P left open (Section 44 records what remains genuinely open — none of it blocking).

------------------------------------------------------------------------

# 5. Relationship to Previous Work

## 5.1 D1 — Opportunity Detection (Unit 05), Intervention Eligibility (Unit 06), Recommendation/Initiative Policy (Units 08/09), Evidence Requirements (Unit 11), User State Model (Unit 04) **(Preserved)**

Governs the substantive policy this SPEC's wiring must apply, unchanged. This SPEC adds no Opportunity source, no eligibility rule, and no Evidence Hierarchy tier.

## 5.2 D2 — Stage definitions (Stages 1–10), Decision Lifecycle, Exceptional Flows **(Preserved)**

Governs the Stage boundaries this SPEC wires between. Stage 3 (contributors: Recommendation Engine, Initiative Engine, Safety Layer) and Stage 4 (Decision Engine orchestration per `AD-G2-02`) are implemented, not redefined, here. CSF confirms Contextual Meaning is computed *inside* Stage 3, before a `DetectedOpportunity` is constructed — it is not a new Stage (CSF-02).

## 5.3 D3 — Composite Engine architecture, Memory Layer exclusivity, StateAccess boundary **(Preserved)**

Governs the runtime placement this SPEC's every new call site must respect: single Composite Engine (`D3 §17 Decision 1`), Memory Layer's exclusive Decision-Input-read/Context-Assembly authority (`D3 §11.1`), no direct StateAccess read for Stage-3/Decision Engine (`AD-G2-03` Item 2; `CSF-06`).

## 5.4 TASK-004 / TASK-005 — Recommendation Engine, Initiative Engine, existing `EligibleOpportunity`/`InitiativeCandidate` contracts

Both engines' Stage-6 `generate()` are called into, never modified. **Updated in this revision:** `initiativeEngine.js` gains one new, additive Stage-3 function (Section 32) — its existing `generate()`, `validateRequest()`, `validateCandidateShape()`, and existing `detectConfirmedPatternAnticipation()` output shape are unmodified (SAS, Ownership and Responsibility Rules: "Any existing system's public contract may be called by a new capability; it may not be modified by one").

## 5.5 TASK-006 — Decision Engine, Stage 5/7/8/9, `OpportunityEligibilityInput` (`CD-T006-01`), Safety Integration Port (`CD-T006-05`) **(Preserved)**

Stage 5's closed `OpportunityEligibilityInput` contract (`T006 §15.11`) is consumed unchanged by this SPEC — this SPEC's only new responsibility is *constructing* a conformant instance of it, never altering its shape. `runDecisionPass()`'s existing `{eligibilityInput, eligibleOpportunity}` pairing (`internalPipelineOrchestrator.js:216-218`) is the exact shape this SPEC's Stage 4→5 handoff must produce. **Corrected in this revision:** the prior draft's Section 24 constructed `eligibilityInput.validReasonCategory` as potentially `null`. `eligibilityEvaluator.js`'s own `validateInput()` (`eligibilityEvaluator.js:69-82`) rejects any `validReasonCategory` outside the closed seven-value enum as **`MALFORMED`**, before Trust is ever evaluated (`T006 §15.11`: "An `OpportunityEligibilityInput` missing a required field, or carrying a `validReasonCategory` value outside the closed enum, is rejected at Stage 5 entry as a malformed input... never defaulted to eligible or ineligible by inference"). This SPEC therefore never constructs an `OpportunityEligibilityInput` with a null/invalid `validReasonCategory` for a Stage-5-bound Opportunity — see Section 21, Section 26, Section 27.

## 5.6 SL-001 — Safety Layer, `SafetyIntegrationPort`, safety/high-risk unconditional bypass **(Preserved)**

Unaffected. This SPEC preserves the Safety Layer's Stage-3 detection dispatch point (`detectSafetyOpportunities`, already wired in `internalPipelineOrchestrator.js`) and its unconditional Stage-4/5 bypass (`safetyHighRiskBypass: true`) exactly as built. CSF does not touch Safety (CSF Ch.19: Safety/high-risk remains Engagement-oriented, not a Meaning input).

## 5.7 Expression — Stage 10 handoff **(Preserved)**

Unaffected. Expression is invoked only after a `FORMED` Terminal Decision exists; this SPEC changes nothing about how or when that occurs once Stage 9 produces one. CSF does not reopen Expression (CSF, Backward Compatibility Analysis, `D3` row).

## 5.8 G2P — `AD-G2-01`/`AD-G2-02`/`AD-G2-03` **(Preserved)**

The controlling architecture this SPEC implements for everything outside Contextual Meaning/Reason-Policy/Trust. Every design decision in Sections 12-18, 24-31 traces to one of its items.

## 5.9 CSF — Contextual Meaning, First Active V1 Reason Policy, Lifecycle-Aware B5 Eligibility — **NEW**

The controlling authority this revision implements for Sections 19-23, 27, and 32. CSF is a canonical prerequisite of G-2's Stage-3 construction (`G2P Ch.15`): it supplies the `Observation → User Context → Contextual Meaning → Coaching Opportunity → Engagement Permission` sequence (`CSF-01`) and the `validReasonCategory` derivation mechanism `AD-G2-01`'s `G2-RA-06`/`G2-RA-07` always required but left to this SPEC to operationalize.

------------------------------------------------------------------------

# 6. Problem Statement — Repository Gap G-2

**Verified repository evidence (unchanged from the prior draft; re-verified at this baseline):** `internalPipelineOrchestrator.js:114` — `run()` calls `runDecisionPass({ pipelineContext: pipelineContext, opportunities: [], safetyPort: SafetyLayer })` unconditionally; `opportunities` is a hardcoded empty array, never populated from any real detection. `runDecisionPass()`'s own loop (`internalPipelineOrchestrator.js:228-255`) is fully built and correct — it iterates `opportunities`, dispatches Stage 5 (`EligibilityEvaluator.evaluate`), Stage 6 (`dispatchStage6`), and continues to Stage 7–9 — but is never reached with a non-empty array in production. The result: every Decision Pass resolves to Decision-Pass-level Silence (`D2-INV-05`), regardless of real user state.

**What has changed since the prior draft:** the reason G-2 could not previously be closed was not merely this wiring gap. `initiativeEngine.js`'s one real Stage-3 detector, `detectConfirmedPatternAnticipation()`, already produces a purely *descriptive* Observation (`{sourceCategory, signalId, domain, topic, confidence, evidenceCount, lifecycle}`) — but no canonical source previously existed to interpret what that Observation *means* for this user, or which of D1-IE-01's seven Reasons (if any) it justifies. CSF closed that gap (CSF, Origin). This SPEC's remaining job is therefore: (a) the Contextual Meaning construction step CSF requires (Section 19-20); (b) the one approved V1 Product Reason Policy rule (Section 21, CSF Ch.26); (c) the B5 lifecycle-aware branching that admits the Habit-derived `WEAKENING` signal this rule requires (Section 23, CSF Ch.27); (d) the Stage 4 Evidence Evaluation component `AD-G2-02` authorizes (Section 24-26); (e) the mechanical construction step that turns a sufficient, semantically-complete `DetectedOpportunity` into the `{eligibilityInput, eligibleOpportunity}` pair `runDecisionPass()` already expects (Section 27); and (f) the `run()` changes needed to call all of the above, in order, before invoking `runDecisionPass()` (Section 29).

------------------------------------------------------------------------

# 7. Scope

1. Pipeline Context extension: `goalObjectiveContext`, `currentStateContext` (`AD-G2-03`) — **(Preserved)**, unchanged from the prior draft; not consumed by the V1 Reason Policy rule (Section 21) but required as durable architecture per CSF's explicit instruction not to remove it (CSF Ch.9, "Goal / Current-State Foundation").
2. New, bounded StateAccess read: Goal/Objective Context. Reuse of the existing `todayNutrition` read for Current-State Context. **(Preserved)**
3. Memory Layer assembly of both new Pipeline Context fields, with honest availability semantics. **(Preserved)**
4. **NEW** — the Contextual Meaning capability: a shared, pure, stateless policy utility (`CSF-08`) that a Stage-3 contributor calls to interpret an Observation into a structured `ContextualMeaning` artifact.
5. **NEW** — the Product Reason Policy: a shared, pure, deterministic function implementing exactly one active V1 rule (CSF Ch.26) — `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION` for Habit-sourced `FOOD_LOGGING` observations whose lifecycle is `WEAKENING` — and `NO_VALID_REASON` for every other input.
6. **NEW** — the required, additive B5 (`derivedIntelligenceConsumer.js`) change implementing CSF Ch.27's lifecycle-aware `INITIATIVE_SUPPORT_V1` branching (Habit-derived `WEAKENING` admitted structurally; Pattern-derived `WEAKENING` excluded).
7. **Revised** — Initiative Engine's Stage-3 contribution gains one new, additive function that consumes the admitted Habit-derived `WEAKENING` signal, constructs its `ContextualMeaning`, applies the Product Reason Policy, and — only where a valid Reason results — constructs a complete, Stage-5-ready `DetectedOpportunity`. The existing `detectConfirmedPatternAnticipation()` (ACTIVE/CONFIRMED, descriptive-only) is unmodified.
8. Stage-3 detection dispatch for all three canonical contributors (Recommendation Engine, Initiative Engine, Safety Layer), each producing (or honestly yielding none of) a canonical `DetectedOpportunity`. **(Preserved, revised contract — Section 21)**
9. Stage-4 Evidence Evaluation: a new internal, pure, deterministic component (`AD-G2-02`), inside the Decision Engine's existing boundary. **(Preserved, revised tier classification — Section 25)**
10. The mechanical Stage 4→5 handoff construction (`OpportunityEligibilityInput`/`EligibleOpportunity` from a sufficient `DetectedOpportunity`). **(Preserved, corrected — Section 27)**
11. `internalPipelineOrchestrator.js`'s `run()` changes to sequence the above and call the existing, unmodified `runDecisionPass()` with a real (possibly still-empty) `opportunities` array. **(Preserved)**
12. Test strategy for all of the above.

------------------------------------------------------------------------

# 8. Explicit Non-Scope

This SPEC does **not**:

1. Redefine Stage 5 (`eligibilityEvaluator.js`), Stage 6 (`recommendationEngine.js`/`initiativeEngine.js` `generate()`), Stage 7 (`prioritization.js`), Stage 8 (`winnerSelection.js`), or Stage 9 (`decisionFormation.js`) — all unchanged, all called exactly as already built.
2. Define the Recommendation Engine's internal Decision-Window-detection algorithm (no canonical source defines one; recorded as Repository Gap RG-1, Section 44, non-blocking per `G2-RA-19`'s per-contributor allowance).
3. Resolve the Decision Window closing criterion — remains unresolved, non-load-bearing, per `AD-G2-01` `G2-RA-09`.
4. Introduce Activity/Training-profile context, Body-metric context, or any raw history array into Pipeline Context (`AD-G2-03` Item 9).
5. Introduce Location, inbound Coach Chat, Life Event, Capacity, or Relationship-Maturity acquisition (`AD-G2-03` Item 10, `AD-G2-01` `G2-RA-11`).
6. Add a seventh Coach Decision System collaborator, a new B2 Engine Registry entry, a new trigger type, or a second orchestration authority. Contextual Meaning and the Product Reason Policy are **not** collaborators, Engines, or Registry entries — they are internal, pure utilities called by an already-authorized Stage-3 contributor (`CSF-08`, closed constraint list).
7. Grant any Stage-3 contributor or the Decision Engine a direct StateAccess read.
8. Change `OpportunityEligibilityInput`'s shape (`CD-T006-01`), `EligibleOpportunity`'s required-field set, `InitiativeCandidate`'s shape, `RecommendationCandidate`'s shape, or the Terminal Decision contract. `DetectedOpportunity` (Section 21) adds one new, additive, Stage-3-local field (`contextualMeaning`) that downstream Stage-6 validators already ignore (they check only the fields they require).
9. **NEW** — Define a Product Reason Policy rule for any of the other six D1-IE-01 Reasons (`PREVENT_PREDICTABLE_MISTAKE`, `HELP_BEFORE_DIFFICULT_DECISION`, `CELEBRATE_MEANINGFUL_PROGRESS`, `SUPPORT_RECOVERY`, `PREPARE_FOR_FORESEEABLE_CHALLENGE`, `PROTECT_STATED_LONG_TERM_GOALS`) — each remains `NO AUTOMATIC V1 RULE` (CSF Ch.26.6). This SPEC does not expand the V1 rule to any other Habit/Pattern topic or lifecycle combination.
10. **NEW** — Admit Pattern-derived `WEAKENING` signals for `INITIATIVE_SUPPORT_V1` (CSF Ch.27.2, explicitly excluded from v1).
11. **NEW** — Lower `minimumConfidence` (0.65) globally for `INITIATIVE_SUPPORT_V1`, or introduce any other universal threshold (CSF Ch.27.4).
12. **NEW** — Invent an affirmative Trust source. `trustTestSignal.glad = null` with an honest basis is the correct, intentional v1 outcome (CSF Ch.18, Ch.26.5) — not a placeholder pending a future decision.
13. **NEW** — Add a fourth Contextual Meaning dimension, or foreclose future ones (`CSF-03`/`CSF-04`, "intentionally non-exhaustive and non-permanent").

------------------------------------------------------------------------

# 9. Repository Baseline and Evidence (Dated Snapshot — 2026-08-24)

- Branch: `main`. HEAD commit at authoring time: `ed0882eed2978a330473a682d1131b42085b0986` (`docs(coach): close semantic foundation`).
- The working tree carries line-ending-only (LF→CRLF) differences on several files unrelated to this task (`docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`, `docs/specs/SL-001_SPEC_v1.0.md`, several `js/`/`tests/` files) — verified via `git diff` to contain zero content differences from `HEAD`. These are not treated as canonical or repository-evidentiary changes.
- `js/coachDecisionSystem/` contains the same fifteen files as the prior draft's snapshot (verified, unchanged): `recommendationCategories.js`, `recommendationEngine.js`, `initiativeEngine.js`, `memoryLayer.js`, `internalPipelineOrchestrator.js`, `registerCoachDecisionSystem.js`, `eligibilityEvaluator.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyIntegrationPort.js`, `safetyLayer.js`, `deliveryIntentContract.js`, `expressionInputGate.js`, `expressionRenderingContext.js`, `expressionRenderer.js`.
- `internalPipelineOrchestrator.js` (verified, read in full): `run()` (line 95) hardcodes `opportunities: []` at line 114; `runDecisionPass()` (line 219) unchanged from the prior snapshot.
- `memoryLayer.js` (verified, read in full): `assembleContext(identity)` (line 57) currently assembles `schemaVersion, userId, sessionGeneration, assembledAt, derivedIntelligence, feedbackHistory, initiativeIntelligence, relationshipMaturity, lifeEventContext, capacityState, availability{...}`; requests `INITIATIVE_SUPPORT_V1` from B5 for `initiativeIntelligence` (lines 99-116) — already live, per `CD-T005-01`. No `goalObjectiveContext`/`currentStateContext` field exists today.
- `stateAccess.js` (verified, read in full): `PERMISSIONS.coachDecisionSystem.DECISION_PASS = { reads: ['recommendationFeedbackHistory'], writes: [] }`; `readTodayNutrition(identity)` already returns exactly `{ consumed, protein, burned }`. No `goal`/`goalKcal`-only bounded read exists.
- `eligibilityEvaluator.js` (verified, read in full): `validateInput()` (lines 69-82) rejects a `validReasonCategory` outside the closed seven-value enum with `outcome: 'MALFORMED'` — **before** `evaluate()`'s Trust check (lines 88-122) ever runs. This confirms Section 5.5's correction: a null/invalid Reason never reaches `TRUST_TEST_UNCERTAIN`.
- `initiativeEngine.js`'s `detectConfirmedPatternAnticipation(pipelineContext)` (line 299, verified): filters `pipelineContext.initiativeIntelligence.signals` to `lifecycle === 'ACTIVE' || lifecycle === 'CONFIRMED'` only — **`WEAKENING` signals are currently excluded entirely** from this function, for every domain/topic. This is the exact gap Section 32 closes, additively.
- `js/derivedIntelligenceConsumer.js`'s `evaluateEligibility(signal, policy, now)` (line 367, verified): applies `if (signal.confidence < policy.minimumConfidence) codes.push('BELOW_CONFIDENCE_THRESHOLD')` uniformly, with no branch on `signal.lifecycle` or `signal.sourceType`. `INITIATIVE_SUPPORT_V1`'s policy object (line 86-98, verified) already lists `allowedLifecycle: ['ACTIVE', 'CONFIRMED', 'WEAKENING']` — i.e., `WEAKENING` already clears the *lifecycle* gate for both Habit- and Pattern-derived signals alike, but every `WEAKENING` signal (Habit or Pattern) is still subject to the same `minimumConfidence: 0.65` floor as `ACTIVE`/`CONFIRMED` signals. This is the exact, precise implementation gap CSF Ch.27/`B5 §19.3`/`B5 Appendix A.3` (already-canonical) describes and this SPEC's Section 23 specifies the fix for.
- `js/engines/habitEngine.js`'s `statusOf(conf, occ, daysSince, interval)` (lines 222-230 pre-correction, verified): `if (occ < OCC_CONFIRMED(5) || conf < CONF_CONFIRMED(0.55)) return 'candidate';` ran **before** `if (late > 1.5) return 'weakening';` (line 227). **Correction (CSF Ch.29 — now IMPLEMENTED AND VERIFIED, Ch.29.7):** this branch-ordering fact, while accurate, was found by empirical verification (G-2 Engineering Readiness Review — direct simulation of the real, unmodified engine) to be **insufficient to guarantee `weakening` reachability** for `period:'weekly'` Habit signals (`log-consistency`, `workout:weekday:0..6`, `weigh-in`, `measurement`) — `WINDOW_DAYS=42`/`OCC_CONFIRMED=5`/`INTERVAL_WEEKLY=9` interact such that occurrence falls below the confirmed floor before lateness could cross the `weakening` threshold. The claim held only for `period:'daily'` Habit signals in practice. `js/engines/habitEngine.js` **now implements** the `everEstablishedHistorically`/`firstEstablishedAt`/`currentEpisodeEstablished`/`currentEpisodeEstablishedAt` fields CSF Chapter 29 approved as the durable correction — `statusOf()` gained a `currentEpisodeEstablished` parameter, and this is repository-confirmed to make `weakening` naturally reachable for all `period:'weekly'` signal identities, not only `period:'daily'` ones, without changing any numeric constant. This SPEC's own Sections 19, 20, 22, and 25.1 correctly cite `provenance.currentEpisodeEstablished` rather than the superseded branch-order inference.
- `js/engines/patternEngine.js`'s `statusOf(confidence, evidenceCount, missedPeriods)` (verified, per CSF Ch.27.1's own citation, `patternEngine.js:98-106`): `missedPeriods > 0 → 'weakening'` is checked **before** any confidence/evidence-count threshold — no equivalent structural guarantee exists for Pattern-derived `weakening`.
- `docs/tasks/B5/B5_SPEC_v1.0.md` §19.3 / Appendix A.3 (verified, read in full): already canonically amended to describe the Habit-derived-admitted/Pattern-derived-excluded branching this SPEC's Section 23 requires as code — the B5_SPEC *document* is already synchronized; the `derivedIntelligenceConsumer.js` *implementation* is not (confirmed above).
- `TASK_006_SPEC_v1.0.md §14.12.2` (verified): `evidenceTier` is `NO_SIGNAL` at the current baseline "because Stage 4 is not built" — confirming Stage 4 remains unimplemented, consistent with `AD-G2-02` being an approved-but-not-yet-implemented Architecture Decision.
- Test suite: the same twelve test files named in the prior draft's snapshot exist and pass at this baseline (regression baseline retained; not independently re-run during this authoring activity, consistent with T006/T005's own disclosed limitation).

------------------------------------------------------------------------

# 10. Canonical Vocabulary

- **Opportunity Source** — one of the closed five: `DECISION_WINDOW`, `CONFIRMED_PATTERN_ANTICIPATION`, `DISRUPTION_DETECTION`, `MILESTONE_RECOVERY`, `SAFETY_HIGH_RISK` (`recommendationCategories.js`, `D1 Unit 05`). **(Preserved)**
- **Detecting Contributor** — one of the closed three: `RECOMMENDATION_ENGINE`, `INITIATIVE_ENGINE`, `SAFETY_LAYER` (`D2 Unit 04` Stage 3; `AD-G2-01` `G2-RA-04`). **(Preserved)**
- **Observation** — a descriptive, evaluative-content-free signal from a Stage-3 contributor's derived intelligence (Habit/Pattern, via B5) — "what happened," not "what it means" (`CSF-01`, `CSF-05`). Distinct from a `DetectedOpportunity` — see below.
- **Contextual Meaning** — the structured interpretation of an Observation, in available User Context, answering "what does it mean for this user" (`CSF-01`, `CSF-02`; Section 19).
- **Product Reason Policy** — the closed, Product-owned mapping from (Observation + Contextual Meaning) to one of D1-IE-01's seven valid reasons, or `NO_VALID_REASON` (`CSF-10`; Section 21).
- **Detected Opportunity** — the canonical Stage-3 output contract this SPEC defines (Section 21) — semantically complete, Stage-5-ready, constructed only where the Product Reason Policy yields a valid Reason.
- **Evidence Tier** — one of the six `EVIDENCE_CONFIDENCE` values, reused unaltered from `safetyLayer.js`/`RCD-12.B`. **(Preserved)**
- **Sufficient / Insufficient Evidence** — Stage 4's binary determination (Section 24-25). **(Preserved)**
- **Goal/Objective Context**, **Current-State Context** — the two new Pipeline Context categories `AD-G2-03` approves (Section 12-13). **(Preserved)**

------------------------------------------------------------------------

# 11. Target Architecture and End-to-End Runtime Flow

```
Canonical State Sources
  (userProfile.goal/goalKcal; today's consumed/protein/burned; real nutrition/food-logging history
   → Habit Engine FOOD_LOGGING durable Habit state, via B4/existing production APP_READY runs)
  → dedicated bounded StateAccess reads (readGoalObjectiveContext [new], readTodayNutrition [existing])
  → Memory Layer (assembleContext) — Pipeline Context: goalObjectiveContext, currentStateContext,
    initiativeIntelligence [already live, B5 INITIATIVE_SUPPORT_V1]
  → B5 lifecycle-aware eligibility (Section 23) — Habit-derived WEAKENING now admitted for FOOD_LOGGING
  → Stage 3 — Opportunity Detection
      Recommendation Engine .detectOpportunities(pipelineContext)   [existing dispatch point; honest [] — RG-1]
      Initiative Engine .detectOpportunities(pipelineContext)
          .confirmedPatternAnticipation  [existing, real, descriptive-only, ACTIVE/CONFIRMED — unmodified]
          .semanticOpportunities [NEW — Contextual Meaning (Section 19-20) → Product Reason Policy
                                   (Section 21) → complete DetectedOpportunity, currently populated only
                                   by the FOOD_LOGGING Habit-WEAKENING V1 rule; [] otherwise]
      Safety Layer .detectSafetyOpportunities(pipelineContext)       [existing, honest []]
  → Stage-3 Aggregation (Internal Pipeline Orchestrator, mechanical — Section 29)
      collects each contributor's already-complete DetectedOpportunity objects; invents nothing
      Safety-sourced detections preserve safetyHighRiskBypass unconditionally (G2-RA-05)
  → Stage 4 — Evidence Evaluation (new internal Decision Engine component, evidenceEvaluator.js)
      DetectedOpportunity → {outcome: SUFFICIENT | INSUFFICIENT, evidenceTier}
      INSUFFICIENT → internal termination (D1-SP-02/03), no Stage 5
  → Stage 4→5 Handoff (Internal Pipeline Orchestrator, mechanical construction — Section 27)
      sufficient DetectedOpportunity → {eligibilityInput, eligibleOpportunity}
  → runDecisionPass({ pipelineContext, opportunities: [...], safetyPort: SafetyLayer })   [EXISTING, UNCHANGED]
      Stage 5 (eligibilityEvaluator.js) → Stage 6 (dispatchStage6) → Stage 7 (prioritization.js)
      → Stage 8 (winnerSelection.js) → Stage 9 (decisionFormation.js)
  → Stage 10 — Expression   [EXISTING, UNCHANGED]
```

No parallel pipeline is introduced. The existing Composite Engine (`coachDecisionSystem`) remains the single orchestration authority (`D3 §17 Decision 1`). Everything below the "Stage 4→5 Handoff" line is existing, unmodified code. Contextual Meaning and the Product Reason Policy exist entirely *inside* the Initiative Engine's Stage-3 box above — they are not a separate box, Stage, or collaborator (`CSF-02`).

------------------------------------------------------------------------

# 12. Pipeline Context Extension — Goal/Objective Context **(Preserved)**

**Ownership:** Memory Layer (exclusive), per `AD-G2-03` Item 2 and `D3 §11.1`.

**Contract:**
```
GoalObjectiveContext {
  goal: <string|undefined>,      // as stored on userProfile.goal
  goalKcal: <number|undefined>   // as stored on userProfile.goalKcal
} | null   // null when the underlying source is unavailable
```

**Field scope is closed to exactly these two fields** (`AD-G2-03` Item 5, Item 9). No other Profile field may be added to this object without a further, separate Architecture Decision. Note (this revision): this Context category is **not consulted** by the V1 Product Reason Policy rule (Section 21) — its Alignment output resolves `UNKNOWN` (Section 20), not by omission of this plumbing, but because no Goal comparison is performed for this specific rule (`CSF-04`). It remains architecturally required for future Reason Policy rules that will need it.

**Repository Evidence Required:** `stateAccess.js`'s existing `readAdaptiveProfile(identity)` already surfaces `p.goal`/`p.goalKcal` inside a much broader object — confirms both fields exist and are readable, but that function is explicitly not reused wholesale (`AD-G2-03` Item 4).

**Required Tests:** `memoryLayer.test.js` — Pipeline Context carries `goalObjectiveContext` shaped exactly `{goal, goalKcal}` when the underlying read succeeds; `goalObjectiveContext: null` and `availability.goalObjectiveContext === 'UNAVAILABLE'` when it throws or is denied.

------------------------------------------------------------------------

# 13. Pipeline Context Extension — Current-State Context **(Preserved)**

**Ownership:** Memory Layer (exclusive), per `AD-G2-03` Item 2.

**Contract:**
```
CurrentStateContext {
  consumed: <number>,
  protein: <number>,
  burned: <number>
} | null
```

**Repository Evidence:** identical, verbatim, to the existing `readTodayNutrition(identity)` return shape (`stateAccess.js:177-180`, unchanged). This SPEC reuses that existing read as-is.

**Field scope is closed to exactly these three fields** (`AD-G2-03` Item 6, Item 9).

**Required Tests:** `memoryLayer.test.js` — Pipeline Context carries `currentStateContext` shaped exactly `{consumed, protein, burned}` when the underlying read succeeds; `currentStateContext: null` and `availability.currentStateContext === 'UNAVAILABLE'` otherwise.

------------------------------------------------------------------------

# 14. Dedicated Bounded StateAccess Read Contracts **(Preserved)**

## 14.1 New Read: `goalObjectiveContext`

A new `stateAccess.js` read operation, `readGoalObjectiveContext(identity)`, added to `READ_OPS` and exposed as `goalObjectiveContext` — mirrors the existing `readTodayNutrition` pattern exactly (session-currency check, `freezeShallow`, no mutation of `deps.getUserProfile()`'s own object):

```js
function readGoalObjectiveContext(identity) {
  if (!isCurrent(identity.sessionGeneration)) throw staleSessionError();
  var p = deps.getUserProfile() || {};
  return freezeShallow({ goal: p.goal, goalKcal: p.goalKcal });
}
```

**Forbidden Changes:** `readAdaptiveProfile`, `readTriggerProfile`, and every other existing `READ_OPS` entry remain byte-identical. This is a pure addition.

## 14.2 Reused Read: `todayNutrition`

`readTodayNutrition` (`stateAccess.js:177-180`) is called unchanged; no new function.

## 14.3 Permission Grant

`PERMISSIONS.coachDecisionSystem.DECISION_PASS.reads` is extended from `['recommendationFeedbackHistory']` to `['recommendationFeedbackHistory', 'goalObjectiveContext', 'todayNutrition']`. `writes` remains `[]`.

**Forbidden Changes:** No other engine/action entry in `PERMISSIONS` is touched. No Stage-3 contributor, and no Decision Engine action, receives any `PERMISSIONS` entry of its own (`AD-G2-03` Item 2).

**Required Tests:** `stateAccess.test.js` — `readGoalObjectiveContext` returns the exact `{goal, goalKcal}` shape and throws `StaleSessionError` under a stale session generation; `coachDecisionSystem.DECISION_PASS`'s `createEngineAccess(...).read.goalObjectiveContext`/`.read.todayNutrition` succeed, and every other engine's access to these reads remains exactly as already permitted/denied today (regression).

------------------------------------------------------------------------

# 15. Memory Layer Assembly Behavior **(Preserved)**

`assembleContext(identity)` (`memoryLayer.js:57`) gains two additional, independent `try/catch` blocks, structurally identical to the existing `feedbackHistory`/`derivedIntelligence` blocks:

```js
var goalObjectiveContext = null;
var goalObjectiveContextAvailable = true;
try {
  var g = access.read.goalObjectiveContext();
  goalObjectiveContext = { goal: g.goal, goalKcal: g.goalKcal };
} catch (e) {
  goalObjectiveContextAvailable = false;
}

var currentStateContext = null;
var currentStateContextAvailable = true;
try {
  var t = access.read.todayNutrition();
  currentStateContext = { consumed: t.consumed, protein: t.protein, burned: t.burned };
} catch (e) {
  currentStateContextAvailable = false;
}
```

Both fields, and their `availability` entries, are added to the returned, frozen Pipeline Context object alongside the existing fields — no existing field is removed, renamed, or reshaped. **No change is required to the existing `initiativeIntelligence` block (lines 99-116)** — it already requests `INITIATIVE_SUPPORT_V1`; once Section 23's B5 change lands, Habit-derived `WEAKENING` signals begin appearing in `initiativeIntelligence.signals` automatically, with no Memory Layer change.

**Runtime Interaction:** synchronous reads — no new `await` point, no change to `assembleContext`'s existing `async` signature.

**Forbidden Changes:** `assembleContext`'s existing fields keep their exact current shape; only two new sibling fields and two new `availability` keys are added.

**Required Tests:** see Sections 12-13; plus `internalPipelineOrchestrator.test.js`/`coachDecisionSystemWiring.test.js` regression assertions that the existing Pipeline Context shape's other fields are unaffected.

------------------------------------------------------------------------

# 16. Availability, Null, and Immutability Semantics **(Preserved)**

- Unavailable ⇒ the field is `null` and its `availability` entry is `'UNAVAILABLE'` — never a fabricated default, never an inferred value (`AD-G2-03` Item 8; `D1-DI-02`/`D2-EF-08`).
- A Stage-3 contributor or Stage-4 component that needs `goalObjectiveContext`/`currentStateContext` and finds it `null` MUST treat this as "no information available," never as a synthesized value.
- Pipeline Context, including both new fields, is `freezeShallow`-frozen exactly as every existing field already is.
- No default that would change a Stage-3/4/5 outcome may ever be substituted for an unavailable value (`AD-G2-03` Item 8).
- **Three distinct states (Contextual Meaning `basis`, Section 19) — corrected during G-2 Canonical Review:** `NOT_CONSULTED` — the context category was intentionally not required or read by the applicable Meaning/Reason rule; `UNAVAILABLE` — the rule required or attempted to use that context, but the underlying source could not supply it (this Section's own `availability`/`null` semantics, Sections 12-13); `UNCERTAIN` — an input was available and was consulted, but could not support a reliable semantic determination. These three states are never collapsed into a single "unknown" bucket. **A context category that is merely `NOT_CONSULTED` SHALL NOT automatically populate `basis.unavailableOrUncertain`** (Section 19) — that list records only inputs that were actually `UNAVAILABLE` or `UNCERTAIN`; a category simply outside a given rule's scope is not a failure of any kind and is not listed there.

------------------------------------------------------------------------

# 17. Stage-3 Opportunity Detection — Contributor Responsibilities

Exactly three contributors, unchanged (`AD-G2-01` `G2-RA-04`; `D2 Unit 04` Stage 3):

## 17.1 Recommendation Engine **(Preserved)**

**New dispatch point required:** `recommendationEngine.js` gains `detectOpportunities(pipelineContext)`, structurally parallel to `initiativeEngine.js`'s own function of the same name. Its Stage-3 responsibility is exactly `G2-RA-14`'s corrected wording: determine whether current approved evidence/context supports carrying forward a `DECISION_WINDOW`-sourced Opportunity. **No canonical source defines the concrete detection algorithm or threshold.** This function is a **real, correctly-typed, honestly-empty** detector at this baseline: it returns `[]` unconditionally — recorded as Repository Gap RG-1 (Section 44), non-blocking. CSF does not resolve this either (CSF Ch.13, row 13.2: "Blocked on a separate Repository Gap, not this Package").

## 17.2 Initiative Engine — **REVISED, see Section 32**

`detectOpportunities(pipelineContext)` (`initiativeEngine.js:335`) is extended, additively, with the semantic-construction responsibility CSF assigns to the detecting Stage-3 contributor (`CSF-08`). See Section 32 for the exact required change. The existing `confirmedPatternAnticipation`, `disruption`, and `milestoneRecovery` outputs are unmodified.

## 17.3 Safety Layer **(Preserved)**

Unchanged. `detectSafetyOpportunities(pipelineContext)` (`safetyLayer.js:125`) already exists, already honestly empty pending a Health/Safety Profile source. Its unconditional bypass semantics (`safetyHighRiskBypass: true`) are preserved exactly, per `G2-RA-05`'s corrected wording (Section 18.2). CSF does not touch Safety (CSF Ch.19).

------------------------------------------------------------------------

# 18. Stage-3 Aggregation Boundary — REVISED

## 18.1 Owner and Location

The Internal Pipeline Orchestrator's `run()` (`internalPipelineOrchestrator.js:95`), per `G2-RA-05`'s corrected wording. Not a new component; not a seventh collaborator.

## 18.2 Responsibilities and Prohibitions — Corrected

**Correction from the prior draft:** the prior draft's aggregation step performed generic "normalization" of each contributor's raw descriptive signal into a `DetectedOpportunity`, implicitly treating that structural relabeling as sufficient to make the signal Stage-5-ready. This is corrected: the Internal Pipeline Orchestrator's aggregation step performs **no semantic construction whatsoever** — it only *collects* `DetectedOpportunity` objects each contributor's Stage-3 function has *already* fully constructed (including, where applicable, `contextualMeaning` and `validReasonCategory` — Sections 19-21, 32). The Orchestrator MAY: invoke each of the three contributors' detection functions; collect their already-complete `DetectedOpportunity` outputs; pass them forward. It SHALL NOT: invent rationale, evidence, confidence, `proposedAction`, `contextualMeaning`, or `validReasonCategory` for any signal a contributor did not itself supply (`CSF-08`, closed constraint list, applied to the Orchestrator by extension of `G2-RA-05`'s existing "not a reasoning authority" wording); perform Eligibility Evaluation; prioritize; select a winner; or produce Expression content.

A Safety-sourced detection SHALL preserve its `safetyHighRiskBypass: true` status unconditionally through aggregation — per the existing, unmodified `D1-OD-04`/`D2-EF-01(a)` bypass and `runDecisionPass()`'s own existing `eligibilityInput.safetyHighRiskBypass === true` short-circuit (`internalPipelineOrchestrator.js:234-241`, unchanged).

------------------------------------------------------------------------

# 19. Contextual Meaning — Contract (NEW)

**Canonical authority:** `CSF-02` through `CSF-09`; CSF Ch.12, AD-Detail-2 (CLOSED: "a bounded, structured `ContextualMeaning` artifact... is the canonical traceability contract — not lossy free text").

**Ownership:** computed by a shared, pure, stateless policy utility (Section 20), invoked by the detecting Stage-3 contributor. Semantic accountability for the resulting judgment remains with the calling contributor, never transferred to the shared utility (`CSF-08`). Home: contributor-local, ephemeral within one Stage-3 processing step of one Decision Pass — **not** written into canonical Pipeline Context (`CSF-09`; doing so would give Memory Layer reasoning authority, forbidden by `D3 §11.1`/`CSF-06`).

**Contract:**
```
ContextualMeaning {
  alignment: 'ALIGNED' | 'DEVIATING' | 'NEUTRAL' | 'UNKNOWN',   // CSF-03
  trajectory: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'UNKNOWN', // CSF-03
  basis: {
    observation: {
      sourceType: 'HABIT' | 'PATTERN',
      signalId: <string>,
      domain: <DomainId>,
      topic: <TopicId>,
      lifecycle: <SignalLifecycle>,
      confidence: <number>,          // current, honestly decayed — never inflated (CSF Ch.26.4/27.2)
      evidence: { count: <integer> },
      temporal: { firstObservedAt, lastObservedAt, expectedIntervalDays }
    },
    priorEstablishmentBasis: <string> | null,
      // REVISED (CSF Ch.29 — IMPLEMENTED AND VERIFIED, Ch.29.7): cites the explicit, persisted
      // provenance.currentEpisodeEstablished === true fact (Habit Engine's own Current-Episode
      // Establishment Authority — CSF Ch.29, AD-HL-02/AD-HL-06), never the superseded
      // statusOf()-branch-order inference (CSF Ch.27.1, corrected) — null where no such fact is
      // claimed. The Habit Lifecycle Establishment Correction (CSF Ch.29) is now implemented and
      // production-backed verified, so this field can be populated with a real, non-placeholder
      // value once G-2 itself is implemented — see Section 22, 44.
    contextConsulted: {
      goalObjectiveContext: 'CONSULTED' | 'NOT_CONSULTED' | 'UNAVAILABLE',
      currentStateContext: 'CONSULTED' | 'NOT_CONSULTED' | 'UNAVAILABLE'
    },
    unavailableOrUncertain: <string[]>   // named list ONLY of inputs that were UNAVAILABLE (the
                                          // rule attempted to use them but the source could not
                                          // supply them) or UNCERTAIN (available and consulted,
                                          // but could not support a reliable determination). A
                                          // category that is merely NOT_CONSULTED — intentionally
                                          // outside the applicable rule's scope — SHALL NOT appear
                                          // here (Section 16). Corrected during G-2 Canonical
                                          // Review; e.g. NOT ['goalObjectiveContext'] merely
                                          // because a rule chose not to read it — see Section 20.
  }
}
```

**Requirements (this SPEC's engineering-fill of `AD-Detail-2`):**

- `alignment`/`trajectory` are each independently allowed to be `UNKNOWN` — Trajectory-only Meaning is real, evidence-backed Meaning even absent any Goal comparison (`CSF-04`).
- `alignment` SHALL NOT be fabricated where no relevant objective is consulted — it resolves `UNKNOWN` honestly (`CSF-04`).
- `basis` MUST allow an audit/test to determine, for any `ContextualMeaning`: which Observation produced it; which available User Context contributed (and which was `NOT_CONSULTED` vs. genuinely `UNAVAILABLE` — Section 16); which lifecycle/trajectory evidence contributed; what was unavailable or uncertain. Free-text explanation alone does not satisfy this requirement (CSF, "Structured Meaning Requirement"); a human-readable explanation (e.g. `explanation.rationale` on the resulting `DetectedOpportunity`, Section 21) MAY be derived from `basis` but does not replace it.
- `NOT_CONSULTED`, `UNAVAILABLE`, and `UNCERTAIN` are three distinct states and are never conflated (Section 16): a category the applicable rule does not require is `NOT_CONSULTED` and is never listed in `unavailableOrUncertain`; only a category the rule required/attempted to use and found missing (`UNAVAILABLE`) or insufficiently reliable (`UNCERTAIN`) is listed there.
- Exact module placement (`AD-Detail-1` — SPEC/Engineering detail, not Canon): `js/coachDecisionSystem/contextualMeaningPolicy.js`, a new, pure, stateless module. **Not** a new Engine, collaborator, Registry entry, StateAccess reader, Pipeline Context assembler, Opportunity creator, Eligibility authority, Trust authority, or orchestration authority (`CSF-08`, closed constraint list, verbatim).

**Required Tests:** `contextualMeaningPolicy.test.js` — `alignment`/`trajectory` resolve correctly for the V1 Habit-`FOOD_LOGGING`-`WEAKENING` case (Section 20); `alignment: 'UNKNOWN'` when `goalObjectiveContext` is `NOT_CONSULTED`; `basis` carries every field named above; determinism (same Observation + same Context ⇒ byte-identical `ContextualMeaning`).

------------------------------------------------------------------------

# 20. Contextual Meaning — V1 Deterministic Rule (Habit `FOOD_LOGGING` `WEAKENING`)

For the one Observation class the V1 Product Reason Policy (Section 21) acts on — a Habit-sourced, `topic: 'FOOD_LOGGING'` signal whose `lifecycle === 'WEAKENING'` — Contextual Meaning resolves deterministically:

- **Trajectory: `WORSENING`.** Directly from the real Habit lifecycle degradation (`sourceType: 'HABIT'`, `lifecycle: 'WEAKENING'`) — CSF Ch.26.4.
- **Alignment: `UNKNOWN`.** No Goal comparison is required or performed for this rule (CSF Ch.26.3/26.4: "no additional numeric coaching threshold... is introduced," "no Goal comparison is required or performed"). This SPEC resolves the `NEUTRAL`-vs-`UNKNOWN` choice CSF Ch.26.4 leaves nominally open (it lists "`NEUTRAL` or `UNKNOWN`") **deterministically as `UNKNOWN`**, on direct precedent from `CSF-04`'s own worked example: *"a Trajectory-only finding (an established pattern's own confirmed weakening/strengthening) is real, evidence-backed Meaning even absent any Goal comparison"* — `CSF-04` states this resolves `Alignment: UNKNOWN`, not `NEUTRAL`. `NEUTRAL` would require an actual Goal comparison to have been performed and found no relevant deviation; this rule performs no such comparison (`contextConsulted.goalObjectiveContext: 'NOT_CONSULTED'`), so `UNKNOWN` — not an assessed-and-found-neutral `NEUTRAL` — is the canonically consistent value. This is not a new Product/Architecture decision; it is a direct, non-arbitrary application of `CSF-04`'s own already-approved worked example to a structurally identical case.
- **`basis.priorEstablishmentBasis`:** **REVISED (CSF Ch.29 — now IMPLEMENTED AND VERIFIED, Ch.29.7).** The prior draft's fixed string cited `statusOf()`'s branch order alone (`habitEngine.js:222-230`; CSF Ch.27.1) — corrected, per explicit instruction, to no longer rely on that inference. The correct basis, now that the Habit Lifecycle Establishment Correction (CSF Ch.29) is implemented, is: `"provenance.currentEpisodeEstablished === true (Habit Engine Current-Episode Establishment Authority, CSF Ch.29 AD-HL-02) — the current, uninterrupted lifecycle episode has itself earned confirmed-tier authority (occ>=OCC_CONFIRMED(5) and conf>=CONF_CONFIRMED(0.55) held within this episode), independent of statusOf()'s branch ordering alone."` **This field can now be populated with a real, non-placeholder value once G-2 itself is implemented** — the Chapter 29 prerequisite blocking it is closed; see Section 22, Section 44 ("Blocking Prerequisite — CLOSED").
- **`basis.contextConsulted`:** `{ goalObjectiveContext: 'NOT_CONSULTED', currentStateContext: 'NOT_CONSULTED' }` — both Context categories exist and may be `AVAILABLE` (Section 12-13), but neither is read by this rule.
- **`basis.unavailableOrUncertain`:** `[]` — corrected during G-2 Canonical Review. Both Goal/Objective Context and Current-State Context are `NOT_CONSULTED` for this rule (previous bullet), not `UNAVAILABLE` or `UNCERTAIN` — this rule never attempts to read either category, so their status at the Contextual-Meaning level is `NOT_CONSULTED` regardless of what Pipeline Context's own `availability` map (Sections 12-13) separately reports for those fields. Per Section 16/19's corrected semantics, a `NOT_CONSULTED` category never populates `unavailableOrUncertain`; this list remains empty for the V1 rule under every availability condition.
- **Prohibited inference (CSF Ch.26.4, restated verbatim):** why logging declined; poor nutrition behavior; lack of motivation; dietary failure; Goal deviation. None of these is asserted or implied anywhere in the constructed `ContextualMeaning` or the resulting `DetectedOpportunity`'s `explanation` fields (Section 21).

------------------------------------------------------------------------

# 21. Product Reason Policy and the Detected Opportunity Contract (NEW / REVISED)

## 21.1 Product Reason Policy

**Canonical authority:** `CSF-10` (derivation shape); CSF Ch.26 (the one approved V1 rule); CSF Ch.13 (the other six reasons, `NO AUTOMATIC V1 RULE`).

**Ownership:** Head of Product owns the policy content (`CSF-11`); this SPEC documents an engineering-ready, pure, deterministic implementation of the exactly-one-rule content CSF Ch.26 already approved, inventing nothing.

**Contract (engineering fill, `AD-Detail-1`):**
```
deriveValidReasonCategory(observation, contextualMeaning) →
  'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION' | 'NO_VALID_REASON'
```

**V1 rule body (exhaustive — no other branch exists):**
```
IF observation.sourceType === 'HABIT'
   AND observation.topic === 'FOOD_LOGGING'
   AND observation.lifecycle === 'WEAKENING'
THEN 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'
ELSE 'NO_VALID_REASON'
```

This is the exact, narrow condition CSF Ch.26.1/26.3 approves — not a generic missing-data rule, not applicable to any other `FOOD_LOGGING` observation that has not entered `WEAKENING`, not applicable to Pattern-derived signals (excluded upstream at B5, Section 23, before this function is ever called for them), and not applicable to any other topic or domain (CSF Ch.26.2, "What This Is Not"). Every other Observation this function receives — including `ACTIVE`/`CONFIRMED` confirmed-pattern signals of any domain/topic — resolves `NO_VALID_REASON`, because no Product Reason Policy rule exists for them (CSF Ch.13, Ch.26.6). Where `NO_VALID_REASON` results, no ordinary Stage-5-bound `DetectedOpportunity` is constructed for that Observation (`CSF-10`; Section 21.3) — the raw Observation may remain internally observable, but the pipeline is not required to, and does not, fabricate one to move it forward.

**Module placement:** `js/coachDecisionSystem/contextualMeaningPolicy.js` (co-located with, but structurally distinct from, Section 19's Contextual Meaning construction — both are pure functions in the same closed-constraint-list module, `CSF-08`, `AD-Detail-1`).

**Required Tests:** `contextualMeaningPolicy.test.js` — the exact V1 rule fires only for Habit + `FOOD_LOGGING` + `WEAKENING`; every other `{sourceType, topic, lifecycle}` combination resolves `NO_VALID_REASON`, including Habit `FOOD_LOGGING` `ACTIVE`/`CONFIRMED`, Habit non-`FOOD_LOGGING` `WEAKENING`, and (defensively, though excluded upstream at B5) Pattern `FOOD_LOGGING` `WEAKENING`.

## 21.2 Trust Test Signal (V1)

**Canonical authority:** `CSF-13`; CSF Ch.26.5; CSF Ch.18.

No affirmative Trust source is approved for v1. Where the Product Reason Policy yields a valid Reason:
```
trustTestSignal = {
  glad: null,
  basis: 'No approved affirmative Trust source exists for this Opportunity (Coach Semantic Foundation Ch.18/Ch.26.5). glad remains honestly null.'
}
```
This is not a placeholder pending a future decision — it is the correct, intentional, final v1 value (Section 8, item 12). It is constructed by the same detecting Stage-3 contributor that constructs the rest of the `DetectedOpportunity` (Initiative Engine, for this rule — Section 32), never fabricated by the Decision Engine (`T006 §15.11`; Section 27).

## 21.3 Detected Opportunity Contract — Revised

**Status:** revises the prior draft's contract. `G2-RA-06`'s instruction to reconcile with, not duplicate, `OpportunityEligibilityInput`/`EligibleOpportunity` remains satisfied — see Section 21.4.

```
DetectedOpportunity {
  id: <string>,                        // required, non-empty, stable identity
  sourceCategory: <one of the 5 OPPORTUNITY_SOURCES>,   // required
  detectingContributor:
    'RECOMMENDATION_ENGINE' | 'INITIATIVE_ENGINE' | 'SAFETY_LAYER',  // required — traceability (G2-RA-07)

  // EligibleOpportunity-conformant fields — identical names/shapes to the existing,
  // unmodified recommendationEngine.js/initiativeEngine.js validateRequest() contract:
  proposedAction: <string>,            // required (except SAFETY_HIGH_RISK)
  confidence: <number in [0,1]>,       // required (except SAFETY_HIGH_RISK) — the Observation's
                                        // own current, honestly decayed confidence; never inflated
  explanation: {                       // required (except SAFETY_HIGH_RISK)
    rationale: <string>,
    evidenceBasis: <string>,
    expectedValue: <string>,
    uncertainty: <any non-empty>
  },
  detectedAt: <number>,                 // this Decision Pass's pipelineContext.assembledAt — real,
                                         // never fabricated

  // Initiative-specific, present only when detectingContributor === 'INITIATIVE_ENGINE':
  valueDimensions: <array>,             // required by initiativeEngine.js when present
  genuine: <boolean|undefined>,         // required only when sourceCategory === 'MILESTONE_RECOVERY'

  // NEW (this revision) — the structured traceability artifact CSF's AD-Detail-2 requires,
  // carried forward for Stage-4 traceability and audit. Not read by any existing Stage-5/6
  // validator (harmless additive field, Section 8 item 8).
  contextualMeaning: ContextualMeaning,   // Section 19

  // Stage-5-facing fields — REVISED: no longer perpetually null. Populated deterministically by
  // the Product Reason Policy (Section 21.1) and Trust rule (Section 21.2) at construction time.
  // A DetectedOpportunity for which the Product Reason Policy resolved NO_VALID_REASON is never
  // constructed in the first place (Section 21.1) — these fields are therefore never null on any
  // DetectedOpportunity that actually reaches this contract:
  validReasonCategory: 'PREVENT_PREDICTABLE_MISTAKE' | 'HELP_BEFORE_DIFFICULT_DECISION'
    | 'CELEBRATE_MEANINGFUL_PROGRESS' | 'SUPPORT_RECOVERY' | 'PREPARE_FOR_FORESEEABLE_CHALLENGE'
    | 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION' | 'PROTECT_STATED_LONG_TERM_GOALS',
  trustTestSignal: { glad: true | false | null, basis: <string> },

  // Safety bypass tag — present and true only for a Safety-sourced detection:
  safetyHighRiskBypass: true | undefined
}
```

**Critical correction from the prior draft:** the prior draft allowed `validReasonCategory: null` to reach Section 24's construction step, on the (documented, but now superseded) assumption that this would resolve `TRUST_TEST_UNCERTAIN` at Stage 5. Section 5.5/Section 9 confirm this is factually wrong at the current implementation — `eligibilityEvaluator.js`'s `validateInput()` rejects it as `MALFORMED` before Trust is ever evaluated. This revision closes that error at the source: a `DetectedOpportunity` is never constructed with `validReasonCategory: null` for an ordinary, Stage-5-bound Opportunity. Where the Product Reason Policy resolves `NO_VALID_REASON`, no `DetectedOpportunity` is constructed at all for that Observation (Section 21.1) — there is no `MALFORMED`-bound happy path anywhere in this design.

## 21.4 Reconciliation with Existing Contracts (`G2-RA-06`)

No parallel taxonomy is created. `DetectedOpportunity` is the existing `EligibleOpportunity` shape (verbatim: `id, sourceCategory, proposedAction, confidence, explanation{...}, valueDimensions, detectedAt`, per `T006 §10.4`'s repository-verified contract), plus: `detectingContributor` (traceability, `G2-RA-07`), `contextualMeaning` (new, additive, harmless to existing validators), and the two Stage-5-facing fields (`validReasonCategory`, `trustTestSignal`) `T006 §15.11` already names as "populated upstream (Opportunity Detection/Stage 3)." A sufficient `DetectedOpportunity` is passed through, unmodified, as the `eligibleOpportunity` half of the Stage 6 input (Section 27); its extra fields are ignored by `recommendationEngine.js`/`initiativeEngine.js`'s existing `validateRequest()`, which checks only for the fields it needs.

**Required Tests:** `internalPipelineOrchestrator.test.js`/`contextualMeaningPolicy.test.js` — a well-formed `DetectedOpportunity` for the V1 Habit-`FOOD_LOGGING`-`WEAKENING` case normalizes correctly and deterministically, carries a non-null `validReasonCategory`, and is never constructed with `validReasonCategory: null`.

------------------------------------------------------------------------

# 22. First Real Production Path (`G2-RA-19`) — REVISED; CSF CH.29 PREREQUISITE CLOSED, G-2 ITSELF STILL NOT IMPLEMENTED

**Blocking prerequisite — CLOSED (this revision):** the trace below is the approved target path. Its `WEAKENING`-reachability precondition — previously empirically unreachable for the `log-consistency` signal under the pre-correction `habitEngine.js` (Section 9) — is now closed: the Habit Lifecycle Establishment Correction (CSF Ch.29) is implemented and production-backed verified (Ch.29.7); `currentEpisodeEstablished===true` is repository-confirmed reachable for `log-consistency` on real, non-fixture data. **The trace as a whole is still not achievable today**, for a separate, unrelated reason: G-2 itself remains **NOT IMPLEMENTED** — the trace's own required engineering changes (B5 lifecycle-aware admission, Section 23; Initiative Engine Stage-3 construction, Section 32) have not been built. This SPEC's own Sections 21-32 remain correctly specified and independently implementable/testable via fixtures; only the *real, non-fixture* production occurrence of this exact trace depended on Ch.29, which is now closed — G-2's own implementation is a separate, still-outstanding step requiring its own Engineering Readiness / authorization gate.

**The one real, live production signal path this SPEC wires end-to-end**, per CSF Ch.24's own approved trace:

```
real nutrition / food-logging history (userProfile.coachMemory, authoritative source history)
  → Habit Engine FOOD_LOGGING log-consistency Observation (habitEngine.js, existing, unchanged)
  → durable Habit state (existing, B4-persisted)
  → Habit lifecycle WEAKENING (habitEngine.js:statusOf(), via CSF Ch.29's Habit Lifecycle
      Establishment Correction — IMPLEMENTED AND VERIFIED; see Section 9/44. The current,
      uninterrupted lifecycle episode's own currentEpisodeEstablished authority — not
      statusOf()'s branch order alone — is the basis)
  → B5 lifecycle-aware Initiative-support admission
      (derivedIntelligenceConsumer.js evaluateEligibility(), Section 23 — REQUIRED CHANGE)
  → Memory Layer (memoryLayer.js:assembleContext(), already requesting INITIATIVE_SUPPORT_V1 —
      no change required, Section 15)
  → Pipeline Context / initiativeIntelligence.signals (already assembled)
  → Initiative Engine Stage-3 semantic construction (Section 32 — REQUIRED CHANGE)
      → structured ContextualMeaning (Section 19-20: alignment=UNKNOWN, trajectory=WORSENING)
      → Product Reason Policy (Section 21.1)
      → validReasonCategory = REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION
  → well-formed DetectedOpportunity (Section 21.3)
  → Stage-3 Aggregation (Section 18, mechanical collection only)
  → Stage 4 Evidence Evaluation (Section 24-25) → SUFFICIENT, evidenceTier: REPEATED_BEHAVIOUR
  → Stage 4→5 Handoff (Section 27)
  → Stage 5 Eligibility Evaluation (eligibilityEvaluator.js, existing, unchanged)
      → valid Reason present (not MALFORMED) → Trust evaluated → glad = null
      → INELIGIBLE / TRUST_TEST_UNCERTAIN
  → Silence (Decision-Pass-level, D2-INV-05, existing, unchanged)
```

CSF Ch.29 being implemented and verified means the `WEAKENING` step of this trace is now backed by a genuine, non-fabricated fact on real production data (real food-logging history → real Habit Engine computation, including its Current-Episode Establishment authority). **Once G-2 itself is implemented** (Section 23's B5 admission change and Section 32's Initiative Engine construction change, both still outstanding), this trace becomes a genuine, live, non-fabricated Decision Pass outcome end-to-end — not a fixture — fully consistent with `G2-RA-19`/`G2-RA-17` and with CSF Ch.24's own approved trace. It will then satisfy `G2-RA-19`'s "at least one real production signal path... without hand-authored Opportunity fixtures, hardcoded `opportunities:[]`, or test-only injection," and its "valid integration path for all three canonical Stage-3 contributors" (Recommendation Engine and Safety Layer both have a real, live dispatch point returning an honest, permanently-empty result today, per the same accepted pattern `G2-RA-19` itself names as sufficient).

**`trustTestSignal.glad = null` is expected, correct Product behavior, not an unresolved gap:** per Section 8 item 12 / CSF Ch.18/26.5, this remains the intentional, final v1 value once the path is reachable. **G-2 is not yet complete, however** — not because of the `WEAKENING` reachability question (CSF Ch.29's Habit Lifecycle Establishment Correction is now implemented and `currentEpisodeEstablished` verified reachable for the `log-consistency` signal in real production data — Section 44, "Blocking Prerequisite — CLOSED"), but because G-2 itself remains **NOT IMPLEMENTED**: Section 23's B5 admission change and Section 32's Initiative Engine construction change are still outstanding. This is not a further Product or Architecture decision this SPEC still needs, but an ordinary implementation-sequencing step this SPEC's own contracts (Sections 19-32) correctly anticipate and do not need to be redesigned to accommodate.

------------------------------------------------------------------------

# 23. B5 Lifecycle-Aware Eligibility — Required Implementation (NEW)

**Canonical authority:** CSF Ch.27 (APPROVED Architecture Decision); `B5 §19.3`/Appendix A.3 (already-canonical, already-synchronized document text). **This section documents, for G-2's own implementation sequencing, the exact code change B5's own canonical text already approves — it does not modify, reopen, or reinterpret `B5_SPEC_v1.0.md`, and it changes no B5 canonical decision.**

**Repository evidence (Section 9):** `js/derivedIntelligenceConsumer.js`'s `evaluateEligibility(signal, policy, now)` (line 367) currently applies `INITIATIVE_SUPPORT_V1`'s `minimumConfidence: 0.65` uniformly to every `WEAKENING` signal, regardless of `sourceType`. This does not yet implement CSF Ch.27/`B5 Appendix A.3`'s approved branching.

**Required change (additive, to `evaluateEligibility()`, `INITIATIVE_SUPPORT_V1` policy path only):**
```
IF policy === INITIATIVE_SUPPORT_V1 AND signal.lifecycle === 'WEAKENING':
    IF signal.sourceType === 'HABIT':
        admit (skip the minimumConfidence check for this signal — CSF Ch.27.2, structural
               guarantee substitutes for a confidence-floor check; current decayed confidence
               is still carried on the signal, honestly, never inflated or replaced)
    ELSE IF signal.sourceType === 'PATTERN':
        exclude with INELIGIBLE_LIFECYCLE (or an equivalent explicit exclusion code) —
        CSF Ch.27.2, Pattern-derived WEAKENING remains excluded from v1, unconditionally
ELSE:
    existing behavior, unchanged (ACTIVE/CONFIRMED admission for INITIATIVE_SUPPORT_V1;
    COACH_PROMPT_V1 and RECOMMENDATION_SUPPORT_V1 are entirely unaffected by this change)
```

**Explicit Non-Scope of this change (CSF Ch.27.4, restated verbatim):** does not lower `minimumConfidence` globally; does not introduce a new universal threshold; does not enable Pattern-derived `WEAKENING`; does not reconstruct historical confidence for any signal; does not change `COACH_PROMPT_V1`/`RECOMMENDATION_SUPPORT_V1`/`TEST_FULL_DIAGNOSTIC_V1` in any way; does not change `ACTIVE`/`CONFIRMED` eligibility for any policy.

**Ownership:** this remains a B5 `DerivedIntelligenceConsumer` eligibility-policy change (`B5 §7`), not a G-2/Coach-Decision-System change — G-2 depends on it, and this SPEC records the exact requirement so implementation sequencing is unambiguous, but B5 remains the owning module boundary (Section 5.9; SAS, Runtime and Integration Documentation Rules).

**Required Tests:** `derivedIntelligenceConsumer.test.js` — a Habit-sourced, `WEAKENING`, `sourceType: 'HABIT'` signal below `minimumConfidence` is still admitted under `INITIATIVE_SUPPORT_V1` (current decayed confidence preserved, unmodified, on the returned signal); a Pattern-sourced, `WEAKENING`, `sourceType: 'PATTERN'` signal remains excluded regardless of confidence; `ACTIVE`/`CONFIRMED` admission behavior is unchanged (regression); `COACH_PROMPT_V1`/`RECOMMENDATION_SUPPORT_V1` behavior is unchanged (regression); `minimumConfidence` constant value (`0.65`) is unchanged (regression, guards against accidental global lowering).

------------------------------------------------------------------------

# 24. Stage-4 Evidence Evaluation — Component Contract **(Preserved)**

**Ownership:** Decision Engine, narrow, per `AD-G2-02` Items 2-3. **New file:** `js/coachDecisionSystem/evidenceEvaluator.js` — an internal, pure, deterministic module, structurally identical in pattern to `eligibilityEvaluator.js`. **Not** a new Engine, collaborator, or Registry entry (`AD-G2-02` Item 3).

**Input:** one `DetectedOpportunity` (Section 21).

**Output:**
```
EvidenceEvaluationResult {
  outcome: 'SUFFICIENT' | 'INSUFFICIENT',
  evidenceTier: 'EXPLICIT_USER_STATEMENT' | 'EXPLICIT_USER_ACTION' | 'REPEATED_BEHAVIOUR'
              | 'SINGLE_BEHAVIOUR' | 'INFERENCE' | 'INSUFFICIENT',
  reason: <string>
}
```

**Forbidden Actions** (`AD-G2-02` Item 5, restated verbatim): SHALL NOT invent evidence, rationale, confidence, or `proposedAction`; SHALL NOT perform Stage-5 Eligibility; SHALL NOT generate Candidate content; SHALL NOT perform Expression.

**Dependencies:** none beyond its own input.

**Required Tests:** `evidenceEvaluator.test.js` — every `EvidenceTier` × outcome combination in Section 25's table; malformed `DetectedOpportunity` input handling.

------------------------------------------------------------------------

# 25. Evidence Sufficiency and Tier Traceability — REVISED

## 25.1 Tier Classification (per source, evidence-grounded, non-invented)

| `sourceCategory` / Observation shape | Deterministic tier classification | Basis |
|---|---|---|
| `SAFETY_HIGH_RISK` | N/A — bypasses Stage 4 entirely | `D1-OD-04`, `D2-EF-01(a)`, unchanged |
| `CONFIRMED_PATTERN_ANTICIPATION`, `sourceType: 'HABIT'`, `lifecycle: 'ACTIVE'` or `'CONFIRMED'` | `REPEATED_BEHAVIOUR` | `initiativeEngine.js:294-298`'s own documented B5-eligibility-gate guarantee (Section 9) — unchanged from the prior draft |
| **`CONFIRMED_PATTERN_ANTICIPATION`, `sourceType: 'HABIT'`, `lifecycle: 'WEAKENING'` (the V1 rule, Section 20-21)** | **`REPEATED_BEHAVIOUR`** | **Explicitly APPROVED by the Head of Product + AI Architect as part of G-2 Canonical Review of this SPEC; basis CORRECTED in this revision per CSF Ch.29 — no longer relies on the old `statusOf()` branch-order inference.** This mapping is not treated as though CSF itself had already canonically fixed the Stage-4 tier; no new Canonical Decision Package was required or created for it. D1 Unit 11 Tier 3 ("Repeated Behaviour — a pattern meeting a defined threshold within a defined window") is the tier used; none is invented. **The exact basis is `provenance.currentEpisodeEstablished === true`** (Habit Engine's explicit, persisted Current-Episode Establishment Authority, CSF Ch.29 AD-HL-02/AD-HL-06) — **not** an inference from `statusOf()`'s branch order alone, which G-2 Engineering Readiness Review found empirically insufficient to guarantee reachability for this exact `period:'weekly'` signal (Section 9), and which CSF Ch.29 has since closed (IMPLEMENTED AND VERIFIED, Ch.29.7). **The `WEAKENING` state is not being promoted to Tier 3 on the basis of its current decayed confidence.** Current confidence remains a separate quantity, continuing to be preserved honestly and unmodified on the `DetectedOpportunity`'s `confidence` field (Section 21.3) — never blended with, or substituted for, this tier classification. **Pattern-derived `WEAKENING` remains excluded from v1** (Section 23) and receives no corresponding mapping — it never reaches this classification step at all. **This row can now be exercised on real `currentEpisodeEstablished` data (the Ch.29 prerequisite is closed); it still cannot be exercised end-to-end until G-2 itself is implemented** — see Section 44, "Blocking Prerequisite — CLOSED." |
| `DISRUPTION_DETECTION`, `MILESTONE_RECOVERY`, `DECISION_WINDOW` | No classification source exists at this baseline — the detector honestly returns `[]` | Repository Gap, inherited, non-blocking |

**No canonical blocker on Stage-4 WEAKENING evidence *semantics*:** the tier-mapping question the original G-2 investigation flagged as potentially requiring a new Product/Architecture decision is resolved — not by Engineering unilaterally declaring an existing D1 Unit 11 tier applicable, but by the Head of Product + AI Architect explicitly approving this exact mapping during G-2 Canonical Review (row above), using an already-existing D1 Unit 11 tier and an already-established, already-documented repository mapping precedent — never a newly invented tier, and never a lowered sufficiency bar. This approval is recorded here, in this SPEC, as its own sufficient record; no separate Canonical Decision Package is required for the tier-mapping decision itself. **This is distinct from `WEAKENING`'s own reachability**, whose blocking prerequisite (CSF Ch.29, Section 44) is now **CLOSED** — the tier mapping is correctly specified and will be correctly exercised the moment a real `WEAKENING` signal, admitted per its `currentEpisodeEstablished` authority, actually reaches Stage 4 (which requires G-2 itself to be implemented, separately gated).

## 25.2 Sufficiency Rule **(Preserved)**

Directly from `D1-OD-01`: sufficient ⟺ `evidenceTier ∈ {EXPLICIT_USER_STATEMENT, EXPLICIT_USER_ACTION, REPEATED_BEHAVIOUR}`; insufficient ⟺ `evidenceTier ∈ {SINGLE_BEHAVIOUR, INFERENCE, INSUFFICIENT}`.

## 25.3 Traceability **(Preserved)**

`EvidenceEvaluationResult.evidenceTier` is preserved unmodified through the Stage 4→5 handoff (Section 27) and into `opportunitiesConsidered` at Decision Formation (`decisionFormation.js`, unchanged).

------------------------------------------------------------------------

# 26. Insufficient-Evidence Termination Behavior **(Preserved)**

Per `D1-SP-02`/`D1-SP-03` and `AD-G2-02` Item 7: a `DetectedOpportunity` resolving `INSUFFICIENT` at Stage 4 is excluded from the `opportunities` array passed to `runDecisionPass()` — it never reaches Stage 5. No fabricated Silence, synthetic user-facing outcome, or replacement Opportunity is created for it. If it is the cycle's only Detected Opportunity, `runDecisionPass()`'s own existing, unmodified empty-pool path produces the ordinary Decision-Pass-level Silence (`D2-INV-05`).

------------------------------------------------------------------------

# 27. Stage 4→5 Handoff — Mechanical Construction — CORRECTED

**Owner:** Internal Pipeline Orchestrator (`AD-G2-02` Item 9).

**New function**, `internalPipelineOrchestrator.js`, e.g. `buildEligibilityAndCandidateInputs(sufficientDetectedOpportunity, pipelineContext)`, pure and mechanical:

```js
function buildEligibilityAndCandidateInputs(d, pipelineContext) {
  var eligibilityInput = {
    id: d.id,
    sourceCategory: d.sourceCategory,
    validReasonCategory: d.validReasonCategory,   // always non-null here — see below
    trustTestSignal: d.trustTestSignal,            // always {glad, basis} — see below
    lowCoachingValuePeriodActive: (
      pipelineContext.lifeEventContext == null && pipelineContext.capacityState == null
    ) ? false : /* existing T006 §15.3 rule, unchanged */ undefined,
    safetyHighRiskBypass: d.safetyHighRiskBypass === true
  };
  return { eligibilityInput: eligibilityInput, eligibleOpportunity: d };
}
```

**Correction from the prior draft (Section 5.5, Section 21.3):** the prior draft's version of this function accepted a `DetectedOpportunity` whose `validReasonCategory`/`trustTestSignal` could be `null`, defaulting `trustTestSignal` to `{glad: null, basis: 'no approved source'}` inline. This is corrected: this function is now called **only** on a `DetectedOpportunity` that already carries a non-null `validReasonCategory` and a fully-formed `trustTestSignal` — because Section 21.1 guarantees no `DetectedOpportunity` is constructed at all when the Product Reason Policy resolves `NO_VALID_REASON` (Section 18.2's aggregation step never receives, and this function is therefore never called on, a semantically-incomplete Opportunity). This function performs **no semantic invention and no defaulting** — it is a pure field-selection copy from an already-complete `DetectedOpportunity` into the two existing, unmodified downstream contracts. There is no code path in this design that calls `eligibilityEvaluator.js`'s `evaluate()` with a null/invalid `validReasonCategory` for an ordinary Opportunity — confirming, structurally, Section 5.5/21.3's "no MALFORMED happy path" requirement.

`eligibleOpportunity` is the `DetectedOpportunity` object itself, unmodified.

**Constraint (`AD-G2-02` Item 2, restated):** this function grants the Decision Engine no Stage-3 detection authority, no D1 Evidence-policy ownership, and no authority to invent `validReasonCategory`/`trustTestSignal` values.

**Required Tests:** `internalPipelineOrchestrator.test.js` — a sufficient, semantically-complete `DetectedOpportunity` produces a `{eligibilityInput, eligibleOpportunity}` pair that `eligibilityEvaluator.js` evaluates to `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` (not `MALFORMED`) for the V1 path (Section 22); a defensive test confirms this function is never invoked with a `null` `validReasonCategory` in this design (i.e., the aggregation step in Section 18 never forwards a `NO_VALID_REASON` Observation into Stage 4/5 at all).

------------------------------------------------------------------------

# 28. Downstream Boundary Preservation (Stage 5–10 Unchanged) **(Preserved)**

`eligibilityEvaluator.js`, `recommendationEngine.js`, `initiativeEngine.js`'s existing `generate()`/`validateRequest()`/`validateCandidateShape()`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyIntegrationPort.js`/`safetyLayer.js`'s `disqualify()`/`finalReview()`, `deliveryIntentContract.js`, `expressionInputGate.js`, `expressionRenderingContext.js`, `expressionRenderer.js` — **none of these files is modified by this SPEC.** `runDecisionPass()` itself is called with a real `opportunities` array but its own internal logic is unmodified.

------------------------------------------------------------------------

# 29. Internal Pipeline Orchestrator Changes **(Preserved, updated sequencing)**

`run()` (`internalPipelineOrchestrator.js:95`) changes from:
```js
var passResult = await runDecisionPass({ pipelineContext: pipelineContext, opportunities: [], safetyPort: SafetyLayer });
```
to a sequence that: (1) calls all three contributors' Stage-3 detection functions, including Initiative Engine's new `semanticOpportunities` bucket (Section 32); (2) collects each contributor's already-complete `DetectedOpportunity` objects (Section 18 — no normalization/construction performed here); (3) runs each through `EvidenceEvaluator.evaluate()` (Section 24), excluding `INSUFFICIENT` ones (Section 26) and routing `safetyHighRiskBypass` ones around Stage 4 (Section 18.2); (4) builds `{eligibilityInput, eligibleOpportunity}` pairs for the survivors (Section 27); (5) calls the existing `runDecisionPass({ pipelineContext, opportunities: <built array>, safetyPort: SafetyLayer })` unchanged.

**Runtime Interaction:** synchronous, in-process, no new `await` boundary beyond what already exists.

**Forbidden Changes:** `run()`'s own external return contract is unchanged; `runDecisionPass()`'s own signature and internal logic are unchanged; `runForOpportunity`/`runForInitiativeOpportunity`/`dispatchStage6`/`runExpressionStage` are unchanged.

**Required Tests:** `internalPipelineOrchestrator.test.js` — `run()` now calls all three detection functions exactly once per invocation; an empty-signal cycle (no qualifying Habit/Pattern data) still produces `opportunities: []` and the existing Decision-Pass-level Silence, byte-for-byte matching current passing tests (regression); a cycle with one real Habit `FOOD_LOGGING` `WEAKENING` signal (fixture-backed at the unit level; real at the production-integration level per Section 22) produces a non-empty `opportunities` array reaching Stage 5 with the exact `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` outcome, deterministically, on repeated execution.

------------------------------------------------------------------------

# 30. Decision Engine Changes **(Preserved)**

The Decision Engine's boundary gains exactly one new internal module, `evidenceEvaluator.js` (Section 24), per `AD-G2-02`. No existing Decision Engine file changes.

------------------------------------------------------------------------

# 31. Recommendation Engine Changes **(Preserved)**

`recommendationEngine.js` gains one new exported function, `detectOpportunities(pipelineContext)` (Section 17.1). Its existing `generate(request)` and `validateRequest(request)` are unmodified.

------------------------------------------------------------------------

# 32. Initiative Engine Changes — REVISED (was, in error, "None")

**Correction from the prior draft:** the prior draft's Section 29 stated "Initiative Engine Changes: None." This was accurate only under the prior draft's own (now-superseded) assumption that generic Orchestrator-level normalization could turn a descriptive signal into a Stage-5-ready `DetectedOpportunity`. CSF's Semantic Ownership decision (`CSF-08`) requires the *detecting Stage-3 contributor* — here, the Initiative Engine — to own Contextual Meaning construction and Product Reason Policy application. This is a real, required, additive change.

**Required change:** `initiativeEngine.js`'s `detectOpportunities(pipelineContext)` (line 335) gains one new key in its returned object, `semanticOpportunities`, populated by one new internal function:

```
detectOpportunities(pipelineContext) returns {
  confirmedPatternAnticipation: [...],   // UNCHANGED — existing function, existing shape, ACTIVE/CONFIRMED only
  disruption: [...],                     // UNCHANGED
  milestoneRecovery: [...],              // UNCHANGED
  semanticOpportunities: [DetectedOpportunity, ...]   // NEW
}
```

`semanticOpportunities` is populated by a new internal function (engineering name, e.g. `detectSemanticOpportunities(pipelineContext)`) that, for every signal in `pipelineContext.initiativeIntelligence.signals`:

1. Calls `ContextualMeaningPolicy.computeContextualMeaning(observation, pipelineContext)` (Section 19) to construct the signal's `ContextualMeaning`.
2. Calls `ContextualMeaningPolicy.deriveValidReasonCategory(observation, contextualMeaning)` (Section 21.1).
3. If the result is `NO_VALID_REASON`: contributes nothing to `semanticOpportunities` for this signal (the Observation is not fabricated into an ordinary Stage-5-bound Opportunity — Section 21.1).
4. If the result is a valid Reason (currently, only ever `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, and only for the exact V1 condition, Section 21.1): constructs the complete `DetectedOpportunity` (Section 21.3) — `id` deterministically derived from the signal's own stable `id` (B5 §15.1, e.g. `'g2-food-logging-info-request:' + observation.id`); `sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION'` (the correct, existing, five-value-enum category — Habit-derived anticipation from an already-confirmed-tier-established behavior remains within this existing category; no sixth source is introduced, `CD-G2-01` unaffected); `detectingContributor: 'INITIATIVE_ENGINE'`; `proposedAction`, `explanation`, `valueDimensions: ['UNDERSTANDING']` (D1-IP-03's Understanding dimension, directly matching D1-IE-01's own "requesting information that will significantly improve coaching" wording — not a new taxonomy), `confidence` (the Observation's own current, honestly decayed confidence), `detectedAt: pipelineContext.assembledAt`; `contextualMeaning` (step 1); `validReasonCategory` (step 2); `trustTestSignal` (Section 21.2); `safetyHighRiskBypass: false`.

**Explicitly unmodified:** `generate(request)`, `validateRequest(request)`, `validateCandidateShape()`, `detectConfirmedPatternAnticipation()`, `detectDisruptionOpportunities()`, `detectMilestoneRecoveryOpportunities()`, `STAGE6_ACCEPTED_SOURCES`, `MATURITY_GATING`, `VALUE_DIMENSIONS`, `MATURITY_STAGES` — every existing export and existing behavior is preserved byte-for-byte; this is a pure addition of one new internal function and one new key on `detectOpportunities()`'s return value.

**Prohibitions preserved (`G2-RA-13`, restated):** Initiative Engine SHALL NOT perform direct StateAccess reads; SHALL NOT re-run Habit detection; SHALL NOT re-derive Habit/Pattern intelligence; SHALL NOT infer Pattern history; SHALL NOT fabricate missing Context. Every input this new function uses is already present on `pipelineContext` (Habit/Pattern signals via the already-live `initiativeIntelligence`, Section 15; Goal/Current-State Context, Sections 12-13 — consulted only where a future rule needs them, `NOT_CONSULTED` for the current V1 rule per Section 20).

**Required Tests:** `initiativeEngine.test.js` — `detectOpportunities()`'s existing three keys are byte-identical to today's output for every existing fixture (regression); `semanticOpportunities` is empty for every signal that is not Habit + `FOOD_LOGGING` + `WEAKENING`, including `ACTIVE`/`CONFIRMED` `FOOD_LOGGING` signals and `WEAKENING` signals of any other topic; `semanticOpportunities` contains exactly one well-formed `DetectedOpportunity`, conformant to Section 21.3, for a Habit `FOOD_LOGGING` `WEAKENING` fixture; the constructed `DetectedOpportunity`'s `confidence` matches the fixture's own (undecayed-in-the-test, but never-inflated) value exactly; determinism (same `pipelineContext` ⇒ byte-identical `semanticOpportunities`).

------------------------------------------------------------------------

# 33. Safety Layer Integration **(Preserved)**

None beyond what already exists. `detectSafetyOpportunities` is now actually dispatched from `run()` (previously exposed but unreached); `disqualify()`/`finalReview()` are unaffected. CSF does not alter Safety Layer authority or bypass semantics anywhere (CSF Ch.19; Section 8, item 6).

------------------------------------------------------------------------

# 34. Memory Layer, StateAccess, Engine Registry, Expression, Persistence Impact **(Preserved)**

- **Memory Layer:** two new fields (Sections 12-13, 15). No new write. No new external dependency. No change required to the already-live `initiativeIntelligence` assembly.
- **StateAccess:** one new bounded read (`goalObjectiveContext`), one new permission grant on the existing `coachDecisionSystem.DECISION_PASS` action (Section 14). No new write operation. No change to any other engine's permissions.
- **Engine Registry:** **no new entry.** `registerCoachDecisionSystem.js` is unmodified.
- **Expression:** **no new authority.** Expression is invoked exactly as today, only after a `FORMED` Terminal Decision exists.
- **Persistence:** **no new durable write.** Every new read is read-only.
- **B5 (`derivedIntelligenceConsumer.js`):** one additive, lifecycle-aware branching change (Section 23), owned by B5, required by this SPEC's real path.

------------------------------------------------------------------------

# 35. Backward Compatibility **(Preserved)**

Additive only, throughout. No existing contract's required-field set, shape, or validation rule is altered. No existing StateAccess permission is removed or narrowed. No existing test's asserted behavior changes for any input shape that already exercises today's code paths (the empty-signal, all-Silence baseline remains byte-identical; every existing Habit/Pattern `ACTIVE`/`CONFIRMED` B5 admission remains byte-identical).

------------------------------------------------------------------------

# 36. Determinism and Idempotency **(Preserved, extended)**

Every new function (`readGoalObjectiveContext`, the two new `assembleContext` blocks, `RecommendationEngine.detectOpportunities`, `ContextualMeaningPolicy.computeContextualMeaning`, `ContextualMeaningPolicy.deriveValidReasonCategory`, `InitiativeEngine`'s new `detectSemanticOpportunities`, the corrected `evaluateEligibility()` branching in B5, `EvidenceEvaluator.evaluate`, `buildEligibilityAndCandidateInputs`) is pure and deterministic: identical input yields identical output, no hidden randomness, no time-dependent behavior beyond the already-existing, explicitly-input `detectedAt`/`assembledAt` timestamps. Repeated evaluation of the same unchanged Pipeline Context is idempotent — including through the full real path (Section 22): the same Habit record, evaluated twice with no intervening state change, produces byte-identical `ContextualMeaning`, `DetectedOpportunity`, and Stage 5 outcome both times.

------------------------------------------------------------------------

# 37. Failure Behavior and Graceful Degradation **(Preserved, extended)**

| Failure | Detection | Handling | Fallback |
|---|---|---|---|
| `readGoalObjectiveContext`/`todayNutrition` throws | try/catch in `assembleContext` | `goalObjectiveContext`/`currentStateContext: null`, `availability: 'UNAVAILABLE'` | Context Assembly proceeds with what's available (`D3 §12.3`) |
| A Stage-3 contributor's detection function throws | defensive try/catch around each dispatch in `run()` | that contributor contributes zero Detected Opportunities this cycle | other contributors' results still considered; never a fabricated Opportunity |
| `ContextualMeaningPolicy` functions receive a malformed Observation | defensive input validation, mirrors `eligibilityEvaluator.js`'s discipline | signal excluded from `semanticOpportunities`; no crash | no fabricated `ContextualMeaning`/Reason |
| `EvidenceEvaluator.evaluate` receives a malformed `DetectedOpportunity` | validation check, mirrors `eligibilityEvaluator.js` | outcome `INSUFFICIENT` | excluded from `opportunities`, no crash |
| B5's `evaluateEligibility()` receives a signal with an unrecognized `sourceType` | existing structural-validation discipline (`B5 §17`) | excluded, per existing `UNKNOWN_SOURCE_TYPE` code | no fabricated admission |
| Stage 5/6/7/8/9 failure of any kind | unchanged — existing, already-tested behavior | unchanged | unchanged |

No fallback fabricates output in place of a genuine failure, consistent with `D1-DI-02`/`D3 §12.3`.

------------------------------------------------------------------------

# 38. Invariants **(Preserved, extended)**

- **Safety invariant:** a Safety-sourced Detected Opportunity's `safetyHighRiskBypass` status is never altered, reinterpreted, or lost (Section 18.2, `G2-RA-05` corrected).
- **Authority invariant:** no Stage-3 contributor or the Decision Engine acquires a direct StateAccess read (Section 14.3, `AD-G2-03` Item 2); Evidence policy remains exclusively D1 Unit 11's (`AD-G2-02` Item 4).
- **Semantic-ownership invariant (NEW):** Contextual Meaning and `validReasonCategory` are constructed only by the detecting Stage-3 contributor, via the shared pure policy utility; the Internal Pipeline Orchestrator never constructs, infers, or defaults either (`CSF-08`; Sections 18.2, 32).
- **No-affirmative-Trust invariant (NEW):** no code path in this design ever sets `trustTestSignal.glad` to anything other than `null` for the V1 path (Section 21.2); no affirmative Trust is fabricated to force an Opportunity to `ELIGIBLE`.
- **No-Pattern-WEAKENING invariant (NEW):** no code path in this design admits a Pattern-derived `WEAKENING` signal into `semanticOpportunities` (Section 23, B5 exclusion, is upstream of and structurally prevents this).
- **Data-flow invariant:** every new Pipeline Context field travels exactly the canonical path (Section 11); no parallel context path exists.
- **Stage-order invariant:** Stage 3 → Stage 4 → Stage 5 remains distinct and sequential; no merge (`AD-G2-02` Item 1).
- **No-fabrication invariant:** no evidence, rationale, confidence, `proposedAction`, `validReasonCategory`, `contextualMeaning`, or `trustTestSignal` value is ever invented where the upstream source did not supply one (Sections 18.2, 19-21, 24, 27).
- **No-MALFORMED-happy-path invariant (NEW):** no code path in this design constructs an `OpportunityEligibilityInput` with a null/invalid `validReasonCategory` for an ordinary Opportunity (Sections 21.1, 21.3, 27).

------------------------------------------------------------------------

# 39. Repository Files Expected to Change — REVISED

**New files:** `js/coachDecisionSystem/evidenceEvaluator.js`; `js/coachDecisionSystem/contextualMeaningPolicy.js`; `tests/evidenceEvaluator.test.js`; `tests/contextualMeaningPolicy.test.js`.

**Modified files:** `js/stateAccess.js` (new `readGoalObjectiveContext`, `READ_OPS` entry, `PERMISSIONS.coachDecisionSystem.DECISION_PASS.reads` extension); `js/coachDecisionSystem/memoryLayer.js` (two new `assembleContext` fields); `js/coachDecisionSystem/recommendationEngine.js` (new `detectOpportunities`); `js/coachDecisionSystem/initiativeEngine.js` (new `semanticOpportunities` key and its constructing function, additive — Section 32); `js/coachDecisionSystem/internalPipelineOrchestrator.js` (new collection/handoff logic inside `run()`, corrected per Section 27); `js/derivedIntelligenceConsumer.js` (`evaluateEligibility()` lifecycle-aware branching, additive — Section 23); `tests/stateAccess.test.js`, `tests/memoryLayer.test.js`, `tests/recommendationEngine.test.js`, `tests/initiativeEngine.test.js`, `tests/internalPipelineOrchestrator.test.js`, `tests/coachDecisionSystemWiring.test.js`, `tests/derivedIntelligenceConsumer.test.js` (extended).

**Explicit No-Touch Areas:** `eligibilityEvaluator.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyIntegrationPort.js`, `safetyLayer.js`, `recommendationCategories.js`, `deliveryIntentContract.js`, `expressionInputGate.js`, `expressionRenderingContext.js`, `expressionRenderer.js`, `registerCoachDecisionSystem.js`, `js/engineRegistry.js`, `js/persistenceGateway.js`, `js/memory.js`, `functions/*`, `docs/tasks/B5/B5_SPEC_v1.0.md` (document unmodified — only its already-approved, already-canonical branching is implemented in code), `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md`, `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`.

------------------------------------------------------------------------

# 40. Migration, Rollout, and Observability **(Preserved, updated)**

**Migration:** none required — no durable schema change, no data migration.

**Rollout:** no `APP_VERSION` bump is implied by this SPEC alone. This SPEC's real path (Section 22) does produce a genuine, live Decision Pass Silence outcome once implemented — this is user-invisible (Silence produces no Delivery Intent, Section 28) but is a real, correct functional change; `APP_VERSION` policy at actual closure is a closure-time determination (Section 43), not decided here.

**Observability:** `opportunitiesConsidered` SHALL additionally record each Stage-4 outcome (`SUFFICIENT`/`INSUFFICIENT`, `evidenceTier`) and, where applicable, the resolved `validReasonCategory` and `trustTestSignal.glad` per Detected Opportunity — an additive extension of an already-existing trace mechanism.

------------------------------------------------------------------------

# 41. Test Strategy — REVISED

| Category | Required Coverage | Traces To |
|---|---|---|
| Unit | `readGoalObjectiveContext`; `RecommendationEngine.detectOpportunities`; `ContextualMeaningPolicy.computeContextualMeaning`; `ContextualMeaningPolicy.deriveValidReasonCategory`; `InitiativeEngine`'s new `semanticOpportunities` construction; B5's corrected `evaluateEligibility()`; `EvidenceEvaluator.evaluate` (every tier × outcome); `buildEligibilityAndCandidateInputs` | Sections 14, 17.1, 19-21, 23, 24-25, 27, 32 |
| Contract | `DetectedOpportunity` conformance for all three contributors' outputs, including `contextualMeaning`; `ContextualMeaning` shape conformance; `EvidenceEvaluationResult` shape; `{eligibilityInput, eligibleOpportunity}` conformance to existing closed contracts | Sections 19, 21, 24, 27 |
| Integration | `memoryLayer.js` Pipeline Context includes both new fields correctly; B5's `INITIATIVE_SUPPORT_V1` correctly admits Habit-`WEAKENING`/excludes Pattern-`WEAKENING` end-to-end into `initiativeIntelligence.signals` | Sections 12-13, 15, 23 |
| End-to-End Decision Pass (real path) | `run()` end-to-end with a real Habit `FOOD_LOGGING` establishment → `WEAKENING` transition fixture, asserting: B5 admits the signal; Initiative Engine constructs a complete `DetectedOpportunity`; Stage 4 classifies it `SUFFICIENT`/`REPEATED_BEHAVIOUR`; Stage 5 resolves `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` (never `MALFORMED`); the Decision Pass resolves Silence; the same fixture, re-run, produces the byte-identical result | Section 22, 29 |
| Regression | Full existing suite passes unchanged; empty-signal cycle still produces today's exact Silence path; existing `ACTIVE`/`CONFIRMED` B5 admission and `detectConfirmedPatternAnticipation()` output are byte-identical; `minimumConfidence` (0.65) is unchanged for every policy/lifecycle combination other than the one new branch | Sections 23, 32, 35 |
| Negative | Malformed/throwing StateAccess read; a contributor's detection function throwing; an `INSUFFICIENT` Detected Opportunity never reaching Stage 5; a Pattern-derived `WEAKENING` signal never reaching `semanticOpportunities`; a non-`FOOD_LOGGING` or non-`WEAKENING` Habit signal never producing a Reason other than `NO_VALID_REASON`; `NO_VALID_REASON` never producing a `DetectedOpportunity` at all (so never `MALFORMED` at Stage 5) | Sections 20-21, 23, 26, 37 |
| Boundary | Zero Detected Opportunities across all three contributors; exactly one sufficient Opportunity (the V1 path); a Safety-sourced Opportunity bypassing Stage 4/5 correctly; confidence exactly at/below B5's admission boundary for Habit-`WEAKENING` (admitted regardless, per the structural-guarantee branch) | Sections 18.2, 22-23, 26 |

New tests follow existing naming/invocation conventions exactly (`<module>.test.js`, `node --test`), per SAS Testing Requirements. The thirty acceptance items enumerated in this task's own governing instructions are each covered by at least one row above; a consolidated cross-reference is maintained in Section 45.

------------------------------------------------------------------------

# 42. Acceptance Criteria — REVISED

1. `run()` no longer hardcodes `opportunities: []` — it is populated from real Stage-3/4 processing.
2. At least one real, non-fixture, non-test-only production signal path exists end-to-end from real food-logging history through Stage 5 to an honest Silence (Section 22).
3. All three canonical Stage-3 contributors have a valid, live dispatch/integration path (Section 17).
4. `OpportunityEligibilityInput`, `EligibleOpportunity`, `InitiativeCandidate`, `RecommendationCandidate`, and the Terminal Decision contract are byte-identical to their pre-SPEC shapes (Section 21.4).
5. No seventh collaborator, no new Engine Registry entry, no new trigger type exists post-implementation (Contextual Meaning/Product Reason Policy are internal utilities, not collaborators — Section 8 item 6).
6. Every existing, currently-passing test still passes unchanged (regression, Section 35).
7. `evidenceEvaluator.js` and `contextualMeaningPolicy.js` exist, are pure, and are independently unit-testable exactly as `eligibilityEvaluator.js` already is.
8. Pipeline Context carries `goalObjectiveContext`/`currentStateContext` with correct, honest availability semantics.
9. `trustTestSignal.glad = null` with an honest, non-fabricated basis is the correct v1 outcome for the real path — not a placeholder (Section 8 item 12).
10. **NEW** — No `DetectedOpportunity` is ever constructed with `validReasonCategory: null`; `NO_VALID_REASON` never reaches Stage 5 at all.
11. **NEW** — No `MALFORMED` outcome occurs on the real path's happy path; the real path resolves `INELIGIBLE`/`TRUST_TEST_UNCERTAIN`.
12. **NEW** — B5's Habit-derived `WEAKENING` admission and Pattern-derived `WEAKENING` exclusion for `INITIATIVE_SUPPORT_V1` are both independently, deterministically tested (Section 23).
13. **NEW** — No automatic mapping exists from any Observation to any of the other six D1-IE-01 Reasons.
14. **NEW** — `minimumConfidence` (0.65) is not globally lowered; it continues to govern `ACTIVE`/`CONFIRMED` admission and Pattern-derived signals unchanged.

------------------------------------------------------------------------

# 43. Definition of Done **(Preserved)**

Per SAS: implementation complete as documented; all required tests (Section 41) passing; regression passing; `Roadmap.md`/`Changelog.md`/`FITME_ARCHITECTURE_v1.md` updated at actual closure (not now); both Product and Architecture sign-off recorded; task marked closed. **Not evaluated now** — DONE is a closure-time determination.

------------------------------------------------------------------------

# 44. Open Items — REVISED (Former Blocking Prerequisite Now CLOSED; Remainder Non-Blocking)

**PDP-1 and PDP-2 from the prior draft are removed** — both are resolved by CSF (Section 1, Revision note). No Product Decision Pending item remains open in this revision.

## BLOCKING PREREQUISITE — Habit Lifecycle Establishment Correction (CSF Ch.29) — CLOSED / IMPLEMENTED / VERIFIED

**This prerequisite is now closed.** G-2 Engineering Readiness Review had found `WEAKENING` empirically unreachable for `period:'weekly'` Habit signals — including the exact `FOOD_LOGGING`/`log-consistency` signal this SPEC's V1 rule and first real production path (Sections 20-22, 25.1) depend on — under the then-current, unmodified `habitEngine.js`. The Head of Product + AI Architect approved a durable, generic correction (`docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` Chapter 29): a Habit record gains `everEstablishedHistorically`/`firstEstablishedAt` (permanent Historical Fact, no current authority) and `currentEpisodeEstablished`/`currentEpisodeEstablishedAt` (resettable Current-Episode Establishment Authority, the actual basis this SPEC's Sections 19/20/22/25.1 cite), reusing every existing numeric constant unchanged, with the corresponding additive extension to B5's `DerivedSignal.provenance` contract (`docs/tasks/B5/B5_SPEC_v1.0.md` §15.4).

**This correction is now IMPLEMENTED AND VERIFIED (CSF Ch.29.7).** All three closure conditions are met: (a) CSF Ch.29's four new Habit-record fields are implemented in `js/engines/habitEngine.js`; (b) `js/derivedIntelligenceConsumer.js`'s `normalizeHabitRecord()` passes `currentEpisodeEstablished`/`currentEpisodeEstablishedAt` through into `signal.provenance`; and (c) `currentEpisodeEstablished === true` is verified reachable for a real `log-consistency` signal via a genuine establish→degrade→`WEAKENING`→`INACTIVE` cycle — driven through the real, unmodified-elsewhere `runHabitEngine()` on production-backed (non-fixture) simulated data, exceeding the fixture-driven bar originally specified as acceptable, with recovery and re-establishment also verified. Full repository regression (1816/1816) is green. **This closes the Chapter 29 prerequisite specifically. It does not, by itself, authorize G-2 implementation** — the G-2 real-path acceptance criterion (Section 42 item 2) still requires real production data end-to-end, which requires G-2 itself (Sections 23, 32) to be implemented, and `G2_SPEC_v1.0.md` must separately return through its own Engineering Readiness / authorization gate before that implementation begins.

**Ownership:** Engineering implemented CSF Ch.29 as its own, separately-scoped work item (not part of this SPEC's own file list, Section 39, which remains unaffected by this correction — Sections 19-32's contracts did not change). No further Product or Architecture decision was required for CSF Ch.29 itself. Head of Product + AI Architect Implementation Closure Review: **PASS.**

## RG-1 — Repository Gap: Recommendation Engine's Decision-Window Detection Algorithm **(Preserved, non-blocking)**

No canonical source defines the concrete condition, threshold, or signal that constitutes a live Decision-Window-sourced Opportunity (Section 17.1). Non-blocking per `G2-RA-19`'s explicit allowance for an honest, permanently-empty detector. Required resolution: a future, separately-scoped detection-algorithm decision, not part of this SPEC.

## RG-2 — Repository Gap: Disruption/Milestone-Recovery Data Sources **(Preserved)**

Inherited unchanged from TASK-005 (`T005 §36`); no calendar/milestone/setback data source exists in this repository. Non-blocking, not reopened here.

## Future Item 1 — Pattern-Derived `WEAKENING` Support

Explicitly deferred by CSF Ch.27.2 pending a future, additive decision if explicit provenance becomes sufficient. Not decided or attempted here.

## Future Item 2 — Affirmative Trust Foundation

No affirmative Trust source is approved (CSF Ch.18/26.5, Section 21.2). A future Product/Architecture decision may introduce one; this SPEC does not anticipate its shape.

## Future Item 3 — Additional Product Reason Policy Rules

The other six D1-IE-01 Reasons remain `NO AUTOMATIC V1 RULE` (CSF Ch.13, Ch.26.6). Future rules, if approved, extend `contextualMeaningPolicy.js`'s `deriveValidReasonCategory()` additively — this SPEC's design does not require redesign to add one.

## Future Item 4 — Deferred Goal/Weight/Protein Semantic Expansions

`PD-1`/`PD-2`/`PD-4`/`AD-Detail-3` (CSF Ch.11-12) remain deferred/non-blocking, per CSF's own closure. Not addressed here.

## Future Item 5 — Decision Window Closing Criterion

Remains explicitly unresolved and non-load-bearing (`AD-G2-01` `G2-RA-09`). Not addressed here.

## No Canonical Conflict identified

The Pre-Authoring Contradiction Gate (checks A–L, performed before this revision was authored) found no unresolved contradiction between CSF, G2P, and D1/D2/D3/T005/T006/SL-001/Expression; between the revised `DetectedOpportunity` contract and any existing enum/contract; between the proposed Stage-3 wiring and the exactly-three-contributor rule; or between this revision and any stale assumption named in the mandatory final self-review (Section 51). See Section 51.

------------------------------------------------------------------------

# 45. Traceability Matrix — REVISED

| Required Coverage Item | Section |
|---|---|
| Purpose | 2 |
| Problem Statement | 6 |
| Canonical Authority/Dependencies | 3 |
| Scope | 7 |
| Explicit Non-Scope | 8 |
| Current-State Baseline | 9 |
| Target Architecture / End-to-End Runtime Flow | 11 |
| Pipeline Context extensions | 12-13, 15-16 |
| Goal/Objective Context contract | 12 |
| Current-State Context contract | 13 |
| StateAccess read contracts | 14 |
| Memory Layer assembly behavior | 15 |
| Availability/unavailable semantics | 16 |
| Stage-3 responsibilities | 17 |
| Stage-3 aggregation (mechanical only) | 18 |
| **Contextual Meaning contract** | **19** |
| **Contextual Meaning V1 deterministic rule (alignment/trajectory)** | **20** |
| **Product Reason Policy** | **21.1** |
| **Trust Test Signal (v1)** | **21.2** |
| Detected Opportunity contract | 21.3-21.4 |
| First real production path | 22 |
| **B5 lifecycle-aware eligibility (required implementation)** | **23** |
| Stage-4 Evidence Evaluation component | 24 |
| Evidence sufficiency / tier classification (incl. WEAKENING) | 25 |
| Insufficient-evidence termination | 26 |
| Stage-4 → Stage-5 handoff (corrected) | 27 |
| Downstream boundary preservation | 28 |
| Internal Pipeline Orchestrator changes | 29 |
| Decision Engine changes | 30 |
| Recommendation Engine changes | 31 |
| **Initiative Engine changes (corrected from "None")** | **32** |
| Safety Layer integration | 33 |
| Memory/StateAccess/Registry/Expression/Persistence impact | 34 |
| Backward compatibility | 35 |
| Determinism/idempotency | 36 |
| Failure behavior | 37 |
| Invariants | 38 |
| Files expected to change | 39 |
| Migration/rollout/observability | 40 |
| Testing strategy | 41 |
| Acceptance Criteria | 42 |
| Definition of Done | 43 |
| Open Items (one blocking prerequisite, remainder non-blocking) | 44 |
| Documentation updates | 46 |
| READY/DONE definitions | 47-48 |
| Review checklists | 49-50 |
| Self-review | 51 |
| Handoff | 52 |
| Closure Record | 53 |

------------------------------------------------------------------------

# 46. Documentation Updates Required (At Implementation Closure, Not Now) **(Preserved)**

`docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`, `docs/architecture/FITME_ARCHITECTURE_v1.md` — to be updated only once implementation actually closes (DONE). Not performed by this authoring task.

------------------------------------------------------------------------

# 47. READY Definition — REVISED

Per SAS: this SPEC reaches READY only after Product Review and Architecture Review confirm no remaining open item blocks implementation. **This revision carries no open Product Decision Pending item** — CSF's closure resolved both PDP-1 and PDP-2, and CSF Ch.29 resolves the subsequently-discovered Habit lifecycle issue as an already-approved Product + Architecture decision. **The external prerequisite this SPEC's own contracts (Sections 19-32) depended on (CSF Ch.29, Section 44 "Blocking Prerequisite") is now CLOSED — implemented and production-backed verified (Ch.29.7).** This closure removes that specific dependency; it does **not**, by itself, move this SPEC to READY or authorize G-2 implementation to begin. **This SPEC still does not mark itself READY** — it must separately return through its own post-prerequisite Engineering Readiness / authorization gate (re-confirming Sections 19-32's contracts against the now-closed prerequisite, and re-affirming no other open item blocks implementation) before **G-2 implementation** may begin.

------------------------------------------------------------------------

# 48. DONE Definition **(Preserved)**

Per SAS Section on DONE Requirements. Evaluated only at actual closure.

------------------------------------------------------------------------

# 49. Product Review Checklist

*(Owned exclusively by Head of Product. Not filled in or self-certified by Engineering.)* Items most likely to require Product attention: confirmation that the V1 Product Reason Policy rule (Section 21.1) is implemented exactly as CSF Ch.26 approved, with no expansion; confirmation that the `Alignment: UNKNOWN` determination (Section 20) is an acceptable, non-arbitrary reading of CSF Ch.26.4's "`NEUTRAL` or `UNKNOWN`" language; confirmation that `trustTestSignal.glad = null` resolving to a real, live Silence is acceptable production behavior, not a defect.

------------------------------------------------------------------------

# 50. Architecture Review Checklist

*(Owned exclusively by AI Architect. Not filled in or self-certified by Engineering.)* Items most likely to require Architecture attention: the `ContextualMeaning`/`DetectedOpportunity` contract design (Sections 19, 21); confirmation that `contextualMeaningPolicy.js`'s placement and boundary satisfy `CSF-08`'s closed constraint list; the B5 lifecycle-aware branching change's ownership and scope (Section 23); RG-1 (Section 44). **Already explicitly approved, not requiring further Architecture attention:** the Stage-4 `REPEATED_BEHAVIOUR` Evidence-tier mapping for Habit-derived `WEAKENING` (Section 25.1); the Habit Lifecycle Establishment Correction itself (CSF Ch.29, Section 44 "Blocking Prerequisite — CLOSED") — approved, implemented, and production-backed verified (Ch.29.7); no further Architecture attention required.

------------------------------------------------------------------------

# 51. Engineering Self-Review Checklist — Mandatory Final Self-Review

Performed after the complete revision above, per the governing instructions for this task: a targeted stale-assumption search was conducted across the entire revised document for each of the following, with the result recorded:

- `validReasonCategory: null` (as a happy-path value) — **not found.** Section 21.1/21.3/27 guarantee no `DetectedOpportunity` is ever constructed with a null `validReasonCategory`.
- `Initiative Engine Changes: None` — **corrected.** Section 32 now specifies the required, additive change.
- Old CONFIRMED_PATTERN-only first path (i.e., a path that stops at a descriptive signal without Contextual Meaning/Reason construction) — **not found as the terminus of the real path.** Section 22 traces the full semantic construction chain; `detectConfirmedPatternAnticipation()`'s own descriptive-only output (`ACTIVE`/`CONFIRMED`) remains, correctly, non-Stage-5-bound, since no Reason Policy rule covers it (Section 21.1).
- MALFORMED as expected happy-path behavior — **not found.** Section 5.5/9/21.3/27 identify and correct this exact prior-draft error; Section 22's trace shows `INELIGIBLE`/`TRUST_TEST_UNCERTAIN`, not `MALFORMED`.
- Old PDP-1 — **removed.** Section 44.
- Old PDP-2 — **removed.** Section 44.
- Pattern-derived `WEAKENING` inclusion — **not found.** Section 8 item 10, Section 23, Section 38 ("No-Pattern-WEAKENING invariant") all explicitly exclude it.
- Historical-confidence reconstruction — **not found.** Section 19 (`basis.observation.confidence`), Section 23, and Section 25.1 all explicitly state current (decayed) confidence is preserved honestly, never reconstructed.
- Global lowering of 0.65 — **not found.** Section 23's Explicit Non-Scope and Section 42 item 14 both explicitly forbid it; Section 41's regression coverage tests it directly.
- Direct `goalKcal`/`consumed` deviation inference — **not found.** Section 20 explicitly states `goalObjectiveContext`/`currentStateContext` are `NOT_CONSULTED` for the V1 rule; no deviation logic against them exists anywhere in this revision.
- Invented Trust inference — **not found.** Section 21.2/Section 38 ("No-affirmative-Trust invariant") fix `glad: null` as the only value this design ever produces for the V1 path.
- Orchestrator-created semantics — **not found.** Section 18.2 explicitly corrects the prior draft's generic-normalization model and forbids the Orchestrator from constructing any semantic field.
- Any claim G-2 is already implemented — **not found.** Section 1, Section 43, Section 47-48 all state this SPEC is a Draft, not yet READY, and implementation has not begun.
- Any claim B5's newly-approved behavior is already live before G-2 implementation — **not found.** Section 9 and Section 23 explicitly document, with line-level repository evidence, that `derivedIntelligenceConsumer.js`'s `evaluateEligibility()` does **not** yet implement the lifecycle-aware branching, and that this is a required, not-yet-performed implementation step.

**Cross-check performed** against the Coach Semantic Foundation Package, G2P, B5_SPEC, D1, D2, D3, TASK-005, TASK-006, and the actual implementation contracts read during this authoring session (Section 9) — no remaining contradiction found.

**Canonical Review corrections verification (prior pass):** the complete document was re-read after applying both corrections. Confirmed: Habit-derived `WEAKENING` → `REPEATED_BEHAVIOUR` (Section 25.1) was explicitly attributed to that G-2 Canonical Review's own approval, not to CSF having already fixed the Stage-4 tier itself. Confirmed: Pattern-derived `WEAKENING` remains excluded from v1 and receives no tier mapping. Confirmed: current (decayed) confidence remains honest and unmodified. Confirmed: `NOT_CONSULTED` is no longer conflated with `UNAVAILABLE`/`UNCERTAIN`.

**Habit Lifecycle Establishment Correction verification (this pass):** the complete document was re-read after applying this correction. Confirmed: every citation of the old `statusOf()`-branch-order-only reasoning (Sections 19, 20, 22, 25.1) instead cites `provenance.currentEpisodeEstablished === true` (CSF Ch.29) as the actual basis. Confirmed: no numeric threshold (`WINDOW_DAYS`, `OCC_CONFIRMED`, `CONF_CONFIRMED`, `INTERVAL_WEEKLY`, `INERTIA`, or any `statusOf()` ordering) is described as changed anywhere in this document. Confirmed: Pattern Engine is not mentioned as redesigned anywhere. Confirmed: no new Engine, collaborator, or Registry entry was introduced. Confirmed: `everEstablishedHistorically`/`firstEstablishedAt` (the permanent Historical Fact fields) are not cited anywhere in this SPEC as a basis for Contextual Meaning, Reason, Trust, or eligibility — only `currentEpisodeEstablished`/`currentEpisodeEstablishedAt` are, per CSF Ch.29's own Coach-facing boundary decision.

**Closure verification (this pass, following CSF Ch.29's implementation and production-backed verification):** the complete document was re-read again after this closure-synchronization correction. Confirmed: every prior "not yet implemented"/"APPROVED, NOT YET IMPLEMENTED" citation of CSF Ch.29 anywhere in this document (Section 1, 9, 19-22, 25.1, 39, 44, 47) now accurately states CLOSED / IMPLEMENTED AND VERIFIED. Confirmed: no section anywhere claims G-2 itself is implemented. Confirmed: no section anywhere automatically declares G-2 READY FOR IMPLEMENTATION as a consequence of Chapter 29's closure — Section 1's Status line, Section 44's "Blocking Prerequisite — CLOSED," and Section 47's READY Definition all consistently state that G-2 implementation itself remains **NOT IMPLEMENTED** and requires its own separate Engineering Readiness / authorization gate. Confirmed: `provenance.currentEpisodeEstablished === true` remains the sole cited establishment-authority basis for G-2's `REPEATED_BEHAVIOUR` mapping (Section 25.1) — the old `statusOf()` branch-order inference is not reinstated anywhere. Confirmed: no production code, test file, or Product/Architecture decision document was modified by this closure pass beyond the additive status synchronization recorded in CSF Ch.29.7's own "Documents Affected" (`docs/architecture/FITME_ARCHITECTURE_v1.md`, `docs/tasks/B5/B5_SPEC_v1.0.md`, this document, `docs/roadmap/Changelog.md`). No other section was substantively altered; no contradiction was introduced.

- [x] Every section above states a requirement, not a narrative of how it was derived (with the sole, permitted exception of this Section 51's own self-review record and the Revision Note in Section 1, both structurally required by this task's own instructions and consistent with SAS's Closure-Record-only exception being extended here, by the task's own explicit instruction, to this mandatory self-review).
- [x] No section introduces an unauthorized Product, Architecture, or scope decision — every normative statement cites CSF/G2P/D1/D2/D3/T005/T006/SL-001/B5 or verified repository evidence.
- [x] No existing contract's shape is altered (Section 8 item 8, Section 35).
- [x] No seventh collaborator, Engine Registry entry, or second orchestrator is introduced (Sections 8, 34, 38).
- [x] Every Stage-3 contributor's boundary (`G2-RA-04`) is preserved exactly.
- [x] No implementation code was written; no test code was written; no existing file was modified during authoring.
- [x] This document does not mark itself READY or DONE.

------------------------------------------------------------------------

# 52. Engineering Handoff **(Preserved)**

Not yet assembled — this SPEC has not reached READY (Section 47). Once Head of Product + AI Architect review this revision, the handoff package will be assembled per SAS's Engineering Handoff Requirements.

------------------------------------------------------------------------

# 53. Closure Record

*(Empty. Per SAS: written once, at actual task closure, never pre-filled during authoring.)*

------------------------------------------------------------------------

# 54. Global Forbidden Changes **(Preserved)**

Applies globally, not narrowed by any more-specific-sounding section above: no redesign of product behavior, coaching philosophy, or AI personality; no redefinition of architecture, runtime ownership, orchestration, or any previously approved contract; no change to an authority boundary, ownership assignment, or execution order already fixed; no new system/engine/registry/architectural layer without canonical approval; no speculative behavior not supported by evidence; no unilateral resolution of any open item by inference; no self-certification of READY/DONE or of the Product/Architecture review checklists; no reopening of any CSF or G2P decision.

# End of Specification — DRAFT. Canonical Review PASSED (Product + Architecture APPROVED). Not Canonical. Not READY. The prior blocking prerequisite — CSF Ch.29 (Habit Lifecycle Establishment Correction) — is now CLOSED / IMPLEMENTED / VERIFIED (Ch.29.7). G-2 implementation itself remains NOT IMPLEMENTED and requires its own separate Engineering Readiness / authorization gate. Not authorized for implementation.
