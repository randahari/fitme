# FITME — GENERAL CONTEXT AND USER KNOWLEDGE FOUNDATION — AMENDMENT A2
## v1.0 — DRAFT — submitted for Product / Architecture canonical review (User-Stated Intake; Epistemic Boundary; One Canonical User Memory Model; Intake Precedence; Sequence)

**Repository path:** `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A2_v1.0.md`

**Document role:** Canonical amendment to `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` (CANONICAL / CLOSED; hereafter **GCUK**), read together with `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A1_v1.0.md` (CANONICAL / CLOSED; hereafter **A1**). GCUK's and A1's own files are not edited. From this amendment's approval onward, the GCUK chapters listed in §03 are read together with, and where stated replaced by, the text below. Authored together with `docs/specs/DUC_001_AMENDMENT_USI_001_v1.0.md` (hereafter the **DUC detector amendment**) and `docs/specs/CPI_001_AMENDMENT_USI_001_v1.0.md` (hereafter the **CPI anchor amendment**); the three are reviewed as one unit.

**Evidence labels (per `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md`):** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** wording proposed for canonical approval; **[INFERENCE]** engineering inference; **[GAP]** missing repository evidence.

**Repository baseline:** `main` @ `f1d4f53874983ef26fe88ac04303dbe3ac3d549d` (== `origin/main`) **[VERIFIED]**.

---

# 01. Identity, Status, and Authority

- Deliverable: **GCUK Amendment A2.**
- Status: **DRAFT** — submitted for Product/Architecture canonical review together with the DUC detector amendment and the CPI anchor amendment. Authoring it modified no file under `js/**`, `tests/**`, `functions/**`, `index.html`, `sw.js` or `firestore.rules`, and no closed canonical document.
- Authority: every **[CANON]** statement below records the binding Product/Architecture ADP-3 ruling taken after the WP0 Phase E.0.2c closure (hereafter **AR-1 … AR-7**: 1 epistemic boundary; 2 sequencing; 3 model-call / Turn Understanding policy; 4 statement authority / literal policy; 5 one canonical memory model; 6 CPI / User Knowledge overlap; 7 live persistence), together with the follow-up decisions of the canonical review: the Dimension-6-local failure rule (approved), and **AR-6a** — rejecting whole-turn CPI ownership as the normal routing rule and authorizing an additive CPI-001 assertion anchor. The wording is **[DESIGN]** until this amendment is approved; the decisions themselves are not reopened here.
- This amendment introduces no Product or Architecture decision beyond AR-1 … AR-7 and AR-6a.

---

# 02. Purpose, Scope, and Non-Goals

**Purpose.** GCUK froze the User Knowledge Layer and a staged implementation sequence (Ch.23). WP0 Phase E.0.2c (CLOSED, commits `c0e2260`, `f1d4f53`) implemented its deterministic record and Concept Identity foundation and recorded one open question, ADP-3: GCUK assigns governed intake of ordinary explicit user statements to no Work Item. The ADP-3 investigations found that the only canonical path creating `user_stated` User Knowledge is correction (Ch.13, planned as E.0.2f), that consolidation (Ch.14, E.0.2d/e) is off-turn and FITME-inferred, and that GCUK never addressed B1's single-canonical-memory decision. This amendment encodes the resulting ruling.

**Scope.**
1. The epistemic boundary between user-stated and FITME-inferred knowledge (§04).
2. Statement Authority ≠ Interpretation Authority for user-stated User Knowledge, with the conservative literal-text policy (§05).
3. USI-001 — the unified User-Stated Intake and Correction responsibility (§06).
4. The consolidation boundary (§07).
5. Intake precedence and routing between Safety intakes, CPI-001 and USI-001 (§08).
6. One Canonical User Memory Model, reconciling B1 (§09).
7. The amended sequence (§10) and the live-persistence gate (§11).

