// USI-001 — TEST-ONLY double of the governed correction port (docs/specs/USI_001_SPEC_v1.0.md
// §18.3). It stands in for the trusted SERVER authority boundary that a future live-activation
// Work Item must implement (§08.3 item 4). It is backed by a SEPARATELY LOADED instance of the
// E.0.2c store, configured with writerAuthority 'SERVER', sharing the test's in-memory port, so
// the E.0.2c authority matrix and INV-UC-S are enforced exactly as they would be server-side.
// Following the C4 §11.3 precedent it independently re-validates each request's shape before
// calling the store. Never part of production; never script-tagged.
'use strict';

const path = require('node:path');

const STORE_PATH = require.resolve(path.join(__dirname, '..', '..', 'js', 'coachDecisionSystem', 'userKnowledgeStore.js'));

// Loads a fresh store module instance without disturbing the cached (CLIENT) instance.
function loadSeparateStore() {
  const cached = require.cache[STORE_PATH];
  delete require.cache[STORE_PATH];
  try {
    return require(STORE_PATH);
  } finally {
    if (cached) require.cache[STORE_PATH] = cached; else delete require.cache[STORE_PATH];
  }
}

const ALLOWED_KEYS = {
  correctInferredKnowledge: { required: ['predecessorIds', 'successor', 'userOriginTurnId'], optional: ['confoundsForPredecessors', 'newConcepts'] },
  retractRecord: { required: ['recordId'], optional: ['userOriginTurnId'] },
  forgetRecord: { required: ['recordId'], optional: [] }
};

function shapeOk(name, req) {
  if (!req || typeof req !== 'object' || Array.isArray(req)) return false;
  const spec = ALLOWED_KEYS[name];
  const keys = Object.keys(req);
  if (keys.some((k) => spec.required.indexOf(k) === -1 && spec.optional.indexOf(k) === -1)) return false;
  return spec.required.every((k) => Object.prototype.hasOwnProperty.call(req, k));
}

function createGovernedCorrectionPortTestDouble(options) {
  const opts = options || {};
  const store = loadSeparateStore();
  const configured = store.configure({
    port: opts.port,
    now: opts.now,
    writerAuthority: 'SERVER',
    isLearningConsentGranted: opts.isLearningConsentGranted || (() => true),
    userId: opts.userId,
    producer: opts.producer || 'usi-001.intake',
    producerVersion: opts.producerVersion || '1.0.0'
  });
  const calls = [];
  function operation(name) {
    return async function (request) {
      calls.push({ name, request });
      if (!shapeOk(name, request)) return Object.freeze({ status: 'REJECTED', code: 'INVALID_REQUEST', path: 'request' });
      return store[name](request);
    };
  }
  return {
    configureStatus: configured.status,
    store,
    calls,
    port: {
      correctInferredKnowledge: operation('correctInferredKnowledge'),
      retractRecord: operation('retractRecord'),
      forgetRecord: operation('forgetRecord')
    }
  };
}

module.exports = { createGovernedCorrectionPortTestDouble, loadSeparateStore };
