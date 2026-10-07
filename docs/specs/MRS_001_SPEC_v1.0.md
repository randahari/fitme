# MRS-001 SPEC v1.0 — Model Response Structure
## Status: CLOSED — IMPLEMENTED / DETERMINISTICALLY VERIFIED — DEPLOYED AND ACTIVE AT THE DEPLOYED BROWSER SITES; Product/Architecture final closure approved (MRS-001 closure commit)

**Repository path:** `docs/specs/MRS_001_SPEC_v1.0.md`

**Document role:** Cross-cutting SPEC. Defines (1) the canonical structural boundary between a provider model response and the text that a Coach Decision System stage interprets, with its atomic activation at every Coach Decision System model-output parse site; and (2) the canonical request-contract states of every Coach Decision System model request site, the target-state invariant they converge to, and the binding migration rules between them. Amends, by one cross-cutting clause (§13.4), the response-handling input of every owning contract listed in §11.

**Evidence labels:** **[VERIFIED]** repository evidence at the §03 snapshot; **[CANON]** Product/Architecture decision or canonical-document evidence; **[DESIGN]** contract proposed for approval; **[EXTERNAL]** provider documentation (Anthropic, `platform.claude.com/docs`, retrieved 2026-10-05), cited only where a provider fact is required and never as FITME canon; **[INFERENCE]** engineering inference; **[GAP]** missing evidence.

---

# 01. Identity, Status, and Authority

- Deliverable: **MRS-001 — Model Response Structure.**
- Status: **SPEC v1.0 — APPROVED** (Product Review: APPROVED. Architecture Review: APPROVED.).
  - The approval includes the C1–C8 corrections.
  - **[HISTORICAL — pre-implementation]** The SPEC was ready for joint atomic implementation with E.0.2d v1.2 (§11.3), upon the final joint consistency check. The previous status read: NOT IMPLEMENTED. NOT LIVE.
  - **Current lifecycle:** **CLOSED — IMPLEMENTED / DETERMINISTICALLY VERIFIED — DEPLOYED AND ACTIVE AT THE DEPLOYED BROWSER SITES; Product/Architecture final closure approved** (MRS-001 closure commit). See §22 and the Closure Record.
    - Implemented jointly with E.0.2d v1.2 in commit `018b05644aa62ac2faf96bd47ff2b9c4a0a738f2`.
    - Deterministically verified: full regression 3810/3810; S-M, S-F, S-E, S-P, S-T, S-W and G1–G6 green (§19); no model/API call.
    - Deployed and active at the deployed browser sites: application version 2.47.9 is deployed, and the deployed browser application loads `modelResponseStructure.js` ahead of the converted browser site modules (§17 G5). This records deployment evidence only; it does not claim that every converted path has been exercised by a real user. The two E.0.2d sites (S20, S21) are Node-only and not live (E.0.2d §35).
    - Closed: Product/Architecture final closure approved (§22).
  - **[HISTORICAL — pre-closure]** The previous lifecycle read: IMPLEMENTED — DETERMINISTICALLY VERIFIED — DEPLOYED AND ACTIVE AT THE DEPLOYED BROWSER SITES — NOT CLOSED (final closure then required a separate Product/Architecture closure determination).
  - Authoring and correcting this document modified no file other than this one and the E.0.2d SPEC's own v1.2 revision.
- Authority **[CANON]**: the Product/Architecture decisions recorded for this Work Item: the canonical decomposition (new MRS-001; MRE-001 and CARF unchanged; E.0.2d in-file v1.2 as the immediate downstream consumer); response-side activation at all 21 Coach Decision System parse sites; the request-contract states FROZEN-CONTRACT and EXPLICIT-PROFILE; the target-state invariant; migration rules M1–M6; the 19-site FROZEN-CONTRACT inventory; the reasoning vocabulary; the output-budget semantics; zero-drift requirements Z-1…Z-8; mechanical guards G1–G6; the browser-shell exclusion; and the non-goals. Marking this SPEC READY is a Product/Architecture determination.
- Implementation of this SPEC requires separate Product/Architecture authorization (§18). **[Status note]** Granted and fulfilled: implemented in commit `018b056`.

---

# 02. Canonical Sources

Every canonical source this SPEC must remain consistent with. No section cites a source absent from this index.

| # | Source | Path | Status | Relevance |
|---|---|---|---|---|
| C-1 | FITME Specification Authoring Standard v1.1 | `docs/governance/FITME_SPEC_AUTHORING_STANDARD_v1.1.md` | Canonical | Authoring rules |
| C-2 | Context-Aware AI Reasoning Foundation (CARF), Ch.08 "AI Reasoning Invocation Contract — FROZEN" | `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` | CANONICAL / CLOSED | Governing invocation principle (§13.1) |
| C-3 | MRE-001 — Model Response Envelope | `docs/specs/MRE_001_SPEC_v1.0.md` | CLOSED | Downstream text-envelope authority (§13.2); §20 Safety fail-open follow-up (§12) |
| C-4 | DUC-001 | `docs/specs/DUC_001_SPEC_v1.0.md` | CLOSED | Owning contract (S1) |
| C-5 | DUC-001 Amendment OU-001 | `docs/specs/DUC_001_AMENDMENT_OU_001_v1.0.md` | CLOSED / APPLIED | Owning contract (S1, S2); pins model id, timeout, `max_tokens` 1,400 |
| C-6 | DUC-001 Amendment USI-001 | `docs/specs/DUC_001_AMENDMENT_USI_001_v1.0.md` | CANONICAL / CLOSED | Owning contract (S1) |
| C-7 | OU-001 | `docs/specs/OU_001_SPEC_v1.0.md` | CLOSED | Owning contract (S1, S2); `max_tokens` truncation rule; AC-24, AC-31 |
| C-8 | CPI-001 | `docs/specs/CPI_001_SPEC_v1.0.md` | as recorded in the file | Owning contract (S3; S9 status path) |
| C-9 | CPI-001 Amendment USI-001 | `docs/specs/CPI_001_AMENDMENT_USI_001_v1.0.md` | CANONICAL / CLOSED | Owning contract (S3) |
| C-10 | EUR-001 | `docs/specs/EUR_001_SPEC_v1.0.md` | as recorded in the file | Owning contract (S4) |
| C-11 | TRR-001 | `docs/specs/TRR_001_SPEC_v1.0.md` | IMPLEMENTED / VERIFIED / CLOSED | Owning contract (S5, S6, S7, S16) |
| C-12 | CSSC-001 | `docs/specs/CSSC_001_SPEC_v1.0.md` | as recorded in the file | Owning contract (S8) |
| C-13 | USC-001 | `docs/specs/USC_001_SPEC_v1.0.md` | as recorded in the file | Owning contract (S9, S10) |
| C-14 | USP-001 | `docs/specs/USP_001_SPEC_v1.0.md` | as recorded in the file | Owning contract (S11) |
| C-15 | WP0 Safety Risk Characteristic Sub-Spec | `docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md` | as recorded in the file | Owning contract (S12–S15; D.5, D.6, D.6.1) |
| C-16 | WP0 Phase E.0.2b — Semantic Context Discovery | `docs/specs/WP0_PHASE_E_0_2B_SEMANTIC_CONTEXT_DISCOVERY_SPEC_v1.0.md` | CLOSED | Owning contract (S18); §175 and AC-7 pin the request key set |
| C-17 | USI-001 | `docs/specs/USI_001_SPEC_v1.0.md` | IMPLEMENTED — NOT CLOSED | Owning contract (S19); §298, AC-2, AC-16 |
| C-18 | WP0 Phase E.0.2d — Consolidation SPEC v1.2 (in-file revision; v1.1 was CANONICAL / CLOSED (SPECIFICATION) when this SPEC was authored) | `docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md` | **[status note]** APPROVED — IMPLEMENTED in `018b056` — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING — WORK ITEM NOT CLOSED — NOT LIVE | Owning contract (S20, S21); immediate downstream consumer (§13.3) |

Owning contracts named by MRE-001 §05 without a canonical document in the repository — General Reasoning (`WP0_SPEC_v1.0.md`, missing; MRE-001 GAP-2) and Friends Alpha Item 6 (no SPEC; MRE-001 GAP-3) — are recorded in §10.3 and §21, not cited as sources.

---

# 03. Repository Snapshot — 2026-10-05

All facts **[VERIFIED]** at `main` @ `f6ae1a104f472420f92d6cffce2e4516049e0345` (HEAD == `origin/main`).

- **Version:** `sw.js` `VERSION = 'v2.47.8'`; `js/app.js` `APP_VERSION = '2.47.8'`. 21 files under `tests/` contain the string `2.47.8`.
- **Regression:** the full default regression `node --test tests/*.test.js` passed 3767/3767 at this commit.
- **Shared model-response primitive:** `js/coachDecisionSystem/modelResponseEnvelope.js` (MRE-001), script-tagged at `index.html:660`, precached at `sw.js:23`. Text in, text out; no content-block handling.
- **Model-output parse sites:** 21, in 16 files of `js/coachDecisionSystem/`, pinned by `tests/mre001Wiring.test.js` `SITE_FILES` (S1–S21, `:15-32`). Every site obtains its answer text as `content[0].text` (§11 lists each read).
- **Model request sites:** 21 in the same 16 files (§10, plus the two E.0.2d sites). Every body is exactly `{model, max_tokens, messages}` with one user message; no request site sends `thinking`, `system`, `tools`, `temperature` or any other key; every model id is `claude-haiku-4-5-20251001`.
- **Request-body pins:**
  - `tests/mre001InterpreterEquivalence.test.js` `PRE_MRE_REQUEST_BODY_SHA256` pins whole-body hashes for 17 entry points.
  - The TRR reasoning request body sha256 `af3763893eee88d13f7b1256de297b3d942e45ae4d80d7cdf5efc50fa6c8fdd5` is pinned in `tests/ou001ProductionBackedAcceptance.test.js:203` and `tests/e02bProductionBackedAcceptance.test.js:46`.
  - Per-scenario Turn Understanding, CPI and TRR body hashes are pinned in `tests/usi001ProductionBackedAcceptance.test.js:279-282`.
  - Exact key sets `['max_tokens', 'messages', 'model']` are asserted in `tests/e02bSemanticContextDiscovery.test.js:223`, `tests/usi001Interpreter.test.js:29`, `tests/usi001TurnUnderstandingDimension6.test.js:52`, `tests/e02dConsolidationInterpreter.test.js:37` and `tests/e02dConsolidationVerifier.test.js:39`.
