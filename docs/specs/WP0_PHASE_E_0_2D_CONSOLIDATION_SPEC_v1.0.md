# WP0 — PHASE E.0.2d — BOUNDED INFERRED-KNOWLEDGE CONSOLIDATION — IMPLEMENTATION SPEC
## v1.0 — CANONICAL / CLOSED (SPECIFICATION) — READY FOR IMPLEMENTATION — NOT IMPLEMENTED — NOT CALIBRATED — NOT LIVE (Product Review: APPROVED. Architecture Review: APPROVED.)

**Repository path:** `docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md`

**Document role:** Implementation SPEC for WP0 Phase E.0.2d — the bounded, AI-assisted, off-turn consolidation interpreter that discovers and formulates **FITME-inferred candidate** User Knowledge from governed observations, with deterministic governance over what it may read, propose and persist. Testable-not-live.

**Canonical contract:** GCUK (`docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md`) as amended by **A1**, **A2** and **A3** (`…_Amendment_A1_v1.0.md`, `…_A2_v1.0.md`, `…_A3_v1.0.md`); the closed **E.0.2c SPEC** (`docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md`); the **E.0.2a SPEC** and its **Activation Amendment**; **MRE-001**. All CANONICAL / CLOSED. USI-001 (`docs/specs/USI_001_SPEC_v1.0.md`) is IMPLEMENTED — NOT CLOSED — NOT LIVE and is cited only as precedent, never as a dependency (§07.4).

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline; **[CANON]** canonical document or explicit Product/Architecture decision; **[DESIGN]** a contract this SPEC proposes for approval; **[INFERENCE]**; **[GAP]**; **[PROVISIONAL]** a numeric value confirmed or revised by calibration (§31).

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 Phase E.0.2d — Bounded Inferred-Knowledge Consolidation** (A2 §10.1; GCUK Ch.14 as amended by A2 §07; E.0.2c SPEC §31).
- Status: **CANONICAL / CLOSED (SPECIFICATION) — READY FOR IMPLEMENTATION** (Product Review: APPROVED. Architecture Review: APPROVED.) — Product/Architecture final approval of the complete design is recorded (§35); canonization commit `0eff66dfbb6aa21342499b7aa4a613625b313135`. The **E.0.2d Work Item** is **NOT IMPLEMENTED**, **NOT CALIBRATED** and **NOT LIVE**: deterministic implementation is pending; no paid or real-model calibration has been run; CAL-D1 … CAL-D7 remain required before the Work Item can be declared CLOSED; activation and live use remain prohibited (§35). GAP-D5 is resolved by the canonical E.0.2c amendment for E.0.2d, which this SPEC consumes (§23.1) and whose implementation it includes (§29). The three decisions recorded at first authoring are resolved by Product/Architecture ruling: **PD-D1** bootstrap confidence `0` = UNASSESSED (§21), **PD-D2** option U-2, reference-only participation of user-stated governed records (§23), **PD-D3** option S-2, V1 observation sources Conversation + Day Logs (§12). Every **[DESIGN]** item is approved. Authoring modified no file under `js/**`, `tests/**`, `functions/**`, and did not modify `index.html`, `sw.js`, `firestore.rules` or any canonical document.
- Repository baseline: `main` @ `880288026cef7646f593cbe82f4697ada84cdbe9` (== `origin/main`) **[VERIFIED]**, which includes the canonical E.0.2c amendment for E.0.2d (canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`). Full deterministic suite at the last verified state: 3631/3631 **[VERIFIED at `df3000c`; `416c002` and `8802880` added one canonical SPEC amendment document only]**. The working tree carries 29 unrelated uncommitted entries (19 line-ending/stat-only, 10 untracked documents); none is a file this SPEC authorizes.
- Authority: Product/Architecture own every **[CANON]** item: the approved E.0.2d direction (hereafter **D-1 … D-7**: 1 open-world inference; 2 CREATE / APPEND_EVIDENCE / SUPERSEDE, append conservative, prefer CREATE when identity is uncertain, supporting and contradicting evidence; 3 no epistemic confidence in E.0.2d; 4 all three temporalities, open-ended TEMPORARY, no expiry ownership, recurring-window time preservation; 5 platform-neutral Observation Port, no duplicate store, references only, A3 governs eligibility; 6 `NOT_AUTHORIZED` for Safety-adjacent sources, Safety-derived knowledge excluded; 7 reuse presented/merge-resolved concepts, no embeddings/synonyms/ontology/merge subsystem), the rulings **PD-D1**, **PD-D2** and **PD-D3**, together with A2 §07 and A3.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** USI-001 lets FITME hold what a user explicitly states. E.0.2d is the first step that lets FITME move from "the user told me X" to "across these observations, FITME has noticed a possible relationship or fact about this user" — for example, that on several days a low-sleep report preceded a hard or poor training session. E.0.2d **discovers and formulates** such a candidate and records the evidence references it rests on. It never decides the candidate is true: it creates only `candidate` records with a technical bootstrap confidence. Longitudinal judgment — confidence, confounds, promotion, decay, staleness and cadence — is E.0.2e; use of established knowledge in reasoning is E.0.2g.

**Scope.**
1. Governed-consumer declaration under A3 (§09).
2. The platform-neutral Observation Port and the observation contract (§10), source authorization and consent (§11), V1 source scope (§12, PD-D3).
3. One consolidation pass: bounded reads, presentation, one bounded model call, deterministic gate, governed writes (§13–§17).
4. CREATE, APPEND_EVIDENCE and SUPERSEDE of FITME-inferred candidates (§16–§17), evidence handling (§18), concept identity (§19), temporality (§20), bootstrap confidence (§21, PD-D1).
5. Explicit-statement protection (A2 §07) (§22), user-stated governed records (§23, PD-D2), Safety boundary (§24).
6. Failure, idempotency, cost, invariants, implementation scope, tests and calibration (§25–§31).

**Non-goals (binding).**
- No production caller, trigger, schedule or cadence (E.0.2e). No live persistence; no platform adapter for the User Knowledge port (E.0.2c §21.4; A2 §11). No hosting decision (A1 §10 item 13).
- No confidence estimation, confound reasoning or logging, confound check, promotion, retraction, archiving, expiry/decay, forgetting or erasing.
- No retrieval into reasoning, no Semantic Context Discovery change, no `ContextComposer`/`ContextRelevancePlanner`/`CapabilityRegistry` change (E.0.2g).
- No creation, promotion, update or supersession of `user_stated` knowledge; no use of `correctInferredKnowledge`.
- No concept merge, unmerge, label addition or label removal.
- No change to Turn Understanding, CPI-001, USI-001, Typed Memory, Safety modules, `eligibilityPolicy.js`, `consentScopeRegistry.js`, `contextComposer.js` or any existing runtime behavior. No `index.html`, `sw.js` or `js/app.js` change; no version bump.
- No protected/native/external source (A3 §06.2); no new `EVIDENCE_REF_KINDS` value; no Habit/Pattern record as an inference input in V1 (§12).
- No embeddings, synonym table, ontology, taxonomy, closed relationship list, situation→inference rule or domain mapping.

---

# 03. Binding Canonical References

- **GCUK** Ch.04 (invariants 1–20; A1 21; A2 22–25; A3 26), Ch.05, Ch.09–Ch.14, Ch.15, Ch.17, Ch.18, Ch.19, Ch.20, Ch.22, Ch.23 as amended **[CANON]**.
- **A1** §04 (Invariant 21, Application-Ready), §05.3 (descriptor), §05.5 (needs have zero authority), §08 (consent vs runtime authorization), §10 items 3–5, 13, 15 **[CANON]**.
- **A2** §04 (invariant 22), §05 (invariant 23, scoped to `user_stated`), §07 (consolidation boundary; "the E.0.2d SPEC must define the deterministic mechanism"), §08 (owned spans; no duplicate authority), §10.1 (sequence), §11, §12 **[CANON]**.
- **A3** §04 (governed consumer/source, shared fields, forbidden mechanisms), §05 (Ch.06 replacement), §06 (authorization state; protected sources fail closed; authorization user experience), §07 (Safety-adjacent boundary for background consumers), §08 (invariant 26), §11 (first non-Capability consumer consequences) **[CANON]**.
- **E.0.2c SPEC** §07, §09–§21, §23–§26, §31 **[CANON]**.
- **E.0.2c Amendment for E.0.2d** (`docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md`, CANONICAL / CLOSED, canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`): the `supportingRefIds` derived index and the bounded `queryRecordsBySupportingRefs` read (§04–§16 there); implemented by this Work Item (D5-2) **[CANON]**.
- **E.0.2a SPEC** §05, §09–§12; **Activation Amendment** §09, §09.1 **[CANON]**.
- **MRE-001** (shared transport envelope; one attempt; fixed timeout) **[CANON]**.

---

# 04. Current-State Repository Evidence **[VERIFIED at `df3000c`]**

1. **User Knowledge store** (`js/coachDecisionSystem/userKnowledgeStore.js`): `configure({port, now, writerAuthority, isLearningConsentGranted, userId, producer, producerVersion})`; operations include `createRecord`, `appendEvidence`, `supersede`, `getRecords`, `getConcepts`, `queryRecordsByConcepts`, `queryRecentConcepts` (API at the end of the module). Under `SERVER`, a FITME-sourced creation is always `candidate`; FITME→FITME supersession is allowed; supersession of `user_stated` by a FITME-sourced successor is forbidden for both writers (E.0.2c §16.2).
2. **Contract** (`userKnowledgeContract.js`): `TEMPORALITIES` (`:24`); `normalizeLabelKey` (`:105`); `deriveConceptIds` (`:150`); validator rule 7 — `DURABLE ⇒ expiresAt === null`, non-null `expiresAt > createdAt` (`:329-330`), so `TEMPORARY` and `RECURRING_WINDOW` with `expiresAt: null` are valid; `materializeContent` (`:511`); `contentKey` (`:528`) compares raw concept ids, values and relation text for equality only; `resolveConceptRoot` (`:583`); `validateFactorProposal` (§19).
3. **Transitions** (`userKnowledgeTransitions.js`): `planCreateRecord` (`:264`) accepts `supporting`, `contradicting` and `confoundsConsidered` at creation; `planAppendEvidence` (`:337`) adds new references to either list, skips duplicate `refId`s (returns `NO_CHANGE` when nothing is new) and checks nothing about meaning; **`planSetConfidence` returns `NO_CHANGE` without a history entry when the new value equals the stored value (`:451`)**; `evidenceClass`, `temporality`, factors, relation text and `source` are immutable in place (E.0.2c §14.3).
4. **Evidence references are irreversible**: never removed, replaced, rewritten or re-pointed (E.0.2c §11.3 rule 1).
5. **USI-001 presentation pattern** (`userStatedIntake.js:28-40`, `:125-160`): `queryRecentConcepts(30)`, `queryRecordsByConcepts` over ≤ 10 concept ids, ≤ 12 records, concepts of presented records added up to 40, block ≤ 6000 chars. USI interpreter model `claude-haiku-4-5-20251001`, `MAX_TOKENS` 800, `TIMEOUT_MS` 8000 (`userStatedIntakeInterpreter.js:23-25`).
6. **Eligibility** (`eligibilityPolicy.js:45-77`) reads only `sensitivityTier`, `consentScope`, the consumer's `capabilityRiskTier` (well-formedness, `:48`) and `sensitiveContextAccessPolicy` (`:66`); honours `grant.expiresAt` (`:55`). Its production requirers are pinned to exactly `trrCapabilityAdapter.js` and `generalReasoningCapability.js` by `tests/wp0PhaseE02aZeroDriftProof.test.js:104-118`.
7. **Conversation turns** (`users/{uid}/coachConversation/{turnId}`, `firestore.rules:104-136`; `js/repositories/conversationRepository.js`): fields `userText` (≤ 4000), `assistantText` (≤ 4000, FITME-authored), `status` (`PENDING`/`COMPLETED`/`SILENCE`), `submittedAt` (client epoch ms), `completedAt`, `createdAt` (server timestamp). No UTC offset is stored.
8. **Day logs** (`users/{uid}/days/{dateKey}`; `js/repositories/dayRepository.js`): `meals[]`, `burned`, `steps`, `water`. A meal is `{name, kcal, protein, carbs, fat, fiber, sugar, sodium, items, time, authority}` (`js/nutrition/mealDraft.js:92-108`); `time` is local wall-clock `"H:MM"`; the day key is a local date from the host clock (A1 §10 item 15). Meals have no stable id (E.0.2c §04 item 11). Workouts are stored only as calories `burned` (E.0.2c §27A). No sleep, perceived-effort or timezone data exists **[GAP]**.
9. **Typed Memory explicit statements** (`js/app.js`): CPI `preference` payload `{key, value, preferenceClass, polarity, target, sourceTurnId}` (`:2446-2452`); `safety_disclosure` `{restrictionText, subjectKey, sourceTurnId}` (`:2541-2545`); `risk_characteristic_fact` `{riskDomain, literalStatementText, sourceTurnId}` (`:2651-2655`); all `source: 'user_stated'`. CPI's literal assertion anchor is routing-only and not persisted (CPI anchor amendment).
10. **No per-turn recognition result is persisted**: Turn Understanding Dimension 6, CPI anchors and Safety-owned spans are not stored; OpenUnderstanding is never persisted (OU-001 §16.1).
11. **Wiring test 37** (`tests/coachDecisionSystemWiring.test.js:596-620`) requires every `js/coachDecisionSystem` module declaring a `callClaude: null` default dependency to be configured in `js/app.js`. The index.html dependency check skips modules not script-tagged (`:650`). **MRE-001 W-1** (`tests/mre001Wiring.test.js`) pins exactly 19 model-output parse sites.
12. **Habit/Pattern records** are FITME inferences built on closed signal types (`habitEngine.js:79`; `patternEngine.js`) and are stored inside the user document.
13. **Evidence-keyed User Knowledge reads** are canonical but not yet implemented: the E.0.2c amendment for E.0.2d (commit `416c002`) adds `supportingRefIds` and `queryRecordsBySupportingRefs`, to be implemented by this Work Item (§29). Typed Memory reads in `js/memory.js` are whole-collection today (E.0.2c §04 item 4); the Observation Port adapter must not reuse them for ownership (§10.3).

