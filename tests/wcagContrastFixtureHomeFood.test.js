// TASK-008 WP11/WP12 — Contrast fixture verification (TASK_008_SPEC_v1.0.md §20.1/§20.2,
// OD-11a/OD-11b). Consumes tests/fixtures/wcagContrastFixtureHomeFood.js — the maintained
// fixture of every foreground/background color-token pairing actually rendered on the Home,
// Food, Workout, Profile, and Settings screens — and verifies each against the WCAG 2.1 AA
// bar (4.5:1 text / 3:1 large-text or non-text-UI, per §20.1).
//
// Entries NOT prefixed "DEFERRED-" are asserted to pass, in every mode they apply to — these
// are ordinary regression guards. Entries prefixed "DEFERRED-" are WCAG AA gaps Product/
// Architecture have explicitly reviewed and deferred to a future Brand/Visual Identity phase
// (Semantic Token Usage Contract / Deferment decision) because no fix exists within Option E's
// authority — resolving them would require a Primitive Token change, a new color, a visual-
// identity change, or a new Product/Visual Language judgment. Those tests assert the pairing
// is CURRENTLY STILL MEASURED AS FAILING — deferred is not compliant — so that a future
// palette change is required to actually clear them; if one ever passes unexpectedly, the
// fixture/test must be updated deliberately, not silently.
// Run with: node --test tests/wcagContrastFixtureHomeFood.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const css = fs.readFileSync(CSS_PATH, 'utf8');
const fixture = require('./fixtures/wcagContrastFixtureHomeFood.js');

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

const allDecls = extractDeclarations(css);
const darkDecls = extractDeclarations(css.match(/body\.dark\s*{([^}]*)}/)[1]);
const merged = allDecls.map((d) => darkDecls.find((dd) => dd.name === d.name) || d);

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

function entryRatio(entry, decls) {
  const fg = /^#/.test(entry.fg) ? entry.fg : resolve(entry.fg, decls);
  const bg = /^#/.test(entry.bg) ? entry.bg : resolve(entry.bg, decls);
  return contrastRatio(fg, bg);
}

test('fixture covers a non-trivial, non-empty set of Home/Food pairings', () => {
  assert.ok(fixture.length >= 15, `expected a substantial fixture, found ${fixture.length} entries`);
});

for (const entry of fixture) {
  const isDeferred = entry.id.startsWith('DEFERRED-');
  const modes = entry.mode ? [entry.mode] : (entry.note && entry.note.includes('light mode only') ? ['light'] : ['light', 'dark']);

  for (const mode of modes) {
    const decls = mode === 'dark' ? merged : allDecls;
    const label = `${entry.id} [${entry.criterion}, ${mode}, ${entry.selectors.join('/')}]`;

    if (isDeferred) {
      test(`DEFERRED (Product/Architecture reviewed, non-blocking): ${label} still measures below its ${entry.threshold}:1 bar`, () => {
        const ratio = entryRatio(entry, decls);
        assert.ok(ratio < entry.threshold, `expected ${label} to still be measuring below bar at ${ratio.toFixed(2)}:1 — if this now passes, the fixture/test must be updated deliberately, not silently`);
      });
    } else {
      test(`WCAG 2.1 AA: ${label} meets its ${entry.threshold}:1 bar`, () => {
        const ratio = entryRatio(entry, decls);
        assert.ok(ratio >= entry.threshold, `${label} only reaches ${ratio.toFixed(2)}:1, required ${entry.threshold}:1`);
      });
    }
  }
}
