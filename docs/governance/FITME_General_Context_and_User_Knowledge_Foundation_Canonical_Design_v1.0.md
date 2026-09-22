
# FITME — GENERAL CONTEXT AND USER KNOWLEDGE FOUNDATION
## v1.0 — CANONICAL / CLOSED (Freezes Policy-Based Provider Eligibility, Semantic Context Discovery, the User Knowledge Layer and its Record Contract, Concept Identity, Evidence/Confound/Confidence Model, Correction/Supersession, Consolidation/Retrieval, Relationship to Existing Components, Bootstrap/Failure/Scaling/Privacy Behavior, and the Non-Causal Invariant; No Implementation SPEC Authored Yet)

> **Document role:** Decision Package (Canonical Design). Not a SPEC. Not an implementation document. Modeled structurally on `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` (CARF) and `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` (SLDP) — the repository's established precedent for a standalone Canonical Decision Package that freezes Product/Architecture decisions ahead of implementation-SPEC authoring.
> **Prepared by:** Lead Engineer / Repository Analyst / Repository Maintainer, recording decisions approved by Product/Architecture across this conversation's four-round investigation series, without reinterpretation.
> **Repository baseline:** `main` @ `bbe29fee5615332784c4eb772a9765fae63a1108` (== `origin/main` at authoring time — the WP0 Phase E.0.1 closure commit).
> **Origin:** This Package follows four sequential, Product/Architecture-directed read-only investigations conducted after WP0 Phase E.0.1's canonical closure: (1) an initial E.0.2 Context Need Planner contract design (kind-only, closed 8-value output) — superseded; (2) a Context Architecture Full-Vision Reassessment (Architecture A/B/C/D comparison; identified the manual provider×capability `contextCeiling` matrix as the root scaling limitation) — Architecture D approved in principle but found insufficient as first framed; (3) a User Knowledge Architecture Final Investigation (generalized "Learned Relevance" into an open, evidence-backed User Knowledge Layer, with a closed `claimType` vocabulary) — approved in principle pending one contract concern; (4) a User Knowledge Contract Review (found the proposed `claimType` vocabulary was itself a disguised closed semantic taxonomy; corrected it to an open `factors[]`/concept-identity shape with only process-level closed dimensions). This Package consolidates the final, corrected outcome of all four rounds into one frozen record.
> **Purpose of this version:** Freeze the open-world/self-learning product intent, the authority model (open semantic learning + closed governed authority; semantic relevance never grants authorization), policy-based provider eligibility (replacing the enumerated `contextCeiling` matrix), Semantic Context Discovery, the User Knowledge Layer as the general learning abstraction, its final record contract (post-`claimType`-correction), the Concept Identity model, the N-ary `factors[]` relationship shape, the evidence/confidence/confound model, correction/supersession, consolidation/bounded retrieval, the relationship to every existing component this touches, bootstrap/failure/scaling/privacy behavior, and the non-causal invariant — so that E.0.2's own implementation SPEC(s) can cite this Package rather than re-deriving or re-arguing architecture already decided. This Package introduces **no new Product or Architecture decision** beyond what was already approved in this conversation prior to this authoring turn.
> **Status of this version:** **CANONICAL / CLOSED.** The Product/Architecture *direction* this Package records was approved across the conversation's four investigation rounds, culminating in explicit approval of the `claimType`-corrected architecture. This authored Package is filed as the canonical record of that approval. Does not itself authorize implementation of `js/**`. Does not implement E.0.2a-g. Does not modify runtime behavior. This version additionally incorporates the Final Canonical Closure Review: Chapter 22's former items 1-2 are resolved and frozen (Ch.06/09/15); the Safety-context vs. Safety-authority boundary is corrected (Ch.07/09/15/19) via the new `reasoningAccessAuthorized` eligibility dimension; no unresolved Product/Architecture foundation decision remains (Ch.22).

---

## Document-Wide Abbreviations

| Abbreviation | Document | Path |
|---|---|---|
| CARF | Context-Aware AI Reasoning Foundation Canonical Design v1.0 (Closed) | `docs/governance/FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md` |
| SLDP | Safety Layer Canonical Decision Package v2.6 (Closed) | `docs/governance/FITME_Safety_Layer_Canonical_Decision_Package_v2.0.md` |
| SFCD | Safety Foundation Canonical Design v1.0 (Closed) | `docs/governance/FITME_Safety_Foundation_Canonical_Design_v1.0.md` |
| WP0-D | WP0 Safety Risk Characteristic Subspec v1.0 (Phase D, Closed) | `docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md` |
| CPI-001 | Preference Intake Gate | `js/coachDecisionSystem/preferenceIntakeGate.js` |
| GCUK | This document | `docs/governance/FITME_General_Context_and_User_Knowledge_Foundation_Canonical_Design_v1.0.md` |
| R1 | Investigation Round 1 — initial (superseded) E.0.2 contract design | conversation record |
| R2 | Investigation Round 2 — Context Architecture Full-Vision Reassessment | conversation record |
| R3 | Investigation Round 3 — User Knowledge Architecture Final Investigation | conversation record |
| R4 | Investigation Round 4 — User Knowledge Contract Review (`claimType` correction) | conversation record |

Citation format: `[filename:LineN]` for code, `[Rn, §label]` for findings recorded in this conversation's investigation rounds and not yet in any other repository document.

---

# 01. Status

## Purpose

Establish the working status of this Package before its content is read, so it is never mistaken for an already-authored implementation SPEC, a completed implementation, or an authorization to implement `js/**`.

## Review State

This Package records a decision reached across four sequential investigation rounds in one conversation (R1-R4), each building on and correcting the last, culminating in explicit Product/Architecture approval of the R4-corrected architecture ("APPROVED. WP0 User Knowledge Architecture is now CANONICALLY APPROVED with the `claimType` correction from the final Contract Review."). This authored Package is the first canonical filing of that approval — it has not yet undergone a separate post-authoring Product/Architecture review pass (contrast CARF, whose Package went through two such passes after its own first authoring). This Package's own status is therefore **CANONICAL / CLOSED as a decision record**, pending the routine post-authoring confirmation this task's own return format requests.

## Canonical Interpretation