- **Stop-reason handling:**
  - These sites check `stop_reason === 'max_tokens'`: `turnUnderstandingInterpreter.js:660` (OU-001 open-segment rule), `semanticContextDiscoveryInterpreter.js:180`, `userStatedIntakeInterpreter.js` (USI-001 §14), `consolidationInterpreter.js:105` and `consolidationVerifier.js:99`.
  - The other sites read no stop reason.
- **Turn Understanding internal response object:** `turnUnderstandingInterpreter.js:473-481` (`splitResponse`) reads the provider response's `content[0].text` and, when the OU-001 sentinel is present, constructs a FITME-internal object `{ content: [{ text: <closed segment> }] }` (`:478`) that `parseAndValidate` (`:354-356`) then reads by `content[0].text`.
- **Test fixtures:** 209 occurrences, in 48 files under `tests/`, construct model responses as `content: [{ text: … }]`, without a block `type`. No test fixture constructs a block with `type: 'text'`.
- **Transport:**
  - Browser-configured interpreters call an injected `deps.callClaude(body)`. `js/adapters/claudeProxyClient.js` `send()` returns the response JSON unchanged (`:24-34`).
  - `functions/index.js` `anthropicProxy` forwards the body, capping only `max_tokens` at 2,000 (`:77-80`), and returns the provider response unchanged.
  - E.0.2d's two stages use a host-injected `modelTransport` and have no production caller (C-18 §08, §29).
- **Runtime flow:** stage builds request → injected transport → provider response → `content[0].text` → `ModelResponseEnvelope.unwrapSingleJsonFence` → `JSON.parse` → stage-owned validation → stage-owned fail-closed outcome.

---

# 04. Problem Statement

1. **The answer-text assumption is uncanonized [VERIFIED].**
   - All 21 Coach Decision System parse sites read the answer as the `text` of the first content block.
   - MRE-001 records this only as an observed fact ("each interpreter reads `content[0].text`", C-3 §02 item 3, §04), not as a contract.
   - No canonical document defines how a stage's answer text is obtained from a provider response.
2. **Typed responses defeat it [EXTERNAL].** A provider response is a list of typed content blocks.
   - When reasoning ("thinking") is active, reasoning blocks precede the answer text.
   - Several current models reason by default when the request carries no reasoning field.
   - Thinking tokens count toward `max_tokens` and are billed as output.
   - A refusal arrives as a normal response with `stop_reason: "refusal"` and, where supplied, `stop_details.category`; its content may be empty or partial.
3. **Consequence [INFERENCE].**
   - Under such a response, every site's `content[0].text` is not the answer: it is empty or reasoning metadata, so the stage fails closed.
   - A future response shape whose first block happened to be a non-answer text-bearing block would be parsed as if it were the answer.
4. **Request side [VERIFIED].**
   - No request site states a reasoning mode.
   - Each stage's reasoning behaviour is whatever the provider applies by default to its model when the field is absent.

---

# 05. Authority Boundary and Processing Order — [CANON]

**Canonical processing order:**

`provider response` → **MRS-001 structural extraction** → MRE-001 text-envelope normalization → `JSON.parse` → stage-owned validation and governance.

**MRS-001 owns:**
- the structural interpretation of a provider response up to, and including, the selection of the single answer text;
- the classification of structural failure and refusal;
- the request-contract states of Coach Decision System model request sites and the rules governing migration between them.

**MRS-001 does not own:**
- prompt construction;
- request content other than what §08 requires for an EXPLICIT-PROFILE stage;
- text-envelope normalization (MRE-001);
- JSON parsing;
- schema validation, closed vocabularies, literal anchors;
- Safety rules or Safety authority;
- authorization, eligibility, consent, persistence or mutation authority;
- any stage's stop-reason policy (§07.6);
- model selection for any stage.

**Grants nothing.** The extracted text is ordinary untrusted text. MRS-001 grants no semantic validity, authority, trust, consent, Safety standing or persistence right, and it creates no semantic inference authority.

**CARF Ch.08 stays the governing invocation principle (C-2).** Each stage continues to own its prompt, model, batching and parsing. MRS-001 is a pure structural helper that the stage calls. It confines the provider's response shape to one module, which strengthens CARF's provider-independent boundary.

---

# 06. Canonical Invariants — [CANON]

## 06.1 Target-state invariant

1. Every Coach Decision System model stage is EXPLICIT-PROFILE (§08.3).
2. No stage's semantic behaviour or invocation behaviour depends on an implicit provider or model reasoning default, or on an implicit provider effort default where an explicit effort control exists (§08.5).
3. The FROZEN-CONTRACT inventory (§10) is empty.

## 06.2 Boundary invariants (binding from activation, for every stage in either state)

1. **Structural extraction first.** Every provider response passes MRS-001 structural extraction before any text is interpreted.
2. **Reasoning is never the answer.** Reasoning content is never read as, returned as, concatenated into, or treated as semantic answer content.
3. **Exactly one answer text.** A JSON semantic stage receives exactly one final answer text, or a structural failure.
4. **Fail closed, never repair.** Unknown, unsupported, ambiguous or malformed structures fail closed. Nothing is concatenated, repaired, reordered or guessed.
5. **Reasoning only where permitted.** Reasoning structure is acceptable only when the governing request contract permits reasoning.
6. **Refusal.** A provider refusal always fails closed. Its category and details, where supplied, are preserved as evidence.
7. **Stop reason.** The stop reason is surfaced unchanged to the owning stage, whose existing stop-reason semantics remain authoritative.
8. **Downstream unchanged.** After extraction, MRE-001 and the stage's own parsing, validation and fail-closed behaviour apply unchanged.

## 06.3 Migration invariant

M1–M6 (§09) are binding from MRS-001's approval. FROZEN-CONTRACT is a migration state, **not** the target architecture.

**What a FROZEN-CONTRACT stage has:**
- Its *semantic meaning* is protected from provider-default reasoning immediately: its response-side reasoning allowance is OFF, so unexpected reasoning fails closed.
- Its *availability* may still depend on the documented provider behaviour of its frozen request. That reliance is transitional and ends at that stage's first M4 trigger.

## 06.4 Prohibited from approval onward

- Any new model stage or request site in FROZEN-CONTRACT state.
- Any in-place change to a FROZEN-CONTRACT site's model id, `max_tokens`, timeout, body key set, transport or provider without migration (§09 M4).
- Any return from EXPLICIT-PROFILE to FROZEN-CONTRACT.
- Any direct answer-text read from a provider response outside MRS-001 in the Coach Decision System.

---

# 07. Structural Extraction Contract

## 07.1 Module — [CANON placement; DESIGN API]

- **Module:** `js/coachDecisionSystem/modelResponseStructure.js`. A new file with a single owner (this SPEC).
- **Module shape:**
  - It mirrors every Coach Decision System module: an IIFE exporting `window.ModelResponseStructure` in the browser and `module.exports` in Node.
  - It has no dependencies.
- **API [DESIGN]:** `ModelResponseStructure.extractAnswerText(rawResponse, contract) -> result`
  - `contract` identifies the governing request contract of the request that produced `rawResponse` (§08). It takes one of exactly two shapes:
    - `{ state: 'FROZEN_CONTRACT', entry: '<F-n>' }`, naming the site's own §10 inventory entry;
    - `{ state: 'EXPLICIT_PROFILE', reasoning: 'OFF' | 'ON' }`, the response-side projection of the site's explicit profile.
  - The structural reasoning allowance is **resolved** from `contract` (§07.3 step 1), never assumed:
    - For FROZEN_CONTRACT it is derived from the canonically enumerated inventory entry. Every entry's allowance is OFF (§08.2).
    - For EXPLICIT_PROFILE it is the profile's stated mode.
  - The module carries the canonical FROZEN-CONTRACT inventory as a frozen constant (`FROZEN_CONTRACT_INVENTORY`): each §10 entry identifier with its frozen signature. Only §09 M6 removals may change it.
  - `result` is a frozen object:

```
{ status: 'OK' | 'FAILED',
  text: string | null,           // the single answer text when OK; null when FAILED
  stopReason: string | null,     // rawResponse.stop_reason, unchanged
  failure: <§07.5 code> | null,  // null when OK
  refusal: { category, details } | null }   // supplied refusal fields, unchanged; null otherwise
```

- **Binding properties:**
  - Pure and deterministic: output depends only on its two arguments and the frozen inventory constant; no I/O, mutable state, clock, configuration or logging.
  - Never invents request-contract semantics. A missing, unknown or malformed `contract` is a structural failure (`CONTRACT_UNRESOLVED`), never a default.
  - Never throws; never mutates its input.
  - Domain-agnostic: it knows nothing about schemas, stages, fields, Safety or meaning.
  - Grants nothing (§05).
