// Expression WP4/WP5/WP6/WP7/WP8 — Expression Renderer tests (EXPRESSION_SPEC_v1.0.md §8, §10.1,
// §12, §14.2, §14.3, §14.4, §15, §23, EXP-25–28, EXP-35, EXP-47, EXP-58–72, EXP-73–78;
// EXPRESSION_IMPLEMENTATION_PLAN.md WP4/WP5/WP6/WP7/WP8). Tests four rendering paths — WP4's base
// case, WP5's REFUSAL case, WP6's ESCALATION case, WP7's MODIFIED case — each in both its
// single-option and WP8 tied-set (`options[]` present) form, together with the Expression
// Rendering Context (Canonical Decision 8). Tied-set assertions verify: option count/order/
// membership preserved exactly, no option independently re-ranked/removed/added/rewritten, a
// MODIFIED disposition on a tied-set applies at the whole-decision level only (`[SLDP RCD-15]` —
// `options[]` is never read when `modification.modifiedContent` governs), and every single-option
// path's own behavior is unaffected by the WP8 addition (regression checks). Disclosure (CD-EXP-04,
// EXP-69–72) is asserted as present for REFUSAL/ESCALATION/MODIFIED (both forms) and absent for the
// base (UNMODIFIED) case. No Urgency/severity signal is ever read, referenced, or introduced. This
// module never generates, infers, alters, or repairs `modification.modifiedContent`. The qualitative-
// rule test-double (WP13) remains a later Work Package's scope. Per AC-6/EXP-43, generated language
// content is never asserted identical — only kind-level dispatch outcome and composed-payload shape
// are.
// Run with: node --test tests/expressionRenderer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ExpressionRenderer = require('../js/coachDecisionSystem/expressionRenderer.js');
const ExpressionRenderingContext = require('../js/coachDecisionSystem/expressionRenderingContext.js');

function validTerminalDecision(overrides) {
  return Object.assign({
    kind: 'RECOMMENDATION',
    rationale: { rationale: 'תזוזה קלה תעזור היום', evidenceBasis: 'דפוס פעילות ירוד השבוע', expectedValue: 'שיפור עקבי', uncertainty: 'בינונית' },
    confidence: 0.72,
    hierarchyTier: 3,
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'RECOMMENDATION' },
    immutable: true
  }, overrides || {});
}

function validRefusalTerminalDecision(overrides) {
  return Object.assign({
    kind: 'BOUNDARY',
    boundaryType: 'REFUSAL',
    rationale: { rationale: 'הבקשה חורגת מגבול בטיחות קבוע', evidenceBasis: 'התאמה לכלל בטיחות ידוע', expectedValue: 'שמירה על בטיחות המשתמש', uncertainty: 'נמוכה' },
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'BLOCKED', originalKind: 'RECOMMENDATION' },
    immutable: true
  }, overrides || {});
}

function validEscalationTerminalDecision(overrides) {
  return Object.assign({
    kind: 'BOUNDARY',
    boundaryType: 'ESCALATION',
    rationale: { rationale: 'סימנים מדווחים שדורשים ליווי מקצועי', evidenceBasis: 'התאמה לכלל בטיחות ידוע', expectedValue: 'תמיכה מקצועית מתאימה', uncertainty: 'נמוכה' },
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'ESCALATED', originalKind: 'RECOMMENDATION' },
    immutable: true
  }, overrides || {});
}

function validModifiedTerminalDecision(overrides) {
  return Object.assign({
    kind: 'RECOMMENDATION',
    rationale: { rationale: 'תזוזה קלה תעזור היום', evidenceBasis: 'דפוס פעילות ירוד השבוע', expectedValue: 'שיפור עקבי', uncertainty: 'בינונית' },
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'MODIFIED', originalKind: 'RECOMMENDATION' },
    modification: { modifiedContent: { text: 'MOD_CONTENT_MARK', note: 'NOTE_MARK' } },
    immutable: true
  }, overrides || {});
}

// WP8 (§15/EXP-35) — each entry the full, unmutated winning-tied Candidate object shape
// (RecommendationCandidate, TASK_006_SPEC_v1.0.md §10.4/§25.10), distinctly marked so tests can
// verify count/order/membership preservation.
function validTiedOptions(count) {
  var n = count || 3;
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push({
      kind: 'Recommendation',
      category: 'nutrition',
      action: 'ACTION_MARK_' + i,
      rationale: { rationale: 'RATIONALE_MARK_' + i, evidenceBasis: 'EVIDENCE_MARK_' + i, expectedValue: 'VALUE_MARK_' + i, uncertainty: 'UNCERTAINTY_MARK_' + i },
      confidence: 0.7,
      hierarchyTier: 3,
      opportunityProvenance: { opportunityId: 'opp-' + i, sourceCategory: 'DECISION_WINDOW', detectedAt: 1000 + i }
    });
  }
  return out;
}

