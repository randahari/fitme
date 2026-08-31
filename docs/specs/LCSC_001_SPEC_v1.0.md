# LCSC-001 — Legacy Coach Safety Containment
### Narrow Interim Containment — Not a Safety Foundation
### SPEC v1.0 — AUTHORED, NOT YET IMPLEMENTED

Continues directly from the accepted "FITME — CURRENT SAFETY EXPOSURE & CONTAINMENT INVESTIGATION
REPORT" (this session). This is a narrow, interim containment Work Item — it is explicitly **not**
Safety Foundation design, not a Health/Safety Profile, not an Action Model, not a new Safety Layer,
and not a replacement for or reopening of `docs/specs/SL-001_SPEC_v1.0.md`. It closes exactly the
two concrete, live exposure paths that investigation identified, plus one adjacent deterministic
food-naming surface Product has directed be generalized for the same underlying reason (no
authoritative dietary/allergy/restriction context exists).

---

## §1. Purpose

Contain, deterministically and narrowly, the two confirmed-live current exposure paths without
touching the canonical Coach Decision System, without building any new Safety validation
capability, and without removing the legacy Coach path's ability to personalize using the user's
own authoritative memory. Three production behavior changes, no more:

- **Change A** — the Adaptive-TDEE red-flag trigger (rapid weight-loss rate + shrinking arm
  measurement) never calls the legacy generative Coach path; it uses deterministic local text only.
- **Change B** — every remaining legacy generative Coach caller inherits one bounded,
  defense-in-depth Safety-scope instruction in its shared system prompt.
- **Change C** — the two existing deterministic protein-attention surfaces stop naming a specific
  food, since no authoritative dietary/allergy/restriction context exists to justify one.

## §2. Canonical Authorities

- **Head of Product + AI Architect direction (this session, PD-LSC-01 through PD-LSC-10)** — binding
  for this Work Item; not reopened here.
- **SL-001 (CLOSED, unmodified)** — this Work Item does not touch `js/coachDecisionSystem/safetyLayer.js`,
  `safetyIntegrationPort.js`, Stage 8, Stage 9, or `matchCanonicalSafetyRules()`. PD-LSC-02/08 bind
  this explicitly.