- **Forbidden:**
  - concatenating blocks;
  - reading reasoning content;
  - selecting among several answer texts;
  - JSON handling of any kind (MRE-001's and the stage's concern);
  - prose tolerance; repair; recovery; retry;
  - provider fallback;
  - any model-id condition.

## 07.2 Block classes — [DESIGN, from §04 item 2 / EXTERNAL]

Each element of `rawResponse.content` belongs to exactly one class:

| Class | Members | Treatment |
|---|---|---|
| ANSWER_TEXT | a plain-object block whose `type` is exactly `'text'` and whose `text` is a string | the candidate answer |
| REASONING | a plain-object block whose `type` is exactly `'thinking'` or `'redacted_thinking'` | never read; acceptable only when the resolved reasoning allowance is ON |
| UNSUPPORTED | a plain-object block whose `type` is any other string (including tool-use, server-tool, fallback and future types) | always a structural failure |
| MALFORMED | an element that is not a plain object; **a block with no `type` property, or whose `type` is not a string**; or a block typed `'text'` whose `text` is not a string | always a structural failure |

**Explicit structural discriminator — [CANON].** A block is identifiable only by its explicit `type`. A block with a `text` property but no `type` — for example `{ text: '…' }` — is **MALFORMED** at the provider-response boundary. It is never inferred to be ANSWER_TEXT, and its missing discriminator is never repaired or guessed. Current provider responses carry `type` on every content block **[EXTERNAL]**.

## 07.3 Extraction algorithm — [DESIGN]

Evaluated in order; the first failing step decides.

1. **Resolve the governing contract.** The contract resolves only when `contract` is a plain object of exactly one §07.1 shape:
   - `FROZEN_CONTRACT` naming an entry present in `FROZEN_CONTRACT_INVENTORY`, which resolves the allowance to OFF;
   - `EXPLICIT_PROFILE` with `reasoning` exactly `'OFF'` or `'ON'`, which resolves the allowance to that mode.

   Anything else → `FAILED` / `CONTRACT_UNRESOLVED`, regardless of the response. That includes:
   - a missing, `null` or non-object `contract`;
   - an unknown `state`;
   - an unknown or removed inventory entry;
   - a missing or out-of-vocabulary `reasoning`;
   - extra or conflicting fields.
2. If `rawResponse` is a plain object and `rawResponse.stop_reason === 'refusal'` → `FAILED` / `REFUSAL`, with `refusal` populated from `rawResponse.stop_details` where supplied, regardless of content.
3. If `rawResponse` is not a plain object, or `rawResponse.content` is not an array → `FAILED` / `NOT_A_RESPONSE`.
4. Classify every element (§07.2). Any MALFORMED (including an untyped `{ text: … }` block) → `FAILED` / `MALFORMED_BLOCK`. Any UNSUPPORTED → `FAILED` / `UNSUPPORTED_BLOCK`.
5. Any REASONING block while the resolved allowance is OFF → `FAILED` / `REASONING_NOT_PERMITTED`.
6. Zero ANSWER_TEXT blocks → `FAILED` / `NO_ANSWER_TEXT`. Two or more → `FAILED` / `MULTIPLE_ANSWER_TEXT`.
7. Otherwise → `OK`, with `text` = the single ANSWER_TEXT block's `text`, byte-for-byte.

An empty-string answer text is one ANSWER_TEXT block. It is returned as `''` and then fails in the stage's unchanged `JSON.parse`, exactly as today.

## 07.4 Site integration — [CANON]

- **Activation:** at each of S1–S21 (§11), the expression that reads the answer text from a provider response is replaced by MRS-001 extraction under the site's governing contract, passed explicitly:
  - FROZEN-CONTRACT sites pass `{ state: 'FROZEN_CONTRACT', entry }` naming their own §10 entry (§11.1 maps each parse site to its entries);
  - EXPLICIT-PROFILE sites pass `{ state: 'EXPLICIT_PROFILE', reasoning }` from their governing profile.

  No site omits, defaults or synthesizes its contract.
- **Provider boundary only:** MRS-001 validates the structure of **provider responses**. A FITME-internal object constructed downstream of that boundary is not a provider response, does not cross MRS-001, and needs no provider block discriminator (§11.2).
- **Structural failure:** the site produces **exactly the outcome it produces today when its answer text is empty or unparseable**, its existing fail-closed result. Where that result shape cannot carry the failure classification, the classification is not added to it (§07.7).
- **Unchanged at each site:** the MRE-001 call, `JSON.parse`, every validator, every return shape, every `try/catch`, and every stop-reason check.

## 07.5 Closed structural failure vocabulary — [DESIGN]

`CONTRACT_UNRESOLVED`, `REFUSAL`, `NOT_A_RESPONSE`, `MALFORMED_BLOCK`, `UNSUPPORTED_BLOCK`, `REASONING_NOT_PERMITTED`, `NO_ANSWER_TEXT`, `MULTIPLE_ANSWER_TEXT`.

`CONTRACT_UNRESOLVED` means that the request contract governing the response could not be resolved (§07.3 step 1). It indicates a wiring defect at the calling site. G5 makes it unreachable from any converted site, and if reached it fails closed like every other code.

## 07.6 Stop reasons — [CANON]

- `stopReason` is surfaced unchanged.
- MRS-001 applies no stop-reason policy except `refusal` (§07.3 step 1).
- Every existing stage-owned rule remains authoritative and unchanged, including:
  - OU-001's `max_tokens` open-segment rule and closed-first truncation isolation;
  - E.0.2b's and USI-001's `max_tokens` → FAILED;
  - E.0.2d's `max_tokens` → stage failure;
  - the absence of any stop-reason rule at the remaining sites.
- MRS-001 does not add a stop-reason rule to any site that has none.

## 07.7 Evidence semantics — [CANON]

Where the owning stage, its tests or a calibration harness records evidence, the following are preserved unchanged:
- the raw provider response;
- the stop reason;
- usage;
- refusal category and details where supplied;
- the structural outcome and failure classification.

Further:
- Usage output-token counts are understood as possibly including reasoning tokens.
- Reasoning content is never promoted into answer content or into any interpreted field.
- MRS-001 creates no telemetry, logging or new evidence channel. Parse-failure observability remains MRE-001 §21's open follow-up.

---

# 08. Request-Contract States

## 08.1 States — [CANON]

Every Coach Decision System model request site governed by MRS-001 is in exactly one state: **FROZEN-CONTRACT** or **EXPLICIT-PROFILE**.

## 08.2 FROZEN-CONTRACT — [CANON]

- **What it is:** a finite, canonically enumerated legacy request contract (§10), preserved byte-for-byte.
- **Frozen signature:** model id, `max_tokens`, timeout constant, and body key set `{model, max_tokens, messages}`.
- **Response side:** its reasoning allowance is OFF. That allowance is derived from its canonically enumerated inventory entry, which the site names explicitly (§07.1, §07.4); it is never a default. Reasoning structure in its response fails closed (`REASONING_NOT_PERMITTED`).
- **Status:** a migration state, not the target architecture. Its availability may rely on the documented provider behaviour of its frozen request **[EXTERNAL]**: for `claude-haiku-4-5-20251001`, a request without a reasoning field runs with thinking off.

## 08.3 EXPLICIT-PROFILE — [CANON]

A stage-owned request profile explicitly defines:
- `model`;
- `reasoning` ∈ `{OFF, ON}` (§08.4);
- `effort` (§08.5);
- `maxOutputTokens` (§08.6);
- `timeoutMs`;
- the **provider binding**: the provider request values required to express the approved profile.

Further:
- The request carries the provider binding.
- Response extraction runs under the same profile's reasoning mode, passed explicitly by the site (§07.4, G4). An EXPLICIT-PROFILE site that does not supply its contract fails closed (`CONTRACT_UNRESOLVED`).
- No semantic or invocation behaviour may depend on an unstated provider or model reasoning default, or on an implicit provider effort default where an explicit effort control exists (§08.5).
- `reasoning` and `effort` are independent dimensions, validated independently (§08.5).
- Each stage's profile values are defined by its owning contract, not by MRS-001.

## 08.4 Reasoning vocabulary — [CANON]

`reasoning = OFF | ON`.

- **OFF:** no reasoning content is permitted before the semantic answer.
- **ON:** provider-managed reasoning is structurally permitted and never becomes answer content.

Provider-specific request values (§08.7) are configuration and binding data beneath the canonical mode, not canonical semantic vocabulary.

## 08.5 Effort — [CANON]

`effort ∈ {LOW, MEDIUM, HIGH, NOT_APPLICABLE}`.

- **Independent of reasoning.** `reasoning` and `effort` are independent request-profile dimensions. Neither value implies the other, and they are validated independently.
- **Explicit where an effort control exists.** If the selected model and provider binding support an explicit effort control, the profile **must** specify `LOW`, `MEDIUM` or `HIGH`. This holds whether `reasoning` is `OFF` or `ON`. FITME never relies on an implicit provider effort default where an explicit effort control exists.
- **`NOT_APPLICABLE`.** Permitted only when the selected model and provider binding do not support an effort control.
- **Provider effort constraints.** Any constraint the provider places on effort for a given reasoning binding (§08.7) is satisfied explicitly by the profile, never by a default.
- No other level is canonical. Whether a model supports an effort control is a provider fact recorded in the profile's binding, validated at configuration or approval time (§08.7). No capability registry is introduced.

## 08.6 Output budget — [CANON]

**`maxOutputTokens` means the total provider-output ceiling:** reasoning output plus answer output whenever reasoning is ON.