function validRenderingContext(stage) {
  return ExpressionRenderingContext.buildExpressionRenderingContext({ relationshipMaturityStage: stage || 'UNKNOWN' }).expressionRenderingContext;
}

function fakeGenerateFnReturning(text) {
  var calls = [];
  var fn = function (payload) { calls.push(payload); return Promise.resolve(text); };
  fn.calls = calls;
  return fn;
}

// ── Not configured — abort rather than fabricate ──

test('1. render() throws EXPRESSION_RENDERER_NOT_CONFIGURED when no generateFn has been injected', async () => {
  await assert.rejects(
    () => ExpressionRenderer.render(validTerminalDecision(), validRenderingContext()),
    /EXPRESSION_RENDERER_NOT_CONFIGURED/
  );
});

// ── Base-case rendering (WP4): RECOMMENDATION/INITIATIVE, UNMODIFIED, single-option ──

test('2. renders a valid UNMODIFIED RECOMMENDATION into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('היי, בוא ננסה משהו קטן היום.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
  assert.equal(di.renderedLanguage, 'היי, בוא ננסה משהו קטן היום.');
});

test('3. renders a valid UNMODIFIED INITIATIVE the same way', async () => {
  var gen = fakeGenerateFnReturning('שמתי לב למשהו ורציתי להזכיר.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validTerminalDecision({ kind: 'INITIATIVE', safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'INITIATIVE' } }), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('4. semanticSignal.kind/safetyDisposition reflect the input TerminalDecision exactly', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di = await ExpressionRenderer.render(validTerminalDecision({ kind: 'INITIATIVE', safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'INITIATIVE' } }), validRenderingContext());
  assert.equal(di.semanticSignal.kind, 'INITIATIVE');
  assert.equal(di.semanticSignal.safetyDisposition, 'UNMODIFIED');
  assert.equal(Object.prototype.hasOwnProperty.call(di.semanticSignal, 'boundaryType'), false);
});

test('5. correlation.decisionId is a non-empty opaque string, distinct across separate renders', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di1 = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  const di2 = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.equal(typeof di1.correlation.decisionId, 'string');
  assert.ok(di1.correlation.decisionId.length > 0);
  assert.notEqual(di1.correlation.decisionId, di2.correlation.decisionId);
});

test('6. the returned Delivery Intent is frozen/immutable', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.equal(Object.isFrozen(di), true);
  assert.equal(Object.isFrozen(di.semanticSignal), true);
  assert.equal(Object.isFrozen(di.correlation), true);
});

// ── Composed generative-call payload (WP4): TerminalDecision-derived content only ──

test('7. the composed system instruction includes a confidence-derived firmness-calibration cue (D1-ER-05)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision({ confidence: 0.91 }), validRenderingContext());
  assert.match(gen.calls[0].system, /0\.91/);
  assert.match(gen.calls[0].system, /ביטחון/);
});

test('8. the composed system instruction targets Hebrew-only output (EXP-47/§23)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /עברית/);
});

test('9. the composed system instruction prohibits fear/shame/guilt/urgency/manufactured-dependency motivators (EXP-27)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /פחד/);
  assert.match(sys, /בושה/);
  assert.match(sys, /אשמה/);
  assert.match(sys, /דחיפות/);
});

test('10. the composed user content is derived only from TerminalDecision fields — rationale sub-fields present', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision({
    rationale: { rationale: 'R_MARK', evidenceBasis: 'E_MARK', expectedValue: 'V_MARK', uncertainty: 'U_MARK' }
  }), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  assert.match(user, /R_MARK/);
  assert.match(user, /E_MARK/);
  assert.match(user, /V_MARK/);
  assert.match(user, /U_MARK/);
});

test('11. neither the system instruction nor the user content ever references chat/UI/platform/userProfile-shaped data', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  var payload = JSON.stringify(gen.calls[0]);
  ['userProfile', 'todayData', 'currentUser', 'coachStyle', 'coachChatter', 'notification', 'widget', 'trigger card', 'push'].forEach((needle) => {
    assert.equal(payload.toLowerCase().indexOf(needle.toLowerCase()), -1, needle + ' must not appear in the composed payload');
  });
});

