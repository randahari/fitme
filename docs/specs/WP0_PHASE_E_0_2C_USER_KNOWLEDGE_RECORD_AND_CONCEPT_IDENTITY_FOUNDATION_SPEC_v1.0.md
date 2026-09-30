# WP0 — PHASE E.0.2c — USER KNOWLEDGE RECORD AND CONCEPT IDENTITY FOUNDATION — IMPLEMENTATION SPEC
## v1.0 — IMPLEMENTED — PENDING CLOSURE — implementation complete and verified (AC-0 … AC-62; Product/Architecture implementation review PASS); not CLOSED — closure pending commit, push and post-push canonical verification

**Repository path:** `docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md`

**Document role:** Implementation SPEC for WP0 Phase E.0.2c. It defines FITME's platform-neutral User Knowledge record contract, its deterministic validator, the per-user Concept Identity contract (including reversible merge), N-ary `factors[]`, the evidence-reference structure and missing-evidence semantics, the status lifecycle and deterministic transition rules, correction/supersession links, source-authority enforcement, the consent gate, derived views, the persistence port and its conformance suite, and the physical persistence decision. It adds no model call, no interpreter, no retrieval and no production behavior.

**Canonical contract:** `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` (**GCUK**) as amended by `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A1_v1.0.md` (**A1**).

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** a contract this SPEC proposes for approval; **[INFERENCE]** engineering inference; **[GAP]** missing repository evidence.

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 Phase E.0.2c — User Knowledge Record and Concept Identity Foundation** (GCUK Ch.23, "E.0.2c") **[CANON]**.
- Status: **IMPLEMENTED — PENDING CLOSURE.** Implementation is complete and its verification has passed (AC-0 … AC-62; Product/Architecture implementation review PASS). E.0.2c is not CLOSED: closure is pending commit, push and post-push canonical verification. Product/Architecture resolved PD-1, ADP-1 (option (a), server-routed), ADP-2, ADP-4 and ADP-5 (§06, §28). Authoring this document modified no file under `js/**`, `tests/**`, `functions/**`, and did not modify `index.html`, `sw.js` or `firestore.rules`.
- Repository baseline: `main` @ `bad5866851964ec3bbb299502f539c2933a02be7` (== `origin/main`) **[VERIFIED]**. Full deterministic suite on the working tree at authoring time: **3428/3428 passing** **[VERIFIED]**. The working tree carries 29 uncommitted entries unrelated to this Work Item (nutrition/UI/persistence/adaptive modules, their tests, two governance/Safety documents, and untracked planning documents); none is under `js/coachDecisionSystem/` or is a file this SPEC authorizes **[VERIFIED]**. Implementation must start from a baseline that excludes them or records them explicitly.
- Authority: every **[CANON]** item is owned by Product/Architecture; the binding decisions implemented here are listed in §06. Every **[DESIGN]** item is submitted for approval. Items that require a decision before READY are listed in §28.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** FITME must be able to hold, durably and per user, an open-world understanding of the person — facts, situational preferences and relationships among any number of concepts — with the epistemic origin of every item preserved (user-stated vs FITME-inferred), with evidence referenced and never copied, and with correction producing supersession rather than overwrite. E.0.2c builds only the deterministic foundation that every later step (E.0.2d–g) writes into, revises and retrieves from. It makes future conversational learning and correction structurally possible without implementing any of it.

**Scope (exhaustive).**
1. Platform-neutral User Knowledge record contract and validator (§09, §10, §11, §12).
2. Per-user Concept Identity contract, including labels, merge (`mergedInto`), unmerge and history (§13).
3. Evidence-reference structure, availability state and missing-evidence semantics (§11).
4. Status lifecycle and deterministic transition planners, including supersession links and `correctionHistory` (§14, §15).
5. Source-authority enforcement, the consent gate, and the structural user-control operations — withdraw, forget, erase (§15.5, §16, §17).
6. Canonical derived views (§18).
7. The deterministic proposal-validation helper for future factor/concept proposals (§19).
8. Persistence port contract, conformance suite, in-memory reference port (test fixture), and the physical persistence decision (§20, §21).
9. Open-world, non-causal, Safety and Application-Ready invariants (§22, §23, §24, §25) and acceptance tests (§30).

**Non-goals (binding).**
- No model call of any kind; no interpreter; no prompt.
- No consolidation, pattern learning, explicit-statement intake, correction classification or concept-resolution execution (E.0.2d, e, f; §31).
- No retrieval, top-K ranking, Semantic Context Discovery integration, `ContextComposer`/`ContextRelevancePlanner` change, `contextCeiling` change, lazy read or Memory Layer change (E.0.2g; §31).
- No General Reasoning activation; no `informationNeeds` consumer.
- No C4 caller; no server entry point; no core-hosting decision.
- No Firestore adapter, `firestore.rules` change, `resetApp()` change, `js/app.js`/`index.html`/`sw.js` change or `APP_VERSION` change (§21.4).
- No change to `js/memory.js`, Typed Memory, `functions/**`, `StateAccess`, intake gates, Safety modules, TRR, OU-001, Turn Understanding, Expression, Habit/Pattern engines.
- No user-facing transparency UI; no confirmation flow.
- No embeddings, vector search or graph database.
- No external/native source, tool, Internet, HealthKit/Health Connect, GPS, Calendar or wearable.
- No production behavior change; production model-call count unchanged.

---

# 03. Binding Canonical References

- GCUK Ch.04 invariants 1–20 and A1 invariant 21 **[CANON]**.
- GCUK Ch.05 (authority model), Ch.06 (`safetyFlag`/`reasoningAccessAuthorized` relationship), Ch.08 (User Knowledge Layer), **Ch.09 (record contract)**, **Ch.10 (Concept Identity)**, **Ch.11 (N-ary factors)**, **Ch.12 (evidence/confidence/confound)**, **Ch.13 (correction/supersession)**, Ch.14 (consolidation/bounded retrieval), Ch.15 (relationship to components; Typed Memory row), Ch.16 (bootstrap), Ch.18 (scaling), Ch.19 (privacy/consent), **Ch.20 (non-causal)**, Ch.21 (superseded designs), Ch.22 (SPEC-level items), Ch.23 (sequence), Ch.25 (non-goals) **[CANON]**.
- A1 §04 (Application-Ready Invariant; C1 §14.3 test), §05.6 (Safety exclusion incl. `SAFETY_ADJACENT` User Knowledge), §06 (Selection Precedes Invocation), §08 (consent principle; no per-topic permissions), §10 (deferred work) **[CANON]**.
- WP0 Phase D (`docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md`) §D.3 (AI-proposed judgment never durable authority), §D.5 (governed replacement ordering: write new, then supersede old) **[CANON]**.
- C4 SPEC (`docs/specs/C4_SPEC_v1.0.md`) §11.3–§11.5, §13.4 (server-created records start `candidate`), §13.8 (source immutable), CD-C4-05 (server never writes client-owned sources) **[CANON]** — cited as precedent for User Knowledge's own authority contract; C4 is not modified (§15.4).
- OU-001 §15 consumer rule 4 and D4; CCC-001 Amendment (recent conversation never promoted to User Knowledge) **[CANON]**.
- E.0.2b SPEC §27 (cross-catalogue id uniqueness; per-user catalogue must bring its own top-K bound) **[CANON]**.
- C1 SPEC §14.3 (Native Equivalence Standard) **[CANON]**.
- Product/Architecture E.0.2c authorization (binding Product decisions 1–5; Architecture rulings A–H) — §06 **[CANON]**.

---

# 04. Current-State Repository Evidence **[VERIFIED at `bad5866`]**

1. **No User Knowledge code exists.** No occurrence of `conceptId`, `factors`, `relationDescription`, `evidenceClass`, `correctionHistory` or `confoundsConsidered` in `js/`, `functions/` or `tests/`.
2. **Typed Memory** (`js/memory.js`): `MEMORY_TYPES` (9 values, `:43`), `MEMORY_SOURCES` (`:44`), `MEMORY_STATUS` (`:45`), `CLIENT_WRITABLE_SOURCES = ['user_stated','migrated']` (`:47`). Record shape `{type, payload, confidence, source, created_at, updated_at, last_confirmed_at, status}` (`makeMemory`, `:97-110`). The module mixes domain logic with Firestore (`memCol()` uses global `db`/`currentUser`, `:125-128`) and DOM UI (D6, `:285-600`).
3. **D6 transparency sheet** (`js/memory.js`): renders every record whose `type` is in `MEMORY_TYPES`, grouped by type (`:438-451`); its edit action replaces `payload` wholesale with `{text}` or `{key, value}` (`:531-540`); it can set `status: 'rejected'` (`:516`) and delete (`:558`).
4. **Memory reads are whole-collection.** `fetchUserStatedMemory: function () { return FitMeMemory.list(); }` (`js/app.js:2319`); `listMemories()` reads the entire `memories` collection (`js/memory.js:189-195`); `StateAccess.readUserStatedMemory` and `readRiskCharacteristicFacts` filter client-side after that fetch (`js/stateAccess.js:239-259`, `:316-338`), on every Decision Pass assembly (`js/coachDecisionSystem/memoryLayer.js:300-700`).
5. **Rules** (`firestore.rules`, `match /memories/{memoryId}`): owner-only read; client create/update/delete only when `source in ['user_stated','migrated']`; `source` immutable on update. Server-only sources are written only through the Admin SDK.
6. **C4** (`functions/typedMemoryServerWrite.js`): server write capability for `inferred_event`/`inferred_pattern`/`coach_generated`; always creates `status: 'candidate'` (`:118-131`); never transitions status; injected `deps.now`/`deps.atomicWrite`; **no caller and no export** (C4 SPEC line 18). Its `MEMORY_TYPES` has 7 values, lagging the client's 9 (`:27` vs `js/memory.js:43`).
7. **Existing governed correction precedent.** `persistRiskCharacteristicFactRecord()` REPLACEMENT mode writes the new fact first, then supersedes the old (`js/app.js:2605-2611`); CORRECTION marks `status: 'superseded'` with no link to a successor (`:2615-2635`). No `correctionHistory`, `supersededBy` or `supersedes` exists anywhere.
8. **Closed intake vocabularies.** `PREFERENCE_CLASSES` (3 values) and closed target tokens (`js/coachDecisionSystem/preferenceIntakeGate.js:29-33`); `DOMAINS`/`TOPICS` (`js/domain/domainTopicVocabulary.js:22-23`); six-value activity vocabulary (`js/domain/activityIdentityVocabulary.js`).
9. **Consent.** `ConsentScopeRegistry.REGISTERED_CONSENT_SCOPES = ['LEARNED_MEMORY_PERSONALIZATION']` (`js/coachDecisionSystem/consentScopeRegistry.js:28-29`); `EligibilityPolicy.deriveConsentStateFromProfile()` maps `userProfile.memoryConsent.granted` onto it (`js/coachDecisionSystem/eligibilityPolicy.js:82-87`).
10. **Governance enums in the context layer.** `SENSITIVITY_TIERS = ['STANDARD','SAFETY_ADJACENT']` mirrors GCUK Ch.09's `safetyFlag` (`js/coachDecisionSystem/contextComposer.js:83-88`).
11. **Evidence-candidate stores and their identifiers.** Conversation turns: `users/{uid}/coachConversation/{turnId}` (`firestore.rules`; `js/repositories/conversationRepository.js`). Day logs: `users/{uid}/days/{dateKey}`; meals are array elements with **no stable id** (`js/app.js:1338`). Typed Memory records: `memories/{id}`. Habits and Patterns carry stable `id` fields (`js/engines/habitEngine.js:79`, `js/engines/patternEngine.js:138`, `:208`).
12. **Reset.** `resetApp()` deletes errorLog, coachConversation, days, client-writable memories, favorites and the profile document (`js/app.js:1815-1837`); `deleteAllMemories()` skips server-sourced records (`js/memory.js:159-172`).
13. **Node-only core modules are permitted.** The wiring guard skips modules not script-tagged in `index.html` (`tests/coachDecisionSystemWiring.test.js:650`); precedent: `eligibilityPolicy.js`, MAI-001's `activityIdentityVocabulary.js`.
14. **Production model-call and TRR baselines** are pinned in `tests/ou001ProductionBackedAcceptance.test.js:195-203` and `tests/e02bProductionBackedAcceptance.test.js`.
15. **Application-Ready precedent.** All `js/coachDecisionSystem/*.js` modules contain no DOM, browser storage, `navigator`, direct `fetch` or Firebase token (A1 §04).

---

# 05. Definitions

- **User Knowledge record (record)** — one governed unit of learned understanding about one user (GCUK Ch.09).
- **Concept** — a per-user, opaque identity for something the user's life involves, known by one or more free-text labels (GCUK Ch.10).
- **Factor** — `{conceptId, role, valueDescription}`; one participant in a record (GCUK Ch.11).
- **Evidence reference** — a pointer to an observation held by another governed store; never a copy (GCUK Ch.12).
- **Writer authority** — the deterministic identity under which a store instance writes: `CLIENT` or `SERVER`. Fixed at composition time; never supplied per call.
- **`SERVER` (governed authority boundary)** — the trusted, governed authority boundary defined by canon (GCUK Ch.15; C4 precedent), wherever it is hosted. It is not a vendor, product or deployment: the device/server/hybrid decision remains deferred (A1 §10 item 13), and nothing in this SPEC depends on Firebase or any cloud provider. `CLIENT` is the user-agent side of that boundary.
- **Withdraw** — a user-control lifecycle action: the record stops being current knowledge (`status: 'rejected'`) and its history is kept (§15.5).
- **Forget** — a user-control deletion: the record (or an unreferenced concept) is removed from the store (§15.5).
- **Erase** — deletion of all of a user's User Knowledge under a given authority (§15.5).
- **Change set** — the complete, atomic set of document creations and updates produced by one transition.
- **Transition planner** — a pure function computing a change set from current documents, a validated request and a timestamp.
- **Port** — the persistence contract a platform adapter implements (§20).
- **Epistemic origin** — derived classification of a record's source: user-stated vs FITME-inferred (§18).

