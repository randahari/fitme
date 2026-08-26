# RGEF SPEC v1.0 — Relationship-Guided Engagement Foundation

# 1. Status

- Version: 1.0
- Status: **IMPLEMENTED / VERIFIED / CLOSED (2026-08-26).** Authored per explicit authorization from Head of Product + AI Architect following the POST-G-2 CANONICAL NEXT WORK ITEM INVESTIGATION, the AFFIRMATIVE TRUST ARCHITECTURE IMPACT REPORT, the FITME CANONICAL RELATIONSHIP & ENGAGEMENT RETRIEVAL REPORT, the RELATIONSHIP-GUIDED ENGAGEMENT ARCHITECTURE REPORT, the ARCHITECTURE DECISION CHALLENGE REPORT, the G-2 SOURCECATEGORY RECLASSIFICATION REVIEW, and the RELATIONSHIP-GUIDED ENGAGEMENT FINAL SPEC READINESS REPORT (verdict: READY FOR SPEC); subsequently completed Canonical Review, Engineering Readiness Review, and Product/Architecture approval; implemented across WP1–WP8 (Section 27); production-backed verified against every Section 28/28.1 acceptance criterion; see Section 32 (Closure Record) for full evidence.
- Authored by: Lead Engineer / Repository Analyst / SPEC Author, per the authority granted by Head of Product + AI Architect for this task.
- Authority for approval: Head of Product + AI Architect (Canonical Review, Product Approval, Architecture Approval, READY determination — none of which this document performs on its own authority).
- Repository baseline: `main`, commit `02314b1e6052eb968de36f270c96f278b072ac72` (`feat(g2): implement live opportunity recognition path`), test baseline 1896/1896 passing (per G-2 Closure Record; not independently re-run by this authoring activity).
- Governing meta-standard: `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`.
- **Focused Correction Record (this pass):** Following Product + Architecture + Canonical Review of the original draft, two corrections were required and applied, with no other section substantively altered: **(1)** Section 16 originally derived feedback-attribution `opportunityId` from `opportunitiesConsidered` — a trace of every Opportunity considered in a Decision Pass, not a reliable identifier of which one produced the winning Candidate. Corrected to derive `opportunityId` from `terminalDecision.candidateProvenance[0].opportunityId`, an already-existing, unmodified production field verified to survive, byte-identical, from `InitiativeCandidate` construction through Stage 7 (Prioritization), Stage 8 (Winner Selection), and Stage 9 (Decision Formation) to the object `internalPipelineOrchestrator.js`'s `run()` already returns alongside the Delivery Intent — requiring no new contract, no DeliveryIntent extension, and no heuristic. **(2)** Section 18 originally labeled its `windowDays: 90`/`patternThreshold: 2` values "Engineering defaults." Head of Product / AI Architect determined these values directly shape observable coaching/learning behavior and are therefore Product-relevant, not Engineering-owned; Head of Product has now approved, as an explicit RGEF V1 Product decision, reuse of the existing, already-approved `RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1` (`windowDays: 14`, `patternThreshold: 3`, existing `overrideTypes` mechanics) in place of the invented values. **Engineering Readiness Review** subsequently found two further defects, both corrected in this pass, with no other section substantively altered: **(3)** Section 16.4 proposed reusing the `triggerEngine.DAILY_COACH_CHECK` StateAccess identity for Initiative-surface feedback writes — found to be real ownership leakage (falsely-attributed `metadata.engineId`), corrected to an honestly-authorized `PERMISSIONS.coachDecisionSystem.DECISION_PASS.writes: ['recordRecommendationFeedback']` grant. **(4)** Section 16.3 assumed `presentDeliveryIntent()` could rely on `presentTriggerCard()`'s existing dismiss handler — verified false against `triggerEngineAdapter.js`'s actual execution order and `ensureTriggerCardDismissButton()`'s actual binding logic, which in the common case leaves the Composite Initiative's card with no dismiss control at all (a UX-12.5 violation). Corrected per Head of Product / AI Architect's Shared Coach Card Architecture Decision: Composite Initiative is authoritative over `#trigger-card` when presentable in the same cycle, and `presentDeliveryIntent()` now owns its own Dismiss-control creation and binding, never inheriting Trigger's. The Changelog's prior citation of this gap as falling under TASK-007's OD-5 was also found inaccurate (Section 5.8) — OD-5 concerns a different, broader, still-open cross-element question. **(5)** During WP7 implementation, Section 19.1's design was found to require `initiativeEngine.js` to depend on `js/feedback/feedbackDomain.js` for the first time — directly contradicting `initiativeEngine.js`'s own existing header text and an existing, passing test asserting no such dependency may exist (TASK-005 §36 Repository Gap A-2, deliberately left open). Head of Product + AI Architect approved a bounded Architecture Decision explicitly resolving A-2 for exactly this one capability (Sections 5.4, 5.6, 19.1) — `wasIgnoredBefore()` remains local and unchanged; no other `FeedbackDomain` capability is granted to Initiative Engine; TASK-005's original A-2 text is preserved as historically accurate, not corrected. This document is corrected accordingly. Still **DRAFT — AWAITING FINAL CANONICAL REVIEW.**

------------------------------------------------------------------------

# 2. Purpose

This SPEC converts a sequence of closed Product and Architecture decisions — reached across the six investigation/review rounds cited above — into one complete, implementation-ready Work Item establishing the first production foundation through which FITME may: engage a user proactively from early in the relationship, in a bounded and honest way; preserve the existing, unweakened meaning of `trustTestSignal.glad`; respect Relationship-Maturity-earned scope; observe the user's actual explicit response; attribute that response reliably to the Domain/Topic it concerned; and let repeated, real patterns — never a single event — inform future engagement.

This SPEC does **not** redefine FITME's coaching philosophy, does not reopen G-2 or any other closed Canonical or Architecture Decision, does not introduce a sixth Opportunity Source, does not implement a Relationship-Maturity progression algorithm, and does not implement production-backed silent `Ignored` detection. It authors requirements only; it does not implement them.

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
| G2P | `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` |
| CSF | `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` |
| G2 | `docs/specs/G2_SPEC_v1.0.md` |
| B5 | `docs/tasks/B5/B5_SPEC_v1.0.md` |
| EXPR | `docs/specs/EXPRESSION_SPEC_v1.0.md` |
| C2 | `docs/specs/C2_SPEC_v1.1.md` |
| B3 | `docs/tasks/B3/B3_SPEC.md` (StateAccess) |
| SAS | `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` |
| ARCH | `docs/architecture/FITME_ARCHITECTURE_v1.md` |
| Constitution | `docs/constitution/FITME_AI_Constitution_v1.0.md` |
| Coach Bible | `docs/governance/FITME_Coach_Bible.md` |

## 3.2 Precedence

Where two sources overlap, the more specific governs (SAS, Canonical Source Requirements). D1 Units 04/05/06/09/11/13 remain the controlling policy authority for every substantive rule this SPEC wires; this SPEC introduces no new policy, only the wiring and gating refinements explicitly authorized by the six investigation/review rounds cited in Section 1. G2 remains the controlling authority for the one live Opportunity this SPEC consumes; this SPEC does not modify G2's own contracts.

## 3.3 No Reopening of Closed Decisions

This SPEC does not reopen, reinterpret, narrow, or widen: any G2P Canonical/Architecture Decision, any CSF chapter, G2's own `sourceCategory`/`validReasonCategory` classification (Section 22 of G2), any TASK-004/005/006 Canonical Decision (including `CD-T005-02` — no `category` field on `InitiativeCandidate` — and `CD-T006-01` — the closed Stage-5 `OpportunityEligibilityInput` field set), any SL-001 RCD, or D1 Unit 05's closed, five-item Canonical Opportunity Sources taxonomy. `CD-G2-01`'s explicit closure ("no sixth source is introduced") is treated as binding and unmodified by this SPEC.

------------------------------------------------------------------------

# 4. Ownership and Decision Boundaries

Per SAS, this SPEC distinguishes Head of Product decisions, AI Architect decisions, Lead Engineer responsibilities, and repository evidence. Every ownership assignment below either (a) restates an already-approved canonical assignment unchanged, or (b) is a mechanical engineering-fill consequence of one of the thirteen Architecture decisions (A1–A13) and four Product decisions (P1–P4) approved in the conversation preceding this SPEC. No section below assigns ownership of a capability that does not already have one, and no section resolves a Product or Architecture question left open by those decisions — Section 46 records what remains genuinely open (none of it blocking).

------------------------------------------------------------------------

# 5. Relationship to Previous Work

## 5.1 D1 — Units 04, 05, 06, 09, 11, 13 **(Preserved)**

Governs the substantive policy this SPEC wires, unchanged. This SPEC adds no Opportunity Source (Unit 05), no new Evidence Hierarchy tier (Unit 11), and no new Product Reason (Unit 06/D1-IE-01). It operationalizes D1-IP-02 (Relationship-Maturity gating), D1-IP-08 (no punishing silence), D1-IP-10 (per-category learned preference), D1-USM-04 (evidence-only maturity advancement — not implemented here, only not violated), D1-ER-02/D1-SP-04 (single-event discipline), and D1-PER-01/06 (personalization earned, no cross-user overlearning).

## 5.2 D2/D3 — Stage definitions, Composite Engine architecture **(Preserved)**

Stage 5 (Eligibility) and Stage 6 (Candidate Generation) remain distinct Stages with distinct orchestration authority (D2 Unit 07; D3 §17 Decision 1). This SPEC adds no new Stage, no new Engine Registry entry, and no second orchestration authority.

## 5.3 G2 — the one live Opportunity **(Preserved, consumed unchanged)**

G2's `DetectedOpportunity` (`initiativeEngine.js:374-397`) already carries `sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION'` and `validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'`. This SPEC changes neither value, neither field, nor any G2 file (`contextualMeaningPolicy.js`, `evidenceEvaluator.js`) or G2 test. This SPEC's only addition to G2's own construction site is the additive Domain/Topic field propagation defined in Section 15 — a non-breaking extension of the same object, not a change to any existing field.

## 5.4 TASK-005 — Initiative Engine, `MATURITY_GATING`, `wasIgnoredBefore()` **(Modified, additively — including a narrow, explicit resolution of Repository Gap A-2)**

`initiativeEngine.js`'s `categoryPermittedAtStage()` (lines 170-173) and `MATURITY_GATING` (lines 119-124) are extended, not replaced — the existing one-dimensional table remains the default for every Source×Reason combination this SPEC does not explicitly authorize a change for (Section 13). `generate()`'s existing validation, hierarchy-tier, Initiative-policy, and Candidate-construction logic is otherwise unmodified. TASK-005's §36 item E-2 ("Default behavior when Relationship Maturity Stage is unknown/unreliable... escalate to Head of Product if the default itself is judged to be a product decision") is resolved by P1 (Section 1 of this document) for the Observer-stage case this SPEC touches; it is not resolved in general.

