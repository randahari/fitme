// WP0 Phase E.0.2b — Semantic Context Discovery
// (docs/specs/WP0_PHASE_E_0_2B_SEMANTIC_CONTEXT_DISCOVERY_SPEC_v1.0.md §26; GCUK as amended by
// docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Amendment_A1_v1.0.md).
// Deterministic only: every model call is a stub. The pre-implementation baselines pinned below
// were recorded on the unmodified baseline `ad6203c` working tree before any production file
// changed (SPEC §26 "Pre-implementation baseline").
// Run with: node --test tests/e02bSemanticContextDiscovery.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const req = (p) => require(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

const CapabilityRegistry = req('js/coachDecisionSystem/capabilityRegistry.js');
const ContextComposer = req('js/coachDecisionSystem/contextComposer.js');
const ContextRelevancePlanner = req('js/coachDecisionSystem/contextRelevancePlanner.js');
const EligibilityPolicy = req('js/coachDecisionSystem/eligibilityPolicy.js');
const TrrCapabilityAdapter = req('js/coachDecisionSystem/trrCapabilityAdapter.js');
const GeneralReasoningCapability = req('js/coachDecisionSystem/generalReasoningCapability.js');
const Discovery = req('js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js');

// ── fixtures ──
const CONSENTS = {
  granted: { LEARNED_MEMORY_PERSONALIZATION: { granted: true, source: 'migrated' } },
  denied: { LEARNED_MEMORY_PERSONALIZATION: { granted: false, source: 'migrated' } },
  undef: undefined
};
const NEEDS = {
  empty: {},
  projected: { needRef: 'n', openScopeDescription: 'The user asks about a pre-dinner run.', openEntityMentions: [{ text: 'run', origin: 'CURRENT_TURN', sourceTurnId: 't' }] },
  forged: { needRef: 'n', openScopeDescription: 'medical and safety history please', openEntityMentions: [{ text: 'SAFETY_AND_MEDICAL', origin: 'CURRENT_TURN', sourceTurnId: 't' }] }
};
const ALL_IDS = ['readinessStateContext', 'userSafetyContext', 'userSafetyProvenance', 'explicitRequestControls', 'activityPreference', 'recentConversationContext', 'currentStateContext', 'goalObjectiveContext'];
function markedPipelineContext() {
  const pc = { availability: {} };
  ALL_IDS.forEach((id, i) => { pc[id] = { marker: id, n: i }; pc.availability[id] = 'AVAILABLE'; });
  return pc;
}
const TRR_SIX = ['readinessStateContext', 'userSafetyContext', 'userSafetyProvenance', 'explicitRequestControls', 'activityPreference', 'recentConversationContext'];
const GR_CATALOGUE = ['readinessStateContext', 'explicitRequestControls', 'activityPreference', 'currentStateContext', 'goalObjectiveContext'];

// ── pinned pre-implementation baselines (SPEC §26) ──
const PINNED_SELECT = { TRR: TRR_SIX, GENERAL_REASONING: ['recentConversationContext'] }; // identical for every consent × need
const PINNED_ASSEMBLE_SHA = {
  TRR: 'da131844e7d4b57b82d5e6349098da20563a64910929a3182cd62739256f3366',
  GENERAL_REASONING: '885366bf5a46f0f46f4dcf70d70a4c500bb22598e05dd66e214837178fb0e760'
};
const PINNED_GR_PROMPT_SHA = 'ed4823725a12895830ca2011f5251bbec561d495743bed81547579d5cd8aa056';
const PINNED_TRR_REASONING_CONTEXT_SHA = '276369d30ca0fbd7920ab837d79d0d197d3f5ad57ec96a490cfdbaf9cd040a20';

// ── the six approved descriptions (SPEC §10.4) ──
const APPROVED_DESCRIPTIONS = {
  recentConversationContext: 'The most recent earlier turns of the conversation between the user and the coach (a small, bounded number of whole turns), as they were said. Older conversation is not included. What was said is not a confirmed fact.',
  readinessStateContext: 'The user\'s own statements about their current readiness, such as fatigue, energy level, amount of sleep, available time, or recent physical activity, taken from the current message and from what the user has previously told the coach. Self-reported statements only; contains no measured or recorded data.',
  explicitRequestControls: 'Explicit requests by the user that the coach stop proactively raising a specific coaching topic, taken from the current message and from what the user has previously told the coach.',
  activityPreference: 'Physical activities the user has said they like or dislike, each with the user\'s own wording for the activity.',
  currentStateContext: 'Today\'s totals so far as logged by the user with FITME: calories consumed, grams of protein consumed, and calories burned through logged activity. Reflects only what has been logged today.',
  goalObjectiveContext: 'The user\'s selected goal and daily calorie target from their FITME profile.'
};

function freshProduction() {
  CapabilityRegistry.__resetForTests__();
  ContextComposer.__resetForTests__();
  TrrCapabilityAdapter.registerAll();
  GeneralReasoningCapability.registerAll();
}
function authzFor(cap, consent) {
  return (p) => EligibilityPolicy.computeEligibility(p, cap, consent).reasoningAccessAuthorized === true;
}
function modelText(obj) { return { content: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }; }
function stubModel(obj) { return async () => modelText(obj); }
function listJs(dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) out.push(...listJs(rel));
    else if (e.name.endsWith('.js')) out.push(rel);
  }
  return out;
}
function keysDeep(value, out) {
  out = out || new Set();
  if (value && typeof value === 'object') Object.keys(value).forEach((k) => { out.add(k); keysDeep(value[k], out); });
  return out;
}