---

# 06. Binding Product/Architecture Decisions Implemented — [CANON]

| Id | Decision | Where |
|---|---|---|
| P-1 | Natural conversation is the primary learning/correction interface; E.0.2c makes it structurally possible, implements no interpreter | §15, §19, §27 |
| P-2 | Durable distinction between user-stated and FITME-inferred knowledge; never silently collapsed | §12.3, §16, §18 |
| P-3 | General personalization/learned-memory consent covers user-stated and governed inferred User Knowledge; no per-topic scopes; not platform access | §17 |
| P-4 | User correction outranks prior understanding; old → superseded, new → active, linked history; never destructive overwrite | §14, §15 |
| P-5 | Future transparency UI must remain possible, not mandatory; no per-item confirmation; not a manual profile editor | §14.2, §18, §21.3 |
| A-A | Domain contract outside `js/memory.js`; platform-neutral core; persistence behind a port; choose physical shape from evidence | §08, §20, §21 |
| A-B | Per-user, open-world Concept Identity; explicit, logged, reversible, non-destructive merge; no embeddings | §13 |
| A-C | N-ary `factors[]`; no domain fields; examples never encoded | §10 |
| A-D | Evidence referenced, not copied; deterministic resolvable/unresolvable semantics; no invented evidence; broader retention policy may be deferred | §11 |
| A-E | Association never silently becomes causation; no closed relationship taxonomy | §23 |
| A-F | Open semantics + closed authority | §16, §19, §22 |
| A-G | Zero model calls | §26 |
| A-H | Post-c sequence unchanged; sequencing questions deferred | §31 |
| PD-1 | A `user_stated` record stays usable as explicit knowledge when its original evidence reference becomes unresolvable, with that standing exposed; an inferred record with no remaining supporting evidence is `UNSUPPORTED` and unusable | §11.3, §18 |
| UC-1 | Natural conversation is the primary interface; the user can correct, reject, withdraw and delete/forget User Knowledge; future UI is secondary; no per-item confirmation; ordinary correction never rewrites history | §15 |
| UC-2 | **Loss of evidence ≠ explicit user forget/delete request.** Evidence unavailability never withdraws or deletes knowledge; an explicit forget/delete request is a distinct user-control operation; chat-history deletion alone is not treated as deletion of derived knowledge unless a future retention/privacy policy requires it | §11.3, §15.5 |
| ADP-1 | **Option (a), server-routed:** corrections, withdrawals and deletions affecting FITME-inferred records pass through the governed authority boundary (`SERVER`, §05); the client has no mutation authority over inferred records; the user's right to correct/reject/delete inferred knowledge is a Product invariant whose carrying mechanism is deferred; no GCUK amendment | §15, §16 |
| ADP-2 | Firestore adapter, rules, `resetApp()` integration and live persistence wiring deferred to the first Work Item that persists a real record; the logical sibling stores are canonical; Firestore paths are adapter guidance only | §20, §21 |
| ADP-4 | Added process fields approved; `conceptIds` is a deterministic derived index of `factors[]`, never an independent semantic field, and can never disagree with it | §10 |
| ADP-5 | A user correction of FITME-inferred knowledge executes at the governed `SERVER` boundary as **one atomic change set** that creates the `user_stated` successor and supersedes the targeted inferred record(s); no pending-supersession state; `SERVER` gains **no** general authority to originate `user_stated` knowledge; C4 is not modified | §15.4, §16.2 |

---

# 07. Authority Baseline — [CANON restated; DESIGN mechanics]

1. Every record and concept passes the deterministic validator (§09–§13) before any change set is committed. Invalid input is rejected whole; nothing is partially written.
2. `source` is set at creation, validated against the store's writer authority (§16), and immutable thereafter.
3. Initial `status` is not caller-controlled for non-user-stated sources: every `SERVER` creation is `candidate` (C4 §13.4 precedent).
4. Semantic content (`factors`, `relationDescription`) is immutable after creation. Changing what a record means requires supersession (§15). Only process fields change in place (§14.3).
5. Every mutation appends a `correctionHistory` (records) or `history` (concepts) entry. History is append-only.
6. No field, operation or derived view grants consent, source access, Safety authority, persistence authority or external-action authority. Future AI output enters only as a proposal validated by §19 and then by the same validator.

---

# 08. Module Boundary and Application-Ready Placement — [CANON A1 §04; DESIGN]

Three new core modules, each UMD-shaped like every sibling in `js/coachDecisionSystem/`, Node-testable, not script-tagged in `index.html` and not listed in `sw.js` in this Work Item (§04 item 13 precedent):

| Module | Global | Responsibility | Requires |
|---|---|---|---|
| `js/coachDecisionSystem/userKnowledgeContract.js` | `UserKnowledgeContract` | Vocabularies, constants, validators (record, factor, evidence reference, confound, concept, change set), derived views (§18), proposal validator (§19) | nothing |
| `js/coachDecisionSystem/userKnowledgeTransitions.js` | `UserKnowledgeTransitions` | Pure transition planners producing change sets (§14, §15, §13.4) | `userKnowledgeContract.js` |
| `js/coachDecisionSystem/userKnowledgeStore.js` | `UserKnowledgeStore` | `configure()`d service: consent gate, writer-authority matrix, read-plan-validate-commit through the injected port | both above |

Binding placement rules:
- No module reads a clock, generates random ids, or references `window` (other than the standard export line), `document`, storage, `navigator`, `fetch`, `firebase`/`Firestore`, service workers, `db` or `currentUser`. Time comes from injected `now()`; ids come from `port.newId()`.
- No module requires or references `js/memory.js`, `js/stateAccess.js`, `js/app.js`, `functions/**`, any repository, any Safety module, `memoryLayer.js`, `contextComposer.js`, `contextRelevancePlanner.js`, `eligibilityPolicy.js` or `consentScopeRegistry.js`.
- Timestamps are plain integers (epoch milliseconds), never platform timestamp types.

---

# 09. Vocabularies and Constants — [CANON where cited; DESIGN otherwise]

## 09.1 Closed vocabularies (process/governance only)

| Name | Values | Source | Extension rule |
|---|---|---|---|
| `FACTOR_ROLES` | `condition`, `subject`, `outcome` | GCUK Ch.11 **[CANON]** | Canonical decision only |
| `EVIDENCE_CLASSES` | `SINGLE_OBSERVATION`, `CO_OCCURRENCE`, `RECURRENCE`, `EXPLICIT_STATEMENT` | GCUK Ch.09/12 **[CANON]** | Canonical decision only |
| `TEMPORALITIES` | `DURABLE`, `TEMPORARY`, `RECURRING_WINDOW` | GCUK Ch.09 **[CANON]** | Canonical decision only |
| `STATUSES` | `candidate`, `active`, `superseded`, `rejected`, `archived` | Typed Memory, reused verbatim (GCUK Ch.09) **[CANON]** | Canonical decision only |
| `SOURCES` | `user_stated`, `inferred_event`, `inferred_pattern`, `coach_generated`, `migrated` | Typed Memory, reused verbatim **[CANON]** | Canonical decision only |
| `SAFETY_FLAGS` | `STANDARD`, `SAFETY_ADJACENT` | GCUK Ch.09 **[CANON]** | Canonical decision only |
| `WRITER_AUTHORITIES` | `CLIENT`, `SERVER` | **[CANON ADP-1]** the user-agent side and the governed authority boundary (§05); mirrors the rules/C4 split (§04 items 5–6); names no vendor | Canonical decision only |
| `EVIDENCE_REF_KINDS` | `CONVERSATION_TURN`, `DAY_LOG`, `TYPED_MEMORY_RECORD`, `HABIT_RECORD`, `PATTERN_RECORD`, `USER_KNOWLEDGE_RECORD` | **[DESIGN]** one value per governed store in §04 item 11 | A new value is added only when a new governed store or source is engineered (GCUK invariant 19) — never for a new user concept |
| `EVIDENCE_AVAILABILITY` | `UNVERIFIED`, `RESOLVABLE`, `UNRESOLVABLE` | **[DESIGN]** (§11.3) | Canonical decision only |
| `UNRESOLVABLE_REASONS` | `NOT_FOUND`, `USER_DELETED`, `USER_RESET`, `RETENTION`, `SOURCE_REMOVED`, `PRIVACY_ACTION` | **[DESIGN]** (§11.3) | Canonical decision only |
| `RECORD_HISTORY_KINDS` | `CREATED`, `PROMOTED`, `RETRACTED`, `SUPERSEDED`, `ARCHIVED`, `EVIDENCE_ADDED`, `EVIDENCE_AVAILABILITY_CHANGED`, `CONFOUND_ADDED`, `CONFOUND_CHECK_RECORDED`, `CONFIDENCE_CHANGED`, `SAFETY_FLAG_RAISED` | **[DESIGN]** one per transition (§14) | Added only with a new transition |
| `CONCEPT_HISTORY_KINDS` | `CREATED`, `LABEL_ADDED`, `LABEL_REMOVED`, `MERGED`, `UNMERGED` | **[DESIGN]** (§13) | Added only with a new transition |

Every value in this table describes how evidence was gathered, how long something stays valid, a relationship's grammar, a lifecycle step, a governance marker, or which store a reference points into. None describes what the user's life is about. Each passes GCUK R4's test: no value is ever needed because of a new user concept (§22).

## 09.2 Constants — [DESIGN]

| Constant | Value | Rationale |
|---|---|---|
| `SCHEMA_VERSION` | 1 | Stored on every document |
| `MAX_FACTORS` | 8 | N-ary without unbounded growth (GCUK Ch.11, Ch.18) |
| `VALUE_DESCRIPTION_MAX_CHARS` | 160 | Short open value/state text |
| `RELATION_DESCRIPTION_MAX_CHARS` | 400 | "Open, bounded prose" (GCUK Ch.09); equals `DESCRIPTION_MAX_CHARS` precedent |
| `MAX_EVIDENCE_REFS_PER_LIST` | 64 | Bounded record size (GCUK Ch.18) |
| `EVIDENCE_REF_MAX_CHARS` | 200 | Id-shaped references only |
| `MAX_CONFOUNDS` | 16 | Bounded |
| `CONFOUND_DESCRIPTION_MAX_CHARS` | 200 | Short alternative explanation |
| `MAX_LINKS` | 8 | Max `supersedes` / `supersededBy` entries |
| `MAX_HISTORY_ENTRIES` | 256 | See §14.5 |
| `MAX_LABELS_PER_CONCEPT` | 32 | Bounded |
| `LABEL_MAX_CHARS` | 80 | Short phrase |
| `MAX_CONCEPT_HISTORY_ENTRIES` | 256 | See §13.6 |
| `MAX_MERGE_CHAIN_DEPTH` | 16 | Cycle/fan protection (§13.4) |
| `ID_PATTERN` | `^[A-Za-z0-9_-]{1,128}$` | Opaque, platform-safe ids |
| `EVIDENCE_REF_PATTERN` | `^[A-Za-z0-9_.:\-]{1,200}$` | Rejects prose, preventing content copying (§11.1) |
| `PRODUCER_PATTERN` | `^[A-Za-z0-9_.\-]{1,64}$` | Engineering identifier of the producing pathway |
| `MAX_READ_BATCH` | 50 | Port read bound (§20) |
| `MAX_QUERY_LIMIT` | 50 | Port query bound (§20) |
| `MAX_QUERY_CONCEPT_IDS` | 10 | Port query filter bound (§20) |

---

# 10. User Knowledge Record Contract — [CANON GCUK Ch.09–12; DESIGN field mechanics]

## 10.1 Stored shape

```
UserKnowledgeRecord {
  schemaVersion: 1,
  recordId: string,                     // ID_PATTERN; minted by port.newId('record')
  userId: string,                       // ID_PATTERN-compatible opaque user id; must equal the store's user
  version: integer >= 1,                // optimistic-concurrency counter; +1 per committed update
  factors: Factor[],                    // 1..MAX_FACTORS  [CANON Ch.11]
  conceptIds: string[],                 // derived index of factors[] (§10.4); never supplied by a caller
  relationDescription: string,          // open prose, 1..400, trimmed, NFC  [CANON Ch.09]
  evidence: {                           // [CANON Ch.09/12]
    supporting: EvidenceRef[],          // 0..64
    contradicting: EvidenceRef[],       // 0..64
    confoundsConsidered: Confound[],    // 0..16
    confoundCheck: ConfoundCheck | null // [DESIGN] marker enforcing GCUK Ch.22 item 1 minimum (§14.4)
  },
  evidenceClass: EVIDENCE_CLASSES,      // [CANON]
  temporality: TEMPORALITIES,           // [CANON]
  expiresAt: integer | null,            // [CANON "optional expiresAt"]
  confidence: number,                   // finite, 0..1  [CANON]
  status: STATUSES,                     // [CANON]
  source: SOURCES,                      // [CANON]; immutable
  safetyFlag: SAFETY_FLAGS,             // [CANON]; required, no default
  provenance: Provenance,               // [CANON name; DESIGN shape]
  supersedes: string[],                 // [DESIGN] predecessor recordIds, 0..MAX_LINKS
  supersededBy: string[],               // [DESIGN] successor recordIds, 0..MAX_LINKS
  createdAt: integer,                   // [CANON]
  updatedAt: integer,                   // [DESIGN]
  lastEvidenceAt: integer | null,       // [CANON]
  correctionHistory: RecordHistoryEntry[]  // [CANON name; DESIGN shape]; 1..256, append-only
}

Factor { conceptId: string (ID_PATTERN), role: FACTOR_ROLES, valueDescription: string (1..160) | null }

Provenance {
  producer: string (PRODUCER_PATTERN),          // engineering id of the governed pathway that created the record
  producerVersion: string (PRODUCER_PATTERN),
  originTurnId: string (ID_PATTERN) | null      // the conversation turn the record was captured from, if any
}
```

