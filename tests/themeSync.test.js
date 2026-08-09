// TASK-008 WP6 — Theme Sync tests (TASK_008_SPEC_v1.0.md §15, §8.3 staleness fix;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP6).
// js/app.js is the browser composition root (no module.exports, relies on global
// `document`) and is not unit-testable via require() the way extracted modules are —
// these tests verify its source text structurally, the same approach used for the
// css/app.css-reading tests in WP1-WP5.
// Verifies: syncThemeColorMeta() exists and uses the exact --bg light/dark values
// already defined in css/app.css (cross-file consistency, no new/duplicated-and-
// diverged value); it is called from both toggleDark() and showApp(); manifest.json
// and index.html's static theme-color values are unchanged, per this Work Package's
// own documented scope boundary (platform limitation, not oversight).
// Run with: node --test tests/themeSync.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, '..', 'js', 'app.js');
const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const HTML_PATH = path.join(__dirname, '..', 'index.html');
const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');
const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

function bgPrimitiveValue(source) {
  const m = source.match(/--bg:\s*(#[0-9A-Fa-f]{6})\s*;/);
  return m && m[1];
}

test('syncThemeColorMeta() exists and uses the exact --bg light and dark values from css/app.css', () => {
  const fnMatch = appJs.match(/function syncThemeColorMeta\(\)\s*\{([^}]*)\}/);
  assert.ok(fnMatch, 'syncThemeColorMeta() is missing from js/app.js');
  const body = fnMatch[1];

  const rootBlock = css.match(/:root\s*{([^}]*)}/)[1];
  const darkBlock = css.match(/body\.dark\s*{([^}]*)}/)[1];
  const lightBg = bgPrimitiveValue(rootBlock);
  const darkBg = bgPrimitiveValue(darkBlock);
  assert.ok(lightBg && darkBg, 'could not read --bg primitive values from css/app.css');

  assert.ok(body.includes(lightBg), `syncThemeColorMeta() must use the light --bg value ${lightBg}`);
  assert.ok(body.includes(darkBg), `syncThemeColorMeta() must use the dark --bg value ${darkBg}`);
  assert.match(body, /meta\[name="theme-color"\]/, 'must select the theme-color meta tag');
});

test('syncThemeColorMeta() is called from toggleDark()', () => {
  const fnMatch = appJs.match(/async function toggleDark\(\)\s*\{([^}]*)\}/);
  assert.ok(fnMatch, 'toggleDark() is missing');
  assert.match(fnMatch[1], /syncThemeColorMeta\(\);/, 'toggleDark() must call syncThemeColorMeta()');
});

test('syncThemeColorMeta() is called from showApp(), after the dark class is applied', () => {
  const fnMatch = appJs.match(/function showApp\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(fnMatch, 'showApp() is missing');
  assert.match(
    fnMatch[1],
    /classList\.add\('dark'\);\s*\n\s*syncThemeColorMeta\(\);/,
    'showApp() must call syncThemeColorMeta() immediately after applying the dark class'
  );
});

test('manifest.json theme_color/background_color remain the static light-mode default (unchanged, by documented design)', () => {
  assert.equal(manifest.theme_color, '#FAF7F2');
  assert.equal(manifest.background_color, '#FAF7F2');
});

test('index.html\'s initial theme-color meta tag is unchanged (dynamic sync happens at runtime via JS, not by editing the static tag)', () => {
  assert.match(html, /<meta name="theme-color" content="#FAF7F2">/);
});