Rationale:
- it is a deterministic cost bound;
- it is a deterministic latency and truncation bound;
- it is portable across providers;
- current providers offer no reliably enforceable answer-only ceiling independent of reasoning **[EXTERNAL]**.

Consequences:
- With `reasoning = OFF`, today's answer bounds keep their existing meaning.
- With `reasoning = ON`, the stage profile requires its own calibrated total ceiling.
- MRS-001 chooses no stage's ceiling.

## 08.7 Provider binding — [DESIGN]

A profile's provider binding must be consistent with its canonical mode. Consistency is a deterministic check over **provider request values**, never over model ids.

For the current provider **[EXTERNAL]**:

| Canonical mode | Admissible thinking binding (exact objects) |
|---|---|
| OFF | exactly `{type: 'disabled'}`; or exactly `{type: 'between_tools'}`, under the scope rule below |
| ON | `{type: 'adaptive'}` |

**Effort.** Independently of the thinking binding, the provider's effort control is set per §08.5 whenever the selected model supports one, under either mode.

**Exactness — [CANON].** An OFF thinking binding is admitted only as the exact supported object. A value whose `type` matches but which carries any additional thinking field (for example `display`, `budget_tokens` or `block_binding`) is not admissible.

**`between_tools` scope — [CANON].** `{type: 'between_tools'}` may represent `reasoning = OFF` only when all three hold:
1. the selected provider and model support it;
2. the request is tool-free;
3. every provider effort constraint required for that mode is satisfied explicitly by the profile's effort value (§08.5).

It is not a universally valid OFF binding.
- **[EXTERNAL]** It is accepted only by specific models, at `high` effort or below, and only without tools does the response contain text alone.
- **[VERIFIED]** Every Coach Decision System request at the §03 snapshot is tool-free.
- A request with tools under a `between_tools` OFF binding would be outside this scope. Any reasoning structure in its response fails closed (`REASONING_NOT_PERMITTED`, §07.3).

Further:
- Whether a given binding and effort value are valid for the selected model is part of profile validation, a binding and configuration responsibility beneath these canonical semantics.
- A model that cannot express the approved mode makes that profile unsatisfiable. The provider's rejection is a transport failure and fails closed by the stage's existing contract.
- No runtime model-capability registry is introduced.

---

# 09. Migration Rules — [CANON]

- **M1 — Response protection now.** MRS-001 structural extraction applies immediately to all 21 parse sites. FROZEN-CONTRACT stages reject reasoning structures.
- **M2 — Finite inventory.** The FROZEN-CONTRACT inventory is exactly the 19 request sites of §10, each with its frozen signature.
- **M3 — No growth.** Every new model stage and every new request site is EXPLICIT-PROFILE from inception.
- **M4 — Mandatory migration triggers.**
  - A FROZEN-CONTRACT site must migrate to EXPLICIT-PROFILE **in the same authorized change** as any change to its model id, maximum output token bound, timeout, body key set, transport or provider.
  - A provider deprecation notice affecting its frozen model triggers mandatory migration planning, and completion before the published retirement date.
  - A prompt revision by itself does **not** automatically trigger migration. Existing request-body and hash guards and the owning contract's review remain authoritative for prompt changes.
- **M5 — One way.** An EXPLICIT-PROFILE site never returns to FROZEN-CONTRACT.
- **M6 — Inventory only shrinks.** The FROZEN-CONTRACT inventory may only lose entries. Each removal is recorded by the change that migrates the site.

## 09.1 Deprecation responsibility — [CANON]

**Model Runtime / Architecture maintenance** is responsible for tracking provider deprecation notices that affect any model present in the FROZEN-CONTRACT inventory. This is a role, not a named person.

When such a notice is identified:
1. Migration of every affected site becomes mandatory.
2. Affected sites must be moved to EXPLICIT-PROFILE before the provider's retirement date.
3. The canonical review, deterministic verification and real-model calibration required by each owning contract remain applicable.

No automated monitoring system is introduced: none exists in the repository **[VERIFIED]**. Detection is a process responsibility (§17.2).

---

# 10. FROZEN-CONTRACT Inventory — [CANON]

## 10.1 Common signature

All 19 entries share these values **[VERIFIED]**:
- model: `claude-haiku-4-5-20251001`;
- request key set: `{model, max_tokens, messages}`, with exactly one user message;
- no reasoning field.

## 10.2 Entries

| # | Entry point | Request site (function) | `max_tokens` | Timeout (ms) | Owning canonical contract | Parse site |
|---|---|---|---|---|---|---|
| F-1 | Turn Understanding `understand` | `turnUnderstandingInterpreter.js:446` (`buildRequestBody`) | 1400 | 8000 | DUC-001 as amended by OU-001 and USI-001 (C-4, C-5, C-6); OU-001 (C-7) | S1, S2 |
| F-2 | Explicit Preference Statement `classify` | `explicitPreferenceStatementInterpreter.js:257` (`classifyBatch`) | 400 | 8000 | CPI-001 as amended by USI-001 (C-8, C-9) | S3 |
| F-3 | Explicit Request `classify` | `explicitRequestInterpreter.js:261` (`classifyBatch`) | 400 | 8000 | EUR-001 (C-10) | S4 |
| F-4 | Readiness State `classify` | `readinessStateInterpreter.js:176` (`classifyBatch`) | 300 | 8000 | TRR-001 (C-11) | S5 |
| F-5 | Activity Preference `classify` | `activityPreferenceInterpreter.js:177` (`classifyBatch`) | 400 | 8000 | TRR-001 (C-11) | S6 |
| F-6 | Activity Opposition `classify` | `activityOppositionInterpreter.js:172` (`classifyBatch`) | 400 | 8000 | TRR-001 (C-11) | S7 |
| F-7 | Situational Context `classify` | `situationalContextInterpreter.js:166` (`classifyBatch`) | 300 | 8000 | CSSC-001 (C-12) | S8 |
| F-8 | Safety Context `classify` | `safetyContextInterpreter.js:259` (`classifyBatch`) | 400 | 8000 | USC-001 (C-13) | S9 |
| F-9 | Safety Context `classifyWithStatus` | `safetyContextInterpreter.js:346` (`classifyBatchWithStatus`) | 400 | 8000 | USC-001 (C-13); CPI-001 (C-8) | S9 |
| F-10 | Safety Context `classifyCorrectionWithStatus` | `safetyContextInterpreter.js:475` (`classifyCorrectionWithStatus`) | 200 | 8000 | USC-001 (C-13); Friends Alpha Item 6 — **no complete canonical owner** (§10.3) | S10 |
| F-11 | User Safety Provenance `classify` | `userSafetyProvenanceInterpreter.js:229` (`classifyBatch`) | 400 | 8000 | USP-001 (C-14) | S11 |
| F-12 | Risk Characteristic `classifyCandidateContent` | `riskCharacteristicInterpreter.js:194` | 500 | 8000 | Safety Sub-Spec D.6 (C-15) | S12 |
| F-13 | Risk Characteristic `classifyTurnForDurableConstraint` | `riskCharacteristicInterpreter.js:289` | 500 | 8000 | Safety Sub-Spec D.5 (C-15) | S13 |
| F-14 | Risk Characteristic `classifyCorrectionWithStatus` | `riskCharacteristicInterpreter.js:369` | 200 | 8000 | Safety Sub-Spec D.5 (C-15) | S14 |
| F-15 | Risk Characteristic `classifyCandidateConflictWithFact` | `riskCharacteristicInterpreter.js:456` | 200 | 8000 | Safety Sub-Spec D.6.1 (C-15) | S15 |
| F-16 | TRR Reasoning `propose` | `trainingReadinessReasoningComponent.js:165` (`propose`) | 700 | 12000 | TRR-001 (C-11); CARF (C-2) | S16 |
| F-17 | General Reasoning `reason` (non-live) | `generalReasoningCapability.js:261` (`reason`) | 700 | 12000 | WP0 General Reasoning — **no complete canonical owner** (§10.3) | S17 |
| F-18 | Semantic Context Discovery `discover` | `semanticContextDiscoveryInterpreter.js:113` (`buildRequestBody`) | 400 | 6000 | E.0.2b (C-16) | S18 |
| F-19 | User-Stated Intake `interpret` | `userStatedIntakeInterpreter.js:157` (`buildRequestBody`) | 800 | 8000 | USI-001 (C-17) | S19 |

Timeouts are each module's `TIMEOUT_MS` constant, the default of its `deps.timeoutMs` **[VERIFIED]**. Line numbers identify sites at the §03 snapshot. G1/G2 identify sites by file and function, not by line.

## 10.3 Sites without a complete canonical owner — [CANON]

- **F-17 General Reasoning:** its owning `WP0_SPEC_v1.0.md` is missing (MRE-001 GAP-2).
- **F-10 Item 6 / S10 correction path:** Friends Alpha Item 6 has no SPEC (MRE-001 GAP-3); USC-001 owns the module.

Both are valid FROZEN-CONTRACT entries. MRS-001 assigns no ownership to either. Migrating either to EXPLICIT-PROFILE first requires the appropriate canonical ownership to be established or identified.

## 10.4 Not in the inventory

E.0.2d's Generator (`consolidationInterpreter.js`) and Verifier (`consolidationVerifier.js`) request sites are **not** FROZEN-CONTRACT. E.0.2d v1.2 makes them EXPLICIT-PROFILE (§13.3).

---

# 11. Parse-Site Activation and Atomicity

## 11.1 Sites — [VERIFIED]

Each listed line is the site's current answer-text read.

