
# FITME — SAFETY FOUNDATION CANONICAL DESIGN
## v1.0 — CANONICAL (Freezes A/B/C Decomposition and Prerequisite Product/Architecture Decisions; No Implementation SPEC Authored Yet)

> **Document role:** Decision Package (Canonical Design). Not a SPEC. Not an implementation document. Modeled structurally on `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (SLDP) and `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md` (G2DP) — the repository's established precedent for a standalone Canonical Decision Package that freezes Product/Architecture decisions ahead of implementation-SPEC authoring, rather than deciding them inline inside a SPEC.
> **Prepared by:** Lead Engineer / Repository Analyst / Repository Maintainer, recording decisions presented as approved by the Head of Product + AI Architect across this conversation, without reinterpretation.
> **Repository baseline:** `main` @ `65dd7ec817d3ef9c4c3a8bf6d738b4cbb00b12e5` (== `origin/main` at authoring time).
> **Origin:** This Package follows a sequence of four Head-of-Product-authorized investigations conducted after LCSC-001's closure: (1) the Safety Foundation Repository Architecture Investigation (User Safety Context / Canonical Safety Rules / Structured Action Safety Semantics / Real Safety Matching — result: FOUNDATION PATH PARTIALLY CONFIRMED, PD-SF-01 through PD-SF-07 fixed); (2) the Minimum Safety Action Identity Architecture Investigation (result: MINIMAL NEW IDENTITY REQUIRED, AD-SF-01 through AD-SF-05 approved, initial activity vocabulary fixed); (3) the Safety Foundation Work-Item Decomposition Report (result: TWO WORK ITEMS RECOMMENDED — A and B independent, C dependent on both — APPROVED, with a stated practical build order A → B → C); and (4) this authoring turn, which freezes the decisions from (1)-(3) into one canonical reference document ahead of authoring Work Item A's implementation SPEC.
> **Purpose of this version:** Freeze the Product/Architecture decisions already approved in this conversation so that A's, B's, and C's implementation SPECs can each cite this Package rather than re-litigating architecture already decided. This Package introduces **no new Product or Architecture decision** beyond what was already approved prior to this authoring turn.
> **Status of this version:** CANONICAL — records SF-DECOMP-01 and the scope freezes for Foundations A, B, and C as CLOSED (approved prior to this authoring turn). Does not itself authorize implementation of A, B, or C — see Chapter 11 (Status and Closure).

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| SL-001 | Safety Layer Spec v1.0 (DONE/CLOSED) | `docs/specs/SL-001_SPEC_v1.0.md` |
| SLDP | Safety Layer Canonical Decision Package v2.5 (Closed) | `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| EUR-001 | Explicit User Request V1 Spec (DONE/CLOSED) | `docs/specs/EUR_001_SPEC_v1.0.md` |
| LCSC-001 | Legacy Coach Safety Containment Spec (DONE/CLOSED) | `docs/specs/LCSC_001_SPEC_v1.0.md` |
| RGEF | Relationship-Guided Engagement Foundation | `js/feedback/feedbackDomain.js` (implemented, WP1-WP8) |
| SFCD | This document | `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` |
| RM | Roadmap | `docs/roadmap/Roadmap.md` |
| CL | Changelog | `docs/roadmap/Changelog.md` |

Citation format used throughout: `[ABBR, ref]` for prose documents, `[filename:LineN]` for code, `[conversation, investigation name]` for decisions recorded verbally in this conversation and not yet in any repository document prior to this Package.

---

# 01. Status

## Purpose

Establish the working status of this Package before its content is read, so its content is never mistaken for an already-authored implementation SPEC, a completed implementation, or an authorization to implement.

## Canonical Interpretation

This Package freezes, in one place, the Product and Architecture decisions the Head of Product + AI Architect has already approved for the Safety Foundation initiative: the A/B/C Work-Item decomposition and its dependency graph and build order (Chapter 04); Foundation A's canonical scope (Chapter 05); Foundation B's canonical scope, including the initial activity vocabulary (Chapter 06); Foundation C's canonical scope (Chapter 07); and a set of cross-cutting positions that apply to all three (Chapter 08). It does this so that each Work Item's own implementation SPEC can cite this Package instead of re-deriving or re-approving the same architecture.

## Explicit Non-Interpretations

