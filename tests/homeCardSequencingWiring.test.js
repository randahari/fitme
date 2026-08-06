// TASK-007 WP5 — Home-card coordination: deterministic sequencing (docs/specs/TASK_007_SPEC_v1.0.md
// §12.2, UX-12.6) among the four coach-originated Home cards (#trigger-card, #coach-card,
// #adaptive-card, #partial-prompt).
//
// Investigation finding (recorded here, not just in the WP5 report, so the reasoning stays next
// to what it verifies): none of the three producing modules (js/trigger/triggerController.js,
// js/coach/coachPresenter.js, js/adaptive/adaptiveTdeeController.js) ever move, reorder, insert,
// or remove these card elements relative to one another — each only ever toggles the existing
// element's own classList (add/remove 'hidden') or writes its textContent/innerHTML. The four
// cards are fixed sibling <div>s in index.html's static markup (§12.2's own cited evidence:
// "index.html:194-221"), so their relative vertical order — the only "prominence" lever available
// at this document's behavioral-only layer, per UX-12.0 — is fully determined by DOM position and
// can never vary at runtime, regardless of which subset is eligible/visible on a given render, or
// the relative timing/order in which each producing module's async work resolves.
//
// This satisfies UX-12.6's literal text ("sequencing MUST be deterministic") without deciding the
// separate, still-open Product question §12.2's own Sequencing row records as a Repository
// Gap/Product Decision Pending: the *relative priority* between card types that have no existing
// priority signal toward one another (e.g., Adaptive card vs. Coach card). This suite locks in the
// current, deterministic order as a permanent regression guard — it does not assert or imply that
// this order is the intentional or "correct" priority ranking; only that it is fixed and repeatable,
// which is what UX-12.6 requires. Any future change to this order is a Product Decision Pending,
// not an Engineering one — this test will fail loudly if the order ever changes silently.
//
// Dependency-free: reads index.html and the three JS files as text and asserts structural facts —
// same intentional scope limit as every prior *Wiring.test.js in this repository (no DOM/Firebase
// harness, no execution of app.js).
// Run with: node --test tests/homeCardSequencingWiring.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const triggerControllerJs = fs.readFileSync(path.join(__dirname, '../js/trigger/triggerController.js'), 'utf8');
const coachPresenterJs = fs.readFileSync(path.join(__dirname, '../js/coach/coachPresenter.js'), 'utf8');
const adaptiveTdeeControllerJs = fs.readFileSync(path.join(__dirname, '../js/adaptive/adaptiveTdeeController.js'), 'utf8');

const HOME_CARD_SEQUENCE = ['trigger-card', 'coach-card', 'adaptive-card', 'partial-prompt'];

test('the four Home cards appear in index.html in a single, fixed DOM order (UX-12.6 determinism)', () => {
  const positions = HOME_CARD_SEQUENCE.map((id) => {
    const match = indexHtml.match(new RegExp('<div id="' + id + '"[^>]*>'));
    assert.ok(match, '#' + id + ' must exist in index.html');
    return indexHtml.indexOf(match[0]);
  });
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], 'each card must appear strictly after the previous one in DOM source order: ' + HOME_CARD_SEQUENCE[i - 1] + ' before ' + HOME_CARD_SEQUENCE[i]);
  }
});

test('every Home card is a sibling <div> directly toggled via the existing .hidden class convention (no positional/behavioral change from WP5)', () => {
  HOME_CARD_SEQUENCE.forEach((id) => {
    const match = indexHtml.match(new RegExp('<div id="' + id + '"[^>]*>'));
    assert.match(match[0], /class="[^"]*hidden[^"]*"/, '#' + id + ' must still carry the hidden class by default');
  });
});

// ── Determinism depends on no producing module ever reordering the cards themselves ─────────

const CARD_PRODUCING_FILES = {
  'js/trigger/triggerController.js': triggerControllerJs,
  'js/coach/coachPresenter.js': coachPresenterJs,
  'js/adaptive/adaptiveTdeeController.js': adaptiveTdeeControllerJs
};

Object.entries(CARD_PRODUCING_FILES).forEach(([filename, source]) => {
  test(filename + ' never repositions a card element (no insertBefore/removeChild/body.appendChild) — only classList/textContent/appendChild-of-a-child', () => {
    assert.doesNotMatch(source, /insertBefore/, filename + ' must not reorder DOM nodes');
    assert.doesNotMatch(source, /removeChild/, filename + ' must not remove/reinsert a card node');
    assert.doesNotMatch(source, /\.body\.appendChild/, filename + ' must not move a card node to a new parent');
  });
});

test('no relative priority order is asserted between card types lacking an existing priority signal (Repository Gap / Product Decision Pending remains open)', () => {
  // This test exists to document, not enforce, a negative: HOME_CARD_SEQUENCE above restates the
  // markup's current order as a fact to guard against silent drift — it is not exported, consumed
  // by any producing module, or used to compute anything at runtime. No file in this repository
  // was changed by WP5 to compute or select an order between card types; TASK_007_SPEC_v1.0.md
  // §12.2's Sequencing row Repository Gap (Adaptive card vs. Coach card priority) is unresolved by
  // this Work Package, as required.
  assert.equal(HOME_CARD_SEQUENCE.length, 4);
});
