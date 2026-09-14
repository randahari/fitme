
# DUC-001 SPEC v1.0 — Direct User Coach Admission
## Status: IMPLEMENTED / VERIFIED / CLOSED (Implementation Complete; Turn-Serving Post-Implementation Correction Applied; Full Repository Regression 2559/2559; No Remaining Item)

> **Document role:** Implementation SPEC. Translates `docs/governance/FITME_Direct_User_Coach_Admission_V1_Canonical_Decision_Package_v1.0.md` (the Package, `CANONICAL / APPROVED — PRE-IMPLEMENTATION`, commit `81508fe`) into an implementation-ready engineering contract. Mirrors `docs/specs/TRR_001_SPEC_v1.0.md`'s own structure, the precedent for how a Decision Package becomes a SPEC in this repository.
> **Canonical dependencies (all CLOSED or CANONICAL/APPROVED, none reopened by this SPEC):** the Package (above); D1 (`docs/specs/D1_SPEC_v1.0.md`); CARF (`docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md`); EUR-001 (`docs/specs/EUR_001_SPEC_v1.0.md`); TRR-001 (`docs/specs/TRR_001_SPEC_v1.0.md`); RGEF (`docs/specs/RGEF_SPEC_v1.0.md`); SL-001 (`docs/specs/SL-001_SPEC_v1.0.md`); B5 (`docs/tasks/B5/B5_SPEC_v1.0.md`).
> Citation format: `[FILE:LINE]`, verbatim against the repository at HEAD `81508fefa2aa62896b3229343ae9871c1308e317`.
> **Status of this version:** **IMPLEMENTED / VERIFIED / CLOSED.** Product/Architecture approved this SPEC for implementation (Revision 4, Engineering Readiness Review PASSED); implementation was then performed exactly per its frozen contracts, introducing no new Product/Architecture decision. A genuine turn-serving defect was found during Product/Architecture post-implementation review — an unrelated proactive Opportunity could displace the Candidate answering the originating Current User Turn — and resolved by a Product/Architecture-approved, narrow, additive correction (turn-serving admission scoped to `turnId`/`safetyHighRiskBypass`; the global `DIRECT_USER_REQUEST` hierarchy-tier/category mapping removed and replaced by a narrow `DIRECT_USER_REQUEST × ADAPT_TO_CURRENT_STATE → 5` Source×Reason override) — see §24 for full detail. Implementation commit `4d4e4bf48b75ca09b7d8b31ba9c56d5c09d6dcff`. DUC-001-specific acceptance: 57 tests, all passing. Full repository regression: **2559/2559 passing.** **No item remains open.** APP_READY, proactive TRR, and Safety are unchanged; Preference V1 remains paused, untouched.

---

## §00. Purpose

Define the minimum, implementation-ready engineering contract for: Current User Turn → canonical admission → bounded turn understanding → direct-request recognition → legitimate Need formation → professional-capability handling → governed outcome → Expression → response correlated to its originating turn — reusing existing, already-approved infrastructure wherever it already fits, and adding the smallest number of new, narrowly-scoped seams the Package's own 22+3 decisions require.

---

## §01. Repository Investigation Summary

Findings that shape every design decision below (full detail inline at point of use):

- `EngineRegistry.run(request)` — `request: {trigger, actions:{<id>:action}, payloads:{<id>:any}, context:{userId, sessionGeneration, now, runId}}` — already supports **per-engine payload data supplied at call time**, threaded verbatim into `engineContext.payload` `[js/engineRegistry.js:197-206]`. A user's raw turn does **not** need a new StateAccess read capability — it can be supplied as `payloads.coachDecisionSystem` on a new trigger call, exactly like any other engine payload.
- `coachDecisionSystem` is registered with `triggers: ['APP_READY']` only `[registerCoachDecisionSystem.js:29]`. `EngineRegistry.register()`'s own `triggers[]` is a plain string array — adding a second trigger value is a one-line, additive change `[engineRegistry.js:29]`.
- `internalPipelineOrchestrator.run(ctx)` already branches on `ctx.action`-independent logic today (it "ignores action/payload" per its own header) — this SPEC requires it to start reading `ctx.action`/`ctx.payload` for the new trigger only, additively, `APP_READY`/`DECISION_PASS` path fully byte-identical.
- `MemoryLayer.assembleContext(identity)` is the **sole** Decision-Input-read authority (D3 Decision 3, reused verbatim throughout `memoryLayer.js`'s header). No new StateAccess capability is required for turn intake specifically — the turn is a parameter, not a read.
- `StateAccess`'s `PERMISSIONS` table `[js/stateAccess.js:405-475]` is the precedented place for any *new persisted-source* read capability this SPEC needs (none are required for turn intake itself; see §03).
- `ReadinessStateInterpreter.classify(records)` takes `[{id, text}]` and returns eligible `{sourceMemoryId, statementText}` entries `[readinessStateInterpreter.js:189-208]` — content-agnostic about where `id`/`text` come from. A Current User Turn's own text can be submitted through this exact function unchanged.
- `initiativeEngine.js`'s `generate()` builds `opportunityProvenance` additively from `opportunity.id/sourceCategory/detectedAt/domain/topic/sameNeedId` `[initiativeEngine.js:432-441]` — `sameNeedId` was added as a **new, additive, undefined-safe field** for TRR-001. `turnId` can be added the identical way.
- `EUR_VALID_DOMAIN_TOPIC_PAIRS` `[explicitRequestInterpreter.js:67-77]` is an existing, closed, already-Product-approved `{domain, topic}` vocabulary spanning `NUTRITION`/`WORKOUT`/`WEIGHT`/`MEASUREMENT` — directly reusable **by pattern** (never by import, per every existing interpreter's own convention) as the closed vocabulary a turn's Affirmative Direct Request can be tagged against, without inventing a new taxonomy.
- `TerminalDecision.kind` was originally a closed 4-value enum: `['RECOMMENDATION', 'INITIATIVE', 'SILENCE', 'BOUNDARY']` `[expressionInputGate.js:43]`. Full inspection of `expressionInputGate.js`, `deliveryIntentContract.js`, `decisionFormation.js`, and (found only on repository-wide re-audit, Revision 3) `expressionRenderer.js`, proved `BOUNDARY`/`boundaryType` structurally inseparable from a real Safety disposition — no existing value represented "understood, no capability, no Safety event." **Product/Architecture has since authorized a fifth value, `'UNSUPPORTED'`, decoupled from Safety's own disposition machinery (§12)** — the exact minimum changes to all four affected files are frozen there.
- `contextualMeaningPolicy.js` is `InitiativeEngine`'s **own internal helper**, invoked "אך ורק ע"י ה-Stage-3 contributor המזהה (Initiative Engine)" — not a universal Stage-3 gate every contributor must route through. The Conversational Need Creator (§06) is a **separate** Stage-3 contributor and constructs its own `validReasonCategory` directly, exactly as the Package's Ch.13 already anticipates.
- No workout-notes, chat, or conversational free-text UI exists anywhere in `index.html` today (confirmed in the prior Dogfooding investigation, unchanged since). `#food-input` (free text → `analyzeFood()`) and the Memory "add fact" dialog (`prompt()` → Typed Memory) are the only free-text surfaces, and neither is reused for DUC-001's own admission path (per the Package's Ch.02/Ch.07 boundary and Ch.26 Legacy Coach prohibition).
- `SessionLifecycle.isCurrent(gen)`/`getGeneration()` `[sessionLifecycle.js:17-20]` is the existing, already-proven generation guard, reused unchanged throughout.

---

## §02. Current User Turn Contract (Decision 1, Ch.06)

**V1 shape** (in-memory JS object, never persisted by default, never a new Firestore schema):

```
CurrentUserTurn = {
  turnId: string,            // required — see §14
  text: string,               // required — raw user text, non-empty
  submittedAt: number,        // required — client timestamp (ms)
  sessionGeneration: number,  // required — captured at submission time, checked via SessionLifecycle.isCurrent()
  clarificationContext: {     // optional — present only when this turn is the user's answer to a clarification
    priorTurnId: string,
    priorNeedRef: string      // opaque; see §13
  } | undefined
}
```

- **Transient by default**: exists only for the duration of one Decision Pass; not written to Firestore, not added to any in-memory store beyond the single pipeline run that consumes it.
- **Not automatically Typed Memory**: no code path in this contract writes to `js/memory.js`'s `createMemory()`. Persistence, if ever added, is a **separate**, future, explicitly-authorized capability (Package Ch.08) — out of DUC-001 V1's own scope.
- **Not read before use**: downstream components never re-fetch it from anywhere; it is passed by reference through exactly one call chain (§04→§06).
- **Raw text ownership boundary**: only the UI submission handler (§15) and the bounded Turn Understanding step (§04) ever see `text` directly. Every downstream consumer (Need Creator, Reasoning) receives only the bounded, structured output *derived* from it — never the raw string itself — except where §11 explicitly authorizes passing the raw text into an existing interpreter's own `{id, text}` contract (`ReadinessStateInterpreter`), which is the same discipline every existing bounded interpreter already applies to Typed Memory text.
- **Immutability**: frozen (`Object.freeze`) at creation, mirroring every other Pipeline-Context-adjacent object in this codebase.
- **No speculative fields.** No `attachments`, `locale`, `deviceInfo`, `channel`, or similar are added — none is required by any of the Package's 22+3 decisions.

---

## §03. `USER_MESSAGE_SUBMITTED` — Decision-Pass Trigger (Decision 11, Ch.16)

**Registration** — `registerCoachDecisionSystem.js` gains a second trigger value only:

```diff
- triggers: ['APP_READY'],
+ triggers: ['APP_READY', 'USER_MESSAGE_SUBMITTED'],
```

No second `EngineRegistry.register()` call, no second Engine, no parallel Coach architecture — the same, single, already-registered `coachDecisionSystem` Composite Engine now answers a second trigger, exactly the pattern `habitEngine`/`patternEngine`/`triggerEngine` already use for their own multiple triggers `[registerEngines.js]`.

**Call site** — a new function, `runUserMessageEngine(turn)`, mirroring `runAppReadyEngines()`'s own shape and `runEngineAction()`'s own generic single-engine-action helper `[js/app.js:2196-2201]` exactly:

```js
async function runUserMessageEngine(turn) {
  var gen = SessionLifecycle.getGeneration();
  if (!SessionLifecycle.isCurrent(turn.sessionGeneration)) return { status: 'STALE_SESSION' };
  return EngineRegistry.run({
    trigger: 'USER_MESSAGE_SUBMITTED',
    actions: { coachDecisionSystem: 'DIRECT_TURN_PASS' },
    payloads: { coachDecisionSystem: { turn: turn } },
    context: { userId: currentUser && currentUser.uid, sessionGeneration: gen, now: turn.submittedAt }
  });
}
```

- **Distinct action, `DIRECT_TURN_PASS`** (never `DECISION_PASS`) — lets `internalPipelineOrchestrator.run(ctx)` branch cleanly on `ctx.action` without touching the existing `APP_READY`/`DECISION_PASS` path at all.
- **Session-generation safety**: reused unmodified — `SessionLifecycle.isCurrent()` checked both before dispatch (here) and, per existing convention, again before any UI-visible effect (§15).
- **Distinct from `APP_READY`**: never invoked from `showApp()`; invoked only from the new Conversation Surface's own submit handler (§15). The two triggers cannot structurally collide (different call sites; `EngineRegistry.run()`'s own `buildPlan(trigger)` computes an independent plan per trigger, and neither trigger's own eligible-engine set overlaps in a way that causes duplicate output — see "no duplicate delivery" below).
- **No duplicate/unrelated response**: the two paths are kept from cross-contaminating **by routing, not by locking** — `APP_READY`'s own Expression dispatch continues to target `#trigger-card` via `TriggerController.presentDeliveryIntent()` unchanged (§16); the new `DIRECT_TURN_PASS` path's own Expression dispatch targets the new Conversation Surface's own rendering function instead, correlated by `turnId` (§16). Even if a user submits a message during the narrow async window an in-flight `APP_READY` pass is still running (both `EngineRegistry.run()` calls are independent, non-locking async calls), each produces its own independent `TerminalDecision`/Delivery Intent, delivered to its own, non-overlapping UI target — no shared mutable pipeline state exists between the two calls (`MemoryLayer.assembleContext()` is a pure read; the only shared mutable state, `memoryLayer.js`'s own `_explicitUserStatementArrivals` map, is untouched by this SPEC).
- **Duplicate submission** (double-tap send): a UI-level guard, not a pipeline-level one — the Conversation Surface (§15) disables its own submit control for the duration of one in-flight `runUserMessageEngine()` call, mirroring the existing "המאמן כותב..." loading-state discipline `[coachPresenter.js:111-124]`.

