// WP0 Phase C — General Reasoning Activation Gate tests (docs/specs/WP0_SPEC_v1.0.md §22).
// Run with: node --test tests/generalReasoningActivationGate.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Gate = require('../js/coachDecisionSystem/generalReasoningActivationGate.js');

test.afterEach(() => { Gate.__setLiveFallbackApprovedForTests__(false); });

test('BINDING DEFAULT: isLiveFallbackApproved() is false immediately on module load, before any test touches it', () => {
  // Fresh require in a subprocess proves the module-load-time default, not merely the
  // afterEach-reset state.
  const { execSync } = require('node:child_process');
  const out = execSync('node -e "console.log(require(\'./js/coachDecisionSystem/generalReasoningActivationGate.js\').isLiveFallbackApproved())"', { cwd: path.join(__dirname, '..') }).toString().trim();
  assert.equal(out, 'false');
});

test('__setLiveFallbackApprovedForTests__(true) flips it, and (false) flips it back', () => {
  assert.equal(Gate.isLiveFallbackApproved(), false);
  Gate.__setLiveFallbackApprovedForTests__(true);
  assert.equal(Gate.isLiveFallbackApproved(), true);
  Gate.__setLiveFallbackApprovedForTests__(false);
  assert.equal(Gate.isLiveFallbackApproved(), false);
});

test('__setLiveFallbackApprovedForTests__ coerces any non-true value to false (fail-closed on malformed input)', () => {
  Gate.__setLiveFallbackApprovedForTests__('yes');
  assert.equal(Gate.isLiveFallbackApproved(), false);
  Gate.__setLiveFallbackApprovedForTests__(1);
  assert.equal(Gate.isLiveFallbackApproved(), false);
});

test('no production file calls __setLiveFallbackApprovedForTests__ — only test files may flip the gate (requirement 6)', () => {
  const jsDir = path.join(__dirname, '../js');
  function walk(dir) {
    let matches = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) matches = matches.concat(walk(full));
      else if (entry.name.endsWith('.js')) {
        const src = fs.readFileSync(full, 'utf8');
        if (/__setLiveFallbackApprovedForTests__\s*\(/.test(src) && !full.includes('generalReasoningActivationGate.js')) {
          matches.push(full);
        }
      }
    });
    return matches;
  }
  assert.deepEqual(walk(jsDir), []);
});

test('app.js DOES call GeneralReasoningCapability.configure() with the same production callClaude closure as every other bounded reasoning component (matches the codebase\'s own coachDecisionSystemWiring.test.js invariant that no callClaude:null-default component ships unconfigured) — reachability safety rests entirely on the routing-seam exclusion, not on withholding this configuration', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.equal(/GeneralReasoningCapability\.configure\s*\(\s*\{\s*callClaude/.test(appJs), true);
});

test('conversationalNeedCreator.js never references GeneralReasoningActivationGate or GENERAL_REASONING at all (the live routing seam is unaware of General Reasoning\'s existence in Phase C, per its own structural exclusion)', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/conversationalNeedCreator.js'), 'utf8');
  assert.equal(/GeneralReasoningActivationGate/.test(src), false);
  assert.equal(/GENERAL_REASONING/.test(src), false);
});

test('internalPipelineOrchestrator.js never references GeneralReasoningCapability or GeneralReasoningActivationGate (Phase C does not wire it into the live pipeline)', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/internalPipelineOrchestrator.js'), 'utf8');
  assert.equal(/GeneralReasoningCapability/.test(src), false);
  assert.equal(/GeneralReasoningActivationGate/.test(src), false);
});
