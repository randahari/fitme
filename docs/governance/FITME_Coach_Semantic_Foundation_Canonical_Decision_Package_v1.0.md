
# FITME — COACH SEMANTIC FOUNDATION CANONICAL DECISION PACKAGE
## v1.3 — CANONICAL (CSF-01–16 approved; First Active V1 Reason Policy and Lifecycle-Aware B5 Eligibility closed; Habit Lifecycle Establishment Correction — IMPLEMENTED AND VERIFIED, Chapter 29.7; remaining items explicitly deferred/non-blocking)

> **Document role:** Decision Package. Not a SPEC. Not an implementation document. Modeled structurally on `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` and `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` — the repository's established precedent for recording a cross-cutting Product/Architecture foundation as a standalone Package rather than fragmenting it across the documents it will eventually synchronize into.
> **Prepared by:** Lead Engineer / Repository Analyst / Canonical Decision Package Author, recording direction presented as approved by the Head of Product + AI Architect (CSF-01 through CSF-16; Chapter 29), without reinterpretation, plus the deterministic engineering consequences that direction implies and the genuinely unresolved Product/Architecture items it does not itself close.
> **Repository baseline:** `main`, commit `30451b0f1fd790ff8edd6acd1b1eeee2b1f5259f` (`docs(g2): close pre-spec canonical decisions`) for v1.0/v1.1; `ed0882eed2978a330473a682d1131b42085b0986` (`docs(coach): close semantic foundation`) for v1.2; same HEAD for v1.3 — the Chapter 29 implementation (§29.7) and this closure revision exist in the working tree only, not yet committed at authoring time.
> **Origin:** During Canonical Review of `docs/specs/G2_SPEC_v1.0.md`, the `validReasonCategory`/`trustTestSignal` construction problem was found not to be a missing lookup table but evidence of a deeper, previously-unbuilt capability: FITME's own governing philosophy ("Context Determines Meaning" — Intelligence & Relationship Philosophy, Principle 6; "Understanding is always the first responsibility" — Principle 4; "Without context there is no coaching" — Constitution) has never been operationalized into D1's own operational Unit sequence, which moves directly from Unit 05 (Opportunity Detection — recognizing that a pattern *exists*) to Unit 06 (Intervention Eligibility — the Reason/Trust gate) with no intervening Unit that interprets what a pattern *means*. This Package records the Product + Architecture foundation closing that gap.
> **Status of this version:** CANONICAL — CLOSED. CSF-01 through CSF-16 are approved Product + Architecture direction (unchanged from v1.0). **v1.1 recorded two further closures:** the **First Active V1 Reason Policy** — `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, scoped exclusively to Habit-sourced `FOOD_LOGGING` degradation into the Habit Engine's `WEAKENING` lifecycle state (Chapter 26) — and the **Lifecycle-Aware B5 Eligibility Architecture Decision** — Habit-derived `WEAKENING` admission only, Pattern-derived `WEAKENING` explicitly excluded from v1 (Chapter 27). **v1.2 recorded a further correction, at the time approved but not yet implemented:** during G-2 Engineering Readiness Review, empirical verification found Chapter 27.1's "structural guarantee" claim insufficient to guarantee `WEAKENING` reachability for `period:'weekly'` Habit signals (8 of 12 concrete identities, including the exact `FOOD_LOGGING`/`log-consistency` signal Chapter 26 depends on). The **Habit Lifecycle Establishment Correction** (Chapter 29) resolves this — separating permanent Historical Fact from resettable Current-Episode Establishment Authority — and is APPROVED as Product + Architecture direction. **As of v1.3, it has now been implemented and production-backed verified — see Chapter 29.7.** This closes the Chapter 29 prerequisite specifically; G-2 implementation itself remains paused and must separately return through its own Engineering Readiness / authorization gate before implementation begins (Chapter 24, unchanged). PD-1, PD-2, PD-4, AD-Detail-1, and AD-Detail-3 remain reclassified DEFERRED / NON-BLOCKING (Chapters 11–12) — none prevents this Package from closing. `docs/specs/G2_SPEC_v1.0.md` receives an additive correction alongside this v1.2 revision — see Chapter 29.6. A Canonical Synchronization Plan is recorded (Chapter 28) but not executed for the v1.1 items; Chapter 29's own, narrower synchronization is recorded at Chapter 29, Documents Affected. **v1.3 records Chapter 29's implementation closure — see Chapter 29.7.**

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| D1 | D1 Spec v1.0 | `docs/specs/D1_SPEC_v1.0.md` |
| D2 | D2 Spec v1.0 | `docs/specs/D2_SPEC_v1.0.md` |
| D3 | D3 Spec | `docs/specs/D3_SPEC.md` |
| T004 | TASK-004 Spec v1.0 | `docs/specs/TASK_004_SPEC_v1.0.md` |
| T005 | TASK-005 Spec v1.0 | `docs/specs/TASK_005_SPEC_v1.0.md` |
| T006 | TASK-006 Spec v1.0 | `docs/specs/TASK_006_SPEC_v1.0.md` |
| B5 | Derived Intelligence Consumer Spec | `docs/tasks/B5/B5_SPEC_v1.0.md` |
| G2P | G-2 Canonical Decision Package v1.4 (`CD-G2-01/02/03`, `PD-G2-05`, `AD-G2-01/02/03`) | `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` |
| G2S | G-2 SPEC v1.0 (Draft) | `docs/specs/G2_SPEC_v1.0.md` |
| Constitution | AI Constitution v1.0 | `docs/constitution/FITME_AI_Constitution_v1.0.md` |
| Coach Bible | Coach Bible | `docs/governance/FITME_Coach_Bible.md` |
| Philosophy | Intelligence & Relationship Philosophy v1.0 | `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` |
| CSF | This Package's own numbered decision items (CSF-01–CSF-16) | — |

Citation format: `[ABBR §Section, ~LineN]` for prose documents, `[filename:LineN]` for code.

---

# 01. Status

**CANONICAL — CLOSED.** The conceptual sequence (CSF-01), the Contextual Meaning capability's existence and boundary (CSF-02, CSF-05–CSF-09), the initial Alignment/Trajectory dimensions (CSF-03–CSF-04), the ownership architecture (CSF-08), the valid-reason derivation shape (CSF-10), the Trust/Engagement separation (CSF-13), the Context Classification (CSF-14), the G-2 dependency gate (CSF-15), and the extensibility requirement (CSF-16) are recorded as approved. The First Active V1 Reason Policy (Chapter 26) and the Lifecycle-Aware B5 Eligibility Architecture Decision (Chapter 27) are both approved and closed. **The Habit Lifecycle Establishment Correction (Chapter 29) is approved as Product + Architecture direction, correcting Chapter 27.1's insufficient reachability basis — it has now been implemented and production-backed verified (Chapter 29.7).** This closes the Chapter 29 prerequisite specifically; G-2 implementation itself remains paused and must separately return through its own Engineering Readiness / authorization gate before implementation begins. PD-1, PD-2, PD-4, AD-Detail-1, and AD-Detail-3 are reclassified DEFERRED / NON-BLOCKING (Chapters 11–12) — none blocks this Package's closure. This Package still does not authorize `G2_SPEC_v1.0.md` implementation — see CSF-15, Chapter 24, Chapter 29.6, Chapter 29.7.

---

# 02. Purpose

Establish, once, the durable Product + Architecture foundation by which the Coach Decision System converts an Observation into a Coaching Opportunity through an explicit, non-collapsible Contextual Meaning step — so that G-2, and every future Stage-3 signal source, builds on one consistent semantic model rather than each reinventing (or silently skipping) interpretation.

---

# 03. Canonical Authority and Dependencies

## 3.1 Source Index

Same index as `G2P §3.1` plus: `docs/domain/profileMetrics.js` (protein-target computation), `docs/engines/habitEngine.js`, `docs/engines/patternEngine.js`, `docs/derivedIntelligenceConsumer.js` (Observation-layer repository evidence).

## 3.2 No Reopening of Closed Decisions

This Package does not reopen `CD-G2-01/02/03`, `PD-G2-05`, `AD-G2-01`, `AD-G2-02`, `AD-G2-03`, any TASK-004/005/006 Canonical Decision, or the Decision Window closing criterion. Where `AD-G2-03`'s initial field scope needs an additive extension (Chapter 11, PD-3/PD-4), that extension follows `AD-G2-03` Item 11's own extensibility principle — it is not a reopening.

---

# 04. Background — Repository Evidence for the Gap

- `js/coachDecisionSystem/initiativeEngine.js:299-315` — `detectConfirmedPatternAnticipation()`, the one real, live Stage-3 detector, returns `{sourceCategory, signalId, domain, topic, confidence, evidenceCount, lifecycle}` — purely descriptive, no evaluative content.
- `js/engines/habitEngine.js` (full file), `js/engines/patternEngine.js` (detectors, `statusOf`, `upsertSupported`/`carryAbsent`) — verified: both engines compute only regularity/confidence/trajectory of a behavior, never whether it is good, bad, or goal-relevant. `patternEngine.js`'s own header: *"לא כולל: המלצות, קואצ'ינג, יוזמות, החלטות, AI, UI"* ("does not include: recommendations, coaching, initiatives, decisions, AI, UI") — a deliberate, documented scope boundary.
- `js/derivedIntelligenceConsumer.js:105-143` — the Habit/Pattern → `{domain, topic, qualifiers}` mapping tables — verified: purely structural relabeling, zero evaluative transformation.
- `docs/specs/D1_SPEC_v1.0.md` Units 05→06 — verified: no intervening Unit exists between Opportunity Detection and Intervention Eligibility that interprets meaning.
- `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md:405-417` ("Context Explains Behavior"), `:1052-1056` (Principle 6, "Context Determines Meaning") — the product vision explicitly requires this capability; it has never been architecturally built.
- `docs/constitution/FITME_AI_Constitution_v1.0.md:7546,7582,7586` — "Every recommendation must be built from context... Without context there is no coaching" — the same principle, at the higher-precedence canonical tier.
- `js/domain/profileMetrics.js:30-32` — `computeProteinTarget(weight) { return Math.round((weight || 75) * 1.8); }` — a pure, deterministic, already-shipped formula, confirming Chapter 11 PD-1's finding.

---

# 05. CSF-01 — Canonical Conceptual Sequence (Recorded)

**Approved, verbatim in substance:** the Coach Decision System preserves, without collapsing for implementation convenience:

```
Observation / Descriptive Intelligence
  → User Context
  → Contextual Meaning
  → Coaching Opportunity
  → Engagement Permission