// ── EXP-76: relationshipMaturityStage consumption, resolved (Canonical Decision 8) ──

test('12. the composed system instruction includes distinct, closed-vocabulary-driven guidance for each relationshipMaturityStage value', async () => {
  var seen = {};
  for (const stage of ExpressionRenderingContext.RELATIONSHIP_MATURITY_STAGES) {
    var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
    ExpressionRenderer.configure({ generateFn: gen });
    await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext(stage));
    seen[stage] = gen.calls[0].system;
  }
  const texts = Object.values(seen);
  assert.equal(new Set(texts).size, texts.length, 'each relationshipMaturityStage must produce distinct guidance');
});

test('13. UNKNOWN produces guidance at least as conservative as OBSERVER (EXP-76, TASK_005_SPEC_v1.0.md §17.7 E-2) — this module never upgrades UNKNOWN on its own', async () => {
  var genUnknown = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: genUnknown });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext('UNKNOWN'));
  var genObserver = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: genObserver });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext('OBSERVER'));
  [genUnknown.calls[0].system, genObserver.calls[0].system].forEach((sys) => {
    assert.match(sys, /הסבר יותר/);
    assert.match(sys, /ודא הבנה/);
  });
});

test('14. render() throws EXPRESSION_RENDERER_INVALID_RENDERING_CONTEXT for a missing or malformed Expression Rendering Context — never fabricates a default', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await assert.rejects(() => ExpressionRenderer.render(validTerminalDecision(), null), /EXPRESSION_RENDERER_INVALID_RENDERING_CONTEXT/);
  await assert.rejects(() => ExpressionRenderer.render(validTerminalDecision(), {}), /EXPRESSION_RENDERER_INVALID_RENDERING_CONTEXT/);
  await assert.rejects(() => ExpressionRenderer.render(validTerminalDecision(), { schemaVersion: ExpressionRenderingContext.SCHEMA_VERSION, relationshipMaturityStage: 'NOVICE' }), /EXPRESSION_RENDERER_INVALID_RENDERING_CONTEXT/);
  assert.equal(gen.calls.length, 0); // never attempts a generative call with an invalid context
});

test('15. this module never computes, infers, or estimates a relationshipMaturityStage of its own — it only ever reflects the value it was given', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext('TRUSTED_COACH'));
  assert.match(gen.calls[0].system, /דפוסים מאומתים/); // TRUSTED_COACH's own guidance, and only its own
  assert.doesNotMatch(gen.calls[0].system, /אמון עמוק ומבוסס לאורך זמן/); // not PERSONAL_COACH's guidance
});

test('16. base-case (UNMODIFIED) rendering includes no disclosure acknowledgment — EXP-69 excludes UNMODIFIED, nothing to disclose', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.equal(gen.calls[0].system.indexOf('שיקול הקשור לבטיחות'), -1);
});

// ── WP8 — base-case tied-set rendering (§15, EXP-35) ──

test('17. renders a valid tied-set base decision (RECOMMENDATION, UNMODIFIED, options[]) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('יש לך כמה כיוונים טובים כאן — תבחר את מה שמתאים לך.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validTerminalDecision({ options: validTiedOptions(3) }), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('18. tied-set base rendering preserves every option\'s own content, in the order supplied, with no summarization', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision({ options: validTiedOptions(3) }), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  var i0 = user.indexOf('ACTION_MARK_0'), i1 = user.indexOf('ACTION_MARK_1'), i2 = user.indexOf('ACTION_MARK_2');
  assert.ok(i0 !== -1 && i1 !== -1 && i2 !== -1, 'every option\'s own marker must appear');
  assert.ok(i0 < i1 && i1 < i2, 'options must appear in the order supplied — never reordered');
  assert.match(user, /RATIONALE_MARK_0/);
  assert.match(user, /RATIONALE_MARK_1/);
  assert.match(user, /RATIONALE_MARK_2/);
});

test('19. tied-set base rendering instructs the generative layer to present every option unmutated, in order, without ranking or recommending one over another', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision({ options: validTiedOptions(3) }), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /לפניך כמה אפשרויות שוות-ערך/);
  assert.match(sys, /בלי להשמיט אף אחת מהן/);
  assert.match(sys, /בלי להוסיף אפשרות שלא סופקה לך/);
  assert.match(sys, /בלי לדרג, להעדיף, או להמליץ על אחת מהן על פני האחרות/);
});

