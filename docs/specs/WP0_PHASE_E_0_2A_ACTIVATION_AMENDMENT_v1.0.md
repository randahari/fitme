# WP0 — PHASE E.0.2a — ACTIVATION AMENDMENT
## v1.0 — SPEC AUTHORING — READY FOR PRODUCT / ARCHITECTURE SPEC REVIEW (Authorizes the SHADOW → Authoritative Transition Named and Deferred by the Original E.0.2a SPEC; Not Yet Approved for Implementation)

**Repository path:** `docs/specs/WP0_PHASE_E_0_2A_ACTIVATION_AMENDMENT_v1.0.md`

**Document role:** Follow-on SPEC amendment to `docs/specs/WP0_PHASE_E_0_2A_POLICY_BASED_PROVIDER_ELIGIBILITY_SPEC_v1.0.md` (hereafter **the Original SPEC**), authored under that SPEC's own binding text (§13: *"The flip itself... is explicitly out of scope for this SPEC. It requires its own, separately-authored, separately-approved follow-on SPEC or SPEC amendment, gated on this SPEC's zero-drift proof passing in full"*; §24: *"[The runtime flip] does not deliver... Each of those remains gated on its own future SPEC"*). This document is deliberately narrow: it does not restate, redesign, or duplicate the Original SPEC's own frozen contracts (the four eligibility dimensions, the Consent Scope Registry, the `eligibilityPolicy` algorithm) — it cites them and defines only what changes to make them authoritative. Every claim below is tagged **[VERIFIED]** (confirmed directly against current repository source, this session), **[CANON]** (frozen by an already-closed governance document), **[DESIGN]** (this amendment's own proposed contract, submitted for approval), or **[GAP]** (an item this amendment does not resolve, named explicitly) — mirroring the Original SPEC's own evidence-classification convention.

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 — Phase E.0.2a — Activation Amendment** — the separately-approved follow-on step the Original SPEC's own §13/§24 named and explicitly deferred.
- Status: **SPEC AUTHORING — READY FOR PRODUCT/ARCHITECTURE SPEC REVIEW.** Not yet approved for implementation. No line of `js/**` or `tests/**` has been touched under this document's authority — authored strictly as a documentation-only task, per explicit instruction.
- Authority: Product/Architecture own every binding decision recorded as **[CANON]** (inherited from the Original SPEC and GCUK, unmodified) or explicitly approved in this session's Activation-Readiness Repository Verification (a read-only investigation conducted this session, cited throughout as **the Readiness Review**). This amendment's own **[DESIGN]** items are submitted for approval, not yet binding.
- Repository baseline: `main` @ `aa485c9e4d216d3160e2697c786440fbafb26c25` (the commit closing the browser Coach Decision System dependency-loading defect — a prerequisite this amendment's own readiness evidence depends on; see §04) **[VERIFIED]**.
- This document itself performs no repository action. Implementation, if and when separately authorized, happens through its own reviewed commits — never as a side effect of authoring this amendment.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** Authorize the transition of `eligibilityPolicy`'s already-built, already-verified-equivalent computation from shadow (computed but never consulted) to authoritative (the actual gate a provider must pass before entering reasoning context) — satisfying the Original SPEC's own explicit precondition for this step, and Product's plain-language framing: *"First decide what the capability is allowed to see. Only then may semantic intelligence decide what is relevant."*

**Scope.**
- The exact enforcement seam and the exact predicate it must apply (§08).
- The required `consentState`-threading contract (§09).
- Fail-closed behavior at the seam (§10).
- Zero-drift/non-impact guarantees for TRR, Safety, CCC-001, and every out-of-scope system (§11–§13).
- Exact file-change boundaries and acceptance criteria (§14–§16).

**Non-Goals.** Restated from the Original SPEC's own §02 Non-Goals, unchanged, plus this amendment's own additions — see §17 (Explicit Non-Goals) for the complete, binding list.

---

# 03. Binding Canonical References

Index inherits the Original SPEC's own index in full (§03 there), not repeated here. Added by this amendment:
- **This session's Activation-Readiness Repository Verification** (read-only, no repository changes) — the evidentiary basis for §04, §11, §12, §13 below, treated as **[VERIFIED]** without re-deriving its own citations.
- **This session's Browser Script-Loading Defect Repair** (commit `aa485c9e4d216d3160e2697c786440fbafb26c25`) — the prerequisite fix confirming `js/coachDecisionSystem/*.js`'s own browser dependency graph, including `consentScopeRegistry.js`, is genuinely load-bearing-correct before this amendment relies on any of it running live.

---

# 04. Current-State Repository Evidence (Summary, Re-Verified This Session)

- **`eligibilityPolicy.js` has zero production callers today** — re-confirmed by repo-wide grep at the current `HEAD`: matches only its own file, `consentScopeRegistry.js`'s comment, and two test files **[VERIFIED]**.
- **`contextRelevancePlanner.js:64,89` remain the sole consumer of `capability.contextCeiling`**, byte-unchanged since the Original SPEC shipped **[VERIFIED]**.
- **TRR zero-drift is arithmetically proven, not assumed**: every one of TRR's 6 registered providers computes `reasoningAccessAuthorized === true` under `eligibilityPolicy` today (`sensitiveContextAccessPolicy:'AUTHORIZED'`, `consentScope:null` on all 6) — and `contextBaseline === contextCeiling` for TRR, so these 6 are unconditionally selected regardless of which mechanism gates the ceiling **[VERIFIED, computed directly from `eligibilityPolicy.js`'s own algorithm against `trrCapabilityAdapter.js`'s current field declarations]**.
- **`GENERAL_REASONING`'s authorized set narrows from 8 to 6 the moment `reasoningAccessAuthorized` (not `eligible`) becomes the gate**: `userSafetyContext`/`userSafetyProvenance` are `eligible:true` (their `consentScope` is `null`) but `reasoningAccessAuthorized:false` (`GENERAL_REASONING`'s own `sensitiveContextAccessPolicy:'NOT_AUTHORIZED'`) **[VERIFIED]** — this is the one live behavioral consequence of activation, and it is currently unobservable because `GENERAL_REASONING` is unreachable from live routing (§12).
- **`wp0PhaseE02aZeroDriftProof.test.js` passes in full today (7/7)** — re-run this session at the current `HEAD` — satisfying the Original SPEC's own §13 gating condition (*"gated on this SPEC's zero-drift proof passing in full"*) as a precondition already met, independent of this amendment's own approval **[VERIFIED]**.
- **The prerequisite browser-loading defect is closed**: `consentScopeRegistry.js` is now script-tagged and precached, confirmed by direct browser verification (`TrrCapabilityAdapter.registerAll()` and `GeneralReasoningCapability.registerAll()` both complete; all 8 providers register) **[VERIFIED, this session]**. This matters specifically because `eligibilityPolicy.js` and `consentScopeRegistry.js` sit in the exact dependency chain `contextComposer.js` already loads — activation work must build on a browser runtime that is now confirmed sound, not one with a known-broken dependency graph underneath it.

