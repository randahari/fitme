// WP0 Phase E.0.2c — User Knowledge Record and Concept Identity Foundation: static tests
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §08, §16.4, §22-§26, §30 AC-34/36/37/40-45/59/62). Source scans only; no model call exists.
// Byte-unchanged verification of existing files is performed by the implementation review
// (R-1/R-2, git diff), following the E.0.2b precedent.
// Run with: node --test tests/e02cUserKnowledgeStatic.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOnly = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

const MODULES = {
  contract: 'js/coachDecisionSystem/userKnowledgeContract.js',
  transitions: 'js/coachDecisionSystem/userKnowledgeTransitions.js',
  store: 'js/coachDecisionSystem/userKnowledgeStore.js'
};
const NEW_FILES = Object.values(MODULES).concat([
  'tests/e02cUserKnowledgeContract.test.js',
  'tests/e02cUserKnowledgeTransitions.test.js',
  'tests/e02cUserKnowledgeStore.test.js',
  'tests/e02cUserKnowledgeStatic.test.js',
  'tests/fixtures/userKnowledgeInMemoryPort.js',
  'tests/fixtures/userKnowledgePortConformance.js'
]);
const GLOBALS = ['UserKnowledgeContract', 'UserKnowledgeTransitions', 'UserKnowledgeStore'];
const FILE_TOKENS = ['userKnowledgeContract', 'userKnowledgeTransitions', 'userKnowledgeStore'];

function walk(dir, exts) {
  const out = [];
  const go = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((ent) => {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) return;
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) go(p); else if (exts.some((x) => p.endsWith(x))) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  });
  go(path.join(ROOT, dir));
  return out;
}
// Extracts `function name(...) { ... }` by brace matching.
function functionBody(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'function ' + name + ' not found');
  let i = src.indexOf('{', start);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced ' + name);
}

// ═══════════════════ AC-34: no content taxonomy / causal field in the modules ═══════════════════
test('AC-34: the three modules contain no domain vocabulary (English and Hebrew) and no content, causal or truth field', () => {
  const DOMAIN = ['weather', 'sleep', 'food', 'meal', 'calendar', 'schedule', 'location', 'health', 'heart', 'device', 'travel', 'pasta', 'spaghetti', 'training', 'workout', 'nutrition', 'exercise', 'diet', 'injury', 'running', 'protein', 'calorie'];
  const HEBREW = ['שינה', 'אוכל', 'אימון', 'ארוחה', 'מזג', 'נסיעה', 'פסטה', 'בריאות', 'לוח'];
  Object.values(MODULES).forEach((f) => {
    const src = read(f);
    DOMAIN.forEach((w) => assert.equal(new RegExp('\\b' + w, 'i').test(src), false, f + ' contains ' + w));
    HEBREW.forEach((w) => assert.equal(src.indexOf(w), -1, f + ' contains ' + w));
    const code = codeOnly(src);
    ['category', 'domain', 'topic', 'claimType', 'causal', 'causes', 'isTrue', 'verified', 'truth', 'ontology', 'synonym'].forEach((t) => {
      assert.equal(new RegExp('\\b' + t, 'i').test(code), false, f + ' code contains ' + t);
    });
  });
});

// ═══════════════════ AC-36: prose is stored, never interpreted ═══════════════════
test('AC-36: no production module other than userKnowledgeContract.js contains the token relationDescription', () => {
  const hits = walk('js', ['.js']).filter((f) => read(f).indexOf('relationDescription') !== -1);
  assert.deepEqual(hits, [MODULES.contract]);
  const views = ['epistemicOrigin', 'isExplicit', 'isContextual', 'isExpired', 'evidenceStanding', 'isUsableKnowledge', 'resolveConceptRoot', 'effectiveLabels'];
  const src = read(MODULES.contract);
  views.forEach((v) => {
    const body = functionBody(src, v);
    assert.equal(body.indexOf('relationDescription'), -1, v);
    assert.equal(/\.labels\b/.test(body) && v !== 'effectiveLabels', false, v + ' reads labels');
  });
});

