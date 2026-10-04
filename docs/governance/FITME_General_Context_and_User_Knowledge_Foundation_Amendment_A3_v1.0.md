# FITME — GENERAL CONTEXT AND USER KNOWLEDGE FOUNDATION — AMENDMENT A3
## v1.0 — AUTHORED — READY FOR PRODUCT / ARCHITECTURE CANONICAL REVIEW (Governed Consumers; Governed Sources; One Authorization Architecture)

**Repository path:** `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A3_v1.0.md`

**Document role:** Canonical amendment to `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` (CANONICAL / CLOSED; hereafter **GCUK**), read together with Amendment A1 (`…_Amendment_A1_v1.0.md`, CANONICAL / CLOSED; hereafter **A1**) and Amendment A2 (`…_Amendment_A2_v1.0.md`, CANONICAL / CLOSED; hereafter **A2**). GCUK's, A1's and A2's own files are not edited. From this amendment's approval onward, the GCUK chapters and A1 sections listed in §03 are read together with, and where stated replaced by, the text below.

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** wording proposed for canonical approval; **[INFERENCE]** engineering inference; **[GAP]** missing repository evidence.

**Repository baseline:** `main` @ `f06e1270784402e574cb0658c7fde4e5e93eae4f` (== `origin/main`) **[VERIFIED]**.

---

# 01. Identity, Status, and Authority

- Deliverable: **GCUK Amendment A3.**
- Status: **AUTHORED — READY FOR PRODUCT/ARCHITECTURE CANONICAL REVIEW.** Not yet canonical. Authoring it modified no file under `js/**`, `tests/**`, `functions/**`, `index.html`, `sw.js` or `firestore.rules`, and no closed canonical document.
- Authority: every **[CANON]** statement below records the Product/Architecture decision taken after the E.0.2d read-only investigations at this baseline (hereafter **A3-1 … A3-7**):
  - **A3-1** — Option A approved: source eligibility is generalized from *capability + user + authorization state* to *governed consumer + user + authorization state*.
  - **A3-2** — A reasoning Capability is one type of governed consumer; a governed background process is another, without pretending to be a Capability and without becoming routable.
  - **A3-3** — One unified authorization architecture; no consumer-specific (including Consolidation-specific) eligibility mechanism; no consumer-id allowlist; no consumer×source matrix; no new universal registry.
  - **A3-4** — Source-specific authorization remains mandatory; learning consent never grants a protected source; platform/source grants remain separate authorization state; protected/native sources fail closed until the A1 §10 runtime-authorization dimension exists.
  - **A3-5** — Authorization is evaluated deterministically and silently; existing valid authorization is reused for its normal lifetime; absent authorization makes a source unavailable; user-facing permission requests occur only through the appropriate product/platform authorization flow, never automatically per turn or per use; the AI never grants itself access.
  - **A3-6** — Becoming a governed consumer grants no Safety-adjacent authority; Safety-derived User Knowledge stays fail-closed until a separate Safety-authority ruling.
  - **A3-7** — No existing Capability, provider, routing or eligibility behavior changes.
- The wording is **[DESIGN]** until this amendment is approved; the decisions themselves are not reopened here. This amendment introduces no Product or Architecture decision beyond A3-1 … A3-7.

---

# 02. Purpose, Scope, and Non-Goals

**Purpose.** GCUK Ch.06 computes source eligibility "for a given capability + user + consent-state". WP0 Phase E.0.2d (Consolidation, A2 §10.1) is a governed background process that must read governed sources but is not a Capability. The implemented policy already depends only on declared governance metadata: from the source, `sensitivityTier` and `consentScope` (`eligibilityPolicy.js:47-55`); from the capability, a validated `capabilityRiskTier` (`:48`, well-formedness only, E.0.2a §05.2) and `sensitiveContextAccessPolicy` (`:66`); and the user's authorization state (`:51-56`). It never reads `provider.id` or `capability.id` (E.0.2a §10) **[VERIFIED]**. Only the canonical wording ties eligibility to Capabilities. This amendment generalizes that wording so every future governed consumer uses the same, single authorization architecture.

