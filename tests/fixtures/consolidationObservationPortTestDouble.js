// WP0 Phase E.0.2d — Observation Port test double
// (docs/specs/WP0_PHASE_E_0_2D_CONSOLIDATION_SPEC_v1.0.md §10). Test fixture only: an in-memory
// stand-in for the platform adapters beneath the Observation Port. It mirrors the §10.4 adapter
// guidance — conversation turns (userText as USER_AUTHORED text; assistantText never returned unless a
// test explicitly injects a FITME-authored segment), day logs (USER_RECORDED data), and the Typed
// Memory side of ownership (a KEYED lookup by sourceTurnId through an index — the double never scans
// its record collection, and counts any attempt) and user-stated references.
//
// Test hooks (never part of the port contract): `failNext(op)`, `override(op, fn)`, `calls`
// (operation names and argument copies), `stats.collectionScans` (must stay 0).
'use strict';

function copy(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }

const SAFETY_TYPES = ['safety_disclosure', 'risk_characteristic_fact'];

function descriptors() {
  return {
    conversation: { sourceId: 'conversationTurns', evidenceRefKind: 'CONVERSATION_TURN', sensitivityTier: 'STANDARD', consentScope: null, protectedSource: false, description: 'What the person wrote to the coach in completed conversation turns.' },
    dayLog: { sourceId: 'dayLogs', evidenceRefKind: 'DAY_LOG', sensitivityTier: 'STANDARD', consentScope: null, protectedSource: false, description: 'Meals and daily totals the person logged for a calendar day.' },
    typedMemory: { sourceId: 'typedMemoryReferences', evidenceRefKind: 'TYPED_MEMORY_RECORD', sensitivityTier: 'STANDARD', consentScope: null, protectedSource: false, description: 'Preferences and facts the person stated and FITME stored for them.' }
  };
}