// ═══════════════════ AC-37 / AC-45: isolation — nothing existing references the new modules ═══════════════════
test('AC-37/AC-45: no existing production, shell, server or rules file references the new modules; Safety/intake/pipeline modules in particular', () => {
  const candidates = walk('js', ['.js']).concat(walk('functions', ['.js'])).concat(['index.html', 'sw.js', 'firestore.rules']);
  const outside = candidates.filter((f) => NEW_FILES.indexOf(f) === -1);
  assert.ok(outside.length > 50, 'scan is functioning');
  outside.forEach((f) => {
    const src = read(f);
    GLOBALS.concat(FILE_TOKENS).forEach((t) => assert.equal(src.indexOf(t), -1, f + ' references ' + t));
  });
  const named = ['safetyLayer.js', 'safetyIntegrationPort.js', 'safetyContextInterpreter.js', 'userSafetyProvenanceInterpreter.js', 'riskCharacteristicIntakeGate.js', 'riskCharacteristicInterpreter.js', 'riskCharacteristicValidator.js', 'safetyDisclosureIntakeGate.js', 'preferenceIntakeGate.js', 'memoryLayer.js', 'internalPipelineOrchestrator.js', 'decisionFormation.js', 'contextComposer.js', 'contextRelevancePlanner.js', 'generalReasoningCapability.js', 'semanticContextDiscoveryInterpreter.js'];
  named.forEach((n) => assert.ok(outside.indexOf('js/coachDecisionSystem/' + n) !== -1, n + ' was scanned'));
});

test('AC-45: the new modules are Node-only in E.0.2c — not script-tagged, not cached, not configured by the shell', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const app = read('js/app.js');
  FILE_TOKENS.forEach((t) => {
    assert.equal(html.indexOf(t), -1);
    assert.equal(sw.indexOf(t), -1);
    assert.equal(app.indexOf(t), -1);
  });
});

// ═══════════════════ AC-40 … AC-43: Application-Ready, deterministic, zero model calls ═══════════════════
const EXPORT_LINE = /^\s*if \(typeof window !== 'undefined'\) \{ window\.[A-Za-z]+ = API; \}\s*$/;
const UMD_IMPORT = /^\s*: window\.[A-Za-z]+;\s*$/;

