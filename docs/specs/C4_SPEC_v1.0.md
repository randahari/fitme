# C4_SPEC v1.0 — Typed Memory Server Write Path

**Status:** APPROVED, IMPLEMENTED AND CLOSED
**Governs:** A new, trusted, server-side write capability for typed memory records at `users/{uid}/memories/{memoryId}` carrying `source ∈ {inferred_event, inferred_pattern, coach_generated}`.
**Applies Canonical Decisions:** CD-C4-01 through CD-C4-14 (this document, §8), issued by Product Owner and AI Architect, Canonical Architecture Review for C4.
**Input:** C4 Repository Discovery Report (approved); C4_SPEC v1.0 first draft (Product/Architecture round 1 — approved, required implementation-mechanism revision); C4_SPEC v1.0 second draft (round 2 — approved, Engineering Readiness Review found one blocker and two documentation-level findings); this document resolves all three findings with no change to any approved Product or Architecture decision.
**Preserves:** B1 (Canonical Memory Decision — record contract, identity, lifecycle, confidence, generative/authoritative boundary), B2 (Engine Registry — no new engine registered), B3 (StateAccess — unchanged, no server participation), B4 (Persistence Gateway — unchanged, not extended), B5 (DerivedIntelligenceConsumer — unaffected), REM-003 (Generative vs. Authoritative Boundary — Authoritative Write Contract, Forbidden Write Paths), C1 (module/script-order contract — untouched, this SPEC's capability is not part of the browser script chain), C2 (Rejection and Suppression Feedback — untouched), C3 (Event Model Decision — untouched, `coachEvents` untouched).
**Repository Baseline:** branch `main`, commit `4c144be`, app version `2.41.0`, test baseline `1044` passed / `0` failed (`node --test tests/*.test.js`, verified at authoring time).

---

## 1. Executive Summary

C4 answers the question left open since B1, carried forward unresolved through B5, C1, C2, and C3, and named explicitly by each of them as "remains C4's": `firestore.rules` and `js/memory.js` already define and structurally anticipate three typed-memory `source` values — `inferred_event`, `inferred_pattern`, `coach_generated` — that only a trusted server process may write, but no such process exists anywhere in the repository. C4 builds that process.

C4 builds a narrow, trusted, server-side write **capability** — never reachable through a generic or arbitrary client-controlled interface — that can create or update a typed memory record at `users/{uid}/memories/{memoryId}` for exactly these three sources. The concrete deployment shape realizing this capability — which invocation mechanism, which module layout, which underlying database primitive — is an implementation decision for Engineering Readiness Review, not a canonical requirement of this SPEC (§11, §14, §20, Appendix A).

C4 is a write-path **capability**, not a producer, not an engine, and not a consumer. It defines the contract by which a future, separately-scoped trusted caller may persist a server-authoritative typed memory record; it does not itself decide when to call that contract, and no such caller is created or wired by this SPEC. This mirrors an existing, repository-precedented pattern: the Habit Engine and Pattern Engine already compute and persist derived output with no current consumer (Discovery Report §4, §12) — C4 similarly delivers a complete, tested, unconsumed capability, ready for a future producer to invoke once one is separately approved.

No existing memory representation, engine, or persistence module is modified. `coachMemory`, `coachEvents`, `users/{uid}/days`, `js/memory.js`, `StateAccess`, `PersistenceGateway`, `AuthorityContract`, and every B2 engine remain exactly as they are today. The only new artifact is a trusted server-side capability and its tests.

The central architectural mechanism that makes this SPEC compliant with REM-003 and B1 is the **status discipline** defined in §13: every record this capability creates is written with `status: 'candidate'` — unconditionally, regardless of any value present in the request — and this capability never transitions `status` on an existing record. This is what keeps `coach_generated` writes inside REM-003 §10's "Generative Persistent Data" exception and B1 §10's "LLM MAY propose a candidate memory" rule, rather than violating REM-003 §8/§10's prohibition on the LLM writing directly to Coach Memory as an authoritative source.

## 2. Objective

Create a trusted, server-side write capability — reachable only through a narrowly scoped, fully-validated entry point, never through a generic or arbitrary client-controlled interface (§11.4) — capable of creating and updating typed memory records at the existing canonical path `users/{uid}/memories/{memoryId}`, for exactly the three `source` values that `firestore.rules` and `js/memory.js` already reserve for server-only writers, with validation, idempotency, deterministic identity, and automated test coverage equivalent in engineering rigor to `js/persistenceGateway.js` and `js/stateAccess.js`, without extending, modifying, or architecturally reusing either of those modules.

The specific invocation mechanism, module layout, and persistence primitive used to satisfy this contract are implementation decisions for Engineering Readiness Review (§11.4, §14, §20), not canonical requirements of this SPEC — provided every canonical property in §11–§18 is preserved.

## 3. Problem Statement

`firestore.rules:53-56` states, in-repository, that `inferred_event`, `inferred_pattern`, and `coach_generated` memory sources are intended to be written "only by the Cloud Function via admin (bypasses rules) — server-only." `js/memory.js:11-15` defines the full typed-memory schema, including these three source values, and restricts client writes to `user_stated`/`migrated` only, in application code as well as at the Firestore Rules layer. `functions/index.js` currently contains exactly one Cloud Function (`anthropicProxy`), which proxies LLM calls and writes only rate-limit/usage counters to `usage/{uid}` — it does not touch `users/{uid}/memories`. The schema and the security rules anticipate a producer that has never been built (Discovery Report §12, remediation-plan Finding F10). C4 closes this specific gap: the write capability itself, and nothing else.

## 4. Goals

1. Define a canonical write contract for server-authoritative typed memory records (§12).
2. Define validation, source enforcement, and idempotency/deterministic-identity requirements sufficient for implementation to begin immediately (§13, §15).
3. Define the required persistence **properties** — create/update semantics, atomicity sufficient to prevent partial or conflicting state, idempotency under retry — without mandating a specific database primitive, transaction mechanism, or SDK, and without requiring or permitting architectural reuse of `PersistenceGateway`, `StateAccess`, or `js/memory.js` (§14).
4. Preserve REM-003's Generative vs. Authoritative Boundary and B1's Canonical Memory Decision exactly, by making the `status`-discipline mechanism (§13.4) the explicit compliance boundary for LLM-originated content (§9, §11).
5. Define comprehensive, mandatory automated test requirements (§18).
6. Do all of the above without redesigning the memory architecture, unifying existing write paths, modifying any engine, expanding client Firestore permissions, or introducing any new engine, event model, recommendation pipeline, or generic client-facing memory-write API — and without elevating any single implementation mechanism to canonical status where more than one mechanism could satisfy the required properties.

## 5. Non-Goals

- No redesign of the Typed Memory schema, its categories, its lifecycle states, or its identity model — B1's and `js/memory.js`'s existing definitions are used exactly as they stand.
- No unification of `coachMemory` (legacy) and typed `memories` (B1 §17's existing compatibility direction — coexistence, not unification — is unchanged by C4).
- No migration of any existing data, in either direction.
- No change to Habit Engine, Pattern Engine, Trigger Engine, Adaptive TDEE Engine, or `FeedbackDomain`/Recommendation Feedback.
- No change to `js/memory.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/authorityContract.js`, `js/app.js`, `index.html`, or `sw.js`.
- No new Persistence Gateway operation, no new StateAccess capability, no new Engine Registry registration.
- No expansion of client Firestore permissions of any kind.
- No **generic, arbitrary client-controlled memory-write surface** — i.e., no interface that accepts caller-supplied `source`/`type`/content and treats it as trusted for the three server-only sources without independent, capability-internal enforcement (§11.4). This does not, by itself, forbid every possible server entry point — see §11.4's forbidden/potentially-valid distinction.
- No coach-prompt change, no Typed Memory read/consumption path, no Recommendation Engine, no new event model, no status-promotion mechanism (candidate → active), no `js/memory.js` UI change.
- No canonical mandate of a specific Cloud Function trigger type, module filename, file layout, invocation mechanism, Firestore SDK/adapter, transaction requirement, deterministic-ID string format, sanitization algorithm, or retry implementation (§11.4, §14, §15, §20; see Appendix A for non-binding suggestions).

## 6. Scope

**In scope:**
- A trusted, server-side write capability implementing the write contract of §12, restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, addressing `users/{uid}/memories/{memoryId}` only.
- The write contract (§12), validation contract (§13), and required persistence properties (§14) for that capability.
- Deterministic identity and idempotency behavior (§15).
- Comprehensive automated test coverage for the new capability (§18).
- Its concrete module structure, location, and invocation mechanism are **not** decided in this SPEC — they are implementation decisions for Engineering Readiness Review (§11.4, §20, Appendix A), constrained only by the canonical properties this SPEC defines.

**Not in scope:** any change to `coachMemory`, `coachEvents`, `users/{uid}/days`, `js/memory.js`, `StateAccess`, `PersistenceGateway`, `AuthorityContract`, any B2 engine, `firestore.rules` (no change is required — §16); any interface that accepts arbitrary or client-selected `source`/`type`/content for these three server-only sources without independent enforcement of §13 (§11.4); any Typed Memory read/query capability beyond the single-record existence check strictly required to implement §14's create/update branching; any status-promotion logic; and any wiring of a caller/producer for this capability.

## 7. Repository and Document Baseline

See header block. Prior canonical documents governing this SPEC: `docs/tasks/B1/B1_SPEC.md` (CLOSED), `docs/tasks/REM-003/REM-003_Generative_vs_Authoritative_Boundary_SPEC.md` (CLOSED, v2.20.0), `docs/tasks/B4/B4_SPEC.md` (CLOSED), `docs/specs/C2_SPEC_v1.1.md` (CLOSED), `docs/specs/C3_SPEC_v1.0.md` (CLOSED), `docs/architecture/FITME_ARCHITECTURE_v1.md`, `docs/architecture/FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1(1).md` (Finding F10), `firestore.rules`, `js/memory.js`. This SPEC assumes the C4 Discovery Report's findings as its factual starting point and does not re-verify them line-by-line.

## 8. Canonical Decisions Applied (CD-C4-01 – CD-C4-14)

Transcribed from the Product Owner/AI Architect's Canonical Architecture Review for C4. Each is final and mandatory; this SPEC operationalizes, and does not alter, any of them.

1. **CD-C4-01 (Scope).** C4 creates a trusted server-side Typed Memory write path. It does not redesign the memory architecture, unify existing write paths, or redesign any engine.
2. **CD-C4-02 (Write Target).** The only canonical write target is `users/{uid}/memories/{memoryId}`. C4 must not write to `coachMemory`, `coachEvents`, `users/{uid}/days`, or legacy profile memory.
3. **CD-C4-03 (Legacy Memory).** Legacy Memory and Typed Memory both remain unchanged. No migration, replacement, or synchronization.
4. **CD-C4-04 (Existing Engines).** Habit Engine, Pattern Engine, Trigger Engine, and Recommendation Feedback remain unchanged. No engine is modified by C4.
5. **CD-C4-05 (Client vs. Server Authority).** The client continues to own `user_stated`/`migrated`. The server becomes the only authoritative writer for `inferred_event`/`inferred_pattern`/`coach_generated`. The client must never be able to create those sources.
6. **CD-C4-06 (`js/memory.js`).** The existing client memory module remains unchanged, continues serving client-authoritative memory only, and is migrated into neither `StateAccess` nor `PersistenceGateway`.
7. **CD-C4-07 (StateAccess).** `StateAccess` remains unchanged: no new permission, no new engine, no server participation.
8. **CD-C4-08 (PersistenceGateway).** `PersistenceGateway` remains unchanged. The server writer is not an extension of it. Equivalent engineering qualities — explicit validation, deterministic behavior, idempotency, bounded write surface, testability — are required, without architectural reuse.
9. **CD-C4-09 (Public API).** C4 must not expose a generic client API allowing arbitrary memory writes. The server write path is an internal trusted capability only.
10. **CD-C4-10 (Typed Memory Schema).** The existing Typed Memory schema is used as-is — not redesigned, not replaced. `AuthorityContract` is not duplicated inside memory records; it remains an internal execution contract. Typed Memory remains the canonical persisted representation.
11. **CD-C4-11 (Idempotency).** Every server write must be idempotent. Repeated execution of the same logical operation must never create a duplicate memory record.
12. **CD-C4-12 (Firestore Rules).** Client permissions are not expanded. The existing security model is reused unless repository evidence proves a change is required.
13. **CD-C4-13 (Out of Scope).** Coach prompt changes, reading Typed Memory, recommendation redesign, event redesign, migration, removing Legacy Memory, unifying memory systems, new engines, new persistence systems, new event models, and new recommendation pipelines are all explicitly excluded.
14. **CD-C4-14 (Testing).** Comprehensive automated testing is mandatory: validation, source enforcement, idempotency, deterministic document identity, timestamps, create/update behavior, failure handling, and unauthorized source attempts.

## 9. Relationship to REM-003 — the Compliance Mechanism

REM-003 §8 (Authority Matrix) forbids the LLM from writing directly to Memory, and REM-003 §10 (Forbidden Write Paths) explicitly lists "LLM → Coach Memory" as forbidden, subject to one stated exception: "LLM → Firestore… except Generative Persistent Data that is not a source of truth." REM-003 §9 (Authoritative Write Contract) requires every write path that accepts LLM input to be structured as `Input → LLM (optional) → Validation → Business Rules → Deterministic Decision → Persistence Layer → Firestore`, and states explicitly that REM-003 does not require unifying all write paths into one component — that question belongs to "Phase B," of which C4 is part.

B1 §10 (Generative Persistent Data) resolves the same tension for the Typed Memory system specifically: "An LLM MAY propose a candidate memory. The candidate SHALL remain generative until an approved deterministic, user-confirmed, or otherwise architecturally authorized path promotes it. No LLM SHALL directly create authoritative canonical memory." B1 §10 states this rule "inherits and preserves the REM-003 Generative vs. Authoritative Boundary."

**This SPEC's compliance mechanism (binding, §13.4):** every record this capability creates is written with `status: 'candidate'`, unconditionally, and this capability never transitions an existing record's `status`. A `source: 'coach_generated'` record so written is Generative Persistent Data under REM-003 §4/§10's exception and B1 §10's "candidate memory" — it is not an Authoritative Fact, and its persistence is therefore not a forbidden "LLM → Coach Memory" write. This capability is the **Persistence Layer** terminus of REM-003 §9's Authoritative Write Contract chain, not the chain itself: it is the responsibility of whatever future, separately-scoped caller invokes this capability to have already satisfied every upstream stage (Validation, Business Rules, Deterministic Decision) before invoking it. This capability performs its own independent structural and source validation (§13) but cannot and does not verify that an upstream Deterministic Decision genuinely occurred — REM-003 §9 assigns that responsibility to "any new write path that accepts input from the LLM" as a whole, not to the Persistence Layer component in isolation.

REM-003 §9 additionally requires every new write path to integrate with SessionLifecycle (REM-002) and not bypass generation guards. SessionLifecycle is a browser-runtime concept (a per-tab generation counter guarding against stale-session writes after logout/account-switch) with no structural analogue inside a stateless server-side invocation — there is no browser session for server-side code to check. This capability therefore has no SessionLifecycle integration, consistent with the repository's one existing Cloud Function (`anthropicProxy`), which likewise has none. This is recorded as an accepted, structurally-necessary boundary, not a deviation (see also §22, Known Limitations).

## 10. Relationship to B1 (Canonical Memory Decision)

- **B1 §6 (Record Contract):** this SPEC writes exactly the existing physical schema (`type`, `payload`, `confidence`, `source`, `created_at`, `updated_at`, `last_confirmed_at`, `status`) already implemented in `js/memory.js`. No new field is introduced.
- **B1 §7 (Memory Identity):** B1 explicitly defers identity-strategy choice per memory type ("Identity strategy MAY differ by memory type… The implementation strategy for semantic keys is deferred until the relevant persistence work, but duplicate competing authority is forbidden"). This SPEC exercises exactly that deferral: it mandates the *properties* deterministic identity must have (§15) without mandating one universal key-construction algorithm or string format across all three sources.
- **B1 §8 (Habits and Patterns):** unaffected. Habit/Pattern Engine output continues to be governed exclusively by B4/B5; this SPEC does not touch `coachMemory.habits`/`patterns`, and a future caller choosing to also mirror Habit/Pattern findings into `inferred_pattern` typed-memory records is a decision for that future, separately-approved task, not for C4.
- **B1 §10 (Generative Persistent Data):** the load-bearing rule for this SPEC — see §9 above.
- **B1 §11 (Ownership):** unaffected — this SPEC does not alter Canonical Memory Domain ownership; it adds a second *writer* (the server) operating on the same physical collection `js/memory.js` already owns the client-facing surface of.
- **B1 §13 (Write Contract Direction):** "The detailed persistence mechanics belong to B4 — Persistence Contract and, where applicable, C4 — Typed Memory Server Write Path." This SPEC is exactly that detailed mechanics document for the server-side half — expressed as required properties, not a mandated mechanism, consistent with B1 §7's own precedent of deferring mechanism while fixing requirements.
- **B1 §14 (Confidence):** unchanged rules apply — confidence is not authority; this SPEC's validation (§13) enforces the existing `[0,1]` numeric constraint and introduces no confidence-based authority shortcut.
- **B1 §15 (Lifecycle):** "No obsolete memory SHALL continue influencing coaching as if current." Since C4 introduces no reader and no consumer, this invariant is trivially preserved — nothing yet consumes these records for coaching.

## 11. Authority Model

11.1. **Client authority (unchanged).** `firestore.rules:57-74` already restricts client `create`/`update`/`delete` on `users/{uid}/memories/{memoryId}` to `source ∈ {user_stated, migrated}`, and forbids changing an existing record's `source` on update. Any other `source` value falls through to the file's closing default-deny rule (`match /{document=**} { allow read, write: if false; }`). No client request, before or after C4, can create, update, or delete a record with `source ∈ {inferred_event, inferred_pattern, coach_generated}`. This is existing, verified, unchanged behavior (§16).

11.2. **Server authority.** This capability SHALL execute with a trust level sufficient to write `users/{uid}/memories/{memoryId}` for the three server-only sources regardless of the client-facing Firestore Security Rules that constrain ordinary client requests (§11.1) — i.e., it SHALL NOT itself be constrained by those Rules. In this project's existing Firebase/Firestore deployment, this level of trust is available via server-side credentials (for example, the Firebase Admin SDK); whether the implementation uses that specific mechanism, another server-side Firestore access method, or an equivalent privileged pathway is an implementation decision (Appendix A). This trust is the sole basis of the capability's authority to write these sources — no Firestore Rule can grant it, since Rules govern client SDK requests only.

11.3. **Trust boundary.** Because this capability is not constrained by client-facing Firestore Security Rules for these three sources, it is itself the entire enforcement boundary for them. It SHALL independently perform every check defined in §13 on every invocation; it SHALL NOT assume its caller has already validated `source`, `type`, `payload`, `confidence`, or `status`.

11.4. **No generic client-controlled write surface (binding — CD-C4-09).** This capability SHALL NOT be exposed through any interface that accepts caller-supplied `source`, `type`, or content and treats it as trusted for the three server-only sources without independent, capability-internal enforcement of every rule in §13. Concretely:

- **Forbidden:** a generic memory-writer surface — of any invocation type — that lets a client request select or influence which `source` value is recorded, or that otherwise grants a client the effect of server authority over these three sources.
- **Potentially valid:** a narrowly scoped, trusted, producer-specific entry point — which MAY take the form of a Cloud Function export, an internally-invoked module reachable only by other trusted server code, or another mechanism — that itself fully enforces §13's validation, such that no caller-controlled input can produce a server-only-sourced record the capability's own validation would not have independently authorized.
- **The specific invocation mechanism is not decided by this SPEC** — not HTTP endpoint, not callable function, not Firestore trigger, not scheduled function, not direct internal module call, nor any other. Selecting it is an implementation decision, to be made during Engineering Readiness Review or implementation, provided every canonical property in this SPEC (§11–§18) is preserved. Likewise, whether a new export is or is not added to any file, and under what filename or module layout, is not decided by this SPEC (§20, Appendix A).

11.5. **Caller identity.** The capability SHALL require an explicit, already-authenticated `uid` for every invocation and SHALL treat it as pre-authenticated — verifying that authentication (by whatever mechanism) is the responsibility of whatever trusted caller invokes this capability, not of this capability itself. No caller is wired by this SPEC (§6); this requirement governs the contract any future caller must satisfy.

11.6. **`AuthorityContract` remains internal-only (CD-C4-10).** A future caller MAY use `AuthorityContract`'s existing vocabulary (`HABIT_ENGINE`, `PATTERN_ENGINE`, `SYSTEM`, `GENERATIVE`, etc.) internally to reason about why it is invoking this capability for a given `source` value. This capability SHALL NOT accept, store, or expose an `authoritySource`, `isAuthoritative`, `rule`, or `systemVersion` field on the persisted memory record. The persisted record's sole provenance is its own existing schema fields (`source`, `confidence`, `status`, `created_at`, `updated_at`, `last_confirmed_at`) — unchanged from B1/`js/memory.js`.

## 12. Write Contract

Every invocation of the capability SHALL be expressed as a request with the following logical fields. Physical shape and invocation mechanism MAY differ; these semantics SHALL be preserved.

```yaml
TypedMemoryServerWriteRequest:
  uid: string                      # already-authenticated caller-supplied UID
  idempotencyKey: string           # stable per logical fact/event/pattern — see §15
  type: string                     # one of js/memory.js MEMORY_TYPES; immutable after creation (§13.10)
  source: string                   # one of {inferred_event, inferred_pattern, coach_generated} only
  payload: object                  # plain object, per existing schema
  confidence: number | undefined   # optional, [0,1]; default 0.5 per existing schema default
  status: string | undefined       # accepted for shape compatibility only; always ignored — every
                                    # created record is status:'candidate' regardless of this value (§13.4)
```

12.1. This is **not** a `PersistenceRequest` (B4 §7) and SHALL NOT be submitted to `PersistenceGateway.persist()`. It is a distinct, independently-defined contract specific to this capability (CD-C4-08).

12.2. `uid`, `idempotencyKey`, `type`, `source`, and `payload` are required on every invocation. `confidence` is optional and defaults to `0.5` if omitted. `status`, if present, is never honored (§13.4).

12.3. This contract does not require a version/CAS token from the caller; the capability's own atomicity and idempotency guarantees (§14, §15) are sufficient without one. This does not preclude an implementation from using a transaction, a compare-and-swap/precondition write, or another mechanism internally to satisfy those guarantees — the mechanism is not mandated (§14.3).

12.4. There is no generic `write(path, data)` escape hatch. The only writable collection is `users/{uid}/memories`; the only writable `source` values are the three named in §12's schema. This is the "bounded write surface" quality required by CD-C4-08.

## 13. Validation Contract

Every field SHALL be independently, structurally validated before any persistence operation is attempted. Validation failure SHALL reject the entire write with no partial effect (§17).

13.1. **`uid`** — required, non-empty string.

13.2. **`type`** — required; MUST be a member of `js/memory.js`'s existing `MEMORY_TYPES` enum (`fact`, `habit`, `pattern`, `preference`, `coach_note`, `conversation_memory`, `recurring_meal`). This capability's `type`/`source`/`status` vocabulary SHALL remain identical to `js/memory.js`'s existing definitions and SHALL NOT diverge from them. This is a required property, not a prescribed mechanism; how the implementation keeps the two vocabularies consistent is an implementation decision. CD-C4-10 ("do not redesign, do not replace") governs the vocabulary itself.

13.3. **`source`** — required; MUST be exactly one of `inferred_event`, `inferred_pattern`, `coach_generated`. **Any other value SHALL be rejected**, including `user_stated` and `migrated` (client-owned — this capability is not a general-purpose alternate path for client sources, keeping CD-C4-05's separation of duties structurally enforced, not just conventionally observed) and including any string outside `js/memory.js`'s `MEMORY_SOURCES` enum entirely. This is the "unauthorized source attempt" case CD-C4-14 requires test coverage for.

13.4. **`status`** (binding — see §9). Every record this capability creates SHALL be written with `status: 'candidate'`, exactly as `js/memory.js`'s `makeMemory()` already defaults it, **unconditionally and regardless of any value present in the request**. A `status` value supplied in a create request SHALL be ignored — this capability does not accept caller-supplied `status` at creation, and SHALL NOT create a record with any status other than `'candidate'`, for any source, under any circumstance. On an **update** to an existing record, `status` in the request SHALL likewise be ignored entirely — the capability never transitions an existing record's `status` (§14.4/§14.5). There is exactly one canonical behavior: `status` is never caller-controlled, at creation or thereafter. Status promotion (`candidate → active`, or any other transition) is out of scope for C4 (§21) and belongs to a future, separately-approved task.

13.5. **`confidence`** — optional; if supplied, MUST be a number in the closed interval `[0, 1]`; if omitted, defaults to `0.5`, matching existing schema default.

13.6. **`payload`** — required; MUST be a plain object (not an array, not `null`, not a primitive), matching the existing schema's `validateMemory` rule.

13.7. **`idempotencyKey`** — required, non-empty string. See §15 for its role.

13.8. **`source` is immutable after creation.** On update, this capability SHALL ensure the request's `source` cannot change the persisted record's `source` — by whatever mechanism the implementation chooses (for example, never including `source` in an update operation, explicitly rejecting a request whose `source` differs from the existing record's, or an equivalent safeguard), mirroring the exact invariant `firestore.rules:67-69` already enforces for client updates (`request.resource.data.source == resource.data.source`). Whichever mechanism is used, the outcome — `source` never changes after creation — is the canonical requirement.

13.9. **Timestamps are never caller-supplied.** Any `created_at`, `updated_at`, or `last_confirmed_at` value present in a request SHALL be ignored; these fields are always computed by the capability itself (§16).

13.10. **`type` is immutable after creation.** On update, this capability SHALL ensure the request's `type` cannot change the persisted record's `type` — by whatever mechanism the implementation chooses (for example, never including `type` in an update operation, explicitly rejecting a request whose `type` differs from the existing record's, or an equivalent safeguard), consistent with §14.5's update-branch field list. Whichever mechanism is used, the outcome — `type` never changes after creation — is the canonical requirement.

## 14. Persistence Contract

This section defines required **properties** of the persistence mechanism. It does not mandate a specific database primitive, SDK, or adapter — more than one implementation can satisfy these properties, and selecting among them is an implementation decision (Appendix A).

14.1. **Execution environment.** This capability SHALL execute as trusted server-side code with privilege sufficient to satisfy §11.2 — it SHALL NOT execute as, or be reachable as, client-shipped code. The specific runtime, SDK, or client library used to reach the persistence layer with that privilege is an implementation decision.

14.2. **Target.** Every write SHALL address exactly one record at the canonical logical path `users/{uid}/memories/{memoryId}` (CD-C4-02) — never a newly-generated, non-deterministic identifier (§15) and never any other collection or path.

14.3. **Atomicity requirement.** The capability SHALL determine, and act on, whether the target record already exists, and SHALL apply the correct branch (§14.4 create / §14.5 update) atomically enough that a concurrent or repeated invocation cannot produce a partial write, a lost update, or a duplicate record. The specific mechanism used to achieve this — a database transaction, a compare-and-swap/precondition write, an application-level lock, or another equivalent technique — is an implementation decision (Appendix A). Whatever mechanism is chosen SHALL satisfy §17 (no partial or invalid records on failure).

14.4. **Create branch** (record does not exist): write the full record — `type`, `payload`, `confidence` (defaulted per §13.5 if omitted), `source`, `status` (always `'candidate'`, per §13.4, regardless of any value supplied), `created_at` (now), `updated_at` (now, equal to `created_at`), `last_confirmed_at` (`null`, matching existing schema default).

14.5. **Update branch** (record exists): modify **only** `payload`, `confidence` (if supplied), and `updated_at` (now) on the existing record — every other field, including `source`, `status`, `type`, and `created_at`, SHALL remain untouched. `last_confirmed_at` is not modified by this capability; it remains reserved for a future confirmation mechanism (out of scope, §21). The specific database operation used to achieve a field-scoped modification is an implementation decision.

14.6. **The existence check required by §14.3 is not a "read Typed Memory" capability.** CD-C4-13 excludes "reading Typed Memory" from C4's scope, referring to building a consumer (coach prompt, recommendation input, or similar) against existing memory content. The internal check this capability performs solely to decide its own create/update branch is a mechanism of the capability itself, not a read capability exposed to any caller or product surface — no query, list, or arbitrary-read operation is added by this SPEC.

14.7. **Retry safety.** Whether or not this capability implements automatic retry on transient failure is an implementation decision. If retries occur — whether initiated by the implementation itself, by an underlying client library, or by a caller re-invoking the capability — they SHALL NOT create duplicate or conflicting records; §15's idempotency guarantee SHALL hold across any such retry. No specific retry algorithm, attempt count, or backoff policy is mandated by this SPEC (Appendix A).

14.8. **No `firestore.rules` change (CD-C4-12).** Verified: the existing rule already denies every client request carrying `source ∈ {inferred_event, inferred_pattern, coach_generated}` via its closing default-deny fallthrough (§11.1). This capability's server-side trust (§11.2) does not depend on, and is not constrained by, Firestore Rules. No repository evidence requires a Rules change; none is made by this SPEC.

## 15. Idempotency and Deterministic Identity (CD-C4-11)

15.1. **Deterministic identity.** The capability SHALL address every record by an identity deterministically derived from `uid`, `source`, and the caller-supplied `idempotencyKey` — never by a randomly generated identifier. The same three inputs SHALL always resolve to the same record identity; different inputs SHALL always resolve to a different one. The specific string format or construction algorithm for this identity is an implementation decision (Appendix A) — not a canonical requirement.

15.2. **No duplicate records.** Because the identity is deterministic rather than randomly generated, repeated invocation with the same `(uid, source, idempotencyKey)` SHALL always resolve to, and act on, the same record — it cannot result in a second, competing record for the same logical identity. This satisfies CD-C4-11 structurally, not merely by convention.

15.3. **Identity strategy is per-caller, per B1 §7.** This SPEC does not mandate one universal algorithm for constructing `idempotencyKey` across all three sources — B1 §7 explicitly defers semantic-key strategy per memory type/domain, requiring only that duplicate competing authority is forbidden (§15.2 already guarantees this). A future caller wanting create-once/append-like semantics (e.g., a distinct event) supplies a fresh, unique `idempotencyKey` per event; a future caller wanting update-in-place/re-confirmation semantics (e.g., a recurring pattern) supplies a stable key across repeated detections of the same logical pattern. Both are valid uses of the same contract.

15.4. **Identity encoding.** Where a caller-supplied `idempotencyKey` (or the identity derived from it) contains characters unsuitable for direct use as a persistence-layer identifier, the capability SHALL sanitize or encode it safely and deterministically — the same input always producing the same safe output. The specific encoding or sanitization technique is an implementation decision (Appendix A), not a canonical requirement.

15.5. **Idempotent replay is content-safe.** A repeat invocation with the same `(uid, source, idempotencyKey)` and unchanged `payload`/`confidence` SHALL leave the record's observable state unchanged except for `updated_at` advancing (§16). A repeat invocation with a changed `payload`/`confidence` for the same identity SHALL apply the update branch (§14.5) normally — this capability does not detect or reject "same key, different content" as an error (unlike `PersistenceGateway`'s `IDEMPOTENCY_MISMATCH`, which governs a different contract); the deterministic-identity/update-branch mechanism already makes this safe by design, since it never creates a duplicate and never regresses `status`/`source`/`type`.

## 16. Timestamps

16.1. Consistent with CD-C4-10 (use the existing schema, do not redesign it), `created_at` and `updated_at` SHALL remain the same numeric-timestamp shape `js/memory.js`'s existing schema and reader already use — not a different field type. The specific server-side time source used to compute that number is an implementation decision.

16.2. Both values SHALL be computed by the capability itself, using server-side time not influenced by client input — never accepted from the caller (§13.9).

16.3. `created_at` is set exactly once, at creation (§14.4), and SHALL NOT change on any subsequent update (§14.5 never modifies it).

16.4. `updated_at` SHALL be set to the capability's current execution time on every successful write, creation or update alike.

## 17. Error and Failure Handling

17.1. **Fail closed, not open.** Unlike `anthropicProxy`'s deliberately fail-open quota check (a rate-limiting concern, not a data-integrity concern), this capability SHALL fail closed: any validation failure (§13) or persistence-layer error SHALL result in no write and a reported failure — never a silently-swallowed error and never a partially-applied record.

17.2. **No partial records.** Because §14.3 requires the existence-check and the write to be atomic enough to prevent partial or conflicting state, a failure mid-operation SHALL leave no partial or corrupt record — either the full create (§14.4) or the full field-scoped update (§14.5) applies, or nothing does.

17.3. **Distinguishable outcomes.** The capability SHALL return or resolve to a result distinguishing at minimum: `SUCCESS_CREATED`, `SUCCESS_UPDATED`, `REJECTED` (validation failure — including invalid/unauthorized `source`, invalid `type`/`confidence`/`payload`, missing required field), and `FAILED` (a persistence-layer error). Exact result shape is an implementation detail; the four outcome categories are the canonical requirement.

## 18. Testing Requirements (CD-C4-14)

Comprehensive automated coverage is mandatory before this capability may be considered implementation-complete. The capability SHALL remain verifiable without requiring a live Firestore instance (for example, via dependency injection, a mock/fake persistence interface, or an equivalent seam — the specific technique is an implementation decision), consistent with the testability precedent already established by `tests/persistenceGateway.test.js` and `tests/stateAccess.test.js`. At minimum:

18.1. **Validation.** Rejection of: missing `uid`; missing/invalid `type`; missing `payload`; non-object `payload`; out-of-range `confidence` (negative, `> 1`, non-numeric); missing `idempotencyKey`.

18.2. **Source enforcement / unauthorized source attempts.** Acceptance of a valid write for each of the three permitted sources (`inferred_event`, `inferred_pattern`, `coach_generated`) individually. Rejection of `source: 'user_stated'` and `source: 'migrated'` (client-owned sources explicitly not writable through this capability). Rejection of an arbitrary/unknown `source` string.

18.3. **Idempotency.** Two invocations with identical `(uid, source, idempotencyKey)` result in exactly one record for that identity, verified by asserting a single record exists at the resolved identity after both invocations. Two invocations differing only in `idempotencyKey` (same `uid`/`source`) result in two distinct records.

18.4. **Deterministic identity.** The same `(uid, source, idempotencyKey)` triple always resolves to the same record identity across independent invocations. Different inputs (varying any one of the three) resolve to different identities.

18.5. **Timestamps.** `created_at` is set on first creation and is unchanged by a subsequent update to the same identity. `updated_at` changes on every accepted write, create or update. A caller-supplied `created_at`/`updated_at` value in the request is verified to have no effect on the persisted value.

18.6. **Create vs. update behavior.** First write to a new identity creates a record with `status: 'candidate'` regardless of any `status` value present in the request. A second write to the same identity, where the existing record already has `status: 'active'` (simulating prior user confirmation via the existing `js/memory.js` transparency UI) or `status: 'rejected'`, does not alter `status` — verified directly against the persisted state after the second write. A second write does not alter `source`, even when the request specifies a different (still individually valid) server source for the same identity. A second write does not alter `type`, even when the request specifies a different valid `type` for the same identity.

18.7. **Failure handling.** A simulated persistence-layer error surfaces as `FAILED`, not `SUCCESS_*`, and leaves no record behind for a first-write scenario, and leaves the pre-existing record unmodified for an update scenario.

18.8. **Regression.** The full existing suite (`node --test tests/*.test.js`, baseline `1044` passed / `0` failed) continues to pass unmodified; the new test(s) are additive only.

## 19. Acceptance Criteria

1. A trusted, server-side capability exists implementing the write contract of §12, restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, targeting `users/{uid}/memories/{memoryId}` only.
2. No client-reachable interface exists that accepts arbitrary or client-selected `source`/`type`/content for these three sources and grants the effect of server authority over them (§11.4); whatever invocation surface does exist independently enforces §13 in full.
3. `js/memory.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/authorityContract.js`, `js/app.js`, every B2 engine, `index.html`, `sw.js`, and `firestore.rules` are byte-for-byte unmodified.
4. Every record this capability creates is written with `status: 'candidate'`, unconditionally; no request-supplied `status` value is ever honored at creation, for any source; no record is ever created with, or promoted to, `'active'` or any other status by this capability.
5. A record's `source`, `status`, and `type` are never altered by an update through this capability (§13.4, §13.8, §13.10).
6. Repeated invocation with the same logical identity (`uid`, `source`, `idempotencyKey`) is verified, by test, to never result in a second record for that identity.
7. Every validation, source-enforcement, idempotency, deterministic-identity, timestamp, create/update, and failure-handling requirement in §18 is covered by a passing automated test.
8. Full existing regression suite (`node --test tests/*.test.js`) passes unmodified, `1044` passed / `0` failed at minimum, with zero test amendments to any existing file.
9. No Firestore Rules change is present; the existing default-deny fallthrough for the three server sources is verified (not re-implemented) as already sufficient (§11.1, §14.8).
10. No Persistence Gateway operation, StateAccess capability, Engine Registry registration, or `AuthorityContract` field is added, removed, or modified.

## 20. Implementation Boundaries

The implementation SHALL:
- Be trusted, server-side code — never shipped to, or executable by, the client.
- Preserve `type`/`source`/`status` vocabulary identical to `js/memory.js`'s existing definitions, with no divergence (§13.2).
- Remain independently testable without requiring a live persistence instance (§18).
- Write only to `users/{uid}/memories/{memoryId}` (CD-C4-02) — no new collection is introduced.

The implementation SHALL NOT:
- Modify `js/memory.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/authorityContract.js`, `js/app.js`, any file under `js/engines/`, `js/trigger/`, `js/adaptive/`, `js/feedback/`, `index.html`, `sw.js`, or `firestore.rules`.
- Add any status-transition, promotion, supersession, or archival behavior — this capability only ever creates a `'candidate'`-status record (§13.4), or updates `payload`/`confidence`/`updated_at` on an existing one (§14.4, §14.5).
- Add any query, list, or read capability beyond the single-record existence check internal to §14.3/§14.6.
- Wire any caller, trigger, engine, or pipeline that invokes this capability in production.
- Expose a generic or arbitrary client-controlled write surface (§11.4).

**Not decided by this SPEC — implementation decisions for Engineering Readiness Review, provided the properties above and in §11–§18 hold:** the specific invocation mechanism; whether a new export is added to any file, and its name; module filename and file layout; the specific database primitive, SDK, or transaction mechanism; the deterministic-identity string format; the sanitization/encoding algorithm; and the retry implementation, if any. See Appendix A for non-binding notes.

## 21. Out of Scope / Future Work (CD-C4-13)

Coach prompt changes; reading Typed Memory (any consumer, UI, or coach-context integration); Recommendation Engine or recommendation redesign; event model redesign (`coachEvents`/C3 territory); migration of any existing data; removal of Legacy Memory (`coachMemory`); unification of the two memory systems; any new engine; any new persistence system; any new event model; any new recommendation pipeline; status-promotion mechanism (`candidate → active` or any other transition); wiring an actual production caller/producer for this capability; SessionLifecycle/REM-002 integration (structurally inapplicable to a stateless server invocation, §9); selection of a specific invocation mechanism, module layout, database primitive, deterministic-ID format, sanitization algorithm, or retry policy (§11.4, §14, §15, §20 — deferred to Engineering Readiness Review, Appendix A).

## 22. Known Limitations (Accepted, Not Resolved by This SPEC)

22.1. **No SessionLifecycle/REM-002 integration.** REM-003 §9 requires every new write path accepting LLM input to integrate with SessionLifecycle and not bypass generation guards. This capability has no such integration, because it executes as a stateless server-side invocation with no browser session to check — the same structural position `anthropicProxy` (the repository's one existing Cloud Function, and currently the only trusted server-side execution context in this project) already occupies. Recorded here for visibility, not remediated by this SPEC.

22.2. **No verification that upstream REM-003 stages occurred.** This capability cannot verify that a caller's `Validation → Business Rules → Deterministic Decision` chain (REM-003 §9) genuinely preceded its invocation — it can only enforce its own structural contract (§13). This is an accepted boundary inherent to any terminal Persistence Layer component, not unique to this SPEC.

22.3. **No status promotion mechanism exists yet.** A `'candidate'` record written by this capability has no defined path to `'active'` other than the existing `js/memory.js` UI's user-driven confirmation. Whether/how a deterministic engine might one day promote a status is future, separately-scoped work.

## 23. Closure Requirements

At C4 closure:
- All items in §19 (Acceptance Criteria) verified against the repository.
- Full regression suite (`node --test tests/*.test.js`) passes, zero unexplained failures, zero modifications to any pre-existing test file.
- New test(s) for this capability present and passing, covering every requirement in §18.
- `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`, and `docs/architecture/FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1(1).md` updated per this repository's standard closure convention (mark C4 complete, record Finding F10 as addressed, record whether any deviation from this SPEC occurred, and record the specific implementation choices made at Engineering Readiness Review for the items listed as not decided in §20).
- A Closure Record section appended to this document, following the precedent of `docs/specs/C2_SPEC_v1.1.md` and `docs/specs/C3_SPEC_v1.0.md`'s own Closure Records.
- Product/Architecture Approval recorded.
- Next task explicitly marked `NEXT` per whatever the Roadmap's post-C4 ordering specifies (not decided by this SPEC).

---

## Appendix A — Engineering Considerations (Non-Binding Implementation Notes)

**Everything in this appendix is non-canonical, subject to confirmation or replacement at Engineering Readiness Review or during implementation, and may change without a SPEC revision, provided every canonical requirement in §11–§18 remains satisfied.** Nothing here is an acceptance criterion.

- **Invocation mechanism:** possibilities include (not an exhaustive or prescriptive list) a narrowly scoped Cloud Function export invoked only by other trusted server code, a module imported directly by a future trusted caller within the same server deployment, a Firestore-triggered function reacting to a separately-validated upstream write, or a scheduled function. Any of these — or another mechanism — MAY satisfy §11.4, provided no client request can select or forge `source` for these three sources.
- **Module location/filename:** a plausible location is a new file under this project's existing `functions/` deployment (e.g., `functions/typedMemoryServerWrite.js`), since that is currently the only trusted server-side execution context in this repository — but the exact filename and layout are not canonical.
- **Atomicity mechanism (§14.3):** a database transaction (this repository already uses this general technique elsewhere, e.g., `runPatternTransaction` in `js/app.js`, cited only as precedent for the technique, not for reuse of that code) is one way to satisfy the atomicity requirement; a precondition/compare-and-swap write, or another equivalent technique, MAY also satisfy it.
- **Deterministic identity encoding (§15.1, §15.4):** one option is a fixed-prefix, sanitized string derived from `source` and `idempotencyKey` — this is a suggestion, not a mandated format.
- **Retry (§14.7):** relying on the underlying persistence client's own transient-error handling for a single logical invocation is a reasonable default; a custom bounded retry (e.g., mirroring `PersistenceGateway`'s 3-attempt policy, B4 §22) MAY be added if Engineering Review finds it necessary.
- **Execution privilege (§11.2, §14.1):** the Firebase Admin SDK is this project's existing mechanism for server-side credentials that bypass Firestore Rules; using it is a natural default given the project's current infrastructure, but is not itself elevated to a canonical requirement by this SPEC.

## Appendix B — Definition of READY / DONE

**READY for implementation:** this document, §1–§23 and Appendix A, approved as canonical by Product Owner and AI Architect (submission status: this document, header block).

**DONE (implementation exit criteria):** every item in §23 (Closure Requirements) satisfied; full regression suite passes with zero modifications to pre-existing files and zero unexplained failures; all §18 test categories present and passing; documentation synchronized per §23, including a record of which Appendix A (or equivalent) implementation choices were actually made; Closure Record appended to this document.

---

## Closure Record

**Status:** Implemented and closed. C4_SPEC v1.0 (this document, §1–§23 and Appendix A) implemented in full, per Product Review, Architecture Review, Engineering Readiness Review (including its ERR Resolution round), and final Product/Architecture closure approval.

**Implementation Summary:** One new file, `functions/typedMemoryServerWrite.js`, implements the trusted server-side Typed Memory write capability (§12–§18): `configure(deps)` / `write(request)`, restricted to `source ∈ {inferred_event, inferred_pattern, coach_generated}`, targeting `users/{uid}/memories/{memoryId}` only. Every created record is written with `status: 'candidate'` unconditionally (§9/§13.4); `source`, `status`, and `type` are immutable after creation (§13.4/§13.8/§13.10); identity is deterministic, derived from `(uid, source, idempotencyKey)` via a SHA-256-derived `memoryId` (§15); timestamps are computed only by the capability itself, via an injected clock (§16). No client-reachable interface was added — no new `exports.*` entry exists in `functions/index.js` (§11.4/§20). No caller/producer was wired (§6/§21), consistent with this SPEC's own scope boundary — the same "complete, tested, unconsumed capability" status the Habit and Pattern Engines already have for their own output. `js/memory.js`, `js/stateAccess.js`, `js/persistenceGateway.js`, `js/authorityContract.js`, `js/app.js`, `firestore.rules`, `index.html`, `sw.js`, and every existing Engine were verified byte-for-byte unmodified. No application version bump was required or made — the capability is server-side only, with no client script or `APP_VERSION` change.

**Engineering Readiness Review:** One BLOCKER (an internal contradiction between §9's absolute "always candidate on create" compliance mechanism and an earlier draft of §13.4, which permitted a caller-supplied non-default `status` at creation) and two non-blocking documentation findings (a deployment-infeasible "direct reuse of `js/memory.js`'s exports across the `functions/` deployment boundary" suggestion; an implicit rather than explicit `type`-immutability-on-update rule) were identified and resolved in the ERR Resolution revision, which is the §1–§23 text of this document. Re-verified `READY FOR IMPLEMENTATION`.

**Verification:** All ten items in §19 (Acceptance Criteria) confirmed against the repository.

**Final Test Result:** `1082` passed / `0` failed (`node --test tests/*.test.js`) — `1044` pre-existing plus `38` new (`tests/typedMemoryServerWrite.test.js`, covering §18.1–§18.7); zero existing tests modified.

**Implementation Commit:** `f026123` (`feat(c4): implement Typed Memory Server Write Path`) on `main`.

**Product Review:** Completed — Approved.

**Architecture Review:** Completed — Approved. CD-C4-01–CD-C4-14 applied in full; B1–B5, REM-003, C1–C3 contracts confirmed preserved unchanged; no Persistence Gateway, StateAccess, Engine Registry, or `AuthorityContract` code was added, removed, or refactored; no prohibited item from §5/§21 was introduced.

**Documentation Updated:** `docs/roadmap/Roadmap.md`, `docs/roadmap/Changelog.md`, `docs/architecture/FITME_AI_ARCHITECTURE_REMEDIATION_PLAN_v1(1).md`.
