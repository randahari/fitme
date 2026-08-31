# MAI-001 — Minimum Action Identity V1
### Safety Foundation — Work Item B
### SPEC v1.0 (updated — AD-MAI-01 Stage 9 boundary recorded) — IMPLEMENTED, PENDING FINAL REVIEW

Continues directly from `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` (SFCD,
CANONICAL, commit `ca1f0e0be05ad2e2ab0cfb315024d906c0519147`) — the sole canonical authority for
this SPEC's architecture. This is Work Item B of the three-Work-Item Safety Foundation
decomposition (SFCD §04, SF-DECOMP-01): **Minimum Action Identity V1**, independent of Work Item A
(User Safety Context V1, CLOSED — commit `84886767cd4ef6eb6567ca2206b5a0f7fd0bfa43`) and a
prerequisite, alongside A, for Work Item C (Canonical Safety Rule V1 + Real Matcher). This SPEC
does not build A (already closed) or C, does not touch `matchCanonicalSafetyRules()`, and does not
change any Safety behavior observable today.

**Correction record (Head of Product + AI Architect, AD-MAI-01, Implementation/Final Review
pass):** §13's Stage 9 boundary is corrected to distinguish `SINGLE_WINNER` (no propagation,
confirmed by direct test) from `TIED_SET` (`options[]` incidentally carries `actionIdentity`,
pre-existing TASK-006 behavior, confirmed by direct test) — a nuance not captured by the original
draft's blanket "does not propagate" framing, discovered during Implementation Review. §2's
`decisionFormation.js` citation, §14, and §18 are corrected to match. **No Product behavior,
vocabulary contract, Candidate contract, Stage 7/8 behavior, or Foundation B scope changes** —
`decisionFormation.js` itself remains, and MUST remain, untouched (AD-MAI-01 item 6). No other
Product or Architecture decision from any prior round is reopened.

## §1. Purpose and Scope

Build the second of two independent prerequisite foundations for the Safety Foundation initiative:
the smallest durable, structured Action identity a Candidate can optionally carry, sufficient for a
future Safety vertical (Foundation C) to know *what activity* a Candidate concerns — without
prematurely building the full Action Model and without creating a throwaway schema Action
Generation would later have to replace.

> **CANDIDATE → `actionIdentity` (optional, structured) → `activity` (closed V1 token).**

**IN SCOPE:** the `actionIdentity` contract on Candidate (§4); its optionality/backward
compatibility (§5); the closed V1 activity vocabulary and its own, independent, locally-owned
module (§6-§7); a pure validation predicate (§8-§9); Stage 7 passthrough and Stage 8 accessibility,
proven against the current, unmodified repository (§11-§12); synthetic-Candidate testability with
no live producer (§14); canonical closure at contract level (§20).

