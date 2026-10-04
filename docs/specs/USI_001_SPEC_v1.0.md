# USI-001 — USER-STATED INTAKE AND CORRECTION — IMPLEMENTATION SPEC
## v1.0 — REVISION 1 — IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — NOT CLOSED — NOT LIVE (Product Review: APPROVED. Architecture Review: APPROVED.)

**Repository path:** `docs/specs/USI_001_SPEC_v1.0.md`

**Document role:** Implementation SPEC for USI-001, the governed bridge from natural conversation into durable, user-stated User Knowledge, covering both new explicit knowledge and correction, withdrawal and forgetting of existing User Knowledge. It implements the Turn Understanding Dimension 6 detector and the CPI-001 assertion anchor, the bounded USI interpreter, the deterministic intake gate with Safety → CPI → USI routing, and execution through the E.0.2c User Knowledge store. It ships **testable-not-live**: real User Knowledge persistence is not activated by this Work Item.

**Canonical contract:** GCUK (`docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md`) as amended by A1 and **A2** (`…_Amendment_A2_v1.0.md`); the **DUC detector amendment** (`docs/specs/DUC_001_AMENDMENT_USI_001_v1.0.md`); the **CPI anchor amendment** (`docs/specs/CPI_001_AMENDMENT_USI_001_v1.0.md`); the closed **E.0.2c SPEC** (`docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md`). All CANONICAL / CLOSED.

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline; **[CANON]** canonical document or explicit Product/Architecture decision; **[DESIGN]** a contract this SPEC proposes for approval; **[INFERENCE]**; **[GAP]**. **[PROVISIONAL]** marks a value to be confirmed or revised by real-model calibration before closure.

---

# 01. Identity, Status, and Authority

- Deliverable: **USI-001 — User-Stated Intake and Correction** (A2 §06, §10.1; absorbs the former E.0.2f).
- Status: **Product Review: APPROVED. Architecture Review: APPROVED. Status: IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — NOT CLOSED — NOT LIVE** (§34). SPEC authoring modified no file under `js/**`, `tests/**`, `functions/**`, and did not modify `index.html`, `sw.js`, `firestore.rules` or any canonical document.
- Repository baseline: `main` @ `629de1b5d840a6ed292329977c9d432cb19b0ec3` (== `origin/main`) **[VERIFIED]**. Full deterministic suite at the last verified state: 3511/3511 **[VERIFIED at `c0e2260`; `629de1b` added documentation only]**. The working tree carries 29 unrelated uncommitted entries; none is a file this SPEC authorizes.
- Authority: every **[CANON]** item is owned by Product/Architecture (A2 AR-1 … AR-7, AR-6a; DUC detector amendment; CPI anchor amendment; E.0.2c). Every **[DESIGN]** item in this revision is Product/Architecture approved for implementation.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** When the user tells FITME something about their own life ("I usually sleep badly before an early shift"), or corrects, withdraws or asks FITME to forget something it knows, FITME should capture that as governed, durable User Knowledge through ordinary conversation — no forms, no per-fact confirmation, no closed taxonomy — while keeping what the user stated distinct from what FITME inferred, keeping every user-attributed word literally the user's, and never letting the model grant itself authority.

**Scope.**
1. Activation gate and the testable-not-live boundary (§08).
2. Turn Understanding Dimension 6 (§09).
3. CPI-001 `assertionAnchorText` and a status-bearing classification seam (§10).
4. Higher-precedence recognition record and owned spans (§11).
5. USI preconditions: when no model call is made (§12).
6. Bounded presentation of existing concepts and records (§13).
7. The USI interpreter (§14).
8. The deterministic intake gate: literal authority, membership, routing (§15).
9. Mapping to E.0.2c records for new knowledge (§16) and for correction, withdrawal and forgetting (§17).
10. The executor and its ports (§18); additive E.0.2c store reads (§19).
11. Consent, Safety, Concept Identity, one canonical memory (§20–§23).
12. Bounds, cost, calibration, failure catalogue, pressure tests, scope, acceptance criteria (§24–§30).

**Non-goals (binding).**
- No live User Knowledge persistence: no platform adapter, no `firestore.rules` change, no `resetApp()` change, no governed server entry point, no E.0.2c concept-erase amendment (§08.3).
- The activation gate stays `false` in production; flipping it is a separate, approved step (§08.2).
- No production model-call delta and no production prompt change while the gate is `false` (§25).
- No change to OU-001, CCC-001, Need admission, `UserDisclosureRecognizer`, TRR, Expression, Safety modules or Safety intakes, C4, Typed Memory, `js/memory.js`, B1.
- No change to CPI-001's classes, polarities, targets, gate checks, persisted payload, record id, acknowledgment or capture outcome.
- No acknowledgment or Expression change for captured User Knowledge (§31).
- No consolidation, confound model, promotion, retrieval into reasoning, or General Reasoning activation (E.0.2d/e/g, Phase E).
- No taxonomy, ontology, domain enum, synonym table or semantic mapping.
- No embeddings or vector search; no agent loop; no retry.

---

# 03. Binding Canonical References

- **A2** §04 (invariant 22), §05 (invariant 23; literal policy), §06 (USI-001 governance shape), §07 (consolidation boundary), §08 (precedence, owned spans, routing rules 1–5, §08.3 fail-closed and proof boundary), §09 (one canonical memory; B1 mapping), §10 (sequence), §11 (live persistence gate) **[CANON]**.
- **DUC detector amendment** §03–§07 (Dimension 6 shape, semantics, validation, dimension-local failure, non-authority, cost, calibration) **[CANON]**.
- **CPI anchor amendment** §04–§08 (`assertionAnchorText`; anchor-local validation; same-turn use; failure rows AA1–AA4; calibration) **[CANON]**.
- **E.0.2c SPEC** §10 (record contract), §11 (evidence), §12 (source), §13 (Concept Identity), §14–§15 (transitions, supersession, INV-UC-S, user control), §16 (authority matrix), §16.4 (authority resolution may read), §17 (consent), §19 (`validateFactorProposal`), §20 (store, port), §21.4 (activation prerequisites), §24 (Safety) **[CANON]**.
- **OU-001** §15 rules 3–4, §16 (OpenUnderstanding never a durable-intake input) **[CANON]**.
- **CCC-001 amendment** §05 (literal current-turn anchoring; recent conversation never a fact) **[CANON]**.
- **CPI-001** §9–§17 (interpreter, gate, persistence, Safety veto) **[CANON]**.
- **MRE-001** (shared envelope for model JSON) **[CANON]**.
- **CARF** Ch.08 (injected `callClaude`, one attempt, no retry, fixed timeout, fail-closed) **[CANON]**.
- **A1** §04 (Invariant 21, Application-Ready; C1 §14.3 test) **[CANON]**.

---

# 04. Current-State Repository Evidence **[VERIFIED at `629de1b`]**

1. **Direct-turn sequence** (`js/coachDecisionSystem/internalPipelineOrchestrator.js`): `MemoryLayer.assembleContext` → `TurnUnderstandingInterpreter.understand(turn, recentConversationContext)` (`:324`) → `ConversationalNeedCreator.recognizeDirectUserNeed` → `ExplicitPreferenceStatementInterpreter.classify(turn, recentConversationContext)` (`:349`) → `PreferenceIntakeGate.authorize` (when `eligible`) → `UserDisclosureRecognizer.recognize` → `SafetyDisclosureIntakeGate.authorize` (only when a disclosure is recognized) → `RiskCharacteristicInterpreter.classifyTurnForDurableConstraint(turn.text)` (every turn) plus correction checks → authorization objects returned to the shell, which persists them (`js/app.js`, e.g. `persistCpiPreferenceRecord` `:2436`).
2. **CPI interpreter failure is indistinguishable from "no preference."** `classify()` returns `failedResult()` — `{eligible:false, …, ineligibleReason:'NO_EXPLICIT_PREFERENCE'}` — on unconfigured `callClaude`, throw, timeout or malformed output (`explicitPreferenceStatementInterpreter.js:204-248`); the orchestrator also maps a throw to `NOT_ELIGIBLE` (`:349-367`).
3. **CPI outputs:** `{eligible, preferenceClass, polarity, target, ineligibleReason}`; `target` is literal only for `ACTIVITY_SENTIMENT`; the gate's reasons include `SAFETY_VETO`, `SAFETY_VETO_DURABLE`, `SAFETY_VETO_UNAVAILABLE`, `CONSENT_ABSENT`, `LITERAL_ANCHOR_FAILED`, `INVALID_SHAPE` (CPI-001 §10); literal comparison is `trim().toLowerCase()` substring (`preferenceIntakeGate.js:38-43`). The CPI record id is `'conv_pref_' + preferenceClass + '_' + safeKey(target)`, computed in the shell (`js/app.js:2424-2426`).
4. **Safety recognitions:** `classifyTurnForDurableConstraint` returns `{status:'CLASSIFIED'|'FAILED', candidates:[{domain, anchorText}]}` with `anchorText` lower-cased and trimmed (`riskCharacteristicInterpreter.js:87, :280-301`). `SafetyDisclosureIntakeGate.authorize` returns `candidateRecord.restrictedActivityText`/`subjectKey` when authorized, `SAFETY_CLASSIFIER_UNAVAILABLE` on classifier failure, `CONSENT_ABSENT` without consent (`safetyDisclosureIntakeGate.js:89-138`); it runs only when `UserDisclosureRecognizer` recognizes a disclosure.
5. **Turn Understanding:** one call, 8,000 ms timeout, `max_tokens` 1,400 (DUC OU amendment §04); the current turn text is truncated by `partitionIntoBatches()` (`turnUnderstandingInterpreter.js:120-122`); Dimensions 1–5 use entry-level fail-closed validation; `failedResult()` at `:501`.
6. **E.0.2c store** (`js/coachDecisionSystem/userKnowledgeStore.js`): configured singleton; exposes writes, `getRecords`, `getConcepts`, forget/erase; the port offers `queryRecordsByConcepts` and `queryRecentConcepts`, which the store does not expose (E.0.2c §20.1: "E.0.2c implements no retrieval policy and no caller of either").
7. **Wiring invariants:** every `js/coachDecisionSystem/*.js` module with a `callClaude: null` default must be `configure()`d in `js/app.js` with the real `callClaude` (`tests/coachDecisionSystemWiring.test.js` test 37); a script-tagged module's dependencies must also be script-tagged, in order (REPAIR test); version literal `2.47.7` in `js/app.js:2`, `sw.js:1` and 20 test files; MRE-001 W-1 counts exactly 18 model-output parse sites (`tests/mre001Wiring.test.js:33-44`).
8. **Pinned production baselines:** per-scenario model-call counts and the TRR request-body hash (`tests/ou001ProductionBackedAcceptance.test.js:195-203`; `tests/e02bProductionBackedAcceptance.test.js`).

---

# 05. Definitions

- **Detector** — Turn Understanding Dimension 6, `userStatedKnowledge` (DUC detector amendment).
- **USI interpreter** — the bounded model call that proposes User Knowledge structure for one turn (§14).
- **Proposal** — one interpreter-proposed operation on User Knowledge (§14.4). Proposals carry no authority.
- **Gate** — the deterministic USI validation and routing function (§15).
- **Owned span** — current-turn text owned by a higher-precedence intake on this turn (A2 §08.2; §11).
- **User-attributed span** — any text a proposal attributes to the user (§15.2).
- **Executor** — the deterministic module that turns gate-approved proposals into E.0.2c store operations (§18).
- **Activation gate** — `UserStatedIntakeActivationGate`, default `false` (§08).

---

# 06. Binding Decisions Implemented — [CANON]