---

# 05. Definitions

| Term | Meaning |
|---|---|
| Observation | One governed, source-provided unit of evidence about the user, identified by a stable evidence reference `{kind, ref}` (E.0.2c §11.1), presented as data segments with authorship (§10.2). Never stored by E.0.2d. |
| Observation source | A governed source (A3 §04.2) exposed through the Observation Port. |
| Consolidation pass | One invocation of `Consolidation.runPass(request)`: bounded reads, at most one model call, deterministic gate, governed writes. |
| Proposal | One model-proposed operation (`CREATE`, `APPEND_EVIDENCE` or `SUPERSEDE`). |
| Presented set | The bounded concepts and FITME-sourced records shown to the model in the pass (§14). |
| Structural signature `S(x)` | The sorted multiset of `(resolveConceptRoot(conceptId), role)` over `x.factors` (§16.1). Equality only; never interpreted. |
| User-authored text | A text segment whose authorship is `USER_AUTHORED` (§10.2). |
| Owned observation | An observation whose evidence reference is cited, at pass time, by a currently stored user-stated record: a `user_stated` User Knowledge record in any stored status whose **supporting** evidence contains it (E.0.2c amendment for E.0.2d), or a `user_stated` Typed Memory record in any status whose `sourceTurnId` names it. Determined by §23.1. Safety-owned observations are excluded (§24); observations owned by other user-stated records are presented but are never independent support (§23 U4). |
| User-stated reference | A persisted, active, non-Safety `user_stated` record — a Typed Memory record or a User Knowledge record — presented to the model as a read-only reference that may participate in a proposal by reference only (§23). Never a target, never mutated, never converted. |
| Bootstrap confidence | The constant `0` written at creation, meaning UNASSESSED / NOT YET EPISTEMICALLY EVALUATED (§21). |

---

# 06. Lifecycle Position — [CANON A2 §10.1; DESIGN mechanics]

```
USI-001 (user-stated)       E.0.2d (this SPEC)                 E.0.2e                         E.0.2g
explicit statements  ─┐     observations → candidate records   longitudinal judgment:         retrieval of usable
                      │     (inferred, candidate, bootstrap    confidence, confounds,         knowledge into
                      └──── confidence, evidence refs)  ─────► promotion, decay, cadence ───► reasoning
```

- E.0.2d writes only `candidate` records (E.0.2c §14.2). `isUsableKnowledge` is false for every record it creates (requires `active`, E.0.2c §18), so nothing E.0.2d writes can reach reasoning before E.0.2e assesses and promotes it (§21) and E.0.2g retrieves it.
- Testable-not-live: E.0.2d has no production caller (§29). It is invoked only by tests and the opt-in calibration harness. Its trigger and cadence are E.0.2e's (A2 §10.1; GCUK Ch.22 item 2).

---

# 07. Authority Boundaries — [CANON GCUK Ch.05, A2 §07, A3, E.0.2c §16; DESIGN mechanics]

## 07.1 What the model decides (proposals only)

Which observations suggest a possible relationship or fact; how to formulate it (factors, roles, values, relation text); which presented concepts it involves; evidence class and temporality; whether new evidence supports or contradicts a presented candidate; whether a presented candidate should be appended to, superseded, or left alone in favor of a new candidate; whether a proposal restates something the user explicitly stated; whether it is Safety-adjacent.

## 07.2 What deterministic code decides (authority)

Whether the pass may run at all (consent, configuration, consumer declaration); which sources may be read (A3 eligibility); what is presented; whether every proposal is admissible (§16, §22–§24); the exact persisted fields that are not model-composed (source, status, confidence, safety flag, provenance, expiry); which store operation runs; all ids.

## 07.3 What E.0.2d may never do

Create, update or supersede `user_stated` records; use `correctInferredKnowledge`; promote, retract, archive, forget or erase; set or change confidence after creation; record confounds or confound checks; raise or lower `safetyFlag` after creation; merge, unmerge or relabel concepts; read a source A3 does not authorize; persist observation content; request any user permission (A3 §06.3).

## 07.4 No dependency on USI-001 or Turn Understanding Dimension 6

No rule in this SPEC reads Dimension 6, CPI anchors, USI-001 prompts or USI-001 calibration outcomes. USI-created `user_stated` records participate only as stored records under PD-D2 (§23). Their absence (USI-001 is not live) never invalidates any E.0.2d rule.

---

# 08. Module Boundary and Application-Ready Placement — [CANON A1 §04; DESIGN]

Four new core modules, UMD-shaped like every sibling, **Node-only**: not script-tagged in `index.html`, not listed in `sw.js`, not referenced by `js/app.js` (E.0.2c §04 item 13 precedent).

| Module | Global | Responsibility | Requires |
|---|---|---|---|
| `js/coachDecisionSystem/consolidationContract.js` | `ConsolidationContract` | Closed vocabularies, constants, the consumer declaration (§09), source-descriptor and observation validators (§10), structural signature, literal-overlap function (§22), `isConfidenceAssessed` (§21) | `userKnowledgeContract.js` |
| `js/coachDecisionSystem/consolidationInterpreter.js` | `ConsolidationInterpreter` | Builds the one bounded request, sends it through an injected model transport, parses through MRE-001, returns a closed result | `modelResponseEnvelope.js`, `consolidationContract.js` |
| `js/coachDecisionSystem/consolidationGate.js` | `ConsolidationGate` | Pure deterministic admission of each proposal (§16, §22–§24) | `userKnowledgeContract.js`, `consolidationContract.js` |
| `js/coachDecisionSystem/consolidation.js` | `Consolidation` | `configure()` and `runPass()`: consent, eligibility, reads, presentation, interpretation, gate, execution | `consolidationContract.js`, `consolidationInterpreter.js`, `consolidationGate.js`, `userKnowledgeContract.js`, `eligibilityPolicy.js` |

Binding placement rules:
- No module reads a clock, generates ids or randomness, or references `window` (other than the standard export line), `document`, storage, `navigator`, `fetch`, Firebase/Firestore, `db`, `currentUser`, `js/memory.js`, `js/stateAccess.js`, `js/app.js`, `functions/**`, any repository, any Safety module, `memoryLayer.js`, `contextComposer.js` or `contextRelevancePlanner.js`. Time is injected (`now()`); ids come from the User Knowledge port through the store.
- **Model transport.** E.0.2d is a governed background process whose host is not yet decided (A1 §10 item 13). Its transport is injected by the host composition root as `modelTransport(body) → Promise<rawResponse>` through `Consolidation.configure()`, never as a browser-shell `callClaude` dependency. The interpreter therefore does not declare the `callClaude: null` default shape governed by wiring test 37 (§04 item 11), which applies to shell-configured browser interpreters. A static test asserts that no E.0.2d module is configured by `js/app.js` or script-tagged (AC-D40).
- Eligibility is evaluated by the single A3 policy, `EligibilityPolicy.computeEligibility` (A3 §04.5: no second policy).

---

# 09. Governed-Consumer Declaration — [CANON A3 §04.1, §04.3, §07; DESIGN values]

```js
CONSUMER_DECLARATION = Object.freeze({
  consumerId: 'E02D_CONSOLIDATION',            // opaque; never read by any eligibility decision (A3 §04.5)
  consumerType: 'GOVERNED_BACKGROUND_PROCESS',  // A3 §04.1 type 2
  capabilityRiskTier: 'ELEVATED',               // breadth: open-ended interpretation over observations (E.0.2a §05.2); reserved, never decides access
  sensitiveContextAccessPolicy: 'NOT_AUTHORIZED' // A3 §07.2 — binding until a separate Safety-authority ruling
});
```

- Frozen in `consolidationContract.js`; not configurable. `Consolidation.configure()` validates it against `CAPABILITY_RISK_TIERS` and `SENSITIVE_CONTEXT_ACCESS_POLICIES`; any mismatch → `NOT_CONFIGURED` for every pass (A3 §04.3 fail-closed).
- Never registered in `CapabilityRegistry`; never a `CapabilityDeclaration`; never reachable by `resolveCapability()` or Need routing (A3 §04.1). Has no `contextCeiling` (A3 §04.5).
- Changing `sensitiveContextAccessPolicy` to `AUTHORIZED` requires the Safety-authority ruling of A3 §07.2 and an amendment to this SPEC.

---

# 10. Observation Port — [CANON D-5, A1 §04, §06, A3 §04.2; DESIGN contract]

## 10.1 Source descriptor (registered by the host composition root; one per governed source)

```
ObservationSourceDescriptor {
  sourceId: string (ID_PATTERN),                 // opaque; never read by eligibility
  evidenceRefKind: EVIDENCE_REF_KINDS,           // E.0.2c §09.1; the kind every observation of this source carries
  sensitivityTier: 'STANDARD' | 'SAFETY_ADJACENT',
  consentScope: <registered scope id> | null,    // A3 §04.4
  protectedSource: boolean,                       // A3 §06.2: true ⇒ ineligible for every consumer until the runtime-authorization dimension exists
  description: string (1..400)                    // A1 §05.3: what information, never technology; static; no user data
}
```

`protectedSource` records the A3 §06.2 governance property decided at the source's registration review. A descriptor that fails validation, declares `protectedSource: true`, or whose `evidenceRefKind` is not in `EVIDENCE_REF_KINDS` is ineligible (§11). No consumer×source list exists.

## 10.2 Observation (returned by the port)

```
Observation {
  ref: { kind: EVIDENCE_REF_KINDS, ref: string (EVIDENCE_REF_PATTERN) },   // stable evidence identity
  sourceId: string,
  observedAt: integer | null,          // absolute instant (UTC epoch ms) only when the source records one; never synthesized
  localDate: 'YYYY-MM-DD' | null,      // the source's own local calendar date, when it records one
  localTime: 'HH:MM' | null,           // the source's own local wall-clock time, when it records one
  utcOffsetMinutes: integer | null,    // only when the source records it; null ⇒ local↔absolute mapping unknown
  segments: Segment[]                  // 1..OBS_MAX_SEGMENTS
}

Segment {
  segmentId: string (ID_PATTERN),
  authorship: 'USER_AUTHORED' | 'USER_RECORDED' | 'FITME_AUTHORED' | 'DEVICE_MEASURED' | 'EXTERNAL',
  text: string (1..OBS_TEXT_MAX_CHARS) | null,                                   // free text
  data: Array<{ label: string (1..80), value: string|number|boolean, unit: string (1..16) | null }> | null   // structured readings; labels/units are adapter-authored, open
}
```

- `AUTHORSHIP` is a closed **process** vocabulary (who produced the content), not a content taxonomy; it passes GCUK R4's test (no value is needed because a new user situation appears). A new value requires a canonical decision.
- Exactly one of `text`/`data` is non-null per segment. Data labels and units are adapter-authored, open strings; the core never branches on them.
- Time fields preserve exactly what the source records (D-4). The core never converts local to absolute time or the reverse (A1 §10 item 15).

## 10.3 Port functions

