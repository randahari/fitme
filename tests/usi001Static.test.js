// USI-001 — static architecture, live-boundary and scope checks (docs/specs/USI_001_SPEC_v1.0.md
// §08, §29, §30 AC-1, AC-4, AC-5, AC-12 (static), AC-28 (static), AC-40, AC-41, AC-44 (static),
// AC-47 (static)). Source scans only.
// Run with: node --test tests/usi001Static.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const D = 'js/coachDecisionSystem/';

const NEW_MODULES = {
  activationGate: D + 'userStatedIntakeActivationGate.js',
  interpreter: D + 'userStatedIntakeInterpreter.js',
  gate: D + 'userStatedIntakeGate.js',
  coordinator: D + 'userStatedIntake.js',
  executor: D + 'userStatedIntakeExecutor.js'
};
const MODIFIED_CORE = [D + 'turnUnderstandingInterpreter.js', D + 'explicitPreferenceStatementInterpreter.js', D + 'internalPipelineOrchestrator.js', D + 'userKnowledgeStore.js'];

function walk(dir) {
  const out = [];
  const go = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) go(p); else if (p.endsWith('.js')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  });
  go(path.join(ROOT, dir));
  return out;
}

// ═══ AC-1 ═══
test('AC-1: the activation gate defaults to false (fresh process) and no production file sets it', () => {
  const out = execSync('node -e "console.log(require(\'./' + NEW_MODULES.activationGate + '\').isEnabled())"', { cwd: ROOT }).toString().trim();
  assert.equal(out, 'false');
  const src = codeOnly(read(NEW_MODULES.activationGate));
  assert.match(src, /var _enabled = false;/);
  walk('js').concat(walk('functions')).forEach((f) => {
    if (f === NEW_MODULES.activationGate) return;
    assert.equal(read(f).indexOf('__setEnabledForTests__'), -1, f + ' flips the USI activation gate');
  });
  ['index.html', 'sw.js'].forEach((f) => assert.equal(read(f).indexOf('__setEnabledForTests__'), -1));
});

// ═══ AC-4 — live boundary ═══
test('AC-4: no production path calls the executor; js/app.js does not reference it, the store or a User Knowledge adapter; no rules, reset or functions change', () => {
  walk('js').forEach((f) => {
    if (f === NEW_MODULES.executor) return;
    assert.equal(/UserStatedIntakeExecutor|userStatedIntakeExecutor/.test(read(f)), false, f + ' references the executor');
  });
  ['index.html', 'sw.js'].forEach((f) => assert.equal(/userStatedIntakeExecutor|userKnowledgeStore|userKnowledgeTransitions/.test(read(f)), false, f));
  const app = read('js/app.js');
  const appCode = codeOnly(app);
  ['UserStatedIntakeExecutor', 'UserKnowledgeStore', 'UserStatedIntake.configure', 'UserStatedIntakeActivationGate', 'userKnowledge', 'GovernedCorrectionPort'].forEach((t) => assert.equal(appCode.indexOf(t), -1, 'app.js references ' + t));
  assert.equal((appCode.match(/UserStatedIntake[A-Za-z]*/g) || []).join(','), 'UserStatedIntakeInterpreter', 'the shell only configures the interpreter');
  assert.equal(/UserKnowledge|userKnowledge|UserStatedIntake/.test(read('firestore.rules')), false);
  walk('functions').forEach((f) => assert.equal(/UserKnowledge|userKnowledge|UserStatedIntake|userStatedIntake/.test(read(f)), false, f));
  // resetApp() untouched by USI-001
  const reset = app.slice(app.indexOf('function resetApp'), app.indexOf('function resetApp') + 4000);
  assert.equal(/UserKnowledge|userStatedIntake/i.test(reset), false);
  // the coordinator never requires the executor
  assert.equal(/Executor/.test(codeOnly(read(NEW_MODULES.coordinator))), false);
});