| Decision | Where |
|---|---|
| User-stated ≠ FITME-inferred (A2 inv. 22) | §16, §17, §23 |
| Literal user text; AI proposes structure only (A2 inv. 23) | §15.2, §16 |
| USI-001 owns new knowledge, correction, withdrawal, forget (A2 §06) | §16, §17 |
| Detector triggers; ≤ 1 bounded call; ordinary turns +0 (A2 §06.2; DUC §07) | §09, §12, §25 |
| OpenUnderstanding never an intake input (OU-001 §15–§16) | §14.2, AC-12 |
| Safety → CPI → USI; owned spans; rules 1–5; §08.3 fail-closed (A2 §08) | §11, §15.5 |
| CPI `assertionAnchorText`, same-turn, never persisted (CPI anchor amendment) | §10 |
| Dimension-6-local failure (DUC §05.4) | §09.4 |
| Correction of inferred knowledge: governed SERVER, atomic, INV-UC-S (E.0.2c §15.4) | §17.2 |
| One canonical memory; no mirroring (A2 §09) | §23 |
| Live persistence separately gated (A2 §11; E.0.2c §21.4) | §08.3 |

---

# 07. Architecture Overview and Turn Flow — [DESIGN]

```
current turn
 → Turn Understanding (existing call; + Dimension 6 when the activation gate is on)
 → [existing] Need creation, CPI interpreter (+ anchor when gate on) and gate, disclosure recognition,
   Safety disclosure intake, durable risk-characteristic intake   — all unchanged in outcome
 → USI preconditions (§12)  — no model call unless all hold
 → bounded presentation of existing concepts/records (§13)      — store reads only
 → USI interpreter: ONE bounded call (§14)                      — proposals only
 → deterministic gate: shape, literal authority, membership, owned-span routing, authority split (§15)
 → USI decision returned in the engine result (gate on only)
 → [shell, after CPI persistence outcome is known] executor (§18)
 → E.0.2c store (CLIENT) or governed correction port (SERVER)  — E.0.2c validation, authority, atomic commit
```

Every durable effect passes the gate and then E.0.2c's own validation and authority matrix. Nothing the model outputs reaches storage without both.

---

# 08. Activation Gate and the Testable-Not-Live Boundary — [DESIGN]

## 08.1 The gate

New module `js/coachDecisionSystem/userStatedIntakeActivationGate.js` (`window.UserStatedIntakeActivationGate`): `isEnabled() → boolean`, default `false`, with a test-only setter, following `generalReasoningActivationGate.js`.

When `isEnabled()` is `false` (production in this Work Item):
- the Turn Understanding prompt, request body and closed output are **byte-identical** to the baseline (no Dimension 6 instruction; no `userStatedKnowledge` key);
- the CPI interpreter prompt, request body and output are byte-identical (no anchor instruction; no `assertionAnchorText` key);
- the orchestrator never calls USI, never reads the User Knowledge store, and adds no key to the engine result;
- production model calls, request bodies and pinned hashes are unchanged.

When `true` (tests and the calibration harness only in this Work Item): the full path of §07 runs against injected dependencies.

## 08.2 Flipping the gate

Setting the gate to `true` in production is **not authorized by this Work Item**. It requires a separate Product/Architecture approval that is granted together with live persistence activation (§08.3), after calibration (§26) has passed. Enabling the detector and interpreter in production without live persistence would spend model calls with no durable effect and is not permitted.

## 08.3 Live persistence activation (separate, not in this Work Item)

Before the first real User Knowledge write, all of E.0.2c §21.4 and A2 §11 must be satisfied, in a separately approved Work Item:
1. a platform adapter implementing the User Knowledge port that passes the conformance suite (`tests/fixtures/userKnowledgePortConformance.js`);
2. storage and security rules for the two logical stores;
3. complete reset/erase semantics, including the E.0.2c §15.5 concept-erase amendment;
4. a governed trusted `SERVER` authority path implementing §18.3's correction port;
5. a governed correct/withdraw/forget path for FITME-sourced records before any exists;
6. shell wiring of the executor after CPI persistence (§18.4);
7. the activation-gate flip (§08.2);
8. **an approved way for conversational correction, withdrawal and forgetting to resolve relevant older knowledge** beyond the bounded presented set (PD-U1, §13). The recency-bounded targeting of this Work Item is a testable-not-live limitation only and must not become a live product limitation. E.0.2g may provide this capability; it is not opened by this Work Item.

None of these is implemented here.

---

# 09. Turn Understanding Dimension 6 — [CANON DUC amendment; DESIGN mechanics]

## 09.1 Output schema (gate on)

Model-output keys added to each closed entry: `"userStatedKnowledgePresent": true|false`, `"userStatedKnowledgeIntent": "NEW_USER_KNOWLEDGE"|"CORRECTION_WITHDRAW_FORGET"|null`, `"userStatedKnowledgeAnchorText": "<verbatim>"|null`.

Resulting closed-output key (gate on only): `userStatedKnowledge: {present, intent, anchorText}` exactly as DUC §03.

## 09.2 Prompt change (gate on only)

- **Placement (C1; Product/Architecture approval after calibration rounds 2–3).** The complete gate-off instruction block — Dimensions 1–5 text, gating and vocabulary, the open block, the two-segment output instruction, the closed JSON schema line and the injection clause — is kept byte-identical. Dimension 6 is one addendum, `DIMENSION 6 ADDENDUM (userStatedKnowledge)`, placed after that block and before the recent-conversation and turn blocks. The existing schema line is unchanged; the addendum names the three keys and asks for them at the end of the same part-1 JSON entry. No output segment, model call or model-output parse site is added. The gate-on prompt is therefore exactly the gate-off prompt with that one addendum inserted, and Dimensions 1–5 keep their existing task while Dimension 6 annotates the turn afterwards.
- Semantics per DUC §04: present when the current turn states something about the user's own life or circumstances that may be worth remembering durably (`NEW_USER_KNOWLEDGE`), or expresses intent to correct, replace, withdraw or forget something the user told FITME or FITME understood about them (`CORRECTION_WITHDRAW_FORGET`). `anchorText`: the exact verbatim span of the current turn carrying it.
- The instruction contains no example domain, activity, food, place, relationship or life-event word (DUC §04; checked by AC-9).

## 09.3 Validation (gate on)

1. Shape: `present:true` ⇒ `intent` ∈ the two tokens and `anchorText` a non-empty string of at most `DETECTOR_ANCHOR_MAX_CHARS` (200); `present:false` ⇒ both `null`.
2. Literal: `anchorText` must be an **exact substring** of NFC(the bounded current-turn text supplied to the model) after trimming the candidate (§15.2 rule L1). Recent-conversation text never satisfies this.

## 09.4 Dimension-local failure (binding)

Any failure of §09.3, and any Turn Understanding `FAILED` result, yields `userStatedKnowledge: {present:false, intent:null, anchorText:null}`. Dimension 6 is validated **after, and independently of,** the existing entry validation: `interpretationStatus`, Dimensions 1–5 and the open block are exactly what they would be without Dimension 6 (DUC §05.4). A Dimension-6-only malformation never turns a `CLASSIFIED` entry into `FAILED`.

## 09.5 Consumers

Only the USI preconditions (§12). Need creation, `UserDisclosureRecognizer`, TRR, Safety and every intake never read Dimension 6.

---

# 10. CPI-001 Assertion Anchor and Classification Status — [CANON CPI anchor amendment; DESIGN mechanics]

## 10.1 Interpreter output extension (gate on only)

The CPI interpreter's per-turn JSON gains `"assertionAnchorText": "<verbatim>"|null` (CPI anchor amendment §04). The prompt adds one sentence asking for the verbatim current-turn text expressing the whole recognized preference (class, polarity and target together), `null` when not eligible. The four existing fields, classes, polarities, targets and the Safety-exclusion instruction are unchanged. `max_tokens` stays 400 **[PROVISIONAL — calibration may require an approved increase]**.

## 10.2 Anchor validation (anchor-local)

