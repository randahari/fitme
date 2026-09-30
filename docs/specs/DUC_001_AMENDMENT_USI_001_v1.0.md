# DUC-001 AMENDMENT — User-Stated Intake Detector (USI-001)
## v1.0 — CANONICAL / CLOSED — approved together with GCUK Amendment A2 and the CPI-001 USI-001 amendment; implementation by USI-001

**Repository path:** `docs/specs/DUC_001_AMENDMENT_USI_001_v1.0.md`

**Document role:** SPEC amendment to `docs/specs/DUC_001_SPEC_v1.0.md` (IMPLEMENTED / VERIFIED / CLOSED; hereafter **DUC-001**) as already amended by `docs/specs/DUC_001_AMENDMENT_OU_001_v1.0.md` (CLOSED / APPLIED; hereafter the **OU amendment**). Authored together with `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A2_v1.0.md` (hereafter **A2**) and `docs/specs/CPI_001_AMENDMENT_USI_001_v1.0.md`; the three are reviewed and approved as one unit. DUC-001's and the OU amendment's own files are not edited; where this amendment extends a DUC-001 section, it governs from its approval onward.

**Evidence labels:** as in OU-001 (**[VERIFIED]**, **[CANON]**, **[DESIGN]**, **[INFERENCE]**, **[GAP]**).

---

# 01. Identity, Status, and Authority

- Deliverable: **DUC-001 Amendment for USI-001 — the User-Stated Intake Detector.**
- Status: **CANONICAL / CLOSED** — approved by Product/Architecture as one canonical unit with A2 and the CPI-001 USI-001 amendment (commit `04265683c089e972d90bdd8675610ab37aee8574`); implemented by the USI-001 Work Item, not by this amendment.
- Repository baseline: `main` @ `f1d4f53874983ef26fe88ac04303dbe3ac3d549d` **[VERIFIED]**.
- Authority: the ADP-3 Product/Architecture ruling, item 3 (model-call / Turn Understanding policy), recorded in A2 as AR-3 **[CANON]**. The wording below is **[DESIGN]** until approved.

---

# 02. Scope

| DUC-001 section | Action |
|---|---|
| §04 Bounded Turn Understanding | Closed output extended by one additive dimension, Dimension 6 (§03–§06). Dimensions 1–5 and the open block unchanged. |
| §17 Failure Semantics | Rows added (§06). |
| §19 Test Contract | Extended by the USI-001 SPEC (§08). |
| All other sections, including §06 Need admission and `UserDisclosureRecognizer` | Unchanged (§09). |

---

# 03. Dimension 6 — Closed Output — [DESIGN]

The closed Turn Understanding output recorded in the OU amendment §03 gains one key:

```
userStatedKnowledge: {                                   // Dimension 6 — USI-001 trigger
  present:    boolean,
  intent:     'NEW_USER_KNOWLEDGE' | 'CORRECTION_WITHDRAW_FORGET' | null,
  anchorText: string | null                              // verbatim current-turn substring
}
```

`intent` is a closed **process** vocabulary (whether the turn may add knowledge or may act on existing knowledge). It never describes what the knowledge is about. There is no category, domain or topic field.

---

# 04. Dimension 6 — Semantics — [DESIGN]

`present: true` only when the **current** turn itself either:
- **`NEW_USER_KNOWLEDGE`** — states something about the user's own life or circumstances that may be worth remembering durably; or
- **`CORRECTION_WITHDRAW_FORGET`** — expresses intent to correct, replace, withdraw or forget something the user told FITME or FITME understood about them.

Otherwise `present: false`. The detector is a permissive trigger: whether anything becomes knowledge is decided later by the USI-001 interpreter and its deterministic gate (A2 §06). The detector's instruction text must be open-world and must contain no example domain, activity, food, place, relationship or life-event words, following OU-001 §07's no-example discipline. Its exact wording belongs to the USI-001 SPEC.

Dimension 6 is independent of Dimension 5 (`personalDisclosure`): each is judged on its own, neither gates the other, and neither's consumer reads the other.

---

# 05. Dimension 6 — Validation and Anchoring — [DESIGN]

1. **Shape.** When `present === true`: `intent` is one of the two tokens, and `anchorText` is a non-empty string within the bound set by the USI-001 SPEC. When `present === false`: `intent` and `anchorText` are `null`.
2. **Current-turn literal substring (deterministic, never trusted from the model).** `anchorText` must be a literal substring of the current turn's text exactly as supplied to the model (the same bounded `statementText` Turn Understanding already receives, `partitionIntoBatches()`, `turnUnderstandingInterpreter.js:120-122` at baseline `f1d4f53`). The normalization used for this comparison is fixed by the USI-001 SPEC and must be deterministic.
3. **No recent-conversation anchoring.** A span found only in `recentConversationContext`, or anywhere other than the current turn's supplied text, never satisfies rule 2. Recent conversation may help the model understand the current turn (CCC-001 amendment §05) but never supplies the anchor.
4. **Dimension-local failure.** A Dimension 6 value that fails rules 1–3 resolves Dimension 6 to `{present: false, intent: null, anchorText: null}` and **affects nothing else**: `interpretationStatus`, Dimensions 1–5 and the open block are exactly what they would have been without Dimension 6. This intentionally differs from the entry-level fail-closed-by-omission rule that governs Dimensions 1–5 (OU amendment §03, §05), so that adding the detector cannot change any existing Need, disclosure or routing outcome.
5. **Failure shape.** When `interpretationStatus` is `FAILED`, Dimension 6 is `{present: false, intent: null, anchorText: null}`.