| Site | Read (file:line, function) | Request state |
|---|---|---|
| S1 | `turnUnderstandingInterpreter.js:356` (`parseAndValidate`) | FROZEN (F-1) |
| S2 | `turnUnderstandingInterpreter.js:474` (`splitResponse`; the open segment is then validated by `validateOpenUnderstanding`) | FROZEN (F-1) |
| S3 | `explicitPreferenceStatementInterpreter.js:191` (`parseAndValidate`) | FROZEN (F-2) |
| S4 | `explicitRequestInterpreter.js:197` (`parseAndValidate`) | FROZEN (F-3) |
| S5 | `readinessStateInterpreter.js:145` (`parseAndValidate`) | FROZEN (F-4) |
| S6 | `activityPreferenceInterpreter.js:135` (`parseAndValidate`) | FROZEN (F-5) |
| S7 | `activityOppositionInterpreter.js:130` (`parseAndValidate`) | FROZEN (F-6) |
| S8 | `situationalContextInterpreter.js:135` (`parseAndValidate`) | FROZEN (F-7) |
| S9 | `safetyContextInterpreter.js:196` (`parseAndValidate`; shared by both request paths, and each call passes the entry of the request that produced its response) | FROZEN (F-8, F-9) |
| S10 | `safetyContextInterpreter.js:445` (`parseAndValidateCorrection`) | FROZEN (F-10) |
| S11 | `userSafetyProvenanceInterpreter.js:179` (`parseAndValidate`) | FROZEN (F-11) |
| S12 | `riskCharacteristicInterpreter.js:158` (`parseCandidateContentResponse`) | FROZEN (F-12) |
| S13 | `riskCharacteristicInterpreter.js:251` (`parseDurableConstraintResponse`) | FROZEN (F-13) |
| S14 | `riskCharacteristicInterpreter.js:338` (`parseCorrectionResponse`) | FROZEN (F-14) |
| S15 | `riskCharacteristicInterpreter.js:428` (`parseCandidateConflictResponse`) | FROZEN (F-15) |
| S16 | `trainingReadinessReasoningComponent.js:128` (`parseProposal`) | FROZEN (F-16) |
| S17 | `generalReasoningCapability.js:244` (`parseProposal`) | FROZEN (F-17) |
| S18 | `semanticContextDiscoveryInterpreter.js:184` (`discover`) | FROZEN (F-18) |
| S19 | `userStatedIntakeInterpreter.js:176` (`parseResponse`) | FROZEN (F-19) |
| S20 | `consolidationInterpreter.js:106` (`parseResponse`) | EXPLICIT-PROFILE (E.0.2d v1.2) |
| S21 | `consolidationVerifier.js:100` (`parseResponse`) | EXPLICIT-PROFILE (E.0.2d v1.2) |

## 11.2 Turn Understanding internal object — [CANON boundary; ED-1 RESOLVED in the implementation — §21]

**Current wiring [VERIFIED]:**
- `splitResponse` (`turnUnderstandingInterpreter.js:473-481`) reads the **provider response**.
- Without the OU-001 sentinel, it hands that provider response itself to `parseAndValidate` as `closedResponse`.
- With the sentinel, it hands a **FITME-internal object** `{ content: [{ text: <closed segment> }] }` (`:478`) instead.
- `parseAndValidate` (S1, `:354-356`) reads both through the same parameter, by `content[0].text`.
- Today, therefore, an internal object crosses S1 as though it were a raw provider response.

**Canonical boundary:**
- MRS-001 validates provider-response structure exactly once per provider response, at the point where Turn Understanding receives it.
- The FITME-internal closed-segment representation is downstream of that boundary. It is not a provider response, does not pass through MRS-001, and is not required to carry a provider block discriminator.
- MRS-001's provider boundary is not weakened to accommodate it: an untyped internal object presented to MRS-001 *as* a provider response would be `MALFORMED_BLOCK`.

**Required:**
- Extraction applies once, to the provider response.
- S1 and S2 results for the sentinel-free, sentinel and truncated paths are identical to today's for structurally valid provider responses (Z-2).
- OU-001's split, sentinel handling, one-way failure rules and truncation isolation are unchanged (C-7).
- No internal object is passed to `extractAnswerText`.

How the S1 wiring is restructured to meet these requirements is delegated to Engineering (§21 ED-1). For example, splitting the extracted answer text, and passing the closed segment downstream as text or as an internal representation that S1 consumes without re-extraction.

## 11.3 Atomicity — [CANON]

S1–S21 switch to MRS-001 in one implementation change, together with:
- the shared primitive;
- the wiring and static guards (§17);
- the zero-drift verification (§16);
- the version and cache changes (§18).

No mixed old/new response-extraction state is a valid checkpoint, in any commit, branch or deployment. G5 makes partial activation non-mergeable.

Because G1 and G4 require every request site to be either FROZEN-CONTRACT or EXPLICIT-PROFILE, **MRS-001 cannot be implemented before E.0.2d v1.2 is approved.** The two are implemented together in the same atomic change.

---

# 12. Safety — [CANON]

**What does not change:**
- MRS-001 changes no Safety rule, Safety authority, Safety validator, closed vocabulary, literal anchor, risk semantics or Safety fail-closed status path.
- No canonical Safety rule changes. That covers CSR-001's rules, `matchCanonicalSafetyRules`, `finalReview` and `disqualify`.
- Safety request sites F-8 to F-15 stay byte-identical (Z-4).

**What a structural failure does at a Safety site:** it yields exactly the existing outcome of an empty or unparseable response (§07.4).

**Required controls at the Safety parse sites S9–S15:**
- **Positive:** a single-text-block response yields results deep-equal to today's, including downstream `userSafetyContext`, `userSafetyProvenance`, `riskCharacteristicTags` and canonical-rule matches (MRE-001 P-1, P-2, P-4 pattern).
- **Negative:** each structural failure class, including `REFUSAL` and `REASONING_NOT_PERMITTED`, yields exactly the existing failure outcome.
- **Literal anchors:** literal-anchor rejection is unchanged (MRE-001 P-5 pattern).

**Known pre-existing defect, outside this Work Item:** MRE-001 §20 records a Safety malformed-output / unavailable-state fail-open defect. A failed Safety classification is indistinguishable from "nothing found", and `MemoryLayer.assembleContext()` publishes it as AVAILABLE with zero items. MRS-001 neither fixes nor expands it. A structural failure at S9 or S11 enters the same existing path as today's empty or unparseable response, and nothing more. That follow-up remains open under its existing owner.

---

# 13. Relationship to Existing Canonical Authority

## 13.1 CARF — [CANON]

CARF Ch.08 (C-2) remains the governing invocation principle and is **unchanged**:
- the stage owns its prompt, model, batching and parsing;
- one injected transport;
- provider independence;
- stateless invocation;
- one attempt with a timeout;
- every failure produces no trusted output.

MRS-001 restates none of these rules. Its primitive is a helper the stage calls, not a parser that takes ownership.

## 13.2 MRE-001 — [CANON]

- MRE-001 (C-3) remains CLOSED and **unchanged**, as the downstream text-envelope authority.
- MRS-001 operates before it.
- MRE-001's §10 clause keeps governing the text passed to `JSON.parse`. That text is now MRS-001's extracted answer text.
- MRE-001's matrix, wiring (W-1…W-5), pinned values and assertions are not modified. Its provider-response fixtures receive only the §16.1 `type` discriminator migration, and its pinned pre-MRE-001 result and request-body hashes must remain green unchanged.

## 13.3 E.0.2d — [CANON]

E.0.2d v1.2 (C-18) is the immediate downstream canonical consumer. It is authored separately, after review of this SPEC, and will:
1. make the Generator and Verifier EXPLICIT-PROFILE;
2. define their request profiles;
3. define how structural failure and refusal integrate with its failure taxonomy;
4. update CAL-D7 under §08.6;
5. update calibration evidence and accounting.

MRS-001 authors none of E.0.2d's profiles or values.

## 13.4 Cross-cutting clause — [DESIGN]

For every owning contract of S1–S21 (§10.2, plus C-18), the following clause is added and governs from approval:

> **Model response structure (MRS-001).** Wherever this contract reads a model response's text, the text read is the answer text returned by `ModelResponseStructure.extractAnswerText` (MRS-001 §07) under this stage's explicitly supplied request contract. A structural failure — including an unresolved request contract, a provider refusal, a reasoning block under reasoning OFF, a missing or duplicated answer text, or an unsupported, untyped or malformed block — produces exactly this contract's existing outcome for an empty or unparseable response. MRE-001, JSON parsing, every validation rule, closed vocabulary, literal anchor, stop-reason rule, failure status and fail-closed behavior of this contract are unchanged. This contract's request is FROZEN-CONTRACT or EXPLICIT-PROFILE as recorded in MRS-001 §10 and is governed by MRS-001 §09.

No owning contract is edited file-by-file. No semantic, validation, Safety or product decision in any of them is reopened.

---

# 14. Browser-Shell Exclusion — [CANON]

**Excluded from MRS-001 v1.0 activation:**
- the browser-shell model-call sites in `js/app.js`;
- `js/coach/coachClient.js`;
- `js/nutrition/nutritionAnalysisService.js`;
- the `anthropicProxy` `max_tokens` ceiling of 2,000 (`functions/index.js:77-80`).

These read `content[0].text` and use model `claude-sonnet-4-6` **[VERIFIED]**. They are not modified or canonically migrated here.

They are recorded as a named follow-up, **"Browser-shell model-response and request-profile migration"** (§21 GAP-3), owned by Product/Architecture.

---

# 15. Non-Goals — [CANON]