**Non-goals (binding).** This amendment does not author the USI-001 SPEC or the E.0.2d SPEC; does not implement anything; does not change Turn Understanding (that is the DUC detector amendment's scope); does not change CPI-001's classes, capture semantics or persisted payload (its additive routing-only assertion anchor is the CPI anchor amendment's scope); does not change OU-001, CCC-001, B1, A1, the E.0.2a/b/c SPECs, MRE-001 or any Safety canon; does not authorize live User Knowledge persistence; does not resolve the E.0.2c §15.5 concept-erase issue; does not migrate, mirror or redesign Typed Memory; introduces no taxonomy of personal knowledge.

---

# 03. Chapters Affected

| GCUK chapter | Action |
|---|---|
| Ch.04 Product Intent and Binding Invariants | Invariants 22–25 added (§04, §05, §09). Invariants 1–21 unchanged. |
| Ch.09 Final User Knowledge Record Contract | Clarification for `source: 'user_stated'` (§05). Record shape unchanged. |
| Ch.13 Correction, Supersession, Explicit-Correction Priority | Owner and scope widened to USI-001 (§06). Governed replacement discipline unchanged. |
| Ch.14 Consolidation and Bounded Retrieval | Consolidation boundary paragraph added (§07). |
| Ch.15 Relationship to Existing Components | Rows for Typed Memory and CPI-001 amended; Turn Understanding row added (§08, §09). Other rows unchanged. |
| Ch.21 Superseded Designs | Item 8 added (§10.2). |
| Ch.23 Implementation Sequence | Replaced (§10.1). |
| Everything else, including A1 | Unchanged. |

---

# 04. Epistemic Boundary — [CANON AR-1; DESIGN wording]

Appended to GCUK Ch.04 as **invariant 22**:

> **22. User-stated knowledge ≠ FITME-inferred knowledge.** What the user explicitly stated and what FITME inferred are durably distinct. A user's explicit statement is captured, if at all, only as user-stated knowledge through governed user-stated intake (USI-001). No mechanism converts an explicit user statement into FITME-inferred knowledge, and no mechanism relabels FITME-inferred knowledge as user-stated except the governed correction path already frozen in the E.0.2c SPEC §15.4 (INV-UC-S).

---

# 05. Statement Authority ≠ Interpretation Authority — [CANON AR-4; DESIGN wording]

## 05.1 Ch.04 — invariant 23

> **23. Statement Authority ≠ Interpretation Authority for user-stated User Knowledge.** For a User Knowledge record with `source: 'user_stated'`:
> 1. User origin is mechanically anchored to the **current** turn: the record's `provenance.originTurnId` names that turn and its supporting evidence references it, and every user-attributed span is verified as a literal substring of the current turn's text as supplied to interpretation. Recent-conversation content is never a source of user-attributed text.
> 2. **All user-attributed free text is literal current-turn text:** `relationDescription`; the label of every concept newly created from the statement; and every `valueDescription` attributed to the user.
> 3. AI interpretation may contribute **structure only**: which concepts are involved, selection of existing concepts from a presented list, factor roles, temporality, closed decisions, and target record ids chosen from presented lists.
> 4. AI-composed open prose is never persisted as though the user stated it.
> 5. Persisting any AI-composed semantic summary requires a separate canonical approval and must carry explicit interpretation provenance, never `user_stated` authority.

This is the existing discipline of CPI-001 Product Decision 10 and SFCD Ch.05 ("Statement authority ≠ Interpretation authority"), extended to User Knowledge: free text is literal; interpretation is structural.

## 05.2 Ch.09 — clarification

Appended to GCUK Ch.09 Frozen Content:

> For `source: 'user_stated'`, the open field `relationDescription` and every user-attributed `valueDescription` and new-concept label hold literal current-turn text (invariant 23). The record shape is unchanged; this constrains only what a governed intake may place in those fields. FITME-inferred records are unaffected.

---

# 06. USI-001 — Unified User-Stated Intake and Correction — [CANON AR-2, AR-3; DESIGN wording]

## 06.1 Responsibility

**USI-001 — User-Stated Intake and Correction** owns governed intake, from the current conversational turn, of:
- **A.** new explicit durable User Knowledge; and
- **B.** explicit correction, replacement, withdrawal or forget intent concerning existing User Knowledge.

It absorbs the previously planned standalone correction pathway (GCUK Ch.13, formerly E.0.2f).

## 06.2 Governance shape (binding)

1. **Trigger.** A narrow additive Turn Understanding detector (DUC detector amendment) may flag that the current turn may contain new durable user-stated knowledge or correction/withdraw/forget intent, with a literal current-turn anchor span. The detector has no authority of any kind.
2. **Interpretation.** Only when the detector is positive may one bounded USI interpreter run for that turn. It proposes structure only (§05) and target ids only from lists it was presented. It never writes.
3. **Deterministic gate.** Every proposal passes a deterministic gate before any mutation: consent (the existing general learned-memory consent, GCUK Ch.19 and A1 §08); structural validation against the E.0.2c contract; literal current-turn verification (§05); presented-list membership for every concept and target id; intake precedence (§08); and the E.0.2c authority matrix.
4. **Mutation.** Durable change happens only through the E.0.2c store operations (create, supersede, withdraw, forget), under their existing authority rules. Correction of FITME-inferred knowledge remains server-routed under E.0.2c §15.4 (INV-UC-S).
5. **Cost.** Ordinary turns add no User Knowledge model call. A positive detector turn adds at most one bounded USI call, excluding independently required Safety processing. There is no unconditional per-turn User Knowledge call.
6. **OpenUnderstanding.** Remains prohibited as a durable-intake input or authority (OU-001 §15 rule 3, §16.5), unchanged.

## 06.3 Ch.13 — amended paragraph

GCUK Ch.13's Frozen Content is read with the following replacement of its first sentence's owner and scope:

> The correction pathway is part of USI-001. A current-turn user statement is interpreted by USI-001's bounded interpreter as either new explicit knowledge or an explicit correction, replacement, withdrawal or forget request targeting specific existing records; every resulting mutation follows the governed replacement discipline below.

The rest of Ch.13 (supersede, never delete, for correction; `source: 'user_stated'` outranks inference; the user's own explanation carried as a confound) is unchanged. Withdrawal and forgetting follow the E.0.2c SPEC §15.5 operations.

---

# 07. Consolidation Boundary — [CANON AR-1; DESIGN wording]

Appended to GCUK Ch.14 Frozen Content:

> **Consolidation boundary.** Consolidation (E.0.2d, E.0.2e) produces only FITME-inferred User Knowledge. It may consume conversation turns as observations, but it never creates, promotes or updates an inferred record that represents knowledge the user explicitly stated; such knowledge belongs to USI-001 alone (invariant 22). The E.0.2d SPEC must define the deterministic mechanism by which this is enforced.

---

# 08. Intake Precedence and Routing — [CANON AR-5, AR-6; DESIGN wording]

## 08.1 Precedence

Conversational durable intake on a turn is evaluated in fixed precedence:

1. **Safety governed intakes** — the Item 6 safety-disclosure intake (`safety_disclosure`) and the WP0-D durable risk-characteristic intake (`risk_characteristic_fact`);
2. **CPI-001** — conversational preference intake into Typed Memory;
3. **USI-001** — User Knowledge.

Manual entries made in the D6 memory screen remain Typed Memory `fact` records and are outside conversational intake.

## 08.2 Routing rule (binding)

**Owned spans.** Each higher-precedence recognition on the turn owns a literal current-turn span:
- a **Safety** intake owns the literal text its interpreter recognized (`restrictedActivityText` for the Item 6 safety-disclosure intake; `literalStatementText` for the WP0-D durable risk-characteristic intake);
- **CPI-001** owns the preference assertion represented by its valid `assertionAnchorText` (CPI anchor amendment §04–§05).

Recognition alone establishes ownership, **whether or not the higher-precedence intake persisted anything**.

> **Routing and ownership.** A USI-001 proposal is admissible only if all of the following hold:
> 1. **No Safety content.** No factor, and no user-attributed text, overlaps a Safety-owned span.
> 2. **No restatement of the CPI-001 assertion.** USI-001 never persists the CPI-001-owned assertion as User Knowledge in its own right. All user-attributed text in the proposal — `relationDescription`, every `valueDescription`, every new-concept label and every factor anchor — is disjoint from the CPI-001-owned span, except that a richer relationship may use the CPI-001 assertion as **one factor** only when:
>    (a) that factor represents the assertion solely by reference: its concept is either an existing concept selected from the presented list or a new concept whose label is literal text lying within the CPI-001-owned span; it carries no `valueDescription`; and the proposal cites the existing CPI-001 Typed Memory record as `TYPED_MEMORY_RECORD` evidence; and
>    (b) the proposal has at least one other factor anchored to current-turn literal text disjoint from the CPI-001-owned span.
>    If the CPI-001 record does not exist (for example because CPI-001's consent check or Safety veto blocked it), the exception is unavailable.
> 3. **CPI-001 Safety outcome.** If CPI-001's gate reported a Safety veto, or the veto was unavailable, on the turn, USI-001 persists nothing from that turn.
> 4. **Recognition unavailable.** If a higher-precedence intake's recognition failed or was unavailable on the turn, USI-001 persists nothing from that turn.
> 5. **No duplicate authority.** No assertion is written to both Typed Memory and User Knowledge. Nothing is mirrored between them.

The rule compares literal spans and record existence only. It needs no classification of what a statement is about and introduces no taxonomy of personal knowledge. Whole-turn ownership is **not** the routing rule.

## 08.3 Missing or invalid CPI-001 anchor — fail closed for USI-001 only — [CANON AR-6a]

> If CPI-001 recognized a preference assertion on the turn but no valid `assertionAnchorText` exists (absent, malformed, over its bound, not a literal current-turn substring, or — for `ACTIVITY_SENTIMENT` — not containing the literal target), USI-001 must not perform any decomposition that depends on distinguishing the CPI-001-owned assertion from other same-turn content. CPI-001's own capture is unaffected (CPI anchor amendment §05, §07).

Where no CPI-001 recognition exists on the turn, this section does not apply.

**Proof boundary (binding).** The anchor's literal-substring validation proves that CPI-001's owned span came from the user's current turn, and for `ACTIVITY_SENTIMENT` that it contains the recognized activity text. It does **not** prove that the model chose the complete extent of the assertion. Anchor extent is established by real-model calibration in the USI-001 Work Item (CPI anchor amendment §08) and is never claimed as a deterministic guarantee.

## 08.4 Ch.15 — amended CPI-001 row

| Component | Relationship (amended) |
|---|---|
| CPI-001 (`preferenceIntakeGate.js`) | Unchanged in classes, capture semantics and persisted payload. Extended only by the CPI anchor amendment's additive, routing-only `assertionAnchorText`. Takes precedence over USI-001 under §08. Its authorization-gate pattern (validate → business rule → mandatory Safety veto) is reused structurally by USI-001's deterministic gate. Its closed `PREFERENCE_CLASSES` vocabulary is not a template for User Knowledge content (Ch.21 item 5, unchanged). |

## 08.5 Ch.15 — added Turn Understanding row

| Component | Relationship |
|---|---|
| Turn Understanding (`turnUnderstandingInterpreter.js`; DUC-001 as amended) | Extended additively by the DUC detector amendment with one closed detector dimension whose only consumer is the USI-001 trigger. No authority. Dimensions 1–5, OpenUnderstanding, Need admission and `UserDisclosureRecognizer` unchanged. |

---

# 09. One Canonical User Memory Model — [CANON AR-5; DESIGN wording]

## 09.1 Ch.04 — invariant 24

> **24. One Canonical User Memory Model.** FITME has exactly one Canonical User Memory Model per user (B1 §2). Typed Memory and User Knowledge are governed persistence and representation mechanisms inside that one model, not independent or competing canonical memory systems. User Knowledge is a memory category added by architecture approval under B1 §5 (this amendment records that approval). Typed Memory keeps its existing governed classes, whose semantics and consumers already depend on those contracts — in particular every Safety- and control-sensitive class — unchanged. User Knowledge owns open semantic personal knowledge and relationships. No semantic assertion has two durable authorities (B1 §7); there is no automatic mirroring.

## 09.2 Ch.04 — invariant 25

> **25. Deterministic intake ownership.** Every conversational durable assertion has exactly one owning intake, decided deterministically by the precedence and routing rule (§08). Safety memory and Safety authority remain independent of User Knowledge (GCUK Ch.19; E.0.2c SPEC §24).

## 09.3 B1 §6 semantic conformance

B1 §6 allows physical field names to differ provided its semantic contract is preserved. User Knowledge records satisfy it as follows:

| B1 §6 field | User Knowledge (E.0.2c SPEC §10) |
|---|---|
| `id` | `recordId` |
| `type` | the User Knowledge category itself (this amendment) |
| `value` | `factors`, `conceptIds`, `relationDescription`, `temporality`, `expiresAt` |
| `authority.source` | `source` |
| `authority.tier` | **derived**: `user_stated` + `active` → AUTHORITATIVE; FITME-sourced + `active` → VALIDATED; `candidate` is not yet canonical memory (B1 §6: generative-only content does not become canonical memory merely because it is persisted) |
| `provenance.sourceType` / `sourceRef` / `derivedBy` | `evidence` references and `provenance` (`producer`, `producerVersion`, `originTurnId`) |
| `confidence` | `confidence` |
| `createdAt` / `updatedAt` | `createdAt` / `updatedAt` |
| `lastConfirmedAt` | `null` — no confirmation mechanism exists yet |
| `status` ACTIVE / SUPERSEDED / OBSOLETE | `active` → ACTIVE; `superseded` → SUPERSEDED; `rejected`, `archived` → OBSOLETE |
| `schemaVersion` | `schemaVersion` |

B1 §7 (stable identity; "duplicate competing authority is forbidden") is satisfied by E.0.2c supersession links and by §08.

## 09.4 Ch.15 — amended Typed Memory row

| Component | Relationship (amended) |
|---|---|
| Typed Memory (`memory.js`) | A governed mechanism inside the one Canonical User Memory Model (invariant 24). Keeps its existing types, write paths and consumers unchanged, including `safety_disclosure`, `risk_characteristic_fact`, CPI-001 `preference` and manual D6 `fact`. User Knowledge reuses its `status`/`source` lifecycle and write-authority discipline (unchanged from GCUK Ch.15). No migration, mirroring or redesign. Ownership between the two is decided by §08. |

---

# 10. Sequence — [CANON AR-2; DESIGN wording]

## 10.1 Ch.23 — replacement text

GCUK Ch.23 "Frozen Sequence" (with A1 §09's E.0.2b line) is replaced by:

> - **E.0.2a** — Policy-based provider eligibility. CLOSED.
> - **E.0.2b** — Source-agnostic descriptor, authorized catalogue, Semantic Context Discovery. CLOSED.
> - **E.0.2c** — User Knowledge record and Concept Identity foundation. CLOSED.
> - **USI-001** — User-Stated Intake and Correction (§06): the Turn Understanding detector (DUC detector amendment), the bounded USI interpreter, the deterministic gate and intake precedence (§08). Absorbs the former E.0.2f.
> - **E.0.2d** — Bounded inferred-knowledge consolidation interpreter (Ch.14 as amended by §07): AI-assisted, proposes FITME-inferred candidate records from observations; testable-not-live.
> - **E.0.2e** — Confound-aware evidence/confidence model plus triggered consolidation and promotion (Ch.12).
> - **E.0.2g** — Retrieval integration: User Knowledge records become the second bounded candidate catalogue inside Semantic Context Discovery (Ch.08/14; A1 §05).
> - **Phase E** — Live activation of `GeneralReasoningCapability`, gated on each item above being independently verified, and unchanged in its existing binding preconditions.
>
> Live User Knowledge persistence is gated separately (§11) and is not implied by any item above.

The designations E.0.2d, E.0.2e and E.0.2g are kept so that references in closed canon (GCUK, A1, OU-001 §15, the E.0.2b SPEC §27, the E.0.2c SPEC §31) stay valid. The designation E.0.2f is retired.

## 10.2 Ch.21 — superseded item 8

> 8. **A standalone, later correction-only step (E.0.2f)** — superseded by USI-001 (§06), which owns correction together with new explicit user-stated knowledge. References to "E.0.2f" in the E.0.2c SPEC (§15.4, §15.6, §28, §31) are read as references to USI-001.

---

# 11. Live Persistence Remains Separately Gated — [CANON AR-7; DESIGN wording]

1. USI-001's semantic and intake design does not by itself authorize live User Knowledge persistence.
2. The E.0.2c SPEC §21.4 activation prerequisites remain binding: a platform adapter that passes the User Knowledge port conformance suite; storage and security rules; complete reset/erase semantics; governed `SERVER` authority for every operation that requires it; and a governed correct/withdraw/forget path for FITME-sourced records before any exists.
3. The E.0.2c §15.5 complete-erase / concept-authority issue is resolved by a future live-persistence activation amendment, before activation. It is not resolved here.
4. Application-Ready Architecture (A1 invariant 21) remains binding: none of these prerequisites may be met by a Web/PWA-specific core.

---

# 12. Deferred — Recorded, Not Solved

To the **USI-001 SPEC**:
1. The USI interpreter contract, its prompt, and its closed decision vocabulary (process-level only).
2. The bound on concepts and candidate records presented for concept selection and correction targeting.
3. The Safety-veto design for USI-001's gate (a CPI-style conditional veto call, or precedence-only).
4. The exact overlap computation and the normalization used for literal verification.
5. The CPI-001 `assertionAnchorText` length bound, prompt wording and anchor-extent calibration thresholds (CPI anchor amendment §08, §11).
6. Rollout of the Turn Understanding detector and its real-model calibration gate (DUC detector amendment §07).
7. Correction of a CPI-001 Typed Memory preference remains CPI-001's own restatement behavior; USI-001 corrects User Knowledge only.

To the **E.0.2d SPEC**: the deterministic mechanism enforcing §07.

To the **live-persistence activation amendment and Work Item**: §11 items 2–3.

Elsewhere: persisted AI semantic summaries with interpretation provenance (§05 item 5), which need separate canonical approval; and the stale Roadmap/Changelog, which are unaffected.

---

# 13. Consistency Self-Review

| Document | Check | Result |
|---|---|---|
| GCUK Ch.04 invariants 1–20, A1 invariant 21 | Invariants 22–25 add; none narrows an existing invariant. Invariant 3 ("semantic relevance never grants authorization") and invariant 15 ("explicit user correction outranks inferred knowledge") are reinforced. | No conflict. |
| GCUK Ch.09 | `relationDescription` stays "open, bounded prose"; literal text is prose. The constraint applies only to `user_stated`. | No conflict. |
| GCUK Ch.13 | Governed replacement discipline preserved; the owner is renamed and the scope widened by amendment. | No conflict. |
| GCUK Ch.14 / A1 §06 | Consolidation stays off-turn and FITME-inferred; Selection Precedes Invocation untouched. | No conflict. |
| GCUK Ch.23 | Replaced by amendment (§10). | Amended, not contradicted. |
| A1 | Discovery, informationNeeds, Invariant 21 and §10 items unchanged. | No change. |
| B1 §2, §5, §6, §7 | One model (§2); category added by architecture approval (§5); semantic contract mapped (§09.3); no duplicate authority (§7). | Conformant; B1 unchanged. |
| OU-001 §15 rules 3–4, §16.5 | OpenUnderstanding stays prohibited as intake input; USI-001 is the "separately governed mechanism" rule 4 anticipates. | No change. |
| CCC-001 amendment §05 | Literal current-turn anchoring; recent conversation never persisted; OpenUnderstanding never a gate input. All kept (§05, §06). | No change. |
| CPI-001 (Product Decision 10) | Literal anchoring reinforced; classes, capture semantics and persisted payload unchanged; precedence over USI-001 (§08). Extended only by the additive, routing-only `assertionAnchorText` (CPI anchor amendment), produced by its existing call. | Companion amendment; CPI-001 base unchanged. |
| DUC-001 | Extended only by the DUC detector amendment. | Companion amendment. |
| E.0.2c SPEC | Store, authority matrix, INV-UC-S, §21.4 unchanged; "E.0.2f" references mapped (§10.2). | E.0.2c remains CLOSED and unedited. |
| Safety canon (SFCD, SLDP, WP0-D) | Safety intakes take precedence; Safety memory stays in Typed Memory; User Knowledge is never a Safety input. | No change. |

---

# 14. Repository Gaps and Canonical Conflicts

- **[GAP — resolved by AR-6a]** CPI-001 exposed no literal span for its closed-token classes, and only the activity name for `ACTIVITY_SENTIMENT`. Resolved by the CPI anchor amendment; §08.3 fails closed for USI-001 only when the anchor is unavailable.
- **Known limitation (disclosed, not a gap in authority):** anchor extent is model-chosen and verified only by calibration (§08.3 proof boundary).
- **[GAP]** Item 6 (`safety_disclosure` intake) has no SPEC (OU-001 GAP-5); §08 relies on its implemented behavior (`safetyDisclosureIntakeGate.js`).
- **[GAP]** B1 was not cited by GCUK, A1 or the E.0.2c SPEC; §09 closes that gap.
- **Canonical conflicts:** none.

---

# 15. Status and Closure

**DRAFT.** Takes effect together with the DUC detector amendment and the CPI anchor amendment upon Product/Architecture approval. Authorizes no implementation, no SPEC and no live persistence.

# 16. Document History

- **v1.0** (initial authoring) — Records the ADP-3 Product/Architecture ruling (AR-1 … AR-7) after the WP0 Phase E.0.2c closure, at baseline `f1d4f53`.
- **v1.0** (canonical review revision) — Whole-turn CPI ownership removed (AR-6a). §08.2 now uses owned literal spans, with CPI-001 owning the span of its `assertionAnchorText` (new companion CPI anchor amendment); all user-attributed text must be disjoint from owned spans except one CPI-citing reference factor; CPI Safety-veto turns persist nothing. §08.3 fails closed for USI-001 only when the anchor is unavailable, and states the proof boundary. Dimension-6-local failure rule unchanged.
