// WP0 Phase E.0.2d — OPT-IN real-model calibration
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §31, CAL-D1 … CAL-D7; AC-D90).
//
// NOT part of the default regression run: not matched by `node --test tests/*.test.js`, never run
// in CI. PAID when run for real. Run deliberately, by an operator, only after explicit Product
// approval of the stated number of calls:
//
//   ANTHROPIC_API_KEY=<operator credential> node tests/evals/e02dConsolidationCalibration.eval.js
//
// Call budget: 1 preflight call (max_tokens 1) + CASES.length × SAMPLES consolidation passes, each
// making at most one model call (§27). With the defaults below: 1 + 16 × 3 = 49 calls.
// E02D_CALIBRATION_SAMPLES and E02D_CALIBRATION_ONLY=<comma-separated case ids> reduce the budget.
//
// Safeguards (OU-001 §20 / E.0.2b §29 / USI-001 §26 precedent):
//   1. Synthetic data only: every observation, Typed Memory record and User Knowledge record below
//      is authored for calibration; the User Knowledge store is the in-memory reference port and the
//      Observation Port is the test double — both discarded at exit. No user data is read.
//   2. The credential is read from ANTHROPIC_API_KEY only and never printed, logged or written.
//   3. Direct model API only — never the production proxy.
//   4. The UNMODIFIED production path runs (Consolidation.runPass with the real gate and the real
//      User Knowledge store); only the injected modelTransport is replaced, wrapped to record
//      latency, usage and stop_reason. No prompt, bound, constant or threshold is changed here.
//   5. Per-case `expect` annotations are reviewer notes used to REPORT quality; they never reach the
//      model and are not production rules. CAL-D1, CAL-D3 and CAL-D4 require HUMAN REVIEW of the
//      written review file; automated checks only flag candidates for that review.
//   6. Pre-flight credit/API check; any API failure mid-run aborts immediately (no partial gate).
//   7. Raw responses are written to the OS temp directory (never the repository) and can be replayed
//      at zero cost: E02D_CALIBRATION_REPLAY=<path of a previous review file>.
//
// E02D_CALIBRATION_DRY_RUN=1 exercises the plumbing with a local stub and NO model call; it produces
// no calibration evidence and must never be reported as such.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const req = (p) => require(path.join(ROOT, p));
const Store = req('js/coachDecisionSystem/userKnowledgeStore.js');
const Consolidation = req('js/coachDecisionSystem/consolidation.js');
const Interpreter = req('js/coachDecisionSystem/consolidationInterpreter.js');
const { createInMemoryPort } = req('tests/fixtures/userKnowledgeInMemoryPort.js');
const { createObservationPort, descriptors } = req('tests/fixtures/consolidationObservationPortTestDouble.js');

const API_URL = 'https://api.anthropic.com/v1/messages';
const DRY_RUN = process.env.E02D_CALIBRATION_DRY_RUN === '1';
const REPLAY = process.env.E02D_CALIBRATION_REPLAY || null;
const SAMPLES = Math.max(1, Number(process.env.E02D_CALIBRATION_SAMPLES || 3));
const ONLY = process.env.E02D_CALIBRATION_ONLY ? process.env.E02D_CALIBRATION_ONLY.split(',') : null;
const DAY = 86400000;
const WINDOW = { fromEpochMs: 0, toEpochMs: 14 * DAY };

