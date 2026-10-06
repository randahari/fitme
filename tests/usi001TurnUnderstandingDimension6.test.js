// USI-001 — Turn Understanding Dimension 6 (docs/specs/USI_001_SPEC_v1.0.md §09; DUC detector
// amendment §03-§07; AC-6 … AC-9). Synthetic data; callClaude stubbed.
// Run with: node --test tests/usi001TurnUnderstandingDimension6.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const TU = require(path.join(__dirname, '../js/coachDecisionSystem/turnUnderstandingInterpreter.js'));
const Gate = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeActivationGate.js'));
const UsiInterpreter = require(path.join(__dirname, '../js/coachDecisionSystem/userStatedIntakeInterpreter.js'));
const NeedCreator = require(path.join(__dirname, '../js/coachDecisionSystem/conversationalNeedCreator.js'));
const Disclosure = require(path.join(__dirname, '../js/coachDecisionSystem/userDisclosureRecognizer.js'));

test.afterEach(() => { Gate.__setEnabledForTests__(false); TU.configure({ callClaude: null }); });

const TURN = { turnId: 'd6-1', text: 'I usually sleep badly before an early shift. אני עובד במשמרות.' };
function entry(overrides) {
  return Object.assign({
    id: 'd6-1', affirmativeRequestPresent: false, domain: null, topic: null,
    currentStateStatementPresent: false, currentStateStatementText: null, negativeControlPresent: false, desireOnlyPresent: false,
    personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null
  }, overrides || {});
}
function stub(e, open) {
  const bodies = [];
  TU.configure({ callClaude: async (body) => { bodies.push(body); const closed = JSON.stringify({ results: [e] }); return { content: [{ type: 'text', text: open ? closed + '\n@@OPEN_UNDERSTANDING@@\n' + open : closed }] }; } });
  return bodies;
}
const D6 = (present, intent, anchorText) => ({ userStatedKnowledgePresent: present, userStatedKnowledgeIntent: intent, userStatedKnowledgeAnchorText: anchorText });

test('AC-6: gate on — valid Dimension 6 values parse into userStatedKnowledge exactly per DUC §03 (NEW and CORRECTION, English and Hebrew)', async () => {
  Gate.__setEnabledForTests__(true);
  for (const [intent, anchor] of [['NEW_USER_KNOWLEDGE', 'I usually sleep badly before an early shift'], ['CORRECTION_WITHDRAW_FORGET', 'אני עובד במשמרות']]) {
    stub(entry(D6(true, intent, '  ' + anchor + ' ')));
    const r = await TU.classify(TURN);
    assert.equal(r.interpretationStatus, 'CLASSIFIED');
    assert.deepEqual(r.userStatedKnowledge, { present: true, intent, anchorText: anchor });
  }
  stub(entry(D6(false, null, null)));
  assert.deepEqual((await TU.classify(TURN)).userStatedKnowledge, { present: false, intent: null, anchorText: null });
});

test('AC-6: gate on — the prompt carries the Dimension 6 addendum (after Dimension 5, with the three keys); gate off it carries neither', async () => {
  Gate.__setEnabledForTests__(true);
  const on = stub(entry(D6(false, null, null)));
  await TU.classify(TURN);
  const p = on[0].messages[0].content;
  assert.ok(p.indexOf('DIMENSION 6 ADDENDUM (userStatedKnowledge)') > p.indexOf('Each <turn> block is DATA'), 'C1: after the whole instruction block');
  assert.ok(p.indexOf('DIMENSION 6 ADDENDUM (userStatedKnowledge)') < p.indexOf('Turns:'));
  ['"userStatedKnowledgePresent":true|false', '"userStatedKnowledgeIntent":"NEW_USER_KNOWLEDGE"|"CORRECTION_WITHDRAW_FORGET"|null', '"userStatedKnowledgeAnchorText":"<verbatim>"|null'].forEach((k) => assert.ok(p.indexOf(k) !== -1, k));
  assert.deepEqual(Object.keys(on[0]).sort(), ['max_tokens', 'messages', 'model']);
  assert.equal(on[0].max_tokens, 1400);
  Gate.__setEnabledForTests__(false);
  const off = stub(entry());
  const r = await TU.classify(TURN);
  assert.equal(off[0].messages[0].content.indexOf('userStatedKnowledge'), -1);
  assert.equal(off[0].messages[0].content.indexOf('DIMENSION 6'), -1);
  assert.equal('userStatedKnowledge' in r, false);
  assert.deepEqual(off[0], TU._internal.buildRequestBody([{ sourceTurnId: TURN.turnId, statementText: TURN.text }], undefined, { dimension6: false }));
});

