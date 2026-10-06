// MRS-001 — S-W static wiring and mechanical guards G1, G2, G5, G6 (docs/specs/MRS_001_SPEC_v1.0.md §10,
// §11, §17, §19 S-W), plus the static half of G4 for the two EXPLICIT-PROFILE stages (behaviour: the E.0.2d
// suites, AC-D67 … AC-D71). Source-text checks and stubbed-transport captures only; no model call.
// Run with: node --test tests/mrs001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/coachDecisionSystem/';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const req = (p) => require(path.join(ROOT, p));
const MRS = req(DIR + 'modelResponseStructure.js');

// §10.2 — the MRS-001 v1.0 baseline inventory: entry → [file, request function, max_tokens, TIMEOUT_MS].
const BASELINE = {
  'F-1': ['turnUnderstandingInterpreter.js', 'buildRequestBody', 1400, 8000],
  'F-2': ['explicitPreferenceStatementInterpreter.js', 'classifyBatch', 400, 8000],
  'F-3': ['explicitRequestInterpreter.js', 'classifyBatch', 400, 8000],
  'F-4': ['readinessStateInterpreter.js', 'classifyBatch', 300, 8000],
  'F-5': ['activityPreferenceInterpreter.js', 'classifyBatch', 400, 8000],
  'F-6': ['activityOppositionInterpreter.js', 'classifyBatch', 400, 8000],
  'F-7': ['situationalContextInterpreter.js', 'classifyBatch', 300, 8000],
  'F-8': ['safetyContextInterpreter.js', 'classifyBatch', 400, 8000],
  'F-9': ['safetyContextInterpreter.js', 'classifyBatchWithStatus', 400, 8000],
  'F-10': ['safetyContextInterpreter.js', 'classifyCorrectionWithStatus', 200, 8000],
  'F-11': ['userSafetyProvenanceInterpreter.js', 'classifyBatch', 400, 8000],
  'F-12': ['riskCharacteristicInterpreter.js', 'classifyCandidateContent', 500, 8000],
  'F-13': ['riskCharacteristicInterpreter.js', 'classifyTurnForDurableConstraint', 500, 8000],
  'F-14': ['riskCharacteristicInterpreter.js', 'classifyCorrectionWithStatus', 200, 8000],
  'F-15': ['riskCharacteristicInterpreter.js', 'classifyCandidateConflictWithFact', 200, 8000],
  'F-16': ['trainingReadinessReasoningComponent.js', 'propose', 700, 12000],
  'F-17': ['generalReasoningCapability.js', 'reason', 700, 12000],
  'F-18': ['semanticContextDiscoveryInterpreter.js', 'buildRequestBody', 400, 6000],
  'F-19': ['userStatedIntakeInterpreter.js', 'buildRequestBody', 800, 8000]
};
const MODEL = 'claude-haiku-4-5-20251001';
const EXPLICIT_SITES = { 'consolidationInterpreter.js': 'interpret', 'consolidationVerifier.js': 'verify' };

// §11.1 — the 16 site-owning modules: the entries named by their answer-text reads (S1–S21).
const PARSE_SITES = {
  'turnUnderstandingInterpreter.js': ['F-1', 'F-1'],                  // S1 parseAndValidate, S2 splitResponse (ED-1)
  'explicitPreferenceStatementInterpreter.js': ['F-2'],               // S3
  'explicitRequestInterpreter.js': ['F-3'],                           // S4
  'readinessStateInterpreter.js': ['F-4'],                            // S5
  'activityPreferenceInterpreter.js': ['F-5'],                        // S6
  'activityOppositionInterpreter.js': ['F-6'],                        // S7
  'situationalContextInterpreter.js': ['F-7'],                        // S8
  'safetyContextInterpreter.js': ['F-8', 'F-9', 'F-10'],              // S9 (F-8 / F-9 by path, I-1), S10
  'userSafetyProvenanceInterpreter.js': ['F-11'],                     // S11
  'riskCharacteristicInterpreter.js': ['F-12', 'F-13', 'F-14', 'F-15'], // S12–S15
  'trainingReadinessReasoningComponent.js': ['F-16'],                 // S16
  'generalReasoningCapability.js': ['F-17'],                          // S17
  'semanticContextDiscoveryInterpreter.js': ['F-18'],                 // S18
  'userStatedIntakeInterpreter.js': ['F-19'],                         // S19
  'consolidationInterpreter.js': ['EXPLICIT_PROFILE'],                // S20
  'consolidationVerifier.js': ['EXPLICIT_PROFILE']                    // S21
};
const EXTRACT_CALLS = { 'turnUnderstandingInterpreter.js': 2, 'safetyContextInterpreter.js': 2, 'riskCharacteristicInterpreter.js': 4 }; // others: 1
const NODE_ONLY = ['consolidationInterpreter.js', 'consolidationVerifier.js'];
const DEPENDENCY = /var ModelResponseStructure = \(typeof module !== 'undefined' && module\.exports\)\s*\n\s*\? require\('\.\/modelResponseStructure\.js'\)\s*\n\s*: window\.ModelResponseStructure;/;