// Fixture governed source registration helper (fixture-only providers for exclusion/order tests).
function fixtureProvider(id, over) {
  return Object.assign({
    id: id, relevanceTags: ['CURRENT_PHYSICAL_STATE'], sensitivityTier: 'STANDARD', consentScope: null,
    description: 'Fixture information ' + id + '.',
    invoke: () => ({ value: { id: id }, availability: 'AVAILABLE' })
  }, over || {});
}

test.beforeEach(() => { freshProduction(); Discovery.configure({ callClaude: null, timeoutMs: Discovery._internal.TIMEOUT_MS }); });
test.after(() => { Discovery.configure({ callClaude: null }); });

// ═══════════════════ Descriptor (AC-1, AC-2) ═══════════════════
test('AC-1: description validation — absent → null; valid → trimmed; invalid → INVALID_DESCRIPTION, nothing registered; existing validation order unchanged', () => {
  ContextComposer.__resetForTests__();
  assert.equal(ContextComposer.registerFragmentProvider(fixtureProvider('a', { description: undefined })).ok, true);
  assert.equal(ContextComposer.getFragmentProvider('a').description, null);
  const noKey = fixtureProvider('b'); delete noKey.description;
  assert.equal(ContextComposer.registerFragmentProvider(noKey).ok, true);
  assert.equal(ContextComposer.getFragmentProvider('b').description, null);
  assert.equal(ContextComposer.registerFragmentProvider(fixtureProvider('c', { description: '  Padded text.  ' })).ok, true);
  assert.equal(ContextComposer.getFragmentProvider('c').description, 'Padded text.');
  const bad = [null, 7, '', '   ', 'x'.repeat(ContextComposer.DESCRIPTION_MAX_CHARS + 1), ['a']];
  bad.forEach((d, i) => {
    const r = ContextComposer.registerFragmentProvider(fixtureProvider('bad' + i, { description: d }));
    assert.equal(r.ok, false, JSON.stringify(d));
    assert.equal(r.error.code, 'INVALID_DESCRIPTION');
    assert.equal(ContextComposer.getFragmentProvider('bad' + i), null);
  });
  assert.equal(ContextComposer.registerFragmentProvider(fixtureProvider('max', { description: 'y'.repeat(ContextComposer.DESCRIPTION_MAX_CHARS) })).ok, true);
  // earlier checks still win (order unchanged): an invalid tier is reported before the description
  const r = ContextComposer.registerFragmentProvider(fixtureProvider('order', { sensitivityTier: 'NOPE', description: '' }));
  assert.equal(r.error.code, 'INVALID_SENSITIVITY_TIER');
});

test('AC-2: the six approved descriptions are registered verbatim; both Safety providers have none; no description names another provider, a governance token, or relevance wording', () => {
  Object.entries(APPROVED_DESCRIPTIONS).forEach(([id, text]) => assert.equal(ContextComposer.getFragmentProvider(id).description, text, id));
  assert.equal(ContextComposer.getFragmentProvider('userSafetyContext').description, null);
  assert.equal(ContextComposer.getFragmentProvider('userSafetyProvenance').description, null);
  const tokens = ALL_IDS.concat(ContextComposer.CONTEXT_RELEVANCE_KINDS, CapabilityRegistry.NEED_SHAPES);
  Object.values(APPROVED_DESCRIPTIONS).forEach((d) => {
    tokens.forEach((t) => assert.equal(d.indexOf(t), -1, 'description contains ' + t));
    ['relevant', 'useful when', 'if the user'].forEach((w) => assert.equal(d.toLowerCase().indexOf(w), -1, 'description contains "' + w + '"'));
  });
});

// ═══════════════════ Catalogue (AC-3 … AC-6) ═══════════════════
test('AC-3: GENERAL_REASONING catalogue is exactly the 5 authorized, described, non-Safety, non-baseline providers in ceiling order for every consent state; TRR catalogue is empty', () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  const trr = CapabilityRegistry.getById('TRR');
  for (const consent of Object.values(CONSENTS)) {
    const cat = ContextComposer.buildDiscoveryCatalogue(gr, authzFor(gr, consent));
    assert.deepEqual(cat.map((e) => e.id), GR_CATALOGUE);
    assert.ok(Object.isFrozen(cat));
    cat.forEach((e) => {
      assert.deepEqual(Object.keys(e).sort(), ['description', 'id', 'relevanceTags']);
      assert.ok(Object.isFrozen(e));
      assert.equal(e.description, APPROVED_DESCRIPTIONS[e.id]);
    });
    assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(trr, authzFor(trr, consent)), []);
  }
});

test('AC-4: each catalogue exclusion rule holds independently', () => {
  ContextComposer.__resetForTests__();
  const reg = (id, over) => assert.equal(ContextComposer.registerFragmentProvider(fixtureProvider(id, over)).ok, true, id);
  reg('ok1'); reg('base'); reg('req'); reg('outside'); reg('denied');
  reg('tierOnly', { sensitivityTier: 'SAFETY_ADJACENT', relevanceTags: ['CURRENT_PHYSICAL_STATE'] });
  reg('tagOnly', { sensitivityTier: 'STANDARD', relevanceTags: ['SAFETY_AND_MEDICAL'] });
  reg('undescribed', { description: undefined });
  const cap = { contextCeiling: ['ok1', 'base', 'req', 'unregistered', 'denied', 'tierOnly', 'tagOnly', 'undescribed', 'ok1'], contextBaseline: ['base'], requiredContext: ['req'] };
  const allow = (p) => p.id !== 'denied';
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(cap, allow).map((e) => e.id), ['ok1']);
  // non-true predicate results and a missing predicate exclude everything
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(cap, () => 'true'), []);
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(cap, () => 1), []);
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(cap), []);
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(cap, 'yes'), []);
  // 'outside' is registered and described but not in the eligible universe
  assert.equal(ContextComposer.buildDiscoveryCatalogue(cap, allow).some((e) => e.id === 'outside'), false);
  // never throws on garbage
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(null, allow), []);
});

