# DUC-001 AMENDMENT — OpenUnderstanding (OU-001)
## v1.0 — CLOSED / APPLIED — implemented with OU-001; Product/Architecture final closure approved (combined OU-001 + MRE-001 closure commit)

**Repository path:** `docs/specs/DUC_001_AMENDMENT_OU_001_v1.0.md`

**Document role:** SPEC amendment to `docs/specs/DUC_001_SPEC_v1.0.md` (IMPLEMENTED/VERIFIED/CLOSED; hereafter **DUC-001**). Authored together with `docs/specs/OU_001_SPEC_v1.0.md` (hereafter **OU-001**) and `docs/specs/CCC_001_AMENDMENT_OU_001_v1.0.md`; the three are reviewed and approved as one unit. DUC-001's own file is not edited; where this amendment replaces or extends a DUC-001 section, this amendment governs from its approval onward and DUC-001's original text remains the record of the implemented V1 contract.

**Evidence labels:** as in OU-001 (**[VERIFIED]**, **[CANON]**, **[DESIGN]**, **[INFERENCE]**, **[GAP]**).

---

# 01. Identity, Status, and Authority

- Deliverable: **DUC-001 Amendment for OU-001.**
- Status: **CLOSED / APPLIED** — implemented, verified, and approved for closure by Product/Architecture with OU-001.
- Repository baseline: `main` @ `21f15de09246c6fb8c980f3715242db06cbc297d` **[VERIFIED]**.
- Authority: the Product/Architecture approval of D2–D5 (OU-001 §06) and the explicit Product/Architecture instruction to (a) reconcile DUC-001 §04 with the currently shipping five-dimension Turn Understanding contract and (b) resolve the DUC-001 §13 `clarificationContext` documentation/runtime drift **[CANON]**.

---

# 02. Scope

| DUC-001 section | Action |
|---|---|
| §02 Current User Turn Contract | Notes only: `clarificationContext` status (§06 below); raw-text ownership and bounded verbatim mentions (§07 below). Shape unchanged. |
| §04 Bounded Turn Understanding | Reconciled with the shipped five-dimension contract (§03); extended with `understand()` and the open block (§04); failure rule scoped (§05). |
| §06 Conversational Need Creator | Additive Need projection (§07). |
| §13 Clarification / Multi-Turn | `clarificationContext` passthrough paragraph superseded (§06). |
| §17 Failure Semantics | Cases added (§08). |
| §19 Test Contract | Extended (§09). |
| All other sections | Unchanged (§10). |

---

# 03. §04 Reconciliation — The Shipped Five-Dimension Contract — [VERIFIED, recorded]

DUC-001 §04 freezes a four-dimension output. The shipped `TurnUnderstandingInterpreter` has five; the fifth was added by commit `b1ef026` (Friends Alpha Item 6, `USER_DISCLOSURE` V1), for which no SPEC exists in the repository (OU-001 §23 GAP-5). This amendment records the shipped contract as the canonical §04 closed output. It introduces no new behavior.

**Closed output (canonical, replaces the DUC-001 §04 code block):**

```
{
  interpretationStatus: 'CLASSIFIED' | 'FAILED',
  affirmativeRequest:    { present: boolean, domain: <closed pair domain> | null, topic: <closed pair topic> | null },
  currentStateStatement: { present: boolean, text: string | null },
  negativeControlPresent: boolean,
  desireOnlyPresent:      boolean,
  personalDisclosure: {                                   // Dimension 5 — Item 6, as shipped
    present:  boolean,
    category: 'CAPACITY_OR_CONSTRAINT' | 'COACHING_RELEVANT_EXPERIENCE' | null,
    text:     string | null                               // verbatim substring
  }
}
```

**Dimension 5 semantics, as shipped** (`turnUnderstandingInterpreter.js:159-170`): `present: true` only when the turn states, about the user themselves, either (a) a physical or logistical capacity/constraint materially affecting coaching, or (b) a recent, coaching-relevant experience. It is false for general biography, opinions, small talk, third-party statements, and anything already covered by Dimension 2.

**Dimension 5 validation, as shipped** (`:253-258`): when `present === true`, `category` must be one of the two tokens and `text` must be a non-empty string; when `false`, both must be null/absent. Any violation drops the entry (fail-closed by omission).

**Dimension 5 failure shape** (`:315-324`): `{present: false, category: null, text: null}`.

**Dimension 5 consumer** (`userDisclosureRecognizer.js:34-53`): maps `currentStateStatement` → `STATE`, else `desireOnlyPresent` → `DESIRE`, else `personalDisclosure` → its category.

Every other DUC-001 §04 statement about dimensions 1–4 remains accurate and unchanged. References in DUC-001 and CCC-001 to a "four-dimension" output are read as the five-dimension output above.