- **D1-CDO-03 (Expression boundary principle, cited in `safetyLayer.js`'s own header)** — *"a
  generative layer SHALL express a decision already reached; it SHALL NOT originate the underlying
  decision."* This Work Item does not touch canonical Expression (PD-LSC-08) but the same discipline
  informs why Change B is prompt-level containment only, never presented as validation.
- **USM-001 (CLOSED, unmodified)** — `assembleUserStatedMemoryFragment()`/`userStatedMemoryPrompt.js`
  are not modified; PD-LSC-05 requires their continued, unmodified operation.
- **The accepted Current Safety Exposure & Containment Investigation Report** — the sole evidentiary
  basis for every file/line citation below; re-verified directly against the repository during this
  SPEC's own authoring (§Engineering Readiness Review, delivered alongside this SPEC).

## §3. Scope

**IN SCOPE:** exactly the three changes named in §1, each affecting only `js/trigger/triggerDomain.js`,
`js/trigger/triggerController.js`, and `js/coach/coachPromptComposer.js` (exact file-level scope,
§12); deterministic tests proving each change; targeted and full regression; the minimum canonical
documentation entries recording the legacy Coach path's transitional-architecture status
(specified, not authored, in this SPEC — §14).

**OUT OF SCOPE, explicitly, per PD-LSC's own list:** Health/Safety Profile; a Safety-sensitive
semantic interpreter; Canonical Safety Rule authoring; `matchCanonicalSafetyRules()`
implementation; Stage 8/Stage 9 changes; Action Model; Action Generation; Preference; any
post-generation content validator (keyword filter, regex gate, secondary LLM reviewer, or any other
form — PD-LSC-06); canonical Expression changes; legacy Coach removal; any new chat/message UI; any
new medical-advice capability; any new Safety scoring; new telemetry beyond what existing repository
convention already requires for a change of this shape.

## §4. Change A — Adaptive-TDEE Red-Flag Deterministic Containment

**Exact current mechanism (traced, re-verified):** `TriggerDomain.evalRedFlag()`
(`js/trigger/triggerDomain.js:63`) returns `{type:'redflag', priority: PRIO.health, live: true,
data:{sig, calc}}` when `slopePctWeek < -1.2 && armDown` — a real, deterministic condition computed
from actual weight/measurement history (`adaptiveTdeeDomain.js:176-192`). `presentTriggerCard()`
(`triggerController.js:72-86`) sets the card's text to `TriggerDomain.triggerLocalText(...)`
**first**, then, only `if (t.live && textEl)`, asynchronously overwrites it via `triggerLiveText(t)`
(`:80-84`). `triggerLiveText()`'s own `redflag` branch (`:144-145`) composes a fixed context string
instructing the model to communicate a specific nutrition-behavior directive ("slow the pace, add
calories") and calls `deps.coachMessageFn(ctx)` (`:151`) — a live, unreviewed, unfiltered model call.

**Required contract, two independent, defense-in-depth changes:**

1. **`js/trigger/triggerDomain.js`** — `evalRedFlag()`'s returned object gains `live: false` in
   place of `live: true` (a one-token change; every other field unchanged). This is the semantically
   correct use of the existing `live` flag — its entire meaning, per its only consumer
   (`triggerController.js:80`), is "attempt a generative upgrade of the deterministic text"; `false`
   honestly states that redflag never attempts one, using the mechanism exactly as designed, not a
   special case bolted on top of it.
2. **`js/trigger/triggerDomain.js`** — `triggerLocalText()`'s `switch (t.type)` (`:152-164`) gains a
   new `'redflag'` case, since **none currently exists** — the current `default` branch falls
   through to `t.type.indexOf('streak-') === 0` (false) and returns `''` (confirmed by direct
   reading — a real, previously-unreported gap this SPEC must close, not merely rely on). The new
   case follows this file's own existing two-way `warm`/non-`warm` tone-split convention (not
   `coachLine()`'s three-way pro/warm/default split — `triggerLocalText()` has no `pro` concept)
   and conveys the same underlying, already-Product-approved idea the current generative context
   string carries (slow the pace, add calories, supportive tone) as fixed text:
   ```
   case 'redflag':
     return warm
       ? (n + ', שמתי לב שקצב הירידה במשקל שלך מהיר וההיקף בזרוע קטן — סימן אפשרי לאובדן שריר. ' +
          'בלי לחץ, ננמיך קצת את הקצב ונוסיף מעט קלוריות כדי לשמור על השריר.')
       : ('קצב ירידת המשקל מהיר וההיקף בזרוע מצטמצם — סימן אפשרי לאובדן שריר. ' +
          'נאט את הקצב ונוסיף מעט קלוריות.');
   ```
   Engineering-authored proposal, marked explicitly for Engineering Readiness Review / Product
   confirmation — matching this repository's own established convention (e.g. EUR-001 SPEC §9's own
   "Engineering-authored proposal... not independently re-blessed as new Product vocabulary") for a
   micro-content decision of this shape. Contains no new coaching philosophy beyond what the
   existing, already-approved generative context string already directed the model to say; converts
   it to fixed text only.
3. **`js/trigger/triggerController.js`** — `triggerLiveText()`'s `redflag` branch (`:144-145`) is
   replaced with an explicit early return of the deterministic text, **never reaching
   `deps.coachMessageFn` at all**:
   ```
   if (t.type === 'redflag') {
     return TriggerDomain.triggerLocalText(deps.getUserProfile(), t);
   }
   ```
   This is required **in addition to** item 1 — `triggerLiveText()` is itself a directly exported,
   independently callable/testable function (confirmed: `tests/triggerController.test.js:216-225`
   calls it directly, bypassing `presentTriggerCard()`'s own `t.live` gate). Relying on item 1 alone
   would leave a direct call to `triggerLiveText({type:'redflag'})` still reaching
   `coachMessageFn` — this item closes that path unconditionally, regardless of caller.

**Result:** for `type: 'redflag'`, `coachMessageFn`/`CoachClient.sendMessage`/`callClaude` are never
invoked, from any entry point, deterministically, provably (§9). Every other trigger type's existing
live/non-live behavior is untouched — `streak-*` (`live: s >= 30`) and every non-live type continue
exactly as before; `triggerLiveText()`'s `streak-`/generic branches are not modified.

## §5. Change B — Legacy Coach Prompt Safety Boundary

**Owner, confirmed by direct trace:** `js/coach/coachPromptComposer.js:buildBasePrompt(userProfile)`
(`:64-87`) is the single function every legacy generative Coach caller's system prompt passes
through — `buildSystemPrompt()` (`:156-202`) always starts with `var base = buildBasePrompt(userProfile);`
and every downstream fragment (`mem`, `userStated`, `derived`) is appended additively, never
replacing it. `buildSystemPrompt()` is itself the sole system-prompt source for
`CoachClient.sendMessage()` (`coachClient.js:28`), which is the sole implementation behind every
`coachMessageFn` injection (`CoachPresenter`, `AdaptiveTdeeController`, `TriggerController` —
confirmed, all three `configure()` calls in `js/app.js` inject the identical
`function (context) { return coachMessage(context); }` closure, `js/app.js:301,326,348`). **Adding
one bounded instruction block to `buildBasePrompt()` is therefore confirmed sufficient to reach
every remaining legacy generative caller** — the Home coach card, the Settings test message, the
Adaptive-TDEE weekly summary, and every non-redflag Trigger live-text case (streak milestones,
post-workout congratulation, generic events) — with no second insertion point required anywhere.

**Exact contract — appended as new, additional lines inside `buildBasePrompt()`'s returned array
(`:78-86`), after the existing style/length/no-fabrication lines, before the function's own closing
`.filter(Boolean).join(' ')`:**

```
'זהו גבול בטיחות מחייב, נוסף על ההנחיות למעלה: לעולם אל תאבחן מצב רפואי, לעולם אל תסיק מסקנה ' +
  'רפואית מתסמינים שתואר, ולעולם אל תיתן הוראת טיפול רפואי. אם המשתמש ציין פציעה, כאב, מחלה, או ' +
  'הנחיה רפואית פעילה, לעולם אל תהפוך זאת המלצת אימון או תזונה שאינה נתמכת במפורש. אל תמציא ' +
  'ציר זמן החלמה. אם קיבלת מידע על הנחיה רפואית פעילה שנמסרה למשתמש (למשל, הנחיית רופא), כבד ' +
  'אותה כמגבלה במסגרת הליווי, בלי לפרש, לאמת, או להטיל ספק בסיבה הרפואית שמאחוריה. כשמידע בטיחותי ' +
  'אינו ודאי, היה שמרן ואל תמציא ודאות מקצועית. לעולם אל תעקוף או תסתור הגבלה רפואית שהמשתמש דיווח ' +
  'עליה במפורש.'
```

Mapping to PD-LSC-04's eight bullet requirements (exhaustive): "לעולם אל תאבחן מצב רפואי" = do not
diagnose; "לעולם אל תסיק מסקנה רפואית מתסמינים" = do not infer medical conditions from symptoms;
"לעולם אל תיתן הוראת טיפול רפואי" = do not provide medical treatment instructions; "אל תמציא ציר
זמן החלמה" = do not invent recovery timelines; "אם המשתמש ציין פציעה... לעולם אל תהפוך זאת המלצת
אימון או תזונה שאינה נתמכת במפורש" = do not turn injury/pain/illness/medical-instruction context
into unsupported workout or nutrition prescriptions; "אם קיבלת מידע על הנחיה רפואית פעילה... כבד
אותה כמגבלה" = respect a clearly user-reported active medical instruction within its literal scope;
"כשמידע בטיחותי אינו ודאי, היה שמרן" = conservative uncertainty; "לעולם אל תעקוף או תסתור הגבלה
רפואית שהמשתמש דיווח עליה" = do not override or contradict explicit user-reported medical
restrictions. Engineering-authored exact wording, submitted for Engineering Readiness Review /
Product confirmation of the literal text — the eight required concepts are fixed by PD-LSC-04; the
precise Hebrew phrasing is this SPEC's own proposal.

**This is defense-in-depth prompt containment only** — explicitly, per PD-LSC-04, never represented
as canonical Safety validation, never a replacement for Stage 8/9, never a guarantee of model
compliance. No downstream code reads or enforces this instruction; it is text the model may, in
principle, still deviate from — exactly the same honest limitation CSSC-001's own prompt-level
Safety abstention instruction already discloses for a structurally identical reason (`situationalContextInterpreter.js`'s
own "disclosed, non-guaranteed eligibility boundary" framing).

## §6. Change C — Protein-Attention Template Generalization

**Two independent existing surfaces confirmed by direct trace — both required, neither alone
sufficient:**

1. **`js/coach/coachPromptComposer.js:coachLine()`**, `protein` case (`:112`). Verified directly
   against current source: `pro ? (...) : warm ? (...) : (...)` — **three distinct literal string
   arms**, not two. `pro` (`'חלבון: 50g מתוך 140g.'`) already names no food and is unchanged. The
   other **two** arms both currently name specific foods and both require a text change: `warm`
   (*"...ביצה, עוף או קוטג׳ יסגרו את הפער יפה"* — egg, chicken, or cottage cheese) and the
   third/neutral arm, reached when neither `pro` nor `warm` (*"...אולי ביצים או קוטג׳?"* — maybe
   eggs or cottage cheese). Both non-`pro` arms must be rewritten to generic encouragement naming no
   food; only `pro`'s existing text is left untouched.
2. **`js/trigger/triggerDomain.js:proteinFoodHint()`** (`:140-145`), consumed by exactly one caller,
   `triggerLocalText()`'s `'low-protein'` case (`:156`). Selects a real, specific food from the
   user's own onboarding `foods` list when one matches a fixed protein-rich keyword set, else
   defaults to the fixed literal `'ביצה, קוטג׳ או עוף'`. **This function's entire purpose is
   food-selection — squarely, entirely prohibited by PD-LSC-07.** Also exposed as a standalone
   facade at `js/app.js:1756` (`function proteinFoodHint() { return TriggerDomain.proteinFoodHint(userProfile); }`)
   and asserted to exist, by exact source line, in `tests/c1Wp8Wiring.test.js:127` — this facade
   line and its `TriggerDomain` export key (`triggerDomain.js:178`) **must remain present** (do not
   delete the function or its export) to avoid an unrelated wiring-test break; only its **internal
   behavior** changes.

**Exact contract:**

- `coachLine()`'s `protein` case: both the `warm` arm and the third/neutral arm change from naming
  specific foods to generic encouragement — `warm`, e.g.: `n + ', שים לב לחלבון — ' + d.have +
  'g מתוך ' + d.target + 'g. תוספת קטנה של מקור חלבון תסגור את הפער יפה.'`; neutral, e.g.: `'חסר
  קצת חלבון: ' + d.have + 'g מתוך ' + d.target + 'g. תוספת קטנה של מקור חלבון תעזור.'` — both
  preserve protein-gap awareness and encouragement, neither names a food. The `pro` arm is
  unchanged (it already names no food).
- `triggerLocalText()`'s `'low-protein'` case (`:156`) no longer calls `proteinFoodHint()`; its
  trailing clause changes from `... + proteinFoodHint(profile) + ' יסגור את הפער יפה.'` to a fixed,
  generic closing clause naming no food, e.g. `'...תוספת קטנה של מקור חלבון יסגור את הפער יפה.'`
  (mirroring the `coachLine` wording above for consistency, Engineering's own proposal).
- `TriggerDomain.proteinFoodHint(profile)` itself is redefined to no longer read `profile.foods` or
  select any specific food — it becomes a fixed, generic function (or is reduced to returning a
  constant generic phrase) — its export key and the `js/app.js:1756` facade remain, satisfying the
  existing wiring-test assertion; only its return value's content changes, from a specific food name
  to generic text (or empty string, with the caller supplying the generic wrapper — implementation
  detail deferred to Engineering Readiness confirmation, not fixed by Product here).

**No new food alternatives are added anywhere; no generative call is introduced; the existing
deterministic template mechanism (fixed strings, tone-variant switch/ternary) is preserved exactly,
narrowed only to remove the specific-food-naming behavior.**

## §7. Explicit Non-Goals (binding, restated from PD-LSC)

Health/Safety Profile; a Safety-sensitive semantic interpreter; Canonical Safety Rule authoring;
`matchCanonicalSafetyRules()` implementation; Stage 8 changes; Stage 9 changes; Action Model; Action
Generation; Preference; any post-generation content validator of any kind (keyword filter, regex
gate, secondary LLM reviewer, duplicate mini-Safety-Layer); canonical Expression changes; legacy
Coach removal; new chat UI; new medical advice capability; new Safety scoring; new telemetry beyond
existing convention. None of these is touched, designed, or implied by this Work Item.

## §8. Red-Flag Verification Requirement

Production-backed, deterministic, not prose-only, per instruction:

1. Configure a fake `coachMessageFn` that records every call. Trigger the real redflag condition
   (`slopePctWeek < -1.2 && armDown`, via the existing, unmodified `evalRedFlag()`/`adaptiveTdeeDomain.js`
   fixture technique already proven in `tests/triggerDomain.test.js:159-162`). Call
   `presentTriggerCard({type:'redflag', live:false, data:{...}}, gen)` (the real, post-change
   `live` value) and separately call `TriggerController.triggerLiveText({type:'redflag', data:{...}})`
   directly. Assert: `coachMessageFn`'s recorded call count is exactly `0` in both cases (using this
   file's own existing `calls.some((c) => c[0] === 'coachMessage')` assertion convention, already
   present at `tests/triggerController.test.js:176`); `textEl.textContent` (or the direct return
   value) equals the new deterministic `'redflag'` case text from `triggerLocalText()`, for both a
   `warm` and non-`warm` profile.
2. Assert the trigger itself is still produced and still visible — `evalRedFlag()`'s own detection
   logic, `canFire()`/suppression gating, and card-visibility mechanics (`card.classList.remove('hidden')`)
   are unmodified and untested-as-changed by this Work Item; a regression assertion (existing test,
   unmodified) confirms this.
3. **Ordinary, non-redflag live-text path unchanged:** re-run the existing
   `triggerLiveText composes a specific context for redflag vs. streak vs. any other type` test
   (`tests/triggerController.test.js:216-225`) with its `redflag` assertion (`:220`) replaced per
   item 1 above, and its `streak-60`/`workout-logged` assertions (`:221-224`) **byte-identical,
   unmodified** — proving those paths' existing generative behavior is untouched.

## §9. Prompt Verification Requirements

Tests prove the **prompt contract itself** — never LLM compliance, per instruction. Extend
`tests/coachPromptComposer.test.js`'s existing `buildBasePrompt` test coverage with assertions that
the returned string contains each of the eight required concepts' literal Hebrew anchor phrases
(e.g. `assert.match(s, /לעולם אל תאבחן מצב רפואי/)`, one assertion per PD-LSC-04 bullet, using the
exact phrases fixed in §5 above — a closed-set, deterministic string-containment test, not a
behavioral one). Additionally prove, by the same technique already used elsewhere in this file:
`userStated`/`mem`/`derived` fragments remain present and in their existing relative order when
each is available (re-running existing, unmodified `buildSystemPrompt` success/partial/failure
tests, asserting no regression); existing tone/style (`COACH_STYLE_GUIDE`/`COACH_CHATTER_GUIDE`)
lines remain present, unmodified, at their existing positions.

## §10. Protein Template Verification

Tests prove, for both surfaces:

- `coachLine(profile, 'protein', {have, target})` — the `pro` variant remains byte-identical to its
  current text (already asserted, `tests/coachPromptComposer.test.js:103`); the `warm` variant's
  existing assertion (`:104`) is updated to the new generic text and explicitly asserts the absence
  of each prior food literal (`assert.doesNotMatch(result, /ביצה|עוף|קוטג/)`); a **new** assertion is
  added for the third/neutral arm (`pro:false, warm:false`) — currently untested by name for the
  `protein` key specifically, confirmed by direct inspection of the existing test file — asserting
  both its new generic text and the same absence of prior food literals (its current, unmodified
  text also names food: *"...אולי ביצים או קוטג׳?"*).
- `TriggerDomain.triggerLocalText(profile, {type:'low-protein', data:{...}})` — the existing partial
  `assert.match` (`tests/triggerDomain.test.js:207`, which only checks the message's leading clause
  and is unaffected by this change) remains as-is; a new assertion confirms the full returned string
  no longer contains any of the prior food literals.
- `TriggerDomain.proteinFoodHint(profile)` — the three existing behavioral tests
  (`tests/triggerDomain.test.js:186-193`, which assert user-list-matching and the fixed-default
  fallback, both now-prohibited behaviors) are replaced with tests asserting the function's new,
  generic, non-food-specific return value regardless of `profile.foods` content (including the same
  three fixture profiles already used, to prove the behavior actually changed, not merely that the
  old assertions were deleted).
- `tests/c1Wp8Wiring.test.js:70,127` — re-run unmodified; both assertions (the `TriggerDomain` API
  key list including `'proteinFoodHint'`, and the exact `js/app.js` facade source line) are expected
  to **continue passing without modification**, confirmed by the retained export key and facade line
  (§6).

## §11. Regression Requirements

1. Targeted: `node --test tests/triggerController.test.js tests/triggerDomain.test.js` (Change A +
   part of Change C).
2. Targeted: `node --test tests/coachPromptComposer.test.js` (Change B + part of Change C).
3. Targeted: `node --test tests/c1Wp8Wiring.test.js tests/c1Wp6Wiring.test.js` (structural wiring
   regression for both touched modules).
4. Targeted: `node --test tests/coachClient.test.js tests/coachPresenter.test.js` (confirm no
   incidental regression in the two other legacy-Coach-adjacent modules, both unmodified by this
   Work Item).
5. Named-subset regression per prior Work Item precedent: `node --test
   tests/memoryLayer.test.js tests/explicitRequestInterpreter.test.js tests/situationalContextInterpreter.test.js
   tests/safetyLayer.test.js tests/decisionFormation.test.js` — proving zero incidental effect on
   USM-001/EUR-001/CSSC-001/SL-001/Decision Formation (none of these files is touched; this is a
   confirmation run, not an extension).
6. Full: `node --test tests/*.test.js`. Verified starting baseline this session: **2142/2142
   passing**. Exact new total to be reported at Canonical Closure, honestly, not assumed in advance.

## §12. Scope Purity Requirements

Expected production file set, exhaustive, confirmed by the trace above — **larger than the
investigation's own illustrative file list** (which named only `triggerController.js`/
`coachPromptComposer.js`; direct repository evidence during this SPEC's own authoring found
`triggerDomain.js` is also required, for both Change A's `live`/`triggerLocalText` additions and
Change C's `proteinFoodHint`):

- `js/trigger/triggerDomain.js` (Change A items 1-2; Change C item 2's `proteinFoodHint`/
  `triggerLocalText` low-protein clause)
- `js/trigger/triggerController.js` (Change A item 3)
- `js/coach/coachPromptComposer.js` (Change B; Change C item 1)

**No other production file.** Specifically confirmed untouched: everything under
`js/coachDecisionSystem/`; `js/coach/coachClient.js`; `js/coach/coachPresenter.js`;
`js/adaptive/adaptiveTdeeController.js`; `js/adaptive/adaptiveTdeeDomain.js` (the red-flag
*detection* condition itself is unmodified — only its *consequence* changes); `js/app.js` (the
`proteinFoodHint()` facade at `:1756` is read, not written).

## §13. Test Files Expected

`tests/triggerController.test.js`, `tests/triggerDomain.test.js`, `tests/coachPromptComposer.test.js`
— all modified (specific line-level changes identified in §8-§10). No new test file is required —
every needed assertion extends an existing, already-appropriate test file. `tests/c1Wp8Wiring.test.js`,
`tests/c1Wp6Wiring.test.js`, `tests/coachClient.test.js`, `tests/coachPresenter.test.js` — run as
regression, expected unmodified.

## §14. Transitional Architecture Documentation (specified, not authored, this turn)

Per PD-LSC-09, the minimum canonical documentation to record at Canonical Closure (not performed by
this SPEC-authoring turn):

- **`docs/roadmap/Roadmap.md`** — one new, narrow entry (mirroring EUR-001/CSSC-001's own closure
  entry precedent) recording: LCSC-001 closed; the legacy Coach path's status is now explicitly
  recorded as **transitional architecture** (may continue operating, receives containment and
  maintenance only, no new Product capability, no expansion of responsibility); the long-term
  direction (canonical Coach Decision System becomes coaching-decision authority; legacy generative
  Coach path is expected to be retired as canonical replacements become available) is recorded as
  Product direction, not a committed timeline.
- **`docs/roadmap/Changelog.md`** — one new bullet entry, matching house style, summarizing the three
  changes and the closure verdict.
- **`docs/architecture/FITME_ARCHITECTURE_v1.md`** — one new numbered section (following the existing
  §29/§30/§31 precedent) recording the same transitional-architecture designation and explicitly
  stating what this closure does **not** establish: not canonical Safety architecture; not a
  substitute for Stage 8/9; not evidence that further legacy-path Safety work is unnecessary.
- **No update to `docs/specs/SL-001_SPEC_v1.0.md` or its governance package** — PD-LSC-02 and this
  Work Item's own Scope (§3) forbid it; SL-001 remains closed, untouched, uninterpreted by this
  closure.

`APP_VERSION`/service-worker `VERSION` decision deferred to Canonical Closure, per every prior Work
Item's own precedent — to be decided honestly at that time based on whether this Work Item ships new
observable user-facing behavior (plausible: redflag/protein message wording changes are
user-visible, though narrower/safer than before, not a new capability).

## §15. Hidden Foundation Verification

- No duplicate Safety authority introduced: confirmed — nothing in Changes A-C reads or writes
  `RiskType`/`reasonCode`/any SL-001 vocabulary; no new disposition, no new matcher.
- No canonical Decision-System file touched: confirmed by directory-level separation (§12).
- No conflict with USM-001: `assembleUserStatedMemoryFragment()`/`UserStatedMemoryPrompt.project()`
  unmodified, unremoved (PD-LSC-05); still appended in `buildSystemPrompt()` at its existing
  position, after Change B's new instruction lines are folded into `buildBasePrompt()`'s own return
  value upstream of that append.
- No conflict with CSSC-001/EUR-001: neither interpreter, neither's Pipeline Context field, is read
  or written by any file this Work Item touches.
- No conflict with RGEF: `feedbackDomain.js`/`initiativeEngine.js` untouched.
- No conflict with SL-001: confirmed exhaustively above (§2, §12).
- No conflict with canonical Expression: `expressionRenderer.js`/`deliveryIntentContract.js`
  untouched (PD-LSC-08).
- No new telemetry: none of the three changes requires a new StateAccess write, a new feedback
  event, or a new persisted field — all three are prompt-text/template-text/control-flow changes
  only.

## §16. Canonical Closure Requirements

Identical in kind to prior Work Items' own closure record: file list, exact test count
before/after, full regression confirmation, the three documentation updates named in §14,
`APP_VERSION` decision made honestly at that time, commit, push — to be produced only once
implementation is separately authorized.

---