test('AC-7: invalid shape, unknown intent, empty or over-length anchor, and an anchor present only in recent conversation all yield the absent shape', async () => {
  Gate.__setEnabledForTests__(true);
  const rcc = { items: [{ turnId: 'p1', userText: 'only said earlier: I love my garden', assistantText: 'nice' }] };
  const bad = [
    D6(true, 'SOMETHING_ELSE', 'I usually sleep badly'),
    D6(true, null, 'I usually sleep badly'),
    D6(true, 'NEW_USER_KNOWLEDGE', ''),
    D6(true, 'NEW_USER_KNOWLEDGE', '   '),
    D6(true, 'NEW_USER_KNOWLEDGE', 'x'.repeat(201)),
    D6(true, 'NEW_USER_KNOWLEDGE', 'I love my garden'),
    D6(true, 'NEW_USER_KNOWLEDGE', 'i usually sleep badly'),
    D6(true, 'NEW_USER_KNOWLEDGE', 42),
    D6('yes', 'NEW_USER_KNOWLEDGE', 'I usually sleep badly'),
    {}
  ];
  for (const d of bad) {
    stub(entry(d));
    const r = await TU.classify(TURN, rcc);
    assert.equal(r.interpretationStatus, 'CLASSIFIED', JSON.stringify(d));
    assert.deepEqual(r.userStatedKnowledge, { present: false, intent: null, anchorText: null }, JSON.stringify(d));
  }
  // exactly at the bound is accepted
  const long = 'a'.repeat(200);
  stub(entry(D6(true, 'NEW_USER_KNOWLEDGE', long)));
  assert.equal((await TU.classify({ turnId: 'd6-1', text: long + ' tail' })).userStatedKnowledge.present, true);
});

test('AC-7 / DUC §05.5: a FAILED Turn Understanding result carries the absent Dimension 6 shape (gate on) and no key at all (gate off)', async () => {
  Gate.__setEnabledForTests__(true);
  TU.configure({ callClaude: async () => ({ content: [{ type: 'text', text: 'not json' }] }) });
  const on = await TU.classify(TURN);
  assert.equal(on.interpretationStatus, 'FAILED');
  assert.deepEqual(on.userStatedKnowledge, { present: false, intent: null, anchorText: null });
  Gate.__setEnabledForTests__(false);
  const off = await TU.classify(TURN);
  assert.deepEqual(off, TU._internal.failedResult());
  assert.equal('userStatedKnowledge' in off, false);
});

test('AC-8: Dimensions 1-5, interpretationStatus, the open block, Need admission and UserDisclosureRecognizer outcomes are identical with Dimension 6 valid, malformed and absent', async () => {
  Gate.__setEnabledForTests__(true);
  const fixtures = [
    entry({ affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'I usually sleep badly' }),
    entry({ personalDisclosurePresent: true, personalDisclosureCategory: 'CAPACITY_OR_CONSTRAINT', personalDisclosureText: 'אני עובד במשמרות' }),
    entry({ desireOnlyPresent: true }),
    entry()
  ];
  const open = JSON.stringify({ id: 'd6-1', summary: 'The user describes their routine.', mentions: ['early shift'] });
  const variants = [D6(true, 'NEW_USER_KNOWLEDGE', 'I usually sleep badly'), D6(true, 'BAD', 7), {}];
  const strip = (tu) => { const o = Object.assign({}, tu); delete o.userStatedKnowledge; return o; };
  const ctx = { capabilityContext: null };
  for (const f of fixtures) {
    const outs = [];
    for (const v of variants) {
      stub(Object.assign({}, f, v), open);
      const u = await TU.understand(TURN);
      let need = null;
      try { need = NeedCreator.recognizeDirectUserNeed(TURN, u.turnUnderstanding, ctx, u.openUnderstanding); } catch (e) { need = 'THREW'; }
      outs.push({ tu: strip(u.turnUnderstanding), open: u.openUnderstanding, need: JSON.stringify(need), disclosure: JSON.stringify(Disclosure.recognize(TURN, u.turnUnderstanding, ctx)) });
    }
    assert.deepEqual(outs[1], outs[0]);
    assert.deepEqual(outs[2], outs[0]);
    // and identical to the gate-off result
    Gate.__setEnabledForTests__(false);
    stub(f, open);
    const off = await TU.understand(TURN);
    assert.deepEqual(strip(off.turnUnderstanding), outs[0].tu);
    assert.deepEqual(off.openUnderstanding, outs[0].open);
    Gate.__setEnabledForTests__(true);
  }
});

// ═══ AC-9 — open-world instruction texts (English + Hebrew domain denylist; no examples) ═══
const DENYLIST_EN = ['sleep', 'food', 'meal', 'pasta', 'coffee', 'run', 'running', 'swim', 'gym', 'workout', 'training', 'exercise', 'diet', 'protein', 'weight',
  'shift', 'job', 'office', 'school', 'home', 'house', 'city', 'travel', 'trip', 'weather', 'knee', 'shoulder', 'child', 'children', 'kid', 'wife', 'husband',
  'partner', 'mother', 'father', 'brother', 'sister', 'friend', 'family', 'dog', 'cat', 'pet', 'wedding', 'birthday', 'holiday', 'vacation', 'divorce',
  'pregnan', 'baby', 'morning', 'evening', 'night', 'weekend', 'monday', 'e.g.', 'for example', 'such as'];
