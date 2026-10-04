// WP0 Phase E.0.2c — in-memory reference implementation of the User Knowledge persistence port
// (docs/specs/WP0_PHASE_E_0_2C_USER_KNOWLEDGE_RECORD_AND_CONCEPT_IDENTITY_FOUNDATION_SPEC_v1.0.md
// §20.1, §20.3). Test fixture only: the reference target of the port conformance suite and the
// port used by every E.0.2c unit test. Two logical stores per user (records, concepts); atomic
// commit with per-document version checks; bounded reads; per-user isolation; documents are
// deep-copied in and out so callers can never mutate stored state; never throws (reads that fail
// resolve to {status:'FAILED'}, which the store treats as a failure).
//
// Test hooks (never part of the port contract): `failNext(opName)` makes the next call of that
// operation fail; `conflictNextCommit()` forces the next commit to report CONFLICT;
// `tamper(fn)` rewrites documents returned by reads; `calls` logs every operation name;
// `peek(userId)` returns deep copies of both stores for assertions.
'use strict';

const L = { MAX_READ_BATCH: 50, MAX_QUERY_LIMIT: 50, MAX_QUERY_CONCEPT_IDS: 10, MAX_QUERY_REF_IDS: 10 };
const STATUSES = ['candidate', 'active', 'superseded', 'rejected', 'archived'];
const SOURCES = ['user_stated', 'inferred_event', 'inferred_pattern', 'coach_generated', 'migrated'];
const ID_KINDS = ['record', 'concept', 'event', 'confound'];

function copy(v) { return JSON.parse(JSON.stringify(v)); }
function isId(s) { return typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s); }
function isLimit(n, max) { return Number.isInteger(n) && n >= 1 && n <= max; }
function byUpdatedDesc(idKey) {
  return (a, b) => (b.updatedAt - a.updatedAt) || (a[idKey] < b[idKey] ? -1 : (a[idKey] > b[idKey] ? 1 : 0));
}

