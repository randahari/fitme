# CPI-001 AMENDMENT — Assertion Anchor for Intake Routing (USI-001)
## v1.0 — CANONICAL / CLOSED — approved together with GCUK Amendment A2 and the DUC-001 USI-001 amendment; implementation by USI-001

**Repository path:** `docs/specs/CPI_001_AMENDMENT_USI_001_v1.0.md`

**Document role:** SPEC amendment to `docs/specs/CPI_001_SPEC_v1.0.md` (CLOSED; hereafter **CPI-001**). Authored together with `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A2_v1.0.md` (hereafter **A2**) and `docs/specs/DUC_001_AMENDMENT_USI_001_v1.0.md` (hereafter the **DUC detector amendment**); the three are reviewed and approved as one unit. CPI-001's own file is not edited; where this amendment extends a CPI-001 section, it governs from its approval onward.

**Evidence labels:** **[VERIFIED]** repository evidence at the baseline commit; **[CANON]** a canonical document or an explicit Product/Architecture decision; **[DESIGN]** wording proposed for canonical approval; **[INFERENCE]**; **[GAP]**.

---

# 01. Identity, Status, and Authority

- Deliverable: **CPI-001 Amendment for USI-001 — the preference assertion anchor.**
- Status: **CANONICAL / CLOSED** — approved by Product/Architecture as one canonical unit with A2 and the DUC detector amendment (commit `04265683c089e972d90bdd8675610ab37aee8574`); implemented by the USI-001 Work Item, not by this amendment.
- Repository baseline: `main` @ `f1d4f53874983ef26fe88ac04303dbe3ac3d549d` **[VERIFIED]**.
- Authority: the Product/Architecture decision authorizing a CPI assertion anchor for USI-001 routing, recorded in A2 as **AR-6a** **[CANON]**. The wording below is **[DESIGN]** until approved.

---

# 02. Purpose

A2 §08 gives CPI-001 precedence over USI-001: CPI-001 owns the preference assertion it recognizes, and USI-001 must not persist that same assertion, while it may still record richer same-turn knowledge grounded in other words the user said.

Applying that rule mechanically requires knowing which current-turn words carry CPI-001's assertion. **[VERIFIED]** CPI-001 does not expose them today:
- for `TRAINING_TIME_PREFERENCE` and `TRAINING_FORMAT_PREFERENCE`, `target` is a closed token (CPI-001 §9; `preferenceIntakeGate.js`, `validateInterpreterResult`);
- for `ACTIVITY_SENTIMENT`, `target` is literal but covers only the activity name, not the assertion (for example "running", not "I enjoy running");
- the persisted payload carries no text (`key`, `value`, `preferenceClass`, `polarity`, `target`, `sourceTurnId`; `js/app.js`, `persistCpiPreferenceRecord`).

This amendment adds one routing-only output that closes that gap, and nothing else.

---

# 03. Scope

| CPI-001 section | Action |
|---|---|
| §9 Detection / Interpretation Contract | One additive output field (§04). The four existing fields, the classes, the polarities, the targets and the Safety-exclusion prompt discipline are unchanged. |
| §10 Deterministic Validation Contract | One anchor validation, local to the anchor (§05). Every existing check, its order and its reasons are unchanged. |
| §14 Pipeline Integration | The validated anchor is made available, for the same turn only, to USI-001 routing (§06). |
| §16 Failure Semantics | Anchor-local failure rows (§07). |
| §22 / §23 Testing and Acceptance | Extended by the USI-001 SPEC (§09). |
| §5–§8, §11–§13, §15, §17–§21, §24–§25 | Unchanged (§10). |

---

# 04. §9 Extension — `assertionAnchorText` — [DESIGN]

The interpreter output (CPI-001 §9) gains one field:

```
assertionAnchorText: string | null   // verbatim current-turn text expressing the recognized preference assertion
```

- **Meaning.** When `eligible: true`, the verbatim span of the current turn that expresses the recognized preference assertion as a whole — the class, polarity and target together as the user said them (for example "I prefer training in the morning", "I enjoy running") — not merely the closed target token or the activity name. When `eligible: false`, `null`.
- **Applies to** every CPI-001 class (`ACTIVITY_SENTIMENT`, `TRAINING_TIME_PREFERENCE`, `TRAINING_FORMAT_PREFERENCE`).
- **Same call.** It is produced by CPI-001's existing single interpreter call. No model call is added. Output-token and latency effects fall under the calibration gate (§08).
- **Current turn only.** Like every CPI-001 literal field, it comes from the current turn's text, never from `recentConversationContext` (CPI-001 §9; CCC-001 amendment §05).

---

# 05. §10 Extension — Anchor Validation (anchor-local) — [DESIGN]

Applied by CPI-001's deterministic validation, after and independently of every existing check:

1. **Literal current-turn substring.** `assertionAnchorText` must pass the same `isLiteralSubstringOf()` discipline CPI-001 already uses (CPI-001 §9, §10 check 2) against the current turn's text, within a length bound fixed by the USI-001 SPEC.
2. **Contains the literal target (class `ACTIVITY_SENTIMENT` only).** Under the same normalization, the anchor must contain the validated literal `target`. For the closed-token classes there is no literal target to contain, so this check does not apply.
3. **Result.** The validation yields either a valid anchor or no anchor. It never changes `eligible`, `preferenceClass`, `polarity`, `target`, the §10 authorization reason, the consent check, the Safety veto, the persisted record, or the acknowledgment. **A missing, malformed or non-literal anchor never breaks CPI-001's own capture.**

