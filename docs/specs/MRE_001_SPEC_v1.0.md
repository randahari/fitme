# MRE-001 SPEC v1.0 — Model Response Envelope (Fenced-JSON Transport Defect)
## Status: CLOSED — IMPLEMENTED / VERIFIED; Product/Architecture final closure approved (combined OU-001 + MRE-001 closure commit)

**Repository path:** `docs/specs/MRE_001_SPEC_v1.0.md`

**Document role:** Defect SPEC and cross-cutting amendment. Defines one shared, pure, deterministic transport-envelope normalizer for model responses whose complete structured-JSON payload is wrapped in exactly one Markdown code fence, and its atomic activation at every applicable model-output JSON parsing site in the Coach Decision System. Amends, by one cross-cutting clause (§10), the parsing input of every owning contract listed in §05, including OU-001.

**Evidence labels:** **[VERIFIED]** repository evidence at the baseline; **[EXPERIMENT]** direct-API experimental evidence (synthetic data, operator credential, never the production proxy); **[CANON]** Product/Architecture decision; **[DESIGN]** contract proposed for approval; **[INFERENCE]** engineering inference; **[GAP]** missing evidence.

---

# 01. Identity, Status, and Authority

- Deliverable: **MRE-001 — Model Response Envelope (fenced-JSON transport defect).**
- Status: **CLOSED** — implemented, verified, and approved for closure by Product/Architecture (combined OU-001 + MRE-001 closure commit). Authoring this document modified no file under `js/**`, `tests/**`, `functions/**`, `index.html`, or `sw.js`; the files it authorizes for modification upon implementation approval are listed exhaustively in §15.
- Repository baseline: `main` @ `21f15de09246c6fb8c980f3715242db06cbc297d`, with the implementation-complete, uncommitted, closure-blocked OU-001 changes present in the working tree **[VERIFIED]**. Line numbers for `turnUnderstandingInterpreter.js` refer to that working tree.
- Authority: the Product/Architecture decision selecting Option A (shared narrow deterministic envelope normalizer), its approved normalization contract, atomicity requirement, Safety constraints, OU-001 treatment, and the Structured Outputs decision record **[CANON]**. Marking this SPEC READY is a Product/Architecture determination.

---

# 02. Verified Problem Statement

