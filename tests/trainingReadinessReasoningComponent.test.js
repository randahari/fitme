// TRR-001 — Training Readiness Reasoning Component unit tests (docs/specs/TRR_001_SPEC_v1.0.md §19-21).
// Run with: node --test tests/trainingReadinessReasoningComponent.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const Component = require('../js/coachDecisionSystem/trainingReadinessReasoningComponent.js');

function fakeResponse(obj) { return { content: [{ text: JSON.stringify(obj) }] }; }
function configureStub(handler) { Component.configure({ callClaude: handler }); }
test.afterEach(() => { Component.configure({ callClaude: null, timeoutMs: undefined }); });

var validExplanation = { rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' };

// ── Capability #10 — genuinely open-ended, not a closed list ────────────────────────────────

test('1. prompt frames capabilities 1-7 as illustrative examples, never as an exhaustive/closed list', () => {
  const prompt = Component._internal.buildPrompt({});
  assert.ok(/not an exhaustive list/i.test(prompt));
  assert.ok(/not limited to the examples above/i.test(prompt));
  assert.ok(!/must be one of/i.test(prompt));
});

test('2. Capability #10 — a bounded proposal outside the seven prompt examples is accepted, not rejected', async () => {
  configureStub(async () => fakeResponse(Object.assign({
    outcome: 'ACTION_PROPOSED',
    action: 'try a 15-minute mobility and stretching routine instead of today\'s planned session',
    actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'mobility and stretching'
  }, validExplanation)));
  const proposal = await Component.propose({});
  assert.ok(proposal, 'a well-formed proposal outside the seven examples must not be rejected');
  assert.equal(proposal.outcome, 'ACTION_PROPOSED');
  assert.equal(proposal.action.includes('mobility'), true);
});

// ── Three-outcome schema ─────────────────────────────────────────────────────────────────────

test('3. ACTION_PROPOSED with PHYSICAL_ACTIVITY requires activityReference', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'ACTION_PROPOSED', action: 'go for a walk', actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'a walk' }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal(proposal.outcome, 'ACTION_PROPOSED');
  assert.equal(proposal.activityReference, 'a walk');
});

test('4. ACTION_PROPOSED with NON_ACTIVITY_COACHING_ACTION must NOT carry activityReference (rejected if present)', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'ACTION_PROPOSED', action: 'take a rest day', actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: 'rest' }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal(proposal, null); // gating-dimension violation -> fail-closed
});

test('5. NON_ACTIVITY_COACHING_ACTION correctly proposed without activityReference', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'ACTION_PROPOSED', action: 'take a rest day', actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal(proposal.actionCategory, 'NON_ACTIVITY_COACHING_ACTION');
  assert.equal(proposal.activityReference, null);
});

test('6. CLARIFICATION_NEEDED carries neither actionCategory nor activityReference', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'CLARIFICATION_NEEDED', action: 'Which activity did you plan for today?', actionCategory: null, activityReference: null }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal(proposal.outcome, 'CLARIFICATION_NEEDED');
  assert.equal(proposal.actionCategory, null);
  assert.equal(proposal.activityReference, null);
});

test('7. CLARIFICATION_NEEDED with a fabricated actionCategory is rejected (gating-dimension violation)', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'CLARIFICATION_NEEDED', action: 'which activity?', actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'running' }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal(proposal, null);
});

test('8. NO_VIABLE_PROPOSAL is a legitimate, honest outcome requiring no other field', async () => {
  configureStub(async () => fakeResponse({ outcome: 'NO_VIABLE_PROPOSAL' }));
  const proposal = await Component.propose({});
  assert.equal(proposal.outcome, 'NO_VIABLE_PROPOSAL');
});

// ── Model cannot self-declare actionIdentity ────────────────────────────────────────────────

test('9. the schema has no actionIdentity field — a model response containing one is simply ignored, never trusted', async () => {
  configureStub(async () => fakeResponse(Object.assign({
    outcome: 'ACTION_PROPOSED', action: 'go for a run', actionCategory: 'PHYSICAL_ACTIVITY',
    activityReference: 'running', actionIdentity: { activity: 'RUNNING' } // model attempts to self-declare — must be ignored
  }, validExplanation)));
  const proposal = await Component.propose({});
  assert.equal('actionIdentity' in proposal, false);
  assert.equal(Object.keys(proposal).indexOf('actionIdentity'), -1);
});

test('10. prompt itself explicitly forbids the model from claiming a deterministic identity token', () => {
  const prompt = Component._internal.buildPrompt({});
  assert.ok(/must never claim to know/i.test(prompt));
});

// ── Clarification-preference requirement encoded in the prompt ─────────────────────────────

test('11. prompt encodes the binding clarification-preference requirement verbatim', () => {
  const prompt = Component._internal.buildPrompt({});
  assert.ok(/prefer this outcome over guessing/i.test(prompt));
  assert.ok(/prefer it over repeating the same proposal/i.test(prompt));
});

// ── Fail-closed behavior ─────────────────────────────────────────────────────────────────────

test('12. unconfigured callClaude fails closed to null', async () => {
  Component.configure({ callClaude: null });
  assert.equal(await Component.propose({}), null);
});

test('13. a thrown callClaude fails closed to null', async () => {
  configureStub(() => { throw new Error('boom'); });
  assert.equal(await Component.propose({}), null);
});

test('14. a timeout fails closed to null', async () => {
  Component.configure({ callClaude: () => new Promise(() => {}), timeoutMs: 20 });
  assert.equal(await Component.propose({}), null);
});

test('15. malformed JSON fails closed to null', async () => {
  configureStub(async () => ({ content: [{ text: 'not json' }] }));
  assert.equal(await Component.propose({}), null);
});

test('16. missing required explanation field fails closed to null', async () => {
  configureStub(async () => fakeResponse({ outcome: 'ACTION_PROPOSED', action: 'go for a run', actionCategory: 'PHYSICAL_ACTIVITY', activityReference: 'running', rationale: 'r' })); // missing evidenceBasis/expectedValue/uncertainty
  assert.equal(await Component.propose({}), null);
});

test('17. an unrecognized outcome token fails closed to null', async () => {
  configureStub(async () => fakeResponse(Object.assign({ outcome: 'SOMETHING_ELSE' }, validExplanation)));
  assert.equal(await Component.propose({}), null);
});

// ── Provider-session-memory prohibition ─────────────────────────────────────────────────────

test('18. no thread/session/conversation identifier is ever passed to callClaude', async () => {
  var capturedBody = null;
  configureStub(async (body) => { capturedBody = body; return fakeResponse({ outcome: 'NO_VIABLE_PROPOSAL' }); });
  await Component.propose({ some: 'context' });
  assert.equal('sessionId' in capturedBody, false);
  assert.equal('threadId' in capturedBody, false);
  assert.equal('conversationId' in capturedBody, false);
});

test('19. component is stateless — two independent propose() calls never share state', async () => {
  var callCount = 0;
  configureStub(async () => { callCount++; return fakeResponse({ outcome: 'NO_VIABLE_PROPOSAL' }); });
  await Component.propose({});
  await Component.propose({});
  assert.equal(callCount, 2);
});
