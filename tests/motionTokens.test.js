// TASK-008 WP3 — Motion Token tests (TASK_008_SPEC_v1.0.md §13;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP3).
// Verifies: the spin/scan keyframe animations' duration/easing values are formalized as
// tokens, unchanged from their existing values; neither keyframe declaration nor its
// consuming selector was rewritten to consume the new tokens (no consumer migrated yet,
// matching WP1/WP2's own token-only precedent); the existing prefers-reduced-motion guard
// (added by TASK-007) remains present and unchanged; the unrelated transition timings
// elsewhere in the file were not touched.
// Run with: node --test tests/motionTokens.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const css = fs.readFileSync(CSS_PATH, 'utf8');

function extractDeclarations(source) {
  const decls = [];
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(source))) {
    decls.push({ name: m[1], value: m[2].trim() });
  }
  return decls;
}

test('the four motion tokens exist with the exact pre-existing spin/scan values', () => {
  const decls = extractDeclarations(css);
  const expected = {
    '--duration-spin': '0.8s',
    '--easing-spin': 'linear',
    '--duration-scan': '2s',
    '--easing-scan': 'ease-in-out'
  };
  for (const [name, value] of Object.entries(expected)) {
    const decl = decls.find((d) => d.name === name);
    assert.ok(decl, `${name} is missing`);
    assert.equal(decl.value, value);
  }
});

test('the spin and scan keyframe declarations are unchanged (no consumer migrated by this Work Package)', () => {
  assert.match(css, /animation:\s*spin\s+0\.8s\s+linear\s+infinite\s*;/, '.spinner animation declaration changed');
  assert.match(css, /@keyframes spin\s*\{\s*to\s*\{\s*transform:\s*rotate\(360deg\)\s*;\s*\}\s*\}/, '@keyframes spin changed');
  assert.match(css, /animation:\s*scan\s+2s\s+ease-in-out\s+infinite\s*;/, '.barcode-line animation declaration changed');
  assert.match(css, /@keyframes scan\s*\{\s*0%,100%\s*\{\s*top:\s*10%;\s*\}\s*50%\s*\{\s*top:\s*90%;\s*\}\s*\}/, '@keyframes scan changed');
});

test('the existing prefers-reduced-motion guard is present and unchanged', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'prefers-reduced-motion media query is missing');
  assert.match(css, /\.spinner\s*\{\s*animation:\s*none;\s*\}/, '.spinner reduced-motion override changed');
  assert.match(css, /\.barcode-line\s*\{\s*animation:\s*none;\s*\}/, '.barcode-line reduced-motion override changed');
});

test('unrelated transition timings elsewhere in the file were not touched', () => {
  const durations = (css.match(/transition:[^;]*[\d.]+s/g) || []).map((s) => s.match(/[\d.]+s/)[0]);
  const distinct = [...new Set(durations)].sort();
  assert.deepEqual(distinct, ['0.15s', '0.2s', '0.3s'], 'the set of transition-only durations changed');
});
