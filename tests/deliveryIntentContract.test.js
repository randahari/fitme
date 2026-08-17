// Expression WP1 — Delivery Intent Contract tests (EXPRESSION_SPEC_v1.0.md §11, Canonical
// Decision CD-EXP-01; EXPRESSION_IMPLEMENTATION_PLAN.md WP1). Validates the schema-conformance
// builder/validator only — no rendering, dispatch, or REFUSAL/ESCALATION/disclosure content
// exists here or anywhere in this module (later Work Packages' scope, not WP1's).
// Run with: node --test tests/deliveryIntentContract.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const DeliveryIntentContract = require('../js/coachDecisionSystem/deliveryIntentContract.js');

function validParams(overrides) {
  return Object.assign({
    renderedLanguage: 'טקסט לדוגמה',
    semanticSignal: { kind: 'RECOMMENDATION' },
    correlation: { decisionId: 'decision-123' }
  }, overrides || {});
}

// ── AC-8 (schema-level): schemaVersion, immutable, closed field set ──

test('schemaVersion follows the existing memoryLayer.js convention', () => {
  assert.equal(DeliveryIntentContract.SCHEMA_VERSION, 'coach-decision-system-delivery-intent/1.0');
});

test('a successfully built Delivery Intent is immutable (Object.freeze) at every level', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams());
  assert.equal(result.status, 'BUILT');
  const di = result.deliveryIntent;
  assert.equal(Object.isFrozen(di), true);
  assert.equal(Object.isFrozen(di.semanticSignal), true);
  assert.equal(Object.isFrozen(di.correlation), true);
  assert.equal(di.immutable, true);
  assert.throws(() => { 'use strict'; di.renderedLanguage = 'changed'; }, TypeError);
});

// ── EXP-51/52/53 (AC-9): all three required content categories present ──

test('a built Delivery Intent carries all three required content categories', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams());
  assert.equal(result.status, 'BUILT');
  const di = result.deliveryIntent;
  assert.equal(typeof di.renderedLanguage, 'string');       // EXP-51
  assert.equal(typeof di.semanticSignal, 'object');           // EXP-52
  assert.equal(typeof di.correlation, 'object');               // EXP-53
});

test('isValidDeliveryIntent accepts a correctly-built Delivery Intent for each valid kind/boundaryType/safetyDisposition combination', () => {
  const cases = [
    { kind: 'RECOMMENDATION' },
    { kind: 'RECOMMENDATION', safetyDisposition: 'UNMODIFIED' },
    { kind: 'INITIATIVE', safetyDisposition: 'MODIFIED' },
    { kind: 'BOUNDARY', boundaryType: 'REFUSAL', safetyDisposition: 'BLOCKED' },
    { kind: 'BOUNDARY', boundaryType: 'ESCALATION', safetyDisposition: 'ESCALATED' }
  ];
  cases.forEach((semanticSignal) => {
    const result = DeliveryIntentContract.buildDeliveryIntent(validParams({ semanticSignal: semanticSignal }));
    assert.equal(result.status, 'BUILT', JSON.stringify(semanticSignal));
    assert.equal(DeliveryIntentContract.isValidDeliveryIntent(result.deliveryIntent), true, JSON.stringify(semanticSignal));
  });
});

// ── EXP-53: correlation without embedding/duplicating the complete TerminalDecision ──

test('correlation carries only an opaque decisionId — never candidateProvenance, decisionPassTrace, or any other TerminalDecision field', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams());
  assert.equal(result.status, 'BUILT');
  assert.deepEqual(Object.keys(result.deliveryIntent.correlation), ['decisionId']);
});

test('a correlation object carrying an extra field (e.g. an embedded TerminalDecision fragment) is rejected, not silently accepted', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams({
    correlation: { decisionId: 'decision-123', candidateProvenance: [{ opportunityId: 'x' }] }
  }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_CORRELATION');
});

// ── EXP-50: never kind: 'SILENCE'; EXP-25.4 mirror: boundaryType present iff BOUNDARY ──

test('kind: SILENCE is refused — a Delivery Intent is never built for a Silence-kind decision', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams({ semanticSignal: { kind: 'SILENCE' } }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_SEMANTIC_SIGNAL');
});

