# WP0 — SAFETY RISK-CHARACTERISTIC FOUNDATION — CANONICAL SUB-SPEC
## v1.0 — REVISION 2 — READY FOR IMPLEMENTATION (Product Review: APPROVED. Architecture Review: APPROVED. Authored Under FITME Specification Authoring Standard v1.1)

**Repository path:** `docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md`

This document was authored strictly as Engineering filling a specification under the Authoring Standard: it documents contracts, cites evidence, and records unresolved items. It did not self-certify READY, and made no repository changes itself. Every claim is tagged with its evidence class: **[VERIFIED]**, **[CANON]**, **[DESIGN]** (proposed by this Sub-Spec; final upon Product/Architecture sign-off — now given, see §01), or **[GAP]**. Following Product Review and Architecture Review approval (§01), WP0 Phase D.1 (§22) has been implemented under the authority of this document and is recorded in §27/§28; each subsequent phase requires its own separate authorization before implementation begins.

---

# 01. Identity, Status, and Authority

- Deliverable: **WP0 — Safety Risk-Characteristic Foundation — Canonical Sub-Spec**, the prerequisite named by `WP0_SPEC_v1.0.md` §27 and gating Phase E (General Reasoning live activation) per §22/§31's binding rollout order.
- Status: **Product Review: APPROVED. Architecture Review: APPROVED. Status: READY FOR IMPLEMENTATION.** Engineering Self-Review (§25, including the Round-2 pass at §25.1) is complete; all four §26 items are resolved (§26); Product and Architecture have both explicitly reviewed and approved this Sub-Spec as a whole, including explicit ratification of the Round-2 runtime-enforcement mechanism and its TRR Zero-Drift interpretation (see below). WP0 Phase D.1 (§22) has been implemented, tested (30/30 focused, 3021/3021 full regression), reviewed, and approved; committed to `main`. Phase D.2 onward remain not yet authorized.
- **Approved Round-2 TRR Zero-Drift interpretation (binding, recorded here verbatim for canonical clarity):** TRR Zero Drift means **behavioral/outcome equivalence**, proven by golden-master testing. It does **NOT** mean TRR is structurally exempt from the new unconditional runtime Safety characterization. No capability — current or future — receives a runtime Safety exemption merely because its declaration says `riskCharacteristicDimensions:[]`. This is the exact interpretation reconciled and disclosed at §13/§17/§19/§25.1, now explicitly ratified by both Product and Architecture.
- Authority: Head of Product + AI Architect own every decision recorded as binding in §03. Engineering (this document) fills the structural design implied by those decisions and records what remains genuinely open in §26.
- Upstream inputs: *WP0 — General Intelligence Architecture Investigation*, *WP0 Canonical Design Proposal*, *WP0_SPEC_v1.0* (Revisions 1–3, READY, Phases A–C implemented and pushed at commits `321eef2`/`72ef0d1`/`25e8444`), and *WP0 Phase D — Safety Risk-Characteristic Foundation: Repository Evidence Report* (this session, read-only) — the last of these is the evidentiary basis for every architectural claim below and is treated as **[VERIFIED]** throughout without re-citation of its own sub-citations.
- This document itself is never edited to perform a repository action — staging/commits/pushes happen through ordinary implementation commits (e.g. the Phase D.1 commit recorded at §27/§28), each separately reviewed and authorized, never as a side effect of revising this Sub-Spec's own text.

---

# 02. Purpose / Scope / Non-Goals

**Purpose.** Define the closed governance-shape Risk Characteristic taxonomy, extraction contract, deterministic validation/gating contract, and Safety Rule integration required before `GeneralReasoningCapability` (WP0 Phase C, `js/coachDecisionSystem/generalReasoningCapability.js`) may become live and user-reachable (Phase E), and before FITME's Safety Layer can responsibly govern proposals about a semantically open world rather than only RUNNING/WALKING.

**Scope.**
- The closed Risk Characteristic taxonomy (dimensions and allowed values) — governance-shape, never a catalogue of foods/sports/activities/places.
- A new, independent extraction/classification mechanism (candidate-content characterization AND durable user-constraint recognition), structurally separate from `GeneralReasoningCapability`.
- Deterministic validation/gating of that mechanism's output before it gains any Safety-relevant authority.
- Uniform, conservative uncertainty semantics.
- The mapping from governed Risk Characteristics onto the *existing*, unmodified closed `RiskType`/`ReasonCode`/`Disposition` vocabulary.
- New, additive Canonical Safety Rule(s) for broad (not narrow, not Alpha-scoped) coverage.
- Full canonical semantics for all five dispositions, including making `MODIFIED` and `ESCALATED` genuinely reachable.
- A durable, governed Safety-memory intake/reuse contract for significant, explicitly-stated user Safety facts.
- The exact Candidate/`StandardProposal` threading and Stage 8/9 integration points.
- The Phase-E activation prerequisite this Sub-Spec exists to define.

**Non-Goals.**
- Enumerating specific foods, sports, activities, places, medical conditions, or situations, in the taxonomy or anywhere else.
- A medical diagnostic system, a clinical decision-support tool, or any mechanism that infers, states, or implies a diagnosis, prognosis, or treatment.
- A minimal, allergy-only / activity-only / Nutrition-only / Training-only / Friends-Alpha-scoped mechanism — this Sub-Spec is the final-vision Safety foundation, not a narrower placeholder later expanded.
- Modifying USC-001, TRR-001's own two Canonical Safety Rules, Stage 8/9's own call contracts, Prioritization, Decision Formation's disposition→kind switch, Expression's rendering branches, or DeliveryIntent — all preserved exactly as evidenced, per §19.
- Live wiring/activation of General Reasoning — that is Phase E's own, separate deliverable; this Sub-Spec defines the prerequisite contract Phase E must satisfy (§18), not the wiring itself.
- Thousands of deterministic rules, or a rule per world-concept — the taxonomy and rule set defined here are deliberately small and closed (§08, §13).

---

# 03. Binding Product Principles (Restated, Governing This Sub-Spec Without Exception)

Per your final decision, restated verbatim in substance as the binding constraints this document's every section must satisfy:

1. Risk-characteristic extraction is an **independent Safety mechanism**, structurally separate from `GeneralReasoningCapability` — the model that proposes an answer is never the sole authority on that proposal's own safety.
2. This is the **final-vision Safety foundation** — broad, general, open-world-capable by construction, not a narrow proof scoped to one domain or one Alpha cohort.
3. **USC-001 is not broadened or reopened.** The new mechanism is additive and independent, built on the CPI-001 gate pattern (Option 1 from the evidence report).
4. **Phase D owns the complete Safety contract; Phase E owns live routing/wiring** — but Phase E may never make General Reasoning user-reachable unless every General-Reasoning Candidate is structurally guaranteed to pass through the governed Stage 6→9 Safety pipeline.
5. **Conservative uncertainty is mandatory and uniform** — absence of detected risk never means confirmed safe; no capability may opt out.
6. **No narrow single-dimension proof** — the taxonomy is the closed, governance-shape structure needed for the broad final foundation, describing risk properties/relationships, never world concepts; existing `RiskType`s are reused wherever semantically correct.
7. **Significant Safety facts get durable, governed memory** — explicit governed intake/validation/persistence, never a direct model write, never a speculative inference persisted as an established fact.
8. **`MODIFIED` and `ESCALATED` are part of the target architecture**, not permanently deferred — FITME must be able to leave unchanged, modify into a safer alternative, defer, block, or escalate, per governed conditions, without ever fabricating a diagnosis or becoming a medical system.

Additional binding principles carried forward from `WP0_SPEC_v1.0` and restated here as still-governing: open semantic space / closed control space; the model reasons and proposes, FITME governs; `riskCharacteristicTags` remain advisory until independently validated; no raw AI output gains Safety authority; no provider-session memory becomes authoritative FITME state; TRR zero behavior drift; do not optimize around Friends Alpha.

---

# 04. Canonical Dependencies Read

