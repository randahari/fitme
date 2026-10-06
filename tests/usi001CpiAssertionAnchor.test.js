// USI-001 — CPI-001 assertion anchor and classifyWithStatus (docs/specs/USI_001_SPEC_v1.0.md §10;
// CPI anchor amendment §04-§08; AC-10, AC-11, AC-12 partial). Synthetic data; callClaude stubbed.
// Run with: node --test tests/usi001CpiAssertionAnchor.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const CPI = require(path.join(__dirname, '../js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js'));
const Gate = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeActivationGate.js'));
const PreferenceIntakeGate = require(path.join(__dirname, '../js/coachDecisionSystem/preferenceIntakeGate.js'));
const SafetyContextInterpreter = require(path.join(__dirname, '../js/coachDecisionSystem/safetyContextInterpreter.js'));

test.afterEach(() => { Gate.__setEnabledForTests__(false); CPI.configure({ callClaude: null, timeoutMs: 8000 }); SafetyContextInterpreter.configure({ callClaude: null }); });

const TURN = { turnId: 'cpi-1', text: 'I enjoy running because it clears my head.' };
const ELIGIBLE_A = { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running', ineligibleReason: null };
function stub(entry) {
  const bodies = [];
  CPI.configure({ callClaude: async (body) => { bodies.push(body); return { content: [{ type: 'text', text: JSON.stringify({ results: [Object.assign({ id: 'cpi-1' }, entry)] }) }] }; } });
  return bodies;
}

test('AC-10: gate on — a literal anchor gives CLASSIFIED with a valid anchor; the request gains exactly the anchor sentence and key', async () => {
  Gate.__setEnabledForTests__(true);
  const bodies = stub(Object.assign({}, ELIGIBLE_A, { assertionAnchorText: ' I enjoy running ' }));
  const r = await CPI.classifyWithStatus(TURN);
  assert.equal(r.status, 'CLASSIFIED');
  assert.deepEqual(r.anchor, { valid: true, text: 'I enjoy running' });
  assert.deepEqual(r.result, { eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running', ineligibleReason: null });
  const p = bodies[0].messages[0].content;
  assert.ok(p.indexOf(CPI._internal.ASSERTION_ANCHOR_INSTRUCTION) !== -1);
  assert.ok(p.indexOf('"ineligibleReason":"<REASON>"|null,"assertionAnchorText":"<verbatim>"|null}]}') !== -1);
  assert.equal(bodies[0].max_tokens, 400);
  assert.equal(bodies.length, 1, 'no added model call');
});

test('AC-10: missing, over-length, non-literal or (class A) target-not-contained anchors give {valid:false}; every CPI outcome is identical in all anchor cases', async () => {
  Gate.__setEnabledForTests__(true);
  SafetyContextInterpreter.configure({ callClaude: async (body) => {
    const ids = (body.messages[0].content.match(/<statement id="([^"]+)"/g) || []).map((m) => m.match(/"([^"]+)"/)[1]);
    return { content: [{ type: 'text', text: JSON.stringify({ results: ids.map((id) => ({ id, restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null })) }) }] };
  } });
  const anchors = [undefined, null, '', 'x'.repeat(201), 'I love swimming', 'it clears my head', 'I enjoy running'];
  const outcomes = [];
  for (const a of anchors) {
    const entry = Object.assign({}, ELIGIBLE_A);
    if (a !== undefined) entry.assertionAnchorText = a;
    stub(entry);
    const r = await CPI.classifyWithStatus(TURN);
    assert.equal(r.status, 'CLASSIFIED');
    assert.equal(r.anchor.valid, a === 'I enjoy running', String(a));
    if (!r.anchor.valid) assert.equal(r.anchor.text, null);
    const auth = await PreferenceIntakeGate.authorize({ interpreterResult: r.result, turn: TURN, pipelineContext: {}, consentGranted: true });
    outcomes.push({ result: r.result, auth });
  }
  outcomes.forEach((o) => assert.deepEqual(o, outcomes[0]));
  assert.equal(outcomes[0].auth.authorized, true);
  assert.equal(JSON.stringify(outcomes[0]).indexOf('I enjoy'), -1, 'the anchor never enters the CPI result or candidate record');
  // closed-token class: containment rule does not apply
  stub({ eligible: true, preferenceClass: 'TRAINING_TIME_PREFERENCE', polarity: 'POSITIVE', target: 'MORNING', ineligibleReason: null, assertionAnchorText: 'I prefer training in the morning' });
  const b = await CPI.classifyWithStatus({ turnId: 'cpi-1', text: 'I prefer training in the morning.' });
  assert.deepEqual(b.anchor, { valid: true, text: 'I prefer training in the morning' });
  // not eligible: anchor always invalid (AA3)
  stub({ eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'NO_EXPLICIT_PREFERENCE', assertionAnchorText: 'I enjoy running' });
  assert.deepEqual((await CPI.classifyWithStatus(TURN)).anchor, { valid: false, text: null });
});

test('AC-11: classifyWithStatus returns FAILED on unconfigured, throw, timeout and malformed output; classify() output is unchanged in every case', async () => {
  for (const gateOn of [false, true]) {
    Gate.__setEnabledForTests__(gateOn);
    const cases = [
      () => CPI.configure({ callClaude: null }),
      () => CPI.configure({ callClaude: () => { throw new Error('boom'); } }),
      () => CPI.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 }),
      () => CPI.configure({ callClaude: async () => ({ content: [{ type: 'text', text: 'prose { not json' }] }) }),
      () => CPI.configure({ callClaude: async () => ({ content: [{ type: 'text', text: JSON.stringify({ results: [{ id: 'cpi-1', eligible: 'maybe' }] }) }] }) })
    ];
    for (const setup of cases) {
      setup();
      const r = await CPI.classifyWithStatus(TURN);
      assert.equal(r.status, 'FAILED');
      assert.deepEqual(r.anchor, { valid: false, text: null });
      assert.deepEqual(r.result, CPI._internal.failedResult());
      assert.deepEqual(await CPI.classify(TURN), CPI._internal.failedResult());
      CPI.configure({ timeoutMs: 8000 });
    }
  }
});

test('AC-11 / AC-2: gate off — classify() and classifyWithStatus() send byte-identical request bodies with no anchor instruction, and classifyWithStatus().result deep-equals classify()', async () => {
  const a = stub(Object.assign({}, ELIGIBLE_A, { assertionAnchorText: 'I enjoy running' }));
  const c1 = await CPI.classify(TURN);
  const c2 = await CPI.classifyWithStatus(TURN);
  assert.deepEqual(a[0], a[1]);
  assert.equal(a[0].messages[0].content.indexOf('assertionAnchorText'), -1);
  assert.deepEqual(c2.result, c1);
  assert.deepEqual(c2.anchor, { valid: false, text: null }, 'gate off: anchor always invalid and unused');
  assert.equal(c2.status, 'CLASSIFIED');
});

test('AC-10: the anchor is validated against the bounded current turn, never recent conversation', async () => {
  Gate.__setEnabledForTests__(true);
  stub(Object.assign({}, ELIGIBLE_A, { assertionAnchorText: 'I enjoy running a lot' }));
  const r = await CPI.classifyWithStatus(TURN, { items: [{ turnId: 'p1', userText: 'I enjoy running a lot', assistantText: '' }] });
  assert.deepEqual(r.anchor, { valid: false, text: null });
});
