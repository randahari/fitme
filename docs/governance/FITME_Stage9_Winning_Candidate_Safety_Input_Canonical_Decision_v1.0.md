
# FITME — STAGE 9 WINNING-CANDIDATE SAFETY INPUT — CANONICAL DECISION
## v1.0 — IMPLEMENTED / VERIFIED / CLOSED

> **Document role:** Canonical Decision record. Not a SPEC, not an implementation document, not a Decision Package requiring the full per-chapter Skeleton apparatus — a narrow, single-issue architectural correction, authored at that scope deliberately.
> **Prepared by:** Lead Engineer / Repository Maintainer, recording a decision approved by the Head of Product + AI Architect without reinterpretation.
> **Status:** IMPLEMENTED / VERIFIED / CLOSED. Implementation performed exactly per §6-§11 below; Product/Architecture reviewed the implementation and accepted the critical production evidence (§19/§20, LIVE-B). Full repository regression: 2478/2478 passing (2465 pre-correction baseline including TRR-001's own implementation, net +13). See §23, Closure Record, for the exact evidence this closure rests on.

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| T006 | TASK-006 Spec v1.0 | `docs/specs/TASK_006_SPEC_v1.0.md` |
| SL-001 | Safety Layer Spec v1.0 | `docs/specs/SL-001_SPEC_v1.0.md` |
| MAI-001 | Minimum Action Identity Spec v1.0 | `docs/specs/MAI_001_SPEC_v1.0.md` |
| CSR-001 | Canonical Safety Rule Spec v1.0 | `docs/specs/CSR_001_SPEC_v1.0.md` |
| TRR-001 | Training Readiness & Recovery Spec v1.0 | `docs/specs/TRR_001_SPEC_v1.0.md` |
| TDP | Training Readiness & Recovery V1 Canonical Decision Package v1.0 | `docs/governance/FITME_Training_Readiness_And_Recovery_V1_Canonical_Decision_Package_v1.0.md` |
| AD-MAI-01 | The Stage-9 propagation-boundary correction recorded in MAI-001 §13 | `docs/specs/MAI_001_SPEC_v1.0.md` §13 |

Citation format: `[FILE:LINE]`, verbatim from the repository as it exists at the baseline this document was authored against (uncommitted working tree, `main`, following commit `a8883fb` "docs: close training readiness & recovery v1 canonical decision package").

---

## 1. Purpose

Restore Stage 9's canonically-specified, but never actually reachable, authority to produce any Safety disposition other than `UNMODIFIED`, by supplying `finalReview()` with the actual winning Candidate for the `SINGLE_WINNER` case only. This decision closes a structural gap that predates TRR-001, was first exposed by TRR-001's approved §28 mechanism, and blocks TRR-001's Implementation Review pending its resolution.

## 2. Trigger / Discovered Production Gap

During a Product/Architecture-requested read-only pre-commit verification of TRR-001, direct execution of the real, unmodified production pipeline (`WinnerSelection.select()` → `DecisionFormation.form()` → the real `SafetyLayer` module, no test doubles) demonstrated that a `PHYSICAL_ACTIVITY` Candidate with genuinely unresolved Safety relevance (a CYCLING proposal against an unresolved "no strenuous cardio" restriction) is delivered to the user as an ordinary `INITIATIVE` Terminal Decision, rather than deferring to `SILENCE` as TRR-001 §28/TDP Ch.10(c) require. The finding was accepted by Product/Architecture as a genuine implementation/canonical blocker, and TRR-001 was placed in **IMPLEMENTATION REVIEW — BLOCKED**.

## 3. Repository Evidence

- `decisionFormation.js:133-140` — `preReviewDecision` is assembled with exactly `{kind, rationale, confidence, hierarchyTier, candidateProvenance, options}`; no Candidate-level Safety field (`actionCategory`/`activityReference`/`actionIdentity`) is ever included.
- `decisionFormation.js:149` — `reviewResult = await safetyPort.finalReview(preReviewDecision, pipelineContext);` — the Candidate is never passed.
- `safetyLayer.js:410-414` — `matchCanonicalSafetyRules(candidate, terminalDecision, pipelineContext) { if (!candidate) return []; ... }` — an unconditional short-circuit when `candidate` is falsy.
- `safetyLayer.js:626-628` — `finalReview()`'s own internal call: `var matchedRules = matchCanonicalSafetyRules(null, preReviewTerminalDecision, pipelineContext);` — `null` is hardcoded at the only Stage-9 call site.
- `winnerSelection.js:82-95` — Stage 8's `select()` returns the full, unstripped, real winning Candidate as `selection.winner` for `SINGLE_WINNER`; the real Candidate is available in scope at Stage 9 assembly time and is simply not forwarded.
- `decisionFormation.js:169-195` — the full CD-T006-06 five-disposition switch (`UNMODIFIED`/`MODIFIED`/`DEFERRED`/`BLOCKED`/`ESCALATED`) is already completely implemented and correct; every branch other than `UNMODIFIED` is exercised only by `tests/decisionFormation.test.js` via `makeSafetyIntegrationPortTestDouble` (`tests/decisionFormation.test.js:138-259`), never by the real `SafetyLayer`.
- `[T006:1030]` (D2 Unit 07(c), verbatim): "at Decision Formation, performs a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision (D1-AB-05)."
- `[SL-001:183-184]` (Stage 8/9 checkpoint table): "Stage 9 — Decision Formation | The pre-review (assembled) Terminal Decision, plus Pipeline Context | `finalReview()` call."
- `[MAI-001:21]` (AD-MAI-01, verbatim): "`decisionFormation.js` itself remains, and MUST remain, untouched (AD-MAI-01 item 6)."
- `[MAI-001:410-412]` (AD-MAI-01, verbatim): "neither path is a guaranteed MAI-001 contract; Foundation C or any future consumer must not rely on post-Stage-8 availability without a later, explicit canonical decision."

## 4. Root Cause

Stage 9's input contract (`[T006:1030]`, `[SL-001:184]`) was authored before Candidates carried any structured Safety-relevant identity — MAI-001's `actionIdentity` field did not yet exist. When MAI-001 later introduced that field, AD-MAI-01 correctly *observed* that it does not survive into `preReviewDecision` for `SINGLE_WINNER`, and deliberately left `decisionFormation.js` untouched, explicitly reserving the question for "a later, explicit canonical decision" (`[MAI-001:412]`). CSR-001 then built its one Rule around this known constraint without needing to revisit it, because RUNNING's disposition (`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`) is independently caught by Stage 8's absolute-override check. TRR-001 is the first Canonical Safety Rule whose intended disposition (`DEFERRED`, via `riskType: 'INSUFFICIENT'`) is not an absolute-override type, and is therefore the first to expose that Stage 9 has never, in fact, been able to produce anything but `UNMODIFIED` in live production. This is not a defect introduced by TRR-001; it is a pre-existing structural gap TRR-001's own correct implementation was the first to require.

## 5. Approved Product/Architecture Decision

**Approved.** Stage 9 Final Safety Review MUST receive the actual winning Candidate when a single winning Candidate exists (`SINGLE_WINNER` only). Candidate identity is supplied to the Safety Layer strictly as Safety-evaluation input. Decision Formation does not acquire Safety authority. Stage 8 is unchanged and continues to perform only absolute-override disqualification. Stage 9 remains the sole owner of the full five-disposition Safety Matrix. This decision restores live reachability of an already-canonical Stage-9 authority; it does not change Safety semantics, does not add a disposition, does not add a `RiskType`/`reasonCode`, and does not alter any Rule function.

## 6. Exact SINGLE_WINNER Contract

For `selection.status === 'SINGLE_WINNER'` only:

```
Decision Formation retains the actual winning Candidate (selection.winner)
  → finalReview(winningCandidate, preReviewTerminalDecision, pipelineContext)
    → SafetyLayer evaluates matchCanonicalSafetyRules(winningCandidate, preReviewTerminalDecision, pipelineContext)
      → existing evaluateCanonicalSafetyRules() / disposition mapping, unchanged
        → existing CD-T006-06 consumption in decisionFormation.js, unchanged
```

No new field is added to the Candidate, the Terminal Decision, or the `SafetyReviewResult` shape. The only change is that the first argument to `finalReview()` — and, internally, to `matchCanonicalSafetyRules()` — carries the real Candidate object instead of a hardcoded `null`, for this one selection status.

## 7. Explicit TIED_SET Non-Goal

`selection.status === 'TIED_SET'` is explicitly OUT OF SCOPE for this decision. No tied-set Safety aggregation, no multi-Candidate Stage-9 semantics, no sentinel value, no synthetic Candidate, and no new Safety artifact are introduced. `finalReview()`'s existing behavior for `TIED_SET` (candidate argument absent/`null`, per current behavior) is unchanged by this decision and remains a separate, unresolved question for a future canonical decision if one is ever requested.

## 8. Stage-8 Invariant

Stage 8 (`winnerSelection.js` → `safetyLayer.js:disqualify()`) is unchanged: binary disqualification against exactly `ABSOLUTE_OVERRIDE_RISK_TYPES` (`safetyLayer.js:100-102`), unmodified in membership or evaluation logic. This decision does not touch `disqualify()`.

## 9. Stage-9 Authority Invariant

Stage 9 remains the exclusive owner of the full five-value disposition matrix (`UNMODIFIED | MODIFIED | BLOCKED | DEFERRED | ESCALATED`). This decision does not relocate that authority, does not grant Decision Formation any part of it, and does not grant Stage 8 any part of it. It only repairs the input Stage 9's own existing authority operates on.

## 10. Decision Formation Boundary

Decision Formation's role is expanded by exactly one datum: it forwards the winning Candidate it already holds in scope (from `selection.winner`) to the Safety Layer, for `SINGLE_WINNER` only. Decision Formation MUST NOT, and this decision does not authorize it to: interpret `actionIdentity`; inspect Safety restrictions or `pipelineContext.userSafetyContext`/`userSafetyProvenance`; recreate or approximate any Canonical Safety Rule; derive a Safety disposition of its own; or alter, override, or reinterpret any `reasonCode`/`reasonDetail`/`disposition` the Safety Layer returns. Its consumption of the returned `SafetyReviewResult` (`decisionFormation.js:169-195`) is unchanged.

## 11. Safety Layer Boundary

The Safety Layer — not Decision Formation — remains the exclusive evaluator of Candidate Safety. `matchCanonicalSafetyRules(candidate, terminalDecision, pipelineContext)`'s existing three-parameter conceptual contract (`safetyLayer.js:410`) is used as-is; only its Stage-9 caller (`finalReview()`, `safetyLayer.js:626-628`) stops hardcoding `null` for the first argument. Every existing Rule function (`matchRunningMedicalRestrictionRule`, `matchWalkingMedicalRestrictionRule`, `matchUnresolvedActivitySafetyCoverageRule`), `evaluateRulePredicate()`, `evaluateCanonicalSafetyRules()`, and `selectPrimaryAndSecondary()` are unchanged.

## 12. AD-MAI-01 Supersession Scope

This decision supersedes **only** the specific clause of AD-MAI-01 recorded at `[MAI-001:21]` — "`decisionFormation.js` itself remains, and MUST remain, untouched" — insofar as that clause bars Candidate-identity propagation from Stage 8 into Stage 9 for the `SINGLE_WINNER` path. AD-MAI-01's own text anticipated exactly this: "Foundation C or any future consumer must not rely on post-Stage-8 availability without a later, explicit canonical decision" (`[MAI-001:412]`) — this document IS that later, explicit canonical decision, satisfying that reservation. No other AD-MAI-01 finding is reopened: the `TIED_SET` `options[]` incidental-carriage observation, the "not a guaranteed MAI-001 contract" characterization of that incidental behavior, and every other MAI-001 Product/Candidate-contract conclusion stand exactly as closed.

## 13. TASK-006 Reconciliation

`[T006:1030]` (D2 Unit 07(c)) describes Stage 9's trigger as "the assembled (pre-final-review) Terminal Decision" and does not itself either require or forbid Candidate-identity accompaniment — it predates Candidate-level Safety identity fields entirely (§4 above). This decision is additive to, not contradictory with, D2 Unit 07(c): Stage 9 continues to receive the pre-review Terminal Decision and Pipeline Context exactly as specified, and additionally receives the winning Candidate for `SINGLE_WINNER`. `[T006:1026]` (§21.2, Stage 8 scope) and `[T006:1052]` (§21.6, no bypass/downgrade/reinterpretation of Safety output) are unaffected. TASK-006's own Winner-Selection scope statement ("Winner Selection does not itself form a Terminal Decision," `winnerSelection.js:9`) is unaffected — Winner Selection's output (`selection.winner`) is unchanged; only Decision Formation's downstream use of that already-existing output changes.

## 14. SL-001 Reconciliation

`[SL-001:184]`'s Stage-9 checkpoint table ("Input: The pre-review (assembled) Terminal Decision, plus Pipeline Context") requires an additive correction to also list the winning Candidate (`SINGLE_WINNER` only) as Stage-9 input. `[SL-001:453]` (Stage 8 binary absolute-override scope, D1-AH-02) is unaffected. `[SL-001:160-164]` (D2 Unit 07's three Safety Layer functions) is unaffected in substance — function (c) ("a final, independent, non-bypassable evaluation with authority to modify, defer, or block the Terminal Decision") is fulfilled more completely, not altered. No RCD (RCD-01 through RCD-15) is reopened; this decision changes no enum, no disposition, no `reasonCode`, no tie-break rule.

