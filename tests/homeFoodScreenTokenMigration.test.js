// TASK-008 WP11 — Home/Food screen token migration tests (TASK_008_SPEC_v1.0.md §17-§20;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP11).
// Migrates every not-yet-tokenized Home- and Food-screen-owned CSS rule (topbar, ring,
// stats, week chart, meals list, water cups, food input/method/result/quick-log rules) to
// consume the Phase 1 semantic color / spacing / font-size / font-weight tokens (WP1, WP2).
// Pure value-preserving substitution: every resolved value below is byte-identical, in both
// light and dark mode, to the literal it replaces. No class renamed, no markup restructured,
// no color/size value invented. The pre-existing `font-weight: 600` sites on `.ring-mac-val`,
// `.meal-kcal` and `.result-name` are left untouched, consistent with WP2's original deferred-
// site treatment (same disposition as `.quick-chip span`, recorded in
// docs/specs/TASK_008_ENGINEERING_FINDINGS.md).
// Run with: node --test tests/homeFoodScreenTokenMigration.test.js

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

// Resolves every `var(--x)` occurrence in a (possibly compound, e.g. "var(--space-5)
// var(--space-6)") declaration value to its final literal, following chains of any depth.
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

function resolvesTo(selector, prop, lightExpected, darkExpected) {
  const raw = propValue(ruleBody(selector), prop);
  assert.equal(resolve(raw, allDecls), lightExpected, `${selector} ${prop} (light)`);
  assert.equal(resolve(raw, merged), darkExpected ?? lightExpected, `${selector} ${prop} (dark)`);
}

// ── Home screen: topbar, ring, stats, week chart, meals, water ──────────────

test('topbar padding/background/border-color migrate to tokens, byte-identical', () => {
  resolvesTo('.topbar', 'padding', '52px 20px 14px');
  resolvesTo('.topbar', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.topbar', 'border-bottom', '0.5px solid rgba(120,80,30,0.10)', '0.5px solid rgba(200,168,112,0.12)');
});

test('topbar-greeting and topbar-title migrate font-size/weight/color to tokens', () => {
  resolvesTo('.topbar-greeting', 'font-size', '11px');
  resolvesTo('.topbar-title', 'font-size', '18px');
  resolvesTo('.topbar-title', 'font-weight', '700');
});

test('ring percentage/kcal/macro text migrates font-size, font-weight and color to tokens', () => {
  resolvesTo('.ring-pct', 'font-size', '22px');
  resolvesTo('.ring-pct', 'font-weight', '800');
  resolvesTo('.ring-kcal', 'font-size', '36px');
  resolvesTo('.ring-kcal', 'font-weight', '800');
  resolvesTo('.ring-kcal-rem', 'color', '#8B5E1A', '#C8983A');
  resolvesTo('.ring-kcal-rem', 'font-weight', '500');
  resolvesTo('.ring-macros', 'margin-top', '12px');
  resolvesTo('.ring-macros', 'gap', '6px');
});

test('.ring-mac-val keeps its pre-existing font-weight:600 untouched (deferred site, per WP2 precedent)', () => {
  assert.equal(propValue(ruleBody('.ring-mac-val'), 'font-weight'), '600');
});

test('stats row migrates font-size/weight/color/border to tokens', () => {
  resolvesTo('.stat-v', 'font-size', '16px');
  resolvesTo('.stat-v', 'font-weight', '700');
  resolvesTo('.stat-item', 'border-left', '0.5px solid rgba(120,80,30,0.10)', '0.5px solid rgba(200,168,112,0.12)');
});

test('week chart and meals-list rules migrate spacing/color to tokens', () => {
  resolvesTo('.week-chart', 'margin-bottom', '8px');
  resolvesTo('.week-col', 'gap', '4px');
  resolvesTo('.week-bar-fill', 'background', '#E8E1D6', '#2E2418');
  resolvesTo('.meal-row', 'padding', '10px 0');
  resolvesTo('.meal-name', 'font-size', '13px');
  resolvesTo('.meal-kcal', 'color', '#8B5E1A', '#C8983A');
});

test('.meal-kcal keeps its pre-existing font-weight:600 untouched (deferred site, per WP2 precedent)', () => {
  assert.equal(propValue(ruleBody('.meal-kcal'), 'font-weight'), '600');
});

test('section-header, link-btn, icon-btn, water-cup migrate to tokens', () => {
  resolvesTo('.section-header', 'margin', '16px 0 8px');
  resolvesTo('.link-btn', 'color', '#8B5E1A', '#C8983A');
  resolvesTo('.icon-btn', 'background', '#F2EDE4', '#231C14');
  resolvesTo('.water-cup', 'background', '#F2EDE4', '#231C14');
});

// ── Food screen: input, method, ai-loading, result, quick-log ───────────────

test('food input/method-row/send-btn migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.input-group', 'gap', '8px');
  resolvesTo('.input-group input', 'padding', '12px 14px');
  resolvesTo('.input-group input', 'border', '0.5px solid rgba(120,80,30,0.16)', '0.5px solid rgba(200,168,112,0.20)');
  resolvesTo('.send-btn', 'background', '#8B5E1A', '#C8983A');
  resolvesTo('.method-btn', 'padding', '10px');
  resolvesTo('.method-btn', 'font-size', '13px');
  resolvesTo('.ai-loading', 'gap', '10px');
});

test('food result rules migrate spacing/font-size/color to tokens', () => {
  resolvesTo('.result-header', 'margin-bottom', '14px');
  resolvesTo('.result-name', 'font-size', '15px');
  resolvesTo('.result-macros', 'gap', '8px');
  resolvesTo('.rm-val', 'font-size', '18px');
  resolvesTo('.rm-val', 'font-weight', '700');
  resolvesTo('.result-note', 'background', '#F2E8D0', '#2E2010');
  resolvesTo('.result-note', 'color', '#8B5E1A', '#C8983A');
});

test('.result-name keeps its pre-existing font-weight:600 untouched (deferred site, per WP2 precedent)', () => {
  assert.equal(propValue(ruleBody('.result-name'), 'font-weight'), '600');
});

test('quick-log section rules migrate spacing/font-size/color to tokens', () => {
  resolvesTo('.quick-section', 'margin-bottom', '12px');
  resolvesTo('.quick-head', 'font-size', '10px');
  resolvesTo('.quick-head', 'margin', '4px 0 8px');
});