test('AC-40: C1 §14.3 — no browser, storage, network, vendor or shell token; each module loads under Node', () => {
  Object.values(MODULES).forEach((f) => {
    const code = codeOnly(read(f)).split('\n').filter((l) => !EXPORT_LINE.test(l) && !UMD_IMPORT.test(l)).join('\n');
    ['document.', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator.', 'fetch(', 'serviceWorker', 'window.', 'db.', 'currentUser', 'XMLHttpRequest', 'require(\'firebase', 'firestore'].forEach((t) => {
      assert.equal(code.toLowerCase().indexOf(t.toLowerCase()), -1, f + ' contains ' + t);
    });
    assert.equal(/firebase/i.test(read(f)), false, f + ' mentions a vendor');
    assert.doesNotThrow(() => require(path.join(ROOT, f)));
  });
});

test('AC-41: dependencies are exactly §08 — contract: none; transitions: contract; store: contract + transitions', () => {
  const deps = (f) => {
    const src = codeOnly(read(f));
    return {
      requires: (src.match(/require\('([^']+)'\)/g) || []).map((m) => m.slice(9, -2)),
      globals: (src.match(/: window\.([A-Za-z]+);/g) || []).map((m) => m.slice(9, -1))
    };
  };
  assert.deepEqual(deps(MODULES.contract), { requires: [], globals: [] });
  assert.deepEqual(deps(MODULES.transitions), { requires: ['./userKnowledgeContract.js'], globals: ['UserKnowledgeContract'] });
  assert.deepEqual(deps(MODULES.store), { requires: ['./userKnowledgeContract.js', './userKnowledgeTransitions.js'], globals: ['UserKnowledgeContract', 'UserKnowledgeTransitions'] });
  Object.values(MODULES).forEach((f) => {
    const src = read(f);
    ['memory.js', 'stateAccess', 'app.js', 'functions/', 'repositories', 'safetyLayer', 'safetyContext', 'safetyIntegration', 'userSafety', 'SafetyLayer', 'riskCharacteristic', 'IntakeGate', 'memoryLayer', 'contextComposer', 'contextRelevancePlanner', 'eligibilityPolicy', 'consentScopeRegistry', 'typedMemoryServerWrite'].forEach((t) => {
      assert.equal(src.indexOf(t), -1, f + ' references ' + t);
    });
  });
});

test('AC-42: no host clock, randomness or crypto in the three modules (time and ids are injected)', () => {
  Object.values(MODULES).forEach((f) => {
    const src = read(f);
    ['Date.now', 'new Date', 'Date(', 'Math.random', 'crypto', 'performance.now', 'process.hrtime', 'setTimeout', 'setInterval'].forEach((t) => assert.equal(src.indexOf(t), -1, f + ' contains ' + t));
  });
});

test('AC-43: zero model calls — no callClaude, model request shape or prompt text in the three modules', () => {
  Object.values(MODULES).forEach((f) => {
    const src = read(f);
    ['callClaude', 'max_tokens', 'messages', 'anthropic', 'claude', 'prompt', 'You are', 'role: \'user\'', 'ModelResponseEnvelope'].forEach((t) => assert.equal(src.toLowerCase().indexOf(t.toLowerCase()), -1, f + ' contains ' + t));
    assert.equal(/callClaude:\s*null/.test(src), false, 'wiring test 37 would require configuration');
  });
});

// ═══════════════════ AC-59: the narrow INV-UC-S SERVER exception is structurally exclusive ═══════════════════
test('AC-59 (static): only planCorrectInferredKnowledge / correctInferredKnowledge can emit user_stated while the writer is SERVER; nothing reassigns a source', () => {
  const t = codeOnly(read(MODULES.transitions));
  // buildRecord is the single constructor and holds the single INV-UC-S guard.
  const buildRecord = functionBody(t, 'buildRecord');
  assert.match(buildRecord, /draft\.source === 'user_stated' && writer === 'SERVER' && opts\.viaGovernedCorrection !== true/);
  // The governed flag is only ever derived from buildSupersession's `governed` argument or set false.
  const flagAssignments = t.match(/viaGovernedCorrection:\s*[^,\n}]+/g);
  assert.deepEqual(flagAssignments.map((s) => s.replace(/\s+/g, ' ')), ['viaGovernedCorrection: false', 'viaGovernedCorrection: governed === true']);
  // buildSupersession(..., true) is called only from planCorrectInferredKnowledge.
  const trueCalls = t.match(/buildSupersession\([^)]*,\s*true\)/g) || [];
  assert.equal(trueCalls.length, 1);
  assert.ok(functionBody(t, 'planCorrectInferredKnowledge').indexOf(trueCalls[0]) !== -1);
  assert.match(functionBody(t, 'planSupersede'), /buildSupersession\([^)]*,\s*false\)/);
  assert.match(functionBody(t, 'planCorrectInferredKnowledge'), /if \(writer !== 'SERVER'\) return fail\('AUTHORITY'/);
  // Store: the change-set authority admits SERVER user_stated creation for exactly one operation name,
  // which only the correctInferredKnowledge operation passes.
  const s = codeOnly(read(MODULES.store));
  assert.match(functionBody(s, 'authorizeChangeSet'), /if \(operation !== 'correctInferredKnowledge'\) return 'AUTHORITY';/);
  assert.equal((s.match(/supersessionOp\('correctInferredKnowledge'/g) || []).length, 1);
  assert.equal((s.match(/'correctInferredKnowledge'/g) || []).length >= 1, true);
  // Source immutability: no module assigns to a record's source.
  Object.values(MODULES).forEach((f) => assert.equal(/\.source\s*=[^=]/.test(codeOnly(read(f))), false, f + ' assigns .source'));
});

// ═══════════════════ AC-62 (static): authority never reads userId ═══════════════════
test('AC-62 (static): the authority decision reads only the writer and the persisted source, never userId', () => {
  const s = codeOnly(read(MODULES.store));
  ['sourceWritableBy', 'authorizeChangeSet', 'preAuthorizeSource', 'resolvePredecessorAuthority'].forEach((fn) => {
    assert.equal(functionBody(s, fn).indexOf('userId'), -1, fn + ' reads userId');
  });
  // userId is accepted only from configure(); no operation request lists it.
  const checkRequestCalls = s.match(/checkRequest\([^;]+\)/g) || [];
  assert.ok(checkRequestCalls.length >= 10);
  checkRequestCalls.forEach((c) => assert.equal(c.indexOf("'userId'"), -1, c));
});

// ═══════════════════ C4 isolation ═══════════════════
test('C4 isolation: the C4 server capability is unreferenced and its own contract is unchanged (CD-C4-05 intact)', async () => {
  const c4Src = read('functions/typedMemoryServerWrite.js');
  GLOBALS.concat(FILE_TOKENS).forEach((t) => assert.equal(c4Src.indexOf(t), -1));
  const C4 = require(path.join(ROOT, 'functions/typedMemoryServerWrite.js'));
  assert.deepEqual(C4.SERVER_SOURCES, ['inferred_event', 'inferred_pattern', 'coach_generated']);
  assert.deepEqual(C4.MEMORY_TYPES, ['fact', 'habit', 'pattern', 'preference', 'coach_note', 'conversation_memory', 'recurring_meal']);
  const r = await C4.write({ uid: 'u1', idempotencyKey: 'k', type: 'fact', source: 'user_stated', payload: {} });
  assert.equal(r.status, 'REJECTED', 'C4 still never writes client-owned sources');
});