## 10.2 Validation rules (`UserKnowledgeContract.validateRecord(doc) → {ok:true} | {ok:false, code, path}`)

Pure, synchronous, never throws. The first failure is reported. Rules:

1. `doc` is a plain object whose own keys are **exactly** the keys in §10.1 — unknown keys (for example `causal`, `isTrue`, `verified`, `claimType`, `category`, `domain`) are rejected (`UNKNOWN_FIELD`). Nested objects likewise have exact key sets.
2. Every closed field is a member of its §09.1 vocabulary; every string field meets its length bound after trim; text fields are stored NFC-normalized and trimmed (`normalizeText()` is exported and used by planners; the validator rejects un-normalized text with `TEXT_NOT_NORMALIZED`).
3. `factors`: length 1..`MAX_FACTORS`; no two factors identical in `(conceptId, role, valueDescription)` (`DUPLICATE_FACTOR`).
4. `conceptIds` is exactly equal to `deriveConceptIds(factors)` (§10.4), element by element (`CONCEPT_INDEX_MISMATCH`).
5. `confidence` is a finite number in [0, 1].
6. `evidenceClass === 'EXPLICIT_STATEMENT'` if and only if `source === 'user_stated'` (`EVIDENCE_CLASS_SOURCE_MISMATCH`) — §12.3.
7. `temporality === 'DURABLE'` ⇒ `expiresAt === null`; `expiresAt`, when not null, is an integer greater than `createdAt` (`INVALID_EXPIRY`).
8. `createdAt ≤ updatedAt`; `lastEvidenceAt` is null or ≤ `updatedAt`; `version ≥ 1`.
9. `supersedes`/`supersededBy`: arrays of distinct ids, never containing `recordId` itself; `status === 'superseded'` ⇔ `supersededBy.length ≥ 1` (`SUPERSESSION_LINK_MISMATCH`).
10. Status/source consistency: a record with a non-`user_stated` source and `status === 'active'` must have a non-null `evidence.confoundCheck` (`PROMOTION_WITHOUT_CONFOUND_CHECK`) — §14.4.
11. `correctionHistory` is non-empty, its first entry is `CREATED`, entries are in non-decreasing `at` order, and every entry validates (§14.5).
12. Every evidence reference, confound and history entry validates (§11, §14.5); evidence `refId`s are unique across `supporting` and `contradicting` together.

## 10.3 What the contract deliberately does not contain

No content category, domain, topic, activity, food, place, symptom, relationship type, `claimType`, polarity, causal flag, truth flag or verification flag (GCUK Ch.09, Ch.20, Ch.21 item 5). Meaning lives only in concept labels, `valueDescription` and `relationDescription`.

## 10.4 `conceptIds` derived-index invariant — [CANON ADP-4]

1. **Single canonical rule:** `deriveConceptIds(factors)` = the set of `factors[i].conceptId` values, de-duplicated by exact string equality, sorted ascending by UTF-16 code-unit order (JavaScript default `Array.prototype.sort()` on strings). Concept ids are opaque `ID_PATTERN` strings, so no case folding or Unicode normalization applies.
2. **Never supplied:** record drafts accepted by planners and store operations have no `conceptIds` field; a draft carrying one is rejected (`DERIVED_FIELD_SUPPLIED`). Every planner computes `conceptIds` from the resulting `factors` with `deriveConceptIds`.
3. **Always verified:** the validator (§10.2 rule 4) rejects any document whose `conceptIds` is not exactly `deriveConceptIds(factors)`, so a document read from any port, a future adapter, or a future server path cannot carry a divergent index into a change set.
4. **Immutable with factors:** `factors` never change in place (§14.3), so `conceptIds` never changes after creation.
5. **No semantics:** `conceptIds` exists only to make bounded concept-keyed reads possible (§20.1). No derived view, planner or future consumer may assign meaning, roles or relevance through it; meaning is carried only by `factors`. Concept merges do not rewrite it (§13.3); consumers expand merges at query time with `resolveConceptRoot`.

---

# 11. Evidence References and Missing-Evidence Semantics — [CANON GCUK Ch.12; A-D; DESIGN mechanics]

## 11.1 Evidence reference

```
EvidenceRef {
  refId: string,                         // `${kind}:${ref}` — deterministic, unique within the record
  kind: EVIDENCE_REF_KINDS,
  ref: string,                           // EVIDENCE_REF_PATTERN — an identifier in the governed store, never content
  observedAt: integer | null,            // when the observation occurred, if known
  addedAt: integer,
  availability: EVIDENCE_AVAILABILITY,   // UNVERIFIED on creation
  availabilityCheckedAt: integer | null,
  unresolvableReason: UNRESOLVABLE_REASONS | null   // non-null iff availability === 'UNRESOLVABLE'
}
```

`ref` identifier conventions (DESIGN; enforced only by pattern, resolution belongs to the future resolver adapter): `CONVERSATION_TURN` → `turnId`; `DAY_LOG` → `YYYY-MM-DD` day key (day-level granularity: meals have no stable id, §04 item 11); `TYPED_MEMORY_RECORD` → memory document id; `HABIT_RECORD`/`PATTERN_RECORD` → engine record `id`; `USER_KNOWLEDGE_RECORD` → `recordId`.

The pattern admits no whitespace, so no prose, quotation or payload can be copied into evidence (GCUK Ch.12 "references (never copies)").

## 11.2 Confounds and the confound-check marker

```
Confound {
  confoundId: string (ID_PATTERN, minted by port.newId('confound')),
  conceptId: string | null,
  description: string (1..200) | null,     // at least one of conceptId/description non-null
  source: SOURCES,                         // who proposed the alternative explanation (a user's own correction may carry one — GCUK Ch.13)
  addedAt: integer
}

ConfoundCheck { performedAt: integer, producer: string, producerVersion: string }
```

`ConfoundCheck` records only that a governed confound check ran; it asserts nothing about the outcome. The check itself is E.0.2e.

## 11.3 Availability states and deterministic consequences

| State | Meaning |
|---|---|
| `UNVERIFIED` | Never checked since added |
| `RESOLVABLE` | The most recent check found the referenced observation |
| `UNRESOLVABLE` | The most recent check did not find it (reason recorded) |

Binding rules:
1. An evidence reference is **never removed, replaced, rewritten or re-pointed**. Its `kind`, `ref`, `observedAt` and `addedAt` are immutable. Only `availability`, `availabilityCheckedAt` and `unresolvableReason` change, and only through `planEvidenceAvailability` (§14.3), which appends an `EVIDENCE_AVAILABILITY_CHANGED` history entry per changed reference.
2. No code path creates evidence to replace unresolvable evidence. New evidence enters only through `planAppendEvidence` with a genuinely new reference (§14.3).
3. `UNRESOLVABLE` → `RESOLVABLE` is permitted (a transient read failure later corrected); the history records both.
4. Behavior never differs by `unresolvableReason`; the reason is provenance only.
5. `status`, `confidence`, `source` and semantic content are **not** changed by an availability change. The consequence is expressed through the derived `evidenceStanding` view (§18), which every future consumer must use:
   - For a record with a non-`user_stated` source, when no `supporting` reference is `RESOLVABLE` or `UNVERIFIED`, standing is `UNSUPPORTED`, and `isUsableKnowledge()` is false regardless of `status` or `confidence`. It never silently becomes unsupported truth.
   - For a `user_stated` record, standing is `EXPLICIT`, with `statementReferenceUnresolvable: true` when any of its `supporting` references is `UNRESOLVABLE`. The record remains usable as explicit user-provided knowledge (GCUK Ch.13: authority is carried by `source`), while the loss of the underlying reference remains visible — **[CANON PD-1]**.
6. A `USER_KNOWLEDGE_RECORD` reference to a hard-deleted record, and a `supersedes`/`supersededBy` link to a hard-deleted record, follow the same rule: the link is kept; the future resolver reports it unresolvable.
7. **Loss of evidence ≠ explicit user forget/delete request — [CANON UC-2].** An availability change can never withdraw, forget, erase, archive or supersede a record, and no planner or store operation derives any of those from availability. Explicit user withdrawal and forgetting are distinct user-control operations (§15.5), recorded and executed only through them.
8. The deletion of the evidence source itself — including deletion of conversation history — is, by itself, only an evidence-availability event under rule 7. It is not treated as deletion of User Knowledge derived from that conversation unless a future, separately approved retention/privacy policy requires that behavior (§11.5).

## 11.4 Resolver port (contract only)

```
EvidenceResolverPort.resolve(userId, refs: Array<{kind, ref}>) → Promise<Array<{refId, availability: 'RESOLVABLE'|'UNRESOLVABLE', reason?: UNRESOLVABLE_REASONS}>>
```

Defined so E.0.2d/e adapters have a fixed target. **No implementation, caller or cadence is part of E.0.2c.** A resolver never returns content; `planEvidenceAvailability` accepts only `refId`, `availability` and `reason`.

## 11.5 Broader retention policy — deferred

Which deletions or privacy actions should additionally cause knowledge derived from the deleted evidence to be withdrawn or forgotten is not decided here. §11.3 is the safe default until a separately approved retention/privacy policy exists (§31). Such a policy, once approved, would act through the §15.5 user-control operations; it requires no change to the record contract.

---

# 12. Source, Provenance and Epistemic Origin — [CANON GCUK Ch.09/13/15; P-2]

## 12.1 Source meaning

| Source | Meaning in User Knowledge | Writer |
|---|---|---|
| `user_stated` | The user explicitly stated or corrected this understanding | `CLIENT`; `SERVER` only through `correctInferredKnowledge` (§15.4, INV-UC-S) |
| `inferred_event` | FITME inferred it from specific observations | `SERVER` |
| `inferred_pattern` | FITME inferred it from a recurring pattern | `SERVER` |
| `coach_generated` | A coach-generated working understanding | `SERVER` |
| `migrated` | Reserved for a future, separately approved migration; no E.0.2c operation creates it | none in E.0.2c |

## 12.2 Immutability

`source` never changes after creation (C4 §13.8; rules precedent). A user confirming or correcting an inferred record produces a **new** `user_stated` record that supersedes it (§15); the inferred record remains inferred forever in its own history.

## 12.3 Non-collapse guarantees

- `EXPLICIT_STATEMENT` is reserved to `user_stated`, so an inferred record can never present itself as explicitly stated (§10.2 rule 6).
- Confidence carries no authority: no derived view ranks inferred knowledge above user-stated knowledge because of confidence (GCUK Ch.13).
- The derived `epistemicOrigin()` (§18) is the only sanctioned way to classify origin for reasoning or UI.

## 12.4 Provenance

`provenance.producer`/`producerVersion` identify the governed pathway (for example a future intake gate or consolidation pass). They are engineering identifiers validated by pattern, never free text and never model-authored. `originTurnId` records the conversation turn the record was captured from, when there is one.

---

# 13. Concept Identity Contract — [CANON GCUK Ch.10; A-B; DESIGN mechanics]

## 13.1 Stored shape

```
Concept {
  schemaVersion: 1,
  conceptId: string (ID_PATTERN, minted by port.newId('concept')),
  userId: string,
  version: integer >= 1,
  labels: string[],                  // 1..32 active labels; NFC, trimmed, 1..80 chars; unique under normalizeLabelKey()
  mergedInto: string | null,         // [CANON]
  createdAt: integer,
  updatedAt: integer,
  history: ConceptHistoryEntry[]     // 1..256, append-only
}

ConceptHistoryEntry {
  eventId: string (ID_PATTERN), kind: CONCEPT_HISTORY_KINDS, at: integer,
  writer: WRITER_AUTHORITIES, producer: string,
  label: string | null,             // LABEL_ADDED / LABEL_REMOVED
  into: string | null,              // MERGED: target; UNMERGED: the previous target
  reason: string (1..200) | null
}
```

`normalizeLabelKey(label)` = NFC → lower-case → collapse whitespace → trim (the E.0.2b `informationNeeds` normalization, §14.2 there). It is used only for duplicate detection; the stored label keeps the user's wording.

A concept carries no source or status: a label is an identity handle, not a claim. Epistemic origin lives on records.

## 13.2 Open-world rules

- There is no global concept list, synonym table, ontology, category or type field. Any string in any language is a valid label.
- A novel concept is created at runtime by `planCreateConcept`; no release is required.
- Hierarchy or overlap between concepts is an ordinary record whose factors are the two concepts (GCUK Ch.10/11); there is no parent field.

## 13.3 Merge

`planMergeConcept({fromConceptId, intoConceptId, reason})`:
1. Both concepts exist, belong to the same `userId`, and `from !== into`.
2. `from.mergedInto === null` (a concept is merged into at most one target at a time).
3. `resolveConceptRoot(into) !== from` and the chain from `into` has depth < `MAX_MERGE_CHAIN_DEPTH` (no cycle).
4. Change set: `from.mergedInto = into`, `from.history += MERGED{into}`. Nothing else changes: **`from`'s labels are not moved, no record's `factors` or `conceptIds` are rewritten, nothing is deleted.**