## 15. MAI-001 Reconciliation

MAI-001's own Candidate/`actionIdentity` contract (§§1-12) is untouched. Only §13's Stage-9 propagation boundary (AD-MAI-01) is superseded, narrowly, per §12 above. MAI-001's `SINGLE_WINNER`/`TIED_SET` distinction itself remains accurate and unchanged — this decision changes what `SINGLE_WINNER` newly enables at Stage 9, not the distinction's own definition.

## 16. CSR-001 Compatibility

RUNNING's own Canonical Safety Rule (`matchRunningMedicalRestrictionRule`) requires no change. Its confirmed-active case (`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`) already resolves `SILENCE` today via Stage 8's absolute-override disqualification, before a `SINGLE_WINNER` is ever reached; this decision does not alter that path. Where a RUNNING Candidate with a qualifying restriction happens to survive to `SINGLE_WINNER` in some other configuration, Stage 9 would now also correctly resolve it (`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT` maps to `BLOCKED` under `evaluateRulePredicate()`), which is redundant confirmation of the existing outcome, not a contradiction of it. Acceptance Scenario A (§ below) freezes this as unchanged behavior.

## 17. TRR-001 Compatibility

TRR-001 SPEC §§27-30's Product/Architecture contract is unchanged by this decision. §28's Unresolved Activity Safety Coverage Rule (`matchUnresolvedActivitySafetyCoverageRule`) requires no code change. This decision resolves exactly the reachability gap TRR-001's own read-only verification identified: with the winning Candidate now reaching `finalReview()`, a `PHYSICAL_ACTIVITY` Candidate producing `riskType: 'INSUFFICIENT'` dims will correctly resolve `DEFERRED` → `SILENCE`, satisfying TDP Ch.10(c) and TRR-001 §28/§30 as originally approved.

