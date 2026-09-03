# CSR-001 — Canonical Safety Rule V1 + Real Matcher
### Safety Foundation — Foundation C
### SPEC v1.0 (updated — PD-FC-07 + PD-FC-08 tokenization resolved) — AUTHORED, NOT YET IMPLEMENTED

Continues directly from `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD,
CANONICAL, commit `ca1f0e0be05ad2e2ab0cfb315024d906c0519147`), `docs/specs/USC_001_SPEC_v1.0.md`
(Work Item A, CLOSED — commit `84886767cd4ef6eb6567ca2206b5a0f7fd0bfa43`),
`docs/specs/MAI_001_SPEC_v1.0.md` (Work Item B, CLOSED — commit
`01e15b8adb57656b988107e58feace2f0f4f0c4b`), and `docs/specs/USP_001_SPEC_v1.0.md` (prerequisite,
CLOSED — commit `de33ab41eb382f8818d68324e89d879de95e66cb`) — the canonical authorities for this
SPEC's architecture. **CSR-001 is Foundation C** (SFCD Chapter 07): the first real join between
`pipelineContext.userSafetyContext`, `pipelineContext.userSafetyProvenance`, and
`Candidate.actionIdentity`, giving `matchCanonicalSafetyRules()` its first genuine implementation.
This SPEC does not reopen USC-001, USP-001, MAI-001, or SL-001; does not redesign the Safety Decision
Matrix; and does not build any medical, temporal, or activity capability beyond the single, narrow,
first vertical Product has approved.

**Correction record (Head of Product + AI Architect, PD-FC-07, this pass):** the SPEC Authoring
Review's own flagged Architecture blocker (Hebrew word-boundary matching) is resolved.
**PD-FC-07 — approved: Hebrew Orthographic Boundary V1.** Hebrew matching uses deterministic
tokenization (splitting on non-letter runs, never a `\b`-style assertion) followed by exact
membership against a small, closed, precomputed accepted-form set — each approved Hebrew
vocabulary token plus exactly its `ה`/`ו`/`וה`-prefixed forms, nothing else. This supersedes the
prior draft's two candidate resolutions (the generic seven-prefix-particle system and unrestricted
substring matching), both explicitly rejected. §8, §9, §10, §23, and §25 are corrected to state
this exact mechanism. No vocabulary is broadened, no temporal semantics change, no Safety dimension
changes, and PD-FC-01 through PD-FC-06 are not reopened.

**Correction record (Head of Product + AI Architect, PD-FC-08, this pass):** a further tokenizer
defect was identified before implementation and is now resolved. **PD-FC-08 — approved:
Alphanumeric Token Boundary V1.** The originally-proposed letters-only tokenizer delimiter class
(`[^\p{L}]+`) is rejected — it treated digits as delimiters, meaning `doctor123` would have
tokenized into a bare, falsely-matching `doctor` token. The canonical V1 tokenizer treats both
Unicode letters and Unicode numbers as token constituents (`[^\p{L}\p{N}]+` as the delimiter
class) — a digit directly attached to a letter never creates a boundary. §10 is corrected to state
this exact tokenizer; §23/§25 gain the corresponding alphanumeric-boundary test/acceptance
requirements. PD-FC-07's own Hebrew accepted-form rule is unchanged by this correction. No
vocabulary broadened, no temporal semantics changed, no Safety dimension changed, PD-FC-01 through
PD-FC-07 not reopened.

**Work Item identifier:** `CSR-001`, derived from SFCD's own canonical title for Foundation C
("**C — Canonical Safety Rule V1 + Real Matcher**", SFCD §04) — no existing identifier was found
reserved for this Work Item anywhere in the repository (`git grep` for `CSR-001` returns nothing);
this follows the same initials-of-the-canonical-title convention already used for USC-001, MAI-001,
and USP-001.

## §1. Purpose

Give `matchCanonicalSafetyRules()` its first real implementation, proving the first genuine,
end-to-end Safety vertical:

> **EXPLICIT USER-REPORTED MEDICAL RESTRICTION (USC-001 + USP-001) → JOINED BY `sourceMemoryId` →
> MATCHED AGAINST A `RUNNING` CANDIDATE (MAI-001) → REAL `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`
> SAFETY DIMENSIONS → THE EXISTING, ALREADY-BUILT SAFETY DECISION MATRIX.**

Canonical example: *"My doctor told me not to run."* (USC-001: `restrictedActivityText: 'run'`;
USP-001: `statedSourceText: 'my doctor'`, same `sourceMemoryId`) matched against a Candidate whose
`actionIdentity: {activity: 'RUNNING'}` (MAI-001). No diagnosis, disease, treatment, or medical
correctness is inferred anywhere in this Work Item — CSR-001 respects only the literal, already-
established fact that the user reported a medical instruction restricting this activity.

## §2. Canonical Authorities

- **SFCD Chapter 07** — Foundation C's own canonical scope: *"explicit user-reported restriction
  against RUNNING + Candidate activity identity RUNNING. No medical contraindication rules are to
  be invented under Foundation C... Foundation C extends `matchCanonicalSafetyRules()`'s own
  existing, disclosed, honestly-empty stub... with real logic. Foundation C does not reopen,
  redesign, or amend SL-001's own closed `RiskType`/`EvidenceConfidence`/`Correctability`/`Urgency`
  enums or its ordered Safety Decision Matrix — it supplies real matched-rule data into an already-
  correct, already-closed mechanism. Stage 8/9 contracts... are preserved unchanged."*
- **PD-FC-01** (this pass) — the canonical RiskType for an established medical restriction
  conflicting with the Candidate action is `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`;
  `PERMANENT_SAFETY_COMMITMENT_CONFLICT` is rejected for this vertical.
- **PD-FC-02/PD-FC-03** (prior passes, USP-001 SPEC §20) — memory-record currentness ≠ restriction
  temporal currentness; no temporal qualifier → may be treated as active; an explicit but
  unresolvable temporal qualifier → `TEMPORALLY_UNRESOLVED`; no date arithmetic anywhere.
- **PD-FC-04** (this pass) — the closed V1 medical-source vocabulary: `doctor`, `physician`
  (English); `רופא`, `רופאה` (Hebrew). No other term authorized.
- **PD-FC-05** (this pass) — the closed V1 RUNNING-text vocabulary for literal restriction
  matching: `run`, `running`, `jog`, `jogging` (English); `לרוץ`, `ריצה`, `ריצות`, `רץ` (Hebrew;
  `רצה` excluded). Candidate matching itself is structural (`actionIdentity.activity === 'RUNNING'`),
  never textual.
- **PD-FC-06** (prior pass) — the semantic distinction between a confirmed-active and a temporally-
  unresolved medical restriction must be preserved in the Safety dimensions even though Stage 8's
  current binary containment may remove the Candidate in both cases identically.
- **AD-MAI-01** (MAI-001 §13, CLOSED) — `SINGLE_WINNER`'s reconstructed Terminal Decision does not
  carry `actionIdentity`; `TIED_SET`'s incidental `options[]` exposure is not a guaranteed contract.
  Foundation C "must not rely on post-Stage-8 `actionIdentity` availability... Stage 8 is the
  relevant guaranteed consumption point" — binding, reaffirmed here without exception.
- **`SL-001_SPEC_v1.0.md` (DONE/CLOSED, 2026-08-05)** — the closed Safety Decision Matrix
  (`evaluateRulePredicate`, `evaluateCanonicalSafetyRules`, `selectPrimaryAndSecondary`,
  `ABSOLUTE_OVERRIDE_RISK_TYPES`), `safetyIntegrationPort.js`'s closed five-disposition/thirteen-
  reasonCode contracts — all directly re-inspected this pass at the current committed baseline
  (`de33ab41eb382f8818d68324e89d879de95e66cb`), confirmed byte-identical to every prior
  investigation in this initiative, and referenced, never modified.
- **`js/coachDecisionSystem/winnerSelection.js`** — Stage 8's own orchestration owner (confirmed;
  no separate `decisionEngine.js` exists in this repository).

## §3. Scope / Non-Scope

**IN SCOPE:** a real implementation of `matchCanonicalSafetyRules()`; one internal, explicit,
deterministic Canonical Safety Rule (the RUNNING-medical-restriction rule); a deterministic medical-
source matcher (§8); a deterministic RUNNING-text matcher (§9); the `sourceMemoryId` join (§7); the
V1 temporal state model (§11); the two Safety dimension profiles (§12-§13); Stage 8 becoming
behaviorally effective for this one rule; tests; canonical closure documentation. Version/wiring
changes only if repository evidence proves they are required (§24 — none found).

**OUT OF SCOPE (binding):** medical diagnosis, clinical inference, medical advice, treatment logic,
symptom interpretation, recovery prediction; expiry/date arithmetic of any kind; any medical-source
or RUNNING vocabulary term beyond the two closed lists (§8-§9); the full Action Model; Action
Generation; Preference; Expression; Stage 9 `actionIdentity` propagation (AD-MAI-01 stands
unmodified); any new Safety disposition; any new RiskType; any new StateAccess read; any
modification to USC-001, USP-001, MAI-001, or SL-001's own public contracts; a general-purpose
Safety rule engine.

## §4. Prerequisites / Closed Dependencies

USC-001 (`pipelineContext.userSafetyContext`), MAI-001 (`Candidate.actionIdentity`), and USP-001
(`pipelineContext.userSafetyProvenance`) are all CLOSED and are consumed here exactly as their own
SPECs define them — re-verified this pass: `git diff` between USC-001's own closure commit and the
current `HEAD` shows zero content change in any of the three Work Items' own files. This Work Item
adds no new field to any of their contracts and reads only what they already publish.

## §5. Stage-8 Ownership

CSR-001's rule becomes real and behaviorally effective through the **existing, unmodified** Stage 8
mechanism: `disqualify(candidatePool, pipelineContext)` ([safetyLayer.js:286-317]) already calls
`matchCanonicalSafetyRules(candidate, null, pipelineContext)` per Candidate and filters the returned
`dims` array by `ABSOLUTE_OVERRIDE_RISK_TYPES` membership — a fixed four-value set that already
includes `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`. **No change to `disqualify()`'s own code is
required or proposed** — the moment `matchCanonicalSafetyRules()` returns a real `dims` tuple with
this RiskType, Stage 8 disqualifies the Candidate, exactly as its own already-closed logic
describes. `winnerSelection.js` (`select()`) is the confirmed Stage 8 orchestration owner and is
likewise unmodified.

## §6. Canonical Inputs

Exactly three, all read-only, all already-published by closed Work Items — **no new StateAccess
read, no new pipelineContext field:**

1. `pipelineContext.userSafetyContext` — `{items: [{sourceMemoryId, restrictedActivityText,
   statedDurationText?}]} | null` (USC-001, unchanged).
2. `pipelineContext.userSafetyProvenance` — `{items: [{sourceMemoryId, statedSourceText}]} | null`
   (USP-001, unchanged).
3. `candidate.actionIdentity` — `{activity: <token>} | undefined` (MAI-001, unchanged), available
   only via the Stage-8 `disqualify()` call path (§5, §16).

## §7. `sourceMemoryId` Join Contract

The rule requires exactly one `userSafetyContext` item and exactly one `userSafetyProvenance` item
that share the **identical** `sourceMemoryId` — never positional, never inferred, never merged
across different source statements (binding, restated verbatim from this pass's own instruction).
Implementation: build a lookup from `userSafetyProvenance.items` keyed by `sourceMemoryId`; for each
`userSafetyContext.items` entry, look up its own `sourceMemoryId` in that map; a qualifying pair
exists only when both the restriction-text match (§9) and the provenance-text match (§8) succeed on
the **same** looked-up pair. If `userSafetyProvenance` is `null` or contains no entry for a given
`sourceMemoryId`, that `userSafetyContext` item alone can never qualify (§14).

## §8. Medical-Source Matching Semantics

Closed V1 vocabulary (PD-FC-04, exact, no other term):

```
English: doctor, physician
Hebrew:  רופא, רופאה
```

**Matching mechanism:** deterministic tokenization (§10) of the joined `userSafetyProvenance`
item's `statedSourceText`, followed by exact membership of each resulting token against a
precomputed closed accepted-form set — the English tokens as-is, the Hebrew tokens expanded per
PD-FC-07's own closed prefix rule (§10). No `Dr.`/`Dr`/`ד"ר` recognition, no title-to-role
conversion, no proper-name inference, no semantic similarity, no LLM call — the matcher is a pure,
closed string-membership check.

