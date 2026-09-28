# FITME — GENERAL CONTEXT AND USER KNOWLEDGE FOUNDATION — AMENDMENT A1
## v1.0 — CANONICAL / CLOSED (Application-Ready Invariant; Semantic Context Discovery Output, Descriptor and Catalogue Generalization; Selection Precedes Invocation)

**Repository path:** `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A1_v1.0.md`

**Document role:** Canonical amendment to `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` (CANONICAL / CLOSED; hereafter **GCUK**). GCUK's own file is not edited. From this amendment's approval onward, the GCUK chapters listed in §03 are read together with, and where stated replaced by, the text below. Authored together with `docs/specs/WP0_PHASE_E_0_2B_SEMANTIC_CONTEXT_DISCOVERY_SPEC_v1.0.md` (hereafter **E.0.2b SPEC**); the two are reviewed as one unit, and the E.0.2b SPEC is written against GCUK as amended here.

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`, Evidence Classification):** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** wording proposed for canonical approval; **[INFERENCE]** engineering inference; **[GAP]** missing repository evidence.

**Repository baseline:** `main` @ `ad6203c89c08139935efdd2122e8388871788601` (== `origin/main`) **[VERIFIED]**.

---

# 01. Identity, Status, and Authority

- Deliverable: **GCUK Amendment A1.**
- Status: **CANONICAL / CLOSED** — approved by Product/Architecture together with the E.0.2b SPEC, and closed with E.0.2b's final closure (implemented, verified, calibrated). Authoring it modified no file under `js/**`, `tests/**`, `functions/**`, `index.html` or `sw.js`.
- Authority: every **[CANON]** statement below records a binding Product/Architecture decision taken in the Product/Architecture review that accepted the Application-Readiness Architecture Audit (decisions 1–13 of that review, hereafter **PA-1 … PA-13**). The canonical wording of those decisions is **[DESIGN]** until this amendment is approved; the decisions themselves are not reopened here.
- This amendment introduces no Product or Architecture decision beyond PA-1 … PA-13.

---

# 02. Purpose, Scope, and Non-Goals

**Purpose.** GCUK froze Semantic Context Discovery (Ch.07) as provider-id selection over an eligibility-bounded catalogue. Three later investigations (E.0.2b repository investigation; semantic information needs vs provider selection; Application-Readiness Architecture Audit) found that this contract is correct for *authority* but insufficient for FITME's open-world, application-ready product intent, in four specific places. This amendment corrects exactly those four places, and nothing else:

| # | Gap in GCUK as closed | Amendment |
|---|---|---|
| A | No canonical statement that FITME's core is platform-agnostic; the only native-portability canon (C1 §14.3/§27) predates the Coach Decision System | §04 — Application-Ready Invariant (Ch.04 invariant 21) |
| B | Ch.07 output is limited to "a subset of exactly those presented ids": the model cannot express useful information no presented source provides; the descriptor is framed provider-only | §05 — Ch.07 extension (source-agnostic descriptor, `informationNeeds`, `selectedIds`, skip/failure semantics) |
| C | Ch.14/Ch.15 do not state whether a candidate's information must already exist before selection; the current implementation assembles all provider values eagerly | §06 — Selection Precedes Invocation |
| D | GCUK Ch.06 permits `contextCeiling` "transitionally", but nothing prevents a discovery contract from defining its catalogue *as* `contextCeiling ∩ authorized`, which would make the ceiling permanent | §07 — Authorized Catalogue definition |

**Non-goals (binding, PA-13).** This amendment does not design or authorize: a ToolRegistry or Tool Gateway; any external/native source (HealthKit, Health Connect, location, calendar, wearables, Internet or web retrieval, external APIs); runtime source-availability or OS-permission state; data-leaving governance; lazy/selection-gated Memory Layer reads; retirement of `contextCeiling`; the core-hosting decision; any User Knowledge implementation (E.0.2c–g). Each is recorded in §10 as future canonical work, not solved.

---

# 03. Chapters Affected

| GCUK chapter | Action |
|---|---|
| Ch.04 Product Intent and Binding Invariants | Invariant 21 added (§04). Invariants 1–20 unchanged. |
| Ch.05 Authority Model | One clarifying paragraph added (§08). Unchanged otherwise. |
| Ch.07 Semantic Context Discovery | Replaced in full (§05). |
| Ch.14 Consolidation and Bounded Retrieval | One paragraph added (§06). Unchanged otherwise. |
| Ch.15 Relationship to Existing Components | Rows for `ContextComposer`, `ContextRelevancePlanner`, `ContextFragmentProvider` contract and `MemoryLayer` amended (§06.3). Other rows unchanged. |
| Ch.16 Bootstrap Behavior | One sentence amended (§05.8). |
| Ch.17 Failure Behavior | Replaced in full (§05.7). |
| Ch.19 Privacy and Consent | One paragraph added (§08). |
| Ch.22 Remaining SPEC-Level Decisions | Item 4 marked resolved by the E.0.2b SPEC (§09). |
| Ch.23 Implementation Sequence | E.0.2b line replaced (§09). |
| Everything else | Unchanged. In particular Ch.06's four eligibility dimensions, Ch.08–13, Ch.18, Ch.20, Ch.21 and Ch.25 are untouched. |

---

# 04. Ch.04 — Added Invariant 21: Application-Ready Invariant — [CANON decision PA-1; DESIGN wording]

Appended to GCUK Ch.04's Frozen Content:

> **21. Application-Ready Invariant.** FITME's core — OpenUnderstanding, Need, capability resolution, User Knowledge, Semantic Context Discovery, General Reasoning, Safety, and governance/authorization — is platform-agnostic. It depends only on injected, contract-defined inputs and never on a delivery shell's APIs, storage, lifecycle, clock, permission prompts, credentials or vendor SDKs. Platform- and vendor-specific acquisition, runtime permission, credential and presentation mechanisms connect to the core only through governed adapters beneath existing core contracts (`ContextFragmentProvider` and its successors, `StateAccess`, the injected model-call seam). An adapter may report availability and supply data; it may never define or alter semantic meaning, relevance, eligibility or authorization rules, or Safety. The current Web/PWA is a delivery shell, not the target platform. Moving FITME between Web, iOS, Android or any future platform requires new adapters, never a new core.

**Precedent (cited, not reopened).** `docs/specs/C1_SPEC_v1.0.md` (CANONICAL / CLOSED) §14.3 *Native Equivalence Standard* ("Can the module run under Node tests without DOM, browser globals, Firebase, or service worker?") and §27 *Native Migration Contract* ("Same canonical data and trigger must yield the same domain result regardless of PWA or native shell") already establish this discipline for the modules C1 extracted **[VERIFIED]**. Invariant 21 extends the same principle, by reference, to the Coach Decision System and to every GCUK-governed component, which C1 predates. C1 itself is not amended; its §27 module lists remain as closed.

**Verification test (binding for every core module authored under GCUK).** The C1 §14.3 test applies: a core module must load and run under `node --test` with no DOM, browser global (other than the repository's standard `if (typeof window !== 'undefined') window.X = API` export line), browser storage, service worker, `navigator`, direct `fetch`, or Firebase reference. Current state: all 45 `js/coachDecisionSystem/*.js` modules satisfy it **[VERIFIED — zero such tokens by repository-wide grep; the full suite, 3391 tests, runs the pipeline under Node]**.

**Explicit non-interpretations.**
- Invariant 21 does not decide where the core executes (device, server, or hybrid). That is recorded as future work (§10 item 13).
- Invariant 21 does not make any current Web adapter canonical. Firestore paths, the Firebase compat SDK, `sessionGeneration`, the in-memory profile snapshot, and host-clock "today" remain implementation details, never canonical contracts.
- Platform runtime permissions (for example a health-data, location or calendar grant) are availability/authorization *state* supplied through adapters and evaluated by the eligibility layer. They are never consent scopes named by content, and never semantic relevance (§08).

---

# 05. Ch.07 — Semantic Context Discovery — REPLACEMENT TEXT — [CANON decisions PA-2 … PA-5, PA-8, PA-9, PA-12; DESIGN wording]

GCUK Ch.07 "Frozen Content" is replaced in full by §05.1–§05.8.

## 05.1 Definition

Semantic Context Discovery is FITME's single, bounded, advisory planning step that, for one Need being reasoned about by one resolved capability, determines **what information could materially help** and **which already-authorized sources to consult**. It is one step serving every present and future information catalogue (internal context providers, User Knowledge, and future governed native/device, Internet and external-API sources). FITME never runs a separate AI relevance step per source type or per catalogue.

It distinguishes, canonically, two things:

- **Semantic information need** — open, model-inferred description of information that could help. Zero authority.
- **Authorized source selection** — a choice among sources the deterministic eligibility layer has already authorized. It can lead to invocation only after deterministic re-validation.

## 05.2 Inputs

Exactly two inputs, both bounded:

1. The Need's own open semantic fields (`openScopeDescription`, `openEntityMentions` — OU-001 §14). Discovery never reinterprets the raw turn text (OU-001 §15).
2. The **authorized catalogue** (§07): a presented, per-call, closed list of source descriptors (§05.3).

Discovery never receives, reads or interprets consent state, platform/OS permission state, connection state, OAuth grants, credentials, `capabilityRiskTier`, `sensitiveContextAccessPolicy`, `sensitivityTier` values or any data a source holds. It receives only the result of deterministic authorization, in the form of which descriptors are present (PA-9).

## 05.3 Source-Agnostic Semantic Descriptor

Every catalogue entry is presented as `{id, description, relevanceTags}`:

- `id` — an opaque identifier, meaningful only as a membership key.
- `description` — a static, engineering-authored, platform-neutral statement of **what information the governed source can provide and its relevant limits** (for example scope, recency, provenance or completeness). It is the same concept for every kind of governed source: internal context providers first, and in future User Knowledge catalogue entries and governed native/external source declarations.
- `relevanceTags` — the existing coarse `CONTEXT_RELEVANCE_KINDS` governance metadata (GCUK Ch.04 invariant 5), unchanged.

A description **must**:
- describe information, never implementation technology. *Good:* "Sleep duration and stages recorded by the user's device." *Bad:* "HealthKit HKCategoryTypeSleepAnalysis."
- be static text, never containing live data or user data.

A description **must never** encode: when the source is relevant; a scenario, situation, activity, food, place or life-event rule; a source→Need, source→capability or source→source mapping; domain-specific routing; a platform, vendor, SDK or API name.

A source without a valid description is never presented to discovery. It may still reach reasoning through deterministic inclusion (for example `contextBaseline`).

This amendment does not create a universal source or invocation registry. The descriptor is a *field contract* adopted by each governed-source contract in turn; `ContextFragmentProvider` is the first adopter (E.0.2b SPEC).

## 05.4 Outputs

One bounded model call produces two outputs, which are validated independently:

1. **`selectedIds`** — ids proposed from the presented catalogue. After deterministic **call-scoped membership validation** (every id must be a literal member of *that call's own* presented list; unknown, hallucinated or duplicate ids are silently dropped, never a whole-call failure), the surviving ids are proposals only. They are re-validated by the same final deterministic authorization chokepoint every other selection mechanism passes through (WP0 Phase E.0.2a Activation Amendment §06 step 5 and §08: `ContextRelevancePlanner.select()`'s final filter). Only ids that survive that chokepoint may be invoked.
2. **`informationNeeds`** — a bounded list of short, open-text descriptions of information that could materially help answer the current Need, whether or not any presented source provides it (for example "current local weather", "recent recovery and sleep quality", "recent training load", "today's schedule"). Open-world: no closed vocabulary, no kind/category field, no source reference.

## 05.5 `informationNeeds` Has Zero Authority — [CANON PA-2, PA-3]

An information need is a semantic statement, never a permission and never a source request. It:

- grants no permission, consent, network access, device access or tool access;
- cannot create, name, register or select a source;
- cannot bypass, widen or influence eligibility or authorization;
- cannot cause any retrieval, invocation, fetch or external action by itself;
- is never persisted — as User Knowledge, Typed Memory, telemetry, logs or any other durable record;
- is never an input to Safety and never Safety authority;
- is never presented to the user as a claim that FITME has, or lacks, any access.

An unmet information need remains unmet. FITME never matches an information need to a source by any means that could confer access; the only path by which information reaches reasoning is authorized source selection (§05.4 item 1) or deterministic inclusion.

## 05.5a `informationNeeds` Lifecycle — [CANON, Product/Architecture clarification]

| Stage | Scope | Status |
|---|---|---|
| **Production** — Semantic Context Discovery produces validated, bounded, zero-authority `informationNeeds` and exposes them on the discovery/composition result | **E.0.2b** | Authorized (E.0.2b SPEC) |
| **Reasoning consumption** — a reasoning capability (first: General Reasoning) uses unmet `informationNeeds` to reason about uncertainty, missing context, or clarification | **Deferred** — General Reasoning activation/integration scope | Requires its own separately authorized canonical step; not authorized by this amendment |
| **Other consumers** — for example a user-mediated source/permission flow | **Deferred** | Each requires its own separately approved SPEC |

Binding on every future consumer: consuming an information need may shape reasoning, uncertainty statements or a clarifying question, but **never turns an information need into retrieval, invocation, source selection, eligibility, consent, permission or any other authority**. Information reaches reasoning only through authorized source selection (§05.4 item 1) or deterministic inclusion, regardless of what any information need says. Until a consumer is authorized, `informationNeeds` is not injected into any reasoning prompt.

## 05.6 Safety Exclusion — [CANON, unchanged in substance from GCUK Ch.07/Ch.19]

A source whose `relevanceTags` include `SAFETY_AND_MEDICAL`, or whose `sensitivityTier` is `SAFETY_ADJACENT` (WP0 Phase E.0.2a §05.1), or any User Knowledge record with `safetyFlag: 'SAFETY_ADJACENT'` (Ch.09), is never presented to discovery — either condition alone excludes it. Its existence is never revealed to the discovery model. It may still reach reasoning only through deterministic, `reasoningAccessAuthorized`-gated inclusion (Ch.06). Phase D's independent, unconditional Candidate-level Safety characterization is unaffected either way.

## 05.7 Ch.17 — Failure and Skip Semantics — REPLACEMENT TEXT

GCUK Ch.17 is replaced in full by:

> Any failure of Semantic Context Discovery — no model access configured, transport error, timeout, malformed or unparseable output — yields **empty `selectedIds` and empty `informationNeeds`**. A partially valid output keeps only its individually valid items (§05.4). Discovery never introduces a deferral, refusal, retry or clarification mode of its own, and nothing it produces is ever placed in `requiredContext`, so it can never make a capability non-viable. After any discovery outcome, `ContextRelevancePlanner.select()`'s deterministic mechanisms (baseline, `needShapeDefaults`, tag overlap) and its final authorization filter proceed unchanged. The same rule governs User Knowledge retrieval (Ch.14).
>
> Discovery is **skipped deterministically, with no model call**, when the capability being composed does not opt into discovery, or when the Need carries no open semantic fields. A skipped discovery has the same effect as an empty one. An empty authorized catalogue is **not** by itself a skip condition for a discovery-enabled capability, because information needs remain meaningful when no authorized source exists. The exact opt-in mechanism is SPEC-level.

## 05.8 Ch.16 — Bootstrap — Amended Sentence

In GCUK Ch.16, "Semantic Context Discovery reasoning over static, authored provider descriptions (Ch.07, no learning required)" is read as "Semantic Context Discovery reasoning over static, authored, source-agnostic descriptors of the authorized catalogue (Ch.07 as amended by A1, no learning required)".

---

# 06. Ch.14 / Ch.15 — Selection Precedes Invocation — [CANON PA-6, PA-7; DESIGN wording]

## 06.1 Ch.14 — Added Paragraph

> **Selection precedes invocation.** Semantic selection occurs before any source is invoked for reasoning. The retrieval contract must not assume that a candidate source's information already exists, or has already been assembled, at selection time. Invoking a selected source is an asynchronous, governed read that may be backed by an internal read, a platform adapter, or a server adapter. An existing eagerly assembled internal source (today: every registered `ContextFragmentProvider`, which reads the Memory Layer's already-assembled Pipeline Context) remains fully valid under this rule — eager assembly is an implementation choice for a given source, never an assumption of the discovery or selection contract.

## 06.2 Adapter Boundary

> Platform/server adapter → governed source (semantic descriptor + governance metadata) → deterministic eligibility/authorization → Semantic Context Discovery → selection → governed invocation → reasoning. Adapters sit strictly beneath the governed-source contract; the core never references a platform or vendor implementation (Invariant 21).

## 06.3 Ch.15 — Amended Rows

| Component | Relationship (amended) |
|---|---|
| `ContextComposer` | Extended: gains the optional `description` field on providers, a deterministic authorized-catalogue builder, and an injected, optional discovery step invoked before `ContextRelevancePlanner.select()`; its provider catalogue and `requiredContext` semantics are unchanged. Invocation of a selected source is asynchronous (already true of `invokeProvider()`, `contextComposer.js:148-159` **[VERIFIED]**). |
| `ContextRelevancePlanner` | Extended additively: one optional input carrying validated discovery `selectedIds`, unioned with its existing mechanisms before its unchanged final ceiling + authorization filter. Remains synchronous and AI-free (binding, tested: `tests/contextRelevancePlanner.test.js:127-144` **[VERIFIED]**). It never receives `informationNeeds`. |
| `ContextFragmentProvider` contract | Extended additively: optional `description` (§05.3), the first adoption of the source-agnostic descriptor. |
| `MemoryLayer` | Unchanged in this amendment; remains the sole Pipeline Context assembly authority. Whether and how a selected source may perform a lazy, selection-gated read under Memory Layer's authority (for example by delegation) is recorded as future canonical work (§10 item 2). Nothing in this amendment requires or authorizes it. |

---

# 07. Authorized Catalogue — Canonical Definition — [CANON PA-8; DESIGN wording]

> The Semantic Context Discovery catalogue is **the set of source descriptors that the deterministic eligibility/authorization layer has made eligible for this capability, this user, and the current state**, minus sources already included deterministically for the same composition, minus Safety-excluded sources (§05.6), minus sources without a valid description (§05.3).

- The long-term canonical catalogue is **never** defined as `contextCeiling ∩ authorized`.
- **Current implementation boundary:** `contextCeiling` is still enforced by `ContextRelevancePlanner.select()` (`contextRelevancePlanner.js:84-85`, `:119` **[VERIFIED]**) as the outer bound of the eligibility layer's output. The E.0.2b implementation must preserve that behavior unchanged; the catalogue it builds is therefore computed today from the ceiling-bounded authorized set. That is a property of the current eligibility implementation, not of the discovery contract.
- `contextCeiling` is transitional debt (GCUK Ch.06, Ch.21 item 2). Its retirement must be separately authorized, and must occur before the first new native/device or external source is registered (§10 item 1). Retiring it must require no change to the discovery contract.
- Future runtime source-availability, connection or platform-permission state (§10 items 3–4) shrinks or expands this catalogue only through the eligibility layer, never through discovery.

---

# 08. Ch.05 / Ch.19 — Added Clarifications — [CANON PA-3, PA-9, PA-10]

**Ch.05, appended paragraph.**

> **Semantic need is not authority.** The AI may reason openly about *what information* could be useful, including information no current source provides. FITME deterministically governs *which sources exist, which are currently available and authorized, and which may be invoked*. An inferred need ("current weather could matter") never implies access ("FITME has Internet access"). Only an independently authorized source may satisfy a need.

**Ch.19, appended paragraph.**

> **Consent principle and runtime authorization.** Ordinary information the user voluntarily shares with FITME remains governed by the general personalization/memory consent (WP0 Phase E.0.2a Activation Amendment §09.1, unchanged). FITME never creates per-topic permissions. Platform or source grants — for example a health-data, location or calendar permission, or an OAuth connection — are runtime/platform/source authorization *states*, supplied through adapters and evaluated by the eligibility layer. They are never content-named consent scopes (never `FOOD_PERMISSION`, `SLEEP_PERMISSION`, `TRAVEL_PERMISSION` or similar), and never semantic relevance. How such state enters eligibility is future canonical work (§10 items 3–4); the extension seam is that eligibility, not discovery, consumes it.

---

# 09. Ch.22 / Ch.23 — Amended Items

- **Ch.22 item 4** ("Whether `ContextRelevancePlanner.select()` gains its new union member in place, or via a sibling function") — resolved at SPEC level by the E.0.2b SPEC (§12 there: an optional fifth parameter, in place).
- **Ch.23 E.0.2b line**, replaced by: "**E.0.2b** — Source-agnostic semantic descriptor (first adopted by `ContextFragmentProvider`), deterministic authorized-catalogue builder, and the Semantic Context Discovery interpreter producing validated `selectedIds` and zero-authority `informationNeeds` (Ch.07 as amended by A1). Lands implemented and testable, not live; no production model-call delta."
- Ch.23's Phase E activation preconditions are unchanged.

---

# 10. Future Canonical Work — Recorded, Not Solved — [CANON PA-13 and review decision 18]

Each item below requires its own future, separately approved canonical decision or SPEC. None is authorized by this amendment. Order is not a priority ranking.

1. Retiring `contextCeiling` (before the first new native/device or external source).
2. Memory Layer lazy / selection-gated reads (reconciling Selection Precedes Invocation with D3 Decision 3's sole-assembly authority and CARF Ch.07's projection principle).
3. Runtime `sourceAvailabilityState` (connection/availability) as an eligibility input. GCUK Ch.06 freezes eligibility as four dimensions; adding one requires a Ch.06 amendment. It is a process dimension, not a content taxonomy.
4. OS/platform permission integration into that state.
5. Data-leaving governance (sending user-derived data, including query text or location, to any third party).
6. The external source / tool contract, including AI-authored invocation arguments.
7. ToolRegistry / Tool Gateway. The only repository references are code comments citing the missing `docs/specs/WP0_SPEC_v1.0.md` (`contextRelevancePlanner.js:22-26`, `capabilityRegistry.js:161-163`) **[GAP]**.
8. Internet / web retrieval.
9. HealthKit / Health Connect.
10. GPS / device location.
11. Calendar.
12. Wearables.
13. Core hosting decision: device, server, or hybrid.
14. Server proxy request allowlist (the proxy currently forwards request bodies verbatim, `functions/index.js:117-123` **[VERIFIED]**).
15. User-timezone model ("today" currently derives from the host clock, `js/core/dateUtils.js:12-17` **[VERIFIED]**).
16. Splitting `js/memory.js` (Typed Memory domain logic currently shares a module with DOM UI) **[VERIFIED]**.
17. Extending C1's reusable-module lists to cover the Coach Decision System (C1 is closed; this becomes a new record, not a C1 edit).
18. Consumers of `informationNeeds` (reasoning consumption at General Reasoning activation/integration; clarification; user-mediated source/permission flows) — bounded by §05.5a: never retrieval authority.

Previously deferred items remain deferred and unaffected: dogfood c01 / TRR routing (OU-001 §24 follow-up 1); Safety malformed-output / unavailable fail-open defect (MRE-001 §20); model-output parse-failure observability (MRE-001 §21); OU-001 GAP-4 (TRR composition receives `{}`).

---

# 11. Consistency Self-Review

Checked explicitly against each document; result recorded rather than assumed.

| Document | Check | Result |
|---|---|---|
| GCUK Ch.04 invariants 1–20 | Invariant 21 adds a platform principle; no invariant is narrowed. Invariant 3 ("semantic relevance never grants authorization") is strengthened by §05.5/§08. | No conflict. |
| GCUK Ch.05 | Ordering "deterministic eligibility before any AI reasoning about relevance" preserved: the catalogue is built before the call; `informationNeeds` is not shaped like a permission and invents no provider. | No conflict. |
| GCUK Ch.06 | Four dimensions unchanged. Future availability dimension recorded as requiring an amendment (§10 item 3), not introduced. `contextCeiling` stays transitional (§07). | No conflict. |
| GCUK Ch.07 (original) | Superseded text: "proposes a subset of exactly those presented ids" is retained as `selectedIds`; the membership check, Safety exclusion and empty-on-failure are retained verbatim in substance. `informationNeeds` is additive. | Replacement is a strict superset. |
| GCUK Ch.14 | "One retrieval architecture serves both raw provider context and consolidated User Knowledge" — generalized, not contradicted, by §05.1. | No conflict. |
| GCUK Ch.15 `MemoryLayer` row | Unchanged; lazy reads deferred (§06.3, §10 item 2). Selection Precedes Invocation holds for today's eager providers. | Recorded tension, not a conflict (§10 item 2). |
| GCUK Ch.17 | Replacement adds skip semantics and the empty-catalogue rule; failure behavior unchanged in substance. | No conflict. |
| GCUK Ch.19 | Safety exclusion unchanged. Consent principle restated, not narrowed. | No conflict. |
| CARF Ch.07/Ch.08 | Reasoning context stays bounded; each model invocation stays single and self-contained; no loop is introduced. | No conflict. |
| C1 SPEC §14.3/§27 | Cited as precedent only; C1 not reopened. | No conflict. |
| WP0 E.0.2a SPEC + Activation Amendment | The final filter at `contextRelevancePlanner.js:118-123` remains the non-bypassable chokepoint (Amendment §08); its §14 E.0.2b compatibility statement ("source its list directly from the now-authorized ceiling") describes the current implementation and is consistent with §07's transitional reading. Status headers of both E.0.2a documents are stale (see §12). | No behavioral conflict. |
| OU-001 | Discovery consumes the Need's open fields only (OU-001 §15); OpenUnderstanding stays a record of what the user communicated, with no information-need inference added to it (OU-001 §07, PA-12). | No conflict. |
| MRE-001 | A new model-output parse site will use the shared envelope normalizer (E.0.2b SPEC §09). | No conflict. |

---

# 12. Repository Gaps and Canonical Conflicts

- **[GAP]** `docs/specs/WP0_SPEC_v1.0.md` is cited throughout `js/coachDecisionSystem/**` headers (including for ToolRegistry, External Retrieval and Phase F) but is absent from the working tree and git history (OU-001 §17). This amendment cites none of it.
- **[GAP]** GCUK Ch.06 (`:146`) and the E.0.2a SPEC (`:42`) cite a "New Source Principle" in GCUK Ch.19; Ch.19 contains no such principle. The closest canonical text is GCUK Ch.04 invariant 19. This amendment does not define it; recorded for a future cleanup.
- **Documentation drift (not a conflict; E.0.2a treated as CLOSED per Product/Architecture review decision 19):** the status lines of `WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md` (line 2, §26) and `WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md` (line 2, §19), and the header of `js/coachDecisionSystem/eligibilityPolicy.js` (`:12-16`, "SHADOW-MODE ONLY"), predate the activation commit `21f15de`. Required cleanup: update those status lines and that header comment only, in a separate documentation-only change with no behavioral content. Not performed here.
- **Canonical conflicts:** none found.

---

# 13. Status and Closure

**CANONICAL / CLOSED.** GCUK is read as amended by this document. Its first implementation, WP0 Phase E.0.2b, is CLOSED (E.0.2b SPEC §29 Closure Record: implemented, 3428/3428 deterministic, AC-CAL-1 … AC-CAL-4 PASS). The model-quality observations recorded there (language of `informationNeeds`, over-selection, catalogue echo, marginal selection instability) are accepted as non-gating and do not amend this document. Every §10 item remains deferred.

# 14. Document History

- **v1.0** (initial authoring) — Records Product/Architecture decisions PA-1 … PA-13 from the review accepting the Application-Readiness Architecture Audit. Authored at baseline `ad6203c`.
- **v1.0** (Product/Architecture clarification, approval-in-principle round) — Added §05.5a, the `informationNeeds` lifecycle: production is E.0.2b scope; reasoning consumption is deferred General Reasoning activation/integration scope; no future consumer may turn a need into retrieval authority. §10 item 18 aligned. No other change.
- **v1.0** (final closure) — Status CANONICAL / CLOSED, recorded together with E.0.2b's final closure. No content change.
