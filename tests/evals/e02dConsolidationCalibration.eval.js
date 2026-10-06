// WP0 Phase E.0.2d — calibration harness for the v1.2 architecture (P8)
// docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md v1.2 §27, §27.1, §31, §31.4; MRS-001; tests/evals/e02d/README.md.
//
// NOT part of the default regression run (not matched by `node --test tests/*.test.js`), never run in
// CI. A REAL run is PAID and requires explicit Product approval of a budget statement first.
//
// What it measures: the architecture actually built — Generator → deterministic pre-verification gate
// → conditional, batched, reject-only Verifier → post-verification authorization → execution — by
// running the UNMODIFIED production pass (Consolidation.runPass) over synthetic corpora. Only the
// injected model transport is replaced by a recorder.
//
// Modes:
//   end-to-end      — Generator and Verifier as configured (real, replayed or scripted);
//   verifier-probes — hand-authored plans (scripted Generator) judged by the Verifier under test;
//   generator-only  — DIAGNOSTIC ONLY, not production behaviour: the Generator under test with a
//                     pass-through scripted Verifier, to measure what the Generator alone would write.
//
// Stage routing is exact: a request belongs to the Generator only if its content begins with the
// Generator instruction, to the Verifier only if it begins with the Verifier instruction; anything
// else fails closed (UNKNOWN_STAGE). Responses are never shifted between stages.
//
// Stage profiles (v1.2 §31.4): every run names the complete EXPLICIT-PROFILE request profile of each stage
// (model, reasoning, effort, total output ceiling, timeout, provider binding). Overrides are applied only
// through Consolidation.configure({generatorProfile, verifierProfile}); the harness never rewrites a body.
//
// Safeguards: synthetic corpora only; the credential is read from ANTHROPIC_API_KEY only and is never
// printed, logged or written; direct model API only; dry-run and replay run under a network trap that
// must record zero attempts; a paid run is refused without an approved budget and a price table; the
// held-out corpus is refused unless sealed and the prompts are frozen (§31.3).
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..', '..');
const req = (p) => require(path.join(ROOT, p));
// Stateless use only at module level (instruction text, constants, parsers, vocabularies). Everything
// that carries runtime configuration (store, coordinator, ports) is reached through a run's module set.
const Interpreter = req('js/coachDecisionSystem/consolidationInterpreter.js');
const Verifier = req('js/coachDecisionSystem/consolidationVerifier.js');
const CC = req('js/coachDecisionSystem/consolidationContract.js');
const MRS = req('js/coachDecisionSystem/modelResponseStructure.js'); // evidence only: the stages extract on their own

function loadModules() {
  return {
    Store: req('js/coachDecisionSystem/userKnowledgeStore.js'),
    Consolidation: req('js/coachDecisionSystem/consolidation.js'),
    Interpreter: req('js/coachDecisionSystem/consolidationInterpreter.js'),
    Verifier: req('js/coachDecisionSystem/consolidationVerifier.js'),
    createInMemoryPort: req('tests/fixtures/userKnowledgeInMemoryPort.js').createInMemoryPort,
    observationPort: req('tests/fixtures/consolidationObservationPortTestDouble.js')
  };
}
// Runs fn over FRESH instances of the production modules and fixtures (a separate require-cache
// generation), then restores the original cache. The caller's configured modules are never touched:
// this is how the budget statement stays observational (read-only) with respect to runtime state.
const ISOLATED_DIRS = [path.join(ROOT, 'js') + path.sep, path.join(ROOT, 'tests', 'fixtures') + path.sep];
async function withIsolatedModules(fn) {
  const inScope = (k) => ISOLATED_DIRS.some((d) => k.startsWith(d));
  const saved = {};
  Object.keys(require.cache).filter(inScope).forEach((k) => { saved[k] = require.cache[k]; delete require.cache[k]; });
  try {
    return await fn(loadModules());
  } finally {
    Object.keys(require.cache).filter(inScope).forEach((k) => { delete require.cache[k]; });
    Object.assign(require.cache, saved);
  }
}

const HARNESS_VERSION = '3.0.0';
const ARTIFACT_SCHEMA = 'e02d-calibration-artifact/3'; // v1.2: v1.1 (schema 2) recordings are not v1.2 evidence (§31.4)
const API_URL = 'https://api.anthropic.com/v1/messages';
const DAY = 86400000;
const WINDOW = { fromEpochMs: 0, toEpochMs: 14 * DAY };
const MODES = ['end-to-end', 'verifier-probes', 'generator-only'];
const LANGS = ['he', 'en', 'ar'];
const TRUTH_VALUES = ['PASS', 'VETO', 'BORDERLINE'];
// Token estimation (ESTIMATE, used only for budget statements and dry-run accounting): characters per
// token for the data part of a prompt by language; the English instruction part uses 4.
const CHARS_PER_TOKEN = { en: 4.0, he: 2.6, ar: 2.6 };

class HarnessRefusal extends Error {
  constructor(code, detail) { super(code + (detail ? ': ' + detail : '')); this.code = code; }
}