- No prompt change.
- No Safety policy change.
- No authorization, eligibility, consent, governance, persistence or mutation-authority change.
- No model change at any site.
- No provider change.
- No automatic fallback, server-side fallback, retry or response recovery.
- No cross-provider abstraction beyond the structural canonical semantics of §07–§08.
- No browser-shell migration (§14).
- No model-capability registry.
- No real-model calibration as part of MRS-001 implementation.
- No reopening of MRE-001 or CARF.
- No change to `js/core/jsonUtils.js`, `js/adapters/claudeProxyClient.js` or `functions/**`.
- No telemetry or observability (MRE-001 §21 remains open).
- No resolution of the MRE-001 §20 Safety fail-open defect (§12).
- No authoring of E.0.2d profiles (§13.3).

---

# 16. Zero-Drift Requirements Z-1…Z-8 — [CANON]

**Scope of "zero drift" — [CANON].** Zero drift applies to **structurally valid current-provider responses**: a plain object whose `content` is an array of typed blocks, containing exactly one block `{ type: 'text', text: <string> }` and no reasoning, unsupported or malformed block. It does **not** extend to preserving historical malformed representations, such as untyped `{ text: … }` test fixtures (§16.1).

- **Z-1 — Identical extracted text.** For every structurally valid current-provider single-text response, the extracted text is strictly identical (`===`) to that response's `content[0].text` as read today.
- **Z-2 — Per-site equivalence, S1–S21.**
  - Through each site's exported parse or entry function, results for structurally valid current-provider single-text responses are deep-equal to the pre-MRS-001 results for the same answer text.
  - The MRE-001 envelope behaviour and the JSON and schema validation are the same.
  - This includes the Safety positive and negative controls of §12, and OU-001's sentinel-free, two-part and truncated forms.
  - The pre-MRS-001 baseline is the result the site produced for the same answer text before MRS-001, whether that text was supplied as a typed or untyped block; under today's `content[0].text` read, both give the same result.
- **Z-3 — Stop-reason behaviour.** Every stage-owned stop-reason rule produces identical results, including OU-001 O-2-style truncation, E.0.2b, USI-001 and E.0.2d `max_tokens` cases.
- **Z-4 — Requests.**
  - The 19 FROZEN-CONTRACT request bodies are byte-identical, at their canonical frozen signatures (§10). Every §03 request pin and key-set assertion for those sites stays green with its pinned value unchanged.
  - **Excluded:** the E.0.2d Generator and Verifier request sites (EXPLICIT-PROFILE, §10.4). Their request key sets change exactly as E.0.2d v1.2 authorizes, `{model, max_tokens, messages}` → `{model, max_tokens, thinking, messages}`, and their key-set assertions (`tests/e02dConsolidationInterpreter.test.js:37`, `tests/e02dConsolidationVerifier.test.js:39`) change accordingly.
  - No other request-site change is authorized.
- **Z-5 — No semantic change.**
  - Prompts are byte-identical, and model ids are unchanged.
  - Authorization, write, consent, persistence and eligibility behaviour are unchanged: their existing tests pass with no change other than the §16.1 fixture migration, and no expected value changes.
  - General Reasoning remains non-live.
- **Z-6 — Existing failures stay failures.** Response shapes that fail today still fail closed, with the same stage outcome. This covers an empty `content`, a missing `content`, a non-object response, and a reasoning block before the answer under reasoning OFF.
- **Z-7 — Declared, intentional tightening (behaviour change, not zero drift).** The following now fail closed where today the first block's `text` may be parsed:
  - several answer-text blocks;
  - an unsupported or unknown block type alongside answer text;
  - a refusal carrying partial text;
  - an untyped `{ text: … }` block (`MALFORMED_BLOCK`, §07.2).

  Each is pinned by a dedicated test as an intended change. Current provider responses to tool-free requests are not expected to take any of these shapes **[EXTERNAL / INFERENCE]**.
- **Z-8 — Regression and scope.** The full default regression passes. Scope purity is verified at review (§18).

## 16.1 Historical test fixtures — [CANON]

**[VERIFIED]** 209 occurrences in 48 files under `tests/` construct responses as untyped `content: [{ text: … }]` (§03). Under §07.2 these are malformed provider responses. Their omission of `type` is a **test-fixture migration issue**, not a reason to weaken the structural boundary.

**What the 48 files are:**
- 41 default-regression test files;
- 4 calibration harnesses under `tests/evals/`: `e02bCalibration`, `e02dConsolidationCalibration`, `ou001Calibration`, `usi001Calibration`;
- 3 test files of excluded browser-shell consumers (§14): `claudeProxyClient`, `coachClient`, `nutritionAnalysisService`.

The 41 test files include MRE-001's `mre001InterpreterEquivalence.test.js` and the request-pinning files of §03.

**Migration scope:** fixtures and fixture builders that stand for provider responses consumed by S1–S21, in the 41 test files and the 4 calibration harnesses. Fixtures of the excluded browser-shell consumers are **not** migrated: their consumers are outside MRS-001 (§14).

**Migration.** At implementation, these fixtures are migrated deterministically to the structurally valid shape `{ type: 'text', text: <same text> }`. The migration:
- changes only the added `type` discriminator: the semantic text is byte-identical;
- preserves every expected stage result and assertion value: no expected value changes;
- leaves untouched any fixture that deliberately represents a malformed response;
- adds no other test change.

**Verification.** A migration-equivalence check is required: every migrated fixture's answer text, and the stage result asserted on it, are unchanged. Tests that pin untyped shapes as provider responses become Z-7 tightening tests only where a malformed-response case is the intent.

**Scope of this revision.** The migration is not performed by this SPEC revision. It is part of the implementation scope (§18).

---

# 17. Mechanical Guards G1–G6

## 17.1 Guards — [CANON]

- **G1 — Inventory closure.** Every Coach Decision System model request site (every request-body construction and every injected-transport call) is either one of the 19 FROZEN-CONTRACT entries, identified by file and function, or an EXPLICIT-PROFILE site. The total count is pinned. A new unlisted site fails.
- **G2 — Frozen signature.** Each FROZEN-CONTRACT request remains exactly at its canonical signature, verified on captured request bodies:
  - key set `['max_tokens', 'messages', 'model']`;
  - the pinned model id;
  - the pinned `max_tokens`;
  - the module `TIMEOUT_MS` constant pinned statically.

  Any change fails, and can pass only by migrating the entry (M4).
- **G3 — Existing whole-body pins.**
  - The request hashes and key-set assertions listed in §03 for the 19 FROZEN-CONTRACT sites remain unchanged: same pinned values, same assertions. Their files change only by the §16.1 fixture migration, if at all.
  - **Excluded:** the E.0.2d Generator and Verifier key-set assertions (`tests/e02dConsolidationInterpreter.test.js:37`, `tests/e02dConsolidationVerifier.test.js:39`). They change exactly to `{model, max_tokens, thinking, messages}` as E.0.2d v1.2 authorizes.
  - No other request pin or key-set assertion may change.
- **G4 — Explicit-site consistency.** Every EXPLICIT-PROFILE request carries its approved provider binding consistent with §08.7, including the explicit effort value where §08.5 requires one. Response extraction for that site receives, explicitly, the same profile's reasoning mode.
- **G5 — Response-side completeness.**
  - All 21 parse sites call MRS-001, each with an explicit, resolvable contract.
  - FROZEN-CONTRACT sites name their own §10 entries, consistent with G1's file/function mapping.
  - EXPLICIT-PROFILE sites pass their profile's mode.
  - No call omits or defaults its contract.
  - No direct `content[0]` answer extraction remains in `js/coachDecisionSystem/`.
  - Every site-owning module declares the standard dependency.
  - `index.html` tags `modelResponseStructure.js` before every converted browser module.
  - `sw.js` precaches it.
- **G6 — One-way inventory.** The FROZEN-CONTRACT inventory constant is a subset of the MRS-001 v1.0 baseline (§10). An entry can only be removed, never added or restored.

## 17.2 Not mechanically detectable — [CANON]

- **Provider deprecation notices (M4 deprecation trigger):** an external event, covered by the §09.1 responsibility only.
- **Whether a revision of an owning contract requires recalibration:** a review judgement. Prompt changes are surfaced indirectly by G3 (whole-body hashes), which forces an authorized review.
- **Changes to provider behaviour for a frozen request:** not observable offline. M1 bounds the impact to fail-closed.

---

# 18. Implementation Scope — [DESIGN; implementation requires separate authorization] **[status note: IMPLEMENTED in `018b056`]**

Implemented in one atomic change together with E.0.2d v1.2 (§11.3). Listed here is MRS-001's share; E.0.2d v1.2 defines its own.

- **New production file (1):** `js/coachDecisionSystem/modelResponseStructure.js`.
- **Modified production files:**
  - **The 16 site-owning modules of §11.1.** In each:
    - one dependency declaration;
    - each answer-text read replaced by MRS-001 extraction;
    - at most a one-line comment per site.

    Nothing else in these files changes. For `consolidationInterpreter.js` and `consolidationVerifier.js`, the request-profile changes belong to E.0.2d v1.2.
  - `index.html`: one script tag, before the first converted browser module.
  - `sw.js`: one precache entry and the `VERSION` bump.
  - `js/app.js`: the `APP_VERSION` bump only.
- **New test files:**
  - a primitive unit and adversarial matrix (§19 S-M);
  - per-site equivalence and zero-drift (§19 S-E, S-P);
  - static wiring and guards G1, G2, G5, G6 (§19 S-W).

  G4 is exercised by E.0.2d v1.2's tests.
- **Modified test files:**
  - the version-pinning test files: version string only;
  - the §16.1 fixture migration in the 41 test files and 4 calibration harnesses: the `type` discriminator only, and no expected value changes;
  - for `turnUnderstandingInterpreter.js`, any test change implied by the ED-1 restructuring, limited to it.