This Package does not author, and is not, an implementation SPEC for Foundation A, B, or C. It does not authorize implementation of any of the three. It does not modify SL-001, the SLDP, the Coach Bible, the Constitution, the Roadmap, or the Changelog. It introduces no new Product or Architecture decision beyond what this conversation already approved prior to this authoring turn — where a decision remains open, this Package records it as open (Chapter 09) rather than deciding it. It does not reopen or redesign SL-001, EUR-001, or LCSC-001.

## Repository Gaps

None introduced by this chapter. Foundation A, B, and C themselves each remain unimplemented as of this Package's authoring — see Chapter 10.

---

# 02. Purpose

This Package exists because the Safety Foundation initiative required several architecture-level decisions before any implementation SPEC could be authored without inheriting unresolved ambiguity: what the smallest durable Action identity should be, whether it should live inside or beside the Candidate contract, how the resulting work should be decomposed into Work Items, and what belongs in scope versus explicitly out of scope for the first vertical. Those decisions were made across three sequential investigations (Chapter 03). This Package records them canonically, once, so that Work Item A's SPEC — the next document to be authored — inherits a stable, cited foundation rather than re-arguing architecture already settled.

---

# 03. Background — The Investigation Series

## Investigation 1 — Safety Foundation Repository Architecture Investigation

Investigated, at repository-evidence level, whether a User Safety Context, Canonical Safety Rules, Structured Action Safety Semantics, and Real Safety Matching could be built on the current repository. Result: **FOUNDATION PATH PARTIALLY CONFIRMED — DECISIONS REQUIRED.** Product fixed **PD-SF-01 through PD-SF-07** in response (recorded in this conversation; not independently re-stated here since no repository document existed yet to carry them — they are carried forward into this Package's Chapters 04-08 as already-approved input).

## Investigation 2 — Minimum Safety Action Identity Architecture Investigation

Investigated the narrower, prerequisite question: the smallest durable structured Action identity that lets Safety distinguish RUNNING from other workout actions, without prematurely building the full future Action Model and without creating a throwaway schema that would conflict with future Action Generation. Result: **MINIMAL NEW IDENTITY REQUIRED.** The investigation's own recommended architecture (a Safety-only side-channel, "Option C") was **explicitly rejected** by Product/Architecture review; instead, five Architecture Decisions were approved, **AD-SF-01 through AD-SF-05** (verbatim, Chapter 06), together with a Product Decision fixing the **initial activity vocabulary** (RUNNING, WALKING, CYCLING, SWIMMING, STRENGTH_TRAINING, PADEL — Chapter 06).

## Investigation 3 — Safety Foundation Work-Item Decomposition Report

Investigated how the three confirmed foundation areas (User Safety Context; Minimum Candidate-attached Action Identity; Canonical Safety Rule Content + first real Safety Matching) should decompose into Work Items. Result: **TWO WORK ITEMS RECOMMENDED** — Foundation A and Foundation B as independent Work Items, Foundation C as a third, dependent, integration Work Item. **APPROVED**, with a stated practical build order: A, then B, then C (Chapter 04) — an execution-order choice, not a newly-introduced architectural dependency between A and B.

---

# 04. Canonical Decomposition — SF-DECOMP-01

**SF-DECOMP-01 — A/B/C Work-Item Decomposition, Dependency Graph, and Build Order — RESOLVED**

- **Decision Statement:** Approved. The Safety Foundation initiative decomposes into exactly three canonical Work Items:
  - **A — User Safety Context V1**
  - **B — Minimum Action Identity V1**
  - **C — Canonical Safety Rule V1 + Real Matcher**

  A and B are **independent foundations** — neither's contract depends on the other existing first, and no architectural dependency exists between them. C **depends on both A and B being closed** — C is the first point in the system that reads A's output and B's output together, and cannot be authored, implemented, or closed until both exist.

  **Practical build order:** A, then B, then C. This is a stated execution-order choice, not an architectural dependency between A and B — either could in principle be built first, or in parallel, without changing any contract.

- **Canonical Rationale:** Recorded in the Work-Item Decomposition Report (Investigation 3, Chapter 03 above): A and B touch disjoint files, have disjoint upstream sources (A reads Typed Memory via a new class-specific interpreter; B is a Candidate-contract and vocabulary-module change), and neither's closure criteria reference the other. C is the sole two-parent join in the dependency graph. Combining A, B, and C into fewer Work Items was explicitly rejected — not on efficiency grounds but because it risks unclear ownership, excess coupling, and an implementation SPEC too large to review cleanly (per the Head of Product's own explicit instruction not to optimize for fewer Work Items).
- **Approval Evidence:** Head of Product + AI Architect, review of the Work-Item Decomposition Report — approved in full, including the stated execution order.
- **Documents Affected:** None yet — this is the first repository document to record SF-DECOMP-01. Implementation SPECs for A, B, and C will each cite this chapter.
- **Consequences:** Work Item A's implementation SPEC may be authored next (Chapter 11). Work Item C's implementation SPEC may not be authored until both A and B are closed.
- **Backward Compatibility:** N/A — no prior canonical decomposition existed for this initiative.

