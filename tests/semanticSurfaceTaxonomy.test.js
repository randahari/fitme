// TASK-008 WP9 — Semantic Communication Surface taxonomy tests (TASK_008_SPEC_v1.0.md §16;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP9).
// Formalizes OD-8008-9's approved taxonomy (Coach Message / Adaptive Update) as machine-
// readable data-semantic-surface attributes on the four existing coach-originated surfaces.
// Pure documentation/annotation — verifies no class, style, or behavior changed: each
// surface keeps its own existing CSS class, hidden state, and aria-live attribute exactly
// as before; only a new data-* attribute (which has no CSS/JS effect anywhere in this
// repository) was added.
// Run with: node --test tests/semanticSurfaceTaxonomy.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const css = fs.readFileSync(CSS_PATH, 'utf8');

function elementTag(id) {
  const re = new RegExp(`<div id="${id}"([^>]*)>`);
  const m = html.match(re);
  assert.ok(m, `#${id} not found`);
  return m[1];
}

const COACH_MESSAGE = ['trigger-card', 'coach-card'];
const ADAPTIVE_UPDATE = ['adaptive-card', 'partial-prompt'];

test('Coach Message surfaces are tagged data-semantic-surface="coach-message"', () => {
  for (const id of COACH_MESSAGE) {
    assert.match(elementTag(id), /data-semantic-surface="coach-message"/, `#${id}`);
  }
});

test('Adaptive Update surfaces are tagged data-semantic-surface="adaptive-update"', () => {
  for (const id of ADAPTIVE_UPDATE) {
    assert.match(elementTag(id), /data-semantic-surface="adaptive-update"/, `#${id}`);
  }
});

test('the taxonomy matches the pre-existing class-sharing structure exactly (formalizes, does not redefine)', () => {
  for (const id of COACH_MESSAGE) {
    assert.match(elementTag(id), /class="coach-card hidden"/, `#${id} class unchanged`);
  }
  for (const id of ADAPTIVE_UPDATE) {
    assert.match(elementTag(id), /class="adaptive-card hidden"/, `#${id} class unchanged`);
  }
});

test('aria-live and the hidden state are unchanged on all four surfaces (no behavioral change)', () => {
  for (const id of [...COACH_MESSAGE, ...ADAPTIVE_UPDATE]) {
    const tag = elementTag(id);
    assert.match(tag, /aria-live="polite"/, `#${id} aria-live`);
    assert.match(tag, /\bhidden\b/, `#${id} hidden`);
  }
});

test('no other element in index.html carries a data-semantic-surface attribute (closed set of four)', () => {
  const matches = html.match(/data-semantic-surface="[^"]*"/g) || [];
  assert.equal(matches.length, 4, `expected exactly 4 tagged surfaces, found ${matches.length}`);
});

test('css/app.css documents each shared class\'s semantic-surface category without changing any value', () => {
  assert.match(css, /"Coach Message" semantic\s*\n\s*communication surface/);
  assert.match(css, /"Adaptive Update" semantic\s*\n\s*communication surface/);
});