## 13.4 Resolution

`resolveConceptRoot(conceptId, getConcept)` follows `mergedInto` to the first concept with `mergedInto === null`, bounded by `MAX_MERGE_CHAIN_DEPTH`; exceeding the bound or revisiting a concept returns `{ok:false, code:'MERGE_CHAIN_INVALID'}`. `effectiveLabels(root, concepts)` is the de-duplicated union of labels of every provided concept whose root is `root`. Both are derived; nothing about resolution is stored.

## 13.5 Unmerge

`planUnmergeConcept({conceptId, reason})`: requires `mergedInto !== null`; sets `mergedInto = null` and appends `UNMERGED{into: <previous target>}`. Because merge rewrote nothing, unmerge is exact: every record referencing the concept resolves to it again.

Stated limitation (deterministic, not hidden): a record created *while* a merge was in effect keeps the `conceptId` its producer chose. If that producer chose the merge target, unmerging does not move it. Re-attributing such records needs interpretation and belongs to a later step (§31).

## 13.6 Labels

`planAddConceptLabel` appends a label not already present under `normalizeLabelKey` (a duplicate is a no-op returning `NO_CHANGE`). `planRemoveConceptLabel` removes an active label and records it in the `LABEL_REMOVED` history entry, so it is never lost. A concept must keep at least one label. At `MAX_LABELS_PER_CONCEPT` or `MAX_CONCEPT_HISTORY_ENTRIES`, the planner returns `CAPACITY_EXCEEDED` and changes nothing.

## 13.7 Referential integrity

Every `factors[].conceptId` and non-null `Confound.conceptId` in a change set must reference a concept of the same `userId` that exists in the committed store or is created in the same change set (`UNKNOWN_CONCEPT`). A concept is hard-deleted only by `forgetConcept` (§15.5), which requires that it is referenced by no remaining record factor and that no concept is merged into it, or by an erase. Label removal (§13.6) is correction, not forgetting: the removed label is kept in history.

---

# 14. Status Lifecycle and Deterministic Transitions — [CANON GCUK Ch.09/12/13; DESIGN mechanics]

## 14.1 Planner contract

Every planner in `UserKnowledgeTransitions` is pure: `plan*(currentDocs, request, now, writer, producer) → {ok:true, changeSet} | {ok:false, code}`. It never reads a clock, never mints ids (ids arrive in `request` from the store, which obtains them from `port.newId()`), and validates every resulting document with §10/§13 validators before returning. A change set is `{creates: Doc[], updates: Array<{kind:'record'|'concept', id, expectedVersion, doc}>}` where each update carries the complete next document with `version` incremented.

## 14.2 Status transitions (exhaustive)

| From | To | Planner | Conditions |
|---|---|---|---|
| — | `active` | `planCreateRecord` | `source === 'user_stated'` only |
| — | `candidate` | `planCreateRecord` | any non-`user_stated` creatable source; status forced (C4 §13.4) |
| `candidate` | `active` | `planPromoteRecord` | `user_stated`: always. Other sources: `evidence.confoundCheck !== null` **and** at least one `supporting` reference not `UNRESOLVABLE` (GCUK Ch.12; Ch.22 item 1 minimum) |
| `candidate`, `active` | `superseded` | `planSupersede` (§15) | Only together with a successor record in the same change set |
| `candidate`, `active` | `rejected` | `planRetractRecord` | Withdrawn without a replacement (user withdrawal, §15.5, or governed rejection of a candidate) |
| `active` | `archived` | `planArchiveRecord` | No longer current (for example expired `TEMPORARY`) |

`superseded`, `rejected` and `archived` are terminal. Re-asserting knowledge creates a new record. There is no in-place revert of a terminal status and no transition that deletes.

No transition requires a user confirmation step (P-5). User-stated knowledge is active on creation; inferred knowledge is promoted by deterministic gates, never by asking the user.

## 14.3 In-place process mutations (status unchanged)

| Planner | Effect | History kind |
|---|---|---|
| `planAppendEvidence` | Adds new references to `supporting` or `contradicting`; sets `lastEvidenceAt`; duplicate `refId` → `NO_CHANGE` | `EVIDENCE_ADDED` |
| `planEvidenceAvailability` | Applies resolver results (§11.3) | `EVIDENCE_AVAILABILITY_CHANGED` |
| `planAddConfound` | Appends a confound | `CONFOUND_ADDED` |
| `planRecordConfoundCheck` | Sets/refreshes `confoundCheck` | `CONFOUND_CHECK_RECORDED` |
| `planSetConfidence` | Replaces `confidence` (0..1) | `CONFIDENCE_CHANGED` (old and new values) |
| `planRaiseSafetyFlag` | `STANDARD` → `SAFETY_ADJACENT` only | `SAFETY_FLAG_RAISED` |

Allowed only on `candidate` or `active` records. `factors`, `conceptIds`, `relationDescription`, `evidenceClass`, `temporality`, `expiresAt`, `source` and `provenance` are never mutated in place.

## 14.4 Confound-check minimum

GCUK Ch.12 requires confound-aware promotion; Ch.22 item 1 fixes the binding minimum: no record reaches `active` without some confound check having run. E.0.2c enforces the minimum structurally (validator rule 10, promotion condition) and implements no confound reasoning or threshold (E.0.2e). `user_stated` records are exempt: their authority is the user's statement, not evidence volume (GCUK Ch.13).

## 14.5 History entries

```
RecordHistoryEntry {
  eventId: string (ID_PATTERN), kind: RECORD_HISTORY_KINDS, at: integer,
  writer: WRITER_AUTHORITIES, producer: string (PRODUCER_PATTERN),
  fromStatus: STATUSES | null, toStatus: STATUSES | null,
  relatedRecordIds: string[],          // SUPERSEDED: successors on the predecessor; CREATED: predecessors on a successor
  refIds: string[],                    // evidence events
  confoundId: string | null,
  previousConfidence: number | null, newConfidence: number | null,
  reason: UNRESOLVABLE_REASONS | null,
  userOriginTurnId: string (ID_PATTERN) | null   // the user turn that expressed the intent, for user-control actions; provenance only, confers nothing
}
```

`writer` is taken from the store's configured authority, never from the caller. History is append-only. The last history slot is reserved for a terminal transition: once a record holds `MAX_HISTORY_ENTRIES − 1` entries, every in-place mutation and promotion returns `HISTORY_CAPACITY` and changes nothing, while a transition to `superseded`, `rejected` or `archived` remains possible. The knowledge can therefore always be carried forward by superseding it with a fresh record, which preserves the full old record and links both (§15).

---

# 15. Correction, Supersession and User Control — [CANON GCUK Ch.13; P-4; UC-1; UC-2; ADP-1; WP0-D §D.5]

## 15.1 `planSupersede`

Request: `{predecessorIds: string[1..MAX_LINKS], successor: RecordDraft, confoundsForPredecessors?: ConfoundDraft[]}`.

Change set, applied atomically:
1. **Create** the successor with `supersedes = predecessorIds`, status per §14.2 (`active` for `user_stated`, `candidate` otherwise), and a `CREATED` history entry whose `relatedRecordIds` lists the predecessors.
2. **Update** each predecessor: `status = 'superseded'`, append the successor id to `supersededBy`, append a `SUPERSEDED` history entry (`relatedRecordIds: [successorId]`), and append any supplied confounds (each with its own `CONFOUND_ADDED` entry) — the user's explanation of what was really going on is kept on the superseded record, improving future confound detection (GCUK Ch.13).
3. Nothing is deleted. The predecessor's content, evidence and history remain intact and inspectable.

Conditions: every predecessor exists, belongs to the user and is `candidate` or `active`; the successor validates; writer authority permits both the creation and each predecessor update (§16); and the predecessors are **authority-homogeneous** — either all `user_stated` (executed under `CLIENT`) or all FITME-sourced (`inferred_event`/`inferred_pattern`/`coach_generated`, executed under `SERVER`). A correction that touches both kinds is executed as two change sets, one per authority (`MIXED_AUTHORITY_PREDECESSORS`).

## 15.2 Atomicity and ordering

The change set is committed by `port.commit()` as one all-or-nothing unit with per-document `expectedVersion` checks (§20). This strengthens the D.5 precedent (new first, then supersede; `js/app.js:2605-2611`): no state exists in which the old record is superseded without its successor, or in which both appear current because a second write failed.

## 15.3 Explicit correction outranks inference

A `user_stated` successor superseding an inferred predecessor is accepted regardless of the predecessor's confidence or evidence volume (GCUK Ch.13: authority carried by `source`).

## 15.4 User correction of FITME-inferred knowledge — the governed correction operation — [CANON ADP-1 option (a), ADP-5; DESIGN mechanics]

Correcting FITME-inferred knowledge must supersede an inferred record, which only `SERVER` may mutate. It therefore executes through one **dedicated operation**, `correctInferredKnowledge` (planner `planCorrectInferredKnowledge`), available only under `SERVER`, as **one atomic change set** that creates the `user_stated` successor and supersedes the targeted inferred records. Either the whole change set commits or none of it does (§15.2). There is no intermediate or "pending supersession" state, and no lifecycle status beyond §09.1's five.

Request: `{predecessorIds: string[1..MAX_LINKS], successor: RecordDraft, userOriginTurnId: string, confoundsForPredecessors?: ConfoundDraft[]}`.

**INV-UC-S — the narrow `SERVER` user-stated exception (binding).** `SERVER` may create a `user_stated` record only through `correctInferredKnowledge`, and only when every condition below holds; otherwise the operation fails with `INVALID_USER_CORRECTION` and nothing is written:
1. **Existing inferred target:** every predecessor exists, belongs to the user, is `candidate` or `active`, and has a FITME-sourced `source` (`inferred_event`/`inferred_pattern`/`coach_generated`). No `user_stated` predecessor is admitted.
2. **User origin present and valid:** `userOriginTurnId` is a non-empty `ID_PATTERN` string.
3. **Anchored to the user's turn:** the successor has `source: 'user_stated'`, `evidenceClass: 'EXPLICIT_STATEMENT'`, `provenance.originTurnId === userOriginTurnId`, and `evidence.supporting` is **exactly** `[{kind: 'CONVERSATION_TURN', ref: userOriginTurnId}]`, with empty `contradicting`. No inferred evidence can be carried into the user-stated successor.
4. **Provenance preserved:** every history entry the change set appends, on the successor and on each predecessor, carries `userOriginTurnId`; any confound supplied for a predecessor has `source: 'user_stated'`.
5. **A genuine correction, not a relabel:** the successor's content is not identical to any predecessor's: its `(deriveConceptIds(factors), sorted factors, relationDescription)` after `normalizeText` differs from each predecessor's (`CORRECTION_IDENTICAL_TO_PREDECESSOR`). This makes it mechanically impossible to turn an inference into user-stated knowledge by copying it under a new source.
6. **One atomic change set:** the successor creation and every predecessor supersession are in the same change set, committed by one `port.commit()`.

Everywhere else, `SERVER` creating a `user_stated` record fails with `AUTHORITY`: in `createRecord`, in the generic `supersede`, and in every other operation. `source` stays immutable for every record (§12.2). Consequently `SERVER` cannot invent user-stated content with no user turn behind it, convert its own inference into `user_stated`, promote inferred content by relabeling its source, or create arbitrary `user_stated` records.

**Verification boundary.** E.0.2c enforces the structure above deterministically. Whether the referenced turn really exists, belongs to this user, is the current turn, and really expresses a correction is established by the future governed entry point and the E.0.2f pathway before calling this operation (§31). E.0.2c never treats the presence of a turn id as proof of those facts.

**User confirmation is out of scope.** A user *confirming* an inferred record ("yes, that's right") is not a correction, and condition 5 rejects it on this path. How confirmation of inferred knowledge is recorded is an E.0.2f design question (§31). No confirmation is ever required for normal learning (P-5).

**C4 isolation.** This operation belongs to the User Knowledge store and has its own authority contract. It does not modify C4 (`docs/specs/C4_SPEC_v1.0.md`, `functions/typedMemoryServerWrite.js`). C4's rule that its server capability never writes client-owned sources (CD-C4-05) remains unchanged within C4. Any primitive shared later must preserve each capability's own authority contract; it must never weaken C4 to generalize this exception.

## 15.5 User-control operations: withdraw, forget, erase — [CANON UC-1, UC-2, ADP-1; DESIGN mechanics]

The user's ability to correct, reject, withdraw and delete/forget User Knowledge is a Product invariant (UC-1). E.0.2c provides each as a distinct, deterministic operation. None is triggered by evidence loss (§11.3 rule 7).

| Operation | Effect | History | Authority |
|---|---|---|---|
| **Correct** — `supersede` (§15.1) or `correctInferredKnowledge` (§15.4) | New understanding becomes current; old stays, linked | kept on both | `user_stated` predecessors: `CLIENT` via `supersede`. FITME-sourced predecessors: `SERVER` via `correctInferredKnowledge` only |
| **Withdraw / reject** — `retractRecord` | `candidate`/`active` → `rejected`; record and history kept | `RETRACTED` entry with `userOriginTurnId` when user-initiated | `user_stated`: `CLIENT`. FITME-sourced: `SERVER` |
| **Forget a record** — `forgetRecord` | Hard-deletes the record from the store | none retained (the record is gone) | `user_stated`: `CLIENT`. FITME-sourced: `SERVER` |
| **Forget a concept** — `forgetConcept` | Hard-deletes a concept referenced by no remaining record factor and with no concept merged into it (`CONCEPT_IN_USE` otherwise) | none retained | `CLIENT` or `SERVER` |
| **Erase** — `eraseAllForUser` | `CLIENT`: deletes every `user_stated` record only. `SERVER`: deletes every record and every concept | none retained | per row |

