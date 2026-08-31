# USC-001 — User Safety Context V1
### Safety Foundation — Work Item A
### SPEC v1.0 (updated — PD-USC-01 + availability-shape correction incorporated) — IMPLEMENTED, PENDING FINAL REVIEW

Continues directly from `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD,
CANONICAL, commit `ca1f0e0be05ad2e2ab0cfb315024d906c0519147`) — the sole canonical authority for
this SPEC's architecture. This is Work Item A of the three-Work-Item Safety Foundation
decomposition (SFCD §04, SF-DECOMP-01): **User Safety Context V1**, independent of Work Item B
(Minimum Action Identity V1) and a prerequisite, alongside B, for Work Item C (Canonical Safety
Rule V1 + Real Matcher). This SPEC does not build B or C, does not reopen SL-001, and does not
change any Safety behavior observable today — Foundation A has no consumer until Foundation C
exists (SFCD §07).

**Correction record (Head of Product + AI Architect, PD-USC-01, this pass):** §8's previously-open
Product decision is resolved. **PD-USC-01 — approved:** V1 MUST preserve an explicitly user-stated
temporal qualifier when one exists (e.g. "for a month" in "my doctor told me not to run for a
month"), as literal, verbatim-attributed text — never as a computed expiry, recovery-completion
inference, prognosis, clinical meaning derived from the duration, or unsupported precision
converted from vague language. §7, §8, §9, §13, §14, §17, and §20 are corrected throughout to add
one new literal output field, `statedDurationText`, under the same non-authoritative,
recompute-from-source discipline already governing `restrictedActivityText`. No other Product or
Architecture decision from the prior round is reopened; the two Architecture proposals from §6/§14
(module file name, Pipeline Context field name) remain proposals pending Engineering Readiness
Review, unchanged by this correction.

**Correction record (Engineering Readiness Review confirmation + Implementation Review acceptance,
this pass):** §14's availability-diagnostic shape is corrected. The prior draft proposed a flat,
top-level `pipelineContext.userSafetyContextAvailable` field; direct inspection of `memoryLayer.js`
during implementation showed the real, established repository convention nests every field's
availability diagnostic under `PipelineContext`'s existing shared `availability` object (the same
one already carrying `situationalContext`/`explicitRequestControls`'s own diagnostics). The
confirmed, implemented, and Architecture-accepted shape is `pipelineContext.userSafetyContext`
(the data) plus `pipelineContext.availability.userSafetyContext` (the diagnostic) — **never** a
flat `userSafetyContextAvailable` field. §14 is corrected accordingly; §13 is corrected to match.
`js/coachDecisionSystem/safetyContextInterpreter.js` (§6) and `pipelineContext.userSafetyContext`'s
own field name (§14) were both confirmed unchanged from this SPEC's original proposal at
Engineering Readiness Review — only the availability-diagnostic nesting required correction. No
other Product or Architecture decision from any prior round is reopened by this correction.

---

## §1. Purpose

Build the first of two independent prerequisite foundations for the Safety Foundation initiative:

> **AUTHORITATIVE `userStated` TYPED MEMORY → EXPLICIT/LITERAL RESTRICTION CLASSIFICATION →
> BOUNDED, STRUCTURED, DERIVED SAFETY CONTEXT PROJECTION → AVAILABLE ON PIPELINE CONTEXT.**

This Work Item produces no observable behavior change. No Decision Pipeline stage reads the new
field yet (SFCD §07 — Foundation C is the first reader, and does not exist until both A and B
close). USC-001's own closure criterion is therefore contract-level: a real, tested, correctly
fail-closed interpreter and Memory Layer integration, proven against synthetic Typed Memory
fixtures — not an end-to-end production-backed behavior change (SFCD, Work-Item Decomposition
Report §9, Foundation A closure criteria).

Canonical illustrative example (never itself authorized as a Safety rule by this Work Item): a
user states *"אני לא יכול לרוץ עכשיו, יש לי בעיה בברך"* / "I can't run right now, I have a knee
issue." USC-001's job stops at producing a structured, literal record of that statement's
restriction — it never decides whether any Candidate is safe, and never itself knows what
"RUNNING" means as a Candidate-attached identity (that is Foundation B's and, at match time,
Foundation C's job).

## §2. Canonical Authorities

- **`docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD)** — the governing
  authority for this entire SPEC. Chapter 05 (Foundation A's canonical scope) is reproduced and
  operationalized throughout this document; nothing here contradicts it. Chapters 09-10 (unresolved
  Product/Architecture decisions) are treated as open exactly as recorded there, except SFCD §09
  item 2 (temporal semantics), which this SPEC's own §8 now resolves via PD-USC-01 — SFCD itself is
  not modified by this SPEC and still shows that item open until a future SFCD synchronization pass
  records the resolution there. The two Architecture proposals (SFCD §10 items 1-2) remain open,
  pending Engineering Readiness Review, per §6/§14 below.
- **Statement authority ≠ Interpretation authority (D1-ER-01/07, D1-MU-01, via CSSC-001/EUR-001
  precedent, SFCD §05):** the raw `userStated` record is Path-A authoritative; the Safety Context
  record this Work Item produces is Tier-5/Inference, non-authoritative, never persisted, always
  recomputed fresh (§16).
- **D3 §11.1 / Model B:** Memory Layer remains the sole Pipeline Context assembler; the new
  interpreter is a separate, injected collaborator Memory Layer calls out to — the same pattern
  already used twice (`SituationalContextInterpreter`, `ExplicitRequestInterpreter`,
  `memoryLayer.js:64-78`). Memory Layer itself never classifies.
- **B1 §10 / REM-003 / D1-MU-01:** AI-produced content never becomes authoritative memory; this
  Work Item writes no new Typed Memory record and promotes no interpretation to
  `user_stated`/Fact-tier.
- **`SL-001_SPEC_v1.0.md` (DONE/CLOSED, 2026-08-05):** referenced, not reopened. This Work Item
  does not modify `safetyLayer.js`, does not touch `RiskType`/`EvidenceConfidence`/
  `Correctability`/`Urgency`, and does not populate `matchCanonicalSafetyRules()` — that remains
  Foundation C's job, sequenced strictly after A and B both close (SFCD §04, §07).
- **AD-SF-01 through AD-SF-04 (SFCD §06):** govern Foundation B, not A — cited here only to
  establish the boundary this SPEC does not cross (§19). AD-SF-03 in particular ("the activity
  identity vocabulary must be independent of... Safety Context Interpreter") directly bounds §7's
  design choice: this Work Item's interpreter does not own, define, or embed any closed activity
  enum.

## §3. Scope

**IN SCOPE:** one new interpreter module (proposed `js/coachDecisionSystem/
safetyContextInterpreter.js`, pending Engineering Readiness Review confirmation of file placement
— SFCD §10 item 2); one new, narrow, additive Pipeline Context field (proposed
`userSafetyContext`, pending Engineering Readiness Review confirmation of exact name — SFCD §10
item 1); reuse of the existing `StateAccess.userStatedMemory` op, unchanged; deterministic unit
tests for classification, fail-closed behavior, and injection containment; Memory Layer
integration tests proving graceful degradation; canonical closure at contract level (§21). Standard
`sw.js` SHELL-entry and `APP_VERSION` bump, per repository convention, at implementation time.

**OUT OF SCOPE (binding, per the Head of Product's own instruction this pass and SFCD §05, §08):**
diagnosis; clinical inference; treatment; prognosis; severity inference; invented recovery
timeline; inferring a contraindication from a symptom mention alone (a symptom statement with no
literal restriction — e.g. "my knee hurts" — is not, by itself, a restriction; §9); computing an
expiry date from a stated duration; inferring recovery completion; determining that a medical
restriction has ended; inferring clinical meaning from a stated duration; converting vague temporal
language into unsupported precision (PD-USC-01, §8) — the temporal field this Work Item now
carries is literal preservation only, never computation; Foundation B /
Action Identity (no Candidate field, no activity vocabulary, no `actionIdentity` shape — that is
Work Item B, independent of this one per SFCD §04); Foundation C / Safety Rules or the matcher (no
change to `matchCanonicalSafetyRules()`, no rule content, no disposition logic — that is Work Item
C, sequenced after both A and B); reopening or modifying SL-001 in any way; any change to Safety
behavior observable today (no consumer of this Work Item's output exists yet); any Domain/Topic
vocabulary change (`js/domain/domainTopicVocabulary.js` is untouched — Safety Context is not a
Domain/Topic concept); Preference V1 or Personalized Alternative Selection (both remain paused/out
of scope per SFCD §08); Expression, Stage 7/8/9 consumption of this field (none exists yet — see
§14).

## §4. Raw Statement Contract

Unchanged from USM-001/ESAF-001/CSSC-001/EUR-001, reused verbatim: memory id, exact
`payload.text`, `source`, `status`, `type`, `updated_at`. Consent remains the existing
profile-level `memoryConsent.granted` gate, checked once, at `StateAccess.userStatedMemory`'s
existing fail-closed boundary (`stateAccess.js:234-254`) — not duplicated inside the interpreter,
exactly CSSC-001's and EUR-001's own precedent. This Work Item introduces no new read path, no new
consent gate, and no new Typed Memory record type.

## §5. Source-of-Truth and Authority Model

1. **Raw User Statement Authority.** The literal `payload.text` of an active
   `type∈{fact,preference}∧source==='user_stated'∧status==='active'` record is Direct-User /
   Path-A source knowledge — unchanged from USM-001.
2. **Restriction Classification Authority.** "This statement literally expresses a Safety
   restriction against a specific activity" is **DERIVED_INTERPRETATION**, Tier 5/Inference — never
   inherits layer 1's certainty, exactly the non-inheritance rule CSSC-001 and EUR-001 already
   established for their own respective classes.
3. **Safety Context Projection.** The structured record this Work Item exposes on Pipeline Context
   is a **derived projection** of layer 1, produced by layer 2's classification — never itself
   treated as user-stated fact independent of the memory record it was recomputed from (SFCD §05).
4. **Safety Disposition (not this Work Item's authority).** Whether any given Candidate is
   actually unsafe against a projected restriction is Foundation C's authority, exercised through
   the existing, unmodified SL-001 Safety Decision Matrix. This Work Item produces an input to that
   future decision; it never makes the decision itself.

These four layers are never collapsed into one confidence scale or into each other. Layer 1's
authority does not make layer 2 or layer 3 automatically authoritative — the projection is always
Tier-5/Inference, recomputed fresh (§16), never persisted as new memory.

## §6. Safety Context Interpreter — Module Contract, Ownership

New module (proposed `js/coachDecisionSystem/safetyContextInterpreter.js`) — a **separate,
class-specific** interpreter, the third of its kind, reusing `SituationalContextInterpreter`'s and
`ExplicitRequestInterpreter`'s proven architectural skeleton by pattern, not by import:

- Deterministic, id-sorted batching, bounded by `maxRecordsPerBatch`/max-chars-per-record/
  max-chars-per-batch (transport limits only, never a semantic-completeness cap — the caller in
  Memory Layer always issues every batch required to cover the complete eligible set, exactly
  `situationalContextInterpreter.js`'s own §9-step-3-5 precedent).
- `sourceMemoryId`-only result attribution, never array position.
- **Auth seam:** `deps.callClaude` — the real, already-shipped closure-injection convention
  (`situationalContextInterpreter.js:40-45`, composition root `js/app.js:276-278`). Never
  `getAuthToken` or any Firebase Auth object. The interpreter owns prompt construction and
  model-request-body construction only.
- Fixed `TIMEOUT_MS`, one attempt, no retry — matching `situationalContextInterpreter.js:150-172`'s
  "never throws to its caller" discipline exactly (§12).
- Per-id `<statement>` prompt delimiting for prompt-injection containment (defense-in-depth), with
  real enforcement being strict id-keyed output validation (§11).
- No numeric confidence anywhere in the output or the prompt.
- No persisted verdict — recompute-from-source on every `assembleContext()` call (§16).

**Ownership boundary (binding, AD-SF-03-consistent although AD-SF-03 itself governs Foundation
B):** this module owns the classification act only — deciding whether a statement literally
expresses a Safety restriction, and extracting the literal activity phrase as stated. It does not
own, define, import, or embed any closed activity-identity enum. It has no dependency on Foundation
B's future vocabulary module (§7's design explicitly avoids this — see the reconciliation note
there). It does not compute a disposition, does not know `RiskType`/`EvidenceConfidence`, and does
not call into `safetyLayer.js`.

## §7. Closed Structured Output Contract

Per source record, exactly one verdict, id-keyed:

- **`RESTRICTION_STATED`** — the statement literally, unambiguously expresses that the user is
  restricted from (cannot, should not, is avoiding, has been told not to do) a specific activity.
  Carries two further literal fields:
  - **`restrictedActivityText`** — the literal activity phrase as the user stated it, minimally
    normalized (trim, lowercase; no synonym expansion, no stemming, no mapping to any closed
    vocabulary).
  - **`statedDurationText`** (PD-USC-01, §8) — present **only** when the user's own statement
    literally includes a temporal qualifier for the restriction (e.g. "for a month," "until it
    heals," "for two weeks"); the qualifier's own literal text, minimally normalized (trim,
    lowercase), **verbatim** — never expanded, computed, dated, or converted to a different unit
    or precision than the user's own wording. **Absent (not present on the record at all — never a
    null/empty-string placeholder) when the user's statement carries no temporal qualifier.** This
    field is never used by this Work Item to compute an expiry, infer recovery completion, or
    determine that the restriction has ended (§8, §9).
- **`NOT_RESTRICTION_OR_NOT_CLASSIFIED`** — every other case, including ambiguity, no further
  field.

**No third value. No numeric confidence. No cause/body-part/diagnosis field, no computed-expiry
field, no recovery-status field — deliberately absent by design, not merely unpopulated, since
capturing any of them would require exactly the clinical inference or invented precision this Work
Item is barred from performing (§3, §8).**

**Vocabulary-independence design choice (this SPEC's own decision, per SFCD §05's explicit
delegation — "this sequencing choice is a Work-Item-A-SPEC-level decision, not decided in
[SFCD]"):** because the practical build order is A before B (SFCD §04), no Foundation B activity
enum exists at this Work Item's implementation time. `restrictedActivityText` is therefore left as
literal, minimally-normalized free text — never matched, mapped, or coerced against SFCD's own
six-value illustrative vocabulary (RUNNING, WALKING, CYCLING, SWIMMING, STRENGTH_TRAINING, PADEL)
or any other closed set. Reconciling this literal text against Foundation B's real,
`Candidate.actionIdentity.activity` closed enum is explicitly Foundation C's job, performed once
both A and B are closed (SFCD §07) — this avoids Foundation A building a throwaway, duplicate, or
prematurely-committed vocabulary of its own, consistent with AD-SF-03's spirit even though AD-SF-03
itself scopes to Foundation B.

## §8. Temporal Semantics for User-Stated Restrictions — RESOLVED (PD-USC-01)

**PD-USC-01 (Head of Product + AI Architect, this pass) — approved:** V1 MUST preserve an
explicitly user-stated temporal qualifier when one exists. SFCD §09 item 2's previously-open
question ("whether A's V1 scope actually includes a temporal field at all") is resolved in favor
of **Option 2** from this SPEC's prior draft (literal, verbatim capture) — Option 1 (no temporal
field at all) is superseded and no longer applies.

**Binding contract (PD-USC-01, exact terms):**

- When, and only when, the user's own statement literally includes a temporal qualifier for the
  restriction (canonical example: "My doctor told me not to run for a month" — the "for a month"
  clause), the interpreter's output for that record carries `statedDurationText` (§7): the
  qualifier's own literal text, verbatim, minimally normalized (trim, lowercase) — nothing else.
- **USC-001 MUST NOT**, under any circumstance: infer an expiry date the user did not explicitly
  provide; infer recovery completion; determine that a medical restriction has ended; invent a
  recovery timeline; infer prognosis; infer clinical meaning from the duration; or convert vague
  temporal language ("for a while," "for some time") into unsupported precision (a specific date,
  a specific day count, or any unit conversion the user's own words do not literally state). A
  vague qualifier is captured exactly as vague as the user stated it — never sharpened.
- `statedDurationText` is part of the same **derived, non-authoritative Safety Context
  projection** as the rest of the record (§5 layer 3) — it is not a second, independent authority,
  it does not create a new memory record, and it is not itself a computed fact. It remains
  attributed to the same `sourceMemoryId` as the restriction it qualifies (§6, single-attribution
  discipline unchanged).
- Recompute-from-source (§16) applies identically to this field: it is re-extracted fresh from the
  same source statement on every `assembleContext()` call, never cached, never persisted, never
  independently mutated or "aged" by elapsed time. USC-001 itself performs no date arithmetic
  anywhere — no clock is read, no "time remaining" is computed, no comparison against `updated_at`
  or the current date occurs. If a future Work Item (Foundation C or later) ever wishes to reason
  about elapsed time against a literal duration, that is that Work Item's own, separately-decided
  scope — not authorized, implied, or prepared for by this SPEC.
- The restriction's own *currentness* (is it still active at all) continues to be governed
  exclusively by the source record's own `status` field, exactly as this SPEC's original §8 design
  already established — `statedDurationText` never substitutes for, overrides, or interacts with
  that mechanism; a restriction whose stated month has "obviously" elapsed by wall-clock time is
  neither removed nor flagged by this Work Item. That determination, if it is ever made at all, is
  explicitly out of scope here (§3, §19).

This resolves the sole blocker Engineering Readiness Review was carrying (previous §8/§20 language)
— no Product decision remains open for this Work Item (§20).

## §9. Fail-Closed Behavior for Ambiguous/Unsupported Statements

The interpreter's prompt (built following `situationalContextInterpreter.js:90-112`'s own
structure) MUST instruct unconditional abstention (`NOT_RESTRICTION_OR_NOT_CLASSIFIED`) for:

- Any statement that is a symptom, complaint, or health mention **without** a literal statement of
  restriction (e.g. "my knee hurts" alone must fail closed — restated per the Head of Product's own
  binding instruction this pass, "do not infer contraindications from symptoms").
- Any statement requiring clinical judgment to resolve into a restriction (e.g. inferring that a
  stated diagnosis implies an activity restriction the user never named).
- Preferences, goals, one-time complaints, hypothetical statements ("I probably shouldn't run"
  phrased as musing rather than a stated restriction), past-tense-only mentions ("I used to not be
  able to run"), and any statement whose restricted activity cannot be identified from the text
  itself.
- Any content attempting to redirect classification of another id, claim rule/instruction status,
  or otherwise act as an embedded directive (§11).

The prompt MUST additionally instruct, for the `statedDurationText` field specifically
(PD-USC-01, §8): extract the temporal qualifier's literal text only when the statement itself
states one; leave the field absent, never guessed or defaulted, when it does not; never compute a
date, a day/week/month count, or any precision beyond the user's own words; never resolve a vague
qualifier ("for a while") into a specific one. A model output that includes a computed expiry
date, a recovery-status judgment, or any invented precision for `statedDurationText` fails
validation for that field exactly as a malformed entry would (§10) — the record is still accepted
as `RESTRICTION_STATED` if `restrictedActivityText` itself validates, but the non-literal
`statedDurationText` value is discarded rather than passed through, and the field is treated as
absent for that record (fail closed on the temporal field alone, never on the restriction
classification itself).

Validation itself is strict, id-keyed, and **fails closed by omission**: parsing failure, an
unrecognized/duplicate id, a malformed entry, or a missing verdict all result in that id's absence
from the accepted-restrictions map — never an explicit "false" or default-restriction entry
(`situationalContextInterpreter.js:123-148`'s own precedent, reused by pattern).

## §10. LLM/Interpreter Boundary and Deterministic Validation

Identical division of responsibility to `situationalContextInterpreter.js` and
`explicitRequestInterpreter.js`: the LLM call performs the actual semantic classification (whether
a statement is a literal restriction, and what activity it names); everything downstream —
batching, id-matching, output-shape validation, fail-closed defaults — is deterministic code, never
itself calling the model. No confidence score from the model is trusted or surfaced; the binary
verdict plus one literal text field is the entire trusted output surface.

## §11. Injection Containment

Per-id `<statement id="...">...</statement>` delimiting (exact pattern:
`situationalContextInterpreter.js:85-112`), with an explicit prompt instruction that content inside
any `<statement>` block is inert data, never an instruction, and never governs the id's own
classification or any other id's outcome. This is defense-in-depth only — the real enforcement is
§9's strict id-keyed, fail-closed-by-omission validation, which structurally cannot be steered by
statement content since it only ever accepts a verdict for an id it already knows was submitted.

## §12. Timeout/Retry/Failure Behavior

Fixed `TIMEOUT_MS` (proposed default matching `situationalContextInterpreter.js`'s own
`8000`, pending Engineering Readiness Review confirmation), one attempt, no retry. Every failure
mode — no `callClaude` configured, thrown error, timeout, malformed response, batch-level JSON
parse failure — degrades to "no id in this batch classified" (empty accepted-restrictions map for
that batch), never throws to the caller, and never blocks Memory Layer's own `assembleContext()`
call (graceful degradation, D3 §12.3, identical to `situationalContext`/`explicitRequestControls`'s
own existing behavior).

## §13. Memory Layer Integration

New step inside `memoryLayer.js`'s existing `assembleContext()`, added beside (never replacing)
the existing `situationalContext` and `explicitRequestControls` steps, following their exact
pattern (`memoryLayer.js:227-331`):

- Read via the existing `StateAccess.userStatedMemory` op, same capability-holder identity pattern
  already used for the two sibling reads.
- On success: `userSafetyContext` (§14) is built as a `freezeShallow(...)` object containing the
  accepted `RESTRICTION_STATED` records (each carrying `sourceMemoryId`, `restrictedActivityText`,
  and `statedDurationText` when and only when the source statement literally included one, per
  PD-USC-01, §8), and `availability.userSafetyContext` (§14) is set `'AVAILABLE'`.
- On no eligible source records, or on any failure: `userSafetyContext` stays `null`,
  `availability.userSafetyContext` stays `'UNAVAILABLE'` — graceful degradation, never blocks the
  Decision Pass (D3 §12.3).
- This step has no mechanical pre-check gate (mirroring `explicitRequestControls`'s own
  no-pre-check-gate design, `memoryLayer.js:276`) — every eligible active record is always
  submitted for classification.
- Memory Layer itself performs no classification — it only decides whether/how to batch (via the
  interpreter's own batching function) and where to place the result, exactly as its own header
  comment already states its exclusive-Context-Assembly-only responsibility.

## §14. Pipeline Context Field and Availability Semantics

**Confirmed during Engineering Readiness Review and accepted during implementation review** (this
shape supersedes an earlier proposed flat `userSafetyContextAvailable` top-level field, which does
not match repository convention and MUST NOT be used):

New, additive-only field on `PipelineContext`:

- **`pipelineContext.userSafetyContext`** — `{ items: [{ sourceMemoryId, restrictedActivityText,
  statedDurationText? }, ...] }` when available (`statedDurationText` present only when
  PD-USC-01's §8 condition is met, otherwise absent from the item entirely — never
  `null`/empty-string on the item), `null` when not.
- **`pipelineContext.availability.userSafetyContext`** — `'AVAILABLE'|'UNAVAILABLE'`, a new key
  inside `PipelineContext`'s existing, already-established `availability` sub-object (the same
  nested object that already carries `situationalContext`/`explicitRequestControls`'s own
  diagnostics, confirmed directly against `memoryLayer.js`'s real, current return shape). There is
  **no** flat, top-level `userSafetyContextAvailable` field anywhere on `PipelineContext` — the
  repository's own established convention nests every field's availability diagnostic under this
  one shared `availability` object, and `userSafetyContext` follows that convention exactly, the
  same as its two siblings.

No existing PipelineContext field, shape, or consumer is modified — this is a pure addition. No
Stage (Opportunity Detection through Expression) reads this field as of this Work Item's closure —
it is populated and available, but has zero live consumers until Foundation C exists (SFCD §07).

## §15. StateAccess/Capability Implications

No new `StateAccess` operation is required. This Work Item reuses the existing
`StateAccess.userStatedMemory` read op unchanged, via a new capability-holder identity for Memory
Layer's Safety Context read step (same pattern as the two existing sibling identities for
`situationalContext`/`explicitRequestControls`). No new consent gate, no new StateAccess
capability class, and no change to `stateAccess.js`'s existing fail-closed consent boundary
(`stateAccess.js:234-254`).

## §16. Recompute-From-Source Lifecycle

No persisted verdict anywhere. `userSafetyContext` is fully recomputed, from the complete current
set of eligible active `userStated` records, on every `assembleContext()` call — never cached
across Decision Passes, never written back to Typed Memory, never promoted to
`user_stated`/Fact-tier (B1 §10 / REM-003 / D1-MU-01, §2). If the user later states a reversal
("I can run again now"), the next Decision Pass's fresh classification reflects it automatically,
with no explicit reversal-tracking mechanism needed for V1 (mirroring EUR-001's own explicit
non-scoping of a "historical request/reversal ledger," `EUR_001_SPEC_v1.0.md` §3) — the record's
own `status` field, already governed by the existing Typed Memory model, is the sole source of
currentness.

## §17. Testing Requirements

- **Interpreter unit tests** (new test file, e.g. `tests/safetyContextInterpreter.test.js`):
  correct `RESTRICTION_STATED` classification for unambiguous literal restrictions; correct
  `NOT_RESTRICTION_OR_NOT_CLASSIFIED` fail-closed classification for symptom-only mentions,
  preferences, goals, hypotheticals, past-tense-only statements, and ambiguous text; injection
  containment (a statement embedding a fake instruction to classify itself or another id a
  particular way must not succeed); duplicate/unknown/malformed id handling; timeout and
  `callClaude`-failure degradation (never throws, always empty-batch result); batch-boundary
  invariance (a record's classification is identical regardless of which batch it lands in).
- **Temporal field tests (PD-USC-01, §8), same file:** `statedDurationText` present and literal
  when the fixture statement includes a duration ("for a month" → captured verbatim, not "30
  days" or a computed date); field absent (not null, not empty string) when the fixture statement
  has no duration; a fixture engineered to try to smuggle a computed expiry/recovery
  judgment through the field is rejected — the field is discarded for that record while
  `restrictedActivityText`/`RESTRICTION_STATED` still validate normally (§9); a vague-duration
  fixture ("for a while") is preserved exactly as vague, never sharpened to a specific figure.
- **Memory Layer integration tests** (extend `tests/memoryLayer.test.js`): `userSafetyContext`
  populated correctly from synthetic eligible records; graceful degradation to
  `null`/`UNAVAILABLE` on failure or absence; no interference with existing
  `situationalContext`/`explicitRequestControls` steps; frozen-object immutability.
- **No production-backed acceptance test is required or possible for this Work Item alone** —
  unlike EUR-001 (which had a live G-2 FOOD_LOGGING consumer), USC-001 has no consumer until
  Foundation C exists (SFCD §07). Contract-level synthetic-fixture testing is this Work Item's own
  closure criterion, per the already-approved Work-Item Decomposition Report's Foundation A closure
  criteria (SFCD's own Background, Investigation 3).
- Full repository regression (`node --test tests/*.test.js`) must be run and reported with exact
  pass/fail counts before any closure claim, per standing session discipline.

## §18. Backward Compatibility

Additive only. No existing `PipelineContext` field, shape, consumer, or test fixture is modified.
No existing `StateAccess` op, capability, or consent gate changes shape. No existing interpreter
(`situationalContextInterpreter.js`, `explicitRequestInterpreter.js`) is touched. No existing
Candidate, Stage 7/8/9, Expression, or `safetyLayer.js` contract changes. A consumer that does not
yet read `userSafetyContext` is entirely unaffected — exactly the same non-interference guarantee
`explicitRequestControls` already demonstrated when it was added beside `situationalContext`.

## §19. Explicit Foundation B/C Boundaries

**Not built by this Work Item (binding, restated from §3):**
- No `Candidate.actionIdentity` field, no activity-identity vocabulary module, no change to any
  Candidate producer (`recommendationEngine.js`, `initiativeEngine.js`) — all Foundation B.
- No change to `matchCanonicalSafetyRules()`, no rule content, no `RiskType`/`EvidenceConfidence`/
  `Correctability`/`Urgency` selection, no `DEFERRED`-vs-`BLOCKED` disposition logic — all
  Foundation C.
- No Stage 8/9 contract change, no `pipelineContext`-consuming code added anywhere in
  `safetyLayer.js`.

This Work Item's own closure hands Foundation C exactly one new, real, tested input:
`pipelineContext.userSafetyContext` (§14) — nothing more, nothing less.

## §20. Engineering Acceptance Criteria

- All §17 tests exist and pass, including the PD-USC-01 temporal-field tests; full repository
  regression passes with exact counts reported.
- §8 is closed (PD-USC-01 approved this pass) — no outstanding Product decision blocks this Work
  Item's Engineering Readiness Review.
- Exact module path/name (§6) and exact Pipeline Context field name (§14) are confirmed at
  Readiness Review, per SFCD §10 items 1-2 (not authorized by this SPEC alone).
- Scope purity: no file outside the additive set in §3/§13/§14 is modified; no Foundation B or C
  file, no `safetyLayer.js`, no `domainTopicVocabulary.js`, no Roadmap/Changelog/Architecture
  document is touched by this Work Item's own implementation commit.
- Exact-path staging only at commit time, per standing session discipline.

## §21. Closure Criteria

Matches the already-approved Work-Item Decomposition Report's own Foundation A closure criterion
verbatim: **"A closes when: the interpreter exists, passes its own unit tests (classification +
fail-closed + injection-containment, mirroring EUR-001/CSSC-001's own test suites), and populates
a real `pipelineContext` field from synthetic Typed Memory fixtures — with zero dependency on B or
C existing."** No production-backed, end-to-end behavior proof is required or possible for this
Work Item alone (§17). Closure does not authorize, begin, or imply readiness for Foundation B or C
— each remains its own, separately-authorized Work Item (SFCD §04).

---

## Document History

- **v1.0** (initial) — initial authoring, per Head of Product + AI Architect authorization
  following SFCD's closure. One Product decision (§8, temporal semantics) left explicitly open and
  flagged as an Engineering Readiness blocker; two Architecture proposals (module file name §6,
  Pipeline Context field name §14) offered as SPEC-level proposals pending Readiness Review
  confirmation, per SFCD §10's own explicit delegation of those specifics to this SPEC and its
  Readiness Review. No other Product or Architecture decision is introduced beyond what SFCD
  already froze.
- **v1.0 (updated — PD-USC-01)** — Head of Product + AI Architect approved
  PD-USC-01: V1 MUST preserve an explicitly user-stated temporal qualifier, literal preservation
  only, no computed expiry/recovery/prognosis/clinical meaning/unsupported precision. §3, §7, §8,
  §9, §13, §14, §17, and §20 corrected to add the `statedDurationText` literal field under the
  same non-authoritative, recompute-from-source, single-attribution discipline already governing
  `restrictedActivityText`. §8's Engineering Readiness blocker is closed. The two Architecture
  proposals (§6, §14) remain unresolved-but-non-blocking, unchanged by this correction.
- **v1.0 (updated — PD-USC-01 + availability-shape correction)** (this version) — Engineering
  Readiness Review confirmed `js/coachDecisionSystem/safetyContextInterpreter.js` (§6) and the
  `pipelineContext.userSafetyContext` field name (§14) unchanged from proposal; implementation then
  revealed §14's proposed flat `userSafetyContextAvailable` top-level field did not match the real
  repository convention (`PipelineContext`'s existing shared `availability` sub-object). Corrected
  §13/§14 to specify `pipelineContext.userSafetyContext` (data) plus
  `pipelineContext.availability.userSafetyContext` (diagnostic) as the sole confirmed shape —
  Architecture-accepted during Implementation Review. Status updated to reflect implementation
  completion, pending Final Review. No Product behavior, temporal semantics, classification
  contract, or any other USC-001 contract element is altered by this correction.