---

# 05. Foundation A — Canonical Scope — User Safety Context V1

**Responsibility (frozen):** Hold and expose the durable record of what the user has explicitly, literally told the system about their own restrictions, as a structured, queryable fact — nothing more.

**Explicit non-responsibilities (frozen):**
- No diagnosis, clinical inference, treatment, prognosis, severity inference, or invented recovery timeline. The first semantic class remains **explicit/literal user-reported Safety restrictions only** — a scoping boundary carried forward unchanged from Investigation 1's own PD-SF decisions and reaffirmed at each subsequent investigation.
- No knowledge of Candidate/Action Identity shape — A has no dependency on B (SF-DECOMP-01).
- No safety disposition decision — that remains Foundation C's and the existing, unmodified Safety Decision Matrix's responsibility.
- No persistence of any AI-derived interpretation as new memory.

**Governing principle — Statement authority ≠ Interpretation authority (reaffirmed, not newly decided):** The user's raw statement is Path-A authoritative and remains retrievable via `sourceMemoryId`. Any structured Safety Context record derived from it is Tier-5/Inference — non-authoritative, never persisted as new memory, always recomputed fresh from Typed Memory each Decision Pass. This is the same discipline already governing CSSC-001 and EUR-001 (D1-ER-01/07, D1-MU-01); Foundation A adopts it unmodified rather than defining a new mechanism.

**Safety Context as a derived projection (frozen):** The Safety Context record A exposes is explicitly a **derived projection** of authoritative `userStated` Typed Memory — never a second, competing source of truth, and never itself treated as user-stated fact independent of the memory record it was recomputed from.

**Temporal literal restrictions (frozen framing):** A user-stated literal temporal qualifier (e.g., "for two weeks," "until it heals") may be captured as an attributed literal field if and when Work Item A's own SPEC defines it — but A never computes its own expiry or "still valid" inference; the system invents no timeline the user did not state. This framing was recorded as guidance in Investigation 2's report; whether A's V1 scope actually includes a temporal field at all remains an open Product decision (Chapter 09, item 2) — not decided here.

**Vocabulary dependency (frozen, sequencing note):** A's restricted-activity token may reference Foundation B's activity vocabulary once B exists, or use a provisional representation until B lands — this sequencing choice is a Work-Item-A-SPEC-level decision, not decided in this Package, and does not create an architectural dependency of A on B (SF-DECOMP-01 already establishes A and B are independent).

---

# 06. Foundation B — Canonical Scope — Minimum Action Identity V1

**AD-SF-01 — Action Identity Belongs to the Candidate/Action Representation (verbatim, approved):**
> "The minimum Action Safety Identity will be Candidate-attached. Safety is a consumer of Action semantics. Safety does NOT own Action identity. Do NOT design a Safety-only parallel side-channel as the canonical solution."

**AD-SF-02 — Structured, Extensible Identity Object (verbatim, approved):**
> "Architectural direction: Candidate → actionIdentity → activity identity. Conceptually: `actionIdentity: { activity: RUNNING }`. This is architectural direction, NOT authorization for this exact field name/schema yet. The purpose of using an object rather than a flat scalar is to allow later canonical extension into richer Action semantics without replacing the identity representation. Do NOT add richer semantics now."
>
> Out of scope for this foundation: duration, intensity, quantity, food identity, body-area/load, recovery demand, other full Action Model semantics.