// ── hashing ──
function canonicalJson(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
function instructionHashes() {
  return { generator: sha256(Interpreter._internal.INSTRUCTION), verifier: sha256(Verifier._internal.INSTRUCTION) };
}

// ── exact stage routing ──
function stageOf(body) {
  const content = body && Array.isArray(body.messages) && body.messages[0] && body.messages[0].content;
  if (typeof content === 'string') {
    if (content.startsWith(Interpreter._internal.INSTRUCTION + '\n')) return 'GENERATOR';
    if (content.startsWith(Verifier._internal.INSTRUCTION + '\n')) return 'VERIFIER';
  }
  throw new HarnessRefusal('UNKNOWN_STAGE');
}

// ── network trap (dry-run, replay, fully scripted runs) ──
function installNetworkTrap() {
  let attempts = 0;
  const saved = [];
  const trap = () => { attempts++; throw new Error('NETWORK TRAP: no network access is allowed in this run'); };
  saved.push([globalThis, 'fetch', globalThis.fetch]);
  globalThis.fetch = trap;
  for (const name of ['http', 'https', 'net', 'tls']) {
    const mod = require('node:' + name);
    for (const fn of ['request', 'get', 'connect', 'createConnection']) {
      if (typeof mod[fn] === 'function') { saved.push([mod, fn, mod[fn]]); mod[fn] = trap; }
    }
  }
  return { attempts: () => attempts, restore() { saved.reverse().forEach(([o, k, v]) => { o[k] = v; }); } };
}

// ── corpora ──
const DRY_RUN_SCENARIOS = Object.freeze({
  id: 'dry-run-scenarios',
  kind: 'dry-run',
  tuningAllowed: false,
  cases: [
    { id: 'dr-no-proposals', lang: 'en', gate: [], turns: [['t1', 'Quiet day, nothing special.', 1]],
      script: { generator: [] }, expectDryRun: { status: 'COMPLETED', modelCalls: 1, classes: [] } },
    { id: 'dr-generator-failure', lang: 'en', gate: [], turns: [['t1', 'Quiet day.', 1]],
      script: { generator: { raw: 'not json' } }, expectDryRun: { status: 'INTERPRETER_FAILED', modelCalls: 1, classes: [] } },
    { id: 'dr-pre-rejected', lang: 'he', gate: [], turns: [['t1', 'הליכה בבוקר ומצב רוח טוב.', 1]],
      script: { generator: [{ operation: 'CREATE', factors: [{ newConceptLabel: 'walks', role: 'condition', valueText: null }, { newConceptLabel: 'mood', role: 'outcome', valueText: null }],
        relationText: 'Mood has followed walks.', evidenceClass: 'SINGLE_OBSERVATION', temporality: 'DURABLE', grounding: null, supporting: [{ key: 'o99' }], contradicting: [], reference: null }] },
      expectDryRun: { status: 'COMPLETED', modelCalls: 1, classes: ['PRE_VERIFICATION_REJECTED'] } },
    { id: 'dr-authorized-create', lang: 'ar', gate: [], turns: [['t1', 'مشيت بعد الغداء وتحسن مزاجي.', 1], ['t2', 'مشي آخر بعد الغداء ومزاج جيد.', 3]],
      script: { generator: [{ operation: 'CREATE', factors: [{ newConceptLabel: 'post-lunch walks', role: 'condition', valueText: null }, { newConceptLabel: 'afternoon mood', role: 'outcome', valueText: null }],
        relationText: 'A better afternoon mood has followed post-lunch walks.', evidenceClass: 'RECURRENCE', temporality: 'DURABLE', grounding: null, supporting: ['مشيت بعد', 'مشي آخر'], contradicting: [], reference: null }] },
      expectDryRun: { status: 'COMPLETED', modelCalls: 2, classes: ['AUTHORIZED_WRITTEN'] } },
    { id: 'dr-malformed-isolation', lang: 'en', gate: [], turns: [['t1', 'Walked at lunch, upbeat afternoon.', 1]],
      script: { generator: [{ literal: { operation: 'APPEND_EVIDENCE', targetRecordId: 'm_record_1', appendList: 'supporting', factors: null } },
        { operation: 'CREATE', factors: [{ newConceptLabel: 'lunch walks', role: 'condition', valueText: null }, { newConceptLabel: 'afternoon mood', role: 'outcome', valueText: null }],
          relationText: 'An upbeat afternoon has followed a lunchtime walk.', evidenceClass: 'SINGLE_OBSERVATION', temporality: 'DURABLE', grounding: null, supporting: ['Walked at lunch'], contradicting: [], reference: null }] },
      expectDryRun: { status: 'COMPLETED', modelCalls: 2, classes: ['MALFORMED_PROPOSAL', 'AUTHORIZED_WRITTEN'] } },
    { id: 'dr-verifier-veto', lang: 'en', gate: [], turns: [['t1', 'Late dinners wreck my next morning.', 1], ['t2', 'Ate late again and the morning was rough.', 2]],
      script: { generator: [{ operation: 'CREATE', factors: [{ newConceptLabel: 'late eating', role: 'condition', valueText: null }, { newConceptLabel: 'next morning', role: 'outcome', valueText: null }],
        relationText: 'Rougher mornings have followed late eating.', evidenceClass: 'RECURRENCE', temporality: 'DURABLE', grounding: null, supporting: ['Late dinners', 'Ate late'], contradicting: [], reference: null }],
      verifier: { veto: { restatement: 'RESTATED' } } },
      expectDryRun: { status: 'COMPLETED', modelCalls: 2, classes: ['VERIFIER_VETO'] } },
    { id: 'dr-verifier-failure', lang: 'he', gate: [], turns: [['t1', 'אימון ערב ונרדמתי מאוחר.', 1], ['t2', 'שוב אימון ערב, נרדמתי מאוחר.', 2]],
      script: { generator: [{ operation: 'CREATE', factors: [{ newConceptLabel: 'evening training', role: 'condition', valueText: null }, { newConceptLabel: 'falling asleep', role: 'outcome', valueText: 'later' }],
        relationText: 'Falling asleep later has followed evening training.', evidenceClass: 'RECURRENCE', temporality: 'DURABLE', grounding: null, supporting: ['אימון ערב ונרדמתי', 'שוב אימון'], contradicting: [], reference: null }],
      verifier: 'fail' },
      expectDryRun: { status: 'VERIFIER_FAILED', modelCalls: 2, classes: ['VERIFIER_FAILED'] } },
    { id: 'dr-verifier-malformed-item', lang: 'en', gate: [], turns: [['t1', 'Coffee at 5pm, awake until 1am.', 1], ['t2', 'Walked at lunch, good afternoon.', 2]],
      script: { generator: [
        { operation: 'CREATE', factors: [{ newConceptLabel: 'late coffee', role: 'condition', valueText: null }, { newConceptLabel: 'staying awake', role: 'outcome', valueText: null }],
          relationText: 'Staying awake has followed late coffee.', evidenceClass: 'SINGLE_OBSERVATION', temporality: 'DURABLE', grounding: null, supporting: ['Coffee at 5pm'], contradicting: [], reference: null },
        { operation: 'CREATE', factors: [{ newConceptLabel: 'lunch walks', role: 'condition', valueText: null }, { newConceptLabel: 'afternoon', role: 'outcome', valueText: null }],
          relationText: 'A good afternoon has followed a lunch walk.', evidenceClass: 'SINGLE_OBSERVATION', temporality: 'DURABLE', grounding: null, supporting: ['Walked at lunch'], contradicting: [], reference: null }],
      verifier: 'malformed-first' },
      expectDryRun: { status: 'COMPLETED', modelCalls: 2, classes: ['VERIFICATION_MALFORMED', 'AUTHORIZED_WRITTEN'] } },
    { id: 'dr-append', lang: 'en', gate: [], turns: [['t1', 'Another short night and the workout felt flat.', 4]],
      candidates: [{ labels: [['short rest'], ['workout feel']], rel: 'Flatter workouts have followed short nights.', turn: 't0' }],
      script: { generator: [{ operation: 'APPEND_EVIDENCE', target: { rel: 'Flatter workouts have followed short nights.' }, list: 'supporting', observations: ['short night'] }] },
      expectDryRun: { status: 'COMPLETED', modelCalls: 2, classes: ['AUTHORIZED_WRITTEN'], appendTargetWritten: true } }
  ]
});

function corpusFor(name) {
  if (name === 'regression') return req('tests/evals/e02d/corpus.regression.v1.js');
  if (name === 'development') return req('tests/evals/e02d/corpus.development.js');
  if (name === 'probes') return req('tests/evals/e02d/corpus.verifierProbes.js');
  if (name === 'dry-run-scenarios') return DRY_RUN_SCENARIOS;
  throw new HarnessRefusal('UNKNOWN_CORPUS', String(name));
}
function validateCorpus(corpus) {
  const problems = [];
  if (!corpus || typeof corpus.id !== 'string' || !Array.isArray(corpus.cases) || !corpus.cases.length) return ['corpus shape'];
  const ids = new Set();
  corpus.cases.forEach((c, i) => {
    const at = (c && c.id) || '#' + i;
    if (!c || typeof c.id !== 'string' || ids.has(c.id)) problems.push(at + ': id missing or duplicate');
    ids.add(c && c.id);
    const lang = (c && c.lang) || corpus.defaultLang;
    if (LANGS.indexOf(lang) === -1) problems.push(at + ': lang');
    if (c.turns !== undefined && !(Array.isArray(c.turns) && c.turns.every((t) => Array.isArray(t) && t.length === 3 && typeof t[1] === 'string'))) problems.push(at + ': turns');
    if (c.days !== undefined && !(Array.isArray(c.days) && c.days.every((d) => Array.isArray(d) && /^\d{4}-\d{2}-\d{2}$/.test(d[0])))) problems.push(at + ': days');
    if (!(c.turns || c.days)) problems.push(at + ': no observations');
    if (corpus.kind === 'verifier-probes') {
      if (!Array.isArray(c.plan) || !c.plan.length) problems.push(at + ': plan');
      if (c.expectedVerdict !== undefined && !Object.keys(c.expectedVerdict).every((d) => c.truth[d] === 'BORDERLINE' && typeof c.expectedVerdict[d] === 'string')) problems.push(at + ': expectedVerdict only on BORDERLINE dimensions');
      if (!c.truth || !Object.keys(c.truth).length || !Object.keys(c.truth).every((d) => CC.VERDICT_DIMENSIONS.indexOf(d) !== -1 && TRUTH_VALUES.indexOf(c.truth[d]) !== -1)) problems.push(at + ': truth');
    }
  });
  return problems;
}

// ── held-out: refusal unless sealed and frozen (§31.3) ──
function loadHeldout(manifestPath, heldoutPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath || path.join(__dirname, 'e02d', 'heldout.manifest.json'), 'utf8'));
  if (!heldoutPath) throw new HarnessRefusal('HELDOUT_NOT_SUPPLIED');
  if (!fs.existsSync(heldoutPath)) throw new HarnessRefusal('HELDOUT_NOT_SUPPLIED', 'file not found');
  if (typeof manifest.corpusSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(manifest.corpusSha256)) throw new HarnessRefusal('HELDOUT_MANIFEST_UNSEALED');
  const bytes = fs.readFileSync(heldoutPath);
  if (sha256(bytes) !== manifest.corpusSha256) throw new HarnessRefusal('HELDOUT_HASH_MISMATCH');
  const fp = manifest.frozenPrompts || {};
  if (!fp.generatorInstructionSha256 || !fp.verifierInstructionSha256) throw new HarnessRefusal('PROMPTS_NOT_FROZEN');
  const h = instructionHashes();
  if (fp.generatorInstructionSha256 !== h.generator || fp.verifierInstructionSha256 !== h.verifier) throw new HarnessRefusal('PROMPT_HASH_MISMATCH');
  const corpus = JSON.parse(bytes.toString('utf8'));
  corpus.kind = 'heldout';
  const problems = validateCorpus(corpus);
  if (problems.length) throw new HarnessRefusal('CORPUS_INVALID', problems.slice(0, 5).join('; '));
  return { corpus, corpusSha256: manifest.corpusSha256 };
}