---

# 05. Frozen Definitions — Unchanged, Cited Only

The following are **[CANON]**, owned entirely by the Original SPEC, and this amendment redesigns none of them, per explicit Product instruction: `SENSITIVITY_TIERS` (§05.1 there), `CAPABILITY_RISK_TIERS` (§05.2), `consentScope`/the Consent Scope Registry contract (§05.3/§07), the `ContextFragmentProvider` metadata shape (§06), the `sensitiveContextAccessPolicy` contract (§09), and the `eligible()`/`reasoningAccessAuthorized()`/`computeEligibility()` algorithm itself (§10/§11). This amendment's only subject is: **who calls these functions, when, and what happens to their output.**

---

# 06. The Product Rule, Restated as a Binding Algorithm

Product's plain-language framing (*"First decide what the capability is allowed to see. Only then may semantic intelligence decide what is relevant"*) is already exactly what GCUK Ch.05 freezes (*"deterministic eligibility computation always runs before any AI reasoning about relevance"*) and what the Original SPEC's own `eligibilityPolicy` already computes. This amendment's entire content is the single seam that makes that ordering **actually enforced at runtime** rather than merely computed and ignored:

```
1. capability.contextCeiling                         (already-declared candidate set — unchanged)
2. → for each candidate: eligibilityPolicy.computeEligibility(provider, capability, consentState)
3. → EXCLUDE any candidate where reasoningAccessAuthorized !== true
4. → the surviving set is the ONLY set any later selection mechanism may return
5. → no later mechanism (tag-overlap, needShapeDefaults, a future E.0.2b discovery proposal)
     may reintroduce an excluded candidate
```