**Scope.**
1. Canonical definitions of *governed consumer* and *governed source* (§04).
2. Ch.06 replacement text (§05).
3. Authorization state, the protected-source fail-closed rule and the authorization user experience (§06).
4. Safety-adjacent authority for governed background consumers (§07).
5. Invariant 26 (§08), Ch.15 rows (§09) and the A1 §10 clarification (§10).

**Non-goals (binding).** This amendment does not author the E.0.2d SPEC or any SPEC; does not implement anything; does not change `eligibilityPolicy.js`, `capabilityRegistry.js`, `contextComposer.js`, `contextRelevancePlanner.js`, `consentScopeRegistry.js` or any test; does not change any existing Capability, provider, `contextCeiling`, routing, discovery or eligibility result; does not add an eligibility dimension (the runtime-authorization dimension stays A1 §10 items 3–4 future work); does not define a platform-permission or user-mediated authorization flow; does not create a universal source, consumer or invocation registry; does not register any source or consumer; does not retire `contextCeiling`; does not change the Consent Scope Registry or the Product Consent Principle (E.0.2a Activation Amendment §09.1); does not change Safety canon; does not change A1 §07's discovery catalogue definition.

---

# 03. Chapters and Sections Affected

| Target | Action |
|---|---|
| GCUK Ch.04 Product Intent and Binding Invariants | Invariant 26 added (§08). Invariants 1–25 unchanged. |
| GCUK Ch.06 Policy-Based Provider Eligibility | Frozen Content replaced (§05). The four dimensions and their authority roles are retained. |
| GCUK Ch.15 Relationship to Existing Components | `CapabilityRegistry` and `ContextFragmentProvider` rows amended; governed-background-consumer row added (§09). Other rows unchanged. |
| GCUK Ch.19 Privacy and Consent | Read with §06 (authorization user experience); A1 §08's consent/runtime-authorization paragraph unchanged. |
| A1 §10 items 1, 3, 4 | Clarified to apply to every governed consumer (§10). |
| Everything else, including A1 §07, A2, the E.0.2a SPEC and its Activation Amendment | Unchanged. The E.0.2a documents are the implemented instance of this contract for the Capability consumer type. |

---

# 04. Definitions — [CANON A3-1, A3-2, A3-3; DESIGN wording]

## 04.1 Governed consumer

> A **governed consumer** is a FITME component, approved through its own Architecture-reviewed governed declaration, that may receive content from governed sources for a declared purpose. Eligibility is always computed for one governed consumer, one user and that user's authorization state.

Governed-consumer types:
1. **Reasoning Capability** — declared by its `CapabilityDeclaration` and registered in `CapabilityRegistry`, exactly as today. Its existing fields already constitute its consumer governance declaration (§04.3). Nothing about Capabilities changes.
2. **Governed background process** — a component that runs outside a user turn under its own approved SPEC (first instance: E.0.2d Consolidation). It is declared by that SPEC, is **never** registered in `CapabilityRegistry`, is never a `CapabilityDeclaration`, and is never reachable by `CapabilityRegistry.resolveCapability()` (`capabilityRegistry.js:281`) **[VERIFIED]** or by any Need routing.

A new consumer type requires a canonical decision; a new consumer of an existing type requires only its own approved declaration.

## 04.2 Governed source

> A **governed source** is any source of contextual information exposed through a governed-source contract that declares the source governance fields of §04.4. `ContextFragmentProvider` is the first such contract (GCUK Ch.06/Ch.15; E.0.2a §06). Later contracts (for example an observation-source contract for a governed background process) adopt the same fields, following the field-contract adoption pattern of A1 §05.3.

GCUK Ch.06's "provider" is read as "governed source". No universal source registry is created (A1 §05.3, unchanged).