test('20. tied-set base rendering includes no disclosure acknowledgment — still UNMODIFIED at the decision level, nothing to disclose', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision({ options: validTiedOptions(3) }), validRenderingContext());
  assert.equal(gen.calls[0].system.indexOf('שיקול הקשור לבטיחות'), -1);
});

test('21. single-option base rendering is unaffected by the WP8 addition — no tied-set presentation line appears', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  assert.equal(gen.calls[0].system.indexOf('לפניך כמה אפשרויות שוות-ערך'), -1);
});

// ── WP5 — REFUSAL rendering (Canonical Decision CD-EXP-02, EXP-58–62) ──

test('22. renders a valid REFUSAL (BOUNDARY/REFUSAL/BLOCKED) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('אני לא יכול למלא את הבקשה הזו, אבל אני כאן להמשיך ללוות אותך.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('23. semanticSignal for a REFUSAL rendering carries kind/boundaryType/safetyDisposition correctly', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di = await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.equal(di.semanticSignal.kind, 'BOUNDARY');
  assert.equal(di.semanticSignal.boundaryType, 'REFUSAL');
  assert.equal(di.semanticSignal.safetyDisposition, 'BLOCKED');
});

test('24. the composed system instruction requires an explicit, unambiguous non-fulfillment statement, never disguised as a recommendation (EXP-58)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /סירוב/);
  assert.match(sys, /אי-אפשר למלא/);
  assert.match(sys, /לעולם אל תציג את התשובה כהמלצה רגילה/);
});

test('25. the composed system instruction attributes the limitation to the situation/principle, never the user (EXP-59)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /ייחס את המגבלה למצב או לעיקרון שבבסיסה בלבד/);
});

test('26. the composed system instruction prohibits blame/shame/failure/wrongdoing language (EXP-60)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /אשמה/);
  assert.match(sys, /בושה/);
  assert.match(sys, /כישלון/);
});

test('27. the composed system instruction takes the no-alternative branch — no canonical field carries a safer alternative today (EXP-61); the absence is never mentioned to the user', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /אין כרגע חלופה בטוחה קונקרטית שסופקה לך/);
  assert.match(sys, /מבלי לציין, לרמוז, או להסב תשומת לב להיעדרה של חלופה/);
});

test('28. the composed system instruction prohibits comparison, measurement, or judgment of the user (EXP-62)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /אל תשווה, תמדוד, או תשפוט את המשתמש/);
});

test('29. REFUSAL rendering also receives relationshipMaturityStage guidance — EXP-76 applies uniformly across rendering paths', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext('TRUSTED_COACH'));
  assert.match(gen.calls[0].system, /דפוסים מאומתים/);
});

test('30. REFUSAL user content never references confidence or hierarchyTier — both are RECOMMENDATION/INITIATIVE-only fields (TASK_006_SPEC_v1.0.md §25.1), correctly absent from a BOUNDARY decision', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  assert.equal(/undefined/.test(user), false);
  assert.equal(/hierarchyTier/.test(user), false);
});

test('31. REFUSAL rendering includes a disclosure acknowledgment (WP7, EXP-69–72) — BLOCKED is one of EXP-69\'s three eligible dispositions, and REFUSAL always co-occurs with BLOCKED', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /שזור בתוך אותה ההודעה עצמה/);
  assert.match(sys, /שיקול הקשור לבטיחות/);
  ['reasonCode', 'safetyDisposition', 'BLOCKED', 'Safety Layer', 'disposition'].forEach((needle) => {
    assert.equal(sys.indexOf(needle), -1, needle + ' must not appear (EXP-71 — no implementation detail named)');
  });
});

// ── WP8 — REFUSAL tied-set rendering (§15: "CD-EXP-02...appl[ies] identically to a tied-set REFUSAL...case") ──

test('32. renders a valid tied-set REFUSAL (BOUNDARY/REFUSAL/BLOCKED, options[]) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validRefusalTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
  assert.equal(di.semanticSignal.boundaryType, 'REFUSAL');
});

test('33. tied-set REFUSAL rendering preserves every option\'s own content, in the order supplied', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  var i0 = user.indexOf('ACTION_MARK_0'), i1 = user.indexOf('ACTION_MARK_1');
  assert.ok(i0 !== -1 && i1 !== -1 && i0 < i1);
});

test('34. tied-set REFUSAL rendering instructs the generative layer to present every option unmutated, without ranking one over another', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.match(gen.calls[0].system, /לפניך כמה אפשרויות שוות-ערך/);
});