**Repository Gap A-2 (`TASK_005_SPEC_v1.0.md` §36, "Extending C2's suppression mechanism to an Initiative surface") is now explicitly, narrowly resolved by RGEF, for exactly one capability.** A-2 was correctly left open by TASK-005 — at that time, no Product/Architecture authority existed for Initiative Engine to depend on `feedbackDomain.js`, and `initiativeEngine.js`'s own header and the closed-contract test asserting no such dependency exists were both accurate statements of the then-current, correctly-scoped boundary. RGEF now supplies that missing authority, **for the Domain/Topic receptiveness capability only** (Section 19): `initiativeEngine.js` is authorized to `require('../feedback/feedbackDomain.js')` and call `FeedbackDomain.evaluateDomainTopicReceptiveness()`. This resolution is deliberately narrow and does **not**: move `wasIgnoredBefore()` (D1-IP-08's exact-Opportunity-id check, Section 17) into `feedbackDomain.js` or otherwise change it — it remains local, self-contained, and independent, exactly as before; grant Initiative Engine access to any other `FeedbackDomain` capability; merge Trigger/Adaptive-TDEE suppression semantics with Initiative's; or resolve TASK-005's separate, still-open G-3 Repository Gap. TASK-005 was correct as originally authored — this is a later, additional grant of authority for one new, specific use case RGEF introduces, not a correction of a prior error.

## 5.5 TASK-006 — Decision Engine, `eligibilityEvaluator.js`, `CD-T006-01` **(Modified, additively)**

`eligibilityEvaluator.js`'s `evaluate()` (lines 88-121) gains one new, closed, narrow branch (Section 12). `validateInput()` (lines 69-82) is unmodified — no new required or optional field is added to the `OpportunityEligibilityInput` shape; the new branch is derived entirely from fields the contract already requires (`sourceCategory`, `validReasonCategory`, `trustTestSignal.glad`). `VALID_REASON_CATEGORIES` and `OPPORTUNITY_SOURCES` (lines 42-58) are unmodified.

## 5.6 C2 — `feedbackDomain.js`, suppression precedent **(Reused, extended, and now a live cross-engine dependency by approved architecture decision)**

`feedbackDomain.js`'s closed `FEEDBACK_TYPES` vocabulary is reused verbatim, unmodified. `GESTURE_TYPE` gains one new entry (Section 16). `RECOVERY_POLICIES`/`evaluateSuppression()` are unmodified; this SPEC adds one new function, `evaluateDomainTopicReceptiveness()`, to the same file, sharing `evaluateSuppression()`'s own algorithm via a common internal helper rather than duplicating it (Section 18). **This is no longer merely a structural analogy**: per Section 5.4's narrow resolution of Repository Gap A-2, `initiativeEngine.js` (Stage 6, Section 19) is now an approved, live, direct consumer of this module — the first Initiative-side dependency on `feedbackDomain.js` to ever exist, and the exact dependency TASK-005's own A-2 Follow-up anticipated as its eventual, Architecture-approved resolution path.

## 5.7 B5 — `derivedIntelligenceConsumer.js`, Domain/Topic vocabulary **(Vocabulary promoted; derivation logic unmodified)**

`DOMAINS`/`TOPICS` (lines 41, 45-46) are promoted to a new, shared module (Section 14); B5's own derivation functions (`mapHabitTopic`-equivalent logic, `PATTERN_ID_MAP`, `mapPatternTopic`) remain in `derivedIntelligenceConsumer.js`, unmodified, now sourcing their value lists from the shared module by reference. `normalizeHabitRecord()`/`normalizePatternRecord()` (lines 263-320) are unmodified. `evaluateRelevance()` (lines 418-430) is unmodified.

## 5.8 Trigger/Expression — `triggerController.js`, `deliveryIntentContract.js` **(Modified, narrowly)**

`presentDeliveryIntent()` (`triggerController.js:225-233`) is extended to retain and expose the presented Opportunity's id for feedback attribution and to own its own Dismiss control/handler (Section 16); the ordinary Trigger dismiss handler (`triggerController.js:88-106`), `presentTriggerCard()`, and `scheduleLocalNotifications()` (lines 149-162) are unmodified except for the same-cycle precedence behavior specified in Section 16.3 (Composite Initiative, when presentable, is authoritative on `#trigger-card` for that cycle). `deliveryIntentContract.js`'s `correlation`/`decisionId` semantics (EXP-53) are unmodified and are not reused as the feedback `contextId` (Section 16).

**TASK-007 OD-5 boundary (documentation accuracy, per repository investigation).** `docs/roadmap/Changelog.md`'s statement that the `presentDeliveryIntent()`/`presentTriggerCard()` `#trigger-card` coexistence question "falls under `TASK_007_SPEC_v1.0.md`'s own pre-existing, still-open OD-5" is **not accurate**, verified directly against TASK-007's own text: OD-5 (`TASK_007_SPEC_v1.0.md` §12.2, UX-12.6) governs precedence among the four *different* Home-screen DOM elements (`#trigger-card`, `#coach-card`, `#adaptive-card`, `#partial-prompt`) when more than one is simultaneously eligible — it does not address, and was authored before, two different *producers* sharing the *same* `#trigger-card` element. This SPEC's Section 16.3 resolves only the latter, narrower, same-element producer-precedence question. TASK-007's own OD-5 (broader, cross-element Home-card precedence) **remains exactly as open as before** — this Work Item does not resolve it, and Section 29's closure documentation updates should correct the Changelog's prior citation accordingly (not performed in this SPEC-authoring pass).

## 5.9 StateAccess — `stateAccess.js` **(Unmodified read side; write-path ownership decided by this SPEC)**

`coachDecisionSystem.DECISION_PASS`'s existing `reads: ['recommendationFeedbackHistory', ...]` grant (lines 417-421) already supplies everything Stage 6's new consumption needs — no new StateAccess read permission is required. The write path's ownership is fixed explicitly in Section 16.4.

------------------------------------------------------------------------

# 6. Problem Statement

**Verified repository evidence, re-confirmed at this baseline:**

1. `initiativeEngine.js`'s `MATURITY_GATING.OBSERVER = []` (line 120) admits zero Initiative `sourceCategory` values at Observer stage, and `maturityStageOf()` (lines 164-168) resolves the current, universal `relationshipMaturity.stage: 'UNKNOWN'` (`memoryLayer.js:133`) to `'OBSERVER'`. Every real user is therefore, today, mechanically excluded from ever receiving an Initiative-kind Candidate, independent of Trust.
2. `eligibilityEvaluator.js`'s `evaluate()` (lines 104-109) requires `trustTestSignal.glad === true` unconditionally; G2's only live Opportunity constructs `glad: null` unconditionally (`initiativeEngine.js:393`), because no approved affirmative Trust source exists (CSF Ch.18/26.5). G2's V1 path therefore also, independently, never clears Stage 5.
3. No production mechanism exists to attribute a user's explicit response (Dismissed, Accepted, etc.) to the specific Opportunity, Domain, or Topic that produced it: `presentDeliveryIntent()` (`triggerController.js:225-233`) does not pass the Opportunity's id into the dismiss handler, and `FeedbackDomain.GESTURE_TYPE` (`feedbackDomain.js:25-29`) has no entry for any Initiative-surface gesture.
4. `wasIgnoredBefore()` (`initiativeEngine.js:176-181`) is real, tested, correctly-reading code that has never yet observed a real `surface: 'initiative'` event, because nothing writes one.

**Combined effect:** FITME today cannot proactively engage a user at all through the Coach Decision System's Initiative path, cannot learn anything from a user's response to such engagement even in principle, and has no representation of "this kind of engagement is permitted even though Trust is not yet proven" anywhere in its closed contracts. This Work Item closes exactly these four gaps, and no others.

------------------------------------------------------------------------

# 7. Scope

1. **Stage 5** — one new, closed, narrow eligibility branch in `eligibilityEvaluator.js`, admitting a specific, mechanically-derived combination of facts already present on the closed input contract (Section 12).
2. **Stage 6** — evolution of `initiativeEngine.js`'s `MATURITY_GATING` from a one-dimensional (`sourceCategory`) table to a two-dimensional (`sourceCategory` × `validReasonCategory`) policy, for exactly one approved combination (Section 13).
3. **Domain/Topic shared vocabulary** — promotion of B5's existing `DOMAINS`/`TOPICS` value lists to a new, small, shared module reusable by future non-B5 producers (Section 14).
4. **Domain/Topic propagation** — additive fields on G2's `DetectedOpportunity` construction, carrying the already-available `observation.domain`/`observation.topic` through unchanged (Section 15).
5. **Feedback identity and attribution** — a defined `contextId` scheme for Initiative-surface feedback, a `GESTURE_TYPE` extension, and a `presentDeliveryIntent()` extension to carry Opportunity identity through to the dismiss action (Section 16).
6. **Domain/Topic pattern aggregation** — one new, pure, recompute-from-source, bounded-window function, structurally analogous to `FeedbackDomain.evaluateSuppression()` (Section 18).
7. **Stage-6 consumption** — an additive, Domain/Topic-scoped generalization of `wasIgnoredBefore()`'s existing exact-Opportunity-id check (Section 19).

------------------------------------------------------------------------

# 8. Explicit Non-Scope / Non-Goals

This SPEC explicitly does **not**:

