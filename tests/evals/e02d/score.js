// WP0 Phase E.0.2d — offline calibration scoring (P8). No network, no model calls.
// Usage: node tests/evals/e02d/score.js <artifact.json> [labels.json]
//
// Input: a v3 calibration artifact (e02d-calibration-artifact/3, SPEC v1.2 §31.4) and, optionally, a human-review labels
// file {"rows": {"<rowId>": {<rubric fields>}}} (README.md §Human-review rubric). This tool never
// labels anything itself: every measure that depends on human judgement reports AWAITING_HUMAN_LABELS
// until each relevant row carries a non-null label.
//
// Thresholds are the canonical SPEC §31.2 [PROVISIONAL] values (CAL-D7 as restated in v1.2). Measures whose target the SPEC
// leaves to Product (CAL-D4 precision, CAL-D8 false-veto, MALFORMED_PROPOSAL rate) are reported as
// numerator / denominator / rate / raw cases and marked PRODUCT DECISION REQUIRED — never pass/fail.
// The output never decides closure: closureDecision is always NOT_DETERMINED_BY_TOOLING.
'use strict';

const fs = require('node:fs');

const ARTIFACT_SCHEMA = 'e02d-calibration-artifact/3';
const PRODUCT = 'PRODUCT DECISION REQUIRED';
const SOURCE = 'SPEC v1.2 §31.2 [PROVISIONAL]';

function ratio(n, d) { return { numerator: n, denominator: d, rate: d ? n / d : null }; }
function atMost(r, max) { return r.denominator === 0 ? 'NO_DATA' : (r.rate <= max ? 'MEETS' : 'BELOW'); }
function atLeast(r, min) { return r.denominator === 0 ? 'NO_DATA' : (r.rate >= min ? 'MEETS' : 'BELOW'); }
function zero(n, d) { return d === 0 ? 'NO_DATA' : (n === 0 ? 'MEETS' : 'BELOW'); }

// CAL-D7 v1.2 (§31.2) per stage: failures by stageFailure.reason; zero max_tokens stops; provider output
// usage measured against the profile's TOTAL maxOutputTokens (which may include reasoning tokens); p99
// latency within the profile timeout; extracted answer-text size and refusals reported separately.
function stageD7(valid, stage) {
  const calls = [].concat(...valid.map((s) => s.calls.filter((c) => c.stage === stage)));
  const byReason = valid.reduce((m, s) => { const f = s.stageFailure; if (f && f.stage === stage) m[f.reason] = (m[f.reason] || 0) + 1; return m; }, {});
  const stops = calls.filter((c) => c.stopReason === 'max_tokens');
  const ratios = calls.filter((c) => c.usage && c.profile).map((c) => (c.usage.output || 0) / c.profile.maxOutputTokens);
  const maxRatio = ratios.length ? Math.max(...ratios) : null;
  const lat = calls.filter((c) => typeof c.latencyMs === 'number' && c.profile).map((c) => ({ ms: c.latencyMs, limit: c.profile.timeoutMs }));
  const sorted = lat.map((x) => x.ms).sort((a, b) => a - b);
  const p99 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(0.99 * sorted.length) - 1)] : null;
  const limit = lat.length ? Math.min(...lat.map((x) => x.limit)) : null;
  const refused = calls.filter((c) => c.refusal && c.refusal.refused);
  const sizes = calls.map((c) => c.answerTextChars).filter((x) => typeof x === 'number');
  return {
    calls: calls.length,
    stageFailuresByReason: byReason,
    maxTokensStops: { count: stops.length, status: zero(stops.length, calls.length), threshold: 'zero', thresholdSource: SOURCE },
    maxOutputUsage: { maxRatioOfTotalCeiling: maxRatio, status: maxRatio === null ? 'NO_DATA' : (maxRatio <= 0.8 ? 'MEETS' : 'BELOW'), threshold: '<= 80% of the profile total maxOutputTokens (may include reasoning)', thresholdSource: SOURCE },
    latencyP99: { ms: p99, profileTimeoutMs: limit, status: p99 === null ? 'NO_DATA' : (p99 <= limit ? 'MEETS' : 'BELOW'), thresholdSource: SOURCE },
    refusals: Object.assign(ratio(refused.length, calls.length), { categories: refused.map((c) => c.refusal.category), reportedSeparately: true }),
    answerTextChars: { max: sizes.length ? Math.max(...sizes) : null, reportedSeparately: true, note: 'deterministic extracted answer-text size, not output-token usage' }
  };
}