---

## §04. Bounded Turn Understanding (Decision 4, Ch.09)

**New module**, name not frozen by the Package — this SPEC names it `js/coachDecisionSystem/turnUnderstandingInterpreter.js`, structurally identical in skeleton to every existing bounded interpreter (`explicitRequestInterpreter.js`, `readinessStateInterpreter.js`): deterministic batching (single-turn V1 input, batching machinery reused only for shape-consistency, not because multiple turns are ever batched together), `configure({callClaude})`, fixed timeout, no retry, per-turn prompt delimiting, fail-closed-by-omission.

**V1 structured output contract** — closed, bounded, four independent dimensions, mirroring EUR-001's own multi-gated-dimension shape exactly (never a universal taxonomy):

```
{
  interpretationStatus: 'CLASSIFIED' | 'FAILED',   // REVISED (Blocker 7) — see below; every other field
                                                     // below is meaningful only when 'CLASSIFIED'
  affirmativeRequest: {
    present: boolean,
    domain: <one of a narrow, closed, DUC-001-owned domain/topic vocabulary, reused BY PATTERN from
             EUR_VALID_DOMAIN_TOPIC_PAIRS' own shape — see §06's REVISED note; never a gate — metadata only> | null,
    topic: <matching topic> | null
  },
  currentStateStatement: {                 // ordinary fatigue/energy/sleep/time/prior-activity only —
    present: boolean,                       // identical closed scope to TRR-001's ReadinessStateInterpreter
    text: string | null                     // the substring expressing the state, verbatim, for §11 reuse
  },
  negativeControlPresent: boolean,          // advisory only — see §09, never itself routed by this module
  desireOnlyPresent: boolean                // Decision 5B (Ch.10a) — true only when desire/intent exists
                                             // WITHOUT affirmativeRequest.present === true on the same turn
}
```

**REVISED (Blocker 7) — `interpretationStatus`.** The original v1.0 draft conflated "no request present" (a genuine, successfully-classified turn, e.g. `"אני עייף היום"` alone) with "the interpreter failed" (malformed model output / transport failure) — both degraded to the same all-`false` shape, indistinguishable downstream. This is corrected: `interpretationStatus: 'FAILED'` is a distinct, machine-readable outcome (§17, Case A vs. Case C), even though **user-facing behavior for both remains identical today** (a Decision-Pass-level Silence — no fabricated request is invented merely because interpretation failed, and no error is surfaced to the user for an ordinary AI-transport hiccup). The distinction exists for correctness/observability, not to change V1 user-facing behavior; nothing here requires a new Product decision — it is the same fail-closed-by-omission discipline every sibling interpreter already uses, now surfaced as its own explicit status rather than silently folded into "false."

- **Domain-agnostic, extensible**: `affirmativeRequest.{domain,topic}` reuses the *same* closed vocabulary EUR-001 already owns — not a new taxonomy, and extensible the same way EUR-001's own is (a future Product/Architecture decision adds a pair, never a schema rewrite).
- **Multiple simultaneous roles**: all four fields are independent; a turn may set `affirmativeRequest.present`, `currentStateStatement.present`, and `negativeControlPresent` simultaneously (Package Ch.11's own worked example).
- **Non-user-facing**: this module never produces prose; its entire output is the closed structure above.
- **Desire vs. request (Decision 5B)**: the model is instructed, in the frozen prompt, that a bare desire/intent statement with no accompanying question/judgment-seeking clause resolves `affirmativeRequest.present: false, desireOnlyPresent: true`; a desire *combined with* a question ("...מה דעתך?"/"...כדאי לי?") resolves `affirmativeRequest.present: true` (and `desireOnlyPresent` is then `false`, since request causality — not the desire — is what's present). This mirrors EUR-001's own "never guess from an ambiguous or positively-framed statement" discipline verbatim `[explicitRequestInterpreter.js:148-149]`.
- **Failure/malformed output**: identical fail-closed-by-omission discipline as every sibling interpreter — malformed/timeout/unconfigured `callClaude` → the entire structure resolves all-`false`/all-`null` (never a partial trust of a well-formed-looking fragment), which downstream (§06) is indistinguishable from "no Affirmative Direct Request present" — never an error surfaced to the user, never a crash.
- **Wiring**: `configure({callClaude: function (body) { return callClaude(body); }})` at the `js/app.js` composition root, identical to the five existing sibling calls — see §18.

---

## §05. Affirmative Direct Request (Decision 5, Decision 5B — Ch.10, Ch.10a)

Engineering contract, fully covered by §04's own output shape: `affirmativeRequest.present === true` **is** the Affirmative Direct Request signal. No separate module. The canonical examples resolve deterministically under §04's contract:

| Input | `affirmativeRequest.present` | `desireOnlyPresent` |
|---|---|---|
| `"אני רוצה לרוץ היום"` | `false` | `true` |
| `"אני רוצה לרוץ היום, מה דעתך?"` | `true` | `false` |
| `"אל תציע לי ריצה"` | `false` | `false` (`negativeControlPresent: true`) |

Preference V1 cannot be indirectly activated: `desireOnlyPresent: true` is **never read** by the Conversational Need Creator (§06) as a trigger for anything — it exists in the structured output only so a future, separately-authorized capability could one day consume it; V1 wiring simply never looks at that field for Need-formation purposes.

---

## §06. Conversational Need Creator (Decision 8, Ch.13)

**New module**, name not frozen by the Package — this SPEC names it `js/coachDecisionSystem/conversationalNeedCreator.js`, a **fifth Stage-3 contributor**, structurally parallel to `RecommendationEngine`/`InitiativeEngine`/`SafetyLayer`'s own existing Stage-3 detection role, dispatched from `internalPipelineOrchestrator.js` only on the `DIRECT_TURN_PASS` action path (never on `APP_READY`).

**Contract — REVISED (Blocker 2/3):**

```js
function recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext) → DirectUserNeed | null
```

**Critical correction from the v1.0 draft.** The original draft gated the very *existence* of a Need on a `{domain, topic}` match against EUR-001's own closed vocabulary — meaning a nutrition question would never even become a "legitimate direct-user Need," only a bare unsupported signal. Product/Architecture review (Blocker 2) correctly identified this as **admission depending on successful classification into a closed vocabulary — explicitly forbidden**. Revised, two-step design that separates **Need recognition** (domain-agnostic, gated only on Decision 5's own semantics) from **professional-capability resolution** (a later, separate step, §09):

**Step A — Need recognition (domain-agnostic, the only gate):**
```js
if (turnUnderstanding.interpretationStatus !== 'CLASSIFIED') return null;      // §17 Case C
if (turnUnderstanding.affirmativeRequest.present !== true) return null;        // §17 Case A
// A legitimate DirectUserNeed now exists, REGARDLESS of domain/topic:
var need = {
  needRef: 'duc:direct-user-request:' + turn.turnId,
  turnId: turn.turnId,
  domain: turnUnderstanding.affirmativeRequest.domain,   // metadata only, may be null/UNRESOLVED
  topic: turnUnderstanding.affirmativeRequest.topic,      // metadata only, may be null/UNRESOLVED
  recognizedAt: pipelineContext.assembledAt
};
```
This `DirectUserNeed` is the honest, domain-agnostic acknowledgment Decision 10 (Ch.15) requires — it exists identically whether the eventual capability check (Step B) succeeds or not, satisfying Decision 10's own principle verbatim: *"FITME may correctly understand a User Turn while determining no currently-authorized professional capability exists for that Need"* — the Need is understood first, capability is resolved second, never conflated.

**Step B — Professional-capability resolution (§09), performed on an already-recognized `need`, never gating its existence:**
```js
if (need.domain === 'WORKOUT' && need.topic === 'WORKOUT_FREQUENCY') {  // the ONE pair TRR-001 owns —
                                                                          // a single, deterministic,
                                                                          // non-AI-owned equality check,
                                                                          // structurally identical to
                                                                          // contextualMeaningPolicy.js's
                                                                          // own isTrainingReadinessObservation()
                                                                          // [contextualMeaningPolicy.js:63-67]
  return {
    kind: 'DETECTED_OPPORTUNITY',
    opportunity: {
      id: need.needRef, sourceCategory: 'DIRECT_USER_REQUEST', detectingContributor: 'CONVERSATIONAL_NEED_CREATOR',
      turnId: turn.turnId,                               // NEW additive field — see §14
      proposedAction: '__DUC_PENDING_REASONING__',         // placeholder, TRR's own established convention [initiativeEngine.js:623]
      domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY',
      validReasonCategory: 'ADAPT_TO_CURRENT_STATE',        // V1 capability mapping only — Decision 14/19, never a redefinition
      trustTestSignal: { glad: null, basis: 'DIRECT_USER_REQUEST admits via the Bounded Engagement Policy, not an affirmative Trust source — see §08.' },
      safetyHighRiskBypass: false, detectedAt: pipelineContext.assembledAt
    }
  };
}
return { kind: 'UNSUPPORTED', need: need };   // §12 — consumed by DecisionFormation.formUnsupportedCapabilityOutcome()
```

**Domain/topic vocabulary status (Blocker 2, resolved):** the closed `{domain, topic}` vocabulary used at Step A/B is **optional routing metadata only** — reused *by pattern* from `EUR_VALID_DOMAIN_TOPIC_PAIRS`' own shape (never by import, never invoking EUR-001's own authority), and its absence or non-match **never** prevents Need recognition. A future domain absent from this vocabulary (habits, goals, schedule, travel, recovery) still produces a real `DirectUserNeed` at Step A; only Step B's own capability match fails for it, correctly routing to §12's unsupported outcome rather than failing to recognize the request at all. Extending this vocabulary for a future domain is the identical, low-risk, additive action already established for `EUR_VALID_DOMAIN_TOPIC_PAIRS` itself — never a DUC-001 Admission-layer change.

**Explicit non-behavior**, matching the Package's Ch.13 verbatim: never answers the user; never calls Expression; never owns Safety; performs no free-form routing (Step B is the entire routing logic — one equality check, not a table); never reinterprets EUR-001 (negative-control turns still produce a `DirectUserNeed` at Step A if an affirmative request also exists in the same turn, per Decision 11/Blocker 6 — EUR-001's own machinery is untouched and independently still applies its own suppression check downstream at Stage 6, unaffected by this contributor's own Step A/B); never creates a Need from `desireOnlyPresent` alone (Step A's own gate is `affirmativeRequest.present`, never `desireOnlyPresent`).

**Collection**: `internalPipelineOrchestrator.js`'s existing `collectDetectedOpportunities()` gains one additive branch, parallel to its existing `trainingReadinessOpportunities` branch `[internalPipelineOrchestrator.js:256-258]`, active only when `ctx.action === 'DIRECT_TURN_PASS'` — and only consumes a `kind: 'DETECTED_OPPORTUNITY'` result from Step B. A `kind: 'UNSUPPORTED'` result is **not** collected here at all; it is handled by the orchestrator's own separate, pre-Stage-4 branch (§12).

---

## §07. D1 Stage-3 Integration (Decision 7, Ch.12)