## §9. RUNNING-Text Matching Semantics

Closed V1 vocabulary (PD-FC-05, exact, no other term):

```
English: run, running, jog, jogging
Hebrew:  לרוץ, ריצה, ריצות, רץ   (רצה explicitly excluded — unvocalized homograph risk with "wanted")
```

**Matching mechanism:** identical deterministic tokenization-then-exact-membership matching (§10)
against the `userSafetyContext` item's `restrictedActivityText`. This textual match applies
**only** to the literal restriction text from USC-001 — it is never used to match the Candidate
itself. **Candidate matching is exclusively structural:**
`candidate.actionIdentity && candidate.actionIdentity.activity === 'RUNNING'`, per MAI-001's own
closed contract — no text comparison of any kind touches the Candidate. PD-FC-07's Hebrew prefix
handling (§10) applies identically to these four Hebrew tokens; `רצה` remains excluded, and no
prefixed form of `רצה` is authorized by this rule either.

## §10. Deterministic Text Normalization/Matching — RESOLVED (PD-FC-07 + PD-FC-08)

**PD-FC-07 (Head of Product + AI Architect) — approved: Hebrew Orthographic Boundary V1.**
JavaScript's `\b` MUST NOT be used as the Hebrew boundary authority (it is defined over `\w` =
`[A-Za-z0-9_]`, which excludes Hebrew letters entirely — empirically confirmed:
`/\bרופא\b/.test('רופא')` returns `false` even for an exact standalone match, the finding that
originally opened this section). No general Hebrew morphology engine, no generic multi-letter
prefix-particle system, and no unrestricted substring matching are authorized. Instead:

**Step 1 — deterministic tokenization (language-agnostic, applies to both English and Hebrew
identically) — corrected by PD-FC-08 (Alphanumeric Token Boundary V1):** split the already-
trimmed/lowercased(-for-Latin) source string on every run of one-or-more characters that are
*neither* a Unicode letter *nor* a Unicode number (`[^\p{L}\p{N}]+`, `u` flag), discarding empty
results. **The originally-proposed letters-only delimiter class (`[^\p{L}]+`) is superseded and
rejected** — it treated digits as delimiters, which would have let a token like `doctor123`
tokenize into `doctor` + `123` and falsely expose an isolated `doctor` token for matching.
`\p{N}`-inclusion closes this: `doctor123`, `123doctor`, `run2026`, `רופא123`, and `123רופא` each
now tokenize as a single, uninterrupted alphanumeric unit (`doctor123`, `run2026`, `רופא123`, etc.)
that is not equal to any accepted form. This remains a **split-based tokenizer, not a `\b`-style
zero-width boundary assertion** — it never inspects adjacency between a "word" and "non-word"
character class the way `\b` does, so it carries none of `\b`'s Hebrew blind spot, and digits
attached directly to letters never create a boundary. Punctuation and whitespace remain the only
legitimate delimiters (both are neither `\p{L}` nor `\p{N}`), satisfying "punctuation boundaries"
without any additional logic.