test('AC-5: selection precedes invocation — the catalogue builder and discover() never invoke a provider; discovery resolves before the first optional invoke; only select() output is invoked', async () => {
  ContextComposer.__resetForTests__();
  const events = [];
  const mk = (id, over) => fixtureProvider(id, Object.assign({ invoke: async () => { events.push('invoke:' + id); return { value: id, availability: 'AVAILABLE' }; } }, over || {}));
  ['base', 'a', 'b', 'c'].forEach((id) => ContextComposer.registerFragmentProvider(mk(id)));
  const cap = { contextCeiling: ['base', 'a', 'b', 'c'], contextBaseline: ['base'], requiredContext: [] };
  const allow = () => true;
  ContextComposer.buildDiscoveryCatalogue(cap, allow);
  assert.deepEqual(events, []);
  const discover = async ({ catalogue }) => {
    events.push('discover:start');
    await new Promise((r) => setTimeout(r, 5));
    events.push('discover:done');
    return { status: 'COMPLETED', selectedIds: [catalogue[1].id], informationNeeds: [] };
  };
  const out = await ContextComposer.assemble(NEEDS.projected, cap, {}, allow, discover);
  assert.deepEqual(events.slice(0, 2), ['discover:start', 'discover:done']);
  assert.deepEqual(events.slice(2).sort(), ['invoke:b', 'invoke:base']);
  assert.deepEqual(Object.keys(out.context).sort(), ['b', 'base']);
});

test('AC-6: discover() receives only {need:{openScopeDescription, openEntityMentions}, catalogue} — no consent, predicate, governance field, provider data, invoke or pipelineContext', async () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  let captured = null;
  const discover = async (arg) => { captured = arg; return { status: 'COMPLETED', selectedIds: [], informationNeeds: [] }; };
  await ContextComposer.assemble(NEEDS.projected, gr, markedPipelineContext(), authzFor(gr, CONSENTS.granted), discover);
  assert.deepEqual(Object.keys(captured).sort(), ['catalogue', 'need']);
  assert.deepEqual(Object.keys(captured.need).sort(), ['openEntityMentions', 'openScopeDescription']);
  const keys = keysDeep(captured);
  ['consentState', 'LEARNED_MEMORY_PERSONALIZATION', 'sensitivityTier', 'consentScope', 'invoke', 'value', 'availability', 'marker',
    'needRef', 'capabilityRiskTier', 'sensitiveContextAccessPolicy', 'contextCeiling'].forEach((k) => assert.equal(keys.has(k), false, k));
  const serialized = JSON.stringify(captured);
  ALL_IDS.forEach((id) => assert.equal(serialized.indexOf('"marker":"' + id + '"'), -1));
  (function noFunctions(v) { if (v && typeof v === 'object') Object.values(v).forEach(noFunctions); else assert.notEqual(typeof v, 'function'); })(captured);
});

// ═══════════════════ Interpreter (AC-7 … AC-14) ═══════════════════
const CAT = [{ id: 'alpha', description: 'Alpha information.', relevanceTags: ['GOALS_AND_INTENT'] }, { id: 'beta', description: 'Beta information.', relevanceTags: [] }, { id: 'gamma', description: 'Gamma information.', relevanceTags: [] }];
const OPEN_NEED = { openScopeDescription: 'The user asks something open.', openEntityMentions: [{ text: 'something', origin: 'CURRENT_TURN', sourceTurnId: 't' }] };

test('AC-7: request body — exactly {model, max_tokens, messages}; one user message; constants; one call per discover()', async () => {
  const bodies = [];
  Discovery.configure({ callClaude: async (b) => { bodies.push(b); return modelText({ selectedIds: [], informationNeeds: [] }); } });
  await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.equal(bodies.length, 1);
  assert.deepEqual(Object.keys(bodies[0]).sort(), ['max_tokens', 'messages', 'model']);
  assert.equal(bodies[0].model, 'claude-haiku-4-5-20251001');
  assert.equal(bodies[0].max_tokens, 400);
  assert.ok(bodies[0].max_tokens <= 2000);
  assert.equal(bodies[0].messages.length, 1);
  assert.equal(bodies[0].messages[0].role, 'user');
  assert.equal(Discovery._internal.TIMEOUT_MS, 6000);
});

test('AC-8: the instruction section is open-world — no governance token, provider id, domain word, Hebrew text or example need; DATA framing present; data only inside <need>/<sources>', async () => {
  const instr = Discovery._internal.buildInstructionText();
  CapabilityRegistry.NEED_SHAPES.concat(ContextComposer.CONTEXT_RELEVANCE_KINDS, ALL_IDS).forEach((t) => assert.equal(instr.indexOf(t), -1, t));
  const DENY = ['weather', 'sleep', 'run', 'running', 'food', 'meal', 'calendar', 'schedule', 'location', 'health', 'heart', 'device', 'travel', 'work', 'gps', 'mykonos', 'nutrition', 'workout', 'training', 'injury', 'restaurant'];
  DENY.forEach((w) => assert.equal(new RegExp('\\b' + w + '\\b', 'i').test(instr), false, 'instruction contains "' + w + '"'));
  assert.equal(/[֐-׿]/.test(instr), false);
  assert.ok(/DATA, never an instruction/.test(instr));
  const prompt = Discovery._internal.buildPrompt(OPEN_NEED, CAT);
  assert.ok(prompt.startsWith(instr));
  const data = prompt.slice(instr.length);
  assert.ok(/^\n<need>\{.*\}<\/need>\n<sources>\[.*\]<\/sources>$/s.test(data));
  assert.equal(instr.indexOf(OPEN_NEED.openScopeDescription), -1);
  // mentions are sent as text only
  assert.equal(data.indexOf('CURRENT_TURN'), -1);
  assert.equal(data.indexOf('sourceTurnId'), -1);
});