// ── rendered-prompt views and plan templates ──
function grab(content, tag) {
  const start = content.lastIndexOf('<' + tag + '>') + tag.length + 2;
  return JSON.parse(content.slice(start, content.indexOf('</' + tag + '>', start)));
}
function generatorView(body) {
  const content = body.messages[0].content;
  return { observations: grab(content, 'observations'), concepts: grab(content, 'concepts'), records: grab(content, 'records'), userStated: grab(content, 'user_stated') };
}
function verifierView(body) {
  const content = body.messages[0].content;
  return { observations: grab(content, 'observations'), userStated: grab(content, 'user_stated'), targets: grab(content, 'targets'), items: grab(content, 'items') };
}
function obsKeyFor(view, needle) {
  if (needle && typeof needle === 'object' && typeof needle.key === 'string') return needle.key;
  const o = view.observations.find((x) => x.localDate === needle || x.segments.some((s) => typeof s.text === 'string' && s.text.indexOf(needle) !== -1));
  if (!o) throw new HarnessRefusal('TEMPLATE_UNRESOLVED', 'observation ' + JSON.stringify(needle));
  return o.obsKey;
}
function resolveProposal(t, view) {
  if (t && t.literal) return t.literal;
  if (t.operation === 'APPEND_EVIDENCE') {
    const rec = view.records.find((r) => r.relationDescription === t.target.rel);
    return { operation: t.operation, target: rec ? rec.recordKey : 'r99', list: t.list, observations: t.observations.map((n) => obsKeyFor(view, n)),
      restatesUserStatement: false, safetyAdjacent: false };
  }
  const factor = (f) => {
    if (f.concept !== undefined) {
      const c = view.concepts.find((x) => x.labels.indexOf(f.concept) !== -1);
      if (!c) throw new HarnessRefusal('TEMPLATE_UNRESOLVED', 'concept ' + f.concept);
      return { conceptKey: c.conceptKey, newConceptLabel: null, role: f.role, valueText: f.valueText || null };
    }
    return { conceptKey: null, newConceptLabel: f.newConceptLabel, role: f.role, valueText: f.valueText || null };
  };
  const anchor = (a) => (a.kind === 'USER_EXPRESSION'
    ? { kind: a.kind, obsKey: obsKeyFor(view, a.obs), segmentId: a.segmentId, text: a.text }
    : { kind: a.kind, obsKey: obsKeyFor(view, a.obs), segmentId: a.segmentId, field: a.field });
  const out = {
    operation: t.operation, factors: t.factors.map(factor), relationText: t.relationText, evidenceClass: t.evidenceClass, temporality: t.temporality,
    grounding: t.grounding ? { recurrence: { form: t.grounding.recurrence.form, anchors: t.grounding.recurrence.anchors.map(anchor) },
      window: { form: t.grounding['window'].form, anchors: t.grounding['window'].anchors.map(anchor) } } : null,
    supporting: (t.supporting || []).map((n) => obsKeyFor(view, n)), contradicting: (t.contradicting || []).map((n) => obsKeyFor(view, n)),
    reference: t.reference ? { uKey: view.userStated.find((u) => JSON.stringify(u).indexOf(t.reference.u) !== -1).uKey, factorIndex: t.reference.factorIndex } : null,
    restatesUserStatement: false, safetyAdjacent: false
  };
  if (t.operation === 'SUPERSEDE') {
    const rec = view.records.find((r) => r.relationDescription === t.target.rel);
    out.target = rec ? rec.recordKey : 'r99';
  }
  return out;
}

