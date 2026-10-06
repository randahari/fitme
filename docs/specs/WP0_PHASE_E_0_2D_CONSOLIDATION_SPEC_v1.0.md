# WP0 — PHASE E.0.2d — BOUNDED INFERRED-KNOWLEDGE CONSOLIDATION — IMPLEMENTATION SPEC
## E.0.2d Consolidation SPEC v1.2 — APPROVED (Product Review: APPROVED. Architecture Review: APPROVED.) — WORK ITEM: v1.1 IMPLEMENTED — DETERMINISTICALLY VERIFIED — CALIBRATION INFRASTRUCTURE READY — REAL-MODEL CALIBRATION PENDING (PAUSED) — v1.2 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE

**Repository path:** `docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md` (the file name is retained for v1.1 and v1.2 because it is referenced by path from code comments, tests and other canonical documents; the version of record is the one stated in this header).

**How to read v1.2.** v1.2 is an in-file revision that makes E.0.2d the immediate downstream canonical consumer of **MRS-001 — Model Response Structure** (`docs/specs/MRS_001_SPEC_v1.0.md`). It changes only E.0.2d's model-call boundary:
- both model stages become MRS-001 **EXPLICIT-PROFILE** stages, with complete stage-owned request profiles (§27.1);
- the Generator's profile becomes configurable, symmetric with the Verifier's (§08, §27.1);
- every provider response passes MRS-001 structural extraction before MRE-001 (§15.0);
- structural failures and provider refusal are integrated into the existing fail-closed stage failures (§15.3, §15.6, §25);
- the output bound becomes a total provider-output ceiling (§27.1), CAL-D7 is restated against it (§31.2), and calibration evidence identifies complete stage profiles (§31.4).

Every other part of the v1.1 architecture is unchanged (§36, v1.2 entry). Text marked **[v1.2]** is new or revised in v1.2.

**Document role:** Implementation SPEC for WP0 Phase E.0.2d — the bounded, AI-assisted, off-turn consolidation that discovers and formulates **FITME-inferred candidate** User Knowledge from governed observations, with deterministic governance over what it may read, propose, verify and persist. Testable-not-live.

**How to read v1.1.** The body of this document is the **v1.1 normative architecture**: a Generator model stage, a deterministic pre-verification gate, a conditional, batched, reject-only Verifier model stage, deterministic post-verification authorization, and execution (§13). Text marked **[HISTORICAL — v1.0]** records the v1.0 baseline that was implemented and calibrated; it is preserved as fact and is not normative for v1.1. The first real-model calibration evidence is recorded in §31.1. Deferred decisions are recorded in §33. v1.1 is **not implemented**.

**Canonical contract:** GCUK (`docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md`) as amended by **A1**, **A2** and **A3** (`…_Amendment_A1_v1.0.md`, `…_A2_v1.0.md`, `…_A3_v1.0.md`); the closed **E.0.2c SPEC** (`docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md`); the **E.0.2a SPEC** and its **Activation Amendment**; **MRE-001**. All CANONICAL / CLOSED. **[v1.2]** **MRS-001** (`docs/specs/MRS_001_SPEC_v1.0.md`) — approved at the Product/Architecture level and reviewed together with this revision — governs provider-response structure and request-contract states. USI-001 (`docs/specs/USI_001_SPEC_v1.0.md`) is IMPLEMENTED — NOT CLOSED — NOT LIVE and is cited only as precedent, never as a dependency (§07.4).

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline; **[CANON]** canonical document or explicit Product/Architecture decision; **[DESIGN]** a contract this SPEC proposes for approval; **[INFERENCE]**; **[GAP]**; **[PROVISIONAL]** a numeric value confirmed or revised by calibration (§31).

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 Phase E.0.2d — Bounded Inferred-Knowledge Consolidation** (A2 §10.1; GCUK Ch.14 as amended by A2 §07; E.0.2c SPEC §31).
- **[v1.2] Status:** **E.0.2d Consolidation SPEC v1.2 — APPROVED** (Product Review: APPROVED. Architecture Review: APPROVED.) (§35).
  - v1.2 revises the same Work Item; it is not a new Work Item.
  - It was authored after MRS-001's approval at the Product/Architecture level, and it completed joint Product/Architecture review with MRS-001. v1.2 supersedes v1.1 as the normative specification of this Work Item.
  - **Work Item:** **v1.1 IMPLEMENTED — DETERMINISTICALLY VERIFIED — CALIBRATION INFRASTRUCTURE READY — REAL-MODEL CALIBRATION PENDING (PAUSED) — v1.2 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE**.
  - v1.1 was implemented in commit `c83b1825795bf68582aada900673816109752c62`. The v1.1 calibration infrastructure (§31) was implemented in commit `f6ae1a104f472420f92d6cffce2e4516049e0345`, with full deterministic regression 3767/3767.
  - No real-model calibration of v1.1 has run; real-model calibration is paused until MRS-001 and v1.2 are implemented and deterministically verified (§31.4).
  - v1.2 authoring modified only this document.
- **[HISTORICAL — v1.1]** Status: **E.0.2d Consolidation SPEC v1.1 — CANONICAL / CLOSED (SPECIFICATION)** (Product Review: APPROVED. Architecture Review: APPROVED.) (§35). v1.1 revises the same Work Item; it is not a new Work Item. Its architecture was approved in principle by Product/Architecture before authoring (§32 rulings R-1 … R-12; R-13 ruled after authoring), and the authored text was approved for canonization after final verification. **[HISTORICAL — v1.0]** The v1.0 specification was CANONICAL / CLOSED (Product Review: APPROVED. Architecture Review: APPROVED.); canonization commit `0eff66dfbb6aa21342499b7aa4a613625b313135`; the last v1.0 status commit is `a7d5c138b6ceacd862957fbe550879ff614edc7e`. The **E.0.2d Work Item** is **v1.0 BASELINE IMPLEMENTED / DETERMINISTICALLY VERIFIED / CALIBRATION FAILED — v1.1 REMEDIATION CANONICALIZED — v1.1 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE**: the v1.0 baseline was implemented in commit `1cfec7ae988a1f90b8bfe963e7e20513452fcf60` (including the E.0.2c amendment for E.0.2d) with full deterministic regression 3719/3719; the first real-model calibration of that baseline was run once with Product approval and failed CAL-D1, CAL-D2, CAL-D5 and CAL-D7 (§31.1); v1.1 is the remediation and is not implemented; no production caller or activation exists, and activation and live use remain prohibited (§35). GAP-D5 is resolved by the canonical E.0.2c amendment for E.0.2d, which this SPEC consumes (§23.1) and whose implementation it includes (§29). The three decisions recorded at first authoring are resolved by Product/Architecture ruling: **PD-D1** bootstrap confidence `0` = UNASSESSED (§21), **PD-D2** option U-2, reference-only participation of user-stated governed records (§23), **PD-D3** option S-2, V1 observation sources Conversation + Day Logs (§12). These rulings are unchanged in v1.1. Every v1.0 **[DESIGN]** item was approved; v1.1 items revise them where stated. v1.1 authoring modified only this document: no file under `js/**`, `tests/**`, `functions/**`, and not `index.html`, `sw.js`, `firestore.rules`, the calibration harness or any other canonical document.
- **[v1.2]** Repository baseline for v1.2 authoring: `main` @ `f6ae1a104f472420f92d6cffce2e4516049e0345` (== `origin/main`) **[VERIFIED]**; v1.2 repository evidence is §04 item 16.
- Repository baseline for v1.1 authoring: `main` @ `a7d5c138b6ceacd862957fbe550879ff614edc7e` (== `origin/main`) **[VERIFIED]**. **[HISTORICAL — v1.0]** v1.0 was authored at `880288026cef7646f593cbe82f4697ada84cdbe9` (full suite 3631/3631 at `df3000c`). The working tree carries unrelated uncommitted entries (19 line-ending/stat-only, 10 untracked documents); none is a file this SPEC authorizes.
- Authority: Product/Architecture own every **[CANON]** item: the approved E.0.2d direction (hereafter **D-1 … D-7**: 1 open-world inference; 2 CREATE / APPEND_EVIDENCE / SUPERSEDE, append conservative, prefer CREATE when identity is uncertain, supporting and contradicting evidence; 3 no epistemic confidence in E.0.2d; 4 all three temporalities, open-ended TEMPORARY, no expiry ownership, recurring-window time preservation; 5 platform-neutral Observation Port, no duplicate store, references only, A3 governs eligibility; 6 `NOT_AUTHORIZED` for Safety-adjacent sources, Safety-derived knowledge excluded; 7 reuse presented/merge-resolved concepts, no embeddings/synonyms/ontology/merge subsystem), the rulings **PD-D1**, **PD-D2** and **PD-D3**, the v1.1 rulings **R-1 … R-13** (§32), together with A2 §07 and A3.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** USI-001 lets FITME hold what a user explicitly states. E.0.2d is the first step that lets FITME move from "the user told me X" to "across these observations, FITME has noticed a possible relationship or fact about this user" — for example, that on several days a low-sleep report preceded a hard or poor training session. E.0.2d **discovers and formulates** such a candidate and records the evidence references it rests on. It never decides the candidate is true: it creates only `candidate` records with a technical bootstrap confidence. Longitudinal judgment — confidence, confounds, promotion, decay, staleness and cadence — is E.0.2e; use of established knowledge in reasoning is E.0.2g.

**Scope.**
1. Governed-consumer declaration under A3 (§09).
2. The platform-neutral Observation Port and the observation contract (§10), source authorization and consent (§11), V1 source scope (§12, PD-D3).
3. One consolidation pass: bounded reads, presentation with pass-local keys, the Generator call, deterministic pre-verification gate, the conditional batched Verifier call, deterministic post-verification authorization, governed writes (§13–§17); at most two model calls per pass (§27).
4. CREATE, APPEND_EVIDENCE and SUPERSEDE of FITME-inferred candidates (§16–§17), the claim-content boundary (§17.1), evidence handling (§18), concept identity (§19), temporality and recurring-window grounding (§20), bootstrap confidence (§21, PD-D1).
5. Explicit-statement protection (A2 §07) (§22), user-stated governed records (§23, PD-D2), Safety boundary and Safety-adjacent semantics (§24).
6. Failure, idempotency, cost, invariants, implementation scope, tests and calibration (§25–§31).

**Non-goals (binding).**
- No production caller, trigger, schedule or cadence (E.0.2e). No live persistence; no platform adapter for the User Knowledge port (E.0.2c §21.4; A2 §11). No hosting decision (A1 §10 item 13).
- No confidence estimation, confound reasoning or logging, confound check, promotion, retraction, archiving, expiry/decay, forgetting or erasing.
- No retrieval into reasoning, no Semantic Context Discovery change, no `ContextComposer`/`ContextRelevancePlanner`/`CapabilityRegistry` change (E.0.2g).
- No creation, promotion, update or supersession of `user_stated` knowledge; no use of `correctInferredKnowledge`.
- No concept merge, unmerge, label addition or label removal.
- No change to Turn Understanding, CPI-001, USI-001, Typed Memory, Safety modules, `eligibilityPolicy.js`, `consentScopeRegistry.js`, `contextComposer.js` or any existing runtime behavior. No `index.html`, `sw.js` or `js/app.js` change; no version bump.
- No protected/native/external source (A3 §06.2); no new `EVIDENCE_REF_KINDS` value; no Habit/Pattern record as an inference input in V1 (§12).
- No embeddings, synonym table, ontology, taxonomy, closed relationship list, situation→inference rule or domain mapping; no closed list of recurrence situations, activities, events or life contexts (§20); no logic specific to any calibration corpus (§31).
- No pre-generation Safety screening model call in v1.1 (§24.3 records the residual this leaves).

---

# 03. Binding Canonical References

