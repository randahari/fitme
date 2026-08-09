// TASK-008 WP11 — WCAG AA remediation for the three pairings discovered during Home/Food
// screen migration (TASK_008_SPEC_v1.0.md §20.1/§20.2, OD-11a/OD-11b; Product/Architecture
// Decision Package, WP11 WCAG Resolution — Approved Option B/C).
// No primitive token value is changed. Only the semantic-token *reference* at each verified-
// failing selector was swapped to an existing, already-passing semantic token:
//   - --color-text-tertiary -> --color-text-secondary, at every Home/Food selector confirmed
//     rendering on --color-surface or --color-surface-subtle (WCAG 1.4.3, 4.5:1 normal text).
//   - .send-btn's icon color: white -> var(--color-surface) (WCAG 1.4.11, 3:1 non-text/icon,
//     since it is an inline SVG with stroke="currentColor", not text).
// Every other consumer of --color-text-tertiary (.seg-btn, .plan-tab, .wd-badge.rest — none of
// which render on Home or Food) is deliberately left untouched, per the Decision Package's
// scope boundary; their WCAG status remains unverified, carried forward for a future Work
// Package. (.food-tag was in this set at WP11 time; WP13 found it renders on Onboarding and
// resolved it via the Semantic Token Usage Contract's Option E — see
// tests/onboardingLoginBarcodeTokenMigration.test.js.)
// Run with: node --test tests/wcagContrastRemediation.test.js

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
  while ((m = re.exec(source))) decls.push({ name: m[1], value: m[2].trim() });
  return decls;
}

function resolveToken(name, allDecls) {
  let v = name;
  let guard = 0;
  while (/^--[a-zA-Z0-9-]+$/.test(v) && guard++ < 10) {
    const decl = allDecls.find((d) => d.name === v);
    assert.ok(decl, `unresolved token ${v}`);
    v = decl.value.trim();
  }
  return v;
}

function resolve(value, allDecls) {
  let v = value.trim();
  let guard = 0;
  while (/var\(--[a-zA-Z0-9-]+\)/.test(v) && guard++ < 10) {
    v = v.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, name) => resolveToken(name, allDecls));
  }
  return v;
}

function ruleBody(selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = css.match(re);
  assert.ok(m, `selector ${selector} not found`);
  return m[1];
}

function propValue(body, prop) {
  const m = body.match(new RegExp(prop.replace(/-/g, '\\-') + ':\\s*([^;]+);'));
  return m && m[1].trim();
}

const allDecls = extractDeclarations(css);
const darkDecls = extractDeclarations(css.match(/body\.dark\s*{([^}]*)}/)[1]);
const merged = allDecls.map((d) => darkDecls.find((dd) => dd.name === d.name) || d);

// WCAG 2.1 relative-luminance contrast ratio (same formula used by the Decision Package).
function lin(c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(hex1, hex2) {
  const l1 = lum(hex1), l2 = lum(hex2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const FIXED_SELECTORS = [
  '.topbar-greeting', '.ring-pct-lbl', '.ring-kcal-of', '.ring-mac-lbl', '.stat-l',
  '.week-day', '.meal-time', '.section-header', '.quick-head', '.ai-loading',
  '.rm-label', '.food-tab', '.empty-state', '.quick-chip span'
];

test('none of the fixed selectors reference --color-text-tertiary any more', () => {
  for (const sel of FIXED_SELECTORS) {
    assert.equal(propValue(ruleBody(sel), 'color'), 'var(--color-text-secondary)', `${sel} color`);
  }
});

test('the remaining out-of-WP11-scope consumers of --color-text-tertiary are untouched (not part of this remediation)', () => {
  for (const sel of ['.seg-btn', '.plan-tab']) {
    assert.equal(propValue(ruleBody(sel), 'color'), 'var(--color-text-tertiary)', `${sel} color`);
  }
  assert.equal(propValue(ruleBody('.wd-badge.rest'), 'color'), 'var(--color-text-tertiary)');
});

test('the primitive token layer is unchanged (no --text-*, --bg-*, --gold* value edited)', () => {
  const primitives = ['--text', '--text-2', '--text-3', '--bg', '--bg-2', '--bg-3', '--gold', '--gold-2'];
  const expectedLight = { '--text': '#1C1208', '--text-2': '#5A4020', '--text-3': '#C0A880', '--bg': '#FAF7F2', '--bg-2': '#F2EDE4', '--bg-3': '#E8E1D6', '--gold': '#8B5E1A', '--gold-2': '#A07840' };
  const expectedDark = { '--text': '#F0E8D4', '--text-2': '#C8A870', '--text-3': '#7A6040', '--bg': '#1A1510', '--bg-2': '#231C14', '--bg-3': '#2E2418', '--gold': '#C8983A', '--gold-2': '#A07840' };
  for (const name of primitives) {
    assert.equal(allDecls.find((d) => d.name === name).value, expectedLight[name], `${name} light`);
    assert.equal(darkDecls.find((d) => d.name === name).value, expectedDark[name], `${name} dark`);
  }
});

test('.send-btn keeps its background on --color-primary and no other property changed', () => {
  const body = ruleBody('.send-btn');
  assert.equal(propValue(body, 'background'), 'var(--color-primary)');
  assert.equal(propValue(body, 'color'), 'var(--color-surface)');
  assert.equal(propValue(body, 'width'), '46px');
  assert.equal(propValue(body, 'height'), '46px');
});

test('WCAG 2.1 AA: every remediated text pairing now clears 4.5:1 (normal text, 1.4.3) in both modes', () => {
  const lightFg = resolve('var(--color-text-secondary)', allDecls);
  const lightBgSurface = resolve('var(--color-surface)', allDecls);
  const lightBgSubtle = resolve('var(--color-surface-subtle)', allDecls);
  const darkFg = resolve('var(--color-text-secondary)', merged);
  const darkBgSurface = resolve('var(--color-surface)', merged);
  const darkBgSubtle = resolve('var(--color-surface-subtle)', merged);

  assert.ok(contrastRatio(lightFg, lightBgSurface) >= 4.5, 'text-secondary on surface (light)');
  assert.ok(contrastRatio(darkFg, darkBgSurface) >= 4.5, 'text-secondary on surface (dark)');
  assert.ok(contrastRatio(lightFg, lightBgSubtle) >= 4.5, 'text-secondary on surface-subtle (light)');
  assert.ok(contrastRatio(darkFg, darkBgSubtle) >= 4.5, 'text-secondary on surface-subtle (dark)');
});

test('WCAG 2.1 AA: the send-btn icon now clears 3:1 (non-text/UI-component, 1.4.11) in both modes', () => {
  const lightIcon = resolve('var(--color-surface)', allDecls);
  const lightBg = resolve('var(--color-primary)', allDecls);
  const darkIcon = resolve('var(--color-surface)', merged);
  const darkBg = resolve('var(--color-primary)', merged);

  assert.ok(contrastRatio(lightIcon, lightBg) >= 3, 'icon on primary (light)');
  assert.ok(contrastRatio(darkIcon, darkBg) >= 3, 'icon on primary (dark), previously failing at 2.62:1');
});