1. Introduce a sixth D1 Unit 05 Opportunity Source, under any name.
2. Reclassify, modify, or reopen G2's `sourceCategory` or `validReasonCategory`.
3. Implement a Relationship-Maturity progression algorithm (Observer → Assistant → Trusted Coach → Personal Coach computation). The existing `UNKNOWN → OBSERVER` defensive fallback (`initiativeEngine.js:164-168`) is preserved unchanged.
4. Implement production-backed silent `Ignored` (impression/exposure → no-response) detection. `Ignored` remains a valid, distinct, closed-vocabulary `feedbackType` (`feedbackDomain.js:22`); this SPEC gives it no new producer.
5. Grant Observer or Assistant general access to `CONFIRMED_PATTERN_ANTICIPATION` for any `validReasonCategory` other than `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`.
6. Introduce a persisted `boundedEngagementBasis` field, a mutable `userPreferenceScore`, or any other new authoritative memory concept.
7. Change `trustTestSignal.glad`'s meaning, default it, or derive it from Relationship Maturity.
8. Modify Recommendation Engine, Safety Layer, Expression's rendering logic, or Expression's `decisionId` correlation mechanism.
9. Implement Stage-7 (Prioritization) consumption of Domain/Topic preference. The existing, unpopulated `trustImpact`/`problemMagnitude` placeholder fields on `InitiativeCandidate` are left exactly as they are.
10. Fix a Product-level numeric threshold, window, or scoring formula not already canonically grounded. The one numeric policy this SPEC does use (`windowDays: 14`, `patternThreshold: 3`, Section 18) is not invented here — it is `RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1`, an already-approved FITME policy (`C2_SPEC_v1.1.md`), reused by explicit RGEF V1 Product decision, not introduced or labeled as Engineering discretion.
11. Introduce a generalized presentation-arbitration/card-controller abstraction, or resolve precedence among `#trigger-card`, `#coach-card`, `#adaptive-card`, and `#partial-prompt` (TASK-007's own broader, still-open OD-5). This Work Item resolves only the narrow, same-element question of `#trigger-card` producer precedence between the ordinary Trigger path and the Composite Initiative path (Section 16.3) — such a generalized abstraction may be appropriate for a future Work Item, not this one.

------------------------------------------------------------------------

# 9. Terminology

- **Bounded Early-Relationship Engagement** — the Stage-5 eligibility path defined in Section 12, admitting a specific Opportunity despite `trustTestSignal.glad !== true`, without asserting or implying affirmative Trust.
- **Domain** — a closed-vocabulary, top-level content-area classification of what a coaching interaction concerns (e.g. `NUTRITION`), per the shared vocabulary module (Section 14).
- **Topic** — a closed-vocabulary, second-level, finer-grained classification within a Domain (e.g. `PROTEIN_INTAKE`), per the same shared vocabulary module.
- **Product Reason** (`validReasonCategory`) — D1-IE-01's closed, seven-value taxonomy of *why* an intervention is justified. Orthogonal to Domain/Topic (*what*) and to `sourceCategory` (*what evidentiary situation triggered detection*).
- **Source** (`sourceCategory`) — D1 Unit 05's closed, five-value Canonical Opportunity Source taxonomy.
- **Receptiveness Pattern** — a Domain/Topic-scoped, recompute-from-source aggregate over a bounded window of explicit feedback events, computed fresh on every read, never persisted as an independent authoritative value.

------------------------------------------------------------------------

# 10. Current-State Baseline

Restated, with exact citations, for engineer reference (no new investigation performed at implementation time should be required to re-derive these facts):

| Fact | Citation |
|---|---|
| `MATURITY_GATING.OBSERVER = []` | `initiativeEngine.js:120` |
| `maturityStageOf()` collapses `UNKNOWN`/any unrecognized value to `'OBSERVER'` | `initiativeEngine.js:164-168` |
| `eligibilityEvaluator.js` requires `glad === true` unconditionally for ordinary (non-safety-bypass) eligibility | `eligibilityEvaluator.js:104-109` |
| G2's `DetectedOpportunity` constructs `trustTestSignal: { glad: null, ... }` unconditionally | `initiativeEngine.js:392-395` |
| `CONFIRMED_PATTERN_ANTICIPATION`/`DISRUPTION_DETECTION`/`MILESTONE_RECOVERY` are Initiative-Engine-exclusive Stage-3 contributions; `DECISION_WINDOW` is Recommendation-Engine-exclusive | `TASK_005_SPEC_v1.0.md` §9.1, citing D2 Unit 07 |
| `recommendationEngine.js` contains zero references to `CONFIRMED_PATTERN_ANTICIPATION` or to Relationship-Maturity gating | direct search, this investigation |
| `coachDecisionSystem.DECISION_PASS` already has `reads: ['recommendationFeedbackHistory', ...]`; `writes: []` | `stateAccess.js:417-421` |
| `readRecommendationFeedbackHistory()` returns the full, unbounded `p.coachEvents` filtered to `kind==='feedback'` | `stateAccess.js:206-213` |
| `writeRecordRecommendationFeedback()` accepts any caller-supplied `{surface, contextId, feedbackType}` | `stateAccess.js:324-333` |
| `FeedbackDomain.GESTURE_TYPE` has entries only for `trigger:dismiss`, `adaptiveTdee:apply`, `adaptiveTdee:dismiss` | `feedbackDomain.js:25-29` |
| `wasIgnoredBefore()` checks `e.surface === 'initiative'` — currently never true in production | `initiativeEngine.js:176-181` |
| `presentDeliveryIntent()` does not receive or forward an Opportunity id to the dismiss handler | `triggerController.js:225-233` |
| B5's `DOMAINS`/`TOPICS` are populated only for Habit/Pattern-sourced signals | `derivedIntelligenceConsumer.js:41-46, 111-145, 263-320` |
| `InitiativeCandidate` has no `category` field, by closed Canonical Decision `CD-T005-02` | `initiativeEngine.js:225`, `TASK_005_SPEC_v1.0.md` §19 |

------------------------------------------------------------------------

# 11. Invariants

The following SHALL hold both before and after this Work Item's implementation, verified by regression:

1. `trustTestSignal.glad` is never set, defaulted, or mutated by this Work Item. Its only legal values remain `true`, `false`, `null`, with unchanged meaning (CD-T006-01).
2. A `glad === false` Opportunity (an explicit, non-uncertain negative Trust signal) is never admitted by the new Stage-5 branch, regardless of Source, Reason, or Relationship Maturity Stage.
3. No Opportunity carrying `sourceCategory !== 'CONFIRMED_PATTERN_ANTICIPATION'` is affected by the new Stage-5 branch or the new Stage-6 gating override.
4. No Opportunity carrying `validReasonCategory !== 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'` is affected by either new mechanism.
5. A single feedback event never, by itself, changes Stage-6 Candidate Generation for any subsequent Opportunity (D1-ER-02, D1-SP-04).
6. Negative Domain/Topic evidence for one Topic never suppresses a different Topic, or the parent Domain, or any other Domain.
7. `InitiativeCandidate`'s closed field set (`TASK_005_SPEC_v1.0.md` §19) is unmodified; no `category` field is added.
8. `OpportunityEligibilityInput`'s closed field set (`CD-T006-01`) is unmodified; no new required or optional top-level field is added.
9. `recommendationEngine.js` is not modified by this Work Item.
10. Safety Layer's Stage-3/4/5 bypass (`safetyHighRiskBypass: true`) is checked before, and independent of, every mechanism this SPEC introduces.
11. No new Engine Registry entry, no new Composite Engine, no second orchestration authority is introduced.
12. No aggregation function introduced by this Work Item scans a user's full, unbounded lifetime `coachEvents` history.

------------------------------------------------------------------------

# 12. Stage 5 — Bounded Early-Relationship Engagement

## 12.1 Contract

`eligibilityEvaluator.js`'s `evaluate()` (currently lines 88-121) gains one new branch, inserted at the point the existing Trust check (lines 104-109) would otherwise return `INELIGIBLE`:

```
if (input.trustTestSignal.glad !== true) {
  if (input.trustTestSignal.glad === null &&
      input.sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION' &&
      input.validReasonCategory === 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION') {
    // Bounded Early-Relationship Engagement (RGEF §12) — proceed; do not return INELIGIBLE here.
    // trustTestSignal.glad is read, never written. No Trust is claimed or fabricated.
  } else {
    return freezeShallow({
      outcome: 'INELIGIBLE',
      reason: input.trustTestSignal.glad === null ? 'TRUST_TEST_UNCERTAIN' : 'TRUST_TEST_NOT_GLAD'
    });
  }
}
```

Execution then continues, unchanged, to the existing `lowCoachingValuePeriodActive` check (lines 111-116) and the existing final `ELIGIBLE` return (line 121) — **except** that the final return's `reason` field, when the Bounded Early-Relationship Engagement branch was taken, SHALL be the new closed value `'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT'`, not `input.validReasonCategory`. This is required by A12 (Explainability Integrity) — the eligibility trace must never read as if the Product Reason alone conferred eligibility, since in the ordinary (Trust-satisfied) case `reason` is the Product Reason and readers of the trace could otherwise conflate the two paths.

## 12.2 Mechanical Preconditions (exhaustive)

The Bounded Early-Relationship Engagement branch fires if and only if **all** of the following hold on the same, already-validated `OpportunityEligibilityInput`:

1. `trustTestSignal.glad === null` (strictly — not `false`, not `true`).
2. `sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION'`.
3. `validReasonCategory === 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'`.
4. `safetyHighRiskBypass !== true` (implied — the bypass branch, lines 94-96, already returns before this point is ever reached).

No other field, and no data outside this closed contract, participates in this determination. `lowCoachingValuePeriodActive === true` still resolves to `INELIGIBLE`/`LOW_COACHING_VALUE_PERIOD` after the Bounded Early-Relationship Engagement branch is taken, exactly as it would for an ordinary Trust-satisfied Opportunity — D1-IE-04's reduced-frequency rule is not weakened by this path.

## 12.3 Failure Behavior

If any precondition in Section 12.2 does not hold, behavior is byte-identical to today: `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` (if `glad === null`) or `INELIGIBLE`/`TRUST_TEST_NOT_GLAD` (if `glad === false`). `validateInput()` (lines 69-82) is unmodified — a malformed input resolves to `MALFORMED` exactly as before, before this branch is ever reached.

## 12.4 Interaction with Safety

Unaffected. `safetyHighRiskBypass: true` returns `ELIGIBLE`/`SAFETY_HIGH_RISK_BYPASS` before the Trust check block is reached at all (lines 94-96, unmodified). The ordinary Trust Test and the new bounded path are both irrelevant to a safety-bypassed Opportunity.

## 12.5 Interaction with Recommendation-kind Opportunities (Structural Isolation, A11)

`sourceCategory === 'CONFIRMED_PATTERN_ANTICIPATION'` is, by canonical Stage-3 ownership assignment (`TASK_005_SPEC_v1.0.md` §9.1, D2 Unit 07: Initiative Engine "specifically confirmed-pattern anticipation and disruption/milestone detection"; `DECISION_WINDOW` exclusively Recommendation-owned), never legitimately producible by `recommendationEngine.js`. The compound condition in Section 12.2 therefore structurally excludes every Recommendation-kind Opportunity, including any future RG-1-resolved, `DECISION_WINDOW`-sourced Opportunity that might independently carry `validReasonCategory === 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'`. This isolation is a consequence of the existing, closed engine-ownership partition (`TASK_005_SPEC_v1.0.md` §9.1: "Prohibition on rule leakage... enforced by the component boundary itself"), not a new mechanism this SPEC invents. **Engineering MUST implement the compound condition exactly as stated in Section 12.1 — `validReasonCategory` alone is explicitly insufficient and prohibited (A3/A11).**

------------------------------------------------------------------------

# 13. Stage 6 — Source × Reason Maturity Gating

## 13.1 Contract

`initiativeEngine.js`'s `categoryPermittedAtStage(stage, sourceCategory)` (lines 170-173) is replaced by `categoryPermittedAtStage(stage, sourceCategory, validReasonCategory)`, and its single call site (line 237, inside `generate()`) is updated to pass `opportunity.validReasonCategory` (already present and already validated on the same object by `validateRequest()`, lines 140-158 — no new field, no new read).

A new, closed table, `SOURCE_REASON_MATURITY_OVERRIDES`, is added alongside the existing `MATURITY_GATING`:

```
var SOURCE_REASON_MATURITY_OVERRIDES = Object.freeze({
  'CONFIRMED_PATTERN_ANTICIPATION': Object.freeze({
    'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION':
      Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'])
  })
});

function categoryPermittedAtStage(stage, sourceCategory, validReasonCategory) {
  var override = SOURCE_REASON_MATURITY_OVERRIDES[sourceCategory] &&
    SOURCE_REASON_MATURITY_OVERRIDES[sourceCategory][validReasonCategory];
  var allowed = override || MATURITY_GATING[sourceCategory] || [];
  return allowed.indexOf(stage) !== -1;
}
```

## 13.2 Scope Discipline (A4, mandatory)

`SOURCE_REASON_MATURITY_OVERRIDES` contains **exactly one** entry at authoring time: `CONFIRMED_PATTERN_ANTICIPATION` × `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`. Every other `(sourceCategory, validReasonCategory)` pair — including every other `validReasonCategory` under `CONFIRMED_PATTERN_ANTICIPATION` (e.g. a hypothetical future `PROTECT_STATED_LONG_TERM_GOALS`-reasoned confirmed-pattern Opportunity) — falls through to the existing, unmodified `MATURITY_GATING[sourceCategory]` default. Engineering SHALL NOT add a second entry to `SOURCE_REASON_MATURITY_OVERRIDES` without a new, explicit Product/Architecture decision, exactly as D1-IP-01/D1-IP-02 already govern the base table.

## 13.3 Effect on the One Live Opportunity

G2's Opportunity (`sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION'`, `validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'`) now resolves `categoryPermittedAtStage('OBSERVER', ...)` to `true` (previously `false`, via the empty `MATURITY_GATING.OBSERVER` array). No other Opportunity type's Stage-6 admission changes as a result of this Work Item.

------------------------------------------------------------------------

# 14. Domain/Topic Shared Vocabulary

## 14.1 Ownership

A new, small, pure module — `js/domain/domainTopicVocabulary.js` (same architectural tier as `js/domain/profileMetrics.js`/`js/core/dateUtils.js`, per C1's own precedent) — exports the closed `DOMAINS`/`TOPICS` value lists, moved verbatim from `derivedIntelligenceConsumer.js:41-46`. `derivedIntelligenceConsumer.js` requires this module and uses its exported constants in place of its own local ones; its derivation functions (`mapHabitTopic`-equivalent switch, `PATTERN_ID_MAP`, `mapPatternTopic`) are otherwise unmodified and remain B5-owned, B5-local.

## 14.2 Extensibility

Additive only, per B5's own existing §12.5 precedent ("the initial implementation MAY define only the topic IDs represented by current producer records"). This Work Item adds no new Domain or Topic value beyond what B5 already defines — no `BODY`, `ACTIVITY`, `TRAINING`, `Strength`, `Recovery`, or `Steps` value is introduced, since no current producer supplies them (Section 8 item 10 discipline: no numeric or taxonomic invention without grounding).

## 14.3 Future Non-B5 Producers

A future Recommendation-, Disruption-, or Milestone-sourced Opportunity that wishes to carry Domain/Topic identity MUST derive its own value from the shared module's closed vocabulary, using its own, locally-owned mapping logic — it MUST NOT call into `derivedIntelligenceConsumer.js`'s Habit/Pattern-specific derivation functions. This is a documented constraint for future work, not implemented here.

------------------------------------------------------------------------

# 15. DetectedOpportunity Domain/Topic Propagation

## 15.1 Contract

`initiativeEngine.js`'s `detectSemanticOpportunities()` (lines 353-399) is extended to copy `observation.domain`/`observation.topic` — already present on every `pipelineContext.initiativeIntelligence.signals[]` entry per B5's `normalizeHabitRecord()` (line 275) — onto the constructed `DetectedOpportunity`, as two new, additive, non-breaking fields: `domain`, `topic`. No other field of the existing `DetectedOpportunity` shape (`id`, `sourceCategory`, `detectingContributor`, `proposedAction`, `confidence`, `explanation`, `detectedAt`, `valueDimensions`, `contextualMeaning`, `validReasonCategory`, `trustTestSignal`, `safetyHighRiskBypass`) changes.

## 15.2 Non-Propagation to Stage 5

`buildEligibilityAndCandidateInputs()` (`internalPipelineOrchestrator.js:265-274`) is **not** modified to copy `domain`/`topic` into `eligibilityInput` — CD-T006-01's closed Stage-5 contract remains exactly six fields (Section 11 item 8). Domain/Topic identity is carried instead on `eligibleOpportunity` (`d`, the second element of `buildEligibilityAndCandidateInputs()`'s existing return value, already passed to Stage 6 unchanged) — Stage 6 (`generate()`) already receives the full Opportunity object as `request.opportunity`, which now includes `domain`/`topic`.

------------------------------------------------------------------------

# 16. Feedback Identity and Attribution Chain

## 16.1 Chain

```
DetectedOpportunity.id (stable, already exists)
  → InitiativeCandidate.opportunityProvenance.opportunityId (Stage 6; already exists, unmodified)
  → Stage 7 (Prioritization) preserves the Candidate object unchanged (prioritization.js's rank()
    only reorders; opportunityProvenance survives byte-identical — verified directly)
  → Stage 8 (Winner Selection) preserves the winning Candidate object unchanged (winnerSelection.js's
    select() returns the literal surviving pool entry as `winner`; disqualified entries likewise
    carry their own opportunityProvenance through unchanged — verified directly)
  → Stage 9 (Decision Formation) copies the winning Candidate's opportunityProvenance onto the
    Terminal Decision itself, as `candidateProvenance` — an array with one entry per winning/tied
    Candidate (decisionFormation.js:130, `members.map(c => c.opportunityProvenance)`), present on
    every disposition of the returned decision object (UNMODIFIED/MODIFIED/DEFERRED/BLOCKED/
    ESCALATED alike) — already-existing, unmodified production behavior, not a new field
  → Expression renders a Delivery Intent from the same Terminal Decision (Stage 10; correlated by
    decisionId, EXP-53, unchanged). The Delivery Intent itself does NOT carry Opportunity
    provenance, and this SPEC does not add any — EXP-53's closed field set
    (renderedLanguage/semanticSignal/correlation) is untouched.
  → internalPipelineOrchestrator.js's run() returns `terminalDecision` (carrying
    candidateProvenance) and `expression` (the Delivery Intent result) TOGETHER, as fields of the
    same returned object (internalPipelineOrchestrator.js:162) — the composition root therefore
    already holds both objects from the same call, with D2 Unit 09's own one-Terminal-Decision-
    per-pass invariant guaranteeing no ambiguity about which Opportunity produced the Delivery
    Intent being presented
  → SAME-CYCLE PRECEDENCE (Architecture Decision, Section 16.3): if a presentable Delivery Intent
    exists this cycle, it becomes the authoritative content of the shared `#trigger-card` for this
    cycle — an ordinary Trigger presentation that already ran earlier in the same cycle
    (triggerEngineAdapter.js's run(), which awaits presentTriggerCard() BEFORE
    EngineRegistry.run()'s own promise resolves) does not remain the card's authoritative content
  → app.js reads `terminalDecision.candidateProvenance[0].opportunityId` (single-winner case; the
    corresponding tied-set entry for a future multi-option case) and passes it to
    TriggerController.presentDeliveryIntent() (triggerController.js:225-233) alongside the Delivery
    Intent — NEVER derived from `opportunitiesConsidered`, which records every Opportunity
    considered this pass and does not by itself identify which one won
  → presentDeliveryIntent() explicitly ensures/binds its OWN Dismiss control and dismiss handler
    for this presentation (Section 16.3) — it does NOT rely on, inherit, or leave in place any
    dismiss binding `presentTriggerCard()`/`ensureTriggerCardDismissButton()` may have set earlier
    in the same cycle
  → user dismisses or does not
  → feedback event recorded with contextId = the ORIGINAL Opportunity.id (NOT decisionId), plus the
    Opportunity's own domain/topic, carried at write time (Section 16.3)
```

## 16.2 `decisionId` vs. `contextId` — Explicit Non-Equivalence

`deliveryIntentContract.js`'s `correlation.decisionId` (EXP-53, unmodified) identifies the **Terminal Decision** — it exists so a future user response can be matched to the decision that produced it, at the Decision-Pass level. Initiative feedback attribution operates at the **Opportunity** level, one layer earlier in the pipeline, and MUST use the Opportunity's own `id`. `presentDeliveryIntent()` is extended (Section 16.3) to receive and retain this id separately from whatever `decisionId` Expression attached; the two are never assumed interchangeable, and no code path converts one into the other.

## 16.3 Write-Side Contract — Shared-Card Precedence and Presentation-Owned Dismiss

**Architecture Decision — Composite Initiative owns the shared card.** When a presentable Composite Initiative Delivery Intent exists in a given `APP_READY` cycle, it is the authoritative visible content of `#trigger-card` for that cycle — an ordinary Trigger presentation from the same cycle does not remain authoritative underneath it. When no presentable Delivery Intent exists, ordinary Trigger presentation behaves exactly as today, unaffected. This is narrowly about same-cycle occupancy of the single shared `#trigger-card` element; it does not remove or reduce the Trigger Engine, does not migrate any legacy Trigger logic into the Composite Engine, and does not resolve TASK-007's own broader, still-open OD-5 (cross-*element* Home-card precedence among `#trigger-card`/`#coach-card`/`#adaptive-card`/`#partial-prompt` — Section 5.8).

**Rationale, grounded in verified repository evidence, not invented here:** `TASK_007_SPEC_v1.0.md` §13.4 (UX-13.3) explicitly, canonically classified the ordinary Trigger/Adaptive-TDEE paths as "currently produced outside the Coach Decision System's Expression/Coach Runtime chain" — a legacy, pre-Composite-Engine mechanism, never framed anywhere in D1/D2/D3 as a permanent peer to the Composite Engine's own Initiative/Recommendation output. `js/engines/triggerEngineAdapter.js`'s `run(ctx)` already calls and awaits `TriggerController.presentTriggerCard()` *inside* the Trigger Engine's own `run()` — structurally before `EngineRegistry.run()`'s overall promise (covering all engines, including `coachDecisionSystem`) resolves; `app.js`'s call to `presentDeliveryIntent()` happens only in the subsequent `.then()` continuation (`app.js:2111-2123`). Today this produces an already-deterministic (not racy) but incorrect and incomplete outcome: Delivery Intent's text always overwrites whatever `presentTriggerCard()` last set, while the dismiss button's binding is left exactly as `presentTriggerCard()`/`ensureTriggerCardDismissButton()` (`triggerController.js:72-107`) last set it — including, in the common case where no ordinary Trigger fired that cycle, **no dismiss button existing in the DOM at all**, since only `ensureTriggerCardDismissButton()` ever creates it, and it is never called when `presentTriggerCard(null, ...)` hides the card. This is a pre-existing UX-12.5 (Dismissibility) violation for the Delivery Intent path, independent of RGEF, now exposed because RGEF is the first Work Item to make this path produce real content.

**Contract.** `presentDeliveryIntent(deliveryIntent, sessionGeneration, opportunityId)` (`triggerController.js:225-233`) gains one new parameter, `opportunityId`, derived by `app.js`'s composition root as `output.terminalDecision.candidateProvenance[0].opportunityId` (Section 16.1), read from the same `run()` result object `output.expression` already comes from. **No heuristic, no guess, and no use of `opportunitiesConsidered` is permitted.** If a future tied-set Terminal Decision's `candidateProvenance` cannot be resolved to the single Initiative actually presented, `app.js` SHALL supply no `opportunityId` (Section 16.5) — out of scope for this Work Item's single-winner V1 vertical (Section 8).

When invoked with a real Delivery Intent, `presentDeliveryIntent()` MUST, as part of the same call:
1. Set the card's visible content, as today.
2. **Explicitly ensure and bind its own Dismiss control** — creating the button if it does not already exist (mirroring `ensureTriggerCardDismissButton()`'s own idempotent creation pattern, `triggerController.js:92-100`, but as a distinct, Initiative-owned function/branch, never reusing or falling through to the Trigger-bound one), and (re)binding `.onclick` fresh on every call, exactly as `ensureTriggerCardDismissButton()` already does for Trigger content (`btn.onclick = function () {...}`, a plain property assignment — always replacing, never accumulating listeners).
3. **Bind that dismiss handler's closure over this call's own `opportunityId`/`domain`/`topic`** — never over a Trigger's `t`, never over a stale value from an earlier call.

The bound dismiss handler calls:
```
deps.recordFeedbackFn('initiative', opportunityId, 'Dismissed')
```
— structurally parallel to, but never invoking or falling back to, the existing `deps.recordFeedbackFn('trigger', t.type, 'Dismissed')` call, which remains completely unchanged for ordinary Trigger-sourced cards shown when no Delivery Intent is presentable. `FeedbackDomain.classifyFeedback()`'s `GESTURE_TYPE` (`feedbackDomain.js:25-29`) gains one new entry: `'initiative:dismiss': 'Dismissed'`.

**Once the Composite Initiative becomes authoritative for a cycle, no Trigger-bound dismiss handler or Trigger identity may remain reachable from the visible card's Dismiss control for that cycle** — this is the mechanical guarantee that closes the UX-12.5 gap: a Composite Initiative card always has a real, Initiative-specific Dismiss control, regardless of whether an ordinary Trigger fired earlier in the same cycle.

The feedback event, once written via `writeRecordRecommendationFeedback()` (`stateAccess.js:324-333`, unmodified — already accepts arbitrary `{surface, contextId, feedbackType}`), carries `surface: 'initiative'`, `contextId: opportunityId`. To allow Domain/Topic recovery without depending on the originating Decision Pass's trace surviving, the write additionally carries the Opportunity's `domain`/`topic` at write time, as new, additive fields on the feedback event record (mirroring how `provenance` fields were added additively to Habit signals in CSF Ch.29 without breaking existing consumers). `readRecommendationFeedbackHistory()` (`stateAccess.js:206-213`) is extended to pass these two fields through unchanged, alongside the four it already returns.

## 16.4 Write-Path Ownership (Architecture Decision — StateAccess Correction)

**Initiative-surface feedback MUST NOT be written under a `triggerEngine.DAILY_COACH_CHECK` StateAccess identity.** An earlier draft of this SPEC proposed exactly that reuse; Engineering Readiness Review found it to be real ownership leakage, not merely a labeling preference: `writeRecordRecommendationFeedback()`'s only authorization check is against `identity.engineId`/`action` in the StateAccess permission matrix (`stateAccess.js`'s `PERMISSIONS`), with no verification that the caller is actually the named engine — so the reuse would "work" mechanically while causing every Initiative-surface feedback record's `metadata.engineId` (`app.js:2053`) to read `'triggerEngine'`, falsely attributing the write's true origin and corrupting the audit trail D2 Unit 09's traceability requirement depends on.

**Corrected contract:** `stateAccess.js`'s `PERMISSIONS.coachDecisionSystem.DECISION_PASS` entry (currently `{ reads: ['recommendationFeedbackHistory', 'goalObjectiveContext', 'todayNutrition'], writes: [] }`, lines 417-421) is extended to `writes: ['recordRecommendationFeedback']` — the exact same operation already granted to `triggerEngine`/`adaptiveTdeeEngine`, authorized here under its own, honest identity instead. This is not a new StateAccess capability kind, and it does not change `recordFeedbackEvent()`'s existing owner-selection logic (`app.js:2039`, already `surface`-derived, not `engineId`-derived, so no data-ownership routing changes). The UI/composition-root feedback callback for Initiative dismissals constructs `identity.engineId: 'coachDecisionSystem'` (mirroring the existing pattern already used for `triggerEngine`/`adaptiveTdeeEngine`-labeled writes — a plain, composition-root-constructed identity, the repository's existing mechanism for every feedback write today, not a new injection pattern). Resulting feedback records' `metadata.engineId` therefore truthfully reads `'coachDecisionSystem'` for Initiative-surface feedback, never `'triggerEngine'`.

## 16.5 Attribution Failure Behavior

If `opportunityId` was not supplied to `presentDeliveryIntent()` (a defensive/malformed caller state, or a future tied-set Terminal Decision whose `candidateProvenance` carries more than one entry and cannot be resolved to the single Initiative actually presented — out of scope for this Work Item's single-winner V1 vertical, Section 8), the function still renders the card and still ensures its own Dismiss control (Section 16.3, item 2 — a missing `opportunityId` never excuses omitting Dismissibility, per UX-12.5), but the bound dismiss handler records no feedback for that specific interaction, rather than fabricating an attribution, silently misattributing it to an unrelated Trigger's `t.type`, or falling back to any stale Trigger dismiss identity that may exist from earlier in the same cycle. This is a deliberate, honest degradation, consistent with the repository's existing discipline (e.g., `eligibilityEvaluator.js` never infers a value it cannot honestly derive). Symmetrically, when no Composite Initiative is presentable this cycle and an ordinary Trigger is shown, `presentTriggerCard()`/`ensureTriggerCardDismissButton()` behave exactly as today, unmodified — Trigger-only regression is a required acceptance criterion (Section 28).

------------------------------------------------------------------------

# 17. Multiple-Candidate / Winner-Selection Note

`initiativeEngine.js`'s `generate()` never returns more than one `InitiativeCandidate` per Opportunity (existing, unmodified behavior, Section 5.4) — the Opportunity id therefore remains a 1:1 key through Stage 6 and Stage 7's shared Candidate pool. No new ambiguity is introduced at Winner Selection (Stage 8); this Work Item does not touch `winnerSelection.js`.

------------------------------------------------------------------------

# 18. Domain/Topic Pattern Aggregation

## 18.1 Contract

**RGEF V1 Product-Approved Policy Reuse.** Head of Product / AI Architect has approved, as an explicit Product decision for this Work Item, reuse of the existing, already-approved `FeedbackDomain.RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1` (`feedbackDomain.js:45-53`, approved by `C2_SPEC_v1.1.md`) as the Domain/Topic receptiveness policy — its numeric values (`windowDays: 14`, `patternThreshold: 3`, `overrideTypes: ['Accepted','Completed','UserConfirmed']`) are **not** re-derived, re-invented, or independently parameterized by this Work Item; they are referenced by the same `policyId`. This is a deliberate reuse of an existing, reviewed FITME policy mechanism, not a fresh numeric decision made by this SPEC. **This decision does not declare `14`/`3` universally or permanently optimal relationship-learning constants — it is the approved V1 policy for this Work Item specifically. Future production evidence may justify a separately-authorized Product/Architecture calibration Work Item (Section 30, RGEF-OI-5); no such calibration is performed here.**

A new, pure, exported function is added to `feedbackDomain.js` (the existing shared cross-domain utility already used by Trigger and Adaptive TDEE, per Section 5.6), structurally analogous to the existing `evaluateSuppression()`, and reusing the same policy table rather than defining a new one:

```
function evaluateDomainTopicReceptiveness(feedbackEvents, domain, topic, nowTs, policyId) {
  policyId = policyId || DEFAULT_POLICY_ID; // 'SUPPRESSION_RECOVERY_POLICY_V1' — same default as evaluateSuppression()
  // ... identical recompute-from-source algorithm to evaluateSuppression(), reading the same
  // RECOVERY_POLICIES[policyId] entry, but matching on (domain, topic) instead of (surface, contextId)
}
```

Recompute-from-source (no stored state, no mutation), consistent with C2's own four guarantees (Section 5.6): (1) a single feedback event never independently changes the result; (2) any resulting suppression-equivalent conclusion is always temporary and reversible, recomputed fresh on every call; (3) never a persisted flag; (4) an explicit positive event newer than the most recent qualifying negative event immediately overrides it — using the existing, approved `overrideTypes` semantics verbatim, not a new positive-feedback taxonomy.

`feedbackEvents` here means the caller's already-read `feedbackHistory` (Section 5.9, `readRecommendationFeedbackHistory()`, extended per Section 16.3 to carry `domain`/`topic`), filtered by the function to `surface === 'initiative'` and matching `domain`/`topic` exactly (never a partial or hierarchical match — see Section 19.2 on cross-topic protection). This is the **only** difference between this function and `evaluateSuppression()`'s own matching predicate (which matches exact `(surface, contextId)`) — the policy's numeric values, override behavior, and every other guarantee are identical and shared, not duplicated.

## 18.2 Bounded Window (RGEF V1 Product-Approved Policy, 14 Days)

The function uses `SUPPRESSION_RECOVERY_POLICY_V1.windowDays` (**14**) as its evidence window. This is the RGEF V1 Product-approved value (Section 18.1) — it is **not** an Engineering default, is **not** independently chosen for Initiative's lower recurrence frequency, and is **not** revisable by Engineering alone. Evidence older than 14 days from `nowTs` does not qualify and has no effect on the result.

## 18.3 Pattern Threshold (RGEF V1 Product-Approved Policy, 3 Events)

The function requires at least `SUPPRESSION_RECOVERY_POLICY_V1.patternThreshold` (**3**) qualifying negative events (`Dismissed` or `Rejected` — `Ignored` is included in the closed vocabulary but, per Section 8 item 4, has no producer and will therefore never appear) within the window before returning a suppressing result. This is the RGEF V1 Product-approved value (Section 18.1), reused verbatim from `SUPPRESSION_RECOVERY_POLICY_V1`, not an Engineering default: **one qualifying negative event is never sufficient; two qualifying negative events are also not sufficient; three or more, within the 14-day window, are required** — directly implementing D1-ER-02/D1-SP-04's single-event discipline using the same threshold already approved for C2's own surfaces, rather than a newly-invented one.

------------------------------------------------------------------------

# 19. Stage-6 Consumption of Learned Patterns

## 19.1 Contract

**Architecture Decision — narrow resolution of Repository Gap A-2 (Section 5.4).** `initiativeEngine.js` gains a new, direct `require('../feedback/feedbackDomain.js')` dependency — the first ever for this module — authorized exclusively for the call below. `wasIgnoredBefore()` (D1-IP-08's existing, exact-Opportunity-id check) gains a second, additive, independent check, consulted only when the first returns `false`:

```
var FeedbackDomain = (typeof module !== 'undefined' && module.exports)
  ? require('../feedback/feedbackDomain.js')
  : window.FeedbackDomain;

function domainTopicRecentlyUnwelcome(feedbackHistory, domain, topic, nowTs) {
  if (!domain || !topic) return false; // no Domain/Topic identity — no basis to suppress
  var result = FeedbackDomain.evaluateDomainTopicReceptiveness(feedbackHistory, domain, topic, nowTs);
  return result.suppressed === true;
}
```

`generate()` (the existing `if (wasIgnoredBefore(...)) return emptyResult();` check) is extended to also return `emptyResult()` if `domainTopicRecentlyUnwelcome(pipelineContext.feedbackHistory, opportunity.domain, opportunity.topic, pipelineContext.assembledAt)` is true. Both checks are independent, additive, and either one alone is sufficient to suppress — neither replaces the other. `wasIgnoredBefore()` itself is **not** moved into `feedbackDomain.js` and **not** rewritten to use it — it remains exactly the local, self-contained function it already was, per Section 5.4's explicit boundary. `initiativeEngine.js` reads `SUPPRESSION_RECOVERY_POLICY_V1`'s values only indirectly, through `FeedbackDomain.evaluateDomainTopicReceptiveness()`'s own reuse of them (Section 18) — it never copies `windowDays`, `patternThreshold`, or `overrideTypes` as local constants of its own.

## 19.2 Cross-Topic / Cross-Domain Protection (Invariant 6, mandatory)

`evaluateDomainTopicReceptiveness()` matches **only** on the exact `(domain, topic)` pair supplied — it never aggregates across Topics within a Domain, and never aggregates across Domains. Repeated negative evidence for `NUTRITION`/`PROTEIN_INTAKE` has **zero** effect on `NUTRITION`/`FOOD_LOGGING`, on any `WORKOUT` Topic, or on FITME's engagement generally. **This Work Item deliberately does not implement the "Topic evidence weakly informs Domain-level interpretation" bleed described in P3** — no canonical formula exists for how much weaker such a bleed should be, and Section 8 item 10 prohibits inventing one. This is recorded as a Future Item (Section 30, RGEF-OI-1), not silently dropped: the stricter, no-bleed behavior is the safe, canonically-compliant default in its absence. The `windowDays: 14`/`patternThreshold: 3` values (Section 18.2/18.3) apply identically here — this section changes only the *matching key* (Domain/Topic), never the policy's numeric values.

## 19.3 No Second Authoritative Memory System

`evaluateDomainTopicReceptiveness()`'s result is never persisted. Every Decision Pass recomputes it fresh from `pipelineContext.feedbackHistory`, exactly as `wasIgnoredBefore()` already does today. No new Firestore field, no new StateAccess write, and no new owner is introduced by Section 18 or this section.

------------------------------------------------------------------------

# 20. True `Ignored` — Explicit Scope Statement

Production-backed detection of silent non-response (an Initiative shown, with no explicit action taken by the user, distinguished honestly from `Dismissed`) is **out of scope for this Work Item**, per P4. This is a deliberate, approved Product scope decision, not a semantic substitution: `Dismissed` continues to mean exactly what it has always meant (an explicit user gesture); `Ignored` remains a valid, distinct, closed-vocabulary value with no producer; no code introduced by this Work Item treats the two as equivalent, and `IGNORED_FEEDBACK_TYPES` (`initiativeEngine.js:129`, unmodified) continues to group them only for the pre-existing, narrower purpose of `wasIgnoredBefore()`'s exact-Opportunity-id repetition check — never for Domain/Topic-level learning (Section 18.1 explicitly excludes `Ignored` from `evaluateDomainTopicReceptiveness()`'s inputs, since it has no producer to ever supply one).

------------------------------------------------------------------------

# 21. Silence Behavior

Unchanged. An Opportunity that fails Stage 5 (ordinary or bounded path) or Stage 6 resolves to Decision-Pass-level Silence exactly as today (D2-INV-05) — this Work Item adds one new admission path at Stage 5 and one new admission at Stage 6 for exactly one Source×Reason combination; it does not change what Silence means or how it is reached for every other case.

------------------------------------------------------------------------

# 22. Safety Interaction

Unchanged, per Invariant 10. No file under Safety Layer's ownership (`safetyLayer.js`, `safetyIntegrationPort.js`) is touched by this Work Item. `safetyHighRiskBypass` continues to be checked first, unconditionally, in `eligibilityEvaluator.js`'s `evaluate()`. The Section 16.3 same-cycle shared-card precedence decision is a **presentation-ownership** rule only — it governs which already-fully-formed output (an ordinary Trigger's selected candidate, or a Composite Engine Delivery Intent that has already passed Stage 5/6/7/8/9 and Safety's own `finalReview()`) occupies the DOM element. It does not alter Stage 5 eligibility, Stage 6 gating, Safety disqualification, or Safety's final review in any way, and it never causes an otherwise-ineligible or Safety-disqualified output to be shown.

------------------------------------------------------------------------

# 23. Backward Compatibility and Migration

No existing field is removed, renamed, or reinterpreted. No Firestore schema, Firestore Rules, or Firebase Functions change is required — the new feedback-event fields (`domain`, `topic`) are additive, optional-on-read (absent on any pre-existing feedback event, handled as "no Domain/Topic identity — no basis to suppress" per Section 19.1). No migration script is required. `APP_VERSION`/service-worker `VERSION` SHALL be advanced only if this Work Item ships user-visible behavior at closure (i.e., the G2 Opportunity actually reaching Expression for the first time) — this determination is deferred to the Closure Record, per the precedent set by every prior closure in this program (TASK-004 through G-2).

------------------------------------------------------------------------

# 24. Determinism and Ordering

`evaluate()`'s new branch is a pure function of its already-validated input — same input, same outcome, deterministically (matching the module's existing, stated discipline). `categoryPermittedAtStage()`'s new override lookup is a pure table lookup. `evaluateDomainTopicReceptiveness()` is deterministic given the same `feedbackEvents`/`nowTs` inputs, matching `evaluateSuppression()`'s own existing determinism guarantee.

------------------------------------------------------------------------

# 25. Observability / Traceability

Per D2 Unit 09 (Section 5.1), every Opportunity's eligibility trace (`decisionPassTrace.opportunitiesConsidered`) continues to record which reason applied — now including the new closed value `BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT` — so a future audit can distinguish an ordinary Trust-confirmed engagement from a bounded early-relationship one without ambiguity.

------------------------------------------------------------------------

# 26. File List

**New:**
- `js/domain/domainTopicVocabulary.js`

**Modified (additive only, per file):**
- `js/coachDecisionSystem/eligibilityEvaluator.js` (Section 12)
- `js/coachDecisionSystem/initiativeEngine.js` (Sections 13, 15, 19 — Section 19 additively introduces this module's first-ever dependency on `js/feedback/feedbackDomain.js`, per the narrow, approved resolution of Repository Gap A-2, Section 5.4)
- `js/derivedIntelligenceConsumer.js` (Section 14 — sources vocabulary from the new shared module)
- `js/feedback/feedbackDomain.js` (Sections 16.3, 18)
- `js/stateAccess.js` (Section 16.4 — new `PERMISSIONS.coachDecisionSystem.DECISION_PASS.writes: ['recordRecommendationFeedback']` permission-matrix entry, plus additive `domain`/`topic` fields on the existing read/write ops — a real permission-matrix change, not merely additive fields, per the Section 16.4 correction)
- `js/trigger/triggerController.js` (Section 16.3 — `presentDeliveryIntent()` gains its own Dismiss-control creation/binding and same-cycle precedence behavior; `presentTriggerCard()`/`ensureTriggerCardDismissButton()` unmodified)
- `js/app.js` (Section 16.3/16.4 — composition-root wiring: deriving `opportunityId` from `terminalDecision.candidateProvenance[0].opportunityId` and passing it to `presentDeliveryIntent()`; constructing the `coachDecisionSystem`-identified feedback-write capability for Initiative dismissals)
- `index.html` / `sw.js` (script-tag/precache registration for the one new module, per existing repository pattern)

**Unmodified, explicitly:**
- `js/coachDecisionSystem/contextualMeaningPolicy.js`, `js/coachDecisionSystem/evidenceEvaluator.js` (G2)
- `js/coachDecisionSystem/recommendationEngine.js`
- `js/coachDecisionSystem/safetyLayer.js`, `js/coachDecisionSystem/safetyIntegrationPort.js`
- `js/coachDecisionSystem/deliveryIntentContract.js`, `js/coachDecisionSystem/expressionRenderer.js`, `js/coachDecisionSystem/expressionRenderingContext.js`
- `js/coachDecisionSystem/prioritization.js`, `js/coachDecisionSystem/winnerSelection.js`, `js/coachDecisionSystem/decisionFormation.js`

------------------------------------------------------------------------

# 27. Work Packages

- **WP1 — Domain/Topic Shared Vocabulary.** Create `js/domain/domainTopicVocabulary.js` (Section 14); repoint `derivedIntelligenceConsumer.js` to it; regression on all existing B5 tests (byte-identical behavior required).
- **WP2 — Domain/Topic Propagation onto DetectedOpportunity.** Extend `detectSemanticOpportunities()` (Section 15); new tests confirming `domain`/`topic` are present and correct on G2's constructed Opportunity, with no other field changed.
- **WP3 — Stage 5 Bounded Early-Relationship Engagement.** Implement Section 12 in `eligibilityEvaluator.js`; new tests per Section 28's acceptance list (Cold-Start, No-Fake-Trust, Narrowness, Recommendation-Isolation subsets).
- **WP4 — Stage 6 Source × Reason Gating.** Implement Section 13 in `initiativeEngine.js`; new tests confirming the one approved combination passes at Observer/Assistant and every other combination is unchanged.
- **WP5 — Feedback Identity, Shared-Card Precedence, and Write Path.** Implemented in this internal order, since each step depends on the one before it and no later step may assume feedback exists before this WP establishes it correctly: **(1)** extend `stateAccess.js`'s `PERMISSIONS.coachDecisionSystem.DECISION_PASS.writes` with `recordRecommendationFeedback` (Section 16.4); **(2)** wire `app.js`'s composition root to derive `terminalDecision.candidateProvenance[0].opportunityId` and pass it, with `domain`/`topic`, into `presentDeliveryIntent()` (Section 16.1/16.3); **(3)** implement `presentDeliveryIntent()`'s own Dismiss-control creation and Initiative-specific dismiss binding in `triggerController.js`, never inheriting `presentTriggerCard()`'s (Section 16.3); **(4)** implement the same-cycle Composite-Initiative-over-Trigger precedence in `app.js`'s composition root (Section 16.3); **(5)** wire the feedback write itself (`GESTURE_TYPE` entry in `feedbackDomain.js`, `coachDecisionSystem`-identified write via `app.js`). New tests confirming attribution survives presentation → dismissal → read-back using real Terminal Decision provenance (never `opportunitiesConsidered`, never a heuristic), that malformed/missing attribution degrades honestly (Section 16.5), and that Trigger-only behavior remains unmodified when no Delivery Intent is presentable.
- **WP6 — Domain/Topic Pattern Aggregation.** Implement `evaluateDomainTopicReceptiveness()` in `feedbackDomain.js` (Section 18), reusing `RECOVERY_POLICIES.SUPPRESSION_RECOVERY_POLICY_V1` by reference; new tests confirming: 1 negative event insufficient, 2 negative events insufficient, 3 qualifying negative events within the 14-day window sufficient, a qualifying newer positive event lifts suppression per the existing `overrideTypes` mechanics, evidence outside the 14-day window does not qualify, and cross-topic/cross-domain non-leakage.
- **WP7 — Stage 6 Consumption.** Implement Section 19 in `initiativeEngine.js`; new tests confirming Domain/Topic-scoped suppression (per the reused RGEF V1 policy) fires correctly and independently of the existing exact-Opportunity-id check.
- **WP8 — End-to-End Production-Backed Verification and Closure.** The full acceptance list (Section 28), full regression, documentation synchronization (Section 29), Closure Record.

Each Work Package follows the existing repository precedent (C1 onward): implement, test, self-review, and confirm before proceeding to the next.

------------------------------------------------------------------------

# 28. Acceptance Criteria / Production-Backed Verification

All of the following SHALL be demonstrated using real, unmodified-elsewhere production code (virtual-clock technique where needed, no hand-injected internal state), per the standing discipline of every prior closure in this program:

1. **Cold-start legitimate engagement.** The real G2 Opportunity (`CONFIRMED_PATTERN_ANTICIPATION` + `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, `glad === null`) proceeds through Stage 5's Bounded Early-Relationship Engagement path and Stage 6's Observer-permitted policy, producing a real `InitiativeCandidate`, when the Habit Engine's real establish→degrade→`WEAKENING` arc is driven exactly as G2's own existing production-backed test does.
2. **No fake Trust.** In the same scenario, `trustTestSignal.glad` is asserted to remain `null` at every stage — never mutated to `true` — and the Stage-5 trace's `reason` is asserted to be `BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT`, never `TRUST_TEST_UNCERTAIN`'s absence being mistaken for confirmation.
3. **Narrowness.** A synthetic Opportunity carrying `sourceCategory: 'CONFIRMED_PATTERN_ANTICIPATION'` and a different, valid `validReasonCategory` (e.g. `CELEBRATE_MEANINGFUL_PROGRESS`) with `glad: null` is asserted to resolve `INELIGIBLE`/`TRUST_TEST_UNCERTAIN`, unchanged from today.
4. **Recommendation isolation.** A synthetic Opportunity carrying `sourceCategory: 'DECISION_WINDOW'` and `validReasonCategory: 'REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION'` with `glad: null` is asserted to resolve `INELIGIBLE`/`TRUST_TEST_UNCERTAIN`, confirming the compound condition, not the Reason alone, governs.
5. **Domain/Topic attribution via real Terminal Decision provenance.** An end-to-end test presents the G2 Opportunity's Delivery Intent using `opportunityId` derived from the real `internalPipelineOrchestrator.js` `run()` result's `terminalDecision.candidateProvenance[0].opportunityId` (never a hand-injected id, never `opportunitiesConsidered`, never a heuristic), simulates a dismiss action, and asserts the resulting feedback event carries `surface: 'initiative'`, `contextId` equal to the originating Opportunity's id, and `domain`/`topic` equal to `NUTRITION`/`FOOD_LOGGING`.
6. **One negative event is insufficient.** One `Dismissed` event for a given Domain/Topic is asserted to leave `evaluateDomainTopicReceptiveness()`'s result non-suppressing, and Stage 6 admission for a subsequent Opportunity of the same Domain/Topic unaffected.
7. **Two negative events are insufficient.** Two qualifying `Dismissed`/`Rejected` events for the same Domain/Topic, within the 14-day window, are asserted to leave `evaluateDomainTopicReceptiveness()`'s result non-suppressing — the RGEF V1 policy's `patternThreshold: 3` is not yet met.
8. **Three qualifying negative events within 14 days produce learned suppression.** Three qualifying `Dismissed`/`Rejected` events for the same Domain/Topic within the 14-day window are asserted to produce a suppressing result from `evaluateDomainTopicReceptiveness()`, and Stage 6 admission for a subsequent same-Domain/Topic Opportunity is asserted to resolve to zero Candidates. The test asserts the reused policy by name (`SUPPRESSION_RECOVERY_POLICY_V1`) and documents it as RGEF V1 Product-approved policy reuse, per Section 18.1 — not as an Engineering default.
9. **Positive override lifts suppression.** A qualifying explicit positive event (`Accepted`/`Completed`/`UserConfirmed`) newer than the negative pattern established in criterion 8 is asserted to immediately lift the suppression, per the existing, unmodified `overrideTypes` mechanics.
10. **Expired evidence does not qualify.** Three qualifying negative events older than 14 days from `nowTs` are asserted to produce a non-suppressing result.
11. **Cross-topic protection.** Repeated negative evidence for one Topic is asserted to leave a different Topic's (and the parent Domain's, and an unrelated Domain's) `evaluateDomainTopicReceptiveness()` result unaffected.
12. **G2 integrity.** All of G2's own existing test files (`contextualMeaningPolicy.test.js`, `evidenceEvaluator.test.js`, `g2ProductionBackedAcceptance.test.js`) pass unmodified, confirming Stage 3/4 semantics are untouched.
13. **Safety regression.** All existing Safety Layer tests pass unmodified.
14. **Full regression.** The complete existing test suite passes, net-new tests only added, no existing test modified except where a call-site signature change (Section 13.1) mechanically requires updating a call in an existing test file — such updates SHALL preserve the original test's asserted behavior exactly, adding the new parameter without altering the assertion.

## 28.1 Shared-Card Precedence and Dismiss Ownership (Criteria A–E)

Required in addition to criteria 1–14 above, per Section 16.3's Architecture Decisions:

**A. Initiative-only presentation.** When no ordinary Trigger fires this cycle and a valid Composite Initiative Delivery Intent is presented: a Dismiss control exists on `#trigger-card`; dismissing it correctly invokes the Initiative-specific handler; the resulting feedback event carries the correct Opportunity id, `domain`, and `topic`; no ordinary Trigger identity (`t.type`) is required or referenced anywhere in the path.

**B. Simultaneous eligibility.** When an ordinary Trigger and a Composite Initiative are both eligible in the same cycle: the Composite Initiative is the authoritative visible content of `#trigger-card`; dismissing it records Initiative feedback (`surface: 'initiative'`) exclusively; no Trigger feedback (`surface: 'trigger'`) is recorded for that same dismiss action; no stale Trigger dismiss handler is reachable from the visible Dismiss control.

**C. Trigger-only regression.** When no Composite Initiative is presentable this cycle: ordinary Trigger presentation (`presentTriggerCard()`/`ensureTriggerCardDismissButton()`) functions exactly as before this Work Item, byte-identical dismiss semantics, unaffected by any code this Work Item introduces.

**D. StateAccess attribution.** Initiative-surface feedback, once persisted, is asserted to carry `metadata.engineId === 'coachDecisionSystem'` — never `'triggerEngine'`.

**E. UX-12.5 compliance.** A non-blocking Composite Initiative card presented via `presentDeliveryIntent()` always exposes a Dismiss control, in every tested scenario (A and B above), with no scenario producing a dismiss-less card.

------------------------------------------------------------------------

# 29. Canonical Documentation Updates Required at Closure

- `docs/roadmap/Roadmap.md` / `docs/roadmap/Changelog.md` — new closure entry, per the existing precedent format.
- `docs/architecture/FITME_ARCHITECTURE_v1.md` — additive section describing the Domain/Topic shared vocabulary's new ownership location and the two-dimensional Stage-6 gating mechanism, mirroring G2's own §26 addition.
- `docs/tasks/B5/B5_SPEC_v1.0.md` — additive note recording the `DOMAINS`/`TOPICS` vocabulary's promotion to `js/domain/domainTopicVocabulary.js`, with B5's own derivation logic explicitly confirmed unchanged.
- `docs/specs/TASK_005_SPEC_v1.0.md` — §36 item E-2 updated to record this SPEC's resolution for the one specific Source×Reason combination, with the general E-2 question (Observer's scope for every other combination) explicitly left open, unaffected. **§36 item A-2 also updated** to record: A-2 was correctly deferred by TASK-005 (no Product/Architecture authority existed yet for Initiative Engine to depend on `feedbackDomain.js`); RGEF later, explicitly, narrowly approved exactly one such dependency — `evaluateDomainTopicReceptiveness()` consumption at Stage 6 (Section 19) — while `wasIgnoredBefore()`'s exact-Opportunity-id D1-IP-08 logic remains local and unchanged; this is not blanket permission for any other `FeedbackDomain` capability, and TASK-005's original text is preserved as "Originally recorded," not silently rewritten.
- `docs/roadmap/Changelog.md` — correct the prior, inaccurate statement that the `presentDeliveryIntent()`/`presentTriggerCard()` `#trigger-card` coexistence question "falls under `TASK_007_SPEC_v1.0.md`'s own pre-existing, still-open OD-5" (Section 5.8) — OD-5 addresses cross-*element* Home-card precedence, a broader, still-unresolved question this Work Item does not touch; this Work Item resolves only same-*element* producer precedence.
- This document's own Section 1 (Status) and a new Closure Record section, added at closure only, per SAS convention.

------------------------------------------------------------------------

# 30. Open Items

## RGEF-OI-1 — Topic-to-Domain evidence bleed (Deferred, Future Item)

P3 permits, but does not mandate, weaker Domain-level evidence from repeated Topic-level engagement. No canonical formula exists. This SPEC deliberately implements the stricter, no-bleed behavior (Section 19.2) as the safe default. A future, separately-scoped Product/Architecture decision may define a weighted bleed mechanism if desired.

## RGEF-OI-2 — True `Ignored` production support (Deferred, per P4)

Restated from Section 20 for traceability. Not blocking this Work Item's own closure.

## RGEF-OI-3 — Stage-7 Domain/Topic-informed prioritization (Deferred, per Section 8 item 9)

`InitiativeCandidate`'s existing `trustImpact`/`problemMagnitude` placeholder fields remain unpopulated by this Work Item. A future Work Item may populate them from `evaluateDomainTopicReceptiveness()`'s output once ranking among multiple eligible Candidates becomes a real scenario.

## RGEF-OI-4 — General resolution of TASK-005 §36 item E-2 (Deferred)

This SPEC resolves E-2 only for the one approved Source×Reason combination (Section 13.2). Observer's permitted scope for every other Initiative `sourceCategory`/`validReasonCategory` combination remains exactly as undecided as before this Work Item.

## RGEF-OI-5 — Future Receptiveness Policy Calibration (Deferred, Intentional Reuse Noted)

RGEF V1 intentionally reuses `SUPPRESSION_RECOVERY_POLICY_V1`'s existing `windowDays: 14`/`patternThreshold: 3` values for Domain/Topic receptiveness learning (Section 18.1), rather than authoring a new, unreviewed policy. This is a deliberate Product decision to reuse an existing, approved mechanism, not a claim that these values are permanently or universally optimal for relationship-learning purposes. Future production evidence — e.g., observed false-suppression or false-permission rates once this Work Item is live — may justify a separately-authorized Product/Architecture calibration Work Item, revisiting these values (or introducing an Initiative-specific policy) with its own evidence and its own review. **Calibration is explicitly not part of this Work Item's scope.**

**None of the above blocks this Work Item's own Canonical Review, Engineering Readiness Review, or closure.**

------------------------------------------------------------------------

# 31. No Canonical Conflict Identified

A Pre-Authoring Contradiction Gate, consistent with G2's own authoring discipline (Section 51 of `G2_SPEC_v1.0.md`), was performed: no unresolved contradiction was found between this SPEC and D1/D2/D3/T005/T006/SL-001/G2/CSF/EXPR/C2/B5; between this SPEC's two new contract extensions (Stage 5's closed branch, Stage 6's two-dimensional table) and any existing enum/contract (`OpportunityEligibilityInput`, `InitiativeCandidate`, `MATURITY_GATING`); or between this SPEC and any stale assumption named in the six investigation/review rounds preceding it.

------------------------------------------------------------------------

# 32. Closure Record

**IMPLEMENTED / VERIFIED / CLOSED — 2026-08-26.**

**Work Packages.** WP1–WP8 (Section 27) all implemented, each tested and self-reviewed before the
next began, per the existing repository precedent (C1 onward). WP1–WP4 implemented and verified
first; WP5–WP6 implemented and verified after a Stage-6 Ownership Enforcement Correction (below) was
authorized; WP7 implemented and verified after the TASK-005 §36 Repository Gap A-2 Architecture
Decision (below) was authorized; WP8 (end-to-end production-backed verification and this closure)
completed last, continuing directly from WP7 with no further blocker encountered.

**Two implementation-time corrections, both escalated and explicitly authorized rather than patched
around:**

1. **Stage-6 Recommendation Ownership Correction.** `recommendationEngine.js` had no
   source-ownership gate and would have constructed an unowned `'Recommendation'`-kind Candidate for
   Initiative-exclusive (`CONFIRMED_PATTERN_ANTICIPATION`) and Safety-exclusive (`SAFETY_HIGH_RISK`)
   Opportunity sources — discovered while implementing WP5, halted on, reported with full evidence,
   and corrected only after explicit Head of Product + AI Architect authorization: a closed
   `STAGE6_ACCEPTED_SOURCES` gate (`['DECISION_WINDOW']` for `recommendationEngine.js`; the existing
   Initiative-exclusive sources for `initiativeEngine.js`) now enforces D1 Unit 05's closed
   five-source taxonomy on both Stage-6 engines. **PASS** — verified via
   `tests/recommendationEngine.test.js`, `tests/internalPipelineOrchestrator.test.js`, and
   `tests/g2ProductionBackedAcceptance.test.js` (which now demonstrates the real, corrected
   `INITIATIVE` Terminal Decision outcome).
2. **TASK-005 §36 Repository Gap A-2 — bounded resolution.** WP7's own design required
   `initiativeEngine.js`'s first-ever dependency on `js/feedback/feedbackDomain.js`, contradicting
   the module's own existing header text and an existing, passing test — halted on, reported with
   full evidence and two explicit options, and resolved only after explicit Head of Product + AI
   Architect authorization of Option A: `initiativeEngine.js` may depend on `feedbackDomain.js` for
   exactly `evaluateDomainTopicReceptiveness()`, never a blanket coupling; `wasIgnoredBefore()`
   (D1-IP-08) remains local and unchanged; TASK-005's original A-2 text preserved as historically
   accurate (`docs/specs/TASK_005_SPEC_v1.0.md` §36 item A-2, updated at this closure).

**Acceptance Criteria (Section 28/28.1) — all PASS, demonstrated against real, unmodified-elsewhere
production code:**

| # | Criterion | Result |
|---|---|---|
| 1 | Cold-start legitimate engagement | PASS — `tests/g2ProductionBackedAcceptance.test.js` |
| 2 | No fake Trust (`glad` stays `null`) | PASS — same test, `reason === 'BOUNDED_EARLY_RELATIONSHIP_ENGAGEMENT'` |
| 3 | Narrowness | PASS — `tests/eligibilityEvaluator.test.js` |
| 4 | Recommendation isolation | PASS — `tests/eligibilityEvaluator.test.js` |
| 5 | Domain/Topic attribution via real `candidateProvenance[0]` | PASS — new WP8 vertical test, `tests/g2ProductionBackedAcceptance.test.js` |
| 6–7 | 1/2 negative events insufficient | PASS — `tests/feedbackDomain.test.js`, `tests/initiativeEngine.test.js` |
| 8 | 3 qualifying events → suppression, policy asserted by name | PASS — `tests/feedbackDomain.test.js` (`policyId === 'SUPPRESSION_RECOVERY_POLICY_V1'`) |
| 9 | Positive override lifts suppression | PASS — `tests/feedbackDomain.test.js`, `tests/initiativeEngine.test.js` |
| 10 | Expired evidence does not qualify | PASS — `tests/feedbackDomain.test.js`, `tests/initiativeEngine.test.js` |
| 11 | Cross-topic/cross-domain protection | PASS — `tests/feedbackDomain.test.js`, `tests/initiativeEngine.test.js` |
| 12 | G-2 integrity | PASS — `contextualMeaningPolicy.test.js`/`evidenceEvaluator.test.js`/`g2ProductionBackedAcceptance.test.js` all pass |
| 13 | Safety regression | PASS — `safetyLayer.test.js`/`safetyIntegrationPort.test.js` unmodified, pass |
| 14 | Full regression | PASS — 1946/1946 |
| 28.1-A | Initiative-only presentation | PASS — `tests/triggerController.test.js` |
| 28.1-B | Simultaneous eligibility, Composite Initiative wins | PASS — `tests/triggerController.test.js` |
| 28.1-C | Trigger-only regression | PASS — `tests/triggerController.test.js` |
| 28.1-D | StateAccess attribution (`engineId === 'coachDecisionSystem'`) | PASS — `tests/stateAccess.test.js`, new WP8 vertical test |
| 28.1-E | UX-12.5 Dismiss-control compliance | PASS — `tests/triggerController.test.js`, new WP8 vertical test |

**Test counts.** Pre-RGEF baseline: 1896/1896 passing. Post-RGEF: **1946/1946 passing, 0 failing**
(net +50). Test files added/extended: `tests/eligibilityEvaluator.test.js`,
`tests/initiativeEngine.test.js`, `tests/recommendationEngine.test.js`, `tests/feedbackDomain.test.js`,
`tests/triggerController.test.js`, `tests/stateAccess.test.js`,
`tests/internalPipelineOrchestrator.test.js`, `tests/g2ProductionBackedAcceptance.test.js`;
`tests/derivedIntelligenceConsumer.test.js` regression-verified, unchanged.

**`APP_VERSION` determination.** Advanced from `2.41.0`/`v2.41.0` to **`2.42.0`/`v2.42.0`**, per this
Section's own §23 criterion ("advanced only if this Work Item ships user-visible behavior at closure
— i.e., the G-2 Opportunity actually reaching Expression for the first time"). Unlike every prior
closure in this program (Expression, G-2), this Work Item's own WP8 production-backed vertical test
demonstrates the real, unmodified-elsewhere pipeline reaching `expression.status === 'DISPATCHED'`
and a real presented Delivery Intent for the first time — the condition this Section's criterion
names is met. Every hardcoded `2.41.0`/`v2.41.0` version-sync assertion in the existing C1/B2/C2
wiring test files was updated to `2.42.0`/`v2.42.0` as a mechanical, non-behavior-altering
consequence (comparing the real, live constant to itself), verified by the same full regression run
above.

**Canonical documentation synchronized (Section 29):** `docs/roadmap/Roadmap.md`,
`docs/roadmap/Changelog.md` (new closure entry; prior inaccurate OD-5 citation corrected),
`docs/architecture/FITME_ARCHITECTURE_v1.md` (new §27), `docs/tasks/B5/B5_SPEC_v1.0.md` (§19.3 note),
`docs/specs/TASK_005_SPEC_v1.0.md` (§36 items E-2 and A-2 updated, original text preserved as
historically accurate).

**Open items (Section 30) — none block this closure:** RGEF-OI-1 through RGEF-OI-5 all remain
exactly as deferred as recorded in Section 30. TASK-005 §36 Repository Gap G-3, TASK-007's own OD-5,
and general TASK-005 §36 E-2 resolution beyond the one approved combination all remain open,
unaffected by this closure.

**Scope purity.** No file outside this SPEC's own Section 26 File List (plus the mechanical
`APP_VERSION` version-sync files named above) was touched by this implementation. No pre-existing,
unrelated working-tree change present at the start of this implementation was modified, staged, or
reverted.