---

# 07. Scope of "Reasoning-Adjacent" Filtering — What This Amendment Does and Does Not Touch

**[DESIGN, binding]** This amendment governs exactly one thing: which `ContextFragmentProvider` ids may leave `ContextRelevancePlanner.select()` as candidates for **reasoning context composition**. It does not govern, and is structurally incapable of governing, Safety's own inputs (§13), because Safety does not call `ContextRelevancePlanner`, `ContextComposer`, or `CapabilityRegistry` at all — confirmed **[VERIFIED]** by dependency-graph absence in `safetyLayer.js` (re-checked this session: its only `require()`s are `safetyIntegrationPort.js` and `riskCharacteristicValidator.js`).

---

# 08. Exact Enforcement Seam — [DESIGN, the amendment's central contract]

**Named seam**: `js/coachDecisionSystem/contextRelevancePlanner.js`, `select()`'s existing defensive final filter, currently at `:89`:

```js
return Object.keys(selected).filter(function (id) { return ceiling.indexOf(id) !== -1; });
```

**Required change**: this line's predicate becomes authorization-aware. Every id present in `selected` — regardless of whether it arrived via `contextBaseline`'s unconditional inclusion, `needShapeDefaults`, or the tag-overlap mechanism — must additionally satisfy `eligibilityPolicy.computeEligibility(provider, capability, consentState).reasoningAccessAuthorized === true` to survive into the returned array. The existing `ceiling.indexOf(id) !== -1` check is **retained, not replaced** — `contextCeiling` remains the outer bound (matching GCUK Ch.06's own transitional text: *"`contextCeiling` MAY remain, transitionally, as an explicit override/cap"*); `reasoningAccessAuthorized` becomes an **additional, narrower** requirement layered on top of it, never a replacement of the ceiling check itself.

**Why this exact line, and not `ContextComposer.assemble()` one layer up**: this is the one point every existing selection path (baseline, `needShapeDefaults`, tag-overlap) and every future one (a future E.0.2b discovery proposal, which per GCUK Ch.07 itself must also be bounded by this exact filter) already funnels through before anything is returned to the caller. Enforcing one layer up would require re-implementing the same "no matter how you got selected, you must still pass this check" property a second time, or trusting that every future selection mechanism remembers to call it independently — a durability risk this amendment explicitly rejects, per Product's own binding requirement: *"No later semantic mechanism may restore an excluded provider."*

**Signature consequence [DESIGN]**: `select()` gains a new parameter, `consentState`, threaded from `ContextComposer.assemble()`, which itself gains the same parameter, threaded from each of `select()`'s current call sites (`trrCapabilityAdapter.js`, and, for parity, `generalReasoningCapability.js`'s own test-reachable path). The exact mechanism by which a real `consentState` value reaches `assemble()`'s own call sites is named as an open implementation decision in §09, not fixed by this amendment.

---

# 09. Consent-State Threading — [DESIGN, binding requirement; RESOLVED this revision]

**Binding requirement, per explicit Product instruction**: `consentState` must be a genuine, correctly-derived input — never a hardcoded `{}` or `null` merely because every provider registered today happens to declare `consentScope: null`. `eligibilityPolicy.eligible()`'s own short-circuit for `consentScope === null` (`eligibilityPolicy.js:51`) already makes today's *result* independent of `consentState`'s actual contents — but the **plumbing** must exist and be exercised as real plumbing, so that the day a `consentScope`-bearing provider is registered, the correct grant lookup is already live, not silently bypassed.

