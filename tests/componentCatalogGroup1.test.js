// TASK-008 WP7 — Component Catalog Group 1 tests (button, toggle, empty-state;
// TASK_008_SPEC_v1.0.md §17-§18; docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP7).
// These three categories were already single/consolidated implementations (§24.2:
// "Retained") — no consolidation decision was needed, only migration to WP1/WP2's
// tokens. The critical regression guard: every migrated declaration must resolve,
// through its token chain, to the EXACT pre-WP7 raw value — proving zero visible
// change, not merely that a token was used.
// Run with: node --test tests/componentCatalogGroup1.test.js

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

// Resolve a var(--x) chain to its final literal value, using the full file's tokens.
function resolve(value, allDecls) {
  let v = value.trim();
  let guard = 0;
  while (/^var\(--[a-zA-Z0-9-]+\)$/.test(v) && guard++ < 10) {
    const name = v.match(/^var\((--[a-zA-Z0-9-]+)\)$/)[1];
    const decl = allDecls.find((d) => d.name === name);
    assert.ok(decl, `unresolved token ${name}`);
    v = decl.value.trim();
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

test('.btn-primary resolves to its exact pre-WP7 values (padding 14px, color #8B5E1A, font-size 15px, font-weight 500)', () => {
  const body = ruleBody('.btn-primary');
  assert.equal(resolve(propValue(body, 'padding'), allDecls), '14px');
  assert.equal(resolve(propValue(body, 'background'), allDecls), '#8B5E1A');
  assert.equal(resolve(propValue(body, 'font-size'), allDecls), '15px');
  assert.equal(resolve(propValue(body, 'font-weight'), allDecls), '500');
  assert.equal(propValue(body, 'font-family'), "'Heebo', sans-serif", 'font-family must remain the untouched literal');
});

test('.btn-ghost resolves to its exact pre-WP7 values (padding 12px, color #5A4020, border-color rgba(120,80,30,0.16), margin-top 8px)', () => {
  const body = ruleBody('.btn-ghost');
  assert.equal(resolve(propValue(body, 'padding'), allDecls), '12px');
  assert.equal(resolve(propValue(body, 'color'), allDecls), '#5A4020');
  const border = propValue(body, 'border');
  const borderColorToken = border.match(/var\((--[a-zA-Z0-9-]+)\)$/)[1];
  assert.equal(resolve(`var(${borderColorToken})`, allDecls).replace(/\s+/g, ''), 'rgba(120,80,30,0.16)');
  assert.equal(resolve(propValue(body, 'margin-top'), allDecls), '8px');
});

test('.btn-small resolves to its exact pre-WP7 values (padding 8px 14px, color #8B5E1A, font-size 13px)', () => {
  const body = ruleBody('.btn-small');
  const padding = propValue(body, 'padding');
  const [p1, p2] = padding.split(/\s+/);
  assert.equal(resolve(p1, allDecls), '8px');
  assert.equal(resolve(p2, allDecls), '14px');
  assert.equal(resolve(propValue(body, 'background'), allDecls), '#8B5E1A');
  assert.equal(resolve(propValue(body, 'font-size'), allDecls), '13px');
});

test('.btn-danger resolves to its exact pre-WP7 values (padding 12px, color and border #A83220)', () => {
  const body = ruleBody('.btn-danger');
  assert.equal(resolve(propValue(body, 'padding'), allDecls), '12px');
  assert.equal(resolve(propValue(body, 'color'), allDecls), '#A83220');
  const border = propValue(body, 'border');
  const borderColorToken = border.match(/var\((--[a-zA-Z0-9-]+)\)$/)[1];
  assert.equal(resolve(`var(${borderColorToken})`, allDecls), '#A83220');
});

test('.toggle and .toggle.on resolve to their exact pre-WP7 values; sizing/box-shadow literals untouched', () => {
  const toggle = ruleBody('.toggle');
  assert.equal(resolve(propValue(toggle, 'background'), allDecls), '#E8E1D6');
  const border = propValue(toggle, 'border');
  const borderColorToken = border.match(/var\((--[a-zA-Z0-9-]+)\)$/)[1];
  assert.equal(resolve(`var(${borderColorToken})`, allDecls).replace(/\s+/g, ''), 'rgba(120,80,30,0.10)');
  assert.equal(propValue(toggle, 'width'), '42px', 'width must remain an untouched literal (outside the spacing scale)');
  assert.equal(propValue(toggle, 'border-radius'), '12px', 'border-radius must remain an untouched literal (outside the radius scale)');

  const toggleOn = ruleBody('.toggle.on');
  assert.equal(resolve(propValue(toggleOn, 'background'), allDecls), '#8B5E1A');

  const thumb = ruleBody('.toggle-thumb');
  assert.match(propValue(thumb, 'box-shadow'), /^0 1px 3px rgba\(0,0,0,0\.15\)$/, 'box-shadow must remain untouched (OD-8008-6: elevation out of scope)');
});

test('.empty-state resolves to its exact pre-WP7 font-size/padding, and its WP11-remediated color (color #5A4020, font-size 13px, padding 24px)', () => {
  // Color updated by the WP11 WCAG Resolution Decision Package (Product/Architecture
  // approved): --color-text-tertiary -> --color-text-secondary, reusing an existing token,
  // no primitive value changed. font-size/padding are unaffected by that remediation and
  // remain the original pre-WP7 values.
  const body = ruleBody('.empty-state');
  assert.equal(resolve(propValue(body, 'color'), allDecls), '#5A4020');
  assert.equal(resolve(propValue(body, 'font-size'), allDecls), '13px');
  assert.equal(resolve(propValue(body, 'padding'), allDecls), '24px');
});

test('dark-mode resolution matches the exact pre-WP7 dark values for the migrated color properties', () => {
  const darkDecls = extractDeclarations(css.match(/body\.dark\s*{([^}]*)}/)[1]);
  // Overlay dark overrides onto the light token table, mirroring runtime CSS cascade.
  const merged = allDecls.map((d) => darkDecls.find((dd) => dd.name === d.name) || d);
  assert.equal(resolve('var(--color-primary)', merged), '#C8983A', '.btn-primary/.btn-small/.toggle.on dark background');
  assert.equal(resolve('var(--color-surface-muted)', merged), '#2E2418', '.toggle dark background');
  assert.equal(resolve('var(--color-text-secondary)', merged), '#C8A870', '.btn-ghost dark color');
  assert.equal(resolve('var(--color-text-tertiary)', merged), '#7A6040', '.empty-state dark color');
  // --red is not overridden in dark mode today (pre-existing, unchanged fact) — .btn-danger
  // must keep resolving to the light value even under body.dark, exactly as before WP7.
  assert.equal(resolve('var(--color-danger)', merged), '#A83220', '.btn-danger dark color must be unchanged from light (pre-existing behavior)');
});