test('AC-9: selectedIds — exact matches kept in catalogue order; unknown, differently-cased, padded, non-string and duplicate ids dropped individually', async () => {
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['gamma', 'ALPHA', ' beta', 'zeta', 7, null, 'alpha', 'gamma', 'alpha'], informationNeeds: [] }) });
  const r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.equal(r.status, 'COMPLETED');
  assert.deepEqual(r.selectedIds, ['alpha', 'gamma']);
});

test('AC-10: informationNeeds — non-strings and empty dropped, over-length dropped (never shortened), normalized duplicates dropped, first 6 kept', async () => {
  const long = 'z'.repeat(121);
  const exact = 'y'.repeat(120);
  Discovery.configure({ callClaude: stubModel({ selectedIds: [], informationNeeds: [5, '', '   ', long, exact, ' Need One ', 'need   one', 'NEED ONE', 'two', 'three', 'four', 'five', 'six', 'seven'] }) });
  const r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.deepEqual(r.informationNeeds, [exact, 'Need One', 'two', 'three', 'four', 'five']);
  assert.ok(r.informationNeeds.every((n) => n.length <= 120));
});

test('AC-11: the two outputs are validated independently', async () => {
  Discovery.configure({ callClaude: stubModel({ selectedIds: 'alpha', informationNeeds: ['kept'] }) });
  let r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.deepEqual([r.status, r.selectedIds, r.informationNeeds], ['COMPLETED', [], ['kept']]);
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['beta'] }) });
  r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.deepEqual([r.status, r.selectedIds, r.informationNeeds], ['COMPLETED', ['beta'], []]);
});

test('AC-12: failure matrix — every failure yields FAILED with empty outputs; fenced JSON accepted; discover() never rejects', async () => {
  const cases = [
    ['unconfigured', null],
    ['sync throw', () => { throw new Error('x'); }],
    ['reject', async () => { throw new Error('x'); }],
    ['max_tokens', async () => Object.assign(modelText({ selectedIds: ['alpha'], informationNeeds: ['n'] }), { stop_reason: 'max_tokens' })],
    ['not JSON', async () => modelText('not json at all')],
    ['prose-wrapped', async () => modelText('Here you go: {"selectedIds":["alpha"],"informationNeeds":[]}')],
    ['array', async () => modelText('[]')],
    ['null', async () => modelText('null')],
    ['number', async () => modelText('42')],
    ['empty response', async () => ({})],
    ['undefined response', async () => undefined]
  ];
  for (const [name, fn] of cases) {
    Discovery.configure({ callClaude: fn, timeoutMs: 6000 });
    const r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
    assert.deepEqual([r.status, r.selectedIds, r.informationNeeds], ['FAILED', [], []], name);
  }
  Discovery.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  let r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.deepEqual([r.status, r.selectedIds], ['FAILED', []], 'timeout');
  Discovery.configure({ callClaude: async () => modelText('```json\n{"selectedIds":["beta"],"informationNeeds":["n"]}\n```'), timeoutMs: 6000 });
  r = await Discovery.discover({ need: OPEN_NEED, catalogue: CAT });
  assert.deepEqual([r.status, r.selectedIds, r.informationNeeds], ['COMPLETED', ['beta'], ['n']], 'fenced JSON (MRE-001)');
  // hostile inputs never reject
  for (const input of [undefined, null, 5, { need: OPEN_NEED, catalogue: 'x' }, { need: OPEN_NEED, catalogue: [null, 3] }]) {
    const out = await Discovery.discover(input);
    assert.ok(['SKIPPED', 'FAILED', 'COMPLETED'].includes(out.status));
  }
});

test('AC-13: a Need without open semantic fields is SKIPPED with zero calls', async () => {
  let calls = 0;
  Discovery.configure({ callClaude: async () => { calls++; return modelText({ selectedIds: ['alpha'], informationNeeds: ['n'] }); } });
  for (const need of [{}, { openScopeDescription: '' }, { openScopeDescription: '   ' }, { openScopeDescription: 5 }, null]) {
    const r = await Discovery.discover({ need: need, catalogue: CAT });
    assert.deepEqual([r.status, r.selectedIds, r.informationNeeds], ['SKIPPED', [], []]);
  }
  assert.equal(calls, 0);
});

test('AC-14: DiscoveryResult is frozen with exactly four keys and DERIVED_INTERPRETATION authority', async () => {
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['alpha'], informationNeeds: ['n'] }) });
  for (const r of [await Discovery.discover({ need: OPEN_NEED, catalogue: CAT }), await Discovery.discover({ need: {}, catalogue: CAT })]) {
    assert.deepEqual(Object.keys(r).sort(), ['informationNeeds', 'interpretationAuthority', 'selectedIds', 'status']);
    assert.ok(Object.isFrozen(r) && Object.isFrozen(r.selectedIds) && Object.isFrozen(r.informationNeeds));
    assert.equal(r.interpretationAuthority, 'DERIVED_INTERPRETATION');
  }
});

