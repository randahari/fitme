
# FITME — DIRECT USER COACH ADMISSION V1 (DUC-001) — CANONICAL DECISION PACKAGE
## v1.0 — CANONICAL / APPROVED — PRE-IMPLEMENTATION (Product/Architecture Final Review Complete; No Implementation Performed)

> **Document role:** Canonical Decision Package. Freezes Product/Architecture intent for the Direct User Coach Admission foundation. Does **not** author an implementation SPEC, does **not** authorize implementation, and does **not** modify any existing closed canonical document. Mirrors the established Decision-Package precedent set by `docs/governance/FITME_Training_Readiness_And_Recovery_V1_Canonical_Decision_Package_v1.0.md` (TDP) and `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` (CARF).
> **Prepared by:** Lead Engineer / Repository Analyst / Repository Maintainer, recording decisions approved by the Head of Product + AI Architect without reinterpretation, following the completed read-only `Direct User → Coach Canonical Investigation`.
> **Status:** **CANONICAL / APPROVED — PRE-IMPLEMENTATION.** Product/Architecture Final Review is complete; all 22 original decisions plus Revision 2's three resolving decisions (Ch.10a, Ch.17a, Ch.27a) are approved in substance. **No implementation exists.** This document does not itself authorize implementation, does not select final field-level schemas, and is explicitly NOT marked IMPLEMENTED, VERIFIED, or CLOSED — those statuses are reserved for the implementing SPEC once DUC-001 is actually built (mirroring TDP's and CARF's own pre-implementation terminal status relative to TRR-001's later, separate IMPLEMENTED/VERIFIED/CLOSED status). **No unresolved Product/Architecture decision blocks SPEC authoring.** The next authorized step is authoring DUC-001's own implementation SPEC — citing this Package, D1, D3, CARF, EUR-001, and TRR-001 — mirroring exactly how TRR-001's SPEC followed TDP's closure.

## Document-Wide Abbreviations

| Abbreviation | Document | Path | Status |
|---|---|---|---|
| D1 | Coach Intelligence Translation Model | `docs/specs/D1_SPEC_v1.0.md` | CLOSED |
| D3 | (Architecture decisions governing ownership boundaries, cited throughout the Coach Decision System) | `docs/coachDecisionSystem/*` header citations | CLOSED |
| CARF | Context-Aware AI Reasoning Foundation Canonical Design v1.0 | `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` | CANONICAL / CLOSED |
| EUR-001 | Explicit User Request V1 | `docs/specs/EUR_001_SPEC_v1.0.md` | IMPLEMENTED / VERIFIED / CLOSED |
| TRR-001 | Training Readiness & Recovery Spec v1.0 | `docs/specs/TRR_001_SPEC_v1.0.md` | IMPLEMENTED / VERIFIED / CLOSED |
| TDP | Training Readiness & Recovery V1 Canonical Decision Package v1.0 | `docs/governance/FITME_Training_Readiness_And_Recovery_V1_Canonical_Decision_Package_v1.0.md` | CANONICAL / CLOSED |
| RGEF | Relationship-Guided Engagement Foundation Spec v1.0 | `docs/specs/RGEF_SPEC_v1.0.md` | IMPLEMENTED / VERIFIED / CLOSED |
| SL-001 | Safety Layer Spec v1.0 | `docs/specs/SL-001_SPEC_v1.0.md` | IMPLEMENTED / VERIFIED / CLOSED |
| DUC-Inv | Direct User → Coach Canonical Investigation (this conversation, read-only, non-canonical) | — | Investigation, not a canonical document |

Citation format: `[FILE:LINE]`, verbatim against the repository at HEAD `f247e1f6be109c09b27f3e4621c1759c92247f44`.

---

# 01. Status

**CANONICAL / APPROVED — PRE-IMPLEMENTATION.** This Package converts the direction Product/Architecture fixed following DUC-Inv into a frozen, citable contract, exactly as TDP once did for Training Readiness & Recovery before TRR-001's own implementation SPEC was authored. **Revision 2** (Ch.10a, Ch.17a, Ch.27a) resolved all three previously-open Product/Architecture questions (Ch.31). **Product/Architecture Final Review of this Package is now complete and has approved it in substance** — mirroring TDP's own `§15`/`§16` closure discipline and CARF's own two-pass Final Review history. This Package remains a Decision Package, not an implementation SPEC: it authorizes SPEC authoring, not implementation.

---

# 02. Purpose

Establish the canonical, **domain-agnostic** foundation through which a direct user conversational turn may enter FITME's governed Coach Decision System, and freeze the architectural boundary between that domain-agnostic admission capability and the domain-specific professional capabilities (Training Readiness & Recovery today; Nutrition, habits, goals, progress, and others in the future) that may eventually handle the resulting Need. This Package answers **how FITME receives and canonically understands that the user has said something to the Coach now** — it does not answer, and must not be read as answering, **which professional vertical always handles the message**.

---

# 03. Background