function createObservationPort() {
  const turns = new Map();       // turnId → {userText, assistantText, createdAt, status}
  const days = new Map();        // dayKey → {epoch, meals, totals}
  const typed = new Map();       // memoryId → {type, source, status, payload, order}
  const bySourceTurn = new Map(); // sourceTurnId → Set(memoryId) — the index the keyed lookup uses
  const failures = new Set();
  const overrides = new Map();
  const calls = [];
  const stats = { collectionScans: 0 };
  let order = 0;

  function shouldFail(op) { if (failures.has(op)) { failures.delete(op); return true; } return false; }

  const seed = {
    turn(turnId, userText, createdAt, opts) {
      turns.set(turnId, Object.assign({ userText, assistantText: 'FITME reply to ' + turnId, createdAt, status: 'COMPLETED', fitmeSegment: false }, opts || {}));
    },
    day(dayKey, epoch, meals, totals) {
      days.set(dayKey, { epoch, meals: meals || [], totals: totals || null });
    },
    typedMemory(memoryId, rec) {
      typed.set(memoryId, Object.assign({ order: ++order }, rec));
      const st = rec.payload && rec.payload.sourceTurnId;
      if (st) { if (!bySourceTurn.has(st)) bySourceTurn.set(st, new Set()); bySourceTurn.get(st).add(memoryId); }
    },
    deleteTypedMemory(memoryId) {
      const rec = typed.get(memoryId);
      if (!rec) return;
      typed.delete(memoryId);
      const st = rec.payload && rec.payload.sourceTurnId;
      if (st && bySourceTurn.has(st)) bySourceTurn.get(st).delete(memoryId);
    }
  };

  function turnObservation(turnId, t) {
    const segments = [{ segmentId: 'user', authorship: 'USER_AUTHORED', text: t.userText, data: null }];
    if (t.fitmeSegment) segments.push({ segmentId: 'fitme', authorship: 'FITME_AUTHORED', text: t.assistantText, data: null });
    return { ref: { kind: 'CONVERSATION_TURN', ref: turnId }, sourceId: 'conversationTurns', observedAt: t.createdAt, localDate: null, localTime: null, utcOffsetMinutes: null, segments };
  }
  // §10.4 (v1.1): each meal segment carries its own structural localTime, normalized to HH:MM; the
  // value also remains in its data. A meal without a parseable time has no structural time.
  function normalizedTime(t) {
    const m = typeof t === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(t) : null;
    return m ? m[1].padStart(2, '0') + ':' + m[2] : null;
  }
  function dayObservation(dayKey, d) {
    const segments = d.meals.map((m, i) => {
      const s = { segmentId: 'meal' + (i + 1), authorship: 'USER_RECORDED', text: null, data: [
        { label: 'name', value: m.name, unit: null }, { label: 'kcal', value: m.kcal, unit: 'kcal' }, { label: 'time', value: m.time, unit: null }
      ] };
      const t = normalizedTime(m.time);
      if (t !== null) s.localTime = t;
      return s;
    });
    if (d.totals) segments.push({ segmentId: 'totals', authorship: 'USER_RECORDED', text: null, data: Object.keys(d.totals).map((k) => ({ label: k, value: d.totals[k], unit: null })) });
    if (!segments.length) segments.push({ segmentId: 'empty', authorship: 'USER_RECORDED', text: null, data: [{ label: 'logged', value: false, unit: null }] });
    return { ref: { kind: 'DAY_LOG', ref: dayKey }, sourceId: 'dayLogs', observedAt: null, localDate: dayKey, localTime: null, utcOffsetMinutes: null, segments };
  }

  const port = {
    async readObservations(userId, q) {
      calls.push({ op: 'readObservations', args: copy(q) });
      if (overrides.has('readObservations')) return overrides.get('readObservations')(userId, q);
      if (shouldFail('readObservations')) throw new Error('adapter failure');
      const out = [];
      const ids = (q && q.sourceIds) || [];
      const w = q.window;
      if (ids.indexOf('conversationTurns') !== -1) {
        for (const [id, t] of turns) {
          if (t.status === 'COMPLETED' && t.createdAt >= w.fromEpochMs && t.createdAt <= w.toEpochMs) out.push([t.createdAt, turnObservation(id, t)]);
        }
      }
      if (ids.indexOf('dayLogs') !== -1) {
        for (const [key, d] of days) {
          if (d.epoch >= w.fromEpochMs && d.epoch <= w.toEpochMs) out.push([d.epoch, dayObservation(key, d)]);
        }
      }
      out.sort((a, b) => b[0] - a[0]);
      return out.slice(0, q.limit).map((x) => x[1]);
    },
    async readOwnershipClaims(userId, q) {
      calls.push({ op: 'readOwnershipClaims', args: copy(q) });
      if (overrides.has('readOwnershipClaims')) return overrides.get('readOwnershipClaims')(userId, q);
      if (shouldFail('readOwnershipClaims')) throw new Error('adapter failure');
      const claims = [];
      for (const ref of q.refs) {
        if (ref.kind !== 'CONVERSATION_TURN') continue;
        const ids = bySourceTurn.get(ref.ref);
        if (!ids) continue;
        for (const memoryId of ids) {
          const rec = typed.get(memoryId);
          if (!rec || rec.source !== 'user_stated') continue;
          const claimant = SAFETY_TYPES.indexOf(rec.type) !== -1 ? 'SAFETY_INTAKE' : (rec.type === 'preference' ? 'CPI_PREFERENCE' : 'USER_STATED_TYPED_MEMORY');
          claims.push({ ref: { kind: ref.kind, ref: ref.ref }, claimant, recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: memoryId } });
        }
      }
      return claims;
    },
    async readUserStatedReferences(userId, q) {
      calls.push({ op: 'readUserStatedReferences', args: copy(q) });
      if (overrides.has('readUserStatedReferences')) return overrides.get('readUserStatedReferences')(userId, q);
      if (shouldFail('readUserStatedReferences')) throw new Error('adapter failure');
      // A bounded recency query in a real adapter; the double sorts its small fixture set.
      const recs = Array.from(typed.entries())
        .filter(([, r]) => r.source === 'user_stated' && r.status === 'active' && SAFETY_TYPES.indexOf(r.type) === -1)
        .sort((a, b) => b[1].order - a[1].order)
        .slice(0, q.limit);
      return recs.map(([memoryId, r]) => ({
        recordRef: { kind: 'TYPED_MEMORY_RECORD', ref: memoryId },
        claimant: r.type === 'preference' ? 'CPI_PREFERENCE' : 'USER_STATED_TYPED_MEMORY',
        claimedObservationRefs: r.payload && r.payload.sourceTurnId ? [{ kind: 'CONVERSATION_TURN', ref: r.payload.sourceTurnId }] : [],
        segments: r.payload && typeof r.payload.text === 'string'
          ? [{ segmentId: 'statement', authorship: 'USER_AUTHORED', text: r.payload.text, data: null }]
          : [{ segmentId: 'tokens', authorship: 'USER_RECORDED', text: null, data: Object.keys(r.payload || {}).filter((k) => k !== 'sourceTurnId').map((k) => ({ label: k, value: String(r.payload[k]), unit: null })) }]
      }));
    }
  };

  return {
    port,
    seed,
    calls,
    stats,
    failNext(op) { failures.add(op); },
    override(op, fn) { overrides.set(op, fn); },
    clearOverride(op) { overrides.delete(op); }
  };
}

module.exports = { createObservationPort, descriptors };
