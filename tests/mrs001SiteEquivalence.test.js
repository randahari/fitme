// MRS-001 — S-E per-site equivalence, S-P Safety controls, S-T declared tightening, Z-1/Z-2/Z-3/Z-6/Z-7
// (docs/specs/MRS_001_SPEC_v1.0.md §12, §16, §19 S-E/S-P/S-T). Every one of S1–S21 is driven through its
// exported parse or entry function.
//
// PRE_MRS_DIGESTS (sha256 of JSON.stringify(result), 16 hex) were recorded from the pre-MRS-001 tree
// (HEAD f6ae1a1, via git archive) with this same catalog and the historical untyped fixture { text }:
// under that tree's content[0].text read, a typed and an untyped block gave the same result (§16 Z-2
// baseline). Here every response is a structurally valid current-provider response { type: 'text', text }.
// S20/S21 compare the stage result's semantic fields (status, entries / verdicts); the v1.2 `reason`
// diagnostic is E.0.2d's own addition (E.0.2d SPEC v1.2 §15.0) and is checked by the E.0.2d suites.
// Run with: node --test tests/mrs001SiteEquivalence.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const req = (p) => require(path.join(__dirname, '..', p));
const digest = (v) => crypto.createHash('sha256').update(String(JSON.stringify(v))).digest('hex').slice(0, 16);
const CC = req('js/coachDecisionSystem/consolidationContract.js');
const mk = (t, x) => Object.assign({ content: [{ type: 'text', text: t }] }, x || {});
const E02D = {
  gen: (M, t) => M.configure({ modelTransport: t, profile: CC.DEFAULT_GENERATOR_PROFILE }),
  ver: (M, t) => M.configure({ modelTransport: t, profile: CC.DEFAULT_VERIFIER_PROFILE })
};