// ── scripted (synthetic) responses ──
function passingTokens(operation) {
  const applies = CC.VERDICT_APPLICABILITY[operation];
  const out = {};
  CC.VERDICT_DIMENSIONS.forEach((d) => { out[d] = applies[d] ? CC.PASSING_VERDICT[d] : 'NOT_APPLICABLE'; });
  return out;
}
const FAILING_VALUE = { restatement: 'RESTATED', unsupported: 'PRESENT', safety: 'SAFETY_ADJACENT', temporal: 'UNFAITHFUL', direction: 'INCONSISTENT' };
function scriptedVerifierResponse(spec, vv, probeTruth) {
  if (spec === 'fail') throw new Error('scripted verifier transport failure');
  const verdicts = vv.items.map((it) => {
    const t = passingTokens(it.operation);
    if (spec && spec.veto) Object.assign(t, spec.veto);
    if (spec === 'truth' && probeTruth) {
      Object.keys(probeTruth).forEach((d) => {
        if (!CC.VERDICT_APPLICABILITY[it.operation][d]) return;
        t[d] = probeTruth[d] === 'VETO' ? FAILING_VALUE[d] : (probeTruth[d] === 'BORDERLINE' ? 'UNCERTAIN' : CC.PASSING_VERDICT[d]);
      });
    }
    return Object.assign({ item: it.item }, t);
  });
  if (spec === 'malformed-first' && verdicts.length) verdicts[0].direction = verdicts[0].direction === 'NOT_APPLICABLE' ? 'CONSISTENT' : 'NOT_APPLICABLE';
  return { content: [{ type: 'text', text: JSON.stringify({ verdicts }) }], stop_reason: 'end_turn' };
}
function estimateTokens(text, lang) {
  if (typeof text !== 'string') return 0;
  const g = Interpreter._internal.INSTRUCTION;
  const v = Verifier._internal.INSTRUCTION;
  const instr = text.startsWith(g) ? g.length : (text.startsWith(v) ? v.length : 0);
  return Math.ceil(instr / 4 + (text.length - instr) / (CHARS_PER_TOKEN[lang] || 4));
}

// ── one case, one sample: the unmodified production pass over synthetic data ──
async function seedCase(c, M) {
  const Store = M.Store;
  const uk = M.createInMemoryPort();
  const obs = M.observationPort.createObservationPort();
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
  const candidates = (c.candidates || []).concat(c.candidate ? [c.candidate] : []);
  for (const cand of candidates) {
    const ids = [];
    cfgStore('CLIENT', 'calibration.seed');
    for (const labels of cand.labels) ids.push((await Store.createConcept({ labels })).ids.conceptIds[0]);
    cfgStore('SERVER', 'calibration.seed');
    await Store.createRecord({ draft: { factors: [{ conceptId: ids[0], role: 'condition', valueDescription: null }, { conceptId: ids[1], role: 'outcome', valueDescription: null }],
      relationDescription: cand.rel, evidenceClass: 'CO_OCCURRENCE', temporality: 'DURABLE', confidence: 0, source: 'inferred_event', safetyFlag: 'STANDARD',
      evidence: { supporting: [{ kind: 'CONVERSATION_TURN', ref: cand.turn }] } } });
  }
  cfgStore('SERVER', 'e02d.consolidation');
  return { uk, obs };
}

const VERDICT_CODES = new Set(Object.values(CC.VERDICT_CODES).reduce((a, m) => a.concat(Object.values(m)), []));
function classify(p) {
  if (p.code === 'MALFORMED_PROPOSAL') return 'MALFORMED_PROPOSAL';
  if (p.code === 'VERIFICATION_UNAVAILABLE') return 'VERIFIER_FAILED';
  if (p.code === 'VERIFICATION_MALFORMED') return 'VERIFICATION_MALFORMED';
  if (p.code === 'VERIFICATION_MISSING') return 'VERIFICATION_MISSING';
  if (p.outcome === 'ADMITTED_EXECUTED') return 'AUTHORIZED_WRITTEN';
  if (p.outcome === 'ADMITTED_FAILED') return 'AUTHORIZED_WRITE_FAILED';
  if (p.verification === null) return p.outcome === 'NO_CHANGE' ? 'NO_CHANGE' : 'PRE_VERIFICATION_REJECTED';
  if (p.outcome === 'NO_CHANGE') return 'AUTHORIZED_NO_CHANGE';
  if (VERDICT_CODES.has(p.code)) return 'VERIFIER_VETO';
  return 'POST_VERIFICATION_REJECTED';
}
const isPlanOutcome = (p) => p.verification !== null || ['VERIFICATION_UNAVAILABLE', 'VERIFICATION_MALFORMED', 'VERIFICATION_MISSING'].indexOf(p.code) !== -1;
const BLANK_LABELS = Object.freeze({ restated: null, grounded: null, genuine: null, addsNewMeaning: null, safetyAdjacent: null, safetyInfluenced: null,
  temporalCorrect: null, inventedTemporal: null, externalKnowledge: null, recordingArtifact: null, operationCorrect: null, directionCorrect: null, notes: null });

