// TASK-008 WP2 — Typography Token tests (TASK_008_SPEC_v1.0.md §9;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP2).
// Verifies: the font-family token reuses the existing literal unchanged; the font-size
// scale contains exactly the eighteen already-observed pixel values, introducing no new
// value; the font-weight scale offers only the four already-loaded weights (400/500/700/
// 800) and never 600 (§9.3); the fourteen existing `font-weight: 600` declarations are
// left untouched by this Work Package (no consumer migrated yet).
// Run with: node --test tests/typographyTokens.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const HTML_PATH = path.join(__dirname, '..', 'index.html');
const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8');

function extractDeclarations(source) {
  const decls = [];
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(source))) {
    decls.push({ name: m[1], value: m[2].trim() });
  }
  return decls;
}

const EXPECTED_FONT_SIZES_PX = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 36, 40, 52];
const LOADED_WEIGHTS = [400, 500, 700, 800];

test('the font-family token reuses the existing literal, unchanged', () => {
  const decls = extractDeclarations(css);
  const decl = decls.find((d) => d.name === '--font-family-base');
  assert.ok(decl, '--font-family-base is missing');
  assert.equal(decl.value, "'Heebo', -apple-system, sans-serif");
});

test('the font-size scale contains exactly the eighteen already-observed pixel values, no new value introduced', () => {
  const decls = extractDeclarations(css);
  const sizeDecls = decls.filter((d) => /^--font-size-\d+$/.test(d.name));
  assert.equal(sizeDecls.length, 18, `expected 18 font-size tokens, found ${sizeDecls.length}`);
  const values = sizeDecls
    .map((d) => {
      assert.match(d.value, /^\d+px$/, `${d.name}'s value "${d.value}" is not a plain px literal`);
      return parseInt(d.value, 10);
    })
    .sort((a, b) => a - b);
  assert.deepEqual(values, EXPECTED_FONT_SIZES_PX);
});

test('the font-weight scale offers only the four already-loaded weights, never 600', () => {
  const decls = extractDeclarations(css);
  const weightDecls = decls.filter((d) => /^--font-weight-[a-z]+$/.test(d.name));
  assert.equal(weightDecls.length, 4, `expected 4 font-weight tokens, found ${weightDecls.length}`);
  const values = weightDecls.map((d) => parseInt(d.value, 10)).sort((a, b) => a - b);
  assert.deepEqual(values, LOADED_WEIGHTS);
  assert.ok(!values.includes(600), 'font-weight scale must never offer 600, the unloaded weight');
});

test('index.html still loads exactly weights 400/500/700/800 (WP2 did not add a network request)', () => {
  const match = html.match(/fonts\.googleapis\.com\/css2\?family=Heebo:wght@([\d;]+)/);
  assert.ok(match, 'expected the Heebo Google Fonts <link> to still be present');
  const loaded = match[1].split(';').map((n) => parseInt(n, 10)).sort((a, b) => a - b);
  assert.deepEqual(loaded, LOADED_WEIGHTS);
});

test('the fourteen existing font-weight:600 declarations are left untouched by this Work Package', () => {
  // Matches actual CSS declarations only (terminated by `;`), not this file's own
  // explanatory comment prose, which also contains the literal string "font-weight: 600".
  const count = (css.match(/font-weight:\s*600\s*;/g) || []).length;
  assert.equal(count, 14, `expected the original 14 font-weight:600 declarations to remain untouched, found ${count}`);
});