```

Each stage answers exactly one question (Observation: "what happened?"; Contextual Meaning: "what does it mean for this user, in available context?"; Coaching Opportunity: "does that meaning establish a legitimate D1-IE-01 reason?"; Engagement Permission: "even so, is FITME permitted to speak now?"). This sequence uses only existing canonical vocabulary except one link (Contextual Meaning, CSF-02) — it is the direct operationalization of the Philosophy/Constitution citations in Chapter 04, not new philosophy.

---

# 06. CSF-02 — Contextual Meaning Capability (Recorded)

**Approved:** Contextual Meaning is an explicit canonical Coach capability. **Not** a new D3 collaborator, **not** a new Engine, **not** a new pipeline Stage. Preserves all existing D1/D2/D3 Stage boundaries (Stage 3 Opportunity Detection remains Stage 3; Stage 4 Evidence Evaluation, `AD-G2-02`, remains distinct and unaffected; Stage 5 Eligibility remains unchanged).

**Deterministic engineering consequence:** Contextual Meaning is computed *inside* Stage 3, before a `DetectedOpportunity` is constructed — it is not a new Stage between 3 and 4.

---

# 07. CSF-03/CSF-04 — Initial Meaning Dimensions (Recorded)

**Approved, explicitly non-exhaustive and non-permanent:**

- **Alignment** ∈ `{ALIGNED, DEVIATING, NEUTRAL, UNKNOWN}` — relative to a specific, named, available objective.
- **Trajectory** ∈ `{IMPROVING, WORSENING, STABLE, UNKNOWN}` — the Observation's own confirmed direction of change.

**CSF-04, recorded verbatim:** Goal Alignment is one source of Contextual Meaning, not a universal prerequisite. Meaning may legitimately exist with `Alignment: UNKNOWN` — e.g., a Trajectory-only finding (an established pattern's own confirmed weakening/strengthening) is real, evidence-backed Meaning even absent any Goal comparison. `Alignment` SHALL NOT be fabricated where no relevant objective is available — it resolves `UNKNOWN`, honestly, per the repository's established availability discipline.

**Explicitly not decided by this Package:** whether a third or later dimension will ever be needed (e.g., for Location-derived or conversation-derived Observations). No such dimension is approved now, and none is foreclosed.

---

# 08. CSF-05 — Observation Boundary (Recorded)

**Approved:** Habit Engine and Pattern Engine remain descriptive-intelligence producers; they SHALL NOT become coaching-policy authorities. Observation may include: `domain`, `topic`, `qualifiers`, `confidence`, `evidence`/provenance, `lifecycle`, and supported trajectory/change information. **Repository evidence:** `patternEngine.js`'s `statusOf()`/`missedPeriods`/decay mechanics already compute trajectory-relevant state (`weakening`, `inactive`, `confirmed`, `active`) that `initiativeEngine.js`'s current detector does not yet consume — this is an existing, real, already-computed signal, not a new capability to build.

**Deterministic engineering consequence:** no change to `habitEngine.js`/`patternEngine.js`'s own detection logic is authorized or required by this Package. Only `initiativeEngine.js`'s Stage-3 dispatch needs to additionally read the `lifecycle`/`status` transition it already receives but currently discards.

---

# 09. CSF-06 — User Context Boundary (Recorded)

**Approved:** User Context remains assembled exclusively through Memory Layer / Pipeline Context (`D3 §11.1`, unaffected). Contextual Meaning logic SHALL NOT perform direct StateAccess reads. `GoalObjectiveContext ≠ CurrentStateContext ≠ Derived Intelligence` (restated, unaltered from `AD-G2-03`). Unavailable context SHALL NOT be fabricated or defaulted in a way that changes a decision (restated, unaltered from `AD-G2-03` Item 8).

---

# 10. CSF-07 — Goal / Objective Scope (Recorded, with Repository Verification)

**Approved, and repository-verified in full:**

- **Nutrition objective** (`goal`, `goalKcal`) — unchanged, `AD-G2-03`.
- **Protein target** — **repository verification confirms this is a bounded exposure of existing Product semantics, not a new Product objective.** `js/domain/profileMetrics.js:30-32`: `computeProteinTarget(weight) { return Math.round((weight || 75) * 1.8); }` — a pure, deterministic, already-shipped formula, already used in production by `js/app.js:1724`, `js/trigger/triggerController.js:181`, and `js/trigger/triggerDomain.js:80`. No new Product judgment is embedded in exposing its *result* through Memory Layer/Pipeline Context — see Chapter 11, PD-1, for the precise, narrow remaining engineering-fill question this still leaves open (which weight field to pass it).
- **Training-frequency objective** — **confirmed absent.** `index.html:79-81`, `js/app.js:740`: `userProfile.days` is a TDEE activity-level self-report ("2–3 / 4–5 / 6+ workouts/week," used only as a calorie multiplier), collected once at onboarding as a baseline assumption — **not** a forward-looking coaching objective. This Package does not reinterpret it as one, per CSF-07's own instruction. No training-frequency objective is introduced by this Package.
- **Weight/body-composition objective** — not introduced. `readWeightThreshold` (`stateAccess.js:117-121`) returns `{currentWeight, weight}` together; `computeProteinTarget` consumes `userProfile.weight` (not `currentWeight`) for its formula — suggestive but **not conclusive** evidence of `weight`'s role, and this Package does not resolve the ambiguity. See Chapter 11, PD-2.

---

# 11. Product Decisions — Resolved and Deferred

**PD-3 (the Product Reason Policy question) is resolved, narrowly, by Chapter 26 — see there.** The items below are explicitly reclassified DEFERRED / NON-BLOCKING, per Head of Product + AI Architect direction: none is required for this Package's own closure; each remains open only for its own future, separately-scoped resolution.

## PD-1 — Protein-Target Exposure: Which Weight Value — **DEFERRED / NON-BLOCKING**

Not required for Foundation closure. `computeProteinTarget(weight)` remains confirmed bounded/non-new (Chapter 10), but Protein Objective exposure is not part of the v1 Reason Policy (Chapter 26) and is not introduced by this Package. Recommend closing together with PD-2 when both are eventually addressed.

## PD-2 — `weight` vs `currentWeight` Semantics — **DEFERRED / NON-BLOCKING**

Not required for Foundation closure. No v1 rule (Chapter 26) depends on either field. Until separately resolved: body/weight objectives remain unsupported/unavailable; no Meaning rule may depend on them; their future addition must fit the existing foundation without redesign. **Owner (when addressed):** Head of Product (what the two fields represent) jointly with AI Architect (whether a repository correction is needed).

## PD-4 — Meaningful-Progress / Celebration Restraint Threshold (CSF-12) — **DEFERRED / NON-BLOCKING**

Not required for Foundation closure. No numeric or rule-based threshold distinguishing "routine consistency" from "meaningful progress worthy of `CELEBRATE_MEANINGFUL_PROGRESS`" exists anywhere in D1, the Coach Bible, or the Constitution beyond the qualitative restraint principle itself (`D1-IP-06`). Until Product separately approves a criterion, a Meaning state that would require it SHALL resolve `NO_VALID_REASON` for that reason (Chapter 26). No threshold is invented here. **Owner (when addressed):** Head of Product.

---

# 12. Architecture Details — Resolved and Deferred

**AD-Detail-2 is now resolved — see below. The Lifecycle-Aware B5 Eligibility Architecture Decision (Chapter 27) is a new, fully closed decision, not merely a detail.**

## AD-Detail-1 — Shared Semantic Policy Module: Exact Placement and File — **SPEC / ENGINEERING DETAIL, not Canon**

CSF-08 already fixes the governing *shape* (pure, stateless, no StateAccess, no orchestration authority, no Engine/collaborator/Registry status). Exact file/module placement carries no more architectural weight than any other internal module's filename and does not require elevation to a Canonical Decision. AI Architect/Engineering to confirm at SPEC-authoring time, within CSF-08's closed constraint list.

## AD-Detail-2 — Whether Meaning's Provenance Becomes a Named `DetectedOpportunity` Field — **CLOSED**

**Resolved:** a bounded, structured `ContextualMeaning` artifact (`alignment`, `trajectory`, `basis`/provenance), carried on `DetectedOpportunity`, is the canonical traceability contract — not lossy free text. Chosen for testability, auditability, Stage-4 traceability, and consistency with this codebase's existing structured-object idiom (`opportunityProvenance`, `rationale{...}`). Exact implementation syntax remains G2 SPEC detail.

## AD-Detail-3 — `AD-G2-03` Field-Scope Extension Mechanics — **DEFERRED / NON-BLOCKING**

Not required for Foundation closure. No v1 rule (Chapter 26) requires any `GoalObjectiveContext` field beyond what `AD-G2-03` already approves. If a future Product decision requires a new field, its extension mechanics follow `AD-G2-03`'s own "least-authority" design principle (Item 4) — not decided here.

---

# 13. Reason-by-Reason Analysis — All Seven D1-IE-01 Valid Reasons

| `validReasonCategory` | Deterministically derivable from Alignment/Trajectory today? | Basis | Status |
|---|---|---|---|
| **13.1 `PREVENT_PREDICTABLE_MISTAKE`** | No | Plausible for `DEVIATING`+`WORSENING`, but indistinguishable from 13.5 on this model alone | PD-3 |
| **13.2 `HELP_BEFORE_DIFFICULT_DECISION`** | No — not reachable via this model at all | Tied to `DECISION_WINDOW` source, which has no live detector (`G2S §41` RG-1) | Blocked on a separate Repository Gap, not this Package |
| **13.3 `CELEBRATE_MEANINGFUL_PROGRESS`** | No | Plausible for `ALIGNED`+`IMPROVING`, gated by an undefined restraint threshold | PD-4 |
| **13.4 `SUPPORT_RECOVERY`** | No | Requires distinguishing "ordinary improvement" from "recovery after a genuine prior setback" — current single-value Trajectory does not capture a two-point history; may need a Product decision on whether this distinction is required for G-2's initial scope or deferred | PD-3 (or explicitly deferred) |
| **13.5 `PREPARE_FOR_FORESEEABLE_CHALLENGE`** | No | Same ambiguity as 13.1 (they compete for the same `DEVIATING`/`WORSENING` finding) | PD-3 |
| **13.6 `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`** | **YES — APPROVED, narrowly** | Habit-sourced `FOOD_LOGGING` degradation into the Habit Engine's `WEAKENING` lifecycle (structurally guaranteed prior confirmed-tier establishment; `D1-ER-04` "absence is evidence") | **CLOSED — see Chapter 26.** Approved only for this exact condition, not as a generic missing-data rule. |
| **13.7 `PROTECT_STATED_LONG_TERM_GOALS`** | No | The reason's own wording ("stated... goals") corresponds to `goal`/`goalKcal`, but no approved deviation threshold exists in either direction, and Coach Bible §45 ("Probabilistic Thinking") requires multi-hypothesis reasoning this model cannot yet support | `NO AUTOMATIC V1 RULE`, unless separately approved later |

**Conclusion: exactly one of the seven reasons has an active v1 rule — `REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION`, scoped narrowly to Habit-sourced `FOOD_LOGGING` degradation (Chapter 26).** The remaining six resolve `NO AUTOMATIC V1 RULE` (`NO_VALID_REASON`) unless and until separately approved by Head of Product. This is not a failure of the Foundation — a single, narrow, well-evidenced active rule with universal honest `NO_VALID_REASON` elsewhere is the correct, restraint-consistent closure state.

---

# 14. Semantic Responsibility Matrix

| Concern | Owner | Basis |
|---|---|---|
| Observation content (domain/topic/confidence/trajectory) | Habit/Pattern Engine (via B5) | Unchanged; `CSF-05` |
| User Context assembly | Memory Layer, exclusively | `D3 §11.1`; `CSF-06` |
| Contextual Meaning computation (the interpretation itself) | The calling Stage-3 contributor, via shared pure policy logic | `G2-RA-07`; `CSF-08` |
| Semantic accountability for the resulting judgment | The calling Stage-3 contributor | `CSF-08` — explicitly not transferred to shared logic |
| Product Reason Policy content | Head of Product | `CSF-11` |
| Milestone/restraint threshold | Head of Product | `CSF-12` |
| `DetectedOpportunity` construction | The detecting Stage-3 contributor | `G2-RA-07`, unchanged |
| Stage 4 Evidence Evaluation | Decision Engine (narrow) | `AD-G2-02`, unaffected |
| Stage 5 Eligibility | Decision Engine (existing) | `T006 §15.11`, unaffected |
| Trust/Engagement determination | Existing Stage-5 mechanism (`trustTestSignal`) | `CSF-13`, unaffected |

---

# 15. Conceptual Contracts (Conceptual Level Only — No JavaScript)

## 15.1 Observation

**Contains:** domain, topic, qualifiers, confidence, evidence/provenance, lifecycle, trajectory. **Owner:** derivation source. **Home:** canonical Pipeline Context (existing `initiativeIntelligence`/`derivedIntelligence`). **Persistence:** backed by durable Habit/Pattern storage; Pipeline Context copy is per-Decision-Pass. **Evidence:** producer id/version (already present).

## 15.2 User Context

**Contains:** `GoalObjectiveContext`, `CurrentStateContext`, Derived Intelligence, Relationship Maturity — each a separate, honest, possibly-`UNAVAILABLE` category. **Owner:** Memory Layer, exclusively. **Home:** canonical Pipeline Context. **Persistence:** per-Decision-Pass snapshot of durable state.

## 15.3 Contextual Meaning

**Contains:** Alignment, Trajectory, each possibly `UNKNOWN`; a basis record naming which Observation/Context fields were actually used. **Owner:** the calling Stage-3 contributor (via shared policy logic). **Home:** contributor-local, **not** canonical Pipeline Context (writing it there would give Memory Layer reasoning authority, forbidden by `D3 §11.1`/`CSF-06`). **Persistence:** ephemeral, within one Stage-3 processing step of one Decision Pass — `CSF-09`, no new persistent semantic-memory store. **Evidence:** must be carried forward onto the resulting `DetectedOpportunity`'s own `explanation.*` fields so downstream traceability is not lost (`CSF-09`).

## 15.4 Coaching Opportunity (`DetectedOpportunity`)

**Contains:** the full contract already scoped by `G2S §19`, now including a `validReasonCategory` resolved via the Product Reason Policy, or the honest decision not to construct one (`NO_VALID_REASON`, `CSF-10`). **Owner:** the detecting Stage-3 contributor. **Home:** canonical, cross-Stage (3→4→5/6). **Persistence:** ephemeral per Decision Pass.

## 15.5 Engagement Permission

**Contains:** the existing, unmodified `trustTestSignal`/Stage-5 Eligibility determination. **Owner:** existing Stage-5 mechanism (`eligibilityEvaluator.js`, unchanged). **Home:** canonical, Stage-5-internal. Unaffected by this Package.

---

# 16. CSF-10 — Valid Reason Derivation (Recorded)

**Approved, verbatim in substance:**

```
Observation + available User Context
  → Contextual Meaning
  → Product Reason Policy
  → one D1-IE-01 validReasonCategory
     OR
  → NO_VALID_REASON