test('35. tied-set REFUSAL rendering still includes the disclosure acknowledgment — disposition-level, not affected by options[]', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.match(gen.calls[0].system, /שיקול הקשור לבטיחות/);
});

test('36. single-option REFUSAL rendering is unaffected by the WP8 addition — same EXP-58 cue, no tied-set presentation line', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /אי-אפשר למלא/);
  assert.equal(sys.indexOf('לפניך כמה אפשרויות שוות-ערך'), -1);
});

test('37. a BOUNDARY/REFUSAL TerminalDecision with a non-BLOCKED disposition is out of scope (defense-in-depth; structurally invalid per §25.4 in production anyway)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const malformed = validRefusalTerminalDecision({ safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'RECOMMENDATION' } });
  await assert.rejects(() => ExpressionRenderer.render(malformed, validRenderingContext()), /EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION/);
});

// ── WP6 — ESCALATION rendering (Canonical Decision CD-EXP-03, EXP-63–68) ──

test('38. renders a valid ESCALATION (BOUNDARY/ESCALATION/ESCALATED) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('כדאי לשקול לשוחח עם איש מקצוע על מה שעולה — אני כאן איתך לאורך הדרך.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('39. semanticSignal for an ESCALATION rendering carries kind/boundaryType/safetyDisposition correctly', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di = await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.equal(di.semanticSignal.kind, 'BOUNDARY');
  assert.equal(di.semanticSignal.boundaryType, 'ESCALATION');
  assert.equal(di.semanticSignal.safetyDisposition, 'ESCALATED');
});

test('40. the composed system instruction requires treating the escalation as an already-decided fact, with no independent assessment of whether it is warranted (EXP-63)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /שכבר התקבלה במלואה/);
  assert.match(sys, /אל תעריך בעצמך אם ההפניה מוצדקת/);
});

test('41. the composed system instruction requires calm, clear encouragement toward professional support, without diagnosis or naming a condition (EXP-64)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /עודד בעדינות ובבהירות פנייה לתמיכה מקצועית מתאימה/);
  assert.match(sys, /מבלי לאבחן ומבלי לנקוב בשם מצב או אבחנה ספציפיים/);
});

test('42. the composed system instruction requires a single fixed register, identical to ordinary coaching guidance — never alarm or drama, and never a severity/urgency grading (EXP-65)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /אותו רוגע וטון בדיוק כמו בהדרכה רגילה/);
  assert.match(sys, /לא אזעקה, לא דרמה/);
  assert.match(sys, /לא כל דירוג של דחיפות או חומרה/);
});

test('43. the composed system instruction requires explicit affirmation that coaching continues, never as a replacement (EXP-66)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /ההליווי האימוני נמשך לצד ההפניה — היא לעולם אינה מחליפה אותו/);
});

test('44. the composed system instruction prohibits stating or implying FITME itself contacted, will contact, or replaces a healthcare provider or third party (EXP-67)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /אל תאמר ואל תרמוז ש-FitMe יצרה, תיצור, או כבר יצרה קשר/);
});

test('45. the composed system instruction prohibits softening to the point seriousness could be missed — no false reassurance (EXP-68)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.match(gen.calls[0].system, /אל תרכך את הניסוח עד כדי כך שהרצינות עלולה להתפספס/);
});

test('46. ESCALATION rendering also receives relationshipMaturityStage guidance — EXP-76 applies uniformly across rendering paths', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext('TRUSTED_COACH'));
  assert.match(gen.calls[0].system, /דפוסים מאומתים/);
});

test('47. ESCALATION rendering never reads, references, or introduces any Urgency/severity signal — none exists on TerminalDecision, and none is introduced by this Work Package', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var payload = JSON.stringify(gen.calls[0]).toLowerCase();
  ['urgency', 'severity', 'priority level', 'risklevel'].forEach((needle) => {
    assert.equal(payload.indexOf(needle.toLowerCase()), -1, needle + ' must not appear in the composed payload');
  });
});

test('48. ESCALATION user content never references confidence or hierarchyTier — both are RECOMMENDATION/INITIATIVE-only fields (TASK_006_SPEC_v1.0.md §25.1), correctly absent from a BOUNDARY decision', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  assert.equal(/hierarchyTier/.test(user), false);
});

test('49. ESCALATION rendering includes a disclosure acknowledgment (WP7, EXP-69–72) — ESCALATED is one of EXP-69\'s three eligible dispositions, and ESCALATION always co-occurs with ESCALATED', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /שזור בתוך אותה ההודעה עצמה/);
  assert.match(sys, /שיקול הקשור לבטיחות/);
  ['reasonCode', 'safetyDisposition', 'ESCALATED', 'Safety Layer', 'disposition'].forEach((needle) => {
    assert.equal(sys.indexOf(needle), -1, needle + ' must not appear (EXP-71 — no implementation detail named)');
  });
});