- **GCUK** Ch.04 (invariants 1–20; A1 21; A2 22–25; A3 26), Ch.05, Ch.09–Ch.14, Ch.15, Ch.17, Ch.18, Ch.19, Ch.20, Ch.22, Ch.23 as amended **[CANON]**.
- **A1** §04 (Invariant 21, Application-Ready), §05.3 (descriptor), §05.5 (needs have zero authority), §08 (consent vs runtime authorization), §10 items 3–5, 13, 15 **[CANON]**.
- **A2** §04 (invariant 22), §05 (invariant 23, scoped to `user_stated`), §07 (consolidation boundary; "the E.0.2d SPEC must define the deterministic mechanism"), §08 (owned spans; no duplicate authority), §10.1 (sequence), §11, §12 **[CANON]**.
- **A3** §04 (governed consumer/source, shared fields, forbidden mechanisms), §05 (Ch.06 replacement), §06 (authorization state; protected sources fail closed; authorization user experience), §07 (Safety-adjacent boundary for background consumers), §08 (invariant 26), §11 (first non-Capability consumer consequences) **[CANON]**.
- **E.0.2c SPEC** §07, §09–§21, §23–§26, §31 **[CANON]**; §19 and §26 are read as recorded in §32 (canonical reading confirmed for the fixed, batched, reject-only Verifier).
- **SL-001** (closed `RISK_TYPES`) and the **WP0 Safety Risk-Characteristic Sub-Spec** (closed `RISK_DOMAINS`) — cited only as the source of the Safety-risk boundary that §24.1 mirrors in prose; no Safety module or vocabulary is imported, read or modified (E.0.2c §24.3, A3 §07.4) **[CANON]**.
- **E.0.2c Amendment for E.0.2d** (`docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md`, CANONICAL / CLOSED, canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`): the `supportingRefIds` derived index and the bounded `queryRecordsBySupportingRefs` read (§04–§16 there); implemented by this Work Item (D5-2) **[CANON]**.
- **E.0.2a SPEC** §05, §09–§12; **Activation Amendment** §09, §09.1 **[CANON]**.
- **MRE-001** (shared transport envelope; one attempt; fixed timeout) **[CANON]**.

---

# 04. Current-State Repository Evidence **[items 1–13 VERIFIED at `df3000c` (v1.0 authoring baseline); items 14–15 VERIFIED at `a7d5c13` (v1.1 authoring baseline)]**

Items 1–13 are preserved as recorded at the v1.0 baseline; where the repository has since changed, item 14 states the later state.

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
14. **v1.0 baseline as implemented [VERIFIED at `a7d5c13`]** (supersedes items 11 and 13 as to current state). The four v1.0 modules exist (`consolidationContract.js`, `consolidationInterpreter.js`, `consolidationGate.js`, `consolidation.js`), together with the E.0.2c amendment (`supportingRefIds`, `queryRecordsBySupportingRefs`). MRE-001 W-1 pins 20 parse sites, `consolidationInterpreter.js` among them, and W-3 carries `NODE_ONLY_SITE_FILES = ['consolidationInterpreter.js']` (§29.1). In the v1.0 gate context each observation carries only `{ref, refId, observedAt, userTexts}`; local date, local time, offset and data segments are rendered to the model but not available to the gate (`consolidation.js:333-336`). The v1.0 interpreter's model output is validated by one combined proposal shape (`consolidationInterpreter.js:103-114`); any deviation fails the whole response. E.0.2c imposes no coupling between `temporality` and `evidenceClass` (`userKnowledgeContract.js:340`, `:524`); the v1.0 coupling `RECURRING_WINDOW ⇒ RECURRENCE` was an E.0.2d gate rule (C3).
15. **Safety-risk canon [VERIFIED at `a7d5c13`].** SL-001 defines the closed `RISK_TYPES` (`safetyLayer.js:127-131`): `NONE`, `KNOWN_ALLERGY_CONFLICT`, `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, `ACTIVE_HIGH_RISK_SYMPTOM`, `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT`, `DANGEROUS_OR_EXTREME_REQUEST`, `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN`, `PSYCHOLOGICAL_DISTRESS_CONCERN`, `OUTSIDE_COACHING_SCOPE`, `INSUFFICIENT`. The Risk-Characteristic Sub-Spec §08.1 defines the closed `RISK_DOMAINS`, described there as risk properties, never world concepts. No canonical document defines "Safety-adjacent" as a content test for a background consumer's proposals; GCUK Ch.09 and E.0.2c §24 define `safetyFlag: 'SAFETY_ADJACENT'` as a governance marker only.
16. **[v1.2] v1.1 model-call boundary as implemented [VERIFIED at `f6ae1a1`].**
    - **Request bodies.** The Generator body is `{model: MODEL, max_tokens: MAX_TOKENS, messages}` with `MODEL = 'claude-haiku-4-5-20251001'`, `MAX_TOKENS = 1600`, `TIMEOUT_MS = 20000` (`consolidationInterpreter.js:29-31`, `:81`). The Verifier body is `{model: deps.model, max_tokens: 800, messages}` with default model `claude-haiku-4-5-20251001` and timeout 20000 (`consolidationVerifier.js:31-33`, `:78`). No body carries a reasoning field.
    - **Parsing.** Both stages fail on `stop_reason === 'max_tokens'` and read the answer as `raw.content[0].text` before `ModelResponseEnvelope.unwrapSingleJsonFence` (`consolidationInterpreter.js:105-106`, `consolidationVerifier.js:99-100`).
    - **Configuration.** `Consolidation.configure()` accepts `timeoutMs` (Generator), `verifierTimeoutMs` and `verifierModel`; the Generator model is a module constant (`consolidation.js:76-79`).
    - **Pinned key sets.** `tests/e02dConsolidationInterpreter.test.js:37` and `tests/e02dConsolidationVerifier.test.js:39` assert body key sets of exactly `['max_tokens', 'messages', 'model']`.
    - **Calibration harness override.** The harness rewrites only the Generator request body's `model` for experiments (`tests/evals/e02dConsolidationCalibration.eval.js:359`) and passes `verifierModel` through `configure()` (`:408`).
    - **Provider behaviour [EXTERNAL — Anthropic documentation, retrieved 2026-10-05].** For `claude-haiku-4-5-20251001`, a request with no `thinking` field and a request with `thinking: {type: 'disabled'}` both run with thinking off; the model does not support the effort parameter.

---

# 05. Definitions

| Term | Meaning |
|---|---|
| Observation | One governed, source-provided unit of evidence about the user, identified by a stable evidence reference `{kind, ref}` (E.0.2c §11.1), presented as data segments with authorship (§10.2). Never stored by E.0.2d. |
| Observation source | A governed source (A3 §04.2) exposed through the Observation Port. |
| Consolidation pass | One invocation of `Consolidation.runPass(request)`: bounded reads, presentation, the Generator call, deterministic pre-verification gate, the Verifier call when at least one plan survives, deterministic post-verification authorization, governed writes. At most two model calls (§27). |
| Generator | The first model stage (§15.1–§15.3): discovers and formulates candidate knowledge and proposes operations. Grants nothing. |
| Verifier | The second model stage (§15.4–§15.6): one batched call over every plan that survived the pre-verification gate, returning closed per-dimension verdicts. **Reject-only:** it can cause a plan to be rejected and can do nothing else. |
| Proposal | One Generator-proposed operation (`CREATE`, `APPEND_EVIDENCE` or `SUPERSEDE`) in the per-operation shape of §15.2. |
| Plan | The trusted, deterministic materialization of a proposal that passed the pre-verification gate: resolved target, draft or evidence references, resolved grounding (§16). The Verifier judges plans, never raw proposals. |
| Verification item | One plan as rendered to the Verifier under a pass-local item key `p1…` (§15.4). |
| Authorized plan | A plan whose applicable verdicts all hold the passing value and which survives the cross-proposal rules (§16.5). Only authorized plans are executed. |
| Pass-local key | A short key valid only within one pass that stands for a durable identity: `o…` observation, `u…` user-stated reference, `r…` presented record, `k…` concept, `p…` verification item (§14.4). Never persisted. |
| Presented set | The bounded concepts and FITME-sourced records shown to the Generator in the pass (§14). |
| Structural signature `S(x)` | The sorted multiset of `(resolveConceptRoot(conceptId), role)` over `x.factors` (§16.1). Equality only; never interpreted. |
| User-authored text | A text segment whose authorship is `USER_AUTHORED` (§10.2). |
| Reported event / user assertion | A *reported event* is what the person says happened or how something was on an occasion; it is an observation. A *user assertion* is what the person states as a belief, generalization, self-description, explanation or preference; it is the person's own statement and is never evidence for itself (§22.4). The distinction is semantic and is applied by the Generator and judged by the Verifier, never by deterministic code. |
| Recurring-window grounding | The structural evidence a `RECURRING_WINDOW` proposal must carry for both its recurrence and its window meaning (§20.2). |
| Anchor | A structural reference from grounding into cited evidence: a source time field, a literal user expression, or (reserved) a source recurrence field (§20.2). |
| Safety-adjacent | Content within the Safety-risk boundary defined in §24.1. Not "related to health". |
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

## 07.1 What the models decide (proposals and vetoes only)

**Generator (proposes).** Which observations suggest a possible relationship or fact; how to formulate it (factors, roles, values, relation text); which presented concepts it involves; evidence class and temporality, and for a recurring window the grounding it rests on (§20.2); whether new evidence supports or contradicts a presented candidate; whether a presented candidate should be appended to, superseded, or left alone in favor of a new candidate. It also raises two early, reject-only flags — that a proposal restates the person, or is Safety-adjacent — which are never authoritative in the permissive direction (§22.1 E4, §24 item 3).

**Verifier (vetoes).** For each plan, closed judgments of restatement, unsupported content, Safety adjacency, temporal faithfulness and — for APPEND — evidence direction (§15.5). A verdict can only cause rejection. The Verifier cannot create, repair or re-operate a proposal, change its evidence, concepts, target or content, or admit anything the deterministic gate rejected.

## 07.2 What deterministic code decides (authority)

Whether the pass may run at all (consent, configuration, consumer declaration); which sources may be read (A3 eligibility); what is presented and under which pass-local keys; how every key resolves to a durable identity; whether every proposal is well-formed and admissible (§15.3, §16, §22–§24); every value derivable from trusted state (APPEND structure, uniqueness and freshness; anchor existence and literalness); whether the Verifier runs; whether every verdict is attributable and well-formed; which plans are authorized (§16.5); the exact persisted fields that are not model-composed (source, status, confidence, safety flag, provenance, expiry); which store operation runs; all ids.

## 07.3 What E.0.2d may never do

Create, update or supersede `user_stated` records; use `correctInferredKnowledge`; promote, retract, archive, forget or erase; set or change confidence after creation; record confounds or confound checks; raise or lower `safetyFlag` after creation; merge, unmerge or relabel concepts; read a source A3 does not authorize; persist observation content; request any user permission (A3 §06.3); write anything that the Verifier has not explicitly passed; let a model choose a durable record id, concept id or evidence reference directly (§14.4); persist verdicts or grounding (§20.5).

## 07.4 No dependency on USI-001 or Turn Understanding Dimension 6

No rule in this SPEC reads Dimension 6, CPI anchors, USI-001 prompts or USI-001 calibration outcomes. USI-created `user_stated` records participate only as stored records under PD-D2 (§23). Their absence (USI-001 is not live) never invalidates any E.0.2d rule.

---

# 08. Module Boundary and Application-Ready Placement — [CANON A1 §04; DESIGN]

Five core modules, UMD-shaped like every sibling, **Node-only**: not script-tagged in `index.html`, not listed in `sw.js`, not referenced by `js/app.js` (E.0.2c §04 item 13 precedent). **[HISTORICAL — v1.0]** v1.0 had four modules; v1.1 adds `consolidationVerifier.js` and changes the responsibilities shown.

| Module | Global | Responsibility | Requires |
|---|---|---|---|
| `js/coachDecisionSystem/consolidationContract.js` | `ConsolidationContract` | Closed vocabularies (operations, grounding forms, anchor kinds, verdict values, reason codes), constants, the consumer declaration (§09), source-descriptor and observation validators (§10), structural signature, literal-overlap function (§22), `isConfidenceAssessed` (§21) | `userKnowledgeContract.js` |
| `js/coachDecisionSystem/consolidationInterpreter.js` | `ConsolidationInterpreter` | **Generator** (§15.1–§15.3): builds the one bounded Generator request **from its request profile [v1.2]**, sends it through the injected model transport, **extracts the answer text through MRS-001 under the same profile [v1.2]**, parses through MRE-001, validates the envelope and isolates each proposal by its per-operation shape; returns a closed result | `modelResponseStructure.js` **[v1.2]**, `modelResponseEnvelope.js`, `consolidationContract.js` |
| `js/coachDecisionSystem/consolidationVerifier.js` | `ConsolidationVerifier` | **Verifier** (§15.4–§15.6): builds the one batched Verifier request from deterministic renderings supplied by the coordinator **and from its request profile [v1.2]**, sends it through the injected model transport, **extracts the answer text through MRS-001 under the same profile [v1.2]**, parses through MRE-001, validates the envelope and attribution, returns per-item closed verdicts. Grants nothing | `modelResponseStructure.js` **[v1.2]**, `modelResponseEnvelope.js`, `consolidationContract.js` |
| `js/coachDecisionSystem/consolidationGate.js` | `ConsolidationGate` | Pure deterministic pre-verification gate producing plans (§16.1–§16.4, §20.2, §22–§24) and post-verification authorization (§16.5) | `userKnowledgeContract.js`, `consolidationContract.js` |
| `js/coachDecisionSystem/consolidation.js` | `Consolidation` | `configure()` and `runPass()`: consent, eligibility, reads, presentation and key maps, Generator, gate, Verifier dispatch, authorization, execution | `consolidationContract.js`, `consolidationInterpreter.js`, `consolidationVerifier.js`, `consolidationGate.js`, `userKnowledgeContract.js`, `eligibilityPolicy.js` |

Binding placement rules:
- No module reads a clock, generates ids or randomness, or references `window` (other than the standard export line), `document`, storage, `navigator`, `fetch`, Firebase/Firestore, `db`, `currentUser`, `js/memory.js`, `js/stateAccess.js`, `js/app.js`, `functions/**`, any repository, any Safety module, `memoryLayer.js`, `contextComposer.js` or `contextRelevancePlanner.js`. Time is injected (`now()`); ids come from the User Knowledge port through the store.
- **Model transport.** E.0.2d is a governed background process whose host is not yet decided (A1 §10 item 13). Its transport is injected by the host composition root as `modelTransport(body) → Promise<rawResponse>` through `Consolidation.configure()`, never as a browser-shell `callClaude` dependency; the Generator and the Verifier use the same injected transport, each with its own request body built from its own **request profile** (§27.1) **[v1.2]**.
- **[v1.2] Request profiles and configuration.**
  - `Consolidation.configure()` accepts optional `generatorProfile` and `verifierProfile`. Each, when supplied, is a complete EXPLICIT-PROFILE request profile (§27.1); when omitted, that stage's default profile applies (§27.1).
  - A supplied profile that is incomplete or invalid (§27.1 validation) makes the whole configuration `NOT_CONFIGURED`. No partial profile is merged with a default.
  - The v1.1 fields `verifierModel`, `timeoutMs` and `verifierTimeoutMs` are replaced by the profiles; a configuration that supplies any of them is `NOT_CONFIGURED`, so a v1.1-style override can never silently take effect in part.
  - Each stage uses its configured profile both to construct its request and to govern MRS-001 extraction of that request's response.
  - Calibration overrides set profiles through this surface; they never rewrite a request body (§31.4). Neither module declares the `callClaude: null` default shape governed by wiring test 37 (§04 item 11), which applies to shell-configured browser interpreters. A static test asserts that no E.0.2d module is configured by `js/app.js` or script-tagged (AC-D40).
- **Verifier input is rendered by the coordinator.** `consolidationVerifier.js` receives already-rendered, bounded data (§15.4) and never reads a store, a port, a record or a User Knowledge field itself; it does not depend on `userKnowledgeContract.js`.
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
  data: Array<{ label: string (1..80), value: string|number|boolean, unit: string (1..16) | null }> | null,  // structured readings; labels/units are adapter-authored, open
  localDate: 'YYYY-MM-DD' | null,      // v1.1: the segment's own local calendar date, when the source records one per item
  localTime: 'HH:MM' | null,           // v1.1: the segment's own local wall-clock time, when the source records one per item
  utcOffsetMinutes: integer | null     // v1.1: only when the source records it for the item
}
```

- `AUTHORSHIP` is a closed **process** vocabulary (who produced the content), not a content taxonomy; it passes GCUK R4's test (no value is needed because a new user situation appears). A new value requires a canonical decision.
- Exactly one of `text`/`data` is non-null per segment. Data labels and units are adapter-authored, open strings; the core never branches on them.
- Time fields preserve exactly what the source records (D-4). The core never converts local to absolute time or the reverse (A1 §10 item 15).
- **Segment-level time (v1.1).** A source that records time per item within one observation (for example several timed entries on one calendar day) reports it in the segment's structural time fields; observation-level fields describe the observation as a whole. Adapters must not leave such time only inside `data` when the source records it as time: the core reads time only from structural fields, never from data labels, so time left only in `data` cannot ground anything (§20.2). Segment time fields are optional and default to `null`; a non-null value must be well-formed (`OBSERVATION_READ_INVALID` otherwise). Segment-level `observedAt` does not exist: an absolute instant is observation-level only.

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
| Day log | `DAY_LOG:YYYY-MM-DD` | one `USER_RECORDED` data segment per meal (`name`, `kcal`, macros, `time`) and one for the day totals (`burned`, `steps`, `water`) | `localDate` = day key; each meal segment's `localTime` = the meal's `time` normalized to `HH:MM` (v1.1; the value may also remain in its data); `observedAt` = null **[HISTORICAL — v1.0: meal time was carried only inside data]** |
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

**V1 scope is not an architectural limit.** The Observation Port, descriptor, observation contract, eligibility path, gate and executor are source-agnostic (§10, §28). Adding an authorized source later — for example a health platform, calendar, location or weather — requires an adapter, a registered descriptor, an `EVIDENCE_REF_KINDS` value (E.0.2c amendment) and satisfaction of A3 §06.2 (and A1 §10 item 5 where data leaves FITME), plus widening `V1_OBSERVATION_REF_KINDS` in this SPEC. It requires no change to the pass, the Generator or Verifier contract, gate rules or executor; a source whose structural data represents recurrence itself additionally needs the `SOURCE` grounding form to be defined (§20.2, reserved).

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
7. Presentation of concepts and FITME-sourced records (§14.2) and of user-stated references (§14.3), with pass-local key maps for every namespace (§14.4).
8. **Generator** — one call (§15.1–§15.3). Any Generator stage failure → `INTERPRETER_FAILED`, no Verifier call, no writes. Stage failures are: transport failure; timeout; an MRS-001 structural failure, including refusal (§15.0) **[v1.2]**; a `max_tokens` stop; or an invalid envelope.
9. **Proposal isolation** (§15.3) — a proposal that fails its per-operation shape is rejected alone (`MALFORMED_PROPOSAL`); its siblings continue.
10. **Pre-verification gate** — every well-formed proposal is evaluated independently (§16.1–§16.4, §20.2, §22–§24). A proposal that fails is rejected with its closed code; one that passes becomes a **plan**.
11. If no plan exists, the pass ends `COMPLETED` with no Verifier call and no writes.
12. **Verifier** — one batched call over every plan (§15.4–§15.6). A failed Verifier result, including any MRS-001 structural failure or refusal (§15.0) **[v1.2]** → `VERIFIER_FAILED`: every plan is rejected (`VERIFICATION_UNAVAILABLE`), no writes.
13. **Post-verification authorization** — per-item verdict check, then the cross-proposal rules in output order (§16.5).
14. Execute authorized plans in output order (§17). No write occurs before step 13 completes for the whole pass. Each operation is one atomic store change set; a store failure of one operation does not roll back earlier ones (§26).
15. Return `PassResult { status, sourcesRead: sourceId[], observationsPresented: integer, modelCalls: 0|1|2, stageFailure, proposals: [{index, operation, outcome: ADMITTED_EXECUTED | ADMITTED_FAILED | REJECTED | NO_CHANGE, code, verification, recordIds}] }`.
    - `verification` is `null` or the item's closed verdict tokens (§15.5).
    - `operation` is `null` for a proposal whose operation could not be read.
    - **[v1.2]** `stageFailure` is `null` unless `status` is `INTERPRETER_FAILED` or `VERIFIER_FAILED` **and** that status was produced by a classified §15.0 stage-failure condition. In that case it is `{ stage: 'GENERATOR' | 'VERIFIER', reason }`, where `reason` is the applicable closed `STAGE_FAILURE_REASONS` code (§15.0). It is diagnostic only: it grants nothing and is read by nothing in the pass.
    - **[v1.2 clarification — B1]** When an existing v1.1 defensive or internal-exception path produces `INTERPRETER_FAILED` or `VERIFIER_FAILED` without any classified §15.0 condition having caused it, the v1.1 status is preserved unchanged and `stageFailure` is `null`. No cause is inferred; such a failure is never reported as `TRANSPORT_FAILED`, `INVALID_ENVELOPE` or any other §15.0 code; the closed vocabulary is not expanded; and the defensive catch behaviour is not changed to manufacture a classified reason.
    - The result carries ids, closed codes and closed tokens only. It never carries observation, proposal or verdict content, or provider-supplied refusal text (§31.4 preserves refusal details as calibration evidence).

---

# 14. Presentation — [DESIGN; USI-001 §13 precedent]

## 14.1 Observations

- At most `OBS_MAX_PER_PASS` observations, most recent first; each observation is presented whole or not at all (no truncation, so literal checks run against exactly what was presented); total observation block ≤ `OBS_BLOCK_MAX_CHARS`.
- Each observation is rendered as data: `{obsKey, sourceDescription, localDate, localTime, observedAt (ISO UTC or null), utcOffsetMinutes, segments: [{segmentId, authorship, text|data, localDate?, localTime?, utcOffsetMinutes?}]}` (`?` marks a field present only when non-null), where `obsKey` is a pass-local key (`o1`, `o2`, …) mapped back to the stored `{kind, ref}` deterministically (§14.4).
- **Time rendering by level.** Observation-level time fields (`localDate`, `localTime`, `observedAt`, `utcOffsetMinutes`) are always rendered; a missing one is rendered as `null`. The optional segment-level time fields are rendered only when non-null. In both cases the instruction says that unknown local time must not be guessed. The Observation Port semantics of §10.2 are unchanged.
- The gate context holds, for every presented observation, its reference, its structural time fields at observation and segment level, each segment's authorship and text, and its user-authored texts (for E2/U6), so that every structural rule of §16 and §20.2 is checkable without reading data labels.

## 14.2 Concepts and records

- Concepts: `queryRecentConcepts({limit: PRESENTED_CONCEPTS_MAX})`, plus concepts referenced by presented records, to `PRESENTED_CONCEPTS_TOTAL_MAX`; each rendered `{conceptKey, rootConceptKey, labels (≤ 3)}`. The root is computed by `resolveConceptRoot` over concepts fetched with bounded `getConcepts` calls following `mergedInto` (≤ `MAX_MERGE_CHAIN_DEPTH`); an unresolvable chain removes the concept from presentation. Every concept id appearing in the presentation — presented concepts and their roots — is rendered only as a pass-local concept key (§14.4); only the key of a presented concept may be cited in a factor.
- Records: `queryRecordsByConcepts({conceptIdsAny: ≤ 10 most recent presented concept ids, statuses: ['candidate','active'], limit: PRESENTED_RECORDS_MAX})`, then split: **FITME-sourced** records (`inferred_event`, `inferred_pattern`, `coach_generated`) are presented as possible targets, rendered `{recordKey, status, evidenceClass, temporality, factors: [{conceptKey, role, valueDescription}], relationDescription (≤ 160 chars)}`; active `user_stated` records with `safetyFlag: 'STANDARD'` are presented only as user-stated references (§14.3). No record is ever shown with its confidence or its durable `recordId`.
- A record is presented only if all its concepts are presented. Combined concept/record block ≤ `PRESENTED_BLOCK_MAX_CHARS`.
- The whole store is never read; raw history is never loaded beyond the window (GCUK Ch.14, Ch.19).
- **Pass-local concept map.** Every concept document read in the pass (for presentation here, and for owner resolution in §23.1) is held in one in-memory map keyed by `conceptId`, and every root used by the pass is computed by `resolveConceptRoot` over that map. The map is transient: it lives only for the pass, is never persisted, cached across passes or exposed, and is not a concept or observation store.

## 14.3 User-stated references (PD-D2)

- Sources: active `user_stated` User Knowledge records with `safetyFlag: 'STANDARD'` from the §14.2 query, and Typed Memory references from `readUserStatedReferences` when its source is eligible (§11). Together at most `PRESENTED_USER_STATED_MAX`, most recent first.
- Rendered in a separate block marked **"stated by the user — reference only; never a target; never to be restated"**, each with a pass-local key (`u1`, `u2`, …): User Knowledge references as `{uKey, factors: [{conceptKey, role, valueDescription}], relationDescription}`; Typed Memory references as `{uKey, segments}`.
- Observations owned by any user-stated record — presented or not — remain presentable (they may contain other material) but never count as independent support (§23 U4). Ownership is determined by §23.1 for every presented observation, not only for presented references.

## 14.4 Pass-local reference model (v1.1)

| Namespace | Key form | Resolves to | Cited by the Generator in |
|---|---|---|---|
| Observations | `o1`, `o2`, … | the observation's `{kind, ref}` and its gate-context entry | `supporting`, `contradicting`, APPEND `observations`, anchors |
| User-stated references | `u1`, `u2`, … | the referenced record (§14.3) | `reference.uKey` |
| Presented FITME-sourced records | `r1`, `r2`, … | the record's `recordId` and its stored state | `target` |
| Concepts | `k1`, `k2`, … | a `conceptId` | `factors[].conceptKey` |
| Verification items | `p1`, `p2`, … | one plan (§15.4) | the Verifier's `item` |

- Keys are assigned deterministically in presentation order (most recent first where §14.1–§14.3 order so), are distinct across namespaces by their prefix, live only for the pass, and are never persisted, logged into records or returned in `PassResult`.
- The Generator never sees or supplies a durable `recordId`, `conceptId` or evidence reference. Deterministic code resolves every key; the model gains no authority by naming one (R-7).
- A key that does not resolve in **the namespace its field requires** — an unknown key, or a key of another namespace (for example `u1` in `supporting`) — fails deterministically: `UNKNOWN_OBSERVATION` (observation fields and anchors), `USER_STATED_REFERENCE_INVALID` (`reference.uKey`), `INVALID_TARGET` (`target`), `UNKNOWN_CONCEPT_KEY` (`conceptKey`, including the key of a root that is not itself a presented concept). In the Verifier output, an unresolved item key is an attribution failure (§15.6).
- Concept keys are resolved to `conceptId`s before `UserKnowledgeContract.validateFactorProposal` runs, so E.0.2c §19's call-scoped membership check still receives literal members of the presented list (§32 reading).

---

# 15. Model Contracts — Generator and Verifier — [CANON R-1, R-2, R-3, R-6, R-7; DESIGN]

Both stages are bounded interpreters in the MRE-001 family: one request, one attempt, fixed timeout, no retry inside a pass, closed output validated deterministically. **[v1.2]** The text they parse is the answer text extracted by MRS-001 (§15.0) and then passed through `ModelResponseEnvelope.unwrapSingleJsonFence`. Their request profiles are implementation/calibration configuration, not architecture (§27; R-11).

## 15.0 Model-call boundary — [v1.2; CANON MRS-001; DESIGN mapping]

**Processing order (MRS-001 §05):** provider response → **MRS-001 structural extraction** → MRE-001 → `JSON.parse` → E.0.2d stage validation (§15.3, §15.6).

Authority:
- MRS-001 owns response structure.
- MRE-001 owns text-envelope normalization.
- E.0.2d owns the Generator and Verifier semantic contracts.
- MRS-001 grants nothing and has no semantic authority over any proposal, plan, verdict or write.

**Request-contract state.** Both stages are **EXPLICIT-PROFILE** (MRS-001 §08.3); neither is in the MRS-001 FROZEN-CONTRACT inventory (MRS-001 §10.4). Each stage calls `ModelResponseStructure.extractAnswerText(raw, { state: 'EXPLICIT_PROFILE', reasoning })`, where `reasoning` is the mode of **the same profile that constructed the request** (MRS-001 G4). It never omits, defaults or synthesizes that contract.

**Closed `STAGE_FAILURE_REASONS` and precedence.** Each stage determines its failure reason deterministically, in this order. The first condition that holds decides.

| # | Condition | `reason` |
|---|---|---|
| 1 | The transport call threw or rejected | `TRANSPORT_FAILED` |
| 2 | The stage timeout elapsed | `TIMEOUT` |
| 3 | MRS-001 returned `CONTRACT_UNRESOLVED` | `CONTRACT_UNRESOLVED` |
| 4 | MRS-001 returned `REFUSAL` | `REFUSAL` |
| 5 | `stop_reason === 'max_tokens'` (the existing stage-owned truncation rule, applied after refusal and before other structural codes) | `MAX_TOKENS` |
| 6 | Any other MRS-001 structural failure | the MRS-001 code itself: `NOT_A_RESPONSE`, `MALFORMED_BLOCK`, `UNSUPPORTED_BLOCK`, `REASONING_NOT_PERMITTED`, `NO_ANSWER_TEXT` or `MULTIPLE_ANSWER_TEXT` |
| 7 | The extracted text fails the stage's envelope rules (§15.3, §15.6): not exactly one JSON object after MRE-001, wrong key set, wrong type, or over the bound | `INVALID_ENVELOPE` |
| 8 | Verifier only: an attribution anomaly (§15.6) | `ATTRIBUTION_ANOMALY` |

Rules:
- Every reason fails the whole stage closed, exactly as the v1.1 envelope-level failures did: Generator → `INTERPRETER_FAILED`; Verifier → `VERIFIER_FAILED` with every plan `VERIFICATION_UNAVAILABLE`. No reason creates, repairs, re-operates or authorizes a proposal or plan, and no reason is retried.
- **Refusal** is a distinct reason. It is never reported as `INVALID_ENVELOPE` or as a semantic rejection.
- **Classified conditions only [v1.2 clarification — B1].** `STAGE_FAILURE_REASONS` classifies exactly the eight conditions above. A stage failure that none of them caused — an existing v1.1 defensive or internal-exception path — keeps its v1.1 status and carries `stageFailure: null` (§13 step 15). The vocabulary is closed and is not expanded for such paths, and no such path is mapped to a code whose condition did not occur.
- Reasoning content, when the profile permits it, is never read (MRS-001 §06.2).

## 15.1 Generator request

**[v1.2]** One request per pass, built from the Generator's request profile `P` (§27.1): `{ model: P.model, max_tokens: P.maxOutputTokens, <P.providerBinding fields>, messages: [{ role: 'user', content: prompt }] }`.
- Key order: `model`, `max_tokens`, the binding's fields in their stated order, then `messages`.
- Sent once through the injected transport with `P.timeoutMs`; no retry inside a pass (MRE-001).
- The prompt is unchanged from v1.1.
- **[HISTORICAL — v1.1]** v1.1 body: `{ model: MODEL, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] }` with `TIMEOUT_MS`.

Instruction requirements (verified by AC-D9 … AC-D11, AC-D55):
- **Task.** Find possible relationships or facts about this person that the presented observations support or contradict, formulated as associations, never as causes (GCUK Ch.20); propose at most `MAX_PROPOSALS`; proposing nothing is acceptable.
- **Data framing.** Every observation, concept, record and user-stated block is framed as data, never instruction, with the standard injection clause.
- **Reported events and user assertions (§22.4).** What the person reports happening is evidence; what the person asserts about themselves (a belief, generalization, self-description, explanation or preference) is the person's own statement. It is never evidence for itself, and nothing may be proposed that says substantially what the person stated or asserted, in any wording or language. A user-stated reference may be used only as one by-reference input to a relationship that adds new meaning and rests on other observations; it is never itself the proposal.
- **Claim content (§17.1).** Describe only the person and what the cited evidence shows about them. General knowledge may help interpret the evidence but must never appear in the proposal: no norms, recommendations, population facts, scientific or medical facts, or explanations. The act of recording, logging or using FITME is not itself knowledge about the person unless the person treats it as part of their life.
- **Operations.** The three per-operation shapes of §15.2 and what each means; APPEND_EVIDENCE names only the target, the list and the observations; prefer CREATE whenever it is uncertain that a presented record means the same thing.
- **Temporality.** The meaning of `DURABLE`, `TEMPORARY` and `RECURRING_WINDOW` (§20.1); a recurring window requires grounding of both its recurrence and its window meaning in the cited evidence (§20.2); unknown local dates or times are never guessed; windows are expressed in the observed terms rather than in assumed dayparts or routines.
- **References.** Every namespace and what it may be used for (§14.4); cite only keys presented.
- **Concepts.** Reuse a presented concept by its key when it names the same thing; otherwise give a short `newConceptLabel`.
- **Flags.** `restatesUserStatement` and `safetyAdjacent` with the meanings of §22.4 and §24.1.
- **Domain neutrality (R-13).** The instruction contains no example of a coaching domain, activity, food, place, relationship, body part or life event (USI-001 AC-9 precedent). The canonical Safety-risk categories of §24.1 may be stated as **governance vocabulary**, because they define E.0.2d's Safety authority boundary rather than a vocabulary of world situations. Only the minimum governance vocabulary required to enforce that boundary is permitted; it must not be expanded into domain-specific examples, into exhaustive situation rules, or into a closed-world ontology. The semantic learning architecture remains domain-agnostic.

## 15.2 Generator output — per-operation shapes (closed; one JSON object)

```
{ "proposals": [ Proposal, … ] }                      // 0..MAX_PROPOSALS

