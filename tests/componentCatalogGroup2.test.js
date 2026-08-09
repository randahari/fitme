// TASK-008 WP8 — Component Catalog Group 2 tests (segmented controls, cards, badges;
// TASK_008_SPEC_v1.0.md §17-§18; docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP8).
// First true consolidation Work Package. Verifies, per category: every objectively-derived
// or Product-approved canonical value was correctly applied (including to the previously-
// outlier instances); every property explicitly NOT consolidated (font-family, container
// margin-bottom, badge padding, badge font-size) remains an untouched or per-instance-only
// value, never forced to a shared one; and every discovered gap (values with no existing
// token, the .quick-chip span font-weight:600 site) was left as a literal, not invented.
// Run with: node --test tests/componentCatalogGroup2.test.js

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
const darkDecls = extractDeclarations(css.match(/body\.dark\s*{([^}]*)}/)[1]);
const merged = allDecls.map((d) => darkDecls.find((dd) => dd.name === d.name) || d);

// ── Segmented Controls ──────────────────────────────────────────────────────

test('segmented-control item classes converge on the canonical padding/radius/font-size (9px/6px/13px)', () => {
  for (const sel of ['.seg-btn', '.food-tab', '.plan-tab']) {
    const body = ruleBody(sel);
    assert.equal(propValue(body, 'padding'), '9px', `${sel} padding`);
    assert.equal(propValue(body, 'border-radius'), '6px', `${sel} border-radius`);
    assert.equal(resolve(propValue(body, 'font-size'), allDecls), '13px', `${sel} font-size`);
  }
});

test('font-family on segmented-control items is untouched, per-instance, as approved (Option C)', () => {
  assert.equal(propValue(ruleBody('.seg-btn'), 'font-family'), null, '.seg-btn must still declare none');
  assert.equal(propValue(ruleBody('.food-tab'), 'font-family'), "'Heebo', sans-serif");
  assert.equal(propValue(ruleBody('.plan-tab'), 'font-family'), "'Heebo', sans-serif");
});

test('segmented-control container margin-bottom remains each container\'s own, unforced value (Option D)', () => {
  assert.equal(propValue(ruleBody('.seg-ctrl'), 'margin-bottom'), null, '.seg-ctrl must have none');
  assert.equal(resolve(propValue(ruleBody('.food-tabs'), 'margin-bottom'), allDecls), '12px');
  assert.equal(resolve(propValue(ruleBody('.plan-tabs'), 'margin-bottom'), allDecls), '16px');
});

test('.seg-btn.active keeps its box-shadow; .food-tab.active/.plan-tab.active remain without one (OD-8008-6)', () => {
  assert.match(propValue(ruleBody('.seg-btn.active'), 'box-shadow'), /^0 1px 4px rgba\(120,80,30,0\.1\)$/);
  assert.equal(propValue(ruleBody('.food-tab.active'), 'box-shadow'), null);
  assert.equal(propValue(ruleBody('.plan-tab.active'), 'box-shadow'), null);
});

test('every .active state resolves to the same canonical color/weight, light and dark', () => {
  for (const sel of ['.seg-btn.active', '.food-tab.active', '.plan-tab.active']) {
    const body = ruleBody(sel);
    assert.equal(resolve(propValue(body, 'background'), allDecls), '#FAF7F2');
    assert.equal(resolve(propValue(body, 'color'), allDecls), '#8B5E1A');
    assert.equal(resolve(propValue(body, 'font-weight'), allDecls), '500');
    assert.equal(resolve(propValue(body, 'background'), merged), '#1A1510');
    assert.equal(resolve(propValue(body, 'color'), merged), '#C8983A');
  }
});

// ── Cards ────────────────────────────────────────────────────────────────────

const STANDARD_SHELL_CARDS = [
  '.home-top-card', '.stats-row', '.meals-card', '.food-result', '.burn-card', '.gs-card',
  '.share-card', '.menu-day', '.stat-card', '.health-card', '.achievement', '.profile-card'
];

test('every standard-shell card resolves background/border to the canonical surface/border tokens, light and dark', () => {
  for (const sel of STANDARD_SHELL_CARDS) {
    const body = ruleBody(sel);
    assert.equal(resolve(propValue(body, 'background'), allDecls), '#FAF7F2', `${sel} light background`);
    const border = propValue(body, 'border');
    const token = border.match(/var\((--[a-zA-Z0-9-]+)\)$/)[1];
    assert.equal(resolve(`var(${token})`, allDecls).replace(/\s+/g, ''), 'rgba(120,80,30,0.10)', `${sel} light border`);
    assert.equal(resolve(propValue(body, 'background'), merged), '#1A1510', `${sel} dark background`);
  }
});

test('every card, including the two former outliers, now resolves border-radius to the canonical var(--radius) (14px)', () => {
  for (const sel of [...STANDARD_SHELL_CARDS, '.goal-banner', '.coach-card', '.quick-learn', '.adaptive-card']) {
    const body = ruleBody(sel);
    assert.equal(resolve(propValue(body, 'border-radius'), allDecls), '14px', `${sel} border-radius`);
  }
});

test('single-value card padding converges on the canonical 14px where changed or already matching', () => {
  const shouldBe14 = ['.home-top-card', '.food-result', '.burn-card', '.gs-card', '.goal-banner', '.stat-card', '.achievement', '.profile-card', '.quick-learn', '.adaptive-card'];
  for (const sel of shouldBe14) {
    assert.equal(resolve(propValue(ruleBody(sel), 'padding'), allDecls), '14px', `${sel} padding`);
  }
});

