// WP0 Phase E.0.2d — static boundary checks
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md v1.1 §08, §11, §21, §28, §29; AC-D4, AC-D5,
// AC-D31, AC-D40, AC-D41, AC-D44, AC-D46, AC-D62, AC-D66). Source scans only; no model call exists. Byte-unchanged
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
// v1.1 §08: five modules; the Verifier is new in v1.1.
const MODULES = {
  contract: D + 'consolidationContract.js',
  interpreter: D + 'consolidationInterpreter.js',
  verifier: D + 'consolidationVerifier.js',
  gate: D + 'consolidationGate.js',
  coordinator: D + 'consolidation.js'
};
const GLOBALS = ['ConsolidationContract', 'ConsolidationInterpreter', 'ConsolidationVerifier', 'ConsolidationGate', 'Consolidation'];
const MODEL_STAGES = [MODULES.interpreter, MODULES.verifier];

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

test('AC-D41: module dependencies are exactly §08 (v1.1: five modules; the Verifier never depends on the User Knowledge contract)', () => {
  const deps = (f) => (codeOnly(read(f)).match(/require\('([^']+)'\)/g) || []).map((m) => m.slice(9, -2)).sort();
  assert.deepEqual(deps(MODULES.contract), ['./userKnowledgeContract.js']);
  assert.deepEqual(deps(MODULES.interpreter), ['./consolidationContract.js', './modelResponseEnvelope.js']);
  assert.deepEqual(deps(MODULES.verifier), ['./consolidationContract.js', './modelResponseEnvelope.js']);
  assert.deepEqual(deps(MODULES.gate), ['./consolidationContract.js', './userKnowledgeContract.js']);
  assert.deepEqual(deps(MODULES.coordinator), ['./consolidationContract.js', './consolidationGate.js', './consolidationInterpreter.js', './consolidationVerifier.js', './eligibilityPolicy.js', './userKnowledgeContract.js']);
  // §08: the Verifier reads no store, port, record or User Knowledge field itself
  assert.equal(/userKnowledge|UserKnowledge|relationDescription|deps\.store|deps\.port/.test(codeOnly(read(MODULES.verifier))), false);
});

test('AC-D41: no forbidden reference, clock, randomness or id generation; timers only in the two model-stage modules (MRE-001 timeouts)', () => {
  const forbidden = ['document.', 'localStorage', 'sessionStorage', 'navigator', 'fetch(', 'firebase', 'Firestore', 'currentUser', 'memory.js', 'stateAccess', 'app.js',
    'functions/', 'repositories', 'safetyLayer', 'safetyIntegration', 'safetyContext', 'userSafety', 'riskCharacteristic', 'IntakeGate', 'memoryLayer', 'contextComposer',
    'contextRelevancePlanner', 'Date.now', 'new Date', 'Math.random', 'crypto', 'performance.now', 'process.hrtime', 'console.', 'ErrorTelemetry'];
  Object.values(MODULES).forEach((f) => {
    const src = codeOnly(read(f));
    forbidden.forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
    const windowUses = (src.match(/window\.[A-Za-z]+/g) || []);
    windowUses.forEach((w) => assert.ok(['window.UserKnowledgeContract', 'window.ConsolidationContract', 'window.ConsolidationInterpreter', 'window.ConsolidationVerifier',
      'window.ConsolidationGate', 'window.Consolidation', 'window.ModelResponseEnvelope', 'window.EligibilityPolicy'].indexOf(w) !== -1, f + ' uses ' + w));
    if (MODEL_STAGES.indexOf(f) === -1) assert.equal(/setTimeout|setInterval/.test(src), false, f + ' uses a timer');
  });
});

test('AC-D62 / §16.5 (static): execution is reachable only through the per-pass authorization; no write path reads Verifier output', () => {
  const coord = codeOnly(read(MODULES.coordinator));
  // every store write sits inside execute(), which first requires authorization.permits(plan)
  const execStart = coord.indexOf('async function execute(plan, authorization, passNewIds)');
  assert.notEqual(execStart, -1);
  const execBody = coord.slice(execStart, coord.indexOf('async function runPass('));
  assert.match(execBody, /if \(!authorization \|\| !authorization\.permits\(plan\)\)/);
  ['store.createRecord', 'store.appendEvidence', 'store.supersede'].forEach((w) => {
    assert.equal(coord.split(w).length - 1, 1, w + ' appears exactly once');
    assert.notEqual(execBody.indexOf(w), -1, w + ' only inside execute()');
  });
  // execute() is called only with plans the authorization permits, from the decisions it returned
  assert.match(coord, /if \(d\.outcome !== 'AUTHORIZED' \|\| !authorization\.permits\(d\.plan\)\)/);
  assert.equal((coord.match(/await execute\(/g) || []).length, 1);
  // the Verifier's result reaches only the gate's authorization step
  assert.equal((coord.match(/\bverification\b/g) || []).filter(Boolean).length > 0, true);
  assert.equal(/verification\.verdicts/.test(coord), false);
  // the gate grants execution only through the Authorization it returns
  const gate = codeOnly(read(MODULES.gate));
  assert.match(gate, /permits: function \(plan\) \{ return permitted\.has\(plan\); \}/);
  assert.equal((gate.match(/permitted\.add\(/g) || []).length, 1);
});

test('AC-D66 / R-10 (static): no rule, constant, instruction or exception names or targets a calibration case', () => {
  // P8: the calibration cases live in the corpus files; the harness keeps only its dry-run scenarios.
  const harness = ['tests/evals/e02dConsolidationCalibration.eval.js', 'tests/evals/e02d/corpus.regression.v1.js',
    'tests/evals/e02d/corpus.development.js', 'tests/evals/e02d/corpus.verifierProbes.js'].map(read).join('\n');
  const ids = (harness.match(/id: '([a-z0-9-]+)'/g) || []).map((m) => m.slice(5, -1));
  const texts = (harness.match(/\['t\d+', '([^']{12,})'/g) || []).map((m) => m.replace(/^\['t\d+', '/, '').slice(0, -1));
  assert.ok(ids.length >= 16 && texts.length >= 20, 'the scan reads the calibration corpus');
  Object.values(MODULES).forEach((f) => {
    const src = read(f).toLowerCase();
    ids.forEach((id) => assert.equal(src.indexOf(id), -1, f + ' names calibration case ' + id));
    texts.forEach((t) => assert.equal(src.indexOf(t.toLowerCase()), -1, f + ' contains calibration text: ' + t));
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
