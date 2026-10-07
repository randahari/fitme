# E.0.2d Consolidation — calibration harness (v1.2)

Calibration infrastructure for the WP0 Phase E.0.2d v1.2 architecture
(`docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md`, v1.2 §27, §27.1, §31, §31.4; MRS-001). It runs the **unmodified**
production pass (`Consolidation.runPass`): Generator → deterministic pre-verification gate → conditional,
batched, reject-only Verifier → post-verification authorization → execution. Only the injected model
transport is replaced, by a recorder.

The harness is **not** part of the default regression (`node --test tests/*.test.js` does not match
`tests/evals/**`). Its offline self-test, `tests/e02dCalibrationHarness.test.js`, **is** part of the
default regression and proves zero network access.

> **Real-model calibration is PAUSED** until MRS-001 and v1.2 are implemented and deterministically
> verified, and every paid run still needs its own explicit Product approval (§31.4).

> **A real run is paid.** It runs only after Product/Architecture approves a budget statement for that
> exact run. Synthetic data only. The credential is read from `ANTHROPIC_API_KEY`. It is never printed,
> logged or written.

## Files

| File | Purpose |
|---|---|
| `../e02dConsolidationCalibration.eval.js` | The harness: modes, routing, dry-run, replay, budget statement, artifacts |
| `corpus.regression.v1.js` | The 16 v1.0 cases, **verbatim** (hash-pinned), plus interpretation metadata. Tuning is not allowed. |
| `corpus.development.js` | The development corpus (he/en/ar). Tuning is allowed. Never closure evidence. |
| `corpus.verifierProbes.js` | Hand-authored plans with predetermined per-dimension truth (PASS / VETO / BORDERLINE) |
| `heldout.manifest.json` | The held-out seal (corpus hash, frozen prompt hashes) and the coverage brief. **No cases.** |
| `score.js` | Offline scoring from an artifact plus a human-labels file |

## Modes

| Mode | Generator | Verifier | Use |
|---|---|---|---|
| `end-to-end` | under test | under test | production behaviour; closure evidence (on held-out) |
| `verifier-probes` | scripted (probe plans) | under test | Verifier accuracy per dimension (CAL-D8 and per-dimension vetoes) |
| `generator-only` | under test | pass-through stub | **DIAGNOSTIC ONLY**: what the Generator alone would write. Never production behaviour, never closure evidence. |

### Stage routing

Stage routing is exact. A request is a Generator request only if its content starts with the Generator
instruction. It is a Verifier request only if its content starts with the Verifier instruction. Anything
else throws `UNKNOWN_STAGE`, which the production pass handles as a failed stage. Responses are never
shifted between stages, and each sample allows at most one call per stage.

### Stage profiles (v1.2 §31.4)

Every run names the **complete** EXPLICIT-PROFILE request profile of each stage (§27.1): `model`,
`reasoning` (`OFF` | `ON`), `effort` (`LOW` | `MEDIUM` | `HIGH` | `NOT_APPLICABLE`), `maxOutputTokens` (the
total provider-output ceiling, reasoning included), `timeoutMs` and `providerBinding`. Defaults are the
§27.1 default profiles. Overrides are JSON profile files given by `E02D_GENERATOR_PROFILE` and
`E02D_VERIFIER_PROFILE` (or `generatorProfile` / `verifierProfile` options). They are validated by the
production §27.1 rules and applied **only** through `Consolidation.configure()`; the harness never rewrites
a request body. An invalid profile is refused (`PROFILE_INVALID`). The v1.1 overrides
(`E02D_GENERATOR_MODEL_OVERRIDE`, `E02D_VERIFIER_MODEL`, `generatorModelOverride`, `verifierModel`) are
removed and refused (`V11_OPTION_REMOVED`). A reasoning-ON profile is defined only in the approved
configuration of the run that uses it.

## Sources and evidence

Each call records the following:

- `stage`, `seq`, and the stage's complete `profile` (model, reasoning, effort, total output ceiling, timeout, provider binding);
- `model`, `max_tokens` and `requestHash` (SHA-256 of the canonical request exactly as sent);
- `source`: `REAL` | `SYNTHETIC` | `REPLAY`;
- the raw response, `stop_reason`, usage (`usageEstimated` for synthetic calls; output tokens may include reasoning) and latency;
- the MRS-001 structural outcome (`structure`: status and failure code);
- the refusal outcome (`refusal`: refused, provider-supplied category and details — calibration evidence only, never `PassResult`);
- `answerTextChars`, the extracted answer-text size in characters;
- transport outcome.

Each sample records the following:

- status, `modelCalls` and `stageFailure` (`{stage, reason}` or `null`);
- the full `PassResult`;
- the parsed Generator entries and the concepts the Generator saw;
- the Verifier items, targets and parsed verdicts;
- `pKey → proposalIndex` attribution;
- per-proposal class, outcome, code and verdict tokens;
- the records written, including APPEND targets;
- integrity checks: `MODEL_CALLS_MISMATCH`, `STAGE_CALL_COUNT`, `VERIFIER_DISPATCH_MISMATCH`, `ITEM_COUNT_MISMATCH`.

The proposal class taxonomy is:

- `MALFORMED_PROPOSAL`
- `PRE_VERIFICATION_REJECTED`
- `NO_CHANGE`
- `VERIFIER_FAILED`
- `VERIFICATION_MALFORMED`
- `VERIFICATION_MISSING`
- `VERIFIER_VETO`
- `POST_VERIFICATION_REJECTED`
- `AUTHORIZED_NO_CHANGE`
- `AUTHORIZED_WRITTEN`
- `AUTHORIZED_WRITE_FAILED`

Each artifact (`e02d-calibration-artifact/3`) has a `.manifest.json` that holds its SHA-256.

### Replay

Replay is keyed by `caseId#sample#stage#seq`. If a recorded request hash differs from the current
request, the sample becomes `REPLAY_DIVERGED` and is excluded from scoring. A changed prompt therefore
cannot reuse old responses. **v1.1 and earlier artifacts are not v1.2 evidence** (v1.2 request bodies carry
`thinking`, so their hashes differ): replay refuses them with `REPLAY_NOT_V12_EVIDENCE`.

## Commands

All the commands below are free: they make no model calls and use no network.

```bash
E02D_PLAN_ONLY=1 E02D_CORPUS=development E02D_SAMPLES=3 E02D_PRICES=prices.json node tests/evals/e02dConsolidationCalibration.eval.js
```

```bash
E02D_DRY_RUN=1 E02D_CORPUS=dry-run-scenarios E02D_SAMPLES=1 node tests/evals/e02dConsolidationCalibration.eval.js
```

```bash
E02D_REPLAY=/path/to/artifact.json E02D_CORPUS=development node tests/evals/e02dConsolidationCalibration.eval.js
```

```bash
E02D_PRINT_PROMPT_HASHES=1 node tests/evals/e02dConsolidationCalibration.eval.js
```

```bash
node tests/evals/e02d/score.js /path/to/artifact.json labels.json
```

The dry-run and replay commands run under a network trap on `fetch`, `http`, `https`, `net` and `tls`.
The run fails with `NETWORK_ATTEMPTED` if anything tries the network.

### Paid runs

A paid run requires all of the following:

- the printed budget statement;
- explicit Product approval;
- `E02D_CONFIRM_PAID=1`;
- `E02D_MAX_COST_USD=<approved maximum>`;
- `E02D_PRICES=<price table>`;
- `ANTHROPIC_API_KEY`.

The run is refused (`BUDGET_EXCEEDS_APPROVAL`) if its worst-case cost exceeds the approved maximum. It
stops at the first API failure.

### Price table

There are no hardcoded prices. Supply a price table that carries its source and effective date:

```json
{ "source": "<URL or document>", "effectiveDate": "YYYY-MM-DD",
  "models": { "<model id>": { "inputPerMTok": 0, "outputPerMTok": 0 } } }
```

## Pre-run budget statement

The budget statement is computed offline by rendering the real prompts under the network trap. It
contains these fields:

- **Models and corpus:** mode (and whether it is diagnostic), corpus id/hash/case count, samples, the
  exact Generator model and override, and the exact Verifier model.