This Package freezes: the open-world/self-learning product intent and its twenty binding invariants (Ch.04); the authority model (Ch.05); policy-based provider eligibility (Ch.06); Semantic Context Discovery (Ch.07); the User Knowledge Layer as the general learning abstraction (Ch.08); its final record contract (Ch.09); Concept Identity (Ch.10); N-ary `factors[]` (Ch.11); the evidence/confidence/confound model (Ch.12); correction/supersession (Ch.13); consolidation/bounded retrieval (Ch.14); relationships to every existing touched component (Ch.15); bootstrap/failure/scaling/privacy behavior (Ch.16-19); the non-causal invariant (Ch.20); the explicit list of superseded designs (Ch.21); unresolved decisions carried forward (Ch.22); the implementation sequence at a non-binding-detail level (Ch.23); the Definition of Done for this architecture foundation (Ch.24); and explicit non-goals (Ch.25).

## Explicit Non-Interpretations

This Package does not author, and is not, an implementation SPEC. It does not authorize implementation of `js/**`, `tests/**`, or any runtime file. It does not modify CARF, SLDP, SFCD, WP0-D, or any other closed canonical document — it is additive and, where it touches the same subject matter as CARF (Reasoning Context ownership, Ch.07 of CARF), it explicitly extends rather than restates or contradicts it (see Ch.15). It does not implement E.0.2a through E.0.2g. It does not select exact field names, storage collection names, or Firestore schema — those are implementation-SPEC-level decisions this Package deliberately leaves to the next authoring step, consistent with CARF's own precedent of freezing architecture without freezing implementation detail.

## Repository Gaps

None introduced by this chapter. The architecture this Package records remains entirely unimplemented as of this Package's authoring — see Ch.23/24.

---

# 02. Purpose

FITME's product direction requires the coaching-reasoning system to understand an open-ended, unenumerable range of user lives, situations, and data sources, and to progressively learn each user's own individual patterns and relationships — without Product/Engineering maintaining exhaustive taxonomies, situation rules, provider×capability relevance matrices, or per-user semantic mappings. Reaching a workable architecture for this required investigating and rejecting three successively more sophisticated but still-insufficient designs (a closed-vocabulary-only context planner, a provider-descriptor-only semantic discovery layer, and a narrowly-scoped "learned provider relevance" layer with its own closed `claimType` vocabulary) before arriving at the corrected, open-world-safe design this Package freezes. This Package records that outcome canonically, once, so that WP0 Phase E.0.2's own implementation SPEC(s) inherit a stable, cited foundation rather than re-arguing architecture already settled across four investigation rounds.

---

# 03. Background — The Investigation Series and the Approved Product Direction

## R1 — Initial E.0.2 Context Need Planner (superseded)

Proposed a bounded interpreter (`planContextNeeds()`) whose sole output was a subset of the 8 `CONTEXT_RELEVANCE_KINDS` values established in WP0 Phase E.0.1. Rejected in R2: a fixed 8-value output vocabulary cannot disambiguate among many providers sharing one coarse kind, and does not scale as the provider catalogue grows.

## R2 — Context Architecture Full-Vision Reassessment

Investigated Architectures A (current manual `contextCeiling`), B (static provider-descriptor semantic discovery only), C (relevance-kind + descriptor hybrid), and D (self-learning semantics + deterministic authorization). Found the enumerated, per-capability `contextCeiling` array (`CapabilityDeclaration.contextCeiling`, [capabilityRegistry.js:112-114]) to be the root scaling limitation: it conflates "is this provider ever eligible for this capability" (governance) with "is this provider relevant to this Need" (semantics) into one hand-maintained list — the literal provider×capability matrix Product identified as unacceptable. Recommended Architecture D in principle. Found three existing, already-proven repository precedents directly reusable for it: Typed Memory's `candidate/active/superseded/rejected/archived` status lifecycle with `user_stated`/`inferred_*` source distinction ([memory.js:45-49]); the Habit/Pattern engines' deterministic, evidence-threshold, confidence-inertia learning mechanism ([habitEngine.js:38-43,295], [derivedIntelligenceConsumer.js:55]); and WP0 Phase D's "AI proposes, deterministic gate governs, durable record persists with provenance and governed correction" discipline.

## R3 — User Knowledge Architecture Final Investigation

Product correction: Architecture D's "Learned Relevance Layer" (ranking which providers are useful) was necessary but insufficient — FITME must build a rich, evolving understanding of the user's life and the relationships within it, not merely rank registered providers. Generalized Layer 3 into a "User Knowledge Layer": evidence-backed relationship records, of which provider-usefulness is one ordinary instance, not the primary abstraction. Proposed a closed `claimType` meta-vocabulary (`EXPLICIT_FACT`, `OBSERVED_EVENT`, `OBSERVED_ASSOCIATION`, `HYPOTHESIS`, `RECURRING_PATTERN`, `GLOBAL_PREFERENCE`, `CONTEXTUAL_PREFERENCE`, `TEMPORARY_STATE`) to distinguish authority/kind. Explicitly cautioned against reusing Habit/Pattern's exact numeric thresholds (`OCC_CANDIDATE=3`, `OCC_CONFIRMED=5`, `INERTIA=0.6`) without re-derivation, since they are calibrated for single-variable, roughly-daily-cadence recurrence, not multi-variable relationship inference.

## R4 — User Knowledge Contract Review (`claimType` correction)

Narrow, final review of the R3 `claimType` proposal. Found — by testing each of its 8 values against "what deterministic behavior actually depends on this" — that every value was either fully redundant with an already-present orthogonal field (`source`+`status`, confidence-as-a-continuum, evidence shape, temporality) or was itself a disguised semantic judgment about content (deciding "which of these 8 buckets does this belong to" is a content-admission gate, precisely the failure mode the whole investigation exists to prevent). Corrected the design: removed `claimType` entirely; replaced the binary `subject`/`relatedTo` pair with an open, N-ary `factors[]` array (role-tagged: `condition`/`subject`/`outcome`); added a per-user, AI-resolved Concept Identity model to prevent free-text concept drift; retained only process-oriented, structurally-exhaustive closed dimensions (`evidenceClass`, `temporality`, `role`, plus reused `source`/`status`). Self-tested each surviving closed dimension against "would a new value ever be needed because of a new *user concept*, or only because of a new *evidence method or governance requirement*" — all passed on the governance side only.

## The Approved Product Direction (this conversation, verbatim intent preserved)