// ── WP8 — ESCALATION tied-set rendering (§15: "...appl[ies] identically to a tied-set...ESCALATION...case") ──

test('50. renders a valid tied-set ESCALATION (BOUNDARY/ESCALATION/ESCALATED, options[]) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validEscalationTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
  assert.equal(di.semanticSignal.boundaryType, 'ESCALATION');
});

test('51. tied-set ESCALATION rendering preserves every option\'s own content, in the order supplied', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  var i0 = user.indexOf('ACTION_MARK_0'), i1 = user.indexOf('ACTION_MARK_1');
  assert.ok(i0 !== -1 && i1 !== -1 && i0 < i1);
});

test('52. tied-set ESCALATION rendering instructs the generative layer to present every option unmutated, without ranking one over another', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.match(gen.calls[0].system, /לפניך כמה אפשרויות שוות-ערך/);
});

test('53. tied-set ESCALATION rendering still includes the disclosure acknowledgment — disposition-level, not affected by options[]', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.match(gen.calls[0].system, /שיקול הקשור לבטיחות/);
});

test('54. single-option ESCALATION rendering is unaffected by the WP8 addition — same EXP-63 cue, no tied-set presentation line', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /שכבר התקבלה במלואה/);
  assert.equal(sys.indexOf('לפניך כמה אפשרויות שוות-ערך'), -1);
});

test('55. a BOUNDARY/ESCALATION TerminalDecision with a non-ESCALATED disposition is out of scope (defense-in-depth; structurally invalid per §25.4 in production anyway)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const malformed = validEscalationTerminalDecision({ safetyDisposition: { disposition: 'UNMODIFIED', originalKind: 'RECOMMENDATION' } });
  await assert.rejects(() => ExpressionRenderer.render(malformed, validRenderingContext()), /EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION/);
});

// ── WP7 — MODIFIED rendering (Canonical Decision CD-EXP-04, EXP-69–72) ──

test('56. renders a valid MODIFIED (RECOMMENDATION/MODIFIED, well-formed modification.modifiedContent) into a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('הנה גרסה מותאמת של ההמלצה, מטעמי בטיחות — ואני כאן איתך.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('57. semanticSignal for a MODIFIED rendering carries kind/safetyDisposition correctly, with no boundaryType (MODIFIED never produces BOUNDARY)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const di = await ExpressionRenderer.render(validModifiedTerminalDecision({ kind: 'INITIATIVE', safetyDisposition: { disposition: 'MODIFIED', originalKind: 'INITIATIVE' } }), validRenderingContext());
  assert.equal(di.semanticSignal.kind, 'INITIATIVE');
  assert.equal(di.semanticSignal.safetyDisposition, 'MODIFIED');
  assert.equal(Object.prototype.hasOwnProperty.call(di.semanticSignal, 'boundaryType'), false);
});

test('58. MODIFIED user content carries modification.modifiedContent\'s own key/value pairs verbatim — never interpreted, renamed, or restructured', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  assert.match(user, /MOD_CONTENT_MARK/);
  assert.match(user, /NOTE_MARK/);
});

test('59. the composed system instruction explicitly forbids changing, adding to, removing from, or "repairing" the modified content\'s own meaning', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /לעולם אל תשנה את משמעותו/);
  assert.match(sys, /אל תוסיף עליו/);
  assert.match(sys, /אל תגרע ממנו/);
  assert.match(sys, /תתקן" אותו בשום צורה/);
});

test('60. MODIFIED rendering includes a disclosure acknowledgment (WP7, EXP-69–72) — MODIFIED is one of EXP-69\'s three eligible dispositions', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  var sys = gen.calls[0].system;
  assert.match(sys, /שזור בתוך אותה ההודעה עצמה/);
  assert.match(sys, /שיקול הקשור לבטיחות/);
  ['reasonCode', 'safetyDisposition', 'MODIFIED', 'Safety Layer', 'disposition'].forEach((needle) => {
    assert.equal(sys.indexOf(needle), -1, needle + ' must not appear (EXP-71 — no implementation detail named)');
  });
});

test('61. MODIFIED rendering also receives relationshipMaturityStage guidance — EXP-76 applies uniformly across rendering paths', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext('TRUSTED_COACH'));
  assert.match(gen.calls[0].system, /דפוסים מאומתים/);
});