Following DUC-Inv (this conversation's own read-only investigation), Product/Architecture confirmed:
- No production surface today treats free user text as causal (`DUC-Inv §B`).
- D1's own closed, five-member Opportunity Source enumeration explicitly declines to treat a direct user statement as an independent source, while explicitly naming it as high-authority evidentiary support toward one of the five (`[D1_SPEC_v1.0.md:470-477]`).
- EUR-001 is, and remains, exclusively a suppression/consent mechanism, never a request-for-action mechanism (`[explicitRequestInterpreter.js:52-56]`).
- CARF's own reasoning contract, invocation shape, and Safety/Expression boundary are already vertical-agnostic and fully reusable without modification (`[FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md]` Ch.06-14).
- TRR-001 is the repository's first, and to date only, live professional reasoning vertical, and is now production-reachable (TRR Production Reachability Correction, commit `f247e1f`).

This Package exists to convert those findings into one frozen Product/Architecture contract, so that DUC-001's own implementation SPEC inherits a stable foundation rather than re-deriving or re-arguing it — the same purpose TDP served for TRR-001.

---

# 04. Product Vision — FROZEN, NON-NEGOTIABLE

FITME is one coherent personal AI coach the user can speak to naturally, not a collection of narrow feature-specific chat interfaces. The user must never need to know which internal FITME subsystem, Product Reason, reasoning vertical, deterministic capability, or engine answers them. **The Direct User Coach Admission layer MUST be domain-agnostic.** It must not be designed as, or later require replacement because it was secretly, any of: a TRR input mechanism; a training chat; an `ADAPT_TO_CURRENT_STATE` input form; a shortcut into `TrainingReadinessReasoningComponent`; or any other vertical-specific architecture. **Milestone sequencing may be narrow. Shared architecture must not be.**

---

# 05. Scope

## DUC-001 Defines
- The **Current User Turn** Decision Input concept (Ch.06).
- The domain-agnostic **admission and bounded structural understanding** of that turn (Ch.09).
- The **Affirmative Direct Request** concept, distinct from EUR-001's negative/suppression authority (Ch.10-11), and its explicit boundary against a desire/preference-only statement (Ch.10a).
- A new Stage-3 Source, `DIRECT_USER_REQUEST` (Ch.12), and a new Stage-3 contributor concept, the **Conversational Need Creator** (Ch.13).
- The **on-demand Decision Pass** trigger concept, `USER_MESSAGE_SUBMITTED` (Ch.16), **turn correlation** (Ch.17), and **clarification as a first-class, governed conversational outcome** across a new, correlated turn (Ch.17a).
- The **provenance separation** between current-turn evidence and durable memory (Ch.18).
- The **first Dogfood implementation slice** (TRR-only) and the reuse contract for it (Ch.19-20).
- The **professional-capability-resolution** boundary, including honest "understood but unsupported" outcomes (Ch.10, Ch.23).
- The conceptual shape of **one shared, domain-agnostic Coach Conversation Surface** (Ch.27a) — not its visual design.

## DUC-001 Does NOT Define
- Which professional vertical always handles a given message (downstream, per-capability determination).
- The final structured-output schema for turn understanding, `turnId`/clarification-correlation schema, or any other field-level shape (delegated to the implementing SPEC, `Ch.32`).
- The visual design of the Coach Conversation Surface (its conceptual shape is fixed, `Ch.27a`; its design is not, and is not this Package's concern).
- Nutrition, habit, goal, progress, or any other future professional capability's own reasoning contract.
- A generalized Reasoning Vertical Router (explicitly deferred, `Ch.22`).
- Preference V1 (remains paused, unaffected, and not silently reachable via a desire-only statement, `Ch.10a`).

---

# 06. Decision 1 — Current User Turn

A new canonical Decision Input concept is authorized: **Current User Turn**. Properties: current-turn; causal; transient by default; domain-agnostic; associated with exactly one originating conversational interaction; distinct from durable `user_stated` Typed Memory; capable of containing multiple, independent semantic elements (a single turn is not assumed to be one semantic type). Examples given and preserved verbatim as illustrative, non-exhaustive: a sleep statement + a training judgment request; a nutrition question + a bounded factual/computational request; a negative control statement with no accompanying request for an immediate answer. **The Admission layer must not assume all turns share one semantic shape.**

---

# 07. Decision 2 — D1 Decision Input Extension

DUC-001 is authorized as a **narrow Task-level extension** to D1's Decision Input contract (D1 Unit 03, `[D1_SPEC_v1.0.md:303-358]`). **D1 remains CLOSED and is not rewritten or reopened by this Package.** The Memory Layer remains the exclusive owner of Decision Input reads and bounded Pipeline Context assembly — the same D3 boundary already governing every existing collaborator (`memoryLayer.js`'s own header, reused verbatim: *"No component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context"*). Consequences, frozen:

- UI text SHALL NOT be read ad hoc by downstream engines.
- The Current User Turn SHALL enter through the canonical Decision-Pass boundary and become available only through bounded Memory Layer / Pipeline Context projection — the same discipline already governing every existing bounded interpreter's output (`readinessStateContext`, `userSafetyContext`, `explicitRequestControls`, etc.).
- No Reasoning component may directly read the chat UI.
- No downstream professional capability may independently invent its own raw-message intake path — this is the same discipline CARF Ch.17 Non-Goal #8 already establishes against Legacy-Coach-style unvalidated free generation, extended here to intake as well as output.

---

# 08. Decision 3 — Current-Turn Causality ≠ Memory

Product/Architecture explicitly separates **current-turn causality** from **persistent memory**. A message may be actionable now without being stored permanently. `"אני עייף היום, מה כדאי לעשות?"` illustrates the distinction the architecture must preserve: the fact ("אני עייף היום") may serve as current-turn evidence for this Decision Pass, while the request ("מה כדאי לעשות?") is recognized as requiring a current response — **neither requires the raw message to first become durable Typed Memory.** DUC-001 does **not** authorize automatic persistence of all conversation. Persistence policy remains a separate Memory concern, governed by whatever future selective-persistence decision Product/Architecture may make — this architecture must not preclude that future decision, and must not couple it to current-turn response generation.

---

# 09. Decision 4 — Domain-Agnostic Turn Understanding

DUC-001 requires bounded structured interpretation of a Current User Turn, whose purpose is **not** to answer the user but to identify the semantic roles present sufficiently for FITME to decide what should happen next. A single turn may combine roles such as: current-state statement; affirmative request/question; negative control/suppression; goal-related information; preference/desire information; contextual information; and other future bounded roles not enumerated here. **DUC-001 does not freeze a universal closed ontology for all future conversation, and does not attempt to enumerate every possible user intent.** The model retains flexible language understanding inside a bounded structured output; the admission contract itself must remain extensible to new semantic roles without requiring architectural replacement. The exact structured output shape is delegated to the implementing SPEC (`Ch.32 item 1`) — this Package fixes the *principle* (bounded, extensible, multi-role, never a universal taxonomy), not the literal schema.

---

# 10. Decision 5 — Affirmative Direct Request

DUC-001 authorizes the concept of an **Affirmative Direct Request**: the user is actively asking FITME to provide information, judgment, guidance, clarification, or another supported coaching response now. Examples (illustrative, not exhaustive, and explicitly spanning multiple future professional capabilities — the Admission layer must not decide their professional answer): a training judgment question; a nutrition guidance question; a nutrition factual/computational question. The Admission layer's own responsibility ends at establishing that a legitimate direct response is being requested and preserving enough bounded semantics for downstream Need formation — it does not resolve the professional answer itself.

---

# 10a. Decision 5B — Desire / Preference ≠ Affirmative Direct Request

**Frozen boundary.** A user-stated desire, preference, or intent, by itself, does **not** constitute an Affirmative Direct Request. `"אני רוצה לרוץ היום."` illustrates the boundary: standing alone, it may supply current-turn user-stated information — desire, preference-adjacent context, possible plan/intent context — but it does **not** create a `DIRECT_USER_REQUEST` Need merely because the user expressed a desire. **DUC-001 does not activate, extend, or substitute for Preference V1. Preference V1 remains PAUSED**, exactly as Chapter 28 already fixes.

By contrast, `"אני רוצה לרוץ היום, מה דעתך?"` or `"אני רוצה לרוץ היום — כדאי לי?"` contains **both** (1) user-stated desire/intent context **and** (2) an Affirmative Direct Request for FITME's professional response — the second clause is what supplies request causality, not the presence of desire alone.

**Frozen principle: request causality comes from the request semantics themselves, not merely from the presence of user desire.** This Package does not attempt to freeze a universal linguistic taxonomy distinguishing every desire-statement from every request — the bounded interpreter (Ch.09) retains flexible semantic understanding for the general case — but the canonical distinction itself, and the requirement that a desire-only statement never silently manufactures a `DIRECT_USER_REQUEST` Need, is frozen here, not left to SPEC-level discretion. A desire-only statement remains available as ordinary current-turn evidence (Ch.18) or, where it reuses `ActivityPreferenceInterpreter`'s own existing advisory-only role, exactly as today's proactive TRR path already treats stated activity preference — never itself a trigger.

---

# 11. Decision 6 — EUR-001 Remains Separate

**EUR-001 remains CLOSED and unchanged. `ExplicitRequestInterpreter` is not extended or reopened by this Package.** EUR-001 continues to represent exactly its own existing, closed semantic role — negative/suppression authority over an already-existing or future-detected Opportunity (`[explicitRequestInterpreter.js:52-56]`: `SUPPRESS_ORDINARY_INITIATIVE` is the sole V1-actionable token; no affirmative/positive token exists in that module). An **Affirmative Direct Request** is a categorically different semantic concept — DUC-001 preserves this distinction structurally rather than forcing both through one mechanism. A single User Turn may theoretically contain both an affirmative and a negative element (e.g., "אל תציע לי ריצה, אבל מה לגבי הליכה?") — DUC-001's own turn-understanding contract (Ch.09) must be capable of carrying both roles simultaneously, each routed to its own existing/new mechanism, never collapsed into one.

---

# 12. Decision 7 — `DIRECT_USER_REQUEST` Stage-3 Source

DUC-001 authorizes a new Stage-3 Opportunity/Need Source: **`DIRECT_USER_REQUEST`** — domain-agnostic, user-initiated, distinct from `CONFIRMED_PATTERN_ANTICIPATION`, distinct from Safety-triggered detection, distinct from the Recommendation Engine's own source. This Source describes **why** FITME is considering responding now; it does not describe **what** professional capability must answer. `DIRECT_USER_REQUEST` is explicitly **not** permanently coupled to `ADAPT_TO_CURRENT_STATE` — it may, in the future, lead to TRR reasoning, Nutrition reasoning, deterministic nutrition computation, clarification, or another future capability, each via its own separately-authorized Reason/handling mapping.

**Canonical-extension effect, precedented:** this is the same kind of narrow, explicit, additive extension of a closed D1 enumeration TRR-001 itself already performed for the Product Reason vocabulary — TRR-001's own governance package states, of `ADAPT_TO_CURRENT_STATE`: *"a new, permanent member of the closed Product Reason enumeration... once this Package is itself subsequently reviewed, approved, and canonically closed."* `DIRECT_USER_REQUEST` extends D1 Unit 05's own closed five-member Opportunity Source list (`[D1_SPEC_v1.0.md:445-468]`) the same way, by the same mechanism, once this Package is itself reviewed and closed — not by rewriting D1's own text. D1 Unit 05 itself already anticipated exactly this: *"Explicit User Statement and Explicit User Action... are high-authority evidentiary signals that Stage 3 may use, through Pipeline Context, toward detecting an Opportunity belonging to one of the five sources above... establishes no preferred, primary, or default mapping"* (`[D1_SPEC_v1.0.md:470-477]`) — DUC-001 supplies exactly the mapping D1 itself left open, as a Task-level decision, not a foundational rewrite.

---

# 13. Decision 8 — Conversational Need Creator

DUC-001 authorizes a separate Stage-3 contributor, conceptually named **Conversational Need Creator**, responsible for converting an admitted Current User Turn into a legitimate Need/Opportunity representation when appropriate. It is separate from the Initiative Engine, the Recommendation Engine, the Safety Layer, and EUR-001 — a new, fifth Stage-3 contributor, structurally parallel to the existing four (mirroring the precedent already established when the Initiative Engine and Safety Layer were each added as their own Stage-3 contributors alongside the Recommendation Engine, `[internalPipelineOrchestrator.js:227-264]`). Its output must remain domain-agnostic enough that downstream governance (Evidence, Eligibility, professional-capability resolution) can determine handling. It explicitly does **not**: answer the user; generate final language; own professional reasoning; own Safety; own Decision Formation; invoke Expression directly; or choose a professional vertical by unrestricted free-form model authority. The final module name and API are deliberately not frozen by this Package.

---

# 14. Decision 9 — Need Semantics Before Vertical

The architecture must preserve **User Turn → bounded understanding → legitimate Need → professional handling**, never **User Turn → hardcoded domain router → vertical-specific shortcut**. Need formation captures what the user is asking FITME to help with at a semantic level sufficient for governance — the user is never required to phrase a question in a vertical-specific way. DUC-001 does not design a giant deterministic intent taxonomy, does not encode every possible question with if/else routing, and does not allow unrestricted model-generated routing directly to user-facing output. The minimum structured contract required is left to the implementing SPEC (`Ch.32 item 2`).

---

# 15. Decision 10 — Professional Capability Resolution

DUC-001 must preserve an architecture in which an admitted Need may be handled by different professional capability *types* — potential handling modes, illustrative and non-exhaustive: bounded AI reasoning vertical (TRR's own shape); deterministic computation; deterministic retrieval; clarification; no currently-supported capability; a future professional capability. **DUC-001 does not need to implement all of these in V1, but the Admission contract must not make them impossible.** Critical, frozen principle: **understanding a request is not the same as having a capability that can answer it.** FITME may correctly understand a User Turn while determining no currently-authorized professional capability exists for that Need. **The system must fail honestly rather than misroute the request to an unrelated vertical** (see Ch.23).

---

# 16. Decision 11 — On-Demand Decision Pass

A new user-turn-triggered Decision Pass concept is authorized: canonical trigger concept **`USER_MESSAGE_SUBMITTED`**, distinct from the existing autonomous `APP_READY` trigger (`[registerCoachDecisionSystem.js:29]`, currently the Composite Engine's sole registered trigger). One accepted User Turn may initiate one canonical Decision Pass, bound to that originating turn. Frozen semantics: a user action may explicitly cause a Decision Pass; the pass is bound to its originating User Turn; existing `SessionLifecycle` generation-guard discipline remains fully applicable, unmodified; duplicate delivery for the same accepted turn must be prevented; one turn must not accidentally produce both a direct reply and an unrelated duplicate autonomous (`APP_READY`) reply. Exact `EngineRegistry` mechanics (new trigger-type registration, action naming, concurrency/sequencing against an in-flight `APP_READY` pass) are delegated to the implementing SPEC (`Ch.32 item 3`).

---

# 17. Decision 12 — Turn Correlation

A new conceptual identity is introduced: **`turnId`**, identifying the originating conversational User Turn, distinct from **`runId`** (execution identity, unchanged, already threaded through `Orchestrator.run()`'s own `identity` shape). The architecture must preserve sufficient correlation across the full chain: User Turn → Need → professional handling → Candidate (where applicable) → Safety (where applicable) → Decision → Expression → Delivery Intent → UI response — **the final response must be attributable to its originating `turnId`.** The exact schema, propagation mechanism, and relationship to existing identifiers (`DetectedOpportunity.id`, `sameNeedId`, `candidateProvenance`) are not frozen here; DUC-Inv already found these existing identifiers insufficient alone for a synchronous conversational turn (`DUC-Inv §I`) — this Package authorizes a new identity to close that gap without prescribing its shape.

---

# 17a. Decision 12B — Clarification as a First-Class Conversational Outcome

**DUC-001 must support conversational clarification, and it must remain inside FITME governance.** If FITME understands that the user is requesting help, but the available bounded information is insufficient for a professionally appropriate answer, the governed system may return a clarification question. Clarification is **not**, and must never become: a raw model side conversation; an internal hidden retry loop; an unrestricted provider-session continuation; or repeated reasoning inside the same accepted User Turn until the model is satisfied.

**Frozen canonical conversational semantics:**
```
User Turn A → Need → governed processing → Clarification outcome → Expression → clarification response to user.
```
The user's answer to a clarification question is a **new** Current User Turn — not a same-turn hidden retry — carrying: a new `turnId`; a new Decision Pass; explicit correlation to the conversational/Need context that caused the clarification, where necessary; and normal governance applies again in full (Need Formation, Evidence, Eligibility, Reasoning, Safety, Decision Formation, Expression — none of these stages is skipped or weakened for a clarification-answer turn). **The final correlation schema is not defined here** — delegated to the implementing SPEC (`Ch.32 item 4a`).

**Reuse, not reinvention.** This Package reuses the existing CARF clarification outcome rather than inventing a second clarification concept: CARF's own frozen output contract already treats a clarifying question as *"a legitimate, first-class outcome — directly precedented by the one existing G-2 info-request case, never treated as an error."* TRR's own reasoning component already implements this exact outcome token (`CLARIFICATION_NEEDED`), and the orchestrator already routes it through the entirely ordinary governed path — the TRR governance package's own words: *"Clarification content is owned exclusively by trainingReadinessReasoningComponent.js... The resulting Candidate follows the entirely ordinary governed path (Prioritization → Winner Selection → Safety → Decision Formation → Expression), reusing every existing mechanism."* DUC-001 does not modify this mechanism — it only extends *what precedes it* (a Current User Turn may now be the Need's own origin) and *what follows it in conversational terms* (the user's reply becomes a new, correlated turn, never a hidden continuation).

**No provider-session memory.** Continuity across the clarification exchange is carried entirely by FITME's own correlation context (the new turn's link back to the prior Need/clarification context) — never by relying on the model provider's own conversation/session state. This is a direct, unmodified extension of CARF's own frozen invocation contract: *"No provider-session-memory dependency: each invocation is a single, self-contained request; no thread/session/conversation identifier is passed to or relied upon from the provider."* DUC-001 introduces no exception to this.

---

# 18. Decision 13 — Current-Turn Evidence

A Current User Turn may supply evidence relevant to the same Decision Pass without first becoming durable Typed Memory. A sleep statement within a turn may become bounded, provenance-tagged evidence — `USER_STATED` / `CURRENT_TURN` — available to whichever professional capability legitimately consumes it, using the identical provenance-tagging discipline `readinessStateContext` already applies today (`provenance: 'USER_STATED'`, `[memoryLayer.js]`, reused, extended with a new current-turn-vs-durable distinction). Provenance must distinguish, at minimum: current-turn user statement; durable `user_stated` Memory; measured/acquired information; derived interpretation. **Current-turn information must not silently become durable truth** — persistence, if any, remains a separate, explicit decision (Ch.08), never an automatic side effect of a professional capability consuming current-turn evidence.

---

# 19. Decision 14 — Dogfood V1 Implementation Slice

**DUC-001's architecture is domain-agnostic. Dogfooding Milestone 1's implementation coverage may be narrow.** The first fully supported professional conversational path is **Training Readiness & Recovery**, because TRR-001 is the first professional reasoning vertical already implemented and production-reachable (TRR Production Reachability Correction, commit `f247e1f`). Examples expected to become fully answerable in the first implementation slice: a sleep-vs-training judgment question; a fatigue-vs-full-workout judgment question.

For this first supported vertical only, `DIRECT_USER_REQUEST` **may legitimately converge on** the existing `ADAPT_TO_CURRENT_STATE` TRR Reason — a V1 capability mapping, not a redefinition. **`DIRECT_USER_REQUEST` (the Source — why FITME is responding now) and `ADAPT_TO_CURRENT_STATE` (the Reason — the professional judgment being made) remain two separate dimensions**, exactly as `sourceCategory` and `validReasonCategory` already are two independent fields on every existing `DetectedOpportunity` (`[initiativeEngine.js:614-645]`). A future `DIRECT_USER_REQUEST` × (a different Reason) mapping requires its own, separate future authorization — this Package authorizes exactly one V1 convergence, not a permanent coupling.

---

# 20. Decision 15 — TRR Reuse

For the first Dogfood implementation slice, the implementing SPEC SHALL reuse, unmodified: `ReadinessStateInterpreter`; `TrainingReadinessReasoningComponent`; the existing TRR Reasoning Context principles (`buildTrainingReadinessReasoningContext()`, `[memoryLayer.js:654-682]`); the existing Candidate contract (`resolveTrainingReadinessProposal()`, `[internalPipelineOrchestrator.js:345-376]`); activity identity/normalization (`ActivityReferenceNormalizer`, MAI-001) where relevant; Safety (SL-001, CSR-001, unmodified); Decision Formation (unmodified); Expression (unmodified). **DUC-001 does not create, and its implementing SPEC must not create:** a chat-specific TRR engine; a second TRR reasoning component; or a direct-to-Claude TRR path. Proactive TRR and Direct-User TRR have different causality (Source) but converge on the identical, shared professional reasoning after legitimate Need formation.

---

# 21. Decision 16 — Early Relationship Authority

A legitimate direct request must be serviceable from the earliest relationship stage — relationship maturity/Observer status alone must not silence a valid direct user request. This is different in kind from proactive Initiative, where relationship maturity may legitimately constrain FITME's willingness to interrupt or intervene unprompted: **the user initiated this interaction.** Product/Architecture authorizes the necessary bounded-engagement extension for `DIRECT_USER_REQUEST`, from the earliest relationship stage, via the same, already-twice-proven mechanism: the closed `BOUNDED_ENGAGEMENT_POLICY` table (`[eligibilityEvaluator.js:62-68]`), whose own precedent is explicit — RGEF's own first authorized case, TRR-001's own second authorized case (*"Training Readiness is the mechanism's second authorized case, not a philosophical exception unique to it"* — TDP), and now a third, `DIRECT_USER_REQUEST`-scoped case, requiring its own explicit table entry per the mechanism's own established discipline (*"No third entry... is authorized by this Package [TDP]; each future case requires its own explicit Product/Architecture decision"* — this Package **is** that explicit decision for this one new case). **No implementation is performed in this turn.**

---

# 22. Decision 17 — No Generic Vertical Router Yet

DUC-001 does **not** authorize building a generic Reasoning Vertical Router merely because the Admission layer itself is domain-agnostic. The architecture must *allow* multiple future professional capabilities; the implementation does not need to pretend those capabilities exist today. Dogfood V1 has exactly one fully supported conversational professional vertical (TRR) — introducing speculative dispatch abstraction without a second real consumer is explicitly not authorized (consistent with CARF's own Chapter 16 delegation discipline, which repeatedly declines to pre-build machinery for a capability with no second live consumer yet).

**Recorded architecture trigger (frozen, to be honored by future Work Items):** before a second conversational professional vertical is implemented, FITME must review whether a generalized Professional Capability / Reasoning Dispatch contract is required, so that future verticals do not accumulate as an uncontrolled, hardcoded if/else chain inside `internalPipelineOrchestrator.js` (which today already contains exactly one such hardcoded check, `[internalPipelineOrchestrator.js:421]`, for TRR alone — DUC-Inv's own finding, `DUC-Inv §H`). This trigger is a recorded commitment, not an open question — it does not block DUC-001's own SPEC authoring or V1 implementation.

---

# 23. Decision 18 — Unsupported-but-Understood Requests

A domain-agnostic Admission layer means FITME may correctly understand a request for which no professional capability is currently implemented (e.g., a nutrition question, during early Dogfood, before any nutrition capability exists). The Admission layer must not need to pretend such a request is TRR-shaped merely because TRR is the only implemented capability. It may identify a legitimate direct-user Need while downstream capability resolution honestly determines that the relevant professional handling is not yet supported by DUC-001's first implementation slice. **DUC-001 requires an honest, bounded outcome for this "understood request / unsupported capability" case.** This Package does not invent the final user-facing wording (Expression's own exclusive authority, unmodified) and does **not** authorize silently routing an unsupported request to generic/raw Claude — that would be exactly the Legacy-Coach-shaped shortcut Ch.26 forbids.

---

# 24. Decision 19 — Nutrition (Future, Not Now)

Nutrition is **not** part of the first DUC-001 professional implementation slice. It **is** explicitly a future first-class conversational domain. The Admission architecture must not require future replacement to support nutrition questions — including ones representing materially different professional-handling shapes (deterministic computation; context-aware recommendation; flexible coaching reasoning) — illustrating exactly why Decision 10's multi-mode capability-resolution boundary (Ch.15) is required now, even though no nutrition capability is built now. **Nutrition capability itself is not designed by this Package.**

---

# 25. Decision 20 — Other Future Conversation

The same principle extends to every other future FITME conversational domain — habits, goals, progress, schedule/context, travel, recovery, training, nutrition, and other future bounded professional capabilities. **DUC-001 is the shared conversational admission foundation and must not need replacement each time FITME gains a new professional capability.**

---

# 26. Decision 21 — Legacy Coach Boundary

Legacy Coach (`coachClient.js`, `coachPresenter.js`, `coachPromptComposer.js`) may provide implementation *precedent* for: loading state; error state; rendering mechanics; the existing Claude transport (`ClaudeProxyClient`). **It must not provide the canonical request architecture.** Forbidden, explicitly: `User message → CoachClient.sendMessage() → raw Claude response → DOM`. The canonical path preserves FITME governance in full: for reasoning-generated coaching, `Need → bounded Reasoning → Candidate → Safety → Decision Formation → Expression`, unmodified from CARF's own frozen shape. Other future professional-capability types (deterministic computation, retrieval) may have their own bounded processing contract, but **raw, unrestricted model output is never the default conversational architecture** for any capability type.

---

# 27. Decision 22 — Product Milestone

DUC-001 serves **Dogfooding Milestone 1**: a real user can type naturally to FITME through one shared Coach conversation surface, and FITME can: (1) capture the User Turn; (2) understand its bounded semantic roles; (3) recognize whether a direct response is being requested; (4) form a legitimate direct-user Need; (5) preserve current-turn evidence; (6) determine whether an authorized professional capability can handle it; (7) for supported TRR requests, execute the full governed TRR path; (8) return the Expression result to the originating `turnId`; (9) refuse to misroute unsupported requests through an unrelated capability or a raw-Claude shortcut. **The milestone does not redefine the shared Admission architecture as TRR-specific.**

---

# 27a. Decision 22B — One General Coach Conversation Surface

DUC-001 assumes **one shared, domain-agnostic FITME Coach Conversation Surface** — the primary conceptual surface through which the user talks naturally with FITME. **The user must not select TRR, Nutrition, Habits, Recovery, a Product Reason, a reasoning vertical, or an engine.** The user talks to FITME; FITME owns understanding what professional capability, if any, is relevant downstream.

The first Dogfood implementation may use a minimal UX: a conversation/thread area; a text input; a submit/send action; a loading/pending state; a returned FITME response; and failure/unsupported handling. **Visual design is not defined by this Package.** The surface must not become a TRR-specific card or training-specific input, and must remain reusable as future conversational capabilities are added — the same discipline Ch.04's Product Vision already fixes for the architecture underneath it.

**Dogfood V1 vs. Product Architecture, reaffirmed:** Dogfood V1 may have only TRR as its first fully-supported professional conversational capability, but the Coach Conversation Surface and the DUC Admission architecture beneath it are domain-agnostic. A user may naturally submit other requests through the same surface; FITME must not misroute them to TRR. Where no authorized capability exists, the system uses the already-defined honest unsupported-capability path (Ch.23) — **this is expected early behavior, not an admission failure.**

**Multi-turn identity, distinguished:** `turnId` identifies one submitted User Turn (Ch.17); `runId` remains execution identity, unchanged; conversational continuity/clarification correlation (Ch.17a) is a conceptual relationship across multiple turns, distinct from both. This Package does not prematurely introduce a final `conversationId`, `clarificationId`, `parentTurnId`, or other concrete schema — no such primitive already exists cleanly in the repository to reuse, and none is frozen here; the implementing SPEC freezes the minimal concrete schema (`Ch.32 item 4a`).

---

# 28. Explicit Non-Goals

DUC-001 V1 does NOT implement: full Nutrition conversational capability; Preference V1 (remains PAUSED, unaffected); generic life-advice assistant behavior; device/Health/GPS acquisition; provider-session memory (CARF Ch.08's frozen prohibition is unaffected and unextended); a universal professional-capability ontology; a universal intent taxonomy; a generic Reasoning Router without a second real consumer; calendar/planned-workout infrastructure; unrestricted raw-model chat; or automatic persistence of every conversation.

---

# 29. Canonical Relationships

- **D1 — CLOSED, not reopened.** DUC-001 is a narrow Task-level extension for the Current User Turn Decision Input concept (D1 Unit 03) and the `DIRECT_USER_REQUEST` Stage-3 Source (D1 Unit 05), precedented exactly by TRR-001's own Product Reason extension (Ch.12 above).
- **D3 — CLOSED, unchanged.** Existing ownership boundaries (Memory Layer exclusivity over Decision Input reads and Pipeline Context assembly) remain fully authoritative and are extended in kind, never bypassed (Ch.07).
- **EUR-001 — CLOSED, unchanged.** Negative direct-user authority remains structurally separate from the new Affirmative Direct Request concept (Ch.11).
- **CARF — CLOSED, reused unmodified.** Bounded professional AI reasoning remains governed entirely by CARF's own frozen Chapters 04-17; DUC-001 introduces a new Stage-3 origination path feeding the same, unmodified Chapter 06 seam (Ch.13).
- **TRR-001 — CLOSED, reused unmodified.** TRR becomes the first professional capability connected to Direct User Admission, via reuse, not modification (Ch.20).
- **Safety (SL-001/CSR-001) — CLOSED, unaffected.** Safety review remains per-Candidate, deterministic, and origin-agnostic; nothing in this Package changes any Safety Rule, disposition, or review mechanism.
- **Expression — unaffected.** Remains the sole, exclusive owner of final coaching language, for both TRR and every future capability type (Ch.26).
- **Preference V1 — remains PAUSED,** explicitly unaffected and unreopened by this Package (Ch.28).
- **RGEF / Bounded Engagement Policy — CLOSED, extended in kind** (a third table entry, precedented, Ch.21), never reinterpreted.

**No existing closed canonical document is edited by this Package.**

---

# 30. Repository Consistency Review

Performed against the actual repository at HEAD `f247e1f`, per explicit instruction to distinguish an authorized Task-level extension from a genuine contradiction requiring a closed foundation to reopen.

**D1 Unit 05 (Opportunity Sources):** the closed five-source list is extended, not contradicted — D1 Unit 05's own text already reserves exactly this extension (`[D1_SPEC_v1.0.md:470-477]`), and the extension mechanism (a narrow, later, additive Decision Package) is directly precedented by TRR-001's own Product Reason extension. **No contradiction.**

**D1 Unit 11 (Evidence Hierarchy):** checked specifically for a genuine tension — does a single, one-off direct user question satisfy Stage 4 Evidence Evaluation, given D1-OD-01's general rule that "a single event alone does not by itself constitute evidence sufficient to detect a standing opportunity"? Confirmed: **no tension.** D1's own closed Evidence Hierarchy ranks **Explicit User Statement** as its *highest* tier, above even Repeated Behaviour (`[D1_SPEC_v1.0.md:828-829]`), and D1-OD-01 itself explicitly exempts "explicit user statements or actions" from the single-event insufficiency rule, alongside safety/high-risk triggers (`[D1_SPEC_v1.0.md:481-490]`). A `DIRECT_USER_REQUEST`-sourced Need is evidentially well-founded under D1 exactly as written, with no amendment required to Unit 11.

**D3 (Memory Layer exclusivity):** Decision 2 (Ch.07) explicitly preserves this boundary in full; no code or design decision in this Package proposes any component other than the Memory Layer reading a Decision Input. **No contradiction.**

**CARF Ch.06 (pipeline placement):** DUC-001's Conversational Need Creator is framed explicitly as a new **Stage-3** contributor (Ch.13), not a bypass of Stage 4 (Evidence)/Stage 5 (Eligibility) — fully consistent with CARF's own frozen seam, which sits after Stage 5, before Stage 6, regardless of which Stage-3 contributor originated the Opportunity. **No contradiction.**

**EUR-001:** confirmed structurally separate by design (Ch.11); EUR-001's own closed, single-actionable-token vocabulary (`SUPPRESS_ORDINARY_INITIATIVE`) is untouched. **No contradiction.**

**TRR-001:** Decision 14/15/19-20 confirm TRR-001's own Source (`CONFIRMED_PATTERN_ANTICIPATION`), Reason (`ADAPT_TO_CURRENT_STATE`), Reasoning Context, Candidate, and Safety contracts are all reused unmodified; only a new, additional Source (`DIRECT_USER_REQUEST`) reaching the same, unmodified Reason is introduced. **No contradiction; TRR-001's own SPEC does not need to be reopened by this Package** (though the implementing SPEC should independently re-confirm this once concrete).

**RGEF / Bounded Engagement Policy:** the table (`[eligibilityEvaluator.js:62-68]`) is already designed as a closed-but-extensible, additive lookup — exactly the mechanism TDP itself used for TRR-001's own second entry. A third entry for `DIRECT_USER_REQUEST` × `ADAPT_TO_CURRENT_STATE` (V1 scope) is additive by the mechanism's own design. **No contradiction.**

**Safety, Decision Formation, Expression, Source × Reason contracts generally:** all confirmed unmodified by any decision in this Package; every existing Rule, disposition, and rendering boundary applies identically regardless of a Candidate's originating Source. **No contradiction found anywhere requiring a closed foundation to reopen.**

**Revision-2 checks (Decisions A/B/C), performed specifically against the six items Product/Architecture named for re-verification:**

1. **Clarification reuses existing CARF semantics where applicable.** Confirmed — Ch.17a's clarification mechanism is explicitly the same, unmodified `CLARIFICATION_NEEDED` outcome CARF Ch.09 already freezes as *"a legitimate, first-class outcome... never treated as an error,"* and the same ordinary Candidate → Safety → Decision Formation → Expression path the TRR governance package already documents for it. **No second clarification concept is introduced; no contradiction.**
2. **No provider-session memory is introduced.** Confirmed — Ch.17a explicitly requires the clarification-answer turn to be a new, independently-correlated turn, with continuity carried by FITME's own correlation context, never the model provider's own session/thread state; this is a direct, unmodified restatement of CARF Ch.08's own frozen prohibition. **No contradiction.**
3. **Desire-only input does not silently activate Preference V1.** Confirmed — Ch.10a explicitly forecloses this ("DUC-001 does not activate, extend, or substitute for Preference V1. Preference V1 remains PAUSED"), and the repository-verified fact that Preference cannot produce real behavior today regardless (no mechanism presents more than one alternative per Need, per CARF Ch.13's own citation of ACPI §10-11) means there is no live mechanism a desire-only statement could even accidentally trigger. **No contradiction.**
4. **Affirmative request remains distinct from EUR suppression.** Confirmed — Ch.10a's new boundary is drawn entirely within the Affirmative-Request/desire distinction and does not touch EUR-001's own closed, single-token (`SUPPRESS_ORDINARY_INITIATIVE`) vocabulary at all; Ch.11's original separation is unaffected by this revision. **No contradiction.**
5. **The conversation surface remains domain-agnostic.** Confirmed — Ch.27a's own text explicitly forbids the user selecting a vertical/engine/Product Reason and explicitly forbids the surface becoming a TRR-specific card; this is a direct restatement of Ch.04's Product Vision, not a new or competing principle. **No contradiction.**
6. **TRR remains only the first implementation slice, not the Admission architecture.** Confirmed — Ch.27a's own "Dogfood V1 vs. Product Architecture" restatement is identical in substance to Ch.19/Ch.22's original framing; no decision in this revision narrows the Admission architecture to TRR. **No contradiction.**

**No genuine contradiction was found anywhere in this revision requiring D1, D3, CARF, EUR-001, TRR-001, RGEF, Safety, Decision Formation, or Expression to reopen.**

---

# 31. Genuine Product/Architecture Questions Still Open

All three items previously recorded here are now resolved by Decisions A/B/C (Ch.10a, Ch.17a, Ch.27a) and are removed:

- *Clarification/multi-round-trip semantics* — resolved by Ch.17a: a new turn, a new `turnId`, correlation to prior context, normal governance reapplied in full; exact schema delegated to SPEC (`Ch.32 item 4a`), which is an engineering-judgment delegation, not a remaining Product ambiguity.
- *Affirmative Direct Request vs. desire/preference boundary* — resolved by Ch.10a: request causality comes from the request semantics, not from the presence of desire; a desire-only statement never manufactures a `DIRECT_USER_REQUEST` Need; exact classifier realization delegated to SPEC (`Ch.32 item 9`).
- *Input/UI conversational surface* — resolved at the architectural level by Ch.27a: one shared, domain-agnostic conversation surface, with its minimal conceptual UX enumerated; visual design is explicitly and correctly left undefined by this Package, and the concrete UI-surface contract is delegated to SPEC (`Ch.32 item 10`) within that already-fixed conceptual shape.

Having re-examined the whole Package for any new gap introduced by Decisions A/B/C (Ch.30 above) and found none:

**No unresolved Product/Architecture decision blocks SPEC authoring.**

---

# 32. What the Implementing SPEC Must Determine

Delegated, not decided here — mirroring the established CARF Ch.16 / TDP delegation pattern:

1. The exact structured-output schema for bounded Current User Turn understanding (Ch.09) — field names, the initial closed-but-extensible semantic-role vocabulary, and its own prompt/model contract.
2. The minimum structured Need-formation contract the Conversational Need Creator must produce (Ch.14), and its exact module/API naming.
3. Exact `EngineRegistry`/trigger mechanics for `USER_MESSAGE_SUBMITTED` (Ch.16), including its interaction with an in-flight `APP_READY` pass and duplicate-delivery prevention.
4. The exact `turnId` schema and its propagation through existing identifiers (`DetectedOpportunity.id`, `sameNeedId`, `candidateProvenance`) (Ch.17).
4a. The exact conversational/clarification correlation schema (Ch.17a/27a) — whether it is carried on `turnId` itself, a separate concept, or a minimal reuse of an existing identifier — and the exact mechanism by which a clarification-answer turn locates its originating Need/clarification context.
5. The exact current-turn evidence provenance shape and its relationship to existing provenance tags (Ch.18).
6. The exact `BOUNDED_ENGAGEMENT_POLICY` table entry and `SOURCE_REASON_MATURITY_OVERRIDES` table entry for `DIRECT_USER_REQUEST` × `ADAPT_TO_CURRENT_STATE` (Ch.21; precedent: `[eligibilityEvaluator.js:62]`, `[initiativeEngine.js:168]`).
7. The exact honest "understood but unsupported" Terminal-Decision-level representation and its Expression-level wording (Ch.23) — behavior is fixed by this Package; the shape and words are not.
8. Whether V1 implements a real capability-resolution dispatch for the (currently single) TRR case, or a single narrowly-scoped check, consistent with Decision 17's explicit "no router without a second consumer" instruction.
9. The exact bounded classifier boundary distinguishing a desire-only statement from an Affirmative Direct Request (Ch.10a) within the turn-understanding structured output (Ch.09) — the canonical distinction is frozen; its precise prompt/schema realization is not.
10. The minimal concrete UI-surface contract (Ch.27a) — conversation/thread rendering, input capture, loading/pending state, and failure/unsupported-state presentation — within the conceptual surface shape Ch.27a already fixes (one shared, domain-agnostic conversation surface; no visual design decided here).

---

# 33. Status and Next Step

**This Package is CANONICAL / APPROVED — PRE-IMPLEMENTATION.** Product/Architecture Final Review has occurred and approved it in substance. It does not itself authorize implementation — no code exists, and none is authorized by this document. **Chapter 31's three previously-open questions are resolved (Revision 2); no unresolved Product/Architecture decision blocks SPEC authoring.** The authorized next step is authoring DUC-001's own implementation SPEC — citing this Package, D1, D3, CARF, EUR-001, and TRR-001 — mirroring exactly how TRR-001's SPEC followed TDP's own closure. This Package itself will not be marked IMPLEMENTED, VERIFIED, or CLOSED — those statuses belong to the implementing SPEC once DUC-001 is actually built.

---

# 34. Document History

- **v1.0 (initial authoring, DRAFT CANONICAL)** — authored following the completed, read-only `Direct User → Coach Canonical Investigation`, converting the Product/Architecture direction frozen in that conversation into this Package's 22 decisions. Repository Consistency Review performed against D1, D3, CARF, EUR-001, TRR-001, RGEF/Bounded Engagement Policy, Safety, Decision Formation, and Expression — no contradiction found requiring any closed foundation to reopen. Three genuine open Product/Architecture questions recorded (Ch.31). No implementation performed. No code, test, or other repository file modified. No existing canonical document edited.
- **v1.0, Revision 2 (DRAFT CANONICAL, still not Final-Reviewed)** — Product/Architecture resolved all three Chapter-31 questions: Decision 5B/Ch.10a (desire/preference is never itself an Affirmative Direct Request; request causality comes from request semantics, not from the presence of desire; Preference V1 remains untouched and unreachable via a desire-only statement); Decision 12B/Ch.17a (clarification is a first-class, governed conversational outcome, reusing CARF's own existing `CLARIFICATION_NEEDED`/ordinary-Candidate-path mechanism unmodified; a clarification answer is always a new, correlated User Turn, never a same-turn hidden retry or provider-session continuation); Decision 22B/Ch.27a (one shared, domain-agnostic Coach Conversation Surface, conceptual shape only, no visual design, explicit reaffirmation that Dogfood V1's TRR-only implementation coverage does not narrow the Admission architecture itself). Repository Consistency Review re-performed against the six specific items Product/Architecture named (CARF clarification reuse; no provider-session memory; Preference V1 non-activation; EUR-001/Affirmative-Request separation; conversation-surface domain-agnosticism; TRR-as-first-slice-not-architecture) — no contradiction found. Chapter 31 now states explicitly: no unresolved Product/Architecture decision blocks SPEC authoring. Chapter 32 (SPEC delegations) gained four new items (4a, 9, 10, and the renumbered UI-surface item) reflecting the newly-resolved decisions' own remaining engineering-judgment scope. Also corrected an unrelated pre-existing citation error in Chapter 23 ("Ch.27 forbids" → "Ch.26 forbids," the actual Legacy Coach Boundary chapter). No implementation performed. No code, test, or other repository file modified. No existing canonical document edited.
- **v1.0, Revision 3 — CANONICALIZATION (status change only)** — Final Canonical Review performed against the complete 33-item Product/Architecture checklist (all items confirmed present and correctly frozen) and a fresh Foundation Consistency Review against the live repository (D1 Unit 05/Unit 11 text, `eligibilityEvaluator.js`'s `BOUNDED_ENGAGEMENT_POLICY`, `initiativeEngine.js`'s `SOURCE_REASON_MATURITY_OVERRIDES`, and CARF's own Ch.08/Ch.09 quotes independently re-verified verbatim against current file content) — no genuine contradiction found requiring any closed foundation to reopen. Status changed from `DRAFT CANONICAL — PRODUCT / ARCHITECTURE DECISIONS FROZEN FOR REVIEW` to `CANONICAL / APPROVED — PRE-IMPLEMENTATION`, reflecting Product/Architecture Final Review's approval of this Package in substance — explicitly not IMPLEMENTED, VERIFIED, or CLOSED, since no implementation exists. No Product/Architecture substance was altered — only the top-of-document status line, Chapter 01, and Chapter 33 were updated to reflect the review outcome. **Roadmap/Changelog note:** repository precedent for standalone Changelog entries at a Decision Package's own closure is mixed — Safety Layer/G-2/Coach Semantic Foundation Decision Packages each received one, but the two closest structural analogs to DUC-001 (TDP and CARF, both pre-implementation Foundation/vertical Decision Packages) did not; they were referenced only later, inside TRR-001's own implementation Changelog entry. Given this is not a uniform, unambiguous convention, no Roadmap/Changelog edit was made this turn — flagged for Product/Architecture awareness, not decided unilaterally. No implementation performed. No code or test file modified. No existing closed canonical document edited.