**OUT OF SCOPE (binding, per this pass's own instruction and SFCD §06, §08):** any change to User
Safety Context (Foundation A, already closed — untouched by this Work Item); Safety Rules,
`matchCanonicalSafetyRules()`, or any Safety disposition logic (Foundation C); medical/clinical
logic of any kind; duration, intensity, load, body area, quantity, food identity, recovery demand,
or any other full Action Model dimension (AD-SF-02); Bounded Action Generation; Preference
behavior; Expression behavior; any Domain→Topic vocabulary change (AD-SF-04); inventing a new live
Candidate producer solely to exercise this identity (§15); Stage-9 → Terminal Decision → Expression
propagation, unless repository evidence proves it required for Foundation B itself — repository
evidence gathered this pass proves the opposite (§13).

## §2. Canonical Authorities

- **SFCD Chapter 06 (Foundation B's canonical scope)** — reproduced and operationalized throughout
  this document; nothing here contradicts it.
- **AD-SF-01 (verbatim, SFCD §06):** *"The minimum Action Safety Identity will be Candidate-attached.
  Safety is a consumer of Action semantics. Safety does NOT own Action identity. Do NOT design a
  Safety-only parallel side-channel as the canonical solution."*
- **AD-SF-02 (verbatim, SFCD §06):** *"Candidate → actionIdentity → activity identity. Conceptually:
  `actionIdentity: { activity: RUNNING }`. This is architectural direction, NOT authorization for
  this exact field name/schema yet [now confirmed by this SPEC, §4]... Do NOT add richer semantics
  now."* Out of scope: duration, intensity, quantity, food identity, body-area/load, recovery
  demand, other full Action Model semantics.
- **AD-SF-03 (verbatim, SFCD §06):** *"The activity identity vocabulary must be independent of:
  safetyLayer.js, Safety Context Interpreter, individual Safety rules. It represents what the
  action IS, not whether it is safe."*
- **AD-SF-04 (verbatim, SFCD §06):** *"Domain/Topic identifies the decision/coaching subject.
  Activity identity identifies the concrete action modality/activity. These are separate semantic
  layers. Do not modify `domainTopicVocabulary.js` to add RUNNING/WALKING/etc."*
- **AD-SF-05 (verbatim, SFCD §07):** *"The fact that Candidate.action currently disappears before
  Terminal Decision is an architectural gap, not a pattern to preserve... Whether/how Action
  Identity must later survive Stage 9 → Terminal Decision → Expression will be handled
  deliberately, not bypassed with a temporary Safety-only representation."* Foundation B does not
  attempt that propagation and does not hide the gap behind a side-channel (§13).
- **Initial activity vocabulary (SFCD §06, Product decision, frozen):** RUNNING, WALKING, CYCLING,
  SWIMMING, STRENGTH_TRAINING, PADEL — closed as stated, does not authorize Safety rules for all
  six, not to be expanded without further evidence/authorization.
- **`js/coachDecisionSystem/prioritization.js` (TASK-006, Stage 7)** — `validateCandidateForPool(c)`
  (`prioritization.js:39-52`), directly inspected this pass: validates exactly `kind`,
  `hierarchyTier`, `confidence`, `rationale`, `opportunityProvenance`, the five arbitration-metadata
  fields, and `recommendationImpactTier` — a fixed, closed checklist that does not reference
  `action` or `actionIdentity` at all. `assemblePool()` (`prioritization.js:65-72`) pushes the
  original candidate object `c` into the pool **by reference**, never a reconstructed subset.
- **`js/coachDecisionSystem/winnerSelection.js` (Stage 8)** — `select()` (`winnerSelection.js:39-71`),
  directly inspected this pass: passes `rankedPool` (the same objects from Stage 7) directly into
  `safetyPort.disqualify(rankedPool, pipelineContext)`, and pushes surviving pool entries — again by
  reference — into `survivors`.
- **`js/coachDecisionSystem/decisionFormation.js` (Stage 9)** — directly inspected this pass:
  `preReviewDecision` (`decisionFormation.js:133-140`) is a **freshly reconstructed** object
  containing exactly `{kind, rationale, confidence, hierarchyTier, candidateProvenance, options}` —
  no `.action`, no `.actionIdentity` **on this summary shape itself**. `options`, however, is
  populated only for a `TIED_SET` selection, and — confirmed by direct execution against the real
  module during Implementation Review (AD-MAI-01, §13) — carries the **full, verbatim tied
  Candidate objects**, which do include `actionIdentity` when a tied member carries one. This is
  pre-existing TASK-006 `options[]` machinery, unmodified by this Work Item; §13 records the exact,
  now-confirmed boundary.
- **`js/domain/domainTopicVocabulary.js`** — directly inspected this pass (`:1-18`): *"a pure,
  dependency-free data module, no logic... A future non-B5 Opportunity source that needs
  Domain/Topic identity MUST derive its own value from this shared vocabulary using its own,
  locally-owned mapping logic — it MUST NOT call into B5's derivation functions."* Structural
  precedent for §7's own new, independent module — never an extension of this file (AD-SF-04).
- **`explicitRequestInterpreter.js`'s `EUR_VALID_DOMAIN_TOPIC_PAIRS`/`isValidPair()`
  (EUR-001, closed)** — direct precedent for a small, locally-owned, closed-list-plus-predicate
  module pattern, reused here by pattern for §7-§9, never by import.
- **`tests/winnerSelection.test.js`, `tests/decisionFormation.test.js`,
  `tests/prioritization.test.js`** — each already constructs fully synthetic Candidate fixtures via
  a local helper (placeholder `action: 'do the thing'`), with no live producer — established,
  repeated repository precedent directly reused for §14.
- **`docs/specs/USC_001_SPEC_v1.0.md` (Work Item A, CLOSED)** — cited only as the sibling Work
  Item's own precedent for document structure and rigor; Foundation A's own contract
  (`pipelineContext.userSafetyContext`) is untouched by this SPEC and irrelevant to Foundation B's
  own contract, per SFCD §04's confirmed independence of A and B.

## §3. Action Identity Ownership

**Candidate/action-representation ownership (AD-SF-01):** `actionIdentity` is a field on the
Candidate contract, owned by whichever engine constructs the Candidate (today:
`recommendationEngine.js`, `initiativeEngine.js`; in the future, any Bounded Action Generation
producer). Safety is a **consumer** of this field, never its owner — Foundation C's future matcher
reads it; it does not define, validate, or gate it.

**Vocabulary ownership (AD-SF-03, AD-SF-04):** the closed activity-token list is owned by a new,
standalone module (§7), independent of `safetyLayer.js`/the Safety Context Interpreter/any
individual Safety rule, and independent of `domainTopicVocabulary.js`. No Candidate producer, no
Safety file, and no Domain/Topic file is the vocabulary's canonical home — the new module is.

**Contract-shape ownership (this SPEC):** the `actionIdentity` object's own shape — that it is a
nested object with exactly one V1 key, `activity` — is fixed by AD-SF-02 and this SPEC's §4; no
producer may add ad hoc fields to it in V1 (§17).

## §4. Exact Candidate Contract

`Candidate.actionIdentity` — a new, **optional**, top-level field, added identically to both
Recommendation-kind and Initiative-kind Candidates (CC-03's existing base contract; no kind-based
restriction is introduced, since Action Identity describes what the action IS, orthogonal to
Recommendation-vs-Initiative classification):

```
actionIdentity?: {
  activity: <one of the six closed V1 tokens, §6>
}
```

- Present only when the producing engine has a real activity to report; **absent** (not `null`,
  not an empty object) otherwise — mirroring USC-001's own "absent, never a placeholder" discipline
  for its own optional literal fields.
- Exactly one key in V1: `activity`. No `duration`, `intensity`, `quantity`, `bodyArea`,
  `recoveryDemand`, or any other key (§17) — enforced by convention and by the validation predicate
  (§8) rejecting any object with extra keys.
- `activity`'s value MUST be one of the six closed tokens (§6) — a producer populating a value
  outside this set has produced an **invalid** `actionIdentity` (§9), not a new, sixth token.
- No confidence, no provenance, no timestamp on `actionIdentity` itself — Candidate's own existing
  `confidence`/`opportunityProvenance` fields already carry that information for the Candidate as a
  whole; `actionIdentity` is a pure structural fact, mirroring `restrictedActivityText`'s own
  "structural fact, not an evaluative one" design in USC-001 §7.
- **TASK-005's own closed Candidate contract description** (`TASK_005_SPEC_v1.0.md`) is not amended
  by this SPEC — if an additive cross-reference synchronization is ever performed, it happens at
  this Work Item's closure, mirroring the Decomposition Report's own "Architecture/Roadmap updates:
  per Work Item at each individual closure" precedent (SFCD, Investigation 3 background) — this is
  a documentation-synchronization timing choice, not a contract question, and does not block SPEC
  authoring or implementation.

## §5. Optionality/Backward Compatibility

`actionIdentity` is **optional** on every Candidate, at every kind, unconditionally. The single
existing, live Candidate producer (the G-2 `NUTRITION`/`FOOD_LOGGING` Habit-derived path,
`contextualMeaningPolicy.js:34`, EUR-001's own production-backed fixture) is **entirely
unaffected** — it never populates `actionIdentity`, and nothing in this Work Item requires it to.
`validateCandidateForPool()` (`prioritization.js:39-52`) does not reference `actionIdentity` at
all (§2) and requires no modification for this field to be optional — its existing "absence of an
unlisted field is not an error" behavior already provides full backward compatibility, proven by
direct inspection rather than assumed.

## §6. Closed Activity Vocabulary

Exactly six values, frozen by SFCD (Product decision), reproduced verbatim and unexpandable
without further authorization:

```
RUNNING
WALKING
CYCLING
SWIMMING
STRENGTH_TRAINING
PADEL
```

This list does **not** authorize a Safety rule for any of the six — it establishes a genuine,
reusable Activity Identity vocabulary, not a one-value RUNNING-specific flag (SFCD §06). No value
may be added, removed, or renamed by this Work Item or by any producer; expansion requires a future
Product/Architecture decision, exactly as `recommendationCategories.js`'s own
`OPPORTUNITY_SOURCES` enum's "do not add, remove, or rename" discipline already establishes
precedent for closed repository vocabularies.

## §7. Vocabulary Ownership/Module Boundary

New, standalone module — proposed `js/domain/activityIdentityVocabulary.js` (pending Engineering
Readiness Review confirmation of exact path/name, per SFCD §10 item 1, which explicitly leaves this
unauthorized), structurally modeled on `domainTopicVocabulary.js`'s own "pure, dependency-free data
module, no logic" pattern (§2) but **never an extension of that file** — a fully separate module,
per AD-SF-04's explicit instruction not to modify `domainTopicVocabulary.js`. Exposes:

- `ACTIVITY_TOKENS` — the closed, frozen six-value array (§6).
- `isValidActivity(token)` — a pure predicate, `true` iff `token` is a string present in
  `ACTIVITY_TOKENS`.
- `isValidActionIdentity(obj)` — a pure predicate (§8), `true` iff `obj` is a plain object with
  exactly one own key, `activity`, whose value passes `isValidActivity()`.

No logic beyond these three pure exports. No dependency on `domainTopicVocabulary.js`,
`safetyLayer.js`, or the Safety Context Interpreter (AD-SF-03/04). This module is the vocabulary's
sole canonical home — no Candidate producer, no Safety file, and no Foundation A file may define a
second, competing activity list.

## §8. Validation Behavior

`isValidActionIdentity(obj)` (§7) is a **pure, standalone predicate** — it validates shape and
vocabulary membership only, structurally identical in spirit to `isValidPair()`
(`explicitRequestInterpreter.js:80-82`, EUR-001's own closed-list validator). It is **not** wired
into `prioritization.js`'s `validateCandidateForPool()` in V1: that function's fixed checklist
(§2) governs a set of *required* fields; `actionIdentity` is optional and, per §5, its absence is
never an error, so extending Stage 7's own closed validation checklist is neither required nor
authorized by this Work Item — doing so would be an uninstructed change to TASK-006's own already-
closed canonical contract. `isValidActionIdentity()` exists for producers and future consumers
(most plausibly Foundation C) to call directly when they need to check a value they already hold —
it is a reusable utility, not a pipeline gate.

## §9. Unknown/Invalid Activity Handling

Because Stage 7 performs no `actionIdentity`-specific validation (§8), an invalid `actionIdentity`
(wrong shape, extra keys, or an `activity` value outside the closed six) is **not rejected at
ingestion** in V1 — there is no live producer to reject it from in the first place (§15), and no
gate exists yet to reject it at. The enforcement point for V1 is at the **consumer**: any code that
reads `Candidate.actionIdentity` and intends to act on it MUST call `isValidActionIdentity()`
first and treat a `false` result identically to the field being absent — never guessing, coercing,
or nearest-matching an out-of-vocabulary value to one of the six real tokens. This mirrors
USC-001's own "fail closed at the point of use" discipline, applied here to a structural rather
than a semantic-classification concern.

## §10. Candidate Creation/Normalization Expectations

A future producer populating `actionIdentity` MUST: (a) use one of the six closed tokens verbatim,
uppercase, exactly as spelled in §6 — no case variation, no synonym, no free text; (b) populate
`activity` only, no other key; (c) omit `actionIdentity` entirely (never populate it as `null` or
`{}`) when no real activity applies. No normalization function (trim/lowercase/synonym-mapping) is
defined by this Work Item, because unlike USC-001's own LLM-derived literal text, `actionIdentity`
is expected to be populated by deterministic engineering code reading a closed, small vocabulary —
normalization belongs to that future producer's own responsibility, not to a shared utility this
Work Item would otherwise have to invent and justify.

## §11. Stage 7 Behavior

**No change required or made.** Direct inspection (§2) confirms `validateCandidateForPool()`
neither requires nor rejects `actionIdentity`, and `assemblePool()` pushes each candidate by
reference into the shared pool. `actionIdentity`, when present, therefore rides through Stage 7
unmodified and unvalidated by Stage 7 itself — exactly the same treatment every other field outside
Stage 7's fixed checklist already receives.

## §12. Stage 8 Accessibility

**Already accessible, no change required.** Direct inspection (§2) confirms Stage 8's `select()`
passes the same by-reference pool objects into `safetyPort.disqualify(rankedPool, pipelineContext)`
— meaning a future `matchCanonicalSafetyRules()` (Foundation C) could read
`candidate.actionIdentity` directly, today, with zero Stage 8 contract change, the moment real
logic replaces the current `return [];` stub. This Work Item does not touch `safetyLayer.js` or
`winnerSelection.js` and makes no claim that Foundation C's future logic is implemented — only that
the data path already exists.

## §13. Stage 9 Propagation Boundary

**AD-MAI-01 (Head of Product + AI Architect, Implementation/Final Review pass) — canonical, as
confirmed by direct execution of the real, unmodified `decisionFormation.js` against synthetic
Candidate fixtures carrying `actionIdentity`:**

1. **`SINGLE_WINNER`:** `actionIdentity` is **not propagated** into the reconstructed Terminal
   Decision. `preReviewDecision`'s own summary shape — confirmed by direct test to be exactly
   `{kind, rationale, confidence, hierarchyTier, candidateProvenance, decisionPassTrace,
   safetyDisposition, immutable}` for this path — carries no `.action` and no `.actionIdentity`.
2. **`TIED_SET`:** pre-existing, pre-MAI-001 behavior **may incidentally expose**
   `actionIdentity` inside `decision.options[]`, because TASK-006's own already-built,
   production-unreachable tied-set-presentation mechanism carries the full, verbatim tied
   Candidate objects through unmodified — confirmed by direct test: a tied Candidate's own
   `actionIdentity` is present, unaltered, inside the corresponding `options[]` entry.
3. **That `TIED_SET` presence is incidental, pre-existing behavior** — a byproduct of TASK-006's
   own `options[]` design, not something this Work Item builds, relies upon, or hides.
4. **MAI-001 does NOT establish Stage 9 propagation as a guaranteed contract.** Neither path is a
   promise: the `SINGLE_WINNER` path's own absence of the field is equally not framed here as a
   permanent guarantee of the reverse (that no future change could reintroduce it) — this Work
   Item simply observes and records both paths' current, real behavior without asserting authority
   over either.
5. **Foundation C, or any future consumer, MUST NOT rely on `actionIdentity` being available after
   Stage 8** unless a later canonical decision explicitly establishes that contract — the `TIED_SET`
   incidental exposure is not load-bearing and must not be treated as a designed integration point.
6. **`decisionFormation.js` is not modified by this Work Item, and MUST NOT be**, per this
   decision — no redesign, no stripping of `options[]`, no forced uniformity between the two paths.

**Canonical rationale:** this is explicitly **not this Work Item's to attempt** — repository
evidence gathered during Engineering Readiness and confirmed during implementation shows Foundation
B's own closure criterion (§20) requires only Stage 7 passthrough and Stage 8 accessibility,
neither of which needs `preReviewDecision`/`options[]` to behave any particular way. Per AD-SF-05,
this known asymmetry (and the newly-observed `TIED_SET` nuance) is not this Work Item's gap to hide
behind a Safety-only side-channel or to "fix" by touching Decision Formation — whether/how
`actionIdentity` should later survive deliberately and uniformly into Terminal Decision/Expression
remains explicitly deferred to a future, separately-authorized change (AD-SF-05's own "handled
deliberately" language) — not decided, not implemented, not even proposed here.

## §14. Synthetic Candidate Testing Strategy

Directly reuses the already-established repository convention (`tests/winnerSelection.test.js`,
`tests/decisionFormation.test.js`, `tests/prioritization.test.js`, each constructing a fully
synthetic Candidate via a local helper, with no live producer — §2): a hand-built Candidate fixture
carrying `actionIdentity: { activity: 'RUNNING' }` proves (a) `validateCandidateForPool()` accepts
it unchanged, (b) `assemblePool()`/ranking preserves it by reference, (c) `winnerSelection.select()`
passes it through to `disqualify()`'s received pool unchanged, and (d) — per AD-MAI-01, §13 —
`decisionFormation.form()` reconstructs a `SINGLE_WINNER` Terminal Decision that never carries
`actionIdentity`, while a `TIED_SET` Terminal Decision's `options[]` incidentally does, both
proven directly against the real, unmodified module. No live producer, no real Habit/Pattern
signal, and no LLM call is required for any of this — matching the precedent's own contract-level
testing philosophy exactly.

## §15. Live-Producer Boundary

**No existing Candidate producer is modified by this Work Item.** Per this pass's own explicit
instruction not to invent a new live producer solely to exercise the identity, and consistent with
Foundation A's own precedent of closing with zero live consumers, Foundation B closes with **zero
live producers** populating `actionIdentity` in production. `recommendationEngine.js` and
`initiativeEngine.js` are untouched. The contract is real, tested, and structurally available; no
Candidate emitted by the running application carries `actionIdentity` as of this Work Item's
closure.

## §16. Foundation C Dependency Boundary

Foundation C (Canonical Safety Rule V1 + Real Matcher) depends on Foundation B's contract (§4) and
vocabulary module (§7) being closed and real — Foundation C is the first code to call
`isValidActionIdentity()`/read `candidate.actionIdentity` for an actual Safety decision. Foundation
B does not depend on Foundation C in any way (SFCD §04's confirmed independence carries forward:
A and B are independent of each other; only C depends on both).

## §17. Full Action Model Boundary

Explicitly, bindingly out of scope for V1 (AD-SF-02, restated): `duration`, `intensity`,
`quantity`, `bodyArea`/`load`, `recoveryDemand`, food identity, or any other richer Action
semantics. `actionIdentity`'s V1 shape has exactly one key. Extending it is a future,
separately-authorized Work Item's decision, not an engineering default this Work Item may
anticipate by adding optional-but-unused fields now.

## §18. Testing Requirements

- **Vocabulary module unit tests** (new, e.g. `tests/activityIdentityVocabulary.test.js`):
  `ACTIVITY_TOKENS` contains exactly the six closed values in the order given (§6);
  `isValidActivity()` accepts each of the six and rejects an arbitrary string, an empty string,
  `null`, and a lowercase variant (no case-folding — verbatim-only, §10); `isValidActionIdentity()`
  accepts `{activity: 'RUNNING'}`, rejects `{activity: 'RUNNING', duration: 5}` (extra key),
  rejects `{activity: 'FANTASY'}`, rejects `null`/`undefined`/an array/a non-object, rejects an
  object with zero keys.
- **Candidate-contract integration tests** (extend `tests/prioritization.test.js`,
  `tests/winnerSelection.test.js` — or a new, dedicated `tests/actionIdentityContract.test.js`
  reusing their existing synthetic-Candidate helper pattern): a synthetic Candidate carrying
  `actionIdentity` passes `validateCandidateForPool()` unchanged; survives `assemblePool()`/
  ranking with the field intact; survives `winnerSelection.select()` through to the pool
  `disqualify()` receives, with the field intact and unmutated.
- **Backward-compatibility regression:** every existing synthetic/live Candidate fixture in the
  full test suite (none of which populates `actionIdentity`) continues to pass unchanged — proving
  the field's optionality does not alter any existing behavior.
- **Stage 9 boundary tests (AD-MAI-01, §13):** a synthetic `SINGLE_WINNER` proves `actionIdentity`
  is absent from the resulting Terminal Decision's own summary shape; a synthetic `TIED_SET` proves
  `options[]`'s incidental, pre-existing carriage of `actionIdentity` — both run against the real,
  unmodified `decisionFormation.js`, with no assertion that either behavior is a guaranteed
  contract.
- Full repository regression (`node --test tests/*.test.js`) must be run and reported with exact
  pass/fail counts before any closure claim, per standing session discipline.

## §19. Engineering Acceptance Criteria

- All §18 tests exist and pass; full repository regression passes with exact counts reported.
- No outstanding Product decision blocks this Work Item — none was found during authoring (§ below).
- Exact vocabulary module path/name (§7) is confirmed at Readiness Review, per SFCD §10 item 1 (not
  authorized by this SPEC alone).
- Scope purity: no file outside the additive set in §7/§18 is modified; no Foundation A file
  (`safetyContextInterpreter.js`, USC-001's own `memoryLayer.js` step), no Foundation C file, no
  `safetyLayer.js`, no `winnerSelection.js`, no `decisionFormation.js`, no `prioritization.js`, no
  `domainTopicVocabulary.js`, no existing Candidate producer, no Roadmap/Changelog/Architecture
  document is touched by this Work Item's own implementation commit.
- Exact-path staging only at commit time, per standing session discipline.

## §20. Closure Criteria

Mirrors the already-approved Work-Item Decomposition Report's own Foundation B closure criterion
(SFCD, Investigation 3 background), restated precisely for this contract: **B closes when the
vocabulary module exists (six closed values, frozen order), `Candidate.actionIdentity` is
confirmed optional and additive by direct test against the real, unmodified
`validateCandidateForPool()`/`assemblePool()`/`winnerSelection.select()` code path, and Stage 7
passthrough plus Stage 8 accessibility are proven via synthetic Candidate fixtures — with zero
dependency on Foundation A or Foundation C existing, and zero live producer required.** Closure
does not authorize, begin, or imply readiness for Foundation C — that remains its own,
separately-authorized Work Item (SFCD §04), unblockable until **both** A (already closed) and B
(this Work Item) are closed.

---

## Document History

- **v1.0** (initial) — initial authoring, per Head of Product + AI Architect authorization
  following USC-001's closure. One Architecture proposal (vocabulary module path/name, §7) offered
  as a SPEC-level proposal pending Engineering Readiness Review confirmation, per SFCD §10 item 1's
  own explicit delegation of that specific to this SPEC and its Readiness Review. No Product
  decision was found open during authoring — see the accompanying Authoring Report. No other
  Product or Architecture decision is introduced beyond what SFCD/AD-SF-01 through AD-SF-05 already
  froze.
- **v1.0 (updated — AD-MAI-01)** (this version) — Head of Product + AI Architect approved
  AD-MAI-01, recording the exact Stage 9 boundary discovered during Implementation Review:
  `SINGLE_WINNER` does not propagate `actionIdentity` (confirmed by direct test); `TIED_SET`'s
  pre-existing `options[]` mechanism incidentally does (confirmed by direct test); neither path is
  a guaranteed MAI-001 contract; Foundation C or any future consumer must not rely on
  post-Stage-8 availability without a later, explicit canonical decision; `decisionFormation.js`
  is not modified and must not be. §2, §13, §14, and §18 corrected to record this precisely. No
  Product behavior, vocabulary contract, Candidate contract, Stage 7/8 behavior, or Foundation B
  scope changes as a result of this correction.