// ═══════════════════ Planner and composer (AC-15 … AC-20) ═══════════════════
test('AC-15: select() without a fifth argument equals the pinned pre-implementation output for the whole matrix; still synchronous', () => {
  for (const capId of ['TRR', 'GENERAL_REASONING']) {
    const cap = CapabilityRegistry.getById(capId);
    for (const consent of Object.values(CONSENTS)) {
      for (const need of Object.values(NEEDS)) {
        const out = ContextRelevancePlanner.select(need, cap, ContextComposer.getFragmentProvider, authzFor(cap, consent));
        assert.ok(Array.isArray(out) && !(out instanceof Promise));
        assert.deepEqual(out, PINNED_SELECT[capId]);
        assert.deepEqual(ContextRelevancePlanner.select(need, cap, ContextComposer.getFragmentProvider, authzFor(cap, consent), 'not-an-array'), PINNED_SELECT[capId]);
      }
    }
  }
});

test('AC-16: discoveredIds are only a union member — outside-ceiling, unregistered and unauthorized ids are removed; Safety providers never survive for GENERAL_REASONING', () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  for (const consent of Object.values(CONSENTS)) {
    const a = authzFor(gr, consent);
    const out = ContextRelevancePlanner.select({}, gr, ContextComposer.getFragmentProvider, a,
      ['userSafetyContext', 'userSafetyProvenance', 'notRegistered', 'goalObjectiveContext', '', 7]);
    assert.deepEqual(out.sort(), ['goalObjectiveContext', 'recentConversationContext']);
  }
  ContextComposer.__resetForTests__();
  ContextComposer.registerFragmentProvider(fixtureProvider('inCeil'));
  ContextComposer.registerFragmentProvider(fixtureProvider('offCeil'));
  const cap = { contextCeiling: ['inCeil'] };
  assert.deepEqual(ContextRelevancePlanner.select({}, cap, ContextComposer.getFragmentProvider, () => true, ['offCeil', 'inCeil']), ['inCeil']);
  assert.deepEqual(ContextRelevancePlanner.select({}, cap, ContextComposer.getFragmentProvider, () => false, ['inCeil']), []);
});

test('AC-17: assemble() with four arguments equals the pinned pre-implementation results and carries no discovery key', async () => {
  for (const capId of ['TRR', 'GENERAL_REASONING']) {
    const cap = CapabilityRegistry.getById(capId);
    for (const consent of Object.values(CONSENTS)) {
      const out = await ContextComposer.assemble({}, cap, markedPipelineContext(), authzFor(cap, consent));
      assert.equal(sha(JSON.stringify(out)), PINNED_ASSEMBLE_SHA[capId], capId);
      assert.equal('discovery' in out, false);
    }
  }
});

test('AC-18: assemble() with discover — called once iff open Need; receives the builder catalogue; foreign/unauthorized/Safety ids never reach context; throw/reject → FAILED and the no-discovery context; frozen discovery object', async () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  const a = authzFor(gr, CONSENTS.granted);
  const pc = markedPipelineContext();
  const baselineCtx = (await ContextComposer.assemble({}, gr, pc, a)).context;
  let calls = 0; let seenCatalogue = null;
  const hostile = async ({ catalogue }) => { calls++; seenCatalogue = catalogue; return { status: 'COMPLETED', selectedIds: ['userSafetyContext', 'userSafetyProvenance', 'notRegistered', 'goalObjectiveContext'], informationNeeds: ['n'] }; };
  const skipped = await ContextComposer.assemble({}, gr, pc, a, hostile);
  assert.equal(calls, 0);
  assert.equal(skipped.discovery.status, 'SKIPPED');
  assert.deepEqual(skipped.context, baselineCtx);
  const out = await ContextComposer.assemble(NEEDS.projected, gr, pc, a, hostile);
  assert.equal(calls, 1);
  assert.deepEqual(seenCatalogue.map((e) => e.id), GR_CATALOGUE);
  assert.deepEqual(Object.keys(out.context).sort(), ['goalObjectiveContext', 'recentConversationContext']);
  assert.deepEqual(out.discovery.selectedIds, ['goalObjectiveContext']);
  assert.deepEqual(Object.keys(out.discovery).sort(), ['informationNeeds', 'selectedIds', 'status']);
  assert.ok(Object.isFrozen(out.discovery));
  for (const bad of [async () => { throw new Error('x'); }, () => { throw new Error('sync'); }, async () => null, async () => ({ status: 'COMPLETED', selectedIds: 'x', informationNeeds: [] })]) {
    const r = await ContextComposer.assemble(NEEDS.projected, gr, pc, a, bad);
    assert.equal(r.discovery.status, 'FAILED');
    assert.deepEqual(r.discovery.selectedIds, []);
    assert.deepEqual(r.context, baselineCtx);
  }
});