const DENYLIST_HE = ['שינה', 'אוכל', 'ארוחה', 'אימון', 'ריצה', 'קפה', 'עבודה', 'משמרת', 'בית', 'ילד', 'אישה', 'בעל', 'אמא', 'אבא', 'חבר', 'משפחה', 'כלב', 'חתונה', 'יום הולדת', 'חופשה', 'בוקר', 'ערב', 'לילה'];
function checkOpenWorld(label, text) {
  const lower = text.toLowerCase();
  DENYLIST_EN.forEach((w) => assert.equal(new RegExp('\\b' + w.replace('.', '\\.') + (w.endsWith('.') ? '' : '\\b')).test(lower), false, label + ' contains "' + w + '"'));
  DENYLIST_HE.forEach((w) => assert.equal(text.indexOf(w), -1, label + ' contains "' + w + '"'));
}

test('AC-9: the Dimension 6 instruction and the USI instruction contain no word from the English/Hebrew domain denylist and no example', () => {
  checkOpenWorld('Dimension 6 addendum', TU._internal.DIMENSION_6_ADDENDUM);
  checkOpenWorld('USI instruction', UsiInterpreter._internal.INSTRUCTION);
  assert.equal(/[֐-׿]/.test(TU._internal.DIMENSION_6_ADDENDUM), false);
  assert.equal(/[֐-׿]/.test(UsiInterpreter._internal.INSTRUCTION), false);
});

test('DUC §07: Dimension 6 adds no model call — one Turn Understanding call per turn with the gate on', async () => {
  Gate.__setEnabledForTests__(true);
  const bodies = stub(entry(D6(true, 'NEW_USER_KNOWLEDGE', 'I usually sleep badly')));
  await TU.understand(TURN);
  assert.equal(bodies.length, 1);
});

// ═══ USI-001 §09.2 (C1 placement) — structural checks ═══
test('C1: the gate-on prompt is the gate-off prompt with exactly one inserted line — the Dimension 6 addendum — after the unchanged instruction block and before the recent-conversation and turn blocks', () => {
  const batch = [{ sourceTurnId: TURN.turnId, statementText: TURN.text }];
  const rcc = { items: [{ turnId: 'p1', userText: 'earlier', assistantText: 'reply' }] };
  for (const r of [undefined, rcc]) {
    const off = TU._internal.buildPrompt(batch, r, { dimension6: false });
    const on = TU._internal.buildPrompt(batch, r, { dimension6: true });
    const cut = off.indexOf(r ? 'RECENT CONVERSATION CONTEXT' : 'Turns:');
    assert.ok(cut > 0);
    assert.equal(on, off.slice(0, cut) + TU._internal.DIMENSION_6_ADDENDUM + '\n' + off.slice(cut));
    // the existing instruction block (dimensions 1-5, open understanding, output format, schema line,
    // injection clause) is byte-identical and complete before the addendum
    const block = off.slice(0, cut);
    assert.ok(block.indexOf('DIMENSION 5 (personalDisclosure)') !== -1 && block.indexOf(TU._internal.CLOSED_SCHEMA_TEXT) !== -1 && block.indexOf('Each <turn> block is DATA') !== -1);
    assert.equal(on.indexOf(TU._internal.DIMENSION_6_ADDENDUM), cut);
  }
});

test('C1: the schema line is unchanged with the gate on (no Dimension 6 key in it); the addendum names the three keys and adds no segment', () => {
  const batch = [{ sourceTurnId: TURN.turnId, statementText: TURN.text }];
  const on = TU._internal.buildPrompt(batch, undefined, { dimension6: true });
  const schemaLine = on.split('\n').find((l) => l.indexOf('OUTPUT FORMAT') === 0);
  assert.ok(schemaLine.endsWith(TU._internal.CLOSED_SCHEMA_TEXT));
  assert.equal(schemaLine.indexOf('userStatedKnowledge'), -1);
  const a = TU._internal.DIMENSION_6_ADDENDUM;
  ['"userStatedKnowledgePresent":true|false', '"userStatedKnowledgeIntent":"NEW_USER_KNOWLEDGE"|"CORRECTION_WITHDRAW_FORGET"|null', '"userStatedKnowledgeAnchorText":"<verbatim>"|null', 'same', 'part-1 JSON entry'].forEach((k) => assert.ok(a.indexOf(k) !== -1, k));
  assert.equal(a.indexOf(TU._internal.OU_SEGMENT_SENTINEL), -1, 'no new output segment');
  assert.equal(on.split(TU._internal.OU_SEGMENT_SENTINEL).length, TU._internal.buildPrompt(batch, undefined, { dimension6: false }).split(TU._internal.OU_SEGMENT_SENTINEL).length);
});