function makeCatalog(req, e02d) {
  const F = '```';
  const J = (o) => JSON.stringify(o);
  const TU = req('js/coachDecisionSystem/turnUnderstandingInterpreter.js');
  const EPSI = req('js/coachDecisionSystem/explicitPreferenceStatementInterpreter.js');
  const ER = req('js/coachDecisionSystem/explicitRequestInterpreter.js');
  const RS = req('js/coachDecisionSystem/readinessStateInterpreter.js');
  const AP = req('js/coachDecisionSystem/activityPreferenceInterpreter.js');
  const AO = req('js/coachDecisionSystem/activityOppositionInterpreter.js');
  const SIT = req('js/coachDecisionSystem/situationalContextInterpreter.js');
  const SC = req('js/coachDecisionSystem/safetyContextInterpreter.js');
  const USP = req('js/coachDecisionSystem/userSafetyProvenanceInterpreter.js');
  const RCF = req('js/coachDecisionSystem/riskCharacteristicInterpreter.js');
  const TRR = req('js/coachDecisionSystem/trainingReadinessReasoningComponent.js');
  const GR = req('js/coachDecisionSystem/generalReasoningCapability.js');
  const SCD = req('js/coachDecisionSystem/semanticContextDiscoveryInterpreter.js');
  const USI = req('js/coachDecisionSystem/userStatedIntakeInterpreter.js');
  const GEN = req('js/coachDecisionSystem/consolidationInterpreter.js');
  const VER = req('js/coachDecisionSystem/consolidationVerifier.js');

  async function viaStub(M, resp, fn) {
    M.configure({ callClaude: async () => resp });
    try { return await fn(); } finally { M.configure({ callClaude: null }); }
  }
  const tuEntry = (o) => Object.assign({ id: 't1', affirmativeRequestPresent: false, domain: null, topic: null, currentStateStatementPresent: false, currentStateStatementText: null, negativeControlPresent: false, desireOnlyPresent: false, personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null }, o);
  const proposal = (o) => Object.assign({ outcome: 'ACTION_PROPOSED', action: 'Take an easy 20-minute walk today.', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' }, o);
  const SENT = '@@OPEN_UNDERSTANDING@@';
  const TU_POS = J({ results: [tuEntry({ affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY' })] });
  const TU_OPEN = J({ id: 't1', summary: 'The user describes a test text.', mentions: ['טקסט בדיקה'] });
  const TURN = { turnId: 't1', text: 'טקסט בדיקה' };
  const genProp = { operation: 'CREATE', factors: [{ conceptKey: 'k1', newConceptLabel: null, role: 'subject', valueText: null }], relationText: 'An association.', evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', grounding: null, supporting: ['o1'], contradicting: [], reference: null, restatesUserStatement: false, safetyAdjacent: false };
  const GEN_INPUT = { observations: [{ obsKey: 'o1', segments: [{ segmentId: 's', authorship: 'USER_AUTHORED', text: 'x' }] }], concepts: [], records: [], userStated: [] };
  const VER_ITEMS = [
    { item: 'p1', operation: 'CREATE', claim: { relationText: 'r' }, supporting: ['o1'], contradicting: [], target: null, list: null, observations: null },
    { item: 'p2', operation: 'APPEND_EVIDENCE', claim: null, supporting: null, contradicting: null, target: 'r1', list: 'supporting', observations: ['o2'] }
  ];
  const VER_INPUT = { observations: [{ obsKey: 'o1' }, { obsKey: 'o2' }], userStated: [], targets: [{ recordKey: 'r1' }], items: VER_ITEMS };
  const C_OK = { item: 'p1', restatement: 'NOT_RESTATED', unsupported: 'NONE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'FAITHFUL', direction: 'NOT_APPLICABLE' };
  const A_OK = { item: 'p2', restatement: 'NOT_RESTATED', unsupported: 'NOT_APPLICABLE', safety: 'NOT_SAFETY_ADJACENT', temporal: 'NOT_APPLICABLE', direction: 'CONSISTENT' };
  const strip = (r) => r && { status: r.status, entries: r.entries, verdicts: r.verdicts };

  // cases: [label, text, extra]
  const std = (pos, neg) => [['pos', pos], ['neg', neg], ['notJson', 'not json'], ['fenced', F + 'json\n' + pos + '\n' + F], ['empty', '']];
  return [
    { id: 'S1', safety: false, invoke: (r) => TU._internal.parseAndValidate(r, ['t1']), cases: std(TU_POS, J({ results: [tuEntry({})] })) },
    { id: 'S1+S2', safety: false, invoke: (r) => viaStub(TU, r, () => TU.understand(TURN)),
      cases: [['free', TU_POS], ['twoPart', TU_POS + SENT + TU_OPEN], ['truncated', TU_POS + SENT + TU_OPEN, { stop_reason: 'max_tokens' }], ['openInvalid', TU_POS + SENT + 'nope'], ['closedInvalid', 'nope' + SENT + TU_OPEN], ['notJson', 'not json']] },
    { id: 'S3', safety: false, invoke: (r) => EPSI._internal.parseAndValidate(r, ['p1'], { p1: 'I really love running' }), cases: std(J({ results: [{ id: 'p1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running', ineligibleReason: null }] }), J({ results: [{ id: 'p1', eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'NO_EXPLICIT_PREFERENCE' }] })) },
    { id: 'S4', safety: false, invoke: (r) => ER._internal.parseAndValidate(r, ['r1']), cases: std(J({ results: [{ id: 'r1', requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'SUPPRESS_ORDINARY_INITIATIVE', scopeStatus: 'UNRESOLVED', domain: null, topic: null }] }), J({ results: [{ id: 'r1', requestClassification: 'INELIGIBLE_OR_NOT_CLASSIFIED', controlIntent: null, scopeStatus: null, domain: null, topic: null }] })) },
    { id: 'S5', safety: false, invoke: (r) => RS._internal.parseAndValidate(r, ['r2']), cases: std(J({ results: [{ id: 'r2', verdict: 'CLASSIFIED_CURRENT_STATE' }] }), J({ results: [{ id: 'r2', verdict: 'INELIGIBLE_OR_NOT_CLASSIFIED' }] })) },
    { id: 'S6', safety: false, invoke: (r) => AP._internal.parseAndValidate(r, ['r3'], { r3: 'I really love running' }), cases: std(J({ results: [{ id: 'r3', sentimentClassification: 'POSITIVE_SENTIMENT', activityText: 'running' }] }), J({ results: [{ id: 'r3', sentimentClassification: 'NOT_PREFERENCE_OR_NOT_CLASSIFIED', activityText: null }] })).concat([['nonLiteral', J({ results: [{ id: 'r3', sentimentClassification: 'POSITIVE_SENTIMENT', activityText: 'cycling' }] })]]) },
    { id: 'S7', safety: false, invoke: (r) => AO._internal.parseAndValidate(r, ['r4'], { r4: 'please never suggest swimming' }), cases: std(J({ results: [{ id: 'r4', oppositionClassification: 'ACTIVITY_OPPOSITION_STATED', opposedActivityText: 'swimming' }] }), J({ results: [{ id: 'r4', oppositionClassification: 'NOT_OPPOSITION_OR_NOT_CLASSIFIED', opposedActivityText: null }] })).concat([['nonLiteral', J({ results: [{ id: 'r4', oppositionClassification: 'ACTIVITY_OPPOSITION_STATED', opposedActivityText: 'running' }] })]]) },
    { id: 'S8', safety: false, invoke: (r) => SIT._internal.parseAndValidate(r, ['r5']), cases: std(J({ results: [{ id: 'r5', verdict: 'CLASSIFIED_CURRENT_STATE' }] }), J({ results: [{ id: 'r5', verdict: 'INELIGIBLE_OR_NOT_CLASSIFIED' }] })) },
    { id: 'S9/F-8', safety: true, invoke: (r) => viaStub(SC, r, () => SC.classify([{ id: 's1', text: 'my doctor said no running for two weeks' }])), cases: std(J({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'running', statedDurationText: 'two weeks' }] }), J({ results: [{ id: 's1', restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] })).concat([['nonLiteral', J({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'swimming', statedDurationText: 'two weeks' }] })]]) },
    { id: 'S9/F-9', safety: true, invoke: (r) => viaStub(SC, r, () => SC.classifyWithStatus([{ id: 's1', text: 'my doctor said no running for two weeks' }])), cases: std(J({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'running', statedDurationText: 'two weeks' }] }), J({ results: [{ id: 's1', restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] })).concat([['nonLiteral', J({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'swimming', statedDurationText: 'two weeks' }] })]]) },
    { id: 'S10', safety: true, invoke: (r) => SC._internal.parseAndValidateCorrection(r, 'c1'), cases: std(J({ results: [{ id: 'c1', correctionConfirmed: true }] }), J({ results: [{ id: 'c1', correctionConfirmed: false }] })) },
    { id: 'S11', safety: true, invoke: (r) => USP._internal.parseAndValidate(r, ['u1'], { u1: 'my doctor said no running' }), cases: std(J({ results: [{ id: 'u1', namedSourceClassification: 'NAMED_SOURCE_STATED', statedSourceText: 'my doctor' }] }), J({ results: [{ id: 'u1', namedSourceClassification: 'NO_NAMED_SOURCE_OR_NOT_CLASSIFIED', statedSourceText: null }] })).concat([['nonLiteral', J({ results: [{ id: 'u1', namedSourceClassification: 'NAMED_SOURCE_STATED', statedSourceText: 'my coach' }] })]]) },
    { id: 'S12', safety: true, invoke: (r) => RCF._internal.parseCandidateContentResponse(r, 'go for an easy run today'), cases: std(J({ tags: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'easy run' }] }), J({ tags: [] })).concat([['nonLiteral', J({ tags: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'long swim' }] })]]) },
    { id: 'S13', safety: true, invoke: (r) => RCF._internal.parseDurableConstraintResponse(r, 'I am allergic to peanuts'), cases: std(J({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'allergic to peanuts' }] }), J({ candidates: [] })).concat([['nonLiteral', J({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'allergic to shellfish' }] })]]) },
    { id: 'S14', safety: true, invoke: (r) => RCF._internal.parseCorrectionResponse(r, 'k1'), cases: std(J({ results: [{ id: 'k1', correctionConfirmed: true }] }), J({ results: [{ id: 'k1', correctionConfirmed: false }] })) },
    { id: 'S15', safety: true, invoke: (r) => RCF._internal.parseCandidateConflictResponse(r), cases: std(J({ relation: 'CONFIRMED_CONFLICT' }), J({ relation: 'CONFIRMED_NO_CONFLICT' })) },
    { id: 'S16', safety: false, invoke: (r) => viaStub(TRR, r, () => TRR.propose({})), cases: std(J(proposal({ actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null })), J({ outcome: 'NO_VIABLE_PROPOSAL', action: null, actionCategory: null, activityReference: null, rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' })) },
    { id: 'S17', safety: false, invoke: (r) => viaStub(GR, r, () => GR.reason({}, {})), cases: std(J(proposal({})), J({ outcome: 'NO_VIABLE_PROPOSAL', action: null, rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' })) },
    { id: 'S18', safety: false, invoke: (r) => viaStub(SCD, r, () => SCD.discover({ need: { openScopeDescription: 'The user asks something open.', openEntityMentions: [{ text: 'something', origin: 'CURRENT_TURN', sourceTurnId: 't' }] }, catalogue: [{ id: 'alpha', description: 'Alpha information.', relevanceTags: [] }] })),
      cases: std(J({ selectedIds: ['alpha'], informationNeeds: [] }), J({ selectedIds: [], informationNeeds: [] })).concat([['maxTokens', J({ selectedIds: ['alpha'], informationNeeds: [] }), { stop_reason: 'max_tokens' }]]) },
    { id: 'S19', safety: false, invoke: (r) => USI._internal.parseResponse(r), cases: std(J({ proposals: [{ a: 1 }] }), J({ proposals: [] })).concat([['maxTokens', J({ proposals: [] }), { stop_reason: 'max_tokens' }]]) },
    { id: 'S20', safety: false, invoke: async (r) => { e02d.gen(GEN, async () => r); return strip(await GEN.interpret(GEN_INPUT)); },
      cases: std(J({ proposals: [genProp] }), J({ proposals: [] })).concat([['maxTokens', J({ proposals: [] }), { stop_reason: 'max_tokens' }], ['malformedProposal', J({ proposals: [genProp, { operation: 'CREATE' }] })]]) },
    { id: 'S21', safety: false, invoke: async (r) => { e02d.ver(VER, async () => r); return strip(await VER.verify(VER_INPUT)); },
      cases: std(J({ verdicts: [C_OK, A_OK] }), J({ verdicts: [Object.assign({}, C_OK, { restatement: 'RESTATED' }), A_OK] })).concat([['maxTokens', J({ verdicts: [C_OK, A_OK] }), { stop_reason: 'max_tokens' }], ['attribution', J({ verdicts: [C_OK, C_OK] })]]) }
  ];
};

const PRE_MRS_DIGESTS = {"S1":{"pos":"ebb47e94a132f677","neg":"1a94db24bceb85fe","notJson":"44136fa355b3678a","fenced":"ebb47e94a132f677","empty":"44136fa355b3678a"},"S1+S2":{"free":"fa2a62cb5572c6f8","twoPart":"6772794b67f368c6","truncated":"fa2a62cb5572c6f8","openInvalid":"fa2a62cb5572c6f8","closedInvalid":"5ee224952b225991","notJson":"5ee224952b225991"},"S3":{"pos":"4cbac61b5db77eed","neg":"c4de660038ecb07f","notJson":"44136fa355b3678a","fenced":"4cbac61b5db77eed","empty":"44136fa355b3678a"},"S4":{"pos":"ebe97ffe272148bf","neg":"f59a99ef8a4bb788","notJson":"44136fa355b3678a","fenced":"ebe97ffe272148bf","empty":"44136fa355b3678a"},"S5":{"pos":"5755bab2b3d38340","neg":"44136fa355b3678a","notJson":"44136fa355b3678a","fenced":"5755bab2b3d38340","empty":"44136fa355b3678a"},"S6":{"pos":"1c1439d5e25e41df","neg":"ee0884dc624d4a3d","notJson":"44136fa355b3678a","fenced":"1c1439d5e25e41df","empty":"44136fa355b3678a","nonLiteral":"44136fa355b3678a"},"S7":{"pos":"c6ee2202fefd835b","neg":"7973400614a49e0f","notJson":"44136fa355b3678a","fenced":"c6ee2202fefd835b","empty":"44136fa355b3678a","nonLiteral":"44136fa355b3678a"},"S8":{"pos":"4543fc71b4f9fb24","neg":"44136fa355b3678a","notJson":"44136fa355b3678a","fenced":"4543fc71b4f9fb24","empty":"44136fa355b3678a"},"S9/F-8":{"pos":"b6afabd669f04ef7","neg":"4f53cda18c2baa0c","notJson":"4f53cda18c2baa0c","fenced":"b6afabd669f04ef7","empty":"4f53cda18c2baa0c","nonLiteral":"4f53cda18c2baa0c"},"S9/F-9":{"pos":"8b6990c493bd25d1","neg":"5979b291dc752579","notJson":"368078a46c9e3912","fenced":"8b6990c493bd25d1","empty":"368078a46c9e3912","nonLiteral":"368078a46c9e3912"},"S10":{"pos":"b5bea41b6c623f7c","neg":"fcbcf165908dd18a","notJson":"74234e98afe7498f","fenced":"b5bea41b6c623f7c","empty":"74234e98afe7498f"},"S11":{"pos":"1ae9d0822122bac4","neg":"b39d269889161156","notJson":"44136fa355b3678a","fenced":"1ae9d0822122bac4","empty":"44136fa355b3678a","nonLiteral":"44136fa355b3678a"},"S12":{"pos":"5884111c957a8428","neg":"4f53cda18c2baa0c","notJson":"74234e98afe7498f","fenced":"5884111c957a8428","empty":"74234e98afe7498f","nonLiteral":"4f53cda18c2baa0c"},"S13":{"pos":"61d2dea44b50d027","neg":"4f53cda18c2baa0c","notJson":"74234e98afe7498f","fenced":"61d2dea44b50d027","empty":"74234e98afe7498f","nonLiteral":"4f53cda18c2baa0c"},"S14":{"pos":"b5bea41b6c623f7c","neg":"fcbcf165908dd18a","notJson":"74234e98afe7498f","fenced":"b5bea41b6c623f7c","empty":"74234e98afe7498f"},"S15":{"pos":"23626e14176acebb","neg":"bbcbcde79d2d9814","notJson":"74234e98afe7498f","fenced":"23626e14176acebb","empty":"74234e98afe7498f"},"S16":{"pos":"c038eeea39bed03b","neg":"3f84831a1f411c91","notJson":"74234e98afe7498f","fenced":"c038eeea39bed03b","empty":"74234e98afe7498f"},"S17":{"pos":"82fe20db308bc4ef","neg":"8a2279147ddcfe20","notJson":"74234e98afe7498f","fenced":"82fe20db308bc4ef","empty":"74234e98afe7498f"},"S18":{"pos":"cebba877ee16c50d","neg":"6b73723a0d209427","notJson":"899232f1caf14fe1","fenced":"cebba877ee16c50d","empty":"899232f1caf14fe1","maxTokens":"899232f1caf14fe1"},"S19":{"pos":"f1108f75d63fdf96","neg":"301a28e1934a852c","notJson":"3dd0c685242805d8","fenced":"f1108f75d63fdf96","empty":"3dd0c685242805d8","maxTokens":"3dd0c685242805d8"},"S20":{"pos":"a868363c23047ee6","neg":"681c17a37c4388e6","notJson":"a5d7e311d8a78fca","fenced":"a868363c23047ee6","empty":"a5d7e311d8a78fca","maxTokens":"a5d7e311d8a78fca","malformedProposal":"320da86aaea9ffd5"},"S21":{"pos":"14001a3968ed353c","neg":"8094570cc58172b0","notJson":"4b8705e879372da1","fenced":"14001a3968ed353c","empty":"4b8705e879372da1","maxTokens":"4b8705e879372da1","attribution":"4b8705e879372da1"}};

const SITES = makeCatalog(req, E02D);
// The site's existing fail-closed outcome: what it returned before MRS-001 for an empty answer text
// (for Turn Understanding's understand(): for an unparseable one).
const failureCase = (s) => (s.id === 'S1+S2' ? 'notJson' : 'empty');
// A structurally valid positive answer text for the site.
const positive = (s) => s.cases[0][1];
const THINK = { type: 'thinking', thinking: 'x', signature: 's' };
// Every structural failure class reachable through a provider response. CONTRACT_UNRESOLVED is
// unreachable from a converted site by construction (G5, tests/mrs001Wiring.test.js).
const FAILURE_SHAPES = {
  MALFORMED_BLOCK_untyped: (p) => ({ content: [{ text: p }] }),                                       // Z-7
  MALFORMED_BLOCK_nonStringText: () => ({ content: [{ type: 'text', text: 7 }] }),
  REASONING_NOT_PERMITTED: (p) => ({ content: [THINK, { type: 'text', text: p }] }),                  // Z-6
  REASONING_NOT_PERMITTED_redacted: (p) => ({ content: [{ type: 'redacted_thinking', data: 'x' }, { type: 'text', text: p }] }),
  MULTIPLE_ANSWER_TEXT: (p) => ({ content: [{ type: 'text', text: p }, { type: 'text', text: p }] }),   // Z-7
  UNSUPPORTED_BLOCK: (p) => ({ content: [{ type: 'text', text: p }, { type: 'tool_use', id: 't', name: 'n', input: {} }] }), // Z-7
  REFUSAL_partialText: (p) => ({ content: [{ type: 'text', text: p }], stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'cyber', explanation: 'x' } }), // Z-7
  REFUSAL_emptyContent: () => ({ content: [], stop_reason: 'refusal' }),
  NO_ANSWER_TEXT_emptyContent: () => ({ content: [] }),                                                // Z-6
  NOT_A_RESPONSE_missingContent: () => ({ stop_reason: 'end_turn' }),                                  // Z-6
  NOT_A_RESPONSE_nonObject: () => 'not an object'                                                      // Z-6
};

test('S-E / Z-1 / Z-2 / Z-3: every site S1–S21 returns results deep-equal to its pre-MRS-001 baseline for structurally valid single-text responses (valid, invalid, fenced, empty, stop-reason and literal-anchor cases)', async () => {
  let n = 0;
  for (const s of SITES) {
    for (const [label, text, extra] of s.cases) {
      assert.equal(digest(await s.invoke(mk(text, extra))), PRE_MRS_DIGESTS[s.id][label], s.id + ' / ' + label);
      n++;
    }
  }
  assert.equal(n, Object.values(PRE_MRS_DIGESTS).reduce((a, m) => a + Object.keys(m).length, 0));
  assert.equal(n, 124);
});

test('S-E / S-T / Z-6 / Z-7: every structural failure class yields exactly each site\'s existing fail-closed outcome, never a parsed positive', async () => {
  for (const s of SITES) {
    const expected = PRE_MRS_DIGESTS[s.id][failureCase(s)];
    assert.notEqual(PRE_MRS_DIGESTS[s.id][s.cases[0][0]], expected, s.id + ': sanity — the positive differs from the failure outcome');
    for (const [code, shape] of Object.entries(FAILURE_SHAPES)) {
      assert.equal(digest(await s.invoke(shape(positive(s)))), expected, s.id + ' / ' + code);
    }
  }
});

test('S-P: Safety parse sites S9–S15 — positive controls match the baseline, every failure class takes the existing failure path, literal anchors are still rejected', async () => {
  const safety = SITES.filter((s) => s.safety);
  assert.deepEqual(safety.map((s) => s.id), ['S9/F-8', 'S9/F-9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15']);
  for (const s of safety) {
    assert.equal(digest(await s.invoke(mk(positive(s)))), PRE_MRS_DIGESTS[s.id][s.cases[0][0]], s.id + ' positive');
    for (const shape of Object.values(FAILURE_SHAPES)) assert.equal(digest(await s.invoke(shape(positive(s)))), PRE_MRS_DIGESTS[s.id].empty, s.id + ' negative');
    const nonLiteral = s.cases.find((c) => c[0] === 'nonLiteral');
    if (nonLiteral) assert.equal(digest(await s.invoke(mk(nonLiteral[1]))), PRE_MRS_DIGESTS[s.id].nonLiteral, s.id + ' literal anchor');
  }
  // the F-9 status path reports its own existing explicit FAILED status, never "nothing found"
  const f9 = SITES.find((s) => s.id === 'S9/F-9');
  assert.equal((await f9.invoke(FAILURE_SHAPES.REASONING_NOT_PERMITTED(positive(f9)))).status, 'FAILED');
});

test('S-T: the declared Z-7 tightening at a representative proposer site (S16, TRR) and a Safety site (S9): each shape the old first-block read would have parsed now fails closed', async () => {
  for (const id of ['S16', 'S9/F-8']) {
    const s = SITES.find((x) => x.id === id);
    const parsedBefore = PRE_MRS_DIGESTS[id][s.cases[0][0]]; // what the first-block read returned for the same text
    for (const code of ['MULTIPLE_ANSWER_TEXT', 'UNSUPPORTED_BLOCK', 'REFUSAL_partialText', 'MALFORMED_BLOCK_untyped']) {
      const got = digest(await s.invoke(FAILURE_SHAPES[code](positive(s))));
      assert.notEqual(got, parsedBefore, id + ' / ' + code + ' is no longer parsed');
      assert.equal(got, PRE_MRS_DIGESTS[id].empty, id + ' / ' + code + ' takes the existing failure path');
    }
  }
});

test('Z-3: stage-owned stop-reason rules are unchanged — OU-001 truncation drops only the open segment; E.0.2b, USI-001 and E.0.2d max_tokens fail', async () => {
  const tu = SITES.find((s) => s.id === 'S1+S2');
  const truncated = await tu.invoke(mk(tu.cases.find((c) => c[0] === 'truncated')[1], { stop_reason: 'max_tokens' }));
  assert.equal(truncated.turnUnderstanding.interpretationStatus, 'CLASSIFIED');
  assert.equal(truncated.openUnderstanding, null);
  for (const id of ['S18', 'S19', 'S20', 'S21']) {
    const s = SITES.find((x) => x.id === id);
    assert.equal(digest(await s.invoke(mk(positive(s), { stop_reason: 'max_tokens' }))), PRE_MRS_DIGESTS[id].empty, id);
  }
});