Structural guarantees:
1. Forgetting removes the content: evidence references, supersession links and history entries in *other* records carry only ids, never content (§11.1, §14.5), so after `forgetRecord` no copy of the forgotten record's content remains in any other record or concept history. The one exception is content a user later restated in a successor's own `relationDescription`, which is that successor's content, governed by its own lifecycle. Concept labels are not removed by `forgetRecord`; a concept left unreferenced can then be removed with `forgetConcept`. Which concepts a future forget flow removes together with a record is a flow decision (E.0.2f), not a contract change.
2. References to a forgotten record elsewhere become ids that the future resolver reports `UNRESOLVABLE` with reason `USER_DELETED`; they are never rewritten.
3. No tombstone or shadow copy is kept. Whether any audit trace of a forget action should exist is part of the deferred retention/privacy policy (§11.5).
4. A complete user erase requires `SERVER` authority whenever FITME-sourced records or concepts exist. The first persisting Work Item's reset must invoke the governed full erase (§21.4).
5. Forgetting is a deliberate user-control act, distinct from withdrawal: withdrawal keeps the knowledge as inspectable history; forgetting removes it.
6. E.0.2c implements these operations and their authority rules only. It does not detect a forget, withdraw or correction request in conversation (E.0.2f), does not build a UI, does not implement the governed entry point that carries user intent to `SERVER` (deferred, §31), and adds no confirmation step.

## 15.6 What E.0.2c does not do

It does not decide whether a user utterance is a correction, withdrawal or forget request, which record it targets, or what the corrected understanding is. That is the E.0.2f correction interpreter plus its governed intake (§31). E.0.2c guarantees that whatever that future step decides can be recorded non-destructively and linked, or deleted when the user asks.

---

# 16. Source-Authority Enforcement — [CANON GCUK Ch.05/15; C4; DESIGN matrix]

## 16.1 Writer authority is configured, never requested

`UserKnowledgeStore.configure({ port, now, writerAuthority, isLearningConsentGranted, userId, producer, producerVersion })`.

`userId` **[CANON — Architecture ruling, implementation review]** is the store's identity binding, required because every record and concept must satisfy `userId === ` the store's user (§10.1, §13.1) and Concept Identity is per-user (§13). It is opaque, `ID_PATTERN`-validated and injected by the host's composition root, and is used only to scope port calls and to validate documents. It is not authentication, authorization, consent, session state, a platform or vendor identity, or permission evidence, and supplying or changing it grants no authority: writer authority, consent, the persisted immutable `source` and operation-specific governance alone determine what may be done (AC-62). No operation request accepts a `userId`.

`writerAuthority` ∈ `WRITER_AUTHORITIES` is fixed by the composition root of the host that runs the store: the user-agent side (`CLIENT`) or the governed authority boundary (`SERVER`, §05 — not a vendor or deployment choice). No store operation accepts a writer, a `source` override, an initial status for non-user-stated sources, or any permission-shaped argument. An unconfigured or invalidly configured store returns `NOT_CONFIGURED` for every operation.

## 16.2 Authority matrix

"FITME-sourced" = `inferred_event`, `inferred_pattern` or `coach_generated`.

| Operation | `CLIENT` | `SERVER` |
|---|---|---|
| Create record, `source: user_stated` (standalone) | allowed | **forbidden** (INV-UC-S) |
| Create record, FITME-sourced | **forbidden** | allowed (always `candidate`) |
| Create record, `migrated` | forbidden in E.0.2c | forbidden in E.0.2c |
| Promote / withdraw / archive / in-place mutation of a `user_stated` record | allowed | **forbidden** |
| Promote / withdraw / archive / in-place mutation of a FITME-sourced record | **forbidden** | allowed |
| Supersede `user_stated` predecessors with a `user_stated` successor | allowed | **forbidden** |
| Supersede `user_stated` predecessors with a FITME-sourced successor | **forbidden** | **forbidden** — FITME never overrides what the user stated by inference; only the user changes it |
| Supersede FITME-sourced predecessors with a FITME-sourced successor | **forbidden** | allowed |
| Supersede FITME-sourced predecessors with a `user_stated` successor via the generic `supersede` | **forbidden** | **forbidden** (INV-UC-S) |
| `correctInferredKnowledge` — user correction of FITME-inferred knowledge (§15.4) | **forbidden** | allowed only when every INV-UC-S condition holds |
| Supersede mixed-authority predecessors | **forbidden** | **forbidden** (§15.1) |
| Forget a `user_stated` record | allowed | **forbidden** |
| Forget a FITME-sourced record | **forbidden** | allowed |
| Concept create / label add / label remove / merge / unmerge / forget | allowed | allowed |
| Erase | `user_stated` records only | all records and concepts |

**[CANON ADP-1 option (a)]:** the client holds no mutation authority over FITME-sourced records. A user's correction, withdrawal or deletion of FITME-inferred knowledge is carried to the governed authority boundary and executed there. The mechanism that carries that intent is deferred (§31); the user's right to it is a Product invariant (UC-1). The operations the matrix forbids fail with `AUTHORITY` under the invariant **authority resolution may read; authority failure may not mutate** (§16.4). No GCUK amendment is required: the client/server split is Typed Memory's and C4's, reused verbatim (GCUK Ch.15).

**[CANON ADP-5]:** the only way `SERVER` can produce `user_stated` knowledge is the dedicated `correctInferredKnowledge` operation under INV-UC-S (§15.4). This User Knowledge authority contract is separate from C4's; C4 is unchanged.

The two `forbidden` supersession rows that protect `user_stated` knowledge from inference are **[DESIGN]** derived from GCUK Ch.13/Ch.15.

## 16.3 Defense in depth

The matrix is enforced in the store before `port.commit()`. A future platform adapter must additionally enforce the same boundary at its own trust layer (for the current Web shell, the adapter guidance in §21.2). A future server entry point must independently re-validate every document (C4 §11.3 precedent).

## 16.4 Authority resolution may read; authority failure may not mutate — [CANON — Architecture ruling, implementation review]

1. **Decidable without persisted state → zero port calls.** When an operation's lack of authority is knowable from the operation type, the configured writer authority and the supplied request shape alone, it fails with `AUTHORITY` before any port call. This includes: `SERVER` creating a `user_stated` record outside `correctInferredKnowledge`; `CLIENT` creating a FITME-sourced record; any `migrated` creation; `CLIENT` calling `correctInferredKnowledge`; any supersession whose successor source the writer may not create. (Consent refusal is likewise decided before any port call, §17.)
2. **Dependent on persisted state → minimum bounded authority-resolution read only.** When authority depends on the persisted, immutable `source` of a target record (the caller supplies only an opaque `recordId`), the store performs only the minimum bounded read that resolves the target(s) — `getRecords` for the target record ids — and decides authority from the persisted `source`. No caller input (source, writer, ownership, permission or authority hint) substitutes for it, and authority is never encoded in ids.
3. **After an authority failure** there is no `commit`, no delete, no mutation, no `newId`, no concept creation, and no further read unrelated to resolving authority (in particular no `getConcepts` and no query). Authority is resolved before any concept or evidence expansion, id allocation or successor construction.
4. An authority-resolution read grants nothing; storage never confers permission.

---

# 17. Consent — [CANON P-3, A1 §08, GCUK Ch.19]

1. User Knowledge — both `user_stated` and governed FITME-inferred — is governed by the existing general learned-memory consent, registered as `LEARNED_MEMORY_PERSONALIZATION` (`consentScopeRegistry.js:28-29`). E.0.2c adds no consent scope and no per-topic permission.
2. The store receives `isLearningConsentGranted: () → boolean` at configure time; the composition root binds it to that scope (today: `EligibilityPolicy.deriveConsentStateFromProfile(userProfile).LEARNED_MEMORY_PERSONALIZATION.granted`). The store does not import either module (§08).
3. Every create, transition and read returns `CONSENT_NOT_GRANTED` (reads: empty result) unless the predicate returns exactly `true`; the port is not called. Fail-closed, mirroring `StateAccess.readUserStatedMemory` (`stateAccess.js:239-243`).
4. Forgetting and erasing (`forgetRecord`, `forgetConcept`, `eraseAllForUser`) are never consent-gated: withdrawing consent must never prevent deleting data. Their authority rules (§16.2) still apply.
5. Learning consent is not platform/source permission. Nothing here grants or implies access to any external or protected source (A1 §08).
6. Retention of existing records after consent withdrawal follows the existing Typed Memory behavior (retained, unreadable until re-granted); any different retention rule belongs to the deferred retention policy (§31).

---

# 18. Derived Views — [CANON GCUK Ch.09; DESIGN mechanics]

Pure functions exported by `UserKnowledgeContract`. Never stored; never read `relationDescription` or any label text.

| View | Definition |
|---|---|
| `epistemicOrigin(r)` | `user_stated` → `USER_STATED`; `inferred_event`/`inferred_pattern` → `FITME_INFERRED`; `coach_generated` → `COACH_GENERATED`; `migrated` → `MIGRATED` |
| `isExplicit(r)` | `r.source === 'user_stated' && r.status === 'active'` (GCUK Ch.09) |
| `isContextual(r)` | some factor has `role === 'condition'` (GCUK Ch.09) |
| `isExpired(r, now)` | `r.expiresAt !== null && now >= r.expiresAt` |
| `evidenceStanding(r)` | `{basis, supportingResolvable, supportingUnverified, supportingUnresolvable, contradictingResolvable, contradictingUnverified, contradictingUnresolvable, statementReferenceUnresolvable}`; `basis` = `EXPLICIT` for `user_stated`, else `SUPPORTED` if ≥1 supporting `RESOLVABLE`, else `UNVERIFIED` if ≥1 supporting `UNVERIFIED`, else `UNSUPPORTED` |
| `isUsableKnowledge(r, now)` | `r.status === 'active' && !isExpired(r, now) && evidenceStanding(r).basis !== 'UNSUPPORTED'` |
| `resolveConceptRoot`, `effectiveLabels` | §13.4 |

Binding on every future consumer (retrieval, reasoning, UI): records are selected and characterized through these views, never by re-deriving semantics from prose, and never by treating `confidence` as authority or truth.

A future "What FITME knows about me" surface can be built entirely from these views plus `correctionHistory`/`history` (P-5); none is required for normal operation.

---

# 19. Proposal Validation Helper (for future interpreters) — [CANON GCUK Ch.05/10; A-F; A-G; DESIGN]

`validateFactorProposal(proposal, presentedConcepts) → {ok:true, factors, newConceptLabels} | {ok:false, code}`

- `presentedConcepts`: the bounded list `{conceptId, labels}` a future interpreter was shown in its **single** bounded call.
- Each proposed factor either references a `conceptId` that is a literal, exact member of `presentedConcepts` (call-scoped membership, the E.0.2b §15.1 discipline) or requests a new concept with a label satisfying §13.1. An unknown id is rejected per factor, never trusted.
- Roles must be in `FACTOR_ROLES`; value text must satisfy §10.1.
- Returns data only. It creates nothing, calls nothing and confers no authority; creation still flows through the store (§16, §17).

Purpose: fix now that future concept resolution happens **inside** the bounded intake/consolidation call that proposes a record — one call per operation, never one call per concept, relationship, memory or evidence item (A-G) — with deterministic validation afterwards.

---

# 20. Persistence Port and Conformance — [A-A; DESIGN]

## 20.1 Port contract

```
UserKnowledgePort {
  newId(kind: 'record'|'concept'|'event'|'confound') → string          // sync; ID_PATTERN; unique per user store
  getRecords(userId, recordIds: string[1..MAX_READ_BATCH]) → Promise<UserKnowledgeRecord[]>
  getConcepts(userId, conceptIds: string[1..MAX_READ_BATCH]) → Promise<Concept[]>
  queryRecordsByConcepts(userId, { conceptIdsAny: string[1..10], statuses: STATUSES[1..5], limit: 1..50 })
      → Promise<UserKnowledgeRecord[]>                                // ordered updatedAt desc, recordId asc
  queryRecentConcepts(userId, { limit: 1..50 }) → Promise<Concept[]>  // ordered updatedAt desc, conceptId asc
  queryConceptsMergedInto(userId, conceptId, { limit: 1..50 }) → Promise<Concept[]>   // concepts whose mergedInto === conceptId
  commit(userId, changeSet) → Promise<{status:'COMMITTED'} | {status:'CONFLICT'} | {status:'FAILED'}>
  deleteRecord(userId, recordId) → Promise<{status:'DELETED'|'NOT_FOUND'|'FAILED'}>
  deleteConcept(userId, conceptId) → Promise<{status:'DELETED'|'NOT_FOUND'|'FAILED'}>
  deleteRecordsBySources(userId, sources: SOURCES[1..5]) → Promise<{status:'DELETED'|'FAILED'}>
  deleteAll(userId) → Promise<{status:'DELETED'|'FAILED'}>             // both logical stores
}
```

The port knows nothing about writer authority; the store (§16) decides which operation may be requested. A future adapter at a trust boundary enforces the same rules independently (§16.3).

Binding port requirements (verified by the conformance suite, §30):
1. **Atomic commit:** all creates and updates apply, or none do. Any update whose stored `version` differs from `expectedVersion`, or any create whose id exists, yields `CONFLICT` and applies nothing.
2. **Bounded reads only:** there is no list-all operation. Every read has an explicit bound. Query results never exceed `limit`.
3. **Per-user isolation:** every operation is scoped by `userId`; no operation can read or write another user's documents.
4. **Documents round-trip unchanged:** a committed document reads back deep-equal.
5. **Never throws:** failures resolve to `FAILED`.