// ── synthetic corpus. `gate` names the CAL gate(s) each case primarily informs. ──
const CASES = [
  { id: 'r1-single-turn-statement', gate: ['CAL-D1'], turns: [['t1', 'I always feel drained the day after a late dinner.', 1]], expect: 'no proposal, or rejected as restatement' },
  { id: 'r2-multi-turn-restatement', gate: ['CAL-D1'], turns: [['t1', 'Late dinners wreck my next morning.', 1], ['t2', 'Like I said, eating late ruins the next day for me.', 3]], expect: 'no restatement admitted' },
  { id: 'r3-five-hours-alone', gate: ['CAL-D1', 'CAL-D3'], turns: [['t1', 'I usually sleep around five hours.', 1]], stated: [{ labels: ['nightly rest'], rel: 'I usually sleep around five hours', turn: 't1' }], expect: 'nothing admitted' },
  { id: 'r4-five-hours-with-observations', gate: ['CAL-D1', 'CAL-D3'], turns: [['t1', 'I usually sleep around five hours.', 1], ['t2', 'Rough night and the lifts felt heavy.', 3], ['t3', 'Woke at 4 again, sluggish all session.', 5]], stated: [{ labels: ['nightly rest'], rel: 'I usually sleep around five hours', turn: 't1' }], expect: 'a by-reference higher-order candidate adding new meaning' },
  { id: 'r5-typed-memory-preference', gate: ['CAL-D1', 'CAL-D3'], turns: [['t1', 'Skipped breakfast and felt shaky by noon.', 2], ['t2', 'No breakfast again, shaky before lunch.', 4]], typed: [{ id: 'm1', type: 'preference', payload: { key: 'MEAL_TIMING:breakfast', value: 'avoid', sourceTurnId: 't0' } }], expect: 'association grounded in t1/t2; the preference only by reference if at all' },
  { id: 'g1-cross-source-grounded', gate: ['CAL-D3', 'CAL-D5'], turns: [['t1', 'Energy crashed mid-afternoon.', 1], ['t2', 'Another afternoon slump today.', 2]], days: [['2026-01-01', 1, [{ name: 'pastry', kcal: 450, time: '7:05' }]], ['2026-01-02', 2, [{ name: 'pastry', kcal: 430, time: '7:10' }]]], expect: 'grounded association citing turns and day logs' },
  { id: 'g2-nothing-to-learn', gate: ['CAL-D3'], turns: [['t1', 'What is a good stretch for the hips?', 1]], expect: 'no proposal' },
  { id: 'i1-append-same-meaning', gate: ['CAL-D2'], turns: [['t1', 'Another short night, workout felt flat.', 4]], candidate: { labels: [['short rest'], ['workout feel']], rel: 'Flatter workouts have followed short nights.', turn: 't0' }, expect: 'APPEND_EVIDENCE supporting' },
  { id: 'i2-opposite-meaning-same-structure', gate: ['CAL-D2'], turns: [['t1', 'Barely slept yet had my best workout in weeks.', 4]], candidate: { labels: [['short rest'], ['workout feel']], rel: 'Flatter workouts have followed short nights.', turn: 't0' }, expect: 'APPEND_EVIDENCE contradicting or CREATE — never supporting' },
  { id: 'i3-meaning-changed', gate: ['CAL-D2'], turns: [['t1', 'It was the big late meal, not the short night, that made the workout flat.', 4], ['t2', 'Normal night, huge late meal, flat workout again.', 6]], candidate: { labels: [['short rest'], ['workout feel']], rel: 'Flatter workouts have followed short nights.', turn: 't0' }, expect: 'SUPERSEDE or CREATE' },
  { id: 's1-safety-adjacent-turn', gate: ['CAL-D4'], turns: [['t1', 'My chest hurts when I push hard on the bike.', 1], ['t2', 'Same chest tightness during intervals today.', 2]], expect: 'every proposal safetyAdjacent true (rejected)' },
  { id: 's2-medication-turn', gate: ['CAL-D4'], turns: [['t1', 'Started a new medication and I get dizzy at the gym.', 1], ['t2', 'Dizzy again during squats since the new pills.', 3]], expect: 'every proposal safetyAdjacent true (rejected)' },
  { id: 'w1-recurring-window-local-time', gate: ['CAL-D5'], days: [['2026-01-01', 1, [{ name: 'noodles', kcal: 700, time: '22:40' }]], ['2026-01-02', 2, [{ name: 'noodles', kcal: 680, time: '22:55' }]], ['2026-01-05', 5, [{ name: 'salad', kcal: 300, time: '19:00' }]]], turns: [['t1', 'Woke up groggy.', 2], ['t2', 'Groggy morning again.', 3]], expect: 'RECURRING_WINDOW only from local meal times; no invented times' },
  { id: 'w2-no-local-time', gate: ['CAL-D5'], turns: [['t1', 'Felt great after training.', 1], ['t2', 'Felt great after training again.', 3]], expect: 'no invented time of day' },
  { id: 'c1-concept-reuse', gate: ['CAL-D6'], turns: [['t1', 'Long commute and no energy to cook.', 1], ['t2', 'Commute dragged on; ordered takeaway again.', 3]], concepts: [['commute'], ['takeaway']], expect: 'reuse presented concepts' },
  { id: 'f1-volume', gate: ['CAL-D7'], turns: Array.from({ length: 30 }, (_, i) => ['t' + i, 'Day ' + i + ' note: steps, mood and meals logged as usual.', 1 + (i % 13)]), expect: 'valid output within budget' }
];

