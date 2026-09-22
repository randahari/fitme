# WP0 — PHASE E.0.2a — POLICY-BASED PROVIDER ELIGIBILITY — IMPLEMENTATION SPEC
## v1.0 — REVISED (Narrow Revision Applied) — READY FOR FINAL PRODUCT / ARCHITECTURE SPEC REVIEW (Authored Under the Repository's Established Specification Authoring Standard; Not Yet Implemented)

**Repository path:** `docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md`

This document was authored strictly as Engineering filling a specification under Product/Architecture's explicit authorization to begin E.0.2a SPEC authoring, and has since undergone one narrow, Product/Architecture-directed revision (see **Revision History** below). It documents contracts, cites repository evidence, and records unresolved items. It did not self-certify READY, and it made no repository changes itself — no production code, no test file, and no other file was modified, staged, committed, or pushed in the course of authoring or revising it. Every claim is tagged with its evidence class: **[VERIFIED]** (confirmed directly against current repository source), **[CANON]** (frozen by an already-closed governance document), **[DESIGN]** (this SPEC's own proposed contract, submitted for Product/Architecture approval), or **[GAP]** (an item this SPEC does not resolve, named explicitly).

**Revision History:**
- **v1.0 (first authoring)** — Original SPEC, including a `SensitiveReasoningAccessGate` design that keyed sensitive-context reasoning access off `capabilityRiskTier` (`STANDARD → true` fixed, `ELEVATED → separately gated`).
- **v1.0 (Narrow Revision, this version)** — Product/Architecture's Narrow Contract Review found the above design conflated capability risk-breadth classification with sensitive-context access authorization (a category error: `capabilityRiskTier===STANDARD` does not, by itself, evidence Safety review for any given capability). Corrected per Product/Architecture's binding direction: `sensitiveReasoningAccessGate.js` is removed from the design entirely; a new required `sensitiveContextAccessPolicy` field is added directly to `CapabilityDeclaration` (§09), independently declared per capability, orthogonal to `capabilityRiskTier`. Sections revised: §05.2, §09, §10, §11, §12, §15, §16, §17, §18, §19, §20, §21, §22, §23, §24, plus this header. No other section changed in substance.

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 — Phase E.0.2a — Policy-Based Provider Eligibility — Implementation SPEC**, the first lettered step of the implementation sequence GCUK Ch.23 named (`docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md`, hereafter **GCUK**).
- Status: **SPEC AUTHORING — READY FOR PRODUCT / ARCHITECTURE SPEC REVIEW.** Not yet approved for implementation. No line of `js/**` or `tests/**` has been touched under this SPEC's authority.
- Authority: Product/Architecture own every binding decision recorded as **[CANON]** (inherited from GCUK, unmodified) or explicitly approved in the two prior read-only investigation rounds this SPEC consolidates ("the Repository-Fit Investigation" and "the Contract Design Review," both conducted this session, read-only, no repository changes). This SPEC's own **[DESIGN]** items are submitted for approval, not yet binding.
- Repository baseline: `main` @ `d7954b4552b712cea53f0561cc68f055cb3fc2bb` (== `origin/main` at authoring time — the GCUK closure commit) **[VERIFIED, reconfirmed this session]**. Working tree carries the same pre-existing dirty/untracked paths present throughout this session, unchanged, untouched by this document.
- This document itself performs no repository action. Implementation, if and when separately authorized, happens through its own reviewed commits — never as a side effect of authoring or revising this SPEC's text.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** Replace the enumerated, hand-maintained `CapabilityDeclaration.contextCeiling` array — the literal provider×capability matrix GCUK Ch.06 identifies as the root scaling limitation — with a deterministic policy function evaluated from provider metadata, capability metadata, and governed user consent state, per GCUK's frozen four-dimension eligibility model (`sensitivityTier`, `consentScope`, `capabilityRiskTier`, `reasoningAccessAuthorized`), **without changing any live runtime behavior in this phase**.

**Scope.**
- Closed value sets for `sensitivityTier` and `capabilityRiskTier` (§05).
- An extensible, governed Consent Scope Registry and User Consent State contract (§07/§08), explicitly not `memoryConsent.granted` renamed.
- A dedicated, independent sensitive-context-access authority — the `sensitiveContextAccessPolicy` field declared once on each `CapabilityDeclaration` — orthogonal to `capabilityRiskTier` and structurally separate from `GeneralReasoningActivationGate` (§09).
- A pure, deterministic `eligibilityPolicy` module computing `{eligible, reasoningAccessAuthorized}` from the above (§10/§11).
- Conservative, fail-closed handling of every missing/malformed/unknown input (§12).
- A shadow-mode verification architecture that proves equivalence against `contextCeiling` **without flipping runtime authority** (§13).
- Migration metadata for every currently-registered `ContextFragmentProvider` and both currently-registered `CapabilityDeclaration`s (TRR, GENERAL_REASONING) (§16/§17 evidence, migration table in the Contract Design Review, restated §08).

**Non-Goals.**
- Semantic Context Discovery, the AI-facing candidate catalogue, or any AI-assisted relevance proposal (GCUK Ch.07 — this is **E.0.2b**, not started, not stubbed).
- The User Knowledge Layer, Concept Identity, `factors[]`, or any User Knowledge record shape (GCUK Ch.08-14 — **E.0.2c onward**).
- Flipping `contextRelevancePlanner.js`'s runtime authority away from `contextCeiling`. This SPEC's implementation phases end at a **verified-equivalent, side-by-side, non-authoritative** policy computation. The flip is an explicitly separate, future, separately-approved migration step (§13, §24).
- Any change to `GeneralReasoningActivationGate.js`'s binding default or behavior (§09, §15).
- Any real consent-collection UI, wearable/calendar/location integration, or new provider registration beyond the 8 that already exist (§16). Registering such a source is future, one-time engineering work under GCUK's own "New Source Principle" (Ch.19) — this SPEC only proves the *contract* is ready to receive it without redesign (§22).
- Any change to Phase D Safety mechanisms, Typed Memory, or `memoryLayer.js`'s pipeline-context assembly authority (§17, §18).

---

# 03. Binding Canonical References