```

`validReasonCategory` SHALL NOT be derived from Opportunity Source alone, Topic alone, confidence alone, or `evidenceCount` alone. `NO_VALID_REASON` is legitimate and expected (restated from the prior round's Product direction). Where `NO_VALID_REASON` results: the raw/descriptive recognition may remain internally observable (as an Observation), but an ordinary Stage-5-bound `DetectedOpportunity` SHALL NOT be fabricated, and `validReasonCategory: null` SHALL NOT be intentionally sent to Stage 5 as the normal production path.

---

# 17. CSF-08 — Semantic Ownership (Recorded)

**Approved, verbatim, closed constraint list for any shared policy logic:** pure; stateless; no StateAccess; no independent Pipeline Context authority; no orchestration authority; creates no Opportunity independently; performs no Eligibility decision; performs no Trust decision; performs no prioritization; performs no Expression; not an Engine; not a collaborator; not an Engine Registry participant. Use of shared logic SHALL NOT transfer semantic accountability away from the calling Stage-3 contributor — the detecting contributor remains accountable for the resulting `DetectedOpportunity`, exactly as `recommendationEngine.js` remains accountable for its output despite calling `recommendationCategories.js`.

---

# 18. CSF-13 — Trust / Engagement Separation (Recorded)

**Approved:** Contextual Meaning and a legitimate `validReasonCategory` remain separate from Engagement Permission. FITME may correctly conclude "this matters and there is a legitimate reason to coach" while still resolving "do not engage now." Trust, relationship/timing, interruption sensitivity, Capacity, and other engagement controls SHALL NOT be folded into Meaning.

**For current G-2 Trust behavior (restated, unaltered from the prior round's Product direction):** where no approved affirmative Trust basis exists, `trustTestSignal.glad = null`, and an otherwise well-formed ordinary Opportunity proceeds to the existing, unmodified Stage-5 semantics: `INELIGIBLE / TRUST_TEST_UNCERTAIN`.

---

# 19. CSF-14 — Context Classification (Recorded)

| Category | Classification |
|---|---|
| Goal/Objective Context, Current-State Context, Derived Intelligence/Observation | Foundational Meaning inputs |
| Relationship Maturity, Capacity State, explicit "coach me less" preference, interruption sensitivity, existing rejection/ignore feedback | Primarily Engagement-oriented |
| Location, Life Event acquisition, inbound Coach conversation acquisition, richer Goal/Objectives, body-composition objectives | Deferred/future |

This classification does not permanently prohibit a future Product decision allowing a context source to affect more than one layer (restated, `CSF-14`); no such authority is granted now.

---

# 20. Scenario Validation (Condensed — Full Trace Available in Prior Investigation Record)

| # | Scenario | Meaning Resolvable Today? | Reason | Notes |
|---|---|---|---|---|
| 1 | Training-frequency target vs. late-week drop-off | Trajectory yes, Alignment no (`days` is not a goal, Ch.10) | `NO_VALID_REASON` pending PD-3 and a possible future training-frequency objective (not approved here) | Exposes the confirmed goal-model gap |
| 2 | Protein target consistently met | Yes, once PD-1 exposes the target | Pending PD-3/PD-4 | |
| 3 | Sudden logging stop (Habit-sourced `FOOD_LOGGING`) | Yes — Trajectory alone (`weakening`, Habit Engine) | **`REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION` — APPROVED, Chapter 26** | The Foundation's first closed v1 path |
| 4 | Improving adherence | Yes — Trajectory | `CELEBRATE_MEANINGFUL_PROGRESS`, pending PD-3/PD-4 | |
| 5 | Evening overeating vs. `goalKcal` | Yes — both axes, fully available | `PROTECT_STATED_LONG_TERM_GOALS` or `PREVENT_PREDICTABLE_MISTAKE`, pending PD-3 | Best-supported real scenario |
| 6/7 | Weight trend toward/away from target | No | `NO_VALID_REASON`, honest | Blocked on PD-2 |
| 8 | Meaningful pattern + "coach me less" | Meaning/Reason unaffected | Reason may still resolve | Engagement (Ch.19) independently overrides — validates the separation |
| 9/10 | Future Location / conversation signals | No | — | Confirms extensibility (`CSF-16`), no redesign required |

---

# 21. Current vs. Deferred Data Availability

| Input | Status |
|---|---|
| `goal`, `goalKcal` | Canonically approved (`AD-G2-03`), not yet wired |
| `consumed`/`protein`/`burned` | Canonically approved (`AD-G2-03`), not yet wired |
| Protein target | Bounded exposure confirmed (Ch.10); PD-1 (weight-field choice) open |
| Habit-sourced `FOOD_LOGGING` `WEAKENING` lifecycle | **CANONICALLY APPROVED — active v1 path (Chapter 26)**; B5-eligible per Chapter 27; engineering wiring (Initiative Engine's detector filter extension) remains, G2S revision. **Reachability of this lifecycle state required Chapter 29's Habit Lifecycle Establishment Correction — now implemented and production-backed verified (Chapter 29.7); see Chapter 29.** |
| Pattern-derived `WEAKENING` lifecycle | **DEFERRED / NON-BLOCKING** — explicitly excluded from v1 (Chapter 27); may be enabled by a future additive decision if provenance becomes sufficient |
| Training-frequency objective | Confirmed absent from the product (Ch.10); no decision made by this Package |
| Weight/body-composition objective | DEFERRED / NON-BLOCKING (PD-2) |
| Protein Objective exposure | DEFERRED / NON-BLOCKING (PD-1) — not required for Foundation closure |
| Relationship Maturity | Structurally present, source remains `UNKNOWN` (T005 E-2, unaffected) |
| Life Event Context, Capacity State, Location | Canonically deferred (`AD-G2-01` `G2-RA-11`) |
| `recommendationFeedbackHistory` | Available now |
| Product Reason Policy content (6 of 7 reasons) | DEFERRED / NON-BLOCKING — `NO AUTOMATIC V1 RULE` unless separately approved |
| Restraint threshold | DEFERRED / NON-BLOCKING (PD-4) |
| Shared module exact placement | SPEC/Engineering detail (AD-Detail-1), not blocking |

---

# 22. Backward Compatibility Analysis

| Document | Finding |
|---|---|
| D1 | No existing Unit is altered. Units 05/06 remain exactly as written; this Package adds an interpretive step *between* them conceptually, without editing D1's own text (a future, separate synchronization — Ch.23 — would add cross-references only). |
| D2 | Stage 3/4/5 boundaries, definitions, and Stage Overview text (including the `AD-G2-02`-added Stage-4 orchestration line) are unaffected — no Stage is added, merged, or renumbered. |
| D3 | `§11.1` (Memory Layer exclusivity), the six-collaborator model, and the Composite Engine's single-orchestration-authority invariant are all preserved exactly (`CSF-02`, `CSF-06`, `CSF-08`). No seventh collaborator, no new Engine Registry entry. |
| T004 | `recommendationEngine.js`'s existing `generate()`/`validateRequest()` contract is untouched by this Package. |
| T005 | `initiativeEngine.js`'s existing `generate()`/`validateRequest()`/`detectOpportunities()` contracts are untouched; only a *new* consumption of already-computed `lifecycle`/`status` data is contemplated, not a contract change. `CD-T005-01`'s own enablement of `INITIATIVE_ENGINE`/`INITIATIVE_SUPPORT_V1` is unaltered — this Package changes that policy's eligibility *logic* (Chapter 27), not the enablement decision itself. |
| T006 | `OpportunityEligibilityInput` (`CD-T006-01`), Stage 5/7/8/9 contracts, and the Decision Engine's Forbidden Responsibilities are all unaffected. |
| B5 | `derivedIntelligenceConsumer.js`'s `INITIATIVE_SUPPORT_V1.allowedLifecycle` already includes `WEAKENING` (unaltered) — this Package's Lifecycle-Aware Eligibility Architecture Decision (Chapter 27) adds branching logic to `evaluateEligibility()`'s *application* of that policy for `WEAKENING` signals specifically; `COACH_PROMPT_V1`/`RECOMMENDATION_SUPPORT_V1`/`TEST_FULL_DIAGNOSTIC_V1` and ACTIVE/CONFIRMED-lifecycle eligibility are entirely unaffected. Requires synchronization — see Chapter 28. |
| `AD-G2-01` | `G2-RA-04` (three contributors), `G2-RA-07` (contributor semantic ownership — directly reinforced, not altered), `G2-RA-09` (Decision Window non-blocking) all preserved. |
| `AD-G2-02` | Stage-4 narrow orchestration authority unaffected; Stage 4 still performs only evidence-sufficiency classification, now on a `DetectedOpportunity` whose `validReasonCategory` is resolved earlier in Stage 3, not by Stage 4. |
| `AD-G2-03` | `GoalObjectiveContext ≠ CurrentStateContext ≠ Derived Intelligence` restated unaltered; its Item 9 exclusion list (training-frequency, weight) is *not* violated — this Package explicitly does not introduce either. |
| `G2S` (Draft) | Sections 9-16, 21, 23, 25-38 remain structurally valid; Sections 17-20, 22, 24, 41 depend on this Package and require revision once it closes (per the prior round's finding) — not performed now. |

**No contradiction found anywhere in this sweep.**

---

# 23. Required Future Synchronization — See Chapter 28

Superseded by the precise Canonical Synchronization Plan recorded at Chapter 28, prepared for review, **not executed**.

---

# 24. G-2 Consequence

This Package is now closed (Chapter 25). Per `CSF-15`: **G-2 implementation still does not begin** — closure of this Package authorizes G-2 SPEC revision and Canonical Synchronization (Chapter 28), not implementation. `G2_SPEC_v1.0.md` is not modified by this authoring task.

**G-2 now has an approved first real ordinary semantic path**, to be reflected in the SPEC's next revision:

```
Habit-sourced FOOD_LOGGING Observation
  → WEAKENING lifecycle (Habit Engine; see Chapter 29 — the Habit Lifecycle Establishment
      Correction is now implemented and production-backed verified, Chapter 29.7; this step is
      confirmed to occur on real data via provenance.currentEpisodeEstablished===true; the original
      "structurally guaranteed prior confirmed-tier establishment" framing here is superseded, not
      contradicted, by Chapter 27.1/29.1's correction)
  → B5 lifecycle-aware eligibility (Chapter 27)
  → Initiative Engine Stage-3 construction (ContextualMeaning: alignment=NEUTRAL/UNKNOWN, trajectory=WORSENING)
  → validReasonCategory: REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION (Chapter 26)
  → well-formed DetectedOpportunity
  → Stage 4 (Evidence Evaluation)
  → Stage 5 (Eligibility) — trustTestSignal.glad = null → TRUST_TEST_UNCERTAIN
  → Silence
```

This is a genuine, live, non-fabricated Decision Pass outcome — not a fixture — fully consistent with `G2-RA-19`/`G2-RA-17`. `G2_SPEC_v1.0.md` still requires **substantial revision** before READY (§17-20, 22, 24, 41, per Ch.22) to reflect this path precisely, plus the Stage-4 tier-classification addition for `WEAKENING`-sourced signals and the Habit-only (not Pattern) scope boundary. That revision, Canonical Review, and Engineering Review all remain outstanding before implementation may begin. No implementation begins now.

---

# 25. Status and Closure

- **Decided and approved (recorded, not reopened):** CSF-01 through CSF-16, in full, as supplied at v1.0.
- **Decided and approved at v1.1:** the First Active V1 Reason Policy (Chapter 26); the Lifecycle-Aware B5 Eligibility Architecture Decision (Chapter 27); AD-Detail-2 (Chapter 12).
- **Explicitly reclassified DEFERRED / NON-BLOCKING (not open blockers):** PD-1, PD-2, PD-4 (Chapter 11); AD-Detail-1, AD-Detail-3 (Chapter 12); six of the seven D1-IE-01 reasons (Chapter 13).
- **Repository-verified during authoring:** the protein-target bounded-exposure finding (Ch.10); the training-frequency-objective absence finding (Ch.10); the Habit/Pattern `WEAKENING`-semantics asymmetry (Ch.27); the reason-by-reason analysis (Ch.13); the backward-compatibility sweep (Ch.22) — no contradiction found.
- **Owner of deferred items, when addressed:** Head of Product (PD-1, PD-2, PD-4); AI Architect (AD-Detail-1, AD-Detail-3, both non-blocking SPEC/engineering detail).
- **Blocks G-2 SPEC revision:** No longer — this Package's closure authorizes the SPEC revision described in Chapter 24. **Blocks G-2 implementation:** Yes, until that revision, Canonical Review, and Engineering Review are complete (`CSF-15`, unaltered).
- **This Package's own status:** **CANONICAL — CLOSED.**

---

---

# 26. First Active V1 Reason Policy — APPROVED (Product Decision)

**Status: APPROVED.**

## 26.1 The Decision

`validReasonCategory = REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION` is approved, exclusively, for the following condition:

**A previously established and reliable Habit-sourced `FOOD_LOGGING` behavior has degraded sufficiently to enter the Habit Engine's canonical `WEAKENING` lifecycle state.**

Because FITME previously possessed a reliable behavioral-information pattern, and that information quality is now materially degrading, requesting renewed information may significantly improve FITME's ability to understand and coach the user.

## 26.2 What This Is Not

Explicitly, this decision is **not**: a generic missing-data rule; a single missed-log rule; a Pattern-Engine `WEAKENING` rule (Pattern-derived `WEAKENING` is excluded — Chapter 27); an inference about *why* the user stopped logging; a claim that the user's nutrition behavior itself became worse; a rule applicable to any other `FOOD_LOGGING` observation that has not entered `WEAKENING`. Other `FOOD_LOGGING` observations may legitimately produce `NO_VALID_REASON`.

## 26.3 Product Calibration

For v1, the Habit Engine's existing transition into `WEAKENING` **is** the required degradation bar — no additional numeric coaching threshold (no `missedPeriods ≥ 2`, no new elapsed-day threshold, no new confidence threshold, no new frequency threshold) is introduced. This relies on the structural guarantee established in Chapter 27.1: to reach Habit `WEAKENING`, a record must already satisfy the Habit Engine's confirmed-tier occurrence/confidence requirements (`occ ≥ OCC_CONFIRMED`, `conf ≥ CONF_CONFIRMED`) and then become sufficiently late per the Habit Engine's own existing lifecycle model (`late > 1.5`) — giving the rule its required "previously established → now degrading" meaning without inventing a new threshold.

## 26.4 Contextual Meaning

- **Alignment:** `NEUTRAL` or `UNKNOWN` — no Goal comparison is required or performed.
- **Trajectory:** `WORSENING`.
- **Basis/provenance** must identify: the `FOOD_LOGGING` Habit Observation; the prior established/confirmed-tier semantics structurally guaranteed by the Habit lifecycle; the current `WEAKENING` lifecycle; current (honestly decayed) confidence; relevant occurrence/evidence provenance; the temporal degradation basis already available on the Habit record (`firstObserved`, `lastObserved`, `expectedIntervalDays`).
- **Prohibited inference:** why logging declined; poor nutrition behavior; lack of motivation; dietary failure; Goal deviation. None of these may be asserted or implied.

## 26.5 Trust

No affirmative Trust basis is introduced by this decision. `trustTestSignal.glad = null`, with an honest basis stating no approved affirmative Trust source exists. The expected Stage-5 result is `INELIGIBLE`/`TRUST_TEST_UNCERTAIN`, resolving to Silence. This is correct behavior and does not invalidate the Opportunity (`CSF-13`, unaltered).

## 26.6 All Other Reasons

`PREVENT_PREDICTABLE_MISTAKE`, `HELP_BEFORE_DIFFICULT_DECISION`, `CELEBRATE_MEANINGFUL_PROGRESS`, `SUPPORT_RECOVERY`, `PREPARE_FOR_FORESEEABLE_CHALLENGE`, and `PROTECT_STATED_LONG_TERM_GOALS` remain `NO AUTOMATIC V1 RULE` — `NO_VALID_REASON` — unless and until separately approved by Head of Product (Chapter 13, updated).

## Approval Evidence

Head of Product, Canonical Decision — Coach Semantic Foundation closure round.

## Documents Affected

None beyond this Package directly; `G2_SPEC_v1.0.md` requires revision to reflect this rule — see Chapter 24, Chapter 28.

---

# 27. Lifecycle-Aware B5 Eligibility — APPROVED (Architecture Decision)

**Status: APPROVED.**

## 27.1 Habit vs. Pattern `WEAKENING` — Repository-Verified Asymmetry — **CORRECTED, see Chapter 29.5**

**Habit Engine** (`habitEngine.js:222-230`, `statusOf(conf, occ, daysSince, interval)`): the `weakening` branch (`late > 1.5`) is reached only *after* the function has already confirmed `occ ≥ OCC_CONFIRMED(5)` and `conf ≥ CONF_CONFIRMED(0.55)` earlier in the same function. **Correction (Chapter 29, v1.2):** this branch-*ordering* fact is accurate but was found, by empirical verification during G-2 Engineering Readiness Review, to be **insufficient on its own** to guarantee `WEAKENING` reachability for `period:'weekly'` Habit signals — `WINDOW_DAYS=42`/`OCC_CONFIRMED=5`/`INTERVAL_WEEKLY=9` interact such that occurrence falls below the confirmed floor before lateness can cross its threshold, for 8 of 12 concrete Habit signal identities (see Chapter 29.1). The original sentence below is preserved for audit-trail purposes; it is superseded by Chapter 29's explicit, persisted `currentEpisodeEstablished` contract, which — now implemented and production-backed verified, Chapter 29.7 — makes the guarantee literally true by construction rather than an inference from branch order. Original text: "Habit-sourced `WEAKENING` status is therefore structurally impossible without prior confirmed-tier establishment — a guarantee, not an inference" — **this claim held only for `period:'daily'` Habit signals in practice; see Chapter 29.**

**Pattern Engine** (`patternEngine.js:98-106`, `statusOf(confidence, evidenceCount, missedPeriods)`): `missedPeriods > 0 → 'weakening'` is checked *before* any confidence/evidence-count threshold. **A Pattern-Engine signal can reach `weakening` after a single missed period regardless of whether it ever cleared the confirmed tier.** No equivalent guarantee exists.

## 27.2 The Decision

B5 Initiative-support eligibility (`INITIATIVE_SUPPORT_V1`) becomes lifecycle-aware:

- **`ACTIVE`/`CONFIRMED` signals** — continue using the existing current-confidence/evidence eligibility policy, unchanged.
- **`WEAKENING` signals, Habit-derived only** — eligible for semantic consideration on the basis of the structural guarantee in §27.1 (previously established + now degraded), **not** on the current (decayed) confidence remaining above the same floor used for `ACTIVE`/`CONFIRMED` admission. Current decayed confidence remains preserved honestly on the signal — never inflated, replaced, or presented as historical confidence.
- **`WEAKENING` signals, Pattern-derived** — **excluded from v1.** Pattern Engine's `WEAKENING` branch does not prove prior confirmed-tier establishment, and its decay path (`evidenceCount` reset to 0 on `carryAbsent`) does not preserve complete prior evidence-state provenance. Mathematically reversing confidence decay to reconstruct historical authority is explicitly **not** performed for v1. Pattern-derived `WEAKENING` may be enabled by a future, additive decision if explicit provenance becomes sufficient.

This is not a numeric patch: no new threshold value is invented for the Habit-derived case — the structural guarantee in §27.1 substitutes for a confidence-floor check entirely, using logic the Habit Engine's own already-shipped `statusOf()` already performs.

## 27.3 B5 Authority Boundary — Preserved

Lifecycle-aware eligibility remains a B5 consumption/eligibility policy. It SHALL NOT: create coaching meaning; assign `validReasonCategory`; perform Stage-3 Opportunity Detection; perform Trust; perform Stage-5 Eligibility; change Habit/Pattern derivation authority. Its sole responsibility is deciding whether an already-derived descriptive signal is eligible to be exposed to the approved Initiative-consumption path. The Stage-3 Initiative Engine remains responsible for Observation + Context → Contextual Meaning → Product Reason Policy → `DetectedOpportunity` (`CSF-08`, unaltered).

## 27.4 Explicit Non-Scope

This decision does not: lower `minimumConfidence` globally; introduce a new universal threshold; enable Pattern-derived `WEAKENING`; reconstruct historical confidence for any signal; change `COACH_PROMPT_V1`/`RECOMMENDATION_SUPPORT_V1`/`TEST_FULL_DIAGNOSTIC_V1` in any way; change `ACTIVE`/`CONFIRMED` eligibility for any policy.

## Approval Evidence

AI Architect, Canonical Decision — Coach Semantic Foundation closure round.

## Documents Affected

`docs/tasks/B5/B5_SPEC_v1.0.md` — required synchronization, Chapter 28.

---

# 28. Canonical Synchronization Plan — Prepared, Not Executed

## 28.1 Documents Requiring Synchronization

| Document | Required Change | Why |
|---|---|---|
| `docs/tasks/B5/B5_SPEC_v1.0.md` | Additive documentation of the lifecycle-aware eligibility branching for `INITIATIVE_SUPPORT_V1` (Chapter 27) | B5's own eligibility-policy documentation would otherwise go stale relative to the now-approved branching behavior |
| `docs/specs/TASK_005_SPEC_v1.0.md` | **Inspection required** to confirm whether its own text describes `INITIATIVE_SUPPORT_V1`'s eligibility logic in enough detail to go stale; likely no change, or a minor additive cross-reference, but not yet confirmed | `CD-T005-01` enabled the consumer/policy pair; its exact text has not been re-read against Chapter 27's specific claim in this authoring session |
| `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (G2P) | Additive cross-reference noting this Package's existence and relationship | Follows the established additive-cross-reference discipline; no contradiction, but G2P should point readers here |
| `docs/specs/G2_SPEC_v1.0.md` | Substantial revision, §17-20, 22, 24, 41 | Chapter 24 |
| `docs/roadmap/Changelog.md` | New entry | Per repository precedent, at actual closure |

## 28.2 Documents Inspected, No Synchronization Required

| Document | Why |
|---|---|
| D1 | Units 05/06 remain accurate; this Package adds an interpretive step conceptually between them without altering D1's own text |
| D2 | Stage 3/4/5 boundaries and definitions unaffected |
| D3 | `§11.1`, six-collaborator model, single-orchestration-authority invariant all preserved |
| TASK-004 | `recommendationEngine.js` contract untouched |
| TASK-006 | `OpportunityEligibilityInput`, Stage 5/7/8/9 contracts unaffected |
| `AD-G2-01`/`AD-G2-02`/`AD-G2-03` | Preserved exactly (Chapter 22) |
| `docs/architecture/FITME_ARCHITECTURE_v1.md` | Describes current, implemented state; nothing here is implemented yet — to be updated only at future implementation closure |
| `docs/roadmap/Roadmap.md` | No implementing task yet exists; unchanged per established precedent |

## 28.3 Explicit Instruction

**None of the above has been performed.** This chapter records the plan for review; execution requires separate authorization.

---

---

# 29. Habit Lifecycle Establishment Correction — APPROVED AND IMPLEMENTED (Product + Architecture Decision)

**Status: APPROVED. IMPLEMENTED AND VERIFIED — see Chapter 29.7.**

## 29.1 Origin

During G-2 Engineering Readiness Review, empirical verification — direct execution of the real, unmodified `js/engines/habitEngine.js` against realistic simulated event histories, not mere static reasoning — established that Chapter 27.1's "structural guarantee" claim, while accurately describing `statusOf()`'s branch *ordering*, was **insufficient to guarantee `WEAKENING` reachability** for `period:'weekly'` Habit detectors (`log-consistency`, `workout:weekday:0..6` ×7, `weigh-in`, `measurement` — 8 of 12 concrete Habit signal identities, including the exact `FOOD_LOGGING`/`log-consistency` signal Chapter 26 depends on). `WINDOW_DAYS=42` (fixing exactly 6 `weekIdx` buckets), `OCC_CONFIRMED=5`, and `INTERVAL_WEEKLY=9` interact such that a weekly-period habit's occurrence count falls below the confirmed-tier floor before its lateness can ever cross the `weakening` threshold — a mathematically provable, not merely probabilistic, foreclosure. Separately, `docs/architecture/FITME_ARCHITECTURE_v1.md §15` item 4 was found to already require, independently of G-2, that "the distinct `weakening`/`inactive` staging" be preserved for the Habit Engine generally — an invariant the affected eight signal identities already violated, undetected, before G-2 depended on any of them.

## 29.2 The Decision (Product)

**PD-HL-01 — Historical Establishment vs. Current-Episode Establishment vs. Current Evidence.** FITME SHALL preserve, separately and without conflation: (A) **Historical Fact** — whether a behavior has ever, at any point, been established as a real Habit; (B) **Current-Episode Establishment Authority** — whether the current, uninterrupted lifecycle episode is itself entitled to rely on prior establishment; (C) **Current Evidence** — current confidence, occurrence/evidence count, `lastObserved`, consistency, expected interval, and current lifecycle status.

**PD-HL-02 — `WEAKENING` meaning.** `WEAKENING` means a Habit established *within its current lifecycle episode* whose current evidence now demonstrates meaningful deterioration, but which has not yet crossed the existing `INACTIVE` boundary. `WEAKENING` does not require the Habit to continue satisfying all original confirmation thresholds while deteriorating. A never-established current episode SHALL NOT become `WEAKENING`.

**PD-HL-03 — `INACTIVE` terminates current-episode authority.** On reaching `INACTIVE`, the historical fact that a behavior was once established is preserved; current-episode establishment authority terminates in the same transition. Future matching activity SHALL NOT automatically inherit confirmed/weakening authority from the ended episode. No numeric expiry duration is introduced — the existing `INACTIVE` boundary is itself the semantic episode boundary.

**PD-HL-04 — Re-establishment.** After `INACTIVE`, renewed behavior progresses again through `OBSERVED`/`CANDIDATE` → `CONFIRMED`/`ACTIVE` before a later deterioration may again produce `WEAKENING`. Historical establishment from prior episodes remains provenance/history only; it does not substitute for current-episode establishment.

**PD-HL-05 — Provenance.** FITME SHALL preserve deterministic provenance sufficient to establish: whether the behavior has ever historically been established; whether the current episode has earned establishment authority; when the current episode first earned it. This information is not, by itself, Coach-facing Product meaning, and SHALL NOT fabricate historical confidence or occurrence. `everEstablishedHistorically`/`firstEstablishedAt` SHALL NOT independently become Contextual Meaning, Reason, Trust evidence, Initiative eligibility, or Coach wording — any future such use requires a separate Product decision.

**PD-HL-06 — B5 contract.** Current-episode establishment provenance SHALL be exposed explicitly through the B5 `DerivedSignal.provenance` contract. Habit Engine remains the sole authority that determines establishment; B5 carries/normalizes the provenance only and SHALL NOT infer establishment itself.

## 29.3 The Decision (Architecture)

**AD-HL-01 — Habit record fields.** The Habit record SHALL add exactly four fields: `everEstablishedHistorically: boolean`, `firstEstablishedAt: date|null`, `currentEpisodeEstablished: boolean`, `currentEpisodeEstablishedAt: date|null`. No fifth field (e.g. a most-recent-re-confirmation timestamp) is introduced. No episode identifier is introduced — the `INACTIVE` transition itself is the sufficient, minimal episode-boundary mechanic; no separate numbering scheme is required because the architecture never needs to compare one past episode to another, only whether the *current* one has earned authority.

**AD-HL-02 — Semantics.** `everEstablishedHistorically`/`firstEstablishedAt` are permanent, sticky, set-once/OR-forward, and grant **no** current lifecycle authority. `currentEpisodeEstablished`/`currentEpisodeEstablishedAt` govern current authority: set true (with a fresh timestamp) the first time, within the current episode, `occ≥OCC_CONFIRMED(5) && conf≥CONF_CONFIRMED(0.55)` holds; carried forward unchanged through `CONFIRMED`/`ACTIVE`/`WEAKENING`; reset to `false`/`null` in the exact same update that produces `status:'inactive'`.

**AD-HL-03 — `statusOf()` becomes establishment-aware.** `statusOf()` gains a `currentEpisodeEstablished` parameter. Where `false`, its behavior is byte-identical to the existing, unmodified ladder (`OBSERVED→CANDIDATE→CONFIRMED/ACTIVE`, with `WEAKENING` reachable only at the rare instant-of-first-crossing case already present in today's code). Where `true`, its floor for any degradation short of the existing `INACTIVE` threshold (`conf<CONF_INACTIVE` or `late>4`, unchanged) becomes `WEAKENING` rather than `CANDIDATE`. **No existing numeric constant (`WINDOW_DAYS`, `OCC_CANDIDATE`, `OCC_CONFIRMED`, `CONF_CANDIDATE`, `CONF_CONFIRMED`, `CONF_ACTIVE`, `CONF_INACTIVE`, `INTERVAL_DAILY`, `INTERVAL_WEEKLY`, `INERTIA`) changes value.**

**AD-HL-04 — Daily-period habits unaffected.** Repository-verified (direct simulation): for every `period:'daily'` Habit signal, occurrence never actually falls below `OCC_CONFIRMED` before lateness crosses its threshold, so the establishment-aware and pre-existing code paths are behaviorally identical for these types. No regression.

**AD-HL-05 — Migration.** Existing Habit records lacking the new fields SHALL be treated as `currentEpisodeEstablished:false`/`everEstablishedHistorically:false` — never assumed established. Lazy, forward-only convergence from real current evidence on each record's next natural evaluation; no backfill from `firstObserved`, `consistency`, prior stored `status`, or any other proxy field; no migration script.

**AD-HL-06 — B5 provenance extension.** `DerivedSignal.provenance` gains exactly two fields: `currentEpisodeEstablished`, `currentEpisodeEstablishedAt` — pass-through only, sourced from the Habit record. `everEstablishedHistorically`/`firstEstablishedAt` are **not** exposed through B5 at this time (Coach-facing/Product-decision boundary, §29.2 PD-HL-05).

## 29.4 Explicit Non-Scope

This decision does not: introduce a fifth Habit-record field, an episode identifier, or a new lifecycle state; change any existing numeric constant; redesign Pattern Engine (which does not share this defect — its `missedPeriods`-first branch order already reaches `weakening` before any confidence floor, an intentional and unaffected asymmetry, Chapter 27.1); introduce a new Engine, collaborator, or Engine Registry entry; move lifecycle authority outside Habit Engine; make `everEstablishedHistorically`/`firstEstablishedAt` Coach-facing or eligible as Contextual Meaning, Reason, Trust, or Initiative-eligibility evidence in any way; or authorize G-2 implementation — this decision's own implementation and verification are now complete (§29.7), but G-2 implementation itself remains paused pending its own, separate Engineering Readiness / authorization gate.

## 29.5 Correction to Chapter 27.1

See the corrective annotation now recorded directly in Chapter 27.1, above. Summary: the guarantee is not, and was never intended to be, an inference from `statusOf()`'s branch *order* alone — branch order was a necessary but empirically insufficient condition for weekly-period habits (§29.1). The guarantee is now the **explicit, persisted, implemented-and-verified fact** `currentEpisodeEstablished===true` (carried to B5/G-2 as `provenance.currentEpisodeEstablished`), scoped precisely to *the current, uninterrupted lifecycle episode* — not to "ever, historically" (which `everEstablishedHistorically` alone is not sufficient basis for, per AD-HL-02/PD-HL-03). See Chapter 29.7 for implementation/verification evidence. Chapter 27's other content (Pattern-derived `WEAKENING` exclusion, no global `minimumConfidence` lowering) is unaffected and not reopened.

## 29.6 Consequences

`docs/specs/G2_SPEC_v1.0.md` requires a further, additive correction, performed alongside this v1.2 revision, so that its `REPEATED_BEHAVIOUR`/`priorEstablishmentBasis` reasoning cites `provenance.currentEpisodeEstablished` rather than the superseded branch-order inference. G-2 implementation remains explicitly blocked, in addition to its prior Canonical-Review clearance, until this Chapter's own architecture (AD-HL-01 through AD-HL-06) is implemented, tested, and its `currentEpisodeEstablished===true` fact is verified reachable for the `log-consistency` signal in real production data.

**Closure (v1.3):** This precondition is now satisfied — see Chapter 29.7. `docs/specs/G2_SPEC_v1.0.md`'s blocking-prerequisite wording is updated accordingly (additive correction, alongside this v1.3 revision) to record the Chapter 29 prerequisite as CLOSED/IMPLEMENTED/VERIFIED. **G-2 itself remains NOT IMPLEMENTED** and requires its own separate Engineering Readiness / authorization gate before implementation begins — this closure does not, by itself, authorize G-2 implementation.

## 29.7 Implementation & Verification Closure — IMPLEMENTED AND VERIFIED

**Status: IMPLEMENTED AND VERIFIED.** Recorded at Head of Product + AI Architect closure review (Habit Lifecycle Establishment Correction Implementation Closure Review — PASS).

**What was implemented**, exactly as decided in §29.2/§29.3, no more and no less:
- `js/engines/habitEngine.js` — `statusOf()` gained the `currentEpisodeEstablished` parameter (AD-HL-03); new pure `deriveEstablishment()` helper computes the four fields; `upsertFromSignal()`/`decayAbsent()` compute and persist them. No numeric constant changed (`WINDOW_DAYS`, `OCC_CANDIDATE`, `OCC_CONFIRMED`, `CONF_CANDIDATE`, `CONF_CONFIRMED`, `CONF_ACTIVE`, `CONF_INACTIVE`, `INTERVAL_DAILY`, `INTERVAL_WEEKLY`, `INERTIA` all repository-verified unchanged). No fifth field, no episode identifier (AD-HL-01, confirmed). Pattern Engine (`js/engines/patternEngine.js`) repository-verified to contain zero references to any of the four new fields — unaffected, as decided (§29.4).
- `js/derivedIntelligenceConsumer.js` — `normalizeHabitRecord()`'s `provenance` extended with exactly `currentEpisodeEstablished`/`currentEpisodeEstablishedAt`, pass-through/normalization only (AD-HL-06). `normalizePatternRecord()` untouched. `everEstablishedHistorically`/`firstEstablishedAt` confirmed absent from the Coach-facing signal by direct serialization inspection (PD-HL-05).

**What was verified**, using the real, unmodified-elsewhere `runHabitEngine()` driven across simulated calendar days (virtual-clock technique on `DateUtils.getTodayKey`), never a hand-constructed `status:'weakening'` fixture:
- `FOOD_LOGGING`/`log-consistency` establishes (`currentEpisodeEstablished===true`) from real logging history, naturally deteriorates into `WEAKENING` with honest (non-fabricated, non-frozen) current confidence/occurrence, and continues to `INACTIVE`, clearing `currentEpisodeEstablished`/`currentEpisodeEstablishedAt` in the same transition while `everEstablishedHistorically`/`firstEstablishedAt` survive unchanged (PD-HL-03, AD-HL-02).
- A single occurrence immediately after `INACTIVE` does not inherit authority and does not jump to `WEAKENING`; re-establishment after `INACTIVE` requires fresh evidence, earns a **new** `currentEpisodeEstablishedAt` distinct from the first episode's, and the re-established episode can independently weaken again (PD-HL-04).
- `WEAKENING` recovers to `CONFIRMED`/`ACTIVE` **within the same episode** (unchanged `currentEpisodeEstablishedAt`) when current evidence improves, confirmed on an arc that never reaches `INACTIVE`.
- The correction generalizes: `workout:weekday:N`, `weight:weigh-in`, and `measurement:measure` (not only `log-consistency`) were each independently driven through establish→real-degradation→`WEAKENING` (AD-HL-01 through AD-HL-04 are generic, not `FOOD_LOGGING`-specific).
- `nutrition:meal:evening` (daily-period) preserves its pre-existing `WEAKENING`-reachable behavior unchanged (AD-HL-04, repository-verified, not merely argued).
- Migration: a legacy record missing all four fields but currently qualifying earns `currentEpisodeEstablished` from its own fresh current evidence, timestamped to the evaluation day, never backdated; a currently-degraded legacy record is not retroactively granted establishment (AD-HL-05).
- B5: an established signal's provenance carries the record's own timestamp faithfully; an unestablished/legacy signal normalizes to honest `false`/`null`; `everEstablishedHistorically`/`firstEstablishedAt` never appear anywhere on the Coach-facing signal (direct serialization search); Pattern-derived signals never gain the two new keys at all (PD-HL-06, AD-HL-06).
- Determinism: replaying an identical event history twice produces byte-identical establishment fields and status sequences at every simulated day.

**Test evidence:** `tests/habitEngineLifecycleEstablishment.test.js` (new, 14 tests) + 6 new tests appended to `tests/derivedIntelligenceConsumer.test.js` (76→82) — targeted suite 121/121 passing. Full repository regression: **1816/1816 passing, 0 failing** (`node --test "tests/**/*.test.js"`).

**G-2 relationship:** the Chapter 29 prerequisite that paused G-2 (§29.1, §29.6) is closed. G-2's own approved semantic contract (Habit-derived `WEAKENING` → `provenance.currentEpisodeEstablished===true` → `REPEATED_BEHAVIOUR`) is unaltered and is now backed by an implemented, verified fact rather than a branch-order inference. **G-2 implementation itself remains NOT IMPLEMENTED** and requires its own Engineering Readiness / authorization gate — this closure does not grant that gate.

## Approval Evidence

Head of Product + AI Architect, Canonical Review — Habit Lifecycle Root Cause Investigation and Final Architecture Decision round (approval of PD-HL-01…06/AD-HL-01…06); Head of Product + AI Architect, Implementation Closure Review — PASS (§29.7).

## Documents Affected

`docs/architecture/FITME_ARCHITECTURE_v1.md` §9/§15 (corrective annotation, performed alongside this revision; implementation-status wording updated at closure); `docs/tasks/B5/B5_SPEC_v1.0.md` §15 (documentation of the provenance extension, updated at closure from not-yet-implemented to implemented); `docs/specs/G2_SPEC_v1.0.md` (additive correction, updated at closure to record the Chapter 29 prerequisite as CLOSED — G-2 itself remains NOT IMPLEMENTED); `docs/roadmap/Changelog.md` (new entry, per repository precedent, recording implementation closure).

---

**This Package is CANONICAL — CLOSED. CSF-01 through CSF-16 are approved. The First Active V1 Reason Policy (Chapter 26) and the Lifecycle-Aware B5 Eligibility Architecture Decision (Chapter 27) are approved and closed. The Habit Lifecycle Establishment Correction (Chapter 29) is approved as Product + Architecture direction, correcting Chapter 27.1's insufficient reachability basis, and is now IMPLEMENTED AND VERIFIED (Chapter 29.7). PD-1, PD-2, PD-4, AD-Detail-1, and AD-Detail-3 are explicitly deferred/non-blocking, not silently invented or ignored. `docs/specs/G2_SPEC_v1.0.md` receives an additive correction recording the Chapter 29 prerequisite as closed, but `G2_SPEC_v1.0.md`/G-2 itself remains NOT IMPLEMENTED and requires its own separate Engineering Readiness / authorization gate before implementation begins. The Canonical Synchronization Plan (Chapter 28) is recorded but not executed for the v1.1 items; Chapter 29's own synchronization (Documents Affected, above) is complete as of this v1.3 revision.**