---

# 06. §17 — Failure Semantics Additions — [DESIGN]

| Case | Behavior | Signal |
|---|---|---|
| **U1 — Dimension 6 malformed** (bad shape, unknown intent, empty or over-length anchor) | Dimension 6 absent; everything else unchanged | `userStatedKnowledge.present: false` |
| **U2 — Anchor not in the current turn** (including text found only in recent conversation) | Dimension 6 absent; everything else unchanged | `userStatedKnowledge.present: false` |
| **U3 — Turn Understanding `FAILED`** (any existing Case C cause) | Dimension 6 absent | `interpretationStatus: 'FAILED'` |

DUC-001 §17 Cases A–E and the OU amendment's added cases are unchanged.

---

# 07. Non-Authority, Cost, and Calibration — [CANON AR-3; DESIGN wording]

**Non-authority (binding).** Dimension 6:
- does not create User Knowledge, Typed Memory or any durable record;
- does not decide durable truth;
- grants no persistence authority and no consent;
- grants no Safety authority and is never a Safety input;
- does not select a mutation (create, supersede, withdraw or forget);
- is not an input to CPI-001, the Item 6 safety-disclosure intake or the WP0-D risk-characteristic intake;
- does not make OpenUnderstanding a durable-intake input (OU-001 §15 rule 3, §16.5 unchanged);
- cannot turn recent-conversation content into a current-turn statement (§05 rule 3).

Its only consumer is the USI-001 trigger. A positive Dimension 6 permits the USI-001 interpreter to run for that turn; it authorizes nothing else.

**Cost (binding).** Dimension 6 is produced by the existing single Turn Understanding call (OU amendment §04 item 2). There is no separate detector call. Ordinary turns therefore add zero model calls; only a positive Dimension 6 may allow the one later bounded USI-001 call (A2 §06.2 item 5).

**Production contract and calibration (binding).** Adding Dimension 6 changes the production Turn Understanding prompt and closed output for every turn, even while User Knowledge persistence is not live. The USI-001 implementation therefore requires a real-model calibration gate before acceptance, following the OU-001 §20/§24 and E.0.2b §29 precedent, covering at minimum:
- the closed-output validation rate;
- latency within the existing 8,000 ms timeout;
- output-token budget within the existing `max_tokens`;
- no regression in Dimensions 1–5 outcomes on a fixed corpus;
- human review of detector precision and recall.

---

# 08. §19 — Test Contract — [DESIGN]

The USI-001 SPEC extends DUC-001 §19 with Dimension 6 tests: shape validation; literal current-turn anchoring (including a span present only in recent conversation); dimension-local failure; proof that Dimensions 1–5, `interpretationStatus`, Need admission and `UserDisclosureRecognizer` outcomes are unchanged on existing fixtures; and the zero-extra-call proof on ordinary turns. Existing tests that pin the Turn Understanding prompt and closed-output format (for example `tests/turnUnderstandingInterpreter.test.js`, `tests/ou001OpenUnderstanding.test.js`) require authorized, minimal updates in that Work Item. The pinned TRR request-body hash is not affected, because it covers the TRR reasoning request, not Turn Understanding.

---

# 09. Unchanged

DUC-001 §00–§03, §05–§16, §18, §20–§24; Dimensions 1–5 and their validation; the OU amendment §04–§08 (open block, Need projection, failure cases); Need admission and capability resolution; `UserDisclosureRecognizer`; TRR routing; CPI-001; OU-001; CCC-001.

---

# 10. Pending Decisions, Repository Gaps, and Canonical Conflicts

- Deferred to the USI-001 SPEC: exact instruction wording; the `anchorText` length bound; the literal-match normalization; the detector rollout and calibration thresholds.
- Repository Gap: Item 6 has no SPEC (OU-001 GAP-5); unaffected by this amendment.
- Canonical Conflicts: none.

---

# 11. Status and Closure

- Status: **CANONICAL / CLOSED** — in effect together with A2 and the CPI-001 USI-001 amendment (commit `04265683c089e972d90bdd8675610ab37aee8574`). Implementation, verification and closure evidence belong to the USI-001 Work Item.

# 12. Document History

- **v1.0** (initial authoring) — Adds Dimension 6 per the ADP-3 ruling item 3, at baseline `f1d4f53`.
- **v1.0** (canonical closure) — Status CANONICAL / CLOSED: approved by Product/Architecture as one canonical unit with A2 and the CPI-001 USI-001 amendment, committed as `04265683c089e972d90bdd8675610ab37aee8574`. Status metadata only; no content change.