`queryRecordsByConcepts` and `queryRecentConcepts` exist so bounded, concept-keyed retrieval (E.0.2g) and bounded concept presentation to a future interpreter (§19) are possible without full scans (Product finding 2). E.0.2c implements no retrieval policy and no caller of either.

## 20.2 Store operations

`UserKnowledgeStore` exposes: `createRecord`, `promoteRecord`, `retractRecord`, `archiveRecord`, `supersede`, `correctInferredKnowledge` (`SERVER` only, §15.4), `appendEvidence`, `applyEvidenceAvailability`, `addConfound`, `recordConfoundCheck`, `setConfidence`, `raiseSafetyFlag`, `createConcept`, `addConceptLabel`, `removeConceptLabel`, `mergeConcept`, `unmergeConcept`, `getRecords`, `getConcepts`, `forgetRecord`, `forgetConcept`, `eraseAllForUser`.

`forgetConcept` checks `queryRecordsByConcepts({conceptIdsAny: [id], statuses: all five, limit: 1})` and `queryConceptsMergedInto(id, {limit: 1})`; either non-empty → `CONCEPT_IN_USE`. A `Confound.conceptId` is a soft reference: referential integrity is checked when the confound is written (§13.7); after the concept is forgotten, the confound keeps its id and description, and the id simply no longer resolves. `eraseAllForUser` calls `deleteRecordsBySources(['user_stated'])` under `CLIENT` and `deleteAll` under `SERVER`.

Each write: consent gate (§17) → request shape check → authority decidable without persisted state (§16.4 item 1) → minimum authority-resolution read of target records and authority decision (§16.4 item 2) → remaining bounded reads (concepts) → mint ids → planner (§14/§15/§13) → authority matrix re-applied to the complete change set (§16) → validate every resulting document → `port.commit()`. Result `{status: 'COMMITTED', ids} | {status: 'REJECTED', code} | {status: 'CONFLICT'} | {status: 'FAILED'} | {status: 'NOT_CONFIGURED'} | {status: 'CONSENT_NOT_GRANTED'} | {status: 'NO_CHANGE'}`. Never throws; never retries (a `CONFLICT` is returned to the caller, which may re-read and re-plan).

## 20.3 Reference port

`tests/fixtures/userKnowledgeInMemoryPort.js` — an in-memory implementation of §20.1 used by the unit tests and as the reference target of the conformance suite `tests/fixtures/userKnowledgePortConformance.js` (an exported function that runs the §20.1 requirements against any port factory). Every future adapter (for the current Web shell, a native shell, or the governed authority boundary) must pass the same suite.

---

# 21. Storage Boundary and Physical Persistence Decision — [CANON ADP-2; A-A; GCUK Ch.09/15/22]

## 21.1 Decision — logical sibling stores (canonical)

User Knowledge lives in **two dedicated logical stores**, siblings of Typed Memory and not a Typed Memory type:

- **User Knowledge Records** — `UserKnowledgeRecord` documents (§10).
- **User Knowledge Concepts** — `Concept` documents (§13).

The logical stores, the port (§20) and the authority rules (§16) are the canonical domain architecture. No physical path, collection name, SDK or vendor is part of the platform-neutral contract (A1 §04). GCUK explicitly permits a dedicated sibling store under the identical security-rule family (Ch.09 Non-Interpretations; Ch.15; Ch.22).

## 21.2 Adapter guidance for the current Web shell (non-normative for the core; recorded for the first persisting Work Item)

- Proposed Firestore mapping: records at `users/{uid}/userKnowledgeRecords/{recordId}`; concepts at `users/{uid}/userKnowledgeConcepts/{conceptId}`.
- Proposed rules, the Typed Memory family reused verbatim (ADP-1 option (a)): records — owner-only read; client create only when `source == 'user_stated'`; client update/delete only on existing `user_stated` records; `source` immutable; FITME-sourced records written, updated and deleted only through the governed authority boundary. Concepts — owner-only read; client create/update limited to the §13.1 key set (`hasOnly`, the `coachConversation` rules precedent); owner delete.
- These are guidance for a future adapter and may be refined by that Work Item, provided the adapter passes the conformance suite (§20.3) and enforces §16.

## 21.3 Why a sibling store — repository evidence

| Criterion | Typed Memory type | Sibling store |
|---|---|---|
| Non-destructive correction (P-4) | D6 renders every `MEMORY_TYPES` entry and its edit replaces `payload` wholesale (`js/memory.js:438-451`, `:531-540`): a UK record would be user-editable destructively, and an unapproved UI change would ship | Not rendered by D6; no destructive edit path exists |
| No production behavior change | Adding a type changes D6 output and C4/client vocabularies | No existing reader sees it |
| Per-turn cost | Every Decision Pass fetches the entire `memories` collection (`js/app.js:2319`, `js/memory.js:189-195`); UK records would enlarge that read for every turn | Not read by existing paths; only bounded port reads (§20) |
| Concept Identity | Concepts are not memories (no source/status); would need a second type or store anyway | Natural sibling collection |
| Future retrieval | Semantics would live in type-specific `payload`; concept index nested | Top-level `conceptIds` array queryable (§20.1) **[INFERENCE: Firestore `array-contains-any` supports ≤ 30 values; `MAX_QUERY_CONCEPT_IDS` = 10 stays within it]** |
| Platform neutrality | Couples to `js/memory.js` (DOM + Firebase globals; A1 §10 item 16) | Independent of `js/memory.js` |
| C4 lockstep drift | Must add a type to both vocabularies (§04 item 6) | C4 and `MEMORY_TYPES` untouched; no lockstep rule needed now |
| Authority model | Inherited by reuse | Inherited by identical `source`/`status` vocabulary, identical client/governed-boundary split (§16), identical rules family (§21.2 guidance) |
| Migration later | None | None (no existing UK data) |
| Cost of choice | — | A separate reset/deletion step (§21.4) and a separate rules block |

## 21.4 What E.0.2c implements vs. what the first persisting Work Item implements — [CANON ADP-2]

E.0.2c implements the platform-neutral port contract, its deterministic behavioral requirements (atomicity, version checks, bounded reads, isolation), the conformance suite, the in-memory reference port, and the source/authority semantics enforced by the store. **The Web-shell adapter, its rules, the `resetApp()` integration and all live persistence wiring are implemented by the first Work Item that persists a real User Knowledge record**, and that adapter must pass the §20.3 conformance suite. E.0.2c ships no live adapter.

Binding preconditions recorded for that later Work Item:
1. No User Knowledge record may be persisted in production until the user's full reset erases both logical stores completely. Under ADP-1 option (a), that includes a governed erase for FITME-sourced records and concepts (§15.5 guarantee 4). Today's `deleteAllMemories()` skips server-sourced Typed Memory (§04 item 12); that pre-existing gap is not repaired by this Work Item.
2. No FITME-sourced record may be persisted until a governed path exists through which the user can correct, withdraw and forget it (UC-1, ADP-1).

---

# 22. Open-World Invariants — [CANON GCUK Ch.04 invariants 1, 8, 9, 11, 20; A-B; A-C]

1. No closed field describes user content. Every closed vocabulary is listed in §09.1 and describes process, governance, grammar or store identity only.
2. A new user concept, relationship, food, activity, place, routine, symptom, life event or relationship type never requires a code, schema or enum change.
3. Concepts are per-user; no global ontology or synonym table exists.
4. Relationships are N-ary (`factors[]`, 1..8); no binary-edge reduction; no predicate vocabulary.
5. The pressure-test examples in §27 appear only in tests as fixture strings; none appears in `js/`.
6. Existing closed intake vocabularies (`PREFERENCE_CLASSES`, `DOMAINS`/`TOPICS`, activity identity) are not reused as User Knowledge fields and are not extended.

---

# 23. Non-Causal Invariant — [CANON GCUK Ch.20; A-E]

1. The record has no field that can express causation, truth or verification; the exact-key rule (§10.2 rule 1) rejects any such addition.
2. `relationDescription` is stored text only: no production module other than `userKnowledgeContract.js` (length/normalization) reads it; no derived view inspects it.
3. `confidence` expresses strength of evidence for an association, never truth; no view treats any confidence value as establishing a fact.
4. Inferred records can never carry `EXPLICIT_STATEMENT` and are born `candidate`; promotion requires the confound-check marker (§14.4).
5. No relationship-type taxonomy is introduced to express causality (A-E).
6. Any causal-sounding language in future reasoning output remains subject to existing Safety/Expression review (GCUK Ch.20); nothing here bypasses it.

---

# 24. Safety — [CANON GCUK Ch.06/07/19; A1 §05.6]

1. `safetyFlag` is required with no default. `SAFETY_ADJACENT` marks a record for the elevated `reasoningAccessAuthorized` check before it may ever reach reasoning, and for exclusion from Semantic Context Discovery's candidate catalogue (A1 §05.6). Both enforcements belong to E.0.2g; E.0.2c stores and validates the flag only.
2. The flag is monotonic in place (`STANDARD` → `SAFETY_ADJACENT` only). Lowering it requires supersession by a new record.
3. `safetyFlag` is never a Safety determination and never Safety authority. No Safety module reads User Knowledge; User Knowledge never becomes an input to Phase D characterization, Stage 8/9, `userSafetyContext`, `userSafetyProvenance`, `safety_disclosure` or `risk_characteristic_fact`, all of which remain separate and unchanged.
4. No Safety module is modified.

---

# 25. Application-Ready Compliance — [CANON A1 §04 Invariant 21; C1 §14.3]

1. The three core modules satisfy the C1 §14.3 test (AC-40).
2. They have no dependency outside §08's table (AC-41); no clock, random or crypto use (AC-42).
3. Platform concerns (Firestore paths, SDK types, reset flow, session generation, authentication) live only in the future adapter beneath the port.
4. A native or server host uses the same modules with its own port implementation and its own `writerAuthority`; nothing in §09–§20 changes.

---

# 26. Model-Call and Cost Effect — [A-G]

- **Zero model calls.** No module contains `callClaude`, `configure({callClaude})` or a prompt (AC-43). Production call counts and the TRR request-body hash are unchanged (AC-44).
- No production runtime path invokes any new module in E.0.2c (AC-45).
- Future cost shape fixed by this contract: records are stored already structured, so later retrieval needs no re-interpretation per turn (contrast the per-turn reclassification in `memoryLayer.js:300-700`); concept resolution is validated after one bounded call (§19), never one call per concept/relationship/memory/evidence item; retrieval reads are bounded (§20).

---

# 27. Pressure Tests — [structural demonstration; AC-50 … AC-56 exercise each with synthetic fixtures]

Each case lists what E.0.2c structurally enables (provable now, deterministically) and what remains impossible until later steps.

## A. "I slept badly all week and today's leg session felt unusually hard."

- **Enabled:** concepts created at runtime (for example labels "sleep", "leg session", "how hard the session felt"); an inferred record (`source: inferred_pattern`, `status: candidate`, `evidenceClass: CO_OCCURRENCE` or `RECURRENCE`) with three factors (sleep = condition, value "poor all week"; leg session = subject; perceived difficulty = outcome, value "unusually hard"), `supporting` references to `CONVERSATION_TURN` ids, a confound slot, and promotion blocked until a confound check is recorded. No sleep→training rule, field or enum exists.
- **Impossible until later:** proposing the record from observations (E.0.2d), confound reasoning and promotion (E.0.2e), retrieval (E.0.2g). **[GAP]** FITME stores no sleep or perceived-exertion observations (workouts store only calories burned, `js/app.js:1568-1576`), so early evidence is conversational only.

## B. "I've noticed pasta before evening training makes me feel heavy."

- **Enabled:** a `user_stated`, `EXPLICIT_STATEMENT`, `active`, `DURABLE` record with factors pasta (subject), evening training (condition, value "before"), feeling heavy (outcome), `relationDescription` stating what the user noticed, and a `CONVERSATION_TURN` reference. Its user-stated origin is permanent (§12.2). No field marks it universal or causal.
- **Impossible until later:** recognizing the statement in conversation and routing it to the store (explicit-statement intake — see §28 ADP-3 on ownership).

## C. Two months later: "Should I eat pasta before training tonight?"

- **Enabled:** a bounded `queryRecordsByConcepts({conceptIdsAny: [pasta root and merged concepts], statuses: ['active'], limit})` returns the record without reading history; `isUsableKnowledge()` and `epistemicOrigin()` characterize it.
- **Impossible until later:** resolving the Need's mentions to concept ids and joining User Knowledge to the discovery catalogue (E.0.2g), which also requires resolving the `contextCeiling` restriction on per-user ids and cross-catalogue id namespacing (§31).

## D. "Actually pasta isn't the problem — it was the huge portions."

- **Enabled:** `supersede` atomically creates a new `user_stated` `active` record (large portion = condition, pasta meal = subject, feeling heavy = outcome) with `supersedes: [B]`, and moves B to `superseded` with `supersededBy: [new]`, a `SUPERSEDED` history entry and a user-sourced confound ("portion size, not pasta itself"). B remains intact. This runs under `CLIENT` because B is user-stated. Had B been FITME-inferred, the correction would run under `SERVER` as `correctInferredKnowledge` (§15.4): one atomic change set, successor anchored to the user's turn, INV-UC-S enforced. The client alone could not supersede it (ADP-1). If the user instead asks FITME to forget what it knew about pasta, that is `forgetRecord` (§15.5), not supersession and not an evidence event.
- **Impossible until later:** classifying the utterance as a correction (or a forget request) and identifying B as its target (E.0.2f); the governed path that carries a user's intent to `SERVER` for inferred records (§31).