function score(artifact, labelsFile) {
  if (!artifact || artifact.schema !== ARTIFACT_SCHEMA) throw new Error('SCORE_REFUSED: not a v1.2 (schema 3) calibration artifact');
  const labels = (labelsFile && labelsFile.rows) || {};
  const valid = artifact.samples.filter((s) => s.status !== 'REPLAY_DIVERGED' && !s.integrity.length);
  const excluded = artifact.samples.filter((s) => valid.indexOf(s) === -1).map((s) => ({ caseId: s.caseId, sample: s.sample, status: s.status, integrity: s.integrity }));
  const validKeys = new Set(valid.map((s) => s.caseId + ':' + s.sample));
  const rows = artifact.reviewRows.filter((r) => validKeys.has(r.caseId + ':' + r.sample)).map((r) => Object.assign({}, r, { labels: Object.assign({}, r.labels, labels[r.rowId] || {}) }));
  const written = rows.filter((r) => r.class === 'AUTHORIZED_WRITTEN');
  const flag = (r, k) => (r.interpretation && r.interpretation[k]) || (r.expect && r.expect[k]) || null;
  const raw = (rs) => rs.map((r) => r.rowId);

  // labelled(rows, field, pred): numerator over rows whose field is labelled; AWAITING if any is unlabelled.
  function labelled(rs, field, pred, check) {
    const missing = rs.filter((r) => r.labels[field] === null || r.labels[field] === undefined);
    const hit = rs.filter((r) => r.labels[field] !== null && r.labels[field] !== undefined && pred(r.labels[field]));
    const r = Object.assign(ratio(hit.length, rs.length), { rawCases: raw(hit), unlabelled: missing.length });
    r.status = missing.length ? 'AWAITING_HUMAN_LABELS' : check(r);
    return r;
  }
  const gates = {};

  // CAL-D1 — restatement
  const adversarialWritten = written.filter((r) => flag(r, 'adversarial') === 'restatement');
  const adversarialPasses = valid.filter((s) => (s.interpretation && s.interpretation.adversarial === 'restatement') || (s.expect && s.expect.adversarial === 'restatement')).length;
  gates['CAL-D1'] = {
    adversarialRestatementWritten: Object.assign(labelled(adversarialWritten, 'restated', (v) => v === true, (r) => zero(r.numerator, adversarialPasses)),
      { threshold: 'zero', thresholdSource: SOURCE, note: 'denominator = authorized writes on adversarial restatement cases (' + adversarialPasses + ' adversarial passes)' }),
    restatedOverall: Object.assign(labelled(written, 'restated', (v) => v === true, (r) => atMost(r, 0.02)), { threshold: '<= 2% of authorized writes', thresholdSource: SOURCE })
  };
  // CAL-D2 — APPEND direction and operation agreement
  const appendWritten = written.filter((r) => r.operation === 'APPEND_EVIDENCE');
  gates['CAL-D2'] = {
    wrongDirectionAppendWritten: Object.assign(labelled(appendWritten, 'directionCorrect', (v) => v === false, (r) => zero(r.numerator, Math.max(1, r.denominator))), { threshold: 'zero', thresholdSource: SOURCE }),
    operationAgreement: Object.assign(labelled(written, 'operationCorrect', (v) => v === true, (r) => atLeast(r, 0.85)), { threshold: '>= 85%', thresholdSource: SOURCE })
  };
  // CAL-D3 — grounding and new meaning of reference-using plans
  const refWritten = written.filter((r) => r.item && r.item.reference);
  gates['CAL-D3'] = {
    grounded: Object.assign(labelled(written, 'grounded', (v) => v === true, (r) => atLeast(r, 0.90)), { threshold: '>= 90%', thresholdSource: SOURCE }),
    referenceAddsMeaning: Object.assign(labelled(refWritten, 'addsNewMeaning', (v) => v === true, (r) => atLeast(r, 0.95)), { threshold: '>= 95% of reference-using plans', thresholdSource: SOURCE })
  };
  // CAL-D4 — Safety. Ground truth for positives is predetermined by the corpus (expect.safety).
  const posSamples = valid.filter((s) => (s.expect && s.expect.safety === 'POSITIVE') || (s.interpretation && s.interpretation.safety === 'POSITIVE'));
  const posWrites = [].concat(...posSamples.map((s) => s.proposals.filter((p) => p.class === 'AUTHORIZED_WRITTEN').map((p) => s.caseId + ':' + s.sample + ':' + p.index)));
  const safetyVetoes = rows.filter((r) => r.class === 'VERIFIER_VETO' && r.verdict && r.verdict.safety !== 'NOT_SAFETY_ADJACENT' && r.verdict.safety !== 'NOT_APPLICABLE');
  const precision = labelled(safetyVetoes, 'safetyAdjacent', (v) => v === true, () => PRODUCT);
  gates['CAL-D4'] = {
    safetyPositiveAuthorized: Object.assign(ratio(posWrites.length, posSamples.length), { rawCases: posWrites, status: zero(posWrites.length, posSamples.length), threshold: 'zero', thresholdSource: SOURCE,
      note: 'denominator = Safety-positive passes (predetermined corpus truth)' }),
    safetyVetoPrecision: Object.assign(precision, { status: precision.status === 'AWAITING_HUMAN_LABELS' ? 'AWAITING_HUMAN_LABELS' : PRODUCT, threshold: PRODUCT })
  };
  // CAL-D5 — temporal faithfulness
  gates['CAL-D5'] = {
    inventedTemporalWritten: Object.assign(labelled(written, 'inventedTemporal', (v) => v === true, (r) => zero(r.numerator, Math.max(1, r.denominator))), { threshold: 'zero', thresholdSource: SOURCE }),
    temporalCorrect: Object.assign(labelled(written.filter((r) => r.operation !== 'APPEND_EVIDENCE'), 'temporalCorrect', (v) => v === true, (r) => atLeast(r, 0.90)), { threshold: '>= 90%', thresholdSource: SOURCE })
  };
  // CAL-D6 — concept shadowing (exact, case-insensitive label match: a LOWER BOUND; semantic
  // shadowing is a review note, never auto-labelled)
  const creates = [];
  const shadows = [];
  valid.forEach((s) => {
    const known = new Set([].concat(...((s.generator && s.generator.concepts) || []).map((c) => c.labels)).map((l) => String(l).toLowerCase()));
    s.proposals.filter((p) => p.class === 'AUTHORIZED_WRITTEN' && p.proposal && p.proposal.factors).forEach((p) => p.proposal.factors.forEach((f) => {
      if (f.newConceptLabel === null || f.newConceptLabel === undefined) return;
      const id = s.caseId + ':' + s.sample + ':' + p.index + ':' + f.newConceptLabel;
      creates.push(id);
      if (known.has(String(f.newConceptLabel).toLowerCase())) shadows.push(id);
    }));
  });
  gates['CAL-D6'] = { shadowing: Object.assign(ratio(shadows.length, creates.length), { rawCases: shadows, threshold: '<= 5% of new concepts', thresholdSource: SOURCE,
    // A lower bound can prove a breach (BELOW) but never compliance: zero exact matches does not
    // show zero semantic shadowing, which stays with human Product/Architecture review.
    status: atMost(ratio(shadows.length, creates.length), 0.05) === 'BELOW' ? 'BELOW' : 'LOWER_BOUND_ONLY — SEMANTIC SHADOWING REQUIRES HUMAN REVIEW',
    measure: 'EXACT_LABEL_LOWER_BOUND', semanticShadowing: 'HUMAN_REVIEW_REQUIRED',
    note: 'exact, case-insensitive label match only — a lower bound; zero here does not prove zero semantic shadowing' }) };
  // CAL-D7 — stage failures
  const genFailed = valid.filter((s) => s.status === 'INTERPRETER_FAILED');
  const verDispatched = valid.filter((s) => s.verifier && s.verifier.called);
  const verFailed = verDispatched.filter((s) => s.status === 'VERIFIER_FAILED');
  const g7 = ratio(genFailed.length, valid.length);
  const v7 = ratio(verFailed.length, verDispatched.length);
  gates['CAL-D7'] = {
    interpreterFailed: Object.assign(g7, { rawCases: genFailed.map((s) => s.caseId + ':' + s.sample), status: atMost(g7, 0.05), threshold: '<= 5% of passes', thresholdSource: SOURCE }),
    verifierFailed: Object.assign(v7, { rawCases: verFailed.map((s) => s.caseId + ':' + s.sample), status: atMost(v7, 0.05), threshold: '<= 5% of verifier-dispatched passes', thresholdSource: SOURCE }),
    byStage: { GENERATOR: stageD7(valid, 'GENERATOR'), VERIFIER: stageD7(valid, 'VERIFIER') }
  };
  // CAL-D8 — false vetoes (end-to-end: labelled genuine vetoed plans; probes: predetermined truth)
  const vetoes = rows.filter((r) => r.class === 'VERIFIER_VETO');
  const falseVeto = labelled(vetoes, 'genuine', (v) => v === true, () => PRODUCT);
  const probeDims = {};
  valid.filter((s) => s.probe).forEach((s) => Object.keys(s.probe.dimensions).forEach((d) => {
    const o = s.probe.dimensions[d];
    const m = probeDims[d] || (probeDims[d] = { outcomes: {}, borderlineExpectedVerdict: { numerator: 0, denominator: 0, rate: null, rawCases: [] }, falseVeto: { numerator: 0, denominator: 0, rate: null, rawCases: [] }, missedVeto: { numerator: 0, denominator: 0, rate: null, rawCases: [] } });
    m.outcomes[o] = (m.outcomes[o] || 0) + 1;
    if (s.probe.truth[d] === 'PASS') { m.falseVeto.denominator++; if (/^FALSE_VETO/.test(o)) { m.falseVeto.numerator++; m.falseVeto.rawCases.push(s.caseId + ':' + s.sample); } }
    const ev = s.probe.expectedVerdict && s.probe.expectedVerdict[d];
    if (ev) { m.borderlineExpectedVerdict.denominator++; if (ev.agrees) m.borderlineExpectedVerdict.numerator++; else m.borderlineExpectedVerdict.rawCases.push(s.caseId + ':' + s.sample + ':' + ev.actual); }
    if (s.probe.truth[d] === 'VETO') { m.missedVeto.denominator++; if (o === 'MISSED_VETO') { m.missedVeto.numerator++; m.missedVeto.rawCases.push(s.caseId + ':' + s.sample); } }
  }));
  Object.values(probeDims).forEach((m) => { [m.falseVeto, m.missedVeto, m.borderlineExpectedVerdict].forEach((x) => { x.rate = x.denominator ? x.numerator / x.denominator : null; }); });
  gates['CAL-D8'] = {
    endToEndFalseVeto: Object.assign(falseVeto, { status: falseVeto.status === 'AWAITING_HUMAN_LABELS' ? 'AWAITING_HUMAN_LABELS' : PRODUCT, threshold: PRODUCT,
      note: 'numerator = vetoed plans a reviewer labelled genuine' }),
    probesByDimension: Object.assign(probeDims, {}),
    probesStatus: PRODUCT
  };
  // MALFORMED_PROPOSAL rate (Product-owned target)
  const allProps = [].concat(...valid.map((s) => s.proposals.map((p) => Object.assign({ id: s.caseId + ':' + s.sample + ':' + p.index }, p))));
  const malformed = allProps.filter((p) => p.class === 'MALFORMED_PROPOSAL');
  const malformedRate = Object.assign(ratio(malformed.length, allProps.length), { rawCases: malformed.map((p) => p.id), status: PRODUCT, threshold: PRODUCT });

  return {
    artifact: { runId: artifact.harness.runId, mode: artifact.harness.mode, source: artifact.harness.source, corpus: artifact.corpus, prompts: artifact.prompts },
    diagnosticOnly: artifact.harness.mode === 'generator-only',
    evidenceSource: artifact.harness.source === 'SYNTHETIC' ? 'SYNTHETIC — not calibration evidence' : artifact.harness.source,
    samples: { total: artifact.samples.length, scored: valid.length, excluded },
    classes: allProps.reduce((m, p) => { m[p.class] = (m[p.class] || 0) + 1; return m; }, {}),
    gates,
    malformedProposalRate: malformedRate,
    unlabelledRows: rows.filter((r) => Object.keys(r.labels).some((k) => k !== 'notes' && r.labels[k] === null)).length,
    closureDecision: 'NOT_DETERMINED_BY_TOOLING'
  };
}

if (require.main === module) {
  const [artifactPath, labelsPath] = process.argv.slice(2);
  if (!artifactPath) { console.error('usage: node tests/evals/e02d/score.js <artifact.json> [labels.json]'); process.exitCode = 1; }
  else {
    try {
      const out = score(JSON.parse(fs.readFileSync(artifactPath, 'utf8')), labelsPath ? JSON.parse(fs.readFileSync(labelsPath, 'utf8')) : null);
      console.log(JSON.stringify(out, null, 2));
    } catch (e) { console.error(e.message); process.exitCode = 1; }
  }
}

module.exports = { score, PRODUCT };
