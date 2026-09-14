// ══════════════════════════════════════════════════════════════════
// FitMe — Error Log Repository (Friends Alpha Item 7 — Minimal Error/Crash Telemetry)
// Exclusive responsibility: thin Firestore wrapper for users/{uid}/errorLog/{entryId} — the
// same "wrap the raw Firestore mechanics, no business logic" shape every other repository in
// this directory already uses (see js/repositories/dayRepository.js). create() persists an
// already-allowlisted payload — js/errorTelemetry.js is the sole caller and the sole producer
// of that payload; this module never validates, filters, or interprets its content, matching
// ProfileRepository/DayRepository's own "the caller decides what to write" discipline.
// deleteAllForUser() exists ONLY for the explicit account-reset path (js/app.js resetApp()) —
// Firestore subcollection deletion is not automatic on parent-document delete, and create()
// (the telemetry reporting path) never calls it. firestore.rules independently enforces:
// owner-only create with a closed field allowlist, no read, no update, owner-only delete
// (reset only — never invoked by the reporting path itself).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // payload is already the fully-allowlisted object js/errorTelemetry.js built — this
  // function adds only the server-authoritative createdAt timestamp, exactly as
  // js/repositories/dayRepository.js's saveLegacyDay() adds updatedAt.
  function create(uid, payload) {
    return deps.db.collection('users').doc(uid).collection('errorLog').add(
      Object.assign({}, payload, { createdAt: deps.serverTimestamp() })
    );
  }

  // Explicit account-reset cleanup only (js/app.js resetApp()) — never called by create()'s
  // own reporting path. Batches deletes to stay safely under Firestore's 500-write batch limit.
  async function deleteAllForUser(uid) {
    var snap = await deps.db.collection('users').doc(uid).collection('errorLog').get();
    var refs = [];
    snap.forEach(function (d) { refs.push(d.ref); });
    var BATCH_SIZE = 400;
    for (var i = 0; i < refs.length; i += BATCH_SIZE) {
      var batch = deps.db.batch();
      refs.slice(i, i + BATCH_SIZE).forEach(function (ref) { batch.delete(ref); });
      await batch.commit();
    }
  }

  var API = { configure: configure, create: create, deleteAllForUser: deleteAllForUser };

  if (typeof window !== 'undefined') { window.ErrorLogRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