`DIRECT_USER_REQUEST` is added to the code-level `sourceCategory` vocabulary wherever it is currently declared as a closed set (mirroring exactly how `ADAPT_TO_CURRENT_STATE` was added to `VALID_REASON_CATEGORIES` in **both** of its independently-maintained copies, per TRR-001's own precedent `[contextualMeaningPolicy.js:25-29]`, `[eligibilityEvaluator.js]`). No existing contributor (`RecommendationEngine`, `InitiativeEngine`, `SafetyLayer`) is modified in its own detection logic — each remains exactly as it is; the Conversational Need Creator is purely additive, called alongside them in `collectDetectedOpportunities()`.

**Combination semantics** where a `DIRECT_TURN_PASS` might also encounter other live signals: `buildOpportunitiesForDecisionPass()`'s existing Stage-3→4→5 aggregation, Evidence Evaluation, and eligibility flow are reused **unmodified** — a `DIRECT_TURN_PASS` run still calls the same `collectDetectedOpportunities()` (now including the Need Creator's own contribution), the same `EvidenceEvaluator.evaluate()`, the same `EligibilityEvaluator.evaluate()`. Nothing about this combination is new; it is the exact same "every Stage-3 contributor offered independently, no Stage-3/Stage-6 routing policy of its own" discipline TASK-006 already established `[internalPipelineOrchestrator.js:211-217]`.

**No accidental duplicate autonomous response**: resolved structurally in §03, not by new pipeline logic — the two triggers never share a Decision Pass, and Expression dispatch is routed by call-site (§16), not by shared state.

---

## §08. Source × Reason / Eligibility (Decision 16, Ch.21)