Proposal (operation "CREATE"):
{ "operation": "CREATE",
  "factors": [ Factor, … ],                           // 1..MAX_FACTORS (E.0.2c)
  "relationText": string,
  "evidenceClass": "SINGLE_OBSERVATION" | "CO_OCCURRENCE" | "RECURRENCE",
  "temporality": "DURABLE" | "TEMPORARY" | "RECURRING_WINDOW",
  "grounding": RecurringWindowGrounding | null,       // §20.2; non-null exactly when temporality is RECURRING_WINDOW
  "supporting": [oKey, …], "contradicting": [oKey, …],
  "reference": { "uKey": uKey, "factorIndex": integer } | null,   // §23: the single by-reference factor, if any
  "restatesUserStatement": boolean,
  "safetyAdjacent": boolean }

Proposal (operation "SUPERSEDE"): every CREATE key, with "operation": "SUPERSEDE", plus
  "target": rKey                                      // the presented candidate being replaced

Proposal (operation "APPEND_EVIDENCE"):
{ "operation": "APPEND_EVIDENCE",
  "target": rKey,
  "list": "supporting" | "contradicting",
  "observations": [oKey, …],                         // ≥ 1, distinct
  "restatesUserStatement": boolean,
  "safetyAdjacent": boolean }

Factor:
{ "conceptKey": kKey | null, "newConceptLabel": string | null,
  "role": "condition" | "subject" | "outcome", "valueText": string | null }
```

- Each operation has exactly its own key set; no key of another operation may appear. APPEND_EVIDENCE carries **no** factors, relation text, evidence class, temporality, grounding or reference: its structure is derived from the trusted target (§16.3; R-1). The model never echoes stored structure as authority.
- `RecurringWindowGrounding` is defined in §20.2.
- Zero proposals is a valid result.

**[HISTORICAL — v1.0]** v1.0 used one combined shape (`targetRecordId` as a durable record id, `appendList`, nullable `relationText`/`evidenceClass`/`temporality`, a mandatory `factors` array for every operation, and a per-factor `userStatedRef`); any deviation failed the whole response. The first calibration showed APPEND proposals with `factors: null` failing the whole response (§31.1).

## 15.3 Generator parsing and proposal-level isolation (R-6)

- **Envelope level — the whole Generator result is `FAILED` (pass `INTERPRETER_FAILED`, no Verifier call, no writes)** when: the transport fails or times out; **[v1.2]** MRS-001 extraction fails, including refusal (§15.0); `stop_reason` is `max_tokens`; the unwrapped text is not exactly one JSON object; the object's key set is not exactly `{proposals}`; `proposals` is not an array; or it has more than `MAX_PROPOSALS` entries.
- **Proposal level — only that proposal is rejected (`MALFORMED_PROPOSAL`)** when, inside a valid envelope, it is not a plain object; its `operation` is not one of `OPERATIONS`; its key set is not exactly that operation's; or any field, factor, grounding or anchor violates its type, bound or vocabulary. The `PassResult` entry keeps the proposal's index, and `operation` when it was readable.
- Every well-formed proposal is evaluated independently. A malformed proposal never consumes any cross-proposal budget and never affects a sibling.
- *Rationale [DESIGN].* A truncated, non-JSON or over-long response is ambiguous as a whole, so it fails as a whole. A single malformed element inside a valid, complete envelope is attributable to its position and independently evaluable; rejecting only it follows the per-entry isolation precedent of USC-001's batched classifier. MRE-001 is unaffected: it governs the envelope, not the validation granularity after it.

## 15.4 Verifier request (R-2)

- **When.** Exactly one Verifier request per pass when at least one plan exists after the pre-verification gate (§16); none otherwise. Never one request per proposal.
- **Body [v1.2].** Built from the Verifier's request profile `V` (§27.1): `{ model: V.model, max_tokens: V.maxOutputTokens, <V.providerBinding fields>, messages: [{ role: 'user', content: prompt }] }`.
  - Key order as in §15.1.
  - Sent once through the injected transport with `V.timeoutMs`; no retry inside a pass (MRE-001).
  - The prompt is unchanged from v1.1.
  - **[HISTORICAL — v1.1]** v1.1 body: `{ model: VERIFIER_MODEL, max_tokens: VERIFIER_MAX_TOKENS, messages: [{ role: 'user', content: prompt }] }` with `VERIFIER_TIMEOUT_MS`.
- **Input blocks**, all rendered deterministically by the coordinator and framed as data with the standard injection clause:
  - `<observations>` — every observation presented to the Generator, rendered identically with the same keys (restatement is judged against all of the person's presented words, not only cited ones);
  - `<user_stated>` — identical to the Generator's block;
  - `<targets>` — for every APPEND or SUPERSEDE item, the target rendered from **trusted stored state**: `{recordKey, factors: [{labels, role, valueDescription}], relationDescription, evidenceClass, temporality}`;
  - `<items>` — one entry per plan, in output order, keyed `p1`, `p2`, …, rendered **from the plan, never from the Generator's raw text**: `{item, operation, claim, supporting, contradicting, target, list, observations}`, where `observations` (APPEND only) is the plan's materialized observations (§16.3 A5) — the exact set that would be written — and `claim` is `null` for APPEND, which generates no claim of its own, and otherwise `{factors: [{labels | newConceptLabel, role, valueText, byReference: uKey | null}], relationText, evidenceClass, temporality, grounding}`, and `grounding` lists each anchor with its resolved structural value (the time field value, or the verified literal text).
- No durable id appears in the Verifier input. Content composed by the Generator appears only as the plan fields that would be persisted or are needed for judgment, and is framed as data like every other block.
- **Instruction requirements.** The Verifier is an independent reviewer: it judges each item on each applicable dimension (§15.5) and may not propose, repair, merge, reorder or re-operate anything; when it cannot decide a dimension it answers `UNCERTAIN`; the same domain-neutrality requirement as §15.1 applies.

## 15.5 Verifier output and dimensions (closed; one JSON object)

```
{ "verdicts": [ {
    "item": pKey,
    "restatement": "NOT_RESTATED" | "RESTATED" | "UNCERTAIN",
    "unsupported": "NONE" | "PRESENT" | "UNCERTAIN" | "NOT_APPLICABLE",
    "safety": "NOT_SAFETY_ADJACENT" | "SAFETY_ADJACENT" | "UNCERTAIN",
    "temporal": "FAITHFUL" | "UNFAITHFUL" | "UNCERTAIN" | "NOT_APPLICABLE",
    "direction": "CONSISTENT" | "INCONSISTENT" | "UNCERTAIN" | "NOT_APPLICABLE"
} ] }
```

Separate closed dimensions, not one composite verdict, so that every rejection is attributable to its cause (calibration and observability).

| Dimension | Question | CREATE / SUPERSEDE | APPEND_EVIDENCE | Passing value |
|---|---|---|---|---|
| `restatement` | Does the claim say substantially what the person stated or asserted (§22.4)? For APPEND: does the target's claim? | applies | applies | `NOT_RESTATED` |
| `unsupported` | Does the persisted content — relation text, values and new concept labels — assert anything the cited evidence and presented references do not show (§17.1)? | applies | must be `NOT_APPLICABLE` | `NONE` |
| `safety` | Does the claim or any cited evidence fall within the Safety-risk boundary (§24.1)? For APPEND, which generates no claim of its own: do **the target's claim** or any of the plan's **materialized observations** (§16.3 A5) fall within it? | applies | applies | `NOT_SAFETY_ADJACENT` |
| `temporal` | Is every temporal statement in the claim — window, recurrence, time of day, calendar period, sequence, duration, and the meaning of its temporality value — faithful to the grounding anchors and cited evidence (§20.3)? | applies | must be `NOT_APPLICABLE` | `FAITHFUL` |
| `direction` | Does every one of the plan's materialized observations (§16.3 A5) bear on the same relationship as the target states, in the declared direction? | must be `NOT_APPLICABLE` | applies | `CONSISTENT` |

- **Direction semantics.** `CONSISTENT` only if every materialized observation — exactly the observations the plan would write; observations removed by deterministic freshness are neither rendered nor judged — bears on **the same relationship the target states** — `supporting`: an instance consistent with the stated association; `contradicting`: an instance in which the stated association visibly does not hold. Evidence about the same concepts in a different relationship, or in the opposite direction from the declared list, is `INCONSISTENT`. Any doubt is `UNCERTAIN`.
- `UNCERTAIN` never passes on any dimension.
- Applicability is fixed by the operation, not chosen by the Verifier; a wrong `NOT_APPLICABLE` (present where the dimension applies, or absent where it does not) makes the entry malformed.

## 15.6 Verifier failure, attribution and mapping (R-2, R-6)

- **Whole Verifier result `FAILED` → pass `VERIFIER_FAILED`; every plan `REJECTED` with `VERIFICATION_UNAVAILABLE`; no writes** — when the transport fails or times out; **[v1.2]** MRS-001 extraction fails, including refusal (§15.0); `stop_reason` is `max_tokens`; the unwrapped text is not exactly one JSON object with key set `{verdicts}` whose value is an array; or **any attribution anomaly** occurs: an entry that is not a plain object, an entry whose `item` is missing or does not resolve to a presented `p` key, or a `p` key that appears more than once. Attribution is the only link between a semantic veto and deterministic authority; any doubt about which plan a verdict belongs to invalidates the whole batch.
- **Item level — only that plan is rejected:** an entry with a valid, unique `p` key whose key set, vocabulary or applicability is wrong → `VERIFICATION_MALFORMED`; a plan with no entry → `VERIFICATION_MISSING`.
- **Mapping without authority.** A verdict is attached to a plan only through the deterministic `p`-key table. The only effect a verdict can have is to reject that plan. Nothing from the Verifier output is read into a plan, record, evidence reference, concept or result, except the closed verdict tokens reported in `PassResult.proposals[].verification`. The Verifier cannot authorize a proposal the pre-verification gate rejected, because such a proposal is never an item.
- A semantic verification failure therefore never results in an unverified write, and a well-formed, attributable verdict for one plan is never discarded because of another plan's malformed entry.
- **[v1.2] Reject-only under structural failure.** A Verifier structural failure or refusal (§15.0) can only make every plan `VERIFICATION_UNAVAILABLE`. It never yields a verdict, a passing token or an authorization, and nothing from a structurally failed response is read.

---

# 16. Deterministic Gate and Authorization — [CANON D-2, R-1, R-2, R-4; DESIGN rules]

The gate runs twice in a pass. The **pre-verification gate** (§16.1–§16.4) evaluates every well-formed proposal independently and turns each admissible one into a plan; it never consults another proposal. **Post-verification authorization** (§16.5) applies the Verifier's verdicts and then the cross-proposal rules. The gate never converts one operation into another, never repairs a proposal, and never trusts a model-chosen key beyond its resolution in the required namespace (§14.4).

## 16.1 Common checks (pre-verification; every well-formed proposal)

- G1 Early model flags: `restatesUserStatement` must be exactly `false` (else `DECLARED_RESTATEMENT`, §22 E4) and `safetyAdjacent` exactly `false` (else `SAFETY_ADJACENT_PROPOSAL`, §24 item 3). These flags can only reject; `false` grants nothing. (Shape and vocabulary validity is established by §15.3 before the gate.)
- G2 Every observation key in `supporting`, `contradicting`, `observations` and every anchor resolves in the observation namespace (else `UNKNOWN_OBSERVATION`, §14.4); no key in both evidence lists; no duplicates within a list (else `INVALID_EVIDENCE`).
- G3 Factors: every `conceptKey` resolves to a presented concept (else `UNKNOWN_CONCEPT_KEY`); `newConceptLabel` per §19 (including `NEW_CONCEPT_SHADOWS_PRESENTED`); the resolved factors are validated by `UserKnowledgeContract.validateFactorProposal` against the presented concept list (E.0.2c §19); values per E.0.2c §10.1 bounds; `MAX_NEW_CONCEPTS_PER_PROPOSAL` (else `NEW_CONCEPT_LIMIT`).
- G4 Explicit-statement rules E1–E5 (§22), user-stated reference rules U1–U7 (§23) and the deterministic Safety rules (§24).
- G5 `S(proposal)` computed with presented roots; a new concept contributes its own (new) identity.
- G6 Every cited observation's `ref.kind` is in `V1_OBSERVATION_REF_KINDS` = `CONVERSATION_TURN`, `DAY_LOG` (§12) → else `SOURCE_NOT_IN_SCOPE`. Evidence-class counts (C2, S2) count observation refs only, never user-stated references.

## 16.2 CREATE

- C1 Shape is the CREATE shape (§15.2); `relationText`, `evidenceClass` and `temporality` are therefore present.
- C2 `supporting.length ≥ 1`; evidence-class rule: `SINGLE_OBSERVATION` ⇔ exactly 1 supporting; `RECURRENCE` ⇒ ≥ 2 supporting; `CO_OCCURRENCE` ⇒ ≥ 1 supporting. `EXPLICIT_STATEMENT` is not in the vocabulary.
- C3 **Temporality grounding (R-4):** `grounding` is non-null exactly when `temporality === 'RECURRING_WINDOW'` (else `INVALID_OPERATION_SHAPE`), and a `RECURRING_WINDOW` grounding must satisfy §20.2 (else its closed grounding code). A recurring window is never admitted because the evidence class is `RECURRENCE` or because of an observation count; `evidenceClass` keeps its evidence-counting meaning and is no longer coupled to `temporality`. **[HISTORICAL — v1.0: C3 was `RECURRING_WINDOW ⇒ evidenceClass === 'RECURRENCE'`.]**
- C4 Not a retry duplicate: the materialized content's `contentKey` must differ from every presented FITME-sourced record's `contentKey` → else `DUPLICATE_OF_PRESENTED` (no write; §26).
- C5 A CREATE whose `S` equals a presented candidate's `S` is **admissible**: same structure may carry a genuinely separate relationship (D-2: prefer CREATE when identity is uncertain).

## 16.3 APPEND_EVIDENCE (conservative; R-1)

The Generator supplies only the semantic choices — target key, list and observations. Everything structural is derived from **trusted stored state** of the resolved target.

- A1 `target` resolves in the record namespace to a presented record that is FITME-sourced and `candidate` or `active` (else `INVALID_TARGET`). Selecting a target confers no authority.
- A2 Shape is the APPEND shape (§15.2): no factors, relation text, evidence class, temporality, grounding or reference; `observations` non-empty and distinct. User-stated references never enter through APPEND (§23 U7).
- A3 **Structure from trusted state.** `S(target)` is computed from the target's stored factors with merge-resolved roots. No model-supplied structure exists or is compared. **[HISTORICAL — v1.0: A3 required the model to echo factors with `S(proposal) === S(target)`.]**
- A4 **Unique grounding:** the set of presented FITME-sourced records with `S === S(target)` contains exactly the target → else `AMBIGUOUS_TARGET` (no write; the evidence is not recorded this pass — the gate never converts a proposal to another operation).
- A5 At least one cited observation ref is not already on the target (else `NO_CHANGE`, §26). The cited observations not already on the target are the plan's **materialized observations**; they are exactly the observations the plan would write, and the only ones rendered to the Verifier for this item.
- **Direction is verified, not trusted.** Whether every materialized observation bears on the target's stated relationship in the declared direction is the Verifier's `direction` dimension (§15.5); only `CONSISTENT` passes. Verification and execution operate on the same materialized set: every observation that may be appended has been semantically verified in the declared direction, and no unverified observation enters the write. Because evidence references are irreversible (§04 item 4), any doubt fails rather than passes.
- Proof boundary: A1, A3–A5 prove eligibility, structural uniqueness and freshness from trusted state. They do not prove that the evidence concerns the same meaning; that is the Verifier's judgment, calibrated by CAL-D2 (§31).

## 16.4 SUPERSEDE

- S1 `target` resolves in the record namespace to a presented FITME-sourced record with `status === 'candidate'` (else `INVALID_TARGET`). An `active` target is never superseded by E.0.2d: changing established knowledge is longitudinal judgment (E.0.2e). Evidence against an `active` record is recorded with `APPEND_EVIDENCE` to `contradicting`.
- S2 Successor validated as CREATE (C1–C3, including temporality grounding).
- S3 Successor `contentKey` differs from the target's (else `SUPERSEDE_IDENTICAL`).
- S4 Successor shares at least one root concept with the target (else `SUPERSEDE_UNRELATED`; a separate relationship is CREATE).
- S5 At least one supporting observation ref of the successor is not on the target (a change of meaning must rest on new evidence).

A proposal passing §16.1–§16.4 becomes a **plan**: for CREATE and SUPERSEDE the materialized draft (§17) with its resolved target and resolved grounding; for APPEND the resolved target, list and materialized observations (§16.3 A5) with their evidence references. If no plan exists, no Verifier call is made (§13 step 11).

## 16.5 Post-verification authorization (R-2)

1. **Verdict check, per plan.** A plan passes only if every dimension applicable to its operation (§15.5) holds exactly its passing value. Otherwise it is `REJECTED` with the code of the first failing dimension in the fixed order **safety, restatement, unsupported, temporal, direction**: `SAFETY_VETO` / `SAFETY_UNCERTAIN`, `RESTATED` / `RESTATEMENT_UNCERTAIN`, `UNSUPPORTED_CONTENT` / `UNSUPPORTED_UNCERTAIN`, `TEMPORAL_UNFAITHFUL` / `TEMPORAL_UNCERTAIN`, `DIRECTION_INCONSISTENT` / `DIRECTION_UNCERTAIN`. All of the plan's verdict tokens are reported in `PassResult.proposals[].verification` regardless of which code is reported. Item-level failures are `VERIFICATION_MALFORMED` and `VERIFICATION_MISSING`; a failed Verifier result rejects every plan with `VERIFICATION_UNAVAILABLE` (§15.6).
2. **Cross-proposal rules, over the plans that passed step 1, in output order:**
   - **Target conflicts.** At most one SUPERSEDE per target: a later SUPERSEDE naming a target already superseded in the pass → `TARGET_CONFLICT_IN_PASS`. An APPEND naming a target that any SUPERSEDE passing step 1 also names → `TARGET_CONFLICT_IN_PASS`, whatever the order (evidence attached to a record whose meaning is being replaced in the same pass is ambiguous).
   - **Per-pass new-concept cap.** `MAX_NEW_CONCEPTS_PER_PASS` over distinct normalized labels (equal labels within a pass map to one concept, §19) → else `NEW_CONCEPT_LIMIT`. The cap is applied after verification so that a plan the Verifier rejects never consumes another plan's budget.
3. Plans that survive steps 1–2 are **authorized** and executed (§17). Nothing is written before this step completes for the whole pass.

---

# 17. Operation Execution and Field Mapping — [DESIGN]

All writes go through `UserKnowledgeStore` configured with `writerAuthority: 'SERVER'`, `producer: 'e02d.consolidation'`, `producerVersion: '1.0.0'`, the pass's `userId`, injected `now`, and the same consent predicate (E.0.2c §16.1).

| Persisted field (CREATE / SUPERSEDE successor) | Value |
|---|---|
| `factors` | from the authorized plan (concept keys resolved to presented `conceptId`s, and new concepts) |
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

- CREATE → `store.createRecord`. APPEND_EVIDENCE → `store.appendEvidence({recordId, list, refs})`, where `refs` are exactly the plan's verified materialized observations (§16.3 A5, §15.5). SUPERSEDE → `store.supersede({predecessorIds: [target], successor})` (FITME→FITME only; E.0.2c §16.2).
- Only authorized plans (§16.5) are executed, in output order, and only after authorization has completed for the whole pass. `ADMITTED_EXECUTED` and `ADMITTED_FAILED` refer to authorized plans.
- A store outcome other than success (`CONFLICT`, `AUTHORITY`, `CONSENT_NOT_GRANTED`, `FAILED`, validation) marks that proposal `ADMITTED_FAILED`; later proposals still run; the pass status becomes `PARTIAL` (§25).
- Neither verdicts nor recurring-window grounding are persisted (§20.5); the record contract is unchanged.

## 17.1 Claim-content boundary — [CANON R-5, R-9; DESIGN mechanism]

**Outside and general knowledge (R-5).** Persisted E.0.2d User Knowledge — `relationDescription`, every `valueDescription`, and every new concept label — describes only **the user** and **what the governed cited evidence supports about that user**. General model knowledge may help the Generator interpret evidence; it must never appear as persisted claim content. No population norm, recommendation, guideline, medical or scientific fact, external explanation, or invented quantity, time, daypart, place, person or routine may become User Knowledge unless a future governed source mechanism grounds it. Enforcement: the Generator instruction (§15.1) and the Verifier's `unsupported` dimension (§15.5); deterministic code cannot decide this and does not claim to.

**Recording artifacts (R-9).** The act of recording, logging, tracking or using FITME is an artifact of how observations are collected. It does not itself become User Knowledge unless it is genuinely relevant knowledge about the person — for example when the person treats it as part of their life — rather than merely a property of observation collection. The rule is process-level: no topic, domain or activity is excluded by name. It is enforced through the Generator instruction and the Verifier's `unsupported` dimension (content that describes only the collection process, not the person, is unsupported as knowledge about the person). Longer-term value, relevance and promotion remain E.0.2e's.

---

# 18. Evidence Handling — [CANON GCUK Ch.12/Ch.14, E.0.2c §11; DESIGN]

- Only references are persisted: `{kind, ref}` exactly as the observation carried it, plus `observedAt` exactly as provided (null when the source records no absolute instant — never synthesized from a local date, D-4).
- New references are `UNVERIFIED` (contract default). Resolution and availability checks are E.0.2e's (E.0.2c §31 "resolver adapters and cadence").
- Both supporting and contradicting evidence may be recorded (D-2). E.0.2d attaches no interpretation to either list beyond the model's proposal; what the balance of evidence means is E.0.2e's.
- No content is copied into evidence (EVIDENCE_REF_PATTERN, E.0.2c §11.1). Bounds: E.0.2c `MAX_EVIDENCE_REFS_PER_LIST` (64); a proposal that would exceed it is rejected (`LIST_TOO_LONG`).

---

# 19. Concept Identity — [CANON D-7, GCUK Ch.10, E.0.2c §13, §19; DESIGN]

- Existing concepts are reused only by citing the pass-local key of a presented concept, which deterministic code resolves to its `conceptId` before call-scoped membership is checked (E.0.2c §19; §14.4). Structural identity always uses merge-resolved roots (§16).
- A new concept is created only through `newConceptLabel` (1..80, NFC). Its label is FITME-composed and is an identity handle, not a claim (E.0.2c §13.1); it is therefore exempt from the literal rules of §22, which govern claim text. It is not exempt from the claim-content boundary (§17.1): a label that carries unsupported content is judged by the Verifier's `unsupported` dimension.
- `NEW_CONCEPT_SHADOWS_PRESENTED`: a `newConceptLabel` whose `normalizeLabelKey` equals that of any label of any presented concept is rejected; the model must reuse the presented concept. (Concepts outside the presented set may still be duplicated by label; no port lookup by label exists — §32 GAP-D2.)
- At most `MAX_NEW_CONCEPTS_PER_PROPOSAL` (pre-verification, §16.1 G3) and `MAX_NEW_CONCEPTS_PER_PASS` (post-verification, §16.5); within a pass, equal new labels (by `normalizeLabelKey`) map to one new concept.
- No merge, unmerge, label addition or removal; no embeddings, synonym table or ontology.

---

# 20. Temporality and Recurring-Window Grounding — [CANON D-4, R-4; DESIGN]

## 20.1 Values

`temporality` says how long a relationship or fact is expected to stay valid (GCUK Ch.09). All three values may be proposed; `expiresAt` is always `null` (`TEMPORARY` stays open-ended, as the contract permits — §04 item 2; USI-001 precedent); expiry and decay are E.0.2e's.

| Value | Meaning |
|---|---|
| `DURABLE` | Expected to hold with no known end. |
| `TEMPORARY` | Expected to hold for a bounded or passing period. |
| `RECURRING_WINDOW` | Holds within a time window that recurs: a time of day, a calendar period, or a position relative to recurring occurrences. |

`RECURRING_WINDOW` is not a synonym for "observed more than once"; repeated observation is what the evidence class `RECURRENCE` records. `evidenceClass` and `temporality` are independent (E.0.2c imposes no coupling, §04 item 14).

## 20.2 Recurring-window grounding (R-4)

**Invariant.** A `RECURRING_WINDOW` proposal must carry governed evidence sufficient to ground **both (1) the recurrence and (2) the temporal/window meaning**. Sufficiency is defined by the structural form of the grounding, **not by observation count**. The deterministic gate verifies that every required anchor exists and satisfies its declared structural form; the Verifier judges whether the claimed recurring meaning is faithful to those anchors (§20.3). No closed list of recurrence situations, activities, events or life contexts exists.

```
RecurringWindowGrounding {
  "recurrence": { "form": "OBSERVED" | "STATED" | "SOURCE",                 "anchors": [Anchor, …] },
  "window":     { "form": "SOURCE_LOCAL" | "SEQUENCE" | "STATED" | "SOURCE", "anchors": [Anchor, …] }
}

