# FITME — Changelog & Sprint Status

**Last Updated:** 2026-08-17

---

## Current Status

- 🟢 Coach Bible Chapters 1–22 approved and integrated into project governance (docs-only)
- ✅ Sprint 1 closed
- 🟢 TASK-001 approved
- 🟢 TASK-002 approved
- 🟢 TASK-003 approved
- 🟢 REM-001 approved, tested and merged
- 🟢 REM-002 approved, tested and merged
- 🟢 REM-003 approved, tested and merged
- ✅ Architecture Remediation Program — Phase A complete
- 🟢 B1 — Canonical Memory Decision approved and closed (architecture decision, no code change)
- 🟢 B2 — Engine Contract and Registry approved, tested and merged
- 🟢 B3 — State Ownership and Access Boundaries approved, tested and merged
- 🟢 B4 — Persistence Contract approved, tested and merged
- 🟢 B5 — Habit and Pattern Consumption Path approved, implemented, verified and closed
- 🟢 C1 — Modularization and Tests (WP1–WP11) approved, implemented, verified and closed
- 🟢 Coach Knowledge Base — Authoring Program complete: Topics 01–36 (all four Parts) approved, Topic 01 Gold Standard (v1.1)
- 🟢 C2 — Rejection and Suppression Feedback approved, implemented, verified and closed
- 🟢 C3 — Event Model Decision approved and closed (canonical decision, no production code changes)
- 🟢 C4 — Typed Memory Server Write Path approved, implemented, verified and closed (server-side only, no `APP_VERSION` change)
- 🟢 FITME Intelligence & Relationship Philosophy v1.1 approved and Canonical, integrated into project governance (docs-only)
- 🟢 D1 — Coach Intelligence Translation Model approved and Canonical (decision-policy specification only, no production code changes)
- 🟢 D2 — Coach Decision Pipeline Specification approved and Canonical (orchestration specification only, no production code changes)
- 🟢 D3 — Coach Decision System Architecture approved and Canonical (architecture specification only, no production code changes)
- ✅ D-series architecture phase closed (D1, D2, D3 all approved and Canonical)
- 🟢 FITME Specification Authoring Standard v1.1 approved and Canonical (documentation-only; governs task specifications only), superseding the Draft Canonical v1.0 baseline
- 🟢 TASK-004 — Recommendation Engine approved, implemented, verified and closed (`js/coachDecisionSystem/`; D3 §17's Composite Engine, first two of six internal collaborators — Memory Layer, Recommendation Engine; 62 new tests, full suite 1144/1144 passing)
- 🟢 TASK-005 — Initiative Engine approved, implemented, verified and closed (`js/coachDecisionSystem/initiativeEngine.js`; D3 §17's Composite Engine, third of six internal collaborators; focused Memory Layer extension per CD-T005-01; 68 new/changed tests, full suite 1212/1212 passing)
- 🟢 TASK-006 — Decision Engine approved, implemented, verified and closed (`js/coachDecisionSystem/eligibilityEvaluator.js`, `prioritization.js`, `winnerSelection.js`, `decisionFormation.js`, `safetyIntegrationPort.js`; D3 §17's Composite Engine, fourth of six internal collaborators — Stage 5/7/8/9; focused Candidate arbitration-metadata extension per CD-T006-02; 106 new/changed tests, full suite 1318/1318 passing)
- 🟢 FITME Safety Layer Canonical Decision Package approved and closed (`docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`, v2.6; all fifteen Required Canonical Decisions resolved — RCD-01 SL-001 standalone Work Item, RCD-02 Safety Decision Matrix, RCD-03 closed `reasonCode`/`reasonDetail`, RCD-04 meaning of `ESCALATED`, RCD-05 Constitutional Evaluation/Health Layer/Safety Layer relationship, RCD-06 documentation synchronization, RCD-07 canonical precedence confirmed, RCD-08 single-event safety bypass criteria, RCD-09 Safety Decision Matrix disposition policy, RCD-10 derivation of Safety Matrix dimensions, RCD-11 canonical `reasonCode` catalogue, RCD-12 ordered Safety Rule framework, RCD-13 Safety Layer output contract, RCD-14 Canonical Safety Rule evaluation model, RCD-15 RG-3 resolution — Decision-Level Modification for tied-set Terminal Decisions; documentation-only, no production code changes)
- 🟢 SL-001 — Safety Layer approved, implemented, verified and closed (`js/coachDecisionSystem/safetyLayer.js`; D3 §17's Composite Engine, fifth of six internal collaborators — Stage 3/8/9 Safety authority behind the existing `safetyIntegrationPort.js`; `index.html`/`sw.js` wiring for the one new file; 4 new tests, full suite 1374/1374 passing)
- 🟢 Coach Bible Chapters 2–22 completed independent Product and AI Architecture review and are approved and Canonical (docs-only; repository synchronization of a pre-existing document)
- 🟢 TASK-007 — UX System approved, implemented, verified and closed (cross-cutting Experience/Interaction/Presentation-Behavior contracts over the existing UI Presenters/Controllers, ten Work Packages; 12 test files extended/added, 97 net new/changed tests, full suite 1471/1471 passing; two non-blocking follow-ups recorded at closure for Product/Architecture disposition, neither expanding this task's own scope)
- 🟢 TASK-008 — Design System approved, implemented, verified and closed (`css/app.css` token/component layer — color, typography, spacing, radius, motion, iconography, theming, Component Catalog consolidation, semantic communication surfaces, WCAG 2.1 AA contrast fixture across all UI surfaces; fourteen Work Packages, WP4 retired N/A; full suite 1607/1607 passing, net +136 over the 1471 pre-TASK-008 baseline; three dark-mode contrast finding families explicitly deferred, non-blocking, to a future Brand/Visual Identity phase — not certified compliant, palette not frozen as final; two governance-sequencing deviations during implementation recorded accurately in the Specification's Closure Record)
- 🟢 Expression — D3 §17's sixth and final Coach Decision System collaborator approved, implemented, verified and closed (`js/coachDecisionSystem/deliveryIntentContract.js`, `expressionInputGate.js`, `expressionRenderingContext.js`, `expressionRenderer.js`; `internalPipelineOrchestrator.js`/`memoryLayer.js`/`js/trigger/triggerController.js`/`js/app.js` extended; fifteen Work Packages; 15 test files added/extended, full suite 1796/1796 passing, net +189 over the 1607 pre-Expression baseline; D3 §17's Composite Engine now fully realized, all six internal collaborators built; live Coach Runtime handoff wired but currently dormant pending Repository Gap G-2's separate resolution, `APP_VERSION` accordingly not advanced; two non-blocking follow-ups recorded at closure for Product/Architecture disposition, neither expanding this task's own scope)
- 🟢 FITME G-2 Canonical Decision Package approved and closed (`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`, v1.5; three Canonical Decisions resolved — CD-G2-01 Explicit User Statement/Action are Decision Inputs and high-authority evidentiary signals, not an independent Canonical Opportunity Source; CD-G2-02 FITME has one canonical Evidence concept, distinguished by evidentiary sufficiency, not two Evidence concepts; CD-G2-03 Initiative may express minimal contextual assistance, resolving the `InitiativeCandidate.action` content-type ambiguity — plus three Architecture Decisions: AD-G2-01, the G-2 Recognition Architecture (19 items) connecting existing real signals to Stage 3 Opportunity Detection of the existing Coach Decision System, approved after an Adversarial Canonical & Repository Review with no Product/Architecture/Contract blocker and no canonical contradiction; AD-G2-02, narrow Decision Engine orchestration authority for Stage 4 Evidence Evaluation, resolving `TASK_006_SPEC_v1.0.md` §38 item G-2; AD-G2-03, a bounded Goal/Objective and Current-State extension to Pipeline Context, reached only through the Memory Layer's existing exclusive Context Assembly authority; PD-G2-05 "Proactive Contextual Presence" recorded for traceability, approved by Product outside this Package; v1.5 additively cross-references the new Coach Semantic Foundation Package (below) as G-2's Contextual Meaning dependency, reopening nothing; documentation-only, no production code changes, no implementation performed; synchronized into `D1_SPEC_v1.0.md`, `D2_SPEC_v1.0.md`, `D3_SPEC.md`, `TASK_005_SPEC_v1.0.md`, and `TASK_006_SPEC_v1.0.md`; no deferred-reasoning or user-opt-in pipeline established; the Decision Window closing criterion remains unresolved and non-blocking for G-2 Core per AD-G2-01's own terms; Repository Gap G-2 itself — no live Stage 3/4 Opportunity source — remains open and unaffected, pending future implementation)
- 🟢 FITME Coach Semantic Foundation Canonical Decision Package approved and closed (`docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md`, v1.1; establishes the Observation → User Context → Contextual Meaning → Coaching Opportunity → Engagement Permission sequence as an explicit, non-collapsible Coach Decision System capability, filling a gap between D1 Units 05/06 that FITME's own governing philosophy already required but never operationalized; initial Alignment/Trajectory Contextual Meaning dimensions, explicitly extensible; a structured, machine-testable `ContextualMeaning` traceability artifact; the first and only active v1 Product Reason Policy rule — `validReasonCategory: REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, scoped exclusively to Habit-sourced `FOOD_LOGGING` degradation into the Habit Engine's `WEAKENING` lifecycle state, where that lifecycle structurally guarantees prior confirmed-tier establishment — all six other D1-IE-01 reasons remain `NO AUTOMATIC V1 RULE`/`NO_VALID_REASON` unless separately approved; a Lifecycle-Aware B5 Eligibility Architecture Decision admitting Habit-derived `WEAKENING` signals on that structural guarantee (not on decayed confidence alone) while explicitly excluding Pattern-derived `WEAKENING` from v1, with no global lowering of B5's `minimumConfidence` and no coaching-semantic authority granted to B5; Trust remains fully independent — `trustTestSignal.glad = null` pending an approved affirmative Trust source, so the approved first path correctly and honestly resolves `TRUST_TEST_UNCERTAIN` → Silence, not engagement; weight/body-composition semantics, protein-Goal exposure, and the celebration/meaningful-progress threshold are explicitly recorded as deferred/non-blocking, not silently invented; documentation-only, no production code changes, no implementation performed; synchronized into `docs/tasks/B5/B5_SPEC_v1.0.md` (§19.3, Appendix A.3) and cross-referenced additively from the G-2 Canonical Decision Package (v1.5, above); `docs/specs/TASK_005_SPEC_v1.0.md` inspected and confirmed to require no change — its own text already discloses `INITIATIVE_SUPPORT_V1`'s concrete values as Engineering-authored/provisional pending exactly this kind of future CDR (§36 item E-1); **Coach Semantic Foundation: CANONICAL / CLOSED. G-2 itself: OPEN — SPEC revision pending, not implemented.** `docs/specs/G2_SPEC_v1.0.md` requires substantial revision (not yet performed) before Canonical Review, Engineering Review, and READY; no G-2 implementation has begun; `APP_VERSION` unchanged)
- ⏭️ Next canonical task: not yet designated — to be determined through Canonical Work Item Selection

---

## Expression — D3 §17's Sixth and Final Coach Decision System Collaborator (Implementation Complete, Closed)

**Date:** 2026-08-17
**Status:** DONE — implemented, tested, reviewed, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented D3 §17's sixth and final Coach Decision System internal collaborator — Expression — the
component responsible for translating an already-formed `TerminalDecision` into a platform-neutral
Delivery Intent, per `docs/specs/EXPRESSION_SPEC_v1.0.md`, across fifteen Work Packages:

- **WP1** — the Delivery Intent field-level schema (`js/coachDecisionSystem/deliveryIntentContract.js`):
  rendered language, structured semantic signals, correlation metadata (Canonical Decision CD-EXP-01);
  `schemaVersion`; correlation locked to an opaque `decisionId` only, never embedding/duplicating the
  complete `TerminalDecision` (`EXP-OD-9` resolved).
- **WP2** — the dispatch mechanism: `runExpressionStage()` added to `internalPipelineOrchestrator.js`
  as a separate function invoked after `runDecisionPass()` returns, preserving its existing contract
  unchanged; no new B2 Engine Registry entry (`EXP-OD-3` resolved).
- **WP3** — defensive `TerminalDecision` input validation (`js/coachDecisionSystem/expressionInputGate.js`)
  and Silence-kind no-output handling, both origin cases.
- **WP4** — base-case (`UNMODIFIED`) rendering (`js/coachDecisionSystem/expressionRenderer.js`), reusing
  the existing `callClaude`/`ClaudeProxyClient` generative-call path; and, under **Canonical Decision 8**
  (D2 Unit 04 Stage 10 Amendment 1; D3 Decision 7), the Expression Rendering Context — a second,
  narrow, closed Stage-10 input (`expressionRenderingContext.js`), `{schemaVersion,
  relationshipMaturityStage}`, resolving `D1-PER-03`'s signal-availability gap without modifying
  `TerminalDecision`.
- **WP5–WP7** — `REFUSAL`, `ESCALATION`, and Safety-intervention-disclosure rendering (Canonical
  Decisions CD-EXP-02, CD-EXP-03, CD-EXP-04), plus the `MODIFIED`-disposition rendering path.
- **WP8** — multi-option (tied-set) rendering, `options[]` preserved unmutated.
- **WP9** — the live Coach Runtime handoff: `SafetyLayer` (SL-001) and `ExpressionRenderer` wired as
  production `safetyPort`/`expressionPort` in `internalPipelineOrchestrator.js`'s `run()`, now
  performing the full live Stage 1→10 sequence; `TriggerController.presentDeliveryIntent()` added,
  reusing the existing `#trigger-card` element — no new delivery surface (D3 Decision 6 preserved);
  the D2-EF-07 Pre-Expression User Correction supersession guarantee implemented (`memoryLayer.js`
  owns freshness/correction-arrival state, `run()` performs the pre-dispatch check) (`EXP-OD-4`
  resolved).
- **WP10** — exceptional-flow confirmation (§19, EXP-42): `TerminalDecision` validation failure,
  generative/LLM-layer call containment, and Coach Runtime unavailability all confirmed correctly
  handled, no fabricated fallback content on any path.
- **WP11** — Memory/Persistence boundary confirmation (§18, EXP-41): zero calls to
  `js/persistenceGateway.js`, no StateAccess capability of its own.
- **WP12** — Determinism, Explainability, Accessibility, Language, and Cross-Platform confirmation
  (§20–§24).
- **WP13** — resolved `EXP-OD-11`, the deterministic verification mechanism for CD-EXP-02/03/04's
  qualitative content-judgment rules: `tests/fixtures/expressionQualitativeVerificationTestDouble.js`,
  a deterministic, test-only, keyword/pattern-based checker, by direct structural analogy to
  `tests/fixtures/safetyIntegrationPortTestDouble.js` (TASK-006) — never production-reachable.
- **WP14** — cross-cutting audit: closed two narrow AC-3/AC-4 test-coverage gaps and synchronized
  Appendix C's Open Decision Register (`EXP-OD-3`, `EXP-OD-4`, `EXP-OD-7`, `EXP-OD-9`, `EXP-OD-11` all
  corrected to Resolved, preserving audit history).
- **WP15** — this documentation and closure pass.

**Repository Gap G-2** (no live Stage 3/4 Opportunity source — pre-existing since TASK-005/TASK-006,
unaffected by Expression) means the Coach Decision System's Terminal Decision is always
Decision-Pass-level Silence in production today, so Expression's Delivery Intent is never actually
produced yet. The full Stage 1→10 wiring is real, live, and tested — not a stub — but currently
dormant pending G-2's own, separate, not-yet-scoped resolution. **`APP_VERSION` was accordingly not
advanced** — no shipped, user-visible behavior change resulted from this closure (see
`docs/specs/EXPRESSION_SPEC_v1.0.md`'s Closure Record, §33.5, for the full evidence).

### Verification

- 15 test files added or extended across the full sequence (`deliveryIntentContract.test.js`,
  `expressionInputGate.test.js`, `expressionRenderingContext.test.js`, `expressionRenderer.test.js`,
  `expressionQualitativeVerificationTestDouble.test.js` new; `internalPipelineOrchestrator.test.js`,
  `memoryLayer.test.js`, `triggerController.test.js`, `coachDecisionSystemWiring.test.js`,
  `c1Wp5aWiring.test.js` extended).
- Full suite **1796/1796 passing** (1607 pre-Expression baseline, net +189).
- All Acceptance Criteria AC-1 through AC-22 confirmed satisfied; `EXP-OD-1` through `EXP-OD-9`,
  `EXP-OD-11`, and `EXP-OD-12` resolved; `EXP-OD-6` (`APP_VERSION`) resolved as "not advanced," per the
  evidence above; `EXP-OD-8` remains an inherited, unaffected Canonical Gap; `EXP-OD-10`
  (bounded-modification content-generation algorithm) remains explicitly open and non-blocking,
  carried forward as a tracked follow-up — `MODIFIED` is currently unreachable in production, no
  canonical source exists anywhere in the repository for this algorithm.
- No file outside `js/coachDecisionSystem/*`, the one confirmed `js/trigger/triggerController.js`
  variance (WP9's Coach Runtime handoff target), and `js/app.js`'s composition-root wiring was
  touched; `js/engineRegistry.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `firestore.rules`,
  and all Product Bible/Coach Bible/AI Constitution/D1/D2/D3 content remain fully protected and
  unaffected.
- D3 §17's Composite Engine is now fully realized: all six internal collaborators (Memory Layer,
  Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer, Expression) are built,
  still registered as the single `coachDecisionSystem` Engine Registry entry (D3 Decision 1) — no
  second registration was ever introduced across the whole engagement.
- Approved by Head of Product + AI Architect and closed 2026-08-17 — see
  `docs/specs/EXPRESSION_SPEC_v1.0.md`'s Closure Record (§33.5) for full details, evidence, and
  tracked follow-up items (none of which expand this task's own scope): `EXP-OD-10`; the D2-EF-07
  write-side (no live chat-input UI exists anywhere in the repository yet); and the
  `presentDeliveryIntent()`/`presentTriggerCard()` `#trigger-card` coexistence question (dormant given
  G-2; falls under `TASK_007_SPEC_v1.0.md`'s own pre-existing, still-open OD-5).

---

## FITME G-2 Canonical Decision Package (Approved and Closed)

**Date:** 2026-08-17
**Status:** DONE — Canonical Review completed, both Required Canonical Decisions approved, closed
**Production Code Changes:** No (documentation only)

`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (v1.1) completed
Canonical Review; both Canonical Decisions were approved by the Head of Product + AI Architect,
resolving ambiguity discovered by the "G-2 Investigation" series — a dedicated root-cause and
canonical-contradiction review of Repository Gap G-2 (no live Stage 3/4 Opportunity source),
conducted after `docs/specs/D1_SPEC_v1.0.md` and `docs/specs/TASK_005_SPEC_v1.0.md` were both already
closed, canonical documents:

- **CD-G2-01** — Explicit User Statement and Explicit User Action are Decision Inputs and
  high-authority evidentiary signals (D1 Unit 11, Tiers 1-2), not independent Canonical Opportunity
  Sources. D1 Unit 05's closed, five-item Canonical Opportunity Sources taxonomy is unchanged; no
  sixth source is introduced. Stage 3 may use these signals, through Pipeline Context, toward
  detecting an Opportunity belonging to one of the existing five sources, with no preferred, primary,
  or default mapping to any one of them.
- **CD-G2-02** — FITME has exactly one canonical Evidence concept, governed by D1 Unit 11's Evidence
  Hierarchy. The distinction between a single Behavioral Event and a confirmed pattern is one of
  evidentiary sufficiency, not two different Evidence concepts.

Repository synchronization was executed and independently reviewed: `docs/specs/D1_SPEC_v1.0.md`
(Unit 03, Unit 05's source list, `D1-OD-01`, Unit 11, `D1-ER-02`) and
`docs/specs/TASK_005_SPEC_v1.0.md` (§9.2, §15.2 Exclusions, §15.7 Ownership, §36 Repository Gap
G-2 — closed as RESOLVED) were corrected, with each closed SPEC's original text preserved as
"Originally recorded" for audit history rather than silently rewritten. No implementation,
architecture, or behavioral change resulted; `APP_VERSION` not advanced. This closure does **not**
resolve the architecture-level Repository Gap G-2 (no live Stage 3/4 Opportunity source) itself,
which remains open and unaffected — see Expression's own closure entry, above. Approved by Head of
Product + AI Architect and closed 2026-08-17 — see
`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` for full details
and evidence.

**v1.2 — PD-G2-05 / CD-G2-03 Canonical Update (2026-08-17):** Product approved **PD-G2-05**
("Proactive Contextual Presence" — FITME may proactively recognize a contextually relevant moment
and offer a minimal, context-aware invitation without that recognition automatically requiring
substantive coaching advice, sensitive to goals, context, relationship, relevance, and interruption
value; explicitly establishes no deferred-reasoning requirement or user-opt-in pipeline gate), and the
Head of Product + AI Architect approved a third Canonical Decision, **CD-G2-03** ("Initiative May
Express Minimal Contextual Assistance"), resolving a previously open interpretive question: whether
the required `InitiativeCandidate.action` field (`docs/specs/TASK_005_SPEC_v1.0.md`) must contain
behavioral advice, a recommendation, an instruction, or an insight, or whether a minimal proactive
offer of contextual assistance is sufficient. CD-G2-03 resolves this in favor of the latter, within
the existing, unmodified Initiative category — no new Terminal Decision type, Candidate family,
pipeline Stage, or user-opt-in gate is introduced; a subsequent user response is handled by an
ordinary fresh Decision Pass, with no deferred continuation of the original pass established. A
single, minimal, additive-only cross-reference was synchronized into `TASK_005_SPEC_v1.0.md`'s
`InitiativeCandidate.action` field description; no other document required modification. This round
does not resolve the architecture-level Repository Gap G-2 itself, which remains open and unaffected.
See `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (v1.2) for
full details and evidence.

**v1.3 — AD-G2-01 G-2 Recognition Architecture Canonical Update (2026-08-17):** following an
Adversarial Canonical & Repository Review of a proposed 19-item G-2 Recognition Architecture
(`G2-RA-01` through `G2-RA-19`), Product/Architecture authority accepted the review's findings — no
Product Blocker, no Architecture Blocker, no Contract Blocker, no Canonical Contradiction — subject
to three exact wording clarifications (`G2-RA-05`, aggregation must explicitly preserve Safety's
unconditional-bypass status; `G2-RA-09`, Stage-3 detection must not depend on resolving the unresolved
Decision Window closing criterion; `G2-RA-14`, Recommendation Engine's Stage-3 responsibility narrowed
to its existing Decision-Window-detection assignment). The Head of Product + AI Architect approved the
architecture as clarified, recorded as **AD-G2-01**. AD-G2-01 establishes the first live canonical
Opportunity Recognition path connecting existing real signals (nutrition/workout/body history, Habit
and Pattern intelligence, recommendation feedback) to Stage 3 of the existing Coach Decision System —
no new engine, no new Composite Engine registration, no new Terminal Decision type, no new Candidate
family, and no user-opt-in/deferred-reasoning pipeline is introduced. This Package's title is broadened
from "Opportunity & Evidence Semantics" to "G-2 Canonical Decision Package" to reflect this expanded
scope, following the same growth-without-fragmentation pattern the Safety Layer Canonical Decision
Package itself already demonstrated; no prior recorded content is altered. AD-G2-01 does not resolve
Repository Gap G-2 itself — resolution requires actual implementation through a future SPEC, not yet
authored — and does not resolve the Decision Window closing criterion, which remains explicitly
unresolved and, per AD-G2-01's own terms, non-load-bearing for G-2 Core. No repository synchronization
beyond this Package was required: D1, D2, D3, TASK-005, TASK-006, the Architecture doc, and the
Engineering Workflow all remain fully accurate without modification, since AD-G2-01 is an approved plan
rather than an implemented change. No `APP_VERSION` change; no implementation status recorded as
complete. See `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`
(v1.3) for full details and evidence.

**v1.4 — AD-G2-02 / AD-G2-03 Pre-G-2 Canonical Decisions Update (2026-08-19):** following a Pre-G-2
Canonical Decisions Architecture Recommendation (advisory, not itself canonical) identifying the
minimal set of Product/Architecture decisions worth closing before G-2 SPEC authoring — framed around
long-term architectural stability rather than mere minimum-implementation sufficiency — the Head of
Product + AI Architect reviewed and approved both of its recommendations. **AD-G2-02 — Stage 4
Evidence Evaluation Orchestration:** the Decision Engine receives narrow, explicit Stage-4
orchestration authority, exercised through a dedicated internal execution component (not a new
Engine, not a seventh collaborator, not independently registered); D1 Unit 11 remains the sole
Evidence-policy authority; Stage 4 remains distinct from Stage 3 and Stage 5. This resolves
`TASK_006_SPEC_v1.0.md` §38 item G-2 (Stage 4 orchestration ownership, previously unassigned).
**AD-G2-03 — Coach Decision Context Foundation:** Pipeline Context receives two new, bounded semantic
categories — Goal/Objective Context (`goal`, `goalKcal`) and Current-State Context (`consumed`,
`protein`, `burned`) — reached only through new, least-authority StateAccess reads and the Memory
Layer's existing, exclusive Context Assembly authority; no Stage-3 contributor receives a direct
StateAccess read; Activity/Training-profile fields, Body-metric fields, and Location/Chat/Life-Event/
Capacity/Relationship-Maturity acquisition remain explicitly out of scope. Neither decision reopens
CD-G2-01/02/03, PD-G2-05, AD-G2-01, or the Decision Window closing criterion, which remains
unresolved and non-blocking. Unlike AD-G2-01, AD-G2-02 required minimal, additive-only, audit-trail-
preserving synchronization into `D2_SPEC_v1.0.md` (Stage 4's Orchestration-authority/Dependencies
lines, matching the existing Stage 5/7/8/9 pattern), `D3_SPEC.md` (§6.4 Responsibility Matrix, §8.3
Decision Layer), and `TASK_006_SPEC_v1.0.md` (§9.2, §13 item 5, §23.1, §14.7 table, §31 table, and
§38 item G-2, now marked RESOLVED) — each previously stated, in closed-list or "no owner" form, that
Stage 4 carried no assigned orchestration authority; original text preserved throughout, per this
Package's established audit-trail discipline. AD-G2-03 required no repository synchronization beyond
this Package — it adds bounded new capability without contradicting any existing closed statement in
D1, D2, D3, TASK-005, or TASK-006. No `APP_VERSION` change; no implementation status recorded as
complete; documentation-only, no production code changes. See
`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (v1.4) for full
details and evidence.

**v1.5 — Coach Semantic Foundation Cross-Reference (2026-08-19):** a bounded, additive cross-reference
(Chapter 15) to the newly-closed `docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_
Package_v1.0.md` — the Product + Architecture foundation supplying the Contextual Meaning /
`validReasonCategory` derivation `AD-G2-01`'s `G2-RA-06`/`G2-RA-07` always required but left to a
future SPEC. No content is duplicated between the two Packages; no existing G-2 decision
(`CD-G2-01/02/03`, `PD-G2-05`, `AD-G2-01/02/03`) is reopened, reinterpreted, or altered. Repository
Gap G-2 itself remains open and unaffected. See the Coach Semantic Foundation Package's own entry,
below, for its full content.

---

## FITME Coach Semantic Foundation Canonical Decision Package (Approved and Closed)

**Date:** 2026-08-19
**Status:** DONE — Canonical Review completed, all decisions approved, closed
**Production Code Changes:** No (documentation only)

`docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` (v1.1) completed
Canonical Review during G-2 SPEC review, when the `validReasonCategory`/`trustTestSignal` construction
problem was found to be evidence of a deeper, previously-unbuilt capability rather than a missing
lookup table: FITME's own governing philosophy ("Context Determines Meaning" — Intelligence &
Relationship Philosophy, Principle 6; "Without context there is no coaching" — Constitution) was never
operationalized into D1's own operational Unit sequence, which moves directly from Unit 05
(Opportunity Detection) to Unit 06 (Intervention Eligibility) with no intervening interpretive Unit.

The Head of Product + AI Architect approved:

- The canonical conceptual sequence **Observation → User Context → Contextual Meaning → Coaching
  Opportunity → Engagement Permission**, non-collapsible, not a new D3 collaborator/Engine/Stage.
- Initial Contextual Meaning dimensions — **Alignment** (`ALIGNED`/`DEVIATING`/`NEUTRAL`/`UNKNOWN`) and
  **Trajectory** (`IMPROVING`/`WORSENING`/`STABLE`/`UNKNOWN`) — explicitly initial and extensible, not
  permanently exhaustive; Meaning may legitimately exist with Alignment `UNKNOWN`.
- Semantic ownership: the detecting Stage-3 contributor remains the sole semantic owner
  (`G2-RA-07`); shared policy logic may be used to avoid duplication/drift but is pure, stateless, has
  no StateAccess/orchestration/Engine/collaborator/Registry status, and does not transfer semantic
  accountability away from the contributor.
- A structured, machine-testable `ContextualMeaning` traceability artifact (`alignment`, `trajectory`,
  `basis`/provenance) carried on `DetectedOpportunity` — not lossy free text.
- The **first and only active v1 Product Reason Policy rule**: `validReasonCategory:
  REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, approved exclusively for Habit-sourced `FOOD_LOGGING`
  degradation into the Habit Engine's `WEAKENING` lifecycle state — repository-verified
  (`habitEngine.js`'s `statusOf()`) to structurally guarantee prior confirmed-tier establishment before
  `WEAKENING` can ever be returned. Not a generic missing-data rule; not Pattern-derived; no inference
  about cause. All six other D1-IE-01 reasons remain `NO AUTOMATIC V1 RULE`/`NO_VALID_REASON` unless
  separately approved — including `PROTECT_STATED_LONG_TERM_GOALS`, whose plausible `goalKcal`-
  deviation basis was found, on investigation, to have no approved numeric threshold and to conflict
  with Coach Bible §45's own multi-hypothesis restraint requirement for exactly this situation.
- A **Lifecycle-Aware B5 Eligibility Architecture Decision**: `ACTIVE`/`CONFIRMED` signals keep B5's
  existing eligibility policy unchanged; Habit-derived `WEAKENING` signals are admitted on the
  structural prior-establishment guarantee above, not on decayed confidence remaining above the same
  floor used for `ACTIVE`/`CONFIRMED`; Pattern-derived `WEAKENING` is explicitly excluded from v1
  (Pattern Engine's own `WEAKENING` transition carries no equivalent structural guarantee, and
  reconstructing historical confidence by reversing decay is explicitly not performed); B5's
  `minimumConfidence` is not globally lowered; B5 gains no coaching-semantic, Stage-3, Trust, or
  Stage-5 authority.
- Trust remains fully independent of Meaning and Reason: no affirmative Trust basis exists yet, so
  `trustTestSignal.glad = null` and the approved first path correctly, honestly resolves
  `INELIGIBLE`/`TRUST_TEST_UNCERTAIN` → Silence — a genuine, non-fabricated outcome, not a failure of
  the Opportunity.
- Weight/body-composition semantics (`weight` vs. `currentWeight`), protein-Goal exposure, and the
  `CELEBRATE_MEANINGFUL_PROGRESS` restraint threshold are explicitly recorded **deferred /
  non-blocking** — none prevented this Package from closing; none is silently invented.

Repository synchronization was executed and reviewed: `docs/tasks/B5/B5_SPEC_v1.0.md` (§19.3's
previously-reserved `INITIATIVE_SUPPORT_V1` placeholder populated with the approved lifecycle-aware
rules; Appendix A.3 added; the pre-existing, already-stale "Initiative Engine consumption... remains
disabled" line in the document's own header `Blocks:` list corrected, original text preserved per this
repository's established audit-trail discipline) and
`docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (v1.5, additive
cross-reference only, Chapter 15 — see above). `docs/specs/TASK_005_SPEC_v1.0.md` was inspected and
found to require **no change**: its own Section 36 item E-1 already discloses `INITIATIVE_SUPPORT_V1`'s
concrete values as "Engineering-authored provisional logic... a CDR candidate," meaning this exact kind
of future resolution was already anticipated and the document remains accurate as written. D1, D2, D3,
TASK-004, TASK-006, `AD-G2-01/02/03`, the Architecture document, and the Roadmap were each inspected
and confirmed to require no change (full reasoning in the Package's own Chapter 28).

**Coach Semantic Foundation: CANONICAL / CLOSED. G-2 itself: OPEN — SPEC revision pending, not
implemented.** `docs/specs/G2_SPEC_v1.0.md` requires substantial revision (Sections 17-20, 22, 24, 41)
before Canonical Review, Engineering Review, and READY; no G-2 implementation has begun; `APP_VERSION`
unchanged. Approved by Head of Product + AI Architect and closed 2026-08-19 — see
`docs/governance/FITME_Coach_Semantic_Foundation_Canonical_Decision_Package_v1.0.md` for full details
and evidence.

---

## TASK-007 — UX System (Implementation Complete, Closed)

**Date:** 2026-08-06
**Status:** DONE — implemented, tested, reviewed, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented `docs/specs/TASK_007_SPEC_v1.0.md`'s cross-cutting Experience/Interaction/
Presentation-Behavior Contracts over the existing UI Presenters/Controllers, across ten Work
Packages (C1 precedent — one Work Package implemented, tested, self-reviewed, and committed at a
time, each individually requiring its own Product Review and Architecture Review before commit).
WP1–WP3: static accessibility baseline — `aria-live` on the four coach-originated cards,
`aria-label`/`<label for>` across onboarding, Home, Settings, Food, and Workout form controls, a
`prefers-reduced-motion` guard on the two CSS keyframe animations (`index.html`, `css/app.css`,
`js/ui/foodScreenPresenter.js`). WP4: keyboard operability for click-only controls and
deterministic focus-in/focus-restore on the barcode overlay (`index.html`,
`js/nutrition/barcodeFlowController.js`). WP5: deterministic sequencing among the four
Home-screen coach-originated cards consistent with each domain's own existing severity signal,
plus a Dismiss affordance added to `#coach-card` (`js/coach/coachPresenter.js`), which previously
had none. WP6–WP7: structured failure/success presentation — generic `alert()` calls replaced
with messages differentiated by the Persistence Gateway's actual `status`/`error.code`/
`error.retryable` fields, across the Adaptive/Settings domain
(`js/adaptive/adaptiveTdeeController.js`, `js/ui/dayNavigationController.js`, `js/memory.js`) and
the Nutrition domain (`js/nutrition/mealCommitService.js`, `quickLogService.js`); required an
additive, Product/Architecture-approved prerequisite — `js/persistenceGateway.js` additively
exports `classifyError` (no `OPERATIONS` catalog entry or request/response contract changed), and
`js/app.js`'s `saveProfile()`/`saveTodayData()` now return a structured `{status, error}` result
instead of silently swallowing failures. WP8: a return-after-absence continuity signal on Home
(UX-7.5/UX-14.1a), sourced entirely from the existing day-history data already read by
`updateStreak()`/`buildWeekChart()`, with no new Persistence field (`js/ui/homePresenter.js`).
WP9: a cross-cutting audit of every remaining normative rule, finding and fixing two genuine,
narrow gaps — two un-mirrored RTL disclosure chevrons (`js/app.js`, `js/memory.js`) and one
cross-surface context-handoff gap (the Adaptive partial-day prompt's "Complete" button now scopes
the Food screen to the originating day, via a `dayNavToDate(key)` method added to
`DayNavigationController`'s own already-`window`-exposed API object — a dedicated Engineering
Options Analysis found this the only approach that introduces no new bare `window.*` facade in
`js/app.js`, keeping the C1-characterized window-assignment inventory
(`docs/architecture/C1_WP0_INVENTORY.md` §3) unchanged, Product/Architecture-approved as
"Option C"). WP10: documentation and closure only.

### Verification

- 12 test files extended or added across WP1–WP9 (+930/-21 lines); 97 net new/changed tests over
  the pre-TASK-007 baseline; full suite **1471/1471 passing** (from the SL-001/pre-TASK-007
  baseline of 1374/1374).
- Every one of WP1 through WP9 individually received Product Review: APPROVED and Architecture
  Review: APPROVED, communicated directly by the Head of Product and AI Architect before its own
  commit — see `docs/specs/TASK_007_SPEC_v1.0.md` §1.1's closure revision-history row and §31.4
  Closure Record.
- `docs/architecture/C1_WP0_INVENTORY.md`'s closed, test-asserted window-assignment inventory (13
  sites / 12 properties in `js/app.js`) is unchanged by this task — verified both by direct
  inspection and by `tests/c1Wp0Characterization.test.js`/`tests/c1Wp10Wiring.test.js` passing
  unmodified.

### Next

See `docs/specs/TASK_007_SPEC_v1.0.md`'s Closure Record (§31.4) for the full follow-up list (none
of which expand this task's own scope) — two items were surfaced during closure verification and
recorded for explicit Product/Architecture disposition rather than resolved unilaterally by
Engineering: (1) `js/persistenceGateway.js`'s additive `classifyError` export (WP6 prerequisite)
is a literal exception to §26.4's Explicit No-Touch listing of that file; (2) `APP_VERSION`/`sw.js`
`VERSION` were not advanced during WP1–WP9 despite shipping user-visible behavior changes, an
apparent deviation from §26.3's own conditional and from C1's per-Work-Package versioning
precedent — not corrected during WP10 since a version bump has a real, live effect (service-worker
cache invalidation for every existing user), outside WP10's documentation-only, no-Runtime-change
scope. Neither is assessed as blocking. TASK-008 — Design System is the next named work item;
Expression remains the sixth and last undesignated D3 §17 Coach Decision System collaborator, with
no work item yet named for it.

---

## TASK-008 — Design System (Implementation Complete, Closed)

**Date:** 2026-08-09
**Status:** DONE — implemented, tested, reviewed, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented `docs/specs/TASK_008_SPEC_v1.0.md`'s Design System — a token/component layer over
the existing `css/app.css`/`index.html` UI Presenters/Controllers tier — across fourteen Work
Packages (WP4 retired as Not Applicable per OD-8008-6, no elevation/shadow token system). WP1–WP3
(`701af2a`, `a358194`, `a4f4ace`): foundational color/spacing/radius, typography, and motion
tokens, formalizing the existing primitive layer as named semantic aliases with no primitive
value changed. WP5–WP6 (`0828341`, `9038afb`): iconography convention and theme-mechanism
formalization plus a `theme-color` staleness fix. WP7–WP8 (`37556e8`, `5349de1`): Component
Catalog consolidation (buttons/toggle/empty-state, then segmented controls/cards/badges) via a
property-by-property objective-derivation methodology — divergent properties resolved by
majority/plurality value or an already-made decision, accepted as Engineering determinations; four
properties with no objective winner resolved by explicit Product/Architecture decision. WP9
(`86afc3a`): semantic communication surface taxonomy (Coach Message / Adaptive Update). WP10
(`0140bf5`): inline-style-override classification. WP11–WP13 (`c1fc256`, `fa48166`, `da0a352`):
incremental screen migration (Home/Food; Workout/Profile/Settings; Onboarding/Login/Barcode
overlay) to the token layer, building and progressively extending the WCAG 2.1 AA contrast
fixture (§20.1/§20.2, OD-11a/OD-11b, carried forward from TASK-007's closure). WP14 (`7f667bc`):
cross-cutting audit, finding and fixing two gaps never assigned to a prior Work Package — the
startup loading screen and the persistent bottom navbar — and confirming §26 (No-Touch list) and
§28 (Acceptance Criteria) satisfied.

A **Semantic Token Usage Contract (Option E)** was approved mid-implementation (during WP11),
following a dedicated Root Cause Investigation into why WCAG findings kept requiring individual
Decision Packages: §8.2 named semantic color-role categories without a usage contract governing
which role may pair with which surface. Option E, extending OD-8008-11's objective-derivation
precedent, authorizes Engineering to apply an existing-token, same-tier substitution without
further review when it introduces no new Primitive Token value, no new color, no new semantic
role, and no new Product/visual-language judgment. Three findings that did require such a
judgment — `.btn-primary`/`.btn-small`/`.int-btn.active` (white text on `--color-primary`,
dark mode only), `.confidence-badge.high`/`.quick-chip[disabled]` (`--color-success` on
`--color-success-subtle`, dark mode only), `.confidence-badge.low` (`--color-danger` on
`--color-danger-subtle`, dark mode only) — were explicitly **deferred**, not resolved, to a
future Brand/Visual Identity phase.

**Governance-sequencing deviations during implementation** (recorded accurately, not omitted):
WP10 saw Engineering write unauthorized content into the Specification and self-certify approval
into the Implementation Plan's tracking row before any real review occurred — identified via
direct Product/Architecture questioning, fully reverted before commit, then genuinely re-reviewed
and committed. WP12 saw Engineering implement, self-close, and commit (`fa48166`) without waiting
for a dedicated review of that Work Package specifically — identified via a Product/Architecture
governance self-audit, not reverted, and explicitly ratified after the fact. Both resulted in the
now-standing sequence (Implementation → Report → Product Review → Architecture Review →
Documentation update → Commit) applied without exception to WP13 and WP14.

### Verification

- 15 test files added or extended across WP1–WP14; full suite **1607/1607 passing** — up from the
  pre-TASK-008 baseline of **1471/1471** (net +136; the only test-count figure directly evidenced
  by repository commit messages).
- The WCAG 2.1 AA contrast fixture (`tests/fixtures/wcagContrastFixtureHomeFood.js`) covers every
  UI surface (Home, Food, Workout, Profile, Settings, Login, Onboarding, Barcode overlay, the
  global navbar, and the loading screen). It contains **zero unresolved failing entries**: every
  passing pairing is verified compliant, and the three finding families above are recorded as
  explicit, Product/Architecture-reviewed `DEFERRED-*` entries — distinct from, and not implying,
  full WCAG AA compliance across every current pairing. Deferral does not certify these pairings
  compliant and does not freeze the current Primitive Token palette as final.
- Every Work Package individually received Product Review: APPROVED and Architecture Review:
  APPROVED, communicated directly by the Head of Product and AI Architect, before its own commit —
  for WP10 and WP12, only after the governance-sequencing deviations above were identified and
  addressed, not on the first pass. See `docs/specs/TASK_008_SPEC_v1.0.md` §31.4 Closure Record
  for the complete, accurate account.
- `docs/architecture/FITME_ARCHITECTURE_v1.md`: reviewed per OD-8008-3's resolution; Architecture
  decision made that **no update is required** — TASK-008 introduced no new architectural tier and
  changed no architectural placement.

### Next

See `docs/specs/TASK_008_SPEC_v1.0.md`'s Closure Record (§31.4) for the full follow-up list (none
of which expand this task's own scope): the three deferred WCAG findings above; OD-8008-4a/4b
(primitive palette retain-vs-extend), OD-8008-5 (gold/teal/red convention formalize-as-is-or-
revise), OD-8008-7 (dial-asset disposition), OD-8008-8 (`prefers-color-scheme` scope), OD-8008-12
(No-Touch list variance), OD-8008-13 (visual-regression tooling) — all open, none blocking; an
AC-D1 documentation observation (two untracked Engineering Decision Pending items, §6.2/§17.1);
three residual items from WP8 tracked non-canonically in `TASK_008_ENGINEERING_FINDINGS.md`. **No
successor Work Item is designated by this closure.** Expression remains the sixth and last
undesignated D3 §17 Coach Decision System collaborator, still unnamed. The next Product/
Architecture activity will be determined separately through Canonical Work Item Selection.

---

## Coach Bible — Chapters 2–22 (Product & Architecture Approval, Repository Synchronization)

**Date:** 2026-08-05
**Status:** DONE — approved and Canonical; repository synchronization complete
**Production Code Changes:** No (documentation only)

### Summary

Following an independent Product and AI Architecture review, `docs/governance/FITME_Coach_Bible.md` Chapters 2–22 (including the Chapter 3 §4 v1.1 amendment) are approved as Canonical. No Product blockers, no Architecture blockers, no Safety blockers, and no Authority-boundary violations were found. The document is approved without further content changes; this entry performs only the repository synchronization that was outstanding — Chapters 2–22 were added to the repository on 2026-07-27 (commit `023c4f4`), and have already been relied upon as canonical source material by subsequently approved work (the FITME Safety Layer Canonical Decision Package v2.0, `docs/specs/SL-001_SPEC_v1.0.md`, and `docs/specs/TASK_004_SPEC_v1.0.md`'s Canonical Source Inventory), but no Roadmap or Changelog entry had previously recorded their approval — this entry corrects that gap. This entry supersedes, for Coach Bible scope only, the 2026-07-27 "Governance — FITME Intelligence & Relationship Philosophy v1.1" Changelog entry's statement that the same commit made "No Coach Bible... changes"; that statement was inaccurate as to the Coach Bible specifically (it was accurate for every other document it listed).

### Changed

- `docs/roadmap/Roadmap.md` — "Coach Bible — Chapter 1" entry replaced with "Coach Bible — Chapters 1–22 (Complete)", recording the 2026-08-05 Product/Architecture approval alongside the pre-existing 2026-07-22 Chapter 1 approval.
- `docs/roadmap/Changelog.md` — this entry; Current Status bullets updated.
- No Coach Bible content changed. No Canonical Decision, SPEC, or new review criteria introduced. No code, test, Firestore schema, Firestore Rules, or Firebase Functions changes.

### Verification

- `docs/governance/FITME_Coach_Bible.md` header ("Status: Canonical — Complete," "Canonical Chapters Approved: 1–22") is unchanged and is now backed by a recorded Roadmap/Changelog approval, consistent with every other canonical document in this repository.
- Coach Bible precedence (rank 3 of 8, per RCD-07 / Engineering Workflow §3) is unchanged.
- No downstream document (AI Constitution, Product Bible, D1, D2, D3, Safety Layer Canonical Decision Package, SL-001 SPEC, TASK-004/005/006) required a content change as a result of this entry — all pre-existing citations of Coach Bible Chapters 2–22 content are now traceable to a recorded approval.

### Next

TASK-007 — UX System remains the next canonical task, unaffected by this documentation-only synchronization.

---

## Safety Layer Canonical Decision Package (Approved and Closed)

**Date:** 2026-08-03
**Status:** DONE — Canonical Review completed, all Required Canonical Decisions approved, closed
**Production Code Changes:** No (documentation only)

`docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` completed Canonical Review; all eight Required Canonical Decisions were approved by the Head of Product + AI Architect:

- **RCD-01** — Safety Layer introduced as a standalone canonical Work Item, identifier **SL-001 — Safety Layer**, an architectural prerequisite before TASK-007. TASK-007 itself is unaffected.
- **RCD-02** — Safety Layer SHALL use a deterministic Safety Decision Matrix (Risk Type, Evidence Confidence, Correctability, Urgency), not a generic numerical severity score, to select among its five dispositions (`UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`).
- **RCD-03** — Safety decisions SHALL expose a closed canonical `reasonCode` and an optional structured `reasonDetail`; free-text explanations SHALL NOT be the canonical authority.
- **RCD-04** — `ESCALATED` means recommending appropriate professional care and/or pausing unsafe activity, within FITME authority boundaries; it SHALL NOT contact healthcare providers, notify third parties, open support tickets, or communicate externally. The Safety Layer classifies; Expression communicates.
- **RCD-05** — Constitutional Evaluation, Health Layer, and Safety Layer are not separate safety engines: Constitutional Evaluation defines policy, Health Layer provides safety context, and the Safety Layer is the single architectural enforcement layer.
- **RCD-06** — The repository SHALL be updated to reflect these decisions in the appropriate canonical documents (this entry, and the corresponding updates to the AI Constitution, Coach Bible, Product Bible, D1, D2, and D3, realize this decision).
- **RCD-07** — Canonical precedence confirmed as: 1. AI Constitution, 2. Product Bible, 3. Coach Bible, 4. Architecture, 5. Engineering Workflow, 6. Task Specifications, 7. Roadmap, 8. Changelog. The Coach Knowledge Base remains non-authoritative.
- **RCD-08** — A single event may bypass the normal pattern requirement only when it represents an explicit constitutional safety signal (high-risk symptoms, known allergy conflicts, active medical instruction conflicts, significant injuries, explicit dangerous requests, clear situations outside coaching authority); inference alone does not qualify.

No implementation work was performed or authorized by this closure. SL-001 — Safety Layer SPEC authoring is enabled but not started.

**v2.2 — Disposition Policy Canonical Update (2026-08-03):** three additional Required Canonical Decisions were approved by the Head of Product + AI Architect, completing content RCD-02 and RCD-03 had previously approved only at the structural level:

- **RCD-09** — The Safety Layer SHALL determine exactly one disposition via a fixed protective-precedence order (`ESCALATED` → `BLOCKED` → `DEFERRED` → `MODIFIED` → `UNMODIFIED`, first satisfied rule wins), with defined per-disposition trigger conditions and a fixed Silence-vs-Refusal rule for the Stage 8 all-disqualified case; no numeric scoring, weighting, or averaging is permitted.
- **RCD-10** — The Safety Decision Matrix's four dimensions (Risk Type, Evidence Confidence, Correctability, Urgency) SHALL be derived exclusively from already-approved canonical inputs (Pipeline Context, Candidate under review, Terminal Decision under review, Health/Safety Profile, Life Event Context); no new engines, pipeline stages, repository state, or data sources. An undecidable dimension SHALL be `INSUFFICIENT`, never inferred or invented, and SHALL result in `DEFERRED` where safe classification cannot otherwise be established.
- **RCD-11** — Every Safety Layer decision SHALL expose exactly one canonical `reasonCode` from a closed, thirteen-value catalogue as the canonical authority; `reasonDetail` is structured supporting information only and never replaces it. Not addressed by this decision: a migration mapping from the existing free-text `reason` field to the new catalogue, recorded as an open, non-blocking item.

No implementation work was performed or authorized by this update. Repository documentation synchronization for RCD-09 through RCD-11 (this entry, and the corresponding Roadmap update) is complete; per the Decision Package's own Chapter 29, no other canonical document (AI Constitution, Coach Bible, Product Bible, D1, D2, D3) is listed as requiring a change for RCD-09 through RCD-11 specifically — their content is scoped to the future SL-001 SPEC, which remains not yet started.

---

## TASK-006 — Decision Engine (Implementation Complete, Closed)

**Date:** 2026-08-03
**Status:** DONE — implemented, tested, reviewed, corrected, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented D3 §17's fourth Coach Decision System internal collaborator — the Decision Engine —
owning Stage 5 (Eligibility Evaluation), Stage 7 (Candidate Pool Assembly + Prioritization), Stage 8
(Winner Selection), and Stage 9 (Decision Formation), alongside a focused extension of both existing
producer engines (Canonical Decision CD-T006-02). Added: `js/coachDecisionSystem/eligibilityEvaluator.js`
(Stage 5, driven exclusively by the closed `OpportunityEligibilityInput` contract, Canonical Decision
CD-T006-01 — never free-text inference); `prioritization.js` (Stage 7 Candidate Pool Assembly and the
fixed D1-PR-01→06 lexicographic ranking sequence — never a weighted composite score; defines the
`NO_SIGNAL` sentinel and its comparison semantics, Section 14.12); `winnerSelection.js` (Stage 8 —
single-winner default, the narrow permitted tied-set exception, Safety Layer disqualification
integration); `decisionFormation.js` (Stage 9 — the four-family Terminal Decision contract,
`RECOMMENDATION`/`INITIATIVE`/`SILENCE`/`BOUNDARY`, per Canonical Decision CD-T006-06's deterministic
five-disposition Safety mapping); `safetyIntegrationPort.js` (the Safety Integration Port contract
only, Canonical Decision CD-T006-05 — no Safety Layer policy logic; production cannot bypass or fake
a Safety determination). Modified (additive only, no existing public contract changed):
`recommendationEngine.js`/`initiativeEngine.js` (CD-T006-02 arbitration-metadata fields populated on
every Candidate — real `triggeringEvidenceTime` carried from the Opportunity's own `detectedAt`; every
other field the literal `NO_SIGNAL` sentinel at this repository baseline, since no canonical or
repository-verified classification source yet exists for `evidenceTier`/`trustImpact`/`timingQuality`/
`problemMagnitude`/`recommendationImpactTier`; `recommendationImpactTier` on Recommendation-kind
Candidates only, per Canonical Decision CD-T006-03), `internalPipelineOrchestrator.js` (new
`runDecisionPass()`, structurally parallel to the existing `runForOpportunity`/
`runForInitiativeOpportunity` pattern — `run()`'s existing `candidates: []` contract is unchanged, since
no live Stage 3/4 Opportunity source exists yet in this repository), `index.html`/`sw.js` (script/shell
wiring). `recommendationCategories.js` is unchanged (Canonical Decision CD-T006-07 approves its existing
`SOURCE_HIERARCHY_TIER_MAP` as-is); `memoryLayer.js`, `registerCoachDecisionSystem.js`, and
`js/stateAccess.js` are unchanged — no new StateAccess capability, no new Engine Registry entry. No
`APP_VERSION` change.

An External Implementation Review found one genuine implementation blocker: the D1-PR-06(a) Evidence
Hierarchy tie-break comparator in `prioritization.js` was implemented with inverted polarity —
numerically higher `evidenceTier` values were ranked as winning, when D1 Unit 11 fixes Tier 1
(Explicit User Statement) as the strongest evidence tier and Tier 5 (Inference) as the weakest, the
same inverted-numbering convention already correctly applied to `hierarchyTier`/`recommendationImpactTier`
two lines away in the same function. Corrected in a single focused pass touching only
`prioritization.js` and `tests/prioritization.test.js` (comparator direction changed from descending to
ascending; the two tests whose scenarios depended on the incorrect polarity rebuilt to assert the
canonically correct direction); independently re-verified and re-approved. The defect was dormant at
this repository baseline (`evidenceTier` is always `NO_SIGNAL` today) but would have silently
misordered Candidates the moment a real Evidence Hierarchy source is ever populated — exactly the case
the `NO_SIGNAL` design's own forward-compatibility guarantee (Section 14.12.4) requires to already be
correct.

### Verification

- 106 new/changed tests (unit/contract/integration/failure/determinism) across five new test files
  (`tests/eligibilityEvaluator.test.js`, `prioritization.test.js`, `winnerSelection.test.js`,
  `decisionFormation.test.js`, `safetyIntegrationPort.test.js`) plus a test-only Safety Integration Port
  double (`tests/fixtures/safetyIntegrationPortTestDouble.js`, never referenced by production code) and
  extensions to four existing test files; full suite **1318/1318 passing** (the TASK-005 baseline
  1212/1212 unchanged).
- Still exactly one Composite Engine registered (`coachDecisionSystem`); no second Engine Registry
  entry, no second orchestration authority; no new trigger type.
- The Decision Engine never generates Candidate content, never exercises independent Safety judgment,
  never performs a durable write, and never produces more than one Terminal Decision per Decision Pass
  — verified across every Section 31 exceptional flow, including the narrow multi-option tied-set case
  and the all-Candidates-disqualified case.
- Production code cannot construct, import, or otherwise reach the test-only Safety Integration Port
  double; a real Safety Layer's absence correctly aborts a Decision Pass rather than fabricating or
  faking a determination.

### Next

See `docs/specs/TASK_006_SPEC_v1.0.md`'s Closure Record for the full follow-up list (none of which
expand this task's own scope) — principally that the Safety Layer and Expression remain the last two
of D3 §17's six collaborators, that Stage 4 (Evidence Evaluation) orchestration ownership remains
unassigned (Repository Gap G-2), and that a real classification source for `evidenceTier`/
`trustImpact`/`timingQuality`/`problemMagnitude`/`recommendationImpactTier` remains future,
Product/Architecture-owned work (Repository Gap G-9).

---

## SL-001 — Safety Layer (Implementation Complete, Closed)

**Date:** 2026-08-05
**Status:** DONE — implemented, tested, reviewed, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented D3 §17's fifth Coach Decision System internal collaborator — the Safety Layer — the
production implementation behind the existing, policy-free `SafetyIntegrationPort` (Canonical
Decision CD-T006-05, `safetyIntegrationPort.js`, TASK-006). Added: `js/coachDecisionSystem/safetyLayer.js`
— Stage 8 `disqualify()` (the binary D1-AH-02 absolute-override check, narrower than the full
five-disposition Matrix), Stage 9 `finalReview()` (the complete Safety Decision Matrix: RCD-09's
disposition-selection policy, RCD-10's dimension-derivation rules, RCD-12's closed dimension
vocabularies and ordered disposition predicates, RCD-14's Canonical Safety Rule runtime unit and
same-disposition tie-break), and the Stage 3 `detectSafetyOpportunities()` contribution, dispatched
from `internalPipelineOrchestrator.js` structurally parallel to the existing Initiative Engine
detection pattern. `decisionFormation.js` and `safetyIntegrationPort.js` required no change — both
already conformed to every rule this closure formalizes. `index.html`/`sw.js` — script/shell wiring
for the one new file, inserted after `safetyIntegrationPort.js` and before `internalPipelineOrchestrator.js`
in dependency order, matching the existing TASK-006 wiring pattern. No `APP_VERSION` change — this
collaborator has no user-facing surface yet (Expression, D3 §17's sixth and last collaborator, is not
built).

A Root Cause Investigation, conducted before implementation could resume, examined three candidate
architectural blockers. Two — the Health/Safety Profile input-contract question and MODIFIED-disposition
ownership — were found, on repository evidence, to require no new Canonical Decision: the first is
already covered by this SPEC's own Ch.28 Failure Mode guidance ("Missing Decision Input category →
Proceed using available categories") and matches the repository's existing treatment of
`lifeEventContext`/`capacityState`/`relationshipMaturity` (TASK-005); the second is already settled by
existing TASK-006/D2 text establishing the Safety Layer, never the Decision Engine, as `modifiedContent`'s
author. The third — RG-3, the undefined interaction between a `MODIFIED` disposition and a tied-set
Terminal Decision (Canonical Decision 7) — did require a new Canonical Decision, approved as **RCD-15**:
decision-level (uniform) modification. The Safety Decision Matrix evaluates a tied-set Terminal
Decision exactly as it evaluates any other — as one undifferentiated unit, no per-option evaluation
introduced; `options[]` is preserved unmutated; the resulting `modification` record is a **Decision-Level
Modification** — a Safety-Layer-authored, whole-decision field (structurally alongside `rationale`/
`safetyDisposition`), never scoped to an individual option. RCD-15 required no change to RCD-12/RCD-13/
RCD-14, to the `SafetyIntegrationPort` contract, or to Canonical Decision 7, and was found, on direct
code inspection, to already match the pre-existing (uncommitted) implementation of `decisionFormation.js`
— the interruption this Root Cause Investigation resolved was a documentation/decision gap, not an
implementation defect.

### Verification

- 4 new tests added to `tests/decisionFormation.test.js` (the tied-set + `MODIFIED` scenario RCD-15
  resolves, plus confirmation that every other Safety disposition behaves identically on a tied-set to
  the single-winner case, unaltered by RCD-15); full suite **1374/1374 passing** (the TASK-006 baseline
  1318/1318 unchanged and still passing).
- `finalReview()` confirmed invoked exactly once per Decision Pass for a tied-set Terminal Decision,
  never once per option.
- `options[]` confirmed identical in count, order, and membership to Winner Selection's own output
  after a `MODIFIED` review; the `modification` record confirmed present only at the decision level,
  never nested inside any individual option.
- All fifteen Required Canonical Decisions (RCD-01 through RCD-15) confirmed resolved in the
  FITME Safety Layer Canonical Decision Package (`docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`,
  v2.6, Closed); no open Repository Gap remains for SL-001's own scope (RG-1/RG-2/RG-3 all RESOLVED;
  GAP-06 and the inherited GAP-10 through GAP-13 remain open, unaffected, already classified
  non-blocking).

### Next

See `docs/specs/SL-001_SPEC_v1.0.md`'s Closure Record for the full follow-up list (none of which expand
this task's own scope) — principally that ED-1 (the concrete failure-detection/retry/logging mechanism)
remains an open, Engineering-owned Engineering Decision Pending; that the bounded-modification
content-generation algorithm has no canonical source and remains unreachable at this repository
baseline; that no Health/Safety Profile repository data source yet exists (same non-blocking treatment
as `lifeEventContext`/`capacityState`/`relationshipMaturity`); and that Expression remains the sixth and
last undesignated D3 §17 collaborator.

---

## TASK-005 — Initiative Engine (Implementation Complete, Closed)

**Date:** 2026-08-02
**Status:** DONE — implemented, tested, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented D3 §17's third Coach Decision System internal collaborator — the Initiative Engine —
alongside a focused extension of the existing Memory Layer (Canonical Decision CD-T005-01). Added:
`js/coachDecisionSystem/initiativeEngine.js` (Stage-3 confirmed-pattern-anticipation/disruption/
milestone detection contribution; Stage-6 Initiative-kind Candidate Generation applying D1 Unit 09
in full). Modified (additive only, no existing public contract changed): `memoryLayer.js` (Habit/
Pattern state via a second B5 read, Life Event Context and Capacity State reported honestly
`UNAVAILABLE`, Relationship Maturity reported `UNKNOWN` — no approved source exists yet),
`internalPipelineOrchestrator.js` (`runForInitiativeOpportunity`/`detectInitiativeOpportunities`,
existing `run`/`runForOpportunity` unchanged), `js/derivedIntelligenceConsumer.js` (new
`INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` consumer/policy pair, enabled per CD-T005-01),
`index.html`/`sw.js` (script/shell wiring). `recommendationEngine.js`/`recommendationCategories.js`
untouched, reused as-is (source vocabulary only, never the Recommendation Category taxonomy — the
Initiative Candidate carries no `category` field, Canonical Decision CD-T005-02). No
`js/stateAccess.js` change was required. No `APP_VERSION` change.

A focused code-review correction pass was applied before final approval: an invented Relationship
Maturity evidence-count heuristic was removed (replaced with honest `UNKNOWN`, no replacement
heuristic); `DECISION_WINDOW` was removed from the Initiative Engine's accepted Stage-6 sources
(Repository Gap G-4 remains an unresolved Follow-up, not an Engineering routing decision);
`SAFETY_HIGH_RISK` handling was re-documented as an out-of-contract exclusion rather than a
policy-driven Silence (Repository Gap G-3 remains unresolved); and comments overstating the reused
`recommendationCategories.js` mapping's status were corrected to state plainly it is TASK-004's own
engineering-authored, provisional mapping, reused unmodified.

### Verification

- 68 new/changed tests (unit/contract/integration/failure) across `tests/initiativeEngine.test.js`
  (new, 47 tests) and four extended test files; full suite 1212/1212 passing (the TASK-004 baseline
  1144/1144 unchanged).
- Still exactly one Composite Engine registered (`coachDecisionSystem`); no second Engine Registry
  entry, no second orchestration authority.
- `InitiativeCandidate` carries no `category` field and no disqualification/prioritization/winner-
  selection function exists on the Initiative Engine's public interface (D2 Unit 07 Forbidden
  Responsibilities, D1-AB-05).
- No repository data source exists for calendar disruptions, milestones, setback/recovery events,
  Life Event Context, Capacity State, or an approved Relationship Maturity signal — all reported
  honestly `UNAVAILABLE`/`UNKNOWN`/empty rather than fabricated.

### Next

See `docs/specs/TASK_005_SPEC_v1.0.md`'s Closure Record for the full follow-up list (none of which
expand this task's own scope) — principally that TASK-006 (Decision Engine) remains the path to a
live, non-empty candidate flow, and that an approved Relationship Maturity source, and Life
Event/Capacity/calendar/milestone data sources, remain Product/Architecture-owned future work.

---

## TASK-004 — Recommendation Engine (Implementation Complete, Closed)

**Date:** 2026-07-29
**Status:** DONE — implemented, tested, approved, and closed
**Production Code Changes:** Yes

### Summary

Implemented D3 §17's Coach Decision System Composite Engine, with the Recommendation Engine as
its first operational internal collaborator (two of the six collaborators — Memory Layer,
Recommendation Engine; Initiative Engine/Decision Engine/Safety Layer/Expression remain
TASK-005/TASK-006). Added: `js/coachDecisionSystem/recommendationCategories.js`,
`recommendationEngine.js`, `memoryLayer.js`, `internalPipelineOrchestrator.js`,
`registerCoachDecisionSystem.js`. Modified (additive only, no existing public contract changed):
`js/stateAccess.js` (new `PERMISSIONS.coachDecisionSystem` entry), `js/derivedIntelligenceConsumer.js`
(new `PRODUCTION_ENABLED_MAPPING.RECOMMENDATION_ENGINE` entry — TASK-004 is its first production
consumer), `js/app.js` / `index.html` / `sw.js` (registration + script/shell wiring). No
`APP_VERSION` change — no existing engine's runtime behavior changed.

### Verification

- 62 new tests (unit/contract/integration/failure) across five new test files; full suite
  1144/1144 passing (the pre-existing 1082 tests unchanged).
- Exactly one Composite Engine registered (`coachDecisionSystem`); no second Engine Registry, no
  second orchestration authority, no session mechanism change (D3 Invariant AI-01/AI-05).
- CC-02/CC-03 implemented verbatim; only the four canonical Recommendation Categories are ever
  produced; no ranking/priority-score/winner-selection logic exists anywhere in the engine
  (Ranking Policy, Canonical Decision Stage 5); an incomplete Decision Truth withholds its
  candidate rather than being fabricated (Explainability Policy, Canonical Decision Stage 6).
- CC-02, CC-03, Recommendation Categories, Ranking Policy, Explainability Policy, and the
  Composite Engine/Orchestrator build-responsibility question are resolved and implemented. The
  Roadmap-status, repository-hooks, and Coach Knowledge Base precedence Canonical Conflicts
  remain open and untouched by this task — confirmed, not to block it.

### Next

See `docs/specs/TASK_004_SPEC_v1.0.md`'s Closure Record for the full follow-up list (none of
which expand this task's own scope) — principally that Stage 3/4/5 (Opportunity Detection/
Evidence/Eligibility Evaluation) are not built by TASK-004, so the live pipeline currently yields
no candidates until TASK-005/TASK-006 exist to drive it.

---

## TASK-004 — Recommendation Engine (Specification READY)

**Date:** 2026-07-27
**Status:** SPEC approved; Engineering Review = READY (implementation not started)
**Production Code Changes:** None

### Summary

`docs/specs/TASK_004_SPEC_v1.0.md` passed the Final Canonical Gate Review and is approved by Head of Product + AI Architect for Canonical READY, per the Engineering Workflow lifecycle (Architecture → SPEC → Engineering Review → READY → Implementation → Code Review → Documentation Update → Commit → Task Closed). Implementation has not begun.

### Verification

- No application code, Firestore schema, or product behaviour changes.
- No Recommendation Engine behavior, runtime, contracts, ownership, scope, or acceptance criteria changed as part of this update.
- CC-02, CC-03, Recommendation Categories, Ranking Policy, Explainability Policy, the Composite Engine/Orchestrator build-responsibility question, and three Canonical Conflicts (Pipeline definition, Roadmap status, repository hooks) remain individually open and tracked in the specification; this READY approval does not resolve them.

### Next

Engineering: implementation planning may proceed under READY; the open items above are carried forward for resolution as implementation reaches them, not resolved by this entry.

---

## Governance — FITME Specification Authoring Standard v1.0

**Date:** 2026-07-27
**Status:** Documentation-only, Draft Canonical

### Summary

`docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.0.md` consolidates reusable FITME specification-authoring rules — how a task specification is structured, grounded in canonical sources and repository evidence, evidenced, reviewed, and completed — into a single source of truth for specification authoring. It governs task specifications only; it does not govern the Product Bible, AI Constitution, Architecture, Engineering Workflow, Roadmap, Changelog, Coach Bible, Coach Knowledge Base, or Intelligence & Relationship Philosophy, and it does not redefine the Engineering Workflow's task lifecycle or Source-of-Truth hierarchy.

### Verification

- No application code, Firestore schema, or product behaviour changes.
- No Product Bible, AI Constitution, Architecture, Coach Bible, or Coach Knowledge Base changes.
- No Engineering Workflow lifecycle or Source-of-Truth hierarchy changes; Engineering Workflow §4 now references this standard for how a Task SPEC is authored.
- No Firestore rules, Firebase Functions, or `APP_VERSION` changes.

### Next

Governance: pending final Head of Product + AI Architect sign-off to move from Draft Canonical to Canonical, per the standard's own Standard Lifecycle and Versioning section.
Engineering: next task remains unnamed, pending Product/Architecture direction (unaffected by this documentation work).

---

## D3 — Coach Decision System Architecture

**Date:** 2026-07-27
**Status:** Approved and Canonical (architecture specification only)
**Version:** 1.2

### Summary

`docs/specs/D3_SPEC.md` is the canonical architecture specification governing how D1's decision
policy and D2's orchestration pipeline are realized inside FITME's existing system architecture:
architectural responsibilities, ownership, runtime role, and integration boundaries for the Coach
Decision System — six internal collaborators (Memory Layer, Recommendation Engine, Initiative
Engine, Decision Engine, Safety Layer, Expression) coordinated by an Internal Pipeline Orchestrator,
registered as a single Composite Engine in the existing B2 Engine Registry — with the existing Coach
Runtime as the sole platform-mapping owner for the platform-neutral Delivery Intent Expression
produces. D3 defines architecture only — it does not define coaching, recommendation, evidence,
memory, priority, personalization or safety policy, does not define engineering implementation, and
does not itself implement the Recommendation Engine (TASK-004), Initiative Engine (TASK-005) or
Decision Engine (TASK-006).

### Added

- `docs/specs/D3_SPEC.md` — 17 sections positioning D1's and D2's logical components against the
  existing Engine Registry (B2), StateAccess (B3), Persistence Gateway (B4), Derived Intelligence
  Consumer (B5), module layering (C1), canonical event model (C3), and Typed Memory Server Write
  Path (C4), each traceable to D1, D2, or an approved B/C-series specification.
- 6 Canonical Decisions issued by the Head of Product and AI Architect across Canonical Review:
  Composite Engine registration (Decision 1), reuse of the existing Trigger Catalog with no new
  trigger type (Decision 2), exclusive Memory Layer ownership of Pipeline Context Assembly (Decision
  3), separation of Coaching History from Typed Memory (Decision 4), a platform-neutral, immutable
  Delivery Intent produced by Expression (Decision 5), and the Coach Runtime as sole platform-mapping
  owner across Web and future Native clients (Decision 6).

### Changed

- Nothing in `js/`, `functions/`, `firestore.rules`, `index.html`, or `sw.js`. No code, test, or
  schema changes.

### Verification

- Product/AI Architect review and canonical approval complete, across multiple canonical review
  rounds (Decisions 1–6).
- No architecture invented beyond composing D1 and D2 with the approved system; no product or
  coaching-logic policy introduced.
- D3 does not enable, implement, or change the status of TASK-004, TASK-005 or TASK-006.

### Next

This concludes the D-series architecture phase (D1, D2 and D3 all approved and Canonical). The next
canonical task is pending Product/Architecture direction; none is currently named.

---

## D2 — Coach Decision Pipeline Specification

**Date:** 2026-07-27
**Status:** Approved and Canonical (orchestration specification only)
**Version:** 1.0

### Summary

`docs/specs/D2_SPEC_v1.0.md` is the canonical orchestration specification governing how coach
decisions flow from input through execution: the single canonical Pipeline — Stage ordering, Stage
Contracts, Pipeline Invariants, Decision Lifecycle, Engine Responsibilities (Recommendation Engine,
Initiative Engine, Decision Engine, Safety Layer, Memory Layer), Exceptional Flows, and Pipeline
Traceability — that D1's decision policy is executed through. D2 defines orchestration only — it
does not define coaching, recommendation, evidence, memory, priority, personalization or safety
policy, does not define engineering implementation, and does not itself implement the Recommendation
Engine (TASK-004), Initiative Engine (TASK-005) or Decision Engine (TASK-006).

### Added

- `docs/specs/D2_SPEC_v1.0.md` — 12 Units (00–11) of deterministic SHALL/SHALL NOT orchestration
  rules plus Consolidated Canonical Decision Requirements, each traceable to D1 or an approved
  canonical document.
- 1 Canonical Decision Required (CDR) item raised during specification derivation, resolved by
  Product/AI Architecture decision during Canonical Review. D1's own open CDR items (CDR-1, CDR-2,
  CDR-4) remain inherited and unresolved, unaffected by D2's scope.

### Changed

- Nothing in `js/`, `functions/`, `firestore.rules`, `index.html`, or `sw.js`. No code, test, or
  schema changes.

### Verification

- Product/AI Architect review and canonical approval complete, across multiple canonical review
  rounds (Canonical Decisions 1–7).
- No architecture, prompt, API, UI or implementation decisions were made.
- D2 does not enable, implement, or change the status of TASK-004, TASK-005 or TASK-006.

### Next

D3 — Coach Decision System Architecture is approved and Canonical (2026-07-27), concluding the
D-series architecture phase; the next canonical task is pending Product/Architecture direction.

---

## D1 — Coach Intelligence Translation Model

**Date:** 2026-07-27
**Status:** Approved and Canonical (decision-policy specification only)
**Version:** 1.0

### Summary

`docs/specs/D1_SPEC_v1.0.md` is the canonical decision-policy specification translating FITME's
approved governance and coaching philosophy into deterministic decision rules for Decision Inputs,
User State Model, Opportunity Detection, Intervention Eligibility, Prioritization, Recommendation
Policy, Initiative Policy, Silence Policy, Evidence Requirements, Memory Usage, Personalization,
Authority Boundaries and Canonical Decision Output. D1 defines policy only — it does not define
architecture, prompts, APIs, UI or implementation, and does not itself implement the Recommendation
Engine (TASK-004), Initiative Engine (TASK-005) or Decision Engine (TASK-006).

### Added

- `docs/specs/D1_SPEC_v1.0.md` — 17 Units of deterministic SHALL/SHALL NOT decision policy, each
  traceable to an approved canonical source (AI Constitution, Product Bible, Coach Bible, Coach
  Knowledge Base, Intelligence & Relationship Philosophy, Architecture, C2, C3, C4).
- 5 Canonical Decision Required (CDR) items recorded for gaps that could not be derived from an
  approved canonical source.

### Changed

- Nothing in `js/`, `functions/`, `firestore.rules`, `index.html`, or `sw.js`. No code, test, or
  schema changes.

### Verification

- Product/AI Architect review and canonical approval complete.
- No architecture, prompt, API, UI or implementation decisions were made.
- D1 does not enable, implement, or change the status of TASK-004, TASK-005 or TASK-006.

### Next

D2 — Coach Decision Pipeline Specification is approved and Canonical (2026-07-27). D3 — Coach
Decision System Architecture is approved and Canonical (2026-07-27), concluding the D-series
architecture phase; the next canonical task is pending Product/Architecture direction.

---

## C4 — Typed Memory Server Write Path

**Date:** 2026-07-26
**Status:** Approved, implemented and closed
**Implementation Version:** 2.41.0 (unchanged — server-side only; no client script or `APP_VERSION` change)
**Commit:** `f026123`

### Summary

Closes the typed-memory server write-path gap left open since B1 and named explicitly by B1, B5,
C1, C2, and C3 as "remains C4's": `firestore.rules` and `js/memory.js` already anticipated three
server-only typed-memory `source` values (`inferred_event`, `inferred_pattern`, `coach_generated`)
but no server process existed to write them (remediation-plan Finding F10). Per
`docs/specs/C4_SPEC_v1.0.md` (approved), a trusted, server-side write capability was implemented:
every created record is written with `status: 'candidate'` unconditionally — the REM-003/B1
Generative-vs-Authoritative compliance mechanism — and `source`/`status`/`type` are immutable
after creation. No client-reachable interface was added; no caller/producer was wired, matching
this SPEC's own scope (a complete, tested, unconsumed capability, the same status the Habit and
Pattern Engines already have for their own output). No existing module was modified.

### Added

- `functions/typedMemoryServerWrite.js` — `configure(deps)` / `write(request)`, restricted to
  `source ∈ {inferred_event, inferred_pattern, coach_generated}`, targeting
  `users/{uid}/memories/{memoryId}` only. Deterministic identity derived from
  `(uid, source, idempotencyKey)`. Not registered as any `exports.*` in `functions/index.js` — no
  client-reachable interface exists for this capability.
- `tests/typedMemoryServerWrite.test.js` — 38 tests covering validation, source enforcement,
  idempotency, deterministic identity, timestamps, create/update behavior, and failure handling.

### Changed

- Nothing in `js/`, `firestore.rules`, `index.html`, or `sw.js`. No client permission changed. No
  existing Cloud Function (`anthropicProxy`) changed.

### Verification

- `1082` passed / `0` failed (`node --test tests/*.test.js`) — `1044` pre-existing plus `38` new,
  zero existing tests modified.
- B1–B5, REM-003 and C1–C3 contracts preserved unchanged.
- No Firestore schema, Firestore Security Rules, or client-permission changes.
- No new engines, memory models, event models, or persistence models; no caller/producer wired.
- Product/Architecture approval: `APPROVED`. C4 is `CLOSED`.

### Next

Phase C (C1–C4) is complete. No next Phase C item is currently named in the Architecture
Remediation Plan; the next canonical task is pending Product/Architecture direction.

---

## C3 — Event Model Decision

**Date:** 2026-07-26
**Status:** Approved and closed — canonical decision, no production code changes

### Summary

Closes the event-model question opened by Architecture Remediation Finding F7. Per
`docs/specs/C3_SPEC_v1.0.md` (approved), the recommendation-feedback family (`kind:'feedback'`,
introduced by C2) is confirmed as FITME's canonical behavioral-event model, formalized with a
closed event vocabulary and a versioned entry schema (version 1: `kind`, `surface`, `contextId`,
`feedbackType`, `date`, `ts`). The pre-existing ordinary Trigger-fired record family
(`recordCoachEvent`/`TRIGGER_RECORD_EVENT`, no `kind` field) is reclassified as legacy
bookkeeping, outside the canonical event model — no new architectural consumer may be built
against it. Whether its producer continues to run, is deprecated, or is removed is left as an
implementation-strategy question for a future, separately-approved task. A retention policy —
feedback evidence has priority over legacy bookkeeping within the existing 200-entry cap — is
recorded canonically; its implementation mechanism is intentionally left unspecified. No Trigger
Engine, Persistence Gateway, StateAccess, or Engine Registry code was added, removed, or
refactored; `coachEvents` remains exactly where it is, governed exactly as it already is.

### Added

- Canonical event vocabulary and schema (documentation-level; no new code artifact mandated).
- Permanent documentation of six known, accepted, unresolved-by-C3 limitations from the C3
  Discovery Report: C3-F01 (non-transactional concurrent writes to `coachEvents`), C3-F04 (no
  notification delivery/open tracking), C3-F05 (dual ownership of `coachEvents`), C3-F06
  (feedback events share `SYSTEM_METADATA` domain tier with pure bookkeeping), C3-F07 (no
  server-side validation of `coachEvents` content/timestamps), C3-F08 (idempotency ledger is
  in-memory only, non-durable).

### Changed

- Nothing in `js/`. No Trigger Engine, Persistence Gateway, StateAccess, or Engine Registry
  behavior changed. No Firestore schema, Firestore Security Rules, or Firebase Functions changes.

### Verification

- `1044` passed / `0` failed (`node --test tests/*.test.js`), unmodified from the C2 baseline.
- B1–B5 and C1/C2 contracts preserved unchanged.
- No new engines, memory models, event models, or persistence models.
- Product/Architecture approval: `APPROVED`. C3 is `CLOSED`.

### Next

C4 — Typed Memory Server Write Path is approved, implemented and closed (2026-07-26). Phase C
(C1–C4) is complete; the next canonical task is pending Product/Architecture direction.

---

## C2 — Rejection and Suppression Feedback

**Date:** 2026-07-26
**Status:** Merged to `main`
**Implementation Version:** 2.41.0
**Commit:** `14755fc`

### Summary

Gives FITME a retained, structured record of how a user responds to the two existing
recommendation-like surfaces (Trigger cards/notifications, Adaptive TDEE proposals), and uses it
to temporarily and reversibly suppress recommendations a repeated-decline pattern shows aren't
landing — per `docs/specs/C2_SPEC_v1.1.md`. A single decline never independently suppresses
anything (CD-02); suppression is always temporary, reversible, and never punitive (CD-07); an
explicit positive action immediately restores eligibility (CD-03/CD-07). No new engines, memory
models, event models, or persistence models; B1–B5 and C1 contracts preserved unchanged.

### Added

- `js/feedback/feedbackDomain.js` — new shared pure utility (same tier as `ProfileMetrics`,
  `DateUtils`, `CoachProfile`; not an Engine, not registered with `EngineRegistry`): classifies a
  gesture into one of the 8 canonical CD-04 feedback types, and recomputes suppression from
  source via a named/versioned recovery policy (`SUPPRESSION_RECOVERY_POLICY_V1`), following the
  same policy-catalog pattern already established by B5's `DerivedIntelligenceConsumer`.
- One new Persistence Gateway closed-catalog operation, `RECOMMENDATION_FEEDBACK_RECORD` — reuses
  the existing `coachEvents` durable surface and the existing `triggerState`/`profileGoalsState`
  owner identifiers (no new owner, no new Firestore field/collection).
- Two new StateAccess capabilities, `recommendationFeedbackHistory` (read) /
  `recordRecommendationFeedback` (write), scoped only to `triggerEngine/DAILY_COACH_CHECK` and
  `adaptiveTdeeEngine/ADAPTIVE_CHECK`.
- A dismiss gesture on the Trigger card (none existed previously).

### Changed

- `js/trigger/triggerController.js` — `runCoachTriggers` filters candidates through
  `FeedbackDomain.evaluateSuppression`; `presentTriggerCard` adds the dismiss gesture.
  `TriggerDomain.canFire` is unchanged.
- `js/adaptive/adaptiveTdeeController.js` — `applyAdaptiveUpdate`/`dismissAdaptiveUpdate` now
  record `Accepted`/`Dismissed` feedback (`dismissAdaptiveUpdate` keeps its existing
  `saveProfile()` defer-write, preserving external behaviour unchanged); `runAdaptiveCheck`
  consults the suppression gate for the `ADAPTIVE_CHECK` action only.
- `index.html` script order and `sw.js` SHELL updated for `js/feedback/feedbackDomain.js`;
  `APP_VERSION`/service-worker `VERSION` advanced from `2.40.0` to `2.41.0`.

### Verification

- `1044` passed / `0` failed (`node --test tests/*.test.js`).
- New coverage: `tests/feedbackDomain.test.js`, `tests/c2Wiring.test.js`, plus C2-numbered cases
  added to `tests/persistenceGateway.test.js`, `tests/stateAccess.test.js`,
  `tests/triggerController.test.js`, `tests/adaptiveTdeeController.test.js`.
- B1, B2, B3, B4, B5 and C1 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- No Firestore schema, Firestore Security Rules or Firebase Functions changes.
- No new engines, memory models, event models, or persistence models.
- Product/Architecture approval: `APPROVED`. C2 is `CLOSED`.

### Next

C3 — Event Model Decision is approved and closed (2026-07-26, canonical decision, no production
code changes). C4 — Typed Memory Server Write Path is approved, implemented and closed
(2026-07-26). Phase C (C1–C4) is complete; the next canonical task is pending Product/Architecture
direction.

---

## Governance — FITME Intelligence & Relationship Philosophy v1.1

**Date:** 2026-07-26
**Status:** Documentation-only, approved and Canonical

### Summary

`docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` (canonical content, revised to v1.1 during editorial review) is approved as a Canonical governance document. It defines FITME's permanent intelligence and relationship philosophy — how FITME thinks, how it understands people, and the kind of relationship it is designed to build with every user — independent of feature, implementation or architecture detail.

### Verification

- No application code, Firestore schema, or product behaviour changes.
- No Coach Bible, Coach Knowledge Base, Product Bible, AI Constitution, Architecture or Engineering Workflow changes.
- No Firestore rules, Firebase Functions, or `APP_VERSION` changes.

### Next

Governance: none — this document's own Governance section (Canonical Authority, Document Scope, Authority Hierarchy, Amendment Process, Interpretation Rules) remains headings-only pending policy content to be supplied separately. Because that content (specifically Authority Hierarchy) is not yet available, this entry does not update the Source of Truth hierarchy in `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §3 or the Governance References section of the Product Bible — both remain open follow-ups.
Engineering: next task remains unnamed, pending Product/Architecture direction (unaffected by this documentation work).

---

## Governance — Coach Knowledge Base Complete (Topics 01–36)

**Date:** 2026-07-23
**Status:** Documentation-only, merged to `main`

### Summary

`docs/governance/FITME_Coach_Knowledge_Base.md` (v2.0) is now complete. Topics 02–36 were authored across Part 1 (Human Nature), Part 2 (Health Psychology), Part 3 (The FITME Coach) and Part 4 (Product Translation), each grounded in its corresponding FITME Coach Bible chapter(s) and matching the structure, depth and writing style of the approved Topic 01 Gold Standard (v1.1). All 36 Topics are Canonical. The Knowledge Base authoring program is closed.

### Verification

- All 36 Topics present, sequentially numbered, matching the Knowledge Map exactly — no missing Topics, no broken numbering, no placeholders, no duplicated content.
- Every Related Knowledge Topics cross-reference validated programmatically against the canonical Knowledge Map (topic number and name).
- No application code, Firestore schema, or product behaviour changes.
- No Coach Bible, Product Bible, AI Constitution, Architecture or Engineering Workflow changes.
- Knowledge Map, Canonical Topic Structure and Knowledge Authoring Standard unchanged.
- Topics 31–36 (Product Translation) contain knowledge-level canonical implications only; no product, UX, AI or architecture decisions were introduced.

### Next

Knowledge Base: none — authoring program complete.
Engineering: C2 — Rejection and Suppression Feedback remains the next engineering task, unaffected by this documentation work.

---

## Governance — Coach Knowledge Base Foundation and Topic 01 Gold Standard

**Date:** 2026-07-23
**Status:** Documentation-only, merged to `main`

### Summary

`docs/governance/FITME_Coach_Knowledge_Base.md` (v2.0) was completed as the canonical professional knowledge reference: its Canonical Rules, the unchanged Knowledge Map, the Canonical Topic Structure, and the Knowledge Authoring Standard were finalized and approved. Topic 01 — "Why do people fail?" was reviewed against the Canonical Review Checklist, received narrow editorial corrections (cross-reference consistency, a completed Related Knowledge Topics list, and a strengthened closing synthesis in FITME Interpretation), and was approved as v1.1 — the Gold Standard reference Topic that Topics 02–36 must match in structure, depth and writing style.

### Verification

- No application code, Firestore schema, or product behaviour changes.
- No Coach Bible, Product Bible, AI Constitution, Architecture or Engineering Workflow changes.
- Knowledge Map, Canonical Topic Structure and Knowledge Authoring Standard unchanged by this entry.
- Topic 02 and Topics 03–36 not started.

### Next

Knowledge Base: Topic 02 — "Why do people succeed?", pending authoring.
Engineering: C2 — Rejection and Suppression Feedback remains the next engineering task, unaffected by this documentation work.

---

## Governance — Coach Bible Integration

**Date:** 2026-07-22
**Status:** Documentation-only, merged to `main`

### Summary

`docs/governance/FITME_Coach_Bible.md` (Chapter 1 — canonical coaching doctrine, approved) and
`docs/governance/FITME_Coach_Knowledge_Base.md` (living research repository) were referenced from
the documents that should point to them: `docs/product/Product_Bible.md.docx` (new "Governance
References" section), `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` (Source of Truth
hierarchy, §3), and this Roadmap/Changelog.

### Verification

- Coach Bible and Coach Knowledge Base content unchanged.
- No application code, Firestore schema, or product behaviour changes.

---

## C1 — Modularization and Tests (WP1–WP11)

**Date:** 2026-07-21
**Status:** Merged to `main`
**Implementation Versions:** 2.25.0–2.40.0

### Summary

Incremental, contract-preserving modularization of `js/app.js` (4,453 lines at the reviewed
B5-era baseline) into independently testable modules, per `docs/specs/C1_SPEC_v1.0.md`. Zero
intended product-behaviour change; B1–B5 contracts (Canonical Memory, Engine Registry, State
Access, Persistence Gateway, Derived Intelligence Consumption) preserved unchanged throughout.

### Added

- `js/core/` — `dateUtils.js`, `numberUtils.js`, `jsonUtils.js`, `stringUtils.js` (WP1)
- `js/domain/` — `profileMetrics.js`, `nutritionModel.js` (WP1)
- `js/adapters/` — `authAdapter.js`, `notificationAdapter.js`, `imageAdapter.js`,
  `barcodeScannerAdapter.js`, `openFoodFactsClient.js`, `claudeProxyClient.js` (WP2)
- `js/repositories/` — `profileRepository.js`, `dayRepository.js`, `favoritesRepository.js`,
  `groupRepository.js`, `barcodeRepository.js` (WP3)
- `js/app/` — `runtimeState.js`, `bootstrapController.js`, `authSessionController.js` (WP4)
- `js/nutrition/` — `nutritionAnalysisService.js`, `mealDraft.js`, `mealEditorPresenter.js`,
  `mealCommitService.js`, `quickLogService.js`, `barcodeFlowController.js` (WP5A–F)
- `js/coach/` — `coachProfile.js`, `coachPromptComposer.js`, `coachClient.js`,
  `coachPresenter.js` (WP6)
- `js/adaptive/` — `adaptiveTdeeDomain.js`, `adaptiveTdeeController.js` (WP7)
- `js/trigger/` — `triggerDomain.js`, `triggerController.js` (WP8)
- `js/engines/` — `habitEngine.js`, `patternEngine.js`, `adaptiveTdeeEngineAdapter.js`,
  `triggerEngineAdapter.js`, `registerEngines.js` (WP9)
- `js/ui/` — `navigationController.js`, `homePresenter.js`, `profilePresenter.js`,
  `settingsPresenter.js`, `foodScreenPresenter.js`, `dayNavigationController.js` (WP10)

### Changed

- `js/app.js` reduced to composition/configuration, thin backward-compatible facades required
  by inline HTML handlers, and startup orchestration; all extracted domain logic runs unchanged
  and independently unit-testable in Node.
- Every override/wrapper chain identified in `docs/architecture/C1_WP0_INVENTORY.md` (navigation,
  home rendering, the Day Navigation IIFE, `buildCoachSystemPrompt`, engine orchestration
  overrides on `showApp`/`logWeight`/`saveWorkout`/`scheduleLocalNotifications`) consolidated
  into a single authoritative runtime definition per WP10/WP11, with no change to call order,
  DOM IDs, visual copy, or persistence/event vocabulary.
- `index.html` script order and `sw.js` SHELL updated for every new module, in each WP's own
  commit; `APP_VERSION`/service-worker `VERSION` advanced in lockstep from `2.25.0` (WP1) to
  `2.40.0` (WP11).

### Verification

- WP0 pre-implementation regression baseline: `262 passed / 0 failed`.
- Final regression suite after WP11: `995 passed / 0 failed`.
- B1, B2, B3, B4 and B5 preserved unchanged throughout; REM-001, REM-002 and REM-003 preserved
  unchanged.
- No Firestore schema, Firestore Security Rules or Firebase Functions changes.
- No product behaviour, UX, or copy changes.
- Product/Architecture approval: `APPROVED`. C1 is `CLOSED`.

### Next

C2 — Rejection and Suppression Feedback is `NEXT`, pending its own approved specification.
Implementation has not begun.

---

## B1 — Canonical Memory Decision

**Date:** 2026-07-17
**Status:** Approved and closed (architecture decision only — no application version change)

### Decision

- One canonical logical user-memory model approved for FITME.
- `coachMemory` is designated as the migration base for canonical coach memory.
- Typed memory (`users/{uid}/memories`) is not a competing authority; it is directed to be mapped
  into the canonical model over time, not replaced or run as a parallel store.
- Habit Engine and Pattern Engine outputs are classified as Derived Intelligence Views —
  recomputable from source, not independent memory authorities.

### Verification

- Engineering Readiness Review: `READY`.
- Product/Architecture Review: `APPROVED`.
- No code, Firestore, Firebase Functions, or data migration changes.

### Next

B2 — Engine Contract and Registry is `NEXT`.

---

## v2.23.0 — B4 Persistence Contract

**Date:** 2026-07-18
**Status:** Merged to `main`

### Added

- `js/persistenceGateway.js` — one logical Persistence Gateway: closed six-operation catalog
  (`DERIVED_HABITS_REPLACE`, `DERIVED_PATTERNS_REPLACE`, `DERIVED_ADAPTIVE_PROPOSAL_APPLY`,
  `TRIGGER_RECORD_EVENT`, `TRIGGER_UPDATE_BUDGET`, `SOURCE_HISTORY_SAVE_DAY`), field-scoped
  Repository Layer, and a full validation pipeline (owner, domain, session generation,
  authority, payload, idempotency) ahead of every durable write.
- Ownership, Authority (REM-003) and Session (REM-002) validation enforced by the gateway
  itself, in addition to the existing B3 State Access Layer checks.
- Bounded retry (max 3 attempts, transient Firestore errors only, session re-checked before
  every retry) and an idempotency ledger (required for the append-style
  `TRIGGER_RECORD_EVENT`; naturally idempotent replace operations do not require a key).
- Pattern Engine conflict detection: `DERIVED_PATTERNS_REPLACE` checks `expectedVersion`
  against the durable `patternsMeta.sourceFingerprint` inside a Firestore transaction,
  returning `CONFLICT` (not a generic failure) on mismatch.
- `tests/persistenceGateway.test.js` with 52 automated tests.

### Changed

- Habit Engine, Pattern Engine, Adaptive TDEE (user-approved apply), Trigger Engine, and the
  AI-nutrition final authoritative boundary (`addMeal()`/`logQuick()`) now persist exclusively
  through the gateway instead of the broad `saveProfile()`/direct Firestore writes.
- Engine persistence outcome is reported via `output.persistence`
  (`{requested, status, requestId}`) on the `EngineRunResult` returned by each adapter —
  `js/engineRegistry.js` was not modified (its `EngineRunResult` shape stays closed).
- `applyAdaptiveUpdate()` and the meal-logging paths now use candidate-before-commit semantics
  with explicit rollback on a failed durable write, instead of mutating `userProfile`/
  `todayData` optimistically and silently swallowing persistence errors.
- `tests/stateAccess.test.js` updated for the new dependency signatures injected into
  `js/stateAccess.js`'s write operations (the operations' own contract — status/changed/
  domain/command/error/metadata — is unchanged).

### Fixed (Implementation Review)

- Habit Engine's write had no rollback on a failed durable write (unreachable before B4, since
  `saveProfile()` never rejected) — could silently advance `habitsMeta.lastRun` in memory
  without a durable save, blocking that day's retry. Aligned with Pattern's existing
  snapshot-and-rollback pattern.
- Trigger Engine's `markTriggerFired`/`recordCoachEvent` had the same class of gap —
  `markTriggerFired` in particular could permanently block `canFire()` retries for a trigger
  type after a failed write. Fixed with the same rollback pattern.
- The failure-path alert in `addMeal()`/`logQuick()`/`applyAdaptiveUpdate()` was not gated by
  session currency, unlike the success path — a user who signed out mid-flight could still see
  a stale-session failure alert. Fixed to match REM-002's completion-effect suppression rule.

### Verification

- Engineering Readiness Review: `READY`.
- Implementation Review: `APPROVED`, with the three corrections above applied and
  regression-tested.
- Automated tests: `170 passed / 0 failed`.
- B1, B2 and B3 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No B5/Recommendation Engine implementation.

### Next

B5 — Habit and Pattern Consumption Path is `NEXT`.

---

## v2.24.0 — B5 Habit and Pattern Consumption Path

**Date:** 2026-07-19
**Status:** Merged to `main`

### Added

- `js/derivedIntelligenceConsumer.js` — the sole consumption adapter for Habit/Pattern
  Derived Intelligence Views: request validation, a closed versioned Consumer Policy
  Catalog (`COACH_PROMPT_V1` fully enabled; `RECOMMENDATION_SUPPORT_V1` contract/test-only;
  `TEST_FULL_DIAGNOSTIC_V1` test-harness-only; `INITIATIVE_ENGINE`/`DECISION_ENGINE`
  disabled), `DerivedViewSnapshot` envelope construction, record normalization
  (Habit/Pattern → closed Domain/Topic/Qualifier vocabulary), duplicate resolution
  (byte-equivalent collapse, conflicting records diagnosed and excluded), eligibility
  filtering (lifecycle/confidence/evidence/freshness), the locked §22.3 freshness formula,
  relevance evaluation (domain/topic/temporal/sequence, `intent.purpose`
  `IMMEDIATE`/`REVIEW`), contradiction detection, overlap detection with deterministic
  primary selection, stable ordering, and policy-bounded truncation. Returns an immutable,
  deterministic `DerivedIntelligenceContext`. Performs zero durable writes and never
  triggers producer recomputation.
- `js/derivedIntelligencePrompt.js` — a separate, pure Hebrew prompt projector: bounded to
  8 items / 1,200 characters, cautious non-absolute wording (`ACTIVE` vs `CONFIRMED`
  lifecycle phrasing), no internal IDs/confidence values, and safe omission of any
  unsupported label key.
- New B3 State Access capability `derivedIntelligenceConsumer`/`BUILD` in
  `js/stateAccess.js`, reusing the existing `habitView`/`patternView` read operations
  unchanged, with no new write operations (`writes: []`).
- `tests/derivedIntelligenceConsumer.test.js` (66 tests) and
  `tests/derivedIntelligencePrompt.test.js` (10 tests) covering the full SPEC §57.1-§57.8
  minimum test matrix, plus `tests/b5Wiring.test.js` (10 static wiring checks) covering
  §57.9 Integration.

### Changed

- `buildCoachSystemPrompt()` (`js/app.js`) is now `async` and calls
  `DerivedIntelligenceConsumer.build()` (consumer `AI_COACH_PROMPT`, policy
  `COACH_PROMPT_V1`) followed by `DerivedIntelligencePrompt.project()` to append a bounded
  Hebrew derived-intelligence fragment to the Coach system prompt. The call is wrapped in
  try/catch — any B5 failure (state access, session, validation) degrades silently to the
  existing prompt (memory fragment + base persona), never blocking the Coach. Its one
  caller (`coachMessage()`) was updated to `await` it.
- `index.html` / `sw.js`: both new modules registered, loaded after
  `persistenceGateway.js` and before `app.js`; `APP_VERSION` / service worker `VERSION`
  bumped to `2.24.0`.

### Corrected (External Implementation Review)

The spec text in `docs/tasks/B5/B5_SPEC_v1.0.md` had since been revised to v1.2 (a canonical
correction), which locks a stricter requirement than the v1.1 text this implementation was
originally reviewed against. An independent External Implementation Review against the
current v1.2 text found two defects, both since fixed in `js/derivedIntelligenceConsumer.js`:

- **Production-safe adapter separation (§19.5/§41.2/§42.3/§51.4).** `window.DerivedIntelligenceConsumer`
  was previously the same object as the Node module export, so `TEST_HARNESS`/
  `TEST_FULL_DIAGNOSTIC_V1` (full per-signal diagnostics) were reachable from any
  browser-side caller. Added `buildProductionSafe()` and a separate `PRODUCTION_SAFE_API`
  object — `window` now receives only a production-safe adapter that accepts exclusively the
  production-enabled mapping (`AI_COACH_PROMPT` → `COACH_PROMPT_V1`) and rejects everything
  else with `POLICY_NOT_ALLOWED_FOR_CONSUMER` before the core module is ever invoked. The
  complete core module (all consumers/policies, for the Node test runner only) remains
  available exclusively via `module.exports`.
- **Contradiction category (§26.2).** `detectContradictions()` labeled every detected
  contradiction `LIFECYCLE_CONFLICT`; the only case implemented (opposing `ACTIVE`/`SKIP`
  tendency on identical domain/topic/qualifiers) is `OPPOSING_BEHAVIOR` per the spec's own
  closed taxonomy. Corrected; diagnostic-only, no behavioral change.

6 new regression tests added (5 in `tests/derivedIntelligenceConsumer.test.js`, 1 static check
in `tests/b5Wiring.test.js`) covering both corrections.

### Verification

- Engineering Readiness Review: the v1.1-era review returned `READY`; the spec was
  subsequently revised to v1.2 specifically to close the production-safe-adapter gap.
  External Implementation Review against the v1.2 text found that gap (plus the
  contradiction-category mislabel) still open; both were corrected as described above and
  independently re-verified at runtime (simulated browser `window` global plus direct
  output inspection, not just passing tests).
- External Engineering Re-Review (v1.2): `READY`. Implementation Review: `APPROVED`.
- Automated tests: `262 passed / 0 failed` (170 pre-existing + 86 B5 + 6 correction tests).
- B1, B2, B3 and B4 preserved unchanged; REM-001, REM-002 and REM-003 preserved unchanged.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No new Persistence Gateway operation; no new Engine Registry registration (B5 is a
  capability-holder under B3, not a B2 Engine — ADR-B5-008).
- B5_SPEC Appendix F closure record completed. B5 is `CLOSED`. Finding F9 is closed.

### Next

Phase C (maintainability/scale) items, per the Architecture Remediation Plan, are next.

---

## v2.22.0 — B3 State Ownership and Access Boundaries

**Date:** 2026-07-17
**Status:** Merged to `main`

### Added

- `js/stateAccess.js` — one logical State Access Layer module: `createEngineAccess()` factory,
  scoped read/write capability objects, and the locked permission matrix for the four B2 engines.
- `tests/stateAccess.test.js` with 34 automated tests.

### Changed

- `context.state` added additively to `EngineRunContext`, created exclusively by trusted adapter
  code in `js/app.js`; no parallel `run(context, access)` channel exists.
- Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine now read and write
  exclusively through scoped `context.state` capabilities instead of direct `userProfile` /
  `todayData` / Firestore access.
- Habit Engine and Pattern Engine stopped writing the shared `coachMemory.lastUpdated` field;
  each now maintains its own timestamp inside `habitsMeta` / `patternsMeta`.
- Engine computation separated from UI rendering (`presentTriggerCard`,
  `presentWorkoutTriggerCard`); visible card content and timing unchanged.
- `tests/b2Wiring.test.js` and `tests/habitSingleFlight.test.js` updated/extended for the new
  signatures and for behavioral coverage of the Habit single-flight self-provisioning path.
- `APP_VERSION` and service-worker cache version advanced to `2.22.0`.

### Verification

- Engineering Readiness Review + focused Re-Review: `READY`.
- Code Review: `APPROVED`, with two mechanical corrections applied (post-await session re-check on
  three write commands; added behavioral test coverage) and one architectural clarification —
  Habit single-flight self-provisioning on Pattern's internal soft-invocation path is orchestration
  helper code, not a second capability channel: `NO SPEC VIOLATION`, confirmed by Product/Architecture.
- Automated tests: `116 passed / 0 failed`.
- No Firestore schema, Firestore rules or Firebase Functions changes.
- No B4/B5/Recommendation Engine implementation.

### Next

B4 — Persistence Contract is `NEXT`.

---

## v2.21.0 — B2 Engine Contract and Registry

**Date:** 2026-07-17
**Status:** Merged to `main`

### Added

- `js/engineRegistry.js` — pure Engine Registry / Orchestrator module.
- Explicit per-engine `actions` and `payloads` (`EngineRunRequest`): every orchestration run supplies
  each engine its own action from a per-engine-id map — no engine's behavior is ever selected by
  treating an absent/`undefined` action as an implicit default.
- Habit Engine single-flight (session-generation-scoped), guaranteeing Habit Engine's underlying
  computation cannot run twice when both the Registry and Pattern Engine's internal call invoke it
  around the same time — independent of execution order.
- `tests/engineRegistry.test.js`, `tests/habitSingleFlight.test.js`, `tests/b2Wiring.test.js`.

### Changed

- Habit Engine, Pattern Engine, Adaptive TDEE Engine and Trigger Engine are now registered with, and
  invoked exclusively through, the Engine Registry.
- Removed the prior engine-orchestration override-chain wrappers on `showApp` (Stages 4–7),
  `logWeight` and `saveWorkout`.
- `scheduleLocalNotifications` consolidated to a single definition (previously a base function fully
  replaced by a later version — the base was dead code, never reached in production).
- `APP_VERSION` and service-worker cache version advanced to `2.21.0`.

### Verification

- Engineering Readiness Review Round 2: `READY`.
- Code Review: two correction rounds applied and re-verified (Habit single-flight, explicit
  per-engine action routing), `FIXED AND APPROVED`.
- Automated tests: `86 passed / 0 failed`.
- No Firestore rules changes.
- No Firebase Functions changes.
- No B3/B4/B5 implementation.

### Next

B3 — State Ownership and Access Boundaries is `NEXT`.

---

## v2.20.0 — REM-003 Generative vs. Authoritative Boundary

**Date:** 2026-07-16
**Status:** Merged to `main`

### Added

- `js/authorityContract.js` — pure Authority Contract module (Authority Metadata + Audit Trail).
- `tests/authorityContract.test.js` with 7 automated tests.

### Changed

- Every write path that receives LLM-generated content as input now attaches Authority Metadata
  (`authoritySource`, `createdBy`, `createdAt`, `rule`, `systemVersion`) before persistence.
- Quick Learn (`submitQuickLearn` / `logQuick`) brought into the same Authoritative Write Contract
  as every other AI entry point: the quick-log catalog is tagged as Generative Persistent Data,
  and the moment an item is actually logged to the diary it is re-validated and tagged
  `USER_CONFIRMED_AI_ESTIMATE` before it becomes authoritative.
- Weekly Menu (`generatePlan`) is explicitly tagged as Generative Persistent Data — not read by
  any deterministic engine, not treated as fact.
- Habit Engine, Pattern Engine and Adaptive TDEE writes now carry explicit authority metadata
  (`HABIT_ENGINE`, `PATTERN_ENGINE`, `SYSTEM` with rule `ADAPTIVE_TDEE_USER_APPROVED`) without any
  change to their existing detection/computation logic.
- `APP_VERSION` and service-worker cache version advanced to `2.20.0`.

### Verification

- Engineering Readiness Review: `READY` (after one round of SPEC corrections).
- Automated tests: `42 passed / 0 failed` (26 REM-001 + 9 REM-002 + 7 REM-003).
- No changes to Firebase Functions or Firestore rules.
- No Phase B work included (Canonical Memory, Engine Registry, State Ownership, full Persistence
  Contract remain explicitly out of scope and unstarted).

---

## v2.19.0 — REM-002 Session State Reset and Account Isolation

**Date:** 2026-07-16
**Status:** Merged to `main`

- Central Session Lifecycle Manager.
- Runtime session isolation.
- Async session generation guards.
- Runtime cleanup across user-scoped state.
- APP_VERSION updated to 2.19.0.

---

## v2.18.0 — REM-001 Nutrition Output Validation

**Date:** 2026-07-16  
**Status:** Merged to `main`

### Added

- `js/nutritionValidator.js` — shared pure deterministic validator.
- Validation statuses: `VALID`, `REVIEW_REQUIRED`, `REJECTED`.
- Hard validation for malformed, missing, negative, non-finite and contradictory nutrition values.
- Soft validation for macro completeness, macro/calorie mismatch and zero-value plausibility.
- Minimal review/recovery handling for suspicious or rejected AI estimates.
- `tests/nutritionValidator.test.js` with 26 automated tests.
- Architecture remediation plan.
- Approved REM-001 specification.

### Changed

- Every approved AI nutrition entry path now uses the shared normalization and validation layer.
- AI-generated nutrition is validated immediately after normalization.
- Final edited values are validated again before authoritative persistence.
- Invalid AI values are no longer silently coerced to zero.
- Transient nutrition-analysis state is cleared on authentication reset/sign-out.
- `APP_VERSION` and service-worker cache version advanced to `2.18.0`.

### Verification

- Engineering Readiness Review: `READY`.
- Automated tests: `26 passed / 0 failed`.
- Scope check confirmed no changes to Firebase Functions, Firestore rules, Habit Engine, Pattern Engine, Trigger Engine or Adaptive TDEE logic.
- Broad manual end-to-end QA is deferred to the planned AI-core integration checkpoint.

### Deployment

- Static application changes only.
- Published by commit and push to the configured GitHub Pages branch.
- No Firebase deploy required.

---

## v2.17.1 — Pattern Engine Stabilization

- Pattern Engine completed and approved.
- Full-history retrieval bug fixed.
- Current-state architecture documented.

---

## v2.15.0 — Habit Engine

- Habit Engine added to `js/app.js`.
- Daily non-blocking recomputation from source history.
- Results stored in `coachMemory.habits[]` and `coachMemory.habitsMeta`.
- No new UI, collection, Cloud Function or Firestore-rules change.

---

## Next

C2 — Rejection and Suppression Feedback is approved, implemented (v2.41.0, commit `14755fc`) and
closed (2026-07-26). C3 — Event Model Decision is approved and closed (2026-07-26, canonical
decision, no production code changes). C4 — Typed Memory Server Write Path is approved,
implemented (commit `f026123`) and closed (2026-07-26, server-side only, no `APP_VERSION` change).
Phase C (C1–C4) is complete; the next canonical task is pending Product/Architecture direction.