- **GCUK** — `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` — Ch.04 (twenty binding invariants), Ch.05 (Authority Model), Ch.06 (Policy-Based Provider Eligibility, this SPEC's direct mandate), Ch.07 (Semantic Context Discovery — explicitly out of scope here), Ch.15 (Relationship to Existing Components), Ch.19 (Privacy and Consent), Ch.21 (Superseded Designs — item 2, `contextCeiling` as final architecture), Ch.22 (Remaining SPEC-Level Decisions), Ch.23 (Implementation Sequence, E.0.2a's own named scope).
- **CARF** — `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` — Ch.07 Reasoning Context Ownership, unmodified, unextended by this SPEC.
- **SLDP / SFCD / WP0-D** — `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`, `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md`, `docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md` — fully unmodified; §18 below re-confirms no contact point this SPEC introduces touches their authority.
- **WP0_SPEC_v1.0.md** — Phases A/B/C (`capabilityRegistry.js`, `contextComposer.js`, `contextRelevancePlanner.js`, `trrCapabilityAdapter.js`, `generalReasoningCapability.js`, `generalReasoningActivationGate.js`) — the exact modules this SPEC extends additively.
- **The Repository-Fit Investigation and the Contract Design Review** (this session, read-only, no repository changes) — the evidentiary and contract basis for every design decision below, treated as **[VERIFIED]**/**[DESIGN]** without re-deriving their own citations.

---

# 04. Current-State Repository Evidence (Summary)

- **`CapabilityDeclaration`** (`capabilityRegistry.js:77-176` validation, `:179-210` storage) has no eligibility-governance field today beyond `contextCeiling`/`contextBaseline`/`needShapeDefaults` (id-list-only) and `safetyRequirements` (Phase-D content-risk, unrelated axis) **[VERIFIED]**.
- **`ContextFragmentProvider`** (`contextComposer.js:80-115`) has exactly one metadata field, `relevanceTags`, constrained to the closed `CONTEXT_RELEVANCE_KINDS` (`contextComposer.js:56-65`). No `sensitivityTier`/`consentScope` field exists today **[VERIFIED]**.
- **`ContextRelevancePlanner.select()`** (`contextRelevancePlanner.js:61-90`) is the **sole consumer** of `contextCeiling` in the entire repository, and the sole point re-enforcing it (`:89`, a defensive `.filter()`) **[VERIFIED]** — this is the SPEC's single integration seam (§14).
- **Two `CapabilityDeclaration`s exist**: TRR (`trrCapabilityAdapter.js:108-133`, `contextBaseline === contextCeiling`, all 6 fields, `:120-122`) and `GENERAL_REASONING` (`generalReasoningCapability.js:120-136`, 8-field ceiling, 1-field baseline) **[VERIFIED]**. No third `CapabilityDeclaration` exists anywhere in the repository.
- **Eight `ContextFragmentProvider`s are registered**: `readinessStateContext`, `userSafetyContext`, `userSafetyProvenance`, `explicitRequestControls`, `activityPreference`, `recentConversationContext` (`trrCapabilityAdapter.js:47-54`), plus `currentStateContext`, `goalObjectiveContext` (`generalReasoningCapability.js:84`) **[VERIFIED]**. `userSafetyContext`/`userSafetyProvenance` are the only two tagged `SAFETY_AND_MEDICAL` (`trrCapabilityAdapter.js:64-65`).
- **The only existing consent primitive is a single global boolean**, `userProfile.memoryConsent.granted`, consulted by `readUserStatedMemory()` (`stateAccess.js:242-243`), `readRiskCharacteristicFacts()` (`:319-320`), and `readMemoryConsentGranted()` (`:297-301`) — **none of these three functions back any of the 8 currently-registered `ContextFragmentProvider`s**; those 8 are plain, unconditional `pipelineContext` reads (`trrCapabilityAdapter.js:77-93`, `generalReasoningCapability.js:92-105`) with **no consent gate at all today** — confirmed explicitly for `recentConversationContext` by its own governing comment (`stateAccess.js:265-268`: "No consent gate... conversation transcript is the user's own directly-typed chat content") **[VERIFIED]**.
- **TRR's live runtime path** never calls `CapabilityRegistry.resolve()` (the eligibility-aware, `ContextComposer`-invoking function) at the matching step: `conversationalNeedCreator.js:104` calls the pure, synchronous `resolveCapability()` only; the actual context composition happens later, at `internalPipelineOrchestrator.js:1197` via `TrrCapabilityAdapter.buildReasoningContext()` → `ContextComposer.assemble()` → `ContextRelevancePlanner.select()` **[VERIFIED]**.
- **`GeneralReasoningCapability` is unreachable from live routing** by construction: `conversationalNeedCreator.js:105-107` only ever treats `matchedCapability.id === 'TRR'` as a live match; any `FALLBACK` match (including `GENERAL_REASONING`) falls through to the existing, unmodified `UNSUPPORTED` path regardless of `GeneralReasoningActivationGate`'s value **[VERIFIED]**.
- **`GeneralReasoningActivationGate.isLiveFallbackApproved()`** (`generalReasoningActivationGate.js:32-42`) answers exactly one question — "is `GENERAL_REASONING` allowed to become user-reachable/live" — and nothing today couples it to Safety-adjacent context visibility **[VERIFIED]**. Per Product/Architecture's binding correction to the Contract Design Review, this SPEC must **not** reuse it for the `reasoningAccessAuthorized` decision (§09).
- **`MEMORY_TYPES`** (`memory.js:45`) is the repository's own established precedent for a closed-but-deliberately-extended array (grown from an initial set to 9 values over the project's history, each addition a deliberate, reviewed act, never an implicit default) — the structural model this SPEC's Consent Scope Registry follows (§07).

---

# 05. Frozen Closed Enums

## 05.1 `sensitivityTier` [DESIGN, submitted per Contract Design Review, unchanged by Product/Architecture's correction]

```
SENSITIVITY_TIERS = Object.freeze(['STANDARD', 'SAFETY_ADJACENT'])
```

Governance sensitivity only — never semantic content classification (that remains `relevanceTags`/`CONTEXT_RELEVANCE_KINDS`'s job, unchanged). Deliberately mirrors GCUK Ch.09's own frozen `safetyFlag:'STANDARD'|'SAFETY_ADJACENT'` for User Knowledge records, for architectural consistency across GCUK's whole eligibility surface. Extension to a third value requires a new Product/Architecture canonical decision — never an Engineering addition, mirroring `NEED_SHAPES`'/`CONTEXT_RELEVANCE_KINDS`'s own closed-extension discipline.

## 05.2 `capabilityRiskTier` [DESIGN]

```
CAPABILITY_RISK_TIERS = Object.freeze(['STANDARD', 'ELEVATED'])
```

Governance/access-risk only — classifies a capability's own reasoning *breadth*, never Phase D's content-risk (`RiskType`/`CONSTRAINT_SEVERITY`, `riskCharacteristicValidator.js:72-78`, an orthogonal, unrelated axis this SPEC never duplicates). `STANDARD` = narrow, specialized, closed-`{domain,topic}` scope, `contextBaseline === contextCeiling` (TRR's own existing shape). `ELEVATED` = open-ended, `scopeMatch:'FALLBACK'`, `needShapes:'ANY'`, free-form reasoning over unbounded Need content (`GENERAL_REASONING`'s own existing shape). Extension requires a new Product/Architecture decision.

**Binding orthogonality correction (Product/Architecture, Narrow Contract Review)**: `capabilityRiskTier` classifies reasoning *breadth*, never sensitive-data *authorization*. It MUST NOT be consulted, directly or indirectly, when computing `reasoningAccessAuthorized` (§10/§11). A capability's breadth of reasoning and its authorization to receive `SAFETY_ADJACENT` context are independent governance questions, decided by independent declared fields — `capabilityRiskTier` here, `sensitiveContextAccessPolicy` at §09 — never inferred from one another. `capabilityRiskTier` remains validated for well-formedness inside `eligible()` (§10) and reserved for potential future, separately-approved eligibility refinement unrelated to sensitive-context access.

## 05.3 `consentScope` [DESIGN — see §07 for the full registry contract]

Not a fixed enum baked into this SPEC. A `provider.consentScope` value is either `null` (no separate consent requirement for this provider class — a governed declaration, not a silent default) or a string drawn from the **Consent Scope Registry** (§07), a separately-owned, closed-but-extensible array.

---

# 06. Provider Metadata Contract [DESIGN]

`ContextFragmentProvider` (`contextComposer.js:80-115`) gains two new required fields, additive to the existing shape, validated in `validateProvider()`, stored verbatim in `registerFragmentProvider()` — the exact pattern `relevanceTags` itself already established (GCUK Ch.15: "backward-compatible, same pattern as `relevanceTags`'s own Phase E.0.1 addition"):

```
ContextFragmentProvider (extended) = {
  id: <non-empty string>,           // unchanged
  invoke: <function>,               // unchanged
  relevanceTags: [<CONTEXT_RELEVANCE_KINDS>...],  // unchanged, optional
  sensitivityTier: 'STANDARD' | 'SAFETY_ADJACENT',       // NEW, required
  consentScope: <registered scope id string> | null      // NEW, required (null is an explicit, valid value)
}
```

Validation additions to `validateProvider()`:
- `sensitivityTier` MUST be a member of `SENSITIVITY_TIERS` (§05.1) — reject with a new closed error code (`INVALID_SENSITIVITY_TIER`) otherwise, mirroring `INVALID_RELEVANCE_TAG`'s own shape.
- `consentScope` MUST be `null` or a member of the Consent Scope Registry (§07) at validation time — reject with `INVALID_CONSENT_SCOPE` otherwise. This is a **structural, registration-time** check — a provider can never introduce an unregistered scope id merely by declaring it.

No change to `invoke`, `relevanceTags` validation, `getFragmentProvider()`, `getAllFragmentProviderIds()`, or `assemble()`/`invokeProvider()` (§14 confirms these remain byte-unchanged).

---

# 07. Consent Scope Registry Contract [DESIGN]

**New module**: `js/coachDecisionSystem/consentScopeRegistry.js`.

A closed-but-deliberately-extensible array, structurally identical to `MEMORY_TYPES` (`memory.js:45`) and `CONTEXT_RELEVANCE_KINDS` (`contextComposer.js:56-65`) — never edited implicitly, extended only by a deliberate, reviewed, one-time registration act, satisfying GCUK's own "New Source Principle" (Ch.19) at the consent layer specifically.

```js
var REGISTERED_CONSENT_SCOPES = Object.freeze([
  'LEARNED_MEMORY_PERSONALIZATION'
]);

function isValidConsentScope(scopeId) {
  return scopeId === null || REGISTERED_CONSENT_SCOPES.indexOf(scopeId) !== -1;
}
```

**Design property that satisfies the "extensible without redesigning `eligibilityPolicy`" requirement**: scope ids are named by **purpose-of-use** (why the data is processed), never by **content domain** (what the data is about) — this is what keeps the registry a governance/process taxonomy, not a forbidden world/domain taxonomy. `LEARNED_MEMORY_PERSONALIZATION` describes *why* consent is required (data is stored and used to personalize coaching over time), not *what* a future provider's content is about. A future wearable/calendar/location provider that is genuinely governed by the same purpose (stored, cross-session personalization) reuses this same scope id with zero registry change; a provider requiring a **new** purpose-of-use category (e.g., a hypothetical future purpose distinct from personalization) requires exactly one new array entry — a one-time act, never a per-provider or per-capability mapping. `eligibilityPolicy` (§10) never branches on a specific scope id's value — it only performs a generic map lookup, so this module's own internal registry can grow without `eligibilityPolicy`'s own code changing at all.

`isValidConsentScope()` is consumed only by `contextComposer.js`'s `validateProvider()` (§06) and by `eligibilityPolicy.js` (§10) defensively (never trusting a provider's declared `consentScope` twice removed from validation — the same "never merely trusted from one layer" discipline `contextRelevancePlanner.js`'s own header already documents for `contextCeiling`).

---

# 08. User Consent State Contract and Migration from `memoryConsent` [DESIGN]

## 08.1 Shape

```
ConsentState := {
  [scopeId: string]: {
    granted: boolean,
    grantedAt?: <timestamp>,
    source: 'user_stated' | 'migrated',
    expiresAt?: <timestamp>   // optional; absent means non-expiring
  }
}
```

A **scoped map**, never a global boolean. Consumed by `eligibilityPolicy.computeEligibility()` (§10) as a single, pre-derived parameter — derived once per evaluation, not re-derived per provider, mirroring how `pipelineContext` is already threaded once through `ContextComposer.assemble(need, capability, pipelineContext)` today.

## 08.2 Migration of `memoryConsent.granted`

```js
function deriveConsentStateFromProfile(userProfile) {
  var granted = !!(userProfile && userProfile.memoryConsent && userProfile.memoryConsent.granted === true);
  return Object.freeze({
    LEARNED_MEMORY_PERSONALIZATION: Object.freeze({ granted: granted, source: 'migrated' })
  });
}
```

This function lives in `eligibilityPolicy.js` (§10) as the **only** point in this SPEC's new code that reads `userProfile.memoryConsent` — it is used **exclusively by the shadow-verification test harness** (§13), never by any production runtime path, since nothing production-facing calls `eligibilityPolicy` in E.0.2a.

**Explicit non-migration**: `memoryConsent.granted` is adapted into **one named grant inside the new map** — it is not renamed, not treated as "the" `consentScope` model, and (per §04's own evidence) it is **not attached to any of the 8 currently-registered providers**, since none of them are actually gated by it today. Attaching it to any of the 8 would be a behavioral change, not a migration (§16 confirms the full provider-by-provider mapping).

---

# 09. Dedicated Sensitive-Context-Access-Policy Contract [DESIGN — supersedes the prior `SensitiveReasoningAccessGate` design per Product/Architecture's Narrow Contract Review correction]

**No new module.** `js/coachDecisionSystem/sensitiveReasoningAccessGate.js` is **removed from this design entirely** — it does not exist, is not created, and is not referenced by any other section. The prior design's `STANDARD → true (fixed)` / `ELEVATED → runtime-flippable` shape keyed the sensitive-access decision off `capabilityRiskTier`, which Product/Architecture's Narrow Contract Review found to be a category error: reasoning-breadth classification (`capabilityRiskTier`, §05.2) silently became sensitive-data authorization. That coupling is removed.

**Replacement contract**: a new **required field directly on `CapabilityDeclaration`**, validated and stored exactly like every other governance field `capabilityRegistry.js` already owns (`outputContract`, `safetyRequirements` — `capabilityRegistry.js:149-165`):

```
sensitiveContextAccessPolicy: 'AUTHORIZED' | 'NOT_AUTHORIZED'
```

```js
var SENSITIVE_CONTEXT_ACCESS_POLICIES = Object.freeze(['AUTHORIZED', 'NOT_AUTHORIZED']);
```

Validation addition to `capabilityRegistry.js`'s `validateDeclaration()`: `def.sensitiveContextAccessPolicy` MUST be a member of `SENSITIVE_CONTEXT_ACCESS_POLICIES` — reject with a new closed error code (`INVALID_SENSITIVE_CONTEXT_ACCESS_POLICY`) otherwise, mirroring `INVALID_MUST_PASS_FINAL_REVIEW`'s own shape (`capabilityRegistry.js:160-162`). **There is no implicit default.** A `CapabilityDeclaration` omitting this field, or supplying any value outside the closed pair, **fails registration entirely** — `register()` never stores a partially-governed capability. This is stronger than evaluation-time fail-closing (§12): an unreviewed capability cannot exist in the registry at all.

**Why this satisfies every constraint of the correction, structurally, not by convention:**
- **Orthogonal to `capabilityRiskTier`**: a wholly separate field, never derived from or consulted alongside tier in any conditional (§10's corrected algorithm reads only `capability.sensitiveContextAccessPolicy`, never `capability.capabilityRiskTier`, when computing `reasoningAccessAuthorized`).
- **No capability-id rule, no provider×capability matrix**: the value is declared by each capability **about itself**, inline in its own `CapabilityDeclaration` object literal, validated by a generic membership check that never branches on `id`. This is structurally identical to how `contextCeiling`/`purpose`/`mutationPermissions` are already self-declared, generically-validated fields — not an externally-maintained table keyed by capability id.
- **One-time governed declaration/registration**: set once, at the point a capability's own `CapabilityDeclaration` is authored and Architecture-reviewed (the same review gate every other field on this object already requires) — never a runtime toggle, never AI-settable, never inferred from any other field.
- **Independent from `GeneralReasoningActivationGate`**: the two have no code path in common. A capability may be live-activated (§`GeneralReasoningActivationGate.isLiveFallbackApproved()`) while `sensitiveContextAccessPolicy==='NOT_AUTHORIZED'`, or vice versa — each requires its own separate, explicit Product/Architecture decision to change.
- **Fail-closed**: missing/malformed value blocks registration outright (above); a capability that does not exist in the registry can never be evaluated as eligible for anything, the strongest possible fail-closed posture.
- **Extensible to future capabilities (§13/§14 of the pressure-test requirements)**: any future capability, `STANDARD` or `ELEVATED`, declares this field once at its own registration; zero edits to any existing capability's declaration are ever required.

---

# 10. `eligibilityPolicy` Deterministic Algorithm [DESIGN]

**New module**: `js/coachDecisionSystem/eligibilityPolicy.js`. Pure, synchronous, throws never — same family discipline `contextRelevancePlanner.js` already documents for itself ("contains no AI/model call of any kind, under any implementation path, and never will").

```js
function eligible(provider, capability, consentState) {
  if (SENSITIVITY_TIERS.indexOf(provider.sensitivityTier) === -1) return false;
  if (CAPABILITY_RISK_TIERS.indexOf(capability.capabilityRiskTier) === -1) return false;
  if (!ConsentScopeRegistry.isValidConsentScope(provider.consentScope)) return false;

  if (provider.consentScope === null) return true;

  var grant = consentState && consentState[provider.consentScope];
  if (!grant || grant.granted !== true) return false;
  if (grant.expiresAt && grant.expiresAt <= now()) return false;
  return true;
}

function reasoningAccessAuthorized(provider, capability, consentState) {
  if (!eligible(provider, capability, consentState)) return false;
  if (provider.sensitivityTier === 'STANDARD') return true;
  if (provider.sensitivityTier === 'SAFETY_ADJACENT') {
    // capabilityRiskTier is deliberately NOT read here (Product/Architecture binding
    // correction, §05.2/§09) — reasoning breadth must never imply sensitive-data
    // authorization. The sole input is the capability's own declared, registration-time,
    // Architecture-reviewed policy.
    return capability.sensitiveContextAccessPolicy === 'AUTHORIZED';
  }
  return false; // unreachable given eligible()'s own guard, kept as an explicit fail-closed floor
}

function computeEligibility(provider, capability, consentState) {
  var e = eligible(provider, capability, consentState);
  return Object.freeze({
    eligible: e,
    reasoningAccessAuthorized: e ? reasoningAccessAuthorized(provider, capability, consentState) : false
  });
}
```

`computeEligibility()` never inspects `provider.id` or `capability.id`, and `reasoningAccessAuthorized()` never inspects `capability.capabilityRiskTier` — its only inputs are `sensitivityTier`, `consentScope`/`consentState`, and `sensitiveContextAccessPolicy`, satisfying "no provider×capability matrix, no provider-id rules, no capability-id rules, no world/domain taxonomy, capability risk classification != sensitive-context authorization" structurally, not merely by convention.

---

# 11. `reasoningAccessAuthorized` Algorithm — Restated as a Decision Table

`capabilityRiskTier` is not a column in this table — it plays no role in this decision (§05.2/§09, binding).

| `eligible` | `sensitivityTier` | `capability.sensitiveContextAccessPolicy` | `reasoningAccessAuthorized` |
|---|---|---|---|
| false | — | — | **false** |
| true | STANDARD | any valid (irrelevant here) | **true** |
| true | SAFETY_ADJACENT | `AUTHORIZED` | **true** |
| true | SAFETY_ADJACENT | `NOT_AUTHORIZED` | **false** |
| true | unrecognized | — | **false** (defensive; `eligible()` already excludes this) |

---

# 12. Conservative Missing/Malformed Behavior [DESIGN, binding]

| Condition | Result |
|---|---|
| `sensitivityTier` missing or outside `SENSITIVITY_TIERS` | `eligible=false`, `reasoningAccessAuthorized=false` — never defaults to `STANDARD` |
| `capabilityRiskTier` missing or outside `CAPABILITY_RISK_TIERS` | `eligible=false`, `reasoningAccessAuthorized=false` |
| `consentScope` not `null` and not in the Consent Scope Registry | `eligible=false` |
| `consentScope` valid, no matching entry in `consentState` | `eligible=false` |
| Matching entry exists, `granted !== true` | `eligible=false` |
| Matching entry `granted===true` but `expiresAt` in the past | `eligible=false` |
| Any field of the wrong JS type (not string/boolean as specified) | Treated identically to "missing" — never coerced, never guessed |
| `capability.sensitiveContextAccessPolicy` missing or outside `SENSITIVE_CONTEXT_ACCESS_POLICIES` | **Registration itself fails** (§09) — the capability never enters `CapabilityRegistry`, so it can never be evaluated by `eligibilityPolicy` at all; this is the strongest fail-closed posture in this contract |
| `eligible===true`, `sensitivityTier==='SAFETY_ADJACENT'`, `capability.sensitiveContextAccessPolicy==='NOT_AUTHORIZED'` | `reasoningAccessAuthorized=false` — the ordinary, expected case for any capability not governance-approved for sensitive access |

No branch in this table ever resolves an unknown/malformed condition to `true`. This mirrors the repository's own established conservative-default precedent (`CONSTRAINT_SEVERITY`'s `NOT_ESTABLISHED` member, `riskCharacteristicValidator.js:77`, and `readUserStatedMemory()`'s fail-closed-to-`[]` behavior, `stateAccess.js:242-243`).

---

# 13. Shadow-Mode Migration Architecture [DESIGN, binding — preserves the approved migration]

**E.0.2a introduces and verifies `eligibilityPolicy` entirely in parallel. `contextCeiling` remains the sole runtime authority. No production code path is re-pointed at `eligibilityPolicy`'s output in this phase.**

Concretely:
1. All new modules (§06/§07/§09/§10) and all new metadata fields are added **additively**. `contextRelevancePlanner.js`'s own source is **not modified in this SPEC** (§14) — its `select()` continues to read `capability.contextCeiling` exactly as it does today, byte-for-byte.
2. A dedicated **zero-drift proof test suite** (§21) — not production code — iterates every currently-registered provider against both currently-registered capabilities, calls `eligibilityPolicy.computeEligibility()` directly, and asserts its `eligible` output matches `contextCeiling` membership exactly, and its `reasoningAccessAuthorized` output matches the expected values derived in §16/§17.
3. **The flip itself — re-pointing `ContextRelevancePlanner.select()`'s universe from `capability.contextCeiling` to `eligibilityPolicy`'s own output — is explicitly out of scope for this SPEC.** It requires its own, separately-authored, separately-approved follow-on SPEC or SPEC amendment, gated on this SPEC's zero-drift proof passing in full (§23 Definition of Done). This SPEC's own Definition of Done is satisfied without ever performing that flip.

---

# 14. Exact Integration Seam with `ContextRelevancePlanner`

**Named, not yet touched.** The sole existing consumer of `contextCeiling` is `contextRelevancePlanner.js:64` (`var ceiling = ... capability.contextCeiling`) and `:89` (`return Object.keys(selected).filter(function (id) { return ceiling.indexOf(id) !== -1; });`). This SPEC identifies this exact pair of lines as the **future** flip point (for the separately-approved follow-on step named in §13) and requires **no edit to either line under this SPEC's own implementation phases** (§20). `select()`'s function signature, return contract, and internal logic (baseline / `needShapeDefaults` / tag-overlap) remain byte-unchanged by this SPEC.

---

# 15. TRR Zero-Drift Requirements

- TRR's `CapabilityDeclaration` gains `capabilityRiskTier:'STANDARD'` (additive field; `contextCeiling`/`contextBaseline`/all other fields unchanged, `trrCapabilityAdapter.js:108-133`).
- TRR's `CapabilityDeclaration` additionally gains `sensitiveContextAccessPolicy:'AUTHORIZED'` (§09) — **a distinct, explicit governance declaration, not a consequence of `capabilityRiskTier==='STANDARD'`.** It records the fact that TRR has already undergone Safety review and already receives `SAFETY_AND_MEDICAL` context live today; it is not inferred from, and would not automatically apply to, any other `STANDARD`-tier capability.
- Each of TRR's 6 registered providers gains `sensitivityTier`/`consentScope` per the migration table (§17) — additive fields on the provider object; `invoke` and `relevanceTags` unchanged.
- Because `contextRelevancePlanner.js` is not modified (§14), and because `ContextComposer.assemble()`/`invokeProvider()` are not modified, **TRR's actual runtime output is provably unchanged by construction**, not merely by test coverage — no code path capable of altering it is touched.
- The zero-drift proof test suite (§21) additionally asserts, as a documented expectation (not yet runtime-enforced): `eligibilityPolicy.computeEligibility()` would authorize all 6 TRR providers, including both `SAFETY_ADJACENT` ones, for TRR — consistent with TRR's own existing live behavior — so that the future flip (§13) is provably safe *before* it is ever proposed.

---

# 16. GeneralReasoning Non-Live Requirements

- `GENERAL_REASONING`'s `CapabilityDeclaration` gains `capabilityRiskTier:'ELEVATED'` (additive, `generalReasoningCapability.js:120-136`).
- `GENERAL_REASONING`'s `CapabilityDeclaration` additionally gains `sensitiveContextAccessPolicy:'NOT_AUTHORIZED'` (§09) — an explicit declaration matching its current, real state: it has not undergone the Safety review that would justify open-ended reasoning over `SAFETY_AND_MEDICAL` context. This determination is **independent of `capabilityRiskTier`** (an `ELEVATED` capability is not disqualified *because* it is `ELEVATED`; it is disqualified because it is explicitly declared `NOT_AUTHORIZED`, exactly as a future `STANDARD` capability could equally be).
- Its 8 registered providers gain `sensitivityTier`/`consentScope` per §17.
- `generalReasoningActivationGate.js` is **not modified** (§02 Non-Goals) — its binding default remains `false`; `conversationalNeedCreator.js:105-107`'s existing exclusion of any `FALLBACK` match from live routing is untouched (§04).
- `sensitiveContextAccessPolicy:'NOT_AUTHORIZED'` on `GENERAL_REASONING`'s own declaration means `reasoningAccessAuthorized` for its two `SAFETY_AND_MEDICAL` providers computes `false` **regardless of `GeneralReasoningActivationGate`'s own state** — even if a future, separately-approved decision flips activation to live, sensitive-context access requires its own, separate, future governed change to this same declared field. This is a second, independent layer of non-liveness for Safety-adjacent content specifically — never relied upon as the *sole* non-liveness guarantee (routing-seam exclusion, §04, remains primary).

---

# 17. Migration Mapping — Every Current Provider and Both Current Capabilities [DESIGN, restates and finalizes the Contract Design Review's table]

| Provider id | `sensitivityTier` | `consentScope` |
|---|---|---|
| `readinessStateContext` | STANDARD | `null` |
| `userSafetyContext` | **SAFETY_ADJACENT** | `null` |
| `userSafetyProvenance` | **SAFETY_ADJACENT** | `null` |
| `explicitRequestControls` | STANDARD | `null` |
| `activityPreference` | STANDARD | `null` |
| `recentConversationContext` | STANDARD | `null` (matches its own documented no-consent-gate behavior, `stateAccess.js:265-268`) |
| `currentStateContext` | STANDARD | `null` |
| `goalObjectiveContext` | STANDARD | `null` |

| Capability id | `capabilityRiskTier` | `sensitiveContextAccessPolicy` |
|---|---|---|
| `TRR` | STANDARD | **AUTHORIZED** |
| `GENERAL_REASONING` | ELEVATED | **NOT_AUTHORIZED** |

The two new capability-level columns are independent declarations (§09) — TRR's `AUTHORIZED` value is not a consequence of its `STANDARD` tier, and `GENERAL_REASONING`'s `NOT_AUTHORIZED` value is not a consequence of its `ELEVATED` tier; a future `STANDARD` capability could equally be declared `NOT_AUTHORIZED`, and a future `ELEVATED` capability could equally be declared `AUTHORIZED`, each independently reviewed.

Every `consentScope` is `null` today because, per §04's evidence, none of the 8 registered providers are backed by `memoryConsent`-gated data. `LEARNED_MEMORY_PERSONALIZATION` (§08) exists in the registry for future providers that genuinely read Typed Memory / learned personalization data — no such provider exists in the registered catalogue as of this SPEC.

**[GAP, explicitly flagged, not resolved by this SPEC]**: whether `userSafetyContext`/`userSafetyProvenance` should eventually carry a real (non-`null`) `consentScope` is a Product/legal question about durable Safety-context consent, outside this SPEC's engineering scope. Today's `null` value is the zero-drift-correct migration, not a claim that no such consent should ever be required.

---

# 18. Safety Invariants

- Phase D Safety (`safetyLayer.js`, `riskCharacteristicValidator.js`, `userSafetyProvenanceInterpreter.js`) is untouched by every file this SPEC's implementation phases touch (§20) — confirmed by file-list disjointness, not merely by intent.
- `capabilityRiskTier` (§05.2) and `sensitiveContextAccessPolicy` (§09) are both distinct axes from Phase D's `RiskType`/`CONSTRAINT_SEVERITY` and are never consulted by, nor consult, any Phase D module.
- Candidate-level Safety characterization (WP0-D) remains unconditional and independent regardless of what `eligibilityPolicy` ever computes, per GCUK Ch.19's own three-part invariant — restated here as binding on this SPEC: semantic relevance never grants access; deterministic authorization may make an already-authorized fragment available to reasoning; Phase D's own independent characterization is authoritative regardless of what reasoning did or did not see.

---

# 19. Privacy / Consent Invariants

- `eligibilityPolicy` and `consentScopeRegistry` are both pure/deterministic and contain no AI call of any kind, under any implementation path — structurally verified by the same "no `callClaude` reference, no async/Promise return" signal `contextRelevancePlanner.js` already uses for itself.
- Consent is evaluated **before** any eligibility/reasoning-access determination — `deriveConsentStateFromProfile()` (§08.2) is a pure read, performed once, never inferred or defaulted to `granted`.
- `reasoningAccessAuthorized` is never a stored field on any provider or capability object — it exists only as a function return value, recomputed at evaluation time, exactly as Product/Architecture's binding correction requires.
- **Clarification (Narrow Contract Review)**: `sensitiveContextAccessPolicy` (§09) is not an exception to the line above. It is a *declared input* to the `reasoningAccessAuthorized` computation — exactly like `sensitivityTier` and `consentScope` are already declared inputs — never the computed result itself. What is never stored is the *result* (`reasoningAccessAuthorized`'s own boolean output for a given provider/capability/user); what *is* stored, by design, is the *capability's own one-time governed policy declaration* that feeds into computing that result, in the same way `mustPassFinalReview` is a stored declaration that Safety's own runtime consults, never itself the runtime Safety outcome.

---

# 20. Exact File-Change Scope

**Changed (additive only):**
- `js/coachDecisionSystem/capabilityRegistry.js` — `capabilityRiskTier` field + validation; `sensitiveContextAccessPolicy` field + validation (§09) — both additive, on the same object, validated by the same `validateDeclaration()`/`register()` functions, no new module required for the latter.
- `js/coachDecisionSystem/contextComposer.js` — `sensitivityTier`/`consentScope` fields + validation on `ContextFragmentProvider`.
- `js/coachDecisionSystem/trrCapabilityAdapter.js` — real metadata values per §17.
- `js/coachDecisionSystem/generalReasoningCapability.js` — real metadata values per §17.

**New files:**
- `js/coachDecisionSystem/consentScopeRegistry.js` (§07)
- `js/coachDecisionSystem/eligibilityPolicy.js` (§10)
- `tests/consentScopeRegistry.test.js`
- `tests/eligibilityPolicy.test.js`
- `tests/wp0PhaseE02aZeroDriftProof.test.js` (mirrors the existing `tests/wp0PhaseCOpenWorldProof.test.js` precedent)

**Explicitly removed from this design (Narrow Contract Review):** `js/coachDecisionSystem/sensitiveReasoningAccessGate.js` and `tests/sensitiveReasoningAccessGate.test.js` — neither is created; §09's replacement contract requires no dedicated module.

**Extended (existing assertions unchanged, new assertions added):**
- `tests/capabilityRegistry.test.js`, `tests/contextComposer.test.js`, `tests/trrCapabilityAdapter.test.js`, `tests/generalReasoningCapability.test.js`.

**Explicitly not touched by this SPEC:**
`contextRelevancePlanner.js` (§14), `memoryLayer.js`, `conversationalNeedCreator.js`, `internalPipelineOrchestrator.js`, `generalReasoningActivationGate.js`, `safetyLayer.js`, `riskCharacteristicValidator.js`, `userSafetyProvenanceInterpreter.js`, `memory.js`, `app.js` (its existing `registerAll()`/`.configure()` call sites need no new call — the new fields live inside the object literals those existing calls already pass).

---

# 21. Test Plan

1. **`consentScopeRegistry.test.js`** — `isValidConsentScope(null)===true`; `isValidConsentScope('LEARNED_MEMORY_PERSONALIZATION')===true`; any unregistered string `===false`; registry array is frozen/immutable.
2. **`eligibilityPolicy.test.js`** — full decision-table coverage (§11), explicitly including: a hypothetical `SAFETY_ADJACENT` provider paired with a hypothetical `capability.sensitiveContextAccessPolicy==='AUTHORIZED'` object → `reasoningAccessAuthorized:true`; the same provider paired with `'NOT_AUTHORIZED'` → `false`; asserts the result is **identical regardless of `capabilityRiskTier`'s value** (run once with `STANDARD`, once with `ELEVATED`, both otherwise-identical fixtures, assert equal output) — the direct regression test for the corrected root-cause issue; every row of §12's conservative-behavior table, each asserted individually; `deriveConsentStateFromProfile()` correctly maps `memoryConsent.granted` true/false/missing.
3. **`wp0PhaseE02aZeroDriftProof.test.js`** — iterates `CapabilityRegistry.getAll()` × `ContextComposer.getAllFragmentProviderIds()`; for every id present in a capability's `contextCeiling`, asserts `eligibilityPolicy.computeEligibility()` returns `eligible:true`; for TRR specifically, asserts `reasoningAccessAuthorized:true` for `userSafetyContext`/`userSafetyProvenance` (consistent with TRR's own declared `sensitiveContextAccessPolicy:'AUTHORIZED'`); for `GENERAL_REASONING`, asserts `reasoningAccessAuthorized:false` for the same two providers (consistent with its own declared `sensitiveContextAccessPolicy:'NOT_AUTHORIZED'`).
4. **Extended existing suites** — `capabilityRegistry.test.js` gains new-field validation-rejection cases for both `capabilityRiskTier` (`INVALID_CAPABILITY_RISK_TIER`) and `sensitiveContextAccessPolicy` (`INVALID_SENSITIVE_CONTEXT_ACCESS_POLICY`), including a case asserting `register()` **fails entirely** when `sensitiveContextAccessPolicy` is omitted; `contextComposer.test.js` gains `INVALID_SENSITIVITY_TIER`/`INVALID_CONSENT_SCOPE` cases; `trrCapabilityAdapter.test.js`/`generalReasoningCapability.test.js` gain assertions that `registerAll()` still succeeds and every existing assertion about `buildReasoningContext()`/`reason()` output remains green, unmodified.

---

# 22. Pressure Tests

| Scenario | Requires a new provider×capability mapping? | Why not |
|---|---|---|
| Future wearable provider (new source) | **No** | Registers once with its own `sensitivityTier`/`consentScope`/`relevanceTags`; if it needs a new purpose-of-use scope, that is one Consent Scope Registry entry, never a per-capability edit; `eligibilityPolicy` requires zero code change. |
| Future calendar/schedule provider | **No** | Same mechanism; likely reuses `LEARNED_MEMORY_PERSONALIZATION` or one new scope entry if its purpose-of-use genuinely differs. |
| Future location/travel provider | **No** | Same mechanism; `sensitivityTier` may reasonably be `SAFETY_ADJACENT` depending on future Product judgment — still a single provider-side declaration, not a matrix cell. |
| Future `SAFETY_ADJACENT` User Knowledge record (GCUK Ch.09, E.0.2c+) | **No** (structurally) | Out of this SPEC's scope, but the same two-dimension pattern (`sensitivityTier`-equivalent `safetyFlag`, already frozen at Ch.09) is designed to compose with this eligibility model without redesign, per GCUK Ch.06's own four-dimension framing. |
| Future narrow `STANDARD` capability with no need for sensitive context | **No** | Declares `sensitiveContextAccessPolicy:'NOT_AUTHORIZED'` at its own registration (§09) — never receives `SAFETY_ADJACENT` access, regardless of tier, with zero edits elsewhere. |
| Future narrow `STANDARD` capability legitimately authorized for sensitive context | **No** | Declares `sensitiveContextAccessPolicy:'AUTHORIZED'` at its own registration, independently reviewed — receives access without needing TRR's own declaration to change, and without `capabilityRiskTier` playing any role in the decision. |
| Future `ELEVATED` capability explicitly/governedly authorized | **No** | Declares `sensitiveContextAccessPolicy:'AUTHORIZED'` at its own registration — supported without redesign, since the field is orthogonal to tier by construction (§10/§11). |
| Future capability of unknown kind | **No** | Declares `capabilityRiskTier` once (`STANDARD` or `ELEVATED`, or a future Product/Architecture-approved third value) **and** `sensitiveContextAccessPolicy` once (required, no default) at its own registration; automatically subject to the existing `eligibilityPolicy` logic with zero edits to any other module or any other capability's declaration. |
| 100,000 new, differently-living users (GCUK's own non-negotiable test) | **No** | `eligibilityPolicy` never branches on user identity, provider id, or capability id — only on the four closed/registered dimensions plus `sensitiveContextAccessPolicy` plus each user's own `ConsentState` map, which grows per-user without any Engineering action. |

**Named risks, explicitly flagged for implementation-time discipline**:
1. The one way this design could silently fail the pressure test is if a future implementer, under time pressure, adds an `if (provider.id === 'wearableX' && capability.id === 'TRR')`-shaped branch inside `eligibilityPolicy.js` instead of declaring metadata on the new provider. §10's algorithm as specified contains no such branch and none should ever be added; this SPEC's own Definition of Done (§23) includes a structural check for this.
2. The specific risk this revision corrects: re-deriving `sensitiveContextAccessPolicy`'s value from `capabilityRiskTier` (e.g., "all `STANDARD` capabilities are `AUTHORIZED` by default") anywhere in implementation would silently resurrect the root-cause issue the Narrow Contract Review identified. §09/§10/§11 as specified contain no such derivation; the field is required with no default specifically to prevent this.

---

# 23. Definition of Done

This SPEC's implementation is done when:

1. Both new modules (§07 `consentScopeRegistry.js`, §10 `eligibilityPolicy.js`) exist, are pure/synchronous/AI-free, and pass their own test suites (§21 items 1-2). No `sensitiveReasoningAccessGate.js` file exists anywhere in the repository.
2. `capabilityRiskTier`, `sensitiveContextAccessPolicy`, `sensitivityTier`, `consentScope` are added additively to `capabilityRegistry.js`/`contextComposer.js` with full validation-rejection coverage, including a registration-failure test for `sensitiveContextAccessPolicy` (§09/§12).
3. TRR and `GENERAL_REASONING` both carry real, correct metadata per §17 (including their independently-declared `sensitiveContextAccessPolicy` values), with every existing test in `trrCapabilityAdapter.test.js`/`generalReasoningCapability.test.js`/`capabilityRegistry.test.js`/`contextComposer.test.js` still passing unmodified in its existing assertions.
4. The zero-drift proof suite (§21 item 3) passes in full.
5. `contextRelevancePlanner.js` is byte-identical to its pre-SPEC state (verified by diff, not merely by intent) — confirming §13's shadow-only guarantee.
6. `generalReasoningActivationGate.js` is byte-identical to its pre-SPEC state; its binding default remains `false`.
7. `eligibilityPolicy.js` contains no `provider.id`/`capability.id` conditional of any kind (grep-verifiable) — the structural check named in §22.
8. `eligibilityPolicy.js`'s `reasoningAccessAuthorized()` function contains no reference to `capability.capabilityRiskTier` (grep-verifiable) — the structural check for the root-cause correction (§09/§10/§11, named risk 2 in §22).
9. No file outside §20's "Changed"/"New" lists is modified.

---

# 24. Staged Migration / Follow-On Boundary with E.0.2b

This SPEC delivers **only**: the four dimensions' closed contracts, the Consent Scope Registry, the dedicated `sensitiveContextAccessPolicy` capability-declaration contract, the pure `eligibilityPolicy` module, and a non-authoritative, shadow-verified equivalence proof against `contextCeiling`. It does **not** deliver: the runtime flip (named and deferred in §13, its own future separately-approved step); Semantic Context Discovery, provider `description` metadata, or any AI-facing candidate catalogue (GCUK Ch.07 — **E.0.2b**); any User Knowledge record shape, Concept Identity, or `factors[]` scaffolding (GCUK Ch.09-11 — **E.0.2c**); consolidation, correction, or retrieval integration (**E.0.2d-g**). Each of those remains gated on its own future SPEC, per GCUK Ch.23's own frozen sequence, unaffected by this document.

---

# 25. Repository Gaps

None found that contradict GCUK, CARF, SLDP, SFCD, or WP0-D. §17's one named item is a Product/legal question carried forward, not a repository contradiction.

---

# 26. Status and Closure

This SPEC is filed as **READY FOR FINAL PRODUCT / ARCHITECTURE SPEC REVIEW**, incorporating the Narrow Revision applied per Product/Architecture's Narrow Contract Review (see header Revision History). It authorizes no implementation by itself. Implementation may begin only after a separate, explicit Product/Architecture go-ahead on this document, per the same discipline GCUK itself and the prior WP0 Sub-Spec both already established.
