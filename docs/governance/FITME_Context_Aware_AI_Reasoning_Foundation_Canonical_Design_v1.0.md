
# FITME — CONTEXT-AWARE AI REASONING FOUNDATION
## v1.0 — CANONICAL / CLOSED (Freezes the Reasoning-Authority Boundary, Pipeline Placement, Context/Contract/Output Shape, Alternative-Readiness Principle, Safety/Preference/Expression Relationships and Non-Goals; No Implementation SPEC Authored Yet)

> **Document role:** Decision Package (Canonical Design). Not a SPEC. Not an implementation document. Modeled structurally on `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD) and `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (SLDP) — the repository's established precedent for a standalone Canonical Decision Package that freezes Product/Architecture decisions ahead of implementation-SPEC authoring.
> **Prepared by:** Lead Engineer / Repository Analyst / Repository Maintainer, recording decisions presented as approved by the Head of Product + AI Architect across this conversation, without reinterpretation.
> **Repository baseline:** `main` @ `a6fe983ac91f0d2a8ef698275e0e3e9d3833c83a` (== `origin/main` at authoring time).
> **Origin:** This Package follows two Head-of-Product-authorized read-only investigations conducted after the Safety Foundation sequence's canonical closure: (1) the FITME — Action/Candidate Production Architecture Investigation (result: **ACTION FOUNDATION DESIGN REQUIRED** — no owner exists anywhere in the repository for coaching-action content; both existing Candidate producers are contractually forbidden from inventing it); (2) the FITME — Context-Aware AI Reasoning Architecture Investigation (result: **CONTEXT-AWARE AI REASONING FOUNDATION REQUIRED** — the repository already contains a proven, four-times-closed "bounded interpreter" pattern for safely wrapping an LLM call, and a single deterministic rule (`contextualMeaningPolicy.js`) at the exact seam where reasoning belongs, but nothing that reasons flexibly about what action to propose).
> **Purpose of this version:** Freeze the reasoning-authority boundary, the canonical pipeline seam, the Reasoning Context and invocation-contract shape, the minimum structured output, the alternative-readiness principle, and the relationships to Safety/Explicit-Request/Preference/Expression/Legacy-Coach — so that a first implementation SPEC can cite this Package rather than re-deriving or re-arguing architecture already decided. This Package introduces **no new Product or Architecture decision** beyond what was already approved in this conversation prior to this authoring turn.
> **Status of this version:** **CANONICAL / CLOSED.** The Product/Architecture *direction* this Package records (Chapters 04-17) was approved in conversation prior to this document's first authoring pass. This *authored Package itself* completed a first Product/Architecture Final Review pass (outcome: CHANGES REQUIRED — four corrections applied) and a subsequent Final Review pass (outcome: APPROVED) — see Chapter 18 for the full history and the exact distinction between approved direction and artifact closure. Does not itself authorize implementation, does not select a first vertical, and does not implement Preference.

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| SFCD | Safety Foundation Canonical Design v1.0 (Closed) | `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` |
| SLDP | Safety Layer Canonical Decision Package v2.6 (Closed) | `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| CSR-001 | Canonical Safety Rule V1 + Real Matcher (DONE/CLOSED) | `docs/specs/CSR_001_SPEC_v1.0.md` |
| MAI-001 | Minimum Action Identity V1 (DONE/CLOSED) | `docs/specs/MAI_001_SPEC_v1.0.md` |
| USC-001 | User Safety Context V1 (DONE/CLOSED) | `docs/specs/USC_001_SPEC_v1.0.md` |
| USP-001 | User Safety Provenance V1 (DONE/CLOSED) | `docs/specs/USP_001_SPEC_v1.0.md` |
| EUR-001 | Explicit User Request V1 (DONE/CLOSED) | `docs/specs/EUR_001_SPEC_v1.0.md` |
| CSSC-001 | Current State / Situational Context V1 (DONE/CLOSED) | `docs/specs/CSSC_001_SPEC_v1.0.md` |
| RGEF | Relationship-Guided Engagement Foundation (DONE/CLOSED) | `docs/specs/RGEF_SPEC_v1.0.md` |
| ACPI | FITME — Action/Candidate Production Architecture Investigation (this conversation, prior turn) | conversation record |
| CARI | FITME — Context-Aware AI Reasoning Architecture Investigation (this conversation, prior turn) | conversation record |
| CARF | This document | `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` |

Citation format: `[ABBR, ref]` for prose documents, `[filename:LineN]` for code, `[ACPI/CARI, §N]` for findings recorded in this conversation's two prior investigations and not yet in any other repository document.

---

# 01. Status

## Purpose

Establish the working status of this Package before its content is read, so it is never mistaken for an already-authored implementation SPEC, a completed implementation, or an authorization to implement.

## Review State

This Package has completed two Product/Architecture Final Review passes. **First pass outcome: CHANGES REQUIRED** — four corrections (status/closure self-description, Evidence/Eligibility pre-reasoning-gate precision, Chapter 16's conditional SPEC-readiness rule, Chapter 18's Next Step sequencing) were applied. **Second pass outcome: APPROVED**, alongside one further non-blocking precision correction (Chapter 15's Legacy Coach comparison table wording, corrected to avoid implying the reasoning proposal re-passes Stage 5 after generation) that did not reopen Final Review. The Product/Architecture *direction* this Package records (Chapters 04-17) was approved in conversation prior to this document's first authoring pass and was not reopened by either review pass. The *artifact itself* is now **CANONICAL / CLOSED** as of this version. See Chapter 18 for the full distinction and history.

## Canonical Interpretation

This Package freezes the Product/Architecture decisions the Head of Product + AI Architect has already approved for the Context-Aware AI Reasoning initiative: the Product philosophy governing the model's role (Chapter 04); the exact reasoning-authority boundary (Chapter 05); the canonical pipeline seam (Chapter 06); the Reasoning Context ownership principle (Chapter 07); the AI-invocation contract (Chapter 08); the minimum structured reasoning output (Chapter 09); the alternative-readiness principle (Chapter 10); the Safety relationship (Chapter 11); the Explicit-User-Request relationship (Chapter 12); the Preference relationship (Chapter 13); the Expression boundary (Chapter 14, folded into Chapter 05); the Legacy Coach distinction (Chapter 05/14 cross-reference); failure semantics (Chapter 09); the Foundation-vs-first-vertical boundary (Chapter 15); and the explicit non-goals (Chapter 13).

## Explicit Non-Interpretations

This Package does not author, and is not, an implementation SPEC. It does not authorize implementation. It does not modify `js/**`, `tests/**`, `index.html`, `sw.js`, the Roadmap, the Changelog, the Architecture document, SL-001, SFCD, or any other closed canonical document. It introduces no new Product or Architecture decision beyond what this conversation already approved prior to this authoring turn — where a decision remains open, this Package records it as open (Chapter 16) rather than deciding it. It does not select a first implementation vertical (per explicit Product direction — see Chapter 00 Background). It does not implement Preference V1, which remains paused.

## Repository Gaps

None introduced by this chapter. The Foundation itself remains unimplemented as of this Package's authoring — see Chapter 15.

---

# 02. Purpose

This Package exists because integrating a strong general AI model as FITME's coaching-reasoning engine requires several architecture-level decisions before any implementation SPEC could be authored without inheriting unresolved ambiguity: what the model is and is not allowed to decide; where in the ten-stage Coach Decision System pipeline reasoning legitimately belongs; what bounded context it receives; what structured contract its output must honor; how it stays compatible with a future multiple-alternatives/Preference capability without being built as if that capability already exists; and how it differs, architecturally and not merely rhetorically, from the legacy free-generation Coach path this repository has already begun containing (LCSC-001) and is expected to eventually retire. Those decisions were reached across two sequential, Head-of-Product-authorized investigations (ACPI, CARI). This Package records them canonically, once, so that the Foundation's own implementation SPEC — the next document to be authored — inherits a stable, cited foundation rather than re-arguing architecture already settled.

---

# 03. Background — The Investigation Series and the Approved Product Direction

## Investigation 1 — Action/Candidate Production Architecture Investigation (ACPI)

Investigated, at repository-evidence level, what is missing between the current Coach Decision System and a system that can produce concrete, professionally-valid coaching actions. Result: **ACTION FOUNDATION DESIGN REQUIRED.** Found that `js/coachDecisionSystem/recommendationEngine.js` and `js/coachDecisionSystem/initiativeEngine.js` are both explicitly, deliberately forbidden — by their own file headers — from inventing coaching-action content; both require an `EligibleOpportunity` to already carry a fully-formed `proposedAction` string before Stage 6 ever runs. Today exactly one hardcoded literal (`initiativeEngine.js:466`, the G-2 food-logging info-request) ever populates it. No deterministic professional-validity engine exists for any domain (nutrition, training, recovery). `Candidate.action` is a single opaque string; `Candidate.actionIdentity` (MAI-001) is a real, closed, additive, single-key (`activity`) field whose own validator rejects any richer shape. Neither producer ever constructs more than one Candidate per Opportunity. `TIED_SET` (`winnerSelection.js:79-95`) is a cross-Opportunity ranking-exhaustion artifact, not an "alternatives for one need" mechanism.

## Investigation 2 — Context-Aware AI Reasoning Architecture Investigation (CARI)

Investigated how a strong general AI model should be integrated as a bounded, context-aware coaching-reasoning engine. Result: **CONTEXT-AWARE AI REASONING FOUNDATION REQUIRED.** Found two structurally opposite existing LLM-call patterns: (a) legacy free generation (`js/coach/coachClient.js`, `js/app.js:1318/1520/1559/1601`) — full authority, free prose, no structured validation, no Safety review, trusted directly; and (b) four independently-built, structurally identical "bounded interpreter" modules (USC-001's `safetyContextInterpreter.js`, USP-001's `userSafetyProvenanceInterpreter.js`, CSSC-001's `situationalContextInterpreter.js`, EUR-001's `explicitRequestInterpreter.js`) — each wrapping the same injected `callClaude` closure with closed-vocabulary output, deterministic batching, strict per-item validation, no retry, and unconditional fail-closed-to-empty. Found that `contextualMeaningPolicy.js` — the one place "what does this need mean" is decided today — is a single hardcoded deterministic rule, exactly the exhaustive-rule-system pattern the new Product direction rejects. Identified the Stage-3→6 handoff (where `DetectedOpportunity`/need already exists but `proposedAction` does not) as the seam with no boundary conflict against any closed canonical contract.

## The Approved Product Direction (this conversation, verbatim intent preserved)

Head of Product + AI Architect approved: FITME will use a strong general AI model for flexible, context-aware coaching reasoning, and will **not** attempt to reproduce general coaching intelligence through an exhaustive deterministic situation→response rule system. FITME owns persistent user state/memory, provenance, bounded context assembly, Evidence/Eligibility, explicit-user-authority controls, deterministic Safety authority, Candidate/Decision governance, and final Expression boundaries. The AI model owns bounded flexible reasoning inside those constraints. The intended flow is: **Established Need/Opportunity → bounded Reasoning Context → AI Reasoning → structured Action Proposal(s) → deterministic validation/governance → Candidate(s) → Safety → Decision → Expression → User.** AI reasoning output must never be shown directly to the user; Expression remains sole owner of final user-facing communication. Safety remains deterministic and authoritative after AI reasoning; providing Safety context to the model does not make the model the Safety authority. FITME remains owner of persistent user knowledge; the architecture must not depend on provider-side conversation/session memory. Reasoning context must be bounded and need-relevant, never a full-profile dump (the Legacy Coach pattern). The Foundation must be architecturally ready for multiple Action Proposals per Need without being built as a speculative universal Action Model, and without selecting a first vertical in this document. Recovery/rest is explicitly **not** canonically selected as the first vertical — CARI's own recommendation is acknowledged as advisory only.

---

# 04. Purpose and Product Philosophy — FROZEN

**FITME constrains and informs the model. FITME does not replace the model's general reasoning ability.**

The model is not asked to memorize FITME's product knowledge, nor to substitute for FITME's own deterministic governance. It is asked to reason flexibly, within a bounded, FITME-assembled context, about one already-established coaching Need — producing a proposal, never a decision. That Need is established only after two deterministic, closed, unmodified **pre-reasoning** gates have already run: Evidence Evaluation (Stage 4) and Eligibility Evaluation (Stage 5) — both decide whether reasoning is invoked at all for a given Opportunity; **neither reviews the proposal reasoning subsequently produces** (Chapter 06). Once reasoning is invoked and a proposal exists, everything that proposal must pass — Safety, Prioritization, Decision Formation — is a separate, **post-reasoning** set of gates, likewise deterministic, closed, and already canonically approved (D1/D2/D3, TASK-004/005/006, SL-001, CSR-001); nothing in this Foundation reopens any of them, and the two gate sets are never conflated. This mirrors, at Foundation scale, the same discipline already governing every closed Semantic-User-Understanding vertical in this repository (CSSC-001, EUR-001, USC-001, USP-001): **Statement/Reasoning authority ≠ Decision authority** — the model's output is always Tier-appropriate input to governance, never governance itself, exactly as a user's own raw statement is authoritative as a fact but never as a Decision (D1-ER-01/07, reused here by direct analogy, not reopened).

---

# 05. Reasoning Authority Boundary — FROZEN

Restated and frozen from CARI §7, using CARI's own verified classification, with no change:

| Responsibility | Owner |
|---|---|
| Whether an intervention is appropriate at all (Trust Test, low-coaching-value gating) | **FITME** — `eligibilityEvaluator.js`, unmodified, unmodifiable by this Foundation |
| What concrete action(s) to propose | **AI MAY PROPOSE** |
| How many alternatives to propose | **AI MAY PROPOSE, FITME MUST BOUND** (a ceiling is an engineering/Product constraint, not a model decision) |
| Action parameters (any future dimension beyond `activity`) | **AI MAY PROPOSE, FITME MUST DECIDE** whether/how any such dimension becomes structured — no such dimension is authorized by this Foundation (Chapter 09) |
| Rationale / uncertainty | **AI MAY OWN** — already the required-field pattern on every existing `explanation`/`rationale` shape |
| Whether more information is needed / whether to ask a question instead | **AI MAY PROPOSE** — directly precedented by the one existing G-2 case |
| Whether to recommend no action | **AI MAY PROPOSE, FITME MUST OWN the actual Silence determination** — `decisionFormation.js:formDecisionPassSilence()` remains the sole, unconditional, deterministic mechanism |
| Professional tradeoffs | **UNRESOLVED** at Foundation level — no deterministic professional-validity owner exists anywhere in the repository (ACPI §12); this Foundation does not invent one (Chapter 13, Non-Goals) |
| Ranking among alternatives | **FITME MUST OWN** — `prioritization.js` remains closed, deterministic, unmodified |
| Personalization among alternatives | **UNRESOLVED / FUTURE** — Preference V1's own eventual scope (Chapter 13), not this Foundation's |
| Final user-facing wording | **EXPRESSION MUST OWN**, unconditionally (Chapter 14) |
| Safety disposition | **SAFETY MUST OWN**, unconditionally, regardless of what context the model received (Chapter 11) |

**Frozen principle:** every row above where the model "MAY PROPOSE" produces a candidate value FITME's existing deterministic machinery reviews, never a value trusted directly. No row in this table is altered by any future first-vertical SPEC without a new, explicit Product/Architecture decision.

---

# 06. Pipeline Placement — FROZEN

**Canonical seam:** after a legitimate Need/Opportunity has been established and has already passed both pre-reasoning deterministic gates — Stage 3 detection (a `DetectedOpportunity` already carries a non-null `validReasonCategory`/`contextualMeaning`, per the existing `[G2_SPEC_v1.0.md §21.1]`/`contextualMeaningPolicy.js` discipline), then Stage 4 Evidence Evaluation, then Stage 5 Eligibility Evaluation — and **before** Stage 6 Candidate construction. Evidence and Eligibility decide whether reasoning is invoked at all for this Opportunity; they are never re-applied to review the proposal reasoning subsequently produces (Chapter 04). This is architecturally the same seam `initiativeEngine.js:detectSemanticOpportunities()` already occupies for its one hardcoded case ([initiativeEngine.js:441-494]) — the Foundation extends this seam; it does not relocate it.

**Frozen exclusions, with repository-evidenced rationale (ACPI §6, CARI §4), none reopened by this Foundation:**
- **Not inside Stage 6 (`recommendationEngine.js`/`initiativeEngine.js:generate()`).** Both engines' own headers already state, canonically, that no coaching-content production belongs there (TASK-004/TASK-005, closed). This Foundation does not reopen either decision.
- **Not inside Stage 7/8/9 (`prioritization.js`/`winnerSelection.js`/`decisionFormation.js`).** Each is closed under TASK-006; Candidates are frozen (`Object.freeze`) at construction and never mutated across these Stages — inserting reasoning here would break that invariant.
- **Not inside Stage 10 (Expression).** `deliveryIntentContract.js` already forbids originating decision content (D1-CDO-03); this is exactly the boundary Chapter 14 restates.
- **Not before Opportunity creation.** Would duplicate the Memory Layer's own exclusive Decision-Input-intake ownership (D3 Decision 3).

**Consequence:** Stage 6 producer contracts (`recommendationEngine.js`, `initiativeEngine.js`) require **no signature change** — they already accept a fully-formed `proposedAction`/`explanation` on the `EligibleOpportunity`; this Foundation's reasoning output is exactly that input, populated by a real component instead of a hardcoded literal or an absent one.

---

# 07. Reasoning Context Ownership — FROZEN

**Principle:** a bounded **Reasoning Context** is a projection derived from the existing `pipelineContext` (assembled exclusively by `memoryLayer.js:assembleContext()`, D3 §11.1/Decision 3 — unchanged, not reopened), never the raw `pipelineContext` object itself and never a full user-profile dump.

**Frozen precedent this principle extends, not invents:** `memoryLayer.js:buildExpressionRenderingContext()` ([memoryLayer.js:516-518]) already performs exactly this kind of narrow, purpose-specific, closed projection from `pipelineContext` for Expression's own Stage-10 input. The Reasoning Context is the same architectural move, one stage earlier, for a different closed consumer.

**Frozen minimum content, need-scoped (per CARI §5), drawn only from fields already real today:**
- The originating `DetectedOpportunity`'s own already-assembled `contextualMeaning`/`observation` data (Habit/Pattern signal).
- `pipelineContext.userSafetyContext` / `.userSafetyProvenance` (USC-001/USP-001) — when the Need's domain could plausibly implicate a Safety-relevant activity.
- `pipelineContext.explicitRequestControls` (EUR-001) — always, since direct-user authority must be checkable before or immediately after reasoning (Chapter 12).
- `pipelineContext.goalObjectiveContext` / `.currentStateContext` — only when domain-relevant (nutrition/weight-adjacent Needs), never unconditionally.
- `pipelineContext.feedbackHistory` — bounded to the relevant domain/topic/surface, never the full history, mirroring `feedbackDomain.js`'s own already-scoped query pattern.

**Frozen exclusion:** the full `userProfile` object (`buildBasePrompt()`'s own legacy pattern — weight, age, favorite foods, workout-day count, etc., dumped unconditionally) is explicitly **not** the Reasoning Context's shape. This is the direct, named contrast Chapter 05 of the Product direction requires.

**Frozen extensibility principle:** future personal-understanding signals (communication preferences, coaching-push preference, activities/routines, feedback-derived receptiveness, relationship maturity, learned preferences — CARI §6) may be added to the Reasoning Context projection **additively, only once each has a real, canonically-approved source** (mirroring `relationshipMaturity`'s own current honest `'UNKNOWN'` treatment in `pipelineContext` — never fabricated, never a prerequisite blocking this Foundation). None of these signals is a precondition for V1; CARI §6 confirmed the repository already has sufficient real signal (Habit/Pattern state, Safety context, explicit-request controls, goal/current-state) to prove the architecture without them.

**Provenance/availability semantics preserved, not reinvented:** the Reasoning Context projection carries forward `sourceMemoryId`/`opportunityId`-level provenance exactly as every existing `pipelineContext` field already does, and reports per-field availability using the same `AVAILABLE`/`UNAVAILABLE` convention already established at `pipelineContext.availability` ([memoryLayer.js:484-501]) — no new availability vocabulary is invented.

---

# 08. AI Reasoning Invocation Contract — FROZEN

**Frozen principle: reuse, do not reinvent.** The Foundation's invocation mechanism is the same proven shape already closed four times (USC-001, USP-001, CSSC-001, EUR-001):

- **Input ownership:** the reasoning component owns its own prompt construction, batching (if applicable), and output parsing — exactly as every existing interpreter's header states ("the interpreter itself still owns prompt/model/batching/parsing"). It receives only the already-authenticated `deps.callClaude(body)` closure via `configure({callClaude})` — the same convention at `js/app.js:276-302` — never a live Firebase Auth object, never a new authentication mechanism.
- **Stateless invocation principle:** the component retains no state across calls — confirmed as the existing, unbroken discipline across all four precedent interpreters (CARI §14). No new persistent state is authorized by this Foundation.
- **Provider-independent boundary:** `callClaude` remains a single injected closure, never a direct provider-SDK reference inside the reasoning component — the same boundary `ClaudeProxyClient`/`js/app.js:23` already enforces for every existing caller. This Foundation does not choose or depend on a specific provider's API shape.
- **No provider-session-memory dependency:** each invocation is a single, self-contained request; no thread/session/conversation identifier is passed to or relied upon from the provider (confirmed: `ClaudeProxyClient.send(body, currentUser)` carries none today, and this Foundation introduces none). FITME's own persistent state (Typed Memory, `pipelineContext`, Habit/Pattern state) remains the sole system of record (Chapter 04) — the model receives a fresh, bounded snapshot every time.
- **Timeout/error/fail-closed behavior:** mirrors the existing precedent exactly — a per-call timeout wrapper (`withTimeout()`-equivalent), no retry, and **every** failure mode (no `callClaude` configured, thrown error, timeout, malformed response) degrades to the same outcome: no trusted output produced, never a fabricated substitute (Chapter 09's `NO_VIABLE_PROPOSAL`/equivalent outcome, never silently defaulted to any other outcome).

---

# 09. Minimum Structured Reasoning Output — FROZEN

**Frozen discipline:** the output is derived from already-existing, already-approved shapes — `DetectedOpportunity.proposedAction`/`.explanation` (TASK-004/005), `Candidate.actionIdentity` (MAI-001), and the four precedent interpreters' own closed-vocabulary-plus-fail-closed pattern. **No speculative universal Action schema is authorized.**

**Frozen minimum conceptual structure (field-level naming left to the implementing SPEC, per SFCD's own established delegation pattern — Chapter 16 item 2):**
- A **closed outcome token**, mirroring the two-token precedent already proven (`CLASSIFIED_CURRENT_STATE`/`INELIGIBLE_OR_NOT_CLASSIFIED`), minimally distinguishing at least: an action-proposed outcome, a clarification-needed outcome (directly precedented by the one existing G-2 case), and a no-viable-proposal outcome.
- **Action content** — prose, exactly as `Candidate.action` already is; this Foundation does not structure it further.
- **`actionIdentity`**, where applicable — reused verbatim from MAI-001's existing closed shape (`{activity: <one of the six approved tokens>}`), never extended, never given a richer shape by this Foundation (Chapter 13).
- **Rationale/uncertainty** — mirrors the existing required `explanation.{rationale, evidenceBasis, expectedValue, uncertainty}` shape verbatim; not reinvented.
- **Provenance** to the originating `DetectedOpportunity`/`opportunityId` — mirrors the existing `opportunityProvenance` pattern verbatim.

**Frozen "must never be trusted without validation" principle:** the entire output is validated per the same strict discipline already proven — fail-closed on missing/duplicate/unknown/malformed structure, no partial trust of a well-formed-looking but unvalidated field. An outcome resolving anything other than the closed vocabulary above is treated identically to a validation failure (Chapter 09/16 below).

**Frozen "what survives into Candidate" principle:** only `action` (string) and `actionIdentity` (if produced) survive into a Stage-6 `EligibleOpportunity`'s `proposedAction`/future `actionIdentity` field — **zero new Candidate contract field is authorized by this Foundation**; the existing, already-approved fields are the sole target.

**Frozen failure/fallback semantics (extends CARI §16, no new precedent invented):**

| Condition | Response |
|---|---|
| Timeout / thrown error / malformed structure | No trusted output — equivalent to the existing interpreters' `{}`/empty-result discipline; the originating `DetectedOpportunity` contributes nothing this Decision Pass (mirrors `evidenceEvaluator.js`'s own `INSUFFICIENT`-on-malformed-input discipline) |
| Model states information is insufficient / asks a clarifying question | A legitimate, first-class outcome — directly precedented by the one existing G-2 info-request case, never treated as an error |
| No viable proposal | Resolves toward Decision-Pass-level Silence via the existing, unmodified `formDecisionPassSilence()` path — no new Silence mechanism is authorized |
| Unsupported/malformed `actionIdentity` | Rejected by the existing, unmodified `isValidActionIdentity()` ([activityIdentityVocabulary.js:56-61]) — fail-closed, not coerced |
| All proposals rejected by Safety | Resolves via the existing, unmodified `ALL_DISQUALIFIED` → Silence path ([decisionFormation.js:100-116]) — no new mechanism |
| Output contradicts already-authoritative context (e.g. an activity the user has an active explicit restriction against) | **UNRESOLVED at Foundation level** — repository evidence is insufficient to fix this response today (CARI §16); recorded as an open item for the implementing SPEC (Chapter 16 item 4), not decided here |

**Frozen non-legacy-fallback principle:** no failure mode above resolves to the legacy free-generation Coach path. Every precedent this repository has ever established fails closed to Silence/no-output, never to a less-governed system (CARI §16's own finding, frozen here as a principle).

---

# 10. Alternative Readiness — FROZEN

**Frozen principle:** the Foundation's canonical contract must not lock FITME into "Need → exactly one AI-generated Action" forever, while V1 implementation may legitimately begin with a bounded single-proposal (or small, bounded-count) slice.

**Frozen mechanism shape (concept-level, field naming left to the implementing SPEC):** a **same-Need identity** — a grouping reference distinguishing "these N proposals are alternatives for one Need" from an unrelated coincidence elsewhere in the shared Candidate pool. This is a **new, additive concept** — it does not exist in any closed contract today (verified: `opportunityProvenance` carries `opportunityId`/`sourceCategory`/`detectedAt`/`domain`/`topic`, none of which today distinguishes "alternative of X" from "a different Opportunity that happens to tie in rank," per ACPI §8/CARI §9's confirmed finding). Introducing it is additive to `opportunityProvenance`-adjacent shapes, not a modification of any closed field.

**Frozen rejection of `TIED_SET` for this purpose, restated:** `TIED_SET` ([winnerSelection.js:79-95]) groups Candidates by identical rank across the **entire shared cross-Opportunity pool** via `prioritization.js:compareCandidates()`'s full lexicographic comparator — it has no relationship to "alternatives for one Need," and this Foundation does not repurpose it for that role. A same-Need identity is a materially different, new concept, evaluated independently of ranking-tie status.

**Frozen placement principle:** alternative generation, if built, belongs at the same Chapter 06 seam (pre-Candidate), consistent with ACPI §9's Option C / CARI §9's Option-C-equivalent finding — Safety continues to review each proposal individually (Chapter 11), and Stage 6 producer contracts remain unchanged, each constructing one Candidate per surviving proposal rather than being taught a new multi-output responsibility.

**Frozen V1 boundary:** the implementing SPEC may scope V1 to exactly one proposal per Need without violating this Chapter, provided the same-Need identity concept (or an equivalent forward-compatible placeholder) is present in the contract from the start, so a second proposal is a strictly additive future change, never a rewrite.

---

# 11. Safety Relationship — FROZEN

**Frozen principle, restated from the Product direction verbatim:** providing Safety context to the model before reasoning does **not** make the model the Safety authority.

- The model **may** receive `userSafetyContext`/`userSafetyProvenance` (USC-001/USP-001) as Reasoning Context input where domain-relevant (Chapter 07) — this is prompt-level awareness only.
- Deterministic Safety (`safetyLayer.js:disqualify()`/`finalReview()`, CSR-001/SL-001) **must still, unconditionally, review every resulting proposal downstream**, exactly as it already reviews every Candidate today — no exception, no bypass, regardless of what context the model was given. This restates, without weakening, the existing, closed "production SHALL NOT proceed without a real Safety Layer" principle ([winnerSelection.js:48-51], [decisionFormation.js:142-144]).
- **Frozen precedent for keeping prompt-awareness and deterministic authority structurally separate:** CSSC-001's `situationalContextInterpreter.js` already demonstrates this exact pattern — instructed to "abstain unconditionally" on health/safety-adjacent content at the prompt level, while the actual Safety gate remains entirely outside that module, inside `matchCanonicalSafetyRules()`. This Foundation adopts the same separation, not a new one.
- **Frozen per-proposal review principle:** if multiple proposals exist (Chapter 10), each is reviewed individually by Safety — directly precedented by `disqualify()`'s own existing per-Candidate iteration ([safetyLayer.js:422-425]) — an unsafe alternative is removed without invalidating the others, mirroring existing `winnerSelection.js` removal-without-re-ranking semantics.
- **Frozen non-decision:** whether a rejected proposal may trigger a same-cycle re-proposal request back to the model is **not decided by this Foundation** — no existing contract supports a re-submission loop today, and none is authorized here (Chapter 16 item 5).

---

# 12. Explicit User Request / Existing Authority Relationship — FROZEN

**Frozen principle:** every existing deterministic authority/precedence relationship is preserved unmodified.

- `pipelineContext.explicitRequestControls` (EUR-001) retains its existing, unconditional, direct-user-authority precedence — exactly as it already overrides Initiative Engine Stage-6 Candidate construction today (`explicitlyRequestedAgainst()`, [initiativeEngine.js:244-250,326]). A reasoning-generated proposal is subject to the identical check before it may proceed, never a new or weaker one.
- `wasIgnoredBefore()` (D1-IP-08) and `domainTopicRecentlyUnwelcome()` (RGEF WP7) — both already-closed, inferred-reluctance suppression mechanisms — apply to reasoning-originated proposals exactly as they apply to any other Initiative-kind Opportunity today; this Foundation adds no exception.
- No new authority tier is introduced that could outrank an explicit user statement, Safety, or any other already-closed gate.

---

# 13. Preference Relationship — FROZEN (Preference Itself Remains Paused)

**Frozen status:** Preference V1 remains paused, per the Product direction. This Foundation does not implement it, does not schedule it, and does not modify any Preference-adjacent draft.

**Frozen substrate relationship:** the prior investigation (ACPI §10-11) established that Preference cannot produce real behavior today because no mechanism ever presents more than one alternative for one Need. Chapter 10's same-Need identity, **if and when multiple proposals are actually implemented**, is the mechanism that would first make Preference's own eventual selection role meaningful — Preference would select among already professionally-plausible, already-Safety-reviewed alternatives sharing one same-Need identity, never among Candidates from unrelated Needs (i.e., never via `TIED_SET`, Chapter 10). This Foundation records that relationship for forward compatibility only; it does not design Preference's own selection algorithm, ranking criteria, or data model, all of which remain explicitly future, separately-authorized work.

---

# 14. Expression Boundary — FROZEN (No Change to the Closed Expression Contract)

**Frozen principle, restated without modification:** AI reasoning output is never shown to the user directly and never reaches Expression as raw model output. It first becomes an `EligibleOpportunity`'s `proposedAction` (Chapter 06), then a Candidate (Stage 6, unmodified), then passes Safety (Stage 8/9, unmodified), then is assembled into a `TerminalDecision` (Stage 9, unmodified) — **only then** does Expression (Stage 10) ever see anything related to it, and only in the same closed shape (`TerminalDecision` + `ExpressionRenderingContext`) it already consumes today.

**Frozen non-reopening statement:** `deliveryIntentContract.js` (CD-EXP-01) and `expressionRenderer.js` (CD-EXP-02/03/04) are not touched, extended, or reinterpreted by this Foundation. Expression's existing, closed prohibition on originating or altering decision substance (D1-CDO-03) already fully covers a reasoning-originated proposal exactly as it covers a Candidate today — no new rule is needed, and none is added.

---

# 15. Legacy Coach Distinction and Migration Relationship — FROZEN

**Frozen architectural line**, restated from CARI §12 as canonical:

| Dimension | Legacy Coach (`coachClient.js`, `js/app.js:1318/1520/1559/1601`) | This Foundation |
|---|---|---|
| Context governance | Ungoverned — `buildBasePrompt()` free-assembles whatever profile fields exist | Governed — bounded Reasoning Context projection (Chapter 07), never a profile dump |
| Output trust | Shown to the user directly, unvalidated | Never shown directly; validated, then subject to post-reasoning Candidate/Safety/Decision governance |
| Safety | Prompt-level only, explicitly disclosed as unenforced (LCSC-001) | Prompt-level awareness **plus** unconditional deterministic review (Chapter 11) |
| Decision integration | None — bypasses the Coach Decision System entirely | Full — becomes a real, governed Candidate |
| Session/provider dependency | None currently, but no architectural boundary preventing it | Explicitly frozen against it (Chapter 08) |

**This is the actual, structural difference from "send lots of user context to an LLM and show its answer"** — not a rhetorical one: every one of the five dimensions above is a concrete, already-existing or newly-frozen architectural control, not a policy statement alone.

**Frozen migration relationship:** this Foundation is the retirement path for Legacy Coach's coaching-content responsibilities (action/nutrition/workout/recovery suggestion, per ACPI §8/CARI §12's classification), domain by domain, as real verticals are built on it — consistent with LCSC-001's own already-recorded direction that the legacy path "may continue operating... receives containment and maintenance only... expected to be retired as canonical replacements become available." This Foundation does not itself retire any legacy capability, schedule a retirement date, or remove any legacy code.

---

# 16. Unresolved Product/Architecture Decisions (Carried Forward, Not Decided Here)

Per Chapter 01's own scope discipline, the following remain open and are **not** resolved by this Package — each requires a future, separate Product/Architecture decision before the implementing SPEC can close on it:

1. **First implementation vertical.** Explicitly deferred by Product direction; CARI's Recovery/rest finding remains advisory only and is not adopted here.
2. **Exact field-level naming and shape** of the Reasoning Context projection (Chapter 07), the invocation contract's structured output (Chapter 09), and the same-Need identity concept (Chapter 10) — frozen at the conceptual level only, per the same delegation-to-Readiness-Review pattern SFCD used for USC-001/MAI-001 (SFCD §10).
3. **Whether V1 implements a real multiple-proposal capability or a single-proposal slice with a forward-compatible placeholder identity** (Chapter 10) — both are permitted by this Foundation; the choice is the implementing SPEC's own, subject to Engineering Readiness Review.
4. **The correct response when reasoning output contradicts already-authoritative context** (e.g., proposing an activity the user has an active explicit restriction against) — repository evidence is insufficient to fix this today (Chapter 09); flagged, not decided.
5. **Whether a rejected proposal may trigger a same-cycle re-proposal request** — no existing contract supports this; not authorized, not designed here (Chapter 11).
6. **Which domain(s) the professional-tradeoffs gap (Chapter 05) is addressed for, and how** — this Foundation does not invent a professional-validity engine (Chapter 13/Non-Goals); any such mechanism is separately-scoped, future, unauthorized work.
7. **Whether/when personal-understanding signals** (communication preferences, coaching-push preference, relationship maturity, learned preferences — Chapter 07) gain real sources — none is a V1 precondition; each is separately authorized when built.

**Readiness rule, conditional, not blanket:** item 1 (first implementation vertical) must be resolved before any real vertical's implementation SPEC can be finalized — no implementation SPEC can close Engineering Readiness while its own vertical is undetermined. Once a vertical is selected, whichever of items 2-7 above **materially affects that specific vertical** must also be resolved before that vertical's SPEC can close Engineering Readiness. Any item among 2-7 that is **not** materially relevant to the selected vertical may remain deferred, unresolved, without blocking that vertical's SPEC. This chapter's own conceptual freezes (Chapters 04-15) require no further resolution before vertical selection begins — they are not among the items listed in this chapter.

---

# 17. Explicit Non-Goals — FROZEN

This Foundation explicitly does **not** authorize, and its implementing SPEC(s) may not introduce without a new, explicit Product/Architecture decision:

1. An exhaustive, deterministic situation→response rule system attempting to reproduce general coaching intelligence (the exact pattern this Foundation exists to avoid, per the Product direction).
2. Building, training, or fine-tuning a new AI model — this Foundation integrates an existing, general-purpose model via the existing `callClaude` seam only.
3. A universal Action ontology/schema in V1 — no dimension beyond `actionIdentity.activity` (MAI-001's existing closed shape) is authorized (Chapters 06/09).
4. Any medical diagnosis, treatment, or prognosis system, or any professional-validity engine of any kind — the Chapter 05 "professional tradeoffs: UNRESOLVED" gap is recorded, not filled, by this Foundation.
5. AI-owned Safety authority of any kind — Chapter 11 is absolute and non-negotiable within this Foundation's own scope.
6. AI-owned final Expression — Chapter 14 is absolute; Expression alone renders final user-facing language.
7. Provider-side persistent user memory/session as any part of FITME's system of record — Chapter 08 is absolute; FITME's own persistent state remains sole authority.
8. Legacy-Coach-style unvalidated free generation as any part of this Foundation's own reasoning path — every output is subject to Chapter 09's validation discipline, unconditionally.
9. Implementing Preference V1 — remains paused (Chapter 13).
10. Selecting a first implementation vertical — explicitly deferred (Chapter 16 item 1).

---

# 18. Status and Closure

This chapter distinguishes two separate things that must never be conflated: **(A)** the Product/Architecture *direction* this Package records, approved in conversation prior to this document's first authoring pass; and **(B)** the *canonical closure of this authored artifact itself*. The artifact completed a first Product/Architecture Final Review pass (outcome: CHANGES REQUIRED — four corrections applied) and a second Final Review pass (outcome: **APPROVED**, alongside one further non-blocking Chapter 15 precision correction that did not reopen Final Review). As of this version, (B) is resolved: this artifact is CANONICAL / CLOSED.

## (A) Product/Architecture Direction Already Approved (Recorded, Not Reopened, by This Revision)

- The Product philosophy governing the model's role (Chapter 04).
- The exact reasoning-authority boundary (Chapter 05).
- The canonical pipeline seam and its exclusions (Chapter 06).
- The Reasoning Context ownership principle and its minimum/excluded content (Chapter 07).
- The AI-invocation contract, reusing the existing bounded-interpreter pattern (Chapter 08).
- The minimum structured reasoning output and its failure/fallback semantics (Chapter 09).
- The alternative-readiness principle, including the rejection of `TIED_SET` for this purpose and the same-Need identity concept (Chapter 10).
- The Safety relationship (Chapter 11).
- The Explicit-User-Request/existing-authority relationship (Chapter 12).
- The Preference relationship, with Preference itself remaining paused (Chapter 13).
- The Expression boundary, unmodified from its existing closed contract (Chapter 14).
- The Legacy Coach distinction and migration relationship (Chapter 15).
- The explicit non-goals (Chapter 17).

None of the above is reopened, weakened, or expanded by this revision — this revision's four corrections (Chapter 19) are presentational/precision corrections to how the artifact describes its own status and gate ordering, not changes to this list's substance.

## (B) This Artifact's Own Canonical Status

**Current status: CANONICAL / CLOSED.** This determination follows the second Product/Architecture Final Review pass, whose outcome was APPROVED. The first Final Review pass's outcome (CHANGES REQUIRED) and the four corrections it required remain part of this document's own history (Chapter 19) and are not erased by this closure.

## What This Package Does Not Do

- Does not authorize implementation.
- Does not author any implementation SPEC.
- Does not modify `js/**`, `tests/**`, `index.html`, `sw.js`, the Roadmap, the Changelog, the Architecture document, SL-001, or SFCD.
- Does not select a first implementation vertical.
- Does not implement or schedule Preference V1.
- Does not resolve the open items in Chapter 16.

## Next Step

This Canonical Design is now CANONICAL / CLOSED (see (B) above). The next Product/Architecture step is to **select the first implementation vertical** and resolve whichever Chapter 16 open items materially affect that specific vertical, per Chapter 16's own conditional readiness rule. Only after that may that vertical's own implementation SPEC be authored and finalized, citing this Package.

Neither vertical selection, nor resolution of any Chapter 16 item, nor SPEC authoring is performed by this authoring turn.

---

# 19. Document History

- **v1.0** (initial authoring) — per Head of Product + AI Architect authorization following the Action/Candidate Production Architecture Investigation (ACPI) and the Context-Aware AI Reasoning Architecture Investigation (CARI). Recorded the Reasoning Authority Boundary, Pipeline Placement, Reasoning Context Ownership, AI Invocation Contract, Minimum Structured Reasoning Output, Alternative Readiness, Safety/Explicit-Request/Preference/Expression relationships, the Legacy Coach distinction, and explicit Non-Goals. Introduced no new Product or Architecture decision beyond what was already approved in this conversation prior to authoring. Selected no first implementation vertical (Recovery/rest explicitly not selected, per Product direction). Did not implement Preference V1. This initial version incorrectly described itself as CANONICAL/CLOSED prior to any Final Review — corrected below.
- **v1.0 (Final Review corrections)** — first Product/Architecture Final Review pass, outcome: **CHANGES REQUIRED.** Four corrections applied, all presentational/precision corrections, none reopening or expanding the approved direction: **(1)** corrected the document's own status claim from CANONICAL/CLOSED to FINAL REVIEW — CHANGES REQUIRED, and restructured Chapter 18 to distinguish approved Product/Architecture direction (not reopened) from this artifact's own canonical closure (not yet occurred) — Chapter 01 and the top-of-document status block corrected likewise; **(2)** corrected Chapter 04 and Chapter 06 to explicitly distinguish the two pre-reasoning gates (Evidence Evaluation, Eligibility Evaluation — decide whether reasoning is invoked at all) from the post-reasoning gates (Safety, Prioritization, Decision Formation — review the resulting proposal); the approved Stage-3→6 reasoning seam itself is unchanged; **(3)** replaced Chapter 16's blanket "no item blocks SPEC authoring" statement with a conditional readiness rule: vertical selection is a hard prerequisite for that vertical's own SPEC closure, and only vertical-relevant open items among Chapter 16's remainder must also be resolved before that SPEC can close Engineering Readiness; **(4)** corrected Chapter 18's Next Step to a three-step sequence — this artifact's own Final Review closure, then first-vertical selection plus resolution of vertical-relevant open items, then SPEC authoring. No approved Product/Architecture decision (Chapters 04-15, 17) was removed, weakened, or expanded. No first vertical was selected. Preference V1 remained paused.
- **v1.0 (Final Approval / Canonical Closure)** (this version) — second Product/Architecture Final Review pass, outcome: **APPROVED.** One further, non-blocking precision correction applied, which did not reopen Final Review: Chapter 15's Legacy Coach comparison table wording ("subject to Stage 5-9 governance unmodified") corrected to "subject to post-reasoning Candidate/Safety/Decision governance," removing any implication that the reasoning proposal re-passes Stage 5 after generation. Canonical closure performed: the document's own status (title, top status block, Chapter 01 Review State, Chapter 18(B)) updated from FINAL REVIEW — CHANGES REQUIRED to **CANONICAL / CLOSED**; Chapter 18's Next Step updated to reflect completed closure — the next Product/Architecture step is to select the first implementation vertical and resolve whichever Chapter 16 open items materially affect it. No approved Product/Architecture decision (Chapters 04-15, 17) was removed, weakened, or expanded. No first implementation vertical was selected. No Chapter 16 open item was resolved. Preference V1 remains paused. No implementation SPEC was authored. No other repository file (Roadmap, Changelog, Architecture, code, tests) was modified by this closure.
