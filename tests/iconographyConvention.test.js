// TASK-008 WP5 — Iconography Convention tests (TASK_008_SPEC_v1.0.md §14, excluding §14.3;
// docs/specs/TASK_008_IMPLEMENTATION_PLAN.md WP5).
// Verifies: the icon sourcing convention (inline SVG or emoji/glyph only, never <img>) holds
// as a checkable regression guard; the two existing RTL-mirrored directional-icon sites
// (date-nav prev/next, the memory disclosure chevron) retain their RTL-correct glyphs,
// unchanged by this Work Package; the WP5 documentation block is present in css/app.css.
// Does NOT touch js/fitme_dial_elegant_options.png disposition (OD-8008-7, still open).
// Run with: node --test tests/iconographyConvention.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'css', 'app.css');
const HTML_PATH = path.join(__dirname, '..', 'index.html');
const MEMORY_PATH = path.join(__dirname, '..', 'js', 'memory.js');
const DAYNAV_PATH = path.join(__dirname, '..', 'js', 'ui', 'dayNavigationController.js');

const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const memory = fs.readFileSync(MEMORY_PATH, 'utf8');
const dayNav = fs.readFileSync(DAYNAV_PATH, 'utf8');

test('index.html contains zero <img> tags (icon sourcing convention, §14.1 baseline)', () => {
  const matches = html.match(/<img\b/gi) || [];
  assert.equal(matches.length, 0, `expected zero <img> tags, found ${matches.length}`);
});

test('index.html declares zero alt attributes, consistent with having no <img> tags', () => {
  const matches = html.match(/\balt\s*=/gi) || [];
  assert.equal(matches.length, 0, `expected zero alt attributes, found ${matches.length}`);
});

test('the date-nav prev/next glyph pair remains RTL-correct (▶ previous, ◀ next)', () => {
  assert.match(dayNav, /id="date-prev"[^>]*>▶</, 'date-prev glyph changed from the RTL-correct ▶');
  assert.match(dayNav, /id="date-next"[^>]*>◀</, 'date-next glyph changed from the RTL-correct ◀');
});

test('the memory disclosure chevron remains the RTL-corrected glyph (‹, not ›)', () => {
  assert.match(memory, /r\.textContent\s*=\s*'‹'/, 'disclosure chevron regressed from the RTL-corrected ‹');
});

test('the WP5 iconography convention documentation is present in css/app.css', () => {
  assert.match(css, /TASK-008 WP5 — ICONOGRAPHY CONVENTION/, 'WP5 documentation block is missing');
  assert.match(css, /OD-8008-7 remains open/, 'WP5 documentation must record OD-8008-7 as explicitly excluded');
});