- **Unchanged:**
  - `modelResponseEnvelope.js`; every MRE-001 test other than the §16.1 fixture `type` migration (pinned values and assertions unchanged);
  - `js/core/jsonUtils.js`, `js/adapters/claudeProxyClient.js`, `functions/**`;
  - every prompt builder, validator, Safety rule, gate, intake gate and persistence path;
  - the browser-shell files (§14);
  - every canonical document other than this SPEC and E.0.2d v1.2.

## 18.1 Implementation-discovered test-compatibility clarification — [CANON — Product/Architecture ruling during implementation]

**Finding.** §18 and G5 (§17.1) require every site-owning module to declare the standard `modelResponseStructure.js` dependency. Two existing tests outside the §18 file list assert the exact dependency set of a site-owning interpreter, written before MRS-001 existed:
- E.0.2b AC-32 (`tests/e02bSemanticContextDiscovery.test.js`): `semanticContextDiscoveryInterpreter.js` (S18);
- USI-001 AC-40 (`tests/usi001Static.test.js`): `userStatedIntakeInterpreter.js` (S19).

Those exact-dependency assertions became stale as a direct consequence of the required MRS-001 dependency. Implementation stopped and reported them for a ruling, following the E.0.2d §29.1 precedent.

**Ruling.** Product/Architecture authorized updating exactly those two assertions so that each continues to enforce an exact dependency set, now including MRS-001: `./modelResponseEnvelope.js` and `./modelResponseStructure.js` (globals `ModelResponseEnvelope` and `ModelResponseStructure`). The AC-32 test title was updated to name the same canonical dependency set.

**Scope.** Test compatibility with the approved architecture only. No acceptance criterion is weakened: both tests still assert an exact dependency set. No other assertion, expected value or test in those files changed (apart from the §16.1 fixture migration), and this clarification does not broaden §18's file-change authorization beyond these exact changes. Implemented in commit `018b056`.

## 18.2 Implementation-discovered clarification — S9 per-path contract wiring (I-1) — [CANON — Product/Architecture ruling during the implementation preflight; confirmed at closure review]

**Canonical requirement.** S9 (`safetyContextInterpreter.js`, `parseAndValidate`) is shared by two FROZEN-CONTRACT request paths, F-8 (`classifyBatch`) and F-9 (`classifyBatchWithStatus`). §11.1 requires each call to pass the entry of the request that produced its response, so every S9 response must be extracted under that path's own entry. No site may omit, default or synthesize its contract (§07.4).

**Ruling (I-1).** Product/Architecture approved the following wiring in the implementation preflight and confirmed it as canonical at the closure review:
- `_internal.parseAndValidate(raw, ids, map)` keeps its existing 3-argument signature and represents the F-8 path: it names `{ state: 'FROZEN_CONTRACT', entry: 'F-8' }` explicitly;
- `classifyBatchWithStatus` reaches the same validation body under F-9: it names `{ state: 'FROZEN_CONTRACT', entry: 'F-9' }` explicitly;
- the shared validation body is factored behind the two path-specific entry points as `parseAndValidateUnder(contract, raw, ids, map)`; the validation logic itself is unchanged.

**Why the additional S9 diff is required.** Keeping the 3-argument signature (which existing callers and the unchanged MRE-001 equivalence pins rely on, §13.2) while giving each request path its own entry needs exactly:
- the wrapper and helper function;
- the one F-9 caller-line change in `classifyBatchWithStatus`;
- one explanatory comment for this wiring, alongside the ordinary per-read MRS-001 comment.

This is the minimum structure that implements the existing §11.1 per-path contract rule. It is not scope drift. §19 acceptance criterion 5 is unchanged; this record documents the authorized implementation interpretation under which S9 meets it.

**Safety semantics unchanged (§12).** No Safety rule, validator, closed vocabulary, literal anchor or fail-closed status path changed. Deterministic evidence (commit `018b056`):
- S-P and S-E (`tests/mrs001SiteEquivalence.test.js`): the positive, negative and literal-anchor controls for both S9/F-8 (`classify`) and S9/F-9 (`classifyWithStatus`) produce results equal to the pre-MRS-001 baseline, and every structural failure class takes each path's existing failure outcome;
- G5 / I-1 (`tests/mrs001Wiring.test.js`): F-8 is named only in `parseAndValidate`, F-9 only in `classifyBatchWithStatus`, and F-10 only in `parseAndValidateCorrection`; the 3-argument signature is pinned;
- G2: the F-8, F-9 and F-10 request bodies are byte-identical to the pre-MRS-001 capture;
- MRE-001's S9 equivalence pins and the existing Safety interpreter suites are green; full regression 3810/3810.

**Scope.** This ruling applies to S9 in `safetyContextInterpreter.js` only. It authorizes no broader module restructuring, and it broadens no authorization for any other MRS-001 site, file or request.

---

# 19. Test Scope and Acceptance Criteria — [DESIGN]

- **S-M — Primitive matrix.** Every §07.3 step and §07.5 code:
  - a single typed text block;
  - REASONING then text, under OFF and under ON;
  - `redacted_thinking`;
  - two text blocks; an empty text block;
  - a non-string `text`; a non-object element;
  - an unknown type; a tool-use type;
  - empty and missing `content`; a non-object response;
  - refusal with empty content, with partial text, with and without `stop_details`;
  - every stop reason passed through unchanged.

  Plus:
  - an untyped `{ text: … }` block → `MALFORMED_BLOCK`; a non-string `type` → `MALFORMED_BLOCK`;
  - contract resolution, each → `CONTRACT_UNRESOLVED`: missing, `null` or non-object `contract`; unknown `state`; unknown inventory entry; missing or invalid `reasoning`; extra or conflicting fields;
  - `CONTRACT_UNRESOLVED` takes precedence over every response-dependent outcome, including refusal;
  - each FROZEN inventory entry resolves to OFF;
  - purity: no input mutation; same input, same output.
- **S-F — Fixture migration equivalence (§16.1).** Every migrated fixture's answer text is byte-identical, and every stage result asserted on it is unchanged. Excluded browser-shell fixtures are untouched.
- **S-E — Per-site equivalence (S1–S21).** For at least one valid and one invalid fixture per site, single-text-block results are deep-equal to the pre-MRS-001 results pinned from the baseline. Every §07.5 failure yields the site's existing failure outcome. OU-001 two-part, sentinel-free and truncated forms are equivalent.
- **S-P — Safety controls.** §12 positive and negative controls at S9–S15, including downstream context and canonical-rule matches and literal-anchor rejection.
- **S-T — Declared tightening.** Each Z-7 shape is pinned at a representative proposer site and a Safety site.
- **S-W — Static guards.** G1, G2, G5, G6, plus: no `content[0]` read in `js/coachDecisionSystem/`; the dependency declarations; `index.html` load order; the `sw.js` precache; the `sw.js` and `app.js` versions match; and `modelResponseStructure.js` contains no `require(`, `window.` read (other than its own export), `Date`, `Math.random`, `fetch`, `console` or `JSON.parse`.
- **Existing guards reused, with pinned values and assertions unchanged** (their files receive at most the §16.1 fixture migration):
  - MRE-001 W-1…W-5 and its equivalence pins;
  - OU-001 AC-2, AC-24, AC-31;
  - E.0.2b AC-7;
  - USI-001 AC-2 and AC-16 pins;
  - the full regression.

**Acceptance criteria:**
1. All of S-M, S-F, S-E, S-P, S-T and S-W pass.
2. Z-1…Z-8 are demonstrated.
3. G1–G6 are implemented and green.
4. The full regression passes.
5. Scope purity holds:
   - the diff touches only §18 files and E.0.2d v1.2's own files;
   - each converted module's diff is limited to its dependency line, its answer-text reads, and at most one comment per site.
6. Nothing is staged, committed or pushed without separate authorization.

No real-model calibration is an acceptance criterion of MRS-001. Real-model work belongs to E.0.2d's calibration, under its own approval.

---

# 20. Failure Handling — [CANON]

- **Contained:** every structural failure is contained at its site, and produces that site's existing fail-closed outcome (§07.4).
- **No new channels:** MRS-001 introduces no new failure status, user-visible message, retry or fallback.
- **E.0.2d:** E.0.2d v1.2 may distinguish structural failure and refusal in its own failure taxonomy and evidence (§13.3).
- **Unresolved request contract [CANON]:** a missing, unknown or malformed `contract` is never given a default. Extraction fails closed with `CONTRACT_UNRESOLVED` (§07.3 step 1), and the site produces its existing fail-closed outcome. G5 makes this unreachable from converted sites.

---

# 21. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Architecture Decision Pending.** None.

- **AD-1 — Treatment of content blocks without a `type` field: RESOLVED [CANON].**
  - The decision: a block without an explicit structural `type` is never inferred to be ANSWER_TEXT. An untyped `{ text: … }` block is MALFORMED at the provider-response boundary (§07.2, §07.3 step 4).
  - Zero drift applies to structurally valid current-provider responses (§16). The historical untyped fixtures are migrated, preserving their text and expected behaviour (§16.1).
  - The FITME-internal Turn Understanding object is downstream of the boundary and does not cross it (§11.2).

**Engineering Decision Pending.** None. **[Status note: ED-1 was resolved by the committed implementation.]**

