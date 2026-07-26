// ══════════════════════════════════════════════════════════════════
// FitMe — Typed Memory Server Write Path (C4)
// See docs/specs/C4_SPEC_v1.0.md. Trusted, server-side write capability for
// users/{uid}/memories/{memoryId}, restricted to source ∈ {inferred_event,
// inferred_pattern, coach_generated} (C4_SPEC §12/§13). Not reachable by any
// client request — no exports.* entry is added anywhere for this capability
// (C4_SPEC §11.4/§20); no caller is wired by this module (C4_SPEC §6/§20).
// Persistence operations are injected via configure(), the same general
// dependency-injection technique js/persistenceGateway.js and
// js/stateAccess.js already use for Node-testability (C4_SPEC §18) — this is
// the technique only, not a reuse of either module (C4_SPEC CD-C4-08).
// Does not write to coachMemory, coachEvents, users/{uid}/days, or legacy
// profile memory (C4_SPEC CD-C4-02). Does not read Typed Memory beyond the
// single-record existence check required to decide create vs. update
// (C4_SPEC §14.6).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var crypto = require('crypto');

  var MODULE_VERSION = '1.0.0';

  // Independently maintained, value-identical to js/memory.js's MEMORY_TYPES
  // (C4_SPEC §13.2 — the repository's Functions deployment source is limited
  // to the functions/ directory, so this vocabulary is kept in lockstep here
  // rather than imported across that boundary).
  var MEMORY_TYPES = ['fact', 'habit', 'pattern', 'preference', 'coach_note', 'conversation_memory', 'recurring_meal'];

  // Closed set of sources this capability may write (C4_SPEC §13.3) — a strict
  // subset of js/memory.js's full MEMORY_SOURCES. user_stated/migrated are
  // client-owned and are rejected here even though they are valid Typed
  // Memory sources in general (C4_SPEC CD-C4-05).
  var SERVER_SOURCES = ['inferred_event', 'inferred_pattern', 'coach_generated'];

  var CANDIDATE_STATUS = 'candidate';
  var DEFAULT_CONFIDENCE = 0.5;

  // ── Injected dependencies (C4_SPEC §14/§18) ──
  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function isValidConfidence(c) { return typeof c === 'number' && !isNaN(c) && c >= 0 && c <= 1; }

  function nowMs() {
    return (deps && typeof deps.now === 'function') ? deps.now() : Date.now();
  }

  function rejected(code, message) {
    return { status: 'REJECTED', memoryId: null, error: { code: code, message: message } };
  }
  function failed(code, message) {
    return { status: 'FAILED', memoryId: null, error: { code: code, message: message } };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Validation Contract (C4_SPEC §13) ──
  // ══════════════════════════════════════════════════════════════════
  function validate(request) {
    request = request || {};
    if (!isNonEmptyString(request.uid)) return 'uid is required';
    if (!isNonEmptyString(request.idempotencyKey)) return 'idempotencyKey is required';
    if (!isNonEmptyString(request.type) || MEMORY_TYPES.indexOf(request.type) === -1) {
      return 'type must be one of the closed MEMORY_TYPES vocabulary';
    }
    if (!isNonEmptyString(request.source) || SERVER_SOURCES.indexOf(request.source) === -1) {
      return 'source must be one of inferred_event, inferred_pattern, coach_generated';
    }
    if (!isPlainObject(request.payload)) return 'payload must be a plain object';
    if (typeof request.confidence !== 'undefined' && !isValidConfidence(request.confidence)) {
      return 'confidence must be a number in [0,1]';
    }
    // §13.4: status is never validated as caller-controlled input — any value
    // present in the request is unconditionally ignored (see write() below).
    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Deterministic Identity (C4_SPEC §15) ──
  // Identity is derived from (uid, source, idempotencyKey): uid scopes the
  // record via the users/{uid}/memories collection path itself; memoryId is
  // derived from (source, idempotencyKey). SHA-256 gives a fixed-length,
  // deterministic, collision-resistant, Firestore-document-ID-safe string for
  // any input (§15.1/§15.4) without depending on a specific sanitization
  // scheme. Because source is part of the hash input, a request that changes
  // source can never resolve to an already-created record's memoryId — this
  // is how §13.8 (source immutable after creation) is satisfied structurally.
  // ══════════════════════════════════════════════════════════════════
  function deriveMemoryId(source, idempotencyKey) {
    var hash = crypto.createHash('sha256').update(String(source) + '::' + String(idempotencyKey)).digest('hex');
    return 'srv_' + hash;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Write (C4_SPEC §12 write contract / §14 persistence contract) ──
  // ══════════════════════════════════════════════════════════════════
  async function write(request) {
    request = request || {};

    var problem = validate(request);
    if (problem) return rejected('INVALID_REQUEST', problem);

    if (!deps || typeof deps.atomicWrite !== 'function') {
      return failed('NOT_CONFIGURED', 'persistence dependency not configured');
    }

    var memoryId = deriveMemoryId(request.source, request.idempotencyKey);
    var confidence = (typeof request.confidence === 'number') ? request.confidence : DEFAULT_CONFIDENCE;

    try {
      // §14.3: deps.atomicWrite is responsible for determining existence and
      // applying the returned branch atomically enough to prevent a partial
      // write, a lost update, or a duplicate record under concurrent/repeated
      // invocation. The specific mechanism (transaction, precondition write,
      // etc.) is supplied by the caller of configure(), not by this module.
      var outcome = await deps.atomicWrite(request.uid, memoryId, function (existing) {
        var ts = nowMs();
        if (!existing) {
          // §14.4 Create branch — status is always 'candidate', unconditionally
          // (§13.4/§9): any request.status value is never read here.
          return {
            op: 'create',
            record: {
              type: request.type,
              payload: request.payload,
              confidence: confidence,
              source: request.source,
              status: CANDIDATE_STATUS,
              created_at: ts,
              updated_at: ts,
              last_confirmed_at: null
            }
          };
        }
        // §14.5 Update branch — only payload/confidence/updated_at change.
        // source, status, type, created_at, last_confirmed_at are never
        // included here, so they remain untouched by construction (§13.4,
        // §13.8, §13.10).
        var fields = { payload: request.payload, updated_at: ts };
        if (typeof request.confidence === 'number') fields.confidence = confidence;
        return { op: 'update', fields: fields };
      });

      var op = outcome && outcome.op;
      return {
        status: op === 'create' ? 'SUCCESS_CREATED' : 'SUCCESS_UPDATED',
        memoryId: memoryId,
        error: null
      };
    } catch (e) {
      // §17.1/§17.2: fail closed, no partial record — deps.atomicWrite owns
      // the atomicity guarantee, so a thrown/rejected call here means no
      // write was durably applied.
      return failed('PERSISTENCE_ERROR', (e && e.message) || 'persistence operation failed');
    }
  }

  var API = {
    VERSION: MODULE_VERSION,
    configure: configure,
    write: write,
    MEMORY_TYPES: MEMORY_TYPES.slice(),
    SERVER_SOURCES: SERVER_SOURCES.slice()
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