**AD-SF-03 — Safety Does Not Own the Activity Vocabulary (verbatim, approved):**
> "The activity identity vocabulary must be independent of: safetyLayer.js, Safety Context Interpreter, individual Safety rules. It represents what the action IS, not whether it is safe."

**AD-SF-04 — Do Not Extend Domain→Topic Vocabulary (verbatim, approved):**
> "Domain/Topic identifies the decision/coaching subject. Activity identity identifies the concrete action modality/activity. These are separate semantic layers. Do not modify `domainTopicVocabulary.js` to add RUNNING/WALKING/etc."

**Initial Activity Vocabulary (Product decision, frozen):**
```
RUNNING
WALKING
CYCLING
SWIMMING
STRENGTH_TRAINING
PADEL
```
This does not authorize Safety rules for all six — it establishes a genuine, reusable Activity Identity vocabulary, not a one-value RUNNING-specific flag. The list is closed as stated; it is not to be expanded without further evidence/authorization.

**Full Action Model remains out of scope (frozen):** Foundation B builds the minimum identity only — duration, intensity, quantity, food identity, body-area/load, recovery demand, and any other full Action Model semantics remain explicitly future, out-of-scope work, not to be introduced under Foundation B.

**Candidate contract integration (frozen framing, per Investigation 2's findings, accepted without correction by Product/Architecture review):** `actionIdentity` is an **optional** top-level field on Candidate — absent/`null` for every Candidate that reports no activity, including the existing, live FOOD_LOGGING Candidate, which is unaffected. Vocabulary ownership belongs to a new, standalone module, independent of Safety (AD-SF-03) and independent of `domainTopicVocabulary.js` (AD-SF-04).

**Stage 9 propagation (frozen per AD-SF-05, see Chapter 07):** Explicitly may be deferred for Work Item B — not silently bypassed, but deliberately handled later, per AD-SF-05.

---

# 07. Foundation C — Canonical Scope — Canonical Safety Rule V1 + Real Matcher

**Prerequisite (frozen, SF-DECOMP-01):** C requires both A's and B's contracts to already be closed and real — C is the first consumer of both together.

**AD-SF-05 — Do Not Use a Safety Side-Channel to Hide the Existing Decision-Formation Propagation Gap (verbatim, approved):**
> "The fact that Candidate.action currently disappears before Terminal Decision is an architectural gap, not a pattern to preserve. For the first Safety vertical, Stage 8 can potentially consume Candidate-attached Action Identity directly. Whether/how Action Identity must later survive Stage 9 → Terminal Decision → Expression will be handled deliberately, not bypassed with a temporary Safety-only representation."

**First integration point (frozen):** C is explicitly recorded as the **first** point in the system where A's Safety Context and B's Action Identity are read together — this is not incidental to C's scope, it is C's defining characteristic (SF-DECOMP-01).

**First vertical scope (frozen, unchanged from Investigation 2/3):** explicit user-reported restriction against RUNNING + Candidate activity identity RUNNING. No medical contraindication rules are to be invented under Foundation C.

**Existing DEFERRED semantics remain authoritative (frozen):** SL-001's existing `DEFERRED` disposition continues to mean genuine insufficient information — used when A's Safety Context is genuinely absent/unknown for the relevant activity. A **known** conflict (a literal, explicit restriction matched against the exact activity a Candidate reports) is a known incompatibility, not an unknown, and must not be softened into `DEFERRED`.

**SL-001 remains CLOSED (frozen):** `[SL-001, Status line]` — *"DONE / CLOSED — implemented, tested, reviewed, approved, and closed (2026-08-05)."* Foundation C extends `matchCanonicalSafetyRules()`'s own existing, disclosed, honestly-empty stub (`return [];`, SL-001's own approved gap) with real logic. Foundation C does not reopen, redesign, or amend SL-001's own closed `RiskType`/`EvidenceConfidence`/`Correctability`/`Urgency` enums or its ordered Safety Decision Matrix — it supplies real matched-rule data into an already-correct, already-closed mechanism. Stage 8/9 contracts (`disqualify()`/`finalReview()` signatures) are preserved unchanged.

---

# 08. Cross-Cutting Canonical Positions

**Preference and Action Generation remain downstream and out of scope (frozen):** Neither the paused User Preference V1 investigation nor the FOUNDATION-GAP Personalized Alternative Selection / Action Generation investigation is reopened, advanced, or assumed by this Package. Foundations A, B, and C are designed for future compatibility with eventual Action Generation (per Investigation 2's own Part 7 findings — AD-SF-02's nested-object shape exists specifically to allow this) but do not implement, authorize, or depend on it.