async function runSample(c, sampleIdx, run) {
  const lang = c.lang || run.corpus.defaultLang;
  const M = run.modules;
  const { uk, obs } = await seedCase(c, M);
  const D = M.observationPort.descriptors();
  const calls = [];
  const sample = { caseId: c.id, sample: sampleIdx, lang, domain: c.domain || null, gate: c.gate || [], expect: c.expect || null,
    interpretation: (run.corpus.INTERPRETATION && run.corpus.INTERPRETATION[c.id]) || null, replayDiverged: null, integrity: [] };
  const transport = async (body) => {
    const stage = stageOf(body); // throws UNKNOWN_STAGE: fails closed
    const seq = calls.length;
    const profile = stage === 'GENERATOR' ? run.generatorProfile : run.verifierProfile;
    const requestHash = sha256(canonicalJson(body));
    const source = run.sourceOf(stage);
    const rec = { stage, seq, profile, model: body.model, maxTokens: body.max_tokens, requestHash,
      requestChars: body.messages[0].content.length, source, raw: null, stopReason: null, usage: null, latencyMs: null, transport: 'OK',
      structure: null, refusal: null, answerTextChars: null };
    calls.push(rec);
    if (stage === 'VERIFIER') rec.request = verifierView(body);
    else rec.concepts = generatorView(body).concepts; // for the shadowing measure (CAL-D6)
    const started = process.hrtime.bigint();
    let raw;
    try {
      if (source === 'REPLAY') {
        const hit = run.replay.get(c.id + '#' + sampleIdx + '#' + stage + '#' + seq);
        if (!hit || hit.requestHash !== requestHash) {
          rec.transport = 'REPLAY_DIVERGED';
          sample.replayDiverged = { stage, seq, reason: hit ? 'REQUEST_HASH_MISMATCH' : 'NO_RECORDED_RESPONSE' };
          throw new Error('REPLAY_DIVERGED');
        }
        if (hit.failed) throw new Error('replayed transport failure (' + hit.failed + ')');
        raw = hit.raw;
      } else if (source === 'SYNTHETIC') {
        if (stage === 'GENERATOR') {
          const script = c.script && c.script.generator !== undefined ? c.script.generator : (c.plan || []);
          if (script && script.raw !== undefined) raw = { content: [{ type: 'text', text: script.raw }], stop_reason: 'end_turn' };
          else raw = { content: [{ type: 'text', text: JSON.stringify({ proposals: script.map((t) => resolveProposal(t, generatorView(body))) }) }], stop_reason: 'end_turn' };
        } else {
          const spec = run.mode === 'generator-only' ? 'pass' : ((c.script && c.script.verifier) || run.dryRunVerifier || 'pass');
          raw = scriptedVerifierResponse(spec, rec.request, c.truth);
        }
        const scripted = MRS.extractAnswerText(raw, { state: 'EXPLICIT_PROFILE', reasoning: profile.reasoning });
        raw.usage = { input_tokens: estimateTokens(body.messages[0].content, lang), output_tokens: estimateTokens(scripted.text || '', 'en') };
        rec.usageEstimated = true;
      } else {
        raw = await run.realSend(body);
      }
    } catch (e) {
      if (rec.transport === 'OK') rec.transport = e && e.apiFailure ? 'API_FAILURE' : 'ERROR';
      if (e && e.apiFailure) run.abort = { stage, status: e.status, type: e.type };
      rec.latencyMs = Number(process.hrtime.bigint() - started) / 1e6;
      throw e;
    }
    rec.latencyMs = Number(process.hrtime.bigint() - started) / 1e6;
    rec.raw = raw;
    rec.stopReason = raw ? raw.stop_reason : null;
    rec.usage = raw && raw.usage ? { input: raw.usage.input_tokens, output: raw.usage.output_tokens } : null; // output may include reasoning (§31.4)
    // §31.4 — the MRS-001 structural outcome under the stage's own profile, the refusal outcome with the
    // provider-supplied category/details (evidence only, never PassResult) and the answer-text size.
    const x = MRS.extractAnswerText(raw, { state: 'EXPLICIT_PROFILE', reasoning: profile.reasoning });
    rec.structure = { status: x.status, failure: x.failure };
    rec.refusal = x.failure === 'REFUSAL' ? { refused: true, category: x.refusal.category, details: x.refusal.details } : { refused: false };
    rec.answerTextChars = x.status === 'OK' ? x.text.length : null;
    return raw;
  };
  const cfg = { store: M.Store, port: obs.port, modelTransport: transport, now: () => 99999999, isLearningConsentGranted: () => true, getConsentState: () => ({}),
    userId: 'cal', observationSources: [D.conversation, D.dayLog], referenceSource: D.typedMemory,
    generatorProfile: run.generatorProfile, verifierProfile: run.verifierProfile };
  if (M.Consolidation.configure(cfg).status !== 'CONFIGURED') throw new HarnessRefusal('CONFIGURATION_FAILED');
  const result = await M.Consolidation.runPass({ passId: 'cal-' + c.id + '-' + sampleIdx, window: WINDOW });

  // ── evidence assembly ──
  const gen = calls.find((x) => x.stage === 'GENERATOR') || null;
  const ver = calls.find((x) => x.stage === 'VERIFIER') || null;
  const parsedGen = gen && gen.raw ? Interpreter._internal.parseResponse(gen.raw, run.generatorProfile) : null;
  const plans = result.proposals.filter(isPlanOutcome);
  let parsedVer = null;
  if (ver && ver.raw && ver.request) {
    const operations = {};
    ver.request.items.forEach((it) => { operations[it.item] = it.operation; });
    parsedVer = Verifier._internal.parseResponse(ver.raw, operations, run.verifierProfile);
  }
  const attribution = plans.map((p, i) => ({ pKey: CC.passKey(CC.KEY_PREFIXES.item, i), proposalIndex: p.index }));
  const touched = new Set([].concat(...result.proposals.map((p) => p.recordIds || [])));
  const written = uk.hooks.peek('cal').records.filter((r) => r.provenance.producer === 'e02d.consolidation' || touched.has(r.recordId))
    .map((r) => ({ recordId: r.recordId, status: r.status, relationDescription: r.relationDescription, values: r.factors.map((f) => f.valueDescription), evidenceClass: r.evidenceClass,
      temporality: r.temporality, supporting: r.evidence.supporting.map((e) => e.refId), contradicting: r.evidence.contradicting.map((e) => e.refId), version: r.version }));
  // integrity of the recording itself
  if (result.modelCalls !== calls.length && !sample.replayDiverged && !run.abort) sample.integrity.push('MODEL_CALLS_MISMATCH');
  if (calls.filter((x) => x.stage === 'GENERATOR').length > 1 || calls.filter((x) => x.stage === 'VERIFIER').length > 1) sample.integrity.push('STAGE_CALL_COUNT');
  if (!!ver !== (plans.length > 0) && result.status !== 'INTERPRETER_FAILED' && !sample.replayDiverged) sample.integrity.push('VERIFIER_DISPATCH_MISMATCH');
  if (ver && ver.request && ver.request.items.length !== plans.length) sample.integrity.push('ITEM_COUNT_MISMATCH');
  const entries = parsedGen && parsedGen.status === 'OK' ? parsedGen.entries : [];
  Object.assign(sample, {
    status: sample.replayDiverged ? 'REPLAY_DIVERGED' : result.status,
    modelCalls: result.modelCalls,
    stageFailure: result.stageFailure,
    passResult: result,
    calls,
    generator: gen ? { status: parsedGen ? parsedGen.status : 'FAILED', entries, concepts: gen.concepts || [] } : null,
    verifier: ver ? { called: true, items: ver.request ? ver.request.items : null, targets: ver.request ? ver.request.targets : null, parsed: parsedVer } : { called: false },
    attribution,
    proposals: result.proposals.map((p) => {
      const e = entries.find((x) => x.index === p.index);
      return { index: p.index, operation: p.operation, class: classify(p), outcome: p.outcome, code: p.code, verification: p.verification, recordIds: p.recordIds,
        proposal: e && e.ok ? e.proposal : null };
    }),
    written
  });
  if (run.mode === 'verifier-probes') sample.probe = probeResult(c, sample);
  return sample;
}

function probeResult(c, sample) {
  const plan = sample.proposals.find((p) => isPlanOutcome(p));
  const reached = !!(sample.verifier.called && plan);
  const tokens = reached ? plan.verification : null;
  const dims = {};
  Object.keys(c.truth).forEach((d) => {
    if (!reached) { dims[d] = 'PROBE_NOT_VERIFIED'; return; }
    if (!tokens) { dims[d] = plan.code === 'VERIFICATION_UNAVAILABLE' ? 'VERIFIER_FAILED' : 'VERIFICATION_' + (plan.code === 'VERIFICATION_MISSING' ? 'MISSING' : 'MALFORMED'); return; }
    const v = tokens[d];
    const passing = v === CC.PASSING_VERDICT[d];
    if (c.truth[d] === 'BORDERLINE') dims[d] = 'BORDERLINE:' + v;
    else if (c.truth[d] === 'PASS') dims[d] = passing ? 'CORRECT_PASS' : (v === 'UNCERTAIN' ? 'FALSE_VETO_UNCERTAIN' : 'FALSE_VETO');
    else dims[d] = passing ? 'MISSED_VETO' : (v === 'UNCERTAIN' ? 'CORRECT_VETO_UNCERTAIN' : 'CORRECT_VETO');
  });
  // Product-fixed verdicts for borderline dimensions: agreement reported, never relabelled.
  const expected = {};
  Object.keys(c.expectedVerdict || {}).forEach((d) => { expected[d] = { expected: c.expectedVerdict[d], actual: tokens ? tokens[d] : null, agrees: !!tokens && tokens[d] === c.expectedVerdict[d] }; });
  return { truth: c.truth, reachedVerifier: reached, tokens, dimensions: dims, expectedVerdict: expected };
}