**Evidence sufficiency**: `DetectedOpportunity.trustTestSignal` above deliberately never fabricates `glad: true` — the Trust Test itself is not being bypassed; admission instead flows through the **existing** Bounded Engagement Policy mechanism (RGEF's own, already-proven, `glad === null`-strict admission path `[eligibilityEvaluator.js §22]`), which requires exactly a `(sourceCategory, validReasonCategory)` table entry, not a fabricated Trust signal.

**Required additive table entries** (mirroring TRR-001's own second-entry precedent exactly, both independently-maintained tables):

```diff
// eligibilityEvaluator.js
var BOUNDED_ENGAGEMENT_POLICY = Object.freeze({
  CONFIRMED_PATTERN_ANTICIPATION: Object.freeze({
    REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION: true,
    ADAPT_TO_CURRENT_STATE: true
  }),
+ DIRECT_USER_REQUEST: Object.freeze({
+   ADAPT_TO_CURRENT_STATE: true
+ })
});
```
```diff
// initiativeEngine.js
var SOURCE_REASON_MATURITY_OVERRIDES = Object.freeze({
  CONFIRMED_PATTERN_ANTICIPATION: Object.freeze({
    REQUEST_SIGNIFICANTLY_IMPROVING_INFORMATION: Object.freeze(['OBSERVER', ...]),
    ADAPT_TO_CURRENT_STATE: Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'])
  }),
+ DIRECT_USER_REQUEST: Object.freeze({
+   ADAPT_TO_CURRENT_STATE: Object.freeze(['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH'])
+ })
});
```

Both are **new top-level keys**, not a third value nested under the existing `CONFIRMED_PATTERN_ANTICIPATION` key — the Package's own Ch.21 language ("a third... case") describes the conceptual sequence (RGEF's case, TRR's case, DUC's case), not the literal object shape; the mechanical realization is a new source-keyed entry, exactly matching each table's own existing structure. `initiativeEngine.js`'s own guard comment — *"A third entry SHALL NOT be added without a new, explicit Product/Architecture decision (RGEF §13.2)"* — is satisfied by the Package itself (Ch.21: "this Package IS that explicit decision for this one new case").

**Earliest-relationship-stage servicing**: `['OBSERVER', 'ASSISTANT', 'TRUSTED_COACH', 'PERSONAL_COACH']` (all four stages) is required, not merely `['OBSERVER']`, so a legitimate direct request is never blocked at any relationship stage — consistent with TRR-001's own identical all-stages entry.

**No unrelated Source × Reason combination is broadened** — `RECOMMENDATION_ENGINE`'s and `CONFIRMED_PATTERN_ANTICIPATION`'s own existing entries are untouched.

---

## §09. Professional Capability Handling (Decision 10, Decision 17 — Ch.15, Ch.22)

**REVISED (Blocker 3)**: this resolution occurs strictly **after** Need recognition (§06 Step A) — never co-located with, or owned by, Turn Understanding (§04) itself, and never gating whether a Need exists at all (§06's own Blocker-2 correction). The narrowest V1 mechanism is §06 **Step B**'s single, deterministic equality check, owned by the Conversational Need Creator, not the AI-backed interpreter — **not** a registry, **not** a growing if/else chain distinguishing many verticals (there is exactly one live vertical to distinguish from "everything else"). The architectural seam a second real professional capability will attach to is **exactly** §06 Step B's own conditional — Decision 17's recorded architecture trigger (Package Ch.22) applies the moment a second `(domain, topic)` pair needs its own `validReasonCategory` mapping: at that point, this single `if` becomes the first two rows of a real dispatch table, and Engineering must review whether a generalized Professional Capability / Reasoning Dispatch contract is required, per the Package's own recorded commitment — **not before**, and not as part of this SPEC.

A: supported (TRR) = §06 Step B's `true` branch, `kind: 'DETECTED_OPPORTUNITY'`. B: understood-but-unsupported = §06 Step B's `else` branch, `kind: 'UNSUPPORTED'`, carrying the already-recognized `DirectUserNeed` — detailed in §12.

**Proof against the "nutrition accidentally reaches TRR" failure mode** (Blocker 3's own worked example): `"כמה חלבון נשאר לי היום?"` → §04 resolves `affirmativeRequest: {present: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE'}` (or `null`/unresolved, if the model cannot confidently tag it — either way, **not** `{WORKOUT, WORKOUT_FREQUENCY}`) → §06 Step A recognizes a real `DirectUserNeed` (domain-agnostically) → §06 Step B's single equality check evaluates `false` (NUTRITION/PROTEIN_INTAKE ≠ WORKOUT/WORKOUT_FREQUENCY) → `kind: 'UNSUPPORTED'` is returned. The check is a plain string-equality comparison inside deterministic, non-AI code (`conversationalNeedCreator.js`) — the AI-backed `TurnUnderstandingInterpreter` never decides routing; it only supplies a classification tag that the deterministic Need Creator then compares. There is no path by which a nutrition-tagged (or unresolved) Need reaches `ADAPT_TO_CURRENT_STATE`/TRR.

---

## §10. TRR Direct-User Integration (Decision 15, Ch.20)

`internalPipelineOrchestrator.js`'s existing `runDecisionPass()` reasoning-invocation step is reused **byte-identically** — its own gate is already `eligibilityInput.validReasonCategory === 'ADAPT_TO_CURRENT_STATE'` `[internalPipelineOrchestrator.js:421]`, which does not inspect `sourceCategory` at all. A `DIRECT_USER_REQUEST`-sourced, now-`ELIGIBLE` opportunity reaches `TrainingReadinessReasoningComponent.propose()` through this exact, unmodified branch — **zero code change required in this file for the reasoning-invocation step itself.** `resolveTrainingReadinessProposal()`, `ActivityReferenceNormalizer`, Candidate construction (`dispatchStage6` → `InitiativeEngine.generate()`), Safety, Decision Formation, and Expression are all reused unmodified. No ChatTRR, no second reasoning component, no alternate Candidate schema, no direct-to-Claude path — none is created by this SPEC.

**One additive field** is required in `resolveTrainingReadinessProposal()`'s output (mirroring `sameNeedId`'s own precedent): `resolved.turnId = eligibleOpportunity.turnId` (undefined-safe — absent for every proactive/non-DUC Candidate), so §14's correlation chain survives into the Candidate itself.

---

## §11. Current-Turn Evidence (Decision 13, Ch.18)

`memoryLayer.js`'s `assembleContext()` gains one **additive parameter**: `assembleContext(identity, currentUserTurn)` (second parameter, `undefined` on every existing `APP_READY` call site — zero behavior change there). When present, its own `readinessStateContext` assembly step (currently reading only Typed Memory `[memoryLayer.js:499-528]`) additionally submits the turn's own text as one more `{id, text}` record to `ReadinessStateInterpreter.classify()` — `{id: 'turn:' + currentUserTurn.turnId, text: currentUserTurn.text}` — reusing that function completely unmodified.

**REVISED (Blocker 4) — exact bounded representation.** The resulting `readinessStateContext.items` entry for that record carries:
```js
{
  statementText: <verbatim text>,
  sourceMemoryId: 'turn:' + currentUserTurn.turnId,
  interpretationAuthority: 'DERIVED_INTERPRETATION',   // unchanged — the interpreter still classified it
  provenance: 'CURRENT_TURN',                            // NEW, third value alongside existing 'USER_STATED' [memoryLayer.js:519]
  capturedAt: currentUserTurn.submittedAt                 // NEW field, current-turn items only — see below
}
```
`provenance` distinguishes **A** (this turn, `'CURRENT_TURN'`) from **B** (durable Typed Memory, `'USER_STATED'`, unchanged) machine-readably and unambiguously — satisfying Blocker 4's example (`"ישנתי 5 שעות"` this turn vs. `"בדרך כלל ישן 7 שעות"` from durable memory: two distinct `readinessStateContext.items` entries, never flattened into one). **C** (measured/acquired) and **D** (derived interpretation) remain exactly as already reserved and honestly `UNAVAILABLE`/never-fabricated per `memoryLayer.js`'s own existing disclosure (no acquisition source exists for either in this repository) — DUC-001 does not change this.

**Temporal boundary — disclosed scope limit, not a blocker.** `capturedAt` is added **only** for current-turn items, where the timestamp is already available (`currentUserTurn.submittedAt`) at zero cost. Durable Typed Memory items read via the existing `USER_STATED_MEMORY_READ` capability do **not** currently surface a per-record timestamp into `readinessStateContext.items`' own shape at all (confirmed: no timestamp field exists there today for any provenance). Adding one for durable records would require touching USM-001's own closed read contract — **out of this SPEC's scope**, not required by Blocker 4 (which asks that source/temporal boundaries be "machine-readable and structurally preserved," not that every existing record retroactively gain a field it never had) — `provenance` alone already fully satisfies "must not flatten these into indistinguishable evidence" for the required A/B distinction.

**Precedence when both exist**: both are submitted to `ReadinessStateInterpreter.classify()` in the same batch and both survive independently if both classify — `TrainingReadinessReasoningComponent`'s own prompt already receives the full `readinessStateContext.items` array (never a single-item field) `[memoryLayer.js:669]`, so the reasoning component itself — not a new deterministic precedence rule — weighs multiple current-state statements exactly as CARF's own frozen "flexible reasoning within bounded context" principle intends. Per Blocker 4's own instruction, no deterministic "current always beats historical" rule is invented; none is required.

**Never silently promoted to durable truth**: no code path in this contract calls `createMemory()`/`js/memory.js` for current-turn text. The `provenance: 'CURRENT_TURN'` tag is exactly the mechanism preventing this confusion at every future read site.

**REVISED (Blocker 6) — the identical mechanism additively extends `explicitRequestControls`.** `memoryLayer.js`'s existing `explicitRequestControls` assembly step (currently reading only Typed Memory via the same `USER_STATED_MEMORY_READ` capability `[memoryLayer.js:354-383]`) gains the identical additive submission: the current turn's own text is also offered to `ExplicitRequestInterpreter.classify()` as one more `{id, text}` record. This is the mechanism that makes a negative-control clause *within the current turn itself* (not only previously-persisted Typed Memory) reachable by EUR-001's own existing, completely unmodified `isActionableControl()` gate and Stage-6 `explicitlyRequestedAgainst()` suppression check — see §06's Step A/B non-behavior note and §12a below for the mixed-turn trace.

---

## §12. Unsupported Capability Outcome (Decision 18, Ch.23) — **RESOLVED: `TerminalDecision.kind = 'UNSUPPORTED'` authorized by Product/Architecture**

Product/Architecture has authorized a fifth, additive `TerminalDecision.kind` value, `'UNSUPPORTED'`, decoupled entirely from Safety's own disposition machinery — Option (a) of the three raw options the prior review surfaced. This section freezes the exact minimum implementation shape, verified against **every** live contract that governs `kind` (§C of the accompanying report; the prior review's own two-file inspection was incomplete — a **third and fourth** file, `decisionFormation.js`'s own construction authority and `expressionRenderer.js`'s own rendering dispatch, are both load-bearing and are specified below).

### Exact `TerminalDecision` shape

```js
{
  kind: 'UNSUPPORTED',
  rationale: { rationale, evidenceBasis, expectedValue, uncertainty },  // required, same shape as every existing kind
  decisionPassTrace: { opportunitiesConsidered, candidatePoolSize: 0, disqualifiedCandidates: [] },
  candidateProvenance: [],           // no real Candidate ever existed — mirrors formDecisionPassSilence()'s own shape exactly
  immutable: true
  // NO confidence, NO hierarchyTier (RECOMMENDATION/INITIATIVE-only)
  // NO boundaryType (BOUNDARY-only)
  // NO safetyDisposition (present iff a real Safety review occurred — none did)
  // NO modification (MODIFIED-disposition-only)
}
```

This is the **minimum** shape satisfying every existing structural requirement `isValidTerminalDecision()` already enforces for a non-`BOUNDARY`, non-`RECOMMENDATION`/`INITIATIVE` kind, with zero fabricated fields.

### Decision Formation — new, narrow, sibling construction function

`decisionFormation.js` gains **one new function**, `formUnsupportedCapabilityOutcome(params)`, structurally identical in shape and status to the existing `formDecisionPassSilence()` `[decisionFormation.js:55-77]` — a second, narrow, non-Safety-reviewed Terminal Decision construction path, **not** a second Stage-9 authority (Decision Formation remains the sole, exclusive constructor of every `TerminalDecision`, satisfying Ch.23's own "never more than one Terminal Decision per Decision Pass" invariant — this is simply its third recognized construction shape, alongside `form()`'s Safety-reviewed path and `formDecisionPassSilence()`'s zero-Candidate path):

```js
function formUnsupportedCapabilityOutcome(params) {
  params = params || {};
  var need = params.need || {};
  // Internal Need/turn provenance, preserved ON the immutable TerminalDecision itself — not merely
  // available to whatever caller happens to still hold `turn` in closure. Reuses the exact
  // {opportunityId, sourceCategory, internalOutcome, reason}-shaped entry runDecisionPass() already
  // constructs for every real Opportunity considered (internalPipelineOrchestrator.js's own
  // opportunitiesConsidered.push() pattern) — extended honestly for the one case that never reaches
  // Stage 5 Eligibility at all. need.needRef already encodes turnId by the same 'duc:direct-user-
  // request:'+turnId convention every DetectedOpportunity.id in this SPEC uses (§06), so no new
  // field name is required to recover it.
  var consideredEntry = freezeShallow({
    opportunityId: need.needRef, sourceCategory: 'DIRECT_USER_REQUEST',
    internalOutcome: 'UNSUPPORTED_CAPABILITY', reason: 'No (domain, topic) match against any currently-authorized professional capability.'
  });
  return freezeShallow({
    status: 'FORMED',
    decision: freezeShallow({
      kind: 'UNSUPPORTED',
      rationale: freezeShallow({
        rationale: 'A legitimate direct-user request was recognized, but no currently-authorized professional capability exists to handle it.',
        evidenceBasis: 'Conversational Need Creator Step B — no (domain, topic) match against any currently-authorized professional capability.',
        expectedValue: 'An honest response, rather than silence or misrouting, preserves user trust in FITME\'s own boundaries.',
        uncertainty: 'None — deterministic given the professional-capability resolution already performed.'
      }),
      decisionPassTrace: freezeShallow({
        opportunitiesConsidered: freezeShallow([consideredEntry].concat((params.opportunitiesConsidered || []).slice())),
        candidatePoolSize: 0, disqualifiedCandidates: freezeShallow([])
      }),
      candidateProvenance: freezeShallow([]),
      immutable: true
    })
  });
}
```

**Internal provenance vs. presentation correlation — the distinction this revision makes explicit.** `consideredEntry.opportunityId` (= `need.needRef` = `'duc:direct-user-request:' + turn.turnId`) is real, canonical internal provenance, **recorded on the governed `TerminalDecision` object itself** — available to `decisionPassTrace`-reading tests, logs, and any future consumer, entirely independent of any calling code's own closure. This is distinct from, and in addition to, §14's own closure-based **presentation** correlation (which UI slot receives the rendered response) — the two serve different purposes and neither substitutes for the other. `turnId` is never the *only* surviving identity after admission: it is recorded internally here (via `needRef`), on `DirectUserNeed.turnId` (§06 Step A), and — for the TRR-supported path — on `Candidate.opportunityProvenance.turnId` and `TerminalDecision.candidateProvenance[0].turnId` (§14); closure is used exclusively for UI delivery routing, never as a substitute for canonical data provenance.

Called directly by `internalPipelineOrchestrator.js`'s `DIRECT_TURN_PASS` path when §06 Step B returns `kind: 'UNSUPPORTED'` — **bypassing Stage 4 (Evidence)/Stage 5 (Eligibility)/Stage 6 (Candidate)/Stage 8-9's Safety-review branch entirely** (there is no Candidate to evaluate; `safetyPort.finalReview()` is never called for this path, exactly as it is already never called for `formDecisionPassSilence()`'s own zero-Candidate path). No fake Candidate or Safety data is attached, per Product's own explicit instruction.

### `expressionInputGate.js` — minimal additive change

```diff
- var KINDS = ['RECOMMENDATION', 'INITIATIVE', 'SILENCE', 'BOUNDARY'];
+ var KINDS = ['RECOMMENDATION', 'INITIATIVE', 'SILENCE', 'BOUNDARY', 'UNSUPPORTED'];
```
```diff
    } else if (hasSafetyDisposition) {
      ...
-   } else if (candidate.kind !== 'SILENCE') {
+   } else if (candidate.kind !== 'SILENCE' && candidate.kind !== 'UNSUPPORTED') {
      return false;
    }
```
No other line in this file changes. `BOUNDARY`'s own co-occurrence invariants (`BLOCKED`↔`REFUSAL`, `ESCALATED`↔`ESCALATION`) are untouched — those checks only execute `if (hasSafetyDisposition)`, and `UNSUPPORTED` never has one, so they are simply never reached for it. `boundaryType`'s own closed 2-value list (`REFUSAL`/`ESCALATION`) is **not touched at all** — `UNSUPPORTED` falls into the existing `else if (hasBoundaryType) return false;` branch automatically (no `boundaryType` present, no `boundaryType` allowed), exactly as `SILENCE` already does today. `isSilenceKind()` is unchanged — `UNSUPPORTED` is correctly never treated as Silence-kind, so `runExpressionStage()` proceeds to render it rather than withholding it.

### `deliveryIntentContract.js` — minimal additive change

```diff
- var KINDS = freezeShallow(['RECOMMENDATION', 'INITIATIVE', 'BOUNDARY']);
+ var KINDS = freezeShallow(['RECOMMENDATION', 'INITIATIVE', 'BOUNDARY', 'UNSUPPORTED']);
```
**No other line in this file changes.** `isValidSemanticSignal()`'s own `boundaryType`/`safetyDisposition` checks are both conditional on presence (`if (hasBoundaryType)`/`if (hasSafetyDisposition)`) — since `ExpressionRenderer` constructs `semanticSignal: {kind: 'UNSUPPORTED'}` with neither key present, both checks are trivially satisfied. `buildDeliveryIntent()`'s own construction logic is identically unconditional on presence and requires no change.

### `expressionRenderer.js` — new, fifth rendering path (the piece the prior review's file selection missed entirely)

**Critical finding this revision's repository-wide audit surfaced**: `render()`'s own dispatch is a **closed, four-way `if/else if` chain** (`isWp4BaseCase`/`isWp5RefusalCase`/`isWp6EscalationCase`/`isWp7ModifiedCase`, `[expressionRenderer.js:509-544]`), and **every one of the four existing checks requires `isPlainObject(terminalDecision.safetyDisposition)` to be true** `[expressionRenderer.js:146, 160, 172, 186]`. A `kind: 'UNSUPPORTED'` decision (no `safetyDisposition` at all, by design) matches **none** of the four and would fall through to the explicit `throw new Error('EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION')` `[expressionRenderer.js:540-544]` — meaning fixing only `expressionInputGate.js`/`deliveryIntentContract.js` would still make `UNSUPPORTED` un-renderable in practice. A fifth check and a fifth pair of instruction-builders are required, following the file's own established pattern exactly:

```js
function isUnsupportedCase(terminalDecision) {
  if (!isPlainObject(terminalDecision)) return false;
  if (terminalDecision.kind !== 'UNSUPPORTED') return false;
  if (Object.prototype.hasOwnProperty.call(terminalDecision, 'safetyDisposition')) return false; // must never carry one
  return true;
}

function buildUnsupportedSystemInstruction(terminalDecision, expressionRenderingContext) {
  var maturityGuidance = RELATIONSHIP_MATURITY_GUIDANCE[expressionRenderingContext.relationshipMaturityStage];
  return [
    VOICE_IDENTITY_LINE,
    'ההחלטה היא שאין כרגע יכולת מקצועית מוסמכת לענות על הבקשה הספציפית הזו — זו אינה שאלה של ' +
      'בטיחות, סירוב, או הפניה, אלא הודאה כנה שהיכולת עדיין לא קיימת. אמור זאת בבירור ובאדיבות, ' +
      'ללא התנצלות מוגזמת וללא הבטחה למועד עתידי.',
    'לעולם אל תמציא תשובה מקצועית לבקשה עצמה — רק ההודאה שאין כרגע יכולת לכך.',
    maturityGuidance, NO_MOTIVATIONAL_PRESSURE_LINE, HEBREW_ONLY_LINE
  ].join(' ');
}

function buildUnsupportedUserContent(terminalDecision) {
  var r = terminalDecision.rationale || {};
  return [
    'ההחלטה: אין כרגע יכולת מקצועית תומכת (UNSUPPORTED).',
    'נימוק: ' + (r.rationale || ''),
    'נסח הודעת מאמן אחת, קצרה, שמודיעה למשתמש בכנות שאין כרגע יכולת לענות על הבקשה הזו, בהתאם להנחיות.'
  ].join(' ');
}
```

And one new `else if` branch in `render()` itself, before the final `else { throw ... }`:
```js
} else if (isUnsupportedCase(terminalDecision)) {
  system = buildUnsupportedSystemInstruction(terminalDecision, expressionRenderingContext);
  userContent = buildUnsupportedUserContent(terminalDecision);
  semanticSignal = { kind: terminalDecision.kind };   // no boundaryType, no safetyDisposition — never fabricated
}
```

**Wording is not frozen** beyond the structural instruction above (per Product's own explicit instruction not to freeze final wording) — the exact Hebrew phrasing is Expression's own generative output, steered but not dictated, identical in kind to how `buildRefusalSystemInstruction()`/`buildEscalationSystemInstruction()` already steer rather than dictate (§13's own EXP-28 "no phrasebook" discipline, reused verbatim).

### Orchestrator dispatch (`internalPipelineOrchestrator.js`)

```js
if (needCreatorResult.kind === 'UNSUPPORTED') {
  var unsupportedDecision = DecisionFormation.formUnsupportedCapabilityOutcome({ need: needCreatorResult.need });
  var renderingContextResult = MemoryLayer.buildExpressionRenderingContext(pipelineContext);
  var expressionResult = (renderingContextResult && renderingContextResult.status === 'BUILT')
    ? await runExpressionStage(unsupportedDecision.decision, renderingContextResult.expressionRenderingContext, ExpressionRenderer)
    : { status: 'ABORTED', reason: 'EXPRESSION_RENDERING_CONTEXT_REJECTED' };
  return { status: 'SUCCESS', output: { pipelineContext: pipelineContext, terminalDecision: unsupportedDecision.decision, expression: expressionResult } };
}
```
Reuses `runExpressionStage()` completely unmodified — the same defensive `ExpressionInputGate.isValidTerminalDecision()` check, the same `isSilenceKind()` check (correctly `false` for `UNSUPPORTED`), the same `expressionPort.render()` call, the same `DeliveryIntentContract.isValidDeliveryIntent()` check on the way out.

**Turn correlation for this outcome** does not require any new field on `TerminalDecision` itself (see §14's own correction below) — delivery-time correlation is achieved structurally, not by embedding `turnId` in the Terminal Decision or Delivery Intent.

---

## §12a. Direct Request × Explicit Negative Control (FROZEN this revision — no longer an open UX question)

**Product/Architecture has explicitly frozen this semantic point** (not left as future UX territory, superseding the prior revision's own "worth Product's future attention" hedge): **existing explicit negative authority (EUR-001) remains fully authoritative during a direct conversational request. A direct request never cancels or overrides an explicit negative control, and an explicit negative control never cancels or overrides the user's own broader, legitimate Need.**

`"אל תציע לי ריצה, אבל מה כדאי לי לעשות היום?"` — traced against the now-complete §06/§11/§12 contracts:

1. §04 (`TurnUnderstandingInterpreter`) resolves: `negativeControlPresent: true`; `affirmativeRequest: {present: true, domain/topic: likely unresolved — "מה כדאי לי לעשות היום" is generic, not WORKOUT-specific}`.
2. §11's `explicitRequestControls` extension submits the same turn text to `ExplicitRequestInterpreter.classify()` — the **same, entirely unmodified** EUR-001 interpreter and gate, now reachable from a live current-turn statement for the first time. It independently resolves its own three-dimension output for the "אל תציע לי ריצה" clause, exactly as it already would for an equivalent Typed Memory record.
3. §06 Step A recognizes a real `DirectUserNeed` from the affirmative clause — domain-agnostically, regardless of what EUR-001 concludes. **Frozen: the presence of a negative control never suppresses Need recognition itself** — FITME continues reasoning about the user's broader Need.
4. §06 Step B: the Need's own `{domain, topic}` (unresolved, per step 1) does not match `{WORKOUT, WORKOUT_FREQUENCY}` → `kind: 'UNSUPPORTED'` (§12, now resolved) — a real, delivered, honest outcome, correlated to the turn exactly as any other `UNSUPPORTED` case. The negative control is never "erased" by the direct request (EUR-001's own machinery ran independently and unconditionally, step 2), and the direct request is never silently dropped merely because a negative control co-occurred.
5. **If**, in a different phrasing, the turn's own affirmative request *did* resolve to `{WORKOUT, WORKOUT_FREQUENCY}` (e.g. "אל תציע לי ריצה, אבל מה עם אימון היום?"), Step B would construct a real TRR-shaped `DetectedOpportunity`, which would then reach Stage 6 (`InitiativeEngine.generate()`) — where EUR-001's own existing, unmodified `explicitlyRequestedAgainst(pipelineContext.explicitRequestControls, 'WORKOUT', 'WORKOUT_FREQUENCY')` check `[initiativeEngine.js:268-270, 385]` would suppress **that specific RUNNING-adjacent Candidate** if step 2 resolved an actionable `SUPPRESS_ORDINARY_INITIATIVE` control for that exact `(domain, topic)` pair. **Frozen: this is the correct, intended behavior** — a RUNNING Candidate remains suppressible under existing EUR authority even when it originates from a direct request, exactly as it already is for the proactive path; this is EUR-001's own existing, already-approved suppression authority applying, unmodified, to a new kind of Source (`DIRECT_USER_REQUEST`) it was never previously reachable from. **The suppression of one specific Candidate is not the same as suppressing the user's broader Need**: where the existing governed reasoning path (§10, unmodified TRR reasoning) can still produce another professionally valid Candidate consistent with the user's stated boundary (e.g. a non-running alternative), or where clarification (§13) is legitimately warranted, those paths remain available exactly as today — EUR-001's own suppression check operates per-Candidate, at Stage 6, never as a blanket veto over the entire turn. This does **not** activate Preference V1 (no selection-among-alternatives mechanism is introduced; TRR's reasoning component may propose exactly one alternative, per its own existing V1 single-proposal contract, unaffected by DUC-001) and does **not** redesign EUR-001 (zero lines of `explicitRequestInterpreter.js` change).

---

## §13. Clarification / Multi-Turn (Decision 12B, Ch.17a)

`TrainingReadinessReasoningComponent`'s existing `CLARIFICATION_NEEDED` outcome is reused **unmodified** — `resolveTrainingReadinessProposal()` already carries a clarifying question through to a real, governed Candidate exactly as TRR-001's own precedent describes (§10). The **only** new mechanic DUC-001 adds is correlation: when `resolveTrainingReadinessProposal()` returns a `CLARIFICATION_NEEDED`-sourced resolved opportunity for a `DIRECT_USER_REQUEST`-sourced turn, the resulting Candidate carries `opportunityProvenance.turnId` exactly as §14 already specifies (no separate mechanism). **REVISED (consistency with §14's Blocker-1-adjacent correction)**: `clarificationRef` is **not** embedded as a new field on the Delivery Intent itself — `DeliveryIntentContract`'s closed top-level shape (`renderedLanguage`/`semanticSignal`/`correlation` only, `[deliveryIntentContract.js:80]`) admits no such field. Instead, the orchestrator's own `DIRECT_TURN_PASS` result handler (in `app.js`, never inside `DeliveryIntentContract` itself) constructs the client-facing `clarificationRef: { turnId: turn.turnId, opportunityId: eligibleOpportunity.id }` **alongside** the Delivery Intent, from data it already has in scope (the same `terminalDecision`/`eligibleOpportunity` context, not the Delivery Intent object). The Conversation Surface (§15), upon rendering a clarification-kind response, retains this `clarificationRef` client-side (in-memory only, never persisted) and attaches it as `clarificationContext` on the user's next submitted `CurrentUserTurn` (§02).

`internalPipelineOrchestrator.js`'s `DIRECT_TURN_PASS` path, when a turn carries `clarificationContext`, passes it through unchanged into the Conversational Need Creator's own construction (§06) as advisory correlation metadata only — it does **not** alter Stage 4/5/6 logic, does **not** skip re-running the full governed path, and does **not** look up or resume any prior in-progress state (there is none to resume — CARF's own frozen "no provider-session memory" principle, §01, is preserved exactly: this is correlation *metadata* carried by the new turn itself, never provider-side continuation).

No hidden same-turn retry: a clarification answer is structurally indistinguishable, at the `EngineRegistry`/orchestrator level, from any other fresh `USER_MESSAGE_SUBMITTED` turn — new `turnId`, new `runUserMessageEngine()` call, new Decision Pass, full Stage 3-10 re-run.

---

## §14. Turn Correlation (Decision 12, Ch.17)

`turnId` propagation, end to end, using only existing propagation mechanics plus the one additive field already specified in §06/§10:

```
CurrentUserTurn.turnId
  → DirectUserNeed.turnId (§06 Step A)
  → DetectedOpportunity.turnId (§06 Step B, TRR-supported path only)
  → EligibleOpportunity.turnId (unchanged pass-through, buildEligibilityAndCandidateInputs())
  → resolved.turnId (§10, resolveTrainingReadinessProposal())
  → Candidate.opportunityProvenance.turnId (NEW additive field, mirroring sameNeedId exactly, §01)
  → TerminalDecision.candidateProvenance[0].turnId (unchanged pass-through — candidateProvenance is
     built directly from opportunityProvenance, decisionFormation.js:130)