`docs/specs/SL-001_SPEC_v1.0.md` (in full — the closed `RiskType`/`EvidenceConfidence`/`Correctability`/`Urgency`/disposition-precedence/tie-break canon this Sub-Spec is strictly additive to); `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`; `docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md` (the precedent for additive Stage-9 Candidate-input extension this Sub-Spec's own Candidate-threading follows); `docs/specs/USC_001_SPEC_v1.0.md` (read for scope-boundary confirmation only — **not amended**); `docs/specs/CPI_001_SPEC_v1.0.md` (the reused gate pattern, §09); `docs/specs/TRR_001_SPEC_v1.0.md` (the precedent for additive `CANONICAL_SAFETY_RULES` extension, §13); `docs/specs/WP0_SPEC_v1.0.md` (Revision 3, READY — this Sub-Spec is its own named Phase-D prerequisite, §27/§31/§38).

---

# 05. Repository Baseline

`main` @ `25e84444667a1fbee12a69b12d45b7cc0a09c7b7` (== `origin/main`) **[VERIFIED, reconfirmed this session]** — WP0 Phases A, B, and C implemented and pushed (`321eef2`, `72ef0d1`, `25e8444`). Working tree carries the same 29 dirty/untracked pre-existing paths present throughout this session's entire arc, unchanged, untouched by this document.

---

# 06. Existing-State Evidence (Summary — Full Detail in the Phase-D Evidence Report)

- **Pipeline authority begins at `winnerSelection.js:48`** — no fail-open path exists anywhere in Stage 8/9; every unavailable-port/thrown/malformed condition aborts rather than defaulting to an unreviewed outcome **[VERIFIED]**.
- **`evaluateRulePredicate(dims)`** (`safetyLayer.js:450-475`, read in full this session) is the exact, closed, five-branch precedence function every Canonical Safety Rule's output is judged by — **[VERIFIED]**, quoted precisely because this Sub-Spec's every disposition-mapping claim (§14) is checked against it literally:
  ```
  1. ESCALATED  — dims.escalationRequired===true
                  OR (riskType==='ACTIVE_HIGH_RISK_SYMPTOM' AND urgency==='IMMEDIATE_PROTECTIVE')
                  OR (riskType==='PSYCHOLOGICAL_DISTRESS_CONCERN' AND dims.immediateProtectiveOrProfessionalSupportRequired===true)
                  OR dims.outsideCoachingAuthorityRequiringProfessionalSupport===true
  2. BLOCKED    — riskType not in {NONE,INSUFFICIENT} AND evidenceConfidence not in {INFERENCE,INSUFFICIENT}
                  AND correctability==='REQUIRES_INTENT_CHANGE'
  3. DEFERRED   — riskType==='INSUFFICIENT' OR evidenceConfidence in {INFERENCE,INSUFFICIENT}
                  OR correctability==='INSUFFICIENT' OR urgency==='INSUFFICIENT'
  4. MODIFIED   — riskType not in {NONE,INSUFFICIENT} AND evidenceConfidence not in {INFERENCE,INSUFFICIENT}
                  AND correctability==='BOUNDED_MODIFICATION'
  5. UNMODIFIED — otherwise
  ```
  `reasonCodeForRule()` (`:482-489`): `UNMODIFIED→NO_SAFETY_CONFLICT`; `ESCALATED→PROFESSIONAL_SUPPORT_REQUIRED`; `DEFERRED→INFERRED_SIGNAL_NOT_SUFFICIENT` (if `evidenceConfidence==='INFERENCE'`) else `INSUFFICIENT_SAFETY_CONTEXT`; `BLOCKED`/`MODIFIED→` the matched `riskType` literal.
- **`ABSOLUTE_OVERRIDE_RISK_TYPES`** (Stage 8 binary disqualification, 4 values): `KNOWN_ALLERGY_CONFLICT, ACTIVE_MEDICAL_INSTRUCTION_CONFLICT, ACTIVE_HIGH_RISK_SYMPTOM, PERMANENT_SAFETY_COMMITMENT_CONFLICT` **[VERIFIED]** — a Candidate matching any of these is disqualified at Stage 8, before Stage 9's 5-disposition matrix is even reached.
- **`RISK_TYPES`** (11, closed): `NONE, KNOWN_ALLERGY_CONFLICT, ACTIVE_MEDICAL_INSTRUCTION_CONFLICT, ACTIVE_HIGH_RISK_SYMPTOM, SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT, DANGEROUS_OR_EXTREME_REQUEST, PERMANENT_SAFETY_COMMITMENT_CONFLICT, DISORDERED_EATING_OR_BODY_IMAGE_CONCERN, PSYCHOLOGICAL_DISTRESS_CONCERN, OUTSIDE_COACHING_SCOPE, INSUFFICIENT` — **8 of 11 are schema-only today [VERIFIED]**, precisely the ones this Sub-Spec's new Rule(s) give real producers to.
- **`REASON_CODES`** (13, closed): the 9 `RiskType` conflict literals + `NO_SAFETY_CONFLICT, INSUFFICIENT_SAFETY_CONTEXT, INFERRED_SIGNAL_NOT_SUFFICIENT, PROFESSIONAL_SUPPORT_REQUIRED` **[VERIFIED]**.
- **`CANONICAL_SAFETY_RULES`** (`safetyLayer.js:403-407`) is an array TRR-001 itself already extended twice (Walking, Unresolved-Activity-Coverage rules), establishing direct, working precedent for additive rule extension **[VERIFIED]**.
- **WP0 Phase A–C scaffolding already anticipating this Sub-Spec**: `standardProposalContract.js`'s `isValidRiskCharacteristicTags()` (shape-only today), `capabilityRegistry.js`'s hardcoded, non-overridable `riskTagsAreAdvisoryOnly:true` and empty, explicitly-placeholder `riskCharacteristicDimensions:[]` **[VERIFIED, this session's own code]**.
- **The routing gap**: `conversationalNeedCreator.js`'s Step B only ever constructs a real Opportunity for capability id `'TRR'`; every other Need resolves `UNSUPPORTED`, which never invokes `safetyPort.finalReview()` **[VERIFIED]**. This governs §18's activation prerequisite directly.
- **CPI-001's `preferenceIntakeGate.js`** is the only existing module demonstrating two independent re-verification layers (literal-anchor re-derivation + a second, independent AI-call veto whose *unavailability* is itself treated as a veto) — the reused pattern for §09/§10 **[VERIFIED]**.

---

# 07. Ownership and Authority Boundaries

| Concern | Owner | Authority |
|---|---|---|
| Risk Characteristic taxonomy (dimensions/values) | This Sub-Spec, Product/Architecture-approved | Closed; extension requires a new canonical decision, never an Engineering addition |
| Candidate-content risk characterization (what a proposal touches) | New, independent `riskCharacteristicInterpreter.js` (§09) | Proposes only; never self-authorizing |
| Durable user-constraint recognition/intake | New, independent `riskCharacteristicIntakeGate.js` (§09/§15), structurally parallel to (never replacing) `safetyDisclosureIntakeGate.js` | Governs durable capture; requires consent, literal-anchor re-verification, and an independent Safety-relevant check before any write |
| Deterministic validation of both above | New validator (§10), extending `standardProposalContract.js`'s currently-unconstrained shape check | Sole gate between "AI proposed a tag" and "Safety may consume it" |
| RiskType/ReasonCode/Disposition mapping and evaluation | `safetyLayer.js` (additive new Rule(s) only, §12/§13) | Unmodified existing mechanism (`evaluateRulePredicate`, tie-break, Stage 8/9 call contracts) consumes the new Rule(s)' output exactly as it already consumes TRR's three |
| Durable Safety-fact persistence | Typed Memory (`js/memory.js`), via the new intake gate — same persistence substrate `safety_disclosure` already uses | Never a direct model write; consent-gated; correctable; user-inspectable |
| GeneralReasoningCapability's own proposal content | `generalReasoningCapability.js` | Proposes an action and (new, §16) an optional safe-alternative; never assesses or asserts its own safety |
| A capability's declared `riskCharacteristicDimensions` (`capabilityRegistry.js`) | The declaring capability, Architecture-reviewed at registration | **Planning/optimization hint only — NOT Safety authority** (Round-2 binding decision, §11/§26 item 2). Useful for future cost/latency optimization of the characterization step; **cannot suppress, narrow, or bypass** the unconditional runtime characterization defined in §09.2/§13. An incorrect or empty declaration is never a Safety failure mode by itself, because the runtime path never consults it as a gate. |
| Live routing/activation | Phase E (not this Sub-Spec) | Gated on this Sub-Spec's Definition of Done (§23) being met and verified |

---

# 08. Closed Risk Characteristic Taxonomy

**Design principle, stated once and applied throughout:** every dimension below describes a *property of a risk relationship*, never a world entity. None names a food, sport, activity, place, medical condition, or situation. A never-before-seen activity or food requires **zero** new taxonomy entries — only correct classification of an already-existing, closed dimension/value, exactly mirroring how `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT` is already, today, activity-agnostic by the existing canon's own design (`safetyLayer.js:236-238`).

**`RiskCharacteristicTag` shape:**
```
{
  domain: RiskDomain,               // §08.1 — WHICH kind of risk relationship
  relation: RiskRelationKind,       // §08.2 — WHAT kind of match this is
  severity: ConstraintSeverity,     // §08.3 — HOW consequential, if it matches
  evidenceSource: EvidenceSource,   // §08.4 — WHERE this characterization came from
  anchorText: string | null         // literal substring of the source text this tag is
                                     // grounded in (§10's re-verification target); null only
                                     // when relation === 'NO_KNOWN_CONFLICT'
}
```

### 08.1 — `RiskDomain` (closed, 7 values)

Each value maps, by construction, onto one or more of the 8 currently-schema-only `RISK_TYPES` (§12) — this dimension exists to give the deterministic Rule enough structure to select the *correct existing* RiskType, never to invent a new one.

```
RISK_DOMAINS = [
  'PHYSICAL_EXERTION_OR_MOVEMENT',        // physical intensity/loading/exertion of any kind
  'INGESTION_OR_SUBSTANCE_EXPOSURE',      // anything consumed, applied, or otherwise taken in
  'EATING_PATTERN_OR_BODY_IMAGE',         // restrictive/compensatory/body-image-adjacent framing
  'PSYCHOLOGICAL_OR_EMOTIONAL_STATE',     // distress, crisis-adjacent, or mental-health-relevant framing
  'STANDING_OR_IRREVERSIBLE_COMMITMENT',  // a durable, hard-to-reverse behavioral commitment
  'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED',// requires diagnosis/treatment authority FITME does not hold
  'EXTREME_OR_UNBOUNDED_INTENSITY'        // magnitude/extremity outside ordinary coaching guidance,
                                           // independent of which domain it's extreme within
]
```

### 08.2 — `RiskRelationKind` (closed, 4 values)

Describes the *nature of the match* between a proposal and known evidence, independent of domain:

```
RISK_RELATION_KINDS = [
  'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT',  // proposal conflicts with an explicit, durable,
                                                // governed user Safety fact (§15)
  'ACUTE_STATE_INDICATED_THIS_TURN',           // the CURRENT turn itself indicates an acute
                                                // state (not durable) — e.g., a present-tense
                                                // statement of current symptoms/distress
  'UNRESOLVED_RELEVANCE',                      // the domain is touched and *some* evidence
                                                // exists but conflict cannot be confidently
                                                // determined
  'NO_KNOWN_CONFLICT'                          // domain touched, no conflicting evidence found
                                                // — the ordinary, common, honest case
]
```

### 08.3 — `ConstraintSeverity` (closed, 4 values)

Describes *how consequential* a match is, independent of domain — this is the axis that drives disposition selection (§14):

```
CONSTRAINT_SEVERITY = [
  'ADVISORY',                        // caution-worthy; a safer alternative may allow proceeding
  'PROHIBITIVE',                     // must not proceed as proposed
  'LIFE_CRITICAL',                   // absolute-override territory — always blocks, never silently modified
  'REQUIRES_PROFESSIONAL_JUDGMENT'   // beyond FITME's coaching authority — refer out, never attempt
]
```

### 08.4 — `EvidenceSource` (closed, 3 values)

Describes *where* a tag's evidence came from — this drives `EvidenceConfidence` selection (§12), reusing the existing closed enum without adding to it:

```
EVIDENCE_SOURCES = [
  'DURABLE_GOVERNED_USER_FACT',   // an already-captured, governed Typed Memory Safety fact (§15)
  'CURRENT_TURN_USER_STATEMENT',  // the user's own literal words in this turn
  'AI_CANDIDATE_CHARACTERIZATION' // the independent interpreter's own classification of what
                                   // a PROPOSAL touches (not a claimed fact about the user)
]
```

**Taxonomy size, stated explicitly:** 7 × 4 × 4 × 3 = a bounded, small combinatorial space (most combinations are never populated in practice — see §12's mapping table, which is the actual governing artifact). This is deliberately smaller than, and does not grow with, the number of foods/sports/activities/places FITME will ever need to discuss.

---

# 09. Extraction Contract

**Binding constraint (Product decision 1, 3):** extraction is independent of `GeneralReasoningCapability` and does not extend or modify USC-001. Two new, independent, CPI-001-patterned modules are required — reusing the *pattern*, never the file:

### 09.1 — `riskCharacteristicInterpreter.js` [DESIGN, new module]

Two exported classification functions, both closed-output, bounded-batch, literal-anchor-required (mirroring `safetyContextInterpreter.js`'s own discipline exactly, without importing or modifying it):

**(a) `classifyCandidateContent(proposalActionText)`** — independently classifies what a *proposed action's own content* touches. Input: the `action` free text a reasoning capability (any capability, not just `GeneralReasoningCapability`) produced. Output: zero or more `{domain, anchorText}` pairs — **never** a severity or relation judgment (those require durable-fact matching, which this function has no access to and must not guess at). This is the "independent Safety mechanism assessing the proposal" Product decision 1 requires — it runs *after* a reasoning capability proposes content, as a *second*, separate AI call, never trusting that capability's own self-reported `riskCharacteristicTags`.

**(b) `classifyTurnForDurableConstraint(turnText)`** — recognizes, in the *user's own current turn*, a candidate durable Safety fact — broader in domain than USC-001 (which recognizes only physical-activity restrictions) but identical in rigor: closed `RiskDomain` classification, closed `ConstraintSeverity` self-assessment *proposal* (never trusted directly — re-verified independently downstream, §10), and a required literal `anchorText` substring of the turn's own text. Explicitly scoped, mirroring USC-001's own "when in doubt, abstain" discipline: a statement requiring clinical judgment to resolve into a durable fact is **never** auto-classified as one — ambiguity fails closed to "not recognized," identical in spirit to USC-001's own governing instruction, but implemented independently (Product decision 3 — no shared code with USC-001, structurally parallel only).

Both functions follow the existing bounded-interpreter shape verbatim: `configure({callClaude})`, stateless, per-call timeout, no retry, fail-closed-by-omission on malformed/unknown/duplicate ids, data-not-instructions framing for the classified text.

### 09.2 — Why this does not touch USC-001 or `GeneralReasoningCapability`'s own contract

- USC-001 (`safetyContextInterpreter.js`) is read, never imported by, never modified by either new function — it continues to serve exactly its existing, narrow, physical-activity-restriction role for TRR, unchanged.
- `GeneralReasoningCapability.reason()`'s own output continues to force `riskCharacteristicTags:[]` (unchanged from Phase C) — this Sub-Spec does **not** ask the reasoning capability to self-report tags at all; `classifyCandidateContent()` is invoked *by the orchestrator*, independently, on the capability's `action` text, after the capability has already returned its proposal. The capability itself never sees or influences the risk-characterization step.

### 09.3 — Unconditional execution (Round-2 binding decision, resolving §26 item 2)

**`classifyCandidateContent()` runs unconditionally for every Candidate's action-text content, for every capability, regardless of that capability's own declared `riskCharacteristicDimensions`.** The declaration is never consulted as a precondition for running the characterization step — it has no runtime gating role at all (§07). This is a deliberate strengthening over an earlier draft of this Sub-Spec, which had left open whether a capability declaring `riskCharacteristicDimensions:[]` could cause the step to be skipped for that capability's Candidates; Product/Architecture has now closed that question: a capability declaration must not be able to create a Safety blind spot merely because it was configured incorrectly, omitted a domain, or is a future capability nobody has yet reviewed for this concern. See §11's replaced row and §13/§17 for the corresponding, now-unconditional Rule/orchestrator behavior.

---

# 10. Deterministic Validation / Gating Contract

**Binding constraint (Product decision 3, 5):** modeled directly on `preferenceIntakeGate.js`'s two-independent-layer shape — the strongest existing pattern per the evidence report's own recommendation.

### 10.1 — `riskCharacteristicValidator.js` [DESIGN, extends the shape `standardProposalContract.js` already declares]

Replaces `isValidRiskCharacteristicTags()`'s current unconstrained shape check (`standardProposalContract.js`, present today: "checks only that the field, when present, is shaped correctly — it asserts nothing about Safety's own consumption of it") with real closed-vocabulary membership:
- `domain` ∈ `RISK_DOMAINS` (§08.1) — reject otherwise.
- `relation` ∈ `RISK_RELATION_KINDS` (§08.2) — reject otherwise.
- `severity` ∈ `CONSTRAINT_SEVERITY` (§08.3), required unless `relation==='NO_KNOWN_CONFLICT'` — reject otherwise.
- `evidenceSource` ∈ `EVIDENCE_SOURCES` (§08.4) — reject otherwise.
- `anchorText`: required non-null when `relation !== 'NO_KNOWN_CONFLICT'`; **independently re-verified** as a literal substring of the original source text (`isLiteralSubstringOf()`, the exact mechanism `preferenceIntakeGate.js`/`safetyContextInterpreter.js` already use) — the validator never trusts the interpreter's own claim that its anchor is valid; it recomputes the check itself, byte-for-byte, exactly as `preferenceIntakeGate.js:39-43` already demonstrates for CPI-001.

### 10.2 — `riskCharacteristicIntakeGate.js` [DESIGN, new module, CPI-001-gate-patterned]

Owns **durable** authorization only (candidate-content characterization, §09.1(a), never becomes durable state — see §16 — and does not pass through this gate at all; only §09.1(b)'s durable-constraint candidates do):
1. Shape + literal-anchor re-verification (§10.1), independently re-derived, never trusted from the interpreter.
2. **Explicit consent required** (`memoryConsent.granted===true`), identical gate to CPI-001/Item-6.
3. **An independent, second Safety-relevant check** before authorization — mirroring `preferenceIntakeGate.js.evaluateSafetyVeto()` exactly: this check's own *unavailability* (timeout/throw/malformed) is treated as an **unconditional veto**, never as "assume no conflict." (What this check consults is itself governed by the uncertainty semantics in §11 — it never independently invents new authority; it re-confirms the same closed-vocabulary classification passed shape validation.)
4. Default: `authorized:false` unless every check explicitly passes — the same fail-closed default `preferenceIntakeGate.js:45-47` already establishes.
5. On `authorized:true`, produces a frozen `candidateRecord` for the caller to persist (§15) — this gate itself never writes Firestore/Typed Memory, mirroring `preferenceIntakeGate.js`'s own boundary exactly.

**No capability may bypass this gate.** Both `classifyCandidateContent()`'s output (advisory, per-turn, never durable) and `classifyTurnForDurableConstraint()`'s output (candidate for durable capture) pass through §10.1's shape/anchor validation unconditionally; only the latter additionally passes through §10.2's full authorization gate before any write occurs.

---

# 11. Uncertainty / Failure Semantics

**Binding, uniform, non-optional (Product decision 5):**

| Condition | Required outcome |
|---|---|
| No risk-characteristic evidence produced at all for a domain a proposal touches | **Never** `NO_SAFETY_CONFLICT` by default merely from absence — see §12's Rule design: absence of a *matching durable constraint* legitimately yields `NO_KNOWN_CONFLICT`→`UNMODIFIED` (the honest, common case), but absence of the *extraction step itself having run* (classifier unavailable, timed out, threw) must yield `INSUFFICIENT`→`DEFERRED`, never be silently treated as the former. |
| Malformed/invalid classifier output | Fail-closed by omission (existing pattern) → that tag is dropped, never defaulted to a permissive value; if the *only* tags produced for an otherwise risk-relevant proposal are all dropped, the new Rule (§13) reports `INSUFFICIENT` for that domain, not silence. |
| Model/provider outage during either extraction function | Treated identically to malformed output — the calling Rule sees "extraction did not resolve," which maps to `evidenceConfidence:'INSUFFICIENT'` → `DEFERRED`, per `evaluateRulePredicate()`'s own existing, unmodified branch 3. |
| `relation==='UNRESOLVED_RELEVANCE'` | Maps to `riskType:'INSUFFICIENT'` → `DEFERRED`, `reasonCode:'INSUFFICIENT_SAFETY_CONTEXT'` — reuses `evaluateRulePredicate()`'s existing branch unmodified. |
| Ambiguous durable-constraint recognition (§09.1(b)) | Fails closed to "not recognized" at the *interpreter* level (never becomes a candidate for durable capture at all) — mirrors USC-001's own "when in doubt, abstain" discipline, implemented independently. |
| Conflicting durable evidence (two on-record facts appear to disagree) | Same single-match-required discipline `safetyDisclosureIntakeGate.js`'s correction logic already uses: an ambiguous correction preserves all existing facts; a new, unresolvable conflict is never silently resolved in either direction — reported as `UNRESOLVED_RELEVANCE`. |
| A capability declares an empty or incomplete `riskCharacteristicDimensions:[]` while its Candidate's content is independently characterized as touching a governed domain | **RESOLVED (Round-2 binding decision, §26 item 2). The declaration has no runtime suppressive power at all.** `classifyCandidateContent()` runs unconditionally, for every capability, regardless of what that capability declared (§09.3). If the independent characterization finds Safety-relevant content, the governed path (§10/§12/§13) applies exactly as it would for any other capability — an incorrect, stale, or empty declaration **cannot** cause a domain to be skipped, and is never treated as evidence of "no risk." The declaration remains useful for planning/optimization (e.g., a future cost/latency optimization that skips characterization only when a capability is *itself* provably incapable of producing risk-relevant content, a mechanism this Sub-Spec does not define or authorize) but is **not Safety authority** and is never consulted as a gate on whether characterization runs (§07). |

**This is the single most important divergence from today's existing precedent**, stated precisely once more: Rules 1/2 (`matchRunningMedicalRestrictionRule`/`matchWalkingMedicalRestrictionRule`) today treat "no `userSafetyContext`" identically to "confirmed no restrictions" — both clear silently. **The new Rule(s) this Sub-Spec defines must not inherit that precedent.** They must instead generalize `matchUnresolvedActivitySafetyCoverageRule`'s own, already-proven, conservative-defer-on-uncertainty behavior — which the evidence confirms already exists and already works, just narrowly scoped to one activity pair today.

---

# 12. Mapping: Governed Risk Characteristics → Existing RiskTypes / Rule Evaluation

**No new `RiskType`, `ReasonCode`, or `Disposition` value is introduced.** Every mapping below targets an existing, closed enum member — the majority currently schema-only, exactly the vocabulary already reserved and waiting.

| `RiskDomain` | `ConstraintSeverity` | → `riskType` | → `evidenceConfidence` | → `correctability` | → `urgency` / booleans |
|---|---|---|---|---|---|
| `PHYSICAL_EXERTION_OR_MOVEMENT` | `LIFE_CRITICAL`, `relation='ACUTE_STATE_INDICATED_THIS_TURN'` | `ACTIVE_HIGH_RISK_SYMPTOM` | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` | `urgency='IMMEDIATE_PROTECTIVE'` → **ESCALATED** (branch 1 of `evaluateRulePredicate`, exact match on `riskType==='ACTIVE_HIGH_RISK_SYMPTOM' && urgency==='IMMEDIATE_PROTECTIVE'`) |
| `PHYSICAL_EXERTION_OR_MOVEMENT` | `PROHIBITIVE`, `relation='DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT'`, evidence durable + explicitly medical-instruction-shaped | `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT` (existing, now reachable for any activity, not only RUNNING/WALKING) | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` | `ROUTINE_PROTECTIVE` → **BLOCKED** |
| `PHYSICAL_EXERTION_OR_MOVEMENT` | `PROHIBITIVE`, durable constraint but not explicitly medical-instruction-shaped (e.g. a stated recovery/injury constraint) | `SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT` | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` or `BOUNDED_MODIFICATION` (if a safe alternative is available, §14) | → **BLOCKED** or **MODIFIED** |
| `INGESTION_OR_SUBSTANCE_EXPOSURE` | `LIFE_CRITICAL`/`PROHIBITIVE`, `relation='DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT'` | `KNOWN_ALLERGY_CONFLICT` (already an `ABSOLUTE_OVERRIDE_RISK_TYPE` — Stage 8 disqualifies before Stage 9 even runs) | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` | → **BLOCKED** (or disqualified at Stage 8) |
| `EATING_PATTERN_OR_BODY_IMAGE` | `PROHIBITIVE`/`ADVISORY`, `relation='DIRECT_CONFLICT...'` or `'ACUTE_STATE_INDICATED_THIS_TURN'` | `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN` | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` or `BOUNDED_MODIFICATION` | → **BLOCKED** or **MODIFIED** |
| `PSYCHOLOGICAL_OR_EMOTIONAL_STATE` | `REQUIRES_PROFESSIONAL_JUDGMENT`, `relation='ACUTE_STATE_INDICATED_THIS_TURN'` | `PSYCHOLOGICAL_DISTRESS_CONCERN` | `EXPLICIT_USER_STATEMENT` | `NOT_APPLICABLE` | `immediateProtectiveOrProfessionalSupportRequired:true` → **ESCALATED** (branch 1, exact existing predicate) |
| `PSYCHOLOGICAL_OR_EMOTIONAL_STATE` | `ADVISORY` | `PSYCHOLOGICAL_DISTRESS_CONCERN` | `EXPLICIT_USER_STATEMENT` | `BOUNDED_MODIFICATION` | → **MODIFIED** |
| `STANDING_OR_IRREVERSIBLE_COMMITMENT` | `LIFE_CRITICAL` (already an `ABSOLUTE_OVERRIDE_RISK_TYPE`) | `PERMANENT_SAFETY_COMMITMENT_CONFLICT` | `EXPLICIT_USER_STATEMENT` | `REQUIRES_INTENT_CHANGE` | → **BLOCKED** (or disqualified at Stage 8) |
| `MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED` | `REQUIRES_PROFESSIONAL_JUDGMENT` | `OUTSIDE_COACHING_SCOPE` | `EXPLICIT_USER_STATEMENT` | `NOT_APPLICABLE` | `outsideCoachingAuthorityRequiringProfessionalSupport:true` → **ESCALATED** (branch 1, exact existing predicate — this boolean, not riskType alone, is required to avoid falling into BLOCKED via branch 2) |
| `EXTREME_OR_UNBOUNDED_INTENSITY` | `PROHIBITIVE`/`LIFE_CRITICAL` | `DANGEROUS_OR_EXTREME_REQUEST` | `EXPLICIT_USER_STATEMENT` or `AI_CANDIDATE_CHARACTERIZATION`→`INFERENCE` | `REQUIRES_INTENT_CHANGE` | → **BLOCKED** (`EXPLICIT_USER_STATEMENT` path) or → **DEFERRED** (`AI_CANDIDATE_CHARACTERIZATION`/`INFERENCE` path, per §12.1 below — never BLOCKED from inference-confidence evidence alone) |
| *(any domain)* | *(any)*, `relation='UNRESOLVED_RELEVANCE'` or extraction unavailable (§11) | `INSUFFICIENT` | `INSUFFICIENT` (or `INFERENCE` if the sole issue is low-confidence AI characterization) | `INSUFFICIENT` | → **DEFERRED** (branch 3, exact existing predicate) |
| *(any domain)* | `relation='NO_KNOWN_CONFLICT'` | *(no dims tuple produced — the honest, common case)* | — | — | → contributes nothing; other Rules/absence of any match → **UNMODIFIED** |

**`EvidenceSource='AI_CANDIDATE_CHARACTERIZATION'` always maps to `evidenceConfidence='INFERENCE'`, never `'EXPLICIT_USER_STATEMENT'`** — this is the exact, principled distinction between "the user said X" and "the model's own classification of what its proposal touches" — reusing the existing enum's own designed meaning without redefinition.

### 12.1 — `EXTREME_OR_UNBOUNDED_INTENSITY` (Round-2 binding decision, resolving §26 item 4)

**No universal deterministic numeric threshold exists for this domain, and this Sub-Spec does not invent one.** "Extreme" is not a number this mechanism can compute (no rep count, load, duration, or caloric figure is, by itself, universally extreme or safe — it depends on context this closed taxonomy deliberately does not model). Accordingly:

- Detection of this domain is **bounded semantic characterization**, produced by `classifyCandidateContent()`/`classifyTurnForDurableConstraint()` exactly like every other domain (§09) — not a numeric rule.
- Because it is AI-produced, it carries `evidenceSource='AI_CANDIDATE_CHARACTERIZATION'` → `evidenceConfidence='INFERENCE'` by the same unmodified mapping every other AI-sourced tag uses (§08.4) — **it is never treated as authoritative on its own**, exactly like any other inference-confidence evidence.
- Deterministic Safety (`evaluateRulePredicate()`, unmodified) retains final authority: `INFERENCE`-confidence evidence for this domain cannot reach `BLOCKED` (branch 2 requires evidence confidence outside `{INFERENCE,INSUFFICIENT}`) — it resolves to **DEFERRED** (branch 3), the conservative governed path, exactly as §12's table now states.
- Where a user has **explicitly stated** an extreme intent in their own words (`evidenceSource='CURRENT_TURN_USER_STATEMENT'` via `classifyTurnForDurableConstraint()`, mapping to `evidenceConfidence='EXPLICIT_USER_STATEMENT'`), the existing, unmodified `BLOCKED` path applies — this is not new; it is the same `EXPLICIT_USER_STATEMENT` row already in §12's table, unaffected by this resolution.
- **This is a general contract, not a permanent ceiling.** A future capability may supply genuinely deterministic, authoritative evidence for some *specific* instance of extremity (e.g., a future capability with real access to a physiological limit or a validated deterministic formula) by producing `evidenceSource='EXPLICIT_USER_STATEMENT'`-tier or a future, separately-approved deterministic evidence source — without requiring any change to this domain's general mapping structure, this Sub-Spec's taxonomy, or `evaluateRulePredicate()` itself. This Sub-Spec neither promises nor precludes such a future capability; it only confirms the existing mapping structure already accommodates one if and when Product/Architecture approves it.

---

# 13. Canonical Safety Rules Required for Broad Coverage

**Exactly one new Rule function is required, not several** — the taxonomy's own generality (§08) is precisely what avoids needing a rule per domain. `matchGovernedRiskCharacteristicRule(candidate, terminalDecision, pipelineContext)` [DESIGN, new function in `safetyLayer.js`]:

1. Reads `candidate.riskCharacteristicTags` (§16) — the *independently re-derived and validated* tags (§09/§10), never the reasoning capability's own self-report.
2. For each tag with `relation !== 'NO_KNOWN_CONFLICT'`, applies the §12 mapping table deterministically (pure lookup, no further AI call) to produce a dims-tuple.
3. Concatenates results exactly as the existing 3 rules already do — this function's return shape is byte-identical to `matchUnresolvedActivitySafetyCoverageRule`'s own return contract, consumed by the same, unmodified `evaluateCanonicalSafetyRules()`/`selectWinningDisposition()`/`selectPrimaryAndSecondary()` machinery.
4. Added additively to `CANONICAL_SAFETY_RULES` (`safetyLayer.js:403-407`) — the exact same extension mechanism TRR-001 already used twice.

**Why one rule suffices for "broad coverage":** the Rule's own logic is a pure, deterministic lookup against the closed mapping table (§12) — it never needs domain-specific code, because the *taxonomy itself* (not the Rule) is what carries the generality. Adding a future domain-relevant case requires, at most, a new *row* in the mapping table (a canonical, Product/Architecture-owned data change), never new Rule *code*.

**This Rule runs unconditionally, including against TRR's own Candidates (Round-2 binding decision, §09.3/§11/§26 item 2) — TRR's outcomes remain provably unaffected, but "zero drift" is now demonstrated as golden-master *outcome* equivalence, not code-path exemption.** An earlier draft of this Sub-Spec stated that TRR Candidates were structurally exempt from this Rule because TRR declares `riskCharacteristicDimensions:[]`. That framing is superseded: per the Round-2 binding decision, no capability's declaration may suppress runtime characterization, so `classifyCandidateContent()` and this Rule both execute against TRR-produced Candidates the same as any other. The reconciliation is that this remains fully compatible with the pre-existing, still-binding "TRR zero behavior drift" principle, because:
- `matchGovernedRiskCharacteristicRule` is purely additive/protective by construction (§14) — per `evaluateRulePredicate()`'s own unmodified precedence logic, a dims-tuple this Rule contributes can only ever raise or match the disposition Rules 1/2 already select, never lower it or override it in Safety's favor. It has no mechanism to *remove* protection Rules 1/2 already provide.
- For TRR's own existing, already-reviewed request/response corpus, `classifyCandidateContent()` is expected — and required by this Sub-Spec's acceptance criteria (§23) — to independently resolve to `relation='NO_KNOWN_CONFLICT'` for that corpus, meaning this Rule contributes nothing and TRR's dispositions are golden-master-provable as byte-identical, exactly as Phase B's own precedent already established for a different migration.
- If, for some TRR Candidate, characterization ever legitimately found a governed conflict, that would mean TRR's own existing 2 Rules had a real, undetected coverage gap — which is precisely the failure mode Product/Architecture's Round-2 decision exists to close, not a violation of TRR's zero-drift guarantee. TRR's zero-drift guarantee has always meant "no unreviewed change to TRR's own observable behavior," never "TRR's Candidates are permanently exempt from future, independently-approved Safety coverage."
- This reconciliation is disclosed explicitly rather than silently assumed; see §17 for the corresponding orchestrator-wiring implication and §19 for the restated compatibility-table entry, and §25 for the Engineering Self-Review pass addressing it directly.

---

# 14. MODIFIED / DEFERRED / BLOCKED / ESCALATED Semantics

Per Product decision 8, all five dispositions are part of the target architecture. Their canonical meaning, restated precisely for this Sub-Spec's own new Rule:

- **UNMODIFIED** — no governed risk-characteristic conflict found; the proposal is delivered exactly as reasoned. (Already fully reachable; unaffected by this Sub-Spec.)
- **DEFERRED** — evidence is genuinely insufficient (extraction unavailable, ambiguous relevance, or a domain touched with no resolvable durable evidence either way). FITME does not answer this turn's specific risk-relevant content; it does not guess. (Already reachable via Rule 3's existing generic-unresolved pattern; this Sub-Spec's new Rule generalizes it across all 7 domains.)
- **BLOCKED** — a `PROHIBITIVE` or `LIFE_CRITICAL` conflict exists and no safe, validated alternative is available. The proposal is refused, never silently delivered. (Already reachable.)
- **MODIFIED** — a `PROHIBITIVE`-severity conflict exists **and** a safe, independently-validated alternative is available. **Newly reachable by this Sub-Spec.** Content-sourcing contract: `GeneralReasoningCapability`'s reasoning output gains one new, optional field, `safeAlternative` (additive to `StandardProposal`, §16) — the reasoning capability MAY propose a bounded alternative alongside its primary proposal, structurally analogous to how TRR's own component already proposes exactly one outcome among a closed set. **The alternative itself is never trusted directly** — it is passed back through the identical `classifyCandidateContent()` characterization (§09.1(a)) and must independently resolve to `relation='NO_KNOWN_CONFLICT'` for the same domain before Safety's `finalReview()` may set `modifiedContent` to it. If the alternative cannot be independently cleared, the disposition falls back to `DEFERRED`/`BLOCKED` as the mapping table (§12) otherwise dictates — **MODIFIED is never produced from an unverified model-proposed substitute.** TRR is not required to support `safeAlternative`; it remains BLOCKED/DEFERRED-only, unaffected (TRR zero drift).
- **ESCALATED** — either an acute high-risk physical symptom with `IMMEDIATE_PROTECTIVE` urgency, an acute psychological-distress indicator requiring professional support, or a request genuinely `OUTSIDE_COACHING_SCOPE` requiring professional/clinical judgment. **Newly reachable by this Sub-Spec**, via the two existing, already-coded predicate branches (`riskType==='ACTIVE_HIGH_RISK_SYMPTOM' && urgency==='IMMEDIATE_PROTECTIVE'`; `riskType==='PSYCHOLOGICAL_DISTRESS_CONCERN' && immediateProtectiveOrProfessionalSupportRequired===true`) plus the generic `outsideCoachingAuthorityRequiringProfessionalSupport` boolean — **no new predicate branch is required in `evaluateRulePredicate()` itself**; the existing function already anticipates exactly this. Expression's own existing `isWp6EscalationCase` rendering path (already built, currently unreachable only for lack of a producer) requires no change. **`ESCALATED` never fabricates a diagnosis or treatment recommendation** — its Expression rendering (unchanged, existing) is scoped to acknowledging the concern and directing the user to appropriate professional support, consistent with FITME's binding "not a medical system" principle; this Sub-Spec does not alter that rendering content, only makes the disposition path reachable.

---

# 15. Durable Safety-Memory Intake and Reuse Contract

Per Product decision 7. **Structurally parallel to, never a modification of,** the existing `safetyDisclosureIntakeGate.js`/`type:'safety_disclosure'` mechanism:

- **New, dedicated Typed Memory type (RESOLVED, Round-2 binding decision, §26 item 3).** A **new**, closed `type:'risk_characteristic_fact'` Typed Memory record is added to `js/memory.js`'s existing closed type vocabulary, as one additive value (per that file's own established, closed-type discipline). The existing `type:'safety_disclosure'` record shape, its intake gate (`safetyDisclosureIntakeGate.js`), and every one of its existing fields are **left completely untouched** — this Sub-Spec does not overload, extend, or reinterpret it. The new type carries: `{riskDomain, severity, literalStatementText (bounded, ≤80 chars, matching CPI-001's own bound), sourceTurnId, confidence:1, source:'user_stated', status:'active'}` — never a numeric AI confidence score, never free-form unbounded text, mirroring every existing durable-fact record's own shape discipline exactly, and preserving — as a hard requirement of this resolution, not an optional nicety — the same consent, provenance, explicit-user-statement authority, correction/supersession, and transparency-sheet requirements already defined for `safety_disclosure` (§11, §15's own correction-discipline paragraph, §20).
- **Intake**: exclusively via `riskCharacteristicIntakeGate.js` (§10.2) — consent-gated, literal-anchor re-verified, independently Safety-vetoed. **Never a direct write from `GeneralReasoningCapability` or any reasoning capability.**
- **Correction/supersession**: reuses `safetyDisclosureIntakeGate.js`'s own proven single-match-required discipline (§11) — an ambiguous or multi-match correction attempt preserves all existing facts untouched; only an explicit, unambiguous statement clears a prior fact.
- **Speculative inference never persists as fact**: `classifyCandidateContent()`'s output (`evidenceSource='AI_CANDIDATE_CHARACTERIZATION'`) is **categorically excluded** from durable capture — only `classifyTurnForDurableConstraint()`'s output (`evidenceSource='CURRENT_TURN_USER_STATEMENT'`), after passing the full intake gate, may become a `evidenceSource='DURABLE_GOVERNED_USER_FACT'` record for future reuse. This is a hard, structural boundary, not a policy convention — the two extraction functions produce data with different downstream eligibility by construction (§09.1).
- **Reuse**: once durable, a fact becomes available to §13's Rule (as `DURABLE_GOVERNED_USER_FACT` evidence) for **any future turn**, across any capability, exactly mirroring how a durable `safety_disclosure` restriction already informs every future RUNNING/WALKING candidate today.
- **User transparency/correction**: durable risk-characteristic facts must be visible and correctable in the existing "מה המאמן יודע עליי" transparency sheet (`js/memory.js`), exactly as `safety_disclosure` records already are — no new UI mechanism required, only inclusion in the existing sheet's existing grouping logic.

---

# 16. Candidate / StandardProposal Threading

**`StandardProposal` gains one new, optional field**, additive to the shape `standardProposalContract.js` already declares:
```
StandardProposal {
  ... (all Phase C fields unchanged) ...
  riskCharacteristicTags: []   // UNCHANGED FIELD NAME, but no longer forced empty by
                                // GeneralReasoningCapability once this Sub-Spec is implemented —
                                // populated by the orchestrator's independent characterization
                                // step (§09.1(a)), never by the reasoning capability itself
  safeAlternative: {            // NEW, optional — §14's MODIFIED content-sourcing mechanism
    action: string, rationale: string, evidenceBasis: string, expectedValue: string, uncertainty: string
  } | null
}
```
**Critical distinction, restated precisely:** the reasoning capability's own output continues to carry `riskCharacteristicTags` as a field name for shape-compatibility, but **the capability itself never populates it with authority** — Phase C's existing forced-`[]` behavior is replaced by the orchestrator's own, independent post-processing step (§09.1(a)) overwriting it with genuinely independently-derived tags **after** the capability returns, never trusting whatever the capability itself might have set. This satisfies Product decision 1 precisely: the model is never the assessor of its own proposal's safety, even though the field lives on the same object for pipeline-shape convenience.

**Candidate construction** (Stage 6 dispatch — the same site TRR's `actionCategory`/`activityReference` are already threaded onto): gains the same additive `riskCharacteristicTags`/`safeAlternative` fields, sourced from the orchestrator's post-processing step, not from the raw `StandardProposal`.

---

# 17. Stage 8/9 Integration

**No change to `disqualify()`'s or `finalReview()`'s own call signatures, to `winnerSelection.js`, to `decisionFormation.js`'s disposition→kind switch, or to `expressionRenderer.js`'s rendering branches.** The new Rule (§13) is consumed by the exact same, already-generic `matchCanonicalSafetyRules()` call both Stage 8 and Stage 9 already make — Stage 8's binary check already filters on `ABSOLUTE_OVERRIDE_RISK_TYPES` membership (a frozen array requiring no edit, since `KNOWN_ALLERGY_CONFLICT`/`PERMANENT_SAFETY_COMMITMENT_CONFLICT`/`ACTIVE_HIGH_RISK_SYMPTOM`/`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT` are already members), and Stage 9's full disposition matrix already handles every disposition the new Rule can produce, because `evaluateRulePredicate()` was already written generically enough to include the `ESCALATED`/`MODIFIED` branches this Sub-Spec activates for the first time.

The one genuinely new integration point is upstream of Stage 8: the independent candidate-content characterization step (§09.1(a)) must run **unconditionally, for every capability's Candidates — including TRR's — regardless of any capability's own declared `riskCharacteristicDimensions`** (§09.3, Round-2 binding decision superseding an earlier draft that scoped this step to only "capabilities declaring non-empty `riskCharacteristicDimensions`"). It runs **between** that capability's own reasoning call and Stage 6 Candidate dispatch — the exact same architectural seam TRR-001 already established and its own header names explicitly ("CARF's own canonical seam: bounded Reasoning Context → AI Reasoning → strict validation, all BETWEEN Stage 5 and Stage 6 — never before, never after"). This Sub-Spec's new step reuses that seam a second time, for a second purpose, rather than inventing a new one.

**Disclosed implementation-scope implication for TRR specifically:** because the step is now unconditional, `internalPipelineOrchestrator.js`'s existing TRR branch — not only a future `GeneralReasoningCapability` branch — gains this one new step ahead of Stage 6 dispatch when Phase D.6 (§22) is implemented. This was not true under this Sub-Spec's earlier draft (which read TRR's `riskCharacteristicDimensions:[]` as a structural exemption from the step itself, not merely from that step ever finding anything). §13 and §19 restate why this remains fully compatible with TRR's zero-drift guarantee, reframed precisely as golden-master **outcome** equivalence: TRR's own branch gains one additional, purely additive characterization call whose expected, acceptance-tested result (§23) is `NO_KNOWN_CONFLICT` for TRR's existing corpus, contributing nothing to TRR's dispositions, while remaining structurally available to catch a genuine, previously-undetected coverage gap should one ever exist.

---

# 18. GeneralReasoning Phase-E Activation Prerequisite

Per Product decision 4, restated as the binding gate: **Phase E may not flip `GeneralReasoningActivationGate.__setLiveFallbackApprovedForTests__`-equivalent production switch until, structurally, every path that could route a Need to `GeneralReasoningCapability` also guarantees that capability's resulting proposal reaches a real Candidate that passes through Stage 6→9 unconditionally** — never a shortcut analogous to today's `UNSUPPORTED` path, which the evidence confirms never invokes `finalReview()` at all.

Concretely, this requires Phase E's own routing work (not this Sub-Spec's to design, but its prerequisite to state precisely) to ensure: whatever mechanism resolves a Need to the `FALLBACK` capability (today, `CapabilityRegistry.resolveCapability()`'s own FALLBACK branch, currently unreached from the live seam per Phase B/C's own disclosed findings) always constructs a real Opportunity/Candidate — never a `kind:'UNSUPPORTED'` outcome for a Need that legitimately resolved to `GeneralReasoningCapability`. This Sub-Spec's own Definition of Done (§23) includes a direct test of this property.

---

# 19. Compatibility / Zero-Drift Requirements

| Requirement | How preserved |
|---|---|
| TRR zero drift (reframed as golden-master **outcome** equivalence, Round-2 binding decision, §13/§17) | `riskCharacteristicDimensions:[]` unchanged on TRR's declaration (still true, but now a planning hint only, §07 — not a code-path exemption); TRR's own 2 rules, reasoning component, and interpreters (USC-001 included) remain completely unmodified; the new characterization step and Rule (§13) now execute unconditionally against TRR's Candidates too, but are acceptance-tested (§23) to independently resolve `NO_KNOWN_CONFLICT` for TRR's existing corpus and contribute nothing to TRR's dispositions — proven byte-identical via golden-master tests, exactly as Phase B's own precedent already established, rather than via structural non-execution |
| USC-001 untouched | Confirmed — no import, no modification, no scope change; the new interpreter (§09) is fully independent |
| Existing RiskType/ReasonCode/Disposition contracts | Zero new enum values; every mapping (§12) targets existing, closed members |
| Stage 8/9 authority, `winnerSelection.js`, `finalReview()` | Zero signature changes; the Stage-9 Winning-Candidate correction's existing `candidate` parameter already supports this Sub-Spec's needs |
| Decision Formation, Expression, DeliveryIntent | Zero changes — `MODIFIED`/`ESCALATED` rendering paths already exist, built and unreachable only for lack of a producer |
| `riskCharacteristicTags` advisory-only | `capabilityRegistry.js`'s existing hardcoded `riskTagsAreAdvisoryOnly:true` (non-overridable at registration) already enforces this structurally; this Sub-Spec adds no new override path |
| No raw AI output gains Safety authority | Every tag passes independent re-derivation + validation (§10) before Safety ever consumes it; `safeAlternative` content is independently re-characterized before it may become `modifiedContent` |

---

# 20. Privacy / Provenance Requirements

- Every durable risk-characteristic fact carries `source:'user_stated'`, `confidence:1`, a literal `sourceTurnId`, and a bounded (`≤80 char`) literal statement text — never a numeric AI confidence score, never unbounded free text, mirroring CPI-001/Item-6's existing privacy discipline exactly (§15).
- No new PII category beyond what `safety_disclosure` already establishes precedent for — a literal, bounded substring of text the user already typed into a surface they control and can delete.
- Candidate-content characterization (`AI_CANDIDATE_CHARACTERIZATION` evidence) is **never persisted** — it exists only for the duration of the current Decision Pass, exactly mirroring the existing advisory-context degradation pattern (never written to Firestore).
- No new telemetry payload carries statement content — failures report only closed `code`/`module`/`operation` identifiers via the existing `ErrorTelemetry`, matching every existing Safety-adjacent module's own discipline.
- User-visible, correctable, deletable — durable facts appear in the existing transparency sheet (§15); no new UI surface required.

---

# 21. Pressure-Test Matrix (8 Evidence-Report Scenarios + Additional Open-World Cases)

| # | Scenario | Under this Sub-Spec's mechanism (once wired by Phase E) |
|---|---|---|
| 1 | Slept 4h, hard workout? | `readinessStateContext` unchanged (TRR's own path); if TRR doesn't apply and General Reasoning does, `classifyCandidateContent()` tags `PHYSICAL_EXERTION_OR_MOVEMENT`; absent a durable constraint, `NO_KNOWN_CONFLICT` → UNMODIFIED, honestly, not falsely cautious |
| 2 | Knee pain + wants to try bouldering | `classifyTurnForDurableConstraint()` recognizes a candidate `PHYSICAL_EXERTION_OR_MOVEMENT`/`ACUTE_STATE_INDICATED_THIS_TURN` signal from "knee pain" even though bouldering itself is unnamed in any vocabulary; `classifyCandidateContent()` independently tags the proposal's own `PHYSICAL_EXERTION_OR_MOVEMENT` domain; the new Rule matches domain-to-domain (not activity-to-activity) → at minimum `DEFERRED`, correctly non-silent, without ever needing to know what "bouldering" is |
| 3 | Peanut allergy — what to order? | `classifyTurnForDurableConstraint()` recognizes `INGESTION_OR_SUBSTANCE_EXPOSURE`/`LIFE_CRITICAL` (allergy) → durable capture (§15, consent-gated) → future proposals independently characterized as `INGESTION_OR_SUBSTANCE_EXPOSURE` are checked against it → `KNOWN_ALLERGY_CONFLICT`, an `ABSOLUTE_OVERRIDE_RISK_TYPE` → BLOCKED at Stage 8, without any food-specific rule ever being written |
| 4 | Fasting, should I train? | `PHYSICAL_EXERTION_OR_MOVEMENT` + possibly `INGESTION_OR_SUBSTANCE_EXPOSURE` (absence of intake) tags; absent a durable conflict, `NO_KNOWN_CONFLICT`/`UNRESOLVED_RELEVANCE` depending on extraction confidence — honest either way |
| 5 | Pregnant — can I do this exercise? | `classifyTurnForDurableConstraint()` recognizes `STANDING_OR_IRREVERSIBLE_COMMITMENT`-or-`PHYSICAL_EXERTION_OR_MOVEMENT`-adjacent durable state (a genuinely uncertain classification the interpreter is instructed to handle conservatively, §09.1(b)) → durable capture if unambiguous, or `UNRESOLVED_RELEVANCE`→DEFERRED if not — never silently cleared |
| 6 | On medication X — is this supplement OK? | `classifyTurnForDurableConstraint()` recognizes `INGESTION_OR_SUBSTANCE_EXPOSURE`/`REQUIRES_PROFESSIONAL_JUDGMENT` — this is exactly the `MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED` domain in combination → `OUTSIDE_COACHING_SCOPE` + `outsideCoachingAuthorityRequiringProfessionalSupport:true` → **ESCALATED**, referring the user appropriately rather than FITME attempting the interaction judgment itself |
| 7 | Exhausted after night shift, should I run? | Same shape as scenario 1 — `PHYSICAL_EXERTION_OR_MOVEMENT`/`ACUTE_STATE_INDICATED_THIS_TURN`, honest `NO_KNOWN_CONFLICT` absent a durable constraint |
| 8 | Never-enumerated activity (parkour) | `classifyCandidateContent()` tags `PHYSICAL_EXERTION_OR_MOVEMENT` from the proposal's own content — **without any activity-name vocabulary at all** — the domain-level match works identically whether the activity is parkour, curling, or something not yet invented |
| 9 (new) | "אני מרגיש שאני רוצה לפגוע בעצמי" (I feel like I want to hurt myself) | `classifyTurnForDurableConstraint()`/`classifyCandidateContent()` tags `PSYCHOLOGICAL_OR_EMOTIONAL_STATE`/`ACUTE_STATE_INDICATED_THIS_TURN`/`REQUIRES_PROFESSIONAL_JUDGMENT` → `PSYCHOLOGICAL_DISTRESS_CONCERN` + `immediateProtectiveOrProfessionalSupportRequired:true` → **ESCALATED**, never a fabricated therapeutic response |
| 10 (new) | "אני רוצה להפסיק לאכול לגמרי לשבוע" (I want to stop eating entirely for a week) | `EATING_PATTERN_OR_BODY_IMAGE`/`PROHIBITIVE` → `DISORDERED_EATING_OR_BODY_IMAGE_CONCERN` → BLOCKED or MODIFIED (if a validated safer alternative exists) |
| 11 (new) | A genuinely novel food never seen before, containing a known allergen class the user has on record for a *different* named food | `classifyCandidateContent()`'s own domain tag (`INGESTION_OR_SUBSTANCE_EXPOSURE`) matches the durable constraint's *domain*, not a specific food-name lookup — the mapping operates on the relationship, not the world-object, so this is caught identically to scenario 3 without any new vocabulary |
| 12 (new) | A request to commit to a permanent, extreme dietary rule ("I will never eat carbohydrates again") | `STANDING_OR_IRREVERSIBLE_COMMITMENT`/`LIFE_CRITICAL` → `PERMANENT_SAFETY_COMMITMENT_CONFLICT`, an `ABSOLUTE_OVERRIDE_RISK_TYPE` → BLOCKED at Stage 8 |

---

# 22. Exact Implementation Phases

**Phase D.1** — Taxonomy + validator: `riskCharacteristicValidator.js`/narrowed `standardProposalContract.js`, no AI, fully unit-testable in isolation, zero pipeline wiring.
**Phase D.2** — Extraction interpreters: `riskCharacteristicInterpreter.js` (both functions), unit-tested with mocked `callClaude`, not yet invoked from any live orchestrator path.
**Phase D.3** — Intake gate: `riskCharacteristicIntakeGate.js`, unit-tested, not yet invoked live.
**Phase D.4** — Safety Rule: `matchGovernedRiskCharacteristicRule`, added to `CANONICAL_SAFETY_RULES`, golden-master-tested against the existing 3 rules' own test corpus to prove zero drift (mirrors WP0 Phase B's own proven golden-master discipline).
**Phase D.5** — Durable-memory intake wiring: the `js/app.js` persistence path (mirrors `persistSafetyDisclosureRecord()`'s own shape) + transparency-sheet inclusion.
**Phase D.6** — Candidate/StandardProposal threading (§16) + the independent post-processing step (§09.1(a)) inserted at the proven Stage-5/6 seam — still not wired to any *live* routing seam; testable only via direct invocation, mirroring Phase C's own "registered, not live" discipline exactly.
**Definition of Done for the Sub-Spec itself (Phase D complete):** all of D.1–D.6 implemented, tested, golden-master-proven against zero TRR drift, full regression green — **Phase E's own live-wiring work does not begin under this Sub-Spec.**

---

# 23. Acceptance Tests / Definition of Done

- Taxonomy/validator: every closed enum member round-trips; every malformed/out-of-vocabulary value is rejected; literal-anchor re-verification independently re-derives (never trusts) the interpreter's own claim.
- Extraction: both interpreter functions produce correctly-shaped, closed-vocabulary output for representative fixtures across all 7 domains; fail-closed on timeout/throw/malformed, matching the existing bounded-interpreter test corpus's own conventions.
- Intake gate: consent-gated, single-match-required correction discipline, independent-veto-on-unavailability, mirrored directly against `preferenceIntakeGate.js`'s own existing test shape.
- Safety Rule: golden-master proof that TRR's own existing Candidates produce byte-identical dispositions before/after this Rule's addition (zero drift); the mapping table (§12) is exercised for every row with a dedicated test case, including both `ESCALATED` branches and the `MODIFIED`/`safeAlternative` re-characterization loop.
- Durable memory: capture/correction/supersession/transparency-sheet-visibility round-trip tests, mirroring `safety_disclosure`'s own existing test corpus shape.
- Full 12-scenario pressure-test matrix (§21) executable as controlled tests (mocked `callClaude`), each asserting the specific disposition this Sub-Spec's mapping table predicts.
- Full existing regression suite green, zero existing assertion altered.
- **Explicit negative proof**: a genuinely never-enumerated activity/food/situation (reusing the WP0 Phase C precedent of a verified-absent-from-the-repository test concept) receives correct domain-level risk characterization and correct disposition **with zero code added for that specific concept** — the direct architectural proof this Sub-Spec was commissioned to deliver.

---

# 24. Exact Canonical Documents Affected

- **New**: this Sub-Spec itself (`docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md`).
- **`docs/specs/SL-001_SPEC_v1.0.md` / `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md`**: additive amendment note documenting the new Canonical Safety Rule — precedented by TRR-001's own two prior additive Rule extensions; **no enum reopening required**.
- **`docs/specs/WP0_SPEC_v1.0.md`**: a future revision should reference this Sub-Spec by name and mark §27/§31 Phase D as satisfied once this Sub-Spec's own Definition of Done (§23) is met.
- **Not affected**: `docs/specs/USC_001_SPEC_v1.0.md` (confirmed untouched, Product decision 3), `docs/specs/TRR_001_SPEC_v1.0.md`, `docs/specs/CPI_001_SPEC_v1.0.md` (pattern reused, file untouched), `docs/specs/CCC_001_SPEC_v1.0.md`.

---

# 25. Engineering Self-Review (Including Repository-Fit Conflict Check)

- **Re-verified `evaluateRulePredicate()` and `reasonCodeForRule()` directly against current HEAD** (`safetyLayer.js:450-489`) before writing §06/§12/§14 — every disposition-mapping claim in this Sub-Spec was checked against the literal, current predicate logic, not against the evidence report's own paraphrase alone.
- **No genuine canonical conflict found.** Specifically checked and cleared:
  - Does an unconditional new Rule conflict with SL-001's closed-enum canon? No — zero new enum values are introduced; TRR-001's own history already precedents additive Rule-array extension.
  - Does the new independent characterization step require a new orchestration seam? No — it reuses the exact Stage-5/6 seam TRR-001's own header already names as the canonical extension point.
  - Does `MODIFIED`'s `safeAlternative` mechanism require changing `finalReview()`'s signature? No — `modifiedContent` is already part of `SafetyReviewResult`'s existing shape; this Sub-Spec only defines *how* `safetyLayer.js` internally sources that content, an internal implementation concern, not a contract change.
  - Does durable risk-characteristic memory conflict with any closed contract? No — reuses `js/memory.js`'s existing, already-open-for-this-exact-purpose Typed Memory substrate; does not touch `coachConversation`/CCC-001 (the one genuine closed-contract conflict identified earlier this WP0 arc, for an unrelated field, correctly not reopened here either).
  - Does requiring `outsideCoachingAuthorityRequiringProfessionalSupport`/`immediateProtectiveOrProfessionalSupportRequired` booleans conflict with anything? No — both are already-declared, already-defensively-coded optional fields on the `dims` shape (`safetyLayer.js:445-449`'s own header comment), currently "never set true by matchCanonicalSafetyRules at this baseline" — this Sub-Spec's new Rule is the first to legitimately set them, exactly as their own header anticipates, not a new field.
- **One design choice disclosed, not silently decided**: whether durable risk-characteristic facts use a new Typed Memory `type` or extend the existing `safety_disclosure` shape (§15) — **now resolved** (Round-2 binding decision, §26 item 3) to a new, dedicated `type:'risk_characteristic_fact'`; `safety_disclosure` is confirmed untouched.

### 25.1 — Round-2 Self-Review: does unconditional runtime enforcement create a genuine repository conflict?

Performed specifically against the Round-2 binding decision that no capability declaration may suppress runtime Safety characterization (§09.3/§11/§13/§17/§26 item 2):

- **No repository-evidence conflict found.** Nothing in current HEAD requires or assumes that TRR's Candidates be exempt from a future, additive Safety Rule — `evaluateRulePredicate()`, `CANONICAL_SAFETY_RULES`, and `selectWinningDisposition()`/`selectPrimaryAndSecondary()` are all already generic over an arbitrary number of contributing rules; nothing in their logic distinguishes "a rule that happens to have run for the first time on a TRR Candidate" from any other rule evaluation.
- **A genuine reconciliation was required between two of the user's own instructions, disclosed here rather than silently resolved**: this Sub-Spec's Round-1 draft (§13/§17, superseded above) read the binding "TRR zero behavior drift" principle (WP0_SPEC_v1.0 and this Sub-Spec's own §03) as *structural code-path exemption* — TRR's `riskCharacteristicDimensions:[]` meaning the new step never runs at all for TRR. The Round-2 binding decision on capability-declaration enforcement is incompatible with that specific reading, since it requires the same unconditional step to run for every capability including TRR. The reconciliation adopted (§13/§17/§19): "zero drift" is satisfied as **golden-master outcome equivalence** — TRR's own observable behavior (dispositions, content, reason codes) remains byte-identical and acceptance-tested as such (§23) — while the *code path* is no longer exempt. This is a narrowing of the zero-drift principle's *mechanism* (outcome-provable rather than execution-exempt), not a violation of its *substance* (TRR's own users see no change). This reconciliation is Engineering's own resolution of an internal tension between two binding instructions and is surfaced explicitly for Product/Architecture review rather than assumed; it does not, by itself, require any code change beyond what §22 already specifies, since Phase D.6 was always going to add the characterization step at the Stage 5/6 seam — Round 2 only removes the capability-declaration bypass that a prior draft would have built into that same step.
- **No other closed contract is newly implicated.** The operational-cost concern (one additional bounded AI call per Candidate, including every TRR Candidate, rather than only for capabilities opting in) is a real, disclosed engineering cost of this decision, not a correctness conflict — noted here for Product/Architecture's awareness; this Sub-Spec does not attempt to design a cost-optimization mechanism (a declaration-based skip is exactly what Round 2 forecloses), leaving any future optimization (e.g., capability-provable incapability of producing risk-relevant content) as an explicitly out-of-scope, separately-reviewable future decision (§07's row already anticipates this).

---

# 26. Product/Architecture Decisions — Resolution Log

**All four items below were open after this Sub-Spec's Round-1 draft. All four are now RESOLVED per this session's final, binding Round-2 Product/Architecture decisions. Zero items remain open from this list.**

1. **RESOLVED — extraction prompt wording.** Decision: Architecture owns the exact implementation wording for `classifyCandidateContent()`/`classifyTurnForDurableConstraint()`, and must faithfully implement the already-approved closed taxonomy (§08), literal grounding (§10.1's anchor re-verification), bounded output, ambiguity-abstention (§11), and fail-closed semantics (§09.1/§11) — no expansion of Product scope beyond what this Sub-Spec already defines. This Sub-Spec continues to define *shape and discipline* only (§09), not literal prompt text; that authorship is deferred to Phase D.2 implementation (§22), under Architecture review, mirroring how USC-001's own prompt text was itself a reviewed deliverable. No further Product/Architecture input is required before Phase D.2 begins.
2. **RESOLVED — runtime enforcement of capability-declaration correctness.** Decision: runtime Safety enforcement applies **in addition to** Architecture/Engineering review, not instead of it. A capability declaration such as `riskCharacteristicDimensions:[]` **must not** be able to bypass Safety merely because it was configured incorrectly. If independently-characterized candidate content is Safety-relevant at runtime, the governed Safety path applies **regardless** of an incorrect or empty capability declaration. The declaration remains useful for planning/optimization but is **not Safety authority** and cannot suppress runtime Safety characterization. Implemented in this revision at: §07 (ownership table row), §09.3 (unconditional-execution contract), §11 (replaced uncertainty-semantics row), §13 (Rule now runs unconditionally, reconciled with TRR zero drift), §17 (orchestrator wiring now touches TRR's branch too), §19 (restated compatibility row), §25.1 (self-review reconciliation).
3. **RESOLVED — new Typed Memory type vs. extended `safety_disclosure` shape.** Decision: use a **new, dedicated** Typed Memory type (`type:'risk_characteristic_fact'`) for governed durable risk-characteristic facts, rather than overloading `safety_disclosure`. The existing `safety_disclosure` type is left completely untouched. The new type must preserve — and does, per §15's restated text — the same consent, provenance, explicit-user-statement authority, correction/supersession, and transparency requirements already defined by this Sub-Spec for durable facts generally. Implemented in this revision at: §15.
4. **RESOLVED — `EXTREME_OR_UNBOUNDED_INTENSITY` threshold.** Decision: no universal deterministic numeric threshold exists, and this Sub-Spec does not pretend one does. Detection is bounded semantic characterization (§09) where necessary; AI characterization alone remains non-authoritative, inference-level evidence (`evidenceSource='AI_CANDIDATE_CHARACTERIZATION'`→`evidenceConfidence='INFERENCE'`), and deterministic Safety (`evaluateRulePredicate()`, unmodified) retains final authority — insufficient/inference-only evidence resolves to the conservative governed `DEFERRED` path, never `BLOCKED`, from AI characterization alone. Future capabilities may supply genuinely deterministic/authoritative evidence for this domain where such evidence is genuinely available, without changing this Sub-Spec's general mapping contract. Implemented in this revision at: §12 (restated mapping-table row) and new §12.1.

---

# 27. Status and Closure

**Current status: Product Review: APPROVED. Architecture Review: APPROVED. Status: READY FOR IMPLEMENTATION.** All four §26 items are resolved (§26). Engineering Self-Review (§25, including the Round-2 pass at §25.1) found no genuine repository-evidence conflict; the one internal-instruction reconciliation (TRR zero-drift mechanism vs. unconditional runtime enforcement) was disclosed explicitly at §13/§17/§19/§25.1 and has now been **explicitly ratified by both Product and Architecture**: TRR Zero Drift means behavioral/outcome equivalence, proven by golden-master testing — it does NOT mean TRR is structurally exempt from the new unconditional runtime Safety characterization, and no capability, current or future, receives a runtime Safety exemption merely because its declaration says `riskCharacteristicDimensions:[]` (restated verbatim at §01).

**Phase D.1 implemented, reviewed, and approved.** Per §22, Phase D.1 (Taxonomy + deterministic validator / StandardProposal contract tightening) has been implemented as `js/coachDecisionSystem/riskCharacteristicValidator.js` (the closed taxonomy of §08 plus shape/literal-anchor validation per §10.1) and a corresponding narrowing of `standardProposalContract.js`'s `isValidRiskCharacteristicTags()`. No AI call, no pipeline wiring, exactly matching §22's own D.1 scope. Focused tests: 30/30 pass. Full regression: 3021/3021 pass, zero existing assertion weakened (one assertion in `tests/standardProposalContract.test.js` was updated to reflect the now-approved real taxonomy shape, replacing Phase C's own placeholder `{dimension,value}` shape — disclosed as an approved contract replacement, not a weakening). Product/Architecture reviewed and approved this Phase D.1 implementation. Committed to `main` (this session).

**Remaining work not yet authorized.** Phase D.2 (Extraction interpreters) and all subsequent phases (D.3–D.6) remain unauthorized and unimplemented; each requires its own explicit Product/Architecture authorization before work begins, per the same disciplined, scope-pure, phase-gated process WP0 Phases A–C already established.

---

# 28. Document History

v1.0 — DRAFT, Revision 1 — authored this session, following final, binding Product/Architecture decisions on the WP0 Phase D Safety Risk-Characteristic Foundation, grounded in the three-part read-only evidence investigation this session also produced. No implementation performed under this document.

v1.0 — DRAFT, Revision 2 — resolves all four §26 items per this session's final, binding Round-2 Product/Architecture decisions: (1) extraction-prompt-wording ownership assigned to Architecture within the already-approved taxonomy; (2) runtime Safety enforcement made unconditional — a capability's declared `riskCharacteristicDimensions` is downgraded to a planning/optimization hint with no Safety-suppressive power, requiring reconciliation of the TRR-zero-drift principle to golden-master outcome equivalence rather than code-path exemption (disclosed at §13/§17/§19/§25.1); (3) durable risk-characteristic facts assigned a new, dedicated Typed Memory type, `safety_disclosure` left untouched; (4) `EXTREME_OR_UNBOUNDED_INTENSITY` confirmed to have no universal deterministic threshold, resolved as bounded semantic/inference-confidence characterization under deterministic Safety's continued final authority. No implementation performed under this revision. Proposed status at the time: READY FOR PRODUCT REVIEW / ARCHITECTURE REVIEW.

v1.0 — Revision 2 (canonical status update, this entry) — **Product Review: APPROVED. Architecture Review: APPROVED. Status: READY FOR IMPLEMENTATION.** The Round-2 TRR Zero-Drift interpretation (behavioral/outcome equivalence, not structural exemption from unconditional runtime Safety characterization; no capability exemption via `riskCharacteristicDimensions:[]`) is explicitly ratified and recorded verbatim at §01. No other Product/Architecture decision changed. Phase D.1 (§22) subsequently implemented, tested (30/30 focused, 3021/3021 full regression), reviewed, approved, and committed to `main`; Phase D.2 onward remain unauthorized.

# End of Sub-Spec (Revision 2 — Ready for Implementation)