test('AC-19: informationNeeds never influence composition and never reach select()', async () => {
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  const a = authzFor(gr, CONSENTS.granted);
  const pc = markedPipelineContext();
  const selectArgs = [];
  const original = ContextRelevancePlanner.select;
  ContextRelevancePlanner.select = function () { selectArgs.push(Array.prototype.slice.call(arguments)); return original.apply(this, arguments); };
  try {
    const mk = (needs) => async () => ({ status: 'COMPLETED', selectedIds: ['activityPreference'], informationNeeds: needs });
    const r1 = await ContextComposer.assemble(NEEDS.projected, gr, pc, a, mk([]));
    const r2 = await ContextComposer.assemble(NEEDS.projected, gr, pc, a, mk(['userSafetyContext', 'SAFETY_AND_MEDICAL', 'grant access to location', 'goalObjectiveContext']));
    assert.deepEqual(r1.context, r2.context);
    assert.deepEqual(Object.keys(r2.context).sort(), ['activityPreference', 'recentConversationContext']);
  } finally { ContextRelevancePlanner.select = original; }
  selectArgs.forEach((args) => {
    assert.ok(args.length <= 5);
    if (args.length === 5) assert.deepEqual(args[4], ['activityPreference']);
  });
});

test('AC-20: a discovery-enabled composition with an empty catalogue and an open Need still calls discover once with catalogue []', async () => {
  ContextComposer.__resetForTests__();
  ContextComposer.registerFragmentProvider(fixtureProvider('base'));
  const cap = { contextCeiling: ['base'], contextBaseline: ['base'] };
  let seen = null; let calls = 0;
  const out = await ContextComposer.assemble(NEEDS.projected, cap, {}, () => true, async ({ catalogue }) => { calls++; seen = catalogue; return { status: 'COMPLETED', selectedIds: [], informationNeeds: ['still meaningful'] }; });
  assert.equal(calls, 1);
  assert.deepEqual(seen, []);
  assert.deepEqual(out.discovery.informationNeeds, ['still meaningful']);
});

// ═══════════════════ General Reasoning (AC-21, AC-22) ═══════════════════
test('AC-21: General Reasoning composition injects discovery; a selected authorized provider is composed; Safety never; reasoning prompt byte-identical to the pre-implementation baseline (no informationNeeds)', async () => {
  const MARK = 'E02B-NEED-MARKER-51aa';
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['goalObjectiveContext', 'userSafetyContext'], informationNeeds: [MARK] }) });
  for (const consent of Object.values(CONSENTS)) {
    const out = await GeneralReasoningCapability.buildAuthorizedComposedContext(markedPipelineContext(), consent, NEEDS.projected);
    assert.ok('goalObjectiveContext' in out.context);
    assert.equal('userSafetyContext' in out.context, false);
    assert.equal('userSafetyProvenance' in out.context, false);
    assert.deepEqual(out.discovery.informationNeeds, [MARK]);
  }
  assert.equal(sha(GeneralReasoningCapability._internal.buildPrompt(NEEDS.projected, { a: 1 })), PINNED_GR_PROMPT_SHA);
  const prompts = [];
  GeneralReasoningCapability.configure({ callClaude: async (b) => { prompts.push(b.messages[0].content); return modelText({}); } });
  try {
    const composed = await GeneralReasoningCapability.buildAuthorizedComposedContext(markedPipelineContext(), CONSENTS.granted, NEEDS.projected);
    await GeneralReasoningCapability.reason(NEEDS.projected, composed.context);
  } finally { GeneralReasoningCapability.configure({ callClaude: null }); }
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].indexOf(MARK), -1, 'informationNeeds must not reach the reasoning prompt');
});

test('AC-22: General Reasoning stays non-live — the orchestrator references neither discovery nor the GR composition path; only generalReasoningCapability.js and js/app.js reference the interpreter', () => {
  const orch = read('js/coachDecisionSystem/internalPipelineOrchestrator.js');
  assert.equal(orch.indexOf('SemanticContextDiscoveryInterpreter'), -1);
  assert.equal(orch.indexOf('buildAuthorizedComposedContext'), -1);
  assert.equal(orch.indexOf('GeneralReasoningCapability'), -1);
  const refs = listJs('js').filter((f) => f !== 'js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js' && codeOnly(read(f)).indexOf('SemanticContextDiscoveryInterpreter') !== -1);
  assert.deepEqual(refs.sort(), ['js/app.js', 'js/coachDecisionSystem/generalReasoningCapability.js']);
  const callers = listJs('js').filter((f) => f !== 'js/coachDecisionSystem/generalReasoningCapability.js' && codeOnly(read(f)).indexOf('buildAuthorizedComposedContext') !== -1); // code only: explanatory comments may name it
  assert.deepEqual(callers, []);
  assert.equal(req('js/coachDecisionSystem/generalReasoningActivationGate.js').isLiveFallbackApproved(), false);
});

// ═══════════════════ Authority isolation (AC-24) ═══════════════════
test('AC-24: static isolation — informationNeeds, the interpreter and the catalogue builder are referenced nowhere they could gain authority, persist, or reach Safety/Expression', () => {
  const guarded = [
    'js/coachDecisionSystem/memoryLayer.js', 'js/coachDecisionSystem/internalPipelineOrchestrator.js', 'js/memory.js',
    'js/persistenceGateway.js', 'js/errorTelemetry.js', 'js/coachDecisionSystem/decisionFormation.js',
    'js/coachDecisionSystem/safetyLayer.js', 'js/coachDecisionSystem/safetyContextInterpreter.js', 'js/coachDecisionSystem/userSafetyProvenanceInterpreter.js',
    'js/coachDecisionSystem/riskCharacteristicInterpreter.js', 'js/coachDecisionSystem/riskCharacteristicValidator.js', 'js/coachDecisionSystem/safetyIntegrationPort.js',
    'js/coachDecisionSystem/safetyDisclosureIntakeGate.js', 'js/coachDecisionSystem/riskCharacteristicIntakeGate.js', 'js/coachDecisionSystem/preferenceIntakeGate.js',
    'js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js', 'js/coachDecisionSystem/eligibilityPolicy.js', 'js/coachDecisionSystem/capabilityRegistry.js',
    'js/coachDecisionSystem/trrCapabilityAdapter.js'
  ].concat(listJs('js/repositories'), listJs('js/coachDecisionSystem').filter((f) => /expression/i.test(f)));
  guarded.forEach((f) => {
    const src = read(f);
    ['informationNeeds', 'SemanticContextDiscoveryInterpreter', 'buildDiscoveryCatalogue'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' references ' + t));
  });
  const app = read('js/app.js');
  assert.equal(app.indexOf('informationNeeds'), -1);
  assert.equal(app.indexOf('buildDiscoveryCatalogue'), -1);
  assert.equal(codeOnly(app).split('SemanticContextDiscoveryInterpreter').length - 1, 1, 'js/app.js references the interpreter only in its configure() call');
  // the planner never sees informationNeeds
  assert.equal(codeOnly(read('js/coachDecisionSystem/contextRelevancePlanner.js')).indexOf('informationNeeds'), -1);
});