Product/Architecture approved: the User Knowledge Layer, generalized per R3-R4, is the canonical learning abstraction — provider relevance is one instance inside it, not a separate mechanism. Open semantic learning is paired with closed governed authority: FITME may learn meaning, relationships, relevance, patterns, and user-specific knowledge; it may never self-authorize access, permissions, privacy, Safety, mutations, network access, credentials, or external actions. The manually enumerated `contextCeiling` provider×capability matrix is replaced by deterministic policy-based eligibility. `CONTEXT_RELEVANCE_KINDS` remains coarse governance/fallback metadata — never the semantic language or admission boundary of user knowledge. There is no stored closed `claimType`; the final contract uses open per-user concept identity, N-ary `factors[]`, open `relationDescription`, evidence, `evidenceClass`, `temporality`, confidence, `status`, `source`, Safety/governance metadata, provenance, and correction history. Closed fields describe authority/process/governance only; open fields describe what the user's life and relationships actually mean. Concept identity is per-user and open-world, with governed, logged, reversible merges. Learned relationships support N-ary conditions, not forced binary edges. Learned relationships are evidence-backed with supporting/contradicting evidence, confounds, confidence, recency, provenance, correction, and supersession. Habit/Pattern numeric thresholds are not reused blindly. Persisted learned knowledge never makes causal claims. Explicit user correction outranks inferred knowledge. Raw lifetime history is never loaded into every reasoning turn; higher-level User Knowledge is consolidated and selectively retrieved. Semantic Context Discovery retrieves bounded relevant context *and* bounded relevant User Knowledge. Safety remains independently authoritative, unweakened, and never made dependent on learned User Knowledge. New technical integrations may legitimately require one-time engineering, authorization, and governance; once approved, humans must not manually enumerate every situation/capability/user relationship in which the resulting information may be useful. The architecture must pass the non-negotiable test: if 100,000 new, differently-living users join tomorrow, Product/Engineering must not need to add categories, semantic mappings, relevance rules, or situation rules merely for FITME to understand their different lives.

---

# 04. Product Intent and Binding Invariants — FROZEN

## Purpose

Record, verbatim in substance, the twenty binding canonical principles approved for this architecture, as the single normative list this Package and its future implementation SPEC(s) must satisfy.

## Frozen Content

1. FITME is open-world and self-learning; Product/Engineering must not maintain exhaustive user-world taxonomies, situation rules, provider×capability relevance matrices, or per-user semantic mappings.
2. Open semantic learning + closed governed authority: FITME may learn meaning, relationships, relevance, patterns, and user-specific knowledge; it may not self-authorize access, permissions, privacy, Safety, mutations, network access, credentials, or external actions.
3. Semantic relevance never grants authorization.
4. The manually enumerated provider×capability `contextCeiling` model is replaced by deterministic policy-based eligibility.
5. `CONTEXT_RELEVANCE_KINDS` remains coarse governance/fallback metadata — never the semantic language or admission boundary of user knowledge.
6. The User Knowledge Layer is the general learning abstraction; provider relevance is only one possible learned relationship inside it.
7. There is no stored closed `claimType`.
8. Closed fields describe authority/process/governance only; open fields describe what the user's life and relationships actually mean. A novel user concept or relationship must never require an enum/schema change.
9. Concept Identity is per-user and open-world: FITME may resolve aliases, reuse `conceptId`s, create new `conceptId`s, govern merges, and evolve relationships between concepts, without a Product-maintained exhaustive ontology.
10. Concept merge/correction is governed, logged, and reversible.
11. User Knowledge supports N-ary relationships; it must not force real-world relationships into binary A→B edges.
12. Learned relationships are evidence-backed: supporting evidence, contradicting evidence, confounds, confidence, recency, provenance, correction, supersession.
13. Habit/Pattern numeric thresholds are not reused blindly; only proven structural principles are reused where appropriate.
14. Persisted learned knowledge must not make causal claims; association/correlation/hypothesis remains distinct from causation.
15. Explicit user correction outranks inferred knowledge.
16. Raw lifetime history is not loaded into every reasoning turn; raw observations remain available as evidence/history; higher-level User Knowledge is consolidated and selectively retrieved.
17. Semantic Context Discovery retrieves bounded relevant context and bounded relevant User Knowledge.
18. Safety remains independently authoritative and is not weakened or made dependent on learned User Knowledge.
19. New technical integrations may legitimately require one-time engineering, authorization, and governance; once approved information is available, humans must not manually enumerate every situation/capability/user relationship in which it may be useful.
20. Non-negotiable test: if 100,000 new, differently-living users join tomorrow, Product/Engineering must not need to add categories, semantic mappings, relevance rules, or situation rules merely for FITME to understand their different lives.

## Explicit Non-Interpretations

These are product/architecture invariants, not an implementation checklist — satisfying them at the SPEC/implementation level is deferred to E.0.2's own future SPEC authoring (Ch.23).

---

# 05. Authority Model — FROZEN

## Purpose

Fix the boundary between what FITME may learn and what it may never self-grant, as the single authority test governing every mechanism in this Package.

## Frozen Content

**FITME owns, deterministically and exclusively, at all times:** source authorization; user consent; privacy; sensitive-data access; Safety (independently, per WP0-D, per SLDP/SFCD, unweakened — Ch.19); source trust; persistence permissions; state mutation; external actions; credentials; network/API permissions.

**The semantic/learned layers (Semantic Context Discovery, Ch.07; the User Knowledge Layer, Ch.08) may only ever narrow or rank *within* an already-authorized set** that the deterministic eligibility layer (Ch.06) computed first. They can never expand it, invent a provider, invent access, or produce anything shaped like a permission. Every AI output in this architecture is a **proposal, never authority** — the same posture `StandardProposalContract`'s `riskCharacteristicTags`/`mutationProposal` already have ([standardProposalContract.js:55]) and WP0-D's own "an AI-proposed severity/diagnosis must never become durable factual authority" discipline already establishes.

This boundary is enforced structurally, by **ordering**, never by trust: deterministic eligibility computation always runs before any AI reasoning about relevance, and deterministic re-validation of any AI output always runs before any fetch, mutation, or persistence.

---

# 06. Policy-Based Provider Eligibility — FROZEN

## Purpose

Replace the enumerated, hand-maintained `contextCeiling` id list per `CapabilityDeclaration` ([capabilityRegistry.js:112-114], consumed unchanged today by `ContextRelevancePlanner.select()`) with a deterministic policy evaluated against provider metadata.

