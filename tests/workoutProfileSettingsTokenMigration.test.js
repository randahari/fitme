// TASK-008 WP12 — Workout/Profile/Settings screen token migration tests
// (TASK_008_SPEC_v1.0.md §17-§20; docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP12).
// Migrates every not-yet-tokenized Workout-, Profile-, and Settings-screen-owned CSS rule to
// consume the Phase 1 semantic color / spacing / font-size / font-weight tokens (WP1, WP2).
// Pure value-preserving substitution: every resolved value below is byte-identical, in both
// light and dark mode, to the literal it replaces. No class renamed, no markup restructured,
// no color/size value invented.
//
// Two selectors (`.wo-sub`, `.int-btn`) previously referenced the raw `--text-3` primitive
// directly rather than a semantic alias — the identical pattern as WP11's Finding A. Per the
// approved Semantic Token Usage Contract (Option E), these are resolved here as a mechanical
// Engineering determination (substituted to `--color-text-secondary`, the same already-
// reviewed reuse target), with no fresh Product/Architecture review required.
//
// `.int-btn.active`'s pre-existing `color: white` on `--color-primary` text (dark mode) is the
// same pairing already reviewed and DEFERRED for `.btn-primary`/`.btn-small` (WP11) — left
// untouched here and recorded in the contrast fixture as a further instance of that same
// deferred finding, not a new one.
//
// `.workout-day`, `.wd-day`, `.wd-name`, `.wd-desc`, `.wd-badge`, and `.share-url` are
// confirmed, by direct search, to be unreferenced by any current `js/` file or `index.html` —
// dead CSS with no live rendering path — and are left untouched as out of this migration's
// verified-rendered scope, consistent with OD-11b's "actual... pairings... as it actually
// appears" evidentiary standard.
//
// The pre-existing `font-weight: 600` declarations on `.avatar`, `.settings-val`,
// `.menu-day-title`, `.health-val`, `.profile-name` are left untouched, consistent with WP2's
// original deferred-site treatment.
// Run with: node --test tests/workoutProfileSettingsTokenMigration.test.js

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

// ── Workout screen ───────────────────────────────────────────────────────────

test('workout-opt/wo-icon/wo-name migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.workout-opts', 'gap', '8px');
  resolvesTo('.workout-opt', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.workout-opt.selected', 'border-color', '#8B5E1A', '#C8983A');
  resolvesTo('.wo-icon', 'background', '#F2EDE4', '#231C14');
  resolvesTo('.wo-name', 'font-size', '14px');
});

test('.wo-sub resolves the Option E mechanical fix (raw --text-3 -> --color-text-secondary)', () => {
  resolvesTo('.wo-sub', 'color', '#5A4020', '#C8A870');
});

test('slider/intensity rules migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.slider-row', 'gap', '12px');
  resolvesTo('.slider-val', 'font-size', '14px');
  resolvesTo('.intensity-row', 'gap', '6px');
  resolvesTo('.int-btn', 'background', '#FAF7F2', '#1A1510');
});

test('.int-btn resolves the Option E mechanical fix (raw --text-3 -> --color-text-secondary)', () => {
  resolvesTo('.int-btn', 'color', '#5A4020', '#C8A870');
});

test('.int-btn.active keeps its pre-existing color:white untouched (deferred, same finding as .btn-primary/.btn-small)', () => {
  assert.equal(propValue(ruleBody('.int-btn.active'), 'color'), 'white');
  resolvesTo('.int-btn.active', 'background', '#8B5E1A', '#C8983A');
});

test('burn-card text rules migrate font-size/color to tokens', () => {
  resolvesTo('.burn-label', 'color', '#5A4020', '#C8A870');
  resolvesTo('.burn-val', 'color', '#8B5E1A', '#C8983A');
  resolvesTo('.burn-sub', 'color', '#5A4020', '#C8A870');
});

// ── Profile screen ───────────────────────────────────────────────────────────

test('profile-hero/stats-grid/achievements rules migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.ai-bubble', 'background', '#F2E8D0', '#2E2010');
  resolvesTo('.prof-name', 'font-size', '22px');
  resolvesTo('.prof-goal', 'color', '#5A4020', '#C8A870');
  resolvesTo('.stat-val', 'font-size', '24px');
  resolvesTo('.stat-label', 'color', '#5A4020', '#C8A870');
});

test('health-row/health-label/health-val migrate color/spacing to tokens', () => {
  resolvesTo('.health-row', 'padding', '10px 0');
  resolvesTo('.health-label', 'color', '#5A4020', '#C8A870');
  resolvesTo('.health-val', 'color', '#1C1208', '#F0E8D4');
});

test('.health-val and .profile-name keep their pre-existing font-weight:600 untouched (deferred sites)', () => {
  assert.equal(propValue(ruleBody('.health-val'), 'font-weight'), '600');
  assert.equal(propValue(ruleBody('.profile-name'), 'font-weight'), '600');
});

test('achievement/ach-title migrate color/font-size to tokens', () => {
  resolvesTo('.achievement.earned', 'background', '#F2E8D0', '#2E2010');
  resolvesTo('.ach-title', 'color', '#5A4020', '#C8A870');
  resolvesTo('.ach-icon', 'font-size', '22px');
});

// ── Settings screen ──────────────────────────────────────────────────────────

test('ob-form/avatar/profile-sub/settings-row migrate spacing/color/font-size to tokens', () => {
  resolvesTo('.ob-form label', 'color', '#5A4020', '#C8A870');
  resolvesTo('.ob-form input', 'background', '#F2EDE4', '#231C14');
  resolvesTo('.avatar', 'background', '#F2E8D0', '#2E2010');
  resolvesTo('.profile-sub', 'color', '#5A4020', '#C8A870');
  resolvesTo('.settings-row', 'color', '#1C1208', '#F0E8D4');
  resolvesTo('.settings-val', 'color', '#8B5E1A', '#C8983A');
});

test('.avatar and .settings-val keep their pre-existing font-weight:600 untouched (deferred sites)', () => {
  assert.equal(propValue(ruleBody('.avatar'), 'font-weight'), '600');
  assert.equal(propValue(ruleBody('.settings-val'), 'font-weight'), '600');
});

test('plan-target/menu-day rules (rendered via #plan-targets-settings, js/app.js) migrate to tokens', () => {
  resolvesTo('.plan-target', 'background', '#FAF7F2', '#1A1510');
  resolvesTo('.pt-label', 'color', '#5A4020', '#C8A870');
  resolvesTo('.pt-val', 'color', '#8B5E1A', '#C8983A');
  resolvesTo('.menu-meal', 'color', '#5A4020', '#C8A870');
});

test('.menu-day-title keeps its pre-existing font-weight:600 untouched (deferred site)', () => {
  assert.equal(propValue(ruleBody('.menu-day-title'), 'font-weight'), '600');
});

// ── Dead-code boundary (not migrated: confirmed unreferenced) ───────────────

test('workout-day/.wd-*/.share-url remain unreferenced by any current js/ file or index.html (out of verified-rendered scope)', () => {
  const jsFiles = fs.readdirSync(path.join(__dirname, '..', 'js'), { recursive: true })
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'))
    .join('\n');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const cls of ['workout-day', 'wd-day', 'wd-name', 'wd-desc', 'wd-badge', 'share-url']) {
    assert.doesNotMatch(jsFiles, new RegExp(cls), `${cls} unexpectedly referenced in js/`);
    assert.doesNotMatch(html, new RegExp(cls), `${cls} unexpectedly referenced in index.html`);
  }
});