1. **The model wraps structured JSON in a Markdown fence [EXPERIMENT].** With the exact baseline request bodies, `claude-haiku-4-5-20251001` returned its JSON wrapped as ` ```json\n{…}\n``` ` in every observed response: 69/69 calibration calls (46 baseline Turn Understanding, 23 OU), 2/2 raw diagnostic samples, and 6/6 plain calls in the Structured Outputs investigation. Every prompt already instructs `Respond with STRICT JSON only, no other text` **[VERIFIED]**; the model does not comply.
2. **Every applicable parser fails on it [VERIFIED].** Each site in §04 calls `JSON.parse(text)` on the entire response text; a leading ` ``` ` makes `JSON.parse` throw, and each site fails closed by its own existing contract (FAILED / empty / null).
3. **No layer strips fences [VERIFIED].** `ClaudeProxyClient.send()` returns the response body unchanged; `anthropicProxy` (`functions/index.js`) forwards `req.body` (only `max_tokens` capped at 2,000) and returns `res.status(...).json(data)` unchanged; each interpreter reads `content[0].text`.
4. **Production impact [INFERENCE].** Live coach turns are very likely failing closed in every bounded interpreter (no Need recognized, silence or acknowledgment only). Not directly observed: no telemetry records parse failures (§21).

---

# 03. Repository Evidence

- Existing permissive parser `js/core/jsonUtils.js` `parseModelJSON()` (C1-WP1) strips fences anywhere, extracts the substring from the first `{`/`[` to the last matching bracket, and tolerates prose **[VERIFIED]**. It is used by nutrition and `app.js` paths and is **out of scope**: never reused, never modified.
- No strict envelope primitive exists **[VERIFIED]**.
- Coach Decision System modules resolve dependencies at module load with the pattern ``(typeof module !== 'undefined' && module.exports) ? require('./x.js') : window.X`` **[VERIFIED]**; `tests/coachDecisionSystemWiring.test.js` ("REPAIR: every js/coachDecisionSystem/*.js module …") enforces that every such dependency is script-tagged in `index.html` before its dependent **[VERIFIED]**.
- `sw.js` serves cache-first (`caches.match(req)`), with cache name `'fitme-' + VERSION` and old caches deleted on activate; `VERSION = 'v2.47.5'` in `sw.js` and `APP_VERSION = '2.47.5'` in `js/app.js` **[VERIFIED]**. Precedent `aa485c9` (browser dependency-loading repair) added a script tag, a precache entry, and bumped both versions, updating the version-pinning wiring tests **[VERIFIED]**.
- 18 test files pin the version string `2.47.5` **[VERIFIED]**: `b2Wiring, c1Wp10Wiring, c1Wp1Wiring, c1Wp2Wiring, c1Wp3Wiring, c1Wp4Wiring, c1Wp5aWiring, c1Wp5bWiring, c1Wp5cWiring, c1Wp5dWiring, c1Wp5eWiring, c1Wp5fWiring, c1Wp6Wiring, c1Wp7Wiring, c1Wp8Wiring, c1Wp9Wiring, c2Wiring, ccc001Wiring` (`tests/*.test.js`).
- Tests reading `sw.js` assert presence of specific entries only (no exhaustive list) **[VERIFIED]**.
- No existing test pins the text of any `JSON.parse` call site **[VERIFIED]**.

---

# 04. Affected Production Parsing Sites (exhaustive)

Every site reads `rawResponse.content[0].text` and currently calls `JSON.parse(text)` **[VERIFIED]**. The only other `JSON.parse` in `js/coachDecisionSystem/` — `capabilityRegistry.js:222` — is a deep clone of registration data, not model output, and is **excluded**.

| # | File : line | Function | Owning contract | Live | Safety |
|---|---|---|---|---|---|
| S1 | `turnUnderstandingInterpreter.js:274` | `parseAndValidate` (closed) | DUC-001 (+OU-001) | Live | Indirect |
| S2 | `turnUnderstandingInterpreter.js:439` | `validateOpenUnderstanding` (open) | OU-001 | Live on OU commit | None |
| S3 | `explicitPreferenceStatementInterpreter.js:148` | `parseAndValidate` | CPI-001 | Live | None |
| S4 | `explicitRequestInterpreter.js:193` | `parseAndValidate` | EUR-001 | Live | Low |
| S5 | `readinessStateInterpreter.js:141` | `parseAndValidate` | TRR-001 | Live | Indirect |
| S6 | `activityPreferenceInterpreter.js:131` | `parseAndValidate` | TRR-001 | Live | Advisory |
| S7 | `activityOppositionInterpreter.js:126` | `parseAndValidate` | TRR-001 | Live | Low |
| S8 | `situationalContextInterpreter.js:131` | `parseAndValidate` | CSSC-001 | Live (conditional) | None |
| S9 | `safetyContextInterpreter.js:192` | `parseAndValidate` (via `classify`, `classifyWithStatus`) | USC-001 (+CPI-001, Item 6) | Live | **Safety** |
| S10 | `safetyContextInterpreter.js:441` | `parseAndValidateCorrection` | USC-001 / Item 6 (no SPEC) | Live | **Safety** |
| S11 | `userSafetyProvenanceInterpreter.js:175` | `parseAndValidate` | USP-001 | Live | **Safety** |
| S12 | `riskCharacteristicInterpreter.js:154` | `parseCandidateContentResponse` | WP0 Safety Sub-Spec D.6 | Live | **Safety** |
| S13 | `riskCharacteristicInterpreter.js:247` | `parseDurableConstraintResponse` | WP0 Safety Sub-Spec D.5 | Live | **Safety** |
| S14 | `riskCharacteristicInterpreter.js:334` | `parseCorrectionResponse` | WP0 Safety Sub-Spec D.5 | Live | **Safety** |
| S15 | `riskCharacteristicInterpreter.js:424` | `parseCandidateConflictResponse` | WP0 Safety Sub-Spec D.6.1 | Live | **Safety** |
| S16 | `trainingReadinessReasoningComponent.js:124` | `parseProposal` | TRR-001 / CARF | Live when TRR-routed | Proposer |
| S17 | `generalReasoningCapability.js:226` | `parseProposal` | WP0 Phase C (spec file missing) | **Non-live** | Proposer |

All 17 sites are included in the atomic activation (§08). S17 is non-live and included so that no model-output parser in the Coach Decision System keeps a divergent transport contract.

---

# 05. Owning Canonical Contracts

DUC-001 (as amended by the DUC-001 OU-001 amendment); OU-001; CPI-001; EUR-001; TRR-001; CSSC-001; USC-001; USP-001; `WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md`; the missing `WP0_SPEC_v1.0.md` (General Reasoning; not reconstructed); Friends Alpha Item 6 (no SPEC in the repository). Each is amended only by the single cross-cutting clause in §10; none is edited file-by-file, and no semantic, validation, Safety, or product decision in any of them is reopened.

---

# 06. Shared Primitive Contract — [CANON placement/API; DESIGN detail]

**Module:** `js/coachDecisionSystem/modelResponseEnvelope.js` — one new file, single owner.

**API:** `ModelResponseEnvelope.unwrapSingleJsonFence(text) -> string`

**Properties (binding):**
- Pure and deterministic: output depends only on `text`; no I/O, no state, no clock, no configuration, no logging.
- Domain-agnostic transport normalization only: it knows nothing about schemas, interpreters, fields, Safety, or meaning.
- Never throws.
- Non-string input is returned unchanged (identity).
- Returns either the original input unchanged (every non-accepted input) or the accepted inner payload (§07).
- Grants no validity, authority, or trust: its output is ordinary untrusted text that must still pass the unchanged exact `JSON.parse` and the unchanged interpreter validator.

**Module shape:** mirrors every existing Coach Decision System module: an IIFE exporting `API = { unwrapSingleJsonFence: … }` as `window.ModelResponseEnvelope` in the browser and `module.exports` in Node. It has no dependencies.

**Forbidden:** JSON substring extraction; prose tolerance; multiple-block extraction; nested-fence recovery; JSON, quote, comma, key, schema, or semantic repair; guessing intent; any reuse of or change to `JsonUtils.parseModelJSON`.

---

# 07. Exact Accepted Envelope Grammar — [DESIGN, implementing the approved contract]

Definitions: `WS` = the characters U+0020 space, U+0009 tab, U+000D CR, U+000A LF. `HWS` = space or tab. `FENCE` = exactly three U+0060 backticks.

**Algorithm (the input is accepted only if every step succeeds; any failure ⇒ return the input unchanged):**
1. `text` is a string.
2. Let `core` = `text` with leading and trailing `WS` removed (only those four characters; no other character, including U+FEFF, is treated as whitespace).
3. **Opener.** `core` starts with `FENCE`, and the character immediately after it is not a backtick (rejects 4+ backtick fences).
4. **Opener line.** Let `nl1` = index of the first LF in `core`; if none, reject. The opener line is `core[3 .. nl1)`, with one trailing CR removed if present. It must match, entirely, *empty* or `json` in any letter case, immediately after the fence, followed by optional `HWS`: `^(json)?[ \t]*$` case-insensitive. (Rejects any other language marker, a space before the marker, or content on the opener line — including a payload on the same line.)
5. **Closer.** `core` ends with `FENCE`, and the character immediately before that final `FENCE` is not a backtick (rejects 4+ backtick closers).
6. **Closer line.** Let `nl2` = index of the last LF in `core`. `nl2 > nl1` (the closer is on its own later line), and `core[nl2+1 ..]` matches `^[ \t]*` + `FENCE` + `$`.
7. **Inner payload.** `inner` = `core[nl1+1 .. nl2)`, with exactly one trailing CR removed if present (the CR of a CRLF line terminator). Nothing else is removed or altered: the payload's own internal bytes, whitespace, and line endings are preserved byte-for-byte.
8. `inner` does not contain `FENCE` anywhere (rejects multiple blocks and nested fences).
9. `inner` contains at least one non-`WS` character (rejects empty or whitespace-only payloads).
10. Return `inner`.

**Accepted examples:** ` ```json\n{"a":1}\n``` `; ` ```JSON\n…\n``` `; ` ```Json\n…\n``` `; ` ```\n…\n``` `; CRLF throughout; surrounding spaces/newlines; `json` followed by trailing spaces on the opener line; an indented closing fence.

---

# 08. Rejected-Envelope Behavior and Atomic Activation

**Rejected inputs** return the input unchanged, so the existing `JSON.parse` and existing failure behavior of each site remain authoritative. This includes: prose before the fence; prose after the fence; two fenced blocks; nested fences; four-backtick fences (opener or closer); tilde fences; any non-`json` language marker (e.g. `js`, `javascript`, `jsonc`); a space between the fence and the marker; no newline after the opener (payload on the opener line); payload on the closer line; a truncated closing fence (` `` ` or missing); an empty or whitespace-only payload; a leading U+FEFF.

**Activation (each of S1–S17, exactly):** the argument of the site's existing `JSON.parse` call is wrapped:

`JSON.parse(ModelResponseEnvelope.unwrapSingleJsonFence(<existing argument>))`

No other line of any parse function changes: text extraction, `try/catch`, every validation rule, return shapes, and fail-closed behavior are unchanged.

**Atomicity (binding) [CANON]:** S1–S17 switch in one implementation change. A state in which any proposer-side site (S1–S8, S16, S17) tolerates the envelope while any Safety-side site (S9–S15) does not is forbidden, in any commit, branch, or deployment. The static wiring test (§16, W-1) fails if any single site is not converted, making partial activation non-mergeable.

---

# 09. Safety Invariants and Authority Invariants — [CANON]

**Safety.** This Work Item changes only transport-envelope handling. Unchanged: Safety rules (CSR-001 canonical rules, `matchCanonicalSafetyRules`, `finalReview`, `disqualify`); Safety authority; every Safety validator and closed vocabulary; literal-anchor checks (`isLiteralSubstringOf` in `safetyContextInterpreter.js`, `preferenceIntakeGate.js`, `riskCharacteristicIntakeGate.js`, `riskCharacteristicInterpreter.js`); risk semantics; every fail-closed status path. A fenced Safety response containing an otherwise valid payload yields a result exactly deep-equal to the same plain-JSON payload. A rejected envelope receives no new tolerance.

**Authority.** The envelope grants no semantic validity, consent, authorization, persistence right, Safety standing, or truth. E.0.2a eligibility and authorization, consent reads, intake gates, and persistence paths are unchanged. General Reasoning remains non-live (`GeneralReasoningActivationGate` default `false`; the orchestrator still never references `GeneralReasoningCapability`).

---

# 10. Cross-Cutting Amendment Clause — [DESIGN]

For every contract in §05, the following clause is added and governs from approval:

> **Model-response transport envelope (MRE-001).** Wherever this contract specifies that a model response's text is parsed as JSON, the text parsed is `ModelResponseEnvelope.unwrapSingleJsonFence(text)` (MRE-001 §06–§07). This accepts only a response consisting entirely of one triple-backtick fence with an empty or `json` marker, and returns every other input unchanged. Every validation rule, closed vocabulary, literal anchor, failure status, and fail-closed behavior of this contract is unchanged; a response that failed validation before MRE-001 for any reason other than that single surrounding fence fails identically after it.

---

# 11. Explicit Non-Goals

- Anthropic Structured Outputs, `output_config`, schemas, prefill, or any request-body change.
- Any prompt text change (including the existing `STRICT JSON` instructions).
- Any change to `js/core/jsonUtils.js`, `parseModelJSON`, nutrition, `app.js` model paths, `functions/**`, or `ClaudeProxyClient`.
- Any validator, vocabulary, Safety rule, literal anchor, gate, consent, authorization, persistence, or E.0.2a change.
- The Safety malformed-output / unavailable-state fail-open defect (§20) — recorded, not solved here.
- Parse-failure observability or telemetry (§21) — recorded, not solved here.
- Any OU-001 redesign, including a combined-object representation.
- Retries, repair, or any other response-recovery mechanism.

---

# 12. OU-001 Integration — [CANON treatment; amends OU-001 §08/§22 via §10]

1. `splitResponse()` is unchanged: the response is split at the existing sentinel `@@OPEN_UNDERSTANDING@@` exactly as OU-001 §08 specifies, before any envelope handling.
2. The envelope is applied independently to each part through the two converted sites: the closed part via S1 (inside the unchanged-otherwise `parseAndValidate()`), and the open part via S2 (inside `validateOpenUnderstanding()`). Observed real form: ` ```json\n{closed}\n```\n\n@@OPEN_UNDERSTANDING@@\n```json\n{open}\n``` ` — each part is then exactly one fenced block with surrounding whitespace and is accepted.
3. OU-001's one-way failure rules, `stop_reason: 'max_tokens'` rule, and closed-first truncation isolation are unchanged. A truncation after the sentinel still cannot affect the closed part. A truncated open fence is a rejected envelope, so the open part is `null`.
4. **OU-001 AC-2 pinned-fixture amendment:** the pinned baseline entry `"code-fenced"` (a single ` ```json\n…\n``` ` closed response) changes from `FAILED` to the `CLASSIFIED` result of its inner payload — the only pinned value MRE-001 authorizes changing in OU-001's tests. All other pinned values are unchanged.
5. **OU-001 AC-CAL baseline amendment:** the OU-001 calibration baseline becomes baseline commit `21f15de` **plus the MRE-001 envelope**. The calibration script applies `unwrapSingleJsonFence` to the baseline interpreter's received `content[0].text` in its baseline-only transport wrapper (baseline source untouched), while the current path uses the implemented sites. The comparison then measures OU prompt and semantic drift, not the known transport defect. No other OU-001 calibration rule changes.
6. OU-001 remains implementation-complete and closure-blocked until MRE-001 is implemented and verified and the OU-001 calibration is rerun.

---

# 13. Browser Load-Order and Dependency Requirements — [DESIGN]

1. Each converted module obtains the primitive with the repository's standard pattern: `var ModelResponseEnvelope = (typeof module !== 'undefined' && module.exports) ? require('./modelResponseEnvelope.js') : window.ModelResponseEnvelope;`. The existing wiring test "REPAIR: every js/coachDecisionSystem/*.js module …" then enforces order automatically.
2. `index.html`: exactly one new `<script src="js/coachDecisionSystem/modelResponseEnvelope.js"></script>`, placed before the first converted module's tag (currently `situationalContextInterpreter.js`, line 660). Recommended placement: immediately before line 660.
3. `sw.js`: one new precache entry `'/fitme/js/coachDecisionSystem/modelResponseEnvelope.js'`, plus the version bump below.
4. **Version bump (cache-first service worker):** `sw.js` `VERSION` `'v2.47.5'` → `'v2.47.6'`, and `js/app.js` `APP_VERSION` `'2.47.5'` → `'2.47.6'`, so clients receive the new module and all converted modules, per the `aa485c9` precedent. The 18 version-pinning test files (§03) change only their pinned version string.

---

# 14. Zero-Drift Requirements — [DESIGN]

Required proof that, apart from accepting the exact envelope:

1. Identity: every non-accepted input is returned unchanged (strict `===`), including every plain JSON response used anywhere in the existing test suite.
2. Prompts: every prompt builder produces byte-identical text.
3. Request bodies, model ids, `max_tokens`, and timeouts are byte-identical.
4. Model-call counts per `DIRECT_TURN_PASS` are unchanged (OU-001 AC-24 pinned counts stay green).
5. TRR: the pinned TRR request-body sha256 `af3763893eee88d13f7b1256de297b3d942e45ae4d80d7cdf5efc50fa6c8fdd5` is unchanged (OU-001 AC-31 stays green).
6. Validators, closed vocabularies, and Safety rules are unchanged: the diff of each converted file consists only of the dependency declaration and the wrapped `JSON.parse` argument(s).
7. Authority, consent, persistence, and E.0.2a behavior are unchanged: their existing tests pass unmodified.
8. General Reasoning remains non-live.
9. OU-001's semantic architecture is unchanged.
10. `js/core/jsonUtils.js` is byte-unchanged.

---

# 15. Exact Implementation Scope — [DESIGN]

**New production file (1):** `js/coachDecisionSystem/modelResponseEnvelope.js`.

**Modified production files (15):**
- The 12 site-owning modules — `turnUnderstandingInterpreter.js`, `explicitPreferenceStatementInterpreter.js`, `explicitRequestInterpreter.js`, `readinessStateInterpreter.js`, `activityPreferenceInterpreter.js`, `activityOppositionInterpreter.js`, `situationalContextInterpreter.js`, `safetyContextInterpreter.js`, `userSafetyProvenanceInterpreter.js`, `riskCharacteristicInterpreter.js`, `trainingReadinessReasoningComponent.js`, `generalReasoningCapability.js`. In each: one dependency declaration, the wrapped `JSON.parse` argument(s) at the §04 site(s), and at most a one-line comment per site referencing MRE-001.
- `index.html` (one script tag).
- `sw.js` (one precache entry and the `VERSION` bump).
- `js/app.js` (the `APP_VERSION` bump only).

**New test files (3):**
- `tests/mre001ModelResponseEnvelope.test.js`: primitive unit and adversarial matrix (§17).
- `tests/mre001InterpreterEquivalence.test.js`: per-site fenced/plain equivalence, rejection preservation, Safety positive controls (§16).
- `tests/mre001Wiring.test.js`: static atomicity, dependency, load-order, service-worker, and scope checks (§16).

**Modified test files:**
- The 18 version-pinning files listed in §03: the version string only.
- `tests/ou001OpenUnderstanding.test.js`: the single `"code-fenced"` pinned entry (§12.4), plus new fenced two-part cases for OU (§16, O-1 … O-3).
- `tests/evals/ou001Calibration.eval.js`: the baseline-only envelope wrapper (§12.5).

**Unchanged:** every other file, including `js/core/jsonUtils.js`, `functions/**`, `js/adapters/claudeProxyClient.js`, `memoryLayer.js`, `safetyLayer.js`, every intake gate, `capabilityRegistry.js`, `contextComposer.js`, `contextRelevancePlanner.js`, `eligibilityPolicy.js`, `trrCapabilityAdapter.js`, the orchestrator, the Need Creator, and all three OU-001 canonical documents (amended only through §10/§12 here).

---

# 16. Test Scope — [DESIGN]

**Primitive (M):** the full §17 matrix; identity for non-strings and every rejected input; the returned inner payload byte-for-byte (including CRLF payloads); purity (same input ⇒ same output; the input is never mutated).

**Per-site equivalence (E), for each of S1–S17 through its exported `_internal` parse function:**
- E-1: for at least one valid fixture per site (Safety sites: at least one positive and one negative classification each), the ` ```json `, ` ```JSON `, bare ` ``` ` and CRLF fenced forms produce results deep-equal to the plain-JSON form.
- E-2: for every rejected envelope form in §17, the result is deep-equal to the site's result on that exact input before MRE-001 (the existing failure: FAILED, empty, or `null`). Where a pre-MRE-001 result is needed, it is pinned from the baseline code before implementation.
- E-3: a malformed inner payload inside a valid envelope fails exactly as the same malformed plain text.
- E-4: valid JSON with the wrong schema inside a valid envelope fails exactly as the same plain JSON.
- E-5: the real observed response form (a pretty-printed ` ```json ` block) is used verbatim as one fixture for S1.

**Safety positive controls (P):**
- P-1: plain valid restriction output (S9) and provenance output (S11) populate `userSafetyContext` and `userSafetyProvenance` through `MemoryLayer.assembleContext()`, and a RUNNING Candidate matches the canonical Safety rule.
- P-2: the exact fenced equivalents of the same responses produce deep-equal `userSafetyContext`/`userSafetyProvenance`, and a deep-equal canonical rule match.
- P-3: a rejected envelope of the same payload produces exactly the pre-MRE-001 result (no new tolerance).
- P-4: fenced forms of S12–S15 outputs produce deep-equal classifications and deep-equal downstream `riskCharacteristicTags`/correction/conflict results.
- P-5: literal-anchor rejection is unchanged under a fenced envelope — a fenced `restrictedActivityText` or `anchorText` that is not a literal substring of its source text is still dropped.

**OU (O):**
- O-1: the observed two-part fenced form yields the same `{turnUnderstanding, openUnderstanding}` as the unfenced two-part form.
- O-2: fenced closed part plus truncated fenced open part with `stop_reason: 'max_tokens'` ⇒ closed valid and unchanged, open `null`.
- O-3: a fenced closed part followed by prose, or two closed fences, ⇒ `FAILED`, open `null`.

**Static wiring (W):**
- W-1 (atomicity): for each of the 12 files, the number of `JSON.parse(` occurrences equals the number of `JSON.parse(ModelResponseEnvelope.unwrapSingleJsonFence(` occurrences, and the total across the 12 files equals 17.
- W-2: no file under `js/coachDecisionSystem/` references `JsonUtils` or `parseModelJSON`.
- W-3: `index.html` tags `modelResponseEnvelope.js` before every converted module (the existing REPAIR test also enforces this).
- W-4: `sw.js` contains the new precache entry; the `sw.js` and `app.js` versions match.
- W-5: `modelResponseEnvelope.js` contains no `require(`, `window.` read (other than its own export assignment), `Date`, `Math.random`, `fetch`, `console`, or `JSON.parse`.

**Existing zero-drift guards reused unmodified:** OU-001 AC-24 (call counts), AC-31 (TRR body hash), AC-2 (except the single authorized entry), and the full regression.

---

# 17. Adversarial Acceptance / Rejection Matrix — [DESIGN]

`P` = a valid payload for the site, e.g. `{"results":[…]}`. `→ P` = accepted, returns `P` byte-for-byte. `→ input` = rejected, returns the input unchanged.

| # | Input | Result |
|---|---|---|
| 1 | `P` (plain JSON) | → input (identity; parses as today) |
| 2 | ` ```json\nP\n``` ` | → P |
| 3 | ` ```JSON\nP\n``` ` | → P |
| 4 | ` ```Json\nP\n``` ` (mixed case) | → P |
| 5 | ` ```\nP\n``` ` (no language) | → P |
| 6 | ` ```json\r\nP\r\n``` ` (CRLF) | → P |
| 7 | `  \n ```json\nP\n```  \n ` (surrounding whitespace) | → P |
| 8 | ` ```json   \nP\n``` ` (trailing spaces after marker) | → P |
| 9 | ` ```json\nP\n  ``` ` (indented closer) | → P |
| 10 | `Here you go:\n```json\nP\n``` ` (prose before) | → input |
| 11 | ` ```json\nP\n```\nHope this helps ` (prose after) | → input |
| 12 | ` ```json\nP\n```\n```json\nP\n``` ` (two blocks) | → input |
| 13 | ` ```json\n```inner```\n``` ` (nested fence) | → input |
| 14 | ` ````json\nP\n```` ` (four backticks) | → input |
| 15 | `~~~json\nP\n~~~` (tilde) | → input |
| 16 | ` ```js\nP\n``` ` / ` ```javascript ` / ` ```jsonc ` | → input |
| 17 | ` ``` json\nP\n``` ` (space before marker) | → input |
| 18 | ` ```jsonP``` ` / ` ```json P\n``` ` (no newline after opener) | → input |
| 19 | ` ```json\nP``` ` (payload on closer line) | → input |
| 20 | ` ```json\nP\n`` ` / ` ```json\nP ` (truncated closer) | → input |
| 21 | ` ```json\n``` ` / ` ```json\n   \n``` ` (empty / whitespace inner) | → input |
| 22 | ` ```json\n{"a":1,}\n``` ` (malformed inner) | → `{"a":1,}` (still fails in `JSON.parse`) |
| 23 | ` ```json\n{"unexpected":true}\n``` ` (wrong schema) | → inner (still fails in the validator) |
| 24 | `﻿```json\nP\n``` ` (BOM) | → input |
| 25 | non-string (`undefined`, `null`, object) | → input (identity) |
| 26 | OU: ` ```json\nC\n```\n\n@@OPEN_UNDERSTANDING@@\n```json\nO\n``` ` | each part → its payload after the unchanged split |

For every accepted row, the final interpreter result is deep-equal to the plain-`P` result. For every rejected row, the final interpreter result is deep-equal to the pre-MRE-001 result.

---

# 18. Full Regression, Scope Purity, and Closure Criteria

**Full regression:** `node --test tests/*.test.js` passes in full. The only authorized existing-test changes are those listed in §15.

**Scope purity (verified at review):**
- R-1: `git diff` touches only the files listed in §15.
- R-2: each converted module's diff is limited to its dependency line, its wrapped `JSON.parse` argument(s), and at most one comment per site.
- R-3: `js/core/jsonUtils.js`, `functions/**`, every Safety rule and validator, every gate, and every prompt builder are byte-unchanged.
- R-4: the 29 unrelated pre-existing working-tree entries are untouched.
- R-5: nothing is staged, committed, or pushed without separate authorization.

**Closure criteria:**
1. All §16/§17 tests pass.
2. The full regression passes.
3. R-1 … R-5 are verified.
4. Real-model confirmation: the rerun OU-001 calibration (with the §12.5 baseline) shows the Turn Understanding `FAILED` rate is no longer 100% for the fenced responses, recorded in both Closure Records.
5. The §20 and §21 follow-ups are recorded as open items with named owners.

---

# 19. Structured Outputs Decision Record — [CANON]

Anthropic Structured Outputs (`output_config.format`, JSON Schema, constrained decoding) was investigated and is **not adopted for this Work Item or the current cross-cutting migration**. It works technically for `claude-haiku-4-5-20251001` (GA; 6/6 unfenced, schema-valid responses in the experiment) and remains a valid future capability. Current adoption would introduce:
- material schema-token overhead across multiple calls per turn (measured +811 input tokens on the Turn Understanding schema);
- request-body drift and TRR request-hash drift;
- constrained-decoding behavioral-drift risk and per-interpreter calibration requirements;
- OU-001 transport and failure-semantics changes (loss of sentinel truncation isolation);
- increased provider dependence.

It is not characterized as unsuitable or prohibited; it is not justified for this narrowly verified defect at this stage.

---

# 20. Mandatory Follow-Up — Safety Malformed-Output / Unavailable-State Fail-Open Defect

**Recorded, not solved here [VERIFIED mechanism; CANON: mandatory].**
- `SafetyContextInterpreter.classify()` and `UserSafetyProvenanceInterpreter.classify()` return only accepted items, so a parse or model failure is indistinguishable from "nothing found".
- `MemoryLayer.assembleContext()` then publishes `userSafetyContext`/`userSafetyProvenance` as **AVAILABLE with zero items** (`memoryLayer.js:440-455` and the provenance block).
- The canonical Safety rules return no match for empty items (`safetyLayer.js:254-258`, `:326-331`).

A truncated, refused, errored, timed-out, or otherwise malformed Safety classification can therefore silently disable a stored restriction. MRE-001 lowers the probability for the fenced case only and does not change this architecture. The follow-up requires separate Product/Architecture/Safety review **immediately after MRE-001 is resolved** — owner: Product/Architecture with the Safety authority.

---

# 21. Follow-Up — Model-Output Parse-Failure Observability

**Recorded, not solved here.** No Coach Decision System module reports parse or validation failures to `ErrorTelemetry` (0 references) **[VERIFIED]**, which is why this defect was invisible in production. Adequate observability — without logging model content or user data — requires its own Work Item. Owner: Product/Architecture.

---

# 22. Pending Decisions, Repository Gaps, and Canonical Conflicts

**Repository Gaps.**
- GAP-1: production impact is inferred, not observed (no telemetry; §21).
- GAP-2: `WP0_SPEC_v1.0.md` (owner of S17) is missing; not reconstructed.
- GAP-3: Item 6 (S10's second owner) has no SPEC.

**Architecture Decision Pending.**
- AD-1: **Commit sequencing with OU-001.** OU-001's implementation is uncommitted in the same working tree and shares `turnUnderstandingInterpreter.js` (S1, S2) with MRE-001. Also, OU-001's implementation scope included no cache-version bump, so on its own it would not reach cache-first clients. Options: commit OU-001 first, then MRE-001 with the single version bump; or one combined commit. Either way, exactly one version bump must cover every changed browser file.

**Product Decision Pending.** None.

**Engineering Decision Pending.** None.

**Canonical Conflicts.** None.

---

# 23. Status and Closure

- Status: **CLOSED** — Product/Architecture final closure approval; committed in the single combined OU-001 + MRE-001 closure commit. Deferred follow-ups below remain open.
- Implementation, when authorized, proceeds only through reviewed changes implementing §15 exactly, atomically (§08).

## Closure Record

- **Implementation:** §15 implemented atomically — 17/17 sites converted in one change (W-1), the shared primitive added, `index.html`/`sw.js` wired, and the version bumped to 2.47.6 (covering the uncommitted OU-001 browser changes too, per AD-1).
- **Deterministic evidence:** the §17 matrix, E-1 … E-5, P-1 … P-5, O-1 … O-3 and W-1 … W-5 are green. Request bodies of all 17 entry points match the pre-MRE-001 pins, with Turn Understanding compared modulo only the later OU-001 AC-CAL-4 instruction line. The TRR body hash and model-call counts are unchanged.
- **Real-model confirmation (closure criterion 4):** in both OU-001 calibration runs the Turn Understanding `FAILED` rate was 0% on both paths (46 + 23 calls per run), against 100% before MRE-001.
- **Follow-ups (criterion 5):** §20 (Safety fail-open, mandatory, Safety / pre-dogfood hardening phase) and §21 (observability) remain recorded and open, owned by Product/Architecture.
