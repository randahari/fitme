// WP0 Phase E.0.2d — calibration-harness self-test (P8)
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md v1.2 §27, §27.1, §31, §31.4; tests/evals/e02d/README.md).
// Offline and deterministic: every case runs under a network trap and asserts zero network attempts.
// No model call, no API key, no paid run.
// Run with: node --test tests/e02dCalibrationHarness.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const H = require('./evals/e02dConsolidationCalibration.eval.js');
const { score, PRODUCT } = require('./evals/e02d/score.js');
const Interpreter = require('../js/coachDecisionSystem/consolidationInterpreter.js');
const Verifier = require('../js/coachDecisionSystem/consolidationVerifier.js');
const CC = require('../js/coachDecisionSystem/consolidationContract.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'e02d-harness-'));
const PRICES = { source: 'TEST FIXTURE ONLY — not a canonical price', effectiveDate: '1970-01-01', models: { 'claude-haiku-4-5-20251001': { inputPerMTok: 1, outputPerMTok: 5 } } };
const dry = (o) => H.runCalibration(Object.assign({ samples: 1, dryRun: true, outDir: TMP }, o));

// A belt-and-braces outer trap around the whole file, independent of the harness's own trap.
let outer;
test.before(() => { outer = H.installNetworkTrap(); });
test.after(() => { const n = outer.attempts(); outer.restore(); fs.rmSync(TMP, { recursive: true, force: true }); assert.equal(n, 0, 'network attempted during the self-test'); });

test('stage routing is exact; anything else fails closed', () => {
  const body = (content) => ({ model: 'm', max_tokens: 1, messages: [{ role: 'user', content }] });
  assert.equal(H.stageOf(body(Interpreter._internal.INSTRUCTION + '\n<observations>[]</observations>')), 'GENERATOR');
  assert.equal(H.stageOf(body(Verifier._internal.INSTRUCTION + '\n<observations>[]</observations>')), 'VERIFIER');
  for (const bad of [body('hello'), body(' ' + Interpreter._internal.INSTRUCTION + '\n'), body(Interpreter._internal.INSTRUCTION), {}, null]) {
    assert.throws(() => H.stageOf(bad), (e) => e.code === 'UNKNOWN_STAGE');
  }
});

test('the network trap counts and blocks fetch/http/https/net/tls, then restores them', () => {
  const t = H.installNetworkTrap();
  const http = require('node:http');
  assert.throws(() => globalThis.fetch('https://example.invalid'));
  assert.throws(() => http.request('http://example.invalid'));
  assert.throws(() => require('node:net').connect(1));
  assert.throws(() => require('node:tls').connect(1));
  assert.equal(t.attempts(), 4);
  t.restore();
});

test('dry-run scenarios exercise every pass path with the expected statuses, classes and calls', async () => {
  const r = await dry({ corpus: 'dry-run-scenarios' });
  assert.equal(r.artifact.networkAttempts, 0);
  assert.equal(r.artifact.samples.length, H.DRY_RUN_SCENARIOS.cases.length);
  for (const c of H.DRY_RUN_SCENARIOS.cases) {
    const s = r.artifact.samples.find((x) => x.caseId === c.id);
    assert.equal(s.status, c.expectDryRun.status, c.id);
    assert.equal(s.modelCalls, c.expectDryRun.modelCalls, c.id);
    assert.equal(s.calls.length, s.modelCalls, c.id);
    assert.deepEqual(s.proposals.map((p) => p.class), c.expectDryRun.classes, c.id);
    assert.deepEqual(s.integrity, [], c.id);
    if (c.expectDryRun.appendTargetWritten) assert.equal(s.written[0].version, 2);
  }
  const classes = new Set([].concat(...r.artifact.samples.map((s) => s.proposals.map((p) => p.class))));
  for (const k of ['MALFORMED_PROPOSAL', 'PRE_VERIFICATION_REJECTED', 'VERIFIER_FAILED', 'VERIFICATION_MALFORMED', 'VERIFIER_VETO', 'AUTHORIZED_WRITTEN']) assert.ok(classes.has(k), k);
  // artifact integrity: the manifest hash matches the written file
  const m = JSON.parse(fs.readFileSync(r.manifestFile, 'utf8'));
  assert.equal(m.sha256, H.sha256(fs.readFileSync(r.file, 'utf8')));
  assert.equal(r.artifact.schema, 'e02d-calibration-artifact/3');
  // v1.2 §31.4 — complete stage profiles, per-call structural/refusal evidence and stageFailure
  assert.deepEqual(r.artifact.profiles, { generator: CC.DEFAULT_GENERATOR_PROFILE, verifier: CC.DEFAULT_VERIFIER_PROFILE });
  assert.deepEqual(r.artifact.samples.find((x) => x.caseId === 'dr-verifier-failure').stageFailure, { stage: 'VERIFIER', reason: 'TRANSPORT_FAILED' });
  r.artifact.samples.forEach((s) => {
    assert.ok(s.stageFailure === null || CC.STAGE_FAILURE_REASONS.indexOf(s.stageFailure.reason) !== -1, s.caseId);
    s.calls.forEach((c) => {
      assert.deepEqual(c.profile, c.stage === 'GENERATOR' ? CC.DEFAULT_GENERATOR_PROFILE : CC.DEFAULT_VERIFIER_PROFILE);
      if (c.transport !== 'OK') { assert.equal(c.structure, null, s.caseId); return; } // a failed transport returns no response
      assert.ok(c.structure && typeof c.structure.status === 'string', s.caseId);
      assert.equal(c.refusal.refused, false);
      if (c.structure.status === 'OK') assert.equal(typeof c.answerTextChars, 'number');
    });
  });
  // accounting by stage, all synthetic
  const a = r.artifact.accounting;
  assert.equal(a.stages.GENERATOR.calls, 9);
  assert.equal(a.stages.VERIFIER.calls, 6);
  assert.deepEqual(a.stages.GENERATOR.bySource, { SYNTHETIC: 9 });
  assert.equal(a.stages.GENERATOR.tokensEstimated, true);
  assert.equal(a.total.cost, null, 'no price table → no cost');
  assert.equal(a.modelCallsCheck, true);
  // review rows carry blank labels: tooling never labels
  assert.ok(r.artifact.reviewRows.length > 0);
  r.artifact.reviewRows.forEach((row) => Object.values(row.labels).forEach((v) => assert.equal(v, null)));
});

test('every corpus validates and dry-runs with zero network attempts', async () => {
  for (const [corpus, mode] of [['regression', 'end-to-end'], ['development', 'end-to-end'], ['probes', 'verifier-probes'], ['development', 'generator-only']]) {
    assert.deepEqual(H.validateCorpus(H.corpusFor(corpus)), [], corpus);
    const r = await dry({ corpus, mode, write: false });
    assert.equal(r.artifact.networkAttempts, 0, corpus);
    assert.ok(r.artifact.samples.every((s) => s.integrity.length === 0), corpus);
  }
  await assert.rejects(dry({ corpus: 'probes', mode: 'end-to-end', write: false }), (e) => e.code === 'MODE_CORPUS_MISMATCH');
  await assert.rejects(dry({ corpus: 'development', mode: 'nonsense', write: false }), (e) => e.code === 'UNKNOWN_MODE');
});

test('regression-16 is preserved verbatim (hash-pinned) with interpretation metadata', () => {
  const reg = H.corpusFor('regression');
  assert.equal(reg.cases.length, 16);
  assert.equal(H.sha256(H.canonicalJson(reg.cases)), reg.CASES_SHA256);
  assert.equal(reg.tuningAllowed, false);
  assert.deepEqual(Object.keys(reg.INTERPRETATION).sort(), reg.cases.map((c) => c.id).sort());
});

test('development corpus is multilingual and meaningful, not duplicated', () => {
  const dev = H.corpusFor('development');
  const langs = new Set(dev.cases.map((c) => c.lang));
  assert.deepEqual([...langs].sort(), ['ar', 'en', 'he']);
  const texts = dev.cases.map((c) => JSON.stringify(c.turns || []) + JSON.stringify(c.days || []));
  assert.equal(new Set(texts).size, texts.length, 'no duplicated case content');
  for (const g of ['CAL-D1', 'CAL-D2', 'CAL-D3', 'CAL-D4', 'CAL-D5', 'CAL-D6', 'CAL-D7']) assert.ok(dev.cases.some((c) => c.gate.indexOf(g) !== -1), g);
});

test('every verifier probe reaches the Verifier; scoring by predetermined truth covers all five dimensions', async () => {
  const probes = H.corpusFor('probes');
  const dims = new Set([].concat(...probes.cases.map((c) => Object.keys(c.truth))));
  assert.deepEqual([...dims].sort(), ['direction', 'restatement', 'safety', 'temporal', 'unsupported']);
  for (const d of dims) for (const t of ['PASS', 'VETO']) assert.ok(probes.cases.some((c) => c.truth[d] === t), d + ' ' + t);
  // SPEC §32 R-19 (P1–P5): the formerly borderline probes are VETO; unclear faithfulness fails closed
  const relabelled = { 'vp-rs-borderline-ar': 'restatement', 'vp-us-borderline-he': 'unsupported', 'vp-sf-borderline-en': 'safety', 'vp-tm-borderline-ar': 'temporal', 'vp-dr-borderline-en': 'direction' };
  Object.entries(relabelled).forEach(([id, d]) => {
    const c = probes.cases.find((x) => x.id === id);
    assert.deepEqual(c.truth, { [d]: 'VETO' }, id);
    assert.equal(c.expectedVerdict, undefined, id);
  });
  // the expectedVerdict mechanism remains available, but only on a BORDERLINE dimension
  const bad = { id: 'x', kind: 'verifier-probes', cases: [Object.assign({}, probes.cases.find((x) => x.id === 'vp-us-borderline-he'), { expectedVerdict: { unsupported: 'UNCERTAIN' } })] };
  assert.ok(H.validateCorpus(bad).some((p) => /expectedVerdict only on BORDER/.test(p)));
  // an oracle Verifier (answers the truth) gives no false or missed vetoes
  const truth = await dry({ corpus: 'probes', mode: 'verifier-probes', dryRunVerifier: 'truth', write: false });
  truth.artifact.samples.forEach((s) => {
    assert.equal(s.probe.reachedVerifier, true, s.caseId);
    Object.values(s.probe.dimensions).forEach((o) => assert.ok(/^(CORRECT_PASS|CORRECT_VETO|BORDERLINE:UNCERTAIN)$/.test(o), s.caseId + ' ' + o));
  });
  const usbResult = truth.artifact.samples.find((s) => s.caseId === 'vp-us-borderline-he');
  assert.equal(usbResult.probe.dimensions.unsupported, 'CORRECT_VETO');
  assert.equal(usbResult.proposals[0].class, 'VERIFIER_VETO', 'a veto fails closed: no authorization');
  assert.equal(score(truth.artifact).gates['CAL-D8'].probesByDimension.unsupported.borderlineExpectedVerdict.numerator, 0);
  // an always-pass Verifier misses every VETO-truth dimension
  const pass = await dry({ corpus: 'probes', mode: 'verifier-probes', dryRunVerifier: 'pass', write: false });
  const sc = score(pass.artifact);
  Object.entries(sc.gates['CAL-D8'].probesByDimension).forEach(([d, m]) => {
    assert.equal(m.falseVeto.numerator, 0, d);
    assert.equal(m.missedVeto.numerator, m.missedVeto.denominator, d);
  });
});

test('generator-only mode is marked diagnostic and stubs only the Verifier', async () => {
  const r = await dry({ corpus: 'dry-run-scenarios', mode: 'generator-only', write: false });
  assert.equal(r.artifact.harness.diagnosticOnly, true);
  const veto = r.artifact.samples.find((s) => s.caseId === 'dr-verifier-veto');
  assert.deepEqual(veto.proposals.map((p) => p.class), ['AUTHORIZED_WRITTEN'], 'pass-through stub ignores the scripted veto');
  assert.equal(score(r.artifact).diagnosticOnly, true);
});

test('replay reproduces identically; a changed request is REPLAY_DIVERGED; v1.0 artifacts are refused', async () => {
  const rec = await dry({ corpus: 'dry-run-scenarios', runId: 'rec' });
  const rep = await H.runCalibration({ corpus: 'dry-run-scenarios', samples: 1, replayPath: rec.file, outDir: TMP, runId: 'rep' });
  assert.equal(rep.artifact.networkAttempts, 0);
  assert.deepEqual(rep.artifact.accounting.stages.GENERATOR.bySource, { REPLAY: 9 });
  rep.artifact.samples.forEach((s, i) => {
    const o = rec.artifact.samples[i];
    assert.equal(s.status, o.status);
    assert.deepEqual(s.proposals.map((p) => [p.class, p.code]), o.proposals.map((p) => [p.class, p.code]));
    assert.deepEqual(s.calls.map((c) => c.requestHash), o.calls.map((c) => c.requestHash));
  });
  // tamper one recorded request hash
  const art = JSON.parse(fs.readFileSync(rec.file, 'utf8'));
  art.samples.find((s) => s.caseId === 'dr-authorized-create').calls[0].requestHash = '0'.repeat(64);
  const tampered = path.join(TMP, 'tampered.json');
  fs.writeFileSync(tampered, JSON.stringify(art));
  const div = await H.runCalibration({ corpus: 'dry-run-scenarios', samples: 1, replayPath: tampered, write: false });
  const s = div.artifact.samples.find((x) => x.caseId === 'dr-authorized-create');
  assert.equal(s.status, 'REPLAY_DIVERGED');
  assert.equal(s.replayDiverged.reason, 'REQUEST_HASH_MISMATCH');
  assert.ok(score(div.artifact).samples.excluded.some((x) => x.caseId === 'dr-authorized-create'));
  // a v1.0-shaped or v1.1 (schema 2) artifact is not v1.2 evidence (§31.4)
  const v10 = path.join(TMP, 'v10.json');
  fs.writeFileSync(v10, JSON.stringify({ harness: { version: '1.0.0' }, samples: [] }));
  await assert.rejects(H.runCalibration({ corpus: 'dry-run-scenarios', samples: 1, replayPath: v10, write: false }), (e) => e.code === 'REPLAY_NOT_V12_EVIDENCE');
  const v11 = path.join(TMP, 'v11.json');
  fs.writeFileSync(v11, JSON.stringify({ schema: 'e02d-calibration-artifact/2', harness: { version: '2.0.0' }, samples: [] }));
  await assert.rejects(H.runCalibration({ corpus: 'dry-run-scenarios', samples: 1, replayPath: v11, write: false }), (e) => e.code === 'REPLAY_NOT_V12_EVIDENCE');
});

test('held-out runs are refused unless the corpus is sealed and the prompts are frozen', async () => {
  const shipped = JSON.parse(fs.readFileSync(path.join(__dirname, 'evals', 'e02d', 'heldout.manifest.json'), 'utf8'));
  assert.equal(shipped.corpusSha256, null, 'no fabricated hash');
  assert.equal(shipped.frozenPrompts.generatorInstructionSha256, null);
  const corpus = { id: 'heldout-fixture', cases: [{ id: 'h1', lang: 'en', gate: [], turns: [['t1', 'Synthetic.', 1]] }] };
  const corpusFile = path.join(TMP, 'heldout.json');
  fs.writeFileSync(corpusFile, JSON.stringify(corpus));
  const manifest = (m) => { const f = path.join(TMP, 'm' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(f, JSON.stringify(Object.assign({}, shipped, m))); return f; };
  const h = H.instructionHashes();
  const good = H.sha256(fs.readFileSync(corpusFile));
  const frozen = { generatorInstructionSha256: h.generator, verifierInstructionSha256: h.verifier };
  const refuse = (mp, hp, code) => assert.throws(() => H.loadHeldout(mp, hp), (e) => e.code === code, code);
  refuse(undefined, null, 'HELDOUT_NOT_SUPPLIED');
  refuse(undefined, corpusFile, 'HELDOUT_MANIFEST_UNSEALED');
  refuse(manifest({ corpusSha256: 'f'.repeat(64) }), corpusFile, 'HELDOUT_HASH_MISMATCH');
  refuse(manifest({ corpusSha256: good }), corpusFile, 'PROMPTS_NOT_FROZEN');
  refuse(manifest({ corpusSha256: good, frozenPrompts: { generatorInstructionSha256: h.generator, verifierInstructionSha256: 'a'.repeat(64) } }), corpusFile, 'PROMPT_HASH_MISMATCH');
  const badFile = path.join(TMP, 'bad.json');
  fs.writeFileSync(badFile, JSON.stringify({ id: 'x', cases: [{ id: 'h1', lang: 'xx', turns: [] }] }));
  refuse(manifest({ corpusSha256: H.sha256(fs.readFileSync(badFile)), frozenPrompts: frozen }), badFile, 'CORPUS_INVALID');
  // sealed + frozen → accepted (dry-run only here)
  const ok = manifest({ corpusSha256: good, frozenPrompts: frozen });
  const r = await dry({ corpus: 'heldout', heldoutManifestPath: ok, heldoutPath: corpusFile, write: false });
  assert.equal(r.artifact.corpus.sha256, good);
});

test('the budget statement carries every required field and never assumes prices', async () => {
  const b = await H.budgetStatement({ corpus: 'development', samples: 3, prices: PRICES, paidApproval: { maxCostUsd: 5 } });
  for (const k of ['generatorModel', 'verifierModel', 'generatorProfile', 'verifierProfile', 'corpus', 'mode', 'samples', 'maxGeneratorCalls', 'maxVerifierCalls', 'maxTotalCalls', 'expectedCalls', 'tokens', 'estimatedCost', 'maxCost', 'maxApprovedCost', 'latency', 'prices', 'assumptions']) assert.ok(b[k] !== undefined, k);
  const n = H.corpusFor('development').cases.length * 3;
  assert.equal(b.maxGeneratorCalls, n);
  assert.equal(b.maxVerifierCalls, n);
  assert.equal(b.maxTotalCalls, 2 * n);
  assert.equal(b.prices.source, PRICES.source);
  assert.ok(b.maxCost.total >= b.estimatedCost.total);
  const noPrice = await H.budgetStatement({ corpus: 'probes', mode: 'verifier-probes', samples: 1 });
  assert.equal(noPrice.prices, 'PRICE_TABLE_REQUIRED');
  assert.equal(noPrice.maxCost, null);
  assert.equal(noPrice.maxGeneratorCalls, 0, 'probes script the Generator');
  // v1.2 §31.4 — overrides are complete profiles; ceilings and timeouts come from them; v1.1 overrides are refused
  const vp = Object.assign({}, CC.DEFAULT_VERIFIER_PROFILE, { model: 'x-model', maxOutputTokens: 400, timeoutMs: 5000 });
  const override = await H.budgetStatement({ corpus: 'probes', mode: 'verifier-probes', samples: 1, verifierProfile: vp });
  assert.equal(override.verifierModel, 'x-model');
  assert.deepEqual(override.verifierProfile, vp);
  assert.equal(override.tokens.verifier.outputMax, 400 * override.maxVerifierCalls);
  assert.equal(override.latency.verifierTimeoutMs, 5000);
  await assert.rejects(H.budgetStatement({ corpus: 'probes', mode: 'verifier-probes', samples: 1, generatorModelOverride: 'x-model' }), (e) => e.code === 'V11_OPTION_REMOVED');
  await assert.rejects(H.budgetStatement({ corpus: 'probes', mode: 'verifier-probes', samples: 1, verifierModel: 'x-model' }), (e) => e.code === 'V11_OPTION_REMOVED');
  await assert.rejects(H.budgetStatement({ corpus: 'probes', mode: 'verifier-probes', samples: 1, verifierProfile: { model: 'x-model' } }), (e) => e.code === 'PROFILE_INVALID');
});

test('a paid run is refused without approval, prices or within-budget approval; an approved run uses only the injected transport', async () => {
  await assert.rejects(H.runCalibration({ corpus: 'development', samples: 1, write: false }), (e) => e.code === 'PAID_RUN_NOT_APPROVED');
  await assert.rejects(H.runCalibration({ corpus: 'development', samples: 1, write: false, paidApproval: { maxCostUsd: 1 } }), (e) => e.code === 'PRICE_TABLE_REQUIRED');
  await assert.rejects(H.runCalibration({ corpus: 'development', samples: 1, write: false, paidApproval: { maxCostUsd: 1 }, prices: PRICES }), (e) => e.code === 'NO_REAL_TRANSPORT');
  const fake = async () => ({ content: [{ type: 'text', text: '{"proposals":[]}' }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } });
  await assert.rejects(H.runCalibration({ corpus: 'development', samples: 1, write: false, paidApproval: { maxCostUsd: 0.0001 }, prices: PRICES, realSend: fake }), (e) => e.code === 'BUDGET_EXCEEDS_APPROVAL');
  let sent = 0;
  const counting = async (b) => { sent++; return fake(b); };
  const r = await H.runCalibration({ corpus: 'development', only: ['dev-rs-verbatim-en'], samples: 1, write: false, paidApproval: { maxCostUsd: 100 }, prices: PRICES, realSend: counting });
  assert.equal(sent, r.artifact.samples.length);
  assert.deepEqual(r.artifact.accounting.stages.GENERATOR.bySource, { REAL: sent });
  assert.equal(r.artifact.accounting.stages.GENERATOR.costBasis, 'ACTUAL_USAGE');
});

test('score.js uses canonical thresholds, never labels, and never decides closure', async () => {
  const r = await dry({ corpus: 'dry-run-scenarios', write: false });
  const s = score(r.artifact);
  assert.equal(s.closureDecision, 'NOT_DETERMINED_BY_TOOLING');
  assert.match(s.evidenceSource, /not calibration evidence/);
  assert.equal(s.gates['CAL-D3'].grounded.status, 'AWAITING_HUMAN_LABELS');
  assert.equal(s.gates['CAL-D4'].safetyVetoPrecision.threshold, PRODUCT);
  assert.equal(s.gates['CAL-D8'].endToEndFalseVeto.threshold, PRODUCT);
  assert.equal(s.malformedProposalRate.status, PRODUCT);
  assert.equal(s.malformedProposalRate.numerator, 1);
  assert.ok(s.malformedProposalRate.rawCases[0].startsWith('dr-malformed-isolation'));
  assert.match(s.gates['CAL-D7'].verifierFailed.thresholdSource, /§31\.2/);
  // CAL-D7 v1.2: per stage, failures by reason, total-ceiling usage, refusals and answer size reported separately
  ['GENERATOR', 'VERIFIER'].forEach((st) => {
    const d7 = s.gates['CAL-D7'].byStage[st];
    ['stageFailuresByReason', 'maxTokensStops', 'maxOutputUsage', 'latencyP99', 'refusals', 'answerTextChars'].forEach((k) => assert.ok(d7[k] !== undefined, st + ' ' + k));
    assert.equal(d7.refusals.reportedSeparately, true);
    assert.equal(d7.answerTextChars.reportedSeparately, true);
  });
  // with labels supplied, a labelled gate resolves to MEETS/BELOW
  const rows = {};
  r.artifact.reviewRows.filter((x) => x.class === 'AUTHORIZED_WRITTEN').forEach((x) => { rows[x.rowId] = { grounded: true }; });
  assert.equal(score(r.artifact, { rows }).gates['CAL-D3'].grounded.status, 'MEETS');
  assert.throws(() => score({ schema: 'v1' }), /SCORE_REFUSED/);
  assert.throws(() => score({ schema: 'e02d-calibration-artifact/2' }), /SCORE_REFUSED/);
});

test('the budget statement is read-only with respect to Generator, Verifier and store runtime configuration', async () => {
  const Consolidation = require('../js/coachDecisionSystem/consolidation.js');
  const Store = require('../js/coachDecisionSystem/userKnowledgeStore.js');
  const { createInMemoryPort } = require('./fixtures/userKnowledgeInMemoryPort.js');
  const { createObservationPort, descriptors } = require('./fixtures/consolidationObservationPortTestDouble.js');
  const seen = [];
  const sentinel = async (body) => { seen.push(body.model); return { content: [{ type: 'text', text: 'sentinel' }], stop_reason: 'end_turn' }; };
  const D = descriptors();
  const uk = createInMemoryPort();
  Store.configure({ port: uk.port, now: () => 1, writerAuthority: 'SERVER', isLearningConsentGranted: () => true, userId: 'sentinel-user', producer: 'e02d.consolidation', producerVersion: '1.0.0' });
  const cfg = Consolidation.configure({ store: Store, port: createObservationPort().port, modelTransport: sentinel, now: () => 1, isLearningConsentGranted: () => true, getConsentState: () => ({}),
    userId: 'sentinel-user', observationSources: [D.conversation, D.dayLog], referenceSource: D.typedMemory,
    verifierProfile: Object.assign({}, CC.DEFAULT_VERIFIER_PROFILE, { model: 'sentinel-verifier-model' }) });
  assert.equal(cfg.status, 'CONFIGURED');
  const snapshot = () => ({ gen: Interpreter.isConfigured(), ver: Verifier.isConfigured(), verModel: Verifier._internal.buildRequestBody({}).model,
    genModel: Interpreter._internal.buildRequestBody({ observations: [], concepts: [], records: [], userStated: [] }).model, storeConcepts: uk.hooks.peek('sentinel-user').concepts.length });
  const before = snapshot();
  assert.equal(before.verModel, 'sentinel-verifier-model');
  // a different explicit profile, and the default path, both leave caller state untouched
  const b1 = await H.budgetStatement({ corpus: 'development', samples: 1, verifierProfile: Object.assign({}, CC.DEFAULT_VERIFIER_PROFILE, { model: 'explicit-model' }) });
  const b2 = await H.budgetStatement({ corpus: 'dry-run-scenarios', samples: 1 });
  assert.equal(b1.verifierModel, 'explicit-model');
  assert.equal(b2.verifierModel, 'claude-haiku-4-5-20251001', 'the default profile, not the caller sentinel');
  assert.deepEqual(snapshot(), before);
  // the caller's transports are still the ones in place
  await Verifier.verify({ observations: [], userStated: [], targets: [], items: [{ item: 'p1', operation: 'CREATE' }] });
  await Interpreter.interpret({ observations: [], concepts: [], records: [], userStated: [] });
  assert.deepEqual(seen, ['sentinel-verifier-model', CC.DEFAULT_GENERATOR_PROFILE.model]);
});