## Frozen Content

A provider is registered once per genuinely new technical source (schema adapter, consent, privacy classification — Ch.19's "New Source Principle"), declaring closed, deterministic eligibility metadata: sensitivity tier, required consent scope, and `relevanceTags` (the existing, unchanged `CONTEXT_RELEVANCE_KINDS`, Ch.05 of the WP0 Phase E.0.1 closure). **Eligibility for a given capability + user + consent-state is computed from this metadata by a policy function at resolve time, never read from a hand-maintained per-capability array.** Adding a capability never requires editing every provider; adding a provider never requires editing every capability. `contextCeiling` MAY remain, transitionally, as an explicit override/cap while the policy path is verified for equivalence against it (zero-drift proof, the same discipline `trrCapabilityAdapter.js`'s own migration used).

**The eligibility policy's dimensions are frozen as four orthogonal, deterministic fields — `sensitivityTier`, `consentScope`, `capabilityRiskTier`, and `reasoningAccessAuthorized`** — never as a fifth, content-shaped taxonomy. The first three gate whether a provider is eligible for a capability/user/consent-state at all (this chapter's own core mechanism, above). `reasoningAccessAuthorized` is a distinct, additional dimension governing whether an already-eligible, Safety/medical-adjacent fragment may specifically be made available to *reasoning* (Ch.07/19) — it is set only by deterministic privacy/consent/governance logic and can never be set, inferred, or granted by AI reasoning or by Semantic Context Discovery itself. The existence and authority role of these four dimensions is canonical; their exact policy values and evaluation rules remain an implementation-SPEC-level decision (Ch.22).

---

# 07. Semantic Context Discovery — FROZEN

## Purpose

Fix the shape of the open, AI-assisted, advisory-only relevance-proposal mechanism that operates inside whatever Ch.06 already made eligible.

## Frozen Content

Given the current Need and the closed set Ch.06 computed, a bounded interpreter (same family as `riskCharacteristicInterpreter.js`: `configure({callClaude})`, stateless, one call/one attempt/no retry, fixed timeout, fail-closed) is shown a **presented, per-call, closed candidate catalogue** — bounded provider descriptors (`{id, description, relevanceTags}`, never data, never internals) — and proposes a subset of exactly those presented ids. **Deterministic re-validation** requires every proposed id to be a literal member of *that exact call's own* presented candidate list (a call-scoped membership check, stronger than a global vocabulary check) — an unknown/hallucinated id is silently dropped, never a whole-call failure. `SAFETY_AND_MEDICAL`-tagged providers, and any `safetyFlag:'SAFETY_ADJACENT'` User Knowledge record (Ch.09/12), are excluded from this candidate catalogue entirely (never shown to the model at all) — the discovery mechanism never decides, and is never asked to decide, whether reasoning may access them. This is the same two-tier mechanism throughout this Package: **semantic relevance never grants access.** They may still reach reasoning, but only through deterministic, authorized `contextBaseline`-style inclusion, gated by the `reasoningAccessAuthorized` eligibility dimension (Ch.06) — never by this discovery mechanism's own output. When `reasoningAccessAuthorized` is not established for a given fragment, it is excluded from reasoning entirely, the same conservative default WP0-D's own `NOT_ESTABLISHED` severity handling already uses. Phase D's own independent, unconditional Candidate-level Safety characterization (Ch.19) is unaffected either way, regardless of whether reasoning ever saw the fragment. On any failure (timeout/outage/malformed output), the mechanism's contribution to selection is simply empty — `ContextRelevancePlanner.select()`'s existing, unmodified baseline/needShapeDefaults/tag-overlap mechanisms proceed exactly as they do today (Ch.17).

---

# 08. User Knowledge Layer — General Learning Abstraction — FROZEN

## Purpose

Fix the Layer's role and its relationship to Ch.07, correcting R2's original, too-narrow "Learned Relevance Layer" framing.

## Frozen Content

The User Knowledge Layer is the **single, general, open-content learning abstraction** for everything FITME progressively learns about a specific user: relationships between physical state, behavior, schedule, environment, and outcomes; situational (not merely global) preferences; recurring constraints; changes in routine; and — as one ordinary instance among these, never a separately-designed mechanism — which available context tends to be useful for which kind of Need. Semantic Context Discovery (Ch.07) draws on **two symmetric, bounded candidate catalogues** when reasoning about relevance: provider descriptors (Ch.06/07) and a small, deterministically pre-filtered top-K set of the user's own relevant User Knowledge records (Ch.14) — never the whole store, never raw history.

---

# 09. Final User Knowledge Record Contract — FROZEN

## Purpose

Freeze the corrected record shape from R4, superseding R3's closed-`claimType` proposal in full (Ch.21).

## Frozen Content

```
{
  factors: [
    { conceptId, role: 'condition'|'subject'|'outcome', valueDescription }
  ],
  relationDescription: <open, bounded prose>,
  evidence: {
    supporting: [ <observation/turn references> ],
    contradicting: [ <observation/turn references> ],
    confoundsConsidered: [ <conceptId or free-text alternative explanation> ]
  },
  evidenceClass: 'SINGLE_OBSERVATION'|'CO_OCCURRENCE'|'RECURRENCE'|'EXPLICIT_STATEMENT',
  temporality: 'DURABLE'|'TEMPORARY'|'RECURRING_WINDOW',   // + optional expiresAt
  confidence: number,
  status: 'candidate'|'active'|'superseded'|'rejected'|'archived',
  source: 'user_stated'|'inferred_event'|'inferred_pattern'|'coach_generated'|'migrated',
  safetyFlag: 'STANDARD'|'SAFETY_ADJACENT',
  provenance, createdAt, lastEvidenceAt, correctionHistory: [...]
}
```

`status` and `source` are reused verbatim from Typed Memory's existing vocabulary ([memory.js:45-49]) — no new authority system is introduced alongside the one already governing Typed Memory. There is **no `claimType` field.** What R3's vocabulary attempted to express is now a *derived view* over this shape (e.g., "is this an explicit fact" = `source==='user_stated' && status==='active'`; "is this contextual" = `factors` contains a `condition`-role entry) for prose/explanatory purposes only — never a stored, closed choice a writer must make.