// ═══════════════════ Open world (AC-27, AC-28) ═══════════════════
test('AC-27: Mykonos — open information needs survive, only catalogue-selected authorized providers are composed, unmet needs create no access; no Mykonos rule anywhere', async () => {
  const MYK_NEED = {
    needRef: 'duc:direct-user-request:t-myk',
    openScopeDescription: 'The user is in Mykonos, slept five hours, and is thinking about going for a run before dinner.',
    openEntityMentions: [{ text: 'Mykonos', origin: 'CURRENT_TURN', sourceTurnId: 't-myk' }, { text: 'slept five hours', origin: 'CURRENT_TURN', sourceTurnId: 't-myk' }, { text: 'a run before dinner', origin: 'CURRENT_TURN', sourceTurnId: 't-myk' }]
  };
  const NEEDS_OUT = ['recent recovery and sleep quality', 'recent training load', 'current local weather and heat', 'time available before dinner', 'the user\'s fitness goals'];
  const bodies = [];
  Discovery.configure({ callClaude: async (b) => { bodies.push(b); return modelText({ selectedIds: ['readinessStateContext', 'activityPreference', 'goalObjectiveContext'], informationNeeds: NEEDS_OUT }); } });
  const invoked = [];
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  const catalogueBefore = JSON.stringify(ContextComposer.buildDiscoveryCatalogue(gr, authzFor(gr, CONSENTS.granted)));
  const idsBefore = ContextComposer.getAllFragmentProviderIds().slice().sort();
  const pc = markedPipelineContext();
  ALL_IDS.forEach((id) => { const p = ContextComposer.getFragmentProvider(id); const orig = p.invoke; p.invoke = function (x) { invoked.push(id); return orig.call(this, x); }; });
  const out = await GeneralReasoningCapability.buildAuthorizedComposedContext(pc, CONSENTS.granted, MYK_NEED);
  assert.equal(bodies.length, 1);
  assert.deepEqual(out.discovery.informationNeeds, NEEDS_OUT);
  assert.deepEqual(Object.keys(out.context).sort(), ['activityPreference', 'goalObjectiveContext', 'readinessStateContext', 'recentConversationContext']);
  assert.deepEqual(invoked.sort(), ['activityPreference', 'goalObjectiveContext', 'readinessStateContext', 'recentConversationContext']);
  assert.deepEqual(ContextComposer.getAllFragmentProviderIds().slice().sort(), idsBefore, 'an unmet need registered nothing');
  assert.equal(JSON.stringify(ContextComposer.buildDiscoveryCatalogue(gr, authzFor(gr, CONSENTS.granted))), catalogueBefore, 'an unmet need changed nothing');
  ['Mykonos', 'מיקונוס', 'mykonos'].forEach((s) => listJs('js').forEach((f) => assert.equal(read(f).indexOf(s), -1, f + ' contains ' + s)));
});

test('AC-28: unfamiliar food, sport, place and relationship run the identical, catalogue-bounded path (strings verified absent from js/)', async () => {
  const turns = ['Is ackee with saltfish okay the night before?', 'How should I warm up for sepak takraw?', 'I will be in Tórshavn next week, what should I adjust?', 'My stepdaughter\'s christening is Sunday, how do I plan around it?'];
  const probes = ['ackee', 'sepak takraw', 'Tórshavn', 'christening'];
  probes.forEach((s) => listJs('js').forEach((f) => assert.equal(read(f).toLowerCase().indexOf(s.toLowerCase()), -1, f + ' contains ' + s)));
  const gr = CapabilityRegistry.getById('GENERAL_REASONING');
  for (let i = 0; i < turns.length; i++) {
    let seen = null;
    Discovery.configure({ callClaude: async (b) => { seen = b.messages[0].content; return modelText({ selectedIds: GR_CATALOGUE.concat(['userSafetyContext', 'invented']), informationNeeds: ['anything open'] }); } });
    const need = { openScopeDescription: turns[i], openEntityMentions: [{ text: probes[i], origin: 'CURRENT_TURN', sourceTurnId: 't' + i }] };
    const out = await GeneralReasoningCapability.buildAuthorizedComposedContext(markedPipelineContext(), CONSENTS.granted, need);
    assert.ok(seen.indexOf(turns[i]) > 0);
    assert.deepEqual(Object.keys(out.context).sort(), GR_CATALOGUE.concat(['recentConversationContext']).sort());
    assert.deepEqual(out.discovery.selectedIds, GR_CATALOGUE);
  }
});