```

**REVISED, twice now — the correlation mechanism.** `DeliveryIntentContract`'s own closed top-level key set (`['renderedLanguage', 'semanticSignal', 'correlation']`, `[deliveryIntentContract.js:80]`) does **not** include a `turnId` field — confirmed, `hasOnlyRecognizedKeys()` `[deliveryIntentContract.js:84-90]` rejects any unrecognized top-level key. The immediately-prior revision proposed routing `turnId` through `correlation.decisionId` instead — **this too is incorrect** on full inspection of `expressionRenderer.js`: `correlation.decisionId` is **always internally, opaquely self-generated** by `ExpressionRenderer.render()` itself (`generateCorrelationId()`, `[expressionRenderer.js:485-489, 561]`) — there is no parameter through which any caller, including the `DIRECT_TURN_PASS` orchestrator, can inject `turnId` (or anything else) into it. Embedding `turnId` there would require modifying `ExpressionRenderer.render()`'s own signature — an unnecessary, unauthorized touch to a closed, already-approved Expression module.

**Correct mechanism: closure, not payload.** `runUserMessageEngine(turn)` (§03) is called with `turn` as a direct parameter and returns the `EngineRegistry.run()` promise; its own `.then()` handler (§15 step 3) already has `turn.turnId` in scope as a closed-over local variable — it is never extracted from the Delivery Intent at all. The entire `DIRECT_TURN_PASS` call chain, from submission to rendering, happens within **one** async call whose originating `turn` object never leaves scope. `candidateProvenance[0].turnId` (TRR-supported path) and `need.turnId` (§12, `UNSUPPORTED` path — passed into `formUnsupportedCapabilityOutcome()` as `params.need.turnId`, available for `decisionPassTrace`/logging/tests, never required for delivery routing itself) remain valuable for internal traceability and tests, but are **not** the mechanism the UI uses to route a response — that mechanism is simply the calling code's own retained reference to `turn`.

`turnId != runId` preserved throughout — `runId` remains `EngineRegistry`'s own execution identity (`generateRunId()` `[engineRegistry.js:112]`), threaded through `identity.runId` exactly as today, untouched by any of the above. No third identity type (`conversationId`, `clarificationId`, `parentTurnId`) is introduced — §13's `clarificationRef` is not a new identity type, only a small, opaque, client-retained correlation object built from two already-existing identifiers (`turnId`, `opportunityId`).

---

## §15. Coach Conversation Surface (Decision 22B, Ch.27a)

**New UI module and markup**, minimal V1 shape only — a new `#screen-coach-conversation` section in `index.html` (or equivalent existing navigation pattern), containing exactly: a scrollable thread/container; a text input; a submit control; a per-turn pending/loading state (reusing `coachPresenter.js`'s own "המאמן כותב..." discipline `[coachPresenter.js:114-116]` as UX precedent only, not its request architecture); a rendering slot for the returned FITME response — the TRR-supported path's RECOMMENDATION/INITIATIVE-kind content, clarification-kind content, and (now resolved, §12) `UNSUPPORTED`-kind content all render through the **same** slot, since all three are equally real, governed, Expression-rendered `renderedLanguage` strings — the user never sees a structural difference between "TRR answered me" and "FITME can't help with that yet," only different text, per Expression's own exclusive wording authority; a bounded error state (transport/timeout failure, §17).

**REVISED (Blocker 5) — complete User-Turn → Delivery execution trace, end to end:**

