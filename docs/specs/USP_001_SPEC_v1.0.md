# USP-001 — User Safety Provenance V1
### Safety Foundation — Prerequisite Work Item (downstream of A, upstream of C)
### SPEC v1.0 (updated — PD-USP-02 + availability-semantics clarification) — IMPLEMENTED, PENDING CLOSURE

Continues directly from `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD,
CANONICAL, commit `ca1f0e0be05ad2e2ab0cfb315024d906c0519147`), `docs/specs/USC_001_SPEC_v1.0.md`
(Work Item A, CLOSED — commit `84886767cd4ef6eb6567ca2206b5a0f7fd0bfa43`), and
`docs/specs/MAI_001_SPEC_v1.0.md` (Work Item B, CLOSED — commit
`01e15b8adb57656b988107e58feace2f0f4f0c4b`) — the canonical authorities for this SPEC's
architecture. USP-001 is a **new, independent, fourth Work Item**, not a renaming, extension, or
reopening of USC-001 — it is conceptually positioned downstream of USC-001 (reads the same class of
authoritative source) and upstream of Foundation C (Canonical Safety Rule V1 + Real Matcher, not
yet built). This SPEC does not build Foundation C, does not classify anything as medical, does not
touch RUNNING classification, and does not modify `safetyContextInterpreter.js`, USC-001's own SPEC
document, MAI-001, or any Safety Layer file.

**Correction record (Head of Product + AI Architect, PD-USP-02, this pass):** the Engineering
Readiness Review's own flagged gap (whether `statedSourceText` may capture a bare personal proper
name) is resolved. **PD-USP-02 — approved: USP-001 V1 MUST NOT extract a bare personal proper
name.** The V1 provenance boundary is limited to an explicitly stated **relationship or role
descriptor** ("my doctor," "my coach," "my friend," "my trainer," and their Hebrew equivalents) —
never a bare proper name ("Yossi," "Cohen," "Dr. Cohen"), and a proper name MUST NOT be normalized,
interpreted, or converted into an implied role (e.g. "Dr. Cohen" does not authorize inventing
"doctor"). §7, §8, §9, §22, and §24 are corrected to state this boundary explicitly and
exhaustively. No other Product or Architecture decision from any prior round is reopened; proper-
name provenance remains explicitly out of scope for V1 and may be considered only by a future,
separately-authorized Work Item.

**Correction record (Head of Product + AI Architect, pre-closure documentation clarification, this
pass):** the Final Review identified a wording ambiguity — §13's standalone phrase "on any
failure," read in isolation, could be misread as implying model/timeout/malformed-response
failures resolve to `null`/`UNAVAILABLE`. This is a documentation clarity fix only, **not a Product
or Architecture decision, not a behavior change** — the implementation, already reviewed and
approved, was and remains correct. §12, §13, §15, §22, and §24 are corrected to state explicitly,
in each relevant location, that such failures are absorbed inside `classify()` (§12, unchanged)
and therefore resolve to `{items: []}`/`AVAILABLE` — exactly like a legitimate zero-match
classification — while `null`/`UNAVAILABLE` is reserved exclusively for "no eligible records" or an
upstream `StateAccess` read failure. No other section, Product decision, or Architecture decision
is altered.

## §1. Purpose

Preserve, as its own bounded, derived, non-authoritative projection, **who the user explicitly,
literally reported as the source of a Safety restriction** — nothing about what that source means.

> **AUTHORITATIVE `userStated` TYPED MEMORY → LITERAL NAMED-SOURCE EXTRACTION →
> BOUNDED, STRUCTURED, DERIVED PROVENANCE PROJECTION → AVAILABLE ON PIPELINE CONTEXT.**

Canonical illustrative example (never itself authorized as a classification by this Work Item): a
user states *"My doctor told me not to run for a month."* USP-001's job stops at preserving the
literal phrase *"my doctor"* — it never decides that this names a medical professional, never
decides trustworthiness, and never decides whether the restriction is currently active. Those are,
respectively, Foundation C's job (classification, not yet built) and already outside both USC-001's
and USP-001's own scope (temporal currentness, PD-FC-02/PD-FC-03).

## §2. Canonical Authorities

- **SFCD** — Chapters 04-08 (decomposition, Foundation A/B/C scope) remain governing; USP-001 is
  recorded here as a Product-authorized prerequisite Work Item sitting between the already-closed
  Foundation A and the not-yet-built Foundation C, per the Head of Product + AI Architect's own
  explicit architecture decision this pass ("Do NOT reopen USC-001... introduced through a separate
  prerequisite Work Item: USP-001").
- **`docs/specs/USC_001_SPEC_v1.0.md` (Work Item A, CLOSED)** — cited for precedent only
  (interpreter skeleton, literal-substring validation discipline, Memory Layer sibling-step
  pattern). USC-001's own file, contract, and commit are **not modified, extended, or reinterpreted**
  by this SPEC.
- **Statement authority ≠ Interpretation authority (D1-ER-01/07, D1-MU-01, via CSSC-001/EUR-001/
  USC-001 precedent):** the raw `userStated` record remains Path-A authoritative; the provenance
  projection this Work Item produces is Tier-5/Inference, non-authoritative, never persisted, always
  recomputed fresh (§18).
- **D3 §11.1 / Model B:** Memory Layer remains the sole Pipeline Context assembler; the new
  interpreter is a separate, injected collaborator Memory Layer calls out to — the fourth instance
  of the same pattern (`SituationalContextInterpreter`, `ExplicitRequestInterpreter`,
  `SafetyContextInterpreter`, now `UserSafetyProvenanceInterpreter`).
- **B1 §10 / REM-003 / D1-MU-01:** AI-produced content never becomes authoritative memory; this
  Work Item writes no new Typed Memory record and promotes no interpretation to
  `user_stated`/Fact-tier.
- **PD-FC-01, PD-FC-02, PD-FC-03, PD-FC-06** — recorded in §20 as downstream canonical context
  Foundation C will later consume; **none is implemented, classified, or acted upon by this Work
  Item.**
- **Approved future Foundation-C vocabularies (RUNNING, medical-source)** — reproduced verbatim in
  §20 for boundary-explanation purposes only; **not implemented as classifiers anywhere in this
  Work Item.**

## §3. Scope

**IN SCOPE:** one new interpreter module (proposed `js/coachDecisionSystem/
userSafetyProvenanceInterpreter.js`, pending Engineering Readiness Review confirmation of exact
name/path); one new, narrow, additive Pipeline Context field
(`pipelineContext.userSafetyProvenance` + `pipelineContext.availability.userSafetyProvenance`);
reuse of the existing `StateAccess.userStatedMemory` op, unchanged; deterministic unit tests for
extraction, fail-closed behavior, and injection containment; Memory Layer integration tests proving
graceful degradation and non-interference with the three existing sibling steps
(`situationalContext`, `explicitRequestControls`, `userSafetyContext`); canonical closure at
contract level.

**OUT OF SCOPE (binding):** any modification of `safetyContextInterpreter.js`, USC-001's own SPEC,
or USC-001's existing Memory Layer step; medical-source classification of any kind (§20); RUNNING
activity classification of any kind (§20); any Safety Rule, `matchCanonicalSafetyRules()`,
`safetyLayer.js`, `safetyIntegrationPort.js`, Stage 8/9 behavior, or Foundation C generally;
temporal currentness determination of any kind (parsing, expiry, "is this still active" — remains
downstream, per PD-FC-02/PD-FC-03, not this Work Item's concern even for `statedDurationText`,
which this Work Item never reads, writes, or duplicates); diagnosis, treatment, prognosis, cause,
severity, or source trustworthiness; Domain/Topic vocabulary; Preference; Expression; Action
Generation; combining/optimizing this Work Item's own read with any sibling interpreter's read
(§21).

## §4. Source-of-Truth / Authority Model

1. **Raw User Statement Authority.** The literal `payload.text` of an active
   `type∈{fact,preference}∧source==='user_stated'∧status==='active'` record is Direct-User /
   Path-A source knowledge — unchanged from USM-001/USC-001.
2. **Named-Source Extraction Authority.** "This statement literally names who is reported as the
   source of a restriction" is **DERIVED_INTERPRETATION**, Tier 5/Inference — never inherits layer
   1's certainty.
3. **Provenance Projection.** The structured record this Work Item exposes on Pipeline Context is a
   **derived projection** of layer 1, produced by layer 2's extraction — never itself treated as
   user-stated fact independent of the memory record it was recomputed from.
4. **Source-Type Classification (explicitly not this Work Item's authority).** Whether a named
   source ("my doctor," "my coach," "my friend") denotes a medical professional, is trustworthy, or
   carries any other categorical meaning is Foundation C's future authority, exercised through its
   own closed medical-source vocabulary (§20) — not yet built, not exercised here.

These four layers are never collapsed. Layer 1's authority does not make layer 2 or layer 3
automatically authoritative — the projection is always Tier-5/Inference, recomputed fresh (§18),
never persisted as new memory.

## §5. Raw User-Stated Input Contract

Unchanged from USM-001/ESAF-001/CSSC-001/EUR-001/USC-001, reused verbatim: memory id, exact
`payload.text`, `source`, `status`, `type`, `updated_at`. Consent remains the existing
profile-level `memoryConsent.granted` gate, checked once, at `StateAccess.userStatedMemory`'s
existing fail-closed boundary (`stateAccess.js:234-254`) — not duplicated inside the interpreter.
This Work Item introduces no new read path, no new consent gate, and no new Typed Memory record
type. It reads the **same eligible record set** USC-001 reads, independently — not USC-001's own
already-narrowed output (§9, §19).

## §6. Interpreter Ownership

New module (proposed `js/coachDecisionSystem/userSafetyProvenanceInterpreter.js`) — a **separate,
class-specific** interpreter, the fourth of its kind, reusing `SituationalContextInterpreter`'s,
`ExplicitRequestInterpreter`'s, and `SafetyContextInterpreter`'s proven architectural skeleton by
pattern, never by import:

- Deterministic, id-sorted batching, bounded by `maxRecordsPerBatch`/max-chars-per-record/
  max-chars-per-batch (transport limits only, never a semantic-completeness cap).
- `sourceMemoryId`-only result attribution, never array position.
- **Auth seam:** `deps.callClaude` — the real, already-shipped closure-injection convention
  (`js/app.js`'s existing composition-root pattern, extended a fourth time). Never `getAuthToken`
  or any Firebase Auth object.
- Fixed `TIMEOUT_MS` (proposed `8000`, matching the three sibling interpreters), one attempt, no
  retry — "never throws to its caller" discipline, identical to the three siblings.
- Per-id `<statement>` prompt delimiting for prompt-injection containment (defense-in-depth), with
  real enforcement being strict id-keyed, literal-substring-validated output validation (§9).
- No numeric confidence anywhere in the output or the prompt.
- No source-category output, no MEDICAL boolean, no trust score, no normalized source token — only
  literal text or absence (§7).
- No persisted verdict — recompute-from-source on every `assembleContext()` call (§18).

**Ownership boundary (binding):** this module owns the literal named-source extraction act only.
It does not classify, does not decide medical/non-medical, does not decide trustworthiness, does
not touch `restrictedActivityText`/`statedDurationText` (USC-001's own fields — this module reads
the same raw statements independently and never reads or writes USC-001's own output), and does not
call into `safetyLayer.js` or any Safety file.

## §7. Closed Classification/Output Contract

Per source record, exactly one verdict, id-keyed:

- **`NAMED_SOURCE_STATED`** — the statement literally, unambiguously names who is reported as
  telling/instructing the user about the restriction, **using an explicit relationship or role
  descriptor** (e.g. "my doctor," "my coach," "my friend," "my trainer," "הרופא שלי") —
  **PD-USP-02: never a bare personal proper name** ("Yossi," "Cohen," "Dr. Cohen"). Carries one
  further literal field:
  - **`statedSourceText`** — the literal named-source *role/relationship* phrase as the user
    stated it, minimally normalized (trim, lowercase for Latin script only — Hebrew has no case
    distinction), verbatim — never expanded, categorized, or converted. Enforced as a literal
    substring of the source statement text, identical mechanism to USC-001's own
    `restrictedActivityText`/`statedDurationText` (`isLiteralSubstringOf`, reused by pattern).
- **`NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`** — every other case: no source is named at all ("I
  decided," "I was told" — passive/unspecified); an anonymous placeholder ("someone," "they," "a
  person"); **PD-USP-02: a bare personal proper name, with or without a title** ("Yossi," "Cohen,"
  "Dr. Cohen" — a title-plus-name string is not itself a role descriptor and MUST NOT be reduced to
  one, §8); the named source is otherwise ambiguous; or the record is not itself a restriction
  statement at all. No further field.

**No third value. No confidence score. No source-category field. No MEDICAL boolean. No trust
score. No inferred profession. No normalized source token** — deliberately absent by design, not
merely unpopulated, since capturing any of them would require exactly the classification this Work
Item is barred from performing (§1, §3).

## §8. `statedSourceText` Literal Semantics

- Present **only** when the statement's own words explicitly name a source **using a relationship
  or role descriptor** — a passive construction ("I was told," "הודיעו לי"), a self-attributed
  decision ("I decided," "החלטתי"), an anonymous placeholder ("someone," "they," "a person"), or
  **(PD-USP-02) a bare personal proper name** ("Yossi," "Cohen") MUST NOT populate this field.
- **PD-USP-02 — the V1 provenance boundary is role/relationship descriptors only:** "my doctor,"
  "my coach," "my friend," "my trainer," and their direct equivalents (family/professional
  relationship terms stated as such). A bare proper name is never populated, never normalized,
  never interpreted, and never silently converted into an implied role — **"Dr. Cohen told me not
  to run" does NOT authorize USP-001 to invent, infer, or output "doctor."** No `Dr.`/`Dr`/`ד"ר`
  title-recognition logic of any kind exists in this Work Item — a title-plus-name string is
  treated identically to a bare name: `NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`.
