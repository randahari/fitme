# WP0 PHASE E.0.2c AMENDMENT — Supporting-Evidence Index and Evidence-Keyed Record Query (E.0.2d)
## v1.0 — CANONICAL / CLOSED — approved by Product/Architecture; implementation by the E.0.2d Work Item

**Repository path:** `docs/specs/WP0_PHASE_E_0_2C_AMENDMENT_E_0_2D_v1.0.md`

**Document role:** SPEC amendment to `docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md` (CLOSED; hereafter **E.0.2c**). E.0.2c's own file is not edited; where this amendment extends an E.0.2c section, it governs from its approval onward. Read together with GCUK and Amendments A1–A3 (unchanged) and the E.0.2d SPEC draft `docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md` (hereafter **E.0.2d**), whose GAP-D5 this amendment resolves.

**Evidence labels:** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** wording proposed for canonical approval; **[INFERENCE]**; **[GAP]**.

---

# 01. Identity, Status, and Authority

- Deliverable: **E.0.2c Amendment for E.0.2d — supporting-evidence index (`supportingRefIds`) and evidence-keyed record query (`queryRecordsBySupportingRefs`).**
- Status: **CANONICAL / CLOSED** — approved by Product/Architecture after canonical review at baseline `df3000c`, together with rulings **D5-1** (`SCHEMA_VERSION` stays `1`, §14) and **D5-2** (implemented by the E.0.2d Work Item, §15); canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`. Implemented by the E.0.2d Work Item, not by this amendment. Authoring modified no file under `js/**`, `tests/**`, `functions/**`, `index.html`, `sw.js` or `firestore.rules`, and no closed canonical document.
- Repository baseline: `main` @ `df3000c59e61de4549139ec8448596683ed06aa3` (== `origin/main`) **[VERIFIED]**.
- Authority: the Product/Architecture decision approving **GAP-D5 Option A** after the E.0.2d GAP-D5 read-only investigation (hereafter **D5-A**): a derived `supportingRefIds` field following the `conceptIds` precedent (E.0.2c §10.4, ADP-4), and a bounded `queryRecordsBySupportingRefs` port/store read; no reverse-index store, no E.0.2d-local cache, no list-all, no duplicate observation store, no model involvement, no tombstones, no GCUK amendment. The canonical review then ruled **D5-1** — keep `SCHEMA_VERSION = 1`, no migration machinery — and **D5-2** — implementation within the E.0.2d Work Item, after this amendment is closed, the E.0.2d SPEC is updated to consume it, and the E.0.2d SPEC passes final review. The wording below is approved; the decisions are not reopened here.

---

# 02. Purpose

E.0.2d (U-2, rule U4) must know whether an observation is already relied on by user-stated knowledge, so that FITME-inferred knowledge never rests only on what the user already told FITME (A2 §07, invariant 22). **[VERIFIED]** E.0.2c offers no way to find records by the evidence they cite: the port queries only by concept (`queryRecordsByConcepts`) and by recency (E.0.2c §20.1); evidence lives in `evidence.supporting`, an array of objects that no platform-neutral bounded query can address; and there is no list-all operation by design (§20.1 requirement 2). E.0.2d could therefore check ownership only for the records it happened to present.

This amendment adds exactly what is needed to answer "which stored records cite these observations as supporting evidence" in bounded, indexed reads, and nothing else. It is a deterministic query/index capability only: it grants no authority, performs no inference, changes no source authorization, and changes no existing operation's behaviour.

---

# 03. Scope

| E.0.2c section | Action |
|---|---|
| §09.2 Constants | One constant added (§04). |
| §10.1 Stored shape | One derived field added (§05). |
| §10.2 Validation rules | Rule 13 added (§05.3). |
| New §10.5 | `supportingRefIds` derived-index invariant, mirroring §10.4 (§05). |
| §14.1–§14.3, §15 Planners | Recompute the index wherever supporting evidence is written (§06). |
| §20.1 Port contract | One query added (§07). |
| §20.2 Store operations | One consent-gated read added (§08). |
| §20.3 Reference port; §30 conformance and acceptance | Extended (§11). |
| §15.5 Forget / erase | Unchanged; consequences stated (§09). |
| §07, §11, §12, §13, §16, §17, §18, §19, §21–§29, §31 | Unchanged (§12). |

---

# 04. §09.2 Extension — Constant — [DESIGN]

| Constant | Value | Rationale |
|---|---|---|
| `MAX_QUERY_REF_IDS` | 10 | Port query filter bound, equal to `MAX_QUERY_CONCEPT_IDS` and for the same reason (bounded `…-any` membership queries; E.0.2c §21.3 **[INFERENCE: Firestore `array-contains-any` supports ≤ 30 values]**). |

All other limits apply unchanged; in particular `MAX_EVIDENCE_REFS_PER_LIST` (64) bounds the new field (§05.2).

---

# 05. §10.1 / §10.2 / new §10.5 — `supportingRefIds` Derived Index — [CANON D5-A; DESIGN mechanics]

## 05.1 Stored shape addition

```
UserKnowledgeRecord {
  …                                   // every existing §10.1 field, unchanged
  supportingRefIds: string[],          // derived index of evidence.supporting (§05.2); never supplied by a caller
  …
}
```

The exact-key rule (§10.2 rule 1) now includes `supportingRefIds`. No other field is added, removed or changed.

## 05.2 The derived-index invariant (new E.0.2c §10.5)

Mirrors §10.4 (`conceptIds`) item for item:

1. **Single canonical rule:** `deriveSupportingRefIds(evidence)` = the set of `evidence.supporting[i].refId` values, de-duplicated by exact string equality, sorted ascending by UTF-16 code-unit order (JavaScript default `Array.prototype.sort()` on strings). Each `refId` is already `kind + ':' + ref` and unique within the record (§11.1; `userKnowledgeContract.js:182`) **[VERIFIED]**, so no case folding or normalization applies. Exported by `UserKnowledgeContract`.
2. **Derived exclusively from `evidence.supporting`.** `evidence.contradicting`, confounds, the confound check, availability fields, `observedAt`, links and history never contribute.
3. **Never supplied:** record drafts accepted by planners and store operations have no `supportingRefIds` field; a draft carrying one is rejected with the existing code `DERIVED_FIELD_SUPPLIED` (the code already used for `conceptIds`, `userKnowledgeContract.js:452`) **[VERIFIED]**. Neither callers nor any model ever supply it.
4. **Always verified:** validator rule 13 (§05.3) rejects any document whose `supportingRefIds` is not exactly `deriveSupportingRefIds(evidence)`, so a document read from any port, a future adapter or a future server path cannot carry a divergent index into a change set or out of a query.
5. **Recomputed whenever supporting evidence changes** (§06). Because supporting references are never removed, replaced or re-pointed (§11.3 rule 1), the index only grows over a record's life, and only through `planAppendEvidence` to `supporting`.
6. **Bounded:** at most `MAX_EVIDENCE_REFS_PER_LIST` (64) entries, because `evidence.supporting` is so bounded.
7. **No semantics:** `supportingRefIds` exists only to make bounded evidence-keyed reads possible (§07). No derived view, planner or consumer may assign meaning, relevance, authority, ownership status, truth or confidence through it; it records only which references a record cites as supporting. Ownership as used by E.0.2d is a rule E.0.2d applies to query results (§10), not a property of the field.
8. **Uniform:** every record carries the index regardless of `source`. Selection by source is a query filter (§07), never a different index.

## 05.3 §10.2 rule 13

> 13. `supportingRefIds` is exactly equal to `deriveSupportingRefIds(evidence)`, element by element (`SUPPORTING_INDEX_MISMATCH`, path `record.supportingRefIds`). Evaluated after rule 12 (evidence validity), so every element is a validated `refId`.

---

# 06. §14 / §15 Extension — Planner Obligations — [DESIGN]

Every planner computes `supportingRefIds` from the resulting document's `evidence.supporting` with `deriveSupportingRefIds`; none copies it from input.

| Planner / path | Effect on `supportingRefIds` |
|---|---|
| `planCreateRecord` (via `buildRecord`) | Derived from the new record's `supporting` (may be `[]`). |
| `planAppendEvidence`, `list: 'supporting'` | Recomputed from the extended `supporting`. |
| `planAppendEvidence`, `list: 'contradicting'` | Unchanged. |
| `planSupersede` / `planCorrectInferredKnowledge` successor (via `buildRecord`) | Derived from the successor's own `supporting`. |
| Predecessors in a supersession | Unchanged (their evidence is unchanged). |
| `planEvidenceAvailability` | Unchanged (references are not changed, only their availability). |
| `planAddConfound`, `planRecordConfoundCheck`, `planSetConfidence`, `planRaiseSafetyFlag`, `planPromoteRecord`, `planRetractRecord`, `planArchiveRecord` | Unchanged. |

All existing planner rules, codes and orderings are unchanged. Every resulting document is still validated before return (§14.1), now including rule 13.

---

# 07. §20.1 Extension — Port Query — [CANON D5-A; DESIGN contract]

```
UserKnowledgePort.queryRecordsBySupportingRefs(userId, {
  refIdsAny: string[1..MAX_QUERY_REF_IDS],   // refIds of the form kind:ref; distinct
  sources:   SOURCES[1..5],                  // distinct
  statuses:  STATUSES[1..5],                 // distinct
  limit:     1..MAX_QUERY_LIMIT
}) → Promise<UserKnowledgeRecord[]>          // ordered updatedAt desc, recordId asc
```

Returns the user's records whose `supportingRefIds` contains at least one of `refIdsAny`, whose `source` is in `sources` and whose `status` is in `statuses`, at most `limit`, in the same order as `queryRecordsByConcepts`.

Binding requirements (added to the §20.1 list and verified by the conformance suite):
- Bounded: no request outside the stated bounds is served; results never exceed `limit` (requirement 2).
- Per-user isolation (requirement 3); never throws, failures resolve to `FAILED` (requirement 5); documents round-trip unchanged (requirement 4).
- **No scan in production.** A persisting adapter must serve this query from an index over `supportingRefIds`, never by reading the user's whole record store. The in-memory reference port may scan (§20.3).
- Forgotten and erased records are never returned (they no longer exist, §09).
- The port, as before, knows nothing about writer authority (§20.1).

`PORT_FUNCTIONS` (the required port surface, `userKnowledgeStore.js:31`) gains `queryRecordsBySupportingRefs`; there is still no list-all operation.

**Adapter guidance (non-normative; recorded for the first persisting Work Item, E.0.2c §21.2).** A Firestore-style adapter can serve the query with `array-contains-any` on `supportingRefIds` (≤ 10 values) combined with `source`/`status` filtering, splitting by `source` if the platform cannot combine the membership filters, provided bounds and ordering are preserved **[INFERENCE]**. The exact index definition belongs to that Work Item and its conformance run.

---

# 08. §20.2 Extension — Store Read — [CANON D5-A; DESIGN mechanics]

`UserKnowledgeStore.queryRecordsBySupportingRefs({ refIdsAny, sources, statuses, limit }) → {status, records}`

Same shape and discipline as the existing additive reads (`queryRecordsByConcepts`, `userKnowledgeStore.js:384-399`, USI-001 §19) **[VERIFIED]**:
1. `NOT_CONFIGURED` when the store is not configured.
2. **Consent-gated** (E.0.2c §17): returns `{status: 'CONSENT_NOT_GRANTED', records: []}` without a port call unless the consent predicate returns exactly `true`.
3. Request validation: exact key set; `refIdsAny` 1..10 distinct strings, each of the form `kind:ref` with `kind ∈ EVIDENCE_REF_KINDS` and `ref` matching `EVIDENCE_REF_PATTERN`; `sources` 1..5 distinct `SOURCES`; `statuses` 1..5 distinct `STATUSES`; `limit` per `MAX_QUERY_LIMIT` → otherwise `REJECTED` (`INVALID_VALUE`), no port call.
4. Port failure, a thrown error, a non-array result or more than `limit` records → `FAILED`.
5. **Every returned document is validated** (`validateRecord`, now including rule 13), must belong to the store's user, and must actually match the request (status in `statuses`, source in `sources`, and at least one `refIdsAny` in its `supportingRefIds`); any violation → `REJECTED` (`STORED_DOCUMENT_INVALID`). A port cannot return a record that does not cite a requested reference.
6. Success → `{status: 'OK', records}` (frozen). Never throws.

**Authority.** A read only. It is permitted under both `CLIENT` and `SERVER`, exactly like every existing read (§16.2 governs writes; reads are governed by consent and the store's `userId` binding). It never mutates, mints ids or calls a model, and it confers nothing (§16.4 item 4: "storage never confers permission").

**Fail-closed use.** An empty `records` array means "no matching record" only when `status === 'OK'`. Callers that rely on the answer for a protection (E.0.2d U4) must treat every other status as failure, never as "no match" (§10).

---

# 09. §15.5 — Forget and Erase Consequences (no change to the operations) — [CANON D5-A; E.0.2c §15.5]

- `forgetRecord`, `eraseAllForUser` and the underlying `deleteRecord`, `deleteRecordsBySources` and `deleteAll` are unchanged. A deleted record and its index cease to exist together, so it is never returned by `queryRecordsBySupportingRefs` afterwards.
- **No tombstone, shadow copy or retained index entry is introduced** (§15.5 guarantee 3 stands). Nothing in this amendment preserves any trace of a forgotten record's evidence.
- Withdrawn (`rejected`), `superseded` and `archived` records still exist and are returned when their status is requested.
- Whether information whose record was forgotten may later be independently re-inferred from its source observations is outside this amendment; it belongs to the deferred retention/privacy policy (§11.5).

---

# 10. Use by E.0.2d (informative; normative text belongs to the E.0.2d SPEC)

For GAP-D5, E.0.2d defines an observation with evidence reference `R` as **owned by user-stated knowledge** at pass time when a currently stored record with `source: 'user_stated'`, in any status, has `refId(R)` in its `supportingRefIds`, or when a stored `user_stated` Typed Memory record names it (through the Observation Port). Contradicting-only citations, FITME-inferred citations and forgotten or erased records do not count. E.0.2d queries with `sources: ['user_stated']`, all four statuses a `user_stated` record can hold, ≤ 10 refs per call, repeats the query for not-yet-found refs whenever a page is full, and fails its pass on any non-`OK` status. These rules are the E.0.2d SPEC's to state and test; this amendment provides only the field and the query.

---

# 11. §20.3 / §30 Extension — Reference Port, Conformance and Acceptance — [DESIGN]

**Reference port** (`tests/fixtures/userKnowledgeInMemoryPort.js`): implements `queryRecordsBySupportingRefs` with the same bound checks and ordering as `queryRecordsByConcepts` (`:71-85`) **[VERIFIED]**, filtering by `supportingRefIds`, `source` and `status`.

**Conformance suite** (`tests/fixtures/userKnowledgePortConformance.js`): the AC-32 operation-list test now includes the query (it compares against `Store.PORT_FUNCTIONS`, `:43-48`); new conformance cases cover bounds (11 refs, `limit` 51, empty or invalid `sources`/`statuses` fail), source and status filtering, ordering, `limit`, per-user isolation, deletion scope (deleted records never returned) and never-throws.

**Acceptance criteria (added to E.0.2c §30; implemented and verified by the E.0.2d Work Item):**
- AC-SR1: `deriveSupportingRefIds` is distinct, exact-match, code-unit ordered, empty for no supporting evidence, and ignores `contradicting`.
- AC-SR2: `validateRecord` rejects a missing, extra-element, reordered or stale `supportingRefIds` (`SUPPORTING_INDEX_MISMATCH`) and the exact-key rule requires the field; a draft supplying it is rejected `DERIVED_FIELD_SUPPLIED`.
- AC-SR3: planners per §06 — create derives; append to `supporting` recomputes; append to `contradicting`, availability changes and every other in-place mutation leave it unchanged; supersession and governed-correction successors derive their own; predecessors are unchanged.
- AC-SR4: the store read is consent-gated with zero port calls on denial; validates request shape with zero port calls on invalid input; rejects stored documents that fail validation, belong to another user or do not match the request; returns `FAILED` on port failure or over-limit results; never throws; works under `CLIENT` and `SERVER`.
- AC-SR5: the reference port passes the extended conformance suite; production code has no list-all path.
- AC-SR6: forgotten and erased records are never returned; withdrawn, superseded and archived records are returned when requested.
- AC-SR7: no existing E.0.2c operation, transition rule, authority rule, error code or semantic invariant changes; all existing E.0.2c and USI-001 tests pass, modified only as §13 authorizes.
- AC-SR8: no module gains a model call, clock read or randomness; production call counts and pinned request-body hashes are unchanged.

---

# 12. Unchanged

E.0.2c §01–§08, §11 (evidence references, availability, resolver port), §12 (source and provenance), §13 (Concept Identity), §14.2 status transitions and §14.4 confound minimum, §15.1–§15.4 and §15.5 operations, §16 (authority matrix and §16.4), §17 (consent), §18 (derived views), §19 (proposal helper), §21 (storage decision), §22–§29, §31; `SCHEMA_VERSION`; every existing port function and store operation; `conceptIds` and its invariant; GCUK and Amendments A1–A3.

---

# 13. Implementation Scope (for the implementing Work Item) — [DESIGN]

**Modified production modules (E.0.2c):**
- `js/coachDecisionSystem/userKnowledgeContract.js` — `RECORD_KEYS` gains `supportingRefIds`; `LIMITS.MAX_QUERY_REF_IDS = 10`; `deriveSupportingRefIds` exported; validator rule 13; draft rejection of `supportingRefIds`.
- `js/coachDecisionSystem/userKnowledgeTransitions.js` — `buildRecord` derives the field; `planAppendEvidence` recomputes it for `supporting`.
- `js/coachDecisionSystem/userKnowledgeStore.js` — `PORT_FUNCTIONS` gains `queryRecordsBySupportingRefs`; the store read of §08; API export.

**Modified test fixtures:** `tests/fixtures/userKnowledgeInMemoryPort.js` (query; local `L` constant gains `MAX_QUERY_REF_IDS`), `tests/fixtures/userKnowledgePortConformance.js` (new cases).

**New tests:** `tests/e02cSupportingRefIndex.test.js` (AC-SR1 … AC-SR8).

**Authorized modifications to existing tests (only these):**
- `tests/e02cUserKnowledgeStore.test.js:422` — the asserted record key list gains `supportingRefIds`.
- `tests/usi001StoreReads.test.js:107-112` (AC-39) — the asserted store-operation set gains `queryRecordsBySupportingRefs`, and the asserted `PORT_FUNCTIONS` list gains it.

**[VERIFIED] no other change is needed:** every test record is built through the planners (no hand-built stored record exists in `tests/`), USI-001 builds records through the planners (its executor edits only a draft's `supporting` before planning, `userStatedIntakeExecutor.js:51`), and no other test pins the record keys, the store operations or `PORT_FUNCTIONS`.

No `index.html`, `sw.js`, `js/app.js`, `functions/**` or `firestore.rules` change; no version bump.

---

# 14. Migration and Compatibility

- **No data migration.** No User Knowledge record has ever been persisted: there is no live adapter (E.0.2c §21.4) and USI-001 is not live. All existing records are in-memory test documents created through the planners.
- **`SCHEMA_VERSION` stays `1`** **[CANON D5-1]**: the field is added before any version-1 document has been persisted, exactly as `conceptIds` was part of version 1 from the start. No migration machinery is introduced for this amendment. The first persisting Work Item persists only documents that already carry the field.
- **Backward compatibility of callers:** no existing caller supplies `supportingRefIds` (it did not exist), so no caller breaks; every existing operation's inputs, outputs and codes are unchanged apart from the new field on returned documents.
- **USI-001:** unaffected in behaviour; its records gain the derived field automatically through the planners.

---

# 15. Pending Decisions, Repository Gaps, and Canonical Conflicts

- **RESOLVED D5-1:** `SCHEMA_VERSION` stays `1`; no migration machinery (§14).
- **RESOLVED D5-2 — sequencing [CANON]:** this amendment is implemented by the E.0.2d Work Item, not by a separate implementation Work Item (the CPI/DUC amendment precedent, implemented by USI-001). Canonical order: (1) this amendment is finalized and closed; (2) the E.0.2d SPEC is updated to consume it and close GAP-D5; (3) the E.0.2d SPEC passes final Product/Architecture review; (4) only then is implementation authorized. The E.0.2d implementation scope may include exactly the E.0.2c production and test changes of §13.
- **Pending decisions:** none.
- **[GAP, carried, non-blocking]** The Firestore index definition and the exact combination of membership filters are adapter-level and belong to the first persisting Work Item (§07 guidance).
- **Out of scope, recorded:** re-inference of information whose record was forgotten (E.0.2c §11.5 retention/privacy policy).
- **GCUK:** no amendment required. The field is a derived index with no semantic content; the analogous `conceptIds` index was introduced at E.0.2c level (ADP-4) and does not appear in GCUK Ch.09.
- **Canonical conflicts:** none found.

---

# 16. Binding Invariants Preserved — [CANON D5-A, D5-1, D5-2]

1. `supportingRefIds` is a deterministic derived index with **no semantic meaning**, derived **from `evidence.supporting` only**, never caller- or model-supplied, validator-enforced (§05).
2. Evidence-keyed reads are **bounded** (≤ 10 refs, ≤ 50 records) and require **no list-all or store scan** in production (§07).
3. The read is **consent-gated** and follows **existing read authority** (`CLIENT` and `SERVER`); it confers no authority and mutates nothing (§08).
4. **Fail-closed:** invalid requests, port failures, over-limit or non-matching documents never yield a result that could be read as "no match"; only `status: 'OK'` carries an answer (§08).
5. **Per-user isolation** (§07; E.0.2c §20.1 requirement 3).
6. **No AI/model authority or involvement**; no clock or randomness (§02, AC-SR8).
7. **Existing forget/erase semantics**, with **no tombstone, shadow copy or retained index entry** (§09; E.0.2c §15.5 guarantee 3).
8. **No GCUK change**; no change to A1–A3 (§15).
9. **Implemented by the E.0.2d Work Item**, in the canonical order of §15 (D5-2).
10. **No migration requirement; `SCHEMA_VERSION = 1`** (§14, D5-1).

---

# 17. Status and Closure

- Status: **CANONICAL / CLOSED** — approved by Product/Architecture after canonical review at baseline `df3000c`, with D5-1 and D5-2 resolved (§15); canonization commit `416c00229ea8cbb4b07288eed0947c061734e841`.
- It authorizes no implementation by itself. Implementation, verification and closure evidence belong to the E.0.2d Work Item, which may begin only after the E.0.2d SPEC has been updated to consume this amendment and has passed final Product/Architecture review (§15).

# 18. Document History

- **v1.0** (initial authoring) — Adds the `supportingRefIds` derived index and the `queryRecordsBySupportingRefs` port/store read per D5-A (GAP-D5 Option A), at baseline `df3000c`.
- **v1.0** (canonical finalization) — Status CANONICAL / CLOSED after Product/Architecture canonical review. D5-1: `SCHEMA_VERSION` stays `1`, no migration machinery (§14). D5-2: implementation by the E.0.2d Work Item in the canonical order of §15. §16 binding-invariant summary added. No change to the contract of §04–§13.
- **v1.0** (canonical closure) — Canonization commit recorded: `416c00229ea8cbb4b07288eed0947c061734e841`. Status metadata only; no content change.