**Step 2 — closed accepted-form generation per vocabulary token:**
- **English tokens:** the accepted-form set is the token itself, exactly as approved (`doctor`,
  `physician`, `run`, `running`, `jog`, `jogging`) — no variants.
- **Hebrew tokens (PD-FC-07's own closed rule):** the accepted-form set for each approved Hebrew
  token is **exactly** `{token, ה+token, ו+token, וה+token}` — four fixed strings, precomputed
  once, never generated dynamically from a general prefix-stripping rule. For `רופא`:
  `{רופא, הרופא, ורופא, והרופא}`. For `רופאה`: the same four-form pattern
  (`{רופאה, הרופאה, ורופאה, והרופאה}`). Identically for the four approved RUNNING tokens
  (`לרוץ`, `ריצה`, `ריצות`, `רץ`) — **never** for `רצה`, which remains excluded, and no prefixed
  form of `רצה` is added to any accepted-form set.
- **This is a closed orthographic-boundary accommodation, not vocabulary expansion, not stemming,
  and not morphological inference** — no new lexical item is recognized; only four fixed spellings
  of each already-approved token are.

**Step 3 — exact membership, never partial/substring/boundary-regex matching:** a source string
matches a vocabulary token if and only if **at least one token produced by Step 1 is exactly
string-equal** to a member of that token's own accepted-form set from Step 2. Not "contains," not
"starts with," not a regex — a plain array/set membership check (`indexOf`/`Set.has`) against
already-tokenized, already-generated fixed strings.

**Verified empirically this pass, `node -e`, against the final PD-FC-07 + PD-FC-08 mechanism
together (not either prior draft):**
- **Must match (proven true):** `doctor`, `doctor.`, `(doctor)`, `"doctor"` (punctuation-adjacent,
  English); `run`, `running`, `jog` (bare English forms); `רופא`, `הרופא`, `והרופא` (Hebrew bare
  and prefixed forms).
- **Must NOT match (proven false):** `doctor123`, `123doctor`, `doctorate` (English alphanumeric/
  morphological non-matches); `run2026`, `runningmate`, `jogger` (English); `רופא123`, `123רופא`,
  `שרופא` (Hebrew alphanumeric attachment and disallowed-prefix collision).
- `"הרופא שלי אמר לי לא לרוץ"` → tokenizes to include `הרופא`, a member of `רופא`'s accepted-form
  set → **matches** (the canonical PD-USP-02 example, re-confirmed against the corrected
  tokenizer).
- **`רצה` and its prefixed forms (`הרצה`, `ורצה`, `והרצה`) tested against the full combined closed
  Hebrew vocabulary (all six approved tokens' accepted-form sets) — none matches anything**,
  confirmed by direct execution: `רצה` was never given an accepted-form set at all (it is not an
  approved vocabulary token), and none of its four surface forms collides by coincidence with any
  *other* approved token's own accepted forms.
- **Orthographically unusual but authorized forms accepted as-is, per instruction:** `הלרוץ`,
  `ולרוץ`, `והלרוץ` (mechanically generated by PD-FC-07's own fixed rule applied to `לרוץ`) all
  test as matches — the matcher performs no linguistic judgment about whether a generated form is
  natural Hebrew; it only checks closed-set membership, exactly as authorized.

**No stemming, no suffix stripping, no arbitrary prefix stripping, no LLM classification, no fuzzy
matching, no embeddings, no external tokenization dependency** — confirmed by the mechanism itself:
Step 2's four-form sets are the *only* variation ever considered, fixed at precompute time, never
derived from the observed input text; tokenization uses only built-in `String.prototype.split` with
a `RegExp` Unicode property class, already an established pattern elsewhere in this repository.

## §11. Temporal State Model

Binding, unchanged from PD-FC-02/PD-FC-03 (USP-001 SPEC §20, reproduced operationally here):

- **`userSafetyContext` item's `statedDurationText` absent** → the restriction is treated as
  **ACTIVE** — no end condition was ever stated; this is a known, unbounded-as-stated fact, not an
  invented indefinite extension.
- **`statedDurationText` present, any form** (vague or specific, e.g. `"for a month"`, `"until
  September 15"`) → **TEMPORALLY_UNRESOLVED** — no date arithmetic, no parsing of the literal text,
  no attempt to distinguish "looks resolvable" from "clearly vague." This is a single boolean gate:
  presence of the field, full stop.

## §12. Confirmed-Active Safety Dimensions

```
riskType:           ACTIVE_MEDICAL_INSTRUCTION_CONFLICT   (PD-FC-01)
evidenceConfidence: EXPLICIT_USER_STATEMENT                (D1 Unit 11 strongest tier — the
                                                             restriction's own source is
                                                             source==='user_stated')
correctability:     REQUIRES_INTENT_CHANGE                 (a RUNNING Candidate cannot be
                                                             bounded-modified into a non-RUNNING
                                                             one while preserving its own intent —
                                                             SL-001 Ch.15 item 2's own literal
                                                             text: "the original intent conflicts
                                                             with an approved canonical safety
                                                             boundary")
urgency:            ROUTINE_PROTECTIVE                     (§13 — same value as the
                                                             temporally-unresolved case; see
                                                             rationale there)
```

## §13. Temporally-Unresolved Safety Dimensions

```
riskType:           ACTIVE_MEDICAL_INSTRUCTION_CONFLICT   (unchanged — the restriction, medical
                                                             source, and activity are ALL already
                                                             confirmed on this exact sourceMemoryId;
                                                             only the duration's temporal
                                                             resolution is unknown)
evidenceConfidence: INSUFFICIENT                            (PD-FC-06 — the RiskType's own name
                                                             asserts "ACTIVE"; the label's full
                                                             semantic content is not fully
                                                             evidenced when currentness cannot be
                                                             established — SL-001's own derivation
                                                             rule: "Derived from the strongest
                                                             evidence item directly supporting the
                                                             selected RiskType")
correctability:     REQUIRES_INTENT_CHANGE                 (unchanged from §12 — this dimension
                                                             concerns the Candidate's own
                                                             modifiability, not the restriction's
                                                             temporal state, and does not vary
                                                             between the two profiles)
urgency:            ROUTINE_PROTECTIVE                     (unchanged — Urgency is NOT overloaded
                                                             to represent temporal uncertainty,
                                                             per this pass's own binding
                                                             instruction; ROUTINE_PROTECTIVE is
                                                             semantically legitimate for both
                                                             profiles because neither carries any
                                                             emergency/immediate-danger signal — the
                                                             distinction lives entirely in
                                                             EvidenceConfidence, which is already
                                                             sufficient: `evaluateRulePredicate()`'s
                                                             own BLOCKED check does not inspect
                                                             Urgency at all, confirmed by direct
                                                             code reading)
```

**Why `EvidenceConfidence` alone correctly produces the intended disposition split, verified
against the real, unmodified `evaluateRulePredicate()` this pass:** `BLOCKED` requires
`evidenceConfidence !== 'INFERENCE' && evidenceConfidence !== 'INSUFFICIENT'` — the confirmed-active
profile (`EXPLICIT_USER_STATEMENT`) satisfies this and reaches `BLOCKED`; the temporally-unresolved
profile (`INSUFFICIENT`) fails this and falls through to `DEFERRED`'s own check
(`evidenceConfidence === 'INSUFFICIENT'`), which it satisfies. No other dimension needs to differ.

## §14. DEFERRED Boundary — Fail-Closed/No-Match Semantics Per Missing-Input Class

Binding distinction, resolved from repository evidence, not chosen for convenience:

**NO MATCH (empty `dims` array — zero disposition consequence, same as any non-conflicting
Candidate today):**
- `candidate.actionIdentity` absent, or `activity !== 'RUNNING'` — the rule's own applicability
  precondition fails; this Candidate is simply not what the rule concerns itself with.
- No `userSafetyContext` item at all, or none whose `restrictedActivityText` matches the RUNNING
  vocabulary (§9) — no restriction exists for this rule to conflict with.
- A RUNNING-matching restriction exists, but **no `userSafetyProvenance` item shares its
  `sourceMemoryId`** (whether because `userSafetyProvenance` is entirely `null`/`UNAVAILABLE`, or
  because it is `AVAILABLE` but contains no matching id, or because the matching id's own
  `statedSourceText` does not pass the medical-source check, §8) — **this is a scope-boundary
  absence, not "insufficient safety information" in SL-001's `DEFERRED` sense.** The rule's entire
  premise (`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`) is specifically a claim about a *medical*
  instruction; without any evidence a medical source was even named, there is no basis to assert
  *this* RiskType at all — not a reduced-confidence version of it. Asserting `DEFERRED` here would
  still require committing to `riskType: ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`, which Stage 8's own
  binary filter (§5) would then disqualify against — an overreach with zero medical-source evidence
  of any kind. **This is a deliberate, narrow V1 scope limitation** (only medically-sourced,
  provenance-confirmed restrictions are covered by this first vertical) — not a defect, and
  consistent with `evaluateCanonicalSafetyRules()`'s own existing default: *"Zero matched Rules is
  RCD-12.E's own `UNMODIFIED` case directly... not synthesized through a NONE-RiskType Rule
  Result."*

**MATCH, with `evidenceConfidence: INSUFFICIENT` (→ `DEFERRED`, §13):**
- **Exactly and only** the case where the restriction, the medical source, and the RUNNING match
  are **all three already confirmed** on the identical `sourceMemoryId` — and the sole remaining
  uncertainty is the stated duration's own temporal resolvability (§11). This is the one, narrow,
  genuine "insufficient information" case this rule recognizes, consistent with PD-SF-05 (a
  *known* active incompatibility must never become `DEFERRED`) precisely because this case is, by
  construction, **not** known-active — its only open question is temporal currentness, which
  SL-001's own `EvidenceConfidence` derivation rule already accommodates without contradiction (§13).

No other case exists in this rule's own scope.

## §15. Canonical Safety Rule Output Shape

**No new schema is introduced — the existing, closed shape is reused exactly as-is**, confirmed by
direct re-reading of `safetyLayer.js` this pass: `evaluateRulePredicate(dims)` and
`evaluateCanonicalSafetyRules(matchedRules)` already define and consume the canonical dims-tuple
shape — `{riskType, evidenceConfidence, correctability, urgency, escalationRequired?,
immediateProtectiveOrProfessionalSupportRequired?, outsideCoachingAuthorityRequiringProfessionalSupport?}`
— and `evaluateCanonicalSafetyRules()`'s own docstring already states this is *"the shape
`matchCanonicalSafetyRules()` would produce for each genuinely matched Canonical Safety Rule."*
CSR-001 populates exactly `{riskType, evidenceConfidence, correctability, urgency}` per match
(§12/§13) — the three optional escalation booleans are never set `true` (no escalation signal
exists in this vertical). **No repository-native "rule identity/id" schema was found anywhere** for
this dims tuple; a purely internal, non-public bookkeeping field (e.g. an internal
`_sourceMemoryId` carried on the tuple for traceability/testability) may ride along harmlessly,
since `evaluateCanonicalSafetyRules()`'s own `ruleResults.map()` already spreads whatever keys
`dims` carries — but this is never exposed through the closed public `DisqualificationResult`/
`SafetyReviewResult` shapes (both unmodified, both only ever expose `reasonCode`/`reasonDetail`,
never raw `dims`).

## §16. `matchCanonicalSafetyRules()` Contract

**Signature unchanged:** `matchCanonicalSafetyRules(candidate, terminalDecision, pipelineContext)`.

- **Stage 8 call path** (`disqualify()`, `candidate` provided, `terminalDecision === null`): the
  rule check (§7-§14) runs against `candidate.actionIdentity` + `pipelineContext.userSafetyContext`
  + `pipelineContext.userSafetyProvenance`, exactly as this SPEC defines. This is the **only** call
  path this rule can ever produce a match on.
- **Stage 9 call path** (`finalReview()`, `candidate === null`, `terminalDecision` provided):
  **returns `[]` unconditionally**, per AD-MAI-01's own binding instruction — no attempt is made to
  read `actionIdentity` from `terminalDecision` (including its `options[]`, even for a `TIED_SET`)
  under any circumstance. This is identical to today's baseline behavior for this call path.
- **Stage 3 call path** (`detectSafetyOpportunities()`, both `candidate`/`terminalDecision` `null`):
  unaffected — this Work Item does not touch Stage 3 detection, which remains its own, separately-
  disclosed Repository Gap.

**Internal structure (extensible, not a general engine):** a small, explicit, in-code array/list of
rule-check functions — V1 contains exactly one entry (the RUNNING-medical rule). Adding a future
rule means appending a second entry to this same list; no dynamic loading, no external rule-content
file, no registry is introduced (matching the Work-Item Decomposition Report's own prior guidance:
*"a single, small, explicit rule check is sufficient... a fuller registry is future scope"*).

## §17. Stage 8 Behavior

Unchanged code, real consequence: `disqualify()`'s own existing filter
(`ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf(dims.riskType) !== -1`) already includes
`ACTIVE_MEDICAL_INSTRUCTION_CONFLICT`. The moment `matchCanonicalSafetyRules()` returns a real,
matching `dims` tuple for a RUNNING Candidate against a qualifying restriction, Stage 8 disqualifies
that Candidate — for **both** the confirmed-active and temporally-unresolved profiles identically
(binding per PD-FC-06 — Stage 8's own filter never inspects `evidenceConfidence`, confirmed by
direct code reading). Multiple qualifying `sourceMemoryId` pairs for the same Candidate simply
produce multiple `dims` tuples in the returned array; `disqualify()`'s own existing
`selectPrimaryAndSecondary()` call (unmodified) already handles picking the primary `reasonCode`
among them via the existing RCD-14.C tie-break — no new logic required.

## §18. Stage 9 Boundary

**Explicitly, permanently out of reach for this rule in V1**, per AD-MAI-01 (§16). A Candidate that
survives Stage 8 (i.e., was never matched by this rule at all, since a match means disqualification)
proceeds to Stage 9 with no possibility of this rule re-evaluating it there — `finalReview()`'s own
call to `matchCanonicalSafetyRules()` always returns `[]` for this rule regardless of Candidate
content, because that call path never receives a `candidate` argument at all. This is not a gap
CSR-001 introduces or is responsible for — it is the pre-existing, already-disclosed, already-
accepted architectural boundary MAI-001's own Implementation Review discovered and Product formally
recorded as AD-MAI-01. **`decisionFormation.js` is not modified by this Work Item, and MUST NOT
be.**

## §19. Failure/Missing-Input Behavior

Fully deterministic, no exceptions possible: every input (`candidate.actionIdentity`,
`pipelineContext.userSafetyContext`, `pipelineContext.userSafetyProvenance`) may independently be
absent, `null`, or empty — the rule check (§7) simply evaluates to "no qualifying pair found" in
every such case, producing an empty `dims` array, never a thrown error, never a fabricated match.
No LLM call exists anywhere in this Work Item's own code, so no timeout/retry/model-failure
handling is needed here at all (the interpreter-level failure handling that produces `{items: []}`/
`AVAILABLE` vs. `null`/`UNAVAILABLE` is entirely USC-001's and USP-001's own already-closed
concern — CSR-001 only reads whatever those two Work Items' own contracts already produced).

## §20. Rule Ordering/Deduplication Behavior

V1 has exactly one rule; ordering among *rules* is not yet a live question (deferred to whenever a
second rule exists — the existing `CANONICAL_SAFETY_RULE_ORDER` tie-break already anticipates this
and is unmodified). Ordering among **multiple matches of this same rule** (multiple qualifying
`sourceMemoryId` pairs for one Candidate) is already fully handled by the existing, unmodified
`selectPrimaryAndSecondary()` (§17, §20 of `safetyLayer.js`'s own RCD-14.C tie-break) — no new
deduplication logic is introduced.

## §21. `SafetyIntegrationPort` Interaction

**No change.** `safetyIntegrationPort.js`'s own closed `DISPOSITIONS`, `REASON_CODES`,
`DISPOSITION_PRECEDENCE`, `isValidDisqualificationResultArray()`, and `isValidSafetyReviewResult()`
are all re-confirmed byte-identical to their USC-001-era baseline this pass. CSR-001 supplies real
`dims` data into an already-correct, already-validated pipeline — it does not touch the port's own
contract shape in any way.

## §22. Backward Compatibility

Additive-in-effect-only: no existing file's *public contract* changes shape.
`matchCanonicalSafetyRules()`'s signature is unchanged; its previously-`[]`-always behavior becomes
real only for the one narrow, newly-matchable case — every Candidate/context combination that did
not match before (i.e., everything except a RUNNING Candidate against a qualifying medical
restriction) continues to produce `[]`, identical to today. `disqualify()`/`finalReview()`/
`detectSafetyOpportunities()` signatures are unchanged. No existing test fixture that does not
construct this exact RUNNING+medical-restriction scenario is affected.

## §23. Testing Requirements

- **Rule/matcher unit tests** (new, e.g. `tests/canonicalSafetyRule.test.js`): the full applicability
  matrix from §14 (each NO-MATCH class, each MATCH class); §12/§13's own exact dimension values;
  the `sourceMemoryId` join correctness (cross-record non-merging, explicit negative test); the
  medical-source and RUNNING-text matchers in isolation, exercising §10's exact tokenize-then-
  exact-membership mechanism: English boundary cases (`doctorate` ≠ `doctor`, `runningmate` ≠
  `running` as one unbroken word, `jogger` ≠ `jog`/`jogging`); **PD-FC-07 Hebrew cases** — each
  approved token's all four accepted forms (bare, `ה`-, `ו`-, `וה`-prefixed) matching, and each
  disallowed prefix (`מ`, `ל`, `ב`, `כ`, `ש`) on the same root **not** matching, plus the
  PD-USP-02 canonical example (`"הרופא שלי אמר לי לא לרוץ"`) proven to match end-to-end; `רצה`
  and every prefixed form of `רצה` proven to never match against any approved token's own set;
  **PD-FC-08 alphanumeric-boundary cases** — `doctor123`, `123doctor`, `run2026`, `רופא123`,
  `123רופא` each proven to NOT match despite containing an approved form as a substring, alongside
  positive proof that punctuation-adjacent forms (`doctor.`, `(doctor)`, `"doctor"`,
  `רופא,`, `(הרופא)`) still match correctly; multiple qualifying pairs for one Candidate.
- **`matchCanonicalSafetyRules()` integration tests** (extend the existing `safetyLayer.js` test
  file, additive block only): the real function called directly with synthetic `pipelineContext`/
  `candidate` fixtures, proving Stage-8-path matches and Stage-9-path unconditional `[]`.
- **`disqualify()` end-to-end tests** (extend, additive block): a real RUNNING Candidate against a
  synthetic `pipelineContext` carrying both `userSafetyContext` and `userSafetyProvenance` is
  disqualified with `reasonCode: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT'`, for both the confirmed-
  active and temporally-unresolved profiles identically (§17); a non-RUNNING Candidate in the same
  pool is unaffected.
- **`evaluateCanonicalSafetyRules()` re-verification (existing function, no change expected, proof
  only):** feeding this rule's own two dimension profiles (§12/§13) through the already-existing,
  unmodified evaluator confirms `BLOCKED` and `DEFERRED` respectively, exactly as §13's own reasoning
  predicts.
- Full repository regression (`node --test tests/*.test.js`) run and reported with exact counts
  before any closure claim.

## §24. Implementation Boundaries

No `index.html`/`sw.js`/`APP_VERSION`/`VERSION` change — `matchCanonicalSafetyRules()` is not a
browser-loaded interpreter module; it is a pure function inside the already-wired `safetyLayer.js`,
requiring no new script tag, no new SHELL entry, no version bump. No new StateAccess operation, no
new capability-holder identity. No file outside `js/coachDecisionSystem/safetyLayer.js` (real
implementation) and the new test file(s) is modified.

## §25. Engineering Acceptance Criteria

- §10's PD-FC-07 + PD-FC-08 mechanism is implemented exactly as specified: tokenization is
  split-based (never `\b`-based) on `[^\p{L}\p{N}]+` — letters AND numbers are token constituents,
  every other character is a delimiter — for both English and Hebrew; the Hebrew accepted-form set
  for each token is exactly the four fixed strings `{token, ה+token, ו+token, וה+token}`,
  precomputed, never derived dynamically from observed input; no other prefix, suffix, or
  morphological variant is recognized; a digit directly adjacent to a letter never creates a token
  boundary.
- All §23 tests exist and pass, including the PD-FC-07 Hebrew accepted-form/rejected-prefix matrix
  and the PD-FC-08 alphanumeric-boundary matrix; full repository regression passes with exact
  counts reported.
- `evaluateRulePredicate`/`evaluateCanonicalSafetyRules`/`selectPrimaryAndSecondary`/
  `safetyIntegrationPort.js` are confirmed byte-unchanged at commit time.
- `decisionFormation.js` is confirmed byte-unchanged at commit time.
- USC-001/USP-001/MAI-001's own files are confirmed byte-unchanged at commit time.
- Scope purity: only `safetyLayer.js` (production) and new test file(s) are modified.

## §26. Closure Criteria

CSR-001 closes when: the real `matchCanonicalSafetyRules()` implementation exists, passes its own
unit and integration tests proving the full §14 applicability matrix and both §12/§13 dimension
profiles, and `disqualify()` is proven, end-to-end with synthetic fixtures, to genuinely disqualify
a RUNNING Candidate against a real medical restriction — with zero change to any other Work Item's
own closed contract. This closes the entire three-plus-one-prerequisite Safety Foundation
initiative's own first real vertical (SFCD's own stated purpose) — it does not authorize, begin, or
imply a second Canonical Safety Rule, a broader vocabulary, temporal-arithmetic capability, or any
other future Work Item.

---

## Document History

- **v1.0** (initial) — initial authoring, per Head of Product + AI Architect authorization
  following USP-001's closure and PD-FC-01/04/05's approval this pass. One Architecture item (§10,
  Hebrew prefix-particle matching) left explicitly open, discovered and empirically verified during
  authoring via direct execution proving (a) naive `\b` is non-functional for Hebrew and (b) the
  closed medical vocabulary's own bare tokens do not literally match USP-001's own canonical
  worked example (`"הרופא שלי"`) without a deliberate resolution.
- **v1.0 (updated — PD-FC-07)** — Head of Product + AI Architect approved
  **PD-FC-07 (Hebrew Orthographic Boundary V1)**: deterministic split-based tokenization (never
  `\b`) followed by exact membership against a closed, precomputed accepted-form set — each
  approved Hebrew token plus exactly its `ה`/`ו`/`וה`-prefixed forms, nothing else. The prior
  draft's two candidate resolutions (a generic seven-prefix-particle system; unrestricted substring
  matching) are both explicitly superseded/rejected. §8, §9, §10, §23, and §25 corrected to state
  this exact mechanism, empirically re-verified against the resolved design this pass. No
  vocabulary broadened, no temporal semantics changed, no Safety dimension changed, PD-FC-01
  through PD-FC-06 not reopened.
- **v1.0 (updated — PD-FC-07 + PD-FC-08)** (this version) — a further tokenizer defect was found
  before implementation and resolved via **PD-FC-08 (Alphanumeric Token Boundary V1)**: the
  letters-only delimiter class (`[^\p{L}]+`) is rejected — it treated digits as delimiters,
  meaning `doctor123`/`run2026`/`רופא123`-style strings would have falsely exposed an isolated,
  matching vocabulary token. Corrected to `[^\p{L}\p{N}]+` — letters and numbers are both token
  constituents; a digit directly adjacent to a letter never creates a boundary. §10, §23, and §25
  corrected and empirically re-verified against the combined PD-FC-07 + PD-FC-08 mechanism this
  pass, including every alphanumeric-boundary and punctuation-boundary case explicitly required
  this round. PD-FC-07's own Hebrew accepted-form rule is unchanged. No vocabulary broadened, no
  temporal semantics changed, no Safety dimension changed, PD-FC-01 through PD-FC-07 not reopened.
  No Product or Architecture decision remains open.