`safetyFlag:'SAFETY_ADJACENT'` marks a record as requiring the elevated `reasoningAccessAuthorized` eligibility check (Ch.06/07) before it may reach reasoning — it is a content-sensitivity/governance marker, never an unconditional prohibition on reasoning access, and never itself a Safety authority determination (Ch.19).

## Explicit Non-Interpretations

User Knowledge inherits Typed Memory's existing *authority model* — `source`/`status` gate writability and authority exactly as they already do for Typed Memory (Ch.15) — as a frozen canonical decision. The exact *physical* storage location (a new Typed Memory `MEMORY_TYPES` entry vs. a dedicated sibling collection under the identical security-rule family) remains an implementation-SPEC-level decision, not frozen here — see Ch.15/22.

---

# 10. Concept Identity Model — FROZEN

## Purpose

Prevent free-text concept drift (`"sleep"` / `"sleep_duration"` / `"hours slept"` / `"last night's sleep"` silently becoming four unrelated concepts) without a Product-maintained world ontology.

## Frozen Content

A small, **per-user** Concept Identity store: `{conceptId, userId, labels: [...], createdAt, mergedInto?}`. At write time, a bounded interpreter resolves each mentioned concept against the user's own **existing, bounded** concept list, using the same closed-candidate-selection discipline already frozen for provider discovery (Ch.07): a match reuses the existing `conceptId` and appends the new phrasing to `labels`; no match creates a new `conceptId`. No Product-maintained synonym table or world taxonomy is introduced. A later-discovered equivalence, overlap, or hierarchy between two concepts is a **governed merge** (`mergedInto`, logged, reversible — never a silent delete) or, for hierarchy specifically, an ordinary User Knowledge record whose `factors` are two `conceptId`s (concept-to-concept and concept-to-behavior relationships share one representation, Ch.11).

---

# 11. N-ary Factors / Multi-Condition Relationships — FROZEN

## Purpose

Ensure real-world relationships involving more than two variables are representable without information loss.

## Frozen Content

`factors[]` (Ch.09) is an array of `{conceptId, role, valueDescription}`, not a fixed-arity pair. A binary relationship is the degenerate 2-factor case; an N-factor relationship (e.g., "when sleep is short AND a night shift occurred, evening training quality tends to be lower") is three factors on one record, not three separate binary edges or a lossy approximation. `role` is a 3-value, purely structural, grammatical tag (`condition`/`subject`/`outcome`) — it describes a relationship's internal grammar, never its content, and is self-tested (Ch.20 of R4, restated Ch.20 below) against ever needing a new value for a new user concept.

---

# 12. Evidence / Confidence / Confound Model — FROZEN

## Purpose

Fix how FITME tracks and gates the strength of a learned relationship, explicitly not by reusing Habit/Pattern's exact numeric thresholds.

## Frozen Content

`evidence.supporting`/`evidence.contradicting` hold references (never copies) to existing observations/turns. `evidence.confoundsConsidered` logs plausible alternative explanations for the same observation window (e.g., a shift-schedule flag co-occurring with a sleep-training association) — **a genuinely new mechanism**, absent from `habitEngine.js`/`patternEngine.js`, which track single-variable recurrence only, not multi-variable disambiguation. **Confidence promotion is gated on confound-awareness**: a relationship whose supporting evidence is equally well explained by a logged, equally-plausible confound is capped below promotion threshold, however many raw occurrences it has, until evidence actually discriminates between the explanations.

`evidenceClass` (`SINGLE_OBSERVATION`/`CO_OCCURRENCE`/`RECURRENCE`/`EXPLICIT_STATEMENT`) and `temporality` (`DURABLE`/`TEMPORARY`/`RECURRING_WINDOW`) are the two closed, structurally-exhaustive, process-only dimensions carried over from R4's correction — both describe *how evidence was gathered or how long it stays valid*, never *what the relationship is about*, and both were explicitly self-tested (R4) against needing a new value merely because a new user situation appeared.