// ── transport ──
const calls = [];
let fetchImpl = typeof fetch === 'function' ? fetch : null;
let aborted = null;
function makeTransport(replayed) {
  return async (body) => {
    if (aborted) throw new Error('aborted');
    const started = process.hrtime.bigint();
    let raw;
    if (replayed) raw = replayed.shift();
    else if (DRY_RUN) raw = { content: [{ text: '{"proposals":[]}' }], usage: { output_tokens: 5 }, stop_reason: 'end_turn' };
    else {
      const res = await fetchImpl(API_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
      raw = await res.json();
      if (!res.ok) { aborted = { status: res.status, type: raw && raw.error && raw.error.type }; throw new Error('API failure'); }
    }
    calls.push({ ms: Number(process.hrtime.bigint() - started) / 1e6, outputTokens: raw && raw.usage ? raw.usage.output_tokens : null, stopReason: raw ? raw.stop_reason : null, raw });
    return raw;
  };
}
async function preflight() {
  if (DRY_RUN || REPLAY) return { ok: true };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: 'ANTHROPIC_API_KEY is not set (operator credential required).' };
  const res = await fetchImpl(API_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: Interpreter.MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }) });
  return res.ok ? { ok: true } : { ok: false, reason: 'preflight failed with HTTP ' + res.status };
}

// ── one case, one sample: the unmodified production pass over synthetic data ──
async function runCase(c, transport) {
  const uk = createInMemoryPort();
  const obs = createObservationPort();
  const D = descriptors();
  let clock = 9000000;
  const cfgStore = (writer, producer) => Store.configure({ port: uk.port, now: () => ++clock, writerAuthority: writer, isLearningConsentGranted: () => true, userId: 'cal', producer, producerVersion: '1.0.0' });
  (c.turns || []).forEach(([id, text, d]) => obs.seed.turn(id, text, d * DAY));
  (c.days || []).forEach(([key, d, meals]) => obs.seed.day(key, d * DAY, meals));
  (c.typed || []).forEach((t) => obs.seed.typedMemory(t.id, { type: t.type, source: 'user_stated', status: 'active', payload: t.payload }));
  cfgStore('CLIENT', 'calibration.seed');
  for (const labels of c.concepts || []) await Store.createConcept({ labels });
  for (const s of c.stated || []) {
    const cr = await Store.createConcept({ labels: s.labels });
    await Store.createRecord({ draft: { factors: [{ conceptId: cr.ids.conceptIds[0], role: 'subject', valueDescription: null }], relationDescription: s.rel, evidenceClass: 'EXPLICIT_STATEMENT',
      temporality: 'DURABLE', confidence: 1, source: 'user_stated', safetyFlag: 'STANDARD', evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: s.turn }] } } });
  }
  if (c.candidate) {
    const ids = [];
    for (const labels of c.candidate.labels) ids.push((await Store.createConcept({ labels })).ids.conceptIds[0]);
    cfgStore('SERVER', 'calibration.seed');
    await Store.createRecord({ draft: { factors: [{ conceptId: ids[0], role: 'condition', valueDescription: null }, { conceptId: ids[1], role: 'outcome', valueDescription: null }],
      relationDescription: c.candidate.rel, evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', confidence: 0, source: 'inferred_event', safetyFlag: 'STANDARD',
      evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: c.candidate.turn }] } } });
  }
  cfgStore('SERVER', 'e02d.consolidation');
  Consolidation.configure({ store: Store, port: obs.port, modelTransport: transport, now: () => clock, isLearningConsentGranted: () => true, getConsentState: () => ({}),
    userId: 'cal', observationSources: [D.conversation, D.dayLog], referenceSource: D.typedMemory });
  const before = calls.length;
  const result = await Consolidation.runPass({ passId: 'cal-' + c.id, window: WINDOW });
  const call = calls[before] || null;
  const parsed = call ? Interpreter._internal.parseResponse(call.raw) : null;
  const created = uk.hooks.peek('cal').records.filter((r) => r.provenance.producer === 'e02d.consolidation')
    .map((r) => ({ recordId: r.recordId, relationDescription: r.relationDescription, values: r.factors.map((f) => f.valueDescription), evidenceClass: r.evidenceClass, temporality: r.temporality, supporting: r.supportingRefIds }));
  return { result, proposals: parsed ? parsed.proposals : null, created };
}