## 04.3 Consumer governance fields (shared, closed, self-declared)

Every governed consumer declares, about itself, inline in its own governed declaration, with **no implicit default**:

| Field | Values | Meaning (unchanged from E.0.2a) |
|---|---|---|
| `capabilityRiskTier` | `STANDARD` / `ELEVATED` (`CAPABILITY_RISK_TIERS`) | The consumer's reasoning/processing **breadth**. Validated for well-formedness inside eligibility and otherwise reserved; it never decides sensitive-context access (E.0.2a §05.2). The field name is retained for every consumer type so that no implementation or test changes. |
| `sensitiveContextAccessPolicy` | `AUTHORIZED` / `NOT_AUTHORIZED` (`SENSITIVE_CONTEXT_ACCESS_POLICIES`) | Whether the consumer may receive content from `SAFETY_ADJACENT` sources (E.0.2a §09, §11). Subject to §07 for governed background consumers. |

A declaration missing either field, or carrying a value outside its closed set, makes the consumer ineligible for every source (fail-closed). For Capabilities this is already enforced at registration (`capabilityRegistry.js` `validateDeclaration`, E.0.2a §09) **[VERIFIED]**; every other consumer type's SPEC must enforce it no later than evaluation, and eligibility's own membership checks already resolve a malformed tier to `false` (`eligibilityPolicy.js:48`) **[VERIFIED]**.

## 04.4 Source governance fields (unchanged)

Every governed source declares `sensitivityTier` (`STANDARD` / `SAFETY_ADJACENT`) and `consentScope` (`null` or a Consent Scope Registry id), exactly as E.0.2a §05–§07 defines them for `ContextFragmentProvider`, and a platform-neutral `description` where it is presented to discovery (A1 §05.3).

## 04.5 What is forbidden

- A consumer-id or source-id rule, allowlist or denylist in any eligibility decision.
- A consumer×source matrix, or any per-consumer list of sources as an authorization mechanism. (`contextCeiling` remains Capability-only transitional debt, GCUK Ch.06/Ch.21; it is never introduced for any other consumer type.)
- A second or consumer-specific eligibility policy, including one specific to Consolidation.
- A universal consumer registry. Each consumer type keeps its existing declaration home (`CapabilityRegistry` for Capabilities; the approving SPEC for governed background processes).
- Any AI, discovery, `informationNeeds` or semantic-relevance input to eligibility (GCUK Ch.05; A1 §05.5, §08).

---

# 05. Ch.06 — Frozen Content, Replacement Text — [CANON A3-1, A3-3, A3-7; DESIGN wording]

GCUK Ch.06's two Frozen Content paragraphs are replaced by:

> A governed source is registered once per genuinely new technical source (schema adapter, consent, privacy classification — Ch.19's "New Source Principle"), declaring closed, deterministic governance metadata: sensitivity tier, required consent scope, and, where applicable, `relevanceTags` (the existing, unchanged `CONTEXT_RELEVANCE_KINDS`). **Eligibility for a given governed consumer + user + authorization state is computed from the source's declared metadata, the consumer's declared governance fields and the user's authorization state by one deterministic policy function, never read from a hand-maintained per-consumer array and never decided by consumer or source identity.** Adding a consumer never requires editing any source; adding a source never requires editing any consumer. A reasoning Capability and a governed background process are evaluated by the same policy. `contextCeiling` MAY remain, transitionally and for Capabilities only, as an explicit outer cap while the policy path is authoritative beneath it.
>
> **The eligibility policy's dimensions remain frozen as four orthogonal, deterministic fields — `sensitivityTier`, `consentScope`, `capabilityRiskTier` (declared by every governed consumer as its breadth tier), and `reasoningAccessAuthorized`** — never as a fifth, content-shaped taxonomy. The first three gate whether a source is eligible for a consumer/user/authorization state at all. `reasoningAccessAuthorized` is a distinct, additional dimension governing whether an already-eligible `SAFETY_ADJACENT` source may be made available to the consumer for its declared purpose — for a reasoning Capability, to *reasoning* (Ch.07/19), exactly as before. It is set only by deterministic privacy/consent/governance logic from the consumer's declared `sensitiveContextAccessPolicy`, and can never be set, inferred or granted by AI reasoning, by Semantic Context Discovery, or by any consumer at runtime. The existence and authority role of these four dimensions is canonical; their exact policy values and evaluation rules remain implementation-SPEC-level (Ch.22; E.0.2a). Adding a fifth dimension (for example runtime source-authorization state, A1 §10 item 3) still requires a Ch.06 amendment.

---

# 06. Authorization State, Protected Sources and User Experience — [CANON A3-4, A3-5; DESIGN wording]

## 06.1 Two separate kinds of authorization state

1. **Learning consent** — the general personalization/memory consent (`LEARNED_MEMORY_PERSONALIZATION`, E.0.2a Activation Amendment §09.1, unchanged). It authorizes FITME to learn from and use what the user shares. It never grants access to a protected source (§06.2).
2. **Source/platform authorization** — runtime/platform/source grants (for example health-data, location or calendar permission, or an OAuth connection), supplied through adapters and evaluated by the eligibility layer, never content-named consent scopes (A1 §08, Ch.19 paragraph, unchanged).

A consumer that also persists learned knowledge (for example E.0.2d) needs **both**: learning consent for what it persists, and source eligibility for what it reads. Neither substitutes for the other. Authorization state must be a genuine, correctly derived input for every consumer — never a hardcoded value (E.0.2a Activation Amendment §09 principle, generalized).

## 06.2 Protected sources fail closed

> A **protected source** is a governed source whose information is obtained through a platform permission, a device sensor, an account connection or OAuth grant, or any other runtime source authorization, or whose invocation sends user-derived data outside FITME (A1 §10 item 5). Until the runtime-authorization dimension (A1 §10 items 3–4) is defined by a Ch.06 amendment and implemented, **a protected source is ineligible for every governed consumer**, and none may be registered as eligible for any consumer. Learning consent, `consentScope: null`, a Capability's `contextCeiling`, semantic relevance and AI output can never make a protected source eligible.

This rule is required in addition to A1 §07's "retire `contextCeiling` before the first new native/device or external source": governed consumers other than Capabilities have no `contextCeiling` and must not rely on one.

Whether a source is protected is a governance property of its technical integration, decided once at its registration review — never a property of the information's topic (A1 §08: never `FOOD_PERMISSION`, `SLEEP_PERMISSION` and the like).

## 06.3 Authorization user experience (binding)

1. The AI may determine semantically that a source could be useful (for example an unmet `informationNeed`). That determination has zero authority (A1 §05.5).
2. Deterministic governance alone decides whether a consumer may receive a source, on each use, silently, from the current authorization state.
3. Existing valid authorization — learning consent or a source/platform grant — is reused for its normal lifetime (for example until withdrawn, revoked or past `expiresAt`, as `eligibilityPolicy.js:55` already honours) **[VERIFIED]**. It is not re-requested per turn, per use or per consumer.
4. If a required authorization does not exist, the source is simply unavailable to that consumer; the consumer proceeds without it (GCUK Ch.17 failure semantics).
5. A user-facing permission request may be initiated only through the appropriate product/platform authorization flow, when useful, under its own separately approved SPEC (A1 §05.5a "user-mediated source/permission flow", deferred) — never automatically on every turn or every source use, and never by a governed background process on its own initiative.
6. The AI can never grant itself access, request a grant as a side effect of reasoning, or treat a semantic need as permission.

---

# 07. Safety-Adjacent Authority for Governed Background Consumers — [CANON A3-6; DESIGN wording]

1. Becoming a governed consumer grants nothing. Every authorization still flows from §04.3–§06.
2. A governed background consumer that produces durable User Knowledge (first instance: E.0.2d Consolidation) **must declare `sensitiveContextAccessPolicy: 'NOT_AUTHORIZED'`** until a separate Safety-authority ruling decides whether, and under which governance, User Knowledge may be derived from Safety-adjacent or Safety-owned content. Until then, `SAFETY_ADJACENT` sources are ineligible for it by the unchanged policy (E.0.2a §11), and Safety-derived User Knowledge remains fail-closed.
3. Safety-owned content that reaches such a consumer by any other route (for example Safety-governed Typed Memory records, or literal text owned by a Safety intake) is governed by that consumer's own SPEC under the same fail-closed default; this amendment grants no exception.
4. No Safety module reads User Knowledge and User Knowledge never becomes a Safety input (E.0.2c SPEC §24; A2 invariant 25) — unchanged.
5. Reasoning Capabilities are unaffected: their existing `sensitiveContextAccessPolicy` declarations and behaviour are unchanged.

---

# 08. Ch.04 — Invariant 26 — [CANON A3-1, A3-3; DESIGN wording]

> **26. One authorization architecture for every governed consumer.** Every FITME component that receives governed source content — a reasoning Capability, a governed background process or any future consumer type — is authorized by the same deterministic eligibility policy from declared source governance metadata, declared consumer governance fields and the user's authorization state. No consumer has its own eligibility mechanism, identity-based allowance or per-source list as authority; learning consent never grants a protected source; and no AI output, semantic relevance or consumer runtime action ever grants access.

---

# 09. Ch.15 — Amended and Added Rows — [CANON A3-2, A3-7; DESIGN wording]

| Component | Relationship (amended / added) |
|---|---|
| `CapabilityRegistry` (`capabilityRegistry.js`) | Unchanged. A registered Capability is one governed-consumer type; its `CapabilityDeclaration` is its consumer governance declaration (§04.3). Non-Capability governed consumers are never registered here and never routable. This Package still concerns only what optional context a consumer may see, never how a Capability is matched. |
| `ContextFragmentProvider` contract | Unchanged in shape. It is the first governed-source contract (§04.2); its `sensitivityTier`/`consentScope`/`description` fields are the shared source governance fields. |
| Governed background consumers (added; first: E.0.2d Consolidation) | Declared by their own approved SPEC with the §04.3 fields; evaluated by the unchanged eligibility policy; subject to §06 and §07; never a Capability; no `contextCeiling`. |

---

# 10. A1 §10 — Clarification — [CANON A3-4; DESIGN wording]

A1 §10 items 1, 3 and 4 are read as applying to every governed consumer, not only to Capabilities:
- Item 1 (`contextCeiling` retirement) remains a Capability-only transitional matter; it is not a precondition that any other consumer type may rely on (§06.2).
- Items 3–4 (runtime `sourceAvailabilityState`; OS/platform permission integration) define the authorization state that every governed consumer's eligibility will read. Until they exist, §06.2 applies.

No other A1 §10 item changes.

---

# 11. Effect on Existing Behaviour — [VERIFIED at baseline]

- `eligibilityPolicy.js` already computes exactly the §05 policy for its second argument's declared `capabilityRiskTier` and `sensitiveContextAccessPolicy`; it needs no change.
- The production callers remain `trrCapabilityAdapter.js:196` and `generalReasoningCapability.js:333`; `tests/wp0PhaseE02aZeroDriftProof.test.js:104-118` continues to pin exactly those two.
- Every registered provider (`trrCapabilityAdapter.js:120`; `generalReasoningCapability.js:124-125`) and both Capability declarations are unchanged; `contextCeiling` and `ContextRelevancePlanner.select()` (`contextRelevancePlanner.js:90`) are unchanged.
- Therefore every eligibility, routing, discovery and composition result is byte-identical. No consumer other than the two Capabilities exists.

**Consequence for the first non-Capability consumer (recorded for its SPEC):** a module other than the two Capability adapters that requires `eligibilityPolicy.js` will need the SPEC-authorized extension of the pinned requirer list in `tests/wp0PhaseE02aZeroDriftProof.test.js`, and its SPEC must define how its declaration is validated (§04.3) and how genuine authorization state reaches it off-turn (§06.1).

---

# 12. Deferred — Recorded, Not Solved

1. The runtime-authorization dimension and platform-permission integration (A1 §10 items 3–4), including its representation of "protected source" state.
2. Data-leaving governance (A1 §10 item 5) and the external source/tool contract (§10 item 6).
3. User-mediated source/permission flows (A1 §05.5a).
4. The Safety-authority ruling on User Knowledge derived from Safety-adjacent or Safety-owned content (§07.2).
5. Whether `capabilityRiskTier` is ever renamed to a consumer-neutral name (code and test churn; no semantic effect).
6. The E.0.2d SPEC's own consumer declaration, observation-source contract and off-turn authorization-state read.

---

# 13. Consistency Self-Review

| Document | Check | Result |
|---|---|---|
| GCUK Ch.04 invariants 1–25 (incl. A1 21, A2 22–25) | Invariant 26 adds; invariant 3 ("semantic relevance never grants authorization") reinforced; invariant 19 (one-time per-integration governance) preserved. | No conflict. |
| GCUK Ch.05 | Deterministic eligibility before AI relevance, unchanged and extended to every consumer. | No conflict. |
| GCUK Ch.06 | Same four dimensions and authority roles; subject generalized; `contextCeiling` stays Capability-only transitional. | Amended, not contradicted. |
| GCUK Ch.14 | "One retrieval architecture" reinforced: no second authorization system. | No conflict. |
| GCUK Ch.19, A1 §08 | Learning consent vs source/platform authorization unchanged; protected sources fail closed. | No conflict. |
| A1 §05.3, §05.5, §05.5a, §07 | Descriptor field-contract adoption reused; `informationNeeds` keep zero authority; user-mediated flows stay deferred; discovery catalogue definition unchanged. | No change. |
| A2 §07, §10 | E.0.2d stays FITME-inferred, testable-not-live; this amendment only gives it a canonical eligibility home. | No conflict. |
| E.0.2a SPEC §05–§12; Activation Amendment §06–§10, §09.1 | Policy, fields, fail-closed rules, seam and Consent Principle unchanged; they are the Capability instance of §04–§05. | No change. |
| E.0.2c SPEC §17, §24 | Learning-consent gate on the User Knowledge store and Safety independence unchanged. | No change. |
| Safety canon (SFCD, SLDP, WP0-D, SL-001) | No Safety input or authority changes; Safety-derived User Knowledge fail-closed (§07). | No change. |

---

# 14. Repository Gaps and Canonical Conflicts

- **[GAP, pre-existing, not blocking]** The status header of `docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md` still reads "Not Yet Implemented", and `docs/specs/WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md` still reads "Not Yet Approved for Implementation", although commit `21f15de` ("Activate E.0.2a policy-based provider eligibility") implemented both. Status-metadata housekeeping only; this amendment relies on their normative content and on the verified code, not on their status lines.
- **Canonical conflicts:** none found.

---

# 15. Status and Closure

**AUTHORED — READY FOR PRODUCT/ARCHITECTURE CANONICAL REVIEW.** On approval, the status becomes CANONICAL / CLOSED with its canonization commit recorded here. Authorizes no implementation, no SPEC, no source or consumer registration, and no change to runtime behaviour.

# 16. Document History

- **v1.0** (initial authoring) — Records Product/Architecture decisions A3-1 … A3-7 (Option A: governed consumer generalization; one authorization architecture; protected-source fail-closed; authorization user experience; Safety-adjacent boundary for governed background consumers) after the E.0.2d read-only investigations, at baseline `f06e127`.
