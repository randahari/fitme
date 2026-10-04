// WP0 Phase E.0.2d — static boundary checks
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §08, §11, §21, §29; AC-D4, AC-D5, AC-D31,
// AC-D40, AC-D41, AC-D44, AC-D46). Source scans only; no model call exists. Byte-unchanged
// verification of existing files (AC-D42, AC-D43) is performed by the implementation review
// (git diff), following the E.0.2b/E.0.2c precedent.
// Run with: node --test tests/e02dConsolidationStatic.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const D = 'js/coachDecisionSystem/';
const MODULES = {
  contract: D + 'consolidationContract.js',
  interpreter: D + 'consolidationInterpreter.js',
  gate: D + 'consolidationGate.js',
  coordinator: D + 'consolidation.js'
};
const GLOBALS = ['ConsolidationContract', 'ConsolidationInterpreter', 'ConsolidationGate', 'Consolidation'];

function walk(dir) {
  const out = [];
  const go = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) go(p); else if (p.endsWith('.js')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  });
  go(path.join(ROOT, dir));
  return out;
}

test('AC-D41: module dependencies are exactly §08', () => {
  const deps = (f) => (codeOnly(read(f)).match(/require\('([^']+)'\)/g) || []).map((m) => m.slice(9, -2)).sort();
  assert.deepEqual(deps(MODULES.contract), ['./userKnowledgeContract.js']);
  assert.deepEqual(deps(MODULES.interpreter), ['./consolidationContract.js', './modelResponseEnvelope.js']);
  assert.deepEqual(deps(MODULES.gate), ['./consolidationContract.js', './userKnowledgeContract.js']);
  assert.deepEqual(deps(MODULES.coordinator), ['./consolidationContract.js', './consolidationGate.js', './consolidationInterpreter.js', './eligibilityPolicy.js', './userKnowledgeContract.js']);
});

test('AC-D41: no forbidden reference, clock, randomness or id generation; timers only in the interpreter (MRE-001 timeout)', () => {
  const forbidden = ['document.', 'localStorage', 'sessionStorage', 'navigator', 'fetch(', 'firebase', 'Firestore', 'currentUser', 'memory.js', 'stateAccess', 'app.js',
    'functions/', 'repositories', 'safetyLayer', 'safetyIntegration', 'safetyContext', 'userSafety', 'riskCharacteristic', 'IntakeGate', 'memoryLayer', 'contextComposer',
    'contextRelevancePlanner', 'Date.now', 'new Date', 'Math.random', 'crypto', 'performance.now', 'process.hrtime', 'console.', 'ErrorTelemetry'];
  Object.values(MODULES).forEach((f) => {
    const src = codeOnly(read(f));
    forbidden.forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
    const windowUses = (src.match(/window\.[A-Za-z]+/g) || []);
    windowUses.forEach((w) => assert.ok(['window.UserKnowledgeContract', 'window.ConsolidationContract', 'window.ConsolidationInterpreter', 'window.ConsolidationGate',
      'window.Consolidation', 'window.ModelResponseEnvelope', 'window.EligibilityPolicy'].indexOf(w) !== -1, f + ' uses ' + w));
    if (f !== MODULES.interpreter) assert.equal(/setTimeout|setInterval/.test(src), false, f + ' uses a timer');
  });
});

test('AC-D40: Node-only — no module is script-tagged, cached by the service worker, referenced by js/app.js, or uses the callClaude:null shell shape', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const app = read('js/app.js');
  Object.values(MODULES).forEach((f) => {
    const name = f.split('/').pop();
    assert.equal(html.indexOf(name), -1, name + ' is script-tagged');
    assert.equal(sw.indexOf(name), -1, name + ' is cached');
    assert.equal(/callClaude/.test(read(f)), false, f + ' references callClaude');
  });
  assert.equal(/Consolidation|consolidation/.test(app), false, 'js/app.js references E.0.2d');
});

test('AC-D44 / §29: no production caller — no other production file references the E.0.2d modules or globals', () => {
  const files = walk('js').concat(walk('functions'));
  assert.ok(files.length > 50);
  // Code-level references only: a global used as an object (X.member / window.X) or a module path.
  // (Unrelated prose such as a comment heading "Override Consolidation" is not a reference.)
  const refs = GLOBALS.map((g) => new RegExp('\\b' + g + '\\s*\\.|window\\.' + g + '\\b'))
    .concat([/consolidationContract\.js|consolidationInterpreter\.js|consolidationGate\.js|\/consolidation\.js/]);
  files.filter((f) => Object.values(MODULES).indexOf(f) === -1).forEach((f) => {
    const src = codeOnly(read(f));
    refs.forEach((re) => assert.equal(re.test(src), false, f + ' references ' + re));
  });
  ['index.html', 'sw.js'].forEach((f) => refs.forEach((re) => assert.equal(re.test(read(f)), false, f + ' references ' + re)));
});

test('AC-D4: eligibility is computed only by the single A3 policy; no consumer-id or source-id branch', () => {
  const src = codeOnly(read(MODULES.coordinator));
  assert.match(src, /EligibilityPolicy\.computeEligibility\(desc, CC\.CONSUMER_DECLARATION, consentState\)/);
  assert.equal(/consumerId/.test(src), false);
  assert.equal(/sourceId\s*===|===\s*['"]conversationTurns|===\s*['"]dayLogs|E02D_CONSOLIDATION/.test(src), false);
  Object.values(MODULES).forEach((f) => assert.equal(/contextCeiling|CapabilityRegistry\.register|resolveCapability/.test(codeOnly(read(f))), false, f));
});

test('AC-D5: no code path requests, prompts or initiates any authorization', () => {
  Object.values(MODULES).forEach((f) => {
    const src = codeOnly(read(f));
    [/requestPermission/i, /askPermission/i, /(^|[^A-Za-z])prompt\(/, /(^|[^A-Za-z])authorize\(/, /grantConsent/i, /requestAccess/i, /oauth/i].forEach((re) => assert.equal(re.test(src), false, f + ' matches ' + re));
  });
});

test('AC-D31 (static): E.0.2d never calls promotion, retraction, archival, confidence, confound, safety-flag, correction, concept-mutation, forget or erase operations', () => {
  const ops = ['promoteRecord', 'retractRecord', 'archiveRecord', 'setConfidence', 'addConfound', 'recordConfoundCheck', 'raiseSafetyFlag', 'correctInferredKnowledge',
    'mergeConcept', 'unmergeConcept', 'createConcept', 'addConceptLabel', 'removeConceptLabel', 'forgetRecord', 'forgetConcept', 'eraseAllForUser', 'applyEvidenceAvailability'];
  Object.values(MODULES).forEach((f) => ops.forEach((op) => assert.equal(read(f).indexOf(op), -1, f + ' references ' + op)));
  const coord = codeOnly(read(MODULES.coordinator));
  ['store.createRecord', 'store.appendEvidence', 'store.supersede'].forEach((w) => assert.notEqual(coord.indexOf(w), -1, w));
});

test('AC-D46 (static): no E.0.2d module reads any record\'s confidence', () => {
  Object.values(MODULES).forEach((f) => assert.equal(/\.confidence\b/.test(codeOnly(read(f))), false, f));
});

test('§28: no closed content taxonomy, situation rule, synonym table or embedding in E.0.2d', () => {
  Object.values(MODULES).forEach((f) => {
    const src = codeOnly(read(f)).toLowerCase();
    ['synonym', 'embedding', 'ontology', 'taxonomy', 'cosine'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
  });
});