Applied after CPI's existing validation, never affecting it:
1. non-empty string that passes CPI-001's existing `PreferenceIntakeGate.isLiteralSubstringOf(anchor, turn.text, CPI_ANCHOR_MAX_CHARS)` (`trim().toLowerCase()` substring; `CPI_ANCHOR_MAX_CHARS` = 200), exactly as CPI anchor amendment §05 rule 1 requires. The anchor is used only as an owned span, and §11.2 locates it case-insensitively, so this normalization is sufficient for routing; it is never stored;
2. for `ACTIVITY_SENTIMENT`: `anchor.trim().toLowerCase()` contains `target.trim().toLowerCase()` (CPI's own normalization, `preferenceIntakeGate.js:38`);
3. result `anchor: {valid:boolean, text:string|null}`; any failure → `{valid:false, text:null}` with every CPI outcome unchanged (CPI anchor amendment §05.3; failure rows AA1–AA4).

## 10.3 Status-bearing seam (additive; required by A2 §08.2 rule 4 and CPI anchor amendment AA4)

Because `classify()` cannot distinguish failure from "no preference" (§04 item 2), `ExplicitPreferenceStatementInterpreter` gains an additive sibling export, following `SafetyContextInterpreter.classifyWithStatus`:

```
classifyWithStatus(turn, recentConversationContext)
  → { status: 'CLASSIFIED' | 'FAILED', result: <exactly what classify() returns>, anchor: {valid, text} }
```

`classify()` is unchanged. `status:'FAILED'` when no validated entry for the turn was produced (unconfigured, throw, timeout, parse/validation failure). The orchestrator calls `classifyWithStatus()` and uses `.result` exactly where it used `classify()` today, so CPI behavior is identical; `status` and `anchor` are used only by §11. With the gate off, `anchor` is always `{valid:false, text:null}` and is unused.

## 10.4 Lifetime

The anchor lives only in the current turn's in-memory recognition record (§11). It is never persisted, logged, sent to telemetry, placed in Pipeline Context, passed to Expression, or passed to any Safety module (CPI anchor amendment §06).

---

# 11. Higher-Precedence Recognition Record and Owned Spans — [CANON A2 §08; DESIGN mechanics]

## 11.1 Record (built by the orchestrator, gate on only)

```
HigherPrecedenceRecognition {
  safety: {
    available: boolean,              // false if the durable-constraint classifier FAILED, or the
                                     // disclosure gate ran and returned SAFETY_CLASSIFIER_UNAVAILABLE
    ownedSpans: string[]             // RCF candidates' anchorText; disclosure restrictedActivityText /
                                     // subjectKey when that gate authorized
  },
  cpi: {
    available: boolean,              // classifyWithStatus status === 'CLASSIFIED'
    recognized: boolean,             // result.eligible === true
    anchor: { valid, text },
    gateReason: string | null,       // PreferenceIntakeGate reason, or null when not eligible
    authorized: boolean              // PreferenceIntakeGate authorized
  }
}
```

The disclosure gate returns no span on `CONSENT_ABSENT`; that case is unreachable for USI because USI requires the same consent (§12). The disclosure gate not running (no disclosure recognized) means no disclosure recognition, not unavailability.

## 11.2 Normalization and overlap (deterministic)

- **Overlap space:** `O(s) = NFC(s).toLowerCase()`. Owned spans and user-attributed spans are located in `O(turnText)`, where `turnText` is the bounded current-turn text.
- **Occupied intervals:** every occurrence (all start indexes) of `O(span.trim())` in `O(turnText)` gives a half-open interval; an owned span that does not occur contributes no interval.
- **Overlap:** two spans overlap iff any occupied interval of one intersects any occupied interval of the other.
- No whitespace collapsing or other rewriting is applied, so intervals are positions in the same string.

---

# 12. USI Preconditions — No Model Call Unless All Hold — [DESIGN]

USI runs its one interpreter call for a turn only if all of the following hold, checked in order, with no model call before the last:
1. `UserStatedIntakeActivationGate.isEnabled() === true`;
2. `turnUnderstanding.userStatedKnowledge.present === true` (valid per §09.3);
3. learned-memory consent is granted (`memoryLayer/PREFERENCE_CONSENT_READ`, the read every existing intake uses) — fail closed on read error;
4. `recognition.safety.available === true` and `recognition.cpi.available === true` (A2 §08.2 rule 4);
5. `recognition.cpi.gateReason` is not one of `SAFETY_VETO`, `SAFETY_VETO_DURABLE`, `SAFETY_VETO_UNAVAILABLE` (A2 §08.2 rule 3);
6. not (`recognition.cpi.recognized === true` and `recognition.cpi.anchor.valid !== true`) (A2 §08.3);
7. the injected User Knowledge store and interpreter are configured.

If any fails, the USI decision is `{status:'SKIPPED', reason}` and no call is made. Ordinary turns (detector negative) therefore make no USI call.

---

# 13. Bounded Presentation — [DESIGN]

The interpreter is shown only bounded, recency-selected existing knowledge, read through the store's additive bounded reads (§19):
1. **Concepts:** `queryRecentConcepts({limit: PRESENTED_CONCEPTS_MAX})` (30).
2. **Records:** `queryRecordsByConcepts({conceptIdsAny: <the 10 most recent concept ids>, statuses: ['candidate','active'], limit: PRESENTED_RECORDS_MAX})` (12).
3. Concepts referenced by presented records but not already presented are added, up to a combined cap of `PRESENTED_CONCEPTS_TOTAL_MAX` (40), most recent first. A record is presented only if all of its concepts fit within that cap; otherwise the record is dropped. The gate therefore always holds every concept of every presented record.
4. Each presented concept is rendered as `{conceptId, labels}` with at most 3 labels; each presented record as `{recordId, origin: epistemicOrigin(r), status, factors:[{conceptId, role, valueDescription}], relationDescription truncated to 160 chars}`.
5. The whole presented block is capped at `PRESENTED_BLOCK_MAX_CHARS` (6,000); items are dropped from the least recent end until it fits.
6. The user's whole store is never sent.

**Testable-not-live limitation (PD-U1, approved only as such):** correction, withdrawal or forgetting can target only records among those presented. Knowledge whose concepts are not recent is not targetable here; the gate then finds no grounded target and nothing is changed (§15.4). Before live activation this must be resolved by an approved older-knowledge resolution capability (§08.3 item 8; E.0.2g may provide it). Because grounding is computed only over presented records (§15.4), an unpresented intended target can make a *different* presented record the unique grounded record; §15.4.7 states this residual risk, which item 8 must also address.

For grounding (§15.4), the coordinator keeps the full stored form of every presented record and of every concept referenced by a presented record, including all labels, the full `relationDescription`, every `valueDescription`, `provenance.originTurnId` and supporting `CONVERSATION_TURN` references, as returned by the store. It does not use the truncated rendering shown to the model. These are the only records the gate considers.

---

# 14. USI Interpreter — [DESIGN]

## 14.1 Module

`js/coachDecisionSystem/userStatedIntakeInterpreter.js` (`window.UserStatedIntakeInterpreter`): `configure({callClaude, timeoutMs})`, default `{callClaude: null}`; stateless; one call per `interpret()`; one attempt; no retry; fixed timeout; never throws; fail-empty; parses with `ModelResponseEnvelope.unwrapSingleJsonFence()` (MRE-001 site 19).

## 14.2 Request

Body keys exactly `model`, `max_tokens`, `messages` (one user message). `MODEL = 'claude-haiku-4-5-20251001'`; `MAX_TOKENS = 800` **[PROVISIONAL]**; `TIMEOUT_MS = 8000` **[PROVISIONAL]**.

Data section, each block framed as DATA, never instruction:
- `<turn>`: the bounded current-turn text (≤ 2,000 characters, the Turn Understanding bound);
- `<recent>`: the existing `recentConversationContext` (CCC-001 bounds), framed with the OU-001 §13 text, for reference resolution only;
- `<concepts>` and `<records>`: §13;
- `<owned>`: owned spans (§11), so the model can avoid them.

OpenUnderstanding and Need fields are never included (OU-001 §15–§16).

## 14.3 Instruction content (normative requirements)

The instruction states that the model must:
- propose structure only;
- copy every user-attributed text field **exactly** from `<turn>` (never from `<recent>`, never paraphrased);
- choose `conceptId`/`recordId` values only from the presented lists, or use `newConceptLabel` copied from `<turn>`;
- never restate text inside `<owned>` spans except as the single CPI reference factor;
- for every CORRECT, WITHDRAW or FORGET, copy from `<turn>` the user's request (`requestText`) and, inside it, the words by which the user refers to the existing knowledge (`referenceText`); state whether that reference names the knowledge by the user's own words (`NAMED`) or refers back to the recent conversation without naming it (`DEICTIC`); and propose no mutation when it is unclear which presented record the user means;
- use FORGET only when the user asks for the knowledge to be deleted or forgotten, not when the user says it is wrong or no longer true;
- decline statements about medical conditions, injuries or restrictions (Safety content belongs elsewhere);
- return no proposal for questions, requests, hypotheticals, jokes, or anything not clearly stated by the user about themselves;
- return STRICT JSON only.

It contains no example domain, activity, food, place, relationship or life-event word (AC-9).

## 14.4 Output

```
{ "proposals": [                                     // 0..PROPOSALS_PER_TURN_MAX (3)
  { "operation": "NEW" | "CORRECT" | "WITHDRAW" | "FORGET",
    "targetRecordIds": [ "<presented recordId>" ],   // NEW: 0; CORRECT, WITHDRAW, FORGET: exactly 1
    "requestText": "<verbatim>" | null,              // CORRECT, WITHDRAW, FORGET: required; NEW: null
    "referenceText": "<verbatim>" | null,            // CORRECT, WITHDRAW, FORGET: required; NEW: null
    "referenceKind": "NAMED" | "DEICTIC" | null,     // CORRECT, WITHDRAW, FORGET: required; NEW: null
    "statementText": "<verbatim current-turn span>" | null,   // NEW, CORRECT: required
    "factors": [                                     // NEW, CORRECT: 1..FACTORS_PER_PROPOSAL_MAX (6)
      { "conceptId": "<presented>" | null,
        "newConceptLabel": "<verbatim>" | null,      // exactly one of conceptId / newConceptLabel
        "mentionText": "<verbatim>" | null,          // where the user refers to this concept now; null only
                                                     // for a CORRECT carry-forward factor (§15.2)
        "role": "condition" | "subject" | "outcome",
        "valueText": "<verbatim>" | null,
        "cpiReference": true | false } ],
    "temporality": "DURABLE" | "TEMPORARY" | "RECURRING_WINDOW",   // NEW, CORRECT
    "confoundText": "<verbatim>" | null,             // CORRECT only: the user's own explanation
    "safetyAdjacent": true | false } ] }
```

`operation`, `role`, `temporality`, `cpiReference` and `referenceKind` are closed **process/structure** values (E.0.2c §09.1); none describes content. `requestText` and `referenceText` are **authority anchors**: literal current-turn text that grounds a mutation (§15.4). They are never persisted. An empty list means no durable knowledge.

## 14.5 Failure

Unconfigured, throw, timeout, `stop_reason:'max_tokens'`, non-JSON, prose around JSON, or a non-object → `{status:'FAILED', proposals:[]}`. A single fenced JSON is accepted (MRE-001). Invalid individual proposals are dropped by the gate (§15), never repaired.

---

# 15. Deterministic Intake Gate — [CANON A2 §05, §08; E.0.2c; DESIGN mechanics]

Module `js/coachDecisionSystem/userStatedIntakeGate.js` (`window.UserStatedIntakeGate`): pure, synchronous, never throws. Input: raw interpreter proposals, the turn, the presented sets, the recognition record. Output: per proposal either `{accepted, plan}` or `{rejected, code}`. Proposals are evaluated independently, except for the cross-proposal rules of §15.4.6.

## 15.1 Shape and bounds (reject `INVALID_SHAPE`)

Exact keys; closed values; per-operation requirements:

| Operation | `targetRecordIds` | `requestText` / `referenceText` / `referenceKind` | `statementText`, `factors`, `temporality` | `confoundText` |
|---|---|---|---|---|
| NEW | none | all `null` | required | `null` |
| CORRECT | exactly 1 | all required | required | optional |
| WITHDRAW | exactly 1 | all required | `null` / none | `null` |
| FORGET | exactly 1 | all required | `null` / none | `null` |

Also: every bound of §24; at most `NEW_CONCEPTS_PER_TURN_MAX` (6) new concepts across all accepted proposals of the turn.

## 15.2 Literal user authority (reject `NOT_LITERAL`)

- **L1 — exact current-turn substring.** A text `t` is literal iff `t.trim().length ≥ 1` and `NFC(turnText).indexOf(NFC(t.trim())) ≥ 0`: case-, punctuation- and spacing-exact. The stored value is `NFC(t.trim())`, which by L1 is text the user wrote in this turn.
- **User-attributed fields** — each must satisfy L1: `statementText` (→ `relationDescription`), every non-null `mentionText`, every `newConceptLabel` (→ new concept label), every `valueText` (→ `valueDescription`), `confoundText` (→ confound `description`).
- **Carry-forward factor (CORRECT only).** A successor factor may have `mentionText: null` only if it uses an existing `conceptId` that appears in the factors of at least one target of the proposal, with `newConceptLabel: null`, `cpiReference: false` and `valueText: null`. It carries a concept the user did not re-mention into the corrected record as structure, never as user-attributed text (A2 inv. 23). Every other factor requires a literal `mentionText`, and a `newConceptLabel` must equal its `mentionText`. At least one factor of every NEW or CORRECT proposal must have a literal `mentionText`; otherwise reject `NO_ANCHORED_FACTOR`.
- **Authority anchors** — each must satisfy L1 and is never persisted: `requestText` (≤ `REQUEST_TEXT_MAX_CHARS`, 200) and `referenceText` (≤ `REFERENCE_TEXT_MAX_CHARS`, 80). Their use is defined in §15.4.
- **Structural fields** (AI may propose; never user-attributed text): `operation`, `targetRecordIds`, `referenceKind`, `conceptId`, `role`, `temporality`, `cpiReference`, `safetyAdjacent`.
- Length bounds: `statementText` ≤ 400 (E.0.2c `RELATION_DESCRIPTION_MAX_CHARS`); `mentionText`, `newConceptLabel` ≤ 80 (E.0.2c `LABEL_MAX_CHARS`); `valueText` ≤ 160; `confoundText` ≤ 200.
- AI-composed prose therefore cannot reach any persisted field: anything that is not an exact substring is rejected, never repaired or paraphrased.

## 15.3 Membership (reject `UNKNOWN_CONCEPT` / `UNKNOWN_TARGET`)

- Every `conceptId` must be `===` a presented concept id (E.0.2c `validateFactorProposal`, call-scoped). Hallucinated, differently-cased or non-presented ids are rejected.
- Every `targetRecordId` must be `===` a presented record id.
- Fabricated ids never reach the store.

## 15.4 Target Authority for CORRECT, WITHDRAW and FORGET (binding)

**Principle.** A presented `recordId` chosen by the model proves membership only. It is never, by itself, authority to mutate. Every mutating proposal must be tied to the current user turn by two literal authority anchors that deterministic code can check:
- `requestText`: where the user makes the request;
- `referenceText`: where, inside that request, the user refers to the existing knowledge.

The target set must then equal a **grounding set** that the gate computes itself, from the user's reference and the presented records' own stored data. The model may still propose which record the user means. The gate accepts only a proposal whose targets are exactly the records the user's own current words mechanically ground. Everything else fails closed. No keyword list, pronoun list, synonym table, taxonomy or additional model call is used.

### 15.4.1 Operation anchoring

- **No use of Dimension 6 in the gate.** DUC detector amendment §07 makes the USI-001 trigger Dimension 6's only consumer and forbids it from selecting a mutation. The gate therefore never reads Dimension 6's intent or anchor. Dimension 6 only permits the interpreter call (§12).
- **T1 — Request anchored in the current turn.** `requestText` satisfies L1 and the bound. Otherwise reject `REQUEST_NOT_ANCHORED`.
- **T2 — Reference inside the request.** `referenceText` satisfies L1 and the bound, and at least one of its occurrence intervals lies entirely within an occurrence interval of `requestText`. Otherwise reject `REFERENCE_NOT_ANCHORED`.
- **T3 — Higher precedence.** `requestText` and `referenceText` must not overlap any Safety-owned span (reject `SAFETY_OWNED_SPAN`) or, when `cpi.recognized`, the CPI anchor (reject `CPI_OWNED_SPAN`). A request that a higher-precedence intake recognized as its own is left to that intake.

### 15.4.2 Grounding set (deterministic)

Normalization: `G(s) = NFC(s).toLowerCase().replace(/\s+/g, ' ').trim()` (E.0.2c `normalizeLabelKey`). The candidates are the presented `candidate`/`active` records only (§13). The gate never considers a record that was not presented.

**Lexical grounding `L(ref)`.** A presented record `r` is lexically grounded by `referenceText` iff some current label `ℓ` of some concept in `r.factors`, with `|G(ℓ)| ≥ LEXICAL_GROUNDING_MIN_CHARS` (3, **[PROVISIONAL]**), satisfies `G(referenceText).includes(G(ℓ))`.

The user's current reference must contain a stored name of one of the record's concepts. Concept labels are Concept Identity's own names (E.0.2c §13): literal user text for user-stated concepts, producer text otherwise. The check is string containment only: no vocabulary, synonym, stemming or pronoun list. Grounding deliberately does not use `relationDescription` or `valueDescription`. Containment of a reference in free-text descriptions would let a short back-reference (for example a pronoun) ground arbitrary records. A paraphrase that contains no stored label does not ground, and the proposal fails closed.

**Conversational grounding `C`.** Let `W` be the set of `turnId`s in the turn's `recentConversationContext.items` (CCC-001 bounds; at most 6 turns at baseline, `memoryLayer.js:751`). `r ∈ C` iff `r.provenance.originTurnId ∈ W` or some supporting evidence reference `{kind:'CONVERSATION_TURN', ref}` of `r` has `ref ∈ W`. If recent conversation is unavailable, `C = ∅`.

**Grounding set `G*` by `referenceKind`.** The model chooses `referenceText`, `requestText` and `referenceKind`. The gate prevents that choice from narrowing what the user actually named by also computing grounding over text the model did not choose, as follows.
- `NAMED` → `G* = L(referenceText)`, and the gate additionally requires `L(turnText) = G*`, where `turnText` is the **whole** bounded current turn. If the turn names any presented record that the reference omits, the proposal is rejected `AMBIGUOUS_TARGET`. The model cannot select a narrower reference, or a narrower request, to single out one of several records the user named. The cost is that a turn which also mentions another presented record's label, for example alongside new knowledge, fails closed for mutation. CAL-8(c) reports that rate.
- `DEICTIC` → requires `L(turnText) = ∅`, where `turnText` is the **whole** bounded current turn. A back-reference is groundable only when the current turn names no presented record at all. Otherwise the proposal is rejected `REFERENCE_KIND_MISMATCH`. Then `G* = C`. The model therefore cannot avoid a named reference by choosing a label-free sub-span and falling back on recent-conversation grounding.

### 15.4.3 Exact-set rule

- `G* = ∅` → reject `TARGET_NOT_GROUNDED`.
- Any target `∉ G*` → reject `TARGET_NOT_GROUNDED`: the model chose a record the user's words do not ground.
- `G*` contains a record not targeted → reject `AMBIGUOUS_TARGET`: the user's words ground more records than the model chose, and the gate does not pick among them.
- Cardinality: **CORRECT, WITHDRAW and FORGET** all require `|G*| = 1`; otherwise reject `AMBIGUOUS_TARGET`.

So a mutation executes only on a single record that is the unique member of `G*`. A request that grounds several records never mutates any of them in V1. Multi-record correction, withdrawal or forgetting from one request is deferred (§31).

### 15.4.4 Authority route

- The single target's `epistemicOrigin` selects the route. A `user_stated` target goes to the CLIENT store; a FITME-sourced target goes to the governed correction port (§17.2). Because every mutation is single-target, no proposal can mix authorities; the former `MIXED_TARGET_AUTHORITY` check is subsumed.
- A target that is not `candidate`/`active` is rejected `TARGET_NOT_CURRENT`.
- Grounding (§15.4.2) never grants the route or the authority. It only admits the target; E.0.2c's authority matrix and INV-UC-S still decide whether the write is allowed.

### 15.4.5 FORGET safeguards (strongest treatment)

FORGET is a hard delete (E.0.2c §15.5). In addition to T1–T3 and §15.4.3, it requires all of the following:
1. exactly one target, and that target is the unique member of `G*`;
2. at most one FORGET proposal per turn;
3. **exclusivity:** no other CORRECT or WITHDRAW proposal in the same turn (§15.4.6);
4. the operation class is honestly model-judged (item 5 below). Before any live activation, calibration gate CAL-8 (§26) requires **zero** FORGET proposals on the corpus's non-forget correction and withdrawal turns;
5. **ambiguity never deletes:** any ambiguity (`|G*| ≠ 1`, a kind mismatch, missing recent conversation for `DEICTIC`, a missing anchor) rejects the proposal, and nothing is deleted or downgraded to another operation.

### 15.4.6 Cross-proposal rules

- A record targeted by more than one proposal in the turn → every such proposal is rejected `TARGET_CONFLICT`.
- More than one FORGET, or a FORGET together with any CORRECT or WITHDRAW → every mutating proposal of the turn is rejected `FORGET_NOT_EXCLUSIVE`. NEW proposals are unaffected.

### 15.4.7 What is proven, and what remains model judgment (binding statement)

**Deterministically proven:**
- the request is literal text of the current turn;
- the reference is literal text inside that request;
- every target is a presented, current record;
- the single target is the **unique** presented record grounded:
  - by a stored concept label contained in the user's reference, when the whole current turn names no other presented record; or
  - when the whole current turn names no presented record, by the record's origin in the recent conversation;
- nothing ungrounded is touched, and any ambiguity changes nothing.

**Not deterministically proven — model judgment, bounded by the rules above and measured by calibration:**
- that the user *meant* the grounded record (semantic identity between the reference and the record);
- whether the user asked for a mutation at all, and which of correct, withdraw or forget (the literal request proves only that the user said those words);
- whether a lexical overlap is a coincidence of word sense.

**Residual risks, stated:**
- (i) The intended record is not presented, and a different presented record uniquely shares the user's words. That record could be withdrawn or forgotten. Resolving this is a live-activation prerequisite (§08.3 item 8).
- (ii) A short label coincidentally contained in the reference. This is bounded by `LEXICAL_GROUNDING_MIN_CHARS` and measured by CAL-8.
- (iii) A withdrawal misclassified as FORGET. This is measured by CAL-8, with a zero-tolerance threshold.

These risks are accepted only while the capability is testable-not-live, where no real record exists. Live activation requires CAL-8 to pass and §08.3 item 8 to be resolved.

## 15.5 Owned-span routing (A2 §08.2 rules 1–2)

With §11.2 overlap:
1. **Safety:** any user-attributed span overlapping any Safety-owned span → reject `SAFETY_OWNED_SPAN`.
2. **CPI (only when `cpi.recognized`):**
   - A factor with `cpiReference:true` is allowed only if: `cpi.authorized === true`; there is exactly one such factor in the proposal; its `mentionText` lies entirely within the CPI anchor's interval (a new-concept label equals that `mentionText`); `valueText` is `null`; and the proposal is NEW or CORRECT. It is represented only by reference (§16.3).
   - Every other user-attributed span of the proposal (including `statementText`, every other `mentionText`/`newConceptLabel`/`valueText`, `confoundText`) must not overlap the CPI anchor → else reject `CPI_OWNED_SPAN`.
   - A proposal with a `cpiReference` factor must have at least one other factor whose `mentionText` is disjoint from every owned span → else reject `NO_ADDITIONAL_KNOWLEDGE`.
3. `cpiReference:true` when `cpi.recognized` is false, or in a CORRECT of FITME-sourced targets (§17.2) → reject `INVALID_CPI_REFERENCE`.

## 15.6 Duplicate and no-op checks

- NEW whose content key (E.0.2c `contentKey`, computed on the planned content) equals a presented active `user_stated` record's → reject `DUPLICATE_OF_PRESENTED`.
- CORRECT of `user_stated` targets whose successor content key equals a target's → reject `CORRECTION_IDENTICAL_TO_PREDECESSOR` (the same rule E.0.2c INV-UC-S condition 5 applies to inferred targets).

## 15.7 Output plan

An accepted proposal yields a plan: the E.0.2c operation(s), the authority route (CLIENT store or governed port), the drafts built by §16–§17, and — for `cpiReference` — a dependency on the CPI record, resolved by the executor (§18.2).

---

# 16. New Knowledge → E.0.2c Record — [DESIGN]

## 16.1 Draft

For an accepted NEW proposal, `createRecord({draft, newConcepts})` on the CLIENT store with:

| E.0.2c field | Value |
|---|---|
| `factors[i]` | `{conceptId | newConcept:k, role, valueDescription: valueText or null}` |
| new concepts | one per distinct `newConceptLabel` (deduplicated by E.0.2c `normalizeLabelKey`), `labels: [label]` |
| `relationDescription` | `statementText` (literal) |
| `evidenceClass` | `EXPLICIT_STATEMENT` |
| `source` | `user_stated` |
| `temporality` | proposed value; `expiresAt: null` (no model-derived dates) |
| `confidence` | `1` (deterministic constant; confidence carries no authority, E.0.2c §12.3) |
| `safetyFlag` | `SAFETY_ADJACENT` if `safetyAdjacent` is true, else `STANDARD` (the model may only raise it) |
| `evidence.supporting` | `[{kind:'CONVERSATION_TURN', ref: turnId}]` plus §16.3 |
| `provenance.originTurnId` | `turnId` |
| producer | `usi-001.intake` / `1.0.0` |

The store sets `status:'active'` (user-stated), timestamps, ids and `conceptIds` (E.0.2c §10.4). `mentionText` of an existing-concept factor is validated and used for routing only; it is not stored.

## 16.2 Meaning of `source: 'user_stated'`

It records that the knowledge originates in the user's own declaration in `originTurnId`. Every stored free-text field is an exact substring of that turn (§15.2). The interpretive structure — which concepts, roles and temporality — is the model's proposal, validated deterministically, and is never presented as the user's words (A2 inv. 23).

## 16.3 CPI reference factor

For a `cpiReference` factor, the executor adds `{kind:'TYPED_MEMORY_RECORD', ref: <CPI record id>}` to `evidence.supporting`. The factor's concept is either a presented concept or a new concept labelled with its `mentionText` (inside the CPI span). It carries no `valueDescription`. The CPI assertion is thereby represented by reference only (A2 §08.2 rule 2).

---

# 17. Correction, Withdrawal and Forgetting — [CANON E.0.2c §15; A2 §06; DESIGN mechanics]

Every operation in this section is reached only by a proposal that passed the full target-authority contract of §15.4. The executor never re-selects, widens or narrows targets.

## 17.1 User-stated targets (CLIENT store)

- **CORRECT:** `supersede({predecessorIds: targets, successor: <draft per §16>, confoundsForPredecessors: confoundText ? [{description: confoundText, source:'user_stated'}] : []})`. One atomic change set; predecessors become `superseded` with links; nothing is deleted.
- **WITHDRAW:** `retractRecord({recordId, userOriginTurnId: turnId})` on the single target → `rejected`, history kept.
- **FORGET:** `forgetRecord({recordId})` on the single target → hard delete (E.0.2c §15.5).

## 17.2 FITME-sourced targets (governed SERVER port)

Correction, withdrawal and forgetting of FITME-inferred knowledge are server-routed (A2 AR-1; E.0.2c ADP-1 option (a)). The executor calls the injected **governed correction port** (§18.3):
- **CORRECT** → `correctInferredKnowledge({predecessorIds, successor, userOriginTurnId: turnId, confoundsForPredecessors})` — one atomic change set: the `user_stated` successor is created and every targeted inferred record is superseded, under INV-UC-S. The successor's supporting evidence is exactly `[CONVERSATION_TURN:turnId]` (no inferred evidence carried; the CPI reference factor is therefore not permitted in a CORRECT of FITME-sourced targets), `provenance.originTurnId === turnId`, every history entry carries `userOriginTurnId`, and exact-copy corrections are rejected by E.0.2c condition 5.
- **WITHDRAW** → `retractRecord({recordId, userOriginTurnId})` under SERVER.
- **FORGET** → `forgetRecord({recordId})` under SERVER.

User correction outranks prior FITME understanding (GCUK Ch.13): a valid correction is applied regardless of the inferred record's confidence or evidence.

## 17.3 Atomicity

Each accepted proposal maps to exactly one change set for CORRECT (atomic, E.0.2c §15.2) and exactly one store operation on its single target for WITHDRAW/FORGET. After the §15.4.6 cross-proposal rules, proposals are independent: one proposal's rejection or failure does not roll back another's committed effect. Every operation's outcome is reported (§18.1).

---

# 18. Executor and Ports — [DESIGN]

## 18.1 Executor

Module `js/coachDecisionSystem/userStatedIntakeExecutor.js` (`UserStatedIntakeExecutor`), Node-only in this Work Item:

```
execute({ decision, cpiRecord: { persisted: boolean, memoryId: string|null } })
  → { status, outcomes: [{ proposalIndex, status: 'COMMITTED'|'DELETED'|'REJECTED'|'CONFLICT'|'FAILED'|'NO_CHANGE'|'SKIPPED', code? }] }
```

- Configured with `{clientStore, governedCorrectionPort}`; never reads a clock, never throws.
- A plan with a CPI-reference dependency is executed only if `cpiRecord.persisted === true` and `memoryId` passes the E.0.2c evidence-ref pattern; otherwise that proposal is `SKIPPED` (A2 §08.2 rule 2: no CPI record, no exception).
- It writes only through `clientStore` and `governedCorrectionPort`; every E.0.2c consent, validation and authority rule applies on top of the gate.

## 18.2 Ordering with CPI

The executor runs after the shell knows the CPI persistence outcome for the turn, so a CPI reference is never cited before the CPI record exists.

## 18.3 Governed correction port (contract)

```
GovernedCorrectionPort {
  correctInferredKnowledge(request) → Promise<StoreResult>
  retractRecord(request)             → Promise<StoreResult>
  forgetRecord(request)              → Promise<StoreResult>
}
```

It represents the trusted governed `SERVER` boundary (E.0.2c §05). Requests are the E.0.2c store requests; the implementation must independently re-validate (C4 §11.3 precedent). In this Work Item only a test double exists (`tests/fixtures/usiGovernedCorrectionPortTestDouble.js`, backed by a separately loaded SERVER-configured store). The real implementation is a live-activation prerequisite (§08.3 item 4).

## 18.4 Shell wiring

Not in this Work Item. At live activation, the shell calls the executor after `persistCpiPreferenceRecord`, passing the CPI outcome and memory id.

---

# 19. Additive E.0.2c Store Reads — [DESIGN; additive to E.0.2c §20.2]

`UserKnowledgeStore` gains two consent-gated, bounded, validated reads, as E.0.2c §20.1 anticipated:
- `queryRecordsByConcepts({conceptIdsAny, statuses, limit})` → `{status:'OK', records}`;
- `queryRecentConcepts({limit})` → `{status:'OK', concepts}`.

Both enforce the §24 and E.0.2c §09.2 bounds, validate every returned document (E.0.2c validators, store user), return `CONSENT_NOT_GRANTED` with an empty result without consent, and never throw. No existing store operation, planner, validator or port contract changes; E.0.2c's own tests remain unmodified and passing.

---

# 20. Consent — [CANON GCUK Ch.19; A1 §08; E.0.2c §17]

- One consent: the general learned-memory consent (`LEARNED_MEMORY_PERSONALIZATION`, `memoryConsent.granted`). No per-topic scope.
- Checked before any USI model call (§12 item 3) and again by the E.0.2c store on every read and write.
- External and platform permissions are out of scope.

---

# 21. Safety — [CANON A2 §08; E.0.2c §24; Safety canon]

1. Safety intakes take precedence; USI never persists text overlapping a Safety-owned span (§15.5).
2. If Safety recognition is unavailable on the turn, or CPI's Safety veto fired or was unavailable, USI makes no call and persists nothing (§12).
3. The model may only raise `safetyFlag` to `SAFETY_ADJACENT`, never lower it.
4. User Knowledge is never a Safety input. A user-stated record never creates permission and never overrides a Safety restriction; no Safety module reads it (E.0.2c §24).
5. USI adds no separate Safety-veto model call. Precedence plus the existing Safety intakes, which already run on the turn, carry the Safety boundary **[DESIGN — for review]**.

---

# 22. Concept Identity — [CANON E.0.2c §13; A2 inv. 23]

- **Reuse:** the model may select a presented concept id; membership is checked (§15.3).
- **New:** the model may propose `newConceptLabel`, which must be literal current-turn text (§15.2); the store creates the concept with that label.
- No ontology, category, domain enum or mapping table. No label is added to an existing concept by USI in V1 (§31). No merge or unmerge by USI in V1 (§31).

---

# 23. One Canonical Memory Model — [CANON A2 §09]

- USI writes only User Knowledge.
- It never writes Typed Memory, and never mirrors or migrates between the two.
- CPI-owned assertions are cited by reference, never restated (§15.5, §16.3).
- Manual D6 facts and all Safety memory are untouched.

---

# 24. Deterministic Bounds — [DESIGN]

| Bound | Value | Rationale |
|---|---|---|
| `DETECTOR_ANCHOR_MAX_CHARS` | 200 | One sentence; within the 2,000-char turn bound |
| `CPI_ANCHOR_MAX_CHARS` | 200 | A preference assertion is one clause |
| Current-turn text shown to USI | ≤ 2,000 chars | Same as Turn Understanding |
| `PRESENTED_CONCEPTS_MAX` | 30 | Recent concepts; input cost |
| `PRESENTED_CONCEPTS_TOTAL_MAX` | 40 | Incl. concepts of presented records |
| `PRESENTED_RECORDS_MAX` | 12 | Correction targeting; input cost |
| `PRESENTED_BLOCK_MAX_CHARS` | 6,000 | Caps input tokens |
| `PROPOSALS_PER_TURN_MAX` | 3 | One turn rarely states more |
| `FACTORS_PER_PROPOSAL_MAX` | 6 | Below E.0.2c `MAX_FACTORS` 8 |
| `NEW_CONCEPTS_PER_TURN_MAX` | 6 | Bounds concept growth per turn |
| Targets per mutating proposal | exactly 1 (CORRECT, WITHDRAW, FORGET) | Uniquely grounded single target (§15.4.3); within E.0.2c `MAX_LINKS` 8 |
| FORGET proposals per turn | ≤ 1, exclusive of CORRECT/WITHDRAW | §15.4.5 |
| `REQUEST_TEXT_MAX_CHARS` / `REFERENCE_TEXT_MAX_CHARS` | 200 / 80 | One request clause / one referring phrase |
| `LEXICAL_GROUNDING_MIN_CHARS` | 3 **[PROVISIONAL]** | Suppresses incidental containment of very short labels; Hebrew short-word cost measured by CAL-8 |
| Conversational grounding window | CCC-001 `recentConversationContext` (≤ 6 turns at baseline) | Existing bound; no new read |
| `statementText` / `mentionText` / `newConceptLabel` / `valueText` / `confoundText` | 400 / 80 / 80 / 160 / 200 | E.0.2c field bounds |
| USI `MAX_TOKENS` | 800 **[PROVISIONAL]** | 3 proposals × 6 factors of short spans, plus authority anchors |
| USI `TIMEOUT_MS` | 8,000 **[PROVISIONAL]** | Sibling interpreters |
| Model calls per turn from USI | 0 or 1 | A2 §06.2; no retry, no loop |

---

# 25. Model Calls and Cost — [CANON A2 §06.2; DUC §07; CPI anchor amendment §04]

| State | Turn type | USI-related model calls |
|---|---|---|
| Gate `false` (production, this Work Item) | any | **0**; Turn Understanding and CPI request bodies byte-identical |
| Gate `true` | detector negative, or a §12 precondition fails | 0 |
| Gate `true` | detector positive and all preconditions hold | exactly 1 (the USI interpreter) |

The detector and the CPI anchor add output tokens to existing calls, never calls. Latency is added in series only on candidate turns, bounded by `TIMEOUT_MS`. The E.0.2c store reads of §13 are storage reads, not model calls.

---

# 26. Real-Model Calibration — [CANON DUC §07; CPI anchor amendment §08; DESIGN thresholds]

Opt-in harness `tests/evals/usi001Calibration.eval.js`, outside the default suite; operator credential from the environment only; direct model API; synthetic corpus only; the unmodified production path with the activation gate on and only the transport replaced (E.0.2b precedent). Corpus: every §28 case in English and Hebrew; at least 20 ordinary turns (no knowledge); mixed CPI turns of all three classes; corrections; an injection probe; a recent-conversation-only span probe.

Gates (thresholds **[PROVISIONAL]**, confirmed at review):

| Gate | Measure | Threshold |
|---|---|---|
| CAL-1 Turn Understanding behavioural identity | Protected Turn Understanding outcomes (§26.1) of gate-on equal those of gate-off on the fixed corpus, with stochastic control | 100% of protected outcomes; zero recurring gate-caused differences |
| CAL-2 Detector | Precision on ordinary turns (false-positive rate); recall on knowledge/correction turns; anchor literal-validity rate | FP ≤ 10%; recall ≥ 80%; validity ≥ 95% |
| CAL-3 CPI behavioural identity | Protected CPI outcomes (§26.1) of gate-on equal those of gate-off on the fixed corpus, with stochastic control | 100% of protected outcomes; zero recurring gate-caused differences |
| CAL-4 CPI anchor | Validity rate on eligible turns; human review of extent (complete assertion, not a fragment, not unrelated text) | validity ≥ 95%; extent acceptable ≥ 90% |
| CAL-5 USI interpreter | Parse/format failures; proportion of proposals passing the gate; human review that accepted records reflect what the user said | FAILED ≤ 5%; review PASS |
| CAL-6 Latency / budget | p99 latency for Turn Understanding, CPI and USI within timeouts; max output tokens ≤ 80% of `max_tokens`; zero `max_tokens` stops | as stated |
| CAL-7 Injection | No instruction-following; no fabricated ids accepted | 0 |
| CAL-8 Target authority | On a corpus of correction/withdraw/forget turns with 1, 2 and 3+ plausible presented targets, named and back-referring, English and Hebrew: (a) mutations executed against a record a human reviewer judges the user did not mean; (b) FORGET proposals on turns a reviewer judges are not deletion requests; (c) fail-closed rate on unambiguous requests (reported, informs PD) | (a) 0; (b) 0; (c) reported |

Semantic completeness of anchors and of the model's structure is established only by this calibration, never claimed as deterministic.

## 26.1 Behavioural identity measurement (CAL-1, CAL-3) — [CANON — Product/Architecture ruling after calibration rounds 2–3]

CAL-1 and CAL-3 protect **downstream behavioural identity**: the existing production outcomes that Dimension 6 and `assertionAnchorText` are not allowed to change (DUC detector amendment §05.4, §07; CPI anchor amendment §05, §08, §09). They do not require field-by-field equality between independent stochastic model samples.

1. **Protected outcomes** are computed by passing each sampled model result through the unmodified production downstream code.
   - **CAL-1:** `interpretationStatus`; the Need result kind and the matched capability (`ConversationalNeedCreator`, with the production capabilities registered); the resulting routing (capability-routed opportunity, unsupported capability, or no Need); disclosure recognition and disclosure category (`UserDisclosureRecognizer`); and every other production downstream decision derived from Dimensions 1–5 at the time of measurement.
   - **CAL-3:** `eligible`, `preferenceClass`, `polarity`, `target`; the `PreferenceIntakeGate` authorization outcome; the persisted payload and record id where applicable; the acknowledgement; and TRR consumption. The persisted payload, record id, acknowledgement and TRR consumption are deterministic functions of the authorized candidate record (`preferenceClass`, `polarity`, `target`). The gate's Safety veto is an independent model call whose input does not include the CPI output; the measurement holds it and consent constant per turn so that a measured difference reflects only the CPI output.
2. **Non-consumed fields.** A difference in a model output field that no production code consumes at the time of measurement is **reported**, but it is not a behavioural regression. At this SPEC's baseline these include Dimension 3 `negativeControlPresent`, the verbatim span text of Dimensions 2 and 5, the Dimension 1 domain/topic when no registered capability matches either value, and CPI `ineligibleReason`. When any such field gains a production consumer, it becomes protected automatically.
3. **Stochastic control.** Each corpus turn is sampled at least 3 times with the gate off and at least 3 times with the gate on, with an identical model and configuration.
   - A protected outcome **fails** when all gate-off samples agree and at least 2 gate-on samples differ from them (a recurring gate-caused difference).
   - A single non-recurring gate-on difference on a turn whose gate-off samples agree is reported. Across the corpus, such differences must not exceed the measured gate-off pairwise disagreement rate on protected outcomes.
   - A turn whose gate-off samples disagree with each other is reported as unstable and does not decide the gate.
4. A recurring change to a protected outcome **always fails**, whether or not the gate-on answer could be argued to be more correct. Example: a durable statement whose disclosure category changes from STATE (gate off) to CAPACITY_OR_CONSTRAINT (gate on).
5. This section defines measurement only. It does not relax the DUC detector amendment or the CPI anchor amendment, the gate-off byte identity of §08.1 and AC-2, or any deterministic test. Recorded responses may be replayed locally to verify this measurement, but they never validate a prompt; prompt behaviour is established only by real-model calibration.

---

# 27. Failure Catalogue — [DESIGN]

| Failure | Detection | Result | Fallback |
|---|---|---|---|
| Dimension 6 malformed / non-literal / TU FAILED | §09.3–§09.4 | detector absent | USI skipped; TU otherwise unchanged |
| CPI interpreter failed | `classifyWithStatus` status | `cpi.available=false` | USI skipped; CPI unchanged |
| CPI anchor invalid (CPI recognized) | §10.2 | `anchor.valid=false` | USI skipped (A2 §08.3); CPI unchanged |
| CPI Safety veto / unavailable | gate reason | — | USI skipped |
| Safety recognition unavailable | RCF `FAILED` / disclosure `SAFETY_CLASSIFIER_UNAVAILABLE` | `safety.available=false` | USI skipped |
| No consent / consent read error | §12 | — | USI skipped, no call |
| Store unconfigured / read failure | §19 result | — | decision `FAILED`, no call or no effect |
| Interpreter failure | §14.5 | `FAILED` | no proposals |
| Invalid proposal | §15 | rejected with code | others unaffected (except §15.4.6) |
| Mutation not detected / request or reference not anchored | §15.4.1 | rejected | no mutation |
| Target not grounded / ambiguous / kind mismatch | §15.4.2–§15.4.3 | rejected | no mutation; never downgraded or narrowed |
| Target conflict / FORGET not exclusive | §15.4.6 | all affected proposals rejected | NEW unaffected |
| CPI record not persisted | §18.1 | proposal `SKIPPED` | none |
| Store/port conflict or failure | E.0.2c | `CONFLICT` / `FAILED` | no partial state (atomic) |

No fallback fabricates knowledge, evidence, a concept or a target.

---

# 28. Pressure Tests — [DESIGN; cases 1–14 → AC-60 … AC-73; cases 15a–22b → AC-74 … AC-89]

| # | Input / setup | Expected (gate on) |
|---|---|---|
| 1 | "I usually sleep badly before an early shift." | Detector NEW; CPI not eligible; one NEW record, `user_stated`, `EXPLICIT_STATEMENT`, literal `relationDescription`, factors anchored in the turn |
| 2 | "Large meals before training make me feel heavy." | NEW record, 3 factors (condition/subject/outcome) all literal |
| 3 | "I prefer training in the morning." | CPI owns the whole assertion; any USI proposal is rejected (`CPI_OWNED_SPAN` / `NO_ADDITIONAL_KNOWLEDGE`); no User Knowledge write |
| 4 | "I prefer training in the morning because evenings are for my children." | CPI owns "I prefer training in the morning"; USI NEW record with a CPI reference factor, factors for "evenings" / "my children", `relationDescription` "evenings are for my children", evidence cites the CPI record; executed only after the CPI record persists |
| 5 | "I enjoy running because it clears my head." | CPI (class A) owns "I enjoy running"; USI records "it clears my head" with a CPI reference factor |
| 6 | Correction of a presented FITME-inferred record, reference naming one of its concept labels, uniquely grounded | Routed to the governed port; atomic `correctInferredKnowledge`; successor `user_stated`, predecessor `superseded`, INV-UC-S satisfied |
| 7 | A withdrawal ("…is not true anymore") whose reference names exactly one presented user-stated record | WITHDRAW → `retractRecord` CLIENT, `rejected`, history keeps `userOriginTurnId` |
| 8 | An explicit forget request whose reference names exactly one presented user-stated record | FORGET → `forgetRecord` CLIENT; record removed; links elsewhere remain ids |
| 9 | Ambiguous "maybe I'll try something new someday" | Interpreter returns no proposal, or proposals fail the gate; no write |
| 10 | Malformed Dimension 6 | Detector absent; USI skipped; Dimensions 1–5 unchanged |
| 11 | CPI recognized, anchor missing/invalid | USI skipped (no call); CPI capture unchanged |
| 12 | CPI blocked by consent / by Safety veto | Consent: USI skipped (no consent). Veto: USI skipped (§12 item 5) |
| 13 | Fabricated `recordId` / `conceptId` | Proposal rejected (`UNKNOWN_TARGET` / `UNKNOWN_CONCEPT`); nothing written |
| 14 | AI-composed prose in `statementText` / `valueText` / label | Proposal rejected (`NOT_LITERAL`) |

**Target-authority pressure tests (15–22).** In every case Dimension 6 is positive (so the interpreter runs), and all §12 preconditions hold. The gate does not read Dimension 6. "Model may propose" is what the interpreter is allowed to output; the gate is the only authority.

| # | Case and setup | Model may propose | Deterministically verified | Remains model judgment | Result |
|---|---|---|---|---|---|
| 15a | "Forget what I told you about my knee". Presented: R1 (label "knee"), R2 ("sleep"), R3 ("coffee") | FORGET, targets [R1], `requestText` = the sentence, `referenceText` "my knee", `NAMED` | T1–T3; "my knee" is literal and inside the request; `L("my knee") = L(turnText) = {R1}` ("knee" ⊂ "my knee"); targets = `G*`; single target; exclusive | that R1 is what the user means by "my knee"; that the user asked to *forget* rather than withdraw | **Executes** `forgetRecord(R1)` |
| 15b | Same sentence. Presented: R1 ("knee"), R4 ("knee", "stairs"), R2 ("sleep") | FORGET [R1] or [R1, R4] | `L = {R1, R4}`, so `|G*| = 2` | which knee record(s) the user meant | **Fails closed**: [R1] → `AMBIGUOUS_TARGET`; [R1, R4] → `INVALID_SHAPE` (exactly 1 target). Nothing deleted |
| 15c | Same sentence, but a Safety intake recognized a span overlapping "my knee" on this turn | any | T3 overlap with the Safety-owned span | — | **Fails closed** `SAFETY_OWNED_SPAN`; Safety's own intake handles it |
| 16 | "Forget that". The previous turn (in `W`) created R5; no other presented record originates in `W`; no label contained in "that" | FORGET [R5], `referenceText` "that", `DEICTIC` | literal and inside the request; `L(turnText) = ∅`; `C = {R5}`; targets = `G*`; single | that "that" refers to R5's content rather than to something else said in those turns | **Executes** `forgetRecord(R5)` |
| 17 | "Forget that". R5 and R6 both originate in `W` | FORGET [R5] | `C = {R5, R6}` | which one "that" means | **Fails closed** `AMBIGUOUS_TARGET` |
| 17b | "Forget that", but the prior turns were FITME talking about an older record R7 whose origin is not in `W` | FORGET [R7] | `C` does not contain R7 | — | **Fails closed** `TARGET_NOT_GROUNDED` (a back-reference to FITME's own words cannot be grounded in V1) |
| 18 | "That's not true anymore". One presented user-stated record R5 originates in `W` | WITHDRAW [R5], `DEICTIC` | as in 16 | the withdraw/forget/correct choice; the referent | **Executes** `retractRecord(R5, userOriginTurnId)`; the record is `rejected`, not deleted |
| 18b | "That's not true anymore". No presented record originates in `W` | WITHDRAW [any] | `C = ∅` | — | **Fails closed** `TARGET_NOT_GROUNDED` |
| 19 | "That's not true anymore". R5 and R6 originate in `W` | WITHDRAW [R5] | `C = {R5, R6}` | referent | **Fails closed** `AMBIGUOUS_TARGET` |
| 20 | "Actually, it wasn't pasta — it was the huge portion". Presented FITME-inferred R8: factors pasta (condition), feeling heavy (outcome); no other presented record has a label contained anywhere in the turn | CORRECT [R8]; `requestText` = the sentence; `referenceText` "pasta", `NAMED`; `statementText` "it was the huge portion"; factors: new concept "huge portion" (condition, literal), carry-forward outcome concept of R8 (`mentionText: null`) | T1–T3; `L("pasta") = {R8}` = `L(turnText)`; targets = `G*`, single; FITME-sourced → governed port; all user-attributed text literal; carry-forward concept is in R8; no CPI reference | that the user's correction is about R8's relationship; the successor's structure (roles, carried concept) | **Executes** governed `correctInferredKnowledge`: successor `user_stated` with `relationDescription` "it was the huge portion"; R8 `superseded`; INV-UC-S holds |
| 20b | Same, but a second presented record R9 also has label "pasta" | CORRECT [R8] or [R8, R9] | `G* = {R8, R9}` | which pasta relationship | **Fails closed**: [R8] → `AMBIGUOUS_TARGET`; [R8, R9] → `INVALID_SHAPE`. Nothing superseded |
| 21 | Model selects a real presented R2 ("sleep") for "Forget what I told you about my knee" | FORGET [R2] | `L("my knee") = {R1}`; R2 ∉ `G*` | — | **Fails closed** `TARGET_NOT_GROUNDED` |
| 21b | Same, but the model also picks the label-free sub-span "I told you" as `referenceText` to try to ground R2, where R2 is the unique record from the recent turns | FORGET [R2], `NAMED` or `DEICTIC` | `NAMED`: `L("I told you") = ∅` → `TARGET_NOT_GROUNDED`. `DEICTIC`: `L(turnText) = {R1} ≠ ∅` → `REFERENCE_KIND_MISMATCH` | — | **Fails closed** in both forms |
| 21c | "Forget what I said about coffee and my knee"; R3 ("coffee"), R1 ("knee"); the model narrows `referenceText` to "my knee" | FORGET [R1] | `L("my knee") = {R1}` but `L(turnText) = {R1, R3}` ≠ `G*` | — | **Fails closed** `AMBIGUOUS_TARGET` (multi-record forget deferred) |
| 22 | Model selects the wrong real record for FORGET: user means R1 ("knee"), model outputs R4 ("knee", "stairs") | FORGET [R4] | `L("my knee") = {R1, R4}`; `|G*| = 2` | — | **Fails closed** `AMBIGUOUS_TARGET` |
| 22b | Wrong record, but the intended record is **not presented** (older), and presented R4 is the only record with label "knee" | FORGET [R4] | `G* = {R4}`; passes | whether R4 is what the user meant | **Would execute**: residual risk (i), §15.4.7. Accepted only while testable-not-live; live activation requires §08.3 item 8 and CAL-8(a) = 0 |

---

# 29. Exact Implementation Scope — [DESIGN]

**New production files**
- `js/coachDecisionSystem/userStatedIntakeActivationGate.js`
- `js/coachDecisionSystem/userStatedIntakeInterpreter.js`
- `js/coachDecisionSystem/userStatedIntakeGate.js`
- `js/coachDecisionSystem/userStatedIntake.js` — coordinator: preconditions (§12), presentation (§13), interpreter call, gate; returns the decision
- `js/coachDecisionSystem/userStatedIntakeExecutor.js` — Node-only (§18)

**Modified production files**
- `js/coachDecisionSystem/turnUnderstandingInterpreter.js` — Dimension 6 under the gate (§09)
- `js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js` — anchor under the gate; additive `classifyWithStatus` (§10)
- `js/coachDecisionSystem/internalPipelineOrchestrator.js` — `classifyWithStatus` call with identical CPI use; recognition record and USI decision under the gate only (§11–§12)
- `js/coachDecisionSystem/userKnowledgeStore.js` — two additive reads (§19)
- `js/app.js` — `UserStatedIntakeInterpreter.configure({callClaude})` beside the sibling interpreters (wiring test 37); `APP_VERSION` → `2.47.8`
- `index.html` — script tags, in dependency order, for the activation gate, `userKnowledgeContract.js`, the USI interpreter, gate and coordinator, before the orchestrator
- `sw.js` — `VERSION` → `v2.47.8`; the new assets

**New tests and fixtures**
- `tests/usi001TurnUnderstandingDimension6.test.js`
- `tests/usi001CpiAssertionAnchor.test.js`
- `tests/usi001Interpreter.test.js`
- `tests/usi001Gate.test.js`
- `tests/usi001Coordinator.test.js`
- `tests/usi001Executor.test.js`
- `tests/usi001StoreReads.test.js`
- `tests/usi001ProductionBackedAcceptance.test.js` (gate off zero drift; gate on end-to-end with the in-memory port)
- `tests/usi001Static.test.js`
- `tests/usi001Wiring.test.js`
- `tests/fixtures/usiGovernedCorrectionPortTestDouble.js`

**Opt-in evaluation artifact**
- `tests/evals/usi001Calibration.eval.js`

**Authorized modifications to existing tests (only these)**
- The `2.47.7` → `2.47.8` version-pin updates in the existing files that pin it.
- `tests/mre001Wiring.test.js`: add the USI interpreter to `SITE_FILES` (site 19) and the W-1 total `18 → 19`.
- `tests/e02cUserKnowledgeStatic.test.js` (implementation-discovered test-compatibility clarification): its static allowlists/assertions may be extended **only** for the exact USI-001 production paths and usages this SPEC already requires — the `relationDescription` token in the USI-001 modules that build or present records (§13, §16, §17), the `userKnowledgeContract.js` dependency of the USI-001 modules (§15, AC-40), and the `userKnowledgeContract.js` browser script tag and service-worker asset (§29 `index.html`, `sw.js`). Every other path stays rejected exactly as before.

No other existing test is modified: with the gate `false`, every existing Turn Understanding, CPI, orchestrator and production-backed test must pass unchanged.

**Forbidden changes:** OU-001 files and behavior; `conversationalNeedCreator.js`; `userDisclosureRecognizer.js`; `preferenceIntakeGate.js`; `memoryLayer.js`; every Safety module and Safety intake; `js/memory.js`; `functions/**`; `firestore.rules`; `resetApp()`; E.0.2c contract, transitions and existing store operations; TRR; Expression; any closed canonical document.

---

# 30. Test Plan and Acceptance Criteria

All deterministic tests stub `callClaude`. Every test other than the calibration harness runs with synthetic data.

**Architecture, zero drift and live boundary**
- AC-0: the full existing suite passes with only the §29 authorized test modifications.
- AC-1: the activation gate defaults to `false`; production code never sets it.
- AC-2: gate `false`: the Turn Understanding and CPI request bodies are byte-identical to the baseline for fixed turns (sha256 pinned before implementation); the closed Turn Understanding output has no `userStatedKnowledge` key; the CPI result has no anchor.
- AC-3: gate `false`: production-backed per-scenario model-call counts and the TRR request-body hash equal the pinned values; the USI interpreter is never called; the engine result has no USI key.
- AC-4: no production code path calls `UserStatedIntakeExecutor`; `js/app.js` does not reference it; no adapter, rules or reset change exists (static).
- AC-5: static C1 §14.3 test over every new and modified core module (no DOM, storage, `navigator`, `fetch(`, Firebase, `window.` beyond the standard export and UMD import lines); each loads under Node.

**Detector (Dimension 6)**
- AC-6: gate on: valid Dimension 6 values are parsed into `userStatedKnowledge` exactly per DUC §03.
- AC-7: invalid shape, unknown intent, empty or over-length anchor, and an anchor present only in `recentConversationContext` all yield the absent shape.
- AC-8: for a fixture set, Dimensions 1–5, `interpretationStatus`, the open block, Need admission and `UserDisclosureRecognizer` outcomes are identical with Dimension 6 valid, malformed and absent (dimension-local failure).
- AC-9: the Dimension 6 instruction and the USI instruction contain no word from a test-held English/Hebrew domain denylist and no example.

**CPI anchor and status seam**
- AC-10: gate on: `classifyWithStatus` returns `CLASSIFIED` with a valid anchor for a literal anchor; `{valid:false}` for missing, over-length, non-literal, or (class A) target-not-contained anchors; every CPI outcome (result, gate reason, payload, id, acknowledgment) is identical in all anchor cases.
- AC-11: `classifyWithStatus` returns `FAILED` on unconfigured, throw, timeout and malformed output; `classify()` output is byte-identical to the baseline in every case.
- AC-12: the anchor never appears in persisted payloads, Pipeline Context, Expression input, Safety inputs, logs or telemetry (static and dynamic); OpenUnderstanding and Need fields never appear in the USI request (deep scan).

**Preconditions and model-call budget**
- AC-13: gate on, detector negative → 0 USI calls.
- AC-14: each §12 precondition failing on its own (consent false/throws, Safety unavailable, CPI unavailable, CPI veto of each reason, CPI recognized with invalid anchor, store unconfigured) → 0 USI calls and `SKIPPED` with the matching reason.
- AC-15: all preconditions hold → exactly 1 USI call; no retry on failure; timeout enforced.
- AC-16: the USI request has exactly `model`, `max_tokens`, `messages`; every data block respects its §24 bound; the presented block never exceeds 6,000 chars; no more than 30/40 concepts and 12 records are presented even when the store holds more.

**Interpreter**
- AC-17: parse and failure matrix per §14.5; `interpret()` never rejects; a single fenced JSON is accepted.
- AC-18: output bounds are enforced: more than 3 proposals, or more than 6 factors, make the excess invalid; any target count other than exactly 1 for CORRECT/WITHDRAW/FORGET, or other than 0 for NEW, is `INVALID_SHAPE`.

**Literal authority**
- AC-19: each user-attributed field (`statementText`, `mentionText`, `newConceptLabel`, `valueText`, `confoundText`) that is not an exact current-turn substring is rejected `NOT_LITERAL`, including case-, spacing- and punctuation-altered paraphrases and text present only in recent conversation.
- AC-20: accepted records contain free text only in `relationDescription`, `valueDescription`, new-concept labels and confound descriptions, and each is an exact substring of the origin turn (deep check).

**Membership and targets**
- AC-21: hallucinated, differently-cased and non-presented `conceptId`/`recordId` values are rejected; nothing reaches the store.
- AC-22: non-current targets are rejected; the route is selected only by the single target's `epistemicOrigin`.

**Target authority (§15.4)**
- AC-44: the gate never reads Dimension 6 (static: `userStatedIntakeGate.js` does not reference `userStatedKnowledge`; dynamic: identical gate outcomes for either Dimension 6 intent).
- AC-45: T1/T2: a non-literal or over-length `requestText`/`referenceText`, or a reference not inside the request, is rejected with the matching code; a request/reference present only in recent conversation is rejected.
- AC-46: T3: authority anchors overlapping a Safety-owned span or the CPI anchor are rejected.
- AC-47: lexical grounding is exactly §15.4.2: label containment after `normalizeLabelKey`, labels shorter than `LEXICAL_GROUNDING_MIN_CHARS` ignored, `relationDescription`/`valueDescription` never used. A static test proves the gate module holds no word list, synonym map or regular expression over content words.
- AC-48: `NAMED`: a proposal is rejected `AMBIGUOUS_TARGET` when `L(turnText) ≠ L(referenceText)`, including the narrowed-reference and narrowed-request cases.
- AC-49: `DEICTIC`: a proposal is rejected `REFERENCE_KIND_MISMATCH` when the whole turn names any presented record; `C` is computed only from `provenance.originTurnId` and `CONVERSATION_TURN` references against the recent-conversation turn ids; unavailable recent conversation gives `C = ∅`.
- AC-50: exact-set rule: `TARGET_NOT_GROUNDED` for an empty `G*` or a target outside `G*`; `AMBIGUOUS_TARGET` for `|G*| ≠ 1`; nothing reaches the store or port in either case (spy asserts zero calls).
- AC-51: FORGET safeguards: a second FORGET, or a FORGET with any CORRECT/WITHDRAW, rejects every mutating proposal of the turn with `FORGET_NOT_EXCLUSIVE`; a record targeted twice gives `TARGET_CONFLICT`; a rejected FORGET is never downgraded, narrowed or retried as another operation.
- AC-52: carry-forward factors are accepted only in CORRECT, only for a concept of the target, only with null `mentionText`/`valueText`/`newConceptLabel` and `cpiReference:false`; a proposal with no anchored factor is rejected `NO_ANCHORED_FACTOR`.
- AC-53: authority anchors never appear in any persisted record, history entry, log, telemetry, Pipeline Context or Expression input (deep scan).

**Routing (Safety → CPI → USI)**
- AC-23: a user-attributed span overlapping any Safety-owned span → `SAFETY_OWNED_SPAN`.
- AC-24: a user-attributed span overlapping the CPI anchor outside the single reference factor → `CPI_OWNED_SPAN`.
- AC-25: a CPI reference factor is accepted only with `cpi.authorized`, `mentionText` inside the anchor, null `valueText`, exactly one such factor, and at least one other factor disjoint from owned spans; each violation has its code.
- AC-26: overlap uses §11.2 on all occurrences; tests include repeated words and Hebrew text.
- AC-27: the executor skips a CPI-reference proposal when the CPI record was not persisted, and cites `TYPED_MEMORY_RECORD:<memoryId>` when it was.
- AC-28: no USI path writes Typed Memory; no assertion is written to both stores (static and dynamic).

**New knowledge**
- AC-29: an accepted NEW proposal yields an E.0.2c-valid `user_stated`, `EXPLICIT_STATEMENT`, `active` record with `confidence 1`, `expiresAt null`, supporting `CONVERSATION_TURN:turnId`, `originTurnId === turnId`, producer `usi-001.intake`.
- AC-30: the model can raise but never lower `safetyFlag`.
- AC-31: duplicate NEW of a presented active user-stated record is rejected `DUPLICATE_OF_PRESENTED`.

**Correction, withdrawal, forget**
- AC-32: CORRECT of user-stated targets commits one atomic `supersede` with symmetric links and a user-sourced confound; identical content is rejected.
- AC-33: CORRECT of FITME-sourced targets calls only the governed port's `correctInferredKnowledge`, never the CLIENT store; the resulting state satisfies INV-UC-S (successor `user_stated`, evidence exactly the turn, targets superseded, `userOriginTurnId` on every entry); a CPI reference factor in such a proposal is rejected.
- AC-34: WITHDRAW maps to `retractRecord` with `userOriginTurnId` (CLIENT for user-stated, governed port for FITME-sourced).
- AC-35: FORGET maps to `forgetRecord` (CLIENT for user-stated, governed port for FITME-sourced).
- AC-36: a failing or conflicting commit leaves no partial state; a proposal's failure does not undo another's committed effect; every outcome is reported.

**Consent and Concept Identity**
- AC-37: with consent false the store reads and every write refuse, and no USI call is made.
- AC-38: presented-concept reuse keeps the id; new concepts get their literal label; at most 6 new concepts per turn; no label is added to an existing concept; no merge.

**Store reads (§19)**
- AC-39: the two additive reads are consent-gated, bounded, validated and never throw; the E.0.2c suite passes; no E.0.2c production contract, transition, existing store operation or semantic invariant is changed; and the only change to E.0.2c tests is the §29-authorized USI-001 compatibility allowance in `tests/e02cUserKnowledgeStatic.test.js`.

**Static and scope**
- AC-40: USI modules have no dependency beyond the §29 set, the E.0.2c contract and MRE-001; the coordinator never requires the executor; no module reads a clock except through injection.
- AC-41: MRE-001 W-1 passes with exactly 19 sites; the USI interpreter uses the shared envelope.
- AC-42: wiring: script-tag order, `sw.js` assets and version, and the `js/app.js` configure line (test 37).
- AC-43: no taxonomy: exported vocabularies of new modules are exactly the process values of §14.4.

**Pressure tests**
- AC-60 … AC-73: §28 cases 1–14, each asserting exactly the "Expected" column (gate on, in-memory store and governed-port test double).
- AC-74 … AC-89: §28 cases 15a, 15b, 15c, 16, 17, 17b, 18, 18b, 19, 20, 20b, 21, 21b, 21c, 22, 22b (in that order), each asserting exactly the "Result" column. Every fail-closed case also asserts zero store and port mutation calls. Case 22b is asserted as executing and is labelled in the test as the documented residual risk.

**Calibration and regression**
- AC-90: calibration gates CAL-1 … CAL-8 pass at the thresholds approved at review, recorded in the Closure Record. CAL-8(a) and (b) must be 0 before any live activation.
- AC-91: full deterministic regression passes with 0 failures and 0 skips.
- AC-92: scope purity: `git diff` touches only §29 files; the 29 unrelated entries are byte-identical.

**Review checklist (not automated)**
- R-1: every forbidden file in §29 is byte-unchanged.
- R-2: no credential or credential-bearing configuration in the tree or diff.
- R-3: the Dimension 6, CPI anchor and USI instruction texts are reviewed for open-world wording and injection containment.

---

# 31. Deferred — Recorded, Not Solved

| Item | Owner |
|---|---|
| Live persistence activation (§08.3 items 1–7) | Separate live-activation Work Item |
| Acknowledging captured knowledge to the user (Expression) | Product decision; later Work Item |
| Targeting knowledge whose concepts are not recent | E.0.2g retrieval integration |
| Adding labels to existing concepts; concept merge/unmerge from conversation | Later Work Item |
| Forgetting concepts left unreferenced after a forget | Live-activation erase design (E.0.2c §15.5) |
| User confirmation (not correction) of inferred knowledge | Later Work Item |
| Correction of CPI Typed Memory preferences | Remains CPI-001 behavior |
| Consolidation boundary enforcement for inferred knowledge | E.0.2d SPEC (A2 §07) |
| Multi-record correction/withdrawal/forgetting from one request; resolving requests that ground several records (fail closed in V1, §15.4.3) | Later Work Item |
| Grounding back-references to FITME's own recent statements about older records (fail closed in V1, §28 case 17b) | Later Work Item; relates to §08.3 item 8 |
| Grounding by paraphrase (no shared stored label; fail closed in V1) | Later Work Item; measured by CAL-8(c) |

---

# 32. Decisions, Repository Gaps, and Canonical Conflicts

**Approved at Product/Architecture review (resolved)**
- **ADP-U1 — APPROVED.** Default-off activation-gated rollout (§08).
- **ADP-U2 — APPROVED.** Additive CPI `classifyWithStatus` seam (§10.3).
- **ADP-U3 — APPROVED.** The two bounded, consent-gated User Knowledge store reads (§19).
- **ADP-U4 — APPROVED.** No additional Safety-veto model call; the existing independent Safety precedence is preserved (§21 item 5).
- **ADP-U5 — APPROVED.** `GovernedCorrectionPort` as the trusted SERVER-side contract for operations on FITME-sourced User Knowledge (§18.3).
- **PD-U2 — APPROVED.** No user-facing acknowledgment in USI-001 while the capability remains testable-not-live.
- **PD-U1 — APPROVED ONLY AS A TESTABLE-NOT-LIVE LIMITATION.** USI-001 may initially target only the bounded presented records. This must not become a live product limitation. Before live activation, conversational correction, withdrawal and forgetting must have an approved way to resolve relevant older knowledge (§08.3 item 8). E.0.2g may provide it; E.0.2g is not opened by this Work Item.

**Review blocker — APPROVED / RESOLVED (revision 1):** target authority for CORRECT, WITHDRAW and FORGET (§15.4). Approved together with:
- single-target mutations;
- Dimension 6 as trigger-only, never read by the gate or supplied to the interpreter;
- the CORRECT carry-forward factor rule.

Residual risk §15.4.7(i) is accepted only while USI-001 remains testable-not-live. §08.3 item 8 remains a mandatory live-activation prerequisite. The CAL-8(a)/(b) zero-tolerance requirements remain binding.

**Engineering (provisional values):** USI `MAX_TOKENS` (800), `TIMEOUT_MS`, CPI `max_tokens`, `LEXICAL_GROUNDING_MIN_CHARS` (3), all calibration thresholds (CAL-1 … CAL-7; CAL-8(c) reporting). CAL-8(a) and (b) are fixed at 0.

**Repository Gaps**
- **[GAP]** Item 6 has no SPEC (OU-001 GAP-5); §11 relies on `safetyDisclosureIntakeGate.js` behavior.
- **[GAP]** CPI interpreter failure is indistinguishable from "no preference" today (§04 item 2); resolved additively by ADP-U2.

**Canonical Conflicts:** none found (§33).

---

# 33. Cross-Document Consistency Review

| Check | Result |
|---|---|
| A2 inv. 22–25, §06–§11 | Implemented by §09–§23; live persistence not activated (§08) |
| DUC detector amendment | Shape, semantics, literal anchoring, dimension-local failure, non-authority, cost, calibration (§09, §25, §26) |
| CPI anchor amendment | Anchor field, validation, same-turn use, failure rows, calibration; CPI classes, payload and capture unchanged (§10) |
| E.0.2c | Records built through store operations only; INV-UC-S path via the governed port; authority matrix, consent and validation unchanged; additive reads only (§16–§19) |
| OU-001 / CCC-001 | OpenUnderstanding and Need never used. Recent conversation is reference-only and never a literal source (§14.2, §15.2). Conversational grounding (§15.4.2) uses only recent turn *ids* to admit a record whose own provenance points to those turns; no recent-conversation text becomes a fact or an authority anchor |
| A2 inv. 23 (statement ≠ interpretation authority) | Target selection remains a model proposal; mutation authority comes only from literal current-turn anchors plus deterministic unique grounding (§15.4); carry-forward factors are structure, never user-attributed text |
| E.0.2c user control / PD-1 | FORGET executes only on a uniquely grounded single target; ambiguity never deletes (§15.4.5) |
| CPI-001 | `classify()` unchanged; existing gate, persistence and acknowledgment unchanged (§10) |
| B1 / one memory | No Typed Memory write; citation by reference; no mirroring (§23) |
| Safety canon | Precedence; no Safety input; no permission from user statements (§21) |
| A1 inv. 21 | Core modules platform-neutral; shell changes limited to the precedented configure, tags and version (§29) |
| MRE-001 / CARF Ch.08 | One attempt, fixed timeout, shared envelope (§14) |

---

# 34. Status, Closure Criteria, and Definition of Complete

- Status: **IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — NOT CLOSED — NOT LIVE** (Product Review: APPROVED. Architecture Review: APPROVED.)
- All Product/Architecture decisions required for implementation are resolved: ADP-U1 … ADP-U5, PD-U1 (testable-not-live limitation only), PD-U2, and the revision-1 target-authority contract (§15.4) (§32). Live persistence activation (§08.3) remains separately gated and is not authorized by this status.
- Implemented and deterministically verified: the implementation is complete and the full deterministic regression passes with the activation gate `false`. This is a checkpoint, not closure.
- Not CLOSED: real-model calibration CAL-1 … CAL-8 (§26, §26.1; AC-90) has not passed and is not recorded; in particular, the C1 placement of Dimension 6 (§09.2) is not yet validated against the real model. Calibration must pass and be recorded in the Closure Record, with full regression passing, before closure.
- Not LIVE: the activation gate remains `false` (§08); flipping it requires closure plus the separate approvals and prerequisites of §08.2 and §08.3.
- Definition of Complete (for CLOSED): AC-0 … AC-53, AC-60 … AC-92 and R-1 … R-3 pass; calibration recorded; full regression passing; activation gate `false` in production.

## Closure Record

*(Empty until closure.)*

---

# 35. Document History

- **v1.0** (initial authoring) — Authored against GCUK as amended by A1 and A2, the DUC detector amendment, the CPI anchor amendment and the closed E.0.2c SPEC, at baseline `629de1b`.
- **v1.0 revision 1** — Product/Architecture review: ADP-U1 … U5 and PD-U2 approved; PD-U1 approved only as a testable-not-live limitation (§08.3 item 8 added). Target-authority blocker addressed:
  - new §15.4: literal request and reference anchors; no use of Dimension 6 by the gate (DUC detector amendment §07); label-based lexical grounding and turn-id conversational grounding; exact-set and unique-target rule; FORGET safeguards and exclusivity; binding statement of what is proven and the residual risks;
  - all mutating operations are single-target;
  - schema: `requestText`, `referenceText`, `referenceKind`, and a nullable `mentionText` for CORRECT carry-forward factors;
  - CAL-8; pressure tests 15a–22b; AC-44 … AC-53 and AC-74 … AC-89; calibration and regression ACs renumbered AC-90 … AC-92;
  - USI `MAX_TOKENS` provisional value 700 → 800.
- **v1.0 revision 1** (consistency corrections) — approved by Product/Architecture:
  - removed the `<detector>` data block from the §14.2 USI interpreter request, so Dimension 6 is trigger-only end-to-end;
  - corrected the stale §14.2 `MAX_TOKENS` from 700 to 800;
  - corrected the stale "detector agreement" wording in this history.
- **v1.0 revision 1** (READY) — Status metadata only: DRAFT → READY FOR IMPLEMENTATION after the final Product/Architecture review (Product Review: APPROVED. Architecture Review: APPROVED.). No normative change.
- **v1.0 revision 1** (canonization) — Status metadata only: the §01 authority sentence changed from "submitted for approval" to "Product/Architecture approved for implementation". No normative change.
- **v1.0 revision 1** (implementation-discovered test-compatibility clarification; Product/Architecture ruling during implementation) — `tests/e02cUserKnowledgeStatic.test.js`, written before USI-001 existed, rejects three usages this SPEC itself requires (`relationDescription` in USI-001 modules; their `userKnowledgeContract.js` dependency; the `userKnowledgeContract.js` script tag and asset). §29 now authorizes a path-specific compatibility allowance in that test for exactly those USI-001 usages, and AC-39 states the intended invariant (E.0.2c suite passes; no E.0.2c production or semantic change) instead of "unmodified". No change to USI behavior, E.0.2c production code or canon, target or persistence authority, precedence, any other Acceptance Criterion, or the testable-not-live boundary.
- **v1.0 revision 1** (calibration-invariant clarification and C1 placement; Product/Architecture ruling after calibration rounds 2–3) — CAL-1 and CAL-3 now measure downstream behavioural identity with stochastic control (new §26.1): 100% of protected outcomes and zero recurring gate-caused differences remain required; differences in non-consumed fields are reported, not counted as regressions, and become protected as soon as they gain a consumer. §09.2: Dimension 6 moves from an instruction after Dimension 5 (with three keys added to the schema line) to a single addendum after the unchanged gate-off instruction block (C1); the schema line, output segments, model calls and parse sites are unchanged. No threshold lowered; no change to the DUC or CPI amendments, gate-off byte identity, target authority, persistence authority, precedence or the testable-not-live boundary.
- **v1.0 revision 1** (implementation checkpoint) — Status metadata only (Product/Architecture approval): READY FOR IMPLEMENTATION → IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — NOT CLOSED — NOT LIVE (header, §01, §34). Real-model calibration CAL-1 … CAL-8, AC-90 and the Closure Record remain required for closure; the activation gate remains `false`; every §08.2/§08.3 prerequisite is unchanged. No normative change.