- **ED-1 — Turn Understanding S1 wiring. RESOLVED in commit `018b056`.**
  - Repository evidence (§11.2, at the §03 snapshot): S1 then received both the provider response and the FITME-internal closed-segment object through one parameter, so an internal object crossed S1 as though it were a provider response.
  - What was delegated to Engineering by §11.2: how to restructure that wiring so that extraction applies once to the provider response and no internal object is passed to `extractAnswerText`.
  - The constraints: §11.2, Z-2, and OU-001's unchanged split, sentinel, one-way failure and truncation rules.
  - **Resolution (as implemented).** `splitResponse` extracts the answer text once (S2, under F-1) and passes the closed segment on as text (`closedText`); the closed-segment validation runs over that text; `parseAndValidate` remains S1 (extraction under F-1) for direct callers. No FITME-internal object is passed to `extractAnswerText`. S1/S2 results for the sentinel-free, two-part and truncated forms are equal to the pre-MRS-001 baseline (§19 S-E). No canonical rule was added or changed.

**Repository Gaps.**

- **GAP-1 —** `WP0_SPEC_v1.0.md` (owner of S17 / F-17) is missing (MRE-001 GAP-2). Not reconstructed.
- **GAP-2 —** Friends Alpha Item 6 (second owner of S10 / F-10) has no SPEC (MRE-001 GAP-3). Not reconstructed.
- **GAP-3 —** Browser-shell model-response and request-profile migration (§14) has no SPEC. Recorded follow-up; owner: Product/Architecture.

**Product Decision Pending.** None.

**Canonical Conflicts.** None.

---

# 22. Status and Closure

- Status: **CLOSED — IMPLEMENTED / DETERMINISTICALLY VERIFIED — DEPLOYED AND ACTIVE AT THE DEPLOYED BROWSER SITES; Product/Architecture final closure approved** (SPEC v1.0 — Product Review: APPROVED. Architecture Review: APPROVED.) (MRS-001 closure commit).
  - **Implemented** jointly with E.0.2d v1.2 in one atomic change, commit `018b05644aa62ac2faf96bd47ff2b9c4a0a738f2` (§11.3). The implementation authorization (§18) is fulfilled.
  - **Deterministically verified:** full deterministic regression 3810/3810; acceptance criteria 1–6 of §19 met, including S-M, S-F, S-E, S-P, S-T, S-W and G1–G6; the 19 FROZEN-CONTRACT request bodies byte-identical (Z-4); no model/API call. Scope purity includes the §18.1 and §18.2 clarifications.
  - **Deployed and active at the deployed browser sites:** application version 2.47.9 is deployed, and the deployed browser application loads `modelResponseStructure.js` ahead of the converted browser site modules. This is deployment evidence; it is not a claim that every converted path has been exercised by a real user. MRS-001's deployment does not make E.0.2d live: its two sites (S20, S21) are Node-only with no production caller (E.0.2d §08, §35).
  - **Closed:** closure is a Product/Architecture lifecycle determination, made at the final closure review. Every §19 acceptance criterion is satisfied, and real-model calibration is not an MRS-001 acceptance criterion (§19).
- **What CLOSED means — and does not mean [CANON].**
  - MRS-001 is closed as a Work Item: its boundary, request-contract states and guards are implemented, verified and canonical.
  - CLOSED does not mean all future migration work is complete. The target-state invariant (§06.1) is not yet reached: the FROZEN-CONTRACT inventory still holds 19 entries, and migration rules M1–M6 (§09), the deprecation responsibility (§09.1), the prohibitions of §06.4 and the guards G1–G6 (§17) remain standing canonical rules.
  - CLOSED does not close GAP-1, GAP-2 or GAP-3 (§21), the MRE-001 §20 Safety fail-open defect (§12) or the MRE-001 §21 observability follow-up (§07.7). They remain open, non-blocking follow-ups (Closure Record).
  - CLOSED does not make E.0.2d closed or live, and it does not authorize E.0.2d real-model calibration. E.0.2d remains IMPLEMENTED — DETERMINISTICALLY VERIFIED — REAL-MODEL CALIBRATION PENDING (PAUSED) — NOT CLOSED — NOT LIVE under its own lifecycle (E.0.2d §35); its calibration remains PAUSED pending explicit Product approval of a run (E.0.2d §31.4).
- **[HISTORICAL — pre-closure]** The previous status read: IMPLEMENTED — DETERMINISTICALLY VERIFIED — DEPLOYED AND ACTIVE AT THE DEPLOYED BROWSER SITES — NOT CLOSED; final closure then required a separate Product/Architecture closure determination, and the Closure Record was empty until then.
- **[HISTORICAL — pre-implementation]** The previous status read: ready for joint atomic implementation with E.0.2d v1.2 upon the final joint consistency check — NOT IMPLEMENTED — NOT LIVE.
- E.0.2d v1.2, the immediate downstream consumer, completed joint Product/Architecture review with this SPEC and is implemented in the same commit.
- **[HISTORICAL — pre-closure]** Next step was: the Product/Architecture closure determination of this SPEC. Done: final closure approved.
- **[HISTORICAL — pre-implementation]** Next step was: the joint atomic implementation of this SPEC and E.0.2d v1.2, under separate Product/Architecture implementation authorization (§11.3, §18).
- Real-model calibration of E.0.2d: this SPEC and E.0.2d v1.2 are implemented and deterministically verified, which satisfies the E.0.2d §31.4 precondition. E.0.2d real-model calibration remains PAUSED pending explicit Product approval of a run (E.0.2d §31.4).
- **Status history.**
  - 2026-10-06 — status metadata only (implementation status reconciliation, commit `a159938a931dff5c960091b0e549e5549da1eba0`): implemented in `018b056`; deterministically verified 3810/3810; ED-1 resolved; §18.1 compatibility clarification recorded; deployed and active at the deployed browser sites; NOT CLOSED; C-18 status updated. No normative Product/Architecture semantic change.
  - 2026-10-06 — final closure (MRS-001 closure commit): §18.2 (I-1 S9 per-path contract wiring) recorded; Product/Architecture final closure approved; status CLOSED; Closure Record filled. No normative architecture requirement, contract or acceptance criterion changed.

## Closure Record

- **Decision:** Product/Architecture final closure approved after the final closure review and re-check: every §19 acceptance criterion is satisfied and no closure blocker remains. Recorded in the MRS-001 closure commit.
- **Implementation:**
  - §18 implemented atomically with E.0.2d v1.2 in commit `018b05644aa62ac2faf96bd47ff2b9c4a0a738f2` (§11.3).
  - All 21 parse sites S1–S21 converted to MRS-001 extraction in that one change: the 19 FROZEN-CONTRACT entries name their own §10 entries, and S20/S21 pass their EXPLICIT-PROFILE reasoning mode (G5).
  - The shared structural primitive `js/coachDecisionSystem/modelResponseStructure.js` is implemented, with the frozen inventory constant and the closed §07.5 failure vocabulary.
  - Browser wiring: `index.html` loads `modelResponseStructure.js` ahead of every converted browser module; `sw.js` precaches it; `sw.js` `VERSION` and `js/app.js` `APP_VERSION` are 2.47.9.
  - ED-1 resolved (§11.2, §21). The AC-32 / AC-40 test-compatibility clarification is recorded in §18.1, and the I-1 S9 per-path contract wiring in §18.2.
  - Lifecycle reconciliation recorded in commit `a159938a931dff5c960091b0e549e5549da1eba0`.
- **Deterministic evidence:**
  - S-M, S-F, S-E, S-P, S-T and S-W green (`tests/mrs001ModelResponseStructure.test.js`, `tests/mrs001SiteEquivalence.test.js`, `tests/mrs001Wiring.test.js`; S-F by the fixture-migration equivalence check over the 45 migrated files).
  - Z-1 … Z-8 demonstrated; G1 … G6 green (G4 through the E.0.2d v1.2 suites).
  - The 19 FROZEN-CONTRACT request bodies are byte-identical to the pre-MRS-001 capture.
  - The existing relevant pins are preserved: MRE-001 W-1 … W-5 and its equivalence pins, OU-001 AC-2/AC-24/AC-31, E.0.2b AC-7, and the USI-001 AC-2/AC-16 pins.
  - Full deterministic regression 3810/3810.
  - No model/API call was made or required for MRS-001 implementation, verification or closure.
- **Real-model confirmation:** real-model calibration is not an MRS-001 acceptance criterion (§19), and no real-model run is required for this closure. E.0.2d real-model calibration remains governed by E.0.2d (§31.4) and remains PAUSED.
- **Deployment:** application version 2.47.9 is deployed, and the deployed browser application loads MRS-001 ahead of the converted deployed browser sites. This deployment evidence is not a claim that every converted path has been exercised by a real user. E.0.2d remains NOT LIVE.
- **Non-blocking follow-ups (open; not MRS-001 closure blockers):**
  - GAP-1 — `WP0_SPEC_v1.0.md` (owner of S17 / F-17) is missing (§21). No owner is assigned by this SPEC (§10.3).
  - GAP-2 — Friends Alpha Item 6 (second owner of S10 / F-10) has no SPEC (§21). No owner is assigned by this SPEC (§10.3).
  - GAP-3 — browser-shell model-response and request-profile migration (§14, §21); owner: Product/Architecture.
  - MRE-001 §20 Safety fail-open defect (§12) — remains open under its existing owner as recorded in MRE-001.
  - MRE-001 §21 observability (§07.7) — remains open under its existing owner as recorded in MRE-001.
  - Standing FROZEN-CONTRACT responsibilities: migration to EXPLICIT-PROFILE under M1–M6 (§09), toward the target-state invariant (§06.1); provider deprecation tracking by Model Runtime / Architecture maintenance (§09.1). Migrating F-10 or F-17 first requires its canonical ownership to be established (§10.3).