// ═══ AC-5 — Application-Ready (C1 §14.3) ═══
const EXPORT_LINE = /^\s*if \(typeof window !== 'undefined'\) \{ window\.[A-Za-z]+ = API; \}\s*$/;
const UMD_IMPORT = /^\s*: window\.[A-Za-z]+;\s*$/;
test('AC-5: every new and modified core module is platform-neutral (no DOM, storage, navigator, fetch, Firebase, window beyond export/UMD lines) and loads under Node', () => {
  Object.values(NEW_MODULES).concat(MODIFIED_CORE).forEach((f) => {
    const code = codeOnly(read(f)).split('\n').filter((l) => !EXPORT_LINE.test(l) && !UMD_IMPORT.test(l)).join('\n');
    ['document.', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator.', 'fetch(', 'serviceWorker', 'window.', 'XMLHttpRequest', 'firebase', 'firestore'].forEach((t) => {
      assert.equal(code.toLowerCase().indexOf(t.toLowerCase()), -1, f + ' contains ' + t);
    });
    assert.doesNotThrow(() => require(path.join(ROOT, f)));
  });
});

// ═══ AC-40 / AC-41 — dependencies; clock ═══
function deps(f) {
  const src = codeOnly(read(f));
  return { requires: (src.match(/require\('([^']+)'\)/g) || []).map((m) => m.slice(9, -2)), globals: (src.match(/: window\.([A-Za-z]+);/g) || []).map((m) => m.slice(9, -1)) };
}
test('AC-40: USI modules depend only on the §29 set, the E.0.2c contract and MRE-001; the coordinator never requires the executor', () => {
  assert.deepEqual(deps(NEW_MODULES.activationGate), { requires: [], globals: [] });
  assert.deepEqual(deps(NEW_MODULES.interpreter), { requires: ['./modelResponseEnvelope.js', './modelResponseStructure.js'], globals: ['ModelResponseEnvelope', 'ModelResponseStructure'] });
  assert.deepEqual(deps(NEW_MODULES.gate), { requires: ['./userKnowledgeContract.js'], globals: ['UserKnowledgeContract'] });
  assert.deepEqual(deps(NEW_MODULES.coordinator), {
    requires: ['./userKnowledgeContract.js', './userStatedIntakeActivationGate.js', './userStatedIntakeInterpreter.js', './userStatedIntakeGate.js'],
    globals: ['UserKnowledgeContract', 'UserStatedIntakeActivationGate', 'UserStatedIntakeInterpreter', 'UserStatedIntakeGate']
  });
  assert.deepEqual(deps(NEW_MODULES.executor), { requires: ['./userKnowledgeContract.js'], globals: ['UserKnowledgeContract'] });
});

test('AC-40: no USI module reads a clock or randomness except the interpreter\'s fixed timeout timer (CARF Ch.08)', () => {
  Object.values(NEW_MODULES).forEach((f) => {
    const src = codeOnly(read(f));
    ['Date.now', 'new Date', 'Math.random', 'performance.now', 'process.hrtime', 'crypto'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
    if (f !== NEW_MODULES.interpreter) assert.equal(/setTimeout|setInterval/.test(src), false, f);
  });
});

test('AC-41 (static): the USI interpreter owns exactly one model-output JSON.parse, routed through the shared envelope; the other USI modules own none', () => {
  const s = codeOnly(read(NEW_MODULES.interpreter));
  assert.equal((s.match(/JSON\.parse\(/g) || []).length, 1);
  assert.equal((s.match(/JSON\.parse\(ModelResponseEnvelope\.unwrapSingleJsonFence\(/g) || []).length, 1);
  [NEW_MODULES.gate, NEW_MODULES.coordinator, NEW_MODULES.executor, NEW_MODULES.activationGate].forEach((f) => assert.equal(/JSON\.parse\(/.test(codeOnly(read(f))), false, f));
  // the modified interpreters keep their existing site counts
  assert.equal((codeOnly(read(D + 'turnUnderstandingInterpreter.js')).match(/JSON\.parse\(/g) || []).length, 2);
  assert.equal((codeOnly(read(D + 'explicitPreferenceStatementInterpreter.js')).match(/JSON\.parse\(/g) || []).length, 1);
});

// ═══ AC-44 / AC-47 (static) ═══
test('AC-44 (static): the gate does not reference Dimension 6; the interpreter and coordinator never pass it on', () => {
  const g = read(NEW_MODULES.gate);
  assert.equal(/userStatedKnowledge|NEW_USER_KNOWLEDGE|CORRECTION_WITHDRAW_FORGET/.test(codeOnly(g)), false);
  assert.equal(/userStatedKnowledge/.test(codeOnly(read(NEW_MODULES.interpreter))), false);
  const coord = codeOnly(read(NEW_MODULES.coordinator));
  // read only in detectorPositive(); never placed into the interpreter or gate input
  const uses = coord.split('\n').filter((l) => l.indexOf('userStatedKnowledge') !== -1);
  assert.equal(uses.length, 1);
  assert.match(uses[0], /var d = turnUnderstanding && turnUnderstanding\.userStatedKnowledge;/);
});

test('AC-47 (static): the gate holds no word list, synonym map, pronoun list or regular expression over content', () => {
  const g = codeOnly(read(NEW_MODULES.gate));
  assert.equal(/new RegExp|\.match\(|\.replace\(|\.test\(|\.search\(/.test(g), false, 'no regex use');
  assert.equal(/\/[^/\n*]+\/[gimsuy]*\.(test|exec)/.test(g), false);
  ['synonym', 'pronoun', 'stopword', 'ontology', 'taxonomy', 'category', 'domain', 'topic'].forEach((t) => assert.equal(new RegExp('\\b' + t, 'i').test(g), false, t));
  // no string-array literal other than the closed process/structure vocabularies and key lists
  const arrays = g.match(/\[\s*'[^\]]*\]/g) || [];
  const allowed = ["['NEW', 'CORRECT', 'WITHDRAW', 'FORGET']", "['NAMED', 'DEICTIC']", "['CORRECT', 'WITHDRAW', 'FORGET']", "['candidate', 'active']"];
  arrays.forEach((a) => {
    if (allowed.indexOf(a) !== -1) return;
    assert.ok(/'operation'|'conceptId'/.test(a), 'unexpected string list: ' + a);
  });
});

// ═══ AC-12 / AC-28 (static) ═══
test('AC-12 (static): no Safety module, Expression, Pipeline Context assembly or logging path reads the CPI anchor, Dimension 6 or the recognition record', () => {
  const safetyAndExpression = walk('js').filter((f) => /safety|riskCharacteristic|expression|memoryLayer|decisionFormation|contextComposer|errorTelemetry|telemetry/i.test(f));
  assert.ok(safetyAndExpression.length > 10);
  safetyAndExpression.forEach((f) => assert.equal(/assertionAnchor|userStatedKnowledge|UserStatedIntake|ownedSpans/.test(read(f)), false, f));
  const orch = codeOnly(read(D + 'internalPipelineOrchestrator.js'));
  assert.equal(/pipelineContext\.(recognition|userStatedIntakeDecision|cpiAssertionAnchor)/.test(orch), false);
  assert.equal(/console\.|ErrorTelemetry|logError/.test(codeOnly(read(NEW_MODULES.coordinator)) + codeOnly(read(NEW_MODULES.gate)) + codeOnly(read(NEW_MODULES.interpreter)) + codeOnly(read(NEW_MODULES.executor))), false);
});

test('AC-28 (static): no USI module writes Typed Memory (memory.js, stateAccess writes, C4) — USI writes only User Knowledge', () => {
  Object.values(NEW_MODULES).forEach((f) => {
    const src = read(f);
    ['memory.js', 'stateAccess', 'StateAccess', 'typedMemoryServerWrite', 'saveMemory', 'persistCpiPreferenceRecord', 'Firestore'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' references ' + t));
  });
});

test('§29 forbidden changes: OU-001, CCC-001, Need creation, disclosure recognition, preference gate, memory layer and Safety modules do not reference USI-001', () => {
  ['conversationalNeedCreator.js', 'userDisclosureRecognizer.js', 'preferenceIntakeGate.js', 'memoryLayer.js', 'safetyLayer.js', 'safetyDisclosureIntakeGate.js', 'riskCharacteristicIntakeGate.js', 'riskCharacteristicInterpreter.js', 'safetyContextInterpreter.js', 'trainingReadinessReasoningComponent.js', 'expressionRenderer.js']
    .forEach((f) => assert.equal(/UserStatedIntake|userStatedIntake|assertionAnchor|userStatedKnowledge/.test(read(D + f)), false, f));
  assert.equal(/UserStatedIntake|userStatedIntake/.test(read('js/memory.js')), false);
});