**No new engine, no new pipeline Stage, no new Terminal Decision type (frozen, consistent with prior precedent — G2DP CD-G2-03, LCSC-001):** None of A, B, or C introduces a new Coach Decision System Stage, a new Candidate family, or a new Terminal Decision type. A adds a class-specific interpreter (the same architectural skeleton already used four times: CSSC-001, EUR-001, and now A). B adds an optional Candidate field and a standalone vocabulary module. C supplies real logic into an existing, already-typed stub.

**Existing scope-purity and staging discipline continues to apply (frozen, standing instruction, unchanged):** exact-path staging only when staging is later authorized; full regression run and reported before any closure claim; repository verified against `origin/main` before and after any push; no SPEC authored, no file modified, no commit/push without explicit authorization — none of which this Package itself performs.

---

# 09. Unresolved Product Decisions (Carried Forward, Not Decided Here)

Per the Work-Item Decomposition Report's own Section 10, the following remain open and are **not** resolved by this Package:

1. Which SL-001 disposition (most plausibly `BLOCKED`, Product's call) and which `RiskType`/`Correctability`/`Urgency` values apply to Foundation C's first rule (a literal RUNNING restriction matched against a RUNNING Candidate). Does not block A's or B's SPEC authoring; must be resolved before C's SPEC is authored.
2. Whether Foundation A's Safety Context record carries a user-stated literal temporal qualifier field in V1, or defers that entirely to a later Work Item.
3. Whether Foundation B's vocabulary module should structurally reserve room for eventual reconciliation with `js/app.js`'s existing, unrelated `workoutType` transient variable, or remain fully independent of it.

---

# 10. Unresolved Architecture Decisions (Carried Forward, Not Decided Here)

Per the Work-Item Decomposition Report's own Section 11, the following remain open and are **not** resolved by this Package:

1. Exact field name/shape for the new `pipelineContext` Safety Context field, and the exact module path/name for Foundation B's vocabulary table and Foundation A's interpreter — none of this is authorized yet, only the conceptual shape (AD-SF-01/AD-SF-02).
2. Whether Foundation A's interpreter is a genuinely new file, or an additive classification inside an existing interpreter module — to be settled by Work Item A's own Engineering Readiness Review, not assumed here.
3. Exact shape of Foundation C's rule-content data structure — deferred to Work Item C's own SPEC, to be designed against A's and B's real, closed contracts rather than provisional ones.

**No decision recorded in this chapter or Chapter 09 blocks authoring Work Item A's implementation SPEC next**, consistent with the Recommended Build Order already approved in Investigation 3.

---

# 11. Status and Closure

## What This Package Freezes (CLOSED as of this version)

- SF-DECOMP-01 — the A/B/C decomposition, dependency graph, and A → B → C build order.
- Foundation A's canonical scope (Chapter 05): explicit/literal-only, derived-projection framing, Statement authority ≠ Interpretation authority, no clinical inference.
- Foundation B's canonical scope (Chapter 06): AD-SF-01 through AD-SF-04, the six-value initial activity vocabulary, full-Action-Model exclusion.
- Foundation C's canonical scope (Chapter 07): AD-SF-05, first-integration-point framing, DEFERRED-vs-known-conflict distinction, SL-001-closed framing.
- The cross-cutting positions in Chapter 08.

## What This Package Does Not Do

- Does not authorize implementation of A, B, or C.
- Does not author any implementation SPEC.
- Does not modify SL-001, the SLDP, the Coach Bible, the Roadmap, or the Changelog.
- Does not resolve the open items in Chapters 09-10.

## Next Step (per the approved Recommended Build Order)

Author Work Item A's ("User Safety Context V1") implementation SPEC, citing this Package. Not performed by this authoring turn.

---

# 12. Document History

- **v1.0** (this version) — initial authoring. Records SF-DECOMP-01 and the canonical scope freeze for Foundations A, B, and C, per Head of Product + AI Architect approval across the Safety Foundation Repository Architecture Investigation, the Minimum Safety Action Identity Architecture Investigation, and the Work-Item Decomposition Report. Introduces no new Product or Architecture decision.
