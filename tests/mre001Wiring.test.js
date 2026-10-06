// MRE-001 — static atomicity, dependency, browser load-order and service-worker checks
// (docs/specs/MRE_001_SPEC_v1.0.md §08, §13, §16 W-1 … W-5). Source-text checks only.
// Run with: node --test tests/mre001Wiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

// MRE-001 §04 — the 12 site-owning modules and their exact number of model-output parse sites (S1–S17).
const SITE_FILES = {
  'turnUnderstandingInterpreter.js': 2,            // S1 closed, S2 open
  'explicitPreferenceStatementInterpreter.js': 1,  // S3
  'explicitRequestInterpreter.js': 1,              // S4
  'readinessStateInterpreter.js': 1,               // S5
  'activityPreferenceInterpreter.js': 1,           // S6
  'activityOppositionInterpreter.js': 1,           // S7
  'situationalContextInterpreter.js': 1,           // S8
  'safetyContextInterpreter.js': 2,                // S9, S10
  'userSafetyProvenanceInterpreter.js': 1,         // S11
  'riskCharacteristicInterpreter.js': 4,           // S12–S15
  'trainingReadinessReasoningComponent.js': 1,     // S16
  'generalReasoningCapability.js': 1,              // S17
  'semanticContextDiscoveryInterpreter.js': 1,     // S18 — WP0 Phase E.0.2b (authorized compatibility update)
  'userStatedIntakeInterpreter.js': 1,             // S19 — USI-001 (authorized update, USI_001_SPEC_v1.0.md §29)
  'consolidationInterpreter.js': 1,                // S20 — WP0 Phase E.0.2d (authorized update, E.0.2d SPEC §29 edit 1)
  'consolidationVerifier.js': 1                    // S21 — WP0 Phase E.0.2d v1.1 Verifier (authorized update, E.0.2d SPEC v1.1 §29.2)
};
// E.0.2d SPEC §29.1 edit 5 (implementation-discovered test-compatibility clarification): site owners
// that are Node-only by canon. W-3 asserts they are NOT script-tagged instead of checking load order.
const NODE_ONLY_SITE_FILES = ['consolidationInterpreter.js', 'consolidationVerifier.js']; // + E.0.2d SPEC v1.1 §29.2
const WRAPPED = /JSON\.parse\(ModelResponseEnvelope\.unwrapSingleJsonFence\(/g;
const DEPENDENCY = /var ModelResponseEnvelope = \(typeof module !== 'undefined' && module\.exports\)\s*\n\s*\? require\('\.\/modelResponseEnvelope\.js'\)\s*\n\s*: window\.ModelResponseEnvelope;/;

test('W-1 (atomicity): every JSON.parse in every site-owning module goes through the shared envelope — exactly 21 sites, none left unconverted', () => {
  let total = 0;
  for (const [file, expected] of Object.entries(SITE_FILES)) {
    const src = codeOnly(read('js/coachDecisionSystem/' + file));
    const all = (src.match(/JSON\.parse\(/g) || []).length;
    const wrapped = (src.match(WRAPPED) || []).length;
    assert.equal(all, expected, file + ': unexpected number of JSON.parse sites');
    assert.equal(wrapped, all, file + ': a JSON.parse site is not routed through the envelope');
    assert.match(src, DEPENDENCY, file + ': missing the standard ModelResponseEnvelope dependency declaration');
    total += wrapped;
  }
  assert.equal(total, 21);
});

test('W-1 (coverage): no other Coach Decision System module parses model output with JSON.parse (capabilityRegistry.js deep clone is the only excluded, non-model use)', () => {
  const dir = path.join(ROOT, 'js/coachDecisionSystem');
  fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => {
    const src = codeOnly(fs.readFileSync(path.join(dir, f), 'utf8'));
    const all = (src.match(/JSON\.parse\(/g) || []).length;
    const wrapped = (src.match(WRAPPED) || []).length;
    if (f === 'capabilityRegistry.js') {
      assert.equal(all, 1);
      assert.match(src, /JSON\.parse\(JSON\.stringify\(def\.needShapeDefaults\)\)/);
      return;
    }
    if (f === 'modelResponseEnvelope.js') { assert.equal(all, 0); return; }
    assert.equal(all, wrapped, f + ' has an unconverted JSON.parse');
    if (all > 0) assert.ok(Object.prototype.hasOwnProperty.call(SITE_FILES, f), f + ' is not a listed MRE-001 site owner');
  });
});

test('W-2: no Coach Decision System module uses the permissive JsonUtils / parseModelJSON (code, excluding explanatory comments)', () => {
  const dir = path.join(ROOT, 'js/coachDecisionSystem');
  fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => {
    const src = codeOnly(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.equal(/JsonUtils|parseModelJSON|jsonUtils\.js/.test(src), false, f);
  });
});

test('W-3: index.html script-tags modelResponseEnvelope.js exactly once, before every site-owning module', () => {
  const html = read('index.html');
  const tag = 'src="js/coachDecisionSystem/modelResponseEnvelope.js"';
  assert.equal(html.split(tag).length - 1, 1);
  const envIdx = html.indexOf(tag);
  for (const file of Object.keys(SITE_FILES)) {
    const idx = html.indexOf('src="js/coachDecisionSystem/' + file + '"');
    if (NODE_ONLY_SITE_FILES.indexOf(file) !== -1) {
      assert.equal(idx, -1, file + ' is Node-only and must NOT be script-tagged (E.0.2d SPEC §08, AC-D40, §29.1)');
      continue;
    }
    assert.notEqual(idx, -1, file + ' must be script-tagged');
    assert.ok(envIdx < idx, 'modelResponseEnvelope.js must load before ' + file);
  }
});

test('W-4: sw.js precaches the new module and sw.js VERSION / app.js APP_VERSION are bumped in lockstep to 2.47.9', () => {
  const sw = read('sw.js');
  const app = read('js/app.js');
  assert.notEqual(sw.indexOf("'/fitme/js/coachDecisionSystem/modelResponseEnvelope.js'"), -1);
  assert.equal(sw.match(/const VERSION = 'v([\d.]+)'/)[1], '2.47.9');
  assert.equal(app.match(/const APP_VERSION = '([\d.]+)'/)[1], '2.47.9');
});

test('W-5: modelResponseEnvelope.js is pure — no dependencies, globals read, clock, randomness, I/O, logging or JSON parsing', () => {
  const src = codeOnly(read('js/coachDecisionSystem/modelResponseEnvelope.js'));
  assert.equal(/require\(/.test(src), false);
  assert.equal(/\bDate\b|Math\.random|fetch\(|console\.|JSON\.parse|localStorage|XMLHttpRequest/.test(src), false);
  const windowUses = src.match(/window\.[A-Za-z]+/g) || [];
  assert.deepEqual(windowUses, ['window.ModelResponseEnvelope'], 'the only window reference is its own export');
  assert.match(src, /window\.ModelResponseEnvelope = API;/);
  assert.match(src, /module\.exports = API;/);
});

test('scope: General Reasoning remains non-live — the orchestrator and Need Creator still never reference it or its activation gate', () => {
  ['internalPipelineOrchestrator.js', 'conversationalNeedCreator.js'].forEach((f) => {
    const src = read('js/coachDecisionSystem/' + f);
    assert.equal(/GeneralReasoningCapability|GeneralReasoningActivationGate/.test(src), false, f);
  });
  assert.equal(require('../js/coachDecisionSystem/generalReasoningActivationGate.js').isLiveFallbackApproved(), false);
});

test('scope: no Structured Outputs / request-body change — no site-owning module or the proxy client sends output_config or output_format', () => {
  Object.keys(SITE_FILES).concat(['../adapters/claudeProxyClient.js']).forEach((f) => {
    const src = read(path.join('js/coachDecisionSystem', f));
    assert.equal(/output_config|output_format|json_schema/.test(src), false, f);
  });
});
