// TASK-007 — static markup accessibility checks (docs/specs/TASK_007_SPEC_v1.0.md, §21
// Accessibility). Work Package 1: aria-live for dynamically-injected coach-originated cards
// (UX-21.1) and programmatically-determinable accessible names for icon-only controls in
// index.html (UX-21.2). Dependency-free: reads index.html as text and asserts structural
// facts — same intentional scope limit as every prior *Wiring.test.js in this repository
// (no DOM/Firebase harness, no execution of app.js).
// Run with: node --test tests/task007AccessibilityWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// ── UX-21.1: aria-live on every dynamically-injected coach-originated card ─────────────────

const LIVE_CARDS = ['trigger-card', 'coach-card', 'adaptive-card', 'partial-prompt'];

LIVE_CARDS.forEach((id) => {
  test('#' + id + ' carries aria-live (UX-21.1)', () => {
    const openTagMatch = indexHtml.match(new RegExp('<div id="' + id + '"[^>]*>'));
    assert.ok(openTagMatch, '#' + id + ' element must exist in index.html');
    assert.match(openTagMatch[0], /aria-live="polite"/, '#' + id + ' must carry aria-live="polite"');
  });
});

test('every UX-21.1 card remains toggled via the existing .hidden class convention (no behaviour change)', () => {
  LIVE_CARDS.forEach((id) => {
    const openTagMatch = indexHtml.match(new RegExp('<div id="' + id + '"[^>]*>'));
    assert.match(openTagMatch[0], /class="[^"]*hidden[^"]*"/, '#' + id + ' must still carry the hidden class by default');
  });
});

// ── UX-21.2: accessible name for icon-only controls ─────────────────────────────────────────

test('#dark-toggle-btn (icon-only, toggleDark) carries aria-label (UX-21.2)', () => {
  const tagMatch = indexHtml.match(/<button[^>]*id="dark-toggle-btn"[^>]*>/);
  assert.ok(tagMatch, '#dark-toggle-btn must exist');
  assert.match(tagMatch[0], /aria-label="[^"]+"/, '#dark-toggle-btn must carry a non-empty aria-label');
});

test('.send-btn (icon-only SVG, analyzeFood) carries aria-label (UX-21.2)', () => {
  const tagMatch = indexHtml.match(/<button class="send-btn"[^>]*>/);
  assert.ok(tagMatch, '.send-btn must exist');
  assert.match(tagMatch[0], /aria-label="[^"]+"/, '.send-btn must carry a non-empty aria-label');
});

test('.barcode-close (icon-only "✕", closeBarcode) carries aria-label (UX-21.2)', () => {
  const tagMatch = indexHtml.match(/<button onclick="closeBarcode\(\)" class="barcode-close"[^>]*>/);
  assert.ok(tagMatch, '.barcode-close must exist');
  assert.match(tagMatch[0], /aria-label="[^"]+"/, '.barcode-close must carry a non-empty aria-label');
});

// ── Regression guard: onclick wiring for the three UX-21.2 buttons is unchanged ─────────────

test('UX-21.2 additions are attribute-only — the three buttons keep their original onclick handlers', () => {
  assert.match(indexHtml, /<button class="icon-btn" onclick="toggleDark\(\)" id="dark-toggle-btn"/);
  assert.match(indexHtml, /<button class="send-btn" onclick="analyzeFood\(\)"/);
  assert.match(indexHtml, /<button onclick="closeBarcode\(\)" class="barcode-close"/);
});