1. **Who calls the Composite Engine?** The Conversation Surface's own submit handler, via `runUserMessageEngine(turn)` (§03) — a new, thin function in `js/app.js`, never the surface itself calling `EngineRegistry` directly.
2. **What does that call return?** A `Promise` resolving to `EngineRegistry.run()`'s own unmodified `EngineRunSummary` shape (`{runId, trigger, executionOrder, results: {coachDecisionSystem: {status, output, ...}}}`) — the identical shape `runAppReadyEngines()` already consumes `[js/app.js:2167]`.
3. **Where is the resulting Delivery Intent received?** In a **new**, sibling `.then()` handler attached to this specific `runUserMessageEngine()` call (never inside the existing `runAppReadyEngines()`'s own handler, which remains untouched) — it reads `results.coachDecisionSystem.output.expression`, identical extraction shape to the existing code.
4. **Which component presents it?** The new Conversation Surface's own render function (§15's own module) — **never** `TriggerController.presentDeliveryIntent()`, which remains exclusively `APP_READY`'s own target, completely unmodified by this SPEC.
5. **How is `turnId` preserved through this handoff?** Via **closure**, not via any field on the Delivery Intent (§14's own correction — `deliveryIntent.correlation.decisionId` is always an opaque, internally self-generated string with no caller injection point, confirmed by full inspection of `expressionRenderer.js`). `runUserMessageEngine(turn)`'s own `.then()` handler already has `turn.turnId` as a closed-over local variable from the moment it was called — it is passed explicitly to the render function alongside the rendered content, never extracted from the Delivery Intent.
6. **How are stale-session results rejected?** The new `.then()` handler re-checks `SessionLifecycle.isCurrent(turn.sessionGeneration)` immediately before rendering — mirroring `TriggerController.presentDeliveryIntent()`'s own existing guard verbatim (`if (typeof sessionGeneration !== 'undefined' && !deps.sessionLifecycle.isCurrent(sessionGeneration)) return;`, `[triggerController.js:273]`) — a stale result is silently discarded, never rendered, identical discipline to the existing proactive path.
7. **How is duplicate rendering prevented?** Structurally, not by locking: each `runUserMessageEngine()` call corresponds to exactly one `turnId`, and the render function is keyed by `turnId` against the Conversation Surface's own pending-turn UI slot — rendering twice for the same `turnId` (e.g. a retried network response) overwrites the same slot rather than appending a duplicate message; the UI-level submit-disable guard (§03) prevents a second call from ever being made for the same user action in the first place.
8. **Why doesn't this create a second delivery architecture bypassing existing canonical ownership?** Because **governance** (Need formation, Evidence, Eligibility, Reasoning, Safety, Decision Formation, and — for the TRR-supported path — Expression's own rendering) is entirely unchanged and singular; only the **presentation** layer (which DOM element receives an already-fully-governed Delivery Intent) differs by call site. `TriggerController.presentDeliveryIntent()` is itself only a presentation adapter, not a governance authority — the new Conversation-Surface-facing render function is the same *kind* of thing, a second presentation adapter for a second UI surface, never a second Expression, never a second Decision Formation, never a second Safety review.

**Never TRR-specific**: no vertical-named UI element, no capability picker, no "ask about training" affordance distinct from "ask about anything." **Reuses safely**: `ClaudeProxyClient`/`callClaude` transport is never called directly from this surface — every model call remains behind the existing governed seams (§04, §10, §16); the surface only calls `runUserMessageEngine(turn)` (§03) and renders its eventual, correlated result. **Never reused**: `CoachClient.sendMessage()`, `CoachPromptComposer.buildSystemPrompt()`, or any direct `callClaude`→DOM path (Package Ch.26, explicitly forbidden).

Visual design is out of this SPEC's scope, per the Package's own Ch.27a.

---

## §16. Expression / Delivery (Decision 22/16, Ch.27, Ch.14)

**REVISED — three outcome shapes now reach Expression via the `DIRECT_TURN_PASS` path**, through the **same**, largely-unmodified `ExpressionRenderer`/`runExpressionStage()` mechanics `[internalPipelineOrchestrator.js:491-544]` (§12 adds exactly one new, additive rendering path inside `expressionRenderer.js` itself; nothing else in this mechanism changes):
1. An ordinary TRR-sourced `TerminalDecision` (RECOMMENDATION/INITIATIVE-kind) — rendered exactly as the proactive path already renders one.
2. A clarification-kind Candidate's own rendered question (§13) — same mechanism, same Expression authority.
3. An `UNSUPPORTED`-kind `TerminalDecision` (§12) — constructed by `DecisionFormation.formUnsupportedCapabilityOutcome()`, rendered by `expressionRenderer.js`'s new fifth dispatch branch, carrying no Safety disposition and no fabricated content.

**No direct model-to-DOM path** exists anywhere in this contract — every user-visible string still passes through `ExpressionRenderer.render()`'s own validation (`DeliveryIntentContract.isValidDeliveryIntent()`). **Existing Safety/Decision authority fully preserved** — case 1/2 pass through Safety/Decision Formation exactly as the proactive path does; case 3 never had a Candidate to begin with (§12), so no Safety authority is bypassed — there was nothing for Safety to review, and no Safety disposition is ever fabricated to make it look otherwise.

`app.js`'s new `DIRECT_TURN_PASS` result handler (parallel to, never replacing, the existing `runAppReadyEngines()`'s own `.then()` handler `[js/app.js:2167-2189]`) reads `expression.status === 'DISPATCHED'` and calls the Conversation Surface's own render function with `(deliveryIntent, turn.turnId)` — `turn.turnId` supplied from its own closure (§14), never extracted from the Delivery Intent — never `TriggerController.presentDeliveryIntent()` (that function remains exclusively `APP_READY`'s own target, unmodified). All three outcome shapes return through this **same** adapter — no separate unsupported-message rendering architecture is created, per Product's own explicit instruction.

---

## §17. Failure Semantics (Decision — throughout, esp. Ch.09)

**REVISED (Blocker 7)** — the five named cases (A-E) are now structurally distinct, machine-readable outcomes, not collapsed into one another:

| Case | V1 behavior | Distinguishing signal |
|---|---|---|
| **A — No direct request** (e.g. `"אני עייף היום."` alone) | §06 Step A returns `null` (`interpretationStatus: 'CLASSIFIED'`, `affirmativeRequest.present: false`) — Decision-Pass-level Silence if no other Opportunity exists, exactly the existing `formDecisionPassSilence()` outcome, unchanged. | `interpretationStatus: 'CLASSIFIED'`, `affirmativeRequest.present: false` — a genuine, successful classification. |
| **C — Turn interpretation failure** (malformed model output / AI transport failure) | §04's fail-closed-by-omission — `deps.callClaude` throw/timeout/malformed response → `interpretationStatus: 'FAILED'`, all other fields meaningless. User-facing behavior today is identical to Case A (Decision-Pass-level Silence, no error surfaced) — **but the underlying cause is machine-readably distinct**, per Blocker 7's own requirement, for observability/future use. | `interpretationStatus: 'FAILED'` — distinct from Case A even though both currently degrade to Silence. |
| **B — Understood direct request, capability unsupported** (e.g. `"כמה חלבון נשאר לי?"`) | §06 Step A recognizes a real `DirectUserNeed`; Step B's equality check fails → `DecisionFormation.formUnsupportedCapabilityOutcome()` → `kind: 'UNSUPPORTED'`, real delivered outcome via Expression's new fifth rendering path (§12, now resolved). **Not malformed, not equivalent to Case C, never fabricates a Safety disposition.** | `interpretationStatus: 'CLASSIFIED'`, `affirmativeRequest.present: true`, Step B `false`, `terminalDecision.kind === 'UNSUPPORTED'`. |
| **D — Supported request, professional clarification required** | §13 — `CLARIFICATION_NEEDED`, a real, governed, delivered Candidate — **not** Case B (a real professional capability *was* engaged; it asked a question rather than proposing an action). Structurally distinguished by construction: Case D is only reachable *after* Step B already succeeded and reasoning was actually invoked; Case B is decided *before* reasoning is ever invoked. | Reaches `TrainingReadinessReasoningComponent.propose()` → `outcome: 'CLARIFICATION_NEEDED'`. |
| **E — Safety `DEFERRED`** | Unchanged, existing Safety semantics — resolves real `kind: 'SILENCE'` via `decisionFormation.js`'s own existing `case 'DEFERRED': ... kind: 'SILENCE'` `[decisionFormation.js:197-199]`, regardless of `sourceCategory`. **Never collapsed into clarification** — Safety's own disposition machinery is untouched by DUC-001 and is reached only after a real Candidate exists, structurally separate from both B (no Candidate ever existed) and D (a clarification Candidate, not a Safety disposition). | `terminalDecision.safetyDisposition.disposition === 'DEFERRED'`. |
| Empty submission | Rejected client-side before `runUserMessageEngine()` is even called — no empty `CurrentUserTurn.text` is ever constructed. | — |
| Duplicate submission (double-tap) | UI-level submit-disable guard (§03); no pipeline-level dedup needed since no second call is ever made. | — |
| Stale session-generation | Checked at two points (§03, §15 step 6) — a stale result is discarded, never rendered. | — |

No silent raw-model fallback exists anywhere in this table. All five cases (A-E) now have a fully-defined, structurally distinct, machine-readable representation.

---

## §18. Production Wiring / Configuration (Decision — throughout)

**New AI-backed collaborator requiring production wiring:** exactly one — `TurnUnderstandingInterpreter` (§04). `configure({callClaude: function (body) { return callClaude(body); }})` added to `js/app.js`'s composition root, in the same block as the five existing sibling `.configure({callClaude})` calls `[js/app.js:276-303, 312-345]`.

**Explicit reuse, no new wiring required**: `ReadinessStateInterpreter`, `TrainingReadinessReasoningComponent`, `ExpressionRenderer` are already wired (TRR Production Reachability Correction, commit `f247e1f`) — this SPEC adds zero new `configure()` calls for them.