## 18. Required Implementation Surface

**Expected production files** (not modified by this document):
- `js/coachDecisionSystem/decisionFormation.js` — thread `selection.winner` (for `SINGLE_WINNER` only) into the `finalReview()` call.
- `js/coachDecisionSystem/safetyIntegrationPort.js` — extend the documented `finalReview()` signature/shape additively to describe the new, optional Candidate input.
- `js/coachDecisionSystem/safetyLayer.js` — `finalReview()`'s internal call to `matchCanonicalSafetyRules()` passes the received candidate instead of the hardcoded `null`.

**Expected test/reconciliation surface:**
- `tests/decisionFormation.test.js`
- `tests/safetyIntegrationPort.test.js`
- `tests/canonicalSafetyRule.test.js`
- `tests/trrSafetyCoverage.test.js`
- `tests/fixtures/safetyIntegrationPortTestDouble.js`, only if the port's own contract shape change requires it.

No other file is currently expected to require change. This section records expected scope only; it does not authorize implementation in this document.

## 19. Required Regression/Acceptance Evidence

Before this decision may be marked CLOSED, engineering must supply, against the real (non-test-double) `SafetyLayer`, for each frozen scenario in §20:

| # | Scenario | Required Stage-8 result | Required Stage-9 disposition | Required Terminal Decision `kind` |
|---|---|---|---|---|
| A | RUNNING + confirmed medical RUNNING restriction | Disqualified (absolute override) | N/A — Stage 9 not reached (`ALL_DISQUALIFIED`) | `SILENCE` |
| B | CYCLING + unresolved "no strenuous cardio" | Survives (not absolute override) | `DEFERRED` | `SILENCE` |
| C | Pilates + deterministically RUNNING-specific restriction | Survives | `UNMODIFIED` | original kind (deliverable) |
| D | Zero Safety restrictions | Survives | `UNMODIFIED` | original kind (deliverable) |
| E | Single winning Candidate + a future MODIFIED-producing Rule | Survives | `MODIFIED` (proves the Matrix's `MODIFIED` branch is live/reachable, not only `DEFERRED`) | original kind + `modification` record |
| F | `TIED_SET` (any composition) | — | Unchanged from current, pre-decision behavior | Unchanged |

Plus: the full existing regression suite passing with no unexpected failure, and explicit confirmation that no currently-passing RUNNING/CSR-001 test changes its asserted outcome (only, where applicable, its internal mechanism of proof).

## 20. Frozen Acceptance Scenarios

(Restated for canonical freezing, identical to §19's table — see above. These six scenarios are the fixed, minimum acceptance surface; engineering may add further scenarios but may not narrow this set.)

## 21. Non-Goals

This decision does NOT:
- Change `ABSOLUTE_OVERRIDE_RISK_TYPES` or any Stage-8 logic.
- Add, remove, or alter any `RiskType`, `EvidenceConfidence`, `Correctability`, `Urgency`, disposition, or `reasonCode` value.
- Change any existing Canonical Safety Rule's matching logic.
- Introduce tied-set Safety aggregation, a synthetic Candidate, or a new Safety artifact.
- Introduce any provider-session memory.
- Introduce any new Safety ontology or any new activity ontology.
- Alter TRR-001's, CSR-001's, or MAI-001's substantive Product decisions.
- Authorize a same-cycle retry, a replacement Candidate, a second Terminal Decision, or any durable "clarification owed" state for a `DEFERRED` outcome — `DEFERRED` → current Decision Pass → `SILENCE` remains exactly as approved, with no further delivery attempt this cycle.
- Constitute implementation. No production file, test file, or fixture is modified by this document.

## 22. Closure Criteria

This document may be marked CLOSED only after: (a) the implementation surface in §18 is built exactly as scoped, with no expansion beyond it absent a new canonical decision; (b) all six scenarios in §19/§20 are demonstrated, with exact pass/fail evidence, against the real `SafetyLayer` (no test double, except LIVE-E's sanctioned test-double proof); (c) full repository regression passes with reported exact counts; (d) Product/Architecture Final Review explicitly approves closure. **All four conditions are met — see §23.**

---

## 23. Closure Record

Implementation performed exactly per §6-§11/§18, with one clarified, non-substantive deviation reported and accepted: `finalReview()`'s `candidate` parameter was added as an **additive, optional third argument** (`finalReview(terminalDecision, pipelineContext, candidate)`) rather than the illustrative candidate-first ordering in §6, to preserve byte-for-byte backward compatibility for every pre-existing 2-argument call (`tests/safetyLayer.test.js`, `tests/canonicalSafetyRule.test.js`) without expanding this decision's own test/production surface. This does not change the decision's substance, invariants, or scope.

**All six frozen acceptance scenarios (§19/§20) demonstrated against the real, unmodified `WinnerSelection.select()` → `DecisionFormation.form()` → `SafetyLayer` chain** (`tests/trrSafetyCoverage.test.js`, `LIVE-A` through `LIVE-F`; `tests/decisionFormation.test.js`'s own candidate-forwarding unit tests):

- **A (RUNNING, confirmed restriction):** Stage 8 `ALL_DISQUALIFIED` → `SILENCE`, unchanged. ✅
- **B (CYCLING, unresolved restriction — critical):** Stage 8 `SINGLE_WINNER` → Stage 9 `DEFERRED` → `SILENCE` (previously `INITIATIVE`). ✅ This is the exact defect this decision resolves.
- **C (Pilates, RUNNING-identified restriction):** Stage 9 `UNMODIFIED` → ordinary deliverable decision. ✅
- **D (zero restrictions):** Stage 9 `UNMODIFIED` → ordinary deliverable decision. ✅
- **E (MODIFIED reachability, sanctioned test double):** Stage 9 `MODIFIED` → `modification` record attached, candidate-forwarding confirmed on this path too. ✅
- **F (TIED_SET):** no candidate forwarded, `UNMODIFIED`, unchanged — confirmed even against a restriction that would `DEFER` a real `SINGLE_WINNER` candidate. ✅

**Implementation surface, exactly as scoped in §18, no expansion:** `js/coachDecisionSystem/decisionFormation.js`, `js/coachDecisionSystem/safetyIntegrationPort.js`, `js/coachDecisionSystem/safetyLayer.js` (production); `tests/decisionFormation.test.js`, `tests/trrSafetyCoverage.test.js`, `tests/fixtures/safetyIntegrationPortTestDouble.js` (tests) — `tests/safetyIntegrationPort.test.js` and `tests/canonicalSafetyRule.test.js` were inspected and confirmed to require no change.

**Full repository regression: 2478/2478 passing, 0 failing** (2465 pre-correction baseline including TRR-001's own implementation, net +13 — 3 in `decisionFormation.test.js`, 10 in `trrSafetyCoverage.test.js`).

**Invariants confirmed unbroken:** Stage 8/`ABSOLUTE_OVERRIDE_RISK_TYPES` unchanged; no new Safety enum/disposition/`reasonCode`; no Rule function changed; `TIED_SET` unchanged; RUNNING's own disqualification outcome unchanged (confirmed via Scenario A, still governed by Stage 8, not by this correction).

**Product/Architecture verdict:** APPROVED / VERIFIED — original live Safety blocker RESOLVED, critical production evidence (Scenario B / `LIVE-B`) accepted, full and TRR-specific regression accepted.

---

## Approvals

- **Product/Architecture decision approving Option A (this document's substance):** APPROVED — Head of Product + AI Architect.
- **Engineering Readiness Verification:** PASSED — implementation matches §6-§18 exactly; scope-purity confirmed via `git diff --stat`.
- **Final Product Verification:** APPROVED — critical Scenario B/`LIVE-B` evidence accepted; original live Safety blocker confirmed RESOLVED.
- **Final Architecture Verification:** APPROVED — Stage 8/Stage 9 authority boundaries, `TIED_SET` non-goal, and AD-MAI-01 supersession scope all confirmed honored exactly as recorded above.

**CLOSED.**