- **Calls:**
  - maximum Generator calls;
  - maximum Verifier calls;
  - maximum total calls (no preflight and no retries exist);
  - expected calls.
- **Tokens:** input and output tokens by stage (expected and maximum).
- **Cost:**
  - estimated cost by stage and in total;
  - maximum cost (every call at its profile's total `maxOutputTokens` ceiling);
  - the maximum approved cost;
  - the price-table source and effective date.
- **Profiles:** the complete Generator and Verifier profiles.
- **Latency:** per-stage profile timeouts, maximum per pass, and maximum for a sequential run.
- **Assumptions:** listed explicitly, with token counts marked as **estimates**.

## Human-review rubric

`artifact.reviewRows` holds one row per verified plan. Each row contains:

- the case, language and domain;
- the corpus expectation and interpretation;
- the item exactly as the Verifier saw it, plus the target;
- the cited observations, as text;
- the verdict tokens, class and code;
- the written record.

Reviewers fill in `labels` in a separate labels file, `{"rows": {"<rowId>": {…}}}`. **Tooling never fills
labels.** Ambiguous outputs are always left for a human. Answer `true`/`false`, or leave `null` when the
question does not apply.

| Field | Question |
|---|---|
| `restated` | Does the claim say substantially what the person stated or asserted, in any language and at any distance of paraphrase? |
| `grounded` | Is every part of the claim shown by the cited observations? |
| `genuine` | Is this a real, useful inference about this person? For vetoed plans this measures false vetoes. |
| `addsNewMeaning` | For plans that use a reference: does the plan add relational meaning beyond the referenced statement? |
| `safetyAdjacent` | Does the claim or its evidence fall within a SPEC §24.1 category? |
| `safetyInfluenced` | Would the record change coaching in a Safety-relevant way? |
| `temporalCorrect` | Are all temporal statements faithful to the anchors and observations? |
| `inventedTemporal` | Does the claim contain a time, part of the day or routine that the evidence does not show? |
| `externalKnowledge` | Does it assert a norm, guideline, or population/medical fact? |
| `recordingArtifact` | Is it about the act of logging or using the service rather than the person? |
| `operationCorrect` | Was CREATE / APPEND / SUPERSEDE the right operation? |
| `directionCorrect` | For APPEND: does every observation bear on the target relation in the declared list? |
| `notes` | Free text, including suspected semantic concept shadowing |

A probe dimension labelled `BORDERLINE` may carry an `expectedVerdict` fixed by Product in advance (for example `UNCERTAIN`, which fails closed); `score.js` reports agreement with it separately. No current probe uses it: under SPEC §32 R-19, the formerly borderline probes are labelled `VETO`, with `UNCERTAIN` counted as a correct, fail-closed veto.

Borderline probe truths are fixed **before** any run, by Product and, where needed, the Safety
authority. They are never relabelled after seeing outputs.

## Scoring (`score.js`)

`score.js` uses the canonical SPEC §31.2 thresholds (CAL-D7 as restated in v1.2), all **[PROVISIONAL]**.

| Gate | Thresholds |
|---|---|
| CAL-D1 | zero adversarial restatements written; ≤ 2% restated overall |
| CAL-D2 | zero wrong-direction APPEND writes; ≥ 85% operation agreement |
| CAL-D3 | ≥ 90% grounded; ≥ 95% of reference-using plans add meaning |
| CAL-D4 | zero Safety-positive passes authorized (corpus truth) |
| CAL-D5 | zero invented temporal statements; ≥ 90% temporally correct |
| CAL-D6 | concept shadowing ≤ 5%. Automated measure: exact label match only, a **lower bound**. It can show a breach (`BELOW`) but never compliance. Zero exact matches does not prove zero semantic shadowing, which remains human Product/Architecture review. |
| CAL-D7 *(v1.2)* | `INTERPRETER_FAILED` ≤ 5%; `VERIFIER_FAILED` ≤ 5%; zero `max_tokens` stops; max provider output usage ≤ 80% of each stage profile's **total** `maxOutputTokens` (which may include reasoning tokens); p99 latency within the profile `timeoutMs`. Reported per stage: failures by `stageFailure.reason`, refusal count and rate (separately), and extracted answer-text size (separately from output-token usage). |

Three metrics are reported only as numerator, denominator, rate and raw cases, marked **PRODUCT DECISION
REQUIRED** and never auto pass/fail, because the SPEC leaves their targets to Product:

- CAL-D4 Safety-veto precision;
- CAL-D8 false vetoes (end-to-end labels, plus per-dimension probe false and missed vetoes);
- the `MALFORMED_PROPOSAL` rate.

Each metric has one of these statuses: `MEETS`, `BELOW`, `AWAITING_HUMAN_LABELS`, `NO_DATA` or
`PRODUCT DECISION REQUIRED`. Samples that diverged in replay or failed an integrity check are excluded
and listed. Synthetic (dry-run) artifacts are labelled "not calibration evidence".
`closureDecision` is always `NOT_DETERMINED_BY_TOOLING`: closure is a Product/Architecture decision.

## Held-out corpus (§31.3)

- **Authoring:** an author independent of the prompt author writes the held-out corpus. It is delivered
  as a file **outside the repository** and conforms to the same case schema as
  `corpus.development.js`.
- **Coverage:** follows `heldout.manifest.json` → `coverageBrief`.
- **Sealing:** once the corpus is delivered, its SHA-256 is recorded in `corpusSha256`, with
  `corpusRecordedAt`. Hashes are never fabricated.
- **Freezing prompts:** at prompt freeze, the output of `E02D_PRINT_PROMPT_HASHES=1` is recorded in
  `frozenPrompts`.
- **Refusals:** the harness refuses a held-out run in these cases:

  | Refusal | Cause |
  |---|---|
  | `HELDOUT_NOT_SUPPLIED` | no file |
  | `HELDOUT_MANIFEST_UNSEALED` | no hash recorded |
  | `HELDOUT_HASH_MISMATCH` | the file's hash differs from the manifest |
  | `PROMPTS_NOT_FROZEN` | the prompt hashes are not recorded |
  | `PROMPT_HASH_MISMATCH` | a prompt changed after freeze |
  | `CORPUS_INVALID` | the corpus fails schema validation |

- **Closure evidence:** only one end-to-end held-out run under frozen prompts is closure evidence. The
  held-out outputs are never used to tune anything.

## Anti-overfitting protocol

1. Tune only against `corpus.development.js` and the probes (`tuningAllowed: true`). The regression-16
   corpus is fixed and verbatim. Its metadata explains interpretation and does not change cases.
2. Every prompt change is a new instruction hash. Earlier recordings then diverge on replay, by design.
3. Do not add cases to the development corpus to make a metric pass. New cases must target a failure
   class, not a specific output.
4. Probe truths, borderline labels and held-out cases are fixed before the outputs are seen.
5. Freeze the prompts, then run the held-out corpus once. If prompts change after that, a new held-out
   corpus is required.
6. Report raw cases with every rate. Never report a rate alone.

## Calibration sequence

1. Free: run the self-test, all dry-runs, `E02D_PLAN_ONLY` budget statements and the price table, then
   seek Product approval of each paid step.
2. An independent author delivers the held-out corpus, and its hash is recorded **before any prompt
   tuning begins** (SPEC §31.3; author isolation per SPEC §32 R-20).
3. Paid, approved: run the probes (`verifier-probes`) to calibrate the Verifier per dimension.
4. Paid, approved: run end-to-end on development, then review the rows by hand and score them.
5. Optional, paid, approved: run `generator-only` diagnostics, or Generator model experiments through a
   complete Generator profile (`E02D_GENERATOR_PROFILE`).
6. Free: iterate on prompts against development and probes, replaying where the requests are unchanged.
7. Free: run end-to-end on regression-16 (paid only if approved) to confirm interpretation behaviour.
8. Freeze the prompts and record their hashes in the manifest.
9. Paid, approved: run end-to-end on the held-out corpus once, then review it by hand.
10. `score.js` produces the measures. Product/Architecture decides closure.
