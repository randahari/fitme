// TASK-008 WP13 — Onboarding, login, and barcode overlay token migration tests
// (TASK_008_SPEC_v1.0.md §17-§20; docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP13).
// Migrates every not-yet-tokenized login/onboarding-owned CSS rule to consume the Phase 1
// semantic color/spacing/font-size/font-weight tokens (WP1, WP2). Pure value-preserving
// substitution: every resolved value below is byte-identical, in both light and dark mode, to
// the literal it replaces. No class renamed, no markup restructured, no color/size value
// invented.
//
// `.food-tag` previously referenced `--color-text-tertiary` on `--color-surface-subtle` — the
// identical, already-resolved failing pairing from WP11's remediation and Finding A. It was
// out of scope at WP11 time (not rendered on Home/Food) but renders on Onboarding, so WP13
// resolves it via the approved Semantic Token Usage Contract (Option E) as a mechanical
// Engineering determination — no fresh Product/Architecture review required.
//
// The barcode overlay (`.barcode-overlay`, `.barcode-header`, `.barcode-close`,
// `.barcode-status`) is DELIBERATELY NOT migrated to `--color-surface`/`--color-text`: its
// `#000` background and `#fff`/`rgba(255,255,255,...)` foregrounds are a theme-independent
// camera-viewfinder treatment (always black, regardless of the app's light/dark toggle) — no
// category in SPEC §8.2's semantic-role taxonomy represents "theme-independent black/white,"
// and inventing one would be new-semantic-role invention, outside this migration's authority.
// Only `.barcode-frame`/`.barcode-line`'s `--gold` accent (already theme-dependent, matching
// every other themed accent) is tokenized to `--color-primary`.
// Run with: node --test tests/onboardingLoginBarcodeTokenMigration.test.js

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
  let v = name, guard = 0;
  while (/^--[a-zA-Z0-9-]+$/.test(v) && guard++ < 10) {
    const decl = allDecls.find((d) => d.name === v);
    assert.ok(decl, `unresolved token ${v}`);
    v = decl.value.trim();
  }
  return v;
}
function resolve(value, allDecls) {
  let v = value.trim(), guard = 0;
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

// ── Login screen ─────────────────────────────────────────────────────────────

test('login-screen/btn-google migrate background/spacing/color/font-size to tokens', () => {
  resolvesTo('.login-screen', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.login-screen', 'padding', '40px 28px');
  resolvesTo('.login-hero h1', 'color', '#8B5E1A', '#C8983A');
  resolvesTo('.btn-google', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.btn-google', 'color', '#1C1208', '#F0E8D4');
  resolvesTo('.btn-google:active', 'background', '#F2EDE4', '#231C14');
});

test('.login-hero p and .login-sub resolve the Option E mechanical fix (raw --text-3 -> --color-text-secondary)', () => {
  resolvesTo('.login-hero p', 'color', '#5A4020', '#C8A870');
  resolvesTo('.login-sub', 'color', '#5A4020', '#C8A870');
});

// ── Onboarding ───────────────────────────────────────────────────────────────

test('onboarding-wrap/ob-screen/ob-hero migrate background/spacing/color/font-size to tokens', () => {
  resolvesTo('.onboarding-wrap', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.ob-screen', 'padding', '52px 24px 32px');
  resolvesTo('.ob-hero h1', 'color', '#1C1208', '#F0E8D4');
});

test('.ob-hero p resolves the Option E mechanical fix (raw --text-3 -> --color-text-secondary)', () => {
  resolvesTo('.ob-hero p', 'color', '#5A4020', '#C8A870');
});

test('goal-card rules migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.goal-cards', 'gap', '10px');
  resolvesTo('.goal-card', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.goal-card.selected', 'border-color', '#8B5E1A', '#C8983A');
  resolvesTo('.goal-title', 'color', '#1C1208', '#F0E8D4');
});

test('.goal-sub resolves the Option E mechanical fix (raw --text-3 -> --color-text-secondary)', () => {
  resolvesTo('.goal-sub', 'color', '#5A4020', '#C8A870');
});

test('.food-tag resolves the Option E mechanical fix (--color-text-tertiary -> --color-text-secondary, identical pairing to the WP11 remediation)', () => {
  resolvesTo('.food-tag', 'color', '#5A4020', '#C8A870');
  resolvesTo('.food-tag', 'background', '#F2EDE4', '#231C14');
});

// ── Barcode overlay ──────────────────────────────────────────────────────────

test('barcode-frame/barcode-line accent color migrates gold -> --color-primary (theme-dependent accent, unlike the overlay chrome)', () => {
  resolvesTo('.barcode-frame', 'border', '2px solid #8B5E1A', '2px solid #C8983A');
  resolvesTo('.barcode-line', 'background', '#8B5E1A', '#C8983A');
});

test('the barcode overlay chrome keeps its literal, theme-independent black/white values untouched', () => {
  assert.equal(propValue(ruleBody('.barcode-overlay'), 'background'), '#000');
  assert.equal(propValue(ruleBody('.barcode-header'), 'color'), '#fff');
  assert.equal(propValue(ruleBody('.barcode-close'), 'background'), 'rgba(255,255,255,0.15)');
  assert.equal(propValue(ruleBody('.barcode-close'), 'color'), '#fff');
  assert.equal(propValue(ruleBody('.barcode-status'), 'color'), 'rgba(255,255,255,0.7)');
});
