// MRE-001 — per-site plain/fenced equivalence, rejected-envelope preservation, Safety positive
// controls and request-body zero drift (docs/specs/MRE_001_SPEC_v1.0.md §14, §16, §17).
// makeSiteCatalog()/makeEnvelopeMatrix() below are byte-identical to the scratch catalog used to
// record the pre-implementation baselines BEFORE any MRE-001 production change; PRE_MRE_DIGESTS
// and PRE_MRE_REQUEST_BODY_SHA256 were recorded there (sha256 of JSON.stringify(result), 16 hex).
// Run with: node --test tests/mre001InterpreterEquivalence.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const req = (p) => require(path.join(__dirname, '..', p));
const digest = (v) => crypto.createHash('sha256').update(String(JSON.stringify(v))).digest('hex').slice(0, 16);

function makeSiteCatalog(req) {
  const F = '```';
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

  const raw = (text) => ({ content: [{ text: text }] });
  const J = (o) => JSON.stringify(o);
  const tuEntry = (o) => Object.assign({ id: 't1', affirmativeRequestPresent: false, domain: null, topic: null, currentStateStatementPresent: false, currentStateStatementText: null, negativeControlPresent: false, desireOnlyPresent: false, personalDisclosurePresent: false, personalDisclosureCategory: null, personalDisclosureText: null }, o);
  const proposal = (o) => Object.assign({ outcome: 'ACTION_PROPOSED', action: 'Take an easy 20-minute walk today.', rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' }, o);
  async function viaStub(M, text, fn) {
    M.configure({ callClaude: async () => raw(text) });
    try { return await fn(); } finally { M.configure({ callClaude: null }); }
  }

  // Each site: invoke(text) -> the site's final result for a model response whose content[0].text is `text`.
  return [
    { id: 'S1', safety: false, invoke: async (t) => TU._internal.parseAndValidate(raw(t), ['t1']),
      payloads: [J({ results: [tuEntry({ affirmativeRequestPresent: true, domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', currentStateStatementPresent: true, currentStateStatementText: 'ישנתי 5 שעות' })] }), J({ results: [tuEntry({})] })] },
    { id: 'S2', safety: false, invoke: async (t) => TU._internal.validateOpenUnderstanding(t, 't1', 'I am in Mykonos and want to run', undefined),
      payloads: [J({ id: 't1', summary: 'The user is in Mykonos and wants to run.', mentions: ['Mykonos'] }), 'null'] },
    { id: 'S3', safety: false, invoke: async (t) => EPSI._internal.parseAndValidate(raw(t), ['p1'], { p1: 'I really love running' }),
      payloads: [J({ results: [{ id: 'p1', eligible: true, preferenceClass: 'ACTIVITY_SENTIMENT', polarity: 'POSITIVE', target: 'running', ineligibleReason: null }] }), J({ results: [{ id: 'p1', eligible: false, preferenceClass: null, polarity: null, target: null, ineligibleReason: 'NO_EXPLICIT_PREFERENCE' }] })] },
    { id: 'S4', safety: false, invoke: async (t) => ER._internal.parseAndValidate(raw(t), ['r1']),
      payloads: [J({ results: [{ id: 'r1', requestClassification: 'CLASSIFIED_EXPLICIT_REQUEST', controlIntent: 'SUPPRESS_ORDINARY_INITIATIVE', scopeStatus: 'UNRESOLVED', domain: null, topic: null }] }), J({ results: [{ id: 'r1', requestClassification: 'INELIGIBLE_OR_NOT_CLASSIFIED', controlIntent: null, scopeStatus: null, domain: null, topic: null }] })] },
    { id: 'S5', safety: false, invoke: async (t) => RS._internal.parseAndValidate(raw(t), ['r2']),
      payloads: [J({ results: [{ id: 'r2', verdict: 'CLASSIFIED_CURRENT_STATE' }] }), J({ results: [{ id: 'r2', verdict: 'INELIGIBLE_OR_NOT_CLASSIFIED' }] })] },
    { id: 'S6', safety: false, invoke: async (t) => AP._internal.parseAndValidate(raw(t), ['r3'], { r3: 'I really love running' }),
      payloads: [J({ results: [{ id: 'r3', sentimentClassification: 'POSITIVE_SENTIMENT', activityText: 'running' }] }), J({ results: [{ id: 'r3', sentimentClassification: 'NOT_PREFERENCE_OR_NOT_CLASSIFIED', activityText: null }] })] },
    { id: 'S7', safety: false, invoke: async (t) => AO._internal.parseAndValidate(raw(t), ['r4'], { r4: 'please never suggest swimming' }),
      payloads: [J({ results: [{ id: 'r4', oppositionClassification: 'ACTIVITY_OPPOSITION_STATED', opposedActivityText: 'swimming' }] }), J({ results: [{ id: 'r4', oppositionClassification: 'NOT_OPPOSITION_OR_NOT_CLASSIFIED', opposedActivityText: null }] })] },
    { id: 'S8', safety: false, invoke: async (t) => SIT._internal.parseAndValidate(raw(t), ['r5']),
      payloads: [J({ results: [{ id: 'r5', verdict: 'CLASSIFIED_CURRENT_STATE' }] }), J({ results: [{ id: 'r5', verdict: 'INELIGIBLE_OR_NOT_CLASSIFIED' }] })] },
    { id: 'S9', safety: true, invoke: async (t) => SC._internal.parseAndValidate(raw(t), ['s1'], { s1: 'my doctor said no running for two weeks' }),
      payloads: [J({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'running', statedDurationText: 'two weeks' }] }), J({ results: [{ id: 's1', restrictionClassification: 'NOT_RESTRICTION_OR_NOT_CLASSIFIED', restrictedActivityText: null, statedDurationText: null }] })] },
    { id: 'S10', safety: true, invoke: async (t) => SC._internal.parseAndValidateCorrection(raw(t), 'c1'),
      payloads: [J({ results: [{ id: 'c1', correctionConfirmed: true }] }), J({ results: [{ id: 'c1', correctionConfirmed: false }] })] },
    { id: 'S11', safety: true, invoke: async (t) => USP._internal.parseAndValidate(raw(t), ['u1'], { u1: 'my doctor said no running' }),
      payloads: [J({ results: [{ id: 'u1', namedSourceClassification: 'NAMED_SOURCE_STATED', statedSourceText: 'my doctor' }] }), J({ results: [{ id: 'u1', namedSourceClassification: 'NO_NAMED_SOURCE_OR_NOT_CLASSIFIED', statedSourceText: null }] })] },
    { id: 'S12', safety: true, invoke: async (t) => RCF._internal.parseCandidateContentResponse(raw(t), 'go for an easy run today'),
      payloads: [J({ tags: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'easy run' }] }), J({ tags: [] })] },
    { id: 'S13', safety: true, invoke: async (t) => RCF._internal.parseDurableConstraintResponse(raw(t), 'I am allergic to peanuts'),
      payloads: [J({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'allergic to peanuts' }] }), J({ candidates: [] })] },
    { id: 'S14', safety: true, invoke: async (t) => RCF._internal.parseCorrectionResponse(raw(t), 'k1'),
      payloads: [J({ results: [{ id: 'k1', correctionConfirmed: true }] }), J({ results: [{ id: 'k1', correctionConfirmed: false }] })] },
    { id: 'S15', safety: true, invoke: async (t) => RCF._internal.parseCandidateConflictResponse(raw(t)),
      payloads: [J({ relation: 'CONFIRMED_CONFLICT' }), J({ relation: 'CONFIRMED_NO_CONFLICT' })] },
    { id: 'S16', safety: false, invoke: async (t) => viaStub(TRR, t, () => TRR.propose({})),
      payloads: [J(proposal({ actionCategory: 'NON_ACTIVITY_COACHING_ACTION', activityReference: null })), J({ outcome: 'NO_VIABLE_PROPOSAL', action: null, actionCategory: null, activityReference: null, rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' })] },
    { id: 'S17', safety: false, invoke: async (t) => viaStub(GR, t, () => GR.reason({}, {})),
      payloads: [J(proposal({})), J({ outcome: 'NO_VIABLE_PROPOSAL', action: null, rationale: 'r', evidenceBasis: 'e', expectedValue: 'v', uncertainty: 'u' })] }
  ];
}

// MRE-001 §17 matrix, instantiated for payload P. expect: 'accept' (-> P) or 'reject' (-> input unchanged).
function makeEnvelopeMatrix(P) {
  const F = '```';
  return [
    { n: 1, label: 'plain JSON', input: P, expect: 'reject' },
    { n: 2, label: 'json fence', input: F + 'json\n' + P + '\n' + F, expect: 'accept' },
    { n: 3, label: 'JSON fence', input: F + 'JSON\n' + P + '\n' + F, expect: 'accept' },
    { n: 4, label: 'Json fence', input: F + 'Json\n' + P + '\n' + F, expect: 'accept' },
    { n: 5, label: 'bare fence', input: F + '\n' + P + '\n' + F, expect: 'accept' },
    { n: 6, label: 'CRLF', input: F + 'json\r\n' + P + '\r\n' + F, expect: 'accept' },
    { n: 7, label: 'surrounding whitespace', input: '  \n ' + F + 'json\n' + P + '\n' + F + '  \n ', expect: 'accept' },
    { n: 8, label: 'trailing spaces after marker', input: F + 'json   \n' + P + '\n' + F, expect: 'accept' },
    { n: 9, label: 'indented closer', input: F + 'json\n' + P + '\n  ' + F, expect: 'accept' },
    { n: 10, label: 'prose before', input: 'Here you go:\n' + F + 'json\n' + P + '\n' + F, expect: 'reject' },
    { n: 11, label: 'prose after', input: F + 'json\n' + P + '\n' + F + '\nHope this helps', expect: 'reject' },
    { n: 12, label: 'two blocks', input: F + 'json\n' + P + '\n' + F + '\n' + F + 'json\n' + P + '\n' + F, expect: 'reject' },
    { n: 13, label: 'nested fence', input: F + 'json\n' + F + 'json\n' + P + '\n' + F + '\n' + F, expect: 'reject' },
    { n: 14, label: 'four backticks', input: '`' + F + 'json\n' + P + '\n`' + F, expect: 'reject' },
    { n: 15, label: 'tilde fence', input: '~~~json\n' + P + '\n~~~', expect: 'reject' },
    { n: 16, label: 'js marker', input: F + 'js\n' + P + '\n' + F, expect: 'reject' },
    { n: 16.1, label: 'javascript marker', input: F + 'javascript\n' + P + '\n' + F, expect: 'reject' },
    { n: 16.2, label: 'jsonc marker', input: F + 'jsonc\n' + P + '\n' + F, expect: 'reject' },
    { n: 17, label: 'space before marker', input: F + ' json\n' + P + '\n' + F, expect: 'reject' },
    { n: 18, label: 'no newline after opener', input: F + 'json' + P + F, expect: 'reject' },
    { n: 18.1, label: 'payload on opener line', input: F + 'json ' + P + '\n' + F, expect: 'reject' },
    { n: 19, label: 'payload on closer line', input: F + 'json\n' + P + F, expect: 'reject' },
    { n: 20, label: 'truncated closer (two backticks)', input: F + 'json\n' + P + '\n``', expect: 'reject' },
    { n: 20.1, label: 'missing closer', input: F + 'json\n' + P, expect: 'reject' },
    { n: 21, label: 'empty inner', input: F + 'json\n' + F, expect: 'reject' },
    { n: 21.1, label: 'whitespace-only inner', input: F + 'json\n   \n' + F, expect: 'reject' },
    { n: 24, label: 'leading BOM', input: '﻿' + F + 'json\n' + P + '\n' + F, expect: 'reject' }
  ];
}

const PRE_MRE_DIGESTS = {"S1":{"1":"a6dcd05f2e179e1e","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"a6dcd05f2e179e1e","plainNegative":"1a94db24bceb85fe"},"S2":{"1":"6351e07c9418c517","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"6351e07c9418c517","plainNegative":"74234e98afe7498f"},"S3":{"1":"4cbac61b5db77eed","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"4cbac61b5db77eed","plainNegative":"c4de660038ecb07f"},"S4":{"1":"ebe97ffe272148bf","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"ebe97ffe272148bf","plainNegative":"f59a99ef8a4bb788"},"S5":{"1":"5755bab2b3d38340","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"5755bab2b3d38340","plainNegative":"44136fa355b3678a"},"S6":{"1":"1c1439d5e25e41df","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"1c1439d5e25e41df","plainNegative":"ee0884dc624d4a3d"},"S7":{"1":"c6ee2202fefd835b","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"c6ee2202fefd835b","plainNegative":"7973400614a49e0f"},"S8":{"1":"4543fc71b4f9fb24","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"4543fc71b4f9fb24","plainNegative":"44136fa355b3678a"},"S9":{"1":"45b19ab06ed8ed84","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"45b19ab06ed8ed84","plainNegative":"c9f1116ea2b1bd73"},"S10":{"1":"b5bea41b6c623f7c","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"b5bea41b6c623f7c","plainNegative":"fcbcf165908dd18a"},"S11":{"1":"1ae9d0822122bac4","2":"44136fa355b3678a","3":"44136fa355b3678a","4":"44136fa355b3678a","5":"44136fa355b3678a","6":"44136fa355b3678a","7":"44136fa355b3678a","8":"44136fa355b3678a","9":"44136fa355b3678a","10":"44136fa355b3678a","11":"44136fa355b3678a","12":"44136fa355b3678a","13":"44136fa355b3678a","14":"44136fa355b3678a","15":"44136fa355b3678a","16":"44136fa355b3678a","17":"44136fa355b3678a","18":"44136fa355b3678a","19":"44136fa355b3678a","20":"44136fa355b3678a","21":"44136fa355b3678a","22":"44136fa355b3678a","23":"44136fa355b3678a","24":"44136fa355b3678a","16.1":"44136fa355b3678a","16.2":"44136fa355b3678a","18.1":"44136fa355b3678a","20.1":"44136fa355b3678a","21.1":"44136fa355b3678a","plainMalformed":"44136fa355b3678a","plainWrongSchema":"44136fa355b3678a","plainPositive":"1ae9d0822122bac4","plainNegative":"b39d269889161156"},"S12":{"1":"5884111c957a8428","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"5884111c957a8428","plainNegative":"4f53cda18c2baa0c"},"S13":{"1":"61d2dea44b50d027","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"61d2dea44b50d027","plainNegative":"4f53cda18c2baa0c"},"S14":{"1":"b5bea41b6c623f7c","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"b5bea41b6c623f7c","plainNegative":"fcbcf165908dd18a"},"S15":{"1":"23626e14176acebb","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"23626e14176acebb","plainNegative":"bbcbcde79d2d9814"},"S16":{"1":"c038eeea39bed03b","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"c038eeea39bed03b","plainNegative":"3f84831a1f411c91"},"S17":{"1":"82fe20db308bc4ef","2":"74234e98afe7498f","3":"74234e98afe7498f","4":"74234e98afe7498f","5":"74234e98afe7498f","6":"74234e98afe7498f","7":"74234e98afe7498f","8":"74234e98afe7498f","9":"74234e98afe7498f","10":"74234e98afe7498f","11":"74234e98afe7498f","12":"74234e98afe7498f","13":"74234e98afe7498f","14":"74234e98afe7498f","15":"74234e98afe7498f","16":"74234e98afe7498f","17":"74234e98afe7498f","18":"74234e98afe7498f","19":"74234e98afe7498f","20":"74234e98afe7498f","21":"74234e98afe7498f","22":"74234e98afe7498f","23":"74234e98afe7498f","24":"74234e98afe7498f","16.1":"74234e98afe7498f","16.2":"74234e98afe7498f","18.1":"74234e98afe7498f","20.1":"74234e98afe7498f","21.1":"74234e98afe7498f","plainMalformed":"74234e98afe7498f","plainWrongSchema":"74234e98afe7498f","plainPositive":"82fe20db308bc4ef","plainNegative":"8a2279147ddcfe20"}};
const PRE_MRE_REQUEST_BODY_SHA256 = {
  "TU.understand": "c2a5a92ca3d9abee7d5ccdb83630acadde296c729b7b1c3d1b41592519ad9c85",
  "EPSI.classify": "8b2bf3a2edfa8dc1bf775bcd217bdd2250eb0c387521991b07dfc76a3025c431",
  "ER.classify": "98d05176d7372bd7468d2bc80ed44ed6417f3313c4c520a9689504b8991e8b62",
  "RS.classify": "33290f82a9c39a761e07e4c3da6a15e4fa427042e90131700a5b9f06cacf1e59",
  "AP.classify": "9ae76086bc02a67e9128a4bc4b51c847f25aa31742249d58117cf4f3ad92882b",
  "AO.classify": "095ebab4e8ad45fb6f23b47bdfa042f274b2e377156acd9237d338da94cca804",
  "SIT.classify": "482f85c1df6a2b9d9dba04a370c443f85b77f0cbde28364463bb57e4d118bcdf",
  "SC.classify": "60c724e68ec147a747ec95c92bc65f04d6ddb79cf71a7ef9391825b9bccc8ed6",
  "SC.classifyWithStatus": "60c724e68ec147a747ec95c92bc65f04d6ddb79cf71a7ef9391825b9bccc8ed6",
  "SC.classifyCorrectionWithStatus": "95356275d2700dc57b86877376be53dbd640398e9ac7ab3cb71fcdbe1177a748",
  "USP.classify": "0510cdbcc7563240407fc865d5a60da8a1906d5f1ba7a3757b9b561b9585c8a3",
  "RCF.classifyCandidateContent": "ac232d34dd5162fbf27dc21b77b33ab7e6c87ef4ded31cc6eba5b6455b633031",
  "RCF.classifyTurnForDurableConstraint": "0e240c1ace9656ef2b120426998f9d605c8481a1bdf75a237fe488d58f6ba7e7",
  "RCF.classifyCorrectionWithStatus": "62c7d89cdee1b1e7c804d8c6f6cf3fb5c2348bea06bce8ef55150710dbfec2e4",
  "RCF.classifyCandidateConflictWithFact": "b9e22a57179f6325a9bc0204371e4d34a2d2ce6158ffbe655c81637a5a602adb",
  "TRR.propose": "7e017d49985f6b8ef0961be809aa14b223d1e1a0d56669706835572c2b31d114",
  "GR.reason": "96891c02f166af2bd2f9ef7a79de81a37cfecfae393be957c63ed197ed754e41"
};

const SITES = makeSiteCatalog(req);
const FENCE = '```';
const ACCEPT_FORMS = [
  (p) => FENCE + 'json\n' + p + '\n' + FENCE,
  (p) => FENCE + 'JSON\n' + p + '\n' + FENCE,
  (p) => FENCE + '\n' + p + '\n' + FENCE,
  (p) => FENCE + 'json\r\n' + p + '\r\n' + FENCE
];

test('catalog covers exactly the 17 MRE-001 sites S1–S17 (7 Safety sites)', () => {
  assert.deepEqual(SITES.map((s) => s.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17']);
  assert.deepEqual(SITES.filter((s) => s.safety).map((s) => s.id), ['S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15']);
});

test('plain behavior is unchanged at every site: positive, negative, plain-malformed and plain-wrong-schema results equal the pre-MRE-001 pins', async () => {
  for (const s of SITES) {
    const pins = PRE_MRE_DIGESTS[s.id];
    assert.equal(digest(await s.invoke(s.payloads[0])), pins.plainPositive, s.id + ' positive');
    assert.equal(digest(await s.invoke(s.payloads[1])), pins.plainNegative, s.id + ' negative');
    assert.equal(digest(await s.invoke('{"a":1,}')), pins.plainMalformed, s.id + ' malformed');
    assert.equal(digest(await s.invoke('{"unexpected":true}')), pins.plainWrongSchema, s.id + ' wrong schema');
    assert.notEqual(pins.plainPositive, pins.plainMalformed, s.id + ' sanity: the positive fixture is a real success');
  }
});

test('E-1: at every site, every accepted envelope form of both valid fixtures gives a result deep-equal to the plain payload', async () => {
  for (const s of SITES) {
    for (const payload of s.payloads) {
      const plain = await s.invoke(payload);
      for (const form of ACCEPT_FORMS) {
        assert.deepEqual(await s.invoke(form(payload)), plain, s.id + ' ' + JSON.stringify(form(payload)).slice(0, 40));
      }
      for (const row of makeEnvelopeMatrix(payload).filter((r) => r.expect === 'accept')) {
        assert.deepEqual(await s.invoke(row.input), plain, s.id + ' row ' + row.n + ' (' + row.label + ')');
      }
    }
  }
});

test('E-1 (before/after): every accepted form previously failed exactly like malformed text — MRE-001 changes only those rows', async () => {
  for (const s of SITES) {
    const pins = PRE_MRE_DIGESTS[s.id];
    for (const row of makeEnvelopeMatrix(s.payloads[0]).filter((r) => r.expect === 'accept')) {
      assert.equal(pins[row.n], pins.plainMalformed, s.id + ' row ' + row.n + ' failed before MRE-001');
      assert.equal(digest(await s.invoke(row.input)), pins.plainPositive, s.id + ' row ' + row.n + ' now equals plain');
    }
  }
});

test('E-2: every rejected envelope form gives exactly the pre-MRE-001 result at every site (no new tolerance)', async () => {
  for (const s of SITES) {
    const pins = PRE_MRE_DIGESTS[s.id];
    for (const row of makeEnvelopeMatrix(s.payloads[0]).filter((r) => r.expect === 'reject')) {
      assert.equal(digest(await s.invoke(row.input)), pins[row.n], s.id + ' row ' + row.n + ' (' + row.label + ')');
    }
  }
});

test('E-3 / E-4: malformed JSON and wrong-schema JSON inside a valid envelope fail exactly like the same plain text', async () => {
  for (const s of SITES) {
    const pins = PRE_MRE_DIGESTS[s.id];
    assert.equal(digest(await s.invoke(FENCE + 'json\n{"a":1,}\n' + FENCE)), pins.plainMalformed, s.id + ' E-3');
    assert.equal(digest(await s.invoke(FENCE + 'json\n{"unexpected":true}\n' + FENCE)), pins.plainWrongSchema, s.id + ' E-4');
  }
});

test('E-5: the real observed pretty-printed fenced Turn Understanding response is accepted and equals its plain payload (S1)', async () => {
  const s1 = SITES[0];
  const obj = JSON.parse(s1.payloads[0]);
  const pretty = JSON.stringify(obj, null, 2);
  const observed = FENCE + 'json\n' + pretty + '\n' + FENCE;
  const result = await s1.invoke(observed);
  assert.deepEqual(result, await s1.invoke(s1.payloads[0]));
  assert.equal(result.t1.affirmativeRequest.present, true);
});

// ═══ Safety positive controls P-1 … P-5 ═══
const StateAccess = req('js/stateAccess.js');
const Consumer = req('js/derivedIntelligenceConsumer.js');
const MemoryLayer = req('js/coachDecisionSystem/memoryLayer.js');
const SafetyLayer = req('js/coachDecisionSystem/safetyLayer.js');
const SafetyContextInterpreter = req('js/coachDecisionSystem/safetyContextInterpreter.js');
const UserSafetyProvenanceInterpreter = req('js/coachDecisionSystem/userSafetyProvenanceInterpreter.js');
const RiskCharacteristicInterpreter = req('js/coachDecisionSystem/riskCharacteristicInterpreter.js');
const RiskCharacteristicIntakeGate = req('js/coachDecisionSystem/riskCharacteristicIntakeGate.js');

const RESTRICTION_TEXT = 'My doctor told me no running for a month.';
const RUNNING = { actionCategory: 'PHYSICAL_ACTIVITY', actionIdentity: { activity: 'RUNNING' } };
function configureSafetyMemory() {
  StateAccess.configure({
    getUserProfile: () => ({ coachEvents: [], memoryConsent: { granted: true } }),
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === 1,
    fetchUserStatedMemory: async () => [{ _id: 'mem-1', type: 'fact', payload: { text: RESTRICTION_TEXT }, confidence: 1, source: 'user_stated', status: 'active', updated_at: 100 }]
  });
  Consumer.configure({
    isSessionCurrent: (gen) => gen === 1,
    readHabitSnapshot: async () => ({ habits: [], habitsMeta: { lastRun: '2026-07-01', version: 1 } }),
    readPatternSnapshot: async () => ({ patterns: [], patternsMeta: { lastRun: '2026-07-01', version: 1, sourceFingerprint: 'x' } }),
    getLocalDate: () => '2026-07-29',
    getWeekday: () => 3
  });
}
const SC_PAYLOAD = JSON.stringify({ results: [{ id: 'mem-1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'running', statedDurationText: 'for a month' }] });
const USP_PAYLOAD = JSON.stringify({ results: [{ id: 'mem-1', namedSourceClassification: 'NAMED_SOURCE_STATED', statedSourceText: 'My doctor' }] });
async function assembleWith(scText, uspText) {
  configureSafetyMemory();
  SafetyContextInterpreter.configure({ callClaude: async () => ({ content: [{ text: scText }] }) });
  UserSafetyProvenanceInterpreter.configure({ callClaude: async () => ({ content: [{ text: uspText }] }) });
  try {
    const pc = await MemoryLayer.assembleContext({ userId: 'user-1', sessionGeneration: 1, runId: 'mre-p' });
    return {
      userSafetyContext: pc.userSafetyContext,
      userSafetyProvenance: pc.userSafetyProvenance,
      availability: [pc.availability.userSafetyContext, pc.availability.userSafetyProvenance],
      match: SafetyLayer.matchCanonicalSafetyRules(RUNNING, null, pc)
    };
  } finally {
    SafetyContextInterpreter.configure({ callClaude: null });
    UserSafetyProvenanceInterpreter.configure({ callClaude: null });
  }
}

test('P-1: plain restriction and provenance output populate userSafetyContext/userSafetyProvenance and the canonical RUNNING rule matches', async () => {
  const plain = await assembleWith(SC_PAYLOAD, USP_PAYLOAD);
  assert.equal(plain.userSafetyContext.items.length, 1);
  assert.equal(plain.userSafetyContext.items[0].restrictedActivityText, 'running');
  assert.equal(plain.userSafetyProvenance.items.length, 1);
  assert.ok(Array.isArray(plain.match) && plain.match.length > 0, 'the canonical Safety rule matches the plain restriction');
});

test('P-2: the exact fenced equivalents produce deep-equal Safety context and a deep-equal canonical rule match', async () => {
  const plain = await assembleWith(SC_PAYLOAD, USP_PAYLOAD);
  for (const form of ACCEPT_FORMS) {
    const fenced = await assembleWith(form(SC_PAYLOAD), form(USP_PAYLOAD));
    assert.deepEqual(fenced, plain);
  }
});

test('P-3: a rejected envelope of the same Safety payload gets no new tolerance — identical to non-JSON output (the pre-existing, separately-recorded fail-open state, unchanged)', async () => {
  const nonJson = await assembleWith('not json at all', 'not json at all');
  for (const row of makeEnvelopeMatrix(SC_PAYLOAD).filter((r) => r.expect === 'reject' && r.n !== 1)) {
    const uspRow = makeEnvelopeMatrix(USP_PAYLOAD).find((r) => r.n === row.n);
    assert.deepEqual(await assembleWith(row.input, uspRow.input), nonJson, 'row ' + row.n + ' (' + row.label + ')');
  }
  assert.deepEqual(nonJson.match, []);
});

test('P-4: fenced RiskCharacteristicInterpreter outputs (S12–S15) give deep-equal classifications and a deep-equal downstream correction authorization', async () => {
  const cases = [
    ['classifyCandidateContent', ['go for an easy run today'], JSON.stringify({ tags: [{ domain: 'PHYSICAL_EXERTION_OR_MOVEMENT', anchorText: 'easy run' }] })],
    ['classifyTurnForDurableConstraint', ['I am allergic to peanuts'], JSON.stringify({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'allergic to peanuts' }] })],
    ['classifyCandidateConflictWithFact', ['eat peanut butter', 'allergic to peanuts'], JSON.stringify({ relation: 'CONFIRMED_CONFLICT' })]
  ];
  for (const [fn, args, payload] of cases) {
    RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: payload }] }) });
    const plain = await RiskCharacteristicInterpreter[fn].apply(null, args);
    for (const form of ACCEPT_FORMS) {
      RiskCharacteristicInterpreter.configure({ callClaude: async () => ({ content: [{ text: form(payload) }] }) });
      assert.deepEqual(await RiskCharacteristicInterpreter[fn].apply(null, args), plain, fn);
    }
  }
  const correction = (text) => {
    RiskCharacteristicInterpreter.configure({
      callClaude: async (body) => {
        const id = (body.messages[0].content.match(/id="([^"]+)"/) || [])[1];
        const payload = JSON.stringify({ results: [{ id: id, correctionConfirmed: true }] });
        return { content: [{ text: text(payload) }] };
      }
    });
    return RiskCharacteristicIntakeGate.authorizeCorrection({
      turn: { turnId: 't-c', text: 'My allergist says I am no longer allergic to peanuts.' },
      existingFact: { memoryId: 'rcf-1', literalStatementText: 'allergic to peanuts' },
      memoryConsent: { granted: true }
    });
  };
  const plainAuth = await correction((p) => p);
  assert.equal(plainAuth.authorized, true, 'sanity: the plain correction is authorized');
  for (const form of ACCEPT_FORMS) assert.deepEqual(await correction(form), plainAuth);
  RiskCharacteristicInterpreter.configure({ callClaude: null });
});

test('P-5: literal anchoring is unchanged inside a fenced envelope — a non-literal restriction or anchor is still dropped', async () => {
  const s9 = SITES.find((s) => s.id === 'S9');
  const s13 = SITES.find((s) => s.id === 'S13');
  const s9NonLiteral = JSON.stringify({ results: [{ id: 's1', restrictionClassification: 'RESTRICTION_STATED', restrictedActivityText: 'swimming', statedDurationText: null }] });
  const s13NonLiteral = JSON.stringify({ candidates: [{ domain: 'INGESTION_OR_SUBSTANCE_EXPOSURE', severity: 'PROHIBITIVE', anchorText: 'allergic to shellfish' }] });
  for (const form of ACCEPT_FORMS) {
    assert.deepEqual(await s9.invoke(form(s9NonLiteral)), await s9.invoke(s9NonLiteral));
    assert.deepEqual(await s9.invoke(form(s9NonLiteral)), {});
    assert.deepEqual(await s13.invoke(form(s13NonLiteral)), await s13.invoke(s13NonLiteral));
    assert.deepEqual(await s13.invoke(form(s13NonLiteral)), []);
  }
});

// ═══ Zero drift: request bodies (prompts, model ids, max_tokens) of every model entry point ═══
// OU-001 AC-CAL-4 amendment: the approved OpenUnderstanding instruction line of the Turn
// Understanding prompt changed after MRE-001. For TU.understand the body is hashed with the
// PRE-amendment instruction substituted back, proving that line is the ONLY difference from the
// pre-MRE-001 pin; every other entry point is hashed exactly as sent.
const PRE_AMENDMENT_OU_INSTRUCTION = "OPEN UNDERSTANDING (part 2; entirely separate from the dimensions above and never a reason to change any answer to them): describe what the turn means. \"summary\": in the same language as the turn, one to three plain sentences, at most 240 characters, saying what the user means right now; when the turn refers back to something said earlier in this conversation, resolve that reference in the summary. \"mentions\": at most 8 short spans the turn is about, each copied exactly, character for character, from the turn itself or from an earlier turn of this conversation if one is provided, each at most 48 characters; never paraphrase, translate, label, or group them. Describe meaning only: never advise, never answer the user, and never state that anything said earlier is true, confirmed, or current. If the turn carries no meaning beyond the dimensions above, part 2 is null.";
function withPreAmendmentOuInstruction(body) {
  const content = body.messages[0].content;
  const line = content.split('\n').find((l) => l.indexOf('OPEN UNDERSTANDING') === 0);
  assert.notEqual(line, PRE_AMENDMENT_OU_INSTRUCTION, 'sanity: the amended instruction is in use');
  return Object.assign({}, body, { messages: [Object.assign({}, body.messages[0], { content: content.split(line).join(PRE_AMENDMENT_OU_INSTRUCTION) })] });
}

async function requestBodyHashes() {
  const out = {};
  const capture = async (name, M, fn) => {
    const seen = [];
    M.configure({ callClaude: async (b) => { seen.push(JSON.stringify(name === 'TU.understand' ? withPreAmendmentOuInstruction(b) : b)); return { content: [{ text: '{}' }] }; } });
    try { await fn(); } finally { M.configure({ callClaude: null }); }
    out[name] = crypto.createHash('sha256').update(seen.join('\n')).digest('hex');
  };
  const m = (p) => req('js/coachDecisionSystem/' + p + '.js');
  await capture('TU.understand', m('turnUnderstandingInterpreter'), () => m('turnUnderstandingInterpreter').understand({ turnId: 'b1', text: 'ישנתי 5 שעות' }, { items: [{ turnId: 'p0', userText: 'hi', assistantText: 'hello' }] }));
  await capture('EPSI.classify', m('explicitPreferenceStatementInterpreter'), () => m('explicitPreferenceStatementInterpreter').classify({ turnId: 'b2', text: 'I love running' }));
  await capture('ER.classify', m('explicitRequestInterpreter'), () => m('explicitRequestInterpreter').classify([{ id: 'r1', text: 'stop suggesting runs' }]));
  await capture('RS.classify', m('readinessStateInterpreter'), () => m('readinessStateInterpreter').classify([{ id: 'r2', text: 'slept 5 hours' }]));
  await capture('AP.classify', m('activityPreferenceInterpreter'), () => m('activityPreferenceInterpreter').classify([{ id: 'r3', text: 'I love running' }]));
  await capture('AO.classify', m('activityOppositionInterpreter'), () => m('activityOppositionInterpreter').classify([{ id: 'r4', text: 'never suggest swimming' }]));
  await capture('SIT.classify', m('situationalContextInterpreter'), () => m('situationalContextInterpreter').classify([{ id: 'r5', text: 'busy week at work' }]));
  await capture('SC.classify', m('safetyContextInterpreter'), () => m('safetyContextInterpreter').classify([{ id: 'r6', text: 'doctor said no running' }]));
  await capture('SC.classifyWithStatus', m('safetyContextInterpreter'), () => m('safetyContextInterpreter').classifyWithStatus([{ id: 'r6', text: 'doctor said no running' }]));
  await capture('SC.classifyCorrectionWithStatus', m('safetyContextInterpreter'), () => m('safetyContextInterpreter').classifyCorrectionWithStatus({ id: 'r7', text: 'doctor cleared me to run' }, 'running'));
  await capture('USP.classify', m('userSafetyProvenanceInterpreter'), () => m('userSafetyProvenanceInterpreter').classify([{ id: 'r8', text: 'my doctor said no running' }]));
  await capture('RCF.classifyCandidateContent', m('riskCharacteristicInterpreter'), () => m('riskCharacteristicInterpreter').classifyCandidateContent('go for an easy run'));
  await capture('RCF.classifyTurnForDurableConstraint', m('riskCharacteristicInterpreter'), () => m('riskCharacteristicInterpreter').classifyTurnForDurableConstraint('I am allergic to peanuts'));
  await capture('RCF.classifyCorrectionWithStatus', m('riskCharacteristicInterpreter'), () => m('riskCharacteristicInterpreter').classifyCorrectionWithStatus({ id: 'r9', text: 'not allergic anymore' }, 'allergic to peanuts'));
  await capture('RCF.classifyCandidateConflictWithFact', m('riskCharacteristicInterpreter'), () => m('riskCharacteristicInterpreter').classifyCandidateConflictWithFact('eat peanut butter', 'allergic to peanuts'));
  await capture('TRR.propose', m('trainingReadinessReasoningComponent'), () => m('trainingReadinessReasoningComponent').propose({}));
  await capture('GR.reason', m('generalReasoningCapability'), () => m('generalReasoningCapability').reason({}, {}));
  return out;
}

test('zero drift: the request body (prompt text, model id, max_tokens, messages) of all 17 model entry points is byte-identical to the pre-MRE-001 pins (TU.understand modulo only the approved OU AC-CAL-4 instruction line)', async () => {
  assert.deepEqual(await requestBodyHashes(), PRE_MRE_REQUEST_BODY_SHA256);
});