**Resolved source (Product/Architecture approved, following this session's dedicated consentState-source investigation) [DESIGN, binding]:**

1. **Source of truth is unchanged**: `userProfile.memoryConsent` (`{granted, at}`) remains the sole consent primitive — no second consent store, no parallel source of truth is introduced **[CANON, restated]**.
2. **The read reuses the existing, already-governed `memoryLayer/PREFERENCE_CONSENT_READ` StateAccess capability** (`stateAccess.js:297-301,579-582`, `readMemoryConsentGranted(identity)`) — the identical identity already called three times in `internalPipelineOrchestrator.js` today (CPI-001 preference intake `:343`, Item 6 disclosure intake `:376`, WP0 Phase D.5 risk-characteristic-fact intake `:447`) **[VERIFIED]**. No new StateAccess permission grant is created; this amendment adds a fourth call site to an already-approved capability, exactly mirroring the shape of the three that already exist.
3. **The read happens once, at the orchestration root** (`internalPipelineOrchestrator.js`, immediately adjacent to `runDecisionPass()`'s existing `TrrCapabilityAdapter.buildReasoningContext()` call site) — never re-derived at any lower layer, mirroring how `pipelineContext` itself is assembled once and passed down.
4. **Consent stays out of `pipelineContext`**, by design, not by omission: this mirrors the codebase's own already-stated reasoning for keeping the three existing `PREFERENCE_CONSENT_READ` reads outside Pipeline Context assembly — a governance/authorization input is not reasoning content, and CD-02's "no component other than the Memory Layer may originate a Decision Input read or assemble Pipeline Context" is specifically about content that becomes part of what a reasoning component *sees*, not about narrow authorization gates **[VERIFIED, citing `internalPipelineOrchestrator.js`'s own header comment for the existing three call sites]**.
5. **`ConsentState` is derived once and passed explicitly down the reasoning-context construction path**: the resulting boolean is converted to the `ConsentState` shape `eligibilityPolicy` already expects, and threaded as an explicit parameter through `TrrCapabilityAdapter.buildReasoningContext()` → `ContextComposer.assemble()` → `ContextRelevancePlanner.select()` — never re-read or re-derived at any of those layers.

**Remaining Engineering Fill (implementation detail only, not a Product/Architecture decision, not a blocker to approval):**
- Whether `runDecisionPass()` gains a full `identity` object or only the missing `runId` field (`userId`/`sessionGeneration` are already available via `pipelineContext`) as its own additive parameter, mirroring `buildOpportunitiesForDecisionPass()`'s own precedent of gaining `currentTurnId` as a third, additive parameter.
- Whether the boolean → `ConsentState` mapping is a small new local helper at the call site, or `readMemoryConsentGranted`'s own read is widened to return the `memoryConsent` sub-object so `eligibilityPolicy.deriveConsentStateFromProfile()` (`eligibilityPolicy.js:82-87`, unmodified) can be reused verbatim. Either choice reuses existing, frozen logic; neither redesigns `eligibilityPolicy`, the Consent Scope Registry, or `deriveConsentStateFromProfile()`'s own contract.

## 09.1 Product Consent Principle — [CANON, Product-approved, binding on all future Consent Scope Registry extension]

The general personalization/memory consent the user already grants (`userProfile.memoryConsent.granted`) is FITME's standing authorization for FITME to learn from and use the information the user shares across the coaching relationship — nutrition, sleep, training, habits, work, travel, preferences, routines, and any other open-world information the user chooses to disclose — subject to Safety, privacy, purpose-of-use, and this repository's other already-governing boundaries. `consentScope` and the Consent Scope Registry (`consentScopeRegistry.js`, unmodified by this amendment) exist **only** as an enforcement mechanism for the narrow cases that genuinely require separately governed consent — they must never become a closed taxonomy of user-information *categories*, and learning a new *kind* of information about a user must never, by itself, require Product/Engineering to register a new consent scope. This is the same discipline the Consent Scope Registry's own header already states (*"Scope ids are named by PURPOSE-OF-USE... never by CONTENT DOMAIN"*, `consentScopeRegistry.js:11-16`) — this amendment does not change that discipline, it restates it as a binding constraint on how this seam, and any future consent-scope registration, must be used, preserving FITME's open learning / semantic reasoning + closed governed authority principle.

---

# 10. Fail-Closed Behavior — [CANON, restated for this seam]

Inherits the Original SPEC's own §12 table in full, unmodified. Restated in this seam's own terms, per explicit Product instruction (*"If authorization cannot be established, the provider must not enter reasoning context. No permissive fallback. No semantic component may compensate for missing/failed authorization"*):

- `eligible()`/`reasoningAccessAuthorized()` are pure, total, synchronous functions that never throw and never resolve an unknown/malformed condition to `true` (`eligibilityPolicy.js:45-69`, unmodified) **[VERIFIED]**.
- A malformed or unregistered provider/capability pair cannot reach this seam at all — `validateProvider()`/`validateDeclaration()` already reject registration outright for missing required fields, no implicit default (`contextComposer.js:112-120`, `capabilityRegistry.js:168-177`, both unmodified) **[VERIFIED]**.
- Consequence for this seam specifically: if `consentState` is itself missing, malformed, or fails to resolve a grant, `eligible()`'s own existing logic (`grant.granted !== true` branch, `eligibilityPolicy.js:54`) already resolves to `false` — meaning the affected provider is excluded, never silently admitted. No new fallback path is introduced by this amendment, and none is authorized.

---

# 11. TRR Zero-Drift Guarantee — [DESIGN, the amendment's own binding acceptance requirement]

Activation **must** produce zero behavioral or context drift for the live TRR path. This is not merely intended — it is arithmetically provable today (§04) and must remain provable after implementation, verified by:
1. The existing `wp0PhaseE02aZeroDriftProof.test.js` suite continuing to pass (7/7, confirmed at current `HEAD`).
2. A new, real (non-shadow) regression proving `TrrCapabilityAdapter.buildReasoningContext()`'s actual output — the 6-field shape TRR's reasoning component consumes — is byte-identical before and after the seam change, for representative `pipelineContext` fixtures (§16).
3. `tests/trr001ProductionBackedAcceptance.test.js` (the existing production-backed acceptance suite) continuing to pass unmodified.

If any of these three cannot be demonstrated, implementation does not proceed — this is an acceptance gate, not an aspiration.

---

# 12. GENERAL_REASONING Guarantee — [DESIGN]

Activation does **not** activate `GENERAL_REASONING` — `GeneralReasoningActivationGate`'s binding-`false` default and `conversationalNeedCreator.js`'s own routing-seam exclusion (`isTrrMatch`, unaffected by anything in this amendment) remain the primary, sufficient non-liveness guarantee, unchanged. This amendment adds a **second, independent** guarantee, per Product's own explicit requirement: once activation lands, `userSafetyContext`/`userSafetyProvenance` must be structurally prevented from ever reaching `GENERAL_REASONING`'s composed context, **for as long as** its own `sensitiveContextAccessPolicy` remains `'NOT_AUTHORIZED'` — independent of whether a future, separately-approved decision ever flips `GeneralReasoningActivationGate` to live. This is the exact behavior §08's seam produces by construction (§04's computation already shows `reasoningAccessAuthorized:false` for both providers under `GENERAL_REASONING` today) — no additional mechanism is required beyond the seam itself functioning correctly.

**Acceptance requirement**: a test proving that even when `GENERAL_REASONING` is forced live in a test harness (mirroring the existing `wp0PhaseCOpenWorldProof.test.js` precedent's own "Phase-C tests may explicitly enable/invoke the gated capability" allowance), its composed context never contains `userSafetyContext`/`userSafetyProvenance`.

---

# 13. Safety Independence Guarantee — [CANON, restated]

Unaffected, structurally, by construction (§07) — Safety's own rule-matching reads `pipelineContext.userSafetyContext`/`userSafetyProvenance` directly, never through `ContextComposer`/`ContextRelevancePlanner` (`safetyLayer.js`, re-verified unchanged this session). This amendment introduces no code path that could narrow, delay, or otherwise interfere with Safety's own inputs. **Acceptance requirement**: the existing static "never-called-with" assertion style already used elsewhere in this repository's test suite is extended (or reconfirmed, if it already exists) to prove `contextRelevancePlanner.js`'s post-activation code is never required by or referenced from `safetyLayer.js`.

---

# 14. E.0.2b Compatibility — [CANON, restated, no new design]

Once §08's seam is live, a future Semantic Context Discovery candidate-catalogue builder (E.0.2b, not started, not authorized by this amendment) can source its `{id, description, relevanceTags}` list directly from the now-authorized ceiling — meaning Discovery never needs to evaluate `sensitivityTier`, `consentScope`, `capabilityRiskTier`, or `sensitiveContextAccessPolicy` itself, satisfying GCUK Ch.06/07's own frozen requirement (*"semantic relevance never grants access"*) by construction rather than by convention. This amendment authorizes no part of E.0.2b's own implementation (§17).

---

# 15. Exact File-Change Scope — [DESIGN]

**Changed (additive/seam-modification only):**
- `js/coachDecisionSystem/contextRelevancePlanner.js` — `select()`'s final filter predicate (§08) and new `consentState` parameter.
- `js/coachDecisionSystem/contextComposer.js` — `assemble()` gains/derives the same parameter and threads it through to `select()`.
- `js/coachDecisionSystem/trrCapabilityAdapter.js` — its `assemble()` call site supplies `consentState`.
- `js/coachDecisionSystem/generalReasoningCapability.js` — same call chain (test-reachable only, per §12).
- `js/coachDecisionSystem/internalPipelineOrchestrator.js` — a fourth `StateAccess.createEngineAccess({engineId:'memoryLayer', action:'PREFERENCE_CONSENT_READ', ...})` call site (§09), added immediately adjacent to the existing `runDecisionPass()` → `TrrCapabilityAdapter.buildReasoningContext()` call; `runDecisionPass()` gains an additive `identity`/`runId` parameter from its two existing callers, mirroring `buildOpportunitiesForDecisionPass()`'s own precedent (§09's own Engineering Fill note).

**Explicitly not touched by this amendment:** `eligibilityPolicy.js`, `consentScopeRegistry.js` (both already correct, per the Original SPEC, unmodified — this amendment activates their existing output, never their logic), `capabilityRegistry.js`, `safetyLayer.js`, `generalReasoningActivationGate.js`, `conversationalNeedCreator.js`, `memoryLayer.js` (consent stays outside `pipelineContext` assembly entirely, per §09 item 4 — no change to `assembleContext()`), `js/app.js` (no composition-root change is required — the resolved source is `internalPipelineOrchestrator.js`, which already owns identity construction), and every CCC-001 file (§17).

**New test files (indicative, finalized at implementation-SPEC-review time):** a post-activation TRR zero-drift regression (§11 item 2); a `GENERAL_REASONING`-forced-live Safety-adjacent-exclusion test (§12); an extended/reconfirmed Safety-isolation static assertion (§13).

---

# 16. Test Plan / Acceptance Criteria

| # | Requirement | Evidence required |
|---|---|---|
| 1 | Zero-drift proof suite still passes | `wp0PhaseE02aZeroDriftProof.test.js`, 7/7 |
| 2 | TRR's actual composed reasoning context is byte-identical pre/post activation | New regression, §11 item 2 |
| 3 | TRR production-backed acceptance suite unaffected | `trr001ProductionBackedAcceptance.test.js` unmodified, passing |
| 4 | `GENERAL_REASONING` cannot receive `userSafetyContext`/`userSafetyProvenance` even when forced live in a test harness | New test, §12 |
| 5 | Safety never references the modified seam | Static assertion, §13 |
| 6 | `consentState` is real plumbing, not hardcoded | A test proving a synthetic `consentScope`-bearing provider fixture is correctly included/excluded based on a synthetic granted/ungranted `consentState`, not merely proving today's all-`null` case |
| 7 | Fail-closed on malformed/missing `consentState` | A test proving a malformed `consentState` excludes the affected provider, never admits it |
| 8 | Full repository regression, no unexpected failure | Exact before/after counts reported at implementation time |
| 9 | `eligibilityPolicy.js`/`consentScopeRegistry.js`/`safetyLayer.js`/`generalReasoningActivationGate.js`/`conversationalNeedCreator.js` byte-unchanged | `git diff` empty for each, reported at implementation time |

---

# 17. Explicit Non-Goals — [CANON, restated and extended]

This amendment does NOT: implement OpenUnderstanding or Open Semantic Need (no such component exists; out of scope per the prior Repository-Fit Investigation); implement Semantic Context Discovery (E.0.2b, GCUK Ch.07 — a separate future SPEC); activate `GENERAL_REASONING` (§12); change Safety in any way (§13); change User Knowledge, Typed Memory, or `memoryConsent`'s own authority model; change CCC-001 (`docs/specs/CCC_001_SPEC_v1.0.md`, CANONICAL/CLOSED, unaffected — no file this amendment touches overlaps its own file list); create any new provider-specific or capability-specific relevance rule (`eligibilityPolicy.js`'s own binding "no `provider.id`/`capability.id` conditional" invariant is inherited unmodified); introduce any closed-world/situation taxonomy (the seam operates on already-frozen, purpose-of-use-shaped dimensions only, never content); change TRR's product behavior (§11 makes this an acceptance gate, not merely an intention); redesign any of the five frozen definitions in §05.

---

# 18. Pending Decisions, Repository Gaps, and Canonical Conflicts

Per the SPEC Authoring Standard's own required discipline (record rather than invent):

1. **RESOLVED this revision** — §09's `consentState`-sourcing mechanism (previously an open `[GAP]`) is now fixed: the `memoryLayer/PREFERENCE_CONSENT_READ` StateAccess capability, read once at `internalPipelineOrchestrator.js`, passed explicitly down to `eligibilityPolicy`. Only the exact parameter shape / `runId`-threading / boolean→`ConsentState`-adapter choice remains Engineering Fill (§09), which is not a blocker to approval.
2. **[GAP, carried forward, not new to this authoring pass]** `docs/specs/WP0_SPEC_v1.0.md` — cited by section number throughout the `coachDecisionSystem` codebase's own header comments (including files this amendment touches) — does not exist in the repository. This amendment does not cite it for any of its own binding claims (all citations here resolve to the Original SPEC, GCUK, or this session's own verified repository evidence), so its absence does not weaken anything asserted above — but it remains an open documentation-recovery item independent of this amendment.
3. **No new canonical conflict was found during this authoring pass.** GCUK Ch.06's "transitional cap" language and the Original SPEC's §13/§14 flip-point description are mutually consistent with §08's design (contextCeiling retained as outer bound, `reasoningAccessAuthorized` as the added inner gate) — checked explicitly, not merely assumed, during authoring. Re-checked this revision: the Product Consent Principle (§09.1) is consistent with, and does not narrow, the Consent Scope Registry's own already-stated purpose-of-use discipline (`consentScopeRegistry.js:11-16`) — no conflict found.

---

# 19. Status and Closure

This amendment is filed as **READY FOR PRODUCT/ARCHITECTURE SPEC REVIEW**. It authorizes no implementation by itself. Per explicit instruction for this task, no `js/**` or `tests/**` file has been touched in the course of authoring it. Implementation may begin only after a separate, explicit Product/Architecture go-ahead on this document — the same discipline the Original SPEC, GCUK, and every other canonical document in this repository already establish for themselves.
