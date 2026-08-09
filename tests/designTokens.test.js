// TASK-008 WP1 — Design Token tests (TASK_008_SPEC_v1.0.md §7-§11;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP1).
// Verifies: every semantic color token resolves to an existing primitive token via a
// var() reference, never a raw color literal (§7.1, §8.2); the sixteen color primitives
// and three radius primitives are byte-identical to their pre-WP1 values (OD-8008-4a/4b
// not decided by this Work Package); the spacing scale contains exactly the fourteen
// already-observed pixel values, introducing no new numeric value (§10.1); no fourth
// radius tier was added (§11.2, not resolved by this Work Package).
// Run with: node --test tests/designTokens.test.js

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

const PRIMITIVE_COLOR_NAMES = [
  '--bg', '--bg-2', '--bg-3', '--text', '--text-2', '--text-3',
  '--border', '--border-2', '--gold', '--gold-2', '--gold-3', '--gold-light',
  '--red', '--red-light', '--teal', '--teal-light'
];

const SEMANTIC_COLOR_NAMES = [
  '--color-primary', '--color-primary-emphasis', '--color-primary-subtle',
  '--color-success', '--color-success-subtle', '--color-danger', '--color-danger-subtle',
  '--color-neutral', '--color-surface', '--color-surface-subtle', '--color-surface-muted',
  '--color-border', '--color-border-strong', '--color-text', '--color-text-secondary',
  '--color-text-tertiary'
];

const EXPECTED_SPACE_VALUES_PX = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 52];

const EXPECTED_LIGHT_PRIMITIVES = {
  '--bg': '#FAF7F2', '--bg-2': '#F2EDE4', '--bg-3': '#E8E1D6',
  '--text': '#1C1208', '--text-2': '#5A4020', '--text-3': '#C0A880',
  '--border': 'rgba(120,80,30,0.10)', '--border-2': 'rgba(120,80,30,0.16)',
  '--gold': '#8B5E1A', '--gold-2': '#A07840', '--gold-3': '#C0A060', '--gold-light': '#F2E8D0',
  '--red': '#A83220', '--red-light': '#FAEDE9', '--teal': '#1A6B50', '--teal-light': '#E0F0E8',
  '--radius': '14px', '--radius-sm': '9px', '--radius-lg': '20px'
};

test('every semantic color token resolves via var(), never a raw color literal', () => {
  const decls = extractDeclarations(css);
  for (const name of SEMANTIC_COLOR_NAMES) {
    const matches = decls.filter((d) => d.name === name);
    assert.equal(matches.length, 1, `expected exactly one declaration for ${name}, found ${matches.length}`);
    assert.match(
      matches[0].value,
      /^var\(--[a-zA-Z0-9-]+\)$/,
      `${name} must resolve via var(--primitive), got "${matches[0].value}"`
    );
  }
});

test('every semantic color token references a known, existing primitive', () => {
  const decls = extractDeclarations(css);
  const known = new Set(PRIMITIVE_COLOR_NAMES);
  for (const name of SEMANTIC_COLOR_NAMES) {
    const decl = decls.find((d) => d.name === name);
    const ref = decl.value.match(/^var\((--[a-zA-Z0-9-]+)\)$/)[1];
    assert.ok(known.has(ref), `${name} references "${ref}", which is not one of the sixteen existing color primitives`);
  }
});

test('the sixteen color primitives and three radius primitives are unchanged from their pre-WP1 values', () => {
  const rootBlockMatch = css.match(/:root\s*{([^}]*)}/);
  assert.ok(rootBlockMatch, 'expected a :root block to exist');
  const rootDecls = extractDeclarations(rootBlockMatch[1]);
  for (const [name, expectedValue] of Object.entries(EXPECTED_LIGHT_PRIMITIVES)) {
    const decl = rootDecls.find((d) => d.name === name);
    assert.ok(decl, `${name} missing from the primitive :root block`);
    assert.equal(
      decl.value.replace(/\s+/g, ''),
      expectedValue.replace(/\s+/g, ''),
      `${name}'s value changed — OD-8008-4a/4b are not decided by WP1`
    );
  }
});

test('no fourth radius tier was added anywhere in the stylesheet', () => {
  const allRadiusNames = extractDeclarations(css)
    .filter((d) => /^--radius(-|$)/.test(d.name))
    .map((d) => d.name);
  const uniqueNames = new Set(allRadiusNames);
  assert.equal(
    uniqueNames.size,
    3,
    `expected exactly 3 distinct radius primitive names (--radius, --radius-sm, --radius-lg), found: ${[...uniqueNames].join(', ')}`
  );
});

test('the spacing scale contains exactly the fourteen already-observed pixel values, no new value introduced', () => {
  const decls = extractDeclarations(css);
  const spaceDecls = decls.filter((d) => /^--space-\d+$/.test(d.name));
  assert.equal(spaceDecls.length, 14, `expected 14 spacing tokens, found ${spaceDecls.length}`);
  const values = spaceDecls
    .map((d) => {
      assert.match(d.value, /^\d+px$/, `${d.name}'s value "${d.value}" is not a plain px literal`);
      return parseInt(d.value, 10);
    })
    .sort((a, b) => a - b);
  assert.deepEqual(values, EXPECTED_SPACE_VALUES_PX);
});
