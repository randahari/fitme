// TASK-007 — static markup accessibility checks (docs/specs/TASK_007_SPEC_v1.0.md, §21
// Accessibility). Work Package 1: aria-live for dynamically-injected coach-originated cards
// (UX-21.1) and programmatically-determinable accessible names for icon-only controls in
// index.html (UX-21.2). Work Package 2: the remaining §21.2 icon-only controls' accessible
// names live in tests/foodScreenPresenter.test.js (JS-generated, not static markup); this file
// adds §21.5 (programmatic <label for>/aria-label for onboarding, Home weight/measurements and
// Settings form controls) and §21.6 (prefers-reduced-motion guard for the .spinner/.barcode-line
// keyframe animations in css/app.css). Dependency-free: reads index.html/css/app.css as text and
// asserts structural facts — same intentional scope limit as every prior *Wiring.test.js in this
// repository (no DOM/Firebase harness, no execution of app.js).
// Run with: node --test tests/task007AccessibilityWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appCss = fs.readFileSync(path.join(__dirname, '../css/app.css'), 'utf8');

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

// ── UX-21.5: programmatic <label for>/aria-label for form controls (Work Package 2) ────────

const LABEL_FOR_PAIRS = [
  ['ob-name', 'שם'],
  ['ob-age', 'גיל'],
  ['ob-weight', 'משקל \\(ק"ג\\)'],
  ['ob-height', 'גובה \\(ס"מ\\)'],
  ['custom-food', 'הוסף מאכל נוסף'],
  ['ob-coach-name', 'איך שנפנה אליך\\?'],
  ['set-coach-name', 'איך שנפנה אליך\\?']
];

LABEL_FOR_PAIRS.forEach(([id, labelText]) => {
  test('#' + id + ' has a <label for="' + id + '"> association (UX-21.5)', () => {
    const labelRe = new RegExp('<label for="' + id + '"[^>]*>' + labelText + '</label>');
    assert.match(indexHtml, labelRe, '#' + id + ' must be preceded by <label for="' + id + '">');
    assert.match(indexHtml, new RegExp('<input[^>]*id="' + id + '"[^>]*>'), '#' + id + ' input must exist');
  });
});

const ARIA_LABEL_INPUTS = ['weight-input', 'meas-waist', 'meas-arm', 'meas-chest'];

ARIA_LABEL_INPUTS.forEach((id) => {
  test('#' + id + ' (no adjacent <label>) carries aria-label (UX-21.5)', () => {
    const tagMatch = indexHtml.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
    assert.ok(tagMatch, '#' + id + ' must exist');
    assert.match(tagMatch[0], /aria-label="[^"]+"|aria-label='[^']+'/, '#' + id + ' must carry a non-empty aria-label');
  });
});

test('UX-21.5 additions are attribute-only — every affected input keeps its original id/placeholder/type', () => {
  assert.match(indexHtml, /<input type="text" id="ob-name" placeholder="למשל: רן" autocomplete="off">/);
  assert.match(indexHtml, /<input type="number" id="ob-age" placeholder="30" min="10" max="99">/);
  assert.match(indexHtml, /<input type="number" id="ob-weight" placeholder="80" min="30" max="250">/);
  assert.match(indexHtml, /<input type="number" id="ob-height" placeholder="178" min="100" max="230">/);
  assert.match(indexHtml, /<input type="text" id="custom-food" placeholder="למשל: קציצות אמא\.\.\.">/);
  assert.match(indexHtml, /<input type="text" id="ob-coach-name" placeholder="השם או כינוי" autocomplete="off">/);
  assert.match(indexHtml, /<input type="text" id="set-coach-name" placeholder="השם או כינוי" autocomplete="off" onchange="saveCoachSettings\(\)">/);
  assert.match(indexHtml, /id="weight-input" placeholder='משקל היום בק"ג'/);
  assert.match(indexHtml, /id="meas-waist" placeholder="מותן \*"/);
  assert.match(indexHtml, /id="meas-arm" placeholder="זרוע"/);
  assert.match(indexHtml, /id="meas-chest" placeholder="חזה\/ירך"/);
});

// ── UX-21.6: prefers-reduced-motion guard for the spin/scan keyframe animations ────────────

test('css/app.css guards .spinner (spin) and .barcode-line (scan) with prefers-reduced-motion (UX-21.6)', () => {
  const mqMatch = appCss.match(/@media \(prefers-reduced-motion: reduce\) {([\s\S]*?)\n}/);
  assert.ok(mqMatch, 'a @media (prefers-reduced-motion: reduce) block must exist in css/app.css');
  assert.match(mqMatch[1], /\.spinner\s*{\s*animation:\s*none;?\s*}/, 'the reduced-motion block must disable .spinner\'s animation');
  assert.match(mqMatch[1], /\.barcode-line\s*{\s*animation:\s*none;?\s*}/, 'the reduced-motion block must disable .barcode-line\'s animation');
});

test('UX-21.6 addition does not remove the original spin/scan keyframes or their default animations', () => {
  assert.match(appCss, /@keyframes spin { to { transform: rotate\(360deg\); } }/);
  assert.match(appCss, /@keyframes scan { 0%,100% { top: 10%; } 50% { top: 90%; } }/);
  assert.match(appCss, /animation:\s*spin 0\.8s linear infinite;/);
  assert.match(appCss, /animation:\s*scan 2s ease-in-out infinite;/);
});