// Each function's name for every line (the nearest enclosing `function name(`, as written in these modules).
function functionAt(src) {
  let fn = null;
  return src.split('\n').map((l) => { const m = l.match(/function ([A-Za-z0-9_]+)\(/); if (m) fn = m[1]; return fn; });
}
function sitesOf(pattern) {
  const out = [];
  fs.readdirSync(path.join(ROOT, DIR)).filter((f) => f.endsWith('.js')).forEach((f) => {
    const src = codeOnly(read(DIR + f));
    const fns = functionAt(src);
    src.split('\n').forEach((l, i) => { if (pattern.test(l)) out.push(f + '#' + fns[i]); });
  });
  return out.sort();
}

test('G1 inventory closure: every Coach Decision System injected-transport call is one of the 19 FROZEN-CONTRACT entries or an EXPLICIT-PROFILE site (file + function); total pinned at 21', () => {
  const transportCalls = sitesOf(/deps\.(callClaude|modelTransport)\(/);
  const requestFnOf = { 'turnUnderstandingInterpreter.js#buildRequestBody': 'requestModel', 'semanticContextDiscoveryInterpreter.js#buildRequestBody': 'discover', 'userStatedIntakeInterpreter.js#buildRequestBody': 'interpret' };
  const expected = Object.values(BASELINE).map(([f, fn]) => f + '#' + (requestFnOf[f + '#' + fn] || fn))
    .concat(Object.entries(EXPLICIT_SITES).map(([f, fn]) => f + '#' + fn)).sort();
  assert.deepEqual(transportCalls, expected);
  assert.equal(transportCalls.length, 21);
  // every request-body construction (a `max_tokens:` property) is a frozen entry's own function, or the E.0.2d profile body builder
  const bodies = sitesOf(/\bmax_tokens\s*:/);
  const expectedBodies = Object.values(BASELINE).map(([f, fn]) => f + '#' + fn).concat(['consolidationContract.js#buildProfileRequestBody']).sort();
  assert.deepEqual(bodies, expectedBodies);
});

test('G2 frozen signature: each of the 19 captured request bodies is exactly {model, max_tokens, messages} with the pinned model, max_tokens and one user message; TIMEOUT_MS pinned statically; whole bodies byte-identical to the pre-MRS-001 capture (Z-4)', async () => {
  // sha256 of JSON.stringify(body) captured on the pre-MRS-001 tree (HEAD f6ae1a1) with these same invocations
  const PRE_MRS_BODY_SHA256 = {
    'F-1': '7550f112fe05a41d3843a5857a024aa2fa20d167b8fb2022ef47eb1ff69cf2cd', 'F-2': '8b2bf3a2edfa8dc1bf775bcd217bdd2250eb0c387521991b07dfc76a3025c431',
    'F-3': '98d05176d7372bd7468d2bc80ed44ed6417f3313c4c520a9689504b8991e8b62', 'F-4': '33290f82a9c39a761e07e4c3da6a15e4fa427042e90131700a5b9f06cacf1e59',
    'F-5': '9ae76086bc02a67e9128a4bc4b51c847f25aa31742249d58117cf4f3ad92882b', 'F-6': '095ebab4e8ad45fb6f23b47bdfa042f274b2e377156acd9237d338da94cca804',
    'F-7': '482f85c1df6a2b9d9dba04a370c443f85b77f0cbde28364463bb57e4d118bcdf', 'F-8': '60c724e68ec147a747ec95c92bc65f04d6ddb79cf71a7ef9391825b9bccc8ed6',
    'F-9': '60c724e68ec147a747ec95c92bc65f04d6ddb79cf71a7ef9391825b9bccc8ed6', 'F-10': '95356275d2700dc57b86877376be53dbd640398e9ac7ab3cb71fcdbe1177a748',
    'F-11': '0510cdbcc7563240407fc865d5a60da8a1906d5f1ba7a3757b9b561b9585c8a3', 'F-12': 'ac232d34dd5162fbf27dc21b77b33ab7e6c87ef4ded31cc6eba5b6455b633031',
    'F-13': '0e240c1ace9656ef2b120426998f9d605c8481a1bdf75a237fe488d58f6ba7e7', 'F-14': '62c7d89cdee1b1e7c804d8c6f6cf3fb5c2348bea06bce8ef55150710dbfec2e4',
    'F-15': 'b9e22a57179f6325a9bc0204371e4d34a2d2ce6158ffbe655c81637a5a602adb', 'F-16': '7e017d49985f6b8ef0961be809aa14b223d1e1a0d56669706835572c2b31d114',
    'F-17': '96891c02f166af2bd2f9ef7a79de81a37cfecfae393be957c63ed197ed754e41', 'F-18': 'fa45209d4e7b42b10ad4dda37560075d97d4addddcf5e89e7ddd6820c96e90dd',
    'F-19': '713528283427d2d1c3c2faff716079ae8f11ba63f263e39d8c90ecd561ab4e4b'
  };
  const m = (f) => req(DIR + f);
  const invoke = {
    'F-1': (M) => M.understand({ turnId: 'b1', text: 'ישנתי 5 שעות' }, { items: [{ turnId: 'p0', userText: 'hi', assistantText: 'hello' }] }),
    'F-2': (M) => M.classify({ turnId: 'b2', text: 'I love running' }),
    'F-3': (M) => M.classify([{ id: 'r1', text: 'stop suggesting runs' }]),
    'F-4': (M) => M.classify([{ id: 'r2', text: 'slept 5 hours' }]),
    'F-5': (M) => M.classify([{ id: 'r3', text: 'I love running' }]),
    'F-6': (M) => M.classify([{ id: 'r4', text: 'never suggest swimming' }]),
    'F-7': (M) => M.classify([{ id: 'r5', text: 'busy week at work' }]),
    'F-8': (M) => M.classify([{ id: 'r6', text: 'doctor said no running' }]),
    'F-9': (M) => M.classifyWithStatus([{ id: 'r6', text: 'doctor said no running' }]),
    'F-10': (M) => M.classifyCorrectionWithStatus({ id: 'r7', text: 'doctor cleared me to run' }, 'running'),
    'F-11': (M) => M.classify([{ id: 'r8', text: 'my doctor said no running' }]),
    'F-12': (M) => M.classifyCandidateContent('go for an easy run'),
    'F-13': (M) => M.classifyTurnForDurableConstraint('I am allergic to peanuts'),
    'F-14': (M) => M.classifyCorrectionWithStatus({ id: 'r9', text: 'not allergic anymore' }, 'allergic to peanuts'),
    'F-15': (M) => M.classifyCandidateConflictWithFact('eat peanut butter', 'allergic to peanuts'),
    'F-16': (M) => M.propose({}),
    'F-17': (M) => M.reason({}, {}),
    'F-18': (M) => M.discover({ need: { openScopeDescription: 'The user asks something open.', openEntityMentions: [{ text: 'something', origin: 'CURRENT_TURN', sourceTurnId: 't' }] }, catalogue: [{ id: 'alpha', description: 'Alpha information.', relevanceTags: [] }] }),
    'F-19': (M) => M.interpret({ turnText: 'I usually sleep badly before an early shift.', recentConversationContext: { items: [] }, concepts: [], records: [], owned: { cpiAssertion: null, safety: [] } })
  };
  for (const [entry, [file, , maxTokens, timeoutMs]] of Object.entries(BASELINE)) {
    const M = m(file);
    const seen = [];
    M.configure({ callClaude: async (b) => { seen.push(b); return { content: [{ type: 'text', text: '{}' }] }; } });
    try { await invoke[entry](M); } finally { M.configure({ callClaude: null }); }
    assert.equal(seen.length, 1, entry);
    const b = seen[0];
    assert.deepEqual(Object.keys(b), ['model', 'max_tokens', 'messages'], entry + ' key set');
    assert.equal(b.model, MODEL, entry);
    assert.equal(b.max_tokens, maxTokens, entry);
    assert.equal(b.messages.length, 1, entry);
    assert.equal(b.messages[0].role, 'user', entry);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(b)).digest('hex'), PRE_MRS_BODY_SHA256[entry], entry + ' body byte-identical');
    assert.equal(Number(codeOnly(read(DIR + file)).match(/var TIMEOUT_MS = (\d+)/)[1]), timeoutMs, entry + ' TIMEOUT_MS');
  }
});