**What is and is not proven (binding statement).**
- Rules 1–2 prove deterministically that the anchor is literal current-turn text (so it came from what the user said now) and, for `ACTIVITY_SENTIMENT`, that it contains the recognized activity text.
- They do **not** prove that the model chose the semantically complete extent of the assertion. A too-narrow or too-wide anchor is literal and passes validation. Anchor extent quality is established only by real-model calibration (§08), never claimed as deterministic.

---

# 06. §14 Extension — Same-Turn Routing Use Only — [DESIGN]

1. A valid anchor, together with CPI-001's recognition (`eligible`, `preferenceClass`, `polarity`, `target`) and gate outcome, is made available to USI-001 routing (A2 §08) **for the same turn only**.
2. It is never persisted — not in the Typed Memory payload, not in the record id, not in any log or telemetry. It never enters Pipeline Context, Expression or any Safety input.
3. It grants no persistence authority, no semantic authority beyond identifying CPI-001's own recognized assertion, no consent and no Safety authority.
4. **Fail closed for USI-001 only.** If CPI-001 recognized an assertion (`eligible: true`) but no valid anchor exists, USI-001 must not perform any decomposition that depends on distinguishing CPI-001's assertion from other same-turn content (A2 §08.3). CPI-001's own capture proceeds unchanged.

---

# 07. §16 — Failure Semantics Additions — [DESIGN]

| Case | CPI-001 capture | USI-001 routing |
|---|---|---|
| **AA1 — Anchor valid** | Unchanged | Anchor used as CPI-001's owned span (A2 §08.2) |
| **AA2 — Anchor absent, malformed, over the bound, not a literal current-turn substring, or (class A) not containing the target** | Unchanged | Fails closed for dependent decomposition (§06 item 4) |
| **AA3 — Interpreter `eligible: false`** | Unchanged (no capture) | No CPI-001 ownership; anchor must be `null` |
| **AA4 — Interpreter failure or timeout** (existing CPI-001 §16 behavior) | Unchanged | Treated as higher-precedence recognition unavailable (A2 §08.2 rule 4) |

CPI-001 §16's existing cases are unchanged.

---

# 08. Calibration Gate — [CANON AR-6a; DESIGN mechanics]

Because anchor extent cannot be verified deterministically (§05), the USI-001 implementation requires a real-model calibration gate before acceptance, following the OU-001 and E.0.2b precedent, covering at minimum:
- the anchor validity rate on eligible turns;
- human review of anchor extent (complete assertion, not a fragment and not unrelated text), including mixed turns that pair a preference with additional knowledge;
- confirmation that CPI-001's existing classification outcomes are unchanged on a fixed corpus;
- latency and output-token budget within CPI-001's existing limits.

Thresholds are set by the USI-001 SPEC.

---

# 09. §22 / §23 — Testing and Acceptance — [DESIGN]

The USI-001 SPEC extends CPI-001 §22–§23 with: anchor validation (literal, bound, class-A containment); proof that every existing CPI-001 outcome (authorization reasons, persisted payload and id, acknowledgment, TRR consumption) is byte-identical with and without the anchor; anchor-local failure (AA2 never affects CPI-001's capture); same-turn-only exposure (never persisted, never in Pipeline Context); and zero added model calls. Existing CPI-001 tests that pin the interpreter prompt or output format require authorized, minimal updates in that Work Item.

---

# 10. Unchanged

CPI-001 §1–§8 (scope, authority, consent, the three-class vocabulary), §11 (persistence contract and payload), §12 (identity, dedup, contradiction, supersession), §13 (acknowledgment), §15 (Expression), §17 (Safety boundary and veto), §18 (CCC-001 interaction), §19 (D6), §20 (extensibility), §21 (security/privacy), §24 (non-goals), §25; the deterministic memory id; TRR's consumption of CPI-001 preferences; Typed Memory.

---

# 11. Pending Decisions, Repository Gaps, and Canonical Conflicts

- Deferred to the USI-001 SPEC: the anchor length bound; the normalization for rule 2; the exact prompt wording; calibration thresholds.
- Known limitation (not solved here): anchor extent is model-chosen; calibration measures it (§05, §08).
- Pre-existing CPI-001 limitation, unchanged and out of scope: a conditional preference ("short workouts when I have an early shift") is captured by CPI-001 as unconditional; under A2 §08, USI-001 may record the condition as additional knowledge that cites the CPI-001 record.
- Canonical Conflicts: none.

---

# 12. Status and Closure

- Status: **CANONICAL / CLOSED** — in effect together with A2 and the DUC detector amendment (commit `04265683c089e972d90bdd8675610ab37aee8574`). Implementation, verification and closure evidence belong to the USI-001 Work Item.

# 13. Document History

- **v1.0** (initial authoring) — Adds `assertionAnchorText` per AR-6a, at baseline `f1d4f53`.
- **v1.0** (canonical closure) — Status CANONICAL / CLOSED: approved by Product/Architecture as one canonical unit with A2 and the DUC detector amendment, committed as `04265683c089e972d90bdd8675610ab37aee8574`. Status metadata only; no content change.