## E. A completely novel user-specific relationship

- **Enabled:** fixture strings verified absent from `js/` (a personal routine, an unusual activity and a life circumstance in one 3-factor record) validate, persist and read back through the unmodified modules. No release is required.
- **Impossible until later:** producing it from conversation or observation (d/e/f).

## F. Supporting evidence later deleted or unavailable

- **Enabled:** `applyEvidenceAvailability` marks the reference `UNRESOLVABLE` with a reason and a history entry; the reference is not removed or replaced; an inferred record with no remaining non-unresolvable support has standing `UNSUPPORTED` and `isUsableKnowledge()` false while its status is unchanged; a `user_stated` record keeps `EXPLICIT` standing, stays usable, and exposes `statementReferenceUnresolvable: true` (PD-1). In no case does the availability change withdraw, forget or supersede the record (UC-2): deleting the conversation the evidence came from is not, by itself, a request to forget the knowledge.
- **Impossible until later:** resolver adapters and the cadence that runs them (d/e); the broader retention policy (§11.5).

## G. Two concepts merged, then the merge reversed

- **Enabled:** "pasta" and "spaghetti" start distinct; `mergeConcept(spaghetti → pasta)` sets only `mergedInto` plus history; records referencing either are untouched; `resolveConceptRoot` and `effectiveLabels` reflect the merge; `unmergeConcept(spaghetti)` restores exact prior resolution with both events retained.
- **Stated limitation:** a record created during the merge that referenced "pasta" for something that was really "spaghetti" is not re-attributed by unmerge (§13.5).
- **Impossible until later:** deciding that two concepts should be merged or unmerged (d/f).

---

# 28. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Resolved by Product/Architecture review (recorded in §06)**
- **PD-1 — approved** with the UC-2 distinction (loss of evidence ≠ explicit forget/delete).
- **ADP-1 — option (a), server-routed** (§15.4, §16.2). No GCUK amendment.
- **ADP-2 — approved** (§21.4). Logical sibling stores canonical; Firestore mapping is adapter guidance only.
- **ADP-4 — approved** with the `conceptIds` derived-index invariant (§10.4).
- **ADP-5 — approved:** atomic governed-boundary correction via `correctInferredKnowledge` under INV-UC-S (§15.4); no pending-supersession state; C4 unchanged. The two-authority alternative is rejected.

**Architecture Decision Pending**
- None for E.0.2c.

**Recorded for post-c review (not E.0.2c decisions; A-H)**
- **ADP-3:** GCUK Ch.23 assigns consolidation to E.0.2d/e and correction to E.0.2f, but assigns governed intake of explicit, non-corrective user statements (scenario B) to no lettered step, while OU-001 §15 rule 4 requires such intake to be its own approved mechanism. E.0.2c is independent of the answer: any intake writes `user_stated` records through `createRecord` under `CLIENT`.

**Product Decision Pending**
- None.

**Engineering Decision Pending**
- None beyond the §09.2 constants, submitted as DESIGN.

**Repository Gaps**
- **[GAP]** No sleep, perceived-exertion or subjective-outcome observations are stored (§27 A).
- **[GAP]** Meals have no stable identifiers; day-level evidence granularity only (§11.1).
- **[GAP]** Server-sourced Typed Memory records survive `resetApp()` (`js/memory.js:159-172`); no server-sourced record exists today; not repaired here (§21.4).
- **[GAP]** C4 `MEMORY_TYPES` drift (7 vs 9); not relevant to the chosen sibling store; not repaired.

**Canonical Conflicts**
- None found. INV-UC-S is a User Knowledge authority contract; it does not modify, contradict or generalize C4's capability-scope rule CD-C4-05 (§15.4 C4 isolation).

---

# 29. Integration Map

| System | Direction | Owner | E.0.2c relationship |
|---|---|---|---|
| Typed Memory (`js/memory.js`), D6 UI | none | Typed Memory | Unmodified; vocabularies reused by value (§09.1) |
| C4 (`functions/typedMemoryServerWrite.js`) | none | C4 | Unmodified; precedent for server authority |
| `firestore.rules` | none | platform | Unmodified in E.0.2c (§21.4) |
| `StateAccess`, `memoryLayer.js` | none | B3 / Memory Layer | Unmodified; no new read op |
| `ConsentScopeRegistry` / `EligibilityPolicy` | none (predicate injected) | E.0.2a | Unmodified (§17) |
| `ContextComposer`, `ContextRelevancePlanner`, discovery interpreter | none | E.0.2b | Unmodified (E.0.2g) |
| Safety modules, intake gates, orchestrator, Expression, TRR, OU-001 | none | respective owners | Unmodified |
| `js/app.js`, `index.html`, `sw.js` | none | shell | Unmodified; `APP_VERSION` unchanged |

---

# 30. Test Plan and Acceptance Criteria

All tests are deterministic, run under `node --test tests/*.test.js`, and use the in-memory port. New files: `tests/e02cUserKnowledgeContract.test.js`, `tests/e02cUserKnowledgeTransitions.test.js`, `tests/e02cUserKnowledgeStore.test.js`, `tests/e02cUserKnowledgeStatic.test.js`, `tests/fixtures/userKnowledgeInMemoryPort.js`, `tests/fixtures/userKnowledgePortConformance.js`.

**Zero drift**
- AC-0: every existing test passes unmodified; no existing test file changes.

**Record contract**
- AC-1: a minimal valid record for each creatable source validates; every §10.2 rule has a failing fixture with the specified code.
- AC-2: unknown top-level and nested keys (`causal`, `isTrue`, `verified`, `claimType`, `category`, `domain`, `topic`) are rejected.
- AC-3: `EXPLICIT_STATEMENT` with any non-`user_stated` source, and `user_stated` with any other class, are rejected.
- AC-4: duplicate factors, 0 and 9 factors, over-length texts, un-normalized text are rejected.
- AC-5: `DURABLE` with `expiresAt`, and `expiresAt ≤ createdAt`, are rejected.
- AC-6: `status: 'superseded'` without `supersededBy`, and `supersededBy` without `superseded`, are rejected.

**Evidence**
- AC-7: evidence `ref` containing whitespace or exceeding 200 characters is rejected; duplicate `refId`s across lists are rejected.
- AC-8: `planEvidenceAvailability` changes only availability fields and appends one history entry per changed reference; references are never removed or reordered; an unknown `refId` is rejected; a resolver result carrying extra keys is rejected.
- AC-9: `evidenceStanding` and `isUsableKnowledge` produce the §11.3/§18 results for: all supporting unresolvable (inferred → `UNSUPPORTED`, unusable); mixed; user-stated with unresolvable statement reference (`EXPLICIT`, flag true, usable); `UNRESOLVABLE` → `RESOLVABLE` recovery.
- AC-10: `reason` values never change any derived view.

**Lifecycle**
- AC-11: every §14.2 transition succeeds under its conditions; every other from/to pair is rejected; terminal statuses reject all transitions and mutations.
- AC-12: user-stated creation yields `active`; server-source creation yields `candidate` even when the request asks for `active`.
- AC-13: promotion of a non-user-stated record without `confoundCheck`, or with only unresolvable supporting evidence, is rejected; with both, it succeeds.
- AC-14: in-place mutations never alter `factors`, `conceptIds`, `relationDescription`, `evidenceClass`, `temporality`, `expiresAt`, `source` or `provenance` (deep comparison).
- AC-15: `planRaiseSafetyFlag` only raises; lowering is not expressible.
- AC-16: history is append-only, ordered, carries the configured writer, and never accepts a caller-supplied writer; capacity behaves per §14.5.

**Correction/supersession**
- AC-17: `supersede` produces exactly one create and one update per predecessor, with symmetric links, history entries and carried confounds; the predecessor's content, evidence and prior history are byte-identical apart from the specified fields.
- AC-18: `supersede` against a terminal predecessor, a foreign-user predecessor, or an invalid successor is rejected with no change.
- AC-19: a port that fails `commit` leaves both predecessor and successor states unchanged (no partial state).
- AC-20: a stale `expectedVersion` yields `CONFLICT` and no change.

**Concept Identity**
- AC-21: concepts accept labels in any language (Hebrew and English fixtures) and reject duplicates under `normalizeLabelKey`.
- AC-22: merge sets only `mergedInto` and history; no record document changes; self-merge, cycle, already-merged source, cross-user and over-depth merges are rejected.
- AC-23: `resolveConceptRoot`/`effectiveLabels` reflect merges; unmerge restores exact prior resolution; both events remain in history.
- AC-24: label removal keeps the label in history; removing the last label is rejected.
- AC-25: a record referencing an unknown or foreign concept is rejected; a concept created in the same change set is accepted.

**Authority and consent**
- AC-26: every §16.2 matrix cell is tested for both writer authorities, under §16.4. Every forbidden operation whose authority depends on a persisted target (in particular every `CLIENT` attempt to promote, withdraw, archive, mutate, supersede or forget a FITME-sourced record, ADP-1 option (a), and every `SERVER` attempt on a `user_stated` record) returns `AUTHORITY` after exactly the minimum authority-resolution read (`getRecords` for the target ids) and with zero `newId`, zero `commit`, zero delete, zero storage mutation and no concept or evidence read. Every forbidden operation decidable without persisted state (§16.4 item 1) returns `AUTHORITY` with zero port calls.
- AC-27: no store operation accepts `writer`, `writerAuthority` or an initial status override; supplying them has no effect or is rejected.
- AC-28: with the consent predicate returning `false`, `undefined`, a non-boolean, or throwing, every write and read returns `CONSENT_NOT_GRANTED` and the port is never called; deletion still works.
- AC-29: an unconfigured store returns `NOT_CONFIGURED` for every operation; no operation throws.

**Proposal helper**
- AC-30: `validateFactorProposal` accepts only literal presented concept ids and valid new-label requests; hallucinated, differently-cased and foreign ids are rejected; it produces no side effect.

**Port**
- AC-31: the conformance suite passes against the in-memory port: atomicity, version conflict, duplicate create, bounded reads, query ordering and limits (including `queryConceptsMergedInto`), per-user isolation, round-trip equality, the four delete operations' exact scope, never-throw.
- AC-32: the port contract has no list-all operation; the store never requests more than the §09.2 bounds.

**Derived views**
- AC-33: each §18 view matches its definition on a fixture matrix; no view reads `relationDescription` or label text (static and dynamic: views return identical results when those strings are replaced).

**Open world / non-causal**
- AC-34: the exported vocabularies are exactly §09.1's; a static scan of the three modules finds no content vocabulary (test-held denylist of domain words in English and Hebrew, mirroring E.0.2b AC-8).
- AC-35: E's novel fixture strings are verified absent from `js/` and round-trip through the store.
- AC-36: no production module other than `userKnowledgeContract.js` contains the token `relationDescription`.

**Safety**
- AC-37: no Safety module, intake gate, `memoryLayer.js`, `internalPipelineOrchestrator.js` or `decisionFormation.js` references any new module; Safety module files are byte-unchanged.

**`conceptIds` derived index (ADP-4)**
- AC-38: every planner output's `conceptIds` equals `deriveConceptIds(factors)` for fixtures with repeated, unordered and mixed-case concept ids (ordering is code-unit order; no case folding).
- AC-39: a record draft carrying `conceptIds` is rejected (`DERIVED_FIELD_SUPPLIED`); a stored document whose `conceptIds` omits, adds, reorders or duplicates an id is rejected (`CONCEPT_INDEX_MISMATCH`), including when returned by a tampered port before a mutation; no operation changes `conceptIds` after creation, including merges.

**Application-Ready and isolation**
- AC-40: C1 §14.3 static test over the three modules (no `document.`, `localStorage`, `sessionStorage`, `indexedDB`, `navigator.`, `fetch(`, `firebase`, `Firestore`, `serviceWorker`, `window.` other than the export line, `db.`, `currentUser`); each loads under Node.
- AC-41: dependency scan matches §08's table exactly.
- AC-42: no `Date.now`, `new Date`, `Math.random`, `crypto` in the three modules.
- AC-43: no `callClaude`, `configure({callClaude` or prompt text in the three modules.
- AC-44: the existing production-backed suites (`ou001ProductionBackedAcceptance`, `e02bProductionBackedAcceptance`, TRR/DUC/E.0.2a zero-drift suites) pass unmodified: call counts and TRR hash unchanged.
- AC-45: static: no file outside the three modules and the new tests references `UserKnowledgeContract`, `UserKnowledgeTransitions` or `UserKnowledgeStore`; `index.html`, `sw.js`, `js/app.js`, `firestore.rules`, `js/memory.js`, `functions/**` are byte-unchanged.

**User control: withdraw, forget, erase (UC-1, UC-2)**
- AC-46: `forgetRecord` removes the record; afterwards no other record, concept or history entry in the store contains any of its text (deep string scan); links and references to it remain as ids; the operation succeeds with consent withdrawn.
- AC-47: `forgetConcept` is rejected with `CONCEPT_IN_USE` while any record factor references it (any status) or any concept is merged into it; otherwise it removes the concept; confounds that referenced it keep their id and description.
- AC-48: `eraseAllForUser` under `CLIENT` removes every `user_stated` record and nothing else; under `SERVER` it removes every record and concept; neither touches another user's data.
- AC-49: loss ≠ forget: applying `UNRESOLVABLE` availability (every reason, including `USER_DELETED` and `USER_RESET`) to every reference of a record never changes its `status`, never deletes it, and never produces a `RETRACTED`, `SUPERSEDED` or `ARCHIVED` history entry; withdrawal and forgetting are reachable only through their own operations.

