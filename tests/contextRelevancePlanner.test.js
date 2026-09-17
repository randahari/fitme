// WP0 Phase A — Context Relevance Planner contract tests (docs/specs/WP0_SPEC_v1.0.md §18,
// Revision 3, Round 3 item 4). Validates the ceiling bound, baseline inclusion, per-NEED_SHAPES
// default subsets, relevance-tag overlap matching, and — the binding, non-negotiable
// invariant — that select() is a pure, synchronous, deterministic function containing no
// AI/model call of any kind.
// Run with: node --test tests/contextRelevancePlanner.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ContextRelevancePlanner = require('../js/coachDecisionSystem/contextRelevancePlanner.js');

const plannerSource = fs.readFileSync(path.join(__dirname, '../js/coachDecisionSystem/contextRelevancePlanner.js'), 'utf8');

function makeProviderLookup(providersById) {
  return (id) => providersById[id] || null;
}

test('select() never returns an id outside capability.contextCeiling, even when baseline/defaults reference one (defensive re-enforcement)', () => {
  const capability = {
    contextCeiling: ['a', 'b'],
    // Deliberately malformed input (would be rejected at registration by capabilityRegistry.js)
    // to prove select() enforces the bound independently, never merely trusting the caller.
    contextBaseline: ['a', 'z'],
    needShapeDefaults: { DISCLOSURE: ['b', 'y'] }
  };
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, capability, makeProviderLookup({}));
  assert.deepEqual(selected.sort(), ['a', 'b']);
  assert.ok(!selected.includes('z'));
  assert.ok(!selected.includes('y'));
});

test('select() returns an empty array when contextCeiling is empty, regardless of other fields', () => {
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, { contextCeiling: [], contextBaseline: ['a'] }, makeProviderLookup({}));
  assert.deepEqual(selected, []);
});

test('select() always includes contextBaseline entries', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({}));
  assert.deepEqual(selected, ['a']);
});

test('select() includes the needShapeDefaults subset for a single Need shape', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: [], needShapeDefaults: { DISCLOSURE: ['b', 'c'] } };
  const selected = ContextRelevancePlanner.select({ shape: 'DISCLOSURE' }, capability, makeProviderLookup({}));
  assert.deepEqual(selected.sort(), ['b', 'c']);
});

test('select() unions needShapeDefaults across a MULTI_NEED array shape', () => {
  const capability = { contextCeiling: ['a', 'b', 'c'], contextBaseline: [], needShapeDefaults: { DISCLOSURE: ['a'], PLANNING: ['b'] } };
  const selected = ContextRelevancePlanner.select({ shape: ['DISCLOSURE', 'PLANNING'] }, capability, makeProviderLookup({}));
  assert.deepEqual(selected.sort(), ['a', 'b']);
});

test('select() includes a fragment whose relevanceTags overlap the Need\'s openEntityMentions roughKind values', () => {
  const capability = { contextCeiling: ['nutritionFrag', 'trainingFrag'], contextBaseline: [], needShapeDefaults: {} };
  const providers = {
    nutritionFrag: { relevanceTags: ['food', 'nutrition'] },
    trainingFrag: { relevanceTags: ['activity', 'training'] }
  };
  const selected = ContextRelevancePlanner.select(
    { shape: 'RECOMMENDATION_REQUEST', openEntityMentions: [{ text: 'Pad Thai', roughKind: 'food' }] },
    capability, makeProviderLookup(providers)
  );
  assert.deepEqual(selected, ['nutritionFrag']);
});

test('select() excludes a fragment with no relevanceTags overlap and no baseline/default membership', () => {
  const capability = { contextCeiling: ['unrelatedFrag'], contextBaseline: [], needShapeDefaults: {} };
  const providers = { unrelatedFrag: { relevanceTags: ['weather'] } };
  const selected = ContextRelevancePlanner.select(
    { shape: 'RECOMMENDATION_REQUEST', openEntityMentions: [{ text: 'padel', roughKind: 'activity' }] },
    capability, makeProviderLookup(providers)
  );
  assert.deepEqual(selected, []);
});

test('select() degrades gracefully (empty selection beyond baseline) for a malformed/absent Need object', () => {
  const capability = { contextCeiling: ['a'], contextBaseline: [], needShapeDefaults: {} };
  assert.deepEqual(ContextRelevancePlanner.select(null, capability, makeProviderLookup({})), []);
  assert.deepEqual(ContextRelevancePlanner.select(undefined, capability, makeProviderLookup({})), []);
});

test('select() degrades gracefully for a malformed/absent capability object (empty array, never throws)', () => {
  assert.deepEqual(ContextRelevancePlanner.select({ shape: 'PLANNING' }, null, makeProviderLookup({})), []);
  assert.deepEqual(ContextRelevancePlanner.select({ shape: 'PLANNING' }, undefined, makeProviderLookup({})), []);
});

test('select() works correctly with no getFragmentProvider function supplied (baseline/defaults still apply, tag-matching simply skipped)', () => {
  const capability = { contextCeiling: ['a', 'b'], contextBaseline: ['a'], needShapeDefaults: {} };
  const selected = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability);
  assert.deepEqual(selected, ['a']);
});

test('select() is synchronous — its return value is a plain array, never a Promise (structural proof of "no AI call")', () => {
  const capability = { contextCeiling: ['a'], contextBaseline: ['a'], needShapeDefaults: {} };
  const result = ContextRelevancePlanner.select({ shape: 'PLANNING' }, capability, makeProviderLookup({}));
  assert.equal(result instanceof Promise, false);
  assert.ok(Array.isArray(result));
});

test('contextRelevancePlanner.js contains no callClaude call site, no configure() injection point, and no async keyword anywhere in its executable code (structural proof it is not, and cannot become, a reasoning engine — Round 3 item 4, binding)', () => {
  // Matches an actual call/reference site (callClaude followed by "(" or a property/variable
  // access), never the header comment's own prose explaining this absence.
  assert.ok(!/callClaude\s*[.(]/.test(plannerSource));
  assert.ok(!/function\s+configure\s*\(/.test(plannerSource));
  // Matches actual async function syntax (declaration or arrow), never the word "async" used
  // descriptively in a comment (e.g. this file's own header, which discusses why it is NOT
  // asynchronous).
  assert.ok(!/\basync\s+function\b/.test(plannerSource));
  assert.ok(!/\basync\s*\(/.test(plannerSource));
  assert.ok(!/\basync\s+[A-Za-z_$][\w$]*\s*=>/.test(plannerSource));
});