// ── WP8 — MODIFIED tied-set rendering: whole-decision level only (`[SLDP RCD-15]`) ──

test('62. a MODIFIED tied-set (both options[] and modification.modifiedContent present) still renders via modifiedContent only, producing a schema-conformant Delivery Intent', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const di = await ExpressionRenderer.render(validModifiedTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di), true);
});

test('63. MODIFIED tied-set rendering never reads options[] — modification applies at the whole-decision level only (`[SLDP RCD-15]`); no per-option content or tied-set instruction ever appears', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  await ExpressionRenderer.render(validModifiedTerminalDecision({ options: validTiedOptions(2) }), validRenderingContext());
  var user = gen.calls[0].messages[0].content;
  var sys = gen.calls[0].system;
  assert.match(user, /MOD_CONTENT_MARK/); // modifiedContent is still the substance
  assert.equal(user.indexOf('ACTION_MARK_0'), -1); // options[] never read
  assert.equal(user.indexOf('ACTION_MARK_1'), -1);
  assert.equal(sys.indexOf('לפניך כמה אפשרויות שוות-ערך'), -1); // no per-option presentation instruction
});

test('64. render() throws for a MODIFIED disposition with a missing/malformed modification.modifiedContent — never fabricates content in its place (D1-DI-02)', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const noModification = validModifiedTerminalDecision({ modification: undefined });
  await assert.rejects(() => ExpressionRenderer.render(noModification, validRenderingContext()), /EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION/);
  const nullContent = validModifiedTerminalDecision({ modification: { modifiedContent: null } });
  await assert.rejects(() => ExpressionRenderer.render(nullContent, validRenderingContext()), /EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION/);
  assert.equal(gen.calls.length, 0);
});

test('65. REFUSAL and ESCALATION rendering are unaffected by the WP7 MODIFIED addition — same schema-conformant output, same EXP-58/EXP-63 cues, as before', async () => {
  var genRefusal = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: genRefusal });
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  const diRefusal = await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(diRefusal), true);
  assert.match(genRefusal.calls[0].system, /אי-אפשר למלא/);

  var genEscalation = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: genEscalation });
  const diEscalation = await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(diEscalation), true);
  assert.match(genEscalation.calls[0].system, /שכבר התקבלה במלואה/);
});

// ── Defensive fallback: a genuinely malformed/unrecognized shape still falls through safely ──
// (After WP4/WP5/WP6/WP7/WP8, every legitimate TerminalDecision shape — single-option and
// tied-set alike — is covered by one of the four rendering paths above; only a structurally
// invalid combination, never producible by the upstream Decision Engine/Safety Layer, still
// reaches this fallback.)

test('66. render() throws for a structurally invalid TerminalDecision shape (kind BOUNDARY with no boundaryType) rather than fabricating content', async () => {
  var gen = fakeGenerateFnReturning('טקסט לדוגמה.');
  ExpressionRenderer.configure({ generateFn: gen });
  const malformed = {
    kind: 'BOUNDARY',
    rationale: { rationale: 'x', evidenceBasis: 'x', expectedValue: 'x', uncertainty: 'x' },
    candidateProvenance: [{ opportunityId: 'opp-1' }],
    decisionPassTrace: { opportunitiesConsidered: [], candidatePoolSize: 1, disqualifiedCandidates: [] },
    safetyDisposition: { disposition: 'BLOCKED', originalKind: 'RECOMMENDATION' },
    immutable: true
  };
  await assert.rejects(() => ExpressionRenderer.render(malformed, validRenderingContext()), /EXPRESSION_RENDERER_UNSUPPORTED_TERMINAL_DECISION/);
  assert.equal(gen.calls.length, 0);
});

// ── Generative-call failure handling: never fabricate fallback content (D1-DI-02) ──

test('67. render() throws EXPRESSION_RENDERER_EMPTY_OUTPUT when the generative layer returns an empty string', async () => {
  var gen = fakeGenerateFnReturning('   ');
  ExpressionRenderer.configure({ generateFn: gen });
  await assert.rejects(() => ExpressionRenderer.render(validTerminalDecision(), validRenderingContext()), /EXPRESSION_RENDERER_EMPTY_OUTPUT/);
});

test('68. render() propagates (does not swallow) a rejection from the injected generateFn', async () => {
  ExpressionRenderer.configure({ generateFn: function () { return Promise.reject(new Error('NETWORK_DOWN')); } });
  await assert.rejects(() => ExpressionRenderer.render(validTerminalDecision(), validRenderingContext()), /NETWORK_DOWN/);
});

