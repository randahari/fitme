// ══════════════════════════════════════════════════════════════════
// FitMe — Conversation Repository (CCC-001, docs/specs/CCC_001_SPEC_v1.0.md §5/§7/§8)
// Exclusive responsibility: thin Firestore wrapper for users/{uid}/coachConversation/{turnId}
// — the same "wrap the raw Firestore mechanics, no business logic" shape every other
// repository in this directory already uses (see js/repositories/dayRepository.js /
// js/repositories/errorLogRepository.js). createPending()/completeTurn() implement CCC-001
// §5.2's own two-phase lifecycle exactly; this module enforces nothing about WHEN each is
// called or WHY (that decision lives in js/app.js's submitCoachConversationTurn(), per
// CCC_001_SPEC_v1.0.md §5.2's own PRODUCT CORRECTION 2) — it only performs the Firestore
// write/read once the caller has already decided.
//
// fetchRecent() serves BOTH the display-history read (js/ui/coachConversationPresenter.js,
// limit 50, CCC_001_SPEC_v1.0.md §7 — always called WITHOUT a cursor, one page, unchanged) and
// the bounded conversation-context candidate read (js/coachDecisionSystem/memoryLayer.js via
// StateAccess, CCC_001_SPEC_v1.0.md §8-§9 — called REPEATEDLY, paginated via the optional
// `afterCreatedAt`/`afterTurnId` cursor pair, to find the actual latest 6 COMPLETED turns
// regardless of how many PENDING/SILENCE turns are interleaved more recently, per the PRODUCT
// CORRECTION applied to §9: a single bounded candidate window is not semantically equivalent to
// "the latest 6 COMPLETED turns" and was rejected). A two-field query
// (.orderBy('createdAt','desc').orderBy(documentId(),'desc')[.startAfter(afterCreatedAt,
// afterTurnId)].limit(N), no equality filter) — the second field (the document's own ID) is a
// deterministic tie-breaker, added per a SECOND Product/Architecture correction: `createdAt` is
// a Firestore server timestamp, not guaranteed unique across documents (see fetchRecent()'s own
// header comment for the full cursor-stability rationale). This still requires NO manual
// composite index: ordering by one field plus `FieldPath.documentId()` is served by that
// field's own existing single-field index — a composite (status ==, orderBy createdAt) query
// was, separately, already rejected as the more complex option per Product's own explicit
// instruction to prefer pagination unless a composite index is "clearly the simplest and safest
// option," which repository evidence does not support here (no `firestore.indexes.json` exists
// in this repository at all). The COMPLETED-only filtering, 6-turn/6,000-character trimming,
// and the pagination LOOP itself are all performed by the caller
// (js/coachDecisionSystem/memoryLayer.js), never by this module — this module returns every
// fetched record's real status (and, additively, its own real `createdAt` value, needed only as
// the next page's cursor, alongside its own `turnId`/document ID, needed as that cursor's
// tie-breaking half), never pre-filters by status itself, matching DayRepository/
// ErrorLogRepository's own "no business logic" discipline exactly.
//
// deleteAllForUser() exists ONLY for the explicit account-reset path (js/app.js resetApp())
// — Firestore subcollection deletion is not automatic on parent-document delete, and neither
// createPending() nor completeTurn() ever calls it. firestore.rules independently enforces:
// owner-only create with a closed field allowlist, owner-only read, a narrowly constrained
// PENDING->{COMPLETED,SILENCE} update only, owner-only delete (reset only).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function conversationCollection(uid) {
    return deps.db.collection('users').doc(uid).collection('coachConversation');
  }

  // CCC_001_SPEC_v1.0.md §5.2 CREATE — payload: {userText, submittedAt}. assistantText/
  // completedAt start null; status starts 'PENDING'; createdAt is the server-authoritative
  // timestamp. turnId is the document ID (already generated in submitCoachConversationTurn()
  // — this function never generates or chooses an identity of its own).
  function createPending(uid, turnId, payload) {
    return conversationCollection(uid).doc(turnId).set({
      userText: payload.userText,
      assistantText: null,
      status: 'PENDING',
      submittedAt: payload.submittedAt,
      completedAt: null,
      createdAt: deps.serverTimestamp()
    });
  }

  // CCC_001_SPEC_v1.0.md §5.2 UPDATE — the ONLY two permitted transitions, both PENDING ->
  // terminal, applied via Firestore's own update() (requires the document to already exist —
  // throws otherwise, which is correct: a completion can only ever follow a real create).
  // patch: {status: 'COMPLETED'|'SILENCE', assistantText: string|null}. userText/submittedAt/
  // createdAt are never touched here — this function has no parameter through which a caller
  // could even attempt to change them, structurally mirroring firestore.rules' own immutability
  // enforcement (§6) rather than merely trusting the caller.
  function completeTurn(uid, turnId, patch) {
    return conversationCollection(uid).doc(turnId).update({
      status: patch.status,
      assistantText: patch.assistantText,
      completedAt: deps.serverTimestamp()
    });
  }

  // Two-field, no-manual-index query — orderBy('createdAt') PLUS a documentId() tie-breaker
  // (see file header for the rationale shared by both callers). Returns already-mapped plain
  // objects (doc.id -> turnId, matching DayRepository's own "map raw Firestore docs into plain
  // records" discipline), newest-first.
  //
  // CURSOR STABILITY CORRECTION (Product/Architecture Final Review — pagination correctness):
  // `createdAt` (a Firestore server timestamp, assigned once at document creation) is NOT
  // guaranteed unique across documents — two turns created in the same tick (e.g. a rapid
  // double-submit, or the same account open in two tabs/devices) can legitimately share the
  // exact same `createdAt` value. Firestore's own documented cursor semantics state that a
  // cursor built from a single orderBy field that contains duplicate values is not guaranteed
  // deterministic: `.startAfter(value)` excludes EVERY document equal to that value, not only
  // the ones already returned, so a page boundary landing inside an equal-`createdAt` group
  // could silently skip sibling documents on the far side of that boundary. The fix: add
  // `FieldPath.documentId()` (injected as `deps.documentIdField()`, since it is a live-SDK
  // static utility, never referenced directly here — matching this module's own established
  // "no direct `firebase` reference, everything injected via configure()" discipline) as a
  // SECOND orderBy field, and pass a two-part cursor (`afterCreatedAt`, `afterTurnId`) to
  // `.startAfter()`. Document IDs are always unique, so (createdAt, documentId) together give a
  // total, fully deterministic order — no two documents can ever compare equal. This requires NO
  // manual composite index: Firestore's documented exception is that ordering by exactly one
  // field plus `FieldPath.documentId()` as a tie-breaker is served by that field's existing
  // single-field index (its entries are already internally keyed by (field value, document ID)),
  // unlike an arbitrary second field, which would require a manually configured composite index
  // (this repository has none — confirmed by the continued absence of `firestore.indexes.json`).
  //
  // `afterCreatedAt`/`afterTurnId` are optional and additive, together: omitted entirely by
  // every existing display-path call site (byte-identical behavior — one bounded page, no
  // `.startAfter()` call at all, exactly as before this correction); when supplied (Memory
  // Layer's own pagination loop only, always as a matched pair — see memoryLayer.js), they
  // become a Firestore `.startAfter(afterCreatedAt, afterTurnId)` cursor, continuing the SAME
  // ordered sequence from immediately after the previously-fetched page's own oldest document —
  // never a second, independent query shape.
  async function fetchRecent(uid, limitCount, afterCreatedAt, afterTurnId) {
    var q = conversationCollection(uid)
      .orderBy('createdAt', 'desc')
      .orderBy(deps.documentIdField(), 'desc');
    if (afterCreatedAt !== undefined && afterCreatedAt !== null) q = q.startAfter(afterCreatedAt, afterTurnId);
    q = q.limit(limitCount);
    var snap = await q.get();
    var out = [];
    snap.forEach(function (doc) {
      var d = doc.data() || {};
      out.push({
        turnId: doc.id,
        userText: d.userText,
        assistantText: (d.assistantText === undefined) ? null : d.assistantText,
        status: d.status,
        submittedAt: d.submittedAt,
        completedAt: (d.completedAt === undefined) ? null : d.completedAt,
        // Needed only as a future page's own cursor (Memory Layer's pagination loop) — the
        // display path already ignores this extra field harmlessly, exactly as it already
        // ignores completedAt/status details it doesn't render.
        createdAt: d.createdAt
      });
    });
    return out;
  }

  // Explicit account-reset cleanup only (js/app.js resetApp()) — never called by
  // createPending()/completeTurn(). Batches deletes to stay safely under Firestore's
  // 500-write batch limit — identical shape to js/repositories/errorLogRepository.js's own
  // just-closed deleteAllForUser().
  async function deleteAllForUser(uid) {
    var snap = await conversationCollection(uid).get();
    var refs = [];
    snap.forEach(function (d) { refs.push(d.ref); });
    var BATCH_SIZE = 400;
    for (var i = 0; i < refs.length; i += BATCH_SIZE) {
      var batch = deps.db.batch();
      refs.slice(i, i + BATCH_SIZE).forEach(function (ref) { batch.delete(ref); });
      await batch.commit();
    }
  }

  var API = {
    configure: configure,
    createPending: createPending,
    completeTurn: completeTurn,
    fetchRecent: fetchRecent,
    deleteAllForUser: deleteAllForUser
  };

  if (typeof window !== 'undefined') { window.ConversationRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