test('boundaryType is required when kind is BOUNDARY', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams({ semanticSignal: { kind: 'BOUNDARY' } }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_SEMANTIC_SIGNAL');
});

test('boundaryType is rejected when kind is not BOUNDARY', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams({
    semanticSignal: { kind: 'RECOMMENDATION', boundaryType: 'REFUSAL' }
  }));
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INVALID_SEMANTIC_SIGNAL');
});

test('an unknown boundaryType or safetyDisposition value is rejected', () => {
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({
    semanticSignal: { kind: 'BOUNDARY', boundaryType: 'WARNING' }
  })).status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({
    semanticSignal: { kind: 'RECOMMENDATION', safetyDisposition: 'DEFERRED' }
  })).status, 'REJECTED'); // DEFERRED always co-occurs with SILENCE (§25.4) — never valid here
});

// ── EXP-56/57 (AC-9): prohibited content categories, platform-neutral, immutable ──

test('a top-level field outside {renderedLanguage, semanticSignal, correlation} is rejected — enforces EXP-56 structurally', () => {
  ['platform', 'ui', 'notification', 'widget', 'chat', 'push', 'layout', 'presentation'].forEach((key) => {
    const params = validParams();
    params[key] = 'anything';
    const result = DeliveryIntentContract.buildDeliveryIntent(params);
    assert.equal(result.status, 'REJECTED', key);
    assert.equal(result.reason, 'UNRECOGNIZED_FIELD', key);
  });
});

test('a Delivery Intent never contains a platform, UI, notification, widget, chat, push, or layout field, by construction', () => {
  const result = DeliveryIntentContract.buildDeliveryIntent(validParams());
  const serialized = JSON.stringify(result.deliveryIntent);
  ['platform', 'notification', 'widget', 'chatSurface', 'pushToken', 'layout'].forEach((forbidden) => {
    assert.equal(serialized.toLowerCase().indexOf(forbidden.toLowerCase()), -1, forbidden);
  });
});

// ── Defensive input validation (mirrors EXP-19's established discipline) ──

test('missing or empty renderedLanguage is rejected', () => {
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ renderedLanguage: '' })).status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ renderedLanguage: undefined })).status, 'REJECTED');
});

test('missing or empty correlation.decisionId is rejected', () => {
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ correlation: { decisionId: '' } })).status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ correlation: {} })).status, 'REJECTED');
});

test('non-object params, and non-object semanticSignal/correlation, are rejected rather than throwing', () => {
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(null).status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent('not an object').status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ semanticSignal: 'x' })).status, 'REJECTED');
  assert.equal(DeliveryIntentContract.buildDeliveryIntent(validParams({ correlation: null })).status, 'REJECTED');
});

// ── isValidDeliveryIntent as a standalone downstream conformance check ──

test('isValidDeliveryIntent rejects a plausible-looking but malformed candidate', () => {
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent(null), false);
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent({}), false);
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent({
    schemaVersion: 'wrong/1.0', renderedLanguage: 'x', semanticSignal: { kind: 'RECOMMENDATION' },
    correlation: { decisionId: 'd' }, immutable: true
  }), false); // wrong schemaVersion
  assert.equal(DeliveryIntentContract.isValidDeliveryIntent({
    schemaVersion: DeliveryIntentContract.SCHEMA_VERSION, renderedLanguage: 'x',
    semanticSignal: { kind: 'RECOMMENDATION' }, correlation: { decisionId: 'd' }, immutable: false
  }), false); // immutable must be true
});

// ── Vocabulary closure ──

test('KINDS excludes SILENCE; SAFETY_DISPOSITIONS excludes DEFERRED', () => {
  assert.equal(DeliveryIntentContract.KINDS.indexOf('SILENCE'), -1);
  assert.deepEqual(DeliveryIntentContract.KINDS, ['RECOMMENDATION', 'INITIATIVE', 'BOUNDARY']);
  assert.equal(DeliveryIntentContract.SAFETY_DISPOSITIONS.indexOf('DEFERRED'), -1);
  assert.deepEqual(DeliveryIntentContract.SAFETY_DISPOSITIONS, ['UNMODIFIED', 'MODIFIED', 'BLOCKED', 'ESCALATED']);
  assert.deepEqual(DeliveryIntentContract.BOUNDARY_TYPES, ['REFUSAL', 'ESCALATION']);
});