function reviewRows(runId, sample) {
  const rows = [];
  const verCall = sample.calls.find((x) => x.stage === 'VERIFIER');
  sample.attribution.forEach(({ pKey, proposalIndex }) => {
    const p = sample.proposals.find((x) => x.index === proposalIndex);
    const item = sample.verifier.items ? sample.verifier.items.find((it) => it.item === pKey) : null;
    const target = item && item.target && sample.verifier.targets ? sample.verifier.targets.find((t) => t.recordKey === item.target) : null;
    const keys = item ? [].concat(item.supporting || [], item.contradicting || [], item.observations || []) : [];
    const observations = keys.map((k) => {
      const found = verCall && verCall.request ? verCall.request.observations.find((x) => x.obsKey === k) : null;
      return found ? { obsKey: k, localDate: found.localDate, segments: found.segments } : { obsKey: k };
    });
    const w = p.recordIds.length ? sample.written.find((r) => p.recordIds.indexOf(r.recordId) !== -1) || null : null;
    rows.push({ rowId: runId + ':' + sample.caseId + ':' + sample.sample + ':' + pKey, caseId: sample.caseId, sample: sample.sample, lang: sample.lang, domain: sample.domain,
      expect: sample.expect, interpretation: sample.interpretation, pKey, proposalIndex, operation: p.operation, item, target, citedObservations: observations,
      verdict: p.verification, class: p.class, code: p.code, written: w, labels: Object.assign({}, BLANK_LABELS) });
  });
  return rows;
}

// ── accounting ──
function pct(xs, q) { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)]; }
function costOf(model, usage, prices) {
  if (!prices || !usage || !prices.models || !prices.models[model]) return null;
  const p = prices.models[model];
  return (usage.input || 0) / 1e6 * p.inputPerMTok + (usage.output || 0) / 1e6 * p.outputPerMTok;
}
function answerSize(calls) {
  const xs = calls.map((c) => c.answerTextChars).filter((x) => typeof x === 'number');
  return { p50: pct(xs, 0.5), max: xs.length ? Math.max(...xs) : null };
}
function accounting(samples, prices) {
  const stages = {};
  for (const stage of ['GENERATOR', 'VERIFIER']) {
    const calls = [].concat(...samples.map((s) => s.calls.filter((c) => c.stage === stage)));
    const lat = calls.map((c) => c.latencyMs).filter((x) => typeof x === 'number');
    const costs = calls.map((c) => costOf(c.model, c.usage, prices));
    stages[stage] = {
      calls: calls.length,
      bySource: calls.reduce((m, c) => { m[c.source] = (m[c.source] || 0) + 1; return m; }, {}),
      models: Array.from(new Set(calls.map((c) => c.model))),
      inputTokens: calls.reduce((n, c) => n + ((c.usage && c.usage.input) || 0), 0),
      outputTokens: calls.reduce((n, c) => n + ((c.usage && c.usage.output) || 0), 0),
      tokensEstimated: calls.some((c) => c.usageEstimated),
      maxOutputTokens: Math.max(0, ...calls.map((c) => (c.usage && c.usage.output) || 0)),
      maxTokensStops: calls.filter((c) => c.stopReason === 'max_tokens').length,
      // CAL-D7 v1.2 (§31.2): provider output usage against the profile's TOTAL ceiling (may include
      // reasoning); answer-text size and refusals reported separately; failures by stageFailure.reason.
      profiles: Array.from(new Set(calls.map((c) => canonicalJson(c.profile)))).map((j) => JSON.parse(j)),
      maxOutputUsageRatio: calls.reduce((m, c) => (c.usage && c.profile ? Math.max(m, (c.usage.output || 0) / c.profile.maxOutputTokens) : m), 0),
      answerTextChars: answerSize(calls),
      refusals: { count: calls.filter((c) => c.refusal && c.refusal.refused).length, rate: calls.length ? calls.filter((c) => c.refusal && c.refusal.refused).length / calls.length : null },
      structuralFailures: calls.reduce((m, c) => { if (c.structure && c.structure.failure) m[c.structure.failure] = (m[c.structure.failure] || 0) + 1; return m; }, {}),
      stageFailures: samples.reduce((m, s) => { const f = s.stageFailure; if (f && f.stage === stage) m[f.reason] = (m[f.reason] || 0) + 1; return m; }, {}),
      cost: costs.some((x) => x === null) ? null : costs.reduce((a, b) => a + b, 0),
      costBasis: calls.length && calls.every((c) => c.source === 'REAL') ? 'ACTUAL_USAGE' : 'NOT_BILLED_OR_ESTIMATED',
      latencyMs: { p50: pct(lat, 0.5), p99: pct(lat, 0.99), max: lat.length ? Math.max(...lat) : null }
    };
  }
  const e2e = samples.map((s) => s.calls.reduce((n, c) => n + (c.latencyMs || 0), 0));
  const total = { calls: stages.GENERATOR.calls + stages.VERIFIER.calls, cost: stages.GENERATOR.cost === null || stages.VERIFIER.cost === null ? null : stages.GENERATOR.cost + stages.VERIFIER.cost };
  return { stages, total, endToEndLatencyMs: { p50: pct(e2e, 0.5), p99: pct(e2e, 0.99), max: e2e.length ? Math.max(...e2e) : null },
    modelCallsCheck: samples.every((s) => s.integrity.indexOf('MODEL_CALLS_MISMATCH') === -1) };
}

// ── the run ──
function sourcePolicy(mode, how) {
  return (stage) => {
    if (mode === 'verifier-probes' && stage === 'GENERATOR') return 'SYNTHETIC';
    if (mode === 'generator-only' && stage === 'VERIFIER') return 'SYNTHETIC';
    return how; // 'SYNTHETIC' (dry-run), 'REPLAY' or 'REAL'
  };
}
function loadReplay(replayPath) {
  const art = JSON.parse(fs.readFileSync(replayPath, 'utf8'));
  if (art.schema !== ARTIFACT_SCHEMA || !art.harness || !/^3\./.test(art.harness.version)) throw new HarnessRefusal('REPLAY_NOT_V12_EVIDENCE');
  const map = new Map();
  art.samples.forEach((s) => s.calls.forEach((c) => {
    const key = s.caseId + '#' + s.sample + '#' + c.stage + '#' + c.seq;
    if (c.raw) map.set(key, { raw: c.raw, requestHash: c.requestHash });
    else if (c.transport === 'ERROR' || c.transport === 'API_FAILURE') map.set(key, { failed: c.transport, requestHash: c.requestHash }); // a recorded transport failure replays as one
  }));
  return { map, artifact: art };
}