test('G5 response-side completeness: all 21 parse sites call MRS-001 with an explicit, resolvable contract; FROZEN sites name their own entries; no content[0] read remains', () => {
  const dir = path.join(ROOT, DIR);
  let calls = 0;
  for (const [file, entries] of Object.entries(PARSE_SITES)) {
    const src = codeOnly(read(DIR + file));
    assert.match(src, DEPENDENCY, file + ': the standard ModelResponseStructure dependency declaration');
    const n = (src.match(/ModelResponseStructure\.extractAnswerText\(/g) || []).length;
    assert.equal(n, EXTRACT_CALLS[file] || 1, file + ': extraction calls');
    calls += n;
    if (entries[0] === 'EXPLICIT_PROFILE') {
      // G4 (static): the contract is the EXPLICIT_PROFILE projection of the profile that built the request
      assert.equal((src.match(/extractAnswerText\(raw, \{ state: 'EXPLICIT_PROFILE', reasoning: profile \? profile\.reasoning : null \}\)/g) || []).length, 1, file);
      assert.equal(/FROZEN_CONTRACT/.test(src), false, file + ' never names a frozen entry (M3/M5)');
      assert.match(src, /buildRequestBody\(input, profile\)/, file + ': the same profile builds the request');
      continue;
    }
    const named = (src.match(/\{ state: 'FROZEN_CONTRACT', entry: '(F-\d+)' \}/g) || []).map((x) => x.match(/F-\d+/)[0]);
    assert.deepEqual(named, entries, file + ': named entries');
    named.forEach((e) => assert.equal(BASELINE[e][0], file, e + ' belongs to ' + file + ' (G1 mapping)'));
    assert.equal(/EXPLICIT_PROFILE/.test(src), false, file);
  }
  assert.equal(calls, 21); // exactly one extraction call per parse site S1–S21
  // every extraction call in the Coach Decision System is in a listed site module; nothing reads content[0]
  fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => {
    const src = codeOnly(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (f === 'modelResponseStructure.js') return; // the boundary itself is the only module that reads content blocks
    if (/extractAnswerText\(/.test(src)) assert.ok(Object.prototype.hasOwnProperty.call(PARSE_SITES, f), f + ' is not a listed site');
    assert.equal(/content\s*\[\s*0\s*\]|\.content\s*\[/.test(src), false, f + ' reads a content block directly');
    // a call without a contract argument would match `extractAnswerText(x)`
    assert.equal(/extractAnswerText\([^,()]*\)/.test(src), false, f + ' calls MRS-001 without a contract');
  });
});

test('G5 / I-1: S9 is validated under the entry of the request that produced its response (F-8 via classify, F-9 via classifyWithStatus), keeping the 3-argument _internal.parseAndValidate', () => {
  const src = codeOnly(read(DIR + 'safetyContextInterpreter.js'));
  const fns = functionAt(src);
  const lines = src.split('\n');
  const where = (e) => lines.map((l, i) => (l.indexOf("entry: '" + e + "'") !== -1 ? fns[i] : null)).filter(Boolean);
  assert.deepEqual(where('F-8'), ['parseAndValidate']);
  assert.deepEqual(where('F-9'), ['classifyBatchWithStatus']);
  assert.deepEqual(where('F-10'), ['parseAndValidateCorrection']);
  assert.match(src, /function parseAndValidate\(rawResponse, submittedIds, idToStatementText\) \{/);
  assert.equal(req(DIR + 'safetyContextInterpreter.js')._internal.parseAndValidate.length, 3);
  // classifyBatch (F-8) still reaches the body through parseAndValidate
  const classifyBatch = lines.filter((l, i) => fns[i] === 'classifyBatch').join('\n');
  assert.match(classifyBatch, /return parseAndValidate\(result, submittedIds, idToStatementText\);/);
});

test('ED-1 (§11.2): the Turn Understanding provider response crosses MRS-001 once per path; the closed segment travels on as text and no internal object is passed to MRS-001', () => {
  const src = codeOnly(read(DIR + 'turnUnderstandingInterpreter.js'));
  const lines = src.split('\n');
  const fns = functionAt(src);
  const extractIn = lines.map((l, i) => (/extractAnswerText\(/.test(l) ? fns[i] : null)).filter(Boolean);
  assert.deepEqual(extractIn, ['parseAndValidate', 'splitResponse']);
  assert.equal(/closedResponse|content: \[\{/.test(src), false, 'no FITME-internal response-shaped object');
  // production flow: understand() and classifyBatch() validate the split closed text, never re-extracting
  ['understand', 'classifyBatch'].forEach((fn) => {
    const body = lines.filter((l, i) => fns[i] === fn).join('\n');
    assert.match(body, /validateClosedText\((segments|splitResponse\(raw\))\.closedText/, fn);
    assert.equal(/parseAndValidate\(/.test(body), false, fn + ' does not route the response through S1 a second time');
  });
  assert.equal((src.match(/JSON\.parse\(/g) || []).length, 2, 'MRE-001 W-1: two parse sites, unchanged');
});

test('G6 one-way inventory: FROZEN_CONTRACT_INVENTORY is a frozen subset of the MRS-001 v1.0 baseline with identical signatures (entries may only be removed)', () => {
  const inv = MRS.FROZEN_CONTRACT_INVENTORY;
  assert.ok(Object.isFrozen(inv));
  Object.keys(inv).forEach((id) => {
    assert.ok(Object.prototype.hasOwnProperty.call(BASELINE, id), id + ' is not a baseline entry');
    const [file, fn, maxTokens, timeoutMs] = BASELINE[id];
    assert.deepEqual(Object.assign({}, inv[id]), { file, fn, model: MODEL, maxTokens, timeoutMs, keys: ['model', 'max_tokens', 'messages'], reasoning: 'OFF' }, id);
  });
  assert.equal(Object.keys(inv).length, 19, 'MRS-001 v1.0: no M6 removal has happened yet');
});

test('S-W shell: index.html script-tags modelResponseStructure.js exactly once, before every converted browser module; the E.0.2d stages stay Node-only; sw.js precaches it; versions match', () => {
  const html = read('index.html');
  const tag = 'src="js/coachDecisionSystem/modelResponseStructure.js"';
  assert.equal(html.split(tag).length - 1, 1);
  const at = html.indexOf(tag);
  assert.ok(html.indexOf('src="js/coachDecisionSystem/modelResponseEnvelope.js"') < at);
  Object.keys(PARSE_SITES).forEach((f) => {
    const idx = html.indexOf('src="js/coachDecisionSystem/' + f + '"');
    if (NODE_ONLY.indexOf(f) !== -1) { assert.equal(idx, -1, f + ' is Node-only'); return; }
    assert.ok(idx > at, 'modelResponseStructure.js must load before ' + f);
  });
  const sw = read('sw.js');
  assert.equal(sw.split("'/fitme/js/coachDecisionSystem/modelResponseStructure.js'").length - 1, 1);
  NODE_ONLY.forEach((f) => assert.equal(sw.indexOf(f), -1));
  assert.equal(sw.match(/const VERSION = 'v([\d.]+)'/)[1], read('js/app.js').match(/const APP_VERSION = '([\d.]+)'/)[1]);
  assert.equal(sw.match(/const VERSION = 'v([\d.]+)'/)[1], '2.47.9');
});

test('S-W purity: modelResponseStructure.js has no dependency, global read (other than its own export), clock, randomness, I/O, logging or JSON parsing', () => {
  const src = codeOnly(read(DIR + 'modelResponseStructure.js'));
  assert.equal(/require\(/.test(src), false);
  assert.equal(/\bDate\b|Math\.random|fetch\(|console\.|JSON\.parse|localStorage|XMLHttpRequest|setTimeout/.test(src), false);
  assert.deepEqual(src.match(/window\.[A-Za-z]+/g) || [], ['window.ModelResponseStructure']);
  assert.match(src, /window\.ModelResponseStructure = API;/);
  assert.match(src, /module\.exports = API;/);
  // no model-id condition: the model id appears only as the inventory's recorded signature value
  assert.equal((src.match(/claude-/g) || []).length, 1);
});

test('§14 scope: the browser-shell consumers are not converted and do not depend on MRS-001', () => {
  ['js/app.js', 'js/coach/coachClient.js', 'js/nutrition/nutritionAnalysisService.js', 'js/adapters/claudeProxyClient.js'].forEach((f) => {
    assert.equal(/ModelResponseStructure|modelResponseStructure/.test(read(f)), false, f);
  });
});
