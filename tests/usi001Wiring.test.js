// USI-001 — browser wiring, service worker and shell configuration (docs/specs/USI_001_SPEC_v1.0.md
// §29; AC-42). Source-text checks only.
// Run with: node --test tests/usi001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const sw = read('sw.js');
const app = read('js/app.js');
const tagIdx = (f) => html.indexOf('<script src="js/coachDecisionSystem/' + f + '"></script>');
const swIdx = (f) => sw.indexOf("'/fitme/js/coachDecisionSystem/" + f + "'");

const TAGGED = ['userStatedIntakeActivationGate.js', 'userKnowledgeContract.js', 'userStatedIntakeInterpreter.js', 'userStatedIntakeGate.js', 'userStatedIntake.js'];

test('AC-42: index.html tags the activation gate, the E.0.2c contract, the USI interpreter, gate and coordinator exactly once each, in dependency order, before the orchestrator', () => {
  TAGGED.forEach((f) => {
    assert.notEqual(tagIdx(f), -1, f + ' tagged');
    assert.equal(html.split('src="js/coachDecisionSystem/' + f + '"').length - 1, 1, f + ' tagged once');
  });
  const orch = tagIdx('internalPipelineOrchestrator.js');
  TAGGED.forEach((f) => assert.ok(tagIdx(f) < orch, f + ' before the orchestrator'));
  // the gate is read by Turn Understanding and CPI at module load
  assert.ok(tagIdx('userStatedIntakeActivationGate.js') < tagIdx('turnUnderstandingInterpreter.js'));
  assert.ok(tagIdx('userStatedIntakeActivationGate.js') < tagIdx('explicitPreferenceStatementInterpreter.js'));
  assert.ok(tagIdx('modelResponseEnvelope.js') < tagIdx('userStatedIntakeInterpreter.js'));
  assert.ok(tagIdx('userKnowledgeContract.js') < tagIdx('userStatedIntakeGate.js'));
  assert.ok(tagIdx('userStatedIntakeInterpreter.js') < tagIdx('userStatedIntake.js'));
  assert.ok(tagIdx('userStatedIntakeGate.js') < tagIdx('userStatedIntake.js'));
  // Node-only in this Work Item (no live persistence)
  ['userStatedIntakeExecutor.js', 'userKnowledgeStore.js', 'userKnowledgeTransitions.js'].forEach((f) => assert.equal(html.indexOf(f), -1, f + ' must not be tagged'));
});

test('AC-42: sw.js precaches the same five assets and VERSION / APP_VERSION are bumped in lockstep to 2.47.8', () => {
  TAGGED.forEach((f) => assert.notEqual(swIdx(f), -1, f + ' precached'));
  ['userStatedIntakeExecutor.js', 'userKnowledgeStore.js', 'userKnowledgeTransitions.js'].forEach((f) => assert.equal(sw.indexOf(f), -1, f));
  assert.equal(sw.match(/const VERSION = 'v([\d.]+)'/)[1], '2.47.8');
  assert.equal(app.match(/const APP_VERSION = '([\d.]+)'/)[1], '2.47.8');
});

test('AC-42 / wiring test 37: js/app.js configures UserStatedIntakeInterpreter with the real callClaude closure, and nothing else of USI-001', () => {
  const start = app.indexOf('UserStatedIntakeInterpreter.configure({');
  assert.notEqual(start, -1);
  const body = app.slice(start, app.indexOf('\n});', start));
  assert.match(body, /callClaude: function \(body\) \{ return callClaude\(body\); \}/);
  assert.equal(app.split('UserStatedIntakeInterpreter.configure(').length - 1, 1);
  assert.ok(start > app.indexOf('ExplicitPreferenceStatementInterpreter.configure({'), 'configured beside its sibling interpreters');
});

test('every script-tagged USI module\'s require()/window dependencies are tagged before it (REPAIR discipline)', () => {
  const depRe = /require\('\.\/([\w.-]+\.js)'\)\s*\n\s*:\s*window\.(\w+)/g;
  TAGGED.forEach((f) => {
    const src = read('js/coachDecisionSystem/' + f);
    let m;
    depRe.lastIndex = 0;
    while ((m = depRe.exec(src)) !== null) {
      assert.notEqual(tagIdx(m[1]), -1, f + ' requires untagged ' + m[1]);
      assert.ok(tagIdx(m[1]) < tagIdx(f), m[1] + ' must load before ' + f);
    }
  });
});