**What transfers structurally from Habit/Pattern engines, and what does not** (binding, per Product's explicit instruction not to reuse thresholds blindly):

| Reused as *principle/shape* | Not reused (numeric/mechanism-specific) |
|---|---|
| Lifecycle-state shape (candidate → ... → active → weakening → ...) | The exact constants `OCC_CANDIDATE=3`, `OCC_CONFIRMED=5`, `INERTIA=0.6`, `PE_WINDOW=90` ([habitEngine.js:38-43], [patternEngine.js:37-40]) — calibrated for single-variable, roughly-daily-cadence recurrence, not multi-variable relationship inference |
| Inertia principle ("a single new observation cannot flip a conclusion") | The single-variable occurrence-counting mechanism itself — a relationship needs paired/co-occurrence evidence tracking plus confound-awareness, which `habitEngine.js`/`patternEngine.js` do not do |
| Governed correction/supersession ordering (write new, then supersede old — never the reverse), from WP0-D §D.5 | A universal decay window — decay/staleness horizons are calibrated per relationship type (a sparse-evidence relationship like travel×nutrition needs a longer horizon than a near-daily one) |

---

# 13. Correction, Supersession, and Explicit-Correction Priority — FROZEN

## Purpose

Fix how an explicit user correction reshapes already-learned knowledge.

## Frozen Content

Directly reuses WP0 Phase D.5's governed replacement/correction discipline, generalized beyond Safety facts: a correcting user statement is classified by a bounded interpreter as an explicit, unambiguous correction targeting a specific existing record; if confirmed, that record transitions to `status:'superseded'` (never silently deleted — inspectable via `correctionHistory`), and the new explicit statement is captured as its own record with `source:'user_stated'` — outranking any amount of accumulated inferred evidence by construction (authority is carried by `source`, Ch.09, not by evidence volume). The superseded record MAY carry the user's own confound explanation into `evidence.confoundsConsidered`, directly improving future confound-detection (Ch.12) rather than merely discarding the disproven record.

---

# 14. Consolidation and Bounded Retrieval — FROZEN

## Purpose

Fix how raw observations become higher-level User Knowledge, and how that knowledge is retrieved without loading lifetime history per turn.

## Frozen Content

Raw observations (workouts, meals, sleep, conversation turns) remain exactly where they already are today (existing StateAccess-backed operational data) — **no new store duplicates them.** A bounded interpreter, run on a triggered/periodic cadence (never inline with a reasoning turn), consolidates recent observations into new or updated User Knowledge records, using the confound-aware evidence model (Ch.12). Per-turn retrieval never loads raw history or the whole User Knowledge store: Semantic Context Discovery (Ch.07) is presented only a small, deterministically pre-filtered top-K set of records relevant to the current Need (by concept/keyword overlap, recency, or confidence ranking), validated and fetched through the same bounded mechanism already governing provider context (Ch.07/Ch.06) — **one retrieval architecture serves both raw provider context and consolidated User Knowledge**, never two parallel systems.

---

# 15. Relationship to Existing Components — FROZEN

## Purpose

Fix, for each named existing component, whether it is extended, reused-by-reference, or left untouched.

## Frozen Content

| Component | Relationship |
|---|---|
| `ContextComposer` ([contextComposer.js]) | Extended: gains provider `description` metadata and a candidate-descriptor query function (Ch.07); `_providers` catalogue and `assemble()` unchanged in shape |
| `ContextRelevancePlanner` ([contextRelevancePlanner.js]) | Extended additively: one new union member for validated discovery-mechanism output (Ch.07); existing baseline/needShapeDefaults/tag-overlap mechanisms and its binding deterministic/AI-free invariant are unchanged |
| `ContextFragmentProvider` contract | Extended additively (optional `description` field); backward-compatible, same pattern as `relevanceTags`'s own Phase E.0.1 addition |
| `CONTEXT_RELEVANCE_KINDS` | Unchanged; role reinterpreted (not redefined) as coarse governance/fallback metadata only (invariant 5, Ch.04) — not reopened without contradiction, and none was found |
| `CapabilityRegistry` ([capabilityRegistry.js]) | Unchanged; this Package concerns only what optional context a resolved capability may see, never how a capability itself is matched |
| `GeneralReasoningCapability` | Extended: gains the eligibility/discovery integration point (Ch.06/07), mandatory Safety-tier baseline widening (Ch.19); remains non-user-reachable pending Phase E, unchanged |
| `MemoryLayer` ([memoryLayer.js]) | Unchanged; remains the sole raw pipelineContext assembly authority (D3 §8.1/§11.1, cited at [memoryLayer.js:10-16]) |
| Typed Memory ([memory.js]) | Extended by reference: the User Knowledge record family (Ch.09) reuses its existing `status`/`source` lifecycle *and write-authority discipline* verbatim — `source` values `inferred_event`/`inferred_pattern`/`coach_generated` are never client-writable, exactly as `CLIENT_WRITABLE_SOURCES` already enforces ([memory.js:49]), and are writable only by the governed server-side consolidation pathway (Ch.14); no redesign of its existing types/write paths. This reuse is now the frozen canonical decision required by `memory.js`'s own governance note ([memory.js:12-13]); exact physical storage location remains SPEC-level (Ch.09/22) |
| Habit Engine / Pattern Engine ([habitEngine.js], [patternEngine.js]) | Unchanged, not replaced or subsumed; remain the authoritative mechanism for single-variable behavioral recurrence; reused by *reference* (a `RECURRING_PATTERN`-shaped User Knowledge record may cite an existing Habit/Pattern record as supporting evidence) and by *structural principle only*, never by numeric threshold (Ch.12) |
| CPI-001 ([preferenceIntakeGate.js]) | Unchanged; its authorization-gate pattern (validate → business rule → mandatory Safety veto) is reused *structurally* for the correction pathway (Ch.13); its own closed, narrow `PREFERENCE_CLASSES` vocabulary is explicitly not a template for User Knowledge content (Ch.21) |
| Safety / WP0 Phase D | Fully unchanged and independently authoritative (Ch.19); `SAFETY_AND_MEDICAL`-tagged providers and any `safetyFlag:'SAFETY_ADJACENT'` User Knowledge record are excluded from Semantic Context Discovery's own AI-facing candidate list entirely, never merely deprioritized — but may still reach reasoning through deterministic, `reasoningAccessAuthorized`-gated baseline-style inclusion (Ch.06/07); Phase D's own independent Candidate-level characterization is unconditional and unaffected either way |
| CARF ([FITME_Context_Aware_AI_Reasoning_Foundation_Canonical_Design_v1.0.md]) | Sibling, unmodified. This Package extends, and is consistent with, CARF's own "Reasoning Context ownership" principle (CARF Ch.07) and its binding rule that reasoning context "must be bounded and need-relevant, never a full-profile dump" — this Package's bounded dual-catalogue retrieval (Ch.14) is the concrete mechanism satisfying that rule for the open-world/self-learning case CARF itself did not need to solve |

## Repository Gaps

None found that contradict any closed canonical document — see Ch.26.

---

# 16. Bootstrap Behavior — FROZEN

## Frozen Content

A brand-new user has an empty User Knowledge store. The architecture still functions from turn one via policy-based eligibility (Ch.06, no learning required) and Semantic Context Discovery reasoning over static, authored provider descriptions (Ch.07, no learning required), plus the existing deterministic floor (baseline/needShapeDefaults/tag-overlap, unchanged from WP0 Phase E.0.1). Personalization (User Knowledge accumulation, Ch.08-14) is strictly additive on top and never a precondition for basic, safe function — mirroring how `habitEngine.js` already behaves today: a habit starts `observed` and only strengthens with evidence; its absence never blocks the app.

---

# 17. Failure Behavior — FROZEN

## Frozen Content

Any failure of Semantic Context Discovery (Ch.07) or of User Knowledge retrieval (Ch.14) — timeout, outage, malformed output, an unknown/out-of-candidate id — degrades that mechanism's contribution to an empty set. No new deferral/refusal mode is introduced; `ContextRelevancePlanner.select()`'s existing, unmodified deterministic mechanisms proceed exactly as they do today. This mirrors `ContextComposer.assemble()`'s own existing, binding contract: only `requiredContext` ever gates viability; nothing in this Package's mechanisms is ever placed in `requiredContext`.

---

# 18. Scaling Behavior — FROZEN

## Frozen Content

Policy-based eligibility (Ch.06) keeps per-new-source engineering cost at registration-time only (O(1) per source, never O(capabilities)). User Knowledge storage per user is bounded by consolidation (Ch.14), analogous to existing capped per-user storage (`MAX_HABITS=60`-style precedent, [habitEngine.js:35]) — not an ever-growing raw log. Per-turn Semantic Context Discovery cost depends on the eligible candidate set size for one capability+user, never on total user count or total catalogue size. Personalization divergence between two users with identical available sources arises purely from each user's own independently-accumulated evidence (Ch.12) — no per-user code path is ever written, mirroring how `habitEngine.js` already produces different habits for different users from identical code today.

---

# 19. Privacy and Consent — FROZEN

## Frozen Content

Semantic Context Discovery (Ch.07) and User Knowledge retrieval (Ch.14) receive only small, bounded inputs (the current Need's own bounded description; a pre-filtered top-K candidate set) — never the full stored context, never raw lifetime history, never live data embedded in a provider description (descriptions are static, engineering-authored text).

`SAFETY_AND_MEDICAL`-tagged providers and `safetyFlag:'SAFETY_ADJACENT'` User Knowledge records are withheld from *Semantic Context Discovery's own candidate exposure* entirely — their existence is never revealed to that discovery mechanism, and it is never asked to decide, and can never decide, whether reasoning is allowed to see them. This is distinct from whether *reasoning itself* may ever receive such a fragment: deterministic, governed authorization — the `reasoningAccessAuthorized` eligibility dimension (Ch.06), evaluated from consent/privacy/governance rules before any AI reasoning ever runs — may make an already-authorized fragment available to reasoning via the same baseline-style deterministic inclusion mechanism already used for mandatory context (Ch.07). The binding invariant is exactly three-part: **semantic relevance never grants access; deterministic authorization may make authorized sensitive/Safety-adjacent context available to reasoning; Phase D's own independent, unconditional Candidate-level Safety characterization (WP0-D) remains authoritative regardless of what reasoning did or did not see.** Consent scope is a first-class, deterministic eligibility input (Ch.06), evaluated before any AI reasoning about relevance ever runs.

---

# 20. Non-Causal Invariant — FROZEN

## Frozen Content

No field in the User Knowledge record contract (Ch.09) ever asserts causation. `evidence`/`evidenceClass`/`confidence` are structurally correlation-only; `relationDescription` is free prose but is never validated or treated as a causal claim by any downstream consumer. This directly reuses WP0 Phase D's own binding precedent that an AI-proposed diagnosis/severity must never become durable factual authority (D.3) and that relation authority is never severity authority (D.6.1). Any causal-sounding language a reasoning capability might produce in its own output prose remains subject to the same, unmodified Safety/Expression review every other reasoning output already receives — this Package adds no new bypass.

---

# 21. Superseded Designs — Explicit List

## Purpose

Per explicit Product instruction, mark every earlier-considered design as superseded rather than leaving it ambiguously "also valid."

## Superseded (do not implement)

1. **Kind-only `ContextNeedPlanner` architecture (R1)** — a bounded interpreter whose sole output was a subset of the 8 `CONTEXT_RELEVANCE_KINDS`. Superseded by policy-based eligibility + descriptor-driven Semantic Context Discovery (Ch.06/07).
2. **Manual provider×capability `contextCeiling` matrix as final architecture** — superseded by Ch.06. (`contextCeiling` may persist transitionally as a verified-equivalent override during migration, never as the final mechanism.)
3. **"Architecture C" (relevance-kind + static descriptor hybrid) as final architecture (R2)** — a genuine, correct stepping stone, not discarded work, but not the final architecture; superseded by the full Ch.06-14 design, which adds policy-based eligibility and the User Knowledge Layer it lacked.
4. **A narrow "Learned Relevance Layer" as the primary persisted learning abstraction (R2's own original Layer 3)** — superseded by Ch.08: provider relevance is one instance inside the general User Knowledge Layer, never a separately-designed abstraction.
5. **The closed `claimType` vocabulary (R3)** — `EXPLICIT_FACT`/`OBSERVED_EVENT`/`OBSERVED_ASSOCIATION`/`HYPOTHESIS`/`RECURRING_PATTERN`/`GLOBAL_PREFERENCE`/`CONTEXTUAL_PREFERENCE`/`TEMPORARY_STATE` as a stored field — superseded by Ch.09's `factors[]`/`evidenceClass`/`temporality`/`source`/`status` decomposition (R4).
6. **The binary `subject`→`relatedTo` relationship shape (R3)** — superseded by Ch.11's N-ary `factors[]`.
7. **Blind reuse of Habit/Pattern's exact numeric thresholds (`OCC_CANDIDATE=3`, `OCC_CONFIRMED=5`, `INERTIA=0.6`, `PE_WINDOW=90`) for User Knowledge evidence gating** — superseded by Ch.12: only the lifecycle shape and the inertia *principle* are reused; the evidence/confidence model itself is new and confound-aware.

None of items 1-7 should be cited as current or partially-valid architecture in any future SPEC; where useful history is worth preserving, cite this chapter, not the original conversation turn.

---

# 22. Remaining SPEC-Level Decisions (Not Architecture-Level — Carried Forward)

## Purpose

Following the Final Canonical Closure Review, isolate the decisions that remain genuinely open — none of which is a Product/Architecture *foundation* decision. Storage authority (formerly item 1) and eligibility-dimension architecture (formerly item 2) are now resolved and frozen at Ch.06/09/15 respectively and are no longer listed here.

## Open Items (Implementation/SPEC-Level Only)

1. **Confound-tracking implementation scope for the first implementation phase** (Ch.12, E.0.2e) — whether the full confound-aware evidence model ships in the first implementation pass, or a simpler first-pass confound-check is used first (still satisfying Ch.12's binding minimum: no record reaches `active`/confirmed status without some confound-check having run) with fuller sophistication deferred, is a scheduling/sequencing call, not an architecture question.
2. **Consolidation cadence policy** (Ch.14) — event-triggered vs. periodic vs. hybrid is a freshness/cost tradeoff with no privacy, Safety, or authorization implication.
3. **Feedback-signal trust calibration details** — the relative weighting of accepted/rejected-proposal signals vs. downstream-outcome signals (both already subordinate to explicit correction, Ch.13, which is frozen) is a calibration detail; no outcome of this calibration can ever escalate learned knowledge beyond advisory status (Ch.05/08).
4. **Whether `ContextRelevancePlanner.select()` gains its new union member in place, or via a sibling function** — a pure code-structure preference with no behavioral, authority, or governance implication.

## Canonical Statement

**No unresolved Product/Architecture foundation decision remains in this Package.** Every item above is implementation/SPEC-level: each has a stated default or bound (items 1 and 3 are explicitly bounded by already-frozen invariants; items 2 and 4 have zero authority/governance surface), and none can, under any resolution, alter the authority model (Ch.05), the eligibility architecture (Ch.06), the User Knowledge record contract (Ch.09), or the Safety boundary (Ch.19).

## Repository Gaps

None. These are not missing repository evidence; they are ordinary implementation-SPEC decisions deferred to E.0.2's own future SPEC authoring (Ch.23), consistent with CARF's own precedent of freezing architecture without freezing implementation detail.

---

# 23. Implementation Sequence — E.0.2a Through E.0.2g → Phase E

## Purpose

Record the staged, independently-verifiable implementation order already approved in principle, at a non-binding-detail level — exact field/module names remain for the future implementation SPEC(s) to fix.

## Frozen Sequence

- **E.0.2a** — Policy-based provider eligibility (Ch.06), replacing `contextCeiling` as the final mechanism (transitional coexistence permitted for zero-drift verification).
- **E.0.2b** — Provider `description` metadata + Semantic Context Discovery interpreter for providers (Ch.07).
- **E.0.2c** — User Knowledge record schema foundation (Ch.09-11): `factors[]`, evidence shape, Concept Identity store — deterministic scaffolding, no AI yet.
- **E.0.2d** — Bounded relationship-candidate consolidation interpreter (Ch.14): AI-assisted, proposes candidate records from observations; testable-not-live, same rollout discipline as every prior WP0 phase (registered and fully testable before being made reachable).
- **E.0.2e** — Confound-aware evidence/confidence model + triggered consolidation pass (Ch.12).
- **E.0.2f** — Correction pathway, generalizing WP0 Phase D.5 (Ch.13).
- **E.0.2g** — Retrieval integration: User Knowledge records become the second bounded candidate catalogue inside Semantic Context Discovery (Ch.08/14).
- **Phase E** — Live activation of `GeneralReasoningCapability` (unchanged name/scope from the existing WP0 program), gated on E.0.2a-g each being independently verified, and unchanged in its own existing binding preconditions (Phase D Safety Foundation verified, `GeneralReasoningActivationGate` explicitly flipped by Product/Architecture).

## Explicit Non-Interpretations

This chapter does not authorize starting E.0.2a. Each lettered step requires its own implementation-SPEC-level design (field names, storage shape, exact policy rules) not authored by this Package.

---

# 24. Definition of Done — Architecture Foundation

This Package is done, as an architecture foundation, when:

1. All twenty invariants in Ch.04 are represented in the frozen design of Ch.05-20 — verified: yes, each invariant is cited against the specific chapter that satisfies it.
2. Every design explicitly superseded by the investigation series is named and marked, per Ch.21 — verified: yes, seven items.
3. The final User Knowledge record contract contains no closed content-adjacent field — verified: yes, self-tested in R4 and restated in Ch.09/12/20 (every closed dimension passes the "new value only for a new evidence method/governance requirement, never a new user concept" test).
4. No existing closed canonical document (CARF, SLDP, SFCD, WP0-D) is contradicted — verified: none found; CARF is explicitly extended, not restated or altered (Ch.15).
5. No production/runtime code (`js/**`, `tests/**`) is modified by this Package — verified: none.
6. Every implementation-level decision this Package does not freeze is named explicitly as open, not silently assumed — see Ch.22.
7. No unresolved Product/Architecture foundation decision remains — verified: Ch.22's four remaining items are SPEC-level only, per Ch.22's own Canonical Statement.

This Definition of Done concerns the **architecture record**, not implementation completeness — E.0.2a-g each require their own future Definition of Done at SPEC-authoring time.

---

# 25. Explicit Non-Goals — FROZEN

This Package does not: select exact Firestore collection/field names; author the E.0.2a-g implementation SPEC(s); implement, wire, or activate any of E.0.2a-g; modify `GeneralReasoningActivationGate`'s binding default; alter TRR's bespoke runtime path in any way; weaken, bypass, or make Safety dependent on User Knowledge in any way; introduce embeddings, vector search, or graph-database infrastructure (none exists in the repository today; nothing in this Package requires it — Ch.10's Concept Identity model is graph-*shaped*, not graph-database-backed); or resolve any of the four SPEC-level items in Ch.22.

---

# 26. Status and Closure

## Repository Contradiction Check

Cross-referenced against CARF (the most directly adjacent closed canonical document, governing AI reasoning invocation/output/context-ownership): no contradiction found. CARF's Ch.07 "Reasoning Context Ownership" principle — bounded, need-relevant context, never a full-profile dump, FITME as sole owner of persistent user knowledge, AI reasoning output never shown directly to the user, Safety remaining deterministic and authoritative after AI reasoning — is fully consistent with, and is the principle this Package's Ch.06-19 mechanisms concretely implement for the open-world/self-learning case CARF itself did not need to solve. No other closed canonical document (SLDP, SFCD, WP0-D) makes any claim this Package's content touches or could contradict.

## Closure

This Package is filed as **CANONICAL / CLOSED**, recording the architecture Product/Architecture approved across investigation rounds R1-R4, with the R4 `claimType` correction incorporated in full. It authorizes no implementation. WP0 Phase E.0.2a implementation SPEC authoring may begin only after a separate, explicit Product/Architecture go-ahead, per this conversation's own instruction.

---

# 27. Document History

- **v1.0** (first authoring) — Consolidates R1 (superseded), R2 (Architecture D, approved in principle), R3 (User Knowledge Layer generalization, approved in principle pending contract review), and R4 (`claimType` correction, approved) into one canonical record. Filed at repository baseline `bbe29fee5615332784c4eb772a9765fae63a1108`.
- **v1.0** (Final Canonical Closure Review revision) — Applied the Final Canonical Closure Review: (a) resolved former Ch.22 items 1 (Typed Memory storage authority) and 2 (eligibility dimensions) as frozen canonical decisions (Ch.06/09/15); (b) corrected the Safety-context vs. Safety-authority conflation (Ch.07/09/15/19) by introducing the `reasoningAccessAuthorized` eligibility dimension, so that Safety-adjacent context may reach reasoning through deterministic authorization while never through Semantic Context Discovery's own relevance judgment, and Phase D Safety remains independently unconditional; (c) rewrote Ch.22 to contain only four remaining SPEC-level items, with an explicit Canonical Statement that no unresolved Product/Architecture foundation decision remains. No production/runtime code changed.