```
ObservationPort.readObservations(userId, {
  sourceIds: string[],            // only sources eligible under §11
  window: { fromEpochMs: integer, toEpochMs: integer },
  limit: integer                  // ≤ OBS_MAX_PER_PASS
}) → Promise<Observation[]>

ObservationPort.readOwnershipClaims(userId, { refs: Array<{kind, ref}> }) →   // refs: 1..OBS_MAX_PER_PASS, distinct
  Promise<Array<{ ref: {kind, ref}, claimant: CLAIMANTS, recordRef: {kind, ref} }>>
```

```
ObservationPort.readUserStatedReferences(userId, { limit: integer }) →   // ≤ PRESENTED_USER_STATED_MAX
  Promise<Array<{
    recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: string },
    claimant: 'CPI_PREFERENCE' | 'USER_STATED_TYPED_MEMORY',
    claimedObservationRefs: Array<{kind, ref}>,     // e.g. the record's sourceTurnId as CONVERSATION_TURN
    segments: Segment[]                              // the record's stored statement as USER_AUTHORED text, or its closed tokens as USER_RECORDED data
  }>>
```

- `CLAIMANTS` = `SAFETY_INTAKE` | `CPI_PREFERENCE` | `USER_STATED_TYPED_MEMORY` — a closed process vocabulary naming which governed Typed Memory intake persisted a record citing the observation. Ownership claims are derived only from **persisted** records (§04 item 10); they carry ids, never content. Their use is fixed by §23.1 and §24.
- **`readOwnershipClaims` is the Typed Memory side of ownership (§23.1).** For the given refs it returns every stored `user_stated` Typed Memory record, **in any status**, whose `payload.sourceTurnId` names one of them: `safety_disclosure` and `risk_characteristic_fact` as `SAFETY_INTAKE`, CPI `preference` as `CPI_PREFERENCE`, any other user-stated type as `USER_STATED_TYPED_MEMORY`. It is a **keyed lookup by `sourceTurnId`**: the adapter must answer it with a bounded, indexed query over the requested turn ids and must never read, scan or load the whole Typed Memory collection (in particular, it must not reuse `js/memory.js`'s whole-collection list, §04 item 13). Its result is complete for the requested refs or the call fails. Deleted Typed Memory records do not claim anything.
- User Knowledge ownership is not a port concern: the core determines it through the canonical `queryRecordsBySupportingRefs` store read (§23.1).
- `readUserStatedReferences` returns only **active, `user_stated`, non-Safety** Typed Memory records (never `safety_disclosure` or `risk_characteristic_fact`), most recent first, through a bounded recency query (never a whole-collection read). It is the Typed Memory side of PD-D2 (§23); it is not an observation source and is unaffected by PD-D3. `user_stated` User Knowledge references are read from the User Knowledge store, not the port (§14.3). Its descriptor is governed by §11 like every other source.
- The window is interpreted by the adapter against the source's own time semantics; a source without absolute time maps the window to local dates as documented by its adapter.
- Bounded: the core validates `limit` and rejects any response exceeding it, any observation from a source not requested, any observation failing §10.2, and any duplicate `ref`. Any such violation fails the whole pass (`OBSERVATION_READ_INVALID`, §25).
- **No duplicate store.** The port reads the source directly each pass; neither the port contract nor the core caches or persists observation content. Only evidence references are persisted (§18).
- Defense in depth: adapters must themselves refuse sources the core did not request (E.0.2c §16.3 precedent).

## 10.4 Adapter guidance (non-normative; recorded for implementers)

| Source | `ref` | Segments | Time |
|---|---|---|---|
| Conversation turn (`COMPLETED` only) | `CONVERSATION_TURN:turnId` | `userText` → `USER_AUTHORED` text. `assistantText` is **not returned** in V1 (§22.3). | `observedAt` = server `createdAt`; `localDate`/`localTime`/`utcOffsetMinutes` = null **[GAP]** |
| Day log | `DAY_LOG:YYYY-MM-DD` | one `USER_RECORDED` data segment per meal (`name`, `kcal`, macros, `time`) and one for the day totals (`burned`, `steps`, `water`) | `localDate` = day key; meal `time` inside its data; `observedAt` = null |
| User-stated references (Typed Memory; PD-D2, not an observation source) | `TYPED_MEMORY_RECORD:memoryId` | manual `fact` text → `USER_AUTHORED`; CPI `preference` closed tokens → `USER_RECORDED` data; Safety types never returned | `sourceTurnId` returned as a claimed `CONVERSATION_TURN` ref |
| Future: health platform, calendar, location, weather | new `EVIDENCE_REF_KINDS` value per source (E.0.2c amendment) | `DEVICE_MEASURED` / `EXTERNAL` data or text | as recorded by the platform, with offset |

Future sources need no core change beyond their `EVIDENCE_REF_KINDS` value; each is `protectedSource: true` and therefore ineligible until A3 §06.2 is satisfied (and A1 §10 item 5 for data leaving FITME).

---

# 11. Source Authorization and Consent — [CANON A3 §06, E.0.2c §17; DESIGN order]

Evaluated in this order at the start of every pass; any failure ends the pass before any later step:

1. **Configuration.** Store, port, transport, `now`, consent predicate, consent-state supplier and consumer declaration valid → otherwise `NOT_CONFIGURED`, zero calls.
2. **Learning consent.** `isLearningConsentGranted()` must return exactly `true` (the same predicate the store receives, E.0.2c §17.2) → otherwise `CONSENT_NOT_GRANTED`, zero port, store or model calls. Learning consent authorizes what E.0.2d persists; it never authorizes a source (A3 §06.1).
3. **Source eligibility.** For each registered descriptor (V1 observation sources and the Typed Memory user-stated reference source alike): valid (§10.1) **and** `protectedSource === false` **and** `EligibilityPolicy.computeEligibility(descriptor, CONSUMER_DECLARATION, consentState).reasoningAccessAuthorized === true`. With `NOT_AUTHORIZED`, every `SAFETY_ADJACENT` source is excluded by the unchanged policy (E.0.2a §11). `consentState` is a genuine, derived input supplied by the host (A3 §06.1); a missing or malformed value excludes every scoped source (`eligibilityPolicy.js:51-55`). No eligible **observation** source → `NO_ELIGIBLE_SOURCE`, no further calls. An ineligible user-stated reference source only means no Typed Memory reference is presented; the pass continues.
4. **No user prompting.** Authorization is evaluated silently each pass from current state; existing valid authorization is reused for its lifetime; an unavailable source is simply skipped; E.0.2d never initiates a permission request (A3 §06.3).

---

# 12. V1 Observation-Source Scope — [CANON PD-D3: option S-2; DESIGN mechanics]

V1 observation sources are exactly:

| Source | `EVIDENCE_REF_KINDS` | Authorship presented | Notes |
|---|---|---|---|
| **Conversation turns** (`COMPLETED`) | `CONVERSATION_TURN` | `userText` as `USER_AUTHORED` text; `assistantText` never returned (§22.3) | Carries sleep, effort, feelings and context, which exist only in conversation today (§04 item 8). Absolute `observedAt`; no local time (GAP-D1). |
| **Day logs** | `DAY_LOG` | meals and day totals as `USER_RECORDED` data | Local dates and meal times. A meal `name` may come from food recognition rather than the user's own words; it is data, never a user statement. |

Both are first-party, `STANDARD`, non-protected sources whose descriptors the host registers; both still pass §11 every pass. Together they let V1 prove genuine cross-observation, multi-source consolidation (for example reported low sleep on days whose logged activity or later reports differ) and recurring-window evidence with real local time.

**Excluded from V1 (binding):**
- **Habit and Pattern records** (`HABIT_RECORD`, `PATTERN_RECORD`) are not observation sources in V1: FITME must not recursively learn from its own previously derived patterns this early (PD-D3 rationale). The gate rejects any proposal citing those kinds (`SOURCE_NOT_IN_SCOPE`).
- Body weight and measurement history, recommendation feedback: no `EVIDENCE_REF_KINDS` value (GAP-D4).
- Every protected/native/external source (A3 §06.2).

**V1 scope is not an architectural limit.** The Observation Port, descriptor, observation contract, eligibility path, gate and executor are source-agnostic (§10, §28). Adding an authorized source later — for example a health platform, calendar, location or weather — requires an adapter, a registered descriptor, an `EVIDENCE_REF_KINDS` value (E.0.2c amendment) and satisfaction of A3 §06.2 (and A1 §10 item 5 where data leaves FITME), plus widening `V1_OBSERVATION_REF_KINDS` in this SPEC. It requires no change to the pass, interpreter contract, gate rules or executor.

User-stated references (Typed Memory and `user_stated` User Knowledge) are governed by PD-D2 (§23), not by this section; they are inputs by reference, never observation sources.

---

# 13. Consolidation Pass — [DESIGN]

`Consolidation.runPass({ passId, window }) → Promise<PassResult>`

1. Validate the request (`passId` ID_PATTERN; window bounded by `WINDOW_MAX_DAYS`) → else `INVALID_REQUEST`.
2. §11 checks.
3. `readObservations` for eligible sources; validate (§10.3).
4. `readOwnershipClaims` for the returned refs (Typed Memory side, §23.1); exclude Safety-owned observations (§24); record every other claim for the independence rule (§23).
5. Apply presentation bounds (§14.1); no remaining observation → `NO_OBSERVATIONS` (success, no model call).
6. User Knowledge ownership for every presented observation ref through `queryRecordsBySupportingRefs` with the covering procedure (§23.1); any non-`OK` read → `OWNERSHIP_READ_FAILED`, no model call. Resolve every owning record's concepts to their current roots (§23.1 owner concept resolution); any incomplete resolution → `OWNERSHIP_READ_FAILED`, no model call. Remove observations owned by a `SAFETY_ADJACENT` owning record (§24); none remaining → `NO_OBSERVATIONS`.
7. Presentation of concepts and FITME-sourced records (§14.2) and of user-stated references (§14.3).
8. One interpreter call (§15). Failure → `INTERPRETER_FAILED`, no writes.
9. Gate every proposal (§16, §22–§24). Rejected proposals are reported with their closed reason code and never executed.
10. Execute admitted proposals in output order (§17). Each operation is one atomic store change set; a store failure of one operation does not roll back earlier ones (§26).
11. Return `PassResult { status, sourcesRead: sourceId[], observationsPresented: integer, proposals: [{index, operation, outcome: ADMITTED_EXECUTED | ADMITTED_FAILED | REJECTED | NO_CHANGE, code, recordIds}] }`. The result carries ids and codes only, never observation or proposal content.

---

# 14. Presentation — [DESIGN; USI-001 §13 precedent]

## 14.1 Observations

- At most `OBS_MAX_PER_PASS` observations, most recent first; each observation is presented whole or not at all (no truncation, so literal checks run against exactly what was presented); total observation block ≤ `OBS_BLOCK_MAX_CHARS`.
- Each observation is rendered as data: `{obsKey, sourceDescription, localDate, localTime, observedAt (ISO UTC or null), utcOffsetMinutes, segments: [{segmentId, authorship, text|data}]}`, where `obsKey` is a pass-local short key (`o1`, `o2`, …) mapped back to the stored `{kind, ref}` deterministically.
- Missing time fields are rendered as `null` with the instruction that unknown local time must not be guessed.

## 14.2 Concepts and records

- Concepts: `queryRecentConcepts({limit: PRESENTED_CONCEPTS_MAX})`, plus concepts referenced by presented records, to `PRESENTED_CONCEPTS_TOTAL_MAX`; each rendered `{conceptId, rootConceptId, labels (≤ 3)}`. `rootConceptId` is computed by `resolveConceptRoot` over concepts fetched with bounded `getConcepts` calls following `mergedInto` (≤ `MAX_MERGE_CHAIN_DEPTH`); an unresolvable chain removes the concept from presentation.
- Records: `queryRecordsByConcepts({conceptIdsAny: ≤ 10 most recent presented concept ids, statuses: ['candidate','active'], limit: PRESENTED_RECORDS_MAX})`, then split: **FITME-sourced** records (`inferred_event`, `inferred_pattern`, `coach_generated`) are presented as possible targets, rendered `{recordId, status, evidenceClass, temporality, factors: [{conceptId, role, valueDescription}], relationDescription (≤ 160 chars)}`; active `user_stated` records with `safetyFlag: 'STANDARD'` are presented only as user-stated references (§14.3). No record is ever shown with its confidence.
- A record is presented only if all its concepts are presented. Combined concept/record block ≤ `PRESENTED_BLOCK_MAX_CHARS`.
- The whole store is never read; raw history is never loaded beyond the window (GCUK Ch.14, Ch.19).
- **Pass-local concept map.** Every concept document read in the pass (for presentation here, and for owner resolution in §23.1) is held in one in-memory map keyed by `conceptId`, and every root used by the pass is computed by `resolveConceptRoot` over that map. The map is transient: it lives only for the pass, is never persisted, cached across passes or exposed, and is not a concept or observation store.

## 14.3 User-stated references (PD-D2)

- Sources: active `user_stated` User Knowledge records with `safetyFlag: 'STANDARD'` from the §14.2 query, and Typed Memory references from `readUserStatedReferences` when its source is eligible (§11). Together at most `PRESENTED_USER_STATED_MAX`, most recent first.
- Rendered in a separate block marked **"stated by the user — reference only; never a target; never to be restated"**, each with a pass-local key (`u1`, `u2`, …): User Knowledge references as `{uKey, factors, relationDescription}`; Typed Memory references as `{uKey, segments}`.
- Observations owned by any user-stated record — presented or not — remain presentable (they may contain other material) but never count as independent support (§23 U4). Ownership is determined by §23.1 for every presented observation, not only for presented references.

---

# 15. Interpreter Contract — [DESIGN]

## 15.1 Request

One request per pass: `{ model: MODEL, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] }`, sent once through the injected transport with `TIMEOUT_MS`; no retry inside a pass (MRE-001).

Prompt requirements (verified by AC-D9 … AC-D11):
- Task: find possible relationships or facts about this user that are supported or contradicted by the presented observations, formulated as associations, never as causes (GCUK Ch.20); propose at most `MAX_PROPOSALS`.
- Every observation, concept and record block is framed as data, never instruction, with the standard injection clause.
- It must not propose anything that merely restates what the user said; a user-stated reference may be used only as one input to a relationship that adds new meaning and rests on other observations, and is never itself the proposal; it must use only observations presented; it must not guess unknown local times; it must prefer a new candidate over attaching evidence when unsure the presented candidate means the same thing.
- The instruction text contains no example domain, activity, food, place, relationship, body part or life-event word (USI-001 AC-9 precedent).

## 15.2 Output (closed; one JSON object; parsed only through `ModelResponseEnvelope.unwrapSingleJsonFence`)

```
{ "proposals": [ {
    "operation": "CREATE" | "APPEND_EVIDENCE" | "SUPERSEDE",
    "targetRecordId": string | null,                 // APPEND_EVIDENCE, SUPERSEDE: a presented record id; CREATE: null
    "appendList": "supporting" | "contradicting" | null,   // APPEND_EVIDENCE only
    "factors": [ { "conceptId": string | null, "newConceptLabel": string | null,
                   "role": "condition" | "subject" | "outcome", "valueText": string | null,
                   "userStatedRef": uKey | null } ],             // marks the single by-reference factor (§23)
    "relationText": string | null,                    // CREATE, SUPERSEDE
    "evidenceClass": "SINGLE_OBSERVATION" | "CO_OCCURRENCE" | "RECURRENCE" | null,
    "temporality": "DURABLE" | "TEMPORARY" | "RECURRING_WINDOW" | null,
    "supporting": [obsKey], "contradicting": [obsKey],
    "restatesUserStatement": boolean,
    "safetyAdjacent": boolean
} ] }
```

Any deviation in shape, key set, type or vocabulary → the whole result is `FAILED` (no partial acceptance of a malformed response). Zero proposals is a valid result.

---

# 16. Deterministic Gate — [CANON D-2; DESIGN rules]

## 16.1 Common checks (every proposal)

- G1 Shape and vocabularies valid; `restatesUserStatement === false` (§22); `safetyAdjacent === false` (§24).
- G2 Every `obsKey` in `supporting`/`contradicting` names a presented observation; no key in both lists; no duplicates.
- G3 Factors: validated by `UserKnowledgeContract.validateFactorProposal` against the presented concept list (E.0.2c §19); every `conceptId` presented; `newConceptLabel` per §19; values per E.0.2c §10.1 bounds.
- G4 Explicit-statement rules E1–E5 (§22), user-stated reference rules U1–U7 (§23) and Safety rules (§24).
- G5 `S(proposal)` computed with presented roots; a new concept contributes its own (new) identity.
- G6 Every cited observation's `ref.kind` is in `V1_OBSERVATION_REF_KINDS` = `CONVERSATION_TURN`, `DAY_LOG` (§12) → else `SOURCE_NOT_IN_SCOPE`. Evidence-class counts (C2, S2) count observation refs only, never user-stated references.

## 16.2 CREATE

- C1 `targetRecordId === null`, `appendList === null`; `relationText`, `evidenceClass`, `temporality` non-null.
- C2 `supporting.length ≥ 1`; evidence-class rule: `SINGLE_OBSERVATION` ⇔ exactly 1 supporting; `RECURRENCE` ⇒ ≥ 2 supporting; `CO_OCCURRENCE` ⇒ ≥ 1 supporting. `EXPLICIT_STATEMENT` is not in the vocabulary.
- C3 Temporality rule: `RECURRING_WINDOW` ⇒ `evidenceClass === 'RECURRENCE'` (§20).
- C4 Not a retry duplicate: the materialized content's `contentKey` must differ from every presented FITME-sourced record's `contentKey` → else `DUPLICATE_OF_PRESENTED` (no write; §26).
- C5 A CREATE whose `S` equals a presented candidate's `S` is **admitted**: same structure may carry a genuinely separate relationship (D-2: prefer CREATE when identity is uncertain).

## 16.3 APPEND_EVIDENCE (conservative)

- A1 `targetRecordId` names a presented record that is FITME-sourced and `candidate` or `active`.
- A2 `appendList` non-null; exactly the list's `obsKey`s are non-empty (the other list empty); `relationText`, `evidenceClass`, `temporality` null; no `newConceptLabel`; every `userStatedRef` null (user-stated references enter only through CREATE or a SUPERSEDE successor, §23 U7).
- A3 **Structural identity:** `S(proposal) === S(target)` using merge-resolved roots.
- A4 **Unique grounding:** the set of presented FITME-sourced records with `S === S(proposal)` contains exactly the target → else `AMBIGUOUS_TARGET` (no write; the evidence is not recorded this pass — the gate never converts a proposal to another operation).
- A5 At least one cited observation ref is not already on the target (else `NO_CHANGE`, §26).
- Proof boundary: A3–A4 prove structural identity and uniqueness only. That the evidence concerns the *same meaning* (for example the same direction of association) is model judgment, measured by CAL-D2 (§31). Because evidence references are irreversible (§04 item 4), any doubt must fail this gate rather than pass it.

## 16.4 SUPERSEDE

- S1 `targetRecordId` names a presented FITME-sourced record with `status === 'candidate'`. An `active` target is never superseded by E.0.2d: changing established knowledge is longitudinal judgment (E.0.2e). Evidence against an `active` record is recorded with `APPEND_EVIDENCE` to `contradicting`.
- S2 Successor validated as CREATE (C1–C3).
- S3 Successor `contentKey` differs from the target's (else `SUPERSEDE_IDENTICAL`).
- S4 Successor shares at least one root concept with the target (else `SUPERSEDE_UNRELATED`; a separate relationship is CREATE).
- S5 At least one supporting observation ref of the successor is not on the target (a change of meaning must rest on new evidence).

---

# 17. Operation Execution and Field Mapping — [DESIGN]

All writes go through `UserKnowledgeStore` configured with `writerAuthority: 'SERVER'`, `producer: 'e02d.consolidation'`, `producerVersion: '1.0.0'`, the pass's `userId`, injected `now`, and the same consent predicate (E.0.2c §16.1).

| Persisted field (CREATE / SUPERSEDE successor) | Value |
|---|---|
| `factors` | from the admitted proposal (presented `conceptId`s and new concepts) |
| `relationDescription` | `relationText` (NFC, trimmed, ≤ 400) — AI-composed prose, permitted for FITME-inferred records (GCUK Ch.09; A2 §05 is scoped to `user_stated`) |
| `valueDescription` | `valueText` or null (always null for the by-reference factor, §23 U2) |
| `evidenceClass`, `temporality` | proposed (gate-checked) |
| `source` | deterministic: `RECURRENCE` → `inferred_pattern`; `SINGLE_OBSERVATION`, `CO_OCCURRENCE` → `inferred_event` (E.0.2c §12.1); never model-chosen |
| `status` | `candidate` (forced by the store) |
| `confidence` | `0` — bootstrap, UNASSESSED (§21); never model-chosen |
| `safetyFlag` | `STANDARD` (§24) |
| `expiresAt` | `null` |
| `evidence.supporting` / `contradicting` | `{kind, ref, observedAt}` per cited observation (§18); for a by-reference factor, the executor adds the referenced record to `supporting` deterministically as `{kind: 'TYPED_MEMORY_RECORD' \| 'USER_KNOWLEDGE_RECORD', ref, observedAt: null}` (§23 U2) |
| `evidence.confoundsConsidered` | `[]` (E.0.2e) |
| `provenance.originTurnId` | `null` (consolidation is not captured from a turn) |

- CREATE → `store.createRecord`. APPEND_EVIDENCE → `store.appendEvidence({recordId, list, refs})`. SUPERSEDE → `store.supersede({predecessorIds: [target], successor})` (FITME→FITME only; E.0.2c §16.2).
- A store outcome other than success (`CONFLICT`, `AUTHORITY`, `CONSENT_NOT_GRANTED`, `FAILED`, validation) marks that proposal `ADMITTED_FAILED`; later proposals still run; the pass status becomes `PARTIAL` (§25).

---

# 18. Evidence Handling — [CANON GCUK Ch.12/Ch.14, E.0.2c §11; DESIGN]

- Only references are persisted: `{kind, ref}` exactly as the observation carried it, plus `observedAt` exactly as provided (null when the source records no absolute instant — never synthesized from a local date, D-4).
- New references are `UNVERIFIED` (contract default). Resolution and availability checks are E.0.2e's (E.0.2c §31 "resolver adapters and cadence").
- Both supporting and contradicting evidence may be recorded (D-2). E.0.2d attaches no interpretation to either list beyond the model's proposal; what the balance of evidence means is E.0.2e's.
- No content is copied into evidence (EVIDENCE_REF_PATTERN, E.0.2c §11.1). Bounds: E.0.2c `MAX_EVIDENCE_REFS_PER_LIST` (64); a proposal that would exceed it is rejected (`LIST_TOO_LONG`).

---

# 19. Concept Identity — [CANON D-7, GCUK Ch.10, E.0.2c §13, §19; DESIGN]

- Existing concepts are reused only by selecting a presented `conceptId` (call-scoped membership, E.0.2c §19). Structural identity always uses merge-resolved roots (§16).
- A new concept is created only through `newConceptLabel` (1..80, NFC). Its label is FITME-composed and is an identity handle, not a claim (E.0.2c §13.1); it is therefore exempt from the literal rules of §22, which govern claim text.
- `NEW_CONCEPT_SHADOWS_PRESENTED`: a `newConceptLabel` whose `normalizeLabelKey` equals that of any label of any presented concept is rejected; the model must reuse the presented concept. (Concepts outside the presented set may still be duplicated by label; no port lookup by label exists — §32 GAP-D2.)
- At most `MAX_NEW_CONCEPTS_PER_PROPOSAL` and `MAX_NEW_CONCEPTS_PER_PASS`; within a pass, equal new labels (by `normalizeLabelKey`) map to one new concept.
- No merge, unmerge, label addition or removal; no embeddings, synonym table or ontology.

---

# 20. Temporality — [CANON D-4; DESIGN]

- All three values may be proposed. `expiresAt` is always `null`: `TEMPORARY` stays open-ended, as the contract permits (§04 item 2; USI-001 precedent); expiry and decay are E.0.2e's.
- `RECURRING_WINDOW` requires `RECURRENCE` (≥ 2 supporting observations). The window itself is expressed in factor values and relation text, in the observations' own local terms; the gate does not compute windows.
- Time preservation: the persisted references point back to the source, which keeps its own local date/time; `observedAt` is stored only when absolute. Correct interpretation of local windows across hosts and timezones depends on the user-timezone model (A1 §10 item 15; E.0.2e/g) and on adapters reporting `utcOffsetMinutes` when known. Conversation turns carry no local time today (§04 item 7), so a recurring window resting only on conversation turns can rely only on what the user's own words say about time; CAL-D5 measures this.
- `temporality` is immutable (E.0.2c §14.3); a later change of temporal character is E.0.2e's (supersession).

---

# 21. Bootstrap Confidence — [CANON PD-D1; DESIGN mechanics]

**Ruling.** Every record E.0.2d creates (CREATE and SUPERSEDE successor) carries `confidence = 0`. The value means **UNASSESSED / NOT YET EPISTEMICALLY EVALUATED**. It does **not** mean a 0% probability, evidence against the candidate, or a judgment that the candidate is false. E.0.2d estimates no confidence and never calls `setConfidence` (AC-D31). E.0.2c is not amended: `confidence` stays a required number in [0, 1] (rule 5).

**Why a marker is needed [VERIFIED].** `0` is also a legal assessed value, and `planSetConfidence` returns `NO_CHANGE` without a history entry when the new value equals the stored value (`userKnowledgeTransitions.js:451`). The number alone therefore cannot say whether a record was assessed. The assessment state is instead defined from history, which E.0.2d cannot write for confidence:

> **`isConfidenceAssessed(r)`** — exported by `consolidationContract.js` (pure; reads no prose) — is `true` iff `r.correctionHistory` contains at least one `CONFIDENCE_CHANGED` entry. For a record created by E.0.2d it is `false` at creation and stays `false` until a governed assessment changes the value.

**Binding invariants (PD-D1).**
1. **No promotion without assessment.** A candidate created by E.0.2d (`provenance.producer === 'e02d.consolidation'`) may not be promoted to `active` unless `isConfidenceAssessed(r) === true`. E.0.2d never promotes (§07.3); the invariant binds E.0.2e, whose promotion gate must enforce it in addition to E.0.2c's promotion conditions.
2. **An assessment that yields exactly `0` is, by construction, indistinguishable from the bootstrap value and leaves the record unpromotable.** This is intended: a candidate assessed at 0 is not established knowledge. E.0.2e may retract it.
3. **No epistemic use of an unassessed value.** No consumer — E.0.2e's own longitudinal model, E.0.2g retrieval or ranking, reasoning, Expression or any UI — may read, rank by, threshold on, display or reason from the `confidence` of a record for which `isConfidenceAssessed(r)` is `false`. Such a record has no confidence; it does not have a low one.
4. **E.0.2g.** E.0.2g selects User Knowledge only through `isUsableKnowledge` (E.0.2c §18; requires `active`), so under invariant 1 every FITME-inferred record it can retrieve is assessed. Any E.0.2g confidence ranking (GCUK Ch.14) must additionally apply invariant 3, so no bootstrap `0` can be treated as an assessed value even if a future path exposed a candidate.
5. Invariants 1–4 are recorded here as binding on every future consumer, in the manner of E.0.2c §18. The E.0.2e and E.0.2g SPECs must restate and enforce them and cite this section.

**Why `0` rather than another constant.** If a consumer violated invariant 3, `0` would rank the record last and state no positive belief (fail-safe); `0.5` (Typed Memory / C4 default) and `1` (USI-001 `user_stated` precedent) would both read as judgments.

---

# 22. Explicit-Statement Protection — A2 §07 — [CANON A2 §07, invariant 22; DESIGN mechanism]

A2 §07 requires that consolidation never create, promote or update an inferred record that represents knowledge the user explicitly stated, and that this SPEC define the deterministic mechanism. E.0.2d never promotes (§07.3). For CREATE, APPEND_EVIDENCE and SUPERSEDE, the mechanism is:

## 22.1 Deterministic rules (enforced by the gate)

- **E1 — Epistemic type.** Every record E.0.2d writes is FITME-sourced, `candidate`, never `EXPLICIT_STATEMENT` (contract rule 6), and never supersedes or updates a `user_stated` record (targets must be FITME-sourced; E.0.2c §16.2).
- **E2 — No literal restatement.** Let `U` be the user-authored text of every cited observation (both lists), and `T` the proposal's persisted claim text (`relationText` and every `valueText`). With `N(s)` = NFC → lower-case → collapse whitespace → trim (`normalizeLabelKey`), the proposal is rejected (`LITERAL_RESTATEMENT`) when any `N(t)` for `t ∈ T` shares a contiguous substring of length ≥ `LITERAL_OVERLAP_MAX_CHARS` with any `N(u)`, `u ∈ U`, or when any `N(u)` is wholly contained in any `N(t)`. This is computed over the whole cited user text, independent of any span the model chooses.
- **E3 — Authorship.** Only `USER_AUTHORED` and `USER_RECORDED` segments of eligible sources are presented as user material; `FITME_AUTHORED` segments are never presented in V1 (§22.3) and an observation whose only segments are FITME-authored is never presented.
- **E4 — Declared restatement.** `restatesUserStatement` must be exactly `false`; `true`, missing or malformed rejects the proposal (`DECLARED_RESTATEMENT`). This is a model judgment, enforced fail-closed.
- **E5 — Owned observations and user-stated records.** Safety-owned observations are never presented (§24). Observations owned by user-stated records never count as independent support (U4), structures that mirror a user-stated record are rejected (U5), and literal disjointness extends to user-stated reference text (U6) (§23).

## 22.2 Proof boundary (binding)

E1, E3 and E5 are structural guarantees. E2 proves only that persisted claim text does not copy the user's literal words beyond the bound. E4 is a model declaration. **Deterministic code cannot prove that a proposal does not paraphrase, translate, summarize or otherwise semantically restate something the user explicitly stated.** That residual is established only by real-model calibration with human review (CAL-D1, §31), exactly as A2 §08.3 records for CPI anchor extent. It is never claimed as a deterministic guarantee.

Single-observation candidates are permitted (E.0.2c `SINGLE_OBSERVATION`; pressure test A); canon does not require multiple observations. If CAL-D1 shows unacceptable restatement for candidates resting on a single user-authored observation, closure review may restrict them (for example, requiring ≥ 2 supporting observations whenever any is user-authored text). That restriction is a calibration-contingent option, not part of this design.

## 22.3 FITME's own words

`assistantText` is FITME-authored and is not returned by the V1 conversation adapter (§10.4). E.0.2d therefore can neither cite nor be prompted with FITME's own prior statements, and cannot learn from them. A later version that presents FITME-authored context must keep E3 (never citable, never user material) and must be calibrated for influence.

---

# 23. User-Stated Governed Records (Typed Memory, CPI-001, USI-001) — [CANON PD-D2: option U-2; DESIGN rules]

**Ruling.** Governed user-stated information may participate **by reference, as one input** toward a genuinely higher-order inference. It is never rewritten or paraphrased as FITME-inferred knowledge; the inference must add genuinely new relational or derived meaning; it must have independent supporting evidence beyond the user-stated fact itself; user-stated records remain authoritative as user-stated records and are never mutated, superseded or converted by E.0.2d. Safety-owned and Safety-adjacent information remains excluded (§24). The pattern is A2 §08.2 rule 2's, already canonical for USI-001's use of a CPI assertion.

**Example.** A user-stated record "I usually sleep around five hours" must not, by itself, produce a FITME-inferred record "this user tends to sleep around five hours" (rejected by U3, U5 and E2/E4). If independent observations — conversation reports or day logs across several days — show poorer training-related outcomes after short-sleep periods, E.0.2d may propose an associative candidate such as "poorer training outcomes have followed short-sleep periods", in which the user-stated sleep fact is one factor by reference and the outcome factor rests on the independent observations.

## 23.1 Ownership determination — [CANON D5-A, E.0.2c amendment for E.0.2d; DESIGN procedure]

**Semantics (aligned exactly with the canonical E.0.2c amendment).** At pass time, a presented observation with evidence reference `R` (`refId(R) = kind:ref`) is **owned** when:
- **User Knowledge:** a currently stored record with `source: 'user_stated'`, in any status it can hold (`active`, `superseded`, `rejected`, `archived`; `candidate` is unreachable for `user_stated`, E.0.2c §14.2), has `refId(R)` in its `supportingRefIds`; or
- **Typed Memory:** a stored `user_stated` Typed Memory record, in any status, names `R` as its `sourceTurnId` (`CPI_PREFERENCE`, `USER_STATED_TYPED_MEMORY` claims; `SAFETY_INTAKE` claims exclude the observation entirely, §24).

Not owned: references cited only in a record's `contradicting` evidence; references cited only by FITME-inferred records; references whose only citing records were forgotten or erased. No tombstone, shadow copy, cache or retained index is introduced (E.0.2c §15.5 guarantee 3; amendment §09).

**User Knowledge procedure (deterministic; no model).** Let `Q` be the distinct `refId`s of the presented observations (`|Q| ≤ OBS_MAX_PER_PASS`), sorted. Split `Q` into consecutive chunks of at most `MAX_QUERY_REF_IDS` (10). For each chunk `C`:

1. `pending ← C`.
2. Call `store.queryRecordsBySupportingRefs({ refIdsAny: pending, sources: ['user_stated'], statuses: ['active', 'superseded', 'rejected', 'archived'], limit: MAX_QUERY_LIMIT })` (50).
3. If `status !== 'OK'` → the pass ends `OWNERSHIP_READ_FAILED`. `CONSENT_NOT_GRANTED`, `REJECTED`, `FAILED` and `NOT_CONFIGURED` are never read as "not owned".
4. For every returned record `r`: mark `pending ∩ r.supportingRefIds` owned and retain `r` as an **owning record** (deduplicated by `recordId`).
5. If fewer than `limit` records were returned, the read was complete for `pending`: every ref still in `pending` and not marked is **not owned**; the chunk is done.
6. Otherwise (a full page), `pending ← pending − owned`. If `pending` is empty, the chunk is done; else go to step 2.

**Termination and bound.** The store returns only records that cite at least one requested ref (amendment §08 item 5), so a full page marks at least one ref in `pending` owned and `pending` strictly shrinks. Each chunk therefore takes at most `|C|` reads, and the pass at most `|Q|` reads (at least `⌈|Q|/10⌉`, typically that). At most `|Q| × MAX_QUERY_LIMIT` owning records are held in memory for the pass. No list-all or scan is used; apart from these reads, the only User Knowledge reads in ownership determination are the bounded concept reads of owner concept resolution below, and the cost of both is independent of the size of the user's store.

**Typed Memory procedure.** `readOwnershipClaims` (§10.3) for the same observation refs, one keyed lookup by `sourceTurnId`; any failure or invalid result → `OWNERSHIP_READ_FAILED`.

**Owner concept resolution (deterministic; no model; before the model call).** U5 compares fully merge-resolved structures, so every concept an owning record cites must be resolved to its current root, using only the canonical primitives `store.getConcepts`, `resolveConceptRoot` and `MAX_MERGE_CHAIN_DEPTH` (E.0.2c §13.4, §20.2):

1. Let `K` be the distinct `conceptIds` of all owning records that are not already in the pass-local concept map (§14.2).
2. Read `K` with `store.getConcepts`, at most `MAX_READ_BATCH` (50) ids per call, adding every returned concept to the map.
3. For every concept in the map whose `mergedInto` names a concept not yet in the map, read those targets the same way. Repeat for at most `MAX_MERGE_CHAIN_DEPTH` (16) follow-up levels. A concept already in the map is never read again.
4. Compute `resolveConceptRoot(id, map)` for every concept of every owning record.
5. Fail closed — the pass ends `OWNERSHIP_READ_FAILED` before any model call — when: any `getConcepts` status is not `OK` (including `CONSENT_NOT_GRANTED`, `REJECTED`/`STORED_DOCUMENT_INVALID`, `READ_BOUND_EXCEEDED`, `FAILED`, `NOT_CONFIGURED`); a requested concept is absent from the result; or `resolveConceptRoot` returns `UNKNOWN_CONCEPT` or `MERGE_CHAIN_INVALID` (including a chain longer than `MAX_MERGE_CHAIN_DEPTH`). An unresolved identity is never read as "different structure".

*Why resolution always succeeds on valid data [VERIFIED].* Every factor concept of every stored record, in any status, exists: a concept cannot be forgotten while any record of any status references it or while any concept is merged into it (E.0.2c §13.7, §20.2, AC-47), and writes require referenced concepts to exist (§13.7). Superseded, rejected and archived owners are therefore resolvable exactly like active ones; a failure indicates invalid data and fails closed.

*Bound — derived from existing constants; no new constant.* Owning records ≤ `|Q| × MAX_QUERY_LIMIT` (§23.1 procedure: ≤ `|Q|` reads of ≤ 50 records), with `|Q| ≤ OBS_MAX_PER_PASS`. Each record has ≤ `MAX_FACTORS` (8) distinct concept ids (E.0.2c §09.2, §10.4), so `|K| ≤ MAX_FACTORS × MAX_QUERY_LIMIT × |Q|`. Each level reads only ids new to the map, at most one per unresolved chain, so each level needs ≤ `⌈|K| / MAX_READ_BATCH⌉` reads and there are ≤ `1 + MAX_MERGE_CHAIN_DEPTH` levels: concept reads ≤ `(1 + MAX_MERGE_CHAIN_DEPTH) × ⌈|K| / MAX_READ_BATCH⌉`. Every term is a canonical E.0.2c limit or this SPEC's `OBS_MAX_PER_PASS`, so the cost is finite and independent of the size of the user's store. The bound cannot be exceeded by valid data: a longer chain is `MERGE_CHAIN_INVALID`, and an over-sized port result is rejected by the store, both of which fail closed. In practice an observation is owned by few records whose concepts are mostly already presented, so resolution takes about one or two reads. No additional numeric cap is required for correctness; any tighter operational cap would be a separate Product/Architecture decision and is not part of this SPEC.

**Use of owning records.** Owning records are used only by deterministic checks (U4, U5, U6) and by the Safety exclusion of §24 item 2; they are never presented to the model unless they also qualify as user-stated references under §14.3. An observation owned by an owning record with `safetyFlag: 'SAFETY_ADJACENT'` is removed from presentation before the model call (§24); if no observation remains, the pass ends `NO_OBSERVATIONS`.

**Retention note (recorded, not decided here).** Because forgotten records no longer own anything, an observation whose only owning record was forgotten becomes ordinary material, protected like a never-captured statement (E2, E4, CAL-D1). Whether forgotten information may later be independently re-inferred is the deferred retention/privacy policy (E.0.2c §11.5); E.0.2d neither decides it nor retains anything to anticipate it.

## 23.2 Gate rules

**Deterministic rules (gate).** A *reference factor* is a factor whose `userStatedRef` names a presented user-stated reference (§14.3). *Owning records* are the User Knowledge records retained by §23.1.

- **U1 — At most one reference.** At most one factor per proposal has a non-null `userStatedRef`, and each named `uKey` must be presented → else `USER_STATED_REFERENCE_INVALID`.
- **U2 — Reference form.** The reference factor carries `valueText: null`. Its concept is either a presented concept — for a User Knowledge reference, one of that record's own root concepts — or a new concept whose `newConceptLabel` is a literal substring (under `normalizeLabelKey`) of the reference's rendered text. The executor adds the referenced record to `supporting` as `TYPED_MEMORY_RECORD` or `USER_KNOWLEDGE_RECORD` evidence; the model never cites it directly. → else `USER_STATED_REFERENCE_INVALID`.
- **U3 — New relational meaning (structural proxy).** A proposal with a reference factor has at least two factors and at least one factor whose root concept is not a concept of the referenced User Knowledge record (for a Typed Memory reference: at least one factor other than the reference factor). → else `NO_NEW_MEANING`.
- **U4 — Independent support.** `supporting` contains at least one observation that is **not owned** under §23.1 (by any stored user-stated User Knowledge record, presented or not, or by any user-stated Typed Memory record). → else `NO_INDEPENDENT_SUPPORT`. This applies to **every** CREATE and SUPERSEDE successor, with or without a reference factor: no FITME-inferred record may rest only on observations that user-stated knowledge already owns. Ownership is evaluated only from `OK` reads (§23.1); a pass whose ownership could not be established has already ended.
- **U5 — No mirror of user-stated structure.** For every presented user-stated User Knowledge reference **and every owning record** `r`, a CREATE or SUPERSEDE successor with `S(proposal) === S(r)` is rejected (`MIRRORS_USER_STATED`), whether or not it uses a reference factor: same concepts in the same roles as something the user stated is a structural restatement. Both signatures are **fully merge-resolved** from the pass-local concept map: the proposal's existing concepts were resolved at presentation (§14.2), every owning record's concepts by owner concept resolution (§23.1), and a new concept proposed in this pass is its own root and can equal no stored root. The check applies identically to owners in every stored status (`active`, `superseded`, `rejected`, `archived`) and is fully deterministic for canonical structural identity: a pass in which any owner could not be resolved has already ended `OWNERSHIP_READ_FAILED`.
- **U6 — Literal disjointness from user-stated text.** E2 (§22) is applied with `U` extended to (a) the rendered text of every presented user-stated reference that the proposal names or whose owned observations it cites, and (b) the `relationDescription` and every non-null `valueDescription` of **every owning record** of an observation the proposal cites. These are literal user text (A2 invariant 23); no additional read is made. U6 is a normalized-text comparison only: it reads no concept id or label and has **no concept-merge dependency**; no concept resolution is part of U6.
- **U7 — References never mutated or targeted.** User-stated records are never presented as targets (A1, S1 require FITME-sourced targets), never appended to, superseded, promoted, retracted or relabeled, and user-stated references may enter evidence only through U2 in a CREATE or SUPERSEDE successor.

**Proof boundary.** U1–U7 prove form, citation, structural novelty, independence of support and literal disjointness. They do **not** prove that the resulting relationship adds genuinely new meaning rather than a paraphrase of the user-stated fact; that residual is measured by CAL-D1 and CAL-D3 (§31).

**Repository facts used.** CPI `preference` records carry closed tokens and `sourceTurnId` but not the literal assertion; manual `fact` records carry free text; USI-001 `user_stated` records carry literal `relationDescription`, concepts and `CONVERSATION_TURN` evidence (§04 item 9). `TYPED_MEMORY_RECORD` and `USER_KNOWLEDGE_RECORD` evidence kinds exist (E.0.2c §09.1). Typed Memory is reached only through the Observation Port (A1 §04), never through `js/memory.js`. No `TYPED_MEMORY_RECORD` content is persisted.

---

# 24. Safety Boundary — [CANON D-6, A3 §07, E.0.2c §24; DESIGN]

1. `sensitiveContextAccessPolicy: 'NOT_AUTHORIZED'` (§09): every `SAFETY_ADJACENT` source is ineligible.
2. Observations claimed by `SAFETY_INTAKE` (persisted `safety_disclosure` / `risk_characteristic_fact` records citing their `sourceTurnId`, in any status, §04 item 9) are excluded before presentation; only the claim (ids) is read, never Safety content. Observations owned by a `user_stated` User Knowledge record with `safetyFlag: 'SAFETY_ADJACENT'` (§23.1) are likewise excluded before the model call; that record's text is never presented.
3. `safetyAdjacent` must be exactly `false`; `true`, missing or malformed rejects the proposal (`SAFETY_ADJACENT_PROPOSAL`). Safety-adjacent material that reached a turn without a persisted Safety record (for example a vetoed or unconsented intake) is caught only by this model judgment; CAL-D4 measures it.
4. Every record E.0.2d creates has `safetyFlag: 'STANDARD'`; E.0.2d never creates a `SAFETY_ADJACENT` record because it never admits Safety-adjacent proposals.
5. No Safety module is read, modified or given User Knowledge (E.0.2c §24.3–§24.4).

---

# 25. Failure and Fail-Closed Behaviour — [CANON GCUK Ch.17; DESIGN]

| Condition | Pass status | Writes | Model call |
|---|---|---|---|
| Invalid configuration / consumer declaration | `NOT_CONFIGURED` | none | none |
| Learning consent not exactly `true` | `CONSENT_NOT_GRANTED` | none | none |
| No eligible source | `NO_ELIGIBLE_SOURCE` | none | none |
| Port throws, returns invalid/oversized/unrequested data | `OBSERVATION_READ_INVALID` | none | none |
| Typed Memory ownership-claim read fails or is invalid (unknown Safety or user-stated ownership) | `OWNERSHIP_READ_FAILED` | none | none |
| Any `queryRecordsBySupportingRefs` read returns a status other than `OK` (`CONSENT_NOT_GRANTED`, `REJECTED`, `FAILED`, `NOT_CONFIGURED`) — never read as "not owned" | `OWNERSHIP_READ_FAILED` | none | none |
| Owner concept resolution incomplete: a `getConcepts` status other than `OK`, a missing concept, `UNKNOWN_CONCEPT` or `MERGE_CHAIN_INVALID` — never read as "different structure" | `OWNERSHIP_READ_FAILED` | none | none |
| Nothing to present | `NO_OBSERVATIONS` | none | none |
| Store read for presentation fails | `STORE_READ_FAILED` | none | none |
| Transport error, timeout, `max_tokens` stop, envelope/parse/shape failure | `INTERPRETER_FAILED` | none | one |
| Zero proposals, or all rejected | `COMPLETED` | none | one |
| Some admitted operations fail at the store | `PARTIAL` | the successful ones | one |
| All admitted operations succeed | `COMPLETED` | all | one |

`runPass` never throws. No failure produces a permissive fallback, a fabricated observation, evidence, concept or record, or a user prompt.

---

# 26. Idempotency, Retry and Concurrency — [DESIGN]

- A pass is safe to re-run over the same window. Retried CREATE of identical content is rejected by C4 (`DUPLICATE_OF_PRESENTED`); retried APPEND of already-attached references is `NO_CHANGE` (store dedup, §04 item 3); retried SUPERSEDE fails S1 because the predecessor is no longer `candidate`.
- Each operation is one atomic store change set with optimistic version checks (E.0.2c §14.1); a concurrent modification yields `CONFLICT` for that operation only, and a later pass may retry.
- Non-identical re-formulations of the same relationship by a later pass may create a duplicate candidate (C5). This is the accepted cost of conservative identity (D-2); reconciliation of duplicates is E.0.2e's longitudinal judgment.
- `passId` is recorded only in the returned `PassResult` (records have no field for it; E.0.2c §10.2 rule 1).

---

# 27. Model-Call and Cost Effect — [DESIGN]

- At most one model call per pass; zero when any §11/§13 precondition stops the pass. No call per observation, concept or proposal (E.0.2c §26; A-G).
- No production caller exists (§29): production model-call counts and pinned request-body hashes are unchanged (AC-D44).
- Constants (all **[PROVISIONAL]**, §31): `MODEL` = the existing bounded-interpreter model (`claude-haiku-4-5-20251001`), `MAX_TOKENS` 1600, `TIMEOUT_MS` 20000, `MAX_PROPOSALS` 6, `WINDOW_MAX_DAYS` 14, `OBS_MAX_PER_PASS` 40, `OBS_MAX_SEGMENTS` 12, `OBS_TEXT_MAX_CHARS` 2000, `OBS_BLOCK_MAX_CHARS` 16000, `PRESENTED_CONCEPTS_MAX` 30, `PRESENTED_CONCEPTS_TOTAL_MAX` 40, `PRESENTED_RECORDS_MAX` 12, `PRESENTED_BLOCK_MAX_CHARS` 6000, `PRESENTED_USER_STATED_MAX` 8, `MAX_NEW_CONCEPTS_PER_PROPOSAL` 4, `MAX_NEW_CONCEPTS_PER_PASS` 8, `LITERAL_OVERLAP_MAX_CHARS` 24.

---

# 28. Open-World, Platform-Neutral and Non-Causal Invariants — [CANON GCUK Ch.04, Ch.20, A1 §04, A3 §08]

1. No closed list of foods, activities, situations, relationships, body states or life events exists anywhere in E.0.2d; the only closed vocabularies are process/governance ones (`OPERATIONS`, `AUTHORSHIP`, `CLAIMANTS`, E.0.2c's vocabularies), each passing GCUK R4's test.
2. No situation→inference rule, domain mapping, synonym table, embedding or ontology.
3. The core knows no platform, vendor or SDK; sources are adapters beneath the port (A1 §06.2).
4. Relation text is formulated as association; nothing persisted asserts causation, truth or verification (GCUK Ch.20; E.0.2c §23). The Product example "low sleep negatively affects training performance" is persisted, if at all, as an associative candidate (for example "harder or poorer training sessions have followed several low-sleep nights"), never as a causal claim.
5. One authorization architecture (A3 invariant 26): E.0.2d is evaluated by the shared eligibility policy and has no eligibility mechanism of its own.
6. The V1 source set (§12) is a configuration of the source-agnostic core, not an architectural limit; adding an authorized source changes no core rule (§12).
7. AI semantic judgment never grants authority: every model output is a proposal that the deterministic gate admits or rejects; the model cannot select a source, widen presentation, choose persisted authority fields, or bypass a rule.

---

# 29. Exact Implementation Scope — [DESIGN]

**New files.** `js/coachDecisionSystem/consolidationContract.js`, `consolidationInterpreter.js`, `consolidationGate.js`, `consolidation.js`; `tests/e02dConsolidationContract.test.js`, `tests/e02dConsolidationInterpreter.test.js`, `tests/e02dConsolidationGate.test.js`, `tests/e02dConsolidationPass.test.js`, `tests/e02dConsolidationStatic.test.js`; `tests/fixtures/consolidationObservationPortTestDouble.js`; `tests/evals/e02dConsolidationCalibration.eval.js` (opt-in; never part of `node --test tests/*.test.js`).

**Modified production files — exactly the E.0.2c amendment for E.0.2d, §13 there (D5-2), and nothing else.**
- `js/coachDecisionSystem/userKnowledgeContract.js` — `RECORD_KEYS` gains `supportingRefIds`; `LIMITS.MAX_QUERY_REF_IDS = 10`; `deriveSupportingRefIds` exported; validator rule 13 (`SUPPORTING_INDEX_MISMATCH`); draft rejection of `supportingRefIds` (`DERIVED_FIELD_SUPPLIED`).
- `js/coachDecisionSystem/userKnowledgeTransitions.js` — `buildRecord` derives the field; `planAppendEvidence` recomputes it for `supporting`.
- `js/coachDecisionSystem/userKnowledgeStore.js` — `PORT_FUNCTIONS` gains `queryRecordsBySupportingRefs`; the consent-gated, validated store read; API export.

No other production file changes. No `index.html`, `sw.js`, `js/app.js`, `functions/**` or `firestore.rules` change; no version bump; `SCHEMA_VERSION` stays `1` (amendment D5-1).

**Modified test fixtures (amendment §11, §13).** `tests/fixtures/userKnowledgeInMemoryPort.js` (the query; local `L` gains `MAX_QUERY_REF_IDS`); `tests/fixtures/userKnowledgePortConformance.js` (new conformance cases; AC-32 operation list via `Store.PORT_FUNCTIONS`).

**New test file from the amendment.** `tests/e02cSupportingRefIndex.test.js` (amendment AC-SR1 … AC-SR8).

**Authorized modifications to existing tests (only these four).**
- `tests/mre001Wiring.test.js`: add `consolidationInterpreter.js: 1` to `SITE_FILES` and the W-1 total `19 → 20`.
- `tests/wp0PhaseE02aZeroDriftProof.test.js`: add `consolidation.js` to `EXPECTED_REQUIRERS` (A3 §11).
- `tests/e02cUserKnowledgeStore.test.js:422`: the asserted record key list gains `supportingRefIds` (amendment §13).
- `tests/usi001StoreReads.test.js:107-112` (AC-39): the asserted store-operation set and `PORT_FUNCTIONS` list gain `queryRecordsBySupportingRefs` (amendment §13).

Every other existing test passes unchanged.

**Implementation order within this Work Item [DESIGN].** The E.0.2c amendment changes are implemented and verified first (AC-SR1 … AC-SR8 and the full regression green), then the E.0.2d modules. Implementation begins only after this SPEC passes final Product/Architecture review (amendment D5-2).

---

# 30. Test Plan and Acceptance Criteria

All deterministic tests stub the transport; none calls a model. The calibration harness (§31) is opt-in and paid.

**Configuration, consent, eligibility**
- AC-D1: invalid configuration or consumer declaration → `NOT_CONFIGURED`, zero calls.
- AC-D2: consent predicate not exactly `true` → `CONSENT_NOT_GRANTED`, zero port/store/model calls.
- AC-D3: `protectedSource: true`, invalid descriptor, `SAFETY_ADJACENT` source, or scoped source without a valid grant (including expired) → excluded; with none eligible → `NO_ELIGIBLE_SOURCE`.
- AC-D4: eligibility is computed only by `EligibilityPolicy.computeEligibility`; no consumer-id or source-id branch exists (static).
- AC-D5: no code path requests, prompts or initiates any authorization (static + behavior).

**Observation Port**
- AC-D6: invalid, oversized, duplicate or unrequested observations → `OBSERVATION_READ_INVALID`, no model call.
- AC-D7: no observation content is stored by any module; persisted evidence contains only `{kind, ref, observedAt}`; `observedAt` is never synthesized.
- AC-D8: Safety-claimed observations (any status) and observations owned by a `SAFETY_ADJACENT` user-stated record are never presented; any Typed Memory or User Knowledge ownership-read failure ends the pass `OWNERSHIP_READ_FAILED` with no model call.

**Interpreter**
- AC-D9: exactly one request per pass, through the injected transport, MRE envelope, no retry.
- AC-D10: the instruction contains no example domain, activity, food, place, relationship, body-part or life-event word.
- AC-D11: data blocks are framed as data with the injection clause; malformed output → `INTERPRETER_FAILED`, no writes.

**Gate**
- AC-D12 … AC-D16: CREATE rules C1–C5, including evidence-class counts and `RECURRING_WINDOW ⇒ RECURRENCE`.
- AC-D17 … AC-D21: APPEND rules A1–A5, including root-resolved structural identity after a merge, `AMBIGUOUS_TARGET` with two same-signature candidates, rejection of `user_stated` targets, and same-signature/opposite-meaning fixtures documented as calibration residual.
- AC-D22 … AC-D26: SUPERSEDE rules S1–S5, including refusal of `active` targets.
- AC-D27: E2 literal restatement at, below and above the bound, across both evidence lists and with Unicode normalization.
- AC-D28: E4 and `safetyAdjacent` fail closed on `true`, missing and malformed values.
- AC-D29: concept rules of §19 (presented membership, shadowing, per-proposal and per-pass caps, in-pass label dedup).
- AC-D35: `SOURCE_NOT_IN_SCOPE` for any cited `HABIT_RECORD`, `PATTERN_RECORD` or other kind outside `V1_OBSERVATION_REF_KINDS`; habit/pattern records are never requested or presented.
- AC-D36: user-stated reference presentation (§14.3): only active, `user_stated`, `STANDARD`, non-Safety records; Safety Typed Memory types never requested or presented; ineligible reference source → no references, pass continues.
- AC-D37: U1–U3 (single reference, reference form, executor-added reference evidence, structural novelty), including the PD-D2 example fixture ("I usually sleep around five hours" alone → rejected; with independent short-sleep/training observations → admissible).
- AC-D38: U4 independence for every CREATE/SUPERSEDE, with and without a reference factor, with owners **outside the presented set**: `user_stated` User Knowledge records in each of `active`, `superseded`, `rejected` and `archived` owning through `supporting`; Typed Memory `user_stated` records in any status owning through `sourceTurnId`. Not owned: references cited only in `contradicting`, references cited only by FITME-inferred records, and references whose owners were forgotten or erased.
- AC-D39: U5 `MIRRORS_USER_STATED` with fully merge-resolved signatures, against presented references and against owning records that were **not** presented, covering: an owner concept merged one level into a presented concept; a multi-level merge chain; the reverse direction (a presented concept merged into the owner's concept, so both share the current root); the current state after an unmerge (no longer equal → not rejected); owners in each of `active`, `superseded`, `rejected` and `archived`; a proposed new concept never matching a stored root. Structurally different signatures — different roles, a different factor count, or a different root — are never rejected by U5. U7 (references never targeted, appended, superseded or mutated).
- AC-D52: owner concept resolution (§23.1): only concept ids absent from the pass-local map are read, and no concept is read twice; reads use `getConcepts` in batches ≤ 50; chain-following stops after `MAX_MERGE_CHAIN_DEPTH` levels, a longer chain yields `OWNERSHIP_READ_FAILED`; the read count stays within `(1 + MAX_MERGE_CHAIN_DEPTH) × ⌈|K| / 50⌉`; each of a `getConcepts` failure, `CONSENT_NOT_GRANTED`, `STORED_DOCUMENT_INVALID`, `READ_BOUND_EXCEEDED`, a missing concept, `UNKNOWN_CONCEPT` and `MERGE_CHAIN_INVALID` ends the pass `OWNERSHIP_READ_FAILED` with no model call; the pass-local map is never persisted and does not survive the pass (static + behavior).
- AC-D53: U6 literal disjointness against presented-reference text and owning records' `relationDescription`/`valueDescription` gives identical results with and without concept merges (no concept-merge dependency); U6 performs no concept read.
- AC-D47: §23.1 covering procedure: chunks of ≤ 10 refs; `sources: ['user_stated']`; the four statuses; `limit` 50; complete when more than 50 records cite one ref and when several refs share owners; re-queries only refs not yet proven owned; terminates within `|Q|` reads; at least one ref resolved per full page.
- AC-D48: fail-closed ownership: each non-`OK` status of `queryRecordsBySupportingRefs` (including `CONSENT_NOT_GRANTED` and `REJECTED` for a non-matching stored document) and each Typed Memory claim failure ends the pass `OWNERSHIP_READ_FAILED`; no pass ever treats a failed read as "not owned".
- AC-D49: the Typed Memory ownership read is requested once per pass for exactly the presented observation refs; the port test double records that no whole-collection read occurs; Safety types are reported as `SAFETY_INTAKE` regardless of status.
- AC-D50: scale: with 10,000 stored `user_stated` records and 40 observations, the number of ownership reads per pass is bounded by `|Q|`, the number of concept reads by the §23.1 bound, and both are independent of the store size; no list-all or scan path exists in E.0.2d.
- AC-D51: the E.0.2c amendment's AC-SR1 … AC-SR8 pass.

**Execution and persistence**
- AC-D30: field mapping of §17 (source from evidence class; `candidate`; `STANDARD`; `expiresAt null`; empty confounds; `originTurnId null`; producer `e02d.consolidation`; `confidence === 0`).
- AC-D46: `isConfidenceAssessed` is `false` for every record E.0.2d creates, `false` after a same-value `setConfidence` (`NO_CHANGE`), and `true` only after a `CONFIDENCE_CHANGED` entry; it reads no prose; no E.0.2d module reads any record's `confidence` (static).
- AC-D31: all writes run under `SERVER`; no `user_stated` record is created, updated or superseded; `correctInferredKnowledge`, `promoteRecord`, `retractRecord`, `archiveRecord`, `setConfidence`, `addConfound`, `recordConfoundCheck`, `raiseSafetyFlag`, merge/label and forget/erase operations are never called (static + behavior).
- AC-D32: store failures produce `ADMITTED_FAILED` and `PARTIAL` without aborting later operations.
- AC-D33: idempotency of §26 (retry of CREATE, APPEND, SUPERSEDE).
- AC-D34: `runPass` never throws under any injected failure.

**Static and scope**
- AC-D40: no E.0.2d module is script-tagged, listed in `sw.js`, referenced by `js/app.js`, or declares the `callClaude: null` dependency shape.
- AC-D41: module dependencies are exactly §08; no forbidden reference of §08; no clock, randomness or id generation.
- AC-D42: E.0.2c production modules change only as the E.0.2c amendment for E.0.2d §13 specifies (no other operation, transition, authority rule, error code or invariant changes, amendment AC-SR7); `eligibilityPolicy.js`, `capabilityRegistry.js`, `contextComposer.js` and all Safety modules are byte-unchanged.
- AC-D43: only the four §29 existing-test modifications, and production changes limited to the four new E.0.2d modules and the three E.0.2c modules of §29.
- AC-D44: production model-call counts and pinned request-body hashes unchanged.
- AC-D45: full deterministic regression passes.

**Calibration**
- AC-D90: CAL-D1 … CAL-D7 pass at thresholds approved at review and are recorded in the Closure Record.

---

# 31. Real-Model Calibration — Required Before Closure (not before implementation)

Synthetic multi-observation corpora only (no real user data); operator credential from the environment; direct model API, never the production proxy; recorded raw responses; zero-cost replay; pre-flight and mid-run abort on API failure (USI-001 harness precedent). Each gate is **[PROVISIONAL]** in threshold.

| Gate | Measures | Indicative threshold |
|---|---|---|
| CAL-D1 Explicit-statement residual (semantic only) | Human review of every admitted proposal: does it merely restate what the user stated — by paraphrase or translation, or through different concepts, roles or factors — whether stated in a turn or held in a user-stated reference? Structural mirrors are excluded deterministically by U5 and are not part of this gate. Corpus includes single-turn statements, multi-turn restatements, user-stated references with and without independent observations (including the §23 example), and genuine cross-observation inferences | restatement ≤ 2% of admitted; zero on the adversarial restatement subset |
| CAL-D2 Identity / operation choice | CREATE vs APPEND vs SUPERSEDE against labels; support vs contradiction direction; mis-append rate on same-signature/opposite-meaning fixtures | mis-append 0 on the adversarial subset; operation agreement ≥ 85% |
| CAL-D3 Inference usefulness and new meaning | Human review that admitted candidates are grounded in the cited observations, are genuine possible relationships/facts, and — when they use a user-stated reference — add relational or derived meaning beyond it | ≥ 90% grounded; ≥ 95% of reference-using candidates add new meaning |
| CAL-D4 Safety-adjacent detection | `safetyAdjacent` recall on Safety-adjacent fixtures whose turns carry no persisted Safety record | recall ≥ 95% |
| CAL-D5 Temporality and time | Correct temporality; recurring windows not guessed from unknown local time | ≥ 90% correct; zero invented local times |
| CAL-D6 Concept reuse | Reuse of presented concepts vs new concepts; shadowing rejections | shadowing rejection ≤ 5% of proposals |
| CAL-D7 Format, latency, budget | `INTERPRETER_FAILED` rate; p99 latency within `TIMEOUT_MS`; max output ≤ 80% of `MAX_TOKENS`; zero `max_tokens` stops | FAILED ≤ 5% |

Ownership determination and owner concept resolution (§23.1), U4, U5 and U6 involve no model and need no calibration; they are proven by AC-D38, AC-D39 and AC-D47 … AC-D53. **CAL-D1 covers only semantic residuals that canonical structural and literal comparison cannot establish:** paraphrase or translation; semantically equivalent restatement expressed through different concepts, roles or factors; and other semantic equivalence not reducible to canonical structural identity. It never compensates for a structural match, which U5 decides deterministically.

**No calibration is required before SPEC approval or before deterministic implementation.** Every gate measures model behavior under a deterministic contract that is complete without it; no deterministic rule depends on a calibration outcome. CAL-D1 may justify the calibration-contingent restriction of §22.2 at closure review; that restriction is additive and requires no redesign.

---

# 32. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Resolved Product/Architecture decisions.**
- **PD-D1 — Bootstrap confidence — RESOLVED:** `confidence = 0` meaning UNASSESSED; no E.0.2c amendment; assessment state defined by `isConfidenceAssessed` over history; promotion of an E.0.2d candidate requires an E.0.2e assessment; no consumer uses an unassessed value (§21). Options BC-2 … BC-4 not adopted.
- **PD-D2 — User-stated governed records — RESOLVED: U-2** reference-only participation as one input to a higher-order inference, with independent support and new meaning; never mutated or converted (§23). U-1 and U-3 not adopted.
- **PD-D3 — V1 source scope — RESOLVED: S-2** Conversation + Day Logs; no Habit/Pattern inputs in V1 (§12). S-1 and S-3 not adopted.

**Pending Product/Architecture decisions.** None.

**Canonical reading confirmed (A2 §05 item 5).** "Persisting any AI-composed semantic summary requires a separate canonical approval" is item 5 of invariant 23, which applies "for a User Knowledge record with `source: 'user_stated'`" (A2 §05.1). A2 §05.2 states explicitly: "this constrains only what a governed intake may place in those fields. **FITME-inferred records are unaffected.**" GCUK Ch.09 freezes `relationDescription` as "open, bounded prose"; A2 §10.1 assigns E.0.2d to propose FITME-inferred candidate records; the record contract requires a 1..400-character `relationDescription` (E.0.2c §10.1); E.0.2c §27 pressure test A shows an inferred record with such prose; and every E.0.2d record carries interpretation provenance (`source: inferred_*`, `provenance.producer`). E.0.2d is therefore authorized to persist AI-composed descriptions on FITME-inferred records. No ambiguity found.

**Repository gaps.**
- GAP-D1: no timezone/offset is stored for conversation turns or day logs (§04 items 7–8); recurring-window interpretation awaits A1 §10 item 15.
- GAP-D2: no port lookup of concepts by label; concept duplication outside the presented set remains possible (§19).
- GAP-D3: no sleep, perceived-effort or workout-detail observations exist (§04 item 8); early evidence for such relationships is conversational.
- GAP-D4: no `EVIDENCE_REF_KINDS` value for body history or recommendation feedback.
- GAP-D5 — **RESOLVED.** Formerly: E.0.2c had no evidence-keyed query, so ownership could be checked only for presented records. Resolved by the canonical E.0.2c amendment for E.0.2d (`docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md`, canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`): the `supportingRefIds` index and `queryRecordsBySupportingRefs`, consumed by §23.1 and rules U4–U6, implemented within this Work Item (§29). No activation dependency remains on GAP-D5.

**Canonical conflicts.** None found. Wiring test 37 (§04 item 11) is satisfied by the injected-transport design (§08), not by an exception.

---

# 33. Deferred — Recorded, Not Solved

| Item | Owner |
|---|---|
| Trigger and cadence; hosting; production caller | E.0.2e; A1 §10 item 13 |
| Confidence model, confounds, confound check, promotion, decay/staleness, expiry, reconciliation of duplicate candidates, reclassification of evidence class | E.0.2e |
| Evidence resolver adapters and availability updates | E.0.2e (E.0.2c §31) |
| Retrieval of usable knowledge into reasoning; `safetyFlag` enforcement; candidate exclusion from ranking; adoption of §21 invariants 3–4 | E.0.2g |
| Adoption of §21 invariants 1–3 (assessment before promotion; no use of unassessed confidence) | E.0.2e |
| Whether information whose user-stated record was forgotten may later be independently re-inferred (§23.1 retention note) | Retention/privacy policy (E.0.2c §11.5) |
| Firestore (or other platform) index for `supportingRefIds` and the keyed Typed Memory `sourceTurnId` lookup | First persisting Work Item (E.0.2c §21.4; amendment §07 guidance) |
| Safety-authority ruling on Safety-derived User Knowledge | Safety authority (A3 §07.2) |
| Protected/native/external sources; runtime authorization dimension; data-leaving governance | A1 §10 items 3–5 |
| Concept merge/unmerge decisions | Later Work Item |
| Presenting FITME-authored context | Later version of this SPEC (§22.3) |
| Live persistence | Live-persistence activation Work Item (E.0.2c §21.4; A2 §11) |

---

# 34. Compatibility with E.0.2e and E.0.2g

- **E.0.2e** receives `candidate` records with immutable content, evidence references in both lists (`UNVERIFIED`), an empty confound list, `confoundCheck: null`, bootstrap `confidence = 0` with `isConfidenceAssessed === false`, producer `e02d.consolidation`, by-reference citations of user-stated records, and supersession links. Everything E.0.2e needs to judge longitudinally is in E.0.2c fields; E.0.2d adds no field of its own (the `supportingRefIds` index added by the E.0.2c amendment for E.0.2d is a derived, meaning-free index on every record, usable by E.0.2e only as a bounded evidence-keyed read). E.0.2e's SPEC must adopt §21 invariants 1–3: its first `setConfidence` is the first real assessment; it may not promote an E.0.2d candidate before that; and it never uses an unassessed value.
- **E.0.2g** must adopt §21 invariants 3–4: it selects only through `isUsableKnowledge` and never reads, ranks by or thresholds on the confidence of a record whose `isConfidenceAssessed` is `false`.
- **E.0.2g** sees nothing from E.0.2d until E.0.2e has assessed and promoted it (§06, §21). E.0.2d's concepts are ordinary Concept Identity documents usable by concept-keyed retrieval (E.0.2c §20.1).
- **USI-001** is unaffected: E.0.2d never touches `user_stated` records; USI-001 can correct FITME-inferred records through its own governed path (E.0.2c §15.4) when live.

---

# 35. Status, Activation and Closure

**Two distinct lifecycles.** This document's status (the *specification*) and the *E.0.2d Work Item's* status are separate. Specification closure freezes the approved design; it does not mean the Work Item is implemented, verified, calibrated, closed or live.

- **Specification status: CANONICAL / CLOSED — READY FOR IMPLEMENTATION.** Product/Architecture final approval of the complete design is recorded: PD-D1, PD-D2 / U-2, PD-D3, the GAP-D5 resolution, deterministic ownership determination, deterministic merge-resolved U5, text-only U6, CAL-D1 as a semantic-only boundary, the E.0.2c amendment integration, the Observation Port architecture, and the implementation and deterministic-test scope (§32). No Product/Architecture decision or blocking architectural gap remains. Canonization commit `0eff66dfbb6aa21342499b7aa4a613625b313135`.
- **Work Item status: NOT IMPLEMENTED — NOT CALIBRATED — NOT LIVE.** Deterministic implementation is pending. No paid or real-model calibration has been run, and none may be run without separate explicit Product approval.
- Implementation, when authorized, is deterministic and testable-not-live (§29), in the D5-2 order (the E.0.2c amendment changes first, then the E.0.2d modules); it may begin before any calibration (§31).
- **Work Item CLOSED** requires: AC-D1 … AC-D53 (including the amendment's AC-SR1 … AC-SR8) and AC-D90 pass; CAL-D1 … CAL-D7 run with Product approval and recorded in the Closure Record; full regression passing; no production caller.
- LIVE is not authorized by Work Item closure. It additionally requires E.0.2e (cadence, assessment, promotion, adopting §21), the live-persistence activation Work Item (E.0.2c §21.4 including a governed correct/withdraw/forget path for FITME-sourced records), a hosting decision (A1 §10 item 13), and a separate Product/Architecture activation approval.

## Closure Record

*(Empty until Work Item closure.)*

---

# 36. Document History

- **v1.0** (initial authoring) — Authored against GCUK as amended by A1, A2 and A3, the closed E.0.2c SPEC, the E.0.2a SPEC and Activation Amendment, and MRE-001, at baseline `df3000c`. Encodes the approved E.0.2d direction D-1 … D-7. Three decisions are recorded as pending rather than made: PD-D1 (bootstrap confidence, after finding that an equal-value confidence assessment leaves no history entry), PD-D2 (participation of user-stated governed records) and PD-D3 (V1 source scope).
- **v1.0** (Product/Architecture rulings applied) — PD-D1: bootstrap `confidence = 0` meaning UNASSESSED; `isConfidenceAssessed` defined over history; promotion of an E.0.2d candidate requires an E.0.2e assessment; no consumer, including E.0.2g, may use an unassessed value; no E.0.2c amendment (§21, §34). PD-D2: option U-2 with gate rules U1–U7 and the `readUserStatedReferences` port function (§10.3, §14.3, §23). PD-D3: option S-2, Conversation + Day Logs, Habit/Pattern excluded as V1 inputs, `SOURCE_NOT_IN_SCOPE` (§12, §16.1 G6). A2 §05 item 5 reading confirmed from A2 §05.2 (§32). ACs AC-D35 … AC-D39 and AC-D46 added; CAL-D1 and CAL-D3 extended. Status DRAFT — COMPLETE — READY FOR PRODUCT/ARCHITECTURE SPEC REVIEW.
- **v1.0** (GAP-D5 resolution) — Consumes the canonical E.0.2c amendment for E.0.2d (`416c002`, closed `8802880`). New §23.1: ownership semantics aligned with the amendment (supporting evidence of currently stored `user_stated` records in any stored status; Typed Memory `sourceTurnId` in any status; not contradicting-only, FITME-inferred, forgotten or erased; no tombstone), the bounded covering procedure over `queryRecordsBySupportingRefs` (≤ 10 refs, `sources: ['user_stated']`, four statuses, `limit` 50, re-query of unresolved refs on a full page, ≤ `|Q|` reads), fail-closed `OWNERSHIP_READ_FAILED`, the retention note. U4 uses §23.1; U5/U6 also apply to non-presented owning records without additional reads; observations owned by `SAFETY_ADJACENT` user-stated records are excluded (§24). Typed Memory ownership is a keyed `sourceTurnId` lookup (§10.3); `USER_STATED_USER_KNOWLEDGE` removed from the port's `CLAIMANTS`. Pass steps renumbered (§13). §29 includes the amendment's E.0.2c production, fixture and test changes and its two authorized test edits; AC-D38, AC-D39, AC-D42, AC-D43 revised; AC-D47 … AC-D51 added. GAP-D5 recorded as resolved; no activation dependency on it remains. Baseline `8802880`. Status READY FOR FINAL PRODUCT/ARCHITECTURE SPEC REVIEW.
- **v1.0** (deterministic U5 merge resolution) — Owner concept resolution added to §23.1 and pass step 6: concepts of every owning record are resolved to current roots before the model call with the canonical `store.getConcepts`, `resolveConceptRoot` and `MAX_MERGE_CHAIN_DEPTH` over a transient pass-local concept map (§14.2); any incomplete resolution fails the pass `OWNERSHIP_READ_FAILED` (§25). The read bound is derived from existing constants (`OBS_MAX_PER_PASS`, `MAX_QUERY_LIMIT`, `MAX_FACTORS`, `MAX_READ_BATCH`, `MAX_MERGE_CHAIN_DEPTH`); no new constant. U5 is fully merge-resolved for presented references and non-presented owners in every stored status; the former statement that CAL-D1 covers missed U5 merge matches is removed. U6 confirmed free of concept-merge dependency. CAL-D1 limited to semantic residuals (§31). AC-D39 rewritten; AC-D50 extended; AC-D52, AC-D53 added. No port, store, API or canonical change.
- **v1.0** (canonical finalization) — Product/Architecture final approval of the complete design. Status metadata and lifecycle wording only: specification CANONICAL / CLOSED — READY FOR IMPLEMENTATION (header, §01, §35); §35 now distinguishes the specification lifecycle from the E.0.2d Work Item lifecycle (NOT IMPLEMENTED — NOT CALIBRATED — NOT LIVE), and its existing closure criteria are labelled the Work Item CLOSED criteria, with CAL-D1 … CAL-D7 run only with Product approval. No normative change.
- **v1.0** (canonical closure) — Specification canonization commit recorded: `0eff66dfbb6aa21342499b7aa4a613625b313135`. Status metadata only; no content change. The E.0.2d Work Item remains NOT IMPLEMENTED — NOT CALIBRATED — NOT LIVE.