function createInMemoryPort(options) {
  const opts = options || {};
  const prefix = opts.idPrefix || 'm';
  const users = new Map();
  const counters = { record: 0, concept: 0, event: 0, confound: 0 };
  const failures = new Set();
  let conflictNext = false;
  let tamperFn = null;
  const calls = [];

  function space(userId) {
    if (!users.has(userId)) users.set(userId, { records: new Map(), concepts: new Map() });
    return users.get(userId);
  }
  function shouldFail(op) {
    if (failures.has(op)) { failures.delete(op); return true; }
    return false;
  }
  function out(doc) { const c = copy(doc); return tamperFn ? tamperFn(c) : c; }
  const FAILED = Object.freeze({ status: 'FAILED' });

  const port = {
    newId(kind) {
      calls.push('newId');
      if (ID_KINDS.indexOf(kind) === -1) throw new Error('unknown id kind');
      counters[kind] += 1;
      return prefix + '_' + kind + '_' + counters[kind];
    },
    async getRecords(userId, recordIds) {
      calls.push('getRecords');
      try {
        if (shouldFail('getRecords') || !isId(userId) || !Array.isArray(recordIds) || recordIds.length < 1 || recordIds.length > L.MAX_READ_BATCH) return FAILED;
        const s = space(userId);
        return recordIds.filter((id) => s.records.has(id)).map((id) => out(s.records.get(id)));
      } catch (e) { return FAILED; }
    },
    async getConcepts(userId, conceptIds) {
      calls.push('getConcepts');
      try {
        if (shouldFail('getConcepts') || !isId(userId) || !Array.isArray(conceptIds) || conceptIds.length < 1 || conceptIds.length > L.MAX_READ_BATCH) return FAILED;
        const s = space(userId);
        return conceptIds.filter((id) => s.concepts.has(id)).map((id) => out(s.concepts.get(id)));
      } catch (e) { return FAILED; }
    },
    async queryRecordsByConcepts(userId, q) {
      calls.push('queryRecordsByConcepts');
      try {
        if (shouldFail('queryRecordsByConcepts') || !isId(userId) || !q || typeof q !== 'object') return FAILED;
        if (!Array.isArray(q.conceptIdsAny) || q.conceptIdsAny.length < 1 || q.conceptIdsAny.length > L.MAX_QUERY_CONCEPT_IDS) return FAILED;
        if (!Array.isArray(q.statuses) || q.statuses.length < 1 || q.statuses.length > 5 || !q.statuses.every((s) => STATUSES.indexOf(s) !== -1)) return FAILED;
        if (!isLimit(q.limit, L.MAX_QUERY_LIMIT)) return FAILED;
        const s = space(userId);
        return Array.from(s.records.values())
          .filter((r) => q.statuses.indexOf(r.status) !== -1 && r.conceptIds.some((c) => q.conceptIdsAny.indexOf(c) !== -1))
          .sort(byUpdatedDesc('recordId'))
          .slice(0, q.limit)
          .map(out);
      } catch (e) { return FAILED; }
    },
    // E.0.2c amendment for E.0.2d §07, §11 — reference implementation (in-memory scan permitted here;
    // a persisting adapter must serve it from an index over supportingRefIds).
    async queryRecordsBySupportingRefs(userId, q) {
      calls.push('queryRecordsBySupportingRefs');
      try {
        if (shouldFail('queryRecordsBySupportingRefs') || !isId(userId) || !q || typeof q !== 'object') return FAILED;
        if (!Array.isArray(q.refIdsAny) || q.refIdsAny.length < 1 || q.refIdsAny.length > L.MAX_QUERY_REF_IDS || !q.refIdsAny.every((r) => typeof r === 'string' && r.length > 0)) return FAILED;
        if (!Array.isArray(q.sources) || q.sources.length < 1 || q.sources.length > 5 || !q.sources.every((x) => SOURCES.indexOf(x) !== -1)) return FAILED;
        if (!Array.isArray(q.statuses) || q.statuses.length < 1 || q.statuses.length > 5 || !q.statuses.every((x) => STATUSES.indexOf(x) !== -1)) return FAILED;
        if (!isLimit(q.limit, L.MAX_QUERY_LIMIT)) return FAILED;
        const s = space(userId);
        return Array.from(s.records.values())
          .filter((r) => q.statuses.indexOf(r.status) !== -1 && q.sources.indexOf(r.source) !== -1 &&
            Array.isArray(r.supportingRefIds) && r.supportingRefIds.some((id) => q.refIdsAny.indexOf(id) !== -1))
          .sort(byUpdatedDesc('recordId'))
          .slice(0, q.limit)
          .map(out);
      } catch (e) { return FAILED; }
    },
    async queryRecentConcepts(userId, q) {
      calls.push('queryRecentConcepts');
      try {
        if (shouldFail('queryRecentConcepts') || !isId(userId) || !q || !isLimit(q.limit, L.MAX_QUERY_LIMIT)) return FAILED;
        return Array.from(space(userId).concepts.values()).sort(byUpdatedDesc('conceptId')).slice(0, q.limit).map(out);
      } catch (e) { return FAILED; }
    },
    async queryConceptsMergedInto(userId, conceptId, q) {
      calls.push('queryConceptsMergedInto');
      try {
        if (shouldFail('queryConceptsMergedInto') || !isId(userId) || !isId(conceptId) || !q || !isLimit(q.limit, L.MAX_QUERY_LIMIT)) return FAILED;
        return Array.from(space(userId).concepts.values())
          .filter((c) => c.mergedInto === conceptId)
          .sort(byUpdatedDesc('conceptId'))
          .slice(0, q.limit)
          .map(out);
      } catch (e) { return FAILED; }
    },
    async commit(userId, changeSet) {
      calls.push('commit');
      try {
        if (shouldFail('commit') || !isId(userId) || !changeSet || !Array.isArray(changeSet.creates) || !Array.isArray(changeSet.updates)) return FAILED;
        if (conflictNext) { conflictNext = false; return { status: 'CONFLICT' }; }
        const s = space(userId);
        const storeFor = (doc) => (Object.prototype.hasOwnProperty.call(doc, 'recordId') ? s.records : s.concepts);
        const idOf = (doc) => (Object.prototype.hasOwnProperty.call(doc, 'recordId') ? doc.recordId : doc.conceptId);
        // Check everything first; apply only when every check passes (atomic).
        for (const doc of changeSet.creates) {
          if (!doc || typeof doc !== 'object' || doc.userId !== userId) return FAILED;
          if (storeFor(doc).has(idOf(doc))) return { status: 'CONFLICT' };
        }
        for (const u of changeSet.updates) {
          const map = u.kind === 'record' ? s.records : s.concepts;
          const current = map.get(u.id);
          if (!current || current.version !== u.expectedVersion) return { status: 'CONFLICT' };
          if (!u.doc || u.doc.userId !== userId) return FAILED;
        }
        for (const doc of changeSet.creates) storeFor(doc).set(idOf(doc), copy(doc));
        for (const u of changeSet.updates) (u.kind === 'record' ? s.records : s.concepts).set(u.id, copy(u.doc));
        return { status: 'COMMITTED' };
      } catch (e) { return FAILED; }
    },
    async deleteRecord(userId, recordId) {
      calls.push('deleteRecord');
      try {
        if (shouldFail('deleteRecord') || !isId(userId) || !isId(recordId)) return FAILED;
        return space(userId).records.delete(recordId) ? { status: 'DELETED' } : { status: 'NOT_FOUND' };
      } catch (e) { return FAILED; }
    },
    async deleteConcept(userId, conceptId) {
      calls.push('deleteConcept');
      try {
        if (shouldFail('deleteConcept') || !isId(userId) || !isId(conceptId)) return FAILED;
        return space(userId).concepts.delete(conceptId) ? { status: 'DELETED' } : { status: 'NOT_FOUND' };
      } catch (e) { return FAILED; }
    },
    async deleteRecordsBySources(userId, sources) {
      calls.push('deleteRecordsBySources');
      try {
        if (shouldFail('deleteRecordsBySources') || !isId(userId) || !Array.isArray(sources) || sources.length < 1 || sources.length > 5 || !sources.every((x) => SOURCES.indexOf(x) !== -1)) return FAILED;
        const s = space(userId);
        Array.from(s.records.values()).forEach((r) => { if (sources.indexOf(r.source) !== -1) s.records.delete(r.recordId); });
        return { status: 'DELETED' };
      } catch (e) { return FAILED; }
    },
    async deleteAll(userId) {
      calls.push('deleteAll');
      try {
        if (shouldFail('deleteAll') || !isId(userId)) return FAILED;
        users.delete(userId);
        return { status: 'DELETED' };
      } catch (e) { return FAILED; }
    }
  };

  const hooks = {
    calls,
    failNext(op) { failures.add(op); },
    conflictNextCommit() { conflictNext = true; },
    tamper(fn) { tamperFn = fn; },
    peek(userId) {
      const s = space(userId);
      return { records: Array.from(s.records.values()).map(copy), concepts: Array.from(s.concepts.values()).map(copy) };
    },
    seed(userId, docs) {
      const s = space(userId);
      docs.forEach((d) => (Object.prototype.hasOwnProperty.call(d, 'recordId') ? s.records.set(d.recordId, copy(d)) : s.concepts.set(d.conceptId, copy(d))));
    },
    writeCalls() { return calls.filter((c) => ['commit', 'deleteRecord', 'deleteConcept', 'deleteRecordsBySources', 'deleteAll'].indexOf(c) !== -1); },
    resetCalls() { calls.length = 0; }
  };

  return { port, hooks };
}

module.exports = { createInMemoryPort };
