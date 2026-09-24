// OU-001 — static wiring / scope-purity assertions (docs/specs/OU_001_SPEC_v1.0.md §16, §17,
// §20, §21, §22 AC-19/AC-20/AC-25/AC-30). Source-text checks only; no module is executed except to
// read exported constants.
// Run with: node --test tests/ou001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const OPEN_REFS = /openUnderstanding|openScopeDescription|openEntityMentions/;

function listJs(dir) {
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.js')) out.push(p);
    }
  })(dir);
  return out;
}

test('AC-19 (static): memoryLayer.js never references OpenUnderstanding or the Need open fields', () => {
  assert.equal(OPEN_REFS.test(read('js/coachDecisionSystem/memoryLayer.js')), false);
});

test('AC-20 (static): persistence, telemetry, Safety, intake, Decision Formation and Expression modules never reference OpenUnderstanding or the Need open fields', () => {
  const files = [
    'js/app.js', 'js/memory.js', 'js/errorTelemetry.js', 'js/persistenceGateway.js',
    'js/coachDecisionSystem/safetyLayer.js', 'js/coachDecisionSystem/safetyContextInterpreter.js',
    'js/coachDecisionSystem/userSafetyProvenanceInterpreter.js', 'js/coachDecisionSystem/riskCharacteristicInterpreter.js',
    'js/coachDecisionSystem/riskCharacteristicValidator.js', 'js/coachDecisionSystem/safetyIntegrationPort.js',
    'js/coachDecisionSystem/safetyDisclosureIntakeGate.js', 'js/coachDecisionSystem/preferenceIntakeGate.js',
    'js/coachDecisionSystem/riskCharacteristicIntakeGate.js', 'js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js',
    'js/coachDecisionSystem/decisionFormation.js', 'js/coachDecisionSystem/expressionRenderer.js',
    'js/coachDecisionSystem/expressionInputGate.js', 'js/coachDecisionSystem/expressionRenderingContext.js',
    'js/coachDecisionSystem/deliveryIntentContract.js', 'js/coachDecisionSystem/userDisclosureRecognizer.js'
  ].concat(listJs('js/repositories'));
  files.forEach((f) => assert.equal(OPEN_REFS.test(read(f)), false, f + ' references OpenUnderstanding'));
});

test('AC-25 (static): turnUnderstandingInterpreter.js and conversationalNeedCreator.js contain no roughKind, NEED_SHAPES, CONTEXT_RELEVANCE_KINDS reference and no shape property write', () => {
  ['js/coachDecisionSystem/turnUnderstandingInterpreter.js', 'js/coachDecisionSystem/conversationalNeedCreator.js'].forEach((f) => {
    const src = read(f);
    assert.equal(/roughKind/.test(src), false, f);
    assert.equal(/NEED_SHAPES/.test(src), false, f);
    assert.equal(/CONTEXT_RELEVANCE_KINDS/.test(src), false, f);
    assert.equal(/\bshape\s*:/.test(src), false, f);
  });
});

test('single model call: turnUnderstandingInterpreter.js contains exactly one deps.callClaude( invocation and one model id', () => {
  const src = codeOnly(read('js/coachDecisionSystem/turnUnderstandingInterpreter.js'));
  assert.equal((src.match(/deps\.callClaude\(/g) || []).length, 1);
  assert.equal((src.match(/claude-haiku-4-5-20251001/g) || []).length, 1);
  assert.equal(/TIMEOUT_MS = 8000;/.test(src), true);
});

test('orchestrator: calls understand() with recent conversation, and openUnderstanding appears only in its local handling and the Need Creator call', () => {
  const src = codeOnly(read('js/coachDecisionSystem/internalPipelineOrchestrator.js'));
  assert.match(src, /TurnUnderstandingInterpreter\.understand\(turn, pipelineContext\.recentConversationContext\)/);
  assert.equal(/TurnUnderstandingInterpreter\.classify\(/.test(src), false);
  const lines = src.split('\n').filter((l) => /openUnderstanding/.test(l)).map((l) => l.trim());
  assert.deepEqual(lines, [
    'var openUnderstanding;',
    'openUnderstanding = understanding.openUnderstanding;',
    'openUnderstanding = null;',
    'var needCreatorResult = ConversationalNeedCreator.recognizeDirectUserNeed(turn, turnUnderstanding, pipelineContext, openUnderstanding);'
  ]);
  assert.equal(/openScopeDescription|openEntityMentions/.test(src), false);
});

test('AC-30 (static): General Reasoning remains non-live — the orchestrator and Need Creator never reference it or its activation gate', () => {
  const orchestrator = read('js/coachDecisionSystem/internalPipelineOrchestrator.js');
  const needCreator = read('js/coachDecisionSystem/conversationalNeedCreator.js');
  [orchestrator, needCreator].forEach((src) => {
    assert.equal(/GeneralReasoningCapability/.test(src), false);
    assert.equal(/GeneralReasoningActivationGate/.test(src), false);
  });
  assert.equal(require('../js/coachDecisionSystem/generalReasoningActivationGate.js').isLiveFallbackApproved(), false);
});

test('Need Creator: registryNeed still carries only legacyScopeMatch', () => {
  const src = codeOnly(read('js/coachDecisionSystem/conversationalNeedCreator.js'));
  assert.match(src, /var registryNeed = \{ legacyScopeMatch: \(need\.domain != null && need\.topic != null\) \? \{ domain: need\.domain, topic: need\.topic \} : null \};/);
});

test('legacy records unchanged: NEED_SHAPES remains the dormant eight-value vocabulary; clarificationContext stays inert in the Coach Decision System', () => {
  const CapabilityRegistry = require('../js/coachDecisionSystem/capabilityRegistry.js');
  assert.deepEqual([...CapabilityRegistry.NEED_SHAPES], ['REQUEST_FOR_ACTION', 'REQUEST_FOR_INFORMATION', 'DISCLOSURE', 'PLANNING', 'COMPARISON', 'RECOMMENDATION_REQUEST', 'FOLLOW_UP', 'MULTI_NEED']);
  listJs('js/coachDecisionSystem').forEach((f) => assert.equal(/clarificationContext/.test(read(f)), false, f));
});

test('calibration script: opt-in only (not matched by tests/*.test.js), credential from the environment only, never the production proxy', () => {
  const rel = 'tests/evals/ou001Calibration.eval.js';
  assert.ok(fs.existsSync(path.join(ROOT, rel)));
  assert.equal(/\.test\.js$/.test(rel), false);
  const src = read(rel);
  assert.match(src, /process\.env\.ANTHROPIC_API_KEY/);
  assert.equal(/sk-ant-[A-Za-z0-9]/.test(src), false, 'no literal credential');
  assert.equal(/anthropicProxy|cloudfunctions\.net/.test(src), false, 'never the production proxy');
  assert.equal(/\.env\b/.test(src.replace(/process\.env/g, '')), false, 'no .env file handling');
  assert.equal(/console\.(log|error|warn)\([^)]*(API_KEY|apiKey|x-api-key)/.test(src), false, 'credential never logged');
});