function p99(xs) { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(0.99 * s.length) - 1)]; }

async function main() {
  if (!DRY_RUN && !REPLAY && !process.env.ANTHROPIC_API_KEY) {
    console.error('Refusing to run: ANTHROPIC_API_KEY is not set (operator credential required).');
    process.exitCode = 1;
    return;
  }
  const pre = await preflight();
  if (!pre.ok) { console.error('Preflight failed: ' + pre.reason); process.exitCode = 1; return; }
  const replayed = REPLAY ? JSON.parse(fs.readFileSync(REPLAY, 'utf8')).rawCalls.map((c) => c.raw) : null;
  const transport = makeTransport(replayed);
  const cases = CASES.filter((c) => !ONLY || ONLY.indexOf(c.id) !== -1);
  const results = [];
  for (const c of cases) {
    for (let s = 0; s < SAMPLES; s++) {
      if (aborted) break;
      results.push(Object.assign({ id: c.id, gate: c.gate, expect: c.expect, sample: s }, await runCase(c, transport)));
    }
  }
  const tag = DRY_RUN ? 'dryrun' : (REPLAY ? 'replay' : 'real');
  const reviewPath = path.join(os.tmpdir(), 'e02d-calibration-review-' + tag + '.json');
  const rawCalls = calls.map((c) => ({ ms: c.ms, outputTokens: c.outputTokens, stopReason: c.stopReason, raw: c.raw }));
  if (aborted) {
    fs.writeFileSync(reviewPath, JSON.stringify({ aborted, completedCases: results.map((r) => r.id), note: 'ABORTED — no calibration gate is computed from an aborted run', rawCalls }, null, 2));
    console.error('Aborted on API failure; nothing is reported as calibration evidence. Review file: ' + reviewPath);
    process.exitCode = 1;
    return;
  }
  const latencies = calls.map((c) => c.ms);
  const summary = {
    mode: tag, samples: SAMPLES, cases: cases.length, modelCalls: calls.length,
    'CAL-D7': {
      interpreterFailedRate: results.filter((r) => r.result.status === 'INTERPRETER_FAILED').length / Math.max(1, results.length),
      p99LatencyMs: p99(latencies), timeoutMs: Interpreter.TIMEOUT_MS,
      maxOutputTokens: Math.max(0, ...calls.map((c) => c.outputTokens || 0)), maxTokensLimit: Interpreter.MAX_TOKENS,
      maxTokensStops: calls.filter((c) => c.stopReason === 'max_tokens').length
    },
    'CAL-D6': { shadowingRejections: results.reduce((n, r) => n + r.result.proposals.filter((p) => p.code === 'NEW_CONCEPT_SHADOWS_PRESENTED').length, 0) },
    humanReview: 'CAL-D1, CAL-D3, CAL-D4 and the CAL-D2/CAL-D5 judgments require human review of `cases` below against each case `expect` note.'
  };
  fs.writeFileSync(reviewPath, JSON.stringify({ summary, cases: results, rawCalls }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log('Review file: ' + reviewPath);
}

if (require.main === module) {
  main().catch((e) => { console.error('Calibration harness error: ' + (e && e.message)); process.exitCode = 1; });
}

module.exports = { CASES, runCase, makeTransport, preflight, calls, setFetchImpl(f) { fetchImpl = f; } };
