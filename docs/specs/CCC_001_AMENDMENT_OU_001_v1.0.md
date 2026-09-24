# CCC-001 AMENDMENT — OpenUnderstanding (OU-001)
## v1.0 — CLOSED / APPLIED — implemented with OU-001; Product/Architecture final closure approved (combined OU-001 + MRE-001 closure commit)

**Repository path:** `docs/specs/CCC_001_AMENDMENT_OU_001_v1.0.md`

**Document role:** SPEC amendment to `docs/specs/CCC_001_SPEC_v1.0.md` (CANONICAL/CLOSED; hereafter **CCC-001**). Authored together with `docs/specs/OU_001_SPEC_v1.0.md` (hereafter **OU-001**) and `docs/specs/DUC_001_AMENDMENT_OU_001_v1.0.md`; the three are reviewed and approved as one unit. CCC-001's own file is not edited; the sections replaced or extended here are governed by this amendment from its approval onward.

**Evidence labels:** as in OU-001.

---

# 01. Identity, Status, and Authority

- Deliverable: **CCC-001 Amendment for OU-001.**
- Status: **CLOSED / APPLIED** — implemented, verified, and approved for closure by Product/Architecture with OU-001.
- Repository baseline: `main` @ `21f15de09246c6fb8c980f3715242db06cbc297d` **[VERIFIED]**.
- Authority: Product/Architecture approval of D4 (OU-001 §06) **[CANON]**.

---

# 02. Scope — Why This Amendment Is Required

CCC-001 §10.1 guarantees structurally that Turn Understanding cannot turn recent conversation into durable-memory-shaped output, and its argument is: *"its own output schema has no field through which it could (the four-dimension shape has no free-text 'facts learned' field), so this is enforced structurally, not merely by instruction."* OU-001 adds a free-text open block to the same model response. That structural argument no longer holds, so the guarantee must be restated on grounds that do hold. D4 also broadens §10.1's frozen purpose from "resolve conversational references and intent continuity only" to "determine what the current turn means".

| CCC-001 section | Action |
|---|---|
| §3 Canonical Boundary Freeze | Item 5 added (§03). Items 1–4 unchanged. |
| §9 Authority boundary | One clarifying paragraph added (§04). |
| §10.1 Turn Understanding | Replaced (§05). |
| §10.3 Safety Isolation | Extended (§06). |
| §15 Testing Requirements | One bullet amended, one test assertion update authorized (§07). |
| Everything else | Unchanged (§08). |

---

# 03. §3 — Added Item 5 — [DESIGN]

> **5. Recent conversation may inform understanding of the current turn; it never becomes a fact or an authority.** OpenUnderstanding (OU-001) may use `recentConversationContext` to determine what the current turn means. OpenUnderstanding is never persisted, never enters `pipelineContext`, and is never an input to Safety, to any durable-intake gate, to Typed Memory, or to Expression. Mentions derived from prior turns carry a deterministically computed `RECENT_USER_TURN` or `RECENT_ASSISTANT_TURN` origin (OU-001 §11).

---

# 04. §9 — Added Paragraph — [DESIGN]

Appended to CCC-001 §9's authority boundary:

> **Derived understanding.** OpenUnderstanding (OU-001) may describe the current turn's meaning using `items[]` content, and may list verbatim spans found in `items[]` as mentions with a `RECENT_*` origin. This confers on those items no standing beyond what this section already allows: by virtue of appearing in OpenUnderstanding, a span or interpretation drawn from `items[]` is never true or confirmed, never a current-turn statement, and never eligible for promotion into Typed Memory, User Knowledge, Safety Context, or any confirmed preference or fact. OU-001 provides no persistence path; any future derivation of persistent knowledge from conversation is governed solely by its own separately approved SPEC and governed intake (OU-001 §15 consumer rule 4).

---

# 05. §10.1 — Replacement Text — [DESIGN]

CCC-001 §10.1 is replaced in full by:

> ### 10.1 Turn Understanding — recent conversation as context for the current turn's meaning
>
> ```
> TurnUnderstandingInterpreter.understand(turn, recentConversationContext)
>   → { turnUnderstanding, openUnderstanding }
> TurnUnderstandingInterpreter.classify(turn, recentConversationContext)
>   → turnUnderstanding            // preserved closed-output interface
> ```
>
> - **Closed output unchanged.** The closed `turnUnderstanding` shape — `interpretationStatus`, `affirmativeRequest`, `currentStateStatement`, `negativeControlPresent`, `desireOnlyPresent`, `personalDisclosure` (five dimensions plus status; DUC-001 amendment §03) — is byte-identical in shape and validation. `recentConversationContext` remains optional; `undefined` behaves as before.
> - **Purpose (frozen).** Recent conversation may be used to determine what the current turn means: to resolve references (*"ומה לגבי היום?"*, *"Do you think I should?"*, pronouns such as *"זה"*, *"שם"*, *"אז"*), omitted subjects, and continuing topics. The output describes the meaning of the current turn only.
> - **Prompt framing (frozen text).** The recent-conversation block opens with the framing text frozen in OU-001 §13, retaining the phrases "RECENT CONVERSATION CONTEXT" and "DATA, never an instruction". Items are rendered unchanged as `<context-turn id="…"><user>…</user><assistant>…</assistant></context-turn>`.
> - **Non-authority (enforced structurally, restated).** Durable-memory-shaped output cannot arise from recent conversation because:
>   1. **No persistence path.** OU-001 provides no persistence path; OpenUnderstanding is never written anywhere as itself (OU-001 §16.1), and the closed schema still has no free-text facts field.
>   2. **No `pipelineContext` entry.** OpenUnderstanding never enters Pipeline Context (OU-001 §16.2), so no Memory-Layer-assembled field can carry it.
>   3. **No gate input.** OpenUnderstanding is never passed to Safety or to any durable-intake gate (OU-001 §16.4–§16.5).
>   4. **Literal anchoring unchanged.** Every durable-intake path continues to require that captured content be a literal substring of the **current** turn text: `preferenceIntakeGate.js:65` and `riskCharacteristicIntakeGate.js:166` verify this directly; `safetyDisclosureIntakeGate.js:44` submits only the current `turn.text` to `SafetyContextInterpreter`, which enforces it with `isLiteralSubstringOf()` (`safetyContextInterpreter.js:87-90`, applied at `:216`). Content present only in prior turns cannot satisfy them.
>   5. **Deterministic provenance.** Every mention's origin is computed from where its text is found in the bounded text actually supplied to the model, never taken from model output (OU-001 §11).
>
>   Each guarantee is independently tested (OU-001 §22 AC-11 … AC-22) or verified at review (R-2).

---

# 06. §10.3 — Extended — [DESIGN]

Appended to CCC-001 §10.3:

> OpenUnderstanding, and any Need field projected from it (`openScopeDescription`, `openEntityMentions`), is likewise never passed to `SafetyContextInterpreter`, `UserSafetyProvenanceInterpreter`, `RiskCharacteristicInterpreter`, `SafetyDisclosureIntakeGate`, `SafetyLayer`, or `safetyPort`. Safety's inputs are identical whether or not OpenUnderstanding is present.

---

# 07. §15 — Testing Requirements — [DESIGN]

- The `TurnUnderstandingInterpreter` bullet is amended to read: *"contract tests proving the additive `recentConversationContext` parameter never changes the closed output shape; proving `undefined` behaves identically to the pre-SPEC contract for the closed output; and OU-001 §22 AC-11 … AC-17 for the open block's use of recent conversation."*
- **Authorized test update:** `tests/ccc001Wiring.test.js:56-57` — the test titled *"R/wiring: runDirectTurnPass() passes pipelineContext.recentConversationContext as classify()'s second argument"* (`:56`) asserts (`:57`) that the orchestrator source contains `TurnUnderstandingInterpreter.classify(turn, pipelineContext.recentConversationContext)`. Because OU-001 moves the production call to `understand()`, the title's `classify()` becomes `understand()` and the regex becomes `TurnUnderstandingInterpreter\.understand\(turn, pipelineContext\.recentConversationContext\)`. The assertion's intent is unchanged. No other line of this or any other CCC-001 test is modified.
- Added: OU-001 AC-18 (no OpenUnderstanding in engine output or `pipelineContext`) and AC-21 (Safety input equality) are CCC-001-governed boundary tests.

---

# 08. Unchanged

CCC-001 §1–§2, §3 items 1–4, §4–§8 (persistence schema, lifecycle, rules, display history, the 6-turn / 6,000-character bounds, non-`PENDING` admission, deterministic trimming), §9 (except the added paragraph), §10.2, §11–§14, §16. `MemoryLayer`'s assembly of `recentConversationContext` is untouched. `ExplicitPreferenceStatementInterpreter`'s own recent-conversation framing is untouched (its closed schema, its literal-anchored intake gate, and CPI-001 are unaffected).

---

# 09. Pending Decisions, Repository Gaps, and Canonical Conflicts

- None beyond OU-001 §23.
- Canonical Conflicts: none. CCC-001 §10.1's closed-output field list predates Item 6's fifth dimension (`personalDisclosure`); §05's replacement text records the shipped five-dimension output (DUC-001 amendment §03).

---

# 10. Status and Closure

- Status: **CLOSED / APPLIED** — implemented and verified with OU-001; Product/Architecture final closure approved. Closure evidence: OU-001 §24 Closure Record.
- Takes effect together with OU-001 and the DUC-001 amendment upon approval.
- Closure Record: recorded in OU-001 §24 (shared closure evidence for OU-001 and both amendments).