- Verbatim, literal, minimally normalized — never a category label ("a professional"), never an
  inferred profession, never expanded from a pronoun or implicit reference, never a name reduced or
  mapped to a role.
- Never used by this Work Item, or by any consumer of this Work Item's own output, to determine
  medical status, trustworthiness, or any other categorical meaning — that determination is
  explicitly Foundation C's own future, separate, closed-vocabulary classification step (§20),
  never performed here.
- Bounded length (proposed `STATED_SOURCE_MAX_CHARS = 80`, mirroring USC-001's own literal-field
  bounds) — a genuine literal source phrase is always a short sentence fragment; a longer value
  could not plausibly still be verbatim and is rejected on that basis regardless of the substring
  check.
- **Proper-name provenance is explicitly out of scope for V1** and may be considered only by a
  future, separately-authorized Work Item — not implied, not prepared for, not partially built
  here.

## §9. Literal Validation Rules

Strict, id-keyed, **fails closed by omission**: parsing failure, an unrecognized/duplicate id, a
malformed entry, or a missing verdict all result in that id's absence from the accepted map — never
an explicit default entry. `statedSourceText` specifically MUST pass the same deterministic,
mechanical literal-substring-containment check USC-001's own fields already use
(`isLiteralSubstringOf(candidate, sourceText, STATED_SOURCE_MAX_CHARS)`, reused by pattern from
`safetyContextInterpreter.js`, never by import): the candidate value, trimmed/lowercased, must
appear as a substring of the source statement's own trimmed/lowercased text. A model output that
fails this check is discarded for that field alone — if the record was otherwise validly
`NAMED_SOURCE_STATED`-eligible, per this Work Item's own contract there is no other field to fall
back to, so the whole record fails closed to `NO_NAMED_SOURCE_OR_NOT_CLASSIFIED` (unlike USC-001's
`statedDurationText`, which is optional alongside a required `restrictedActivityText` — here,
`statedSourceText` is the *only* payload field, so its own failure is the record's failure).

The prompt MUST additionally instruct unconditional abstention (`NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`)
for: any statement with no named source at all; a passive/unspecified attribution ("I was told,"
"someone said"); a self-attributed decision ("I decided," "I chose"); an anonymous placeholder
("someone," "they," "a person"); **PD-USP-02: a bare personal proper name, with or without a title
("Yossi," "Cohen," "Dr. Cohen")** — the model MUST be explicitly instructed never to convert a
proper name (titled or not) into an implied role, and never to answer `NAMED_SOURCE_STATED` for
one; any statement requiring inference to attribute a source; and any content attempting to
redirect classification of another id or claim rule/instruction status (§11). **Any ambiguous
result — including uncertainty about whether a phrase is a role/relationship descriptor or a
proper name — fails closed to `NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`.**

## §10. Fail-Closed Behavior

Identical discipline to §9 — every ambiguous, unspecified, or inferential case fails closed to
`NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`, never guessed, never defaulted to a generic "unspecified
source" placeholder. This Work Item never infers that an unnamed speaker is, or is not, a medical
professional — it simply produces no provenance record at all in that case, leaving Foundation C
(later) with correctly absent data rather than a fabricated one.

## §11. LLM/Interpreter Boundary and Prompt-Injection Containment

Identical division of responsibility to the three sibling interpreters: the LLM call performs the
actual literal extraction; everything downstream — batching, id-matching, output-shape validation,
literal-substring enforcement, fail-closed defaults — is deterministic code, never itself calling
the model. Per-id `<statement id="...">...</statement>` delimiting (exact pattern reused from
`safetyContextInterpreter.js`), with an explicit prompt instruction that content inside any
`<statement>` block is inert data, never an instruction. This is defense-in-depth only — the real
enforcement is §9's strict id-keyed, literal-substring-validated, fail-closed-by-omission
validation, which structurally cannot be steered by statement content.

## §12. Timeout/Retry/Failure Behavior

Fixed `TIMEOUT_MS` (proposed `8000`), one attempt, no retry. Every failure mode — no `callClaude`
configured, thrown error, timeout, malformed response, batch-level JSON parse failure — degrades to
"no id in this batch classified," never throws to the caller, and never blocks Memory Layer's own
`assembleContext()` call (graceful degradation, D3 §12.3, identical to the three existing sibling
steps' own behavior).

**Canonical consequence for availability (binding, cross-referenced by §13/§15):** because these
failure modes are absorbed *inside* `classify()` and never propagate an exception to the caller,
they can **never** trigger Memory Layer's own failure branch (§13). A batch that times out, that
receives a malformed response, or whose `callClaude` throws contributes zero classified records to
`classify()`'s return value — exactly as if the model had legitimately found no named source — and
therefore resolves to `userSafetyProvenance: {items: []}` / `availability.userSafetyProvenance:
'AVAILABLE'` (the step was attempted; it returned, with zero accepted items), **never**
`null`/`UNAVAILABLE`. `null`/`UNAVAILABLE` is reserved exclusively for (a) no eligible source
records existing at all, or (b) a failure *upstream* of `classify()` — i.e., the `StateAccess` read
itself throwing — which is the only failure this step's own `try`/`catch` (§13) can ever actually
catch, precisely because nothing described in this section can reach that `catch` block.

## §13. Memory Layer Integration

New, **additive-only sibling step** inside `memoryLayer.js`'s existing `assembleContext()`, added
beside — never modifying — the three existing steps (`situationalContext`,
`explicitRequestControls`, `userSafetyContext`):

- Read via the existing `StateAccess.userStatedMemory` op, the **same** already-general
  `memoryLayer/USER_STATED_MEMORY_READ` capability-holder identity the three sibling steps already
  use (confirmed reusable, engine+action scoped, not call-site scoped — the same fact already
  proven true for USC-001's own third use of this identity).
- On success — meaning `classify()` was invoked and returned, with zero or more accepted
  records — `userSafetyProvenance` is built as a `freezeShallow(...)` object containing whatever
  `NAMED_SOURCE_STATED` records were accepted (each carrying `sourceMemoryId` and
  `statedSourceText`), and `userSafetyProvenanceAvailable` is set `true`. **This "success" branch
  is the one that applies whenever eligible records exist, including every model/timeout/malformed-
  response failure mode §12 describes** — those failures are absorbed *inside* `classify()` and
  never reach this step's own `try`/`catch`, so from this step's own point of view `classify()`
  simply returned (possibly with an empty array), which is success by this step's own definition.
- On no eligible source records, **or on a failure this step's own `try`/`catch` actually catches —
  which, given the above, can only be an upstream failure of the `StateAccess` read itself
  (`await ...read.userStatedMemory()` throwing, e.g. a stale-session error) — never a
  model/interpreter-level failure**: `userSafetyProvenance` stays `null`,
  `userSafetyProvenanceAvailable` stays `false` — graceful degradation, never blocks the Decision
  Pass (D3 §12.3). **A failure in this step must not corrupt or affect
  `situationalContext`/`explicitRequestControls`/`userSafetyContext` in any way** — each step's own
  independent `try`/`catch` block, exactly like the three existing steps, guarantees this.
- No mechanical pre-check gate (mirroring `explicitRequestControls`'s/`userSafetyContext`'s own
  no-pre-check-gate design) — every eligible active record is always submitted for extraction.
- Memory Layer itself performs no extraction — `UserSafetyProvenanceInterpreter` (a separate,
  injected collaborator) owns the entire literal-extraction act; this step only decides
  whether/how to batch and places the already-validated result.

## §14. pipelineContext Contract

New, additive-only field on `PipelineContext`:

- **`pipelineContext.userSafetyProvenance`** — `{ items: [{ sourceMemoryId, statedSourceText },
  ...] }` when available, `null` when not.
- **`pipelineContext.availability.userSafetyProvenance`** — `'AVAILABLE'|'UNAVAILABLE'`, a new key
  inside `PipelineContext`'s existing, already-established `availability` sub-object — the same
  nested-object convention `userSafetyContext` itself already confirmed as correct (Architecture-
  accepted during USC-001's own Implementation Review) — **never** a flat top-level
  `userSafetyProvenanceAvailable` field.

**Deliberately not merged into `userSafetyContext.items[]`** — that would require modifying
USC-001's own existing Memory Layer step, which this Work Item is explicitly forbidden from doing.
Foundation C, when it exists, joins `userSafetyProvenance.items[]` to `userSafetyContext.items[]`
by `sourceMemoryId` — the same single-attribution discipline (never positional) already governing
every interpreter output in this repository — entirely at Foundation C's own future match time, not
here.

No existing PipelineContext field, shape, or consumer is modified — this is a pure addition. No
Stage (Opportunity Detection through Expression) reads this field as of this Work Item's closure —
Foundation C, not yet built, is the first future reader.

## §15. Availability Semantics

Identical `AVAILABLE`/`UNAVAILABLE` convention already established for the three sibling steps:
`AVAILABLE` means the classification step was attempted (`classify()` was invoked because eligible
records existed) and returned — with zero or more accepted results; `UNAVAILABLE` means either no
attempt was needed (no eligible records existed to begin with) or the attempt itself could not be
made/completed at all because of an upstream failure (§13 — the `StateAccess` read throwing before
`classify()` could even be called).

**Disambiguation, stated explicitly to foreclose any other reading:** a model/timeout/malformed-
response failure inside `classify()` (§12) is **not** "the attempt failed" in this section's sense
— per §12, such a failure is absorbed and the step still completes, still returns, and is therefore
still `AVAILABLE`, with `items: []`. "The attempt failed" here refers exclusively to the step never
completing at all (the upstream read throwing). `items: []` with `AVAILABLE` is therefore the
correct, expected outcome for *both* "the model legitimately found no named source" *and* "the
model call itself failed" — this step's own contract does not, and structurally cannot, distinguish
those two cases from each other, by design (§12). `null` with `UNAVAILABLE` is reserved for "no
attempt was needed" or "the attempt could not be completed," never for "the attempt completed with
a degraded/failed model call."

## §16. StateAccess/Capability Implications

No new `StateAccess` operation is required. This Work Item reuses the existing
`StateAccess.userStatedMemory` read op unchanged, via a new capability-holder identity for Memory
Layer's own provenance-read step (the fourth use of the same `memoryLayer/USER_STATED_MEMORY_READ`
capability, engine+action scoped — confirmed, not assumed, by direct inspection of
`stateAccess.js:477-482` during USC-001's own Engineering Readiness Review, and unchanged since).
No new consent gate, no new StateAccess capability class.

## §17. USC-001 Independence — Proof

- `safetyContextInterpreter.js` is not referenced, imported, required, or modified anywhere in this
  SPEC's own proposed implementation.
- `USC_001_SPEC_v1.0.md` is not edited.
- USC-001's own Memory Layer step (`userSafetyContext`) is untouched — this Work Item adds a
  **new, independent, fourth** step, never modifying the existing three.
- USP-001 performs its **own** independent read of the **same eligible raw Typed Memory record
  set** USC-001 also reads — it does not read USC-001's own already-narrowed output
  (`restrictedActivityText`/`statedDurationText`), and does not depend on USC-001 having run first
  or at all within the same Decision Pass.
- The only "inheritance" from USC-001 is architectural **pattern** reuse (batching, literal-
  substring validation, fail-closed discipline) — explicitly never authority inheritance, per this
  pass's own binding instruction ("Pattern reuse is acceptable. Authority inheritance is not.").

## §18. Recompute-From-Source Lifecycle

No persisted verdict anywhere. `userSafetyProvenance` is fully recomputed, from the complete
current set of eligible active `userStated` records, on every `assembleContext()` call — never
cached across Decision Passes, never written back to Typed Memory, never promoted to
`user_stated`/Fact-tier. If the user later edits, reverses, or deletes the source statement, the
next Decision Pass's fresh extraction reflects it automatically — the record's own `status` field
remains the sole source of currentness, identical to USC-001's own §16 discipline.

## §19. Foundation C Boundary

**Not built, not classified, not implemented by this Work Item:**
- No medical-source classification — the already-approved future vocabulary (English: `doctor`,
  `physician`; Hebrew: `רופא`, `רופאה`) is reproduced here strictly for boundary-explanation
  purposes; USP-001 may output a literal phrase *containing* one of these words (e.g. `"my
  doctor"`) but never maps it, or any other phrase, to `MEDICAL` or any other category.
- No RUNNING activity classification — the already-approved future vocabulary (English: `run`,
  `running`, `jog`, `jogging`; Hebrew: `לרוץ`, `ריצה`, `ריצות`, `רץ`; `רצה` explicitly excluded for
  unvocalized-Hebrew homograph ambiguity) is unrelated to this Work Item's own output entirely —
  reproduced here only because Foundation C's SPEC will later need both this Work Item's provenance
  output and MAI-001's activity identity together.
- No Safety Rule, no `matchCanonicalSafetyRules()` change, no `safetyLayer.js`/
  `safetyIntegrationPort.js` change, no Stage 8/9 behavior change.
- No temporal currentness determination of any kind — PD-FC-02/PD-FC-03 (memory-record
  currentness ≠ restriction temporal currentness; no date arithmetic) remain entirely downstream,
  outside this Work Item's own scope, exactly as outside USC-001's.

This Work Item's own closure hands Foundation C exactly one new, real, tested input:
`pipelineContext.userSafetyProvenance` (§14) — nothing more, nothing less. PD-FC-01/PD-FC-02/
PD-FC-03/PD-FC-06 are recorded here as downstream canonical context only (§2) — none is acted upon.

## §20. Downstream Canonical Context (Recorded, Not Implemented)

For traceability only — none of the following is implemented, classified, or acted upon by this
Work Item:

- **PD-FC-01:** a confirmed-active, explicit, medical-sourced RUNNING conflict's canonical
  `RiskType` is `ACTIVE_MEDICAL_INSTRUCTION_CONFLICT` (`PERMANENT_SAFETY_COMMITMENT_CONFLICT`
  rejected for this vertical).
- **PD-FC-02:** memory-record currentness ≠ restriction temporal currentness — a Typed Memory
  record remaining active does not, by itself, make a finite (durationed) restriction active
  indefinitely.
- **PD-FC-03:** no temporal qualifier → may be treated as active until authoritative
  reversal/removal; an explicit temporal qualifier that cannot be deterministically resolved →
  `TEMPORALLY_UNRESOLVED`; no date arithmetic anywhere in Foundation C V1.
- **PD-FC-06:** Foundation C must preserve the semantic distinction between a confirmed-active
  restriction and a temporally-unresolved one, even though current Stage 8 containment (a
  RiskType-only filter, ignoring `EvidenceConfidence`/`Correctability`/`Urgency`) may produce
  identical immediate Candidate-removal behavior for both — the distinction is not to be erased
  merely because it is currently behaviorally inert at Stage 8.
- **Approved future RUNNING vocabulary:** `run`, `running`, `jog`, `jogging` (English); `לרוץ`,
  `ריצה`, `ריצות`, `רץ` (Hebrew; `רצה` excluded).
- **Approved future medical-source vocabulary:** `doctor`, `physician` (English); `רופא`, `רופאה`
  (Hebrew).

## §21. Efficiency/Cost Limitation (Disclosed, Not Hidden, Not Optimized Away)

**USP-001 introduces a fourth independent Typed Memory read and a fourth independent LLM
classification call within a single Decision Pass** — alongside `SituationalContextInterpreter`,
`ExplicitRequestInterpreter`, and `SafetyContextInterpreter`, each already issuing their own
separate read/call over a set of records that may substantially overlap. This is an **accepted V1
architectural cost**, extending the exact same efficiency limitation EUR-001 itself first
explicitly disclosed and accepted ("a Decision Pass may read Typed Memory twice... neither
StateAccess nor Memory Layer is redesigned to eliminate this") — semantic authority separation
(each interpreter owning exactly one narrow classification act) takes precedence over model-call
optimization, per that same already-established Product/Architecture priority. **This Work Item
does not redesign StateAccess, does not combine interpreters, and does not attempt to share a
batched call across interpreters merely to reduce this cost.**

## §22. Testing Requirements

- **Interpreter unit tests** (new, e.g. `tests/userSafetyProvenanceInterpreter.test.js`): correct
  `NAMED_SOURCE_STATED` extraction for unambiguous role/relationship-descriptor statements ("my
  doctor," "my coach," "my friend," "my trainer," Hebrew equivalents); correct
  `NO_NAMED_SOURCE_OR_NOT_CLASSIFIED` fail-closed classification for passive attribution ("I was
  told"), self-decision ("I decided"), anonymous placeholders ("someone," "they," "a person"), and
  ambiguous/no-source statements; **PD-USP-02 proper-name fail-closed cases**: a bare proper name
  ("Yossi told me not to run"), a surname alone ("Cohen told me not to run"), and a titled proper
  name ("Dr. Cohen told me not to run") each classify `NO_NAMED_SOURCE_OR_NOT_CLASSIFIED`, with an
  explicit assertion that no title-to-role conversion (`Dr.`→"doctor") occurs anywhere; literal-
  substring enforcement (a model-invented source phrase not present in the source text is
  discarded, record fails closed); length-bound enforcement; injection containment; duplicate/
  unknown/malformed id handling; timeout and `callClaude`-failure degradation; batch-boundary
  invariance.
- **Memory Layer integration tests** (extend `tests/memoryLayer.test.js`, a new additive "USP1-*"
  block, the three existing CSSC1/EUR1/USC1 blocks left untouched): `userSafetyProvenance`
  populated correctly from synthetic eligible records; `null`/`UNAVAILABLE` proven specifically for
  (a) no eligible records and (b) an upstream `StateAccess` read failure — **never** for a
  model/interpreter-level failure (§12/§15), which must instead be proven to resolve to
  `{items: []}`/`AVAILABLE`, exactly like a legitimate zero-match classification; **explicit
  non-interference proof** — a synthetic failure in this step leaves
  `situationalContext`/`explicitRequestControls`/`userSafetyContext` entirely unaffected, and vice
  versa; frozen-object immutability; `pipelineContext.availability.userSafetyProvenance` (nested,
  never a flat field) confirmed directly against the real, unmodified `memoryLayer.js` return shape.
- **No production-backed acceptance test is required or possible** — USP-001 has no consumer until
  Foundation C exists. Contract-level synthetic-fixture testing is this Work Item's own closure
  criterion (§25).
- Full repository regression (`node --test tests/*.test.js`) must be run and reported with exact
  pass/fail counts before any closure claim.

## §23. Backward Compatibility

Additive only. No existing `PipelineContext` field, shape, consumer, or test fixture is modified.
No existing `StateAccess` op, capability, or consent gate changes shape. No existing interpreter
(`situationalContextInterpreter.js`, `explicitRequestInterpreter.js`, `safetyContextInterpreter.js`)
is touched. No existing Candidate, Stage 7/8/9, Expression, or `safetyLayer.js` contract changes. A
consumer that does not yet read `userSafetyProvenance` is entirely unaffected.

## §24. Engineering Acceptance Criteria

- All §22 tests exist and pass, including the PD-USP-02 proper-name fail-closed cases; full
  repository regression passes with exact counts reported.
- No outstanding Product decision blocks this Work Item — PD-USP-02 is closed.
- The implementation contains no title-recognition logic (`Dr.`/`Dr`/`ד"ר` or otherwise) and no
  proper-name-to-role conversion of any kind, confirmed by code review at commit time, not merely
  by test coverage.
- The `AVAILABLE`/`UNAVAILABLE` distinction (§12/§15) is confirmed to match its clarified canonical
  definition exactly: model/timeout/malformed-response failures resolve to `{items: []}`/
  `AVAILABLE`; only "no eligible records" or an upstream `StateAccess` read failure resolves to
  `null`/`UNAVAILABLE` — verified against both the implementation and its own test coverage, not
  assumed from the sibling interpreters' precedent alone.
- Exact interpreter module path/name (§6) is confirmed at Readiness Review.
- **Version/wiring implications, unlike MAI-001 and like USC-001:** this Work Item's interpreter
  *does* get wired into `memoryLayer.js`'s real, executing `assembleContext()` — the standard
  `index.html` script tag, `sw.js` SHELL entry, `APP_VERSION`/`VERSION` lockstep bump, and the 17
  wiring test files' version-literal update are all expected, per the same established convention
  USC-001 itself followed (not MAI-001's zero-wiring exception, which applied only because MAI-001
  had no live production consumer).
- Scope purity: no file outside the additive set in §3/§13/§14/§22 is modified; no USC-001 file, no
  MAI-001 file, no `safetyLayer.js`, no `safetyIntegrationPort.js`, no Foundation C file, no
  Roadmap/Changelog/Architecture document is touched by this Work Item's own implementation commit.
- Exact-path staging only at commit time.

## §25. Closure Criteria

USP-001 closes when: the interpreter exists, passes its own unit tests (extraction + fail-closed +
injection-containment, mirroring USC-001/EUR-001/CSSC-001's own test suites), and populates a real
`pipelineContext.userSafetyProvenance` field from synthetic Typed Memory fixtures — with zero
dependency on Foundation C existing, and with explicit proof of non-interference with USC-001's own
existing `userSafetyContext` step. No production-backed, end-to-end behavior proof is required or
possible for this Work Item alone. Closure does not authorize, begin, or imply readiness for
Foundation C — that remains its own, separately-authorized Work Item, unblockable until **both**
USC-001 (closed) and USP-001 (this Work Item) are closed, alongside MAI-001 (also closed).

---

## Document History

- **v1.0** (initial) — initial authoring, per Head of Product + AI Architect authorization
  following the Foundation C Provenance & Temporal-Currentness Review and PD-USP-01's approval. One
  Architecture proposal (interpreter module path/name, §6) offered as a SPEC-level proposal pending
  Engineering Readiness Review confirmation. No other Product or Architecture decision is
  introduced beyond what was already approved this pass.
- **v1.0 (updated — PD-USP-02)** — the Engineering Readiness Review flagged one open
  Product decision (whether `statedSourceText` may capture a bare proper name); Head of Product +
  AI Architect approved **PD-USP-02**: it may not. §7, §8, §9, §22, and §24 corrected to state the
  V1 provenance boundary is role/relationship descriptors only, that a proper name (titled or not)
  is never normalized, interpreted, or converted into an implied role, and that no
  `Dr.`/`Dr`/`ד"ר`-style title-recognition logic exists anywhere in this Work Item. No other
  Product or Architecture decision from any prior round is reopened.
- **v1.0 (updated — PD-USP-02 + availability-semantics clarification)** (this version) — the Final
  Review, having already approved the implementation's actual behavior, identified that §13's
  standalone "on any failure" wording could be misread in isolation. §12, §13, §15, §22, and §24
  corrected to state explicitly, wherever availability is discussed, that a model/timeout/malformed-
  response failure (already absorbed inside `classify()`, per §12, unchanged) resolves to
  `{items: []}`/`AVAILABLE`, while `null`/`UNAVAILABLE` is reserved for "no eligible records" or an
  upstream `StateAccess` read failure. Documentation clarity only — no Product decision, no
  Architecture decision, and no implementation or test behavior changes as a result. Status updated
  to reflect implementation completion, pending closure.