// ═══════════════════ Future source (AC-29) ═══════════════════
test('AC-29: a future RecoveryRingSource joins by registration + descriptor + governance metadata + adapter only; invoked once after discovery when selected; never when not selected; excluded when authorization (standing in for future availability/permission state) is false', async () => {
  const adapterReads = [];
  const recoveryRingAdapter = { readLatest: async () => { adapterReads.push('read'); return { recoveryScore: 71 }; } }; // stub platform/server adapter
  assert.equal(ContextComposer.registerFragmentProvider({
    id: 'RecoveryRingSource',
    description: 'Recovery and sleep-quality scores recorded by the user\'s wearable, typically for the previous night and recent days.',
    relevanceTags: ['CURRENT_PHYSICAL_STATE'], sensitivityTier: 'STANDARD', consentScope: null,
    invoke: async () => ({ value: await recoveryRingAdapter.readLatest(), availability: 'AVAILABLE' })
  }).ok, true);
  // Test-only capability. Listing the source in contextCeiling is the recorded TRANSITIONAL edit (A1 §07).
  const testCap = {
    id: 'TEST_FUTURE_CAPABILITY', capabilityRiskTier: 'STANDARD', sensitiveContextAccessPolicy: 'NOT_AUTHORIZED',
    contextCeiling: ['recentConversationContext', 'goalObjectiveContext', 'RecoveryRingSource'], contextBaseline: ['recentConversationContext'], requiredContext: []
  };
  const authz = authzFor(testCap, CONSENTS.granted);
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(testCap, authz).map((e) => e.id), ['goalObjectiveContext', 'RecoveryRingSource']);
  const discover = (input) => Discovery.discover(input); // the unmodified production interpreter
  const order = [];
  Discovery.configure({ callClaude: async () => { order.push('model'); return modelText({ selectedIds: ['RecoveryRingSource'], informationNeeds: ['recent recovery'] }); } });
  const origRead = recoveryRingAdapter.readLatest;
  recoveryRingAdapter.readLatest = async () => { order.push('adapter'); return origRead(); };
  let out = await ContextComposer.assemble(NEEDS.projected, testCap, markedPipelineContext(), authz, discover);
  assert.deepEqual(order, ['model', 'adapter']);
  assert.equal(adapterReads.length, 1);
  assert.deepEqual(out.context.RecoveryRingSource, { value: { recoveryScore: 71 }, availability: 'AVAILABLE' });
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['goalObjectiveContext'], informationNeeds: [] }) });
  out = await ContextComposer.assemble(NEEDS.projected, testCap, markedPipelineContext(), authz, discover);
  assert.equal(adapterReads.length, 1, 'not selected → never invoked');
  assert.equal('RecoveryRingSource' in out.context, false);
  const unavailable = (p) => p.id !== 'RecoveryRingSource' && authz(p);
  assert.deepEqual(ContextComposer.buildDiscoveryCatalogue(testCap, unavailable).map((e) => e.id), ['goalObjectiveContext']);
  Discovery.configure({ callClaude: stubModel({ selectedIds: ['RecoveryRingSource'], informationNeeds: [] }) });
  out = await ContextComposer.assemble(NEEDS.projected, testCap, markedPipelineContext(), unavailable, discover);
  assert.equal(adapterReads.length, 1, 'unauthorized → never invoked');
  assert.equal('RecoveryRingSource' in out.context, false);
});

// ═══════════════════ Application-Ready (AC-30 … AC-32) ═══════════════════
test('AC-30: C1 §14.3 — the new and modified core modules contain no browser, storage, network or Firebase dependency and load under Node', () => {
  const files = ['semanticContextDiscoveryInterpreter.js', 'contextComposer.js', 'contextRelevancePlanner.js', 'generalReasoningCapability.js', 'trrCapabilityAdapter.js'];
  const EXPORT_LINE = /^\s*if \(typeof window !== 'undefined'\) \{ window\.[A-Za-z]+ = API; \}\s*$/;
  const UMD_IMPORT = /^\s*: window\.[A-Za-z]+;\s*$/;
  files.forEach((f) => {
    const code = codeOnly(read('js/coachDecisionSystem/' + f)).split('\n').filter((l) => !EXPORT_LINE.test(l) && !UMD_IMPORT.test(l)).join('\n');
    ['document.', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator.', 'fetch(', 'firebase', 'Firebase', 'serviceWorker', 'window.'].forEach((t) => assert.equal(code.indexOf(t), -1, f + ' contains ' + t));
    assert.doesNotThrow(() => req('js/coachDecisionSystem/' + f));
  });
});

test('AC-31: no registered description contains a platform or vendor token', () => {
  const DENY = ['HealthKit', 'Health Connect', 'HK', 'Google', 'Apple', 'Fitbit', 'Garmin', 'Firebase', 'Firestore', 'API', 'SDK', 'GPS', 'iOS', 'Android', 'browser', 'PWA', 'Web'];
  ContextComposer.getAllFragmentProviderIds().forEach((id) => {
    const d = ContextComposer.getFragmentProvider(id).description;
    if (d === null) return;
    DENY.forEach((t) => assert.equal(new RegExp('\\b' + t + '\\b').test(d), false, id + ' description contains ' + t));
  });
});

test('AC-32: the interpreter depends only on modelResponseEnvelope.js', () => {
  const code = codeOnly(read('js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js'));
  const requires = (code.match(/require\('([^']+)'\)/g) || []);
  assert.deepEqual(requires, ["require('./modelResponseEnvelope.js')"]);
  const globals = (code.match(/: window\.([A-Za-z]+);/g) || []);
  assert.deepEqual(globals, [': window.ModelResponseEnvelope;']);
});