Anchor — exactly one of:
  { "kind": "SOURCE_TIME",       "obsKey": oKey, "segmentId": string | null, "field": "LOCAL_DATE" | "LOCAL_TIME" | "INSTANT" }
  { "kind": "USER_EXPRESSION",   "obsKey": oKey, "segmentId": string, "text": string }    // text: 1..ANCHOR_TEXT_MAX_CHARS
  { "kind": "SOURCE_RECURRENCE", "obsKey": oKey, "segmentId": string | null }             // reserved (form SOURCE)
```

Each part carries 1..`MAX_GROUNDING_ANCHORS` anchors; the same anchor may serve both parts. Anchor kinds and forms are closed **process** vocabularies — they say *where* temporal grounding lives in the evidence, never *what* it means — and pass GCUK R4's test: a new value is needed only for a new structural mechanism of recording time or recurrence, never because a new user situation appears.

**Anchor validity (deterministic; else `GROUNDING_ANCHOR_INVALID`).**
- `obsKey` resolves in the observation namespace (else `UNKNOWN_OBSERVATION`, §16.1 G2) and is cited in `supporting`. Grounding never rests on contradicting evidence or on an uncited observation.
- A non-null `segmentId` names a segment of that observation.
- `SOURCE_TIME`: the named structural field is non-null — `LOCAL_DATE`/`LOCAL_TIME` on the segment when `segmentId` is non-null, otherwise on the observation; `INSTANT` requires `segmentId: null` and a non-null `observedAt`. Data labels are never read (§10.2).
- `USER_EXPRESSION`: the segment's authorship is `USER_AUTHORED` or `USER_RECORDED` and it carries text; `normalizeLabelKey(text)` is non-empty and is contained in `normalizeLabelKey(segment.text)` (the USC-001 literal-anchor precedent). Any language.
- `SOURCE_RECURRENCE`: reserved; not admissible in v1.1 (`GROUNDING_FORM_UNAVAILABLE`).
- Identical anchors within one part are invalid.

**Recurrence forms (else `GROUNDING_INSUFFICIENT`).**
- `OBSERVED` — recurrence established by observed occurrences: every anchor is `SOURCE_TIME`, and the anchors reference at least two distinct anchored items, where an anchored item is the pair `(obsKey, segmentId)`. Two occurrences are what "observed recurrence" means; this is the definition of the form, not a universal count rule.
- `STATED` — recurrence expressed in the person's own words (for example "every Sunday", "every evening", "whenever I travel", "after every training session"; illustrative only, never encoded): at least one `USER_EXPRESSION` anchor. **One explicit user observation may be sufficient.**
- `SOURCE` — recurrence represented explicitly by a governed source's structural data. Reserved; not admissible in v1.1 (`GROUNDING_FORM_UNAVAILABLE`). Defining it requires a revision of this SPEC that adds the structural field to the observation contract (§10.2) for an authorized source.

**Window forms (else `GROUNDING_INSUFFICIENT`).**
- `SOURCE_LOCAL` — the window is grounded in the source's own local calendar or clock: at least one `SOURCE_TIME` anchor with field `LOCAL_DATE` or `LOCAL_TIME`. `INSTANT` is not accepted, because the core never converts absolute to local time (A1 §10 item 15).
- `SEQUENCE` — an event-relative window grounded in structural order: at least two `SOURCE_TIME` anchors (any field) on distinct anchored items. The event is whatever the cited evidence refers to; no event vocabulary exists. Whether the anchored order actually shows the claimed relation is the Verifier's judgment.
- `STATED` — the window is expressed in the person's own words: at least one `USER_EXPRESSION` anchor.
- `SOURCE` — reserved, as for recurrence.

**Interaction with other rules.** Grounding never exempts a proposal from any other rule. A recurring window the person stated about the very relationship proposed is still a restatement (§22.4) and is rejected by the Verifier. A `USER_EXPRESSION` anchor is literal text of an observation the proposal already cites; it does not change E2/U6, which compare persisted claim text with user text.

**[HISTORICAL — v1.0]** v1.0 required `RECURRING_WINDOW ⇒ RECURRENCE` (≥ 2 supporting observations) and nothing else; the gate saw no time fields. In the first calibration, 33 of 52 parsed proposals used `RECURRING_WINDOW` and some were admitted with no time information (§31.1).

## 20.3 Observed fact, interpretation and verification

- **Observed temporal fact:** a structural time field of the source (observation or segment `localDate`, `localTime`, `observedAt`, `utcOffsetMinutes`), or the person's literal words. Anchors reference only these.
- **Semantic temporal interpretation:** describing observed facts in the claim. It is permitted only as a faithful re-expression; the observed terms (for example an observed range of local times) are preferred over dayparts or routines.
- **Unsupported inference:** a time, daypart, routine or schedule the evidence does not show (for example an unobserved routine assumed from a clock time, or a clock time labelled with a daypart it does not fit); a window without grounding. The gate rejects ungrounded recurring windows; the Verifier's `temporal` dimension rejects unfaithful temporal content of any proposal, and its `unsupported` dimension rejects invented temporal facts.
- **`DURABLE` and `TEMPORARY`** have no structural grounding requirement; their choice is Generator judgment, checked for faithfulness by the Verifier, and decay or supersession is E.0.2e's.
- **Date-only evidence** can ground calendar meaning, not time-of-day meaning. **An absolute instant without an offset** can ground order (`SEQUENCE`), not local calendar or clock meaning. **A local value with an unknown offset** grounds a window in the user's local frame only; cross-timezone interpretation awaits A1 §10 item 15 (GAP-D1).

## 20.4 Time preservation

The persisted references point back to the source, which keeps its own local date/time; `observedAt` is stored only when absolute. Correct interpretation of local windows across hosts and timezones depends on the user-timezone model (A1 §10 item 15; E.0.2e/g) and on adapters reporting `utcOffsetMinutes` when known. Conversation turns carry no local time today (§04 item 7), so a recurring window resting only on conversation turns can be grounded only by the person's own words (`STATED`) or by structural order of absolute instants (`SEQUENCE`); CAL-D5 measures this.

## 20.5 Grounding is not persisted

Recurring-window grounding and Verifier verdicts are pass-local and are not persisted. The record contract (E.0.2c) is unchanged; the window is expressed in factor values and relation text, and the record's evidence references point back to the sources that hold the anchored times. Persisting grounding for E.0.2e re-verification is deferred (§33).

## 20.6 Immutability

`temporality` is immutable (E.0.2c §14.3); a later change of temporal character is E.0.2e's (supersession).

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

## 22.1 Rules (deterministic, except E4 and E6, which are model judgments enforced fail-closed)

- **E1 — Epistemic type.** Every record E.0.2d writes is FITME-sourced, `candidate`, never `EXPLICIT_STATEMENT` (contract rule 6), and never supersedes or updates a `user_stated` record (targets must be FITME-sourced; E.0.2c §16.2).
- **E2 — No literal restatement.** Let `U` be the user-authored text of every cited observation (both lists), and `T` the proposal's persisted claim text (`relationText` and every `valueText`). With `N(s)` = NFC → lower-case → collapse whitespace → trim (`normalizeLabelKey`), the proposal is rejected (`LITERAL_RESTATEMENT`) when any `N(t)` for `t ∈ T` shares a contiguous substring of length ≥ `LITERAL_OVERLAP_MAX_CHARS` with any `N(u)`, `u ∈ U`, or when any `N(u)` is wholly contained in any `N(t)`. This is computed over the whole cited user text, independent of any span the model chooses.
- **E3 — Authorship.** Only `USER_AUTHORED` and `USER_RECORDED` segments of eligible sources are presented as user material; `FITME_AUTHORED` segments are never presented in V1 (§22.3) and an observation whose only segments are FITME-authored is never presented.
- **E4 — Generator restatement flag (early, reject-only, non-authoritative).** `restatesUserStatement` must be exactly `false`; `true` rejects the proposal (`DECLARED_RESTATEMENT`), and a missing or malformed value makes it malformed (§15.3). `false` grants nothing: the Generator's self-declaration is never the authority that a proposal is not a restatement (R-3).
- **E5 — Owned observations and user-stated records.** Safety-owned observations are never presented (§24). Observations owned by user-stated records never count as independent support (U4), structures that mirror a user-stated record are rejected (U5), and literal disjointness extends to user-stated reference text (U6) (§23).
- **E6 — Independent semantic restatement verification (R-3).** Every plan — CREATE, SUPERSEDE successor and APPEND — is judged by the Verifier's `restatement` dimension (§15.5) against all of the person's presented words and presented user-stated references, with the semantics of §22.4. `RESTATED` rejects; `UNCERTAIN` rejects; only an explicit `NOT_RESTATED` may proceed. A failed or unattributable verification writes nothing (§15.6). The Verifier is the semantic authority for the residual that E1–E5 cannot establish.

## 22.2 Proof boundary (binding)

E1, E3 and E5 are structural guarantees. E2 proves only that persisted claim text does not copy the user's literal words beyond the bound. E4 is an early model declaration that can only reject. **Deterministic code cannot prove that a proposal does not paraphrase, translate, summarize or otherwise semantically restate something the user explicitly stated, and this SPEC never claims it does.** That residual is decided by the independent Verifier (E6) — a model judgment, enforced fail-closed — and its quality is established only by real-model calibration with human review (CAL-D1, CAL-D8, §31), exactly as A2 §08.3 records for CPI anchor extent.

Single-observation candidates are permitted (E.0.2c `SINGLE_OBSERVATION`; pressure test A); canon does not require multiple observations. **[HISTORICAL — v1.0]** v1.0 recorded a calibration-contingent option to require ≥ 2 supporting observations whenever any is user-authored text. The first calibration showed that the adversarial restatements it would target were admitted on two supporting observations (§31.1), so the option would not have addressed them; v1.1 replaces it with E6.

## 22.3 FITME's own words

`assistantText` is FITME-authored and is not returned by the V1 conversation adapter (§10.4). E.0.2d therefore can neither cite nor be prompted with FITME's own prior statements, and cannot learn from them. A later version that presents FITME-authored context must keep E3 (never citable, never user material) and must be calibrated for influence.

## 22.4 Restatement semantics (R-3)

- **Reported events and user assertions.** What the person reports happening, or how something was on an occasion, is an observation and may be evidence. What the person asserts about themselves — a belief, generalization, self-description, explanation or preference — is the person's own statement (A2 invariant 22). A user assertion is never evidence for itself.
- **RESTATED.** A claim (for APPEND: the target's claim) is a restatement when its meaning is substantially what the person stated or asserted in any presented user-authored text or presented user-stated reference — in any language, and at any distance of paraphrase, translation, summary, generalization, narrowing, broadening, hedging, or re-expression through different concepts, roles or factors — so that FITME would represent as its own inference what the person already told it. Combining a user assertion with one or more supporting events does not make the assertion FITME's.
- **NOT_RESTATED.** Requires a positive judgment that the claim adds relational or derived meaning the person did not state or assert — for example an association FITME notices across events the person reported, or a PD-D2 by-reference use of a user-stated fact as one factor of a relationship the person did not assert (§23).
- **UNCERTAIN.** Any doubt. It rejects.
- Applies identically to every domain and language; it uses no list of phrases, synonyms, sentence patterns or topics.

---

# 23. User-Stated Governed Records (Typed Memory, CPI-001, USI-001) — [CANON PD-D2: option U-2; DESIGN rules]

**Ruling.** Governed user-stated information may participate **by reference, as one input** toward a genuinely higher-order inference. It is never rewritten or paraphrased as FITME-inferred knowledge; the inference must add genuinely new relational or derived meaning; it must have independent supporting evidence beyond the user-stated fact itself; user-stated records remain authoritative as user-stated records and are never mutated, superseded or converted by E.0.2d. Safety-owned and Safety-adjacent information remains excluded (§24). The pattern is A2 §08.2 rule 2's, already canonical for USI-001's use of a CPI assertion.

**Example.** A user-stated record "I usually sleep around five hours" must not, by itself, produce a FITME-inferred record "this user tends to sleep around five hours" (rejected by U3, U5 and E2, and by the Verifier's restatement veto, E6). If independent observations — conversation reports or day logs across several days — show poorer training-related outcomes after short-sleep periods, E.0.2d may propose an associative candidate such as "poorer training outcomes have followed short-sleep periods", in which the user-stated sleep fact is one factor by reference and the outcome factor rests on the independent observations.

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

**Owner concept resolution (deterministic; no model; before the Generator call).** U5 compares fully merge-resolved structures, so every concept an owning record cites must be resolved to its current root, using only the canonical primitives `store.getConcepts`, `resolveConceptRoot` and `MAX_MERGE_CHAIN_DEPTH` (E.0.2c §13.4, §20.2):

1. Let `K` be the distinct `conceptIds` of all owning records that are not already in the pass-local concept map (§14.2).
2. Read `K` with `store.getConcepts`, at most `MAX_READ_BATCH` (50) ids per call, adding every returned concept to the map.
3. For every concept in the map whose `mergedInto` names a concept not yet in the map, read those targets the same way. Repeat for at most `MAX_MERGE_CHAIN_DEPTH` (16) follow-up levels. A concept already in the map is never read again.
4. Compute `resolveConceptRoot(id, map)` for every concept of every owning record.
5. Fail closed — the pass ends `OWNERSHIP_READ_FAILED` before any model call — when: any `getConcepts` status is not `OK` (including `CONSENT_NOT_GRANTED`, `REJECTED`/`STORED_DOCUMENT_INVALID`, `READ_BOUND_EXCEEDED`, `FAILED`, `NOT_CONFIGURED`); a requested concept is absent from the result; or `resolveConceptRoot` returns `UNKNOWN_CONCEPT` or `MERGE_CHAIN_INVALID` (including a chain longer than `MAX_MERGE_CHAIN_DEPTH`). An unresolved identity is never read as "different structure".

*Why resolution always succeeds on valid data [VERIFIED].* Every factor concept of every stored record, in any status, exists: a concept cannot be forgotten while any record of any status references it or while any concept is merged into it (E.0.2c §13.7, §20.2, AC-47), and writes require referenced concepts to exist (§13.7). Superseded, rejected and archived owners are therefore resolvable exactly like active ones; a failure indicates invalid data and fails closed.

*Bound — derived from existing constants; no new constant.* Owning records ≤ `|Q| × MAX_QUERY_LIMIT` (§23.1 procedure: ≤ `|Q|` reads of ≤ 50 records), with `|Q| ≤ OBS_MAX_PER_PASS`. Each record has ≤ `MAX_FACTORS` (8) distinct concept ids (E.0.2c §09.2, §10.4), so `|K| ≤ MAX_FACTORS × MAX_QUERY_LIMIT × |Q|`. Each level reads only ids new to the map, at most one per unresolved chain, so each level needs ≤ `⌈|K| / MAX_READ_BATCH⌉` reads and there are ≤ `1 + MAX_MERGE_CHAIN_DEPTH` levels: concept reads ≤ `(1 + MAX_MERGE_CHAIN_DEPTH) × ⌈|K| / MAX_READ_BATCH⌉`. Every term is a canonical E.0.2c limit or this SPEC's `OBS_MAX_PER_PASS`, so the cost is finite and independent of the size of the user's store. The bound cannot be exceeded by valid data: a longer chain is `MERGE_CHAIN_INVALID`, and an over-sized port result is rejected by the store, both of which fail closed. In practice an observation is owned by few records whose concepts are mostly already presented, so resolution takes about one or two reads. No additional numeric cap is required for correctness; any tighter operational cap would be a separate Product/Architecture decision and is not part of this SPEC.

**Use of owning records.** Owning records are used only by deterministic checks (U4, U5, U6) and by the Safety exclusion of §24 item 2; they are never presented to the model unless they also qualify as user-stated references under §14.3. An observation owned by an owning record with `safetyFlag: 'SAFETY_ADJACENT'` is removed from presentation before the Generator call (§24); if no observation remains, the pass ends `NO_OBSERVATIONS`.

**Retention note (recorded, not decided here).** Because forgotten records no longer own anything, an observation whose only owning record was forgotten becomes ordinary material, protected like a never-captured statement: by E2 (deterministic literal protection), by E4 (an early, reject-only, non-authoritative Generator signal), and by E6 (the authoritative semantic Verifier protection), with CAL-D1 as the calibration obligation (§22). Whether forgotten information may later be independently re-inferred is the deferred retention/privacy policy (E.0.2c §11.5); E.0.2d neither decides it nor retains anything to anticipate it.

## 23.2 Gate rules

**Deterministic rules (gate).** A *reference factor* is the factor `factors[reference.factorIndex]` of a CREATE or SUPERSEDE proposal whose `reference` is non-null (§15.2). *Owning records* are the User Knowledge records retained by §23.1. **[HISTORICAL — v1.0: the reference was marked by a per-factor `userStatedRef`; in the first calibration the model placed observation keys there (§31.1).]**

- **U1 — At most one reference.** The single top-level `reference` field structurally permits at most one reference per proposal. `reference.uKey` must resolve in the user-stated namespace and `reference.factorIndex` must name an existing factor → else `USER_STATED_REFERENCE_INVALID` (§14.4).
- **U2 — Reference form.** The reference factor carries `valueText: null`. Its concept is either a presented concept (by key) — for a User Knowledge reference, one of that record's own root concepts — or a new concept whose `newConceptLabel` is a literal substring (under `normalizeLabelKey`) of the reference's rendered text. The executor adds the referenced record to `supporting` as `TYPED_MEMORY_RECORD` or `USER_KNOWLEDGE_RECORD` evidence; the model never cites it directly. → else `USER_STATED_REFERENCE_INVALID`.
- **U3 — New relational meaning (structural proxy).** A proposal with a reference factor has at least two factors and at least one factor whose root concept is not a concept of the referenced User Knowledge record (for a Typed Memory reference: at least one factor other than the reference factor). → else `NO_NEW_MEANING`.
- **U4 — Independent support.** `supporting` contains at least one observation that is **not owned** under §23.1 (by any stored user-stated User Knowledge record, presented or not, or by any user-stated Typed Memory record). → else `NO_INDEPENDENT_SUPPORT`. This applies to **every** CREATE and SUPERSEDE successor, with or without a reference factor: no FITME-inferred record may rest only on observations that user-stated knowledge already owns. Ownership is evaluated only from `OK` reads (§23.1); a pass whose ownership could not be established has already ended.
- **U5 — No mirror of user-stated structure.** For every presented user-stated User Knowledge reference **and every owning record** `r`, a CREATE or SUPERSEDE successor with `S(proposal) === S(r)` is rejected (`MIRRORS_USER_STATED`), whether or not it uses a reference factor: same concepts in the same roles as something the user stated is a structural restatement. Both signatures are **fully merge-resolved** from the pass-local concept map: the proposal's existing concepts were resolved at presentation (§14.2), every owning record's concepts by owner concept resolution (§23.1), and a new concept proposed in this pass is its own root and can equal no stored root. The check applies identically to owners in every stored status (`active`, `superseded`, `rejected`, `archived`) and is fully deterministic for canonical structural identity: a pass in which any owner could not be resolved has already ended `OWNERSHIP_READ_FAILED`.
- **U6 — Literal disjointness from user-stated text.** E2 (§22) is applied with `U` extended to (a) the rendered text of every presented user-stated reference that the proposal names or whose owned observations it cites, and (b) the `relationDescription` and every non-null `valueDescription` of **every owning record** of an observation the proposal cites. These are literal user text (A2 invariant 23); no additional read is made. U6 is a normalized-text comparison only: it reads no concept id or label and has **no concept-merge dependency**; no concept resolution is part of U6.
- **U7 — References never mutated or targeted.** User-stated records are never presented as targets (A1, S1 require FITME-sourced targets), never appended to, superseded, promoted, retracted or relabeled, and user-stated references may enter evidence only through U2 in a CREATE or SUPERSEDE successor.

**Proof boundary.** U1–U7 prove form, citation, structural novelty, independence of support and literal disjointness. They do **not** prove that the resulting relationship adds genuinely new meaning rather than a paraphrase of the user-stated fact; that residual is decided by the Verifier's `restatement` dimension (§22 E6, §22.4) and calibrated by CAL-D1, CAL-D3 and CAL-D8 (§31).

**Repository facts used.** CPI `preference` records carry closed tokens and `sourceTurnId` but not the literal assertion; manual `fact` records carry free text; USI-001 `user_stated` records carry literal `relationDescription`, concepts and `CONVERSATION_TURN` evidence (§04 item 9). `TYPED_MEMORY_RECORD` and `USER_KNOWLEDGE_RECORD` evidence kinds exist (E.0.2c §09.1). Typed Memory is reached only through the Observation Port (A1 §04), never through `js/memory.js`. No `TYPED_MEMORY_RECORD` content is persisted.

---

# 24. Safety Boundary — [CANON D-6, R-8, A3 §07, E.0.2c §24; DESIGN]

Safety protection is layered; no layer weakens another (R-8).

1. `sensitiveContextAccessPolicy: 'NOT_AUTHORIZED'` (§09): every `SAFETY_ADJACENT` source is ineligible.
2. **Deterministic exclusion.** Observations claimed by `SAFETY_INTAKE` (persisted `safety_disclosure` / `risk_characteristic_fact` records citing their `sourceTurnId`, in any status, §04 item 9) are excluded before presentation; only the claim (ids) is read, never Safety content. Observations owned by a `user_stated` User Knowledge record with `safetyFlag: 'SAFETY_ADJACENT'` (§23.1) are likewise excluded before the Generator call; that record's text is never presented.
3. **Generator flag — early, reject-only.** `safetyAdjacent` must be exactly `false`; `true` rejects the proposal (`SAFETY_ADJACENT_PROPOSAL`); a missing or malformed value makes it malformed (§15.3). `false` grants nothing.
4. **Verifier veto — final semantic authority.** Every plan is judged by the Verifier's `safety` dimension (§15.5): for CREATE and SUPERSEDE, against the claim and every cited observation; for APPEND, which generates no claim of its own, against the target's claim and every materialized observation that would be written (§16.3 A5). Only `NOT_SAFETY_ADJACENT` passes; `SAFETY_ADJACENT` → `SAFETY_VETO`; `UNCERTAIN` → `SAFETY_UNCERTAIN`; a failed verification writes nothing. Safety-adjacent material that reached a turn without a persisted Safety record (for example a vetoed or unconsented intake) is caught by layers 3 and 4; CAL-D4 measures both recall and precision (§31).
5. Every record E.0.2d creates has `safetyFlag: 'STANDARD'`; E.0.2d never creates a `SAFETY_ADJACENT` record because it never executes a Safety-adjacent plan.
6. No Safety module is read, imported, modified or given User Knowledge (E.0.2c §24.3–§24.4; A3 §07.4). The semantics of §24.1 are stated in this SPEC and in the instructions as prose; they do not make User Knowledge a Safety input and do not create Safety authority.

## 24.1 Safety-adjacent semantics (R-8)

**Safety-adjacent** means content that falls **within the governing Safety-risk boundary** — the risk categories of the closed Safety canon (SL-001 `RISK_TYPES` other than `NONE` and `INSUFFICIENT`; Risk-Characteristic Sub-Spec `RISK_DOMAINS`; §04 item 15), restated here as semantics for a background consumer. A proposal is Safety-adjacent when its claim **or any cited evidence** concerns:

1. a symptom, pain, injury, illness, or a known or suspected medical condition, described as unusual, acute, persistent, worsening or concerning for the person;
2. medication, medical treatment, or an instruction or restriction from a clinician;
3. an allergy, intolerance reaction or other adverse reaction to something consumed, applied or encountered;
4. restrictive, compensatory or body-image-framed eating or exertion;
5. psychological distress, crisis, or risk of self-harm;
6. dangerous, extreme or unbounded intensity or exposure of any kind;
7. a durable, hard-to-reverse commitment that bears on the person's safety;
8. anything whose interpretation would require diagnosis or treatment authority FITME does not hold.

**Not Safety-adjacent by itself:** ordinary variation in training response, nutrition, sleep, recovery, wellbeing or performance — normal tiredness, soreness, hunger, energy, mood or rest variation — even though such things could theoretically affect health. The question is **not** "could this relate to health?" (in coaching almost everything could) but "does this fall within the Safety-risk boundary above?". Such variation becomes Safety-adjacent only when it meets one of items 1–8.

**Genuine uncertainty** about whether content falls inside the boundary is fail-closed: the Generator flags it and the Verifier answers `SAFETY_ADJACENT` or `UNCERTAIN`, both of which reject.

No diagnosis or medical rule is created: the categories describe risk shape, not conditions, thresholds or treatments, and no list of conditions, symptoms, substances or activities exists anywhere in E.0.2d.

## 24.2 Required Safety-authority clarification (recorded; owner: Safety authority, A3 §07.2)

No canonical document yet defines "Safety-adjacent" as a content test for a governed background consumer's proposals (§04 item 15). The Safety authority must confirm, by a clarification to A3 §07 or a Safety-authority ruling, that §24.1 is the Safety-risk boundary governed background consumers apply, or supply the boundary to be used instead. Until that confirmation, §24.1 applies as this SPEC's fail-closed reading of the existing Safety canon. The clarification is required before Work Item closure (§35). It is distinct from — and does not decide — A3 §07.2's pending ruling on whether User Knowledge may ever be derived from Safety-adjacent or Safety-owned content; E.0.2d stays `NOT_AUTHORIZED`. No Safety production module changes.

## 24.3 Known residual — Generator visibility (deferred architecture decision; not closed)

Safety-adjacent content that deterministic ownership and claim rules (item 2) do not exclude is still **presented to the Generator** and could influence a different, non-Safety-adjacent proposal in the same pass. The Verifier judges each plan's claim and its cited evidence, so content that is neither in the claim nor cited is outside the veto's direct reach. v1.1 deliberately adds no pre-generation Safety screening call (R-8). This residual:
- must be tested in calibration with dedicated cases (CAL-D4 residual subset, §31);
- if the evidence shows post-generation verification does not contain it, **pre-generation Safety screening must be reconsidered before Work Item closure or live activation**;
- is recorded in §33 and must not be silently closed.

---

# 25. Failure and Fail-Closed Behaviour — [CANON GCUK Ch.17; DESIGN]

| Condition | Pass status | Writes | Model calls |
|---|---|---|---|
| Invalid configuration / consumer declaration; **[v1.2]** an invalid or incomplete `generatorProfile` or `verifierProfile`, or any v1.1 field `verifierModel`, `timeoutMs` or `verifierTimeoutMs` (§08, §27.1) | `NOT_CONFIGURED` | none | 0 |
| Learning consent not exactly `true` | `CONSENT_NOT_GRANTED` | none | 0 |
| No eligible source | `NO_ELIGIBLE_SOURCE` | none | 0 |
| Port throws, returns invalid/oversized/unrequested data (including a malformed segment time field) | `OBSERVATION_READ_INVALID` | none | 0 |
| Typed Memory ownership-claim read fails or is invalid (unknown Safety or user-stated ownership) | `OWNERSHIP_READ_FAILED` | none | 0 |
| Any `queryRecordsBySupportingRefs` read returns a status other than `OK` (`CONSENT_NOT_GRANTED`, `REJECTED`, `FAILED`, `NOT_CONFIGURED`) — never read as "not owned" | `OWNERSHIP_READ_FAILED` | none | 0 |
| Owner concept resolution incomplete: a `getConcepts` status other than `OK`, a missing concept, `UNKNOWN_CONCEPT` or `MERGE_CHAIN_INVALID` — never read as "different structure" | `OWNERSHIP_READ_FAILED` | none | 0 |
| Nothing to present | `NO_OBSERVATIONS` | none | 0 |
| Store read for presentation fails | `STORE_READ_FAILED` | none | 0 |
| Generator transport error, timeout, MRS-001 structural failure or refusal **[v1.2]**, `max_tokens` stop, or invalid envelope (§15.0, §15.3); `stageFailure.reason` per §15.0 | `INTERPRETER_FAILED` | none | 1 |
| Zero proposals; or every proposal malformed (`MALFORMED_PROPOSAL`) or rejected by the pre-verification gate | `COMPLETED` | none | 1 |
| Verifier transport error, timeout, MRS-001 structural failure or refusal **[v1.2]**, `max_tokens` stop, invalid envelope, or attribution anomaly (§15.0, §15.6) — every plan `VERIFICATION_UNAVAILABLE`; `stageFailure.reason` per §15.0 | `VERIFIER_FAILED` | none | 2 |
| Plans verified, none authorized (verdict rejections, `VERIFICATION_MALFORMED`, `VERIFICATION_MISSING`, cross-proposal rules) | `COMPLETED` | none | 2 |
| Some authorized operations fail at the store | `PARTIAL` | the successful ones | 2 |
| All authorized operations succeed | `COMPLETED` | all | 2 |

`runPass` never throws. **[v1.2 clarification — B1]** The `INTERPRETER_FAILED` and `VERIFIER_FAILED` rows carry `stageFailure.reason` only for the classified §15.0 conditions they list; the existing v1.1 defensive catch keeps its status unchanged and carries `stageFailure: null` (§13 step 15). No failure produces a permissive fallback, a fabricated observation, evidence, concept, verdict or record, a user prompt, or an unverified write. A proposal-level or item-level failure affects only its own proposal (§15.3, §15.6).

---

# 26. Idempotency, Retry and Concurrency — [DESIGN]

- A pass is safe to re-run over the same window. Retried CREATE of identical content is rejected by C4 (`DUPLICATE_OF_PRESENTED`); retried APPEND of already-attached references is `NO_CHANGE` (store dedup, §04 item 3); retried SUPERSEDE fails S1 because the predecessor is no longer `candidate`.
- Each operation is one atomic store change set with optimistic version checks (E.0.2c §14.1); a concurrent modification yields `CONFLICT` for that operation only, and a later pass may retry.
- Non-identical re-formulations of the same relationship by a later pass may create a duplicate candidate (C5). This is the accepted cost of conservative identity (D-2); reconciliation of duplicates is E.0.2e's longitudinal judgment.
- `passId` is recorded only in the returned `PassResult` (records have no field for it; E.0.2c §10.2 rule 1).
- A pass that ended `INTERPRETER_FAILED` or `VERIFIER_FAILED` wrote nothing; a later pass re-runs both stages from the start (Generator output and verdicts are never cached or reused across passes).

---

# 27. Model-Call and Cost Effect — [DESIGN]

- **At most two model calls per pass:** 0 when any §11/§13 precondition stops the pass; **1** when the Generator runs and no plan survives (zero proposals, all malformed or rejected, or a Generator failure); **2** only when at least one plan survives the pre-verification gate. The Verifier is one batched call regardless of the number of plans. No call per observation, concept, proposal, plan or evidence item (E.0.2c §26; A-G; §32 reading).
- No production caller exists (§29): production model-call counts and pinned request-body hashes are unchanged (AC-D44).
- **Request profiles are implementation/calibration configuration, not architecture (R-11) [v1.2].** Each stage's profile (§27.1), including its model, may be any profile able to satisfy its contract (§15). **[HISTORICAL — v1.1]** v1.1 stated this for the model constants `MODEL` (Generator) and `VERIFIER_MODEL`. The economical model is tried first; if it does not meet the semantic-quality gates (§31), a stronger model may be substituted without changing this architecture. Any model change requires calibration before closure or live use. **[HISTORICAL — v1.0]** The v1.0 implementation and the first calibration used `claude-haiku-4-5-20251001` for the single interpreter.
- Constants (all **[PROVISIONAL]**, §31): **[v1.2]** the default request profiles of §27.1, which replace v1.1's `MAX_TOKENS` 1600, `TIMEOUT_MS` 20000, `VERIFIER_MAX_TOKENS` 800 and `VERIFIER_TIMEOUT_MS` 20000 with the same values; `MAX_PROPOSALS` 6, `MAX_GROUNDING_ANCHORS` 8, `ANCHOR_TEXT_MAX_CHARS` 120, `WINDOW_MAX_DAYS` 14, `OBS_MAX_PER_PASS` 40, `OBS_MAX_SEGMENTS` 12, `OBS_TEXT_MAX_CHARS` 2000, `OBS_BLOCK_MAX_CHARS` 16000, `PRESENTED_CONCEPTS_MAX` 30, `PRESENTED_CONCEPTS_TOTAL_MAX` 40, `PRESENTED_RECORDS_MAX` 12, `PRESENTED_BLOCK_MAX_CHARS` 6000, `PRESENTED_USER_STATED_MAX` 8, `MAX_NEW_CONCEPTS_PER_PROPOSAL` 4, `MAX_NEW_CONCEPTS_PER_PASS` 8, `LITERAL_OVERLAP_MAX_CHARS` 24.
- Paid-call budgets and cost estimates are not architecture; they belong to the calibration execution plan and require explicit Product approval (§31).

## 27.1 Request profiles — [v1.2; CANON MRS-001 §08; DESIGN shape; PROVISIONAL values]

**Profile shape.** Each stage's request profile is a plain object with exactly these keys:

| Key | Meaning |
|---|---|
| `model` | non-empty model id string |
| `reasoning` | `OFF` \| `ON` (MRS-001 §08.4) |
| `effort` | `LOW` \| `MEDIUM` \| `HIGH` \| `NOT_APPLICABLE` (MRS-001 §08.5) |
| `maxOutputTokens` | positive integer: the **total provider-output ceiling**, reasoning plus answer when reasoning is ON (MRS-001 §08.6) |
| `timeoutMs` | positive integer: the stage timeout |
| `providerBinding` | plain object: the provider request fields that express `reasoning` and, where the selected model supports one, the effort control (MRS-001 §08.7) |

**Validation.** A profile is valid only if every key is present and well-typed, and all of the following hold. `reasoning` and `effort` are independent dimensions, validated independently (MRS-001 §08.5) **[v1.2 correction C3]**.
- **Reasoning binding (exact, C4).** `providerBinding.thinking` is consistent with `reasoning` under MRS-001 §08.7, a check over provider values, never over model ids.
  - For `OFF`, it is **exactly** `{type: 'disabled'}`, or exactly `{type: 'between_tools'}` within the MRS-001 §08.7 scope. No additional thinking field is admitted because the `type` matches.
  - For `ON`, it is `{type: 'adaptive'}`.
- **Effort (independent of reasoning, C3).** `effort` is `LOW`, `MEDIUM` or `HIGH` exactly when `providerBinding` carries the provider's effort control, set to that value; it is `NOT_APPLICABLE` exactly when `providerBinding` carries none. This holds under `OFF` and `ON` alike.
  - A profile whose selected model supports an explicit effort control **must** carry it with an explicit value. `NOT_APPLICABLE` is valid only for a model without an effort control, and an implicit provider effort default is never relied on.
  - Whether the selected model supports an effort control is a provider fact established when the profile is approved, beneath MRS-001's canonical semantics. No capability registry is introduced.
- **`between_tools` scope (C5).** A `{type: 'between_tools'}` OFF binding is valid only when the selected provider and model support it, the stage's request is tool-free, and the profile's explicit effort value satisfies the provider's constraint for that mode (MRS-001 §08.5, §08.7).
- **Closed binding keys.** `providerBinding` contains only the provider's reasoning field `thinking` and, where applicable, the provider's effort control. It never contains `model`, `max_tokens`, `messages` or any other request field.

An invalid profile is a configuration failure (`NOT_CONFIGURED`, §25). Nothing branches semantically on the model id, and there is no capability registry.

**Default profiles (all values [PROVISIONAL], §31; the defaults preserve v1.1's intended behaviour):**

| Stage | `model` | `reasoning` | `effort` | `maxOutputTokens` | `timeoutMs` | `providerBinding` |
|---|---|---|---|---|---|---|
| Generator | `claude-haiku-4-5-20251001` | `OFF` | `NOT_APPLICABLE` | 1600 | 20000 | `{ thinking: { type: 'disabled' } }` |
| Verifier | `claude-haiku-4-5-20251001` | `OFF` | `NOT_APPLICABLE` | 800 | 20000 | `{ thinking: { type: 'disabled' } }` |

- **Values.** These are v1.1's model, output bound and timeout, unchanged. They are named here as implementation/calibration configuration under R-11, not as canonized architecture. With reasoning OFF, `maxOutputTokens` keeps v1.1's answer-bound meaning.
- **Binding [EXTERNAL, §04 item 16].** `thinking: {type: 'disabled'}` is the provider's documented explicit "thinking off" value for this model, and it is the exact object with no other thinking field. The model does not support the effort parameter, so `effort` is `NOT_APPLICABLE` and the binding carries no effort control (C3). Both stages are tool-free.
- **Non-default profiles.** A profile for a model with an effort control states its effort explicitly under either reasoning mode (C3). Its OFF binding is chosen within MRS-001 §08.7 (C4, C5).
- **Reasoning-ON profiles.** No reasoning-ON production ceiling, timeout or effort is chosen by this SPEC. A reasoning-ON profile requires its own calibrated total ceiling and is defined only in an approved calibration configuration or a later revision (§31.4).
- **Independent stages.** The two stages may have different approved profiles. Nothing requires the same model or reasoning mode for both.

**v1.1 → v1.2 request-contract change (intentional; not zero drift):**
- **Changes:** each default request body gains exactly one field, `thinking: {type: 'disabled'}`. The body key set changes from `{model, max_tokens, messages}` to `{model, max_tokens, thinking, messages}`, so request bytes and request hashes change.
- **Semantically unchanged:**
  - model ids;
  - output bounds and timeouts;
  - prompts;
  - schemas, verdict vocabulary and validation;
  - Generator and Verifier responsibilities;
  - authorization and write authority.

  The provider's documented reasoning behaviour for this model is the same with no field and with `disabled` (§04 item 16): this is an explicit statement of the existing behaviour, not a change to it.
- **Calibration-only configurability:** the complete Generator and Verifier profiles become configurable through `configure()` (§08). The defaults above apply whenever no profile is configured; there is still no production caller (§29).

---

# 28. Open-World, Platform-Neutral and Non-Causal Invariants — [CANON GCUK Ch.04, Ch.20, A1 §04, A3 §08]

1. No closed list of foods, activities, situations, relationships, body states, recurrence situations, events or life events exists anywhere in E.0.2d; the only closed vocabularies are process/governance ones (`OPERATIONS`, `AUTHORSHIP`, `CLAIMANTS`, grounding forms and anchor kinds (§20.2), verdict dimensions and values (§15.5), reason codes, E.0.2c's vocabularies), each passing GCUK R4's test. The Safety-risk categories of §24.1 mirror the closed Safety canon and describe risk shape, not content.
2. No situation→inference rule, domain mapping, synonym table, embedding or ontology.
3. The core knows no platform, vendor or SDK; sources are adapters beneath the port (A1 §06.2).
4. Relation text is formulated as association; nothing persisted asserts causation, truth or verification (GCUK Ch.20; E.0.2c §23). The Product example "low sleep negatively affects training performance" is persisted, if at all, as an associative candidate (for example "harder or poorer training sessions have followed several low-sleep nights"), never as a causal claim.
5. One authorization architecture (A3 invariant 26): E.0.2d is evaluated by the shared eligibility policy and has no eligibility mechanism of its own.
6. The V1 source set (§12) is a configuration of the source-agnostic core, not an architectural limit; adding an authorized source changes no core rule (§12).
7. AI semantic judgment never grants authority: every Generator output is a proposal that the deterministic gate admits or rejects; the model cannot select a source, widen presentation, choose persisted authority fields, name a durable id, or bypass a rule.
8. **The Verifier is reject-only.** It has no mutation, repair, generation or admission authority; its verdicts can only remove a plan, and a failed or unattributable verification writes nothing.
9. **No calibration-specific logic.** No rule, constant, instruction or exception may refer to, or be tuned against, a specific calibration case; every behaviour must generalize across domains, languages, future sources and future model versions (R-10).

---

# 29. Exact Implementation Scope — [DESIGN]

**[HISTORICAL — v1.0]** The scope below, through §29.1, is the v1.0 baseline scope. It was implemented in commit `1cfec7ae988a1f90b8bfe963e7e20513452fcf60` and is preserved as fact. The v1.1 remediation scope is §29.2; it is **not implemented** and is not yet authorized for implementation.

**New files.** `js/coachDecisionSystem/consolidationContract.js`, `consolidationInterpreter.js`, `consolidationGate.js`, `consolidation.js`; `tests/e02dConsolidationContract.test.js`, `tests/e02dConsolidationInterpreter.test.js`, `tests/e02dConsolidationGate.test.js`, `tests/e02dConsolidationPass.test.js`, `tests/e02dConsolidationStatic.test.js`; `tests/fixtures/consolidationObservationPortTestDouble.js`; `tests/evals/e02dConsolidationCalibration.eval.js` (opt-in; never part of `node --test tests/*.test.js`).

**Modified production files — exactly the E.0.2c amendment for E.0.2d, §13 there (D5-2), and nothing else.**
- `js/coachDecisionSystem/userKnowledgeContract.js` — `RECORD_KEYS` gains `supportingRefIds`; `LIMITS.MAX_QUERY_REF_IDS = 10`; `deriveSupportingRefIds` exported; validator rule 13 (`SUPPORTING_INDEX_MISMATCH`); draft rejection of `supportingRefIds` (`DERIVED_FIELD_SUPPLIED`).
- `js/coachDecisionSystem/userKnowledgeTransitions.js` — `buildRecord` derives the field; `planAppendEvidence` recomputes it for `supporting`.
- `js/coachDecisionSystem/userKnowledgeStore.js` — `PORT_FUNCTIONS` gains `queryRecordsBySupportingRefs`; the consent-gated, validated store read; API export.

No other production file changes. No `index.html`, `sw.js`, `js/app.js`, `functions/**` or `firestore.rules` change; no version bump; `SCHEMA_VERSION` stays `1` (amendment D5-1).

**Modified test fixtures (amendment §11, §13).** `tests/fixtures/userKnowledgeInMemoryPort.js` (the query; local `L` gains `MAX_QUERY_REF_IDS`); `tests/fixtures/userKnowledgePortConformance.js` (new conformance cases; AC-32 operation list via `Store.PORT_FUNCTIONS`).

**New test file from the amendment.** `tests/e02cSupportingRefIndex.test.js` (amendment AC-SR1 … AC-SR8).

**Authorized modifications to existing tests (only these six).**
1. `tests/mre001Wiring.test.js` (W-1): add `consolidationInterpreter.js: 1` to `SITE_FILES` and the W-1 total `19 → 20`.
2. `tests/wp0PhaseE02aZeroDriftProof.test.js`: add `consolidation.js` to `EXPECTED_REQUIRERS` (A3 §11).
3. `tests/e02cUserKnowledgeStore.test.js:422`: the asserted record key list gains `supportingRefIds` (amendment §13).
4. `tests/usi001StoreReads.test.js:107-112` (AC-39): the asserted store-operation set and `PORT_FUNCTIONS` list gain `queryRecordsBySupportingRefs` (amendment §13).
5. `tests/mre001Wiring.test.js` (W-3; implementation-discovered test-compatibility clarification, §29.1): a path-specific Node-only exception for exactly `consolidationInterpreter.js`.
6. `tests/e02cUserKnowledgeStatic.test.js` (AC-36, AC-37/AC-45; implementation-discovered test-compatibility clarification, §29.1): path-specific and usage-specific E.0.2d allowances.

Every other existing test passes unchanged.

**Implementation order within this Work Item [DESIGN].** The E.0.2c amendment changes are implemented and verified first (AC-SR1 … AC-SR8 and the full regression green), then the E.0.2d modules. Implementation begins only after this SPEC passes final Product/Architecture review (amendment D5-2).

## 29.1 Implementation-discovered test-compatibility clarification — [CANON — Product/Architecture ruling during implementation]

**Finding.** Two existing tests, written before E.0.2d existed, reject usages that this SPEC itself requires:
- MRE-001 W-3 (`tests/mre001Wiring.test.js`) requires every `SITE_FILES` entry to be script-tagged in `index.html`. Edit 1 above must list `consolidationInterpreter.js` (its envelope-routed parse site, §15.2; otherwise W-1 coverage fails), while §08 and AC-D40 require that module to stay Node-only.
- The E.0.2c isolation test (`tests/e02cUserKnowledgeStatic.test.js`) admits the `userKnowledgeContract.js` dependency and the token `relationDescription` only in E.0.2c and the named USI-001 modules (AC-36, AC-37/AC-45), while §08 requires three E.0.2d modules to depend on `userKnowledgeContract.js`, and §14.2, §14.3, §17 and U6 (§23.2) require E.0.2d to render, build and compare `relationDescription`.

**Edit 5 — MRE-001 W-3, exactly.** A list `NODE_ONLY_SITE_FILES = ['consolidationInterpreter.js']`. For files in that list, W-3 asserts that the file is **not** script-tagged in `index.html` (enforcing §08 / AC-D40) instead of checking load order. For every other `SITE_FILES` entry, W-3 is unchanged: script-tagged, and loaded after `modelResponseEnvelope.js`. W-1 is unchanged except for edit 1: `consolidationInterpreter.js` remains a registered parse site whose `JSON.parse` count, envelope routing and standard `ModelResponseEnvelope` dependency declaration are all still checked. No other test in the file changes.

**Edit 6 — E.0.2c isolation test, exactly** (the USI-001 §29 allowance pattern):
- (A) `relationDescription`: the AC-36 allowed set gains exactly `js/coachDecisionSystem/consolidation.js` (renders presented records and references, §14.2–§14.3; builds drafts, §17) and `js/coachDecisionSystem/consolidationGate.js` (E2/U6 text comparison, §22–§23.2). No other E.0.2d module (`consolidationContract.js`, `consolidationInterpreter.js`) and no other file is admitted.
- (B) `userKnowledgeContract.js` dependency: the AC-37/AC-45 scan strips, exactly once per file, only the standard two-line UMD declaration `? require('./userKnowledgeContract.js')` / `: window.UserKnowledgeContract;`, and only in `js/coachDecisionSystem/consolidationContract.js`, `consolidationGate.js` and `consolidation.js` (the §08 dependency table). After stripping, every token check applies unchanged, so these modules may not otherwise mention any E.0.2c module or global. In particular they never reference `userKnowledgeTransitions` or `userKnowledgeStore`: the store is injected (§17), and no transitions dependency exists.
- (C) No shell allowance: no E.0.2d module, and no additional E.0.2c module, is admitted in `index.html`, `sw.js` or `js/app.js`. AC-45 is unchanged.
- Every allowance must be scanned (the existing "was scanned" assertion is extended to the new paths). Every other path stays rejected exactly as before.

**Scope of this clarification.** Compatibility only. It changes no Product behaviour, authority, data semantics, activation status, architecture boundary or implementation scope of this SPEC or of E.0.2c. The Node-only requirement (§08, AC-D40) is preserved and is now additionally enforced by W-3. E.0.2c isolation is preserved except for the exact §08-required E.0.2d consumers and usages above. Tests must not be satisfied through indirection or renamed tokens.

## 29.2 v1.1 remediation scope — [DESIGN; IMPLEMENTED in `c83b182` **[v1.2 status note]**]

**New production file.** `js/coachDecisionSystem/consolidationVerifier.js` (§08, §15.4–§15.6).

**Modified E.0.2d production files.**
- `consolidationContract.js` — per-operation shapes, key prefixes, grounding forms and anchor kinds, verdict dimensions and values, new reason codes and constants (§15, §16, §20.2, §27).
- `consolidationInterpreter.js` — Generator instruction (§15.1), per-operation validation and proposal-level isolation (§15.3).
- `consolidationGate.js` — key resolution, derived APPEND (§16.3), temporality grounding (§16.2 C3, §20.2), the `reference` field (§23.2), plan production, post-verification authorization (§16.5).
- `consolidation.js` — key maps (§14.4), segment time in presentation and gate context (§14.1), Verifier dispatch and rendering (§15.4), statuses and `PassResult` fields (§13, §25).

No E.0.2c module, Safety module, `eligibilityPolicy.js`, `index.html`, `sw.js`, `js/app.js`, `functions/**` or `firestore.rules` changes. The E.0.2c record contract is unchanged (§20.5).

**Test and fixture scope (to be authorized with implementation).**
- New: `tests/e02dConsolidationVerifier.test.js`.
- Revised for v1.1 behaviour: `tests/e02dConsolidationContract.test.js`, `e02dConsolidationInterpreter.test.js`, `e02dConsolidationGate.test.js`, `e02dConsolidationPass.test.js`, `e02dConsolidationStatic.test.js`; fixture `tests/fixtures/consolidationObservationPortTestDouble.js` (segment-level time, §10.2, §10.4).
- Existing tests expected to need exact, path-specific edits: `tests/mre001Wiring.test.js` (W-1: register `consolidationVerifier.js` as a parse site, total `20 → 21`; W-3: add it to `NODE_ONLY_SITE_FILES`, following §29.1). The Verifier module is designed not to depend on `userKnowledgeContract.js` and not to use the token `relationDescription` (§08), so no E.0.2c isolation allowance is expected. If implementation finds that any other existing test must change, implementation stops and reports it for a ruling, following the §29.1 precedent.
- Calibration harness `tests/evals/e02dConsolidationCalibration.eval.js` — revised for the two-stage pass and the corpus architecture of §31; opt-in; never part of the default run; no paid call without approval.

**Implementation order [DESIGN].** Contract and keys → per-operation shapes and isolation → gate (derived APPEND, grounding, reference field) → Observation contract segment time → Generator instruction → Verifier module and authorization → coordinator integration → deterministic tests and full regression → calibration harness revision. Deterministic verification completes before any calibration run.

## 29.3 v1.2 scope and MRS-001 atomicity — [v1.2; DESIGN; NOT IMPLEMENTED; implementation requires separate Product/Architecture authorization]

**Atomic dependency [CANON].** v1.2 and MRS-001 are implemented **in one atomic change**. Neither of the following is a valid implementation checkpoint, in any commit, branch or deployment:
- E.0.2d sends EXPLICIT-PROFILE requests while its responses bypass MRS-001;
- MRS-001 is active across the 21 Coach Decision System parse sites while E.0.2d's Generator or Verifier lacks its EXPLICIT-PROFILE contract (MRS-001 §11.3, G1, G4).

Implementation is authorized only after both canonical documents have been reviewed together.

**Modified E.0.2d production files (v1.2's share; MRS-001 §18 lists its own).**
- `consolidationContract.js`: the profile vocabulary references, profile validation (§27.1), the default profiles, and `STAGE_FAILURE_REASONS` (§15.0).
- `consolidationInterpreter.js`: the request from the Generator profile (§15.1); extraction through MRS-001 under the same profile, and the §15.0 reason precedence. Its parse-site conversion is also part of MRS-001's scope.
- `consolidationVerifier.js`: the same for the Verifier (§15.4, §15.6).
- `consolidation.js`: `configure()` with `generatorProfile` and `verifierProfile`, with v1.1 fields rejected (§08); `PassResult.stageFailure` (§13).

Prompts, schemas, the gate, authorization, execution and every E.0.2c module are unchanged.

**Tests (to be authorized with implementation).**
- E.0.2d tests revised for v1.2 behaviour: `tests/e02dConsolidationContract.test.js`, `e02dConsolidationInterpreter.test.js`, `e02dConsolidationVerifier.test.js`, `e02dConsolidationPass.test.js`, `e02dConsolidationStatic.test.js`.
- The key-set assertions at `e02dConsolidationInterpreter.test.js:37` and `e02dConsolidationVerifier.test.js:39` change to the §27.1 v1.2 key set. This is an intentional request-contract amendment, not zero drift.
- The MRS-001 §16.1 fixture migration applies to E.0.2d tests and fixtures.
- If implementation finds that any other existing test must change, it stops and reports it for a ruling (§29.1 precedent).

**Calibration harness (to be authorized with implementation).**
- `tests/evals/e02dConsolidationCalibration.eval.js`: profile overrides through `configure()`, replacing the request-body `model` rewrite and `verifierModel`; profile identity and §31.4 evidence; the refusal class; reasoning-inclusive output accounting; answer-text size; profile-based budget ceilings.
- `tests/evals/e02d/score.js`, `tests/evals/e02d/README.md` and `tests/e02dCalibrationHarness.test.js`: CAL-D7 v1.2 (§31.2) and the §31.4 evidence.
- The corpora are unchanged.

**Implementation order [DESIGN].** MRS-001 primitive → E.0.2d contract (profiles, reasons) → Generator and Verifier request and extraction → coordinator `configure()` and `PassResult` → MRS-001 activation at the 19 FROZEN-CONTRACT sites, with guards and fixture migration → deterministic tests and full regression → calibration harness revision. All of this lands in one atomic change; no intermediate state is a checkpoint.

---

# 30. Test Plan and Acceptance Criteria

All deterministic tests stub the transport; none calls a model. The calibration harness (§31) is opt-in and paid.

The criteria below are the **v1.1** acceptance criteria. **[HISTORICAL — v1.0]** The v1.0 baseline satisfied the v1.0 versions of AC-D1 … AC-D53 (full regression 3719/3719 at `1cfec7a`); AC-D90 was not met (§31.1). Criteria marked *(v1.1)* are new or revised; unmarked criteria are carried over unchanged in substance. **[v1.2]** Criteria marked *(v1.2)* are new or revised in v1.2. The v1.1 implementation (`c83b182`) satisfies the v1.1 criteria; the *(v1.2)* criteria are not yet implemented.

**Configuration, consent, eligibility**
- AC-D1 *(v1.2)*: invalid configuration or consumer declaration → `NOT_CONFIGURED`, zero calls. This includes every invalid or incomplete `generatorProfile` or `verifierProfile` (§27.1), and any configuration supplying `verifierModel`, `timeoutMs` or `verifierTimeoutMs`.
- AC-D2: consent predicate not exactly `true` → `CONSENT_NOT_GRANTED`, zero port/store/model calls.
- AC-D3: `protectedSource: true`, invalid descriptor, `SAFETY_ADJACENT` source, or scoped source without a valid grant (including expired) → excluded; with none eligible → `NO_ELIGIBLE_SOURCE`.
- AC-D4: eligibility is computed only by `EligibilityPolicy.computeEligibility`; no consumer-id or source-id branch exists (static).
- AC-D5: no code path requests, prompts or initiates any authorization (static + behavior).

**Observation Port**
- AC-D6: invalid, oversized, duplicate or unrequested observations → `OBSERVATION_READ_INVALID`, no model call.
- AC-D7: no observation content is stored by any module; persisted evidence contains only `{kind, ref, observedAt}`; `observedAt` is never synthesized.
- AC-D8: Safety-claimed observations (any status) and observations owned by a `SAFETY_ADJACENT` user-stated record are never presented; any Typed Memory or User Knowledge ownership-read failure ends the pass `OWNERSHIP_READ_FAILED` with no model call.
- AC-D57 *(v1.1)*: segment-level `localDate`, `localTime` and `utcOffsetMinutes` are validated (malformed → `OBSERVATION_READ_INVALID`), rendered when non-null, and present in the gate context; the core never reads time from data labels (static + behavior).

**Generator**
- AC-D9 *(v1.1)*: model calls per pass are exactly 0, 1 or 2 as §27 states: 1 when no plan survives (including Generator failure, zero proposals, all malformed, all rejected); 2 only when at least one plan survives; never one call per proposal or plan; each through the injected transport, MRS-001 extraction *(v1.2)*, MRE envelope, no retry.
- AC-D10 *(v1.1; R-13)*: neither the Generator nor the Verifier instruction contains an example of a coaching domain, activity, food, place, relationship, body part or life event, so the semantic learning architecture stays domain-agnostic. The canonical Safety-risk categories of §24.1 are permitted in both instructions as governance vocabulary, limited to the minimum needed to enforce the Safety authority boundary: no domain-specific Safety example, no exhaustive situation rule, and no closed-world ontology built from Safety terms.
- AC-D11 *(v1.1)*: data blocks of both stages are framed as data with the injection clause; an invalid Generator envelope → `INTERPRETER_FAILED`, no Verifier call, no writes.
- AC-D55 *(v1.1)*: per-operation shapes (§15.2): every operation × every key — missing key, extra key, a key of another operation, wrong type or vocabulary, nested factor/grounding/anchor violation — yields `MALFORMED_PROPOSAL` for that proposal only; valid siblings proceed and are evaluated identically to a response containing only them; a malformed proposal consumes no cross-proposal budget.

**Gate**
- AC-D12 … AC-D16 *(v1.1)*: CREATE rules C1–C5, including evidence-class counts, `grounding` non-null exactly for `RECURRING_WINDOW`, and the absence of any `RECURRING_WINDOW ⇒ RECURRENCE` coupling.
- AC-D17 … AC-D21 *(v1.1)*: APPEND rules A1–A5 with structure derived only from trusted target state: a target key resolving to a `user_stated`, non-presented or non-FITME record is rejected; root-resolved uniqueness after a merge; `AMBIGUOUS_TARGET` with two same-signature candidates; `NO_CHANGE` when nothing is fresh; no model-supplied structure is read.
- AC-D22 … AC-D26: SUPERSEDE rules S1–S5, including refusal of `active` targets and grounding validation of the successor.
- AC-D27: E2 literal restatement at, below and above the bound, across both evidence lists and with Unicode normalization.
- AC-D28 *(v1.1)*: the Generator flags reject on `true`; missing or malformed flags are `MALFORMED_PROPOSAL`; `false` alone never authorizes (a plan with both flags `false` and a failing verdict is rejected).
- AC-D29 *(v1.1)*: concept rules of §19 (key resolution, presented membership, shadowing, per-proposal cap before verification, per-pass cap after verification, in-pass label dedup).
- AC-D54 *(v1.1)*: pass-local keys (§14.4): deterministic assignment; unknown and cross-namespace keys fail with the namespace's code; no durable record id, concept id or evidence reference appears in either model input; keys are never persisted or returned.
- AC-D56 *(v1.1)*: recurring-window grounding (§20.2): every recurrence form × every window form; each anchor kind valid and invalid (uncited or contradicting-only observation, unknown segment, null field, `INSTANT` with a segment, non-literal or empty expression, non-user authorship); `OBSERVED` with one versus two distinct anchored items; `STATED` satisfied by one observation; `SOURCE_LOCAL` rejecting `INSTANT`; `SEQUENCE` with two anchored items; `SOURCE` forms and `SOURCE_RECURRENCE` → `GROUNDING_FORM_UNAVAILABLE`; no time is ever read from data labels.
- AC-D35: `SOURCE_NOT_IN_SCOPE` for any cited `HABIT_RECORD`, `PATTERN_RECORD` or other kind outside `V1_OBSERVATION_REF_KINDS`; habit/pattern records are never requested or presented.
- AC-D36: user-stated reference presentation (§14.3): only active, `user_stated`, `STANDARD`, non-Safety records; Safety Typed Memory types never requested or presented; ineligible reference source → no references, pass continues.
- AC-D37 *(v1.1)*: U1–U3 through the top-level `reference` field (single reference, resolution of `uKey` and `factorIndex`, reference form, executor-added reference evidence, structural novelty), including the PD-D2 example fixture ("I usually sleep around five hours" alone → rejected; with independent short-sleep/training observations → admissible).
- AC-D38: U4 independence for every CREATE/SUPERSEDE, with and without a reference factor, with owners **outside the presented set**: `user_stated` User Knowledge records in each of `active`, `superseded`, `rejected` and `archived` owning through `supporting`; Typed Memory `user_stated` records in any status owning through `sourceTurnId`. Not owned: references cited only in `contradicting`, references cited only by FITME-inferred records, and references whose owners were forgotten or erased.
- AC-D39: U5 `MIRRORS_USER_STATED` with fully merge-resolved signatures, against presented references and against owning records that were **not** presented, covering: an owner concept merged one level into a presented concept; a multi-level merge chain; the reverse direction (a presented concept merged into the owner's concept, so both share the current root); the current state after an unmerge (no longer equal → not rejected); owners in each of `active`, `superseded`, `rejected` and `archived`; a proposed new concept never matching a stored root. Structurally different signatures — different roles, a different factor count, or a different root — are never rejected by U5. U7 (references never targeted, appended, superseded or mutated).
- AC-D52: owner concept resolution (§23.1): only concept ids absent from the pass-local map are read, and no concept is read twice; reads use `getConcepts` in batches ≤ 50; chain-following stops after `MAX_MERGE_CHAIN_DEPTH` levels, a longer chain yields `OWNERSHIP_READ_FAILED`; the read count stays within `(1 + MAX_MERGE_CHAIN_DEPTH) × ⌈|K| / 50⌉`; each of a `getConcepts` failure, `CONSENT_NOT_GRANTED`, `STORED_DOCUMENT_INVALID`, `READ_BOUND_EXCEEDED`, a missing concept, `UNKNOWN_CONCEPT` and `MERGE_CHAIN_INVALID` ends the pass `OWNERSHIP_READ_FAILED` with no model call; the pass-local map is never persisted and does not survive the pass (static + behavior).
- AC-D53: U6 literal disjointness against presented-reference text and owning records' `relationDescription`/`valueDescription` gives identical results with and without concept merges (no concept-merge dependency); U6 performs no concept read.
- AC-D47: §23.1 covering procedure: chunks of ≤ 10 refs; `sources: ['user_stated']`; the four statuses; `limit` 50; complete when more than 50 records cite one ref and when several refs share owners; re-queries only refs not yet proven owned; terminates within `|Q|` reads; at least one ref resolved per full page.
- AC-D48: fail-closed ownership: each non-`OK` status of `queryRecordsBySupportingRefs` (including `CONSENT_NOT_GRANTED` and `REJECTED` for a non-matching stored document) and each Typed Memory claim failure ends the pass `OWNERSHIP_READ_FAILED`; no pass ever treats a failed read as "not owned".
- AC-D49: the Typed Memory ownership read is requested once per pass for exactly the presented observation refs; the port test double records that no whole-collection read occurs; Safety types are reported as `SAFETY_INTAKE` regardless of status.
- AC-D50: scale: with 10,000 stored `user_stated` records and 40 observations, the number of ownership reads per pass is bounded by `|Q|`, the number of concept reads by the §23.1 bound, and both are independent of the store size; no list-all or scan path exists in E.0.2d.
- AC-D51: the E.0.2c amendment's AC-SR1 … AC-SR8 pass.

**Verifier and authorization** *(v1.1)*
- AC-D58: the Verifier input is rendered deterministically from plans and trusted state (§15.4): all presented observations with the Generator's keys, the user-stated block, trusted target renderings, one item per plan in output order; the Generator's raw response text never appears; no durable id appears.
- AC-D59 *(v1.2)*: Verifier output validation (§15.6): transport failure, timeout, any MRS-001 structural failure or refusal (§15.0), `max_tokens`, invalid envelope, an entry that is not an object, a missing or unresolved `item`, or a duplicate `item` → `VERIFIER_FAILED`, every plan `VERIFICATION_UNAVAILABLE`, no writes; a wrong key set, vocabulary or applicability in an attributable entry → that plan `VERIFICATION_MALFORMED` only; a plan without an entry → `VERIFICATION_MISSING` only.
- AC-D60: authorization (§16.5 step 1): every dimension × every value × every operation; only the passing value of every applicable dimension authorizes; `UNCERTAIN` never passes; the reported code follows the fixed dimension order; all verdict tokens are reported.
- AC-D61: cross-proposal rules (§16.5 step 2): at most one SUPERSEDE per target; an APPEND to a target any passing SUPERSEDE names is rejected in either order; the per-pass new-concept cap is applied after verification in output order.
- AC-D62: the Verifier can never authorize a proposal rejected by the pre-verification gate (it is never an item), and can never change any plan field, target, evidence, concept or operation (behavior + static: no write path reads Verifier output except closed tokens).
- AC-D63: no write occurs before authorization completes for the whole pass; a `VERIFIER_FAILED` pass writes nothing.
- AC-D64 *(v1.2)*: `PassResult` carries `modelCalls`, `stageFailure` and, per proposal, only closed codes and closed verdict tokens. `stageFailure` is `{stage, reason}` with the applicable closed `STAGE_FAILURE_REASONS` code exactly when `INTERPRETER_FAILED` or `VERIFIER_FAILED` was produced by a classified §15.0 condition, and `null` otherwise — including when a preserved v1.1 defensive or internal-exception path produces either status, whose v1.1 status is unchanged and whose cause is never inferred (§13 step 15, B1 clarification). It carries no observation, proposal, verdict or model text and no provider refusal text.

**Model-call boundary** *(v1.2)*
- AC-D67: request profiles (§27.1). With default configuration:
  - the Generator body is exactly `{model: 'claude-haiku-4-5-20251001', max_tokens: 1600, thinking: {type: 'disabled'}, messages: [one user message]}`, with timeout 20000;
  - the Verifier body is the same with `max_tokens: 800`;
  - key order is as in §15.1.

  With a configured profile, the body is built only from that profile and the timeout is the profile's. Prompts are byte-identical to v1.1.
- AC-D68: profile validation (§27.1). Each of the following → `NOT_CONFIGURED`, zero calls:
  - a missing, extra or ill-typed key;
  - an out-of-vocabulary `reasoning` or `effort`;
  - a binding inconsistent with `reasoning`, including an OFF thinking value that is not exactly `{type: 'disabled'}` or `{type: 'between_tools'}` (for example one with an added `display` field);
  - `effort` and the binding's effort control in disagreement, under either reasoning mode: `LOW`/`MEDIUM`/`HIGH` without an effort control, `NOT_APPLICABLE` with one, or a control value differing from `effort`;
  - a binding containing any field other than the reasoning field and the effort control;
  - each v1.1 field.

  No partial profile is merged with a default. No validation rule mentions a model id, and no rule derives `effort` from `reasoning` (static). An OFF profile with an explicit effort and a matching effort control is valid.
- AC-D69: structural integration (§15.0). For each stage, each MRS-001 failure produces the stage failure with the exact `stageFailure.reason` and no writes:
  - `CONTRACT_UNRESOLVED`, `REFUSAL`, `NOT_A_RESPONSE`, `MALFORMED_BLOCK` (including an untyped `{text}` block), `UNSUPPORTED_BLOCK`, `REASONING_NOT_PERMITTED`, `NO_ANSWER_TEXT` and `MULTIPLE_ANSWER_TEXT`;
  - and likewise `TRANSPORT_FAILED`, `TIMEOUT`, `MAX_TOKENS`, `INVALID_ENVELOPE` and (Verifier) `ATTRIBUTION_ANOMALY`.

  The precedence order of §15.0 holds, including refusal before `MAX_TOKENS` and `MAX_TOKENS` before other structural codes. A Verifier failure makes every plan `VERIFICATION_UNAVAILABLE`. No structural failure creates, repairs or authorizes a proposal or plan.
- AC-D70: refusal is distinct. A refusal response, with empty or partial text, yields reason `REFUSAL`, never `INVALID_ENVELOPE` or a semantic rejection; no provider refusal text enters `PassResult`.
- AC-D71: the profile governs extraction (MRS-001 G4). Each stage passes to MRS-001 exactly `{state: 'EXPLICIT_PROFILE', reasoning}` from the profile that built its request:
  - under `OFF`, a reasoning block → `REASONING_NOT_PERMITTED`;
  - under an `ON` test profile, reasoning blocks are accepted and never read, and the single answer text is parsed;
  - neither stage calls MRS-001 without a contract (static + behavior).
- AC-D72: zero drift for structurally valid single-text responses. For every v1.1 behavioural test, with fixtures migrated per MRS-001 §16.1, every pass status, proposal outcome, code, verdict token, write and `modelCalls` value is unchanged. The only behavioural differences are §27.1's request-body change and MRS-001 Z-7's declared tightening.
- AC-D65: the Generator's raw `restatesUserStatement: false` / `safetyAdjacent: false` never substitute for a Verifier verdict, and Safety, restatement and direction verdicts are evaluated for APPEND plans — Safety against the target's claim and the materialized observations; direction over exactly the materialized observations; the refs written equal the observations verified, and an observation removed by freshness is neither rendered nor written.

**Execution and persistence**
- AC-D30: field mapping of §17 (source from evidence class; `candidate`; `STANDARD`; `expiresAt null`; empty confounds; `originTurnId null`; producer `e02d.consolidation`; `confidence === 0`).
- AC-D46: `isConfidenceAssessed` is `false` for every record E.0.2d creates, `false` after a same-value `setConfidence` (`NO_CHANGE`), and `true` only after a `CONFIDENCE_CHANGED` entry; it reads no prose; no E.0.2d module reads any record's `confidence` (static).
- AC-D31: all writes run under `SERVER`; no `user_stated` record is created, updated or superseded; `correctInferredKnowledge`, `promoteRecord`, `retractRecord`, `archiveRecord`, `setConfidence`, `addConfound`, `recordConfoundCheck`, `raiseSafetyFlag`, merge/label and forget/erase operations are never called (static + behavior).
- AC-D32: store failures of authorized plans produce `ADMITTED_FAILED` and `PARTIAL` without aborting later operations.
- AC-D33: idempotency of §26 (retry of CREATE, APPEND, SUPERSEDE).
- AC-D34: `runPass` never throws under any injected failure.

**Static and scope**
- AC-D40 *(v1.1)*: no E.0.2d module, including `consolidationVerifier.js`, is script-tagged, listed in `sw.js`, referenced by `js/app.js`, or declares the `callClaude: null` dependency shape.
- AC-D41 *(v1.1; v1.2)*: module dependencies are exactly §08 (five modules, the two model stages also requiring `modelResponseStructure.js`); no forbidden reference of §08; no clock, randomness or id generation; timers only in the two model-stage modules (MRE-001 timeouts); `consolidationVerifier.js` does not depend on `userKnowledgeContract.js`.
- AC-D66 *(v1.1)*: no rule, constant, instruction or exception names or targets a calibration case (static scan of the E.0.2d modules against the calibration corpus identifiers and texts; R-10).
- AC-D42: E.0.2c production modules change only as the E.0.2c amendment for E.0.2d §13 specifies (no other operation, transition, authority rule, error code or invariant changes, amendment AC-SR7); `eligibilityPolicy.js`, `capabilityRegistry.js`, `contextComposer.js` and all Safety modules are byte-unchanged.
- AC-D43 *(v1.1; v1.2)*: existing-test modifications are limited to the six v1.0 edits of §29 (including §29.1), the v1.1 edits of §29.2, and the v1.2 edits of §29.3 and MRS-001 §18 as authorized at implementation; production changes are limited to the five E.0.2d modules, and the E.0.2c production changes remain exactly those of the v1.0 baseline (§29).
- AC-D44: production model-call counts and pinned request-body hashes unchanged.
- AC-D45: full deterministic regression passes.

**Calibration**
- AC-D90 *(v1.1; v1.2)*: CAL-D1 … CAL-D8 and the CAL-D4 residual subset (§31) pass on the frozen prompts and frozen stage profiles (§31.4) at thresholds approved at review, decided on the held-out closure corpus, and are recorded in the Closure Record.

---

# 31. Real-Model Calibration — Required Before Closure (not before implementation)

**Safeguards.** Synthetic corpora only (no real user data, no production conversation data, no personal information); operator credential from the environment, never printed, logged or persisted; direct model API, never the production proxy; recorded raw responses for both stages; zero-cost replay; pre-flight and mid-run abort on API failure (USI-001 harness precedent). **No model/API call — calibration, preflight or otherwise — is made without explicit Product approval of that run.** Call counts and cost estimates belong to the run's execution plan, not to this SPEC. Calibration evidence is behavioural evidence; small samples are never presented as statistical proof of a percentage threshold, and results are reported as raw counts.

## 31.1 First calibration run — v1.0 baseline (historical evidence; immutable)

- **Run.** 2026-10-04, with Product approval: 1 preflight + 16 cases × 3 samples = 49 calls, model `claude-haiku-4-5-20251001`, against the v1.0 implementation (`1cfec7a`). Preceded by a zero-network dry-run. Raw evidence: `e02d-calibration-review-real.json` in the operator's OS temporary directory (not in the repository), SHA-256 `91498cc23f28b50d93e65ee926c293836ddad1b5955f76d797f84b92257f3298`. It must not be deleted or overwritten; which durable evidence enters the repository is a pending Product decision (§32).
- **Product/Architecture classification:** CAL-D1 **FAIL**, CAL-D2 **FAIL**, CAL-D3 REVIEW, CAL-D4 **PASS**, CAL-D5 **FAIL**, CAL-D6 PASS, CAL-D7 **FAIL**.
- **Findings that shaped v1.1:**
  - APPEND proposals with `factors: null` failed the whole response 6 times out of 48 (CAL-D7 12.5%), and no APPEND reached the gate (R-1, R-6).
  - A multi-turn paraphrased restatement was admitted in 3/3 samples, and `restatesUserStatement` was `false` on 52/52 parsed proposals (R-3).
  - `RECURRING_WINDOW` appeared in 33/52 proposals and was admitted without any time information (R-4).
  - 25/52 proposals were flagged Safety-adjacent, including ordinary coaching content, which blocked legitimate learning while genuine Safety cases were caught (R-8).
  - Observation keys were placed in `userStatedRef` (R-7).
  - Population norms appeared in proposal content (R-5).
  - Recording-artifact findings appeared (R-9).
- These results concern v1.0 only. They are not evidence about v1.1.

## 31.2 Gates (v1.1)

Each threshold is **[PROVISIONAL]** and is confirmed at closure review. **Zero-tolerance** items are failures at any count.

| Gate | Measures | Indicative threshold |
|---|---|---|
| CAL-D1 Explicit-statement residual (semantic) | Human review of every authorized plan for restatement (§22.4) across the restatement ladder | **zero** on the adversarial restatement subset; ≤ 2% of authorized plans overall |
| CAL-D2 Operation choice and APPEND direction | CREATE vs APPEND vs SUPERSEDE against labels; Verifier `direction` on same-structure/opposite-meaning and ambiguous fixtures | **zero** opposite-meaning or wrong-direction APPEND authorized; operation agreement ≥ 85% |
| CAL-D3 Usefulness and grounding | Human review that authorized plans are grounded, genuine and — when reference-using — add new meaning; positive cases yielding at least one authorized plan | ≥ 90% grounded; ≥ 95% of reference-using plans add new meaning |
| CAL-D4 Safety | Recall on Safety-positive cases (every category of §24.1); precision on Safety-negative ordinary coaching cases (flag and veto rate); **residual subset** (§24.3): Safety-adjacent material present but uncited, alongside a non-Safety proposal | **zero** Safety-positive plans authorized; a materially lower false-flag rate on negatives than the §31.1 baseline, at a target Product sets; residual subset reviewed and reported explicitly |
| CAL-D5 Temporality and time | Correct temporality; grounding forms; Verifier `temporal` on mislabel and invented-routine traps | **zero** invented times, dayparts, routines or windows authorized; ≥ 90% correct temporality |
| CAL-D6 Concept reuse | Reuse of presented concepts vs new concepts; shadowing rejections | shadowing rejection ≤ 5% of proposals |
| CAL-D7 Format, latency, budget (both stages) *(v1.2)* | Stage failures by `stageFailure.reason` (§15.0); `MALFORMED_PROPOSAL` and `VERIFICATION_MALFORMED` rates; p99 latency within each stage's profile `timeoutMs`; provider output-token usage per call measured against the profile's total `maxOutputTokens`, which **may include reasoning** tokens; deterministic extracted answer-text size (characters), reported separately from output-token usage; refusal count and rate per stage, reported separately | **zero** `max_tokens` stops; max provider output usage ≤ 80% of each stage's total `maxOutputTokens`; Generator `INTERPRETER_FAILED` ≤ 5%; Verifier `VERIFIER_FAILED` ≤ 5% |
| CAL-D8 Verifier false veto | Rate at which the Verifier rejects plans that human review labels genuine, grounded, non-restating and non-Safety (by dimension) | Target set by Product at closure review |
| Unsupported content (within CAL-D3/CAL-D5 review) | External-knowledge and recording-artifact traps (§17.1) | **zero** external norms, recommendations or general facts authorized |

Ownership determination and owner concept resolution (§23.1), U4, U5 and U6, key resolution, per-operation shapes and isolation, grounding structure, Verifier attribution and authorization involve no model judgment and are proven deterministically (§30). **CAL-D1 covers only semantic residuals that structural and literal comparison cannot establish**, and never compensates for a structural match, which U5 decides deterministically.

## 31.3 Corpus architecture

- **Development (targeted) corpus.** Cases for the behaviours changed in v1.1. Prompt iteration is permitted against it only, and each paid iteration run requires its own approval.
- **Regression corpus.** The original 16 v1.0 cases (§31.1), run unchanged to track behaviour change; not used for tuning.
- **Held-out closure corpus.** Authored **independently** of whoever edits the prompts; its content hash is recorded before any v1.1 prompt tuning begins; never shown to the prompt author; run only against **frozen prompt hashes**. Any prompt change after a held-out run requires a new prompt version and a new held-out set. **Closure is decided on held-out results only.**
- **Coverage, across development and held-out:**
  - multilingual cases, including at least the product's user language and one other;
  - domains outside fitness and nutrition (for example work, study, caregiving, travel, social life, hobbies);
  - Safety positives for every §24.1 category, and Safety negatives covering ordinary training, nutrition, sleep, recovery, wellbeing and performance variation, with borderline labels fixed by Product (and, where needed, the Safety authority) **before** any run;
  - the §24.3 residual subset;
  - a restatement ladder: verbatim, near paraphrase, translation, generalization, a user assertion plus supporting events, genuine new inference, and valid by-reference higher-order inference;
  - APPEND: same meaning supporting, opposite meaning contradicting, same structure with different meaning, two same-structure candidates, unrelated evidence;
  - temporal grounding: local clock times, date-only patterns, stated recurrence in one observation, event-relative wording, sequence from absolute instants, conversation-only absolute instants (which must not ground local meaning), no temporal information, mislabel traps, invented-routine traps;
  - external-knowledge traps and recording-artifact traps;
  - Verifier false-veto measurement on genuine positives (CAL-D8).
- **Malformed-proposal isolation** cannot be induced reliably with a real model; it is proven deterministically (AC-D55, AC-D59). Calibration reports only the natural malformed rates (CAL-D7).
- **Sampling.** The default is 3 samples per case at the API default temperature **[PROVISIONAL]**. Cross-sample disagreement is classified REVIEW. Exact call counts and budgets are set in each run's execution plan and approved by Product.
- **Classification policy.** FAIL: any zero-tolerance violation, or a gate below its approved threshold on the held-out corpus. REVIEW: cross-sample disagreement; a positive case with no authorized plan; any semantic judgment needing Product inspection, with the raw evidence of both stages preserved. PASS: no FAIL, and every REVIEW resolved by Product/Architecture. A failing result is never reinterpreted to pass.

**No calibration is required before SPEC approval or before deterministic implementation.** Every gate measures model behaviour under a deterministic contract that is complete without it; no deterministic rule depends on a calibration outcome.

## 31.4 Calibration configuration and evidence — [v1.2; DESIGN]

- **Pause.** Real-model calibration remains paused until MRS-001 and v1.2 are implemented and deterministically verified (§29.3). Every paid run still requires explicit Product approval of that run (§31 Safeguards).
- **Configurations name complete profiles.** Every calibration configuration identifies the complete request profile of each stage it exercises (§27.1), not only the model.
  - Overrides are applied through `Consolidation.configure()` (§08); the harness never rewrites a request body.
  - A reasoning-ON profile, including its total ceiling, timeout and effort, is defined in the approved configuration of the run that uses it and is validated by §27.1.
- **Evidence per model call.** Each recorded call identifies:
  - the stage;
  - the model, reasoning mode, effort, total output ceiling, timeout, and the provider binding/configuration;
  - the raw provider response;
  - the stop reason;
  - usage (with output tokens understood as possibly including reasoning);
  - the refusal outcome and the provider-supplied category and details, where present (calibration evidence only, never `PassResult`);
  - the MRS-001 structural extraction outcome;
  - the extracted answer-text size in characters;
  - the semantic stage result, including `stageFailure`.
- **Held-out runs.** A held-out run freezes the stage profiles together with the prompt hashes (AC-D90). A profile change after a held-out run is treated like a prompt change (§31.3).
- **Replay.** Recordings made under v1.1 request bodies do not match v1.2 request hashes and are not v1.2 evidence.
- **Unchanged.** The corpus architecture (§31.3), gates other than CAL-D7, classification policy and sampling rules are unchanged. Run plans continue to set subsets, samples, budgets and stop conditions, each with Product approval.

---

# 32. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Resolved Product/Architecture decisions.**
- **PD-D1 — Bootstrap confidence — RESOLVED:** `confidence = 0` meaning UNASSESSED; no E.0.2c amendment; assessment state defined by `isConfidenceAssessed` over history; promotion of an E.0.2d candidate requires an E.0.2e assessment; no consumer uses an unassessed value (§21). Options BC-2 … BC-4 not adopted.
- **PD-D2 — User-stated governed records — RESOLVED: U-2** reference-only participation as one input to a higher-order inference, with independent support and new meaning; never mutated or converted (§23). U-1 and U-3 not adopted.
- **PD-D3 — V1 source scope — RESOLVED: S-2** Conversation + Day Logs; no Habit/Pattern inputs in V1 (§12). S-1 and S-3 not adopted.

**v1.1 Product/Architecture rulings (approved in principle before authoring; canonized with v1.1).**
- **R-1 — APPEND Option C:** discriminated per-operation shape; target by pass-local record key resolved to trusted state; structure, uniqueness and freshness derived from trusted state; no echoed structure as authority; Verifier direction check before the irreversible append; `UNCERTAIN` rejects; uncertainty still prefers CREATE; selecting a target confers no mutation authority (§15.2, §16.3, §15.5).
- **R-2 — Two fixed, batched model stages:** Generator → deterministic pre-verification gate → conditional, batched, reject-only Verifier → deterministic post-verification authorization → execution; at most two calls per pass; the Verifier runs only when at least one plan survives; closed, fail-closed verdicts; a failed Verifier writes nothing (§13, §15.4–§15.6, §16.5, §27).
- **R-3 — Restatement:** the Generator flag is an early, non-authoritative reject-only signal; the Verifier is the semantic authority; `RESTATED` and `UNCERTAIN` reject; only an explicit `NOT_RESTATED` proceeds; deterministic code is never claimed to establish semantic non-equivalence (§22).
- **R-4 — Temporal recurrence:** a `RECURRING_WINDOW` requires governed evidence sufficient to ground both its recurrence and its window meaning; sufficiency is defined by structural grounding form, not observation count; one explicit user observation may suffice when it grounds the recurrence; no closed list of situations; `RECURRENCE` stays evidence-class semantics; event-relative grounding without an ontology; deterministic structure, semantic faithfulness by the Verifier (§20).
- **R-5 — Outside/general knowledge:** persisted content describes only the user and what cited governed evidence supports (§17.1).
- **R-6 — Proposal-level isolation:** an invalid envelope fails the whole stage; a malformed proposal is rejected alone; valid siblings remain eligible; deterministic cross-proposal limits and order still apply (§15.3, §15.6).
- **R-7 — Reference namespaces:** pass-local keys for observations, user-stated references, presented records, concepts and verification items; unknown or cross-namespace keys fail deterministically (§14.4).
- **R-8 — Safety:** deterministic exclusion, the §24.1 semantics, the Generator flag as early reject-only, and the Verifier's final veto; no pre-generation screening call in v1.1; the Generator-visibility residual recorded and tested (§24).
- **R-9 — Recording artifacts:** a process-level semantic rule, with no topic exclusion; relevance and promotion stay with E.0.2e (§17.1).
- **R-10 — No test gaming:** no logic specific to any calibration corpus; generalization across domains, languages, sources and model versions (§28 item 9, AC-D66).
- **R-11 — Model constants:** no named model is canonized; a model capable of each contract; substitution allowed without architectural change, subject to calibration before closure or live use (§27).
- **R-12 — E.0.2c §19/§26 reading:** see "Canonical reading confirmed (E.0.2c §19/§26)" below.
- **R-13 — AC-D10 and Safety governance vocabulary** (Product ruling after v1.1 authoring): the canonical Safety-risk categories of §24.1 may appear in the Generator and Verifier instructions as governance vocabulary. They are not prohibited domain examples under AC-D10, because they define E.0.2d's Safety authority boundary rather than a closed vocabulary of world situations. Only the minimum governance vocabulary required to enforce that boundary is permitted; it must not be expanded into domain-specific examples, exhaustive situation rules or a closed-world ontology. AC-D10 continues to prove that the semantic learning architecture is domain-agnostic. The Safety architecture of §24 is unchanged (§15.1, §30 AC-D10).

**v1.2 Product/Architecture rulings (MRS-001 adoption; decided before authoring) [v1.2].**
- **R-14 — MRS-001 consumer:** both stages are EXPLICIT-PROFILE. Each profile governs both its request and the MRS-001 extraction of its response. Structural failures and refusal are integrated into the existing fail-closed stage failures, and refusal is distinct. MRS-001 has no semantic authority (§15.0).
- **R-15 — Defaults preserve v1.1:** default profiles keep v1.1's model, output bounds and timeouts, with reasoning stated explicitly as `OFF`. The added `thinking` field is an intentional request-contract amendment, not zero drift (§27.1).
- **R-16 — Configurability:** complete Generator and Verifier profiles are configurable through `configure()`, symmetric in principle. The stages may differ. Calibration overrides profiles, never request bodies (§08, §31.4).
- **R-17 — Output ceiling and CAL-D7:** `maxOutputTokens` is the total provider-output ceiling, with no reasoning-ON production ceiling chosen without calibration evidence; CAL-D7 is restated accordingly (§27.1, §31.2).
- **R-18 — Atomicity:** v1.2 and MRS-001 are implemented in one atomic change, authorized only after both documents are reviewed together (§29.3).
- **B1 — `stageFailure` for unclassified failures (Product/Architecture ruling during the implementation preflight; Option A):** `stageFailure` identifies a reason only for failures produced by a classified §15.0 condition. A preserved v1.1 defensive or internal-exception path that produces `INTERPRETER_FAILED` or `VERIFIER_FAILED` keeps its v1.1 status and carries `stageFailure: null`. No new `STAGE_FAILURE_REASONS` code is added, no cause is inferred, and the defensive catch behaviour is unchanged. A canonical clarification of the diagnostic field, not a new failure behaviour (§13 step 15, §15.0, §25, AC-D64).

**Pending Product/Architecture decisions and dependencies (v1.2).**
- **[v1.2]** Product/Architecture review of v1.2 together with MRS-001 — **RESOLVED / APPROVED**.
- **[v1.2]** Separate authorization and execution of the joint atomic implementation of v1.2 and MRS-001 (§29.3).

**[HISTORICAL — v1.1] Pending Product/Architecture decisions and dependencies (v1.1)** — the items still open are carried forward:
- Authorization of v1.1 implementation (§29.2). **[v1.2] Resolved:** implemented in `c83b182`.
- The Safety-authority clarification of §24.2 (owner: Safety authority). Required before Work Item closure; not required before implementation.
- Which durable calibration evidence from §31.1 enters the repository (the raw file stays outside the repository until then).
- Calibration execution plans, budgets, held-out authorship, and the CAL-D4 precision and CAL-D8 targets (§31).
- The §24.3 residual decision, after calibration evidence exists.

**Canonical reading confirmed (E.0.2c §19/§26) — R-12.** E.0.2c §19 describes the interpreter that proposes a record as shown the presented concepts "in its single bounded call", fixes that concept resolution happens "inside the bounded intake/consolidation call that proposes a record — one call per operation, never one call per concept, relationship, memory or evidence item (A-G)", and §26 fixes the cost shape "never one call per concept/relationship/memory/evidence item". The single-call requirement governs the **proposing and concept-resolution call** and prohibits call counts that scale with concepts, relationships, memories or evidence items. In v1.1:
- that call is the Generator, still exactly one per pass;
- concept resolution still happens only inside it, by concept keys resolved to members of its presented list before `validateFactorProposal` (§14.4);
- the Verifier proposes no knowledge, resolves no concept, changes no concept, and is one fixed, batched call per pass whatever the number of plans.

It therefore does not violate the architectural intent of E.0.2c §19/§26. No direct canonical contradiction was found, and **E.0.2c is not amended**. The same holds for GCUK, A1, A2, A3 and MRE-001: v1.1 adds an MRE-enveloped parse site under MRE-001's unchanged rules and strengthens, without replacing, the deterministic mechanism A2 §07 requires.

**Canonical reading confirmed (A2 §05 item 5).** "Persisting any AI-composed semantic summary requires a separate canonical approval" is item 5 of invariant 23, which applies "for a User Knowledge record with `source: 'user_stated'`" (A2 §05.1). A2 §05.2 states explicitly: "this constrains only what a governed intake may place in those fields. **FITME-inferred records are unaffected.**" GCUK Ch.09 freezes `relationDescription` as "open, bounded prose"; A2 §10.1 assigns E.0.2d to propose FITME-inferred candidate records; the record contract requires a 1..400-character `relationDescription` (E.0.2c §10.1); E.0.2c §27 pressure test A shows an inferred record with such prose; and every E.0.2d record carries interpretation provenance (`source: inferred_*`, `provenance.producer`). E.0.2d is therefore authorized to persist AI-composed descriptions on FITME-inferred records. No ambiguity found.

**Repository gaps.**
- GAP-D1: no timezone/offset is stored for conversation turns or day logs (§04 items 7–8); recurring-window interpretation across timezones awaits A1 §10 item 15 (§20.3).
- GAP-D6 *(v1.1)*: no governed source yet represents recurrence in structural data; the `SOURCE` grounding forms are reserved until one does (§20.2).
- GAP-D2: no port lookup of concepts by label; concept duplication outside the presented set remains possible (§19).
- GAP-D3: no sleep, perceived-effort or workout-detail observations exist (§04 item 8); early evidence for such relationships is conversational.
- GAP-D4: no `EVIDENCE_REF_KINDS` value for body history or recommendation feedback.
- GAP-D5 — **RESOLVED.** Formerly: E.0.2c had no evidence-keyed query, so ownership could be checked only for presented records. Resolved by the canonical E.0.2c amendment for E.0.2d (`docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md`, canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`): the `supportingRefIds` index and `queryRecordsBySupportingRefs`, consumed by §23.1 and rules U4–U6, implemented within this Work Item (§29). No activation dependency remains on GAP-D5.

**Canonical conflicts.** None found, including in v1.1 authoring (see the E.0.2c §19/§26 reading above) and in v1.2 authoring. **[v1.2]** On R-11: the default profiles name a model as [PROVISIONAL] implementation/calibration configuration, as v1.1 named numeric constants; no model is canonized as architecture, and substitution remains a configuration change subject to calibration. MRS-001 is consumed without amendment. Wiring test 37 (§04 item 11) is satisfied by the injected-transport design (§08), not by an exception.

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
| **Generator-visibility Safety residual (§24.3)** — whether pre-generation Safety screening is required. Open; must be decided on calibration evidence **before Work Item closure or live activation**; not closed by v1.1 | Product/Architecture, with the Safety authority |
| Safety-authority clarification of the §24.1 boundary for background consumers (§24.2) | Safety authority (A3 §07.2) |
| `SOURCE` recurrence and window grounding forms for a source whose structural data represents recurrence (§20.2, GAP-D6) | Later revision of this SPEC with the first such authorized source |
| Persisting recurring-window grounding for E.0.2e re-verification (§20.5) | E.0.2e / a later E.0.2c amendment if required |
| Durable upstream ownership of recognized statement spans that were not captured (strengthening U4 beyond persisted records) | Later Work Item (A2 §08.2 precedent) |

---

# 34. Compatibility with E.0.2e and E.0.2g

- **v1.1** changes no record field, status, evidence shape or store operation. E.0.2e and E.0.2g receive the same record shape as under v1.0. The Generator/Verifier split, verdicts, keys and grounding are internal to the pass, and nothing of them is persisted.
- **E.0.2e** receives `candidate` records with immutable content, evidence references in both lists (`UNVERIFIED`), an empty confound list, `confoundCheck: null`, bootstrap `confidence = 0` with `isConfidenceAssessed === false`, producer `e02d.consolidation`, by-reference citations of user-stated records, and supersession links. Everything E.0.2e needs to judge longitudinally is in E.0.2c fields; E.0.2d adds no field of its own (the `supportingRefIds` index added by the E.0.2c amendment for E.0.2d is a derived, meaning-free index on every record, usable by E.0.2e only as a bounded evidence-keyed read). E.0.2e's SPEC must adopt §21 invariants 1–3: its first `setConfidence` is the first real assessment; it may not promote an E.0.2d candidate before that; and it never uses an unassessed value.
- **E.0.2g** must adopt §21 invariants 3–4: it selects only through `isUsableKnowledge` and never reads, ranks by or thresholds on the confidence of a record whose `isConfidenceAssessed` is `false`.
- **E.0.2g** sees nothing from E.0.2d until E.0.2e has assessed and promoted it (§06, §21). E.0.2d's concepts are ordinary Concept Identity documents usable by concept-keyed retrieval (E.0.2c §20.1).
- **USI-001** is unaffected: E.0.2d never touches `user_stated` records; USI-001 can correct FITME-inferred records through its own governed path (E.0.2c §15.4) when live.

---

# 35. Status, Activation and Closure

**Two distinct lifecycles.** This document's status (the *specification*) and the *E.0.2d Work Item's* status are separate. Specification closure freezes the approved design; it does not mean the Work Item is implemented, verified, calibrated, closed or live.

- **[v1.2] Specification status: E.0.2d Consolidation SPEC v1.2 — APPROVED.** Product Review: APPROVED. Architecture Review: APPROVED. Reviewed jointly with MRS-001. v1.2 supersedes v1.1 as the normative specification of this Work Item. v1.2 is not implemented.
- **[HISTORICAL — v1.1] Specification status: E.0.2d Consolidation SPEC v1.1 — CANONICAL / CLOSED (SPECIFICATION).** Product Review: APPROVED. Architecture Review: APPROVED. The v1.1 architecture was approved in principle before authoring (R-1 … R-12, §32), with R-13 ruled after authoring, and the authored text was approved for canonization after final verification. v1.1 supersedes v1.0 as the normative specification of this Work Item. **[HISTORICAL — v1.0]** The v1.0 specification was CANONICAL / CLOSED: Product/Architecture final approval of PD-D1, PD-D2 / U-2, PD-D3, the GAP-D5 resolution, deterministic ownership determination, deterministic merge-resolved U5, text-only U6, CAL-D1 as a semantic-only boundary, the E.0.2c amendment integration, the Observation Port architecture, and the implementation and deterministic-test scope; canonization commit `0eff66dfbb6aa21342499b7aa4a613625b313135`.
- **Work Item status [v1.2]: v1.1 IMPLEMENTED — DETERMINISTICALLY VERIFIED — CALIBRATION INFRASTRUCTURE READY — REAL-MODEL CALIBRATION PENDING (PAUSED) — v1.2 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE.**
  - **v1.1:** implemented in commit `c83b1825795bf68582aada900673816109752c62`. Its calibration infrastructure was implemented in commit `f6ae1a104f472420f92d6cffce2e4516049e0345`, with full deterministic regression 3767/3767 and zero network attempts.
  - **Calibration:** no real-model calibration of v1.1 has run. Calibration is paused until MRS-001 and v1.2 are implemented together and deterministically verified (§29.3, §31.4).
  - **v1.2:** not implemented.
  - **[HISTORICAL — v1.1]** The previous Work Item status line read: v1.0 BASELINE IMPLEMENTED / DETERMINISTICALLY VERIFIED / CALIBRATION FAILED — v1.1 REMEDIATION CANONICALIZED — v1.1 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE.
  - **[HISTORICAL — v1.0]** Implementation commit `1cfec7ae988a1f90b8bfe963e7e20513452fcf60` (the v1.0 SPEC together with the E.0.2c amendment for E.0.2d); Product/Architecture implementation review approved; full deterministic regression 3719/3719.
  - The first real-model calibration of that baseline ran once with Product approval (49 calls) and failed CAL-D1, CAL-D2, CAL-D5 and CAL-D7 (§31.1).
  - No production caller, scheduler, shell wiring or activation exists. No further model/API call may be made without separate explicit Product approval.
- v1.2 implementation, when authorized, is deterministic, testable-not-live and atomic with MRS-001, in the §29.3 order; deterministic verification completes before any calibration (§31).
- **Work Item CLOSED** requires all of the following:
  - v1.2 canonized and implemented together with MRS-001 **[v1.2; formerly "v1.1 canonized and implemented"]**;
  - AC-D1 … AC-D72 (including the amendment's AC-SR1 … AC-SR8) passing **[v1.2: AC-D67 … AC-D72 added]**;
  - AC-D90: CAL-D1 … CAL-D8 and the CAL-D4 residual subset decided on the held-out closure corpus with Product approval and recorded in the Closure Record;
  - the Safety-authority clarification of §24.2 recorded;
  - the §24.3 residual decided on calibration evidence;
  - full regression passing;
  - no production caller.
- LIVE is not authorized by Work Item closure. It additionally requires the §24.3 residual to be resolved (including pre-generation Safety screening if the evidence requires it), E.0.2e (cadence, assessment, promotion, adopting §21), the live-persistence activation Work Item (E.0.2c §21.4 including a governed correct/withdraw/forget path for FITME-sourced records), a hosting decision (A1 §10 item 13), and a separate Product/Architecture activation approval.

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
- **v1.0** (implementation-discovered test-compatibility clarification; Product/Architecture ruling during implementation) — Two existing tests written before E.0.2d existed reject usages this SPEC requires: MRE-001 W-3 requires every `SITE_FILES` entry to be script-tagged, while `consolidationInterpreter.js` is a required parse site that must stay Node-only; and the E.0.2c isolation test admits the `userKnowledgeContract.js` dependency and `relationDescription` only for E.0.2c and USI-001. New §29.1 authorizes exactly two further edits: a path-specific W-3 Node-only exception for `consolidationInterpreter.js` (which asserts it is not script-tagged), and path- and usage-specific E.0.2d allowances in `tests/e02cUserKnowledgeStatic.test.js` (`relationDescription` in `consolidation.js` and `consolidationGate.js`; the standard contract UMD declaration in `consolidationContract.js`, `consolidationGate.js` and `consolidation.js`; no shell allowance). Authorized existing-test edits: four → six; AC-D43 updated. No change to Product behaviour, authority, data semantics, activation, architecture boundary or implementation scope; the Node-only requirement and E.0.2c isolation are otherwise preserved. Follows the USI-001 revision-1 test-compatibility precedent.
- **v1.0** (implementation status) — Status metadata only (Product/Architecture implementation review approved): Work Item status NOT IMPLEMENTED — NOT CALIBRATED — NOT LIVE → IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — NOT CLOSED — NOT LIVE (header, §01, §35), recording implementation commit `1cfec7ae988a1f90b8bfe963e7e20513452fcf60` and the full deterministic regression 3719/3719. Specification status unchanged (CANONICAL / CLOSED). CAL-D1 … CAL-D7, AC-D90 and the Closure Record remain required; no calibration or model/API call has been run; no production caller or activation exists. No normative change. Follows the USI-001 implementation-checkpoint precedent.
- **v1.1** (remediation revision of the same Work Item; architecture approved in principle by Product/Architecture before authoring; text pending review).
  - **Trigger.** The first real-model calibration of the v1.0 baseline (2026-10-04; 49 calls; evidence SHA-256 `91498cc2…f3298`) was classified CAL-D1, CAL-D2, CAL-D5 and CAL-D7 FAIL, CAL-D3 REVIEW, CAL-D4 and CAL-D6 PASS (§31.1).
  - **Normative changes.**
    - Two fixed, batched model stages: Generator, then a conditional, reject-only Verifier, with at most two calls per pass (§13, §15, §27).
    - Discriminated per-operation output shapes and proposal-level isolation under envelope-level whole-response failure (§15.2–§15.3).
    - Pass-local `o`/`u`/`r`/`k`/`p` keys (§14.4).
    - APPEND Option C: trusted-state structure, A3 rewritten, Verifier direction check (§16.3).
    - C3 replaced: recurring-window grounding of both recurrence and window meaning, by structural form and not by observation count, with forms `OBSERVED`/`STATED`/`SOURCE` and `SOURCE_LOCAL`/`SEQUENCE`/`STATED`/`SOURCE` and anchors `SOURCE_TIME`/`USER_EXPRESSION`/`SOURCE_RECURRENCE`; evidence class decoupled from temporality (§16.2, §20).
    - Segment-level structural time in the Observation contract (§10.2, §10.4).
    - Verifier contract with five closed dimensions, applicability rules, attribution-based failure semantics, and post-verification authorization with fixed code order, target-conflict rules and the per-pass new-concept cap after verification (§15.4–§15.6, §16.5).
    - Restatement semantics, with E4 non-authoritative and the new E6 (§22).
    - The `reference` field replacing per-factor `userStatedRef` (§23.2).
    - Safety layering with the §24.1 Safety-adjacent semantics mirroring the closed Safety canon, the required Safety-authority clarification (§24.2) and the recorded Generator-visibility residual (§24.3).
    - Claim-content boundary for outside knowledge and recording artifacts (§17.1).
    - Model constants made implementation/calibration constants; new Verifier and grounding constants (§27).
    - New statuses and codes (`VERIFIER_FAILED`, `MALFORMED_PROPOSAL`, verification codes, grounding codes, `UNKNOWN_CONCEPT_KEY`, `TARGET_CONFLICT_IN_PASS`).
    - Calibration architecture with development, regression and held-out corpora, CAL-D8 and the CAL-D4 residual subset; no paid-call budget canonized (§31).
    - Revised ACs AC-D9 … AC-D43, AC-D90 and new AC-D54 … AC-D66 (§30).
    - v1.1 implementation scope (§29.2).
    - E.0.2c §19/§26 canonical reading recorded (§32, R-12).
  - **Preserved.** v1.0 implementation and calibration facts are kept as **[HISTORICAL — v1.0]**; PD-D1, PD-D2 and PD-D3 are unchanged.
  - **Final-verification corrections (Product/Architecture authorized; consistency and completeness only; architecture not reopened).**
    - **R-13 recorded:** Product ruling on AC-D10 and Safety governance vocabulary — the §24.1 Safety-risk categories may appear in both instructions as the minimum governance vocabulary for the Safety authority boundary, never expanded into domain examples, exhaustive situation rules or a closed-world ontology (§15.1, §30 AC-D10, §32).
    - §23.1 retention note: protection restated as E2 (deterministic literal), E4 (early, non-authoritative), E6 (authoritative semantic Verifier) and CAL-D1; "before the model call" → "before the Generator call".
    - APPEND Safety judged against the target's claim and the materialized observations (§15.5, §24 item 4).
    - APPEND direction verification and execution operate on the same materialized observation set (§15.4, §15.5, §16.3 A5, §16.4, §17, AC-D65).
    - §04 verification baselines made explicit per item.
    - §14.1 time rendering stated by level.
    - No normative change to the Safety architecture or any other architecture.
- **v1.1** (canonization) — Status metadata only. Product Review: APPROVED. Architecture Review: APPROVED. Specification status → E.0.2d Consolidation SPEC v1.1 — CANONICAL / CLOSED (SPECIFICATION); Work Item status → v1.0 BASELINE IMPLEMENTED / DETERMINISTICALLY VERIFIED / CALIBRATION FAILED — v1.1 REMEDIATION CANONICALIZED — v1.1 NOT IMPLEMENTED — NOT CLOSED — NOT LIVE (header, §01, §35); the completed review/canonization item removed from §32's pending list. No normative change. The canonization commit hash is not recorded here; it may be recorded by a later, separately authorized status-only commit (v1.0 precedent).
  - **Unchanged elsewhere.** No E.0.2c, GCUK, A1–A3, MRE-001 or Safety change. No code, test or harness change in this revision. Work Item status: IMPLEMENTED (v1.0 BASELINE) — DETERMINISTICALLY VERIFIED (v1.0 BASELINE) — CALIBRATION FAILED — v1.1 REMEDIATION SPEC IN AUTHORING — NOT CLOSED — NOT LIVE.
- **v1.2** (MRS-001 consumer revision of the same Work Item; architecture decided by Product/Architecture before authoring, R-14 … R-18; text pending review together with MRS-001).
  - **Trigger.** MRS-001 (Model Response Structure) defines the canonical structural boundary for provider responses and the request-contract states of Coach Decision System model stages. E.0.2d is its immediate downstream canonical consumer.
  - **Normative changes.**
    - Model-call boundary and processing order, with MRS-001 extraction before MRE-001 (§15.0).
    - Both stages EXPLICIT-PROFILE; the profile governs both request and extraction (§15.0, §15.1, §15.4).
    - Request profiles: shape, validation and default profiles preserving v1.1's model, output bounds and timeouts, with reasoning explicit as `OFF` (§27.1).
    - `maxOutputTokens` as the total provider-output ceiling (§27.1).
    - The Generator profile becomes configurable, and the Verifier's configurability becomes a complete profile. The v1.1 fields `verifierModel`, `timeoutMs` and `verifierTimeoutMs` are replaced (§08, §25).
    - Closed `STAGE_FAILURE_REASONS` with a fixed precedence and a distinct `REFUSAL` (§15.0, §15.3, §15.6, §25).
    - `PassResult.stageFailure` (§13).
    - CAL-D7 restated against the total ceiling, with refusal and answer size reported separately (§31.2).
    - Calibration configuration and evidence by complete profile (§31.4).
    - Atomic implementation with MRS-001 (§29.3).
    - AC-D1, AC-D9, AC-D41, AC-D43, AC-D59, AC-D64 and AC-D90 revised; AC-D67 … AC-D72 added (§30).
  - **Intentional request-contract amendment.** Each default request body gains `thinking: {type: 'disabled'}`, so request bytes and hashes change. Semantic behaviour is unchanged (§27.1). It is not described as zero drift.
  - **Status corrections.** The header, §01 and §35 record that v1.1 is implemented (`c83b182`) and that its calibration infrastructure is ready (`f6ae1a1`, 3767/3767); §29.2 is marked implemented. Real-model calibration is paused.
  - **Unchanged.** The §13 pass and its semantic pipeline (except the inserted structural handling), the Generator/Verifier responsibility split, prompts, schemas, verdicts, APPEND semantics, operations, the Observation Port, keys, ownership, temporality, Safety, authorization gates, atomic execution, confidence bootstrap, source governance and User Knowledge authority boundaries. No E.0.2c, GCUK, A1–A3, MRE-001, MRS-001, CARF or Safety change. No code, test or harness change in this revision.
- **v1.2** (provider-binding verification corrections; Product/Architecture ruling before approval) — Applied together with the same corrections in MRS-001.
  - **C3:** `reasoning` and `effort` are independent. An explicit `LOW`/`MEDIUM`/`HIGH` is required wherever the selected model supports an effort control, under OFF or ON. `NOT_APPLICABLE` is only for models without one. The rule "OFF ⇒ `NOT_APPLICABLE`" is removed (§27.1, AC-D68).
  - **C4:** OFF thinking bindings are exact objects, with no additional thinking fields (§27.1, AC-D68).
  - **C5:** `between_tools` represents OFF only where the provider and model support it, the request is tool-free, and the provider's effort constraint is explicitly satisfied (§27.1).
  - **Unchanged.** The default Generator and Verifier profiles are unchanged (Haiku 4.5, `OFF`, `NOT_APPLICABLE`, exactly `{type: 'disabled'}`, 1600/800, 20000 ms). No other change.
- **v1.2** (implementation-preflight clarification B1; Product/Architecture ruling, Option A) — `PassResult.stageFailure` is `{stage, reason}` only for `INTERPRETER_FAILED` / `VERIFIER_FAILED` produced by a classified §15.0 condition, and `null` when a preserved v1.1 defensive or internal-exception path produces either status (§13 step 15, §15.0, §25, §32, AC-D64). No `STAGE_FAILURE_REASONS` code is added; no cause is inferred; the defensive catch behaviour and every status are unchanged. Diagnostic-field clarification only; no other normative change. MRS-001 is unchanged. No code, test or harness change in this revision.