async function runCalibration(opts) {
  rejectV11Options(opts);
  const o = Object.assign({ mode: 'end-to-end', corpus: 'development', samples: 3, only: null, dryRun: false, replayPath: null, generatorProfile: null,
    verifierProfile: null, prices: null, outDir: os.tmpdir(), runId: null, heldoutManifestPath: null, heldoutPath: null, realSend: null, paidApproval: null,
    dryRunVerifier: null, write: true, modules: null }, opts || {});
  if (MODES.indexOf(o.mode) === -1) throw new HarnessRefusal('UNKNOWN_MODE', o.mode);
  let corpus;
  let corpusSha256;
  if (o.corpus === 'heldout') { const h = loadHeldout(o.heldoutManifestPath, o.heldoutPath); corpus = h.corpus; corpusSha256 = h.corpusSha256; }
  else { corpus = typeof o.corpus === 'string' ? corpusFor(o.corpus) : o.corpus; corpusSha256 = sha256(canonicalJson(corpus.cases)); }
  const problems = validateCorpus(corpus);
  if (problems.length) throw new HarnessRefusal('CORPUS_INVALID', problems.slice(0, 5).join('; '));
  if ((o.mode === 'verifier-probes') !== (corpus.kind === 'verifier-probes')) throw new HarnessRefusal('MODE_CORPUS_MISMATCH', o.mode + ' / ' + corpus.kind);
  const how = o.dryRun ? 'SYNTHETIC' : (o.replayPath ? 'REPLAY' : 'REAL');
  const profiles = resolveProfiles(o);
  const run = { mode: o.mode, corpus, sourceOf: sourcePolicy(o.mode, how), generatorProfile: profiles.generator, verifierProfile: profiles.verifier,
    dryRunVerifier: o.dryRunVerifier, replay: null, realSend: o.realSend, abort: null, modules: o.modules || loadModules() };
  const anyReal = ['GENERATOR', 'VERIFIER'].some((s) => run.sourceOf(s) === 'REAL');
  if (anyReal) {
    if (!o.paidApproval || typeof o.paidApproval.maxCostUsd !== 'number') throw new HarnessRefusal('PAID_RUN_NOT_APPROVED');
    if (!o.prices) throw new HarnessRefusal('PRICE_TABLE_REQUIRED');
    if (typeof o.realSend !== 'function') throw new HarnessRefusal('NO_REAL_TRANSPORT');
    const budget = await budgetStatement(Object.assign({}, o, { realSend: null }));
    if (budget.maxCost === null || budget.maxCost.total > o.paidApproval.maxCostUsd) throw new HarnessRefusal('BUDGET_EXCEEDS_APPROVAL');
  }
  if (how === 'REPLAY') run.replay = loadReplay(o.replayPath).map;
  const trap = anyReal ? null : installNetworkTrap();
  const cases = corpus.cases.filter((c) => !o.only || o.only.indexOf(c.id) !== -1);
  const samples = [];
  const runId = o.runId || (o.mode + '-' + corpus.id + '-' + new Date().toISOString().replace(/[:.]/g, '-'));
  try {
    for (const c of cases) {
      for (let s = 0; s < o.samples; s++) {
        if (run.abort) break;
        samples.push(await runSample(c, s, run));
      }
    }
  } finally {
    if (trap) trap.restore();
  }
  const networkAttempts = trap ? trap.attempts() : null;
  if (trap && networkAttempts !== 0) throw new HarnessRefusal('NETWORK_ATTEMPTED', String(networkAttempts));
  const rows = [].concat(...samples.map((s) => reviewRows(runId, s)));
  const h = instructionHashes();
  const artifact = {
    schema: ARTIFACT_SCHEMA,
    harness: { version: HARNESS_VERSION, runId, mode: o.mode, diagnosticOnly: o.mode === 'generator-only', source: how, dryRun: !!o.dryRun, replayOf: o.replayPath || null },
    corpus: { id: corpus.id, kind: corpus.kind, sha256: corpusSha256, cases: cases.length, samples: o.samples, tuningAllowed: corpus.tuningAllowed === true },
    prompts: { generatorInstructionSha256: h.generator, verifierInstructionSha256: h.verifier },
    profiles: { generator: run.generatorProfile, verifier: run.verifierProfile }, // §31.4: complete stage profiles
    prices: o.prices ? { source: o.prices.source, effectiveDate: o.prices.effectiveDate } : null,
    networkAttempts,
    aborted: run.abort,
    accounting: accounting(samples, o.prices),
    samples,
    reviewRows: rows
  };
  if (!o.write) return { artifact };
  fs.mkdirSync(o.outDir, { recursive: true });
  const file = path.join(o.outDir, 'e02d-calibration-' + runId + '.json');
  const text = JSON.stringify(artifact, null, 2);
  fs.writeFileSync(file, text);
  const manifest = { runId, file: path.basename(file), sha256: sha256(text), schema: ARTIFACT_SCHEMA };
  const manifestFile = file.replace(/\.json$/, '.manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  return { artifact, file, manifestFile, sha256: manifest.sha256 };
}

// v1.2 §31.4 — complete stage profiles only, through configure(); a v1.1 model override never applies in part.
function rejectV11Options(opts) {
  ['generatorModelOverride', 'verifierModel'].forEach((k) => { if (opts && opts[k] !== undefined && opts[k] !== null) throw new HarnessRefusal('V11_OPTION_REMOVED', k); });
}
function resolveProfiles(o) {
  const generator = o.generatorProfile || CC.DEFAULT_GENERATOR_PROFILE;
  const verifier = o.verifierProfile || CC.DEFAULT_VERIFIER_PROFILE;
  if (!CC.isValidRequestProfile(generator)) throw new HarnessRefusal('PROFILE_INVALID', 'generator');
  if (!CC.isValidRequestProfile(verifier)) throw new HarnessRefusal('PROFILE_INVALID', 'verifier');
  return { generator: CC.copyProfile(generator), verifier: CC.copyProfile(verifier) };
}

// ── pre-run budget statement (offline; renders the real prompts under the network trap) ──
async function budgetStatement(opts) {
  rejectV11Options(opts);
  const o = Object.assign({ mode: 'end-to-end', corpus: 'development', samples: 3, only: null, prices: null, generatorProfile: null, verifierProfile: null,
    assumedVerifierDispatchRate: 1, assumedPlansPerPass: 2, assumedGeneratorOutputTokens: 500, assumedVerifierOutputTokensPerItem: 60, paidApproval: null }, opts || {});
  // Rendering runs over isolated module instances: the caller's Generator/Verifier/store configuration
  // is never read for writing nor changed. The effective profiles are the explicit ones, or else the
  // stage defaults (§27.1) — exactly what a run uses.
  const profiles = resolveProfiles(o);
  const render = await withIsolatedModules((M) => runCalibration({ mode: o.mode, corpus: o.corpus, samples: 1, only: o.only, dryRun: true, write: false,
    heldoutManifestPath: o.heldoutManifestPath, heldoutPath: o.heldoutPath, generatorProfile: profiles.generator, verifierProfile: profiles.verifier, modules: M }));
  const art = render.artifact;
  const passes = art.corpus.cases * o.samples;
  const realGen = o.mode !== 'verifier-probes';
  const realVer = o.mode !== 'generator-only';
  const genModel = profiles.generator.model;
  const verModel = profiles.verifier.model;
  const genIn = art.samples.map((s) => s.calls.find((c) => c.stage === 'GENERATOR')).filter(Boolean).map((c) => c.usage.input);
  const genInPerPass = genIn.length ? genIn.reduce((a, b) => a + b, 0) / genIn.length : 0;
  const instrDelta = (Verifier._internal.INSTRUCTION.length - Interpreter._internal.INSTRUCTION.length) / 4;
  const verInPerPass = Math.max(0, genInPerPass + instrDelta + o.assumedPlansPerPass * 150);
  const maxGeneratorCalls = realGen ? passes : 0;
  const maxVerifierCalls = realVer ? passes : 0;
  const expected = { generator: maxGeneratorCalls, verifier: Math.ceil(maxVerifierCalls * o.assumedVerifierDispatchRate) }; // no preflight or retry calls exist
  const tokens = {
    generator: { inputExpected: Math.round(genInPerPass * expected.generator), outputExpected: o.assumedGeneratorOutputTokens * expected.generator, outputMax: profiles.generator.maxOutputTokens * maxGeneratorCalls, inputMax: Math.round(genInPerPass * maxGeneratorCalls) },
    verifier: { inputExpected: Math.round(verInPerPass * expected.verifier), outputExpected: o.assumedVerifierOutputTokensPerItem * o.assumedPlansPerPass * expected.verifier, outputMax: profiles.verifier.maxOutputTokens * maxVerifierCalls, inputMax: Math.round(verInPerPass * maxVerifierCalls) }
  };
  const price = (m) => (o.prices && o.prices.models && o.prices.models[m]) || null;
  const c = (m, i, out) => (price(m) ? i / 1e6 * price(m).inputPerMTok + out / 1e6 * price(m).outputPerMTok : null);
  const cost = (m, i, out, real) => (real ? c(m, i, out) : 0);
  const est = { generator: cost(genModel, tokens.generator.inputExpected, tokens.generator.outputExpected, realGen), verifier: cost(verModel, tokens.verifier.inputExpected, tokens.verifier.outputExpected, realVer) };
  const max = { generator: cost(genModel, tokens.generator.inputMax, tokens.generator.outputMax, realGen), verifier: cost(verModel, tokens.verifier.inputMax, tokens.verifier.outputMax, realVer) };
  const sum = (x) => (x.generator === null || x.verifier === null ? null : Object.assign({ total: x.generator + x.verifier }, x));
  return {
    mode: o.mode, diagnosticOnly: o.mode === 'generator-only', corpus: art.corpus, samples: o.samples, passes,
    generatorModel: realGen ? genModel : '(scripted plans; no Generator call)',
    verifierModel: realVer ? verModel : '(pass-through stub; no Verifier call)',
    generatorProfile: realGen ? profiles.generator : null, verifierProfile: realVer ? profiles.verifier : null,
    maxGeneratorCalls, maxVerifierCalls, maxTotalCalls: maxGeneratorCalls + maxVerifierCalls,
    expectedCalls: Object.assign({ total: expected.generator + expected.verifier }, expected),
    tokens, estimatedCost: sum(est), maxCost: sum(max), maxApprovedCost: o.paidApproval ? o.paidApproval.maxCostUsd : null,
    prices: o.prices ? { source: o.prices.source, effectiveDate: o.prices.effectiveDate } : 'PRICE_TABLE_REQUIRED',
    latency: { generatorTimeoutMs: profiles.generator.timeoutMs, verifierTimeoutMs: profiles.verifier.timeoutMs, maxPerPassMs: profiles.generator.timeoutMs + profiles.verifier.timeoutMs,
      maxSequentialRunMs: passes * (profiles.generator.timeoutMs + profiles.verifier.timeoutMs) },
    assumptions: ['ESTIMATE: input tokens from the real rendered Generator prompts at ' + JSON.stringify(CHARS_PER_TOKEN) + ' data characters per token',
      'ASSUMPTION: Verifier dispatch rate ' + o.assumedVerifierDispatchRate + ' (1 = every pass reaches the Verifier; maximums are unaffected)',
      'ASSUMPTION: ' + o.assumedPlansPerPass + ' plans per verified pass; expected outputs ' + o.assumedGeneratorOutputTokens + ' (Generator) and ' + o.assumedVerifierOutputTokensPerItem + ' per item (Verifier)',
      'Maximum cost uses each stage profile\'s total maxOutputTokens ceiling (reasoning plus answer) for every call']
  };
}

// ── real transport (paid; used only by an approved CLI run) ──
async function realSend(body) {
  const res = await fetch(API_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
  const raw = await res.json();
  if (!res.ok) { const e = new Error('API failure'); e.apiFailure = true; e.status = res.status; e.type = raw && raw.error && raw.error.type; throw e; }
  return raw;
}

async function main() {
  const env = process.env;
  const opts = {
    mode: env.E02D_MODE || 'end-to-end', corpus: env.E02D_CORPUS || 'development', samples: Math.max(1, Number(env.E02D_SAMPLES || 3)),
    only: env.E02D_ONLY ? env.E02D_ONLY.split(',') : null, dryRun: env.E02D_DRY_RUN === '1', replayPath: env.E02D_REPLAY || null,
    generatorProfile: env.E02D_GENERATOR_PROFILE ? JSON.parse(fs.readFileSync(env.E02D_GENERATOR_PROFILE, 'utf8')) : null,
    verifierProfile: env.E02D_VERIFIER_PROFILE ? JSON.parse(fs.readFileSync(env.E02D_VERIFIER_PROFILE, 'utf8')) : null,
    prices: env.E02D_PRICES ? JSON.parse(fs.readFileSync(env.E02D_PRICES, 'utf8')) : null, outDir: env.E02D_OUT_DIR || os.tmpdir(),
    heldoutPath: env.E02D_HELDOUT_PATH || null
  };
  if (env.E02D_GENERATOR_MODEL_OVERRIDE || env.E02D_VERIFIER_MODEL) { console.error('Refusing: v1.1 model overrides are replaced by complete stage profiles (E02D_GENERATOR_PROFILE / E02D_VERIFIER_PROFILE).'); process.exitCode = 1; return; }
  if (env.E02D_PRINT_PROMPT_HASHES === '1') { console.log(JSON.stringify(instructionHashes(), null, 2)); return; }
  if (env.E02D_PLAN_ONLY === '1' || (!opts.dryRun && !opts.replayPath)) {
    console.log(JSON.stringify(await budgetStatement(Object.assign({}, opts, { paidApproval: env.E02D_MAX_COST_USD ? { maxCostUsd: Number(env.E02D_MAX_COST_USD) } : null })), null, 2));
    if (env.E02D_PLAN_ONLY === '1') return;
    if (env.E02D_CONFIRM_PAID !== '1' || !env.E02D_MAX_COST_USD) { console.error('Refusing a paid run: set E02D_CONFIRM_PAID=1 and E02D_MAX_COST_USD only after explicit Product approval of the statement above.'); process.exitCode = 1; return; }
    if (!env.ANTHROPIC_API_KEY) { console.error('Refusing: ANTHROPIC_API_KEY is not set.'); process.exitCode = 1; return; }
    opts.realSend = realSend;
    opts.paidApproval = { maxCostUsd: Number(env.E02D_MAX_COST_USD) };
  }
  const r = await runCalibration(opts);
  console.log(JSON.stringify({ file: r.file, sha256: r.sha256, accounting: r.artifact.accounting, networkAttempts: r.artifact.networkAttempts, aborted: r.artifact.aborted }, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('Calibration harness: ' + (e && (e.code || e.message))); process.exitCode = 1; });
}

module.exports = {
  HARNESS_VERSION, ARTIFACT_SCHEMA, MODES, DRY_RUN_SCENARIOS, HarnessRefusal,
  canonicalJson, sha256, instructionHashes, stageOf, installNetworkTrap, validateCorpus, corpusFor, loadHeldout,
  resolveProposal, runCalibration, budgetStatement, classify
};