**Pressure tests**
- AC-50 … AC-56: §27 A–G, each as a synthetic end-to-end store scenario asserting exactly the "Enabled" column.

**Governed correction of inferred knowledge (ADP-1, ADP-5, INV-UC-S)**
- AC-57: `correctInferredKnowledge` under `SERVER` with every INV-UC-S condition satisfied commits exactly one successor creation (`user_stated`, `active`, `EXPLICIT_STATEMENT`, `supporting` exactly the anchor turn, `supersedes` = targets) and one supersession update per target (symmetric links), every appended history entry carrying `userOriginTurnId`. Violating each condition 1–5 individually (including a `user_stated` or terminal target, a missing or malformed `userOriginTurnId`, `originTurnId` mismatch, extra or inferred supporting evidence, non-empty `contradicting`, a non-user confound, a missing history anchor) yields `INVALID_USER_CORRECTION` (or `CORRECTION_IDENTICAL_TO_PREDECESSOR` for condition 5) with no change.
- AC-58: a supersede whose predecessors mix `user_stated` and FITME-sourced records is rejected (`MIXED_AUTHORITY_PREDECESSORS`) under both authorities, with no change.
- AC-59: INV-UC-S exclusivity: under `SERVER`, `createRecord` with `source: 'user_stated'`, and generic `supersede` with a `user_stated` successor, return `AUTHORITY`; `correctInferredKnowledge` under `CLIENT` returns `AUTHORITY`; a static scan shows `correctInferredKnowledge`/`planCorrectInferredKnowledge` is the only code path that can emit a `user_stated` document while the writer is `SERVER`; no operation changes any record's `source`.
- AC-60: no relabeling: a `correctInferredKnowledge` successor whose content equals a target's content (same concept ids, same factors, same normalized `relationDescription`) is rejected with `CORRECTION_IDENTICAL_TO_PREDECESSOR`; the inferred target is unchanged and no `user_stated` record exists afterwards.
- AC-61: atomicity: with a port that fails or conflicts on `commit`, a `correctInferredKnowledge` call leaves neither a successor nor any superseded target; no record in the store ever has a status outside §09.1's five, and no intermediate state is observable.

**Identity binding (§16.1)**
- AC-62: `userId` grants no authority (§16.1): a request carrying `userId` is rejected (`UNKNOWN_FIELD`); a store configured with another `userId` can neither see nor mutate the first user's records; a `CLIENT` store configured with the owning `userId` still receives `AUTHORITY` on that user's FITME-sourced records; a document returned with a foreign `userId` is rejected (`STORED_DOCUMENT_INVALID`); statically, the authority decision reads only the writer authority and the persisted `source`, never `userId`.

**Review checklist (not automated)**
- R-1: `git diff` touches only §33 files.
- R-2: every non-goal in §02 holds.
- R-3: every closed vocabulary is justified as process/governance in review.

---

# 31. Deferred to Later Steps — [CANON GCUK Ch.23; A-H]

| Deferred item | Owner |
|---|---|
| Consolidation interpreter proposing records and concepts (using §19 inside one bounded call) | E.0.2d |
| Evidence resolver adapters and cadence | E.0.2d/e |
| Confound-aware evidence/confidence model, thresholds, promotion policy, decay/staleness horizons | E.0.2e |
| Governed entry point at the authority boundary for FITME-sourced writes (C4-style), and hosting of consolidation | E.0.2d/e (A1 §10 item 13) |
| Conversational correction, withdrawal and forget-request classification and targeting | E.0.2f |
| Mechanism carrying a user's correction/withdrawal/forget intent for FITME-inferred records to the governed boundary (ADP-1), including verifying that `userOriginTurnId` names the user's own current turn before `correctInferredKnowledge` is called | E.0.2f with the governed entry point |
| How a user's confirmation (not correction) of inferred knowledge is recorded | E.0.2f |
| Explicit-statement intake ownership | ADP-3 |
| Web-shell adapter, rules, `resetApp()` integration, live persistence wiring, including governed full erase | first persisting Work Item (§21.4) |
| Retrieval: Need-to-concept resolution, top-K policy, catalogue integration, cross-catalogue id namespacing, `contextCeiling` restriction on per-user ids, selection-gated reads, `safetyFlag` → `reasoningAccessAuthorized` enforcement | E.0.2g (A1 §10 items 1–2) |
| Retention/privacy policy: whether evidence or chat deletion should also withdraw/forget derived knowledge; audit trace of forget actions; retention after consent withdrawal | future Product/Architecture decision (acts through §15.5) |
| Re-attribution of records created during a later-reversed merge | d/f |
| User-timezone interpretation of recurring windows | E.0.2e/g (A1 §10 item 15) |
| Transparency UI | future Product decision |
| Post-c ordering of d/e/f/g | Product/Architecture review after E.0.2c closes (A-H) |

---

# 32. Canonical Amendments Required

- None. ADP-1 option (a) preserves GCUK Ch.15 as written.

---

# 33. Exact Implementation Scope

**New files**
- `js/coachDecisionSystem/userKnowledgeContract.js`
- `js/coachDecisionSystem/userKnowledgeTransitions.js`
- `js/coachDecisionSystem/userKnowledgeStore.js`
- `tests/e02cUserKnowledgeContract.test.js`
- `tests/e02cUserKnowledgeTransitions.test.js`
- `tests/e02cUserKnowledgeStore.test.js`
- `tests/e02cUserKnowledgeStatic.test.js`
- `tests/fixtures/userKnowledgeInMemoryPort.js`
- `tests/fixtures/userKnowledgePortConformance.js`

**Modified existing files:** none.

**Forbidden changes:** every file named in §02's non-goals and §29; any existing test; any version literal.

---

# 34. Failure Catalogue

| Failure | Detection | Owner | Result | Fallback | Logging | Test |
|---|---|---|---|---|---|---|
| Invalid document/request | validator | contract | `REJECTED{code}` | nothing written | none | AC-1…AC-7 |
| Disallowed transition | planner | transitions | `REJECTED{code}` | nothing written | none | AC-11 |
| Authority violation | matrix | store | `REJECTED{AUTHORITY}` | nothing written; no `newId`, `commit` or delete; zero port calls when decidable without persisted state, otherwise only the minimum target authority-resolution read (§16.4) | none | AC-26, AC-57 |
| Mixed-authority correction | planner | transitions | `REJECTED{MIXED_AUTHORITY_PREDECESSORS}` | caller splits into per-authority change sets | none | AC-58 |
| Governed correction violates INV-UC-S | planner | transitions | `REJECTED{INVALID_USER_CORRECTION}` or `REJECTED{CORRECTION_IDENTICAL_TO_PREDECESSOR}` | nothing written | none | AC-57, AC-60 |
| `SERVER` attempts `user_stated` outside `correctInferredKnowledge` | matrix | store | `REJECTED{AUTHORITY}` | nothing written; port not called | none | AC-59 |
| Derived field supplied / index mismatch | validator | contract | `REJECTED{DERIVED_FIELD_SUPPLIED}` or `REJECTED{CONCEPT_INDEX_MISMATCH}` | nothing written | none | AC-38, AC-39 |
| Concept still in use | store | store | `REJECTED{CONCEPT_IN_USE}` | concept kept | none | AC-47 |
| Consent not granted | predicate | store | `CONSENT_NOT_GRANTED` | port not called; reads empty | none | AC-28 |
| Not configured | configure check | store | `NOT_CONFIGURED` | nothing | none | AC-29 |
| Version conflict | port | port | `CONFLICT` | nothing applied; caller may re-plan | none | AC-20 |
| Persistence failure | port | port | `FAILED` | nothing applied | none (adapter-level telemetry is a future adapter concern) | AC-19 |
| Capacity reached | planner | transitions | `HISTORY_CAPACITY`/`CAPACITY_EXCEEDED` | supersede with a fresh record | none | AC-16, AC-24 |
| Merge chain invalid | resolver | contract | `MERGE_CHAIN_INVALID` | no resolution returned | none | AC-22 |
| Evidence unavailable | future resolver | E.0.2d/e | availability marked; standing derived | never replaced | history entry | AC-8, AC-9 |

No fallback fabricates a record, evidence, concept or status.

---

# 35. Cross-Document Consistency Review

| Check | Result |
|---|---|
| GCUK Ch.09 shape | All canonical fields present with canonical names and vocabularies; additions listed in ADP-4 |
| GCUK Ch.10 | Per-user store `{conceptId, userId, labels, createdAt, mergedInto}` plus version/history; merge logged, reversible, non-destructive |
| GCUK Ch.11 | N-ary factors with the 3-value role; no binary reduction |
| GCUK Ch.12 | References never copies; confounds; confound-check minimum; no Habit/Pattern thresholds reused |
| GCUK Ch.13 | Supersede never delete; user-stated successor outranks by source; user confound carried |
| GCUK Ch.15 | Typed Memory status/source vocabularies and client/governed-boundary write discipline reused verbatim (ADP-1 option (a)); FITME-sourced records mutable only at the governed boundary; sibling store permitted |
| GCUK Ch.19 / A1 §08 | Single general consent; no per-topic scope; no platform permission |
| GCUK Ch.20 | No causal field; prose never interpreted |
| GCUK Ch.25 | No embeddings, vectors or graph database |
| A1 §04 | Core modules platform-neutral; adapter beneath port |
| A1 §05.6 | `safetyFlag` stored for later catalogue exclusion; no Safety change |
| E.0.2b §27 | Bounded concept-keyed port queries make a future top-K possible; id namespacing deferred to E.0.2g |
| OU-001 §15 rule 4, CCC-001 amendment | No intake path is created; nothing promotes conversation to User Knowledge |
| C4 | Not modified. Server-created FITME-sourced User Knowledge records start `candidate` (C4 §13.4 precedent); source immutable (§13.8 precedent). CD-C4-05 remains unchanged within C4. User Knowledge's own authority contract (INV-UC-S, ADP-5) admits one narrow `SERVER`-created `user_stated` case, only in `correctInferredKnowledge`; nothing generalizes it to C4 |
| PD-1 / UC-2 | User-stated knowledge survives evidence loss with standing exposed; inferred knowledge becomes `UNSUPPORTED`; evidence loss never withdraws or forgets; forget/withdraw are distinct operations |
| ADP-2 | No live adapter; logical stores canonical; Firestore mapping is guidance |
| ADP-4 | `conceptIds` derived, verified, immutable, meaningless (§10.4) |

---

# 36. Status, Closure Criteria, and Definition of Complete

- Status: **IMPLEMENTED — PENDING CLOSURE** — implementation complete and verified; PD-1, ADP-1, ADP-2, ADP-4, ADP-5 resolved; no Product or Architecture decision pending for E.0.2c. ADP-3 is a post-c sequencing item, not a condition of this Work Item. Not CLOSED: closure is pending commit, push and post-push canonical verification.
- Definition of Complete (for CLOSED): AC-0 … AC-62 pass in the full suite; R-1 … R-3 verified; full deterministic regression passing; production call counts and TRR hash unchanged; documentation updates per the Engineering Workflow at closure.

## Closure Record

*(Empty until closure.)*

---

# 37. Document History

- **v1.0** (initial authoring) — Authored against GCUK as amended by A1 at baseline `bad5866`, following the post-E.0.2b Next Work Item investigation and the Product/Architecture E.0.2c authorization.
- **v1.0** (finalization) — Incorporated Product/Architecture rulings: PD-1 approved with UC-2 (loss of evidence ≠ explicit forget/delete); UC-1 user-control invariant; ADP-1 option (a) server-routed (governed authority boundary, vendor-neutral), with §15.4 governed correction of inferred knowledge and authority-homogeneous supersession; ADP-2 (logical sibling stores canonical, no live adapter, Firestore mapping as guidance); ADP-4 with the `conceptIds` derived-index invariant (§10.4). Added withdraw/forget/erase operations (§15.5), port delete/query operations, AC-38/39, AC-46–49, AC-57/58, and ADP-5.
- **v1.0** (ADP-5 and READY) — ADP-5 approved: a dedicated `correctInferredKnowledge` operation (`SERVER` only) atomically creates the `user_stated` successor and supersedes the targeted FITME-inferred records, under the narrow exception INV-UC-S (existing inferred targets; valid `userOriginTurnId`; successor anchored exclusively to the user's turn; user origin on every history entry; no relabeling; one atomic change set). No pending-supersession state. C4 explicitly unmodified. Generic `supersede` under `SERVER` can no longer produce `user_stated`. AC-57 rewritten; AC-59–61 added. Status set to READY FOR IMPLEMENTATION by Product/Architecture direction.
- **v1.0** (implementation-review correction) — Architecture ruling on an internally impossible requirement found during implementation: "fails with `AUTHORITY` without calling the port" cannot hold when authority depends on a persisted target's `source`. §16.2 sentence, AC-26, the §34 authority row and the §20.2 pipeline order aligned with the new §16.4 (authority resolution may read; authority failure may not mutate; zero port calls where decidable without persisted state). §16.1 adds `userId` to `configure()` as an opaque identity binding that grants no authority; AC-62 added. No change to product behavior, storage architecture, source ownership, Concept Identity, correction architecture, ADP-5, C4 or d/e/f/g boundaries.
- **v1.0** (implementation complete) — Status metadata only: READY FOR IMPLEMENTATION → IMPLEMENTED — PENDING CLOSURE after Product/Architecture implementation review PASS and pre-commit verification. Not CLOSED; the Closure Record is completed at closure. No normative change.