test('compound-shape card padding is tokenized without changing its value or shape', () => {
  assert.equal(resolve(propValue(ruleBody('.meals-card'), 'padding').split(/\s+/)[0], allDecls), '4px');
  assert.equal(resolve(propValue(ruleBody('.meals-card'), 'padding').split(/\s+/)[1], allDecls), '16px');
  assert.equal(resolve(propValue(ruleBody('.health-card'), 'padding').split(/\s+/)[0], allDecls), '4px');
  assert.equal(resolve(propValue(ruleBody('.health-card'), 'padding').split(/\s+/)[1], allDecls), '16px');
  const coach = propValue(ruleBody('.coach-card'), 'padding').split(/\s+/);
  assert.equal(resolve(coach[0], allDecls), '12px');
  assert.equal(resolve(coach[1], allDecls), '14px');
});

test('padding values with no existing token (13px/15px) are left as untouched literals', () => {
  assert.equal(propValue(ruleBody('.share-card'), 'padding'), '13px 15px');
  assert.equal(propValue(ruleBody('.menu-day'), 'padding'), '13px 15px');
});

test('card margin-bottom converges on the canonical 10px wherever the property exists', () => {
  const withMarginBottom = ['.home-top-card', '.stats-row', '.meals-card', '.food-result', '.health-card', '.profile-card', '.coach-card', '.quick-learn', '.adaptive-card', '.goal-banner', '.menu-day'];
  for (const sel of withMarginBottom) {
    assert.equal(resolve(propValue(ruleBody(sel), 'margin-bottom'), allDecls), '10px', `${sel} margin-bottom`);
  }
});

test('.burn-card\'s shorthand margin is untouched (not converted to margin-bottom)', () => {
  assert.equal(propValue(ruleBody('.burn-card'), 'margin'), '12px 0');
  assert.equal(propValue(ruleBody('.burn-card'), 'margin-bottom'), null);
});

test('cards with no pre-existing margin-bottom still have none (not newly added)', () => {
  for (const sel of ['.gs-card', '.share-card', '.stat-card', '.achievement']) {
    assert.equal(propValue(ruleBody(sel), 'margin-bottom'), null, `${sel} must not gain a new margin-bottom`);
  }
});

test('the two untokenizable rgba borders (.goal-banner/.coach-card) remain byte-identical literals', () => {
  assert.equal(propValue(ruleBody('.goal-banner'), 'border'), '0.5px solid rgba(139,94,26,0.15)');
  assert.equal(propValue(ruleBody('.coach-card'), 'border'), '0.5px solid rgba(139,94,26,0.15)');
});

test('.quick-learn/.adaptive-card border color resolves to the canonical --gold-2 value, light and dark', () => {
  for (const sel of ['.quick-learn', '.adaptive-card']) {
    const border = propValue(ruleBody(sel), 'border');
    const token = border.match(/var\((--[a-zA-Z0-9-]+)\)$/)[1];
    assert.equal(resolve(`var(${token})`, allDecls), '#A07840', `${sel} light`);
    assert.equal(resolve(`var(${token})`, merged), '#A07840', `${sel} dark (unchanged, --gold-2 is not overridden)`);
  }
});

// ── Badges / Pills / Chips ──────────────────────────────────────────────────

test('every badge/pill/chip converges on the canonical border-radius (20px), including the former outlier', () => {
  for (const sel of ['.food-tag', '.streak-badge', '.confidence-badge', '.wd-badge', '.fav-tag', '.quick-chip']) {
    assert.equal(resolve(propValue(ruleBody(sel), 'border-radius'), allDecls), '20px', `${sel} border-radius`);
  }
});

test('badge padding remains an untouched, per-instance literal — no shared value forced (Product decision pending category values)', () => {
  const expected = {
    '.food-tag': '7px 13px',
    '.streak-badge': '5px 11px',
    '.confidence-badge': '3px 9px',
    '.wd-badge': '3px 9px',
    '.fav-tag': '5px 11px',
    '.quick-chip': '8px 12px'
  };
  for (const [sel, value] of Object.entries(expected)) {
    assert.equal(propValue(ruleBody(sel), 'padding'), value, `${sel} padding must be unchanged`);
  }
});

test('badge font-size is tokenized to each instance\'s own unchanged value — no shared value forced', () => {
  const expected = {
    '.food-tag': '13px',
    '.streak-badge': '12px',
    '.confidence-badge': '11px',
    '.wd-badge': '10px',
    '.fav-tag': '12px',
    '.quick-chip': '13px'
  };
  for (const [sel, value] of Object.entries(expected)) {
    assert.equal(resolve(propValue(ruleBody(sel), 'font-size'), allDecls), value, `${sel} font-size must be unchanged in value`);
  }
});

test('.quick-chip span\'s font-weight:600 is left untouched (no objective rule or decision picks its replacement)', () => {
  assert.match(ruleBody('.quick-chip span'), /font-weight:\s*600\s*;/);
});

test('.quick-chip.manage\'s own distinct padding is untouched (a modifier variant, not part of the base six)', () => {
  assert.equal(propValue(ruleBody('.quick-chip.manage'), 'padding'), '6px 8px 6px 12px');
});
