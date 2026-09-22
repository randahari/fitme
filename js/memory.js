// ══════════════════════════════════════════════════════════════════
// FitMe — Memory Layer (TASK-001 infrastructure)
// שכבת זיכרון מטויפסת אחת. נתיב קנוני: users/{uid}/memories/{id}
// מודול עצמאי בדפוס hook — לא משנה קוד קיים; נטען אחרי app.js.
// לפי v3 §4 וההחלטות D1/D3/D6. אין כאן לוגיקת המלצות ואין Habit Engine.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // TASK-007 UX-19.1-19.3 (WP6): same dual-environment dependency-resolution convention every
  // other module in this codebase uses (e.g. js/trigger/triggerController.js) — reused only for
  // its already-existing, additive classifyError() export (js/persistenceGateway.js WP6
  // prerequisite); this module's writes still go directly to Firestore, unchanged.
  var PersistenceGateway = (typeof module !== 'undefined' && module.exports)
    ? require('./persistenceGateway.js')
    : window.PersistenceGateway;

  // ESAF-001 (docs/specs/ESAF_001_SPEC_v1.0.md §4) — same dual-environment pattern, reused
  // only for its already-existing, additive recordExplicitUserStatementArrival()/
  // getExplicitUserStatementArrivalTimestamp() pair (D2-EF-07). This module does not gain any
  // new persistence path, Decision-Input read, or dependency on the Composite Engine's own
  // Pipeline Context — it only signals, after its own already-existing writes succeed, that an
  // authoritative user-stated write happened. Content-blind: only {userId} is ever passed.
  var MemoryLayer = (typeof module !== 'undefined' && module.exports)
    ? require('./coachDecisionSystem/memoryLayer.js')
    : window.CoachDecisionSystemMemoryLayer;

  // ── סכמה מטויפסת (v3 §4) ─────────────────────────────────────────
  // Friends Alpha Item 6 (USER_DISCLOSURE V1) — 'safety_disclosure' is a narrow, additive 8th
  // type: an explicit Safety-relevant user-stated restriction/correction, kept explicitly
  // identifiable/distinguishable from a generic 'fact' (Product/Architecture binding decision) —
  // never a second memory store or authority; same collection, same CLIENT_WRITABLE_SOURCES gate,
  // same create/update/delete machinery below.
  // WP0 Phase D.5 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §15, Revision 2,
  // Product+Architecture APPROVED) — 'risk_characteristic_fact' is a narrow, additive 9th type: a
  // governed, durable risk-characteristic fact captured via riskCharacteristicIntakeGate.js. §15's
  // own binding resolution requires a NEW, dedicated type rather than overloading
  // 'safety_disclosure' — that existing type and its own intake gate
  // (safetyDisclosureIntakeGate.js) are left completely untouched by this addition. Payload shape
  // is exactly {riskDomain, literalStatementText, sourceTurnId} — no severity field (Phase D.3's
  // own binding authority correction: an AI-proposed severity/diagnosis must never become durable
  // factual authority; only the user's own literal, independently-grounded statement is
  // persisted). Same collection, same CLIENT_WRITABLE_SOURCES gate, same create/update/delete
  // machinery below — never a second memory store or authority.
  var MEMORY_TYPES = ['fact', 'habit', 'pattern', 'preference', 'coach_note', 'conversation_memory', 'recurring_meal', 'safety_disclosure', 'risk_characteristic_fact'];
  var MEMORY_SOURCES = ['user_stated', 'inferred_event', 'inferred_pattern', 'coach_generated', 'migrated'];
  var MEMORY_STATUS = ['candidate', 'active', 'superseded', 'rejected', 'archived'];
  // מקורות שהלקוח רשאי לכתוב (תואם ל-firestore.rules). השאר — server-only.
  var CLIENT_WRITABLE_SOURCES = ['user_stated', 'migrated'];
  var SCHEMA_VERSION = 1;

  function nowTs() { return Date.now(); }

  // TASK-007 UX-19.1-19.3 (WP6): structured failure-message helper for this module's D6
  // transparency-sheet actions (create/confirm/reject/edit/delete). These writes go directly to
  // Firestore (memCol()...), not through the Persistence Gateway or saveProfile()/saveTodayData()
  // — but they already produce a real, non-swallowed rejection (unlike those two functions before
  // the WP6 prerequisite), so PersistenceGateway.classifyError() can classify the raw error
  // in-place without any routing change. Defensive: if PersistenceGateway is unavailable for any
  // reason, falls back to a single non-retry-inviting message rather than throwing.
  function memoryFailureMessage(e, baseMsg) {
    var retryable = false;
    try { retryable = !!(PersistenceGateway && PersistenceGateway.classifyError(e).retryable); } catch (_) {}
    return retryable
      ? baseMsg + ' עקב בעיית תקשורת זמנית. נסה שוב.'
      : baseMsg + ' ולא ניתן לנסות שוב כרגע. נסה מאוחר יותר.';
  }

  // ESAF-001 (§4/§6/§7) — the exact USM-001 read-path-visibility filter, kept in lockstep with
  // stateAccess.js's own readUserStatedMemory() filter (js/stateAccess.js): a record only ever
  // matters to the authoritative Coach-facing read path if it is
  // type∈{fact,preference,safety_disclosure} ∧ source==='user_stated' ∧ status==='active'.
  // Friends Alpha Item 6 (Product/Architecture binding decision) — 'safety_disclosure' added
  // additively: Safety-relevant durable state and explicit corrections to it must participate in
  // this existing freshness/invalidation mechanism exactly like an ordinary fact/preference does,
  // never a redesign of ESAF-001 itself. Editing/rejecting/deleting a record outside this set
  // still cannot change what that read path could see, so still produces no freshness churn.
  var ESAF_QUALIFYING_TYPES = ['fact', 'preference', 'safety_disclosure'];
  function esafQualifies(m) {
    return !!m && ESAF_QUALIFYING_TYPES.indexOf(m.type) >= 0 && m.source === 'user_stated' && m.status === 'active';
  }

  // ESAF-001 (§4/§9) — the single, content-blind signal call site every producer below uses.
  // Passes only {userId}: never payload/type/source/status/reason. Defensive against
  // MemoryLayer being unavailable (mirrors this file's own memoryFailureMessage() defensiveness
  // toward PersistenceGateway) — a missing MemoryLayer must never break the write path it rides
  // on top of.
  function esafSignalArrival() {
    try {
      if (MemoryLayer && typeof MemoryLayer.recordExplicitUserStatementArrival === 'function' && currentUser) {
        MemoryLayer.recordExplicitUserStatementArrival({ userId: currentUser.uid });
      }
    } catch (e) {}
  }

  // רשומת זיכרון: id · type · payload · confidence · source ·
  //               created_at · updated_at · last_confirmed_at · status
  function makeMemory(o) {
    o = o || {};
    var t = nowTs();
    return {
      type: o.type,
      payload: o.payload || {},
      confidence: (typeof o.confidence === 'number') ? o.confidence : 0.5,
      source: o.source,
      created_at: o.created_at || t,
      updated_at: o.updated_at || t,
      last_confirmed_at: (o.last_confirmed_at === undefined) ? null : o.last_confirmed_at,
      status: o.status || 'candidate'
    };
  }

  function validateMemory(m) {
    if (!m || typeof m !== 'object') return 'memory missing';
    if (MEMORY_TYPES.indexOf(m.type) < 0) return 'bad type: ' + m.type;
    if (MEMORY_SOURCES.indexOf(m.source) < 0) return 'bad source: ' + m.source;
    if (MEMORY_STATUS.indexOf(m.status) < 0) return 'bad status: ' + m.status;
    if (typeof m.confidence !== 'number' || m.confidence < 0 || m.confidence > 1) return 'bad confidence';
    if (!m.payload || typeof m.payload !== 'object') return 'bad payload';
    return null;
  }

  // ── נתיב קנוני + CRUD ─────────────────────────────────────────────
  function memCol() {
    if (!currentUser) throw new Error('no user');
    return db.collection('users').doc(currentUser.uid).collection('memories');
  }

  // יצירה. id אופציונלי (דטרמיניסטי למיגרציה → אידמפוטנטי).
  async function createMemory(rec, id) {
    var m = makeMemory(rec);
    var err = validateMemory(m);
    if (err) throw new Error('invalid memory: ' + err);
    if (CLIENT_WRITABLE_SOURCES.indexOf(m.source) < 0) {
      throw new Error('client may not write source=' + m.source + ' (server-only)');
    }
    if (id) { await memCol().doc(id).set(m); return id; }
    var ref = await memCol().add(m);
    return ref.id;
  }

  async function updateMemory(id, patch) {
    patch = patch || {};
    patch.updated_at = nowTs();
    await memCol().doc(id).set(patch, { merge: true });
  }

  async function deleteMemory(id) {
    await memCol().doc(id).delete();
  }

  // Friends Alpha Blocker B3 (Reset Integrity) — explicit account-reset cleanup only
  // (js/app.js resetApp()); never called by createMemory()/updateMemory()/deleteMemory(). Mirrors
  // js/repositories/errorLogRepository.js's/conversationRepository.js's own deleteAllForUser()
  // batched-delete shape exactly. firestore.rules permits client deletion only for
  // source ∈ CLIENT_WRITABLE_SOURCES (user_stated/migrated) — records are filtered accordingly
  // before being added to a delete batch, so a hypothetical server-sourced record
  // (inferred_event/inferred_pattern/coach_generated) is silently skipped rather than attempted
  // (and rejected by the rules). Does not redesign Typed Memory's schema or CRUD contract.
  async function deleteAllMemories() {
    var snap = await memCol().get();
    var refs = [];
    snap.forEach(function (d) {
      var v = d.data();
      if (CLIENT_WRITABLE_SOURCES.indexOf(v.source) >= 0) refs.push(d.ref);
    });
    var BATCH_SIZE = 400;
    for (var i = 0; i < refs.length; i += BATCH_SIZE) {
      var batch = db.batch();
      refs.slice(i, i + BATCH_SIZE).forEach(function (ref) { batch.delete(ref); });
      await batch.commit();
    }
  }

  // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §12) — a single, narrow, additive existence-and-
  // status read on the exact same CRUD surface createMemory()/updateMemory() already use.
  // Reused by the persistence boundary (js/app.js) to decide CREATE / UPDATE-active / REACTIVATE-
  // from-rejected / no-write-other-status before writing (§12's own deterministic table). Returns
  // the raw document (with its own _id set, matching listMemories()'s own convention) or null
  // when absent. No business logic here — that decision lives entirely at the calling boundary.
  async function getMemory(id) {
    var doc = await memCol().doc(id).get();
    if (!doc.exists) return null;
    var v = doc.data();
    v._id = doc.id;
    return v;
  }

  async function listMemories() {
    var snap = await memCol().get();
    var out = [];
    snap.forEach(function (d) { var v = d.data(); v._id = d.id; out.push(v); });
    out.sort(function (a, b) { return (b.updated_at || 0) - (a.updated_at || 0); });
    return out;
  }

  // ── מיגרציה מהתשתית הקיימת ────────────────────────────────────────
  // coachMemory.observations[] → coach_note ; coachMemory.preferences{} → preference
  // אידמפוטנטי: מסומן ב-schemaVersion על הפרופיל + מזהי-מסמך דטרמיניסטיים.
  // לא הרסני: השדות הישנים נשארים במקומם (ניקוי — שלב עתידי נפרד).
  function safeKey(k) {
    try { return btoa(unescape(encodeURIComponent(String(k)))).replace(/[^A-Za-z0-9]/g, ''); }
    catch (e) { return String(k).replace(/[^A-Za-z0-9]/g, ''); }
  }

  var _migrating = false;
  // REM-002: session guard — true אם אין SessionLifecycle זמין (Node/בדיקות) או אם ה-generation
  // עדיין זהה לזה שנלכד כשהמיגרציה התחילה. false = הסשן הוחלף תוך כדי הלולאה האסינכרונית.
  function _sessionStillCurrent(gen) {
    if (typeof window === 'undefined' || !window.SessionLifecycle) return true;
    return window.SessionLifecycle.isCurrent(gen);
  }
  function _currentGen() {
    return (typeof window !== 'undefined' && window.SessionLifecycle) ? window.SessionLifecycle.getGeneration() : null;
  }

  async function migrateIfNeeded() {
    if (_migrating) return;
    if (!currentUser || !userProfile) return;
    if ((userProfile.schemaVersion || 0) >= SCHEMA_VERSION) return;
    _migrating = true;
    var _gen = _currentGen();
    try {
      var cm = userProfile.coachMemory || {};
      var obs = Array.isArray(cm.observations) ? cm.observations : [];
      var prefs = (cm.preferences && typeof cm.preferences === 'object') ? cm.preferences : {};

      for (var i = 0; i < obs.length; i++) {
        if (!_sessionStillCurrent(_gen)) return; // REM-002: סשן הוחלף — לא ממשיכים לכתוב תחת UID אחר
        var o = obs[i];
        var text = (typeof o === 'string') ? o : (o && (o.text || o.note || ''));
        if (!text) continue;
        await createMemory({
          type: 'coach_note',
          payload: { text: text },
          confidence: 0.5,
          source: 'migrated',
          status: 'active'
        }, 'mig_obs_' + i);
      }

      var keys = Object.keys(prefs);
      for (var j = 0; j < keys.length; j++) {
        if (!_sessionStillCurrent(_gen)) return; // REM-002: סשן הוחלף — לא ממשיכים
        var k = keys[j];
        var val = prefs[k];
        if (val === undefined || val === null || val === '') continue;
        await createMemory({
          type: 'preference',
          payload: { key: k, value: String(val) },
          confidence: 0.6,
          source: 'migrated',
          status: 'active'
        }, 'mig_pref_' + safeKey(k));
      }

      if (!_sessionStillCurrent(_gen)) return; // REM-002: לא מסמנים schemaVersion תחת סשן ישן
      userProfile.schemaVersion = SCHEMA_VERSION;
      userProfile.memoryMigratedAt = nowTs();
      await saveProfile();
    } finally {
      _migrating = false;
    }
  }

  // ── API ציבורי (למנועים עתידיים: Habit Engine וכו') ──────────────
  var API = {
    TYPES: MEMORY_TYPES,
    SOURCES: MEMORY_SOURCES,
    STATUS: MEMORY_STATUS,
    CLIENT_WRITABLE_SOURCES: CLIENT_WRITABLE_SOURCES,
    SCHEMA_VERSION: SCHEMA_VERSION,
    make: makeMemory,
    validate: validateMemory,
    create: createMemory,
    update: updateMemory,
    remove: deleteMemory,
    deleteAllMemories: deleteAllMemories,
    get: getMemory,
    list: listMemories,
    migrateIfNeeded: migrateIfNeeded,
    // CPI-001 (docs/specs/CPI_001_SPEC_v1.0.md §12) — promoted from the pre-existing, Node/test-
    // only `_internal` export (below) to the main, browser-reachable API surface: the persistence
    // boundary (js/app.js) needs this exact same deterministic-ID helper migrateIfNeeded() already
    // uses internally ('mig_pref_' + safeKey(k)), to compute CPI's own 'conv_pref_' + ... document
    // IDs (§12). No behavior change to safeKey() itself — purely an additive export.
    safeKey: safeKey
  };

  // ══════════════════════════════════════════════════════════════════
  // D6 — מסך השקיפות: "מה המאמן יודע עליי"
  // צפייה · אישור · דחייה · עריכה · מחיקה · consent · retention note
  // ══════════════════════════════════════════════════════════════════
  var TYPE_LABELS = {
    fact: 'עובדות', habit: 'הרגלים', pattern: 'דפוסים', preference: 'העדפות',
    coach_note: 'הערות המאמן', conversation_memory: 'זיכרונות משיחות', recurring_meal: 'ארוחות חוזרות',
    // Friends Alpha Item 6 — smallest additive UI treatment (Product/Architecture binding
    // decision): grouping by MEMORY_TYPES already renders a distinct, labeled section per type,
    // so adding this one label is sufficient to make Safety-relevant durable items visibly
    // distinguishable from ordinary generic facts — no other transparency-UI change needed.
    safety_disclosure: 'מידע בטיחותי',
    // WP0 Phase D.5 (§15/§20 — transparency/readability preserved through this exact, existing
    // mechanism) — same smallest-additive-label treatment as safety_disclosure above.
    risk_characteristic_fact: 'מאפייני סיכון'
  };
  var STATUS_LABELS = {
    candidate: 'מועמד', active: 'פעיל', superseded: 'הוחלף', rejected: 'נדחה', archived: 'בארכיון'
  };
  var SOURCE_LABELS = {
    user_stated: 'נמסר על ידך', inferred_event: 'הוסק מאירועים', inferred_pattern: 'הוסק מדפוס',
    coach_generated: 'נוצר ע\u05F4י המאמן', migrated: 'הועבר מגרסה קודמת'
  };

  function memText(m) {
    var p = m.payload || {};
    if (p.text) return p.text;
    if (p.key !== undefined) return p.key + ': ' + p.value;
    if (p.name) return p.name;
    // WP0 Phase D.5 — risk_characteristic_fact's own payload shape (§15: riskDomain,
    // literalStatementText, sourceTurnId); literalStatementText is the human-readable literal
    // wording, matching this function's own existing per-type-branch convention exactly.
    if (p.literalStatementText) return p.literalStatementText;
    try { return JSON.stringify(p); } catch (e) { return ''; }
  }

  function installStyles() {
    if (document.getElementById('fitme-mem-styles')) return;
    var s = document.createElement('style');
    s.id = 'fitme-mem-styles';
    s.textContent = [
      '.fitme-mem-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:none;align-items:flex-end;justify-content:center}',
      '.fitme-mem-overlay.open{display:flex}',
      '.fitme-mem-sheet{background:var(--bg,#fff);color:var(--text,#111);width:100%;max-width:520px;max-height:88vh;overflow-y:auto;border-radius:var(--radius-lg,20px) var(--radius-lg,20px) 0 0;padding:18px 16px 28px;box-shadow:0 -8px 40px rgba(0,0,0,.25);direction:rtl}',
      '.fitme-mem-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}',
      '.fitme-mem-head h2{font-size:18px;margin:0}',
      '.fitme-mem-x{background:none;border:none;font-size:22px;color:var(--text-2,#666);cursor:pointer;line-height:1}',
      '.fitme-mem-note{font-size:12px;color:var(--text-2,#666);background:var(--bg-2,#f2f2f2);border:1px solid var(--border,#0002);border-radius:var(--radius-sm,9px);padding:9px 11px;margin:8px 0 14px;line-height:1.5}',
      '.fitme-mem-consent{display:flex;align-items:center;gap:8px;font-size:13px;margin:0 0 14px;color:var(--text,#111)}',
      '.fitme-mem-group{margin-bottom:16px}',
      '.fitme-mem-group h3{font-size:13px;color:var(--gold,#8B5E1A);margin:0 0 7px;font-weight:700}',
      '.fitme-mem-item{border:1px solid var(--border,#0002);border-radius:var(--radius,12px);padding:10px 12px;margin-bottom:8px;background:var(--bg,#fff)}',
      '.fitme-mem-item.st-rejected{opacity:.5}',
      '.fitme-mem-txt{font-size:14px;line-height:1.45;color:var(--text,#111);word-break:break-word}',
      '.fitme-mem-meta{font-size:11px;color:var(--text-2,#888);margin-top:4px}',
      '.fitme-mem-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}',
      '.fitme-mem-actions button{font-size:12px;border:1px solid var(--border-2,#0003);background:var(--bg-2,#f4f4f4);color:var(--text,#111);border-radius:var(--radius-sm,9px);padding:5px 10px;cursor:pointer}',
      '.fitme-mem-actions button.danger{color:var(--red,#A83220);border-color:var(--red,#A83220)}',
      '.fitme-mem-empty{font-size:14px;color:var(--text-2,#888);text-align:center;padding:24px 0}',
      '.fitme-mem-add{width:100%;border:1px dashed var(--border-2,#0003);background:none;color:var(--gold,#8B5E1A);border-radius:var(--radius,12px);padding:11px;font-size:14px;cursor:pointer;margin-top:4px}',
      '.fitme-mem-openbtn{width:100%;text-align:right;border:1px solid var(--border,#0002);background:var(--bg-2,#f4f4f4);color:var(--text,#111);border-radius:var(--radius,12px);padding:13px 15px;font-size:15px;cursor:pointer;margin:8px 0;display:flex;justify-content:space-between;align-items:center}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var overlay = null;

  function closeSheet() { if (overlay) overlay.classList.remove('open'); }

  function buildSheet() {
    overlay = document.createElement('div');
    overlay.className = 'fitme-mem-overlay';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSheet(); });
    var sheet = document.createElement('div');
    sheet.className = 'fitme-mem-sheet';
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    return sheet;
  }

  async function openSheet() {
    installStyles();
    var _gen = _currentGen(); // REM-002: session guard
    var sheet = overlay ? overlay.querySelector('.fitme-mem-sheet') : buildSheet();
    sheet.innerHTML = '';

    // כותרת
    var head = document.createElement('div');
    head.className = 'fitme-mem-head';
    var h2 = document.createElement('h2'); h2.textContent = 'מה המאמן יודע עליי';
    var x = document.createElement('button'); x.className = 'fitme-mem-x'; x.textContent = '\u00D7';
    x.addEventListener('click', closeSheet);
    head.appendChild(h2); head.appendChild(x);
    sheet.appendChild(head);

    // מדיניות שמירה (retention) — הבהרה למשתמש
    var note = document.createElement('div');
    note.className = 'fitme-mem-note';
    note.textContent = 'המאמן זוכר דברים כדי לשפר את הליווי. אתה יכול לאשר, לערוך או למחוק כל פריט. פריט שתמחק נעלם; פריט שתדחה לא ישמש עוד את המאמן. אירועים גולמיים נשמרים לזמן מוגבל ומסוכמים לזיכרונות.';
    sheet.appendChild(note);

    // consent
    var consent = document.createElement('label');
    consent.className = 'fitme-mem-consent';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    var consentWasGranted = !!(userProfile && userProfile.memoryConsent && userProfile.memoryConsent.granted);
    cb.checked = consentWasGranted;
    cb.addEventListener('change', async function () {
      if (!userProfile) return;
      var wasGranted = consentWasGranted;
      var nowGranted = cb.checked;
      userProfile.memoryConsent = { granted: nowGranted, at: nowTs() };
      // ESAF-001 (§8) — saveProfile() never throws; it catches internally and returns a status
      // object even on failure. Signal only on a verified {status:'SUCCESS'} AND only when the
      // grant/revoke value actually changed (a no-op toggle-back-to-same-value must not signal).
      var result;
      try { result = await saveProfile(); } catch (e) { result = null; }
      if (result && result.status === 'SUCCESS') {
        consentWasGranted = nowGranted;
        if (nowGranted !== wasGranted) { esafSignalArrival(); }
      }
    });
    var cspan = document.createElement('span');
    cspan.textContent = 'אני מאשר שהמאמן ילמד ויזכור עליי כדי לשפר את הליווי';
    consent.appendChild(cb); consent.appendChild(cspan);
    sheet.appendChild(consent);

    // גוף — טעינה
    var body = document.createElement('div');
    body.textContent = 'טוען…';
    sheet.appendChild(body);
    overlay.classList.add('open');

    var mems;
    try { mems = await listMemories(); }
    catch (e) { body.textContent = 'לא הצלחתי לטעון את הזיכרונות. נסה שוב.'; return; }

    if (!_sessionStillCurrent(_gen)) return; // REM-002: סשן הוחלף תוך כדי הטעינה — לא מציגים תוכן ישן

    body.innerHTML = '';

    if (!mems.length) {
      var empty = document.createElement('div');
      empty.className = 'fitme-mem-empty';
      empty.textContent = 'המאמן עוד לא למד עליך דברים. ככל שתשתמש באפליקציה, כאן יופיע מה שנלמד.';
      body.appendChild(empty);
    } else {
      // קיבוץ לפי type
      var groups = {};
      mems.forEach(function (m) { (groups[m.type] = groups[m.type] || []).push(m); });
      MEMORY_TYPES.forEach(function (t) {
        var arr = groups[t];
        if (!arr || !arr.length) return;
        var g = document.createElement('div');
        g.className = 'fitme-mem-group';
        var gh = document.createElement('h3');
        gh.textContent = TYPE_LABELS[t] || t;
        g.appendChild(gh);
        arr.forEach(function (m) { g.appendChild(renderItem(m, body)); });
        body.appendChild(g);
      });
    }

    // הוספת עובדה ידנית (source=user_stated)
    var add = document.createElement('button');
    add.className = 'fitme-mem-add';
    add.textContent = '+ הוסף משהו שהמאמן צריך לדעת';
    add.addEventListener('click', async function () {
      var txt = prompt('מה חשוב שהמאמן ידע עליך?');
      if (!txt || !txt.trim()) return;
      try {
        await createMemory({ type: 'fact', payload: { text: txt.trim() }, confidence: 1, source: 'user_stated', status: 'active' });
        // ESAF-001 (§5) — this creation path is unconditionally type:'fact', source:'user_stated',
        // status:'active'; reaching here means the write already succeeded (the line above would
        // have thrown otherwise, skipping straight to catch).
        esafSignalArrival();
        openSheet();
      } catch (e) { alert(memoryFailureMessage(e, 'לא הצלחתי לשמור')); }
    });
    body.appendChild(add);
  }

  function renderItem(m, body) {
    var it = document.createElement('div');
    it.className = 'fitme-mem-item' + (m.status === 'rejected' ? ' st-rejected' : '');

    var txt = document.createElement('div');
    txt.className = 'fitme-mem-txt';
    txt.textContent = memText(m);
    it.appendChild(txt);

    var meta = document.createElement('div');
    meta.className = 'fitme-mem-meta';
    var conf = Math.round((m.confidence || 0) * 100);
    meta.textContent = (STATUS_LABELS[m.status] || m.status) + ' · ' +
      (SOURCE_LABELS[m.source] || m.source) + ' · ביטחון ' + conf + '%';
    it.appendChild(meta);

    var actions = document.createElement('div');
    actions.className = 'fitme-mem-actions';

    // אישור
    var ok = document.createElement('button');
    ok.textContent = 'אישור';
    ok.addEventListener('click', async function () {
      try {
        await updateMemory(m._id, {
          last_confirmed_at: nowTs(), status: 'active',
          confidence: Math.min(1, (m.confidence || 0) + 0.1)
        });
        openSheet();
      } catch (e) { alert(memoryFailureMessage(e, 'הפעולה נכשלה')); }
    });
    actions.appendChild(ok);

    // דחייה
    if (m.status !== 'rejected') {
      var no = document.createElement('button');
      no.textContent = 'לא נכון';
      no.addEventListener('click', async function () {
        // ESAF-001 (§6) — evaluate the read-path-visibility gate against the pre-write record
        // (m), before the status:'rejected' transition below; this update does not touch
        // type/source, so m's pre-write values are exactly what changes (or doesn't).
        var qualified = esafQualifies(m);
        try {
          await updateMemory(m._id, { status: 'rejected' });
          if (qualified) { esafSignalArrival(); }
          openSheet();
        }
        catch (e) { alert(memoryFailureMessage(e, 'הפעולה נכשלה')); }
      });
      actions.appendChild(no);
    }

    // עריכה (טקסט/ערך)
    var ed = document.createElement('button');
    ed.textContent = 'עריכה';
    ed.addEventListener('click', async function () {
      var cur = memText(m);
      var nv = prompt('עריכה:', cur);
      if (nv === null) return;
      nv = nv.trim(); if (!nv) return;
      var patch;
      if (m.payload && m.payload.key !== undefined) patch = { payload: { key: m.payload.key, value: nv } };
      else patch = { payload: { text: nv } };
      // ESAF-001 (§6) — this patch only ever touches payload, never type/source/status, so the
      // pre-write record m already reflects the read-path-visibility gate correctly.
      var qualified = esafQualifies(m);
      try {
        await updateMemory(m._id, patch);
        if (qualified) { esafSignalArrival(); }
        openSheet();
      }
      catch (e) { alert(memoryFailureMessage(e, 'הפעולה נכשלה')); }
    });
    actions.appendChild(ed);

    // מחיקה
    var del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'מחק';
    del.addEventListener('click', async function () {
      if (!confirm('למחוק את הפריט הזה מהזיכרון של המאמן?')) return;
      // ESAF-001 (§7) — evaluate the read-path-visibility gate against the record as it exists
      // immediately before deletion (m); once deleted it cannot be re-read to check.
      var qualified = esafQualifies(m);
      try {
        await deleteMemory(m._id);
        if (qualified) { esafSignalArrival(); }
        openSheet();
      }
      catch (e) { alert(memoryFailureMessage(e, 'הפעולה נכשלה')); }
    });
    actions.appendChild(del);

    it.appendChild(actions);
    return it;
  }

  // ── תלייה במסך ההגדרות (דפוס override קיים) ──────────────────────
  function installSettingsButton() {
    if (typeof renderSettings !== 'function') return;
    var _orig = renderSettings;
    renderSettings = function () {
      _orig.apply(this, arguments);
      try {
        var scr = document.getElementById('screen-settings');
        if (!scr) return;
        var host = scr.querySelector('.scroll-content') || scr;
        if (document.getElementById('fitme-mem-openbtn')) return;
        var btn = document.createElement('button');
        btn.id = 'fitme-mem-openbtn';
        btn.className = 'fitme-mem-openbtn';
        var l = document.createElement('span'); l.textContent = '🧠 מה המאמן יודע עליי';
        // TASK-007 UX-22.4 (WP9): שברון גילוי מכוון RTL — הכיוון החזותי כבר נכון
        // (flex ללא row-reverse תחת direction:rtl ממקם אותו משמאל, בדיוק כמו
        // צמד ▶/◀ הקיים כבר נכון ב-date-nav), רק הגליף עצמו היה מכוון LTR.
        var r = document.createElement('span'); r.textContent = '‹'; r.style.color = 'var(--text-3,#aaa)';
        btn.appendChild(l); btn.appendChild(r);
        btn.addEventListener('click', function () { installStyles(); openSheet(); });
        // למקם לפני תגית הגרסה אם קיימת, אחרת בסוף
        var vtag = document.getElementById('fitme-version-tag');
        if (vtag && vtag.parentNode === host) host.insertBefore(btn, vtag);
        else host.appendChild(btn);
      } catch (e) {}
    };
  }

  // ── Boot: הרצת מיגרציה אחרי שהפרופיל נטען ─────────────────────────
  function boot() {
    installSettingsButton();
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (typeof currentUser !== 'undefined' && currentUser &&
          typeof userProfile !== 'undefined' && userProfile &&
          typeof saveProfile === 'function') {
        migrateIfNeeded().catch(function (e) { try { console.warn('memory migration failed:', e && e.message); } catch (_) {} });
        clearInterval(iv);
      }
      if (tries > 60) clearInterval(iv); // ~48s ואז מוותרים בשקט
    }, 800);
  }

  // ── חיבור לסביבה (מוגן — כדי שהליבה תהיה בדיקה גם ב-Node) ─────────
  if (typeof window !== 'undefined') {
    window.FitMeMemory = API;
    if (typeof document !== 'undefined') { installStyles(); }
    // REM-002: רישום ניקוי עצמאי — memory.js אחראי רק על ה-state שלו-עצמו
    // (הגיליון הפתוח + דגל המיגרציה), לא על state של מודולים אחרים.
    if (window.SessionLifecycle && typeof window.SessionLifecycle.registerCleanup === 'function') {
      window.SessionLifecycle.registerCleanup('memory', function () {
        closeSheet();
        _migrating = false;
      });
    }
    boot();
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Object.assign({}, API, { _internal: { makeMemory: makeMemory, validateMemory: validateMemory, safeKey: safeKey, memoryFailureMessage: memoryFailureMessage, esafQualifies: esafQualifies, esafSignalArrival: esafSignalArrival } });
  }
})();