// ── Determinism of dispatch outcome (AC-6/EXP-43) — kind-level outcome only, never generated wording ──

test('69. an identical TerminalDecision reaches the same kind-level dispatch outcome on every run (Delivery Intent produced); generated wording itself is not asserted identical', async () => {
  var gen1 = fakeGenerateFnReturning('ניסוח א׳.');
  ExpressionRenderer.configure({ generateFn: gen1 });
  const di1 = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  var gen2 = fakeGenerateFnReturning('ניסוח שונה לגמרי ב׳.');
  ExpressionRenderer.configure({ generateFn: gen2 });
  const di2 = await ExpressionRenderer.render(validTerminalDecision(), validRenderingContext());
  const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di1), true);
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(di2), true);
  assert.equal(di1.semanticSignal.kind, di2.semanticSignal.kind);
  assert.notEqual(di1.renderedLanguage, di2.renderedLanguage); // wording legitimately differs — never asserted identical
});

// ── Expression WP13 (EXPRESSION_IMPLEMENTATION_PLAN.md WP13) — qualitative content-level
// verification (`EXP-OD-11`), retrofitting this suite beyond what WP5/WP6/WP7's own tests above
// verify (the composed SYSTEM INSTRUCTION only). Uses the deterministic checker double
// (tests/fixtures/expressionQualitativeVerificationTestDouble.js) against the actual
// `di.renderedLanguage` a render() call produces, proving these tests would catch a violating
// rendering, not only confirm a hand-picked compliant fixture passes through unexamined. This does
// not, and cannot, verify real production-generated content — see that file's own header for the
// honest scope boundary. ──

const QualitativeChecker = require('./fixtures/expressionQualitativeVerificationTestDouble.js');

test('70. Expression WP13 / EXP-59/EXP-60/EXP-62 — a REFUSAL rendering\'s actual wording is checked, not only eyeballed: a compliant example passes every checker, a violating example is caught', async () => {
  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('אני לא יכול למלא את הבקשה הזו, אבל אני כאן להמשיך ללוות אותך.') });
  const compliant = await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.containsBlameLanguage(compliant.renderedLanguage), false);
  assert.equal(QualitativeChecker.containsComparisonLanguage(compliant.renderedLanguage), false);

  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('נכשלת שוב השבוע, זו הבעיה שלך.') });
  const violating = await ExpressionRenderer.render(validRefusalTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.containsBlameLanguage(violating.renderedLanguage), true);
});

test('71. Expression WP13 / EXP-64/EXP-65/EXP-67 — an ESCALATION rendering\'s actual wording is checked: a compliant example passes every checker, a violating example is caught', async () => {
  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('אני ממשיך ללוות אותך, וחשוב שתפנה גם לתמיכה מקצועית.') });
  const compliant = await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.containsDiagnosisLanguage(compliant.renderedLanguage), false);
  assert.equal(QualitativeChecker.hasAlarmRegister(compliant.renderedLanguage), false);
  assert.equal(QualitativeChecker.impliesThirdPartyContact(compliant.renderedLanguage), false);

  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('זה מצב חירום!!! נראה שיש לך תסמינים של דיכאון קליני, ופנינו לרופא שלך בשמך.') });
  const violating = await ExpressionRenderer.render(validEscalationTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.containsDiagnosisLanguage(violating.renderedLanguage), true);
  assert.equal(QualitativeChecker.hasAlarmRegister(violating.renderedLanguage), true);
  assert.equal(QualitativeChecker.impliesThirdPartyContact(violating.renderedLanguage), true);
});

test('72. Expression WP13 / EXP-71 — a disclosure-bearing (MODIFIED) rendering\'s actual wording is checked for internal-implementation-detail leakage: a compliant example passes, a violating example is caught', async () => {
  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('התאמתי מעט את ההצעה כדי שתתאים לך יותר, בעקבות שיקול בטיחותי.') });
  const compliant = await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.leaksInternalImplementationDetail(compliant.renderedLanguage), false);

  ExpressionRenderer.configure({ generateFn: fakeGenerateFnReturning('ההצעה שונתה כי ה-Safety Layer קבע disposition MODIFIED.') });
  const violating = await ExpressionRenderer.render(validModifiedTerminalDecision(), validRenderingContext());
  assert.equal(QualitativeChecker.leaksInternalImplementationDetail(violating.renderedLanguage), true);
});
