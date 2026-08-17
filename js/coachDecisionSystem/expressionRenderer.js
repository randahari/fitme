// ══════════════════════════════════════════════════════════════════
// FitMe — Expression Renderer (D2 Stage 10 — Expression rendering,
// EXPRESSION_SPEC_v1.0.md §8, §10.1, §12, §14.2, §14.3, §14.4, §23,
// Canonical Decisions CD-EXP-01, CD-EXP-02, CD-EXP-03, CD-EXP-04,
// Canonical Decision 8)
// WP4 of EXPRESSION_IMPLEMENTATION_PLAN.md — ordinary rendering: RECOMMENDATION/
// INITIATIVE-kind, UNMODIFIED-disposition, single-option TerminalDecisions
// (the base case, currently the only disposition value reachable in
// production, per the accepted architecture investigation). CLOSED.
// WP5 — REFUSAL rendering: BOUNDARY-kind, boundaryType 'REFUSAL',
// BLOCKED-disposition, single-option TerminalDecisions, per Canonical
// Decision CD-EXP-02 (EXP-58–62). CLOSED.
// WP6 — ESCALATION rendering: BOUNDARY-kind, boundaryType 'ESCALATION',
// ESCALATED-disposition, single-option TerminalDecisions, per Canonical
// Decision CD-EXP-03 (EXP-63–68). CLOSED.
// WP7 — Safety-intervention disclosure (CD-EXP-04, EXP-69–72), applied to
// exactly the three dispositions EXP-69 names: MODIFIED, BLOCKED, ESCALATED
// — never UNMODIFIED (nothing to disclose, WP4's base case) or DEFERRED
// (always Silence, no Delivery Intent at all, never reaches this module).
// Since BLOCKED/ESCALATED already co-occur unconditionally with REFUSAL/
// ESCALATION respectively (TASK_006_SPEC_v1.0.md §25.4), disclosure applies
// to every REFUSAL and ESCALATION rendering unconditionally — added as a
// single shared instruction fragment (DISCLOSURE_ACKNOWLEDGMENT_LINE
// below), not a behavior change to either path's own EXP-58–68 content.
// WP7 also adds a new MODIFIED rendering path (kind RECOMMENDATION/
// INITIATIVE, MODIFIED disposition): `modification.modifiedContent` — an
// untyped `<object>` per TASK_006_SPEC_v1.0.md §25 with no canonically
// fixed internal field schema, authored entirely by the Safety Layer, never
// by Expression — is rendered per §12/WP4's own general principles plus the
// same disclosure acknowledgment, without this module generating, inferring,
// altering, or repairing that content in any way (§14.5/EXP-OD-10, the
// bounded-modification content-generation algorithm itself, remains
// explicitly open and is not addressed, resolved, or assumed by this
// module). CLOSED.
// WP8 — Multi-option (tied-set) rendering (§15, EXP-35): every one of WP4's/
// WP5's/WP6's/WP7's four rendering paths above already governs a tied-set
// Terminal Decision (`options[]` present) exactly as it governs a
// single-option one — kind/boundaryType/safetyDisposition are decision-level
// fields regardless of `options[]`'s presence (Canonical Decision 7;
// TASK_006_SPEC_v1.0.md §25.10), so the same tone/register/disclosure rules
// already apply unconditionally. WP8 adds only: (a) the `hasNoTiedSet`
// exclusion is removed from all four `isWpXCase` boundary checks below,
// since tied-set is now in scope for each; (b) a shared instruction line
// (TIED_SET_PRESENTATION_LINE) telling the generative layer to present every
// option, unmutated, in the order supplied, without ranking or recommending
// one over another — reused across the base/REFUSAL/ESCALATION paths; (c)
// user-content composition for those three paths enumerates every entry of
// `options[]` (each the full, unmutated winning-tied Candidate object per
// §25.10) instead of the single top-level `rationale`, preserving option
// count, order, and membership exactly. The MODIFIED path is unchanged by
// WP8: per `[SLDP RCD-15]`, a MODIFIED disposition on a tied-set Terminal
// Decision applies `modification.modifiedContent` at the whole-decision
// level only, never per option — `buildModifiedUserContent` already never
// reads `options[]` at all, so it is correct for the tied-set case exactly
// as originally written, requiring no change. The Delivery Intent's own
// closed contract (CD-EXP-01/`deliveryIntentContract.js`) is unchanged —
// `renderedLanguage` remains a single string presenting every option in one
// coherent message; any UI mechanism for presenting multiple options is
// explicitly Coach Runtime's own downstream territory (§15's own Explicit
// Out of Scope; D3 Decision 6), not addressed here. The qualitative-rule
// verification test-double (WP13) remains a later Work Package's scope.
//
// Investigation gate (per EXPRESSION_IMPLEMENTATION_PLAN.md WP4, performed
// before writing this module): reviewed js/coach/coachPresenter.js's
// deps.coachMessageFn(ctx) pattern, js/coach/coachClient.js's
// deps.callClaude injection, and js/app.js's wiring of callClaude ->
// ClaudeProxyClient.send -> the existing anthropicProxy Cloud Function.
// This module reuses that dependency-injection *shape* only — an injected
// generative-call function, configured separately via configure(), exactly
// mirroring CoachClient.configure({callClaude}) — introducing no new
// LLM-calling infrastructure. It deliberately does NOT reuse
// CoachPromptComposer/CoachClient themselves: both are built around
// userProfile/todayData/currentUser, none of which is a declared input of
// D2 Stage 10. Expression's fixed Inputs are the Terminal Decision and the
// Expression Rendering Context alone (§8/§10/§10.1; D2-PP-03 — a Stage
// consumes only its own declared inputs); reading userProfile/todayData/
// StateAccess here would violate Stage isolation (D2-INV-03) exactly as a
// durable read would (EXP-15/EXP-16). Model/token choices below mirror
// coachClient.js's own existing constants for consistency, not as a new
// Product/Architecture decision — an ordinary, non-blocking Engineering
// choice.
//
// RESOLVED (previously a documented, reported gap; EXP-26/D1-PER-03) —
// EXPRESSION_IMPLEMENTATION_PLAN.md WP4 (remainder), Canonical Decision 8
// (D2 Unit 04 Stage 10 Amendment 1; D3 Decision 7, extending D3 Decision
// 3): Expression receives a second, narrow, closed, Memory-Layer-produced
// Stage-10 input — the Expression Rendering Context (EXPRESSION_SPEC_v1.0.md
// §10.1, EXP-73-78) — carrying exactly `relationshipMaturityStage`, the
// signal D1-PER-03 requires. This module consumes that value
// (RELATIONSHIP_MATURITY_GUIDANCE below) exactly as EXP-76 fixes: `UNKNOWN`
// is treated at least as conservatively as Observer-stage scope, by direct
// analogy to the Initiative Engine's own already-accepted treatment of the
// identical value (TASK_005_SPEC_v1.0.md §17.7, item E-2) — never more
// directive/anticipatory than Observer for an unknown relationship. This
// module itself never computes, infers, resolves, or estimates a
// Relationship Maturity Stage — it only consumes whatever closed-vocabulary
// value the Expression Rendering Context already carries, for every
// rendering path below, including REFUSAL. The other five D1 Unit 13
// personalization sub-rules (D1-PER-01/02/04/05/06) remain honored: no
// personalization is assumed from category beyond the supplied stage value;
// no Unit 02 absolute override is ever read or touched; user effort is
// reduced via concise, single-message output; no persuasive/exploitative
// device is ever instructed (EXP-27); nothing is learned or carried across
// calls or users — this module is stateless per invocation.
//
// EXP-28 (no phrasebook): the Hebrew strings below are instructions TO the
// generative layer (system/user turn content), never text a user will see
// verbatim — exactly the same discipline `js/coach/coachPromptComposer.js`'s
// own COACH_STYLE_GUIDE/COACH_CHATTER_GUIDE already use (steering guidance,
// not a catalog of user-facing phrases). The actual rendered language a user
// sees is always the generative layer's own output, never a literal string
// fixed in this file. This applies identically to REFUSAL rendering: EXP-58
// through EXP-62 below are realized as *principles* instructing the
// generative layer, never as fixed refusal sentences.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var DeliveryIntentContract = (typeof module !== 'undefined' && module.exports)
    ? require('./deliveryIntentContract.js')
    : window.DeliveryIntentContract;
  // Expression WP4 (remainder) / Canonical Decision 8 — schema-conformance validator for
  // Expression's second declared Stage-10 input; see the file header for full context.
  var ExpressionRenderingContext = (typeof module !== 'undefined' && module.exports)
    ? require('./expressionRenderingContext.js')
    : window.ExpressionRenderingContext;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  var BASE_IN_SCOPE_KINDS = ['RECOMMENDATION', 'INITIATIVE'];

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  // WP8 (§15/EXP-35) — a tied-set Terminal Decision carries a non-empty `options[]`, each entry
  // the full, unmutated winning-tied Candidate object (TASK_006_SPEC_v1.0.md §25.10). Every
  // rendering-path boundary check below now accepts both the single-option and tied-set shape.
  function hasTiedSet(terminalDecision) {
    return Array.isArray(terminalDecision.options) && terminalDecision.options.length > 0;
  }

  // WP4's own base-case boundary — restated, not redefined: RECOMMENDATION/INITIATIVE kind,
  // UNMODIFIED disposition — single-option or tied-set (WP8, §15/EXP-35).
  function isWp4BaseCase(terminalDecision) {
    if (!isPlainObject(terminalDecision)) return false;
    if (BASE_IN_SCOPE_KINDS.indexOf(terminalDecision.kind) === -1) return false;
    if (!isPlainObject(terminalDecision.safetyDisposition)) return false;
    if (terminalDecision.safetyDisposition.disposition !== 'UNMODIFIED') return false;
    return true;
  }

  // WP5's own REFUSAL-case boundary — restated, not redefined: kind 'BOUNDARY', boundaryType
  // 'REFUSAL', BLOCKED disposition (the only disposition REFUSAL ever co-occurs with,
  // TASK_006_SPEC_v1.0.md §25.4) — single-option or tied-set (WP8, §15/EXP-35: "CD-EXP-02/03/04
  // otherwise apply identically to a tied-set REFUSAL/ESCALATION/disclosure case as to a
  // single-option one").
  function isWp5RefusalCase(terminalDecision) {
    if (!isPlainObject(terminalDecision)) return false;
    if (terminalDecision.kind !== 'BOUNDARY') return false;
    if (terminalDecision.boundaryType !== 'REFUSAL') return false;
    if (!isPlainObject(terminalDecision.safetyDisposition)) return false;
    if (terminalDecision.safetyDisposition.disposition !== 'BLOCKED') return false;
    return true;
  }

  // WP6's own ESCALATION-case boundary — restated, not redefined: kind 'BOUNDARY', boundaryType
  // 'ESCALATION', ESCALATED disposition (the only disposition ESCALATION ever co-occurs with,
  // TASK_006_SPEC_v1.0.md §25.4) — single-option or tied-set (WP8, §15/EXP-35).
  function isWp6EscalationCase(terminalDecision) {
    if (!isPlainObject(terminalDecision)) return false;
    if (terminalDecision.kind !== 'BOUNDARY') return false;
    if (terminalDecision.boundaryType !== 'ESCALATION') return false;
    if (!isPlainObject(terminalDecision.safetyDisposition)) return false;
    if (terminalDecision.safetyDisposition.disposition !== 'ESCALATED') return false;
    return true;
  }

  // WP7's own MODIFIED-case boundary: kind RECOMMENDATION/INITIATIVE (MODIFIED never produces
  // BOUNDARY or SILENCE, TASK_006_SPEC_v1.0.md §25 line ~1330), MODIFIED disposition, a present
  // `modification.modifiedContent` (an untyped object — this module only checks it exists, never
  // presumes an internal field schema, see file header) — single-option or tied-set (WP8, §15/
  // EXP-35; `[SLDP RCD-15]`: MODIFIED on a tied-set applies at the whole-decision level only, so
  // this path's own rendering, which never reads `options[]`, is already correct unchanged).
  function isWp7ModifiedCase(terminalDecision) {
    if (!isPlainObject(terminalDecision)) return false;
    if (BASE_IN_SCOPE_KINDS.indexOf(terminalDecision.kind) === -1) return false;
    if (!isPlainObject(terminalDecision.safetyDisposition)) return false;
    if (terminalDecision.safetyDisposition.disposition !== 'MODIFIED') return false;
    if (!isPlainObject(terminalDecision.modification)) return false;
    if (!isPlainObject(terminalDecision.modification.modifiedContent)) return false;
    return true;
  }

  // EXP-76 — steering guidance per closed relationshipMaturityStage value, never a literal
  // phrasebook (these describe register/depth, exactly like coachPromptComposer.js's own
  // COACH_STYLE_GUIDE/COACH_CHATTER_GUIDE — never a sentence the user will see verbatim). Per
  // D1-IP-02/D1-PER-03 (D1_SPEC_v1.0.md): "more explanation and verification early, more
  // anticipation and reduced friction later." UNKNOWN is deliberately at least as conservative as
  // OBSERVER (TASK_005_SPEC_v1.0.md §17.7, item E-2) — this module never computes, infers, or
  // upgrades this value itself; it only selects the matching guidance for whatever closed value
  // the Expression Rendering Context already carries. Shared across every rendering path below.
  var RELATIONSHIP_MATURITY_GUIDANCE = {
    UNKNOWN: 'מידת ההיכרות עם המשתמש אינה ידועה — התייחס בזהירות, כמו בתחילת היכרות: הסבר יותר, ' +
      'ודא הבנה, ואל תניח קרבה, אמון, או ידע קודם שלא נמסר לך במפורש.',
    OBSERVER: 'שלב מוקדם מאוד ביחסים — הסבר יותר, ודא הבנה, ואל תניח קרבה, אמון, או ידע קודם שלא ' +
      'נמסר לך במפורש.',
    ASSISTANT: 'אמון ראשוני קיים — אפשר להיות מעט יותר תמציתי, אך עדיין הסבר את הבסיס לדברים ואל ' +
      'תניח יותר מדי היכרות.',
    TRUSTED_COACH: 'אמון מבוסס על דפוסים מאומתים — אפשר לצפות צרכים ולהפחית חיכוך: פחות הסברי ' +
      'יסוד, יותר ישירות.',
    PERSONAL_COACH: 'אמון עמוק ומבוסס לאורך זמן — מותרת ישירות ויוזמה מלאה, תוך שמירה מלאה על ' +
      'כבוד המשתמש.'
  };

  // Shared instruction fragments, reused verbatim across every rendering path below — never
  // duplicated as separate literal strings per path (single source of truth for EXP-27/§23).
  var VOICE_IDENTITY_LINE = 'אתה "המאמן" — הקול הקבוע והיחיד שדרכו FitMe פונה למשתמש (Coach Bible Ch.4). ' +
    'ההחלטה כבר התקבלה במלואה; תפקידך לנסח אותה בלבד — לעולם אל תשנה, תרכך, תחריף, או תמציא כל חלק ' +
    'ממנה, מהעדיפות שלה, או מהנימוק שלה.';
  var NO_MOTIVATIONAL_PRESSURE_LINE = 'אסור להשתמש בפחד, בבושה, באשמה, בדחיפות מלאכותית, או בטכניקות ' +
    'שיוצרות תלות רגשית ככלי שכנוע. אסור שתמריץ מסחרי, פרסומי, או מדד מעורבות ישפיע על הניסוח.';
  var HEBREW_ONLY_LINE = 'כתוב עברית בלבד, טקסט רץ (בלי כותרות, רשימות או Markdown), משפט או שניים, ' +
    'בגוף ראשון, כאילו המאמן עצמו מדבר.';
  // WP7 (CD-EXP-04, EXP-69-72) — the disclosure acknowledgment, shared verbatim across every
  // rendering path it applies to (REFUSAL, ESCALATION, MODIFIED — EXP-69's exact three
  // dispositions). EXP-70 (honest, plain-language, coach's-own-voice acknowledgment that the
  // response reflects a safety-related consideration), EXP-71 (never names an internal component,
  // stage, system, disposition value, or reasonCode), EXP-72 (woven into the same message, never a
  // separate technical notice) are all realized in this single instruction.
  var DISCLOSURE_ACKNOWLEDGMENT_LINE = 'שזור בתוך אותה ההודעה עצמה — לעולם לא כהערה נפרדת או ' +
    'טכנית — אמירה כנה ובשפה פשוטה, בקול המאמן, שהתשובה הזו נובעת משיקול הקשור לבטיחות או ' +
    'לרווחה שלך. אל תנקוב בשם רכיב, שלב עיבוד, מערכת, סיווג פנימי, קוד, או כל פרט טכני אחר.';
  // WP8 (§15/EXP-35) — shared across the base/REFUSAL/ESCALATION paths, added only when
  // hasTiedSet() is true (single-option system instructions remain byte-for-byte unchanged).
  // Realizes the canonical tied-set rules restated in EXPRESSION_IMPLEMENTATION_PLAN.md's WP8
  // authorization: every option preserved, order/count/membership unchanged, none independently
  // re-ranked, removed, added, or rewritten into a different decision — the choice is the user's.
  var TIED_SET_PRESENTATION_LINE = 'לפניך כמה אפשרויות שוות-ערך יחד, לא אחת בלבד — הצג את כולן ' +
    'במלואן, בדיוק לפי הסדר שסופקו, בלי להשמיט אף אחת מהן, בלי להוסיף אפשרות שלא סופקה לך, ' +
    'ובלי לדרג, להעדיף, או להמליץ על אחת מהן על פני האחרות. הבחירה ביניהן היא של המשתמש בלבד.';

  // WP8 — enumerates every entry of `options[]` (each the full, unmutated winning-tied Candidate
  // object, TASK_006_SPEC_v1.0.md §25.10) into the generative layer's user-turn content, preserving
  // option count, order, and membership exactly — never summarized, reordered, or filtered. Each
  // Candidate's own `action`/`rationale` fields are used (RecommendationCandidate/InitiativeCandidate
  // shape, §10.4); `confidence`/`hierarchyTier` are per-option, not referenced here, matching the
  // single-option paths' own use of only `rationale` for content (confidence/hierarchyTier there
  // feed firmness calibration, not option identity — no per-option firmness calibration is
  // introduced here, avoiding an unapproved new rendering behavior).
  function describeOptions(options) {
    return options.map(function (option, index) {
      var o = isPlainObject(option) ? option : {};
      var r = isPlainObject(o.rationale) ? o.rationale : {};
      return 'אפשרות ' + (index + 1) + ' מתוך ' + options.length + ': פעולה: ' + (o.action || '') +
        '. נימוק: ' + (r.rationale || '') + '. בסיס הראיות: ' + (r.evidenceBasis || '') +
        '. ערך צפוי: ' + (r.expectedValue || '') + '. אי-ודאות: ' + (r.uncertainty || '') + '.';
    }).join(' ');
  }

  // The generative-call system instruction for WP4's base case — built entirely from
  // already-approved principles (Coach Bible Ch.4, D1-ER-05, EXP-25/27, D1-PER-03/EXP-76, §23
  // EXP-47's Hebrew-only baseline). Never a literal phrasebook (EXP-28, see header).
  function buildBaseSystemInstruction(terminalDecision, expressionRenderingContext) {
    var confidence = terminalDecision.confidence;
    var maturityGuidance = RELATIONSHIP_MATURITY_GUIDANCE[expressionRenderingContext.relationshipMaturityStage];
    var lines = [
      VOICE_IDENTITY_LINE,
      'רמת הביטחון בהחלטה היא ' + confidence + ' (בין 0 ל-1). כייל את התקיפות/הזהירות של הניסוח ' +
        'לרמת ביטחון זו באופן כן — ביטחון גבוה מנוסח בבהירות ותקיפות; ביטחון נמוך יותר מנוסח ' +
        'בזהירות ובכנות, מבלי להסתיר את אי-הוודאות ומבלי להמציא ודאות שאינה קיימת.'
    ];
    if (hasTiedSet(terminalDecision)) { lines.push(TIED_SET_PRESENTATION_LINE); } // WP8 (§15/EXP-35)
    lines.push(maturityGuidance, NO_MOTIVATIONAL_PRESSURE_LINE, HEBREW_ONLY_LINE);
    return lines.join(' ');
  }

  // The generative layer's user-turn content for WP4's base case — derived exclusively from
  // already-approved TerminalDecision fields (§10); no chat/UI/platform reference, no
  // userProfile/todayData read (D2-PP-03 — Expression consumes only its own Stage's declared
  // inputs, see header).
  function buildUserContent(terminalDecision) {
    // WP8 (§15/EXP-35) — a tied-set enumerates every option instead of the single top-level
    // rationale; option count, order, and membership preserved exactly (TASK_006_SPEC_v1.0.md
    // §25.10).
    if (hasTiedSet(terminalDecision)) {
      return describeOptions(terminalDecision.options) +
        ' נסח הודעת מאמן אחת שמציגה את כל ' + terminalDecision.options.length +
        ' האפשרויות הללו למשתמש כפי שתוארו, בהתאם להנחיות.';
    }
    var r = terminalDecision.rationale || {};
    return [
      'ההחלטה: ' + terminalDecision.kind + '.',
      'נימוק: ' + (r.rationale || ''),
      'בסיס הראיות: ' + (r.evidenceBasis || ''),
      'ערך צפוי: ' + (r.expectedValue || ''),
      'אי-ודאות: ' + (r.uncertainty || ''),
      'רמת עדיפות (hierarchyTier): ' + terminalDecision.hierarchyTier + '.',
      'נסח הודעת מאמן אחת, קצרה, שמעבירה את ההחלטה הזו למשתמש.'
    ].join(' ');
  }

  // WP5 — the generative-call system instruction for REFUSAL rendering, realizing EXP-58–62
  // (CD-EXP-02) as steering principles, never as fixed refusal sentences (EXP-28). Each line below
  // maps to exactly one EXP-## requirement, in order:
  //   EXP-58 — explicit, unambiguous non-fulfillment statement, never disguised as a recommendation
  //   EXP-59 — limitation attributed to the situation/principle, never to the user
  //   EXP-60 — no blame/shame/failure/wrongdoing language
  //   EXP-61 — safer alternative only if the data supplies one (see below — currently always
  //            absent, per the accepted architecture investigation; no detection capability is
  //            introduced here, only the vacuous branch this module can actually reach today)
  //   EXP-62 — no comparison, measurement, or judgment of the user
  // WP7 (CD-EXP-04, EXP-69-72) adds DISCLOSURE_ACKNOWLEDGMENT_LINE, unconditionally — REFUSAL
  // always co-occurs with BLOCKED (TASK_006_SPEC_v1.0.md §25.4), one of EXP-69's exact three
  // disclosure-eligible dispositions, so every REFUSAL rendering discloses. This is WP7's own
  // authorized addition; EXP-58–62's own content (above) is otherwise byte-for-byte unchanged
  // from WP5.
  function buildRefusalSystemInstruction(terminalDecision, expressionRenderingContext, saferAlternative) {
    var maturityGuidance = RELATIONSHIP_MATURITY_GUIDANCE[expressionRenderingContext.relationshipMaturityStage];
    var alternativeLine = saferAlternative
      ? 'קיימת חלופה בטוחה שסופקה לך במפורש — הצג אותה כצעד הטבעי הבא, כחלק מהתמיכה הנמשכת.'
      : 'אין כרגע חלופה בטוחה קונקרטית שסופקה לך — עבור ישירות להמשך תמיכה, מבלי לציין, לרמוז, או ' +
        'להסב תשומת לב להיעדרה של חלופה.';
    var lines = [
      VOICE_IDENTITY_LINE,
      'ההחלטה היא סירוב מוגן: אי-אפשר למלא את הבקשה הספציפית הזו. אמור זאת במפורש ובאופן ' +
        'חד-משמעי — לעולם אל תציג את התשובה כהמלצה רגילה שפשוט משמיטה את מה שנחסם.',
      'ייחס את המגבלה למצב או לעיקרון שבבסיסה בלבד — לעולם לא לשיפוט, לאופי, או לערך של המשתמש.',
      'אל תשתמש בשפה של האשמה, בושה, כישלון, או "טעות" מצד המשתמש.',
      alternativeLine,
      'אל תשווה, תמדוד, או תשפוט את המשתמש בשום צורה — כבודו מוחלט ואינו מותנה בדבר.'
    ];
    if (hasTiedSet(terminalDecision)) { lines.push(TIED_SET_PRESENTATION_LINE); } // WP8 (§15/EXP-35)
    lines.push(DISCLOSURE_ACKNOWLEDGMENT_LINE, maturityGuidance, NO_MOTIVATIONAL_PRESSURE_LINE, HEBREW_ONLY_LINE);
    return lines.join(' ');
  }

  // WP5 — the generative layer's user-turn content for REFUSAL rendering. Derived exclusively
  // from already-approved TerminalDecision fields; confidence/hierarchyTier are RECOMMENDATION/
  // INITIATIVE-only (TASK_006_SPEC_v1.0.md §25.1) and are correctly never referenced here.
  //
  // Safer-alternative detection (EXP-61): TerminalDecision's own fixed shape (§25) has no field
  // canonically defined to carry a safer alternative — confirmed absent at the current repository
  // baseline by the accepted architecture investigation (EXPRESSION_SPEC_v1.0.md §14.2 EXP-61: "the
  // current, universal case... This branch is presently vacuous... not a directive to build a
  // safer-alternative-detection capability; none is introduced by this decision"). This function
  // therefore always takes the no-alternative branch today; it does not invent, search for, or
  // infer one from `rationale` or any other field.
  function buildRefusalUserContent(terminalDecision) {
    // WP8 (§15/EXP-35) — a tied-set REFUSAL enumerates every option instead of the single
    // top-level rationale; §15's own text: "CD-EXP-02...appl[ies] identically to a tied-set
    // REFUSAL...case as to a single-option one." No option carries a safer-alternative field
    // either (same Candidate shape as the base case) — EXP-61's vacuous branch still applies.
    if (hasTiedSet(terminalDecision)) {
      return {
        content: describeOptions(terminalDecision.options) +
          ' נסח הודעת מאמן אחת שמציגה את כל ' + terminalDecision.options.length +
          ' האפשרויות הללו כסירוב אחד, בהתאם להנחיות.',
        saferAlternative: null
      };
    }
    var r = terminalDecision.rationale || {};
    return {
      content: [
        'ההחלטה: סירוב (REFUSAL).',
        'נימוק: ' + (r.rationale || ''),
        'בסיס הראיות: ' + (r.evidenceBasis || ''),
        'ערך צפוי: ' + (r.expectedValue || ''),
        'אי-ודאות: ' + (r.uncertainty || ''),
        'נסח הודעת מאמן אחת, קצרה, שמעבירה את הסירוב הזה למשתמש בהתאם להנחיות.'
      ].join(' '),
      saferAlternative: null // no canonical field exists to carry one — see comment above (EXP-61)
    };
  }

  // WP6 — the generative-call system instruction for ESCALATION rendering, realizing EXP-63–68
  // (CD-EXP-03) as steering principles, never as fixed sentences (EXP-28). Each line below maps to
  // exactly one EXP-## requirement, in order:
  //   EXP-63 — rendered as an already-decided fact; no independent assessment of whether warranted
  //   EXP-64 — calm, clear encouragement toward professional support; no diagnosis, no naming a
  //            condition
  //   EXP-65 — single fixed register, identical to ordinary coaching guidance, never alarm/drama.
  //            safetyDisposition carries no Urgency/severity dimension for Expression to calibrate
  //            against (per the accepted architecture investigation) — none is read, computed, or
  //            introduced here; this instruction is unconditional, not graduated by any signal.
  //   EXP-66 — explicit affirmation that coaching continues alongside the suggestion, never as a
  //            replacement for it
  //   EXP-67 — never states or implies FITME itself will/has contact(ed) or replaces a healthcare
  //            provider or third party
  //   EXP-68 — never softened to the point seriousness could be missed (no false reassurance)
  // WP7 (CD-EXP-04, EXP-69-72) adds DISCLOSURE_ACKNOWLEDGMENT_LINE, unconditionally — ESCALATION
  // always co-occurs with ESCALATED (TASK_006_SPEC_v1.0.md §25.4), one of EXP-69's exact three
  // disclosure-eligible dispositions, so every ESCALATION rendering discloses. This is WP7's own
  // authorized addition; EXP-63–68's own content (above) is otherwise byte-for-byte unchanged
  // from WP6.
  function buildEscalationSystemInstruction(terminalDecision, expressionRenderingContext) {
    var maturityGuidance = RELATIONSHIP_MATURITY_GUIDANCE[expressionRenderingContext.relationshipMaturityStage];
    var lines = [
      VOICE_IDENTITY_LINE,
      'ההחלטה היא הפניה להתייעצות מקצועית (ESCALATION), שכבר התקבלה במלואה על ידי שכבת הבטיחות — ' +
        'אל תעריך בעצמך אם ההפניה מוצדקת, ואל תפקפק בה.',
      'עודד בעדינות ובבהירות פנייה לתמיכה מקצועית מתאימה, מבלי לאבחן ומבלי לנקוב בשם מצב או ' +
        'אבחנה ספציפיים כלשהם.',
      'שמור על אותו רוגע וטון בדיוק כמו בהדרכה רגילה — לא אזעקה, לא דרמה, לא שינוי פתאומי בסגנון ' +
        'הדיבור, ולא כל דירוג של דחיפות או חומרה.',
      'אשר במפורש שההליווי האימוני נמשך לצד ההפניה — היא לעולם אינה מחליפה אותו.',
      'אל תאמר ואל תרמוז ש-FitMe יצרה, תיצור, או כבר יצרה קשר עם גורם מקצועי, גוף בריאות, או צד ' +
        'שלישי כלשהו.',
      'אל תרכך את הניסוח עד כדי כך שהרצינות עלולה להתפספס — כנות מלאה, בלי להבהיל ובלי להרגיע יתר על המידה.'
    ];
    if (hasTiedSet(terminalDecision)) { lines.push(TIED_SET_PRESENTATION_LINE); } // WP8 (§15/EXP-35)
    lines.push(DISCLOSURE_ACKNOWLEDGMENT_LINE, maturityGuidance, NO_MOTIVATIONAL_PRESSURE_LINE, HEBREW_ONLY_LINE);
    return lines.join(' ');
  }

  // WP6 — the generative layer's user-turn content for ESCALATION rendering. Derived exclusively
  // from already-approved TerminalDecision fields; confidence/hierarchyTier are RECOMMENDATION/
  // INITIATIVE-only (TASK_006_SPEC_v1.0.md §25.1) and are correctly never referenced here. No
  // Urgency/severity field is read or referenced — none exists on TerminalDecision, and none is
  // introduced by this function.
  function buildEscalationUserContent(terminalDecision) {
    // WP8 (§15/EXP-35) — a tied-set ESCALATION enumerates every option instead of the single
    // top-level rationale, exactly as the base/REFUSAL paths do.
    if (hasTiedSet(terminalDecision)) {
      return describeOptions(terminalDecision.options) +
        ' נסח הודעת מאמן אחת שמציגה את כל ' + terminalDecision.options.length +
        ' האפשרויות הללו כהפניה אחת להתייעצות מקצועית, בהתאם להנחיות.';
    }
    var r = terminalDecision.rationale || {};
    return [
      'ההחלטה: הפניה להתייעצות מקצועית (ESCALATION).',
      'נימוק: ' + (r.rationale || ''),
      'בסיס הראיות: ' + (r.evidenceBasis || ''),
      'ערך צפוי: ' + (r.expectedValue || ''),
      'אי-ודאות: ' + (r.uncertainty || ''),
      'נסח הודעת מאמן אחת, קצרה, שמעבירה את ההפניה הזו למשתמש בהתאם להנחיות.'
    ].join(' ');
  }

  // WP7 — the generative-call system instruction for MODIFIED rendering. The substantive content
  // is `modification.modifiedContent`, already authored by the Safety Layer (TASK_006_SPEC_v1.0.md
  // §25) — this module renders it into the coach's voice per §12/WP4's general principles, exactly
  // as it renders `rationale` for the base case, but explicitly instructs the generative layer
  // never to change, add to, remove from, or "repair" that content's own meaning — no generation,
  // inference, alteration, or repair of the modified content happens in this module or is ever
  // instructed of the generative layer. Includes DISCLOSURE_ACKNOWLEDGMENT_LINE unconditionally —
  // MODIFIED is one of EXP-69's exact three disclosure-eligible dispositions.
  function buildModifiedSystemInstruction(terminalDecision, expressionRenderingContext) {
    var maturityGuidance = RELATIONSHIP_MATURITY_GUIDANCE[expressionRenderingContext.relationshipMaturityStage];
    return [
      VOICE_IDENTITY_LINE,
      'התוכן שעליך להעביר כבר הוחלט ונוסח במלואו מראש על ידי גורם אחר — תפקידך לנסח אותו מחדש ' +
        'בקול המאמן בלבד. לעולם אל תשנה את משמעותו, אל תוסיף עליו, אל תגרע ממנו, ואל "תתקן" אותו ' +
        'בשום צורה.',
      DISCLOSURE_ACKNOWLEDGMENT_LINE,
      maturityGuidance,
      NO_MOTIVATIONAL_PRESSURE_LINE,
      HEBREW_ONLY_LINE
    ].join(' ');
  }

  // WP7 — the generative layer's user-turn content for MODIFIED rendering. `modification.
  // modifiedContent` is an untyped `<object>` with no canonically fixed internal field schema
  // (TASK_006_SPEC_v1.0.md §25) — this function does not presume, interpret, or select specific
  // field names (which would itself be a form of inferring/interpreting content this module must
  // not perform); it serializes the object's own key/value pairs generically and passes them
  // through verbatim, exactly as supplied.
  function buildModifiedUserContent(terminalDecision) {
    var modifiedContent = terminalDecision.modification.modifiedContent;
    var serialized = Object.keys(modifiedContent)
      .map(function (key) { return key + ': ' + modifiedContent[key]; })
      .join('; ');
    return [
      'ההחלטה: תוכן שהותאם משיקולי בטיחות (MODIFIED).',
      'התוכן שכבר הוחלט ונוסח מראש, כפי שסופק (אל תשנה, אל תוסיף, אל תגרע): ' + serialized,
      'נסח הודעת מאמן אחת, קצרה, שמעבירה את התוכן הזה למשתמש בהתאם להנחיות.'
    ].join(' ');
  }

  // No pass/run identity is threaded into runExpressionStage()/render() today — EXP-OD-9's own
  // residual "concrete correlation mechanism" is explicitly Engineering Decision Pending,
  // non-blocking (§11.5), deferred to "a later Work Package's own concern" — this is that Work
  // Package. This module therefore generates its own opaque, render-time correlation id;
  // whether a richer, pass-linked correlation mechanism is needed once a real Feedback
  // Processing consumer exists is a WP9/WP10-adjacent question, not re-litigated here.
  var _correlationCounter = 0;
  function generateCorrelationId() {
    _correlationCounter++;
    return 'expr-' + Date.now().toString(36) + '-' + _correlationCounter.toString(36) + '-' +
      Math.random().toString(36).slice(2, 8);
  }

  async function render(terminalDecision, expressionRenderingContext) {
    if (!deps || typeof deps.generateFn !== 'function') {
      // Mirrors the abort-rather-than-fabricate discipline already established at
      // EXPRESSION_PORT_UNAVAILABLE (internalPipelineOrchestrator.js) — production never
      // proceeds without a real, configured generative dependency.
      throw new Error('EXPRESSION_RENDERER_NOT_CONFIGURED');
    }
    // Defensive validation (EXP-77) — mirrors this module's own TerminalDecision-scope checks
    // below; the Orchestrator already validates this before ever calling render() (WP4 remainder),
    // but an upstream guarantee is never a substitute for boundary-level validation here either
    // (same discipline EXP-19 already establishes). This module never computes, infers, or
    // substitutes a value of its own when this check fails — it aborts.
    if (!ExpressionRenderingContext.isValidExpressionRenderingContext(expressionRenderingContext)) {
      throw new Error('EXPRESSION_RENDERER_INVALID_RENDERING_CONTEXT');
    }

    var system, userContent, semanticSignal;

    if (isWp4BaseCase(terminalDecision)) {
      system = buildBaseSystemInstruction(terminalDecision, expressionRenderingContext);
      userContent = buildUserContent(terminalDecision);
      semanticSignal = {
        kind: terminalDecision.kind,
        safetyDisposition: terminalDecision.safetyDisposition.disposition
      };
    } else if (isWp5RefusalCase(terminalDecision)) {
      var refusalUser = buildRefusalUserContent(terminalDecision);
      system = buildRefusalSystemInstruction(terminalDecision, expressionRenderingContext, refusalUser.saferAlternative);
      userContent = refusalUser.content;
      semanticSignal = {
        kind: terminalDecision.kind,
        boundaryType: terminalDecision.boundaryType,
        safetyDisposition: terminalDecision.safetyDisposition.disposition
      };
    } else if (isWp6EscalationCase(terminalDecision)) {
      system = buildEscalationSystemInstruction(terminalDecision, expressionRenderingContext);
      userContent = buildEscalationUserContent(terminalDecision);
      semanticSignal = {
        kind: terminalDecision.kind,
        boundaryType: terminalDecision.boundaryType,
        safetyDisposition: terminalDecision.safetyDisposition.disposition
      };
    } else if (isWp7ModifiedCase(terminalDecision)) {
      system = buildModifiedSystemInstruction(terminalDecision, expressionRenderingContext);
      userContent = buildModifiedUserContent(terminalDecision);
      semanticSignal = {
        kind: terminalDecision.kind,
        safetyDisposition: terminalDecision.safetyDisposition.disposition
      };
    } else {
      // No TerminalDecision shape matches any of the four rendering paths above (each of which now
      // covers both its single-option and tied-set form, WP8) — explicitly refused rather than
      // silently mishandled, never fabricated content.
      throw new Error('EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION');
    }

    var renderedLanguage = await deps.generateFn({
      system: system,
      messages: [{ role: 'user', content: userContent }]
    });

    if (typeof renderedLanguage !== 'string' || renderedLanguage.trim().length === 0) {
      // Never fabricate a Delivery Intent as fallback content (D1-DI-02) — an empty/failed
      // generative result is a failure condition, not a valid outcome to paper over.
      throw new Error('EXPRESSION_RENDERER_EMPTY_OUTPUT');
    }

    var built = DeliveryIntentContract.buildDeliveryIntent({
      renderedLanguage: renderedLanguage.trim(),
      semanticSignal: semanticSignal,
      correlation: { decisionId: generateCorrelationId() }
    });

    if (built.status !== 'BUILT') {
      // Defensive only — should not occur given the inputs constructed above are always
      // well-formed; never return an invalid Delivery Intent rather than fail loudly.
      throw new Error('EXPRESSION_RENDERER_DELIVERY_INTENT_REJECTED: ' + built.reason);
    }

    return built.deliveryIntent;
  }

  var API = {
    configure: configure,
    render: render
  };

  if (typeof window !== 'undefined') { window.ExpressionRenderer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