**Mandatory wiring-test coverage** (the TRR production-reachability incident must not repeat): a new assertion in `tests/coachDecisionSystemWiring.test.js`, following the established pattern (test #21/#33-36), proving `TurnUnderstandingInterpreter.configure(` exists in `js/app.js` and its body references `callClaude(`. The existing **self-discovering** safeguard (test #37, `[coachDecisionSystemWiring.test.js:572]`) already scans every `js/coachDecisionSystem/*.js` file for the shared `callClaude: null` default-dependency shape — `turnUnderstandingInterpreter.js`, once it exists with that exact shape, is picked up **automatically** by that test with zero additional code, exactly as designed.

---

## §19. Test Contract (Decision — §19 of this document)

All items below are acceptance-test *targets*, not test code — per instruction, tests are not written in this turn.

**Admission**: a turn is accepted and produces exactly one unique `turnId`; exactly one Decision Pass runs per accepted turn (`EngineRegistry.run()` called exactly once); no automatic Firestore/Typed Memory write occurs for the raw turn text.

**Semantic distinction** (§04/§05): the six example-pair table in §05, each independently asserted via `TurnUnderstandingInterpreter._internal` unit tests (mirroring every sibling interpreter's own `_internal.parseAndValidate`/`buildPrompt` test precedent).

**TRR direct-request**: `"ישנתי 5 שעות, כדאי לי להתאמן היום?"`, via a production-backed test mirroring `tests/trr001ProductionBackedAcceptance.test.js`'s own shape, reaches a real, governed `TrainingReadinessReasoningComponent.propose()` call using current-turn evidence (§11) with **no** `WORKOUT_FREQUENCY` Habit signal configured at all — proving the direct path does not require Habit/proactive-Initiative infrastructure, unlike the proactive path. A second test asserts the same request succeeds from a freshly-configured `OBSERVER`-stage session (§08).

**Safety**: existing RUNNING/WALKING Canonical Safety Rules apply unchanged to a `DIRECT_USER_REQUEST`-sourced Candidate (a direct-request CYCLING-adjacent scenario reaches the same `DEFERRED`→`SILENCE` outcome the Stage-9 correction already proves for the proactive path — reusing that correction's own test shape with a `DIRECT_USER_REQUEST` source substituted).

**Unsupported** (§12, now resolved): `"כמה חלבון נשאר לי היום?"` resolves `affirmativeRequest.present: true, domain: 'NUTRITION', topic: 'PROTEIN_INTAKE'` (or unresolved) → §06 Step A recognizes a real `DirectUserNeed` → Step B fails the match → `DecisionFormation.formUnsupportedCapabilityOutcome()` → asserted: `TrainingReadinessReasoningComponent.propose()` is never called; no Candidate is ever constructed; `terminalDecision.safetyDisposition` is `undefined` (never fabricated); `terminalDecision.kind === 'UNSUPPORTED'`; `terminalDecision.decisionPassTrace.opportunitiesConsidered[0].opportunityId` equals the originating `need.needRef` (real internal provenance recorded on the governed decision object itself, independent of any closure — §12's own revised construction); `expressionInputGate.isValidTerminalDecision()` accepts it; `ExpressionRenderer.render()` reaches the new `isUnsupportedCase()` branch (not the `throw`); a valid Delivery Intent is produced (`deliveryIntentContract.isValidDeliveryIntent()` accepts it); the response reaches the Conversation Surface correlated to the originating `turn.turnId` (via closure, §14, for UI presentation only — a separate concern from the internal provenance just asserted); no raw Claude response is ever displayed.

**Safety distinction**: a real Safety `BOUNDARY` (a `DIRECT_USER_REQUEST`-sourced Candidate that reaches Stage 8/9 and is `BLOCKED`/`ESCALATED`) is asserted structurally distinct from `UNSUPPORTED` — different `kind`, and `BOUNDARY` always carries a real `safetyDisposition` while `UNSUPPORTED` never does; a test asserts these are never conflated even when both originate from the same `DIRECT_USER_REQUEST` source.

**Silence distinction**: `"אני עייף היום"` (Case A, no request) is asserted to **never** produce `kind: 'UNSUPPORTED'` — it never reaches §06 Step A/B at all (`affirmativeRequest.present: false` short-circuits before Need recognition).

**Failure distinction**: a forced turn-understanding failure (Case C, stubbed `callClaude` throw) is asserted to **never** produce `kind: 'UNSUPPORTED'` either — `interpretationStatus: 'FAILED'` short-circuits at the same point as Case A, before Need recognition.

**Clarification distinction**: a `CLARIFICATION_NEEDED`-producing scenario (Case D) is asserted to **never** produce `kind: 'UNSUPPORTED'` — it is only reachable after Step B already succeeded and real reasoning was invoked, structurally disjoint from the Step-B-failure path that produces `UNSUPPORTED`. Its own `clarificationRef` (constructed by the `app.js` result handler, per §13, alongside — not inside — the Delivery Intent) is asserted present; a second, independently-submitted turn carrying it as `clarificationContext` produces its own new `turnId` and its own full Decision Pass — asserted never to skip Stage 4/5/8/9.

**Delivery**: a response is asserted to correlate to the exact `turnId` that caused it, via closure (§14) — two concurrent turns from the same test session are asserted not to cross-deliver; a stale-generation result is asserted discarded, not rendered.

**Regression**: full `tests/*.test.js` suite (baseline 2486/2486 as of commit `81508fe`) passes unmodified in its existing assertions; `APP_READY` proactive behavior, the proactive TRR path, EUR-001, and Preference V1's paused status are each independently re-asserted unchanged.

---

## §20. Dogfood Acceptance Path

```
"ישנתי 5 שעות, כדאי לי להתאמן היום?"
  → CurrentUserTurn (§02)
  → USER_MESSAGE_SUBMITTED / DIRECT_TURN_PASS (§03)
  → TurnUnderstandingInterpreter: interpretationStatus:CLASSIFIED,
    affirmativeRequest{present:true, domain:WORKOUT, topic:WORKOUT_FREQUENCY} (§04)
  → currentStateStatement{present:true, text:"ישנתי 5 שעות"} → readinessStateContext, provenance:CURRENT_TURN (§11)
  → ConversationalNeedCreator Step A → DirectUserNeed (domain-agnostic recognition, §06)
  → ConversationalNeedCreator Step B → domain/topic match → DetectedOpportunity{sourceCategory:DIRECT_USER_REQUEST, turnId} (§06)
  → Stage 4/5: Evidence (Explicit User Statement — D1's own highest tier) / Eligibility
    (BOUNDED_ENGAGEMENT_POLICY[DIRECT_USER_REQUEST][ADAPT_TO_CURRENT_STATE], §08) → ELIGIBLE
  → validReasonCategory === 'ADAPT_TO_CURRENT_STATE' → existing, unmodified reasoning-invocation branch (§10)
  → ReadinessStateInterpreter (already wired) / TrainingReadinessReasoningComponent (already wired)
  → resolveTrainingReadinessProposal() → Candidate{opportunityProvenance:{...,turnId}} (§10/§14)
  → Safety (SL-001/CSR-001, unmodified) → Decision Formation (unmodified) → TerminalDecision
  → Expression (unmodified) → Delivery Intent
  → app.js DIRECT_TURN_PASS handler (turn.turnId retained via closure, §14) → Conversation Surface renders response (§15)
```

No Habit signal required. No proactive Initiative required. No raw Claude response displayed at any point. This path never touches the `UNSUPPORTED` branch (§12) at all — it is the TRR-supported branch of §06 Step B.

---

## §21. Non-Goals

Reaffirmed, unchanged from the Package: no Nutrition conversational implementation (a nutrition question is honestly *recognized as a Need*, then honestly delivered as `UNSUPPORTED`, never answered as a nutrition capability, §06/§12); no Preference V1 activation (§12a); no universal intent taxonomy (§04's four-field structure is closed and narrow); no speculative generic vertical router (§09); no provider-session memory (§12/§13); no automatic persistence of every message (§02/§11); no general life-advice assistant; no device/Health/GPS acquisition; no raw model chat; no replacement of any closed foundation in substance (D1, D3, CARF, EUR-001, TRR-001, RGEF, B5 all reused unmodified; SL-001's own Safety Decision Matrix semantics — `BOUNDARY`'s Safety-disposition coupling, `REFUSAL`/`ESCALATION`'s own meaning — are explicitly preserved unchanged, per this revision's own explicit Product/Architecture instruction not to weaken that coupling; the one closed-enumeration touch this SPEC now makes — `TerminalDecision.kind` gaining `'UNSUPPORTED'` — is explicitly, narrowly authorized this turn, not self-authorized).

---

## §22. Exact Implementation Scope

**New files:**
- `js/coachDecisionSystem/turnUnderstandingInterpreter.js` (§04)
- `js/coachDecisionSystem/conversationalNeedCreator.js` (§06)
- A new UI module for the Coach Conversation Surface (§15) — exact filename left to implementation, following `js/ui/*` convention (e.g. `js/ui/coachConversationPresenter.js`)
- `tests/turnUnderstandingInterpreter.test.js`
- `tests/conversationalNeedCreator.test.js`
- `tests/duc001ProductionBackedAcceptance.test.js` (mirroring `tests/trr001ProductionBackedAcceptance.test.js`'s shape, §19/§20)

**Modified files, additive only:**
- `js/coachDecisionSystem/registerCoachDecisionSystem.js` — `triggers[]` gains `'USER_MESSAGE_SUBMITTED'` (§03)
- `js/coachDecisionSystem/internalPipelineOrchestrator.js` — `ctx.action === 'DIRECT_TURN_PASS'` branch; `collectDetectedOpportunities()` gains the Need Creator's Step-B contribution; the `UNSUPPORTED` dispatch calling `DecisionFormation.formUnsupportedCapabilityOutcome()` (§06, §07, §12)
- `js/coachDecisionSystem/memoryLayer.js` — `assembleContext()` gains an additive second parameter; `readinessStateContext`/`explicitRequestControls` assembly each gain the current-turn submission (§11, §12a)
- `js/coachDecisionSystem/eligibilityEvaluator.js` — `BOUNDED_ENGAGEMENT_POLICY` gains one new top-level key (§08)
- `js/coachDecisionSystem/initiativeEngine.js` — `SOURCE_REASON_MATURITY_OVERRIDES` gains one new top-level key; `opportunityProvenance` gains `turnId` (§08, §14)
- `js/coachDecisionSystem/decisionFormation.js` — **NEW (this revision)**: gains `formUnsupportedCapabilityOutcome()`, one new, narrow, sibling function alongside the existing `formDecisionPassSilence()`/`form()` — no change to either existing function (§12)
- `js/coachDecisionSystem/expressionInputGate.js` — **NEW (this revision)**: `KINDS` gains `'UNSUPPORTED'`; one existing conditional (`else if (candidate.kind !== 'SILENCE')`) gains one additional clause (`&& candidate.kind !== 'UNSUPPORTED'`) — no other line changes; `BOUNDARY`/`boundaryType`/`REFUSAL`/`ESCALATION` semantics fully unchanged (§12)
- `js/coachDecisionSystem/deliveryIntentContract.js` — **NEW (this revision)**: `KINDS` gains `'UNSUPPORTED'` — the only change; `isValidSemanticSignal()`/`buildDeliveryIntent()` require no further edit, both already presence-conditional (§12)
- `js/coachDecisionSystem/expressionRenderer.js` — **NEW (this revision)**: gains `isUnsupportedCase()`, `buildUnsupportedSystemInstruction()`, `buildUnsupportedUserContent()`, and one new `else if` branch in `render()` — the four existing WP4-WP7 rendering paths are untouched (§12)
- `js/app.js` — `TurnUnderstandingInterpreter.configure({callClaude})` (§18); `runUserMessageEngine()` (§03); `DIRECT_TURN_PASS` result handler (§16)
- `index.html`/`sw.js` — script-tag/precache registration for the two new production files, plus the new Conversation Surface markup (§15)
- `tests/coachDecisionSystemWiring.test.js` — one new production-wiring assertion (§18)

**Must remain untouched:** `D1_SPEC_v1.0.md`, `EUR_001_SPEC_v1.0.md`, `TRR_001_SPEC_v1.0.md`, `B5_SPEC_v1.0.md`, `SL-001_SPEC_v1.0.md`, `RGEF_SPEC_v1.0.md`, the CARF/TDP governance documents, `js/derivedIntelligenceConsumer.js`, `js/coachDecisionSystem/explicitRequestInterpreter.js` (EUR-001's own logic — only its *caller*, `memoryLayer.js`, gains a new additive input submission, per §12a), `js/coachDecisionSystem/safetyLayer.js`'s own Rule functions, `js/coachDecisionSystem/decisionFormation.js`'s existing `form()`/`formDecisionPassSilence()` (only a new, third, sibling function is added), `js/coachDecisionSystem/expressionRenderer.js`'s existing four rendering paths, `js/coach/coachClient.js`/`coachPresenter.js`/`coachPromptComposer.js` (Legacy Coach, reused only as UX precedent, never modified or called from the new path).

---

## §23. Foundation Consistency (re-confirmed at SPEC level)

**REVISED — §12 is resolved, on explicit Product/Architecture authorization this turn, not self-authorized.** No item anywhere in this SPEC requires reopening D1, D3, CARF, EUR-001, TRR-001, RGEF, or B5 — confirmed by full-file inspection, not pattern-matching. `js/derivedIntelligenceConsumer.js` (B5) is untouched. `js/coachDecisionSystem/explicitRequestInterpreter.js` (EUR-001's own logic) is untouched — its own suppression check continues to apply independently and unconditionally, now additionally reachable from live current-turn text (§11/§12a) via an additive change to its *caller* only.

**SL-001's own closed Safety Decision Matrix semantics are fully preserved**, per Product/Architecture's own explicit instruction this turn: `BOUNDARY`'s coupling to a real Safety disposition is unchanged (`isValidTerminalDecision()`'s own `BLOCKED`↔`REFUSAL`/`ESCALATED`↔`ESCALATION` co-occurrence invariants are not touched by the §12 edit at all — only a separate, unrelated conditional branch, gating `SILENCE`/`UNSUPPORTED`'s own shared exemption from *requiring* a `safetyDisposition`, gains one clause); `REFUSAL`/`ESCALATION`'s own meaning is unchanged; `RECOMMENDATION`/`INITIATIVE`/`SILENCE`'s own meaning is unchanged. `UNSUPPORTED` is additive, structurally parallel to `SILENCE` (the other kind that never requires a Safety disposition) rather than a variant of `BOUNDARY` — this is precisely why it does not touch Safety's own semantics at all, only `TerminalDecision.kind`'s own closed enumeration, TASK-006/D2's own contract, for which the explicit Product/Architecture authorization this turn is the required, narrow, additive closure — the same kind of extension mechanism (a later, explicit, narrow Decision authorizing one new closed-enum member) already precedented by TRR-001's own Product Reason extension and this Work Item's own `DIRECT_USER_REQUEST` Source extension.

**Scope-purity of the authorization, reconfirmed**: nothing beyond `TerminalDecision.kind` gaining `'UNSUPPORTED'`, and the four files' worth of minimum mechanical consequences that follow directly from it (§C of the accompanying report), was touched. No existing kind's semantics changed; no Safety coupling weakened; no `REFUSAL`/`ESCALATION`/`RECOMMENDATION`/`INITIATIVE` semantics changed; no broad Decision Formation redesign; no new raw-model delivery path.

---

## §24. Document History

- **v1.0 (initial authoring, DRAFT — ENGINEERING READINESS REVIEW)** — authored against the CANONICAL/APPROVED DUC-001 Decision Package (commit `81508fe`), following direct repository investigation of `EngineRegistry`, `SessionLifecycle`, `StateAccess`, `internalPipelineOrchestrator.js`, `initiativeEngine.js`, `eligibilityEvaluator.js`, `memoryLayer.js`, `readinessStateInterpreter.js`, `explicitRequestInterpreter.js`, `expressionInputGate.js`, `deliveryIntentContract.js`, `coachClient.js`/`coachPresenter.js`, and `index.html`. No Product/Architecture decision was reinterpreted or narrowed. No implementation performed. No code, test, or other repository file modified. Verdict returned: `READY` (later determined, on deeper review, to be premature — see Revision 2).
- **v1.0, Revision 2 (still DRAFT — ENGINEERING READINESS REVIEW, NOT READY)** — Product/Architecture Engineering Final Review identified seven areas requiring deeper verification. Full-file (not excerpt) inspection of `decisionFormation.js`, `expressionInputGate.js`, and `deliveryIntentContract.js` proved the v1.0 draft's §12 mechanism (`boundaryType: 'UNSUPPORTED_CAPABILITY'`) structurally incompatible with the existing architecture — reported as a genuine, unresolved Product/Architecture blocker (§12), not self-authorized. Six other areas were resolved by revision, all within already-authorized scope: §06 redesigned into an explicit two-step Need-recognition/capability-resolution contract, so Admission no longer gates Need existence on EUR-001's own closed domain/topic vocabulary (Blocker 2/3); §11 gained an additive `explicitRequestControls` extension and a precise, machine-readable current-turn evidence shape (Blocker 4/6); §14/§13 corrected a second, independently-found error (`turnId` cannot be a new top-level Delivery Intent field either — `deliveryIntentContract.js`'s own closed key set forbids it — corrected to use the existing `correlation.decisionId` channel instead); §15 gained a complete, explicit User-Turn→Delivery execution trace (Blocker 5); §04/§17 gained a machine-readable `interpretationStatus` distinction separating no-request/unsupported/interpretation-failure/clarification/Safety-DEFERRED into five structurally distinct outcomes (Blocker 7); §22's implementation scope was corrected to remove `expressionInputGate.js`/`deliveryIntentContract.js` pending §12. No Product/Architecture decision was made unilaterally in this revision — §12's own blocker is reported, not resolved.
- **v1.0, Revision 3 (§12 resolved by explicit Product/Architecture authorization; verdict re-assessed)** — Product/Architecture authorized `TerminalDecision.kind = 'UNSUPPORTED'`, decoupled from Safety's own disposition machinery, as the representation for an understood-but-unsupported direct request. §12 rewritten with the exact minimum shape and the exact minimum changes to every affected contract, verified by a genuinely repository-wide audit (not limited to the two files the prior revision inspected): `decisionFormation.js` gains one new, narrow, sibling function (`formUnsupportedCapabilityOutcome()`); `expressionInputGate.js`/`deliveryIntentContract.js` each gain one line adding `'UNSUPPORTED'` to their own closed `KINDS`, plus one additional clause in `expressionInputGate.js`'s existing `safetyDisposition`-presence conditional — `BOUNDARY`'s own Safety-disposition coupling, and `REFUSAL`/`ESCALATION`'s own meaning, are both fully unchanged. **A fourth file the prior revision's audit missed entirely — `expressionRenderer.js` — was found to be independently load-bearing**: its own closed, four-way rendering dispatch requires every existing path to carry a real `safetyDisposition`, so `UNSUPPORTED` would have remained un-renderable even after fixing the other two files; a fifth, additive rendering path (`isUnsupportedCase()` + two new instruction-builders + one new `render()` branch) is specified, the four existing paths untouched. A second, independent correction was also found this revision: `turnId` cannot be carried via `deliveryIntent.correlation.decisionId` either — full inspection of `expressionRenderer.js` shows that field is always internally, opaquely self-generated with no caller injection point — corrected throughout (§14/§15/§16/§19/§20) to the actually-correct mechanism: closure (`runUserMessageEngine(turn)`'s own retained `turn.turnId`), never a field on the Delivery Intent at all. §12a's "Direct Request × Explicit Negative Control" question, left as an open UX question in Revision 2, is now explicitly frozen by Product/Architecture as a binding SPEC requirement (never left as future territory) — traced and incorporated without any EUR-001 redesign. §17/§19/§21/§22/§23 updated for full consistency with the now-resolved §12. Every change in this revision falls within the exact, narrow authorization Product/Architecture granted this turn; no further Product/Architecture decision was made unilaterally. No implementation performed. No code, test, or other repository file modified.
- **v1.0, Revision 4 (Final SPEC Approval / Pre-Implementation Gate — internal-provenance correction, no Product substance change)** — full top-to-bottom re-verification found zero surviving stale claims from any prior revision (the twelve specific patterns Product/Architecture named were each individually confirmed absent). One genuine internal inconsistency was found and corrected, self-caught during this same read-through rather than requiring escalation: §12's own `formUnsupportedCapabilityOutcome()` code captured `need` as a parameter but never actually wrote any of it into the returned `TerminalDecision` — meaning `turnId`/Need provenance for the `UNSUPPORTED` path existed only in the calling orchestrator's own closure, not on the governed decision object itself, contradicting §14's own (until-now aspirational, not yet actually implemented) claim that it was available via `decisionPassTrace`. Corrected: the function now records `{opportunityId: need.needRef, sourceCategory: 'DIRECT_USER_REQUEST', internalOutcome: 'UNSUPPORTED_CAPABILITY', reason}` into `decisionPassTrace.opportunitiesConsidered`, reusing the exact shape `runDecisionPass()` already uses for every other considered Opportunity — real internal provenance, structurally distinct from and independent of §14's own closure-based UI-presentation correlation, which remains unchanged and is not, and was never intended to be, the sole surviving record of turn identity after admission. §19 gained one corresponding test-contract assertion. This is an implementation-completeness fix within already-authorized scope, not a new Product/Architecture decision — no closed-enum touch, no new field name, no foundation reopened. No implementation performed. No code, test, or other repository file modified.
- **v1.0 (implementation)** — Product/Architecture authorized implementation; all 16 implementation phases (§03–§16, §18) built exactly per this SPEC's frozen contracts, introducing no new Product/Architecture decision and reopening none of D1/D3/CARF/EUR-001/TRR-001/RGEF/SL-001. New: `js/coachDecisionSystem/turnUnderstandingInterpreter.js` (§04), `js/coachDecisionSystem/conversationalNeedCreator.js` (§06), `js/ui/coachConversationPresenter.js` (§15). Modified, additively only, exactly per §22's manifest: `registerCoachDecisionSystem.js`, `internalPipelineOrchestrator.js`, `memoryLayer.js`, `eligibilityEvaluator.js`, `initiativeEngine.js`, `decisionFormation.js`, `expressionInputGate.js`, `deliveryIntentContract.js`, `expressionRenderer.js`, `app.js`, `index.html`, `sw.js`. Two genuine, mechanically-necessary SPEC gaps were found and disclosed during implementation, resolved using only existing canonical values (no closed-enum touch): `evidenceEvaluator.js` (not itself named in §22) gained a `DIRECT_USER_REQUEST → EXPLICIT_USER_STATEMENT` evidence-tier branch, without which Stage 4 would silently exclude every direct request before Stage 5; `recommendationCategories.js`/`initiativeEngine.js` gained the source-vocabulary/`STAGE6_ACCEPTED_SOURCES`/`confidence`/`valueDimensions` entries §22 anticipated only in general terms. DUC-001-specific acceptance: 57 new tests (31 Turn Understanding, 14 Conversational Need Creator, 11 production-backed acceptance including the canonical `"ישנתי 5 שעות, כדאי לי להתאמן היום?"` dogfood trace, 1 wiring assertion). Full repository regression: 2544/2544 passing.
- **v1.0 (Turn-Serving Post-Implementation Correction)** — a focused Product/Architecture post-implementation review found a genuine defect, empirically proven by direct execution of the real, unmodified production pipeline: during a `DIRECT_TURN_PASS`, the Candidate answering the originating Current User Turn could lose ordinary Prioritization to an unrelated, real, higher-canonical-tier proactive Candidate (`CONFIRMED_PATTERN_ANTICIPATION`, tier 4, versus `DIRECT_USER_REQUEST`'s then-global tier 5) — the reused, unmodified `hierarchyTier`-ascending rule doing exactly what it always does, applied to two Opportunities that should never have been allowed to compete in the same turn-serving pass at all. Product/Architecture froze the governing principle — Decision-Pass causality/turn-serving scope is not the same concept as Canonical Candidate hierarchy — and authorized a narrow, domain-agnostic correction, implemented exactly as specified: (1) `internalPipelineOrchestrator.js` gains `isAdmittedForTurnServingPass()` and `buildOpportunitiesForDecisionPass()`'s own additive, optional third parameter (`currentTurnId`, supplied only by `runDirectTurnPass()`) — a DetectedOpportunity is admitted to a `DIRECT_TURN_PASS` iff `safetyHighRiskBypass === true` (Safety, unconditional, never gated by `turnId`) or its own `turnId` matches the originating turn; `APP_READY`'s own single-argument call site is untouched, structurally unaffected. (2) The global, source-only `DIRECT_USER_REQUEST` hierarchy-tier/category mapping (`recommendationCategories.js`) is removed — `DIRECT_USER_REQUEST` describes *why* FITME is responding now, never a universal professional-capability tier — and replaced by a narrow `initiativeEngine.js`-owned Source×Reason override, `SOURCE_REASON_HIERARCHY_TIER_OVERRIDES`, mirroring the existing `SOURCE_REASON_MATURITY_OVERRIDES` precedent exactly: only `DIRECT_USER_REQUEST × ADAPT_TO_CURRENT_STATE → 5` is authorized; every pre-DUC source-only mapping is byte-unchanged. (3) The dead, unused `SOURCE_CATEGORY_MAP.DIRECT_USER_REQUEST` entry (never consumed by the DUC-001 path — `categoryForSource()` is `recommendationEngine.js`-exclusive, which never accepts this source) was removed; `DIRECT_USER_REQUEST` remains a valid Opportunity Source. (4) The `Candidate.confidence: 1` semantic (request-existence confidence, never professional-advice confidence — the latter remains exclusively `rationale.uncertainty`'s own concern) was investigated and confirmed correct, consistent with the architecture-wide meaning `Candidate.confidence` has always carried (D1-ER-01/05); only its citing comment was clarified, no runtime change. (5) `index.html`'s Coach Conversation Surface error color was corrected from a hardcoded hex value to the existing `var(--color-danger)` design token. Introduces no new Product/Architecture decision; reopens no closed foundation (confirmed file-by-file). 15 new correction-specific tests (turn-serving filter unit tests, Source×Reason hierarchy tests, category tests, and a production-realistic collision regression reproducing and then disproving the original defect against the corrected tree). Full repository regression: 2559/2559 passing.
- **v1.0 (IMPLEMENTED / VERIFIED / CLOSED — this version)** — Product/Architecture approved DUC-001 as fully implemented, verified, and closed. Final working-tree verification (base HEAD `88fcf4dc36ef52cbb56eaca8736a0cc1d0dcb150` unchanged through the entire implementation + correction arc), full scope-purity diff review, exact explicit-path staging (28 files — 6 new, 22 modified), staged-blob verification, and a second, identical full regression pass on the staged tree (2559/2559, unchanged) all passed before commit. Committed and pushed: `4d4e4bf48b75ca09b7d8b31ba9c56d5c09d6dcff` (`main` == `origin/main`, verified). Post-commit canonical verification re-confirmed, against the committed repository state: the turn-serving collision remains fixed; `APP_READY`, proactive TRR, and Safety are unchanged; Preference V1 remains paused, untouched; no documentation was touched by the implementation commit. **No item remains open.**
