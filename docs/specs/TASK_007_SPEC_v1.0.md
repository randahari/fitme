# TASK_007_SPEC_v1.0

## UX System — Canonical Presentation-Behavior Contracts

**Status:** DRAFT — Canonical Review pending. Not yet approved. Not READY. Implementation is prohibited until this document completes Canonical Review and Engineering Readiness Review and receives an explicit READY verdict from the Head of Product and AI Architect, per `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §4 and `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`.

**Authoring structure:** `docs/specs/TASK_007_SPEC_SKELETON.md` (Approved as the fixed authoring structure). This document populates that structure; it does not alter it.

**Repository baseline verified against:** working tree at `main`, re-verified during this authoring pass — full automated suite `node --test tests/*.test.js`: **1374 passed / 0 failed** (unchanged from the SL-001 baseline); `docs/governance/FITME_Coach_Bible.md` confirmed v1.1, "Status: Canonical — Complete," Chapters 1–22; `js/coachDecisionSystem/safetyLayer.js` confirmed to expose the five dispositions (`UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`); `js/feedback/feedbackDomain.js` confirmed `FEEDBACK_TYPES = ['Accepted', 'Completed', 'Dismissed', 'Rejected', 'Ignored', 'Expired', 'UserCorrected', 'UserConfirmed']`.

**Closure Update (2026-08-06):** the paragraph above describes this document's status as authored, at the Draft stage, and is preserved unchanged as the historical record of that stage. Since then, the approved Implementation Plan's ten Work Packages (`docs/specs/TASK_007_IMPLEMENTATION_PLAN.md`) were implemented in sequence, WP1 through WP9 each individually implemented, tested, self-reviewed, and submitted for review, and each received explicit Product Review: APPROVED and Architecture Review: APPROVED, communicated directly by the Head of Product and AI Architect before its own commit — the direct, non-self-certified authorization §29.4 and §31.3 require, granted incrementally per Work Package as implementation actually proceeded rather than recorded as one separate, upfront READY event in this document's own text. WP10 (this closure) is the tenth and final Work Package. This document is now **DONE / CLOSED** — see §31.4 Closure Record for the complete record, including two findings this closure surfaces for explicit Product/Architecture disposition (§31.4, "Remaining non-blocking follow-ups").

---

# 1. Document Control and Status

| Field | Value |
|---|---|
| Work Item | TASK-007 — UX System |
| Document type | Task Specification (rank 6 of 8, Source-of-Truth hierarchy — `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` §3 / RCD-07) |
| Status | ~~Draft — Canonical Review pending~~ **DONE / CLOSED** (2026-08-06 — see §31.4 Closure Record) |
| Version | 1.0 |
| Owners | Head of Product + AI Architect (Product/Architecture decisions, Canonical Review, Product Approval, Architecture Approval); Claude Code / Lead Engineer (repository evidence, this document's authoring, implementation, tests, Engineering Review proposal only) |
| Lifecycle state | Draft → Canonical Review → Engineering Review → READY → In Implementation → Implemented → DONE / CLOSED (current: **DONE / CLOSED**) |
| Canonical source precedence | AI Constitution → Product Bible → Coach Bible → Architecture → Engineering Workflow → Task Specifications (this document) → Roadmap → Changelog (RCD-07, confirmed unchanged) |
| Authoring baseline | `docs/specs/TASK_007_SPEC_SKELETON.md` (Approved as the fixed authoring structure) |

## 1.1 Revision History

| Version | Date | Author role | Summary |
|---|---|---|---|
| 1.0 | (authoring date) | Lead Engineer, under approved Skeleton | Initial full expansion of the approved Skeleton into a complete specification draft. |
| 1.0 (closure) | 2026-08-06 | Lead Engineer, under Product/Architecture Review per Work Package | WP1–WP9 implemented and individually approved (Product Review: APPROVED, Architecture Review: APPROVED, each communicated directly, per §29.4/§31.3); WP10 (this entry) closes the document: status header transitioned to DONE/CLOSED, §31.4 Closure Record completed, `docs/roadmap/Roadmap.md`/`docs/roadmap/Changelog.md` updated. Per §29.3, two items are recorded here as explicitly surfaced (not silently waived) rather than resolved by Engineering: (1) `js/persistenceGateway.js` was additively modified during WP6 (exports `classifyError`) under a Product/Architecture-approved prerequisite, which is a literal exception to §26.4's Explicit No-Touch listing of that file and to AC-E2 — accepted here as evidence-recorded, not silently omitted, pending explicit Product/Architecture acknowledgment; (2) `APP_VERSION`/`sw.js` `VERSION` were not advanced during WP1–WP9 despite shipping user-visible behavior changes, an apparent deviation from §26.3's own conditional and from C1's per-WP versioning precedent — not corrected in this closure pass because a version bump has real deployment/cache-invalidation effect, which WP10's own documentation-only, no-Runtime-change scope does not authorize Engineering to decide unilaterally. Neither item is assessed as blocking under §29.1's four-condition Blocker Standard (see §31.4 for the full analysis); both await explicit Product/Architecture disposition. |

## 1.2 Status Discipline

This document SHALL NOT be read as APPROVED, READY, IMPLEMENTED, or CLOSED at any point before the corresponding evidence required by §29 (Engineering Readiness Review) and §31 (Documentation and Closure Requirements) exists and is recorded. No section of this document self-certifies Product Approval, Architecture Approval, or READY status.

---

# 2. Executive Summary and Purpose

## 2.1 The Problem TASK-007 Solves

FITME's canonical philosophy (Product Bible, AI Constitution, Coach Bible, Intelligence & Relationship Philosophy) and its canonical decision architecture (D1–D3, the Coach Decision System) are approved and, in the case of the Coach Decision System's first five internal collaborators (Memory Layer, Recommendation Engine, Initiative Engine, Decision Engine, Safety Layer), implemented and closed. None of this material defines how a user actually experiences FITME over time, across the whole product, in a way that is consistent, durable, and traceable back to that philosophy. Today, presentation behavior exists only as the accumulated, independently-authored output of individual Presenters and Controllers (`js/ui/*`, `js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, `js/adaptive/adaptiveTdeeController.js`), each correct in isolation but with no shared, canonical contract governing continuity, state representation, or cross-surface consistency between them.

## 2.2 Why TASK-007 Exists Now

TASK-007 is Product Bible §11 backlog item 7 (`docs/product/Product_Bible.md.docx`), and its ordering after SL-001 was fixed by RCD-01 of the FITME Safety Layer Canonical Decision Package v2.0 ("an architectural prerequisite before TASK-007"). SL-001 is closed (`docs/specs/SL-001_SPEC_v1.0.md`, DONE/CLOSED, 2026-08-05). No canonical or architectural prerequisite remains open.

## 2.3 Product Outcome

TASK-007 exists to make FITME's long-term coaching relationship legible and consistent to the user across every existing surface — so that the qualities the approved direction names (the user increasingly feeling that FITME knows them, remembers them, understands their situation, preserves continuity, adapts as the relationship matures, reduces unnecessary effort, and builds their independence) are governed by explicit, traceable contracts rather than left to the incidental behavior of whichever Presenter happens to render a given screen.

## 2.4 Architecture Outcome

TASK-007 introduces no new Runtime, Engine, delivery surface, decision authority, or top-level architectural component. It defines cross-cutting obligations that the existing, already-approved presentation owners (Coach Runtime, and each domain's existing Presenter/Controller) must satisfy inside their own existing runtime and file ownership. This is the same relationship D1 already established between decision *policy* and the components that execute it (`docs/specs/D1_SPEC_v1.0.md`: "D1 defines policy only; it does not define architecture, prompts, APIs, UI or implementation").

## 2.5 Philosophy / UX Contracts / Visual Design

This document draws and holds one distinction throughout:

| Layer | Owns | Example |
|---|---|---|
| Philosophy | Why FITME exists; what it believes about people and coaching | Product Bible, Coach Bible, AI Constitution, Intelligence & Relationship Philosophy — unchanged by this document |
| UX contracts | What experience obligation an existing owner must satisfy | This document (TASK-007) |
| Visual design | How an obligation is rendered — color, type, spacing, motion, components | TASK-008 — unaffected, unaddressed, unabsorbed by this document |

---

# 3. Canonical Foundation

## 3.1 Governing Sources

This document is derived from, and remains subordinate to, the following canonical sources, verified present and current in the repository at authoring time:

`docs/product/Product_Bible.md.docx` (v1.1) · `docs/constitution/FITME_AI_Constitution_v1.0.md` · `docs/governance/FITME_Intelligence_and_Relationship_Philosophy_v1.0.md` (v1.1) · `docs/governance/FITME_Coach_Bible.md` (v1.1, Chapters 1–22, Canonical) · `docs/architecture/FITME_ARCHITECTURE_v1.md` · `docs/specs/D1_SPEC_v1.0.md`, `D2_SPEC_v1.0.md`, `D3_SPEC.md` · `docs/specs/TASK_004_SPEC_v1.0.md`, `TASK_005_SPEC_v1.0.md`, `TASK_006_SPEC_v1.0.md` · `docs/specs/SL-001_SPEC_v1.0.md` · `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (v2.6) · `docs/engineering/FITME_ENGINEERING_WORKFLOW_v1.0.md` · `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` · `docs/roadmap/Roadmap.md` · `docs/roadmap/Changelog.md`.

## 3.2 Approved Direction Carried Forward

The following statements from the approved Product & Architecture direction are treated as fixed premises of this document and are not re-derived or re-argued below:

1. TASK-007 defines cross-cutting UX obligations and contracts that existing authorized presentation owners must satisfy within their own boundaries; it does not replace those owners or centralize their runtime responsibilities.
2. UX, within FITME, is defined as *the experience of long-term personal guidance* — not limited to screens, navigation, flows, clicks, visual presentation, or isolated interactions.
3. The objective of TASK-007 is long-term trust, continuity, usefulness, and personal guidance — not engagement, notification frequency, conversation count, or time spent in the application.
4. TASK-007 introduces no new Runtime, Engine, delivery surface, decision authority, or top-level architectural component.
5. D3 Decision 5 (Expression produces a platform-neutral Delivery Intent only) and D3 Decision 6 (Coach Runtime is the sole architectural owner mapping Delivery Intent to platform-specific presentation) remain intact and unmodified.
6. Coach Bible remains the sole canonical authority for coaching meaning, communication doctrine, tone, language, relationship fidelity, and the communicative choice to speak or remain silent.
7. TASK-008 owns the Design System: colors, typography, spacing, design tokens, iconography, motion language, themes, and reusable visual components.

## 3.3 Interpretation Rule

Where this document is silent, ambiguous, or in apparent tension with a higher-ranked canonical source, the higher-ranked source governs (RCD-07 precedence, §1 above), and the tension is recorded using the classification taxonomy in §3.4 — never silently resolved in this document's favor.

## 3.4 Classification Taxonomy (Specification Authoring Standard)

Every unresolved matter in this document is classified as exactly one of:

- **Canonical Conflict** — two or more approved canonical sources say incompatible things.
- **Repository Gap** — no canonical source or repository component currently supplies something this document needs.
- **Product Decision Pending** — a genuine Product-authority choice with no canonical answer yet.
- **Architecture Decision Pending** — a genuine Architecture-authority choice with no canonical answer yet.
- **Engineering Decision Pending** — a bounded implementation choice with no Product/Architecture stake, deferred to implementation time.

## 3.5 Standing Prohibition

This document does not redefine, amend, or reinterpret Product Bible, AI Constitution, Intelligence & Relationship Philosophy, or Coach Bible content, and does not reopen any D1, D2, D3, TASK-004, TASK-005, TASK-006, or SL-001 Canonical Decision, including D3 Decision 6.

---

# 4. Scope, Responsibilities and Non-Goals

## 4.1 In-Scope Responsibility Categories

TASK-007 MAY and DOES define: Experience Contracts (§10); Interaction Contracts (§11); Presentation-Behavior Contracts (§12); user-visible state obligations (§9); continuity and recovery expectations (§7, §8, §19); relationship-lifecycle experience requirements (§7); feedback and response expectations (§16); navigation and flow expectations (§18); accessibility and RTL obligations (§21, §22); cross-platform experience invariants (§23); acceptance and verification requirements for user-visible behavior (§27, §28).

## 4.2 Explicit Exclusions

TASK-007 SHALL NOT define or change: Product philosophy; coaching philosophy; coaching meaning or message content; AI reasoning; Decision Input interpretation; Recommendation or Initiative generation; Decision Formation; Safety classification or Safety policy; Expression content authority; Coach Runtime ownership; Engine Registry contracts; StateAccess authority; Persistence contracts; domain logic (nutrition, workout, adaptive-TDEE calculation); platform adapter ownership; visual identity, colors, typography, spacing, design tokens, iconography, motion language, themes, or reusable visual component specifications.

## 4.3 Whole-Product Coverage

TASK-007's obligations apply to every existing user-visible domain in the repository, not only the Coach Decision System's delivery chain. Verified current domain inventory and owning implementation:

| Domain | Existing owner(s) | Verified evidence |
|---|---|---|
| Loading / Login / Onboarding | `js/app/authSessionController.js`, `js/app/bootstrapController.js`, inline `js/app.js` handlers | `index.html` `#loading-screen`, `#login-screen`, `#onboarding` |
| Home (ring, macros, water, week, meals, weight) | `js/ui/homePresenter.js` | `index.html` `#screen-home` |
| Coach card | `js/coach/coachPresenter.js` | `index.html` `#coach-card` |
| Trigger card | `js/trigger/triggerController.js` | `index.html` `#trigger-card` |
| Adaptive TDEE card / partial-day prompt | `js/adaptive/adaptiveTdeeController.js` | `index.html` `#adaptive-card`, `#partial-prompt` |
| Food (logging, AI result, favorites, quick log) | `js/ui/foodScreenPresenter.js`, `js/nutrition/*` | `index.html` `#screen-food` |
| Workout | inline `js/app.js` handlers (no dedicated `js/ui/*` module confirmed at this baseline) | `index.html` `#screen-workout` |
| Profile | `js/ui/profilePresenter.js` | `index.html` `#screen-profile` |
| Settings | `js/ui/settingsPresenter.js` | `index.html` `#screen-settings` |
| Navigation (4-tab navbar) | `js/ui/navigationController.js` | `index.html` `<nav class="navbar">` |
| Barcode scan overlay | `js/nutrition/barcodeFlowController.js` | `index.html` `#barcode-overlay` |

## 4.4 Cross-Cutting vs. Runtime Ownership

TASK-007 defines an *obligation*; the owner named in §4.3's table (or §24's Ownership Matrix, for Coach Decision System-adjacent surfaces) remains solely responsible for satisfying it inside its own existing file and runtime. TASK-007 has no code representation, registers nothing with the B2 Engine Registry, and executes nothing.

## 4.5 Boundaries with Future Work

**TASK-008 (Design System)** implements the visual realization of whatever obligation this document defines (e.g., TASK-007 requires a state to be visually distinguishable from another; TASK-008 selects the token values that make it so).

**Expression** (D3 §17's sixth, still-undesignated collaborator) is not built by TASK-007, and TASK-007 does not assume its existence for any obligation that depends on it (see §15.4).

## 4.6 Non-Goals

TASK-007 is explicitly not: a UI redesign; a Design System; a new architectural Runtime; a replacement for Coach Runtime, Expression, or any Presenter/Controller; an engagement-optimization initiative.

---

# 5. Terminology and Canonical Vocabulary

Terms below are the closed TASK-007 vocabulary. Where a term is already fixed by D1/D2/D3, this document adopts that meaning without modification and states so explicitly.

| Term | Definition | Source |
|---|---|---|
| **UX System** | The set of cross-cutting contracts defined by this document, together with the discipline requiring existing presentation owners to satisfy them. Not a runtime component, not a registered Engine, not a code artifact. | New (TASK-007) |
| **Experience** | What a user perceives, understands, and can act on as a result of FITME's state and behavior over time — the object every contract in this document governs. | New (TASK-007), grounded in the approved direction's "UX is the experience of long-term personal guidance" |
| **Interaction** | A discrete, user-initiated act directed at a presented surface (see §11's closed vocabulary). | New (TASK-007) |
| **Presentation behavior** | How a presented surface behaves over time and relative to other surfaces — independent of its visual styling (see §12). | New (TASK-007) |
| **Presentation surface** | Any existing, already-implemented user-visible element a contract may apply to (e.g., the Trigger card, the Food-result card, a screen). Not a new component; always resolves to an existing DOM element/owner named in §4.3. | New (TASK-007) |
| **User-visible state** | A named condition (see §9's closed taxonomy) that some existing repository contract already produces, and that this document's obligations attach to. | New (TASK-007), traced to existing producing contracts |
| **Relationship stage** | One of the eight stages defined in §7.2 describing where a user's relationship with FITME currently sits, for the sole purpose of scoping which experience obligation applies. Not a data field, not a computed value, not a new engine. | New (TASK-007) |
| **Continuity** | The experience property that FITME's state and behavior reflect prior context rather than restarting from nothing (§7, §8). | New (TASK-007) |
| **Presence** | The experience property that FITME is perceived as active/aware, as distinct from *absent* (silent by design) or *disappeared* (broken/unaware) — see §14. | New (TASK-007) |
| **Silence** | Used in this document **only** in its experience sense — see §14 for the required disambiguation from D2 Stage 9's `kind: 'SILENCE'` policy outcome, which this document does not redefine. | Reconciled with D2/D2 Stage 9 |
| **Feedback** (UX sense) | A user-visible acknowledgment that an action was received and its outcome (§10, §19). Distinct from, but where applicable required to route through, the C2 canonical feedback-*type* vocabulary (`js/feedback/feedbackDomain.js`, §11.2, §16). | Reconciled with C2 |
| **Recovery** | The experience path back to a normal state after a failure, interruption, or absence (§7.2, §19). | New (TASK-007) |
| **Interruption** | An event that breaks a user's current flow (navigation away, app backgrounding, network loss, a coach-originated card appearing) (§8, §12). | New (TASK-007) |
| **Cognitive effort** | The user-facing cost of a required action, question, or repeated request — the quantity Mandatory Product Principle 8 requires to decrease over time. Not a measured/instrumented value; a qualitative design constraint. | New (TASK-007) |

## 5.1 Reconciliation with D1/D2/D3 (Prohibited Redefinitions)

This document does not redefine: **Delivery Intent**, **Terminal Decision**, **Coach Runtime**, **Expression**, **Pipeline Context**, **Composite Engine**, **Internal Pipeline Orchestrator**, or D2 Stage 9's `kind: 'SILENCE'` decision outcome. Every use of these terms in this document carries exactly the meaning fixed by `D3_SPEC.md` / `D2_SPEC_v1.0.md`. No term defined in §5 above may be read as naming a new architectural component (no "UX Engine," "UX Runtime," or "UX Pipeline" is introduced by this document or any term in it).

---

# 6. UX System Model

## 6.1 Structural Relationship

A **UX contract** (Experience Contract, Interaction Contract, or Presentation-Behavior Contract, §10–§12) is a normative statement in this document. It has no code representation. It reaches an existing owner exactly the way every other canonical requirement in this repository reaches its implementer: by Engineering Review verifying, at SPEC-authoring and implementation time, that the owner's existing code satisfies it — the same relationship D1's policy rules have to the engines that execute them.

## 6.2 Universal vs. Domain-Specific Contracts

- A **universal contract** applies to every presentation surface without exception (e.g., §21 Accessibility's semantic-structure requirement, §22's RTL requirement).
- A **domain-specific contract** applies only within one domain named in §4.3 (e.g., a Food-logging confirmation-clarity requirement, §17).

Every contract instance defined or required by this document MUST declare, explicitly, which of the two it is.

## 6.3 Composition with Existing Architecture

The UX System model adds no tier to the layering already fixed by `docs/architecture/FITME_ARCHITECTURE_v1.md` §20.6 (Pure Domain / Application Services / UI Presenters-Controllers / Engine Registry, Engines, State/Persistence). Every UX contract resolves to an obligation on the existing **UI Presenters / Controllers** tier, or, where the surface is part of the Coach Decision System's delivery chain, on the existing **Coach Runtime** realization within that tier (`js/coach/coachPresenter.js`, `js/trigger/triggerController.js`, per `D3_SPEC.md` §6.2/§10.4).

## 6.4 Platform Anticipation

Contract *content* (the obligation itself) is defined platform-neutrally in this document. Contract *realization* is owned by the platform-specific implementation — on Web, the existing Presenter/Controller tier; on any future native, wearable, or voice platform, that platform's own realization, per the same Native Migration boundary already fixed by `docs/specs/C1_SPEC_v1.0.md` §27 and `docs/architecture/FITME_ARCHITECTURE_v1.md` §20.8 (see §23).

## 6.5 Verification Mechanism

**Engineering Decision Pending (non-blocking):** whether contract satisfaction is verified only at Engineering Review (document-level checklist review) or additionally via an automated test convention is left to implementation planning under §27; this document requires the former unconditionally and permits, without mandating, the latter.

---

# 7. Relationship Lifecycle Experience

## 7.1 Purpose and Discipline

This chapter defines experience obligations attached to *where a user's relationship with FITME currently is*, bounded strictly to what the current repository already tracks. It invents no Relationship Maturity data source, scoring mechanism, or detection engine. Where no repository mechanism exists for a stage below, this document records that absence as a Repository Gap rather than filling it.

## 7.2 Relationship Stages and Obligations

| Stage | Current repository evidence | Experience obligation (UX-7.n) | Classification |
|---|---|---|---|
| **7.2.1 Initial relationship / onboarding** | Five-screen onboarding wizard, `index.html` `#onboarding` (`#ob-1`…`#ob-5`) | **UX-7.1.** Onboarding MUST NOT ask for information FITME could reasonably infer or defer, and MUST make clear why each question is asked (Mandatory Product Principle 4 — early collaboration). | Normative |
| **7.2.2 Early data and trust building** | Quick Learn flow (`index.html` `#quick-learn`), streak/achievement mechanics (`js/ui/profilePresenter.js` `renderAchievements`) | **UX-7.2.** Early-stage surfaces MAY request more explicit confirmation and MAY ask more clarifying questions than later stages; this MUST decrease as §7.2.3–7.2.4 evidence accumulates. | Normative |
| **7.2.3 Growing understanding** | Adaptive TDEE's learned-TDEE display (`js/adaptive/adaptiveTdeeController.js` `renderAdaptiveSettings` — "TDEE נלמד") | **UX-7.3.** Where FITME has already derived a value from evidence (e.g., learned TDEE), it MUST be presented as known/derived, not re-requested as though unknown. | Normative |
| **7.2.4 Mature relationship** | No repository mechanism currently distinguishes a "mature" state from "growing understanding." | Repository Gap — no obligation is defined beyond §7.2.3's principle continuing to apply; a distinct mature-stage experience requires a Product Decision Pending (what, if anything, changes) once a maturity signal exists. | Repository Gap |
| **7.2.5 Periods of reduced activity** | Adaptive TDEE partial-day detection (`js/adaptive/adaptiveTdeeController.js` `renderPartialPrompt`/`pendingPartialDays`) | **UX-7.4.** Where FITME detects reduced logging activity, the resulting prompt MUST follow §7 Mandatory Product Principle 7 (Respect is invariant) — reduced activity MUST NOT change warmth or tone. | Normative |
| **7.2.6 Return after absence** | No dedicated "returning user" mechanism found (Home screen renders current day state regardless of prior absence length). | **UX-7.5.** Where a user returns after an absence long enough that today's Home state alone does not represent continuity (exact threshold: Engineering Decision Pending, non-blocking), the experience MUST NOT silently behave as though the absence did not happen, per Mandatory Product Principle 6 (disappearance is not correct). Concrete mechanism: Repository Gap (no current data source distinguishes "returned after N days" from "used yesterday"). | Normative obligation; Repository Gap on data source |
| **7.2.7 Setbacks and recovery** | Coach Bible Ch.1 (already Canonical) on setback framing; no dedicated UI setback-detection mechanism found. | **UX-7.6.** Where a setback is presented (via any existing coach-originated surface), the presentation MUST NOT contradict Coach Bible's non-judgmental framing (Mandatory Product Principle 7); TASK-007 defines this constraint only — setback detection and messaging content remain Coach Bible/Decision System territory. | Normative (constraint only) |
| **7.2.8 Long-term independence** | Achievement/streak mechanics exist; no mechanism currently reduces prompt frequency as competence grows. | **UX-7.7.** Cognitive/operational effort required of the user (question count, confirmation count, repeated data entry) MUST NOT increase over the relationship's duration, and SHOULD decrease as recognizable evidence (e.g., existing Quick Log items, existing favorites) accumulates. This is directional guidance (`SHOULD`, not `MUST`) with no independent numeric acceptance criterion of its own; it is verified qualitatively at Engineering Review, not by an automated metric. | Normative |

## 7.3 Explicit Prohibition

This document does not invent a "Relationship Maturity" data source, scoring mechanism, or detection engine. Where §7.2 identifies a Repository Gap, implementation MUST treat the corresponding obligation as forward-looking/currently unreachable — the same treatment `docs/specs/TASK_005_SPEC_v1.0.md`'s Closure Record gives Relationship Maturity ("no approved Relationship Maturity source... Product/Architecture-owned future work").

## 7.4 Traceability

§7.2's obligations trace to Mandatory Product Principles 4, 5, 6, 7, 8, 10 (see §30 Traceability Matrix).

---

# 8. User Journey and Flow Contracts

## 8.1 Journey Entry and Continuation

**UX-8.1.** The three-way entry branch already implemented (`js/app/authSessionController.js:handleAuthStateChange` — unauthenticated → Login; authenticated without profile → Onboarding; authenticated with profile → App) MUST be preserved as the sole entry-state model; TASK-007 does not add a fourth entry state.

## 8.2 Task Completion

**UX-8.2.** Every state-changing user action (meal logged, workout saved, weight logged, measurement logged, adaptive proposal accepted/dismissed) MUST produce an experience distinguishable from both "in progress" and "failed" (see §9, §19) before control returns to the user.

## 8.3 Interruption and Resumption

**UX-8.3.** Where an in-progress user action is interrupted (app backgrounded, network lost, session reset per REM-002's `sessionLifecycle` generation guard), partially-entered data MUST NOT be silently discarded without an explicit, traceable reason (see §19.5). Where session generation changes mid-flow (`sessionLifecycle.isCurrent(gen)` returns false), the in-flight UI update MUST be suppressed rather than applied against stale state — this is already current, correct behavior (`js/coach/coachPresenter.js`, `js/adaptive/adaptiveTdeeController.js`, `js/trigger/triggerController.js` all implement this pattern today) and this document adopts it as a binding cross-cutting obligation rather than an incidental convention.

## 8.4 Navigation Continuity

**UX-8.4.** The existing four-tab navbar (`index.html` `<nav class="navbar">` — Home/Food/Workout/Profile) plus Settings (reachable only from Profile's gear icon) MUST remain navigable without dead ends: every screen MUST have at least one always-available path back to a navbar destination.

## 8.5 Context Retention

**Repository Gap:** the current `js/ui/navigationController.js:goToScreen()` model has no URL/history state and no persisted scroll/selection context across screen switches. Whether this constitutes an obligation gap TASK-007 must close, or an accepted current limitation, is a **Product Decision Pending** — this document records the ambiguity and does not resolve it. Non-blocking: no repository evidence shows this ambiguity prevents a coherent SPEC, since §8's other obligations do not depend on its resolution.

## 8.6 Minimizing Repetition

**UX-8.5.** Where a value is already known to FITME (already-entered profile field, already-confirmed Quick Log item, already-stored favorite), no existing or future surface MAY re-request it without an explicit, user-visible reason (Mandatory Product Principle 8).

## 8.7 Cross-Surface Handoff

**UX-8.6.** Where a coach-originated surface offers a navigation action into a domain screen (existing example: the Adaptive partial-day prompt's "השלם" (complete) button routing to the Food screen, `js/adaptive/adaptiveTdeeController.js:renderPartialPrompt`), the destination screen MUST reflect the context that motivated the handoff (e.g., arriving at Food screen already scoped to the relevant day) wherever the destination screen's existing data model supports it.

---

# 9. User-Visible State Taxonomy

## 9.1 Closed Taxonomy

Every user-visible state this document's contracts may attach to is one of the eighteen states below. No contract in this document, and no future amendment authored under it, may introduce a nineteenth state without an explicit Product/Architecture Decision extending this table.

| Code | State | Producing contract (verified) | Current UI consumer | Classification |
|---|---|---|---|---|
| UXS-01 | Initial | `index.html` `#loading-screen` | Present (static markup) | Producer + consumer exist |
| UXS-02 | Loading | `#food-loading`, `#ql-loading` (`index.html`); `.spinner` (`css/app.css`) | Present | Producer + consumer exist |
| UXS-03 | Success | `js/persistenceGateway.js` `status: 'SUCCESS'` | Partial — collapsed into generic `alert()` (e.g., `js/adaptive/adaptiveTdeeController.js:164`) | Producer exists; consumer non-differentiated |
| UXS-04 | Partial success | Repository Gap — no producing contract distinguishes "partial" from "success" today | Absent | Repository Gap |
| UXS-05 | No-op | `js/persistenceGateway.js` `status: 'NO_OP'` | Not confirmed | Producer exists; consumer not verified |
| UXS-06 | Empty | Length-zero checks in `js/ui/homePresenter.js`, `js/ui/foodScreenPresenter.js`, `index.html` static markup | Present (duplicated in 3+ places, §25) | Producer + consumer exist, duplicated |
| UXS-07 | Unavailable | `js/coachDecisionSystem/*` `UNAVAILABLE`/`UNKNOWN` sentinels (TASK-005/006) | Absent | Producer exists; consumer absent |
| UXS-08 | Stale | REM-002 `sessionLifecycle.isCurrent()` | Present (as suppression, not as a shown state — see §8.3) | Producer + consumer exist (silent) |
| UXS-09 | Validation failure | `js/nutritionValidator.js` (never-default-to-zero sentinel discipline) | Not fully traced this pass | Producer exists; consumer not fully verified — Repository Gap |
| UXS-10 | Persistence failure | `js/persistenceGateway.js` `status: 'FAILED'`, `error.code` | Partial — generic `alert()` only | Producer exists; consumer non-differentiated |
| UXS-11 | Conflict | `js/persistenceGateway.js` `status: 'CONFLICT'`, `error.code: 'EXPECTED_VERSION_MISMATCH'` | Absent (no consumer located) | Repository Gap |
| UXS-12 | Offline | No dedicated producer (`sw.js` cache fallback only; no `navigator.onLine` usage anywhere in `js/`) | Absent | Repository Gap |
| UXS-13 | Deferred | `js/coachDecisionSystem/safetyLayer.js` `'DEFERRED'` disposition | Absent | Producer exists; consumer absent |
| UXS-14 | Suppressed | `js/feedback/feedbackDomain.js` `evaluateSuppression()` | Absent by design (C2 CD-07) | Producer exists; consumer intentionally absent |
| UXS-15 | Blocked | `js/coachDecisionSystem/safetyLayer.js` `'BLOCKED'` disposition | Absent | Producer exists; consumer absent |
| UXS-16 | Escalated | `js/coachDecisionSystem/safetyLayer.js` `'ESCALATED'` disposition | Absent | Producer exists; consumer absent |
| UXS-17 | Recovery | No dedicated producer found distinct from §7.2.6/§7.2.7 | Absent | Repository Gap |
| UXS-18 | Session transition | REM-002 `sessionLifecycle` generation guard | Present (silent suppression) | Producer + consumer exist (silent) |

## 9.2 Rule

**UX-9.1.** Every Experience Contract instantiated under §10 MUST declare which of UXS-01 through UXS-18 it attaches to, and MUST cite the producing contract from §9.1's table. No contract instance may attach to a state not in this table.

**UX-9.2.** Where §9.1 records "Repository Gap" for a state's producer, no Experience Contract may be written as though a producer already exists; the gap MUST be carried into §26 (Repository Impact) and §9's own Traceability entry (§30) as open.

---

# 10. Experience Contracts

## 10.1 Closed Template (ECT-1)

Every Experience Contract in this document, and every Experience Contract authored under this document's authority during implementation, MUST use exactly the following closed template. No field may be omitted; a field with no applicable content MUST state "None" explicitly rather than being left blank.

| Field | Requirement |
|---|---|
| Trigger / producing state | One code from §9.1 (UXS-01…UXS-18) |
| User need | The concrete question the user needs answered by this experience |
| Required clarity | What the user MUST be able to understand from this experience alone, without external explanation |
| Allowed user actions | One or more verbs from §11's closed interaction vocabulary |
| Continuity expectation | What prior context (if any) this experience MUST reflect, per §7/§8 |
| Feedback expectation | What acknowledgment the user receives after acting, per §19 |
| Failure behavior | What happens if the underlying operation fails, traced to §19's structured-contract requirement |
| Accessibility expectation | Cross-reference to §21's applicable universal requirements |
| Implementation owner | Exactly one owner named in §4.3 or §24's Ownership Matrix — never a new owner |
| Prohibited behavior | What this experience MUST NOT do (e.g., MUST NOT claim certainty beyond available evidence — Mandatory Product Principle 3) |

## 10.2 Rule Governing Instances

**UX-10.1.** This document does not instantiate per-surface Experience Contracts for every existing presentation surface listed in §4.3; doing so is Engineering execution under this SPEC (§26, §29), following template ECT-1, verified at Engineering Review against §28's acceptance criteria — the same relationship D1's rule system has to the individual Recommendation/Initiative content the Decision Engine later produces from it. This document fixes the template and the cross-cutting rules (§10.1, §12, §14, §15, §19) that every instance MUST satisfy; it does not pre-author the instances themselves, to avoid dictating implementation-level content this SPEC has no evidence-basis to fix.

**UX-10.2.** Every Experience Contract's "Required clarity" field MUST NOT require or imply a claim of certainty greater than the producing state's own evidence supports (Mandatory Product Principle 3), and MUST NOT be phrased in vague terms such as "appropriate feedback" or "as needed" without an objective rule, owner, and verification method attached (Specification Authoring Standard quality requirement).

---

# 11. Interaction Contracts

## 11.1 Closed Interaction Vocabulary

| Verb | Semantic meaning | Permitted state change |
|---|---|---|
| Accept | User affirmatively agrees to a proposed change | MAY change durable state through the owning domain's existing Persistence Gateway operation |
| Reject | User affirmatively declines a proposed change | MUST NOT change the underlying proposal's own domain state beyond recording the rejection |
| Dismiss | User closes a presented surface without an affirmative accept/reject | MUST NOT change domain state; MAY record feedback per §11.2 |
| Acknowledge | User confirms having seen/understood non-actionable information | MUST NOT change domain state beyond marking the acknowledgment |
| Retry | User re-attempts a failed operation | Re-invokes the same underlying operation; no new state category |
| Postpone | User defers a decision without rejecting it | MUST NOT be treated as Reject; recurrence behavior is Engineering Decision Pending (§11.3) |
| Cancel | User abandons an in-progress action before completion | MUST preserve already-entered data per §8.3/§19.5 where technically possible |
| Continue | User proceeds to the next step of a multi-step flow | No state change beyond flow position |
| Undo | User reverses a just-completed action | Only where the owning domain's existing contract supports reversal; MUST NOT be offered where it does not (§11.3) |
| Learn more | User requests additional explanation | Informational only; no state change |
| Provide feedback | User supplies an explicit response to a recommendation-like surface | MUST route through §11.2's C2 mapping |
| Decline to answer | User explicitly opts out of a question | MUST NOT be silently treated as an unanswered/ignored question (§11.3) |

## 11.2 Reconciliation with C2

C2's closed feedback-type catalogue (`js/feedback/feedbackDomain.js`, `FEEDBACK_TYPES = ['Accepted', 'Completed', 'Dismissed', 'Rejected', 'Ignored', 'Expired', 'UserCorrected', 'UserConfirmed']`) is the canonical authority for any interaction directed at a Recommendation-, Initiative-, Trigger-, or Adaptive-proposal-like surface. TASK-007 does not define a competing taxonomy.

| §11.1 verb | C2 mapping | Verified existing instance |
|---|---|---|
| Accept | `Accepted` | `js/adaptive/adaptiveTdeeController.js:applyAdaptiveUpdate` → `recordFeedbackFn(..., 'Accepted')` |
| Reject | `Rejected` | Vocabulary exists in C2; no verified current UI trigger located this pass |
| Dismiss | `Dismissed` | `js/trigger/triggerController.js:ensureTriggerCardDismissButton`; `js/adaptive/adaptiveTdeeController.js:dismissAdaptiveUpdate` |
| Acknowledge | `UserConfirmed` | Vocabulary exists in C2; no verified current UI trigger located this pass |
| Undo | `UserCorrected` | Vocabulary exists in C2; no verified current UI trigger located this pass |
| Continue (task completion) | `Completed` | Not verified as wired to a recommendation-like surface this pass |
| Postpone | *(no clean mapping)* | Not resolved — see §11.3 |
| Cancel | *(no mapping — not a C2-scoped interaction)* | N/A |
| Learn more | *(no mapping — informational, no state change)* | N/A |
| Decline to answer | *(no clean mapping)* | Not resolved — see §11.3 |

**UX-11.1.** Only interactions directed at a Recommendation-, Initiative-, Trigger-, or Adaptive-proposal-like surface record a C2 feedback entry, using §11.2's mapping. Purely navigational or informational interactions (Learn more, Cancel of a non-proposal flow) produce no C2 feedback record.

## 11.3 Open Items (Non-Blocking)

**Product Decision Pending:** whether `Postpone` and `Decline to answer` require a C2 catalogue extension, or can be represented using existing types (`Ignored`/`Expired` for Postpone; no existing type cleanly fits Decline-to-answer), is not Engineering's to decide — C2's catalogue is closed by canonical decision, and any extension requires its own Product/Architecture decision. This is non-blocking because no current repository surface requires either interaction today.

**Engineering Decision Pending:** the exact recurrence behavior after `Postpone` (re-shown next session? next day? never automatically?) is an implementation detail with no Product-policy stake identified in the approved direction; deferred to implementation.

---

# 12. Presentation-Behavior Contracts

## 12.1 Scope and Boundary Statement

Every rule in this chapter governs *behavior*, never *appearance*. **UX-12.0.** No rule in this chapter may be satisfied or implemented by a color, font, spacing, icon, animation curve, or theme choice — those remain TASK-008's exclusive territory (§4.2). Every rule in this chapter is an obligation on Coach Runtime and each domain's existing Presenter/Controller (§6.3); this document does not perform sequencing, replacement, or expiration itself, and does not select or reference a delivery platform, per D3 Decision 5/6.

## 12.2 Rules

| Property | Rule |
|---|---|
| Presence vs. absence | **UX-12.1.** A surface's presence MUST be traceable to a real producing state (§9); no surface may appear with no state to justify it. |
| Prominence | **UX-12.2.** Relative prominence among simultaneously-eligible coach-originated surfaces MUST be deterministic (§12.3) and MUST NOT be engagement-driven (Mandatory Product Principle 2) — verified by §28.1's AC-P2 (absence of any engagement metric anywhere in §7–§23). |
| Persistence | **UX-12.3.** A surface MUST remain visible until its producing state changes, the user interacts with it (§11), or an explicit expiration rule (below) applies — it MUST NOT disappear silently. |
| Interruption level | **UX-12.4.** A surface's interruption level (passive card vs. active prompt) MUST be proportionate to its producing state's own severity signal where one exists (e.g., TriggerDomain's existing `PRIO.health` > `PRIO.opportunity` > `PRIO.encouragement`, `js/trigger/triggerDomain.js:38`) — TASK-007 does not invent a new severity scale; it requires presentation to remain consistent with the severity signal the producing domain already assigns. |
| Dismissibility | **UX-12.5.** Every non-blocking surface MUST offer a Dismiss interaction (§11.1); a Blocked/Escalated-disposition surface (§15) MAY be non-dismissible only where the Safety Layer's own disposition requires it — a decision this document does not make. |
| Sequencing | **UX-12.6.** Where multiple coach-originated surfaces are simultaneously eligible (verified current case: `#trigger-card`, `#coach-card`, `#adaptive-card`, `#partial-prompt` on Home, `index.html:194-221`, currently uncoordinated), sequencing MUST be deterministic and MUST NOT contradict each surface's own producing domain's existing priority signal (e.g., a `redflag` Trigger, `PRIO.health`, MUST NOT be presented as less prominent than an `encouragement`-priority Trigger). The exact total order among all four existing card types where no relative priority signal currently exists between them (e.g., Adaptive card vs. Coach card) is a **Repository Gap** requiring a **Product Decision Pending** — which coach-originated surface takes precedence is a relationship-priority question, not a bounded implementation choice — this document requires determinism, not a specific order, where evidence does not already supply one. |
| Replacement | **UX-12.7.** A surface MAY be replaced by a newer instance of the same producing state (e.g., a new Trigger evaluation superseding a shown one) only where the newer instance is at least as current per REM-002's session-generation guard (§8.3); a stale replacement MUST NOT occur. |
| Expiration | **UX-12.8.** A surface tied to a time-bound state (e.g., a daily Trigger) MUST NOT persist past the validity of its producing state; the exact expiration timing per surface is Engineering Decision Pending, bounded by each domain's own existing budget/cadence rules (e.g., `TriggerDomain`'s existing daily budget, `js/persistenceGateway.js` `TRIGGER_UPDATE_BUDGET`). |
| Repetition | **UX-12.9.** The same specific instance of a state MUST NOT be re-presented to the user after an explicit Dismiss/Reject without a new producing-state event, consistent with C2's own suppression discipline (§16). |
| State transition | **UX-12.10.** A visible transition between two user-visible states (e.g., Loading → Success) MUST occur without an intermediate state the user could mistake for a third, undefined state. |
| Cross-surface consistency | **UX-12.11.** Where the same underlying value is shown on more than one screen (e.g., today's consumed-kcal total, shown on both Home and Food), all instances MUST reflect the same underlying data at the same moment — no surface may show a value known to be stale relative to another currently-visible surface. |

---

# 13. Coach Experience Boundary

## 13.1 Inheritance

**UX-13.1.** Coach Bible (`docs/governance/FITME_Coach_Bible.md`, Chapters 1–22, Canonical) remains the sole canonical authority for coaching meaning, tone, language, relationship fidelity, and the communicative choice to speak or remain silent. This document defines no wording, no tone rule, and no communication policy, and cites Coach Bible Chapter 4 ("Coaching Communication" — "not what FITME decides, but how it says what it has decided") and Chapter 20 ("The Measure of a Faithful Coach") as the standing authority this chapter defers to entirely.

## 13.2 The Line This Document Draws

| Belongs to TASK-007 (this document) | Belongs to Coach Bible / D1 / Expression / Coach Runtime |
|---|---|
| Whether a coach message persists, is dismissible, or is sequenced relative to other surfaces (§12) | What the message says, its tone, and whether it is sent at all |
| Whether a failure to deliver is honestly represented (§19) | The content of any coach communication |
| Accessibility/RTL rendering obligations (§21, §22) | Word choice, register, warmth |

## 13.3 Reaffirmation

**UX-13.2.** D3 Decision 5 (Expression: platform-neutral Delivery Intent only) and D3 Decision 6 (Coach Runtime: sole architectural owner of platform-specific mapping) are unchanged by this document. No rule in this document may be read as granting TASK-007, or any future artifact authored under it, authority to select, compose, or alter coach message content.

## 13.4 Coach-Initiated vs. User-Initiated Experiences

**UX-13.3.** The presentation-behavior contracts in §12 apply identically to coach-initiated surfaces (Trigger card, Coach card, Adaptive card — currently produced outside the Coach Decision System's Expression/Coach Runtime chain, per verified repository evidence: `js/trigger/triggerController.js` and `js/adaptive/adaptiveTdeeController.js` do not reference `js/coachDecisionSystem/*` at all) and user-initiated experiences (settings changes, manual logging). This document does not distinguish their governing presentation rules; it does distinguish, per §13.2, that only the former's *content* is Coach Bible/D1 territory.

## 13.5 Single Communication Authority

**UX-13.4.** This document does not create a second communication authority. Where §12's sequencing/prominence rules interact with *when* a coach card may appear, implementation MUST verify that no such rule constitutes a de facto Silence-policy decision reserved to D1/Coach Bible/the Decision Engine; any case where this line is unclear at implementation time MUST be raised as a Product Decision Pending, not resolved by inference.

---

# 14. Silence and Presence

## 14.1 The Seven States, Disambiguated

| State | Is it a decision or a technical condition? | Owner of the decision | TASK-007's obligation |
|---|---|---|---|
| Communicative silence | Decision (D2 Stage 9 `kind: 'SILENCE'`, D1 Silence Policy) | D1 / Decision Engine / Coach Bible | Define only what (if anything) is shown as a result — §14.2 |
| Absence of relevant output | Technical condition (no Opportunity/Candidate produced) | N/A — a fact, not a decision | Same as above |
| Suppressed output | Decision (C2 `evaluateSuppression`, CD-07 "never punitive") | C2 / Decision Engine | MUST remain invisible by design, per C2's own approved policy — §16.1 |
| Deferred output | Decision (`js/coachDecisionSystem/safetyLayer.js` `'DEFERRED'`) | Safety Layer | Experience obligation defined in §15 |
| Technical failure | Technical condition | N/A | Experience obligation defined in §19 |
| Offline state | Technical condition | N/A | Experience obligation defined in §20 |
| Product disappearance | Never a legitimate state (Mandatory Product Principle 6) | N/A — a failure mode to prevent | §14.2 |

## 14.2 Rule

**UX-14.1.** This document preserves full Coach Bible and Decision System authority over *whether* silence, in any of the senses above, is selected. TASK-007 governs only the experience consequence, separated below into a resolved rule (prolonged absence) and an open question (ordinary single-instance communicative silence).

**UX-14.1a. Prolonged absence (resolved).** Per Mandatory Product Principle 6 and the already-established obligation at UX-7.5 (§7.2.6) — the experience MUST NOT silently behave as though a prolonged absence did not happen — this document confirms that obligation is not overridden by any communicative-silence exception: a technical or output-absence condition of prolonged-absence duration MUST carry the minimal continuity signal UX-7.5 already requires. This is a binding rule, not an open question.

**UX-14.1b. Ordinary single-instance communicative silence (open).** Where a technical condition (offline, failure, absence of output) produces the same visible non-appearance as a deliberate, single-instance communicative silence would, the two MUST remain experientially indistinguishable from "the product is broken or unaware" **only** where Coach Bible's own text (Ch.4 §3: "the right communicative choice is still to say nothing") requires no signal — this document does not override that finding. Where no such Coach Bible finding applies (i.e., the non-appearance is purely technical), §19/§20's honesty-preserving obligations govern instead.

**Canonical tension recorded, not resolved (per instruction, tensions are surfaced not silently resolved):** whether *any* minimal, honest signal may ever be shown for a D1-chosen ordinary single-instance communicative silence without contradicting Coach Bible Ch.4 §3 is left as a **Product Decision Pending**, to be raised by implementation only if a concrete case arises where the distinction matters in practice; it does not block this SPEC's completion because no current repository surface presents this case (no communicative-silence UI exists at all today, per §9.1 UXS-13/14/15/16's "Absent" consumer status). This open question is narrowed to the single-instance case only — the prolonged-absence case is resolved by UX-14.1a above.

---

# 15. Safety and Boundary Experience

## 15.1 Scope

This chapter maps already-approved, already-implemented Safety Layer and Decision Formation outputs into experience *obligations*, without changing any of those outputs.

## 15.2 Explicit Non-Alteration

**UX-15.1.** This document does not define, and MUST NOT be read as defining: Safety disposition selection logic; the closed `reasonCode` catalogue's content; `reasonDetail` structure; `boundaryType` selection; any Terminal Decision field; or any part of Expression's or Coach Runtime's authority over whether or how a Safety-affected message is communicated.

## 15.3 Experience Categories

| Disposition / kind | Verified source | Experience obligation |
|---|---|---|
| `ESCALATED` | `js/coachDecisionSystem/safetyLayer.js` | **UX-15.2.** Per RCD-04, Expression communicates; Coach Runtime delivers. This document's only obligation: whatever surface eventually renders an `ESCALATED` outcome MUST satisfy the same accessibility (§21) and honesty (§19) obligations as any other surface — it defines no communication content. |
| `BLOCKED` | `js/coachDecisionSystem/safetyLayer.js` | **UX-15.3.** MUST NOT be rendered as a disguised recommendation (consistent with existing D2/TASK-006 "no disguised recommendation after a block" discipline) — a presentation-behavior constraint, not new Safety policy. |
| `DEFERRED` | `js/coachDecisionSystem/safetyLayer.js` | **UX-15.4.** Where rendered, MUST be distinguishable from Suppressed (§16.1) and from a technical failure (§19), per §9's taxonomy. |
| `MODIFIED` | `js/coachDecisionSystem/safetyLayer.js` | **UX-15.5.** Presentation MUST NOT expose the pre-modification content — only the Safety-Layer-authored final content, per the existing `decisionFormation.js` Decision-Level Modification contract (RCD-15). |
| `REFUSAL` (boundaryType) | `js/coachDecisionSystem/decisionFormation.js` | **UX-15.6.** MUST be presented honestly as a boundary, not softened into an ordinary Silence. |
| `ESCALATION` (boundaryType) | `js/coachDecisionSystem/decisionFormation.js` | Same obligation as `ESCALATED` above (§15.2). |

## 15.4 Reachability

**Repository Gap, explicitly carried forward:** RCD-04 assigns *communication* of `ESCALATED` to Expression, and Expression is not built (D3 §17's sixth, undesignated collaborator). §15.3's obligations are therefore **forward-looking and currently unreachable** — the same treatment TASK-005 gave Relationship Maturity. This document defines the obligations now so that, once Expression exists, the experience layer is not designed from nothing; it does not require Expression to exist for this SPEC to be complete, and does not name a work item for Expression (§4.5).

---

# 16. Recommendation, Initiative and Feedback Experience

## 16.1 Suppression

**UX-16.1.** Per C2's own approved policy (CD-07: suppression "never punitive"), a suppressed candidate MUST remain invisible — no visibility obligation is defined for suppression by this document, consistent with `js/feedback/feedbackDomain.js`'s current, correct behavior of filtering suppressed candidates before any card is shown.

## 16.2 Presentation Obligations by Kind

**UX-16.2.** Recommendation-kind and Initiative-kind Terminal Decisions MUST be presented distinguishably from one another wherever both could plausibly appear on the same surface, reflecting their existing distinct field sets (`category` present only on Recommendation-kind, per CD-T005-02/CD-T006-03) — this document does not define what that distinction looks like visually (TASK-008), only that it MUST exist behaviorally.

**Reachability note:** per §15.4's discipline, this obligation is currently unreachable (no UI consumer exists for either kind today, per §9.1/prior evidence) and is recorded as forward-looking.

## 16.3 Feedback Capture

**UX-16.3.** Any new interaction surface built under this document's authority MUST route feedback capture through the existing `recordFeedbackFn`/Persistence Gateway `RECOMMENDATION_FEEDBACK_RECORD` operation pattern already used by `js/trigger/triggerController.js:ensureTriggerCardDismissButton` and `js/adaptive/adaptiveTdeeController.js:applyAdaptiveUpdate`/`dismissAdaptiveUpdate` — no new feedback-recording mechanism may be introduced.

## 16.4 Follow-Up Continuity

**UX-16.4.** Where a topic previously dismissed/rejected recurs (per C2's suppression-recovery policy, `SUPPRESSION_RECOVERY_POLICY_V1`), the experience MUST NOT present it as though it were the first occurrence, where the underlying domain already carries this information (it does, via `js/feedback/feedbackDomain.js`'s feedback-history read).

## 16.5 Learning-Loop Visibility

**Product Decision Pending, non-blocking:** whether any user-visible acknowledgment of "FITME noticed this pattern" is canonically permitted for suppression/learning is not resolved by any inherited source located this pass; §16.1's default (suppression remains invisible) governs until a Product Decision extends it. This does not block SPEC completion because §16.1 is a sufficient, fully-specified default.

---

# 17. Data Entry and Logging Experience

## 17.1 Scope

Food logging (text/photo/barcode), workout logging, measurements, onboarding inputs, correction, validation, confidence, confirmation, cancellation, recovery from incomplete entry — presentation-experience obligations only; nutrition/workout/AI-analysis domain logic is unchanged and out of scope.

## 17.2 Obligations

**UX-17.1.** Validation failures MUST be presented using the actual invalid-field distinction the domain contract already makes (`js/nutritionValidator.js`'s sentinel discipline — "never default an invalid/non-numeric value to 0... must trigger [a named invalid state], never silently null/0") — a generic "error" message that discards this distinction does not satisfy this obligation.

**UX-17.2.** Confidence, where already computed by a domain contract (the existing `.confidence-badge` `high`/`mid`/`low` pattern on the Food-result card, `index.html`/`css/app.css`), MUST be presented, not discarded, and MUST NOT be presented with more certainty than the underlying badge value supports (Mandatory Product Principle 3) — i.e., phrasing/behavior MUST be judged against which of the three existing enum values (`high`/`mid`/`low`) is present, not an independent certainty scale.

**UX-17.3.** Cancellation of an in-progress entry MUST preserve already-entered data per §8.3/§19.5 wherever the domain's own existing state model makes this technically possible (e.g., the Food-result card's draft state prior to `addMeal()`); where it is not currently possible, this is a Repository Gap, not a violated obligation.

**UX-17.4.** Recovery from incomplete entry (e.g., an abandoned onboarding step, an abandoned meal edit) MUST resume from the last completed step, not restart, wherever the existing flow's own state model retains that position (the onboarding wizard's `#ob-1`…`#ob-5` step model does today).

---

# 18. Navigation and Information Architecture Contracts

## 18.1 Obligations

**UX-18.1.** The existing single top-level navigation model (`js/ui/navigationController.js:goToScreen()`) MUST remain the sole top-level navigation authority; TASK-007 does not introduce a second.

**UX-18.2.** Discoverability: Settings' current reachability only via the Profile screen's gear icon (not the navbar) is an existing fact. Whether this satisfies a discoverability obligation is a **Product Decision Pending** — not resolved here; no obligation in this document currently depends on its resolution.

**UX-18.3.** Deep-linking: no repository evidence supports any current deep-linking capability (no router, no URL state). No deep-linking obligation is defined by this document; a future one requires an Architecture Decision Pending (whether a router is introduced) that is explicitly out of this document's authority.

**UX-18.4.** Context retention across screen switches MUST satisfy §8.5's disposition (recorded there as Product Decision Pending, non-blocking).

**UX-18.5.** Onboarding exit and resumption MUST satisfy §17.4.

## 18.2 Explicit Out of Scope

Visual layout, iconography, or navbar styling (TASK-008).

---

# 19. Error, Failure and Recovery Contracts

## 19.1 Closed Category Set

user-correctable errors; system failures; persistence failures; conflicts; network failures; stale or unavailable information; retryable vs. non-retryable outcomes; safe fallback; preservation of entered data; escalation where applicable.

## 19.2 Grounding Requirement

**UX-19.1.** Every category above MUST be distinguished using fields the Persistence Gateway (`js/persistenceGateway.js`: `status ∈ {SUCCESS, NO_OP, FAILED, CONFLICT}`, `error.code`, `error.retryable`) or another already-existing structured repository contract exposes — never a new classification scheme, and never a single generic message covering more than one category.

**Verified current gap:** every call site inspected (`js/adaptive/adaptiveTdeeController.js:150`, and the broader `alert()`-based pattern across `js/app.js`, `js/nutrition/*`, `js/ui/dayNavigationController.js`, `js/memory.js`) currently collapses `FAILED` and any other non-success outcome into one generic `alert()` string, discarding the structured `error.code`/`error.retryable` distinction already available. This document requires (§19.1) that this distinction be surfaced; it does not mandate any specific UI mechanism for doing so (TASK-008/Engineering territory).

## 19.3 Retryable vs. Non-Retryable

**UX-19.2.** Where `error.retryable` is available from the producing contract, the presented experience MUST offer a Retry interaction (§11.1) only when `true`, and MUST NOT offer one when `false`.

## 19.4 Safe Fallback

**UX-19.3.** No failure presentation may fabricate a successful-looking state; a failed operation MUST be presented as UXS-10/UXS-11 (§9.1), never silently coerced into UXS-03 (Success).

## 19.5 Preservation of Entered Data

**UX-19.4.** Verified current positive precedent: `applyAdaptiveUpdate()`'s failure path preserves the pending proposal rather than discarding it (`js/adaptive/adaptiveTdeeController.js:147-152`, "proposal נשאר פעיל" / "proposal remains active"). This behavior is adopted as a binding cross-cutting obligation: every data-entry surface MUST preserve already-entered/pending data across a failed persistence attempt wherever the domain's own state model makes this technically possible.

## 19.6 Explicit Out of Scope

Retry mechanics, backoff timing, or transport-level error handling — already implemented at the Persistence Gateway's bounded-retry layer (B4), unchanged by this document.

---

# 20. Offline and Connectivity Experience

## 20.1 Verified Baseline

No `navigator.onLine` usage and no dedicated offline UI state exist anywhere in `js/` at this repository baseline (re-verified this pass). The only offline-adjacent behavior is `sw.js`'s same-origin, GET-only stale-while-revalidate cache strategy.

## 20.2 Obligations

**UX-20.1.** Where FITME cannot distinguish "offline" from "server error" (current baseline — no producing contract exists), no experience may claim a specific cause it cannot verify; a generic, honest "could not complete" representation (via §19's structured-failure obligation) is the only obligation this document can currently place, and this is recorded as a **Repository Gap** on the offline-detection producer itself, not an obligation this document can complete today.

**UX-20.2.** Cached/read-only capability (what `sw.js`'s shell cache already allows to render even without network) MUST NOT be presented as though it reflects live data — Mandatory Product Principle "prevention of false success" applied to the cache layer.

**UX-20.3.** Any future queued/unsaved-work mechanism MUST honestly represent unsaved state as unsaved (UXS-05/UXS-10, not UXS-03) until confirmed persisted.

## 20.3 Explicit Out of Scope / Prohibition

Service-worker cache strategy, cache invalidation policy, or any `sw.js` implementation detail. This document does not prescribe how offline detection is implemented, only that, once it exists, it MUST satisfy §20.2's honesty obligations.

---

# 21. Accessibility

## 21.1 Verified Baseline

Exactly one `aria-label` exists in the current implementation (`index.html`, the Settings gear icon); zero `alt` attributes exist (no `<img>` tags — icons are inline SVG/emoji); no `aria-live` region exists on any dynamically-injected surface (Trigger/Coach/Adaptive cards); pinch-zoom is disabled (`index.html` `user-scalable=no`); no accessibility-testing infrastructure exists in the repository.

## 21.2 Normative Requirements (Universal — §6.2)

**UX-21.1.** Every dynamically-injected user-visible surface (any element toggled via the existing `.hidden` class pattern) MUST be announced to assistive technology when it appears — an `aria-live` (or equivalent) obligation, universal, with no current satisfying implementation.

**UX-21.2.** Every interactive control MUST have a programmatically-determinable accessible name (label, `aria-label`, or equivalent) — the current one-instance baseline does not satisfy this obligation for the remainder of the application.

**UX-21.3.** Every interactive control MUST be operable by keyboard alone, without requiring a pointer gesture.

**UX-21.4.** Focus behavior MUST be deterministic: a newly-shown modal-equivalent surface (currently only `#barcode-overlay`) MUST receive focus; a dismissed surface MUST return focus to a sensible prior element.

**UX-21.5.** Every form control MUST have an associated, programmatically-determinable label.

**UX-21.6.** Motion MUST respect a user's reduced-motion preference where the platform exposes one — currently unimplemented (`css/app.css`'s `spin`/`scan` keyframes have no `prefers-reduced-motion` guard).

**UX-21.7.** Text scaling/zoom MUST NOT be blocked at the obligation level; the current `user-scalable=no` setting does not satisfy this obligation. Resolving the conflict between this and any Product reason `user-scalable=no` was originally set is a **Product Decision Pending**, not decided here.

## 21.3 Contrast Boundary with TASK-008

**UX-21.8.** TASK-007 sets the contrast *requirement* (every text/background pairing MUST meet a defined minimum ratio); TASK-008 selects the token values that satisfy it. This document does not set the numeric ratio. Two distinct open questions follow from this, recorded separately rather than as one merged item, per the Specification Authoring Standard's single-owner rule and the `docs/specs/TASK_006_SPEC_v1.0.md` P-1/A-1 precedent: (a) **Product Decision Pending** — what UX-quality bar the contrast requirement must meet, since no existing canonical source fixes one (OD-11a); (b) **Architecture Decision Pending** — technical feasibility/enforceability of the resulting ratio across the existing Web implementation and any future platform (OD-11b). §28's acceptance criteria require both to be resolved before Engineering Readiness, not before this document's completion.

## 21.4 Test and Evidence Expectations

See §27.4.

---

# 22. Hebrew and RTL Experience

## 22.1 Verified Baseline

`index.html:2` (`lang="he" dir="rtl"`); `manifest.json` (`"lang": "he", "dir": "rtl"`); `css/app.css` (`direction: rtl` on `html, body` and on form controls). No LTR or locale-switch path exists anywhere in the current implementation.

## 22.2 Normative Requirements

**UX-22.1.** Every existing and future presentation surface MUST render correctly under `dir="rtl"` without a per-surface LTR override, consistent with the current, application-wide baseline.

**UX-22.2.** Mixed-direction content (Latin-script food/brand names, numeric values inside Hebrew sentences) MUST remain legible and MUST NOT invert digit or unit order. "Legible" becomes objectively checkable once the contrast-ratio decision at §21.3 (OD-11a) is resolved; this rule does not itself set that ratio.

**UX-22.3.** Navigation direction (e.g., "back"/"forward" semantics, slider fill direction) MUST follow RTL convention consistently across all surfaces.

**UX-22.4.** Icon directionality (e.g., any directional arrow or chevron) MUST be mirrored for RTL where the icon carries directional meaning.

**UX-22.5.** Dynamically-injected content (coach cards, AI-generated text) MUST inherit the application's RTL context without requiring per-injection direction handling.

## 22.3 Future Localization Boundary

**Product Decision Pending, non-blocking:** whether TASK-007 must anticipate a future non-Hebrew locale or may treat Hebrew/RTL as a permanent invariant is not resolved by any inherited source. §22.2's rules are written to hold under either answer; this document does not need the answer to be complete.

---

# 23. Cross-Platform and Native Compatibility

## 23.1 Boundary (Verified)

`docs/architecture/FITME_ARCHITECTURE_v1.md` §20.6/§20.8 and `docs/specs/C1_SPEC_v1.0.md` §27 (Native Migration Contract): the **UI Presenters / Controllers** tier and the six `js/adapters/*.js` platform adapters are already fixed as the native-*replaceable* boundary; every Pure-Domain module is native-*reusable*.

## 23.2 Placement of TASK-007 Contract Content

**UX-23.1.** The *content* of every contract in this document (§10–§22's obligations, as text) is platform-invariant and belongs conceptually alongside the Pure Domain tier's reasoning, even though it is expressed in this document rather than in code — it is not itself code and does not need to "run" on any platform.

**UX-23.2.** The *realization* of every contract is platform-specific and belongs to the existing UI Presenters/Controllers tier — on Web, the files named in §4.3; on any future native, wearable, or voice platform, that platform's own realization, built to satisfy the same contract text.

## 23.3 Platform-Invariant Declaration

**UX-23.3.** The following contracts are declared platform-invariant (MUST hold unchanged across Web, native, wearable, and voice, once each platform exists): §9's state taxonomy; §10.1's Experience Contract template fields; §12's presentation-behavior rules stated in behavioral (not visual) terms; §19's structured-failure-grounding requirement; §14's silence/presence disambiguation. Contracts requiring a visual or interaction-modality realization (§11's exact interaction affordance, §21's specific assistive-technology mechanism) are platform-specific by nature and are not declared invariant beyond their semantic intent.

## 23.4 Explicit Out of Scope

Any native implementation detail, native framework choice, or native UI component design.

---

# 24. Architecture Boundaries and Ownership Matrix

**UX-24.1.** This matrix is the single reconciliation point for every ownership claim made elsewhere in this document; later chapters reference it rather than restating ownership reasoning independently.

| Component | Owns | Must obey | Must not own |
|---|---|---|---|
| Product Bible | Product vision, philosophy, backlog ordering, UX Principles (§8) | AI Constitution | Architecture, implementation, coaching doctrine detail |
| AI Constitution | Constitutional policy, Safety Layer/Health Layer/Constitutional Evaluation relationship (RCD-05) | — (rank 1) | Product scope, implementation |
| Intelligence & Relationship Philosophy | Relationship philosophy | AI Constitution, Product Bible | Architecture, implementation |
| Coach Bible | Coaching meaning, tone, communication doctrine, silence-as-communicative-choice (Ch.4, Ch.20) | AI Constitution, Product Bible | UX presentation mechanics, visual design, architecture |
| D1 | Decision policy (Eligibility, Prioritization, Silence Policy, Authority Boundaries) | AI Constitution, Product Bible, Coach Bible | Architecture, implementation, UX presentation |
| D2 | Orchestration (Stage ordering, Pipeline Invariants) | D1 | Decision content, UX presentation |
| D3 | Coach Decision System architecture (Decisions 1–6) | D1, D2 | Decision content, UX presentation, visual design |
| Decision Engine (TASK-006) | Stages 5/7/8/9, Terminal Decision formation | D1, D2, D3 | Candidate content, Safety judgment, delivery |
| Safety Layer (SL-001) | Disposition selection, `reasonCode`/`reasonDetail`, Decision-Level Modification | D1, D2, D3, RCD-01–15 | Communication, delivery, UX presentation |
| Expression (D3 §17, unbuilt) | Delivery Intent production (Decision 5) | D2, D3 | Platform selection, UX presentation, message content |
| Coach Runtime | Platform-specific presentation mapping (Decision 6, sole owner) | D3 | — (must satisfy TASK-007 obligations within this ownership) |
| Presenters (`js/ui/*`, `js/coach/coachPresenter.js`) | Screen/card rendering within their existing file boundary | This document's obligations, C1 module contracts | Domain logic, persistence, Safety/Decision authority |
| Controllers (`js/trigger/triggerController.js`, `js/adaptive/adaptiveTdeeController.js`) | Engine-adjacent presentation orchestration within their existing file boundary | This document's obligations, B2/B3/B4 contracts | Domain logic, persistence policy, Safety authority |
| Adapters (`js/adapters/*.js`) | Platform-specific I/O (auth, notification, image, barcode, network) | C1 native-migration boundary | UX presentation obligations (consumed, not owned) |
| **TASK-007 (this document)** | Cross-cutting Experience/Interaction/Presentation-Behavior contracts | Every row above | Coaching content, Safety policy, delivery platform selection, visual design, Engine Registry/StateAccess/Persistence contracts |
| TASK-008 | Design tokens, typography, spacing, iconography, motion, themes, reusable visual components | This document's behavioral obligations (as a rendering target) | Presentation behavior, experience obligations, coaching content |

---

# 25. Existing-System Baseline and Migration

## 25.1 Discipline

**UX-25.1.** No current implementation detail is canonical merely because it exists. This document requires an explicit retained/normalized/changed classification for every baseline behavior it touches, matching the "Zero intended product-behaviour change" discipline C1's own modularization used as its default posture.

## 25.2 Classification of Verified Current Behavior

| Current behavior | Verified evidence | Classification under this SPEC |
|---|---|---|
| Duplicated empty-state Hebrew strings (Home, Food, Favorites) | `index.html:284,368,371`; `js/ui/homePresenter.js`; `js/ui/foodScreenPresenter.js` | **Normalized** — must satisfy §9 UXS-06 consistently; current duplication is not itself canonical and MAY be consolidated at implementation time without changing the user-visible text's meaning. |
| Generic `alert()` for all failure/success feedback | `js/app.js`, `js/adaptive/adaptiveTdeeController.js`, `js/nutrition/*` | **Requires change** — does not satisfy §19.1/§19.2's structured-grounding obligation as currently implemented. |
| Four uncoordinated Home-screen coach-originated cards | `index.html:194-221` | **Requires change** — does not satisfy §12.6's determinism obligation as currently implemented (no defined precedence exists today). |
| C2 dismiss gesture on Trigger card; Adaptive accept/dismiss | `js/trigger/triggerController.js`; `js/adaptive/adaptiveTdeeController.js` | **Retained** — already satisfies §11's interaction-vocabulary/C2-reconciliation obligation as-is. |
| REM-002 session-generation guard pattern | `js/coach/coachPresenter.js`, `js/adaptive/adaptiveTdeeController.js`, `js/trigger/triggerController.js` | **Retained** — already satisfies §8.3's obligation as-is; adopted as binding, not merely incidental. |
| Single `aria-label` accessibility baseline | `index.html` | **Requires change** — does not satisfy §21's obligations. |
| No offline-detection mechanism | Repository-wide search, `js/` | **Requires new implementation** — no current behavior to classify; a Repository Gap (§9 UXS-12). |

## 25.3 Migration Sequencing and Backward Compatibility

**UX-25.2.** No migration under this document may change the meaning of existing, durable, already-persisted data. **UX-25.3.** No migration may silently change a currently-correct user-visible behavior without that change being traceable to a specific obligation in §7–§23 above (no-silent-behavior-change requirement).

---

# 26. Repository Impact

## 26.1 Likely Affected Documents

This SPEC itself (`docs/specs/TASK_007_SPEC_v1.0.md`); `docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md` at closure only (§31); `docs/architecture/FITME_ARCHITECTURE_v1.md` only as a factual current-state synchronization (noting its own currently-stale SL-001 section as a pre-existing, unrelated synchronization item this document does not create or expand).

## 26.2 Likely Affected Implementation Tiers

`js/ui/*` (all six current modules); `js/coach/coachPresenter.js`; `js/trigger/triggerController.js`; `js/adaptive/adaptiveTdeeController.js`; `css/app.css` only to the extent a behavioral obligation (e.g., `aria-live`, focus handling) requires markup/attribute changes that happen to live in a stylesheet-adjacent file — no color/token/spacing change is authorized by this document.

## 26.3 Tests, Versioning, Documentation

Tests: extensions to the existing `*.test.js` suites named in §27. Versioning: `APP_VERSION`/`sw.js` `VERSION` advance only if implementation changes shipped, user-visible behavior — consistent with every prior task's practice. Documentation: per §31.

## 26.4 Explicit No-Touch Areas

`js/coachDecisionSystem/*` (all files); `js/engineRegistry.js`; `js/stateAccess.js`; `js/persistenceGateway.js`; `firestore.rules`; any Product Bible, Coach Bible, AI Constitution, or D1/D2/D3 content.

## 26.5 Follow-Up Work Explicitly Out of Scope

TASK-008 (Design System); Expression's own future work item (unnamed, per §4.5); any offline-detection mechanism's concrete implementation (§20, Repository Gap only recorded here).

**Prohibition honored:** no exact file list beyond the tiers already named above is finalized here; exact files/symbols are Engineering's to derive from direct repository inspection at implementation time, per §26.2's tier-level (not file-level) statement.

---

# 27. Verification and Test Strategy

## 27.1 Grounding

Documented invocation: `node --test` (`docs/specs/C1_SPEC_v1.0.md:507`; re-confirmed this pass at **1374 passed / 0 failed**). The existing dual `window.X`/`module.exports` export convention already used by every `js/ui/*`, `js/coach/*`, `js/trigger/*`, `js/adaptive/*` module is what makes unit-level presentation testing possible today, and is preserved unchanged.

## 27.2 Test Categories

| Category | Grounding | Status at this baseline |
|---|---|---|
| Contract tests (an Experience/Interaction/Presentation-Behavior Contract is satisfied) | New, to extend existing presenter/controller test files | To be authored at implementation time |
| Presenter/controller tests | Existing pattern: `homePresenter.test.js`, `foodScreenPresenter.test.js`, `profilePresenter.test.js`, `settingsPresenter.test.js`, `navigationController.test.js`, `dayNavigationController.test.js`, `coachPresenter.test.js`, `triggerController.test.js`, `adaptiveTdeeController.test.js` | Existing; to be extended |
| State-to-UX tests (§9 taxonomy → actual consumer) | New | Repository Gap for most states (§9.1) |
| Accessibility tests | No existing infrastructure located | Repository Gap — Engineering Decision Pending: tool selection |
| RTL tests | No existing infrastructure located | Repository Gap |
| Offline tests | No existing infrastructure located | Repository Gap |
| Lifecycle/stale-session tests | Existing pattern: `sessionLifecycle.test.js`, `authSessionController.test.js`, `bootstrapController.test.js` | Existing; to be extended |
| Integration tests | Existing `*Wiring.test.js` pattern (e.g., `coachDecisionSystemWiring.test.js`) | Existing pattern available; new wiring tests to be authored |
| Browser/end-to-end evidence | No browser-automation infrastructure found in the repository | Repository Gap |
| Visual-regression boundary with TASK-008 | N/A | TASK-007 defines behavioral test expectations only; visual-regression tooling, if any, is TASK-008's |

## 27.3 Explicit Out of Scope

Selection of a specific accessibility-testing or browser-automation tool/library is an **Engineering Decision Pending**, not a Product/Architecture decision, unless repository evidence later shows one already adopted (none was found this pass).

## 27.4 Accessibility/RTL Evidence Expectations

At minimum, implementation MUST produce: a repository-wide `aria-label`/`alt`/`aria-live` audit comparable to this document's own §21.1 baseline audit, re-run and improved; confirmation that `dir="rtl"` renders correctly for every new/changed surface.

---

# 28. Acceptance Criteria

## 28.1 Product

- AC-P1. Every one of the ten Mandatory Product Principles is traceable to at least one concrete obligation in §7–§23 (verified via §30's Traceability Matrix).
- AC-P2. No obligation in this document optimizes for engagement, notification frequency, conversation count, or time-in-app (verified by absence of any such metric anywhere in §7–§23).

## 28.2 Architecture

- AC-A1. No new Runtime, Engine, delivery surface, or top-level architectural component appears anywhere in this document (verified by §24's Ownership Matrix containing no such row).
- AC-A2. D3 Decision 5 and Decision 6 are cited and preserved unmodified wherever this document touches delivery-adjacent territory (§12.1, §13.3, §15.2).

## 28.3 UX-Contract

- AC-U1. Every Experience Contract instance authored under §10.1's template at implementation time contains all ten required fields.
- AC-U2. Every state referenced anywhere in this document is one of §9.1's eighteen closed states.

## 28.4 Accessibility

- AC-Y1. Every interactive control in every surface touched by implementation has a programmatically-determinable accessible name.
- AC-Y2. Every dynamically-injected surface touched by implementation is announced via an assistive-technology-appropriate mechanism.

## 28.5 Platform-Compatibility

- AC-C1. Every contract declared platform-invariant in §23.3 is expressed in this document without reference to any Web-specific DOM API.

## 28.6 Engineering

- AC-E1. Full regression suite (`node --test`) passes with zero failures at implementation closure, at or above the 1374-baseline count.
- AC-E2. No file listed in §26.4 (Explicit No-Touch Areas) is modified.

## 28.7 Documentation

- AC-D1. `docs/roadmap/Roadmap.md` and `docs/roadmap/Changelog.md` carry a TASK-007 closure entry per §31.

## 28.8 No-Regression

- AC-N1. Every currently-passing test at the pre-implementation baseline continues to pass unmodified, or is modified only where §25's migration classification explicitly authorizes a behavior change.

---

# 29. Engineering Readiness Review

## 29.1 Blocker Standard

A matter blocks READY only when all four conditions are satisfied: (1) exact repository or canonical evidence exists; (2) it has material Product, Architecture, or canonical impact; (3) it cannot be resolved through normal specification authoring or a bounded Engineering Decision; (4) continuing would likely produce an incorrect or contradictory specification or implementation.

## 29.2 Evidence Requirements

READY requires: every §28 acceptance criterion is objectively checkable against repository evidence; every Repository Gap recorded in §7–§23 is either closed or explicitly accepted as non-blocking with a named future owner; §30's Traceability Matrix is complete; §24's Ownership Matrix is complete.

## 29.3 Unresolved Decision Handling

No Product Decision Pending or Architecture Decision Pending item recorded anywhere in this document (§7.2.4, §8.5, §11.3, §16.5, §18.2, §18.3, §21.7, §22.3, §14.2) may be silently waived to reach READY; each MUST be either explicitly resolved by the Head of Product/AI Architect before READY, or explicitly and individually accepted as non-blocking by them, with that acceptance recorded in this document's revision history.

## 29.4 Verdict Mechanism and Prohibition

READY / NOT READY is declared only by the Head of Product and AI Architect, communicated directly, never self-certified by Engineering (matching the discipline every closed task in this repository has used). Implementation of TASK-007 is prohibited before READY, per Engineering Workflow §6.

---

# 30. Traceability Matrix

| Canonical source | Inherited principle/contract | TASK-007 section | Implementation owner | Verification evidence | Acceptance criterion |
|---|---|---|---|---|---|
| Mandatory Product Principle 1 (Relationship before isolated interaction) | Approved direction | §7, §12.6 | Coach Runtime, all Presenters | §27 contract tests | AC-P1 |
| Mandatory Product Principle 2 (Trust before engagement) | Approved direction | §2.3, §12.2 | All Presenters | §27 | AC-P2 |
| Mandatory Product Principle 3 (Understanding before intervention) | Approved direction | §10.2, §17.2 | Domain Presenters | §27 | AC-P1 |
| Mandatory Product Principle 4 (Early collaboration, mature restraint) | Approved direction | §7.2.1–§7.2.2 | Onboarding handlers | §27 | AC-P1 |
| Mandatory Product Principle 5 (Memory as continuity) | Approved direction | §7.2.3, §8.6 | Home/Profile Presenters | §27 | AC-P1 |
| Mandatory Product Principle 6 (Silence may be correct; disappearance is not) | Approved direction | §14 | Coach Runtime | §27 | AC-P1 |
| Mandatory Product Principle 7 (Respect is invariant) | Approved direction | §7.2.5, §7.2.7 | Adaptive/Trigger Controllers | §27 | AC-P1 |
| Mandatory Product Principle 8 (Effort decreases as understanding improves) | Approved direction | §7.2.8, §8.6, §17 | All Presenters | §27 | AC-P1 |
| Mandatory Product Principle 9 (Platform independence) | Approved direction | §23 | All Presenters/future native | §27 | AC-C1 |
| Mandatory Product Principle 10 (Independence is the destination) | Approved direction | §7.2.8 | Profile Presenter | §27 | AC-P1 |
| D3 Decision 5 | Expression: Delivery Intent only | §13.3, §15.2 | Expression (unbuilt) | Ch.13/§15 citations | AC-A2 |
| D3 Decision 6 | Coach Runtime: sole platform-mapping owner | §12.1, §13.3 | Coach Runtime | Ch.12/§13 citations | AC-A2 |
| Coach Bible Ch.4/Ch.20 | Coaching communication doctrine | §13 | N/A (inherited, unchanged) | §13.1 citation | AC-P1 |
| C2 (`FEEDBACK_TYPES`) | Closed feedback-type catalogue | §11.2, §16.3 | Trigger/Adaptive Controllers | `feedbackDomain.test.js` | AC-U1 |
| REM-002 (`sessionLifecycle`) | Session-generation guard | §8.3, §12.7 | Coach/Trigger/Adaptive Controllers | `sessionLifecycle.test.js` | AC-E1 |
| B4 Persistence Gateway | Structured `{status, error}` contract | §19 | All Controllers | `persistenceGateway.test.js` | AC-N1 |
| SL-001 | Five Safety dispositions | §15 | Coach Runtime (via Expression, unbuilt) | `safetyLayer.test.js` | AC-A2 |
| C1 §27 | Native Migration Contract | §23 | Presenters/Controllers | `docs/specs/C1_SPEC_v1.0.md` §27 | AC-C1 |

---

# 31. Documentation and Closure Requirements

## 31.1 Required Document Updates at Closure

This document's own status header (Draft → ... → DONE/CLOSED); `docs/roadmap/Roadmap.md` (new TASK-007 entry, matching the format of every prior closed task); `docs/roadmap/Changelog.md` (closure entry, matching the SL-001 Closure Record template); `docs/architecture/FITME_ARCHITECTURE_v1.md` only as a factual current-state synchronization, never as an architecture change.

## 31.2 SPEC Status Transitions

Draft → Canonical Review → Engineering Review → READY → In Implementation → Implemented → DONE / CLOSED, each requiring the evidence named in §29.

## 31.3 Approval Records

Product Approval and Architecture Approval MUST be communicated directly by the Head of Product and AI Architect, never self-certified by Engineering — matching `docs/specs/SL-001_SPEC_v1.0.md` §36's own disclosure discipline.

## 31.4 Closure Record

Written at actual task closure (2026-08-06), per Approvals below.

- **Final status**: DONE / CLOSED.
- **Implementation summary**: ten Work Packages, per the approved Implementation Plan (`docs/specs/TASK_007_IMPLEMENTATION_PLAN.md`). WP1–WP3: static accessibility baseline (`aria-live`, `aria-label`, `<label for>`, `prefers-reduced-motion`) across onboarding, Home, Settings, Food, and Workout controls (`index.html`, `css/app.css`, `js/ui/foodScreenPresenter.js`). WP4: keyboard operability for click-only controls and deterministic focus management on the barcode overlay (`index.html`, `js/nutrition/barcodeFlowController.js`). WP5: deterministic Home-card sequencing and a Dismiss affordance added to `#coach-card` (`js/coach/coachPresenter.js`). WP6–WP7: structured failure/success presentation (§19) replacing generic `alert()` calls, differentiated by the Persistence Gateway's actual `status`/`error.code`/`error.retryable` fields, across the Adaptive/Settings domain (`js/adaptive/adaptiveTdeeController.js`, `js/ui/dayNavigationController.js`, `js/memory.js`) and the Nutrition domain (`js/nutrition/mealCommitService.js`, `quickLogService.js`); required an additive, Product/Architecture-approved prerequisite exporting `classifyError` from `js/persistenceGateway.js` and returning structured `{status, error}` from `saveProfile()`/`saveTodayData()` in `js/app.js` (see the exception recorded below). WP8: return-after-absence continuity signal, UX-7.5/UX-14.1a (`js/ui/homePresenter.js`), realized from the existing day-history data source with no new Persistence field. WP9: cross-cutting audit of every remaining normative rule (§7 remainder, §8, §11, §12 remainder, §16.4, §17.4, §18, §22), finding and fixing two genuine, narrow gaps — two un-mirrored RTL disclosure chevrons (UX-22.4, `js/app.js`, `js/memory.js`) and one cross-surface context-handoff gap (UX-8.6, `js/adaptive/adaptiveTdeeController.js`'s "Complete" button now scopes the Food screen to the originating day via a `DayNavigationController.dayNavToDate(key)` method added to that module's own already-`window`-exposed API object — deliberately not a new `window.*` facade in `js/app.js`, preserving the C1-characterized window-assignment inventory unchanged, per a dedicated Engineering Options Analysis and Product/Architecture-approved Option C). WP10 (this entry): documentation and closure only — no Product, Architecture, Runtime, or Persistence change.
- **SPEC obligations realized**: every normative rule in §7–§23 assigned to a Work Package (§2 of the Implementation Plan) is implemented or confirmed already-satisfied by existing behavior; every chapter assigned "no dedicated Work Package" (§1 of the Implementation Plan) is confirmed definitional/reference/forward-looking, not a build requirement. The Open Decision Register (Appendix E, OD-1 through OD-15) is unchanged by this closure — every item there was already correctly classified non-blocking under §29.1's Blocker Standard during authoring, and nothing discovered during WP1–WP9 implementation altered that classification.
- **Tests and results**: WP1–WP9 added or extended 12 test files (+930/-21 lines), for 97 net new/changed tests over the pre-TASK-007 baseline; full suite **1471/1471 passing** (from the SL-001/pre-TASK-007 baseline of 1374/1374 — AC-E1 satisfied with margin). Re-verified at closure.
- **Approvals**: each of WP1 through WP9 individually received Product Review: APPROVED and Architecture Review: APPROVED, communicated directly by the Head of Product and AI Architect before its own commit — see §1.1's closure revision-history row for how this satisfies §29.4/§31.3's direct, non-self-certified authorization requirement despite no single, separately-recorded upfront READY event existing in this document's own text. WP10 (this closure) itself awaits Product Review and Architecture Review before any commit is made.
- **Documentation updates**: this specification (status header, §1 Document Control, §1.1 Revision History, this Closure Record); `docs/roadmap/Roadmap.md` (TASK-007 entry, matching the C1/TASK-004–006/SL-001 closed-task format); `docs/roadmap/Changelog.md` (closure entry, matching the SL-001 Closure Record template). `docs/architecture/FITME_ARCHITECTURE_v1.md` was reviewed per §31.1 and found to require no update: it contains no reference to TASK-007 anywhere, and its existing Presenter/Controller/Application-Service layer diagram and file inventory already list every file WP1–WP9 touched, unchanged in layer or role — WP1–WP9 changed behavior within already-documented modules, never their architectural placement.
- **Commit hash**: the single commit introducing this Closure Record (this file cannot self-reference its own resulting hash — see `git log -1 -- docs/specs/TASK_007_SPEC_v1.0.md` after this commit, following the same disclosure TASK-004/005/006/SL-001's own Closure Records used).
- **Branch and push status**: committed directly to `main` and pushed to `origin/main`, matching this task's own established WP1–WP9 practice throughout (no dedicated feature branch was used for this task); see the calling turn's report for exact confirmation.
- **Remaining non-blocking follow-ups** (tracked, not decided or scheduled here; none expand this task's own scope):
  - The complete Open Decision Register, unchanged: OD-1 (mature-relationship-stage experience, Repository Gap), OD-2 (return-after-absence threshold/mechanism, Repository Gap — the threshold itself, 4 days, was an Engineering Decision Pending resolved during WP8; the underlying obligation is now implemented), OD-3 (context retention across screen switches, Product Decision Pending), OD-4 (Postpone/Decline-to-answer C2 catalogue extension, Product Decision Pending), OD-5 (Home-card total precedence order beyond severity-signal cases, Product Decision Pending — WP5 satisfied UX-12.6's determinism requirement without resolving this residual ordering question), OD-6 (communicative-silence minimal-signal question, single-instance case, Product Decision Pending), OD-7 (learning-loop visibility for suppression, Product Decision Pending), OD-8 (Settings navbar discoverability, Product Decision Pending), OD-9 (deep-linking support, Architecture Decision Pending), OD-10 (`user-scalable=no` vs. text-scaling, Product Decision Pending), OD-11a/OD-11b (numeric contrast-ratio requirement, Product/Architecture Decision Pending), OD-12 (future non-Hebrew locale, Product Decision Pending), OD-13 (offline-detection mechanism, Repository Gap), OD-14 (validation-failure UI consumer, Repository Gap — investigated and confirmed already correctly wired during WP7's investigation gate), OD-15 (Postpone recurrence timing, Engineering Decision Pending).
  - **New, this closure** — item (1): `js/persistenceGateway.js` was additively modified during WP6 (adds `classifyError: classifyRepositoryError` to its exported API; no `OPERATIONS` catalog entry, request/response contract, or existing export changed) under an explicit Product/Architecture-approved prerequisite at the time. This is nonetheless a literal exception to §26.4's Explicit No-Touch listing of that exact file and to AC-E2 ("No file listed in §26.4 is modified") as those provisions are worded — worded without a carve-out for additive, backward-compatible changes. Assessed against §29.1's Blocker Standard: repository evidence exists (`git show 77ee4d7 -- js/persistenceGateway.js`); it has Architecture-adjacent impact (the file is explicitly enumerated as no-touch) but the change itself is additive-only, already reviewed, and does not alter B4's mandatory semantics (closed catalog, validation, normalized result, bounded retry — per `B4_SPEC.md` Appendix B, "the physical API MAY differ"); it was not resolved through this document's own authoring process (§26.4 predates the change) but was resolved through a real, recorded Engineering-to-Product/Architecture escalation at the time. Condition 4 (would continuing likely produce an incorrect specification or implementation) is not met — the change is correct and already relied upon by 20 passing tests. Not blocking under §29.1; recorded here rather than silently omitted, per §29.3's discipline, for explicit Product/Architecture acknowledgment.
  - **New, this closure** — item (2): `APP_VERSION`/`sw.js` `VERSION` remained at `2.41.0` throughout WP1–WP9, unchanged since C2 (pre-TASK-007). §26.3 states versioning should "advance only if implementation changes shipped, user-visible behavior" — WP1–WP9 manifestly did (keyboard operability, Home-card dismiss affordances, structured failure messages replacing silent/generic alerts, a new continuity signal, corrected RTL icons, day-scoped navigation), unlike TASK-004/005/006/SL-001 (Composite Engine/Safety Layer work with no shipped user-facing surface, correctly left unbumped). This reads as a genuine deviation from §26.3's own conditional and from C1's own precedent (`APP_VERSION` advanced every Work Package, 2.25.0 → 2.40.0). Not corrected in this WP10 closure pass: a version bump changes `sw.js`'s `CACHE = 'fitme-' + VERSION` constant, which has a real, live effect (forces a service-worker cache invalidation for every existing user) — a Runtime-adjacent consequence outside WP10's own explicit "Documentation & Closure package only... do not introduce Runtime changes" scope. Recorded here for explicit Product/Architecture disposition rather than decided unilaterally by Engineering.
- **Lessons learned**: the WP2 Food/Workout coverage gap (resolved via an Implementation Plan correction inserting WP3, Product/Architecture-approved) and the WP6 `saveProfile()`/`saveTodayData()` silent-failure blocker (resolved via an approved additive prerequisite) both showed that a narrowly-scoped Work Package can surface a dependency its own text didn't anticipate — in both cases, escalating with cited evidence rather than silently expanding or silently deferring scope let Product/Architecture make the actual call. This closure surfaced two further, smaller instances of the same pattern (the two "New, this closure" items above) at the verification stage rather than the implementation stage — the same discipline applied one step later in the lifecycle, which is exactly what a closure-stage repository-consistency check exists to catch.

This is Engineering Self-Review only, distinct from, and not a substitute for, Product Review and Architecture Review, which are made by the Head of Product and AI Architect at actual closure, per §29.4/§31.3.

---

# 32. Appendices

## Appendix A — Vocabulary

See §5 (complete closed glossary).

## Appendix B — State Inventory

See §9.1 (complete closed taxonomy with producer/consumer status).

## Appendix C — Interaction Inventory

See §11.1–§11.2 (complete closed vocabulary with C2 mapping).

## Appendix D — Ownership Matrix

See §24 (complete matrix; not duplicated here).

## Appendix E — Open Decision Register

| ID | Item | Classification | Section | Blocking? |
|---|---|---|---|---|
| OD-1 | Mature-relationship-stage distinct experience | Repository Gap | §7.2.4 | No |
| OD-2 | Return-after-absence threshold/mechanism | Repository Gap | §7.2.6 | No |
| OD-3 | Context retention across screen switches | Product Decision Pending | §8.5, §18.4 | No |
| OD-4 | Postpone/Decline-to-answer C2 catalogue extension | Product Decision Pending | §11.3 | No |
| OD-5 | Home-card total precedence order (residual, beyond severity-signal cases) | Product Decision Pending | §12.2 (Sequencing) | No |
| OD-6 | Communicative-silence minimal-signal question (single-instance case only; prolonged-absence case resolved by UX-14.1a) | Product Decision Pending | §14.2 | No |
| OD-7 | Learning-loop visibility for suppression | Product Decision Pending | §16.5 | No |
| OD-8 | Settings navbar discoverability | Product Decision Pending | §18.2 | No |
| OD-9 | Deep-linking support | Architecture Decision Pending | §18.3 | No |
| OD-10 | `user-scalable=no` vs. text-scaling obligation | Product Decision Pending | §21.7 | No |
| OD-11a | Numeric contrast-ratio requirement — UX-quality bar | Product Decision Pending | §21.3 | No |
| OD-11b | Numeric contrast-ratio requirement — technical feasibility/enforceability | Architecture Decision Pending | §21.3 | No |
| OD-12 | Future non-Hebrew locale anticipation | Product Decision Pending | §22.3 | No |
| OD-13 | Offline-detection mechanism (no current producer) | Repository Gap | §9.1 UXS-12, §20 | No |
| OD-14 | Validation-failure UI consumer (not fully traced) | Repository Gap | §9.1 UXS-09 | No |
| OD-15 | Postpone recurrence timing (re-shown next session? next day? never automatically?) | Engineering Decision Pending | §11.3 | No |

No item in this register satisfies all four conditions in §29.1; none blocks completion of this document.

## Appendix F — Evidence Index

All repository files cited in this document: `index.html`; `manifest.json`; `sw.js`; `css/app.css`; `js/app.js`; `js/app/authSessionController.js`; `js/app/bootstrapController.js`; `js/ui/homePresenter.js`; `js/ui/navigationController.js`; `js/ui/profilePresenter.js`; `js/ui/settingsPresenter.js`; `js/ui/foodScreenPresenter.js`; `js/ui/dayNavigationController.js`; `js/coach/coachPresenter.js`; `js/trigger/triggerController.js`; `js/trigger/triggerDomain.js`; `js/adaptive/adaptiveTdeeController.js`; `js/feedback/feedbackDomain.js`; `js/persistenceGateway.js`; `js/nutritionValidator.js`; `js/coachDecisionSystem/safetyLayer.js`; `js/coachDecisionSystem/decisionFormation.js`; `js/coachDecisionSystem/safetyIntegrationPort.js`; `docs/product/Product_Bible.md.docx`; `docs/governance/FITME_Coach_Bible.md`; `docs/specs/D1_SPEC_v1.0.md`, `D2_SPEC_v1.0.md`, `D3_SPEC.md`; `docs/specs/TASK_005_SPEC_v1.0.md`, `TASK_006_SPEC_v1.0.md`; `docs/specs/SL-001_SPEC_v1.0.md`; `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`; `docs/architecture/FITME_ARCHITECTURE_v1.md`; `docs/specs/C1_SPEC_v1.0.md`.

## Appendix G — Revision History

See §1.1.

---

# End of Specification (v1.0, DONE / CLOSED — 2026-08-06)