---

# 04. §04 Extension — `understand()` and the Open Block — [DESIGN]

Added to DUC-001 §04:

1. **API.** `TurnUnderstandingInterpreter.understand(turn, recentConversationContext) → { turnUnderstanding, openUnderstanding }` (OU-001 §07). `classify(turn, recentConversationContext)` is preserved as the closed-output interface and resolves to `understand(...).turnUnderstanding`. The production orchestrator calls `understand()`.
2. **Single call.** Exactly one model call per turn, unchanged model id, unchanged 8,000 ms timeout (never raised), no retry; `max_tokens` 400 → 1,400, confirmed final by the real-model calibration (OU-001 §12, §24).
3. **Output format.** Closed JSON first, then the sentinel `@@OPEN_UNDERSTANDING@@`, then the open JSON (OU-001 §08). The closed segment is parsed by the existing, unmodified `parseAndValidate()`. A response with no sentinel is parsed exactly as today. The isolation of the closed segment from the open segment depends on the model following this order; out-of-order or otherwise malformed output fails closed (`FAILED`), and its rate is a calibration gate (OU-001 §08, §18, AC-CAL-1).
4. **Prompt.** The closed dimension instructions (1–5) and their gating rules, the closed vocabulary, the `<turn id="…">` delimiting and the injection-containment clause are unchanged. Exactly one closed instruction changes: the leading phrase `Respond with STRICT JSON only, no other text:` (`turnUnderstandingInterpreter.js:171`) is replaced by the two-segment output instruction (OU-001 §07 change 3); the closed JSON schema text that follows it and its per-id/gating sentence remain byte-identical. The recent-conversation framing text is replaced per OU-001 §13 (and CCC-001 amendment §05); the always-present open instruction block is added per OU-001 §07 and never contains the phrase `RECENT CONVERSATION CONTEXT`.
5. **Open block.** Contract, validation and provenance: OU-001 §09–§11. The open block is never part of the closed `turnUnderstanding` object; no key is added to it.

---

# 05. §04 Failure Rule — Scoped — [DESIGN]

DUC-001 §04's failure bullet (*"malformed/timeout/unconfigured `callClaude` → the entire structure resolves all-false/all-null (never a partial trust of a well-formed-looking fragment)"*) is amended to read:

> **Failure/malformed output (closed block).** Unchanged fail-closed-by-omission discipline for the closed block: malformed/timeout/unconfigured `callClaude`, or a closed segment that fails validation, resolves the closed structure to `interpretationStatus: 'FAILED'` with all other closed fields all-false/all-null — never a partial trust of a well-formed-looking closed fragment. **The open block is a separate, independently validated output (OU-001 §10):** a malformed open block resolves to `openUnderstanding: null` and never alters a valid closed result; a `FAILED` closed result always yields `openUnderstanding: null`. No partial trust ever crosses from the open block into the closed block, or from a failed closed block into the open block.

---

# 06. §13 / §02 — `clarificationContext` Drift Resolution — [CANON — APPROVED by Product/Architecture]

**Drift [VERIFIED].** DUC-001 §13 states that the orchestrator's `DIRECT_TURN_PASS` path passes a turn's `clarificationContext` "through unchanged into the Conversational Need Creator's own construction (§06) as advisory correlation metadata only". At the baseline:
- The client constructs it: `app.js:2789-2792` sets a `clarificationRef` for a `DIRECT_USER_REQUEST`-sourced decision; `coachConversationPresenter.js:188-193` converts it one-shot into `{priorTurnId, priorNeedRef}`; `app.js:2712` attaches it to the next `CurrentUserTurn`.
- No module under `js/coachDecisionSystem/**` reads `clarificationContext`, and `recognizeDirectUserNeed()` has no parameter for it. It is inert.

**Resolution (smallest canonically correct change: documentation matches runtime, no code change).** DUC-001 §13's second paragraph (beginning *"`internalPipelineOrchestrator.js`'s `DIRECT_TURN_PASS` path, when a turn carries `clarificationContext`, passes it through…"*) is superseded by:

> `clarificationContext` is constructed client-side and carried on the `CurrentUserTurn` (§02) as **reserved, inert correlation metadata**. In V1 no Coach Decision System component consumes it: it does not enter Need construction, Pipeline Context, Turn Understanding, OpenUnderstanding, or any gate, and it alters no Stage 3–10 behavior. Semantic continuity for a clarification answer is provided by the CCC-001 recent-conversation projection (the clarifying question is the prior terminal turn's `assistantText`) together with OpenUnderstanding's reference resolution (OU-001 §13). Any future consumer of `clarificationContext` requires its own approved SPEC.

DUC-001 §13's first and third paragraphs are unchanged. DUC-001 §02's shape is unchanged; its `clarificationContext` comment is read as referring to this reserved, inert status.

**Rationale.** Implementing the passthrough would add a Need field with no reader. Deleting the client construction is a code change with no benefit to this Work Item. Recording the runtime truth removes the contradiction without changing any behavior.

---

# 07. §06 — Need Projection — [DESIGN]

Added to DUC-001 §06:

- `recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext, openUnderstanding)` — additive fourth parameter, `undefined` for all existing callers.
- Step A (the only admission gate) and Step B (capability resolution) are unchanged. `openUnderstanding` never creates, gates, or prevents a Need, and never participates in capability matching (`registryNeed` stays `{legacyScopeMatch}`).
- When a Need is recognized and `openUnderstanding` is valid with a matching `turnId`, the frozen Need additionally carries `openScopeDescription` (= `summary`) and `openEntityMentions` (= `mentions`), per OU-001 §14. Otherwise both fields are omitted and the Need is key-for-key identical to the DUC-001 §06 shape.
- No `shape`, `roughKind`, or other field is created. No open content is copied onto any Opportunity.
- **Raw-text ownership (DUC-001 §02) — clarified.** DUC-001 §02 requires that downstream consumers receive only bounded, structured output derived from the current turn, never the raw string itself. OpenUnderstanding satisfies this: `summary` is a bounded, model-derived interpretation, and each mention is a bounded (≤ `OU_MENTION_MAX_CHARS`), individually validated, deterministically provenance-labelled verbatim span (OU-001 §10–§11). Bounded verbatim mentions are structured derived output under the DUC contract — the same class as the existing `currentStateStatement.text` and `personalDisclosure.text` verbatim substrings — and do not constitute unrestricted forwarding of the raw turn. The raw `turn.text` itself is never placed on the Need.

---

# 08. §17 — Failure Semantics Additions — [DESIGN]

Added rows (DUC-001 §17 Cases A–E unchanged):

| Case | Behavior | Signal |
|---|---|---|
| **C′ — Closed classified, open unavailable** (malformed/absent/truncated open segment, or the model declared `null`) | Identical pipeline behavior to today; any recognized Need omits the open fields. | `interpretationStatus: 'CLASSIFIED'`, `openUnderstanding: null`. |
| **T — Output truncated after the sentinel** | The closed result is unchanged; the open block is `null`. | `stop_reason: 'max_tokens'`, closed `CLASSIFIED`. |
| **T′ — Closed segment previously truncated at 400 tokens** | For an identical closed segment, now validates under the new `max_tokens` (disclosed delta, approved — OU-001 §18/§23 PD-1). | — |
| **O — Output out of order or format-violating** (open segment first, or other text before/in the closed segment) | Fail-closed: identical to Case C. | `interpretationStatus: 'FAILED'`, `openUnderstanding: null`. |
| Timeout | Unchanged Case C (`FAILED`, open `null`). | — |

---

# 09. §19 — Test Contract Additions — [DESIGN]

DUC-001 §19 is extended by OU-001 §22 AC-1 … AC-32, R-1 … R-3 and AC-CAL-1 … AC-CAL-4. Every existing DUC-001 §19 target remains binding and must pass unmodified. The Turn Understanding closed-output tests remain unmodified: test `5.` (`tests/turnUnderstandingInterpreter.test.js:75`) continues to pin the exact five-dimension accepted entry produced by `parseAndValidate()`; test `P:` (`:302`) continues to pin the exact six top-level keys of the `classify()` result (`interpretationStatus` plus the five dimensions).

---

# 10. Unchanged

DUC-001 §00–§01, §03, §05, §08–§12, §12a, §14–§16, §18, §20–§24; Need admission; the closed domain/topic vocabulary; `UserDisclosureRecognizer`; EUR-001; TRR routing; `UNSUPPORTED` formation.

---

# 11. Pending Decisions, Repository Gaps, and Canonical Conflicts

- Repository Gap: Item 6 has no SPEC (OU-001 GAP-5); §03 records its shipped Turn Understanding contract only.
- Resolved: §06 (`clarificationContext` as reserved/inert correlation metadata) — APPROVED by Product/Architecture.
- Product / Architecture / Engineering Decision Pending: none. All other items: OU-001 §23.
- Canonical Conflicts: none.

---

# 12. Status and Closure

- Status: **CLOSED / APPLIED** — implemented and verified with OU-001; Product/Architecture final closure approved. Closure evidence: OU-001 §24 Closure Record.
- Takes effect together with OU-001 and the CCC-001 amendment upon approval.
- Closure Record: recorded in OU-001 §24 (shared closure evidence for OU-001 and both amendments).
