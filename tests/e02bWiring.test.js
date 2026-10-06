// WP0 Phase E.0.2b — browser wiring (docs/specs/WP0_PHASE_E_0_2B_SEMANTIC_CONTEXT_DISCOVERY_SPEC_v1.0.md §21, §24; AC-21 wiring half).
// Source-text checks only.
// Run with: node --test tests/e02bWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const MODULE = 'js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js';

test('W-1: index.html loads the interpreter exactly once, after modelResponseEnvelope.js and before generalReasoningCapability.js', () => {
  const html = read('index.html');
  const tag = (f) => '<script src="' + f + '"></script>';
  assert.equal(html.split(tag(MODULE)).length - 1, 1);
  const iEnvelope = html.indexOf(tag('js/coachDecisionSystem/modelResponseEnvelope.js'));
  const iModule = html.indexOf(tag(MODULE));
  const iGr = html.indexOf(tag('js/coachDecisionSystem/generalReasoningCapability.js'));
  assert.ok(iEnvelope >= 0 && iModule > iEnvelope && iGr > iModule);
});

test('W-2: sw.js precaches the interpreter; sw.js VERSION and app.js APP_VERSION are bumped in lockstep to 2.47.9', () => {
  const sw = read('sw.js');
  assert.notEqual(sw.indexOf("'/fitme/" + MODULE + "'"), -1);
  assert.equal(sw.match(/const VERSION = 'v([\d.]+)'/)[1], '2.47.9');
  assert.equal(read('js/app.js').match(/const APP_VERSION = '([\d.]+)'/)[1], '2.47.9');
});

test('W-3: js/app.js configures the interpreter with the real production callClaude closure, and never calls discover()', () => {
  const app = read('js/app.js');
  const start = app.indexOf('SemanticContextDiscoveryInterpreter.configure(');
  assert.ok(start >= 0);
  const body = app.slice(start, app.indexOf('});', start) + 3);
  assert.match(body, /callClaude:\s*function \(body\) \{ return callClaude\(body\); \}/);
  const code = app.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n'); // explanatory comments may name the path
  assert.equal(code.indexOf('SemanticContextDiscoveryInterpreter.discover'), -1);
  assert.equal(code.indexOf('buildAuthorizedComposedContext('), -1);
});
