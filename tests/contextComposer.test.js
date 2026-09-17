// WP0 Phase A — Context Composer contract tests (docs/specs/WP0_SPEC_v1.0.md §17/§18,
// Revision 3). Validates ContextFragmentProvider registration, required-vs-optional assembly
// semantics, graceful degradation, and the binding "optional context is relevance-bounded, not
// the full ceiling" correction (Round 2 correction 2 / Round 3 item 4).
// Run with: node --test tests/contextComposer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ContextComposer = require('../js/coachDecisionSystem/contextComposer.js');

test.beforeEach(() => { ContextComposer.__resetForTests__(); });

function capability(overrides) {
  return Object.assign({
    requiredContext: [],
    contextCeiling: [],
    contextBaseline: [],
    needShapeDefaults: {}
  }, overrides || {});
}

test('registerFragmentProvider() accepts a well-formed provider', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({ value: 1, availability: 'AVAILABLE' }) });
  assert.equal(result.ok, true);
  assert.ok(ContextComposer.getFragmentProvider('a'));
});

test('registerFragmentProvider() rejects a missing id', () => {
  const result = ContextComposer.registerFragmentProvider({ invoke: () => ({}) });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_ID');
});

test('registerFragmentProvider() rejects a non-function invoke', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: 'not a function' });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_INVOKE');
});

test('registerFragmentProvider() rejects a duplicate id', () => {
  ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}) });
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}) });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'DUPLICATE_ID');
});

test('registerFragmentProvider() rejects non-array/non-string relevanceTags', () => {
  const result = ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}), relevanceTags: 'not-an-array' });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_RELEVANCE_TAGS');
});

test('getAllFragmentProviderIds() reflects registrations', () => {
  ContextComposer.registerFragmentProvider({ id: 'a', invoke: () => ({}) });
  ContextComposer.registerFragmentProvider({ id: 'b', invoke: () => ({}) });
  assert.deepEqual(ContextComposer.getAllFragmentProviderIds().sort(), ['a', 'b']);
});

test('assemble(): a required fragment reporting UNAVAILABLE makes the capability non-viable, with the exact missingId', async () => {
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => ({ value: null, availability: 'UNAVAILABLE' }) });
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
  assert.equal(result.reason, 'REQUIRED_CONTEXT_UNAVAILABLE');
  assert.equal(result.missingId, 'req1');
});

test('assemble(): the FIRST unavailable required fragment short-circuits — a later required fragment is never invoked', async () => {
  let secondInvoked = false;
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => ({ value: null, availability: 'UNAVAILABLE' }) });
  ContextComposer.registerFragmentProvider({ id: 'req2', invoke: () => { secondInvoked = true; return { value: 1, availability: 'AVAILABLE' }; } });
  await ContextComposer.assemble({}, capability({ requiredContext: ['req1', 'req2'] }));
  assert.equal(secondInvoked, false);
});

test('assemble(): a required fragment reporting PARTIAL is treated as present (not UNAVAILABLE) and included', async () => {
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => ({ value: 'partial-data', availability: 'PARTIAL' }) });
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, true);
  assert.deepEqual(result.context.req1, { value: 'partial-data', availability: 'PARTIAL' });
});

test('assemble(): an unregistered fragment id degrades to UNAVAILABLE honestly, never throws', async () => {
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['neverRegistered'] }));
  assert.equal(result.viable, false);
  assert.equal(result.missingId, 'neverRegistered');
});

test('assemble(): a throwing invoke() degrades to UNAVAILABLE, never propagates the exception', async () => {
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => { throw new Error('boom'); } });
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
  assert.equal(result.missingId, 'req1');
});

test('assemble(): a malformed invoke() return shape degrades to UNAVAILABLE, never fabricates a value', async () => {
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => ({ notValue: true }) });
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['req1'] }));
  assert.equal(result.viable, false);
});

test('assemble(): an async (Promise-returning) invoke() is supported and awaited correctly', async () => {
  ContextComposer.registerFragmentProvider({
    id: 'asyncFrag',
    invoke: () => new Promise((resolve) => setTimeout(() => resolve({ value: 'async-value', availability: 'AVAILABLE' }), 5))
  });
  const result = await ContextComposer.assemble({}, capability({ requiredContext: ['asyncFrag'] }));
  assert.equal(result.viable, true);
  assert.equal(result.context.asyncFrag.value, 'async-value');
});

test('assemble(): with zero requiredContext and zero contextCeiling, always viable with an empty context', async () => {
  const result = await ContextComposer.assemble({}, capability());
  assert.equal(result.viable, true);
  assert.deepEqual(result.context, {});
});

test('assemble(): optional (baseline) fragments are included alongside required ones', async () => {
  ContextComposer.registerFragmentProvider({ id: 'req1', invoke: () => ({ value: 'r', availability: 'AVAILABLE' }) });
  ContextComposer.registerFragmentProvider({ id: 'opt1', invoke: () => ({ value: 'o', availability: 'AVAILABLE' }) });
  const result = await ContextComposer.assemble({}, capability({
    requiredContext: ['req1'],
    contextCeiling: ['opt1'],
    contextBaseline: ['opt1']
  }));
  assert.equal(result.viable, true);
  assert.ok('req1' in result.context);
  assert.ok('opt1' in result.context);
});

test('assemble(): optional context is bounded to the relevance-selected subset, never the full contextCeiling (Round 2 correction 2 / Round 3 item 4)', async () => {
  ['a', 'b', 'c'].forEach((id) => ContextComposer.registerFragmentProvider({ id, invoke: () => ({ value: id, availability: 'AVAILABLE' }) }));
  const result = await ContextComposer.assemble(
    { shape: 'REQUEST_FOR_INFORMATION', openEntityMentions: [] },
    capability({ contextCeiling: ['a', 'b', 'c'], contextBaseline: ['a'] })
  );
  assert.equal(result.viable, true);
  assert.deepEqual(Object.keys(result.context), ['a']);
});

test('assemble(): a fragment id present in both requiredContext and the relevance-selected set is never double-invoked', async () => {
  let invokeCount = 0;
  ContextComposer.registerFragmentProvider({ id: 'shared', invoke: () => { invokeCount++; return { value: 1, availability: 'AVAILABLE' }; } });
  await ContextComposer.assemble(
    { shape: 'DISCLOSURE' },
    capability({ requiredContext: ['shared'], contextCeiling: ['shared'], contextBaseline: ['shared'] })
  );
  assert.equal(invokeCount, 1);
});

test('AVAILABILITY_VALUES is the exact, exhaustive, frozen three-value closed vocabulary', () => {
  assert.deepEqual(ContextComposer.AVAILABILITY_VALUES, ['AVAILABLE', 'UNAVAILABLE', 'PARTIAL']);
  assert.ok(Object.isFrozen(ContextComposer.AVAILABILITY_VALUES));
});
